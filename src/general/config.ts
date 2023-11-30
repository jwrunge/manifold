import { hashAny } from "./hash";

export let copperConfig = {
    hashFunc: hashAny,
    trans: {
        all: "cp-trans",
        in: "cp-in",
        out: "cp-out"
    },
}

export function updateConfig(config: Partial<typeof copperConfig>) {
    copperConfig = {...copperConfig, ...config};
}
