# Valenza Parfums — Android 1.0.0 teste

Pacote `br.com.valenzaparfums.app`, Android 8+ (API 26), alvo API 35.
Aplicativo Android com Activity, animação, toque sintetizado original, menu nativo,
ícone oficial V com diamante e WebView do domínio HTTPS da loja. Não é um app de
catálogo nativo/offline: a loja é carregada pela WebView e exige internet. Catálogo,
conta, pedidos e pagamentos usam o sistema existente. O aplicativo pede login para
adicionar ao carrinho e o checkout existente valida conta e confirmação do e-mail.

Não pede contatos, arquivos, câmera, localização ou instalação de pacotes. Não
expõe bridge JavaScript. Não ignora erros SSL, não aceita HTTP nem conteúdo misto.
Links externos abrem o aplicativo apropriado; cookies ficam privados na WebView.
Chave privada de assinatura fica fora do Git. Mesma chave + pacote devem ser
mantidos nas próximas atualizações. Não há garantia de instalação sem avisos
do Android nem publicação no Google Play nesta versão de teste.

Som: WAV sintetizado de 0,8 segundo, frequências 523,25 / 659,25 / 783,99 Hz,
envelope exponencial. Sem amostras ou melodias de terceiros. Uso livre no projeto.
Respeita modo silencioso e oferece opção persistente para desligar.

Verificação: compilação de recursos, Java e DEX; zipalign; assinatura APK v2/v3;
testes de rotas do download, hash e catálogo. A instalação/execução em aparelho
Android real ainda deve ser feita pelo proprietário; não foi emulada aqui.

O módulo app-entry.mjs apenas envolve o Worker existente para servir o instalador,
APK e link no painel de conta. Não muda tabelas, pedidos, preços ou pagamentos.
