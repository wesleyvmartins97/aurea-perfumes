import assert from 'node:assert/strict';
import {createValenzaAsaasBridge} from '../src/payments/asaas-valenza.mjs';

// Retry ONLY paid Asaas orders with a confirmed RECEIVED charge, no shipping,
// no local-delivery and no uncertain shipping network response.
let shippingId=null,created=0,networkUncertain=false,local=false;
const env={DB:{prepare(sql){
 assert.ok(sql.includes('JOIN asaas_payment_links'),'Never retry Mercado Pago card/Pix');
 assert.ok(sql.includes("o.status='Pago'"),'Never ship a pending or cancelled order');
 assert.ok(sql.includes("a.status='RECEIVED'"),'Do not ship CONFIRMED CPF holds');
 assert.ok(sql.includes("s.carrier<>'Entrega local Valenza'"),'No EnvioEcom for Colatina');
 assert.ok(sql.includes("e.event_type='shipping.network_failed'"),'No double shipment on uncertain network error');
 assert.ok(sql.includes('NOT EXISTS (SELECT 1 FROM shipment_locks lk WHERE lk.order_id=o.id)'),'Honor ALL existing shipping locks');
 assert.ok(sql.includes("e.event_type IN ('shipping.network_failed','shipping.failed')"),'All EnvioEcom failures, including HTTP 500/502/503, require manual reconciliation');
 assert.ok(!sql.includes("e.message='EnvioEcom respondeu sem identificador da postagem.'"),'Do not limit uncertainty guard to only missing-id responses');
 assert.ok(sql.includes('NOT EXISTS (SELECT 1 FROM operational_events e'),'Do not retry when provider-side creation result is uncertain');
 return {async all(){
  return {results:shippingId||networkUncertain||local?[]:[{order_id:'pay_PAID_ASAAS_12345'}]};
 }};
}}};
import fs from 'node:fs';
const asaasSource=fs.readFileSync('src/payments/asaas-valenza.mjs','utf8');
const cronCode=asaasSource.slice(asaasSource.indexOf(' async function cron(env)'),asaasSource.indexOf(' const webhook=',asaasSource.indexOf(' async function cron(env)')));
assert.equal((cronCode.match(/retryPaidShipments\(env\)/g)||[]).length,1,'cron must use only one shipping retry with strict protections');
assert.ok(!cronCode.includes('pendingShipments'),'No duplicate shipping routine bypassing shipment locks or uncertain network errors');
const bridge=createValenzaAsaasBridge({
 async criarEnvioEnvioEcom(_,id){
  assert.equal(id,'pay_PAID_ASAAS_12345');
  created++;shippingId='envioecom_123456';
  return {ok:true,shippingId};
 }
});
assert.equal(await bridge.retryPaidShipments(env),1);
assert.equal(created,1);
assert.equal(await bridge.retryPaidShipments(env),0,'Do not create two labels');
assert.equal(created,1);
shippingId=null;networkUncertain=true;
assert.equal(await bridge.retryPaidShipments(env),0,'Uncertain create must not retry blindly');
networkUncertain=false;local=true;
assert.equal(await bridge.retryPaidShipments(env),0,'Local delivery must not create label');
console.log('ASAAS paid shipping retry: only paid/received, no double label, no uncertain network retry, no local delivery PASS');
