xquery version "1.0-ml";
module namespace trns = "http://marklogic.com/transform/to-json";

import module namespace jbasic="http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";

declare function trns:transform(
  $content as map:map,
  $context as map:map
) as map:map*
{
  map:put(
    $content,
    'value',
    document { xdmp:to-json(jbasic:transform-to-json(map:get($content, 'value'))) }
  ),
  $content
};
