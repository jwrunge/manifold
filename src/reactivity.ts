import { isEqual } from "./equality";

let currentEffect: Effect | null = null;

// Circular update detection and batching
const MAX_UPDATE_DEPTH = 100;
const updateStack = new Set<Effect>();
let updateDepth = 0;
let isFlushingEffects = false;
let pendingEffects = new Set<Effect>();
let batchDepth = 0;
let isProcessingBatch = false;

function flushPendingEffects() {
	if (isFlushingEffects || pendingEffects.size === 0) return;

	isFlushingEffects = true;
	const maxBatchDepth = 10; // Prevent infinite batching loops

	try {
		while (pendingEffects.size > 0 && batchDepth < maxBatchDepth) {
			batchDepth++;
			const effectsToRun = new Set(pendingEffects);
			pendingEffects.clear();

			for (const effect of effectsToRun) {
				if (effect.isActive) {
					effect.runImmediate();
				}
			}
		}

		if (batchDepth >= maxBatchDepth && pendingEffects.size > 0) {
			console.warn(
				`Maximum batch depth (${maxBatchDepth}) exceeded! Possible infinite update loop detected. Clearing pending effects.`
			);
			console.trace("Batch depth exceeded stack trace");
			pendingEffects.clear();
		}
	} finally {
		isFlushingEffects = false;
		batchDepth = 0;
		isProcessingBatch = false;
	}
}

// Immediate but batched processing - synchronous batching for predictable behavior
function processEffectsBatched() {
	if (pendingEffects.size === 0 || isProcessingBatch) return;

	isProcessingBatch = true;

	// Run immediately but in a controlled batch to prevent cascading
	flushPendingEffects();
}

// Test utility: wait for all pending effects to complete
export function flushEffects(): Promise<void> {
	return new Promise((resolve) => {
		if (pendingEffects.size === 0 && !isFlushingEffects) {
			resolve();
			return;
		}

		// Wait for next tick and check again
		setTimeout(() => {
			flushEffects().then(resolve);
		}, 0);
	});
}

class Effect {
	private dependencies = new Set<() => void>();
	public isActive = true;
	private isRunning = false;

	constructor(private fn: () => void) {}

	run() {
		if (!this.isActive) return;

		// During effect flushing, queue effects instead of running immediately
		if (isFlushingEffects) {
			pendingEffects.add(this);
			return;
		}

		this.runImmediate();
	}

	runImmediate() {
		if (!this.isActive) return;

		// Circular update detection
		if (updateStack.has(this)) {
			console.warn(
				"Circular update detected! Effect is already running in the call stack. Aborting to prevent infinite loop."
			);
			console.trace("Circular update stack trace");
			return;
		}

		if (this.isRunning) return;

		if (updateDepth >= MAX_UPDATE_DEPTH) {
			console.warn(
				`Maximum update depth (${MAX_UPDATE_DEPTH}) exceeded! Possible infinite loop detected. Aborting.`
			);
			console.trace("Update depth exceeded stack trace");
			return;
		}

		this.isRunning = true;
		updateStack.add(this);
		updateDepth++;

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
			updateStack.delete(this);
			updateDepth--;
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

// Standalone effect function for creating effects outside of State instances
export const createEffect = (fn: () => void) => {
	const effect = new Effect(fn);
	effect.runImmediate();
	return () => effect.stop();
};

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
			effect.runImmediate();
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

		// Special handling for arrays to intercept mutating methods
		if (Array.isArray(obj)) {
			const arrayProxy = new Proxy(obj, {
				get: (target, key) => {
					this._track(key);
					const value = Reflect.get(target, key);

					// Intercept array mutating methods
					if (
						typeof value === "function" &&
						[
							"push",
							"pop",
							"shift",
							"unshift",
							"splice",
							"sort",
							"reverse",
						].includes(key as string)
					) {
						return (...args: any[]) => {
							const oldLength = target.length;
							const result = (value as Function).apply(
								target,
								args
							);
							const newLength = target.length;

							// For methods that change the array structure,
							// trigger length-related effects and top-level effects
							if (oldLength !== newLength) {
								// Trigger length granular effects
								this._triggerGranularEffects("length");

								// For push/unshift, trigger effects for new indices
								if (key === "push" || key === "unshift") {
									// Only trigger effects that depend on the entire array
									// Don't trigger granular effects for existing indices
									this._triggerTopLevelEffects();
								} else {
									// For other array mutations, trigger all effects
									this._triggerEffects();
								}
							} else {
								// For sort/reverse that don't change length but change order
								this._triggerEffects();
							}

							return result;
						};
					}

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
			return arrayProxy;
		}

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

		// Track granular access for specific keys
		let granularEffects = this._granularEffects.get(key);
		if (!granularEffects) {
			granularEffects = new Set();
			this._granularEffects.set(key, granularEffects);
		}

		// Only add if not already tracking this specific key
		if (!granularEffects.has(effect)) {
			granularEffects.add(effect);
			effect.addDependency(() => {
				granularEffects!.delete(effect);
				granularEffects!.size === 0 &&
					this._granularEffects.delete(key);
			});
		}

		// Don't track top-level for objects/arrays when accessing specific properties
		// Only track top-level if we haven't tracked any granular properties yet
		// Check AFTER adding to granular effects
		if (!this._hasGranularTracking(effect)) {
			if (!this._effects.has(effect)) {
				this._effects.add(effect);
				effect.addDependency(() => this._effects.delete(effect));
			}
		} else {
			// If this effect now has granular tracking, remove it from top-level effects
			if (this._effects.has(effect)) {
				this._effects.delete(effect);
			}
		}
	}

	private _hasGranularTracking(effect: Effect): boolean {
		for (const effects of this._granularEffects.values()) {
			if (effects.has(effect)) {
				return true;
			}
		}
		return false;
	}

	private _triggerEffects() {
		// Batch effects to prevent cascading updates
		const triggered = new Set<Effect>();

		for (const effect of this._effects) {
			if (effect.isActive && !triggered.has(effect)) {
				triggered.add(effect);
				pendingEffects.add(effect);
			}
		}

		for (const effects of this._granularEffects.values()) {
			for (const effect of effects) {
				if (effect.isActive && !triggered.has(effect)) {
					triggered.add(effect);
					pendingEffects.add(effect);
				}
			}
		}

		// Process effects in batches using microtasks (immediate but still batched)
		processEffectsBatched();
	}

	private _triggerTopLevelEffects() {
		// Only trigger top-level effects, not granular ones
		for (const effect of this._effects) {
			if (effect.isActive) {
				pendingEffects.add(effect);
			}
		}

		// Process effects in batches using microtasks (immediate but still batched)
		processEffectsBatched();
	}

	private _triggerGranularEffects(key: string | symbol) {
		const granularEffects = this._granularEffects.get(key);
		if (!granularEffects) return;

		for (const effect of granularEffects) {
			if (effect.isActive) {
				pendingEffects.add(effect);
			}
		}

		// Process effects in batches using microtasks (immediate but still batched)
		processEffectsBatched();
	}

	get value(): T {
		const effect = currentEffect;
		if (effect) {
			// Use a marker to indicate this might be a direct value access
			// The _track method will decide whether to track as top-level or not
			const hasExistingGranular = this._hasGranularTracking(effect);

			if (!hasExistingGranular && !this._effects.has(effect)) {
				this._effects.add(effect);
				effect.addDependency(() => this._effects.delete(effect));
			}
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
		effect.runImmediate();
		return () => effect.stop();
	}
}
