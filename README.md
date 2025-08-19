# Manifold

Small reactive toolkit with optional, minimal View Transitions support.

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
