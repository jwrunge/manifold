import { State } from "./dist/manifold.js";

const myState = State.create()
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
	.add("someObj", { Jake: 37, Mary: 37, Isaac: 6, Elinor: 4 })
	.add(
		"someSet",
		new Set([
			{ name: "Jake", age: 37 },
			{ name: "Mary", age: 37 },
			{ name: "Isaac", age: 6 },
			{ name: "Elinor", age: 4 },
		]),
	)
	.add(
		"someMap",
		new Map<string, number>([
			["Jake", 37],
			["Mary", 37],
			["Isaac", 6],
			["Elinor", 4],
		]),
	)
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
		}, 800),
	);
	myState.currentUserPromise = p;
	return p;
};

// Initial load
myState.loadUser();

const intermediateState = State.create("new")
	.add("count2", 5)
	.add("doubleCount", () => state2.count2 * 2)
	.add("sum", () => myState.count + state2.count2);

const state2 = intermediateState.build();

export type DemoState = typeof myState;
export default myState;
