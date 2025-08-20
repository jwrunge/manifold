// import { beforeEach, describe, expect, it } from "vitest";
// import StateBuilder from "../src/main.ts";

// // Simple DOM setup helper
// const mount = (html: string) => {
// 	document.body.innerHTML = html;
// };
// const flush = () => Promise.resolve();

// describe("StateBuilder.defineComponent", () => {
// 	beforeEach(() => {
// 		document.body.innerHTML = "";
// 	});

// 	it("defines and instantiates a custom element using a template child and binds expressions", async () => {
// 		// Define component
// 		StateBuilder.defineComponent("x-hello");

// 		// Host HTML: template child with bindings
// 		mount(`
//       <x-hello>
//         <template>
//           <div>Hello \${name}</div>
//           <button :onclick="name = name + '!'"><span>Bang</span></button>
//         </template>
//       </x-hello>
//     `);

// 		const $ = StateBuilder.create({ name: "World" }).build();
// 		await flush();
// 		expect($.name).toBe("World");

// 		// Custom element should render its template
// 		const el = document.querySelector("x-hello") as HTMLElement;
// 		expect(el).toBeTruthy();
// 		const root = (el.shadowRoot || el) as HTMLElement | ShadowRoot;
// 		const txt = (root.querySelector("div") as HTMLElement).textContent;
// 		expect(txt).toBe("Hello World");

// 		// Click button to update state
// 		const btn = root.querySelector("button") as HTMLButtonElement;
// 		btn.click();
// 		await flush();
// 		expect($.name).toBe("World!");
// 		await flush();
// 		expect((root.querySelector("div") as HTMLElement).textContent).toBe(
// 			"Hello World!"
// 		);
// 	});

// 	it("supports selector-based template without shadow root", async () => {
// 		StateBuilder.defineComponent("x-user", {
// 			shadow: false,
// 			selector: "#tpl-user",
// 		});
// 		// Mount both the template and the element together so the template remains in the DOM
// 		mount(`
//       <template id="tpl-user"><span>User: \${user}</span></template>
//       <x-user></x-user>
//     `);

// 		const $ = StateBuilder.create({ user: "Ada" }).build();
// 		await flush();
// 		const el = document.querySelector("x-user") as HTMLElement;
// 		const root = (el.shadowRoot || el) as HTMLElement | ShadowRoot;
// 		expect((root.querySelector("span") as HTMLElement).textContent).toBe(
// 			"User: Ada"
// 		);

// 		$.user = "Grace";
// 		await flush();
// 		expect((root.querySelector("span") as HTMLElement).textContent).toBe(
// 			"User: Grace"
// 		);
// 	});
// });
