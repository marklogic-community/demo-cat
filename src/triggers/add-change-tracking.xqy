xquery version "1.0-ml";

import module namespace demo = "http://marklogic.com/demo-cat/demo-model"
  at "/lib/demo-model.xqy";

declare namespace trgr = "http://marklogic.com/xdmp/triggers";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare option xdmp:mapping "false";

declare variable $trgr:uri as xs:string external;

let $demo := demo:read($trgr:uri)
let $new-demo :=
  demo:replace($demo, $demo/(jbasic:lastModifiedBy, jbasic:lastModifiedAt), (
    if (fn:empty($demo/jbasic:createdBy)) then
      element { fn:QName("http://marklogic.com/xdmp/json/basic", "createdBy") } {
        attribute type { "string" },
        xdmp:get-current-user()
      }
    else (),
    if (fn:empty($demo/jbasic:createdAt)) then
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
  ))
let $_ := demo:save($trgr:uri, $new-demo)
return xdmp:log(fn:concat("Updated change tracking for ", $trgr:uri))
