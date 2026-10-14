import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import {createAsaasGateway,asaasPixEnabled,asaasReady,classifyAsaasPix,storeAsaasLink,readAsaasLink,handleAsaasWebhook} from '../src/payments/asaas-prod.mjs';

const worker=fs.readFileSync('src/worker.js','utf8');
const wrangler=fs.readFileSync('wrangler.jsonc','utf8');
assert.match(wrangler,/"ASAAS_PIX_ENABLED": "true"/,'PIX Asaas deve estar habilitado somente no Worker Valenza de produção');
assert.match(worker,/pixGateway:asaasPixEnabled\(env\)\?"asaas":"mercadopago"/,'Provedor PIX deve ser consultável sem expor segredos');
assert.match(worker,/cardGateway:"mercadopago"/,'Cartão deve continuar isolado no Mercado Pago');
assert.match(worker,/if\(asaasPixEnabled\(env\)\)return asaasBridge\.startPix/);
assert.match(worker,/if\(url\.pathname===\"\/api\/asaas\/webhook\"&&request\.method===\"POST\"\)return asaasBridge\.webhook/);
assert.match(worker,/reconcileUncertainPayments\(env\),reconcileStalePixReservations\(env\),asaasBridge\.cron\(env\)/);
assert.match(worker,/asaasBridge\.accountPix\(env,ord,link\)/);
assert.match(worker,/asaasBridge\.cancelPrior\(env,asaasLink\)/);
assert.match(worker,/if\(!asaasPixEnabled\(env\)&&!mpConfig\(env\)\.accessToken\)/);
assert.match(worker,/if\(JSON\.parse\(row\.snapshot_json\|\|'{}'\)\.provider==='asaas'\)continue;/);
assert.match(worker,/order_id NOT LIKE 'pay_%'/);
assert.match(worker,/function webhookMercadoPago\(/);
assert.match(worker,/async function criarPagamentoCartao\(/);
assert.match(worker,/function mpConfig\(/);
assert.ok(!worker.includes('ASAAS_PIX_ENABLED: "true"'),'No implicit activation');
assert.equal(asaasPixEnabled({}),false);
assert.equal(asaasPixEnabled({ASAAS_PIX_ENABLED:'false'}),false);
assert.equal(asaasPixEnabled({ASAAS_PIX_ENABLED:'true'}),true);
assert.equal(asaasReady({ASAAS_API_KEY:'api_token_with_length',ASAAS_WEBHOOK_TOKEN:'webhook_secret_long_enough_for_integrity_12345'}),true);
assert.equal(asaasReady({ASAAS_API_KEY:'api_token_with_length'}),false);

const link={payment_id:'pay_123456789',order_id:'pay_123456789',reference:'AUREA-TEST-123456',customer_id:'customer_123456',asaas_customer_id:'cus_123456789',billing_type:'PIX',amount:550.91};
const remote={id:link.payment_id,externalReference:link.reference,customer:link.asaas_customer_id,billingType:'PIX',value:550.91,status:'RECEIVED'};
assert.equal(classifyAsaasPix(remote,link).status,'paid');
assert.equal(classifyAsaasPix({...remote,status:'CONFIRMED'},link).reason,'precautionary_hold');
assert.equal(classifyAsaasPix({...remote,status:'REFUNDED'},link).status,'reversed');
assert.equal(classifyAsaasPix({...remote,status:'DELETED'},link).status,'cancelled');
for(const change of [{value:550.92},{customer:'cus_other'},{id:'pay_different'},{externalReference:'AUREA-other'},{billingType:'CREDIT_CARD'}])
 assert.equal(classifyAsaasPix({...remote,...change},link).status,'review','Mismatch must NEVER confirm a sale');

const calls=[],apiKey='fake-prod-api-key-for-tests-only-xyz';
const mockFetch=async(url,init)=>{
 calls.push({url,method:init.method,auth:init.headers.access_token,body:init.body&&JSON.parse(init.body)});
 if(url.includes('/customers?'))return Response.json({data:[]});
 if(url.endsWith('/customers'))return Response.json({id:'cus_123456789'});
 if(url.includes('/payments?'))return Response.json({data:[remote]});
 if(url.endsWith('/payments')&&init.method==='POST')return Response.json({id:remote.id,...remote,status:'PENDING'});
 if(url.endsWith('/pixQrCode'))return Response.json({payload:'00020126'+('X'.repeat(30)),encodedImage:'base64IMAGE'});
 if(url.endsWith('/payments/'+remote.id))return Response.json(remote);
 return Response.json({deleted:true});
};
const gw=createAsaasGateway({ASAAS_API_KEY:apiKey},mockFetch);
assert.equal(await gw.findCustomer('VALENZA-CUSTOMER-test123456'),null);
assert.equal(await gw.createCustomer({name:'Pessoa Teste',cpf:'12345678909',email:'example@example.invalid',reference:'VALENZA-CUSTOMER-test123456'}),'cus_123456789');
const create=await gw.newPix({customer:link.asaas_customer_id,total:550.91,reference:link.reference,dueDate:'2026-10-15'});
assert.equal(create.id,link.payment_id);
const qr=await gw.getPix(link.payment_id);assert.ok(qr.qrCode.length>20);
assert.equal((await gw.findPixByReference(link.reference)).id,link.payment_id);
assert.equal((await gw.getPayment(link.payment_id)).status,'RECEIVED');
assert.ok(calls.every(x=>x.auth===apiKey&&x.url.startsWith('https://api.asaas.com/v3/')));
assert.ok(calls.some(x=>x.method==='POST'&&x.body?.billingType==='PIX'&&x.body.value===550.91));
assert.ok(!calls.some(x=>x.body?.creditCard||x.body?.cvv));
let records=new Map();
const db={prepare(sql){
 let vals=[];
 return {bind(...a){vals=a;return this},async run(){
  if(sql.startsWith('INSERT OR IGNORE INTO asaas_payment_links')&&!records.has(vals[1])){
   records.set(vals[1],{payment_id:vals[0],order_id:vals[1],reference:vals[2],customer_id:vals[3],asaas_customer_id:vals[4],billing_type:vals[5],amount:vals[6]});
  }return {meta:{changes:1}};
 },async first(){if(sql.startsWith('SELECT * FROM asaas_payment_links'))return records.get(vals[0])||null;return null}};
 },async batch(items){for(const v of items)await v.run();return []}};
await storeAsaasLink({DB:db},link);
assert.equal((await readAsaasLink({DB:db},link.order_id)).payment_id,link.payment_id);
await storeAsaasLink({DB:db},link);
assert.equal(records.size,1,'Persist mapping only once');
await assert.rejects(storeAsaasLink({DB:db},{...link,payment_id:'pay_000000000'}),/divergentes/);

{
 assert.ok(globalThis.crypto?.subtle,'Node crypto required');
 const token='token-webhook-asaas-for-tests-only-12345678900';
 const webhookEnv={ASAAS_API_KEY:apiKey,ASAAS_WEBHOOK_TOKEN:token,DB:db};
 let handled=0,wait=[],inserted=0;
 const webDb={prepare(sql){
  let vals=[];
  return {bind(...a){vals=a;return this},async run(){if(sql.startsWith('INSERT OR IGNORE INTO asaas_webhook_events'))inserted++;return {meta:{changes:1}}},async first(){return null}}
 },async batch(arr){for(const s of arr)await s.run();return []}};
 webhookEnv.DB=webDb;
 const ctx={waitUntil(p){wait.push(p)}},event={id:'evt_12345678',event:'PAYMENT_RECEIVED',payment:{id:link.payment_id,externalReference:link.reference}};
 const request=(payload,provided=token)=>new Request('https://www.valenzaparfums.com.br/api/asaas/webhook',{
  method:'POST',headers:{'asaas-access-token':provided,'Content-Type':'application/json'},body:JSON.stringify(payload)
 });
 assert.equal((await handleAsaasWebhook(request(event,'invalid'),webhookEnv,ctx,()=>{handled++})).status,401);
 assert.equal(inserted,0);
 assert.equal((await handleAsaasWebhook(request(event),webhookEnv,ctx,()=>{handled++})).status,200);
 await Promise.all(wait);assert.equal(handled,1);assert.equal(inserted,1);
 // Real Asaas webhook event IDs are opaque and can contain & followed by digits.
 // Manual charge has null externalReference and billingType BOLETO/Pix.
 // Authenticated event must be acknowledged without associating a customer order.
 const manualAsaasEvent={
  id:'evt_05b708f961d739ea7eba7e4db318f621&1569162907',
  event:'PAYMENT_CREATED',
  dateCreated:'2026-10-14 17:10:55',
  account:{id:'test_account_id',ownerId:null},
  payment:{
   object:'payment',id:'pay_l6awp5n4d5qun04p',customer:'cus_000206808792',
   value:10.0,billingType:'BOLETO',status:'PENDING',
   externalReference:null,checkoutSession:null,subscription:null,
   refundStatus:null,unknownAttribute:{futureValue:true}
  }
 };
 assert.equal((await handleAsaasWebhook(request(manualAsaasEvent),webhookEnv,ctx,()=>{handled++})).status,200,
   'Real-world & event ID and null optional fields must never trigger HTTP 400');
 await Promise.all(wait);
 assert.equal(handled,1,'Manual Asaas charge must not trigger Valenza order reconciliation');
 assert.equal(inserted,2,'Manual event must still be logged in D1 for deduplication');
 assert.equal((await handleAsaasWebhook(request({...manualAsaasEvent,id:'bad'}),webhookEnv,ctx,()=>{})).status,400);
 assert.equal((await handleAsaasWebhook(request({...manualAsaasEvent,id:null}),webhookEnv,ctx,()=>{})).status,400);
}
console.log('ASAAS PIX: flag off, provider isolated, CPF blocked CONFIRMED, D1 mapping, QR, webhook signed and MP unchanged PASS');
