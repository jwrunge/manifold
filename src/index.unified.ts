import { Store } from "./client/store";
import { registerSubs } from "./client/register";

const Cu = {
    Store,
    box: Store.box,
    assignFuncs: Store.assignFuncs
}

document.body.onload = ()=> registerSubs();
export default Cu;
