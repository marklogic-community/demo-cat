xquery version "1.0-ml";

module namespace file-bug = "http://marklogic.com/rest-api/resource/file-bug";

import module namespace json="http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
import module namespace json-helper="http://marklogic.com/demo-cat/json-helper" at "/lib/json-helper.xqy";
import module namespace utilities="http://marklogic.com/demo-cat/utilities" at "/lib/utilities.xqy";

declare namespace roxy = "http://marklogic.com/roxy";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

(:
 : To add parameters to the functions, specify them in the params annotations.
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") file-bug:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)

(:
Receive the bug and adjust it with proper values.
 :)
declare
%roxy:params("uri=xs:string")
function file-bug:post(
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
  (: BEGIN send notification :)
  (: get demo info :)
  let $demo := fn:doc($uri)/jbasic:json
  (: get maintainer name :)
  let $demo-name as xs:string? := $demo/jbasic:name
  (: get maintainer name :)
  let $maintainer-name as xs:string? := $demo/jbasic:maintainer
  (: get maintainer email :)
  let $maintainer-email as xs:string? := $demo/jbasic:email
  (: build message :)
  let $message :=
    <div xmlns="http://www.w3.org/1999/xhtml">
      <h2>New Bug for "<a href="http://{xdmp:get-request-header('Host')}/detail?uri={xdmp:url-encode($uri)}">{$demo-name}</a>"</h2>
      <p>Opened by {$populated-xml/jbasic:username/node()}</p>
      <div>{$populated-xml/jbasic:msg/node()}</div>
    </div>
  return (
    utilities:send-notification($maintainer-name, $maintainer-email, '[DemoCat] New Bug for "'||$demo-name||'"', $message),
    xdmp:set-response-code(200, "OK"),
    document { json:transform-to-json($populated-xml) }
  )
};

(:
Change a bug property value.
 :)
declare
%roxy:params("uri=xs:string","id=xs:string", "property=xs:string")
function file-bug:put(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()?
{
  map:put($context, "output-types", "application/json"),
  let $uri as xs:string := xdmp:url-decode(map:get($params,"uri"))
  (: Don't urldecode the bug's ID.  The ID can have a + in it, which turns into a space. :)
  let $id as xs:string := map:get($params,"id")
  let $property as xs:string := xdmp:url-decode(map:get($params,"property"))
  let $value as xs:string := map:get(xdmp:from-json(fn:string($input)),"value")
  (: build property qn :)
  let $property-qn := fn:QName($json-helper:JSON_NS,$property)
  (: find bug property :)
  let $property-to-be-updated := json-helper:find-in-array($uri,'bugs',$id)/*[fn:node-name(.) eq $property-qn]
  (: create property with new value :)
  let $new-property := json-helper:set-element-value($property-to-be-updated,$value)
  return (
    xdmp:node-replace($property-to-be-updated,$new-property),
    xdmp:set-response-code(200, "OK"),
    document {'{"status":"success"}'}
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
    document {'{"status":"success"}'}

  )
};
