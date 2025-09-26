export type WritableCSSProperties = Omit<
	CSSStyleDeclaration,
	| typeof Symbol.iterator
	| "length"
	| "parentRule"
	| "item"
	| "getPropertyPriority"
	| "getPropertyValue"
	| "removeProperty"
	| "setProperty"
	| number
>;

export type WritableCSSKeys = keyof WritableCSSProperties;

/**
 * CSS custom property used to temporarily hold the view transition class name.
 * @public
 */
export const VT_CLASS = "view-transition-class";

/**
 * CSS property name used to store a generated view-transition-name for elements.
 * @public
 */
export const VT_NAME = "view-transition-name";
