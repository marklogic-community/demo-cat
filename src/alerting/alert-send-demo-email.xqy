(: An alert that sends an email when a demo has been updated :)
xquery version "1.0-ml";

declare namespace alert = "http://marklogic.com/xdmp/alert";

import module namespace demo = "http://marklogic.com/demo-cat/demo-model"
  at "/lib/demo-model.xqy";
import module namespace user = "http://marklogic.com/demo-cat/user-model"
  at "/lib/user-model.xqy";

declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare option xdmp:mapping "false";

declare variable $alert:doc as node() external;
declare variable $alert:rule as element(alert:rule) external;

let $uri := fn:document-uri($alert:doc)
let $username := $alert:rule/alert:options/alert:username
let $profile := user:get($username)/jbasic:user
let $fullname := $profile/jbasic:fullname/fn:string()
let $emails := $profile/jbasic:emails/jbasic:item/fn:string()
return
  demo:notify-update($uri, $fullname, $emails)
