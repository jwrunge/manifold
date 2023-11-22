import { updateConfig } from "./config";
import { Store } from "./store";
import { registerSubs } from "./htmlSub";

const Copper = {
    Store,
    registerSubs,
    config: updateConfig,
}

export default Copper;
