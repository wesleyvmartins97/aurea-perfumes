# Auditoria rigorosa: VALENZA PARFUMS — Asaas / EnvioEcom — 15/10/2026

**Repositório correto:** `wesleyvmartins97/aurea-perfumes` (conta GitHub do proprietário). A conta `emmyle97@gmail.com` serve apenas como ponte Desktop Commander, não como origem de código. **Não modificar o projeto Mega20 ou BioGroup.**

## Estado confirmado (não confundir com homologação integral)

- O Worker é `aurea-perfumes`, usa Cloudflare D1 `aurea-perfumes-db` e deploy automático GitHub → Cloudflare.
- `wrangler.jsonc` na `main` contém **`ASAAS_PIX_ENABLED: "true"`**. Isso habilita o código PIX se a configuração chegar à instância de produção; `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` são Secrets que o proprietário cadastrou. Não divulgar nem copiar segredos.
- O proprietário mostrou o diagnóstico administrativo com `credentials_accepted` e `webhookConfigured:true`. Essa captura é anterior ao ajuste de `ASAAS_PIX_ENABLED`, portanto não prova o estado atual da flag no Worker em produção.
- Logs Asaas enviados pelo proprietário mostraram HTTP **200 OK** para `PAYMENT_CREATED` e `PAYMENT_DELETED` da cobrança manual de R$10. **Essa cobrança era do tipo BOLETO, com `externalReference:null`**. Verifica somente recepção/autenticação/persistência do webhook; **não prova a geração de PIX da Valenza**, nem a atualização automática de um pedido pago.
- O commit `e10c878cccbb89e016d8e45c7ab4b9dc4c07d16b` corrigiu dois caminhos simultâneos de nova tentativa de postagem no cron Asaas ([PR #73](https://github.com/wesleyvmartins97/aurea-perfumes/pull/73)). CI `preservar-layout` e `Workers Builds: aurea-perfumes` exibiram **success**, com Cloudflare version ID `d3ec4bf5-4464-4b21-9051-21a35d57dcef`.
- **Cartão de crédito ainda passa pelo Mercado Pago Brick**, com token exclusivamente Mercado Pago. Contrato preparatório de cartão Asaas está em **PR #67 draft**, sem rota pública; CI dessa PR estava vermelho (simulador PIX divergente do histórico atual). **Não ativar cartão Asaas nem copiar PAN/CVV para a API da Valenza.**

## Fluxo e controles encontrados no código

1. **Checkout:** `POST /api/pagamento` verifica sessão, e-mail, CPF, preço de catálogo, produtos e quantidades, CEP, cotação EnvioEcom e estoque. O total é **recalculado no servidor** e inclui 5% PIX e o frete escolhido, sem aceitar preço fornecido pelo navegador.
2. **Reserva/antiduplicidade:** o servidor reserva unidades no D1. `guardedPaymentCreate` registra `payment_attempts` antes de fazer POST à API e bloqueia novas tentativas de pagamento de um cliente com tentativa `sending` ou `uncertain`. Falhas inconclusivas ficam para reconciliação por referência; não repetir cobrança cegamente.
3. **Cobrança Asaas:** `POST /v3/payments`, billingType `PIX` e `externalReference=AUREA-...`, vinculado no D1 pela tabela `asaas_payment_links`. Endpoint `/payments/{id}/pixQrCode` devolve payload e imagem usados pelo checkout da Valenza.
4. **Pedido:** `restorePaymentAttempt` salva vínculo às tabelas **`orders`, `order_items`, `order_shipping`, `order_payments`**, com comprovante em Minha Conta para pedidos pagos. Os links pagos precisam ser **validados contra cliente, referência e centavos**, não apenas contra webhook.
5. **Webhook:** `POST /api/asaas/webhook` aceita eventos assinados pelo header `asaas-access-token`, grava `asaas_webhook_events` idempotente e reconcilia posteriormente com GET à API Asaas. O identificador Asaas pode conter `&` e precisa ser tratado como opaco (correção PR #62).
6. **Liberação de pedido:** para PIX de conta CPF, `CONFIRMED` permanece pendente por possível bloqueio cautelar; somente `RECEIVED` marca **Pago**, atualiza `order_payments` e `order_items`, e tenta notificar e gerar envio.
7. **EnvioEcom:** `criarEnvioEnvioEcom` grava `shipping_id`, `barcode`, etiqueta e rastreio em `order_shipping`. A rotina usa `shipment_locks` e retorna a postagem existente caso já possua ID. Para entrega local Colatina não cria etiqueta.
8. **Falha de expedição:** o cron chama apenas `retryPaidShipments` (PR #73): exige pedido pago, link `RECEIVED`, ainda sem shipping_id, sem lock e sem evento de envio incerto. Quando o POST ao EnvioEcom pode ter sido executado sem resposta (timeout/erro de rede), **não** tentar novamente automaticamente: **exige conciliação manual** para evitar etiqueta dupla.
9. **Cancelamento e estorno:** antes de liberar reserva, consultar o provedor e confirmar exclusão; eventos reversos não devem gerar segundo envio. O cron procura cobrança pendente e eventos em fila, mas um ciclo completo de chargeback exige homologação própria.
10. **Cartão:** a PR #67 contém validadores de token próprio Asaas e bloqueio de dados brutos. Não existe coleta de cartão Asaas nem homologação PCI DSS; **Mercado Pago permanece o gateway do cartão**.

## Bloqueios para a expressão "100% perfeito"

**Não verificado:** uma compra realmente gerada a partir do checkout Valenza em produção com código PIX Asaas; pagamento liquidado e recebido; propagação ao D1, comprovante Minha Conta, estoque, e-mail, pedido administrativo, EnvioEcom, emissão da etiqueta e rastreio. Os testes de CI são simulados; não afirmar produção integral homologada.

**Não verificado:** conformidade PCI DSS e tokenização Asaas em produção na conta CPF. Uma chave API válida **não habilita** automaticamente coleta segura do cartão dentro da Valenza, nem garante juros baixos ou antecipação.

**Riscos residuais:** cobranças inconclusivas que dependam da conciliação, falhas de rede EnvioEcom que exijam conferência manual, divergências de frete/cadastro, e mudanças de estado do provedor após `RECEIVED` cujo evento não seja entregue (verificar fila e reconciliação).

## Regras de ativação e rollback

- **Não alterar** os secrets `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN`. Nunca adicioná-los ao GitHub/chat/logs.
- Se o PIX falhar em produção, modificar **apenas** `ASAAS_PIX_ENABLED` para `false` e publicar. Isso faz novas compras PIX voltarem ao Mercado Pago sem excluir vínculos Asaas, mantendo o cron para cobranças Asaas já existentes.
- Não desligar o webhook Asaas após rollback enquanto existirem pagamentos/estornos pendentes.
- Nunca apagar dados históricos, pedidos, D1 ou cobranças para corrigir integração.
- **Antes de declarar sucesso real:** teste assistido de um PIX gerado *pelo site* (sem criação manual no painel), verificação de QR, confirmação pelo Asaas, ledger D1, etiquetas EnvioEcom e ausência de segunda cobrança/postagem. Fazer somente com controle do proprietário.
- Para cartão: obter via Asaas confirmação da habilitação de tokenização em produção e da coleta PCI-compliant sem redirecionamento; validar parcelas/juros/antecipação; só depois construir e testar checkout de cartão Asaas dentro da Valenza.

## Referências e evidências de execução

- [PR #62 — webhook ID Asaas real](https://github.com/wesleyvmartins97/aurea-perfumes/pull/62)
- [PR #73 — apenas uma rotina de retry EnvioEcom](https://github.com/wesleyvmartins97/aurea-perfumes/pull/73)
- [PR #67 — cartão preparatório, draft e testes a corrigir](https://github.com/wesleyvmartins97/aurea-perfumes/pull/67)
- [CI principal](https://github.com/wesleyvmartins97/aurea-perfumes/actions)
- [Cloudflare Worker produção](https://dash.cloudflare.com/9748166d2beca4bf0de3219fa3da8997/workers/services/view/aurea-perfumes/production)
- [Documentação Asaas PCI DSS](https://docs.asaas.com/docs/pci-dss-1)

**Atualização:** 15/10/2026. Documento de rastreabilidade; não substitui auditoria de produção com acesso administrativo e comprovação de uma transação real.
