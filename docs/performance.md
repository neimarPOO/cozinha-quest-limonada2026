# Carregamento e desempenho

As três receitas oferecem três perfis no seletor da bancada. O padrão novo é
**Visual: leve**: mantém os modelos, cores, materiais e iluminação, mas reduz a
nitidez interna, a resolução das sombras e a refração do vidro. **Visual:
automático** oferece resolução adaptativa e sombras intermediárias. **Visual:
máxima** restaura a nitidez e os efeitos anteriores. A opção vale para a sessão
daquele navegador e não altera regras, quantidades ou tempos da receita.

## Downloads e cache

- Three.js continua fora do carregamento inicial da página. Passar o mouse ou focar
  um card antecipa o download, sem criar uma cena nem iniciar o cronômetro.
- No build de produção, os 15 scripts anteriormente separados da cozinha, mais o
  controlador de desempenho, usam dois arquivos: o motor ES Modules oficial e um pacote da cozinha com a mesma ordem de
  dependências. O desenvolvimento local continua podendo carregar as fontes.
- Scripts, CSS e imagens selecionadas recebem nomes com hash de conteúdo. Somente
  os diretórios de arquivos com hash usam cache `immutable` de um ano. O HTML
  continua sendo revalidado: uma publicação nova aponta para novos nomes, evitando
  manter versões antigas por causa do cache.
- Fundo original e fotos dos três cards têm cópias WebP **sem perdas**, com os
  mesmos pixels RGBA e as mesmas dimensões. Os PNG originais permanecem no projeto.
  Os quatro arquivos somavam 7.593.096 bytes; as cópias somam 5.662.492 bytes,
  aproximadamente 25% menos. A aparência do fundo não foi modificada.
- Para regerar essas cópias, use `python scripts/optimize-lobby-images.py` em um
  ambiente com Pillow/WebP. O build do Netlify usa somente Node e os arquivos já
  gerados; não precisa instalar Python ou Pillow.
- As três fotografias de madeira usam URLs com hash, mas mantêm os JPEG originais,
  sem recompressão. A CDN Netlify fornece sua própria compressão HTTP.

## CPU, interação e GPU

- O teste de seleção primeiro verifica os limites dos objetos interativos. Somente
  candidatos próximos passam pelo teste do contorno real. Decoração, cursor,
  objetos invisíveis e o ingrediente arrastado não entram na busca de destino.
- Movimentos do mouse são agrupados por quadro. Soltar o botão processa a posição
  final imediatamente, inclusive em arrastes rápidos sem um quadro intermediário.
- Uma textura procedural de madeira que era desenhada e descartada sem ser usada
  foi removida; a sequência aleatória da decoração restante foi preservada.
- Imagens decodificadas e geometrias compartilhadas continuam em cache limitado.
  As malhas estáticas equivalentes continuam agrupadas por material. A cena imóvel
  reutiliza o último quadro; legendas recalculam posições apenas quando necessário.
- Um contexto WebGL e a captura de iluminação podem ser reutilizados ao trocar de
  receita. O cache contém no máximo um renderizador ocioso e expira em 60 segundos.
  Materiais, sombras, texturas e eventos da cena anterior são liberados. Contextos
  perdidos são descartados e o modo sem WebGL continua disponível.
- A resolução automática começa em até 1,25 vezes a
  densidade de pixels. Reduz o esforço quando medições sucessivas indicam carga
  alta e recupera a nitidez com margem para evitar oscilações. Não remove assets nem modifica a geometria. A resolução das sombras e a
  refração seguem o perfil escolhido. “Máxima nitidez” desativa a adaptação.
- A preparação ainda aguarda texturas, compilação e primeiro quadro. O relógio só
  começa depois. Fences WebGL2 evitam enfileirar vários quadros numa GPU ocupada.

## Resultados e limites da verificação

Medições locais no Chromium com renderização por software, não numa GPU física:

| Verificação | Resultado |
| --- | --- |
| Motor e pacote da cozinha | 15 requisições → 2 (motor ESM e lógica do jogo) |
| Segunda visita | 0 bytes transferidos para o pacote, reutilizado do cache |
| Fotos e fundo | aproximadamente 25% menos bytes, pixels idênticos |
| Seleção de objetos, 90 consultas na mesma bancada | 183 ms → 27 ms, cerca de 6 vezes mais rápida |
| Cena inicial de cookies, mesmo enquadramento | 486 chamadas e 420.376 triângulos antes e depois |
| Receita seguinte | contexto WebGL reutilizado nas trocas cookies → limonada → brownie |

Com 150 ms de latência e 200 KiB/s, o download inicial da cozinha levou cerca de
4,3 segundos nas duas versões. A transferência de bytes dominou esse teste; não
houve ganho relevante no tempo dessa primeira transferência. Cache, imagens menores
e seleção mais barata oferecem ganhos distintos. A compilação inicial dos shaders
continua dependendo da GPU: estas medições não estabelecem uma meta universal de FPS.

`npm test`: 72 testes de receitas, armazenamento, cache, seleção, adaptação de
resolução, liberação de recursos e integridade do build. `npm run test:server`:
compressão HTTP, revalidação, HEAD, erros e cache. O build mantém dados privados e
código de servidor fora de `dist`.

Chromium: três receitas WebGL, imagens otimizadas, escolha de máxima nitidez,
reutilização do contexto, cache na segunda visita e arraste real de farinha até a
tigela, modal de 450 g e avanço da receita. O teste de interação pausou o desenho
contínuo após a preparação para não saturar o SwiftShader do ambiente de testes.
A compilação e o desenho inicial foram verificados com WebGL ativo.

Conexão e hardware têm limites físicos. O cache não elimina o primeiro download,
uma GPU muito limitada pode exigir redução de nitidez, e a sincronização do evento
continua exigindo conexão. Nenhuma alteração foi feita nos dados de produção.

## Caderno de receitas

A página usa uma textura de canvas apenas para a faixa visível. Texto e legendas
mantêm suas fontes e medidas; o documento completo continua no DOM para
acessibilidade e fallback. Não é criado outro contexto WebGL para o caderno.


## Revisão de latência do cursor

O aviso de descontinuação do Three.js vinha da distribuição clássica UMD e não
identificava um erro de desempenho. O navegador agora importa a distribuição
oficial ES Modules da **mesma versão r158**, servida localmente e com hash. Não
houve atualização de versão do motor, remoção de avisos por filtro nem alteração
nos materiais. A versão UMD permanece apenas para os testes Node existentes.

Mover a mão invalidava o mapa inteiro de sombras. Agora uma região conservadora
verifica se algum raio de sombra da mão pode atingir um receptor da cena. Quando
isso é impossível, o mapa anterior é reaproveitado. Se houver sobreposição ou
uma luz não direcional, o recálculo completo continua. Transições também removem
sombras anteriores quando necessário. Arrastes e animações de utensílios mantêm
as atualizações de sombra existentes.

O limite espacial usado contém todos os vértices visíveis da mão e da luva em
suas sete poses; há teste para esse limite. Em três posições de cursor, no
Chromium/SwiftShader, comparar quadros estabilizados com sombras reaproveitadas e
recalculadas produziu **zero canais RGBA diferentes**. A contagem completa,
incluindo o passe de sombra, passou de **723 para 502 chamadas por quadro (cerca de 31% menos)** nesse
cenário. A contagem exige `renderer.info.autoReset=false`, porque o Three r158
normalmente zera os contadores depois do passe de sombra.

A mão pode solicitar quadros a 60 Hz, mantendo a atualização pendente enquanto a
GPU estiver ocupada. As animações restantes continuam limitadas a 30 Hz. Isso não
promete 60 FPS: evita um limite artificial no cursor em GPUs que conseguem atender.
A projeção dos modais também atualiza somente a matriz do objeto consultado,
evita propagar novamente todas as matrizes da cozinha a cada consulta.


A revisão também foi conferida com renderização ativa: arraste da farinha para a
tigela de secos, abertura do modal, entrada de 450 g e avanço ao próximo
procedimento. As três receitas abriram com a mesma contagem de triângulos e sem
avisos de descontinuação no console do navegador. Uma falha de download do módulo
pode ser tentada novamente, sem recarregar a página nem depender de uma CDN durante
a partida; a identidade de módulo da nova tentativa evita reutilizar a falha
registrada pelo navegador, preservando o cache HTTP do arquivo.


## Perfil leve e correção do brownie

O perfil leve começa imediatamente em razão de pixels 0,9 e sombras de 1024².
Desabilita a refração física (`transmission`) mantendo vidro transparente e seus
reflexos. Isso elimina um passe adicional que redesenhava o cenário para refratar
o fundo. Não há simplificação de geometria nem remoção de objetos interativos.
O perfil automático limita a razão inicial a 1,25, usa sombras de 1536² e a mesma
simplificação do vidro. Máxima restaura a refração original, a razão anterior (até
1,75) e os mapas de sombra originais, sem reiniciar a partida.

A preferência desses perfis usa `lq_graphics_mode_v2`, para que uma preferência
antiga de máxima qualidade não impeça a adoção do novo padrão leve. A seleção
feita no novo controle permanece durante a sessão.

Medição em Chromium/SwiftShader a 1024 × 700, sem mudar a câmera ou a receita.
Cada configuração aqueceu seus shaders antes de duas amostras. Uma leitura de
pixel após cada desenho aguardou a conclusão da GPU. São tempos deste renderizador
por software, não estimativas de FPS em computadores físicos.

| Receita | Chamadas máxima → leve | Tempo médio máxima → leve | Redução do custo |
| --- | ---: | ---: | ---: |
| Brownie | 432 → 238 | 4000,5 → 1668 ms | 58% |
| Cookies | 486 → 272 | 4550 → 1965,5 ms | 57% |
| Limonada | 144 → 90 | 3135,5 → 1250 ms | 60% |

A quantidade de triângulos **desenhados** também cai porque o passe de refração
é eliminado; os modelos mantêm a mesma geometria. A imagem pode ficar menos
nítida, as sombras menos detalhadas e o vidro mais simples. Caderno, legendas e
modais mantêm suas fontes e dimensões; o texto desenhado no canvas também está
sujeito à resolução do perfil.

O desaparecimento da mão no brownie tinha uma causa concreta: `BrownieScene.pan`
identifica a panela, mas o controle de movimento da câmera também usava `pan`.
O movimento do mouse tentava ler `pan.target.x` na panela, interrompendo a
atualização antes de posicionar a mão. O controle da câmera agora usa
`cameraPan`, preservando o objeto panela em cliques, arrastes e cancelamentos.
Há teste de regressão para a coexistência dos dois estados.

O rastreamento do cursor foi delegado à área da cena para acompanhar também
legendas sobrepostas, e a mão é restaurada após o término da animação de um
utensílio quando o cursor ainda está na bancada. Durante o trabalho, colher,
espátula e faca continuam substituindo a mão na animação conforme a mecânica.

Validação final em Chromium com renderização ativa no brownie: mão visível sobre
a bancada; arraste da câmera com botão direito sem substituir a panela;
pré-aquecimento a 180 °C; entrega da manteiga na fôrma e avanço ao papel-manteiga;
rolagem do caderno com a mão visível; troca Máxima → Leve restaurando os parâmetros
corretos. Sem erros de JavaScript nesses cenários. O ganho medido em renderização
por software não garante a mesma taxa de quadros em toda GPU ou computador.
