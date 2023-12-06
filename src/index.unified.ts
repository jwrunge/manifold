import { Store } from "./client/store";
import { get, rm, val } from "./client/util";
import { registerSubs } from "./client/clientRoot";

const Cu = {
    Store,
    init: registerSubs,
    get,
    rm,
    val
}

export default Cu;
