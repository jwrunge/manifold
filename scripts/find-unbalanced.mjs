import fs from "node:fs";

const file = process.argv[2] || "dist/manifold.es.js";
const s = fs.readFileSync(file, "utf8");
let inStr = null,
	inTpl = false,
	inRegex = false,
	inLine = false,
	inBlock = false,
	esc = false;
const stack = []; // {type: '('/'{'/'[', idx, line, col}
function pos(idx) {
	let line = 1,
		col = 1;
	for (let i = 0; i < idx; i++) {
		if (s[i] === "\n") {
			line++;
			col = 1;
		} else col++;
	}
	return { line, col };
}
function isRegexStart(i) {
	const prev = s.slice(Math.max(0, i - 50), i);
	const last = prev.trim().slice(-1);
	return !last || "([{:;,=!&|?+-*%~^<>\n".includes(last);
}
for (let i = 0; i < s.length; i++) {
	const c = s[i],
		n = s[i + 1];
	if (inLine) {
		if (c === "\n") {
			inLine = false;
		}
		continue;
	}
	if (inBlock) {
		if (c === "*" && n === "/") {
			inBlock = false;
			i++;
		}
		continue;
	}
	if (inStr) {
		if (esc) {
			esc = false;
			continue;
		}
		if (c === "\\") {
			esc = true;
			continue;
		}
		if (c === inStr) {
			inStr = null;
		}
		continue;
	}
	if (inTpl) {
		if (esc) {
			esc = false;
			continue;
		}
		if (c === "\\") {
			esc = true;
			continue;
		}
		if (c === "`") {
			inTpl = false;
			continue;
		}
		if (c === "$" && n === "{") {
			stack.push({ type: "(", idx: i + 1, ...pos(i + 1) });
			i++;
		}
		continue;
	}
	if (inRegex) {
		if (esc) {
			esc = false;
			continue;
		}
		if (c === "\\") {
			esc = true;
			continue;
		}
		if (c === "/") {
			inRegex = false;
		}
		continue;
	}
	if (c === "/" && n === "/") {
		inLine = true;
		i++;
		continue;
	}
	if (c === "/" && n === "*") {
		inBlock = true;
		i++;
		continue;
	}
	if (c === "'" || c === '"') {
		inStr = c;
		continue;
	}
	if (c === "`") {
		inTpl = true;
		continue;
	}
	if (c === "/") {
		if (isRegexStart(i)) {
			inRegex = true;
			continue;
		}
	}
	if (c === "(" || c === "{" || c === "[") {
		stack.push({ type: c, idx: i, ...pos(i) });
		continue;
	}
	if (c === ")" || c === "}" || c === "]") {
		const expect = c === ")" ? "(" : c === "}" ? "{" : "[";
		for (let j = stack.length - 1; j >= 0; j--) {
			if (stack[j].type === expect) {
				stack.splice(j, 1);
				expect;
				break;
			}
		}
		// if no match found
		// Check if there was any of same type at all
		if (!stack.some((x) => x.type === expect)) {
			const { line, col } = pos(i);
			console.log("Unmatched close", c, "at", line + ":" + col);
			process.exit(0);
		}
	}
}
console.log("Unclosed opens:", stack.slice(-5));
