# Correção de catálogo — 04/10/2026

Pedido: corrigir fotos e preços conforme regra existente após Yara e Yara Elixir aparecerem com fotos da mesma versão. Backup GitHub: backup-yara-catalogo-2026-10-04, commit 16812935d6ac8d162b22a5d0b4a54311f10e73ce.

## Achados e correções

- Catálogo em produção: 65 produtos; IDs, nomes e GTINs sem repetição. Os 65 arquivos foram baixados, abertos e comparados visualmente; nenhum arquivo byte a byte duplicado. A comparação visual identificou Yara tradicional usando outra foto do Elixir (o selo do frasco e da caixa diz Elixir). Arquivos diferentes não provam versões diferentes.
- Yara 100ml: foto oficial do Yara rosa-claro com detalhes prateados, frasco e caixa, GTIN 6291108730515 conferido na variante 100ML do fabricante. Caminho novo evita reutilizar cache da foto incorreta.
- Yara Tous 100ml: substituída miniatura com excesso de espaço por foto oficial de frasco e caixa em alta resolução.
- My Way EDP 90ml: foto do fabricante brasileiro mostra explicitamente 90ml e Eau de Parfum na caixa. Enquadramento em canvas SVG de fotografia original, exportado em WebP; sem geração ou alteração do frasco/rótulo.
- Sem mudanças de CSS, cards, pontos de quebra, filtros ou paginação. Não confundir linhas como Angham/Second Song, Musamam/White Intense, Asad/Bourbon/Zanzibar/Elixir.

## Preço corrigido do Yara

Fórmula por unidade: (USD × 5,30) + 40 + 15. Margem bruta sobre a venda; custos operacionais, taxas de cartão e tributos não deduzidos. PIX calculado em centavos, 5% abaixo.

| Produto | USD referência | Custo BRL | Preço cartão BRL | PIX BRL | Margem bruta cartão |
|---|---:|---:|---:|---:|---:|
| Yara tradicional 100ml | 23 | 176,90 | 289,90 | 275,41 | 39,0% |
| Yara Elixir 100ml, mantido | 25 | 187,50 | 309,90 | 294,41 | 39,5% |

Yara antes: R$269,90. Star Company apresenta referência de US$23 na página indexada aberta e US$22 no HTML consultado diretamente; utilizado US$23 conservador. Intershop direto mostra US$24, embora comparador mostre22. Nissei mostraUS$25. Não usar menor preço agregado de US$19,50: a oferta correspondente é Yara Moi e foi misturada ao agrupamento do Yara tradicional. Valores são referências públicas, sujeitos a disponibilidade e confirmação na compra.

Referências Brasil: Lattafa Brasil Yara R$359,90 normal (indexação também mostra promoção323,91); não usar marketplace como referência principal. Os oito recentes já usam custos/documentação de hoje e preços com margens brutas entre38,4% e39,9%, ver docs/PRECOS-QUATRO-2026-10-04.md e docs/PROXIMOS-QUATRO-2026-10-04.md. Preservados. Não foi refeita uma cotação de aquisição dos outros56 produtos nem declarada rentabilidade integral do catálogo.

Migração V16 aplica preço289,90 e custo176,90 ao Yara uma única vez. Preço público, Worker, SEO, sitemap e dois feeds sincronizados. Nenhum pedido histórico alterado.

## Fontes

- https://www.lattafa-usa.com/products/yara — variante100ML, GTIN6291108730515; dados públicos em products/yara.json.
- Foto Yara: https://cdn.shopify.com/s/files/1/0754/4936/8799/files/2_c8edbe08-b556-46ce-b197-6c42938372a8.png?v=1747500015
- Foto Tous: https://cdn.shopify.com/s/files/1/0754/4936/8799/files/2_9c54476c-b1d0-45ed-9bc9-f9f0e7678e56.png?v=1749487600
- My Way: https://www.armani.com.br/perfume-my-way-eau-de-parfum-90-ml-giorgio-armani-lb402700-nlp-90ml/p
- Foto My Way: https://armani.vtexassets.com/arquivos/ids/188504/3614272907690-MY-WAY_2.jpg?v=638453241944300000
- https://www.starcompany-py.com/perfumes/7493-lattafa-yara-100ml-fem.html
- https://intershop.com.py/item/perfume-lattafa-yara-feminino-edp-100ml-rosa-837342440
- https://nissei.com/br/perfume-lattafa-yara-exilir-edp-femenino-100ml
- https://www.comprasparaguai.com.br/perfume-lattafa-yara-eau-de-parfum-feminino-100ml_50537/
- https://www.lattafabrasil.com/lattafa

## Lista original

Adicionados: Dalal, Club de Nuit Intense Woman, Victoria, Musamam original; Durrat Al Aroos, Yara Elixir, Haya, Petra. Faltam Vulcan Baie e Shaghaf Al Ward, conforme registro da lista anterior; não incluídos nesta correção.
