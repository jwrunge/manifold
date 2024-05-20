# Copper

## WARNING: This is pre-production software meant for testing only. Full, accurate documentation is coming soon (@1.0.0).

If you are interested in this library and want more information or notification on 1.0.0 release, please contact me @ [jwrunge@gmail.com](mailto:jwrunge@gmail.com).

The documentation below is just a placeholder / brainstorming.😬

---

Reactive state, easy ad-hoc modules, and dynamic markup fragment loading from the server. Wicked small and 0% magic.

Copper is a small, simple, drop-in reactivity library that enables you to propagate value changes to variables and DOM elements.

At xx minified and g-zipped, Copper is xx smaller than [React](https://react.dev/) and xx smaller than [Vue.js](https://vuejs.org/). An equivalent app in [Svelte](https://svelte.dev/) is about x% bigger.

Copper does all of this while staying as invisible as possible: reactive updates are [progressive enhancements](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement) to your core HTML markup; you can better maintain [separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns) between your markup and reactive logic; and your application remains just as flexible, modular, and refactorable as it would be if you didn't use it at all.

Despite its small size, Copper also strives to be modular, so that you are including as little bloat as possible. There are three Copper modules:

* **The client-side reactivity module** - enable reactive linking between Svelte-inspired stores, variables, and the DOM. SIZE???
* **The remote reactivity module** - prompt granular changes in response to HTTP requests, like a stripped-down [htmx](https://htmx.org/). Omit this module if you are using something like htmx already; include it if you need to respond to non-HTML responses from your server. SIZE???
* **The web components module** - easily spin up ad-hoc web components that integrate seamlessly with your existing component library. SIZE???

You may be interested in Copper if:

* Monolithic reactive libraries like React, Vue, or Svelte introduce too much complexity, bloat, or lock-in for your application
* You want to make your MPA more dynamic (maybe you're using [Astro?](https://astro.build/))
* You want your SPA to be more modular (i.e., a single script error doesn't freeze up your whole app)
* You are writing an application that would benefit from reactivity, but don't want to be dependent on build systems, transpilers, and bundlers (are you on the [JSDoc bandwagon?](https://jsdoc.app/))
* You want reactivity that doesn't violate the philosophy of progressive enhancement and falls gently back to plain ol' HTML in the absence of JavaScript

## Documentation

For full documentation, check out the [GitHub repo](https://github.com/jwrunge/Copper).
