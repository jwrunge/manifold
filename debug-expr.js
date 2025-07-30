import { evaluateExpression } from "./src/expression-parser.js";

console.log("Testing expression evaluation...");

const expr = "'Counter is ' + @counter";
console.log("Expression:", expr);

const result = evaluateExpression(expr);
console.log("Result:", result);

const context = { counter: 42 };
console.log("Context:", context);

const value = result.fn(context);
console.log("Evaluated value:", value);
