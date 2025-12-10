import { State } from "../dist/manifold.js";

const state = State.create()
	.add("showAll", true)
	.add("showBasic", false)
	.add("showSpeeds", false)
	.add("showSeparate", false)
	.add(
		"toggle",
		(prop: "showAll" | "showBasic" | "showSpeeds" | "showSeparate") => {
			state[prop] = !state[prop];
		},
	) // Placeholder
	.build();

console.log("State initialized:", state);
