import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html=fs.readFileSync('public/index.html','utf8');
const products=fs.readFileSync('public/products.js','utf8');
const context=vm.createContext({});
vm.runInContext(products+';this.items=CATALOG',context);
assert.ok(context.items.length>0,'O catálogo não pode estar vazio');
const slugIds=new Set(context.items.map(p=>p.id));
assert.equal(slugIds.size,context.items.length,'IDs de produtos duplicados');
for(const p of context.items){
 assert.match(p.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'ID incompatível com URL: '+p.id);
 assert.ok(fs.existsSync('public/perfume/'+p.id+'/index.html'),'Página individual ausente: '+p.id);
}
const pick=(start,end)=>{const a=html.indexOf(start);assert.ok(a>=0,start+' ausente');const b=html.indexOf(end,a+start.length);assert.ok(b>a,end+' ausente');return html.slice(a,b)};
const history=pick('let aureaLayers=[];','// Keep the catalogue view while product details are open.');
assert.match(history,/function pushLayer\(name,url=location\.href,data=\{\}\)/);
assert.match(history,/history\.pushState\(\{aureaLayer:name,\.\.\.data\},'',url\)/);
const detail=pick('function detail(id,fromHistory=false)','let autoShippingTimer=');
assert.match(detail,/pushLayer\('detail','\/perfume\/'\+encodeURIComponent\(p\.id\)\+'\/',\{aureaProductId:p\.id\}\)/);
assert.match(detail,/if\(fromHistory\)/);
assert.match(detail,/rememberDetailReturn\(\)/);
const back=pick("window.addEventListener('popstate',()=>{",'function updateSummary(){');
assert.match(back,/const target=history\.state\?\.aureaLayer/);
assert.match(back,/if\(target==='detail'\)/);
assert.match(back,/detail\(id,true\)/);
assert.match(back,/else if\(layer==='detail'\)closeDetail\(true\)/);
assert.match(html,/href=\"\/perfume\/\$\{esc\(p\.id\)\}\/\"/);
assert.match(html,/function openProductFromUrl\(\)/);
assert.match(html,/new URLSearchParams\(location\.search\)\.get\('produto'\)/);
assert.match(html,/function restoreDetailReturn\(\)/);
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
 if(match[0].includes('application/ld+json'))JSON.parse(match[1]);else new vm.Script(match[1]);
}
console.log('Links de produtos aprovados: '+context.items.length+' páginas, URL canônica, retorno ao catálogo, histórico e scripts válidos.');
