import type { StateConstraint } from "./main.ts";
import { proxy } from "./proxy.ts";
import RegEl from "./registry.ts";
import type { Registerable } from "./templating/types.ts";

const stringToTemplate = (markup: string): HTMLTemplateElement => {
	const tpl = document.createElement("template");
	tpl.innerHTML = markup;
	return tpl;
};

export type ComponentInsertMethod = "append" | "prepend" | "replace";

export type SlotValue = Node | string | Array<Node | string>;

export interface ComponentSourceOptions {
	template?: HTMLTemplateElement | string;
	selector?: string;
	url?: string | URL;
	from?: string;
}

export interface RenderComponentOptions {
	target?: string | Element;
	method?: ComponentInsertMethod;
	data?: StateConstraint;
	state?: StateConstraint;
	slots?: Record<string, SlotValue>;
}

export interface RenderComponentResult {
	state: StateConstraint;
	nodes: Node[];
	fragment?: DocumentFragment;
}

export async function renderComponent(
	name: string,
	source: ComponentSourceOptions = {},
	options: RenderComponentOptions = {},
): Promise<RenderComponentResult> {
	const template = await resolveTemplate(name, source);
	const fragment = template.content.cloneNode(true) as DocumentFragment;

	if (options.slots) applySlots(fragment, options.slots);

	const nodes = Array.from(fragment.childNodes);
	const state = createScopedState(options);
	registerNodes(nodes, state);

	const target = resolveTarget(options.target);
	if (target) {
		mountFragment(target, fragment, nodes, options.method);
		return { nodes, state };
	}

	return { fragment, nodes, state };
}

const createScopedState = (
	options: RenderComponentOptions,
): StateConstraint => {
	if (options.state) return options.state;
	const seed = options.data
		? { ...(options.data as Record<string, unknown>) }
		: (Object.create(null) as Record<string, unknown>);
	return proxy(seed) as StateConstraint;
};

const resolveTarget = (target?: string | Element): Element | null => {
	if (!target) return null;
	return typeof target === "string" ? document.querySelector(target) : target;
};

const mountFragment = (
	target: Element,
	fragment: DocumentFragment,
	nodes: Node[],
	method: ComponentInsertMethod = "append",
): void => {
	if (method === "replace") {
		target.replaceChildren(...nodes);
		return;
	}
	if (method === "prepend") {
		target.insertBefore(fragment, target.firstChild);
		return;
	}
	target.appendChild(fragment);
};

const registerNodes = (nodes: Node[], state: StateConstraint): void => {
	for (const node of nodes) {
		if (
			node.nodeType === Node.ELEMENT_NODE &&
			!(node as Element).hasAttribute("data-mf-register")
		) {
			new RegEl(
				node as Registerable,
				state as unknown as Record<string, unknown>,
			);
		}
	}
};

const resolveTemplate = async (
	name: string,
	source: ComponentSourceOptions,
): Promise<HTMLTemplateElement> => {
	if (source.template instanceof HTMLTemplateElement) return source.template;
	if (typeof source.template === "string")
		return stringToTemplate(source.template);

	if (source.url) {
		return loadRemoteTemplate(name, source);
	}

	if (source.selector) {
		const fromSelector = document.querySelector(source.selector);
		if (fromSelector instanceof HTMLTemplateElement) return fromSelector;
		if (fromSelector) {
			return stringToTemplate(fromSelector.innerHTML);
		}
	}

	const fallbacks = [
		source.selector,
		`template[data-component="${name}"]`,
		`template#${name}`,
		`template[name="${name}"]`,
		`#${name}`,
	].filter(Boolean) as string[];

	for (const sel of fallbacks) {
		const match = document.querySelector(sel);
		if (!match) continue;
		if (match instanceof HTMLTemplateElement) return match;
		return stringToTemplate(match.innerHTML);
	}

	throw new Error(`Manifold: Unable to resolve template for "${name}".`);
};

const requestMarkup = async (url: string | URL): Promise<string> => {
	const isNode =
		typeof process !== "undefined" &&
		typeof process.versions?.node !== "undefined";

	if (isNode) {
		if (typeof url === "string" && !/^https?:/i.test(url)) {
			const path = await import("node:path");
			const { readFile } = await import("node:fs/promises");
			const resolved = path.resolve(process.cwd(), url.replace(/^\/+/, ""));
			return readFile(resolved, "utf8");
		}

		if (url instanceof URL && url.protocol === "file:") {
			const { readFile } = await import("node:fs/promises");
			const { fileURLToPath } = await import("node:url");
			return readFile(fileURLToPath(url), "utf8");
		}
	}

	const response = await fetch(url);
	if (!response.ok)
		throw new Error(`HTTP ${response.status} ${response.statusText}`);
	return response.text();
};

const loadRemoteTemplate = async (
	name: string,
	source: ComponentSourceOptions,
): Promise<HTMLTemplateElement> => {
	const markup = await requestMarkup(source.url as string | URL);
	const parser = new DOMParser();
	const remote = parser.parseFromString(markup, "text/html");

	const selectorCandidates = [source.from, source.selector].filter(
		Boolean,
	) as string[];
	if (selectorCandidates.length === 0) {
		selectorCandidates.push(
			`template[data-component="${name}"]`,
			`template#${name}`,
			`template[name="${name}"]`,
		);
	}

	let sourceNode: Element | null = null;
	for (const sel of selectorCandidates) {
		sourceNode = remote.querySelector(sel);
		if (sourceNode) break;
	}

	const tpl = document.createElement("template");
	if (!sourceNode) {
		tpl.innerHTML = remote.body.innerHTML;
		return tpl;
	}

	if (sourceNode instanceof HTMLTemplateElement) {
		tpl.innerHTML = sourceNode.innerHTML;
		return tpl;
	}

	tpl.innerHTML = sourceNode.innerHTML;
	return tpl;
};

const applySlots = (
	fragment: DocumentFragment,
	slots: Record<string, SlotValue>,
): void => {
	for (const [name, value] of Object.entries(slots)) {
		const selector =
			name === "default" ? "slot:not([name])" : `slot[name="${name}"]`;
		const slotNodes = Array.from(fragment.querySelectorAll(selector));
		if (slotNodes.length === 0) continue;
		const replacements = normalizeSlotValue(value);
		for (const slotEl of slotNodes) {
			if (replacements.length === 0) {
				slotEl.remove();
				continue;
			}
			slotEl.replaceWith(...replacements.map((node) => node.cloneNode(true)));
		}
	}
};

const normalizeSlotValue = (value: SlotValue): Node[] => {
	const items = Array.isArray(value) ? value : [value];
	const nodes: Node[] = [];
	for (const item of items) {
		if (typeof item === "string") {
			nodes.push(document.createTextNode(item));
			continue;
		}
		if (item instanceof Node) {
			nodes.push(item);
		}
	}
	return nodes;
};
