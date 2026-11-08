// Incoming Resend inbox events: metadata-only, authenticated and inert until WhatsApp is configured.
// Never run commands, visit links, or use email body from untrusted messages.
const response=(status,body)=>new Response(body,{status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
function trimField(s,limit=90){return String(s??'').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().slice(0,limit)}
function config(env){const phone=String(env.WHATSAPP_PHONE_NUMBER_ID||'').trim(),token=String(env.WHATSAPP_ACCESS_TOKEN||'').trim(),recipients=[...new Set(String(env.WHATSAPP_ADMIN_RECIPIENTS||'').split(',').map(x=>x.replace(/\D/g,'')).filter(x=>/^\d{8,15}$/.test(x)))].slice(0,5);const template=String(env.WHATSAPP_EMAIL_TEMPLATE_NAME||'').trim(),lang=String(env.WHATSAPP_EMAIL_TEMPLATE_LANG||'pt_BR').trim(),version=/^v\d+\.\d+$/.test(String(env.WHATSAPP_API_VERSION||''))?env.WHATSAPP_API_VERSION:'v26.0';return{phone,token,recipients,template,lang,version,ready:!!(phone&&token&&recipients.length&&template)}}
function bytesEqual(a,b){if(a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a[i]^b[i];return difference===0}
function base64ToBytes(s){try{const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))}catch{return null}}
export async function verifyResendInboxWebhook(raw,headers,secret,now=Date.now()){
 if(!secret||!headers.get('svix-id')||!headers.get('svix-timestamp')||!headers.get('svix-signature'))return false;
 const timestamp=Number(headers.get('svix-timestamp'));
 if(!Number.isInteger(timestamp)||Math.abs(now/1000-timestamp)>300)return false;
 const parts=String(secret).split('_');if(parts[0]!=='whsec'||!parts[1])return false;
 const keyBytes=base64ToBytes(parts.slice(1).join('_'));if(!keyBytes)return false;
 const key=await crypto.subtle.importKey('raw',keyBytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const message=headers.get('svix-id')+'.'+timestamp+'.'+raw;
 const signature=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(message)));
 return String(headers.get('svix-signature')).split(' ').some(part=>{const [ver,value]=part.split(',');const bytes=ver==='v1'?base64ToBytes(value||''):null;return !!bytes&&bytesEqual(signature,bytes)});
}
async function sendEmailWhatsApp(env,cfg,email,recipient){
 const datetime=new Date(email.received_at||Date.now());const when=Number.isNaN(datetime.getTime())?'Agora':new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(datetime);
 const body={messaging_product:'whatsapp',to:recipient,type:'template',template:{name:cfg.template,language:{code:cfg.lang},components:[{type:'body',parameters:[{type:'text',text:trimField(email.from,100)||'Remetente desconhecido'},{type:'text',text:trimField(email.subject,120)||'Sem assunto'},{type:'text',text:when}]}]}};
 const res=await fetch('https://graph.facebook.com/'+encodeURIComponent(cfg.version)+'/'+encodeURIComponent(cfg.phone)+'/messages',{method:'POST',headers:{Authorization:'Bearer '+cfg.token,'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!res.ok){const err=await res.text();throw Error('Meta WhatsApp HTTP '+res.status+': '+trimField(err,180))}
 return true;
}
export async function handleResendInboxAlert(request,env){
 if(!env.RESEND_INBOX_WEBHOOK_SECRET)return response(503,'Webhook not configured');
 const raw=await request.text();if(raw.length>32768)return response(413,'Payload too large');
 const verified=await verifyResendInboxWebhook(raw,request.headers,env.RESEND_INBOX_WEBHOOK_SECRET);
 if(!verified)return response(401,'Invalid webhook signature');
 let event;try{event=JSON.parse(raw)}catch{return response(400,'Invalid event')}
 if(event.type!=='inbox.email.received')return response(200,'Ignored');
 const d=event.data||{};
 if(String(d.inbox_id||'')!=='98635c0f-8652-4196-9fc4-cae963faa9ca'||!String(d.email_id||'').trim())return response(200,'Ignored');
 const email={from:d.email?.from||d.from,subject:d.email?.subject||d.subject,received_at:d.email?.received_at||event.created_at};
 // The email body and links are intentionally never fetched or executed.
 if(env.NTFY_TOPIC)await import('./ntfy.mjs').then(m=>m.sendValenzaNtfy(env,{kind:'email',id:String(d.email_id)}));
 const cfg=config(env);
 if(!cfg.ready)return response(200,'Received; WhatsApp setup pending');
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS admin_inbox_whatsapp_alerts (email_id TEXT NOT NULL,recipient_hash TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(email_id,recipient_hash))').run();
 for(const recipient of cfg.recipients){
  const hashBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('valenza-wa-inbox:'+recipient));const hash=Array.from(new Uint8Array(hashBytes),x=>x.toString(16).padStart(2,'0')).join('');
  const now=new Date().toISOString();
  const ins=await env.DB.prepare('INSERT OR IGNORE INTO admin_inbox_whatsapp_alerts(email_id,recipient_hash,status,created_at,updated_at) VALUES(?,?,?,?,?)').bind(String(d.email_id),hash,'processing',now,now).run();
  if(Number(ins.meta?.changes||0)<1)continue;
  try{await sendEmailWhatsApp(env,cfg,email,recipient);await env.DB.prepare("UPDATE admin_inbox_whatsapp_alerts SET status='sent',updated_at=? WHERE email_id=? AND recipient_hash=?").bind(now,String(d.email_id),hash).run()}catch(err){console.error('WhatsApp email alert:',String(err).slice(0,220));await env.DB.prepare("UPDATE admin_inbox_whatsapp_alerts SET status='failed',updated_at=? WHERE email_id=? AND recipient_hash=?").bind(now,String(d.email_id),hash).run()}
 }
 return response(200,'Accepted');
}
