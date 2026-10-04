export function catalogPageHtml(html){
 const main=html.indexOf('<main id="top">'),start=html.indexOf('<section class="section" id="catalogo">',main),end=html.indexOf('<section class="about-valenza"',start),close=html.indexOf('</main>',end);
 if([main,start,end,close].some(n=>n<0))throw new Error('Catalogue template boundaries missing');
 html=html.slice(0,main)+'<main id="top">'+html.slice(start,end)+html.slice(close);
 html=html.replace('<body','<body class="catalog-page"').replace('<div class="eyebrow center">CATÁLOGO VALENZA</div>','<p class="catalog-breadcrumb"><a href="/">Início</a> / Catálogo</p><div class="eyebrow center">CATÁLOGO VALENZA</div>');
 html=html.replace(/<title>[^<]*<\/title>/,'<title>Catálogo de perfumes | VALENZA PARFUMS</title>');
 html=html.replace(/(<link rel="canonical" href=")[^"]*/,'$1https://www.valenzaparfums.com.br/catalogo/');
 html=html.replace(/(<meta property="og:url" content=")[^"]*/,'$1https://www.valenzaparfums.com.br/catalogo/');
 html=html.replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*/g,'$1Catálogo de perfumes | VALENZA PARFUMS');
 html=html.replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*/g,'$1Explore perfumes árabes e designer. Busque por perfume ou marca, filtre e ordene o catálogo completo da VALENZA PARFUMS.');
 html=html.replace(/href="#top"/g,'href="/"');
 html=html.replace(/href="#sobre"/g,'href="/#sobre"');
 return html;
}
