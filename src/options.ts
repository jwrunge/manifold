import { FetchOptions } from "./http";

export type CuOptions = {
    fetch: Omit<FetchOptions, "method" | "href" | "done" | "extract" | "replace">,
}

export let cuOps: CuOptions = {
    fetch: {
        type: "text",
        options: {},
        scriptUse: true,
        styleUse: true,
    }
}