# Estádios com imagem própria

As três cenas de porte (`PROMPT-ESTADIOS.md`) cobrem as 76 praças do
`dados/estadios.js` pela capacidade. Este arquivo é a exceção: **estádio que o
jogador vê muito ganha a própria imagem**, com a forma real da arquibancada.

A regra de escolha, quando isto entrar em `dados/cenas.js`: **se existe imagem
própria pra aquele `id` de estádio, usa; senão, cai na faixa de capacidade.**
Nada mais muda — é a mesma cena de briga, com outro chão.

| Estádio | Capacidade | Forma | Saída pro jogo | Estado |
|---|---|---|---|---|
| Maracanã | 78.000 | elipse de dois anéis contínuos | `estadio_maracana.webp` | a fazer |
| Mineirão | 60.000 | elipse de dois anéis, cinturão de camarote num lado | `estadio_mineirao.webp` | a fazer |

## A elipse não cabe na tela, e isso tem que ser decidido

A tela da cena é **3:2** — 1536 × 1024. O importador encaixa a largura inteira
e o que passar de 1024 de altura fica de fora. O Maracanã é quase redondo: uns
**300 m de eixo maior por 260 m de eixo menor**. Pra caber os 260 m de altura
numa tela 3:2, o quadro precisa de **390 m de largura** — e aí a escala
despenca:

| Enquadramento | O quadro cobre | Escala | O disco vira | Serve pra |
|---|---|---|---|---|
| **anel inteiro** | ~390 × 260 m | 3,9 px/m | ~3,6 m | ver o estádio todo |
| **meio estádio** | ~200 × 133 m | 7,7 px/m | ~1,8 m | brigar de verdade |

**As duas existem, e a escolha é de jogo, não de arte.** No anel inteiro o
disco fica gordo — 3,6 m é quase um carro visto de cima — mas você vê a elipse
inteira e a briga percorre o estádio. No meio estádio (um gol e as duas
laterais até o meio de campo) o disco volta ao tamanho da cena de 40 mil, e é
assim que a briga acontece de verdade: setor contra setor, não estádio contra
estádio.

O prompt abaixo é o do **anel inteiro**, que foi o pedido. A variante de meio
estádio está no fim, e é uma troca de duas linhas.

## O que a forma manda, e o que a regra manda por cima

Lendo o mapa de setores: **elipse perfeita**, anel inferior colado no gramado,
anel superior por fora, os dois **contínuos, sem vão de quina** — diferente da
cena genérica de 40 mil, onde os quatro cantos abrem. Os setores são fatias
radiais, separadas por escada, e por fora da elipse há quatro blocos de acesso,
um por quadrante: são as **rampas**, e são a marca do Maracanã visto de cima.

Duas coisas o desenho não diz e a regra decide:

- **sem cobertura.** O Maracanã real tem anel de cobertura, e ele apaga a
  arquibancada inteira no zênite. Aqui ela sai, como saiu o viaduto e a laje do
  bar. É a mesma regra: nada por cima do chão de andar;
- **anel superior recuado, com circulação aberta entre os dois.** Se o de cima
  debruçar sobre o de baixo, some a metade inferior do estádio.

E como a elipse é contínua, **a fuga não é a quina** — é a rampa. As quatro
entram na cena como caminho de verdade, ligando a circulação ao lado de fora.
Sem elas, o anel superior vira ratoeira.

## Fidelidade, e as três divergências declaradas

Estádio individual não é "um estádio brasileiro com esta forma" — **é aquele
estádio**, com o complexo em volta: esplanada, estacionamento, ginásio vizinho,
avenida, quarteirão. Quanto mais real o entorno, mais a cena parece o lugar.

O que muda em relação ao real é pouco, e o prompt **declara em bloco numerado**,
porque é a estrutura que o modelo mais obedece:

1. **a câmera** — ortográfica, zênite, orthomosaic;
2. **o teto sai** — cobertura vista a prumo apaga a arquibancada inteira;
3. **o fosso fica sem travessia** — o gramado é ilha de propósito: a briga é
   toda na arquibancada, ninguém desce no campo.

E o cimento, que é decisão de projeto e não divergência de planta: cadeira
colorida é cor de clube, e a mesma cena serve a torcida que muda toda partida.

Fora isso, **tudo segue o lugar real**. Se um estádio tiver rampa helicoidal,
setor interrompido, ginásio colado ou linha de trem passando, isso entra.

## Referência: qual imagem serve pra quê

Estádio individual roda com imagem anexada, sempre. Mas **nenhuma referência
sozinha entrega a cena**, e cada uma atrapalha de um jeito se o papel dela não
estiver declarado:

| Referência | O que dá | O que atrapalha se não for barrado |
|---|---|---|
| **A — mapa de setores** | geometria de planta: contorno, anéis, setores, cinturão | cor chapada, legenda, número, cara de desenho |
| **B — foto interna do estádio** | material e identidade: tom do concreto, escada, boca de túnel, grama | perspectiva, nível do olho, **cobertura**, cadeira colorida |
| **C — satélite de estádio descoberto** | como degrau se lê a prumo: faixa concêntrica, escada radial, vomitório | a forma daquele outro estádio |

**Satélite do próprio estádio não serve pra arquibancada quando ele tem
cobertura** — e os grandes têm. De cima, o satélite mostra a laje, não o
degrau: é o problema do viaduto visto de fora. Ele serve pro **entorno**, que
é metade do quadro: contorno da elipse, esplanada, rampa, via de contorno,
estacionamento.

Por isso a C existe: um estádio descoberto qualquer (Arruda, geral de concreto)
dá, a prumo, exatamente o que A e B não dão. Dela vem só a textura do degrau,
nunca a forma.

O parágrafo abaixo declara os papéis e entra em todo prompt individual, logo
depois do bloco de zênite. Com só A e B anexadas, apague a linha da C:

```
THREE REFERENCE IMAGES ARE ATTACHED, and they have different jobs.

Reference A is a seating map: take from it ONLY the plan geometry — the outline
of the bowl, how elongated it is, the proportion between the rings, where the
terracing is continuous and where it is split into sectors, and the position of
the pitch inside it. Ignore its colours, its legend, its numbers and its flat
diagram look.

Reference B is a photograph of the real stadium taken from inside at eye level:
take from it ONLY the materials and the identity of the place — the tone and
staining of the concrete, the pattern of the stairways, the shape of the tunnel
mouths, the grass and its mowing stripes. Do NOT take its camera angle, do NOT
take its perspective, do NOT take its roof and do NOT take its seats.

Reference C is a satellite view of a different, roofless concrete stadium: take
from it ONLY how terracing reads from directly overhead — the concentric bands
of steps, the radial stairways cutting through them, the dark tunnel mouths.
Do not take the shape of that stadium.

The finished image is a strict overhead nadir view of the stadium in reference
A, from directly above, with no roof at all.
```

E o negativo ganha os tells da foto interna:

```
interior view, view from the stands, eye level, ground level photo, sky
visible, clouds, roof structure, steel truss, roof ring, hanging scoreboard,
floodlight rig, white plastic seats, rows of seats,
```

### Quando a forma vem certa e a câmera vem torta

Acontece muito: traçado certo, concreto certo, e ainda assim sobra ângulo. O
tell não é o meio do quadro, é a **face vertical**: se dá pra ver a parede
interna da arquibancada, a frente do degrau ou a lateral da boca de vomitório,
a projeção ainda é de lente, não é ortográfica.

Não refaça — a forma é a parte cara. Anexe a imagem que saiu e mande:

```
Re-render this exact same stadium as a TRUE ORTHOGRAPHIC ORTHOMOSAIC seen from
directly overhead. Imagine it photographed from very high altitude with a long
telephoto lens, so that all vertical lines project to points and nothing
diverges towards the edges of the frame.

No vertical surface may be visible anywhere: you must not see the inner face of
any stand, the front wall of the terracing, or the sides of the tunnel mouths —
the tunnels read as flat dark slots on the surface of the steps, not as holes
seen from an angle. The near side and the far side of the bowl must look
identical, mirrored about the centre of the pitch, and every ring must be a
perfect concentric ellipse, not leaning outward at the corners.

Keep everything else exactly as it is: the shape, the two rings, the concourse
between them, the bare concrete, the pitch, the ramps, the ring road and the
overcast light. Change only the projection.
```

Duas palavras puxam mais que "top-down": **orthomosaic**, que é o nome do
produto real com essa projeção, e **long telephoto from very high altitude**,
que descreve fisicamente como se mata a divergência em vez de pedir um
resultado abstrato.

E o teste de aceitação é simples e objetivo: **o lado de perto e o lado de
longe têm que ser idênticos, espelhados pelo centro do gramado.** Se um dos
dois mostra mais parede que o outro, sobrou ângulo.

## Rodando com o mapa anexado

O mapa de setores vai junto do prompt, sempre. Isso troca o trabalho de lugar:
o texto para de descrever a forma e passa a garantir o que o mapa **não** diz.

**O que o mapa dá:** contorno da elipse, proporção entre os anéis, onde a
arquibancada é contínua e onde vira fatia, posição do gramado.

**O que o mapa não dá, e o prompt tem que impor:** que é foto e não desenho,
que não há cobertura, que o anel de cima é recuado, que existe fosso com duas
travessia no fosso, que as rampas são caminho, e que o estádio está vazio.

**O erro novo que a anexação cria** é o modelo copiar o mapa: fundo chapado,
setor vermelho, gramado verde-uniforme, contorno branco. Por isso o prompt abre
mandando pegar só a geometria e o negativo lista o vocabulário do mapa
(`flat diagram`, `colour-coded sectors`, `legend`, `flat colour fill`). Se a
primeira saída vier chapada, não mude o prompt — mande a ordem curta:

```
Same layout, but this must be a photograph, not a diagram: real weathered
concrete steps with texture and joints, real grass with mown stripes and worn
patches, real overcast daylight and soft shadows. No flat colour fill, no
coloured sectors, no outlines, no legend, no numbers.
```

**Vale pra qualquer estádio que entrar aqui.** A forma vem do mapa, as regras
de cena vêm do texto, e o negativo segura o desenho.

## Prompt — anel inteiro

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, TRUE ORTHOMOSAIC as if photographed from very high altitude with a long
telephoto lens, zero camera tilt, zero parallax, no perspective distortion, no
vanishing point, verticals collapse to points, no vertical surface visible
anywhere — no inner face of any stand, no front wall of the terracing, no side
of any tunnel mouth; the near side and the far side of the bowl read identical,
mirrored about the centre of the pitch,

this is the MARACANÃ STADIUM in Rio de Janeiro, and the real place is followed
faithfully: its true elliptical plan, the proportion of its rings, its radial
sectors, its external ramps, its esplanade and the real buildings and streets
around it,

ONLY THREE THINGS DEPART FROM REALITY, and nothing else changes:
1. the camera is a strict orthographic nadir orthomosaic, as described above;
2. THE ROOF IS ENTIRELY REMOVED — the elliptical roof ring, its trusses, its
   cables and its masts are gone, so both rings of terracing lie open to the
   sky and are evenly lit from the front row to the back row, with no shadow
   cast over them;
3. the moat and the fence around the pitch run unbroken, with no bridge, ramp,
   gate or crossing of any kind, so the pitch is completely cut off from the
   terracing.

the stadium is a perfect ellipse filling the frame, its long axis running left
to right; in the exact centre a full-size grass pitch with painted white
markings and mown stripes, two white goal frames lying flat in the image with
their shadows beside them, no athletics track,

around the pitch a dry moat and a perimeter wall, then the LOWER RING: a
continuous elliptical band of steps unbroken all the way around with no gap at
any corner, seen from directly above as concentric bands, divided into radial
wedge-shaped sectors by straight stairways running outward like spokes, with
tunnel mouths reading as flat dark slots in the surface of the steps,

between the rings, an OPEN CONCOURSE: a wide elliptical esplanade running the
whole way around, completely open to the sky and plainly visible from above
along its entire length, with flights of stairs rising from it to the upper
ring,

the UPPER RING: a second continuous elliptical band of steps set FURTHER OUT
than the lower ring, standing beyond the concourse and never over it, so that
both rings and the concourse between them are fully visible from directly
above, divided into the same radial sectors,

on the outside of the ellipse, the great external access ramps, one in each
quadrant, seen from above as broad straight slabs rising to the concourse, each
landing on a paved apron,

around the stadium, the real Maracanã complex: the wide paved esplanade ringing
the whole ellipse, large open car parks with cars and coaches parked in marked
bays seen from directly above as roofs only, the round indoor arena standing
just to one side of the stadium shown only as its intact roof, the avenue and
the railway line running past on one side, rows of trees, and beyond them the
dense city blocks of Rio de Janeiro, all of them keeping their roofs intact and
shown only as roof surfaces,

EVERYTHING IS BARE CONCRETE: every stand, every step, every wall, every
stairway, every ramp and every esplanade is grey unpainted cement, weathered
and stained, in a range of greys from pale sun-bleached concrete to dark damp
concrete with rain streaks, moss in the joints and patched repairs; there are
no seats of any colour anywhere — the terracing is plain concrete steps; the
only colours in the whole picture are the green of the grass and the trees, the
white of the painted pitch markings and the dark grey of the asphalt,

photorealistic, natural materials, overcast diffuse daylight, soft shadows,
desaturated muted colors, documentary photography, stained old concrete, worn
grass, 8k satellite imagery quality, sharp detail, completely empty of people,
no spectators, no players, no moving cars
```

## Negativo

```
oblique aerial, bird's eye view, three quarter view, tilted camera, angled
drone shot, perspective view, stand seen from the front, seating rows rising
vertically in the image, far side of the bowl seen from inside, visible façade,
roof offset from its base, leaning stands, vanishing point, wide angle,
fisheye, lens distortion, parallax,

roof, stadium roof, ring roof, covered stand, canopy, awning, cantilever,
cantilevered upper deck, upper tier overhanging the lower tier, ring above
ring, deck over the concourse, sky boxes, executive boxes over the seats,
membrane roof, retractable roof, concourse hidden under the stand, shaded lower
tier, dark lower ring,

rectangular stadium, square bowl, single tier only, one ring only, gaps at the
corners, broken ring, athletics track, running track, olympic stadium,
all-seater arena, coloured plastic seats, world cup arena, european stadium,
footbridge, bridge over the moat, ramp down to the pitch, gate to the pitch,
no tunnels, no ramps,

flat diagram, ticketing map, seating chart, seating map, section numbers,
colour-coded sectors, red sectors, green pitch fill, legend, key, white
outlines around sectors, plain background, vector shapes, flat colour fill,
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, sponsor boards, advertising,
club badges, watermark, grid lines, vignette,
crowd, people, spectators, players, football match, flags, banners, moving cars,
saturated colors, hdr, dramatic lighting, night, floodlit, rain
```

## Sementes pro importador

```python
{'id': 'estadio-maracana', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'estadio_maracana.webp',
 # SEM semente no gramado: ele e ilha. anel inferior, circulacao, anel superior
 'sementes': [(0.42, 0.50), (0.58, 0.50),
              (0.50, 0.34), (0.50, 0.66), (0.30, 0.50), (0.70, 0.50),
              (0.50, 0.26), (0.50, 0.74), (0.22, 0.50), (0.78, 0.50),
              (0.50, 0.16), (0.50, 0.84), (0.14, 0.50), (0.86, 0.50),
              (0.03, 0.50), (0.97, 0.50)],
 'recorte': [(0.00, 0.02, 1.00, 0.98)]},
```

As sementes vão em quatro raios, de dentro pra fora: gramado, anel inferior,
circulação, anel superior. Se o corte fechar um raio, a máscara perdeu um andar
— e num estádio de dois anéis é assim que se descobre que a foto saiu com
balanço.

## Ordem curta de correção

```
Shoot this from exactly overhead, at zenith: the stadium is a perfect ellipse,
every side of the bowl looks the same, each row of steps faces the pitch and no
stand is seen from the front. Remove the roof entirely — no ring roof, no
canopy, no cantilever anywhere — and set the upper ring further out than the
lower one, with a wide open concourse between them that is visible from above
along its whole length. Keep both rings continuous with no gap at the corners,
keep the four external ramps, and keep the moat and fence around the pitch
unbroken, with no bridge or ramp crossing them. No people, no advertising.
```

## Conferir

1. **É uma elipse**, não um retângulo arredondado. Estádio brasileiro de canto
   reto o modelo entrega sozinho, porque é o que ele viu mais.
2. **Os quatro raios aparecem**: anel inferior, circulação, anel superior, e a
   esplanada de fora. Circulação sumida numa faixa escura é balanço, e o anel
   de baixo foi comido.
3. **Sem cobertura em nenhum dos dois anéis** — nem a faixa de laje na última
   fileira.
4. **As quatro rampas existem** e encostam na circulação. São a fuga: elipse
   contínua não tem quina pra escapar.
5. **O fosso é contínuo, sem passarela nem rampa**: o gramado é ilha, e é assim
   que tem que ser.
6. Depois de importar: gramado, degraus, circulação, rampa e esplanada viram
   chão; fosso, alambrado, grade de setor e traves viram parede no pincel.

---

## MINEIRÃO — 60.000

`id: mineirao`, Pampulha, mandante do Cruzeiro. A forma é irmã da do Maracanã e
muda em duas coisas que o mapa mostra: a elipse é **mais alongada**, quase um
retângulo de pontas redondas, e num dos lados o anel inferior é interrompido
por um **cinturão de camarote e cadeira especial** — a faixa que no mapa
aparece separada, entre o gramado e a arquibancada.

**O cinturão de camarote entra como degrau, não como camarote.** Camarote é
sala coberta, e coberta a prumo é telhado: some a fileira de baixo e o
cinturão vira parede atravessando a cena no lado mais disputado. Ele fica como
uma **faixa de piso mais largo** no meio da arquibancada — plataforma de
concreto, sem laje —, e aí ele deixa de ser problema e vira o que é bom pra
briga: um patamar plano no meio dos degraus, onde dá pra segurar linha.

Escala: 60 mil em elipse mais alongada que a do Maracanã, uns **270 × 220 m**.
Cabendo a altura na tela 3:2, o quadro fica em **330 m** — 4,7 px/m, disco de
~3,0 m. Um tico melhor que o Maracanã, mesma conversa: a variante de meio
estádio do fim do arquivo vale aqui igual.

### Prompt

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points,

every object seen only as its top surface: roofs only, vehicle roofs only, no
façades, no building elevations, no side walls, no stand seen from the front,
all sides of the bowl looking alike, nothing leaning outward at the edges of
the frame,

FOLLOW THE ATTACHED SEATING MAP for the shape of the stadium: the outline of
the bowl, how elongated the ellipse is, the proportion between the rings, where
the terracing is continuous and where it is split into sectors, the wide band
that interrupts the lower ring on one side, and the position of the pitch
inside it all come from that reference. Take from it ONLY the plan geometry.
Ignore its colours, its legend, its numbers and its flat diagram look
completely — this is a PHOTOGRAPH of a real concrete stadium, not a drawing of
a map, with real materials, real texture and real daylight,

aerial drone photograph of a huge empty Brazilian football stadium of the old
concrete kind, capacity around sixty thousand, overcast diffuse daylight, soft
shadows, desaturated muted colors, documentary photography, completely empty of
people,

the stadium is a long ELLIPSE seen from directly above, almost a rectangle with
rounded ends, filling the frame with its long axis running left to right; in
the exact centre a full-size grass pitch with painted white markings and mown
stripes, two white goal frames lying flat in the image with their shadows
beside them, and no running track around it,

around the pitch, a dry moat and a perimeter fence, and the moat and the fence run unbroken all the way around the pitch, with no
bridge, no ramp, no gate and no crossing of any kind: from above, the pitch
is completely cut off from the terracing,

the LOWER RING: a band of uncovered concrete steps hugging the pitch, seen from
directly above as concentric bands of parallel steps, evenly lit across its
whole depth, divided into radial wedge-shaped sectors by straight stairways
running outward like spokes, with dark tunnel mouths opening through the steps,

along one long side, the lower ring is interrupted by a WIDE FLAT TERRACE: a
broad level platform of plain concrete set between the pitch and the steps,
completely open to the sky with no roof, no box, no glazing and no structure of
any kind on it, reading from above as a smooth pale band with the steps
resuming behind it,

between the rings, an OPEN CONCOURSE: a wide elliptical concrete esplanade
running the whole way around the stadium, completely open to the sky and
plainly visible from above along its entire length, with flights of stairs
rising from it to the upper ring,

the UPPER RING: a second continuous elliptical band of uncovered concrete steps
set FURTHER OUT than the lower ring, standing beyond the concourse and never
over it, so that both rings and the concourse between them are fully visible
from directly above, divided into the same radial wedge-shaped sectors,

there is no roof anywhere: no canopy, no ring roof, no cantilever, no membrane,
no covered section over either ring, no upper deck overhanging the lower one,
no executive boxes,

on the outside of the ellipse, four large access ramps, one in each quadrant,
seen from above as broad straight concrete slabs rising to the concourse, each
landing on a paved apron outside,

around the whole stadium, an enormous paved esplanade of concrete slabs, then a
ring road circling the ellipse with cars and coaches parked along it seen from
directly above as roofs only, the road running out of frame at the left and
right edges,

EVERYTHING IS BARE CONCRETE: every stand, every step, every wall, every
stairway, every ramp and every esplanade is grey unpainted cement, weathered
and stained, in a range of greys from pale sun-bleached concrete to dark damp
concrete with rain streaks, moss in the joints and patched repairs; there are
no seats of any colour anywhere — the terracing is plain concrete steps; the
only colours in the whole picture are the green of the grass, the white of the
painted pitch markings and the dark grey of the asphalt outside,

photorealistic, natural materials, sun-bleached concrete, stained old concrete,
worn grass, tropical Brazil, Belo Horizonte, 8k satellite imagery quality,
sharp detail, no people visible, no spectators, no players
```

### Negativo

O mesmo do Maracanã, mais o cinturão:

```
executive boxes, hospitality boxes, glazed boxes, box tier, roofed terrace,
covered platform, structure on the terrace, seats on the terrace,
```

### Sementes pro importador

```python
{'id': 'estadio-mineirao', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'estadio_mineirao.webp',
 # SEM semente no gramado: o patamar do cinturao, anel inferior, circulacao, superior
 'sementes': [(0.42, 0.50), (0.58, 0.50),
              (0.50, 0.63), (0.50, 0.36), (0.50, 0.70),
              (0.28, 0.50), (0.72, 0.50), (0.50, 0.24), (0.50, 0.78),
              (0.20, 0.50), (0.80, 0.50), (0.50, 0.14), (0.50, 0.87),
              (0.03, 0.50), (0.97, 0.50)],
 'recorte': [(0.00, 0.02, 1.00, 0.98)]},
```

### Conferir

Tudo do Maracanã, mais um item, e ele é o primeiro:

1. **O cinturão é chão, não sala.** Nenhuma laje, nenhum vidro, nenhuma cabine
   em cima dele. Se vier coberto, aquela faixa vira parede atravessando o lado
   mais disputado da cena — e é o lado onde os dois bondes se encontram.
2. A elipse é **alongada**, quase retângulo de pontas redondas: o Mineirão não
   é redondo como o Maracanã, e é isso que distingue os dois de cima.

## Variante — meio estádio

Mesma imagem, dobro da escala. Troque a linha da elipse por:

```
the frame shows ONE HALF of a huge oval Brazilian football stadium seen from
directly above, cut across the middle of the pitch: one goal end and the two
side stands up to the halfway line, the ellipse curving out of frame at the
right edge,
```

e tire da última seção a esplanada de fora, deixando só a faixa de rua na
borda. O disco volta a 1,8 m — o mesmo da cena de 40 mil —, e a briga vira o
que ela é na prática: **setor contra setor**, e não estádio contra estádio.
