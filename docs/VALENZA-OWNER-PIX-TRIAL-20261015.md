# Valenza — teste real privado de PIX (15/10/2026)

## Valores originais — NUNCA alterar o catalogo publico
- Produto: Vulcan Baie — French Avenue
- ID: `vulcan-baie`
- Preco original no cartao: **R$ 289,90**
- Preco original PIX (5% desconto): **R$ 275,41**
- Frete local Colatina: **R$ 0,00** (Entrega local Valenza)
- Taxas de recebimento seguem o contrato Asaas e incidem sobre o valor real recebido

## Isolamento do teste
- Somente usuario cadastrado, autenticado, e-mail verificado: `wesleyvmartins97@gmail.com`
- Somente 1 unidade do Vulcan Baie, somente PIX Asaas, somente entrega local gratis de Colatina
- Valor do produto no carrinho e no PIX de teste: **R$ 1,00**
- **NUNCA** alterar `AUREA_CATALOG`, `public/products.js`, `product_settings`, `merchant-feed.xml`, precos do Google Merchant e promocoes
- Outras contas recebem HTTP 423 ao tentar pagar; nenhum estoque e reservado antes do bloqueio
- Cartao Mercado Pago temporariamente bloqueado para novos pagamentos enquanto teste estiver ativo
- Um pedido de teste REAL e uma compra real: somente o cliente proprietario deve pagar
- Automaticamente desativado em **15/10/2026 18:00, horario de Brasilia**, por `VALENZA_OWNER_PIX_TRIAL_UNTIL=2026-10-15T21:00:00.000Z`
- Ao expirar, precos normais e todos os metodos de pagamento voltam, sem migracao de dados necessaria

## Restauracao imediata, a pedido: "volta ao valor certo"
No GitHub, `wrangler.jsonc`, alterar **SOMENTE** `VALENZA_OWNER_PIX_TRIAL` de `"true"` para `"false"` e publicar. 
Mesmo sem isso o sistema retorna ao normal apos o prazo. Nao alterar `ASAAS_PIX_ENABLED` ao restaurar o preco.
Nao excluir pagamentos ja criados: cobrancas reais continuam vinculadas a pedidos na D1. Manter reconciliacao Asaas.
Se o cliente tiver pago, conferir `orders`, `order_items`, `order_payments`, `order_shipping`, event history, comprovante, notificacoes e entrega local antes de finalizar a auditoria.
As tentativas de envio e webhook devem retornar HTTP 200, mas o HTTP 200 nao prova por si so que o pedido foi pago.
## Seguranca
Nao compartilhar segredos; ASAAS_API_KEY e ASAAS_WEBHOOK_TOKEN permanecem secretos na Cloudflare.
