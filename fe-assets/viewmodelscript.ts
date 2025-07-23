import { State, stateRegistry } from "../src/index.ts";

document.addEventListener("DOMContentLoaded", () => {
	// Create reactive states using the new system
	const chickenStore = stateRegistry.register("chickens", 0);
	const specialMessage = stateRegistry.register("specialMessage", "");

	// Derived state for the chicken array
	const chxArray = stateRegistry.register("chxArray", () => {
		const count = chickenStore.value > 0 ? chickenStore.value : 0;
		const array = new Array(count).fill("BOK");

		// Apply special message if it exists and index 5 is within bounds
		if (specialMessage.value && array.length > 5) {
			array[5] = specialMessage.value;
		}

		return array;
	});

	// Register condition states
	stateRegistry.register("isEven", () => chickenStore.value % 2 === 0);
	stateRegistry.register("is3", () => chickenStore.value === 3);
	stateRegistry.register("is5", () => chickenStore.value === 5);

	// Register derived state for chicken 5 display
	stateRegistry.register(
		"chicken5Message",
		() => chxArray.value[5] ?? "nothing at all!"
	);

	// initializeManifold();

	// Set up button click handlers
	(window as any).addChickens = () => {
		chickenStore.value += 10;
	};

	// Set up input handler and sync value
	(window as any).updateChickens = (event: Event) => {
		const target = event.target as HTMLInputElement;
		const value = +target.value;
		chickenStore.value = value > 0 ? value : 0;
	};

	// Set up input value synchronization
	chickenStore.effect(() => {
		const input = document.getElementById(
			"chickens-input"
		) as HTMLInputElement;
		if (input) {
			input.value = chickenStore.value.toString();
		}
	});

	// Timed updates
	setTimeout(() => {
		specialMessage.value = "BOGOCK!!!";
	}, 5_000);

	setTimeout(() => {
		specialMessage.value = "BROOOOCK!!!";
	}, 10_000);

	setTimeout(() => {
		chickenStore.value += 1;
	}, 7_000);
});
