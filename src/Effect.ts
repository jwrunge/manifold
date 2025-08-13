export type EffectDependency = () => void;

export class Effect {
	static current: Effect | null = null;

	deps: Set<EffectDependency>;
	#active = true;
	fn: () => void;
	level: number; // Store level directly on the effect instance

	constructor(fn: () => void) {
		this.fn = fn;
		this.deps = new Set<EffectDependency>();

		// Calculate level based on current effect stack depth
		this.level = Effect.current ? Effect.current.level + 1 : 0;
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
		// Import cleanupEffectTracking from State.ts when needed
		// cleanupEffectTracking(this);
	}

	#clean() {
		const deps = this.deps;
		for (const cleanup of deps) cleanup();
		deps.clear();
	}
}
