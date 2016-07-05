xquery version "1.0-ml";

(:import module namespace demo = "http://marklogic.com/demo-cat/demo-model"
  at "/lib/demo-model.xqy";
:)

declare namespace trgr = "http://marklogic.com/xdmp/triggers";
declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

declare option xdmp:mapping "false";

declare variable $trgr:uri as xs:string external;

let $_ := xdmp:log(fn:concat("Start adding scraped data for ", $trgr:uri))

let $doc := doc($trgr:uri)

let $attachments := $doc//attachments
let $validtypes := ("officedocument", "application/pdf")
let $convert := for $attachment in $attachments
  (:check type:)
  let $convertible :=
    if (contains($attachment/mimeType/data(), "officedocument") or $attachment/mimeType/data() = "application/pdf")
    then (
      let $attachmentdoc := doc($attachment/uri/data())
      let $converted :=
        (:check if attachment exists at uri and has no filtered data yet:)
        (: node replacement keeps retriggering the trigger :)
        if (not(empty($attachmentdoc)) and empty($attachment/filtered/data()))
          then (
            (:if no filter yet, do filter then save to document:)
            let $filtered :=
              if ($attachment/mimeType/data() = "application/pdf")
              then (
                fn:string(
                  xdmp:pdf-convert(
                     $attachmentdoc,
                     $attachment/attachmentName
                  )
                  )
                )
              else (
                fn:string(xdmp:document-filter($attachmentdoc))
                )

            let $_ := xdmp:log('$attachment/uri: ' || $attachment/uri/data())
            let $node := object-node {"filtered": $filtered }/filtered
            let $insert :=
                xdmp:node-insert-child($attachment, $node)
            return ()
          )
          else ()
      return ())
    else ()
  return ()

return xdmp:log(fn:concat("End adding scraped data for ", $trgr:uri))
