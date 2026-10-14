import assert from 'node:assert/strict';
import {createValenzaAsaasBridge} from '../src/payments/asaas-valenza.mjs';

const customerId='customer_valid_001';
const customerAsaasId='cus_valid_001';
const reference='AUREA-TEST-ORDER-001';
const paymentId='pay_TEST_ORDER_001';
const amount=550.91;
const orders=new Map(),payments=new Map(),links=new Map(),attempts=new Map();
let gatewayStatus='PENDING',shipmentCount=0,paidEmailCount=0,releaseStockCount=0,gwCreates=0;
const remote=()=>({id:paymentId,customer:customerAsaasId,externalReference:reference,billingType:'PIX',value:amount,status:gatewayStatus});
const fetchMock=async (url,req={})=>{
 if(url.includes('/customers?externalReference'))return Response.json({data:[{id:customerAsaasId,externalReference:'VALENZA-CUSTOMER-'+customerId}]});
 if(url.endsWith('/payments')&&req.method==='POST'){
  gwCreates++;
  const body=JSON.parse(req.body);
  assert.equal(body.customer,customerAsaasId);
  assert.equal(body.billingType,'PIX');
  assert.equal(body.value,amount);
  assert.equal(body.externalReference,reference);
  return Response.json(remote());
 }
 if(url.endsWith('/payments/'+paymentId+'/pixQrCode'))return Response.json({payload:'00020126'+('Q'.repeat(40)),encodedImage:'base64encodedpng'});
 if(url.endsWith('/payments/'+paymentId)&&req.method==='GET')return Response.json(remote());
 if(url.endsWith('/payments/'+paymentId)&&req.method==='DELETE'){gatewayStatus='DELETED';return Response.json({deleted:true})}
 if(url.includes('/payments?externalReference'))return Response.json({data:[remote()]});
 throw Error('Unexpected gateway route '+url);
};
const originalFetch=globalThis.fetch;globalThis.fetch=fetchMock;
const DB={prepare(sql){
 let args=[];
 return {bind(...v){args=v;return this},async all(){return {results:[]}},async first(){
  if(sql.includes('FROM asaas_payment_links WHERE order_id=?'))return links.get(args[0])||null;
  if(sql.includes('FROM payment_attempts WHERE reference=?'))return attempts.get(args[0])||null;
  if(sql.includes('FROM orders WHERE id=?'))return orders.get(args[0])||null;
  throw Error('Unhandled DB select '+sql);
 },async run(){
  if(sql.startsWith('CREATE')||sql.startsWith('INSERT INTO asaas_webhook_events'))return {meta:{changes:1}};
  if(sql.startsWith('INSERT OR IGNORE INTO asaas_payment_links')){
   if(!links.has(args[1]))links.set(args[1],{payment_id:args[0],order_id:args[1],reference:args[2],customer_id:args[3],asaas_customer_id:args[4],billing_type:args[5],amount:args[6],status:args[7]});
   return {meta:{changes:1}};
  }
  if(sql.startsWith('UPDATE asaas_payment_links SET status=')){
   links.get(args[2]).status=args[0];return {meta:{changes:1}};
  }
  if(sql.startsWith("UPDATE orders SET status='Pago'")){
   const order=orders.get(args[1]);if(order&&['Aguardando pagamento','Processando'].includes(order.status)){order.status='Pago';return {meta:{changes:1}}}
   return {meta:{changes:0}};
  }
  if(sql.startsWith("UPDATE orders SET status='Reembolsado'")){orders.get(args[1]).status='Reembolsado';return {meta:{changes:1}}}
  if(sql.startsWith("UPDATE orders SET status='Cancelado'")){orders.get(args[1]).status='Cancelado';return {meta:{changes:1}}}
  if(sql.startsWith('UPDATE order_payments SET status=')){payments.get(args[1]).status=sql.includes("'received'")?'received':sql.includes("'refunded'")?'refunded':'cancelled';return {meta:{changes:1}}}
  if(sql.startsWith('UPDATE order_items SET stock_deducted='))return {meta:{changes:1}};
  throw Error('Unexpected mutation '+sql);
 }};
 },async batch(statements){const rs=[];for(const s of statements)rs.push(await s.run());return rs}};
const env={DB,ASAAS_API_KEY:'fake-production-token-do-not-use-xyz',ASAAS_WEBHOOK_TOKEN:'fake-webhook-secret-for-test-012345678901234567'};
const calls={};
const bridge=createValenzaAsaasBridge({
 async ensureAuthSchema(){},async guardedPaymentCreate(_,snapshot,url,params){
  assert.equal(url,'https://api.asaas.com/v3/payments');
  attempts.set(snapshot.reference,{reference:snapshot.reference,customer_id:snapshot.customerId,snapshot_json:JSON.stringify(snapshot),state:'sending'});
  return fetchMock(url,params);
 },
 async restorePaymentAttempt(_,row,synthetic){
  assert.equal(synthetic.id,paymentId);
  const snapshot=JSON.parse(row.snapshot_json);
  if(!orders.has(paymentId)){
   orders.set(paymentId,{id:paymentId,customer_id:snapshot.customerId,order_number:row.reference,status:'Aguardando pagamento',total:snapshot.total});
   payments.set(paymentId,{status:'created'});
  }
  row.state='saved';return true;
 },
 async closePaymentAttempt(_,ref,state){if(attempts.has(ref))attempts.get(ref).state=state},
 async recordOperationalEvent(){},async recordPaymentStatusEvent(){},
 async sendOrderOperationalEmail(_,id,type){if(type==='payment_confirmed')paidEmailCount++},
 async criarEnvioEnvioEcom(_,id){assert.equal(id,paymentId);shipmentCount++;return {ok:true}},
 async notifyPaidOrder(){},
 async releaseReservedStock(){releaseStockCount++},
 resposta(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}})}
});
const data={
 u:{id:customerId},items:[{id:'product_one',name:'Perfume teste',qty:1,price:579.9}],
 shipping:{cep:'29703131',street:'Rua de Testes',number:'1',neighborhood:'Centro',city:'Colatina',state:'ES'},
 chosen:{delivery_time:4},carrier:'Loggi',freight:0,total:amount,nome:'Cliente Teste',
 email:'customer@example.invalid',cpf:'12345678909',telefone:'27999999999',
 referencia:reference,async releaseReservation(){releaseStockCount++}
};
try{
 const res=await bridge.startPix(env,data),payload=await res.json();
 assert.equal(res.status,200,JSON.stringify(payload));
 assert.equal(payload.qrCode,'00020126'+('Q'.repeat(40)));
 assert.equal(payload.paymentId,paymentId);
 assert.equal(gwCreates,1,'Only one Asaas Pix charge');
 assert.equal(attempts.get(reference).state,'saved');
 assert.equal(orders.get(paymentId).status,'Aguardando pagamento');
 assert.equal((await bridge.readLink(env,paymentId)).reference,reference);
 const stillPending=await bridge.accountPix(env,{id:paymentId,total:amount},links.get(paymentId));
 assert.equal((await stillPending.json()).paid,undefined);
 gatewayStatus='CONFIRMED';
 const blocked=await bridge.status(env,links.get(paymentId));
 assert.equal((await blocked.json()).status,'pending','CPF cautious hold is NOT paid');
 assert.equal(shipmentCount,0);
 gatewayStatus='RECEIVED';
 const paid=await bridge.status(env,links.get(paymentId));
 assert.equal((await paid.json()).status,'approved');
 assert.equal(orders.get(paymentId).status,'Pago');
 assert.equal(payments.get(paymentId).status,'received');
 assert.equal(shipmentCount,1);
 assert.equal(paidEmailCount,1);
 await bridge.status(env,links.get(paymentId));
 assert.equal(shipmentCount,1,'Idempotent shipping upon repeats');
 assert.equal(paidEmailCount,1,'Idempotent approval email');
 assert.equal(releaseStockCount,0,'Never release stock after payment');
 const noCancel=await bridge.cancelPrior(env,links.get(paymentId));
 assert.equal(noCancel.ok,false);
 gatewayStatus='REFUNDED';
 await bridge.status(env,links.get(paymentId));
 assert.equal(orders.get(paymentId).status,'Reembolsado');
 assert.equal(payments.get(paymentId).status,'refunded');
 assert.equal(shipmentCount,1,'Do not create another shipping on reversal');
 assert.equal(releaseStockCount,0,'Do not release shipped stock automatically');
}finally{globalThis.fetch=originalFetch}
console.log('ASAAS purchase lifecycle: PIX -> D1 -> CPF hold -> RECEIVED -> EnvioEcom once -> refund review PASS');
