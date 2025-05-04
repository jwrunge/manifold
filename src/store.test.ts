import { test } from "vitest";
import { Store } from "./reactivity";

test("Test new store", () => {
	const store1 = new Store({ value: 3 });
});
