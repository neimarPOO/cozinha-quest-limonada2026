# Carregamento e desempenho

As três receitas preservam modelos, contornos, texturas, materiais, iluminação e
sombras. O modo automático pode reduzir temporariamente a resolução interna sob
carga: isso favorece a fluidez, mas pode diminuir a nitidez. “Visual: máxima
nitidez”, na barra da bancada, mantém a resolução original configurada. A escolha
vale para a sessão daquele navegador; não altera as regras do evento.

## Downloads e cache

- Three.js continua fora do carregamento inicial da página. Passar o mouse ou focar
  um card antecipa o download, sem criar uma cena nem iniciar o cronômetro.
- No build de produção, os 15 scripts anteriormente separados da cozinha, mais o
  controlador de desempenho, são reunidos em um único pacote com a mesma ordem de
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
- A resolução automática começa na mesma configuração anterior, até 1,75 vezes a
  densidade de pixels. Reduz o esforço quando medições sucessivas indicam carga
  alta e recupera a nitidez com margem para evitar oscilações. Nunca remove assets,
  troca materiais ou reduz os mapas de sombra. “Máxima nitidez” desativa a adaptação.
- A preparação ainda aguarda texturas, compilação e primeiro quadro. O relógio só
  começa depois. Fences WebGL2 evitam enfileirar vários quadros numa GPU ocupada.

## Resultados e limites da verificação

Medições locais no Chromium com renderização por software, não numa GPU física:

| Verificação | Resultado |
| --- | --- |
| Pacote da cozinha | 15 requisições de script → 1 |
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

`npm test`: 64 testes de receitas, armazenamento, cache, seleção, adaptação de
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
