import { copperConfig } from "./config";
import { Store } from "./store";
import { registerSubs } from "./htmlSub";

const Copper = {
    Store,
    registerSubs,
    config: copperConfig,
}

export default Copper;
