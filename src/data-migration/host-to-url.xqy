xquery version "1.0-ml";

import module namespace demo = "http://marklogic.com/demo-cat/demo-model"
  at "/lib/demo-model.xqy";

declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare option xdmp:mapping "false";

for $uri in cts:uri-match("/demos/*")
let $demo := demo:read($uri)

where fn:exists($demo/jbasic:host) and fn:empty($demo/jbasic:url)
return

let $new-demo :=
  demo:replace($demo, $demo/(jbasic:host, jbasic:hostType), (
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "url") } {
      attribute type { "string" },
      $demo/jbasic:host/text()
    },
    element { fn:QName("http://marklogic.com/xdmp/json/basic", "urlType") } {
      attribute type { "string" },
      $demo/jbasic:hostType/text()
    }
  ))

let $_ := demo:save($uri, $new-demo)
return fn:concat("Updated host for ", $uri)
