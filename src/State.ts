import _isEqual from "./equality";

let _currentEffect: Effect | null = null;
let _pending = new Set<Effect>();
const MAX_UPDATE_DEPTH = 100;

const _runningEffects = new Set<Effect>(); // Track currently running effects
const _updateDepths = new Map<Effect, number>(); // Track update depths per effect

// Batching system
let _batchScheduled = false;
let _isFlushing = false;
const _domUpdates = new Set<() => void>();
const _computations = new Set<() => void>();

const _deps = new Map<string, Set<Effect>>(),
	_S = String,
	_objStr = "object";

const _track = (path: string) => {
	if (!_currentEffect) return;
	let set = _deps.get(path);
	if (!set) _deps.set(path, (set = new Set()));
	set.add(_currentEffect);
	_currentEffect._deps.add(() => set!.delete(_currentEffect!));
};

const _trigger = (path: string) => {
	const set = _deps.get(path);
	if (!set) return;
	for (const effect of set) _pending.add(effect);
	_flush(); // Keep synchronous for backward compatibility
};

// Smart batching scheduler
const _scheduleFlush = () => {
	// Allow scheduling even if we're flushing - DOM updates should be scheduled
	// for the next microtask
	if (_batchScheduled) return;
	_batchScheduled = true;

	// Use microtask for better batching
	queueMicrotask(() => {
		_batchScheduled = false;
		_batchedFlush();
	});
};

const _flush = () => {
	if (!_pending.size) return; // Quick return for normal case

	// If we're already flushing, don't flush again
	if (_isFlushing) return;

	_isFlushing = true;

	try {
		// Run effects first (for backward compatibility)
		const effects = [..._pending];
		_pending.clear();

		for (const effect of effects) {
			// Check for circular dependencies using the running effects set
			if (_runningEffects.has(effect)) {
				console.warn(
					"Circular dependency detected, skipping effect to prevent infinite loop"
				);
				continue;
			}

			// Check update depth per effect
			const currentDepth = (_updateDepths.get(effect) || 0) + 1;
			_updateDepths.set(effect, currentDepth);

			if (currentDepth > MAX_UPDATE_DEPTH) {
				console.warn(
					`Effect exceeded maximum update depth (${MAX_UPDATE_DEPTH}), stopping to prevent infinite loop`
				);
				_updateDepths.delete(effect);
				continue;
			}

			// Mark effect as running before execution
			_runningEffects.add(effect);

			try {
				effect._run();
			} finally {
				// Always remove from running effects, even if error occurs
				_runningEffects.delete(effect);
			}

			// Reset depth after successful run if effect is not pending again
			// NOTE: Don't reset depth immediately - let it accumulate to detect circular dependencies
			// Only reset when effect actually stops being triggered for a while
			// if (!_pending.has(effect)) {
			// 	_updateDepths.delete(effect);
			// }
		}
	} finally {
		_isFlushing = false;

		// Check if more effects were added during flush and need to run
		if (_pending.size > 0) {
			_flush();
		} else {
			// When no more effects are pending, schedule a depth counter reset
			// on the next tick to distinguish between circular deps and sequential updates
			Promise.resolve().then(() => {
				if (_pending.size === 0) {
					_updateDepths.clear();
				}
			});
		}
	}
};

// Enhanced flush that includes batched computations and DOM updates
const _batchedFlush = () => {
	if (!_pending.size && !_domUpdates.size && !_computations.size) return;
	if (_isFlushing) return;

	_isFlushing = true;

	try {
		// 1. Run computations first
		const computations = [..._computations];
		_computations.clear();
		for (const computation of computations) {
			try {
				computation();
			} catch (e) {
				console.error("Computation error:", e);
			}
		}

		// 2. Run effects
		const effects = [..._pending];
		_pending.clear();

		for (const effect of effects) {
			// Check for circular dependencies using the running effects set
			if (_runningEffects.has(effect)) {
				console.warn(
					"Circular dependency detected, skipping effect to prevent infinite loop"
				);
				continue;
			}

			// Check update depth per effect
			const currentDepth = (_updateDepths.get(effect) || 0) + 1;
			_updateDepths.set(effect, currentDepth);

			if (currentDepth > MAX_UPDATE_DEPTH) {
				console.warn(
					`Effect exceeded maximum update depth (${MAX_UPDATE_DEPTH}), stopping to prevent infinite loop`
				);
				_updateDepths.delete(effect);
				continue;
			}

			// Mark effect as running before execution
			_runningEffects.add(effect);

			try {
				effect._run();
			} finally {
				// Always remove from running effects, even if error occurs
				_runningEffects.delete(effect);
			}

			// Reset depth after successful run if effect is not pending again
			// NOTE: Don't reset depth immediately - let it accumulate to detect circular dependencies
			// Only reset when effect actually stops being triggered for a while
			// if (!_pending.has(effect)) {
			// 	_updateDepths.delete(effect);
			// }
		}

		// 3. Run DOM updates last (batched)
		const domUpdates = [..._domUpdates];
		_domUpdates.clear();
		for (const domUpdate of domUpdates) {
			try {
				domUpdate();
			} catch (e) {
				console.error("DOM update error:", e);
			}
		}
	} finally {
		_isFlushing = false;

		// If more updates were scheduled during flush, schedule another flush
		if (_pending.size || _domUpdates.size || _computations.size) {
			_scheduleFlush();
		}
	}
};

const _proxy = (obj: any, prefix = ""): any => {
	if (!obj || typeof obj !== _objStr) return obj;
	return new Proxy(obj, {
		get(t, k) {
			const path = prefix ? `${prefix}.${_S(k)}` : _S(k);
			_track(path);
			const v = t[k];
			return typeof v === _objStr && v ? _proxy(v, path) : v;
		},
		set(t, k, v) {
			const path = prefix ? `${prefix}.${_S(k)}` : _S(k);
			if (_isEqual(t[k], v)) return true;
			t[k] = v;
			_trigger(path);
			return true;
		},
	});
};

export const _effect = (fn: () => void) => {
	const eff = new Effect(fn);
	eff._run();
	return () => eff._stop();
};

export const effect = (fn: () => void) => {
	const eff = new Effect(fn);
	eff._run();
	return () => eff._stop();
};

class Effect {
	_deps = new Set<() => void>();
	_active = true;

	constructor(public fn: () => void) {}

	_run() {
		if (!this._active) return;

		// Clear previous dependencies
		this._deps.forEach((cleanup) => cleanup());
		this._deps.clear();

		// Set current effect and run function
		const prev = _currentEffect;
		_currentEffect = this;
		try {
			this.fn();
		} finally {
			_currentEffect = prev;
		}
	}

	_stop() {
		this._active = false;
		this._deps.forEach((cleanup) => cleanup());
		this._deps.clear();
	}
}

// Global reactive store for all State instances
const _globalStore = _proxy({ _states: {} });

// State class that uses the new reactive store internally
export class State<T = unknown> {
	_name: string;
	#derive?: () => T;
	#cachedValue?: T;
	#isDerived = false;

	static #registry = new Map<string, State<unknown>>();

	constructor(value: T, name?: string) {
		this._name = name ?? Math.random().toString(36).substring(2, 15);
		_globalStore._states[this._name] = value;
		State.#registry.set(this._name, this);
	}

	static createComputed<T>(deriveFn: () => T, name?: string): State<T> {
		const state = new State(undefined as any, name);
		state.#derive = deriveFn;
		state.#isDerived = true;

		effect(() => {
			const newValue = deriveFn();
			if (!_isEqual(_globalStore._states[state._name], newValue)) {
				_globalStore._states[state._name] = newValue;
			}
		});

		return state;
	}

	static get<T>(name?: string): State<T> | undefined {
		return name
			? (this.#registry.get(name) as State<T> | undefined)
			: undefined;
	}

	get value(): T {
		_track(`states.${this._name}`);
		return _globalStore._states[this._name];
	}

	set value(newValue: T) {
		if (this.#derive) return;
		_globalStore._states[this._name] = newValue;
	}

	effect(fn: () => void) {
		return effect(fn);
	}

	// Integrated batching methods
	batchDOMUpdate(fn: () => void) {
		_domUpdates.add(fn);
		_scheduleFlush();
	}

	batchComputation(fn: () => void) {
		_computations.add(fn);
		_scheduleFlush();
	}

	// Expression-based effects with automatic batching
	expressionEffect(
		expression: string,
		callback: (value: any) => void,
		batchDOM = false
	) {
		return effect(() => {
			// For now, use a simple approach: access all properties mentioned in the expression
			// to ensure they're tracked, then evaluate
			const stateValue = this.value;

			// Extract property names from the expression for tracking
			const propertyMatches =
				expression.match(/\b[a-zA-Z_][a-zA-Z0-9_.]*\b/g) || [];

			for (const prop of propertyMatches) {
				if (prop in stateValue) {
					// Access the property to trigger tracking
					stateValue[prop as keyof typeof stateValue];
				}
			}

			const value = _evaluateExpression(expression, stateValue);

			if (batchDOM) {
				_domUpdates.add(() => callback(value));
				_scheduleFlush();
			} else {
				callback(value);
			}
		});
	}

	// Multi-expression template system
	template(
		bindings: Array<{ expression: string; update: (value: any) => void }>
	) {
		const cleanups: (() => void)[] = [];

		for (const binding of bindings) {
			const cleanup = this.expressionEffect(
				binding.expression,
				binding.update,
				true // Always batch DOM updates for templates
			);
			cleanups.push(cleanup);
		}

		return () => {
			cleanups.forEach((cleanup) => cleanup());
		};
	}

	// Computed batch - multiple related computations
	computedBatch<R extends Record<string, any>>(computations: {
		[K in keyof R]: () => R[K];
	}): State<R> {
		const result = new State({} as R, `${this._name}_batch`);

		effect(() => {
			// Execute computations directly, not in batch
			const newValue = {} as R;
			for (const [key, fn] of Object.entries(computations)) {
				newValue[key as keyof R] = (fn as any)();
			}
			result.value = newValue;
		});

		return result;
	}
}

// Batching utilities
export const batchDOMUpdates = (fn: () => void) => {
	_domUpdates.add(fn);
	_scheduleFlush();
};

export const batchComputations = (fn: () => void) => {
	_computations.add(fn);
	_scheduleFlush();
};

// Expression evaluator with caching
const _expressionCache = new Map<string, Function>();

const _evaluateExpression = (expression: string, context: any): any => {
	let fn = _expressionCache.get(expression);
	if (!fn) {
		try {
			// Create safe evaluation function
			fn = new Function(
				"state",
				`with(state) { return (${expression}); }`
			);
			_expressionCache.set(expression, fn);
		} catch (e) {
			console.error(`Expression compilation error: ${expression}`, e);
			return undefined;
		}
	}

	try {
		return fn(context);
	} catch (e) {
		console.error(`Expression evaluation error: ${expression}`, e);
		return undefined;
	}
};

// Export the default State constructor for backwards compatibility
export default State;

// Global batch utilities
export const batch = {
	dom: batchDOMUpdates,
	compute: batchComputations,

	// Run multiple updates in a single batch
	run: (fn: () => void) => {
		fn();
		_scheduleFlush();
	},

	// Template helper for multiple expressions on same state
	template: <T>(
		state: State<T>,
		bindings: Array<{
			expression: string;
			update: (value: any) => void;
		}>
	) => state.template(bindings),
};
