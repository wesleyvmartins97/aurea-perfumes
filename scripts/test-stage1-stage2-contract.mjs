import fs from 'node:fs';import assert from 'node:assert/strict';
const worker=fs.readFileSync('src/worker.js','utf8'),index=fs.readFileSync('public/index.html','utf8'),admin=fs.readFileSync('public/admin-account.js','utf8'),wrangler=fs.readFileSync('wrangler.jsonc','utf8');
// Etapa 1 — produtos
for(const token of ['/api/admin/products/catalog','/api/admin/products/save','/api/admin/products/image','/api/admin/products/availability','catalog_products','catalog_product_images','/api/catalog/runtime','/merchant-feed.xml','/sitemap.xml'])assert.ok(worker.includes(token)||index.includes(token),'Etapa 1 ausente: '+token);
// Etapa 2 — central visual
for(const token of ['/api/admin/site/visual','/api/admin/site/visual/draft','/api/admin/site/visual/publish','/api/admin/site/visual/reset','site_visual_state','site_visual_assets','/api/site/visual','/media/site/'])assert.ok(worker.includes(token),'Etapa 2 ausente: '+token);
// Contrato entre as etapas
assert.ok(worker.includes('catalog_products')&&worker.includes('site_visual_state'),'Tabelas de produto e visual precisam coexistir');
assert.ok(wrangler.includes('"/media/products/*"')&&wrangler.includes('"/media/site/*"'),'Mídias das duas etapas precisam passar pelo Worker');
assert.ok(admin.includes('data-v="products"')&&admin.includes('data-v="visual"'),'Admin precisa expor Produtos e Visual separadamente');
assert.ok(index.includes("fetch('/api/catalog/runtime")&&index.includes("fetch('/api/site/visual"),'Loja precisa carregar runtime de produto e visual de forma independente');
assert.ok(worker.includes('config:state.customized?state.published:null'),'Rascunho visual não pode vazar para público');
assert.ok(index.includes('accountCartColor=String(colors.accountCart||visualContrast(headerColor))'),'Conta/Carrinho precisa respeitar cor própria');
assert.ok(admin.includes('visualConfirmDialog')&&!admin.includes("confirm('Publicar este rascunho na loja agora?')"),'Publicação visual deve usar modal VALENZA, não confirm nativo');
assert.ok(worker.includes('adminCatalogProductSave')&&worker.includes('adminSiteVisualPublish'),'Salvar produto e publicar visual devem permanecer fluxos separados');
assert.ok(worker.includes('recordAdminAudit(env,admin,"catalog_product_')&&worker.includes('recordAdminAudit(env,admin,"site_visual_'),'Ações das duas etapas devem permanecer auditáveis');
console.log('CONTRATO ETAPA 1 + ETAPA 2 APROVADO — produtos e Central Visual coexistem sem sobreposição de rotas, tabelas, mídia, admin ou publicação.');
