import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const worker=read('src/worker.js');
const admin=read('public/admin-account.js');
const home=read('public/index.html');
const nav=read('public/catalog-navigation.js');
const featured=read('public/featured-selection.js');

assert.match(worker,/CREATE TABLE IF NOT EXISTS catalog_products/,'Tabela dinâmica de produtos ausente');
assert.match(worker,/CREATE TABLE IF NOT EXISTS catalog_product_images/,'Tabela de imagens ausente');
assert.match(worker,/\/api\/admin\/products\/catalog/);
assert.match(worker,/\/api\/admin\/products\/save/);
assert.match(worker,/\/api\/admin\/products\/image/);
assert.match(worker,/\/media\/products\//);
assert.match(worker,/async function adminCatalogProductSave/);
assert.match(worker,/async function adminCatalogProductImage/);
assert.match(worker,/async function catalogProductImage/);
assert.match(worker,/currentAdmin\(request,env\)/,'Rotas administrativas devem exigir admin autenticado');
assert.match(worker,/unidade\(s\) reservada\(s\)|unidades reservadas|possui unidades reservadas/,'Proteção de estoque reservado ausente');
assert.ok(worker.includes('image\\/(?:webp|jpeg|png)'),'Validação MIME de imagem ausente');
assert.match(worker,/decoded\.bytes\.buffer/,'Imagem D1 deve ser enviada como ArrayBuffer');
assert.match(worker,/catalogBase\(env,\{includeDrafts:false\}\)/,'Catálogo oficial não usa camada dinâmica');
assert.match(worker,/return resposta\(\{ok:true,products,catalog\}\)/,'Runtime não devolve metadados dinâmicos');
assert.match(worker,/customProductPageHtml/,'Página dinâmica de produto ausente');
assert.match(worker,/additions=.*_custom[\s\S]*sitemap|_custom[\s\S]*<url>/i,'Sitemap não inclui produtos criados no painel');
assert.match(worker,/dynamicMerchantFeed[\s\S]*_custom/,'Merchant não inclui produtos criados no painel');
assert.match(worker,/featured INTEGER NOT NULL DEFAULT 0/,'Campo de destaque ausente');
assert.match(worker,/featured=excluded\.featured/,'Persistência do destaque ausente');
assert.match(worker,/recordAdminAudit\(env,admin,isNew\?"catalog_product_create":"catalog_product_edit"/,'Auditoria de criação/edição ausente');

assert.match(home,/runtime\.catalog/,'Front-end não consome catálogo dinâmico');
assert.match(home,/CATALOG\.push\(p\)/,'Front-end não inclui novos produtos');
assert.match(nav,/mode==='default'.*sortOrder/s,'Ordem manual não integrada');
assert.match(featured,/p\?\.featured===true/,'Destaques não são controláveis pelo painel');

for(const text of ['NOVO PRODUTO','EDITAR COMPLETO','DUPLICAR','FOTO DO PRODUTO','GTIN / EAN','TÍTULO SEO','Destaque na Home']){
 assert.ok(admin.includes(text),'Painel sem recurso: '+text);
}
assert.match(admin,/adminCompressProductImage/,'Compressão automática de foto ausente');
assert.match(admin,/max=1200/,'Limite de resolução de upload ausente');
assert.match(admin,/\/api\/admin\/products\/save/);
assert.match(admin,/\/api\/admin\/products\/image/);

const insert=worker.match(/INSERT INTO catalog_products\([^)]+\) VALUES\(([^)]+)\)/);
assert.ok(insert,'INSERT de catalog_products não encontrado');
const placeholders=(insert[1].match(/\?/g)||[]).length;
assert.equal(placeholders,29,'Quantidade de placeholders do produto deve ser 29');
const bindStart=worker.indexOf('.bind(id,isCustom,published?1:0,name,brand,cat,collection,type,gtin||null',worker.indexOf(insert[0]));
assert.ok(bindStart>=0,'Bind do produto não encontrado');
const bindEnd=worker.indexOf('),\n   env.DB.prepare("INSERT INTO product_settings',bindStart);
assert.ok(bindEnd>bindStart,'Fim do bind do produto não encontrado');
const bindText=worker.slice(bindStart,bindEnd);
const args=bindText.slice(bindText.indexOf('(')+1).split(',').length;
assert.equal(args,29,'Quantidade de valores do bind do produto deve ser 29');

console.log('ETAPA 1 APROVADA ESTATICAMENTE — criação, edição completa, duplicação, imagem, SEO, destaque, ordenação, catálogo seguro, Merchant e sitemap estão conectados.');
