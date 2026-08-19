# Prompts das cinco sedes — nível 1 ao 5, por dentro

Cinco imagens, uma por nível de sede (`TETO` e `PONTO` em
`js/gestao/patrimonio.js`). A cena é **o prédio por dentro, visto do zênite,
com a laje removida** — o molde do bar e da loja, agora com a planta inteira à
mostra. É a cena da ação *atacar a sede*: o bonde chega pela rua, entra pela
porta da frente e toma sala por sala.

| Nível | Salas | Saída pro jogo | Estado |
|---|---|---|---|
| 1 | pátio, presidente, patrimônio | `sede1.webp` | a fazer |
| 2 | + bar, sala de criações, sala de treinos | `sede2.webp` | a fazer |
| 3 | + centro de operações, dormitório, setor criativo, lojinha | `sede3.webp` | a fazer |
| 4 | + garagem, loja | `sede4.webp` | a fazer |
| 5 | + corredor, centro administrativo, minifábrica, hotel, academia | `sede5.webp` | a fazer |

**A planta desenhada é a lei.** Cada nível tem a sua, e o que está nela —
parede, porta, tamanho de sala — é a colisão do jogo. O prompt aqui é só a
roupa: ele diz o que tem dentro de cada sala pra a foto ter textura. Se o
modelo mudar a planta, a imagem não serve, por mais bonita que esteja.

**Rode com a planta na mão.** Anexe o desenho junto com o prompt e mande
seguir: *"follow the attached floor plan exactly — same rooms, same
proportions, same door positions"*. No Flow, use a planta como imagem de
referência. Sem ela, o modelo inventa corredor e o disco passa a andar por
cima de parede.

## Escala, nível por nível

A sede cresce a cada nível, então o drone sobe junto. O disco continua com 7 px
de raio:

| Nível | Pegada do prédio | O quadro cobre | Escala | O disco vira |
|---|---|---|---|---|
| 1 | ~24 × 14 m | ~40 m | 38 px/m | ~0,37 m |
| 2 | ~30 × 18 m | ~40 m | 38 px/m | ~0,37 m |
| 3 | ~34 × 22 m | ~45 m | 34 px/m | ~0,41 m |
| 4 | ~42 × 26 m | ~55 m | 28 px/m | ~0,50 m |
| 5 | ~58 × 34 m | ~70 m | 22 px/m | ~0,64 m |

É o inverso do estádio: aqui o disco fica **menor** que o normal das ruas, e
tudo bem — briga de sede é de dezenas, não de centenas, e sala cheia trava.

## O que vale pras cinco

- **a laje sai do prédio inteiro**, não só de uma sala. Parede vista do zênite
  é **linha grossa**, e todo piso aparece com a mesma luz. Meia laje esconde
  justo o canto onde o jogador precisa entrar;
- **as portas são os únicos vãos**, e são elas que fazem a cena. A sede é uma
  briga de gargalo: cada porta é um funil, e quem segura a porta segura a sala.
  Porta a mais é sede furada; porta a menos é sala inalcançável;
- **o pátio é o miolo** — é o único espaço grande, é por onde tudo se liga e é
  onde a briga se decide;
- **uma faixa de rua e calçada na borda de baixo**, onde o bonde atacante
  chega. É a única parte da imagem que não é o prédio;
- **telhado dos vizinhos fica inteiro.** Só a sede está aberta;
- **sem cor de torcida, sem escudo, sem nome.** A mesma arte serve às 138
  torcidas: bandeira enrolada é lona crua, camisa da loja é branca e cinza, e o
  nome entra por cima na UI;
- **sem gente.** Quem enche a sede são os discos.

## Bloco de zênite

**É o mesmo das outras nove cenas**, palavra por palavra — o das seis de
`PROMPT-TRETAS.md` e o das três de `PROMPT-ESTADIOS.md` —, mais a frase de
maquete que a sede precisa. Abre os cinco prompts, já colado em todos:

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points,

every object seen only as its top surface: roofs only, vehicle roofs only, no
façades, no building elevations, no side walls, no visible fronts of anything,
nothing leaning outward at the edges of the frame,

architectural cutaway from directly above: the roof of this building is
entirely removed, its walls appear only as thick lines and never as surfaces
seen from the side, every floor is evenly lit by the same flat daylight, and
every piece of furniture shows only its top face with its shadow beside it —
desks, beds, counters, shelves and machines are flat shapes lying on the
floor,
```

## Negativo — vale pros cinco

```
oblique aerial, bird's eye view, three quarter view, tilted camera, angled
drone shot, perspective view, visible façade, visible building side, visible
wall elevation, roof offset from its base, leaning buildings, vehicles seen
from the side, windscreen visible, car front visible, vanishing point,
wide angle, fisheye, lens distortion, parallax,

interior wall seen from inside, room seen from the side, furniture seen from
the side, ceiling visible, roof over any room,
partial roof, half roof, roof ring, eaves, overhang, covered walkway, shaded
interior, dark room, unlit corners, walls hiding the floor, roof offset from
its base, vanishing point, wide angle, fisheye, lens distortion, parallax,

doll house, whole block cutaway, neighbouring buildings without roofs,
extra corridors, extra doors, invented rooms, open plan, walls removed,
furniture blocking the doorways,

club colours, team badge, crest, logo, club name, lettering, text, numbers,
signage with words, flags with emblems, painted stripes in team colours,
sponsor boards, advertising, watermark,

illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, floor plan drawing, map icons, labels, grid lines,
vignette, interior lighting, indoor photo, eye-level view,
crowd, people, members, staff, moving cars,
saturated colors, hdr, dramatic lighting, night, rain
```

---

## SEDE NÍVEL 1 — pátio, presidente, patrimônio

O começo: um galpão de esquina com um pátio coberto de cimento e duas salas
nos fundos. Duas portas na parede da frente, dando pra rua — é por elas que o
ataque entra, e são o único gargalo que existe.

Planta: o **pátio ocupa a metade esquerda inteira**, do topo à base. A metade
direita é dividida em duas: **presidente em cima**, **patrimônio embaixo**, as
duas abrindo pro pátio. Na parede de baixo do pátio, **duas portas** pra rua.

Spawns sugeridos: `mandante1` (400, 900) e `mandante2` (620, 940), na calçada;
`visitante1` (1150, 300) e `visitante2` (1180, 700), dentro das salas.

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points,

every object seen only as its top surface: roofs only, vehicle roofs only, no
façades, no building elevations, no side walls, no visible fronts of anything,
nothing leaning outward at the edges of the frame,

architectural cutaway from directly above: the roof of this building is
entirely removed, its walls appear only as thick lines and never as surfaces
seen from the side, every floor is evenly lit by the same flat daylight, and
every piece of furniture shows only its top face with its shadow beside it —
desks, beds, counters, shelves and machines are flat shapes lying on the
floor,

photograph of a small Brazilian football supporters' club headquarters, a
plain single-storey building on a street corner, overcast diffuse daylight,
desaturated muted colors, documentary photography, completely empty of people,

the whole floor plan is visible from above, wall to wall, with nothing hiding
any part of it,

the left half of the building is one large open COURTYARD of bare polished
cement, cracked slabs, a floor drain, a stack of plastic chairs against the
wall, two folding tables leaning flat, a mop bucket, an old sofa along one
wall, a rolled canvas banner on the floor,

the right half is divided into two rooms of similar size, both opening onto the
courtyard through a single doorway each:
the upper room is the PRESIDENT'S OFFICE: a desk with a chair and a computer, a
filing cabinet, two visitor chairs, a small safe, a shelf of trophies;
the lower room is the STORE ROOM: metal shelving along the walls, stacked
plastic crates, three large drums and two snare drums of a percussion band,
rolls of plain canvas, coils of rope, a stepladder,

in the bottom wall of the courtyard, TWO DOORWAYS open onto the street and they
are the only openings in that wall,

along the bottom edge of the frame, a strip of concrete sidewalk and a two-lane
asphalt street with painted curbs, two cars parked at the kerb seen from above
as roofs only,

on the other sides, neighbouring buildings keep their roofs completely intact,
shown only as roof surfaces: flat concrete rooftops with blue water tanks and
terracotta clay tiles,

photorealistic, natural materials, sun-bleached concrete, plain unpainted
walls, tropical Brazil, 8k, sharp detail, no people visible
```

### Sementes pro importador

```python
{'id': 'sede1', 'arquivo': '<arquivo que saiu>.jpeg', 'saida': 'sede1.webp',
 # o pátio, as duas salas e a rua
 'sementes': [(0.35, 0.50), (0.35, 0.25), (0.35, 0.75),
              (0.72, 0.30), (0.72, 0.70),
              (0.50, 0.93), (0.05, 0.93), (0.95, 0.93)],
 'recorte': [(0.10, 0.08, 0.90, 0.86), (0.00, 0.86, 1.00, 1.00)]},
```

### Conferir

1. **Duas portas na frente, e só.** Três portas e a sede vira corredor.
2. As duas salas abrem **pro pátio**, não pra rua.
3. Piso inteiro à vista, com a mesma luz — sem faixa escura rente às paredes.
4. Depois de importar: piso de sala e pátio viram chão; mesa, armário, sofá,
   prateleira e bateria viram parede no pincel.

---

## SEDE NÍVEL 2 — a faixa de salas e a sala de treinos

Cresceu pra cima: três salas em fila no fundo, o bar na quina e a sala de
treinos no canto. O pátio continua sendo o miolo, e agora tem quatro portas
dando nele — a briga deixa de ser um funil só.

Planta: **faixa superior com três salas lado a lado** — presidente (esquerda),
sala de criações (meio), patrimônio (direita). Abaixo delas, o **pátio** grande.
No canto esquerdo do pátio, o **bar**, estreito e comprido. No canto inferior
direito, a **sala de treinos**, recuada em L. Portas: duas ligando presidente e
criações ao pátio, duas ligando criações e patrimônio, uma no bar, uma na sala
de treinos, e **duas na parede de baixo**, pra rua.

Spawns sugeridos: `mandante1` (500, 930) e `mandante2` (700, 960), na rua;
`visitante1` (300, 250) e `visitante2` (1100, 700), na sala e no treino.

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points,

every object seen only as its top surface: roofs only, vehicle roofs only, no
façades, no building elevations, no side walls, no visible fronts of anything,
nothing leaning outward at the edges of the frame,

architectural cutaway from directly above: the roof of this building is
entirely removed, its walls appear only as thick lines and never as surfaces
seen from the side, every floor is evenly lit by the same flat daylight, and
every piece of furniture shows only its top face with its shadow beside it —
desks, beds, counters, shelves and machines are flat shapes lying on the
floor,

photograph of a Brazilian football supporters' club headquarters, a
single-storey building around a courtyard, overcast diffuse daylight,
desaturated muted colors, documentary photography, completely empty of people,

the whole floor plan is visible from above, wall to wall, nothing hidden,

along the top of the building, three rooms in a row, each opening onto the
courtyard through one doorway:
on the left the PRESIDENT'S OFFICE with a desk, computer, filing cabinets, a
meeting table with four chairs and a small safe;
in the middle the BANNER WORKSHOP with two long work tables, rolls of plain
canvas and fabric leaning in a corner, buckets of paint, brushes in jars, a
sewing machine, an unpainted banner spread flat on the floor;
on the right the STORE ROOM with metal shelving, stacked crates, bass drums and
snare drums of a percussion band, coiled rope, folded plain flags,

below them, a large open COURTYARD of bare cement filling the middle of the
plan, a floor drain, plastic chairs and tables stacked at one side, a water
tank on the floor,

in the left corner of the courtyard, a narrow BAR: a counter along its length,
two chest freezers, crates of bottles stacked against the wall, three small
tables, opening onto the courtyard through one doorway,

in the bottom right corner, a TRAINING ROOM set back in an L shape: rubber mats
on the floor, two heavy punching bags fixed to the floor, a weight bench,
stacked dumbbells, a mirror line along one wall, one doorway to the courtyard,

in the bottom wall, TWO DOORWAYS open onto the street, the only openings there,

along the bottom edge of the frame, a strip of concrete sidewalk and a two-lane
asphalt street, cars parked at the kerb seen as roofs only,

neighbouring buildings keep their roofs completely intact, shown only as roof
surfaces,

photorealistic, natural materials, sun-bleached concrete, plain unpainted
walls, tropical Brazil, 8k, sharp detail, no people visible
```

### Sementes pro importador

```python
{'id': 'sede2', 'arquivo': '<arquivo que saiu>.jpeg', 'saida': 'sede2.webp',
 'sementes': [(0.45, 0.55), (0.30, 0.55), (0.60, 0.55),
              (0.20, 0.22), (0.45, 0.22), (0.72, 0.22),
              (0.10, 0.62), (0.72, 0.75),
              (0.50, 0.94), (0.05, 0.94), (0.95, 0.94)],
 'recorte': [(0.06, 0.06, 0.94, 0.88), (0.00, 0.88, 1.00, 1.00)]},
```

### Conferir

1. As **três salas da faixa de cima** estão na ordem da planta e cada uma tem
   **uma** porta pro pátio.
2. O bar é estreito e comprido na quina esquerda, não uma sala quadrada no meio.
3. A sala de treinos é recuada em L, e o pátio contorna ela.
4. Duas portas pra rua, e só.

---

## SEDE NÍVEL 3 — duas colunas e o dormitório

Aqui a sede vira prédio de verdade: duas colunas de salas com o pátio entre
elas. Quem defende tem onde se enfiar, e quem ataca tem que limpar sala por
sala.

Planta: **coluna esquerda** — presidente (topo), centro de operações (meio),
bar (canto de baixo). **Coluna direita** — dormitório (topo), patrimônio,
setor criativo, lojinha (base). **No meio**, o pátio de cima a baixo, com a
**área de treino** ocupando a parte de baixo dele. Cada sala abre pro pátio por
uma porta. Duas portas na parede de baixo, pra rua, e a lojinha tem **a sua
própria porta pra rua** — é a única sala que fala com a calçada.

Spawns sugeridos: `mandante1` (600, 940) e `mandante2` (820, 960), na rua;
`visitante1` (250, 300) e `visitante2` (1250, 250), no operações e no
dormitório.

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points,

every object seen only as its top surface: roofs only, vehicle roofs only, no
façades, no building elevations, no side walls, no visible fronts of anything,
nothing leaning outward at the edges of the frame,

architectural cutaway from directly above: the roof of this building is
entirely removed, its walls appear only as thick lines and never as surfaces
seen from the side, every floor is evenly lit by the same flat daylight, and
every piece of furniture shows only its top face with its shadow beside it —
desks, beds, counters, shelves and machines are flat shapes lying on the
floor,

photograph of a Brazilian football supporters' club headquarters, a
single-storey building with two rows of rooms around a central courtyard,
overcast diffuse daylight, desaturated muted colors, documentary photography,
completely empty of people,

the whole floor plan is visible from above, wall to wall, nothing hidden,

down the LEFT SIDE, three spaces stacked one above the other, each with one
doorway onto the courtyard:
at the top the PRESIDENT'S OFFICE with a desk, computer, filing cabinets, a
meeting table and a safe;
in the middle the OPERATIONS ROOM with a long central table, benches, a wall of
pinned papers and a large plain map board, two old computers, a whiteboard;
at the bottom the BAR with a counter, two chest freezers, stacked crates and
three small tables,

down the RIGHT SIDE, four rooms stacked one above the other, each with one
doorway onto the courtyard:
at the top the DORMITORY with six metal bunk beds, thin mattresses, a row of
lockers;
below it the STORE ROOM with metal shelving, stacked crates, bass drums and
snare drums, coiled rope and folded plain flags;
below that the CREATIVE ROOM with work tables, rolls of plain canvas, paint
buckets, brushes, a sewing machine;
at the bottom a small SHOP with a glass counter, two clothes rails of plain
white and grey shirts, wall shelves of folded shirts and caps, and its own
doorway opening directly onto the street,

between the two sides, a long open COURTYARD of bare cement running from top to
bottom, a floor drain, stacked plastic chairs, and in its lower half a TRAINING
AREA marked out with rubber mats, two heavy punching bags fixed to the floor, a
weight bench and stacked dumbbells,

in the bottom wall of the courtyard, TWO DOORWAYS open onto the street,

along the bottom edge of the frame, a strip of concrete sidewalk and a two-lane
asphalt street, cars parked at the kerb seen as roofs only,

neighbouring buildings keep their roofs completely intact, shown only as roof
surfaces,

photorealistic, natural materials, sun-bleached concrete, plain unpainted
walls, tropical Brazil, 8k, sharp detail, no people visible
```

### Sementes pro importador

```python
{'id': 'sede3', 'arquivo': '<arquivo que saiu>.jpeg', 'saida': 'sede3.webp',
 'sementes': [(0.50, 0.50), (0.50, 0.28), (0.50, 0.70),
              (0.18, 0.20), (0.18, 0.48), (0.18, 0.76),
              (0.80, 0.16), (0.80, 0.38), (0.80, 0.60), (0.80, 0.80),
              (0.50, 0.95), (0.05, 0.95), (0.95, 0.95)],
 'recorte': [(0.05, 0.05, 0.95, 0.90), (0.00, 0.90, 1.00, 1.00)]},
```

### Conferir

1. **Duas colunas e um pátio no meio**, na ordem da planta, de cima pra baixo.
2. A lojinha tem **duas** portas — uma pro pátio, uma pra rua. É a única.
3. A área de treino está dentro do pátio, não é sala fechada.
4. Nenhum corredor inventado ligando sala com sala: tudo passa pelo pátio.

---

## SEDE NÍVEL 4 — a garagem entra

O porte de sede grande: um bloco central aparece entre as colunas, e a garagem
abre pra rua com portão de veículo. É a primeira sede em que existe um caminho
que não passa pelo pátio — e é de propósito: quem conhece a casa corta pela
garagem.

Planta: **coluna esquerda** — presidência (topo), centro de operações (meio),
bar e pátio (base). **Bloco central superior** — patrimônio à esquerda, setor
criativo à direita. **Coluna direita** — dormitório (topo), loja (base).
**Base central** — área de treinos e, ao lado, a garagem, que atravessa até a
parede de baixo. Portas: as salas abrem pro pátio; a garagem tem **portão de
veículo pra rua** e uma porta interna; a loja tem porta própria pra calçada.

Spawns sugeridos: `mandante1` (700, 950) e `mandante2` (980, 960), na rua;
`visitante1` (250, 250) e `visitante2` (1300, 300), na presidência e no
dormitório.

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points,

every object seen only as its top surface: roofs only, vehicle roofs only, no
façades, no building elevations, no side walls, no visible fronts of anything,
nothing leaning outward at the edges of the frame,

architectural cutaway from directly above: the roof of this building is
entirely removed, its walls appear only as thick lines and never as surfaces
seen from the side, every floor is evenly lit by the same flat daylight, and
every piece of furniture shows only its top face with its shadow beside it —
desks, beds, counters, shelves and machines are flat shapes lying on the
floor,

photograph of a large Brazilian football supporters' club headquarters, a
single-storey compound of rooms around a courtyard, overcast diffuse daylight,
desaturated muted colors, documentary photography, completely empty of people,

the whole floor plan is visible from above, wall to wall, nothing hidden,

down the LEFT SIDE: at the top the PRESIDENT'S OFFICE with desk, computer,
filing cabinets, meeting table and safe; below it the OPERATIONS ROOM with a
long table, benches, a plain map board and two computers; at the bottom corner
a narrow BAR with a counter, two chest freezers and stacked crates,

in the UPPER MIDDLE, a block of two rooms side by side: on the left the STORE
ROOM with metal shelving, stacked crates, bass drums and snare drums, coiled
rope and folded plain flags; on the right the CREATIVE ROOM with long work
tables, rolls of plain canvas, paint buckets and a sewing machine,

down the RIGHT SIDE: at the top the DORMITORY with eight metal bunk beds and
lockers; at the bottom the SHOP with a glass counter, clothes rails of plain
white and grey shirts, wall shelves, and its own doorway onto the street,

in the LOWER MIDDLE, the open COURTYARD of bare cement with a TRAINING AREA of
rubber mats, two heavy punching bags fixed to the floor, a weight bench and
dumbbells, and beside it the GARAGE: a bare concrete bay with a van and a small
bus parked inside seen from above as roofs only, oil stains, a workbench and
tyres along one wall, a wide vehicle gate in the bottom wall opening onto the
street and one internal doorway to the courtyard,

in the bottom wall of the courtyard, TWO DOORWAYS open onto the street,

along the bottom edge of the frame, a strip of concrete sidewalk and a two-lane
asphalt street, cars parked at the kerb seen as roofs only,

neighbouring buildings keep their roofs completely intact, shown only as roof
surfaces,

photorealistic, natural materials, sun-bleached concrete, plain unpainted
walls, tropical Brazil, 8k, sharp detail, no people visible
```

### Sementes pro importador

```python
{'id': 'sede4', 'arquivo': '<arquivo que saiu>.jpeg', 'saida': 'sede4.webp',
 'sementes': [(0.40, 0.62), (0.28, 0.62), (0.52, 0.72),
              (0.14, 0.18), (0.14, 0.42), (0.10, 0.72),
              (0.42, 0.22), (0.62, 0.22),
              (0.86, 0.18), (0.86, 0.70),
              (0.66, 0.72), (0.50, 0.95), (0.05, 0.95), (0.95, 0.95)],
 'recorte': [(0.04, 0.05, 0.96, 0.90), (0.00, 0.90, 1.00, 1.00)]},
```

### Conferir

1. **A garagem atravessa até a rua** e tem portão de veículo. É o segundo
   caminho de entrada, e é o que dá graça a esta sede.
2. Van e ônibus aparecem **só como teto**, e viram parede no pincel.
3. O bloco central de cima tem duas salas, não uma.
4. A loja tem porta própria pra calçada.

---

## SEDE NÍVEL 5 — o corredor, o hotel e a minifábrica

A sede máxima, e a única com **corredor**. Ele muda a briga inteira: até o
nível 4 tudo passava pelo pátio, e agora existe uma espinha ligando a fila de
cima de ponta a ponta. Quem toma o corredor corta a sede ao meio.

A minifábrica é a `FABRICA` do `patrimonio.js` — só existe em sede nível 5.

Planta: **faixa superior**, da esquerda pra direita — presidência e centro
administrativo (empilhados na quina esquerda), patrimônio, minifábrica, hotel
(bloco maior, à direita). **O corredor** corre horizontal logo abaixo dessa
faixa, ligando todas elas. **Faixa inferior**, da esquerda pra direita — bar,
pátio, academia de treino, loja, garagem. Portas: cada sala de cima abre pro
corredor; o corredor desce pro pátio por duas passagens; loja e garagem abrem
pra rua.

Spawns sugeridos: `mandante1` (800, 980) e `mandante2` (1100, 990), na rua;
`visitante1` (300, 200) e `visitante2` (1350, 260), na presidência e no hotel.

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points,

every object seen only as its top surface: roofs only, vehicle roofs only, no
façades, no building elevations, no side walls, no visible fronts of anything,
nothing leaning outward at the edges of the frame,

architectural cutaway from directly above: the roof of this building is
entirely removed, its walls appear only as thick lines and never as surfaces
seen from the side, every floor is evenly lit by the same flat daylight, and
every piece of furniture shows only its top face with its shadow beside it —
desks, beds, counters, shelves and machines are flat shapes lying on the
floor,

photograph of a big Brazilian football supporters' club headquarters, a
single-storey compound with a long internal corridor, overcast diffuse
daylight, desaturated muted colors, documentary photography, completely empty
of people,

the whole floor plan is visible from above, wall to wall, nothing hidden,

along the TOP of the plan, a row of rooms from left to right, each with one
doorway onto the corridor below them:
in the left corner, stacked one above the other, the PRESIDENT'S OFFICE with
desk, computer and safe, and the ADMINISTRATION ROOM with four desks, computers
and filing cabinets;
then the STORE ROOM with metal shelving, stacked crates, bass drums and snare
drums, coiled rope and folded plain flags;
then the SMALL FACTORY with two industrial sewing machines, a heat press, a
screen-printing table, rolls of plain white fabric on racks and stacked boxes;
on the right the LODGING BLOCK, the largest of them, divided into six small
rooms off a short internal passage, each with two single beds and a locker,

running horizontally under that row, a long straight CORRIDOR of plain tiled
floor crossing the plan from the left corner to the right end, empty except for
a bench and a water cooler,

along the BOTTOM of the plan, from left to right:
a narrow BAR with a counter, chest freezers and stacked crates;
an open COURTYARD of bare cement with stacked plastic chairs and a floor drain;
a TRAINING GYM with rubber matting, four heavy punching bags fixed to the
floor, weight benches, racks of dumbbells and a mirror line;
a SHOP with a glass counter, clothes rails of plain white and grey shirts and
wall shelves, with its own doorway onto the street;
a GARAGE with a bus and two vans parked inside seen from above as roofs only,
oil stains, a workbench and tyres, and a wide vehicle gate onto the street,

TWO PASSAGES connect the corridor down to the courtyard, and two doorways in
the bottom wall of the courtyard open onto the street,

along the bottom edge of the frame, a strip of concrete sidewalk and a two-lane
asphalt street, cars parked at the kerb seen as roofs only,

neighbouring buildings keep their roofs completely intact, shown only as roof
surfaces,

photorealistic, natural materials, sun-bleached concrete, plain unpainted
walls, tropical Brazil, 8k, sharp detail, no people visible
```

### Sementes pro importador

```python
{'id': 'sede5', 'arquivo': '<arquivo que saiu>.jpeg', 'saida': 'sede5.webp',
 # o corredor inteiro, a fila de cima, a fila de baixo e a rua
 'sementes': [(0.20, 0.42), (0.50, 0.42), (0.80, 0.42),
              (0.12, 0.12), (0.12, 0.30), (0.34, 0.20), (0.56, 0.20),
              (0.82, 0.20),
              (0.08, 0.70), (0.24, 0.70), (0.45, 0.72), (0.66, 0.72),
              (0.86, 0.72),
              (0.50, 0.96), (0.05, 0.96), (0.95, 0.96)],
 'recorte': [(0.02, 0.04, 0.98, 0.92), (0.00, 0.92, 1.00, 1.00)]},
```

### Conferir

1. **O corredor atravessa de ponta a ponta** e todas as salas de cima abrem
   nele. Corredor interrompido no meio parte a sede em duas cenas.
2. **Duas passagens** ligando corredor e pátio — uma só vira gargalo único e a
   briga morre lá.
3. O hotel é um bloco de quartinhos, não um salão só.
4. A minifábrica tem máquina, não estoque: quem guarda coisa é o patrimônio.
5. Loja e garagem falam com a rua; o resto, não.

---

## Depois que as cinco existirem

1. Cinco entradas em `FONTES`, no `ferramentas/importar_cena_foto.py`.
2. Cinco cenas em `dados/cenas.js` — e aqui a `saida` é a porta da frente:
   quem sai da sede sai pra rua.
3. **A cena sai do nível da sede**, `E.torcida.sedeNivel`, e não do nome da
   torcida: uma imagem serve as 138. A ação *atacar a sede* abre a cena do
   nível de quem está sendo atacado.
4. O pincel vai ser mais trabalhoso aqui que nas cenas de rua: móvel é
   obstáculo, e cada sala tem os seus. Comece pelas portas — porta fechada na
   máscara é sala inalcançável, e é o erro que trava a cena.
