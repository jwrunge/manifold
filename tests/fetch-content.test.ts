import { beforeEach, describe, expect, test, vi } from "vitest";
import { mfFetch } from "../src/dom/fetch.ts";

const flush = () => new Promise((r) => setTimeout(r, 0));

// Mock HTML responses
const snippetA = `<!DOCTYPE html>
<html>
	<body>
		<div id="payload">
			<div id="a1" class="piece">Hello A</div>
			<script>
				window.__aRan = (window.__aRan || 0) + 1;
			</script>
			<style>
				.piece {
					border: 1px solid #ccc;
				}
			</style>
		</div>
	</body>
</html>`;

const snippetB = `<!DOCTYPE html>
<html>
	<body>
		<div id="payload">
			<div id="b1" data-mf-register>Hi B</div>
			<div id="b2" data-mf-register>Bye B</div>
			<script id="run-once">
				window.__bRan = (window.__bRan || 0) + 1;
			</script>
			<link rel="stylesheet" href="/fake.css" id="style-once" />
		</div>
	</body>
</html>`;

describe("fetchContent DOM insertion", () => {
	beforeEach(() => {
		// Mock global fetch
		global.fetch = vi.fn((url) => {
			const urlStr = url.toString();
			let html = "";
			if (urlStr.includes("snippet-a")) html = snippetA;
			else if (urlStr.includes("snippet-b")) html = snippetB;

			return Promise.resolve({
				ok: true,
				text: () => Promise.resolve(html),
			} as Response);
		});

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
		await mfFetch(url, {
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
		// Verify script was inserted into DOM (jsdom doesn't auto-execute inline scripts)
		const insertedScript = document.querySelector("script:not([src])");
		expect(insertedScript?.textContent).toContain("__aRan");
	});

	test("append whole body content and filter script/style injection", async () => {
		const url = "/snippets/snippet-b.html";
		await mfFetch(url, {
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
		// Verify filtered script was inserted (jsdom doesn't auto-execute inline scripts)
		const insertedScript = document.querySelector("script#run-once");
		expect(insertedScript?.textContent).toContain("__bRan");
		// filtered link present in head
		expect(!!document.querySelector("link#style-once")).toBe(true);
	});
});

