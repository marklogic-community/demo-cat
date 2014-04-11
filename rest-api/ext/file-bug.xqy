xquery version "1.0-ml";

module namespace file-bug = "http://marklogic.com/rest-api/resource/file-bug";

import module namespace json="http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
import module namespace json-helper="http://marklogic.com/demo-cat/json-helper" at "/lib/json-helper.xqy";

declare namespace roxy = "http://marklogic.com/roxy";

(: 
 : To add parameters to the functions, specify them in the params annotations. 
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") file-bug:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)

(:
Receive the comment and adjust it with proper values.
 :)
declare 
%roxy:params("uri=xs:string")
function file-bug:put(
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
  (: insert bug :)
  let $insert-noop := json-helper:add-to-array($uri,'bugs',$populated-xml)
  return (
    xdmp:set-response-code(200, "OK"),
    document { json:transform-to-json($populated-xml) }
  )
};

(:
deletes a bug when requested by someone who is the creator
 :)
declare 
%roxy:params("uri=xs:string","id=xs:string")
function file-bug:delete(
    $context as map:map,
    $params  as map:map
) as document-node()?
{
  map:put($context, "output-types", "application/json"),
  let $uri as xs:string := xdmp:url-decode(map:get($params,"uri"))
  let $id as xs:string := xdmp:url-decode(map:get($params,"id"))
  (: remove bug :)
  let $delete-noop := json-helper:remove-from-array($uri,'bugs',$id)
  return (
    xdmp:set-response-code(200, "OK"),
    document {"{'status':'success'}"}
  )
};
