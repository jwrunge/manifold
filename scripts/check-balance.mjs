import fs from "node:fs";

const file = process.argv[2] || "dist/manifold.es.js";
const s = fs.readFileSync(file, "utf8");
let par = 0,
	br = 0,
	brk = 0; // () {} []
let inStr = null; // current quote char or null
let inTpl = false; // `
let inRegex = false;
let inLineComment = false;
let inBlockComment = false;
let esc = false;
function isRegexStart(i) {
	// naive: slash after certain punctuators likely starts regex
	const prev = s.slice(Math.max(0, i - 10), i);
	const last = prev.trim().slice(-1);
	return !last || "([{:;,=!&|?+-*%~^<>\n".includes(last);
}
for (let i = 0; i < s.length; i++) {
	const c = s[i];
	const n = s[i + 1];
	if (inLineComment) {
		if (c === "\n") inLineComment = false;
		continue;
	}
	if (inBlockComment) {
		if (c === "*" && n === "/") {
			inBlockComment = false;
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
			par++;
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
		inLineComment = true;
		i++;
		continue;
	}
	if (c === "/" && n === "*") {
		inBlockComment = true;
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
	if (c === "(") {
		par++;
		continue;
	}
	if (c === ")") {
		par--;
		continue;
	}
	if (c === "{") {
		br++;
		continue;
	}
	if (c === "}") {
		br--;
		continue;
	}
	if (c === "[") {
		brk++;
		continue;
	}
	if (c === "]") {
		brk--;
	}
}
console.log({
	par,
	br,
	brk,
	inStr,
	inTpl,
	inRegex,
	inLineComment,
	inBlockComment,
});
