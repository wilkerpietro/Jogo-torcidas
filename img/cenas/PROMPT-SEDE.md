# Prompts para as cinco sedes

Uma imagem por nível de sede. Alvo: o mesmo acabamento das outras cenas —
foto de drone a prumo, dia nublado, cor dessaturada, periferia brasileira.

| Cena | Nível | Planta de entrada | Saída pro jogo | Estado |
|---|---|---|---|---|
| Sede nv 1 | 1 | `docs/plantas/sede-nivel-1.jpg` | `sede_1.webp` | a fazer |
| Sede nv 2 | 2 | `docs/plantas/sede-nivel-2.png` | `sede_2.webp` | a fazer |
| Sede nv 3 | 3 | `docs/plantas/sede-nivel-3.png` | `sede_3.webp` | a fazer |
| Sede nv 4 | 4 | `docs/plantas/sede-nivel-4.jpg` | `sede_4.webp` | a fazer |
| Sede nv 5 e 6 | 5 e 6 | `docs/plantas/sede-nivel-5.jpg` | `sede_5.webp` | a fazer |

O nível 6 (o Complexo) usa a planta do 5 — decisão do dono, 10/09/2026. O que
muda no 6 é o que está aceso dentro das salas (cofre e enfermaria), e isso o
jogo desenha por cima.

## A regra que manda em tudo: SEM TELHADO

A sede é cena de dentro. Vista a prumo, prédio com telhado é telhado — não
tem cena. O precedente já existe e funciona:
`Aerial_view_of_roofless_bar_202608131633.jpeg`, o bar da rival, é um
**roofless building**, e é por isso que a briga termina dentro do salão.

Então toda sede é um **quarteirão murado sem cobertura**, visto de 90°, com as
paredes aparecendo de cima como faixas grossas e o piso de cada sala à mostra.

## O que não pode mudar

A imagem vira o chão da cena, e a máscara de colisão sai da própria foto por
cor e conectividade (`ferramentas/importar_cena_foto.py`). Se a IA fechar uma
porta ou escurecer um piso, o disco passa a andar por cima de parede — ou não
anda.

- **enquadramento a prumo** (nadir, 90°). Nada de perspectiva, nada de
  horizonte, nada de sombra comprida de prédio;
- **piso claro, parede escura.** É esse contraste que o importador lê. Piso de
  cimento queimado, ladrilho, cerâmica: claro. Parede: faixa escura e contínua;
- **porta é vão de verdade na parede**, não porta desenhada fechada. O piso das
  salas tem de ser uma mancha contínua, ligada de sala em sala pelos vãos —
  é isso que faz o invasor andar. Vão fechado é bug;
- **parede grossa**: pelo menos 1/60 da largura do quadro (uns 45 px numa
  imagem de 2752). Parede fina some na célula de 8 px da máscara;
- as salas ficam **no lugar e no tamanho da planta**, e o portão da rua fica na
  parede que a planta manda;
- o muro externo fecha o quarteirão dos quatro lados, com uma faixa de rua ou
  de calçada aparecendo só do lado do portão;
- **nada de gente na imagem**: o povo são os bonecos 3D, desenhados por cima;
- nada de texto, placa, número de sala ou marca d'água.

## Formato do arquivo

- **3:2 é o ideal** — a tela da cena é 1536 × 1024. Peça 2304 × 1536 ou
  3072 × 2048 e a sede ocupa a tela inteira.
- 16:9 também serve (as fotos de hoje vieram 2752 × 1536): o importador encaixa
  a largura inteira e completa em cima e embaixo com uma faixa de terra. Só
  perde área útil, não quebra nada.
- Nunca 4:3 nem 1:1 — mais alta que a tela o importador **corta** em cima e
  embaixo, e leva parede junto.
- Guarde o original em PNG ou JPEG grande em `img/cenas/`, e o jogo carrega o
  `.webp`:
  `Image.open(...).convert('RGB').save('img/cenas/sede_1.webp','WEBP',quality=82,method=6)`

## Como rodar

Se a ferramenta aceitar imagem de referência (é o caso), **anexe a planta**:

- **img2img** com *denoising strength* entre **0,35 e 0,50**. Acima de 0,55 o
  modelo redesenha as paredes e a planta se perde.
- Melhor ainda: **ControlNet Canny ou Lineart, peso 0,9–1,1**, com a planta como
  guia — aí dá pra subir o denoise sem perder sala.
- Se for só prompt + anexo, sem controle de peso, o texto abaixo já descreve a
  disposição sala por sala; a planta serve de conferência.
- Duas passadas: uma pro traçado, outra de *upscale* 2× (denoise 0,2) só pra
  textura.

---

## Prompt base (vale pras cinco)

Cole isto e emende, no fim, o bloco do nível.

```
top-down nadir aerial drone photograph of a roofless walled compound in a
Brazilian working-class neighborhood, shot straight down at exactly 90 degrees,
orthographic feel, no perspective, no horizon,

the building has NO ROOF: seen from directly above, the interior rooms are fully
exposed, thick painted masonry walls read as continuous light-grey bands, each
room shows its own floor,

polished cement and worn ceramic tile floors in pale grey and cream, clearly
lighter than the walls, wide open doorways cut through the interior walls so the
floors connect from room to room,

overcast diffuse daylight, soft shadows, desaturated muted colors, documentary
photography, sun-bleached concrete, weathered paint, damp stains at the base of
the walls, tropical northeast Brazil,

an outer perimeter wall closes the compound on all four sides, a strip of
cracked asphalt street and painted curb runs along one edge with the main gate,
photorealistic, natural materials, 8k detail, no people visible
```

## Bloco por nível — emende no fim do prompt base

### Nível 1 — o galpão

```
SMALL COMPOUND, THREE SPACES ONLY: the left half is an open concrete yard with
a cracked slab floor, a drain, a plastic water tank and stacked crates; the
right half is split into two roofed-off rooms of equal width — the upper one an
office with a wooden desk, metal filing cabinets and a sagging couch, the lower
one a storeroom with rolled banners, folded flags on shelves and a stack of
drums; a wide gate opening in the bottom wall of the yard leads to the street.
```

### Nível 2 — a casa

```
SIX SPACES: across the top, three rooms side by side — left an office with desk
and filing cabinets, center a workshop with long trestle tables, paint cans,
rolls of fabric and stencils, right a storeroom with rolled banners and flags on
shelves; below them a wide open concrete yard running the full width; in the
bottom-left corner a narrow bar room with a tiled counter, stools and beer
crates; in the bottom-right corner a training room with punching bags and a mat;
a gate opening in the bottom wall of the yard.
```

### Nível 3 — o sobrado

```
TEN SPACES: top-left two stacked small rooms — upper an office with a desk,
lower a planning room with a corkboard wall, radios and a big table; top-center
a wide empty hall of bare polished cement, a circulation corridor with nothing in
it; down the right side a column of four rooms — bunk beds, then a storeroom of
rolled banners and flags, then a small workshop with paint and fabric, then a
shop with clothing racks and a counter; across the bottom an open concrete yard
with a narrow bar in the bottom-left corner and a training room with punching
bags and a mat at bottom-center-right; a gate opening in the bottom wall.
```

### Nível 4 — o clube

```
ELEVEN SPACES: top-left two stacked small rooms, an office above a planning room
with corkboard and radios; a narrow vertical corridor of bare cement beside them;
across the top three rooms — a storeroom of rolled banners and flags, a workshop
with trestle tables and paint, and a dormitory with bunk beds; bottom-left an
open concrete yard with a narrow bar along the outer wall; bottom-center a
training room with punching bags and a mat; bottom-center-right a large vehicle
garage with an old intercity bus parked inside and a wide roll-up door to the
street; bottom-right a shop with clothing racks, a counter and its own door to
the street; a gate opening in the bottom wall of the yard.
```

### Nível 5 e 6 — o complexo

```
WIDE COMPOUND, ELEVEN SPACES: top-left two stacked small rooms, an office above
an administration room with desks, filing cabinets and a corkboard wall; across
the top three large rooms — a storeroom of rolled banners and flags, a small
factory with rows of sewing machines and screen-printing tables, and a lodging
wing with rows of single beds; a long horizontal corridor of bare polished cement
runs the full width beneath them, empty; along the bottom a row of five spaces —
a narrow bar with a tiled counter, a small concrete yard, a gym with mats,
punching bags and weight racks, a shop with clothing racks and a counter, and a
garage with two buses; the shop and the garage each have their own door to the
street; a gate opening in the bottom wall of the yard.
```

## Negative prompt (vale pras cinco)

```
roof, roofed building, terracotta tiles, corrugated metal roof, rooftop,
illustration, cartoon, isometric, 3d render, video game asset, painting,
floor plan, blueprint, diagram, map icons, labels, text, numbers, watermark,
tilted perspective, oblique angle, bird's eye at 45 degrees, fisheye, vignette,
people, crowd, players, characters,
dark floors, black interiors, closed doors, walls without openings,
saturated colors, hdr, dramatic lighting, night, sunset, long shadows,
skyscrapers, european architecture, suburban american houses, snow
```

## Conferência antes de aceitar

1. **Tem telhado?** Se alguma sala estiver coberta, refaça. Cobertura mata a
   cena.
2. **Dá pra andar de sala em sala?** Siga o piso com o olho, do portão até a
   sala mais funda. Se em algum ponto a parede fecha, o invasor não passa.
3. **Piso mais claro que parede em toda sala?** Sala de piso escuro vira parede
   na máscara e some do jogo.
4. **Tem gente ou texto?** Não pode ter nenhum dos dois.
5. **É a prumo mesmo?** Se der pra ver a lateral de uma parede, o ângulo está
   torto e os bonecos vão flutuar.

## Depois que a imagem estiver boa

Ponha o arquivo em `img/cenas/` e me mande — a entrada em `FONTES` do
`importar_cena_foto.py` precisa de uma **semente por sala** (o ponto, em fração
da tela, de onde a conectividade abre), e o piso de sala tem tom parecido com o
de laje, então o recorte quase sempre precisa de acerto. Depois disso a máscara
sai da foto e a cena é conferida com `ferramentas/prova_mascara.py`.
