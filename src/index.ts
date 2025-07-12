import {
	DeepPartial,
	DeepPartialWithTypedListeners,
	ElementFrom,
	ElementKeys,
} from "./_types.elements";
import { State } from "./reactivity";
import { templEach } from "./templating";
import { viewmodel } from "./viewmodel";

type ViewModelProxyFn<T extends ElementKeys> = (
	selector: string,
	func: () => DeepPartial<ElementFrom<T>>
) => Promise<ElementFrom<T> | null>;

type BaseProxy = {
	[K in ElementKeys]: ViewModelProxyFn<K>;
} & {
	watch: <T>(value: T | (() => T)) => State<T>;
	each: typeof templEach;
};

const proxyHandler: ProxyHandler<object> = {
	get(_: object, key: string | symbol): unknown {
		switch (key) {
			case "watch":
				return <T>(value: T | (() => T)): State<T> => new State(value);
			case "each":
				return templEach;
			default:
				return (
					selector: string,
					func: () => DeepPartialWithTypedListeners<
						ElementFrom<ElementKeys>
					>
				): void => {
					viewmodel(key as ElementKeys, selector, func);
				};
		}
	},
};

const $: BaseProxy = new Proxy({}, proxyHandler) as BaseProxy; // Assert the type of the proxy

export default $;
