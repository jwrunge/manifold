import { FetchOptions } from "./http";

export type CuOptions = {
    spaLinks: boolean,
    fetch: Omit<FetchOptions, "method" | "href" | "done" | "extract" | "replace">,
    fetchProfiles?: { [ key: string ]: Partial<CuOptions> }
}

export let cuOps: CuOptions = {
    spaLinks: true,
    fetch: {
        type: "text",
        options: {},
        scriptUse: true,
        styleUse: true,
        allowCodes: ["2??", "3??"],
        allowExternal: false,
    }
}