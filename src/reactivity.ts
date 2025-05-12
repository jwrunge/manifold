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
	id?: string;
};

const rxSeparateFnFromIterator = /\s+as\s+/;
const rxMatchFn = /^\s*(function)?\(.*\)(=>)?\s*/;
const rxCommaSeparator = /, */g;

const registered = !!globalThis.mfld;

window.mfld ??= {
	ontick: [],
	stores: new Map<string, WeakRef<Store>>(),
	funcs: new Map<string, WeakRef<() => void>>(),
};

if (!registered) register();

export const onTick = (fn: () => void) => {
	fn && mfld.ontick.push(fn);
};

export const $watch = <T>(value: T, id?: string) => new Store({ value, id });
export const $derive = <T>(updater: UpdaterFn<T> | string, id?: string) =>
	new Store<T>({ updater, id });

export const $st = new Proxy(mfld.stores, {
	get: (stores, property: string) => stores.get(property)?.deref()?.value,
	set: (stores, property: string, value) =>
		!!stores.get(property)?.deref()?.update(value),
}) as unknown as {
	[K in keyof typeof mfld.stores]: (typeof mfld.stores)[K] extends WeakRef<
		Store<infer T>
	>
		? T
		: undefined;
};

export const $fn = new Proxy(mfld.funcs, {
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
		const { id, updater, upstream, value } = ops;
		this.id = id ?? Math.random();
		const [updateFn, remap, upstreamFromFn] = this.#parseFn(updater);
		this.updater = updateFn;
		this.#remap = remap;
		for (const u of upstream ?? []) upstreamFromFn.add(new WeakRef(u));
		for (const ups of upstreamFromFn) this.#upstream.add(ups);
		this.value = value as T;
		this._reEval();
		mfld.stores.set(this.id.toString(), new WeakRef(this));
	}

	#changed(input: unknown): boolean {
		if (typeof input !== "object") return input !== this.value; // Direct compare primatives
		if ([Map, Set].some(c => input instanceof c))
			return this.#changed([
				...(input as Map<unknown, unknown> | Set<unknown>).entries(),
			]);

		const h = Array.from(
			new TextEncoder().encode(input?.toString() || ""),
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
			}),
		);
	}

	update(value?: T) {
		if (value === undefined) return;
		const newValue = typeof value === "function" ? value(this.value) : value;

		if (this.#changed(newValue)) {
			this.value = newValue;
			for (const down of this.#downstream) {
				Store.updateSet.add(down);
				Store.cancelAnim ||= requestAnimationFrame(() => runUpdates());
			}
		}

		return this.value;
	}
}

const runUpdates = (recursed = 0) => {
	if (recursed + 1 > 100)
		return console.log("MFLD recursion limit: check for circular updates.");
	Store.cancelAnim = 0;

	const newUpdateSet: Set<WeakRef<Store>> = new Set();
	for (const store of Store.updateSet) {
		//If the store has an upstream store that is contained in updateSet, don't add to newUpdateSet
		store.deref()?._reEval(newUpdateSet);
	}

	if (newUpdateSet.size) Store.updateSet = newUpdateSet;
	else {
		let fn: (() => void) | undefined;
		// biome-ignore lint/suspicious/noAssignInExpressions: this is more concise
		while ((fn = mfld.ontick.shift())) fn();
	}

	runUpdates(recursed);
};
