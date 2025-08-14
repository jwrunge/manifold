export type EffectDependency = () => void;

export class Effect {
	static current: Effect | null = null;
	static _idCounter = 0;

	deps: Set<EffectDependency>;
	#active = true;
	fn: () => void;
	level: number; // depth level for hierarchical ordering
	id: number;

	constructor(fn: () => void) {
		this.fn = fn;
		this.deps = new Set<EffectDependency>();
		this.level = Effect.current ? Effect.current.level + 1 : 0;
		this.id = ++Effect._idCounter;
		const g = globalThis as unknown as Record<string, unknown>;
		if (g?.MF_TRACE) {
			try {
				console.log(
					"[mf][effect:create]",
					this.id,
					"level",
					this.level
				);
			} catch {}
		}
	}

	run() {
		if (!this.#active) return;
		this.#clean();

		// Set current effect and run function
		const prev = Effect.current;
		Effect.current = this;
		try {
			const g = globalThis as unknown as Record<string, unknown>;
			if (g?.MF_TRACE) {
				try {
					console.log("[mf][effect:run]", this.id);
				} catch {}
			}
			this.fn();
		} finally {
			Effect.current = prev;
		}
	}

	stop() {
		this.#active = false;
		const g = globalThis as unknown as Record<string, unknown>;
		if (g?.MF_TRACE) {
			try {
				console.log("[mf][effect:stop]", this.id);
			} catch {}
		}
		this.#clean();
	}

	#clean() {
		const deps = this.deps;
		for (const cleanup of deps) cleanup();
		deps.clear();
	}
}
