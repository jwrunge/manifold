import { State } from "../dist/manifold.js";

const transitions = ["", "fast", "slow"].map(
	(append) =>
		new Set(
			[
				"fade",
				"fly-left",
				"fly-right",
				"fly-up",
				"fly-down",
				"grow",
				"shrink",
				"slide",
			].map((t) => t + (append ? `-${append}` : "")),
		),
);

const state = State.create()
	// Knobs
	.add({
		hidden: new Set<string>(),
		count: 0,
		obj: {} as Record<string, boolean>,
		map: new Map<string, boolean>(),
		showAll: true,
		showBasic: false,
		showSpeeds: false,
		showSeparate: false,
	})
	// Transition sets
	.add({
		basic: transitions[0],
		fast: transitions[1],
		slow: transitions[2],
	})
	// Derive shown state
	.derive(
		"shown",
		(state) =>
			new Set(
				[...state.basic, ...state.fast, ...state.slow].filter(
					(t) => !state.hidden.has(t),
				),
			),
	)
	// Actions with automatic state binding
	.actions((state) => ({
		increment: (el: HTMLElement) => {
			state.count += 1;
			el.style.transform = `translateX(${state.count * 2}%)`;
		},
		tempToggle: (prop: string) => {
			console.log("Toggling", prop, state.shown.size);
			state.hidden.add(prop);
			setTimeout(() => {
				state.hidden.delete(prop);
				console.log("BRINGING BACK", state.shown.size);
			}, 3000);
		},
	}))
	.build();
