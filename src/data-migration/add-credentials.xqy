(: A data transform to update the json model to support > 1 set of credentials :)
xquery version "1.0-ml";

import module namespace demo = "http://marklogic.com/demo-cat/demo-model"
  at "/lib/demo-model.xqy";

declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare option xdmp:mapping "false";

for $uri in cts:uri-match("/demos/*")
let $demo := demo:read($uri)

where fn:exists($demo/jbasic:username | $demo/jbasic:password)
return

let $username := $demo/jbasic:username
let $password := $demo/jbasic:password
let $new-demo :=
  demo:replace($demo, $demo/(jbasic:username, jbasic:password), (
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "credentials") } {
      attribute type { "array" },
      element { fn:QName("http://marklogic.com/xdmp/json/basic", "json") } {
        attribute type { "object" },
        $username,
        $password
      }
    }
  ))

let $_ := demo:save($uri, $new-demo)
return fn:concat("Updated credentials for ", $uri)
