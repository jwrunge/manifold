import { Store } from "./store";
import { registerSubs } from "./register";

document.body.onload = ()=> registerSubs();

export default Store;
