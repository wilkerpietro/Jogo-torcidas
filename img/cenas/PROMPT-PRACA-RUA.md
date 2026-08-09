# Prompts para as cenas de PRAÇA e de RUA

Duas imagens, uma por cena. Alvo: o mesmo acabamento de `arredores.png` —
foto de drone a prumo, dia nublado, cor dessaturada, periferia brasileira.

| Cena | Planta de entrada | Saída pro jogo |
|---|---|---|
| Praça | `planta-praca-2048.png` | `praca.webp` |
| Rua   | `planta-rua-2048.png`   | `rua.webp` |

As duas plantas saem do próprio jogo (`TO.diaJogo.arredores.desenharFundo`
num canvas 2048×1365, sem disco e sem HUD). Elas são a **geometria de
colisão** — cada muro, cada meio-fio e cada quiosque ali é o que o disco
esbarra dentro do jogo.

## O que não pode mudar

A imagem vira o chão da cena. Se a IA fechar uma boca de rua ou plantar
prédio em cima de calçada, o disco passa a andar por cima de parede.

- **proporção 3:2 exata** e enquadramento a prumo (nadir). Nada de perspectiva,
  nada de horizonte, nada de corte;
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
- Converta pro jogo:
  `Image.open(...).convert('RGB').save('praca.webp','WEBP',quality=82,method=6)`

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
