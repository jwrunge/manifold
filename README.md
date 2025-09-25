# Manifold

Small reactive toolkit with optional, minimal View Transitions support.

## HTML fetching helper: fetchContent

Fetch remote HTML and insert it into the current document with optional View Transitions and asset (script/style) injection.

Quick example:

```ts
import { fetchContent } from "./src/fetch";

await fetchContent("/snippets/snippet-a.html", {
	from: "#payload", // optional subselector inside the fetched HTML
	to: "#remote-to", // required target in the current document
	method: "replace", // "replace" | "append" | "prepend"
	addTransitionClass: "fade", // optional: pair old/new with this class for VT CSS
	insertScripts: true, // optional: execute/inject scripts (deduped)
	insertStyles: true, // optional: inject styles/links (deduped)
});
```

Options:

-   from: optional CSS selector scoped to the fetched document; defaults to its body.
-   to: required CSS selector in the current document; insertion target.
-   method: one of "replace" (clear and insert), "append", or "prepend".
-   addTransitionClass: when set, both outgoing (on replace) and incoming top-level elements are given this class so your VT CSS (e.g., ::view-transition-old(\*.fade)) applies.
-   insertScripts: boolean or selector[] to filter which scripts to run/inject; external and inline scripts are deduped.
-   insertStyles: boolean or selector[] to filter which styles/links to inject; deduped by href/content.

Notes:

-   View Transitions are used only if the environment supports `document.startViewTransition`. The helper pairs outgoing/incoming elements when method = "replace" so both fade/motion can apply.
-   Inserted DOM is auto-registered by Manifold’s MutationObserver; anything with data-mf-\* becomes live without manual wiring.
-   In tests/Node environments, local file URLs and inline script execution are supported to simulate browser behavior; browsers use standard fetch/DOM insertion paths.

Minimal VT CSS (optional) for a simple fade with `addTransitionClass: "fade"`:

```css
/* Disable page-wide fading so only targeted elements animate */
::view-transition-old(root),
::view-transition-new(root) {
	animation: none;
}

/* Fade-in new */
::view-transition-new(*.fade) {
	animation: 180ms ease both fade-in;
}

/* Fade-out old */
::view-transition-old(*.fade) {
	animation: 180ms ease both fade-out;
}

@keyframes fade-in {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}
@keyframes fade-out {
	from {
		opacity: 1;
	}
	to {
		opacity: 0;
	}
}
```

## View Transitions behavior

Manifold only starts a View Transition for batches that include visible DOM changes:

-   Conditional show/hide and :each add/remove request a transition for that microtask batch.
-   Reorders are synchronous (no transition), to avoid animating unchanged items.
-   The library doesn’t inject any CSS or element names; your app controls all animations.

Under the hood, effect flushing is wrapped in `document.startViewTransition` only when a visible change occurred during the batch. No element is named by default.

### Disable the page-wide root cross-fade (recommended)

Browsers apply a root cross-fade by default. If you don’t want unrelated content to fade, disable it in your app CSS:

```css
/* Disable page-wide fading */
::view-transition-old(root),
::view-transition-new(root) {
	animation: none;
}
```

### Opt into shared-element transitions (optional)

By default, only the page-wide root transition runs. If you want shared-element motion, give elements a `view-transition-name` in your own code and style it:

```css
/* Example: style a named element */
::view-transition-group(my-name) {
	animation-duration: 180ms;
	animation-timing-function: ease;
}
::view-transition-old(my-name),
::view-transition-new(my-name) {
	animation: none; /* disable per-element cross-fade for a motion-only feel */
}
```

Notes:

-   Use naming only on elements you want to animate; leave others unnamed.
-   If you don’t provide CSS, browser defaults apply.

## Development

-   Build: `npm run build`
-   Test: `npm test`

All tests should pass. Performance benchmarks are included in the test output for reference.
