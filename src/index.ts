import { State } from "./reactivity";
import { viewmodel, ElementKeys, DeepPartial, ElementFrom } from "./viewmodel";

type ViewModelProxyFn<T extends ElementKeys> = (
	selector: string,
	func: () => DeepPartial<ElementFrom<T>>
) => Promise<ElementFrom<T> | null>;

type BaseProxy = {
	[K in ElementKeys]: ViewModelProxyFn<K>;
} & {
	watch: <T>(value: T | (() => T)) => State<T>;
};

const proxyHandler: ProxyHandler<object> = {
	get(_: object, key: string | symbol): unknown {
		if (key === "watch") {
			return <T>(value: T | (() => T)): State<T> => new State(value);
		} else {
			return (
				selector: string,
				func: () => DeepPartial<ElementFrom<ElementKeys>>
			): void => {
				viewmodel(key as ElementKeys, selector, func);
			};
		}
	},
};

const $: BaseProxy = new Proxy({}, proxyHandler) as BaseProxy; // Assert the type of the proxy

export default $;
