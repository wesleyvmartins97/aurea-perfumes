# Valenza Parfums — Android 2.1.0

Pacote `br.com.valenzaparfums.app`, versão de atualização 3, Android 8+ (API 26).
UI Android escrita em Java com Views e Canvas. Não contém WebView, HTML local,
JavaScript de interface nem bridge. O catálogo, busca/filtros, favoritos, sacola,
login/cadastro, perfil/senha, endereços, pedidos/rastreios e Pix são telas nativas.
Cartão abre o checkout seguro existente no navegador, via link de uso único de
60 segundos; dados do cartão não entram no app. A mesma loja e D1 continuam sendo
as fontes dos preços, pedidos, contas e confirmações de pagamento.

Inclui um catálogo público inicial e 69 fotos reais existentes no site, em um
arquivo de imagens compactadas com índice. Consulta offline é identificada;
compra e preços atuais precisam de conexão. Favoritos e sacola ficam no aparelho,
separados por conta; não há sincronização desses dois recursos entre aparelhos.
Sessão e dados locais privados são cifrados com AES-GCM usando Android Keystore.
Não grava senha, dados de cartão, CPF ou histórico de pedidos em texto puro.

Abertura Canvas de 3,2 segundos: V oficial girando, partículas, luz e movimento
até a posição da logo na tela de entrada. Pode pular tocando. Som original por
síntese de sete notas/harmônicos; não usa gravações de terceiros. Respeita modo
silencioso e opção persistente para desligar.

Mantém o certificado da versão 1 para permitir atualizar sem desinstalar.
O app antigo guardava a sessão na WebView, portanto o primeiro acesso nativo
exige entrar novamente; clientes e pedidos continuam no servidor.
APK público: `public/downloads/Valenza-Parfums.apk`. Chaves privadas ficam fora
Git. Nunca prometer ausência de avisos do Play Protect por distribuição direta.

Build: `ANDROID_TOOLS=/path/to/tools SIGNING_DIR=/private ./android/build.sh`.
Requer JRE21, ECJ, plataforma Android35, aapt2, D8, zipalign e apksigner.
Os assets públicos são preparados a partir de public/products.js e suas fotos.
A publicação normal do repositório envia o APK como asset estático, sem inserir
megabytes de base64 dentro do Worker.

Validação efetuada: compilação Java/recursos/DEX; alinhamento e assinatura v2/v3;
testes de hash/nome/download e rotas; handoff (autenticação, origem, uso único,
expiração, sessão e XSS); verificações obrigatórias do catálogo/visual do site.
Não executado em aparelho/emulador Android nesta infraestrutura. O teste no
celular continua necessário. Não foram criados pagamentos reais para testar.

Atualização 2.1: sacola com fotos, controles compactos, ícones vetoriais com antialiasing, marca em alta resolução, fotos originais até 960px, hierarquia de texto e ação fixa no detalhe. Conferência visual em aparelho ainda necessária.
