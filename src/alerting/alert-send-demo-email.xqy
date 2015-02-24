xquery version "1.0-ml";


declare namespace alert = "http://marklogic.com/xdmp/alert";

import module namespace utilities =  "http://marklogic.com/demo-cat/utilities"
  at "/lib/utilities.xqy";

declare variable $alert:config-uri as xs:string external;
declare variable $alert:doc as node() external;
declare variable $alert:rule as element(alert:rule) external;
declare variable $alert:action as element(alert:action) external;

let $doc-uri := fn:document-uri($alert:doc)
return xdmp:log("Alert received!")
