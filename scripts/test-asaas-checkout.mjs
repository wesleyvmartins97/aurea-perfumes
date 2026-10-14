import assert from 'node:assert/strict';
import fs from 'node:fs';
import {estimateAsaasFees,VALENZA_ASAAS_PAYMENT_METHODS,buildValenzaTransparentPaymentPlan} from '../src/payments/asaas-checkout.mjs';

const checks={3:[20.73,19.01,540.16],6:[20.73,33.27,525.90],12:[23.63,61.47,494.80]};
for(const [n,values] of Object.entries(checks)){
 const x=estimateAsaasFees(579.90,Number(n));
 assert.deepEqual([x.processingFee,x.estimatedAdvanceFee,x.estimatedNet],values);
 assert.equal(x.notAnOffer,true);
}
assert.deepEqual([...VALENZA_ASAAS_PAYMENT_METHODS],['pix','credit_card']);
const pix=buildValenzaTransparentPaymentPlan({
 reference:'VALENZA-ORDER-EXAMPLE',method:'pix',total:550.91
});
assert.equal(pix.billingType,'PIX');
assert.equal(pix.checkoutType,'transparent');
assert.equal(pix.redirectToProvider,false);
assert.equal(pix.readyToCharge,false);
const card=buildValenzaTransparentPaymentPlan({
 reference:'VALENZA-ORDER-EXAMPLE',method:'credit_card',total:579.90,installments:6,
 creditCardToken:'placeholder-PCI-reviewed-token-12345'
});
assert.equal(card.billingType,'CREDIT_CARD');
assert.equal(card.installments,6);
assert.equal(card.cardTokenRequired,true);
assert.equal(card.redirectToProvider,false);
assert.equal(card.readyToCharge,false);
assert.ok(!JSON.stringify(card).includes('placeholder-PCI-reviewed-token'));
assert.throws(()=>buildValenzaTransparentPaymentPlan({
 reference:'VALENZA-ORDER-EXAMPLE',method:'debit',total:579.90
}),TypeError);
assert.throws(()=>buildValenzaTransparentPaymentPlan({
 reference:'VALENZA-ORDER-EXAMPLE',method:'credit_card',total:579.90,installments:6
}),TypeError);
assert.throws(()=>buildValenzaTransparentPaymentPlan({
 reference:'VALENZA-ORDER-EXAMPLE',method:'pix',total:579.90,installments:6
}),TypeError);
const worker=fs.readFileSync('src/worker.js','utf8');
const page=fs.readFileSync('public/index.html','utf8');
const planCode=fs.readFileSync('src/payments/asaas-checkout.mjs','utf8');
assert.match(worker,/function webhookMercadoPago\(/);
assert.match(page,/function openCheckout\(/);
assert.doesNotMatch(planCode,/checkoutSession\/show/);
assert.doesNotMatch(planCode,/asaasHostedCheckoutUrl/);
assert.match(worker,/if\(url\.pathname==="\/api\/admin\/asaas\/status"&&request\.method==="GET"\)return adminAsaasStatus\(request,env\)/);
assert.match(worker,/const admin=await currentAdmin\(request,env\);/);
assert.match(worker,/await api\.checkCredentials\(\)/);
assert.match(worker,/if\(url\.pathname==="\/api\/pagamento"&&request\.method==="POST"\)return criarPagamentoPix\(request,env\)/);
assert.match(worker,/if\(url\.pathname==="\/api\/pagamento\/cartao"&&request\.method==="POST"\)return criarPagamentoCartao\(request,env\)/);
assert.doesNotMatch(page,/\bASAAS_API_KEY\b/);
assert.doesNotMatch(page,/api\.asaas\.com/);
console.log('ASAAS transparente: PIX, crédito tokenizado, 3/6/12x, segurança e ausência de redirecionamento — PASS');
