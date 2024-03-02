import { FetchOptions } from "./http";

type CuOptions = {
    fetch?: Partial<Omit<FetchOptions, "method" | "href" | "done">>,
}

export let cuOps: CuOptions = {
    fetch: {

    }
}