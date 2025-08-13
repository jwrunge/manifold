import { Effect, type EffectDependency } from "./Effect.ts";
import isEqual from "./equality.ts";
import type { FuncsConstraint, State, StateConstraint } from "./State.ts";

const _objStr = "object",
	_S = String;

// Track effects by property path instead of by value
const pathEffects = new Map<string, Set<EffectDependency>>();

const proxy = (
	// biome-ignore lint/suspicious/noExplicitAny: non-user-facing types can be flexible
	obj: any,
	parentState: State<StateConstraint, FuncsConstraint>,
	prefix = ""
): StateConstraint => {
	if (!obj || typeof obj !== _objStr) return obj;
	return new Proxy(obj, {
		get(state, key) {
			const path = prefix ? `${prefix}.${_S(key)}` : _S(key);

			const effect = Effect.current;
			if (effect) {
				let effectSet = pathEffects.get(path);
				if (!effectSet) {
					effectSet = new Set();
					pathEffects.set(path, effectSet);
				}
				effectSet.add(effect.fn);

				effect.deps.add(() => {
					effectSet?.delete(effect.fn);
					if (effectSet?.size === 0) {
						pathEffects.delete(path);
					}
				});
			}

			const target = state[key];
			return typeof target === _objStr && target
				? proxy(target, parentState, path)
				: target;
		},
		set(state, key, value) {
			if (isEqual(state[key], value)) return true;
			state[key] = value;

			const path = prefix ? `${prefix}.${_S(key)}` : _S(key);
			const effectSet = pathEffects.get(path);
			if (effectSet) {
				for (const effect of effectSet) {
					effect();
				}
			}

			return true;
		},
	});
};

export default proxy;
