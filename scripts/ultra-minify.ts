import { transformSync } from "@babel/core";

// Minimal local types to avoid importing Babel types
type StringCount = Map<string, number>;
type CallKey = string; // e.g., "document.querySelector"
type CallCount = Map<CallKey, number>;

export default function ultraMinifyPlugin() {
	return {
		name: "ultra-minify-ast",
		apply: "build",
		renderChunk(code: string) {
			const result = transformSync(code, {
				ast: false,
				code: true,
				sourceMaps: false,
				configFile: false,
				babelrc: false,
				parserOpts: { sourceType: "unambiguous" },
				generatorOpts: {
					comments: false,
					compact: true,
					minified: true,
				},
				plugins: [
					function poolAndAlias(api: unknown) {
						const t = (api as any).types;

						// Counters
						const strCounts: StringCount = new Map();
						const callCounts: CallCount = new Map();
						const ctorCounts: Map<string, number> = new Map();

						// Selections
						const selectedStrings = new Map<string, string>();
						const selectedCalls = new Map<CallKey, string>();
						const selectedCtors = new Map<string, string>();

						// Helpers
						const isStringEligible = (path: unknown) => {
							const p = (path as any).parent;
							if (
								(p?.type === "ImportDeclaration" &&
									p.source === path.node) ||
								(p?.type === "ExportNamedDeclaration" &&
									p.source === path.node) ||
								(p?.type === "ExportAllDeclaration" &&
									p.source === path.node)
							)
								return false;
							if (
								(p?.type === "ObjectProperty" ||
									p?.type === "ObjectMethod") &&
								!p.computed &&
								p.key === path.node
							)
								return false;
							if (p?.type === "Directive") return false;
							return true;
						};

						const callKeyOf = (path: unknown): string | null => {
							const callee = (path as any).node.callee;
							if (
								!callee ||
								callee.type !== "MemberExpression" ||
								callee.computed ||
								callee.optional
							)
								return null;
							const obj = callee.object;
							const prop = callee.property;
							if (
								obj.type !== "Identifier" ||
								prop.type !== "Identifier"
							)
								return null;
							return obj.name + "." + prop.name;
						};

						const computeStringSavings = (
							value: string,
							count: number,
							idLen: number
						) => {
							const orig = count * (value.length + 2);
							const decl = 6 + idLen + value.length + 2; // var <id>="<value>"
							const uses = count * idLen;
							return orig - (decl + uses);
						};

						const computeCallSavings = (
							key: string,
							count: number,
							idLen: number
						) => {
							const orig = count * key.length;
							const [obj] = key.split(".");
							const decl =
								6 + idLen + 1 + key.length + 6 + obj.length + 2; // var id=obj.prop.bind(obj)
							const uses = count * idLen;
							return orig - (decl + uses);
						};

						const computeCtorSavings = (
							name: string,
							count: number,
							idLen: number
						) => {
							const orig = count * name.length;
							const decl = 5 + idLen + 1 + name.length; // var id=Name
							const uses = count * idLen;
							return orig - (decl + uses);
						};

						return {
							name: "pool-and-alias",
							visitor: {
								// Count phase
								StringLiteral(path: unknown) {
									if (!isStringEligible(path)) return;
									const v = (path as any).node.value;
									strCounts.set(
										v,
										(strCounts.get(v) || 0) + 1
									);
								},
								CallExpression(path: unknown) {
									const key = callKeyOf(path);
									if (!key) return;
									callCounts.set(
										key,
										(callCounts.get(key) || 0) + 1
									);
								},
								NewExpression(path: unknown) {
									const cal = (path as any).node.callee;
									if (cal && cal.type === "Identifier") {
										ctorCounts.set(
											cal.name,
											(ctorCounts.get(cal.name) || 0) + 1
										);
									}
								},

								// Per-class underscore-prefixed instance property renaming (scoped to class only)
								Class(path: unknown) {
									const seen = new Set<string>();
									(path as any).traverse({
										MemberExpression(p: unknown) {
											const pn = (p as any).node;
											if (
												pn.object?.type ===
													"ThisExpression" &&
												pn.property?.type ===
													"Identifier"
											) {
												const nm = pn.property.name;
												if (
													nm.startsWith("_") &&
													!nm.startsWith("__")
												)
													seen.add(nm);
											}
										},
										ClassProperty(p: unknown) {
											if ((p as any).node.static) return;
											const key = (p as any).node.key;
											if (key?.type === "Identifier") {
												const nm = key.name;
												if (
													nm.startsWith("_") &&
													!nm.startsWith("__")
												)
													seen.add(nm);
											}
										},
									});
									if (seen.size === 0) return;

									// build mapping
									const taken = new Set<string>();
									for (const n of seen) taken.add(n);
									const chars =
										"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_";
									let idx = 0;
									const nextName = (): string => {
										if (idx < chars.length)
											return chars[idx++];
										const a =
											chars[
												Math.floor(idx / chars.length) %
													chars.length
											];
										const b = chars[idx % chars.length];
										idx++;
										return a + b;
									};
									const map = new Map<string, string>();
									for (const n of seen) {
										let candidate = nextName();
										while (taken.has(candidate))
											candidate = nextName();
										map.set(n, candidate);
										taken.add(candidate);
									}

									// rewrite within class
									(path as any).traverse({
										MemberExpression(p: unknown) {
											const pn = (p as any).node;
											if (
												pn.object?.type ===
													"ThisExpression" &&
												pn.property?.type ===
													"Identifier"
											) {
												const repl = map.get(
													pn.property.name
												);
												if (repl)
													pn.property =
														t.identifier(repl);
											}
										},
										ClassProperty(p: unknown) {
											if ((p as any).node.static) return;
											const key = (p as any).node.key;
											if (key?.type === "Identifier") {
												const repl = map.get(key.name);
												if (repl)
													(p as any).node.key =
														t.identifier(repl);
											}
										},
									});
								},

								Program: {
									exit(programPath: unknown) {
										// choose string pools
										let sIdx = 0;
										for (const [val, cnt] of strCounts) {
											if (cnt < 3) continue;
											const id = "__S" + sIdx;
											const savings =
												computeStringSavings(
													val,
													cnt,
													id.length
												);
											if (savings > 0) {
												selectedStrings.set(val, id);
												sIdx++;
											}
										}

										// choose call aliases
										let fIdx = 0;
										for (const [key, cnt] of callCounts) {
											if (cnt < 3) continue;
											const id = "__F" + fIdx;
											const savings = computeCallSavings(
												key,
												cnt,
												id.length
											);
											if (savings > 0) {
												selectedCalls.set(key, id);
												fIdx++;
											}
										}

										// choose ctor aliases
										let cIdx = 0;
										for (const [name, cnt] of ctorCounts) {
											if (cnt < 3) continue;
											const id = "__C" + cIdx;
											const savings = computeCtorSavings(
												name,
												cnt,
												id.length
											);
											if (savings > 0) {
												selectedCtors.set(name, id);
												cIdx++;
											}
										}

										if (
											selectedStrings.size === 0 &&
											selectedCalls.size === 0 &&
											selectedCtors.size === 0
										)
											return;

										// Replace uses
										(programPath as any).traverse({
											StringLiteral(p: unknown) {
												if (!isStringEligible(p))
													return;
												const v = (p as any).node.value;
												const id =
													selectedStrings.get(v);
												if (id)
													(p as any).replaceWith(
														t.identifier(id)
													);
											},
											CallExpression(p: unknown) {
												const key = callKeyOf(p);
												if (!key) return;
												const id =
													selectedCalls.get(key);
												if (id)
													(p as any)
														.get("callee")
														.replaceWith(
															t.identifier(id)
														);
											},
											NewExpression(p: unknown) {
												const cal = (p as any).node
													.callee;
												if (
													cal?.type === "Identifier"
												) {
													const id =
														selectedCtors.get(
															cal.name
														);
													if (id)
														(p as any).node.callee =
															t.identifier(id);
												}
											},
										});

										// Decls after imports
										const decls: unknown[] = [];
										for (const [
											val,
											id,
										] of selectedStrings) {
											decls.push(
												t.variableDeclarator(
													t.identifier(id),
													t.stringLiteral(val)
												)
											);
										}
										for (const [key, id] of selectedCalls) {
											const [obj, prop] = key.split(".");
											const member = t.memberExpression(
												t.identifier(obj),
												t.identifier(prop)
											);
											const bound = t.callExpression(
												t.memberExpression(
													member,
													t.identifier("bind")
												),
												[t.identifier(obj)]
											);
											decls.push(
												t.variableDeclarator(
													t.identifier(id),
													bound
												)
											);
										}
										for (const [
											name,
											id,
										] of selectedCtors) {
											decls.push(
												t.variableDeclarator(
													t.identifier(id),
													t.identifier(name)
												)
											);
										}
										if (decls.length === 0) return;

										const varDecl = t.variableDeclaration(
											"var",
											decls as any
										);
										const body = (programPath as any).get(
											"body"
										);
										let insertAt = 0;
										while (
											insertAt < body.length &&
											body[insertAt].isImportDeclaration()
										)
											insertAt++;
										if (insertAt === body.length)
											(programPath as any).pushContainer(
												"body",
												varDecl
											);
										else
											(
												body[insertAt] as any
											).insertBefore(varDecl);
									},
								},
							},
						};
					},
				],
			});

			return { code: result?.code ?? code, map: null };
		},
	} as const;
}
