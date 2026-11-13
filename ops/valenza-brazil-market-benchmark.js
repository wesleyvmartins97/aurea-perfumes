// Brazilian retail market benchmark for Valenza, optional and fail-closed.
// Preserves minimum 40% margin on Pix; never chooses a higher price from a single high listing.
// Browser Run daily quota is shared with Compras Paraguai queries.
const VBM_PREFIX="valenza:quotation:v1:market:";
function vbmSlug(text){return String(text||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function vbmName(name,volume){
 let x=vbmSlug(name).replace(/^perfume-/,"").replace(/-\d{2,3}-?ml$/,"");
 return x;
}
function vbmUrls(name,volume){
 const base=vbmName(name,volume);
 const gender=/unissex/.test(base)?"feminino":/(masculino)/.test(base)?"masculino":"feminino";
 const radar=base.replace(/-(unissex|feminino|masculino)$/,"")+"-"+gender+"-"+volume+"-ml";
 const pharma=base.replace(/-(unissex|feminino|masculino)$/,"")+
  "-perfume-"+(/unissex|feminino|masculino/.exec(base)?.[0]||"unissex")+"-"+volume+"ml";
 return[
  {kind:"radar",url:"https://radardeperfumes.com.br/perfume/"+radar},
  {kind:"cliquefarma",url:"https://www.cliquefarma.com.br/preco/"+pharma}
 ];
}
function vbmParseMoney(text){
 const m=String(text||"").match(/R\$\s*([\d.]+(?:,\d{2})?)/);
 if(!m)return null;
 const v=Number(m[1].replace(/\./g,"").replace(",","."));
 return Number.isFinite(v)&&v>=25&&v<=15000?v:null;
}
function vbmMatch(name,volume,text){
 const norm=vqaClean(text).slice(0,600),required=vqWords(name);
 if(!required.length||!required.every(w=>norm.split(" ").includes(w)))return false;
 if(!new RegExp("(?:^|\\s)"+volume+"\\s*ml(?:$|\\s)","i").test(norm))return false;
 const want=vqaClean(name),tokens=norm.split(" ");
 for(const word of VQA_VARIANTS){const w=vqaClean(word);if(w.length>3&&tokens.includes(w)&&!want.split(" ").includes(w))return false}
 if(/(?:eau de parfum|edp)\b/i.test(name)&&!/(?:eau de parfum|edp)\b/i.test(norm))return false;
 if(/(?:eau de toilette|edt)\b/i.test(name)&&!/(?:eau de toilette|edt)\b/i.test(norm))return false;
 if(/body\s*splash|decant|miniatura|tester/i.test(norm))return false;
 return true;
}
function vbmExtract(kind,markdown,name,volume){
 const t=String(markdown||"");
 if(t.length<500||t.length>120000||/access denied|acesso negado|captcha|error 403/i.test(t.slice(0,600)))return null;
 const desc=t.match(/meta:[\s\S]{0,1300}?description:\s*["']?([^\n]+)/i)?.[1]||"";
 const title=t.match(/^title:\s*["']?([^\n]+)/im)?.[1]||"";
 const h1=t.match(/^#\s+([^\n]+)/m)?.[1]||"";
 const head=[desc,title,h1].filter(Boolean).join(" ");
 if(!vbmMatch(name,volume,head))return null;
 let price=null;
 if(kind==="radar"){
  const excerpt=t.slice(0,2100);
  const match=excerpt.match(/melhor pre[cç]o de hoje\s*(R\$\s*[\d.,]+)/i);
  if(!match)return null;
  price=vbmParseMoney(match[1]);
  const date=excerpt.match(/\((\d{2})\/(\d{2})\/(\d{4})\)/);
  if(!date)return null;
  const fetched=Date.UTC(Number(date[3]),Number(date[2])-1,Number(date[1]));
  if(Math.abs(Date.now()-fetched)>48*3600000)return null;
 }else if(kind==="cliquefarma"){
  const i=t.indexOf("MENOR PREÇO");
  if(i<0||i>5000)return null;
  const excerpt=t.slice(i,i+240);
  price=vbmParseMoney(excerpt);
 }else return null;
 return price?{kind,price,at:new Date().toISOString()}:null;
}
async function vbmBrowser(env,url){
 const parsed=new URL(url);
 if(parsed.protocol!=="https:"||!["radardeperfumes.com.br","www.cliquefarma.com.br"].includes(parsed.hostname))return null;
 const quota=VQA_PREFIX+"browser_quota:"+new Date().toISOString().slice(0,10);
 const used=Number(await env.PRIVATE_KV.get(quota)||0);
 if(used>=10)return null;
 await env.PRIVATE_KV.put(quota,String(used+1),{expirationTtl:90000});
 const cooldown=VQA_PREFIX+"browser_last";
 const last=Number(await env.PRIVATE_KV.get(cooldown)||0);
 const delay=Math.max(0,11500-(Date.now()-last));
 if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
 await env.PRIVATE_KV.put(cooldown,String(Date.now()),{expirationTtl:120});
 const res=await env.BROWSER.quickAction("markdown",{url,gotoOptions:{waitUntil:"domcontentloaded",timeout:12000},actionTimeout:10000});
 if(!res?.ok)return null;
 const raw=await res.text();
 let body;try{body=JSON.parse(raw)}catch{body={result:raw}}
 return String(body.result||raw);
}
function vbmDecide(basePrice,pixDiscount,offers){
 const low=Math.min(...offers.map(x=>x.price));
 // No price increase unless two INDEPENDENT Brazilian comparators confirm room.
 const desired=Math.floor((low*.95-.01)/10)*10+9.90;
 const protectedPrice=Math.round(Math.max(basePrice,Math.min(desired,basePrice*1.25))*100)/100;
 return protectedPrice>basePrice+9.99?protectedPrice:basePrice;
}
async function vbmCompetitivePrice(env,name,volume,base){
 const floor=Number(base?.salePrice||0);
 if(!floor||!env.BROWSER?.quickAction)return{price:floor,marketVerified:false};
 const key=VBM_PREFIX+vbmSlug(name)+":"+volume;
 const cached=await env.PRIVATE_KV.get(key,"json");
 if(cached&&cached.expires>Date.now()&&cached.floor===floor)return cached;
 const countKey=VBM_PREFIX+"attempts:"+new Date().toISOString().slice(0,10);
 const used=Number(await env.PRIVATE_KV.get(countKey)||0);
 if(used>=2)return{price:floor,marketVerified:false,reason:"daily_benchmark_cap"};
 await env.PRIVATE_KV.put(countKey,String(used+1),{expirationTtl:90000});
 const offers=[];
 for(const entry of vbmUrls(name,volume)){
  try{
   const text=await vbmBrowser(env,entry.url);
   const offer=vbmExtract(entry.kind,text,name,volume);
   if(offer)offers.push(offer);
  }catch(e){}
 }
 const price=offers.length===2?vbmDecide(floor,.05,offers):floor;
 const result={price,marketVerified:offers.length===2,floor,comparisons:offers,at:new Date().toISOString(),expires:Date.now()+12*3600000};
 await env.PRIVATE_KV.put(key,JSON.stringify(result),{expirationTtl:43200});
 return result;
}
