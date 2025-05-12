import { expect, test } from "vitest";
import { $watch } from "./reactivity";

test("Test new store", () => {
	// const first = $watch("Test watch");
	// $st.one = "My first store!";
	// expect($st.one).toBe("My first store!");
	// console.log("FIRST VALUE", first, first.value);
	// expect(first).toBe("Test watch");
	expect(true).toBe(true);

	const S = $watch(37);
	expect(S.value).toBe(37);
	S.value = 42;
	expect(S.value).toBe(42);
});

test("Register scripts", () => {});
