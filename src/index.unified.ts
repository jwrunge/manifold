import { Store } from "./client/store";
import { registerSubs } from "./client/clientRoot";

const Cu = {
    Store,
    init: registerSubs
}

export default Cu;
