export class Store<T = unknown> {
	#value: T;
	#reactive: T; // proxied
	#downstream = new Set<() => void>();
	static #currentEffect: (() => void) | null = null;
	static #effectMap = new WeakMap<
		object,
		Map<string | symbol, Set<() => void>>
	>();

	constructor(value: T) {
		this.#value = value;
		this.#reactive = Store.#watch(this.#value);
	}

	static #watch = <T>(obj: T): T => {
		return !obj || typeof obj !== "object"
			? obj
			: new Proxy(obj, {
					get(target, key, receiver) {
						// Record dependency
						if (Store.#currentEffect) {
							let depsMap = Store.#effectMap.get(target);
							if (!depsMap) {
								depsMap = new Map();
								Store.#effectMap.set(target, depsMap);
							}
							let dep = depsMap.get(key);
							if (!dep) {
								dep = new Set();
								depsMap.set(key, dep);
							}
							dep.add(Store.#currentEffect);
						}

						const res = Reflect.get(target, key, receiver);
						if (typeof res === "object" && res !== null) {
							// Deeply observe nested objects
							return Store.#watch(res);
						}
						return res;
					},
					set(target, key, value, receiver) {
						const oldValue = Reflect.get(target, key, receiver);
						if (Store.isEqual(oldValue, value)) return true;

						const result = Reflect.set(
							target,
							key,
							value,
							receiver
						);
						if (result) {
							// Trigger effects for dependents on specific property
							for (const effect of Store.#effectMap
								.get(target)
								?.get(key) ?? [])
								effect();
						}

						return result;
					},
					deleteProperty(target, key) {
						const hadProperty = Reflect.has(target, key);
						const result = Reflect.deleteProperty(target, key);
						if (result && hadProperty) {
							// Trigger effects for dependents on specific property
							for (const effect of Store.#effectMap
								.get(target)
								?.get(key) ?? [])
								effect();
						}
						return result;
					},
			  });
	};

	static isEqual(a: any, b: any): boolean {
		if (a === b) return true;

		if (a && typeof a === "object" && b && typeof b === "object") {
			if (Array.isArray(a) && Array.isArray(b)) {
				if (a.length !== b.length) return false;
				for (let i = 0; i < a.length; i++) {
					if (!Store.isEqual(a[i], b[i])) return false;
				}
				return true;
			}

			// Basic object comparison (doesn't handle Maps, Sets, Dates, etc. yet)
			const keysA = Object.keys(a);
			const keysB = Object.keys(b);
			if (keysA.length !== keysB.length) return false;

			for (const key of keysA) {
				if (
					!Object.prototype.hasOwnProperty.call(b, key) ||
					!Store.isEqual(a[key], b[key])
				) {
					return false;
				}
			}
			return true;
		}

		return false;
	}

	get value(): T {
		// When someone reads store.value, we track this dependency.
		// This is simplified: in a real system, you'd track specific property access within the value object.
		// For now, assume a read of `store.value` implies a dependency on the whole thing.
		if (Store.#currentEffect) this.#downstream.add(Store.#currentEffect);
		return this.#reactive;
	}

	set value(newValue: T) {
		if (Store.isEqual(this.#value, newValue)) return;

		this.#value = newValue; // Update the internal raw value
		this.#reactive =
			typeof newValue === "object" && newValue !== null
				? (Store.#watch(newValue as object) as T)
				: newValue;

		// Trigger effects for dependents on whole store value
		for (const effect of this.#downstream) effect();
	}

	// A simplified 'effect' or 'reaction' runner
	// In a full system, this would manage cleanup of dependencies.
	effect(fn: () => void) {
		const effectRunner = () => {
			Store.#currentEffect = effectRunner;
			fn(); // This will trigger 'get' traps and register dependencies
			Store.#currentEffect = null;
		};
		effectRunner();
	}
}
