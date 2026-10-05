# VALENZA — padrão aprovado de computador e celular

O usuário aprovou o visual atual e pediu que fosse preservado nas próximas atualizações.

- Não redesenhar, aumentar cards, alterar espaçamentos, imagens, fontes, ordem dos estilos ou pontos de quebra em tarefas de produtos, preços, estoque, promoções ou integrações.
- Página inicial e catálogo completo: 12 produtos por página até 700px; 24 acima disso. Preservar filtros, ordenação, busca global, página e posição ao voltar dos detalhes.
- Usar os componentes e estilos compartilhados existentes para novos produtos. A home mantém o banner, mas sua grade também é paginada desde a primeira abertura; nunca renderizar todos os produtos na home.
- Antes de publicar, executar: `node scripts/validate-responsive.mjs`, `node scripts/test-catalog-navigation.mjs` e `node scripts/test-catalog-pagination.mjs`, além das verificações pertinentes à alteração.
- A referência em `scripts/responsive-baseline.json` preserva estilos e ordem de carregamento da versão aprovada `5342b881f7186852c4e13b32411b173825d921e4`. Não regenerar para esconder falhas. Somente atualizar após pedido explícito para mudar o visual, revisão do diff e validação visual em computador e celular.
- Preservar backup antes de alterações de produção; não sobrescrever trabalho concorrente.
- A verificação automática detecta mudanças nos estilos protegidos e regressões de navegação; não constitui garantia de ausência de todos os bugs. Cloudflare possui deploy independente: não afirmar que CI impede publicação sem verificar sua configuração.

## GTIN/EAN — conferência registrada em 04/10/2026

- Consultar `docs/GTIN-AUDITORIA-2026-10-04.md` e `docs/gtin-evidence.json` antes de retomar esta etapa. Os 56 GTIN já foram conferidos; não refazer a pesquisa inteira em ajustes de preço, promoção ou estoque.
- Revalidar somente produtos novos ou com mudança de marca, versão, volume, embalagem ou GTIN. Atualizar a evidência junto da mudança; não alterar o registro apenas para ocultar falhas.
- Executar `node scripts/validate-gtin-evidence.mjs` e `node scripts/validate-merchant.mjs` em alterações do catálogo, feed ou evidências.
- O decant de 5ml não herda o GTIN do frasco de 100ml. Observar as apresentações específicas de Light Blue e Miss Dior registradas na auditoria.

## Preços — preferência atualizada em 04/10/2026

- Comparar a apresentação exata com preços normais de grandes perfumarias; separar preço de lista, promoção e PIX. O usuário definiu cerca de 10% a 15% abaixo do preço normal, no máximo, substituindo diferenças de 45%. Consultar `docs/PRECOS-QUATRO-2026-10-04.md`. Não usar o maior anúncio de parceiro como média, nem aumentar todos sem justificativa.

- Atualização posterior de 04/10/2026: para os quatro novos, o usuário priorizou margem BRUTA de cerca de 38–40% sobre a venda no cartão, com PIX 5% abaixo. Dalal explicitamente R$399,90. Pesquisar preços no Brasil em sites próprios/venda direta e no fabricante; parceiros de marketplaces não são a referência solicitada. Esta decisão substitui a meta anterior de 10–15% abaixo para estes quatro. Não confundir margem com acréscimo sobre custo, nem taxa/juros. As margens PIX são menores. Consultar a revisão final no documento de preços.

## Próximos quatro do print — 04/10/2026

- Itens 5–8 cadastrados: Durrat Al Aroos 85ml, Yara Elixir 100ml, Haya 100ml e Petra 100ml. Consultar `docs/PROXIMOS-QUATRO-2026-10-04.md` para custos, fotos, notas, GTIN e preços. Faltam da lista original Vulcan Baie e Shaghaf Al Ward.
- Preservar preços normais com final 9,90, PIX 5% abaixo e a regra de margem bruta registrada. Não arredondar o PIX para 9,90: calculá-lo do preço normal.

## Últimos dois da lista — 04/10/2026

- Lista original concluída: Vulcan Baie 100ml e Shagaf Al Ward 100ml adicionados. Ver `docs/ULTIMOS-DOIS-2026-10-04.md`. Vulcan Baie usa Extrait de Parfum conforme fabricante; não confundir com Vulcan Feu nem substituir foto.
