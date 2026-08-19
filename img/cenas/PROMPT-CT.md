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

O muro do CT atravessa o quadro da esquerda pra direita e é a **parede de
fundo** da briga. Tudo que se pisa está do lado de fora dele:

- **faixa da calçada**, larga, colada no muro — é o chão principal, é onde a
  torcida se ajunta e onde a treta cai;
- **a esplanada da portaria**, um alargamento da calçada em frente ao portão:
  o miolo da cena, onde o protesto se planta;
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
pista de duas mãos ocupando cerca de um oitavo da altura.

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

a long boundary wall runs left to right across the middle of the frame, seen
from directly above as a narrow continuous band showing only the top of the
wall and never its side face, with a line of thin metal fencing along it,

set into the wall, a wide sliding vehicle gate, closed, seen from above as a
flat metal panel, flanked by two square pillars; beside it a small security
booth shown only as its flat roof, a boom barrier lying across a service lane,
and a narrow pedestrian turnstile which is the only opening in the whole wall,

above the gate, a plain rectangular sign panel mounted flat on a frame,
completely blank: no name, no lettering, no badge, no crest, no logo anywhere
in the picture,

in front of the wall, a wide concrete sidewalk running the full width of the
frame, widening into an open forecourt in front of the gate: plain concrete
slabs, painted kerb, drain grates, two low concrete bollards, a rubbish bin, a
stack of metal crowd barriers left against the wall, a small food cart parked
at one end, a lamp post seen as a short stub with a long shadow, nothing
overhanging the sidewalk at all,

below the sidewalk, a two-lane asphalt road crossing the whole frame from the
left edge to the right edge, worn dark asphalt, faded yellow centre line,
painted black-and-white curbs, a zebra crossing in front of the gate, a coach
bus and three cars parked along the kerb seen from directly above as roofs
only, and beyond it a narrow sidewalk along the bottom edge with two trees seen
as round canopies,

the road stays completely clear and open at the left edge and at the right edge
of the picture,

behind the wall, only a thin strip along the top of the frame: a paved
manoeuvring yard, a car park with a few cars seen as roofs, a low
administration building shown only as its flat intact roof, and the near corner
of a training pitch with green grass and tall netting on poles,

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
 'sementes': [(0.50, 0.62), (0.20, 0.62), (0.80, 0.62),
              (0.50, 0.55), (0.50, 0.80), (0.02, 0.80), (0.98, 0.80),
              (0.02, 0.62), (0.98, 0.62)],
 'corredor': True},
```

## Ordem curta de correção

```
Shoot this from exactly overhead, at zenith: the wall shows only its top edge
as a narrow band, the gate is a flat panel seen from above, the buildings show
only their roofs and the vehicles only their roofs. Widen the concrete sidewalk
in front of the gate into an open forecourt and remove everything that hangs
over it — no bus shelter, no awning, no tree canopy above the pavement. Keep
the road crossing the whole image and open at both edges, keep the gate closed
with only the pedestrian turnstile as an opening, and keep the sign panel
blank. No people anywhere.
```

## Conferir

1. **Zênite primeiro**: portão de frente, muro com altura ou ônibus de perfil
   significam que a calçada atrás deles não foi fotografada — e é justamente
   ali que a torcida se ajunta.
2. **A calçada é larga e limpa**, sem nada por cima. Abrigo de ônibus é o
   erro clássico aqui, e ele come o miolo da cena.
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
