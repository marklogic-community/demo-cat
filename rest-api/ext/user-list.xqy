xquery version "1.0-ml";

module namespace user = "http://marklogic.com/rest-api/resource/user-list";

declare namespace roxy = "http://marklogic.com/roxy";

declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

(:
 : To add parameters to the functions, specify them in the params annotations.
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") user:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)

(:
  Get a list of the users registered
 :)
declare
%roxy:params("")
function user:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  let $names :=
    for $doc in xdmp:directory("/users/")
    let $name := $doc//jbasic:fullname/data(.)
    order by $name
    return $name

  return (
    map:put($context, "output-types", "application/json"),
    xdmp:set-response-code(200, "OK"),
    document { xdmp:to-json(json:to-array($names)) }
  )
};
