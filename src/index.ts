import { Store } from "./store";
import { registerSubs } from "./domRegistrar";

document.body.onload = ()=> { registerSubs(); };

export default Store;
