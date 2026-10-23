# VALENZA — atualização do cartão Asaas após aprovação (23/10/2026)

## Confirmação do fornecedor

Em 23/10/2026 às 16h48 (Brasília), Mariana Ferreira (Asaas) confirmou por e-mail a **aprovação da tokenização em produção**. Protocolo 1855169 / chamado interno 1900797. A conta e a habilitação foram tratadas diretamente com o Asaas.

**Aprovação de tokenização NÃO equivale a homologação PCI DSS da loja.** A documentação oficial do Asaas estabelece que o checkout próprio ou a tokenização server-side que recebem PAN/CVV ficam no escopo PCI DSS. Não há aqui comprovação de elegibilidade a um SAQ reduzido, QSA, solução de campos hospedados ou certificação da Valenza.

Fontes oficiais:
- https://docs.asaas.com/docs/pci-dss-1
- https://docs.asaas.com/reference/tokenizacao-de-cartao-de-credito
- https://docs.asaas.com/reference/criar-cobranca-com-cartao-de-credito
- https://docs.asaas.com/reference/listar-cobran%C3%A7as-de-um-parcelamento

## Mudanças nesta etapa — staging, não ativação

- `src/payments/asaas-prod.mjs` consulta cobrança pré-existente de cartão por referência, sem criar outra, para recuperar tentativas inconclusivas.
- `src/payments/asaas-valenza.mjs` ganhou `startCard`, método **interno**, sem endpoint HTTP público: aceita somente `creditCardToken` Asaas, verifica preço/valor e customer no provedor, reaproveita o registro protegido de tentativa, salva o pedido no D1 e devolve status pendente; não marca pago nem cria etiqueta ao receber simplesmente o POST.
- O fluxo exige **simultaneamente** `ASAAS_CARD_ENABLED=true`, `ASAAS_CARD_PCI_APPROVED=true` e credencial Asaas. Essas flags continuam ausentes/desligadas em produção. A aprovação comercial da tokenização não justifica marcar a flag PCI.
- O cron passa a reconhecer tentativas incertas de cartão `provider=asaas,method=card`, localizando cobranças do Asaas para evitar nova cobrança. Parcelamentos continuam deliberadamente em revisão, sem expedição até conciliação integral.
- `scripts/test-asaas-card-bridge.mjs` faz simulações locais sem cartões reais e preserva o checkout Mercado Pago existente, o PIX e todos os estilos.

## Situação de produção confirmada via Cloudflare (23/10/2026)

- `ASAAS_PIX_ENABLED=true`.
- Segredos `ASAAS_API_KEY`, `ASAAS_CARD_API_KEY`, `ASAAS_WEBHOOK_TOKEN` presentes, valores não inspecionados.
- **Não** foram encontradas as variáveis `ASAAS_CARD_ENABLED` nem `ASAAS_CARD_PCI_APPROVED`.
- O checkout público ainda usa Mercado Pago Brick e a rota `/api/pagamento/cartao`. Nenhum código desta etapa altera o mecanismo público de coleta de cartão.

## Pendências para colocar cartão Asaas no ar

1. O Asaas deve informar se existe um capturador PCI-compliant/elementos hospedados que permitam fluxo no domínio da Valenza, sem trânsito de número de cartão/CVV pelos sistemas da loja. Caso não exista, obter avaliação de um especialista PCI antes de captar dados no checkout próprio.
2. Só depois construir o coletor seguro, integrar ao método `startCard` via backend com autenticação, antifraude/3DS, revalidação de preço, estoque e frete, e manter os tokens fora de D1, logs e analytics.
3. Homologar o parcelamento por grupo consultando `GET /v3/installments/{id}` e `GET /v3/installments/{id}/payments`; não basta o primeiro `PAYMENT_CONFIRMED`.
4. Conferir taxas reais e repasse para a conta, e tratar cobrança falha, timeout, análise de risco, estorno, chargeback, webhook duplicado, recuperação de pedido e envio.
5. Testar Sandbox; depois teste real assistido de valor controlado, conferir painel/cliente/D1/EnvioEcom, efetuar estorno se aplicável. Só então habilitar flags e migrar o formulário público para Asaas.
6. Manter Mercado Pago como alternativa e Pix intacto até a validação; nunca desligar monitoramento de pagamentos antigos.

**Resultado:** infraestrutura adicional preparada em branch isolada, sem publicar uma tela de cartão não-conforme e sem debitar cliente algum.
