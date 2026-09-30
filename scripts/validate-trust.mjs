import fs from 'node:fs';

const fail=[];
const CPF='140.992.757-10';
const EMAIL='contato@valenzaparfums.com.br';
const WHATS='99796-2708';
const read=p=>fs.readFileSync(p,'utf8');

const files={
 home:read('public/index.html'),
 privacy:read('public/privacidade/index.html'),
 terms:read('public/termos/index.html'),
 returns:read('public/trocas-e-devolucoes/index.html'),
 shipping:read('public/envio-e-entrega/index.html')
};

const allLegal=[files.privacy,files.terms,files.returns,files.shipping];
const legalNames=['privacidade','termos','trocas/devoluções','envio/entrega'];

const h1Open=(files.home.match(/<h1\b/gi)||[]).length;
const h1Close=(files.home.match(/<\/h1>/gi)||[]).length;
if(h1Open!==1||h1Close!==1)fail.push(`Home deve ter exatamente um H1 válido; encontrado ${h1Open}/${h1Close}.`);

for(const [i,html] of allLegal.entries()){
 if(!html.includes(CPF))fail.push(`${legalNames[i]}: CPF do fornecedor ausente.`);
 if(!html.includes(EMAIL))fail.push(`${legalNames[i]}: e-mail oficial ausente.`);
 if(!html.includes(WHATS))fail.push(`${legalNames[i]}: WhatsApp oficial ausente.`);
 if(!html.includes('Colatina/ES'))fail.push(`${legalNames[i]}: local da operação ausente.`);
 if(!html.includes('rel="icon"'))fail.push(`${legalNames[i]}: favicon ausente.`);
 if(!html.includes('rel="canonical"'))fail.push(`${legalNames[i]}: canonical ausente.`);
}

for(const path of ['/termos/','/trocas-e-devolucoes/','/envio-e-entrega/','/privacidade/']){
 if(!files.home.includes(path))fail.push(`Home/checkout sem link para ${path}`);
}

if(!files.home.includes('checkout-policies'))fail.push('Checkout sem bloco de políticas.');
if(!files.home.includes(CPF))fail.push('Home sem identificação por CPF.');
if(!files.home.includes('"taxID":"'+CPF+'"'))fail.push('Schema da loja sem taxID.');
if(!/Fornecedor responsável/i.test(files.home))fail.push('Rodapé sem identificação do fornecedor.');
if(!/Dúvidas sobre o produto\?/i.test(files.home))fail.push('Home sem bloco de transparência sobre produto/procedência.');

if(!files.terms.includes('10 dias úteis'))fail.push('Termos sem prazo de preparação.');
if(!files.terms.includes('7 dias'))fail.push('Termos sem referência ao arrependimento.');
if(!files.terms.includes('até 5 dias'))fail.push('Termos sem prazo legal de atendimento.');

if(!files.returns.includes('7 dias'))fail.push('Política de devolução sem prazo de arrependimento.');
if(!/sem ônus/i.test(files.returns))fail.push('Política de devolução sem indicação de ausência de ônus no arrependimento legal.');
if(!/logística reversa/i.test(files.returns))fail.push('Política de devolução sem orientação de logística reversa.');
if(!/PIX/i.test(files.returns)||!/cartão/i.test(files.returns))fail.push('Política de devolução sem explicar reembolso por PIX/cartão.');

if(!files.shipping.includes('10 dias úteis'))fail.push('Envio sem prazo de preparação.');
if(!/começa após a postagem/i.test(files.shipping))fail.push('Envio sem separar preparação do prazo da transportadora.');

if(!/LGPD/i.test(files.privacy))fail.push('Privacidade sem referência à LGPD.');
if(!/Dados completos do cartão/i.test(files.privacy))fail.push('Privacidade sem esclarecimento sobre dados completos do cartão.');

if(/original garantid|100% original|autenticidade garantida/i.test(files.home+files.terms+files.returns+files.shipping+files.privacy)){
 fail.push('Encontrada promessa absoluta de autenticidade não sustentada.');
}

if(fail.length){
 console.error('\nETAPA 4 REPROVADA — '+fail.length+' erro(s):\n- '+fail.join('\n- ')+'\n');
 process.exit(1);
}
console.log('ETAPA 4 APROVADA — políticas, contato, identificação, checkout e transparência comercial íntegros.');
