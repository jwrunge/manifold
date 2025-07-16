const toUint8Array = (buf: ArrayBuffer | ArrayBufferView): Uint8Array =>
	buf instanceof ArrayBuffer
		? new Uint8Array(buf)
		: new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

const compareArrays = <T>(a: T[], b: T[], checked: WeakSet<any>): boolean => {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (!isEqual(a[i], b[i], checked)) return false;
	}
	return true;
};

export const isEqual = (a: any, b: any, checked = new WeakSet()): boolean => {
	if (a === b) return true;
	if (!(a && b && typeof a == "object" && typeof b == "object")) return false;
	if (checked.has(a) || checked.has(b)) return a === b;

	checked.add(a);
	checked.add(b);

	const isABuf = a instanceof ArrayBuffer || ArrayBuffer.isView(a);
	const isBBuf = b instanceof ArrayBuffer || ArrayBuffer.isView(b);

	if (isABuf && isBBuf) {
		const [aView, bView] = [toUint8Array(a), toUint8Array(b)];
		if (aView.length !== bView.length) return false;
		for (let i = 0; i < aView.length; i++) {
			if (aView[i] !== bView[i]) return false;
		}
		return true;
	} else if (isABuf !== isBBuf) return false;

	const [classA, classB] = [a.constructor, b.constructor];
	if (classA !== classB && !(classA === Object && classB === Object))
		return false;

	switch (classA) {
		case Array:
			return compareArrays(a, b, checked);
		case Date:
			return a.getTime() === b.getTime();
		case Map:
			if (a.size !== b.size) return false;
			for (const [key, valA] of a.entries()) {
				if (!b.has(key) || !isEqual(valA, b.get(key), checked))
					return false;
			}
			return true;
		case Set:
			if (a.size !== b.size) return false;
			for (const item of a) {
				let found = false;
				for (const bItem of b) {
					if (isEqual(item, bItem, checked)) {
						found = true;
						break;
					}
				}
				if (!found) return false;
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

	const keysA = Reflect.ownKeys(a);
	if (keysA.length !== Reflect.ownKeys(b).length) return false;

	for (const key of keysA) {
		if (!Reflect.has(b, key) || !isEqual(a[key], b[key], checked))
			return false;
	}
	return true;
};
