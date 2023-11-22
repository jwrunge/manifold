import { hashAny } from "./hash";

export let copperConfig = {
    hashFunc: hashAny,
    bindAttr: "cp-bind",
    evalAttr: "cp-eval",
}

export function updateConfig(config: Partial<typeof copperConfig>) {
    copperConfig = {...copperConfig, ...config};
}
