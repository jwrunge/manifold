import { isEqual } from "./equality";

// Global tracking state
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
		this.dependencies.forEach((cleanup) => cleanup());
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
		this.dependencies.forEach((cleanup) => cleanup());
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
				return this._createProxy(value as any);
			},
			set: (target, key, value) => {
				if (isEqual(Reflect.get(target, key), value)) return true;

				const result = Reflect.set(target, key, value);
				if (result) {
					this._triggerGranularEffects(key);
				}
				return result;
			},
		}) as T;
	}

	private _track(key: string | symbol) {
		if (!currentEffect) return;

		// Track top-level access
		this._effects.add(currentEffect);
		currentEffect.addDependency(() => {
			this._effects.delete(currentEffect!);
		});

		// Track granular access
		let granularEffects = this._granularEffects.get(key);
		if (!granularEffects) {
			granularEffects = new Set();
			this._granularEffects.set(key, granularEffects);
		}

		granularEffects.add(currentEffect);
		currentEffect.addDependency(() => {
			granularEffects!.delete(currentEffect!);
			if (granularEffects!.size === 0) {
				this._granularEffects.delete(key);
			}
		});
	}

	private _triggerEffects() {
		// Trigger all effects (both top-level and granular since entire value changed)
		const allEffects = new Set<Effect>();
		this._effects.forEach((effect) => allEffects.add(effect));
		this._granularEffects.forEach((effects) => {
			effects.forEach((effect) => allEffects.add(effect));
		});

		allEffects.forEach((effect) => {
			if (effect.isActive) {
				effect.run();
			}
		});
	}

	private _triggerGranularEffects(key: string | symbol) {
		const granularEffects = this._granularEffects.get(key);
		if (granularEffects) {
			granularEffects.forEach((effect) => {
				if (effect.isActive) {
					effect.run();
				}
			});
		}
	}

	get value(): T {
		if (currentEffect) {
			this._effects.add(currentEffect);
			currentEffect.addDependency(() => {
				this._effects.delete(currentEffect!);
			});
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
