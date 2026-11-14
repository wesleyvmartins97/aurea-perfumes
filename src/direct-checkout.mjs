// Private Direct orders. Quotes are server-authenticated; prices never come from browser fields.
const VDC_COOKIE='valenza_direct_quote';
const vdcToken=t=>/^direct-[a-f0-9]{48}$/.test(String(t||''));
async function vdcSchema(env){await env.DB.prepare('CREATE TABLE IF NOT EXISTS direct_checkout_quotes (id TEXT PRIMARY KEY,request_key TEXT UNIQUE NOT NULL,payload TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at TEXT NOT NULL)').run();}
async function vdcRead(env,id){if(!vdcToken(id))return null;await vdcSchema(env);const r=await env.DB.prepare('SELECT payload,expires_at FROM direct_checkout_quotes WHERE id=?').bind(id).first();if(!r||Number(r.expires_at)<Date.now())return null;return {...JSON.parse(r.payload),id};}
function vdcCookie(request){return String(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(VDC_COOKIE+'='))?.slice(VDC_COOKIE.length+1)||'';}
function vdcProduct(q){return {id:q.id,name:q.name,brand:q.brand||'',type:q.volume+' ml · Sob encomenda',price:q.price,weight:.6,length:20,height:12,width:16,img:q.img||'/brand/valenza-card.webp',offer:true,active:true,cat:'unissex',collection:'arabes',desc:'Encomenda solicitada pelo Instagram. Preparação em até 10 dias úteis antes da postagem.'};}
function vdcJson(value,status=200,headers={}){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});}
async function vdcSession(request,env){const p=new URL(request.url).pathname;if(!/^\/api\/(?:catalog\/runtime|frete|pagamento|cart|checkout|opportunities)/.test(p))return env;const q=await vdcRead(env,vdcCookie(request));return q?{...env,__DIRECT_QUOTE:q}:env;}
async function vdcCreate(request,env){
 if(!env.DIRECT_COMMERCE_SECRET||request.headers.get('authorization')!=='Bearer '+env.DIRECT_COMMERCE_SECRET)return vdcJson({ok:false,error:'Não autorizado.'},401);
 let b;try{b=await request.json()}catch{return vdcJson({ok:false},400)}
 const name=String(b.name||'').trim(),price=Number(b.price),volume=Number(b.volume),key=String(b.requestKey||''),expiry=Math.min(Number(b.validUntil)||0,Date.now()+3600000);
 let source;try{source=new URL(b.source)}catch{return vdcJson({ok:false,error:'Origem inválida.'},400)}
 if(name.length<4||name.length>180||!Number.isFinite(price)||price<30||price>20000||!Number.isInteger(volume)||volume<10||volume>250||!/^[a-f0-9]{64}$/.test(key)||expiry<Date.now()+60000||source.protocol!=='https:'||source.hostname!=='www.comprasparaguai.com.br'||!/^\/[a-z0-9_-]+\/$/.test(source.pathname)||b.supplierConfirmed!==true)return vdcJson({ok:false,error:'Cotação ainda não validada para compra.'},409);
 await vdcSchema(env);const existing=await env.DB.prepare('SELECT id FROM direct_checkout_quotes WHERE request_key=? AND expires_at>?').bind(key,Date.now()).first();
 if(existing)return vdcJson({ok:true,id:existing.id,url:'https://www.valenzaparfums.com.br/api/direct/open/'+existing.id});
 let img='';try{const u=new URL(b.img);if(u.protocol==='https:'&&!u.username&&!u.password)img=u.toString()}catch{}
 const id='direct-'+[...crypto.getRandomValues(new Uint8Array(24))].map(x=>x.toString(16).padStart(2,'0')).join(''),now=new Date().toISOString();
 const q={id,name,price:Number(price.toFixed(2)),volume,source:source.toString(),img,brand:String(b.brand||'').slice(0,80),maxQty:1,expiresAt:expiry};
 await env.DB.batch([env.DB.prepare('INSERT INTO direct_checkout_quotes(id,request_key,payload,expires_at,created_at) VALUES(?,?,?,?,?)').bind(id,key,JSON.stringify(q),expiry,now),env.DB.prepare('INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?)').bind(id,1,now)]);
 return vdcJson({ok:true,id,url:'https://www.valenzaparfums.com.br/api/direct/open/'+id});
}
async function vdcOpen(request,env,id){
 const q=await vdcRead(env,id);if(!q)return new Response('Esta cotação expirou. Peça uma nova consulta no Instagram.',{status:410,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 const target=new URL('/index.html',request.url),asset=await env.ASSETS.fetch(new Request(target));if(!asset.ok)return new Response('Não foi possível abrir o checkout.',{status:503});
 const item={...vdcProduct(q),img:q.img||'/brand/valenza-card.webp',qty:1},safe=JSON.stringify(item).replace(/</g,'\\u003c');
 const before='<script>localStorage.setItem("aurea_cart",JSON.stringify(['+safe+']));</script>';
 const after=`<script>window.addEventListener('load',async()=>{try{const params=new URL(location.href).searchParams;await refreshProductPromotions({redraw:true});openCart();for(const link of document.querySelectorAll('#cartContent a'))link.removeAttribute('href');const p=document.getElementById('cep');const initial=params.get('cep');if(initial&&/^\\d{8}$/.test(initial)){p.value=initial.slice(0,5)+'-'+initial.slice(5);await shipping();const wanted=params.get('frete');const index=(window.aureaFretes||[]).findIndex(x=>String(x.id)===wanted);if(index>=0){const radio=document.querySelectorAll('input[name=aureaShipping]')[index];if(radio)radio.checked=true;selectShipping(index);}}}catch(e){console.error('Encomenda',e)}});</script>`;
 let html=await asset.text();html=html.replace(/if\(!birthDate\)\{showError\('Informe sua data de nascimento\.'\);return null\}/g,'').replace(/if\(!birthDate\)return showError\('Informe sua data de nascimento\.'\);/g,'').replace(/<div class="field"><label>Data de nascimento<\/label><input id="birthDate"[^>]*><\/div>/g,'<input id="birthDate" type="hidden" value="">');html=html.replace('<head>','<head><meta name="robots" content="noindex,nofollow">'+before).replace('</body>',after+'</body>');
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Set-Cookie':VDC_COOKIE+'='+q.id+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Content-Security-Policy':"frame-ancestors 'self'",'Strict-Transport-Security':'max-age=31536000; includeSubDomains'}});
}
async function vdcFreight(request,env,calculate){
 if(!env.DIRECT_COMMERCE_SECRET||request.headers.get('authorization')!=='Bearer '+env.DIRECT_COMMERCE_SECRET)return vdcJson({ok:false},401);
 const b=await request.json(),q=await vdcRead(env,b.id);if(!q)return vdcJson({ok:false,error:'Cotação expirada.'},410);
 return calculate(new Request('https://www.valenzaparfums.com.br/api/frete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cep:b.cep,produtos:[{id:q.id,qty:1,price:q.price}]})}),{...env,__DIRECT_QUOTE:q});
}
async function vdcPrepare(request,env,deps){const p=new URL(request.url).pathname;
 if(p==='/api/direct/create'&&request.method==='POST')return {response:await vdcCreate(request,env)};
 if(p==='/api/direct/freight'&&request.method==='POST')return {response:await vdcFreight(request,env,deps.calcularFrete)};
 const m=p.match(/^\/api\/direct\/open\/(direct-[a-f0-9]{48})$/);if(m&&request.method==='GET')return {response:await vdcOpen(request,env,m[1])};
 return {env:await vdcSession(request,env)};
}
async function vdcCanonicalItems(raw,env,original){
 if(!Array.isArray(raw)||!raw.some(x=>String(x?.id||'').startsWith('direct-')))return original(raw,env);
 const q=env.__DIRECT_QUOTE;if(!q||q.expiresAt<Date.now()||raw.length!==1||raw[0].id!==q.id||Number(raw[0].qty)!==1)throw Error('Cotação inválida ou expirada.');
 return [{...vdcProduct(q),qty:1,regularPrice:q.price,promotionId:null,priceChanged:Number(raw[0].price)!==Number(q.price)}];
}
async function vdcRuntime(env,original){const response=await original(env);if(!response.ok||!env.__DIRECT_QUOTE)return response;const q=env.__DIRECT_QUOTE,d=await response.json(),inv=await env.DB.prepare('SELECT stock FROM inventory WHERE product_id=?').bind(q.id).first();d.catalog.push(vdcProduct(q));d.products.push({id:q.id,price:q.price,stock:Math.max(0,Number(inv?.stock)||0),active:true});return vdcJson(d);}
async function vdcShippingProduct(env,id){if(!vdcToken(id))return null;const row=await env.DB.prepare('SELECT payload FROM direct_checkout_quotes WHERE id=?').bind(id).first();if(!row)return null;return vdcProduct({...JSON.parse(row.payload),id});}
export {vdcPrepare,vdcCanonicalItems,vdcRuntime,vdcShippingProduct};
