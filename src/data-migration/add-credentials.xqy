(: A data transform to update the json model to support > 1 set of credentials :)
xquery version "1.0-ml";

import module namespace json = "http://marklogic.com/xdmp/json"
  at "/MarkLogic/json/json.xqy";

declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare option xdmp:mapping "false";

for $doc in xdmp:directory("/demos/", "infinity")
let $o :=
  (: ML7 JSONXML :)
  if ($doc/jbasic:json) then
    $doc/jbasic:json
  (: ML8 JSON :)
  else
    json:transform-from-json($doc)

where fn:exists($o/jbasic:username | $o/jbasic:password)
return

let $username := $o/jbasic:username
let $password := $o/jbasic:password
let $new-o :=
  element { fn:node-name($o) }
  {
    $o/@*,
    $o/(* except (jbasic:username, jbasic:password)),
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "credentials") } {
      attribute type { "array" },
      element { fn:QName("http://marklogic.com/xdmp/json/basic", "json") } {
        attribute type { "object" },
        $username,
        $password
      }
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

return fn:concat("Updated credentials for ", xdmp:node-uri($o))
