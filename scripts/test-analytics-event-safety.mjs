import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const worker=readFileSync('src/worker.js','utf8');
const a=worker.indexOf('async function analyticsEvent(');
const b=worker.indexOf('async function analyticsLocation(',a);
const text=worker.match(/function analyticsText\(v,max=120\)\{[^\n]*\}/)?.[0];
assert.ok(a>0&&b>a&&text,'Analytics function and sanitizer must exist');
const section=worker.slice(a,b);
assert.ok(section.includes('const eventInsert=await env.DB.prepare('),'Cart event INSERT result must be captured');
assert.ok(section.includes('eventName==="add_to_cart"&&Number(eventInsert.meta?.changes||0)>0'),'Only a newly inserted cart event notifies');

let inserts=[],buyer={id:'customer123',email:'client@example.com'},order=null,changes=1;
const db={prepare(sql){return {bind(...params){return {
 async first(){assert.match(sql,/SELECT id,status,total FROM orders/);return order;},
 async run(){assert.match(sql,/INSERT OR IGNORE INTO analytics_events/);inserts.push(params);return {meta:{changes}};}
}}}}};
const context={console,Date,Math,URL,Response,crypto:{randomUUID:()=> 'unit-test-id'},
 analyticsText:null,
 ensureAuthSchema:async()=>{},
 currentCustomer:async()=>buyer,
 primaryDb:()=>db,
 resposta:(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}}),
 queueValenzaNtfy:()=>{}};
vm.createContext(context);
vm.runInContext(text+'\n'+section+'\nglobalThis.invokeAnalytics=analyticsEvent;',context);
const payload=(eventName,extra={})=>({eventName,eventId:'evt123456789',visitorId:'visitor123456',sessionId:'session123456',pagePath:'/perfume/valenza/',source:'ig',medium:'social',campaign:'reel_valenza_001',value:10,...extra});
const request=d=>({url:'https://www.valenzaparfums.com.br/api/analytics/event',headers:{get:()=>null},cf:{country:'BR'},json:async()=>d});
const fire=async d=>context.invokeAnalytics(request(d),{DB:db},{});
let r=await fire(payload('add_to_cart'));
assert.equal(r.status,204,'A valid cart event must not return 500');
assert.equal(inserts.length,1);
assert.equal(inserts[0][12],'reel_valenza_001','Campaign must be persisted unchanged');
r=await fire(payload('purchase',{transactionId:'order123456'}));
assert.equal(r.status,404,'Unknown purchase must not be counted');
assert.equal(inserts.length,1);
order={id:'order123456',status:'Aguardando pagamento',total:259.90};
r=await fire(payload('purchase',{transactionId:'order123456'}));
assert.equal(r.status,409,'Unpaid purchase must not be counted');
assert.equal(inserts.length,1);
order={id:'order123456',status:'Pago',total:259.90};
r=await fire(payload('purchase',{transactionId:'order123456',value:1}));
assert.equal(r.status,204,'Paid owned order can be counted');
assert.equal(inserts.length,2);
assert.equal(inserts[1][8],259.90,'Use verified order value, not client-supplied value');
buyer=null;
r=await fire(payload('purchase',{transactionId:'order123456'}));
assert.equal(r.status,401,'Anonymous purchase must not be counted');
assert.equal(inserts.length,2);
console.log('PASS: campaign attribution, valid cart events, unpaid/unknown/anonymous purchase rejection, paid amount from DB');
