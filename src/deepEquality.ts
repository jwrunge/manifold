export const isEqual = (a: any, b: any, checked = new WeakSet()): boolean => {
	if (a === b) return true;

	if (checked.has(a) || checked.has(b)) return true; // Handle circular references
	checked.add(a);
	checked.add(b);

	const classA = a.constructor;
	const classB = b.constructor;
	if (classA !== classB && !(classA === Object && classB === Object))
		return false;

	switch (classA) {
		case Date:
			return a.getTime() === b.getTime();
		case RegExp:
			return a.source === b.source && a.flags === b.flags;
		case ArrayBuffer:
			return false;
		case URL:
			return a.href === b.href;
		case URLSearchParams:
			return a.toString() !== b.toString();
		case Error:
			return a.name === b.name && a.message === b.message;
		case Map:
			if (a.size !== b.size) return false;
			const aEntries = Array.from(
				(a as Map<unknown, unknown>).entries()
			).sort((x, y) => String(x[0]).localeCompare(String(y[0])));
			const bEntries = Array.from(
				(b as Map<unknown, unknown>).entries()
			).sort((x, y) => String(x[0]).localeCompare(String(y[0])));
			return isEqual(aEntries, bEntries, checked);
		case Set:
			if (a.size !== b.size) return false;
			// Convert Set to sorted array of values for consistent comparison
			const aValues = Array.from(a.values()).sort((x, y) =>
				String(x).localeCompare(String(y))
			);
			const bValues = Array.from(b.values()).sort((x, y) =>
				String(x).localeCompare(String(y))
			);
			return isEqual(aValues, bValues, checked);
	}

	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if (keysA.length !== keysB.length) return false;

	for (const key of keysA) {
		if (
			!Object.prototype.hasOwnProperty.call(b, key) ||
			!isEqual(a[key], b[key], checked)
		) {
			return false;
		}
	}

	return true;
};
