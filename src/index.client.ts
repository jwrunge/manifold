import { updateConfig } from "./general/config";
import { Store } from "./client/store";
import { registerSubs } from "./client/htmlSub";
import { get, remove } from "./client/util";

const Copper = {
    Store,
    registerSubs,
    config: updateConfig,
    get,
    remove
}

export default Copper;
