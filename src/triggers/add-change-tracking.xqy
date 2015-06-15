xquery version "1.0-ml";

import module namespace demo = "http://marklogic.com/demo-cat/demo-model"
  at "/lib/demo-model.xqy";

declare namespace trgr = "http://marklogic.com/xdmp/triggers";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare option xdmp:mapping "false";

declare variable $trgr:uri as xs:string external;

let $_ := demo:update-change-tracking($trgr:uri)
return xdmp:log(fn:concat("Updated change tracking for ", $trgr:uri))
