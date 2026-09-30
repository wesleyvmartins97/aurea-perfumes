import fs from 'node:fs';
const fail=[];
const read=p=>fs.readFileSync(p,'utf8');
const js=read('public/google-commerce.js');
const home=read('public/index.html');
const worker=read('src/worker.js');
const privacy=read('public/privacidade/index.html');

for(const event of ['view_item','add_to_cart','remove_from_cart','view_cart','begin_checkout','add_shipping_info','add_payment_info','purchase']){
 if(!js.includes(`'${event}'`))fail.push(`Evento ${event} ausente.`);
}
if(!home.includes('src="/google-commerce.js"'))fail.push('Home não carrega google-commerce.js.');
if(!worker.includes('/api/google/config'))fail.push('Worker sem endpoint público de configuração Google.');
if(!worker.includes('GA4_MEASUREMENT_ID'))fail.push('Worker não lê GA4_MEASUREMENT_ID do ambiente.');
if(!js.includes("CONSENT_KEY='valenza_google_consent'"))fail.push('Tracking sem consentimento persistente.');
if(!js.includes("CONTINUAR SEM MEDIÇÃO"))fail.push('Banner sem opção de continuar sem medição.');
if(!js.includes('valenzaTrackPurchase'))fail.push('Função de purchase ausente.');
if(!js.includes('PURCHASE_PREFIX'))fail.push('Deduplicação de purchase ausente.');
if(!home.includes("valenzaRememberOrder"))fail.push('Checkout não preserva snapshot de pedido para conversão.');
if(!home.includes("valenzaTrackPurchase"))fail.push('Checkout não dispara purchase após aprovação.');
if(!/Google Analytics/i.test(privacy))fail.push('Privacidade não explica Google Analytics.');
if(/G-[A-Z0-9]{6,}/i.test(home+worker))fail.push('ID real/falso do GA4 foi hardcoded no HTML/Worker; deve vir do ambiente.');
if(/api_secret|GA4_API_SECRET/i.test(home+js))fail.push('Segredo de Analytics exposto no cliente.');
if(fail.length){
 console.error(`\nTRACKING REPROVADO — ${fail.length} erro(s):\n- ${fail.join('\n- ')}\n`);
 process.exit(1);
}
console.log('TRACKING APROVADO — eventos preparados, consentimento aplicado e GA4 desativado até existir ID real.');
