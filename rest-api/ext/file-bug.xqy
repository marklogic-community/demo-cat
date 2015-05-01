xquery version "1.0-ml";

module namespace file-bug = "http://marklogic.com/rest-api/resource/file-bug";

import module namespace json="http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
import module namespace json-helper="http://marklogic.com/demo-cat/json-helper" at "/lib/json-helper.xqy";

import module namespace demo = "http://marklogic.com/demo-cat/demo-model"
  at "/lib/demo-model.xqy";

declare namespace roxy = "http://marklogic.com/roxy";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";
declare namespace rapi = "http://marklogic.com/rest-api";

declare option xdmp:mapping "false";

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
%rapi:transaction-mode("update")
function file-bug:post(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()?
{
  map:put($context, "output-types", "application/json"),
  
  (: get input :)
  let $uri := map:get($params,"uri")
  let $nr := json:transform-from-json($input)/jbasic:nr/text()
  let $msg := json:transform-from-json($input)/jbasic:msg/text()
  let $browser := json:transform-from-json($input)/jbasic:browser/text()
  let $status := json:transform-from-json($input)/jbasic:status/text()
  let $type := json:transform-from-json($input)/jbasic:type/text()
  let $assignee := json:transform-from-json($input)/jbasic:assignee/text()

  let $new-bug := demo:create-bug($nr, $msg, $browser, $status, $type, $assignee)
  
  (: update demo :)
  let $demo := demo:read($uri)
  let $bugs := $demo/jbasic:bugs

  let $new-bugs :=
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "bugs")} {
      $bugs/@*,
      $bugs/*,
      $new-bug
    }
  let $new-demo := demo:replace($demo, $bugs, $new-bugs)
  let $_ := demo:save($uri, $new-demo)

  (: send notification :)
  let $_ := demo:notify-bug($uri, $new-bug)

  (: send reply :)
  return (
    xdmp:set-response-code(200, "OK"),
    document { json:transform-to-json($new-bug) }
  )
};

(:
Change a bug property value.
 TODO: FIXME!!
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
  (: find bug and property :)
  let $bug-to-be-updated := json-helper:find-in-array($uri,'bugs',$id)
  let $property-to-be-updated := $bug-to-be-updated/*[fn:node-name(.) eq $property-qn]
  let $update-noop :=
    if (fn:exists($property-to-be-updated))
    then
      (: create property with new value and node-replace it :)
      let $new-property := json-helper:set-element-value($property-to-be-updated,$value)
      return xdmp:node-replace($property-to-be-updated,$new-property)
    else
      (: We're adding a new field that the bug doesn't have yet.  :)
      let $add-property :=
        element {$property-qn} { attribute type {"string"}, $value }
      return xdmp:node-insert-child($bug-to-be-updated,$add-property)
  return (
    xdmp:set-response-code(200, "OK"),
    document {'{"status":"success"}'}
  )
};
:)

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
  
  (: get input :)
  let $uri as xs:string := map:get($params,"uri")
  let $id as xs:string := map:get($params,"id")

  (: remove bug :)
  let $demo := demo:read($uri)
  let $bugs := $demo/jbasic:bugs
  let $new-bugs :=
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "bugs")} {
      $bugs/@*,
      $bugs/*[jbasic:id ne $id]
    }
  let $new-demo := demo:replace($demo, $bugs, $new-bugs)
  let $_ := demo:save($uri, $new-demo)
  
  (: send reply :)
  return (
    xdmp:set-response-code(200, "OK"),
    document {'{"status":"success"}'}
  )
};
