import MagicString from "magic-string";

// Minimal local types to avoid importing heavy typing packages
// String/count maps
type StringCount = Map<string, number>;
type CallKey = string; // e.g., "document.querySelector"
type CallCount = Map<CallKey, number>;

type SelectedPools = {
	strings: Map<string, string>;
	calls: Map<string, string>;
	ctors: Map<string, string>;
};

// Safe global call targets to alias (avoid locals)
const SAFE_CALLS = new Set<CallKey>([
	"document.querySelector",
	"document.querySelectorAll",
	"document.createElement",
	"document.createTextNode",
	"document.createDocumentFragment",
	"Promise.resolve",
	"Promise.reject",
	"Promise.all",
]);

// Disable constructor pooling to avoid TDZ issues with ESM const/class hoisting
const ENABLE_CTOR_POOL = false;

// Compute estimated savings to decide if pooling helps
const computeStringSavings = (value: string, count: number, idLen: number) => {
	const orig = count * (value.length + 2);
	const decl = 6 + idLen + value.length + 2; // var <id>="<value>"
	const uses = count * idLen;
	return orig - (decl + uses);
};

const computeCallSavings = (key: string, count: number, idLen: number) => {
	const orig = count * key.length;
	const [obj] = key.split(".");
	const decl = 6 + idLen + 1 + key.length + 6 + obj.length + 2; // var id=obj.prop.bind(obj)
	const uses = count * idLen;
	return orig - (decl + uses);
};

const computeCtorSavings = (name: string, count: number, idLen: number) => {
	const orig = count * name.length;
	const decl = 5 + idLen + 1 + name.length; // var id=Name
	const uses = count * idLen;
	return orig - (decl + uses);
};

// Helpers to work with generic ESTree nodes
// biome-ignore lint/suspicious/noExplicitAny: lightweight ESTree helpers
const hasNodeType = (n: any): boolean => !!n && typeof n.type === "string";
// biome-ignore lint/suspicious/noExplicitAny: lightweight ESTree helpers
const getStart = (n: any): number => (n && (n as any).start) as number;
// biome-ignore lint/suspicious/noExplicitAny: lightweight ESTree helpers
const getEnd = (n: any): number => (n && (n as any).end) as number;

// biome-ignore lint/suspicious/noExplicitAny: lightweight ESTree handling without types
function isStringEligible(node: any, parent: any): boolean {
	// skip import/export sources
	if (
		(parent?.type === "ImportDeclaration" && parent.source === node) ||
		(parent?.type === "ExportNamedDeclaration" && parent.source === node) ||
		(parent?.type === "ExportAllDeclaration" && parent.source === node)
	)
		return false;
	// skip object property/method keys when not computed
	if (
		(parent?.type === "Property" || parent?.type === "MethodDefinition") &&
		!parent.computed &&
		parent.key === node
	)
		return false;
	// skip directives like "use strict"
	// biome-ignore lint/suspicious/noExplicitAny: ESTree
	if (parent?.type === "ExpressionStatement" && (parent as any).directive)
		return false;
	return true;
}

// biome-ignore lint/suspicious/noExplicitAny: lightweight ESTree handling without types
function callKeyOf(node: any): string | null {
	const callee = node?.callee;
	if (
		!callee ||
		callee.type !== "MemberExpression" ||
		callee.computed ||
		callee.optional
	)
		return null;
	const obj = callee.object;
	const prop = callee.property;
	if (obj?.type !== "Identifier" || prop?.type !== "Identifier") return null;
	const key = obj.name + "." + prop.name;
	return SAFE_CALLS.has(key) ? key : null;
}

function selectPools(
	strCounts: StringCount,
	callCounts: CallCount,
	ctorCounts: Map<string, number>
): SelectedPools {
	const strings = new Map<string, string>();
	const calls = new Map<string, string>();
	const ctors = new Map<string, string>();

	let sIdx = 0;
	for (const [val, cnt] of strCounts) {
		if (cnt < 3) continue;
		const id = "__S" + sIdx;
		const savings = computeStringSavings(val, cnt, id.length);
		if (savings > 0) {
			strings.set(val, id);
			sIdx++;
		}
	}

	let fIdx = 0;
	for (const [key, cnt] of callCounts) {
		if (cnt < 3) continue;
		const id = "__F" + fIdx;
		const savings = computeCallSavings(key, cnt, id.length);
		if (savings > 0) {
			calls.set(key, id);
			fIdx++;
		}
	}

	if (ENABLE_CTOR_POOL) {
		let cIdx = 0;
		for (const [name, cnt] of ctorCounts) {
			if (cnt < 3) continue;
			const id = "__C" + cIdx;
			const savings = computeCtorSavings(name, cnt, id.length);
			if (savings > 0) {
				ctors.set(name, id);
				cIdx++;
			}
		}
	}

	return { strings, calls, ctors };
}

function buildDecls({ strings, calls, ctors }: SelectedPools): string {
	const parts: string[] = [];
	for (const [val, id] of strings) parts.push(`${id}=${JSON.stringify(val)}`);
	for (const [key, id] of calls) {
		const [obj, prop] = key.split(".");
		parts.push(`${id}=${obj}.${prop}.bind(${obj})`);
	}
	if (ENABLE_CTOR_POOL) {
		for (const [name, id] of ctors) parts.push(`${id}=${name}`);
	}
	if (parts.length === 0) return "";
	return `var ${parts.join(",")};`;
}

export default function ultraMinifyPlugin() {
	return {
		name: "ultra-minify-ast",
		apply: "build",
		enforce: "post", // run after TS/esbuild transforms
		renderChunk(
			code: string,
			chunk: { fileName?: string; format?: string }
		) {
			const isEs =
				chunk?.format === "es" || /\.es\./.test(chunk?.fileName || "");
			if (!isEs) return null; // only process ES to avoid IIFE scoping issues

			// Parse the emitted chunk
			// biome-ignore lint/suspicious/noExplicitAny: ESTree program
			let ast: any;
			try {
				// @ts-ignore - rollup parse
				ast = this.parse(code);
			} catch {
				return null; // skip on parse errors to be safe
			}

			// First pass: count
			const strCounts: StringCount = new Map();
			const callCounts: CallCount = new Map();
			const ctorCounts: Map<string, number> = new Map();

			// Lightweight walk without external deps
			// biome-ignore lint/suspicious/noExplicitAny: ESTree program
			const stack: Array<{ node: any; parent: any }> = [
				{ node: ast, parent: null },
			];
			while (stack.length) {
				const top = stack.pop();
				if (!top) break;
				const { node, parent } = top;
				if (!node || typeof node.type !== "string") continue;

				// Count literals/calls/ctors
				if (node.type === "Literal" && typeof node.value === "string") {
					if (isStringEligible(node, parent)) {
						strCounts.set(
							node.value,
							(strCounts.get(node.value) || 0) + 1
						);
					}
				} else if (node.type === "CallExpression") {
					const key = callKeyOf(node);
					if (key)
						callCounts.set(key, (callCounts.get(key) || 0) + 1);
				} else if (ENABLE_CTOR_POOL && node.type === "NewExpression") {
					const cal = node.callee;
					if (cal && cal.type === "Identifier")
						ctorCounts.set(
							cal.name,
							(ctorCounts.get(cal.name) || 0) + 1
						);
				}

				// enqueue children (generic)
				for (const k in node) {
					// biome-ignore lint/suspicious/noExplicitAny: ESTree dynamic access
					const v = (node as any)[k];
					if (!v) continue;
					if (Array.isArray(v)) {
						for (let i = v.length - 1; i >= 0; i--) {
							const c = v[i];
							if (hasNodeType(c))
								stack.push({ node: c, parent: node });
						}
					} else if (hasNodeType(v)) {
						stack.push({ node: v, parent: node });
					}
				}
			}

			const selected = selectPools(strCounts, callCounts, ctorCounts);
			if (
				selected.strings.size === 0 &&
				selected.calls.size === 0 &&
				selected.ctors.size === 0
			)
				return null;

			const ms = new MagicString(code);

			// Second pass: replace uses
			// biome-ignore lint/suspicious/noExplicitAny: ESTree program
			const stack2: Array<{ node: any; parent: any }> = [
				{ node: ast, parent: null },
			];
			while (stack2.length) {
				const top2 = stack2.pop();
				if (!top2) break;
				const { node, parent } = top2;
				if (!node || typeof node.type !== "string") continue;

				if (node.type === "Literal" && typeof node.value === "string") {
					if (isStringEligible(node, parent)) {
						const id = selected.strings.get(node.value);
						if (id) ms.overwrite(getStart(node), getEnd(node), id);
					}
				} else if (node.type === "CallExpression") {
					const key = callKeyOf(node);
					if (key) {
						const id = selected.calls.get(key);
						// biome-ignore lint/suspicious/noExplicitAny: ESTree offsets
						const calleeNode: any = (node as any).callee;
						if (id && calleeNode)
							ms.overwrite(
								getStart(calleeNode),
								getEnd(calleeNode),
								id
							);
					}
				} else if (ENABLE_CTOR_POOL && node.type === "NewExpression") {
					// biome-ignore lint/suspicious/noExplicitAny: ESTree offsets
					const cal = (node as any).callee;
					if (cal?.type === "Identifier") {
						const id = selected.ctors.get(cal.name);
						if (id) ms.overwrite(getStart(cal), getEnd(cal), id);
					}
				}

				for (const k in node) {
					// biome-ignore lint/suspicious/noExplicitAny: ESTree dynamic access
					const v = (node as any)[k];
					if (!v) continue;
					if (Array.isArray(v)) {
						for (let i = v.length - 1; i >= 0; i--) {
							const c = v[i];
							if (hasNodeType(c))
								stack2.push({ node: c, parent: node });
						}
					} else if (hasNodeType(v)) {
						stack2.push({ node: v, parent: node });
					}
				}
			}

			// Insert declarations after imports
			let insertPos = 0;
			// biome-ignore lint/suspicious/noExplicitAny: ESTree program
			const body = (ast && (ast as any).body) || [];
			for (let i = 0; i < body.length; i++) {
				if (body[i].type === "ImportDeclaration")
					insertPos = body[i].end;
				else break;
			}
			const decls = buildDecls(selected);
			if (decls) ms.appendLeft(insertPos, decls);

			return { code: ms.toString(), map: null };
		},
	} as const;
}
