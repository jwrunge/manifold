/**
 * @typedef {Object} FetchOptions
 * @property {{ [ key: string ]: Partial<FetchOptions> }} [fetchProfiles] - No user access
 * @property {string} method - No user access
 * @property {string} href - No user access
 * @property {string[]} replace - No user access
 * @property {"json" | "text"} [type] - User access
 * @property {{[key: string]: any}} [options] - User access
 * @property {(val: any)=> void} [cb] - User access
 * @property {(err: any)=> void} [err] - User access
 * @property {string[]} [httpCodes] - User access
 * @property {(code: number)=> boolean | void} [onCode] - User access
 * @property {string[]} [external] - User access
 * @property {true | false} [scripts] - User access
 * @property {true | false | "all"} [styles] - User access
 * @property {true | false} [autoFetch] - User access
 * @property {string} [transClass] - Animation
 * @property {number} [inDur] - Animation
 * @property {number} [outDur] - Animation
 * @property {number} [swapDelay] - Animation
 * @property {true | false} [smartOutro] - Animation
 * @property {number} [wrapperTransDur] - Animation
 * @property {string | ((el: HTMLElement)=> void)} [inStartHook] - Animation
 * @property {string | ((el: HTMLElement)=> void)} [outStartHook] - Animation
 * @property {string | ((el: HTMLElement)=> void)} [inEndHook] - Animation
 * @property {string | ((el: HTMLElement)=> void)} [outEndHook] - Animation
 */

/**
 * @typedef {Object} LimitedFetchOptions
 * @property {Omit<FetchOptions, "fetchProfiles" | "method" | "href" | "extract" | "replace">} LimitedFetchOptions - A type that omits certain properties from FetchOptions
 */

/**
 * @typedef {Object} StringifiableFetchOptions
 * @property {Omit<LimitedFetchOptions, "inStartHook" | "outStartHook" | "inEndHook" | "outEndHook">} StringifiableFetchOptions - A type that omits certain properties from LimitedFetchOptions
 */

/**
 * @typedef {Object} DomWorkOrder
 * @property {HTMLElement} in - The input HTMLElement
 * @property {HTMLElement} out - The output HTMLElement
 * @property {string} relation - The relation between the input and output elements
 * @property {Partial<FetchOptions>} ops - The fetch options for the operation
 * @property {(el: HTMLElement | null) => void} done - The callback function to be executed when the operation is done
 */

/**
 * @template T
 * @typedef {(T | function(T): T)} UpdaterValue
 */

/**
 * @callback SubFunction
 * @param {any} value
 * @param {string} [ref]
 * @returns {void}
 */

/**
 * @template T
 * @callback UpdaterFunction
 * @param {Array<any>} upstreamValues
 * @param {T} [curVal]
 * @returns {T}
 */

/**
 * @template T
 * @typedef {Object} StoreOptions
 * @property {T} [value]
 * @property {string} [name]
 * @property {Array<string>} [upstream]
 * @property {UpdaterFunction<T>} [updater]
 */
