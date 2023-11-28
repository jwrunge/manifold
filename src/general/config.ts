import { hashAny } from "./hash";

export let copperConfig = {
    hashFunc: hashAny,
    bindAttr: "cp-bind",
    interpTag: "cp-interp",
    interpValueAttr: "value",
    ifAttr: "cp-if",
    htmlFlagAttr: "cp-html",
    elseIfAttr: "cp-else-if",
    elseAttr: "cp-else",
    eachEl: "cp-each",
    defaultTag: "cp-default",
    transitioningClass: "cp-transitioning",
    transitionInClass: "cp-in",
    transitionOutClass: "cp-out",
}

export function updateConfig(config: Partial<typeof copperConfig>) {
    copperConfig = {...copperConfig, ...config};
}
