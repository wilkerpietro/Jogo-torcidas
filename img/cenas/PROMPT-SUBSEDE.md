# A subsede — prompt pronto pra colar

Cena nova (pedido do dono, 11/10/2026): "preciso que as nossas subsedes
também sejam atacadas tanto pelas torcidas da praça como as demais
subsedes rivais da cidade; crie uma imagem de subsede inspirada na
subsede do jogo 3D" — e, em seguida, "quero que seja um prompt de imagem,
pra eu criar a imagem da cena no Google Flow". Mesmo acabamento das
outras cenas — ortofoto de zênite, sem telhado, dia nublado, um lote
entre vizinhos. O raciocínio de cada regra está em `PROMPT-SEDE.md`;
aqui é só colar.

**Antes de colar, no Google Flow:**

- proporção **16:9** (o Flow não faz 3:2; o importador completa em cima
  e embaixo);
- anexe `img/cenas/Aerial_view_of_roofless_bar_202608131633.jpeg` como
  referência: ela carrega a projeção de zênite e o enquadramento de
  **um lote entre muitos**;
- se quiser, anexe também um print da subsede no jogo 3D (o modelo
  `subsede` de `cenario3d/js/casas3d.js`), só como referência de
  arrumação — a fachada com a porta de enrolar, o pátio, o balcão no
  fundo.

## A subsede do 3D, que é a base

O modelo do jogo 3D (pedido do dono de 02/10/2026: "uma subsede do
tamanho de uma casa comum, com dois compartimentos apenas — barzinho
embutido e pátio"; as fotos de referência foram as fachadas da Mancha em
Rio Claro e Matão, da Independente em Marília, dos Gaviões em Guarulhos
e a Independente de Sorocaba por dentro):

- **fachada na calçada**: parede de bloco pintada, porta de enrolar
  larga aberta de um lado, toldo, letreiro na platibanda;
- **o pátio coberto** (no 3D tem telhado de metal em treliça — **na
  foto da cena ele sai SEM telhado**): paredes de bloco pintado de
  branco com rodapé cinza, mesas e cadeiras de plástico brancas
  encostadas na parede, os surdos da bateria encostados na fachada, a
  TV na parede;
- **o barzinho embutido no fundo**: balcão de alvenaria com tampo de
  granito virado pro pátio, a porta do barzinho do mesmo lado da porta
  da rua, e lá dentro a prateleira de garrafas, a cervejeira e o
  freezer encostados na parede do fundo.

Na cena do 2D o lote é **maior que o da cidade 3D** (lá é uns 6 × 5 m):
a briga precisa de pátio pra uns 15 de cada lado.

## O que o jogo vai fazer com a imagem (o plano, pra não se perder)

| | |
|---|---|
| **quem está lá** | o núcleo da NOSSA subsede naquela cidade — os membros de lá, inteiros — espalhado pelo pátio e pelo barzinho |
| **a faixa** | estendida na parede do pátio. **O jogo desenha** — a foto NÃO pode ter pano, bandeira, escudo pintado nem letreiro |
| **quem ataca** | uma torcida da praça (o bonde dela) ou a subsede de uma torcida de fora que também tem filial na cidade (o núcleo dela) |
| **os caminhos** | a rua → a calçada → a porta de enrolar → o pátio → a porta do barzinho → o barzinho atrás do balcão |
| **objetivo de quem ataca** | botar o núcleo pra correr e tomar o balcão do bar |
| **objetivo de quem defende** | segurar a porta e a faixa |
| **como a cena nasce** | o aviso no feed, no molde do ataque ao bar: "Invadiram a nossa subsede de {cidade}! A {nome} tá na porta." |

## O que a máscara de colisão precisa da foto

- **piso claro, parede escura** — é o que o importador lê. Pátio de
  cimento queimado claro, barzinho de cerâmica clara; as paredes como
  faixas cinza contínuas e grossas (uns 1/60 da largura);
- **a porta de enrolar é um vão largo e aberto** na parede da frente,
  direto da calçada pro pátio — sem porta fechada, sem grade;
- **a porta do barzinho é um vão aberto** na parede do balcão. Sem ela
  ninguém chega lá dentro;
- **o meio do pátio é livre**: é onde a briga acontece. Mesa, cadeira,
  surdo e freezer só **encostados nas paredes**;
- **a rua inteira no quarto de baixo**, de ponta a ponta, com calçada —
  é por ali que o bonde de quem ataca chega;
- **sem gente, sem carro na porta, sem pano, sem letreiro, sem texto,
  sem escudo pintado** (a torcida muda de jogo pra jogo; quem pinta a
  cor dela é o jogo).

## O prompt

```
true orthographic zenith satellite orthophoto of a working-class residential street in a big city in northeast Brazil, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, the top of every object reads as a flat shape. No vertical surface is visible anywhere: no wall faces, no house facades, no table legs, no chair backs. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

THE NEIGHBORHOOD: a dense working-class block, houses built wall to wall along the street, each with its own flat fiber-cement or terracotta tile roof, a few water tanks on the roofs.
- THE LOWER QUARTER of the frame is the street, running unbroken from the left edge to the right edge: a strip of worn grey asphalt with a faded dashed center line, and above it, along the lots, a wide sidewalk of pale grey concrete slabs with a low curb. Wide open space on the sidewalk in front of the subject lot.
- LEFT AND RIGHT of the subject lot: neighboring houses glued to its side walls, keeping their roofs — one with grey corrugated fiber-cement sheets, the other with terracotta tiles.
- THE TOP of the frame: the roofs of the houses on the next street over.
- IN THE CENTER, one single lot has NO ROOF AT ALL, and that lot is the subject: the SUBSEDE of a football supporters' group, a wide one-storey building about twice as wide as the neighboring houses, its interior fully exposed from above. It occupies about half of the frame width and about half of its height, with its front wall right on the sidewalk. It is ONE LOT AMONG NEIGHBORS, with the neighbors clearly visible on both sides.

THE SUBJECT BUILDING HAS NO ROOF, while every neighboring house keeps its own roof: seen from directly above, the whole interior is exposed, its thick painted block walls read as continuous pale grey bands, and each space shows its own floor. There are ONLY TWO SPACES inside, from the sidewalk at the bottom to the back wall at the top:
- FRONT AND MIDDLE, THE PATIO, the big space: a wide covered-patio floor of pale polished burnt cement, swept clean, filling most of the lot. In the front wall, on the LEFT side, one WIDE OPEN ROLL-UP DOOR, a broad gap cut clean through the wall from the sidewalk straight into the patio, about a quarter of the front wall wide, with no door leaf and no grille. The rest of the front wall is solid. Inside the patio, pushed flat against the walls only: a row of white plastic tables with stacked white plastic chairs along the left wall near the back; three big bass drums of a samba percussion band standing against the inside of the front wall on the right; a wall-mounted TV on the right wall. The entire middle of the patio is completely clear bare floor.
- BACK, THE SMALL BUILT-IN BAR, a narrow strip along the whole back of the lot, about a fifth of the lot depth: separated from the patio by a long masonry bar counter with a dark granite top facing the patio, running along most of the width; on the LEFT end of that dividing wall, the same side as the roll-up door, one OPEN DOORWAY from the patio into the bar. Inside the bar, a floor of pale cream ceramic tiles, and pushed flat against the back wall only: a bottle shelf, an upright beer fridge and a chest freezer. The middle of the bar strip is clear.

EVERY DOORWAY IS WIDE AND OPEN: a gap cut clean through the wall, no door leaf, no frame, so that the sidewalk, the patio and the bar connect into one continuous walkable surface.

Painted concrete block walls in off-white with a grey band at the base, polished burnt cement and pale ceramic floors in light grey and cream, clearly lighter than the walls. Asphalt in worn dark grey, concrete sidewalk slabs in pale grey. Bright but diffuse daylight, thin high overcast, short soft shadows, muted natural colors, documentary satellite photography, weathered paint, stained concrete, dusty urban textures. Photorealistic, natural materials, high detail.

Absolutely no roof over the subject building and no cover of any kind over its patio or its bar, no metal roof, no trusses, no awning, no tarp — the neighboring houses DO keep their roofs. No close crop on the building, no isolated building, no building floating in a void. No wide angle lens, no fisheye, no lens distortion, no perspective, no leaning or splayed walls, no visible wall faces, no visible facades, no vertical surfaces, no furniture seen from the side, no oblique or 45 degree angle, no tilted camera. No clutter, no furniture in the middle of the patio, no closed roll-up door, no grille, no closed rooms without a doorway. No banners, no flags, no hanging cloth, no painted crests, no murals, no logos, no signs, no shop sign, no text, no labels, no numbers, no watermark, no people, no cars or motorcycles parked in front of the door. No illustration, no cartoon, no isometric, no 3d render, no blueprint look. No dark interior floors, no green ground, no HDR, no dramatic lighting, no night, no long shadows.
```

## Conferência antes de aceitar

1. Alterne com a foto do bar: só topo de tudo, nenhuma face de parede.
2. **Conte os caminhos:** rua → calçada → porta de enrolar → pátio →
   porta do barzinho → barzinho. Se uma das portas veio fechada (ou
   com grade), quem ataca não entra.
3. **O meio do pátio está livre** e é largo: é ali que uns 30 bonecos
   brigam. Mesa no meio vira parede na máscara.
4. **Piso claro, parede escura:** o pátio e o barzinho mais claros que
   o topo das paredes.
5. **A rua inteira no quarto de baixo**, de ponta a ponta, com a
   calçada larga na frente da porta.
6. **Nada escrito, nada pintado:** sem letreiro, sem escudo, sem faixa,
   sem bandeira — o jogo põe a da torcida.
7. **Zênite de verdade:** nenhuma face de muro, nenhuma fachada. Muro é
   faixa fina da mesma largura em todo canto.

Quando a imagem estiver pronta, é só mandar: ela entra no importador
(`ferramentas/importar_cena_foto.py`, receita no molde das sedes), vira a
cena `subsede` em `dados/cenas.js`, ganha a aba na bancada
(`arredores.html#subsede`) e os ataques às nossas subsedes passam a abrir
essa cena.

---

## Rodada 1 · O que saiu, e o que muda

A primeira rodada (`img/cenas/subsede_rodada1.jpg`, print do dono) acertou
a estrutura: zênite de verdade, o lote sem telhado entre vizinhos com
telhado, a rua com calçada no quarto de baixo, o pátio de cimento claro,
o balcão de granito em L e o barzinho de cerâmica atrás dele, as cadeiras
empilhadas na parede da esquerda e os surdos no canto da frente.

O dono: **"preciso que saia com mais cara de bar, com algumas mesas e
telão transmitindo um jogo"**. O pátio saiu um salão vazio.

Duas coisas novas, e o cuidado de cada uma com a máscara:

1. **As mesas.** Mesa de bar no meio do pátio vira parede na máscara —
   o bonde não passa. Então: **poucas mesas, pequenas, em duas fileiras
   encostadas nas paredes laterais**, e o **corredor do meio largo e
   livre** da porta de enrolar até o balcão. Mesa de plástico branca com
   quatro cadeiras em volta, e engradado de cerveja do lado.
2. **O telão.** De zênite, tela de TV na parede é só uma risca — não dá
   pra ver o jogo. A saída é a única licença do prompt: o **telão grande
   pendurado alto na parede do fundo, acima do balcão, INCLINADO pra
   frente e pra baixo** (como o telão de bar de esquina, virado pro
   salão), de modo que a face dele aparece de cima e mostra **um jogo de
   futebol: gramado verde, as linhas do campo e o placar no canto**. O
   resto continua só topo. Se o Flow insistir em tela de pé, peça de
   novo — o telão de cima tem de mostrar o gramado.

Fica tudo o que já estava: o lote, os vizinhos, a rua, o balcão, o
barzinho, a porta de enrolar. Ela continua sendo um vão largo aberto —
na rodada 1 ela ficou à direita do surdo, no canto de baixo; serve
assim, desde que esteja aberta.

## O prompt (rodada 2 — edição sobre a imagem da rodada 1)

**Anexe a imagem da rodada 1** (`subsede_rodada1.jpg`, ou a original do
Flow, que tem mais resolução) e cole:

```
Edit the attached aerial image. Keep the camera, the framing and everything that is already there EXACTLY as it is: the same true orthographic 90 degree zenith view with only top surfaces visible, the same roofless subsede building in the center, the same neighboring houses with their fiber-cement and terracotta roofs, the same street with the concrete sidewalk at the bottom, the same pale burnt cement patio floor, the same L-shaped masonry bar counter with the dark granite top, the same small tiled bar behind it with the fridge and the freezer against the back wall, the same open roll-up door in the front wall, the same bass drums in the front corner. Only FURNISH THE PATIO so it reads clearly as a lively neighborhood football bar of a supporters' group:

- TABLES: about eight small square white plastic bar tables, each with four white plastic chairs around it, arranged in TWO ROWS ONLY, one row along the left wall and one row along the right wall of the patio, each table close to its wall. Next to some tables, a red plastic beer crate and a few brown beer bottles on the table tops. The stack of chairs already against the left wall can stay.
- A WIDE CLEAR AISLE down the middle of the patio, from the open roll-up door at the front all the way to the bar counter at the back, at least a third of the patio width, completely empty bare floor — nothing in it, no tables, no chairs, no crates.
- THE BIG SCREEN: one large flat TV screen mounted high on the back wall, above the middle of the bar counter, TILTED FORWARD AND DOWN toward the patio like the big screen of a corner bar, so that from directly above its screen face is visible: it is showing a live football match broadcast — a bright green pitch with white field lines, tiny players, and a small scoreboard graphic in a corner of the screen. The screen glows slightly. This tilted screen is the ONLY object whose face is visible; everything else stays seen strictly from the top.
- A few small details that say "bar": a string of bare light bulbs running along the top of the side walls (seen from above as a thin line of small round bulbs), a couple of plastic cups and bottle caps on the floor near the counter.

Same bright diffuse overcast daylight, same muted natural colors, same photographic texture, seamlessly integrated, photorealistic.

Do not change the building, the walls, the neighbors, the street or the camera. No tables or chairs in the central aisle, no furniture blocking the roll-up door or the doorway into the bar. No oblique angle, no tilted camera, no perspective, no visible wall faces, no visible facades. No banners, no flags, no hanging cloth, no painted crests, no murals, no logos, no signs, no readable text, no people, no cars. No illustration, no cartoon, no 3d render, no HDR, no night, no long shadows.
```

## Conferência da rodada 2

1. **O corredor do meio está livre**, da porta de enrolar ao balcão, e
   largo (um terço do pátio, pelo menos). Mesa no corredor = parede.
2. **As mesas estão em duas fileiras, encostadas nas paredes**, e não
   espalhadas pelo salão.
3. **O telão mostra o jogo de cima** (gramado verde visível) e está na
   parede do fundo, acima do balcão.
4. **Nada mais mudou:** compare o balcão, o barzinho, a porta e os
   vizinhos com a rodada 1.
5. **A porta de enrolar e a porta do barzinho continuam abertas.**

---

## O prompt do zero (rodada 3 — pedido do dono: "refaz o prompt do zero")

Um prompt inteiro, sem anexar a rodada 1: a estrutura que deu certo nela
(zênite, lote sem telhado entre vizinhos com telhado, rua embaixo,
pátio claro, balcão de granito em L com o barzinho atrás) mais a cara de
bar que faltou (mesas nas paredes, corredor livre no meio, telão
inclinado com o jogo). Proporção 16:9; anexe só a foto do bar
(`Aerial_view_of_roofless_bar_202608131633.jpeg`) como referência de
zênite.

```
true orthographic zenith satellite orthophoto, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. Only the top surfaces of things are visible: every wall top reads as a flat even pale band, every roof as a flat plane, every table and chair as a flat shape seen from above. No wall faces, no facades, no vertical surfaces anywhere, with ONE single exception described below (the big screen).

THE PLACE: a dense working-class street in a big city in northeast Brazil, and in the middle of the block the SUBSEDE of a football supporters' group — a neighborhood football bar where the group meets to drink and watch the matches.

THE FRAME, from bottom to top:
- THE BOTTOM QUARTER is the street, running unbroken from the left edge to the right edge: worn dark grey asphalt with a faded dashed white center line, a few oil stains, and above it, along the lots, a wide sidewalk of pale grey concrete slabs with a low curb. Wide open sidewalk in front of the subsede.
- THE MIDDLE is the row of lots on the sidewalk. In the CENTER, one wide lot, about twice as wide as its neighbors, has NO ROOF AT ALL: that is the subsede, fully exposed from above. It takes about one third of the frame width and about half of the frame height, its front wall right on the sidewalk. To its LEFT and RIGHT, houses glued to its side walls keep their roofs: on one side old terracotta tiles, on the other side grey corrugated fiber-cement sheets with two round blue water tanks.
- THE TOP of the frame: the small back yards and roofs of the houses on the next street over.

INSIDE THE SUBSEDE, seen from directly above, ONLY TWO SPACES, enclosed by thick painted concrete block walls that read as continuous pale grey bands:

1. THE PATIO, the big front space, about four fifths of the lot depth: a floor of pale polished burnt cement with faint stains.
   - In the FRONT WALL, on the LEFT side, one WIDE OPEN ROLL-UP DOOR: a broad gap cut clean through the wall, about a quarter of the front wall wide, straight from the sidewalk into the patio, no door leaf, no grille.
   - FURNITURE ONLY ALONG THE TWO SIDE WALLS: on the left wall a row of four small square white plastic bar tables, and on the right wall another row of four, each table close to its wall with four white plastic chairs around it, brown beer bottles and plastic cups on the table tops, two or three red plastic beer crates on the floor beside them. In the front-right corner, three big bass drums of a samba percussion band seen from above as round drum heads.
   - A WIDE CLEAR AISLE down the middle of the patio, from the roll-up door to the bar counter, at least a third of the patio width: completely empty bare floor, nothing in it.
   - A string of bare light bulbs running along the top of both side walls, seen from above as a thin line of small round bulbs.

2. THE BAR, the narrow back strip, about one fifth of the lot depth, separated from the patio by a long L-shaped masonry bar counter with a dark granite top facing the patio; at the LEFT end of the counter, the same side as the roll-up door, an OPEN GAP in the counter to walk from the patio into the bar. Inside the bar, a floor of pale cream ceramic tiles, and pushed flat against the back wall only: a wooden bottle shelf full of bottles, a tall beer fridge and a white chest freezer.

THE BIG SCREEN, the single exception to the top-only view: one large flat TV screen hung high on the back wall, above the middle of the bar counter, TILTED STRONGLY FORWARD AND DOWN toward the patio like the big screen of a corner bar, so that from directly above its screen face is clearly visible: it is showing a live football match broadcast — a bright green pitch with white field lines, tiny players, and a small scoreboard graphic in one corner. The screen glows slightly.

Materials and light: off-white painted block walls with a grey band at the base, pale burnt cement and cream ceramic floors clearly lighter than the walls, weathered paint, stained concrete, dusty urban textures. Bright but diffuse overcast daylight, short soft shadows, muted natural colors, documentary drone photography. Photorealistic, high detail.

Absolutely no roof, no metal roof, no trusses, no awning and no tarp over the subsede — the neighboring houses DO keep their roofs. No tables, chairs or crates in the central aisle, no furniture blocking the roll-up door or the gap into the bar, no closed door, no grille. No close crop on the building, no isolated building floating in a void. No oblique or 45 degree angle, no tilted camera, no perspective, no wide angle, no fisheye, no visible wall faces, no visible facades, no leaning walls. No banners, no flags, no hanging cloth, no painted crests, no murals, no logos, no signs, no shop sign, no readable text, no watermark, no people, no cars or motorcycles in front of the door. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no HDR, no dramatic lighting, no night, no long shadows.
```

Conferência: a mesma da rodada 2 (corredor do meio livre e largo, mesas
nas paredes, telão com o gramado visível, porta de enrolar e passagem do
balcão abertas, zênite sem fachada nenhuma).
