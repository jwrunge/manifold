import { updateConfig } from "./general/config";
import { Store } from "./client/store";
import { registerSubs } from "./client/htmlSub";
import { get, remove, valueof, update } from "./client/util";

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
