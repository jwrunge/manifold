import evaluateExpression from "../expression-parser";
import { splitAs } from "../parsing-utils";
import {
	prefixes,
	type Registerable,
	type Sibling,
	type templLogicAttr,
} from "./types";

// Reuse shared splitAs from parsing-utils to reduce duplication

/**
 * Discovers and processes dependent siblings for conditional and async templating
 */
export function findDependentSiblings(
	element: Registerable,
	attrName: templLogicAttr,
	attrTagName: string
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

	while (sib) {
		// Inline getDependentAttr
		let prefixed: string | null = null;
		let unprefixed: string | null = null;
		for (const p of prefixes) {
			for (const dep of attrName === "await"
				? ["then", "catch"]
				: ["elseif", "else"]) {
				const attr = `${p}${dep}`;
				if (sib.hasAttribute(attr)) {
					prefixed = attr;
					unprefixed = dep;
					break;
				}
			}
			if (prefixed) break;
		}

		if (!unprefixed || !prefixed) break;

		let fn: ReturnType<typeof evaluateExpression>["_fn"] | null = null;
		let alias: string | undefined;

		if (unprefixed !== "else") {
			const raw = sib.getAttribute(prefixed) || "";
			const [left, right] = splitAs(raw);
			// For :then/:catch, treat entire value as alias if no 'as' part provided
			if (
				attrName === "await" &&
				(unprefixed === "then" || unprefixed === "catch")
			) {
				alias = right || left || undefined;
				fn = null;
			} else {
				fn = evaluateExpression(left)._fn;
				alias = right || undefined;
			}
		}

		// Do not set view-transition-class here; it should be applied
		// immediately before a transition and cleared after.

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
