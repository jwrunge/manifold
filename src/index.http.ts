import { updateConfig } from "./general/config";
import { Store } from "./client/store";
import { get, remove, valueof, update } from "./client/util";
import { registerSubs } from "./client/clientRoot";


const Copper = {
    Store,
    init: registerSubs,
    config: updateConfig,
    get,
    remove,
    valueof,
    update
}

export default Copper;
