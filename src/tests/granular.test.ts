import { expect, test } from "vitest";
import { State } from "../State";

test("granular property access tracking", () => {
	const state = new State({
		user: {
			profile: {
				name: "Alice",
				email: "alice@example.com",
				preferences: {
					theme: "dark",
					language: "en",
				},
			},
			activity: {
				lastLogin: "2023-01-01",
				loginCount: 42,
			},
		},
		app: {
			version: "1.0.0",
			features: ["feature1", "feature2"],
		},
	});

	let userProfileUpdateCount = 0;
	let userNameUpdateCount = 0;
	let userEmailUpdateCount = 0;
	let userThemeUpdateCount = 0;
	let userActivityUpdateCount = 0;
	let appUpdateCount = 0;
	let rootUpdateCount = 0;

	// Track different levels of granularity
	state.effect(() => {
		state.value.user.profile;
		userProfileUpdateCount++;
	});

	state.effect(() => {
		state.value.user.profile.name;
		userNameUpdateCount++;
	});

	state.effect(() => {
		state.value.user.profile.email;
		userEmailUpdateCount++;
	});

	state.effect(() => {
		state.value.user.profile.preferences.theme;
		userThemeUpdateCount++;
	});

	state.effect(() => {
		state.value.user.activity;
		userActivityUpdateCount++;
	});

	state.effect(() => {
		state.value.app;
		appUpdateCount++;
	});

	state.effect(() => {
		state.value;
		rootUpdateCount++;
	});

	// Initial effects
	expect(userProfileUpdateCount).toBe(1);
	expect(userNameUpdateCount).toBe(1);
	expect(userEmailUpdateCount).toBe(1);
	expect(userThemeUpdateCount).toBe(1);
	expect(userActivityUpdateCount).toBe(1);
	expect(appUpdateCount).toBe(1);
	expect(rootUpdateCount).toBe(1);

	// Update user name - should only trigger relevant effects
	state.value.user.profile.name = "Alice Smith";

	expect(userProfileUpdateCount).toBe(2); // Profile changed
	expect(userNameUpdateCount).toBe(2); // Name changed
	expect(userEmailUpdateCount).toBe(1); // Email unchanged
	expect(userThemeUpdateCount).toBe(1); // Theme unchanged
	expect(userActivityUpdateCount).toBe(1); // Activity unchanged
	expect(appUpdateCount).toBe(1); // App unchanged
	expect(rootUpdateCount).toBe(2); // Root changed

	// Update user email - should only trigger relevant effects
	state.value.user.profile.email = "alice.smith@example.com";

	expect(userProfileUpdateCount).toBe(3); // Profile changed
	expect(userNameUpdateCount).toBe(2); // Name unchanged
	expect(userEmailUpdateCount).toBe(2); // Email changed
	expect(userThemeUpdateCount).toBe(1); // Theme unchanged
	expect(userActivityUpdateCount).toBe(1); // Activity unchanged
	expect(appUpdateCount).toBe(1); // App unchanged
	expect(rootUpdateCount).toBe(3); // Root changed

	// Update theme - should only trigger relevant effects
	state.value.user.profile.preferences.theme = "light";

	expect(userProfileUpdateCount).toBe(4); // Profile changed
	expect(userNameUpdateCount).toBe(2); // Name unchanged
	expect(userEmailUpdateCount).toBe(2); // Email unchanged
	expect(userThemeUpdateCount).toBe(2); // Theme changed
	expect(userActivityUpdateCount).toBe(1); // Activity unchanged
	expect(appUpdateCount).toBe(1); // App unchanged
	expect(rootUpdateCount).toBe(4); // Root changed

	// Update user activity - should only trigger relevant effects
	state.value.user.activity.loginCount = 43;

	expect(userProfileUpdateCount).toBe(4); // Profile unchanged
	expect(userNameUpdateCount).toBe(2); // Name unchanged
	expect(userEmailUpdateCount).toBe(2); // Email unchanged
	expect(userThemeUpdateCount).toBe(2); // Theme unchanged
	expect(userActivityUpdateCount).toBe(2); // Activity changed
	expect(appUpdateCount).toBe(1); // App unchanged
	expect(rootUpdateCount).toBe(5); // Root changed

	// Update app - should only trigger relevant effects
	state.value.app.version = "1.0.1";

	expect(userProfileUpdateCount).toBe(4); // Profile unchanged
	expect(userNameUpdateCount).toBe(2); // Name unchanged
	expect(userEmailUpdateCount).toBe(2); // Email unchanged
	expect(userThemeUpdateCount).toBe(2); // Theme unchanged
	expect(userActivityUpdateCount).toBe(2); // Activity unchanged
	expect(appUpdateCount).toBe(2); // App changed
	expect(rootUpdateCount).toBe(6); // Root changed
});

test("granular array element tracking", () => {
	const state = new State({
		items: [
			{ id: 1, name: "Item 1", tags: ["tag1"] },
			{ id: 2, name: "Item 2", tags: ["tag2"] },
			{ id: 3, name: "Item 3", tags: ["tag3"] },
		],
	});

	let itemsUpdateCount = 0;
	let firstItemUpdateCount = 0;
	let firstItemNameUpdateCount = 0;
	let firstItemTagsUpdateCount = 0;
	let secondItemUpdateCount = 0;
	let thirdItemUpdateCount = 0;

	state.effect(() => {
		state.value.items;
		itemsUpdateCount++;
	});

	state.effect(() => {
		state.value.items[0];
		firstItemUpdateCount++;
	});

	state.effect(() => {
		state.value.items[0]?.name;
		firstItemNameUpdateCount++;
	});

	state.effect(() => {
		state.value.items[0]?.tags;
		firstItemTagsUpdateCount++;
	});

	state.effect(() => {
		state.value.items[1];
		secondItemUpdateCount++;
	});

	state.effect(() => {
		state.value.items[2];
		thirdItemUpdateCount++;
	});

	// Initial effects
	expect(itemsUpdateCount).toBe(1);
	expect(firstItemUpdateCount).toBe(1);
	expect(firstItemNameUpdateCount).toBe(1);
	expect(firstItemTagsUpdateCount).toBe(1);
	expect(secondItemUpdateCount).toBe(1);
	expect(thirdItemUpdateCount).toBe(1);

	// Update first item name
	state.value.items[0].name = "Updated Item 1";

	expect(itemsUpdateCount).toBe(2); // Items array changed
	expect(firstItemUpdateCount).toBe(2); // First item changed
	expect(firstItemNameUpdateCount).toBe(2); // First item name changed
	expect(firstItemTagsUpdateCount).toBe(1); // First item tags unchanged
	expect(secondItemUpdateCount).toBe(1); // Second item unchanged
	expect(thirdItemUpdateCount).toBe(1); // Third item unchanged

	// Add tag to first item
	state.value.items[0].tags.push("new-tag");

	expect(itemsUpdateCount).toBe(3); // Items array changed
	expect(firstItemUpdateCount).toBe(3); // First item changed
	expect(firstItemNameUpdateCount).toBe(2); // First item name unchanged
	expect(firstItemTagsUpdateCount).toBe(2); // First item tags changed
	expect(secondItemUpdateCount).toBe(1); // Second item unchanged
	expect(thirdItemUpdateCount).toBe(1); // Third item unchanged

	// Update second item
	state.value.items[1].name = "Updated Item 2";

	expect(itemsUpdateCount).toBe(4); // Items array changed
	expect(firstItemUpdateCount).toBe(3); // First item unchanged
	expect(firstItemNameUpdateCount).toBe(2); // First item name unchanged
	expect(firstItemTagsUpdateCount).toBe(2); // First item tags unchanged
	expect(secondItemUpdateCount).toBe(2); // Second item changed
	expect(thirdItemUpdateCount).toBe(1); // Third item unchanged
});

test("Map and Set granular tracking", () => {
	const state = new State({
		userMap: new Map([
			["user1", { name: "Alice", scores: new Set([100, 200]) }],
			["user2", { name: "Bob", scores: new Set([150, 250]) }],
		]),
		metadata: {
			totalUsers: 2,
		},
	});

	let userMapUpdateCount = 0;
	let user1UpdateCount = 0;
	let user1NameUpdateCount = 0;
	let user1ScoresUpdateCount = 0;
	let user2UpdateCount = 0;
	let metadataUpdateCount = 0;

	state.effect(() => {
		state.value.userMap;
		userMapUpdateCount++;
	});

	state.effect(() => {
		state.value.userMap.get("user1");
		user1UpdateCount++;
	});

	state.effect(() => {
		state.value.userMap.get("user1")?.name;
		user1NameUpdateCount++;
	});

	state.effect(() => {
		state.value.userMap.get("user1")?.scores;
		user1ScoresUpdateCount++;
	});

	state.effect(() => {
		state.value.userMap.get("user2");
		user2UpdateCount++;
	});

	state.effect(() => {
		state.value.metadata;
		metadataUpdateCount++;
	});

	// Initial effects
	expect(userMapUpdateCount).toBe(1);
	expect(user1UpdateCount).toBe(1);
	expect(user1NameUpdateCount).toBe(1);
	expect(user1ScoresUpdateCount).toBe(1);
	expect(user2UpdateCount).toBe(1);
	expect(metadataUpdateCount).toBe(1);

	// Update user1 name
	const user1 = state.value.userMap.get("user1")!;
	user1.name = "Alice Smith";

	expect(userMapUpdateCount).toBe(2); // Map changed
	expect(user1UpdateCount).toBe(2); // User1 changed
	expect(user1NameUpdateCount).toBe(2); // User1 name changed
	expect(user1ScoresUpdateCount).toBe(1); // User1 scores unchanged
	expect(user2UpdateCount).toBe(1); // User2 unchanged
	expect(metadataUpdateCount).toBe(1); // Metadata unchanged

	// Add score to user1
	user1.scores.add(300);

	expect(userMapUpdateCount).toBe(3); // Map changed
	expect(user1UpdateCount).toBe(3); // User1 changed
	expect(user1NameUpdateCount).toBe(2); // User1 name unchanged
	expect(user1ScoresUpdateCount).toBe(2); // User1 scores changed
	expect(user2UpdateCount).toBe(1); // User2 unchanged
	expect(metadataUpdateCount).toBe(1); // Metadata unchanged

	// Add new user to map
	state.value.userMap.set("user3", {
		name: "Charlie",
		scores: new Set([75, 125]),
	});

	expect(userMapUpdateCount).toBe(4); // Map changed
	expect(user1UpdateCount).toBe(3); // User1 unchanged
	expect(user1NameUpdateCount).toBe(2); // User1 name unchanged
	expect(user1ScoresUpdateCount).toBe(2); // User1 scores unchanged
	expect(user2UpdateCount).toBe(1); // User2 unchanged
	expect(metadataUpdateCount).toBe(1); // Metadata unchanged

	// Update metadata
	state.value.metadata.totalUsers = 3;

	expect(userMapUpdateCount).toBe(4); // Map unchanged
	expect(user1UpdateCount).toBe(3); // User1 unchanged
	expect(user1NameUpdateCount).toBe(2); // User1 name unchanged
	expect(user1ScoresUpdateCount).toBe(2); // User1 scores unchanged
	expect(user2UpdateCount).toBe(1); // User2 unchanged
	expect(metadataUpdateCount).toBe(2); // Metadata changed
});

test("cross-property dependency optimization", () => {
	const state = new State({
		firstName: "John",
		lastName: "Doe",
		age: 30,
		address: {
			street: "123 Main St",
			city: "Anytown",
			zip: "12345",
		},
	});

	let fullNameUpdateCount = 0;
	let addressStringUpdateCount = 0;
	let unrelatedUpdateCount = 0;

	// Effect that depends on multiple properties
	state.effect(() => {
		const fullName = `${state.value.firstName} ${state.value.lastName}`;
		fullNameUpdateCount++;
		return fullName;
	});

	// Effect that depends on nested properties
	state.effect(() => {
		const addressString = `${state.value.address.street}, ${state.value.address.city} ${state.value.address.zip}`;
		addressStringUpdateCount++;
		return addressString;
	});

	// Effect that depends on unrelated property
	state.effect(() => {
		state.value.age;
		unrelatedUpdateCount++;
	});

	// Initial effects
	expect(fullNameUpdateCount).toBe(1);
	expect(addressStringUpdateCount).toBe(1);
	expect(unrelatedUpdateCount).toBe(1);

	// Update first name - should only trigger fullName effect
	state.value.firstName = "Jane";

	expect(fullNameUpdateCount).toBe(2);
	expect(addressStringUpdateCount).toBe(1); // Should NOT increase
	expect(unrelatedUpdateCount).toBe(1); // Should NOT increase

	// Update last name - should only trigger fullName effect
	state.value.lastName = "Smith";

	expect(fullNameUpdateCount).toBe(3);
	expect(addressStringUpdateCount).toBe(1); // Should NOT increase
	expect(unrelatedUpdateCount).toBe(1); // Should NOT increase

	// Update street - should only trigger address effect
	state.value.address.street = "456 Oak Ave";

	expect(fullNameUpdateCount).toBe(3); // Should NOT increase
	expect(addressStringUpdateCount).toBe(2);
	expect(unrelatedUpdateCount).toBe(1); // Should NOT increase

	// Update age - should only trigger unrelated effect
	state.value.age = 31;

	expect(fullNameUpdateCount).toBe(3); // Should NOT increase
	expect(addressStringUpdateCount).toBe(2); // Should NOT increase
	expect(unrelatedUpdateCount).toBe(2);
});
