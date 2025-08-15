// Light build runtime expression evaluator
import type fullEval from "./expression-parser.ts";

function lightCompile(src: string): (ctx?: Record<string, unknown>) => unknown {
	if (!/^[\w\s.$,[\]()'+\-*/%?:<>=!&|`"'{}]+$/.test(src))
		return () => undefined;
	try {
		// biome-ignore lint/suspicious/noExplicitAny: dynamic Function creation
		const fn: any = new Function(
			"ctx",
			"with(ctx.__state||{}){with(ctx||{}){return (" + src + ")} }",
		);
		return (c?: Record<string, unknown>) => fn(c || {});
	} catch {
		return () => undefined;
	}
}

const evaluateExpression = (expr: string) =>
	({ fn: lightCompile(expr) }) as ReturnType<typeof fullEval>;
export default evaluateExpression;
