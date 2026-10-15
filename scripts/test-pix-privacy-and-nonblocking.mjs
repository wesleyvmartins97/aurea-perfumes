import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('public/index.html','utf8');
const worker=fs.readFileSync('src/worker.js','utf8');
const bridge=fs.readFileSync('src/payments/asaas-valenza.mjs','utf8');

// A tela de PIX jamais expõe o payload bancário longo como texto.
assert.doesNotMatch(html, /\$\{esc\(d\.qrCode\)\}/,'O texto de copia e cola não deve ficar visível na tela');
assert.match(html,/id="copyPixButton"/,'Deve ser possível copiar PIX no checkout');
assert.match(html,/id="copyExistingPix"/,'Deve ser possível copiar PIX em Meus Pedidos');
assert.match(html,/navigator\.clipboard\.writeText\(d\.qrCode\)/,'O código integral deve ser copiado sem alteração');
assert.match(html,/qrCodeBase64/,'O QR Code deve continuar funcionando');
assert.match(html,/watchPixPayment\(d\.orderId\|\|d\.paymentId\)/,'Confirmação de pagamento segue automática');

// Não modificar o dinheiro/beneficiário/código PIX no backend.
assert.match(bridge,/qrCode:qr\.qrCode,qrCodeBase64:qr\.qrCodeBase64/);
assert.match(bridge,/billingType:'PIX'/);
assert.match(bridge,/await storeAsaasLink\(env/);
assert.match(bridge,/await restorePaymentAttempt\(env/);

// Só o e-mail é assíncrono, depois de gravar pedido e histórico.
const begin=bridge.indexOf('async function startPix(');
const end=bridge.indexOf('async function ensureOrder(',begin);
const start=bridge.slice(begin,end);
assert.ok(start.indexOf('await restorePaymentAttempt(')<start.indexOf('ctx.waitUntil('),'O pedido deve ser persistido antes do e-mail');
assert.ok(start.indexOf('ctx.waitUntil(')<start.indexOf('await gw.getPix('),'O QR não pode esperar o serviço de e-mails');
assert.match(start,/else await customerEmail\(\)/,'Fallback seguro sem contexto do Worker');
assert.match(worker,/return criarPagamentoPix\(request,env,ctx\)/);
assert.match(worker,/async function criarPagamentoPix\(request,env,ctx\)/);
assert.match(worker,/releaseReservation,ctx\}/);
assert.match(worker,/shipping\/quote/,'O frete segue validado no checkout');
console.log('Valenza PIX: apresentação limpa e liberação não bloqueante do QR verificados.');
