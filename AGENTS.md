# VALENZA — padrão aprovado de computador e celular

O usuário aprovou o visual atual e pediu que fosse preservado nas próximas atualizações.

- Não redesenhar, aumentar cards, alterar espaçamentos, imagens, fontes, ordem dos estilos ou pontos de quebra em tarefas de produtos, preços, estoque, promoções ou integrações.
- Catálogo completo: 12 produtos por página até 700px; 24 acima disso. Preservar filtros, ordenação, busca global, página e posição ao voltar dos detalhes.
- Usar os componentes e estilos compartilhados existentes para novos produtos. A home e o catálogo completo mantêm suas funções distintas.
- Antes de publicar, executar: `node scripts/validate-responsive.mjs`, `node scripts/test-catalog-navigation.mjs` e `node scripts/test-catalog-pagination.mjs`, além das verificações pertinentes à alteração.
- A referência em `scripts/responsive-baseline.json` preserva estilos e ordem de carregamento da versão aprovada `5342b881f7186852c4e13b32411b173825d921e4`. Não regenerar para esconder falhas. Somente atualizar após pedido explícito para mudar o visual, revisão do diff e validação visual em computador e celular.
- Preservar backup antes de alterações de produção; não sobrescrever trabalho concorrente.
- A verificação automática detecta mudanças nos estilos protegidos e regressões de navegação; não constitui garantia de ausência de todos os bugs. Cloudflare possui deploy independente: não afirmar que CI impede publicação sem verificar sua configuração.
