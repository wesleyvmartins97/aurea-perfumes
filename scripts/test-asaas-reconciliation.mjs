import assert from 'node:assert/strict';
import {classifyVerifiedAsaasPayment,classifyAsaasWebhookEvent,validateAsaasLink} from '../src/payments/asaas-reconciliation.mjs';
const link={order_id:'order_123456',payment_id:'pay_123456789',asaas_customer_id:'cus_123456789',reference:'VALENZA-ORDER-123456',amount:550.91,billing_type:'PIX'};
const remote={id:link.payment_id,customer:link.asaas_customer_id,externalReference:link.reference,value:550.91,billingType:'PIX',status:'RECEIVED'};
assert.equal(validateAsaasLink(link),true);
assert.deepEqual(classifyVerifiedAsaasPayment(remote,link),{decision:'paid',reason:'pix_received'});
assert.deepEqual(classifyVerifiedAsaasPayment({...remote,status:'CONFIRMED'},link),{decision:'pending',reason:'pix_precautionary_hold'});
assert.deepEqual(classifyVerifiedAsaasPayment({...remote,status:'PENDING'},link),{decision:'pending',reason:'awaiting_payment'});
assert.deepEqual(classifyVerifiedAsaasPayment({...remote,status:'REFUNDED'},link),{decision:'review',reason:'refunded_or_disputed'});
assert.deepEqual(classifyVerifiedAsaasPayment({...remote,status:'CANCELED'},link),{decision:'cancelled',reason:'provider_cancelled'});
for(const different of [{id:'pay_WRONG'},{customer:'cus_WRONG'},{externalReference:'other'},{value:550.92},{billingType:'CREDIT_CARD'}]){
 assert.equal(classifyVerifiedAsaasPayment({...remote,...different},link).decision,'review');
}
const cardLink={...link,billing_type:'CREDIT_CARD',amount:579.9};
assert.deepEqual(classifyVerifiedAsaasPayment({...remote,billingType:'CREDIT_CARD',value:579.90,status:'CONFIRMED'},cardLink),
 {decision:'paid',reason:'card_confirmed'});
assert.equal(classifyVerifiedAsaasPayment({...remote,billingType:'CREDIT_CARD',value:579.9,status:'AWAITING_RISK_ANALYSIS'},cardLink).decision,'pending');
assert.equal(classifyVerifiedAsaasPayment({...remote,billingType:'CREDIT_CARD',value:579.9,status:'CHARGEBACK_REQUESTED'},cardLink).decision,'review');
assert.equal(classifyVerifiedAsaasPayment({...remote,billingType:'CREDIT_CARD',value:579.9,status:'SOMETHING_NEW'},cardLink).decision,'review');
assert.equal(validateAsaasLink({...link,amount:0}),false);
assert.equal(validateAsaasLink({...link,billing_type:'BOLETO'}),false);
assert.deepEqual(classifyAsaasWebhookEvent({id:'evt_123456',event:'PAYMENT_RECEIVED',payment:{id:link.payment_id}}),
 {eventId:'evt_123456',type:'PAYMENT_RECEIVED',paymentId:link.payment_id});
assert.equal(classifyAsaasWebhookEvent({id:'evt_123456',event:'__',payment:{id:link.payment_id}}),null);
assert.equal(classifyAsaasWebhookEvent({id:'evt_123456',event:'PAYMENT_RECEIVED',payment:{}}).paymentId,null);
console.log('ASAAS: confirmar identidade, valor e método; PIX cautelar não envia; cartão confirmado; riscos geram revisão — PASS');
