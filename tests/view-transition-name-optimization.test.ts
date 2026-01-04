import { beforeEach, describe, expect, it } from "vitest";
import RegEl from "../src/dom/registry.ts";

describe("View transition name optimization", () => {
	beforeEach(() => {
		// Enable view transitions for testing
		(
			RegEl as typeof RegEl & { _viewTransitionsEnabled: boolean }
		)._viewTransitionsEnabled = true;
	});

	it("should only add view-transition-name when explicitly requested", () => {
		// Create a regular element without templating attributes
		const regularElement = document.createElement("div");
		new RegEl(regularElement, {});

		// Check that regular elements don't get view-transition-name
		expect(regularElement.style.viewTransitionName).toBe("");

		// Create template elements with various templating attributes but no transition-prefix
		const ifElement = document.createElement("div");
		ifElement.setAttribute(":if", "true");
		new RegEl(ifElement, {});

		const eachElement = document.createElement("div");
		eachElement.setAttribute(":each", "items");
		new RegEl(eachElement, {});

		const awaitElement = document.createElement("div");
		awaitElement.setAttribute(":await", "promise");
		new RegEl(awaitElement, {});

		// Check that template elements DON'T automatically get view-transition-name
		expect(ifElement.style.viewTransitionName).toBe("");
		expect(eachElement.style.viewTransitionName).toBe("");
		expect(awaitElement.style.viewTransitionName).toBe("");

		// Elements with transition attributes get match-element (set in effect, async in tests)
		const prefixElement = document.createElement("div");
		prefixElement.setAttribute(":if", "true");
		prefixElement.setAttribute(":transition", "'test'");
		new RegEl(prefixElement, {});

		// Verify the attribute was processed and removed
		expect(prefixElement.hasAttribute(":transition")).toBe(false);
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

	it("should handle transition attribute correctly", () => {
		// Test :transition expression
		const element1 = document.createElement("div");
		element1.setAttribute(":if", "condition");
		element1.setAttribute(":transition", "'sidebar'");

		new RegEl(element1, {});

		// Verify attribute was processed and removed
		expect(element1.hasAttribute(":transition")).toBe(false);

		// Test data-mf-transition expression
		const element2 = document.createElement("div");
		element2.setAttribute(":await", "promise");
		element2.setAttribute("data-mf-transition", "'modal'");

		new RegEl(element2, {});

		expect(element2.hasAttribute("data-mf-transition")).toBe(false);

		// Test transition with empty string expression - still gets match-element
		const element3 = document.createElement("div");
		element3.setAttribute(":if", "condition");
		element3.setAttribute(":transition", "''");

		new RegEl(element3, {});

		// Verify attribute processed
		expect(element3.hasAttribute(":transition")).toBe(false);

		// Test transition with whitespace string - still gets match-element
		const element4 = document.createElement("div");
		element4.setAttribute(":transition", "'  '");

		new RegEl(element4, {});

		// Verify attribute processed
		expect(element4.hasAttribute(":transition")).toBe(false);
	});
});
