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
const requiredText=['id','name','brand','cat','type','img','desc','details'];
const requiredNum=['price','weight','length','height','width'];

for(const p of catalog){
 const tag=p?.id||p?.name||'(sem id)';
 for(const k of requiredText)if(typeof p?.[k]!=='string'||!p[k].trim())fail.push(`${tag}: campo ${k} vazio/ausente.`);
 for(const k of requiredNum)if(!Number.isFinite(Number(p?.[k]))||Number(p[k])<=0)fail.push(`${tag}: campo ${k} inválido.`);
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
 }
}

const worker=read('src/worker.js');
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

const sitemap=read('public/sitemap.xml');
for(const p of catalog)if(!sitemap.includes(`https://valenzaparfums.com.br/perfume/${p.id}/`))fail.push(`${p.id}: ausente no sitemap.`);

if(fail.length){
 console.error(`\nCATÁLOGO REPROVADO — ${fail.length} erro(s):\n- ${fail.join('\n- ')}\n`);
 process.exit(1);
}
console.log(`CATÁLOGO APROVADO — ${catalog.length} produtos íntegros em catálogo, Worker, SEO, imagens e sitemap.`);
