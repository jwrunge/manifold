* Account for objects with properties, arrays, maps, etc. in stores


cu-bind="[STORE_NAME:ATTRIBUTE|ATTRIBUTE2 [ingressFunction]] [sync:EVENT|EVENT2 [egressFunction]]"  //Front-end reactivity

cu-bind="store1:value processInput sync:change|keydown processOutput"

//Backend connection
cu-bind="post(/media/image):src assembleImageLink sync:change|keydown getImageBytes"
cu-bind="post(/media/image) post:change|keydown getImageBytes"


cu-bind=(
  [SOURCE][:ATTRIBUTES]
  [ingressFunction]
  [sync:EVENTS]
  [egressFunction]
)

PATTERNS:
  store1:value                                            //simple 1-way bind 
  store1:value ingressFunction                            //1-way bind with input processing
  sync:event egressFunction                               //1-way output bind with output processing 
  store1:value sync:event                                 //Two-way binding to the store 
  store1:value ingressFunction sync:event egressFunction  //Two-way binding with input and output processing
  store1 ingressFunction                                  //Run function on store change 
  get(url):value                                          //GET from URL and put in value
  get(url):value ingressFunction                          //GET from URL, process input, and put in value
  get(url):value post:event                               //GET from URL, POST change to URL on event
  get(url):value post:event egressFunction                //Get from URL, POST processed change to URL


MAYBE HANDLE HTTP LIKE THIS???

Replace, append, prepend:
<div data-get="/user" data-replace>                     // Get data from /user, replace current div
<div data-post="assembleUser() -> /user" data-append>   // Post the result of assembleUser() to /user and append the response
<form data-post="assembleUser() -> /user" data-prepend> // Post the result of assembleUser (processing form data) to /user and prepend response

Store result
<div data-get="/user" data-resolve="process()-> store1">// Get data from /user, process the result and put it into store1