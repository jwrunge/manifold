import { Store } from "./client/store";
import { registerSubs } from "./client/register";

const Cu = {
    Store,
    init: registerSubs
}

export default Cu;
