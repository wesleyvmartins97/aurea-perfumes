// Automatic quote lookup through TinyFish Fetch – activates with a private API key.
const VQA_PREFIX="valenza:quotation:v1:";
const VQA_BASE="https://api.comprasparaguai.com.br";
const VQA_FETCH="https://api.fetch.tinyfish.ai";
const VQA_NO=/\b(?:kit|body\s*splash|ambientador|aromatizador|desodorante|deodorant|deo|mist|spray\s+de\s+ambiente|perfume\s+de\s+ambiente|decant|amostra|tester|refil|refill|oil|creme|hidratante|freshener|sabonete|shower|gel|hair|miniatura)\b/i;
const VQA_VARIANTS=["very","blush","elixir","pistache","banoffi","intense","intenso","supreme","glam","glitter","bowtastic","jasmine","absolute","crystal","collector","exclusive","exclusif","legere","platinum","victory","aquatic","nectar","royal","oud","rose","aqua","gold","red","black","white","pink","blue","green"];
const VQA_SHOPS=["star company","shopping china","cellshop","paris store","mega eletronicos","la petisquera","nissei","intershop importados","multipass","new zone","mega eletro","best shop paraguai","elegancia company","boxi importados"];
function vqaClean(s){return vqNormal(s).replace(/\s+/g," ").trim()}
function vqaMatch(name,volume,title){
 const want=vqaClean(name),text=vqaClean(title),tokens=text.split(" "),required=vqWords(want);
 if(!want||!/\bperfume\b/.test(text)||VQA_NO.test(text)||required.length<1)return false;
 if(!new RegExp("(?:^|\\s)"+Number(volume)+"\\s?ml(?:$|\\s)","i").test(text))return false;
 if(required.some(w=>!tokens.includes(w)))return false;
 for(const w of VQA_VARIANTS){const word=vqaClean(w);if(tokens.includes(word)&&!want.split(" ").includes(word))return false}
 if(/\b(?:edt|eau de toilette)\b/.test(want)&&!/\b(?:edt|eau de toilette)\b/.test(text))return false;
 if(/\b(?:edp|eau de parfum)\b/.test(want)&&!/\b(?:edp|eau de parfum)\b/.test(text))return false;
 return true;
}
function vqaParse(raw){
 const s=String(raw||"").replace(/\\([_*~])/g,"$1").trim();
 if(s.length<2||s.length>350000||s[0]!=="{")throw Error("Resposta de pesquisa inválida");
 return JSON.parse(s);
}
async function vqaRead(env,url){
 if(!env.TINYFISH_API_KEY)return null;
 const dest=new URL(url);
 if(dest.protocol!=="https:"||dest.host!=="api.comprasparaguai.com.br")throw Error("Fonte não autorizada");
 const r=await fetch(VQA_FETCH,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":env.TINYFISH_API_KEY},body:JSON.stringify({urls:[dest.toString()],format:"markdown",ttl:0,links:false,image_links:false}),signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error("Pesquisa indisponível: "+r.status);
 const body=await r.json();
 const page=body?.results?.[0];
 if(!page||!page.text)throw Error("Sem dados verificáveis");
 return vqaParse(page.text);
}
async function vqaFind(env,name,volume){
 const key=VQA_PREFIX+"auto:"+vqNormal(name).replace(/\s+/g,"-")+":"+volume;
 const cached=await env.PRIVATE_KV.get(key,"json");
 if(cached&&cached.validUntil>Date.now()&&Number(cached.salePrice)>0)return cached;
 const list=await vqaRead(env,VQA_BASE+"/busca/?q="+encodeURIComponent(name+" "+volume+"ml"));
 const rows=(Array.isArray(list?.resultados)?list.resultados:[]).filter(x=>x&&!x.ocultar_preco&&vqaMatch(name,volume,x.nome||"")&&Number(x.preco_dolar)>0&&Number(x.preco_dolar)<=2000&&/^\/[a-z0-9_-]+\/$/.test(String(x.link||"")));
 if(!rows.length)throw Error("Nenhum modelo exato encontrado");
 const scores=rows.map(x=>({item:x,score:vqaClean(x.nome).split(" ").length-vqaClean(name).split(" ").length})).sort((a,b)=>a.score-b.score||Number(a.item.preco_dolar)-Number(b.item.preco_dolar));
 if(scores.length>1&&scores[0].score===scores[1].score&&scores[0].item.id!==scores[1].item.id)throw Error("Versões parecidas");
 const model=scores[0].item;
 const details=await vqaRead(env,VQA_BASE+model.link);
 if(!details||!vqaMatch(name,volume,details.nome||""))throw Error("Descrição não corresponde");
 const stamp=Date.parse(details.data_ultima_disponibilidade||"");
 if(!Number.isFinite(stamp)||Date.now()-stamp>259200000||stamp>Date.now()+28800000)throw Error("Cotação antiga");
 const offers=(Array.isArray(details.produtos)?details.produtos:[]).filter(p=>p&&!p.ocultar_preco&&Number(p.preco_dolar)>0&&Number(p.preco_dolar)<=2000&&VQA_SHOPS.includes(vqaClean(p.loja?.nome))&&!VQA_NO.test(String(p.nome||"")));
 if(!offers.length)throw Error("Não há oferta recente de fornecedor conhecido");
 const offer=offers.sort((a,b)=>Number(a.preco_dolar)-Number(b.preco_dolar))[0];
 const price=vqPrice(Number(offer.preco_dolar),40);
 const q={name:details.nome,volume:Number(volume),usd:Number(offer.preco_dolar),salePrice:price.price,pixPrice:price.pix,store:offer.loja.nome,productUrl:"https://www.comprasparaguai.com.br"+model.link,verifiedAt:new Date().toISOString(),sourceLastUpdate:details.data_ultima_disponibilidade,validUntil:Date.now()+3600000,preliminary:true};
 await env.PRIVATE_KV.put(key,JSON.stringify(q),{expirationTtl:3600});
 return q;
}
async function vqaReply(env,name,volume){
 if(!env.TINYFISH_API_KEY)return null;
 try{
  const q=await vqaFind(env,name,volume);
  await env.PRIVATE_KV.put(VQA_PREFIX+"auto_status",JSON.stringify({at:new Date().toISOString(),state:"quoted",model:q.name}),{expirationTtl:604800});
  return{type:"draft",text:"Consegui uma cotação para "+q.name+": "+vqMoney(q.salePrice)+"! 💛 É sob encomenda e confirmamos a disponibilidade antes do pagamento. Quer finalizar pelo nosso WhatsApp?"};
 }catch(e){
  await env.PRIVATE_KV.put(VQA_PREFIX+"auto_status",JSON.stringify({at:new Date().toISOString(),state:"unverified",error:String(e?.message||e).slice(0,100)}),{expirationTtl:604800});
  return null;
 }
}
