import assert from 'node:assert/strict';
import fs from 'node:fs';

const page=fs.readFileSync('public/index.html','utf8');
const worker=fs.readFileSync('src/worker.js','utf8');
const bridge=fs.readFileSync('src/payments/asaas-valenza.mjs','utf8');

const pix=page.slice(page.indexOf('async function payPix(){'),page.indexOf('async function loadAureaBanners()'));
const server=worker.slice(worker.indexOf('async function criarPagamentoPix('),worker.indexOf('async function criarPagamentoCartao('));
const asaas=bridge.slice(bridge.indexOf('async function startPix('),bridge.indexOf('async function startCard('));
assert.ok(pix.length>2500&&server.length>3000&&asaas.length>2000, 'Fluxo Pix deve continuar presente');
assert.match(pix,/valenzaPixSubmitting/, 'Botao Pix deve evitar concorrencia');
assert.match(pix,/valenzaPixSubmitting=true;\s*if\(!await refreshProductPromotions/, 'Bloqueio deve ocorrer antes do primeiro await de pagamento');
assert.doesNotMatch(pix,/controller\.abort\(\),18000/, 'Timeout antigo de 18 segundos causa pedidos perdidos');
assert.match(pix,/controller\.abort\(\),110000/, 'Navegador espera processamento da operadora');
assert.match(pix,/Meus Pedidos/, 'Erro de rede deve orientar recuperacao do pedido');
assert.match(pix,/if\(!d\.qrCode\)/, 'Pedido criado sem QR tem fluxo de recuperacao');
assert.match(server,/SELECT a\.order_id,a\.amount FROM asaas_payment_links/, 'Reenvio deve procurar Pix existente');
assert.match(server,/ABS\(a\.amount-\?\)<0\.011/, 'Cobranca existente exige total identico');
assert.match(server,/lines\.length!==items\.length/, 'Recuperacao so permite itens coincidentes');
assert.ok(server.indexOf('return asaasBridge.accountPix(env,ord,link)')<server.indexOf('const reserveAt=new Date().toISOString()'),'Recuperacao deve ocorrer antes de nova reserva');
assert.match(asaas,/qrUnavailable:true/, 'Falha QR depois da cobranca nao pode ser tratada como cobranca inexistente');
assert.match(asaas,/await storeAsaasLink/, 'Vinculo com cobranca deve ser salvo antes de retornar');
assert.match(bridge,/if\(decision\.status==='paid'\)/, 'Aprovacao exige confirmacao do Asaas');
assert.match(bridge,/if\(!first&&ord\.status!=='Pago'\)/, 'Eventos tardios nao podem reabrir pedidos cancelados');
// Frete selecionado no carrinho deve chegar ao checkout sem pedir nova selecao.
assert.match(page,/function valenzaShippingCartKey\(\)/);
assert.match(page,/function valenzaShippingMatches\(cep\)/);
assert.match(page,/function selectShipping\(i\)[^\n]+cep,cartKey:valenzaShippingCartKey\(\)/);
assert.match(page,/function selectCheckoutShipping\(i\)[^\n]+cep,cartKey:valenzaShippingCartKey\(\)/);
assert.match(page,/if\(!valenzaShippingMatches\(cep\)\)\{selectedShipping=null;checkoutShipping\(\);return\}/);
const open=page.slice(page.indexOf('async function openCheckout('),page.indexOf('function closeCheckout('));
assert.ok(open.includes('checkoutCep.value=cartCep.slice(0,5)'), 'CEP do carrinho transferido ao checkout');
assert.ok(!open.includes('old.replaceWith(tpl.content.firstElementChild.cloneNode(true));selectedShipping=null'), 'Nao apagar frete ao abrir');
console.log('PASS: timeouts, protecao de duplo clique, recuperacao de Pix, status e QR sem cobrar novamente');
