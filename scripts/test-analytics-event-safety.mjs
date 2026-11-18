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

let inserts=[],notifications=[],buyer={id:'customer123',email:'client@example.com'},order=null,changes=1;
const db={prepare(sql){return {bind(...params){return {
 async first(){if(sql.includes('FROM admin_members'))return null;assert.match(sql,/SELECT id,status,total FROM orders/);return order;},
 async run(){assert.match(sql,/INSERT OR IGNORE INTO analytics_events/);inserts.push(params);return {meta:{changes}};}
}}}}};
const context={console,Date,Math,URL,Response,crypto:{randomUUID:()=> 'unit-test-id'},
 analyticsText:null,
 ensureAuthSchema:async()=>{},
 currentCustomer:async()=>buyer,
 allowedAdminEmail:(env,email)=>String(email).toLowerCase()==='admin@example.com',
 primaryDb:()=>db,
 resposta:(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}}),
 queueValenzaNtfy:(env,ctx,kind,id)=>notifications.push({kind,id})};
vm.createContext(context);
vm.runInContext(text+'\n'+section+'\nglobalThis.invokeAnalytics=analyticsEvent;',context);
const payload=(eventName,extra={})=>({eventName,eventId:'evt123456789',visitorId:'visitor123456',sessionId:'session123456',pagePath:'/perfume/valenza/',source:'ig',medium:'social',campaign:'reel_valenza_001',value:10,...extra});
const request=d=>({url:'https://www.valenzaparfums.com.br/api/analytics/event',headers:{get:k=>k==='Cookie'?d.testCookie||null:null},cf:{country:'BR'},json:async()=>d});
const fire=async d=>context.invokeAnalytics(request(d),{DB:db},{});
let r=await fire(payload('add_to_cart'));
assert.equal(r.status,204,'A valid cart event must not return 500');
assert.equal(inserts.length,1);
assert.equal(notifications.length,1,'Real cart still sends original alert');
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
r=await fire(payload('add_to_cart',{internalTest:true}));
assert.equal(r.status,204,'Marked test event is accepted for audit');
assert.equal(inserts.at(-1)[10],'valenza_interno','Test source must be isolated');
assert.equal(inserts.at(-1)[11],'internal_test','Test medium must be isolated');
assert.equal(inserts.at(-1)[12],'','Internal campaign must not pollute commercial campaigns');
assert.equal(notifications.length,1,'Internal cart must not send notification');
buyer={id:'admin123',email:'admin@example.com'};
r=await fire(payload('page_view',{testCookie:'__Host-valenza_session=mocktoken'}));
assert.equal(r.status,204,'Admin view is accepted for audit');
assert.equal(inserts.at(-1)[11],'internal_test','Admin session is identified automatically');
assert.equal(inserts.at(-1)[10],'valenza_interno','Admin visit must not count as customer lead');
console.log('PASS: paid-only purchase, campaign tracking, explicit/admin test separation and no test-cart alerts');
