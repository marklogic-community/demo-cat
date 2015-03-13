xquery version "1.0-ml";
module namespace trans = "http://marklogic.com/rest-api/transform/stream";

declare function trans:transform(
  $context as map:map,
  $params as map:map,
  $content as document-node()
) as document-node()
{
  let $uri := map:get($context, "uri")
  return (
    map:put($context,'output-type',xdmp:content-type(fn:base-uri($content))),
    if (xdmp:get-request-header('Range')) then
      document {
        let $bytes-requested := fn:substring-after(xdmp:get-request-header('Range'), "bytes=")
        let $sections := fn:tokenize($bytes-requested, ",")
        for $section in $sections
        let $locations := fn:tokenize($section, "\-")[. castable as xs:double] ! xs:double(.)
        let $start-loc := $locations[1]
        let $end-loc :=
          if (fn:contains($section, "-")) then
            $locations[2]
          else
            $start-loc
        return
          if (fn:exists($end-loc)) then
            xdmp:subbinary(
              $content/binary(),
              $start-loc,
              ($end-loc - $start-loc) + 1
            )
          else
            xdmp:subbinary(
              $content/binary(),
              $start-loc
            )
      }
    else
      $content
  )
};
