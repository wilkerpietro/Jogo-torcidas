# Prompts das três cenas de estádio — 5 mil, 20 mil e 40 mil

Três imagens, no mesmo acabamento das outras cenas: **zênite, dia nublado, cor
dessaturada, estádio brasileiro, vazio**. O estádio inteiro no quadro, com
**todas as arquibancadas à vista**, porque a briga acontece nelas — e o que não
aparece na foto não existe pro jogo.

| Cena | Capacidade | Cobre | Saída pro jogo | Estado |
|---|---|---|---|---|
| Estádio pequeno | ~5 mil | `capacidade` até 12.000 | `estadio_pequeno.webp` | a fazer |
| Estádio médio | ~20 mil | 12.000 a 30.000 | `estadio_medio.webp` | a fazer |
| Estádio grande — dois anéis | ~40 mil | acima de 30.000 | `estadio_grande.webp` | a fazer |

A faixa não é chutada: `dados/estadios.js` tem 76 praças com capacidade real,
do Dutrinha (5.000) ao Castelão (63.903). Com esses três cortes, **toda a lista
tem cena** — o Batistão e o Cornélio de Barros (8.000) caem no pequeno, o
Bezerrão e o Canindé (17–20 mil) no médio, o Couto Pereira e o Arruda no
grande. Um estádio de 60 mil abre a cena grande: passar de 40 pra 60 mil muda o
número na ficha, não muda a briga.

## A escala muda aqui, e é a única cena onde muda

As outras seis cenas voam na mesma altura: o quadro cobre uns 80 metros. **Um
estádio não cabe em 80 metros** — só o gramado tem 105 × 68 m, e o de 40 mil
com arquibancada em volta passa de 200 m de ponta a ponta. Então o drone sobe,
e isso tem preço: o disco continua com 7 px de raio, mas cada pixel passa a
valer mais metro.

| Cena | O quadro cobre | Escala | O disco vira uma pessoa de |
|---|---|---|---|
| pequeno | ~130 m de largura | 11,8 px/m | ~1,2 m |
| médio | ~170 m | 9,0 px/m | ~1,6 m |
| grande | ~240 m | 6,4 px/m | ~2,2 m |

Um disco de 2,2 m é um sujeito gordo visto de cima, e é o preço de ver o
estádio inteiro. Vale porque a briga de estádio é de bonde grande: com 200
discos em campo, disco pequeno demais vira poeira. **Se um dia incomodar**, o
conserto não é refazer a imagem — é o `celula` e o raio do disco na cena,
não a foto.

## O que vale pras três

Tudo que vale pras outras seis continua valendo (ver `PROMPT-TRETAS.md`:
zênite, 16:9, sem gente, chão contínuo). O que é próprio do estádio:

- **arquibancada descoberta, sempre.** Cobertura vista a prumo é telhado, e
  telhado é parede: a laje esconde justamente a arquibancada onde a briga
  acontece. Estádio brasileiro descoberto é a regra, não a exceção — e onde o
  projeto teria cobertura, ela é removida como a laje do bar;
- **anel de cima recuado, nunca em balanço.** Dois anéis podem — é o formato
  da cena grande —, desde que o superior comece **por fora** do inferior, com um
  vão de circulação aberto entre os dois. O que não pode é o de cima debruçar
  sobre o de baixo: em balanço ele vira telhado e come a arquibancada inferior
  inteira. Recuado, os dois aparecem a prumo e viram dois andares de chão de
  briga ligados por escada;
- **o fosso e o alambrado são a parede que dá forma à briga.** Eles separam
  gramado de arquibancada, e as passagens entre os dois — os vãos do fosso e as
  bocas de vomitório — são os gargalos por onde os bondes se encontram;
- **as escadas e os degraus são chão de andar.** O jogo não tem altura: degrau
  de arquibancada é piso plano com listra, e o disco anda por cima igual;
- **grade de separação de setor com portão.** É ela que faz a arquibancada
  valer como cena, e não como esplanada: sem divisão, os dois bondes se acham
  em linha reta;
- **estádio vazio**, sem torcida, sem jogador, sem carro andando. Quem enche a
  arquibancada são os discos.

## Bloco de zênite

O mesmo das outras seis, já colado nos três prompts abaixo:

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points,

every object seen only as its top surface: roofs only, no façades, no building
elevations, no side walls, nothing leaning outward at the edges of the frame,
```

**O tell de zênite no estádio é a arquibancada do outro lado.** A prumo, os
quatro lados do anel são iguais: faixas concêntricas de degrau, cada uma
encarando o gramado. Se a arquibancada do fundo aparecer "de frente", com os
degraus subindo na vertical da imagem, a câmera está torta — e o que está
escondido é justamente o degrau de baixo, junto do fosso, onde os dois bondes
se encostam.

---

## ESTÁDIO PEQUENO — ~5 mil

Campo de interior com uma arquibancada de concreto só. O resto é talude de
terra, alambrado e muro. A briga aqui é apertada: a arquibancada é uma faixa
comprida de um lado, e quem é empurrado dela cai no fosso ou no campo.

Geometria: **gramado no meio do quadro**, alambrado em volta, **uma
arquibancada de concreto descoberta no lado de cima** com escada no meio e nas
pontas, taludes baixos de terra batida nos outros três lados, muro externo
fechando tudo, **um portão aberto na esquerda e outro na direita** chegando na
borda do quadro, e um túnel de vestiário entrando na quina.

Spawns sugeridos: `mandante1` (300, 300) e `mandante2` (480, 260), na
arquibancada; `visitante1` (1150, 640) e `visitante2` (980, 700), no gramado.

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points, every object seen only as its top surface, no façades, no stand seen
from the front, nothing leaning outward at the edges of the frame,

aerial drone photograph of a small empty Brazilian lower-division football
ground on the edge of a town, seating for about five thousand, overcast diffuse
daylight, soft shadows, desaturated muted colors, documentary photography,
completely empty of people,

in the middle of the frame, a worn grass pitch with faded white markings, bald
patches of bare earth in the goal mouths and along the centre, two white goal
frames lying flat in the image as thin outlines with their shadows beside them,
a narrow strip of bare earth running all around the pitch,

a chain-link perimeter fence surrounds the pitch, seen from above as a thin
line, with a shallow open moat behind it,

along the upper side, one single uncovered concrete grandstand, completely open
to the sky with no roof, no canopy and no press box over it, seen from directly
above as a band of parallel concrete steps, evenly lit from the first row to
the last, three flights of stairs cutting across the steps, a low wall at the
top,

along the other three sides, low earth banks and a few rows of simple concrete
steps, also completely uncovered,

a plastered boundary wall encloses the whole ground, with a wide open gate on
the left side and another wide open gate on the right side, each meeting a
strip of dirt street that reaches the left and right edge of the frame, and a
short players' tunnel entering at one corner,

outside the wall, only a thin strip: a dirt car park with two parked cars seen
as roofs only, low houses showing only their terracotta clay tile roofs, sparse
scrub bushes,

photorealistic, natural materials, sun-bleached concrete, worn grass, tropical
Brazil, 8k satellite imagery quality, sharp detail, no people visible, no
spectators, no players
```

### Negativo

```
oblique aerial, bird's eye view, three quarter view, tilted camera, angled
drone shot, perspective view, stand seen from the front, seating rows rising
vertically in the image, visible façade, visible building side, roof offset
from its base, leaning stands, vanishing point, wide angle, fisheye, lens
distortion, parallax,

roof over the stand, covered grandstand, canopy, awning, press box, upper tier,
second ring, cantilever, floodlight roof, big shadow over the seats,
modern arena, all-seater stadium, plastic seats in colours, european stadium,
running track, closed gates, unbroken wall,

illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines, vignette,
crowd, people, spectators, players, football match, flags, banners, moving cars,
saturated colors, hdr, dramatic lighting, night, floodlit, rain
```

### Sementes pro importador

```python
{'id': 'estadio-pequeno', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'estadio_pequeno.webp',
 # o gramado, a arquibancada de cima, os taludes e os dois portões
 'sementes': [(0.50, 0.55), (0.30, 0.55), (0.70, 0.55),
              (0.50, 0.20), (0.30, 0.22), (0.70, 0.22),
              (0.50, 0.85), (0.02, 0.55), (0.98, 0.55)],
 'recorte': [(0.02, 0.06, 0.98, 0.96)]},
```

### Ordem curta de correção

```
Shoot this from exactly overhead, at zenith: all four sides of the ground look
the same, each row of steps facing the pitch, and no stand is seen from the
front. Remove any roof, canopy or press box over the grandstand, leaving the
concrete steps open to the sky and evenly lit from the first row to the last.
Keep the pitch empty, open both side gates to the edges of the image, and keep
the ground completely empty of people.
```

### Conferir

1. **A arquibancada é uma faixa de degraus vista de cima**, não uma parede de
   assentos. Degrau subindo na vertical da imagem é câmera torta.
2. **Sem cobertura nenhuma**, nem sobre a cabine de imprensa.
3. Os dois portões chegam abertos até as bordas laterais.
4. Depois de importar: gramado e degraus viram chão de andar (é o certo), e
   alambrado, fosso, muro e traves viram parede no pincel.

---

## ESTÁDIO MÉDIO — ~20 mil

Estádio municipal de anel completo: arquibancada dos quatro lados, descoberta,
com fosso e alambrado separando do campo. É a cena mais equilibrada das três —
tem o anel pra correr em volta, o campo pra atravessar e os vomitórios pra
gargalar.

Geometria: **anel contínuo de arquibancada em torno do gramado**, **quatro
vomitórios por lado** (as bocas escuras que cortam os degraus), fosso e
alambrado entre a arquibancada e o campo, **duas passarelas atravessando o
fosso** (uma em cada gol) que são as únicas ligações entre anel e gramado, e
grades de separação de setor cortando o anel em quatro, cada uma com portão.

As duas passarelas são o coração da cena: quem domina a passarela domina o
campo. Se a imagem vier sem elas, arquibancada e gramado viram duas ilhas e a
briga acontece em dois lugares separados que nunca se encontram.

Spawns sugeridos: `mandante1` (768, 180) e `mandante2` (560, 210), no anel
norte; `visitante1` (768, 850) e `visitante2` (980, 820), no anel sul.

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points, every object seen only as its top surface, no façades, no stand seen
from the front, all four sides of the bowl looking alike, nothing leaning
outward at the edges of the frame,

aerial drone photograph of an empty medium-sized Brazilian municipal football
stadium, capacity around twenty thousand, overcast diffuse daylight, soft
shadows, desaturated muted colors, documentary photography, completely empty of
people,

in the middle of the frame, a full-size grass pitch with painted white
markings, worn patches, two white goal frames lying flat in the image with
their shadows beside them,

a continuous uncovered concrete terrace surrounds the pitch on all four sides,
one single tier only, no upper deck and no roof anywhere over it, seen from
directly above as concentric bands of parallel steps, evenly lit from the front
row to the back row on every side, the steps of the far side reading exactly
like the steps of the near side,

between the terrace and the pitch, a dry moat and a chain-link fence running
all the way around, and two narrow footbridges crossing the moat, one behind
each goal, which are the only connections between the terrace and the pitch,

four dark tunnel mouths cut through the steps on each side of the bowl, opening
into the terrace from below, and low fences divide the terrace into four
sectors with a gate in each one,

a concrete outer wall closes the stadium, with two wide open gates on opposite
sides, each meeting a strip of asphalt street that reaches the left and right
edge of the frame, external stair ramps at the corners,

four floodlight pylons stand at the corners, seen from directly above as small
square lattice tops with long shadows,

outside the wall, only a thin strip along the top and bottom edges: an asphalt
car park with a few parked cars seen as roofs only, low buildings showing only
their flat roofs,

photorealistic, natural materials, sun-bleached concrete, worn grass, tropical
Brazil, 8k satellite imagery quality, sharp detail, no people visible, no
spectators, no players
```

### Negativo

```
oblique aerial, bird's eye view, three quarter view, tilted camera, angled
drone shot, perspective view, stand seen from the front, seating rows rising
vertically in the image, far side of the bowl seen from inside, visible façade,
roof offset from its base, leaning stands, vanishing point, wide angle,
fisheye, lens distortion, parallax,

roof, covered stand, canopy, awning, cantilever roof, upper tier, second ring,
two tiers, ring above ring, press box over the seats, big shadow over the
seats,
modern arena, all-seater stadium, coloured plastic seats, european stadium,
olympic running track, closed moat with no crossing, no tunnels, unbroken
terrace, closed gates,

illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, sponsor boards, advertising,
watermark, grid lines, vignette,
crowd, people, spectators, players, football match, flags, banners, moving cars,
saturated colors, hdr, dramatic lighting, night, floodlit, rain
```

### Sementes pro importador

```python
{'id': 'estadio-medio', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'estadio_medio.webp',
 # o gramado, os quatro lados do anel e os dois portões externos
 'sementes': [(0.50, 0.50), (0.35, 0.50), (0.65, 0.50),
              (0.50, 0.16), (0.50, 0.84), (0.16, 0.50), (0.84, 0.50),
              (0.02, 0.50), (0.98, 0.50)],
 'recorte': [(0.02, 0.04, 0.98, 0.98)]},
```

### Ordem curta de correção

```
Shoot this from exactly overhead, at zenith: the four sides of the bowl look
identical, every row of steps facing the pitch, and no stand is seen from the
front. Remove every roof and canopy over the terrace and remove any upper tier,
leaving one single ring of concrete steps open to the sky, evenly lit from the
first row to the last on all four sides. Keep the moat and the fence around the
pitch, and keep the two footbridges crossing the moat behind the goals. The
stadium stays completely empty.
```

### Conferir

1. **Os quatro lados do anel são iguais.** Se um deles parece "de frente", a
   câmera deitou e o degrau de baixo daquele lado sumiu.
2. **Um anel só, sem cobertura.** Segundo anel é telhado com outro nome.
3. **As duas passarelas sobre o fosso existem.** Sem elas, anel e gramado viram
   ilhas separadas e metade da cena fica inalcançável.
4. Os vomitórios aparecem como bocas escuras cortando os degraus — depois de
   importar, confira se o corte os leu como chão; eles são passagem.
5. Fosso, alambrado, grade de setor e muro externo viram parede no pincel;
   gramado e degraus ficam como chão.

---

## ESTÁDIO GRANDE — ~40 mil, dois anéis

O caldeirão, e o único dos três com **dois anéis de arquibancada**. O formato é
o do estádio grande brasileiro moderno: anel inferior colado no gramado, anel
superior **por fora dele**, e entre os dois um vão de circulação aberto ao céu.

**Dois anéis podem, em balanço não.** A regra continua sendo a do viaduto: o
que passa por cima do chão esconde o chão. O que salva este formato é o
**recuo** — o anel superior não debruça sobre o inferior, ele começa depois
dele, separado pelo vão de circulação. A prumo, os dois aparecem inteiros, cada
degrau à vista, e o estádio vira **quatro andares de chão de briga**: anel
superior, circulação, anel inferior, gramado. Se o de cima avançar por cima do
de baixo, a metade inferior some da foto e não tem pincel que traga de volta.

Geometria, de dentro pra fora:

1. **gramado** no centro, com fosso largo e alambrado alto em volta;
2. **duas passarelas atravessando o fosso**, atrás de cada gol — as únicas
   ligações entre arquibancada e campo;
3. **anel inferior contínuo**, descoberto, cortado por escadas radiais e com
   seis bocas de vomitório por lado;
4. **vão de circulação em anel**, aberto ao céu, entre os dois anéis: uma
   esplanada de concreto dando a volta no estádio inteiro. É o corredor mais
   importante da cena — quem domina ele corre o estádio todo;
5. **anel superior recuado**, também descoberto, em quatro blocos (norte, sul,
   leste, oeste) com **vão aberto nas quatro quinas**, ligado à circulação por
   escadas largas e pelas rampas externas das quinas;
6. **muro externo** fechando tudo, com portão na esquerda e na direita
   chegando na borda do quadro.

Os vãos das quinas do anel superior não são enfeite: são a fuga de quem é
espremido lá em cima. Anel superior fechado em círculo perfeito vira ratoeira.

Spawns sugeridos: `mandante1` (768, 120) e `mandante2` (520, 150), no anel
superior norte; `visitante1` (768, 900) e `visitante2` (1020, 860), no anel
inferior sul.

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points, every object seen only as its top surface, no façades, no stand seen
from the front, all four sides of the bowl looking alike, nothing leaning
outward at the edges of the frame,

aerial drone photograph of a large empty Brazilian football stadium with two
concentric rings of open terracing, capacity around forty thousand, overcast
diffuse daylight, soft shadows, desaturated muted colors, documentary
photography, completely empty of people,

in the middle of the frame, a full-size grass pitch with painted white
markings, mown stripes, two white goal frames lying flat in the image with
their shadows beside them,

around the pitch, a wide dry moat and a tall chain-link fence, and two
footbridges crossing the moat, one behind each goal, which are the only
connections between the terracing and the pitch,

the LOWER RING: a continuous band of uncovered concrete steps encircling the
pitch, seen from directly above as concentric bands of parallel steps, evenly
lit across its whole depth on all four sides, radial stairways cutting through
it at regular intervals, six dark tunnel mouths opening through the steps on
each side,

between the two rings, an OPEN CONCOURSE: a wide ring-shaped concrete esplanade
that runs all the way around the stadium, completely open to the sky, plainly
visible from above along its whole length, with wide flights of stairs rising
from it to the upper ring,

the UPPER RING: a second band of uncovered concrete steps set FURTHER OUT than
the lower ring, standing beyond the concourse and never over it, so that both
rings and the concourse between them are fully visible from directly above; the
upper ring is broken into four separate blocks — north, south, east and west —
with an open gap at each of the four corners, and radial stairways cutting
through each block,

there is no roof anywhere: no canopy, no cantilever, no membrane, no covered
section over either ring, no upper deck overhanging the lower one, both rings
lie open to the sky and both are evenly lit from their first row to their last,

a concrete outer wall closes the stadium, with wide open gates on the left and
right sides meeting strips of asphalt street that reach the left and right edge
of the frame, and long external access ramps spiralling at the four corners up
to the upper ring,

four floodlight pylons at the corners, seen from directly above as small square
lattice tops with long shadows,

outside the wall, only a thin strip along the top and bottom edges: asphalt car
park, a few parked cars and buses seen as roofs only,

photorealistic, natural materials, sun-bleached concrete, stained old concrete,
worn grass, tropical Brazil, 8k satellite imagery quality, sharp detail, no
people visible, no spectators, no players
```

### Negativo

```
oblique aerial, bird's eye view, three quarter view, tilted camera, angled
drone shot, perspective view, stand seen from the front, seating rows rising
vertically in the image, far side of the bowl seen from inside, visible façade,
roof offset from its base, leaning stands, vanishing point, wide angle,
fisheye, lens distortion, parallax,

roof, stadium roof, covered stand, canopy, awning, cantilever, cantilevered
upper deck, upper tier overhanging the lower tier, upper ring above the lower
ring, ring on top of ring, deck over the concourse, sky boxes, executive boxes
over the seats, press box over the seats, membrane roof, retractable roof,
concourse hidden under the stand, shaded lower tier, dark lower ring,

single tier only, one ring only, upper ring closed all the way round without
corner gaps, closed moat with no crossing, no tunnels, no stairways,
modern arena, all-seater stadium, coloured plastic seats, world cup arena,
european stadium, olympic running track,

illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, seating chart, seating map, section numbers, coloured
sectors, map icons, labels, text, sponsor boards, advertising, club badges,
watermark, grid lines, vignette,
crowd, people, spectators, players, football match, flags, banners, moving cars,
saturated colors, hdr, dramatic lighting, night, floodlit, rain
```

### Sementes pro importador

```python
{'id': 'estadio-grande', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'estadio_grande.webp',
 # gramado, anel inferior, circulação, anel superior e os portões
 'sementes': [(0.50, 0.50), (0.40, 0.50), (0.60, 0.50),
              (0.50, 0.22), (0.50, 0.78), (0.22, 0.50), (0.78, 0.50),
              (0.50, 0.14), (0.50, 0.86), (0.14, 0.50), (0.86, 0.50),
              (0.50, 0.06), (0.50, 0.94),
              (0.02, 0.50), (0.98, 0.50)],
 'recorte': [(0.01, 0.02, 0.99, 0.99)]},
```

As sementes vêm em três raios de propósito: as de 0,22/0,78 caem no anel
inferior, as de 0,14/0,86 no vão de circulação e as de 0,06/0,94 no anel
superior. Se o corte fechar um desses raios, a máscara perde um andar inteiro
do estádio — e é justamente assim que se descobre que a foto tem balanço.

### Ordem curta de correção

```
Shoot this from exactly overhead, at zenith: the four sides of the bowl look
identical, every row of steps facing the pitch, and no stand is seen from the
front. Keep TWO rings of terracing, but set the upper ring further out than the
lower one, with a wide open concourse between them that is fully visible from
above along its whole length. The upper ring must never overhang the lower ring
or the concourse. Remove every roof, canopy and cantilever, so both rings lie
open to the sky and both are evenly lit from their first row to their last.
Leave an open gap at each of the four corners of the upper ring, keep the moat
and fence around the pitch, and keep the two footbridges behind the goals. No
people, no banners, no advertising.
```

### Conferir

1. **Os três andares aparecem inteiros**: anel inferior, vão de circulação e
   anel superior, cada um com a mesma luz. Se a circulação sumir numa faixa
   escura, o anel de cima está em balanço e o de baixo foi comido — refaça.
2. **Sem cobertura em nenhum dos dois anéis.**
3. **Os quatro lados iguais**, cada degrau encarando o gramado.
4. **As duas passarelas sobre o fosso existem**, senão gramado e arquibancada
   viram ilhas separadas.
5. **As quatro quinas do anel superior estão abertas** — é a fuga de quem
   apanha lá em cima.
6. Depois de importar: gramado, degraus e circulação viram chão de andar;
   fosso, alambrado, grade de setor, muro e traves viram parede no pincel.

---

## Depois que as três existirem

1. Três entradas novas em `FONTES`, no `ferramentas/importar_cena_foto.py`,
   com as sementes acima.
2. Três cenas em `dados/cenas.js`, com `spawns`, `saida` e `gatilho`. A saída
   aqui é o vomitório, não a boca de rua: quem sai do estádio sai por um túnel.
3. **A escolha da cena sai da capacidade**, não do nome: leia `capacidade` em
   `dados/estadios.js` — até 12.000 abre a pequena, até 30.000 a média, acima
   disso a grande. Assim as 76 praças ganham cena sem uma imagem por estádio.
4. A cena dos arredores (`arredores.webp`) continua sendo o lado de fora: uma é
   a chegada, a outra é o que acontece dentro. Não se substituem.
5. Ande com o líder (WASD) pelo anel inteiro e atravesse as duas passarelas. Se
   uma delas estiver fechada na máscara, metade da cena fica inalcançável e a
   briga acontece em dois lugares que nunca se encontram.
