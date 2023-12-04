import { hashAny } from "./hash";

export const copperDefaults = {
    el: {
        interpString: "cp-str",
    },
    attr: {
        bind: "cp-bind",
        value: "cp-value",
        html: "cp-html",
        if: "cp-if",
        else: "cp-else",
        elseif: "cp-else-if",
    },
    trans: {
        all: "cp-trans",
        in: "cp-in",
        out: "cp-out",
    }
};

export let copperConfig = {
    hashFunc: hashAny,
}

export function updateConfig(config: Partial<typeof copperConfig>) {
    copperConfig = {...copperConfig, ...config};
}
