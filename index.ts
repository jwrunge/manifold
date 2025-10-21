import { effect } from "./src/Effect.ts";
import "./src/examples/counter-component.ts";
import type { CounterElementInstance } from "./src/examples/counter-component.ts";
import "./src/examples/summary-card-component.ts";
import type { SummaryCardElementInstance } from "./src/examples/summary-card-component.ts";
import $ from "./src/main.ts";

const myState = $.create()
	.add("count", 0)
	.add("popup", (e: unknown) => console.log(e))
	.add("nextFail", false)
	.add("currentUserPromise", null as Promise<unknown> | null)
	.add("someArray", [
		{ name: "Jake", age: 37 },
		{ name: "Mary", age: 37 },
		{ name: "Isaac", age: 6 },
		{ name: "Elinor", age: 4 },
	])
	.add("list", [
		{ id: 1, text: "Item 1" },
		{ id: 2, text: "Item 2" },
		{ id: 3, text: "Item 3" },
	])
	.add("addToList", () => {
		const nextId = myState.list.length
			? myState.list[myState.list.length - 1].id + 1
			: 1;
		myState.list.push({ id: nextId, text: `Item ${nextId}` });
	})
	.add("removeFromList", (key: number) => {
		myState.list.splice(key, 1);
	})
	// Provide placeholder so the property exists on the type
	.add("loadUser", () => Promise.resolve<unknown>(undefined))
	.build();

myState.loadUser = () => {
	const fail = !!myState.nextFail;
	myState.nextFail = !fail;

	const p: Promise<unknown> = new Promise((res, rej) =>
		setTimeout(() => {
			if (fail) console.log("REJECTING PROMISE");
			else console.log("RESOLVING PROMISE");

			if (fail) rej(new Error("Network"));
			else res({ name: "Ada", age: 37 + Math.floor(Math.random() * 10) });
		}, 800)
	);
	myState.currentUserPromise = p;
	return p;
};

// Initial load
myState.loadUser();

const mountCounterBridge = () => {
	const counter =
		document.querySelector<CounterElementInstance>("#global-counter");
	if (!counter) return;

	effect(() => {
		counter.updateProps({
			count: myState.count,
			highlight: myState.count % 5 === 0,
		});
	});
};

const mountSummaryBridge = () => {
	const summary = document.querySelector<SummaryCardElementInstance>(
		"#summary-card-showcase"
	);
	if (!summary) return;

	effect(() => {
		summary.updateProps({
			primaryValue: 1280 + myState.count * 3,
			secondaryValue: 42 + Math.floor(myState.count / 4),
			trend:
				myState.count % 2 === 0
					? "Up 12% from last week"
					: "Up 5% from last refresh",
			highlight: myState.count % 2 === 0,
			accentColor: myState.count % 2 === 0 ? "#16a34a" : "#2563eb",
		});
	});
};

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", mountCounterBridge, {
		once: true,
	});
	document.addEventListener("DOMContentLoaded", mountSummaryBridge, {
		once: true,
	});
} else {
	mountCounterBridge();
	mountSummaryBridge();
}

export type DemoState = typeof myState;
export default myState;
