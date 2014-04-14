xquery version "1.0-ml";

module namespace json-helper = "http://marklogic.com/demo-cat/json-helper";

import module namespace json="http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";

declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare variable $JSON_NS as xs:string := "http://marklogic.com/xdmp/json/basic";

declare 
function json-helper:remove-from-array(
  $doc-uri as xs:string,
  $json-array-name as xs:string,
  $json-id as xs:string
) as empty-sequence() {
  (: get current username :)
  let $username as xs:string := xdmp:get-request-username()
  (: find the array section in the database :)
  let $array-item as element()? := json-helper:find-in-array($doc-uri,$json-array-name,$json-id)
  return 
    if ($array-item/jbasic:username ne $username)
    then
      (: throw an error if someone other than the owner tries to delete the object :)
      fn:error(
        (),
        "ITEM NOT FOUND", 
        ("doc-uri="||$doc-uri,"array-name="||$json-array-name, "object-id="||$json-id,"current-user="||$username,"auth-user="||$array-item/jbasic:username/fn:string())
      )
    else if (fn:exists($array-item))
    then
      (: delete the node if it exists :)
      xdmp:node-delete($array-item)
    else
      (: throw an error if the object doesn't exist :)
      fn:error((),"ITEM NOT FOUND", ("doc-uri="||$doc-uri,"array-name="||$json-array-name, "object-id="||$json-id))
};

declare 
function json-helper:find-in-array(
  $doc-uri as xs:string,
  $json-array-name as xs:string,
  $json-id as xs:string
) as empty-sequence() {
  (: build the xs:QName for the array :)
  let $array-qn as xs:QName := fn:QName($JSON_NS,$json-array-name)
  (: find the array section in the database :)
  return fn:doc($doc-uri)/jbasic:json/*[fn:node-name(.) eq $array-qn][@type eq "array"]/jbasic:json[jbasic:id eq $json-id]
};

declare 
function json-helper:add-to-array(
  $doc-uri as xs:string,
  $json-array-name as xs:string,
  $json-xml as element()
) as empty-sequence() {
  (: build the xs:QName for the array :)
  let $array-qn as xs:QName := fn:QName($JSON_NS,$json-array-name)
  (: find the array section in the database :)
  let $array-section as element()? := fn:doc($doc-uri)/jbasic:json/*[fn:node-name(.) eq $array-qn][@type eq "array"]
  (: insert the json xml that has added the meta info to the array section :)
  return 
    if (fn:exists($array-section))
    then
      xdmp:node-insert-child($array-section,$json-xml)
    else
      fn:error((),"ARRAY NOT FOUND", ("doc-uri="||$doc-uri,"array-name="||$json-array-name))
};

declare 
function json-helper:populate-meta-fields(
  $node as node()
) as node()* {
  json-helper:populate-proper-fields(
    $node,
    element values {
      element username {xdmp:get-request-username()},
      element dateTime {fn:current-dateTime()},
      element id {xdmp:md5(xdmp:get-request-username()||fn:current-dateTime()||xdmp:random(), "base64")}
    }
  )
};

declare 
function json-helper:populate-proper-fields(
  $node as node(),
  $values as element()
) as node()* {
  typeswitch ($node)
  case document-node() return
    document {
      (: Using function mapping here! :)
      json-helper:populate-proper-fields(
        $node/*,
        $values
      )
    }
  case element() return
    let $element-qn as xs:QName := fn:node-name($node)
    (: version of the QN without a namespace :)
    let $non-nsd-qn as xs:QName := fn:QName('',fn:local-name-from-QName($element-qn))
    let $value-for-element as xs:anyAtomicType? := $values/*[fn:node-name(.) eq $non-nsd-qn]/fn:data(.)
    return 
      if (fn:exists($value-for-element))
      then
        json-helper:set-element-value($node,$value-for-element)
      else
        element {fn:node-name($node)} {
          $node/@*,
          (: Using function mapping here! :)
          json-helper:populate-proper-fields(
            $node/node(),
            $values
          )
        }
  default return
    $node
};

declare 
function json-helper:set-element-value(
  $element as element(),
  $value as xs:anyAtomicType
) as element() {
  element {fn:node-name($element)} {
    $element/@* except $element/@type,
    attribute type {
      json-helper:get-type-name($value)
    },
    $value
  }
};

declare  
%private 
function json-helper:get-type-name( 
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