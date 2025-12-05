// Internal: iterate characters at top-level only; stop when callback returns true
const scanTopLevel = (
	src: string,
	onTop: (i: number, ch: string) => boolean,
) => {
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
		if (onTop(i, ch)) return;
	}
};

export const indexOfTopLevel = (src: string, chr: string): number => {
	let found = -1;
	scanTopLevel(src, (i, ch) => {
		if (ch === chr) {
			found = i;
			return true;
		}
		return false;
	});
	return found;
};

export const isIdent = (s?: string): boolean =>
	!!s && /^[A-Za-z_$][\w$]*$/.test(s);

export const splitTopLevel = (src: string, sep: string): string[] => {
	const out: string[] = [];
	let last = 0;
	scanTopLevel(src, (i, ch) => {
		if (ch === sep) {
			out.push(src.slice(last, i).trim());
			last = i + 1;
		}
		return false;
	});
	out.push(src.slice(last).trim());
	return out;
};

export const isIdentContinuation = (char: string): boolean =>
	/[\w$]/.test(char);

export const splitAs = (rawAttr: string): [string, string | undefined] => {
	let res: [string, string | undefined] | null = null;
	scanTopLevel(rawAttr, (i, _ch) => {
		if (rawAttr.startsWith(" as ", i)) {
			const left = rawAttr.slice(0, i).trim();
			const right = rawAttr.slice(i + 4).trim();
			res = [left, right || undefined];
			return true;
		}
		return false;
	});
	return res ?? [rawAttr.trim(), undefined];
};
