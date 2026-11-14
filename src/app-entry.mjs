import store from './worker.js';
import {androidRoute,addAndroidInstall} from './android-app.mjs';
export default {...store,async fetch(request,env,ctx){
  const app=androidRoute(request);if(app)return app;
  return addAndroidInstall(await store.fetch(request,env,ctx));
}};
