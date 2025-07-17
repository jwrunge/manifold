import { State } from "./State";

export { State };
export { stateRegistry } from "./state-registry";
export { initializeManifold, registerContainer } from "./auto-discovery";
export { evaluateExpression } from "./expression-parser";

export const createState = <T>(value: T | (() => T)): State<T> =>
	new State(value);

export default {
	State,
	createState,
};
