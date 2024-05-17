/** @type {HTMLElement | null} */ let spacer;
let spacerHeight = "";
let wrapperHeight = 0;

/**
 * @export
 * @param {(HTMLElement)} inEl
 * @param {(HTMLElement)} wrapper
 */
function _addSpacer(inEl, wrapper) {
    //Conserve parent size
    spacer = globalThis.document?.createElement("div");
    let { paddingTop, paddingBottom } = globalThis.getComputedStyle(wrapper);

    spacerHeight = spacer.style.height = `calc(${(Math.abs(wrapperHeight - (inEl?.clientHeight || 0)))}px - ${paddingTop} - ${paddingBottom})`;
    wrapper?.after(spacer);
}

/**
 * @export
 * @param {(HTMLElement)} inEl
 * @param {Object} ops
 * @param {Function} domUpdate
 */
function _handleHeightAdjust(inEl, ops, domUpdate) {
    wrapperHeight = ops.order.out ? ops.order.out.clientHeight : 
    domUpdate(()=> {
        spacer?.remove();
        inEl?.animate?.([
            { height: spacerHeight },
            { height: `${inEl.clientHeight || 0}px` }
        ], {
            duration: ops.trans?.dur?.[1] || ops.trans?.dur || 300,
            easing: "ease-in-out",
        });
    });
}

/**
 * @param {HTMLElement} el 
 */
function _adjustSizing(el) {
    //Handle absolute positioning and size conservation
    el.style.width = `${(el).clientWidth}px`;
    el.style.height = `${(el).clientHeight}px`;
    el.style.position = "absolute";
}

globalThis.smartOutro = {
    space: _addSpacer,
    adjust: _handleHeightAdjust,
    size: _adjustSizing
};