# Prompts para as cenas de fora

Uma imagem por cena. Alvo: o mesmo acabamento de `arredores.png` —
foto de drone a prumo, dia nublado, cor dessaturada, cidade brasileira.

| Cena | Bairro que abre | Planta de entrada | Saída pro jogo | Estado |
|---|---|---|---|---|
| Praça | qualquer | `planta-praca-2048.png` | `praca.webp` | **feita** — `Aerial_view_of_public_square_202608131340.jpeg` |
| Rua | Favela e Classe Baixa | `planta-rua-2048.png` | `rua.webp` | **feita** — `Aerial_view_of_residential_street_202608131403.jpeg` |
| Rua de classe média | Classe Média | `planta-rua-media-2048.png` | `rua_media.webp` | **feita** — `Aerial_view_of_residential_street_202608131455.jpeg` |
| Rua de classe alta | Nobre | `planta-rua-nobre-2048.png` | `rua_nobre.webp` | **feita** — `Aerial_view_of_residential_avenue_202608131501.jpeg` |
| Bar da rival | ação *atacar a sede/bar* | `planta-bar-2048.png` | `bar.webp` | **feita** — `Aerial_view_of_roofless_bar_202608131633.jpeg` |

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
4. salve o texto num arquivo e rode
   `python3 ferramentas/colar_remendo.py remendo.txt` — ele encaixa em
   `dados/cenas_editadas.js` no formato da casa, trocando a entrada se ela já
   existir. Colar na unha também funciona, mas as três armadilhas são reais:
   entrada anterior sem vírgula derruba o arquivo inteiro, colar duas vezes
   deixa a cena duplicada (a segunda ganha calada) e a máscara numa linha de
   3 KB some no diff. Esse arquivo é da mão, entra depois do gerado e manda —
   o que estiver escrito lá troca, o resto continua vindo da foto;
5. confira com `python3 ferramentas/prova_mascara.py`, que desenha
   `_ref_mascara_<cena>_editada.png` com a máscara que vale de verdade.

As quatro cenas passaram por aí, e o corte errou de um jeito diferente em
cada uma — pros dois lados, com a mesma configuração:

| cena | corte | mão | como errou |
|---|---|---|---|
| rua de periferia | 32,6% | 43,0% | cortou de menos: perdeu a calçada |
| praça | 70,8% | 60,9% | cortou de mais: vazou pro quarteirão |
| rua de classe média | 46,8% | 43,5% | vazou pelo portão (e faltou marcar parada e carro) |
| rua de bairro nobre | 32,1% | 39,2% | encolheu: perdeu pedra clara e grama |
| bar da rival | 59,9% | 51,3% | subiu no telhado do quarteirão inteiro |

Como ele erra pros dois lados, não adianta mexer em limiar: qualquer número
que salve a periferia arrebenta a praça. O pincel é etapa, não gambiarra.

O bar precisou dos dois: prior geométrico **e** pincel. Primeiro o corte laje de vizinho
é cinza igual asfalto **e** encosta na rua pela esquina, então a conectividade
subiu no telhado do quarteirão inteiro — nove linhas abrindo de ponta a ponta.
O conserto foi um prior geométrico declarado, `recorte`: quatro retângulos em
fração da tela (a rua principal, as duas verticais e o bloco do bar), e fora
deles não há chão — irmão do `corredor` para planta que não é pista
atravessando o quadro. Depois a mão, que no salão importa mais que nas
outras cenas: mesa, balcão e freezer são obstáculo dentro de uma sala
pequena, e o degrau da frente tinha fechado a entrada. 54% → 51,3%, com
1.260 células fechadas e 614 abertas.

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

## BAR DA RIVAL — prompt

Esta é diferente das quatro anteriores, e por um motivo só: **o bar não
tem telhado**. A briga não acaba na calçada — a ação *atacar a sede/bar
da rival* termina com o líder chegando na porta e tomando o salão, e não
dá pra jogar o que não se vê. Então a foto é de drone a prumo como as
outras, com um detalhe de maquete: a laje do bar foi tirada e o salão
aparece inteiro por dentro, com balcão, sinuca, mesa e freezer.

**Inteiro mesmo, do rodapé de uma parede ao da outra.** O erro que o
modelo comete sozinho é tirar só o miolo do telhado e deixar o beiral em
volta — sobra uma coroa coberta rente às paredes, e é justamente ali que
ficam o balcão e o freezer. Meia laje não serve: o que fica na sombra da
beirada some da máscara e vira parede dentro do jogo, num canto que o
jogador precisa ocupar. Por isso o prompt abre falando disso, repete no
fim e o negativo lista as seis formas de meio-telhado (beiral, varanda,
pergolado, toldo, marquise, alpendre).

**Só o bar.** Toda casa vizinha continua de telhado fechado. Se a IA
abrir o quarteirão inteiro, o importador lê laje de vizinho como chão e
o bonde passa a atravessar sala de estranho.

A geometria é a da rua de sempre — pista larga atravessando o quadro,
calçada larga dos dois lados — mais **uma transversal descendo da borda
de cima, a uns dois terços da largura**. É ela que faz a esquina, e o bar
é o prédio da quina a leste dela. `planta-bar-2048.png` já está assim, e
a imagem tem de bater com ela: transversal encostando na borda de cima,
faixa de asfalto na mesma altura, calçada com a mesma largura, o bar na
quina de cima à direita, a porta dele virada pra rua e o deck de mesas na
calçada em frente.

Três pontos da planta não são enfeite, são regra de jogo:

- **a transversal chega até a borda de cima do quadro**, porque é ali que
  a torcida atacante nasce (`mandante1` em 944,132 e `mandante2` em 966,250);
- **o salão é chão contínuo**, com o balcão, a sinuca, os freezers e a pilha
  de engradado como ilhas de obstáculo no meio dele — quem defende nasce lá
  dentro (`visitante1` em 1112,300 e `visitante2` em 1344,250);
- **a porta é o único vão na parede da frente** (x 1150..1215). É por ela que
  a visão passa: de dentro do salão só se enxerga quem está no vão, e é isso
  que segura a lógica de os donos da casa não saberem do ataque antes da hora.

```
top-down nadir aerial drone photograph of a Brazilian street corner with a
corner bar whose roof has been completely removed, shot straight down at 90
degrees, orthographic feel, overcast diffuse daylight, soft shadows,
desaturated muted colors, documentary photography,

THE CORNER BAR HAS NO ROOF AT ALL. Not a single roof tile, slab, beam, eave or
overhang is left anywhere over it. Its walls are cut off at knee height, so
that from directly above the whole floor of the bar is visible corner to
corner, wall to wall, with nothing shading or hiding any part of it — an
architectural cutaway model of this one building, open to the sky, every square
metre of its floor lit by the same flat daylight as the street outside,

inside the bar, all of it plainly visible from above: checkerboard tiled floor,
a long wooden bar counter running along the back wall with shelves of bottles
behind it and a cash register on it, a green baize pool table in the middle of
the room with balls and two cues on it, four small square tables with plastic
chairs, two white chest freezers against the side wall, stacked crates of beer
bottles in the corner, a small sink, a doorway at the back leading to a tiny
toilet whose floor is also visible, the front of the building opening onto the
sidewalk where the entrance is,

one wide two-lane street running left to right across the whole frame, worn
dark asphalt, faded yellow dashed center line, painted black-and-white curbs,
wide concrete sidewalks on both sides, a zebra crossing,

a cross street comes down from the top edge and meets the main street about
two thirds of the way across, forming a corner; the sidewalk turns around the
corner building, and the bar sits on that corner, east of the cross street,

in front of the bar, on the wide sidewalk, an outdoor deck: white plastic
tables and chairs, a low metal railing separating the deck from the curb, a
string of small colored triangular flags overhead, a painted sign board by the
entrance, stacked beer crates by the wall,

every other building in the frame keeps its roof completely intact: terracotta
clay tile roofs and flat concrete rooftops with blue water tanks, laundry
lines, satellite dishes, small back yards of bare packed earth, a two-storey
house attached to the bar on the east, a row of low houses along the other side
of the street, a rubbish skip,

the bar is the only building in the whole picture without a roof, and it is
open all the way to its walls — no covered strip, no shaded edge, no part of
its interior hidden,

photorealistic, natural materials, sun-bleached concrete, tropical northeast
Brazil, 8k satellite imagery quality, sharp detail, no people visible
```

### Negativo

```
roof over the bar, partial roof, half roof, remaining roof section, roof ring,
eaves, overhanging roof, roof overhang, veranda, pergola, canopy, awning over
the interior, marquee, porch, covered walkway, covered perimeter, covered
edge, shaded interior, dark interior, unlit corners, open courtyard in the
middle of a roofed building, atrium, patio surrounded by roof, only the center
open, walls hiding the floor, tall walls casting shadow inside,

all roofs removed, every building open, doll house, whole block cutaway,
neighbours without roofs,

illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, floor plan drawing, map icons, labels, text, watermark,
grid lines, tilted perspective, oblique angle, fisheye, vignette,
interior lighting, indoor photo, eye-level view, storefront photo,
buildings covering the street, blocked intersection, dead end,
crowd, people, pedestrians, drinkers, waiters, cars, moving cars,
snow, night, rain, saturated colors, hdr, dramatic lighting
```

### Se for consertar uma imagem que já saiu (Flow / Nano Banana)

Modelo de edição obedece melhor a uma ordem curta e negativa do que a um
prompt novo inteiro, e aproveita o enquadramento que já deu certo. Pegue a
melhor das que saíram e mande:

```
Remove every remaining piece of roof from the corner bar: the ring of tiles
around the edge, the eaves and the overhang. Cut its walls down to knee height
so the entire floor of the bar is visible from above, wall to wall, evenly lit,
with no shaded strip along the edges. Show the bar counter, the shelves of
bottles, the freezers and the crates that are currently hidden under the
roof edge. Keep everything else in the image exactly as it is — the street,
the sidewalk, the outdoor tables, and the roofs of all the neighbouring
houses, which stay intact.
```

### O que conferir nesta

1. **O salão inteiro à vista.** Olhe a beirada do bar, não o meio: se sobrou uma
   faixa coberta rente às paredes, o balcão e o freezer estão embaixo dela e a
   imagem não serve. O chão tem de ir de parede a parede, com a mesma luz do
   meio da sala.
2. **Um telhado só aberto.** Passe o olho no quadro inteiro: se houver uma
   segunda casa sem laje, refaça — vira chão de andar onde não devia.
3. **A porta do bar dá pra rua.** É o objetivo da ação (`porta_bar`): se a
   entrada ficar num beco lateral ou virada pro fundo, o líder não tem onde
   chegar.
4. **A ponta oeste da rua continua aberta.** É por ali que os donos da casa
   fogem (`fuga_oeste`); rua fechada à esquerda deixa o rival sem saída e a
   cena trava numa chacina.
5. **Depois de importar, o salão inteiro vai virar chão** — é o certo, o bar é
   invadível. Mas balcão, sinuca, freezer e pilha de engradado têm de virar
   parede na mão, senão o disco atravessa a mesa de sinuca. É o pincel do F2
   e `colar_remendo.py`, como nas outras quatro.

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
