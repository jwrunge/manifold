import { register } from "./registry";

type UpdaterPayload = {
	$st: typeof $st;
	$fn: typeof $fn;
	$el?: WeakRef<HTMLElement>;
};

type UpdaterFn<T> = (p: UpdaterPayload) => T;

type StoreOptions<T> = {
	value?: T;
	updater?: string | UpdaterFn<T>;
	upstream?: Store[];
	scope?: WeakRef<HTMLElement>;
};

globalThis.mfld ??= {
	st: new WeakMap<HTMLScriptElement, Map<string, Store>>(),
	fn: new WeakMap<HTMLScriptElement, Map<string, () => void>>(),
	tick: [],
};

export const $st = new Proxy(mfld.st, {
	get: (stores, property: string) => stores.get(property)?.deref(),
	set: (stores, property: string, value) => {
		stores.get(property)?.deref()?.update(value);
		return true;
	},
});

export const $fn = new Proxy(mfld.fn, {
	get: (funcs, property: string) => funcs.get(property)?.deref(),
	set: (funcs, property: string, value: () => void) => {
		funcs.set(property, new WeakRef(value));
		return true;
	},
});

export class Store<T = unknown> {
	id: number | string;
	value: T;
	readonly updater?: (p: UpdaterPayload) => T;
	#el?: WeakRef<HTMLElement>;
	#upstream = new Set<WeakRef<Store>>();
	#downstream = new Set<WeakRef<Store>>();
	#hash: number | null = null;
	#remap: [string, string] | [] = [];
	static updateSet: Set<WeakRef<Store>> = new Set();
	static cancelAnim = 0;

	constructor(ops: StoreOptions<T>) {
		this.id = Math.random();
		this.updater = ops.updater;
		for (const ups of ops.upstream ?? [])
			this.#upstream.add(new WeakRef(ups));
		for (const dep of ops.deps ?? []) this.#deps.add(new WeakRef(dep));
		this.value = ops.value;
	}

	#changed(input: unknown): boolean {
		if (typeof input !== "object") return input === this.value; // Direct compare primatives
		if ([Map, Set].some((c) => input instanceof c))
			return this.#changed([
				...(input as Map<unknown, unknown> | Set<unknown>).entries(),
			]);

		const h = Array.from(
			new TextEncoder().encode(input?.toString() || "")
		).reduce((hash, char) => (hash << 5) - hash + char, 0);

		const changed = h !== this.#hash;
		this.#hash = h;
		return changed;
	}

	#parseFn(
		fn?: UpdaterFn<T> | string,
	): [UpdaterFn<T> | undefined, [string, string] | [], Set<WeakRef<Store>>] {
		if (typeof fn !== "string") return [fn, [], new Set()];

		const [fnStr, asStr] = fn.split(rxSeparateFnFromIterator);
		const func = new Function("ops", fnStr) as UpdaterFn<T>;
		const dependencies = new Set<WeakRef<Store>>();
		return [
			func,
			(asStr?.split(rxCommaSeparator) as [string, string]) ?? [],
			dependencies,
		];
	}

	_reEval(updateSet?: Set<WeakRef<Store>>) {
		// Don't update if upstream store is in updateSet
		for (const up of this.#upstream) if (updateSet?.has(up)) return;

		// Update value and propagate changes
		return this.update(
			this.updater?.({
				$st,
				$fn,
				$el: this.#el,
			})
		);
	}

	update(value?: T) {
		if (value === undefined) return;
		const newValue =
			typeof value === "function" ? value(this.value) : value;

		if (this.#changed(newValue)) {
			this.value = newValue;
			for (const down of this.#downstream) {
				Store.updateSet.add(down);
				Store.cancelAnim ||= requestAnimationFrame(() => runUpdates());
			}
		}

		return this.value;
	}

	static #scheduleUpdate = (update: WeakRef<Store>) => {
		Store.updateSet.add(update);
		Store.cancelAnim ||= requestAnimationFrame(() => Store.#runUpdates());
	};

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

	runUpdates(recursed);
};
