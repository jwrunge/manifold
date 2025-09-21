import applyAliasPattern from "../alias-destructure";
import { type Effect, effect } from "../Effect";
import { indexOfTopLevel, isIdent } from "../parsing-utils";
import { scopeProxy } from "../proxy";
import type { Registerable } from "./types";

// Type for the RegEl class (to avoid circular dependencies)
interface RegElLike {
	_el: Registerable;
	_state: Record<string, unknown>;
	_cachedContent?: Registerable;
	_eachStart?: Comment;
	_eachEnd?: Comment;
	_eachInstances?: Registerable[];
	_stateAsRecord(): Record<string, unknown>;
	_transition(callback: () => void): void;
	_handleTextNode(node: Node): void;
}

interface RegElStatic {
	_registry: WeakMap<Node, RegElLike>;
	_registerOrGet(el: Node, state: Record<string, unknown>): RegElLike;
}

/**
 * Handles :each loop templating logic
 */
export function handleEach(
	regEl: RegElLike,
	RegElClass: RegElStatic,
	attrTagName: string,
	_fn: (ctx?: Record<string, unknown> | undefined) => unknown,
	throwError: (msg: string, cause?: unknown) => void,
	eachAlias?: string
): Effect {
	// Cache a pristine template clone for repeated use (without the :each attribute)
	if (!regEl._cachedContent) {
		const tmpl = regEl._el.cloneNode(true) as Registerable;
		// Remove the templating attribute so clones don't re-trigger :each handling
		tmpl.removeAttribute(attrTagName);
		regEl._cachedContent = tmpl;
	}

	// Establish stable start/end anchors and remove the original template element
	if (!regEl._eachStart || !regEl._eachEnd) {
		const start = document.createComment(":each-start");
		const end = document.createComment(":each-end");
		const parent = regEl._el.parentNode;
		if (parent) {
			parent.insertBefore(start, regEl._el);
			parent.insertBefore(end, regEl._el.nextSibling);
			// Keep the template element in the DOM but hidden to avoid disposal
			(regEl._el as HTMLElement).style.display = "none";
		}
		regEl._eachStart = start;
		regEl._eachEnd = end;
	}

	regEl._eachInstances ??= [];

	const ef = effect(() => {
		const list =
			(_fn({
				state: regEl._state,
				element: regEl._eachStart ?? regEl._el,
			}) as unknown[] | undefined) ?? [];

		if (!Array.isArray(list)) {
			throwError(`Non-array in :each`, regEl._el);
		}

		const end = regEl._eachEnd;
		const parent = end?.parentNode;
		if (!end || !parent) return;

		const instances = regEl._eachInstances;
		const cur = instances?.length ?? 0;
		const next = list.length;

		const bindEachAliases = (
			inst: { _state: Record<string, unknown> } | undefined,
			val: unknown,
			idx: number
		) => {
			if (!inst || !eachAlias) return;
			const alias = eachAlias.trim();
			if (!alias) return;
			const comma = indexOfTopLevel(alias, ",");
			if (comma !== -1) {
				const left = alias.slice(0, comma).trim();
				const right = alias.slice(comma + 1).trim();
				if (left) applyAliasPattern(left, val, inst._state);
				if (right && isIdent(right))
					(inst._state as Record<string, unknown>)[right] = idx;
				return;
			}
			if (alias.startsWith("[")) {
				applyAliasPattern(alias, [val, idx], inst._state);
				return;
			}
			if (alias.startsWith("{") || alias.startsWith("[")) {
				applyAliasPattern(alias, val, inst._state);
				return;
			}
			applyAliasPattern(alias, val, inst._state);
		};

		// Update aliases for existing instances (ensures index/value kept in sync)
		const minLen = Math.min(cur, next);
		for (let i = 0; i < minLen; i++) {
			const node = instances?.[i];
			if (!node) continue;
			const childReg = RegElClass._registry.get(node);
			if (!childReg) continue;
			bindEachAliases(childReg, list[i], i);
		}

		if (next > cur) {
			const frag = document.createDocumentFragment();
			for (let i = cur; i < next; i++) {
				const clone = regEl._cachedContent?.cloneNode(
					true
				) as Registerable;
				// Create a per-item overlay state and pre-apply aliases so initial text effects see values
				const childBase = scopeProxy(regEl._stateAsRecord()) as Record<
					string,
					unknown
				>;
				bindEachAliases(
					{ _state: childBase } as unknown as {
						_state: Record<string, unknown>;
					},
					list[i],
					i
				);
				RegElClass._registerOrGet(clone, childBase);
				instances?.push(clone);
				frag.appendChild(clone);
				// Safety: ensure text nodes on the clone are handled if registration did not due to early :each intercept
				try {
					const childReg = RegElClass._registry.get(clone);
					if (childReg) {
						for (const n of clone.childNodes)
							childReg._handleTextNode(n);
					}
				} catch {}
			}
			// Use view transition for adding items
			regEl._transition(() => {
				parent.insertBefore(frag, end);
			});
		} else if (next < cur) {
			// Use view transition for removing items
			regEl._transition(() => {
				for (let i = cur - 1; i >= next; i--) {
					const node = instances?.[i];
					instances?.pop();
					node?.remove(); // disposal handled by mutation observer
				}
			});
		}
	});

	return ef;
}
