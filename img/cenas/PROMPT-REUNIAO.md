# A sala da reunião da diretoria — prompt pronto pra colar

Cena nova (pedido do dono, 22/09/2026): a reunião mensal da diretoria,
dentro da sede. As cadeiras em **C quadrado** são o palco — três lados de
um retângulo, a abertura virada pra direita —, os diretores sentados
nelas, o presidente — o jogador — em pé **sozinho do lado direito**,
virado pra eles, e cada pauta da reunião abrindo um balão em cima de um
diretor. Mesmo
acabamento das outras cenas — ortofoto de zênite, sem telhado, dia
nublado, o quarteirão da sede no quadro. O raciocínio de cada regra
está em `PROMPT-SEDE.md`; aqui é só colar.

**Antes de colar, no Google Flow:**

- proporção **16:9** (o Flow não faz 3:2; o importador completa em cima
  e embaixo);
- anexe `img/cenas/Aerial_view_of_roofless_bar_202608131633.jpeg` como
  referência: ela carrega a projeção de zênite e o **prédio sem telhado**
  com as salas à mostra, que é o que esta cena precisa.

## O que o jogo vai fazer com a imagem (o plano, pra não se perder)

| | |
|---|---|
| **quem está lá** | a diretoria inteira da torcida, um boneco por cadeira (teto de 12), **sentada**; o presidente em pé sozinho do lado direito, virado pra eles |
| **as cadeiras** | a foto tem as cadeiras VAZIAS, em C quadrado — quatro no fundo (o lado esquerdo), quatro no braço de cima, quatro no de baixo, a abertura pra direita. O jogo senta o boneco em cima de cada uma (`D.cadeiras`, posição e rumo, todas viradas pra dentro do C) |
| **os balões** | cada pauta da reunião é a fala de um diretor: o balão abre em cima do boneco dele, com os botões da decisão dentro |
| **o presidente** | é o jogador: fica em pé do lado direito, de frente pra abertura do C; anda pela sala se quiser, mas a reunião não é cena de andar |
| **como a cena nasce** | o cartão do dia 5 de cada mês ("Reunião da diretoria — junho. 3 assuntos na mesa.") abre a cena; ela fecha pelo botão de encerrar |
| **o que se decide nela** | as aproximações e cobranças das aliadas, os convites dos eixos, a nossa jogada nos eixos, e os **botes do mês** (bar rival e casa de piscina) com dia e alvo |
| **sem briga** | não há PM, não há rival, não há fim por caído: é uma sala |

## O que a máscara de colisão precisa da foto

- **piso claro, parede escura** — é o que o importador lê. Piso de
  cimento queimado ou cerâmica clara; as paredes como faixas cinza
  contínuas, grossas (1/60 da largura, uns 45 px), vistas de cima;
- **uma sala grande, vazia no meio**: é lá que o C cabe. Nada de mesa
  no centro — é só cadeira;
- **as cadeiras de plástico, brancas ou cinza, em C quadrado**: umas
  12, em três lados retos de um retângulo — quatro no lado esquerdo,
  quatro em cima, quatro embaixo —, com um vão de gente entre elas e o
  lado DIREITO aberto. Cadeira vazia: **sem gente nenhuma**. Do lado
  direito da abertura, chão livre: é onde o presidente fica em pé;
- **o resto da sede em volta** — a cozinha com o balcão, o depósito com
  os engradados, o pátio com o colchão, o portão pra rua — pode e deve
  aparecer, porque é a sede; mas a sala do C tem de ser a maior peça
  e ficar no meio do quadro;
- **uma porta larga** entre a sala e o pátio (é a entrada do jogo);
- **sem gente, sem pano na parede, sem texto, sem bandeira**: a faixa e
  o escudo o jogo desenha.

---

## O prompt

> Top-down aerial orthophoto, straight down at 90 degrees, nadir view,
> no perspective, no tilt. A roofless single-story headquarters of a
> Brazilian football supporters' group (torcida organizada), seen from
> directly above so every room's floor is fully visible, walls appearing
> only as thick continuous gray bands. The building fills the frame with
> a narrow strip of street at the bottom edge. The largest room is a
> meeting hall in the center of the building: burnt-cement floor, clean
> and empty, with twelve white plastic chairs arranged in a squared
> C shape — three straight sides of a rectangle: four chairs along the
> left side, four along the top, four along the bottom — with the right
> side open, and empty floor to the right of the opening. The chairs are
> empty. Around the hall, smaller rooms of the same
> headquarters: a kitchen with a counter, a storeroom with stacked crates,
> a small bathroom, and an open concrete yard with a foam mattress on the
> ground and a wide gate to the street. Peripheral Brazilian
> neighborhood, overcast daylight, soft shadows, desaturated colors.
> Photorealistic satellite-style image. No people, no text, no flags, no
> banners, no roof, no cars inside the yard.

**Negativa:** people, crowd, text, letters, watermark, flag, banner, roof,
tiles, perspective, oblique angle, isometric, 3D render look, night,
circle of chairs, table in the middle, cars inside the building.

## Depois da imagem

1. salvar como `img/cenas/reuniao.jpg` (mestre) e rodar o importador
   (`python3 ferramentas/importar_cena_foto.py`) com a receita `reuniao`
   — recorte na sala, paredes como `excluir`, a porta como `abrir`;
2. abrir `arredores.html#reuniao`, apertar **F2** e acertar a máscara e
   as marcas: as 12 cadeiras do C (`cadeiras`), o lugar do presidente
   à direita (`presidente`) e a porta (`entradas`);
3. colar a exportação em `dados/cenas_editadas.js`, como nas outras.
