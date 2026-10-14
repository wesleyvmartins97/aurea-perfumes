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

## Decisão de UX do proprietário — checkout transparente obrigatório

**Não utilizar Asaas Checkout hospedado, invoiceUrl ou redirecionamento de pagamento.**
Somente **PIX** e **cartão de crédito**, sem débito e sem boleto. O cliente
deve permanecer na URL da VALENZA ao gerar QR Code / copia-e-cola e ao escolher
as parcelas e enviar o cartão, preservando o visual atual.

O Asaas confirma possibilidade de checkout transparente por API:
https://central.ajuda.asaas.com/hc/pt-br/articles/32108011423643-Como-usar-o-checkout-transparente-no-Asaas
https://docs.asaas.com/docs/cobrancas-via-cartao-de-credito

**Segurança é condicionante, não mero detalhe**:
https://docs.asaas.com/docs/pci-dss-1

Na API Asaas, dados brutos de cartão enviados pelo front-end ao Worker tornam
nossa aplicação parte do escopo PCI DSS; nem a certificação do Asaas nem criar
um token server-side resolvem automaticamente a conformidade.
A tokenização exige envio inicial dos dados do cartão e habilitação em produção.
**Não implementar captura improvisada de PAN/CVV** e não registrar dados de
cartão em D1, logs, erros, GitHub, ferramentas de analytics ou chat. Primeiro
validar com Asaas e profissional de segurança/PCI os controles e o caminho de
captura adequados. Se a conta não suportar uma solução compatível, o
cartão **não poderá ser ligado com segurança sob essa exigência**, mesmo
que o Pix transparente fique pronto.

Exceção inerente ao cartão: alguns bancos exigem autenticação 3DS, e nesse
caso pode ser necessário redirecionamento pontual para o emissor. Não
prometer "nunca sai da Valenza" se 3DS obrigatório:
https://docs.asaas.com/docs/criar-cobranca-com-3ds

## Integração segura proposta, em ordem

1. **Antes de alterações públicas:** manter checkout Mercado Pago enquanto a
   nova cobrança for validada e não bloquear a loja nem clientes navegando.
2. **Credenciais:** configurar secrets em Cloudflare para Asaas, nunca
   em chat, GitHub ou front-end. Ambientes separados; usuário ajudará
   a configurar quando solicitado, um passo por vez.
3. **PIX transparente:** revalidar login/e-mail, preço, estoque, frete e cupom
   no servidor; criar cliente e cobrança `POST /v3/payments` (`billingType: PIX`)
   vinculada ao pedido local; obter `/payments/{id}/pixQrCode` e exibir
   QR/copia-e-cola no modal atual. Garantir referência única e recuperação
   de chamadas com resultado incerto sem gerar cobranças duplicadas.
4. **Confirmar pagamento:** webhook Asaas autenticado, deduplicado por ID de evento
   no D1, com consulta server-side da cobrança e verificação de valor, referência,
   cliente e método. Marcar um único pedido pago, registrar operação, enviar e-mail
   e chamar `criarEnvioEnvioEcom` somente após aprovação e uma única vez.
   PIX pendente/expirado deve liberar estoque de acordo com política atual.
5. **Crédito transparente:** habilitar só depois do plano PCI DSS revisado.
   Confirmar operação/cartão/parcelamento na conta Asaas; preço e frete
   devem ser revalidados no servidor; sem logar PAN/CVV. Preferir método
   homologado de tokenização/captura, jamais transferir dados brutos para
   sistemas não preparados. Atualizar layout internamente e manter
   tratamento de 3DS quando exigido pelo emissor.
6. **Pedidos e EnvioEcom:** central de pedidos, estoque reservado,
   expedição, estornos, chargebacks, recuperação e notificações
   sincronizados. Preservar monitoramento dos pagamentos antigos
   do Mercado Pago mesmo que não haja compras históricas relatadas.
7. **Testes:** somente mudança em branch até os fluxos Pix, cartão, webhook
   repetido/fora de ordem, timeout, reembolso, EnvioEcom, receita/checkout,
   erro e autenticação passarem. Auditoria final antes da ativação em produção.
8. **Ativação/reversão:** modo Asaas somente com credenciais verificadas,
   webhook e conformidade; rollback simples e comprovado. Nada de publicar
   um checkout que não recebe ou que não entrega.

**Pendência de operação:** confirmar antecipação de recebíveis para conta CPF
e prazo efetivo, antes de depender da receita para pagar fornecedor.

O módulo `src/payments/asaas-checkout.mjs` oferece **simulação e contrato
transparente**, não cria pagamentos; `src/payments/asaas-api.mjs` é adapter
server-only ainda desconectado do Worker público. Não confundir passar nos
testes estáticos com homologação transacional.
