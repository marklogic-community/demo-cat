xquery version "1.0-ml";

module namespace comment = "http://marklogic.com/rest-api/resource/comment";

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
  
  (: get input :)
  let $uri := map:get($params,"uri")
  let $msg := json:transform-from-json($input)/jbasic:msg/text()
  let $new-comment := demo:create-comment($msg)
  
  (: update demo :)
  let $demo := demo:read($uri)
  let $comments := $demo/jbasic:comments

  let $new-comments :=
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "comments")} {
      $comments/@*,
      $comments/*,
      $new-comment
    }
  let $new-demo := demo:replace($demo, $comments, $new-comments)
  let $_ := demo:save($uri, $new-demo)

  (: send notification :)
  let $_ := demo:notify-comment($uri, $new-comment)

  (: send reply :)
  return (
    xdmp:set-response-code(200, "OK"),
    document { json:transform-to-json($new-comment) }
  )
};

(:
Change a comment property value.
 TODO: FIXME!!
declare
%roxy:params("uri=xs:string","id=xs:string", "property=xs:string")
function comment:put(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()?
{
  map:put($context, "output-types", "application/json"),
  let $uri as xs:string := map:get($params,"uri")
  (: Don't urldecode the comments's ID.  The ID can have a + in it, which turns into a space. :)
  let $id as xs:string := map:get($params,"id")
  let $property as xs:string := map:get($params,"property")
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
:)

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
  
  (: get input :)
  let $uri as xs:string := map:get($params,"uri")
  let $id as xs:string := map:get($params,"id")

  (: remove comment :)
  let $demo := demo:read($uri)
  let $comments := $demo/jbasic:comments
  let $new-comments :=
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "comments")} {
      $comments/@*,
      $comments/*[jbasic:id ne $id]
    }
  let $new-demo := demo:replace($demo, $comments, $new-comments)
  let $_ := demo:save($uri, $new-demo)
  
  (: send reply :)
  return (
    xdmp:set-response-code(200, "OK"),
    document {'{"status":"success"}'}
  )
};
