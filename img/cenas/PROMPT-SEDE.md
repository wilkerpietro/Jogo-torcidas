# Prompts para as cinco sedes

Uma imagem por nível de sede. Alvo: o mesmo acabamento das outras cenas —
ortofoto de zênite, dia nublado, cor dessaturada, periferia brasileira.

> **Pra colar e gerar, use `PROMPTS-SEDE-PRONTOS.md`**: cinco blocos completos,
> um por nível, com a negativa junto. Este arquivo aqui é o porquê de cada
> regra — leia quando uma geração sair errada, não na hora de gerar.

| Cena | Nível | Planta de entrada | Saída pro jogo | Estado |
|---|---|---|---|---|
| Sede nv 1 | 1 | `docs/plantas/sede-nivel-1.jpg` | `sede_1.webp` | **importada** (10/09) — falta o colchão no pátio |
| Sede nv 2 | 2 | `docs/plantas/sede-nivel-2.png` | `sede_2.webp` | **importada** (22/09) — mestre `sede_nivel_2.jpg`; pátio e salas abertos na máscara |
| Sede nv 3 | 3 | `docs/plantas/sede-nivel-3.png` | `sede_3.webp` | **importada** (22/09) — mestre `sede_nivel_3.jpg`; salão e pátio abertos |
| Sede nv 4 | 4 | `docs/plantas/sede-nivel-4.jpg` | `sede_4.webp` | **importada** (22/09) — mestre `sede_nivel_4.jpg`; só o pátio da esquerda abriu, as salas pedem F2 |
| Sede nv 5 e 6 | 5 e 6 | `docs/plantas/sede-nivel-5.jpg` | `sede_5.webp` | **importada** (22/09) — mestre `sede_nivel_5.jpg`; corredor e salas abertos |

As cinco cenas estão registradas (`sede-1` a `sede-5`, o laço `SEDES` em
`dados/cenas.js`) e é **no pátio delas que a reunião da diretoria senta**
(decisão do dono, 22/09/2026 — `docs/PLANO-REUNIAO-DIRETORIA.md`): o C
quadrado de cadeiras cabe no retângulo do pátio medido em cada foto, e a
medida foi conferida contra a máscara, cadeira por cadeira. Pra ver cada
uma com a diretoria sentada: `arredores.html#sede-N` (abas "Sede 1" a
"Sede 5"); é ali que a máscara se acerta no F2.

O nível 6 (o Complexo) usa a planta do 5 — decisão do dono, 10/09/2026. O que
muda no 6 é o que está aceso dentro das salas (cofre e enfermaria), e isso o
jogo desenha por cima.

## A regra que manda em tudo: SEM TELHADO

A sede é cena de dentro. Vista a prumo, prédio com telhado é telhado — não
tem cena. O precedente já existe e funciona:
`Aerial_view_of_roofless_bar_202608131633.jpeg`, o bar da rival, é um
**roofless building**, e é por isso que a briga termina dentro do salão.

Então toda sede é um **quarteirão murado sem cobertura**, visto de 90°, com as
paredes aparecendo de cima como faixas grossas e o piso de cada sala à mostra.

## O que cada rodada errou

Quatro rodadas até aqui. A 1ª acertou o essencial — sem telhado, luz de dia
nublado — e errou três coisas de arrumação. A 2ª arrumou as três e esbarrou na
projeção: não era zênite de verdade. A 3ª acertou a projeção e o colchão, e saiu
sem rua — por erro meu no texto do prompt. A 4ª saiu com um filete de rua e nada
mais: o quadro fechava na sede.

### Rodada 1 · O miolo de cada sala tem de ficar VAZIO

A sala não é cenário de fundo: é **piso de briga**. É ali que 40 bonecos se
empurram. Móvel no meio da sala vira parede na máscara de colisão, e sala com o
meio ocupado simplesmente não recebe briga.

- **no máximo 3 objetos grandes por sala**, todos **encostados na parede**;
- o **centro de cada sala fica limpo**, chão à mostra, sem nada;
- nada de pilha, nada de caixa empilhada, nada de objeto solto no meio do pátio.

### Rodada 1 · O patrimônio é a sala mais vazia de todas

A primeira tentativa encheu o patrimônio de faixa dobrada, bandeira de mastro e
bumbo. **Não pode.** As faixas e bandeiras da torcida são desenhadas pelo jogo
por cima da foto, com as cores e o escudo de cada torcida. Foto com pano dentro
significa pano duplicado, e da torcida errada.

O patrimônio é uma **sala vazia com uma prateleira comprida vazia** encostada
numa parede. Só isso.

### Rodada 1 · Toda sala precisa de UMA porta, e ela precisa abrir

Na imagem de teste a sala do presidente ficou **fechada dos quatro lados**. Sala
sem porta é sala que o invasor nunca alcança e que o jogo nunca usa.

- **cada sala tem exatamente um vão de porta**, aberto, sem folha e sem batente;
- o vão dá **pro pátio ou pro corredor**, nunca pra outra sala fechada;
- o vão é **largo**: pelo menos 1/18 da largura da imagem (uns 150 px numa de
  2752). Porta estreita demais engarrafa a briga inteira;
- o **portão da rua fica aberto**, com a folha encostada por dentro do muro —
  não desenhe portão de correr fechado tapando a entrada.

### Rodada 2 · Zênite de verdade, e não drone quase em cima

A 2ª imagem ficou limpa e com porta em toda sala, mas dá pra **ver a face de
dentro das três paredes externas**, e a mesa e o arquivo aparecem de lado, com
pé e frente à mostra. Isso é lente grande-angular a prumo, não é zênite: no
centro do quadro a projeção fica certa e nas bordas as paredes se abrem pra
fora.

Compare com a foto que o jogo já usa,
`Aerial_view_of_roofless_bar_202608131633.jpeg`: ali só se vê **o topo** de tudo
— topo de mesa, topo de cadeira, topo de muro como faixa lisa. Nenhuma face
vertical em lugar nenhum do quadro. É esse o alvo.

O que resolve, em ordem de eficácia:

1. **Anexe a foto do bar junto com a planta**, como referência de estilo. Ela
   carrega a projeção certa melhor do que qualquer adjetivo.
2. Peça **projeção ortográfica de ortofoto de satélite**, e não &ldquo;drone&rdquo;: drone
   sugere lente larga e altura baixa, que é exatamente o defeito.
3. Peça **teleobjetiva de altitude muito alta**, que comprime a perspectiva e
   zera o paralaxe das bordas.
4. Diga o teste em palavras dentro do prompt: **só superfície de cima é
   visível**, nenhuma face de parede, nenhum pé de mesa, nenhum encosto de
   cadeira.

### Rodada 3 · A rua não saiu, e a culpa era do prompt

Quatro gerações no Google Flow, nenhuma com rua. Conferido: a exigência da rua
estava escrita na **prosa** deste arquivo, mas o **bloco de prompt** que se cola
ainda dizia *&ldquo;only a narrow strip of cracked asphalt street&rdquo;*. O modelo obedeceu
ao que leu. Corrigido — e é por isso que os blocos prontos existem: prosa que o
modelo não lê não vale nada.

A frase que entrou no lugar diz a proporção, e não o adjetivo: **dois terços de
sede em cima, um terço de rua embaixo, de ponta a ponta**. Proporção o modelo
respeita; &ldquo;mostre a rua&rdquo; ele ignora.

### Rodada 4 · O quadro é o QUARTEIRÃO, não o prédio

Com a rua já pedida no texto, o Flow deu um filete de asfalto e mais nada: o
quadro fechava na sede. Não adianta pedir rua larga — o modelo enquadra **o que
você descreve**, e o prompt descrevia um prédio com uma rua ao lado.

A foto do bar mostra o que se quer: o lote sem telhado ocupa menos de um quarto
da largura, e o resto do quadro é casa de vizinho com telha, laje com caixa
d'água, calçada, meio-fio, faixa de pedestre e rua. É por isso que o rival tem
onde nascer e por onde vir.

A correção foi inverter o assunto. O primeiro parágrafo agora descreve **o
quarteirão** — vizinhos à esquerda e à direita até a borda, rua no quarto de
baixo, quintal da rua de trás no topo — e a sede entra como *&ldquo;um lote entre
muitos&rdquo;*, com a fração do quadro dita em número.

Efeito colateral bom: telha de barro sai por cor no importador
(`R > G+18 && R > B+22`), então casa de vizinho se exclui sozinha do chão de
andar. Vizinho no quadro custa zero de trabalho na máscara.

Uma armadilha que isso criou e já está corrigida: a negativa antiga dizia
*&ldquo;no roof, no roof tiles&rdquo;* de forma solta, e isso brigava com os vizinhos, que
PRECISAM ter telhado. Agora a negativa é específica: sem telhado **sobre o
quarteirão murado**, e os vizinhos mantêm o deles.

## O que mais não pode mudar

A imagem vira o chão da cena, e a máscara de colisão sai da própria foto por
cor e conectividade (`ferramentas/importar_cena_foto.py`).

- **zênite ortográfico**, não drone a prumo. Só superfície de cima aparece:
  topo de muro, topo de mesa, topo de armário. Face de parede visível é o
  defeito da 2ª rodada;
- **piso claro, parede escura.** É esse contraste que o importador lê. Piso de
  cimento queimado, ladrilho, cerâmica: claro. Parede: faixa escura e contínua;
- **parede grossa**: pelo menos 1/60 da largura do quadro (uns 45 px numa
  imagem de 2752). Parede fina some na célula de 8 px da máscara;
- **o quadro é o quarteirão inteiro**: vizinhos com telhado à esquerda e à
  direita até a borda, rua de ponta a ponta no quarto de baixo com as duas
  calçadas, quintal da rua de trás no topo. É dessa rua que o atacante nasce e
  é por ela que ele vem (pedido do dono, 10/09/2026);
- **a sede é um lote entre muitos**, de um terço a três quintos da largura
  conforme o nível, no meio do quarteirão. Sede sozinha no quadro não dá espaço
  de spawn pro rival;
- as salas ficam **no lugar e no tamanho da planta**, e o portão da rua fica na
  parede que a planta manda;
- **nada de gente na imagem**: o povo são os bonecos 3D, desenhados por cima;
- nada de texto, placa, número de sala ou marca d'água.

## Colchão no pátio, só onde não há onde dormir

Quem dorme na sede dorme onde dá. Nos níveis **1 e 2** não existe dormitório
nem hotel, então os colchões ficam **no chão do pátio**, encostados na parede
lateral, com o meio do pátio livre como sempre. É o detalhe que conta a
história e alimenta a regra: à noite, os defensores da sede estão ali.

Do **nível 3 em diante não entra colchão nenhum** no pátio — o nível 3 e o 4
têm dormitório, o 5 tem a ala de hospedagem. Colchão solto numa sede que já tem
cama vira bagunça.

## Formato do arquivo

- **3:2, sempre.** A tela da cena é 1536 × 1024. Peça 2304 × 1536 ou
  3072 × 2048 e a sede ocupa a tela inteira.
- 16:9 serve de segunda opção (as fotos de hoje vieram 2752 × 1536): o
  importador encaixa a largura inteira e completa em cima e embaixo com uma
  faixa de terra. Só perde área útil, não quebra nada.
- **Nunca 1:1 nem 4:3.** Mais alta que a tela, o importador **corta** em cima e
  embaixo. Medido nas duas tentativas, ambas quadradas (1254 × 1254): o corte
  comeria os 256 px de cada ponta, e o muro de cima da sede sairia junto.
- Se a ferramenta só fizer quadrado, dá pra contornar: mantenha a sede inteira
  dentro dos **dois terços centrais da altura**, que é justamente a fatia que
  sobrevive ao corte. Perde resolução, mas não perde muro.
- Guarde o original em PNG ou JPEG grande em `img/cenas/`, e o jogo carrega o
  `.webp`:
  `Image.open(...).convert('RGB').save('img/cenas/sede_1.webp','WEBP',quality=82,method=6)`

## Como rodar

Se a ferramenta aceitar imagem de referência (é o caso), **anexe a planta**:

- **img2img** com *denoising strength* entre **0,35 e 0,50**. Acima de 0,55 o
  modelo redesenha as paredes e a planta se perde.
- Melhor ainda: **ControlNet Canny ou Lineart, peso 0,9–1,1**, com a planta como
  guia — aí dá pra subir o denoise sem perder sala.
- Se for só prompt + anexo, sem controle de peso, o texto abaixo já descreve a
  disposição sala por sala; a planta serve de conferência.
- Duas passadas: uma pro traçado, outra de *upscale* 2× (denoise 0,2) só pra
  textura.

---

## Prompt base (vale pras cinco)

Cole isto e emende, no fim, o bloco do nível. E **anexe junto a planta e a foto
do bar** (`img/cenas/Aerial_view_of_roofless_bar_202608131633.jpeg`): a planta
dá a disposição, a foto do bar dá a projeção.

```
true orthographic zenith satellite orthophoto of a roofless walled compound in a
Brazilian working-class neighborhood, camera pointing straight down at exactly
90 degrees from very high altitude with an extreme telephoto lens, orthographic
projection, zero parallax, zero perspective, no horizon, no lens distortion,

ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads
as a flat even band, the top of every piece of furniture reads as a flat shape.
No vertical surface is visible: no inner or outer wall faces, no table legs, no
chair backs, no cabinet fronts. The walls at the edges of the frame do not lean
or splay outward — they read exactly like the walls at the center,

the building has NO ROOF: seen from directly above, the interior rooms are fully
exposed, thick painted masonry walls read as continuous light-grey bands, each
room shows its own floor,

BARE MINIMALIST INTERIORS: every room is almost empty, at most three large
objects per room and all of them pushed flat against the walls, the entire
center of every room is clear bare floor with nothing on it, no clutter, no
stacked crates, no piles, no loose objects,

EVERY ROOM HAS ONE WIDE OPEN DOORWAY: a broad gap cut clean through the wall,
no door leaf, no frame, each doorway opening onto the central yard or corridor
so that all the floors connect into one continuous walkable surface, the street
gate stands wide open with its leaf folded flat against the inside of the wall,

polished cement and worn ceramic tile floors in pale grey and cream, clearly
lighter than the walls, swept clean and empty,

flat overcast diffuse daylight, almost no cast shadows, desaturated muted
colors, documentary photography, sun-bleached concrete, weathered paint, damp
stains at the base of the walls, tropical northeast Brazil,

FRAME COMPOSITION, top to bottom, and this is mandatory: THE UPPER TWO THIRDS
of the image is the walled compound, touching the top, left and right edges of
the frame. THE LOWER THIRD OF THE IMAGE IS A FULL-WIDTH RESIDENTIAL STREET, and
it must be there and must be wide: the compound sidewalk, a painted curb,
cracked grey asphalt with a faded worn center line, then the opposite curb and
sidewalk, all running unbroken from the left edge of the frame to the right
edge,

photorealistic, natural materials, 8k detail, no people visible
```

## Bloco por nível — emende no fim do prompt base

Repare que os móveis foram cortados ao osso de propósito: o que enche a sala é
a briga, não a decoração.

### Nível 1 — o galpão

```
SMALL COMPOUND, THREE SPACES ONLY.

Left half: an open concrete yard, cracked slab floor with a drain, one blue
plastic water tank standing in the far corner, and three thin foam mattresses
laid flat side by side on the ground along the side wall — people sleep here
because there is no dormitory. The center of the yard stays completely clear.

Right half: divided into two rooms of equal width, one above the other.
Upper room, an office: one wooden desk with a chair pushed against the far wall,
one metal filing cabinet beside it, bare floor everywhere else.
Lower room, a storeroom: one long empty metal shelf against the far wall,
completely bare otherwise, no banners, no flags, no drums, no boxes.

Each of the two rooms has one wide open doorway onto the yard. The street gate
stands open in the bottom wall of the yard.
```

### Nível 2 — a casa

```
SIX SPACES.

Across the top, three rooms side by side, each with one wide open doorway onto
the yard below: left an office with a desk and a filing cabinet against the far
wall; center a workshop with one long empty work table against the far wall;
right a storeroom with one long empty shelf against the far wall and nothing
else — no banners, no flags, no drums.

Below them a wide open concrete yard running the full width, empty except for
four thin foam mattresses laid flat side by side on the ground along one side
wall — people sleep here because there is no dormitory. The center of the yard
stays completely clear.

Bottom-left corner: a narrow bar room with a tiled counter along its outer wall
and nothing else, one open doorway onto the yard.
Bottom-right corner: a training room with two punching bags hanging near one
wall and a mat rolled against another, center floor clear, one open doorway onto
the yard.

The street gate stands open in the bottom wall of the yard.
```

### Nível 3 — o sobrado

```
TEN SPACES, every one with a single wide open doorway.

Top-left: two small rooms stacked, an office above with a desk against the wall,
a planning room below with one long table against the wall and a bare corkboard.
Both open onto the hall to their right.

Top-center: a wide empty hall of bare polished cement, a circulation corridor
with absolutely nothing in it.

Right side: a column of four rooms, each opening onto that hall — bunk beds
lined against one wall; then a storeroom with one long empty shelf and nothing
else; then a small workshop with one work table against the wall; then a shop
with two clothing racks against the wall and a counter.

Bottom: an open concrete yard, empty, with a narrow bar in the bottom-left
corner (tiled counter along the wall) and a training room at bottom-center-right
(two hanging punching bags, clear center floor).

The street gate stands open in the bottom wall of the yard.
```

### Nível 4 — o clube

```
ELEVEN SPACES, every one with a single wide open doorway.

Top-left: two small rooms stacked, an office above, a planning room below with
one long table and a bare corkboard. A narrow vertical corridor of bare cement
runs beside them, empty.

Across the top, three rooms opening onto that corridor: a storeroom with one
long empty shelf and nothing else; a workshop with one long work table against
the wall; a dormitory with bunk beds lined against the walls, center clear.

Bottom-left: an open concrete yard, empty, with a narrow bar along the outer
wall.
Bottom-center: a training room, two hanging punching bags, clear center floor.
Bottom-center-right: a large vehicle garage, one old intercity bus parked
against the far wall, the rest of the floor bare, a wide open roll-up door to
the street.
Bottom-right: a shop, two clothing racks and a counter against the walls, clear
center, its own open door to the street.

The street gate stands open in the bottom wall of the yard.
```

### Nível 5 e 6 — o complexo

```
WIDE COMPOUND, ELEVEN SPACES, every one with a single wide open doorway.

Top-left: two small rooms stacked, an office above, an administration room below
with two desks and a filing cabinet against the walls.

Across the top, three large rooms: a storeroom with one long empty shelf and
nothing else; a small factory with two rows of sewing machines against the side
walls and a clear aisle down the middle; a lodging wing with single beds lined
along the walls, center clear.

A long horizontal corridor of bare polished cement runs the full width beneath
them, completely empty, and every room above opens onto it.

Along the bottom, a row of five spaces: a narrow bar with a tiled counter along
the wall; a small empty concrete yard; a gym with mats and hanging punching bags
around the edges and a clear center; a shop with clothing racks and a counter
against the walls; a garage with two buses parked against the far wall. The shop
and the garage each have their own wide open door to the street.

The street gate stands open in the bottom wall of the yard.
```

## Negative prompt (vale pras cinco)

```
wide angle lens, fisheye, lens distortion, parallax, perspective, vanishing
point, walls leaning outward, splayed walls, visible wall faces, inner wall
surfaces visible, vertical surfaces, furniture seen from the side, table legs
visible, chair backs visible, cabinet fronts visible, three-quarter view,
oblique angle, bird's eye at 45 degrees, tilted camera, low altitude drone,
roof, roofed building, terracotta tiles, corrugated metal roof, rooftop,
cluttered, clutter, messy, busy composition, stacked crates, piles of boxes,
furniture in the middle of the room, objects on the floor, decorated interior,
banners, flags, flagpoles, drums, percussion instruments, sports memorabilia,
closed room, sealed room, room without a doorway, walls without openings,
closed gate, closed door, door leaf blocking the entrance, narrow doorway,
illustration, cartoon, isometric, 3d render, video game asset, painting,
floor plan, blueprint, diagram, map icons, labels, text, numbers, watermark,
vignette, people, crowd, players, characters,
dark floors, black interiors,
saturated colors, hdr, dramatic lighting, night, sunset, long shadows,
skyscrapers, european architecture, suburban american houses, snow
```

## Conferência antes de aceitar

1. **É zênite mesmo?** Olhe as paredes das quatro bordas do quadro. Se der pra
   ver a face de dentro de alguma, ou o pé de uma mesa, é lente larga e não
   zênite. Foi o erro da 2ª rodada.
2. **Tem telhado?** Se alguma sala estiver coberta, refaça. Cobertura mata a
   cena.
3. **Toda sala tem porta?** Percorra sala por sala. Uma fechada dos quatro lados
   já é motivo de refazer — foi o erro da 1ª rodada.
4. **Dá pra andar de sala em sala?** Siga o piso com o olho, do portão até a
   sala mais funda, sem tirar o dedo da tela.
5. **O meio de cada sala está limpo?** Móvel no centro vira parede na máscara.
6. **O patrimônio está vazio?** Se tiver faixa, bandeira ou bumbo dentro,
   refaça: esse pano o jogo desenha por cima, com as cores da torcida certa.
7. **Piso mais claro que parede em toda sala?** Sala de piso escuro vira parede
   na máscara e some do jogo.
8. **Proporção 3:2?** Quadrada ou 4:3 perde muro no corte.
9. **Tem gente ou texto?** Não pode ter nenhum dos dois.

## A máscara das paredes: resolvido, não mexa na arte

A 3ª rodada levantou um problema que **não é de prompt**. Nas cenas de fora a
construção sai por cor — telha é laranja, mato é verde. Numa sede sem telhado
não há telha nenhuma: o topo do muro é o **mesmo concreto cinza do pátio**, e
cor não separa os dois. Medido na 3ª imagem: 73% do quadro virava chão de
andar, parede incluída.

Resolvido no importador (`crista`, 10/09/2026): o que separa não é cor, é
forma. O topo da parede é uma faixa mais clara que a vizinhança dela; o piso é
chapado. Tira-se do candidato tudo que estiver 8 níveis de brilho acima da
mediana de janela larga, **antes** da morfologia. Medido na mesma imagem:
partindo só da semente da rua, o chão entra pelo portão, atravessa as duas
portas e enche as duas salas, com as paredes bloqueadas e 51,7% de chão.

**Não mude a cor das paredes por causa disso.** Concreto cinza está certo e
continua certo.

## Depois que a imagem estiver boa

Ponha o arquivo em `img/cenas/` e me mande — a entrada em `FONTES` do
`importar_cena_foto.py` precisa de uma **semente por sala** (o ponto, em fração
da tela, de onde a conectividade abre), e o piso de sala tem tom parecido com o
de laje, então o recorte quase sempre precisa de acerto. Depois disso a máscara
sai da foto e a cena é conferida com `ferramentas/prova_mascara.py`.
