import fs from 'node:fs';
import vm from 'node:vm';

const catalog=vm.runInNewContext(fs.readFileSync('public/products.js','utf8')+'\n;CATALOG');
const evidence=JSON.parse(fs.readFileSync('docs/gtin-evidence.json','utf8'));
const records=new Map(evidence.products.map(p=>[p.id,p]));
const exceptions=new Map(evidence.exceptions.map(p=>[p.id,p]));
const errors=[];
const seen=new Map();
const validGtin=g=>{
 if(!/^(\d{8}|\d{12,14})$/.test(g))return false;
 const sum=[...g.slice(0,-1)].reverse().reduce((s,d,i)=>s+Number(d)*(i%2?1:3),0);
 return (10-sum%10)%10===Number(g.at(-1));
};
if(records.size!==evidence.products.length)errors.push('IDs duplicados no registro GTIN.');
for(const p of catalog){
 if(!p.gtin){
  const e=exceptions.get(p.id);
  if(!e||e.type!==p.type||!e.reason)errors.push(p.id+': GTIN ausente sem exceção documentada.');
  continue;
 }
 const g=String(p.gtin),r=records.get(p.id);
 if(!validGtin(g))errors.push(p.id+': dígito verificador inválido.');
 if(seen.has(g))errors.push(p.id+': GTIN já usado por '+seen.get(g));
 seen.set(g,p.id);
 if(p.cat==='decants')errors.push(p.id+': decant não deve reutilizar GTIN do frasco original.');
 if(!r){errors.push(p.id+': falta evidência; pesquisar somente este produto novo.');continue;}
 for(const field of ['name','brand','type','gtin'])if(String(p[field])!==String(r[field]))errors.push(p.id+': '+field+' mudou; conferir somente este item e atualizar evidência.');
 if(r.status!=='verified_reference'||!r.verified_on||!String(r.source_url||'').startsWith('https://'))errors.push(p.id+': evidência incompleta.');
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('GTIN: '+seen.size+' códigos com evidência preservada; '+catalog.filter(p=>!p.gtin).length+' exceção(ões) documentada(s).');
