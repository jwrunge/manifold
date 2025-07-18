import { expect, test } from "vitest";
import { State } from "../State";

test("array mutation methods trigger granular updates", () => {
	const arrayState = new State([1, 2, 3, 4, 5]);

	let arrayUpdateCount = 0;
	let lengthUpdateCount = 0;
	let firstElementUpdateCount = 0;
	let lastElementUpdateCount = 0;

	// Track entire array
	arrayState.effect(() => {
		arrayState.value;
		arrayUpdateCount++;
	});

	// Track length
	arrayState.effect(() => {
		arrayState.value.length;
		lengthUpdateCount++;
	});

	// Track first element
	arrayState.effect(() => {
		arrayState.value[0];
		firstElementUpdateCount++;
	});

	// Track last element
	arrayState.effect(() => {
		arrayState.value[arrayState.value.length - 1];
		lastElementUpdateCount++;
	});

	// Initial state
	expect(arrayUpdateCount).toBe(1);
	expect(lengthUpdateCount).toBe(1);
	expect(firstElementUpdateCount).toBe(1);
	expect(lastElementUpdateCount).toBe(1);

	// Test push - should trigger array, length, and last element
	arrayState.value.push(6);
	expect(arrayUpdateCount).toBe(2);
	expect(lengthUpdateCount).toBe(2);
	expect(firstElementUpdateCount).toBe(1); // Should NOT increase
	expect(lastElementUpdateCount).toBe(2);

	// Test pop - should trigger array, length, and last element
	arrayState.value.pop();
	expect(arrayUpdateCount).toBe(3);
	expect(lengthUpdateCount).toBe(3);
	expect(firstElementUpdateCount).toBe(1); // Should NOT increase
	expect(lastElementUpdateCount).toBe(3);

	// Test shift - should trigger array, length, and first element
	arrayState.value.shift();
	expect(arrayUpdateCount).toBe(4);
	expect(lengthUpdateCount).toBe(4);
	expect(firstElementUpdateCount).toBe(2);
	expect(lastElementUpdateCount).toBe(3); // Should NOT increase

	// Test unshift - should trigger array, length, and first element
	arrayState.value.unshift(0);
	expect(arrayUpdateCount).toBe(5);
	expect(lengthUpdateCount).toBe(5);
	expect(firstElementUpdateCount).toBe(3);
	expect(lastElementUpdateCount).toBe(3); // Should NOT increase
});

test("array splice operations", () => {
	const arrayState = new State(["a", "b", "c", "d", "e"]);

	let arrayUpdateCount = 0;
	let lengthUpdateCount = 0;
	let middleElementUpdateCount = 0;

	arrayState.effect(() => {
		arrayState.value;
		arrayUpdateCount++;
	});

	arrayState.effect(() => {
		arrayState.value.length;
		lengthUpdateCount++;
	});

	arrayState.effect(() => {
		arrayState.value[2]; // Middle element
		middleElementUpdateCount++;
	});

	expect(arrayUpdateCount).toBe(1);
	expect(lengthUpdateCount).toBe(1);
	expect(middleElementUpdateCount).toBe(1);
	expect(arrayState.value[2]).toBe("c");

	// Splice in middle - remove 1, add 2
	arrayState.value.splice(2, 1, "x", "y");

	expect(arrayUpdateCount).toBe(2);
	expect(lengthUpdateCount).toBe(2); // Length changed (5 -> 6)
	expect(middleElementUpdateCount).toBe(2); // Middle element changed ('c' -> 'x')
	expect(arrayState.value).toEqual(["a", "b", "x", "y", "d", "e"]);
	expect(arrayState.value[2]).toBe("x");
});

test("array sort and reverse operations", () => {
	const arrayState = new State([3, 1, 4, 1, 5, 9, 2, 6]);

	let arrayUpdateCount = 0;
	let lengthUpdateCount = 0;
	let firstElementUpdateCount = 0;

	arrayState.effect(() => {
		arrayState.value;
		arrayUpdateCount++;
	});

	arrayState.effect(() => {
		arrayState.value.length;
		lengthUpdateCount++;
	});

	arrayState.effect(() => {
		arrayState.value[0];
		firstElementUpdateCount++;
	});

	expect(arrayUpdateCount).toBe(1);
	expect(lengthUpdateCount).toBe(1);
	expect(firstElementUpdateCount).toBe(1);
	expect(arrayState.value[0]).toBe(3);

	// Sort array
	arrayState.value.sort();

	expect(arrayUpdateCount).toBe(2);
	expect(lengthUpdateCount).toBe(1); // Length unchanged
	expect(firstElementUpdateCount).toBe(2); // First element changed (3 -> 1)
	expect(arrayState.value[0]).toBe(1);
	expect(arrayState.value).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);

	// Reverse array
	arrayState.value.reverse();

	expect(arrayUpdateCount).toBe(3);
	expect(lengthUpdateCount).toBe(1); // Length unchanged
	expect(firstElementUpdateCount).toBe(3); // First element changed (1 -> 9)
	expect(arrayState.value[0]).toBe(9);
	expect(arrayState.value).toEqual([9, 6, 5, 4, 3, 2, 1, 1]);
});

test("nested array operations", () => {
	const nestedState = new State({
		users: [
			{ name: "Alice", tags: ["admin", "user"] },
			{ name: "Bob", tags: ["user"] },
		],
	});

	let usersArrayUpdateCount = 0;
	let usersLengthUpdateCount = 0;
	let firstUserUpdateCount = 0;
	let firstUserTagsUpdateCount = 0;

	// Track users array
	nestedState.effect(() => {
		nestedState.value.users;
		usersArrayUpdateCount++;
	});

	// Track users array length
	nestedState.effect(() => {
		nestedState.value.users.length;
		usersLengthUpdateCount++;
	});

	// Track first user
	nestedState.effect(() => {
		nestedState.value.users[0];
		firstUserUpdateCount++;
	});

	// Track first user's tags
	nestedState.effect(() => {
		nestedState.value.users[0]?.tags;
		firstUserTagsUpdateCount++;
	});

	expect(usersArrayUpdateCount).toBe(1);
	expect(usersLengthUpdateCount).toBe(1);
	expect(firstUserUpdateCount).toBe(1);
	expect(firstUserTagsUpdateCount).toBe(1);

	// Add tag to first user
	nestedState.value.users[0].tags.push("premium");

	expect(usersArrayUpdateCount).toBe(2); // Users array changed
	expect(usersLengthUpdateCount).toBe(1); // Users length unchanged
	expect(firstUserUpdateCount).toBe(2); // First user changed
	expect(firstUserTagsUpdateCount).toBe(2); // First user tags changed

	// Add new user
	nestedState.value.users.push({ name: "Charlie", tags: ["user"] });

	expect(usersArrayUpdateCount).toBe(3); // Users array changed
	expect(usersLengthUpdateCount).toBe(2); // Users length changed
	expect(firstUserUpdateCount).toBe(2); // First user unchanged
	expect(firstUserTagsUpdateCount).toBe(2); // First user tags unchanged

	// Modify first user's name
	nestedState.value.users[0].name = "Alice Smith";

	expect(usersArrayUpdateCount).toBe(4); // Users array changed
	expect(usersLengthUpdateCount).toBe(2); // Users length unchanged
	expect(firstUserUpdateCount).toBe(3); // First user changed
	expect(firstUserTagsUpdateCount).toBe(2); // First user tags unchanged
});

test("array with complex objects granular tracking", () => {
	const complexArrayState = new State([
		{
			id: 1,
			profile: { name: "User 1", settings: { theme: "dark" } },
			scores: [100, 200, 300],
		},
		{
			id: 2,
			profile: { name: "User 2", settings: { theme: "light" } },
			scores: [150, 250, 350],
		},
	]);

	let arrayUpdateCount = 0;
	let firstUserUpdateCount = 0;
	let firstUserNameUpdateCount = 0;
	let firstUserThemeUpdateCount = 0;
	let firstUserScoresUpdateCount = 0;

	complexArrayState.effect(() => {
		complexArrayState.value;
		arrayUpdateCount++;
	});

	complexArrayState.effect(() => {
		complexArrayState.value[0];
		firstUserUpdateCount++;
	});

	complexArrayState.effect(() => {
		complexArrayState.value[0]?.profile.name;
		firstUserNameUpdateCount++;
	});

	complexArrayState.effect(() => {
		complexArrayState.value[0]?.profile.settings.theme;
		firstUserThemeUpdateCount++;
	});

	complexArrayState.effect(() => {
		complexArrayState.value[0]?.scores;
		firstUserScoresUpdateCount++;
	});

	expect(arrayUpdateCount).toBe(1);
	expect(firstUserUpdateCount).toBe(1);
	expect(firstUserNameUpdateCount).toBe(1);
	expect(firstUserThemeUpdateCount).toBe(1);
	expect(firstUserScoresUpdateCount).toBe(1);

	// Update first user's name
	complexArrayState.value[0].profile.name = "Updated User 1";

	expect(arrayUpdateCount).toBe(2);
	expect(firstUserUpdateCount).toBe(2);
	expect(firstUserNameUpdateCount).toBe(2);
	expect(firstUserThemeUpdateCount).toBe(1); // Should NOT increase
	expect(firstUserScoresUpdateCount).toBe(1); // Should NOT increase

	// Update first user's theme
	complexArrayState.value[0].profile.settings.theme = "blue";

	expect(arrayUpdateCount).toBe(3);
	expect(firstUserUpdateCount).toBe(3);
	expect(firstUserNameUpdateCount).toBe(2); // Should NOT increase
	expect(firstUserThemeUpdateCount).toBe(2);
	expect(firstUserScoresUpdateCount).toBe(1); // Should NOT increase

	// Add score to first user
	complexArrayState.value[0].scores.push(400);

	expect(arrayUpdateCount).toBe(4);
	expect(firstUserUpdateCount).toBe(4);
	expect(firstUserNameUpdateCount).toBe(2); // Should NOT increase
	expect(firstUserThemeUpdateCount).toBe(2); // Should NOT increase
	expect(firstUserScoresUpdateCount).toBe(2);
});
