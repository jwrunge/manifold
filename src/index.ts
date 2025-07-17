import {
	DeepPartialWithTypedListeners,
	ElementFrom,
	ElementKeys,
} from "./_types.elements";
import { State } from "./State";
import { RegEl } from "./RegisteredElement";

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
) => void;

type BaseProxy = {
	[K in ElementKeys]: ViewModelProxyFn<K>;
} & {
	watch: <T>(value: T | (() => T)) => State<T>;
	if: (mfId: string, condition: State<unknown>) => void;
	elseif: (mfId: string, condition: State<unknown>) => void;
	else: (mfId: string) => void;
	each: (mfId: string, iterable: State<Array<unknown>>) => void;
};

const registrar = async (
	mfId: string,
	cb: (element: HTMLElement | SVGElement | MathMLElement) => void,
	nodeName?: string
) => {
	const register = () => {
		const elements = document.querySelectorAll(`[data-mf=${mfId}]`);
		elements.forEach((element) => {
			if (!nodeName || element.nodeName === nodeName)
				cb(element as HTMLElement | SVGElement | MathMLElement);
			else
				console.warn(
					`Element data-mf="${mfId}" is not a <${nodeName}> element.`
				);
		});
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", register);
	} else {
		register();
	}
};

const applyProperty = (
	element: ElementFrom<ElementKeys>,
	key: string,
	value: unknown
) => {
	if (key === "style") {
		Object.assign(element.style, value);
	} else if (key === "class") {
		const ds = element.dataset;
		const classes = value as string[];
		const current = ds["mf_classes"]?.split(" ") ?? [];
		const classSet = element.classList;

		current.forEach(
			(cls) => !classes.includes(cls) && classSet.remove(cls)
		);
		classes.forEach((cls) => !current.includes(cls) && classSet.add(cls));
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
			: key === "if"
			? (mfId: string, condition: State<unknown>) =>
					registrar(
						mfId,
						(element) => {
							RegEl.register(element, { show: condition });
						},
						"MF-IF"
					)
			: key === "elseif"
			? (mfId: string, condition: State<unknown>) =>
					registrar(
						mfId,
						(element) => {
							RegEl.register(element, {
								else: true,
								show: condition,
							});
						},
						"MF-ELSE-IF"
					)
			: key === "else"
			? (mfId: string) =>
					registrar(
						mfId,
						(element) => {
							RegEl.register(element, { else: true });
						},
						"MF-ELSE"
					)
			: key === "each"
			? (mfId: string, iterable: State<Array<unknown>>) =>
					registrar(
						mfId,
						(element) => {
							RegEl.register(element, { each: iterable });
						},
						"MF-EACH"
					)
			: <T extends ElementKeys = "element">(
					selector: T,
					func: () => DeepPartialWithTypedListeners<ElementFrom<T>>
			  ) =>
					registrar(selector, (element: Element) => {
						State.prototype.effect(() => {
							const props = func();
							for (const key in props) {
								const value = props[key as keyof typeof props];
								if (key[0] === "o" && key[1] === "n") {
									(element as any)[key] =
										value as EventListener;
								} else {
									applyProperty(
										element as ElementFrom<T>,
										key as keyof Element,
										value
									);
								}
							}
						});
					});
	},
};

export default new Proxy({}, proxyHandler) as BaseProxy;
