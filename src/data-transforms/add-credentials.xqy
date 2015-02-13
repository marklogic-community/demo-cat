(: A data transform to update the json model to support > 1 set of credentials :)
xquery version "1.0-ml";

import module namespace json = "http://marklogic.com/xdmp/json"
  at "/MarkLogic/json/json.xqy";

declare namespace jb = "http://marklogic.com/xdmp/json/basic";

for $o in (/jb:json[jb:username or jb:password])[1]
let $username := $o/jb:username
let $password := $o/jb:password
let $new-o :=
  element { fn:node-name($o) }
  {
    $o/@*,
    $o/*[fn:not(self::jb:username or self::jb:password)],
    element jb:credentials {
      attribute type { "array" },
      element jb:json {
        attribute type { "object" },
        $username,
        $password
      }
    }
  }
let $_ :=
  xdmp:node-replace($o, $new-o)

return fn:concat("Updated credentials for ", xdmp:node-uri($o))
