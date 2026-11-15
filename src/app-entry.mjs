import store from './worker.js';
import {androidRoute,addAndroidInstall} from './android-app.mjs';
import {nativeCatalogRoute} from './native-catalog.mjs';
import {nativeCheckoutRoute} from './native-checkout.mjs';
export default {...store,async fetch(request,env,ctx){
  const catalog=await nativeCatalogRoute(request,env,ctx,store);if(catalog)return catalog;
  const checkout=await nativeCheckoutRoute(request,env,ctx,store);if(checkout)return checkout;
  const app=await androidRoute(request,env);if(app)return app;
  return addAndroidInstall(await store.fetch(request,env,ctx));
}};
