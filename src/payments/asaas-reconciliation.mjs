// Decisões de conciliação do Asaas — funções puras, sem segredos ou rede.
// O webhook nunca aprova pedido com seu próprio payload: usar GET /payments/{id}.
const cents=x=>Number.isFinite(x)?Math.round(x*100):NaN;
const identifier=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{6,160}$/.test(x);
export const ASAAS_PENDING_STATUSES=Object.freeze(['PENDING','AWAITING_RISK_ANALYSIS','AUTHORIZED','OVERDUE']);
export const ASAAS_REVERSE_STATUSES=Object.freeze(['REFUNDED','REFUND_REQUESTED','CHARGEBACK_REQUESTED','CHARGEBACK_DISPUTE']);
export function classifyVerifiedAsaasPayment(remote,link){
 if(!remote||!link||!identifier(remote.id)||!identifier(link.payment_id))
  return {decision:'review',reason:'missing_ids'};
 if(remote.id!==link.payment_id||remote.externalReference!==link.reference
   ||remote.customer!==link.asaas_customer_id||remote.billingType!==link.billing_type
   ||!Number.isFinite(Number(remote.value))||!Number.isFinite(Number(link.amount))
   ||cents(Number(remote.value))!==cents(Number(link.amount)))
  return {decision:'review',reason:'identity_or_amount_mismatch'};
 if(!['PIX','CREDIT_CARD'].includes(remote.billingType))return {decision:'review',reason:'unsupported_method'};
 const status=String(remote.status||'').toUpperCase();
 // CPF: PIX CONFIRMED pode estar em bloqueio cautelar, sujeito a estorno.
 // Só entregar no RECEIVED; crédito CONFIRMED equivale a autorizado e capturado.
 if(remote.billingType==='PIX'&&status==='RECEIVED')return {decision:'paid',reason:'pix_received'};
 if(remote.billingType==='CREDIT_CARD'&&['RECEIVED','CONFIRMED'].includes(status))
  return {decision:'paid',reason:'card_confirmed'};
 if(remote.billingType==='PIX'&&status==='CONFIRMED')return {decision:'pending',reason:'pix_precautionary_hold'};
 if(ASAAS_REVERSE_STATUSES.includes(status))return {decision:'review',reason:'refunded_or_disputed'};
 if(['DELETED','CANCELED','CANCELLED','REPROVED_BY_RISK_ANALYSIS'].includes(status))
  return {decision:'cancelled',reason:'provider_cancelled'};
 if(ASAAS_PENDING_STATUSES.includes(status))return {decision:'pending',reason:'awaiting_payment'};
 return {decision:'review',reason:'unknown_status'};
}
export function classifyAsaasWebhookEvent(event){
 if(!event||!identifier(event.id)||typeof event.event!=='string'
   ||!/^[A-Z][A-Z0-9_]{2,99}$/.test(event.event))return null;
 const paymentId=event.payment?.id;
 return {eventId:event.id,type:event.event,
   paymentId:identifier(paymentId)?paymentId:null};
}
export function validateAsaasLink(link){
 if(!link||!identifier(link.payment_id)||!identifier(link.reference)
    ||!identifier(link.asaas_customer_id)||!identifier(link.order_id)
    ||!['PIX','CREDIT_CARD'].includes(link.billing_type)
    ||!Number.isFinite(Number(link.amount))||Number(link.amount)<=0)return false;
 return true;
}
