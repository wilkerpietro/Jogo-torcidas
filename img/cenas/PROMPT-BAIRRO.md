# As brigas de bairro — prompts das variações

Pedido do dono (15/10/2026): "crie prompts de mais imagens que podem compor
a variação, como pracinha e barzinho típico brasileiro que transmite jogo".
Hoje as três brigas de bairro usam três fotos fixas (`docs/DECISOES.md`,
"Domínio dos bairros de novo, só no braço"):

| situação da mensagem | cena de hoje | variações deste arquivo |
|---|---|---|
| reunião na praça (`praca`) | `treta-campo` (campo de terra) | P1 pracinha com coreto · P2 praça da igreja · P3 quadra de esportes |
| assistindo o jogo (`jogo`) | `treta-galpao` (pátio de galpão) | J1 barzinho de esquina com TV · J2 espetinho com telão na calçada · J3 bar de sinuca com TV |
| de bobeira (`bobeira`) | `treta-beco` (beco) | B1 esquina do mercadinho · B2 viela de escadaria · B3 ponto de ônibus e lava-jato |

Mesmo acabamento das outras cenas: foto de drone a prumo, dia nublado, cor
dessaturada, bairro popular de cidade grande brasileira. O raciocínio de
cada regra está em `PROMPT-SEDE.md` e `PROMPT-SUBSEDE.md`; aqui é só colar.

**Antes de colar, no Google Flow:**

- proporção **16:9** (o importador completa em cima e embaixo);
- anexe `treta_campo.jpeg` (praças), `Aerial_view_of_roofless_bar_202608131633.jpeg`
  (bares) ou `treta_beco.jpeg` (bobeira) como referência de zênite e de
  enquadramento.

## O que a máscara precisa de toda foto (vale pras nove)

- **zênite de verdade**: só o topo das coisas, nenhuma fachada, nenhuma
  face de parede. Muro é faixa da mesma largura em todo canto;
- **piso claro, parede escura**: o chão onde se briga mais claro que o topo
  dos muros e que os telhados;
- **o meio livre e largo**: uns 20 contra 15 bonecos brigam ali. Banco,
  mesa, árvore e carro só nas bordas;
- **pelo menos duas entradas abertas**, em lados opostos: uma de quem
  ataca, uma de quem defende (e de quem foge);
- **rua de ponta a ponta numa das bordas**: é por onde o bonde chega;
- **sem gente, sem texto, sem letreiro, sem pichação legível, sem escudo,
  sem bandeira** — a cor da torcida quem pinta é o jogo. (O campo de hoje
  saiu com letras nos muros; não repetir.)

O rabo negativo é o mesmo em todos os prompts:

```
NEGATIVE: no people, no crowds, no cars or motorcycles in the open area, no banners, no flags, no hanging cloth, no painted crests, no murals, no graffiti letters, no logos, no signs, no shop sign, no readable text, no labels, no numbers, no watermark. No wide angle lens, no fisheye, no perspective, no oblique or 45 degree angle, no tilted camera, no visible wall faces, no visible facades, no leaning or splayed buildings. No clutter in the middle of the open area. No illustration, no cartoon, no isometric, no 3d render, no HDR, no night, no dramatic lighting, no long shadows.
```

O começo também é igual (cole antes de cada um):

```
true orthographic zenith aerial drone photograph shot straight down at exactly 90 degrees from high altitude with a long telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon. Only top surfaces are visible: every wall top reads as a flat even band, every roof as a flat plane, every object as a flat shape seen from above. Bright but diffuse daylight under thin high overcast, short soft shadows, desaturated muted natural colors, documentary photography, weathered paint, stained concrete, dusty urban textures, photorealistic, high detail. A dense working-class neighborhood of a big city in northeast Brazil: houses built wall to wall with terracotta tile and grey fiber-cement roofs, blue water tanks on the roofs.
```

---

## PRAÇA · onde a torcida faz a reunião

### P1 · Pracinha de bairro com coreto (rodada 2: quase sem árvore)

O dono (15/10/2026): a arborização da praça atrapalha o cenário. Copa de
árvore de cima esconde os bonecos e vira parede na máscara. Agora são só
quatro árvores pequenas, uma em cada canto, por fora do piso.

```
THE SUBJECT, filling the center of the frame: a small neighborhood square, one full city block, surrounded on all four sides by streets of worn grey asphalt with narrow pale concrete sidewalks, and beyond the streets the roofs of the houses. The square is an OPEN SUN-EXPOSED PAVED PLAZA, almost entirely bare: pale grey and cream portuguese stone pavement in a simple wave pattern covering the whole block from edge to edge. In the exact center, a small round concrete bandstand platform, low and flat, seen from above as a pale circle. VERY FEW TREES: only FOUR small young trees, one in each outer corner of the square, each with a small round canopy no wider than a parked car, standing in a small square patch of dry dirt; no other trees, no shrubs, no hedges anywhere. Along the outer edge ONLY: a few concrete benches, two small low flower beds of dry grass, a closed metal popcorn cart parked against one edge. Everything between the edges and the bandstand is a wide clear paved floor, fully visible from above, with no canopy over it. Four open paths enter the square, one in the middle of each side, straight from the sidewalk.
```

O rabo negativo ganha, no fim: `No dense trees, no tree canopy over the paved area, no rows of trees along the borders, no shrubs, no hedges, no shade covering the plaza.`

### P2 · Praça da igreja

```
THE SUBJECT: a wide paved church square in a poor neighborhood. The TOP QUARTER of the frame is the roof of a simple parish church, a long rectangle of terracotta tiles with a small square bell tower roof at one end, sitting at the top edge of the square. The square in front of it, filling the middle of the frame, is a broad open esplanade of pale washed concrete slabs with thin joints, a few cracks and patches. Along the left and right borders ONLY: a row of tall palm trees seen from above as star-shaped green crowns, concrete benches, a few lamp posts seen as small dots, two closed metal food kiosks pushed against the left border. The LOWER QUARTER of the frame is a street of grey asphalt crossing from edge to edge with a pale sidewalk. The whole center of the esplanade is clear open floor, from the street up to the church steps. Two side streets enter the square from the left and right edges.
```

### P3 · Quadra de esportes do bairro

```
THE SUBJECT: an open-air neighborhood multi-sport court, NOT roofed, inside a small fenced lot between houses. The court is pale grey-green painted concrete with faded white and yellow lines of a futsal and basketball court, two small goal frames at the short ends seen from above as thin rectangles. Around the court, a strip of pale concrete with three low tiers of concrete bleachers along ONE long side only, seen from above as three thin pale steps. The lot is closed by a thin wall band, with TWO WIDE OPEN GATES: one in the middle of the lower wall, opening onto the street, and one at the far upper corner, opening onto a narrow alley between the houses. The LOWER QUARTER of the frame is the street of grey asphalt from edge to edge, with a pale sidewalk. Two big trees whose canopies touch only the outer corners. The whole court surface is clear open floor.
```

---

## JOGO · onde a torcida se junta pra assistir o jogo dela

A TV é a única licença: de zênite, tela é só uma risca. Por isso **a TV fica
alta na parede, inclinada pra frente e pra baixo**, e de cima mostra o jogo
(gramado verde, linhas, placar no canto). Mesa no meio vira parede na
máscara: **mesas só nas bordas, corredor largo e livre no meio**.

### J1 · Barzinho de esquina com TV

```
THE SUBJECT: a typical Brazilian corner bar ("boteco") on a street corner, with NO ROOF while every neighboring house keeps its roof. Two streets of grey asphalt meet at the LOWER RIGHT corner of the frame, one running along the whole bottom edge and one running along the whole right edge, each with a wide pale concrete sidewalk. The bar occupies the corner lot, its interior exposed from above: a floor of cheap pale cream ceramic tiles, thin wall bands, a long masonry counter with a red tiled top along the back wall, a chest freezer and an upright beer fridge pushed against the back wall. The bar is OPEN TO THE CORNER: the two front walls are almost entirely wide open roll-up door gaps, no door leaf, no grille, so the tiled floor flows straight onto the sidewalk. Outside on the wide sidewalk, along the curb and along the walls ONLY: red and yellow plastic tables with four plastic chairs each, red plastic beer crates, a few brown bottles on the tables. A wide clear strip of sidewalk and bar floor between the tables, completely empty. THE TV: one flat TV screen mounted high on the inner back wall, TILTED FORWARD AND DOWN toward the street, so that from above its face is visible, showing a live football match — a bright green pitch with white lines, tiny players and a small scoreboard in a corner. The tilted screen is the only object whose face is visible.
```

### J2 · Espetinho com telão na calçada

```
THE SUBJECT: a wide street of grey asphalt crossing the whole frame horizontally through the middle, closed to traffic, with wide pale concrete sidewalks on both sides, houses with roofs above and below. On the upper sidewalk, at the center, a small grill stand ("espetinho") seen from above: a long charcoal barbecue grill with skewers, a folding table with a cooler, all pushed against the house wall. Next to it, the big screen: a large outdoor TV on a metal stand placed against the house wall, TILTED BACK toward the sky so that from above its face is visible, showing a live football match — bright green pitch, white lines, tiny players, a small scoreboard in a corner. Along both curbs ONLY: rows of white plastic tables and chairs, red plastic beer crates, a few styrofoam coolers. A string of bare light bulbs crosses the street high above, seen as a thin line of small round bulbs. The middle of the asphalt is a wide clear open floor from the left edge to the right edge.
```

### J3 · Bar de sinuca com TV

```
THE SUBJECT: one wide one-storey bar lot in the middle of the block, with NO ROOF while every neighboring house keeps its roof. The LOWER QUARTER of the frame is the street of grey asphalt from edge to edge, with a pale concrete sidewalk. The bar's front wall faces the sidewalk with TWO WIDE OPEN roll-up door gaps, one on the left and one on the right, no door leaf, no grille. Inside, the floor is pale grey burnt cement. Along the left wall ONLY: two pool tables with green felt, seen from above as green rectangles with dark rails. Along the right wall ONLY: a row of small plastic tables with chairs. At the back: a long masonry counter with a white tiled top, shelves of bottles and a fridge against the back wall, and an open doorway at the back right into a small yard with a clothesline. THE TV: one flat TV mounted high on the back wall above the counter, TILTED FORWARD AND DOWN, so that from above its face is visible, showing a live football match — bright green pitch, white lines, tiny players, a small scoreboard. A wide clear aisle down the middle of the bar, from the doors to the counter, completely empty floor.
```

---

## BOBEIRA · "passei por lá e vi membros deles de bobeira"

Lugar de passagem, apertado e pequeno: a cena do beco é de até 7 contra 7.

### B1 · Esquina do mercadinho

```
THE SUBJECT: a street corner where two narrow streets of patched grey asphalt cross, one horizontal through the middle of the frame and one vertical through the middle, forming a plus shape, each with narrow pale sidewalks. On one corner lot, a small neighborhood grocery store ("mercadinho") with its roof ON, a plain grey fiber-cement roof, and in front of it on the sidewalk, pushed against its wall ONLY: stacked blue gas cylinders in a cage, a rack of plastic crates of fruit, a red cooler. On the opposite corner, a small empty lot of bare red dirt with a few weeds and a low broken wall. The other two corners are houses with terracotta roofs. A wooden electricity pole at one corner, seen as a small dot with a thin crossbar. The crossing itself is a wide clear open area.
```

### B2 · Viela de escadaria

```
THE SUBJECT: a narrow pedestrian alley ("viela") climbing between densely packed self-built brick houses, running straight from the BOTTOM EDGE of the frame to the TOP EDGE through the middle. The alley floor is pale grey concrete with wide flat stair landings every few meters, seen from above as pale rectangles separated by thin lines, a shallow open gutter along one side. The alley is about a fifth of the frame wide, widening in the middle into a small open landing about twice as wide, where two side passages open to the left and right between the houses. Houses on both sides with flat grey concrete slab roofs, unfinished red brick wall tops, blue water tanks, rebar sticking out, a few potted plants on the roofs. No objects in the alley except a couple of plastic chairs against a house wall on the landing.
```

### B3 · Ponto de ônibus e lava-jato

```
THE SUBJECT: a wide avenue of grey asphalt crossing the whole frame horizontally in the LOWER THIRD, with a faded dashed center line and a wide pale concrete sidewalk. On the sidewalk at the center, a simple bus stop: a thin flat metal roof seen from above as a small grey rectangle, with a bench under it. Behind the sidewalk, filling the middle of the frame, a small car wash yard ("lava-jato") with NO ROOF: a wide open floor of wet dark-grey concrete with a drain grate and puddles, open to the sidewalk along its whole front, no gate. Against the back wall ONLY: a blue pressure washer machine, coiled hoses, plastic buckets, a stack of tires. Left and right: houses with terracotta and fiber-cement roofs glued to the yard's side walls. A narrow alley opens at the upper left corner of the yard, leading out between the houses. The yard and the sidewalk form one wide clear open floor.
```

---

## Conferência antes de aceitar

1. **Zênite de verdade**: nenhuma fachada, nenhuma face de muro; os
   prédios das bordas iguais aos do meio.
2. **O meio está livre** e largo, e as entradas estão abertas (pelo menos
   duas, em lados opostos).
3. **Piso claro, parede escura.**
4. **Nos bares, a TV mostra o jogo de cima** (gramado verde visível), e as
   mesas ficaram nas bordas.
5. **Nada escrito** em lugar nenhum.

Quando as imagens chegarem: cada uma entra no importador
(`ferramentas/importar_cena_foto.py`, receita no molde de `treta-*`), vira
uma cena em `dados/cenas.js`, ganha a aba na bancada pra acertar a máscara
no F2 e passa a ser sorteada pela situação — em `abrirBrigaBairro`
(`js/main.js`), `CENA_BAIRRO` deixa de ser uma cena por situação e vira uma
lista, com a escolha fixa pelo bairro (o mesmo bairro abre sempre o mesmo
cenário).
