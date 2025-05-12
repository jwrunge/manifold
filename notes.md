# TO DO

- History API - set up map of states to reference on popstate / routing
- Throbber support
- Supporting props: loop over observedAttributes and replace $:{} like in templs?
- Fix transition spacer

## Guiding Questions

- What are the primary benefits of front-end frameworks? If we can identify them, we can make a library that addresses the pain points of web application development while removing the cruft and bloat.
- What tradeoffs are being made between using compiled frameworks like Svelte (which are light and fast) and slower, heavier runtime frameworks like React? Understandin this means we can make appropriate decisions about how to implement runtime logic that is as small and fast as possible.
- What are the pain points of switching frameworks or updating framework versions? Why is it such a burden to refactor code? Knowing this will help us make a library that is flexible, replaceable, and closer to our vanilla toolset.
- What do we lose when we adopt a framework? How does straying from the default toolset hurt us or add complexity?
- What babies should we take care not to throw out with the bathwater? What advancements and improvements to our toolset seem bound to framework use, and how can we make sure we don't lose them?

## Findings

1. The primary benefits of front-end frameworks are:
   - Component-based architecture
   - State management and reactivity

This is a smaller list than I expected, but the truth is that the main things that frameworks do is to improve the experience of UI development, specifically HTML development. Frameworks largely complicate JavaScript in order to make HTML more dynamic. Frameworks provide hooks into the HTML markup to ensure that it is kept up-to-date based on the state of the application.

This means that any required interaction with JavaScript that our library performs should be designed with updating UI in mind, and that as few such reactions as possible should be *required* to build an application.

2. The tradeoffs between compiled frameworks and runtime frameworks are obvious: typically, you trade size and speed for flexibility and (potentially) simplified tooling. An additional benefit of a compiled framework like Svelte is that you have the luxury of working directly with HTML-like syntax without having to rely on JSX. Vue seems to strike a good balance here; it is both a relatively lightweight and performant runtime framework, but also allows the developer to work directly with HTML templates.

Vue, in fact, proves that you can have a performant runtime framework that is also very flexible. Vue's template syntax is very similar to HTML, and it allows you to use JavaScript directly in the templates. This means that you can write your templates in a way that is very similar to how you would write them in HTML, but with the added benefit of being able to use JavaScript directly in the templates. While Svelte served as a primary inspiration (and catalyst) for this project, Vue is truly a noteworthy forerunner.

3. .svelte.ts files! >:-|
4. JavaScript, HTML, and CSS have come a long way since we first started trying to augment our front-end toolset with MooTools and JQuery; even since we first started building rich web-based applications in the early days of Angular and React. In an unmodified modern setting, we can now use:

    - ES modules in the browser
    - CSS variables
    - CSS nesting syntax
    - HTML custom elements and shadow DOM
    - Widely-available single- and cross-document view transitions