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
| Treta 10×10 — baldio sob o viaduto | encontro grande, borda de bairro | `treta_viaduto.webp` | a fazer |
| Estrada 1 — pista fechada no mato | emboscada na caravana | `estrada.webp` | a fazer |
| Estrada 2 — parada de estrada | emboscada na caravana (variação) | `estrada_posto.webp` | a fazer |
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
  oblíqua bonita e inútil;
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
- **o chão de andar tem que ser uma mancha contínua**. Ilha de chão cercada de
  parede é ilha de disco preso.

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

## TRETA 10×10 — baldio sob o viaduto

Vinte discos. O maior dos três: terreno baldio na sombra de um viaduto, chão
aberto de ponta a ponta com os **pilares como obstáculo no meio**. É a treta
que se abre — dá pra cercar, dá pra correr, dá pra perder gente no caminho.
Chão livre alvo: uns 60 × 35 metros.

Geometria: o viaduto atravessa o quadro **na diagonal suave ou reto da esquerda
pra direita, por cima** — a estrutura dele é telhado, e telhado é parede na
máscara, então ele não pode cobrir o baldio inteiro; deixe a maior parte do
terreno aberta ao céu, com a sombra da pista cruzando só uma faixa. Duas fileiras
de pilares grossos dentro do terreno. Rua de acesso chegando pela esquerda e
outra pela direita.

Spawns sugeridos: `mandante1` (110, 512) e `mandante2` (320, 900);
`visitante1` (1426, 512) e `visitante2` (1220, 130).

```
top-down nadir aerial drone photograph of a large empty wasteland lot beside a
concrete overpass on the edge of a Brazilian city district, shot straight down
at 90 degrees, orthographic feel, overcast diffuse daylight, soft shadows,
desaturated muted colors, documentary photography, completely empty of people,

a big open lot of bare packed earth and gravel filling most of the frame, dry
weeds, tyre tracks, scattered rubble and broken concrete slabs pushed to the
edges, a burnt patch, three abandoned tyres, a rusted skip,

a concrete elevated road crosses the upper third of the frame from left to
right, seen from directly above as a narrow band of asphalt with a solid
parapet on each side; it covers only a narrow strip of the lot, and its long
soft shadow falls across the earth below; two rows of thick square concrete
pillars stand on the open lot supporting it, plainly visible from above, their
bases surrounded by bare ground,

most of the lot is open to the sky with nothing above it,

a dirt access track enters the lot from the left edge of the frame and a paved
street enters from the right edge, both fully open and reaching the frame
edges,

along the far side of the lot, a wall of corrugated metal sheets and a row of
low warehouses with flat concrete roofs and rusted zinc roofing, a couple of
parked trucks outside them, low houses with terracotta tile roofs and blue
water tanks beyond, sparse scrub bushes,

photorealistic, natural materials, sun-bleached concrete, tropical Brazil, 8k
satellite imagery quality, sharp detail, no people visible
```

### Negativo

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, eye level, fisheye, vignette, drone under
the bridge, view from below, upward angle,
overpass covering the whole lot, roofed area, tunnel, dark shadow over
everything, dense trees, forest, park, lake, river, mud,
buildings on the lot, fences across the lot, closed access, dead end,
crowd, people, homeless camp, moving cars, tents,
saturated colors, hdr, dramatic lighting, night, rain
```

### Sementes pro importador

```python
{'id': 'treta-viaduto', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'treta_viaduto.webp',
 'sementes': [(0.50, 0.60), (0.25, 0.62), (0.75, 0.58),
              (0.02, 0.55), (0.98, 0.55), (0.50, 0.85)],
 'recorte': [(0.00, 0.30, 1.00, 1.00)]},
```

### Ordem curta de correção

```
Move the elevated road so it covers only a narrow strip across the top of the
lot, and leave the rest of the ground open to the sky in flat daylight. Keep
the rows of concrete pillars standing on the open ground. Open the access track
on the left and the street on the right all the way to the edges of the image.
No people, no tents.
```

### Conferir

1. **O viaduto cobre uma faixa, não o terreno.** Se a estrutura tampar o
   miolo, a máscara lê laje e some o chão da briga inteira.
2. Os pilares aparecem de cima, um a um: são os obstáculos que dão graça à
   treta grande. Marque cada um no pincel depois de importar.
3. As duas entradas laterais chegam na borda.
4. Sombra é sombra, não parede: se o corte fechar a faixa sombreada, pinte de
   volta no F2.

---

## ESTRADA 1 — pista fechada no mato

A emboscada hoje **abre a rua de classe baixa emprestada** (§8.21 do resumo),
porque cena de rodovia não existe. Esta é ela. Papéis invertidos: o ônibus
fechado é o `mandante` — quem embarcou na caravana —, e o bonde que fechou a
pista é o `visitante`.

Geometria: **rodovia de duas mãos atravessando o quadro da esquerda pra
direita**, acostamento largo de terra dos dois lados, mato baixo além do
acostamento. No meio do quadro, **o ônibus de excursão parado atravessado**,
e dois carros fechando a pista à frente dele. A pista continua aberta nas duas
bordas: é por onde se foge, dos dois lados.

O ônibus e os carros são obstáculo: depois de importar, eles têm de virar
parede no pincel, senão o disco atravessa o ônibus.

Spawns sugeridos: `mandante1` (760, 512) — colado no ônibus, é de lá que a
caravana desce — e `mandante2` (900, 560); `visitante1` (1340, 512) e
`visitante2` (1180, 620), atrás do bloqueio.

```
top-down nadir aerial drone photograph of a two-lane rural highway cutting
through low scrubland in the Brazilian northeast, shot straight down at 90
degrees, orthographic feel, overcast diffuse daylight, soft shadows,
desaturated muted colors, documentary photography, no people anywhere,

one two-lane asphalt highway running left to right across the whole frame,
worn dark asphalt, faded white edge lines and a broken white centre line,
patched repairs, a wide bare earth shoulder on both sides, shallow drainage
ditches, a rusted kilometre marker post and a leaning road sign,

parked in the middle of the frame, a large old intercity coach bus stopped at
an angle across the road, its doors on the shoulder side, and two battered
cars stopped nose to nose across the lanes just ahead of it, blocking the way,
a scatter of stones on the asphalt,

beyond the shoulders on both sides: flat dry scrubland with low grey-green
bushes, red earth, a rusted barbed wire fence on wooden posts running parallel
to the road, a dirt side track meeting the highway near one edge of the frame,

the road stays completely clear and open at the left edge and at the right edge
of the picture,

photorealistic, natural materials, dusty asphalt, tropical Brazil, 8k satellite
imagery quality, sharp detail, no people visible, no moving traffic
```

### Negativo

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, eye level, fisheye, vignette,
motorway, four lanes, divided highway, guardrail through the whole frame,
overpass, tunnel, bridge, city buildings, houses, dense forest, jungle,
crash, fire, smoke, wreckage, blood, police, ambulance,
crowd, people, passengers, drivers, moving cars, traffic queue,
saturated colors, hdr, dramatic lighting, night, rain, snow
```

### Sementes pro importador

```python
{'id': 'estrada', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'estrada.webp',
 'sementes': [(0.15, 0.50), (0.85, 0.50), (0.02, 0.50), (0.98, 0.50),
              (0.50, 0.35), (0.50, 0.65)],
 'corredor': True},
```

### Ordem curta de correção

```
Keep the highway completely open and clear at the left and right edges of the
image — no vehicles and no blockage there. Leave only the coach bus parked
across the middle of the road with two cars stopped in front of it. Widen the
bare earth shoulder on both sides of the asphalt. Remove every person. No fire,
no smoke, no wreckage.
```

### Conferir

1. **As duas pontas da pista estão livres.** É a fuga dos dois lados; estrada
   fechada nas bordas trava a cena.
2. O acostamento é largo e liso — é o chão útil da briga, a pista sozinha é
   estreita demais pra vinte discos.
3. Nada de acidente: a emboscada é bloqueio, não capotamento. Ferragem
   retorcida vira geometria ilegível na máscara.
4. Marque ônibus e carros como parede no F2. O ônibus é o abrigo da caravana:
   é ele que faz a cena ter forma.

---

## ESTRADA 2 — parada de estrada

A variação. Mesma rodovia, mas na parada: posto de gasolina com borracharia e
lanchonete, pátio de cimento grande do lado da pista. Serve pra emboscada que
pega a caravana parada — e dá um chão bem diferente do trecho de mato, que é o
motivo de existirem duas.

Geometria: **pista atravessando o quadro embaixo, da esquerda pra direita**;
o pátio do posto ocupa a metade de cima, aberto e ligado à pista por duas
bocas de entrada (uma em cada ponta do pátio); a cobertura das bombas é
**pequena e fica numa quina**, não no meio — cobertura no miolo do pátio vira
parede na máscara e come o chão da briga.

Spawns sugeridos: `mandante1` (700, 300) e `mandante2` (500, 240), no pátio
junto do ônibus; `visitante1` (1300, 700) e `visitante2` (1100, 780), chegando
pela pista.

```
top-down nadir aerial drone photograph of a roadside truck stop on a Brazilian
highway, shot straight down at 90 degrees, orthographic feel, overcast diffuse
daylight, soft shadows, desaturated muted colors, documentary photography,
completely empty of people,

along the bottom of the frame, a two-lane asphalt highway running left to right
from edge to edge, worn asphalt, faded white edge lines, a wide bare earth
shoulder,

filling the upper half of the frame, a large open concrete forecourt of a
petrol station, cracked slabs, faded painted lanes and arrows, oil stains, a
drain grate, a low kerb separating it from the highway with two wide open
driveway entrances, one near the left end and one near the right end,

a small fuel canopy with two pumps stands in one corner of the forecourt only,
compact and off to the side, leaving the rest of the concrete yard wide open to
the sky,

at the back of the forecourt, a low single-storey building with a flat white
roof: a snack bar with a shuttered window and a tyre repair shop with a stack
of used tyres outside, a compressor, a water tank, two picnic tables under a
small awning against the wall,

an old intercity coach bus parked on the open forecourt, a lorry parked at the
far end, two cars at the kerb, a light pole,

behind the building, dry scrubland with low bushes, red earth and a barbed wire
fence,

photorealistic, natural materials, sun-bleached concrete, dusty asphalt,
tropical Brazil, 8k satellite imagery quality, sharp detail, no people visible,
no moving traffic
```

### Negativo

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, eye level, fisheye, vignette,
large canopy covering the forecourt, roof over the yard, covered parking,
service station roof spanning the frame, shopping mall, city street,
many parked cars, full car park, crowd, people, drivers, attendants,
fire, smoke, fuel spill, explosion,
saturated colors, hdr, dramatic lighting, night, rain
```

### Sementes pro importador

```python
{'id': 'estrada-posto', 'arquivo': '<arquivo que saiu>.jpeg',
 'saida': 'estrada_posto.webp',
 'sementes': [(0.50, 0.30), (0.25, 0.32), (0.75, 0.30),
              (0.50, 0.80), (0.02, 0.80), (0.98, 0.80),
              (0.15, 0.55), (0.85, 0.55)],
 'recorte': [(0.00, 0.62, 1.00, 1.00),
             (0.05, 0.10, 0.95, 0.62)]},
```

### Ordem curta de correção

```
Shrink the fuel canopy and move it into one corner of the forecourt, leaving
the concrete yard wide open to the sky. Keep two wide open driveways connecting
the forecourt to the highway, one at each end. Keep the highway open at both
edges of the image. Remove all people and all extra parked cars.
```

### Conferir

1. **A cobertura das bombas é pequena e está na quina.** Se ela cobrir o pátio,
   a briga perde o chão.
2. As duas bocas ligam pátio e pista, e a pista sai pelas duas bordas.
3. Ônibus, caminhão, carros, pilha de pneu e mesas viram parede no pincel.

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
