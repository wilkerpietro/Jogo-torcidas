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
| **Nobre** | N1 praça de alto padrão · N3 campo society com barzinho | N4 esquina de avenida com LED | N2 corredor comercial |

Com duas cenas de praça na classe, o bairro escolhe uma pelo hash (o mesmo
bairro abre sempre o mesmo cenário). Enquanto a foto de uma cena não chega,
vale a cena de hoje (`treta-campo`, `treta-galpao`, `treta-beco`).

## O que já chegou (15/10/2026)

O dono mandou nove das doze: F2, F3, F4, M1, M2, M3, N1, N2 e N3. Viraram as
cenas `bairro-*` (`ferramentas/importar_cena_foto.py` e `dados/cenas.js`).
As três que faltam (F1 campinho, M4 skate, N4 esquina com LED) foram cobertas
com **pedaços** das fotos que chegaram, como o dono sugeriu ("utilizar parte
da imagem pra gerar cenas de brigas com menos membros, ajustando o ponto de
fuga"):

| vaga | cena | o pedaço |
|---|---|---|
| bobeira · média | `bairro-m1-rua` | a calçada e a rua em frente à quadra do parque |
| jogo · nobre | `bairro-n3-bar` | o pátio, o deck do barzinho e a rua do society |
| praça · popular | só `bairro-f4` | o campinho (F1) entra quando a foto chegar |

Quando F1, M4 e N4 chegarem, entram em `CENAS_POR_CLASSE` (`js/mundo/feed.js`).



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

O dono (15/10/2026) refez três dos nobres: praça de alto padrão, corredor
comercial "com bastante detalhes condizentes a isso" e esquina de avenida
de alto padrão "com propagandas comerciais de LED, placa de temperatura,
sinal de trânsito e etc". As quadras de areia ficaram.

### N1 · Praça de alto padrão (praça)

```
THE SUBJECT: an elegant designed public square in the richest neighborhood of the city, filling the middle of the frame as one full city block. The square is a wide plaza of large pale beige limestone and light grey granite slabs laid in a clean modern grid, with thin dark joints. In the exact center, a shallow rectangular reflecting pool of dark water with a thin stone rim, flat and low, about a fifth of the plaza wide. Along the outer edges of the plaza ONLY: long minimalist benches of pale concrete and wood, sculptural low planters with ornamental grasses, a row of slim modern lamp posts seen as small dots, a small glass-roofed café pavilion with a flat white roof in one corner, bike racks, and four small manicured trees with small round canopies in square planters at the corners. Between the reflecting pool and the edges, a wide clear paved floor on all four sides. Around the square, streets of smooth dark asphalt with crisp white markings and wide pale sidewalks, and beyond them the flat roofs of tall luxury residential towers with rooftop pools, gardens and helipads. Open ways in from the middle of each side of the square.
```

### N2 · Corredor comercial (bobeira)

```
THE SUBJECT: an upscale pedestrian shopping street ("corredor comercial") crossing the whole frame horizontally through the middle, closed to cars, about a third of the frame tall. Its floor is pale grey and cream stone paving in a long elegant pattern, with a thin metal drainage channel down the center. On both sides, glued to each other, the flat roofs of two- to four-storey shop buildings of different heights, with rooftop air conditioning units, skylights, solar panels and a small rooftop terrace with umbrellas. Along the shop fronts on both sides ONLY, the details of a busy commercial street seen from above: colorful retractable awnings of different solid colors over the shop doors (each awning a narrow flat strip, not covering the middle), café and restaurant terraces with small round tables and chairs, potted olive trees in square planters, a flower stall, a closed ice cream cart, an ATM kiosk with a small flat roof, rows of rental bikes and electric scooters in a docking station, delivery hand trucks with stacked boxes, slim lamp posts, waste bins, a parklet deck of pale wood with benches. The middle of the street is a wide clear paved floor from the left edge to the right edge. At the left and right edges, the street opens onto cross streets of dark asphalt with white zebra crosswalks.
```

### N3 · Campo society com barzinho (praça)

O dono (15/10/2026) trocou as quadras de areia por "um campo society com
barzinho ao lado, típico que tem no Brasil". A grama sintética é verde: se
o importador ler o campo como parede, ele se abre no pincel (F2). O chão
garantido da briga é o pátio de concreto entre o campo e o bar.

```
THE SUBJECT: a typical Brazilian "society" football complex in an upscale neighborhood, one wide lot seen from directly above. In the upper two thirds of the frame, a seven-a-side artificial turf pitch with NO ROOF: bright even synthetic grass in alternating light and dark green mowing stripes, crisp white lines, a center circle, small penalty areas and two small goals at the left and right ends seen from above as thin white rectangles. Around the pitch, a tall fence of thin green netting on slim posts, seen from above only as a thin line around the turf, with TWO WIDE OPEN GATES in its lower side. Below the pitch, filling the lower middle of the frame, a wide open courtyard of pale smooth concrete. On the right side of the courtyard, the "barzinho" of the complex: a small bar building with a flat light grey metal roof and, in front of it, an open uncovered terrace of pale ceramic tiles with rows of white plastic tables and chairs, red plastic beer crates and a closed chest freezer, placed ONLY against the bar and along the right edge; a small barbecue grill against the bar wall. On the left side of the courtyard, a row of wooden benches and a rack of footballs and team bibs against the left edge. The LOWER EDGE: the low wall top of the lot with a wide open entrance gate onto a quiet street of dark asphalt, and beyond it the flat roofs of upscale houses with pools. The TOP EDGE: a narrow band of trees as background behind the pitch fence. The courtyard is a wide clear open floor connecting the street gate, the bar terrace and the two open gates of the pitch.
```

### N4 · Esquina de avenida de alto padrão com LED (jogo)

Aqui o dono pediu letreiro, então a regra do "nada escrito" vale pela
metade: **pode** ter o painel de LED, a placa de temperatura e o sinal de
trânsito; **não pode** marca de verdade nem texto legível fora do número
da temperatura. De zênite essas coisas são de pé e não se veem, então ganham
a mesma licença da TV: **inclinadas pra trás, de modo que a face apareça de
cima**. Um dos painéis passa o jogo — é por ele que a torcida está ali.

```
THE SUBJECT: the corner of two wide high-end avenues in the richest district of the city. Two avenues of smooth dark asphalt, each with several lanes, crisp white lane markings, arrows and wide white zebra crosswalks, cross at the LOWER RIGHT of the frame: one runs along the whole bottom of the frame, the other along the whole right side. On the corner lot, filling the middle and upper left of the frame, a wide open forecourt plaza of polished light grey granite in front of a glass office tower, whose flat roof with a rooftop helipad and technical equipment fills the TOP LEFT corner. On the forecourt, against the tower ONLY: an upscale sports bar terrace with modern lounge chairs, low tables and large outdoor umbrellas closed and lying flat, glass planters with small trimmed shrubs. The street furniture of a premium corner, along the curbs ONLY: traffic lights on slim black poles with long arms reaching over the lanes, seen from above as thin black lines ending in small signal heads with a glowing red light; a digital street thermometer and clock on a pole; two large freestanding LED advertising screens on slim pylons and one LED screen on the tower's corner; bus shelter with a flat glass roof; bike lane painted green along the curb; bollards; slim lamp posts. THE SCREENS: every LED screen and the thermometer are TILTED BACK toward the sky so that from directly above their glowing faces are visible: the biggest LED screen shows a live football match — bright green pitch, white lines, tiny players and a small scoreboard; the other LED screens show colorful abstract advertising images of a perfume bottle, a luxury car silhouette and a smartphone, without any brand name; the thermometer shows a bright orange digital temperature reading "31°C". These tilted screens are the only objects whose faces are visible; everything else is seen strictly from the top. The forecourt is a wide clear open floor between the terrace and the curbs, open to both crosswalks.
```

Pra esta, troque o fim comum por este (tira "no signs, no readable text,
no numbers" e põe a proibição de marca):

```
NEGATIVE: no people, no crowds, no cars or motorcycles on the forecourt, no banners, no flags, no hanging cloth, no painted crests, no murals, no graffiti, no real brand names, no real company logos, no readable words, no text other than the temperature reading, no watermark. No tree canopy over the open area, no big trees, no shade covering the open area. No wide angle lens, no fisheye, no perspective, no oblique or 45 degree angle, no tilted camera, no visible building facades, no leaning or splayed buildings. No clutter in the middle of the forecourt. No illustration, no cartoon, no isometric, no 3d render, no HDR, no night, no dramatic lighting, no long shadows.
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
