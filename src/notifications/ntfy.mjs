// Only generic operational alerts may be sent through ntfy.sh.
// Public ntfy topics are NOT access-controlled and must never receive customer data.
export async function sendValenzaNtfy(env,{kind,id}){
 const topic=String(env.NTFY_TOPIC||'').trim();
 if(!/^[a-zA-Z0-9_-]{24,64}$/.test(topic))return {ok:false,reason:'not_configured'};
 const allowed={test:{title:'VALENZA - Teste de notificacoes',message:'Conexao ntfy configurada. Os avisos de novas vendas usam este canal.',priority:3,click:'https://www.valenzaparfums.com.br/admin/'},sale:{title:'VALENZA - Venda confirmada',message:'Pagamento aprovado. Confira os pedidos no painel.',priority:4,click:'https://www.valenzaparfums.com.br/admin/'},email:{title:'VALENZA - Novo e-mail',message:'Chegou um e-mail no atendimento. Confira a caixa de entrada.',priority:4,click:'https://resend.com/inboxes'}};
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
  const res=await fetch('https://ntfy.sh/'+topic,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!res.ok)throw Error('ntfy status '+res.status);
  await env.DB.prepare("UPDATE admin_ntfy_deliveries SET status='sent',attempts=attempts+1,updated_at=? WHERE notification_key=?").bind(now,key).run();
  return {ok:true};
 }catch(error){
  await env.DB.prepare("UPDATE admin_ntfy_deliveries SET status='failed',attempts=attempts+1,updated_at=? WHERE notification_key=?").bind(now,key).run();
  console.error('Aviso ntfy nao entregue:',kind,String(error).slice(0,100));
  return {ok:false,reason:'delivery_error'};
 }
}
