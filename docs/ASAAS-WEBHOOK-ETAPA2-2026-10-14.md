# Asaas: etapa 2 — receptor de webhook autenticado

**Estado:** desenvolvido em branch, ainda sem conciliação ou alteração dos pagamentos reais.

## Auditoria

- Worker real: `aurea-perfumes`, segredo `ASAAS_API_KEY` salvo pelo proprietário na Cloudflare, verificação somente leitura retornou `credentials_accepted`.
- Checkout atual em produção continua **Mercado Pago**; nenhuma operação de pagamento Asaas habilitada.
- Próximo segredo: `ASAAS_WEBHOOK_TOKEN` (diferente da API key, no mínimo 32 caracteres aleatórios) deve ser inserido como **Secret**, nunca texto normal, nem no GitHub, chat ou front-end.
- Documentação Asaas: https://docs.asaas.com/docs/sobre-os-webhooks e https://docs.asaas.com/docs/webhook-para-cobrancas
- Webhook de produção futuro: `POST https://www.valenzaparfums.com.br/api/asaas/webhook` e envio do mesmo token pelo Asaas no header `asaas-access-token`. Eventos de cobrança são entregues *at least once*; Asaas exige HTTP 200 após persistência.
- Endpoint recusa autenticação incorreta, limita tamanho/formato, grava `id`, `event_type`, `payment_id`, `external_reference`, status, datas. Eventos duplicados são ignorados pela chave primária.
- Novo armazenamento D1: tabela `asaas_webhook_events`, isolada do banco de pedidos atual. Não armazena dados de cartão ou payload completo.
- **Ainda não vinculado à conciliação**: gravar evento **não confirma venda, não baixa estoque, não marca pedido pago e não cria envio**. Não configurar webhook no painel Asaas até que o fluxo de conciliação esteja operacional e os eventos em fila possam ser processados. O novo endpoint devolve 503 quando token não estiver configurado.
- O próximo bloco técnico obrigatório é `asaas_payment_links` com referência de pedido, valor, id de pagamento, cliente e estado; consulta remota ao Asaas e reconciliação idempotente para atualização do pedido e EnvioEcom.
- Somente depois iniciar cobranças reais: o PIX ficará na Valenza; cartão depende de verificação PCI DSS e condições específicas de tokenização/captura do Asaas, veja https://docs.asaas.com/docs/pci-dss-1.

## Testes

Executar `node scripts/test-asaas-webhook.mjs` e testes existentes; verificar 401 sem token, 503 sem segredo, 400 JSON inválido, 415 tipo de conteúdo, 413 payload maior que 64 KB, 200 evento persistido/duplicado, 503 D1 fora, zero gravação em `orders`, `inventory` e `order_shipping`.
