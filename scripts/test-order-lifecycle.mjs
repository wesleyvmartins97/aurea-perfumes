import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
const source=fs.readFileSync('src/worker.js','utf8').replace('export default','globalThis.worker =');
const sql=new DatabaseSync(':memory:');
const DB={prepare(query){let values=[];return {bind(...v){values=v;return this},async run(){const r=sql.prepare(query).run(...values);return {meta:{changes:Number(r.changes)}}},async all(){return {results:sql.prepare(query).all(...values)}},async first(){return sql.prepare(query).get(...values)||null}}},async batch(statements){sql.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sql.exec('COMMIT');return out}catch(e){sql.exec('ROLLBACK');throw e}}};
let payStatus='pending',failure='',shippingFailure=false,trackingStatus='Em trânsito',calls=[],orderSeq=0;
const customer={id:'offline-customer',email:'client@example.invalid',email_verified:1};
const response=d=>new Response(JSON.stringify(d),{headers:{'content-type':'application/json'}});
const context={btoa,atob,URL,Request,Response,Headers,TextEncoder,TextDecoder,crypto:webcrypto,console,setTimeout,clearTimeout,fetch:async(url,options={})=>{
 calls.push({url,method:options.method||'GET',body:options.body?JSON.parse(options.body):null});
 if(url==='https://api.resend.com/emails')return response({id:'offline-mail-'+calls.length});
 if(url.startsWith('https://api.mercadopago.com/v1/orders?'))return response({data:globalThis.reconciliationResults||[]});
 if(url.includes('shipping/quote'))return response({quotes:[{id:'quote-test',carrier:'Loggi',price:25,delivery_time:5}]});
 if(url==='https://api.mercadopago.com/v1/orders'&&options.method==='POST'){
  if(failure==='network')throw new Error('offline simulated interruption');
  if(failure==='http')return new Response('{"message":"simulated refusal"}',{status:400});
  const id='offline-order-'+(++orderSeq);return response({id,status:payStatus,transactions:{payments:[{id,status:payStatus,payment_method:{qr_code:'offline-only',qr_code_base64:''}}]}});
 }
 if(url.includes('api.mercadopago.com/v1/orders/'))return response({id:url.split('/').pop(),transactions:{payments:[{status:payStatus}]}});
 if(url.includes('/whitelabel/shipments/')&&!url.includes('generate-labels'))return response({status:trackingStatus,updated_at:'2026-10-03T12:00:00Z'});
 if(url.includes('shipping/create'))return shippingFailure?new Response('{}',{status:503}):response([{shipping_id:999,barcode:'OFFLINE-TRACK'}]);
 if(url.includes('generate-labels'))return new Response('offline-pdf',{headers:{'content-type':'application/pdf'}});
 throw new Error('Unexpected external call blocked: '+url);
}};
vm.createContext(context);vm.runInContext(source,context);
vm.runInContext('globalThis.realNotify=notifyPaidOrder; globalThis.realMail=sendOrderOperationalEmail;',context);
vm.runInContext('currentCustomer=async()=>globalThis.testCustomer; recordOperationalEvent=async()=>{}; recordPaymentStatusEvent=async()=>{}; sendOrderOperationalEmail=async()=>{}; notifyPaidOrder=async()=>{}; markOpportunityRecovered=async()=>{}; markOpportunityPaymentIssue=async()=>{};',context);
context.testCustomer=customer;
const env={DB,MERCADOPAGO_MODE:'production',MERCADOPAGO_ACCESS_TOKEN:'offline-no-network',ENVIOECOM_TOKEN:'offline-no-network',ENVIOECOM_ORIGIN_CEP:'29703131'};
await context.ensureAuthSchema(env);await context.seedInventory(env);
sql.prepare('INSERT INTO customers VALUES(?,?,?,?,?,?,?,?)').run(customer.id,'Cliente Simulado',customer.email,'offline','offline',1,new Date().toISOString(),new Date().toISOString());
const base={name:'Cliente Simulado',email:customer.email,cpf:'52998224725',paymentMethod:'pix',token:'offline-card-token',payment_method_id:'visa',installments:3,items:[{id:'athena',qty:1,price:239.90}],shipping:{cep:'29703131',id:'valenza-colatina-gratis',street:'Rua de teste',number:'1',neighborhood:'Teste',city:'Colatina',state:'ES'}};
// Use the actual configured free-delivery quote identifier.
base.shipping.id=vm.runInContext('LOCAL_COLATINA.id',context);
const stock=()=>sql.prepare("SELECT stock FROM inventory WHERE product_id='athena'").get().stock;
const start=stock();
const call=async(kind,data=base)=>{const r=await context[kind](new Request('https://www.valenzaparfums.com.br/api/pagamento',{method:'POST',body:JSON.stringify(data)}),env);return {status:r.status,body:await r.json()}};
let r=await call('criarPagamentoPix');assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.amount,'227.91');assert.equal(stock(),start-1);const pixId=r.body.orderId;
assert.equal(sql.prepare('SELECT status FROM orders WHERE id=?').get(pixId).status,'Aguardando pagamento');
payStatus='approved';await context.webhookMercadoPago(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({data:{id:pixId}})}),env);assert.equal(sql.prepare('SELECT status FROM orders WHERE id=?').get(pixId).status,'Pago');assert.equal(stock(),start-1);
await context.webhookMercadoPago(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({data:{id:pixId}})}),env);assert.equal(stock(),start-1,'Repeated payment must not deduct twice');assert.equal(calls.filter(c=>c.url.includes('shipping/create')).length,0,'Colatina must not buy shipping');
console.log('PASS Pix: 5% discount, pending then paid, repeated approval, free local delivery');
payStatus='pending';r=await call('criarPagamentoPix');const expiredId=r.body.orderId;payStatus='expired';await context.webhookMercadoPago(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({data:{id:expiredId}})}),env);assert.equal(stock(),start-1);await context.releaseReservedStock(env,expiredId);assert.equal(stock(),start-1,'Repeated expiry must not replenish twice');
console.log('PASS Pix expiry and idempotent stock return');
payStatus='approved';const outOfTown={...base,shipping:{...base.shipping,cep:'30130010',id:'quote-test',carrier:'Loggi',city:'Belo Horizonte',state:'MG'}};
r=await call('criarPagamentoCartao',outOfTown);assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.amount,'264.90');const cardId=r.body.orderId;
assert.equal(calls.filter(c=>c.url.includes('shipping/create')).length,1);assert.equal(sql.prepare('SELECT label_ready FROM order_shipping WHERE order_id=?').get(cardId).label_ready,1);assert.equal(sql.prepare('SELECT tracking_code FROM orders WHERE id=?').get(cardId).tracking_code,'OFFLINE-TRACK');
await context.webhookMercadoPago(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({data:{id:cardId}})}),env);assert.equal(calls.filter(c=>c.url.includes('shipping/create')).length,1,'Repeated approval must not recreate shipping');
console.log('PASS card: canonical total + requoted freight, shipment, label, tracking and duplicate protection');
const beforeReject=stock();payStatus='rejected';r=await call('criarPagamentoCartao');assert.equal(r.status,200);assert.equal(stock(),beforeReject);await context.releaseReservedStock(env,r.body.orderId);assert.equal(stock(),beforeReject);
console.log('PASS rejected card restores reservation once');
context.testCustomer=null;assert.equal((await call('criarPagamentoPix')).status,401);context.testCustomer={...customer,email_verified:0};assert.equal((await call('criarPagamentoPix')).status,403);context.testCustomer=customer;
assert.equal((await call('criarPagamentoPix',{...base,items:[{id:'athena',qty:1,price:1}]})).status,409);assert.equal((await call('criarPagamentoCartao',{...base,installments:13})).status,400);
assert.equal((await call('criarPagamentoPix',{...base,shipping:{...base.shipping,number:''}})).status,400);
console.log('PASS auth, verified email, tampered price, address and installment guards');
failure='http';const beforeHttp=stock();r=await call('criarPagamentoPix');assert.equal(r.status,400);assert.equal(stock(),beforeHttp);
failure='network';const beforeNetwork=stock();r=await call('criarPagamentoPix');assert.equal(r.status,409);assert.equal(r.body.paymentUncertain,true);assert.equal(stock(),beforeNetwork-1,'Ambiguous provider response must retain a traceable reservation');
const attempt=sql.prepare("SELECT * FROM payment_attempts WHERE state='uncertain'").get();assert.ok(attempt);assert.ok(!attempt.snapshot_json.includes('offline-card-token'));assert.ok(!attempt.snapshot_json.includes('offline-no-network'));
const beforeRetry=stock();assert.equal((await call('criarPagamentoCartao')).status,409);assert.equal(stock(),beforeRetry,'Blocked retry must restore only the new reservation');
failure='';payStatus='approved';const recovered={id:'offline-recovered',external_reference:attempt.reference,total_amount:'227.91',transactions:{payments:[{status:'approved'}]}};assert.equal(await context.restorePaymentAttempt(env,attempt,recovered),true);assert.equal(sql.prepare('SELECT status FROM orders WHERE id=?').get(recovered.id).status,'Pago');assert.equal(stock(),beforeNetwork-1);await context.restorePaymentAttempt(env,attempt,recovered);assert.equal(stock(),beforeNetwork-1);
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM order_items WHERE order_id=?').get(recovered.id).n,1);
console.log('PASS definite refusal restores stock; ambiguous interruption is journaled, retry blocked and approved order restored exactly once');

// Exercise the scheduled search, including no match, wrong amount, partial persistence and rejection.
failure='network';r=await call('criarPagamentoPix');assert.equal(r.status,409);
const scheduledAttempt=sql.prepare("SELECT * FROM payment_attempts WHERE state='uncertain'").get();
sql.prepare('UPDATE payment_attempts SET created_at=? WHERE reference=?').run(new Date(Date.now()-180000).toISOString(),scheduledAttempt.reference);
const scheduledStock=stock();globalThis.reconciliationResults=[];await context.reconcileUncertainPayments(env);assert.equal(stock(),scheduledStock);assert.equal(sql.prepare('SELECT state FROM payment_attempts WHERE reference=?').get(scheduledAttempt.reference).state,'uncertain');
const scheduledRemote={id:'offline-scheduled',external_reference:scheduledAttempt.reference,total_amount:'1.00',transactions:{payments:[{status:'rejected'}]}};
globalThis.reconciliationResults=[scheduledRemote];await context.reconcileUncertainPayments(env);assert.equal(stock(),scheduledStock,'Wrong total must never settle a reservation');
scheduledRemote.total_amount='227.91';await context.reconcileUncertainPayments(env);assert.equal(stock(),scheduledStock+1);await context.reconcileUncertainPayments(env);assert.equal(stock(),scheduledStock+1);
// A partially written order must be kept for review rather than silently marked complete.
failure='network';r=await call('criarPagamentoPix');const partial=sql.prepare("SELECT * FROM payment_attempts WHERE state='uncertain'").get();const snap=JSON.parse(partial.snapshot_json);
sql.prepare('INSERT INTO orders(id,customer_id,order_number,status,total,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run('offline-partial',snap.customerId,partial.reference,'Aguardando pagamento',snap.total,partial.created_at,partial.created_at);
assert.equal(await context.restorePaymentAttempt(env,partial,{...scheduledRemote,id:'offline-partial',external_reference:partial.reference}),false);assert.equal(sql.prepare('SELECT state FROM payment_attempts WHERE reference=?').get(partial.reference).state,'uncertain');
// Release this fixture only after a simulated explicit refusal, preserving the production guard.
sql.prepare('DELETE FROM orders WHERE id=?').run('offline-partial');assert.equal(await context.restorePaymentAttempt(env,partial,{...scheduledRemote,id:'offline-partial-rejected',external_reference:partial.reference}),true);
failure='';globalThis.reconciliationResults=[];
console.log('PASS scheduled reconciliation: empty search and amount mismatch stay protected, refusal releases once, partial persistence requires review');

payStatus='approved';shippingFailure=true;const beforeShippingFailure=stock();r=await call('criarPagamentoCartao',outOfTown);assert.equal(r.status,200);assert.equal(sql.prepare('SELECT status FROM orders WHERE id=?').get(r.body.orderId).status,'Pago');assert.equal(stock(),beforeShippingFailure-1);assert.equal(sql.prepare('SELECT shipping_id FROM order_shipping WHERE order_id=?').get(r.body.orderId).shipping_id,null);
shippingFailure=false;assert.equal((await context.criarEnvioEnvioEcom(env,r.body.orderId)).ok,true);const afterShippingRetry=calls.filter(c=>c.url.includes('shipping/create')).length;await context.criarEnvioEnvioEcom(env,r.body.orderId);assert.equal(calls.filter(c=>c.url.includes('shipping/create')).length,afterShippingRetry);
await context.syncShipmentTracking(env);assert.equal(sql.prepare('SELECT status FROM shipment_tracking_state WHERE order_id=?').get(cardId).status,'in_transit');
trackingStatus='Entregue';await context.syncShipmentTracking(env);assert.equal(sql.prepare('SELECT status FROM shipment_tracking_state WHERE order_id=?').get(cardId).status,'delivered');const deliveredCalls=calls.length;await context.syncShipmentTracking(env);assert.equal(calls.length,deliveredCalls,'Delivered shipments stop polling');
console.log('PASS shipment refusal preserves paid order; retry creates once; tracking advances to delivery and stops polling');

env.RESEND_API_KEY='offline-no-network';env.ADMIN_EMAILS='owner@example.invalid';
const req=data=>new Request('https://www.valenzaparfums.com.br/api/auth/register',{method:'POST',body:JSON.stringify(data)});
const credentials={name:'Cadastro de teste',email:'registration@example.invalid',password:'Offline-Fixture-12345'};
let ar=await context.authRegister(req(credentials),env);assert.equal(ar.status,200);let ab=await ar.json();assert.equal(ab.emailSent,true);
assert.equal((await context.authLogin(req(credentials),env)).status,403);
const mail=calls.filter(c=>c.url==='https://api.resend.com/emails').at(-1);const verifyUrl=mail.body.text.match(/https:\/\/[^\s]+/)[0];assert.equal((await context.authVerify(new URL(verifyUrl),env)).status,200);assert.equal((await context.authVerify(new URL(verifyUrl),env)).status,400);
ar=await context.authLogin(req(credentials),env);assert.equal(ar.status,200);const cookie=ar.headers.getSetCookie().find(x=>x.startsWith('__Host-')).split(';')[0];
const me=await context.authMe(new Request('https://www.valenzaparfums.com.br/api/auth/me',{headers:{cookie}}),env);assert.equal(me.status,200);assert.equal((await me.json()).user.emailVerified,true);
assert.equal((await context.authLogin(req({...credentials,password:'incorrect'}),env)).status,401);
await context.authLogout(new Request('https://www.valenzaparfums.com.br/api/auth/logout',{method:'POST',headers:{cookie}}),env);assert.equal((await context.authMe(new Request('https://www.valenzaparfums.com.br/api/auth/me',{headers:{cookie}}),env)).status,401);
console.log('PASS registration, verification, one-use link, login cookie, wrong password and logout');
await context.realNotify(env,cardId);await context.realNotify(env,cardId);assert.equal(sql.prepare('SELECT COUNT(*) n FROM admin_notifications WHERE order_id=?').get(cardId).n,1);
const beforeEmail=calls.filter(c=>c.url==='https://api.resend.com/emails').length;await context.realMail(env,cardId,'payment_confirmed');await context.realMail(env,cardId,'payment_confirmed');assert.equal(calls.filter(c=>c.url==='https://api.resend.com/emails').length,beforeEmail+1);
console.log('PASS actual admin sale alert and customer payment email are deduplicated (mock provider)');
sql.close();

