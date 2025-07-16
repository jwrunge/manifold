import { isEqual } from "./equality";

let currentEffect: Effect | null = null;

class Effect {
	private dependencies = new Set<() => void>();
	public isActive = true;
	private isRunning = false;

	constructor(private fn: () => void) {}

	run() {
		if (!this.isActive || this.isRunning) return;

		this.isRunning = true;

		// Clean up previous dependencies
		for (const cleanup of this.dependencies) cleanup();
		this.dependencies.clear();

		// Track new dependencies
		const prevEffect = currentEffect;
		currentEffect = this;

		try {
			this.fn();
		} finally {
			currentEffect = prevEffect;
			this.isRunning = false;
		}
	}

	addDependency(cleanup: () => void) {
		this.dependencies.add(cleanup);
	}

	stop() {
		this.isActive = false;
		for (const cleanup of this.dependencies) cleanup();
		this.dependencies.clear();
	}
}

export class State<T = unknown> {
	private _value: T;
	private _reactive: T;
	private _derive?: () => T;
	private _effects = new Set<Effect>();
	private _granularEffects = new Map<string | symbol, Set<Effect>>();

	constructor(value: T | (() => T)) {
		if (typeof value === "function") {
			this._derive = value as () => T;
			this._value = undefined as any;
			this._reactive = undefined as any;

			// Create an effect to update derived state when dependencies change
			const effect = new Effect(() => {
				this._updateValue();
			});
			effect.run();
		} else {
			this._value = value;
			this._reactive = this._createProxy(value);
		}
	}

	private _updateValue() {
		const newValue = this._derive ? this._derive() : this._value;

		if (!isEqual(this._value, newValue)) {
			this._value = newValue;
			this._reactive = this._createProxy(newValue);

			// Trigger effects when the value changes
			this._triggerEffects();
		}
	}

	private _createProxy(obj: T): T {
		if (!obj || typeof obj !== "object") return obj;

		return new Proxy(obj, {
			get: (target, key) => {
				this._track(key);
				const value = Reflect.get(target, key);
				return typeof value === "object" && value !== null
					? this._createProxy(value as any)
					: value;
			},
			set: (target, key, value) => {
				const current = Reflect.get(target, key);
				if (isEqual(current, value)) return true;

				const result = Reflect.set(target, key, value);
				result && this._triggerGranularEffects(key);
				return result;
			},
		}) as T;
	}

	private _track(key: string | symbol) {
		const effect = currentEffect;
		if (!effect) return;

		// Track top-level access
		this._effects.add(effect);
		effect.addDependency(() => this._effects.delete(effect));

		// Track granular access
		let granularEffects = this._granularEffects.get(key);
		if (!granularEffects) {
			granularEffects = new Set();
			this._granularEffects.set(key, granularEffects);
		}

		granularEffects.add(effect);
		effect.addDependency(() => {
			granularEffects!.delete(effect);
			granularEffects!.size === 0 && this._granularEffects.delete(key);
		});
	}

	private _triggerEffects() {
		// Trigger all effects (both top-level and granular since entire value changed)
		const triggered = new Set<Effect>();

		for (const effect of this._effects) {
			if (effect.isActive && !triggered.has(effect)) {
				triggered.add(effect);
				effect.run();
			}
		}

		for (const effects of this._granularEffects.values()) {
			for (const effect of effects) {
				if (effect.isActive && !triggered.has(effect)) {
					triggered.add(effect);
					effect.run();
				}
			}
		}
	}

	private _triggerGranularEffects(key: string | symbol) {
		const granularEffects = this._granularEffects.get(key);
		if (!granularEffects) return;

		for (const effect of granularEffects) {
			effect.isActive && effect.run();
		}
	}

	get value(): T {
		const effect = currentEffect;
		if (effect) {
			this._effects.add(effect);
			effect.addDependency(() => this._effects.delete(effect));
		}
		return this._reactive;
	}

	set value(newValue: T) {
		if (this._derive) {
			console.warn("Cannot set value on a derived state.");
			return;
		}

		if (!isEqual(this._value, newValue)) {
			this._value = newValue;
			this._reactive = this._createProxy(newValue);
			this._triggerEffects();
		}
	}

	effect(fn: () => void) {
		const effect = new Effect(fn);
		effect.run();
		return () => effect.stop();
	}
}
