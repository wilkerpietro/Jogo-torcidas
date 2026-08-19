# Prompt da frente do CT — a calçada da portaria

Uma imagem, no padrão das outras: **zênite, dia nublado, cor dessaturada,
Brasil, sem gente**. Não é foto de fachada — **é cena de jogo**. O que a
imagem entrega é a **calçada da portaria do centro de treinamento**, que é onde
a torcida se junta: protesto de véspera, festa de recepção, e a emboscada que
sai de uma das duas.

| Cena | Pra que serve | Saída pro jogo | Estado |
|---|---|---|---|
| Frente do CT | protesto, festa e emboscada na porta do CT | `ct.webp` | a fazer |

**Sem cor de clube, e por regra.** O mesmo CT serve aos 76 do
`dados/estadios.js`: parede sem pintura, **placa em branco** sobre o portão — o
nome do clube entra por cima, como texto do jogo. Modelo de imagem erra letra
em português com frequência, e escudo pintado prende a arte a um time só.

## A geometria da cena

O muro do CT atravessa o quadro **no terço de cima** e é a **parede de fundo**
da briga. Tudo que se pisa está do lado de fora dele, e a faixa pisável foi
puxada pra cima de propósito: **quase metade da altura do quadro é chão de
briga**, senão os discos se espremem numa tira de calçada e a treta vira fila.

- **a esplanada da portaria**, funda, uns 18 metros do muro até o meio-fio —
  um recuo pavimentado que corre a largura inteira do quadro e alarga ainda
  mais em frente ao portão. É o miolo da cena: onde o protesto se planta, onde
  a festa se junta e onde a emboscada cai;
- **a rua de duas mãos**, atravessando o quadro inteiro e **aberta nas duas
  bordas laterais** — as duas fugas;
- **a calçada do outro lado**, na borda de baixo, estreita: quem é empurrado
  pra lá atravessa a pista.

O portão de correr fica **fechado**: ele é parede. Ao lado dele, a guarita e
uma **catraca de pedestre**, que é o único vão do muro — o gargalo da cena, e o
objetivo de quem quer entrar. Do outro lado do muro aparece só uma tira: pátio
de manobra, estacionamento e a ponta do campo, todos com telhado inteiro e
**nada de laje removida** — no CT não se entra, ainda.

**Nada por cima da calçada.** Sem abrigo de ônibus, sem marquise, sem árvore
com copa cobrindo o passeio: qualquer uma delas esconde justamente o chão onde
os dois bondes se encostam. Árvore só na faixa do outro lado da rua.

Escala: a mesma das cenas de rua — o quadro cobre uns **80 metros**, com a
pista de duas mãos ocupando cerca de um oitavo da altura. A repartição da
altura, de cima pra baixo: **um quinto** de CT atrás do muro, **dois quintos**
de esplanada, **um quinto** de pista e o resto de calçada oposta. Esplanada
estreita é o erro que mata esta cena — com 200 discos, tira de calçada não é
arena, é corredor.

Spawns sugeridos: `mandante1` (200, 620) e `mandante2` (380, 690), chegando
pela calçada oeste; `visitante1` (1340, 620) e `visitante2` (1180, 700), pela
leste. Objetivo do líder: a catraca. `saida`: as duas pontas da rua.

## Prompt

```
strict orthographic top-down nadir view, camera exactly at zenith directly
above the scene, optical axis perpendicular to the ground, 90 degrees straight
down, orthophoto / satellite imagery projection, zero camera tilt, zero
parallax, no perspective distortion, no vanishing point, verticals collapse to
points,

every object seen only as its top surface: roofs only, vehicle roofs only, no
façades, no building elevations, no side walls, no visible fronts of anything,
nothing leaning outward at the edges of the frame,

aerial drone photograph of the street entrance of a football club training
ground on the outskirts of a Brazilian city, overcast diffuse daylight, soft
shadows, desaturated muted colors, documentary photography, completely empty of
people,

a long boundary wall runs left to right across the whole frame, high up, about
one fifth of the way down from the top edge, seen from directly above as a
narrow continuous band showing only the top of the wall and never its side
face, with a line of thin metal fencing along it,

set into the wall, a wide sliding vehicle gate, closed, seen from above as a
flat metal panel, flanked by two square pillars; beside it a small security
booth shown only as its flat roof, a boom barrier lying across a service lane,
and a narrow pedestrian turnstile which is the only opening in the whole wall,

above the gate, a plain rectangular sign panel mounted flat on a frame,
completely blank: no name, no lettering, no badge, no crest, no logo anywhere
in the picture,

in front of the wall, a VERY DEEP paved forecourt, about eighteen metres from
the wall to the kerb, filling roughly two fifths of the height of the frame and
running the full width of the picture, one continuous uninterrupted expanse of
plain concrete slabs with nothing built on it: painted kerb, drain grates, a
few faded parking bay markings at one end, two low concrete bollards, a rubbish
bin, a stack of metal crowd barriers left flat against the wall, a small food
cart parked at one corner, a lamp post seen as a short stub with a long shadow,
and nothing whatsoever overhanging this forecourt,

below the forecourt, taking about one fifth of the height of the frame, a
two-lane asphalt road crossing the whole frame from the left edge to the right
edge, worn dark asphalt, faded yellow centre line,
painted black-and-white curbs, a zebra crossing in front of the gate, a coach
bus and three cars parked along the kerb seen from directly above as roofs
only, and beyond it a narrow sidewalk along the bottom edge with two trees seen
as round canopies,

the road stays completely clear and open at the left edge and at the right edge
of the picture,

behind the wall, only a narrow strip along the top of the frame, no more than
one fifth of its height: a paved manoeuvring yard, a few cars seen as roofs,
the flat intact roof of a low administration building, and the near edge of a
training pitch with green grass,

STRICTLY NEUTRAL PALETTE, usable by any club: grey concrete, white plaster,
dark grey and galvanised metal, black asphalt, green grass; no club colours, no
coloured stripes, no flags, no banners, no sponsor signs, no advertising,

photorealistic, natural materials, sun-bleached concrete, tropical Brazil, 8k
satellite imagery quality, sharp detail, no people visible, no moving traffic
```

## Negativo

```
oblique aerial, bird's eye view, three quarter view, tilted camera, angled
drone shot, perspective view, visible façade, visible building side, visible
wall elevation, gate seen from the front, roof offset from its base, leaning
buildings, vehicles seen from the side, windscreen visible, car front visible,
vanishing point, wide angle, fisheye, lens distortion, parallax,

bus shelter, canopy, awning, marquee, covered walkway, overhanging roof, trees
overhanging the sidewalk, dense tree canopy over the pavement, footbridge,
power lines across the road, anything above the sidewalk,

club badge, crest, emblem, logo, team name, lettering, text, letters, numbers,
signage with words, painted club colours, coloured stripes, flags, banners,
sponsor boards, advertising, murals, graffiti, watermark,

open gate, gap in the wall, broken wall, several entrances, blocked road, dead
end, roundabout, motorway, countryside, empty field filling the frame,

illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, grid lines, vignette,
crowd, people, fans, protest, riot, police, journalists, players, moving cars,
saturated colors, hdr, dramatic lighting, night, floodlit, rain
```

## Sementes pro importador

```python
{'id': 'ct', 'arquivo': '<arquivo que saiu>.jpeg', 'saida': 'ct.webp',
 # a calçada, a esplanada do portão e a pista, de ponta a ponta
 'sementes': [(0.50, 0.45), (0.20, 0.45), (0.80, 0.45),
              (0.50, 0.30), (0.50, 0.58), (0.20, 0.60), (0.80, 0.60),
              (0.50, 0.75), (0.02, 0.75), (0.98, 0.75),
              (0.02, 0.45), (0.98, 0.45)],
 'corredor': True},
```

## Ordem curta de correção

```
Shoot this from exactly overhead, at zenith: the wall shows only its top edge
as a narrow band, the gate is a flat panel seen from above, the buildings show
only their roofs and the vehicles only their roofs. Move the boundary wall up so
it sits about one fifth of the way down from the top edge, and make the paved
forecourt in front of it much deeper — a single uninterrupted expanse of
concrete filling roughly two fifths of the height of the image, running the
whole width, with nothing built on it and nothing hanging over it: no bus
shelter, no awning, no tree canopy above the pavement. Keep the road crossing
the whole image and open at both edges, keep the gate closed with only the
pedestrian turnstile as an opening, and keep the sign panel blank. No people
anywhere.
```

## Conferir

1. **Zênite primeiro**: portão de frente, muro com altura ou ônibus de perfil
   significam que a calçada atrás deles não foi fotografada — e é justamente
   ali que a torcida se ajunta.
2. **A esplanada é funda e limpa**, ocupando uns dois quintos da altura, sem
   nada por cima e sem nada construído nela. Abrigo de ônibus é o erro clássico
   aqui, e ele come o miolo da cena; calçada estreita é o outro, e transforma a
   briga numa fila encostada no muro.
3. **A catraca é o único vão do muro.** Portão aberto transforma a cena numa
   invasão de CT, que é outra cena — e essa ainda não existe.
4. **As duas pontas da rua estão livres**: são as fugas.
5. **A placa está em branco** e não há escudo nem cor de time em lugar nenhum.
6. Depois de importar: calçada, esplanada e pista viram chão; muro, portão,
   guarita, ônibus, carros, grades e o carrinho viram parede no pincel.

## Se um dia for pra dentro

Protesto, festa e emboscada acontecem na calçada — por isso o CT fica fechado
aqui. **Invadir o CT é outra imagem**: aí o portão abre, a laje do prédio sai
no molde do bar e o campo entra como chão. Quando essa cena existir, esta
continua valendo: uma é a porta, a outra é o que acontece depois dela.
