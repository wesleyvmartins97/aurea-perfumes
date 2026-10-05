# Últimos dois da lista — conferência em 04/10/2026 (Brasil)

Adicionados Vulcan Baie 100ml e Shagaf Al Ward 100ml. A lista original de dez está concluída; catálogo passa de 65 a 67 produtos. Backup: backup-antes-vulcan-shagaf-20261005 no commit c85b00e782520241458c65539851aace8a72390f.

Regra: custo por unidade = USD × 5,30 + 40 + 15, sem rateio. Margem bruta = (venda − custo)/venda. Preços com final9,90 e PIX5% abaixo. Taxas de cartão, tributos adicionais e despesas operacionais não deduzidos.

| Produto | USD base | Custo | Venda | Lucro bruto cartão | Margem cartão | PIX | Lucro bruto PIX | Margem PIX |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Vulcan Baie100ml |23|176,90|289,90|113,00|38,98%|275,41|98,51|35,77%|
| Shagaf Al Ward100ml |15|134,50|219,90|85,40|38,84%|208,91|74,41|35,62%|

## Paraguai: páginas diretas e diferenças de indexação

- Vulcan Baie: Star Company SKU122375, HTML direto price_amount23 e botão de compra. Resultado indexado mostra24/24,50; usado valor direto23. https://www.starcompany-py.com/perfumes/12237-french-avenue-vulcan-baie-edp-100ml.html
- Vulcan Baie: Ponto Com SKU843409, página direta mostraU$23,00; busca indexada25. https://www.pontocom.com/produto/-codigo-843409
- Vulcan Baie: Nissei SKU149706, US$27, porém fora de estoque no acesso atual (resultado antigo dizia em estoque). https://nissei.com/br/perfume-french-avenue-vulcan-baie-edp-femenino-100ml
- Vulcan Baie: Shopping China SKU1008884, US$33 tax free. https://www.shoppingchina.com.py/producto/perfume-french-avenue-vulcan-baie-edp-100ml-1008884
- Shagaf: Nissei SKU107725, US$15 em estoque no HTML direto. https://nissei.com/br/perfume-al-wataniah-shagaf-al-ward-edp-feminino-100ml
- Shagaf: MultiPass EAN5055810007720, HTML direto preço15 e InStock. Índice antigo13; não usar13 como cotação atual. https://multipass.com.py/destaque/7528-perfume-al-wataniah-shagaf-al-ward-100ml-.html
- Shagaf: Cellshop16 e Shopping China19 encontrados no comparador; páginas diretas bloqueadas/indisponíveis, portanto preço/estoque não confirmados diretamente. https://www.comprasparaguai.com.br/perfume-al-wataniah-shagaf-al-ward-eau-de-parfum-feminino-100ml_47498/

Todos os valores são referências públicas; consultar disponibilidade e valor final antes de adquirir sob encomenda. Não confundir Shagaf original com Gardenia, Sabah Al Ward, body mist ou decant. Preços USD anunciados no regime turístico das lojas, não cotação final tributária de importação comercial.

## Fabricantes, imagens e GTIN

- Vulcan: fabricante Fragrance World https://fragranceworld.ae/french-avenue/ direciona à loja shopfragranceworld.com, que redireciona para https://frenchavenue.com/products/vulcan-baie. Informa Extrait100ml, unissex, GTIN6298042000926 na variante JSON. Lojas PY frequentemente rotulam como EDP; mantida concentração do fabricante, sem criar variante inexistente. Notas oficiais: bergamota/alecrim/groselha preta; manjericão/framboesa/acorde de vodka; âmbar/almíscar/patchouli/sândalo/olíbano.
- Foto Vulcan: frasco e caixa rosa, nome Baie legível, https://www.starcompany-py.com/5515-large_default/french-avenue-vulcan-baie-edp-100ml.jpg . Original800×800 convertido paraWebP sem geração de imagem nem modificação do produto.
- Shagaf: https://saudi.alwataniah.com/products/shagaf-al-ward, GTIN5055810007720 no JSON e na Nissei. Nome oficial Shagaf (também grafado Shaghaf por vendedores). Notas oficiais: jasmim/osmanthus/rosa de maio; tuberosa indiana/narciso; âmbar/cedro.
- Foto Shagaf: frasco + caixa100ml, https://nissei.com/media/catalog/product/p/e/perfume_al_wataniah_shagaf_al_ward_edp_femenino_100ml_107725_0000_1.jpg . Original1000×1000 convertido paraWebP.
- Dados físicos de frete conservadores herdados dos últimos frascos (0,75kg,20×12×16cm), não medidas fornecidas pelo fabricante.

## Brasil

- Beleza na Web Shagaf100ml: página atual224,90, riscado299,00, vendedor Amobeleza; outros parceiros230/234. Não é venda direta da BLZ. https://www.belezanaweb.com.br/shagaf-al-ward-al-wataniah-eau-de-parfum-perfume-feminino-100ml
- Época tem Shagaf vendido diretamente, mas o acesso atual não exibiu preço confirmável. Vulcan listado por parceiros. Valores históricos da busca (inclusive Shagaf129,99 e Vulcan435,90) não tratados como preços atuais. https://www.epocacosmeticos.com.br/shagaf-al-ward-al-wataniah-perfume-feminino-eau-de-parfum/p ; https://www.epocacosmeticos.com.br/melhor-oferta/6298042000926
- Não localizados anúncios confirmáveis desses dois na Sephora brasileira. Não declarar que a loja não vende em absoluto.
- Perfumarias próprias: France Perfumes Vulcan379,99 (PIX360,99); AnMY279,99 promocional (de349,99; PIX251,99); Life Parfums Shagaf149 promocional (de199; PIX141,55). Referências indexadas, não média de mercado nem prova de menor preço Valenza.

## Implementação

Catálogo público, catálogo do Worker, páginas individuais, sitemap e dois feeds sincronizados. MigraçãoV17 insere disponibilidade100 e custos uma vez, sem sobrescrever ajustes existentes nem pedidos. Layout protegido preservado. Validações catálogo, GTIN, Merchant, responsividade, navegação, paginação e ciclo de pedidos passaram com provedores simulados; sem compra real.

### Complemento: Época confirmada pelo catálogo público (22h53 Brasil)

A página renderizada não exibiu preços na coleta anterior; a API pública de catálogo forneceu ofertas atuais pelo EAN, consultadas sem login:
`https://www.epocacosmeticos.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:6298042000926`
e `https://www.epocacosmeticos.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:5055810007720`.

- Vulcan100ml: AAZ Perfumes343,20 (lista440); Perfumaria Salamanca435,90 (lista599); Kassio444 (lista519); Shophub458,57 (lista579,71). Todas são lojas parceiras; oferta própria da Época indisponível.
- Shagaf100ml: Evas186,90 (lista373,90); Kassio191 (lista299); Amobeleza200,90 (lista299); Beleza Box211 (lista253,20); Sintra219,90 sem desconto. Todas parceiras; oferta própria da Época indisponível.
- Preços de oferta consultados, sem frete; eventuais condições de PIX/cupom dependem do checkout. Valores riscados são preços de lista anunciados, não média nacional nem prova de preço habitual.
- Valenza289,90 fica15,5% abaixo da oferta Vulcan343,20; Shagaf219,90 fica17,7% acima da Evas186,90 e2,2% abaixo da Amobeleza na BLZ224,90. Mantida margem definida pelo usuário; não alegar menor preço geral.
