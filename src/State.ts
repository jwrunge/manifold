import { Effect, type EffectDependency } from "./Effect.ts";
import proxy from "./proxy.ts";

// type Effect = () => void; // Unused for now

export type StateConstraint = Record<string, unknown>;
export type FuncsConstraint = Record<string, (...args: never[]) => unknown>;

export let globalState: State<StateConstraint, FuncsConstraint>;
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

export class Builder<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint
> {
	#scopedState = {} as TState;
	#scopedFuncs = {} as TFuncs;

	constructor(initialState?: TState, initialFuncs?: TFuncs) {
		this.#scopedState = (initialState || {}) as TState;
		this.#scopedFuncs = (initialFuncs || {}) as TFuncs;
	}

	addState<K extends string, V>(
		key: K,
		value: V,
		sync?: () => void
	): Builder<TState & Record<K, V>, TFuncs> {
		const newState = { ...this.#scopedState, [key]: value } as TState &
			Record<K, V>;
		if (sync) sync(); // TODO: this should be an effect that runs on state change -- account for deep props, too
		return new Builder(newState, this.#scopedFuncs as TFuncs) as Builder<
			TState & Record<K, V>,
			TFuncs
		>;
	}

	addFunc<K extends string, F extends (...args: never[]) => unknown>(
		key: K,
		func: F
	): Builder<TState, TFuncs & Record<K, F>> {
		const newFuncs = { ...this.#scopedFuncs, [key]: func } as TFuncs &
			Record<K, F>;
		return new Builder(this.#scopedState, newFuncs) as Builder<
			TState,
			TFuncs & Record<K, F>
		>;
	}

	build(local?: boolean, options?: { hierarchical?: boolean }) {
		const app = new State<TState, TFuncs>(
			this.#scopedState,
			this.#scopedFuncs
		);

		if (!local) {
			if (globalState) throw "Global state redefined";
			globalState = app;

			// Set global flush strategy based on options
			useHierarchicalFlushing = options?.hierarchical ?? true;
		}

		return {
			store: proxy(app.store, app) as TState,
			fn: this.#scopedFuncs as TFuncs,
			effect,
			derived,
		};
	}
}

export class State<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint
> {
	store = {} as TState;
	funcs = {} as TFuncs;

	static create<S extends StateConstraint, F extends FuncsConstraint>(
		initialState?: S,
		initialFuncs?: F
	): Builder<S, F> {
		return new Builder<S, F>(initialState, initialFuncs);
	}

	constructor(state: TState, funcs: TFuncs) {
		this.store = state;
		this.funcs = funcs ?? ({} as TFuncs);
	}
}

// Derived state: creates a reactive computed value
const derived = <T>(fn: () => T) => {
	// Create a state to hold the derived value
	const derivedApp = new State({ value: fn() } as { value: T }, {});
	const derivedStore = proxy(derivedApp.store, derivedApp) as { value: T };

	// Create an effect that updates the derived state when dependencies change
	effect(() => {
		const newValue = fn();
		derivedStore.value = newValue;
	});

	return derivedStore;
};
