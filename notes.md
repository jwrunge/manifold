# TO DO

-   History API - set up map of states to reference on popstate / routing
-   Throbber support
-   Supporting props: loop over observedAttributes and replace $:{} like in templs?
-   Fix transition spacer

OK, so I think I've figured out the issue of scope and passing a reference to the calling script to the store creation function.

Calling script: let x = $watch(someValue) --> $watch in Store.ts can call document.currentScript and get a reference to the calling script IF x IS DEFINED IN THE TOP LEVEL.

It's also a safe bet that if document.currentScript is NULL, the function was not called at the top level or is executing asyncronously, so we can throw a fatal error.

Now, we can add the store to a WeakMap<HTMLScriptElement, Map<string, Store>>

We can also look at the script text and get the variable name to set as the store name -- but is that actually worth it?

ANOTHER IDEA

Stores are tied to elements in a WeakMap<HTMLElement, Store>?
