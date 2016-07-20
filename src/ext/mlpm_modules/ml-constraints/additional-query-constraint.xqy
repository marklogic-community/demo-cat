xquery version "1.0-ml";

module namespace facet = "http://marklogic.com/additional-query-constraint";

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
    for $term in $terms
    return
      <searchdev:tok type="term">{ $term }</searchdev:tok>
  )
  let $query := impl:parse($toks, $real-options, 0)
  
  (: get raw additional query :)
  let $additional-query := $constraint/search:annotation/search:additional-query/*

  (: combine parse result with additional-query :)
  return <cts:and-query>{
    $additional-query,
    $query
  }</cts:and-query>
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
  (: combine provided $query with possible additional-query from $constraint :)
  let $combined-query := facet:_get-combined-query( $query, $constraint )
  (: pull real constraint def from annotation :)
  let $real-constraint := facet:_get-real-constraint( $constraint )
  
  (: and loop through to search impl for start-facet :)
  let $buckets := 
    if ( $real-constraint/opt:range[opt:bucket|opt:computed-bucket] ) then
      impl:resolve-buckets($real-constraint)
    else ()
  return
    impl:start-facet(
      $real-constraint,
      $buckets,
      document{$combined-query}/*,
      $quality-weight, 
      $forests
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
  (: combine provided $query with possible additional-query from $constraint :)
  let $combined-query := facet:_get-combined-query( $query, $constraint )
  (: pull real constraint def from annotation :)
  let $real-constraint := facet:_get-real-constraint( $constraint )

  (: and loop through to search impl for start-facet :)
  let $buckets := 
    if ( $real-constraint/opt:range[opt:bucket|opt:computed-bucket] ) then
      impl:resolve-buckets($real-constraint)
    else ()
  return
    impl:finish-facet(
      $real-constraint,
      $buckets,
      $start,
      document{$combined-query}/*,
      $quality-weight,
      $forests
    )
};

declare private function facet:_get-combined-query(
  $query as cts:query?,
  $constraint as element(search:constraint)
)
  as cts:query*
{
  let $queries := (
    $query,
    $constraint/search:annotation/search:additional-query/*/cts:query(.)
  )
  return
    if ( count($queries) gt 1 ) then
      cts:and-query($queries)
    else
      $queries
};

declare private function facet:_get-real-constraint(
  $constraint as element(search:constraint)
)
  as element(opt:constraint)
{
  element opt:constraint {
    $constraint/@*,
    
    for $node in $constraint/search:annotation/*[ empty( self::search:additional-query ) ]
    return
      element { node-name($node) } {
        $node/@*,
        $node/node()
      }
  }
};
