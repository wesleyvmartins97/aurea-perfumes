// Valenza Concierge V2 — natural catalog-backed suggestions and safe deferred quotes.
// No TinyFish, local Windows, paid services, external credentials, or live-message test.
const VC_PREFIX="valenza:concierge:v2:";
const VC_PRODUCTS={
 "eclaire":"Eclaire","yara-elixir":"Yara Elixir","yara-candy":"Yara Candy","yara":"Yara","vanilla-voyage":"Vanilla Voyage","designer-black-opium":"Black Opium","designer-good-girl":"Good Girl","designer-la-vie-est-belle":"La Vie Est Belle","khamrah":"Khamrah","khamrah-qahwa":"Khamrah Qahwa","designer-libre":"Libre","designer-scandal":"Scandal","designer-jadore":"J'adore","designer-my-way":"My Way","delilah":"Delilah","fakhar-rose":"Fakhar Rose","designer-light-blue":"Light Blue","designer-acqua-di-gio":"Acqua di Giò","designer-invictus":"Invictus","designer-sauvage":"Sauvage","designer-versace-eros":"Versace Eros","hawas-ice":"Hawas Ice","club-de-nuit-intense-man":"Club de Nuit Intense Man","designer-miss-dior":"Miss Dior","designer-linterdit":"L'Interdit"
};
function vcPlain(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
function vcWords(s){return vcPlain(s).split(" ").filter(x=>x.length>2&&!["lattafa","carolina","herrera","perfume","feminino","masculino","eau","de","parfum","toilette","frasco","marca","desse","dessa","o","a"].includes(x))}
async function vcCatalog(env){
 const cacheKey=VC_PREFIX+"catalog";
 const cache=await env.PRIVATE_KV.get(cacheKey,"json");
 if(cache?.at&&Date.now()-Date.parse(cache.at)<6*3600000&&Array.isArray(cache.products)&&cache.products.length>20)return cache;
 let products=null,source="website";
 try{
  const response=await fetch("https://valenzaparfums.com.br/api/catalog/runtime",{headers:{Accept:"application/json"},signal:AbortSignal.timeout(5000)});
  if(response.ok){const j=await response.json();if(Array.isArray(j.products)&&j.products.length>20)products=j.products}
 }catch(e){}
 if(!products&&env.BROWSER?.quickAction){
  try{
   const day=new Date().toISOString().slice(0,10);
   const key=VQA_PREFIX+"browser_quota:"+day;
   const used=Number(await env.PRIVATE_KV.get(key)||0);
   if(used<18){
    await env.PRIVATE_KV.put(key,String(used+1),{expirationTtl:90000});
    const r=await env.BROWSER.quickAction("markdown",{url:"https://valenzaparfums.com.br/api/catalog/runtime",gotoOptions:{waitUntil:"domcontentloaded",timeout:12000},actionTimeout:10000});
    if(r.ok){
     const raw=await r.text();
     let inner;try{inner=JSON.parse(raw)}catch(e){inner={result:raw}}
     const text=String(inner?.result||raw).replace(/^\x60{3}(?:json)?\s*/,"").replace(/\s*\x60{3}$/,"").trim();
     try{const parsed=JSON.parse(text);if(Array.isArray(parsed.products)&&parsed.products.length>20)products=parsed.products}catch(e){}
     if(!products){products=[...text.matchAll(/"id":"([a-z0-9-]{2,90})","price":(\d{1,6}(?:\.\d{1,2})?),"stock":(\d{1,8}),"active":(true|false)/g)].map(m=>({id:m[1],price:Number(m[2]),stock:Number(m[3]),active:m[4]==="true"}));if(products.length<20)products=null}
     if(products)source="cloud_browser";
    }
   }
  }catch(e){}
 }
 if(products){
  const lean=products.filter(x=>x?.id&&x.active!==false&&Number(x.price)>0).map(x=>({id:String(x.id).slice(0,90),price:Number(x.price),active:true}));
  const newCache={at:new Date().toISOString(),source,products:lean};
  await env.PRIVATE_KV.put(cacheKey,JSON.stringify(newCache),{expirationTtl:172800});
  return newCache;
 }
 return cache?.products?.length>20?cache:null;
}
async function vcCatalogFind(env,name){
 const result=await vcCatalog(env);
 if(!result)return {verified:false,items:[]};
 const words=vcWords(name);
 if(!words.length)return {verified:true,items:[]};
 const matches=result.products.filter(x=>{
  const id=vcPlain(x.id).replace(/^designer /,"");
  const tokens=id.split(" ");
  const desired=words.every(w=>tokens.includes(w));
  if(!desired)return false;
  const extras=["very","blush","elixir","intense","intenso","candy","qahwa","victory","platinum","rose","ice"];
  if(extras.some(w=>tokens.includes(w)&&!words.includes(w)))return false;
  return true;
 });
 return{verified:Date.now()-Date.parse(result.at)<24*3600000,items:matches.slice(0,4),at:result.at};
}
function vcDisplay(id){return VC_PRODUCTS[id]||String(id).replace(/^designer-/,"").replace(/-/g," ").replace(/\b\w/g,x=>x.toUpperCase())}
function vcCatalogAnswer(match,name){
 if(match.items.length===1){
  const p=match.items[0];
  return{type:"draft",text:"Temos "+vcDisplay(p.id)+" no nosso catálogo! 💛 Você pode conferir a versão e o valor aqui: https://valenzaparfums.com.br/perfume/"+encodeURIComponent(p.id)+"/. Se quiser, me fala qual tamanho você procura que eu te ajudo a conferir."};
 }
 if(match.items.length>1){
  return{type:"draft",text:"Encontrei algumas opções desse perfume no nosso catálogo: "+match.items.map(x=>vcDisplay(x.id)).join(", ")+". 💛 Qual versão você está procurando?"};
 }
 return null;
}
async function vcRecommendations(env,msg,history=[]){
 const text=vcPlain([...history.filter(x=>x.role==="user").slice(-3).map(x=>x.content),msg].join(" "));
 if(!/(perfume|indica|indicacao|sugestao|quero|gosto|presente|procuro|recomenda|perfumaria)/.test(text))return "";
 const interests=[];
 if(/baunilha|doce|docinho|gourmand|caramelo/.test(text))interests.push("eclaire","vanilla-voyage","yara-elixir","designer-black-opium","khamrah");
 if(/floral|flor|delicado|delicada/.test(text))interests.push("delilah","fakhar-rose","designer-my-way","designer-jadore");
 if(/fresco|fresquinho|leve|dia a dia|suave/.test(text))interests.push("designer-light-blue","designer-acqua-di-gio","hawas-ice","yara");
 if(/marcante|forte|noite|festa/.test(text))interests.push("designer-good-girl","designer-scandal","designer-libre","designer-black-opium");
 if(/masculino|homem|marido|namorado/.test(text))interests.push("designer-sauvage","designer-invictus","designer-versace-eros","club-de-nuit-intense-man");
 if(/feminino|esposa|mulher|namorada/.test(text)&&!interests.length)interests.push("designer-good-girl","designer-my-way","designer-la-vie-est-belle");
 if(!interests.length)return "";
 const catalog=await vcCatalog(env);
 if(!catalog||Date.now()-Date.parse(catalog.at)>24*3600000)return "";
 const uniques=[...new Set(interests)];
 const picked=uniques.map(id=>catalog.products.find(p=>p.id===id)).filter(Boolean).slice(0,4);
 if(!picked.length)return "";
 return"Produtos efetivamente anunciados no catálogo da Valenza (fonte atualizada): "+picked.map(p=>vcDisplay(p.id)+" — https://valenzaparfums.com.br/perfume/"+p.id+"/").join(" | ")+". Se a pessoa pedir opções, sugira dois ou três modelos dessa lista e explique de modo natural por que combinam com as preferências declaradas, sem inventar pirâmide olfativa ou estoque. Não precisa colocar links de todos no primeiro contato; só mostre links quando a pessoa pedir.";
}
async function vcCatalogCheckForQuote(env,product){
 const res=await vcCatalogFind(env,product.name);
 if(!res.verified)return{status:"unknown"};
 if(res.items.length>0)return{status:"in_catalog",draft:vcCatalogAnswer(res,product.name)};
 return{status:"off_catalog"};
}
function vcNameCandidates(name,volume,rows){
 return (rows||[]).filter(x=>{
  if(!x?.nome||!x.link||x.ocultar_preco)return false;
  const title=String(x.nome||"");
  const match=title.match(/\b(\d{2,3})\s*ML\b/i);
  if(!match)return false;
  const vol=Number(match[1]);
  if(volume&&volume!==vol)return false;
  return vqaMatch(name,vol,title);
 });
}
async function vcQueryMissingVolume(env,name){
 const res=await vqaRead(env,VQA_BASE+"/busca/?q="+encodeURIComponent(name));
 const found=vcNameCandidates(name,0,res?.resultados||[]);
 const sizes=[...new Set(found.map(x=>Number((x.nome||"").match(/\b(\d{2,3})\s*ML\b/i)?.[1]||0)).filter(Boolean))].sort((a,b)=>a-b);
 if(sizes.length===0)return {status:"none"};
 if(sizes.length>1)return {status:"variants",sizes:sizes.slice(0,4)};
 const vol=sizes[0];const offer=await vqaFind(env,name,vol);
 return{status:"quote",offer};
}
async function vcPrepareQuote(env,name,volume){
 const catalog=await vcCatalogCheckForQuote(env,{name,volume});
 if(catalog.status==="in_catalog")return{status:"catalog",text:catalog.draft?.text};
 if(catalog.status==="unknown")return{status:"unverified",text:"Estou conferindo esse perfume, mas não consegui validar o catálogo agora. Prefiro confirmar os detalhes antes de te passar um valor errado. 💛"};
 try{
  const outcome=volume?{status:"quote",offer:await vqaFind(env,name,volume)}:await vcQueryMissingVolume(env,name);
  if(outcome.status==="variants")return {status:"variants",text:"Consegui encontrar anúncios de "+name+" nos tamanhos "+outcome.sizes.map(n=>n+" ml").join(", ")+". 💛 Qual deles você prefere? Aí eu confiro o valor certinho dessa versão."};
  if(outcome.status==="quote"){
   const q=outcome.offer;
   return{status:"quote",text:"Consegui conferir o "+q.name+"! A estimativa fica em "+vqMoney(q.salePrice)+" (ou "+vqMoney(q.pixPrice)+" no Pix). 💛 É sob encomenda, e confirmamos preço e disponibilidade antes do pagamento. Gostou dessa opção?"};
  }
  return{status:"unverified",text:"Procurei esse perfume, mas ainda não consegui confirmar uma oferta confiável. 💛 Posso encaminhar para nossa equipe conferir a versão e a disponibilidade com você."};
 }catch(e){return{status:"unverified",text:"Fui conferir, mas não consegui validar o preço desse perfume agora. 💛 Posso passar para nossa equipe conferir direitinho pelo WhatsApp?"};}
}
async function vcFollowupSend(env,token,recipient,text){
 if(!/^\d+$/.test(String(recipient)))throw Error("Destinatário inválido");
 const response=await fetch("https://graph.facebook.com/"+VERSION+"/"+encodeURIComponent(PAGE_ID)+"/messages",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({recipient:{id:String(recipient)},messaging_type:"RESPONSE",message:{text:String(text).slice(0,920)}}),signal:AbortSignal.timeout(12000)});
 const value=await response.json();
 return{ok:response.ok&&!!value.message_id,status:response.status,code:value?.error?.code||null};
}
async function vcPendingQuotes(env){
 if(await env.PRIVATE_KV.get(VLI+"enabled")!=="yes")return;
 const dir=VLI+"quote_pending:";
 const list=await env.PRIVATE_KV.list({prefix:dir,limit:30});
 if(!list.keys?.length)return;
 const id=await env.PRIVATE_KV.get("instagram:identity","json");
 const sealed=await env.PRIVATE_KV.get(VLI+"page_token");
 if(!sealed||!id?.id||id.username!=="valenza.parfumsimportados")return;
 const token=await ownToken(sealed,env);
 let processed=0;
 for(const item of list.keys){
  if(processed>=1)break;
  const task=await env.PRIVATE_KV.get(item.name,"json");
  if(!task||task.stage!=="queued"||!task.sourceMessage||!task.recipient)continue;
  if(Date.now()-Date.parse(task.at)<5000)continue;
  if(Date.now()-Date.parse(task.at)>22*3600000){await env.PRIVATE_KV.delete(item.name);continue}
  processed++;
  await env.PRIVATE_KV.put(item.name,JSON.stringify({...task,stage:"running",startedAt:new Date().toISOString()}),{expirationTtl:172800});
  let result=null;
  try{
   const msgs=await vliGraph(token,task.chatId+"/messages",{fields:"id,from,created_time",limit:10});
   if(!msgs.ok)throw Error("Não foi possível conferir conversa atual");
   const newest=(msgs.data?.data||[]).filter(m=>m.from?.id&&String(m.from.id)!==String(id.id)).sort((a,b)=>Date.parse(b.created_time)-Date.parse(a.created_time))[0];
   if(!newest||String(newest.id)!==String(task.sourceMessage)){
    result={status:"superseded",at:new Date().toISOString()};await env.PRIVATE_KV.put(VLI+"quote_result:"+task.sourceMessage,JSON.stringify(result),{expirationTtl:604800});
    await env.PRIVATE_KV.delete(item.name);continue;
   }
   result=await vcPrepareQuote(env,task.name,task.volume);
  }catch(e){result={status:"unverified",text:"Estou conferindo, mas a pesquisa não conseguiu confirmar esse perfume agora. 💛 Se quiser, nossa equipe pode ajudar pelo WhatsApp."}}
  try{
   await env.PRIVATE_KV.put(item.name,JSON.stringify({...task,stage:"sending",attemptedAt:new Date().toISOString()}),{expirationTtl:172800});
   const sent=await vcFollowupSend(env,token,task.recipient,result?.text||"Não consegui confirmar o produto no momento. Posso te encaminhar para nossa equipe? 💛");
   const done={at:new Date().toISOString(),status:sent.ok?"delivered":"rejected",resultStatus:result?.status,code:sent.code};
   await env.PRIVATE_KV.put(VLI+"quote_result:"+task.sourceMessage,JSON.stringify(done),{expirationTtl:604800});
   await env.PRIVATE_KV.delete(item.name);
  }catch(e){
   await env.PRIVATE_KV.put(VLI+"quote_result:"+task.sourceMessage,JSON.stringify({at:new Date().toISOString(),status:"send_uncertain",reason:String(e?.message||e).slice(0,100)}),{expirationTtl:604800});
   await env.PRIVATE_KV.delete(item.name);
  }
 }
}
