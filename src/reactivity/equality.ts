const _objStr = "object",
	_constructor = "constructor",
	_keys = Object.keys;

const _isEqual = (a: unknown, b: unknown): boolean => {
	if (a === b) return true;
	// Always treat Promises as unequal for reactivity
	if (a instanceof Promise || b instanceof Promise) return false;
	// biome-ignore lint/suspicious/noDoubleEquals: We are only doing a loose check
	if (!(a && b && typeof a == _objStr && typeof b == _objStr)) return false;

	const cA = a[_constructor],
		cB = b[_constructor];
	if (cA !== cB) return false;

	if (cA === Array) {
		if ((a as Array<unknown>).length !== (b as Array<unknown>).length)
			return false;
		for (let i = 0; i < (a as unknown[]).length; i++)
			if (!_isEqual((a as Array<unknown>)[i], (b as Array<unknown>)[i]))
				return false;
		return true;
	}
	if (cA === Date) return (a as Date).getTime() === (b as Date).getTime();

	// Handle Set equality
	if (cA === Set) {
		const setA = a as Set<unknown>;
		const setB = b as Set<unknown>;
		if (setA.size !== setB.size) return false;
		for (const item of setA) {
			if (!setB.has(item)) return false;
		}
		return true;
	}

	// Handle Map equality
	if (cA === Map) {
		const mapA = a as Map<unknown, unknown>;
		const mapB = b as Map<unknown, unknown>;
		if (mapA.size !== mapB.size) return false;
		for (const [key, value] of mapA) {
			if (!mapB.has(key) || !_isEqual(value, mapB.get(key))) return false;
		}
		return true;
	}

	const kA = _keys(a),
		kB = _keys(b);
	if (kA.length !== kB.length) return false;

	for (const k of kA)
		if (
			!(k in (b as object)) ||
			!_isEqual(
				(a as Record<string, unknown>)[k],
				(b as Record<string, unknown>)[k],
			)
		)
			return false;
	return true;
};

export default _isEqual;
