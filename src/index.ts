import {
	DeepPartialWithTypedListeners,
	ElementFrom,
	ElementKeys,
} from "./_types.elements";
import { State, flushEffects } from "./reactivity";
import { templ, templEach } from "./templating";

type ViewModelProxyFn<T extends ElementKeys> = <
	U extends DeepPartialWithTypedListeners<ElementFrom<T>>
>(
	selector: string,
	func: () => U &
		Record<
			Exclude<
				keyof U,
				keyof DeepPartialWithTypedListeners<ElementFrom<T>> | "class"
			>,
			never
		> &
		(U extends { style: infer S }
			? S extends Record<string, any>
				? {
						style: Record<
							Exclude<keyof S, keyof CSSStyleDeclaration>,
							never
						> &
							S;
				  }
				: {}
			: {})
) => Promise<ElementFrom<T> | null>;

type BaseProxy = {
	[K in ElementKeys]: ViewModelProxyFn<K>;
} & {
	watch: <T>(value: T | (() => T)) => State<T>;
	each: typeof templEach;
	flushEffects: typeof flushEffects;
};

const applyProperty = (
	element: ElementFrom<ElementKeys>,
	key: string,
	value: unknown
) => {
	if (key === "style") Object.assign(element.style, value);
	else if (key === "class") {
		const ds = element.dataset,
			classes = value as string[];
		const current = ds["mf_classes"]?.split(" ") ?? [];
		const classSet = element.classList;

		// Remove old classes not in new array
		current.forEach((cls) => {
			if (!classes.includes(cls)) classSet.remove(cls);
		});
		// Add new classes
		classes.forEach((cls) => {
			if (!current.includes(cls)) classSet.add(cls);
		});
		ds["mf_classes"] = classes.join(" ");
	} else if (key in element) {
		(element as any)[key] = value;
	} else {
		element.setAttribute(key, String(value));
	}
};

const proxyHandler: ProxyHandler<object> = {
	get(_: object, key: string | symbol): unknown {
		return key === "watch"
			? <T>(value: T | (() => T)): State<T> => new State(value)
			: key === "each"
			? templEach
			: key === "flushEffects"
			? flushEffects
			: <T extends ElementKeys = "element">(
					selector: T,
					func: () => DeepPartialWithTypedListeners<ElementFrom<T>>
			  ): Promise<ElementFrom<T> | null> =>
					templ(selector, (element: Element) => {
						const props = func();
						for (const key in props) {
							const value = props[key as keyof typeof props];
							key[0] === "o" && key[1] === "n"
								? ((element as any)[key] =
										value as EventListener)
								: applyProperty(
										element as ElementFrom<T>,
										key as keyof Element,
										value
								  );
						}
					});
	},
};

export default new Proxy({}, proxyHandler) as BaseProxy;
