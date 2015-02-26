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
  let $demo-name := $alert:doc/jbasic:json/jbasic:name/string()
  let $status-details := $alert:doc/jbasic:json/jbasic:demoStatus/jbasic:statusDetails
  let $ref-host := $alert:rule/alert:options/alert:hostname/string()
  let $demo-url := fn:concat("http://", $ref-host, "/detail", fn:document-uri($alert:doc))
  let $subject := fn:concat("[DemoCat]: ", $demo-name, " is Not Working")
  let $message :=
    <div xmlns="http://www.w3.org/1999/xhtml">
      <h2>{$demo-name} is Not Working</h2>
      <p>Demo Cat was updated to indicate that <a href="{$demo-url}">{$demo-name}</a> is not working.</p>
      <div>{$status-details}</div>
    </div>

  return
    for $person in $alert:doc//jbasic:persons/jbasic:json
    where ($person/jbasic:role = "Technical Contact" and $person/jbasic:email and fn:string-length($person/jbasic:email) > 0)
    return (
      let $contact-email := $person/jbasic:email
      let $contact-name  := $person/jbasic:personName
      let $_ := xdmp:log(fn:concat("Issuing alert email to (", $contact-email, ") about broken demo: ", $demo-name))
      return utilities:send-notification($contact-name, $contact-email, $subject, $message)
    )

else
  let $demo-name := $alert:doc/jbasic:json/jbasic:name/string()
  let $_ := xdmp:log(fn:concat("No Technical Contact to inform of broken demo: ", $demo-name))
  return ()
