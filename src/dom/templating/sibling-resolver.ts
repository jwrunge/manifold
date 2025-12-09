import evaluateExpression from "../../parsing/expression-parser.ts";
import { splitAs } from "../../parsing/util.ts";
import {
	prefixes,
	type Registerable,
	type Sibling,
	type templLogicAttr,
} from "./types.ts";

// Reuse shared splitAs from parsing-utils to reduce duplication

/**
 * Discovers and processes dependent siblings for conditional and async templating
 */
export function findDependentSiblings(
	element: Registerable,
	attrName: templLogicAttr,
	attrTagName: string,
): Sibling[] {
	const siblings: Sibling[] = [
		{
			el: element,
			attrName,
			fn: null, // Will be set by caller
		},
	];

	element.removeAttribute(attrTagName);

	// Get dependent siblings
	let sib = element.nextElementSibling;
	const deps = attrName === "await" ? ["then", "catch"] : ["elseif", "else"];

	while (sib) {
		// Find dependent attribute
		let prefixed = "";
		let unprefixed = "";
		for (const p of prefixes) {
			for (const dep of deps) {
				const attr = `${p}${dep}`;
				if (sib.hasAttribute(attr)) {
					prefixed = attr;
					unprefixed = dep;
					break;
				}
			}
			if (prefixed) break;
		}

		if (!prefixed) break;

		let fn: ReturnType<typeof evaluateExpression>["_fn"] | null = null;
		let alias: string | undefined;

		if (unprefixed !== "else") {
			const [left, right] = splitAs(sib.getAttribute(prefixed) || "");
			// For :then/:catch, treat entire value as alias if no 'as' part provided
			if (
				attrName === "await" &&
				(unprefixed === "then" || unprefixed === "catch")
			) {
				alias = right || left || undefined;
			} else {
				fn = evaluateExpression(left)._fn;
				alias = right || undefined;
			}
		}

		siblings.push({
			el: sib as Registerable,
			attrName: unprefixed as templLogicAttr,
			fn,
			alias,
		});

		sib.removeAttribute(prefixed);
		sib = sib.nextElementSibling;
	}

	return siblings;
}
