// One-use handoff from the authenticated native app to the existing card checkout.
// No card numbers enter the app; URLs expire after 60 seconds and cannot be replayed.
const ROOT='/api/app/checkout',ORIGIN='https://www.valenzaparfums.com.br';
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"};
const json=(data,status=200)=>Response.json(data,{status,headers});
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
export function checkoutItems(items){
 if(!Array.isArray(items)||!items.length||items.length>30)throw Error('Sacola inválida.');
 const seen=new Set();return items.map(p=>{const id=String(p?.id||''),qty=Number(p?.qty),price=Number(p?.price);if(!/^[a-zA-Z0-9_-]{1,160}$/.test(id)||seen.has(id)||!Number.isInteger(qty)||qty<1||qty>10||!Number.isFinite(price)||price<=0)throw Error('Confira os itens da sacola.');seen.add(id);return {id,qty,price,name:String(p.name||id).slice(0,180),brand:String(p.brand||'').slice(0,100),type:String(p.type||'').slice(0,80),img:String(p.img||'').slice(0,1200)};});
}
export async function nativeCheckoutRoute(request,env,ctx,store){
 const url=new URL(request.url);if(url.pathname!==ROOT&&url.pathname!==ROOT+'-session')return null;
 if(url.origin!==ORIGIN)return json({ok:false,error:'Use o endereço oficial da loja.'},400);
 const db=typeof env.DB.withSession==='function'?env.DB.withSession('first-primary'):env.DB;
 try{
  if(url.pathname===ROOT+'-session'){
   if(request.method!=='POST')return json({ok:false,error:'Método não permitido.'},405);
   const origin=request.headers.get('Origin');if(origin&&origin!==ORIGIN)return json({ok:false,error:'Origem inválida.'},403);
   const me=await store.fetch(new Request(ORIGIN+'/api/auth/me',{headers:request.headers}),env,ctx);
   const auth=await me.json();if(!me.ok||!auth.user?.emailVerified)return json({ok:false,error:'Entre na sua conta e confirme seu e-mail.'},401);
   const raw=await request.text();if(raw.length>40000)return json({ok:false,error:'Sacola muito grande.'},413);
   let items;try{items=checkoutItems(JSON.parse(raw).items);}catch(e){return json({ok:false,error:e.message},400);}
   const customer=await db.prepare('SELECT id FROM customers WHERE email=? AND email_verified=1').bind(auth.user.email).first();if(!customer)return json({ok:false,error:'Conta não encontrada.'},401);
   await db.prepare('CREATE TABLE IF NOT EXISTS android_checkout_links(token_hash TEXT PRIMARY KEY,customer_id TEXT NOT NULL,items_json TEXT NOT NULL,expires_at INTEGER NOT NULL)').run();
   const token=random();await db.batch([db.prepare('DELETE FROM android_checkout_links WHERE expires_at<?').bind(Date.now()),db.prepare('INSERT INTO android_checkout_links(token_hash,customer_id,items_json,expires_at) VALUES(?,?,?,?)').bind(await sha(token),customer.id,JSON.stringify(items),Date.now()+60000)]);
   return json({ok:true,url:ORIGIN+ROOT+'?token='+token});
  }
  if(request.method!=='GET')return json({ok:false,error:'Método não permitido.'},405);
  const token=url.searchParams.get('token')||'';if(!/^[0-9a-f]{64}$/.test(token))return json({ok:false,error:'Link inválido. Abra o checkout novamente pelo aplicativo.'},400);
  // Atomic consume: two concurrent redemptions cannot both create a browser session.
  const row=await db.prepare('DELETE FROM android_checkout_links WHERE token_hash=? AND expires_at>? RETURNING customer_id,items_json').bind(await sha(token),Date.now()).first();
  if(!row)return json({ok:false,error:'Link expirado ou já utilizado. Abra o checkout novamente no aplicativo.'},410);
  const customer=await db.prepare('SELECT id FROM customers WHERE id=? AND email_verified=1').bind(row.customer_id).first();if(!customer)return json({ok:false,error:'Conta não disponível.'},401);
  const session=random(),now=new Date().toISOString();await db.prepare('INSERT INTO customer_sessions(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),customer.id,await sha(session),new Date(Date.now()+30*86400000).toISOString(),now).run();
  const nonce=random(),cart=JSON.stringify(JSON.stringify(checkoutItems(JSON.parse(row.items_json)))).replace(/</g,'\\u003c');
  const html='<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Checkout seguro Valenza</title><body><p>Abrindo seu checkout seguro…</p><script nonce="'+nonce+'">try{localStorage.setItem("aurea_cart",'+cart+');location.replace("/checkout/");}catch(e){document.body.textContent="Permita o armazenamento deste site para abrir sua sacola. Nenhum pagamento foi criado.";}</script></body></html>';
  return new Response(html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Set-Cookie':'__Host-valenza_session='+session+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000','Content-Security-Policy':"default-src 'none'; script-src 'nonce-"+nonce+"'; frame-ancestors 'none'; base-uri 'none'"}});
 }catch(e){console.error('native_checkout_error',{message:'Unable to prepare native checkout'});return json({ok:false,error:'Não foi possível abrir o checkout agora. Nenhum pagamento foi criado. Tente novamente pelo aplicativo.'},503);}
}
