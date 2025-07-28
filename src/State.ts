import { isEqual } from "./equality";

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
const MAX_UPDATE_DEPTH = 100;
const updateStack = new Set<Effect>();
let updateDepth = 0;
let isFlushingEffects = false;
let pendingEffects = new Set<Effect>();
let batchDepth = 0;
let isProcessingBatch = false;
const reusableTriggeredSet = new Set<Effect>();

function flushPendingEffects() {
	if (isFlushingEffects || pendingEffects.size === 0) return;
	isFlushingEffects = true;
	try {
		while (pendingEffects.size > 0 && batchDepth < 10) {
			batchDepth++;
			const effectsToRun = new Set(pendingEffects);
			pendingEffects.clear();
			for (const effect of effectsToRun) {
				if (effect.isActive) effect.runImmediate();
			}
		}
		if (batchDepth >= 10) pendingEffects.clear();
	} finally {
		isFlushingEffects = false;
		batchDepth = 0;
		isProcessingBatch = false;
	}
}

function processEffectsBatched() {
	if (pendingEffects.size === 0 || isProcessingBatch) return;
	isProcessingBatch = true;
	flushPendingEffects();
}

class Effect {
	private dependencies = new Set<() => void>();
	public isActive = true;
	private isRunning = false;

	constructor(private fn: () => void) {}

	run() {
		if (!this.isActive) return;
		if (isFlushingEffects) {
			pendingEffects.add(this);
			return;
		}
		this.runImmediate();
	}

	runImmediate() {
		if (
			!this.isActive ||
			updateStack.has(this) ||
			this.isRunning ||
			updateDepth >= MAX_UPDATE_DEPTH
		)
			return;

		this.isRunning = true;
		updateStack.add(this);
		updateDepth++;

		for (const cleanup of this.dependencies) cleanup();
		this.dependencies.clear();

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

export class State<T = unknown> {
	public name: string;
	private _value: T;
	private _reactive: T;
	private _derive?: () => T;
	private _effects = new Set<Effect>();
	private _granularEffects = new Map<string | symbol, Set<Effect>>();
	private _effectToKeys = new Map<Effect, Set<string | symbol>>();
	private _effectToLastKey = new Map<Effect, string | symbol>();

	private static reg = new Map<string, State<unknown>>();

	constructor(value: T | (() => T), name?: string) {
		this.name ??= Math.random().toString(36).substring(2, 15);
		if (typeof value === "function") {
			this._derive = value as () => T;
			this._value = undefined as any;
			this._reactive = undefined as any;
			new Effect(() => this._updateValue()).runImmediate();
		} else {
			this._value = value;
			this._reactive = this._createProxy(value);
		}
	}

	static get<T>(name: string): State<T> | undefined {
		return this.reg.get(name) as State<T> | undefined;
	}

	private _updateValue() {
		const newValue = this._derive ? this._derive() : this._value;
		if (!isEqual(this._value, newValue)) {
			this._value = newValue;
			this._reactive = this._createProxy(newValue);
			this._triggerEffects();
		}
	}

	private _createProxy(
		obj: T,
		parent?: { state: State<any>; key: string | symbol }
	): T {
		if (!obj || typeof obj !== "object") return obj;

		if (obj instanceof Map || obj instanceof Set) {
			return new Proxy(obj, {
				get: (target, key) => {
					this._track(key);
					const value = Reflect.get(target, key);
					return typeof value === "function"
						? value.bind(target)
						: typeof value === "object" && value !== null
						? this._createProxy(value as any, { state: this, key })
						: value;
				},
				set: (target, key, value) => {
					if (isEqual(Reflect.get(target, key), value)) return true;
					const result = Reflect.set(target, key, value);
					if (result) {
						this._triggerGranularEffects(key);
						if (parent)
							parent.state._triggerGranularEffects(parent.key);
					}
					return result;
				},
			}) as T;
		}

		if (Array.isArray(obj)) {
			return new Proxy(obj, {
				get: (target, key) => {
					this._track(key);
					const value = Reflect.get(target, key);
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
							const effectsToProcess = new Set<Effect>();

							if (oldLength !== newLength) {
								const lengthEffects =
									this._granularEffects.get("length");
								if (lengthEffects) {
									for (const effect of lengthEffects) {
										if (effect.isActive)
											effectsToProcess.add(effect);
									}
								}
								for (const effect of this._effects) {
									if (effect.isActive)
										effectsToProcess.add(effect);
								}
							} else {
								for (let i = 0; i < target.length; i++) {
									const indexEffects =
										this._granularEffects.get(String(i));
									if (indexEffects) {
										for (const effect of indexEffects) {
											if (effect.isActive)
												effectsToProcess.add(effect);
										}
									}
								}
								for (const effect of this._effects) {
									if (effect.isActive)
										effectsToProcess.add(effect);
								}
							}

							if (parent) {
								const parentGranularEffects =
									parent.state._granularEffects.get(
										parent.key
									);
								if (parentGranularEffects) {
									for (const effect of parentGranularEffects) {
										if (effect.isActive)
											effectsToProcess.add(effect);
									}
								}
							}

							for (const effect of effectsToProcess)
								pendingEffects.add(effect);
							processEffectsBatched();
							return result;
						};
					}
					return typeof value === "object" && value !== null
						? this._createProxy(value as any, { state: this, key })
						: value;
				},
				set: (target, key, value) => {
					if (isEqual(Reflect.get(target, key), value)) return true;
					const result = Reflect.set(target, key, value);
					if (result) {
						this._triggerGranularEffects(key);
						if (parent)
							parent.state._triggerGranularEffects(parent.key);
					}
					return result;
				},
			}) as T;
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
				if (isEqual(Reflect.get(target, key), value)) return true;
				const result = Reflect.set(target, key, value);
				if (result) {
					this._triggerGranularEffects(key);
					if (parent) {
						parent.state._triggerGranularEffectsWithParent(
							parent.key,
							parent
						);
					} else {
						for (const effect of this._effects) {
							if (
								effect.isActive &&
								!pendingEffects.has(effect)
							) {
								let isGranular = false;
								for (const granularEffects of this._granularEffects.values()) {
									if (granularEffects.has(effect)) {
										isGranular = true;
										break;
									}
								}
								if (!isGranular) pendingEffects.add(effect);
							}
						}
					}
					processEffectsBatched();
				}
				return result;
			},
		}) as T;
	}

	private _track(key: string | symbol) {
		const effect = currentEffect;
		if (!effect) return;

		this._effectToLastKey.set(effect, key);

		let granularEffects = this._granularEffects.get(key);
		if (!granularEffects) {
			granularEffects = new Set();
			this._granularEffects.set(key, granularEffects);
		}

		if (!granularEffects.has(effect)) {
			granularEffects.add(effect);

			if (!this._effectToKeys.has(effect)) {
				this._effectToKeys.set(effect, new Set());
			}
			this._effectToKeys.get(effect)!.add(key);

			effect.addDependency(() => {
				granularEffects!.delete(effect);
				const keySet = this._effectToKeys.get(effect);
				if (keySet) {
					keySet.delete(key);
					if (keySet.size === 0) {
						this._effectToKeys.delete(effect);
						this._effects.delete(effect);
					}
				}
				if (granularEffects!.size === 0) {
					this._granularEffects.delete(key);
				}
				this._effectToLastKey.delete(effect);
			});
		}
	}

	private _triggerEffects() {
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
		processEffectsBatched();
	}

	private _triggerGranularEffects(key: string | symbol) {
		const granularEffects = this._granularEffects.get(key);
		if (granularEffects) {
			for (const effect of granularEffects) {
				if (
					effect.isActive &&
					this._effectToLastKey.get(effect) === key
				) {
					pendingEffects.add(effect);
				}
			}
		}
		processEffectsBatched();
	}

	private _triggerGranularEffectsWithParent(
		key: string | symbol,
		parentInfo?: { state: State<any>; key: string | symbol }
	) {
		const granularEffects = this._granularEffects.get(key);
		if (granularEffects) {
			for (const effect of granularEffects) {
				if (
					effect.isActive &&
					this._effectToLastKey.get(effect) === key
				) {
					pendingEffects.add(effect);
				}
			}
		}

		if (parentInfo) {
			parentInfo.state._triggerGranularEffects(parentInfo.key);
		}
		processEffectsBatched();
	}

	get value(): T {
		const effect = currentEffect;
		if (effect && !this._effects.has(effect)) {
			this._effects.add(effect);
			effect.addDependency(() => this._effects.delete(effect));
		}
		return this._reactive;
	}

	set value(newValue: T) {
		if (this._derive) return;
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
