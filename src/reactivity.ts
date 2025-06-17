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
	#topLevelEffects = new Set<Effect>();
	static #granularEffects = new WeakMap<
		object,
		Map<string | symbol, Set<Effect>>
	>();

	static currentEffect: Effect | null = null;
	static #proxyInstances = new WeakSet<object>();
	static elementClassList = new WeakMap<Element, Set<string>>();

	constructor(value: T | (() => T)) {
		if (typeof value === "function") {
			this.#derive = value as () => T;
			const deriveEffect = new Effect(() =>
				this.#updateInternalValue(this.#derive!())
			);
			this.#topLevelEffects.add(deriveEffect);
			deriveEffect.run();
		} else {
			this.#updateInternalValue(value);
		}
	}

	#updateInternalValue(newValue: T) {
		if (isEqual(this.#value, newValue)) return;
		this.#value = newValue;
		this.#reactive = State.#observable(newValue);
		for (const effect of this.#topLevelEffects) effect.run();
	}

	static #track(target: object, key: string | symbol) {
		const effect = State.currentEffect;

		if (effect) {
			let subs = State.#granularEffects.get(target);
			if (!subs) {
				subs = new Map();
				State.#granularEffects.set(target, subs);
			}
			let effects = subs.get(key);
			if (!effects) {
				effects = new Set();
				subs.set(key, effects);
			}
			effects.add(effect);

			effect.addDependency(() => {
				if (effect) effects?.delete(effect);
				if (!effects.size) {
					subs.delete(key);
					if (!subs.size) State.#granularEffects.delete(target);
				}
			});
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
				if (result) {
					const subs = State.#granularEffects.get(target);
					const effectsToRun = subs?.get(key);
					for (const effect of effectsToRun || []) effect.run();
				}

				return result;
			},
		});

		State.#proxyInstances.add(proxy);
		return proxy;
	};

	get value(): T {
		if (State.currentEffect) {
			this.#topLevelEffects.add(State.currentEffect);
			State.currentEffect.addDependency(() => {
				this.#topLevelEffects.delete(State.currentEffect!);
			});
		}

		return this.#reactive;
	}

	set value(newValue: T) {
		if (!this.#derive) this.#updateInternalValue(newValue);
	}

	effect(fn: () => void) {
		const effect = new Effect(fn);
		effect.run();
		return effect.stop;
	}
}
