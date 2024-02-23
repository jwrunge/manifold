import { Store } from "./store";
import { registerSubs } from "./register";

const Cu = {
    Store,
    box: Store.box,
    assignFuncs: Store.assignFuncs
}

document.body.onload = ()=> registerSubs();
export default Cu;
