import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAsaasGateway} from '../src/payments/asaas-prod.mjs';
import {asaasCardProductionEnabled,buildAsaasTokenizedCardPayment,classifyAsaasVerifiedCard,isAsaasCardWebhookEvent} from '../src/payments/asaas-card-contract.mjs';

const base={customer:'cus_123456789',reference:'AUREA-1720000000-xyzabc12',
 total:579.9,installments:3,creditCardToken:'76496073-536f-4835-80db-c45d00f33695',
 remoteIp:'203.0.113.10',dueDate:'2026-10-16'};
assert.equal(asaasCardProductionEnabled({}),false);
assert.equal(asaasCardProductionEnabled({ASAAS_CARD_ENABLED:'true',ASAAS_API_KEY:'secret'}),false);
assert.equal(asaasCardProductionEnabled({ASAAS_CARD_PCI_APPROVED:'true',ASAAS_API_KEY:'secret'}),false);
assert.equal(asaasCardProductionEnabled({ASAAS_CARD_ENABLED:'true',ASAAS_CARD_PCI_APPROVED:'true',ASAAS_API_KEY:'secret'}),true);
const p=buildAsaasTokenizedCardPayment(base);
assert.equal(p.billingType,'CREDIT_CARD');
assert.equal(p.totalValue,579.9);
assert.equal(p.installmentCount,3);
assert.equal(p.customer,base.customer);
assert.equal(p.creditCardToken,base.creditCardToken);
assert.equal(p.remoteIp,base.remoteIp);
assert.ok(!('creditCard' in p||'creditCardHolderInfo' in p||'value' in p));
const one=buildAsaasTokenizedCardPayment({...base,installments:1});
assert.equal(one.value,579.9);
assert.ok(!('installmentCount' in one));
for(const item of [
 {...base,creditCard:{number:'4444444444444444',ccv:'123'}},
 {...base,cvv:'123'},
 {...base,holder:{cardNumber:'4444444444444444'}},
 {...base,remoteIp:'http://evil.test'},
 {...base,installments:0},
 {...base,installments:13},
 {...base,installments:2.5},
 {...base,total:-1},
 {...base,total:579.901},
 {...base,creditCardToken:'bogus'},
])assert.throws(()=>buildAsaasTokenizedCardPayment(item));

const link={payment_id:'pay_TEST_CARD_000001',reference:base.reference,
  asaas_customer_id:base.customer,billing_type:'CREDIT_CARD',amount:579.9};
const remote={id:link.payment_id,externalReference:link.reference,customer:base.customer,
 billingType:'CREDIT_CARD',value:579.9,status:'CONFIRMED'};
assert.deepEqual(classifyAsaasVerifiedCard(remote,link),{status:'paid',reason:'confirmed'});
assert.equal(classifyAsaasVerifiedCard({...remote,status:'RECEIVED'},link).status,'paid');
for(const status of ['PENDING','AUTHORIZED','AWAITING_RISK_ANALYSIS','APPROVED_BY_RISK_ANALYSIS']){
 assert.equal(classifyAsaasVerifiedCard({...remote,status},link).status,'pending',status);
}
for(const status of ['REPROVED_BY_RISK_ANALYSIS','CREDIT_CARD_CAPTURE_REFUSED']){
 assert.equal(classifyAsaasVerifiedCard({...remote,status},link).status,'declined',status);
}
for(const status of ['REFUNDED','PARTIALLY_REFUNDED','CHARGEBACK_REQUESTED','CHARGEBACK_DISPUTE']){
 assert.equal(classifyAsaasVerifiedCard({...remote,status},link).status,'reversed',status);
}
assert.equal(classifyAsaasVerifiedCard({...remote,status:'NEW_PROVIDER_STATUS'},link).status,'review');
for(const change of [{value:579.91},{customer:'cus_other'}, {id:'pay_OTHER'}, {externalReference:'AUREA-other'},{billingType:'PIX'}]){
 assert.equal(classifyAsaasVerifiedCard({...remote,...change},link).status,'review');
}
assert.equal(isAsaasCardWebhookEvent('PAYMENT_CONFIRMED'),true);
assert.equal(isAsaasCardWebhookEvent('CHECKOUT_PAID'),false);
const live=fs.readFileSync('src/worker.js','utf8'),web=fs.readFileSync('public/index.html','utf8');
assert.match(live,/if\(!mpConfig\(env\)\.accessToken\)return resposta\(\{ok:false,error:"Pagamento temporariamente indisponível."\},503\);/);
assert.match(web,/new MercadoPago\(/);
assert.ok(!live.includes('ASAAS_CARD_ENABLED: "true"'));
let calls=0,finalBody=null;
const mock=async (url,init)=>{
 calls++;assert.equal(url,'https://api.asaas.com/v3/payments');
 assert.equal(init.headers.access_token,'fake-card-api-token-0123456789');
 finalBody=JSON.parse(init.body);
 return Response.json({id:'pay_asaas_card_1234',customer:base.customer,billingType:'CREDIT_CARD',externalReference:base.reference,value:579.9,status:'CONFIRMED'});
};
const disabledGateway=createAsaasGateway({ASAAS_API_KEY:'fake-card-api-token-0123456789'},mock);
await assert.rejects(disabledGateway.newTokenizedCard(base),/não habilitado/);
assert.equal(calls,0,'Must not send payment while disabled');
const enabledGateway=createAsaasGateway({ASAAS_API_KEY:'fake-card-api-token-0123456789',
 ASAAS_CARD_ENABLED:'true',ASAAS_CARD_PCI_APPROVED:'true'},mock);
const created=await enabledGateway.newTokenizedCard(base);
assert.equal(created.status,'CONFIRMED');
assert.equal(finalBody.installmentCount,3);
assert.equal(finalBody.totalValue,579.9);
assert.ok(!('creditCard' in finalBody||'ccv' in finalBody));
assert.equal(calls,1);
await assert.rejects(enabledGateway.newTokenizedCard({...base,creditCard:{number:'4111111111111111',ccv:'123'}}),/não são aceitos/);
assert.equal(calls,1,'Reject raw PAN/CVV before contacting provider');

console.log('ASAAS CARD CONTRACT: PCI guard, 1x/3x/12x, no PAN/CVV, refund/risk, no checkout switch PASS');
