xquery version "1.0-ml";

module namespace utilities = "http://marklogic.com/demo-cat/utilities";

declare option xdmp:mapping "false";

declare function utilities:send-notification(
  $recipient-name as xs:string,
  $recipient-email as xs:string,
  $subject as  xs:string,
  $message as item()
) as empty-sequence() {
  xdmp:email(
    <em:Message
      xmlns:em="URN:ietf:params:email-xml:"
      xmlns:rf="URN:ietf:params:rfc822:">
      <rf:subject>{$subject}</rf:subject>
      <rf:from>
        <em:Address>
          <em:name>Demo-Cat</em:name>
          <em:adrs>no-reply@catalog.demo.marklogic.com</em:adrs>
        </em:Address>
      </rf:from>
      <rf:to>
        <em:Address>
          <em:name>{$recipient-name}</em:name>
          <em:adrs>{$recipient-email}</em:adrs>
        </em:Address>
      </rf:to>
      <em:content>
        <html xmlns="http://www.w3.org/1999/xhtml">
          <head>
            <title>{$subject}</title>
          </head>
          <body>{$message}</body>
        </html>
      </em:content>
    </em:Message>)

};

(:
Parses the url to get the host information.
:)
declare function utilities:get-url-host(
  $url as xs:string
) as xs:string?
{
  let $tokens := fn:tokenize($url, '/')
  return
    (:
       Host is after second '/'.  Example:
         http://myhost/path

       token[1] = http:
       token[2] =
       token[3] = myhost
       token[4] = path
    :)
    if (fn:count($tokens) gt 2) then
      $tokens[3]
    else
      ()
};

(:
Returns the hostname from the URL used by the referring client for a
REST service request.

Depends upon the xdmp App Server methods to get data from REST request.
:)
declare function utilities:get-referring-host(
) as xs:string?
{
  (: Get host from request header <referer> (when available) :)
  (
    utilities:get-url-host(xdmp:get-request-header('referer', '')),
    xdmp:get-request-header('host')
  )[. ne ''][1]
};

declare function utilities:highlight($doc, $query) {
  cts:highlight($doc, $query, <span class="highlight">{$cts:text}</span>)
};
