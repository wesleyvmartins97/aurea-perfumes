// Valenza — cotação de produtos fora do catálogo. Não depende de scraping bloqueado.
// A origem é verificada manualmente pelo admin; preços aprovados expiram em 24h.
const VQ_PREFIX="valenza:quotation:v1:";
const VQ_RATE=5.70;
const VQ_CROSS=40;
const VQ_SHIP=40;
const VQ_PIX_DISCOUNT=0.05;
const VQ_SITE="https://valenzaparfums.com.br";
const VQ_SOURCE="https://www.comprasparaguai.com.br";
function vqNormal(value){
 return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().slice(0,130);
}
function vqKey(name,volume){return VQ_PREFIX+"offer:"+vqNormal(name).replace(/\s+/g,"-")+":"+Number(volume)}
function vqMoney(v){return Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function vqPrice(usd,margin=40){
 const dollars=Number(usd),m=Number(margin);
 if(!Number.isFinite(dollars)||dollars<=0||dollars>2500||![38,40].includes(m))throw Error("Valor ou margem inválido");
 const cost=Number((dollars*VQ_RATE+VQ_CROSS+VQ_SHIP).toFixed(2));
 // Preserva a margem de contribuição pretendida mesmo com 5% de desconto no Pix.
 // Taxas de parcelamento, impostos e outros custos devem ser adicionados se aplicáveis.
 const floor=cost/((1-m/100)*(1-VQ_PIX_DISCOUNT));
 const price=Number((Math.ceil((floor-9.9)/10)*10+9.9).toFixed(2));
 const pix=Number((price*(1-VQ_PIX_DISCOUNT)).toFixed(2));
 return{usd:dollars,rate:VQ_RATE,cross:VQ_CROSS,transport:VQ_SHIP,cost,marginTarget:m,price,pix,pixMargin:Number(((pix-cost)/pix*100).toFixed(2)),floor:Number(floor.toFixed(2))};
}
function vqSafeHtml(t){return esc(String(t||"").slice(0,300))}
function vqWords(name){return vqNormal(name).split(" ").filter(w=>w.length>=4&&!["perfume","feminino","masculino","unissex","lattafa","armaf","alhambra","parfum","eau","toilette","spray","original"].includes(w))}
async function vqExtract(env,msg,history=[]){
 const s=String(msg||"").trim();
 // Só consultar segundo modelo se a pessoa citar produto, valor ou disponibilidade.
 if(!/(perfume|fragr[aâ]ncia|tem (?:o|a)|vende|pre[cç]o|valor|quanto|encomenda|compro|comprar|ml\b|eau|edp|edt)/i.test(s))return null;
 const context=[...history.slice(-5).filter(t=>t.role==="user").map(t=>String(t.content||"")),s].join("\n").slice(-950);
 const prompt="Extraia um perfume ESPECÍFICO e seu volume, a partir de mensagens de cliente. Se falar apenas de preferências como doce ou floral e não citar um nome próprio de perfume, retorne null. Não invente marca, nome, volume ou variante. Responda SOMENTE JSON exatamente no formato {\"name\":\"nome como escrito pelo cliente\",\"volume\":100} ou {\"name\":null,\"volume\":null}. Use apenas dados literalmente presentes nas mensagens. Última mensagem tem prioridade.\nMensagens:\n"+context;
 let parsed;
 try{
  const out=await env.AI.run(VLI_MODEL,{messages:[{role:"system",content:"Extrator conservador de produto específico. JSON apenas. Não invente."},{role:"user",content:prompt}],max_tokens:95,temperature:0,top_p:1});
  const txt=String(out?.response||"");
  const found=txt.match(/\{[\s\S]*?\}/);
  if(!found)return null;
  parsed=JSON.parse(found[0]);
 }catch{return null}
 const name=String(parsed?.name||"").trim().slice(0,95);
 const volume=Number(parsed?.volume||0);
 const expanded=vqNormal(context).replace(/\s+/g,"");
 const check=vqNormal(name).replace(/\s+/g,"");
 if(!name||name.length<5||check.length<5||!expanded.includes(check))return null;
 if(!vqWords(name).length||/^(?:perfume|fragrancia|um perfume|doce|floral|para minha esposa)/i.test(name))return null;
 return{name,volume:Number.isInteger(volume)&&volume>=10&&volume<=250?volume:0};
}
async function vqCatalog(env,name,volume){
 try{
  const r=await fetch(VQ_SITE+"/api/catalog/runtime",{signal:AbortSignal.timeout(6500),headers:{"Accept":"application/json"}});
  if(!r.ok)return null;
  const x=await r.json();
  const wanted=vqWords(name);
  if(!Array.isArray(x.products)||!wanted.length)return null;
  const candidates=x.products.filter(p=>{
   if(p.active===false||!p.id)return false;
   const id=vqNormal(p.id);
   return wanted.every(w=>id.includes(w));
  });
  // Produto tem variantes ambíguas: não escolher automaticamente.
  if(candidates.length!==1)return null;
  const p=candidates[0];
  if(!Number.isFinite(Number(p.price))||Number(p.price)<=0)return null;
  return{id:String(p.id),price:Number(p.price),volume};
 }catch{return null}
}
async function vqAnswer(env,msg,history=[]){
 if(!env.AI?.run)return null;
 const picked=await vqExtract(env,msg,history);
 if(!picked)return null;
 const listing=await vqCatalog(env,picked.name,picked.volume);
 if(listing)return{type:"draft",text:"Esse modelo está no nosso site! 💛 Você pode conferir o preço atualizado aqui: "+VQ_SITE+"/perfume/"+encodeURIComponent(listing.id)+"/"};
 if(!picked.volume)return{type:"draft",text:"Posso conferir esse pra você! 💛 É qual tamanho, 50 ml, 100 ml ou outra versão?"};
 const key=vqKey(picked.name,picked.volume);
 const quote=await env.PRIVATE_KV.get(key,"json");
 if(quote&&quote.expiresAt>Date.now()&&Number(quote.salePrice)>0){
  return{type:"draft",text:"Consegui uma cotação para "+quote.name+" "+quote.volume+" ml: "+vqMoney(quote.salePrice)+". 💛 É sob encomenda e a disponibilidade precisa ser confirmada. Quer finalizar pelo nosso WhatsApp?"};
 }
 const queue=VQ_PREFIX+"request:"+vqNormal(picked.name).replace(/\s+/g,"-")+":"+picked.volume;
 const current=await env.PRIVATE_KV.get(queue,"json")||{};
 await env.PRIVATE_KV.put(queue,JSON.stringify({name:picked.name,volume:picked.volume,firstAsked:current.firstAsked||new Date().toISOString(),lastAsked:new Date().toISOString(),requests:Math.min(500,Number(current.requests||0)+1)}),{expirationTtl:1209600});
 return{type:"draft",text:"Esse modelo consigo consultar sob encomenda. 💛 Vou confirmar o valor e a disponibilidade direitinho antes de te passar o preço, combinado?"};
}
async function vqRoute(req,env,path,method){
 if(!path.startsWith("/social/growth/cotacoes"))return null;
 if(!await isAdmin(req,env))return go("/admin");
 if(path==="/social/growth/cotacoes/salvar"&&method==="POST"){
  if(req.headers.get("Origin")!==new URL(req.url).origin)return json({error:"Origem inválida"},403);
  const f=await req.formData();
  const name=String(f.get("name")||"").trim().slice(0,95);
  const volume=Number(f.get("volume")),usd=Number(String(f.get("usd")||"").replace(",","."));
  const margin=Number(f.get("margin"));
  const source=String(f.get("source")||"").trim();
  let error="";
  if(name.length<5||!vqWords(name).length||!Number.isInteger(volume)||volume<10||volume>250)error="Confira nome e volume do perfume";
  let uri;try{uri=new URL(source);if(uri.protocol!=="https:"||!["www.comprasparaguai.com.br","comprasparaguai.com.br"].includes(uri.hostname))error="Use o link do produto no Compras Paraguai";}catch{error="Link de origem inválido"}
  let formula;try{formula=vqPrice(usd,margin)}catch(e){error=e.message}
  if(error)return html(layout('<h2>Não foi possível salvar</h2><p>'+vqSafeHtml(error)+'</p><a href="/social/growth/cotacoes">Voltar</a>'));
  const saved={name,volume,source:uri.toString(),usd,margin,formula,salePrice:formula.price,approvedAt:new Date().toISOString(),expiresAt:Date.now()+86400000,verifiedBy:"admin",status:"pre_cotacao"};
  await env.PRIVATE_KV.put(vqKey(name,volume),JSON.stringify(saved),{expirationTtl:86400});
  return go("/social/growth/cotacoes");
 }
 if(path!=="/social/growth/cotacoes"||method!=="GET")return null;
 const all=await env.PRIVATE_KV.list({prefix:VQ_PREFIX+"request:",limit:70});
 const rows=[];
 for(const k of (all.keys||[]).slice(0,35)){
  const item=await env.PRIVATE_KV.get(k.name,"json");
  if(item&&item.name)rows.push(item);
 }
 rows.sort((a,b)=>String(b.lastAsked).localeCompare(String(a.lastAsked)));
 let s='<h2>Cotações sob encomenda · Valenza</h2><p>A IA atende naturalmente e registra perfumes fora do catálogo. O Compras Paraguai está bloqueando consultas automáticas da Cloudflare; confirme nome, versão, preço e fornecedor antes de aprovar uma cotação.</p>';
 s+='<p><b>Regra:</b> dólar R$ 5,70 + R$ 40 travessia + R$ 40 transporte; margem de 38% ou 40%, preservada mesmo depois do desconto Pix de 5%. Taxas, tributos e outros custos não incluídos devem ser conferidos.</p>';
 s+='<h3>Pedidos de cotação</h3>';
 if(!rows.length)s+='<p>Sem novos pedidos fora do catálogo.</p>';
 else for(const x of rows){const url=VQ_SOURCE+'/busca/?q='+encodeURIComponent(x.name+' '+x.volume+'ml');s+='<div style="padding:12px;margin:8px 0;border:1px solid #7c6d50;border-radius:9px"><b>'+vqSafeHtml(x.name)+' '+Number(x.volume)+' ml</b> · '+Number(x.requests||1)+' solicitação(ões)<p><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Pesquisar no Compras Paraguai</a></p></div>'}
 s+='<h3>Aprovar uma cotação verificada</h3><p>O preço só será enviado automaticamente se esta cotação for preenchida e confirmada por você; expira em 24 horas.</p>';
 s+='<form method="post" action="/social/growth/cotacoes/salvar"><p><input name="name" required placeholder="Nome exato, marca e versão" style="width:94%;padding:10px"></p><p><input name="volume" type="number" min="10" max="250" required placeholder="Volume em ml" style="padding:10px;width:48%"></p><p><input name="usd" type="number" step="0.01" min="0.01" max="2500" required placeholder="Preço US$" style="padding:10px;width:48%"></p><p>Margem: <select name="margin"><option value="40">40% (padrão)</option><option value="38">38%</option></select></p><p><input name="source" type="url" required placeholder="Link do produto no Compras Paraguai" style="width:94%;padding:10px"></p><button>Aprovar pré-cotação por 24h</button></form>';
 s+='<p><small>Preço exibido ao cliente: apenas valor final, sem dólar, fonte ou custos internos. O atendimento não promete estoque nem prazo exato.</small></p>';
 s+='<p><a href="/social/growth/atendimento">Voltar ao atendimento da IA</a></p>';
 return html(layout(s));
}
