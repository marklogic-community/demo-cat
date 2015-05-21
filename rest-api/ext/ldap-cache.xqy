xquery version "1.0-ml";

module namespace ext = "http://marklogic.com/rest-api/resource/ldap-cache";

declare
function ext:delete(
    $context as map:map,
    $params  as map:map
) as document-node()?
{
  xdmp:eval('
    xquery version "1.0-ml";
    
    import module namespace sec = "http://marklogic.com/xdmp/security" 
      at "/MarkLogic/security.xqy";
  
    sec:external-security-clear-cache("marklogic-ldap")
  ', (), <options xmlns="xdmp:eval"><database>{xdmp:database("Security")}</database></options>)
};
