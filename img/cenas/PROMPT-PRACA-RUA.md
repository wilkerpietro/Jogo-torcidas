# Prompts para as cenas de PRAÇA e de RUA

Uma imagem por cena. Alvo: o mesmo acabamento de `arredores.png` —
foto de drone a prumo, dia nublado, cor dessaturada, cidade brasileira.

| Cena | Bairro que abre | Planta de entrada | Saída pro jogo | Estado |
|---|---|---|---|---|
| Praça | qualquer | `planta-praca-2048.png` | `praca.webp` | **feita** — `Aerial_view_of_public_square_202608131340.jpeg` |
| Rua | Favela e Classe Baixa | `planta-rua-2048.png` | `rua.webp` | **feita** — `Aerial_view_of_residential_street_202608131403.jpeg` |
| Rua de classe média | Classe Média | `planta-rua-media-2048.png` | `rua_media.webp` | **feita** — `Aerial_view_of_residential_street_202608131455.jpeg` |
| Rua de classe alta | Nobre | `planta-rua-nobre-2048.png` | `rua_nobre.webp` | **feita** — `Aerial_view_of_residential_avenue_202608131501.jpeg` |

A briga abre a cena do bairro onde ela cai: esbarrão no Pirambu não pode
abrir a mesma rua do esbarrão na Aldeota. As três ruas têm **a mesma
geometria** — pista larga no meio, calçada larga dos dois lados,
transversal em cada ponta — e mudam só no que está construído em volta.
Isso é de propósito: a colisão é a mesma, então trocar de bairro não
muda a tática, muda o cenário.

As duas plantas saem do próprio jogo (`TO.diaJogo.arredores.desenharFundo`
num canvas 2048×1365, sem disco e sem HUD). Elas são a **geometria de
colisão** — cada muro, cada meio-fio e cada quiosque ali é o que o disco
esbarra dentro do jogo.

## O que não pode mudar

A imagem vira o chão da cena. Se a IA fechar uma boca de rua ou plantar
prédio em cima de calçada, o disco passa a andar por cima de parede.

- **enquadramento a prumo** (nadir). Nada de perspectiva, nada de horizonte.
  A proporção pode ser 16:9 como as duas primeiras vieram: o importador
  encaixa a largura inteira e completa a altura com faixa de quintal, porque
  cortar de lado tiraria justamente as transversais das pontas;
- toda faixa escura da planta continua sendo via aberta, do começo ao fim;
- as **quatro bocas de rua** da praça (uma no meio de cada borda) e as **duas
  transversais** da rua (uma em cada ponta) continuam abertas e no mesmo lugar;
- os quarteirões não deslocam nem arredondam: o vão entre dois blocos é beco,
  e beco fechado é bug;
- a calçada mantém a largura que tem na planta — na cena de rua ela é larga de
  propósito, é por ali que se escapa sem sair do quadro;
- nada de gente na imagem: o povo são os discos, desenhados por cima.

## Como rodar (isto importa mais que o texto)

Não use texto puro — a planta tem de ser a base:

- **img2img** com *denoising strength* entre **0,35 e 0,50**. Acima de 0,55 o
  modelo redesenha o traçado e a colisão quebra.
- Melhor ainda: **ControlNet Canny ou Lineart, peso 0,9–1,1**, com a planta como
  guia. Aí dá pra subir o denoise sem perder rua.
- Duas passadas: uma a 2048 pro traçado, outra de *upscale* 2× (tile/ultimate SD
  upscale, denoise 0,2) só pra textura.
- Ponha o arquivo em `img/cenas/` e rode
  `python3 ferramentas/importar_cena_foto.py` — ele encaixa na tela, tira a
  máscara de caminhabilidade da própria foto e escreve `dados/cenas_foto.js`.
  Confira em `img/cenas/_ref_mascara_<cena>.png`: o que está claro é chão de
  andar, o escuro é parede. Telhado claro tem de estar escuro ali.

### Quando o corte errar (e ele erra)

O importador separa chão de construção por cor, e cor sozinha não resolve:
calçada clara vira parede, laje clara vira chão. Não conserte `cenas_foto.js`
— ele é gerado e some na próxima importação. Conserte na mão:

1. abra a cena na bancada (`arredores.html`) e aperte **F2**;
2. pinte com o pincel — clique libera passagem, shift ou botão direito bloqueia,
   `[` e `]` mudam o tamanho —, e arraste os marcadores que ficarem mal postos;
3. clique em **Exportar arquivo**: fora dos arredores ele devolve só o remendo
   da cena que está no ar, sem a imagem junto;
4. cole em `dados/cenas_editadas.js`, na chave da cena. Esse arquivo é da mão,
   entra depois do gerado e manda — o que estiver escrito lá troca, o resto
   continua vindo da foto;
5. confira com `python3 ferramentas/prova_mascara.py`, que desenha
   `_ref_mascara_<cena>_editada.png` com a máscara que vale de verdade.

Foi assim com a rua de periferia: o corte tinha deixado só o asfalto, e a
calçada larga — que é por onde se escapa sem sair do quadro — voltou a ser
chão de andar.

---

## PRAÇA — prompt

```
top-down nadir aerial drone photograph of a large open public square in a
Brazilian working-class neighbourhood, shot straight down at 90 degrees,
orthographic feel, overcast diffuse daylight, soft shadows, desaturated muted
colors, documentary photography,

one big rectangular plaza of pale portuguese pavement in black-and-white wave
mosaic, mostly empty open ground, an octagonal green bandstand with a small
dome at the exact center, two wide paved walkways crossing the plaza north-south
and east-west, low painted curbs all around the plaza edge,

very few trees: only two small planted beds with mango trees at opposite corners
of the plaza, each fenced by a low metal railing, the rest of the square is bare
open pavement,

food kiosks and bars along the plaza edges: two round street kiosks with
red-and-white striped awnings, a blue newsstand, a corner bar with plastic
tables and chairs on the sidewalk under a striped awning, string of colored
festival flags between lamp posts,

a paved street runs around all four sides of the square, and a cross street
arrives at the middle of every side, making four corners — one per side; worn
dark asphalt with faded yellow center lines, painted black-and-white curbs,
zebra crossings at each of the four mouths, a few cars parked along the curb,

facing the square: a small catholic church with a cross on the north-west block,
two-storey shops and apartment blocks on the other blocks, a row of bars with
green-and-white striped awnings on the south-east block, terracotta tile roofs
and flat concrete rooftops with blue water tanks,

photorealistic, natural materials, sun-bleached concrete, tropical northeast
Brazil, 8k satellite imagery quality, sharp detail, no people visible
```

### Negativo

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, fisheye, vignette,
dense forest, park full of trees, lawn, grass field, fountain, statue, monument,
buildings covering the streets, blocked street mouths, dead ends, closed roads,
crowd, people, pedestrians, cars driving, european plaza, cobblestone piazza,
saturated colors, hdr, dramatic lighting, night, rain
```

---

## RUA — prompt

```
top-down nadir aerial drone photograph of a typical wide residential street in a
Brazilian working-class neighbourhood, shot straight down at 90 degrees,
orthographic feel, overcast diffuse daylight, soft shadows, desaturated muted
colors, documentary photography,

one wide two-lane street running left to right across the whole frame, worn dark
asphalt patched and repaired, faded yellow dashed center line, one stretch of old
cobblestone paving in the middle of the block, a speed bump painted in
black-and-white stripes, painted black-and-white curbs on both sides,

unusually wide concrete sidewalks on both sides of the street, cracked slabs with
weeds in the joints, oil stains, lamp posts with tangled wires, a couple of
rubbish skips, plastic tables and chairs from a corner bar spilling onto the
sidewalk,

a cross street at each end of the block, so the frame shows two corners on the
left and two corners on the right; the sidewalk turns the corner around each
corner building; zebra crossings at both intersections,

two rows of low houses facing each other along the street: terracotta clay tile
roofs and flat concrete rooftops, blue water tanks, laundry lines with colorful
clothes, satellite dishes, weathered asbestos sheets, small back yards of bare
packed earth behind the houses, narrow service alleys between some of them,
graffiti on the boundary walls, cars parked along both curbs,

photorealistic, natural materials, sun-bleached concrete, tropical northeast
Brazil, 8k satellite imagery quality, sharp detail, no people visible
```

### Negativo

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, fisheye, vignette,
narrow alley, one-way lane, no sidewalk, buildings covering the street,
blocked intersections, dead end, cul-de-sac, roundabout,
crowd, people, pedestrians, moving cars, american suburb, european street,
snow, river, saturated colors, hdr, dramatic lighting, night, rain
```

---

## RUA DE CLASSE MÉDIA — prompt

Mesmo enquadramento e mesma geometria da rua de periferia: pista larga
atravessando o quadro da esquerda pra direita, calçada larga dos dois
lados, uma transversal em cada ponta. O que muda é o bairro em volta.

```
top-down nadir aerial drone photograph of a wide middle-class residential
street in a Brazilian city, shot straight down at 90 degrees, orthographic
feel, overcast diffuse daylight, soft shadows, desaturated muted colors,
documentary photography,

one wide two-lane street running left to right across the whole frame,
well-maintained dark asphalt with crisp painted markings, clean yellow dashed
center line, white parking bays painted along both curbs, a painted speed bump,
freshly painted black-and-white curbs,

wide sidewalks of interlocking concrete paver blocks on both sides, evenly
spaced young street trees in square tree pits along the curb, tidy joints, no
weeds, drain grates, a bus stop shelter on one side,

a cross street at each end of the block, so the frame shows two corners on the
left and two corners on the right; the sidewalk turns the corner around each
corner building; zebra crossings and a traffic sign at both intersections,

two rows of two-storey houses and small three-storey apartment blocks facing
each other, each with a walled front garden, a metal gate and a garage, clean
ceramic roof tiles and flat white rooftops with solar water heater panels and
air-conditioning units, a few blue water tanks, small backyards with mown grass
and one with a tiny swimming pool, a corner bakery with an awning and outdoor
tables, modern cars parked in the garages and along the bays,

photorealistic, natural materials, tropical Brazil, 8k satellite imagery
quality, sharp detail, no people visible
```

### Negativo

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, fisheye, vignette,
favela, shantytown, exposed brickwork, unfinished construction, dirt yard,
laundry lines, asbestos sheets, potholes, cracked pavement, graffiti,
high-rise towers, gated luxury condominium,
narrow alley, no sidewalk, blocked intersections, dead end,
crowd, people, pedestrians, moving cars, snow, night, rain, hdr
```

---

## RUA DE CLASSE ALTA — prompt

Mesma geometria de novo. Aqui o bairro é nobre: muro alto, guarita,
jardim e torre residencial. A rua continua sendo a mesma pista larga —
mudou o que tem atrás do muro.

```
top-down nadir aerial drone photograph of a wide upper-class residential avenue
in an affluent Brazilian neighbourhood, shot straight down at 90 degrees,
orthographic feel, overcast diffuse daylight, soft shadows, desaturated muted
colors, documentary photography,

one wide two-lane avenue running left to right across the whole frame, smooth
new asphalt, crisp white and yellow markings, clean painted curbs, no potholes,

very wide sidewalks of light stone paving on both sides, a continuous row of
large mature shade trees with full round canopies along both curbs, manicured
grass strips, ornamental street lamps,

a cross street at each end of the block, so the frame shows two corners on the
left and two corners on the right; the sidewalk turns the corner around each
corner property; zebra crossings at both intersections,

on both sides, gated luxury properties behind tall smooth boundary walls topped
with electric fencing: high-rise residential towers with rooftop swimming pools,
rooftop tennis court, landscaped gardens with palm trees and cut lawn, curved
driveways, a covered entrance canopy, security guard booths at each gate,
underground garage ramps, a private security car parked at a gate,

photorealistic, natural materials, tropical Brazil, 8k satellite imagery
quality, sharp detail, no people visible
```

### Negativo

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, fisheye, vignette,
favela, shantytown, terracotta roof tiles, blue water tanks, laundry lines,
asbestos sheets, graffiti, dirt yard, cracked sidewalk, weeds, potholes,
street market, small houses, narrow alley, no sidewalk, blocked intersections,
crowd, people, pedestrians, moving cars, snow, night, rain, hdr
```

---

## Conferência antes de aceitar

1. Abra a saída ao lado da planta e alterne entre as duas: nenhuma rua pode ter
   sumido nem entortado, e as bocas têm de estar no mesmo lugar.
2. Na praça, conte as bocas: **quatro**, uma no meio de cada borda. Se a IA
   fechar uma, o bonde daquele lado não tem por onde entrar.
3. Na rua, olhe as duas pontas: as transversais têm de atravessar de cima a
   baixo, e a calçada tem de dobrar a esquina.
4. Cole no jogo e ande com o líder (WASD) encostando em tudo. A malha de colisão
   é reconstruída da máscara, não do desenho — parede que só existe na foto vira
   disco atravessando muro. Se acontecer, refaça com denoise mais baixo.
