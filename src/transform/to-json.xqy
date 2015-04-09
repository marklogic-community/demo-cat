xquery version "1.0-ml";
module namespace trns = "http://marklogic.com/transform/to-json";

import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";

declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare function trns:transform(
  $content as map:map,
  $context as map:map
) as map:map*
{
  let $doc := map:get($content, 'value')
  let $_ :=
    map:put(
      $content,
      'value',
      document {
        if ($doc/jbasic:json) then
          xdmp:to-json(json:transform-to-json($doc))
        else
          $doc
      }
    )
  return
    $content
};
