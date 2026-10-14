/**
 * Asaas v3: server-only adapter for Cloudflare Workers.
 *
 * NOT wired into active payments. All methods must be called from authenticated,
 * rate-limited server routes after confirming customer, order, stock and total
 * against D1. Never expose token to public/index.html.
 *
 * Security: request bodies, card data, API tokens and gateway response details
 * must never be logged. Do not auto-retry POST /payments on timeout.
 */
export const ASAAS_API_HOSTS=Object.freeze({
 sandbox:'https://api-sandbox.asaas.com/v3',
 production:'https://api.asaas.com/v3'
});
const validId=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{6,100}$/.test(x);
const dateOK=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'));
const currency=x=>Number.isFinite(x)&&x>0&&x<=100000&&Math.abs(Math.round(x*100)-x*100)<0.00001;
export function validAsaasReference(ref){return validId(ref)}
export class AsaasRequestError extends Error{
 constructor(message,status=0,uncertain=false){super(message);this.name='AsaasRequestError';this.status=status;this.uncertain=uncertain}
}
export function asaasClient({apiKey,mode='sandbox',fetchImpl=fetch,timeoutMs=20000}={}){
 if(!ASAAS_API_HOSTS[mode])throw new TypeError('Ambiente Asaas inválido');
 if(typeof apiKey!=='string'||apiKey.length<15)throw new TypeError('Credencial Asaas ausente');
 if(!Number.isInteger(timeoutMs)||timeoutMs<3000||timeoutMs>90000)throw new TypeError('Timeout inválido');
 async function call(method,path,body){
  // Caller controls the path only through fixed methods below.
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),method==='POST'?Math.max(timeoutMs,65000):timeoutMs);
  try{
   const response=await fetchImpl(ASAAS_API_HOSTS[mode]+path,{
    method,headers:{access_token:apiKey,accept:'application/json','content-type':'application/json','User-Agent':'ValenzaParfums/1.0'},
    ...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal
   });
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw new AsaasRequestError('O serviço de pagamento não concluiu a solicitação.',response.status,false);
   if(!data||typeof data!=='object')throw new AsaasRequestError('Resposta inesperada do provedor.',502,method==='POST');
   return data;
  }catch(error){
   if(error instanceof AsaasRequestError)throw error;
   throw new AsaasRequestError('Não foi possível confirmar a operação com o provedor.',0,method==='POST');
  }finally{clearTimeout(timeout)}
 }
 return Object.freeze({
  async createCustomer({name,cpfCnpj,email,mobilePhone,reference}){
   if(typeof name!=='string'||name.trim().length<3||name.length>150)throw new TypeError('Nome inválido');
   if(typeof cpfCnpj!=='string'||!/^\d{11}(?:\d{3})?$/.test(cpfCnpj))throw new TypeError('CPF/CNPJ inválido');
   if(typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||email.length>250)throw new TypeError('E-mail inválido');
   if(!validId(reference))throw new TypeError('Referência de cliente inválida');
   const data=await call('POST','/customers',{
    name:name.trim(),cpfCnpj,email:email.trim().toLowerCase(),
    ...(typeof mobilePhone==='string'&&/^\d{10,11}$/.test(mobilePhone)?{mobilePhone}:{}),
    externalReference:reference,notificationDisabled:true
   });
   if(!validId(data.id))throw new AsaasRequestError('Cadastro pendente de conciliação.',502,true);
   return {id:data.id};
  },
  async listCustomersByReference(reference){
   if(!validId(reference))throw new TypeError('Referência inválida');
   const data=await call('GET','/customers?externalReference='+encodeURIComponent(reference));
   return Array.isArray(data.data)?data.data.filter(x=>validId(x.id)).map(x=>({id:x.id,externalReference:x.externalReference})).slice(0,5):[];
  },
  async createPixCharge({customerId,total,dueDate,reference}){
   if(!validId(customerId)||!validId(reference)||!currency(total)||!dateOK(dueDate))throw new TypeError('Dados de cobrança Pix inválidos');
   const data=await call('POST','/payments',{
    customer:customerId,billingType:'PIX',value:Math.round(total*100)/100,
    dueDate,externalReference:reference,description:'Compra VALENZA PARFUMS',
   });
   if(!validId(data.id))throw new AsaasRequestError('Cobrança pendente de conciliação.',502,true);
   return {id:data.id,status:String(data.status||'PENDING'),externalReference:data.externalReference||null};
  },
  /**
   * Cartão de crédito SOMENTE por token aprovado pelo Asaas e vinculado
   * ao cliente. O token vem de um capturador certificado, nunca de campos
   * caseiros; NÃO habilitar até a validação PCI e habilitação do Asaas.
   * Credenciais e token somente no servidor, descartados após o envio.
   */
  async createTokenizedCreditCharge({customerId,total,dueDate,reference,installments=1,creditCardToken,remoteIp}){
   if(!validId(customerId)||!validId(reference)||!currency(total)||!dateOK(dueDate))throw new TypeError('Dados da cobrança inválidos');
   if(!Number.isInteger(installments)||installments<1||installments>12)throw new TypeError('Número de parcelas inválido');
   if(typeof creditCardToken!=='string'||!/^[-a-zA-Z0-9_]{20,150}$/.test(creditCardToken))throw new TypeError('Token do cartão inválido');
   if(typeof remoteIp!=='string'||remoteIp.length<7||remoteIp.length>45||!(/^[0-9.]+$/.test(remoteIp)||/^[a-fA-F0-9:]+$/.test(remoteIp)))throw new TypeError('IP do pagador inválido');
   // Capture from Cloudflare trusted request metadata, not a browser field.
   const data=await call('POST','/payments',{
    customer:customerId,billingType:'CREDIT_CARD',dueDate,
    externalReference:reference,description:'Compra VALENZA PARFUMS',
    ...(installments===1?{value:Math.round(total*100)/100}:{installmentCount:installments,totalValue:Math.round(total*100)/100}),
    creditCardToken,remoteIp
   });
   if(!validId(data.id))throw new AsaasRequestError('Cobrança pendente de conciliação.',502,true);
   return {id:data.id,status:String(data.status||'PENDING'),externalReference:data.externalReference||null};
  },
  async getPixQrCode(paymentId){
   if(!validId(paymentId))throw new TypeError('Cobrança inválida');
   const data=await call('GET','/payments/'+encodeURIComponent(paymentId)+'/pixQrCode');
   if(typeof data.payload!=='string'||data.payload.length<20||data.payload.length>3000)throw new AsaasRequestError('PIX temporariamente indisponível.',502);
   return {payload:data.payload,encodedImage:typeof data.encodedImage==='string'?data.encodedImage:null,expirationDate:data.expirationDate||null};
  },
  async getPayment(paymentId){
   if(!validId(paymentId))throw new TypeError('Cobrança inválida');
   const data=await call('GET','/payments/'+encodeURIComponent(paymentId));
   return {id:data.id,status:String(data.status||''),billingType:String(data.billingType||''),value:Number(data.value),
    externalReference:String(data.externalReference||''),customer:String(data.customer||''),installmentCount:Number(data.installmentCount||1)};
  },
  // No raw credit-card methods are exported; only PCI-reviewed tokens.
 });
}
/**
 * Authentication is necessary but not sufficient: the event's payment must be
 * read back from Asaas and matched to a local pending order, amount and customer.
 */
export async function authenticateAsaasWebhook(provided,secret,cryptoImpl=crypto){
 if(typeof provided!=='string'||typeof secret!=='string'||secret.length<32||provided.length!==secret.length||provided.length>255)return false;
 const subtle=cryptoImpl.subtle,enc=new TextEncoder();
 const [a,b]=await Promise.all([subtle.digest('SHA-256',enc.encode(provided)),subtle.digest('SHA-256',enc.encode(secret))]);
 const x=new Uint8Array(a),y=new Uint8Array(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;
}
export function classifyAsaasPaymentEvent(event){
 if(!event||!validId(event.id)||typeof event.event!=='string'||!validId(event.payment?.id))return {type:'invalid'};
 if(['PAYMENT_CONFIRMED','PAYMENT_RECEIVED'].includes(event.event))return {type:'verify_remote',eventId:event.id,paymentId:event.payment.id};
 if(['PAYMENT_REFUNDED','PAYMENT_PARTIALLY_REFUNDED','PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE'].includes(event.event))return {type:'review_reversal',eventId:event.id,paymentId:event.payment.id};
 if(['PAYMENT_CREDIT_CARD_CAPTURE_REFUSED','PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_DELETED'].includes(event.event))return {type:'review_failure',eventId:event.id,paymentId:event.payment.id};
 return {type:'ignore',eventId:event.id,paymentId:event.payment.id};
}
export function paymentMatchesOrder(remote,{paymentId,reference,customerId,total,billingType}){
 if(!remote||!validId(paymentId)||!validId(reference)||!validId(customerId)||!currency(total))return false;
 if(remote.id!==paymentId||remote.externalReference!==reference||remote.customer!==customerId)return false;
 if(!['CONFIRMED','RECEIVED'].includes(remote.status))return false;
 if(!['PIX','CREDIT_CARD'].includes(remote.billingType)||remote.billingType!==billingType)return false;
 return Number.isFinite(remote.value)&&Math.abs(Math.round(remote.value*100)-Math.round(total*100))===0;
}
