xquery version "1.0-ml";

declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

for $doc in xdmp:directory("/demos/", "infinity")[fn:exists(./jbasic:json/jbasic:host) and fn:empty(./jbasic:json/jbasic:url)]
let $current-host := $doc/jbasic:json/jbasic:host
let $current-hostType := $doc/jbasic:json/jbasic:hostType

let $inserts := xdmp:node-insert-child($doc/jbasic:json, (
  element { fn:QName("http://marklogic.com/xdmp/json/basic", "url") } {
    attribute type { "string" },
    $current-host/text()
  },
  element { fn:QName("http://marklogic.com/xdmp/json/basic", "urlType") } {
    attribute type { "string" },
    $current-hostType/text()
  }
))
let $deletes :=
  for $del in ($current-host, $current-hostType)
  return xdmp:node-delete($del)

return fn:concat("Updated host for ", xdmp:node-uri($doc))
