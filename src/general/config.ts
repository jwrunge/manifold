import { hashAny } from "./hash";

export let copperConfig = {
    hashFunc: hashAny,
    attr: {
        bind: "cp-bind",
        interpValue: "value",
        htmlFlag: "cp-html",
        if: "cp-if",
        elseIf: "cp-else-if",
        else: "cp-else"
    },
    tag: {
        interp: "cp-interp",
        each: "cp-each",
        default: "cp-default"
    },
    trans: {
        all: "cp-transitioning",
        in: "cp-in",
        out: "cp-out"
    },
}

export function updateConfig(config: Partial<typeof copperConfig>) {
    copperConfig = {...copperConfig, ...config};
}
