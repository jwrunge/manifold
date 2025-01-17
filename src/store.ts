type StoreOptions<T> = {
	value?: T;
	deps?: Store<unknown>[];
	updater?: () => T;
	upstream?: Store<unknown>[];
};

declare global {
	interface Window {
		mfld_stores: Map<string, WeakRef<Store<unknown>>>;
	}
}

if (!window.mfld_stores)
	window.mfld_stores = new Map<string, WeakRef<Store<unknown>>>();

class Store<T> {
	id: string;
	value: T;
	#updater?: (value: T) => T;
	#upstream = new Set<WeakRef<Store<unknown>>>();
	#deps = new Set<WeakRef<Store<unknown>>>();
	#hash: number | null = null;

	constructor(ops?: StoreOptions<T>) {
		return this._modify(ops);
	}

	_modify(ops?: StoreOptions<T>): Store<T> {
		this.id = `${Date.now()}.${Math.random()}`;
		this.#updater = ops?.updater;
		for (const ups of ops?.upstream ?? [])
			this.#upstream.add(new WeakRef(ups));
		for (const dep of ops?.deps ?? []) this.#deps.add(new WeakRef(dep));
		this.value = ops?.value as T;

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

	_reEval(updateSet: Set<Store<unknown>>): boolean {
		// Don't update if upstream store is in updateSet
		for (let up of this.#upstream) {
			const upstream = up.deref();
			if (upstream && updateSet.has(upstream)) return false;
		}

		// Update value and propagate changes
		this.update(this.#updater?.({ $st, $fn, $el: store._scope }) as T);
		return true;
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

export function $watch<T>(val: T | (() => T)): Store<T> {
	const [updater, value] =
		typeof val == "function" ? [val as () => T] : [undefined, val];

	//Get upstream from function

	return new Store<T>({
		value,
		updater,
	});
}

export const $ = new Proxy(
	{},
	{
		get: (_, key: string) => window.mfld_stores.get(key)?.deref(),
	}
);
