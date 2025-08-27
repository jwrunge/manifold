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
] as const;

const supportedPrefixes = ["data-mf.", ":"] as const;
const matchPrefix = new RegExp(`^${supportedPrefixes.join("|")}`);

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
			const logicName = name.replace(matchPrefix, "");

			if (wasRegistered.has(logicName))
				throwError(`Attribute ${logicName} duplicate`, el); // Prevent double registration
			let outerBreak = false;

			// Handle predefined logic
			for (const logicAttr of logicAttributes) {
				for (const prefix of supportedPrefixes) {
					if (name === `${prefix}${logicAttr}`) {
						// Handle logic attributes
						outerBreak = true; // Don't look for any more attributes with this prefix
						wasRegistered.add(logicName); // Enable throw on duplicate

						break; // Matched supportedPrefixes; break inner loop
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
						// Handle class and style bindings
						const [primaryName, focus] = logicName.split(":", 2);

						if (focus) {
							// Handle style or class attributes with specified focus
							if (primaryName === "class") {
							} else if (primaryName === "style") {
							} else throwError(`Unsupported bind focus: ${}`, el);
						}

						wasRegistered.add(logicName);
					}

					break;
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
