# Pack de parede — 40 peças, e o que aprendi com o primeiro pack

Isto é o pedido, não o resultado. O pack de chão já veio e já entrou no
jogo (`img/texturas/chao.png`, 32 peças), e ele ensinou três coisas que
mudam a forma de pedir. Elas estão no topo de propósito: são elas que
decidem se o pack entra sem retrabalho ou se metade dele se perde na
importação.

## O que o primeiro pack ensinou

**1. O gerador entrega FOLHA DE CONTATO, não arquivo por peça.** Eu pedi
40 imagens separadas e vieram 32 numa folha 8 × 4. Brigar com isso é
perder o pack. Então agora eu peço folha de contato — mas com a grade
declarada, célula quadrada e peça centrada, que foi justamente o que
salvou o recorte da primeira.

**2. Fundo preto quase matou metade das peças.** O pack de chão veio em
fundo preto, e brita, poça de barro e entulho são escuros. Medido no
recorte: tirar o fundo por limiar de luminância preservava **51 a 74 %**
da arte nas quatro células mais escuras — a peça ia embora junto com o
fundo. Só deu certo porque o `importar_decalques.py` passou a inundar a
partir da borda, e aí o escuro cercado de arte continua sendo arte
(92–97 % preservados). **Este pack é ainda pior nesse ponto**: fuligem,
mofo preto, pixação a spray preto. Fundo **magenta `#FF00FF`**, chapado,
sem exceção. Se o gerador não obedecer, o pack volta.

**3. Uma folha grande dá pouco pixel por peça.** A folha de chão tinha
~200 × 148 px de arte útil por célula. Deu, porque tufo de capim é
borrão. Pixação e tijolo aparente têm **desenho** — traço, fiada,
argamassa. Por isso o pedido agora são **5 folhas de 8**, e não uma de
40: cada célula sai com uns 512 px, e se uma folha vier ruim eu refaço
só aquele tema.

## As regras que não são gosto, são engenharia

**Luz assada briga com a luz do jogo.** A cena tem sol, sombra projetada
e `MeshLambertMaterial`. Peça que já vem com sombra e volume pintados
ganha duas luzes de direções diferentes e lê como adesivo colado. Luz
difusa, chapada, sem sombra projetada, sem brilho, sem vinheta.

**A parede não vem na imagem.** A cor da parede é do jogo: são 23 tons
de reboco na favela e mais os da cidade. Se a peça trouxer o retângulo
de parede em volta, ela pousa como um quadrado de cor errada sobre a
casa. Vem só a MARCA, recortada. A única parte de reboco que pertence à
peça é o **lábio da falha** — a beirada levantada em volta do tijolo
exposto, que é o que faz a falha parecer falha e não adesivo.

**Vista frontal ortogonal, 0°.** O decalque é uma placa vertical a 4 cm
da parede (`placa()` em `bairro3d.js`). Qualquer perspectiva na imagem
briga com a perspectiva da câmera e a placa descola.

**Nada de letra legível.** Duas razões, e as duas são práticas: gerador
de imagem escreve errado, e as siglas de verdade são nossas — os escudos
já existem em `img/escudos` e entram pelo mecanismo que já está no jogo.
Pixação de verdade é ilegível pra quem é de fora de qualquer jeito, então
pedir **traço sem palavra** é fiel, não é concessão.

**Nada de escudo de clube real, nada de símbolo de ódio, nada de
pessoa.** O contorno de escudo entra VAZIO; o emblema é nosso e entra
por cima.

## Formato

| | |
|---|---|
| entrega | 5 folhas de contato, **grade 4 × 2 (4 colunas, 2 linhas) = 8 peças por folha** |
| folha | 4096 × 2048 px — célula quadrada de 1024 px |
| fundo | **magenta puro `#FF00FF`**, chapado, sem gradiente e sem sombra caindo nele |
| célula | uma peça por célula, **centrada**, com no mínimo 40 px de magenta de folga até a borda da célula; células nunca se tocam |
| aspecto | a peça usa dentro da célula o aspecto que ela tem — pixação vertical ocupa uma fatia alta e estreita, umidade de rodapé ocupa uma faixa baixa e larga. **A célula é quadrada; a arte não precisa ser.** |
| alfa | não precisa. O magenta é o alfa. |

Aspecto livre dentro da célula quadrada porque o importador vai medir a
caixa da arte depois de recortar o magenta e tirar dali a proporção da
placa no 3D. Enfiar peça alta numa célula larga é que estragaria.

## O prompt-mestre

Cola isto, depois **uma linha** de "o que vai na folha" da seção
seguinte.

> Folha de contato de texturas para jogo 3D, **4096 × 2048 px**, grade
> de **4 colunas por 2 linhas = 8 células quadradas**, uma peça por
> célula, centrada, com folga até a borda da célula. **Fundo magenta
> puro #FF00FF, chapado, em toda a folha** — inclusive entre as peças e
> dentro de qualquer vão da peça. Sem linha de grade desenhada, sem
> moldura, sem legenda, sem número de célula.
>
> Cada peça é uma **marca de parede vista de frente, em projeção
> ortogonal (câmera perpendicular à parede, 0°)**, sem perspectiva, sem
> inclinação e sem ponto de fuga. **Nenhum pedaço de parede em volta da
> marca** — a marca termina e vira magenta; nada de retângulo de reboco,
> nada de canto de casa, nada de céu, nada de chão, nada de janela ou
> porta no enquadramento.
>
> Iluminação **difusa e uniforme**: sem sombra projetada, sem sombra
> própria acentuada, sem brilho especular, sem reflexo, sem vinheta, sem
> escurecimento de borda. A cena do jogo tem sol próprio.
>
> Paleta **gasta e sem saturação alta**, aspecto de material real e
> simples, envelhecido por sol e chuva. Nada de foto HDR, nada de
> cartoon, nada de contorno preto de desenho, nada de pintura digital
> com pincelada visível.
>
> **Sem texto, sem letra, sem palavra, sem número, sem logotipo, sem
> marca, sem assinatura, sem marca d'água.** Sem pessoa, sem rosto, sem
> objeto de escala.
>
> Referência geral: **parede de casa de periferia brasileira** — reboco
> cru ou pintado há muito tempo, tijolo cerâmico de oito furos por
> baixo, chuva, sol e falta de manutenção.

## O que vai em cada folha

O "tamanho real" é quanto a peça mede na parede de verdade; é dele que
sai o tamanho da placa no 3D. A unidade do jogo é 4,5 cm, o boneco tem
1,75 m, e a parede de uma casa vai de 2,4 a 7,2 m.

### Folha 1 — pixação e tinta de torcida

> As 8 peças: (1) pixação vertical de spray preto fosco, alfabeto de
> traço reto, anguloso e pontudo, **sem formar palavra nenhuma — trate
> como padrão gráfico e não como escrita**, 1,6 m de altura por 0,5 de
> largura; (2) pixação horizontal corrida feita com rolinho de tinta
> preta, traço grosso e escorrido, ilegível, 0,7 × 2,4 m; (3) *throw-up*
> de spray em duas cores, letra bojuda com contorno, ilegível, 1,2 ×
> 2,0 m; (4) uma pixação **riscada por cima com um X grosso de spray de
> outra cor**, tinta nova sobre tinta velha, 1,0 × 1,6 m; (5) **contorno
> vazio de escudo de futebol** feito a spray, só a silhueta de traço
> grosso, **sem nada desenhado dentro**, 1,1 × 0,9 m; (6) coroa de cinco
> pontas a spray, traço grosso e tosco, 0,6 × 0,9 m; (7) fileira de
> estrelas de cinco pontas a spray, tamanhos diferentes e desalinhadas,
> 0,5 × 1,8 m; (8) caveira de traço simples de estêncil, uma cor só,
> chapada, sem detalhe realista, 0,8 × 0,7 m.

A (4) é a peça mais importante da folha inteira. Pixação riscada por
outro grupo é o que conta a história do jogo numa parede, sem uma letra
sequer: território disputado. Se vier bem, ela entra nas paredes da
divisa entre os lados do mapa.

### Folha 2 — tinta velha, cartaz, resto de propaganda

> As 8 peças: (1) silhueta humana de capuz em estêncil, chapada, uma cor
> só, sem rosto e sem detalhe, 1,0 × 0,6 m; (2) coração tosco a spray
> com dois riscos ao lado, **sem letra**, 0,4 × 0,5 m; (3) resto de
> propaganda pintada a rolo, tinta muito desbotada, **só formas
> geométricas e faixas de cor, sem letra nenhuma**, 1,6 × 3,0 m; (4)
> retângulo de tinta nova passada de rolo por cima de uma pixação pra
> cobrir, cor diferente do reboco em volta, borda de rolinho visível e a
> tinta velha vazando por baixo, 1,2 × 2,0 m; (5) escorrido de tinta de
> pintura malfeita, gotas verticais compridas, 1,4 × 0,8 m; (6) restos
> de cartaz colado e rasgado, papel descascando em camadas, **sem texto
> legível**, 1,0 × 0,8 m; (7) um cartaz ainda colado, papel encardido e
> ondulado pela chuva, **sem texto legível**, 0,6 × 0,4 m; (8) mancha de
> cola seca com fiapo de papel de cartaz arrancado, 0,8 × 0,6 m.

### Folha 3 — reboco caído e tijolo aparente

> As 8 peças, todas mostrando **tijolo cerâmico de oito furos** por
> baixo do reboco, com a **beirada de reboco levantada em volta** (o
> lábio) e argamassa de assentamento à mostra entre os tijolos: (1)
> falha pequena e arredondada, 0,6 m; (2) falha média de contorno
> irregular, canto esfarelado, 1,1 m; (3) falha grande com uma fiada
> inteira de tijolo à mostra, 1,8 × 2,2 m; (4) reboco caído **subindo do
> rodapé**, faixa baixa e larga, umidade que subiu, 0,9 de altura × 2,4
> de largura; (5) falha no **alto da parede**, logo abaixo do beiral,
> 0,7 × 1,0 m; (6) remendo de cimento novo sem pintar, retângulo de tom
> claro diferente, com a borda irregular de quem passou a colher, 0,8 ×
> 1,0 m; (7) trinca estrutural **em escada**, descendo pela junta de
> argamassa entre os tijolos, reboco rachado acompanhando, 1,6 × 0,8 m;
> (8) teia de trincas finas só no reboco, **sem tijolo aparecendo**,
> 1,2 m.

Estas 8 substituem as 4 do `img/texturas/tijolo.png`, que hoje são um
atlas 2 × 2 de 128 px por peça. Com 8 variações e 512 px cada, a falha
de reboco deixa de repetir de casa em casa.

### Folha 4 — água, mofo e ferrugem

> As 8 peças: (1) rastro vertical de chuva escorrendo do beiral,
> arrastando sujeira, mais escuro em cima e se abrindo pra baixo, 2,2 de
> altura × 0,5 de largura; (2) escorrido a partir do peitoril de uma
> janela, **dois rastros que descem se afastando** (sem a janela na
> imagem), 1,4 × 0,8 m; (3) mancha de infiltração de dentro pra fora,
> halo de contorno mais escuro e miolo mais claro, 1,2 m; (4) umidade
> subindo do rodapé, faixa baixa mais escura embaixo, borda de cima
> irregular, 0,9 × 2,4 m; (5) salitre: crosta esbranquiçada e
> esfarelenta sobre o reboco, 0,8 × 1,2 m; (6) mofo preto-esverdeado
> concentrado num canto, 1,0 × 0,7 m; (7) limo verde de parede de
> sombra, filme fino e uniforme com borda difusa, 1,4 × 2,0 m; (8)
> rastro estreito de pingo de ar-condicionado com crosta mineral
> esbranquiçada embaixo, 1,6 × 0,3 m.

### Folha 5 — uso, impacto e gambiarra

> As 8 peças: (1) escorrido de ferrugem descendo a partir de um prego
> enferrujado, fino e comprido, 0,9 × 0,15 m; (2) respingo de barro seco
> da rua no rodapé, pontinhos subindo até meio metro, 0,6 × 1,8 m; (3)
> fuligem escura subindo em pluma, de fogo que queimou encostado na
> parede, 1,6 × 1,2 m; (4) reboco raspado e lascado na altura do ombro,
> onde as pessoas encostam ao passar, faixa horizontal gasta, 0,8 ×
> 1,6 m; (5) furos de broca com buchas velhas e o resto de argamassa de
> um suporte arrancado, 0,4 m; (6) caixa de medidor de luz de plástico
> cinza com eletroduto aparente descendo, **vista de frente, chapada,
> sem número e sem mostrador legível**, 0,6 × 0,4 m; (7) feixe de fios
> de gambiarra grampeados na parede, descendo e virando num canto, 2,0 ×
> 0,5 m; (8) cano de PVC aparente com braçadeiras, manchado de tempo,
> descendo a parede, 2,4 × 0,15 m.

## O que eu faço quando elas chegarem

1. **Recorte** (`ferramentas/importar_decalques.py`, estendido): tira o
   magenta, tira a franja rosa da borda pela mesma conta de alfa
   pré-multiplicado que o pack de chão usou, **mede a caixa da arte pra
   saber o aspecto de cada peça** e monta um atlas `parede.png` com as
   40 células. Diferente do chão, aqui eu **não dessaturo**: o decalque
   de parede entra sem `vertexColors` (o `placa()` não empurra cor), a
   cor da peça é a que aparece, e spray desbotado já nasce sem
   saturação.
2. **Falha de reboco**: troca o `tijolo.png` no mecanismo que já existe
   (`MANCHAS` em `bairro3d.js`) — sorteio pela semente da posição,
   subindo da calçada por umidade, com a variante do beiral lá em cima.
   De 4 variações pra 8.
3. **Água e mofo**: mesmo mecanismo, mas com regra de lugar própria —
   escorrido de beiral só encostado no topo da parede, umidade só no
   rodapé, limo só na face que fica na sombra.
4. **Pixação**: mecanismo novo, porque hoje a pixação do jogo é
   **letreiro de texto** desenhado em canvas (`X:` no atlas de
   letreiros) e o que vem aqui é tinta. As duas coisas convivem: o
   letreiro continua servindo pro que precisa ser lido (VENDE-SE,
   ALUGA-SE, É PROIBIDO JOGAR LIXO) e a tinta serve pro resto. Altura de
   braço: entre 0,3 e 2,6 m do chão, nunca centralizada na parede, nunca
   em cima da porta.
5. **Quadro de luz, cano, fiação**: estes não são mancha, são objeto —
   mas como placa recortada custam 2 triângulos em vez dos 30 de uma
   caixa com cano. Entram um por casa, no máximo.

## O aviso, que continua valendo

O jogo é *flat-shaded*: caixa, Lambert, seis faces por casa. Textura
fotorrealista de 2K ao lado disso não deixa o jogo mais real — deixa a
casa mais falsa, porque o olho passa a comparar as duas. Se o pack vier
fotográfico demais, o conserto é dessaturar e borrar na importação, e é
melhor já pedir contraste baixo do que consertar depois.
