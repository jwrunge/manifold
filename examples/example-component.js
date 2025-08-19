// Example custom element using StateBuilder.defineComponent
// Selector-based template approach: keep a <template id="tpl-user-card"> in the DOM.
import StateBuilder from "../dist/manifold.es.js";

// Define a simple component that renders a greeting and a button to change the user's name.
// The component binds to the global state built via StateBuilder.create().
StateBuilder.defineComponent("x-user-card", {
	shadow: false,
	selector: "#tpl-user-card",
});
