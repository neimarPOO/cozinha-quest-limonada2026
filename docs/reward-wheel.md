# Roleta de recompensas

O desenho usa a paleta da cozinha: verde escuro, creme, verde-limão, madeira e metal
dourado. O SVG tem ícones vetoriais de bebida, doce, ingresso, brinde, insígnia e giro
extra. O selo central de chef permanece fixo enquanto os setores giram.

A receita e a pontuação aparecem ao lado da roleta; no celular, a composição fica
vertical e permite rolagem em telas baixas. O botão e as mensagens têm foco e anúncio
por teclado/leitor de tela. A preferência por movimento reduzido encurta somente a
animação; o resultado continua sendo escolhido antes dela.

`js/wheel-design.js` gera a arte e os estados de apresentação. `app.js` continua
responsável pelo sorteio, estoques, limites, sessões, giro extra, reserva e resultado.
Foram mantidos os oito setores e sua ordem angular (45° por setor), assim como as
regras e probabilidades existentes. Os três setores digitais mostram a insígnia
que já era concedida por esses resultados.

A roleta não carrega Three.js nem cria outro contexto WebGL. SVG, CSS e animação de
transformação dão o acabamento, sem imagens de prêmios ou dependências novas.

Validação no Chromium: tamanhos desktop/celular, resultado digital, giro extra,
reserva de prêmio físico, bloqueio de giro duplo, ponteiro/resultado coerentes,
foco por teclado e transição ao comprovante.
