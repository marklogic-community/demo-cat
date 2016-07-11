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
    if (contains($attachment/mimeType/data(), "officedocument")
      or $attachment/mimeType/data() = "application/pdf"
      or (contains($attachment/mimeType/data(), "application/octet-stream") and fn:ends-with($attachment/attachmentName/data(), ".docx", "http://marklogic.com/collation/en/S1")))
    then (
      let $attachmentdoc := doc($attachment/uri/data())
      let $converted :=
        (:check if attachment exists at uri and has no filtered data yet:)
        (: node replacement keeps retriggering the trigger :)
        if (not(empty($attachmentdoc)) and empty(($doc/array-node("memos"))/object-node()[title=$attachment/attachmentName/data()]))
          then (
            (:if no filter yet, do filter then save to document as a new memo:)
            let $filtered := xdmp:quote(
              if ($attachment/mimeType/data() = "application/pdf")
              then (
                  xdmp:pdf-convert(
                     $attachmentdoc,
                     $attachment/attachmentName
                  )[2]
                  )
              else (
                (xdmp:document-filter($attachmentdoc)
                )
              )
            )

            let $_ := xdmp:log('$attachment/attachmentName: ' || $attachment/attachmentName/data())
            let $node := object-node {
                "title": $attachment/attachmentName/data(),
                "body": $filtered,
                "converted": "true"
              }
            let $insert :=
            if (empty($doc/array-node("memos")))
            then (
              let $items := xdmp:from-json($doc)
              let $put := map:put($items, "memos", array-node {($node)})
              return xdmp:document-insert($trgr:uri, xdmp:to-json($items))
            )
            else (
              xdmp:node-insert-child(
                $doc/array-node("memos"),
                $node
              )
            )

            return ()
          )
          else ()
      return ())
    else ()
  return ()

return xdmp:log(fn:concat("End adding scraped data for ", $trgr:uri))