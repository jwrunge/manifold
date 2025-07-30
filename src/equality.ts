const _toUint8Array = (b: ArrayBuffer | ArrayBufferView): Uint8Array =>
	b instanceof ArrayBuffer
		? new Uint8Array(b)
		: new Uint8Array(b.buffer, b.byteOffset, b.byteLength);

const compareArrays = (a: any[], b: any[], c: WeakSet<any>): boolean => {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++)
		if (!isEqual(a[i], b[i], c)) return false;
	return true;
};

export const isEqual = (a: any, b: any, c = new WeakSet()): boolean => {
	if (a === b) return true;
	if (!(a && b && typeof a == "object" && typeof b == "object")) return false;
	if (c.has(a) || c.has(b)) return a === b;

	c.add(a);
	c.add(b);

	const isA = a instanceof ArrayBuffer || ArrayBuffer.isView(a);
	const isB = b instanceof ArrayBuffer || ArrayBuffer.isView(b);

	if (isA || isB) {
		if (isA !== isB) return false; // If one is buffer, other must be too
		const [vA, vB] = [_toUint8Array(a), _toUint8Array(b)];
		if (vA.length !== vB.length) return false;
		for (let i = 0; i < vA.length; i++) if (vA[i] !== vB[i]) return false;
		return true;
	}

	const cA = a.constructor;
	const cB = b.constructor;
	if (cA !== cB && !(cA === Object && cB === Object)) return false;

	switch (cA) {
		case Array:
			return compareArrays(a, b, c);
		case Date:
			return a.getTime() === b.getTime();
		case Map:
			if (a.size !== b.size) return false;
			for (const [k, vA] of a.entries())
				if (!b.has(k) || !isEqual(vA, b.get(k), c)) return false;
			return true;
		case Set:
			if (a.size !== b.size) return false;
			for (const i of a) {
				let f = false;
				for (const iB of b) {
					if (isEqual(i, iB, c)) {
						f = true;
						break;
					}
				}
				if (!f) return false;
			}
			return true;
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

	const kA = Reflect.ownKeys(a);
	if (kA.length !== Reflect.ownKeys(b).length) return false;

	for (const k of kA)
		if (!Reflect.has(b, k) || !isEqual(a[k], b[k], c)) return false;
	return true;
};
