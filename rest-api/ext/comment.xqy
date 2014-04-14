xquery version "1.0-ml";

module namespace comment = "http://marklogic.com/rest-api/resource/comment";

import module namespace json="http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
import module namespace json-helper="http://marklogic.com/demo-cat/json-helper" at "/lib/json-helper.xqy";

declare namespace roxy = "http://marklogic.com/roxy";

(: 
 : To add parameters to the functions, specify them in the params annotations. 
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") comment:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)


(:
Receive the comment and adjust it with proper values.
 :)
declare 
%roxy:params("uri=xs:string")
function comment:post(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()?
{
  map:put($context, "output-types", "application/json"),
  (: get 'input-types' to use in content negotiation :)
  let $input-types := map:get($context,"input-types")
  let $uri := xdmp:url-decode(map:get($params,"uri"))
  let $negotiate := 
      if ($input-types = ("application/json"))
      then () (: process, insert/update :) 
      else error((),"ACK",
        "Invalid type, accepts application/json only")
  let $json-xml := json:transform-from-json(fn:string($input))
  (: populate default meta information :)
  let $populated-xml as element() := json-helper:populate-meta-fields($json-xml)
  (: insert comment :)
  let $insert-noop := json-helper:add-to-array($uri,'comments',$populated-xml)
  return (
    xdmp:set-response-code(200, "OK"),
    document { json:transform-to-json($populated-xml) }
  )
};

(:
Change a comment property value.
 :)
declare 
%roxy:params("uri=xs:string","id=xs:string", "property=xs:string")
function comment:put(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()?
{
  map:put($context, "output-types", "application/json"),
  let $uri as xs:string := xdmp:url-decode(map:get($params,"uri"))
  let $id as xs:string := xdmp:url-decode(map:get($params,"id"))
  let $property as xs:string := xdmp:url-decode(map:get($params,"property"))
  let $value as xs:string := fn:string($input)
  (: build property qn :)
  let $property-qn := fn:QName($json-helper:JSON_NS,$property)
  (: find bug property :)
  let $property-to-be-updated := json-helper:find-in-array($uri,'comments',$id)/*[fn:node-name(.) eq $property-qn]
  (: create property with new value :)
  let $new-property := json-helper:set-element-value($property-to-be-updated,$value)
  return (
    xdmp:node-replace($property-to-be-updated,$new-property),
    xdmp:set-response-code(200, "OK"),
    document {'{"status":"success"}'}
  )
};

(:
deletes a comment when requested by someone who is the creator
 :)
declare 
%roxy:params("uri=xs:string","id=xs:string")
function comment:delete(
    $context as map:map,
    $params  as map:map
) as document-node()?
{
  map:put($context, "output-types", "application/json"),
  let $uri as xs:string := xdmp:url-decode(map:get($params,"uri"))
  let $id as xs:string := xdmp:url-decode(map:get($params,"id"))
  (: remove bug :)
  let $delete-noop := json-helper:remove-from-array($uri,'comments',$id)
  return (
    xdmp:set-response-code(200, "OK"),
    document {'{"status":"success"}'}

  )
};