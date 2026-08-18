# Prompts das cenas que faltam — treta 5×5, 7×7 e 10×10, estrada e loja

Seis imagens, no mesmo acabamento das cinco que já estão no jogo
(`praca.webp`, `rua.webp`, `rua_media.webp`, `rua_nobre.webp`, `bar.webp`):
**foto de drone a prumo, dia nublado, cor dessaturada, cidade brasileira, sem
uma alma viva no quadro**. Quem aparece na cena são os discos, desenhados por
cima — foto com gente vira gente parada no meio da briga.

| Cena | Pra que serve | Saída pro jogo | Estado |
|---|---|---|---|
| Treta 5×5 — vila | encontro de bonde pequeno, favela e classe baixa | `treta_vila.webp` | a fazer |
| Treta 7×7 — quadra de terra | encontro médio, qualquer bairro de periferia | `treta_quadra.webp` | a fazer |
| Treta 10×10 — pátio do galpão | encontro grande, borda de bairro | `treta_patio.webp` | a fazer |
| Estrada 1 — pista entre muros | emboscada na caravana | `estrada.webp` | a fazer |
| Estrada 2 — posto sem teto | emboscada na caravana (variação) | `estrada_posto.webp` | a fazer |
| Loja da rival | ação *atacar a loja* | `loja.webp` | a fazer |

As três primeiras são leitura da tua ideia de treta por tamanho: **o que muda
entre 5×5, 7×7 e 10×10 não é o zoom da foto, é quanto chão livre a cena tem**.
A tela da briga é sempre a mesma, 1536×1024, e o disco tem 7 px de raio — dez
discos numa esplanada ficam se procurando, vinte discos num corredor de vila
travam encavalados. Por isso cada tamanho ganhou um lugar de porte diferente,
e não a mesma praça vista de mais perto.

## O que vale pras seis (isto é regra de jogo, não gosto)

A imagem vira o chão da cena: `importar_cena_foto.py` tira a máscara de
caminhabilidade da própria foto, e o que a foto fechar o disco não atravessa.

- **enquadramento a prumo** (nadir, 90°). Sem horizonte, sem perspectiva, sem
  inclinar. É o erro nº 1 do ChatGPT nessas cenas: ele entrega uma vista
  oblíqua bonita e inútil, e a versão disfarçada dele — a câmera alta mas
  torta uns graus — passa batida. Tem seção só pra isso: **Zênite de
  verdade**, e o bloco de lá abre os seis prompts;
- **16:9**. O importador encaixa a largura inteira em 1536 px e a foto vira
  1536×864 dentro da tela de 1024 — sobram **80 px de faixa de quintal em cima
  e embaixo**. Nada que o jogador precise pisar pode encostar na borda de cima
  ou de baixo: o que estiver lá fica na faixa morta. **Toda saída importante sai
  pela esquerda ou pela direita**;
- **mesma altura de voo das cinco atuais**: o quadro cobre uns 80 metros de
  largura. A régua pra conferir é a pista: uma rua de duas mãos tem ~7 m e
  ocupa cerca de um oitavo da altura do quadro. Voar mais alto encolhe a briga
  a formiga; mais baixo, o bonde não cabe;
- **nenhuma pessoa, nenhum carro andando**. Carro parado pode: vira obstáculo;
- **dois caminhos de entrada opostos e pelo menos uma fuga**, sempre chegando
  na borda esquerda ou direita. Cena com um vão só trava a briga numa chacina;
- **nada por cima do chão de andar**: o céu é o teto. Laje vista a prumo é
  telhado, e telhado é parede — viaduto, passarela, marquise e toldo escondem
  justamente o chão que o disco ia pisar, e isso não tem conserto no pincel,
  porque o que estava embaixo não foi fotografado. A única exceção é a laje
  removida de propósito — na loja, no posto e no bar, onde a briga entra;
- **chão útil ocupa o quadro**. Mato, terreno vago e telhado de vizinho que
  ninguém pisa são tela jogada fora: a briga se espreme numa faixa e o resto
  da imagem é enfeite. Fechar a cena com muro, quarteirão ou fachada é o que
  faz a tela inteira valer;
- **o chão de andar tem que ser uma mancha contínua**. Ilha de chão cercada de
  parede é ilha de disco preso.

## Zênite de verdade (o erro que passa despercebido)

"Top-down" o modelo entende; **zênite** ele não entrega sozinho. A foto sai de
uma câmera alta, mas inclinada uns graus — e aí quanto mais longe do centro do
quadro, mais o objeto deita pra fora. Os tells são sempre os mesmos:

- **fachada à vista.** Se dá pra ver a porta de enrolar, a parede da frente ou
  a lateral de um prédio, a câmera estava torta;
- **telhado deslocado da base.** A laje aparece escorregada pro lado do próprio
  pé;
- **veículo de perfil.** Ônibus mostrando a lateral inteira, carro mostrando
  para-brisa e roda do outro lado;
- **coisa deitando pra fora nas bordas.** No meio do quadro parece certo, na
  beirada não.

E não é frescura de enquadramento: **parallax esconde chão**. A parte do pátio
que fica atrás do galpão inclinado nunca foi fotografada, o importador lê a
fachada como se fosse piso e o disco anda por cima de parede. É o mesmo
problema do viaduto, só que disfarçado.

### Bloco de zênite — abre qualquer um dos seis prompts

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points,

every object seen only as its top surface: roofs only, vehicle roofs only, no
façades, no building elevations, no side walls, no visible fronts of anything,
nothing leaning outward at the edges of the frame,
```

### Negativo de zênite — entra no negativo de todas

```
oblique aerial, bird's eye view, three quarter view, tilted camera, angled
drone shot, perspective view, visible façade, visible building side, visible
wall elevation, roof offset from its base, leaning buildings, vehicles seen
from the side, windscreen visible, car front visible, vanishing point,
wide angle, fisheye, lens distortion, parallax
```

### Ordem curta — pra imagem que já saiu quase certa

Vale mais que refazer: aproveita o traçado que deu certo e mexe só na câmera.

```
Re-render this exact same scene from a TRUE NADIR viewpoint: the camera is
directly overhead, its optical axis perfectly perpendicular to the ground,
pointing straight down at 90 degrees, like an orthophoto or a cadastral aerial
survey.

Every single element must be seen from exactly above, at zenith, with no
parallax and no tilt anywhere in the frame:
- no façade, no side wall, no building elevation is visible — buildings show
  only their roof outline, and each roof sits exactly on top of its own
  footprint, not offset to one side;
- the bus, the cars and the lorry show only their roofs; no windscreen, no
  flank, no wheels on the far side, no front or rear face;
- the canopies, the poles, the tyre stacks and the water tanks show only their
  top surfaces;
- objects near the edges of the frame stand perfectly upright, not leaning
  outwards; verticals project to a point, not to a line;
- shadows may fall to one side, but nothing leans with them.

Keep the layout, the buildings, the vehicles, the ground, the road and the
overcast lighting exactly where they are. Change only the camera: straight
down, zenith, orthographic, zero tilt.
```

**Nas três cenas de laje removida** (bar, loja, posto) o zênite tem um sinal
próprio: parede vista de cima é uma **linha grossa**, e o piso inteiro aparece
com a mesma luz do chão de fora. Se a parede interna da lojinha aparecer "por
dentro", a câmera voltou a inclinar — e o que estava atrás dela sumiu.

## Como rodar no ChatGPT e no Flow

As cinco cenas atuais nasceram de planta com ControlNet. **Estas seis não têm
planta** — não existe geometria de colisão pra respeitar ainda, porque a cena
não foi escrita em `dados/cenas.js`. Então aqui a ordem se inverte: a foto vem
primeiro e a geometria sai dela.

- **ChatGPT (GPT Image)** — cole o prompt inteiro e peça 16:9. Ele ignora
  negativo escrito em bloco, então o que é proibido está repetido em positivo
  dentro do prompt ("empty of people", "no roof at all"). Se vier torto, não
  reescreva o prompt: mande a ordem curta de correção que está no fim de cada
  cena, com a imagem anexada;
- **Google Flow** — gera em 16:9 nativo, e o **Nano Banana** é melhor que
  qualquer prompt novo pra consertar imagem que já saiu quase certa: ele
  aproveita o enquadramento que deu certo. Ordem curta, negativa, uma coisa por
  vez;
- **duas passadas**: uma pro traçado, uma de upscale só pra textura. Guarde o
  PNG/JPEG grande em `img/cenas/` — o importador cuida do resto e escreve o
  `.webp`;
- depois de escolher a imagem, **acrescente a entrada dela em `FONTES`**, no
  `ferramentas/importar_cena_foto.py`. As sementes de cada cena estão escritas
  abaixo, em fração da tela, prontas pra colar;
- rode `python3 ferramentas/importar_cena_foto.py`, confira
  `img/cenas/_ref_mascara_<cena>.png` (claro = anda, escuro = parede) e
  termine no pincel: `arredores.html`, **F2**, exportar, `colar_remendo.py`.
  As cinco cenas atuais precisaram disso, todas as cinco. Estas vão precisar
  também — em cena sem planta o corte erra mais, não menos.

Falta ainda, e não é imagem: cada uma dessas cenas precisa de entrada em
`dados/cenas.js` com `spawns`, `saida` e `gatilho` — os pontos sugeridos em
cada seção são pra isso.

---

## TRETA 5×5 — vila

Dez discos. O lugar é **estreito de propósito**: uma vila de casas geminadas,
com o corredor de cimento no meio e os dois portões nas pontas. Ninguém
flanqueia, ninguém corre em círculo — encosta e resolve. Chão livre alvo:
uns 25 × 8 metros.

A geometria que a briga precisa: **corredor atravessando o quadro da esquerda
pra direita**, portão de grade aberto em cada ponta chegando na borda, e um
**alargamento no meio** (o pátio de tanque de lavar roupa) que é onde os dois
bondes se encontram. Os vãos entre as casas são becos sem saída — servem pra
encurralar, e é bom que sirvam.

Spawns sugeridos: `mandante1` (110, 512) e `visitante1` (1426, 512), um em cada
portão; `saida` pelo portão de quem chegou.

```
top-down nadir aerial drone photograph of a narrow residential alley courtyard
inside a Brazilian working-class housing row, shot straight down at 90 degrees,
orthographic feel, overcast diffuse daylight, soft shadows, desaturated muted
colors, documentary photography, the place is completely empty of people,

one long concrete corridor running left to right across the whole frame,
roughly four metres wide, cracked cement floor with a shallow drainage channel
down the middle, patches of bare earth, weeds in the joints, oil stains,

the corridor opens wider at the centre of the frame into a small square yard
about eight metres across: bare cement, two concrete laundry sinks against the
wall, a clothes line strung across it, a stack of plastic chairs, a blue water
drum, an old fridge left outside,

a wide open metal gate at each end of the corridor, both standing open, each
one reaching the left and right edge of the frame so the alley continues out of
the picture on both sides,

two rows of small attached houses facing each other along the corridor, walls
of unpainted cinder block and cracked plaster, terracotta clay tile roofs and
flat concrete rooftops, blue water tanks, satellite dishes, tangled electric
wires overhead, laundry hanging from a few windows, graffiti tags on the lower
walls, three narrow dead-end gaps between houses branching off the corridor,

photorealistic, natural materials, sun-bleached concrete, tropical northeast
Brazil, 8k satellite imagery quality, sharp detail, no people visible, no cars
```

### Negativo

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, eye level, fisheye, vignette,
wide street, avenue, asphalt road, sidewalk, parked cars, moving cars,
closed gates, walled dead end at the frame edge, blocked corridor,
crowd, people, pedestrians, children playing, laundry workers,
saturated colors, hdr, dramatic lighting, night, rain, snow
```

### Sementes pro importador

```python
{'id': 'treta-vila', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'treta_vila.webp',
 'sementes': [(0.50, 0.50), (0.20, 0.50), (0.80, 0.50),
              (0.02, 0.50), (0.98, 0.50)],
 'corredor': True},
```

### Ordem curta de correção (Flow / Nano Banana)

```
Open both end gates of the alley completely and extend the concrete corridor
all the way to the left and right edges of the image, so it runs out of frame
on both sides. Widen the middle of the corridor into a small open yard. Keep
the houses, the roofs and the lighting exactly as they are. No people anywhere.
```

### Conferir

1. O corredor chega **aberto** nas duas bordas laterais. Portão fechado numa
   ponta é bonde nascendo dentro de parede.
2. O alargamento do meio existe e é chão liso — é ali que a briga cai.
3. Nenhum beco lateral atravessa até a borda: eles são cegos de propósito.

---

## TRETA 7×7 — quadra de terra

Catorze discos. Um campinho de terra batida murado, desses de fim de rua: o
chão livre é grande o bastante pra abrir e cercar, e o muro impede que a treta
vire perseguição pela cidade. Chão livre alvo: uns 40 × 25 metros.

Geometria: **quadra retangular no meio do quadro**, vão de entrada no muro da
esquerda e outro no da direita, os dois alinhados com a rua que passa fora, e
**um rasgo no muro do fundo** (buraco de tijolo derrubado) que é a terceira
saída — a de quem apanha. As traves e o poste de luz ficam dentro como
obstáculo.

Spawns sugeridos: `mandante1` (120, 512) e `mandante2` (400, 860);
`visitante1` (1416, 512) e `visitante2` (1140, 164).

```
top-down nadir aerial drone photograph of a small walled dirt football pitch at
the edge of a Brazilian working-class neighbourhood, shot straight down at 90
degrees, orthographic feel, overcast diffuse daylight, soft shadows,
desaturated muted colors, documentary photography, completely empty of people,

a large rectangular pitch of bare packed reddish earth filling most of the
frame, worn bald patches, faint chalk lines almost erased, tufts of dry grass
along the edges, two rusty metal goal frames without nets facing each other,
one leaning concrete floodlight pole with a single lamp,

a low boundary wall of unpainted cinder block runs around the pitch, about two
metres high, covered in faded graffiti and faded political slogans,

a wide gap in the wall on the left side and another wide gap on the right side,
both fully open, each aligned with a strip of asphalt street that reaches the
left and right edges of the frame, and a third smaller breach in the wall at
the top where the blocks have collapsed into a pile of rubble,

around the pitch: a narrow dirt street with parked motorbikes and one old car,
low houses with terracotta clay tile roofs and flat concrete rooftops, blue
water tanks, laundry lines, a small corner shop with a metal shutter, a rubbish
pile, two mango trees casting soft shade outside the wall,

photorealistic, natural materials, sun-bleached concrete, tropical northeast
Brazil, 8k satellite imagery quality, sharp detail, no people visible
```

### Negativo

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, eye level, fisheye, vignette,
green grass pitch, artificial turf, painted lines, stadium, bleachers, stands,
fence netting, closed wall, unbroken wall, no gates, blocked entrances,
crowd, people, players, football match, spectators, moving cars,
saturated colors, hdr, dramatic lighting, night, rain, floodlit
```

### Sementes pro importador

```python
{'id': 'treta-quadra', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'treta_quadra.webp',
 'sementes': [(0.50, 0.50), (0.30, 0.50), (0.70, 0.50),
              (0.02, 0.50), (0.98, 0.50), (0.50, 0.12)],
 'recorte': [(0.00, 0.10, 1.00, 0.95)]},
```

### Ordem curta de correção

```
Knock a wide open gap through the boundary wall on the left side and another on
the right side, both reaching the edges of the image, and leave a smaller
collapsed breach in the top wall. Keep the dirt pitch, the goals and the houses
exactly as they are. Nobody in the picture.
```

### Conferir

1. Os dois vãos laterais estão abertos **até a borda** do quadro.
2. O miolo da quadra é terra limpa: sem canteiro, sem poça, sem entulho no meio.
3. As traves e o poste continuam sendo obstáculo pintado no chão — depois de
   importar, marque as três no pincel, senão o disco atravessa a trave.

---

## TRETA 10×10 — pátio do galpão

Vinte discos. O maior dos três: o pátio de carga de um galpão desativado na
borda do bairro — chão de cimento aberto de ponta a ponta, com **pilha de
palete, contêiner e caminhão morto como obstáculo solto no meio**. É a treta
que se abre: dá pra cercar, dá pra correr, dá pra perder gente atrás de uma
pilha. Chão livre alvo: uns 60 × 35 metros.

**Aqui não entra viaduto, e o motivo é da máscara.** Laje vista a prumo é
telhado, e telhado é parede: a pista do viaduto tapa justamente o chão que
está embaixo dela, e nem o importador nem o jogador enxergam o que passa ali.
Cena de briga não pode ter nada por cima do chão de andar — **o céu é o teto,
e é só ele**. A mesma regra derruba marquise, galpão com telhado no meio do
pátio e passarela atravessando o quadro.

Geometria: **pátio retangular ocupando quase todo o quadro**, murado, com
portão de caminhão aberto na esquerda e outro na direita, os dois chegando na
borda; o galpão em si é a fileira de cima, **de telhado inteiro e fechado** —
ele é o fundo da cena, não se entra nele. Os obstáculos ficam espalhados pelo
miolo, nunca encostados uns nos outros: entre eles é que se corre.

Spawns sugeridos: `mandante1` (110, 512) e `mandante2` (320, 900);
`visitante1` (1426, 512) e `visitante2` (1220, 200).

```
top-down nadir aerial drone photograph of the open loading yard of a disused
warehouse on the edge of a Brazilian city district, shot straight down at 90
degrees, orthographic feel, overcast diffuse daylight, soft shadows,
desaturated muted colors, documentary photography, completely empty of people,

a very large open yard of cracked concrete and gravel filling most of the
frame, entirely open to the sky with nothing above it, faded painted lane
markings, oil stains, weeds growing through the cracks, patches of bare reddish
earth, tyre tracks,

scattered across the open yard, well apart from each other, seen from directly
above: two rusted shipping containers, three stacks of wooden pallets, an
abandoned flatbed lorry with no wheels, a pile of sand, four oil drums, a
concrete pipe, a skip full of scrap; the ground stays clear and continuous
between them,

a long single-storey warehouse building closes the top side of the yard, its
corrugated zinc roof completely intact and unbroken, three closed loading dock
doors along its front wall and a small office annex at one end,

a boundary wall of cinder block runs around the rest of the yard, with a wide
lorry gate standing open on the left side and another wide gate standing open
on the right side, each one meeting a strip of asphalt street that reaches the
left and right edge of the frame, and a collapsed section of wall at the bottom
where the blocks have fallen into a pile of rubble,

outside the wall: a dirt street, low houses with terracotta clay tile roofs and
flat concrete rooftops, blue water tanks, sparse scrub bushes and two mango
trees, a parked motorbike,

photorealistic, natural materials, sun-bleached concrete, rusted metal,
tropical Brazil, 8k satellite imagery quality, sharp detail, no people visible
```

### Negativo

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, eye level, fisheye, vignette,
overpass, viaduct, elevated road, bridge, footbridge, walkway over the yard,
canopy, awning, marquee, roof over the yard, covered loading bay, shed in the
middle, gantry crane, pylons, power lines across the yard, big shadow over the
ground,
clutter filling the yard, containers stacked in rows, full car park, busy
depot, closed gates, unbroken wall, fenced dead end,
crowd, people, workers, forklift drivers, moving lorries, tents,
dense trees, forest, mud, flooding,
saturated colors, hdr, dramatic lighting, night, rain
```

### Sementes pro importador

```python
{'id': 'treta-patio', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'treta_patio.webp',
 'sementes': [(0.50, 0.55), (0.25, 0.55), (0.75, 0.55),
              (0.50, 0.80), (0.02, 0.50), (0.98, 0.50)],
 'recorte': [(0.00, 0.22, 1.00, 1.00)]},
```

### Ordem curta de correção

```
Remove anything that passes above the yard — no overpass, no walkway, no canopy
and no roof over the open ground. The whole yard must be open to the sky in
flat daylight. Keep the warehouse roof at the top intact. Spread the
containers, pallets and the abandoned lorry apart, leaving clear concrete
between them. Open both lorry gates all the way to the left and right edges of
the image. No people.
```

### Conferir

1. **Nada por cima do pátio.** Viaduto, passarela, marquise, cabo grosso: tudo
   que passa acima esconde o chão e vira parede na máscara. Se aparecer, é
   refazer — não tem conserto no pincel, porque o que estava embaixo não foi
   fotografado.
2. O telhado do galpão está **inteiro**. Galpão aberto vira chão de andar onde
   não devia, e a briga escapa pra dentro dele.
3. Os dois portões chegam abertos até as bordas laterais.
4. Os obstáculos estão soltos e separados: encostados uns nos outros viram um
   muro só no meio do pátio e cortam a cena em duas.
5. Depois de importar, marque contêiner, palete, caminhão, tambor e caçamba no
   pincel — o corte por cor tende a ler pilha clara como chão.

---

## ESTRADA 1 — pista entre muros

A emboscada hoje **abre a rua de classe baixa emprestada** (§8.21 do resumo),
porque cena de rodovia não existe. Esta é ela. Papéis invertidos: o ônibus
fechado é o `mandante` — quem embarcou na caravana —, e o bonde que fechou a
pista é o `visitante`.

**Não é a estrada no meio do sertão.** Mato dos dois lados é bonito e é chão
morto: metade da tela vira cenário que ninguém pisa, e a briga se espreme numa
faixa de asfalto. Aqui a rodovia passa **num trecho murado de zona
industrial** — muro alto dos dois lados, acostamento largo de terra batida
encostando neles. O muro faz o que o mato não fazia: fecha a cena, mantém os
dois bondes dentro do quadro e transforma o quadro inteiro em chão de briga.

Geometria: **pista de duas mãos atravessando o quadro da esquerda pra
direita**, acostamento largo dos dois lados, **muro contínuo acompanhando os
dois acostamentos** — o corredor murado ocupa pelo menos dois terços da altura
do quadro, e sobra só uma tira fina de telhado nas bordas de cima e de baixo,
que caem na faixa morta do importador de qualquer jeito. No meio, **o ônibus de
excursão parado atravessado** e dois carros fechando a pista. A pista continua
aberta nas duas bordas laterais: é por ali que se foge, dos dois lados. Um
**portão de serviço aberto no muro** de cada lado é a fuga curta de quem não
alcança a ponta.

O ônibus e os carros são obstáculo: depois de importar, viram parede no
pincel, senão o disco atravessa o ônibus.

Spawns sugeridos: `mandante1` (760, 512) — colado no ônibus, é de lá que a
caravana desce — e `mandante2` (900, 570); `visitante1` (1340, 512) e
`visitante2` (1180, 620), atrás do bloqueio.

```
top-down nadir aerial drone photograph of a two-lane road running through a
walled industrial stretch on the outskirts of a Brazilian city, shot straight
down at 90 degrees, orthographic feel, overcast diffuse daylight, soft shadows,
desaturated muted colors, documentary photography, no people anywhere,

one two-lane asphalt road running left to right across the whole frame, worn
dark asphalt, faded white edge lines and a broken centre line, patched repairs,
a wide flat shoulder of packed earth and gravel on both sides,

a long continuous concrete boundary wall runs along each shoulder, on both
sides of the road, about three metres high, stained and covered in faded
graffiti, topped with barbed wire in places; the walled corridor of road and
shoulders fills at least two thirds of the height of the frame,

a service gate stands open in the wall on the upper side and another open gate
in the wall on the lower side, each showing a short strip of bare yard behind
it,

parked in the middle of the frame, a large old intercity coach bus stopped at
an angle across the road, its doors on the shoulder side, and two battered cars
stopped nose to nose across the lanes just ahead of it, a scatter of stones on
the asphalt, a rusted skip and a stack of pallets on the shoulder, a leaning
lamp post,

the road stays completely clear and open at the left edge and at the right edge
of the picture,

beyond the walls, only a thin strip along the very top and bottom edges of the
frame: the flat roofs and rusted zinc roofing of warehouses, a couple of parked
lorries,

photorealistic, natural materials, sun-bleached concrete, dusty asphalt,
tropical Brazil, 8k satellite imagery quality, sharp detail, no people visible,
no moving traffic
```

### Negativo

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, eye level, fisheye, vignette,
open countryside, scrubland, caatinga, fields, desert, wide empty landscape,
dense trees, forest, grass verges, hills, river, dirt road,
motorway, four lanes, divided highway, overpass, viaduct, bridge, tunnel,
canopy, walkway over the road, power lines across the road,
crash, fire, smoke, wreckage, blood, police, ambulance,
crowd, people, passengers, drivers, moving cars, traffic queue,
saturated colors, hdr, dramatic lighting, night, rain, snow
```

### Sementes pro importador

```python
{'id': 'estrada', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'estrada.webp',
 'sementes': [(0.15, 0.50), (0.85, 0.50), (0.02, 0.50), (0.98, 0.50),
              (0.50, 0.32), (0.50, 0.68)],
 'corredor': True},
```

### Ordem curta de correção

```
Put a tall continuous concrete wall along both shoulders of the road, running
the full width of the image, and make the walled corridor of road and shoulders
fill most of the frame — leave only a thin strip of warehouse roofs at the top
and bottom edges. Remove all open countryside and vegetation. Keep the road
completely open and clear at the left and right edges, and leave the coach bus
parked across the middle with two cars in front of it. No people, no fire, no
wreckage.
```

### Conferir

1. **O corredor murado ocupa o quadro.** Se sobrar mato ou terreno vazio nas
   bordas, a cena perde tela: aquilo não é chão de andar nem é obstáculo, é
   nada.
2. **As duas pontas da pista estão livres.** É a fuga dos dois lados; estrada
   fechada nas bordas trava a cena numa chacina.
3. O acostamento é largo e liso — é o chão útil da briga, a pista sozinha é
   estreita demais pra vinte discos.
4. O muro é contínuo, com **só os dois portões** abertos. Muro esburacado vira
   fuga por todo lado e a emboscada deixa de ser emboscada.
5. Nada de acidente: a emboscada é bloqueio, não capotamento. Ferragem
   retorcida vira geometria ilegível na máscara.
6. Marque ônibus, carros, caçamba e paletes como parede no F2.

---

## ESTRADA 2 — posto de gasolina sem teto

A variação, e a mais fechada das duas: um posto de beira de estrada **murado**,
com o ônibus da caravana parado no pátio. Aqui vale a regra do bar e da loja ao
contrário do que o instinto pede — **a cobertura das bombas não fica menor, ela
some**: cobertura vista a prumo é telhado, e telhado é parede justamente no
lugar onde a briga se decide. As bombas ficam, a laje sobre elas não.

E a lojinha de conveniência entra no molde do bar: **sem laje, salão inteiro à
vista**, porque a briga termina lá dentro — é pra onde corre quem está
perdendo.

Geometria: **pátio de cimento ocupando quase todo o quadro**, murado nos três
lados, com a pista passando rente à borda de baixo e **duas bocas largas**
ligando pátio e pista, uma em cada ponta. A lojinha e a borracharia fecham a
borda de cima, sem laje. Ilhas de bomba no meio do pátio como obstáculo, a
pista aberta nas duas bordas laterais.

Spawns sugeridos: `mandante1` (700, 420) e `mandante2` (520, 340), no pátio
junto do ônibus; `visitante1` (1300, 760) e `visitante2` (1120, 820), chegando
pela pista.

```
top-down nadir aerial drone photograph of a small walled roadside petrol
station on a Brazilian highway, with every roof and canopy removed, shot
straight down at 90 degrees, orthographic feel, overcast diffuse daylight, soft
shadows, desaturated muted colors, documentary photography, completely empty of
people,

THERE IS NO CANOPY OVER THE FUEL PUMPS. No roof, no slab, no beam, no overhang
anywhere above the forecourt — the whole yard is open to the sky and evenly
lit. Two low concrete pump islands stand bare in the middle of the yard, each
with two fuel pumps and a small bollard, plainly visible from directly above,

a large concrete forecourt fills most of the frame, cracked slabs, faded
painted lanes and arrows, oil stains, a drain grate, a water hose reel, a stack
of tyres and two oil drums against the wall,

a cinder block boundary wall closes the yard on the left, right and top sides,
about two metres high, faded graffiti, with a single open service gate in the
left wall,

along the top of the yard, a low building whose roof has also been completely
removed, so its whole floor is visible from above wall to wall, evenly lit,
with no shaded strip along the edges: a small convenience shop with shelves of
goods, a counter with a cash register, a chest freezer and a doorway to a
storeroom, and next to it a tyre repair bay with a workbench, a compressor and
stacked tyres inside,

along the bottom edge of the frame, a strip of two-lane asphalt road running
from the left edge to the right edge, worn asphalt and faded markings, with two
wide open driveway entrances connecting the road to the forecourt, one near the
left end and one near the right end, a low kerb between them,

an old intercity coach bus parked on the open forecourt, one battered car
stopped at an angle near the driveway, a light pole,

nothing else is visible beyond the walls except a thin strip of ground at the
very top edge,

photorealistic, natural materials, sun-bleached concrete, dusty asphalt,
tropical Brazil, 8k satellite imagery quality, sharp detail, no people visible,
no moving traffic
```

### Negativo

```
fuel canopy, petrol station roof, awning over the pumps, shelter over the
forecourt, marquee, pergola, covered fuelling area, roof over the shop, partial
roof, half roof, roof ring, eaves, overhang, veranda, porch, covered edge,
shaded interior, dark interior, unlit corners, walls hiding the floor,

open countryside, scrubland, fields, wide empty landscape, dense trees, forest,
motorway, four lanes, overpass, viaduct, bridge, city block, shopping mall,
modern service station, brand signage, logos, brand names, price signs,
full car park, many parked cars, tanker truck, fire, smoke, fuel spill,
explosion,

illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, eye level, fisheye, vignette,
crowd, people, drivers, attendants, moving cars,
saturated colors, hdr, dramatic lighting, night, rain
```

### Sementes pro importador

```python
{'id': 'estrada-posto', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'estrada_posto.webp',
 # o pátio, as duas bocas, a pista de baixo e o salão da lojinha
 'sementes': [(0.50, 0.50), (0.25, 0.52), (0.75, 0.50),
              (0.50, 0.88), (0.02, 0.88), (0.98, 0.88),
              (0.15, 0.72), (0.85, 0.72),
              (0.35, 0.20), (0.62, 0.20)],
 'recorte': [(0.00, 0.78, 1.00, 1.00),
             (0.04, 0.10, 0.96, 0.78)]},
```

### Ordem curta de correção

```
Remove the canopy over the fuel pumps completely — no roof, no beams, no
overhang above the forecourt — and leave the bare pump islands standing on
concrete open to the sky. Remove the roof of the shop as well and cut its walls
down to knee height, so its whole floor is visible from above, wall to wall,
evenly lit, showing the shelves, the counter and the freezer. Keep the boundary
wall around the yard and the road along the bottom edge, open at both ends of
the image. No people.
```

### Conferir

1. **Nenhuma cobertura sobre o pátio.** A laje das bombas é o erro que o modelo
   comete sozinho — ele entende "posto" e desenha a cobertura. Se vier, é
   refazer ou mandar a ordem curta: o que fica embaixo dela não foi
   fotografado.
2. **O salão da lojinha inteiro à vista**, de parede a parede. Olhe a beirada,
   não o meio: faixa coberta rente à parede esconde balcão e freezer.
3. As duas bocas ligam pátio e pista, e a pista sai pelas duas bordas laterais.
4. O muro fecha os outros três lados, com um portão só.
5. Ônibus, carro, ilhas de bomba, pilha de pneu, tambor, balcão e freezer viram
   parede no pincel.
6. Sem marca de posto, sem placa de preço: o build não leva logotipo de
   ninguém.

---

## LOJA DA RIVAL

Irmã da cena do bar, e pela mesma razão: a ação *atacar a loja* termina com o
líder entrando na loja e tomando o salão, e **não dá pra jogar o que não se
vê**. Então a foto é de drone a prumo como as outras, com o detalhe de maquete:
**a laje da loja foi tirada e o salão aparece inteiro por dentro**, com balcão,
arara de camisa, prateleira e depósito.

O erro que o modelo comete sozinho é tirar só o miolo do telhado e deixar o
beiral em volta — sobra uma coroa coberta rente às paredes, e é justamente ali
que ficam o balcão e as prateleiras. Meia laje não serve: o que fica na sombra
da beirada some da máscara e vira parede dentro do jogo, num canto que o
jogador precisa ocupar. **Só a loja.** Toda vizinhança continua de telhado
fechado, senão o bonde passa a atravessar sala de estranho.

Geometria: rua de comércio atravessando o quadro da esquerda pra direita,
calçada larga dos dois lados, a loja no meio da fileira do lado de cima. A
**porta de vidro é o único vão na fachada** — é por ela que a visão passa, é o
que segura os donos da casa sem saber do ataque antes da hora.

Spawns sugeridos: `mandante1` (200, 700) e `mandante2` (360, 780), chegando
pela calçada; `visitante1` (768, 300) e `visitante2` (900, 250), dentro da loja.

```
top-down nadir aerial drone photograph of a Brazilian commercial street with a
supporters' merchandise shop whose roof has been completely removed, shot
straight down at 90 degrees, orthographic feel, overcast diffuse daylight, soft
shadows, desaturated muted colors, documentary photography, empty of people,

THE SHOP HAS NO ROOF AT ALL. Not a single roof tile, slab, beam, eave or
overhang is left anywhere over it. Its walls are cut off at knee height, so
that from directly above the whole floor of the shop is visible corner to
corner, wall to wall, with nothing shading or hiding any part of it — an
architectural cutaway model of this one building, open to the sky, every square
metre of its floor lit by the same flat daylight as the street outside,

inside the shop, all of it plainly visible from above: pale ceramic tiled
floor, a long glass display counter near the entrance with a cash register on
it, two free-standing clothes rails full of football shirts, wall shelving
units stacked with folded shirts, caps and scarves, a folded flag on a table, a
small round rack of keyrings, two fitting cubicles in a corner, a doorway at
the back into a small stockroom whose floor is also visible with cardboard
boxes stacked in it, the front wall of the shop opening onto the sidewalk
through a wide glass double door, which is the only opening in that wall,

one two-lane street running left to right across the whole frame, worn dark
asphalt, faded yellow centre line, painted black-and-white curbs, wide concrete
sidewalks on both sides, a zebra crossing, cars parked along the curb, a rubbish
skip,

on the sidewalk in front of the shop: a painted sign board, two concrete
planters, a lamp post, a rolled-up metal shutter above the door,

every other building in the frame keeps its roof completely intact: a row of
small shops with flat concrete roofs and terracotta clay tiles, blue water
tanks, air-conditioning units, satellite dishes, small back yards of bare
packed earth behind them,

the shop is the only building in the whole picture without a roof, and it is
open all the way to its walls — no covered strip, no shaded edge, no part of
its interior hidden,

photorealistic, natural materials, sun-bleached concrete, tropical northeast
Brazil, 8k satellite imagery quality, sharp detail, no people visible
```

### Negativo

```
roof over the shop, partial roof, half roof, remaining roof section, roof ring,
eaves, overhanging roof, roof overhang, veranda, pergola, canopy, awning over
the interior, marquee, porch, covered walkway, covered perimeter, covered edge,
shaded interior, dark interior, unlit corners, atrium, only the centre open,
walls hiding the floor, tall walls casting shadow inside,

all roofs removed, every building open, doll house, whole block cutaway,
neighbours without roofs, closed metal shutter, shop closed,

illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, floor plan drawing, map icons, labels, text, logos, team
badges, brand names, watermark, grid lines, tilted perspective, oblique angle,
fisheye, vignette, interior lighting, indoor photo, eye-level view, storefront
photo, shopping mall, boutique, luxury store,
buildings covering the street, blocked intersection, dead end,
crowd, people, shoppers, staff, moving cars, snow, night, rain, hdr
```

### Sementes pro importador

```python
{'id': 'loja', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'loja.webp',
 # a rua e as duas calçadas, a porta e o salão por dentro
 'sementes': [(0.10, 0.72), (0.50, 0.76), (0.90, 0.72),
              (0.50, 0.62), (0.50, 0.45), (0.42, 0.38), (0.58, 0.48),
              (0.02, 0.72), (0.98, 0.72)],
 'recorte': [(0.00, 0.60, 1.00, 1.00),   # a rua e as calçadas
             (0.34, 0.22, 0.66, 0.62)]}, # a loja e a calçada dela
```

### Ordem curta de correção

```
Remove every remaining piece of roof from the shop: the ring of tiles around
the edge, the eaves and the overhang. Cut its walls down to knee height so the
entire floor of the shop is visible from above, wall to wall, evenly lit, with
no shaded strip along the edges. Show the counter, the clothes rails and the
wall shelves that are currently hidden under the roof edge. Keep everything
else in the image exactly as it is — the street, the sidewalk and the roofs of
all the neighbouring buildings, which stay intact.
```

### Conferir

1. **O salão inteiro à vista.** Olhe a beirada, não o meio: faixa coberta rente
   às paredes esconde balcão e prateleira, e a imagem não serve.
2. **Um telhado só aberto** no quadro inteiro.
3. **A porta dá pra rua** e é o único vão da fachada — é o objetivo da ação.
4. **As duas pontas da rua continuam abertas**: é por ali que os donos fogem.
5. Sem escudo, sem nome de time, sem marca. A camisa é genérica de propósito —
   a torcida da cena muda a cada partida, e logotipo de time real não entra no
   build.
6. Depois de importar, o salão inteiro vira chão — é o certo, a loja é
   invadível. Balcão, arara, prateleira e caixa viram parede no pincel.

---

## Depois que as seis existirem

1. `img/cenas/` guarda o arquivo grande (fonte) e o `.webp` que o jogo carrega.
   Publique só o `.webp`: o PNG de 2,7 MB da cena dos arredores virou 203 KB em
   qualidade 82, e o GDD §2.3 avisa que imagem pesada inviabiliza o download.
2. `FONTES` no importador ganha as seis entradas acima.
3. `dados/cenas.js` ganha as seis cenas com `spawns`, `saida`, `gatilho` e
   `local` — os pontos sugeridos em cada seção são o ponto de partida.
4. A emboscada em `js/mundo/tensao.js` deixa de emprestar a cena `rua` e passa
   a sortear entre `estrada` e `estrada-posto`. A nota de cena emprestada do
   §8.21 sai junto: cena própria de rodovia passa a existir.
5. Ande com o líder (WASD) encostando em tudo, nas seis. A colisão sai da
   máscara, não do desenho: parede que só existe na foto vira disco atravessando
   muro.
