import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker=fs.readFileSync('src/worker.js','utf8');
const start=worker.indexOf('async function seedInventory(env){');
const end=worker.indexOf('async function ',start+25);
assert.ok(start>=0&&end>start,'Deve preservar o bootstrap de estoque');
const source=worker.slice(start,end).trim();
const keys=[...source.matchAll(/completedInventoryMigrations\.has\('([^']+)'\)/g)].map(m=>m[1]);
assert.equal(keys.length,21,'Manter todos os 21 marcadores de migração');
assert.equal(new Set(keys).size,keys.length,'Sem marcadores repetidos');
assert.match(source,/SELECT key FROM inventory_meta/);
assert.doesNotMatch(source,/SELECT value FROM inventory_meta WHERE key=/,'Evitar 21 consultas serializadas');
assert.match(source,/ON CONFLICT\(product_id\) DO UPDATE SET stock=excluded\.stock/);
assert.match(source,/catalog-stock-v21-elite-sob-encomenda-20261014/);
assert.match(source,/catalog-cleanup-v3/);

const prepareCalls=[];let readCount=0;
const env={DB:{prepare(sql){prepareCalls.push(sql);return {
 async run(){return {meta:{changes:0}}},
 async all(){assert.equal(sql,'SELECT key FROM inventory_meta');readCount++;return {results:keys.map(key=>({key}))}}
}}}};
const seed=new Function('return ('+source+')')();
await seed(env);
assert.equal(readCount,1,'Uma leitura dos marcadores com todos eles existentes');
assert.equal(prepareCalls.length,2,'A criação da tabela e uma consulta de marcadores bastam');
assert.equal(prepareCalls[0].startsWith('CREATE TABLE IF NOT EXISTS inventory_meta'),true);
console.log('VALENZA: 21 migrações preservadas, bootstrap sem 21 consultas de D1.');
