xquery version "1.0-ml";

declare namespace alert = "http://marklogic.com/xdmp/alert";

import module namespace demo = "http://marklogic.com/demo-cat/demo-model" at "/lib/demo-model.xqy";

declare option xdmp:mapping "false";

declare variable $alert:doc as node() external;

demo:notify-broken(fn:document-uri($alert:doc))
