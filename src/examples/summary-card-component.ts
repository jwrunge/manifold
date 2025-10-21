import type { ManifoldComponentInstance } from "../component.ts";
import { _makeComponent } from "../component.ts";

export interface SummaryCardProps {
	title: string;
	subtitle: string;
	description: string;
	primaryLabel: string;
	primaryValue: number;
	secondaryLabel: string;
	secondaryValue: number;
	trend: string;
	highlight: boolean;
	accentColor: string;
}

const loadTemplateFromMarkup = async (): Promise<HTMLTemplateElement> => {
	const [markup, styles] = await Promise.all([
		fetch(new URL("./summary-card.html", import.meta.url)).then((res) => {
			if (!res.ok)
				throw new Error(
					`Failed to load summary-card.html: ${res.status}`
				);
			return res.text();
		}),
		fetch(new URL("./summary-card.css", import.meta.url)).then((res) => {
			if (!res.ok)
				throw new Error(
					`Failed to load summary-card.css: ${res.status}`
				);
			return res.text();
		}),
	]);

	const template = document.createElement("template");
	template.innerHTML = markup;

	const styleTag = document.createElement("style");
	styleTag.textContent = styles;
	template.content.prepend(styleTag);

	return template;
};

const summaryCardTemplate = await loadTemplateFromMarkup();

const SummaryCardElement = _makeComponent<SummaryCardProps>(
	"mf-summary-card",
	summaryCardTemplate,
	{
		shadow: "open",
		props: {
			title: { type: "string", required: true },
			subtitle: { type: "string", default: "" },
			description: { type: "string", default: "" },
			primaryLabel: { type: "string", default: "Primary" },
			primaryValue: { type: "number", default: 0, reflect: true },
			secondaryLabel: { type: "string", default: "Secondary" },
			secondaryValue: { type: "number", default: 0, reflect: true },
			trend: { type: "string", default: "" },
			highlight: { type: "boolean", default: false, reflect: true },
			accentColor: {
				type: "string",
				attribute: "accent-color",
				default: "#2563eb",
				reflect: true,
			},
		},
		onConnect(this: ManifoldComponentInstance<SummaryCardProps>) {
			const accent = this.props.accentColor ?? "#2563eb";
			this.updateProps({ accentColor: accent });
		},
	}
);

export type SummaryCardElementInstance = InstanceType<
	typeof SummaryCardElement
>;

declare global {
	interface HTMLElementTagNameMap {
		"mf-summary-card": SummaryCardElement;
	}
}

export default SummaryCardElement;
