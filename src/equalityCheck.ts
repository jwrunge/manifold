export const isEqual = (a: any, b: any, checked = new WeakSet()): boolean => {
	if (a === b) return true;
	if (!(a && b && [typeof a, typeof b].includes("object"))) return false;

	if (checked.has(a) && checked.has(b)) return true; // Handle circular references
	checked.add(a);
	checked.add(b);

	const isABufA = a instanceof ArrayBuffer || ArrayBuffer.isView(a);
	const isABufB = b instanceof ArrayBuffer || ArrayBuffer.isView(b);

	if (isABufA && isABufB) {
		const aView =
			a instanceof ArrayBuffer
				? new Uint8Array(a)
				: new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
		const bView =
			b instanceof ArrayBuffer
				? new Uint8Array(b)
				: new Uint8Array(b.buffer, b.byteOffset, b.byteLength);

		if (aView.length !== bView.length) return false;
		for (let i = 0; i < aView.length; i++) {
			if (aView[i] !== bView[i]) return false;
		}
		return true;
	} else if (isABufA !== isABufB) {
		return false;
	}

	const [classA, classB] = [a, b].map((x) => x.constructor);
	if (classA !== classB && !(classA === Object && classB === Object))
		return false;

	switch (classA) {
		case Object:
			break;
		case Array:
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (!isEqual(a[i], b[i], checked)) return false;
			}
			return true;
		case Date:
			return a.getTime() === b.getTime();
		case Map:
			if (a.size !== b.size) return false;
			for (const [key, valA] of a.entries()) {
				if (!b.has(key) || !isEqual(valA, b.get(key), checked)) {
					return false;
				}
			}
			return true;
		case Set:
			if (a.size !== b.size) return false;
			const aValues = Array.from(a.values()).sort((x, y) =>
				String(x).localeCompare(String(y))
			);
			const bValues = Array.from(b.values()).sort((x, y) =>
				String(x).localeCompare(String(y))
			);
			return isEqual(aValues, bValues, checked); // Recurse on sorted arrays
		case URL:
			return a.href === b.href;
		case URLSearchParams:
			return a.toString() === b.toString();
		case Error:
			return a.name === b.name && a.message === b.message;
		case RegExp:
			return a.source === b.source && a.flags === b.flags;
		case Function:
		case Promise:
			return false;
	}

	const [keysA, keysB] = [a, b].map((x) => Reflect.ownKeys(x));
	if (keysA.length !== keysB.length) return false;

	keysA.sort();
	keysB.sort();

	for (const key of keysA) {
		if (
			!Reflect.getOwnPropertyDescriptor(b, key) ||
			!isEqual(a[key], b[key], checked)
		) {
			return false;
		}
	}

	return true;
};
