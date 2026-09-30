const jsonHeaders={"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Methods":"GET, POST, OPTIONS"};

export default{async fetch(request,env){
 const url=new URL(request.url);
 if(url.hostname==="valenzaparfums.com.br"&&(request.method==="GET"||request.method==="HEAD")&&!url.pathname.startsWith("/api/")){const target=new URL(request.url);target.hostname="www.valenzaparfums.com.br";return Response.redirect(target.toString(),308)}
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:jsonHeaders});
 if(url.pathname==="/api/health"&&request.method==="GET")return resposta({ok:true,service:"aurea-perfumes",timestamp:new Date().toISOString()});
 if(url.pathname==="/api/google/config"&&request.method==="GET"){const measurementId=String(env.GA4_MEASUREMENT_ID||"").trim(),valid=/^G-[A-Z0-9]+$/i.test(measurementId);return resposta({ok:true,enabled:valid,measurementId:valid?measurementId:""})}
 if(url.pathname==="/api/analytics/event"&&request.method==="POST")return analyticsEvent(request,env);
 if(url.pathname==="/api/auth/register"&&request.method==="POST")return authRegister(request,env);
 if(url.pathname==="/api/auth/login"&&request.method==="POST")return authLogin(request,env);
 if(url.pathname==="/api/auth/me"&&request.method==="GET")return authMe(request,env);
 if(url.pathname==="/api/auth/logout"&&request.method==="POST")return authLogout(request,env);
 if(url.pathname==="/api/auth/verify"&&request.method==="GET")return authVerify(url,env);
 if(url.pathname==="/api/auth/resend-verification"&&request.method==="POST")return authResendVerification(request,env);
 if(url.pathname==="/api/admin/status"&&request.method==="GET")return adminStatus(request,env);
 if(url.pathname==="/api/admin/setup"&&request.method==="POST")return adminSetup(request,env);
 if(url.pathname==="/api/admin/login"&&request.method==="POST")return adminLogin(request,env);
 if(url.pathname==="/api/admin/logout"&&request.method==="POST")return adminLogout(request,env);
 if(url.pathname==="/api/admin/dashboard"&&request.method==="GET")return adminDashboard(request,env);
 if(url.pathname==="/api/admin/orders/delete-tests"&&request.method==="POST")return adminDeleteTestOrders(request,env);
 if(url.pathname==="/api/account"&&request.method==="GET")return accountData(request,env);
 if(url.pathname==="/api/account/profile"&&request.method==="POST")return accountProfile(request,env);
 if(url.pathname==="/api/account/order/cancel"&&request.method==="POST")return accountCancelOrder(request,env);
 if(url.pathname==="/api/account/order/pix"&&request.method==="POST")return accountOrderPix(request,env);
 if(url.pathname==="/api/account/addresses"&&request.method==="POST")return accountAddressSave(request,env);
 if(url.pathname.startsWith("/api/account/addresses/")&&request.method==="POST")return accountAddressDelete(request,env,url.pathname.split("/").pop());
 if(url.pathname==="/api/frete"&&request.method==="POST")return calcularFrete(request,env);
 if(url.pathname==="/api/estoque"&&request.method==="GET")return consultarEstoque(env);
 if(url.pathname==="/api/pagamento/status"&&request.method==="GET")return statusMercadoPago(env);
 if(url.pathname==="/api/pagamento/webhook"&&request.method==="POST")return webhookMercadoPago(request,env);
 if(url.pathname==="/api/pagamento/config"&&request.method==="GET"){const mp=mpConfig(env);return resposta({ok:true,cardEnabled:Boolean(mp.publicKey),publicKey:mp.publicKey||"",testMode:mp.testMode})}
 if(url.pathname==="/api/pagamento"&&request.method==="POST")return criarPagamentoPix(request,env);
 if(url.pathname==="/api/pagamento/cartao"&&request.method==="POST")return criarPagamentoCartao(request,env);
 if(url.pathname.startsWith("/api/pagamento/")&&request.method==="GET")return consultarPagamento(request,url.pathname.slice("/api/pagamento/".length).trim(),env);
 if(url.pathname==="/admin"||url.pathname.startsWith("/admin/"))return new Response("Not Found",{status:404,headers:{"Content-Type":"text/plain; charset=UTF-8","X-Robots-Tag":"noindex, nofollow, noarchive"}});
 if(env.ASSETS)return servirAssets(request,env);
 return new Response("VALENZA",{status:404,headers:{"Content-Type":"text/plain; charset=UTF-8"}});
},
async scheduled(controller,env,ctx){ctx.waitUntil(reconcileStalePixReservations(env))}
};

let authSchemaReady=null;
async function ensureAuthSchema(env){
 if(!env.DB)throw new Error("Banco D1 não conectado.");
 if(authSchemaReady)return authSchemaReady;
 authSchemaReady=env.DB.batch([
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, email_verified INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_sessions (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS email_verifications (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_sessions_token ON customer_sessions(token_hash)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_verify_token ON email_verifications(token_hash)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_profiles (customer_id TEXT PRIMARY KEY, phone TEXT, cpf TEXT, birth_date TEXT, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_addresses (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, label TEXT NOT NULL DEFAULT 'Principal', recipient TEXT NOT NULL, cep TEXT NOT NULL, street TEXT NOT NULL, number TEXT NOT NULL, complement TEXT, neighborhood TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL, is_default INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_addresses_customer ON customer_addresses(customer_id)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, order_number TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'Aguardando pagamento', total REAL NOT NULL DEFAULT 0, tracking_code TEXT, tracking_url TEXT, carrier TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)"),env.DB.prepare("CREATE TABLE IF NOT EXISTS guest_orders (id TEXT PRIMARY KEY, email TEXT NOT NULL, customer_name TEXT NOT NULL, cpf TEXT, order_number TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'Aguardando pagamento', total REAL NOT NULL DEFAULT 0, tracking_code TEXT, tracking_url TEXT, carrier TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_guest_orders_email ON guest_orders(email)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS inventory (product_id TEXT PRIMARY KEY, stock INTEGER NOT NULL DEFAULT 10, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT NOT NULL, name TEXT NOT NULL, brand TEXT, type TEXT, image TEXT, quantity INTEGER NOT NULL, unit_price REAL NOT NULL, stock_deducted INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)"),env.DB.prepare("CREATE TABLE IF NOT EXISTS order_payments (order_id TEXT PRIMARY KEY, method TEXT NOT NULL, installments INTEGER NOT NULL DEFAULT 1, installment_amount REAL NOT NULL DEFAULT 0, total_paid REAL NOT NULL DEFAULT 0, status TEXT, status_detail TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),env.DB.prepare("CREATE TABLE IF NOT EXISTS shipment_locks (order_id TEXT PRIMARY KEY, state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS order_shipping (order_id TEXT PRIMARY KEY, email TEXT, customer_name TEXT, cpf TEXT, phone TEXT, cep TEXT, street TEXT, number TEXT, complement TEXT, neighborhood TEXT, city TEXT, state TEXT, carrier TEXT, freight_cost REAL NOT NULL DEFAULT 0, delivery_time INTEGER NOT NULL DEFAULT 0, shipping_id TEXT, barcode TEXT, label_ready INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_credentials (username TEXT PRIMARY KEY, customer_id TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_sessions (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_login_attempts (key TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0, blocked_until TEXT, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_deleted_test_orders (id TEXT PRIMARY KEY, admin_customer_id TEXT NOT NULL, order_id TEXT NOT NULL UNIQUE, order_number TEXT, snapshot_json TEXT NOT NULL, deleted_at TEXT NOT NULL, FOREIGN KEY(admin_customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS analytics_events (id TEXT PRIMARY KEY, event_key TEXT NOT NULL UNIQUE, visitor_id TEXT NOT NULL, session_id TEXT NOT NULL, event_name TEXT NOT NULL, page_path TEXT, product_id TEXT, product_name TEXT, value REAL NOT NULL DEFAULT 0, transaction_id TEXT, source TEXT, medium TEXT, campaign TEXT, referrer_host TEXT, country TEXT, region TEXT, region_code TEXT, city TEXT, created_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_analytics_event_created ON analytics_events(event_name,created_at)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_analytics_location ON analytics_events(country,region_code,city,created_at)")
 ]).catch(e=>{authSchemaReady=null;throw e});
 return authSchemaReady;
}
const enc=new TextEncoder();
function bytesHex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("")}
function randomToken(){const a=new Uint8Array(32);crypto.getRandomValues(a);return btoa(String.fromCharCode(...a)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function sha256(s){return bytesHex(await crypto.subtle.digest("SHA-256",enc.encode(s)))}
async function hashPassword(password,saltB64){
 const salt=saltB64?Uint8Array.from(atob(saltB64),c=>c.charCodeAt(0)):crypto.getRandomValues(new Uint8Array(16));
 const key=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:100000,hash:"SHA-256"},key,256);
 return {hash:bytesHex(bits),salt:btoa(String.fromCharCode(...salt))};
}
function validEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}
function cookieTokens(request){const c=request.headers.get("Cookie")||"";const out=[];for(const part of c.split(";")){const p=part.trim();if(!p.startsWith("aurea_session="))continue;try{const t=decodeURIComponent(p.slice("aurea_session=".length));if(t&&!out.includes(t))out.push(t)}catch{}}return out}
function sessionCookies(request,token,maxAge=2592000){const host=new URL(request.url).hostname.toLowerCase(),exp=(maxAge>0?new Date(Date.now()+maxAge*1000):new Date(0)).toUTCString(),base="aurea_session="+encodeURIComponent(token)+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+maxAge+"; Expires="+exp,out=[base];if(host==="valenzaparfums.com.br"||host==="www.valenzaparfums.com.br")out.push(base+"; Domain=valenzaparfums.com.br");return out}
function primaryDb(env){return typeof env.DB.withSession==="function"?env.DB.withSession("first-primary"):env.DB}
async function validCustomerSession(request,env){const tokens=cookieTokens(request);if(!tokens.length)return {user:null,reason:"missing_cookie"};const db=primaryDb(env);for(const t of tokens){const th=await sha256(t);const u=await db.prepare("SELECT c.id,c.name,c.email,c.email_verified,s.expires_at FROM customer_sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=?").bind(th).first();if(u&&Date.parse(u.expires_at)>=Date.now())return {user:u,token:t,reason:null}}return {user:null,reason:"session_not_found"}}
async function authRegister(request,env){
 try{await ensureAuthSchema(env);const d=await request.json();const name=String(d.name||"").trim();const email=String(d.email||"").trim().toLowerCase();const pass=String(d.password||"");
 if(name.length<3)return resposta({ok:false,error:"Informe seu nome completo."},400);if(!validEmail(email))return resposta({ok:false,error:"Informe um e-mail válido."},400);if(pass.length<8)return resposta({ok:false,error:"A senha precisa ter pelo menos 8 caracteres."},400);
 const exists=await env.DB.prepare("SELECT id,name,email_verified FROM customers WHERE email=?").bind(email).first();
 if(exists){
  if(exists.email_verified)return resposta({ok:false,error:"Já existe uma conta confirmada com este e-mail. Use ENTRAR."},409);
  const hp=await hashPassword(pass),now=new Date().toISOString();
  await env.DB.prepare("UPDATE customers SET name=?,password_hash=?,password_salt=?,updated_at=? WHERE id=?").bind(name,hp.hash,hp.salt,now,exists.id).run();
  await env.DB.prepare("DELETE FROM email_verifications WHERE customer_id=?").bind(exists.id).run();
  const token=randomToken(),th=await sha256(token),exp=new Date(Date.now()+24*3600e3).toISOString();
  await env.DB.prepare("INSERT INTO email_verifications(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),exists.id,th,exp,now).run();
  const verifyUrl=new URL("/api/auth/verify",request.url);verifyUrl.searchParams.set("token",token);
  const mail=await sendVerification(env,email,name,verifyUrl.toString());
  return resposta({ok:true,needsVerification:true,emailSent:mail.ok,message:mail.ok?"Cadastro atualizado. Enviamos um novo e-mail de confirmação.":"Cadastro atualizado. Não conseguimos enviar o e-mail agora; tente cadastrar novamente para reenviar."});
 }
 const id=crypto.randomUUID(),now=new Date().toISOString();let hp;try{hp=await hashPassword(pass)}catch(e){console.error("PBKDF2 indisponível, usando SHA-256 com salt:",e);const salt=randomToken();hp={salt,hash:await sha256(salt+":"+pass)}}await env.DB.prepare("INSERT INTO customers(id,name,email,password_hash,password_salt,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,0,?,?)").bind(id,name,email,hp.hash,hp.salt,now,now).run();
 const token=randomToken(),th=await sha256(token),exp=new Date(Date.now()+24*3600e3).toISOString();await env.DB.prepare("INSERT INTO email_verifications(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),id,th,exp,now).run();
 const verifyUrl=new URL("/api/auth/verify",request.url);verifyUrl.searchParams.set("token",token);const mail=await sendVerification(env,email,name,verifyUrl.toString());
 return resposta({ok:true,needsVerification:true,emailSent:mail.ok,message:mail.ok?"Conta criada. Enviamos um e-mail para confirmar seu cadastro.":"Conta criada, mas o e-mail de confirmação ainda não pôde ser enviado. O remetente do Resend precisa ser configurado."});
 }catch(e){console.error("Registro:",e);const m=String(e&&e.message||e||"erro desconhecido");return resposta({ok:false,error:"Não foi possível criar a conta agora.",detail:m.slice(0,300)},500)}
}
async function sendVerification(env,email,name,url){
 if(!env.RESEND_API_KEY){console.error("Resend: RESEND_API_KEY ausente");return {ok:false,error:"missing_api_key"}};
 const safeName=escapeHtml(name),safeUrl=escapeHtml(url);
 const html='<!doctype html><html><body style="margin:0;padding:0;background:#f5f1ec;font-family:Arial,Helvetica,sans-serif;color:#201d1a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ec;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e7e0d8"><tr><td style="padding:36px 32px 24px;text-align:center;border-bottom:1px solid #eee7df"><div style="font-family:Georgia,serif;font-size:28px;letter-spacing:8px;color:#171513">VALENZA</div><div style="margin-top:8px;font-size:10px;letter-spacing:5px;color:#8b7a68">PARFUMS</div></td></tr><tr><td style="padding:36px 32px"><h1 style="margin:0 0 22px;font-family:Georgia,serif;font-size:30px;font-weight:400;color:#171513">Confirme seu e-mail</h1><p style="margin:0 0 14px;font-size:16px;line-height:1.6">Olá, '+safeName+'.</p><p style="margin:0 0 26px;font-size:16px;line-height:1.6;color:#4f4943">Seu cadastro na VALENZA PARFUMS foi recebido. Confirme seu endereço de e-mail para ativar sua conta e acessar a loja com segurança.</p><p style="margin:0 0 28px"><a href="'+safeUrl+'" style="display:inline-block;background:#171513;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:1.5px;padding:16px 24px">CONFIRMAR MEU E-MAIL</a></p><p style="margin:0;font-size:13px;line-height:1.6;color:#7a726a">Por segurança, este link expira em 24 horas. Se você não criou uma conta na VALENZA PARFUMS, pode ignorar esta mensagem.</p></td></tr><tr><td style="padding:24px 32px;background:#faf8f5;border-top:1px solid #eee7df;text-align:center"><p style="margin:0 0 7px;font-size:12px;letter-spacing:1px;color:#5d554d">VALENZA PARFUMS</p><p style="margin:0;font-size:11px;color:#938a82">Mensagem automática de confirmação de cadastro. Por favor, não responda.</p></td></tr></table></td></tr></table></body></html>';
 const textBody='Olá, '+name+'.\n\nConfirme seu e-mail para ativar sua conta VALENZA PARFUMS:\n'+url+'\n\nEste link expira em 24 horas. Se você não criou esta conta, ignore esta mensagem.\n\nVALENZA PARFUMS';
 try{const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:env.AUREA_EMAIL_FROM||"VALENZA PARFUMS <contato@valenzaparfums.com.br>",to:[email],subject:"Confirme seu e-mail | VALENZA PARFUMS",html,text:textBody})});if(!r.ok){const detail=await r.text();console.error("Resend:",r.status,detail);return {ok:false,status:r.status,detail}}return {ok:true}}catch(e){console.error("Resend:",e);return {ok:false,error:String(e&&e.message||e)}}
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function authVerify(url,env){
 try{await ensureAuthSchema(env);const token=url.searchParams.get("token")||"";if(!token)return htmlMsg("Link inválido","O link de confirmação está incompleto.",false);const th=await sha256(token);const row=await env.DB.prepare("SELECT id,customer_id,expires_at FROM email_verifications WHERE token_hash=?").bind(th).first();if(!row||Date.parse(row.expires_at)<Date.now())return htmlMsg("Link expirado","Este link de confirmação não é mais válido.",false);await env.DB.batch([env.DB.prepare("UPDATE customers SET email_verified=1,updated_at=? WHERE id=?").bind(new Date().toISOString(),row.customer_id),env.DB.prepare("DELETE FROM email_verifications WHERE customer_id=?").bind(row.customer_id)]);return htmlMsg("E-mail confirmado!","Sua conta VALENZA está ativa. Volte à loja e faça seu login.",true);
 }catch(e){return htmlMsg("Não foi possível confirmar","Tente novamente mais tarde.",false)}
}
async function authResendVerification(request,env){
 try{
  await ensureAuthSchema(env);
  const d=await request.json(),email=String(d.email||"").trim().toLowerCase();
  if(!validEmail(email))return resposta({ok:false,error:"Informe um e-mail válido."},400);
  const u=await env.DB.prepare("SELECT id,name,email,email_verified FROM customers WHERE email=?").bind(email).first();
  if(!u)return resposta({ok:true,message:"Se houver uma conta pendente para este e-mail, enviaremos uma nova confirmação."});
  if(u.email_verified)return resposta({ok:true,alreadyVerified:true,message:"Este e-mail já está confirmado. Você já pode entrar."});
  await env.DB.prepare("DELETE FROM email_verifications WHERE customer_id=?").bind(u.id).run();
  const token=randomToken(),th=await sha256(token),now=new Date().toISOString(),exp=new Date(Date.now()+24*3600e3).toISOString();
  await env.DB.prepare("INSERT INTO email_verifications(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),u.id,th,exp,now).run();
  const verifyUrl=new URL("/api/auth/verify",request.url);verifyUrl.searchParams.set("token",token);
  const mail=await sendVerification(env,u.email,u.name,verifyUrl.toString());
  if(!mail.ok)return resposta({ok:false,error:"Não conseguimos enviar a confirmação agora. O e-mail da VALENZA ainda precisa estar habilitado para envio aos clientes."},503);
  return resposta({ok:true,message:"Novo e-mail de confirmação enviado. Confira também Spam e Lixo eletrônico."});
 }catch(e){console.error("Reenvio confirmação:",e);return resposta({ok:false,error:"Não foi possível reenviar a confirmação agora."},500)}
}
function htmlMsg(title,msg,ok){return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>VALENZA</title><body style="margin:0;background:#f8f5f1;font-family:Arial;color:#171513"><main style="max-width:560px;margin:12vh auto;background:#fff;padding:42px;text-align:center;border:1px solid #e7e1da"><div style="font:24px Georgia;letter-spacing:5px">VALENZA</div><h1 style="font:32px Georgia">'+escapeHtml(title)+'</h1><p>'+escapeHtml(msg)+'</p><a href="/" style="display:inline-block;margin-top:15px;background:#171513;color:white;padding:13px 20px;text-decoration:none">VOLTAR À LOJA</a></main></body>',{status:ok?200:400,headers:{"Content-Type":"text/html; charset=UTF-8","Cache-Control":"no-store"}})}
async function authLogin(request,env){
 try{await ensureAuthSchema(env);const d=await request.json();const email=String(d.email||"").trim().toLowerCase(),pass=String(d.password||"");const u=await env.DB.prepare("SELECT id,name,email,password_hash,password_salt,email_verified FROM customers WHERE email=?").bind(email).first();if(!u)return resposta({ok:false,error:"E-mail ou senha incorretos."},401);let hp;try{hp=await hashPassword(pass,u.password_salt)}catch(e){hp={hash:await sha256(u.password_salt+":"+pass)}}if(hp.hash!==u.password_hash)return resposta({ok:false,error:"E-mail ou senha incorretos."},401);if(!u.email_verified)return resposta({ok:false,error:"Confirme seu e-mail antes de entrar."},403);
 const db=primaryDb(env);for(const oldToken of cookieTokens(request))await db.prepare("DELETE FROM customer_sessions WHERE token_hash=?").bind(await sha256(oldToken)).run();
 const token=randomToken(),th=await sha256(token),now=new Date().toISOString(),exp=new Date(Date.now()+30*86400e3).toISOString();await db.prepare("INSERT INTO customer_sessions(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),u.id,th,exp,now).run();const persisted=await db.prepare("SELECT id FROM customer_sessions WHERE token_hash=?").bind(th).first();if(!persisted)throw new Error("Sessão criada, mas não persistida.");const h=new Headers(jsonHeaders);for(const c of sessionCookies(request,token))h.append("Set-Cookie",c);return new Response(JSON.stringify({ok:true,user:{name:u.name,email:u.email}}),{status:200,headers:h});
 }catch(e){console.error("Login:",e);return resposta({ok:false,error:"Não foi possível entrar agora."},500)}
}
async function authMe(request,env){
 try{await ensureAuthSchema(env);const s=await validCustomerSession(request,env);if(!s.user)return resposta({ok:false,user:null,reason:s.reason},401);const u=s.user;return resposta({ok:true,user:{name:u.name,email:u.email,emailVerified:!!u.email_verified}});
 }catch(e){console.error("Auth me:",e);return resposta({ok:false,user:null,reason:"server_error"},500)}
}
async function authLogout(request,env){try{await ensureAuthSchema(env);const db=primaryDb(env);for(const t of cookieTokens(request))await db.prepare("DELETE FROM customer_sessions WHERE token_hash=?").bind(await sha256(t)).run();const h=new Headers(jsonHeaders);for(const c of sessionCookies(request,"",0))h.append("Set-Cookie",c);return new Response(JSON.stringify({ok:true}),{headers:h})}catch(e){console.error("Logout:",e);return resposta({ok:true})}}


async function currentCustomer(request,env){await ensureAuthSchema(env);const s=await validCustomerSession(request,env);return s.user||null}


function analyticsText(v,max=120){return String(v||"").trim().slice(0,max)}
async function analyticsEvent(request,env){
 try{
  await ensureAuthSchema(env);
  const origin=request.headers.get("Origin")||"";
  if(origin){try{if(new URL(origin).hostname!==new URL(request.url).hostname)return resposta({ok:false},403)}catch{return resposta({ok:false},403)}}
  const d=await request.json().catch(()=>({})),eventName=analyticsText(d.eventName,40);
  const allowed=new Set(["page_view","view_item","add_to_cart","remove_from_cart","view_cart","begin_checkout","add_shipping_info","add_payment_info","purchase"]);
  if(!allowed.has(eventName))return resposta({ok:false,error:"Evento inválido."},400);
  const visitorId=analyticsText(d.visitorId,80),sessionId=analyticsText(d.sessionId,80);
  if(!/^[A-Za-z0-9_-]{8,80}$/.test(visitorId)||!/^[A-Za-z0-9_-]{8,80}$/.test(sessionId))return resposta({ok:false,error:"Sessão analítica inválida."},400);
  const transactionId=analyticsText(d.transactionId,120),rawKey=analyticsText(d.eventId,120),eventKey=eventName==="purchase"&&transactionId?"purchase:"+transactionId:rawKey;
  if(!/^[A-Za-z0-9:_-]{8,160}$/.test(eventKey))return resposta({ok:false,error:"Identificador analítico inválido."},400);
  const cf=request.cf||{},pagePath=analyticsText(d.pagePath,300),value=Math.max(0,Math.min(1000000,Number(d.value)||0)),now=new Date().toISOString();
  await env.DB.prepare("INSERT OR IGNORE INTO analytics_events(id,event_key,visitor_id,session_id,event_name,page_path,product_id,product_name,value,transaction_id,source,medium,campaign,referrer_host,country,region,region_code,city,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
   .bind(crypto.randomUUID(),eventKey,visitorId,sessionId,eventName,pagePath.startsWith("/")?pagePath:"/",analyticsText(d.productId),analyticsText(d.productName),value,transactionId,analyticsText(d.source,80),analyticsText(d.medium,80),analyticsText(d.campaign,120),analyticsText(d.referrerHost,160),analyticsText(cf.country,8),analyticsText(cf.region,100),analyticsText(cf.regionCode,20),analyticsText(cf.city,120),now).run();
  return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Analytics event:",e);return resposta({ok:false},500)}
}
async function analyticsDashboard(env){
 const now=Date.now(),since24=new Date(now-24*3600e3).toISOString(),since7=new Date(now-7*86400e3).toISOString(),since30=new Date(now-30*86400e3).toISOString();
 const [metrics,locations,sources,products,daily]=await Promise.all([
  env.DB.prepare("SELECT COUNT(DISTINCT CASE WHEN created_at>=? THEN session_id END) sessions24h,COUNT(DISTINCT CASE WHEN created_at>=? THEN session_id END) sessions7d,COUNT(DISTINCT session_id) sessions30d,COUNT(DISTINCT visitor_id) visitors30d,SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) page_views30d,SUM(CASE WHEN event_name='view_item' THEN 1 ELSE 0 END) product_views30d,SUM(CASE WHEN event_name='add_to_cart' THEN 1 ELSE 0 END) add_to_cart30d,SUM(CASE WHEN event_name='begin_checkout' THEN 1 ELSE 0 END) begin_checkout30d,COUNT(DISTINCT CASE WHEN event_name='purchase' THEN COALESCE(NULLIF(transaction_id,''),event_key) END) purchases30d,MIN(created_at) first_event_at FROM analytics_events WHERE created_at>=?").bind(since24,since7,since30).first(),
  env.DB.prepare("SELECT country,region,region_code,city,COUNT(DISTINCT session_id) sessions FROM analytics_events WHERE created_at>=? AND event_name='page_view' GROUP BY country,region,region_code,city ORDER BY sessions DESC LIMIT 15").bind(since30).all(),
  env.DB.prepare("SELECT COALESCE(NULLIF(source,''),'direct') source,COALESCE(NULLIF(medium,''),'none') medium,COUNT(DISTINCT session_id) sessions FROM analytics_events WHERE created_at>=? AND event_name='page_view' GROUP BY source,medium ORDER BY sessions DESC LIMIT 12").bind(since30).all(),
  env.DB.prepare("SELECT product_id,MAX(product_name) product_name,SUM(CASE WHEN event_name='view_item' THEN 1 ELSE 0 END) views,SUM(CASE WHEN event_name='add_to_cart' THEN 1 ELSE 0 END) carts FROM analytics_events WHERE created_at>=? AND product_id IS NOT NULL AND product_id<>'' AND event_name IN ('view_item','add_to_cart') GROUP BY product_id ORDER BY views DESC,carts DESC LIMIT 12").bind(since30).all(),
  env.DB.prepare("SELECT substr(created_at,1,10) day,COUNT(DISTINCT session_id) sessions,SUM(CASE WHEN event_name='view_item' THEN 1 ELSE 0 END) product_views,SUM(CASE WHEN event_name='begin_checkout' THEN 1 ELSE 0 END) checkouts,COUNT(DISTINCT CASE WHEN event_name='purchase' THEN COALESCE(NULLIF(transaction_id,''),event_key) END) purchases FROM analytics_events WHERE created_at>=? GROUP BY substr(created_at,1,10) ORDER BY day DESC LIMIT 7").bind(since7).all()
 ]);
 const m=metrics||{},sessions30=Number(m.sessions30d||0),purchases30=Number(m.purchases30d||0);
 return {periodDays:30,sessions24h:Number(m.sessions24h||0),sessions7d:Number(m.sessions7d||0),sessions30d:sessions30,visitors30d:Number(m.visitors30d||0),pageViews30d:Number(m.page_views30d||0),productViews30d:Number(m.product_views30d||0),addToCart30d:Number(m.add_to_cart30d||0),beginCheckout30d:Number(m.begin_checkout30d||0),purchases30d:purchases30,conversion30d:sessions30?Number((purchases30*100/sessions30).toFixed(2)):0,firstEventAt:m.first_event_at||null,locations:locations.results||[],sources:sources.results||[],products:products.results||[],daily:daily.results||[]};
}
function adminUsername(env){return String(env.ADMIN_USERNAME||"wesleymartins").trim().toLowerCase()}
function adminCookieToken(request){const c=request.headers.get("Cookie")||"";const m=c.match(/(?:^|;\s*)valenza_admin=([^;]+)/);return m?decodeURIComponent(m[1]):""}
function adminSessionCookie(token,maxAge=14400){return "valenza_admin="+encodeURIComponent(token)+"; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age="+maxAge}
function allowedAdminEmail(env,email){const allowed=String(env.ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);return allowed.includes(String(email||"").toLowerCase())}
async function eligibleAdminCustomer(request,env){
 const u=await currentCustomer(request,env);
 if(!u||!u.email_verified||!allowedAdminEmail(env,u.email))return null;
 return u;
}
async function currentAdmin(request,env){
 const u=await eligibleAdminCustomer(request,env);if(!u)return null;
 const token=adminCookieToken(request);if(!token)return null;
 const th=await sha256(token);
 const s=await env.DB.prepare("SELECT customer_id,expires_at FROM admin_sessions WHERE token_hash=? AND customer_id=?").bind(th,u.id).first();
 if(!s||Date.parse(s.expires_at)<Date.now()){if(s)await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(th).run();return null}
 return u;
}
async function createAdminSession(user,env){
 const token=randomToken(),th=await sha256(token),now=new Date().toISOString(),exp=new Date(Date.now()+4*3600e3).toISOString();
 await env.DB.prepare("DELETE FROM admin_sessions WHERE customer_id=? OR expires_at<?").bind(user.id,now).run();
 await env.DB.prepare("INSERT INTO admin_sessions(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),user.id,th,exp,now).run();
 return {token,exp};
}
async function adminAttemptKey(request){const ip=String(request.headers.get("CF-Connecting-IP")||request.headers.get("X-Forwarded-For")||"unknown").split(",")[0].trim();return sha256("admin-login:"+ip)}
async function adminRateState(request,env){
 const key=await adminAttemptKey(request),row=await env.DB.prepare("SELECT failures,blocked_until,updated_at FROM admin_login_attempts WHERE key=?").bind(key).first(),now=Date.now();
 if(!row)return {key,blocked:false};
 const blockedUntil=Date.parse(row.blocked_until||"");
 if(Number.isFinite(blockedUntil)&&blockedUntil>now)return {key,blocked:true,retryAfter:Math.max(1,Math.ceil((blockedUntil-now)/1000))};
 if(Date.parse(row.updated_at||"0")<now-15*60e3){await env.DB.prepare("DELETE FROM admin_login_attempts WHERE key=?").bind(key).run();return {key,blocked:false}}
 return {key,blocked:false,failures:Number(row.failures||0)};
}
async function adminRegisterFailure(key,failures,env){
 const next=Number(failures||0)+1,now=new Date(),block=next>=5?new Date(now.getTime()+15*60e3).toISOString():null,count=next>=5?0:next;
 await env.DB.prepare("INSERT INTO admin_login_attempts(key,failures,blocked_until,updated_at) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET failures=excluded.failures,blocked_until=excluded.blocked_until,updated_at=excluded.updated_at").bind(key,count,block,now.toISOString()).run();
}
async function adminStatus(request,env){
 try{
  await ensureAuthSchema(env);
  const u=await eligibleAdminCustomer(request,env);if(!u)return resposta({ok:false},404);
  const username=adminUsername(env),cred=await env.DB.prepare("SELECT username FROM admin_credentials WHERE username=? AND customer_id=?").bind(username,u.id).first(),active=await currentAdmin(request,env);
  return resposta({ok:true,eligible:true,configured:!!cred,authenticated:!!active,username});
 }catch(e){console.error("Admin status:",e);return resposta({ok:false},500)}
}
async function adminSetup(request,env){
 try{
  await ensureAuthSchema(env);
  const u=await eligibleAdminCustomer(request,env);if(!u)return resposta({ok:false,error:"Acesso não autorizado."},404);
  const username=adminUsername(env),existing=await env.DB.prepare("SELECT username FROM admin_credentials WHERE username=?").bind(username).first();
  if(existing)return resposta({ok:false,error:"A senha administrativa já foi criada. Use ENTRAR."},409);
  const d=await request.json().catch(()=>({})),user=String(d.username||"").trim().toLowerCase(),pass=String(d.password||""),confirm=String(d.confirmPassword||"");
  if(user!==username)return resposta({ok:false,error:"Usuário administrativo inválido."},400);
  if(pass.length<12)return resposta({ok:false,error:"Crie uma senha administrativa com pelo menos 12 caracteres."},400);
  if(pass!==confirm)return resposta({ok:false,error:"As senhas não coincidem."},400);
  const hp=await hashPassword(pass),now=new Date().toISOString();
  await env.DB.prepare("INSERT INTO admin_credentials(username,customer_id,password_hash,password_salt,created_at,updated_at) VALUES(?,?,?,?,?,?)").bind(username,u.id,hp.hash,hp.salt,now,now).run();
  const sess=await createAdminSession(u,env),h=new Headers(jsonHeaders);h.set("Set-Cookie",adminSessionCookie(sess.token));
  return new Response(JSON.stringify({ok:true,configured:true,authenticated:true,username}),{status:200,headers:h});
 }catch(e){console.error("Admin setup:",e);return resposta({ok:false,error:"Não foi possível criar a senha administrativa."},500)}
}
async function adminLogin(request,env){
 try{
  await ensureAuthSchema(env);
  const u=await eligibleAdminCustomer(request,env);if(!u)return resposta({ok:false,error:"Acesso não autorizado."},404);
  const rate=await adminRateState(request,env);if(rate.blocked)return resposta({ok:false,error:"Muitas tentativas. Aguarde alguns minutos e tente novamente.",retryAfter:rate.retryAfter},429);
  const d=await request.json().catch(()=>({})),user=String(d.username||"").trim().toLowerCase(),pass=String(d.password||""),username=adminUsername(env);
  const cred=user===username?await env.DB.prepare("SELECT customer_id,password_hash,password_salt FROM admin_credentials WHERE username=?").bind(username).first():null;
  let valid=false;if(cred&&cred.customer_id===u.id&&pass){const hp=await hashPassword(pass,cred.password_salt);valid=hp.hash===cred.password_hash}
  if(!valid){await adminRegisterFailure(rate.key,rate.failures,env);return resposta({ok:false,error:"Usuário ou senha administrativa incorretos."},401)}
  await env.DB.prepare("DELETE FROM admin_login_attempts WHERE key=?").bind(rate.key).run();
  const sess=await createAdminSession(u,env),h=new Headers(jsonHeaders);h.set("Set-Cookie",adminSessionCookie(sess.token));
  return new Response(JSON.stringify({ok:true,authenticated:true,username}),{status:200,headers:h});
 }catch(e){console.error("Admin login:",e);return resposta({ok:false,error:"Não foi possível entrar no painel agora."},500)}
}
async function adminLogout(request,env){
 try{await ensureAuthSchema(env);const token=adminCookieToken(request);if(token)await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(await sha256(token)).run();const h=new Headers(jsonHeaders);h.set("Set-Cookie",adminSessionCookie("",0));return new Response(JSON.stringify({ok:true}),{headers:h})}catch(e){return resposta({ok:true})}
}
function adminOrderHasShipment(row){
 return Boolean(String(row?.shipping_id||"").trim()||String(row?.barcode||"").trim()||Number(row?.label_ready||0)||String(row?.tracking_code||"").trim()||String(row?.tracking_url||"").trim()||String(row?.lock_state||"").trim());
}
function adminStatusKey(v){return String(v||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[\s-]+/g,"_")}
function adminOrderDeletePolicy(row,admin){
 const own=String(row?.customer_id||"")===String(admin.id)||(!row?.customer_id&&String(row?.email||"").toLowerCase()===String(admin.email||"").toLowerCase());
 if(!own)return {allowed:false,reason:"Venda de cliente protegida"};
 if(adminOrderHasShipment(row))return {allowed:false,reason:"Postagem EnvioEcom criada ou em preparação"};

 const orderStatus=adminStatusKey(row?.status),paymentStatus=adminStatusKey(row?.payment_status);
 const active=new Set(["aguardando_pagamento","processando","processing","pending","created","action_required","in_process","authorized","in_mediation","pending_contingency"]);
 const deletableOrder=new Set(["cancelado","expirado","pagamento_recusado","reembolsado","pago"]);
 const knownPayment=new Set(["failed","rejected","canceled","cancelled","expired","refunded","partially_refunded","processed","approved"]);

 if(active.has(orderStatus)||active.has(paymentStatus))return {allowed:false,reason:"Pagamento ainda ativo; cancele ou aguarde expirar"};
 if(!deletableOrder.has(orderStatus))return {allowed:false,reason:"Status de pagamento não encerrado ou não reconhecido"};
 if(paymentStatus&&!knownPayment.has(paymentStatus))return {allowed:false,reason:"Status bruto do Mercado Pago ainda não permite exclusão"};
 return {allowed:true,reason:"Pedido da sua conta de testes"};
}
async function adminDeleteTestOrders(request,env){
 let adminDeleteLocks=[];
 try{
  await ensureAuthSchema(env);await seedInventory(env);
  const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),confirm=String(d.confirm||"").trim().toUpperCase(),rawIds=Array.isArray(d.orderIds)?d.orderIds:[];
  const ids=[...new Set(rawIds.map(x=>String(x||"").trim()).filter(Boolean))].slice(0,20);
  if(confirm!=="APAGAR")return resposta({ok:false,error:"Digite APAGAR para confirmar a exclusão."},400);
  if(!ids.length)return resposta({ok:false,error:"Selecione pelo menos um pedido."},400);
  const marks=ids.map(()=>"?").join(",");
  const qr=await env.DB.prepare("WITH selected AS (SELECT o.id,o.customer_id,o.order_number,o.status,o.total,o.tracking_code,o.tracking_url,o.carrier,o.created_at,c.name customer_name,c.email email,'orders' source FROM orders o LEFT JOIN customers c ON c.id=o.customer_id WHERE o.id IN ("+marks+") UNION ALL SELECT g.id,NULL customer_id,g.order_number,g.status,g.total,g.tracking_code,g.tracking_url,g.carrier,g.created_at,g.customer_name,g.email,'guest_orders' source FROM guest_orders g WHERE g.id IN ("+marks+") AND NOT EXISTS(SELECT 1 FROM orders o2 WHERE o2.id=g.id)) SELECT s.*,sh.shipping_id,sh.barcode,sh.label_ready,sh.cep,sh.street,sh.number,sh.complement,sh.neighborhood,sh.city,sh.state,sh.freight_cost,sh.delivery_time,l.state lock_state,p.method,p.installments,p.installment_amount,p.total_paid,p.status payment_status,p.status_detail FROM selected s LEFT JOIN order_shipping sh ON sh.order_id=s.id LEFT JOIN shipment_locks l ON l.order_id=s.id LEFT JOIN order_payments p ON p.order_id=s.id").bind(...ids,...ids).all();
  const rows=qr.results||[],rowMap=new Map(rows.map(x=>[String(x.id),x]));
  const missing=ids.filter(id=>!rowMap.has(id));if(missing.length)return resposta({ok:false,error:"Um ou mais pedidos selecionados não existem mais. Atualize o painel e tente novamente.",missing},409);
  const blocked=[];
  for(const id of ids){const row=rowMap.get(id),policy=adminOrderDeletePolicy(row,admin);if(!policy.allowed)blocked.push({id,orderNumber:row.order_number,status:row.status,reason:policy.reason})}
  if(blocked.length)return resposta({ok:false,error:"A exclusão foi bloqueada para proteger pedidos reais, pagamentos ativos ou postagens do EnvioEcom.",blocked},409);

  const lockNow=new Date().toISOString();
  for(const id of ids){
   const lk=await env.DB.prepare("INSERT OR IGNORE INTO shipment_locks(order_id,state,created_at,updated_at) VALUES(?,?,?,?)").bind(id,"admin_deleting",lockNow,lockNow).run();
   if((lk.meta?.changes||0)<1){
    if(adminDeleteLocks.length)await env.DB.batch(adminDeleteLocks.map(x=>env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=? AND state='admin_deleting'").bind(x)));
    adminDeleteLocks=[];
    return resposta({ok:false,error:"A exclusão foi bloqueada porque uma postagem entrou em preparação. Atualize o painel antes de tentar novamente."},409);
   }
   adminDeleteLocks.push(id);
  }
  const sr=await env.DB.prepare("SELECT s.order_id,s.shipping_id,s.barcode,s.label_ready,o.tracking_code order_tracking,g.tracking_code guest_tracking FROM order_shipping s LEFT JOIN orders o ON o.id=s.order_id LEFT JOIN guest_orders g ON g.id=s.order_id WHERE s.order_id IN ("+marks+")").bind(...ids).all();
  const createdAfterLock=(sr.results||[]).filter(x=>String(x.shipping_id||"").trim()||String(x.barcode||"").trim()||Number(x.label_ready||0)||String(x.order_tracking||"").trim()||String(x.guest_tracking||"").trim());
  if(createdAfterLock.length){
   await env.DB.batch(adminDeleteLocks.map(x=>env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=? AND state='admin_deleting'").bind(x)));adminDeleteLocks=[];
   return resposta({ok:false,error:"A exclusão foi bloqueada porque a postagem do EnvioEcom já foi criada.",blocked:createdAfterLock.map(x=>x.order_id)},409);
  }

  const ir=await env.DB.prepare("SELECT id,order_id,product_id,name,brand,type,image,quantity,unit_price,stock_deducted,created_at FROM order_items WHERE order_id IN ("+marks+") ORDER BY created_at").bind(...ids).all();
  const items=ir.results||[],itemsBy=new Map();for(const it of items){if(!itemsBy.has(String(it.order_id)))itemsBy.set(String(it.order_id),[]);itemsBy.get(String(it.order_id)).push(it)}
  const now=new Date().toISOString(),ops=[];let restoredUnits=0;
  for(const id of ids){
   const row=rowMap.get(id),orderItems=itemsBy.get(id)||[];
   const snapshot={order:{id:row.id,order_number:row.order_number,status:row.status,total:row.total,tracking_code:row.tracking_code,tracking_url:row.tracking_url,carrier:row.carrier,created_at:row.created_at,customer_name:row.customer_name,email:row.email,source:row.source},payment:{method:row.method,installments:row.installments,installment_amount:row.installment_amount,total_paid:row.total_paid,status:row.payment_status,status_detail:row.status_detail},shipping:{shipping_id:row.shipping_id,barcode:row.barcode,label_ready:row.label_ready,cep:row.cep,street:row.street,number:row.number,complement:row.complement,neighborhood:row.neighborhood,city:row.city,state:row.state,freight_cost:row.freight_cost,delivery_time:row.delivery_time},items:orderItems};
   ops.push(env.DB.prepare("INSERT OR REPLACE INTO admin_deleted_test_orders(id,admin_customer_id,order_id,order_number,snapshot_json,deleted_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),admin.id,id,String(row.order_number||""),JSON.stringify(snapshot),now));
   for(const it of orderItems){
    const state=Number(it.stock_deducted),qty=Math.max(0,Number(it.quantity)||0);
    if(state!==2&&qty>0){ops.push(env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(qty,now,String(it.product_id)));restoredUnits+=qty}
   }
   ops.push(env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=? AND state='admin_deleting'").bind(id));
   ops.push(env.DB.prepare("DELETE FROM order_shipping WHERE order_id=?").bind(id));
   ops.push(env.DB.prepare("DELETE FROM order_payments WHERE order_id=?").bind(id));
   ops.push(env.DB.prepare("DELETE FROM order_items WHERE order_id=?").bind(id));
   ops.push(env.DB.prepare("DELETE FROM orders WHERE id=? AND customer_id=?").bind(id,admin.id));
   ops.push(env.DB.prepare("DELETE FROM guest_orders WHERE id=? AND lower(email)=lower(?)").bind(id,admin.email));
  }
  await env.DB.batch(ops);adminDeleteLocks=[];
  return resposta({ok:true,deletedOrders:ids.length,restoredUnits,archived:true,message:ids.length===1?"Pedido de teste removido e arquivado com segurança.":ids.length+" pedidos de teste removidos e arquivados com segurança."});
 }catch(e){
  if(adminDeleteLocks.length)try{await env.DB.batch(adminDeleteLocks.map(x=>env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=? AND state='admin_deleting'").bind(x)))}catch(cleanErr){console.error("Admin cleanup delete locks:",cleanErr)}
  console.error("Admin delete test orders:",e);return resposta({ok:false,error:"Não foi possível apagar os pedidos de teste agora."},500)
 }
}
async function adminDashboard(request,env){
 try{
  await ensureAuthSchema(env);
  const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  await seedInventory(env);
  const allOrdersCte="WITH all_orders AS (SELECT id,order_number,status,total,created_at FROM orders UNION ALL SELECT g.id,g.order_number,g.status,g.total,g.created_at FROM guest_orders g WHERE NOT EXISTS(SELECT 1 FROM orders o WHERE o.id=g.id)) ";
  const [customers,orders,recentOrders,recentCustomers,inventory,topProducts,deletedTests]=await Promise.all([
   env.DB.prepare("SELECT COUNT(*) total,SUM(CASE WHEN email_verified=1 THEN 1 ELSE 0 END) verified FROM customers").first(),
   env.DB.prepare(allOrdersCte+"SELECT COUNT(*) total_orders,SUM(CASE WHEN status='Pago' THEN 1 ELSE 0 END) paid_orders,COALESCE(SUM(CASE WHEN status='Pago' THEN total ELSE 0 END),0) revenue,SUM(CASE WHEN status IN ('Aguardando pagamento','Processando') THEN 1 ELSE 0 END) pending_orders,SUM(CASE WHEN status='Pagamento recusado' THEN 1 ELSE 0 END) rejected_orders,SUM(CASE WHEN status IN ('Cancelado','Expirado','Reembolsado') THEN 1 ELSE 0 END) closed_orders FROM all_orders").first(),
   env.DB.prepare("WITH all_orders AS (SELECT o.id,o.customer_id,o.order_number,o.status,o.total,o.tracking_code,o.tracking_url,o.carrier,o.created_at,c.name customer_name,c.email email FROM orders o LEFT JOIN customers c ON c.id=o.customer_id UNION ALL SELECT g.id,NULL customer_id,g.order_number,g.status,g.total,g.tracking_code,g.tracking_url,g.carrier,g.created_at,g.customer_name,g.email FROM guest_orders g WHERE NOT EXISTS(SELECT 1 FROM orders o2 WHERE o2.id=g.id)) SELECT a.id,a.customer_id,a.order_number,a.status,a.total,a.tracking_code,a.tracking_url,a.carrier,a.created_at,a.customer_name,a.email,p.method,p.installments,p.total_paid,s.barcode,s.shipping_id,s.label_ready,l.state lock_state FROM all_orders a LEFT JOIN order_payments p ON p.order_id=a.id LEFT JOIN order_shipping s ON s.order_id=a.id LEFT JOIN shipment_locks l ON l.order_id=a.id ORDER BY a.created_at DESC LIMIT 50").all(),
   env.DB.prepare("SELECT name,email,email_verified,created_at FROM customers ORDER BY created_at DESC LIMIT 50").all(),
   env.DB.prepare("SELECT product_id,stock,updated_at FROM inventory ORDER BY stock ASC,product_id ASC").all(),
   env.DB.prepare("WITH paid AS (SELECT id FROM orders WHERE status='Pago' UNION SELECT g.id FROM guest_orders g WHERE g.status='Pago' AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.id=g.id)) SELECT oi.product_id,MAX(oi.name) name,MAX(oi.brand) brand,SUM(oi.quantity) units,ROUND(SUM(oi.quantity*oi.unit_price),2) value FROM order_items oi JOIN paid p ON p.id=oi.order_id GROUP BY oi.product_id ORDER BY units DESC,value DESC LIMIT 10").all(),
   env.DB.prepare("SELECT COUNT(*) total FROM admin_deleted_test_orders WHERE admin_customer_id=?").bind(admin.id).first()
  ]);
  const recent=(recentOrders.results||[]).map(row=>{const policy=adminOrderDeletePolicy(row,admin);return {...row,is_test_account:policy.reason!=="Venda de cliente protegida",delete_allowed:policy.allowed,delete_reason:policy.reason}});
  for(const row of recent)delete row.customer_id;
  const totalOrders=Number(orders?.total_orders||0),paidOrders=Number(orders?.paid_orders||0),revenue=Number(orders?.revenue||0),stockRows=inventory.results||[],analytics=await analyticsDashboard(env);
  return resposta({ok:true,admin:{name:admin.name},generatedAt:new Date().toISOString(),analytics,metrics:{customers:Number(customers?.total||0),verifiedCustomers:Number(customers?.verified||0),orders:totalOrders,paidOrders,revenue:Number(revenue.toFixed(2)),averageTicket:paidOrders?Number((revenue/paidOrders).toFixed(2)):0,pendingOrders:Number(orders?.pending_orders||0),rejectedOrders:Number(orders?.rejected_orders||0),closedOrders:Number(orders?.closed_orders||0),inventoryUnits:stockRows.reduce((sum,x)=>sum+Number(x.stock||0),0),lowStockProducts:stockRows.filter(x=>Number(x.stock||0)<=2).length,deletedTestOrders:Number(deletedTests?.total||0)},recentOrders:recent,recentCustomers:recentCustomers.results||[],inventory:stockRows,topProducts:topProducts.results||[]});
 }catch(e){console.error("Admin dashboard:",e);return resposta({ok:false,error:"Não foi possível carregar o painel administrativo."},500)}
}
async function accountData(request,env){try{
 const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login para acessar sua conta."},401);
 const [p,a,o]=await Promise.all([
  env.DB.prepare("SELECT phone,cpf,birth_date FROM customer_profiles WHERE customer_id=?").bind(u.id).first(),
  env.DB.prepare("SELECT id,label,recipient,cep,street,number,complement,neighborhood,city,state,is_default FROM customer_addresses WHERE customer_id=? ORDER BY is_default DESC,created_at DESC").bind(u.id).all(),
  env.DB.prepare("SELECT id,order_number,status,total,tracking_code,tracking_url,carrier,created_at FROM orders WHERE customer_id=? UNION SELECT id,order_number,status,total,tracking_code,tracking_url,carrier,created_at FROM guest_orders WHERE lower(email)=lower(?) ORDER BY created_at DESC LIMIT 50").bind(u.id,u.email).all()
 ]);
 const orders=o.results||[];
 if(orders.length){
  const ids=orders.map(x=>x.id),marks=ids.map(()=>"?").join(",");
  const [its,ships,pays]=await Promise.all([
   env.DB.prepare("SELECT order_id,product_id,name,brand,type,image,quantity,unit_price FROM order_items WHERE order_id IN ("+marks+")").bind(...ids).all(),
   env.DB.prepare("SELECT order_id,carrier,shipping_id,barcode,label_ready FROM order_shipping WHERE order_id IN ("+marks+")").bind(...ids).all(),
   env.DB.prepare("SELECT order_id,method,installments,installment_amount,total_paid,status,status_detail FROM order_payments WHERE order_id IN ("+marks+")").bind(...ids).all()
  ]);
  const itemMap=new Map(),shipMap=new Map(),payMap=new Map();
  for(const x of (its.results||[])){if(!itemMap.has(x.order_id))itemMap.set(x.order_id,[]);const {order_id,...item}=x;itemMap.get(x.order_id).push(item)}
  for(const x of (ships.results||[]))shipMap.set(x.order_id,x);
  for(const x of (pays.results||[]))payMap.set(x.order_id,x);
  for(const ord of orders){
   ord.items=itemMap.get(ord.id)||[];
   const sh=shipMap.get(ord.id);if(sh){ord.carrier=sh.carrier||ord.carrier;ord.tracking_code=sh.barcode||ord.tracking_code;ord.shipping_id=sh.shipping_id||null;ord.label_ready=!!sh.label_ready}
   const pay=payMap.get(ord.id);if(pay){const {order_id,...payment}=pay;ord.payment=payment}
  }
 }
 return resposta({ok:true,user:{name:u.name,email:u.email,emailVerified:!!u.email_verified,phone:p?.phone||"",cpf:p?.cpf||"",birthDate:p?.birth_date||""},addresses:a.results||[],orders});
}catch(e){console.error("Conta:",e);return resposta({ok:false,error:"Não foi possível carregar sua conta."},500)}}
async function accountOrderPix(request,env){
 try{
  const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);
  const d=await request.json().catch(()=>({})),id=String(d.orderId||"").trim();if(!id)return resposta({ok:false,error:"Pedido inválido."},400);
  const ord=await env.DB.prepare("SELECT id,status,total FROM orders WHERE id=? AND customer_id=?").bind(id,u.id).first();if(!ord)return resposta({ok:false,error:"Pedido não encontrado na sua conta."},404);
  const payrow=await env.DB.prepare("SELECT method FROM order_payments WHERE order_id=?").bind(id).first();if(String(payrow?.method||"").toLowerCase()!=="pix")return resposta({ok:false,error:"Este pedido não possui pagamento Pix."},409);
  const cfg=mpConfig(env);if(!cfg.accessToken)return resposta({ok:false,error:"Pagamento temporariamente indisponível."},503);
  const mr=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}}),raw=await mr.text();let md;try{md=JSON.parse(raw)}catch{md={}}if(!mr.ok)return resposta({ok:false,error:"Não foi possível consultar este Pix agora."},502);
  const tx=md?.transactions?.payments?.[0]||{},st=String(tx.status||md.status||""),detail=String(tx.status_detail||md.status_detail||""),approved=["processed","approved"].includes(st)||detail==="accredited",pix=tx?.payment_method?.qr_code||tx?.payment_method?.ticket_url?tx.payment_method:(tx?.payment_method||{});
  if(approved){await consultarPagamentoCore(id,env);return resposta({ok:true,paid:true,status:"approved",message:"Este pedido já está pago."})}
  if(["failed","rejected","canceled","cancelled","expired"].includes(st)){await consultarPagamentoCore(id,env);return resposta({ok:false,expired:st==="expired",status:st,error:st==="expired"?"Este Pix expirou e não pode mais ser pago.":"Este Pix não está mais disponível para pagamento."},409)}
  const qr=String(pix.qr_code||tx.qr_code||""),qr64=String(pix.qr_code_base64||tx.qr_code_base64||""),ticket=String(pix.ticket_url||tx.ticket_url||"");
  if(!qr&&!qr64&&!ticket)return resposta({ok:false,error:"O Mercado Pago não retornou os dados deste Pix. Gere um novo pagamento."},409);
  return resposta({ok:true,orderId:id,status:st||"pending",statusDetail:detail,amount:Number(ord.total||0).toFixed(2),qrCode:qr,qrCodeBase64:qr64,ticketUrl:ticket});
 }catch(e){console.error("Recuperar PIX:",e);return resposta({ok:false,error:"Não foi possível recuperar este Pix agora."},500)}
}
async function releaseReservedStock(env,orderId,now=new Date().toISOString()){
 const its=await env.DB.prepare("SELECT id,product_id,quantity FROM order_items WHERE order_id=? AND stock_deducted=0").bind(orderId).all();
 for(const it of (its.results||[])){
  const marked=await env.DB.prepare("UPDATE order_items SET stock_deducted=2 WHERE id=? AND stock_deducted=0").bind(it.id).run();
  if((marked.meta?.changes||0)>0)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(Number(it.quantity),now,it.product_id).run();
 }
}
async function accountCancelOrder(request,env){
 try{
  const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);
  const d=await request.json().catch(()=>({})),id=String(d.orderId||"").trim();if(!id)return resposta({ok:false,error:"Pedido inválido."},400);
  const ord=await env.DB.prepare("SELECT id,status FROM orders WHERE id=? AND customer_id=?").bind(id,u.id).first();if(!ord)return resposta({ok:false,error:"Pedido não encontrado na sua conta."},404);
  if(!["Aguardando pagamento","Processando"].includes(String(ord.status)))return resposta({ok:false,error:"Este pedido não pode mais ser cancelado."},409);
  const cfg=mpConfig(env);if(cfg.accessToken){
   try{
    const mr=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}});
    if(mr.ok){const md=await mr.json(),tx=md?.transactions?.payments?.[0]||{},st=String(tx.status||md.status||"");if(["processed","approved"].includes(st)||String(tx.status_detail||md.status_detail||"")==="accredited")return resposta({ok:false,error:"O pagamento já foi aprovado e o pedido não pode ser cancelado."},409)}
   }catch(e){console.error("Consulta antes do cancelamento:",e)}
  }
  const now=new Date().toISOString();await releaseReservedStock(env,id,now);
  await env.DB.batch([env.DB.prepare("UPDATE orders SET status='Cancelado',updated_at=? WHERE id=? AND customer_id=?").bind(now,id,u.id),env.DB.prepare("UPDATE order_payments SET status='cancelled',status_detail='cancelled_by_customer',updated_at=? WHERE order_id=?").bind(now,id)]);
  return resposta({ok:true,message:"Pedido cancelado."});
 }catch(e){console.error("Cancelar pedido:",e);return resposta({ok:false,error:"Não foi possível cancelar o pedido agora."},500)}
}
async function accountProfile(request,env){try{const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);const d=await request.json(),name=String(d.name||"").trim(),phone=String(d.phone||"").replace(/\D/g,"").slice(0,11),cpf=String(d.cpf||"").replace(/\D/g,"").slice(0,11),birth=String(d.birthDate||"").trim();if(name.length<3)return resposta({ok:false,error:"Informe seu nome completo."},400);const now=new Date().toISOString();await env.DB.batch([env.DB.prepare("UPDATE customers SET name=?,updated_at=? WHERE id=?").bind(name,now,u.id),env.DB.prepare("INSERT INTO customer_profiles(customer_id,phone,cpf,birth_date,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(customer_id) DO UPDATE SET phone=excluded.phone,cpf=excluded.cpf,birth_date=excluded.birth_date,updated_at=excluded.updated_at").bind(u.id,phone,cpf,birth,now)]);return resposta({ok:true,message:"Dados salvos."})}catch(e){return resposta({ok:false,error:"Não foi possível salvar seus dados."},500)}}
async function accountAddressSave(request,env){try{const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);const d=await request.json();const v={label:String(d.label||"Principal").trim(),recipient:String(d.recipient||u.name).trim(),cep:String(d.cep||"").replace(/\D/g,""),street:String(d.street||"").trim(),number:String(d.number||"").trim(),complement:String(d.complement||"").trim(),neighborhood:String(d.neighborhood||"").trim(),city:String(d.city||"").trim(),state:String(d.state||"").trim().toUpperCase().slice(0,2)};if(v.cep.length!==8||!v.street||!v.number||!v.neighborhood||!v.city||v.state.length!==2)return resposta({ok:false,error:"Preencha o endereço completo."},400);const now=new Date().toISOString(),id=String(d.id||"").trim()||crypto.randomUUID(),def=d.isDefault?1:0;if(def)await env.DB.prepare("UPDATE customer_addresses SET is_default=0 WHERE customer_id=?").bind(u.id).run();const own=await env.DB.prepare("SELECT id FROM customer_addresses WHERE id=? AND customer_id=?").bind(id,u.id).first();if(own)await env.DB.prepare("UPDATE customer_addresses SET label=?,recipient=?,cep=?,street=?,number=?,complement=?,neighborhood=?,city=?,state=?,is_default=?,updated_at=? WHERE id=? AND customer_id=?").bind(v.label,v.recipient,v.cep,v.street,v.number,v.complement,v.neighborhood,v.city,v.state,def,now,id,u.id).run();else await env.DB.prepare("INSERT INTO customer_addresses(id,customer_id,label,recipient,cep,street,number,complement,neighborhood,city,state,is_default,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,u.id,v.label,v.recipient,v.cep,v.street,v.number,v.complement,v.neighborhood,v.city,v.state,def,now,now).run();return resposta({ok:true,message:"Endereço salvo."})}catch(e){console.error("Endereco:",e);return resposta({ok:false,error:"Não foi possível salvar o endereço."},500)}}
async function accountAddressDelete(request,env,id){try{const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);await env.DB.prepare("DELETE FROM customer_addresses WHERE id=? AND customer_id=?").bind(id,u.id).run();return resposta({ok:true})}catch(e){return resposta({ok:false,error:"Não foi possível excluir o endereço."},500)}}
async function servirAssets(request,env){const response=await env.ASSETS.fetch(request);const contentType=response.headers.get("content-type")||"";if(!contentType.includes("text/html")||new URL(request.url).pathname!=="/")return response;const html=await response.text();const headers=new Headers(response.headers);headers.set("Cache-Control","no-store, max-age=0, must-revalidate");headers.delete("ETag");return new Response(html,{status:response.status,statusText:response.statusText,headers})}
async function consultarEstoque(env){try{await ensureAuthSchema(env);await seedInventory(env);const r=await env.DB.prepare("SELECT product_id,stock FROM inventory").all();return resposta({ok:true,stock:Object.fromEntries((r.results||[]).map(x=>[x.product_id,Number(x.stock)]))})}catch(e){return resposta({ok:false,error:"Não foi possível consultar o estoque."},500)}}
const AUREA_CATALOG={
"angham-second-song":{name:"Angham Second Song",brand:"Lattafa",type:"EDP · 100ml",price:289.9,weight:.6,length:20,height:12,width:16},
"athena":{name:"Athena",brand:"Maison Alhambra",type:"EDP · 100ml",price:239.9,weight:.6,length:20,height:12,width:16},
"delilah-blanc":{name:"Delilah Blanc",brand:"Maison Alhambra",type:"EDP · 100ml",price:279.9,weight:.6,length:20,height:12,width:16},
"delilah":{name:"Delilah Pour Femme",brand:"Maison Alhambra",type:"EDP · 100ml",price:279.9,weight:.6,length:20,height:12,width:16},
"fakhar-rose":{name:"Fakhar Rose",brand:"Lattafa",type:"EDP · 100ml",price:269.9,weight:.6,length:20,height:12,width:16},
"sabah":{name:"Sabah Al Ward",brand:"Al Wataniah",type:"EDP · 100ml",price:249.9,weight:.6,length:20,height:12,width:16},
"asad":{name:"Asad",brand:"Lattafa",type:"EDP · 100ml",price:259.9,weight:.6,length:20,height:12,width:16},
"attar":{name:"Attar Al Wesal",brand:"Al Wataniah",type:"EDP · 100ml",price:229.9,weight:.6,length:20,height:12,width:16},
"decant-sabah":{name:"Decant Sabah Al Ward",brand:"Al Wataniah",type:"Decant · 5ml",price:52,weight:.15,length:12,height:5,width:8},
"ameerati":{name:"Ameerati",brand:"Al Wataniah",type:"EDP · 100ml",price:229.9,weight:.6,length:20,height:12,width:16},
"angham":{name:"Angham",brand:"Lattafa",type:"EDP · 100ml",price:279.9,weight:.6,length:20,height:12,width:16},
"vanilla-voyage":{name:"Vanilla Voyage",brand:"Maison Asrar",type:"EDP · 100ml · Unissex",price:399.9,weight:.6,length:20,height:12,width:16},
"atheeri":{name:"Atheeri",brand:"Lattafa",type:"EDP · 100ml",price:469.9,weight:.6,length:20,height:12,width:16},
"club-de-nuit-intense-man":{name:"Club de Nuit Intense Man",brand:"Armaf",type:"EDT · 105ml",price:289.9,weight:.6,length:20,height:12,width:16},
"musamam-white-intense":{name:"Musamam White Intense",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:329.9,weight:.6,length:20,height:12,width:16},
"afeef":{name:"Afeef",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:549.9,weight:.6,length:20,height:12,width:16},
"queen-of-arabia":{name:"Queen of Arabia",brand:"Lattafa",type:"EDP · 100ml",price:519.9,weight:.6,length:20,height:12,width:16},
"yara":{name:"Yara",brand:"Lattafa",type:"EDP · 100ml",price:269.9,weight:.6,length:20,height:12,width:16},
"tharwah-gold":{name:"Tharwah Gold",brand:"Lattafa",type:"EDP · 100ml",price:449.9,weight:.6,length:20,height:12,width:16},
"vulcan-feu":{name:"Vulcan Feu",brand:"French Avenue",type:"EDP · 100ml",price:429.9,weight:.6,length:20,height:12,width:16},
"khamrah":{name:"Khamrah",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:249.9,weight:.6,length:20,height:12,width:16},
"khamrah-qahwa":{name:"Khamrah Qahwa",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:269.9,weight:.6,length:20,height:12,width:16},
"eclaire":{name:"Eclaire",brand:"Lattafa",type:"EDP · 100ml",price:319.9,weight:.6,length:20,height:12,width:16},
"liquid-brun":{name:"Liquid Brun",brand:"French Avenue",type:"EDP · 100ml",price:399.9,weight:.6,length:20,height:12,width:16},
"spectre-ghost":{name:"Spectre Ghost",brand:"French Avenue",type:"EDP · 80ml",price:329.9,weight:.6,length:20,height:12,width:16},
"afnan-9pm":{name:"9 PM",brand:"Afnan",type:"EDP · 100ml",price:299.9,weight:.6,length:20,height:12,width:16},
"hawas-ice":{name:"Hawas Ice",brand:"Rasasi",type:"EDP · 100ml",price:329.9,weight:.6,length:20,height:12,width:16},
"yara-candy":{name:"Yara Candy",brand:"Lattafa",type:"EDP · 100ml",price:249.9,weight:.6,length:20,height:12,width:16},
"tiramisu-coco":{name:"Tiramisu Coco",brand:"Zimaya",type:"EDP · 100ml · Unissex",price:279.9,weight:.6,length:20,height:12,width:16},
"fatima-pink":{name:"Fatima Pink",brand:"Zimaya",type:"Extrait de Parfum · 100ml",price:269.9,weight:.6,length:20,height:12,width:16},
"supremacy-not-only-intense":{name:"Supremacy Not Only Intense",brand:"Afnan",type:"Extrait de Parfum · 100ml",price:399.9,weight:.6,length:20,height:12,width:16},
"club-de-nuit-milestone":{name:"Club de Nuit Milestone",brand:"Armaf",type:"EDP · 105ml",price:279.9,weight:.6,length:20,height:12,width:16},
"club-de-nuit-untold":{name:"Club de Nuit Untold",brand:"Armaf",type:"EDP · 105ml · Unissex",price:399.9,weight:.6,length:20,height:12,width:16},
"badee-al-oud-amethyst":{name:"Bade'e Al Oud Amethyst",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:229.9,weight:.6,length:20,height:12,width:16},
"raghba-wood-intense":{name:"Raghba Wood Intense",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:219.9,weight:.6,length:20,height:12,width:16},
"designer-la-vie-est-belle":{name:"La Vie Est Belle",brand:"Lancôme",type:"EDP · 100ml",price:749.9,weight:.6,length:20,height:12,width:16},
"designer-good-girl":{name:"Good Girl",brand:"Carolina Herrera",type:"EDP · 80ml",price:779.9,weight:.6,length:20,height:12,width:16},
"designer-libre":{name:"Libre",brand:"Yves Saint Laurent",type:"EDP · 90ml",price:979.9,weight:.6,length:20,height:12,width:16},
"designer-jadore":{name:"J'adore",brand:"Dior",type:"EDP · 100ml",price:999.9,weight:.6,length:20,height:12,width:16},
"designer-sauvage":{name:"Sauvage",brand:"Dior",type:"EDT · 100ml",price:829.9,weight:.6,length:20,height:12,width:16},
"designer-212-vip-rose":{name:"212 VIP Rosé",brand:"Carolina Herrera",type:"EDP · 80ml",price:839.9,weight:.6,length:20,height:12,width:16},
"designer-1-million":{name:"1 Million",brand:"Rabanne",type:"EDT · 100ml",price:559.9,weight:.6,length:20,height:12,width:16},
"designer-versace-eros":{name:"Eros",brand:"Versace",type:"EDT · 100ml",price:729.9,weight:.6,length:20,height:12,width:16},
"designer-acqua-di-gio":{name:"Acqua di Giò",brand:"Giorgio Armani",type:"EDT · 100ml",price:649.9,weight:.6,length:20,height:12,width:16},
"designer-my-way":{name:"My Way",brand:"Giorgio Armani",type:"EDP · 90ml",price:999.9,weight:.6,length:20,height:12,width:16},
"designer-scandal":{name:"Scandal",brand:"Jean Paul Gaultier",type:"EDP · 80ml",price:849.9,weight:.6,length:20,height:12,width:16},
"designer-invictus":{name:"Invictus",brand:"Rabanne",type:"EDT · 100ml",price:649.9,weight:.6,length:20,height:12,width:16},
"designer-black-opium":{name:"Black Opium",brand:"Yves Saint Laurent",type:"EDP · 90ml",price:949.9,weight:.6,length:20,height:12,width:16},
"designer-light-blue":{name:"Light Blue",brand:"Dolce & Gabbana",type:"EDT · 100ml",price:629.9,weight:.6,length:20,height:12,width:16},
"designer-miss-dior":{name:"Miss Dior",brand:"Dior",type:"EDP · 100ml",price:929.9,weight:.6,length:20,height:12,width:16},
"designer-linterdit":{name:"L'Interdit",brand:"Givenchy",type:"EDP · 80ml",price:849.9,weight:.6,length:20,height:12,width:16},
"armaf-club-de-nuit-maleka":{name:"Club de Nuit Maleka",brand:"Armaf",type:"EDP · 105ml",price:449.90,weight:.6,length:20,height:12,width:16}
};
async function officialCatalog(env){return AUREA_CATALOG}
async function seedInventory(env){const now=new Date().toISOString();await env.DB.prepare("CREATE TABLE IF NOT EXISTS inventory_meta (key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL)").run();const doneV1=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v1'").first();if(!doneV1){const catalog=await officialCatalog(env);const q=Object.keys(catalog).map(id=>env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET stock=excluded.stock,updated_at=excluded.updated_at").bind(id,10,now));q.push(env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v1','10',?)").bind(now));await env.DB.batch(q)}const doneV2=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v2-new10'").first();if(!doneV2){const ids=["khamrah","khamrah-qahwa","eclaire","liquid-brun","spectre-ghost","afnan-9pm","hawas-ice","yara-candy","tiramisu-coco","fatima-pink"];const q=ids.map(id=>env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET stock=excluded.stock,updated_at=excluded.updated_at").bind(id,100,now));q.push(env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v2-new10','100',?)").bind(now));await env.DB.batch(q)}const doneV4=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v4-new5'").first();if(!doneV4){const ids=["supremacy-not-only-intense","club-de-nuit-milestone","club-de-nuit-untold","badee-al-oud-amethyst","raghba-wood-intense"];const q=ids.map(id=>env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET stock=excluded.stock,updated_at=excluded.updated_at").bind(id,100,now));q.push(env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v4-new5','100',?)").bind(now));await env.DB.batch(q)}const doneV5=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v5-designer16'").first();if(!doneV5){const ids=["designer-la-vie-est-belle","designer-good-girl","designer-libre","designer-jadore","designer-sauvage","designer-212-vip-rose","designer-1-million","designer-versace-eros","designer-acqua-di-gio","designer-my-way","designer-scandal","designer-invictus","designer-black-opium","designer-light-blue","designer-miss-dior","designer-linterdit"];const q=ids.map(id=>env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET stock=excluded.stock,updated_at=excluded.updated_at").bind(id,100,now));q.push(env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v5-designer16','100',?)").bind(now));await env.DB.batch(q)}const doneV6=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v6-maleka'").first();if(!doneV6){await env.DB.batch([env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO NOTHING").bind("armaf-club-de-nuit-maleka",100,now),env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v6-maleka','100',?)").bind(now)])}const doneV3=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-cleanup-v3'").first();if(!doneV3){await env.DB.prepare("DELETE FROM inventory WHERE product_id IN ('body-cream-yara','musamam','fakhar-rose-banner')").run();await env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-cleanup-v3','ok',?)").bind(now).run()}}
async function canonicalItems(raw,env){if(!Array.isArray(raw)||!raw.length)throw new Error("Carrinho vazio");const catalog=await officialCatalog(env);return raw.map(x=>{const id=String(x.id||""),p=catalog[id],n=Number(x.qty);if(!p)throw new Error("Produto inválido: "+id);if(!Number.isInteger(n)||n<1||n>10)throw new Error("Quantidade inválida para "+p.name);return {id,qty:n,...p,img:String(x.img||"")}})}
function pixPrice(price){const cents=Math.round(Number(price)*100);return Math.floor((cents*95+50)/100)/100}
function quoteKey(x){return String(x?.id??x?.service_id??x?.carrier??x?.company??"")}
const LOCAL_COLATINA={id:"local-colatina",company:"VALENZA",name:"Frete grátis em Colatina",carrier:"Entrega local Valenza",price:0,delivery_time:0,dropoff_points:[]};
function destinoColatina(cep){
 const n=Number(String(cep||"").replace(/\D/g,""));
 return Number.isInteger(n)&&n>=29700000&&n<=29719999;
}
function shippingAddressComplete(shipping){
 const cs=String(shipping?.cityState||""),parts=cs.split(/\s*-\s*/);
 const street=String(shipping?.street||"").trim(),number=String(shipping?.number||"").trim(),neighborhood=String(shipping?.neighborhood||"").trim(),city=String(shipping?.city||parts[0]||"").trim(),state=String(shipping?.state||parts[1]||"").trim().toUpperCase();
 return Boolean(street&&number&&neighborhood&&city&&/^[A-Z]{2}$/.test(state));
}
async function calcularFrete(request,env){
 try{
  const dados=await request.json(),cep=String(dados.cep||"").replace(/\D/g,"");
  if(!/^\d{8}$/.test(cep))return resposta({ok:false,error:"CEP inválido."},400);
  const items=await canonicalItems(dados.produtos,env);
  if(destinoColatina(cep))return resposta({ok:true,fretes:[LOCAL_COLATINA]});
  if(!env.ENVIOECOM_TOKEN)return resposta({ok:false,error:"Serviço de frete temporariamente indisponível."},503);
  await ensureAuthSchema(env);await seedInventory(env);
  const stockChecks=await env.DB.batch(items.map(it=>env.DB.prepare("SELECT stock FROM inventory WHERE product_id=?").bind(it.id)));
  for(let i=0;i<items.length;i++){const inv=stockChecks[i]?.results?.[0];if(Number(inv?.stock||0)<items[i].qty)return resposta({ok:false,error:items[i].name+" está sem estoque suficiente."},409)}
  const produtos=items.map(p=>({weight:p.weight,length:p.length,height:p.height,width:p.width,quantity:p.qty,price:p.price}));
  const upstream=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipping/quote",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","X-Partner-Token":env.ENVIOECOM_TOKEN},body:JSON.stringify({postal_code_destination:cep,aviso_recebimento:false,include_dropoff_points:true,products:produtos})});
  const raw=await upstream.text();let data;try{data=JSON.parse(raw)}catch{data=null}
  if(!upstream.ok)return resposta({ok:false,error:"Não foi possível calcular o frete agora."},502);
  const quotes=Array.isArray(data?.quotes)?data.quotes:(Array.isArray(data)?data:[]);
  const fretes=quotes.map(x=>({id:quoteKey(x),company:String(x.carrier||x.company||"Envio Ecom"),name:String(x.carrier||x.name||x.service||"Frete"),carrier:String(x.carrier||x.company||""),price:Number(x.price??x.freight_cost??0),delivery_time:Number(x.delivery_time??x.delivery_days??0),dropoff_points:x.dropoff_points||[]})).filter(x=>x.id&&x.carrier&&Number.isFinite(x.price)&&x.price>=0);
  return resposta({ok:true,fretes});
 }catch(e){console.error("Frete:",e);return resposta({ok:false,error:e.message==="Carrinho vazio"?"Carrinho vazio.":"Não foi possível calcular o frete."},500)}
}
function mpConfig(env){const production=String(env.MERCADOPAGO_MODE||"test").toLowerCase()==="production";return {testMode:!production,publicKey:production?(env.MERCADOPAGO_PUBLIC_KEY||""):(env.MERCADOPAGO_TEST_PUBLIC_KEY||""),accessToken:production?(env.MERCADOPAGO_ACCESS_TOKEN||""):(env.MERCADOPAGO_TEST_ACCESS_TOKEN||"")}}
async function statusMercadoPago(env){
 const cfg=mpConfig(env);
 if(!mpConfig(env).accessToken)return resposta({ok:false,error:"Token do Mercado Pago ausente."},503);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{const r=await fetch("https://api.mercadopago.com/users/me",{headers:{Authorization:`Bearer ${mpConfig(env).accessToken}`,Accept:"application/json"},signal:controller.signal});const raw=await r.text();let d={};try{d=JSON.parse(raw)}catch{};if(!r.ok)return resposta({ok:false,provider:"mercadopago",status:r.status,error:d.message||d.error||"Credencial recusada pelo Mercado Pago."},502);const accountId=String(d?.id||"");return resposta({ok:true,provider:"mercadopago",status:r.status,credentials:"accepted",accountIdLast4:accountId?accountId.slice(-4):null});}catch(e){return resposta({ok:false,provider:"mercadopago",error:e?.name==="AbortError"?"Tempo esgotado ao conectar ao Mercado Pago.":"Falha de conexão com o Mercado Pago."},504)}finally{clearTimeout(timer)}
}
async function criarPagamentoPix(request,env){
 try{
  if(!mpConfig(env).accessToken)return resposta({ok:false,error:"Pagamento temporariamente indisponível."},503);
  const dados=await request.json(),deviceId=String(dados.deviceId||"").trim().slice(0,256),nome=String(dados.name||"").trim(),email=String(dados.email||"").trim().toLowerCase(),cpf=String(dados.cpf||"").replace(/\D/g,""),telefone=String(dados.phone||"").replace(/\D/g,""),shipping=dados.shipping&&typeof dados.shipping==="object"?dados.shipping:{};
  if(String(dados.paymentMethod||"").toLowerCase()!=="pix")return resposta({ok:false,error:"Método de pagamento não disponível."},400);
  if(nome.length<3)return resposta({ok:false,error:"Informe seu nome completo."},400);if(!validEmail(email))return resposta({ok:false,error:"Informe um e-mail válido."},400);if(!cpfValido(cpf))return resposta({ok:false,error:"Informe um CPF válido."},400);
  const cep=String(shipping.cep||"").replace(/\D/g,"");if(!/^\d{8}$/.test(cep))return resposta({ok:false,error:"CEP inválido."},400);if(!shippingAddressComplete(shipping))return resposta({ok:false,error:"Preencha o endereço completo antes de pagar."},400);
  await ensureAuthSchema(env);const u=await currentCustomer(request,env);
  if(!u)return resposta({ok:false,requiresLogin:true,error:"Para finalizar a compra, entre ou crie sua conta VALENZA."},401);
  if(!u.email_verified)return resposta({ok:false,requiresVerification:true,error:"Confirme seu e-mail antes de finalizar a compra."},403);
  if(email!==String(u.email||"").toLowerCase())return resposta({ok:false,error:"O e-mail da compra deve ser o mesmo da sua conta VALENZA."},409);
  await seedInventory(env);const items=await canonicalItems(dados.items,env);
  const quoteReq={postal_code_destination:cep,aviso_recebimento:false,include_dropoff_points:true,products:items.map(p=>({weight:p.weight,length:p.length,height:p.height,width:p.width,quantity:p.qty,price:p.price}))};
  const localDelivery=await destinoColatina(cep);
  let chosen,freight;if(localDelivery){if(String(shipping.id||"")!==LOCAL_COLATINA.id)return resposta({ok:false,error:"Calcule o frete novamente para usar a entrega grátis em Colatina."},409);chosen=LOCAL_COLATINA;freight=0}else{const qr=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipping/quote",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","X-Partner-Token":env.ENVIOECOM_TOKEN},body:JSON.stringify(quoteReq)});const qraw=await qr.text();let qd;try{qd=JSON.parse(qraw)}catch{qd=null}if(!qr.ok)return resposta({ok:false,error:"Não foi possível validar o frete."},502);const quotes=Array.isArray(qd?.quotes)?qd.quotes:(Array.isArray(qd)?qd:[]),quoteWanted=String(shipping.id||""),carrierWanted=String(shipping.carrier||shipping.name||"");chosen=quoteWanted?quotes.find(x=>quoteKey(x)===quoteWanted):null;if(!chosen)return resposta({ok:false,error:"A opção de frete mudou. Calcule o frete novamente."},409);if(carrierWanted&&String(chosen.carrier||chosen.company||"")!==carrierWanted)return resposta({ok:false,error:"A opção de frete mudou. Calcule o frete novamente."},409);const quotedFreight=Number(chosen.price??chosen.freight_cost);if(!Number.isFinite(quotedFreight)||quotedFreight<0)return resposta({ok:false,error:"Frete inválido."},409);freight=quotedFreight}const carrier=localDelivery?"Entrega local Valenza":String(chosen.carrier||chosen.company||"Envio Ecom");
  const subtotal=items.reduce((s,x)=>s+pixPrice(x.price)*x.qty,0),total=Number((subtotal+freight).toFixed(2));
  for(const it of items){const inv=await env.DB.prepare("SELECT stock FROM inventory WHERE product_id=?").bind(it.id).first();if(Number(inv?.stock||0)<it.qty)return resposta({ok:false,error:it.name+" está sem estoque suficiente."},409)}
  const reserveAt=new Date().toISOString(),reserve=items.map(it=>env.DB.prepare("UPDATE inventory SET stock=stock-?,updated_at=? WHERE product_id=? AND stock>=?").bind(it.qty,reserveAt,it.id,it.qty)),rr=await env.DB.batch(reserve);
  if(rr.some(x=>(x.meta?.changes||0)<1)){for(let i=0;i<items.length;i++)if((rr[i]?.meta?.changes||0)>0)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(items[i].qty,reserveAt,items[i].id).run();return resposta({ok:false,error:"O estoque mudou durante a compra. Tente novamente."},409)}
  const releaseReservation=async()=>{for(const it of items)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(it.qty,new Date().toISOString(),it.id).run()};
  const partes=nome.split(/\s+/).filter(Boolean),referencia=`AUREA-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
  const payload={type:"online",total_amount:total.toFixed(2),external_reference:referencia,processing_mode:"automatic",transactions:{payments:[{amount:total.toFixed(2),payment_method:{id:"pix",type:"bank_transfer"},expiration_time:"PT30M"}]},payer:{email,first_name:partes[0],last_name:partes.slice(1).join(" ")||"AUREA",identification:{type:"CPF",number:cpf}}};if(telefone.length>=10)payload.payer.phone={area_code:telefone.slice(0,2),number:telefone.slice(2)};
  const mp=await fetch("https://api.mercadopago.com/v1/orders",{method:"POST",headers:{Authorization:`Bearer ${mpConfig(env).accessToken}`,"Content-Type":"application/json",Accept:"application/json","X-Idempotency-Key":crypto.randomUUID(),...(deviceId?{"X-meli-session-id":deviceId}:{})},body:JSON.stringify(payload)});
  const raw=await mp.text();let result;try{result=JSON.parse(raw)}catch{result={}}if(!mp.ok){await releaseReservation();const mpMessage=String(result?.message||result?.error||"Solicitação recusada.");const mpCause=Array.isArray(result?.cause)?result.cause.map(x=>[x?.code,x?.description].filter(Boolean).join(": ")).filter(Boolean):[];const mpData=String(result?.data?.message||result?.data?.error||"");const detail=[`Mercado Pago HTTP ${mp.status}: ${mpMessage}`,mpData,mpCause.length?`Detalhes: ${mpCause.join(" | ")}`:""].filter(Boolean).join(" — ");return resposta({ok:false,error:detail},502)}
  if(!result.id){await releaseReservation();return resposta({ok:false,error:"Mercado Pago não retornou o identificador do pedido."},502)}
  const pay=result?.transactions?.payments?.[0]||{},pix=pay?.payment_method||{},orderId=String(result.id),paymentId=String(pay.id||result.id);let savedToAccount=true;
  if(result.id){const now=new Date().toISOString(),pid=orderId;
   await env.DB.prepare("INSERT OR IGNORE INTO orders(id,customer_id,order_number,status,total,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(pid,u.id,referencia,"Aguardando pagamento",total,now,now).run();
   for(const it of items)await env.DB.prepare("INSERT OR IGNORE INTO order_items(id,order_id,product_id,name,brand,type,image,quantity,unit_price,stock_deducted,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),pid,it.id,it.name,it.brand,it.type,it.img,it.qty,pixPrice(it.price),0,now).run();
   const cs=String(shipping.cityState||""),parts=cs.split(/\s*-\s*/),city=String(shipping.city||parts[0]||""),state=String(shipping.state||parts[1]||"").toUpperCase().slice(0,2);
   await env.DB.prepare("INSERT OR REPLACE INTO order_shipping(order_id,email,customer_name,cpf,phone,cep,street,number,complement,neighborhood,city,state,carrier,freight_cost,delivery_time,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(pid,email,nome,cpf,telefone,cep,String(shipping.street||""),String(shipping.number||""),String(shipping.complement||""),String(shipping.neighborhood||""),city,state,carrier,freight,Number(chosen.delivery_time??chosen.delivery_days??0),now,now).run();
   await env.DB.prepare("INSERT OR REPLACE INTO order_payments(order_id,method,installments,installment_amount,total_paid,status,status_detail,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(pid,"pix",1,total,total,String(pay.status||result.status||"created"),String(pay.status_detail||result.status_detail||""),now,now).run();
  }
  return resposta({ok:true,orderId,paymentId,status:pay.status??result.status??"pending",statusDetail:pay.status_detail??result.status_detail??null,amount:total.toFixed(2),qrCode:pix.qr_code||"",qrCodeBase64:pix.qr_code_base64||"",ticketUrl:pix.ticket_url||"",externalReference:referencia,savedToAccount});
 }catch(e){console.error("Criar PIX:",e);return resposta({ok:false,error:"Erro interno ao criar o pagamento."},500)}
}
async function criarPagamentoCartao(request,env){
 try{
  if(!mpConfig(env).accessToken)return resposta({ok:false,error:"Pagamento temporariamente indisponível."},503);
  const dados=await request.json(),deviceId=String(dados.deviceId||"").trim().slice(0,256),nome=String(dados.name||"").trim(),email=String(dados.email||"").trim().toLowerCase(),cpf=String(dados.cpf||"").replace(/\D/g,""),telefone=String(dados.phone||"").replace(/\D/g,""),shipping=dados.shipping&&typeof dados.shipping==="object"?dados.shipping:{};
  const token=String(dados.token||"").trim(),paymentMethodId=String(dados.payment_method_id||dados.paymentMethodId||"").trim(),issuerId=String(dados.issuer_id||dados.issuerId||"").trim(),installments=Number(dados.installments);
  if(nome.length<3)return resposta({ok:false,error:"Informe seu nome completo."},400);
  if(!validEmail(email))return resposta({ok:false,error:"Informe um e-mail válido."},400);
  if(!cpfValido(cpf))return resposta({ok:false,error:"Informe um CPF válido."},400);
  if(!token||!paymentMethodId||!Number.isInteger(installments)||installments<1||installments>12)return resposta({ok:false,error:"Dados do cartão ou parcelamento inválidos."},400);
  const cep=String(shipping.cep||"").replace(/\D/g,"");if(!/^\d{8}$/.test(cep))return resposta({ok:false,error:"CEP inválido."},400);if(!shippingAddressComplete(shipping))return resposta({ok:false,error:"Preencha o endereço completo antes de pagar."},400);
  if(!env.ENVIOECOM_TOKEN)return resposta({ok:false,error:"Serviço de frete temporariamente indisponível."},503);
  await ensureAuthSchema(env);const u=await currentCustomer(request,env);
  if(!u)return resposta({ok:false,requiresLogin:true,error:"Para finalizar a compra, entre ou crie sua conta VALENZA."},401);
  if(!u.email_verified)return resposta({ok:false,requiresVerification:true,error:"Confirme seu e-mail antes de finalizar a compra."},403);
  if(email!==String(u.email||"").toLowerCase())return resposta({ok:false,error:"O e-mail da compra deve ser o mesmo da sua conta VALENZA."},409);
  await seedInventory(env);const items=await canonicalItems(dados.items,env);
  const quoteReq={postal_code_destination:cep,aviso_recebimento:false,include_dropoff_points:true,products:items.map(p=>({weight:p.weight,length:p.length,height:p.height,width:p.width,quantity:p.qty,price:p.price}))};
  const localDelivery=await destinoColatina(cep);
  let chosen,freight;if(localDelivery){if(String(shipping.id||"")!==LOCAL_COLATINA.id)return resposta({ok:false,error:"Calcule o frete novamente para usar a entrega grátis em Colatina."},409);chosen=LOCAL_COLATINA;freight=0}else{const qr=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipping/quote",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","X-Partner-Token":env.ENVIOECOM_TOKEN},body:JSON.stringify(quoteReq)});const qraw=await qr.text();let qd;try{qd=JSON.parse(qraw)}catch{qd=null}if(!qr.ok)return resposta({ok:false,error:"Não foi possível validar o frete."},502);const quotes=Array.isArray(qd?.quotes)?qd.quotes:(Array.isArray(qd)?qd:[]),quoteWanted=String(shipping.id||""),carrierWanted=String(shipping.carrier||shipping.name||"");chosen=quoteWanted?quotes.find(x=>quoteKey(x)===quoteWanted):null;if(!chosen)return resposta({ok:false,error:"A opção de frete mudou. Calcule o frete novamente."},409);if(carrierWanted&&String(chosen.carrier||chosen.company||"")!==carrierWanted)return resposta({ok:false,error:"A opção de frete mudou. Calcule o frete novamente."},409);const quotedFreight=Number(chosen.price??chosen.freight_cost);if(!Number.isFinite(quotedFreight)||quotedFreight<0)return resposta({ok:false,error:"Frete inválido."},409);freight=quotedFreight}const carrier=localDelivery?"Entrega local Valenza":String(chosen.carrier||chosen.company||"Envio Ecom");
  const subtotal=items.reduce((s,x)=>s+x.price*x.qty,0),total=Number((subtotal+freight).toFixed(2));
  for(const it of items){const inv=await env.DB.prepare("SELECT stock FROM inventory WHERE product_id=?").bind(it.id).first();if(Number(inv?.stock||0)<it.qty)return resposta({ok:false,error:it.name+" está sem estoque suficiente."},409)}
  const reserveAt=new Date().toISOString(),reserve=items.map(it=>env.DB.prepare("UPDATE inventory SET stock=stock-?,updated_at=? WHERE product_id=? AND stock>=?").bind(it.qty,reserveAt,it.id,it.qty)),rr=await env.DB.batch(reserve);
  if(rr.some(x=>(x.meta?.changes||0)<1)){for(let i=0;i<items.length;i++)if((rr[i]?.meta?.changes||0)>0)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(items[i].qty,reserveAt,items[i].id).run();return resposta({ok:false,error:"O estoque mudou durante a compra. Tente novamente."},409)}
  const releaseReservation=async()=>{for(const it of items)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(it.qty,new Date().toISOString(),it.id).run()};
  const partes=nome.split(/\s+/).filter(Boolean),referencia=`AUREA-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
  const phoneArea=telefone.length>=10?telefone.slice(0,2):"",phoneNumber=telefone.length>=10?telefone.slice(2):telefone,shippingCityState=String(shipping.cityState||""),shippingParts=shippingCityState.split(/\s*-\s*/),payerCity=String(shipping.city||shippingParts[0]||""),payerState=String(shipping.state||shippingParts[1]||"").toUpperCase().slice(0,2);const payload={type:"online",processing_mode:"automatic",total_amount:total.toFixed(2),external_reference:referencia,config:{online:{transaction_security:{validation:"on_fraud_risk",liability_shift:"required"}}},payer:{email,first_name:partes[0]||nome,last_name:partes.slice(1).join(" ")||partes[0]||nome,identification:{type:"CPF",number:cpf},...(phoneNumber?{phone:{area_code:phoneArea,number:phoneNumber}}:{}),address:{zip_code:cep,street_name:String(shipping.street||""),street_number:String(shipping.number||""),neighborhood:String(shipping.neighborhood||""),city:payerCity,state:payerState,...(String(shipping.complement||"").trim()?{complement:String(shipping.complement).trim()}:{})}},items:items.map(it=>({external_code:it.id,title:it.name,type:it.type||"Perfume",description:`${it.brand||""} ${it.name}`.trim(),picture_url:it.img||"",category_id:"beauty",quantity:it.qty,unit_price:Number(it.price).toFixed(2)})),transactions:{payments:[{amount:total.toFixed(2),payment_method:{id:paymentMethodId,type:"credit_card",token,installments}}]}};
  
  const mp=await fetch("https://api.mercadopago.com/v1/orders",{method:"POST",headers:{Authorization:`Bearer ${mpConfig(env).accessToken}`,"Content-Type":"application/json",Accept:"application/json","X-Idempotency-Key":crypto.randomUUID(),...(deviceId?{"X-meli-session-id":deviceId}:{})},body:JSON.stringify(payload)});
  const raw=await mp.text();let result;try{result=JSON.parse(raw)}catch{result={}};
  const tx=result?.transactions?.payments?.[0]||{};
  if(!mp.ok||!result.id){await releaseReservation();const detail=result?.status_detail||tx?.status_detail||result?.error||null;return resposta({ok:false,error:result?.message?`Mercado Pago: ${result.message}`:"Não foi possível processar o cartão.",statusDetail:detail,cause:Array.isArray(result?.errors)?result.errors.slice(0,3):null},mp.status>=400&&mp.status<500?400:502)}
  const now=new Date().toISOString(),pid=String(result.id),txStatus=String(tx.status||result.status||""),txDetail=String(tx.status_detail||result.status_detail||""),approved=txStatus==="processed"||txStatus==="approved"||txDetail==="accredited",statusMap={processed:"Pago",processing:"Processando",created:"Processando",action_required:"Aguardando pagamento",failed:"Pagamento recusado",rejected:"Pagamento recusado",canceled:"Cancelado",cancelled:"Cancelado"},status=approved?"Pago":(statusMap[txStatus]||statusMap[result.status]||String(txStatus||result.status||"Processando"));
  await env.DB.prepare("INSERT OR IGNORE INTO orders(id,customer_id,order_number,status,total,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(pid,u.id,referencia,status,total,now,now).run();
  for(const it of items)await env.DB.prepare("INSERT OR IGNORE INTO order_items(id,order_id,product_id,name,brand,type,image,quantity,unit_price,stock_deducted,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),pid,it.id,it.name,it.brand,it.type,it.img,it.qty,it.price,approved?1:0,now).run();
  const chargedTotal=Number(tx?.amount||total),installmentAmount=installments>0?Number((chargedTotal/installments).toFixed(2)):chargedTotal;await env.DB.prepare("INSERT OR REPLACE INTO order_payments(order_id,method,installments,installment_amount,total_paid,status,status_detail,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(pid,"Cartão de crédito",installments,installmentAmount,chargedTotal,txStatus||String(result.status||""),txDetail||String(result.status_detail||""),now,now).run();
  const cs=String(shipping.cityState||""),parts=cs.split(/\s*-\s*/),city=String(shipping.city||parts[0]||""),state=String(shipping.state||parts[1]||"").toUpperCase().slice(0,2);
  await env.DB.prepare("INSERT OR REPLACE INTO order_shipping(order_id,email,customer_name,cpf,phone,cep,street,number,complement,neighborhood,city,state,carrier,freight_cost,delivery_time,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(pid,email,nome,cpf,telefone,cep,String(shipping.street||""),String(shipping.number||""),String(shipping.complement||""),String(shipping.neighborhood||""),city,state,carrier,freight,Number(chosen.delivery_time??chosen.delivery_days??0),now,now).run();
  let shipment=null;if(approved&&!mpConfig(env).testMode)try{shipment=await criarEnvioEnvioEcom(env,pid)}catch(e){console.error("Expedição cartão:",e)}
  if(["failed","canceled"].includes(txStatus)||["failed","canceled"].includes(String(result.status||""))){await releaseReservation();await env.DB.prepare("UPDATE order_items SET stock_deducted=2 WHERE order_id=? AND stock_deducted=0").bind(pid).run();}
  const challengeUrl=String(tx?.payment_method?.transaction_security?.url||"");return resposta({ok:true,orderId:pid,paymentId:pid,status:txStatus||result.status||null,statusDetail:txDetail||result.status_detail||null,challengeUrl:challengeUrl||null,amount:total.toFixed(2),externalReference:referencia,shipping:shipment?{created:!!shipment.ok,barcode:shipment.barcode||null,labelReady:!!shipment.labelReady}:null});
 }catch(e){console.error("Criar cartão:",e);return resposta({ok:false,error:"Erro interno ao processar o cartão."},500)}
}
async function tentarGerarEtiqueta(env,orderId,shippingId,barcode){
 try{
  const body=barcode?{barcodes:[String(barcode)]}:{ids:[Number(shippingId)]};
  const r=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipments/generate-labels",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/pdf","X-Partner-Token":env.ENVIOECOM_TOKEN},body:JSON.stringify(body)});
  if(!r.ok){console.log("Etiqueta ainda não liberada:",r.status);return false}
  const ct=String(r.headers.get("content-type")||"");if(!ct.includes("pdf"))return false;
  await env.DB.prepare("UPDATE order_shipping SET label_ready=1,updated_at=? WHERE order_id=?").bind(new Date().toISOString(),orderId).run();return true;
 }catch(e){console.error("Gerar etiqueta:",e);return false}
}
async function reconcileStalePixReservations(env){
 try{
  await ensureAuthSchema(env);const cfg=mpConfig(env);if(!cfg.accessToken)return;
  const cutoff=new Date(Date.now()-40*60e3).toISOString();
  const rows=await env.DB.prepare("SELECT order_id FROM order_payments WHERE lower(method)='pix' AND created_at<? AND lower(COALESCE(status,'')) IN ('','created','pending','processing','action_required') ORDER BY created_at ASC LIMIT 20").bind(cutoff).all();
  for(const row of (rows.results||[])){
   const id=String(row.order_id||"");if(!id)continue;
   try{
    const r=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}});
    if(!r.ok)continue;
    const d=await r.json(),tx=d?.transactions?.payments?.[0]||{},st=String(tx.status||d.status||"").toLowerCase(),detail=String(tx.status_detail||d.status_detail||""),approved=["processed","approved"].includes(st)||detail==="accredited",now=new Date().toISOString();
    if(approved){
     await env.DB.batch([env.DB.prepare("UPDATE orders SET status='Pago',updated_at=? WHERE id=?").bind(now,id),env.DB.prepare("UPDATE guest_orders SET status='Pago',updated_at=? WHERE id=?").bind(now,id),env.DB.prepare("UPDATE order_payments SET status=?,status_detail=?,updated_at=? WHERE order_id=?").bind(st||"approved",detail,now,id),env.DB.prepare("UPDATE order_items SET stock_deducted=1 WHERE order_id=? AND stock_deducted=0").bind(id)]);
     if(!cfg.testMode)try{await criarEnvioEnvioEcom(env,id)}catch(e){console.error("Reconciliação PIX expedição:",e)}
    }else if(["failed","rejected","canceled","cancelled","expired"].includes(st)){
     await releaseReservedStock(env,id,now);
     const label=st==="expired"?"Expirado":(["canceled","cancelled"].includes(st)?"Cancelado":"Pagamento recusado");
     await env.DB.batch([env.DB.prepare("UPDATE orders SET status=?,updated_at=? WHERE id=?").bind(label,now,id),env.DB.prepare("UPDATE guest_orders SET status=?,updated_at=? WHERE id=?").bind(label,now,id),env.DB.prepare("UPDATE order_payments SET status=?,status_detail=?,updated_at=? WHERE order_id=?").bind(st,detail,now,id)]);
    }
   }catch(e){console.error("Reconciliação PIX item:",id,e)}
  }
 }catch(e){console.error("Reconciliação PIX:",e)}
}
async function webhookMercadoPago(request,env){try{const body=await request.json().catch(()=>({}));const id=String(body?.data?.id||body?.id||"");if(!id)return resposta({ok:true});await ensureAuthSchema(env);const local=await env.DB.prepare("SELECT id FROM orders WHERE id=? UNION SELECT id FROM guest_orders WHERE id=? LIMIT 1").bind(id,id).first();if(!local)return resposta({ok:true});const cfg=mpConfig(env);if(!cfg.accessToken)return resposta({ok:false,error:"Mercado Pago não configurado."},503);const r=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}});if(!r.ok)return resposta({ok:true});const d=await r.json(),tx=d?.transactions?.payments?.[0]||{},st=String(tx.status||d.status||""),detail=String(tx.status_detail||d.status_detail||""),approved=st==="processed"||st==="approved"||detail==="accredited",pid=String(d.id||id),now=new Date().toISOString();const label=approved?"Pago":({processing:"Processando",created:"Aguardando pagamento",action_required:"Aguardando pagamento",pending:"Aguardando pagamento",failed:"Pagamento recusado",rejected:"Pagamento recusado",canceled:"Cancelado",cancelled:"Cancelado"}[st]||"Processando");await env.DB.prepare("UPDATE orders SET status=? WHERE id=?").bind(label,pid).run();await env.DB.prepare("UPDATE guest_orders SET status=? WHERE id=?").bind(label,pid).run();await env.DB.prepare("UPDATE order_payments SET status=?,status_detail=?,updated_at=? WHERE order_id=?").bind(st,detail,now,pid).run();if(approved){await env.DB.prepare("UPDATE order_items SET stock_deducted=1 WHERE order_id=? AND stock_deducted=0").bind(pid).run();if(!cfg.testMode)try{await criarEnvioEnvioEcom(env,pid)}catch(e){console.error("Webhook expedição:",e)}}else if(["failed","rejected","canceled","cancelled","expired"].includes(st)){await releaseReservedStock(env,pid,now)}return resposta({ok:true})}catch(e){console.error("Webhook Mercado Pago:",e);return resposta({ok:true})}}
async function criarEnvioEnvioEcom(env,orderId){
 await ensureAuthSchema(env);
 if(!env.ENVIOECOM_TOKEN)return {ok:false,error:"Token EnvioEcom ausente"};const originCep=String(env.ENVIOECOM_ORIGIN_CEP||"").replace(/\D/g,"");if(originCep.length!==8)return {ok:false,error:"CEP de origem da postagem não configurado"};
 await ensureAuthSchema(env);const sh=await env.DB.prepare("SELECT * FROM order_shipping WHERE order_id=?").bind(orderId).first();if(!sh)return {ok:false,error:"Dados de envio não encontrados"};
 if(sh.shipping_id){const ready=Number(sh.label_ready)||await tentarGerarEtiqueta(env,orderId,sh.shipping_id,sh.barcode);return {ok:true,shippingId:sh.shipping_id,barcode:sh.barcode,existing:true,labelReady:!!ready}}
 if(String(sh.carrier||"")==="Entrega local Valenza")return {ok:true,localDelivery:true};
 if(!sh.carrier||!sh.cep||!sh.street||!sh.number||!sh.city||!sh.state)return {ok:false,error:"Dados de entrega incompletos"};
 const oldLock=await env.DB.prepare("SELECT state,updated_at FROM shipment_locks WHERE order_id=?").bind(String(orderId)).first();if(oldLock?.state==="creating"&&Date.parse(oldLock.updated_at||"0")<Date.now()-10*60e3)await env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=?").bind(String(orderId)).run();const lockNow=new Date().toISOString();const lk=await env.DB.prepare("INSERT OR IGNORE INTO shipment_locks(order_id,state,created_at,updated_at) VALUES(?,?,?,?)").bind(String(orderId),"creating",lockNow,lockNow).run();if((lk.meta?.changes||0)<1){const again=await env.DB.prepare("SELECT shipping_id,barcode,label_ready FROM order_shipping WHERE order_id=?").bind(orderId).first();if(again?.shipping_id)return {ok:true,shippingId:again.shipping_id,barcode:again.barcode,existing:true,labelReady:!!again.label_ready};return {ok:false,pending:true,error:"Postagem já está sendo preparada"}}
 const oi=await env.DB.prepare("SELECT product_id,name,quantity,unit_price FROM order_items WHERE order_id=?").bind(orderId).all(),items=oi.results||[];if(!items.length)return {ok:false,error:"Itens do pedido não encontrados"};
 const ord=await env.DB.prepare("SELECT order_number,total FROM orders WHERE id=? UNION SELECT order_number,total FROM guest_orders WHERE id=? LIMIT 1").bind(orderId,orderId).first();if(!ord)return {ok:false,error:"Pedido não encontrado"};
 const catalog=await officialCatalog(env);let weight=0,height=0,width=0,length=0;for(const x of items){const p=catalog[x.product_id];if(!p)continue;weight+=p.weight*Number(x.quantity);height+=p.height*Number(x.quantity);width=Math.max(width,p.width);length=Math.max(length,p.length)}height=Math.max(5,Math.min(height,100));
 const payload={shipments:[{orderId:String(ord.order_number||orderId),shipping_company:String(sh.carrier),cep_origem:originCep,cep_destino:String(sh.cep),freight_cost:Number(sh.freight_cost||0).toFixed(2),delivery_time:String(Number(sh.delivery_time)||0),height:String(height),width:String(width||16),length:String(length||20),weight:Number(weight||.6).toFixed(3),cost:Number(ord.total||0).toFixed(2),name:String(sh.customer_name||""),document_number:String(sh.cpf||""),phone_number:String(sh.phone||""),email:String(sh.email||""),logradouro:String(sh.street||""),number:String(sh.number||""),complemento:String(sh.complement||""),bairro:String(sh.neighborhood||""),localidade:String(sh.city||""),uf:String(sh.state||""),items:items.map(x=>({name:String(x.name),quantity:Number(x.quantity)||1,unit_cost:Number(x.unit_price)||0}))}]};
 let r,raw;try{r=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipping/create",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","X-Partner-Token":env.ENVIOECOM_TOKEN},body:JSON.stringify(payload)});raw=await r.text()}catch(e){await env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=?").bind(orderId).run();throw e}let d;try{d=JSON.parse(raw)}catch{d=null}
 if(!r.ok){await env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=?").bind(orderId).run();console.error("EnvioEcom create:",r.status,raw.slice(0,1000));return {ok:false,error:"EnvioEcom recusou a criação do envio",status:r.status}}
 const x=Array.isArray(d)?d[0]:(Array.isArray(d?.shipments)?d.shipments[0]:(d?.data?.[0]||d?.shipment||d)),sid=x?.shipping_id??x?.id??null,barcode=x?.barcode??x?.tracking_code??null;if(!sid){await env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=?").bind(orderId).run();return {ok:false,error:"Envio criado sem identificador"}};
 const now=new Date().toISOString();await env.DB.batch([env.DB.prepare("UPDATE order_shipping SET shipping_id=?,barcode=?,updated_at=? WHERE order_id=? AND shipping_id IS NULL").bind(String(sid),barcode?String(barcode):null,now,orderId),env.DB.prepare("UPDATE orders SET tracking_code=?,carrier=?,updated_at=? WHERE id=?").bind(barcode?String(barcode):null,String(sh.carrier),now,orderId),env.DB.prepare("UPDATE guest_orders SET tracking_code=?,carrier=?,updated_at=? WHERE id=?").bind(barcode?String(barcode):null,String(sh.carrier),now,orderId)]);
 await env.DB.prepare("UPDATE shipment_locks SET state=?,updated_at=? WHERE order_id=?").bind("created",new Date().toISOString(),orderId).run();const labelReady=await tentarGerarEtiqueta(env,orderId,sid,barcode);return {ok:true,shippingId:String(sid),barcode:barcode?String(barcode):null,labelReady};
}
async function consultarPagamento(request,orderId,env){
 try{
  if(!orderId)return resposta({ok:false,error:"ID de pagamento inválido."},400);
  const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);
  const own=await env.DB.prepare("SELECT id FROM orders WHERE id=? AND customer_id=? UNION SELECT id FROM guest_orders WHERE id=? AND lower(email)=lower(?) LIMIT 1").bind(String(orderId),u.id,String(orderId),u.email).first();
  if(!own)return resposta({ok:false,error:"Pedido não encontrado na sua conta."},404);
  return consultarPagamentoCore(orderId,env);
 }catch(e){console.error("Autorização consulta pagamento:",e);return resposta({ok:false,error:"Não foi possível consultar este pagamento."},500)}
}
async function consultarPagamentoCore(orderId,env){
 if(!orderId)return resposta({ok:false,error:"ID de pagamento inválido."},400);const cfg=mpConfig(env);if(!cfg.accessToken)return resposta({ok:false,error:"Pagamento temporariamente indisponível."},503);
 try{
  await ensureAuthSchema(env);const card=await env.DB.prepare("SELECT order_id FROM order_payments WHERE order_id=?").bind(String(orderId)).first();
  if(card){
   const mp=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}}),raw=await mp.text();let result;try{result=JSON.parse(raw)}catch{result={}}if(!mp.ok)return resposta({ok:false,error:"Não foi possível consultar o pedido no Mercado Pago."},502);
   const tx=result?.transactions?.payments?.[0]||{},st=String(tx.status||result.status||""),detail=String(tx.status_detail||result.status_detail||""),approved=st==="processed"||st==="approved"||detail==="accredited",map={processed:"Pago",approved:"Pago",processing:"Processando",created:"Aguardando pagamento",action_required:"Aguardando pagamento",pending:"Aguardando pagamento",failed:"Pagamento recusado",rejected:"Pagamento recusado",canceled:"Cancelado",cancelled:"Cancelado",expired:"Expirado"},label=approved?"Pago":(map[st]||"Processando"),now=new Date().toISOString(),pid=String(result.id||orderId);
   await env.DB.batch([env.DB.prepare("UPDATE orders SET status=?,updated_at=? WHERE id=?").bind(label,now,pid),env.DB.prepare("UPDATE guest_orders SET status=?,updated_at=? WHERE id=?").bind(label,now,pid),env.DB.prepare("UPDATE order_payments SET status=?,status_detail=?,updated_at=? WHERE order_id=?").bind(st,detail,now,pid)]);
   if(approved){await env.DB.prepare("UPDATE order_items SET stock_deducted=1 WHERE order_id=? AND stock_deducted=0").bind(pid).run();if(!cfg.testMode)try{await criarEnvioEnvioEcom(env,pid)}catch(e){console.error("Consulta expedição:",e)}}
   else if(["failed","rejected","canceled","cancelled","expired"].includes(st)){await releaseReservedStock(env,pid,now)}
   return resposta({ok:true,orderId:pid,status:approved?"approved":st,statusDetail:detail,paymentId:pid,shipping:null});
  }
  if(!/^\d+$/.test(String(orderId)))return resposta({ok:false,error:"ID de pagamento inválido."},400);
  const mp=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(orderId)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}}),raw=await mp.text();let result;try{result=JSON.parse(raw)}catch{result={}}if(!mp.ok)return resposta({ok:false,error:"Não foi possível consultar o pagamento."},502);
  const map={approved:"Pago",pending:"Aguardando pagamento",in_process:"Processando",rejected:"Pagamento recusado",cancelled:"Cancelado",expired:"Expirado",refunded:"Reembolsado"},label=map[result.status]||String(result.status||"Aguardando pagamento"),now=new Date().toISOString(),pid=String(result.id??orderId);
  await env.DB.batch([env.DB.prepare("UPDATE orders SET status=?,updated_at=? WHERE id=?").bind(label,now,pid),env.DB.prepare("UPDATE guest_orders SET status=?,updated_at=? WHERE id=?").bind(label,now,pid)]);
  if(result.status==="approved"){await env.DB.prepare("UPDATE order_items SET stock_deducted=1 WHERE order_id=? AND stock_deducted=0").bind(pid).run();if(!cfg.testMode)try{await criarEnvioEnvioEcom(env,pid)}catch(e){console.error("Consulta expedição legacy:",e)}}
  else if(["cancelled","rejected","expired"].includes(result.status)){await releaseReservedStock(env,pid,now)}
  return resposta({ok:true,orderId:pid,status:result.status??null,statusDetail:result.status_detail??null,paymentId:pid,shipping:null});
 }catch(e){console.error("Consultar pagamento:",e);return resposta({ok:false,error:"Erro ao consultar pagamento."},500)}
}
function cpfValido(cpf){if(!/^\d{11}$/.test(cpf)||/^([0-9])\1+$/.test(cpf))return false;let sum=0;for(let i=0;i<9;i++)sum+=Number(cpf[i])*(10-i);let d1=(sum*10)%11;if(d1===10)d1=0;if(d1!==Number(cpf[9]))return false;sum=0;for(let i=0;i<10;i++)sum+=Number(cpf[i])*(11-i);let d2=(sum*10)%11;if(d2===10)d2=0;return d2===Number(cpf[10])}
function resposta(dados,status=200){return new Response(JSON.stringify(dados),{status,headers:jsonHeaders})}
