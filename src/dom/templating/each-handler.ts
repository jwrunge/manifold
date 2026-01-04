import { State } from "../../main.ts";
import applyAliasPattern from "../../parsing/alias-destructure.ts";
import { indexOfTopLevel, isIdent } from "../../parsing/util.ts";
import { type Effect, effect } from "../../reactivity/effect.ts";
import { scopeProxy } from "../../reactivity/proxy.ts";
import { VT_CLASS } from "../css.ts";
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
	_vtClassIn?: string;
	_vtClassOut?: string;
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
	const runWithChildTransitions = (
		nodes: Registerable[],
		run: () => void,
		appearing = false,
	) => {
		if (nodes.length === 0) {
			regEl._transition(run);
			return;
		}
		
		// Each cloned element has its own RegEl with transition classes from the cached template
		const classTargets: HTMLElement[] = [];
		
		for (const el of nodes) {
			const childReg = RegElClass._registry.get(el);
			const vtClass = appearing ? childReg?._vtClassIn : childReg?._vtClassOut;
			if (vtClass) {
				(el as HTMLElement).style.setProperty(VT_CLASS, vtClass);
				classTargets.push(el as HTMLElement);
			}
		}
		
		const cleanup = () => {
			for (const el of classTargets) {
				el.style.removeProperty(VT_CLASS);
			}
		};
		
		const transition = regEl._transition(run);
		if (transition?.finished) transition.finished.finally(cleanup);
		else cleanup();
	};

	// Cached template is already created in registry.ts before attributes are processed

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
			const isTuple = Array.isArray(val) && val.length === 2;
			const comma = indexOfTopLevel(eachAlias, ",");

			if (comma !== -1) {
				const [left, right] = [
					eachAlias.slice(0, comma).trim(),
					eachAlias.slice(comma + 1).trim(),
				];
				if (left) applyAliasPattern(left, isTuple ? val[0] : val, inst._state);
				if (right && isIdent(right))
					inst._state[right] = isTuple ? val[1] : idx;
			} else if (eachAlias.startsWith("{") || eachAlias.startsWith("[")) {
				applyAliasPattern(
					eachAlias,
					eachAlias.startsWith("[") && !isTuple ? [val, idx] : val,
					inst._state,
				);
			} else if (isIdent(eachAlias)) {
				inst._state[eachAlias] = val;
			}
		};

		// Helper to update element bindings and tracking
		const updateElement = (
			element: Registerable,
			value: unknown,
			index: number,
		) => {
			const childReg = RegElClass._registry.get(element);
			if (childReg) {
				bindEachAliases(childReg, value, index);
				elementMap?.set(element, { value, index });
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
				}, false);
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
				}, false);
			}
		} else {
			// Handle the normal cases: adding elements or updating in place

			// Update aliases for existing instances that will remain
			const minLen = Math.min(cur, next);
			for (let i = 0; i < minLen; i++) {
				if (instances?.[i]) updateElement(instances[i], list[i], i);
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
				}, true);
			}
		}

		// Update the previous array for next comparison
		regEl._eachPreviousArray = [...list];
	});

	return ef;
}
