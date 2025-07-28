import { State } from "./State";

export { State };
export { evaluateExpression, extractVariableNames } from "./expression-parser";
export { createEffect } from "./State";

export const createState = <T>(value: T | (() => T)): State<T> =>
	new State(value);

export default {
	State,
	createState,
	evaluateExpression: (expr: string, context: Record<string, any>) =>
		import("./expression-parser").then((m) =>
			m.evaluateExpression(expr, context)
		),
};
