import { scopeProxy } from "./proxy";

type Registerable = HTMLElement | SVGElement | Element;

const logicAttributes = [
	"if",
	"elseif",
	"else",
	"each",
	"await",
	"then",
	"catch",
];

const supportedPrefixes = ["data-mf.", ":"];

const throwError = (msg: string, cause?: unknown) => {
	throw new Error(msg, { cause });
};

export default class RegEl {
	static #registry: Map<Registerable, RegEl> = new Map();
	state: Record<string, unknown>;

	static register(el: Registerable, state: Record<string, unknown>) {
		if (RegEl.#registry.has(el))
			throwError("Element already registered", el);
		RegEl.#registry.set(el, new RegEl(el, state));

		// Register children (which register their own children)
		for (const child of el.children) {
			if (!child.getAttribute("data-mf-ignore")) {
				RegEl.register(child as Registerable, state);
			}
		}
	}

	constructor(el: Registerable, state: Record<string, unknown>) {
		this.state = scopeProxy(state);
		const wasRegistered = new Set<string>();

		for (const { name, value } of el.attributes) {
			const logicName = name.replace(/^data-mf\./, "").replace(/^:/, "");

			if (wasRegistered.has(logicName))
				throwError(`Attribute ${logicName} duplicate`, el); // Prevent double registration
			let outerBreak = false;

			for (const logicAttr of logicAttributes) {
				for (const prefix of supportedPrefixes) {
					if (name === `${prefix}${logicAttr}`) {
						if (logicName === "style") {
							// Handle style logic attributes
							// Don't try to throw on duplicate

							outerBreak = true;
							break;
						}

						if (logicName === "class") {
							// Handle class logic attributes
							// Don't try to throw on duplicate

							outerBreak = true;
							break;
						}

						// Handle logic attributes

						outerBreak = true;
						wasRegistered.add(logicName);
					}
				}
			}

			if (outerBreak) continue;

			// Handle random other attributes
			for (const prefix of supportedPrefixes) {
				if (name.startsWith(prefix)) {
					if (logicName.startsWith("on")) {
						// Handle events
						wasRegistered.add(logicName);
					} else {
						wasRegistered.add(logicName);
					}
				}
			}
		}
	}

	onEachAttrUpdate(el: Registerable) {
		// Only when array length changes or on init -- Register children
	}

	onShowUpdate(el: Registerable) {}

	onAsyncUpdate(el: Registerable) {
		// Handle async updates, e.g. :await
	}
}
