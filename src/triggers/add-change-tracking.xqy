xquery version "1.0-ml";

import module namespace json = "http://marklogic.com/xdmp/json"
  at "/MarkLogic/json/json.xqy";

declare namespace trgr = "http://marklogic.com/xdmp/triggers";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare option xdmp:mapping "false";

declare variable $trgr:uri as xs:string external;

let $doc := fn:doc($trgr:uri)
let $o :=
  (: ML7 JSONXML :)
  if ($doc/jbasic:json) then
    $doc/jbasic:json
  (: ML8 JSON :)
  else
    json:transform-from-json($doc)

let $new-o :=
  element { fn:node-name($o) }
  {
    $o/@*,
    $o/(* except (jbasic:lastModifiedBy, jbasic:lastModifiedAt)),
    if (fn:empty($o/jbasic:createdBy)) then
      element { fn:QName("http://marklogic.com/xdmp/json/basic", "createdBy") } {
        attribute type { "string" },
        xdmp:get-current-user()
      }
    else (),
    if (fn:empty($o/jbasic:createdAt)) then
      element { fn:QName("http://marklogic.com/xdmp/json/basic", "createdAt") } {
        attribute type { "string" },
        fn:current-dateTime()
      }
    else (),
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "lastModifiedBy") } {
      attribute type { "string" },
      xdmp:get-current-user()
    },
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "lastModifiedAt") } {
      attribute type { "string" },
      fn:current-dateTime()
    }
  }

let $new-o :=
  (: ML7 JSONXML :)
  if ($doc/jbasic:json) then
    $new-o
  (: ML8 JSON :)
  else
    xdmp:to-json(json:transform-to-json($new-o))/node()

let $_ :=
  xdmp:node-replace($doc/node(), $new-o)

return xdmp:log(fn:concat("Updated change tracking for ", $trgr:uri))
