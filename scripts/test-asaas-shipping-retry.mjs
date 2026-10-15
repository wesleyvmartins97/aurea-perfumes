import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createValenzaAsaasBridge} from '../src/payments/asaas-valenza.mjs';

const src=fs.readFileSync('src/payments/asaas-valenza.mjs','utf8');
assert.match(src,/o\.status='Pago'/);
assert.match(src,/l\.status='RECEIVED'/);
assert.match(src,/s\.carrier<>'Entrega local Valenza'/);
assert.match(src,/COALESCE\(s\.shipping_id,''\)=''/);
assert.match(src,/COALESCE\(s\.barcode,''\)=''/);

let attempts=0,ready=false,paid=true,remoteState='RECEIVED',seen=[];
const orderId='pay_audit_order_1234';
const DB={
 prepare(sql){
  seen.push(sql);
  return {bind(){return this},async all(){
   if(sql.includes('FROM payment_attempts'))return {results:[]};
   if(sql.includes('FROM asaas_payment_links WHERE status NOT IN'))return {results:[]};
   if(sql.includes('FROM asaas_webhook_events WHERE state='))return {results:[]};
   if(sql.includes('JOIN orders o ON o.id=l.order_id'))return {results:paid&&!ready&&remoteState==='RECEIVED'?[{order_id:orderId}]:[]};
   throw new Error('Unexpected SQL: '+sql);
  },async run(){return {meta:{changes:0}}}};
 },
 async batch(){return []}
};
const bridge=createValenzaAsaasBridge({
 async ensureAuthSchema(){},async guardedPaymentCreate(){throw Error('Do not charge')},
 async restorePaymentAttempt(){throw Error('No order required')},
 async closePaymentAttempt(){},async recordOperationalEvent(){},
 async recordPaymentStatusEvent(){},async sendOrderOperationalEmail(){},
 async criarEnvioEnvioEcom(_,id){
  assert.equal(id,orderId);
  attempts++;
  if(attempts===1)return {ok:false,error:'Temporary carrier error'};
  ready=true;return {ok:true,shippingId:'shipping_123'};
 },
 async notifyPaidOrder(){},async releaseReservedStock(){throw Error('Stock must not be released')},
 resposta(x,status=200){return Response.json(x,{status})}
});
const env={DB,ASAAS_API_KEY:'test_secret_not_real_1234567',ASAAS_WEBHOOK_TOKEN:'test_webhook_secret_that_is_long_enough_for_auth'};
await bridge.cron(env);
assert.equal(attempts,1,'failed shipping attempted first time');
await bridge.cron(env);
assert.equal(attempts,2,'failed shipping retried');
await bridge.cron(env);
assert.equal(attempts,2,'completed shipping not duplicated');
ready=false;paid=false;
await bridge.cron(env);
assert.equal(attempts,2,'never ship unpaid order');
paid=true;remoteState='CONFIRMED';
await bridge.cron(env);
assert.equal(attempts,2,'CPF hold must not ship');
assert.ok(seen.some(sql=>sql.includes("o.status='Pago'")&&sql.includes("l.status='RECEIVED'")));
console.log('ASAAS: Retentativa EnvioEcom para pago RECEIVED, no duplicate / unpaid / CPF hold — PASS');
