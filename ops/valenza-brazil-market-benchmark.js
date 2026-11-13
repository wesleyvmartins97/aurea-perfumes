// Valenza VBM v2: only direct retail listings from independent Brazilian perfumeries.
// No Shopee, Mercado Livre, marketplaces, pharmacies or price-comparison websites.
// A market uplift is optional and requires THREE verified independent perfumery listings.
// Never go below the 40% gross contribution floor after the advertised Pix discount.
const VBM_PREFIX="valenza:quotation:v2:market:";
const VBM_SHOPS=[
 {id:"charme",domain:"www.charmeperfumaria.com.br",search:"https://www.charmeperfumaria.com.br/search/?q="},
 {id:"ama",domain:"www.amaperfumaria.com.br",search:"https://www.amaperfumaria.com.br/search/?q="},
 {id:"amelias",domain:"www.amelias.com.br",search:"https://www.amelias.com.br/busca?q="}
];
function vbmSlug(x){return String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function vbmSimple(x){return String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
function vbmSameProduct(name,volume,title){
 const txt=vbmSimple(title),wanted=vbmSimple(name);
 if(!txt||!wanted||/body splash|body mist|decant|amostra|tester|miniatura|creme|hidratante|desodorante|kit |conjunto|refil|refill/.test(txt))return false;
 const wantedWords=vqWords(name).filter(w=>!(/^\d{2,3}ml$/.test(w)||/^\d{2,3}$/.test(w)));
 if(!wantedWords.length||wantedWords.some(w=>!txt.split(" ").includes(w)))return false;
 const vol=Number(volume);
 if(!Number.isInteger(vol)||vol<10||vol>250||!new RegExp("(?:^|\\s)"+vol+"\\s*ml(?:\\s|$)","i").test(txt))return false;
 const origin=wanted.split(" "),dest=txt.split(" ");
 for(const variant of VQA_VARIANTS){
  const w=vbmSimple(variant);
  if(w.length>=4&&dest.includes(w)&&!origin.includes(w))return false;
 }
 const edt=/(?:\bedt\b|eau de toilette)/.test(wanted),edp=/(?:\bedp\b|eau de parfum)/.test(wanted);
 if(edt&&!/(?:\bedt\b|eau de toilette)/.test(txt))return false;
 if(edp&&!/(?:\bedp\b|eau de parfum)/.test(txt))return false;
 return true;
}
function vbmKnownLinks(name,volume){
 const s=vbmSimple(name);
 if(volume===100&&s.includes("lattafa")&&s.includes("eclaire")&&s.includes("banoffi")){
  return{
   charme:"https://www.charmeperfumaria.com.br/produtos/eclaire-banoffi-lattafa/",
   ama:"https://www.amaperfumaria.com.br/produtos/perfume-arabe-lattafa-eclaire-banoffi-unissex-100ml/",
   amelias:"https://www.amelias.com.br/lattafa-eclaire-banoffi-edp-100ml"
  };
 }
 return{};
}
function vbmCanonicalUrl(url,shop){
 try{
  const u=new URL(url);
  if(u.protocol!=="https:"||u.hostname!==shop.domain||u.search||u.hash)return null;
  if(shop.id==="amelias"&&!/^\/[a-z0-9][a-z0-9-]*$/.test(u.pathname))return null;
  if(shop.id!=="amelias"&&!/^\/produtos\/[a-z0-9-]+\/$/.test(u.pathname))return null;
  return u.toString();
 }catch(e){return null}
}
function vbmListingUrl(markdown,shop,name,volume){
 // Product link candidates must be on the original perfume store, not a marketplace.
 const s=String(markdown||"");
 if(s.length<450||s.length>130000||/access denied|captcha|forbidden/i.test(s.slice(0,400)))return null;
 const urls=[...s.matchAll(/\[([^\]\n]{8,260})\]\((https:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g)].slice(0,250);
 for(const m of urls){
  const url=vbmCanonicalUrl(m[2],shop);
  if(url&&vbmSameProduct(name,volume,m[1]))return url;
 }
 return null;
}
function vbmMoney(raw){
 const m=String(raw||"").match(/R\$\s*([\d.]+,\d{2})/);
 if(!m)return null;
 const value=Number(m[1].replace(/\./g,"").replace(",","."));
 return Number.isFinite(value)&&value>=40&&value<=25000?value:null;
}
function vbmRetailOffer(markdown,shop,name,volume,url){
 const text=String(markdown||"");
 if(text.length<900||text.length>150000||/access denied|captcha|forbidden/i.test(text.slice(0,600)))return null;
 // Use the actual product H1. Cart prices and related products are never accepted.
 const headings=[...text.matchAll(/^#\s+([^\n]{8,250})/gm)];
 let heading=null;
 for(const h of headings)if(vbmSameProduct(name,volume,h[1])){heading=h;break}
 if(!heading)return null;
 const block=text.slice(heading.index+heading[0].length,heading.index+heading[0].length+850);
 const prices=[...block.matchAll(/R\$\s*[\d.]+,\d{2}/g)].map(m=>({price:vbmMoney(m[0]),at:m.index})).filter(x=>x.price).slice(0,5);
 if(!prices.length)return null;
 // Determine whether the second price is a visible discount. Ignore instalments and coupons.
 const head=block.slice(0,Math.min(300,prices[0].at+150));
 const off=/\b\d{1,2}\s*%\s*OFF\b/i.test(block.slice(0,350))||/~~\s*R\$/.test(block.slice(0,350));
 let sale=prices[0].price;
 if(prices.length>=2&&off&&prices[1].price<prices[0].price&&prices[1].at<310)sale=prices[1].price;
 // A smaller Pix price is not a regular list price. We compare listed item prices consistently.
 return{shop:shop.id,price:sale,title:heading[1].trim(),url,at:new Date().toISOString()};
}
async function vbmOpen(env,url){
 if(!env.BROWSER?.quickAction)return null;
 const u=new URL(url);
 if(u.protocol!=="https:"||!VBM_SHOPS.some(x=>x.domain===u.hostname))return null;
 const day=new Date().toISOString().slice(0,10);
 const quota=VQA_PREFIX+"browser_quota:"+day;
 const used=Number(await env.PRIVATE_KV.get(quota)||0);
 // Preserve some of the free Browser Run allowance for the primary supplier lookup.
 if(used>=9)return null;
 await env.PRIVATE_KV.put(quota,String(used+1),{expirationTtl:90000});
 const lastKey=VQA_PREFIX+"browser_last";
 const before=Number(await env.PRIVATE_KV.get(lastKey)||0);
 const wait=Math.max(0,11500-(Date.now()-before));
 if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
 await env.PRIVATE_KV.put(lastKey,String(Date.now()),{expirationTtl:120});
 const r=await env.BROWSER.quickAction("markdown",{url:u.toString(),gotoOptions:{waitUntil:"domcontentloaded",timeout:12000},actionTimeout:10000});
 if(!r?.ok)return null;
 const raw=await r.text();
 let parsed;try{parsed=JSON.parse(raw)}catch(e){parsed={result:raw}}
 const markdown=String(parsed.result||raw);
 return markdown.length>=100&&markdown.length<150000?markdown:null;
}
function vbmDecide(minimumPrice,offers){
 // 40% from the existing quotation formula is the absolute selling-price floor.
 const floor=Number(minimumPrice);
 if(!Number.isFinite(floor)||floor<=0)return null;
 if(!Array.isArray(offers)||offers.length!==3)return{price:floor,competitive:false,reason:"missing_three_perfumery_prices"};
 const low=Math.min(...offers.map(x=>Number(x.price)));
 if(!Number.isFinite(low))return{price:floor,competitive:false,reason:"unverified_prices"};
 const difference=low-floor;
 // For a large difference, target R$30 under the cheapest retailer; else R$20 or R$10.
 const discount=difference>=45?30:difference>=32?20:difference>=21?10:0;
 const target=discount?Number((Math.ceil((low-discount-9.9)/10)*10+9.9).toFixed(2)):floor;
 const price=Math.max(floor,target);
 return{price,competitive:price<low,cheapest:low,mean:Number((offers.reduce((sum,x)=>sum+Number(x.price),0)/3).toFixed(2)),discountBelowCheapest:Number(Math.max(0,low-price).toFixed(2)),reason:price>=low?"price_floor_above_competitor":"perfumery_market_benchmark"};
}
async function vbmCompetitivePrice(env,name,volume,base){
 const floor=Number(base?.salePrice||0);
 if(!floor||!env.BROWSER?.quickAction)return{price:floor,marketVerified:false};
 const key=VBM_PREFIX+vbmSlug(name)+":"+volume;
 const cached=await env.PRIVATE_KV.get(key,"json");
 if(cached&&cached.validUntil>Date.now()&&cached.floor===floor)return cached;
 const day=new Date().toISOString().slice(0,10);
 const cap=VBM_PREFIX+"requests:"+day;
 const used=Number(await env.PRIVATE_KV.get(cap)||0);
 if(used>=1)return{price:floor,marketVerified:false,reason:"free_daily_market_limit"};
 await env.PRIVATE_KV.put(cap,String(used+1),{expirationTtl:90000});
 const query=encodeURIComponent(name.replace(/\b(?:perfume|unissex|feminino|masculino)\b/gi,"").trim()+" "+volume+"ml");
 const known=vbmKnownLinks(name,volume);
 const offers=[];
 for(const shop of VBM_SHOPS){
  let url=vbmCanonicalUrl(known[shop.id],shop);
  if(!url){
   try{
    const listing=await vbmOpen(env,shop.search+query);
    if(listing)url=vbmListingUrl(listing,shop,name,volume);
   }catch(e){}
  }
  if(!url)continue;
  try{
   const page=await vbmOpen(env,url);
   const offer=page?vbmRetailOffer(page,shop,name,volume,url):null;
   if(offer)offers.push(offer);
  }catch(e){}
 }
 const evaluated=vbmDecide(floor,offers);
 const result={...evaluated,marketVerified:offers.length===3,shops:offers,at:new Date().toISOString(),floor,validUntil:Date.now()+12*3600000};
 await env.PRIVATE_KV.put(key,JSON.stringify(result),{expirationTtl:43200});
 return result;
}
