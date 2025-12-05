import { effect, State } from "./src/main.ts";

const toggleLayer = (layerName: keyof typeof myState.layers) => {
	const layer = myState.layers[layerName];
	if (layer) {
		layer.visible = !layer.visible;
	}
};

const setLayerOpacity = (
	layerName: keyof typeof myState.layers,
	opacity: number,
) => {
	const layer = myState.layers[layerName];
	if (layer) {
		layer.opacity = Math.min(1.0, Math.max(0.0, opacity));
	}
};

const myState = State.create()
	.add("layers", {
		"main-background": { visible: true, opacity: 1.0 },
		"main-foreground": { visible: false, opacity: 0.5 },
		"sec-layer1": { visible: true, opacity: 0.75 } as
			| { visible: boolean; opacity: number }
			| undefined,
		"sec-layer2": { visible: false, opacity: 0.25 },
	} as Record<string, { visible: boolean; opacity: number } | undefined>)
	.derive("layerNames", (state) => Object.keys(state.layers))
	.derive("visibleLayers", (state) => {
		const result: string[] = [];
		for (const [name, layer] of Object.entries(state.layers)) {
			if (layer?.visible) {
				result.push(name);
			}
		}
		return result;
	})
	.derive("layerGroups", (state) => {
		const groups = new Set<string>();
		for (const name of Object.keys(state.layers)) {
			const parts = name.split("-");
			if (parts.length > 1) {
				groups.add(parts[0]);
			}
		}
		return Array.from(groups);
	})
	.build();

effect(() => {
	console.log("Visible layers changed:", myState.visibleLayers);
});

effect(() => {
	console.log("Layer groups changed:", myState.layerGroups);
});

effect(() => {
	console.log("Layer list changed", myState.layerNames);
});

effect(() => {
	console.log("Layer states changed:", myState.layers);
});

effect(() => {
	console.log(
		"Background visibility changed",
		myState.layers["main-background"]?.visible,
	);
});

effect(() => {
	console.log(
		"Background opacity changed",
		myState.layers["main-background"]?.opacity,
	);
});

setTimeout(() => {
	console.log("----- 1000ms -----");

	toggleLayer("main-background");
	setLayerOpacity("main-background", 0.8);
	toggleLayer("sec-layer1");
}, 1000);

setTimeout(() => {
	console.log("----- 2000ms -----");

	myState.layers["new-layer"] = { visible: true, opacity: 0.6 };
	toggleLayer("main-foreground");
	setLayerOpacity("main-background", 0.3);
	toggleLayer("sec-layer2");
}, 2000);

setTimeout(() => {
	console.log("----- 3000ms -----");

	delete myState.layers["sec-layer1"];
	toggleLayer("main-background");
	setLayerOpacity("main-background", 1.0);
}, 3000);
