# Alertas Valenza por WhatsApp — estado de preparação

## Estado confirmado

- Worker: rota POST `/api/notifications/resend/inbox` adicionada; processa somente evento `inbox.email.received` da caixa `contato@valenzaparfums.com.br`.
- Segurança: assinatura Svix/HMAC verificada sobre corpo original, janela de 5 minutos, sem execução/interpretação de conteúdo de e-mail, sem leitura automática dos anexos e com idempotência por mensagem/destinatário.
- Testes: `node scripts/test-resend-whatsapp-alerts.mjs`; incluído na CI de pagamentos.
- Resend: webhook criado para `https://www.valenzaparfums.com.br/api/notifications/resend/inbox` e **DESATIVADO** até configuração correta do segredo; ID no painel Resend.
- Cloudflare: `RESEND_INBOX_WEBHOOK_SECRET` **NÃO configurado**. Não ativar webhook antes de gravá-lo e testar assinatura real.
- Envio de venda: implementação pré-existente em `src/worker.js`, `sendAdminSaleWhatsApp`; nenhuma credencial WhatsApp foi configurada.
- **Não existe integração ativa de WhatsApp**. Não considerar avisos habilitados até confirmação de envio real autorizado.

## Etapas restantes com Meta

1. Escolher integração oficial com suporte a **WhatsApp Business App coexistence** (via Meta Embedded Signup de parceiro elegível), preservando o aplicativo atual, número e atendimento. Confirmar preço, elegibilidade, propriedade dos ativos e condições antes de vincular.
2. Responsável pelo número conclui somente o fluxo Meta/WhatsApp Business no próprio aparelho, depois de iniciado o onboarding na plataforma autorizada. Nunca compartilhar códigos com terceiros nem desinstalar o WhatsApp Business.
3. Obter `WHATSAPP_PHONE_NUMBER_ID`, token permanente com permissões mínimas, e aprovar os modelos: `valenza_nova_venda` (5 variáveis: pedido, cliente, valor, método, hora) e `valenza_novo_email` (3 variáveis: remetente, assunto, hora).
4. Configurar no Worker, como secrets, `WHATSAPP_ACCESS_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`; como variável segura `WHATSAPP_ADMIN_RECIPIENTS` (números destinatários E.164 sem "+"); se necessário, `WHATSAPP_API_VERSION`, `WHATSAPP_SALE_TEMPLATE_NAME`, `WHATSAPP_SALE_TEMPLATE_LANG`, `WHATSAPP_EMAIL_TEMPLATE_NAME`, `WHATSAPP_EMAIL_TEMPLATE_LANG`.
5. Pelo painel do Resend, copiar o **signing secret** do webhook já criado e registrar **somente como secret no painel Cloudflare** `RESEND_INBOX_WEBHOOK_SECRET`, nunca em GitHub, arquivo público ou chat. A conexão automática entre conectores foi bloqueada e não deve ser contornada.
6. Confirmar deployment da versão GitHub no Worker, validar assinatura real do webhook, então reativar webhook no Resend.
7. Fazer teste controlado de entrega para destinatário autorizado, checar retornos Meta e tabela `admin_inbox_whatsapp_alerts`. Nunca simular compra paga em produção para disparar alerta.

## Operação segura

- Não usar API WhatsApp Web não oficial com número pessoal/comercial que já atende clientes.
- No aviso de e-mail, enviar somente remetente, assunto e horário, sem corpo nem anexos.
- O destinatário do alerta não precisa ser o próprio número remetente; o número da empresa envia a um número pessoal autorizado.
- O monitoramento existente do ChatGPT/Resend permanece independente até completar a integração.
