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

// Basic ESTree-like node shape used locally
type EstreeNode = {
	type: string;
	start?: number;
	end?: number;
	[key: string]: unknown;
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
	"Object.defineProperty",
	"Object.keys",
	"Object.assign",
	// additional safe statics
	"Array.from",
	"Array.isArray",
	"Math.max",
	"Math.min",
]);

// Safe built-in constructors to alias (globals only)
const SAFE_CTORS = new Set<string>([
	"Map",
	"Set",
	"WeakMap",
	"WeakSet",
	"RegExp",
	"Date",
	"Promise",
	"Error",
	"TypeError",
	"Array",
	"Object",
]);

// Enable constructor pooling only for safe globals
const ENABLE_CTOR_POOL = true;

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
const getStart = (n: EstreeNode): number => (typeof n.start === "number" ? n.start : 0);
const getEnd = (n: EstreeNode): number => (typeof n.end === "number" ? n.end : 0);

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
		// conservative thresholds: avoid hurting gzip
		if (cnt < 3) continue;
		if (val.length < 5) continue;
		const id = "__S" + sIdx;
		const savings = computeStringSavings(val, cnt, id.length);
		if (savings > 4) {
			strings.set(val, id);
			sIdx++;
		}
	}

	let fIdx = 0;
	for (const [key, cnt] of callCounts) {
		if (cnt < 3) continue;
		const id = "__F" + fIdx;
		const savings = computeCallSavings(key, cnt, id.length);
		if (savings > 4) {
			calls.set(key, id);
			fIdx++;
		}
	}

	let cIdx = 0;
	for (const [name, cnt] of ctorCounts) {
		if (cnt < 3) continue;
		const id = "__C" + cIdx;
		const savings = computeCtorSavings(name, cnt, id.length);
		if (savings > 2) {
			ctors.set(name, id);
			cIdx++;
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
	for (const [name, id] of ctors) parts.push(`${id}=${name}`);
	if (parts.length === 0) return "";
	return `var ${parts.join(",")};`;
}

// Core processor used by both hooks
function processEsChunk(
	this: unknown,
	code: string,
	fileName?: string,
	format?: string
): string | null {
	const isEs = format === "es" || /\.es\./.test(fileName || "");
	if (!isEs) return null;

	// Parse the emitted chunk
	// biome-ignore lint/suspicious/noExplicitAny: ESTree program
	let ast: any;
	try {
		// @ts-ignore - rollup parse
		// biome-ignore lint/suspicious/noExplicitAny: plugin context parse is not strongly typed here
		ast = (this as { parse?: (src: string) => any }).parse?.(code);
	} catch {
		// even if parse fails, still try to strip PURE markers
		return code.replace(/\/\* *@__PURE__ *\*\//g, "").replace(/\n{3,}/g, "\n\n");
	}

	// First pass: count
	const strCounts: StringCount = new Map();
	const callCounts: CallCount = new Map();
	const ctorCounts: Map<string, number> = new Map();

	// Lightweight walk without external deps
	// biome-ignore lint/suspicious/noExplicitAny: ESTree program
	const stack: Array<{ node: any; parent: any }> = [{ node: ast, parent: null }];
	while (stack.length) {
		const top = stack.pop();
		if (!top) break;
		const { node, parent } = top as { node: EstreeNode; parent: EstreeNode | null };
		if (!node || typeof node.type !== "string") continue;

		// Count literals/calls/ctors
		if (node.type === "Literal" && typeof (node as Record<string, unknown>).value === "string") {
			if (isStringEligible(node, parent)) {
				const v = (node as Record<string, unknown>).value as string;
				strCounts.set(v, (strCounts.get(v) || 0) + 1);
			}
		} else if (node.type === "CallExpression") {
			const key = callKeyOf(node as unknown as EstreeNode);
			if (key) callCounts.set(key, (callCounts.get(key) || 0) + 1);
		} else if (ENABLE_CTOR_POOL && node.type === "NewExpression") {
			const cal = (node as Record<string, unknown>).callee as EstreeNode | undefined;
			if (cal && cal.type === "Identifier" && SAFE_CTORS.has((cal as Record<string, unknown>).name as string))
				ctorCounts.set(((cal as Record<string, unknown>).name as string), (ctorCounts.get(((cal as Record<string, unknown>).name as string)) || 0) + 1);
		}

		// enqueue children (generic)
		for (const k in node as Record<string, unknown>) {
			const v = (node as Record<string, unknown>)[k];
			if (!v) continue;
			if (Array.isArray(v)) {
				for (let i = v.length - 1; i >= 0; i--) {
					const c = v[i];
					if (hasNodeType(c)) stack.push({ node: c as EstreeNode, parent: node });
				}
			} else if (hasNodeType(v)) {
				stack.push({ node: v as EstreeNode, parent: node });
			}
		}
	}

	const selected = selectPools(strCounts, callCounts, ctorCounts);
	const ms = new MagicString(code);

	// Second pass: replace uses
	// biome-ignore lint/suspicious/noExplicitAny: ESTREE
	const stack2: Array<{ node: any; parent: any }> = [{ node: ast, parent: null }];
	while (stack2.length) {
		const top2 = stack2.pop();
		if (!top2) break;
		const { node, parent } = top2 as { node: EstreeNode; parent: EstreeNode | null };
		if (!node || typeof node.type !== "string") continue;

		if (node.type === "Literal" && typeof (node as Record<string, unknown>).value === "string") {
			if (isStringEligible(node, parent)) {
				const id = selected.strings.get((node as Record<string, unknown>).value as string);
				if (id) ms.overwrite(getStart(node), getEnd(node), id);
			}
		} else if (node.type === "CallExpression") {
			const key = callKeyOf(node as unknown as EstreeNode);
			if (key) {
				const id = selected.calls.get(key);
				const calleeNode = (node as Record<string, unknown>).callee as EstreeNode | undefined;
				if (id && calleeNode) ms.overwrite(getStart(calleeNode), getEnd(calleeNode), id);
			}
		} else if (ENABLE_CTOR_POOL && node.type === "NewExpression") {
			const cal = (node as Record<string, unknown>).callee as EstreeNode | undefined;
			if (cal?.type === "Identifier" && SAFE_CTORS.has((cal as Record<string, unknown>).name as string)) {
				const id = selected.ctors.get((cal as Record<string, unknown>).name as string);
				if (id) ms.overwrite(getStart(cal), getEnd(cal), id);
			}
		}

		for (const k in node as Record<string, unknown>) {
			const v = (node as Record<string, unknown>)[k];
			if (!v) continue;
			if (Array.isArray(v)) {
				for (let i = v.length - 1; i >= 0; i--) {
					const c = v[i];
					if (hasNodeType(c)) stack2.push({ node: c as EstreeNode, parent: node });
				}
			} else if (hasNodeType(v)) {
				stack2.push({ node: v as EstreeNode, parent: node });
			}
		}
	}

	// Insert declarations after imports
	let insertPos = 0;
	const body = ((ast && (ast as Record<string, unknown>).body) as unknown[]) || [];
	for (let i = 0; i < body.length; i++) {
		const b = body[i] as EstreeNode;
		if (b && b.type === "ImportDeclaration") insertPos = (b.end as number) || insertPos;
		else break;
	}
	const decls = buildDecls(selected);
	if (decls) ms.appendLeft(insertPos, decls);

	// Remove /* @__PURE__ */ markers and gently squeeze newlines
	let out = ms.toString().replace(/\/\* *@__PURE__ *\*\//g, "");
	out = out.replace(/\n{3,}/g, "\n\n");
	return out;
}

function isChunkLike(x: unknown): x is { type: "chunk"; code: string; fileName: string; facadeModuleId?: string } {
	if (!x || typeof x !== "object") return false;
	const r = x as Record<string, unknown>;
	return r.type === "chunk" && typeof r.code === "string" && typeof r.fileName === "string";
}

export default function ultraMinifyPlugin() {
	return {
		name: "ultra-minify-ast",
		apply: "build",
		enforce: "post",
		renderChunk(code: string, chunk: { fileName?: string; format?: string }) {
			const out = processEsChunk.call(this, code, chunk?.fileName, chunk?.format);
			return out ? { code: out, map: null } : null;
		},
		// Safety net: ensure final emitted files also get processed
		generateBundle(_, bundle) {
			for (const fileName of Object.keys(bundle)) {
				const item = (bundle as Record<string, unknown>)[fileName];
				if (isChunkLike(item)) {
					const fmt: string | undefined = item.facadeModuleId ? "es" : undefined;
					const out = processEsChunk.call(this, item.code, item.fileName, fmt);
					if (out) item.code = out;
				}
			}
		},
	} as const;
}
