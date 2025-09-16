const isIdent = (s: string) => /^[A-Za-z_$][\w$]*$/.test(s);

const splitTopLevel = (src: string, sep: string): string[] => {
	const out: string[] = [];
	let p = 0,
		b = 0,
		c = 0,
		q = "",
		last = 0;
	for (let i = 0; i < src.length; i++) {
		const ch = src[i];
		if (q) {
			if (ch === q && src[i - 1] !== "\\") q = "";
			continue;
		}
		if (ch === '"' || ch === "'") {
			q = ch;
			continue;
		}
		if (ch === "(") p++;
		else if (ch === ")") p--;
		else if (ch === "[") b++;
		else if (ch === "]") b--;
		else if (ch === "{") c++;
		else if (ch === "}") c--;
		if (p || b || c) continue;
		if (ch === sep) {
			out.push(src.slice(last, i).trim());
			last = i + 1;
		}
	}
	out.push(src.slice(last).trim());
	return out;
};

const indexOfTopLevel = (src: string, chr: string): number => {
	let p = 0,
		b = 0,
		c = 0,
		q = "";
	for (let i = 0; i < src.length; i++) {
		const ch = src[i];
		if (q) {
			if (ch === q && src[i - 1] !== "\\") q = "";
			continue;
		}
		if (ch === '"' || ch === "'") {
			q = ch;
			continue;
		}
		if (ch === "(") p++;
		else if (ch === ")") p--;
		else if (ch === "[") b++;
		else if (ch === "]") b--;
		else if (ch === "{") c++;
		else if (ch === "}") c--;
		if (p || b || c) continue;
		if (ch === chr) return i;
	}
	return -1;
};

const bindIdent = (
	ident: string,
	val: unknown,
	target: Record<string, unknown>
) => {
	if (!ident) return;
	if (!isIdent(ident)) return;
	target[ident] = val as unknown;
};

const applyObjectPattern = (
	pattern: string,
	value: unknown,
	target: Record<string, unknown>
) => {
	if (value == null || typeof value !== "object") return;
	const inner = pattern.trim().slice(1, -1).trim();
	if (!inner) return;
	const entries = splitTopLevel(inner, ",").filter(Boolean);
	for (const entry of entries) {
		const idx = indexOfTopLevel(entry, ":");
		if (idx === -1) {
			const key = entry.trim();
			if (!isIdent(key)) continue;
			const v = (value as Record<string, unknown>)[key];
			bindIdent(key, v, target);
			continue;
		}
		const left = entry.slice(0, idx).trim();
		const right = entry.slice(idx + 1).trim();
		if (!isIdent(left) || !right) continue;
		const v = (value as Record<string, unknown>)[left];
		if (right.startsWith("{") && right.endsWith("}")) {
			applyObjectPattern(right, v, target);
		} else if (right.startsWith("[") && right.endsWith("]")) {
			applyArrayPattern(right, v, target);
		} else if (isIdent(right)) {
			bindIdent(right, v, target);
		}
	}
};

const applyArrayPattern = (
	pattern: string,
	value: unknown,
	target: Record<string, unknown>
) => {
	if (!Array.isArray(value)) return;
	const inner = pattern.trim().slice(1, -1);
	const items = splitTopLevel(inner, ",");
	for (let i = 0; i < items.length; i++) {
		const item = items[i].trim();
		if (!item) continue;
		const v = value[i];
		if (item.startsWith("{") && item.endsWith("}")) {
			applyObjectPattern(item, v, target);
		} else if (item.startsWith("[") && item.endsWith("]")) {
			applyArrayPattern(item, v, target);
		} else if (isIdent(item)) {
			bindIdent(item, v, target);
		}
	}
};

export const applyAliasPattern = (
	aliasStr: string | undefined,
	value: unknown,
	target: Record<string, unknown>
) => {
	const pat = (aliasStr || "").trim();
	if (!pat) return;
	if (pat.startsWith("{") && pat.endsWith("}"))
		return applyObjectPattern(pat, value, target);
	if (pat.startsWith("[") && pat.endsWith("]"))
		return applyArrayPattern(pat, value, target);
	if (isIdent(pat)) return bindIdent(pat, value, target);
};

export default applyAliasPattern;
