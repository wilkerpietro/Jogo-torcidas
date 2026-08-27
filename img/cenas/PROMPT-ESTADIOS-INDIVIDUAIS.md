# Estádios com imagem própria

As três cenas de porte (`PROMPT-ESTADIOS.md`) cobrem as 76 praças do
`dados/estadios.js` pela capacidade. Este arquivo é a exceção: **estádio que o
jogador vê muito ganha a própria imagem**, com a forma real da arquibancada.

A regra de escolha, quando isto entrar em `dados/cenas.js`: **se existe imagem
própria pra aquele `id` de estádio, usa; senão, cai na faixa de capacidade.**
Nada mais muda — é a mesma cena de briga, com outro chão.

| Estádio | Capacidade | Forma | Saída pro jogo | Estado |
|---|---|---|---|---|
| Maracanã | 78.000 | elipse de dois anéis contínuos | `estadio_maracana.webp` | a fazer |

## A elipse não cabe na tela, e isso tem que ser decidido

A tela da cena é **3:2** — 1536 × 1024. O importador encaixa a largura inteira
e o que passar de 1024 de altura fica de fora. O Maracanã é quase redondo: uns
**300 m de eixo maior por 260 m de eixo menor**. Pra caber os 260 m de altura
numa tela 3:2, o quadro precisa de **390 m de largura** — e aí a escala
despenca:

| Enquadramento | O quadro cobre | Escala | O disco vira | Serve pra |
|---|---|---|---|---|
| **anel inteiro** | ~390 × 260 m | 3,9 px/m | ~3,6 m | ver o estádio todo |
| **meio estádio** | ~200 × 133 m | 7,7 px/m | ~1,8 m | brigar de verdade |

**As duas existem, e a escolha é de jogo, não de arte.** No anel inteiro o
disco fica gordo — 3,6 m é quase um carro visto de cima — mas você vê a elipse
inteira e a briga percorre o estádio. No meio estádio (um gol e as duas
laterais até o meio de campo) o disco volta ao tamanho da cena de 40 mil, e é
assim que a briga acontece de verdade: setor contra setor, não estádio contra
estádio.

O prompt abaixo é o do **anel inteiro**, que foi o pedido. A variante de meio
estádio está no fim, e é uma troca de duas linhas.

## O que a forma manda, e o que a regra manda por cima

Lendo o mapa de setores: **elipse perfeita**, anel inferior colado no gramado,
anel superior por fora, os dois **contínuos, sem vão de quina** — diferente da
cena genérica de 40 mil, onde os quatro cantos abrem. Os setores são fatias
radiais, separadas por escada, e por fora da elipse há quatro blocos de acesso,
um por quadrante: são as **rampas**, e são a marca do Maracanã visto de cima.

Duas coisas o desenho não diz e a regra decide:

- **sem cobertura.** O Maracanã real tem anel de cobertura, e ele apaga a
  arquibancada inteira no zênite. Aqui ela sai, como saiu o viaduto e a laje do
  bar. É a mesma regra: nada por cima do chão de andar;
- **anel superior recuado, com circulação aberta entre os dois.** Se o de cima
  debruçar sobre o de baixo, some a metade inferior do estádio.

E como a elipse é contínua, **a fuga não é a quina** — é a rampa. As quatro
entram na cena como caminho de verdade, ligando a circulação ao lado de fora.
Sem elas, o anel superior vira ratoeira.

## Prompt — anel inteiro

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points,

every object seen only as its top surface: roofs only, vehicle roofs only, no
façades, no building elevations, no side walls, no stand seen from the front,
all sides of the bowl looking alike, nothing leaning outward at the edges of
the frame,

aerial drone photograph of a huge empty oval Brazilian football stadium of the
old concrete kind, capacity around eighty thousand, overcast diffuse daylight,
soft shadows, desaturated muted colors, documentary photography, completely
empty of people,

the stadium is a PERFECT ELLIPSE seen from directly above, filling the frame,
its long axis running left to right; in the exact centre, a full-size grass
pitch with painted white markings and mown stripes, two white goal frames lying
flat in the image with their shadows beside them, and no running track around
it,

around the pitch, a wide dry moat and a tall perimeter fence, and two
footbridges crossing the moat, one behind each goal, the only connections
between the terracing and the pitch,

the LOWER RING: a continuous elliptical band of uncovered concrete steps
hugging the pitch, unbroken all the way around with no gap at any corner, seen
from directly above as concentric bands of parallel steps, evenly lit across
its whole depth, divided into radial wedge-shaped sectors by straight
stairways that run outward like spokes, with dark tunnel mouths opening through
the steps,

between the rings, an OPEN CONCOURSE: a wide elliptical concrete esplanade
running the whole way around the stadium, completely open to the sky and
plainly visible from above along its entire length, with flights of stairs
rising from it to the upper ring,

the UPPER RING: a second continuous elliptical band of uncovered concrete
steps set FURTHER OUT than the lower ring, standing beyond the concourse and
never over it, so that both rings and the concourse between them are fully
visible from directly above, divided into the same radial wedge-shaped sectors
by straight stairways,

there is no roof anywhere: no canopy, no ring roof, no cantilever, no membrane,
no covered section over either ring, no upper deck overhanging the lower one,

on the outside of the ellipse, four large access ramps, one in each quadrant,
seen from above as broad straight concrete slabs rising to the concourse, each
landing on a paved apron outside,

around the whole stadium, a paved esplanade of concrete slabs and painted
asphalt, then a ring road circling the ellipse with cars and coaches parked
along it seen from directly above as roofs only, the road running out of frame
at the left and right edges,

photorealistic, natural materials, sun-bleached concrete, stained old concrete,
worn grass, tropical Brazil, Rio de Janeiro, 8k satellite imagery quality,
sharp detail, no people visible, no spectators, no players
```

## Negativo

```
oblique aerial, bird's eye view, three quarter view, tilted camera, angled
drone shot, perspective view, stand seen from the front, seating rows rising
vertically in the image, far side of the bowl seen from inside, visible façade,
roof offset from its base, leaning stands, vanishing point, wide angle,
fisheye, lens distortion, parallax,

roof, stadium roof, ring roof, covered stand, canopy, awning, cantilever,
cantilevered upper deck, upper tier overhanging the lower tier, ring above
ring, deck over the concourse, sky boxes, executive boxes over the seats,
membrane roof, retractable roof, concourse hidden under the stand, shaded lower
tier, dark lower ring,

rectangular stadium, square bowl, single tier only, one ring only, gaps at the
corners, broken ring, athletics track, running track, olympic stadium,
all-seater arena, coloured plastic seats, world cup arena, european stadium,
closed moat with no crossing, no tunnels, no ramps,

illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, seating chart, seating map, section numbers, coloured
sectors, map icons, labels, text, sponsor boards, advertising, club badges,
watermark, grid lines, vignette,
crowd, people, spectators, players, football match, flags, banners, moving cars,
saturated colors, hdr, dramatic lighting, night, floodlit, rain
```

## Sementes pro importador

```python
{'id': 'estadio-maracana', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'estadio_maracana.webp',
 # gramado, anel inferior, circulação, anel superior e a esplanada de fora
 'sementes': [(0.50, 0.50), (0.42, 0.50), (0.58, 0.50),
              (0.50, 0.34), (0.50, 0.66), (0.30, 0.50), (0.70, 0.50),
              (0.50, 0.26), (0.50, 0.74), (0.22, 0.50), (0.78, 0.50),
              (0.50, 0.16), (0.50, 0.84), (0.14, 0.50), (0.86, 0.50),
              (0.03, 0.50), (0.97, 0.50)],
 'recorte': [(0.00, 0.02, 1.00, 0.98)]},
```

As sementes vão em quatro raios, de dentro pra fora: gramado, anel inferior,
circulação, anel superior. Se o corte fechar um raio, a máscara perdeu um andar
— e num estádio de dois anéis é assim que se descobre que a foto saiu com
balanço.

## Ordem curta de correção

```
Shoot this from exactly overhead, at zenith: the stadium is a perfect ellipse,
every side of the bowl looks the same, each row of steps faces the pitch and no
stand is seen from the front. Remove the roof entirely — no ring roof, no
canopy, no cantilever anywhere — and set the upper ring further out than the
lower one, with a wide open concourse between them that is visible from above
along its whole length. Keep both rings continuous with no gap at the corners,
keep the four external ramps, the moat and fence around the pitch, and the two
footbridges behind the goals. No people, no advertising.
```

## Conferir

1. **É uma elipse**, não um retângulo arredondado. Estádio brasileiro de canto
   reto o modelo entrega sozinho, porque é o que ele viu mais.
2. **Os quatro raios aparecem**: anel inferior, circulação, anel superior, e a
   esplanada de fora. Circulação sumida numa faixa escura é balanço, e o anel
   de baixo foi comido.
3. **Sem cobertura em nenhum dos dois anéis** — nem a faixa de laje na última
   fileira.
4. **As quatro rampas existem** e encostam na circulação. São a fuga: elipse
   contínua não tem quina pra escapar.
5. **As duas passarelas sobre o fosso**, atrás dos gols.
6. Depois de importar: gramado, degraus, circulação, rampa e esplanada viram
   chão; fosso, alambrado, grade de setor e traves viram parede no pincel.

## Variante — meio estádio

Mesma imagem, dobro da escala. Troque a linha da elipse por:

```
the frame shows ONE HALF of a huge oval Brazilian football stadium seen from
directly above, cut across the middle of the pitch: one goal end and the two
side stands up to the halfway line, the ellipse curving out of frame at the
right edge,
```

e tire da última seção a esplanada de fora, deixando só a faixa de rua na
borda. O disco volta a 1,8 m — o mesmo da cena de 40 mil —, e a briga vira o
que ela é na prática: **setor contra setor**, e não estádio contra estádio.
