/// <reference lib="webworker" />

import evaluateExpression from "./expression-parser.ts";

type EvalRequest = {
	id: number | string;
	type: "eval";
	expression: string;
	scope?: Record<string, unknown>;
	context?: Parameters<typeof evaluateExpression>[1];
};

type WarmCacheRequest = {
	type: "warm-cache";
	requestId?: number | string;
	expressions: string[];
	context?: Parameters<typeof evaluateExpression>[1];
};

type WorkerRequest = EvalRequest | WarmCacheRequest;

type EvalSuccess = {
	type: "result";
	id: EvalRequest["id"];
	value: unknown;
};

type EvalFailure = {
	type: "error";
	id: EvalRequest["id"];
	error: { name?: string; message: string; stack?: string };
};

type WarmCacheAck = {
	type: "warm-cache";
	requestId?: WarmCacheRequest["requestId"];
	parsed: number;
};

type WorkerResponse = EvalSuccess | EvalFailure | WarmCacheAck;

const workerScope = self as DedicatedWorkerGlobalScope;

const toPlainError = (err: unknown): EvalFailure["error"] => {
	if (err instanceof Error) {
		return { name: err.name, message: err.message, stack: err.stack };
	}
	if (typeof err === "string") return { message: err };
	try {
		return { message: JSON.stringify(err) };
	} catch {
		return { message: String(err) };
	}
};

const post = (payload: WorkerResponse) => {
	workerScope.postMessage(payload);
};

const handleEval = (data: EvalRequest) => {
	const scope =
		data.scope && typeof data.scope === "object" ? data.scope : undefined;
	try {
		const parsed = evaluateExpression(data.expression, data.context);
		const value = parsed._fn(scope);
		post({ type: "result", id: data.id, value });
	} catch (error) {
		post({ type: "error", id: data.id, error: toPlainError(error) });
	}
};

const handleWarmCache = (data: WarmCacheRequest) => {
	let parsedCount = 0;
	for (const expr of data.expressions) {
		if (typeof expr !== "string" || !expr.trim()) continue;
		try {
			evaluateExpression(expr, data.context);
			parsedCount++;
		} catch (error) {
			post({
				type: "error",
				id: data.requestId ?? "warm-cache",
				error: toPlainError(error),
			});
			return;
		}
	}
	post({ type: "warm-cache", requestId: data.requestId, parsed: parsedCount });
};

workerScope.addEventListener(
	"message",
	(event: MessageEvent<WorkerRequest>) => {
		const data = event.data;
		if (!data || typeof data !== "object" || !("type" in data)) return;
		switch (data.type) {
			case "eval":
				handleEval(data);
				break;
			case "warm-cache":
				handleWarmCache(data);
				break;
			default:
				post({
					type: "error",
					id: "unknown",
					error: {
						message: `Unsupported worker message: ${String((data as { type: unknown }).type)}`,
					},
				});
		}
	},
);
