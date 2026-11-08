// Only generic operational alerts may be sent through ntfy.sh.
// Public ntfy topics are NOT access-controlled and must never receive customer data.
// ntfy.sh may reject Cloudflare shared egress IPs. Email-to-topic is the
// official ntfy alternative, using the store's already-configured Resend key.
async function publishNtfyViaResend(env,topic,payload,key){
 if(!env.RESEND_API_KEY)return {ok:false,error:'resend_unconfigured'};
 const from=String(env.AUREA_EMAIL_FROM||'VALENZA PARFUMS <contato@valenzaparfums.com.br>');
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{
  'Authorization':'Bearer '+String(env.RESEND_API_KEY),
  'Content-Type':'application/json',
  'Idempotency-Key':('ntfy-'+key).slice(0,200)
 },body:JSON.stringify({
  from,to:['ntfy-'+topic+'@ntfy.sh'],subject:payload.title,
  text:payload.message
 })});
 if(!r.ok)throw Error('resend_to_ntfy HTTP '+r.status+' '+(await r.text()).slice(0,120));
 return {ok:true,via:'email'};
}
export async function sendValenzaNtfy(env,{kind,id}){
 const topic=String(env.NTFY_TOPIC||'').trim();
 if(!/^[a-zA-Z0-9_-]{24,64}$/.test(topic))return {ok:false,reason:'not_configured'};
 const allowed={cart:{title:'VALENZA - Novo carrinho',message:'Um visitante adicionou um produto ao carrinho. Ainda nao e uma compra.',priority:3,click:'https://www.valenzaparfums.com.br/minha-conta/administracao/'},pix_created:{title:'VALENZA - Pix gerado',message:'Um pedido com Pix foi criado. Pagamento ainda pendente.',priority:3,click:'https://www.valenzaparfums.com.br/minha-conta/administracao/'},card_created:{title:'VALENZA - Cartao processado',message:'Um pedido por cartao foi registrado. Consulte o status no painel.',priority:3,click:'https://www.valenzaparfums.com.br/minha-conta/administracao/'},test:{title:'VALENZA - Teste de notificacoes',message:'Conexao ntfy configurada. Os avisos de novas vendas usam este canal.',priority:3,click:'https://www.valenzaparfums.com.br/minha-conta/administracao/'},sale:{title:'VALENZA - Venda confirmada',message:'Pagamento aprovado. Confira os pedidos no painel.',priority:4,click:'https://www.valenzaparfums.com.br/minha-conta/administracao/'},email:{title:'VALENZA - Novo e-mail',message:'Chegou um e-mail no atendimento. Confira a caixa de entrada.',priority:4,click:'https://resend.com/inboxes'}};
 const payload=allowed[kind];if(!payload)return {ok:false,reason:'unsupported'};
 const key=kind+':'+String(id||'').slice(0,180);
 if(!id)return {ok:false,reason:'missing_id'};
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS admin_ntfy_deliveries (notification_key TEXT PRIMARY KEY,status TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)').run();
 const now=new Date().toISOString();
 const row=await env.DB.prepare('SELECT status,attempts FROM admin_ntfy_deliveries WHERE notification_key=?').bind(key).first();
 if(row?.status==='sent')return {ok:true,alreadySent:true};
 if(Number(row?.attempts||0)>=4)return {ok:false,reason:'retry_limit'};
 if(!row)await env.DB.prepare('INSERT OR IGNORE INTO admin_ntfy_deliveries(notification_key,status,attempts,created_at,updated_at) VALUES(?,?,?,?,?)').bind(key,'pending',0,now,now).run();
 try{
  // No message body, email sender, subject, customer details or payment values leave the Worker.
  let result={ok:true,via:'email'};
  try{
   // Prefer the Resend gateway: direct Cloudflare -> ntfy.sh egress has
   // documented IP bans, and HTTP retries could slow payment confirmation.
   result=await publishNtfyViaResend(env,topic,payload,key);
  }catch(emailError){
   console.warn('Resend-to-ntfy failed; trying direct HTTP:',String(emailError).slice(0,130));
   const res=await fetch('https://ntfy.sh/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic,...payload}),signal:AbortSignal.timeout(6000)});
   if(!res.ok)throw Error('ntfy HTTP '+res.status+' '+(await res.text()).slice(0,120));
   result={ok:true,via:'http'};
  }
  await env.DB.prepare("UPDATE admin_ntfy_deliveries SET status='sent',attempts=attempts+1,updated_at=? WHERE notification_key=?").bind(now,key).run();
  return result;
 }catch(error){
  await env.DB.prepare("UPDATE admin_ntfy_deliveries SET status='failed',attempts=attempts+1,updated_at=? WHERE notification_key=?").bind(now,key).run();
  console.error('Aviso ntfy nao entregue:',kind,String(error).slice(0,180));
  // Operational log contains only error status, never customer information.
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS admin_ntfy_diagnostics (notification_key TEXT PRIMARY KEY,last_error TEXT NOT NULL,updated_at TEXT NOT NULL)').run().catch(()=>{});
  await env.DB.prepare('INSERT INTO admin_ntfy_diagnostics(notification_key,last_error,updated_at) VALUES(?,?,?) ON CONFLICT(notification_key) DO UPDATE SET last_error=excluded.last_error,updated_at=excluded.updated_at').bind(key,String(error).slice(0,180),now).run().catch(()=>{});
  return {ok:false,reason:'delivery_error'};
 }
}
