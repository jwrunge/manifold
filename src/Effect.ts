export type EffectDependency = () => void;

export class Effect {
	static current: Effect | null = null;

	deps: Set<EffectDependency>;
	#active = true;
	fn: () => void;

	constructor(fn: () => void) {
		this.fn = fn;
		this.deps = new Set<EffectDependency>();
	}

	run() {
		if (!this.#active) return;
		this.#clean();

		// Set current effect and run function
		const prev = Effect.current;
		Effect.current = this;
		try {
			this.fn();
		} finally {
			Effect.current = prev;
		}
	}

	stop() {
		this.#active = false;
		this.#clean();
	}

	#clean() {
		const deps = this.deps;
		for (const cleanup of deps) cleanup();
		deps.clear();
	}
}
