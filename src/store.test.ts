import { expect, test } from "vitest";
import {Store} from "./store";

test("Test new store", () => {
	const store1 = new Store({ value: 3 })
});
