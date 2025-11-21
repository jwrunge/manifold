import { beforeEach, describe, expect, test } from "vitest";
import StateBuilder from "../src/main.ts";
import RegEl from "../src/registry.ts";

// Microtask flush helper
const flush = () => new Promise((r) => setTimeout(r, 0));

let state: {
	mySet: Set<string>;
	myMap: Map<string, number>;
	myRecord: Record<string, number>;
	[key: string]: unknown;
};

const initState = (data: Record<string, unknown>) => {
	state = StateBuilder.create(
		undefined,
		data as Record<string, unknown>
	).build() as typeof state;
};

describe(":each with Sets, Maps, and Records", () => {
	beforeEach(() =>
		initState({
			mySet: new Set(["apple", "banana", "cherry"]),
			myMap: new Map([
				["Jake", 37],
				["Mary", 37],
				["Isaac", 6],
			]),
			myRecord: { Jake: 37, Mary: 37, Isaac: 6, Elinor: 4 },
		})
	);

	test(":each with Set renders values", async () => {
		document.body.innerHTML = `<ul><li :each="mySet as item">\${item}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");
		new RegEl(template as HTMLElement, state);
		await flush();

		const items = ul.querySelectorAll("li:not([style*='display: none'])");
		expect(items.length).toBe(3);
		expect(items[0].textContent).toBe("apple");
		expect(items[1].textContent).toBe("banana");
		expect(items[2].textContent).toBe("cherry");
	});

	test(":each with Map renders values and keys correctly", async () => {
		document.body.innerHTML = `<ul><li :each="myMap as age, name">\${name} is \${age}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");
		new RegEl(template as HTMLElement, state);
		await flush();

		const items = ul.querySelectorAll("li:not([style*='display: none'])");
		expect(items.length).toBe(3);
		expect(items[0].textContent).toBe("Jake is 37");
		expect(items[1].textContent).toBe("Mary is 37");
		expect(items[2].textContent).toBe("Isaac is 6");
	});

	test(":each with Record renders values and keys correctly", async () => {
		document.body.innerHTML = `<ul><li :each="myRecord as age, name">\${name} (\${age} years old)</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");
		new RegEl(template as HTMLElement, state);
		await flush();

		const items = ul.querySelectorAll("li:not([style*='display: none'])");
		expect(items.length).toBe(4);
		expect(items[0].textContent).toBe("Jake (37 years old)");
		expect(items[1].textContent).toBe("Mary (37 years old)");
		expect(items[2].textContent).toBe("Isaac (6 years old)");
		expect(items[3].textContent).toBe("Elinor (4 years old)");
	});

	test(":each with Map using single value alias", async () => {
		document.body.innerHTML = `<ul><li :each="myMap as entry">\${entry[1]} is \${entry[0]}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");
		new RegEl(template as HTMLElement, state);
		await flush();

		const items = ul.querySelectorAll("li:not([style*='display: none'])");
		expect(items.length).toBe(3);
		expect(items[0].textContent).toBe("Jake is 37");
	});

	test(":each with Record using array destructuring", async () => {
		document.body.innerHTML = `<ul><li :each="myRecord as [age, name]">\${name}: \${age}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");
		new RegEl(template as HTMLElement, state);
		await flush();

		const items = ul.querySelectorAll("li:not([style*='display: none'])");
		expect(items.length).toBe(4);
		expect(items[0].textContent).toBe("Jake: 37");
		expect(items[1].textContent).toBe("Mary: 37");
		expect(items[2].textContent).toBe("Isaac: 6");
		expect(items[3].textContent).toBe("Elinor: 4");
	});
});
