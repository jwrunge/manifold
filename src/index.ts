import {
	DeepPartialWithTypedListeners,
	ElementFrom,
	ElementKeys,
} from "./_types.elements";
import { State } from "./reactivity";
import { templ, templEach } from "./templating";

type ViewModelProxyFn<T extends ElementKeys> = (
	selector: string,
	func: () => DeepPartialWithTypedListeners<ElementFrom<T>>
) => Promise<ElementFrom<T> | null>;

type BaseProxy = {
	[K in ElementKeys]: ViewModelProxyFn<K>;
} & {
	watch: <T>(value: T | (() => T)) => State<T>;
	each: typeof templEach;
};

const applyProperty = (
	element: ElementFrom<ElementKeys>,
	key: keyof ElementFrom<ElementKeys>,
	value: unknown
) => {
	if (key === "style") Object.assign(element.style, value);
	else if (key === "class") {
		const classMap = new Set(
			element.dataset["mf_classes"]?.split(" ") ?? []
		);
		for (const className of value as string[]) {
			if (!classMap.has(className)) {
				element.classList.add(className);
				classMap.add(className);
			}
		}
		for (const className of classMap) {
			if (!(value as string[]).includes(className)) {
				element.classList.remove(className);
				classMap.delete(className);
			}
		}
		element.dataset["mf_classes"] = [...classMap].join(" ");
	} else if (key in element) {
		(element as any)[key] = value;
	} else {
		element.setAttribute(key, String(value));
	}
};

const proxyHandler: ProxyHandler<object> = {
	get(_: object, key: string | symbol): unknown {
		switch (key) {
			case "watch":
				return <T>(value: T | (() => T)): State<T> => new State(value);
			case "each":
				return templEach;
			default:
				return <T extends ElementKeys = "element">(
					selector: string,
					func: () => DeepPartialWithTypedListeners<ElementFrom<T>>
				): Promise<ElementFrom<T> | null> =>
					templ(selector, (element: Element) => {
						const props = func();

						for (const key in props) {
							const value = props[key as keyof typeof props];

							if (key.startsWith("on")) {
								(element as any)[key] = value as EventListener;
							} else {
								applyProperty(
									element as ElementFrom<T>,
									key as keyof Element,
									value
								);
							}
						}
					});
		}
	},
};

const $: BaseProxy = new Proxy({}, proxyHandler) as BaseProxy; // Assert the type of the proxy

export default $;
