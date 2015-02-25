(: An alert that sends an email when a demo has been updated :)
xquery version "1.0-ml";


declare namespace alert = "http://marklogic.com/xdmp/alert";

import module namespace utilities =  "http://marklogic.com/demo-cat/utilities" at "/lib/utilities.xqy";

declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";


declare variable $alert:config-uri as xs:string external;
declare variable $alert:doc as node() external;
declare variable $alert:rule as element(alert:rule) external;
declare variable $alert:action as element(alert:action) external;

(: Get the info about what was updated :)
let $title := $alert:doc/jbasic:json/jbasic:name/string()
let $uri := fn:document-uri($alert:doc)

(: Get the info about the user who followed this demo :)
let $fullname := $alert:rule/alert:options/alert:fullname/string()
let $emails := $alert:rule/alert:options/alert:email-address/string()

(: Build and send the email :)
let $hostname := $alert:rule/alert:options/alert:hostname/string()
let $subject := fn:concat("[DemoCat] follow notification: ", $title, " has been updated")
let $message :=
    <div xmlns="http://www.w3.org/1999/xhtml">
      <h2> {$title}, a demo you follow, has been updated. </h2>
      <p> To see the updated demo, click "<a href="http://{$hostname}/detail?uri={xdmp:url-encode($uri)}">here</a>"</p>
    </div>

return
  for $email in $emails
  return utilities:send-notification($fullname, $email, $subject, $message)
