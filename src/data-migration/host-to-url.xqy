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

where fn:exists($o/jbasic:host) and fn:empty($o/jbasic:url)
return

let $new-o :=
  element { fn:node-name($o) }
  {
    $o/@*,
    $o/(* except (jbasic:host, jbasic:hostType)),
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "url") } {
      attribute type { "string" },
      $o/jbasic:host/text()
    },
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "urlType") } {
      attribute type { "string" },
      $o/jbasic:hostType/text()
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

return fn:concat("Updated host for ", xdmp:node-uri($doc))
