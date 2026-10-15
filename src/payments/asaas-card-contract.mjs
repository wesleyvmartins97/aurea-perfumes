// Contrato de cartão Asaas da VALENZA — preparatório e DESABILITADO.
// Não há checkout/cartão Asaas acessível por clientes neste módulo.
// Somente aceitar tokens de cartão obtidos por uma captura PCI-compliant,
// jamais tokens do Mercado Pago, PAN/CVV ou payloads de cartão cru.
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{6,160}$/.test(x);
const centavos=x=>Number.isFinite(x)?Math.round(x*100):NaN;
const allowedCardStatuses=Object.freeze({
 CONFIRMED:'paid',
 RECEIVED:'paid',
 PENDING:'pending',
 OVERDUE:'pending',
 AWAITING_RISK_ANALYSIS:'pending',
 APPROVED_BY_RISK_ANALYSIS:'pending',
 AUTHORIZED:'pending',
 REPROVED_BY_RISK_ANALYSIS:'declined',
 CREDIT_CARD_CAPTURE_REFUSED:'declined',
 DELETED:'cancelled',
 CANCELED:'cancelled',
 CANCELLED:'cancelled',
 REFUNDED:'reversed',
 PARTIALLY_REFUNDED:'reversed',
 REFUND_REQUESTED:'reversed',
 REFUND_IN_PROGRESS:'reversed',
 CHARGEBACK_REQUESTED:'reversed',
 CHARGEBACK_DISPUTE:'reversed',
 AWAITING_CHARGEBACK_REVERSAL:'reversed'
});
const forbiddenKeys=new Set(['creditcard','creditcardholderinfo','number','cardnumber','pan','ccv','cvv','securitycode','expiryyear','expirymonth','carddata']);
export function asaasCardProductionEnabled(env){
 // Flag alone NEVER enables capture in an application without PCI validation.
 return String(env?.ASAAS_CARD_ENABLED||'').toLowerCase()==='true'
   && String(env?.ASAAS_CARD_PCI_APPROVED||'').toLowerCase()==='true'
   && !!env?.ASAAS_API_KEY;
}
function rejectRawCard(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw new TypeError('Dados inválidos.');
 for(const [key,value] of Object.entries(data)){
  if(forbiddenKeys.has(key.toLowerCase()))throw new TypeError('Dados brutos de cartão não são aceitos.');
  if(value&&typeof value==='object')rejectRawCard(value);
 }
}
export function buildAsaasTokenizedCardPayment(input){
 rejectRawCard(input);
 const {customer,reference,total,installments,creditCardToken,remoteIp,dueDate}=input;
 if(!validId(customer)||!validId(reference))throw new TypeError('Referência ou cliente inválido.');
 if(typeof creditCardToken!=='string'||creditCardToken.length<20||creditCardToken.length>250
   ||!/^[A-Za-z0-9_-]+$/.test(creditCardToken))throw new TypeError('Token do cartão inválido.');
 // Real IP must come from a trusted Cloudflare header on the server, never user input.
 if(typeof remoteIp!=='string'||remoteIp.length>45||!(/^[0-9a-fA-F:.]+$/.test(remoteIp)))
  throw new TypeError('IP do comprador inválido.');
 if(!Number.isFinite(total)||total<=0||centavos(total)<=0||Math.abs(total*100-centavos(total))>1e-7)
  throw new TypeError('Valor inválido.');
 if(!Number.isInteger(installments)||installments<1||installments>12)
  throw new TypeError('Parcelamento inválido.');
 if(typeof dueDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))throw new TypeError('Vencimento inválido.');
 const p={customer,billingType:'CREDIT_CARD',dueDate,externalReference:reference,
  description:'Compra VALENZA PARFUMS',creditCardToken,remoteIp};
 if(installments===1)p.value=Number(total.toFixed(2));
 else{p.installmentCount=installments;p.totalValue=Number(total.toFixed(2))}
 return p;
}
export function classifyAsaasVerifiedCard(payment,link){
 if(!payment||!link||link.billing_type!=='CREDIT_CARD'
  ||!validId(payment.id)||payment.id!==link.payment_id
  ||payment.externalReference!==link.reference
  ||payment.customer!==link.asaas_customer_id
  ||payment.billingType!=='CREDIT_CARD')
  return {status:'review',reason:'payment_identity'};
 // GET /payments/{id} pode representar apenas UMA parcela.
 // Conferir um único payment.value não comprova o valor total de uma venda
 // parcelada; bloquear confirmação até conciliação integral do installment.
 if(payment.installment||payment.installmentNumber||Number(payment.installmentCount)>1)
  return {status:'review',reason:'installment_verification_required'};
 const amount=Number(payment.value??payment.totalValue);
 if(!Number.isFinite(amount)||centavos(amount)!==centavos(Number(link.amount)))
  return {status:'review',reason:'payment_amount'};
 // Never trust status from the event payload: this function receives a GET /payments/id response.
 const raw=String(payment.status||'').toUpperCase();
 const status=allowedCardStatuses[raw]||'review';
 return {status,reason:status==='review'?'unknown_status':raw.toLowerCase()};
}
export function isAsaasCardWebhookEvent(type){
 return typeof type==='string'&&/^PAYMENT_[A-Z0-9_]+$/.test(type);
}
