# VALENZA PARFUMS — Asaas PIX / Produção

**Estado:** o código fica inativo por padrão. **NÃO mudar o banco antes de configurar webhook, revisar testes e comprovar pagamento real.** A chave de produção `ASAAS_API_KEY` já foi adicionada pelo proprietário como Secret na Cloudflare e uma consulta admin retornou `credentials_accepted`.

## Arquitetura e preservação

- `POST /api/pagamento` (PIX): mantém validações atuais de login, e-mail, CPF, catálogo/preço, cupom, frete, estoque e reserva do D1. Com a flag `ASAAS_PIX_ENABLED=true`, cria cobrança dinâmica do Asaas e apresenta o código/QR **na mesma tela da Valenza**.
- `orderId` da cobrança `pay_...`, `externalReference` e o cliente Asaas são gravados na `asaas_payment_links`; o pedido real é persistido nas tabelas existentes `orders`, `order_items`, `order_shipping`, `order_payments`. Não existem dois cadastros separados para expedição.
- `POST /api/asaas/webhook` valida token de autenticação **próprio**, persiste cada evento na tabela `asaas_webhook_events` antes de retornar 200, reconcilia consultando a API e faz retry via cron. **Não marcar pedido pago com base apenas no conteúdo do webhook**.
- `GET /api/pagamento/{paymentId}` e `POST /api/account/order/pix` consultam o mesmo Asaas, e o histórico/pagamento em Minha Conta continua funcionando. Cancelamentos de cobranças PIX devem ser confirmados no Asaas antes de liberar estoque.
- `RECEIVED` para PIX libera pedido; `CONFIRMED` em conta CPF pode ter bloqueio cautelar de até 72 h e **não** dispara envio. Quando pago, aciona uma vez as rotinas existentes de e-mail, estoque, notificações e EnvioEcom.
- Em falha durante criação de cobrança, `payment_attempts` guarda snapshot para conciliação por `externalReference`, impedindo cobrança repetida automática. Não gravar chave, PAN/CVV nem token de webhook no GitHub.
- Cartão de crédito **permanece Mercado Pago** até aprovar uma captura conforme PCI DSS. O Asaas permite API com checkout transparente, mas não fornece automaticamente a certificação da infraestrutura da Valenza. Não desligar o Mercado Pago enquanto cartão Asaas não estiver homologado.

## Configuração necessária — proprietário faz no painel

1. Em Asaas > Integrações > Webhooks > Adicionar Webhook, preparar webhook de cobrança para `https://www.valenzaparfums.com.br/api/asaas/webhook`. **Utilizar URL com www diretamente** para não depender de redirect, que Asaas não segue.
2. Gerar token seguro **32–255 caracteres**, sem espaços (há botão Gerar token na tela do Asaas). Guardá-lo **diretamente na Cloudflare Secret** `ASAAS_WEBHOOK_TOKEN`, com valor idêntico. Não colar em ChatGPT ou GitHub; não usar `ASAAS_API_KEY` para webhook.
3. Selecionar eventos de cobrança pertinentes: `PAYMENT_CREATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`, `PAYMENT_PARTIALLY_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`, `PAYMENT_CHARGEBACK_DISPUTE`, `PAYMENT_OVERDUE`. Tipo sequencial; e-mail do lojista para alertas.
4. Com integração publicada e token configurado, confirmar autenticação dos eventos e repetir auditoria de status/pedidos/estoque/EnvioEcom/estorno.
5. **Somente após sucesso**, adicionar variável de produção `ASAAS_PIX_ENABLED=true` no Worker `aurea-perfumes` e confirmar com uma compra real controlada em valor mínimo aceito pelo provedor. PIX por Asaas; cartão segue MP até a segunda etapa.
6. Plano de reversão: mudar `ASAAS_PIX_ENABLED=false` ou remover variável; o checkout volta a gerar PIX pelo Mercado Pago. **Não** apagar `ASAAS_API_KEY`/webhook nem interromper conciliação dos PIX já gerados. O cron continuará tratando pedidos antigos Asaas enquanto houver secrets configurados.

## Documentação de referência

- https://docs.asaas.com/docs/cobrancas-via-pix
- https://docs.asaas.com/reference/criar-nova-cobranca
- https://docs.asaas.com/docs/webhook-para-cobrancas
- https://docs.asaas.com/docs/sobre-os-webhooks
- https://docs.asaas.com/docs/criar-novo-webhook-pela-aplicacao-web
- https://docs.asaas.com/docs/pci-dss-1

## Garantias verificáveis e limites

Testes sem dinheiro real: `node scripts/test-asaas-pix-production.mjs`, `node scripts/test-asaas-valenza-lifecycle.mjs`, além das suítes existentes no GitHub Actions. A aprovação desses testes **não comprova** que o webhook, recebimento na conta CPF, autorização de cartão, temporização e expedição real estejam homologados. Não afirmar migração concluída sem esses testes finais.
