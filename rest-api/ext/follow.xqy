xquery version "1.0-ml";

module namespace follow = "http://marklogic.com/rest-api/resource/follow";

import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
import module namespace json-helper = "http://marklogic.com/demo-cat/json-helper" at "/lib/json-helper.xqy";
import module namespace utilities =  "http://marklogic.com/demo-cat/utilities" at "/lib/utilities.xqy";

import module namespace user = "http://marklogic.com/demo-cat/user-model"
  at "/lib/user-model.xqy";

declare namespace roxy = "http://marklogic.com/roxy";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";
declare namespace rapi = "http://marklogic.com/rest-api";

declare option xdmp:mapping "false";

(:
 : To add parameters to the functions, specify them in the params annotations.
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") follow:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)

declare
%roxy:params("")
%rapi:transaction-mode("update")
function follow:post(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()*
{
  map:put($context, "output-types", "application/json"),
  let $uri := map:get($params,"uri")
  let $username := xdmp:get-current-user()

  (: First add the rule.  We'll need the id :)
  let $rule := alert:make-rule(
    fn:concat("Rule send-email for ", $username, ", demo ", $uri),
    "The rule tests for an update to a demo",
    xdmp:get-request-user(),
    cts:document-query($uri),
    "send-demo-email",
    element alert:options {
      element alert:username {
        $username
      }
    }
  )
  let $rule-insert := alert:rule-insert("http://marklogic.com/demo-cat/notifications", $rule)
  let $alert-id := $rule/@id

  (: Construct the JSON for the user's profile :)
  let $follow-object :=
    element jbasic:json {
      attribute type { "object"},
      element jbasic:followUri {
        attribute type { "string"},
        $uri
      },
      element jbasic:followAlertId {
        attribute type { "string"},
        $alert-id/data()
      }
    }

  (: Now insert the following info into the user's profile :)
  let $profile := user:get($username)
  let $follows := $profile/jbasic:user/jbasic:follows
  let $new-follows :=
    element jbasic:follows {
      attribute type { "array"},
      $follows/(@* except @type),
      $follows/*,
      $follow-object
    }
  let $new-profile := user:replace($profile, $follows, $new-follows)
  let $_ := user:put($username, $new-profile)

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
  let $uri := map:get($params,"uri")
  let $username := xdmp:get-current-user()
  let $profile := user:get($username)

  (: remove alert :)
  let $gone-node := $profile//jbasic:user/jbasic:follows/jbasic:json[jbasic:followUri = $uri]
  let $alert-to-remove := $gone-node/jbasic:followAlertId/data()
  let $removed := alert:rule-remove("http://marklogic.com/demo-cat/notifications",$alert-to-remove)

  (: update user profile :)
  let $follows := $profile/jbasic:user/jbasic:follows
  let $new-follows :=
    element jbasic:follows {
      $follows/@*,
      $follows/(* except $gone-node)
    }
  let $new-profile := user:replace($profile, $follows, $new-follows)
  let $_ := user:put($username, $new-profile)

  return (
    xdmp:set-response-code(200, "OK"),
    document { json:transform-to-json($gone-node)}
  )
};
