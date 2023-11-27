import { updateConfig } from "./general/config";
import { Store } from "./client/store";
import { registerSubs } from "./client/htmlSub";

const Copper = {
    Store,
    registerSubs,
    config: updateConfig,
}

export default Copper;
