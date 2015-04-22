xquery version "1.0-ml";

module namespace comment = "http://marklogic.com/rest-api/resource/comment";

import module namespace json="http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
import module namespace json-helper="http://marklogic.com/demo-cat/json-helper" at "/lib/json-helper.xqy";
import module namespace utilities="http://marklogic.com/demo-cat/utilities" at "/lib/utilities.xqy";

declare namespace roxy = "http://marklogic.com/roxy";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";
declare namespace rapi = "http://marklogic.com/rest-api";

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
%rapi:transaction-mode("update")
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
  (: BEGIN send notification :)
  (: get demo info :)
  let $demo := fn:doc($uri)/jbasic:json
  (: get demo name :)
  let $demo-name as xs:string? := $demo/jbasic:name
  (: get business owner name :)
  let $biz-owner-name as xs:string? := $demo/jbasic:persons/jbasic:json[jbasic:role = "Business Owner"]/jbasic:name
  (: get business owner email :)
  let $biz-owner-email as xs:string? := $demo/jbasic:persons/jbasic:json[jbasic:role = "Business Owner"]/jbasic:email
  (: get referring host :)
  let $host := utilities:get-referring-host()
  (: build message :)
  let $message :=
    <div xmlns="http://www.w3.org/1999/xhtml">
      <h2>New Comment for "<a href="http://{$host}/detail?uri={xdmp:url-encode($uri)}">{$demo-name}</a>"</h2>
      <p>Created by {$populated-xml/jbasic:username/node()}</p>
      <div>{$populated-xml/jbasic:msg/node()}</div>
    </div>

  return (
    utilities:send-notification($biz-owner-name, $biz-owner-email, '[DemoCat] New Comment for "'||$demo-name||'"', $message),
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
  (: Don't urldecode the comments's ID.  The ID can have a + in it, which turns into a space. :)
  let $id as xs:string := map:get($params,"id")
  let $property as xs:string := xdmp:url-decode(map:get($params,"property"))
  let $value as xs:string := map:get(xdmp:from-json(fn:string($input)),"value")
  (: build property qn :)
  let $property-qn := fn:QName($json-helper:JSON_NS,$property)
  (: find comment property :)
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
