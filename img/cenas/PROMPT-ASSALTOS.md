# As seis lojas do assalto — prompts prontos pra colar

Cenas novas (pedido do dono, 10/10/2026: "criar os cenários de assalto
agora, similares a como funciona no 3d, cada uma num nível de
dificuldade" — e "os bonecos têm que ser os nossos bonecos"). Uma foto
por alvo, do mais fácil ao mais difícil:

| Nível | Alvo | Saída pro jogo | Estado |
|---|---|---|---|
| 1 | Loja de roupas | `assalto_roupas.webp` | prompt pronto |
| 2 | Mercadinho | `assalto_mercadinho.webp` | prompt pronto |
| 3 | Posto de gasolina | `assalto_posto.webp` | prompt pronto |
| 4 | Supermercado | `assalto_supermercado.webp` | prompt pronto |
| 5 | Joalheria | `assalto_joalheria.webp` | prompt pronto |
| 6 | Banco | `assalto_banco.webp` | prompt pronto |

Mesmo acabamento das outras cenas: ortofoto de zênite a 90°, prédio do
alvo **sem telhado**, os vizinhos **com** telhado, dia nublado, cor
dessaturada, um lote entre muitos. O porquê de cada regra está em
`PROMPT-SEDE.md` e `PROMPT-CASA-PISCINA.md`; aqui é só colar.

**Antes de colar, no Google Flow:**

- proporção **16:9** (o Flow não faz 3:2; o importador completa em cima
  e embaixo);
- anexe `img/cenas/Aerial_view_of_roofless_bar_202608131633.jpeg` como
  referência: é ela que carrega a projeção de zênite e o **prédio sem
  telhado** com as salas à mostra;
- gere **uma loja por vez**; o bloco comum (projeção, vizinhança, luz e
  negativa) já está repetido dentro de cada prompt.

## O que o jogo vai fazer com a imagem (o plano, pra não se perder)

| | |
|---|---|
| **o motor** | o do assalto do jogo 3D (`js/diajogo/assalto_motor.js`): exposição, suspeita, alerta, a ligação pro 190, a PM chegando, o saque segurado no E, a fuga pro carro |
| **quem está lá** | os **nossos bonecos** (os mesmos das brigas, `bonecos3`): a equipe de roupa escura, os funcionários de uniforme, os clientes, quem passa na calçada, a PM. A foto **não pode ter gente nenhuma** |
| **as marcas da cena** (F2) | o carro da fuga, os olheiros, a porta, os pontos de saque (caixa, vitrine, cofre…), os postos de quem trabalha, as câmeras com o rumo, os botões do alarme, o gravador, os pontos de cliente, por onde a PM chega e por onde o povo passa |
| **a dificuldade** | o perfil de cada alvo (`PERFIL_ASSALTO`) e a planta: mais segurança, mais câmera, mais gente olhando, o cofre que pede dois ou três da equipe juntos |
| **o carro da fuga** | uma van escura parada no meio-fio da rua da frente, à esquerda da loja. **Ela vem na foto** (é o único carro no asfalto) |
| **a esquina** | toda loja fica na esquina: a rua da frente embaixo e uma rua de lado à DIREITA. É por ela que sai a porta dos fundos e que a PM também chega |

## O que a máscara de colisão precisa da foto

- **piso claro, parede escura** — é o que o importador lê. Piso de
  cerâmica ou porcelanato claro; as paredes como faixas cinza
  contínuas, grossas (1/60 da largura, uns 45 px), vistas de cima;
- **balcão, gôndola, prateleira e cofre mais escuros que o piso**: eles
  barram o corpo. Vitrine de vidro sai clara e o importador lê como
  chão — essa a gente fecha no F2, à mão;
- **o salão de cliente com o meio livre**: é por ali que a equipe anda
  fingindo que compra. Móvel solto no meio do salão vira parede;
- **toda porta é um vão largo e aberto**, sem folha (a giratória do
  banco é um vão de 1,8 m). Vidro da fachada é parede: a frente é uma
  faixa azul-acinzentada de vidro com o vão da porta;
- **a calçada e o asfalto à mostra**, largos, na frente e do lado
  direito: é onde ficam os olheiros, o povo que passa e a van;
- **sem gente, sem texto, sem letreiro, sem logotipo**: o nome da loja
  o jogo escreve; letra na foto vira mancha na máscara.

---

## Nível 1 · Loja de roupas

Lote estreito (≈ 8 m de frente por 7,5 m de fundo), numa fileira de
lojinhas de rua comercial de bairro.

```
true orthographic zenith satellite orthophoto of a small Brazilian neighborhood shopping street corner, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, every object reads as a flat top-down shape. No vertical surface is visible anywhere: no wall faces, no shop facades, no shelf fronts. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

THE FRAME: the LOWER QUARTER is a two-lane asphalt street running unbroken from the left edge to the right edge, with a dashed yellow center line and a wide pale concrete sidewalk between the street and the shops. On the RIGHT THIRD, a side street of asphalt with its own sidewalk runs from the top edge down to the front street, forming a street corner. A dark grey passenger van is parked at the curb of the front street, to the LEFT of the subject shop; it is the only vehicle on the asphalt. The rest of the frame is a dense row of small two-story shops and houses with terracotta and grey fibre-cement roofs, wall to wall.

THE SUBJECT: the corner lot, on the left of the side street, is a small CLOTHING BOUTIQUE that has NO ROOF AT ALL, while every neighbouring building keeps its roof. Seen from directly above, its single interior room is fully exposed, about as wide as it is deep. Its thick masonry side and back walls read as continuous pale grey bands. Its whole front wall, facing the front street, is a shop window of glass that reads as a thin bluish-grey band, with ONE wide open doorway at its RIGHT end.
INSIDE, a bright pale porcelain tile floor: just behind the glass, a narrow low window display platform along the front with three white mannequins seen from above; in the middle of the room, two short clothing racks with folded garments seen from above, with clear floor all around them; along the LEFT wall, one tall wall shelf of folded clothes; in the BACK-LEFT corner, a small fitting room box with an open curtain gap; in the BACK-RIGHT corner, a cashier counter of white laminate parallel to the back wall, with clear floor in front of it and a narrow space behind it. The center of the room is clear bare floor.

Pale porcelain floor clearly lighter than the walls and the furniture. Overcast daylight, soft shadows, desaturated natural colors, documentary satellite photography, weathered paint, slightly dirty sidewalk. Photorealistic, natural materials, high detail.

Absolutely no roof and no cover over the subject shop, the neighbours DO keep their roofs. No people, no text, no letters, no signboard, no logo, no posters, no watermark. No perspective, no oblique or 45 degree angle, no visible facades, no leaning walls, no fisheye. No furniture in the middle of the room except the two clothing racks, no clutter on the floor. No other cars on the street, no isolated building floating in a void. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no night, no HDR, no long shadows.
```

## Nível 2 · Mercadinho

Lote de esquina pequeno (≈ 7,4 × 7,5 m), o mercadinho de bairro de
porta de enrolar.

```
true orthographic zenith satellite orthophoto of a street corner in a working-class Brazilian neighborhood, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, every object reads as a flat top-down shape. No vertical surface is visible anywhere: no wall faces, no shop facades, no shelf fronts. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

THE FRAME: the LOWER QUARTER is a two-lane asphalt street running unbroken from the left edge to the right edge, worn asphalt with a faded dashed center line and a pale concrete sidewalk between the street and the buildings. On the RIGHT THIRD, a narrower side street of asphalt with its own sidewalk runs from the top edge down to the front street, forming a street corner. A dark grey passenger van is parked at the curb of the front street, to the LEFT of the subject shop; it is the only vehicle on the asphalt. The rest of the frame is a dense block of small self-built houses with grey fibre-cement and terracotta roofs, wall to wall, water tanks on some roofs.

THE SUBJECT: the corner lot, on the left of the side street, is a small CORNER GROCERY STORE (mercadinho) that has NO ROOF AT ALL, while every neighbouring building keeps its roof. Seen from directly above, its single interior room is fully exposed, almost square. Its thick masonry walls read as continuous pale grey bands. The front wall, facing the front street, has TWO wide open doorways (roll-up shutter doors fully raised, so they read as clean gaps); the RIGHT side wall, facing the side street, has ONE wide open doorway near the back corner.
INSIDE, a pale grey ceramic tile floor: along the LEFT side, an L-shaped wooden shop counter running front to back with a narrow aisle between it and the left wall, where the owner stands; along the LEFT wall behind the counter and along the BACK wall, tall wall shelves stacked with groceries; in the middle of the room, one single low island shelf, front to back, with clear aisles on both sides; along the RIGHT wall, a row of drink refrigerators with white tops; in the BACK-RIGHT corner, a tiny storeroom area with a small dark steel safe on the floor against the back wall. The aisles and the front area are clear bare floor.

Pale floor clearly lighter than the walls, the counter and the shelves. Overcast daylight, soft shadows, desaturated natural colors, documentary satellite photography, weathered paint, cracked sidewalk. Photorealistic, natural materials, high detail.

Absolutely no roof and no cover over the subject store, the neighbours DO keep their roofs. No people, no text, no letters, no signboard, no logo, no posters, no watermark. No perspective, no oblique or 45 degree angle, no visible facades, no leaning walls, no fisheye. No boxes or crates on the floor, no clutter in the aisles. No other cars on the street, no isolated building floating in a void. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no night, no HDR, no long shadows.
```

## Nível 3 · Posto de gasolina

Lote inteiro de esquina (≈ 16 × 14 m): a pista aberta na frente, com
as duas ilhas de bomba, e a loja de conveniência no fundo. A cobertura
da pista **sai** (é o "sem telhado" desta cena): ficam só as quatro
colunas, pra se ver as bombas e quem anda por baixo.

```
true orthographic zenith satellite orthophoto of a gas station on a street corner of a Brazilian city neighborhood, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, every object reads as a flat top-down shape. No vertical surface is visible anywhere: no wall faces, no facades, no pump sides. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

THE FRAME: the LOWER FIFTH is a wide two-lane asphalt avenue running unbroken from the left edge to the right edge, with a dashed yellow center line and a pale concrete sidewalk. On the RIGHT side, a side street of asphalt with its own sidewalk runs from the top edge down to the avenue, forming a corner. A dark grey passenger van is parked at the curb of the avenue, to the LEFT of the gas station; it is the only vehicle in the whole frame. The rest of the frame is a dense urban block of two- and three-story buildings with flat grey roofs and terracotta roofs, wall to wall.

THE SUBJECT: the corner lot, on the left of the side street, is a GAS STATION. THE FORECOURT CANOPY HAS BEEN REMOVED: only its four slim square columns remain, so the whole forecourt is fully visible from above. The front half of the lot is an open forecourt of pale grey concrete slabs, open to the avenue along its whole width, with TWO narrow fuel pump islands parallel to each other, front to back, each a raised concrete strip with two pumps seen from above, with wide clear driving lanes around them. A tall thin price pylon stands at the front-right corner of the lot.
THE BACK HALF of the lot is a CONVENIENCE STORE that has NO ROOF AT ALL, while every neighbouring building keeps its roof. It spans the lot from the left wall to about three quarters of the width; the back-right corner of the lot stays open concrete (the air and water corner). The store's front wall, facing the forecourt, is glass that reads as a thin bluish-grey band, with ONE wide open doorway in the middle. INSIDE, a bright pale tile floor: a cashier counter near the RIGHT end, parallel to the front, with clear floor in front of it; two low snack shelves in the middle, front to back, with clear aisles around them; a row of drink refrigerators against the back wall on the LEFT. Behind the store, a narrow stockroom across the whole store width, separated by a wall with ONE open doorway at its left end, with a small dark steel safe on the floor in its left corner. Thick masonry walls read as continuous pale grey bands.

Pale concrete and pale tile floors clearly lighter than the walls and the shelves. Overcast daylight, soft shadows, desaturated natural colors, documentary satellite photography, oil stains on the forecourt, weathered paint. Photorealistic, natural materials, high detail.

Absolutely no canopy roof over the forecourt and no roof over the store, the neighbours DO keep their roofs. No cars at the pumps, no cars on the forecourt. No people, no text, no letters, no brand logo, no price numbers, no signboard, no watermark. No perspective, no oblique or 45 degree angle, no visible facades, no leaning walls, no fisheye. No clutter in the store aisles. No isolated building floating in a void. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no night, no HDR, no long shadows.
```

## Nível 4 · Supermercado

Lote inteiro de esquina, o maior depois do banco (≈ 16,4 × 16 m): os
três caixas na frente, as gôndolas altas (a sombra do furtivo), o
estoque e a gerência no fundo.

```
true orthographic zenith satellite orthophoto of a neighborhood supermarket on a street corner of a Brazilian city, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, every object reads as a flat top-down shape. No vertical surface is visible anywhere: no wall faces, no facades, no shelf fronts. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

THE FRAME: the LOWER FIFTH is a two-lane asphalt street running unbroken from the left edge to the right edge, with a dashed yellow center line and a wide pale concrete sidewalk. On the RIGHT side, a side street of asphalt with its own sidewalk runs from the top edge down to the front street, forming a corner. A dark grey passenger van is parked at the curb of the front street, to the LEFT of the supermarket; it is the only vehicle in the frame. The rest of the frame is a dense urban block of two- and three-story buildings with grey and terracotta roofs, wall to wall.

THE SUBJECT: the corner lot, on the left of the side street, is a SUPERMARKET that has NO ROOF AT ALL, while every neighbouring building keeps its roof. Seen from directly above, the whole interior is fully exposed, almost square. Thick masonry walls read as continuous pale grey bands. The front wall, facing the front street, is glass that reads as a thin bluish-grey band, with TWO wide open doorways, one at the left quarter and one at the right quarter.
INSIDE, a bright pale grey porcelain floor, in three bands from front to back:
- FRONT BAND: three checkout counters in a row, each a narrow dark grey conveyor counter running front to back, with clear floor between them and a wide clear strip between the checkouts and the glass.
- MIDDLE BAND, the sales floor: FOUR long TALL gondola shelves running front to back, parallel, stacked with colorful products, with wide clear aisles between them and a clear cross aisle in front of and behind them; along the LEFT wall, a long row of refrigerated display cases with white tops.
- BACK BAND, about a fifth of the depth: a wall across the whole width with TWO open doorways, one on the left and one on the right. Behind it on the left and center, a stockroom with a row of stacked cardboard boxes pushed against the back wall; behind it on the right, separated by a short wall, a small manager's office with a desk and a dark steel safe against the back wall. The RIGHT side wall, facing the side street, has ONE wide open loading door in the stockroom.

Pale porcelain floor clearly lighter than the walls, the gondolas and the checkouts. Overcast daylight, soft shadows, desaturated natural colors, documentary satellite photography, weathered paint. Photorealistic, natural materials, high detail.

Absolutely no roof and no cover over the supermarket, the neighbours DO keep their roofs. No people, no shopping carts, no text, no letters, no signboard, no logo, no price tags, no watermark. No perspective, no oblique or 45 degree angle, no visible facades, no leaning walls, no fisheye. No pallets or boxes in the aisles, no clutter on the floor. No other cars, no isolated building floating in a void. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no night, no HDR, no long shadows.
```

## Nível 5 · Joalheria

Lote estreito e fundo (≈ 8,6 × 12 m), loja de rua de centro comercial:
as vitrines de vidro em U, o caixa no fundo do salão, e atrás a porta
restrita pro escritório (o cofre) e a oficina.

```
true orthographic zenith satellite orthophoto of a jewelry store on a street corner in the commercial downtown of a Brazilian city, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, every object reads as a flat top-down shape. No vertical surface is visible anywhere: no wall faces, no facades, no display case fronts. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

THE FRAME: the LOWER QUARTER is a two-lane asphalt street running unbroken from the left edge to the right edge, with a dashed yellow center line and a wide pale stone sidewalk with Portuguese pavement. On the RIGHT side, a side street of asphalt with its own sidewalk runs from the top edge down to the front street, forming a corner. A dark grey passenger van is parked at the curb of the front street, to the LEFT of the jewelry store; it is the only vehicle in the frame. The rest of the frame is a dense downtown block of old three- and four-story commercial buildings with flat grey roofs and terracotta roofs, wall to wall.

THE SUBJECT: the corner lot, on the left of the side street, is a narrow and deep JEWELRY STORE that has NO ROOF AT ALL, while every neighbouring building keeps its roof. Seen from directly above, its whole interior is fully exposed. Thick masonry walls read as continuous dark grey bands. The front wall, facing the front street, is glass that reads as a thin bluish-grey band, with ONE open doorway in the middle; just behind the glass, on each side of the doorway, a low window display platform.
INSIDE, from front to back:
- THE SALES ROOM, the front half, a bright cream marble floor: two long glass display counters, one along the left side and one along the right side, each set about one meter in from its wall so a sales clerk can stand behind it, forming a U open toward the door; the glass tops show trays of jewelry seen from above. Across the back of the sales room, a dark wooden cashier counter from wall to wall with a narrow gap at its RIGHT end. The center of the sales room is clear bare floor.
- THE BACK, behind a solid wall across the whole width with ONE open doorway at its RIGHT end: two rooms side by side, separated by a short wall with an open doorway. On the LEFT, a small office with a desk and a dark steel safe on the floor in the back-left corner. On the RIGHT, a small workshop with a jeweler's workbench against the back wall. The RIGHT side wall of the workshop, facing the side street, has ONE open doorway to the side street.

Pale marble and tile floors clearly lighter than the walls and the counters. Overcast daylight, soft shadows, desaturated natural colors, documentary satellite photography, weathered downtown buildings. Photorealistic, natural materials, high detail.

Absolutely no roof and no cover over the jewelry store, the neighbours DO keep their roofs. No people, no text, no letters, no signboard, no logo, no watermark. No perspective, no oblique or 45 degree angle, no visible facades, no leaning walls, no fisheye. No furniture in the middle of the sales room, no clutter. No other cars, no isolated building floating in a void. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no night, no HDR, no long shadows.
```

## Nível 6 · Banco

Lote inteiro de esquina (≈ 14,2 × 14 m), a agência: fachada de vidro
com a porta giratória, os caixas eletrônicos, a fila, os três guichês
atrás do vidro blindado, e atrás a gerência e a sala do cofre-forte.

```
true orthographic zenith satellite orthophoto of a bank branch on a street corner of a Brazilian city, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, every object reads as a flat top-down shape. No vertical surface is visible anywhere: no wall faces, no facades, no counter fronts. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

THE FRAME: the LOWER FIFTH is a wide two-lane asphalt avenue running unbroken from the left edge to the right edge, with a dashed yellow center line and a wide pale concrete sidewalk. On the RIGHT side, a side street of asphalt with its own sidewalk runs from the top edge down to the avenue, forming a corner. A dark grey passenger van is parked at the curb of the avenue, to the LEFT of the bank; it is the only vehicle in the frame. The rest of the frame is a dense urban block of three- and four-story buildings with flat grey roofs, wall to wall.

THE SUBJECT: the corner lot, on the left of the side street, is a BANK BRANCH that has NO ROOF AT ALL, while every neighbouring building keeps its roof. Seen from directly above, its whole interior is fully exposed, almost square. Thick masonry walls read as continuous pale grey bands. The front wall, facing the avenue, is glass from end to end that reads as a thin bluish-grey band, with ONE wide open doorway in the middle where the revolving door was removed.
INSIDE, from front to back:
- THE CUSTOMER HALL, the front half, a bright pale granite floor: in the front-LEFT corner, three automated teller machines in a row against the left wall, dark blue tops; in the middle of the hall, four slim queue posts in a straight line across; in the front-RIGHT area, two short rows of grey waiting benches parallel to the front. The rest of the hall is clear bare floor.
- THE TELLER LINE, across the middle of the building: a long counter from the left wall to near the right wall, with a strip of thick bulletproof glass on top that reads as a bluish band, and three teller stations behind it; at its RIGHT end, a short solid wall with ONE narrow open service doorway.
- BEHIND THE TELLERS: a corridor across the whole width, with an emergency exit doorway in the RIGHT side wall opening to the side street. Behind the corridor, a wall with TWO open doorways leading to two rooms side by side, separated by a wall. On the LEFT, the manager's office with a wooden desk and a tall cabinet against the left wall. On the RIGHT, the vault room, with a large dark steel vault door, round, against the back wall, and the floor in front of it clear.

Pale granite and tile floors clearly lighter than the walls and the counters. Overcast daylight, soft shadows, desaturated natural colors, documentary satellite photography, clean modern finish. Photorealistic, natural materials, high detail.

Absolutely no roof and no cover over the bank, the neighbours DO keep their roofs. No people, no text, no letters, no bank logo, no signboard, no watermark. No perspective, no oblique or 45 degree angle, no visible facades, no leaning walls, no fisheye. No furniture in the middle of the customer hall besides the queue posts, no clutter. No other cars, no isolated building floating in a void. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no night, no HDR, no long shadows.
```

## Negativa (pra quem tem o campo separado)

```
people, crowd, person, shopping cart, text, letters, numbers, signboard, logo, brand, watermark, roof over the subject building, canopy, awning, perspective, oblique angle, 45 degree, isometric, 3d render, cartoon, illustration, blueprint, fisheye, leaning walls, visible facades, clutter on the floor, furniture in the middle of the room, extra cars, cars inside the lot, night, HDR, long shadows
```

## Depois da imagem

1. salvar como `img/cenas/assalto_<alvo>.jpg` (mestre) e rodar o
   importador (`python3 ferramentas/importar_cena_foto.py`) com a
   receita `assalto-<alvo>` — semente no salão de cliente e na calçada,
   paredes e vidro como `excluir`, os vãos das portas como `abrir`;
2. abrir `arredores.html#assalto-<alvo>`, apertar **F2** e acertar a
   máscara (as vitrines de vidro fechadas à mão) e as marcas: a van
   (`carro`), os dois olheiros (esquina e calçada), a porta e a saída
   pra rua, os pontos de saque com o rótulo, os postos de quem trabalha
   e do segurança (com a ronda), as câmeras com o rumo, os botões do
   alarme, o gravador, os pontos de cliente, a chegada da PM (as duas
   pontas da avenida e o fim da rua de lado) e os pontos da calçada;
3. colar a exportação em `dados/cenas_editadas.js`, como nas outras.
