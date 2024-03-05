export type FetchOptions = {
    method: string, 
    href: string, 
    type?: "json" | "text", 
    extract: string, 
    replace: string, 
    options?: {[key: string]: any}, 
    cb?: (val: any)=> void, 
    err?: (err: any)=> void, 
    allowCodes?: string[],
    onCode?: (code: number)=> boolean | void,
    allowExternal?: boolean | string[],
    scriptUse?: true | false | "all", 
    styleUse?: true | false | "all",
    done?: (el: HTMLElement)=> void
}

export type CuOptions = {
    spaLinks?: boolean,
    fetch?: Omit<FetchOptions, "method" | "href" | "done" | "extract" | "replace">,
    fetchProfiles?: { [ key: string ]: Partial<CuOptions> }
}

export let cuOps: CuOptions = {}