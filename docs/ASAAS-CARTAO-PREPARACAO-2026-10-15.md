# VALENZA — cartão Asaas (preparação técnica, sem mudança de checkout)

## Resultado da auditoria (15/10/2026)

O código principal em produção usa Mercado Pago Brick no `public/index.html`, envia somente um token do Mercado Pago a `/api/pagamento/cartao` e valida o valor total e frete na API. Este token **não é** compatível com o Asaas.

A documentação oficial Asaas confirma a API `POST /v3/payments` para cartão, mas exige `creditCard`/`creditCardHolderInfo` ou `creditCardToken` gerado especificamente pelo Asaas. O Asaas só habilita a tokenização em produção após análise da conta. Na API com PAN/CVV passando pela VALENZA, nossa aplicação/Cloudflare fica no escopo do PCI DSS. HTTPS e tokenização server-side **não resolvem automaticamente** essa obrigação.

Fontes:
- https://docs.asaas.com/docs/pci-dss-1
- https://docs.asaas.com/docs/cobrancas-via-cartao-de-credito
- https://docs.asaas.com/reference/criar-cobranca-com-cartao-de-credito
- https://docs.asaas.com/reference/tokenizacao-de-cartao-de-credito
- https://docs.asaas.com/docs/checkout-para-cart%C3%A3o-de-cr%C3%A9dito

**O proprietário deseja checkout integralmente na VALENZA, sem redirecionar.** O checkout hospedado pelo Asaas requer redirecionamento e não foi escolhido.

## Preparação implementada (sem transações reais)

- `src/payments/asaas-card-contract.mjs`: bloqueia cartões brutos/PAN/CVV, valida cobrança com token Asaas, valor, IP e parcelas 1 a 12; verifica estados consultados no Asaas e evita concluir pedidos em análise.
- `src/payments/asaas-prod.mjs`: método interno `newTokenizedCard()` somente para integração com token Asaas proveniente de caminho validado; exige simultaneamente `ASAAS_CARD_ENABLED=true` **e** `ASAAS_CARD_PCI_APPROVED=true`. Nenhuma rota pública utiliza esse método.
- `src/payments/asaas-valenza.mjs`: reconciliação de links existentes `CREDIT_CARD` faz GET do Asaas, compara ID, cliente, referência e valor. Não libera estoque/EnvioEcom por status pendente ou em análise. O webhook existente continua autenticado.
- `scripts/test-asaas-card-contract.mjs`: testes 1x, 3x, valores, estados de risco, recusas, reversões, ausência de PAN/CVV e flag desligada. Não usa dados reais nem cria cobranças.

## Bloqueios para troca do cartão

1. Solicitar ao Asaas **autorização de tokenização na conta de produção**, incluindo forma de obter token Asaas com coleta conforme PCI DSS, sem processar PAN/CVV no Worker da loja sem conformidade verificada.
2. Definir a modalidade de coleta: fluxo controlado pela Valenza com avaliação PCI DSS e proteção de logs/CSP, ou aceitar checkout Asaas hospedado (exige consentimento do proprietário).
3. Somente depois integrar o formulário de cartão ao **token Asaas**, ligar os pedidos no endpoint público, homologar 3DS e configurar eventos adicionais `PAYMENT_AWAITING_RISK_ANALYSIS`, `PAYMENT_REPROVED_BY_RISK_ANALYSIS`, `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`. Os eventos atualmente selecionados no webhook cobrem `PAYMENT_CONFIRMED`/`RECEIVED`, mas não todas as situações de cartão.
4. Comparar taxas de 1x/3x/6x e antecipação na **conta CPF**, confirmando que o cliente não será cobrado juros inesperados, e validar recebíveis para compra sob encomenda.
5. Executar teste real controlado do **PIX Asaas** e depois **cartão**, confirmando pedido, pagamento, rastreio, EnvioEcom, histórico de cliente, e-mail e notificação, sem cobrar duas vezes.
6. Só então mudar o checkout e desativar o Mercado Pago. Nunca assumir que ele está desligado enquanto a rota `/api/pagamento/cartao` usar o SDK Mercado Pago.

**Estado atual:** PIX foi configurado no `wrangler.jsonc` com `ASAAS_PIX_ENABLED=true` em 15/10/2026 (verificar publicação efetiva e compra real). Cartão continua Mercado Pago. **Não criar** `ASAAS_CARD_ENABLED` nem `ASAAS_CARD_PCI_APPROVED` na Cloudflare antes de comprovar os requisitos.
