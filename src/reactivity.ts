type StoreOptionsWithValue<T> = {
	value: T;
	updater: undefined;
	upstream: undefined;
};

type StoreOptionsWithFunc<T> = {
	value: undefined;
	updater: (upstream: Store[]) => T;
	upstream?: Store[];
};

type StoreOptions<T> = StoreOptionsWithValue<T> | StoreOptionsWithFunc<T>;

type Updater<T> = (upstream: Store[]) => T;

class Store<T = unknown> {
	value: T;
	#updater?: Updater<T>;
	#upstream = new Set<WeakRef<Store>>();
	#downstream = new Set<WeakRef<Store>>();
	#hash: number | null = null;
	static updateSet: Set<WeakRef<Store>> = new Set();
	static cancelAnim = 0;

	constructor(ops: StoreOptions<T>) {
		const { value, updater, upstream = [] } = ops;
		this.#updater = updater;
		for (const u of upstream) this.#upstream.add(new WeakRef(u));
		this.value = this.update(value ?? updater);
	}

	#changed(input: unknown): boolean {
		if (typeof input !== "object") return input === this.value;
		if (input instanceof Map || input instanceof Set)
			return this.#changed([
				...(input as Map<unknown, unknown> | Set<unknown>).entries(),
			]);

		const h = Array.from(
			new TextEncoder().encode(String(input || ""))
		).reduce((hash, char) => (hash << 5) - hash + char, 0);

		const changed = h !== this.#hash;
		this.#hash = h;
		return changed;
	}

	update(value?: T | Updater<T>): T {
		const newValue =
			value instanceof Function
				? value(
						[...this.#upstream]
							.map((u) => u.deref())
							.filter((u) => !!u)
				  )
				: value ?? this.value;

		if (this.#changed(newValue)) {
			this.value = newValue;
			for (const down of this.#downstream) {
				Store.updateSet.add(down);
				Store.cancelAnim ||= requestAnimationFrame(() =>
					Store.#runUpdates()
				);
			}
		}

		return this.value;
	}

	_reEval(updateSet?: Set<WeakRef<Store>>) {
		if (this.#updater) {
			for (const up of this.#upstream) if (updateSet?.has(up)) return;
			return this.update(this.#updater ?? this.value);
		}
	}

	static #runUpdates(recursed = 0) {
		if (recursed + 1 > 100)
			return console.log(
				"MFLD recursion limit: check for circular updates."
			);
		Store.cancelAnim = 0;

		const newUpdateSet: Set<WeakRef<Store>> = new Set();
		for (const store of Store.updateSet) {
			//If the store has an upstream store that is contained in updateSet, don't add to newUpdateSet
			store.deref()?._reEval(newUpdateSet);
		}

		if (newUpdateSet.size) Store.updateSet = newUpdateSet;
		else {
			for (const fn of mfld.tick) fn();
			mfld.tick = [];
		}

		Store.#runUpdates(recursed);
	}
}
