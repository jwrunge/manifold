import { hashAny } from "./hash";

export let copperConfig = {
    el: {
        def: "CU-DEFAULT",
    },
    attr: {
        bind: "data-bind",
        sync: "data-sync",
        if: "data-if",
        elseif: "data-else-if",
        else: "data-else",
        templ: "data-templ",
    },
    trans: {
        all: "data-trans",
        in: "data-in",
        out: "data-out",
    },
    hash: hashAny,
}
