// VALENZA Asaas bridge; integrates existing D1 order snapshots, inventory and EnvioEcom.
// Must only be called after canonical cart, address, price, freight and stock validation.
import {createAsaasGateway,ensureAsaasTables,storeAsaasLink,readAsaasLink,classifyAsaasPix,handleAsaasWebhook,asaasReady} from './asaas-prod.mjs';
import {classifyAsaasVerifiedCard} from './asaas-card-contract.mjs';

export function createValenzaAsaasBridge(dep){
 const {ensureAuthSchema,guardedPaymentCreate,restorePaymentAttempt,closePaymentAttempt,
  recordOperationalEvent,recordPaymentStatusEvent,sendOrderOperationalEmail,
  criarEnvioEnvioEcom,notifyPaidOrder,releaseReservedStock,resposta}=dep;

 async function startPix(env,{u,items,shipping,chosen,carrier,freight,total,nome,email,cpf,telefone,referencia,releaseReservation}){
  if(!asaasReady(env)){await releaseReservation();return resposta({ok:false,error:'Pagamento PIX temporariamente indisponível.'},503)}
  let attemptCreated=false;
  try{
   const gw=createAsaasGateway(env),ref='VALENZA-CUSTOMER-'+u.id.replace(/[^A-Za-z0-9_-]/g,'');
   let customer=await gw.findCustomer(ref);
   if(!customer)customer=await gw.createCustomer({name:nome,cpf,email,phone:telefone,reference:ref});
   const snapshot={reference:referencia,provider:'asaas',customerId:u.id,items,shipping:{
    ...shipping,carrier,freight_cost:freight,delivery_time:Number(chosen?.delivery_time??chosen?.delivery_days??0)
   },name:nome,email,cpf,phone:telefone,total,method:'pix',installments:1};
   const dueDate=new Date(Date.now()+86400000).toISOString().slice(0,10);
   attemptCreated=true;
   const response=await guardedPaymentCreate(env,snapshot,'https://api.asaas.com/v3/payments',{
    method:'POST',headers:{access_token:env.ASAAS_API_KEY,'Content-Type':'application/json',Accept:'application/json','User-Agent':'ValenzaParfums/1.0'},
    body:JSON.stringify({customer,billingType:'PIX',value:Number(total.toFixed(2)),dueDate,externalReference:referencia,description:'Compra VALENZA PARFUMS'})
   });
   if(!response.ok){
    await releaseReservation();await closePaymentAttempt(env,referencia,'failed');
    return resposta({ok:false,error:'Não foi possível gerar seu PIX agora. Tente novamente mais tarde.'},502);
   }
   const created=await response.json();
   if(!/^pay_[A-Za-z0-9_-]{6,120}$/.test(String(created.id||''))||created.customer!==customer||created.externalReference!==referencia||Math.abs(Number(created.value)-total)>0.009){
    await closePaymentAttempt(env,referencia,'uncertain');
    return resposta({ok:false,paymentUncertain:true,error:'Pagamento em conferência; não gere outra cobrança agora.'},409);
   }
   await storeAsaasLink(env,{payment_id:created.id,order_id:created.id,reference:referencia,customer_id:u.id,asaas_customer_id:customer,billing_type:'PIX',amount:total});
   const attempt=await env.DB.prepare('SELECT * FROM payment_attempts WHERE reference=?').bind(referencia).first();
   const shadow={id:created.id,external_reference:referencia,total_amount:total,transactions:{payments:[{status:'created'}]}};
   if(!attempt||!await restorePaymentAttempt(env,attempt,shadow))throw Error('Aguardando conciliação');
   await recordOperationalEvent(env,{orderId:created.id,eventType:'order.created',category:'order',status:'created',source:'asaas-pix',message:'Pedido PIX criado.',uniqueKey:'order:'+created.id+':created'});
   await recordPaymentStatusEvent(env,{orderId:created.id,rawStatus:'pending',label:'Aguardando pagamento',method:'pix',source:'asaas-pix'});
   await sendOrderOperationalEmail(env,created.id,'order_received').catch(()=>{});
   const qr=await gw.getPix(created.id);
   return resposta({ok:true,orderId:created.id,paymentId:created.id,status:'pending',amount:total.toFixed(2),qrCode:qr.qrCode,qrCodeBase64:qr.qrCodeBase64,externalReference:referencia,savedToAccount:true});
  }catch(e){
   if(attemptCreated){await closePaymentAttempt(env,referencia,'uncertain').catch(()=>{});return resposta({ok:false,paymentUncertain:true,error:'Pagamento em conferência. Verifique Meus Pedidos antes de tentar novamente.'},409)}
   await releaseReservation();
   return resposta({ok:false,error:'Não foi possível preparar o PIX com o Asaas.'},503);
  }
 }
 async function ensureOrder(env,link){
  const existing=await env.DB.prepare('SELECT id FROM orders WHERE id=?').bind(link.order_id).first();
  if(existing)return true;
  const attempt=await env.DB.prepare('SELECT * FROM payment_attempts WHERE reference=?').bind(link.reference).first();
  if(!attempt||JSON.parse(attempt.snapshot_json||'{}').provider!=='asaas')return false;
  return restorePaymentAttempt(env,attempt,{id:link.payment_id,external_reference:link.reference,total_amount:Number(link.amount),transactions:{payments:[{status:'created'}]}});
 }
 async function reconcile(env,id){
  if(!/^pay_[A-Za-z0-9_-]{6,120}$/.test(String(id||'')))return false;
  await ensureAuthSchema(env);
  const link=await readAsaasLink(env,id);if(!link)return false;
  const remote=await createAsaasGateway(env).getPayment(id),decision=link.billing_type==='CREDIT_CARD'?classifyAsaasVerifiedCard(remote,link):classifyAsaasPix(remote,link);
  if(decision.status==='review'){
   await recordOperationalEvent(env,{orderId:id,eventType:'payment.asaas_mismatch',category:'payment',status:'failed',severity:'error',source:'asaas',message:'Divergência na cobrança. Revisão manual necessária.',uniqueKey:'asaas-mismatch:'+id+':'+decision.reason});
   return false;
  }
  if(!await ensureOrder(env,link))return false;
  const ord=await env.DB.prepare('SELECT id,customer_id,order_number,total,status FROM orders WHERE id=?').bind(id).first();
  if(!ord||ord.customer_id!==link.customer_id||ord.order_number!==link.reference||Math.round(Number(ord.total)*100)!==Math.round(Number(link.amount)*100))return false;
  const now=new Date().toISOString();
  await env.DB.prepare('UPDATE asaas_payment_links SET status=?,updated_at=? WHERE payment_id=?').bind(String(remote.status||''),now,id).run();
  if(decision.status==='paid'){
   const upd=await env.DB.prepare("UPDATE orders SET status='Pago',updated_at=? WHERE id=? AND status IN ('Aguardando pagamento','Processando')").bind(now,id).run();
   const first=Number(upd.meta?.changes||0)>0;
   if(!first&&ord.status!=='Pago'){
    await recordOperationalEvent(env,{orderId:id,eventType:'payment.paid_after_closed',category:'payment',status:'failed',severity:'error',source:'asaas',message:'PIX recebido após cancelamento: revisão e reembolso manual.',uniqueKey:'asaas-after-closed:'+id});
    return false;
   }
   await env.DB.batch([
    env.DB.prepare("UPDATE order_payments SET status=?,status_detail=?,updated_at=? WHERE order_id=?").bind(link.billing_type==='CREDIT_CARD'?'confirmed':'received',link.billing_type==='CREDIT_CARD'?'asaas_card_confirmed':'asaas_received',now,id),
    env.DB.prepare("UPDATE order_items SET stock_deducted=1 WHERE order_id=? AND stock_deducted=0").bind(id)
   ]);
   if(first){
    await recordPaymentStatusEvent(env,{orderId:id,rawStatus:String(remote.status||''),label:'Pago',method:link.billing_type==='CREDIT_CARD'?'credit':'pix',source:'asaas-webhook'});
    await sendOrderOperationalEmail(env,id,'payment_confirmed').catch(()=>{});
    await criarEnvioEnvioEcom(env,id).catch(()=>{});
    await notifyPaidOrder(env,id).catch(()=>{});
   }
   return true;
  }
  if(decision.status==='cancelled'){
   if(ord.status==='Pago')return false;
   await releaseReservedStock(env,id,now);
   await env.DB.batch([
    env.DB.prepare("UPDATE orders SET status='Cancelado',updated_at=? WHERE id=? AND status<>'Pago'").bind(now,id),
    env.DB.prepare("UPDATE order_payments SET status='cancelled',status_detail='asaas_deleted',updated_at=? WHERE order_id=?").bind(now,id)
   ]);
   return true;
  }
  if(decision.status==='reversed'){
   if(ord.status!=='Pago'&&ord.status!=='Reembolsado'){
    await releaseReservedStock(env,id,now);
    await env.DB.batch([
     env.DB.prepare("UPDATE orders SET status='Reembolsado',updated_at=? WHERE id=? AND status<>'Pago'").bind(now,id),
     env.DB.prepare("UPDATE order_payments SET status='refunded',status_detail='asaas_reversal',updated_at=? WHERE order_id=?").bind(now,id)
    ]);
    return true;
   }
   if(ord.status==='Pago'){
    await env.DB.prepare("UPDATE orders SET status='Reembolsado',updated_at=? WHERE id=?").bind(now,id).run();
    await env.DB.prepare("UPDATE order_payments SET status='refunded',status_detail='asaas_reversal',updated_at=? WHERE order_id=?").bind(now,id).run();
    await recordOperationalEvent(env,{orderId:id,eventType:'payment.asaas_reversal',category:'payment',status:'failed',severity:'error',source:'asaas',message:'Estorno ou disputa: verificar expedição.',uniqueKey:'asaas-reversed:'+id});
   }
   return true;
  }
  return true;
 }
 async function status(env,link){
  try{
   await reconcile(env,link.order_id);
   const ord=await env.DB.prepare('SELECT status,total FROM orders WHERE id=?').bind(link.order_id).first();
   const state=String(ord?.status||'');
   return resposta({ok:true,orderId:link.order_id,paymentId:link.payment_id,amount:Number(ord?.total||link.amount),
    status:state==='Pago'?'approved':state==='Cancelado'?'cancelled':state==='Reembolsado'?'refunded':'pending',shipping:null});
  }catch{return resposta({ok:false,error:'Não foi possível consultar seu pagamento agora.'},503)}
 }
 async function accountPix(env,ord,link){
  try{
   await reconcile(env,link.order_id);
   const current=await env.DB.prepare('SELECT status FROM orders WHERE id=?').bind(link.order_id).first();
   if(current?.status==='Pago')return resposta({ok:true,paid:true,status:'approved'});
   if(['Cancelado','Reembolsado'].includes(current?.status))return resposta({ok:false,error:'Este PIX não está mais disponível.'},409);
   const qr=await createAsaasGateway(env).getPix(link.payment_id);
   return resposta({ok:true,orderId:link.order_id,paymentId:link.payment_id,status:'pending',amount:Number(ord.total).toFixed(2),qrCode:qr.qrCode,qrCodeBase64:qr.qrCodeBase64});
  }catch{return resposta({ok:false,error:'Não foi possível recuperar este PIX agora.'},503)}
 }
 async function cancelPrior(env,link){
  try{
   const gw=createAsaasGateway(env),remote=await gw.getPayment(link.payment_id),dec=classifyAsaasPix(remote,link);
   if(dec.status==='paid'||dec.reason==='precautionary_hold')return {ok:false,error:'Este PIX já foi confirmado ou está em análise.'};
   if(dec.status==='pending'){const removed=await gw.cancelPayment(link.payment_id);if(removed?.deleted!==true)return {ok:false,error:'O Asaas ainda não confirmou a exclusão do PIX.'};await env.DB.prepare("UPDATE asaas_payment_links SET status='DELETED',updated_at=? WHERE payment_id=?").bind(new Date().toISOString(),link.payment_id).run()}
   else if(dec.status!=='cancelled')return {ok:false,error:'Este PIX precisa de revisão antes de cancelar.'};
   return {ok:true};
  }catch{return {ok:false,error:'Não foi possível cancelar a cobrança no Asaas. Tente mais tarde.'}}
 }
 // Recovery is separate from payment status transitions. EnvioEcom may fail
 // after the order was committed as paid; retries must not re-charge or resend.
 // Existing shipment_locks and shipping_id make create idempotent. Do not
 // auto-retry network-uncertain submissions: EnvioEcom may have created the
 // shipment even if its response was lost. Require manual reconciliation.
 async function retryPaidShipments(env){
  const rows=await env.DB.prepare("SELECT s.order_id FROM order_shipping s JOIN orders o ON o.id=s.order_id JOIN asaas_payment_links a ON a.order_id=o.id WHERE o.status='Pago' AND a.status='RECEIVED' AND s.carrier<>'Entrega local Valenza' AND COALESCE(s.shipping_id,'')='' AND NOT EXISTS (SELECT 1 FROM shipment_locks lk WHERE lk.order_id=o.id) AND NOT EXISTS (SELECT 1 FROM operational_events e WHERE e.order_id=o.id AND (e.event_type='shipping.network_failed' OR (e.event_type='shipping.failed' AND e.message='EnvioEcom respondeu sem identificador da postagem.'))) ORDER BY o.created_at ASC LIMIT 12").all();
  let attempted=0;
  for(const row of rows.results||[]){
   try{
    attempted++;
    await criarEnvioEnvioEcom(env,row.order_id);
   }catch(e){console.error('Asaas EnvioEcom retry:',String(row.order_id||''),e?.name||'error')}
  }
  return attempted;
 }
 async function cron(env){
  if(!asaasReady(env))return;
  try{
   await ensureAuthSchema(env);await ensureAsaasTables(env);
   const gw=createAsaasGateway(env);
   const pending=await env.DB.prepare("SELECT * FROM payment_attempts WHERE state IN ('sending','uncertain') ORDER BY created_at LIMIT 20").all();
   for(const attempt of pending.results||[]){
    let snap;try{snap=JSON.parse(attempt.snapshot_json)}catch{continue}
    if(snap.provider!=='asaas')continue;
    try{
     const remote=await gw.findPixByReference(attempt.reference);if(!remote)continue;
     await storeAsaasLink(env,{payment_id:remote.id,order_id:remote.id,reference:attempt.reference,customer_id:attempt.customer_id,asaas_customer_id:remote.customer,billing_type:'PIX',amount:Number(snap.total)});
     await reconcile(env,remote.id);
    }catch{}
   }
   const links=await env.DB.prepare("SELECT payment_id FROM asaas_payment_links WHERE status NOT IN ('RECEIVED','DELETED','CANCELED','REFUNDED') ORDER BY updated_at LIMIT 20").all();
   for(const item of links.results||[])try{await reconcile(env,item.payment_id)}catch{}
   await retryPaidShipments(env);
   const queued=await env.DB.prepare("SELECT id,payment_id FROM asaas_webhook_events WHERE state='queued' ORDER BY received_at LIMIT 20").all();
   for(const e of queued.results||[])try{
    if(e.payment_id&&await reconcile(env,e.payment_id))
     await env.DB.prepare("UPDATE asaas_webhook_events SET state='processed',updated_at=? WHERE id=?").bind(new Date().toISOString(),e.id).run();
   }catch{}
  }catch(e){console.error('Conciliação Asaas:',e?.name||'error')}
 }
 const webhook=(req,env,ctx)=>handleAsaasWebhook(req,env,ctx,pid=>reconcile(env,pid));
 return Object.freeze({startPix,reconcile,status,accountPix,cancelPrior,retryPaidShipments,cron,webhook,readLink:readAsaasLink});
}
