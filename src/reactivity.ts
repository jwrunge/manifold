import { isEqual } from "./equalityCheck";

let currentEffect: Effect | null = null;

class Effect {
	#cleanupFns: (() => void)[] = [];
	#active = true;

	constructor(private fn: () => void) {}

	run() {
		if (this.#active) {
			this.#stopDependencies();
			currentEffect = this;

			try {
				this.fn();
			} finally {
				currentEffect = null;
			}
		}
	}

	addDependency(cleanup: () => void) {
		this.#cleanupFns.push(cleanup);
	}

	#stopDependencies() {
		this.#cleanupFns.forEach((cleanup) => cleanup());
		this.#cleanupFns = [];
	}

	stop() {
		this.#active = false;
		this.#stopDependencies();
	}
}

export class Store<T = unknown> {
	#value!: T;
	#reactive!: T; // proxied
	#derive?: () => T;
	#downstream = new Set<Effect>();

	static #proxyInstances = new WeakSet<object>();
	static #effectMap = new WeakMap<
		object,
		Map<string | symbol, Set<Effect>>
	>();

	constructor(value: T | (() => T)) {
		if (typeof value === "function") {
			this.#derive = value as () => T;
			const deriveEffect = new Effect(() => {
				this.#updateInternalValue(this.#derive!());
			});

			this.#downstream.add(deriveEffect);
			deriveEffect.run();
		} else {
			this.#updateInternalValue(value);
		}
	}

	#updateInternalValue(newValue: T) {
		if (isEqual(this.#value, newValue)) return;
		this.#value = newValue;
		this.#reactive = Store.#observable(newValue);
		for (const effect of new Set(this.#downstream)) effect.run();
	}

	static #track(target: object, key: string | symbol) {
		if (currentEffect) {
			let deps = Store.#effectMap.get(target);
			if (!deps) {
				deps = new Map();
				Store.#effectMap.set(target, deps);
			}
			let effects = deps.get(key);
			if (!effects) {
				effects = new Set();
				deps.set(key, effects);
			}
			effects.add(currentEffect);
			currentEffect.addDependency(() => {
				if (currentEffect) effects?.delete(currentEffect);
				if (effects?.size === 0) {
					deps.delete(key);
					if (deps.size === 0) {
						Store.#effectMap.delete(target);
					}
				}
			});
		}
	}

	static #trigger(target: object, key: string | symbol) {
		const deps = Store.#effectMap.get(target);
		if (!deps) return;
		const effectsToRun = deps.get(key);
		if (effectsToRun) {
			new Set(effectsToRun).forEach((effect) => effect.run());
		}
	}

	static #observable = <T>(obj: T): T => {
		if (!obj || typeof obj !== "object" || Store.#proxyInstances.has(obj))
			return obj;

		const proxy = new Proxy(obj, {
			get(target, key, receiver) {
				Store.#track(target, key);
				return Store.#observable(Reflect.get(target, key, receiver));
			},
			set(target, key, value, receiver) {
				if (isEqual(Reflect.get(target, key, receiver), value))
					return true;

				const result = Reflect.set(target, key, value, receiver);
				if (result) Store.#trigger(target, key);

				return result;
			},
			deleteProperty(target, key) {
				const hadProperty = Reflect.has(target, key);
				const result = Reflect.deleteProperty(target, key);
				if (result && hadProperty) Store.#trigger(target, key);
				return result;
			},
		});

		Store.#proxyInstances.add(proxy);
		return proxy;
	};

	get value(): T {
		if (currentEffect) {
			this.#downstream.add(currentEffect);
			currentEffect.addDependency(() => {
				this.#downstream.delete(currentEffect!);
			});
		}

		return this.#reactive;
	}

	set value(newValue: T) {
		if (this.#derive)
			throw new Error("Cannot set value on a derived store.");
		if (!isEqual(this.#value, newValue))
			this.#updateInternalValue(newValue);
	}

	effect(fn: () => void) {
		const effect = new Effect(fn);
		effect.run();
		return () => effect.stop();
	}
}
