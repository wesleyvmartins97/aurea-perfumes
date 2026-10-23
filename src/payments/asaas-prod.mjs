import {asaasCardProductionEnabled,buildAsaasTokenizedCardPayment} from './asaas-card-contract.mjs';
// Asaas production payment adapter. Server-only. Never expose or log API keys.
// The checkout is NOT active until explicit server feature flag is enabled.
const paymentId=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{6,128}$/.test(x);
const money=x=>Number.isFinite(Number(x))&&Number(x)>0&&Math.abs(Number(x)*100-Math.round(Number(x)*100))<1e-6;
export const asaasPixEnabled=env=>String(env?.ASAAS_PIX_ENABLED||'').toLowerCase()==='true';
export const asaasReady=env=>!!env?.ASAAS_API_KEY&&!!env?.ASAAS_WEBHOOK_TOKEN&&String(env.ASAAS_WEBHOOK_TOKEN).length>=32;

export async function ensureAsaasTables(env){
 await env.DB.batch([
  env.DB.prepare("CREATE TABLE IF NOT EXISTS asaas_payment_links (payment_id TEXT PRIMARY KEY,order_id TEXT NOT NULL UNIQUE,reference TEXT NOT NULL UNIQUE,customer_id TEXT NOT NULL,asaas_customer_id TEXT NOT NULL,billing_type TEXT NOT NULL,amount REAL NOT NULL,status TEXT NOT NULL DEFAULT 'PENDING',created_at TEXT NOT NULL,updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_asaas_payment_status ON asaas_payment_links(status,updated_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS asaas_webhook_events (id TEXT PRIMARY KEY,event_type TEXT NOT NULL,payment_id TEXT,external_reference TEXT,state TEXT NOT NULL,received_at TEXT NOT NULL,updated_at TEXT NOT NULL)")
 ]);
}
export function createAsaasGateway(env,fetcher=fetch){
 if(!env?.ASAAS_API_KEY||typeof env.ASAAS_API_KEY!=='string'||env.ASAAS_API_KEY.length<15)throw Error('Gateway Asaas não configurado.');
 const base='https://api.asaas.com/v3';
 async function request(method,path,payload){
  // Calls are owned by this adapter. Do not allow user-controlled URLs.
  const controller=new AbortController(),abort=setTimeout(()=>controller.abort(),method==='POST'?75000:20000);
  try{
   const response=await fetcher(base+path,{
    method,headers:{'access_token':env.ASAAS_API_KEY,'Accept':'application/json','Content-Type':'application/json','User-Agent':'ValenzaParfums/1.0'},
    ...(payload?{body:JSON.stringify(payload)}:{}),signal:controller.signal
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok){const err=new Error('Asaas recusou a solicitação.');err.status=response.status;err.uncertain=response.status>=500;throw err}
   if(!data||typeof data!=='object')throw Error('Resposta inválida do Asaas.');
   return data;
  }catch(e){
   if(typeof e.status==='number')throw e;
   const err=new Error('Não foi possível confirmar a operação no Asaas.');err.uncertain=method!=='GET';throw err;
  }finally{clearTimeout(abort)}
 }
 return Object.freeze({
  async findCustomer(reference){
   if(!paymentId(reference))throw TypeError('Referência inválida.');
   const x=await request('GET','/customers?externalReference='+encodeURIComponent(reference)+'&limit=10');
   return (Array.isArray(x.data)?x.data:[]).find(c=>c.externalReference===reference&&paymentId(c.id))?.id||null;
  },
  async createCustomer({name,cpf,email,phone,reference}){
   if(!paymentId(reference)||typeof name!=='string'||name.trim().length<3||!/^[0-9]{11}$/.test(cpf)||!/\S+@\S+\.\S+/.test(email))throw TypeError('Cliente inválido.');
   const x=await request('POST','/customers',{
    name:name.trim(),cpfCnpj:cpf,email:email.trim().toLowerCase(),externalReference:reference,
    notificationDisabled:true,...(/^[0-9]{10,11}$/.test(String(phone||''))?{mobilePhone:phone}:{})
   });
   if(!paymentId(x.id))throw Error('Cliente não foi confirmado pelo Asaas.');
   return x.id;
  },
  async newPix({customer,total,reference,dueDate}){
   if(!paymentId(customer)||!paymentId(reference)||!money(total)||!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))throw TypeError('PIX inválido.');
   return request('POST','/payments',{customer,billingType:'PIX',value:Number(total.toFixed(2)),dueDate,externalReference:reference,description:'Compra VALENZA PARFUMS'});
  },
  // Exige duas autorizações explícitas; NÃO existe rota pública para este método.
  // Sem captura PCI-compliant e tokenização habilitada pelo Asaas, não chamar.
  async newTokenizedCard(input){
   if(!asaasCardProductionEnabled(env))throw new Error('Cartão Asaas não habilitado para esta operação.');
   const payload=buildAsaasTokenizedCardPayment(input);
   return request('POST','/payments',payload);
  },
  // Consulta somente leitura para conciliar uma tentativa de cartão cujo POST
  // possa ter sido aprovado antes de uma falha de rede. Não recria cobranças.
  async findCardByReference(reference){
   if(!paymentId(reference))throw TypeError('Referência inválida.');
   const x=await request('GET','/payments?externalReference='+encodeURIComponent(reference)+'&billingType=CREDIT_CARD&limit=20');
   return (Array.isArray(x.data)?x.data:[]).find(p=>p.externalReference===reference&&p.billingType==='CREDIT_CARD'&&paymentId(p.id))||null;
  },
  async findPixByReference(reference){
   if(!paymentId(reference))throw TypeError('Referência inválida.');
   const x=await request('GET','/payments?externalReference='+encodeURIComponent(reference)+'&billingType=PIX&limit=20');
   return (Array.isArray(x.data)?x.data:[]).find(p=>p.externalReference===reference&&p.billingType==='PIX'&&paymentId(p.id))||null;
  },
  async getPix(id){
   if(!paymentId(id))throw TypeError('Identificador inválido.');
   const x=await request('GET','/payments/'+encodeURIComponent(id)+'/pixQrCode');
   if(typeof x.payload!=='string'||x.payload.length<20||x.payload.length>3500)throw Error('PIX não disponível.');
   return {qrCode:x.payload,qrCodeBase64:typeof x.encodedImage==='string'?x.encodedImage:'',expirationDate:x.expirationDate||null};
  },
  async getPayment(id){
   if(!paymentId(id))throw TypeError('Identificador inválido.');
   return request('GET','/payments/'+encodeURIComponent(id));
  },
  async cancelPayment(id){
   if(!paymentId(id))throw TypeError('Identificador inválido.');
   return request('DELETE','/payments/'+encodeURIComponent(id));
  }
 });
}
export function classifyAsaasPix(p,link){
 if(!p||!link||!paymentId(p.id)||p.id!==link.payment_id||p.externalReference!==link.reference||p.customer!==link.asaas_customer_id||p.billingType!=='PIX'||Math.round(Number(p.value)*100)!==Math.round(Number(link.amount)*100))
  return {status:'review',reason:'identity_mismatch'};
 const state=String(p.status||'').toUpperCase();
 if(state==='RECEIVED')return {status:'paid',reason:'received'};
 // In CPF accounts CONFIRMED may be precautionarily blocked for up to 72h.
 if(state==='CONFIRMED')return {status:'pending',reason:'precautionary_hold'};
 if(['PENDING','OVERDUE','AWAITING_RISK_ANALYSIS','AUTHORIZED'].includes(state))return {status:'pending',reason:'pending'};
 if(['DELETED','CANCELED','CANCELLED'].includes(state))return {status:'cancelled',reason:'cancelled'};
 if(['REFUNDED','PARTIALLY_REFUNDED','CHARGEBACK_REQUESTED','CHARGEBACK_DISPUTE','REFUND_REQUESTED'].includes(state))return {status:'reversed',reason:'reversal'};
 return {status:'review',reason:'unrecognized_status'};
}
export async function readAsaasLink(env,id){
 if(!paymentId(id))return null;
 await ensureAsaasTables(env);
 return env.DB.prepare('SELECT * FROM asaas_payment_links WHERE order_id=?').bind(id).first();
}
export async function storeAsaasLink(env,link){
 await ensureAsaasTables(env);
 const now=new Date().toISOString();
 if(!paymentId(link.payment_id)||!paymentId(link.order_id)||!paymentId(link.reference)||!paymentId(link.customer_id)||!paymentId(link.asaas_customer_id)||!['PIX','CREDIT_CARD'].includes(link.billing_type)||!money(link.amount))throw TypeError('Vínculo inválido.');
 await env.DB.prepare("INSERT OR IGNORE INTO asaas_payment_links(payment_id,order_id,reference,customer_id,asaas_customer_id,billing_type,amount,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
  .bind(link.payment_id,link.order_id,link.reference,link.customer_id,link.asaas_customer_id,link.billing_type,link.amount,'PENDING',now,now).run();
 const saved=await readAsaasLink(env,link.order_id);
 if(!saved||saved.payment_id!==link.payment_id||saved.customer_id!==link.customer_id||saved.reference!==link.reference||saved.billing_type!==link.billing_type||Math.round(saved.amount*100)!==Math.round(link.amount*100))throw Error('Vínculo de cobrança já existente com dados divergentes.');
 return saved;
}
export async function handleAsaasWebhook(req,env,ctx,onPayment){
 if(!asaasReady(env))return new Response(JSON.stringify({ok:false}),{status:503,headers:{'Content-Type':'application/json'}});
 const provided=String(req.headers.get('asaas-access-token')||'');
 const expected=String(env.ASAAS_WEBHOOK_TOKEN);
 if(provided.length!==expected.length||provided.length>255)return new Response('Unauthorized',{status:401});
 const digest=async v=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
 const [a,b]=await Promise.all([digest(provided),digest(expected)]);
 let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
 if(diff)return new Response('Unauthorized',{status:401});
 if(!String(req.headers.get('content-type')||'').includes('application/json'))return new Response('Unsupported Media Type',{status:415});
 if(Number(req.headers.get('content-length')||0)>65536)return new Response('Payload too large',{status:413});
 let event;try{const raw=await req.text();if(raw.length>65536)return new Response('Payload too large',{status:413});event=JSON.parse(raw)}catch{return new Response('Invalid JSON',{status:400})}
 const id=event?.id,type=event?.event,pid=event?.payment?.id;
 // Real Asaas IDs may contain "&" followed by digits. Treat an event ID
 // as an opaque idempotency key, not as an API payment ID.
 const validEventId=typeof id==='string'&&id.length>=8&&id.length<=255;
 if(!validEventId||typeof type!=='string'||!/^[A-Z][A-Z0-9_]{2,99}$/.test(type))return new Response('Invalid event',{status:400});
 // Manual Asaas charges have externalReference:null; acknowledge and store
 // them without trying to create a VALENZA order or shipping.
 const externalReference=event?.payment?.externalReference;
 const isValenzaPayment=paymentId(pid)&&typeof externalReference==='string'&&externalReference.startsWith('AUREA-')&&paymentId(externalReference);
 const shouldQueue=isValenzaPayment&&type.startsWith('PAYMENT_');
 const now=new Date().toISOString();
 try{
  await ensureAsaasTables(env);
  await env.DB.prepare('INSERT OR IGNORE INTO asaas_webhook_events(id,event_type,payment_id,external_reference,state,received_at,updated_at) VALUES(?,?,?,?,?,?,?)')
   .bind(id,type,paymentId(pid)?pid:null,paymentId(externalReference)?externalReference:null,shouldQueue?'queued':'ignored',now,now).run();
 }catch{return new Response('Write unavailable',{status:503})}
 // Asaas retries on 5xx. Once persisted, process out-of-band and retry from cron.
 if(shouldQueue&&ctx?.waitUntil)ctx.waitUntil(Promise.resolve().then(()=>onPayment(pid)).catch(()=>{}));
 return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
