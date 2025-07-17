/**
 * Minimal, secure expression parser for Manifold
 * Supports: property access, comparisons, arithmetic, logical operators
 * Security: No eval, no function calls, whitelist-only approach
 */

type Token = {
	type:
		| "identifier"
		| "number"
		| "string"
		| "operator"
		| "punctuation"
		| "eof";
	value: string | number;
	pos: number;
};

type ASTNode = {
	type: "literal" | "identifier" | "member" | "binary" | "unary";
	value?: string | number | boolean;
	property?: string;
	object?: ASTNode;
	left?: ASTNode;
	right?: ASTNode;
	operator?: string;
	operand?: ASTNode;
};

const OPERATORS = new Set([
	"===",
	"!==",
	"==",
	"!=",
	">=",
	"<=",
	">",
	"<",
	"&&",
	"||",
	"!",
	"+",
	"-",
	"*",
	"/",
	"%",
]);

const OPERATOR_PRECEDENCE: Record<string, number> = {
	"||": 1,
	"&&": 2,
	"===": 3,
	"!==": 3,
	"==": 3,
	"!=": 3,
	">=": 4,
	"<=": 4,
	">": 4,
	"<": 4,
	"+": 5,
	"-": 5,
	"*": 6,
	"/": 6,
	"%": 6,
	"!": 7,
	"unary-": 7,
	"unary+": 7,
};

class ExpressionParser {
	private tokens: Token[] = [];
	private current = 0;

	parse(expression: string): ASTNode {
		this.tokens = this.tokenize(expression);
		this.current = 0;
		const ast = this.parseExpression();

		if (!this.isAtEnd()) {
			throw new Error(`Unexpected token at position ${this.peek().pos}`);
		}

		return ast;
	}

	private tokenize(expression: string): Token[] {
		const tokens: Token[] = [];
		let pos = 0;

		while (pos < expression.length) {
			const char = expression[pos]!;

			// Skip whitespace
			if (/\s/.test(char)) {
				pos++;
				continue;
			}

			// Numbers
			if (/\d/.test(char)) {
				const start = pos;
				while (
					pos < expression.length &&
					/[\d.]/.test(expression[pos]!)
				) {
					pos++;
				}
				const value = expression.slice(start, pos);
				tokens.push({
					type: "number",
					value: parseFloat(value),
					pos: start,
				});
				continue;
			}

			// Strings
			if (char === '"' || char === "'") {
				const quote = char;
				const start = pos;
				pos++; // Skip opening quote
				let value = "";

				while (pos < expression.length && expression[pos] !== quote) {
					if (expression[pos] === "\\") {
						pos++; // Skip escape character
						if (pos < expression.length) {
							value += expression[pos];
						}
					} else {
						value += expression[pos];
					}
					pos++;
				}

				if (pos >= expression.length) {
					throw new Error(`Unterminated string at position ${start}`);
				}

				pos++; // Skip closing quote
				tokens.push({ type: "string", value, pos: start });
				continue;
			}

			// Multi-character operators
			if (pos < expression.length - 1) {
				const twoChar = expression.slice(pos, pos + 2);
				const threeChar = expression.slice(pos, pos + 3);

				if (OPERATORS.has(threeChar)) {
					tokens.push({ type: "operator", value: threeChar, pos });
					pos += 3;
					continue;
				}

				if (OPERATORS.has(twoChar)) {
					tokens.push({ type: "operator", value: twoChar, pos });
					pos += 2;
					continue;
				}
			}

			// Single-character operators
			if (OPERATORS.has(char)) {
				tokens.push({ type: "operator", value: char, pos });
				pos++;
				continue;
			}

			// Punctuation
			if (char === "(" || char === ")" || char === ".") {
				tokens.push({ type: "punctuation", value: char, pos });
				pos++;
				continue;
			}

			// Identifiers
			if (/[a-zA-Z_$]/.test(char)) {
				const start = pos;
				while (
					pos < expression.length &&
					/[a-zA-Z0-9_$]/.test(expression[pos]!)
				) {
					pos++;
				}
				const value = expression.slice(start, pos);
				tokens.push({ type: "identifier", value, pos: start });
				continue;
			}

			throw new Error(
				`Unexpected character '${char}' at position ${pos}`
			);
		}

		tokens.push({ type: "eof", value: "", pos });
		return tokens;
	}

	private parseExpression(minPrec = 0): ASTNode {
		let left = this.parseUnary();

		while (!this.isAtEnd() && this.peek().type === "operator") {
			const op = this.peek().value as string;
			const prec = OPERATOR_PRECEDENCE[op];

			if (!prec || prec < minPrec) break;

			this.advance(); // consume operator
			const right = this.parseExpression(prec + 1);

			left = {
				type: "binary",
				operator: op,
				left,
				right,
			};
		}

		return left;
	}

	private parseUnary(): ASTNode {
		if (this.peek().type === "operator") {
			const op = this.peek().value as string;
			if (op === "!" || op === "-" || op === "+") {
				this.advance();
				const operand = this.parseUnary();
				return {
					type: "unary",
					operator:
						op === "-" ? "unary-" : op === "+" ? "unary+" : op,
					operand,
				};
			}
		}

		return this.parsePrimary();
	}

	private parsePrimary(): ASTNode {
		const token = this.peek();

		if (token.type === "number" || token.type === "string") {
			this.advance();
			return { type: "literal", value: token.value };
		}

		if (token.type === "identifier") {
			this.advance();
			let node: ASTNode = {
				type: "identifier",
				value: token.value as string,
			};

			// Handle property access
			while (
				this.peek().type === "punctuation" &&
				this.peek().value === "."
			) {
				this.advance(); // consume '.'
				if (this.peek().type !== "identifier") {
					throw new Error(
						`Expected property name after '.' at position ${
							this.peek().pos
						}`
					);
				}
				const property = this.advance().value as string;
				node = {
					type: "member",
					object: node,
					property,
				};
			}

			return node;
		}

		if (token.type === "punctuation" && token.value === "(") {
			this.advance(); // consume '('
			const expr = this.parseExpression();
			if (
				this.peek().type !== "punctuation" ||
				this.peek().value !== ")"
			) {
				throw new Error(`Expected ')' at position ${this.peek().pos}`);
			}
			this.advance(); // consume ')'
			return expr;
		}

		throw new Error(
			`Unexpected token '${token.value}' at position ${token.pos}`
		);
	}

	private peek(): Token {
		return (
			this.tokens[this.current] || {
				type: "eof",
				value: "",
				pos: this.tokens.length,
			}
		);
	}

	private advance(): Token {
		if (!this.isAtEnd()) this.current++;
		return (
			this.tokens[this.current - 1] || {
				type: "eof",
				value: "",
				pos: this.tokens.length,
			}
		);
	}

	private isAtEnd(): boolean {
		return this.peek().type === "eof";
	}
}

// Expression evaluator
export function evaluateExpression(
	expression: string,
	context: Record<string, any>
): any {
	const parser = new ExpressionParser();
	const ast = parser.parse(expression);
	return evaluateNode(ast, context);
}

function evaluateNode(node: ASTNode, context: Record<string, any>): any {
	switch (node.type) {
		case "literal":
			return node.value;

		case "identifier":
			const name = node.value as string;
			if (!(name in context)) {
				throw new Error(`Undefined variable: ${name}`);
			}
			return context[name];

		case "member":
			const obj = evaluateNode(node.object!, context);
			if (obj == null) {
				throw new Error(
					`Cannot access property '${node.property}' of ${obj}`
				);
			}
			return obj[node.property!];

		case "binary":
			const left = evaluateNode(node.left!, context);
			const right = evaluateNode(node.right!, context);

			switch (node.operator) {
				case "===":
					return left === right;
				case "!==":
					return left !== right;
				case "==":
					return left == right;
				case "!=":
					return left != right;
				case ">":
					return left > right;
				case "<":
					return left < right;
				case ">=":
					return left >= right;
				case "<=":
					return left <= right;
				case "&&":
					return left && right;
				case "||":
					return left || right;
				case "+":
					return left + right;
				case "-":
					return left - right;
				case "*":
					return left * right;
				case "/":
					return left / right;
				case "%":
					return left % right;
				default:
					throw new Error(
						`Unknown binary operator: ${node.operator}`
					);
			}

		case "unary":
			const operand = evaluateNode(node.operand!, context);
			switch (node.operator) {
				case "!":
					return !operand;
				case "unary-":
					return -operand;
				case "unary+":
					return +operand;
				default:
					throw new Error(`Unknown unary operator: ${node.operator}`);
			}

		default:
			throw new Error(`Unknown node type: ${(node as any).type}`);
	}
}

// Extract variable names from an expression (for auto-registration)
export function extractVariableNames(expression: string): string[] {
	const parser = new ExpressionParser();
	try {
		const ast = parser.parse(expression);
		const variables = new Set<string>();
		collectVariables(ast, variables);
		return Array.from(variables);
	} catch {
		return []; // Return empty array if parsing fails
	}
}

function collectVariables(node: ASTNode, variables: Set<string>): void {
	switch (node.type) {
		case "identifier":
			variables.add(node.value as string);
			break;

		case "member":
			// Only collect the root identifier, not properties
			collectVariables(node.object!, variables);
			break;

		case "binary":
			collectVariables(node.left!, variables);
			collectVariables(node.right!, variables);
			break;

		case "unary":
			collectVariables(node.operand!, variables);
			break;
	}
}
