# A casa com piscina — prompt pronto pra colar

Cena nova (pedido do dono, 21/09/2026): a resenha da outra torcida numa
casa com piscina, com a faixa dela estendida no muro do fundo. Mesmo
acabamento das outras cenas — ortofoto de zênite, sem telhado, dia
nublado, quarteirão inteiro no quadro. O raciocínio de cada regra está
em `PROMPT-SEDE.md`; aqui é só colar.

**Antes de colar, no Google Flow:**

- proporção **16:9** (o Flow não faz 3:2; o importador completa em cima
  e embaixo);
- anexe `img/cenas/Aerial_view_of_roofless_bar_202608131633.jpeg` como
  referência. Ela carrega as duas coisas que mais erram: a projeção de
  zênite e o enquadramento de **um lote entre muitos**.

## O que o jogo vai fazer com a imagem (o plano, pra não se perder)

| | |
|---|---|
| **quem está lá** | os membros de UMA zona da torcida atacada, integral, teto de 20 — 80% espalhados pelo deck em volta da piscina, 20% dentro da casa |
| **a faixa** | estendida no muro do fundo, na área do deck. **O jogo desenha** — a foto NÃO pode ter pano nenhum |
| **o defensor** | um membro pega a faixa, corre pra dentro da casa e se tranca num compartimento pequeno |
| **o atacante** | entra pelo portão da frente; membros da zona dele, integral, teto de 20 |
| **os caminhos** | portão → garagem na frente → porta da frente pra dentro da casa; corredor aberto do lado ESQUERDO da casa, da frente até o deck do fundo; uma porta do corredor pra dentro da casa; uma porta de dentro da casa pro deck |
| **objetivo do atacante** | botar todo mundo pra correr da casa e pegar a faixa |
| **objetivo do atacado** | defender a faixa e botar o atacante pra correr |
| **como a cena nasce** | mensagem no feed, no molde da sugestão de ataque ao bar: *"Chefe, vimos nas redes sociais que a Zona Sul da Cearamor tá fazendo uma resenha deles numa casa com piscina e a faixa deles tá estendida lá, a gente quer dar o bote neles e tomar a faixa."* E a gente também pode ser atacado na nossa resenha |
| **frequência** | o ataque/defesa de bar cai **50%** pra dar espaço à casa |

## O que a máscara de colisão precisa da foto

- **piso claro, parede escura** — é o que o importador lê. Deck de
  cimento claro, piso de cerâmica clara dentro da casa; paredes como
  faixas cinza contínuas, grossas (1/60 da largura, uns 45 px);
- **água bem azul, saturada.** O importador exclui água por cor
  (`~agua` em `chao()`), então a piscina sai da malha sozinha — desde
  que seja azul de piscina e não cinza-esverdeado;
- **o deck contorna a piscina pelos quatro lados**, largo: é ali que 16
  bonecos ficam e que a briga acontece. Deck estreito engarrafa;
- **o muro do fundo tem um trecho longo e liso**, sem nada encostado:
  é onde o jogo pendura a faixa;
- **o compartimento** é uma sala pequena com UMA porta, dentro da casa.
  Sem porta o atacante nunca chega; porta larga demais não é abrigo;
- **nada de guarda-sol, nada de espreguiçadeira no meio do deck**: vira
  parede na máscara. Móvel só encostado no muro;
- **sem gente, sem boia na água, sem pano no muro, sem texto.**

---

## O prompt

```
true orthographic zenith satellite orthophoto of AN ENTIRE CITY BLOCK in a middle-class neighborhood of northeast Brazil, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, the top of every object reads as a flat shape. No vertical surface is visible anywhere: no wall faces, no house facades, no table legs, no chair backs. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

FRAME THE WHOLE BLOCK, NOT ONE HOUSE. This is the single most important instruction, and the frame is filled edge to edge with the neighborhood:
- LEFT AND RIGHT of the frame: ordinary neighboring houses packed wall to wall, seen from straight above. Terracotta tile roofs, flat concrete roof slabs carrying blue plastic water tanks and satellite dishes, small back yards, party walls between the lots. They run all the way out to the left and right edges of the image.
- THE LOWER QUARTER of the frame is a wide asphalt street running unbroken from the left edge to the right edge, with a faded yellow center line and a paved sidewalk with a white painted curb on both sides. The street is wide and open and has real room in the frame.
- THE TOP of the frame: the back yards and roof slabs of the houses on the next street over.
- IN THE MIDDLE OF THE BLOCK, one single lot has NO ROOF AT ALL, and that lot is the subject: a walled house with a swimming pool, its interior fully exposed from above. It occupies about half of the frame width and three fifths of its height — it is ONE LOT AMONG MANY, not the whole picture.
Match the reference photo of the roofless bar exactly in this respect: a roofless lot sitting in the middle of a full block of roofed houses, sidewalks and street.

THE HOUSE HAS NO ROOF, while every neighboring house keeps its own roof: seen from directly above, every room of the house is fully exposed, its thick masonry walls read as continuous pale grey bands, and each room shows its own floor.

LAYOUT OF THE LOT, FROM THE STREET AT THE BOTTOM TO THE BACK WALL AT THE TOP.
- FRONT, along the street: a wide open gate in the front wall with its leaf folded flat against the inside. Just inside the gate, on the right, an open carport with a bare concrete floor and no car in it. From the carport, one wide open front doorway leads straight into the house.
- LEFT SIDE: a narrow open-air side passage of plain concrete running along the entire left edge of the lot, from the front gate all the way to the pool deck at the back, with a wide open doorway in its right wall halfway along, leading into the house.
- MIDDLE: the interior of the house, fully exposed. A large living room of pale ceramic tile with a sofa pushed flat against one wall and nothing else, and beside it a kitchen with a counter along its wall and nothing else. In one corner of the interior, one SMALL closed room with a single narrow open doorway, a storeroom with an empty shelf on its far wall, clearly separate from the rest. From the living room, one wide open doorway leads out to the pool deck at the back.
- BACK, the upper part of the lot: a rectangular swimming pool of deep saturated turquoise-blue water, surrounded on ALL FOUR SIDES by a wide open deck of pale grey concrete, the deck clearly lighter than the walls and wide enough to walk around the whole pool. Against the LEFT wall of the deck, a brick barbecue and a stack of white plastic chairs pushed flat against the wall; against the RIGHT wall, one plastic table pushed flat against the wall. THE BACK WALL of the lot, at the top of the pool deck, is a tall plain continuous masonry wall with a LONG EMPTY STRETCH and absolutely nothing hanging on it or leaning against it. The center of the deck is completely clear.

BARE MINIMALIST SPACES: at most three large objects per space, all pushed flat against the walls, the entire center of every room and of the deck is clear bare floor.

EVERY DOORWAY IS WIDE AND OPEN: a broad gap cut clean through the wall, no door leaf, no frame, so that the carport, the side passage, the house interior and the pool deck connect into one continuous walkable surface. Only the small storeroom has a narrow doorway.

Polished cement and pale ceramic tile floors in light grey and cream, clearly lighter than the walls, swept clean. The pool water is vivid saturated blue, clearly bluer than anything else in the frame. Flat overcast diffuse daylight, almost no cast shadows, desaturated muted colors everywhere except the pool, documentary photography, sun-bleached concrete, weathered paint. Photorealistic, natural materials, high detail.

Absolutely no roof over the subject house and no cover of any kind over its rooms or its deck, no pergola, no awning, no sun umbrella — the neighboring houses DO keep their roofs. No close crop on the house, no isolated building, no empty ground around the lot, no building floating in a void. No wide angle lens, no fisheye, no lens distortion, no perspective, no leaning or splayed walls, no visible wall faces, no visible house facades, no vertical surfaces, no furniture seen from the side, no oblique or 45 degree angle, no tilted camera. No clutter, no furniture in the middle of a room or of the deck, no sun loungers on the deck, no pool floats, no toys in the water, no banners, no flags, no flagpoles, no cloth hanging on any wall. No closed rooms without a doorway, no closed gate, no car in the carport. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no text, no labels, no numbers, no watermark, no people. No dark interior floors, no green or grey pool water, no HDR, no dramatic lighting, no night, no long shadows.
```

## Conferência antes de aceitar

1. Alterne com a foto do bar: só topo de tudo, nenhuma face de parede.
2. Conte os caminhos: portão → garagem → porta da frente; corredor
   esquerdo de ponta a ponta com porta pra dentro; porta de dentro pro
   deck. Se um deles fechou, o atacante não chega ao deck.
3. O compartimento tem UMA porta e é pequeno.
4. O muro do fundo tem trecho liso, e não há pano nenhum na imagem.
5. A água é azul de piscina — se veio cinza ou verde, o importador vai
   deixar os bonecos andarem em cima dela.
6. Deck largo dos quatro lados; nada no meio dele.
