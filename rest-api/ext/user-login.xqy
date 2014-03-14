xquery version "1.0-ml";

module namespace user = "http://marklogic.com/rest-api/resource/user-login";

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
    xdmp:set-response-code(200, "OK"),
    document { "success" }
  ) else (
    xdmp:set-response-code(401, "Not Authorized"),
    document { "incorrect" }
  )
};
