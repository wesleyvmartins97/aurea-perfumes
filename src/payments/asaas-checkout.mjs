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
// Contrato de checkout transparente: mantém cliente no endereço da VALENZA.
// NÃO captura PAN, validade ou CVV: o processamento por API exige segurança
// PCI DSS comprovada antes de aceitar cartões reais. Este módulo prepara
// somente o plano de pagamento; ainda não é uma rota de cobrança.
export const VALENZA_ASAAS_PAYMENT_METHODS=Object.freeze(['pix','credit_card']);
export function buildValenzaTransparentPaymentPlan({reference,method,total,installments=1,creditCardToken=null}={}){
 if(typeof reference!=='string'||!/^[-A-Za-z0-9_]{6,160}$/.test(reference))throw new TypeError('Referência inválida');
 if(!VALENZA_ASAAS_PAYMENT_METHODS.includes(method))throw new TypeError('Meio de pagamento não suportado');
 if(!Number.isFinite(total)||total<=0||total>100000||Math.abs(total*100-Math.round(total*100))>1e-6)throw new TypeError('Valor inválido');
 if(!Number.isInteger(installments)||installments<1||installments>12||(method==='pix'&&installments!==1))throw new TypeError('Parcelamento inválido');
 if(method==='credit_card'&&(typeof creditCardToken!=='string'||!/^[-A-Za-z0-9_]{20,150}$/.test(creditCardToken)))
  throw new TypeError('Token seguro de cartão necessário');
 if(method==='pix'&&creditCardToken!==null)throw new TypeError('PIX não aceita cartão');
 return Object.freeze({
  provider:'asaas',checkoutType:'transparent',redirectToProvider:false,
  billingType:method==='pix'?'PIX':'CREDIT_CARD',
  reference,total,installments,
  // Token só é aceito após habilitação da tokenização e revisão da captura;
  // nunca exibir em interface, logs ou D1.
  cardTokenRequired:method==='credit_card',
  readyToCharge:false
 });
}
// PIX: /payments -> /payments/:id/pixQrCode -> código e QR na Valenza.
// Crédito: apenas capturador seguro homologado -> token ligado ao cliente
// Asaas -> /payments; sem certificação/revisão PCI, opção desabilitada.
// Webhook autenticado e consulta da cobrança confirmam pedido/estoque/envio.
