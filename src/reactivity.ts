const isEqual = (a: any, b: any, checked = new WeakSet()): boolean => {
	if (a === b) return true;
	if (!(a && b && [typeof a, typeof b].includes("object"))) return false;

	if (checked.has(a) && checked.has(b)) return true; // Handle circular references
	checked.add(a);
	checked.add(b);

	const isABufA = a instanceof ArrayBuffer || ArrayBuffer.isView(a);
	const isABufB = b instanceof ArrayBuffer || ArrayBuffer.isView(b);

	if (isABufA && isABufB) {
		const aView =
			a instanceof ArrayBuffer
				? new Uint8Array(a)
				: new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
		const bView =
			b instanceof ArrayBuffer
				? new Uint8Array(b)
				: new Uint8Array(b.buffer, b.byteOffset, b.byteLength);

		if (aView.length !== bView.length) return false;
		for (let i = 0; i < aView.length; i++) {
			if (aView[i] !== bView[i]) return false;
		}
		return true;
	} else if (isABufA !== isABufB) {
		return false;
	}

	const [classA, classB] = [a, b].map((x) => x.constructor);
	if (classA !== classB && !(classA === Object && classB === Object))
		return false;

	switch (classA) {
		case Object:
			break;
		case Array:
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (!isEqual(a[i], b[i], checked)) return false;
			}
			return true;
		case Date:
			return a.getTime() === b.getTime();
		case Map:
			if (a.size !== b.size) return false;
			for (const [key, valA] of a.entries()) {
				if (!b.has(key) || !isEqual(valA, b.get(key), checked)) {
					return false;
				}
			}
			return true;
		case Set:
			if (a.size !== b.size) return false;
			const aValues = Array.from(a.values()).sort((x, y) =>
				String(x).localeCompare(String(y))
			);
			const bValues = Array.from(b.values()).sort((x, y) =>
				String(x).localeCompare(String(y))
			);
			return isEqual(aValues, bValues, checked); // Recurse on sorted arrays
		case URL:
			return a.href === b.href;
		case URLSearchParams:
			return a.toString() === b.toString();
		case Error:
			return a.name === b.name && a.message === b.message;
		case RegExp:
			return a.source === b.source && a.flags === b.flags;
		case Function:
		case Promise:
			return false;
	}

	const [keysA, keysB] = [a, b].map((x) => Reflect.ownKeys(x));
	if (keysA.length !== keysB.length) return false;

	keysA.sort();
	keysB.sort();

	for (const key of keysA) {
		if (
			!Reflect.getOwnPropertyDescriptor(b, key) ||
			!isEqual(a[key], b[key], checked)
		) {
			return false;
		}
	}

	return true;
};

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
						if (isEqual(oldValue, value)) return true;

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

	get value(): T {
		// When someone reads store.value, we track this dependency.
		// This is simplified: in a real system, you'd track specific property access within the value object.
		// For now, assume a read of `store.value` implies a dependency on the whole thing.
		if (Store.#currentEffect) this.#downstream.add(Store.#currentEffect);
		return this.#reactive;
	}

	set value(newValue: T) {
		if (isEqual(this.#value, newValue)) return;

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
