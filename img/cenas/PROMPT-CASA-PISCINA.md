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

## Rodada 1 · O que saiu errado, e o que mudou

O Flow gerou a casa espremida num quarteirão de periferia colado, casa
pequena, sem lógica de cômodos. O dono mandou a referência certa: a
**Tabuba** (Caucaia, CE) no Google Maps — casas de praia em lotes
grandes e espaçados, muro baixo entre eles, quintal de areia com grama
rala, coqueiro, rua de terra, piscina em quase todo lote.

Três mudanças no prompt, e uma exigência técnica que nasce delas:

1. **A vizinhança é de casa de praia, não de periferia.** Lotes largos
   com espaço entre as casas, cada um com quintal em volta; rua de
   areia sem asfalto; coqueiros. Densidade baixa.
2. **A casa é maior e tem cômodos de verdade**: sala, cozinha, três
   quartos, banheiro e a despensa pequena que é o compartimento. O lote
   ocupa uns três quintos do quadro.
3. **O quintal em volta da casa é claro.** E aqui está a armadilha: o
   importador **exclui verde por cor** (é assim que ele tira mato da
   malha), então gramado verde-vivo vira parede. O quintal tem de sair
   como a Tabuba de verdade — **areia clara com grama seca e rala**,
   bege, mais areia do que grama. Isso o importador lê como chão de
   terra (`terra: True`, como no campo da treta) e vira área de andar.
   Verde só nos coqueiros e nas copas, que ficam de fora mesmo.

**Anexe as duas referências:** o print do Maps da Tabuba (vizinhança,
densidade, luz) e a foto do bar (zênite sem telhado).

## O prompt (rodada 2)

```
true orthographic zenith satellite orthophoto of a quiet BEACH-HOUSE STREET in Tabuba, Caucaia, on the coast of Ceará, northeast Brazil, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, the top of every object reads as a flat shape. No vertical surface is visible anywhere: no wall faces, no house facades, no table legs, no chair backs. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

THIS IS A LOW-DENSITY BEACH NEIGHBORHOOD, NOT A DENSE CITY BLOCK. Match the attached Google Maps satellite view of Tabuba exactly in this respect: large lots with real space between the houses, each house sitting in the middle of its own yard, low masonry walls dividing the lots, coconut palms and a few mango trees, and many lots with their own small swimming pool. The ground everywhere is pale sand with sparse sun-dried grass, beige and cream, more sand than grass — there is NO bright green lawn anywhere.
- THE LOWER FIFTH of the frame is an unpaved sandy dirt street running unbroken from the left edge to the right edge, pale beige packed sand with faint tire tracks, no asphalt, no curb, a few weeds at the edges.
- LEFT AND RIGHT of the frame: two neighboring beach houses, each set back in its own wide yard of pale sand, each with a terracotta tile roof, a small blue pool, a coconut palm or two, and a low wall between lots. They are far apart, with open sandy ground between them.
- THE TOP of the frame: the sandy back yards of the lots on the next street over, with a few palms.
- IN THE CENTER, one single lot has NO ROOF AT ALL, and that lot is the subject: a large beach house with a swimming pool, its interior fully exposed from above. The lot occupies about three fifths of the frame width and three quarters of its height, with the house in the middle of the lot and open sandy yard around it. It is ONE LOT AMONG NEIGHBORS, with the neighbors clearly visible at both sides.

THE SUBJECT HOUSE HAS NO ROOF, while every neighboring house keeps its own terracotta roof: seen from directly above, every room of the subject house is fully exposed, its thick masonry walls read as continuous pale grey bands, and each room shows its own floor.

LAYOUT OF THE SUBJECT LOT, FROM THE STREET AT THE BOTTOM TO THE BACK WALL AT THE TOP. The whole lot is enclosed by a low masonry wall.
- FRONT: a wide open gate in the front wall, its leaf folded flat inside. Inside the gate, a front yard of pale sand with sparse dry grass and one coconut palm at one side. On the right of the front yard, an open carport with a bare concrete floor and no car in it. From the carport and the front yard, one wide open front doorway leads into the house.
- LEFT SIDE: a side passage of pale concrete and sand running along the entire left side of the house, from the front yard all the way to the pool deck at the back, with a wide open doorway in its right wall halfway along, leading into the house.
- MIDDLE, THE HOUSE, LARGE AND FULLY EXPOSED, seven rooms: a large living room of pale ceramic tile with a sofa pushed flat against one wall and nothing else; a kitchen with a counter along its wall and nothing else; three bedrooms along the right side, each with one bed pushed flat against the far wall and nothing else, each opening onto a short hall; one bathroom; and in one corner, one SMALL storeroom with a single narrow open doorway and one empty shelf on its far wall, clearly separate from the rest. Every room opens onto the living room or the hall. From the living room, one wide open doorway leads out to the pool deck at the back.
- BACK, the upper part of the lot: a rectangular swimming pool of deep saturated turquoise-blue water, surrounded on ALL FOUR SIDES by a wide open deck of pale grey concrete, clearly lighter than the walls and wide enough to walk around the whole pool, with pale sand and a coconut palm beyond the deck on each side. Against the LEFT wall of the deck, a brick barbecue and a stack of white plastic chairs pushed flat against the wall; against the RIGHT wall, one plastic table pushed flat against the wall. THE BACK WALL of the lot, at the top of the pool deck, is a tall plain continuous masonry wall with a LONG EMPTY STRETCH and absolutely nothing hanging on it or leaning against it. The center of the deck is completely clear.

BARE MINIMALIST SPACES: at most three large objects per room, all pushed flat against the walls, the entire center of every room and of the deck is clear bare floor.

EVERY DOORWAY IS WIDE AND OPEN: a broad gap cut clean through the wall, no door leaf, no frame, so that the front yard, the carport, the side passage, the house interior and the pool deck connect into one continuous walkable surface. Only the small storeroom has a narrow doorway.

Polished cement and pale ceramic tile floors in light grey and cream, clearly lighter than the walls, swept clean. Sandy ground in pale beige and cream with sparse dry yellowish grass. The pool water is vivid saturated blue, clearly bluer than anything else in the frame. Bright but diffuse coastal daylight, thin high cloud, short soft shadows, muted natural colors everywhere except the pool, documentary satellite photography, sun-bleached concrete, weathered paint, salt-worn walls. Photorealistic, natural materials, high detail.

Absolutely no roof over the subject house and no cover of any kind over its rooms or its deck, no pergola, no awning, no sun umbrella, no thatched hut — the neighboring houses DO keep their roofs. No dense city block, no houses packed wall to wall, no asphalt street, no sidewalk, no curb, no bright green lawn, no dark grass. No close crop on the house, no isolated building, no building floating in a void. No wide angle lens, no fisheye, no lens distortion, no perspective, no leaning or splayed walls, no visible wall faces, no visible house facades, no vertical surfaces, no furniture seen from the side, no oblique or 45 degree angle, no tilted camera. No clutter, no furniture in the middle of a room or of the deck, no sun loungers, no pool floats, no toys in the water, no banners, no flags, no flagpoles, no cloth hanging on any wall. No closed rooms without a doorway, no closed gate, no car in the carport. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no text, no labels, no numbers, no watermark, no people. No dark interior floors, no green or grey pool water, no HDR, no dramatic lighting, no night, no long shadows.
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
7. **O quintal saiu bege, cor de areia** — se saiu verde-vivo, o
   importador vai tratá-lo como mato e o atacante não anda por ele.
