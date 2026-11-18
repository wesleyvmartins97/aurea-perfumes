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

