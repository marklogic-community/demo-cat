xquery version "1.0-ml";

module namespace user = "http://marklogic.com/rest-api/resource/user-status";

import module namespace admin = "http://marklogic.com/xdmp/admin" at "/MarkLogic/admin.xqy";
import module namespace json1="http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";


declare namespace roxy = "http://marklogic.com/roxy";

(:
 : To add parameters to the functions, specify them in the params annotations.
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") user:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)

declare function user:get-username($user-id)
{
  xdmp:eval(
    'import module namespace sec="http://marklogic.com/xdmp/security" at "/MarkLogic/security.xqy";
     declare variable $user-id external;
     sec:get-user-names($user-id)',
    (xs:QName("user-id"), $user-id),
    <options xmlns="xdmp:eval">
      <database>{xdmp:security-database()}</database>
    </options>
  )
};

(:
 :)
declare function user:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  map:put($context, "output-types", "application/json"),
  xdmp:set-response-code(200, "OK"),
  let $current := xdmp:get-current-user()
  let $config := admin:get-configuration()
  let $default :=
    user:get-username(
      admin:appserver-get-default-user(
        $config,
        xdmp:server()
      )
    )
  let $profile := fn:doc("/users/" || $current || ".json")
  return
    document {
      if ($current = $default) then
        xdmp:to-json(
          map:new((
            map:entry("authenticated", fn:false())
          ))
        )
      else
        xdmp:to-json(
          map:new((
            map:entry("authenticated", fn:true()),
            map:entry("username", $current),
            map:entry("profile", map:new((
              map:entry("fullname", $profile//*:fullname/data(.)),
              map:entry("emails", json:to-array($profile//*:emails/*:item/data(.)))
            )))
          ))
        )
    }
};
