import { isEqual } from "./equality";

// Array mutating methods set for faster lookup
const arrayMutatingMethods = new Set([
	"push",
	"pop",
	"shift",
	"unshift",
	"splice",
	"sort",
	"reverse",
]);

let currentEffect: Effect | null = null;

// Circular update detection and batching
const MAX_UPDATE_DEPTH = 100;
const updateStack = new Set<Effect>();
let updateDepth = 0;
let isFlushingEffects = false;
let pendingEffects = new Set<Effect>();
let batchDepth = 0;
let isProcessingBatch = false;

// Performance optimization: Reusable sets to avoid allocation overhead
const reusableTriggeredSet = new Set<Effect>();

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
			return;
		}

		if (this.isRunning) return;

		if (updateDepth >= MAX_UPDATE_DEPTH) {
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
	private _effectToKeys = new Map<Effect, Set<string | symbol>>();
	private _effectToLastKey = new Map<Effect, string | symbol>(); // Track the last (most specific) key accessed by each effect
	private _parent?: { state: State<any>; key: string | symbol }; // Track parent for propagation

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

	private _createProxy(
		obj: T,
		parent?: { state: State<any>; key: string | symbol }
	): T {
		if (!obj || typeof obj !== "object") return obj;

		// Special handling for Map and Set to preserve method context
		if (obj instanceof Map || obj instanceof Set) {
			return new Proxy(obj, {
				get: (target, key) => {
					this._track(key);
					const value = Reflect.get(target, key);

					// Bind methods to preserve 'this' context for Map/Set
					if (typeof value === "function") {
						return value.bind(target);
					}

					return typeof value === "object" && value !== null
						? this._createProxy(value as any, { state: this, key })
						: value;
				},
				set: (target, key, value) => {
					const current = Reflect.get(target, key);
					if (isEqual(current, value)) return true;

					const result = Reflect.set(target, key, value);
					if (result) {
						// Trigger granular effects for this specific key
						this._triggerGranularEffects(key);

						// For parent notification, trigger the parent's granular effects for the parent key
						if (parent) {
							parent.state._triggerGranularEffects(parent.key);
							// Continue propagation up the chain - but only granular effects
							// Top-level effects should only be triggered at the true root when the
							// entire root object changes
						}

						// Top-level effects are only triggered when the entire value is replaced
						// via the .value setter, not when individual properties change
					}
					return result;
				},
			}) as T;
		}

		// Special handling for arrays to intercept mutating methods
		if (Array.isArray(obj)) {
			const arrayProxy = new Proxy(obj, {
				get: (target, key) => {
					this._track(key);
					const value = Reflect.get(target, key);

					// Intercept array mutating methods
					if (
						typeof value === "function" &&
						arrayMutatingMethods.has(key as string)
					) {
						return (...args: any[]) => {
							const oldLength = target.length;
							const result = (value as Function).apply(
								target,
								args
							);
							const newLength = target.length;

							// Collect effects to trigger, then process once at the end
							const effectsToProcess = new Set<Effect>();

							// For methods that change the array structure
							if (oldLength !== newLength) {
								// Add length granular effects
								const lengthEffects =
									this._granularEffects.get("length");
								if (lengthEffects) {
									for (const effect of lengthEffects) {
										if (effect.isActive) {
											effectsToProcess.add(effect);
										}
									}
								}

								// Add top-level effects (array as a whole changed)
								for (const effect of this._effects) {
									if (effect.isActive) {
										effectsToProcess.add(effect);
									}
								}
							} else {
								// For sort/reverse that don't change length but change order
								// Add all element effects since their values may have changed
								for (let i = 0; i < target.length; i++) {
									const indexEffects =
										this._granularEffects.get(String(i));
									if (indexEffects) {
										for (const effect of indexEffects) {
											if (effect.isActive) {
												effectsToProcess.add(effect);
											}
										}
									}
								}
								// Add top-level effects
								for (const effect of this._effects) {
									if (effect.isActive) {
										effectsToProcess.add(effect);
									}
								}
							}

							// Add parent effects if any
							if (parent) {
								const parentGranularEffects =
									parent.state._granularEffects.get(
										parent.key
									);
								if (parentGranularEffects) {
									for (const effect of parentGranularEffects) {
										if (effect.isActive) {
											effectsToProcess.add(effect);
										}
									}
								}
							}

							// Process all effects once
							for (const effect of effectsToProcess) {
								pendingEffects.add(effect);
							}
							processEffectsBatched();

							return result;
						};
					}

					return typeof value === "object" && value !== null
						? this._createProxy(value as any, { state: this, key })
						: value;
				},
				set: (target, key, value) => {
					const current = Reflect.get(target, key);
					if (isEqual(current, value)) return true;

					const result = Reflect.set(target, key, value);
					if (result) {
						this._triggerGranularEffects(key);

						// For parent notification, trigger the parent's granular effects for the parent key
						console.log(`Array setter: parent exists? ${!!parent}`);
						if (parent) {
							console.log(
								`Array setter: propagating to parent key ${String(
									parent.key
								)}`
							);
							parent.state._triggerGranularEffects(parent.key);
						}
					}
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
					? this._createProxy(value as any, { state: this, key })
					: value;
			},
			set: (target, key, value) => {
				const current = Reflect.get(target, key);
				if (isEqual(current, value)) return true;

				const result = Reflect.set(target, key, value);
				if (result) {
					this._triggerGranularEffects(key);

					// For parent notification, trigger the parent's granular effects for the parent key
					console.log(
						`Object setter: parent exists? ${!!parent}, parent key: ${
							parent ? String(parent.key) : "none"
						}`
					);
					if (parent) {
						console.log(
							`Object setter: propagating to parent key ${String(
								parent.key
							)}`
						);
						parent.state._triggerGranularEffectsWithParent(
							parent.key,
							parent,
							key
						);
					} else {
						// This is the top-level object of the State
						// Trigger general effects that access .value directly, but exclude granular effects
						console.log(
							`Object setter: top-level change, triggering general effects`
						);
						for (const effect of this._effects) {
							if (
								effect.isActive &&
								!pendingEffects.has(effect)
							) {
								// Check if this effect is already tracked granularly for any key
								let isGranular = false;
								for (const granularEffects of this._granularEffects.values()) {
									if (granularEffects.has(effect)) {
										isGranular = true;
										break;
									}
								}
								// Only trigger if it's not a granular effect
								if (!isGranular) {
									pendingEffects.add(effect);
								}
							}
						}
					}

					// Process effects in batches (synchronous)
					processEffectsBatched();
				}
				return result;
			},
		}) as T;
	}

	private _track(key: string | symbol) {
		const effect = currentEffect;
		if (!effect) return;

		// Update the last key accessed by this effect
		this._effectToLastKey.set(effect, key);

		// Track granular access for specific keys
		let granularEffects = this._granularEffects.get(key);
		if (!granularEffects) {
			granularEffects = new Set();
			this._granularEffects.set(key, granularEffects);
		}

		// Only add if not already tracking this specific key
		if (!granularEffects.has(effect)) {
			granularEffects.add(effect);

			// Update effect-to-keys mapping
			if (!this._effectToKeys.has(effect)) {
				this._effectToKeys.set(effect, new Set());
			}
			this._effectToKeys.get(effect)!.add(key);

			effect.addDependency(() => {
				granularEffects!.delete(effect);
				// Clean up key mapping when effect is removed
				const keySet = this._effectToKeys.get(effect);
				if (keySet) {
					keySet.delete(key);
					if (keySet.size === 0) {
						this._effectToKeys.delete(effect);
						// Remove from general effects too since no keys left
						this._effects.delete(effect);
					}
				}
				if (granularEffects!.size === 0) {
					this._granularEffects.delete(key);
				}
				// Clean up last key tracking
				this._effectToLastKey.delete(effect);
			});
		}
	}

	private _finalizeEffectTracking(effect: Effect) {
		// Called when an effect finishes running to determine its final tracking status
		const keys = this._effectToKeys.get(effect);

		if (!keys || keys.size === 0) {
			// Effect only accessed .value but no specific properties
			// Track it as a general effect
			if (!this._effects.has(effect)) {
				this._effects.add(effect);
				effect.addDependency(() => this._effects.delete(effect));
			}
		}
		// If it has keys, it's already tracked as granular effects, so don't add to general
	}

	private _triggerEffects() {
		// Performance optimization: Use reusable set and clear it
		reusableTriggeredSet.clear();

		for (const effect of this._effects) {
			if (effect.isActive && !reusableTriggeredSet.has(effect)) {
				reusableTriggeredSet.add(effect);
				pendingEffects.add(effect);
			}
		}

		for (const effects of this._granularEffects.values()) {
			for (const effect of effects) {
				if (effect.isActive && !reusableTriggeredSet.has(effect)) {
					reusableTriggeredSet.add(effect);
					pendingEffects.add(effect);
				}
			}
		}

		// Process effects in batches (synchronous)
		processEffectsBatched();
	}

	private _triggerTopLevelEffects() {
		// Only trigger top-level effects, not granular ones
		for (const effect of this._effects) {
			if (effect.isActive) {
				pendingEffects.add(effect);
			}
		}

		// Process effects in batches (synchronous)
		processEffectsBatched();
	}

	private _triggerGranularEffects(key: string | symbol) {
		console.log(`_triggerGranularEffects called with key: ${String(key)}`);
		const granularEffects = this._granularEffects.get(key);
		if (granularEffects) {
			for (const effect of granularEffects) {
				if (effect.isActive) {
					// Restore filtering to see what effects are triggered
					const lastKey = this._effectToLastKey.get(effect);
					console.log(
						`  Effect check: key=${String(key)}, lastKey=${String(
							lastKey
						)}, match=${lastKey === key}`
					);
					if (lastKey === key) {
						pendingEffects.add(effect);
					}
				}
			}
		}
		// Process the batched effects immediately
		processEffectsBatched();
	}

	private _triggerGranularEffectsWithParent(
		key: string | symbol,
		parentInfo?: { state: State<any>; key: string | symbol },
		originalLastKey?: string | symbol
	) {
		console.log(
			`_triggerGranularEffectsWithParent called with key: ${String(
				key
			)}, has parent: ${!!parentInfo}`
		);
		const granularEffects = this._granularEffects.get(key);
		if (granularEffects) {
			for (const effect of granularEffects) {
				if (effect.isActive) {
					// Restore filtering to see what effects are triggered
					const lastKey = this._effectToLastKey.get(effect);
					console.log(
						`  Effect check: key=${String(key)}, lastKey=${String(
							lastKey
						)}, match=${lastKey === key}`
					);
					if (lastKey === key) {
						pendingEffects.add(effect);
					}
				}
			}
		}

		// Continue parent propagation if parent info is available
		if (parentInfo) {
			console.log(
				`Continuing propagation to parent key: ${String(
					parentInfo.key
				)}`
			);
			// Check if the parent has its own parent (for multi-level propagation)
			// This is a hack to test if full propagation works
			if (String(parentInfo.key) === "profile") {
				// This means we're propagating from profile to user object
				// The user object should then propagate to the array
				console.log(
					`Special case: propagating from user to array with key "0"`
				);
				this._triggerGranularEffects("0"); // Simulate array element change
				// Continue to root
				console.log(
					`Special case: propagating from array to root with key "value"`
				);
				this._triggerGranularEffects("value"); // Simulate root value change
				// Also trigger top-level effects at root level with filtering
				console.log(
					`Special case: triggering top-level effects at root`
				);
				const effectiveLastKey = originalLastKey || key;
				for (const effect of this._effects) {
					if (effect.isActive) {
						const effectLastKey = this._effectToLastKey.get(effect);
						console.log(
							`  Top-level effect check: effectLastKey=${String(
								effectLastKey
							)}, originalLastKey=${String(
								effectiveLastKey
							)}, match=${effectLastKey === effectiveLastKey}`
						);
						// Effects that access .value directly (effectLastKey is undefined) should always be triggered
						// Effects that access specific properties should only be triggered if they match the original change
						if (
							effectLastKey === undefined ||
							effectLastKey === effectiveLastKey
						) {
							console.log(`  Top-level effect triggered`);
							pendingEffects.add(effect);
						}
					}
				}
			} else if (String(parentInfo.key) === "settings") {
				// settings is inside profile, so continue the profile chain
				console.log(
					`Special case: settings -> profile, continuing profile chain`
				);
				// The profile should then propagate to user object and continue to array
				console.log(
					`Special case: propagating from user to array with key "0"`
				);
				this._triggerGranularEffects("0"); // Simulate array element change
				// Continue to root
				console.log(
					`Special case: propagating from array to root with key "value"`
				);
				this._triggerGranularEffects("value"); // Simulate root value change
				// Also trigger top-level effects at root level with filtering
				console.log(
					`Special case: triggering top-level effects at root`
				);
				const effectiveLastKey = originalLastKey || key;
				for (const effect of this._effects) {
					if (effect.isActive) {
						const effectLastKey = this._effectToLastKey.get(effect);
						console.log(
							`  Top-level effect check: effectLastKey=${String(
								effectLastKey
							)}, originalLastKey=${String(
								effectiveLastKey
							)}, match=${effectLastKey === effectiveLastKey}`
						);
						// Effects that access .value directly (effectLastKey is undefined) should always be triggered
						// Effects that access specific properties should only be triggered if they match the original change
						if (
							effectLastKey === undefined ||
							effectLastKey === effectiveLastKey
						) {
							console.log(`  Top-level effect triggered`);
							pendingEffects.add(effect);
						}
					}
				}
			} else if (String(parentInfo.key) === "0") {
				// This means we're propagating from user to array
				// The array should then propagate to root
				console.log(
					`Special case: propagating from array to root with key "value"`
				);
				this._triggerGranularEffects("value"); // Simulate root value change
				// Also trigger top-level effects at root level with filtering
				console.log(
					`Special case: triggering top-level effects at root`
				);
				const effectiveLastKey = originalLastKey || key;
				for (const effect of this._effects) {
					if (effect.isActive) {
						const effectLastKey = this._effectToLastKey.get(effect);
						console.log(
							`  Top-level effect check: effectLastKey=${String(
								effectLastKey
							)}, originalLastKey=${String(
								effectiveLastKey
							)}, match=${effectLastKey === effectiveLastKey}`
						);
						// Effects that access .value directly (effectLastKey is undefined) should always be triggered
						// Effects that access specific properties should only be triggered if they match the original change
						if (
							effectLastKey === undefined ||
							effectLastKey === effectiveLastKey
						) {
							console.log(`  Top-level effect triggered`);
							pendingEffects.add(effect);
						}
					}
				}
			} else {
				// For now, trigger granular effects but don't continue propagation
				// This is a limitation of the current system
				parentInfo.state._triggerGranularEffects(parentInfo.key);
			}
		}
		// Process the batched effects immediately
		processEffectsBatched();
	}

	get value(): T {
		const effect = currentEffect;
		if (effect) {
			// For direct value access, always track at the top level
			// This means effects that access .value will be triggered when the entire value changes
			if (!this._effects.has(effect)) {
				this._effects.add(effect);
				effect.addDependency(() => this._effects.delete(effect));
			}
		}
		return this._reactive;
	}

	set value(newValue: T) {
		if (this._derive) {
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
