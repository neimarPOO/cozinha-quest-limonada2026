# Cookies: receita interativa

A receita de cookies usa oito fases e um controlador próprio. Limonada e focaccia continuam no controlador anterior. Os assets novos são gerados localmente com Three.js; não há downloads de modelos ou dependências novas.

## Jogar

Execute `npm start`, escolha **Cookies de chocolate** e siga o objeto destacado. No modo 3D, arraste o ingrediente correto até a tigela indicada: somente a entrega correta abre o modal de quantidade e procedimento. Clicar no ingrediente, soltar fora ou usar a tigela errada não avança nem abre o modal. A transferência da mistura seca para a tigela grande também exige arraste. Tigelas, ferramentas e estações sem ingredientes continuam selecionáveis por clique. No celular, a cena permite exploração horizontal; o botão **Arrastar objetos** alterna entre exploração e manipulação. A aba **Modo sem WebGL · abra somente se a visualização 3D falhar** mantém os controles alternativos recolhidos. Em caso de indisponibilidade ou perda do contexto WebGL, a aba abre automaticamente e preserva a etapa atual. Esses controles oferecem a receita por teclado/toque, sem exigir arraste.

Use o **scroll do mouse sobre a cena** para aproximar/afastar (80–250%). Os botões +/− oferecem o mesmo controle. **Visão geral** restaura o enquadramento; **Focar etapa** aproxima o destino atual. O botão direito pressionado move a câmera, e **Ampliar bancada** usa a área da janela; Escape restaura o layout. O zoom permanece ao redimensionar a tela e não interrompe o arraste.

A cena usa a mesma mão articulada e as mesmas poses das outras receitas, com materiais independentes para descarte seguro, sombras suaves no desktop, cerâmica arredondada, texturas procedurais e legendas HTML de tamanho constante durante o zoom. Em telas menores, a renderização reduz sombras e densidade de pixels para preservar o desempenho.

Ao misturar com colher ou espátula, mantenha o botão de mistura pressionado (toque, mouse, Espaço ou Enter) até completar a barra. Batedeira, descanso e resfriamento contam automaticamente após a configuração.

Cada modal exige o procedimento e, quando pertinente, quantidade, duração ou temperatura. Uma configuração incorreta não avança a receita e desconta 5 pontos. Os modais mantêm o foco e podem ser fechados com Escape sem executar a ação.

As quantidades são as reais: 450 g de farinha, 5 g de bicarbonato, 5 g de fermento, 5 g de sal, 200 g de manteiga em ponto de pomada, 200 g de açúcar mascavo, 100 g de açúcar branco, um ovo, uma colher de chá de baunilha e 350 g de gotas de chocolate.

| Fase            | Ação e tempo de jogo                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Secos           | Tigela média, quatro ingredientes, colher por 3 s; reservar                                                   |
| Creme           | Tigela grande, manteiga e dois açúcares; batedeira por 4 s, até clarear                                       |
| Emulsão         | Quebrar ovo fora da tigela, baunilha; bater por 3 s                                                           |
| Massa           | Incorporar secos gradualmente; espátula por 3 s; chocolate; mistura final por 2 s                             |
| Descanso        | Opcional: 12–24 h reais → 10–15 s de jogo; também é possível pular                                            |
| Porcionamento   | Papel-manteiga; escolher 4–20 porções iguais; coletar massa antes de cada posição; respeitar distância mínima |
| Assamento       | Pré-aquecer a 180 °C; inserir assadeira; escolher meta de 8–10 s (8–10 min reais)                             |
| Resfriar/servir | Retirar usando luvas; 5 s na bancada (5 min reais); transferir ao prato                                       |

Os tempos de cremejar (4 s), incorporar (3 s) e misturar chocolate (2 s) são adaptações para o arcade. Na cozinha, o ponto visual importa; não são tempos universais de preparo.

O cronômetro geral consome apenas tempo de ações, porcionamento e assamento; leitura e configuração pausam esse cronômetro. O forno **não pausa** com modal aberto, troca de aba ou navegador em segundo plano. Use luvas e retire entre 8 e 10 s para bordas douradas e centro macio. Retirar de 10 a 15 s resulta em cookies menos macios. Acima de 15 s, a tentativa termina com cookies queimados. Não é possível retirar antes de 8 s ou servir antes do resfriamento.

## Pontuação e registros

A conclusão concede 800 pontos de preparo, 100 por assamento ideal (50 se passou do ponto) e 100 de estética, menos penalidades. O descanso aumenta **somente a estética em 10%**: 100 → 110; portanto, o máximo é 1.010, e não 1.100. As posições válidas não permitem sobreposição. Todas as porções têm o mesmo tamanho.

O resultado mantém a integração com a roleta e com o histórico existente. `cookieDetails` registra versão, oito fases, porções, descanso, estética, qualidade de assamento e penalidades. Dados antigos não precisam de migração.

## Arquivos e validação

- `js/cookie-recipe.js`: dados e máquina de estados independentes do navegador.
- `js/cookie-scene.js`: modelos procedurais, estados visuais, seleção e arraste.
- `js/cookie-game.js`: modais, comandos acessíveis, timers e integração com histórico.
- `css/cookie-game.css`: estilos exclusivos da nova receita.
- `npm test`: testes de quantidades, sequência, escolhas inválidas, descanso, porcionamento, proteção térmica, ponto do forno e resfriamento.

Para verificar no navegador: concluir uma rodada com descanso e outra sem descanso, testar retirada precoce/sem luvas, aguardar mais de 15 s para queimar, repetir a receita, alternar para limonada/focaccia e verificar toque, teclado e larguras de 320 px a desktop. Sem WebGL, os botões mantêm a receita completa jogável.
