import { isEqual } from "./equality";

class Effect {
	#dependencies: (() => void)[] = [];
	#active = true;

	constructor(private fn: () => void) {}

	run() {
		if (this.#active) {
			this.#stopDependencies();
			State.currentEffect = this;

			try {
				this.fn();
			} finally {
				State.currentEffect = null;
			}
		}
	}

	addDependency(cleanup: () => void) {
		this.#dependencies.push(cleanup);
	}

	#stopDependencies() {
		while (this.#dependencies.shift()?.());
	}

	stop() {
		this.#active = false;
		this.#stopDependencies();
	}
}

export class State<T = unknown> {
	#value!: T;
	#reactive!: T; // proxied
	#derive?: () => T;
	#effects = new Set<Effect>();

	static currentEffect: Effect | null = null;
	static #proxyInstances = new WeakSet<object>();
	static #subscriptions = new WeakMap<
		object,
		Map<string | symbol, Set<Effect>>
	>();

	constructor(value: T | (() => T)) {
		if (typeof value === "function") {
			this.#derive = value as () => T;
			const deriveEffect = new Effect(() =>
				this.#updateInternalValue(this.#derive!())
			);
			this.#effects.add(deriveEffect);
			deriveEffect.run();
		} else {
			this.#updateInternalValue(value);
		}
	}

	#updateInternalValue(newValue: T) {
		if (isEqual(this.#value, newValue)) return;
		this.#value = newValue;
		this.#reactive = State.#observable(newValue);
		for (const effect of this.#effects) effect.run();
	}

	static #track(target: object, key: string | symbol) {
		if (State.currentEffect) {
			let subs = State.#subscriptions.get(target);
			if (!subs) {
				subs = new Map();
				State.#subscriptions.set(target, subs);
			}
			let effects = subs.get(key);
			if (!effects) {
				effects = new Set();
				subs.set(key, effects);
			}
			effects.add(State.currentEffect);
			State.currentEffect.addDependency(() => {
				if (State.currentEffect) effects?.delete(State.currentEffect);
				if (!effects.size) {
					subs.delete(key);
					if (!subs.size) State.#subscriptions.delete(target);
				}
			});
		}
	}

	static #trigger(target: object, key: string | symbol) {
		const subs = State.#subscriptions.get(target);
		if (!subs) return;
		const effectsToRun = subs.get(key);
		if (effectsToRun) {
			new Set(effectsToRun).forEach((effect) => effect.run());
		}
	}

	static #observable = <T>(obj: T): T => {
		if (!obj || typeof obj !== "object" || State.#proxyInstances.has(obj))
			return obj;

		const proxy = new Proxy(obj, {
			get(target, key, receiver) {
				State.#track(target, key);
				return State.#observable(Reflect.get(target, key, receiver));
			},
			set(target, key, value, receiver) {
				if (isEqual(Reflect.get(target, key, receiver), value))
					return true;

				const result = Reflect.set(target, key, value, receiver);
				if (result) State.#trigger(target, key);

				return result;
			},
			deleteProperty(target, key) {
				const hadProperty = Reflect.has(target, key);
				const result = Reflect.deleteProperty(target, key);
				if (result && hadProperty) State.#trigger(target, key);
				return result;
			},
		});

		State.#proxyInstances.add(proxy);
		return proxy;
	};

	get value(): T {
		if (State.currentEffect) {
			this.#effects.add(State.currentEffect);
			State.currentEffect.addDependency(() => {
				this.#effects.delete(State.currentEffect!);
			});
		}

		return this.#reactive;
	}

	set value(newValue: T) {
		if (this.#derive) console.error("Cannot set value on a derived store.");
		else if (!isEqual(this.#value, newValue))
			this.#updateInternalValue(newValue);
	}

	effect(fn: () => void) {
		const effect = new Effect(fn);
		effect.run();
		return () => effect.stop();
	}
}
