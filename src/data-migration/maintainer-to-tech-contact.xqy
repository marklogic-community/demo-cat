xquery version "1.0-ml";

import module namespace demo = "http://marklogic.com/demo-cat/demo-model"
  at "/lib/demo-model.xqy";

declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare option xdmp:mapping "false";

for $uri in cts:uri-match("/demos/*")
let $demo := demo:read($uri)

where fn:exists($demo/jbasic:maintainer)
return

let $current-maintainer := $demo/jbasic:maintainer
let $current-email := $demo/jbasic:email
let $current-role := "Technical Contact"

let $new-demo :=
  demo:replace($demo, $demo/(jbasic:email, jbasic:maintainer), (
    if ($current-maintainer or $current-email) then
      element { fn:QName("http://marklogic.com/xdmp/json/basic", "persons") } {
        attribute type { "array"},
        element { fn:QName("http://marklogic.com/xdmp/json/basic", "json") } {
          attribute type { "object"},
          if ($current-maintainer) then
            element { fn:QName("http://marklogic.com/xdmp/json/basic", "personName") } {
              attribute type { "string"},
              $current-maintainer/text()
            }
          else
            ()
          ,
          if ($current-email) then
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
  ))
  
let $_ := demo:save($uri, $new-demo)
return fn:concat("Updated maintainer for ", $uri)
