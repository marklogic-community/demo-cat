xquery version "1.0-ml";

declare namespace alert = "http://marklogic.com/xdmp/alert";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

import module namespace utilities="http://marklogic.com/demo-cat/utilities" at "/lib/utilities.xqy";

declare variable $alert:config-uri as xs:string external;
declare variable $alert:doc as node() external;
declare variable $alert:rule as element(alert:rule) external;
declare variable $alert:action as element(alert:action) external;


if (fn:count($alert:doc/jbasic:json/jbasic:persons/jbasic:json[jbasic:role = "Technical Contact"]) > 0)
then
  (: get demo name :)
  let $demo-name as xs:string? := $alert:doc/jbasic:json/jbasic:name
  (: get referring host :)
  let $host := utilities:get-referring-host()
  (: get status details :)
  let $status-details := $alert:doc/jbasic:json/jbasic:demoStatus/jbasic:statusDetails
  (: build message :)
  let $message :=
    <div xmlns="http://www.w3.org/1999/xhtml">
      <h2>{$demo-name} is Not Working</h2>
      <p>Demo Cat was updated to indicate that {$demo-name} is not working.</p>
      <div>{$status-details}</div>
    </div>

  let $_ := xdmp:log(fn:concat(xdmp:get-current-user(), " - Alert - Demo Broken"))
  let $_ := xdmp:log(fn:concat("Broken Demo URI: ", fn:document-uri($alert:doc)))
  let $_ := xdmp:log(fn:concat("Broken Demo Name ", $demo-name))

  for $person in $alert:doc//jbasic:persons/jbasic:json
    where ($person/jbasic:role = "Technical Contact" and $person/jbasic:email and fn:string-length($person/jbasic:email) > 0)
    return
      let $contact-email := $person/jbasic:email
      let $_ := xdmp:log(fn:concat("Broken Demo - Person Name: ", $contact-email))

  return ()

else
  ()  (: do nothing :)
