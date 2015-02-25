xquery version "1.0-ml";

module namespace follow = "http://marklogic.com/rest-api/resource/follow";

import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
import module namespace json-helper = "http://marklogic.com/demo-cat/json-helper" at "/lib/json-helper.xqy";
import module namespace utilities =  "http://marklogic.com/demo-cat/utilities" at "/lib/utilities.xqy";

declare namespace roxy = "http://marklogic.com/roxy";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";


(:
 : To add parameters to the functions, specify them in the params annotations.
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") follow:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)

(:
 :)
declare
%roxy:params("")
function follow:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  map:put($context, "output-types", "application/json"),
  xdmp:set-response-code(501, "OK"),
  document { "Not implemented" }
};

(:
 :)
declare
%roxy:params("")
function follow:put(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()?
{
  map:put($context, "output-types", "application/json"),
  xdmp:set-response-code(501, "OK"),
  document { "Not implemented" }
};

(:
 :)
declare
%roxy:params("")
function follow:post(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()*
{
  map:put($context, "output-types", "application/json"),
  let $encoded-uri := map:get($params,"uri")
  let $uri := xdmp:url-decode($encoded-uri)
  let $username := xdmp:get-current-user()
  let $profile-uri := fn:concat("/users/",$username,".json")
  let $profile := fn:doc($profile-uri)/jbasic:json
  let $emails := $profile/jbasic:user/jbasic:emails/jbasic:item/string()
  let $fullname := $profile/jbasic:user/jbasic:fullname/string()
  let $host := utilities:get-referring-host()


  (: First add the rule.  We'll need the id :)
  let $rule := alert:make-rule(
      "rule-send-email",
      "The rule tests for an update to a demo",
      xdmp:get-request-user(),
      cts:document-query($uri),
      "send-demo-email",
      element alert:options {
        element alert:hostname {
          $host
        },
        element alert:fullname {
            $fullname
          },
        for $email in $emails
         return
           element alert:email-address{
             $email
           }
       })
  let $rule-insert := alert:rule-insert("http://marklogic.com/demo-cat/notifications", $rule)
  let $alert-id := $rule/@id

  (: Construct the JSON for the user's profile :)
  let $follow-object :=
    element jbasic:json {
      attribute type { "object"},
      element jbasic:followUri {
        attribute type { "string"},
        $encoded-uri
      },
      element jbasic:followAlertId {
        attribute type { "string"},
        $alert-id/data()
      }
    }

  (: Now insert the following info into the user's profile :)
  let $insert-noop :=
    if($profile/jbasic:user/jbasic:follows) then
      xdmp:node-insert-child($profile/jbasic:user/jbasic:follows, $follow-object)
    else
      let $insert-node :=
        element jbasic:follows {
          attribute type { "array"},
          $follow-object
        }
      return xdmp:node-insert-child($profile/jbasic:user, $insert-node)

  return (
    xdmp:set-response-code(200, "OK"),
    document { json:transform-to-json($follow-object)}
  )
};

(:
 :)
declare
%roxy:params("")
function follow:delete(
    $context as map:map,
    $params  as map:map
) as document-node()?
{
  map:put($context, "output-types", "application/json"),
  let $uri := xdmp:url-decode(map:get($params,"uri"))
  let $username := xdmp:get-current-user()
  let $profile-uri := fn:concat("/users/",$username,".json")
  let $profile := fn:doc($profile-uri)/jbasic:json

  let $gone-node := $profile/jbasic:user/jbasic:follows/jbasic:json[jbasic:followUri = $uri]
  let $alert-to-remove := $gone-node/jbasic:followAlertId/data()
  let $removed := alert:rule-remove("http://marklogic.com/demo-cat/notifications",$alert-to-remove)
  let $delete := xdmp:node-delete($gone-node)

  return (
    xdmp:set-response-code(200, "OK"),
    document { json:transform-to-json($gone-node)}
  )
};
