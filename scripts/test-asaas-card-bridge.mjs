import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createValenzaAsaasBridge} from '../src/payments/asaas-valenza.mjs';

const source=fs.readFileSync('src/worker.js','utf8');
const html=fs.readFileSync('public/index.html','utf8');
assert.match(source,/criarPagamentoCartao\(request,env\)/);
assert.match(html,/new MercadoPago\(/);
assert.ok(!source.includes('asaasBridge.startCard('),'Do not expose Asaas card before PCI review');
assert.ok(!html.includes('tokenizeCreditCard'),'Never improvise PAN/CVV capture in store');

const reference='AUREA-CARD-TEST-0001',pid='pay_test_tokenized_00001';
const customer='cus_test_tokenized_0001',uid='client_test_123456';
const money=199.90,cardToken='76496073-536f-4835-80db-c45d00f33695';
let gatewayStatus='PENDING',calls=0,shipments=0,emails=0,stockReleases=0;
let installment=null,installments=1,createdPayload=null;
const attempts=new Map(),orders=new Map(),links=new Map(),paymentRows=new Map();
const remote=()=>({id:pid,externalReference:reference,customer,billingType:'CREDIT_CARD',
 value:installment?66.63:money,status:gatewayStatus,...(installment?{installment,installmentCount:3}:{})});
const provider=async (url,request={})=>{
 if(url.includes('/customers?externalReference='))return Response.json({data:[{id:customer,externalReference:'VALENZA-CUSTOMER-'+uid}]});
 if(url.endsWith('/payments')&&request.method==='POST'){
  calls++;createdPayload=JSON.parse(request.body);
  assert.equal(createdPayload.customer,customer);
  assert.equal(createdPayload.billingType,'CREDIT_CARD');
  assert.equal(createdPayload.creditCardToken,cardToken);
  assert.ok(!('creditCard' in createdPayload),'No raw card payload');
  assert.ok(!('creditCardHolderInfo' in createdPayload),'No raw holder payload');
  return Response.json(remote());
 }
 if(url.endsWith('/payments/'+pid)&&request.method==='GET')return Response.json(remote());
 if(url.includes('/payments?externalReference='))return Response.json({data:[remote()]});
 throw Error('Unexpected Asaas route '+url);
};
const DB={prepare(sql){
 let args=[];
 return {bind(...a){args=a;return this},async all(){return {results:[]}},
 async first(){
  if(sql.includes('FROM asaas_payment_links WHERE order_id=?'))return links.get(args[0])||null;
  if(sql.includes('FROM payment_attempts WHERE reference=?'))return attempts.get(args[0])||null;
  if(sql.includes('FROM orders WHERE id=?'))return orders.get(args[0])||null;
  throw Error('Unknown read: '+sql);
 },
 async run(){
  if(sql.startsWith('CREATE'))return {meta:{changes:1}};
  if(sql.startsWith('INSERT OR IGNORE INTO asaas_payment_links')){
   links.set(args[1],{payment_id:args[0],order_id:args[1],reference:args[2],
    customer_id:args[3],asaas_customer_id:args[4],billing_type:args[5],amount:args[6],status:args[7]});
   return {meta:{changes:1}};
  }
  if(sql.startsWith('UPDATE asaas_payment_links SET status=')){links.get(args[2]).status=args[0];return {meta:{changes:1}}}
  if(sql.startsWith("UPDATE orders SET status='Pago'")){
   const o=orders.get(args[1]);
   if(o&&['Aguardando pagamento','Processando'].includes(o.status)){o.status='Pago';return {meta:{changes:1}}}
   return {meta:{changes:0}};
  }
  if(sql.startsWith('UPDATE order_payments SET status=')){paymentRows.get(args[3]).status=args[0];return {meta:{changes:1}}}
  if(sql.startsWith('UPDATE order_items SET stock_deducted='))return {meta:{changes:1}};
  throw Error('Unknown write: '+sql);
 }};
},async batch(statements){for(const s of statements)await s.run();return []}};
const env={DB,ASAAS_API_KEY:'fake-api-key-for-test-0123456789',ASAAS_WEBHOOK_TOKEN:'fake-webhook-secret-test-012345678901234',
 ASAAS_CARD_ENABLED:'true',ASAAS_CARD_PCI_APPROVED:'true'};
const deps={
 async ensureAuthSchema(){},
 async guardedPaymentCreate(_,snapshot,url,opts){
  assert.equal(url,'https://api.asaas.com/v3/payments');
  assert.ok(!JSON.stringify(snapshot).includes(cardToken),'Card token must never be stored');
  attempts.set(snapshot.reference,{reference:snapshot.reference,customer_id:snapshot.customerId,snapshot_json:JSON.stringify(snapshot)});
  return provider(url,opts);
 },
 async restorePaymentAttempt(_,row,payment){
  assert.equal(payment.id,pid);
  const snap=JSON.parse(row.snapshot_json);
  if(!orders.has(pid)){
   orders.set(pid,{id:pid,customer_id:snap.customerId,order_number:row.reference,total:snap.total,status:'Aguardando pagamento'});
   paymentRows.set(pid,{status:'created'});
  }
  return true;
 },
 async closePaymentAttempt(){},
 async recordOperationalEvent(){},
 async recordPaymentStatusEvent(){},
 async sendOrderOperationalEmail(_,__,kind){if(kind==='payment_confirmed')emails++},
 async criarEnvioEnvioEcom(){shipments++},
 async notifyPaidOrder(){},
 async releaseReservedStock(){stockReleases++},
 resposta(body,status=200){return Response.json(body,{status})}
};
const bridge=createValenzaAsaasBridge(deps);
const params={u:{id:uid},items:[{id:'perfume_test',qty:1,price:money,name:'Perfume Teste'}],
 shipping:{cep:'29703131'},chosen:{delivery_time:6},carrier:'Entrega local Valenza',
 freight:0,total:money,nome:'Pessoa Teste',email:'test@example.invalid',cpf:'12345678909',
 telefone:'27999999999',referencia:reference,creditCardToken:cardToken,remoteIp:'203.0.113.10',
 installments,async releaseReservation(){stockReleases++}};
const originalFetch=globalThis.fetch;
globalThis.fetch=provider;
try{
 const disabled=await bridge.startCard({...env,ASAAS_CARD_PCI_APPROVED:'false'},params);
 assert.equal(disabled.status,503);
 assert.equal(calls,0,'No Asaas charge while PCI flag disabled');
 assert.equal(stockReleases,1);
 const made=await bridge.startCard(env,params),response=await made.json();
 assert.equal(made.status,200,JSON.stringify(response));
 assert.equal(response.status,'pending');
 assert.equal(calls,1);
 assert.equal(createdPayload.value,money);
 assert.equal(createdPayload.remoteIp,params.remoteIp);
 assert.equal(links.get(pid).billing_type,'CREDIT_CARD');
 assert.equal(orders.get(pid).status,'Aguardando pagamento');
 assert.equal(shipments,0,'Do not ship from POST response');
 gatewayStatus='CONFIRMED';
 const settled=await bridge.status(env,links.get(pid));
 assert.equal((await settled.json()).status,'approved');
 assert.equal(shipments,1);
 assert.equal(emails,1);
 await bridge.status(env,links.get(pid));
 assert.equal(shipments,1,'Never issue duplicate shipment');
 // Test that a three-installment first charge cannot confirm the entire order.
 gatewayStatus='CONFIRMED';
 installment='inst_test_123456';installments=3;
 const checked=await bridge.status(env,{...links.get(pid),billing_type:'CREDIT_CARD'});
 assert.equal(checked.status,503,'Installment must require full-group reconciliation');
 assert.equal(shipments,1);
 assert.equal(stockReleases,1);
}finally{globalThis.fetch=originalFetch}
console.log('ASAAS TOKEN CARD STAGE: disabled gate, 1x simulated order, no PAN/CVV, no duplicate shipping, installments review PASS');
