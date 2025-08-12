import isEqual from "./equality.ts";

const _objStr = "object",
	_S = String;

const proxy = (obj: any, prefix = ""): any => {
	if (!obj || typeof obj !== _objStr) return obj;
	return new Proxy(obj, {
		get(t, k) {
			const path = prefix ? `${prefix}.${_S(k)}` : _S(k);

			// for (const effect of _deps?.get(path) ?? []) _pending.add(effect);
			// _flush();

			const v = t[k];
			return typeof v === _objStr && v ? proxy(v, path) : v;
		},
		set(t, k, v) {
			const path = prefix ? `${prefix}.${_S(k)}` : _S(k);
			if (isEqual(t[k], v)) return true;
			t[k] = v;

			// for (const effect of _deps?.get(path) ?? []) _pending.add(effect);
			// _flush(); // Keep synchronous for backward compatibility

			return true;
		},
	});
};

export default proxy;
