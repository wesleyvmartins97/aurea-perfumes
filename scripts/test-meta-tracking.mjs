import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('public/google-commerce.js','utf8');
async function run(consent){
 const saved=new Map([['valenza_google_consent',consent]]),scripts=[],calls=[],posts=[];
 let resolveMeta;const metaConfig=new Promise(resolve=>resolveMeta=resolve);
 const window={fbq:(...args)=>calls.push(args)};
 const context={window,console,URL,Date,Math,JSON,setTimeout,clearTimeout,crypto:{randomUUID:()=> '12345678-1234-1234-1234-123456789012'},navigator:{},
 location:{href:'https://www.valenzaparfums.com.br/',origin:'https://www.valenzaparfums.com.br',hostname:'www.valenzaparfums.com.br',pathname:'/'},
 localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
 document:{cookie:'',referrer:'',getElementById:()=>({}),createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}},
 fetch:async(url,options)=>{if(String(url).startsWith('/api/meta/config'))return metaConfig;if(String(url).startsWith('/api/google/config'))return {ok:true,json:async()=>({ok:true,enabled:false})};if(String(url)==='/api/meta/event')posts.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true})}}
 };
 vm.runInNewContext(source,context);
 window.valenzaTrackEvent('add_to_cart',{value:239.90,items:[{item_id:'athena',quantity:1,price:239.90}]});
 assert.equal(calls.length,0,'No Meta events before config is known');
 resolveMeta({ok:true,json:async()=>({ok:true,enabled:true,pixelId:'1842519260246859'})});
 await new Promise(resolve=>setImmediate(resolve));
 if(consent==='denied'){assert.equal(calls.length,0);assert.equal(posts.length,0);assert.equal(scripts.length,0);return;}
 assert.equal(calls.filter(x=>x[0]==='init').length,1);
 assert.equal(calls.find(x=>x[0]==='init')[1],'1842519260246859');
 assert.equal(calls.filter(x=>x[1]==='PageView').length,1);
 assert.equal(calls.filter(x=>x[1]==='AddToCart').length,1,'An event waiting for config must be replayed once');
 const add=calls.find(x=>x[1]==='AddToCart'),post=posts.find(x=>x.eventName==='AddToCart');
 assert.equal(add[3].eventID,post.eventId,'Pixel and server share the same occurrence ID');
 assert.equal(post.value,239.90);assert.equal(post.contentIds[0],'athena');
 assert.equal(post.consent,'granted');assert.equal(post.eventSourceUrl,'https://www.valenzaparfums.com.br/');
 window.valenzaTrackEvent('begin_checkout',{value:239.90});
 assert.equal(calls.filter(x=>x[1]==='InitiateCheckout').length,1);
 assert.equal(window.valenzaTrackPurchase({transactionId:'simulation-only',value:239.90}),true);
 assert.equal(window.valenzaTrackPurchase({transactionId:'simulation-only',value:239.90}),false);
 assert.equal(calls.filter(x=>x[1]==='Purchase').length,1,'A confirmed transaction is emitted once');
 assert.equal(posts.find(x=>x.eventName==='Purchase').eventId,'purchase:simulation-only');
}
await run('granted');await run('denied');
console.log('PASS: Meta consent, delayed config replay, checkout, amounts, shared event IDs and repeated purchase suppression; no real requests');
