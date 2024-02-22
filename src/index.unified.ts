import { Store } from "./client/store";
import { registerSubs } from "./client/register";

const Cu = {
    Store,
    init: registerSubs,
    box: Store.box,
    func: Store.func,
    funcs: Store.funcs
}

export default Cu;
