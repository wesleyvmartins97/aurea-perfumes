import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('public/google-commerce.js','utf8');
async function scenario({consent='granted',failFirst=false}={}){
 const data=new Map([['valenza_google_consent',consent]]),scripts=[],calls=[];
 let resolveConfig;
 const config=new Promise(resolve=>{resolveConfig=resolve});
 const window={};
 const context={window,console,URL,Date,Math,JSON,setTimeout,clearTimeout,
  location:{href:'https://www.valenzaparfums.com.br/',hostname:'www.valenzaparfums.com.br',pathname:'/'},
  navigator:{},crypto:{randomUUID:()=> '12345678-1234-1234-1234-123456789012'},
  localStorage:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)},
  document:{referrer:'',cookie:'',createElement:()=>({}),head:{appendChild:script=>scripts.push(script)},getElementById:()=>({})},
  fetch:async url=>{
   if(String(url).startsWith('/api/google/config'))return config;
   return {ok:true,json:async()=>({ok:true,enabled:false})};
  }
 };
 vm.runInNewContext(source,context);
 window.valenzaTrackEvent('begin_checkout',{value:289.90,items:[{item_id:'angham-second-song',price:289.90,quantity:1}]});
 assert.equal(scripts.length,0,'Do not load Google before config is resolved');
 resolveConfig({ok:true,json:async()=>({ok:true,enabled:true,measurementId:'G-B2Q60PHCRE'})});
 for(let i=0;i<8;i++)await Promise.resolve();
 if(consent==='denied'){
  assert.equal(scripts.length,0,'Denied consent must not load Google');return;
 }
 assert.equal(scripts.length,1);
 window.gtag=(...args)=>calls.push(args);
 if(failFirst){
  scripts[0].onerror();
  window.valenzaTrackEvent('add_shipping_info',{shipping_tier:'Colatina'});
  assert.equal(scripts.length,2,'A subsequent event retries a failed load');
 }
 scripts.at(-1).onload();
 assert.equal(calls.filter(x=>x[0]==='event'&&x[1]==='begin_checkout').length,1,'Replay checkout once after Google loads');
 if(failFirst)assert.equal(calls.filter(x=>x[1]==='add_shipping_info').length,1);
 window.valenzaTrackEvent('view_cart',{value:289.90});
 assert.equal(calls.filter(x=>x[1]==='view_cart').length,1,'Ready Google receives later events once');
}
await scenario();
await scenario({failFirst:true});
await scenario({consent:'denied'});
const config=fs.readFileSync('wrangler.jsonc','utf8');
assert.match(config,/"run_worker_first":\s*\[\s*"\/",\s*"\/index.html"/,'Home must pass through existing canonical redirect');
console.log('PASS: delayed GA4 config, failed-load recovery, consent rejection, canonical home routing');
