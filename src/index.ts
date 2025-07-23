import { State } from "./State";

export { State };
export { evaluateExpression } from "./expression-parser";

export const createState = <T>(value: T | (() => T)): State<T> =>
	new State(value);

export default {
	State,
	createState,
	watch: createState, // Alias for compatibility
};
