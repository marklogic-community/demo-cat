xquery version "1.0-ml";

module namespace user = "http://marklogic.com/rest-api/resource/user-logout";

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
%roxy:params("")
function user:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  map:put($context, "output-types", "application/json"),
  try {
    xdmp:logout(),
    xdmp:set-response-code(200, "OK"),
    document { "success" }
  } catch ($e) {
    xdmp:log($e),
    xdmp:set-response-code(400, "Bad Request"),
    document { "incorrect" }
  }
};
