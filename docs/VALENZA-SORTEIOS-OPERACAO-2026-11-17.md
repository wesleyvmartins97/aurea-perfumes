# Valenza Sorteios — operacao da campanha natal-2026

## Producao

- Cloudflare Worker: `valenza-sorteios-admin` (versao 98 implantada em 17/11/2026, 21h22 BRT).
- Agendamento da coleta: `*/15 * * * *` (96 execucoes programadas a cada 24 horas).
- Manter integracoes existentes com D1, KV, bridge Meta/Instagram e IA.
- O Worker implantado na Cloudflare e a fonte operacional nesta data. Este arquivo registra o estado, **nao** substitui seu codigo-fonte nem deve ser usado como deploy automatico.

## Regras automatizadas

1. Ler os comentarios reais do post oficial.
2. Contar uma chance por comentario que marque **duas contas distintas**. Comentarios com zero ou uma marcacao nao concorrem.
3. Nao adicionar chance para a mesma dupla marcada novamente pelo mesmo perfil, inclusive com os nomes em ordem invertida.
4. Diferentes duplas em comentarios distintos podem gerar mais chances.
5. Comentarios excluidos deixam de concorrer apos uma varredura oficial completa. Nunca marcar exclusoes a partir de varredura incompleta.
6. Nao reprovar participantes so por ausencia de prova automatica de seguidores, curtida ou repost: conferir o possivel ganhador manualmente.

## Economia D1 — versao 98

- Nao regravar comentarios inalterados.
- Guardar os IDs observados ao longo de sincronizacoes paginadas via KV e comparar a lista completa para identificar exclusoes.
- Conciliar a primeira ocorrencia das duplas e o status de validacao somente quando houver diferenca.
- Preservar as tabelas, os registros originais, as provas, a trilha de auditoria e a possibilidade de rollback.

## Painel e encerramento

- Dar destaque a chances validas, participantes, comentarios sem chance e comentarios coletados.
- Manter funcoes avancadas fora do caminho principal, sem remover registros historicos.
- Exportar candidatos validos em CSV, XLSX ou PDF (com a autenticacao administrativa existente).
- Apos o encerramento em **23/12/2026 as 19h (Brasilia)**, conferir a ultima coleta completa, congelar a lista com os controles de auditoria e realizar o sorteio externo; verificar as outras regras no candidato antes da premiacao. Sorteio ao vivo previsto para 20h.

## Seguranca e testes

- Nao guardar senhas, tokens, cookies, informacoes privadas de participantes nem chaves de API neste repositorio.
- Nao remover registros historicos ou backups sem revisar dependencia e recuperacao.
- Validar `PRAGMA quick_check`, nenhuma dupla valida duplicada, totais preservados, coleta cron e respostas das exportacoes autenticadas.
- Em incidentes, usar o historico de versoes/deployments do Cloudflare para rollback; nao desligar a coleta ou apagar participacoes.


## Atualizacao v99 — 17/11/2026 (Cloudflare)

- Worker versao 99 (`64027bdc-fb78-4a6f-8523-9fed64d4fe01`) publicado com 100% do trafego.
- Exporte `/api/export?set=valid&format=csv` para obter apenas **Chance;Perfil;ID_Comentario**, sem verificacoes pendentes.
- Exporte `/api/export?set=valid&format=txt` para obter 1 entrada unica por chance, formato `@perfil | Chance 001`, preservando multiplas chances legitimas do mesmo perfil.
- `format=csv-auditoria` preserva dados completos das marcacoes e as verificacoes apenas para consulta, sem poluir o arquivo principal.
- `approvedRows` exige `c.base_valid=1`, `c.is_deleted=0` e que o comentario seja o `first_id` da sua dupla canonica em `participant_pairs`. Exclui uma marcacao, mesma dupla ou ordem invertida.
- Visual principal prioriza CSV/TXT; XLSX/PDF detalhados ficam sob `Outros formatos`.
- Auditada query real no D1: 98 comentarios elegiveis, 2 sem chance e nenhuma duplicata valida. Coletas ID 307 e 308 completaram sem erro; integridade do D1 ok. Cron continua 15 minutos.
- Backup local: `C:\DCNOVO\Backups\valenza-sorteios-worker-v99-20261117.mjs`, SHA-256 `411f8ebc5202740934e354abdd7f2efb65d33ec65d41f5862b4208bb315c0451`.
- QA isolado Windows: `node --check`, CSV, TXT, CSV auditoria, defaults, export vazio e layout Chrome headless 320/390/768/1280 passaram. Download administrativo real permanece protegido por autenticacao e nao foi testado em navegador com login.
- Versao v98 e auditoria antigas preservadas, para rollback e rastreabilidade.
