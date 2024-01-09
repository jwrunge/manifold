import { hashAny } from "./hash";

export let copperConfig = {
    el: {
        def: "CU-DEFAULT",
    },
    attr: {
        bind: "cu-bind",
        if: "cu-if",
        elseif: "cu-else-if",
        else: "cu-else",
        templ: "cu-template",
    },
    trans: {
        all: "cu-trans",
        in: "cu-in",
        out: "cu-out",
    },
    hash: hashAny,
}
