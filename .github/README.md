# Copper

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

## Contents

### How to Copper

Everything you need to get productive. If you just want to use Copper and don't need philisophical musings about the state of frontend development and the tension between best-practices and practical coding, this is the only section you need to bother with.

#### Get going NOW

* [Installation and Quick Start](/docs/quick_start.md) - Detailed below. Start here before you go anywhere else.
* [Building a to do list from scratch](./) - The best place to start if you learn best by example. We'll build the traditional to-do list app, and compare it to an equivalent version in Svelte.

#### Client-side reactivity module

* [Copper stores](./) - Inspired by Svelte, stores are at the heart of Copper's client-side reactivity.
* [String interpolation](./) - Inject store values into your markup text.
* [Binding and syncing](/docs/bind_and_sync.md) - Bind store values to HTML element properties and attributes.
* [Dynamic content (client)](./) - Manipulate the DOM client-side with conditional statements and loops without breaking progressive enhancement.

#### Remote reactivity module

* [Dynamic content (via HTTP)](./)

#### Web components module

* [Build and deploy](./)

### Going deeper

The aforementioned philisophical musings about the state of frontend development and the tension between best-practices and practical coding. Here, I'll get into *why* Copper has made the design choices it has, and how you can choose not to care about any of it and use it the way you want to.

* [On frameworks, web trends, lock-in, and modularity](./)
* [On var, hoisting, and scope](./)
* [Web and hybrid-native app patterns: should the front-end process data? Should templating occur on the front-end?](./)
* [Copper and HTMX](./)
* [Copper and your front-end framework](./)
* [Customizing Copper](./)
