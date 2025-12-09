import { withTransitionStaging } from "../dom/transition.ts";
import { State } from "../main.ts";
import applyAliasPattern from "../parsing/alias-destructure.ts";
import { indexOfTopLevel, isIdent } from "../parsing/util.ts";
import { type Effect, effect } from "../reactivity/effect.ts";
import { scopeProxy } from "../reactivity/proxy.ts";
import type { Registerable } from "./types.ts";

// Type for the RegEl class (to avoid circular dependencies)
interface RegElLike {
	_el: Registerable;
	_state: Record<string, unknown>;
	_cachedContent?: Registerable;
	_eachStart?: Comment;
	_eachEnd?: Comment;
	_eachInstances?: Registerable[];
	_eachElementMap?: WeakMap<Registerable, { value: unknown; index: number }>;
	_eachPreviousArray?: unknown[];
	_vtClass?: string;
	_stateAsRecord(): Record<string, unknown>;
	_transition(callback: () => void): { finished: Promise<unknown> } | null;
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
	eachAlias?: string,
): Effect {
	const runWithChildTransitions = (nodes: Registerable[], run: () => void) => {
		if (nodes.length === 0) {
			regEl._transition(run);
			return;
		}
		withTransitionStaging(
			nodes as (HTMLElement | SVGElement | MathMLElement)[],
			run,
			(el) => RegElClass._registry.get(el)?._vtClass,
			(cb) => regEl._transition(cb),
		);
	};
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
	regEl._eachElementMap ??= new WeakMap();
	regEl._eachPreviousArray ??= [];

	const ef = effect(() => {
		const rawList =
			(_fn({
				state: regEl._state,
				element: regEl._eachStart ?? regEl._el,
				$: State,
			}) as
				| unknown[]
				| Set<unknown>
				| Map<unknown, unknown>
				| Record<string, unknown>
				| undefined) ?? [];

		// Convert Sets, Maps, and Records to arrays
		let list: unknown[];
		if (Array.isArray(rawList)) list = rawList;
		else if (rawList instanceof Set) list = [...rawList];
		else if (rawList instanceof Map)
			list = [...rawList].map(([k, v]) => [v, k]);
		else if (rawList?.constructor === Object)
			list = Object.entries(rawList).map(([k, v]) => [v, k]);
		else {
			throwError(
				`Invalid type in :each - expects Array, Set, Map, or Record`,
				regEl._el,
			);
			return;
		}

		const end = regEl._eachEnd;
		const parent = end?.parentNode;
		if (!end || !parent) return;

		const instances = regEl._eachInstances;
		const elementMap = regEl._eachElementMap;
		const previousArray = regEl._eachPreviousArray || [];
		const cur = instances?.length ?? 0;
		const next = list.length;

		const bindEachAliases = (
			inst: { _state: Record<string, unknown> } | undefined,
			val: unknown,
			idx: number,
		) => {
			if (!inst || !eachAlias) return;
			const alias = eachAlias;
			const comma = indexOfTopLevel(alias, ",");
			if (comma !== -1) {
				const left = alias.slice(0, comma).trim();
				const right = alias.slice(comma + 1).trim();

				// If val is a 2-element array (tuple from Map/Record), unpack it
				if (Array.isArray(val) && val.length === 2) {
					if (left) applyAliasPattern(left, val[0], inst._state);
					if (right && isIdent(right))
						(inst._state as Record<string, unknown>)[right] = val[1];
				} else {
					// Original behavior for arrays
					if (left) applyAliasPattern(left, val, inst._state);
					if (right && isIdent(right))
						(inst._state as Record<string, unknown>)[right] = idx;
				}
				return;
			}
			if (alias.startsWith("{")) {
				// Object destructuring e.g. {name, age}
				applyAliasPattern(alias, val, inst._state);
				return;
			}
			if (alias.startsWith("[")) {
				// Array destructuring - check if val is a 2-element tuple from Map/Record
				if (Array.isArray(val) && val.length === 2) {
					// For Map/Record tuples, destructure the tuple itself
					applyAliasPattern(alias, val, inst._state);
				} else {
					// Original behavior for regular arrays - bind [val, idx]
					applyAliasPattern(alias, [val, idx], inst._state);
				}
				return;
			}
			if (isIdent(alias)) {
				(inst._state as Record<string, unknown>)[alias] = val;
			}
		};

		// Detect removed items by comparing with previous array
		if (next < cur && previousArray.length > 0) {
			// Build a multiset of current values to preserve correct duplicates handling
			const counts = new Map<unknown, number>();
			for (const v of list) counts.set(v, (counts.get(v) || 0) + 1);
			const removedIndices = new Set<number>();
			for (let i = 0; i < previousArray.length; i++) {
				const v = previousArray[i];
				const c = counts.get(v) || 0;
				if (c > 0) counts.set(v, c - 1);
				else removedIndices.add(i);
			}

			const elementsToRemove: Registerable[] = [];

			// Find DOM elements corresponding to removed array values
			if (instances && elementMap) {
				for (let i = 0; i < instances.length; i++) {
					const element = instances[i];
					const mapping = elementMap.get(element);
					if (mapping && removedIndices.has(mapping.index)) {
						elementsToRemove.push(element);
					}
				}
			}

			// If we identified specific elements to remove, remove them
			if (elementsToRemove.length > 0) {
				runWithChildTransitions(elementsToRemove, () => {
					for (const element of elementsToRemove) {
						if (instances) {
							const index = instances.indexOf(element);
							if (index !== -1) {
								instances.splice(index, 1);
							}
						}
						if (elementMap) {
							elementMap.delete(element);
						}
						element.remove();
					}

					// After removal, update the remaining elements with correct indices and values
					const remainingElements = instances || [];
					for (
						let i = 0;
						i < Math.min(remainingElements.length, list.length);
						i++
					) {
						const element = remainingElements[i];
						const childReg = RegElClass._registry.get(element);
						if (childReg) {
							bindEachAliases(childReg, list[i], i);

							// Update tracking map with new index
							if (elementMap) {
								elementMap.set(element, {
									value: list[i],
									index: i,
								});
							}
						}
					}
				});
			} else {
				// Fallback to original behavior if we can't identify specific elements
				// Collect nodes to remove so we can mark them before the transition
				const nodesToRemove: Registerable[] = [];
				for (let i = cur - 1; i >= next; i--) {
					const node = instances?.[i];
					if (node) nodesToRemove.push(node);
				}
				runWithChildTransitions(nodesToRemove, () => {
					for (const node of nodesToRemove) {
						instances?.pop();
						if (elementMap) {
							elementMap.delete(node);
						}
						node.remove();
					}
				});
			}
		} else {
			// Handle the normal cases: adding elements or updating in place

			// Update aliases for existing instances that will remain
			const minLen = Math.min(cur, next);
			for (let i = 0; i < minLen; i++) {
				const node = instances?.[i];
				if (!node) continue;
				const childReg = RegElClass._registry.get(node);
				if (!childReg) continue;
				bindEachAliases(childReg, list[i], i);

				// Update our tracking map with the new value for this element
				if (elementMap) {
					elementMap.set(node, { value: list[i], index: i });
				}
			}

			if (next > cur) {
				// Adding new elements
				const frag = document.createDocumentFragment();
				for (let i = cur; i < next; i++) {
					const clone = regEl._cachedContent?.cloneNode(true) as Registerable;
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
						i,
					);
					RegElClass._registerOrGet(clone, childBase);
					instances?.push(clone);

					// Track this new element in our mapping
					if (elementMap) {
						elementMap.set(clone, { value: list[i], index: i });
					}

					frag.appendChild(clone);
				}
				// Use view transition for adding items
				const newClones: Registerable[] = instances?.slice(cur) ?? [];
				runWithChildTransitions(newClones, () => {
					parent.insertBefore(frag, end);
				});
			}
		}

		// Update the previous array for next comparison
		regEl._eachPreviousArray = [...list];
	});

	return ef;
}
