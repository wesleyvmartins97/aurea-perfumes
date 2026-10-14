import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import {
  asaasClient,ASAAS_API_HOSTS,AsaasRequestError,authenticateAsaasWebhook,
  classifyAsaasPaymentEvent,paymentMatchesOrder
} from '../src/payments/asaas-api.mjs';

const routes=[],apiKey='sandbox-key-THIS-IS-ONLY-A-FAKE-CREDENTIAL';
const fakeFetch=async (url,init)=>{
 const path=new URL(url).pathname+new URL(url).search;
 routes.push({url,method:init.method,body:init.body?JSON.parse(init.body):null,headers:init.headers});
 if(path==='/v3/customers'&&init.method==='POST')return Response.json({id:'cus_valid_123'});
 if(path.startsWith('/v3/customers?'))return Response.json({data:[{id:'cus_valid_123',externalReference:'VALENZA-CLIENT-123456'}]});
 if(path==='/v3/payments'&&init.method==='POST')return Response.json({id:'pay_valid_123',status:'PENDING',externalReference:'VALENZA-ORDER-123456'});
 if(path==='/v3/payments/pay_valid_123/pixQrCode')return Response.json({encodedImage:'aGVsbG8=',payload:'00020126PIXCODEISLONGENOUGH',expirationDate:'2026-10-15T00:00:00'});
 if(path==='/v3/payments/pay_valid_123')return Response.json({
  id:'pay_valid_123',status:'RECEIVED',billingType:'PIX',
  customer:'cus_valid_123',externalReference:'VALENZA-ORDER-123456',value:550.91
 });
 return Response.json({errors:[{description:'PRIVATE-GATEWAY-ERROR'}]},{status:422});
};
const c=asaasClient({apiKey,mode:'sandbox',fetchImpl:fakeFetch});
assert.equal(ASAAS_API_HOSTS.production,'https://api.asaas.com/v3');
const customer=await c.createCustomer({name:'Cliente Teste',cpfCnpj:'12345678909',email:'test@example.invalid',mobilePhone:'27999999999',reference:'VALENZA-CLIENT-123456'});
assert.equal(customer.id,'cus_valid_123');
assert.deepEqual(await c.listCustomersByReference('VALENZA-CLIENT-123456'),[{id:'cus_valid_123',externalReference:'VALENZA-CLIENT-123456'}]);
const pix=await c.createPixCharge({customerId:customer.id,total:550.91,dueDate:'2026-10-15',reference:'VALENZA-ORDER-123456'});
assert.equal(pix.id,'pay_valid_123');
assert.equal(routes[2].body.billingType,'PIX');
assert.equal(routes[2].body.value,550.91);
assert.ok(!routes[2].body.creditCard);
const qr=await c.getPixQrCode(pix.id);
assert.ok(qr.payload.length>20);
const state=await c.getPayment(pix.id);
assert.ok(paymentMatchesOrder(state,{paymentId:pix.id,reference:'VALENZA-ORDER-123456',customerId:customer.id,total:550.91,billingType:'PIX'}));
for(const mismatch of [{total:550.90},{customerId:'cus_incorrect'},{billingType:'CREDIT_CARD'},{paymentId:'pay_incorrect'}]){
 assert.equal(paymentMatchesOrder(state,{paymentId:pix.id,reference:'VALENZA-ORDER-123456',customerId:customer.id,total:550.91,billingType:'PIX',...mismatch}),false);
}
const event={id:'evt_00123',event:'PAYMENT_RECEIVED',payment:{id:pix.id}};
assert.deepEqual(classifyAsaasPaymentEvent(event),{type:'verify_remote',eventId:event.id,paymentId:pix.id});
assert.equal(classifyAsaasPaymentEvent({...event,id:'evt_00124',event:'PAYMENT_REFUNDED'}).type,'review_reversal');
assert.equal(classifyAsaasPaymentEvent({...event,id:'evt_00125',event:'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'}).type,'review_failure');
assert.equal(classifyAsaasPaymentEvent({id:'evt_00126',event:'PAYMENT_CONFIRMED',payment:{id:'not valid'}}).type,'invalid');
const secret='webhook-test-secret-not-a-real-credential-1234';
assert.equal(await authenticateAsaasWebhook(secret,secret,webcrypto),true);
assert.equal(await authenticateAsaasWebhook(secret.slice(0,-1)+'x',secret,webcrypto),false);
assert.equal(await authenticateAsaasWebhook('missing',secret,webcrypto),false);
assert.throws(()=>asaasClient({apiKey:'hi'}));
await assert.rejects(c.getPayment('../../auth'),TypeError);
await assert.rejects(c.createPixCharge({customerId:customer.id,total:550.911,dueDate:'2026-10-15',reference:'VALENZA-ORDER-123456'}),TypeError);
await assert.rejects(c.createPixCharge({customerId:customer.id,total:-2,dueDate:'2026-10-15',reference:'VALENZA-ORDER-123456'}),TypeError);
await assert.rejects(c.createCustomer({name:'Cliente Teste',cpfCnpj:'000',email:'bad',reference:'VALENZA-CLIENT-123456'}),TypeError);
assert.ok(routes.every(x=>x.url.startsWith(ASAAS_API_HOSTS.sandbox+'/')));
assert.ok(routes.every(x=>x.headers.access_token===apiKey));
const bad=asaasClient({apiKey,fetchImpl:async()=>Response.json({errors:[{description:'SECRET-DIAGNOSTIC'}]},{status:400})});
await assert.rejects(bad.createPixCharge({customerId:customer.id,total:550.91,dueDate:'2026-10-15',reference:'VALENZA-ORDER-123456'}),error=>{
 assert.ok(error instanceof AsaasRequestError);assert.equal(error.status,400);
 assert.ok(!error.message.includes('SECRET-DIAGNOSTIC'));return true;
});
let attempts=0;
const offline=asaasClient({apiKey,fetchImpl:async()=>{attempts++;throw Error('NETWORK-PRIVATE-DIAGNOSTIC')}});
await assert.rejects(offline.createPixCharge({customerId:customer.id,total:550.91,dueDate:'2026-10-15',reference:'VALENZA-ORDER-123456'}),error=>error instanceof AsaasRequestError&&error.uncertain);
assert.equal(attempts,1,'Never automatically repeat a money-moving call');
const worker=fs.readFileSync('src/worker.js','utf8');
const home=fs.readFileSync('public/index.html','utf8');
assert.match(worker,/function webhookMercadoPago\(/);
assert.match(home,/function openCheckout\(/);
assert.ok(!worker.includes('ASAAS_ACCESS_TOKEN'));
assert.ok(!home.includes('api-sandbox.asaas.com')&&!home.includes('api.asaas.com'));
console.log('Asaas API segura: PIX, QR dinâmico, referência, taxa, token webhook, recusa, erro de rede e conciliação simulados — PASS');
