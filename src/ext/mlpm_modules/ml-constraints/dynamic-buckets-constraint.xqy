xquery version "1.0-ml";

module namespace facet = "http://marklogic.com/dynamic-buckets-constraint";

import module namespace impl = "http://marklogic.com/appservices/search-impl" at "/MarkLogic/appservices/search/search-impl.xqy";
import schema namespace opt = "http://marklogic.com/appservices/search" at "search.xsd";

declare namespace search = "http://marklogic.com/appservices/search";
declare namespace searchdev = "http://marklogic.com/appservices/search/searchdev";
declare default function namespace "http://www.w3.org/2005/xpath-functions";

declare option xdmp:mapping "false";

declare function facet:parse-structured(
  $query-elem as element(),
  $options as element(search:options)
)
  as schema-element(cts:query)
{
  (: pull parameters from $query-elem :)
  let $constraint-name as xs:string := $query-elem/search:constraint-name
  let $terms as xs:string* := $query-elem//(search:text, search:value)

  (: take appropriate constraint from full $options :)
  let $constraint := $options/search:constraint[@name eq $constraint-name]
  
  (: pull real constraint def from annotation :)
  let $real-constraint := facet:_get-real-constraint( $constraint )
  let $isDateConstraint := $real-constraint/search:range/@type = (xs:QName('xs:date'), xs:QName('xs:dateTime'))
  let $isDateTimeConstraint := $real-constraint/search:range/@type = xs:QName('xs:dateTime')

  let $buckets :=
    if ($isDateConstraint) then
      for $term in $terms
      let $label := $term

      let $start :=
        (: > year :)
        if (matches($term, "^>\d\d\d\d$")) then
          xs:date(xs:gYear(substring($term,2))) + xs:yearMonthDuration("P1Y")
        (: ≥ year :)
        else if (matches($term, "^≥\d\d\d\d$")) then
          xs:date(xs:gYear(substring($term,2)))
        (: one year :)
        else if (matches($term, "^\d\d\d\d$")) then
          xs:date(xs:gYear($term))
        (: one year-month :)
        else if (matches($term, "^\d\d\d\d-\d\d$")) then
          xs:date(xs:gYearMonth($term))
        (: one date :)
        else if (matches($term, "^\d\d\d\d-\d\d-\d\d$")) then
          xs:date($term)
        (: year range :)
        else if (matches($term, "^\d\d\d\d-\d\d\d\d$")) then
          xs:date(xs:gYear(substring-before($term, '-')))
        (: year-month range :)
        else if (matches($term, "^\d\d\d\d-\d\d-\d\d\d\d-\d\d$")) then
          xs:date(xs:gYearMonth(substring($term, 1, 7)))
        (: date range :)
        else if (matches($term, "^\d\d\d\d-\d\d-\d\d-\d\d\d\d-\d\d-\d\d$")) then
          xs:date(substring($term, 1, 10))
        else ()

      let $end :=
        (: < year :)
        if (matches($term, "^<\d\d\d\d$")) then
          xs:date(xs:gYear(substring($term,2)))
        (: ≤ year :)
        else if (matches($term, "^≤\d\d\d\d$")) then
          xs:date(xs:gYear(substring($term,2))) + xs:yearMonthDuration("P1Y")
        (: one year :)
        else if (matches($term, "^\d\d\d\d$")) then
          $start + xs:yearMonthDuration("P1Y")
        (: one year-month :)
        else if (matches($term, "^\d\d\d\d-\d\d$")) then
          $start + xs:yearMonthDuration("P1M")
        (: one date :)
        else if (matches($term, "^\d\d\d\d-\d\d-\d\d$")) then
          $start + xs:dayTimeDuration("P1D")
        (: year range :)
        else if (matches($term, "^\d\d\d\d-\d\d\d\d$")) then
          xs:date(xs:gYear(substring-after($term, '-'))) + xs:yearMonthDuration("P1Y")
        (: year-month range :)
        else if (matches($term, "^\d\d\d\d-\d\d-\d\d\d\d-\d\d$")) then
          xs:date(xs:gYearMonth(substring($term, 9))) + xs:yearMonthDuration("P1M")
        (: date range :)
        else if (matches($term, "^\d\d\d\d-\d\d-\d\d-\d\d\d\d-\d\d-\d\d$")) then
          xs:date(substring($term, 12)) + xs:dayTimeDuration("P1D")
        else ()

      (: type case $start/$end to match index type :)
      let $start :=
        if (exists($start) and $isDateTimeConstraint) then
          xs:dateTime($start)
        else $start
      let $end :=
        if (exists($end) and $isDateTimeConstraint) then
          xs:dateTime($end)
        else $end

      where exists($start) or exists($end)
      return
        element opt:bucket {
          if (exists($start)) then attribute ge {$start} else (),
          if (exists($end)) then attribute lt {$end} else (),
          attribute name { $label },
          $label
        }

    else ()

  (: reconstruct full options, but with $real-constraint+buckets :)
  let $real-options :=
    element { node-name($options) } {
      $options/@*,
      $options/node()[@name != $constraint-name],
      element { node-name($real-constraint) } {
        $real-constraint/@*,
        $real-constraint/(node() except search:range),
        element { node-name($real-constraint/search:range) } {
          $real-constraint/search:range/@*,
          $real-constraint/search:range/node(),
          $buckets
        }
      }
    }

  (: loop through to search impl for parse (passing through tokens, because we jump into processing of the AST) :)
  let $toks := (
    <searchdev:tok type="term">{ $constraint-name }</searchdev:tok>,
    <searchdev:tok type="joiner"><search:joiner strength="50" apply="constraint">:</search:joiner></searchdev:tok>,
    for $term in $terms
    return
      <searchdev:tok type="term">{ $term }</searchdev:tok>
  )
  let $query := impl:parse($toks, $real-options, 0)

  return document{$query}/*
};

declare function facet:start(
  $constraint as element(search:constraint),
  $query as cts:query?,
  $facet-options as xs:string*,
  $quality-weight as xs:double?,
  $forests as xs:unsignedLong*
)
  as item()*
{
  (: get bucket config from annotation :)
  let $nr-buckets as xs:int := ($constraint/search:annotation/facet:config/facet:nr-buckets, 10)[1]
  let $threshold as xs:int := ($constraint/search:annotation/facet:config/facet:threshold, 0)[1]
  let $abs-min := ($constraint/search:annotation/facet:config/facet:min)[1]
  let $abs-max := ($constraint/search:annotation/facet:config/facet:max)[1]

  (: pull real constraint def from annotation :)
  let $real-constraint := facet:_get-real-constraint( $constraint )
  let $isDateConstraint := $real-constraint/search:range/@type = (xs:QName('xs:date'), xs:QName('xs:dateTime'))
  let $isDateTimeConstraint := $real-constraint/search:range/@type = xs:QName('xs:dateTime')

  (: loop through to search impl to derive index reference from $real-constraint :)
  let $reference := impl:construct-reference(impl:get-refspecs($real-constraint))

  (: get min/max from index :)
  let $max := cts:max($reference, $facet-options, $query, $forests)
  let $min := cts:min($reference, $facet-options, $query, $forests)
  
  (: calculate buckets :)
  let $buckets :=
    if ($isDateConstraint) then
      let $max :=
        if ($isDateTimeConstraint) then
          xs:date($max) + xs:dayTimeDuration("P1D") (: round up because of partial days :)
        else
          xs:date($max)
      let $min := xs:date($min)
      return
      if (year-from-date($min) eq year-from-date($max)) then
        if (month-from-date($min) eq month-from-date($max)) then
          if ($isDateTimeConstraint) then

            (: apply day buckets in case of dateTime, with minimum of 1 bucket :)
            let $last := max(( ($max - $min) div xs:dayTimeDuration("P1D"), 1 ))
            for $i in (1 to $last)
            let $end := xs:dateTime($min + xs:dayTimeDuration(concat("P", $i, "D")))
            let $start := xs:dateTime($end - xs:dayTimeDuration("P1D"))
            let $label := format-dateTime($start,"[Y0001]-[M01]-[D01]")
            return
              element opt:bucket {
                if ($i ne 1) then
                  attribute ge {$start}
                else (),
                if ($i ne $last) then
                  attribute lt {$end}
                else (),
                attribute name { $label },
                $label
              }

          (: no need for day buckets with xs:date :)
          else ()

        else
          let $year := xs:gYear(format-number(year-from-date($min),"0000"))

          for $i in (1 to 12)
          let $end := xs:date($year) + xs:yearMonthDuration(concat("P", $i, "M"))
          let $start := $end - xs:yearMonthDuration("P1M")
          let $label := concat($year, '-', format-number($i, "00"))

          (: type case $start/$end to match index type :)
          let $start :=
            if (exists($start) and $isDateTimeConstraint) then
              xs:dateTime($start)
            else $start
          let $end :=
            if (exists($end) and $isDateTimeConstraint) then
              xs:dateTime($end)
            else $end

          return
            element opt:bucket {
              if ($i ne 1) then
                attribute ge {$start}
              else (),
              if ($i ne 12) then
                attribute lt {$end}
              else (),
              attribute name { $label },
              $label
            }
      else
        let $min-year := max((year-from-date($min), $abs-min/xs:integer(.)))
        let $max-year := min((year-from-date($max), $abs-max/xs:integer(.)))

        for $year in ($min-year to $max-year)
        let $start := xs:date(xs:gYear(format-number($year, "0000")))
        let $end := $start + xs:yearMonthDuration("P1Y")
        let $label :=
          if ($year eq $min-year and $min-year eq $abs-min and $abs-min gt year-from-date($min)) then
            "≤" || $year
          else if ($year eq $max-year and $max-year eq $abs-max and $abs-max lt year-from-date($max)) then
            "≥" || $year
          else
            $year

        (: type case $start/$end to match index type :)
        let $start :=
          if (exists($start) and $isDateTimeConstraint) then
            xs:dateTime($start)
          else $start
        let $end :=
          if (exists($end) and $isDateTimeConstraint) then
            xs:dateTime($end)
          else $end

        return
          element opt:bucket {
            if ($year ne $min-year) then
              attribute ge {$start}
            else (),
            if ($year ne $max-year) then
              attribute lt {$end}
            else (),
            attribute name { $label },
            $label
          }
    else
      let $bucket-size := ($max - $min) div $nr-buckets

      for $i in (1 to $nr-buckets)
      let $end := $min + $i * $bucket-size
      let $start := $end - $bucket-size
      let $label := $start || " - " || $end
      return
        element opt:bucket {
          if ($i ne 1) then
            attribute ge {$start}
          else (),
          if ($i ne $nr-buckets) then
            attribute lt {$end}
          else (),
          attribute name { $label },
          $label
        }

  let $bucketed-constraint :=
    element opt:options {
      $constraint/root()/(* except search:constraint[@name = $constraint/@name]),
      element { node-name($real-constraint) } {
        $real-constraint/@*,
        $real-constraint/(node() except search:range),
        element { node-name($real-constraint/search:range) } {
          $real-constraint/search:range/@*,
          $real-constraint/search:range/node(),
          $buckets
        }
      }
    }/search:constraint[@name = $constraint/@name]
  
  (: and loop through to search impl for start-facet :)
  let $resolved-buckets := if ($buckets) then impl:resolve-buckets($bucketed-constraint) else ()
  return (
    $bucketed-constraint,
    impl:start-facet(
      $bucketed-constraint,
      $resolved-buckets,
      $query,
      $quality-weight, 
      $forests
    )
  )
};

declare function facet:finish(
  $start as item()*,
  $constraint as element(search:constraint), 
  $query as cts:query?,
  $facet-options as xs:string*,
  $quality-weight as xs:double?, 
  $forests as xs:unsignedLong*
)
  as element(search:facet)
{

  (: grab bucketed-constraint from $start :)
  let $bucketed-constraint := $start[1]
  let $real-start := subsequence($start, 2)

  (: and loop through to search impl for start-facet :)
  let $finish :=
    impl:finish-facet(
      $bucketed-constraint,
      if ($bucketed-constraint/search:range/search:bucket) then impl:resolve-buckets($bucketed-constraint) else (),
      $real-start,
      $query,
      $quality-weight,
      $forests
    )
  return element { node-name($finish) } {
    $finish/(@* except @type),
    attribute type { 'custom' },
    $finish/node()
  }
};

declare private function facet:_get-real-constraint(
  $constraint as element(search:constraint)
)
  as element(opt:constraint)
{
  element opt:constraint {
    $constraint/@*,
    
    for $node in $constraint/search:annotation/*[ empty( self::search:additional-query ) and empty( self::facet:* ) ]
    return
      element { node-name($node) } {
        $node/@*,
        $node/node()
      }
  }
};
