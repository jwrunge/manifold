import { beforeEach, describe, expect, it } from "vitest";
import RegEl from "../src/registry";

describe("View transition name optimization", () => {
	beforeEach(() => {
		// Enable view transitions for testing
		(
			RegEl as typeof RegEl & { _viewTransitionsEnabled: boolean }
		)._viewTransitionsEnabled = true;
	});

	it("should add view-transition-name to template elements only", () => {
		// Create a regular element without templating attributes
		const regularElement = document.createElement("div");
		new RegEl(regularElement, {});

		// Check that regular elements don't get view-transition-name
		expect(regularElement.style.viewTransitionName).toBe("");

		// Create template elements with various templating attributes
		const ifElement = document.createElement("div");
		ifElement.setAttribute(":if", "true");
		new RegEl(ifElement, {});

		const eachElement = document.createElement("div");
		eachElement.setAttribute(":each", "items");
		new RegEl(eachElement, {});

		const awaitElement = document.createElement("div");
		awaitElement.setAttribute(":await", "promise");
		new RegEl(awaitElement, {});

		const elseifElement = document.createElement("div");
		elseifElement.setAttribute(":elseif", "condition");
		new RegEl(elseifElement, {});

		const elseElement = document.createElement("div");
		elseElement.setAttribute(":else", "");
		new RegEl(elseElement, {});

		const thenElement = document.createElement("div");
		thenElement.setAttribute(":then", "");
		new RegEl(thenElement, {});

		const catchElement = document.createElement("div");
		catchElement.setAttribute(":catch", "");
		new RegEl(catchElement, {});

		// Check that template elements DO get view-transition-name
		expect(ifElement.style.viewTransitionName).toBeTruthy();
		expect(eachElement.style.viewTransitionName).toBeTruthy();
		expect(awaitElement.style.viewTransitionName).toBeTruthy();
		expect(elseifElement.style.viewTransitionName).toBeTruthy();
		expect(elseElement.style.viewTransitionName).toBeTruthy();
		expect(thenElement.style.viewTransitionName).toBeTruthy();
		expect(catchElement.style.viewTransitionName).toBeTruthy();

		// Verify they're all unique
		const names = [
			ifElement.style.viewTransitionName,
			eachElement.style.viewTransitionName,
			awaitElement.style.viewTransitionName,
			elseifElement.style.viewTransitionName,
			elseElement.style.viewTransitionName,
			thenElement.style.viewTransitionName,
			catchElement.style.viewTransitionName,
		];
		const uniqueNames = new Set(names);
		expect(uniqueNames.size).toBe(names.length);
	});

	it("should not override existing view-transition-name", () => {
		// Create element with existing view-transition-name
		const element = document.createElement("div");
		element.style.viewTransitionName = "custom-name";
		element.setAttribute(":if", "true");

		new RegEl(element, {});

		// Should preserve the existing name
		expect(element.style.viewTransitionName).toBe("custom-name");
	});

	it("should handle elements with multiple templating attributes", () => {
		// Create element with multiple templating attributes
		const element = document.createElement("div");
		element.setAttribute(":if", "condition");
		element.setAttribute(":await", "promise");

		new RegEl(element, {});

		// Should still get view-transition-name
		expect(element.style.viewTransitionName).toBeTruthy();
	});
});
