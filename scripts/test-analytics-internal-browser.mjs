import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync('public/google-commerce.js','utf8');
const admin=readFileSync('public/admin-account.js','utf8');
assert(admin.includes("localStorage.setItem('valenza_analytics_internal_until'"),'Admin login must mark browser automatically');
assert(admin.includes("localStorage.removeItem('valenza_analytics_internal_until'"),'Admin logout must release the browser');
const store=new Map([
 ['valenza_google_consent','granted'],
 ['valenza_analytics_internal_until',String(Date.now()+3600_000)]
]);
const requests=[],scripts=[],pixels=[];
const window={fbq:(...args)=>pixels.push(args)};
const context={window,console,URL,Date,Math,JSON,setTimeout,clearTimeout,
 location:{href:'https://www.valenzaparfums.com.br/',origin:'https://www.valenzaparfums.com.br',hostname:'www.valenzaparfums.com.br',pathname:'/'},
 crypto:{randomUUID:()=> '12345678-1234-1234-1234-123456789012'},navigator:{},
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
 document:{cookie:'',referrer:'',getElementById:()=>({}),createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}},
 fetch:async (u,o={})=>{
  requests.push({url:String(u),body:o.body});
  if(String(u).startsWith('/api/google/config'))return {ok:true,json:async()=>({ok:true,enabled:true,measurementId:'G-TEST123456'})};
  if(String(u).startsWith('/api/meta/config'))return {ok:true,json:async()=>({ok:true,enabled:true,pixelId:'1341440512390842'})};
  return {ok:true,json:async()=>({ok:true})};
 }
};
vm.runInNewContext(code,context);
window.valenzaTrackEvent('add_to_cart',{value:100,items:[{item_id:'item1',item_name:'Frasco',price:100,quantity:1}]});
await new Promise(resolve=>setImmediate(resolve));
assert.equal(requests.filter(x=>x.url==='/api/analytics/event').length,2,'Page view and cart are still recorded internally');
const records=requests.filter(x=>x.url==='/api/analytics/event').map(x=>JSON.parse(x.body));
assert(records.every(x=>x.internalTest===true),'The event collector must receive internal marker');
assert.equal(requests.filter(x=>x.url==='/api/meta/event').length,0,'No Meta CAPI for internal tests');
assert.equal(scripts.length,0,'No GA4 or Meta pixel script injected in marked browser');
assert.equal(pixels.length,0,'No browser Pixel for internal tests');
console.log('PASS: admin browser tag, internal-only events, GA4/Pixel/CAPI suppression and logout reset');
