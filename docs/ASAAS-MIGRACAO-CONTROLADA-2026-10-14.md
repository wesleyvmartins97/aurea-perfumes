# Valenza Parfums — avaliação e preparação Asaas (14/10/2026)

**Situação: PREPARAÇÃO EM BRANCH. NÃO É PAGAMENTO EM PRODUÇÃO.**

## Decisão comercial

A conta Asaas do proprietário é CPF. Print da área Antecipações confirma antecipação online parcelada **1,70% ao mês**, à vista **1,25% ao mês** e limite anunciado de R$ 70 mil, sujeito a crédito. A tela não exibiu cobrança elegível e **não prova liberação imediata**.

Tabela pública padrão (taxas individuais da conta ainda dependem de confirmação): 2–6x, 3,49% + R$ 0,49; 7–12x, 3,99% + R$ 0,49. Estimativa linear do custo de antecipação sobre cada parcela: média de (N+1)/2 meses; o Asaas usa dias corridos até o vencimento e pode cobrar diferente. Exemplo venda R$ 579,90:

| Parcelas | Taxa cobrança | Antecipação estimada | Líquido estimado |
|---|---:|---:|---:|
| 3 | R$ 20,73 | R$ 19,01 | R$ 540,16 |
| 6 | R$ 20,73 | R$ 33,27 | R$ 525,90 |
| 12 | R$ 23,63 | R$ 61,47 | R$ 494,80 |

Fontes: https://www.asaas.com/precos-e-taxas ; https://docs.asaas.com/docs/checkout-para-cart%C3%A3o-de-cr%C3%A9dito ; https://central.ajuda.asaas.com/hc/pt-br/articles/32084930563867-Quais-s%C3%A3o-os-requisitos-para-antecipar-cobran%C3%A7as-de-cart%C3%A3o-de-cr%C3%A9dito

**Atenção:** requisito PF para antecipação de **cartão** é cadastro aprovado com selfie validada **ou** primeira transferência bancária externa concluída, além da análise da cobrança. A exigência de 90 dias citada em outras páginas refere-se a antecipação de **boletos**, não deve ser aplicada automaticamente ao cartão.

## Integração segura proposta

1. Sem alteração das rotas públicas atuais ou segredos no GitHub. Mercado Pago continua provedor ativo até homologação.
2. Criar credenciais em **Sandbox** Asaas. Guardar via Secrets Cloudflare de testes, não em chat, arquivos ou commits; usar token distinto para autenticação webhook (header `asaas-access-token`). A chave do Sandbox nunca vai para produção.
3. Verificar conta e ambiente, testar `POST /v3/checkouts` com `billingTypes: [CREDIT_CARD]`, `chargeTypes: [DETACHED, INSTALLMENT]`, frete/custos validados pelo SERVIDOR e `installment.maxInstallmentCount` escolhido. Redirecionar para `https://asaas.com/checkoutSession/show?id=...`. Não enviar dados de cartão ao Worker; cliente digita no checkout hospedado.
4. Integrar com segurança: carrinho -> revalidação de estoque/preço/cupom/frete -> reserva limitada e idempotente -> checkout com `externalReference` vinculado ao pedido local -> callback retorna somente navegação.
5. Implementar **webhook autenticado**, idempotência em D1 por `event.id`, consulta de conferência do pagamento no Asaas e transição de status sem dupla baixa de estoque/duplo envio. `CHECKOUT_PAID` só aprova após validação no servidor; `CHECKOUT_CANCELED` / `CHECKOUT_EXPIRED` devem liberar reserva de estoque conforme política vigente. Repetições, falhas, atrasos, chargeback e estornos precisam de testes.
6. Não substituir lógica das ordens legadas do Mercado Pago: monitoramento, consulta, conciliação, estorno, webhook, notificações e etiqueta devem continuar funcionando para compras antigas.
7. Testar sandbox: aprovação, recusa, análise de risco, checkout abandonado, retorno sem pagamento, webhook duplicado, erro de rede, 3/6/12 parcelas, PIX se migrado, e histórico de pedidos. Comparar preço final mostrado antes de pagar.
8. Ativar o Asaas **somente após** teste fim a fim com credenciais e aprovação explícita de custos de antecipação reais na conta CPF; manter reversão ao Mercado Pago possível.

**Pendência de operação:** validação de limite/uso real da antecipação **antes de depender da receita para comprar perfume do fornecedor**. Não prometer D+2 a cliente/lojista sem liberação contratada.

Módulo `src/payments/asaas-checkout.mjs` apenas prepara carga e estima taxas, NÃO emite transações. Testar `node scripts/test-asaas-checkout.mjs`.
