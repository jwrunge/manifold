import type { ParsedExpression } from "../expression-parser.ts";

export type Registerable = (HTMLElement | SVGElement | MathMLElement) & {
	mfshow?: unknown;
	mfawait?: unknown;
	mfeach?: number;
};

/** Logic attributes that create template roots (e.g. :each, :if) */
export const templLogicAttrs = ["if", "each", "await"] as const;
export type templLogicAttr =
	| (typeof templLogicAttrs)[number]
	| "elseif"
	| "else"
	| "then"
	| "catch";

export type Sibling = {
	el: Registerable;
	fn: ParsedExpression["_fn"] | null;
	attrName: templLogicAttr;
	alias?: string;
};

/** Set form of templ logic attributes for quick membership checks */
export const templLogicAttrSet = new Set(templLogicAttrs);
/** Attributes that depend on a preceding template root (e.g. :else, :then) */
export const dependentLogicAttrSet = new Set([
	"elseif",
	"else",
	"then",
	"catch",
]);
/** Allowed attribute prefixes (colon short form and data-mf- long form) */
export const prefixes = [":", "data-mf-"] as const;
