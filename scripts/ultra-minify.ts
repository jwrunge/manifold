export default function ultraMinifyPlugin() {
	return {
		name: "ultra-minify",
		generateBundle(
			options: unknown,
			bundle: Record<string, { type: string; code?: string }>
		) {
			for (const fileName in bundle) {
				const chunk = bundle[fileName];
				if (chunk.type === "chunk") {
					// Aggressive but safe whitespace and punctuation tightening (string-literal aware)
					let c: string = String(chunk.code ?? "");

					// Helper utilities
					const literalRe = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g; // string literals (no template literals)
					const importStmtRe = /(^|\n)\s*import[\s\S]*?;\s*/g; // import ... ; ranges
					const importRanges: Array<[number, number]> = [];
					for (const im of c.matchAll(importStmtRe)) {
						const start = im.index ?? 0;
						importRanges.push([start, start + im[0].length]);
					}
					const inImportRange = (i: number) =>
						importRanges.some(([s, e]) => i >= s && i < e);
					const isObjectKeyContext = (start: number, end: number) => {
						// look behind for previous non-space char
						let i = start - 1;
						while (i >= 0 && /\s/.test(c[i])) i--;
						const prev = i >= 0 ? c[i] : "";
						// look ahead for next non-space char
						let j = end;
						while (j < c.length && /\s/.test(c[j])) j++;
						const next = j < c.length ? c[j] : "";
						return (prev === "{" || prev === ",") && next === ":";
					};

					// First pass: apply whitespace/comment tightening only to non-string segments
					{
						let last = 0;
						const parts: string[] = [];
						const tighten = (seg: string) =>
							seg
								.replace(/\n+/g, "\n") // collapse consecutive newlines
								.replace(/\n\s+/g, "\n") // trim indentation
								.replace(/\s{2,}/g, " ") // collapse spaces
								.replace(/;\s*;/g, ";") // drop empty statements
								.replace(/\{\s+/g, "{") // space after {
								.replace(/\s+\}/g, "}") // space before }
								.replace(/\(\s+/g, "(") // space after (
								.replace(/\s+\)/g, ")") // space before )
								.replace(/,\s+/g, ",") // space after ,
								.replace(/:\s+/g, ":") // space after : (objects)
								.replace(/\/\/[^\n\r]*/g, "") // strip single-line comments
								// around simple operators (avoid < and > to keep JSX-safe spacing)
								.replace(/\s*([=+\-*!?:,&|])\s*/g, "$1");
						for (const m of c.matchAll(literalRe)) {
							const s = m.index ?? 0,
								e = s + m[0].length;
							parts.push(tighten(c.slice(last, s)), m[0]);
							last = e;
						}
						parts.push(tighten(c.slice(last)));
						c = parts.join("");
					}

					// Curated string pool (non-user-facing literals)
					const curated = [
						"data-if",
						"data-elseif",
						"data-else",
						"data-each",
						":await",
						":then",
						":catch",
						"data-await",
						"value",
						"err",
					];
					const curatedEntries = curated.map((s) => [s, 1] as const);
					// Dynamic pooling for literals appearing >= 3 times (outside imports and object key contexts)
					const dynamicCounts: Record<string, number> =
						Object.create(null);
					for (const lm of c.matchAll(literalRe)) {
						const start = lm.index ?? 0;
						const end = start + lm[0].length;
						if (
							inImportRange(start) ||
							isObjectKeyContext(start, end)
						)
							continue;
						const val = lm[0].slice(1, -1);
						if (/[/.]/.test(val)) continue;
						if (!/^[A-Za-z][\w$-]*$/.test(val)) continue;
						dynamicCounts[val] = (dynamicCounts[val] || 0) + 1;
					}
					const dynamicEntries = Object.entries(dynamicCounts).filter(
						([, n]) => n >= 3
					);

					// Build map and declarations
					let idx = 0;
					const map: Record<string, string> = Object.create(null);
					const decls: string[] = [];
					const strLit = (s: string) => JSON.stringify(s);
					for (const [s] of curatedEntries) {
						const v = `__s${idx++}`;
						map[s] = v;
						decls.push(`${v}=${strLit(s)}`);
					}
					for (const [s] of dynamicEntries) {
						if (map[s]) continue; // avoid duplicates
						const v = `__s${idx++}`;
						map[s] = v;
						decls.push(`${v}=${strLit(s)}`);
					}

					if (decls.length) {
						// Context-aware replacement: rebuild string with safe replacements only
						let lastIndex = 0;
						const parts: string[] = [];
						for (const lm of c.matchAll(literalRe)) {
							const start = lm.index ?? 0;
							const end = start + lm[0].length;
							parts.push(c.slice(lastIndex, start));
							if (
								inImportRange(start) ||
								isObjectKeyContext(start, end)
							) {
								parts.push(lm[0]);
							} else {
								const val = lm[0].slice(1, -1);
								parts.push(map[val] ?? lm[0]);
							}
							lastIndex = end;
						}
						parts.push(c.slice(lastIndex));
						c = parts.join("");

						// Insert declarations. For UMD, prepend at the very start so wrapper can access vars.
						const decl = `var ${decls.join(",")};`;
						const format =
							(options as unknown as { format?: string })
								?.format || "es";
						if (format === "umd") {
							c = decl + c;
						} else {
							const importPrologue = c.match(
								/^(?:import\s[^;]*;\s*)+/
							);
							if (importPrologue) {
								const at = importPrologue[0].length;
								c = c.slice(0, at) + decl + c.slice(at);
							} else {
								c = decl + c;
							}
						}

						// Identifier aliasing for common globals/methods (safe, context-specific)
						const idAliases: {
							name: string;
							decl: string;
							pattern: RegExp;
							replace: string;
						}[] = [
							{
								name: "__isa",
								decl: "__isa=Array.isArray",
								pattern: /\bArray\.isArray\s*\(/g,
								replace: "__isa(",
							},
							{
								name: "__af",
								decl: "__af=Array.from",
								pattern: /\bArray\.from\s*\(/g,
								replace: "__af(",
							},
							{
								name: "__wm",
								decl: "__wm=WeakMap",
								pattern: /\bnew\s+WeakMap\s*\(/g,
								replace: "new __wm(",
							},
							{
								name: "__map",
								decl: "__map=Map",
								pattern: /\bnew\s+Map\s*\(/g,
								replace: "new __map(",
							},
							{
								name: "__ce",
								decl: "__ce=document.createElement.bind(document)",
								pattern: /\bdocument\.createElement\s*\(/g,
								replace: "__ce(",
							},
							{
								name: "__qsa",
								decl: "__qsa=document.querySelectorAll.bind(document)",
								pattern: /\bdocument\.querySelectorAll\s*\(/g,
								replace: "__qsa(",
							},
							{
								name: "__ctw",
								decl: "__ctw=document.createTreeWalker.bind(document)",
								pattern: /\bdocument\.createTreeWalker\s*\(/g,
								replace: "__ctw(",
							},
							{
								name: "__gt",
								decl: "__gt=globalThis",
								pattern: /\bglobalThis\b/g,
								replace: "__gt",
							},
							{
								name: "__doc",
								decl: "__doc=document",
								pattern: /\bdocument\b/g,
								replace: "__doc",
							},
							{
								name: "__st",
								decl: "__st=setTimeout",
								pattern: /\bsetTimeout\s*\(/g,
								replace: "__st(",
							},
							{
								name: "__oh",
								decl: "__oh=Object.hasOwn",
								pattern: /\bObject\.hasOwn\s*\(/g,
								replace: "__oh(",
							},
							{
								name: "__pr",
								decl: "__pr=Promise.resolve.bind(Promise)",
								pattern: /\bPromise\.resolve\s*\(/g,
								replace: "__pr(",
							},
						];

						const usedDecls: string[] = [];
						for (const a of idAliases) {
							if (a.pattern.test(c)) {
								c = c.replace(a.pattern, a.replace);
								usedDecls.push(a.decl);
							}
						}

						if (usedDecls.length) {
							const aliasDecl = `var ${usedDecls.join(",")};`;
							const fmt =
								(options as unknown as { format?: string })
									?.format || "es";
							if (fmt === "umd") {
								c = aliasDecl + c;
							} else {
								const importPrologue = c.match(
									/^(?:import\s[^;]*;\s*)+/
								);
								if (importPrologue) {
									const at = importPrologue[0].length;
									c =
										c.slice(0, at) +
										aliasDecl +
										c.slice(at);
								} else {
									c = aliasDecl + c;
								}
							}
						}
					}

					// Replace NodeFilter.SHOW_TEXT with numeric constant (4) outside string literals
					{
						let last = 0;
						const partsNF: string[] = [];
						for (const m of c.matchAll(literalRe)) {
							const s = m.index ?? 0,
								e = s + m[0].length;
							const seg = c
								.slice(last, s)
								.replace(/\bNodeFilter\.SHOW_TEXT\b/g, "4");
							partsNF.push(seg, m[0]);
							last = e;
						}
						partsNF.push(
							c
								.slice(last)
								.replace(/\bNodeFilter\.SHOW_TEXT\b/g, "4")
						);
						c = partsNF.join("");
					}

					// Rewrite typeof X < "u" (a common terser pattern) to typeof X !== "undefined"
					{
						let last = 0;
						const out: string[] = [];
						const inline = (seg: string) =>
							seg.replace(
								/typeof\s+([A-Za-z_$][\w$]*)\s*<\s*(["'])u\2/g,
								(_all, id: string) =>
									`typeof ${id}!=="undefined"`
							);
						for (const m of c.matchAll(literalRe)) {
							const s = m.index ?? 0;
							const e = s + m[0].length;
							let seg = c.slice(last, s);
							const tail = seg.match(
								/typeof\s+([A-Za-z_$][\w$]*)\s*<\s*$/
							);
							if (tail && (m[0] === '"u"' || m[0] === "'u'")) {
								const id = tail[1];
								seg = seg.slice(0, seg.length - tail[0].length);
								out.push(seg + `typeof ${id}!=="undefined"`);
								last = e;
								continue;
							}
							out.push(inline(seg), m[0]);
							last = e;
						}
						out.push(inline(c.slice(last)));
						c = out.join("");
					}

					// Property aliasing
					{
						const props = [
							"stateRefs",
							"effects",
							"current",
							"hasAttribute",
							"getAttribute",
							"setAttribute",
							"removeAttribute",
							"previousElementSibling",
							"nextElementSibling",
							"parentElement",
							"querySelectorAll",
							"children",
							"attributes",
							"style",
							"display",
							"addEventListener",
							"remove",
							"insertBefore",
							"innerHTML",
							"tagName",
							"nextSibling",
							"previousSibling",
							"textContent",
						];
						const usedProps: string[] = [];
						let pIdx = 0;
						const pMap = new Map<string, string>();
						let last = 0;
						const out: string[] = [];
						for (const m of c.matchAll(literalRe)) {
							const s = m.index ?? 0,
								e = s + m[0].length;
							let seg = c.slice(last, s);
							for (const prop of props) {
								const v =
									pMap.get(prop) ||
									(() => {
										const vv = `__p${pIdx++}`;
										pMap.set(prop, vv);
										return vv;
									})();
								const reDot = new RegExp(
									`(?<!\\?)\\.\s*${prop}\\b`,
									"g"
								);
								let changed = false;
								seg = seg.replace(reDot, () => {
									changed = true;
									return `[${v}]`;
								});
								if (changed && !usedProps.includes(prop))
									usedProps.push(prop);
							}
							out.push(seg, m[0]);
							last = e;
						}
						let tail = c.slice(last);
						for (const prop of props) {
							const v =
								pMap.get(prop) ||
								(() => {
									const vv = `__p${pIdx++}`;
									pMap.set(prop, vv);
									return vv;
								})();
							const reDot = new RegExp(
								`(?<!\\?)\\.\s*${prop}\\b`,
								"g"
							);
							let changed = false;
							tail = tail.replace(reDot, () => {
								changed = true;
								return `[${v}]`;
							});
							if (changed && !usedProps.includes(prop))
								usedProps.push(prop);
						}
						out.push(tail);
						c = out.join("");

						// Optional chaining LHS fix
						c = c.replace(
							/\?\.(?=\[__p\d+\](?:\s*\[[^\]]+\])*\s*(?:=|\+=|-=|\*=|\/=|%=|\*\*=|<<=|>>=|>>>=|&=|\^=|\|=|\?\?=|\|\|=|&&=))/g,
							""
						);

						if (usedProps.length) {
							const decl = `var ${usedProps
								.map(
									(p) => `${pMap.get(p)}=${JSON.stringify(p)}`
								)
								.join(",")};`;
							const fmt =
								(options as unknown as { format?: string })
									?.format || "es";
							if (fmt === "umd") {
								c = decl + c;
							} else {
								const importPrologue = c.match(
									/^(?:import\s[^;]*;\s*)+/
								);
								if (importPrologue) {
									const at = importPrologue[0].length;
									c = c.slice(0, at) + decl + c.slice(at);
								} else {
									c = decl + c;
								}
							}
						}
					}

					// Remove comments outside string literals before squashing newlines
					{
						let last = 0;
						const partsNoComments: string[] = [];
						for (const m of c.matchAll(literalRe)) {
							const s = m.index ?? 0,
								e = s + m[0].length;
							const seg = c
								.slice(last, s)
								.replace(/\/\/[^\n\r]*/g, "")
								.replace(/\/\*[\s\S]*?\*\//g, "");
							partsNoComments.push(seg, m[0]);
							last = e;
						}
						partsNoComments.push(
							c
								.slice(last)
								.replace(/\/\/[^\n\r]*/g, "")
								.replace(/\/\*[\s\S]*?\*\//g, "")
						);
						c = partsNoComments.join("");
					}

					// Final newline handling:
					// - UMD: squash newlines to spaces.
					// - ES: preserve line boundaries to keep '//' comments harmless for import analyzers; just collapse runs.
					{
						const fmt =
							(options as unknown as { format?: string })
								?.format || "es";
						if (fmt === "umd") {
							c = c.replace(/\r?\n+/g, " ");
						} else {
							c = c.replace(/\r?\n{2,}/g, "\n");
						}
					}

					// JSX-safe: ensure a space before '<' when it is directly followed by a string literal to avoid JSX parsing in import analysis
					c = c.replace(/([$\w)\]])<(?=["'])/g, "$1 <");

					// Final safety: normalize terser-like typeof comparisons that can confuse import analyzers
					c = c
						.replace(
							/typeof\s+(__gt|__doc)\s*<\s*(["'])u\2/g,
							'typeof $1!=="undefined"'
						)
						.replace(
							/typeof\s+(__gt|__doc)\s*<\s*(["'])u\2/g,
							'typeof $1!=="undefined"'
						);

					// Final literal-aware whitespace squeeze (collapse runs of spaces/tabs outside strings)
					{
						let last = 0;
						const out: string[] = [];
						for (const m of c.matchAll(literalRe)) {
							const s = m.index ?? 0,
								e = s + m[0].length;
							out.push(
								c.slice(last, s).replace(/[\t ]{2,}/g, " ")
							);
							out.push(m[0]);
							last = e;
						}
						out.push(c.slice(last).replace(/[\t ]{2,}/g, " "));
						c = out.join("");
					}

					// Ensure the file ends with a newline
					chunk.code = c.trimEnd() + "\n";
				}
			}
		},
	};
}
