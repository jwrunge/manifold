// Example custom element using StateBuilder.defineComponent
// Selector-based template approach: keep a <template id="tpl-user-card"> in the DOM.
import StateBuilder from "../dist/manifold.es.js";

// Define a simple component that renders a greeting and toggles active state.
// The component binds to the global state via prototype, but keeps its own local props.
StateBuilder.defineComponent("x-user-card", {
	shadow: false,
	selector: "#tpl-user-card",
	// Expose these as host properties for imperative usage: el.userId, el.active, el.name, el.role
	props: ["userId", "active", "name", "role"],
});
