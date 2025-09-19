/**
 * Find the index of a top-level character (not inside parentheses, brackets, braces, or quotes)
 */
export const indexOfTopLevel = (src: string, chr: string): number => {
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
		if (ch === '"' || ch === "'") q = ch;
		else if (ch === "(") p++;
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

/**
 * Split a string by a separator at the top level (not inside parentheses, brackets, braces, or quotes)
 */
export const splitTopLevel = (src: string, sep: string): string[] => {
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
