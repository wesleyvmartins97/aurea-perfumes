import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  estimateAsaasFees,buildAsaasCheckoutPayload,asaasHostedCheckoutUrl,
  classifyAsaasCheckoutEvent
} from '../src/payments/asaas-checkout.mjs';

const checks={
  3:[20.73,19.01,540.16],
  6:[20.73,33.27,525.90],
  12:[23.63,61.47,494.80]
};
for(const [installment,expected] of Object.entries(checks)){
  const rate=estimateAsaasFees(579.90,Number(installment));
  assert.deepEqual([rate.processingFee,rate.estimatedAdvanceFee,rate.estimatedNet],expected);
  assert.equal(rate.notAnOffer,true);
}
const payload=buildAsaasCheckoutPayload({
  reference:'VALENZA-ORDER-EXAMPLE',
  items:[{name:'Club de Nuit Elite',quantity:1,value:579.90}],
  maxInstallments:6,origin:'https://www.valenzaparfums.com.br/'
});
assert.deepEqual(payload.billingTypes,['CREDIT_CARD']);
assert.deepEqual(payload.chargeTypes,['DETACHED','INSTALLMENT']);
assert.equal(payload.installment.maxInstallmentCount,6);
assert.equal(payload.items[0].value,579.9);
assert.ok(payload.callback.successUrl.startsWith('https://www.valenzaparfums.com.br/'));
assert.match(asaasHostedCheckoutUrl('c7b1c696-b27b-4d3d-80b9-d1c018e387f8'),/^https:\/\/asaas.com\/checkoutSession\/show\?id=/);
assert.equal(classifyAsaasCheckoutEvent('CHECKOUT_PAID'),'verify_payment_server_side');
assert.equal(classifyAsaasCheckoutEvent('CHECKOUT_CREATED'),'ignore');
assert.equal(classifyAsaasCheckoutEvent('CHECKOUT_CANCELED'),'canceled');
assert.throws(()=>buildAsaasCheckoutPayload({reference:'test-123',items:[],origin:'https://www.valenzaparfums.com.br/'}));
assert.throws(()=>buildAsaasCheckoutPayload({reference:'test-123',items:[{name:'x',quantity:1,value:1}],origin:'http://www.valenzaparfums.com.br/'}));
assert.throws(()=>asaasHostedCheckoutUrl('javascript:alert(1)'));
const worker=fs.readFileSync('src/worker.js','utf8');
const home=fs.readFileSync('public/index.html','utf8');
assert.match(worker,/function webhookMercadoPago\(/);
assert.match(home,/function openCheckout\(/);
assert.ok(!worker.includes('ASAAS_ACCESS_TOKEN') && !worker.includes('ASAAS_API_KEY'), 'Não ativar Asaas no worker antes da homologação');
console.log('ASAAS: simulador, payload, URLs, callbacks e garantia de gateway atual isolado aprovados');
