import { FetchOptions } from "./http";

export type CuOptions = {
    spaLinks: boolean,
    fetch: Omit<FetchOptions, "method" | "href" | "done" | "extract" | "replace">,
}

export let cuOps: CuOptions = {
    spaLinks: true,
    fetch: {
        type: "text",
        options: {},
        scriptUse: true,
        styleUse: true,
    }
}