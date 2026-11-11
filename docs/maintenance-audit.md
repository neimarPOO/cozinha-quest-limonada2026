# Revisão de manutenção — 11/11/2026

Correções aplicadas sem alterar as regras das receitas, o cenário ou a identidade visual:

- A sincronização aguarda gravações pendentes e compartilha consultas em andamento, em vez de retornar dados antigos como se estivessem atualizados. As requisições têm limite de tempo.
- Reenvios usam o mesmo identificador de operação. Envios sem confirmação ficam preservados no navegador, com recuperação e exportação. A recuperação consulta a confirmação no servidor antes de reenviar; envios antigos exigem conferência manual. O monitor pode arquivar pendências após conferir o histórico, mantendo uma cópia local.
- A roleta consulta novamente a partida ao terminar a animação e anuncia o prêmio após a confirmação do servidor. A recuperação de envio restaura o resultado já registrado ou permite o giro pendente. Callbacks de partidas anteriores não devem substituir a tela de uma partida nova.
- O tempo registrado usa a duração definida ao iniciar a partida, mesmo que o administrador altere a configuração durante o preparo.
- A API valida identidades, estruturas, transições de resultados, reservas, horários e backups antes da gravação. Alterações atômicas verificam limites sequencialmente. Entradas inválidas não devem substituir o estado existente.
- Desktop e administração móvel compartilham inicialização, autenticação e utilitários de estado. Removidas funções locais de sorteio sem uso.
- Comparações de históricos usam mapas e conjuntos, evitando buscas quadráticas. A normalização de históricos grandes não expande todos os IDs na pilha de chamadas.
- O acesso ao armazenamento anterior da Netlify só é construído se a migração inicial realmente precisar consultar dados antigos.

## Verificação

- `npm test`: 59 testes aprovados, incluindo regressões para validação, confirmação idempotente, estados finais, sessões duplicadas e histórico grande.
- `npm run test:server`: entrega HTTP, compressão e cache aprovados.
- `npm run build`, checagem de sintaxe dos scripts alterados e `git diff --check` aprovados.
- `npm audit --omit=dev`: nenhuma vulnerabilidade conhecida na consulta realizada.
- Chromium com servidor e armazenamento locais isolados: tela inicial, diálogos de receitas/regras, login desktop e móvel, painel da roleta no celular, início das três receitas sem WebGL e início da cena WebGL de cookies. Sem exceções de JavaScript nesses cenários.
- Simulação de resposta perdida após gravação: reenvio confirmado, estoque aumentado uma vez. Simulação de indisponibilidade completa após gravação: envio preservado e posteriormente confirmado, sem duplicar estoque.

O banco de produção não foi alterado por esta revisão. O teste visual de WebGL utilizou renderização por software; não mede desempenho em uma GPU física nem substitui uma partida manual completa em cada receita. Alterações anteriores das luvas térmicas foram preservadas.
