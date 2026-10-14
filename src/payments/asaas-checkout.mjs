// Preparação da integração Asaas. Módulo inativo: não emite cobranças,
// não consome credenciais nem altera pedidos até passar pela homologação.
const round2 = value => Math.round((value + Number.EPSILON) * 100) / 100;
export const ASAAS_SANDBOX = 'https://api-sandbox.asaas.com/v3';
export const ASAAS_PRODUCTION = 'https://api.asaas.com/v3';

export function estimateAsaasFees(total, installments, monthlyAdvanceRate=0.017) {
  if (!Number.isFinite(total) || total<=0) throw new RangeError('Valor inválido');
  if (!Number.isInteger(installments) || installments<1 || installments>12) throw new RangeError('Parcelas inválidas');
  if (!Number.isFinite(monthlyAdvanceRate) || monthlyAdvanceRate<0 || monthlyAdvanceRate>0.1) throw new RangeError('Taxa inválida');
  const processingRate=installments===1?0.0299:installments<=6?0.0349:0.0399;
  const processingFee=round2(total*processingRate+0.49);
  const afterProcessing=round2(total-processingFee);
  // Estimativa linear, não o valor de liquidação: Asaas calcula por dias
  // antecipados de cada parcela e pode aplicar ajustes ou rejeitar a operação.
  const estimatedAdvanceFee=round2(afterProcessing*monthlyAdvanceRate*(installments+1)/2);
  return {
    customerPays:round2(total),installments,processingFee,
    estimatedAdvanceFee,totalFees:round2(processingFee+estimatedAdvanceFee),
    estimatedNet:round2(afterProcessing-estimatedAdvanceFee),
    notAnOffer:true
  };
}
export function buildAsaasCheckoutPayload({reference,items,maxInstallments=6,origin,expiresMinutes=60}) {
  if(typeof reference!=='string'||!/^[-A-Za-z0-9_]{6,160}$/.test(reference))throw new TypeError('Referência inválida');
  if(!Array.isArray(items)||!items.length||items.length>30)throw new TypeError('Itens inválidos');
  if(!Number.isInteger(maxInstallments)||maxInstallments<1||maxInstallments>12)throw new RangeError('Parcelas inválidas');
  if(!Number.isInteger(expiresMinutes)||expiresMinutes<10||expiresMinutes>1440)throw new RangeError('Expiração inválida');
  const url=new URL(origin);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new TypeError('Origem inválida');
  const safeItems=items.map(item=>{
    if(!item||typeof item.name!=='string'||!item.name.trim()||item.name.length>180)throw new TypeError('Nome inválido');
    if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10)throw new TypeError('Quantidade inválida');
    if(!Number.isFinite(item.value)||item.value<=0||item.value>100000)throw new TypeError('Preço inválido');
    return {name:item.name.trim(),quantity:item.quantity,value:round2(item.value)};
  });
  return {
    billingTypes:['CREDIT_CARD'],chargeTypes:['DETACHED','INSTALLMENT'],
    installment:{maxInstallmentCount:maxInstallments},
    minutesToExpire:expiresMinutes,externalReference:reference,
    items:safeItems,callback:{
      successUrl:new URL('/pagamento/retorno/?status=concluido',url).href,
      cancelUrl:new URL('/checkout/?status=cancelado',url).href,
      expiredUrl:new URL('/checkout/?status=expirado',url).href
    }
  };
}
export function asaasHostedCheckoutUrl(checkoutId) {
  if(typeof checkoutId!=='string'||!/^[-a-zA-Z0-9]{10,90}$/.test(checkoutId))throw new TypeError('Checkout inválido');
  return 'https://asaas.com/checkoutSession/show?id='+encodeURIComponent(checkoutId);
}
export function classifyAsaasCheckoutEvent(eventName) {
  if(eventName==='CHECKOUT_PAID')return 'verify_payment_server_side';
  if(eventName==='CHECKOUT_CANCELED')return 'canceled';
  if(eventName==='CHECKOUT_EXPIRED')return 'expired';
  return 'ignore';
}
// IMPORTANTE: callbacks de navegador e criação de checkout nunca aprovam
// pedidos. Somente webhook autenticado, verificação no Asaas e idempotência.
