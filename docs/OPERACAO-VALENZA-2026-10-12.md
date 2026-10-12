# Valenza — auditoria e rotina de cadastro
Revisão: 12/10/2026. Conta principal informada pelo proprietário: wesleyvmartins97@gmail.com.
Site: https://www.valenzaparfums.com.br
Repositório: https://github.com/wesleyvmartins97/aurea-perfumes
Base auditada: main, commit 825549f3ae6d3e7a3e3b4a5cd065c057dbe76e56.

## Preservação
Preservar layout aprovado, componentes, checkout, clientes, pedidos, estilos e regras existentes. Esta auditoria não modifica código de produção nem preços existentes. Não misturar com MEGA20.
A conta informada já consta em ADMIN_EMAILS. O assistente não é uma conta de e-mail e esta revisão não transfere titularidade de contas.

## Mapa operacional
| Conteúdo | Local |
|---|---|
| Catálogo base, descrição e pirâmide | public/products.js |
| Imagens base | public/produtos/ (usar estrutura atual; public/images não é a pasta atual) |
| Detalhes e SEO base | public/perfume/<id>/index.html |
| Preços e medidas base de checkout | AUREA_CATALOG em src/worker.js |
| Cadastros e ajustes administrativos | D1 catalog_products |
| Imagens carregadas no painel | D1 catalog_product_images; /media/products/<id> |
| Preço/custo administrativo | D1 product_settings |
| Disponibilidade | D1 inventory e disabled_products |
| Catálogo público efetivo | GET /api/catalog/runtime |
| Administração | /admin; GET /api/admin/products/catalog; POST /api/admin/products/save e /image |
| SEO e feed | scripts/generate-seo.mjs e scripts/generate-merchant.mjs |
| Evidência GTIN | docs/gtin-evidence.json |
| Implantação | Cloudflare Worker aurea-perfumes; D1 aurea-perfumes-db |

Há duas camadas: catálogo base em arquivos e ajustes/produtos personalizados no D1. Não considerar só o GitHub para preço/estoque efetivo. O cabeçalho de products.js diz arquivo único, porém inclusões base também exigem sincronizar Worker, SEO, feeds e evidências. Cadastro administrativo já permite produtos completos sem alterar layout.

## Resultado verificável
Site respondeu HTTP 200. API pública retornou ok:true e 67 produtos. Bahiya Garnet não estava cadastrado.
Executados com sucesso: validate-responsive, validate-catalog (67), validate-gtin-evidence (66 códigos e 1 exceção documentada), validate-merchant (64 itens), test-catalog-navigation, test-catalog-pagination, validate-admin e test-order-lifecycle.
Fluxos de pagamento/frete/e-mail foram testados com provedores simulados, sem transações reais.
Não foi realizada auditoria autenticada de dados privados nem inspeção visual completa em navegadores nesta revisão. Opera retornou Browser not connected. A configuração Cloudflare foi lida no repositório; implantação efetiva e configurações privadas não foram verificadas.
Uma tentativa de listar diretórios Desktop e C:\\DCNOVO no Wesley-Comercial foi rejeitada pela revisão automática por extrapolar auditoria do site/GitHub e poder expor arquivos não relacionados. Nenhum diretório remoto foi enumerado.

## Procedimento para “posta na Valenza”
1. Identificar marca, nome, versão, concentração e volume pela foto. Conferir duplicidade por ID/nome/apresentação e GTIN no catálogo base e efetivo.
2. Consultar Compras Paraguai e lojas de referência. Regra atual: custo unitário = USD × 5,30 + R$40 ponte + R$20 frete. O frete R$20 substitui referência histórica R$15 para novos pedidos; não recalcular itens antigos.
3. Comparar 3–4 perfumarias brasileiras de venda própria, apresentação exata. Separar preço normal, promoção e PIX. Não usar marketplace, decant, tester ou sem caixa como equivalente.
4. Seguir regras de preço já aprovadas em AGENTS.md e decisão específica do produto. Preço termina 9,90; PIX 5% abaixo calculado em centavos. Não criar custo ou preço por suposição.
5. Lucro bruto = venda − custo; margem = lucro bruto/venda. Lucro líquido exige taxas efetivas, tributos e despesas: sem esses dados, informar que não foi apurado.
6. Fotografias autênticas oficiais de frasco/caixa, otimizadas, sem geração que altere produto. Usar componentes existentes.
7. Descrição exclusiva Valenza, dados conferidos. Pirâmide pelo fabricante mais 3–4 lojas; divergência resolvida pela fonte oficial mais direta e registrada. Não prometer horas de fixação sem base.
8. Manter IDs; estoque administrativo 100 conforme regra do proprietário não representa pronta entrega física. Sob encomenda, preparação 8–10 dias úteis, limite 10 por produto/carrinho conforme implementação existente. Não resetar estoque de itens existentes.
9. Preferir painel existente para cadastro D1. Para inclusão por arquivos, preservar backup/ref, sincronizar catálogo/Worker/SEO/feeds/evidência, executar verificações AGENTS.md e revisar diff.
10. Só afirmar publicado após verificar produto, imagem, preço, PIX, detalhes e disponibilidade no site efetivo. GitHub salvo não prova implantação Cloudflare. Não registrar senhas ou tokens no repositório.

## Bahiya Garnet — ficha preparada, publicação pendente
Identificado na imagem enviada: Arabiyat Prestige Bahiya Garnet, Eau de Parfum 100ml. ID proposto bahiya-garnet; coleção arabes; categoria feminino segundo thearabiyat.com (uma página regional apresenta unissex).
Fonte da marca: https://thearabiyat.com/product/arabiyat-prestige-bahiya-garnet-edp-100ml-women
Descrição original:
Bahiya Garnet transforma o brilho das frutas em uma presença envolvente. Bergamota e mandarina iluminam a abertura, enquanto cereja, manga e pera acrescentam uma doçura suculenta. No coração, coco, figo e jasmim encontram o âmbar marinho, criando um contraste cremoso e luminoso. Baunilha, almíscar, âmbar seco e sândalo dão à evolução um acabamento macio e acolhedor. O frasco em forma de cálice, com tons de granada e detalhes dourados, acompanha o caráter expressivo desta criação de Arabiyat Prestige.
Descrição curta: Floral frutado com frutas suculentas, coco, jasmim e uma base de baunilha e sândalo.
Topo: Bergamota, Mandarina, Cereja, Manga e Pera.
Corpo: Coco, Jasmim, Figo e Âmbar Marinho.
Fundo: Âmbar Seco, Almíscar, Baunilha e Sândalo.
A página regional arabiyatprestige.com omite cereja; mantida a lista de thearabiyat.com. Mariam e King omitem coco no coração; SLM confirma coco. Sem afirmar duração fixa ou inspiração em outra marca.

Galeria da marca (primeira imagem ainda requer inspeção visual antes de selecionar a principal):
https://thearabiyat.com/public/uploads/all/if38xgMg6nT9zjObv17ApMriayKvDVJxkeNyzM6P.jpg
https://thearabiyat.com/public/uploads/all/9BoSKYf7p8FSmjCB8VvvOHJ0jYn1gD6LlHgKoIUG.jpg
GTIN candidato encontrado: 6290361912386; requer associação direta à apresentação 100ml e evidência antes de tratar como confirmado.

### Referências de preço, 12/10/2026
| Loja | Preço normal/anunciado | Observação |
|---|---:|---|
| Mariam Beauty | R$549,00 | Venda própria; 100ml |
| The King of Parfums | R$369,00 | Página mostra 100ml; PIX R$332,10 |
| SLM Perfumes Árabes | R$376,43 | Venda própria; 100ml |
| Zena Perfumes | R$684,99 | Venda própria; PIX R$650,74 |
Não apresentar estas quatro lojas como grandes redes nacionais. Não encontrados preços próprios confirmáveis de Sephora, Época ou Beleza na Web para este produto nesta pesquisa.
URLs:
https://mariambeauty.com.br/products/perfume-bahiya-garnet-feminino-edp-100ml
https://www.thekingofparfums.com.br/produtos/arabiyat-bahiya-garnet-1yt5z/
https://slmperfumesarabes.lojaintegrada.com.br/perfume-arabe-arabiyat-prestige-bahiya-garnet-100ml
https://zenaperfumes.com.br/produtos/perfume-arabe-feminino-bahiya-garnet-arabiyat-prestige-100ml/

Compras Paraguai está indisponível e sem oferta atual: https://www.comprasparaguai.com.br/eau-de-parfum-p-arabiya-prestige-bahiya-garnet-100ml__5372276/
Nissei anuncia US$46, fora de estoque: https://nissei.com/br/perfume-arabiyat-prestige-bahiya-garnet-edp-femenino-100ml
Custo apenas indicativo: 46 × 5,30 + 40 + 20 = R$303,80.
Preço R$499,90 consta de preparação anterior, não de confirmação nesta auditoria. Nesse cenário: PIX R$474,91; bruto cartão R$196,10 (39,23%); bruto PIX R$171,11 (36,03%). Líquido não apurado. R$499,90 supera duas referências próprias brasileiras, portanto não declarar menor preço.
Pendências concretas: confirmar fornecimento/custo disponível, GTIN e imagem selecionada; obter sessão administrativa ou implantação Cloudflare autorizada; conferir publicação real. O produto não foi publicado nesta revisão.
