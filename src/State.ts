import { Effect, type EffectDependency } from "./Effect.ts";
import proxy from "./proxy.ts";

export type StateConstraint = Record<string, unknown>;
export type FuncsConstraint = Record<string, (...args: never[]) => unknown>;

export let globalState: StateBuilder<StateConstraint, FuncsConstraint>;
export let useHierarchicalFlushing = true; // Global flag for flush strategy - modified by build()

// Effect hierarchy tracking
const effectChildren = new Map<Effect, Set<Effect>>(); // parent -> children
const effectParents = new Map<Effect, Effect | null>(); // child -> parent
const effectLevels = new Map<Effect, number>(); // effect -> depth level

const effect = (fn: EffectDependency) => {
	const currentParent = Effect.current;
	const newEffect = new Effect(fn);

	// Track parent-child relationship
	if (currentParent) {
		if (!effectChildren.has(currentParent)) {
			effectChildren.set(currentParent, new Set());
		}
		const children = effectChildren.get(currentParent);
		if (children) children.add(newEffect);
		effectParents.set(newEffect, currentParent);

		// Calculate level (parent level + 1)
		effectLevels.set(newEffect, (effectLevels.get(currentParent) ?? 0) + 1);

		// Circular dependency check - O(log n) traversal up the chain
		if (hasCircularDependency(newEffect, currentParent)) {
			throw new Error(
				`Circular dependency detected: effect would create infinite loop`
			);
		}
	} else {
		// Top-level effect
		effectParents.set(newEffect, null);
		effectLevels.set(newEffect, 0);
	}

	newEffect.run();
	return newEffect;
};

// Efficient circular dependency detection
function hasCircularDependency(
	newEffect: Effect,
	potentialAncestor: Effect
): boolean {
	let current: Effect | null = potentialAncestor;
	const visited = new Set<Effect>();

	while (current && !visited.has(current)) {
		if (current === newEffect) return true;
		visited.add(current);
		current = effectParents.get(current) ?? null;
	}
	return false;
}

// Get all top-level effects (level 0)
export function getTopLevelEffects(): Effect[] {
	return Array.from(effectLevels.entries())
		.filter(([_, level]) => level === 0)
		.map(([effect]) => effect);
}

// Get effects by level for batched execution
export function getEffectsByLevel(): Map<number, Effect[]> {
	const levelMap = new Map<number, Effect[]>();

	for (const [effect, level] of effectLevels.entries()) {
		if (!levelMap.has(level)) {
			levelMap.set(level, []);
		}
		const effects = levelMap.get(level);
		if (effects) effects.push(effect);
	}

	return levelMap;
}

// Get children of an effect
export function getEffectChildren(effect: Effect): Effect[] {
	return Array.from(effectChildren.get(effect) ?? []);
}

// Clean up effect from tracking when it's stopped
export function cleanupEffectTracking(effect: Effect) {
	// Remove from parent's children
	const parent = effectParents.get(effect);
	if (parent) {
		effectChildren.get(parent)?.delete(effect);
	}

	// Remove all children relationships
	effectChildren.delete(effect);
	effectParents.delete(effect);
	effectLevels.delete(effect);
}

export class StateBuilder<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint
> {
	#scopedState = {} as TState;
	#scopedFuncs = {} as TFuncs;
	#derivations = new Map<string, (store: StateConstraint) => unknown>();

	constructor(
		initialState?: TState,
		initialFuncs?: TFuncs,
		derivations?: Map<string, (store: StateConstraint) => unknown>
	) {
		this.#scopedState = (initialState || {}) as TState;
		this.#scopedFuncs = (initialFuncs || {}) as TFuncs;
		this.#derivations = derivations || new Map();
	}

	static create<S extends StateConstraint, F extends FuncsConstraint>(
		initialState?: S,
		initialFuncs?: F
	): StateBuilder<S, F> {
		return new StateBuilder<S, F>(initialState, initialFuncs);
	}

	static effect(fn: EffectDependency) {
		return effect(fn);
	}

	addState<K extends string, V>(
		key: K,
		value: V,
		sync?: () => void
	): StateBuilder<TState & Record<K, V>, TFuncs> {
		const newState = { ...this.#scopedState, [key]: value } as TState &
			Record<K, V>;
		if (sync) sync(); // TODO: this should be an effect that runs on state change -- account for deep props, too
		return new StateBuilder(
			newState,
			this.#scopedFuncs as TFuncs,
			this.#derivations
		) as StateBuilder<TState & Record<K, V>, TFuncs>;
	}

	addFunc<K extends string, F extends (...args: never[]) => unknown>(
		key: K,
		func: F
	): StateBuilder<TState, TFuncs & Record<K, F>> {
		const newFuncs = { ...this.#scopedFuncs, [key]: func } as TFuncs &
			Record<K, F>;
		return new StateBuilder(
			this.#scopedState,
			newFuncs,
			this.#derivations
		) as StateBuilder<TState, TFuncs & Record<K, F>>;
	}

	addDerived<K extends string, T>(
		key: K,
		fn: (store: TState) => T
	): StateBuilder<TState & Record<K, T>, TFuncs> {
		// Add a placeholder value to state (will be computed in build())
		const newState = {
			...this.#scopedState,
			[key]: undefined as T,
		} as TState & Record<K, T>;

		// Create new derivations map with the new derivation
		const newDerivations = new Map(this.#derivations);
		newDerivations.set(key, fn as (store: StateConstraint) => unknown);

		return new StateBuilder(
			newState,
			this.#scopedFuncs,
			newDerivations
		) as StateBuilder<TState & Record<K, T>, TFuncs>;
	}

	build(options?: { local?: boolean; hierarchical?: boolean }) {
		const { local, hierarchical } = options || {};

		if (!local) {
			if (globalState) throw "Global state redefined";
			globalState = this;

			// Set global flush strategy based on options
			useHierarchicalFlushing = hierarchical ?? true;
		}

		const state = proxy(this.#scopedState) as TState;

		// Initialize derived state values and set up effects
		for (const [key, deriveFn] of this.#derivations) {
			// Initialize the derived value immediately
			(state as Record<string, unknown>)[key] = (
				deriveFn as (store: TState) => unknown
			)(state);

			// Set up effect to keep it updated
			effect(() => {
				const newValue = (deriveFn as (store: TState) => unknown)(
					state
				);
				(state as Record<string, unknown>)[key] = newValue;
			});
		}

		return {
			state,
			fn: this.#scopedFuncs as TFuncs,
		};
	}
}
