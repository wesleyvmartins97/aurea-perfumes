const jsonHeaders={"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Methods":"GET, POST, OPTIONS"};

export default{async fetch(request,env){
 const url=new URL(request.url);
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:jsonHeaders});
 if(url.pathname==="/api/health"&&request.method==="GET")return resposta({ok:true,service:"aurea-perfumes",timestamp:new Date().toISOString()});
 if(url.pathname==="/api/auth/register"&&request.method==="POST")return authRegister(request,env);
 if(url.pathname==="/api/auth/login"&&request.method==="POST")return authLogin(request,env);
 if(url.pathname==="/api/auth/me"&&request.method==="GET")return authMe(request,env);
 if(url.pathname==="/api/auth/logout"&&request.method==="POST")return authLogout(request,env);
 if(url.pathname==="/api/auth/verify"&&request.method==="GET")return authVerify(url,env);
 if(url.pathname==="/api/account"&&request.method==="GET")return accountData(request,env);
 if(url.pathname==="/api/account/profile"&&request.method==="POST")return accountProfile(request,env);
 if(url.pathname==="/api/account/addresses"&&request.method==="POST")return accountAddressSave(request,env);
 if(url.pathname.startsWith("/api/account/addresses/")&&request.method==="POST")return accountAddressDelete(request,env,url.pathname.split("/").pop());
 if(url.pathname==="/api/frete"&&request.method==="POST")return calcularFrete(request,env);
 if(url.pathname==="/api/pagamento"&&request.method==="POST")return criarPagamentoPix(request,env);
 if(url.pathname.startsWith("/api/pagamento/")&&request.method==="GET")return consultarPagamento(url.pathname.slice("/api/pagamento/".length).trim(),env);
 if(env.ASSETS)return servirAssets(request,env);
 return new Response("AURÉA",{status:404,headers:{"Content-Type":"text/plain; charset=UTF-8"}});
}};

async function ensureAuthSchema(env){
 if(!env.DB)throw new Error("Banco D1 não conectado.");
 await env.DB.batch([
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, email_verified INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_sessions (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS email_verifications (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_sessions_token ON customer_sessions(token_hash)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_verify_token ON email_verifications(token_hash)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_profiles (customer_id TEXT PRIMARY KEY, phone TEXT, cpf TEXT, birth_date TEXT, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_addresses (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, label TEXT NOT NULL DEFAULT 'Principal', recipient TEXT NOT NULL, cep TEXT NOT NULL, street TEXT NOT NULL, number TEXT NOT NULL, complement TEXT, neighborhood TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL, is_default INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_addresses_customer ON customer_addresses(customer_id)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, order_number TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'Aguardando pagamento', total REAL NOT NULL DEFAULT 0, tracking_code TEXT, tracking_url TEXT, carrier TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)")
 ]);
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
function cookieToken(request){const c=request.headers.get("Cookie")||"";const m=c.match(/(?:^|;\s*)aurea_session=([^;]+)/);return m?decodeURIComponent(m[1]):""}
function sessionCookie(token,maxAge=2592000){return "aurea_session="+encodeURIComponent(token)+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+maxAge}
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
 try{const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:env.AUREA_EMAIL_FROM||"AURÉA Perfumes <onboarding@resend.dev>",to:[email],subject:"Confirme sua conta na AURÉA Perfumes",html:'<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1>AURÉA Perfumes</h1><p>Olá, '+escapeHtml(name)+'.</p><p>Confirme seu e-mail para ativar sua conta.</p><p><a style="display:inline-block;padding:13px 20px;background:#171513;color:#fff;text-decoration:none" href="'+escapeHtml(url)+'">CONFIRMAR MEU E-MAIL</a></p><p>Este link expira em 24 horas.</p></div>'})});if(!r.ok){const detail=await r.text();console.error("Resend:",r.status,detail);return {ok:false,status:r.status,detail}}return {ok:true}}catch(e){console.error("Resend:",e);return {ok:false,error:String(e&&e.message||e)}}
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function authVerify(url,env){
 try{await ensureAuthSchema(env);const token=url.searchParams.get("token")||"";if(!token)return htmlMsg("Link inválido","O link de confirmação está incompleto.",false);const th=await sha256(token);const row=await env.DB.prepare("SELECT id,customer_id,expires_at FROM email_verifications WHERE token_hash=?").bind(th).first();if(!row||Date.parse(row.expires_at)<Date.now())return htmlMsg("Link expirado","Este link de confirmação não é mais válido.",false);await env.DB.batch([env.DB.prepare("UPDATE customers SET email_verified=1,updated_at=? WHERE id=?").bind(new Date().toISOString(),row.customer_id),env.DB.prepare("DELETE FROM email_verifications WHERE customer_id=?").bind(row.customer_id)]);return htmlMsg("E-mail confirmado!","Sua conta AURÉA está ativa. Volte à loja e faça seu login.",true);
 }catch(e){return htmlMsg("Não foi possível confirmar","Tente novamente mais tarde.",false)}
}
function htmlMsg(title,msg,ok){return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AURÉA</title><body style="margin:0;background:#f8f5f1;font-family:Arial;color:#171513"><main style="max-width:560px;margin:12vh auto;background:#fff;padding:42px;text-align:center;border:1px solid #e7e1da"><div style="font:24px Georgia;letter-spacing:5px">AURÉA</div><h1 style="font:32px Georgia">'+escapeHtml(title)+'</h1><p>'+escapeHtml(msg)+'</p><a href="/" style="display:inline-block;margin-top:15px;background:#171513;color:white;padding:13px 20px;text-decoration:none">VOLTAR À LOJA</a></main></body>',{status:ok?200:400,headers:{"Content-Type":"text/html; charset=UTF-8","Cache-Control":"no-store"}})}
async function authLogin(request,env){
 try{await ensureAuthSchema(env);const d=await request.json();const email=String(d.email||"").trim().toLowerCase(),pass=String(d.password||"");const u=await env.DB.prepare("SELECT id,name,email,password_hash,password_salt,email_verified FROM customers WHERE email=?").bind(email).first();if(!u)return resposta({ok:false,error:"E-mail ou senha incorretos."},401);let hp;try{hp=await hashPassword(pass,u.password_salt)}catch(e){hp={hash:await sha256(u.password_salt+":"+pass)}}if(hp.hash!==u.password_hash)return resposta({ok:false,error:"E-mail ou senha incorretos."},401);if(!u.email_verified)return resposta({ok:false,error:"Confirme seu e-mail antes de entrar."},403);
 const token=randomToken(),th=await sha256(token),now=new Date().toISOString(),exp=new Date(Date.now()+30*86400e3).toISOString();await env.DB.prepare("INSERT INTO customer_sessions(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),u.id,th,exp,now).run();const h=new Headers(jsonHeaders);h.set("Set-Cookie",sessionCookie(token));return new Response(JSON.stringify({ok:true,user:{name:u.name,email:u.email}}),{status:200,headers:h});
 }catch(e){console.error("Login:",e);return resposta({ok:false,error:"Não foi possível entrar agora."},500)}
}
async function authMe(request,env){
 try{await ensureAuthSchema(env);const t=cookieToken(request);if(!t)return resposta({ok:false,user:null},401);const th=await sha256(t);const u=await env.DB.prepare("SELECT c.id,c.name,c.email,c.email_verified,s.expires_at FROM customer_sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=?").bind(th).first();if(!u||Date.parse(u.expires_at)<Date.now())return resposta({ok:false,user:null},401);return resposta({ok:true,user:{name:u.name,email:u.email,emailVerified:!!u.email_verified}});
 }catch(e){return resposta({ok:false,user:null},500)}
}
async function authLogout(request,env){try{await ensureAuthSchema(env);const t=cookieToken(request);if(t)await env.DB.prepare("DELETE FROM customer_sessions WHERE token_hash=?").bind(await sha256(t)).run();const h=new Headers(jsonHeaders);h.set("Set-Cookie",sessionCookie("",0));return new Response(JSON.stringify({ok:true}),{headers:h})}catch(e){return resposta({ok:true})}}


async function currentCustomer(request,env){await ensureAuthSchema(env);const t=cookieToken(request);if(!t)return null;const th=await sha256(t);const u=await env.DB.prepare("SELECT c.id,c.name,c.email,c.email_verified,s.expires_at FROM customer_sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=?").bind(th).first();if(!u||Date.parse(u.expires_at)<Date.now())return null;return u}
async function accountData(request,env){try{const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login para acessar sua conta."},401);const p=await env.DB.prepare("SELECT phone,cpf,birth_date FROM customer_profiles WHERE customer_id=?").bind(u.id).first();const a=await env.DB.prepare("SELECT id,label,recipient,cep,street,number,complement,neighborhood,city,state,is_default FROM customer_addresses WHERE customer_id=? ORDER BY is_default DESC,created_at DESC").bind(u.id).all();const o=await env.DB.prepare("SELECT id,order_number,status,total,tracking_code,tracking_url,carrier,created_at FROM orders WHERE customer_id=? ORDER BY created_at DESC LIMIT 50").bind(u.id).all();return resposta({ok:true,user:{name:u.name,email:u.email,emailVerified:!!u.email_verified,phone:p?.phone||"",cpf:p?.cpf||"",birthDate:p?.birth_date||""},addresses:a.results||[],orders:o.results||[]})}catch(e){console.error("Conta:",e);return resposta({ok:false,error:"Não foi possível carregar sua conta."},500)}}
async function accountProfile(request,env){try{const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);const d=await request.json(),name=String(d.name||"").trim(),phone=String(d.phone||"").replace(/\D/g,"").slice(0,11),cpf=String(d.cpf||"").replace(/\D/g,"").slice(0,11),birth=String(d.birthDate||"").trim();if(name.length<3)return resposta({ok:false,error:"Informe seu nome completo."},400);const now=new Date().toISOString();await env.DB.batch([env.DB.prepare("UPDATE customers SET name=?,updated_at=? WHERE id=?").bind(name,now,u.id),env.DB.prepare("INSERT INTO customer_profiles(customer_id,phone,cpf,birth_date,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(customer_id) DO UPDATE SET phone=excluded.phone,cpf=excluded.cpf,birth_date=excluded.birth_date,updated_at=excluded.updated_at").bind(u.id,phone,cpf,birth,now)]);return resposta({ok:true,message:"Dados salvos."})}catch(e){return resposta({ok:false,error:"Não foi possível salvar seus dados."},500)}}
async function accountAddressSave(request,env){try{const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);const d=await request.json();const v={label:String(d.label||"Principal").trim(),recipient:String(d.recipient||u.name).trim(),cep:String(d.cep||"").replace(/\D/g,""),street:String(d.street||"").trim(),number:String(d.number||"").trim(),complement:String(d.complement||"").trim(),neighborhood:String(d.neighborhood||"").trim(),city:String(d.city||"").trim(),state:String(d.state||"").trim().toUpperCase().slice(0,2)};if(v.cep.length!==8||!v.street||!v.number||!v.neighborhood||!v.city||v.state.length!==2)return resposta({ok:false,error:"Preencha o endereço completo."},400);const now=new Date().toISOString(),id=String(d.id||"").trim()||crypto.randomUUID(),def=d.isDefault?1:0;if(def)await env.DB.prepare("UPDATE customer_addresses SET is_default=0 WHERE customer_id=?").bind(u.id).run();const own=await env.DB.prepare("SELECT id FROM customer_addresses WHERE id=? AND customer_id=?").bind(id,u.id).first();if(own)await env.DB.prepare("UPDATE customer_addresses SET label=?,recipient=?,cep=?,street=?,number=?,complement=?,neighborhood=?,city=?,state=?,is_default=?,updated_at=? WHERE id=? AND customer_id=?").bind(v.label,v.recipient,v.cep,v.street,v.number,v.complement,v.neighborhood,v.city,v.state,def,now,id,u.id).run();else await env.DB.prepare("INSERT INTO customer_addresses(id,customer_id,label,recipient,cep,street,number,complement,neighborhood,city,state,is_default,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,u.id,v.label,v.recipient,v.cep,v.street,v.number,v.complement,v.neighborhood,v.city,v.state,def,now,now).run();return resposta({ok:true,message:"Endereço salvo."})}catch(e){console.error("Endereco:",e);return resposta({ok:false,error:"Não foi possível salvar o endereço."},500)}}
async function accountAddressDelete(request,env,id){try{const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);await env.DB.prepare("DELETE FROM customer_addresses WHERE id=? AND customer_id=?").bind(id,u.id).run();return resposta({ok:true})}catch(e){return resposta({ok:false,error:"Não foi possível excluir o endereço."},500)}}
async function servirAssets(request,env){const response=await env.ASSETS.fetch(request);const contentType=response.headers.get("content-type")||"";if(!contentType.includes("text/html")||new URL(request.url).pathname!=="/")return response;const html=await response.text();const injected=html.replace(/<\/body>/i,'<script src="/catalog.js?v=aurea20260925"></script></body>');const headers=new Headers(response.headers);headers.set("Cache-Control","no-store, max-age=0, must-revalidate");headers.delete("ETag");return new Response(injected,{status:response.status,statusText:response.statusText,headers})}
async function calcularFrete(request,env){
 try{
  const dados=await request.json();
  const cep=String(dados.cep||"").replace(/\D/g,"");
  if(!/^\d{8}$/.test(cep))return resposta({ok:false,error:"CEP inválido."},400);
  if(!env.ENVIOECOM_TOKEN)return resposta({ok:false,error:"Serviço de frete temporariamente indisponível."},503);
  const produtos=Array.isArray(dados.produtos)&&dados.produtos.length?dados.produtos:[dados.produto||{}];
  const itens=produtos.map(p=>({
   weight:saneDim(p.peso??p.weight,0.5),
   length:saneDim(p.comprimento??p.length,16),
   height:saneDim(p.altura??p.height,5),
   width:saneDim(p.largura??p.width,12),
   quantity:Math.max(1,Math.floor(Number(p.quantidade??p.qty??1))),
   price:Math.max(0,Number(p.valor??p.price??0))
  }));
  const upstream=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipping/quote",{
   method:"POST",
   headers:{"Content-Type":"application/json","Accept":"application/json","X-Partner-Token":env.ENVIOECOM_TOKEN},
   body:JSON.stringify({postal_code_destination:cep,aviso_recebimento:false,include_dropoff_points:true,products:itens})
  });
  const raw=await upstream.text();let data;try{data=JSON.parse(raw)}catch{data=null}
  if(!upstream.ok){console.error("EnvioEcom quote:",upstream.status,raw.slice(0,500));return resposta({ok:false,error:"Não foi possível calcular o frete agora."},502)}
  const quotes=Array.isArray(data)?data:Array.isArray(data?.quotes)?data.quotes:[];
  const fretes=quotes.map((x,index)=>({
   id:x.id??x.service_id??("envioecom-"+(index+1)),
   company:String(x.carrier||x.company||"Envio Ecom"),
   name:String(x.carrier||x.name||x.service||"Frete"),
   carrier:String(x.carrier||x.company||""),
   price:Number(x.price??x.freight_cost??0),
   delivery_time:Number(x.delivery_time??x.delivery_days??0),
   dropoff_points:x.dropoff_points||[]
  })).filter(x=>Number.isFinite(x.price)&&x.price>=0);
  return resposta({ok:true,provider:"envioecom",fretes});
 }catch(e){console.error("EnvioEcom:",e);return resposta({ok:false,error:"Erro interno ao calcular o frete."},500)}
}
function saneDim(value,fallback){const n=Number(value);return Number.isFinite(n)&&n>0?n:fallback}
async function criarPagamentoPix(request,env){try{if(!env.MERCADOPAGO_ACCESS_TOKEN)return resposta({ok:false,error:"Pagamento temporariamente indisponível."},503);const dados=await request.json();const nome=String(dados.name||"").trim(),email=String(dados.email||"").trim().toLowerCase(),cpf=String(dados.cpf||"").replace(/\D/g,""),telefone=String(dados.phone||"").replace(/\D/g,""),total=Number(dados.total);if(String(dados.paymentMethod||"").toLowerCase()!=="pix")return resposta({ok:false,error:"Método de pagamento não disponível."},400);if(nome.length<3)return resposta({ok:false,error:"Informe seu nome completo."},400);if(!validEmail(email))return resposta({ok:false,error:"Informe um e-mail válido."},400);if(!cpfValido(cpf))return resposta({ok:false,error:"Informe um CPF válido."},400);if(!Number.isFinite(total)||total<=0||total>100000)return resposta({ok:false,error:"Valor do pedido inválido."},400);const partes=nome.split(/\s+/).filter(Boolean),referencia=`AUREA-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;const payload={transaction_amount:Number(total.toFixed(2)),description:`Pedido AURÉA Perfumes - ${referencia}`,payment_method_id:"pix",external_reference:referencia,payer:{email,first_name:partes[0],last_name:partes.slice(1).join(" ")||"AUREA",identification:{type:"CPF",number:cpf}}};if(telefone.length>=10)payload.payer.phone={area_code:telefone.slice(0,2),number:telefone.slice(2)};const mp=await fetch("https://api.mercadopago.com/v1/payments",{method:"POST",headers:{Authorization:`Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,"Content-Type":"application/json",Accept:"application/json","X-Idempotency-Key":referencia},body:JSON.stringify(payload)});const raw=await mp.text();let result;try{result=JSON.parse(raw)}catch{result={}}if(!mp.ok)return resposta({ok:false,error:"O Mercado Pago não autorizou a criação do pagamento."},502);const qr=result?.point_of_interaction?.transaction_data||{};return resposta({ok:true,orderId:result.id??null,paymentId:result.id??null,status:result.status??"pending",statusDetail:result.status_detail??null,amount:total.toFixed(2),qrCode:qr.qr_code||"",qrCodeBase64:qr.qr_code_base64||"",ticketUrl:qr.ticket_url||"",externalReference:referencia})}catch(e){return resposta({ok:false,error:"Erro interno ao criar o pagamento."},500)}}
async function consultarPagamento(orderId,env){if(!orderId||!/^\d+$/.test(orderId))return resposta({ok:false,error:"ID de pagamento inválido."},400);if(!env.MERCADOPAGO_ACCESS_TOKEN)return resposta({ok:false,error:"Pagamento temporariamente indisponível."},503);try{const mp=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(orderId)}`,{headers:{Authorization:`Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,Accept:"application/json"}});const raw=await mp.text();let result;try{result=JSON.parse(raw)}catch{result={}}if(!mp.ok)return resposta({ok:false,error:"Não foi possível consultar o pagamento."},502);return resposta({ok:true,orderId:result.id??orderId,status:result.status??null,statusDetail:result.status_detail??null,paymentId:result.id??null})}catch(e){return resposta({ok:false,error:"Erro ao consultar pagamento."},500)}}
function cpfValido(cpf){if(!/^\d{11}$/.test(cpf)||/^([0-9])\1+$/.test(cpf))return false;let sum=0;for(let i=0;i<9;i++)sum+=Number(cpf[i])*(10-i);let d1=(sum*10)%11;if(d1===10)d1=0;if(d1!==Number(cpf[9]))return false;sum=0;for(let i=0;i<10;i++)sum+=Number(cpf[i])*(11-i);let d2=(sum*10)%11;if(d2===10)d2=0;return d2===Number(cpf[10])}
function resposta(dados,status=200){return new Response(JSON.stringify(dados),{status,headers:jsonHeaders})}
