import type { ParsedExpression } from "../expression-parser.ts";

export type Registerable = (HTMLElement | SVGElement | MathMLElement) & {
	mfshow?: unknown;
	mfawait?: unknown;
	mfeach?: number;
};

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

export const templLogicAttrSet = new Set(templLogicAttrs);
export const dependentLogicAttrSet = new Set([
	"elseif",
	"else",
	"then",
	"catch",
]);
export const prefixes = [":", "data-mf-"] as const;
