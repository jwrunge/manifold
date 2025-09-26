const _objStr = "object",
	_constructor = "constructor",
	_keys = Object.keys;

// Note: Map/Set contents are not deeply compared - this is intentional
// for granular reactivity (UI updates happen via property access, not container equality)
// biome-ignore lint/suspicious/noExplicitAny: Type checking is dynamic here
/**
 * Shallow/deep comparison helper used to determine if values changed for reactivity.
 * Note: Map/Set contents are intentionally not deeply compared (see note above).
 * @public
 */
const _isEqual = (a: any, b: any): boolean => {
	if (a === b) return true;
	// Always treat Promises as unequal for reactivity
	if (a instanceof Promise || b instanceof Promise) return false;
	// biome-ignore lint/suspicious/noDoubleEquals: We are only doing a loose check
	if (!(a && b && typeof a == _objStr && typeof b == _objStr)) return false;

	const cA = a[_constructor],
		cB = b[_constructor];
	if (cA !== cB) return false;

	if (cA === Array) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++)
			if (!_isEqual(a[i], b[i])) return false;
		return true;
	}
	if (cA === Date) return a.getTime() === b.getTime();

	const kA = _keys(a),
		kB = _keys(b);
	if (kA.length !== kB.length) return false;

	for (const k of kA) if (!(k in b) || !_isEqual(a[k], b[k])) return false;
	return true;
};

export default _isEqual;
