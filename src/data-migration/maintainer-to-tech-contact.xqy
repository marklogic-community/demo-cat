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

where fn:exists($o/jbasic:maintainer)
return

let $current-maintainer := $o/jbasic:maintainer
let $current-email := $o/jbasic:email
let $current-role := "Technical Contact"

let $new-o :=
  element { fn:node-name($o) }
  {
    $o/@*,
    $o/(* except (jbasic:email, jbasic:maintainer)),
    if($current-maintainer or $current-email) then
      element { fn:QName("http://marklogic.com/xdmp/json/basic", "persons") } {
        attribute type { "array"},
        element { fn:QName("http://marklogic.com/xdmp/json/basic", "json") } {
          attribute type { "object"},
          if($current-maintainer) then
            element { fn:QName("http://marklogic.com/xdmp/json/basic", "personName") } {
              attribute type { "string"},
              $current-maintainer/text()
            }
          else
            ()
          ,
          if($current-email) then
            element { fn:QName("http://marklogic.com/xdmp/json/basic", "email") } {
              attribute type { "string"},
              $current-email/text()
            }
          else
            ()
          ,
          element { fn:QName("http://marklogic.com/xdmp/json/basic", "role") } {
            attribute type { "string"},
            $current-role
          }
        }
      }
    else
      ()
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

return fn:concat("Updated maintainer for ", xdmp:node-uri($doc))
