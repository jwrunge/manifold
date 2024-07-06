declare global {
    interface Window {
      MFLD: {
        st: Map<string, Store<any>>;
        els: Map<HTMLElement, RegisteredElement>;
        $st: { [key: string]: any }; // Proxy type for dynamic property access
        $fn: { [key: string]: Function };
        comp: { [key: string]: CustomElementConstructor };
        stProx?: typeof stProx;
      }
    }

    let MFLD: typeof window.MFLD;
}

if(!window.MFLD) window.MFLD = {
    st: new Map(),
    els: new Map(),
    $st: stProx(),
    $fn: {},
    comp: {},
};