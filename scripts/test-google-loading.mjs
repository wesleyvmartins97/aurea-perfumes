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
 window.valenzaTrackPurchase({transactionId:'offline-test-order',value:227.91,paymentType:'pix'});
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
 const conversions=calls.filter(x=>x[0]==='event'&&x[1]==='conversion');
 assert.equal(conversions.length,1,'Queued paid purchase emits one Ads conversion');
 assert.equal(conversions[0][2].send_to,'AW-18488018298/x9KICL3nlo0dEPqK4-9E');
 assert.equal(conversions[0][2].value,227.91);
 assert.equal(conversions[0][2].currency,'BRL');
 assert.equal(conversions[0][2].transaction_id,'offline-test-order');
 assert.equal(calls.find(x=>x[1]==='purchase')[2].send_to,'G-B2Q60PHCRE','GA4 events use their explicit destination');
 window.valenzaTrackPurchase({transactionId:'offline-test-order',value:227.91});
 assert.equal(calls.filter(x=>x[1]==='conversion').length,1,'Repeated approval must not duplicate Ads conversion');

}
await scenario();
await scenario({failFirst:true});
await scenario({consent:'denied'});
const config=fs.readFileSync('wrangler.jsonc','utf8');
assert.match(config,/"run_worker_first":\s*\[\s*"\/",\s*"\/index.html"/,'Home must pass through existing canonical redirect');
console.log('PASS: delayed GA4 config, failed-load recovery, consent rejection, canonical home routing');

// Run the real checkout entry point: a visible modal must reach tracking and recovery.
const home=fs.readFileSync('public/index.html','utf8');
const checkoutSource=home.split('\n').find(line=>line.startsWith('async function openCheckout()'));
assert.ok(checkoutSource);
async function checkoutScenario({verified=true}={}){
 const events=[],layers=[],sync=[];
 const classes=new Set();
 const modal={querySelector:()=>({}),classList:{add:name=>classes.add(name)}};
 const nodes={checkoutModal:modal,valenzaCheckoutTemplate:null,cart:{classList:{contains:()=>false}},accountModal:{classList:{add:()=>{}}}};
 const context={cart:[{id:'athena',price:239.90,qty:1}],accountUser:null,aureaLayers:[],
  document:{getElementById:id=>nodes[id]},
  stopPaymentPoll:()=>{},refreshProductPromotions:async()=>true,renderAccount:()=>{},
  fetch:async()=>({ok:true,json:async()=>({ok:true,user:{emailVerified:verified}})}),
  accountMsg:()=>{},showError:()=>{},valenzaNotice:()=>{},updateSummary:()=>{},setTimeout:fn=>{fn();return 1},ensureMercadoPagoSecurity:async()=>{},
  pushLayer:name=>layers.push(name),queueOpportunitySync:stage=>sync.push(stage),
  window:{valenzaTrackBeginCheckout:()=>events.push('begin_checkout')}
 };
 vm.runInNewContext(checkoutSource+';this.checkout=openCheckout;',context);
 await context.checkout();
 assert.equal(events.length,verified?1:0);
 assert.equal(sync.length,verified?1:0);
 if(verified){assert.ok(classes.has('open'));assert.deepEqual(layers,['checkout']);assert.deepEqual(sync,['checkout']);}
}
await checkoutScenario();
await checkoutScenario({verified:false});
console.log('PASS: verified checkout opens, emits begin_checkout and records recovery; unverified login remains blocked');
