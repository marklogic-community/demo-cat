declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

for $doc in xdmp:directory("/demos/", "infinity")[./jbasic:json/jbasic:maintainer]
let $current-maintainer := $doc/jbasic:json/jbasic:maintainer
let $current-email := $doc/jbasic:json/jbasic:email
let $current-role := "Technical Contact"
let $persons :=
  if($current-maintainer or $current-email) then
    element jbasic:persons {
      attribute type { "array"},
      element jbasic:json {
        attribute type { "object"},
        if($current-maintainer) then
          element jbasic:personName {
            attribute type { "string"},
            $current-maintainer/text()
          }
        else
          ()
        ,
        if($current-email) then
          element jbasic:email {
            attribute type { "string"},
            $current-email/text()
          }
        else
          ()
        ,
        element jbasic:role {
          attribute type { "string"},
          $current-role
        }
      }
    }
  else
    ()

let $op :=
  if($persons) then
    let $ins := xdmp:node-insert-child($doc/jbasic:json, $persons)
    return
      let $del :=
        if($current-email) then
          xdmp:node-delete($current-email)
        else
          ()
      let $del :=
        if($current-maintainer) then
          xdmp:node-delete($current-maintainer)
        else
         ()
      return $del
  else
    ()

return fn:concat("Updated maintainer for ", xdmp:node-uri($doc))
