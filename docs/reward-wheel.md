# Roleta e painel administrativo

O admin desktop e o móvel têm uma aba **Roleta**, logo após **Painel**, com
atalho no painel inicial. A aba reúne o critério de liberação (pontuação mínima
ou conclusão integral), a pontuação de 0 a 1.000 e o limite geral diário. Estoque
e limites individuais continuam na aba **Prêmios**; duração das receitas permanece
em **Configurações**. Os salvamentos são independentes para evitar que salvar uma
regra sobrescreva o tempo da receita. A regra efetivamente salva é exibida no painel.

## Roleta de teste

- **Conferir os itens cadastrados:** permite selecionar qualquer prêmio ou girar
  aleatoriamente entre os itens. Mostra inclusive os itens sem estoque, para
  conferir nomes e setores. Não representa disponibilidade para entrega.
- **Simular regras e disponibilidade reais:** recebe pontuação e conclusão da
  receita; usa a mesma função de sorteio do jogo. Respeita elegibilidade, estoque,
  limite por prêmio, limite geral, probabilidades, insígnia digital e um giro extra.

Os dois modos são somente leitura: não geram partida, auditoria, reserva ou entrega,
nem consomem estoque. A listagem mostra todos os nomes cadastrados, estoque total,
limite diário e disponibilidade de hoje. Antes do teste o painel consulta o evento;
se não conseguir atualizar os dados, informa que é necessário conectar-se.
O teste usa a configuração salva, e não um rascunho ainda não enviado no formulário.

`js/wheel-rules.js` contém a função pura de sorteio, usada tanto pelo jogo quanto
pela simulação. Os setores são derivados de `db.prizes`, incluindo nomes e IDs
atualizados. Os sete itens atuais, a insígnia e o giro extra formam nove setores;
o ângulo se adapta ao número de setores. A simulação usa `WheelDesign.svg`, com
IDs separados da roleta do jogo para não conflitar com seus gradientes e rótulos.
A animação congela os setores durante o giro e respeita movimento reduzido.

A apresentação usa a paleta da cozinha e SVG. O admin móvel continua sem carregar
Three.js, modelos ou texturas do ambiente de jogo.

Validação: testes de regras, disponibilidade, imutabilidade dos dados, setores
derivados do cadastro e probabilidades. No Chromium, conferir os dois painéis,
salvar a regra, visualizar os sete itens, testar um item específico, bloquear uma
partida incompleta e comparar estoque/histórico antes e depois das simulações.
