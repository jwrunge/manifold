import { css, html, State } from "./dist/manifold.js";

// TS-first component definition
const MyCounter = State.component({
	name: "my-counter",
	template: html`
		<div class="counter">
			<button @click="count--">-</button>
			<span class="count">\${count}</span>
			<button @click="count++">+</button>
		</div>
	`,
	styles: css`
		.counter {
			display: flex;
			align-items: center;
			gap: 1rem;
			padding: 1rem;
			border: 1px solid #ccc;
			border-radius: 8px;
		}

		button {
			padding: 0.5rem 1rem;
			font-size: 1.2rem;
			cursor: pointer;
			background: #007bff;
			color: white;
			border: none;
			border-radius: 4px;
		}

		button:hover {
			background: #0056b3;
		}

		.count {
			font-size: 2rem;
			font-weight: bold;
			min-width: 3rem;
			text-align: center;
		}
	`,
	state: {
		count: 0,
	},
});

// Register the component
MyCounter.register();

// Or you can derive additional state
const MyAdvancedCounter = MyCounter.derive(
	"doubled",
	(state) => state.count * 2,
).derive("tripled", (state) => state.count * 3);

MyAdvancedCounter._setTagName("my-advanced-counter").register();
