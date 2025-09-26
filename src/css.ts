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

export const VT_CLASS = "view-transition-class";
export const VT_NAME = "view-transition-name";
