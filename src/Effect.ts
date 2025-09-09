export type EffectFn = () => void;

interface SubscriptionRef {
	_sub: Subscriptions;
	_index: number;
}

export interface Subscriptions {
	_effects: (Effect | null)[];
	_map: Map<Effect, number>;
	_holes?: number; // Allow holes in the effects array to optimize memory -- compacted in #clean()
}

export const effect = (fn: EffectFn) => {
	const e = Effect._acquire(fn);
	e._run();
	return e;
};

export class Effect {
	static _current: Effect | null = null;
	static #pool: Effect[] = [];

	static _acquire(fn: () => void) {
		const inst = Effect.#pool.pop();
		if (inst) {
			inst._fn = fn;
			inst.#active = true;
			inst.#deps.length = 0;
			inst._level = Effect._current ? Effect._current._level + 1 : 0;
			return inst;
		}
		return new Effect(fn);
	}

	#deps: SubscriptionRef[] = [];
	#active = true;
	_fn: () => void;
	_level: number;

	constructor(fn: () => void) {
		this._fn = fn;
		this._level = Effect._current ? Effect._current._level + 1 : 0;
	}

	_addDep(sub: Subscriptions, index: number) {
		this.#deps.push({ _sub: sub, _index: index });
	}

	_run() {
		if (this.#active) {
			this.#clean();
			const prev = Effect._current;
			Effect._current = this;
			try {
				this._fn();
			} finally {
				Effect._current = prev;
			}
		}
	}

	_stop() {
		if (this.#active) {
			this.#active = false;
			this.#clean();

			// Return to pool for reuse
			if (Effect.#pool.length < 1024) {
				this._fn = () => {};
				this.#deps.length = 0;
				Effect.#pool.push(this);
			}
		}
	}

	#clean() {
		for (const { _sub: sub, _index: index } of this.#deps) {
			if (sub._effects[index] === this) {
				sub._effects[index] = null;
				sub._map.delete(this);
				sub._holes = (sub._holes ?? 0) + 1;
				const { length } = sub._effects;
				if (
					length >= 4 &&
					sub._holes > Math.max(8, (length * 0.25) | 0) // Compact if holes > 25% or 8
				) {
					const newArr: (Effect | null)[] = [];
					sub._holes = 0;
					sub._map.clear();
					for (const eff of sub._effects)
						if (eff) {
							sub._map.set(eff, newArr.length);
							newArr.push(eff);
						}
					sub._effects = newArr;
				}
			}
		}
		this.#deps.length = 0;
	}
}
