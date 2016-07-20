xquery version "1.0-ml";

module namespace facet = "http://marklogic.com/grouping-constraint";

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
  let $fragments :=
    if ($constraint/*/search:facet-option = 'any') then
      ('document', 'locks', 'properties')
    else
      $constraint/*/search:facet-option[. = ('document', 'locks', 'properties')]/string(.)

  (: get grouping config from annotation :)
  let $config := facet:_get-config( $constraint )
  let $groups := facet:_get-groups( $config )
  
  (: check if $terms matches any group :)
  let $matching-groups :=
    if ($terms = $config/search:show-remainder/@label) then
      $groups
    else
      $groups[@label = $terms]
  
  return
    if (empty($matching-groups)) then
      let $log-warning := xdmp:log(concat("No group name(s) matching: '", string-join($terms, "', '"), "'"))
      return <cts:or-query/> (: nothing will match :)
    else
  
      (: pull real constraint def from annotation :)
      let $real-constraint := facet:_get-real-constraint( $constraint )

      (: loop through to search impl to derive index reference from $real-constraint :)
      let $reference := impl:construct-reference(impl:get-refspecs($real-constraint))
  
      (: use patterns to pull search values from lexicons :)
      let $values :=
        for $pattern in $matching-groups/search:match/@pattern
        return cts:value-match($reference, $pattern)

      return
        if (exists($values)) then

          (: reconstruct full options, but with $real-constraint :)
          let $real-options :=
            element { node-name($options) } {
              $options/@*,
              $options/node()[@name != $constraint-name],
              $real-constraint
            }
  
          (: loop through to search impl for parse (passing through tokens, because we jump into processing of the AST) :)
          let $toks := (
            <searchdev:tok type="term">{ $constraint-name }</searchdev:tok>,
            <searchdev:tok type="joiner"><search:joiner strength="50" apply="constraint">:</search:joiner></searchdev:tok>,
            (: this pretends a string query, so we inject a fake value, which gets replaced later :)
            <searchdev:tok type="term">##$$@@FAKEVALUE##$$@@</searchdev:tok>
          )
          let $query := impl:parse($toks, $real-options, 0)
          let $values-query := facet:_insert-values(document{$query}/*, $values)
          let $real-query :=
            if ($terms = $config/search:show-remainder/@label) then
              <cts:not-query>{ $values-query }</cts:not-query>
            else
              $values-query
          return
            <cts:or-query>{
              for $fragment in $fragments
              return element { xs:QName("cts:" || $fragment || "-fragment-query") } {
                $real-query
              }
            }</cts:or-query>

        else (: no values :)
          if ($terms = $config/search:show-remainder/@label) then
            <cts:and-query/> (: no anti-values, so everything will match :)
          else
            <cts:or-query/> (: no values, so nothing will match :)
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
  (: pull real constraint def from annotation :)
  let $real-constraint := facet:_get-real-constraint( $constraint )

  (: get grouping config from annotation :)
  let $config := facet:_get-config( $constraint )
  
  (: isolate limit from $facet-options:)
  let $limit := xs:int(
    substring-after(
      ($facet-options, "limit=10")[starts-with(., "limit=")][1],
      "="
    )
  )
  let $facet-options := $facet-options[not(starts-with(., "limit="))]

  (: loop through to search impl to derive index reference from $real-constraint :)
  let $reference := impl:construct-reference(impl:get-refspecs($real-constraint))

  (: calculate facet counts :)
  return (
    let $groups := facet:_get-groups($config)

    (: go over all groups :)
    for $group in ($groups, $config/search:show-remainder)
    let $label as xs:string := ($group/@label, "(missing label)")[1]
    let $show-remainder := $group instance of element(search:show-remainder)
    let $sum :=
      if ($show-remainder) then
        let $overall-sum := xdmp:estimate(
          cts:search(collection(),
            $query,
            ("unfaceted"),
            $quality-weight,
            $forests
          )
        )
        
        let $anti-sum := sum(
          for $group in $groups
          for $anti-pattern in $group/search:match/@pattern
          return
            for $anti-value in cts:value-match(
              $reference,
              $anti-pattern,
              ("concurrent", $facet-options),
              $query,
              $quality-weight,
              $forests
            )
            return cts:frequency($anti-value)
        )
        
        return $overall-sum - $anti-sum
      
      else
      
        sum(
          for $pattern in $group/search:match/@pattern
          for $value in cts:value-match(
            $reference,
            $pattern,
            ("concurrent", $facet-options),
            $query,
            $quality-weight,
            $forests
          )
          return cts:frequency($value)
        )
        
    where $sum gt 0
    order by $sum descending
    return
      <search:facet-value name="{$label}" count="{$sum}">{$label}</search:facet-value>
  )[1 to $limit]
};

(:
<finish> function to apply for custom contraint [Document Type].
:)
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
  <search:facet name="{$constraint/@name}" type="custom">{
    $start
  }</search:facet>
};

declare private function facet:_get-real-constraint(
  $constraint as element(search:constraint)
)
  as element(opt:constraint)
{
  element opt:constraint {
    $constraint/@*,
    
    for $node in $constraint/search:annotation/*[ empty( self::search:config ) ]
    return
      element { node-name($node) } {
        $node/@*,
        $node/node()
      }
  }
};

declare private function facet:_get-config(
  $constraint as element(search:constraint)
)
  as element(search:config)?
{
  $constraint/search:annotation/search:config
};


declare private function facet:_get-groups(
  $config as element(search:config)?
)
as element(search:group)*
{
  $config/search:group
};

declare private function facet:_match-group-by-value(
  $config as element(search:config)?,
  $value as xs:string
)
  as element()?
{
  let $group := (
    for $group in facet:_get-groups($config)
    let $label := $group/@label
      for $pattern in $group/search:match/@pattern
      let $match-pattern := replace($pattern, "*", ".*")
      return
        if ( matches($value, $match-pattern) ) then
          $group
        else (),
    $config/search:show-remainder
  )[1]

  return $group
};

declare private function facet:_insert-values(
  $query as node()*,
  $values as xs:string*
)
  as node()*
{
  for $node in $query
  return typeswitch ($node)
  
    (: replace fake value, and expand according to $values :)
    case schema-element(cts:text)
    return
      facet:_expand-element(
        $node,
        $values
      )
    case element(cts:value)
    return
      facet:_expand-element(
        $node,
        $values
      )
    case schema-element(cts:uri)
    return
      facet:_expand-element(
        $node,
        $values
      )
    
    (: recursive descend :)
    case element()
    return
      facet:_copy-element(
        $node,
        facet:_insert-values($node/node(), $values)
      )
    
    (: fall-through for non-elements :)
    default return $node
};

declare private function facet:_expand-element(
  $elem as element(),
  $values as item()*
)
  as element()*
{
  for $value in $values
  return
    facet:_copy-element(
      $elem,
      $value
    )
};

declare private function facet:_copy-element(
  $elem as element(),
  $contents as item()*
)
  as element()
{
  element { node-name($elem) } {
    $elem/@*,
    $elem/namespace::*,
    $contents
  }
};