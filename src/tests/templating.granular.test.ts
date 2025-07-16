import { expect, test } from "vitest";
import { State } from "../reactivity";
import { templEach } from "../templating";

test("templEach granular reactivity", () => {
	// Setup DOM
	document.body.innerHTML = `
		<mf-each id="test-list" data-as="item,index">
			<template>
				<div>Item: \${item}, Index: \${index}</div>
			</template>
		</mf-each>
	`;

	const items = new State([
		{ name: "Apple" },
		{ name: "Banana" },
		{ name: "Cherry" },
	]);

	// Initialize templEach
	templEach("#test-list", items);

	// Wait for DOM update
	setTimeout(() => {
		const elements = document.querySelectorAll("#test-list div");
		expect(elements.length).toBe(3);
		expect(elements[0]?.textContent).toContain("Apple");
		expect(elements[1]?.textContent).toContain("Banana");
		expect(elements[2]?.textContent).toContain("Cherry");

		// Test granular update
		console.log("\\n--- Testing granular update ---");
		items.value[1].name = "Blueberry";

		setTimeout(() => {
			const updatedElements = document.querySelectorAll("#test-list div");
			expect(updatedElements[1]?.textContent).toContain("Blueberry");
			console.log("Updated text:", updatedElements[1]?.textContent);
		}, 10);
	}, 10);
});
