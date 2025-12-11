import { mfGet, State } from "./dist/manifold.js";

State.component(
	() => `
<template id="My-Input">
    <label>
        <span>Enter text:</span>
        <input :type="type" :sync:value="inputValue" />
    </label>
    <p>You entered: ${inputValue}</p>
</template>

<style>
    :host {
        display: block;
        margin-bottom: 1rem;
        font-family: Arial, sans-serif;
    }

    label {
        display: flex;
        flex-direction: column;
        font-weight: bold;
        margin-bottom: 0.5rem;
    }

    input {
        padding: 0.5rem;
        font-size: 1rem;
        margin-top: 0.25rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    p {
        font-style: italic;
        color: #555;
    }
</style>
`,
	{
		type: "text",
		inputValue: "",
	},
);

State.component(await mfGet("./component.mf.html", undefined, {from: "#template-id"}), {
	type: "text",
	inputValue: "",
});
