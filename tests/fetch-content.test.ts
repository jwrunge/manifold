import { beforeEach, describe, expect, test } from "vitest";
import serverFetch from "../src/fetch.ts";

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("fetchContent DOM insertion", () => {
	beforeEach(() => {
		document.body.innerHTML = `
		  <main>
		    <section id="from"></section>
		    <section id="to"></section>
		  </main>`;
		// Reset global markers used by scripts
		(window as unknown as { __aRan?: number }).__aRan = 0;
		(window as unknown as { __bRan?: number }).__bRan = 0;
	});

	test("replace content from #payload into #to with transitions", async () => {
		const url = "/snippets/snippet-a.html";
		await serverFetch.fetch(url, {
			from: "#payload",
			to: "#to",
			method: "replace",
			addTransitionClass: "fade",
			insertScripts: true,
			insertStyles: true,
		});
		await flush();
		const to = document.querySelector("#to");
		if (!to) throw new Error("#to not found");
		expect(to.querySelector("#a1")?.textContent?.trim()).toBe("Hello A");
		// script executed exactly once
		expect((window as unknown as { __aRan?: number }).__aRan).toBe(1);
	});

	test("append whole body content and filter script/style injection", async () => {
		const url = "/snippets/snippet-b.html";
		await serverFetch.fetch(url, {
			to: "#to",
			method: "append",
			insertScripts: ["#run-once"],
			insertStyles: ["#style-once"],
		});
		await flush();
		const to = document.querySelector("#to");
		if (!to) throw new Error("#to not found");
		// should contain both registered divs from payload
		const ids = Array.from(to.querySelectorAll("#b1, #b2")).map((e) => e.id);
		expect(ids).toEqual(["b1", "b2"]);
		// filtered script executed
		expect((window as unknown as { __bRan?: number }).__bRan).toBe(1);
		// filtered link present in head
		expect(!!document.querySelector("link#style-once")).toBe(true);
	});
});
