# VALENZA — procedimento “foto + posta no site”
Regra registrada pelo proprietário em 12/10/2026. Aplicar quando Wesley enviar foto de perfume e pedir “posta no site”, “posta na Valenza” ou equivalente. O pedido autoriza pesquisa, preparação, cadastro, publicação e conferência completa, sem exigir novos comandos entre etapas. Perguntar somente por informação indispensável que não possa ser determinada com segurança. Não prometer memória automática entre contas: consultar este procedimento ao retomar.

## Projeto e limites
Site: https://www.valenzaparfums.com.br
GitHub: wesleyvmartins97/aurea-perfumes
Conta principal informada: wesleyvmartins97@gmail.com
Preservar o visual aprovado, clientes, pedidos, checkout, dados e regras. Não misturar com MEGA20. Não usar automação paga. Não enviar mensagens a fornecedores sem autorização específica. Não guardar credenciais em código, relatórios ou GitHub.

## Etapas obrigatórias
1. **Identificação:** analisar foto e confirmar marca, perfume, versão, concentração, volume, categoria e apresentação. Conferir fonte oficial. Não confundir flankers, decants, testers ou frascos sem caixa.
2. **Duplicidade:** consultar catálogo base e catálogo efetivo D1/API. Pesquisar ID, nome, versão/volume e GTIN. Editar produto existente quando apropriado, preservando ID; não duplicar.
3. **Fornecimento antes de vender:** buscar no Compras Paraguai, priorizando lojas confiáveis; abrir oferta direta para confirmar preço e disponibilidade atuais. Resultado de busca, preço antigo, anúncio sem botão de compra ou página institucional não prova estoque.
4. **Custo atual por unidade:** USD × R$5,30 + R$40 ponte + R$20 frete. Não usar câmbio do comparador nem regra histórica de frete R$15 para novos produtos. Não ratear valores sem pedido. Se preço não for atual/confirmado, documentar apenas como referência e não gravar como custo efetivo.
5. **Brasil:** buscar 3–4 perfumarias de venda própria, preferindo grandes redes. Comparar mesma concentração/volume e frasco com caixa. Separar preço normal, promoção, PIX e parcelamento. Excluir Mercado Livre, Shopee, Americanas e qualquer vendedor terceiro de marketplace como base. Se grandes redes não oferecerem o produto, registrar a limitação; não inventar ofertas nem chamar pequenas lojas de grandes redes.
6. **Preço e resultado:** seguir regras vigentes de AGENTS.md e eventual decisão específica do produto. Preservar final 9,90 no preço normal e PIX 5% abaixo com arredondamento monetário, sem forçar final 9,90 no PIX. Comparar viabilidade/margem e referências brasileiras; não afirmar menor preço sem prova. Lucro bruto = venda − custo; margem bruta = lucro bruto/venda ×100. Calcular cartão e PIX separadamente. Lucro líquido somente com taxas efetivas, tributos e despesas conhecidas; caso contrário informar “não apurado” ou simulação com premissas explícitas, nunca apresentar bruto como líquido.
7. **Imagens:** obter fotos oficiais reais do frasco e da caixa da apresentação exata. Inspecionar produto/nome/volume; otimizar mantendo fidelidade e enquadramento compatível com catálogo. Não gerar imagem que altere frasco ou embalagem. Estrutura base atual: public/produtos; imagens administrativas: D1 catalog_product_images e /media/products/<id>.
8. **Texto:** ler 3–4 exemplos atuais da Valenza e fontes comerciais do produto. Criar descrição curta e detalhes originais em português no padrão sofisticado já aprovado, sem copiar lojas. Não inventar ano, inspiração, horas de fixação, projeção garantida, medidas ou promessas.
9. **Pirâmide:** conferir fonte oficial mais direta e 3–4 lojas. Registrar divergências; prevalece a fonte oficial da apresentação exata, sem misturar listas. Organizar Topo, Corpo e Fundo nos componentes existentes. Registrar fontes.
10. **GTIN e frete:** confirmar GTIN da versão/volume, dígito verificador e ausência de duplicidade; atualizar docs/gtin-evidence.json somente para itens novos/alterados. Não atribuir ao decant o GTIN do frasco. Medidas/peso herdados são estimativas e devem ser documentados como tal, não atribuídos ao fabricante.
11. **Cadastro:** preferir o painel existente quando houver acesso autenticado. Para inclusão base, sincronizar public/products.js, AUREA_CATALOG em src/worker.js, imagem, página SEO, sitemap, feeds e evidência GTIN. Não tratar GitHub como única fonte: D1 pode sobrepor preço, detalhes, estoque e publicação. Preservar backup/ref e trabalho concorrente. Nunca copiar senhas/tokens para repositório.
12. **Disponibilidade:** estoque administrativo padrão 100 só quando houver fornecimento confirmado, mantendo sob encomenda, preparação de 8–10 dias úteis (site informa até 10), limite de 10 unidades por produto no carrinho e parcelamento existente. Não significa pronta entrega física. Não resetar estoque de produtos existentes sem pedido.
13. **Sem fornecedor disponível:** cadastrar/manter visível como ESGOTADO, estoque zero, no fim do catálogo em todas as ordenações, com compra e adição ao carrinho bloqueadas. Página direta e checkout também devem bloquear; Google/schema e feed devem informar OutOfStock/out_of_stock, sem data de disponibilidade. Enviar link apenas se oferta disponível puder ser confirmada. Não reativar por anúncio incerto; comunicar a Wesley para avaliar. Não excluir produto para representar falta temporária de estoque.
14. **Verificação antes de publicar:** executar verificações de responsividade, navegação e paginação de AGENTS.md; validações catálogo, GTIN e Merchant quando catálogo/feed forem alterados. Testar comportamento pertinente (estoque, ordenação, página direta e checkout), sem compra real. Não regenerar baseline para esconder regressão visual.
15. **Publicação e prova:** enviar atualização, acompanhar CI e Workers Builds da Cloudflare; verificar no site efetivo nome, foto, preço normal/PIX, descrição, pirâmide, disponibilidade, posição e bloqueios quando esgotado. Conferir sitemap/feed/dados estruturados quando afetados. GitHub salvo não prova publicação. Search Console não conectado não permite afirmar indexação/aprovação interna do Google.
16. **Entrega:** responder brevemente com link do produto, preço/PIX, resultado real e qualquer pendência material. Só dizer “publicado” após conferir produção. Se houver bloqueio real, explicar exatamente o que falta e concluir o restante autorizado.

## Mapa atual
- public/products.js: vitrine e detalhes base.
- public/produtos/: fotos base.
- src/worker.js: catálogo checkout, migrações e API.
- public/catalog-navigation.js: filtro/ordenação; esgotados por último.
- D1 catalog_products: produtos personalizados e ajustes.
- D1 inventory: disponibilidade; disabled_products: itens desativados (não aparecem na vitrine).
- D1 product_settings: custo e preço administrativo.
- /api/catalog/runtime: registros, preço e estoque efetivos.
- scripts/generate-seo.mjs e generate-merchant.mjs: páginas/feed base.
- Google usa respostas dinâmicas de página/feed; conferir respostas públicas efetivas.

## Estado ao concluir 12/10/2026
Bahiya Garnet EDP100ml cadastrado com foto oficial frasco+caixa, descrição Valenza, pirâmide e GTIN6290361912386. Preço499,90/PIX474,91. Está ESGOTADO, estoque0, ativo/visível em último, sem compra; feed out_of_stock e schema OutOfStock. Fornecimento PY não confirmado; não reativar automaticamente.
68 registros, 67 ativos; Decant Sabah Al Ward5ml está desativado. Contador67 é esperado.
Conta principal já consta como administradora na configuração; não houve transferência de titularidade.
