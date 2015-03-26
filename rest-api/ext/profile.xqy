xquery version "1.0-ml";

module namespace profile = "http://marklogic.com/rest-api/resource/profile";

import module namespace json="http://marklogic.com/xdmp/json"
     at "/MarkLogic/json/json.xqy";

declare namespace roxy = "http://marklogic.com/roxy";

declare variable $ROLE_READER := "demo-cat-reader-role";
declare variable $ROLE_WRITER := "demo-cat-writer-role";
declare variable $ROLE_ADMIN  := "demo-cat-admin-role";

(:
  
  This gets the profile if it exists, 
  and the user's webroles are determined based on the user's system roles for this app

 :)
declare function profile:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  map:put($context, "output-types", "application/json"),
  let $username := xdmp:get-current-user()
  let $profile := fn:doc("/users/"||$username||".json")
  let $profile :=
    if ($profile/element())
    then json:transform-to-json-object($profile)
    else if ($profile)
    then xdmp:from-json($profile)
    else json:object()

  let $webroles := profile:get-webroles-for-user() 
  let $webroles-array := json:array()
  let $_ := 
    for $webrole in $webroles
    return json:array-push($webroles-array, $webrole)

  let $_ := map:put($profile, "webroles", $webroles-array)

  return document{ xdmp:to-json($profile) }
};

(: 
  Rather than expose the system role names, we'll represent them as "webroles" that the UI can use for permission checking.
:)
declare private function profile:get-webroles-for-user() {
  if (xdmp:get-current-roles() = (xdmp:role("admin"), xdmp:role($ROLE_ADMIN)))
  then ("admin", "writer", "reader")
  else if (xdmp:get-current-roles() = xdmp:role($ROLE_WRITER))
  then ("writer", "reader")
  else if (xdmp:get-current-roles() = xdmp:role($ROLE_READER))
  then "reader"
  else ()
};
