import { hashAny } from "./hash";

export let copperConfig = {
    hashFunc: hashAny,
    subAttr: "cp-bind",
}

export function updateConfig(config: Partial<typeof copperConfig>) {
    copperConfig = {...copperConfig, ...config};
}
