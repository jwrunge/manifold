import { describe, it, expect, beforeEach } from "vitest";
import { RegEl } from "../registry";
import { State, computed } from "../State";

// Mock DOM
const createMockElement = (tag: string = "div"): HTMLElement => {
	const element = document.createElement(tag);
	return element;
};

// Mock fetch responses
const createMockResponse = (data: any, ok: boolean = true): Response => {
	return {
		ok,
		json: () => Promise.resolve(data),
		text: () =>
			Promise.resolve(
				typeof data === "string" ? data : JSON.stringify(data)
			),
	} as Response;
};

describe("Async Features", () => {
	beforeEach(() => {
		// Clear any existing states
		document.body.innerHTML = "";
	});

	describe("data-await", () => {
		it("should show loading content during promise resolution", async () => {
			const loadingDiv = createMockElement();
			loadingDiv.dataset.await = "@testPromise";
			loadingDiv.textContent = "Loading...";
			document.body.appendChild(loadingDiv);

			// Create a test promise that resolves after a delay
			const testPromise = new State(
				new Promise((resolve) =>
					setTimeout(() => resolve("test data"), 100)
				)
			);
			State.register("testPromise", testPromise);

			RegEl.register(loadingDiv);

			// Initially, loading content should be visible
			expect(loadingDiv.style.display).toBe("");

			// Wait for promise to resolve
			await new Promise((resolve) => setTimeout(resolve, 150));

			// After resolution, loading content should be hidden
			expect(loadingDiv.style.display).toBe("none");
		});
	});

	describe("data-process", () => {
		it("should handle event-specific processing", async () => {
			const button = createMockElement("button");
			button.dataset.bind = "onclick: @handleClick";
			button.dataset.process = "onclick: response => response.text()";
			button.dataset.then = "htmlContent";
			document.body.appendChild(button);

			const handleClick = computed(() =>
				Promise.resolve(createMockResponse("<p>HTML content</p>"))
			);
			State.register("handleClick", handleClick);

			RegEl.register(button);

			// Simulate click
			button.click();

			// Wait for processing
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Check that HTML content was processed
			const regEl = RegEl.getRegEl(button);
			expect(regEl?.props.htmlContent).toBeDefined();
			expect(regEl?.props.htmlContent.value).toBe("<p>HTML content</p>");
		});
	});
});
