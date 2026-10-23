# VALENZA — conciliação do cartão parcelado (23/10/2026)

## Por que esta atualização é necessária

Conforme o Asaas, a resposta de `POST /v3/payments` com cartão parcelado representa apenas a primeira parcela. O identificador `installment` representa o **grupo** das cobranças. Cada parcela tem seu próprio ID, valor e estado.

Fontes:
- https://docs.asaas.com/docs/criar-uma-cobranca-parcelada
- https://docs.asaas.com/reference/listar-cobrancas
- https://docs.asaas.com/reference/listar-cobran%C3%A7as-de-um-parcelamento
- https://docs.asaas.com/docs/webhook-para-cobrancas

## Implementado sem ativar cartões reais

- `src/payments/asaas-prod.mjs` consulta todas as parcelas em **GET** `/v3/payments?installment=...&limit=50&offset=0`, com a chave dedicada `ASAAS_CARD_API_KEY`. Não cria pagamentos nem altera valores.
- `src/payments/asaas-card-contract.mjs` exige `hasMore=false`, contagem exata esperada no snapshot do pedido, IDs únicos, associação ao cliente Asaas e à mesma referência, billingType cartão, identificação do grupo e soma de centavos igual ao preço do pedido.
- Só dá `paid` quando todas as parcelas foram confirmadas/recebidas. Se faltar parcela, houver pendência de análise, divergência de cliente/valor/referência ou resposta incompleta, o pedido **não** é liberado. Parcela estornada encaminha para fluxo de reversão somente com grupo consistente.
- `src/payments/asaas-valenza.mjs` integra essa consulta apenas para um link Asaas já existente `CREDIT_CARD` e identificado como parcelamento. O Pix usa seu caminho anterior.
- `scripts/test-asaas-card-installments.mjs` simula 3x correto, duas de três parcelas, total divergente, parcela repetida, cliente diferente, reversão, paginação, proteção do gateway e não duplicação.

**Nada altera o checkout ao vivo.** Mercado Pago continua capturando cartão, o Pix continua Asaas. As duas flags `ASAAS_CARD_ENABLED` e `ASAAS_CARD_PCI_APPROVED` devem permanecer ausentes até avaliação da captura PCI DSS. Não fazer transação real sem autorização do proprietário e plano de segurança.

## Pendências ainda abertas

1. Forma documentada e aprovada de captura inicial de PAN/CVV dentro do checkout da Valenza.
2. Validar em Sandbox com cartão de teste e dados fictícios de 1x e 3x (sem dados reais).
3. Verificar 3DS, antifraude, estorno, confirmação de webhook e conciliação da lista real do Asaas antes de ativar cartão.
4. Confirmar taxas finais do parcelamento, juros ao cliente e recebimento da conta CPF.
