import type { ManifoldComponentInstance } from "../component.ts";
import { _makeComponent } from "../component.ts";

/**
 * Props supported by the `<mf-counter-demo>` custom element.
 */
export interface CounterProps {
	/** Heading text displayed above the counter value. */
	label: string;
	/** Current numeric value shown in the component. */
	count: number;
	/** Increment/decrement amount applied when the buttons are clicked. */
	step: number;
	/** When true the component applies a visual highlight state. */
	highlight: boolean;
	/** Accent color used for borders and buttons. Accepts any valid CSS color. */
	accentColor: string;
}

const template = document.createElement("template");
template.innerHTML = `
	<style>
		:host {
			display: inline-block;
			font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			margin: 0.5rem;
		}

		.counter {
			background: #ffffff;
			border-radius: 0.9rem;
			border: 2px solid var(--accent-color, #4c6ef5);
			box-shadow: 0 14px 30px rgb(15 23 42 / 0.14);
			color: #212529;
			min-width: 14rem;
			padding: 1.25rem 1.35rem;
			transition: box-shadow 160ms ease;
		}

		.counter.highlighted {
			box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent-color, #4c6ef5) 30%, transparent);
		}

		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.75rem;
			font-weight: 600;
			margin-bottom: 0.9rem;
		}

		.value {
			font-size: 1.9rem;
			font-variant-numeric: tabular-nums;
		}

		.controls {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}

		button {
			align-items: center;
			background: var(--accent-color, #4c6ef5);
			border: none;
			border-radius: 0.65rem;
			color: #ffffff;
			cursor: pointer;
			display: inline-flex;
			font: inherit;
			font-weight: 600;
			justify-content: center;
			letter-spacing: 0.02em;
			padding: 0.45rem 0.85rem;
			transition: transform 120ms ease, box-shadow 120ms ease;
		}

		button:hover {
			transform: translateY(-1px);
		}

		button:active {
			transform: translateY(0);
			box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.3);
		}

		.meta {
			margin-top: 1rem;
			font-size: 0.85rem;
			opacity: 0.75;
		}

		.meta strong {
			font-weight: 700;
		}
	</style>

	<article
		class="counter"
		:class:highlighted="highlight"
		:style:--accent-color="accentColor"
	>
		<div class="header">
			<span class="label">\${label}</span>
			<span class="value">\${count}</span>
		</div>

		<div class="controls">
			<button
				type="button"
				data-mf-onclick="() => count = count - step"
			>
				− Step
			</button>
			<button
				type="button"
				data-mf-onclick="() => count = count + step"
			>
				+ Step
			</button>
		</div>

		<p class="meta">Step size: <strong>\${step}</strong></p>
		<p class="meta" :if="highlight">Highlight is active!</p>
	</article>
`;

const CounterElement = _makeComponent<CounterProps>(
	"mf-counter-demo",
	template,
	{
		shadow: "open",
		props: {
			label: { type: "string", default: "Counter" },
			count: { type: "number", default: 0, reflect: true },
			step: { type: "number", default: 1, reflect: true },
			highlight: { type: "boolean", default: false, reflect: true },
			accentColor: {
				type: "string",
				attribute: "accent-color",
				default: "#4c6ef5",
				reflect: true,
			},
		},
		onConnect(this: ManifoldComponentInstance<CounterProps>) {
			// Ensure the accent CSS custom property is initialised for browsers without attribute reflection support.
			const accent =
				this.getAttribute("accent-color") ?? this.props.accentColor;
			if (accent) {
				this.updateProps({ accentColor: accent });
			}
		},
	}
);

export type CounterElementInstance = InstanceType<typeof CounterElement>;
export const COUNTER_ELEMENT_TAG = "mf-counter-demo" as const;

declare global {
	interface HTMLElementTagNameMap {
		"mf-counter-demo": InstanceType<typeof CounterElement>;
	}
}

export default CounterElement;
