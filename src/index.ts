import { Store } from "./reactivity";
import { viewmodel, ElementKeys, DeepPartial, ElementFrom } from "./viewmodel";

type ProxyFunction<T extends ElementKeys> = (
	selector: string,
	func: () => DeepPartial<ElementFrom<T>>
) => void;

type ViewModelProxy = {
	[K in ElementKeys]: ProxyFunction<K>;
} & {
	watch: <T>(value: T | (() => T)) => Store<T>;
};

const proxyHandler: ProxyHandler<object> = {
	get(_: object, key: string | symbol): unknown {
		if (key === "watch") {
			return <T>(value: T | (() => T)): Store<T> => new Store(value);
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

const $: ViewModelProxy = new Proxy({}, proxyHandler) as ViewModelProxy; // Assert the type of the proxy

export default $;
