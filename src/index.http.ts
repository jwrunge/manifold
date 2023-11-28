import { updateConfig } from "./general/config";
import { Store } from "./client/store";
import { registerSubs, get, remove, valueof, update } from "./client/util";

const Copper = {
    Store,
    registerSubs,
    config: updateConfig,
    get,
    remove,
    valueof,
    update
}

export default Copper;
