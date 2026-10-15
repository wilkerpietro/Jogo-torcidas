# As brigas de bairro — os doze cenários por classe social

Pedido do dono (15/10/2026): "os cenários precisam deixar de ser tão
urbanos e podem ser mais dinâmicos, com vegetação ao fundo em alguns
casos, como a quadra que pode ser em um parque, praça com um lago, etc.
Crie doze novos cenários, quatro pra cada classe social. Vamos adotar
esses novos doze no jogo. Lembre-se que é visão zenital e que a vegetação
grande vista de cima atrapalha."

Estes doze **substituem** os nove prompts anteriores deste arquivo
(pracinha com coreto, praça da igreja, quadra, barzinho de esquina,
espetinho, sinuca, mercadinho, viela, lava-jato), que ficam só no
histórico do git.

## Como o jogo vai escolher

A cena sai da **classe do bairro** onde a briga cai e da **situação da
mensagem**. As classes do jogo são quatro; aqui Favela e Classe Baixa
dividem os mesmos quatro cenários (o mesmo corte das ruas, em
`PROMPT-PRACA-RUA.md`).

| classe | reunião na praça (`praca`) | assistindo o jogo (`jogo`) | de bobeira (`bobeira`) |
|---|---|---|---|
| **Popular** (Favela, Classe Baixa) | F1 campinho na beira do rio · F4 pracinha de classe média baixa | F2 bar da lagoa | F3 becos e vielas da favela |
| **Classe Média** | M1 quadra no parque · M2 praça com lago | M3 quiosque da praça com TV | M4 pista de skate do parque |
| **Nobre** | N2 parque com lago e deck · N3 quadras de areia | N1 quiosque da orla com TV | N4 pista de cooper e academia ao ar livre |

Com duas cenas de praça na classe, o bairro escolhe uma pelo hash (o mesmo
bairro abre sempre o mesmo cenário). Enquanto a foto de uma cena não chega,
vale a cena de hoje (`treta-campo`, `treta-galpao`, `treta-beco`).

## As regras da foto (valem pras doze)

**Zênite.** Só o topo das coisas. Nenhuma fachada, nenhuma face de muro.

**A vegetação (o pedido do dono).** Vista de cima, copa de árvore é uma
mancha que esconde os bonecos e vira parede na máscara. Então:

- **árvore grande só no fundo**: uma faixa de mata ou de árvores encostada
  em **uma** borda da foto (no máximo duas), ocupando no máximo um quinto
  do quadro, nunca por cima do chão da briga;
- **no meio, vegetação só rasteira**: grama baixa, capim seco ralo, areia,
  terra;
- **árvore solta, só pequena** (copa do tamanho de um carro) e só nas
  bordas;
- **água é borda**: lago, rio, lagoa e mar fecham um lado da cena e viram
  parede na máscara — é um limite natural, e é bom.

**O chão da briga é claro**: terra, areia, concreto, pedra portuguesa,
deck claro. Gramado verde escuro pode sair como parede no importador; se o
gramado tiver de ser chão, ele se abre no pincel (F2 da bancada).

**O meio livre e largo**, com **pelo menos duas entradas abertas** em
lados opostos (quem ataca e quem foge). Na bobeira o espaço é menor (até 7
contra 7).

**Nos bares, a TV é a única licença**: pendurada alta e inclinada pra
baixo, de modo que de cima se veja o jogo (gramado verde, linhas, placar no
canto). Mesas só nas bordas.

**Nada escrito, ninguém na foto**: sem gente, sem carro no chão da briga,
sem letreiro, sem pichação, sem escudo, sem bandeira.

**No Google Flow:** proporção 16:9; anexe `treta_campo.jpeg` como
referência de zênite e enquadramento.

## O começo e o fim de todos os prompts

Começo (cole antes do assunto):

```
true orthographic zenith aerial drone photograph shot straight down at exactly 90 degrees from high altitude with a long telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon. Only top surfaces are visible: every wall top reads as a flat even band, every roof as a flat plane, every tree as a flat round canopy, every object as a flat shape seen from above. Bright but diffuse daylight under thin high overcast, short soft shadows, desaturated muted natural colors, documentary photography, weathered textures, photorealistic, high detail. A big city in northeast Brazil.
```

Fim (cole depois do assunto):

```
NEGATIVE: no people, no crowds, no cars or motorcycles in the open area, no banners, no flags, no hanging cloth, no painted crests, no murals, no graffiti, no logos, no signs, no readable text, no labels, no numbers, no watermark. No tree canopy over the open area, no big trees in the middle of the frame, no dense vegetation covering the ground, no tall bushes in the open area, no shade covering the open area. No wide angle lens, no fisheye, no perspective, no oblique or 45 degree angle, no tilted camera, no visible wall faces, no visible facades, no leaning or splayed buildings. No clutter in the middle of the open area. No illustration, no cartoon, no isometric, no 3d render, no HDR, no night, no dramatic lighting, no long shadows.
```

---

## POPULAR · Favela e Classe Baixa

### F1 · Campinho de terra na beira do rio (praça)

```
THE SUBJECT: a poor riverside neighborhood. Filling the middle of the frame, a bare packed red-dirt football pitch, worn smooth, with faint white chalk lines and two simple wooden goal frames at the left and right ends seen from above as thin rectangles. The TOP FIFTH of the frame is the riverbank: a strip of low green reeds and short grass, then the brown-green water of a small urban river running from edge to edge. The LOWER FIFTH is a dirt street with a few small self-built brick houses with fiber-cement roofs below it. The LEFT edge: the back walls of small houses with blue water tanks. The RIGHT edge: an empty lot of low dry grass with a single small young tree in the corner. Three open ways in: from the dirt street at the bottom through a wide gap, along a footpath on the riverbank at the top right, and between the houses at the left. The pitch and its dirt margins are one wide clear open floor.
```

### F2 · Bar da lagoa com TV (jogo)

```
THE SUBJECT: a simple lakeside bar on the edge of a poor neighborhood. The TOP QUARTER of the frame is a calm lagoon of dark green water with a fringe of low grass and a few small coconut palms with small star-shaped crowns only along its shore. On the left of the middle of the frame, a small square bar kiosk of painted concrete block with a flat grey fiber-cement roof, about a tenth of the frame wide. In front of it, filling the middle of the frame, a wide terrace of pale packed sand and cracked concrete slabs. Along the edges of the terrace ONLY: red and yellow plastic tables with four plastic chairs each, red plastic beer crates, a few brown bottles on the table tops. THE TV: one flat TV screen mounted high on the front wall of the kiosk, TILTED FORWARD AND DOWN toward the terrace, so that from above its face is visible, showing a live football match — a bright green pitch with white lines, tiny players and a small scoreboard in a corner; the tilted screen is the only object whose face is visible. The LOWER QUARTER is a dirt road from edge to edge with a few small houses beyond it. The middle of the terrace is a wide clear open floor, open to the road at the bottom and to a sandy path along the lagoon at the right.
```

### F3 · Becos e vielas da favela (bobeira)

O dono (15/10/2026) trocou a pracinha do conjunto e a trilha do trem: o F3
virou os becos da favela (bobeira) e o F4 uma pracinha pequena de classe
média baixa (praça).

```
THE SUBJECT: the inside of a dense hillside favela, seen from directly above. The whole frame is packed with small self-built houses glued to each other, with flat grey concrete slab roofs, unfinished red brick wall tops, blue water tanks, a few terracotta tile roofs and some roof slabs with small rooftop terraces. Cutting through them, a network of narrow pedestrian alleys ("becos" and "vielas") of pale grey worn concrete, each about as wide as two people: one main alley running from the LEFT EDGE to the RIGHT EDGE across the middle of the frame, and three narrower alleys branching off it, two going up to the TOP EDGE and one going down to the BOTTOM EDGE, with a few short steps seen as thin lines and a shallow open gutter along one side. Where the main alley meets the branches, in the middle of the frame, a small irregular open clearing of pale concrete, about three times as wide as the alleys, with a single plastic chair and a pile of bricks pushed against a house wall ONLY. No trees, no plants except a few potted plants on the roofs. All the alleys are open from end to end and connect into one continuous walkable surface.
```

### F4 · Pracinha pequena de classe média baixa (praça)

```
THE SUBJECT: a small neighborhood square in a lower-middle-class area, at the meeting of three quiet streets. The square is a small irregular block in the middle of the frame, about half the frame wide, paved with pale grey concrete slabs and patches of cream portuguese stone pavement, worn and a little cracked. Along its edges ONLY: a few concrete benches, a closed metal newsstand, a small playground corner of pale sand with an old metal swing set and a seesaw seen from above as thin lines, an outdoor ping-pong table of concrete, and two small young trees with small canopies in the corners. The middle of the square is a wide clear paved floor. Around the square, streets of patched grey asphalt with narrow pale sidewalks, entering from the left edge, the right edge and the bottom edge, and beyond them simple one- and two-storey houses with terracotta tile roofs, small front yards of bare concrete behind low wall tops, a few flat concrete slab roofs with blue water tanks, and a small corner bakery with a flat grey roof. The square is open on all its sides to the streets.
```

---

## CLASSE MÉDIA

### M1 · Quadra no parque (praça)

```
THE SUBJECT: a public city park in a middle-class neighborhood. In the middle of the frame, an open-air multi-sport court with NO ROOF: pale grey-green painted concrete with faded white and yellow lines of a futsal and basketball court, two small goal frames at the short ends seen as thin rectangles, no fence. Around the court, a wide ring of pale concrete paving with a few benches and drinking fountains at its outer edge ONLY. Around that, a pale concrete walking path loop and low mowed lawns with dry patches. The TOP FIFTH of the frame is the background: a band of park trees with round canopies, staying behind the walking path. The LOWER FIFTH is a street of grey asphalt from edge to edge with a pale sidewalk and the park entrance, a wide open paved gap. Paths leave the court ring to the left and right edges. The court and its paved ring are one wide clear open floor.
```

### M2 · Praça com lago (praça)

```
THE SUBJECT: a neighborhood square with a small pond in a middle-class area. The RIGHT THIRD of the frame is a small artificial pond of calm green-brown water with a low concrete rim, and a short pale wooden deck reaching a little into the water. The rest of the square, filling the left two thirds, is a wide plaza of pale grey concrete paving with a simple pattern of darker joints, sloping gently to the pond rim. Along the outer edges of the plaza ONLY: concrete benches, lamp posts seen as small dots, a few low flower beds of short grass, and four small young trees with small canopies in the corners. Beyond the pond, along the far right edge, a narrow band of trees as background. The LEFT and BOTTOM edges: streets of grey asphalt with pale sidewalks, and beyond them the flat roofs of three- and four-storey apartment buildings with small rooftop water tanks. Open ways in from the street at the bottom and from the street at the left. The plaza is one wide clear open floor.
```

### M3 · Quiosque da praça com TV (jogo)

```
THE SUBJECT: a middle-class neighborhood square with a bar kiosk. In the middle of the upper half of the frame, a small square bar kiosk with a flat light grey metal roof, about a tenth of the frame wide. Around and below it, filling most of the frame, a wide plaza of pale grey and cream portuguese stone pavement in a simple pattern. Along the edges of the plaza ONLY: rows of white plastic tables with four chairs each, beer crates, a few bottles on the table tops. THE TV: one flat TV screen mounted high on the front of the kiosk, TILTED FORWARD AND DOWN toward the plaza, so that from above its face is visible, showing a live football match — a bright green pitch with white lines, tiny players and a small scoreboard in a corner; the tilted screen is the only object whose face is visible. A string of bare light bulbs runs from the kiosk to the edges, seen as thin lines of small round bulbs. The TOP EDGE: a narrow strip of low lawn and a few trees as background. The LOWER QUARTER: a street of grey asphalt from edge to edge with a pale sidewalk and low apartment buildings beyond it. The middle of the plaza is a wide clear open floor, open to the street at the bottom and to paths at the left and right.
```

### M4 · Pista de skate do parque (bobeira)

```
THE SUBJECT: a small street-style skate plaza inside a middle-class city park. In the middle of the frame, a flat area of smooth pale grey concrete, about half the frame wide. Along its edges ONLY: low concrete ledges, a short metal handrail and two small flat quarter-pipe ramps seen from above as pale rectangles with a thin edge line. The center of the skate plaza is flat open concrete. Around it, low mowed lawn with dry patches and a pale concrete path that crosses the frame from the left edge to the right edge, passing through the skate plaza. The TOP FIFTH of the frame: a band of park trees with round canopies as background. The LOWER EDGE: a pale concrete jogging path and a low hedge strip along a street. The skate plaza and the path are one clear open floor.
```

---

## NOBRE

### N1 · Quiosque da orla com TV (jogo)

```
THE SUBJECT: the seafront of an upscale neighborhood. The TOP QUARTER of the frame is the beach: pale golden sand and, at the very top edge, the turquoise sea with a thin line of white foam, with a single row of small coconut palms with small star-shaped crowns only along the line where sand meets pavement. Filling the middle of the frame, a very wide seaside promenade ("calçadão") of black and white portuguese stone pavement in a wave pattern. In the middle of the promenade, a modern beach kiosk with a flat white roof, about a tenth of the frame wide. Along the edges of the promenade ONLY: square wooden tables with four chairs each, a few closed beach umbrellas lying flat, a coconut cart. THE TV: one flat TV screen mounted high on the front of the kiosk, TILTED FORWARD AND DOWN toward the promenade, so that from above its face is visible, showing a live football match — a bright green pitch with white lines, tiny players and a small scoreboard in a corner; the tilted screen is the only object whose face is visible. The LOWER QUARTER: a wide seaside avenue of dark asphalt and, at the bottom edge, the flat roofs of tall residential towers with rooftop pools. The promenade is one wide clear open floor, open to the left and right edges and to the avenue.
```

### N2 · Parque com lago e deck (praça)

```
THE SUBJECT: an upscale landscaped park with a lake. The TOP THIRD of the frame is a large calm lake of dark blue-green water, and beyond it, at the very top edge, a thin band of trees as background. Along the shore, filling the middle of the frame, a wide waterfront plaza: a broad deck of pale weathered wooden boards next to the water, joined to a wide area of pale granite paving. Along the outer edges of the plaza ONLY: modern wooden benches, low planters with ornamental grasses, slim lamp posts seen as small dots, and four small young trees with small canopies in round planters. The LOWER QUARTER: manicured low lawns cut by pale paths, and at the bottom edge the flat roofs of tall condominium towers. Wide paths enter the plaza from the left edge, the right edge and the bottom. The deck and the granite plaza are one wide clear open floor.
```

### N3 · Quadras de areia do parque (praça)

```
THE SUBJECT: two side-by-side sand courts for beach tennis and footvolley in an upscale park. In the middle of the frame, two large rectangles of pale fine sand with thin white boundary lines, the nets taken down, only the slim posts at the sides seen as small dots. Around both courts, a wide border of pale concrete paving. Along the outer edges of the paving ONLY: a small modern kiosk with a flat white roof, wooden benches, a drinking fountain, a bike rack. Around it, low manicured lawns. The TOP FIFTH of the frame: a band of park trees as background. The LOWER EDGE: a wide pale path and a street with dark asphalt, beyond it the flat roofs of tall residential towers. The courts and their paving are one wide clear open floor, open at the bottom and at the left and right.
```

### N4 · Pista de cooper e academia ao ar livre (bobeira)

```
THE SUBJECT: the edge of an upscale park beside a gated condominium. A wide reddish running track of rubberized asphalt with thin white lane lines crosses the whole frame horizontally through the middle. Next to it, a pale concrete plaza with outdoor gym machines seen from above as small flat metal shapes, placed ONLY along the edges of the plaza; the center of the plaza is open. Low manicured lawns around. The TOP FIFTH of the frame: a band of park trees as background. The LOWER FIFTH: the long top of a tall condominium perimeter wall as a thin pale band, with a small square guardhouse roof and a closed vehicle gate, and the flat roofs of the condominium houses with pools beyond it. The track and the plaza are one clear open floor, open at the left and right edges.
```

---

## Conferência antes de aceitar

1. **Zênite de verdade**: nenhuma fachada, os prédios das bordas iguais aos
   do meio.
2. **Árvore grande só na borda do fundo**, e nenhuma copa por cima do chão
   da briga.
3. **O chão da briga é claro e o meio está livre**, com as entradas
   abertas.
4. **Nos bares, a TV mostra o jogo de cima.**
5. **Nada escrito**, ninguém na foto.

Quando as fotos chegarem: cada uma entra no importador
(`ferramentas/importar_cena_foto.py`), vira cena em `dados/cenas.js`
(`bairro-f1` … `bairro-n4`), ganha aba na bancada pra acertar a máscara
no F2, e `CENA_BAIRRO` (`js/main.js`, `abrirBrigaBairro`) passa a escolher
pela classe do bairro e pela situação, como na tabela do começo.
