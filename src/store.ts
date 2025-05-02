type UpdaterPayload<T> = {
	$st: Store<T>,
	$fn?: ()=> T,
	$el?: HTMLElement
}

type StoreOptions<T> = {
	value: T;
	deps?: Store<unknown>[];
	updater?: (p: UpdaterPayload<T>) => T;
	upstream?: Store<unknown>[];
	scope?: WeakRef<HTMLElement>;
};

if (!window.mfldStores) window.mfldStores = new Map<string, WeakRef<Store<unknown>>>();

export class Store<T> {
	id: number;
	value: T;
	readonly updater?: (p: UpdaterPayload<T>) => T;
	private upstream = new Set<WeakRef<Store<unknown>>>();
	private deps = new Set<WeakRef<Store<unknown>>>();
	private hash: number | null = null;

	constructor(ops: StoreOptions<T>) {
		this.id = Math.random();
		this.updater = ops.updater;
		for (const ups of ops.upstream ?? []) this.upstream.add(new WeakRef(ups));
		for (const dep of ops.deps ?? []) this.deps.add(new WeakRef(dep));
		this.value = ops.value;
	}

	private changed(input: unknown): boolean {
		if (typeof input !== "object") return input === this.value;	// Direct compare primatives
		if ([Map, Set].some(c => input instanceof c))
			return this.changed([...(input as Map<unknown, unknown> | Set<unknown>).entries()]);

		const h = Array.from(new TextEncoder().encode(input?.toString() || ""))
			.reduce((hash, char) => (hash << 5) - hash + char, 0);

		const changed = h !== this.hash;
		this.hash = h;
		return changed;
	}

	protected reEval(updateSet: Set<Store<unknown> | undefined>) {
		// Don't update if upstream store is in updateSet
		for (const up of this.upstream) {
			if (updateSet.has(up.deref())) return;
		}

		// Update value and propagate changes
		this.update(this.updater?.({
			$st: this,
			$fn: () => this.value,
			$el: this.payload?.$el ?? document.createElement("div")
		}));
	}

	public update(value?: T) {
		if(value === undefined) return;
		const newValue = typeof value === "function" ? value(this.value) : value;

		if (this.changed(newValue)) {
			// scheduleUpdate
			this.value = newValue;
			for (const dep of this.deps) {
				/*scheduleUpdate(*/ dep.deref()?.reEval; /*)*/
			}
		}
	}
}