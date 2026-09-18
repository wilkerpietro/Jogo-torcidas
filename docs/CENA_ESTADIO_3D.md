# O estádio e a cidade em 3D — a segunda cena

Este documento é o registro da cena `estadio3d.html` refeita do zero: o
que foi pedido, como foi resolvido, o que foi medido e o que ficou aberto.
Substitui o documento da primeira versão (histórico em `e3a617d`).

## 1. O que foi pedido

Um estádio de bairro inspirado na foto aérea (bacia retangular de quinas
redondas, arquibancada única de concreto, sem cobertura), com:

- corredor de acesso **embaixo** da arquibancada, com comércio;
- **oito vomitórios** furando a arquibancada, como na foto;
- **três portões**: um atrás de cada gol e um na lateral sul;
- **oito quarteirões** em volta, o estádio no meio;
- a torcida nascendo **nas pontas do bairro** e caminhando até o estádio,
  com briga possível em qualquer lugar — rua, portão, corredor, escada,
  arquibancada — e a PM tentando evitar;
- os bonecos, os sinais de combate e o pad de movimento **reaproveitados**
  sem uma linha mexida: `bonecos3.js`, `boneco.glb`, `sinais3d.js`,
  `pad3d.js` + `pad3d.css`;
- `combate.js` intacto.

## 2. A dobra, engolida pelo gramado

`combate.js` é um tabuleiro plano: uma célula, um lugar, sem altura. O
corredor debaixo da arquibancada existe porque `mundo(x, y)` **dobra o
tabuleiro**: duas faixas distantes dele caem no mesmo ponto do mundo em
alturas diferentes. Isso já era assim na primeira versão.

O que mudou é quem paga a conta. Antes, a faixa do corredor empurrava tudo
que estava do lado de fora pra longe do centro — em curva, porque a dobra é
radial —, e uma rua reta atravessando isso entortava. Agora **o retângulo
âncora do tabuleiro é 86 menor por lado que o gramado do mundo** (468 × 244
contra 640 × 416). Ninguém pisa no gramado, então não custa nada. Fora do
estádio, **tabuleiro = mundo**: rua reta é rua reta, prédio é retângulo nos
dois lugares.

| faixa | tabuleiro `d` | mundo `r` | altura | máscara |
|---|---|---|---|---|
| pista + placas | 0 → 24 | = d | 0 | bloqueia |
| **arquibancada** (18 degraus de 8 × 4,6) | 24 → 168 | = d | 6 → 84,2 | anda |
| parapeito | 168 → 182 | = d | 84 → 110 | bloqueia |
| **corredor** | 182 → 310 | **96 → 224** | 0 | anda |
| fachada (arcada, 3 portões) | 310 → 326 | 224 → 240 | 0 → 84 | bloqueia, menos o vão |
| calçada do estádio | 326 → 358 | 240 → 272 | 0 | anda |
| bairro | 358 → | = tabuleiro | 0 | anda, menos prédio e carro |

Nos lados retos, "`r = d − 86`" é a identidade. Só nas quatro quinas os dois
mapas divergem — uma lasca de até 36 unidades na diagonal —, e ela fica
**bloqueada** (é o canto das torres, com gradil na curva da calçada).
Ninguém pisa, ninguém vê, e "uma célula, um lugar" continua verdadeiro.

O corredor tem **128 de fundo** (era 72), com pé-direito de 39 na parede de
dentro e 76 na de fora. Era o que faltava pra câmera de ombro (braço de 105)
parar de bater em pilar.

## 3. Os vomitórios

Oito, como na foto: dois por lado. A boca é o 11º degrau (r = 112, altura
56,6) e a escada desce **pra fora**, por baixo da arquibancada, até o chão
do corredor em r = 192: 80 de tiro pra 57 de queda, 35°, doze degraus.
Sobe-se de frente pro gramado. A régua da prancha de vomitório está toda lá:
guarda-corpo a 0,90 m, corrimão a 1,10 m, faixa amarela no nariz, corrimão
central. O buraco na arquibancada vai de r = 112 a 152 (cinco degraus, ~25%
da profundidade, como os quadrados escuros da foto); dali pra fora é túnel
coberto, com a laje voltando por cima.

A regra que não se burla: **o pé da escada cai depois da última fila**
(192 > 168). A tira do vomitório consome as células da arquibancada no
caminho, e se a escada acabasse antes da borda sobraria arquibancada que se
vê e não se pisa. Sobram 32 atrás da escada pra circular no corredor.

Entre a parede de dentro (r = 96) e a boca (r = 112), embaixo da
arquibancada baixa, é concreto maciço (a "cabeceira"): as células dali são
a escada, e nada anda embaixo dela.

## 4. A cidade do mapa, e o tabuleiro

A segunda rodada trocou o bairro de oito quarteirões pela **cidade da
imagem**: um mapa desenhado de 1500 × 1100 px, com o estádio no
norte-centro, a costa a leste, o mato a oeste e dois campos de várzea no
sul. Um pixel do mapa é **PX = 5,4** unidades — a escala que deixa o
estádio do mapa do tamanho do quarteirão do estádio (1184 × 960).

**O que se anda e o que se desenha são coisas diferentes.** O tabuleiro
(a máscara) é um recorte do mapa — px 170–1170 × 90–1100, **5400 × 5456**
unidades, 675 × 682 = 460 mil células — e o que se desenha vai além dele
até o mar e o mato de fora (px −60–1560 × −60–1160). Fora do estádio o
mundo é o próprio tabuleiro, sem dobra nenhuma.

Como a cidade é lida do mapa (`dados/cena_estadio.js`, seção "A cidade"):

- **A grade.** Treze colunas (norte-sul) e quinze linhas (leste-oeste),
  cada uma com a largura do mapa; as quatro que encostam no estádio vêm do
  quarteirão dele, pra bater exatamente. Entre ruas há células: dentro do
  contorno da cidade (um polígono lido do mapa) a célula é um **quarteirão**
  — calçada de 32 em volta, lotes de frente contínua, quintal no miolo;
  fora, é mato, praia ou mar. O mapa é tratado com a grade alinhada aos
  eixos (no desenho ela é girada uns 15°), e a costa fica em diagonal.
  **A rua só existe entre células urbanas** (`naRua` olha as células
  encostadas na faixa): a grade acaba no último quarteirão, sem toco de
  asfalto pelo mato, e a pintura segue a mesma regra, célula por célula.
- **A costa.** `xCosta(y)`, uma função do mapa: além dela é mar
  (bloqueia); 45 px pra dentro é praia (anda); mais 14 px é a **avenida
  beira-mar**, que é uma avenida de verdade (está em `AVENIDAS`), com
  calçada do lado de terra e casas rotacionadas de frente pro mar.
- **O quarteirão da orla acaba na costa, na diagonal.** A costa é
  diagonal e a célula é reta, então cada célula guarda duas coisas: o
  **polígono do miolo** (`polMiolo`, o miolo recortado pela linha da
  cidade), que é quem manda na máscara, na casa da avenida e no chão;
  e o **retângulo** `ix0..ix1`, o maior que cabe nele (recuado até o
  ponto mais a oeste da costa no trecho), que é o que os lotes axiais
  usam, porque lote axial é reto. Quem decide se a célula é quarteirão
  é a **área do polígono**, não o centro da célula: na faixa da orla o
  centro já cai na areia, e a terra que sobrava virava mato entre o
  último quarteirão e a praia. Célula mais fina que duas calçadas tem
  miolo às avessas e não é miolo nenhum — `areaPol` do avesso daria
  área de verdade, e era isso que punha laje em cima da rua.
- **As avenidas** são **linhas de vários pontos** com largura — não um
  segmento: a do sudoeste entra pelo canto, dobra e morre na rua sul do
  estádio; a do noroeste nasce numa rua da grade e sai da cidade pelo norte;
  as duas do oeste e a do norte saem da cidade e viram estrada pelo mato
  até a borda do que se desenha. `distAvenida` mede até o trecho mais
  perto; a banda é andável (com calçada) e corta os quarteirões de
  verdade. Fora do contorno da cidade a pintura tira a calçada — é estrada.
  A frente da avenida é de **casas rotacionadas** (o lote tem ângulo;
  `dentroLote` gira o ponto), que entram ANTES dos lotes axiais e tentam
  fundos menores perto da esquina; o lote axial que pisa numa delas ou na
  calçada da avenida encolhe pro lado da frente (48, 32, 20) antes de
  sair, e no fundo de 20 vira muro. Quem decide "casa da avenida" é a
  faixa **sem a ponta redonda** (`naFaixaDaAvenida`): a avenida acaba
  numa rua, e o quarteirão do outro lado não é dela — com a ponta
  contando, ele ficava pelado.
- **Três chãos, um sobre o outro** (`bairro3d.js`): a **calçada** (laje de
  1,4) vai da guia da rua até a guia da avenida; o **chão do lote** (1,6)
  cobre o miolo e para na calçada da avenida; o **quintal** (10) fica no
  meio. Sem o do meio, a sobra em cunha que a avenida deixa no quarteirão
  lia como um descampado de cimento. Os três saem de um recorte convexo
  (`semAsAvenidas`): o retângulo vai sendo cortado meio-plano a
  meio-plano por cada banda de avenida que o cruza, o que sobra continua
  convexo, e sai como prisma.
- **Três regras que não se quebram**, conferidas por `auditar_geo.js`
  (roda o `bairro3d.js` no node com um three.js de mentira e olha
  vértice por vértice): **nada por cima do asfalto**, **casa nenhuma por
  cima da calçada**, **calçada nenhuma por cima do asfalto**, **nada na
  orla nem na areia**. O que as
  garante: o recorte acima; o `limite` do `caixa()`, que corta beiral,
  janela, porta e placa pelo miolo do quarteirão; o teste do beiral nas
  casas da avenida; e a copa da árvore menor que meia calçada (tronco no
  eixo dela, a 16 da guia, copa de raio até 13).
- **A frente da avenida se fecha com muro.** A avenida é diagonal e o
  quarteirão é reto, então a sobra é uma cunha: perto da ponta não cabe
  casa. Tenta casa em cinco larguras e cinco fundos; só depois, muro
  fino (14 de fundo), que não tem beiral e entra onde casa não entra.
  Dá 81–88 % da frente ocupada, contra 55 % antes.
- **Os campos de várzea** são células grandes abertas com cerca de mourão
  (bloqueia, com porteira no meio dos lados norte e sul), arquibancadinha
  de três degraus (bloqueia) e traves. O retângulo declarado é só a
  **intenção** — diz quais células o campo toma; passada a
  classificação, ele encolhe pra caixa dessas células menos a calçada,
  e é isso que o faz caber no quarteirão em vez de atravessar a rua e
  a areia. E rua nenhuma corta campo ao meio: entre duas células de
  campo `ruaEntre` diz que não há asfalto, na máscara e na pintura.
- **A decoração.** Texto não sai de caixa, sai de textura: a planta
  guarda só o dizer (`l.placa`, `l.pixacao`), e o `bairro3d.js` junta
  os que apareceram num atlas de 256 × 64 por dizer, uma malha só, com
  recorte por alfa (sem transparência, sem ordenar). Letreiro de
  comércio é fundo pintado com borda, acima da porta (que encurta pra
  17 quando há letreiro); pixação é tinta direta em itálico torto,
  abaixo da linha das janelas e fora do meio, presa à altura da
  parede — em muro de 12 ela cabe nos 12. São 34 nomes de comércio e
  25 dizeres de parede, sorteados com a semente da planta, então a
  cidade sai igual toda vez.
- **O mato**: terreno aberto com moitas sorteadas (bloqueiam, num balde
  espacial de 256) e trilhas pintadas. A textura do mato, do mar e da
  praia sai do pintor, não de geometria.
- **A máscara é "rua recortada de quarteirão sólido"**: mar → campo →
  carro → avenida → rua → miolo do quarteirão (bloqueia) / calçada (anda)
  → moita → o resto anda. Lote é só desenho e altura pra câmera. Cada
  célula sabe os seus lotes e árvores, e `celulaEm(x, y)` acha a célula
  por busca binária nas bordas: é o que deixa 460 mil `anda()` custarem
  0,3 s na carga.
- **As sedes** ficam onde o mapa põe a torcida: a mandante no quarteirão
  do canto sudoeste, de frente pro mato; a visitante de frente pra orla,
  a nordeste. A torcida nasce na calçada da porta.

A cidade sai em **pedaços de 4 × 4 células** (`bairro3d.js`), que a câmera
descarta fora do quadro; carros, postes e campos numa malha; moitas em
outra.

**A pegadinha que custou uma hora, ainda vale.** `arredores.js` lê
`largura`, `altura` e `celula` **uma vez, na carga**, da cena padrão — e a
malha, a malha de corpo e a memória de rota nascem daquele tamanho. O
comentário do próprio módulo diz: "todas têm o mesmo tamanho de tela".
Trocar de cena não redimensiona nada. A saída, sem mexer no módulo:
**nesta página a cena padrão é o estádio** (`TO.dados.cenaArredores =
TO.dados.cenaEstadio`, antes de `arredores.js` subir). O jogo em
`index.html` não passa por aqui.

## 5. A vida da cena — o que o combate já fazia, e como foi ligado

Nada de mecânica nova. O que há:

- **`id: 'arredores'`, de propósito.** `combate.js` só liga a vida do lado
  de fora — ficar na sede até a hora, bonde hostil sair atrás do rival,
  fugir é entrar — quando `D.id === 'arredores'` (`fugaPelaEntrada`). A
  página acha a cena pelo registro `TO.dados.cenas.estadio`, não pelo id.
- **O destino é o setor, não o portão.** `entradas` são os dois setores na
  arquibancada (oeste mandante, leste visitante). O campo de fluxo leva
  portão → corredor → vomitório → arquibancada sozinho, pela máscara. Quem
  chega "entrou" e some, como quem entra no portão nos arredores.
- **O setor visitante já está dentro, de guarda.** O combate só tem um
  estado "fica parado esperando": `guarda`, que dorme até o rival chegar a
  `gatilho.perto` (200, no tabuleiro). Sem isso todo mundo caminhava até o
  destino e sumia em 50 segundos, e o estádio ficava vazio antes de você
  entrar. O destino desse grupo é a **saída sul** (fora do portão sul, no
  funil do cordão): acordado e em paz, o bonde caminha pro destino, e pelo
  sul ele atravessa o corredor por uns 35 segundos — com a saída leste,
  a 13 segundos do setor, ele já tinha ido embora quando o líder chegou
  (§8). A retaguarda deles chega andando do quarteirão NE.
- **O relógio e o clima.** `minutosAteJogo = 60` na página: a marcha pro
  estádio começa perto de um minuto (tempo de você chegar antes), e o
  bonde hostil sai atrás do rival entre 20 e 55 segundos. `raioVadiagem =
  220` pra ninguém vagar até o meio do estádio. `tensao = 80`: quatro em
  cinco bondes visitantes vêm pra brigar — com 60, o setor de guarda
  acordava em paz uma vez em duas e ia embora sem briga.
- **O cordão da PM não fecha o portão.** Cobre 48 dos 80 e deixa um funil
  de 32 num lado. Selado, o campo de fluxo não tem rota e todo mundo para
  na grade batendo nela.
- **As divisas de setor são radiais**, do 2º ao 17º degrau, em oito
  módulos — cortam a arquibancada em duas metades (quatro vomitórios cada)
  e quebram, como toda grade. `bonecos3` desenha grade como uma caixa por
  módulo, na altura do centro dele; com três módulos virava uma escada de
  blocos amarelos flutuando.
- **PM:** posto nos três portões, dois no corredor, dois nas divisas e um
  na rua sul, que é onde os dois lados se cruzam se alguém for caçar.
  `tropaChoque: true`.

## 6. O que foi medido

- Máscara: 241.165 células andáveis, **220.802 onde um corpo cabe, 100%
  alcançáveis** do spawn do jogador (BFS com a mesma régua do
  `arredores.js`: as 8 vizinhas livres, grades e filas bloqueando).
- Por andar (células de corpo): rua/cidade 211.000 · corredor 4.371 ·
  vomitório 577 · arquibancada 3.572 · portão 48.
- Cena: 18 degraus · 8 vomitórios · 3 portões · 8 balcões · **98
  quarteirões · 646 lotes (20 rotacionados) · 630 moitas · 177 árvores ·
  73 postes · 55 carros · 2 campos** · 114.612 triângulos estáticos em 11
  pedaços de cidade mais o estádio · 16 chamadas de desenho sem gente na
  tela; com a torcida inteira na frente da câmera, umas 550 (cada boneco
  do Blender é várias malhas, e a sombra desenha tudo duas vezes — o modo
  leve corta a sombra primeiro por isso).
- Boneco do Blender ativo (`comModelo: true`). Planta carregada em 0,3 s;
  a cena montada (máscara decodificada, malha de corpo, campos de fluxo dos
  quatro spawns, geometria) em **618 ms** no navegador do teste.
- **O custo da simulação no tabuleiro grande**: 3,4 ms por passo de 1/60
  com as duas torcidas e a PM na rua (400 passos em 1,38 s). A 60 fps é um
  quinto do quadro; a 3 fps, com vinte passos por quadro, são 70 ms — cabe.
- **A cidade atravessada**: sem ninguém jogar, o 2º escalão mandante saiu
  da sede do canto sudoeste e chegou ao setor mandante (17 entraram) entre
  106 e 168 s de relógio — uns 4.600 de caminho pela avenida diagonal, o
  portão oeste, o corredor e o vomitório. A retaguarda visitante, sorteada
  hostil, atravessou a cidade da orla até a sede mandante e brigou lá:
  dez mandantes e dois visitantes caídos aos 168 s. O setor de guarda
  ficou no lugar, porque o líder não se mexeu.
- A caminhada do líder e a briga dentro do estádio estão no §8 (medidas no
  bairro de oito quarteirões; a cidade grande alonga o caminho, não muda o
  mecanismo).

## 7. Bugs achados no caminho, e o que eram

1. **Metade do gramado escura no zenital.** Não era sombra: era o plano
   escuro de "além do mapa", a 0,3 abaixo do chão. A 2300 de distância o
   z-buffer não separa 0,3, e o plano de baixo vazava por uma diagonal (a
   diagonal dos dois triângulos do plano). Plano a −6 e `near` 2.
2. **Barras vermelhas em cima da arquibancada.** Os toldos das lojas, em
   46–50, atravessavam a laje: o pé-direito na parede de dentro é 39. O
   comércio inteiro desceu pra baixo de 39.
3. **Câmera livre olhando sempre pro centro.** `posicionarCamera` resetava
   o alvo pro centro do estádio em toda câmera que não segue o líder — a
   câmera de foto incluída. E ela também precisava saber se o *alvo* está
   embaixo da laje, não só o líder.
4. **PORTÃO SELADO** — o §4, e antes dele o cordão do tamanho do portão.
5. **Bandeirão azul no setor mandante.** `montarSetores` desenhava um
   bandeirão por `entrada`, escolhendo o lado pela direção; a saída leste
   (por onde o setor visitante vai embora) aponta como o setor oeste e
   pintava um bandeirão azul por cima do vermelho. Agora só setor tem
   bandeirão, e o lado vem de onde o setor está.
6. **Descendo a escada, a câmera afundava no degrau.** `teto()` devolvia o
   fundo da laje sobre o *buraco* do vomitório, onde é céu aberto; a
   câmera era presa "sob a laje" e entrava no concreto — a faixa amarela
   do nariz tomava um terço da tela. `teto`, `superficie` e `solido` agora
   sabem que o buraco (r < 152) é aberto e que ali o chão é a escada; no
   túnel a laje continua laje.
7. **A câmera parava rente ao chão.** A marcha do sólido parava no
   primeiro concreto e recuava pra 55% do braço — numa escada, num degrau
   ou atrás de uma mureta, 55% do braço é dentro do concreto. Levantar a
   câmera até "10 acima do chão mais alto do caminho" também não bastou:
   com o líder embaixo dela, a linha de vista ainda atravessava o
   parapeito (a foto mostrava a arquibancada oposta em cima e mureta em
   baixo). A regra que ficou é geométrica: `P.piso(X, Y, Z)` diz o chão
   sob cada amostra do caminho *no andar em que ela está*, e a câmera
   sobe até a reta líder→câmera passar 6 acima de todos eles, com teto de
   100 acima da cabeça do líder. Só parede, pilar, árvore e laje param.
8. **A cabeceira era vazio pra câmera.** Entre a parede de dentro (r = 96)
   e a boca (r = 112), sob os degraus 9 e 10, é concreto maciço — as
   células dali são a escada. `solido`, `piso` e `teto` não sabiam, e com
   o líder no pé da escada a câmera entrava ali. Agora é maciço até a
   arquibancada.
10. **Três fps.** A captura do dono, com a cena antiga (55 mil triângulos,
   30 chamadas), rodava a 3 fps — isso não é cena pesada, é Chrome sem
   placa de vídeo (SwiftShader, o rasterizador por software que ele usa
   com a aceleração desligada ou o driver bloqueado). A página passou a
   dizer na tela quem desenha (`WEBGL_debug_renderer_info`) e a avisar
   quando é software. E, independente disso, entraram três medidas: o
   **modo leve** automático (sombra, resolução, anisotropia e névoa caem
   depois de 1,5 s ruins e voltam depois de 5 s folgados; `L` fixa, `K`
   devolve), a **simulação em passo fixo** (o tempo real acumula e
   `combate.js` dá até 24 passos de 1/60 por quadro: a 3 fps a tela pula,
   mas o jogo deixa de correr em câmera lenta) e `preserveDrawingBuffer`
   só com `?foto=1` (custava uma cópia por quadro e só serve pra tirar
   foto).
9. **Cabeça dentro da viga.** Na parede de dentro do corredor o pé-direito
   é 39, as vigas do teto descem 6 e o boneco em escala 1,15 tem 39 — na
   foto da briga o líder estava com a cabeça dentro de uma viga. Viga só
   de r = 124 pra fora, onde o teto passa de 53; perto da parede o teto é
   liso.
11. **As avenidas ficaram feias.** O dono perguntou se "rua com curva é
   ruim de fazer". Não é — o feio era outra coisa, visto nas fotos de
   perto: quarteirões pelados dos dois lados da avenida (o lote axial saía
   se chegasse a 126 da avenida, e a ponta redonda da avenida contava, então
   até o quarteirão do outro lado da esquina perdia as casas), tocos de
   asfalto da grade entrando pelo mato até a linha do contorno, calçada de
   avenida acompanhando a estrada pelo deserto, e a avenida do sudoeste
   como um segmento reto que não desaguava em rua nenhuma. As avenidas
   viraram linhas de vários pontos que nascem e morrem em rua da grade ou
   saem da cidade como estrada; a rua da grade passou a existir só entre
   células urbanas; a calçada da avenida é recortada pelo contorno; e os
   lotes ganharam segunda chance (casa rotacionada com fundo menor, lote
   axial encolhido). De 656 lotes (28 na avenida) pra 714 (39). A máscara
   continua 100 % alcançável.

## 8. A caminhada do líder

Medida com o roteiro `sim3.js`: waypoints em rua e corredor, a tecla certa
apertada a cada passo de 50 ms até chegar, o líder a ~41 px/s. Nenhuma
grade tocada até o encontro.

| trecho | chegou em | onde | altura 3D | relógio |
|---|---|---|---|---|
| sede → esquina da rua norte | (658, 562) | rua | 0 | 9 s |
| rua oeste até a frente do portão | (662, 1013) | rua | 0 | 17 s |
| calçada e portão oeste | (702, 1019) | rua | 0 | 18 s |
| portão → corredor | (795, 1029) | corredor | 0 | 20 s |
| corredor → pé do vomitório 4 | (808, 947) | vomitório | 5 | 22 s |
| escada acima → arquibancada | (954, 939) | arquibancada | 52 | 24 s |
| **setor mandante** | (956, 1013) | arquibancada | 52 | **26 s** |
| de volta pela boca, escada abaixo | (813, 938) | vomitório | 9 | 30 s |
| atrás da escada, no corredor | (783, 938) | corredor | 0 | 31 s |
| quina noroeste do corredor (arco) | (883, 739) | corredor | 0 | 36 s |
| corredor norte, atrás do vomitório 0 | (1088, 611) | corredor | 0 | 41 s |
| corredor norte, atrás do vomitório 1 | (1459, 611) | corredor | 0 | 58 s |
| quina nordeste do corredor (arco) | (1755, 808) | corredor | 0 | 65 s |
| **corredor leste** | (1774, 890) | corredor | 0 | **67 s** |

Do spawn ao setor: 26 segundos. A volta inteira por baixo, da escada oeste
ao lado leste, passando pelas duas quinas redondas e atrás das duas
escadas do norte: 37 segundos. Na última rodada o roteiro fechou a rota
inteira: atrás do vomitório 6 aos 65 s, pé da escada aos 66 s, escada
acima aos 69 s e **setor visitante aos 71 s** (arquibancada, altura 57)
— o caminho completo que o pedido descreve, sem tocar em grade. (Numa
rodada anterior o líder chegou ao setor visitante pela arquibancada em
94 s, e a chegada foi recebida com bomba: "Bomba deles", cinco mandantes
caídos.)

Nessa última rodada, porém, o setor deles estava **vazio** ao chegar: com
`perto: 300` os guardas acordaram aos 58 s, quando o líder ainda estava no
corredor nordeste, do outro lado da laje (item 9 do §9); o bonde deles
tinha sido sorteado em paz, e acordado e sem inimigo ao alcance a regra
do combate é caminhar pro destino — a saída leste, a 13 segundos. Dezesseis
dos dezessete foram embora antes de o líder subir a escada. Foi isso que
mudou `perto` pra 200, a saída deles pro portão sul e a tensão pra 80.

**A rodada de confirmação, com os três ajustes.** O setor acordou aos 63 s,
com o líder na quina nordeste do corredor — o alerta da PM subiu 11 → 40
→ 82 → 100 conforme ele se aproximava —, e veio pra cima ("SETOR
VISITANTE: veio pra cima"). A briga desceu ao encontro dele:

| relógio | arquibancada | vomitório | corredor | rua | caídos (mand./vis.) |
|---|---|---|---|---|---|
| 71 s (chegada) | 1 | **21** | 6 | 40 | 7 / 0 |
| 77 s | 1 | 6 | **22** | 39 | 13 / 0 |
| 84 s | **18** | 12 | 4 | 33 | 15 / 0 |
| 96 s | 18 | 6 | 3 | 25 | 15 / 0 |

Escada, corredor e arquibancada, nessa ordem. O bonde do jogador apanhou
porque no roteiro ninguém joga — o líder só anda —, e o 2º escalão chegou
ao setor mandante (16 entraram) sem se envolver. O equilíbrio da briga é
calibragem de `combate.js`, não desta cena.

**O encontro.** O setor visitante, de guarda, acordou aos 58 s ("o setor
deles viu o bonde chegar") e a PM foi a 100% ("A PM encostou no seu
pessoal"). Dali a 124 s a briga já estava em dois andares:

| relógio | arquibancada | vomitório | corredor | rua | caídos (mand./vis.) |
|---|---|---|---|---|---|
| 87 s | 19 | 4 | 1 | 36 | 2 / 0 |
| 105 s | 21 | 2 | 1 | 36 | 2 / 1 |
| 112 s | 18 | **13** | 1 | 31 | 3 / 3 |
| 124 s | 20 | **15** | 4 | 22 | 9 / 3 |

Quatro visitantes saíram pelo portão leste no meio da briga; dois
mandantes do 2º escalão chegaram ao setor. Nenhum erro de console em
nenhuma rodada.

**O que o roteiro não fez, e por quê.** O navegador do teste é guloso —
anda em linha reta pro waypoint — e três vezes essa linha entrou na tira
de um vomitório pelo lado, onde está a mureta: a escada só se entra pelo
pé ou pela boca. É limitação do teste, não da cena: o campo de fluxo dos
bots contorna a mureta sozinho (é o que os 15 do vomitório mostram). Na
primeira rodada, o líder foi **preso** encostando no cordão da PM do
próprio portão — foi isso que tirou o cordão do portão da casa.

## 9. O que ficou aberto

1. **Quem chega no setor some.** É a regra do combate ("entrou"). Ficar de
   pé cantando seria mecânica nova. O setor visitante contorna isso sendo
   guarda; o mandante não tem equivalente — o seu bonde é você.
2. **A árvore é um pinheiro.** Duas pirâmides. Lê como árvore de longe; de
   perto é árvore de Natal. Um dodecaedro achatado resolve, outra sessão.
3. **A grade é uma caixa.** `bonecos3` desenha cada módulo como caixa de 30
   de altura; o cordão e a fila na frente do portão são blocos amarelos e
   cinza. Não mexi de propósito — `bonecos3.js` era pra ficar intacto.
4. **A escala continua a (a)** do `PLANO_CENA_3D.md`: boneco de mesa vivo.
   É consequência de `combate.js` intacto — a (b) é recalibrar ele
   inteiro. A arquibancada tem 84 de altura pra um boneco de 34.
5. **A câmera de ombro ainda encontra pilar** no corredor, menos que antes
   (o corredor é 128 e não 72), mas encontra. O braço encurta pra 70% sob a
   laje e o sólido empurra a câmera pra perto do líder.
6. **O fps de verdade.** Este ambiente só tem rasterizador por software; os
   números de chamada e triângulo valem, o fps não. Rode aí e olhe o
   contador; `H` desliga a sombra, que é o primeiro suspeito.
7. **A cena não está no dia de jogo.** É uma página à parte, como antes.
8. **Placar, bandeirão de mastro, fumaça de sinalizador**: continuam não
   existindo. O bandeirão de setor é uma faixa colorida na mureta.
9. **O gatilho mede distância no tabuleiro, e o tabuleiro é dobrado.**
   `conferirGatilho` acorda o setor de guarda quando qualquer mandante
   chega a 300 de qualquer guarda — em coordenada de tabuleiro. Na dobra,
   o corredor norte é vizinho da arquibancada leste: na caminhada medida,
   o líder passando pelo vomitório 1 (no corredor, com laje por cima)
   estava a 269 de um guarda parado no alto do setor deles, e a casa
   acordou "através do concreto". Não incomoda no jogo — o setor acorda
   um pouco antes de ver o bonde —, mas é a dobra vazando pra simulação,
   e é o único lugar em que ela vaza. Corrigir é medir em coordenada de
   mundo dentro de `combate.js`, que ficou intacto de propósito.

## 10. O que este trabalho NÃO mexeu

- `combate.js`, `arredores.js`, `cenario.js`, `ponte.js`, `cena3d.js`,
  `bonecos3.js`, `sinais3d.js`, `pad3d.js`, `pad3d.css`, `boneco.glb`:
  intactos.
- `cenas.js`, `cena_arredores.js` e todo dado de cena do jogo 2D: intactos.
  A cena do estádio se acrescenta ao mapa de cenas de fora, e a troca da
  cena padrão acontece só em `estadio3d.html`.
- `index.html`, `arredores.html`, `arredores3d.html`: intactos.

## 11. Os arquivos

| arquivo | o que é |
|---|---|
| `dados/cena_estadio.js` | a planta: dobra, vomitórios, portões, comércio, a cidade (grade, costa, avenidas, campos, mato, lotes, sedes), máscara, spawns, setores, PM, grades, filas, gatilho |
| `js/diajogo/estadio3d.js` | arquibancada, corredor, comércio, vomitórios, gradil, torres, setores, câmera (linha de vista, modo leve), ligação com a simulação e com a gente |
| `js/diajogo/bairro3d.js` | a cidade em pedaços: lotes (axiais e rotacionados), calçadas, árvores, carros, postes, campos, moitas |
| `js/diajogo/estadio_pintura.js` | a textura do chão do mapa inteiro: mato, quarteirões, ruas, avenidas, costa, campos, estádio |
| `estadio3d.html` | a página: a troca da cena padrão, o relógio, o passo fixo, o pad, o teclado, a linha de estado com o renderizador |
