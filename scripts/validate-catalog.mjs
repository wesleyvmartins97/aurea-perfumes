import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const fail=[];
let catalog=[];
try{
 const src=read('public/products.js');
 catalog=vm.runInNewContext(`${src}\n;CATALOG`,{console});
}catch(e){fail.push(`products.js não pôde ser lido: ${e.message}`)}
if(!Array.isArray(catalog)||!catalog.length)fail.push('CATALOG vazio ou inválido.');

const ids=new Set();
const asadBourbon=catalog.find(p=>p.id==='asad-bourbon');
if(!asadBourbon)fail.push('Asad Bourbon ausente do catálogo.');
else{
 if(Number(asadBourbon.price)!==299.90)fail.push(`Asad Bourbon: preço deve ser R$299,90; encontrado R${Number(asadBourbon.price).toFixed(2)}.`);
 const bourbonPix=Math.floor((Math.round(Number(asadBourbon.price)*100)*95+50)/100)/100;
 if(bourbonPix!==284.91)fail.push(`Asad Bourbon: PIX esperado R$284,91; encontrado R${bourbonPix.toFixed(2)}.`);
 if(asadBourbon.img!=='/produtos/asad-bourbon.webp')fail.push('Asad Bourbon: imagem principal divergente.');
 if(!String(asadBourbon.details||'').includes('Pimenta-Rosa, Lavanda e Ameixa Mirabelle'))fail.push('Asad Bourbon: topo olfativo divergente.');
 if(!String(asadBourbon.details||'').includes('Cacau, Davana e Noz-moscada'))fail.push('Asad Bourbon: corpo olfativo divergente.');
 if(!String(asadBourbon.details||'').includes('Vetiver, Baunilha Bourbon e Âmbar'))fail.push('Asad Bourbon: fundo olfativo divergente.');
}
const asad=catalog.find(p=>p.id==='asad');
if(!asad)fail.push('Asad ausente do catálogo.');
else{
 if(Number(asad.price)!==269.90)fail.push(`Asad: preço deve ser R$269,90; encontrado R${Number(asad.price).toFixed(2)}.`);
 const asadPix=Math.floor((Math.round(Number(asad.price)*100)*95+50)/100)/100;
 if(asadPix!==256.41)fail.push(`Asad: PIX esperado R$256,41; encontrado R${asadPix.toFixed(2)}.`);
}
const requiredText=['id','name','brand','collection','cat','type','img','desc','details'];
const requiredNum=['price','weight','length','height','width'];

for(const p of catalog){
 const tag=p?.id||p?.name||'(sem id)';
 for(const k of requiredText)if(typeof p?.[k]!=='string'||!p[k].trim())fail.push(`${tag}: campo ${k} vazio/ausente.`);
 for(const k of requiredNum)if(!Number.isFinite(Number(p?.[k]))||Number(p[k])<=0)fail.push(`${tag}: campo ${k} inválido.`);
 if(!['arabes','designer'].includes(p.collection))fail.push(`${tag}: collection deve ser arabes ou designer.`);
 if(ids.has(p.id))fail.push(`${tag}: id duplicado.`);
 ids.add(p.id);
 if(/undefined|null/i.test(`${p.name} ${p.brand} ${p.type} ${p.desc} ${p.details}`))fail.push(`${tag}: texto contém undefined/null.`);
 for(const label of ['Topo:','Corpo:','Fundo:'])if(!String(p.details||'').includes(label))fail.push(`${tag}: details sem ${label}`);
 const imagePath='public/'+String(p.img||'').replace(/^\//,'');
 if(p.img&&!fs.existsSync(imagePath))fail.push(`${tag}: imagem não existe (${p.img}).`);
 const page=`public/perfume/${p.id}/index.html`;
 if(!fs.existsSync(page))fail.push(`${tag}: página SEO ausente (${page}).`);
 else{
  const html=read(page);
  if(/undefined|null/i.test(html))fail.push(`${tag}: página SEO contém undefined/null.`);
  if(!html.includes(`/perfume/${p.id}/`))fail.push(`${tag}: canonical/URL SEO não corresponde ao id.`);
  if(!html.includes(`"sku":"${p.id}"`))fail.push(`${tag}: JSON-LD sem SKU correto.`);
  if(!html.includes(p.type))fail.push(`${tag}: tipo/volume da página SEO diverge do catálogo.`);
  if(!html.includes('https://www.valenzaparfums.com.br'+p.img))fail.push(`${tag}: imagem da página SEO diverge do catálogo.`);
  if(!html.includes(`"price":"${Number(p.price).toFixed(2)}"`))fail.push(`${tag}: preço da página SEO diverge do catálogo.`);
  if(/http-equiv=["']refresh/i.test(html))fail.push(`${tag}: página SEO não deve redirecionar automaticamente.`);
  if(!html.includes('"@type":"Product"'))fail.push(`${tag}: página SEO sem Product JSON-LD.`);
  if(!html.includes('"@type":"BreadcrumbList"'))fail.push(`${tag}: página SEO sem BreadcrumbList JSON-LD.`);
  if(!html.includes('"availability":"https://schema.org/InStock"'))fail.push(`${tag}: disponibilidade estruturada deve ser InStock.`);
  if(!html.includes('"logo":"https://www.valenzaparfums.com.br/favicon.png"'))fail.push(`${tag}: seller sem logo estruturado.`);
  if(!html.includes('COMPRAR NA VALENZA'))fail.push(`${tag}: página SEO sem CTA visível.`);
  if(!html.includes('src="/google-commerce.js"'))fail.push(`${tag}: página SEO sem tracking preparado.`);
  if(!html.includes(`valenzaSetCurrentProduct?.("${p.id}")`))fail.push(`${tag}: página SEO sem identificação do produto para tracking.`);
 }
}

const worker=read('src/worker.js');
if(!worker.includes("catalog-stock-v7-asad-bourbon")||!worker.includes('bind("asad-bourbon",100,now)'))fail.push('Asad Bourbon sem seed seguro de estoque no D1.');
const match=worker.match(/const AUREA_CATALOG=(\{[\s\S]*?\n\});\nasync function officialCatalog/);
let official={};
if(!match)fail.push('AUREA_CATALOG não encontrado no Worker.');
else try{official=vm.runInNewContext(`(${match[1]})`)}catch(e){fail.push(`AUREA_CATALOG inválido: ${e.message}`)}

for(const p of catalog){
 const w=official[p.id];
 if(!w){fail.push(`${p.id}: ausente no catálogo oficial do Worker.`);continue}
 for(const k of ['name','brand','type'])if(String(w[k])!==String(p[k]))fail.push(`${p.id}: ${k} diverge entre products.js e Worker.`);
 for(const k of ['price','weight','length','height','width'])if(Number(w[k])!==Number(p[k]))fail.push(`${p.id}: ${k} diverge entre products.js e Worker.`);
}
for(const id of Object.keys(official))if(!ids.has(id))fail.push(`${id}: existe no Worker, mas não em products.js.`);

const merchantFeed=read('public/merchant-feed.xml');
const googleMerchant=read('public/google-merchant.xml');
const asadMerchantBlock=(merchantFeed.match(/<item>[\s\S]*?<g:id>asad<\/g:id>[\s\S]*?<\/item>/)||[])[0]||'';
const asadGoogleMerchantBlock=(googleMerchant.match(/<item>[\s\S]*?<g:id>asad<\/g:id>[\s\S]*?<\/item>/)||[])[0]||'';
if(!asadMerchantBlock.includes('<g:price>269.90 BRL</g:price>'))fail.push('Asad: Merchant principal não está em R$269,90.');
if(!asadGoogleMerchantBlock.includes('<g:price>269.90 BRL</g:price>'))fail.push('Asad: Google Merchant legado não está em R$269,90.');
const sitemap=read('public/sitemap.xml');
for(const p of catalog){
 if(!sitemap.includes(`https://www.valenzaparfums.com.br/perfume/${p.id}/`))fail.push(`${p.id}: ausente no sitemap.`);
 if(!sitemap.includes(`https://www.valenzaparfums.com.br${p.img}`))fail.push(`${p.id}: imagem ausente no sitemap.`);
}
const home=read('public/index.html');
const canonicalHost='https://www.valenzaparfums.com.br';
const oldHost='https://valenzaparfums.com.br';
const seoGenerator=read('scripts/generate-seo.mjs');
const merchantGenerator=read('scripts/generate-merchant.mjs');
const robots=read('public/robots.txt');
if(!home.includes('rel="canonical" href="'+canonicalHost+'/"'))fail.push('Home não usa www como domínio canônico.');
if(home.includes('rel="canonical" href="'+oldHost+'/'))fail.push('Home voltou a usar domínio raiz como canonical.');
if(!sitemap.includes('<loc>'+canonicalHost+'/</loc>'))fail.push('Sitemap não usa www como domínio canônico.');
if(sitemap.includes('<loc>'+oldHost+'/'))fail.push('Sitemap contém URL canônica sem www.');
if(!robots.includes('Sitemap: '+canonicalHost+'/sitemap.xml'))fail.push('robots.txt não aponta para sitemap canônico www.');
if(!seoGenerator.includes("const ROOT='"+canonicalHost+"'"))fail.push('Gerador SEO não está fixado no host www.');
if(!merchantGenerator.includes("const ROOT='"+canonicalHost+"'"))fail.push('Gerador Merchant não está fixado no host www.');
if(!worker.includes('url.hostname==="valenzaparfums.com.br"')||!worker.includes('target.hostname="www.valenzaparfums.com.br"')||!worker.includes('Response.redirect(target.toString(),308)'))fail.push('Worker não força redirecionamento permanente do domínio raiz para www.');
if(!home.includes('"@type":"WebSite"'))fail.push('Home sem WebSite JSON-LD para nome do site.');
if(!home.includes('rel="icon"'))fail.push('Home sem favicon declarado.');
if(!home.includes('try{openProductFromUrl()}'))fail.push('Home não abre ?produto= automaticamente.');
const homeH1=(home.match(/<h1\b/gi)||[]).length;
const homeH1Close=(home.match(/<\/h1>/gi)||[]).length;
if(homeH1!==1||homeH1Close!==1)fail.push(`Home deve conter exatamente um H1 com abertura e fechamento válidos; aberturas e fechamentos de H1: ${homeH1}/${homeH1Close}.`);
if(/<img\b(?=[^>]*src=)(?![^>]*\balt=)[^>]*>/i.test(home))fail.push('Home contém imagem sem atributo alt.');
if(!fs.existsSync('public/favicon.png'))fail.push('favicon.png ausente.');
if(!home.includes('class="photo catalog-photo"'))fail.push('Cards do catálogo sem wrapper catalog-photo isolado.');
if(!home.includes('class="catalog-product-image"'))fail.push('Cards do catálogo sem classe exclusiva de imagem.');
if(!home.includes('class="catalog-order-badge"'))fail.push('Cards do catálogo sem selo exclusivo SOB ENCOMENDA.');
if(home.includes('<span class="tag">SOB ENCOMENDA</span>'))fail.push('Selo antigo genérico .tag voltou ao catálogo e pode quebrar o mobile.');
if(!home.includes('#grid .card>.catalog-photo>.catalog-product-image'))fail.push('CSS autoritativo da imagem do catálogo ausente.');
if(!home.includes('#grid .card>.catalog-photo>.catalog-order-badge'))fail.push('CSS autoritativo do selo do catálogo ausente.');


if(fail.length){
 console.error(`\nCATÁLOGO REPROVADO — ${fail.length} erro(s):\n- ${fail.join('\n- ')}\n`);
 process.exit(1);
}
console.log(`CATÁLOGO APROVADO — ${catalog.length} produtos íntegros em catálogo, Worker, SEO, imagens e sitemap.`);
