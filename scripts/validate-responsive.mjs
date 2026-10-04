import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const baseline=JSON.parse(fs.readFileSync('scripts/responsive-baseline.json','utf8'));
const hash=value=>crypto.createHash('sha256').update(value.replace(/\r\n/g,'\n').trim()).digest('hex');
for(const [path,expected] of Object.entries(baseline.files)){
 assert.equal(hash(fs.readFileSync(path,'utf8')),expected,'Estilo aprovado alterado: '+path+'. Preserve o padrão; atualize a referência somente após autorização explícita e revisão visual.');
}
const html=fs.readFileSync('public/index.html','utf8');
const styles=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]);
assert.equal(styles.length,baseline.inlineStyles.length,'Blocos de estilo adicionados/removidos na home');
styles.forEach((value,i)=>assert.equal(hash(value),baseline.inlineStyles[i],'Estilos responsivos da home alterados'));
const links=[...html.matchAll(/<link\b[^>]*>/gi)].filter(m=>/rel=["']stylesheet["']/i.test(m[0])).map(m=>m[0].match(/href=["']([^"']+)/i)?.[1].split('?')[0]);
assert.deepEqual(links,baseline.stylesheets,'Ordem ou arquivos de estilo alterados');
console.log('Padrão responsivo aprovado preservado: CSS, ordem de estilos e paginação.');
