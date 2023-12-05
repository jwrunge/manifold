import { updateConfig } from "./general/config";
import { Store } from "./client/store";
import { get, rm, val, update } from "./client/util";
import { registerSubs } from "./client/clientRoot";

const Cu = {
    Store,
    init: registerSubs,
    config: updateConfig,
    get,
    rm,
    val,
    update
}

export default Cu;
