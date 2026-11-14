# Android Valenza Parfums — teste 1.0.0

Conta Cloudflare/GitHub: wesleyvmartins97@gmail.com; repositório aurea-perfumes.
Não pertence ao Crediário/conta KW.

Publicação manual preservou o módulo worker.js compilado de produção, todos os
assets e bindings, acrescentando apenas app-entry.mjs, android-app.mjs e android-apk.mjs.
Backup para rollback Cloudflare anterior ao app: versão 2836b17d-c92d-4015-8955-b9efe42b3c85,
deployment e6185ec3-5d19-44ea-b1b2-f462c74d43ac. Rollback remove o download, não os
clientes/pedidos: nenhuma migração de banco executada nesta tarefa.

APK SHA-256: a50d1b26c7e02464b199fcc038aaa045c9dea78edb9aae91479a812a8f5cc8dd
Certificado SHA-256: 05a9300008b966015918649db7923bca94f69dce15ff7b73e5fd7b84b90eceba

Rotas: /api/app/install, /api/app/download, /api/app/version, /api/app/client.js.
Link na tela de login e na lateral da conta, escondido dentro do próprio APK.
Todos os testes obrigatórios do AGENTS.md passaram. Assinatura APK v2/v3 validada.
Verificados no navegador: instalador, logo, login e link da conta.
Limitação: não foi executado num dispositivo Android/emulador; teste real pendente.
Play Store, App Store e verificações de desenvolvedor não foram configurados nem pagos.
