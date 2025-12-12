import { effect, State } from "../dist/manifold.js";

        const state = State.create()
            .add("basic", new Set(["fade", "fly-left", "fly-right", "scale", "grow", "shrink", "slide"]))
			.add("fast", new Set(["fade-fast", "fly-left-fast", "fly-right-fast", "scale-fast", "grow-fast", "shrink-fast", "slide-fast"]))
			.add("slow", new Set(["fade-slow", "fly-left-slow", "fly-right-slow", "scale-slow", "grow-slow", "shrink-slow", "slide-slow"]))
			.add("hidden", new Set<string>())
            .derive("shown", (state)=> new Set([...state.basic, ...state.fast, ...state.slow].filter(t=> !state.hidden.has(t))))
            .add("count", 0)
			.add("obj", {} as Record<string, boolean>)
			.add("map", new Map<string, boolean>())
            .add("showAll", true)
            .add("showBasic", false)
            .add("showSpeeds", false)
            .add("showSeparate", false)
            .add("increment", (state: { count: number }, el: HTMLElement) => {
                state.count += 1;
                el.style.transform = `translateX(${state.count * 2}%)`;
            })
			.add("tempToggle", (prop: string, state: { hidden: Set<string> })=> {
				console.log("Toggling", prop, state.shown.size);
				state.hidden.add(prop);
				setTimeout(()=>{
					state.hidden.delete(prop);
										console.log("BRINGING BACK", state.shown.size);

				}, 3000);
			})
            .build();

        console.log("State initialized:", state);

		effect(()=> {
			console.log("SHOWN:", [...state.shown].join(", "), state.shown.size);
		})
		effect(()=> {
			console.log("HIDDEN:", [...state.hidden].join(", "), state.hidden.size);
		})
		effect(()=> {
			console.log("OBJ CHANGED", JSON.parse(JSON.stringify(state.obj)));
		})
		effect(()=> {
			console.log("MAP CHANGED:", Object.fromEntries(state.map.entries()), state.map.size);
		})

		setTimeout(()=>{
			console.log("HIDING FADE");
			state.hidden.add("fade");
			state.obj.fade = true;
			state.map.set("fade", true);
		}, 5000);

		setTimeout(()=>{
			console.log("SHOWING FADE");
			state.hidden.delete("fade");
			state.obj.another = true;
			state.map.set("another", true);
		}, 10000);