# Valenza Intelligence — rastreamento seguro (18/11/2026)

## Objetivo
Completar o que já existe, **sem duplicar sistemas e sem mudar o Direct, o checkout, o sorteio nem a agenda social**. Este documento é operacional e só de leitura até a publicação de uma mudança explicitamente validada.

## Baseline confirmado em 18/11/2026
- Cloudflare D1 `aurea-perfumes-db`: 1.037 eventos históricos; 0 com `campaign` preenchido e 0 com `transaction_id`; estes são eventos, não usuários únicos.
- Analytics interno: 673 `page_view`, 206 `view_item`, 32 `add_to_cart`, 20 `begin_checkout` e 0 `purchase`.
- Cliente: pedidos criados/cancelados **não são receita**. O painel existente em `/minha-conta/administracao/` já tem Analytics e Financeiro; estender o existente em vez de adicionar painel redundante.
- Metricool da marca Valenza (ID 7958226) e Instagram @valenza.parfumsimportados (ID 17841421710972478) são as fontes externas de desempenho.
- Conteúdo observado no Metricool: Reel Sabah Al Ward `DfgMMbktZv2` 354 de alcance/542 visualizações; Reel Invictus `Df0bvQWRJ6w` 157 de alcance/201 visualizações; post do sorteio `Df0jao-NVLN` 460 de alcance/68 comentários. Estas métricas não demonstram vendas atribuídas.

## O que já está no código
- `public/google-commerce.js` coleta UTM source/medium/campaign e guarda atribuição local com consentimento; envia para `/api/analytics/event`.
- `src/worker.js` registra source, medium, campaign, session_id, transaction_id em `analytics_events`, fornece Analytics e Financeiro autenticados no admin e recebe webhooks de pagamento.
- `adminDashboard` já distingue vendas pagas reais de contas de teste e calcula lucro bruto apenas quando os custos dos itens existem.
- `daily_report_runs` controla envio de relatório comercial; não criar novo email de vendas automático.
- O GitHub `main` e a versão publicada na Cloudflare **não devem ser considerados idênticos sem readback de deployment**, pois releases podem vir de outras fontes/Workers Builds.

## Convenção UTM para NOVOS links (não alterar posts/fila já publicados)
Usar somente caminhos existentes do domínio oficial.
- Feed orgânico: `?utm_source=instagram&utm_medium=organic_social&utm_campaign=valenza_20261118_produto&utm_content=feed_ID`
- Reel: `?utm_source=instagram&utm_medium=organic_social&utm_campaign=valenza_20261118_produto&utm_content=reel_ID`
- Story com link: `?utm_source=instagram&utm_medium=story&utm_campaign=valenza_20261118_produto&utm_content=story_ID`
- Conversa Direct (se a resposta oficial já permite link): `?utm_source=instagram&utm_medium=direct_message&utm_campaign=valenza_20261118_produto&utm_content=dm`
- Anúncio Meta: `?utm_source=meta&utm_medium=paid_social&utm_campaign=NOME_REAL_DA_CAMPANHA&utm_content=ID_REAL_DO_ANUNCIO`

Substituir `produto` e `ID` por nomes/IDs concretos e URL-encoded. Verificar que link abre o produto correto. Em legendas do feed Instagram, URL geralmente não é clicável: priorizar link da bio, sticker de Story e DM com link, **sem mudar o robô atual**. Evitar reescrever valores de UTM de links já em circulação.

## Critérios para atribuição
1. Alcance e visualizações vêm do Metricool; não são sessões do site.
2. Sessões e produtos vistos vêm de `analytics_events`, após consentimento; não incluem visitantes sem consentimento.
3. Conversão por campanha só é demonstrável quando há UTM conservada e transação confirmada vinculada ao pedido `Pago`. Se não houver o vínculo, exibir "não atribuída".
4. Receita comercial usa pedidos confirmados e exclui contas administrativas/testes. Não usar `order_payments.total_paid` sem verificar se é liquidação real (pode registrar tentativa/estado parcial).
5. Lucro bruto: receita de itens pagos menos custo dos respectivos itens em `order_item_costs`, informando cobertura de custo. Não chamar de líquido sem taxas, fretes, descontos e impostos consolidados.
6. Não expor e-mail, nome de cliente, CPF ou endereço em relatórios agregados.
7. Conferir evento GA4, Pixel e CAPI em ferramentas oficiais de diagnóstico; configuração presente não comprova entrega nem deduplicação.

## Consultas SOMENTE LEITURA de referência
```sql
SELECT source,medium,COALESCE(NULLIF(campaign,''),'sem_campanha') campaign,
       COUNT(DISTINCT CASE WHEN event_name='page_view' THEN session_id END) sessions,
       COUNT(DISTINCT CASE WHEN event_name='view_item' THEN session_id END) sessions_with_product,
       COUNT(DISTINCT CASE WHEN event_name='begin_checkout' THEN session_id END) sessions_checkout
FROM analytics_events
WHERE created_at >= datetime('now','-30 days')
GROUP BY source,medium,campaign
ORDER BY sessions DESC;
```
```sql
SELECT product_id,MAX(product_name) produto,
       SUM(CASE WHEN event_name='view_item' THEN 1 ELSE 0 END) visualizacoes,
       SUM(CASE WHEN event_name='add_to_cart' THEN 1 ELSE 0 END) carrinhos
FROM analytics_events
WHERE created_at >= datetime('now','-30 days')
  AND event_name IN ('view_item','add_to_cart') AND product_id<>''
GROUP BY product_id ORDER BY visualizacoes DESC LIMIT 10;
```

## Validação e proteção de releases
- Branch de revisão `valenza-atribuicao-segura-20261118`, PR #87. Nunca publicar o Worker diretamente a partir de uma revisão sem confrontar o deploy Cloudflare atual, preservar bindings/segredos, executar regressões e verificar site/checkout/Direct.
- Teste `scripts/test-analytics-event-safety.mjs` deve provar rejeição de compra não paga e persistência da campanha; validar também testes existentes de Pix, cartão, Meta, admin e layout.
- Qualquer nova atualização de UTM no agendador precisa ser **aditiva para novos posts**, sem mexer nos 123 registros existentes ou em agendamentos aprovados.
