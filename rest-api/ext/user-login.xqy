xquery version "1.0-ml";

module namespace user = "http://marklogic.com/rest-api/resource/user-login";

import module namespace json1="http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";


declare namespace roxy = "http://marklogic.com/roxy";

(:
 : To add parameters to the functions, specify them in the params annotations.
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") user:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)

(:
 :)
declare
%roxy:params("username=xs:string", "password=xs:string")
function user:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  map:put($context, "output-types", "application/json"),
  if (xdmp:login(map:get($params, 'username'), map:get($params, 'password'))) then (
    xdmp:log("current user: " || xdmp:get-current-user()),
    xdmp:set-response-code(200, "OK"),
    document {
      xdmp:to-json(
        map:new((
          map:entry("authenticated", fn:true()),
          map:entry("username", map:get($params, 'username')),
          let $profile := fn:doc("/users/" || map:get($params, 'username') || ".json")
          where $profile
          return
            map:entry("profile", map:new((
              map:entry("fullname", $profile//*:fullname/data(.)),
              map:entry("emails", json:to-array($profile//*:emails/*:item/data(.))),
              map:entry("follows", json1:transform-to-json($profile//*:follows/*:json))
            )))
        ))
      )
    }
  ) else (
    xdmp:set-response-code(401, "Not Authorized"),
    document {
      xdmp:to-json(
        map:new((
          map:entry("authenticated", fn:false())
        ))
      )
    }
  )
};
