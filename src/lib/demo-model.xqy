xquery version "1.0-ml";

module namespace demo = "http://marklogic.com/demo-cat/demo-model";

import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";

import module namespace conf = "http://marklogic.com/roxy/config" at "/app/config/config.xqy";
import module namespace util = "http://marklogic.com/demo-cat/utilities" at "/lib/utilities.xqy";

declare namespace alert = "http://marklogic.com/xdmp/alert";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare option xdmp:mapping "false";

declare variable $is-ml8 := fn:starts-with(xdmp:version(), "8");

(: access :)

declare function demo:create-comment($msg as xs:string) as element(jbasic:json) {
  <json type="object" xmlns="http://marklogic.com/xdmp/json/basic">
    <username type="string">{ xdmp:get-request-username() }</username>
    <dateTime type="string">{ fn:current-dateTime() }</dateTime>
    <id type="string">{ xdmp:md5(xdmp:get-request-username()||fn:current-dateTime()||xdmp:random(), "base64") }</id>
    <msg type="string">{ $msg }</msg>
  </json>
};

declare function demo:create-bug($nr as xs:string, $msg as xs:string, $browser as xs:string?, $status as xs:string, $type as xs:string?, $assignee as xs:string?) as element(jbasic:json) {
  <json type="object" xmlns="http://marklogic.com/xdmp/json/basic">
    <username type="string">{ xdmp:get-request-username() }</username>
    <dateTime type="string">{ fn:current-dateTime() }</dateTime>
    <id type="string">{ xdmp:md5(xdmp:get-request-username()||fn:current-dateTime()||xdmp:random(), "base64") }</id>
    <nr type="number">{ $nr }</nr>
    <msg type="string">{ $msg }</msg>
    <browser type="string">{ $browser }</browser>
    <status type="string">{ $status }</status>
    <type type="string">{ $type }</type>
    <assignee type="string">{ $assignee }</assignee>
  </json>
};

declare function demo:replace($demo as element(jbasic:json), $properties as element()*, $new-properties as element()*) as element(jbasic:json) {
  element { fn:node-name($demo) } {
    $demo/@*,
    $demo/(* except $properties),
    $new-properties
  }
};

(: notifications :)

declare function demo:notify-comment(
  $uri as xs:string,
  $comment as element(jbasic:json)
) as empty-sequence() {
  (: get demo details :)
  let $demo := demo:read($uri)
  let $demo-name := $demo/jbasic:name
  let $host := (util:get-referring-host(), $conf:HOSTNAME)[. ne ''][1]
  let $demo-url := fn:concat("http://", $host, "/detail", $uri)

  let $username := $comment/jbasic:username/node()
  let $msg := $comment/jbasic:msg/node()
  
  (: build message :)
  let $subject := 'New Comment for "'||$demo-name||'"'
  let $message :=
    <div xmlns="http://www.w3.org/1999/xhtml">
      <h2>New Comment for "<a href="{$demo-url}">{$demo-name}</a>"</h2>
      <p>Created by {$username}</p>
      <div>{$msg}</div>
    </div>
    
  (: send message :)
  return
    demo:notify($demo, $subject, $message, fn:true())
};

declare function demo:notify-bug(
  $uri as xs:string,
  $bug as element(jbasic:json)
) as empty-sequence() {
  (: get demo details :)
  let $demo := demo:read($uri)
  let $demo-name := $demo/jbasic:name
  let $host := (util:get-referring-host(), $conf:HOSTNAME)[. ne ''][1]
  let $demo-url := fn:concat("http://", $host, "/detail", $uri)

  let $username := $bug/jbasic:username/node()
  let $msg := $bug/jbasic:msg/node()
  let $type := $bug/jbasic:type/node()
  let $assignee := $bug/jbasic:assignee/node()

  (: build message :)
  let $subject := 'New Bug for "'||$demo-name||'"'
  let $message :=
    <div xmlns="http://www.w3.org/1999/xhtml">
      <h2>New {$type} for "<a href="{$demo-url}">{$demo-name}</a>"</h2>
      <p>Opened by {$username}</p>
      <p>Assigned to {$assignee}</p>
      <div>{$msg}</div>
    </div>
    
  (: send message :)
  return
    demo:notify($demo, $subject, $message, fn:false())
};

declare function demo:notify-update(
  $uri as xs:string,
  $recipient-name as xs:string,
  $recipient-emails as xs:string*
) as empty-sequence() {
  (: get demo details :)
  let $demo := demo:read($uri)
  let $demo-name := $demo/jbasic:name
  let $host := (util:get-referring-host(), $conf:HOSTNAME)[. ne ''][1]
  let $demo-url := fn:concat("http://", $host, "/detail", $uri)

  (: build message :)
  let $subject := '"'||$demo-name||'" has been updated'
  let $message :=
    <div xmlns="http://www.w3.org/1999/xhtml">
      <h2> "{$demo-name}", a demo you follow, has been updated. </h2>
      <p> To see the updated demo, click "<a href="{$demo-url}">here</a>"</p>
    </div>
  
  (: send message :)
  let $recipient-emails := $recipient-emails[. ne ""]
  let $recipient-emails :=
    if ($recipient-emails) then
      $recipient-emails
    else
      "vanguard@marklogic.com"
  for $recipient-email in $recipient-emails
  return
    demo:send-email($recipient-name, $recipient-email, $subject, $message)
};

declare function demo:notify-broken(
  $uri as xs:string
) as empty-sequence() {
  (: get demo details :)
  let $demo := demo:read($uri)
  let $demo-name := $demo/jbasic:name
  let $host := (util:get-referring-host(), $conf:HOSTNAME)[. ne ''][1]
  let $demo-url := fn:concat("http://", $host, "/detail", $uri)

  let $status-details := $demo/jbasic:demoStatus/jbasic:statusDetails/node()

  (: build message :)
  let $subject := '"'||$demo-name||'" is Not Working'
  let $message :=
    <div xmlns="http://www.w3.org/1999/xhtml">
      <h2> "{$demo-name}"is Not Working. </h2>
      <p>Demo Cat was updated to indicate that <a href="{$demo-url}">{$demo-name}</a> is not working.</p>
      <div>{$status-details}</div>
    </div>
  
  (: send message :)
  return
    demo:notify($demo, $subject, $message, fn:false())
};

declare function demo:notify(
  $demo as element(jbasic:json),
  $subject as  xs:string,
  $message as item(),
  $business-owners-first as xs:boolean
) as empty-sequence() {
  
  (: get receipients :)
  let $business-owners := $demo/jbasic:persons/jbasic:json[jbasic:role = "Business Owner"]
  let $tech-contacts := $demo/jbasic:persons/jbasic:json[jbasic:role = "Technical Contact"]
  let $internal-contacts := $demo/jbasic:persons/jbasic:json[jbasic:role != "External Contact"]
  
  let $recipients :=
    if ($business-owners-first and fn:exists($business-owners)) then
      $business-owners
    else if ($tech-contacts) then
      $tech-contacts
    else if ($internal-contacts) then
      $internal-contacts
    else
      <vanguard/>
  
  for $recipient in $recipients
  
  let $recipient-name as xs:string := (
    $recipient/jbasic:name,
    "Vanguard"
  )[1]
  let $recipient-email as xs:string := (
    $recipient/jbasic:email[. ne ""],
    "vanguard@marklogic.com"
  )[1]
  
  return
    demo:send-email($recipient-name, $recipient-email, $subject, $message)
};

declare function demo:send-email(
  $recipient-name as xs:string,
  $recipient-email as xs:string,
  $subject as  xs:string,
  $message as item()
) as empty-sequence() {
  util:send-notification($recipient-name, $recipient-email, "[Demo-Cat] "||$subject, $message)
};

(: low-level access :)

declare function demo:uri($id as xs:string) as xs:string {
  fn:concat('/demos/', $id, '.json')
};

declare function demo:convert($doc as document-node()) as element(jbasic:json) {
  if ($doc/jbasic:json) then
    $doc/jbasic:json
  else
    json:transform-from-json($doc)
};

declare function demo:read($uri as xs:string) as element(jbasic:json) {
  let $doc := fn:doc($uri)
  return
    demo:convert($doc)
};

declare function demo:save($uri as xs:string, $demo as element(jbasic:json)) {
  let $demo :=
    if ($is-ml8) then
      xdmp:to-json(json:transform-to-json($demo))/node()
    else
      $demo
  return
    xdmp:document-insert($uri, $demo, xdmp:default-permissions(), (xdmp:default-collections(), 'demos'))
};
