import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const worker=fs.readFileSync('src/worker.js','utf8');
const ctx=vm.createContext({URL,console});
const start=worker.indexOf('const SITE_VISUAL_DEFAULT='),end=worker.indexOf('async function siteVisualState(');
assert.ok(start>=0&&end>start,'visual normalization block not found');
vm.runInContext(worker.slice(start,end)+';this.defaults=SITE_VISUAL_DEFAULT;this.normalize=siteVisualNormalize;this.contactHtml=undefined;',ctx);
const defaults=ctx.defaults,normalize=ctx.normalize;
assert.equal(defaults.home.featuredTitle,'Seleção de perfumes');
const legal=normalize({footer:{document:'CPF ALTERADO',address:'ENDEREÇO ALTERADO',responsible:'OUTRO'},colors:{header:'red'},logoUrl:'http://inseguro.test/logo.png'});
assert.equal(legal.footer.document,defaults.footer.document);
assert.equal(legal.footer.address,defaults.footer.address);
assert.equal(legal.footer.responsible,defaults.footer.responsible);
assert.equal(legal.colors.header,defaults.colors.header);
assert.equal(defaults.colors.footer,'#171513');
assert.equal(defaults.colors.accountCart,'#FFFFFF');
assert.equal(normalize({colors:{header:'#FFFFFF'}}).colors.accountCart,'#171513','light header must default account/cart text to dark');
assert.equal(normalize({colors:{header:'#000000'}}).colors.accountCart,'#FFFFFF','dark header must default account/cart text to light');
assert.equal(normalize({colors:{header:'#FFFFFF',accountCart:'#8A735F'}}).colors.accountCart,'#8A735F','explicit account/cart color must win');
assert.equal(normalize({colors:{header:'#123456'}}).colors.footer,'#123456','legacy combined header/footer setting must migrate safely');
assert.equal(normalize({colors:{header:'#123456',footer:'#654321'}}).colors.footer,'#654321','footer color must be independent when provided');
assert.equal(legal.logoUrl,defaults.logoUrl);
assert.equal(normalize({banners:[]}).banners.length,0,'must allow intentionally hiding/removing all banners');
const cat=normalize({catalog:{showFilters:false,categoryTitle:'TIPO',labels:{designer:'Importados'}}});
assert.equal(cat.catalog.showFilters,false);assert.equal(cat.catalog.categoryTitle,'TIPO');assert.equal(cat.catalog.labels.designer,'Importados');

const helperStart=worker.indexOf('function siteVisualContactHtml('),helperEnd=worker.indexOf('async function servirAssets(');
assert.ok(helperStart>=0&&helperEnd>helperStart,'global html visual helper not found');
vm.runInContext(worker.slice(helperStart,helperEnd)+';this.contact=siteVisualContactHtml;this.globalHtml=siteVisualGlobalHtml;',ctx);
const config=normalize({logoUrl:'/media/site/logo-test?v=1',faviconUrl:'/media/site/favicon-test?v=1',colors:{header:'#101010',accent:'#aa8844',background:'#fefefe',text:'#202020'},contact:{email:'novo@valenza.test',whatsapp:'5527999998888',whatsappDisplay:'(27) 99999-8888'}});
const sample='<html><head><link rel="icon" type="image/png" href="/favicon.png?v=20261003"></head><body><img src="/brand/valenza-logo.svg?v=1"><a href="mailto:contato@valenzaparfums.com.br">contato@valenzaparfums.com.br</a><a href="https://wa.me/5527997962708">(27) 99796-2708</a></body></html>';
const transformed=ctx.globalHtml(sample,config);
assert.ok(transformed.includes('/media/site/logo-test?v=1'));assert.ok(transformed.includes('/media/site/favicon-test?v=1'));assert.ok(transformed.includes('novo@valenza.test'));assert.ok(transformed.includes('5527999998888'));assert.ok(transformed.includes('valenza-visual-global'));

const validStart=worker.indexOf('async function validateSiteVisualTargets('),validEnd=worker.indexOf('async function adminSiteVisualDraft(');
assert.ok(validStart>=0&&validEnd>validStart,'target validator not found');
const vc=vm.createContext({officialCatalog:async()=>({asad:{id:'asad'},yara:{id:'yara'}})});
vm.runInContext(worker.slice(validStart,validEnd)+';this.validate=validateSiteVisualTargets;',vc);
assert.equal(await vc.validate({},normalize({banners:[{id:'a',active:true,imageUrl:'/x.webp',targetType:'product',targetValue:'asad'}]})),'');
assert.match(await vc.validate({},normalize({banners:[{id:'a',active:true,imageUrl:'/x.webp',targetType:'product',targetValue:'nao-existe'}]})),/inexistente|inativo/i);
assert.equal(await vc.validate({},normalize({banners:[{id:'a',active:true,imageUrl:'/x.webp',targetType:'zones',zones:[{product:'yara',left:10,width:20}]}]})),'');
assert.match(await vc.validate({},normalize({banners:[{id:'a',active:true,imageUrl:'/x.webp',targetType:'zones',zones:[{product:'erro',left:10,width:20}]}]})),/inexistente|inativo/i);

assert.ok(worker.includes('publishedRaw=state.customized?raw:"{}"'),'reset before first publish must not create a published config');
assert.ok(worker.includes('config:state.customized?state.published:null'),'public config must stay null until publish');
console.log('ETAPA 2 RUNTIME APROVADA — defaults preservados, legal protegido, banners/categorias normalizados, HTML global e alvos validados.');

const bounded=normalize({home:{featuredEyebrow:'X'.repeat(80),featuredTitle:'Y'.repeat(120),aboutParagraphs:['Z'.repeat(900)],closingText:'K'.repeat(300)},catalog:{categoryTitle:'C'.repeat(80),labels:{designer:'D'.repeat(80)}},contact:{whatsappDisplay:'W'.repeat(80),location:'L'.repeat(180)},footer:{tagline:'T'.repeat(180),description:'Q'.repeat(700)},notice:{enabled:true,text:'N'.repeat(300)},banners:[{id:'b',active:true,imageUrl:'/x.webp',alt:'A'.repeat(200),targetType:'none'}]});
assert.equal(bounded.home.featuredEyebrow.length,32);assert.equal(bounded.home.featuredTitle.length,52);assert.equal(bounded.home.aboutParagraphs[0].length,420);assert.equal(bounded.home.closingText.length,120);assert.equal(bounded.catalog.categoryTitle.length,24);assert.equal(bounded.catalog.labels.designer.length,28);assert.equal(bounded.contact.whatsappDisplay.length,32);assert.equal(bounded.contact.location.length,80);assert.equal(bounded.footer.tagline.length,80);assert.equal(bounded.footer.description.length,320);assert.equal(bounded.notice.text.length,110);assert.equal(bounded.banners[0].alt.length,100);
