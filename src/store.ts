type StoreOptions<T> = {
	name?: string;
	deps?: Store<unknown>[];
	updater?: (value: T) => T;
	upstream?: Store<unknown>[];
};

export class Store<T> {
	name: string;
	value: T;
	#updater?: (value: T) => T;
	#upstream = new Set<WeakRef<Store<unknown>>>();
	#deps = new Set<WeakRef<Store<unknown>>>();
	#hash: number | null = null;

	constructor(value: T, ops?: StoreOptions<T>) {
		this.value = value;
		return this._modify(ops);
	}

	_modify(ops?: StoreOptions<T>): Store<T> {
		this.name = ops?.name || String(Date.now() + Math.random());
		this.#updater = ops?.updater;
		for (const ups of ops?.upstream ?? [])
			this.#upstream.add(new WeakRef(ups));
		for (const dep of ops?.deps ?? []) this.#deps.add(new WeakRef(dep));
		// this.#scheduleUpdate();
		return this;
	}

	#changed(input: unknown): boolean {
		if (typeof input != "object") return input === this.value; // Direct compare primatives

		if (Boolean([Map, Set].find((c) => input instanceof c)))
			return this.#changed([
				...(input as Map<unknown, unknown> | Set<unknown>).entries(),
			]);

		// Compare hash
		let h = 0;
		for (let char of new TextEncoder().encode(input?.toString() || ""))
			h = (h << 5) - h + char;

		let changed = h !== this.#hash;
		this.#hash = h;
		return changed;
	}

	_reEval() {
		let hasUpstream = false;
		for (let up of this.#upstream) {
			if (up.deref()) {
				hasUpstream = true;
				break;
			}
		}

		if (hasUpstream) {
			return true;
		} else {
			let newVal = this.#updater?.({ $st, $fn, $el: store._scope });
			this.update(newVal as T);
			return true;
		}
	}

	update(value: T) {
		let newValue = typeof value === "function" ? value(this.value) : value;

		if (this.#changed(newValue)) {
			// scheduleUpdate
			this.value = newValue;
			for (const dep of this.#deps) {
				/*scheduleUpdate(*/ dep.deref()?._reEval; /*)*/
			}
		}
	}
}

export function $<T>(name: string, ops?: StoreOptions<T>) {}
