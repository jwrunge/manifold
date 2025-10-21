import { afterEach, describe, expect, test } from "vitest";
import { _makeComponent } from "../src/component.ts";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
	document.body.innerHTML = "";
});

describe("component props integration", () => {
	test("number prop reflects state changes", async () => {
		const template = document.createElement("template");
		const section = document.createElement("section");
		const value = document.createElement("p");
		value.id = "value";
		value.textContent = `Count: \${count}`;
		section.append(value);
		template.content.append(section);

		const name = `mf-counter-${Math.random().toString(36).slice(2)}`;
		_makeComponent<{ count: number }>(name, template, {
			shadow: false,
			props: {
				count: { type: "number", default: 0, reflect: true },
			},
		});

		const el = document.createElement(name) as HTMLElement & {
			count: number;
			updateProps(values: Partial<{ count: number }>): void;
		};
		document.body.appendChild(el);
		await flush();

		const valueEl = el.querySelector("#value") as HTMLElement;
		expect(valueEl.textContent?.trim()).toBe("Count: 0");

		el.setAttribute("count", "5");
		await flush();
		expect(valueEl.textContent?.trim()).toBe("Count: 5");
		expect(el.count).toBe(5);

		el.count = 7;
		await flush();
		expect(el.getAttribute("count")).toBe("7");
		expect(valueEl.textContent?.trim()).toBe("Count: 7");

		el.updateProps({ count: el.count + 1 });
		await flush();
		expect(el.count).toBe(8);
		expect(el.getAttribute("count")).toBe("8");
		expect(valueEl.textContent?.trim()).toBe("Count: 8");
	});

	test("boolean prop toggles class and reflects", async () => {
		const template = document.createElement("template");
		const wrapper = document.createElement("div");
		const statusSpan = document.createElement("span");
		statusSpan.id = "status";
		statusSpan.setAttribute("data-mf-class", "isActive ? 'on' : ''");
		statusSpan.textContent = "Status";
		wrapper.append(statusSpan);
		template.content.append(wrapper);

		const name = `mf-active-${Math.random().toString(36).slice(2)}`;
		_makeComponent<{ isActive: boolean }>(name, template, {
			shadow: false,
			props: {
				isActive: { type: "boolean", default: false, reflect: true },
			},
		});

		const el = document.createElement(name) as HTMLElement & {
			isActive: boolean;
		};
		document.body.appendChild(el);
		await flush();

		const statusEl = el.querySelector("#status");
		if (!statusEl) throw new Error("status span missing");
		expect(statusEl.classList.contains("on")).toBe(false);

		el.setAttribute("is-active", "");
		await flush();
		expect(statusEl.classList.contains("on")).toBe(true);
		expect(el.isActive).toBe(true);

		el.isActive = false;
		await flush();
		expect(statusEl.classList.contains("on")).toBe(false);
		expect(el.hasAttribute("is-active")).toBe(false);
	});

	test("required prop without default throws", () => {
		const template = document.createElement("template");
		const container = document.createElement("div");
		const labelSpan = document.createElement("span");
		labelSpan.textContent = `\${label}`;
		container.append(labelSpan);
		template.content.append(container);

		const name = `mf-required-${Math.random().toString(36).slice(2)}`;
		const ctor = _makeComponent<{ label: string }>(name, template, {
			shadow: false,
			props: {
				label: { type: "string", required: true },
			},
		});

		expect(() => new ctor()).toThrow(/label/);
	});
});
