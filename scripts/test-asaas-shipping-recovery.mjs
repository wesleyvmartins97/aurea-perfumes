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
 assert.ok(sql.includes("lk.state IN ('created','admin_deleting')"),'Honor existing shipping locks');
 return {async all(){
  return {results:shippingId||networkUncertain||local?[]:[{order_id:'pay_PAID_ASAAS_12345'}]};
 }};
}}};
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
