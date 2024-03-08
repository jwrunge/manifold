import { Store } from "./store";
import { registerSubs, options } from "./domRegistrar";

document.body.onload = ()=> { registerSubs(); };

export default {
    store: Store.store,
    config: options
};
