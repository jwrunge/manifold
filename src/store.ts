type StoreOptions<T> = {
	value: T;
	deps?: Store<unknown>[];
	updater?: () => T;
	upstream?: Store<unknown>[];
};

if (!window.mfldStores) window.mfldStores = new Map<string, WeakRef<Store<unknown>>>();

export class Store<T> {
	id: number;
	value: T;
	readonly #updater?: (value: T) => T;
	#upstream = new Set<WeakRef<Store<unknown>>>();
	#deps = new Set<WeakRef<Store<unknown>>>();
	#hash: number | null = null;

	constructor(ops: StoreOptions<T>) {
		this.id = Math.random();
		this.#updater = ops.updater;
		for (const ups of ops.upstream ?? []) this.#upstream.add(new WeakRef(ups));
		for (const dep of ops.deps ?? []) this.#deps.add(new WeakRef(dep));
		this.value = ops.value;
	}

	#changed(input: unknown): boolean {
		if (typeof input !== "object") return input === this.value;	// Direct compare primatives

		if ([Map, Set].some(c => input instanceof c))
			return this.#changed([...(input as Map<unknown, unknown> | Set<unknown>).entries()]);

		const h = Array.from(new TextEncoder().encode(input?.toString() || ""))
			.reduce((hash, char) => (hash << 5) - hash + char, 0);

		const changed = h !== this.#hash;
		this.#hash = h;
		return changed;
	}

	_reEval(updateSet: Set<Store<unknown> | undefined>): boolean {
		// Don't update if upstream store is in updateSet
		for (const up of this.#upstream) {
			if (updateSet.has(up.deref())) return false;
		}

		// Update value and propagate changes
		this.update(this.#updater?.({ $st, $fn, $el: store._scope })as T);
		return true;
	}

	update(value: T) {
		const newValue = typeof value === "function" ? value(this.value) : value;

		if (this.#changed(newValue)) {
			// scheduleUpdate
			this.value = newValue;
			for (const dep of this.#deps) {
				/*scheduleUpdate(*/ dep.deref()?._reEval(new Set); /*)*/
			}
		}
	}
}

export function $watch<T>(val: T | (() => T)): Store<T> {
	const [updater, value] =
		typeof val === "function" ? [val as () => T] : [undefined, val];

	//Get upstream from function

	return new Store<T>({
		value,
		updater,
	});
}

export const $ = new Proxy(
	{},
	{
		get: (_, key: string) => window.mfldStores.get(key)?.deref(),
	}
);
