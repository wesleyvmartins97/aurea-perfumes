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
if(!worker.includes('/api/analytics/event'))fail.push('Worker sem endpoint de Analytics interno.');
if(!worker.includes('CREATE TABLE IF NOT EXISTS analytics_events'))fail.push('Analytics interno sem tabela dedicada.');
if(!worker.includes('request.cf||{}'))fail.push('Analytics interno não lê geolocalização aproximada da Cloudflare.');
if(!js.includes("VISITOR_KEY='valenza_analytics_visitor'"))fail.push('Analytics interno sem identificador anônimo de visitante.');
if(!js.includes("SESSION_KEY='valenza_analytics_session'"))fail.push('Analytics interno sem sessão de visita.');
if(!js.includes("fetch('/api/analytics/event'"))fail.push('Funil não espelha eventos no Analytics interno.');
if(!js.includes("if(!consentGranted())return false"))fail.push('Analytics interno não está bloqueado por consentimento.');
if(!privacy.includes('estado/região e cidade aproximados'))fail.push('Privacidade não informa geolocalização aproximada da medição.');
if(!privacy.includes('não armazena nessa medição o endereço IP'))fail.push('Privacidade não informa que IP não é armazenado na medição.');
if(worker.includes('CF-Connecting-IP'))fail.push('Analytics não deve armazenar ou depender do IP bruto do visitante.');
if(!js.includes("CONSENT_KEY='valenza_google_consent'"))fail.push('Tracking sem consentimento persistente.');
if(!js.includes("CONTINUAR SEM MEDIÇÃO"))fail.push('Banner sem opção de continuar sem medição.');
if(!js.includes('valenzaTrackPurchase'))fail.push('Função de purchase ausente.');
if(!js.includes('PURCHASE_PREFIX'))fail.push('Deduplicação de purchase ausente.');
if(!home.includes("window.valenzaTrackBeginCheckout?.()"))fail.push('Checkout não dispara begin_checkout no ponto real de abertura.');
if(!home.includes("window.valenzaTrackShippingInfo?.()"))fail.push('Checkout não dispara add_shipping_info na seleção real de frete.');
if(!home.includes("window.valenzaTrackPaymentInfo?.('pix')"))fail.push('PIX não dispara add_payment_info ao submeter pagamento.');
if(!home.includes("window.valenzaTrackPaymentInfo?.('card')"))fail.push('Cartão não dispara add_payment_info ao submeter pagamento.');
if(!js.includes('window.valenzaTrackBeginCheckout'))fail.push('Helper begin_checkout ausente.');
if(!js.includes('window.valenzaTrackShippingInfo'))fail.push('Helper add_shipping_info ausente.');
if(!js.includes('window.valenzaTrackPaymentInfo'))fail.push('Helper add_payment_info ausente.');
if(js.includes("wrap('openCheckout'")||js.includes("wrap('selectCheckoutShipping'")||js.includes("wrap('choosePayment'"))fail.push('Eventos críticos ainda dependem de wrappers frágeis.');
if(!js.includes('return {value:cartValue(source,paymentType),items:eventItems(source,paymentType)}'))fail.push('Valor do funil pode incluir frete; GA4 deve receber somente valor dos itens.');
if(!js.includes('purchaseItems.length?itemsValue(purchaseItems)'))fail.push('Purchase não calcula valor pelos itens.');
if(!home.includes("valenzaRememberOrder"))fail.push('Checkout não preserva snapshot de pedido para conversão.');
if(!home.includes("valenzaTrackPurchase"))fail.push('Checkout não dispara purchase após aprovação.');
if(!/Google Analytics/i.test(privacy))fail.push('Privacidade não explica Google Analytics.');
if(/[\"']G-[A-Z0-9]{6,}[\"']/i.test(home+worker))fail.push('ID real/falso do GA4 foi hardcoded no HTML/Worker; deve vir do ambiente.');
if(/api_secret|GA4_API_SECRET/i.test(home+js))fail.push('Segredo de Analytics exposto no cliente.');
if(fail.length){
 console.error(`\nTRACKING REPROVADO — ${fail.length} erro(s):\n- ${fail.join('\n- ')}\n`);
 process.exit(1);
}
console.log('TRACKING APROVADO — eventos preparados, consentimento aplicado e GA4 desativado até existir ID real.');
