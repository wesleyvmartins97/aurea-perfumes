# Laboratório Stories com link — decisão técnica 18/11/2026

## Problema real e restrições
- A Valenza JÁ tem agendador Cloudflare/Nexus funcionando; Stories comuns Instagram/Facebook continuam intocados.
- Meta Content Publishing API publica Story normal, **não** figurinha de link interativa.
- `instagrapi 3.2.15` no Windows: Python 3.13, ambiente isolado, 7 testes e instalação OK, mas `ClientNeedsUpgradeError` em login na conta pessoal `@wesleyvmartins` e **nenhum Story publicado**. Não insistir em login privado sem diagnóstico. Releases 3.2.16/17 lançadas depois, mas **não há prova de solução** para esse erro.
- **Nunca** pegar credenciais/cookies/sessões da conta comercial para testar; não usar proxies/VPN ou burlar desafios; não publicar teste na Valenza.
- Conta pessoal do Wesley serve como teste; uma única publicação com imagem aprovada **Sabah Al Ward Pearl** e link `https://www.valenzaparfums.com.br/perfume/sabah-al-ward-pearl/` marcado como `utm_medium=internal_test`.
- Usuário quer automação própria, gratuita e sem outro agendador. Não criar segundo post paralelo para o mesmo item, nem interferir em Direct/IA, sorteio, campanhas, catálogo e checkout.

## Pesquisa cruzada (fatos x hipótese)
| Caminho | Verificação independente | Custo | Restrição |
|---|---|---|---|
| Meta Graph Content Publishing | Docs/fornecedores indicam stickers não disponíveis | sem serviço extra | não resolve link |
| instagrapi Private API | suporta `StoryLink` e já foi testado publicamente pelo mantenedor; login pessoal recusado no V4 | MIT, gratuito | instável / segurança de conta; **não repetir agora** |
| Android real via Appium/ADB/UiAutomator2 | exemplos públicos fazem upload de Story usando o Instagram instalado; campo Link ainda precisa ser implementado/testado | ferramentas gratuitas | celular conectado/autorizado, mudanças de UI, risco de termos Instagram |
| Automate LlamaLab (Android) | app grátis até **30 blocos em execução**, HTTP request e Interact touch | grátis no limite | sticker de IG ainda **não testado**, acessibilidade e aparelho ligado |
| InstaAddict (MIT) | motor UI/ADB atualizado e gratuito | grátis | não tem fluxo link-sticker pronto; apenas referência de viabilidade |
| ozanzeng/instagram-android-appium | publicou técnicas de Appium, `noReset` e dry-run | **licença PolyForm Noncommercial** | **NÃO copiar/usar código na loja comercial** |
| Storrito | documentação afirma links reais em Story via automação do app Android | **pago** (storage+connection, cerca US$18,60/31 dias no guia) | não é solução grátis nem nossa |
| Onimator/IGBot | fabricante documenta campo Link sticker URL num agendamento Android | pago | alegação do fornecedor, não testado conosco |
| Instagram Sharing-to-Stories Content URL | oferece compartilhamento de asset e URL de atribuição em aplicativo Android | implementação própria potencial | **não é prova de figurinha Link clicável nem publicação automática** |

Fontes e licenças:
- https://support.vistasocial.com/hc/en-us/articles/17368921608859-Can-I-publish-Instagram-Stories-with-stickers-links
- https://github.com/subzeroid/instagrapi/issues/2320
- https://pypi.org/project/instagrapi/
- https://subzeroid.github.io/instagrapi/latest/usage-guide/login-migration/
- https://github.com/joeahkim/InstaAddict
- https://github.com/ozanzeng/instagram-android-appium
- https://appium.io/docs/en/3.3/quickstart/uiauto2-driver/
- https://llamalab.com/automate/doc/premium.html
- https://llamalab.com/automate/doc/block/interact_touch.html
- https://storrito.com/help-center/how-to-add-link-stickers-to-your-instagram-stories-from-your-pc-with-storrito-com/
- https://storrito.com/help-center/our-usage-based-pricing-guide/
- https://onimator.com/guides/how-to-schedule-an-instagram-story-with-a-link-sticker/

## Próximo experimento — APENAS conta pessoal e Android
1. Verificar se o Instagram **oficial** está logado no `@wesleyvmartins` no Redmi Note 12 Pro; nunca introduzir senha no script.
2. **Somente leitura**: detectar se há Android conectado via ADB, autorização local USB, e presença do app instalado; sem tocar em contas.
3. Teste **sem publicar**: abrir no Android a arte aprovada, entrar no compositor Stories, localizar figurinhas > Link, inserir o URL com `internal_test`, mostrar prévia e PARAR ANTES de `Compartilhar`.
4. Capturar confirmação visual sem senhas/tokens; se funcionar, um único Story real na pessoal mediante comando explícito, confirmar link clicável na UI, obter ID/resultado, limpar apenas o teste.
5. Se falhar, parar: nenhum loop infinito, tentativas de senha, publicação duplicada ou conta comercial.
6. Registro de sucesso exige **Story publicado, link clicável no app real e URL correta**. Exibir asteriscos ou mostrar `StoryLink` numa biblioteca NÃO basta.
7. Somente depois de sucesso real considerar mudança **mínima** no publicador da Valenza: reservar job uma vez (lock/idempotência); publicar IG pelo Android somente job com link; manter Facebook na rota atual; registrar evidência; falha incerta => intervenção humana, nunca fazer segunda publicação automática.

## Disponibilidade 24h e limitações reais
- Automação pela interface requer Android ligado, Instagram autenticado e UI em estado controlável; o Windows pode estar desligado **se** o executor for no próprio Android e puder receber a fila pela rede, mas não é confiável se o aparelho ficar desligado/ocupado/sem internet ou bateria.
- O plano grátis Cloudflare Workers NÃO executa um Android gráfico e não pode criar figurinha via API oficial.
- Até prova real, o agendador oficial continua operando 100% dos Stories existentes. Não implementar `auto-post` paralelo.
- **Pendente neste momento:** nenhum Android/ADB verificado e nenhuma figurinha clicável publicada por este laboratório.

**Status técnico: pesquisa e plano concluídos, publicação Android real NÃO testada.**
