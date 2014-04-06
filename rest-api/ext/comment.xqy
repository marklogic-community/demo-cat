xquery version "1.0-ml";

module namespace comment = "http://marklogic.com/rest-api/resource/comment";

import module namespace json="http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";

declare namespace roxy = "http://marklogic.com/roxy";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

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
function comment:put(
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
  let $username := xdmp:get-request-username()
  let $dateTime := fn:current-dateTime()
  let $json-xml := json:transform-from-json(fn:string($input))
  let $populated-xml := comment:populate-proper-fields($json-xml,$username,$dateTime)
  let $comments-section as element(jbasic:comments) := fn:doc($uri)/jbasic:json/jbasic:comments
  let $insert-noop := xdmp:node-insert-child($comments-section,$populated-xml)
  return (
    xdmp:set-response-code(200, "OK"),
    document { json:transform-to-json($populated-xml[xdmp:log(.),fn:true()]) }
  )
};


declare 
%private 
function comment:populate-proper-fields(
  $node as node(),
  $username as xs:string,
  $dateTime as xs:dateTime 
) as node()* {
  typeswitch ($node)
  case document-node() return
    document {
      (: Using function mapping here! :)
      comment:populate-proper-fields(
        $node/*,
        $username,
        $dateTime
      )
    }
  case element(jbasic:dateTime) return
    comment:set-element-value(
      $node,
      $dateTime
    )
  case element(jbasic:username) return
    comment:set-element-value(
      $node,
      $username
    )
  case element() return
    element {fn:node-name($node)} {
      $node/@*,
      (: Using function mapping here! :)
      comment:populate-proper-fields(
        $node/node(),
        $username,
        $dateTime
      )
    }
  default return
    $node
};

declare 
%private 
function comment:set-element-value(
  $element as element(),
  $value as xs:anyAtomicType
) as element() {
  element {fn:node-name($element)} {
    $element/@* except $element/@type,
    attribute type {
      comment:get-type-name($value)
    },
    $value
  }
};

declare  
%private 
function comment:get-type-name( 
  $value as item()
) as xs:string {
    typeswitch($value)
    case  xs:decimal  return "number" 
    case  xs:float  return "number" 
    case  xs:double  return "number" 
    case  xs:boolean return "boolean"
    case  map:map return "object" 
    case  json:array return "array"
    default return "string"    
};