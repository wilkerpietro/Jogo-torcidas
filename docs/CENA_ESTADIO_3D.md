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
norte-centro, a costa a leste, o mato a oeste e um campo de várzea no
sul (o segundo, o que ficava ao lado do estádio, virou terreno baldio).
O mato a oeste deixou de ser só descampado: é onde mora a FAVELA. Um pixel do mapa é **PX = 5,4** unidades — a escala que deixa o
estádio do mapa do tamanho do quarteirão do estádio (1184 × 960).

**O que se anda e o que se desenha são coisas diferentes.** O tabuleiro
(a máscara) é um recorte do mapa — px 170–1170 × 90–1100, **5400 × 5456**
unidades, 675 × 682 = 460 mil células — e o que se desenha vai além dele
até o mar e o mato de fora (px −60–1560 × −60–1160). Fora do estádio o
mundo é o próprio tabuleiro, sem dobra nenhuma.

Como a cidade é lida do mapa (`dados/cena_estadio.js`, seção "A cidade"):

- **A grade.** Sete colunas (norte-sul) de 150 px em 150 e onze linhas
  (leste-oeste) de 86 px em 86, com 22 px de pista; as quatro que
  encostam no estádio vêm do quarteirão dele, pra bater exatamente.
  **Era o dobro disso, a cada 70 px e com 12 de pista**: dava quarteirão
  de 11 m com três casas e rua de 2,9 m, onde o boneco de 1,75 parecia
  um gigante. A pista está em 5,3 m. O quarteirão passou por 150 × 150
  e voltou: **quadrado ele tinha 27 m de lado e um vazio no meio** — as
  duas fileiras de lote têm 4 a 5 m de fundo cada, então sobrava um
  descampado de 17 m entre os fundos. Agora ele é **comprido e raso**
  (27 × 13 m): as costas das duas fileiras quase se encontram, o quintal
  virou uma tira, e são 36 quarteirões com cerca de doze casas cada. O
  tabuleiro não mudou de tamanho: as mesmas 460 mil células, a mesma
  textura de chão, a mesma calibragem do combate. Entre ruas há células: dentro do
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
  contando, ele ficava pelado. Mas quem decide **colisão** é a faixa
  inteira, ponta incluída (`tocaAvenida`), e a conta é a **distância
  exata entre o retângulo e o eixo** — canto do lote contra o segmento,
  ponta do segmento contra o lote, zero se eles se cruzam. Testar os
  quatro cantos e o centro, que era o que havia, deixava passar dois
  casos: a avenida diagonal mordendo o **meio de uma aresta** sem tocar
  canto nenhum, e a **ponta redonda** da avenida, que `naFaixaDaAvenida`
  ignora de propósito. Foi o que pôs uma casa na boca da avenida oeste e
  outra na da norte.
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
- **O campo de várzea** é uma célula grande aberta com cerca de mourão
  (bloqueia, com porteira no meio dos lados norte e sul) e traves. A
  arquibancadinha de três degraus saiu: lia como uma escada solta no
  meio do campo. O retângulo declarado é só a
  **intenção** — diz quais células o campo toma; passada a
  classificação, ele encolhe pra caixa dessas células menos a calçada,
  e é isso que o faz caber no quarteirão em vez de atravessar a rua e
  a areia. E rua nenhuma corta campo ao meio: entre duas células de
  campo `ruaEntre` diz que não há asfalto, na máscara e na pintura.
- **Quatro deles vieram primeiro.** Praça (no bairro do sul),
  delegacia (a oeste, no caminho da torcida), hospital (a oeste) e
  shopping (ao sul). Nenhum encosta no estádio: a vizinhança dele é
  de casa e comércio, como no mapa. Cada um monta as próprias **peças** a partir do miolo da célula,
  e a peça diz se bloqueia: a máscara lê as que bloqueiam, o 3D desenha
  todas, e a pintura repinta as de `piso` — é a mesma lista, então não
  há como uma desencontrar da outra. Tudo em retângulo reto, que é o que
  a máscara sabe perguntar rápido. O miolo desses quarteirões é
  **andável em volta das peças**, ao contrário do quarteirão de casa,
  que é maciço: são quase 4.000 células a mais pra briga acontecer.
  A praça tem coreto, fonte, busto, quatro gramados com caminho em cruz,
  bancos, árvores e postes; o hospital tem bloco de sete andares com
  grade de janela, ala oeste, marquise do pronto-socorro com ambulância
  embaixo, cruz na fachada e muro com portão; a delegacia tem pórtico de
  colunas, mastro com bandeira, guarita e três viaturas nas vagas
  pintadas; o shopping tem clarabóia e máquina no teto, volume de
  entrada envidraçado, marquise, totem e estacionamento de três
  fileiras.
- **As cunhas viram pracinha.** Onde a avenida corta o quarteirão na
  diagonal sobra um triângulo pequeno demais pra casa, que ficava como
  terreno vago. A sobra não é um polígono que dê pra deduzir — é o que
  resta do miolo depois de tirar lote, quintal e o corredor da avenida
  —, então ela é achada por **varredura de 8 em 8**, com as manchas
  grudadas juntadas por preenchimento. Mancha entre 3.600 e 52.000 de
  área vira pracinha: chão de pedra, canteiro de grama, árvore e, se
  couber, dois bancos e um poste. Dezenove delas. Nada ali bloqueia: o
  pedaço continua andável, e é bom que continue — é atalho e é lugar
  de briga.
- **A ESCALA É A DO BONECO.** Ele tem **34 unidades** pra 1,75 m, então
  uma unidade é **5,1 cm** e um metro são **19,4 unidades** — é a
  constante `METRO`, e é dela que toda medida de móvel tem de sair.
  (Este parágrafo dizia "39 unidades, 4,5 cm", que não bate com a
  constante; foi de onde saiu uma leva inteira de mobília 1,8 vez
  maior que o certo.) Pelas alturas antigas a casa tinha 1,6 m, a
  porta 0,90, o muro 0,54 e o poste 2,07: o boneco era um gigante entre
  casinhas, e não passava pela própria porta. Agora está em metros de
  verdade — porta de 2,10, casa de 3 a 3,6, sobrado de 5 a 6, muro de
  1,7 a 2,2, árvore de rua de uns 5, poste de 5,2. A planta da cidade
  (calçada de 1,4 m, rua de 2,9) continua estreita, que é herança da
  escala do mapa; mexer nela mexeria na grade e na máscara inteiras.
- **Telhado de duas águas.** Caixa chapada em cima de caixa lia como
  laje. Agora são duas rampas que se encontram na cumeeira, com as
  empenas fechando as pontas, e a cumeeira corre no lado maior — que é
  como se cobre casa de rua. Prédio e sede seguem de laje, que é o
  certo pra eles. O beiral sai 2 do corpo mas vem cortado pelo miolo do
  quarteirão, a mesma regra de sempre.
- **Oito equipamentos**: praça, delegacia, hospital, shopping,
  **galeria** (o beco de lojas: duas fileiras de lojinhas de frente uma
  pra outra, com um corredor que atravessa o quarteirão e é gargalo),
  **escola** (bloco em L, quadra poliesportiva com alambrado e tabela,
  mastro), **posto de gasolina** (cobertura sobre duas ilhas de bomba,
  loja de conveniência, totem) e **baldio** (abaixo).
- **O TERRENO BALDIO, onde era o segundo campo de várzea.** O
  quarteirão ao lado do estádio (px 568, 305 — miolo de 588 × 864)
  deixou de ser campo: virou um equipamento `baldio`, o único com
  `FATIA = 1`, que toma o quarteirão inteiro. Meia quadra de terreno
  baldio não vira nada.
  Ele é declarado em **eixo local**: `u` cresce da face MURADA — a que
  dá as costas pro estádio — pra face virada PRO ESTÁDIO, e `rx(u0,u1)`
  devolve o retângulo já no sentido do mundo. A mesma planta serve se o
  quarteirão mudar de lado do mapa (`CX > cx` decide).
  Na face do estádio vai uma **fileira de bares e lojas** encostadas uma
  na outra: a frente delas é sempre na guia, com toldo, porta e placa,
  e ainda sobram 32 de pátio pras mesas na calçada; o FUNDO é que varia
  (até 30 % do vão), então o telhado deixa de ser uma laje só e o muro
  dos fundos fica recortado. Uma em cada três leva caixa d'água.
  São **seis lojas de 6,5 m de frente por 7,9 de fundo**. Eram dez de
  3,9 m, e dez portas enfileiradas liam como box de camelô, não como o
  comércio que atende um estádio: a loja engordou, a conta de quantas
  cabem caiu junto, e com ela vieram porta mais larga, placa maior e
  mais pé-direito. As
  costas delas são a quarta parede do baldio: vão entre duas lojas
  seria furo pra rua, por isso elas não têm vão nenhum.
  As outras três faces são **muro** (recuado 3 da guia, senão o dizer
  pintado nele pendurava sobre a calçada). O da frente é inteiro; os
  dois laterais têm **um vão cada** — o portão de arame no norte, o
  pedaço caído no sul. Os vãos são de propósito: baldio murado sem
  buraco não existe, e sem eles o miolo de 5.157 células ficaria
  inalcançável (a varredura confirma 5.157 de 5.157).
  Dentro é terra batida com mato em tufo, terra pelada, restos de
  alicerce, dois pedaços de muro caído e dois carros largados. O mato é
  **chão pintado** (não custa geometria) e pega mais no pé do muro, que
  é onde ninguém passa; o entulho é caixa baixa, que o boneco contorna
  sem ficar preso.
  **O equipamento divide o quarteirão com as casas.** Ele toma uma
  FATIA da ponta oeste do miolo — `areaDoEquipamento` dá a cada tipo
  uma fração (a praça toma o quarteirão inteiro, o posto 48 %), com um
  mínimo de 260 pra não virar brinquedo —, e o resto do quarteirão é
  loteado normalmente: o lote que cruza a fatia é o único que sai. Dá
  de 3 a 10 casas ao lado da escola, do posto, da delegacia. Antes o
  quarteirão do equipamento era só dele, e uma delegacia sozinha num
  quarteirão de 27 m lia como prédio público num descampado. A fatia
  tem chão próprio (o do equipamento), o resto fica com o chão de lote.
  Na máscara o miolo do quarteirão é maciço como sempre, **menos dentro
  da fatia**, onde vale a lista de peças: é ali que se anda entre elas.
  **A parede de equipamento vem ANTES da avenida na máscara.** A banda
  da avenida — asfalto mais calçada — é andável e vinha antes de tudo,
  então onde ela cruzava a fatia de um equipamento as paredes dele
  sumiam e dava pra entrar na sede por fora, atravessando o muro. Peça
  no asfalto já era recusada na montagem, então o que sobrava era peça
  na calçada da avenida — e parede é parede, com avenida do lado ou sem
  ela. A fatia da sede, além disso, passou a recusar quarteirão que a
  avenida CORTE (`tocaAvenida(area, CALC)`), senão fica um corredor de
  calçada atravessando o salão.
  Equipamento cujas peças caiam no asfalto de uma avenida é recusado
  naquele quarteirão, porque as peças são retas e a avenida é diagonal.
- **O miolo do quarteirão é fundo de quintal**, não pátio: com o
  quarteirão grande ele virava um descampado, então entram puxadinho,
  garagem e laje. Nada disso muda a máscara — o miolo já é maciço.
- **A fachada.** Porta de 2,10 sempre; o térreo é **vitrine** no
  comércio (vidro dos dois lados da porta) e janela dos dois lados na
  casa; frente estreita demais pras duas ganha bandeira em cima da
  porta. A casa da avenida passou a ter fachada também — antes o
  desenho dela saía antes, e dava comércio com letreiro em parede lisa.
  O letreiro fica **acima da porta**, não em cima dela.
- **A decoração.** Texto não sai de caixa, sai de textura: a planta
  guarda só o dizer (`l.placa`, `l.pixacao`), e o `bairro3d.js` junta
  os que apareceram num atlas de 256 × 64 por dizer, uma malha só, com
  recorte por alfa (sem transparência, sem ordenar). Letreiro de
  comércio é fundo pintado com borda, acima da porta (que encurta pra
  17 quando há letreiro); pixação é tinta direta em itálico torto,
  abaixo da linha das janelas e fora do meio, presa à altura da
  parede — em muro de 12 ela cabe nos 12. São 34 nomes de comércio e
  25 dizeres de parede, sorteados com a semente da planta, então a
  cidade sai igual toda vez. Os letreiros dos equipamentos entram no
  mesmo atlas. A placa é de uma face só: vista por trás, o texto sairia
  espelhado. O letreiro de equipamento aceita `placa: false`, que pinta o
  dizer DIRETO na parede, sem chapa — é o que o muro do baldio pede, onde
  "VENDE-SE" e "ALUGA-SE" são tinta, não letreiro.
- **TEXTURA, enfim.** Até aqui a cidade inteira era cor por vértice.
  Entraram três PNG gerados por `ferramentas/gerar_texturas.py` (sem
  biblioteca de imagem — o script escreve o PNG na mão, e pode ser
  rodado de novo quando a escala mudar), em `img/texturas/`:
  **telha.png** (telha colonial ladrilhável), **tijolo.png** (quatro
  falhas de reboco com o tijolo à vista, numa 2 × 2 com alfa) e
  **reboco.png** (chapiscado fino).
  **O quarteirão inteiro é texturado**: o reboco dá grão à parede, ao
  muro e à laje da calçada, e a cor do vértice continua mandando no tom
  de cada casa. A UV de parede NÃO pode ser a mesma do telhado: numa
  face vertical, mapear por x e z sai numa tira esticada, então `tri()`
  recebe qual é a normal da face — no topo valem x e z, na parede vale
  o eixo horizontal dela e a ALTURA. A escala do reboco é mais graúda
  que a da telha (172 contra 104), senão a parede sai penteada.
  O TELHADO saiu da malha do quarteirão e foi pra uma malha própria com
  `map` E `vertexColors`: a textura dá o desenho da telha e a cor do
  vértice dá o tom da casa, e o Lambert multiplica os dois. A UV é
  PLANAR, tirada do mundo (`x/104, z/104`), então a telha corre
  contínua de casa em casa e ladrilha sem costura — a água é rasa e o
  esticamento na rampa não aparece. A cobertura da sede fica de fora:
  aquilo é fibrocimento, e a malha dela liga e desliga sozinha.
  O TIJOLO À VISTA substituiu as manchas de mofo, que saíam como
  borrão sujo na parede. Agora o decalque é **falha de reboco**: um
  retalho irregular onde o emboço caiu e aparece a alvenaria em amarração
  corrida, com lábio de reboco na borda. São quatro, numa 2 × 2 com alfa,
  uma ou duas por casa, sorteadas com a semente da posição, e ficam
  **embaixo na parede** — reboco cai por umidade que sobe, não por
  cima —, só uma das quatro senta alta, sob o beiral. Nunca
  centralizadas: falha não se alinha com a porta.
  A primeira versão saiu como papa de argamassa: a erosão aleatória de
  6 % fazia quase todo pixel ter vizinho de fora a menos de 2 px, e o
  teste de borda pintava tudo de lábio. A correção foi morder a borda
  com bolhas SUBTRATIVAS em vez de ruído espalhado, testar vizinhança só
  na ortogonal e diminuir o tijolo.
- **A BANDEIRA DO MASTRO TREMULA.** O mastro da sede leva o escudo da
  torcida num pano de 10 × 4 retalhos, e o pano MEXE: ele não pode
  entrar na malha dos letreiros, então sai com geometria própria que a
  cena atualiza por quadro (`tremular` em `estadio3d.js`). A onda são
  duas senoides que VIAJAM do mastro pra ponta, com amplitude crescendo
  ao longo do pano — preso na tralha, solto na ponta, que é como
  bandeira balança — mais um balanço vertical menor, senão o pano lê
  como cortina de trilho.
- **O mato**: terreno aberto com moitas sorteadas (bloqueiam, num balde
  espacial de 256) e trilhas pintadas. A textura do mato, do mar e da
  praia sai do pintor, não de geometria.
- **A máscara é "rua recortada de quarteirão sólido"**: mar → campo →
  carro → **parede de equipamento** → avenida → rua → miolo do quarteirão (bloqueia) / calçada (anda)
  → moita → o resto anda. Lote é só desenho e altura pra câmera. Cada
  célula sabe os seus lotes e árvores, e `celulaEm(x, y)` acha a célula
  por busca binária nas bordas: é o que deixa 460 mil `anda()` custarem
  0,3 s na carga.
- **A SEDE É UMA PLANTA, não uma casa pintada.** Era um lote comum com
  outra cor e uma faixa na fachada — perdido no meio do quarteirão. Agora
  cada sede toma uma fatia inteira do quarteirão (uns 19 × 11 m) e tem
  planta de verdade, como a foto que o dono mandou: **muro na rua** com o
  portão e o nome da torcida, **ala da frente** com quatro cômodos e o
  corredor do portão no meio, **SALÃO** aberto com mastro, bancos e árvore,
  e **ala do fundo** com três cômodos.
  **O telhado se abre quando o jogador entra.** De fora a sede é coberta
  como qualquer casa — cobertura de galpão de duas águas rasas sobre as
  paredes externas, com as caixas d'água em cima e a platibanda da
  fachada passando dela —, e é assim que ela se lê da rua. Quando o
  líder do jogador cruza a borda da fatia, o telhado some e a planta
  aparece: cômodo, corredor, salão. É o corte de planta baixa, e custa
  uma malha por sede (`teto:mandante`, `teto:visitante`), que a cena
  liga e desliga por quadro. A borda é a da fatia, SEM folga: ela
  coincide com a guia da calçada e a torcida nasce do lado de fora, e
  com folga o telhado já abria no spawn. Não pisca, porque entre a
  calçada e o miolo está a parede: o boneco cruza a borda pelo vão do
  portão, que é onde a casa se abre mesmo.
  Poste e árvore não entram: dentro de galpão coberto não há luminária
  de rua nem pé de árvore. Ficam os bancos e o mastro, que sobe pela
  frente e passa do telhado. **Moita nenhuma e copa de árvore nenhuma
  entram na fatia de equipamento** (`naFatiaDeEquipamento`): a copa é um
  quadrado de meia-largura `r` plantado no eixo da calçada, e a quina
  dela passava por cima do muro e aparecia como arbusto dentro do salão.
  **O quintal do quarteirão para na fatia**: ele é do quarteirão inteiro
  e a fatia fica na ponta oeste dele, então a laje bege de fundo de
  quintal entrava pela sede e aparecia no corredor do portão.
  A altura é de casa, não de armazém: fachada de 3,2 m, paredes de fora
  2,8 e o telhado fechando em 3,5 — era 3,9/3,3/4,3 e lia como um
  armazém no meio da rua.
  Na fachada vão dois **ESCUDOS** — o da torcida e o do clube —, mais um
  em cada parede lateral; e a
  **PLACA** com o nome da torcida POR EXTENSO, na parede à direita do
  portão e com o fundo na cor secundária. "Direita" é a de QUEM OLHA DA
  RUA, não a do eixo local: ao sul e a oeste ela cai no trecho de `u`
  alto, ao norte e a leste no de `u` baixo, e com o eixo cru saía do
  lado errado em duas das quatro frentes.
  Dois detalhes de desenho que custaram uma rodada cada: o escudo se
  prende a `v = 2,8` e não a `v = 1`, porque ele SAI da parede pra fora
  e o `limite` do quarteirão cortava as três chapas a zero; e `caixa()`
  quer os limites em ordem, mas com a normal negativa (`oz = −1`) a
  chapa saía com `z0 > z1`, o recorte devolvia lado negativo e ela era
  descartada inteira — escudo nenhum aparecia nas fachadas viradas pro
  norte nem nas laterais de oeste.
- **O ESCUDO É O DO JOGO, e vira o PNG quando ele existir.** A primeira
  versão desenhava um brasão inventado em três fiadas de chapa — e
  inventar escudo é justamente o que não se faz. O que a cena monta
  agora são as DUAS regras que o jogo já tinha: o do CLUBE é o `.escudo`
  da interface (`escudo()` em `js/main.js`) — as duas cores dele
  divididas em 135°, a primeira até 52% da diagonal, com a sigla do
  clube em branco e sombra; o da TORCIDA é o pino do mapa
  (`js/mundo/mapa.js`) — bola na cor principal com a `siglaTorcida` no
  meio, na cor que LÊ sobre aquele fundo (`corQueLeSobre`: a primeira
  cor dela que se separa por luminância; se nenhuma servir, preto ou
  branco). Saem em textura, no mesmo atlas dos letreiros, em vez de em
  CSS. A célula do atlas é 256 × 64 e o escudo é quadrado, então ele
  ocupa um quadrado de 64 no meio dela e a UV aponta só pra ele.
  Por cima disso entra o **PNG de verdade**, que é o MESMO arquivo que o
  jogo usa: `img/escudos/clube-<clubeId>.png` e
  `img/escudos/torcida-<id>.png`, 139 de cada, com `dados/escudos.js`
  como manifesto do que existe — é a convenção de `escudoDe()` em
  `js/main.js`, não uma inventada aqui. O caminho passa antes por
  `window.__EMBUTIDOS`, como o `IMG()` do jogo, porque no build de
  arquivo único o empacotador (`ferramentas/empacotar_jogo.py`) troca
  essas imagens por `data:` URIs.
  A imagem carrega depois da cena montada, repinta a célula do atlas e
  `needsUpdate` põe na tela. Sem o id no manifesto nem arquivo, fica
  valendo o gerado — nada quebra. Fora do navegador não existe `Image`,
  então as varreduras no node param no gerado.
  Os 278 arquivos vieram do branch `claude/game-html-news-feed-sndgh4`,
  que é onde eles foram importados; este branch não os tinha.
  **A frente é a cor primária da torcida**, o rodapé e os batentes do
  portão são a terceira, e a faixa alta, as listras do piso do salão e a
  bandeira do mastro são a segunda.
  Tudo é declarado em EIXO LOCAL — `u` ao longo da frente, `v` pra
  dentro, `v = 0` na calçada — e `eixos()` gira pro mundo: a mesma planta
  serve pras quatro frentes, e a sede pode nascer virada pro norte, pro
  sul, pro leste ou pro oeste sem uma linha a mais.
  As sedes escolhem o quarteirão ANTES dos outros equipamentos (sem sede
  não há spawn), e o que sobra do quarteirão continua sendo casa. **O
  miolo da sede é andável**: a torcida nasce na calçada do portão, entra
  e ocupa o salão e os cômodos. Porta de cômodo nenhuma cai em cima de
  uma divisória — na primeira montagem caía, e 332 células ficaram sem
  chegada.
- **A BEIRA DA ESTRADA fecha o mapa.** As avenidas saem da cidade e viram
  estrada pelo mato até a borda do que se desenha, e ali a borda era mato
  pelado: de dentro do bairro dava pra ver o cenário ACABAR. Agora cada
  estrada leva casa solta na beira — casa, sobrado, galpão e muro de
  sítio, uns quarenta ao todo —, viradas pra pista como as casas da
  avenida, rareando conforme se afasta. Elas nascem só no mato, fora do
  campo, da praia e do mar, longe do asfalto da avenida E da última faixa
  da grade, bloqueiam na máscara num balde espacial próprio e saem numa
  malha própria (`beira`), porque fora do contorno não há quarteirão nem
  pedaço onde caber.
  Cada casa da frente leva a **calçada** dela: uma laje da guia até a
  frente, mais larga que a casa, pros pedaços vizinhos se encontrarem e
  virarem uma calçada só. Na dobra da avenida a guia não é reta — a laje
  é um retângulo preso ao trecho e o asfalto do trecho seguinte corta
  por dentro dela —, então a beirada interna recua até a laje sair
  inteira do asfalto, e quem não sair fica sem calçada mesmo.
  Há também uma **segunda fileira**, recuada, em pouco menos da metade
  dos pontos: uma fileira só lê como cenário de papelão.
- **A BORDA DA CIDADE também é rua.** `ruaEntre` só exige UMA célula
  urbana ao lado, então na saída do bairro sobra pista com quarteirão de
  um lado e descampado do outro. Agora a célula de mato encostada numa
  rua dessas ganha uma fileira de casa na guia de fora, com calçada,
  virada pra pista. São as mesmas casas da estrada, só que retas: `ang`
  de 0 ou 90° e `vf` dizendo pra que lado a fachada olha, e o mesmo
  `lote()` desenha — e elas saem como LOTE RETO, com `frente`, não como
  a casa girada da estrada: **`ang: 0` é falso em JavaScript**, e todo
  lugar que pergunta `if(l.ang)` — a começar pelo `lote()` que desenha —
  mandava a casa de ângulo zero pro caminho do lote reto e ia ler
  `l.x0`, que ela não tinha. Onze delas não eram desenhadas. Lote reto
  é lote reto.
  São 80 construções de beira ao todo, 59 com calçada — as sem são as da
  segunda fileira, que dão pro fundo do terreno.

- **A FAVELA, o bairro informal do flanco oeste.** A referência que o
  dono mandou é foto de periferia de verdade, e o que se vê de cima
  nela é UMA MASSA DE TELHA CERÂMICA: casa colada na casa, parede com
  parede, e o que sobra de chão é o beco. A primeira tentativa não era
  isso — era casinha solta espalhada no descampado, com laje cinza no
  lugar de telha —, então o traçado foi refeito do zero.
  **Não é passeio aleatório: é QUADRA.** Uma grade de quadras miúdas,
  TORTA em relação à grade da cidade (a cidade é reta; a favela não
  nasceu medida), com becos estreitos entre elas; dentro de cada
  quadra, duas fileiras de costas uma pra outra, casa encostada na
  casa, cada fileira com a porta virada pro seu beco. O ângulo local é
  de pouco mais de 90° de propósito: a faixa de mato é alta e
  estreita, então a quadra COMPRIDA tem de correr no sentido dela,
  senão ela nasce cortada.
  Três coisas vêm disso de graça. **Densidade**: sem folga entre casa
  e casa, o beiral de uma encosta no da outra (o beiral sai 2 do corpo
  e o corpo recua 2), e de cima lê como a massa contínua da foto.
  **Caminho garantido**: grade de beco é grade — sempre conexa; o
  passeio aleatório da versão anterior fechava anel, prendia mato e o
  conserto comia um terço das casas, e agora o conserto não tira
  nenhuma. **Contagem**: são **262 casas**.
  **O VÃO É OU NADA OU BECO.** Entre duas casas ou não há folga (0 a
  3, parede com parede) ou há uma viela de 40 pra cima. O meio-termo —
  uma fresta de 10, de 20 — é o que faz célula que ANDA mas que o
  CORPO não atravessa (o corpo quer as 8 vizinhas livres), e foi de
  onde saíam todas as ilhas.
  **A COBERTURA é o que dá a cor da foto**: telha cerâmica de duas
  águas em ~68% (seis tons, porque telhado de uma cor só vira carpete
  vermelho), laje nua em ~20% (a casa que ainda vai subir mais um
  andar) e fibrocimento no resto. A parede segue a mesma lógica:
  tijolo aparente em 44% — a casa que nunca foi rebocada, que é a
  maioria na foto —, reboco cru em 24% e pintada no resto, que é a que
  dá vida ao beco. Um terço levantou o segundo andar e um em dez o
  terceiro: é o dente de serra de lajes em cima do mar de telha.
  Para isso o `lote()` passou a aceitar `l.telha`, a cor da cobertura,
  nos três caminhos (duas águas, uma água e laje) — sem ele a telha
  era a constante `TELHA` para a cidade inteira.
  **ONDE ELA CABE.** Não num retângulo limpo: o flanco oeste é cortado
  por duas estradas (avenida que virou estrada) e pelas casas de beira
  delas, então a área declarada é a faixa inteira e quem recorta é o
  teste casa a casa — fora do asfalto E da calçada da estrada, fora de
  célula de quarteirão e de campo (ali a calçada, o miolo e a cerca já
  são de outra gente), fora do mar, da praia e da orla, longe da casa
  de beira. A favela sai em manchas, uma de cada lado das estradas, que
  é como esse bairro cresce de verdade. Duas dessas réguas entraram
  depois: a varredura de geometria pegou 233 vértices de casa por cima
  de calçada.
  **E A VIELA DESEMBOCA NA RUA.** Mover a CASA até lá não bastou: o
  traçado do beco continuava parando onde o MATO parava, então entre a
  última casa e a rua da cidade sobrava um pedaço de viela sem asfalto,
  e o bairro lia como coisa largada ao lado do mapa em vez de parte
  dele. O traçado passou a valer onde a CASA vale — a mesma régua de
  chão — e a ir UM PONTO PARA DENTRO do asfalto: o traço do beco entra
  na rua, a rua é pintada por cima depois (ela vem no passo 4 da
  pintura e o beco no passo 1) e as duas viram uma superfície só. Com
  folga de 70 na divisa da área, pra alcançar a rua que passa logo fora
  dela. As 21 vielas desembocam.
  **ELA VAI ATÉ A RUA DE LESTE.** A primeira versão exigia MATO e
  parava no contorno da cidade — sobrava uma língua de areia vazia
  entre a última casa e a rua, que foi o que o dono viu na foto. O que
  está ali é célula `aberto`: descampado de DENTRO do contorno, sem
  lote e sem calçada. Aceitar `aberto` junto com o mato fecha o vão e
  encosta o bairro no asfalto. Isso obrigou a um conserto na MÁSCARA:
  `andaNaCidade` devolvia `true` sem perguntar nada no terreno aberto
  (era só praia, orla e descampado, onde nunca houve casa), e a casa da
  favela apareceria lá sem barrar ninguém — agora aquele ramo pergunta
  `naBeira`, como o do mato.
  **A ESCALA é a conta mais dura aqui.** A unidade é 4,5 cm (o boneco
  tem 39), então uma casa de 47 de frente por 51 de fundo é 2,1 × 2,3 m
  — barraco de um cômodo. É pequeno, e é pequeno porque o mato livre
  do flanco oeste dá pouco mais de um milhão de unidades²: casa maior
  cabe menos, e o dono pediu 180. A primeira versão errou isso na
  direção oposta e feio — casa de 15 a 27 de frente, menor que a caixa
  d'água que fica em cima dela.
  **A CAIXA D'ÁGUA AZUL** é o que sobrou de exclusivo daqui: prisma de
  oito lados numa armação, numa quina do telhado de ~85% das casas, e
  não bloqueia (está em cima do telhado). O poste de pau e o fio de
  gato existiram e SAÍRAM a pedido do dono — davam um emaranhado preto
  por cima do bairro inteiro que competia com o telhado em vez de
  ajudar. `posteFavela()` e `fio()` saíram do `bairro3d.js` junto com
  as listas que os alimentavam.
  **O BECO É ASFALTADO**, também a pedido: era terra batida, e agora é
  a mesma capa da rua da cidade, num tom um fio mais claro — rua de
  favela é capa fina jogada por cima, não asfalto grosso e novo —, sem
  meio-fio e sem faixa.
  **A TELHA É MIÚDA.** A textura tem 8 canaletas por ladrilho e a
  escala vale pelo ladrilho inteiro: com os 104 da cidade a canaleta
  fica com 13 unidades (0,59 m), e uma casa de 57 de frente sai com
  quatro canaletas — telha de gigante. O telhado da favela foi pra uma
  malha própria com escala 34, canaleta de 4,25 (0,19 m), que é a
  medida da telha de verdade. Escala é do TECIDO, não do triângulo,
  então tinha de ser outra malha.
  **RNG PRÓPRIO** (`semente(913247)`): a favela sorteia muito, e se
  bebesse do `rng()` compartilhado toda a cidade gerada depois dela
  mudaria de sorteio sem eu ter mexido lá. Local, ela não consome um
  número sequer do sorteio de fora. A armadilha: um laço que já
  existia (`for(o of BEIRA)`, sorteando árvore perto de casa de beira)
  passou a rodar também sobre as casas da favela, que entram no mesmo
  array — ele pula com `if(o.favela) continue` ANTES de gastar o
  `rng()` de fora.
  **O MATO DE VOLTA NAS SOBRAS.** As moitas nascem antes da favela, e
  por isso a área toda ficou proibida pra elas; mas a favela não ocupa
  a faixa inteira, e descampado sem moita lê como terra arrasada.
  Depois de gerar, moitas voltam nas sobras com o RNG local — e entram
  TAMBÉM no balde espacial, senão `naMoita` não as enxergaria e elas
  ficariam de enfeite, sem bloquear. (Era o mesmo risco que fez a
  exclusão nascer: moita tirada da lista mas não do balde continua
  bloqueando invisível.) Elas voltam LONGE — 95 do corpo da casa mais
  perto, não 22: moita é bloqueio, e moita solta num beco ou na fresta
  entre a primeira fileira e a borda do mapa SELA a passagem. Foram 743
  células presas assim.
  **O DESENCALHA ILHA** continua, de rede de segurança: grade do
  tamanho da célula, teste de corpo, inundação a partir da borda, e a
  candidata só sai se TIRAR ELA encolher a ilha — adivinhar por
  proximidade deixava rodando à toa, tirando um lado do corredor de
  cada vez.
  **E ele passou a enxergar o que não é casa.** Modelava só as casas da
  favela, então dava por conectada uma faixa de 700 células que, na
  máscara de verdade, a FILEIRA DE CASAS DA ESTRADA fechava por cima —
  e a borda oeste da grade dele, que ele semeava como saída, é o fim do
  MAPA, não saída nenhuma. Agora a moita e a casa de beira entram numa
  camada-base marcada uma vez só (elas não mudam quando a favela perde
  uma casa), a borda só semeia quando há tabuleiro do lado de fora, e o
  limite do tabuleiro usa a MESMA comparação que `anda()`, não uma
  parecida. Ele tira as que precisa e zera: com 262 casas não sobra
  NENHUMA célula presa dentro da favela (24.977 de 24.977), e o mapa
  inteiro fica com 11 — menos do que tinha antes de a favela existir.

### 4.12. Os decalques de chão

O dono mandou gerar um pack de imagens e voltou com uma folha de contato
de **8 × 4 = 32 peças** de chão: capim em tufo, entulho, brita, poça de
barro, terra rachada, folha seca. Nada de asfalto, nada de parede, nada
de textura que repete — o gerador entregou só uma família das quarenta
pedidas em `docs/PACK_TEXTURAS.md`. As 32 valem, então foram as 32.

**Por que não dá pra pintar isso no chão.** O canvas do chão tem 4.096 px
pra 8.748 unidades de mundo: **0,47 px por unidade**. Um tufo de capim de
40 unidades (1,8 m) sairia com 19 px de largura. É por isso que o mato do
baldio, que era retângulo pintado, lia como falha de textura e não como
mato. Detalhe de chão tem que ser **geometria**: um quadrado deitado com
a foto recortada por cima.

**O recorte (`ferramentas/importar_decalques.py`).** A folha veio em JPEG,
fundo preto, sem alfa. O caminho óbvio — "escuro vira transparente" —
destrói as peças escuras: medido, um limiar de luminância preserva 51 a
74 % da arte nas quatro células mais escuras (a brita e as poças somem
junto com o fundo). O script faz **inundação a partir da borda**: só é
fundo o preto que se alcança andando desde fora da célula, então um miolo
escuro cercado de arte continua sendo arte — 92 a 97 % preservados nas
mesmas quatro. Depois tira a franja usando a propriedade do fundo preto
(alfa pré-multiplicado: `cor / alfa` devolve a cor original da borda),
**dessatura 0,76** — a cena tem sol próprio, arte com cor forte briga com
ele — e encaixa cada peça numa célula quadrada de 192 px sem distorcer.
Saída: `img/texturas/chao.png`, 1536 × 768 RGBA, 1,2 MB. A folha original
fica em `img/texturas/fonte/chao_pack.png`, pra dar pra refazer.

**Onde eles nascem (`DECALQUES`, em `cena_estadio.js`).** Semente própria
(`semente(560431)`), pelo mesmo motivo da favela: são milhares de
sorteios, e no `rng()` compartilhado a cidade inteira mudaria de desenho
por causa de decoração. São três fontes:

- **1.300 espalhados** por tentativa e erro, em mato, terreno aberto e
  dentro do baldio. `ondeCabe()` recusa mar, praia, asfalto, calçada de
  avenida, faixa de beira, campo e quarteirão da cidade — o baldio é a
  exceção, porque é terreno abandonado e é lá que entulho faz sentido. A
  mistura muda com o lugar: no mato 66 % capim, no baldio 52 % entulho.
- **Uma saia debaixo de cada moita** (538). A moita bloqueia o boneco,
  então tem que continuar sendo volume — mas o cone verde chapado, ao
  lado de um tufo fotografado, fica ainda mais falso do que era sozinho.
  A saia é um decalque de mato com 2,1 a 3,0 vezes o raio da moita: o
  cone vira o corpo do arbusto e a vegetação de verdade aparece em volta.
- **Folha caída sob umas 45 % das árvores** (11). Só uma peça de folha
  veio no pack, então ela repete; cada placa nasce com um ângulo
  sorteado, que é o que disfarça.

Total: **1.822 placas, 3.644 triângulos** — 2,5 % da cena. Uma malha só,
uma chamada de desenho, `alphaTest` 0,32 (folha de capim é fina e some
com corte alto) e `DoubleSide`, porque a placa está deitada e o triângulo
é olhado de cima.

**O que não cabe não nasce.** O chão desenhado acaba na VISTA; uma placa
que passa da borda fica boiando no vazio, e dá pra ver de longe. `por()`
testa a diagonal (a placa gira) e descarta — foram 27.

**E o mato pintado do baldio saiu.** Os 34 retângulos verdes que o
`piso()` desenhava lá dentro existiam porque não havia nada melhor; ao
lado da foto eles viraram o pior detalhe do terreno. Viraram **variação
de tom de terra** (`#8f8257`, `#9b8c62`, `#877a52`, `#948553`), que é o
que chão pintado sabe fazer nessa resolução: manchar. O verde agora vem
das 141 placas que caem no baldio. Mesmo número de sorteios de propósito
— aquele trecho usa o `rng()` compartilhado, e tirar uma chamada dali
moveria as casas da cidade inteira.

A cidade sai em **pedaços de 4 × 4 células** (`bairro3d.js`), que a câmera
descarta fora do quadro; carros, postes e campos numa malha; moitas em
outra.

### 4.14. A sede tem NÍVEL, e o nível 1 é o barracão de três cômodos

A sede que existia virou **nível 3**: fatia grande, salão, ala da frente
e ala do fundo. Ao lado dela entrou a **nível 1**, que é o que uma
torcida tem antes de crescer — o barracão da foto de referência, com
três compartimentos.

`SEDES[lado].nivel` é quem decide. No mapa vai uma de cada (mandante 3,
visitante 1), que é o que deixa as duas à vista pra comparar; no jogo
quem manda nisso é o progresso da torcida, e trocar é uma linha.

**A diferença começa na FATIA, não na mobília.** A nível 3 pega o
quarteirão de ponta a ponta na profundidade; a nível 1 é um retângulo
de **11,2 × 8,1 m** encostado na guia, e o resto do quarteirão continua
sendo casa. Sem isso ela seria a sede grande com menos parede dentro.

**Os três compartimentos**, no eixo local (`u` corre pela fachada, `v`
entra pra dentro):

| cômodo | onde | o que tem |
|---|---|---|
| pátio | `u` até 58 %, de ponta a ponta | três colchões no chão, caixa d'água de plástico, ralo, o portão encostado, caixa de material, o mastro |
| patrimônio | os 42 % restantes, metade da frente | armário de aço com quatro troféus em cima, estante de material, caixas |
| presidente | os 42 % restantes, metade do fundo | mesa com gaveteiro, cadeira de escritório, armário, ar-condicionado, mural |

**Cada sala abre pro PÁTIO pela sua própria porta**, e entre elas a
parede é cega — como na foto. Não é gosto: com a porta de uma sala
dando na outra, um cômodo depende do outro pra ser alcançado, e cômodo
murado já custou 332 células sem chegada nesta cena antes.

**O pátio não tem telhado**, e é isso que faz a sede pequena ler como
sede pequena: de cima vê-se o cimento, o colchão e a caixa d'água sem
precisar esconder malha nenhuma. O telhado passou a poder cobrir só um
pedaço (`teto.area`); a área que a cena ESCONDE continua sendo a da
sede inteira, senão quem entra pelo portão não abriria a planta.

**A mesa do presidente ficou no CANTO, encostada nas duas paredes.**
Solta no meio da sala ela abria um bolsão de 21 entre o tampo e a
parede — largo demais pra sumir, estreito demais pro corpo passar, que
pede 24. Foram três células presas na primeira montagem, achadas por
varredura e não a olho. Pelo mesmo motivo o armário encosta na mesa em
vez de ficar do outro lado dela, que era o que fechava a volta.
Medido: **352 células de corpo dentro da sede, 352 alcançáveis da rua.**

### 4.15. O mobiliário, e o que ele custa

A sede era casca: parede, piso pintado e mais nada. As peças novas
(`bairro3d.js`) são caixas como o resto da cena, mas em porção maior —
uma cadeira de escritório são catorze delas, um armário nove:

`colchao` · `armario` · `estante` · `trofeus` · `mesa` · `cadeira` ·
`caixote` · `ralo` · `ar` · `mural` · `portao` · `caixadagua`

**A orientação vem da planta**, em `ox`/`oz`: é pra que lado o móvel
OLHA. Sem isso a porta do armário sai na face encostada na parede e o
móvel lê como caixote. `naFace()` resolve as quatro orientações numa
conta só, em vez de quatro trechos iguais.

**Os cômodos do fundo da nível 3 também deixaram de ser caixas
vazias**: o primeiro virou alojamento (colchão), o último depósito
(armário e troféus) e o do meio diretoria (mesa e cadeira).

Custo: a sede inteira mobiliada não chega a 1.500 triângulos, e tudo
entra na malha do quarteirão — **nenhuma chamada de desenho a mais**.

### 4.16. As portas que abrem, e o F que as abre

Todo vão da sede ganhou FOLHA. Na rua é **vidro** — porta de comércio,
caixilho de alumínio e puxador de tubo, que é o que sede de torcida põe
na fachada. Por dentro é **madeira**, com os dois painéis rebaixados e
maçaneta. São 13 folhas nas duas sedes: 4 de vidro e 9 de madeira.

**Porta larga é de duas folhas.** A da fachada tem 2,5 m; uma folha só
desse tamanho girando não existe. Ela parte no meio, cada metade na sua
dobradiça, as duas abrindo pro mesmo lado.

**A folha gira, não deforma.** Ela é montada em coordenada local com a
DOBRADIÇA na origem e a folha deitada no +X; o que abre é
`rotation.y` do `Group`. A bandeira, que precisa ondular, paga vértice
por vértice todo quadro; a porta não paga nada — é uma matriz. O curso
é de um terço de segundo, com aceleração e freada nas pontas
(`t²(3−2t)`), porque porta que salta de fechada pra aberta num quadro
lê como teleporte.

A planta entrega `ang0` e `ang1` prontos, que são o `rotation.y` com a
folha fechada e aberta. Os dois saem de `atan2`, e **o delta vai
normalizado pra (−π, π]**: dois ângulos a 90° um do outro podem cair
nos dois lados do ±π, e interpolar cru faria a folha dar a volta por
270°.

**O F faz duas coisas.** Encostado numa porta (2,1 m, o braço de quem
vai abrir), ele abre ou fecha; longe de porta, continua sendo o
AGARRAR do motor de luta, que é o dono antigo da tecla. Tirar o agarrar
pra pôr porta seria trocar uma mecânica de briga por um enfeite —
`alternarPorta` devolve `null` quando não há porta ao alcance, e é esse
`null` que devolve a tecla pro combate.

**A PORTA NÃO BLOQUEIA, NEM FECHADA**, e isso é decisão e não
esquecimento. A máscara e os campos de fluxo dos quatro spawns saem
prontos na carga; porta que fecha de verdade pediria refazer os dois a
cada giro, e o bonde que já estava a caminho ficaria com a rota velha —
atravessando a folha ou empacando na frente dela. Medido depois das
portas: a máscara continua 100 % alcançável com as mesmas 8 células
soltas, e a sede nível 1 com 352 de 352.

### 4.17. A placa que diz o que é cada sala

Toda porta interna ganhou **placa na verga**, com o nome do cômodo.
Nível 1: PATRIMÔNIO e PRESIDÊNCIA. Nível 3: SECRETARIA, BAR, BANHEIRO e
ALMOXARIFADO na ala da frente, ALOJAMENTO, DIRETORIA e DEPÓSITO na do
fundo — e o nome bate com o que há DENTRO de cada um, não é sorteio: o
do alojamento tem colchão, o do depósito armário e troféus, o da
diretoria mesa e cadeira.

Não é peça nova: é o `letreiro` que a fachada já usava, com a chapa na
segunda cor da torcida e a tinta na cor que lê sobre ela. Sai no mesmo
atlas de dizeres, então **não custa nem textura nem chamada de
desenho**.

**A placa sai junto com a folha**, no mesmo `folhasNoVao` — quem abre
um vão com nome ganha porta e placa de uma vez. É isso que faz a regra
valer pro resto: qualquer cômodo novo que peça porta já nasce com
placa.

**Ela fica do lado de FORA do cômodo.** A folha abre pra dentro, então
quem lê está do lado contrário, e é pra lá que a normal aponta. Sem
isso a placa nasceria dentro da sala, de costas pra quem chega.

**A parede de cômodo subiu pra caber a placa.** Era 48 (2,16 m) com
folha de 46: sobravam 2 de verga, e placa nenhuma cabe em 2. Com 56
sobram 10, que é onde a placa mora — e de quebra o pé-direito virou
2,52 m, que é medida de cômodo de verdade; 2,16 já era baixo demais pro
boneco de 1,75 m. A placa se dimensiona pelo que sobrou: a altura é a
verga menos folga, e a largura vem dela pela proporção da célula do
atlas (256 × 64). Placa maior que a verga atravessaria a parede por
cima.

### 4.18. O bar da torcida, e a `obra` que sede e bar dividem

Cada torcida começa com um bar, então são dois no mapa. Eles escolhem
quarteirão DEPOIS das sedes e ANTES dos outros equipamentos: a sede é o
que a cena precisa pra existir e fica com o quarteirão que quiser; o
bar quer o mais perto DELA que ainda esteja livre.

**A `obra`.** Antes de escrever o bar, os ajudantes de prédio saíram de
dentro do `sedeDaTorcida` e viraram uma função à parte: eixo local,
peça, parede com vão, folha de porta e placa de sala. A sede usa, o bar
usa, e o que vier depois usa. É aqui que mora a regra de que a porta
abre pra dentro do cômodo e a placa fica do lado de fora — e ela vale
uma vez só. Sem isso cada prédio novo traria a sua cópia da mesma
sutileza pra sair errada de um jeito diferente. O pedido era "uma porta
de vidro igual à da sede"; ela é literalmente a mesma.

**A planta**, fiel à foto: **170 × 270** (8,7 × 13,8 m). Começou em
116 × 232 (no apertado a quarta cadeira de cada mesa batia na parede e
não havia como entrar atrás do balcão), foi a 200 × 400 (aí sobrou chão
pelado), voltou pra 190 × 320 e parou aqui — depois que a mobília
passou a ter o tamanho certo, o mesmo salão passou a caber em menos
chão.

| onde | o que |
|---|---|
| sul | a fachada com a porta de vidro de duas folhas |
| oeste | faixa de serviço, balcão em L, prateleira de garrafa |
| sudoeste | as pilhas de engradado de cerveja |
| meio/leste | três mesas de pé central, cadeira de plástico |
| norte | dois freezers, e a TV passando futebol em cima deles |
| nordeste | o banheiro |

**Só nas faces LESTE e OESTE do quarteirão.** O miolo tem uns 595 no
sentido comprido e 249 no curto: 270 de fundo só cabe no comprido, que
corre em x. Virado pro norte ou pro sul o bar não entraria — e é melhor
ele existir numa face certa do que caber torto em qualquer uma.

**Dá pra entrar no balcão.** A faixa de serviço atrás dele tem 38 de
vão, e o corpo pede 24: o dono do bar fica atrás do balcão de verdade.
Ela fecha ao sul pelo pé do L e a leste pelo braço comprido, e fica
aberta ao norte — que é por onde se entra, como em balcão de verdade.
No armário encostado na parede oeste, duas prateleiras de garrafa:
âmbar de uísque, verde de cerveja, incolor de cachaça. Cada garrafa são
três caixas (corpo, ombro e gargalo) mais a faixa do rótulo.

**Oito banquetas** em volta do balcão, do lado do freguês — a leste do
braço comprido e ao sul do pé do L. O assento são duas caixas cruzadas
a 45°, que de cima leem como octógono: é o mais perto de redondo que
sai por 24 triângulos. Elas NÃO bloqueiam, pela mesma razão da cadeira
de plástico: uma fila delas encostada no balcão fecharia o corredor que
leva ao fundo do bar, e banqueta se empurra com a perna.

**O piso é xadrez de verdade**, como na foto, e é UMA peça: o 3D
desenha só os ladrilhos escuros por cima do piso claro que já está lá —
metade da geometria pelo mesmo desenho, umas 300 faces por bar. (Ele
nasceu invisível: a 1,76 o ladrilho caía DENTRO da caixa do `piso`, que
vai de 1,70 a 1,85. Subiu pra 1,92.)

**Três coisas o corpo obrigou a mudar**, e todas vieram da varredura,
não do olho:

1. **Mesa no meio do salão parte o bar em três.** Centralizada ela
   deixava 19 de cada lado; o corpo pede 24. As mesas foram pra parede
   leste e o corredor oeste ficou com 30 inteiros — que é também o que
   bar apertado de verdade faz.
2. **Freezer com folga atrás vira armadilha.** A 22 da parede sobrava
   um corredor de 15 entre eles e a mesa do fundo: estreito demais pro
   corpo, largo demais pra sumir. Encostados na parede, o corredor é o
   vão inteiro.
3. **A porta do banheiro tem 28, não 34.** Com 34 o vão comia a parede
   inteira (ela tem 36) e sobrava menos de 3 de cada lado, que o
   `comVaos` descarta — o banheiro ficava sem parede sul nenhuma.

**A cadeira é a dobrável de madeira** de bar de esquina: assento de
RIPA com fresta, encosto de ripa larga no alto, montante de trás
subindo do chão e travessa embaixo. São as frestas que fazem ela ler
como cadeira de madeira e não como banquinho — por isso cada ripa é uma
caixa, e não um tampo só. Os membros nascem em coordenada da cadeira
(`u` pra frente, `v` pro lado) e giram pro mundo; sem isso ela sairia
sempre de frente pro norte.

A mesa bloqueia e a cadeira não: cadeira de bar se empurra com o pé, e
uma fila delas fechando o corredor seria pior que qualquer ganho de
fidelidade. Medido: **330 e 336 células de corpo dentro dos dois bares,
todas alcançáveis da rua** — e com 20 bonecos dentro sobra corredor pra
andar, que era o teste que o dono pediu.

### 4.19. A mobília em metros, e não em chute

A primeira leva de móveis foi dimensionada em UNIDADE, no olho. Medida
contra o boneco, saiu sistematicamente grande:

| peça | real | devia ter | tinha |
|---|---|---|---|
| mesa de bar | 0,75 m | 15 | 27 (1,8×) |
| assento de cadeira | 0,45 m | 9 | 17 (1,9×) |
| banqueta | 0,75 m | 15 | 26 (1,7×) |
| balcão | 1,10 m | 21 | 30 (1,4×) |
| freezer | 0,88 m | 17 | 28 (1,7×) |
| TV | 1,10 m | 21 | 64 (3,0×) |

Cadeira com o assento na altura do quadril, mesa na altura do peito, TV
de três metros. A causa está no comentário da escala, que dizia "39
unidades, 4,5 cm" enquanto a constante do arquivo diz `METRO = 34/1,75`
— 5,1 cm. Medido o boneco na cena: **36,9 unidades** com o braço
levantado, ou seja a constante é a certa e o comentário é que estava
errado. Os dois foram corrigidos.

Agora `obra()` entrega um `m(metros)` e a mobília inteira sai dele:
`m(0.75)` é a altura de uma mesa, `m(0.45)` a de um assento. O número
fica conferível na leitura, que é o que o chute em unidade não
permitia.

**A largura da porta é a única medida que NÃO pode ser real.** Uma
folha de 0,80 m daria 16 unidades e a máscara exige 24 pro corpo passar
— o corpo do motor de luta é largo demais pra escala do desenho, que é
a calibragem que o §9 chama de "boneco de mesa". O vão desceu de 40
(2,06 m, portão de garagem ao lado do boneco) pra **30** (1,54 m), que
é o mínimo que ainda passa corpo com folga. É a única peça da cena que
mente sobre a escala, e mente de propósito.

De quebra, mobília menor é mais chão livre: as células de corpo dentro
dos bares foram de 408/434 pra **518/546**, e as da sede nível 1 de 352
pra **368**.

### 4.20. A pixação é da torcida, e muda de dono

Antes, o que estava escrito nos muros vinha de uma lista de 25 frases
soltas — `VENDE-SE`, `CUIDADO COM O CÃO`, `A TORCIDA MANDA` — sorteadas
por texto e pintadas num preto de spray tirado por hash. Era textura de
bairro e nada mais: ninguém era dono de nada.

Agora a pixação de torcida é **assinatura**, e diz de quem é a rua.

**O que ela escreve** sai da ficha da torcida, em quatro formas:

| forma | de onde sai | exemplo |
|---|---|---|
| nome por extenso | `nomeCompleto` | `TORCIDA JOVEM DO GRÊMIO` |
| sigla | `siglaTorcida` | `TJG` |
| sigla com o ano | + `fundacao` | `TJG - 1977` |
| amor ao clube | `clube` | `GRÊMIO MEU AMOR`, `SOMOS GRÊMIO`, `VIVEMOS DE GRÊMIO` |

`fundacao` não estava na ficha e passou a estar — era o único campo que
faltava pra a terceira forma.

**A tinta é SEMPRE a cor primária da torcida.** Isso tem um preço que o
desenho tinha de pagar: metade das 140 torcidas do arquivo tem branco
ou preto como primária, e branco em reboco claro some por completo. A
saída não foi trocar a cor — foi pôr um **halo por baixo da letra**,
escuro em tinta clara e claro em tinta escura. A cor de dentro continua
sendo exatamente a que a torcida mandou, e ela lê em qualquer parede.
De quebra, pixador contorna letra mesmo.

**Onde ela vai:** muro e parede de casa, que é onde já ia. O muro,
porém, deixou de receber a mesma tarja curta e baixa da casa: muro não
tem porta nem janela, então ali a pixação toma a parede de ponta a
ponta, na altura do peito. Na casa ela continua curta e baixa porque a
janela do térreo começa em 26 e a porta toma o meio — é a faixa livre
que sobra, não gosto. A proporção passou a ser a da célula do atlas
(4:1), e a letra ganhou um esticão vertical de 1,18 com aperto
horizontal de 0,88: pixação se escreve com o braço, e o traço sai alto
e estreito.

**De quem é cada muro** não é cara ou coroa: o peso é o **inverso do
quadrado da distância às duas sedes**, com piso de 12% dos dois lados.
Perto da sede da mandante quase tudo é dela, no meio do bairro é meio a
meio, e os 12% garantem que sempre sobre pixação de rival pra cobrir
perto de casa — que é onde o jogador começa. O mapa passa a ter
território visível de longe.

**O recado de parede ficou.** `VENDE-SE`, `ALUGA-SE`, `PINTA-SE CASAS`,
`CONSERTA-SE GELADEIRA` não são pixação: são o anúncio de quem mora
ali. Um bairro em que todo muro repete duas frases lê como cenário, não
como bairro. A divisão é 66% torcida, 34% recado (`FATIA_PIXO`), e o
muro grande do baldio é obrigado a ser de torcida, porque é o melhor
pedaço de parede do mapa.

Na cidade de hoje: **137 pixações de torcida** (72 da mandante, 65 da
visitante) e 85 recados, com 12 textos distintos. O gradiente, medido
por anel de distância à sede da mandante:

| distância | dela | do rival |
|---|---|---|
| até 400 | 100% | 0% |
| 400–900 | 100% | 0% |
| 900–1600 | 87% | 13% |
| acima de 1600 | 47% | 53% |

O lado ruim disso está no primeiro anel: perto da própria sede não há
pixação de rival pra cobrir. É consequência de haver poucos muros ali
(cinco no raio de 900) e não do piso de 12% — a primeira de rival está
a uns 1.000 do spawn. Se isso atrapalhar a descoberta da mecânica, o
lugar de mexer é o `Math.max(0.12, ...)` do `ladoDoMuro`.

#### Cobrir a do rival: o F, e a troca de UV

Cada muro pixado guarda **as duas versões**, a da mandante e a da
visitante, e as duas já entram no atlas na carga. Mostrar uma ou outra
é apontar o quadrado pra uma célula ou pra outra:

```js
const a = p.mesh.geometry.attributes.uv, u = v.uv, i = p.i0;
const f = [u[0],u[1], u[2],u[1], u[2],u[3],
           u[0],u[1], u[2],u[3], u[0],u[3]];
for (let k = 0; k < 12; k++) a.array[i + k] = f[k];
a.needsUpdate = true;
```

**Doze floats.** Nenhuma malha se remonta — remontar pediria refazer os
160 mil triângulos do bairro a cada lata de spray. `i0` é onde a UV
daquele quadrado começa, guardado na hora em que `placa()` empilhou os
seis vértices, e a ordem dos doze é a mesma que ela empilha.

O atlas não engordou por isso: ele tinha **95 células** antes e tem
**94** agora — as 25 frases soltas viraram 15 recados mais 12 textos de
torcida, e o desenho continua num 1024 × 2048.

**O F passou a fazer três coisas**, nesta ordem: porta ao alcance →
pixação de rival ao alcance → agarrar do motor de luta. As duas
primeiras quase nunca disputam (porta é de dentro da sede, pixação é de
muro de rua), e quando disputam ganha quem está com a mão na maçaneta.
O alcance da pixação é 62 (3,2 m) contra 46 da porta: porta se abre com
a mão na maçaneta, pixação se faz a um passo da parede.

A **dica não é barra de rodapé**: é um rótulo amarelo que fica SOBRE a
tinta, projetado pela mesma conta dos rótulos de líder. O que falta
saber não é que a tecla existe — é qual muro responde a ela. Ela some
sozinha quando a pixação já é sua, porque `pixoPerto(x, y, lado)`
ignora as do próprio lado.

#### O sorteio compartilhado, mais uma vez

O `rng()` do arquivo é uma sequência só, e TUDO que vem depois anda
junto com ele. A pixação sorteia de quem é cada muro e qual frase vai
nele — três números por muro — e isso, na sequência compartilhada,
mudaria lote, árvore, moita e favela de lugar.

Duas defesas, as mesmas de sempre:

1. **Semente própria** (`semente(487219)`), que não consome um número
   da sequência de fora.
2. **O `escolher(RECADOS)` continua saindo do `rng()` compartilhado**,
   gastando exatamente um número como o `escolher(PIXACAO)` de antes —
   mesmo quando o muro acaba sendo de torcida e o recado é jogado fora.

Prova: a máscara continua em **100,0% alcançável com 8 células presas**,
o mesmo número de antes da mudança.

### 4.21. O chão em PBR, e a nuvem que faz sombra

O chão tinha um número que explicava tudo: **9,1 pixels por metro**
(4096 px esticados sobre 450 m de mundo). A referência que se persegue
tem 256 a 512. Pintar o mundo nessa densidade daria 115.200 × 86.784 px
— dez gigapixels. Não é questão de caprichar na pintura; é impossível
por aritmética.

A saída é a de qualquer motor: **a pintura deixa de ser a aparência e
vira a máscara**. `texChao` continua dizendo onde é rua, calçada,
granulado e grama — pela mesma paleta que o `estadio_pintura.js` já
usava — e o grão vem de texturas pequenas ladrilhadas a cada 2–4 m.
1024 px a cada 4 m são 256 px/m: a conta fecha.

| superfície | antes | depois |
|---|---|---|
| chão | 9,1 px/m | **256 px/m** (onde há textura na pasta) |

Duas decisões que não são gosto:

- **O grão entra pela luminância, multiplicando; a cor entra à parte,
  por canal (`tinta`).** Na primeira versão só a luminância entrava e a
  cor era toda da planta — o que não deixava o bege da areia tingir o
  asfalto, mas também deixava a rua pintada de quase preto (#3a3a38)
  quase preta com qualquer textura. Hoje cada canal diz quanto da cor
  da textura entra: asfalto 0,45 (escolhido entre três renderizações),
  concreto 1, areia 0,16. A luminância segue normalizada pela média da
  própria imagem, e com um ganho automático pelo desvio dela: textura
  de pouco contraste (o concreto) é esticada até render a mesma
  variação que as outras.
- **O UV ladrilhado sai do mesmo `vMapUv` da pintura**, multiplicado
  pelo tamanho do mundo. O three.js monta a base tangente a partir
  desse UV; amostrar o relevo num UV de outra orientação sairia
  espelhado num eixo — buraco virando bolha só no sentido norte-sul.

**A armadilha que custou a primeira versão:** a máscara foi escrita
num canvas RGBA, e canvas guarda **alfa pré-multiplicado**. Um pixel
"100% asfalto" é R=255, A=0 — e volta do `getImageData` como zero puro.
A máscara nasceu **98% vazia** e só o canal da grama (que é o próprio
alfa) sobreviveu. A correção é uma `DataTexture`, que leva o array
direto pra GPU sem passar por canvas.

#### A nuvem, e por que a sombra é fiel

Duas coisas que têm de ser a mesma: o lençol que se vê e a sombra que
ele faz. As duas saem da mesma textura, na mesma escala, com o mesmo
vento — e a função que lê a nuvem é literalmente o mesmo GLSL nos dois.

O que faz a sombra ser fiel é o **deslocamento**: nuvem não sombreia
embaixo de si, sombreia do lado oposto ao sol. Uma nuvem a `H` de
altura com o sol na direção `L` joga a sombra a `H/L.y · L.xz` de
distância. Com o sol desta cena (elevação de uns 49°) e nuvem a 2.200,
a sombra cai **1.683 unidades a oeste e 906 ao norte** da nuvem — uns
87 m. É essa conta que faz o olho aceitar as duas como a mesma nuvem.

A sombra desconta **só a luz direta**. A hemisférica é o céu, e o céu
continua lá quando a nuvem passa: embaixo dela fica mais azulado e mais
chapado, não preto.

Três coisas que pareciam óbvias e estavam erradas:

1. **A escala é de jogo, não de meteorologia.** Uma nuvem real tem
   quilômetros; este mundo tem 450 m. Uma nuvem fiel cobriria a cidade
   inteira de uma vez e a sombra leria como "a tela escureceu" — foi
   exatamente o que aconteceu com ladrilho de 2.600. Em **1.500**
   cabem umas seis no mapa e dá pra ver a mancha andando.
2. **O céu apaga por ângulo, não por distância.** O fade por distância
   parecia a conta certa e apagava o céu inteiro: de uma câmera rente
   ao chão, o lençol todo está longe. O que precisa sumir é o rasante,
   onde o raio quase tangencia o plano.
3. **O sol teve de subir junto** (1,0 → 1,45). Sombra de nuvem
   *subtrai* luz; adicioná-la sem mexer no sol só deixa a cidade
   inteira mais escura — troca sol por penumbra em vez de criar
   contraste. Com 1,45 o trecho no sol fica mais claro do que era e o
   trecho na sombra cai perto do nível antigo.

#### O que ainda não recebe a nuvem

A sombra entra em **25 materiais** — chão, cidade, estádio. Os ~400
restantes são os bonecos, que ficam de fora de propósito: o corte de
distância usa `InstancedMesh`, e ali `modelMatrix` é a matriz da malha
inteira, não a de cada instância — todos seriam sombreados pelo mesmo
ponto de nuvem. Um bonde inteiro escurecendo junto no meio de uma rua
clara seria mais visível como bug do que a falta da sombra é hoje.

#### O caminho das texturas

`ferramentas/arrumar_pbr.py` normaliza qualquer pacote (Poly Haven ou
ambientCG) pro mesmo nome e tamanho, escreve o `manifesto.json` e apaga
os originais. O manifesto existe pra o carregador **pedir só o que
existe**: sem ele, seriam seis 404 vermelhos no console a cada carga,
num projeto que trata "erros: nenhum" como regra.

Hoje `areia/`, `asfalto/` e `concreto/` têm textura de verdade (Poly
Haven; 15 MB de 4K viram ~1 MB de 1K). A grama cai num grão gerado,
com a mesma conta de normal map de sempre — a cena nunca fica pior do
que estava, e cada pacote que chega melhora um pedaço sem tocar em
código.

#### A calçada que não mostrava o concreto

Com o concreto na pasta, a calçada continuou igual — e a suspeita do
dono ("a textura antiga deve estar misturando") estava certa. A
calçada e o miolo do lote **não são o chão**: são lajes elevadas
(1,4 e 1,6 de altura) do `bairro3d.js`, e o topo delas vestia o reboco
das paredes. O plano do chão, com o concreto, estava lá embaixo,
coberto. Na cidade inteira o plano só aparece na rua.

A correção tira o topo dessas lajes da malha do quarteirão e o põe numa
malha própria, `lajes:chao`, com UV no mesmo sistema do plano
(`(x − VX0)/VW`, `1 − (z − VY0)/VH`) e **o mesmo material do chão**. A
laje continua com a altura e as bordas dela; só o que se pisa passou a
ser o chão. As lajes de equipamento e de quintal ficaram como estavam.

#### A faixa amarela e o anel em volta dela

Consertada a calçada, cada tracejado da avenida apareceu dentro de um
halo — roxo numa versão, um retângulo escuro na seguinte. Foram três
causas empilhadas, e a última é a que importava:

1. **Grão negativo.** O ganho era `1 + (razão − 1) × ganho`; com ganho
   3 e um pixel escuro da textura a conta ia a −1,1. Na borda amarela
   o negativo comia vermelho e verde e sobrava azul. Virou potência
   (`razão^ganho`), que nunca passa de zero.
2. **Conta não linear na cor.** Travas e um "isto é tinta ou é
   asfalto?" decidiam diferente pro pixel que o mipmap borra entre
   amarelo e cinza. A conta final é linear na pintura (textura +
   diferença pra base, quando mais clara; textura × s, quando mais
   escura), e o pixel borrado sai a mistura dos dois lados.
3. **A máscara classificava a mistura.** A pintura tem 11 cm por
   pixel e o tracejado tem 2 px com antisserrilhado: nenhum pixel dele
   é o amarelo da paleta. Medido, é `#827a51` (50% amarelo sobre a rua)
   e `#5e5a45` (25%) — que caíam no `lote` e na `moita`. Terra e grama
   em volta de cada tracejado. Agora a classificação é feita na
   pintura cheia, com a média dos PESOS por texel, e pergunta também
   se o pixel está na reta entre uma tinta e o piso dela
   (`MISTURAS`: eixo e faixa sobre a rua, linha sobre o gramado).

Custo: a máscara passou a ler os 12,6 milhões de pixels da pintura. O
que pesava não era a conta, era **a leitura**: com o canvas da pintura
na GPU (o padrão do navegador) cada `getImageData` é uma cópia de volta
de 50 MB, e medido na carga a máscara levava **3,8 s — já na versão
antiga**, que encolhia a pintura com `drawImage` e pagava a mesma cópia
sem aparecer em lugar nenhum. Criando o canvas com
`willReadFrequently: true` ele fica na memória: a máscara cai pra
**0,36 s** e a cena fica pronta 3 s antes (9,2 → 6,1 s no navegador de
teste, que roda sem placa de vídeo).

O tracejado ainda sai **apagado** de perto. Isso não é o shader: 2 px
a 11 cm/px é o que a pintura consegue desenhar. Faixa nítida pede
geometria própria (uma tira fina com a tinta) ou decalque — não mais
resolução no chão inteiro.

### 4.22. Os marcos: cinco prédios modelados peça por peça

A cidade é de lote sorteado — casa, sobrado, galpão — e nenhum lote é
um prédio que se reconheça. Entraram cinco, feitos a partir de
fotos de modelos de referência:

| marco | onde | tamanho |
|---|---|---|
| a igreja matriz (barroco mineiro: duas torres com cúpula bulbosa e pináculo, frontão de volutas com medalhão, cantaria, porta verde) | quarteirão 3,9, ao sul da Praça da Matriz — a praça já tinha o nome e não tinha igreja; a fachada dá pra rua de oeste e o lado comprido fica de frente pra praça | 12 × 21 m, torres de 18 m |
| o prédio alto (embasamento de dois pisos com a quina chanfrada e a faixa vermelha, 12 andares de caixilho preto, painel ocre nas empenas, a ala mais baixa, casa de máquinas) | ponta leste do 3,5, na esquina: a quina chanfrada fica no cruzamento | 20 × 12 m, 47,6 m de altura |
| o prédio de três andares com o mercado (tijolinho, letreiro verde, porta de enrolar, faixa marrom nas janelas, ar-condicionado, toldo, garagem com telhadinho) | ponta leste do 2,4, na rua por onde a torcida da casa sobe pro estádio | 18 × 12 m |
| o centro administrativo (tijolo aparente e janela em fita azul sobre pilotis, faixa verde-azulada, toldo azul, ala baixa) | ponta oeste do 4,4, de frente pro hospital | 41 × 12 m |
| a casa de classe média (sobrado cinza com portão de garagem e janela gradeada no quadro saltado, edícula verde com portão de grade) | ponta oeste do 3,10, esquina do bairro residencial do sul | 10 × 12 m |

A escala vertical é a do boneco (andar de 2,9 m, porta de 2,1 m). A
horizontal teve de caber: o quarteirão desta cidade tem 31 × 13 m, e
todo marco ocupa a profundidade inteira de um. A igreja tem a
proporção da foto (fachada de 12 m, nave mais capela-mor de 20 m); o
prédio alto ficou com os 12 andares da foto e é, de longe, a coisa
mais alta do mapa — 3 vezes a torre de refletor.

**Por que entram no fim da planta, e não com os equipamentos.** O
`rng()` é compartilhado, e quarteirão com fatia de equipamento gasta
diferente (o quintal encolhe, o puxadinho não sorteia posição). Um
marco posto lá em cima mudaria o sorteio da cidade inteira dali pra
frente. No fim, ele só troca o que está embaixo: conferido lote por
lote contra a versão anterior, os 643 lotes fora dos cinco
quarteirões saem idênticos, e os carros e a favela também.

**A fatia.** Parte da largura pedida na ponta do quarteirão e engole
os lotes que pisa: o que sobra com 2,5 m ou mais de frente é aparado,
o que sobra menos sai e a fatia cresce até a divisa dele. 43 lotes
saíram (719 → 676). Árvore de calçada cuja copa encostaria num volume
também sai (13 delas).

**A massa é uma fonte só.** Cada modelo declara na planta (`MASSAS`),
em metros e no referencial dele, os volumes grandes. Na planta eles
viram o que bloqueia o boneco (`q.solidos`) e o que a câmera não
atravessa (`noMarco`, chamado de `solido`); no 3D são o esqueleto da
fachada. O volume pode ter `base`: o andar de cima do centro
administrativo, por cima da colunata, a câmera não atravessa, mas o
boneco passa embaixo, entre os pilotis.

**A fachada é montada, não modelada.** `ferramentas/pintar_modelos.py`
pinta uma folha de textura por prédio (`img/texturas/modelos/`): a
janela do prédio alto com o peitoril, a porta verde com a cantaria, o
letreiro do mercado, o reboco, o tijolo, a telha. O script também
escreve `js/diajogo/modelos_atlas.js`, que diz onde cada peça caiu na
folha e quanto ela mede em metros — **não se edita esse arquivo à
mão**: muda-se o pintor e roda-se de novo. O 3D
(`js/diajogo/modelos3d.js`) repete as peças (o 7º andar usa a mesma
janela do 3º) e ladrilha as superfícies lisas no tamanho de mundo
delas, recortando no contorno da face. Relevo que conta é geometria:
pilastra, cornija, laje, requadro de janela com fundo, toldo,
ar-condicionado, cúpula no torno, frontão extrudado.

Quatro coisas que decidiram como ficou:

1. **Parede e janela nunca se sobrepõem.** A fachada é partida pela
   grade das bordas dos vãos: cada pedaço é parede ladrilhada OU a peça
   do vão, no mesmo plano. Pôr a janela 2 cm na frente da parede daria
   briga de profundidade a 100 m de câmera.
2. **Tijolo tem de caber inteiro no módulo.** Com 10,6 tijolos por vão,
   cada módulo terminava num tijolo cortado e a junta dele virava uma
   costura clara a cada 2,4 m. O pintor estica o tijolo o que for
   preciso pra caber um número inteiro.
3. **O frontão é um contorno só.** O desenho das volutas está em
   `FRONTAO`, no pintor; a folha pinta a cantaria acompanhando a borda
   dele e o 3D extruda o mesmo polígono (sai no atlas).
4. **Grade é `alphaToCoverage`.** Barra de 3 cm com recorte seco de
   alfa virava chiado de longe (moiré no portão inteiro); com o alfa
   virando cobertura do antisserrilhado ela só clareia com a distância.

Custo: 14.870 triângulos (a cidade tem 160 mil), sete malhas, seis
texturas somando uns 800 KB, e 60–100 ms na carga pra montar tudo. A
câmera e o boneco foram conferidos contra os volumes: não se entra na
nave, anda-se sob a colunata e no pátio que sobra atrás da igreja.

O que não é fiel à foto, dito com todas as letras: as texturas são
PINTADAS por código, não fotografadas — os sites de textura CC0 estão
bloqueados na rede deste ambiente. De perto se vê que o reboco é
ruído e a mercadoria da vitrine são retângulos coloridos. A forma, as
proporções, as cores e os elementos (cada janela, pilastra, toldo,
aparelho de ar) são os da referência. Trocar uma folha por foto de
verdade não mexe em código: é pintar (ou colar) por cima da célula
certa da folha e manter o tamanho dela.

### 4.23. As casas da cidade: cinco tipos que vestem os lotes

Depois dos marcos, a casa comum. Cinco modelos de referência passaram
a ditar como a casa de verdade da cidade é feita — não cinco casas
postas num lugar, mas cinco TIPOS paramétricos que vestem qualquer
lote de casa, sobrado ou barraco, do tamanho que ele tiver
(`js/diajogo/casas3d.js`):

| tipo | referência | sai de |
|---|---|---|
| T1 | casa térrea de reboco branco encardido, telhado de duas águas com a calha na frente, porta de veneziana, janela de correr e basculante | 78% dos lotes `casa` |
| T2 | casa de tijolo sem reboco: embasamento de cimento, borda da laje à mostra, ferro de espera. Com dois andares é a da foto, em L — o bloco do terraço na frente (porta de ferro e janelinha, mureta de tijolo por terminar em cima), o de dois andares recuado, a escada de alvenaria no dente entre os dois e o pilar solto na frente dela | 22% das `casa` (térrea) e 28% dos `sobrado` fora do centro |
| T3 | casa com PONTO COMERCIAL embaixo: porta de enrolar entre pilastras (uma meio aberta mostrando a prateleira), porta do apartamento, quadro de promoções, marquise, letreiro da loja; em cima, janela de cortina. Só a frente é pintada, o lado é reboco cru | todo lote com `placa` |
| T4 | sobrado de laje com as caixas d'água azuis em cima, térreo recuado sob o balanço do andar de cima, grade preta nas janelas, garagem de telhadinho com portão de ferro de lança quando a frente passa de 6,3 m | o resto dos `sobrado` |
| T5 | casarão colonial: cunhal, friso, cornija, guilhotina de moldura amarela, porta-janela em arco com a sacada de gradil, telhado baixo de quatro águas | 60% dos `sobrado` perto da Praça da Matriz, 12% no resto |

E a casa da FAVELA, que é da família do T2: o caixote de um a três
andares com parede de tijolo, reboco cru ou pintada (a planta diz
qual em `parede`), coberto de telha, laje nua (o `barraco`) ou
fibrocimento (o que a planta chama de `galpao` na favela é casa com
telha de fibrocimento). Galpão, muro, prédio e sede continuam com o
desenho antigo do bairro.

**Quem vira o quê sai da POSIÇÃO do lote.** Um hash da posição
escolhe o tipo, a cor, o lado da garagem, se a porta de enrolar está
aberta. O `rng()` da planta não é tocado: a cidade continua igual casa
por casa, só muda a roupa. A única mudança na planta é a anotação
`parede` nas 280 casas da favela, tirada do mesmo número que já
escolhia a cor — conferido contra a versão anterior, os 643 lotes, os
carros e a favela saem idênticos.

**Tudo cabe no lote.** Telhado por cima da calçada é o que a
varredura pega. Quando o tipo tem beiral, marquise ou sacada na
frente, a parede da frente RECUA o que eles avançam (`rec`), e nada
passa pro lado: o vizinho está ali. Conferido vértice por vértice nas
514 casas: nenhum passa da divisa.

**A casa assenta na laje do lote.** No quarteirão o chão do lote é
uma laje 1,6 acima da rua; a casa começa nela, e não enterrada.

**O decalque procura parede livre.** A janela e a porta são FUNDAS
(têm requadro), então o letreiro, a pixação e a falha de reboco não
podem cair por cima de um vão — ficariam boiando na frente dele.
`lugarDoDecalque` procura, nas paredes da frente, o lugar livre mais
perto do que o bairro pediu, longe de vão, escada, cunhal e sacada, e
encolhe o decalque se não couber. A pixação pode ir na porta de aço
fechada (é das coisas mais comuns da cidade). Todos os letreiros e
todas as pixações acharam lugar. A falha de reboco só vai em parede
de reboco — tijolo e reboco cru não têm reboco pra cair.

**A mesma folha dos marcos, o mesmo construtor.** O construtor de
fachada saiu de `modelos3d.js` pra `construtor3d.js` e é dividido
pelos marcos e pelas casas. Ele ganhou duas coisas: a TINTA
(`pintar`, ou `tinta` numa peça), que multiplica a cor do vértice —
a folha tem um reboco claro só, e é a tinta que faz o sobrado verde, o
mercado azul e o casarão amarelo, enquanto a janela desenhada sai sem
tinta; e o VÃO EM ARCO (`arco`), porque a peça da porta-janela é
retangular e o canto acima do arco tem de voltar a ser parede, com o
intradorso fechando a volta. As peças das casas estão na folha
`casas` (`img/texturas/modelos/casas.jpg`), pintada pelo mesmo
`pintar_modelos.py`.

Custo: cerca de 118 mil triângulos nas 514 casas (o T1 tem uns 200, o
casarão uns 500; o bairro inteiro foi de 87 mil pra 183 mil), 26
malhas (a das casas e a das grades, por pedaço de quarteirão e por
quadrado de 80 m fora dele — a favela inteira numa malha só nunca
sairia do quadro), duas texturas e uns 350 ms na carga. Na vista do
jogo foram 18 chamadas de desenho a mais (173 → 191). Duas coisas
seguraram o custo: a faixa (borda de laje, embasamento) desenha só o
lábio em cima e embaixo, e não a tampa inteira ladrilhada com a peça
de 30 cm — era de onde saía metade dos triângulos —, e a escada
desenha só a frente, o piso e o espelho de cada degrau.

O que não é fiel, dito com todas as letras: as texturas continuam
PINTADAS por código. As casas mais estreitas (a favela tem casa de
1,8 m de frente) não comportam o tipo inteiro: a janela sai antes da
porta, e três casas ficaram só com a porta. O T2 de dois andares
precisa de uns 5 m de frente pra ter o L com a escada; abaixo disso
ele vira o caixote de dois andares. O quarteirão desta cidade é raso
(13 m pros dois lados), então as casas têm de 2,5 a 6,5 m de fundo:
a proporção é de casa de frente larga e pouco fundo.

### 4.24. As casas grandes da favela: laje com terraço, casa rosa, bar e lanchonete

Mais quatro referências, estas de favela: a casa de laje em três
níveis com o terraço e o guarda-sol, a casa rosa atrás do muro com
quintal, o bar de esquina (em dois ângulos) e a lanchonete KI-DELÍCIA.

**Elas não cabem no lote da favela.** A fileira sorteia casa de 2,6 m
de frente por 2,5 de fundo; as referências têm de 5 a 8 m. Encolher
seria perder o que elas são. Então a planta JUNTA vizinhas, como a
casa que comprou a do lado (`juntarCasasGrandes`, no fim da favela):

- só junta quem já encosta — vão de até 8 entre duas casas, nunca por
  cima de beco, que fecharia passagem;
- a casa funda pega as DUAS fileiras de costas, de beco a beco, e é
  aí que a quadra dá os 4,5 a 6,4 m de fundo (quase sempre 4,5 a 4,9 —
  os modelos se ajustam a isso);
- o corte tem de cair numa junta das duas fileiras ao mesmo tempo, com
  14 de folga: a fresta que sobra não passa corpo, então não vira ilha;
- quem vira o quê sai de um hash da posição, em rodadas (uma de cada
  por vez), com distância mínima entre duas iguais; o bar prefere a
  ponta do trecho, que é esquina — a referência abre pros dois lados;
- roda depois de tudo que sorteia a favela: nada fora dela muda, e
  das 280 casas 236 ficaram idênticas.

Saíram 9: 2 bares, 1 lanchonete, 3 casas rosas e 3 de laje, no lugar
de 44 barracos. A casa nova herda a pixação de uma das engolidas (a de
torcida, se houver); as outras se perdem (112 → 104 pixações na favela,
71 → 67 cobríveis). A caixa d'água e a árvore que caíam dentro da casa
nova — ou de uma das engolidas, que às vezes passa um palmo dela —
saem: a caixa sobraria no ar.

**Os modelos** (`f1`, `f2`, `bar`, `lanche` em `casas3d.js`):

| modelo | o que tem |
|---|---|
| F1 | térreo de tijolo entre pilar e viga de concreto aparente, porta verde de vidrinho e vidraça verde de correr; o terraço com mureta e pilarete, guarda-sol listrado preto e branco, cadeiras azuis, caixa d'água; o quarto verde com a porta branca; em cima, a varanda de mureta e o quarto de reboco com janela e porta azul, coberto de fibrocimento |
| F2 | muro de reboco encardido com o portão de madeira de X entre pilares, o pedaço de tijolo por terminar em degrau, quintal de grama com bananeira, caminho de cimento, varanda de fibrocimento em pilarete rosa, casa rosa com a barra mais escura, platibanda e telhado de fibrocimento sujo |
| bar | térreo aberto sob a água de fibrocimento, pilar branco, a faixa de cerveja (na frente e no lado da esquina), piso de cerâmica, escada de ladrilho, prateleira de garrafa, armário amarelo, freezer, engradados, mesa de plástico com cadeira de madeira e de plástico; em cima, tijolo com duas janelas e caixa d'água; em lote largo, o portão de chapa marrom com o quintal do lado |
| lanchonete | o muro pintado (nome, o que vende, os desenhos e o cardápio) esticado uma vez na frente inteira, a porta de grade azul com a chapa vermelha, a porta de enrolar com o toldinho vermelho e o degrau; o terraço com a caixa d'água grande, guarda-sol amarelo, mesa e cadeiras vermelhas, e o quartinho de tijolo no fundo |

As peças novas (fibrocimento, grama, piso, ladrilho, os caixilhos
verdes, a faixa de cerveja, o muro da KI-DELÍCIA, o toldinho, as
portas, o freezer, os engradados, a prateleira, o pano dos guarda-sóis,
o portão de chapa) foram pintadas na mesma folha das casas, que passou
a ter 2048 × 1168; o pé de bananeira, recortado, foi pra folha das
grades. A faixa de cerveja não tem marca nenhuma — é a cara da faixa.
O construtor não mudou: o muro pintado é a parede ladrilhada com a
peça do tamanho exato da parede (`tw`, `th`).

O decalque da casa grande procura a parede certa: o da casa rosa vai
pro muro (a casa fica atrás do quintal), o do bar pro andar de cima, e
a pintura da lanchonete (nome e cardápio) não leva pixação por cima.

**Um bug achado aqui, e que vinha do passo anterior.** O bairro põe os
dizeres (letreiro, pixação, falha de reboco) ANTES de montar as casas
da beira da estrada e da favela. Pra essas, a casa ainda não tinha
dito onde fica a parede dela, e o código caía no plano velho da
divisa: o letreiro e a pixação da casa de beira com a frente recuada
boiavam na frente da parede (até 60 cm, no comércio de marquise), e a
falha de reboco da casa rosa aparecia no ar em cima da varanda. As
casas de fora do quarteirão agora saem antes dos dizeres.

O que não é fiel, dito com todas as letras: as texturas continuam
pintadas por código (o muro da lanchonete é mais limpo que o da foto,
a faixa de cerveja é genérica); não há bicicleta, varal, fio nem poste
das referências; e as fotos das casas grandes que acompanham este
trabalho foram tiradas com o plano de corte da câmera logo na frente
da fachada — no jogo o beco tem 1,6 a 2,2 m, e a casa do outro lado
fica na frente de quem olha de longe.

### 4.25. A segunda leva da favela: a casa da escada, o sobrado do varal, o das garagens e o do embasamento

Mais quatro referências, pelo mesmo caminho da §4.24: a planta junta
vizinhas encostadas e o `casas3d.js` desenha o modelo no terreno que
sobrou. Elas escolhem DEPOIS das nove da primeira leva, no que ficou
livre (`MODELOS2`, com a distância mínima menor — 5 m de outra casa
grande, 15 de uma igual), então as nove não saíram do lugar. Coube uma
de cada; a favela ficou com 229 lotes (216 barracos, idênticos aos de
antes, e 13 casas grandes). As pixações da favela, somadas as duas
levas, foram de 112 pra 97 (as cobríveis, de 71 pra 65). A passagem
continua 100%.

| modelo | o que tem |
|---|---|
| escada | a casa de esquina de reboco cru: o muro de tijolo que faz a CURVA na esquina (segmentos com o tijolo correndo contínuo), o portão de grade enferrujada, o quintal de cimento com a bananeira; a escada de laje por fora — o voo com o fundo inclinado à mostra — subindo rente à casa até a varanda de mureta; os dois pilares altos que seguram a varanda e o telhado de fibrocimento; porta escura, vitrô de grade branca, janela verde de grade, a antena e o varal |
| varal | o sobrado de tijolo em pilar de concreto com a laje do meio saltada 60 cm pra frente (a varandinha sem guarda-corpo), a janela de caixilho de madeira, a porta de chapa marrom, o varal de roupa; embaixo, o muro baixo de reboco (é nele que picham), o portão de grade com o poste amarelo e o toldinho de zinco, e a porta aberta pro corredor branco; em cima, a laje com o ferro de espera e a caixa d'água; e o poste de concreto com as duas cruzetas, a luminária, o transformador e a antena |
| garagem | a moldura de concreto ocre com os dois portões de garagem vermelhos de bandeira vazada em losango e a entrada funda da esquerda; em cima, o tijolo rosado sem reboco entre pilar de concreto, as duas janelas de alumínio, a antena e a telha de zinco |
| base | a casa de tijolo sobre o embasamento alto de cimento: a escada maciça da frente subindo pra plataforma da porta, a do lado subindo pro patamar da porta de lado, a janela de cortina, a porta de veneziana, a fiada de furo de ventilação embaixo da laje e a laje saltada em cima |

Três coisas que vieram junto:

1. **O desenho espelhado.** A casa da escada foi desenhada com a
   esquina à direita, como na foto; quando o terreno tem a esquina do
   outro lado, ela é montada à parte e os vértices trocam de lado
   (`espelhado`) — e as paredes que o bairro usa pro decalque também.
2. **A antena e o varal são recorte**, na folha das grades, como a
   bananeira; a antena não tem marca.
3. **O tijolo rosado é outra peça.** Tinta só multiplica: o tijolo da
   folha multiplicado por qualquer cor fica mais vermelho ou mais
   escuro, nunca rosa claro. A casa das garagens tem a peça dela.

O decalque segue a casa: a pixação vai no muro (casa da escada e
sobrado do varal — como a pichação azul da foto), no cimento do
embasamento, ou no andar de cima e nos portões vermelhos (o das
garagens).

O que não é fiel: a curva do muro é feita de seis retas; o poste não
tem fio (não há fio na cidade); a garagem recua 32 cm da divisa pra
antena não sair do lote; e as escadas desta favela são mais íngremes
que as da foto (40 a 49°), porque o quintal da casa da escada tem de
caber em 4,5 a 6 m de fundo.

### 4.26. O galpão e o prédio comum da cidade

O pedido foi modelar o galpão e o prédio "do mesmo jeito" das casas
novas: porta, janela, portão de verdade em vez da caixa cinza com
retângulo escuro. Desta vez não veio foto — os quatro modelos saíram do
repertório de periferia de cidade brasileira, com as mesmas peças e o
mesmo acabamento das casas (§4.23 a §4.25). São 67 lotes, todos fora da
favela: 59 galpões e 8 prédios. Os 19 galpões DA favela continuam sendo
o barraco da §4.24 — lá o galpão é barraco maior, não depósito.

| modelo | onde | o que tem |
|---|---|---|
| G1 | 48 galpões (11 com letreiro) | o galpão de platibanda: bloco de cimento aparente (55%) ou reboco pintado, a frente alta escondendo o telhado de fibrocimento de duas águas (10°); o portão de correr de chapa com a porta de pedestre desenhada nele, a porta de ferro ao lado com o vitrô em cima; o aviso pintado na platibanda em metade dos sem letreiro (DEPÓSITO, OFICINA, ALUGA-SE); a fileira de vitrô alto nos dois lados e no oitão do fundo; o rufo e o cano de descer água na quina. No comércio: uma ou duas portas de enrolar (às vezes meio aberta, com a prateleira à mostra), a porta de ferro e o letreiro na platibanda |
| G2 | 11 galpões | o galpão de telhado em arco: a abóbada de zinco (a onda corre na volta do arco, como na telha curvada de verdade), o oitão em arco com a veneziana de ventilação, o portão de correr, a porta e o vitrô, a calha dos dois lados. Só sai em galpão sem letreiro de pelo menos 4,2 × 3 m |
| P1 | 4 prédios | o predinho de reboco pintado (oito cores), 3 ou 4 andares: a faixa da escada em tijolo de vidro com a porta do prédio embaixo, a sacada embutida com gradil e corrimão onde o apartamento tem 3,2 m, a janela com o ar-condicionado, o friso branco em cada laje, a platibanda pintada e a casinha da caixa d'água. Embaixo, a loja, a garagem de portão vermelho ou o vitrô de grade. Só a frente é pintada; lado e fundo são reboco cru |
| P2 | 4 prédios | o prédio de tijolo que foi subindo: tijolo aparente entre pilar e laje de concreto, janela de alumínio de quatro folhas ou de madeira; embaixo, a porta de ferro e a janela de grade, ou a loja; em cima, a laje do último andar virou terraço de mureta de tijolo com o puxadinho no fundo (porta, janela, ferro de espera e caixa d'água). No lote raso, o último andar é inteiro, com os pilares subindo e a caixa na laje |

Quem vira o quê sai da posição do lote (`sorteDe`), como nas casas: a
planta não mudou, e as outras 463 casas saem idênticas — vértice por
vértice, cor e contagem de porta e janela; só o UV andou, porque a folha
das casas cresceu de 2048 × 1264 pra 2048 × 1424 com as peças novas
(bloco, tijolo de vidro, vitrô alto, veneziana, portão de galpão, os três
avisos, o fundo da sacada e o ar-condicionado).

Duas coisas que vieram junto:

1. **O térreo do comércio é mais alto** (3,35 m no P1, 3,55 no P2). Com
   o térreo igual aos outros andares, a porta de enrolar comia a parede
   e o letreiro ("GÁS E ÁGUA") não tinha onde ir.
2. **Onde não há reboco, não há reboco caído.** O prédio de tijolo e o
   galpão de bloco não ganham a falha de reboco do bairro — a pixação,
   sim.

Medido: 146.858 triângulos de casa (eram 117.164; +443 por prédio ou
galpão, em média), 467 mil na cena com o boneco, as mesmas 193 chamadas
de desenho (as casas entram na malha do pedaço). Nenhuma passando da
divisa, nenhum NaN, nenhuma sem porta, todo letreiro achou lugar. A
passagem continua 100% (as mesmas 8 células de antes), auditoria e
varredura limpas. Os quatro modelos também foram forçados nos 67 lotes,
com e sem letreiro: nada quebra, nada passa da divisa, e o letreiro
sempre cabe — é o único teste do P1 com loja, que a planta de hoje não
sorteia.

O que não é bom:

- **Cinco galpões sem vidro na frente.** Dois de 1,4 m (a sobra do lado de
  um marco) são porta, parede e laje. Três lojas-galpão de 2,1 a 2,7 m
  são só a porta de enrolar e o letreiro — a portinha de comércio
  existe assim, mas não tem janela nenhuma.
- **A loja meio aberta mostra prateleira colorida**, que é a peça da
  loja do T3; num "MATERIAIS DE CONSTRUÇÃO" ela lê como livraria.
- **Dois galpões vizinhos podem sair com a mesma cor e o mesmo portão**
  — o sorteio é por posição, não olha o vizinho.
- **Um degrau na calçada, que já existia:** uma sobra da laje de quintal
  de um quarteirão cortado pela avenida fica entre a frente de um galpão
  girado e a calçada, e aparece como um degrau de uns 30 cm na frente do
  portão. É da planta (`q.quintal`), estava lá antes com a caixa velha,
  e não foi mexido.

### 4.27. O atacarejo ATACADEX, o tabuleiro maior e as casas de muro

Dois pedidos juntos: um supermercado "inspirado" nas três fotos de um
atacarejo, com o nome **ATACADEX**, no mato a oeste da cidade que o
dono marcou no mapa; e as quatro casas de muro das fotos (de frente e
de cima), três de cada, espalhadas pela cidade, cada cópia diferente.

**O tabuleiro cresceu pra oeste.** O mato marcado ficava FORA do que se
anda: `arredores.js` conta célula a partir de x = 0, e o tabuleiro
começava na rua da borda da cidade. Mexer no recorte do mapa (`MAPA`)
andaria o mundo inteiro, e cada sorteio por posição (o tipo e a cor de
cada casa, as casas grandes da favela, a pixação) mudaria. Então quem
anda é só o TABULEIRO: o x da simulação é o x da planta mais `DX`
(1152). A planta, o 3D e tudo o que ela sorteia ficam onde estavam; a
cena (os pontos de nascimento, as entradas, os postos da PM, as
grades, as filas, a máscara) sai no x do tabuleiro, `mundo()` desconta
o `DX`, e os quatro lugares que comparavam o líder com coisa da cidade
(a porta da sede, a pixação, o telhado da sede que abre, o bandeirão
do setor) descontam também. `DX` é 2 × 576, e 576 é o mmc de 8, 18 e
64 — a célula da malha, a vaga de nascimento e a grade espacial de
`combate.js`: com isso a noite de antes sai IDÊNTICA, disco por disco
(medido com a mesma semente: 90 s, 76 discos, zero diferença). Com
1040 ela saía equivalente, mas não igual. A parte velha da máscara é a
mesma célula a célula, fora o terreno do atacarejo; a faixa nova é
mato andável (94%, o resto é moita e casa de beira) e a passagem
continua 100%. A carga não mudou (uns 7,5 s pra montar a cena).

**O atacarejo.** Entra no fim da planta, como os marcos (sem sorteio),
com a massa em metros declarada uma vez só (`MASSAS.atacadex`): ela
vira o que barra o boneco e a câmera e o esqueleto do modelo
(`modelos3d.js`, folha `atacadex.jpg`). Tem, da avenida pra dentro:

| parte | o que tem |
|---|---|
| estacionamento | asfalto de guia a guia, 14 vagas pintadas, seis carros, a faixa de pedestre na frente da porta, a guia da avenida com as duas entradas e quatro postes |
| marquise | 36 m de testeira azul com o filete verde e amarelo, o selo ATACADEX (vermelho-laranja) com o emblema do carrinho saindo por cima e o ATACADISTA; dez colunas brancas de pé amarelo e preto, na divisa dos nove vãos da vitrine |
| vitrine | vidro com caixilho branco e as gôndolas lá dentro, a porta automática com o ENTRADA, o painel bordô e os cartazes de oferta |
| galpão | 36 × 26 m, 8,8 m de altura, chapa branca com a faixa azul embaixo e em cima; pilastras azuis e a marca pequena na parede da cidade, a porta de serviço |
| parede oeste | o painel amarelo da quina e as cinco docas com o fole preto, uma com a carreta encostada |
| telhado | chapa com fileiras de claraboia, a platibanda por dentro |
| totem | na esquina da avenida com a rua da borda: a marca, o horário e o ESTACIONAMENTO GRÁTIS |

A marca é nossa: o nome é ATACADEX e o emblema é um carrinho num disco
amarelo — nada da marca da referência. Pra caber, saíram do terreno 50
moitas (do balde espacial também), duas árvores, 62 decalques de chão,
sete casas de beira (cinco na avenida, duas retas na rua da borda) e o
pedaço da trilha de terra que atravessava. Custo: 6.744 triângulos,
uma folha de 172 KB e uma chamada de desenho.

**As casas de muro.** Quatro modelos no `casas3d.js`, do jeito das
fotos:

| modelo | o que tem |
|---|---|
| M1 | a garagem coberta na frente, fechada pelo gradil sobre a mureta, com o portãozinho no canto; a água de telha da garagem entra embaixo do beiral da casa de quatro águas |
| M2 | o muro alto com o requadro bege em volta do portão de garagem (de losango ou de chapa) e do portão de grade, o telhadinho da garagem; atrás, a casa de quatro águas com a caixa d'água numa torrinha de telhado próprio |
| M3 | o muro com o portãozinho de grade na boca do corredor, o quintal na frente, a casa com a janela e a porta no corredor |
| M4 | a casinha no meio do lote: muro baixo, o portãozinho, o quintal, a passagem do lado e, no lote fundo, o quintalzinho de trás |

**Três de cada, espalhadas.** Quem escolhe o lote é a planta, sem
sorteio: um modelo por vez, a casa térrea comum (sem comércio, fora da
favela) que cabe o modelo e fica mais longe das já escolhidas; a
primeira é a mais perto do meio da cidade. Deu doze casas pelo mapa,
a mais perto de outra a 48 m. Os doze lotes eram T1 (10) e T2 (2); as
outras 514 casas saem idênticas, vértice por vértice.

**Cada cópia com a sua roupa**, do hash da posição: a cor do muro
(branco, creme, gelo) e a da casa (branco, creme e os pastéis de
bairro), a janela (de correr, de grade, veneziana), a porta (madeira,
veneziana, ferro), a grade (preta, branca, enferrujada), a altura do
muro, o lado do portão (a casa sai espelhada), o tom da telha, o
requadro e o portão do M2, e às vezes um pé de bananeira no quintal.

O que não é fiel, dito com todas as letras:

- **O lote da foto tem uns 20 m de fundo; o da cidade, no máximo 7.** O
  quintal ficou com 1,2 a 2,4 m, a edícula dos fundos não coube e na
  garagem do M1 não cabe carro.
- **O atacarejo é pequeno pra um atacarejo:** 36 × 26 m, na escala da
  cidade (o quarteirão daqui tem 31 × 13 m); um de verdade passa de
  100 m. Os carros do estacionamento são as caixas de carro da cidade.
- **A borda do mapa ficou perto:** o chão pintado acaba uns 4,6 m além
  da nova borda oeste, e de lá se vê o plano liso de areia que fica
  depois dele. Empurrar a pintura mudaria o sorteio das moitas.
- As texturas continuam pintadas por código.

### 4.28. A rua sem saída, os dois prédios do baldio e os props de rua

Três pedidos de uma vez: uma rua sem saída com casas em volta no miolo
vazio que o dono circulou no mapa (o quarteirão 2,2, entre a avenida
noroeste e a rua da delegacia); o terreno baldio virando dois prédios
"no estilo do prédio que te mandei" (o prédio alto do centro, modelado
peça por peça), sendo os dois das fotos; e o pacote de mobiliário de
rua espalhado pelas calçadas — "os sacos de lixo ao lado dos tambores
de lixo, caixas; cestos de lixo na praça, banco de madeira" —, tudo
menos o poste, que ele vai mandar. Os três entram no FIM da planta,
sem gastar `rng()`: o resto da cidade sai igual (medido abaixo).

**A rua sem saída** (`SEM_SAIDA`, guardada em `q.semSaida`). Entra pela
rua do sul no lugar do sobrado que ficava no meio da face, com 5,7 m
de asfalto e calçada de 1,5 m dos dois lados; sobe 24 m pelo meio do
quarteirão e acaba num T de retorno (16 × 5,1 m) encostado no fundo
das casas da avenida. Em volta, dez lotes novos: três de cada lado da
haste (4,8 m de frente, 5 m de fundo), três de frente pro T (a do meio
e a de leste são sobrados, porque ali o fundo livre passa de 6 m) e,
na ponta de oeste, onde o fundo das casas da avenida só deixa 2 m de
chão, o muro de um terreno vazio com o "É PROIBIDO JOGAR LIXO". O tipo,
a altura e a cor de cada lote saem da posição; a casa que vai nele
(T1, T2, T4, T5…) e a roupa dela saem do hash, no `casas3d.js`, como
no resto da cidade. Saíram o quintal e os dez puxadinhos do miolo; o
sobrado da boca sumiu e o vizinho de leste estreitou pra 3,2 m. A rua
é um conjunto de retângulos (asfalto, calçadas) e uma guia: o pintor
do chão pinta calçada, asfalto e meio-fio; o `bairro3d.js` FURA as duas
lajes (a de 1,4 da calçada no asfalto, a de 1,6 do lote no asfalto e
na calçada — `menosRets`, corte de convexo por meio-plano), e a borda
do furo é a guia; `andaNaCidade` anda nela antes de perguntar pelo
miolo maciço. Um carro parado na haste; o T fica livre, que é retorno.

**Os dois prédios** (`PREDIOS`, `MASSAS.torre1/torre2`, folha
`torres.jpg`). O miolo murado do baldio virou um condomínio fechado de
duas torres, uma em cada metade (22 × 19,6 m), de frente pra rua de
oeste; a fileira de bares e lojas virada pro estádio ficou como estava.

| prédio | o que tem |
|---|---|
| EDIFÍCIO MIRANTE | concreto cinza, térreo de 3,6 m e 18 andares (55,8 m, a coroa chega a 60 m); a frente partida pelo RASGO de 1,5 m de fundo com a cortina de vidro azul, a massa da esquerda um andar mais baixa, a da direita subindo na coroa da casa de máquinas com a veneziana, a quina de vidro azul que dobra pro lado; janelinha solta em coluna no concreto e o friso de laje no vidro; a caixa da portaria com o nome na frente |
| RESIDENCIAL BELA VISTA | quadro branco, térreo de 4,2 m e 15 andares (47,7 m); os dois painéis de tijolinho laranja com a janela de requadro branco do lado das sacadas, as duas colunas de sacada recuada com o fundo de vidro azul, a borda branca da laje e o guarda-corpo de vidro em cada andar, e a ALETA branca no meio que passa 3,8 m do telhado, de chapéu; no fundo, as mesmas sacadas; o PÓRTICO de pilares de tijolinho e viga branca com o nome, amarrado na fachada, e a marquise da porta |
| o condomínio | muro creme recuado 15 cm da divisa (frente, fundo e o lado da rua), guarita de vidro fumê com PORTARIA, portãozinho e portão de garagem de grade preta, jardim na frente, no lado e no fundo, e árvores |

A massa de cada um (em metros, uma vez só) dá o que a câmera não
atravessa — `noMarco` agora vale pra qualquer equipamento com
`volumes`, não só marco — e o esqueleto do modelo; o terreno inteiro
barra o boneco (condomínio fechado). O jardim é tinta no chão
(`piso` com `soMapa`): a laje do pátio veste o material do chão, que
lê a tinta, e a grama sai grama sem caixa nenhuma no 3D. A pixação de
torcida do muro grande do baldio (a que dá pra cobrir) mudou pro muro
do condomínio na mesma rua, com o mesmo dizer. Saíram o muro do
baldio, o mato pintado, o entulho, os dois carros largados, as árvores
e o poste de dentro, e 134 decalques de mato e entulho do chão. Custo:
2.598 + 5.146 triângulos, uma folha de 116 KB e quatro chamadas de
desenho.

**Os props de rua** (`PROPS`, `props3d.js`, folha `props.jpg`). Catorze
peças modeladas em metros: o contêiner verde de tampa cinza de duas
folhas (com o encaixe do garfo e as rodinhas), a lixeira de rodinha de
tampa colorida (laranja, vermelha, azul, verde, amarela), o saco de
lixo de 100 litros (amassado, cada variante de um jeito, com o nó), a
caixa de papelão aberta, o cesto de praça de chapa trançada (cinco
cores), a barreira New Jersey, a caixa de correio vermelha, o
hidrante, o balizador preto e amarelo, o balizador amarelo de espuma,
o delineador laranja e branco, o cone, o cinzeiro de pé e o banco de
ripa de madeira com pé de ferro. Cada peça é montada uma vez por
variante e copiada pros lugares; o que cai no mesmo quadrado de
1.600 vira uma malha (384 peças, 38,7 mil triângulos, dez malhas).

Onde: na faixa de serviço da calçada (a que encosta na guia), um
ponto a cada 7,7 m, longe da esquina; o hash do ponto diz se tem
alguma coisa (um em três) e o quê — contêiner com sacos e caixas,
lixeiras da coleta com sacos, sacos soltos, cesto, hidrante,
balizadores, uma obra (barreira, cones, delineador), correio ou
cinzeiro; atrás de comércio sai mais cinzeiro e correio. O grupo só
entra se cada peça cabe na calçada, longe de tronco, poste, semáforo,
faixa de pedestre, carro e de outro grupo — e o que barra não fica de
frente pra carro parado na guia (no primeiro teste uma barreira fez
um beco de dois quadradinhos entre ela e o carro). Na praça, os oito
bancos de caixote viraram o banco de madeira, de frente pro coreto,
com um cesto a cada dois; nas cinco pracinhas das cunhas, o mesmo. Na
rua sem saída, duas lixeiras, quatro sacos e duas caixas amontoados
debaixo do "É PROIBIDO JOGAR LIXO". Barram o boneco o contêiner, a
lixeira de rodinha, a barreira e o correio; o miúdo e o banco da praça
não (a praça é onde a torcida se junta).

**O que se mediu.** A planta de antes contra a de agora: 618 lotes
viraram 627 — só mudaram os dois sobrados da boca, mais os dez lotes
novos; quarteirões, casas de beira, favela, árvores, postes e moitas
idênticos; um carro a mais (o da haste) e 134 decalques a menos, todos
no baldio. A máscara mudou em 7.174 células: 4.761 no baldio (o
condomínio é fechado), 1.886 que passaram a ser andáveis na rua sem
saída, e umas dezenas por quarteirão onde entrou peça que barra. A
passagem continua 100% (os mesmos 10 bolsões isolados de antes, nenhum
novo). As casas: 0 passando da divisa, 0 sem porta na frente; a
auditoria de geometria e a varredura, limpas (a auditoria pegou a
pixação do muro novo pendurada meio ponto sobre a calçada: o muro do
condomínio recuou 15 cm da divisa, como o do baldio recuava). A cena
monta em ~8,1 s (era ~7,5–8) e desenha 207 chamadas (eram 195).

De quebra, um defeito antigo que o muro claro deixou à vista: o atlas
dos letreiros e das pixações tinha as células de 256 × 64 coladas uma
na outra, e o filtro da textura puxava a borda da vizinha pra dentro —
toda pixação e toda placa da cidade tinham um fio tracejado em cima e
embaixo. Agora cada célula tem um respiro de 4 px (o passo continua
256), e a placa estende o fundo dela no respiro.

O que não é fiel, dito com todas as letras:

- **A rua sem saída não tem balão redondo.** O miolo tem 19 m de
  largura: um balão de retorno ocuparia tudo e não sobraria lote em
  volta. Ficou o T, que é o retorno das vilas daqui.
- **Os prédios são mais altos que tudo na cidade** (o prédio alto do
  centro tem 45 m; estes, 60 e 52). É o que as fotos mostram — 18 e 15
  andares —, e de longe eles mandam no horizonte do estádio.
- **Os nomes EDIFÍCIO MIRANTE e RESIDENCIAL BELA VISTA são meus**; a
  foto não mostra nome legível. É trocar a célula no pintor.
- **A caixa de correio diz CORREIO**, não POST: a cidade é brasileira.
  A cor ficou a da referência (vermelha); a daqui seria amarela.
- **O carro parado continua a caixa de carro da cidade**, que de perto
  parece um degrau: foi por isso que o T ficou sem carro.
- Os cestos da referência têm uma trama mais fina do que dá pra pintar
  a 200 px por metro; de longe eles leem como chapa lisa colorida.

### 4.29. O poste de concreto

O poste que o dono mandou (a foto dos dois postes de concreto) veste
os postes da rua (`K.POSTES`) no lugar da caixa de antes. Ele é mais
uma peça do `props3d.js` (folha `props`):

| parte | o que tem |
|---|---|
| fuste | 9,3 m de concreto octogonal afunilado (31 cm no pé, 16 cm no alto), o escorrido, a mancha escura no meio e as faixas brancas pintadas embaixo |
| colar | a base branca octogonal de 60 cm |
| cruzetas | duas, a 8,0 e 8,55 m, atravessadas no sentido da rua, e o chapéu do topo |
| luminária | o braço de 1 m pra rua a 7,2 m, com a mão-francesa embaixo, e a cabeça clara com a lente |
| transformador | em um de cada quatro postes (pelo hash do ponto): a caixa cinza com o aviso de perigo, do lado da calçada, e o cabo pendurado em laço |

São 80 postes: os 76 de antes e os quatro da calçada dos bares do
baldio, que davam pra rua do estádio e ainda eram o modelo velho; o
poste pequeno continua só onde é de praça e de pátio. Custo: uns 230
triângulos por poste (18 mil ao todo), na mesma malha dos props.

### 4.30. A planta em HTML e a proposta de expansão

`ferramentas/planta_html/` é uma página solta, publicada como artefato. Ela
desenha a planta inteira nas cores do diagrama das quadras (o lote pela
cor do tipo e o rótulo "casa n T1", calçada, miolo, quintal, árvore,
carro, poste e prop), com a régua em coordenada de planta. O que se
clica abre em 3D, e o 3D sai do mesmo código do jogo:

- a casa do lote vem do `planoDaCasa`/`montarCasa`, com o letreiro e a
  pixação no lugar que o `lugarDoDecalque` dá;
- o marco e as torres vêm do `montarModelos`;
- o poste e os props vêm do `moldeDaPeca`;
- o equipamento aparece nos volumes em caixa, sem textura.

A página roda a planta de verdade (`dados/cena_estadio.js` cortado antes
da cena). Então, quando a cidade mudar, é rodar `montar.sh` de novo e
republicar.

A segunda aba é a proposta de dobrar as quadras crescendo pra oeste e
pro norte (`proposta.js`):

| | hoje | com a proposta |
|---|---|---|
| quadras | 37 | 83 (+35 de casa, +11 de equipamento ou praça) |
| lotes em quadra | 323 | 724 |
| casas de beira de estrada | 75 | 15 (60 ficam debaixo da grade nova) |

(Os 627 lotes que a planta conta em `K.LOTES` são os 323 de quadra mais
as 229 casas da favela e as 75 de beira.)

- **A grade.** São três colunas a oeste (até x −2.360) e duas linhas ao
  norte, no passo da grade de hoje: rua de 6,1 m e quadra de
  35,6 × 17,8 m.
- **O que não muda.** Favela, atacarejo, estádio e orla ficam como
  estão. A quadra que encosta na favela ou no atacarejo encolhe, e
  fica a opção de maior área. As duas que caíam em cima do atacarejo
  (0,5 e 0,6) saem.
- **As avenidas** ficam onde estão e cortam as quadras novas. O lote
  que encosta nelas sai, e a quadra que fica com menos de 3 lotes vira
  praça. A avenida norte parte ao meio as quadras da coluna 4.
- **Os lotes** saem da mesma regra do `lotear`: testada, fundo, tipo,
  placa em 26%, pixação, 1 em 8 casa de muro. A diferença é que são
  sorteados por hash do lugar, não pelo `rng()` do jogo.

O que não é fiel:

- **A proposta não está no jogo.** Se a planta ganhar as colunas novas
  de verdade, os lotes vêm do `rng()`. Mudam os detalhes (tipo, placa,
  pixação), não a conta.
- **Os equipamentos novos não têm modelo:** escola, posto de saúde,
  igreja, campo e os dois terrenos de sede. O 3D mostra um volume de
  estudo.
- **Os nomes e o lugar de cada equipamento são sugestão**, não pedido.
- **O tabuleiro andável** precisa crescer uns 58 m pra oeste. Pro norte,
  o de hoje já vai quase até lá: falta 1,4 m da rua de cima.

### 4.31. A proposta, 2ª versão

O dono pediu pra refazer a proposta assim: favelas nas duas pontas (noroeste e sudoeste), o
supermercado num extremo do mapa, a escola fora, uma cópia do quarteirão do estádio a
sudoeste, mais três prédios de cada tipo em outras cores, mais 22 quadras (12 a oeste, 10
ao norte) com a borda menos quadrada, e duas estradas de entrada, uma no norte e uma no sul,
cada uma com o pórtico "BEM-VINDO A {cidade}".

| | hoje | 2ª versão |
|---|---|---|
| quadras | 37 | 105 (+55 de casa, +13 de equipamento) |
| lotes em quadra | 323 | 1.014 |
| favelas | 1 | 2 (o mesmo desenho, 229 casas cada) |
| casas de beira de estrada | 75 | 3 (as outras 72 ficam debaixo da cidade nova ou de estrada que acabou) |

Onde ficou cada pedido:

- **A grade.** São 12 quadras a oeste: a coluna −3 nas linhas 1 a 8 e um degrau na coluna −4,
  linhas 2 a 5. As 10 do norte são a linha −2 inteira e um degrau na linha −3 (colunas 1 e 2).
  A borda fica em escada.
- **As favelas.** A de hoje vai pra ponta noroeste, transladada. A segunda é o mesmo desenho
  girado de meia volta, na ponta sudoeste. O vão por onde a avenida noroeste2 passava vira a
  rua principal das duas. O lugar da favela de hoje vira quadra, com a Praça da Vila no meio.
- **O Atacadex** vai pra estrada de entrada do norte, de frente pra estrada e antes do pórtico.
  A borda do estacionamento ficou reta, e as vagas, o totem e os postes da guia foram refeitos
  com a mesma conta da planta.
- **O Estádio Municipal** é o quarteirão do estádio copiado no meio de uma quadra de seis,
  a sudoeste, com a esplanada em volta. No 3D aparece o volume: arquibancada em degraus,
  cobertura, fachada e os quatro refletores.
- **Os prédios.** São três condomínios na linha alta (a do estádio): (1,2), (−2,2) e (−4,2).
  Cada um tem o par do baldio, com a mesma massa, e uma fileira de casas do outro lado. As
  cores saem de `ferramentas/planta_html/pintar_variantes.py`, que roda o pintor da folha
  `torres` com outra paleta. As células caem no mesmo lugar (o script confere o atlas), e o
  modelo só troca a textura. Os pares:
  - Horizonte e Porto Belo: concreto areia, vidro verde, tijolo vinho;
  - Atlântico e Monte Verde: concreto branco, vidro fumê, pastilha grafite;
  - Solar e Ipê Amarelo: concreto terracota, vidro bronze, tijolo mostarda.
- **As entradas.** A do norte é a avenida norte, que sobe reta até a borda nova; a noroeste
  termina num entroncamento com ela. A do sul é a avenida sudoeste. As duas vão dar no
  estádio. A beira-mar termina nas duas pontas da orla, e as avenidas do oeste terminam na
  borda da cidade (a noroeste2 na entrada da favela do noroeste): não sai outra estrada.
- **O pórtico** é feito com o construtor e a folha da igreja: dois pilares com embasamento de
  cantaria e fuste rebocado, viga rebocada com cornija de pedra e telhadinho de telha
  colonial. As letras são aplicadas na viga: BEM-VINDO pra quem chega, VOLTE SEMPRE pra quem
  sai. A ficha deixa trocar a cidade entre as 30 praças do jogo, e a preposição acompanha o
  nome: a São Paulo, ao Recife, à Bahia.

O que não é fiel:

- **Nada disso está no jogo.** É a página.
- **As favelas são cópias.** No jogo, a favela teria que ser gerada de novo nos dois lugares,
  e a de hoje sai. Ela é o maior pedaço feito à mão da cidade, então isso não é pouca coisa.
  Se for melhor manter a favela onde está, dá pra deixar a de hoje e pôr só a do sudoeste.
- **O tabuleiro cresce bastante:** uns 163 m pra oeste (as favelas ficam na ponta), 100 m
  pro norte (a estrada e o Atacadex) e 17 m pro sul (a estrada).
- **Algumas praças são sobra.** Das quatro, três são o que sobrou onde a avenida corta a
  quadra na diagonal.
- **O Estádio Municipal é o mesmo estádio.** A cena da torcida teria que aceitar dois.
- **Os equipamentos novos não têm modelo:** igreja, posto de saúde, campo e os terrenos de
  sede.
- **Parte das praças são regiões,** não cidades: "BEM-VINDO AO INTERIOR DE SP" não é placa
  de verdade. O jogo precisaria do nome de uma cidade.

### 4.32. A proposta, 3ª versão

O dono circulou no mapa onde quer as favelas e as duas avenidas que não quer, e pediu mudanças
em seis quadras.

- **As favelas nas manchas circuladas.** Elas não são mais a cópia torta da favela de hoje:
  nascem de novo dentro do polígono que ele desenhou (o gancho do noroeste, em volta do
  condomínio −4,2, e a meia-lua do sudoeste, a oeste e ao sul do Estádio Municipal). A conta
  é a da favela da planta:
  - faixas de quadra miúda (86 a 124 de fundo) com beco de 32 a 42 entre elas;
  - quadras compridas (500 a 850) em cada faixa;
  - duas fileiras de casa encostada na casa, de 42 a 66 de frente;
  - as mesmas alturas, coberturas, paredes e pixações;
  - as 19 casas grandes de cada tipo, com o sorteio da planta (bar, lanchonete, a da escada…);
  - um campinho de terra.

  A diferença é que o beco é reto, de leste a oeste ou de norte a sul, como a rua da cidade.
  Pra não ler como bairro planejado, o corte de norte a sul de cada faixa começa num lugar, e
  o beco não emenda de uma faixa pra outra. O sorteio é próprio, de semente fixa.
- **Saem as avenidas transversais do oeste**, a oeste e a noroeste2. As quadras novas que elas
  cortavam voltam a ser inteiras; as duas praças de sobra somem. A 1,4 de hoje, que a oeste
  rasgava na diagonal, é refeita.
- **A rua no meio.** As quadras altas −3,2, −1,2 e 0,2 ganham uma rua de norte a sul. Cada
  metade vira duas fileiras de casa de costas, sem o quintal enorme.
- **As quadras juntadas.** 0,7 com 1,7, −2,3 com −1,3 e 0,−1 com 1,−1 viram uma quadra só
  cada par, por cima da rua. A 1,7 é de hoje e entra na junta.

| | hoje | 3ª versão |
|---|---|---|
| quadras | 37 | 105 |
| lotes em quadra | 323 | 1.112 |
| casas na favela | 229 | 1.724 (545 no noroeste, 1.179 no sudoeste) |

**A favela encosta na cidade** (pedido seguinte do dono, com a faixa de mato entre a favela do
noroeste e o condomínio −4,2 circulada):

- **As faixas estreitas entram.** Entra na favela o ponto de fora da mancha cuja distância
  até ela, mais a distância até a rua ou a quadra da cidade, não passa de 340 (17,5 m).
  Assim, a faixa estreita entre as duas enche, e o mato largo do lado de fora fica.
- **A casa encosta na rua.** A que batia na rua passa a ser aparada até a guia, no lugar de
  sair.
- **O canto do sudoeste também entra.** É o canto entre a favela e a quina da cidade, a oeste
  de −3,6 a −3,8 e ao sul de −4,5.

**Primeiro a grade, depois as casas** (pedido seguinte do dono). A favela não sorteia mais as
faixas a partir da borda da mancha; ela usa a grade da cidade:

- **As vielas.** Cada rua da cidade segue dentro da favela na mesma linha, como uma viela
  de 48 (2,5 m) no meio da faixa da rua. As linhas depois da 10 seguem no mesmo passo.
- **A borda.** Onde o quarteirão da favela encosta numa quadra da cidade, a rua da cidade
  (na largura inteira) é a borda dele, e a casa dá direto pra ela.
- **O miolo.** Cada célula da grade que cai na mancha e não é cidade vira um quarteirão de
  favela. Ele é cortado em faixas de 86 a 124 com beco de 32 a 42 entre elas, e por um ou
  dois becos de norte a sul (que às vezes não cortam a faixa). Dentro, vêm as duas fileiras
  de casa e as casas grandes.
- **O corte.** A mancha recorta as casas do lado do mato, e a viela e o beco só aparecem
  onde tem casa do lado.

Com isso a rua nova da cidade passou a ser pintada na largura inteira: era a meia rua que
deixava um fio de mato entre a favela e a guia. As favelas ficaram com 545 e 1.179 casas.

**A casa em cima do asfalto** (o dono desconfiou pela foto, e estava certo). A rua nova era
pintada com RUA + 12, pra cobrir as ruas de 128 em volta da linha do estádio, mas a favela
parava na RUA (118,8). Uma varredura casa a casa (9 × 9 pontos em cada casa contra a faixa
de rua pintada, a avenida com a calçada e o asfalto da cidade de hoje) achou 48 casas no
noroeste e 82 no sudoeste com até 11,5 (60 cm) em cima do asfalto.

Agora cada quadra nova tem a faixa de rua dela na largura de verdade: até a borda da coluna
ou da linha do lado, 118,8 quase sempre e 128 em volta da linha e da coluna do estádio; do
lado de dentro da quadra partida, a rua do meio. É essa mesma faixa que a página pinta e que
a favela não pisa. A varredura deu 0 casa em cima de asfalto. A rua nova também não pisa
quadra de hoje nem miolo de quadra nova.


O que não é fiel, ou pesa:

- **As favelas ficaram grandes**, porque enchem a mancha inteira e agora encostam na cidade:
  são mais de sete vezes as casas de hoje. No jogo isso pesa (triângulo e máscara). Se for
  muito, é diminuir o polígono.
- **O tabuleiro cresce ainda mais:** uns 213 m pra oeste, 100 m pro norte e 55 m pro sul.
- **O polígono é o desenho à mão, lido da foto.** A borda da favela segue o traço, com a
  imprecisão dele.

### 4.33. Sete terrenos pra sede na proposta

O dono pediu pelo menos sete terrenos pra sede no mapa. A proposta tem sete, espalhados pela
cidade nova, numerados de 1 a 7 no mapa:

| nº | quadra | onde |
|---|---|---|
| 1 | 5,0 | nordeste, a duas quadras do estádio |
| 2 | 2,−3 | bairro novo do norte |
| 3 | −1,−2 | noroeste |
| 4 | −4,4 | ponta oeste |
| 5 | 0,4 | meio do oeste |
| 6 | −3,6 | oeste |
| 7 | 0,9 | sul, perto da entrada |

- **O tamanho** é a fatia que a sede de nível 3 da planta pede (a conta do `areaDaSede`: 72%
  da frente da quadra, pelo menos 420, e o fundo inteiro), uns 22 × 12,8 m. Fica na ponta
  oeste da quadra, com a frente pra rua. A sede de nível 1 usa só um canto dela.
- **O resto da quadra** continua casa. As casas que caíam na fatia saem, e o quintal encolhe
  até a divisa.
- **Os dois terrenos de quadra inteira** da 2ª versão viraram fatia também. As sedes de hoje
  (TJF e TJG) ficam onde estão.
- **Na página,** o terreno é terra batida com a borda roxa. No 3D, é murado, com portão de
  chapa e a placa TERRENO PARA SEDE.

O que falta pro jogo: a planta hoje monta duas sedes (`SEDES.mandante` e `.visitante`).
Pra usar os sete terrenos, ela teria que aceitar uma lista de sedes.

### 4.34. O bar pequeno da torcida, 18 bares e quem mora em cada espaço

O dono pediu o bar da torcida menor, no tamanho e no arranjo do bar da favela, só que de
classe média: o bar nas cores da torcida embaixo de um apartamento, com o que o bar grande
tinha dentro. E 18 lugares assim pelo mapa; o bar que nenhuma torcida da cidade usa fica
neutro, de porta fechada, e o espaço de sede também (torcida de sede nível 0 não tem sede).

**O modelo** é o `bartorcida` do `casas3d.js` (entra pelo `l.modelo`, como as casas grandes
da favela). O lote é o de esquina, 7,4 m de frente e o fundo da fileira (4,5 a 5,8 m):

- **o térreo**, de 3 m: a varanda coberta na frente (1,3 a 1,7 m, como a do bar da favela),
  com duas mesas de madeira; atrás dela o salão, com duas portas de enrolar na frente e uma
  do lado da esquina. Parede, pilar e frontão na cor 1 da torcida, o rodapé na 3, a faixa
  alta na 2, e o letreiro BAR DO X no frontão, no fundo da cor 2 (`l.placa`,
  `l.placaFundo`, `l.placaTinta`; o plano da casa diz onde ele vai, com o deslocamento `u`
  porque o frontão não é centrado no lote);
- **dentro**, o que o bar grande tinha: o chão de xadrez azul e creme, o balcão em L na cor 2
  com tampo de granito e as banquetas, o armário com a prateleira de garrafa, a cervejeira,
  dois freezers com a TV (o jogo passando) em cima, o engradado, a mesa de madeira e a porta
  do banheiro. Salão raso perde a mesa de dentro e um freezer;
- **o corredor do apartamento**, do lado que não é a esquina: a porta cinza na frente, na
  cor do prédio;
- **o apartamento**, de 2,75 m: reboco pintado (seis cores claras), sacada recuada com gradil
  em cima da varanda, janela de alumínio, ar-condicionado, janela do lado da esquina,
  platibanda e a casinha da caixa d'água;
- **fechado** (sem `l.torcida`): o térreo em cor de reboco, as três portas abaixadas, o
  ALUGA-SE numa delas, sem letreiro e sem nada dentro (1.900 triângulos aberto, 600
  fechado).

O desenho é o da esquina à direita; a da esquerda sai pelo `espelhado`, e a peça com letra
(a cervejeira, o ALUGA-SE) é desenhada depois, sem espelho. Nenhum lote do jogo usa o modelo
ainda: as 2.917 casas do jogo e da proposta saem com a mesma geometria de antes.

**Os 18 lugares** (`proposta.js`): o bar grande sai das quadras 2,8 e 5,1 e a fatia dele vira
casa (as fileiras da conta do lotear, no fundo das que já existem, só onde não tem lote). Os
dois primeiros bares ficam nessas quadras, na esquina mais perto da fatia; os outros 16, um a
um, na esquina que fica mais longe de todo bar já posto (no máximo um por quadra, com quadra
nova e quadra de hoje concorrendo). O mais perto de outro fica a 69 m. O bar pega a ponta da
fileira norte ou sul; o lote do caminho é aparado (se sobrasse menos de 2,9 m, o bar fica
com ele inteiro, até 9 m, ou encolhe até sobrar). Seis bares caem em quadra de hoje: o lote
de hoje que vira bar sai do desenho da proposta (`lotesTirados`) e o novo entra
(`lotesExtra`).

**Os espaços de sede** são nove: os sete terrenos e as duas sedes de hoje (a 2,9 é fatia de
nível 3; na 5,2 só cabe a de nível 1).

**Quem mora onde** é da página, pela cidade escolhida no alto (a praça da torcida, o `mapa`
dela): a maior torcida (nível da sede, depois o poder) escolhe primeiro e fica com o espaço
mais perto do estádio; a de nível 1 prefere o espaço pequeno. Cada sede ganha um bar (o
GDD §8.1 dá um bar nível 1 com a sede nível 1), o livre mais perto dela. A sede no espaço é
o modelo da 4.35: a de nível 3 (do nível 2 em diante, como a planta faz) ou o barracão de
nível 1, virado pra frente do espaço, com as cores e o nome da torcida; a de nível 1 num
terreno inteiro fica no canto, e o resto é pátio murado. Espaço vago leva a sede do tamanho
dele fechada, em cor de reboco, sem nada dentro.

Em São Paulo as 8 torcidas ocupam 8 bares e 8 espaços; em Santos, 3 e 3.

O que falta pro jogo: a cena do dia de jogo ainda usa o bar grande andável (`barDaTorcida`) e
duas sedes; pôr as torcidas da cidade nos 18 bares e nas 9 sedes é trabalho da planta. O
GDD §7.2 pede o bar em outra zona que a sede; o mapa 3D não tem zona, então a página ficou
com o que a planta já fazia (o bar perto da sede). E não existe sede nível 0 nos dados (as
140 torcidas estão entre 1 e 4): a regra do nível 0 está pronta, mas nenhuma cai nela hoje.

### 4.35. A sede refeita no jeito das construções novas

O dono pediu a sede com o visual das construções mais recentes (o bar da torcida, as casas
da favela, o Atacadex), no mesmo nível de detalhe, e cada cômodo mobiliado conforme o que
ele é. A sede da planta (`sedeDaTorcida`) é a sede ANDÁVEL da cena do dia de jogo: parede,
porta e móvel em caixa lisa, que é o que a máscara de caminhada precisa. Ela não foi mexida.
O modelo novo é um módulo à parte, `js/diajogo/sede3d.js`, que por enquanto só o artefato usa.

**As paredes e as portas são as da planta.** `planoDaSede(L, A, nivel, lado)` refaz a conta
do `sedeDaTorcida` — as mesmas constantes (parede de 9, muro da frente de 66/74, vão de 30,
portão de 56), os mesmos cômodos e as mesmas folhas de porta — em coordenada local: `u` ao
longo da fachada, `v` da fachada pro fundo, pelo mesmo `eixos` (em duas das quatro frentes o
referencial é espelhado, e o modelo também). `ferramentas/planta_html/conferir_sede.mjs`
confere nas duas sedes da cidade, parede por parede (23 e 9), folha por folha (9 e 4), a
placa de cada sala e o MÓVEL QUE BLOQUEIA a caminhada: a mesa da diretoria e o armário do
depósito na sede grande; a caixa d'água, o armário e a estante do patrimônio, o armário e a
mesa da presidência no barracão — os sete no mesmo retângulo da planta. Se a planta mudar a
sede, o teste acusa.

**O que é só do modelo** (visual, não muda a caminhada): as janelas (a de grade na frente de
cada sala, o tijolo de vidro no banheiro, o basculante no almoxarifado e no fundo, o vitrô
alto no salão), a verga e o batente das portas, a janela de balcão entre o bar e o salão, a
parede do pátio subindo até o telhado no barracão (na planta ela para em 2,6 m), e a mobília
nova. Na fachada: a parede na cor 1 da torcida, o rodapé na 3, a faixa na 2, o letreiro com o
nome dela em cima da porta (nível 3; no barracão, no trecho das salas), um escudo de cada
lado (a bola da torcida e as duas cores do clube em 135°, a regra do jogo) e um em cada
parede do lado. Os batentes da porta da rua param na faixa da verga pra dar lugar ao
letreiro — na planta eles sobem até em cima.

**O que tem em cada cômodo** (tudo em metro, no referencial do cômodo: `s` ao longo da parede
da porta, `t` da porta pra dentro; a mobília deixa livre a frente de cada porta):

- NÍVEL 3 (22 × 12,8 m): SECRETARIA (mesa de atendimento com computador, cadeira de
  escritório e duas de quem chega, arquivo de aço, estante de pasta, mural, bebedouro,
  bandeira, ar); BAR (balcão de granito atrás da janela de balcão, prateleira de garrafa,
  armário, geladeira, freezer, engradados); BANHEIRO (azulejo até 1,60 m, dois boxes com
  vaso, dois mictórios, pia de duas cubas com espelho); ALMOXARIFADO (três estantes de aço
  cheias, surdos, mastros no canto); CORREDOR (capacho, extintor, quadro de aviso); SALÃO
  (barrado e duas listras no chão nas cores da torcida, sinuca, pebolim, mesa comprida com
  cadeira de plástico, a bateria no pé da faixa com o nome da torcida, TV, bancos, pilha de
  cadeira, a lojinha de camisa e as banquetas do balcão); ALOJAMENTO (três beliches,
  colchões, armário de aço); DIRETORIA (a mesa da planta vira a do diretor, com computador e
  duas cadeiras; estante de troféus; mesa de reunião com seis cadeiras; TV, bandeira, ar);
  DEPÓSITO (estantes, faixa dobrada, colchão empilhado, caixas, o armário da planta com
  troféu velho em cima, o bumbo velho).
- NÍVEL 1 (12,9 × 9,3 m): PÁTIO descoberto (os três colchões, a caixa d'água e o mastro da
  planta; tanque, churrasqueira de tijolo, mesa de plástico, varal, banco, a faixa na parede,
  a grade de correr recolhida ao lado da porta); PATRIMÔNIO (o armário e a estante da planta,
  troféus em cima do armário, surdos, mastros, caixas); PRESIDÊNCIA (a mesa e o armário da
  planta, computador, cadeira de escritório, sofá, mural, bandeira, ar).

**Sede vaga** (sem torcida, ou torcida de sede nível 0): a mesma construção em cor de reboco,
nada dentro, a porta de enrolar abaixada no portão, as portas fechadas e o telhado.

**O que `montarSede(sede, destino, opc)` devolve**: os blocos no mundo em três listas — `casas`
(folha das casas), `grades` e `telhado` (à parte, pra quem mostra poder tirar); os decalques
com texto (o letreiro, a placa de cada sala, a faixa e os escudos: quem desenha o texto é quem
mostra, como no bar da torcida); e a planta baixa em retângulos (piso, parede com o vão das
portas, móvel). Com `opc.so2d` sai só a planta baixa. A sede grande aberta tem 15.300
triângulos (5.200 vaga); o barracão, 4.260 (1.800 vago); montar a grande leva uns 100 ms.

**No artefato**: as duas sedes de hoje (aba Mapa atual) e os nove espaços da proposta usam o
modelo; o mapa 2D desenha a planta baixa dele (a vaga coberta pelo telhado). No 3D, o botão
**Telhado** tira e põe o telhado; a sede ocupada abre sem ele, a vaga com ele, e a vista da
quadra inteira sempre com ele. A página agora carrega `dados/times.js` (como o jogo), pra o
escudo do clube sair com as cores dele; sem os clubes, o escudo do clube usa as duas últimas
cores da torcida.

O que falta pro jogo: a cena do dia de jogo continua montando a sede em caixa. Pra trocar,
é chamar `montarSede` com o equipamento da planta e pôr a mobília nova na máscara de
caminhada (hoje só a da planta bloqueia) — o telhado já vem à parte, que é o corte que a
cena faz quando o jogador entra.

### 4.36. O metrô, o segundo shopping, a delegacia nova e a Praça da Vila

O dono mandou cinco fotos e pediu, na proposta: a Praça da Vila mais detalhada; um shopping
detalhado no lugar do campo de várzea; a delegacia no lugar do posto de saúde; e duas entradas
de metrô subterrâneo, na quadra −2,6 e na 3,−1, com a entrada da foto da entrada e a parte de
dentro da foto da plataforma, as duas ligadas embaixo da terra, com trem de uma pra outra.

**Onde foi cada coisa.** Tudo é da proposta (a aba Mapa atual não mudou nada):

- a Praça da Vila é a quadra 1,1 inteira;
- o **Shopping Poente** fica na −2,4, no lugar do campo (`EQUIP`, frente pro sul);
- o **2º Distrito Policial** fica na −1,6, no lugar do posto de saúde (frente pro norte, de
  frente pra entrada do metrô Poente). O posto de saúde saiu. A delegacia de hoje, a da 2,3,
  CONTINUA: a cidade da proposta tem duas. Se a ideia era mudar a delegacia de lugar, é tirar a
  da 2,3 da `EQUIP`, que é uma linha;
- a **Estação Poente** fica na ponta leste da −2,6, e o povo desce da rua do norte;
- a **Estação Norte** fica na ponta oeste da 3,−1, e o povo desce da rua do sul.

**O metrô nos dados** (`proposta.js`, a tabela `METRO` e o trecho depois dos bares, pra não
mexer no sorteio dos 18 bares). A ENTRADA é o terreno da ponta da quadra, de uma rua à outra,
com 6,4 m de frente pra rua do lado. O lote da ponta de cada fileira sai; o vizinho que ficaria
com menos de 2,9 m entra no terreno; o que sobra mais que isso é aparado até a divisa (e perde
o muro, que era do lote inteiro). O quintal do meio encolhe junto. A −2,6 ficou com 9 lotes e a
3,−1 com 10.

A ESTAÇÃO é um salão de 11 m de largura embaixo da quadra, de ponta a ponta, que passa 3 m
debaixo das ruas do lado:

- o mezanino fica a 5,2 m e a plataforma a 10 m;
- o trilho corre do lado da rua de onde o povo desce, e a plataforma e o mezanino ficam do
  outro lado;
- o TÚNEL sai da ponta da entrada de uma e chega na ponta da entrada da outra, numa Bézier que
  sai e chega no rumo do trilho.

A linha tem 358 m e o túnel reto daria 256 m. Da parada de uma à parada da outra são 319 m, e
o raio mais apertado da curva é de 58 m. `gerarProposta` devolve `metro` com:

- `estacoes`: a oeste primeiro;
- `caminho`: os pontos do eixo do trilho, de 20 em 20, com a distância acumulada;
- `km` de cada parada.

Cada quadra com estação ganha `q.estacao`.

**O modelo** (`js/diajogo/metro3d.js`). A estação é escrita UMA vez, no referencial da
Poente: x ao longo do salão, com a entrada e o túnel no x grande; z do trilho pra plataforma;
y a altura. A Norte é a mesma girada 180°, que não espelha nada, e então o que tem letra lê
certo nas duas. `montarEstacao(est, destino, opc)` devolve:

- os blocos;
- os decalques com texto (o nome da estação, as placas penduradas, o sentido);
- a planta baixa (o que está na rua e o que está embaixo, à parte);
- onde o trem para;
- de onde se olha a plataforma.

As partes, de cima pra baixo:

- ENTRADA (a foto da entrada de vidro): a caixa de vidro no pórtico branco, a viga em onda
  descendo no fundo, a faixa grafite com o M e METRÔ, o totem do M na calçada e a grade de
  enrolar recolhida;
- DESCIDA (a foto de cima): a escada fixa de 31 degraus com o bocel amarelo e a rolante, entre
  as paredes de azulejo azul;
- MEZANINO: a bilheteria, o mapa da linha, as cinco catracas e as placas penduradas; do lado
  pago, a escada pra plataforma;
- PLATAFORMA (a foto de Londres): o piso bege, a pedra da borda e a faixa amarela tátil, os
  bancos, os anúncios iluminados e os dois painéis de próximos trens. Na parede, o nome da
  estação, a faixa azul e o friso de triângulos. No fim, a parede de tijolo com a boca do
  túnel.

O CORTE DE CASA DE BONECA: tudo que é de baixo da terra tem a face virada pra dentro e vai na
lista `metro_sub`, que quem mostra desenha só de frente (FrontSide). De cima, o teto e a parede
do lado de cá, que mostram as costas, somem sozinhos, e a estação aparece inteira. Da
plataforma, está tudo lá. O que pende do teto só tem a face de baixo. O vidro vai em `vidros`,
transparente e sem escrever no depth.

As outras peças:

- `montarTunel(caminho, destino, {de, ate})` levanta o tubo em peças de 2,4 m, com a brita, os
  trilhos e uma luminária a cada 12 m;
- `montarCarro(ponta)` faz um carro de 11 m: a cara azul-marinho com a moldura vermelha, o
  carro branco com a faixa azul e as portas vermelhas, e os truques. O trem são três carros.

Uma estação tem uns 7.900 triângulos e sai em 30 a 60 ms. O túnel tem 5.400 e cada carro de
320 a 360.

**Os equipamentos** (`js/diajogo/equip3d.js`: `montarShopping`, `montarDelegacia`,
`montarPraca`). O referencial é o do construtor: x da esquerda pra direita de quem olha a
fachada, z entrando no terreno. Pro mundo ele só GIRA, então a porta da delegacia, a viatura e
a banca leem certo. O que tem texto que muda (o nome do shopping, o letreiro e o brasão da
delegacia, a placa da praça) vai como decalque.

- SHOPPING (a primeira foto): a planta de estádio, com a ponta redonda. Três andares de
  cortina de vidro verde, com a faixa de alumínio em cada laje, e o último andar recuado de
  vidro inclinado. A marquise de vidro na entrada. No teto, a casa de máquinas em meia-lua, as
  condensadoras, a claraboia em pirâmide, os exaustores e a antena. Na praça da frente, o totem
  cinza e vermelho, as árvores no vaso, os bancos, o bicicletário e os balizadores.
- DELEGACIA (a segunda foto): dois andares de pastilha bege, a platibanda e o volume de cima
  em azul, as janelas em fita. A marquise branca de friso vermelho, o letreiro, o brasão e a
  bandeira do Brasil no mastro da fachada. A ala do plantão 24 h. No teto, as condensadoras e
  as placas solares. O pátio tem grade, portão de correr, guarita e três viaturas da Polícia
  Civil.

  A folha nunca espelha, e o lado da viatura tem nome, farol e lanterna. Por isso ele é DUAS
  células (`viatura_lado` e `viatura_lado_i`, a lataria invertida com o nome escrito certo), e
  cada lado pega a que põe o farol na ponta da cara.
- PRAÇA: a pedra portuguesa em onda e a cruz de calçadão, o chafariz de pastilha, o parquinho
  na areia e no piso emborrachado (escorregador, balanço, gangorra) e as duas academias ao ar
  livre. Também as mesas de xadrez, a banca de jornal, os ipês amarelos e as outras árvores,
  os bancos de ripa, os postes de praça, as lixeiras, o bicicletário e a placa.

Em triângulos: o shopping tem uns 4.400, a delegacia 6.060 e a praça 6.740. Cada um sai em uns
35 ms. Nenhum vértice passa do terreno (conferido).

**As folhas.** `pintar_modelos.py` ganhou duas folhas: `metro` (31 peças) e `equip` (34). E
agora pinta só as folhas que se pedem:

    python3 ferramentas/pintar_modelos.py metro equip

Isso junta as duas no atlas que já existe. As outras folhas ficam idênticas, byte a byte.

**No artefato** (a "4ª versão" das notas da proposta):

- No mapa 2D:
  - a linha tracejada azul;
  - o salão e o mezanino tracejados;
  - a planta da entrada e o M;
  - a planta baixa do shopping, da delegacia e da praça.
- Clicar no M abre a ficha da estação, com dois botões:
  - **Pegar o trem**: monta as duas estações, o túnel inteiro e os três carros, e anima a
    viagem em uns 13 s com a câmera atrás do trem. Na chegada, a ficha vira a da outra
    estação. O tempo "uns 47 s" da ficha é o de verdade: 10 m/s mais 15 s de arrancar e frear.
  - **Descer na plataforma**: põe a câmera na altura do olho, olhando ao longo do trilho.
- A vista de cima esconde o chão da rua.

**O que NÃO está feito, e por quê:**

- O jogo não tem metrô. A viagem é a animação da página. Pra virar jogo, precisa de cena (a
  plataforma andável) e de uma transição, e isso é outra conversa.
- É uma linha de ida e volta, de um trilho só, com a plataforma de um lado. Metrô de verdade
  tem dois trilhos. Dá pra dobrar, mas o salão passa de 11 m pra uns 15 m.
- A escala é a da cidade, que é compacta. O raio de 58 m é apertado pra metrô de verdade, que
  normalmente faz curva bem mais aberta. No jogo não se nota, mas não é realista.
- O corte de casa de boneca é escolha de visualização. Na cena, a parede do lado de cá teria
  de aparecer.
- O detalhe é de caixa: a árvore é pirulito, o móvel é caixa, a viatura é caixa com a peça
  pintada.
- O shopping não tem estacionamento. A igreja e as praças que sobraram continuam sem modelo.

### 4.37. A favela do sudoeste em três pedaços, e as 30 cidades contra os dois mapas

**A favela.** O dono pediu pra dividir a favela do sudoeste em três. Um pedaço vai pro sul do
mapa, abaixo da 2,10; outro vai pro norte, acima da 3,−2; o resto fica no sudoeste, ao lado do
estádio. Em `FAVELAS` (`proposta.js`):

- **Favela do Sudoeste**: é o traço do dono do lado do Estádio Municipal e da estrada sul,
  cortado na viela a oeste da coluna −3 e na viela de baixo da fileira 11. Da fileira 12, fica
  só o trecho embaixo do estádio. Tem a coluna −3 (fileiras 9 a 11) e as duas fileiras de baixo
  do estádio: 397 casas.
- **Favela do Sul**: fica abaixo da 1,10, do campo da 2,10 e da 3,10, entre a estrada sul e a
  praia. São as fileiras 11 e 12 das colunas 1 a 3: 309 casas.
- **Favela do Norte**: fica acima da 3,−2 e da sede da 2,−3, até a estrada do norte (longe do
  pórtico). São as fileiras −3 a −5 das colunas 2 a 4: 388 casas.

Eram 1.179 casas numa favela só e agora são 1.094 em três. A diferença vem de que cada pedaço
tem as suas 19 casas grandes e o seu campinho, e isso come lugar de casa pequena. A do
noroeste não mudou (545).

Três mudanças no gerador de favela:

1. **A célula é de uma favela só.** O conjunto `tomadas` guarda cada quarteirão que uma favela
   pegou, e a próxima pula ele.
2. **Cada mancha pode ter uma `caixa`.** A caixa limita onde a favela põe casa (a viela da
   borda). Sem ela, a regra do GAP, que cola a favela na rua da cidade, puxava um pedaço do
   quarteirão vizinho.
3. **A rua em volta do campo e do estádio da planta entrou na `barra`.** Antes só a rua das
   quadras entrava, e seis árvores da favela do sul caíam no asfalto de baixo do campo da 2,10.

Fora as favelas, a proposta sai igual, byte a byte (quadras, bares, espaços de sede, metrô).
Muda só a borda sul do mundo, que as favelas empurram: ela sobe de 6.855 pra 6.690, e com ela o
primeiro ponto da estrada sul, na mesma reta. O pórtico não sai do lugar. A borda de cima da
proposta agora vai até a Favela do Norte.

**As cidades contra os mapas.** O dono pensa no mapa de hoje como o das cidades pequenas e
na proposta como o das grandes, e mandou uma planilha com as 30 praças: nível, porte,
bairros, torcidas e estádios. `ferramentas/planta_html/conferir_cidades.mjs` confere cada
praça (`dados/cidades.js` e `dados/torcidas.js`) contra o que cada mapa tem, tirado do próprio
mapa:

| | estádios | espaços de sede (grande + pequeno) | bares | favelas | metrô |
|---|---|---|---|---|---|
| mapa atual | 1 | 1 + 1 | 2 | 1 | não |
| proposta | 2 | 8 + 1 | 18 | 4 | sim |

Cada praça pede:

- um estádio por estádio dela;
- uma sede por torcida (a de nível 2 em diante pede espaço grande);
- um bar por torcida;
- uma mancha de favela por bairro de classe Favela;
- o metrô, se ela tem.

O que saiu:

- **Nenhuma das 30 cabe no mapa atual, nem as pequenas.** Toda praça pequena tem 3 torcidas ou
  mais, e seis das sete têm 2 estádios. Pra servir as pequenas, o mapa atual precisa de:
  - 1 estádio a mais;
  - de 2 pra 5 espaços de sede, 4 deles grandes;
  - de 2 pra 5 bares;
  - de 1 pra 3 favelas.
- **Na proposta cabem todas as pequenas, 8 das 18 médias e só 1 das 5 grandes** (Belo
  Horizonte). Contando pela planilha: Interior de SP como média, e Interior do RS e de SC com 2
  estádios. O que barra é o estádio: 13 praças têm 3, e São Paulo tem 4. Sede e bar sobram pra
  todo mundo, porque o máximo é 8 torcidas, 7 de sede grande. Fortaleza tem 5 bairros de
  favela, e a proposta tem 4.
- **A planilha e os dados do jogo não batem em três praças.** São elas:
  - Interior de SP: a planilha diz Médio com 12 bairros; os dados dizem Pequeno com 8.
  - Interior do RS e Interior de SC: a planilha diz 2 estádios; os dados dizem 3.

  `dados/cidades.js` é gerado por `ferramentas/importar_bairros.py`, então a correção vai na
  fonte. São Paulo está sem metrô (`temMetro: false`), o que parece erro de dado.
- **As zonas.** O mapa não tem bairro, e o jogo tem. A sede fica no bairro da torcida
  (`bairroSede`), o bar fica em outra zona (GDD §7.2), e a classe do bairro decide renda e cena.
  As quatro favelas da proposta ficam no norte, no sul e no oeste; nenhuma fica no leste, que é
  a praia. 16 das 30 praças têm bairro de favela no leste.
- **A praia.** Os dois mapas têm mar a leste. Isso serve pras praças do litoral (Rio,
  Fortaleza, Recife, Salvador, Natal, Maceió, João Pessoa, Aracaju, São Luís, Santos, o litoral
  catarinense), mas não pras sete pequenas, que são todas do interior, nem pra São Paulo e Belo
  Horizonte.


### 4.38. Três mapas — o pequeno, o médio e o grande —, e cada praça no dela

**O pedido.** Depois da conferência da 4.37, o dono decidiu:

- Interior de SP é praça média; Interior do RS e Interior de SC têm 2 estádios. É pra
  corrigir no código.
- O mapa das pequenas é o de hoje com uma cópia do estádio, 5 terrenos de sede, 8 prédios de
  bar e 3 favelas, com as construções da proposta.
- Praça sem praia não tem praia no mapa: no lugar dela, mato.
- É pra fazer um mapa médio com o máximo que uma praça média pede.
- O mapa 3D tem de ter todos os estádios da praça.

**Os dados.** `dados/cidades.js` é gerado, então a correção foi feita na fonte
(`dados/fonte/cidades_bairros.json`), e depois `ferramentas/importar_bairros.py` rodou de novo.
O importador precisa do `openpyxl` pra ler o `Book_3_1.xlsx`; sem ele, perde os dados da
planilha sem avisar.

- **Interior de SP** passou a nível 2, porte Médio, 120 quarteirões e 12 bairros (3 por zona).
  Tinha 8 bairros, então entraram 4, um por zona, sem sede de torcida:

  | bairro | zona | classe | faturamento |
  |---|---|---|---|
  | Sorocaba | Sul | Classe Baixa | 0,8 |
  | São José do Rio Preto | Norte | Nobre | 1,5 |
  | São Carlos | Leste | Classe Média | 1,0 |
  | Presidente Prudente | Oeste | Classe Baixa | 0,8 |

  A classe de cada um foi escolha minha. O multiplicador médio foi de 0,975 pra 0,992.
- **Interior do RS** perdeu o Estádio Centenário e ficou com o Bento Freitas e o Alfredo
  Jaconi. **Interior de SC** perdeu a Arena Condá e ficou com a Arena Joinville e o Heriberto
  Hulse. O critério foi manter o estádio das torcidas com mais membros:
  - no RS, o Centenário soma 80 membros (Falange Grená e Mancha do Ypiranga), empatado com o
    Jaconi (Mancha Verde, que tem sede de nível 3 e clube na 2ª divisão);
  - em SC, a Condá tem 30 membros (Jovem Chape), contra 60 da Arena Joinville. Pela divisão do
    clube a conta vira: a Chapecoense é a única da 1ª divisão.

  As três torcidas continuam apontando pro estádio que saiu (`dados/torcidas.js`). A lista de
  estádios do jogo 2D (`dados/estadios.js` e o `estadio` de cada clube) não foi mexida.
- **`temPraia`** é chave nova, ao lado de `temMetro`. Vale `true` pras 11 praças do litoral:
  Litoral Catarinense, Fortaleza, Alagoas, Maranhão, Paraíba, Recife, Rio de Janeiro, Rio
  Grande do Norte, Bahia, Santos e Sergipe. Belém, Manaus e Porto Alegre ficaram sem praia,
  porque a água delas é rio ou lagoa, não mar aberto.

A fonte diz que veio dos `.asset` da Unity. Lá as mudanças ainda precisam ser feitas.

**O gerador.** `gerarProposta(P, cfg, opc)` (`proposta.js`) recebe o mapa em `cfg`, que é um
de `MAPAS.pequeno`, `MAPAS.medio` e `MAPAS.grande`. Em `opc` vai o que a praça decide:

- `estadios`: quantos estádios ela tem;
- `metro: false`, que tira o metrô.

O que era constante do mapa grande (a grade, os equipamentos, o metrô, os condomínios, os
terrenos, as quadras partidas e juntadas, as favelas) virou campo da config. Cada mapa tem o
que a praça mais exigente do porte pede:

| | estádios | espaços de sede (grande + pequeno) | bares | favelas (casas) | metrô |
|---|---|---|---|---|---|
| pequeno | 2 | 4 + 1 | 8 | 3: a de hoje 229, oeste 279, norte 174 | não |
| médio | 3 | 6 + 1 | 12 | 4: noroeste 504, sudoeste 394, sul 309, norte 477 | sim |
| grande | 4 | 8 + 1 | 18 | 5: noroeste 545, sudoeste 397, sul 309, norte 388, alto 185 | sim |

O máximo de cada porte, tirado dos dados:

- pequenas: 8 bairros, até 5 torcidas, 2 estádios e 3 bairros de favela;
- médias: 12 bairros, até 7 torcidas (Interior de SP), 3 estádios e 4 bairros de favela;
- grandes: 16 bairros, até 8 torcidas, 4 estádios (São Paulo) e 5 bairros de favela
  (Fortaleza).

O bar segue o número de bairros (8 e 12). O grande continua com os 18 de antes.

**As vagas de estádio.** O estádio de hoje é a primeira vaga de todo mapa. As outras são
blocos de 2 × 3 quadras, sem as ruas do meio, com a cópia do quarteirão do estádio. A praça
ocupa as vagas na ordem:

- no pequeno, a cópia vai pro sul, abaixo da 1,10 e do campo da 2,10 (colunas 1 e 2, fileiras
  11 a 13);
- no médio e no grande, a primeira cópia vai pro sudoeste (a do Estádio Municipal) e a segunda
  pro noroeste (seis quadras das colunas −2 e −1, fileiras −1 a 1);
- o grande tem uma quarta, no oeste (colunas −5 e −4, fileiras 6 a 8), só pra São Paulo.

A vaga que a praça não usa volta a ser quadra de casa, se cai na grade, ou mato, se está fora
dela. O nome de cada vaga é o estádio da praça, na ordem de `estadios` em `dados/cidades.js`:
o primeiro fica no estádio de hoje. Em São Paulo, o Morumbi fica no lugar de hoje, a Neo
Química Arena no sudoeste, o Allianz Parque no noroeste e o Canindé no oeste. Cada cópia abre
em 3D com o mesmo modelo do estádio, e a ficha diz "Nº de N estádios".

**O mapa pequeno** é a cidade de hoje, sem quadra nova, com isto a mais:

- **A cópia do estádio**, no sul.
- **Três terrenos de sede** tirados de quadras de hoje, na ponta sem casa de avenida:
  - a 1,6, no oeste, perto do Atacadex;
  - a 2,1, no norte, entre as duas favelas;
  - a ponta leste da 3,4, no meio.

  O terreno toma até 430 da ponta da quadra. Os lotes debaixo dele saem, e o que foi cortado
  no meio fica aparado, se sobrar pelo menos 56. A quadra de hoje não é alterada: o que muda
  vai em `lotesTirados` e `lotesExtra`, senão a mudança vazava pros outros mapas. Com as duas
  sedes de hoje, são 5 espaços.
- **Oito bares** pequenos da torcida, postos como na proposta. Os dois bares grandes de hoje
  viram casa.
- **Duas favelas novas** na grade da cidade:
  - a do oeste, entre o Atacadex e a estrada sul;
  - a do norte, acima da 2,1 e da 3,1.

  Com a de hoje, que fica, são três. A favela nova não pisa no Atacadex nem na favela de hoje:
  os dois entram na `barra`.

O pequeno não tem metrô nem equipamento novo, e o Atacadex fica onde está.

**O mapa médio** é a expansão cortada no meio. A cidade cresce três colunas pra oeste (−2 a 0)
e duas linhas pro norte (−1 e 0). Fica sem as colunas −4 e −3 e sem as linhas −3 e −2 do
grande. Tem:

- 5 terrenos (5,0; 2,0; 0,4; −2,5; 0,9), que com as 2 sedes de hoje dão 7 espaços;
- 12 bares;
- o metrô com as mesmas duas estações;
- o Shopping Poente, o 2º Distrito Policial, a Praça da Vila, a igreja, dois condomínios, o
  Atacadex na estrada norte e os dois pórticos.

A favela do noroeste começou com o traço do grande, mas no médio as colunas dela não existem,
e ela ficou solta no mato, encostada na cidade só por um canto. Ganhou um traço próprio
(`FAVELA_NOROESTE_MEDIO`), colado na rua oeste da coluna −2: a coluna −3 das fileiras −1 a 4 e
a −4 no alto. Com o primeiro traço (as colunas −3 e −4 inteiras) saíam 765 casas, mais que a
do grande. O traço foi afinado pra 504. A do norte (`FAVELA_NORTE_MEDIO`) desce até a linha −1.
A do sudoeste e a do sul são as do grande.

**O mapa grande** é a proposta de antes com duas coisas a mais:

- a quarta vaga de estádio;
- a **Favela do Alto** (185 casas), acima da −1,−2 e da 0,−2, porque Fortaleza tem cinco
  bairros de favela e o grande tinha quatro favelas. O leste não tinha lugar: é o Atacadex e a
  praia.

Com 2 estádios, o grande sai igual à proposta do commit anterior, conferido chave a chave. Só
mudam a lista de favelas (entrou a quinta) e a contagem.

**A página.**

- **As abas.** São Pequeno, Médio, Grande e Jogo hoje. Escolher a praça abre o mapa do porte
  dela, e as outras abas servem pra comparar. O seletor de cidade é agrupado por porte.
- **A variante.** Cada combinação de mapa, número de estádios e metrô sai do gerador uma vez
  e fica guardada.
- **A praia.** Se a praça não tem praia (`temPraia`), depois da avenida da beira vem mato: sem
  areia, sem orla e sem mar. O "Jogo hoje" continua sendo a planta do jogo como está.
- **As notas.** O painel mostra:
  - estádios ocupados de quantas vagas, sedes, bares e casas na favela;
  - a lista dos estádios da praça, e o que não cabe;
  - se a praça tem praia e metrô;
  - as casas por favela;
  - a tabela dos três mapas, com o da praça marcado.
- **A troca.** O que estava selecionado do mapa anterior sai quando o mapa troca.

**A conferência.** `conferir_cidades.mjs` confere cada praça contra os três mapas e o "Jogo
hoje". A capacidade de cada mapa é tirada do próprio mapa, com todas as vagas ocupadas. Se
alguma praça não cabe no mapa do porte dela, o teste sai com erro. Hoje, as 30 cabem:

| porte | praças | cabem no mapa do porte |
|---|---|---|
| pequeno | 7 | 7 |
| médio | 18 | 18 |
| grande | 5 | 5 |

**O que isto NÃO faz.** O jogo continua com um mapa só. Os três mapas existem na planta
(`proposta.js` e o artefato); levar pro jogo 2D e pra cena 3D é outro trabalho. São Paulo
continua com `temMetro: false`, e por isso a praça tem vaga de metrô no mapa grande mas fica
sem as estações. Pelo jeito, é erro de dado.


### 4.39. A lagoa, a favela do noroeste na grade e o escudo de verdade na sede

O dono revisou a 4.38 e pediu cinco coisas:

- trocar a Arena Condá pela Arena Joinville;
- corrigir o metrô de São Paulo;
- pôr uma lagoa em Belém, Manaus e Porto Alegre;
- deixar a favela do noroeste do mapa pequeno reta, na grade;
- usar na sede os escudos PNG que o jogo já tem.

Os estádios vão ser trocados pelos três modelos padrão do jogo, que ele ainda vai apontar. Levar os mapas pro jogo fica pra quando o planejamento e a modelagem estiverem fechados.

**Os dados** (na fonte, e `dados/cidades.js` gerado de novo):

- **Interior de SC** fica com o Heriberto Hulse e a Arena Condá. Sai a Arena Joinville. Agora é a União Tricolor (Joinville) que aponta pra um estádio que não está na praça.
- **São Paulo** passa a `temMetro: true`, e o mapa grande dela ganha as duas estações.
- **`temLagoa`** é chave nova, ao lado de `temPraia`. Vale `true` em Belém, Manaus e Porto Alegre, e o importador passa ela adiante.

**A lagoa** (`desenharLagoa` em `index.html`). Nas três praças, o lugar da praia e do mar é uma lagoa comprida ao longo da avenida da beira:

- **A forma.** A outra margem fica à vista, a 1.100–1.900 unidades da costa, e as duas pontas são arredondadas: a do norte perto de y −2.350, a do sul perto de 6.250.
- **A beira.** A margem é de capim, com uma faixa de barro na linha d'água e um raso mais claro por dentro. A linha da margem ondula (soma de senos), pra não sair paralela à costa.
- **Os detalhes.**
  - junco em tufos dos dois lados;
  - aguapé boiando no raso do lado da cidade, com uma ou outra flor lilás;
  - um trapiche de madeira no meio da cidade (y 1.520), com a canoa amarrada;
  - uma ilhota com quatro árvores;
  - a mata na margem de lá.

É desenho fixo (seno e hash, sem sorteio), montado uma vez e guardado. Vale nos três mapas. O "Jogo hoje" continua com a praia do jogo, pra todas as praças.

**A favela do noroeste do mapa pequeno.** O pequeno ficava com a favela de hoje, a da planta do jogo. Ela é torta: as casas giradas uns 17°, acompanhando a estrada noroeste2. Agora o pequeno não guarda mais a favela de hoje (`favelaDeHoje: false`). No lugar dela entra uma favela da grade (`FAVELAS_PEQUENO`, `noroeste`), com o mesmo gerador das outras:

- ocupa a coluna 1 das fileiras 0 a 3 e um pedaço da coluna 0 (x −150 a 880, y 60 a 2.110);
- a casa fica a 0°, e o beco é a continuação da rua da cidade;
- tem 223 casas, contra 229 da de hoje.

A estrada noroeste2 continua passando no meio, como passa hoje. As casas de beira dessa estrada continuam acompanhando ela: não são da favela. A do oeste e a do norte saíram iguais (279 e 174). Os três mapas agora têm só favela da grade. A opção `favelaDeHoje` continua no gerador, sem uso.

**O escudo de verdade na sede.** A sede nova (`js/diajogo/sede3d.js`) pintava o escudo gerado: a bola na cor da torcida com a sigla, e a diagonal nas duas cores do clube. A sede antiga da cena já usava o PNG (a seção 4, "O escudo é o do jogo, e vira o PNG quando ele existir"). A nova agora segue a mesma regra:

- **O caminho.** Quem monta a sede resolve o caminho pelo manifesto `dados/escudos.js` (`caminhoDoEscudo`, a mesma da planta). O caminho é `img/escudos/torcida-<id>.png` e `clube-<clubeId>.png`, e passa antes pelo `window.__EMBUTIDOS`, como o `IMG()` do jogo.
- **O decalque.** A sede recebe o caminho em `torcida.escudo` e `torcida.escudoClube` e põe no `img` dos quatro decalques de escudo: os dois da fachada e um em cada parede do lado.
- **A textura.** `texturaEscudo` pinta o gerado. Quando o PNG carrega, repinta o quadrado com ele, na proporção e centrado (o jeito do `bairro3d`). Sem o PNG, fica o gerado. É o caso da Mancha Negra e do São Raimundo, que não têm arquivo.
- **Onde vale.** Vale pra sede de cada espaço (a torcida da praça) e pra sede do jogo na aba "Jogo hoje" (a da Jovem Fla e a da Jovem do Grêmio).
- **A ficha.** A ficha da sede mostra os dois escudos.

**Os PNG no artefato.** São 278 arquivos, e o artefato tem teto de 255. O `montar.sh` embute num arquivo só (`dados/escudos_embutidos.js`, que preenche `window.__EMBUTIDOS`) os escudos das torcidas dos dados e dos clubes delas: 246 PNG, 2,0 MB. A página carrega o manifesto e, se existir, o embutido. Sem ele, o caminho vai direto pra `img/escudos/`.

**O teste.** O gancho `?teste` da página agora também entrega a `vista` (a câmera do 3D). Com ela, o teste põe a câmera de frente pros escudos da fachada. Conferido na tela:

- a sede da Jovem Fla, com o escudo dela e o do Flamengo;
- a da União Fanática, com o dela e o do União Rondonópolis;
- nenhum erro de console;
- as 30 praças nas quatro abas;
- a viagem de metrô;
- `conferir_sede` e `conferir_cidades` passando.


### 4.40. A vegetação em volta da cidade, pela região

O dono pediu que o mato claro em volta do mapa fique só nas praças do Nordeste. Nas outras regiões, o mato vira verde, com cara de floresta.

- **No Nordeste** (dez praças: Fortaleza, Recife, Bahia, Alagoas, Maranhão, Paraíba, Rio Grande do Norte, Sergipe, Interior de PE e Interior do CE), fica o mato claro e seco de antes (`COR.mato`), com as moitas e as trilhas.
- **Nas outras vinte**, a volta da cidade é mata (`padraoMata` em `index.html`). É a copa das árvores vista de cima:
  - num ladrilho de 2.400 unidades (124 m) que se repete sem emenda;
  - cada copa tem de 3 a 8 m de diâmetro, em sete tons de verde;
  - a sombra vai pro sudeste e o brilho pro noroeste (o sol do mapa), e as copas de baixo cobrem as de cima;
  - a copa que passa da borda do ladrilho dá a volta e aparece do outro lado.

  É desenho fixo (semente própria), feito uma vez e preso no mundo: anda com o mapa e cresce com o zoom. As trilhas de terra continuam por cima. As moitas soltas do mato claro não entram, porque na mata elas sumiam na copa.
- **O "Jogo hoje"** continua com o mato do jogo em todas as praças, como a praia.

A regra é a região da praça (`regiao` em `dados/cidades.js`); sem o dado, fica o mato claro. As notas da praça dizem qual das duas vale.


### 4.41. A praia de verdade: calçadão, quiosque, guarda-sol, barraca e onda

O dono pediu mais detalhe na praia das praças do litoral: quiosque, barraca, guarda-sol, onda e o resto. Como a lagoa (4.39), é desenho do mapa (`montarPraia` e `desenharPraia` em `index.html`). Vale nos três mapas e nas onze praças com `temPraia`. O "Jogo hoje" fica com a praia lisa do jogo.

A faixa de areia continua a da planta: 12,5 m (243 unidades) entre a avenida da beira e a linha d'água. Cada coisa fica a uma distância dessa linha, medida na horizontal, como a própria faixa. O que é girado (quiosque, quadra, barraca, canga, posto, barco) segue o rumo da costa naquela altura. Da avenida pro mar:

- **O calçadão**: os 2 m de cima da areia, em pedra portuguesa clara, com a onda preta no meio, a de Copacabana.
- **Os coqueiros**: na beira do calçadão, a cada 11 a 18 m, com a sombra e as oito folhas em leque.
- **Os quiosques**: a cada 50 a 70 m.
  - O deck de madeira (5,8 × 4,4 m, com as tábuas).
  - Três mesinhas com guarda-sol vermelho e branco, pro lado do mar.
  - O quiosque de telhado de quatro águas, pro lado do calçadão.
- **A areia**:
  - guarda-sol em grupinhos, de 1,8 a 2,4 m, em oito pares de cores, com a sombra;
  - canga do lado de seis em cada dez, fora da areia molhada;
  - uma barraca de lona de duas águas aqui e ali;
  - o posto de salva-vidas a cada 80 a 100 m (a cabine vermelha, o telhado branco e a bandeira vermelha e amarela);
  - duas quadras de vôlei por praia (9 × 4,7 m, com a rede e os postes), ao longo da areia.

  O guarda-sol não entra no deck do quiosque, na quadra nem no posto.
- **A beira d'água**: a areia molhada (2 m mais escura) e a espuma, uma linha branca que ondula.
- **O mar**:
  - o raso em três faixas, do turquesa ao azul de sempre;
  - quatro linhas de crista em pedaços, cada vez mais fracas pro fundo;
  - oito barcos: a jangada de vela e o barco de pesca com a esteira.

O calçadão, os coqueiros, os quiosques, o guarda-sol, a barraca, o posto e a quadra vão só onde a avenida da beira passa. Pra lá dela, a praia é deserta: só areia, onda e espuma. A onda, o raso e os barcos vão na costa inteira.

É desenho fixo (hash, sem sorteio), montado uma vez por trecho de avenida e desenhado só no que está na tela. De longe, a praia vira uma faixa colorida com o calçadão; de perto, cada guarda-sol tem os gomos, cada quiosque as mesinhas.


### 4.42. A vegetação é da praça: mata, cerrado ou caatinga

O dono refez a regra da 4.40:

- o Centro-Oeste é **cerrado**;
- o Maranhão é **mata verde**;
- só o Interior do CE e o Interior de PE ficam com o **mato seco**;
- o resto do Nordeste também é verde.

A regra deixou de ser a região. Agora é um dado da praça, `vegetacao`, na fonte (`dados/fonte/cidades_bairros.json`, ao lado de `temPraia` e `temLagoa`), passado pelo importador pra `dados/cidades.js`:

| `vegetacao` | praças |
|---|---|
| `mata` | as outras 25 |
| `cerrado` | Brasília, Goiânia e Mato Grosso |
| `caatinga` | Interior do CE e Interior de PE |

Sem o dado, a planta fica com o mato seco de antes. As notas da praça dizem qual vale.

**O cerrado** (`padraoCerrado` em `index.html`) é o mesmo tipo de ladrilho da mata (2.400 unidades, sem emenda, semente própria). Tem, de baixo pra cima:

- o capim amarelado, com manchas mais secas (douradas) e mais verdes, de borda macia (degradê);
- a terra vermelha aparecendo, em manchas de três ou quatro pedaços;
- o fiapo do capim;
- o cupinzeiro;
- o arbusto;
- a árvore baixa e espaçada, de copa em três ou quatro bolas, com a sombra pro sudeste.

Na mata e no cerrado, as moitas soltas do mato seco não entram, porque o ladrilho já tem a planta dele. As trilhas continuam nas três. O "Jogo hoje" continua com o mato do jogo.


### 4.43. Os modelos 3D da praia e as árvores de todos os mapas

O dono pediu duas coisas:

- cada detalhe da praia (4.41) modelado em 3D, pra entrar no mapa depois;
- as árvores que vão em todos os mapas do jogo.

**Nada disso entrou no mapa ainda.** Fica numa aba nova da planta, **Modelos 3D** (o botão ao lado das abas). A aba lista cada peça e abre ela grande no 3D, com a ficha: planta, altura, triângulos e semente, e o botão "Outra semente".

**As peças da praia** ficam em `js/diajogo/praia3d.js`: `PECAS_PRAIA` é o catálogo e `montarPecaDaPraia(id, onde, destino, semente)` monta. São onze:

| peça | planta × altura | o que tem |
|---|---|---|
| guarda-sol | 2,4 × 3,5 × 2,3 m | oito gomos de tecido em duas cores, o babado recortado, as varetas e os tirantes; duas cadeiras de alumínio de lona listrada, a canga, o isopor e a prancha (fincada ou deitada) |
| mesa com guarda-sol | 2,0 × 2,1 × 2,3 m | a mesa de plástico da cervejaria (o tampo PRAIANA), o guarda-sol que atravessa o tampo e quatro cadeiras de plástico, cada uma meio torta |
| barraca | 3,3 × 3,3 × 2,8 m | a lona de duas águas, com a cumeeira ao comprido, como no 2D, nos seis paus; o babado com o nome (decalque) e, embaixo, a mesa, as cadeiras, os isopores, a pilha de cadeira e o coco |
| posto de guarda-vidas | 3,0 × 3,5 × 5,4 m | as pernas com o X, o tablado a 1,9 m, a cabine vermelha (janela nos três lados, porta atrás), o telhado branco, o guarda-corpo, a escada, a bandeira vermelha e amarela batendo, a boia, a prancha de resgate, GUARDA-VIDAS e o número (decalques) |
| quadra de vôlei | 16 × 12 × 3,2 m | a quadra oficial de 16 × 8 m em fita azul, os postes com a espuma e os estais, a rede de 1 m (em cima a 2,43 m) com a faixa branca, as antenas listradas e a bola |
| quiosque de palha | 7,2 × 6,5 × 4,1 m | o deck com o degrau, o corpo de tábua pintada (a janela do balcão mostra a prateleira de garrafa lá dentro), o balcão de azulejo com as banquetas, o freezer SORVETES, a geladeira GELADINHA, a pilha de coco, o telhado de palha de beirada grossa nos esteios de tronco, a placa do nome, o cavalete do cardápio e as três mesas de guarda-sol |
| quiosque da orla | 7,2 × 6,4 × 3,4 m | o mesmo deck e a mesma frente, mas de metal: a chapa branca, a janela de vidro, a laje fina de beiral largo nas colunas e o letreiro em cima |
| calçadão | 18 × 13 × 12 m | 12 m de pedra portuguesa (a onda preta e branca corre ao longo da praia), o meio-fio e um pedaço da avenida, a areia com dois coqueiros, o chuveirão, a lixeira laranja no poste, o banco virado pro mar e o poste da orla |
| beira do mar e onda | 16 × 15 × 1,5 m | a areia seca e a molhada, a espuma na linha d'água e a renda atrás, o raso em faixas do turquesa ao azul, a espuma da onda que já quebrou e a onda quebrando: crista branca e lábio caindo no meio, ombro baixo nas pontas |
| jangada | 6,8 × 1,7 × 6,3 m | os seis paus que se juntam e levantam na proa, as travessas, os dois bancos, o mastro, a retranca, a vela triangular de valuma curva, enfunada, com o remendo e o 27, o leme e o isopor |
| barco de pesca | 7,7 × 2,6 × 3,6 m | o casco de seções (branco de faixa azul, com a antivegetativa vermelha na linha d'água), o forro e o fundo por dentro, a borda azul, a casaria branca de teto azul, o mastro, o cano de descarga, a tampa do porão, os pneus velhos de defensa e o nome na popa e na proa |

O TAMANHO É O DE VERDADE. O 2D desenha duas peças menores, como símbolo: a quadra com 9 × 4,7 m e a jangada com 3 m. Quem puser a peça no mapa acerta o lugar dela. A esteira do barco, que o 2D desenha, não virou modelo: é efeito do barco andando.

A SEMENTE troca o que muda de uma praia pra outra:

- a cor do guarda-sol, da lona e da tábua;
- o nome do quiosque, da barraca e do barco, e o número do posto;
- a canga;
- o que está solto na areia;
- o jeito de cada cadeira.

**Como são feitas.** Cada peça é montada em metros em volta da origem, com o chão em y = 0 e a frente pro +z: o lado do mar no quiosque, o lado da areia na beira do mar. `noMundo`, novo no `construtor3d.js`, põe a peça no lugar, girada e na escala. As peças usam:

- `Lugar`: um referencial girado dentro da peça, com o qual a cadeira gira em volta da mesa;
- `bloco`: a caixa num lugar girado;
- `barra`, `tubo`, `cilindro` e `toro` (a boia e o pneu);
- `fita` (a lona da cadeira) e `malha` (a canga e a bandeira);
- `paralelepipedo` (o encosto e o leme);
- a vela, o casco e a onda feitos à mão, ponto a ponto.

As listas:

- `praia`: a folha nova `praia.jpg`, com 29 peças;
- `equip`: a pedra portuguesa, a areia e o concreto;
- `vegetacao`: o coco;
- `rede`: a rede do vôlei.

A rede usa a folha da vegetação, mas é **transparente de verdade, não recortada**. A malha de corda fina, na média do mipmap, fica abaixo de qualquer limiar: recortada, ela some de longe (com 0,45) ou vira uma faixa preta (com 0,08). O jogo tem de lembrar disso quando fizer o material dela.

O texto que muda é decalque: `letreiro`, `logo` e um tipo novo, `pintado`, que é só a letra, sem placa em volta (o nome do barco).

**As árvores** ficam em `js/diajogo/arvores3d.js`: `ESPECIES` é o catálogo, `FLORA` diz o que vai em cada lugar (o peso é o do sorteio) e `montarArvore(especie, onde, destino, semente)` monta. `especieDe(lugar, rnd)` sorteia uma espécie do lugar. São dezoito espécies:

| lugar | espécies (peso) |
|---|---|
| mata | jequitibá 1, ingá 4, embaúba 2, açaí 2 |
| cerrado | pequizeiro 5, ipê-amarelo 1, buriti 1 |
| caatinga | catingueira 5, juazeiro 2, mandacaru 2, xique-xique 2 |
| cidade | oiti 5, mangueira 2, ipê-amarelo 1, ipê-roxo 1, palmeira-imperial 1 |
| praia | coqueiro 4, amendoeira 1 |
| sul | araucária 3, ingá 2 |

Como cada árvore é feita:

- **O tronco e o galho** são um tubo varrido ao longo da curva (`varrer`), com a casca da espécie. A peça inteira se repete a cada tanto de comprimento, e o anel é levado de um ponto ao outro sem torcer.
- **A copa** é de cachos. Cada cacho tem quatro cartões recortados: três em pé, girados de 60°, e um deitado, pra copa não sumir vista de cima. Os cachos ficam numa casca em espiral (Fibonacci) mais três no miolo de cima, pra não abrir buraco. A normal do cartão sai do centro da copa, puxada pra cima, e não de onde o cartão olha. Assim a copa pega luz como um volume: o lado do sol claro, o de trás escuro. A sombra de baixo e do miolo vem pintada na cor do vértice.
- **A palmeira** tem a fronde: uma fita de corte em V que cai com o peso, com o desenho deitado nela.
- **O cacto** é uma coluna de oito lados, com a pele de costela.
- **A sombra** no chão é recortada (`customDepthMaterial` com o mapa e o limiar).

A semente dá outro galho, outra copa e outro tamanho (±12%): uma mata de cem árvores sai com cem árvores diferentes.

A folha nova, `vegetacao.png` (2048 × 800, com alfa, 29 peças), tem:

- o cacho de cada espécie;
- a flor dos dois ipês e o galho seco;
- a folha de mão da embaúba, verde de um lado e prateada do outro;
- as três frondes, o leque do buriti, a saia seca e o tufo da araucária;
- as oito cascas, o cacto, o palmito, o coco e a rede.

O desenho foi pintado no dobro e reduzido com o alfa pré-multiplicado, e a cor foi "sangrada" pra fora do recorte, senão o mipmap faz franja escura. O folíolo da fronde é um fuso largo, não uma linha: a linha fina sumia de longe.

As duas folhas saem do pintor:

    python3 ferramentas/pintar_modelos.py praia vegetacao

**O que a página ganhou:**

- o material `folhagem`: só a face da frente (o cartão vem nas duas, cada uma com a normal de fora), recorte a 0,45 e `alphaToCoverage`;
- o material `rede`, transparente;
- a sombra recortada da folhagem, da vegetação, da grade e da rede;
- a normal que vem no bloco, quando todos trazem a deles.

Custo, em triângulos:

| peça | triângulos |
|---|---|
| árvore | de 400 (embaúba) a 3.700 (a touceira de açaí) |
| quiosque | ~4.000 |
| calçadão (com dois coqueiros) | ~4.500 |
| guarda-sol, mesa, posto, quadra, barco, beira | 700 a 900 |

**O que ficou aberto:**

1. **Nada entrou no mapa.** O próximo passo é decidir onde vai cada peça e quantas árvores por hectare.
2. **A mata não cabe como está.** Mil árvores dão de 1 a 2 milhões de triângulos. Ela vai precisar de instância (a mesma árvore copiada, `InstancedMesh`, umas oito variantes por espécie) e de nível de detalhe (de longe, dois cartões cruzados com a foto da árvore).
3. **O cartão recortado afina de muito longe**, porque o mipmap come a borda. Já foi atenuado (a cor sangrada, o folíolo largo, `alphaToCoverage`), mas não resolvido.
4. **A beira do mar é uma peça parada**, de 16 m, pra repetir ao longo da costa. O mar do jogo, com a onda andando, é outra coisa (animação ou shader).
5. **As 25 praças de mata dividem a mesma mata.** A `FLORA` não separa a Mata Atlântica da Amazônia: o açaí aparece em todas.


### 4.44. As dez árvores low poly

O dono pediu uma variedade de dez árvores low poly. Elas são a outra família de árvore do jogo, em `js/diajogo/arvores_lowpoly.js`:

- `ESPECIES_LP` é o catálogo;
- `FLORA_LP` diz o que vai em cada lugar;
- `montarArvoreLowpoly(especie, onde, destino, semente)` monta uma;
- `especieLowpolyDe(lugar, rnd)` sorteia uma espécie do lugar;
- `montarAsDez` põe as dez juntas, pra comparar.

A de cartão (4.43) continua lá. Nada disso entrou no mapa ainda. Na aba Modelos 3D, as low poly vêm primeiro, e o catálogo abre em **As dez juntas**: as altas atrás, as baixas na frente, desencontradas, com a câmera de frente.

| lugar | espécies (peso) |
|---|---|
| cidade | oiti 5, mangueira 2, ipê 2 |
| mata | ingá 4, jequitibá 1, ipê 1 |
| cerrado | pequizeiro 5, ipê 2 |
| caatinga | catingueira 5, mandacaru 3 |
| praia | coqueiro 1 |
| sul | araucária 3, ingá 2 |

O ipê é um só; a semente dá a cor. Em mil sementes saíram 42% amarelo, 32% roxo, 16% rosa e 10% branco.

**Como é feita.** Sem textura e sem recorte:

- **A copa** é um sólido facetado: bolas de 80 faces (o icosaedro dividido uma vez). Cada vértice é mexido até 14% do raio, com a mesma mexida pro vértice que as faces dividem, senão abre fresta. O fundo às vezes sai chato, e as faces de baixo, mais escuras (a sombra de dentro da copa). Uma copa são de três a seis bolas: a do meio e as das pontas dos galhos.
- **O tronco e o galho** são prismas de três a sete lados, dobrados na curva, com o anel levado de um ponto ao outro sem torcer. Fecham na ponta.
- **A cor** é chapada, uma por face (no prisma, uma por quadrado), com um tremor de ±7% de face pra face. É o que dá o jeito de low poly.
- **As formas próprias:**
  - a folha do coqueiro é uma fita dobrada em V, com a borda em serra;
  - o tufo da araucária é um prato (a lente de seis lados);
  - o mandacaru é a coluna de cinco costelas, com a ponta redonda;
  - a catingueira é só galho, dividido três vezes;
  - a sapopema do jequitibá são cinco aletas;
  - o ipê tem o tapete de flor no chão, a mangueira a manga na beira da copa, e o coqueiro o cacho de coco.

Tudo sai numa lista só, `lowpoly`, com a posição e a cor de cada face; a UV vai zerada. O material é o de cor de vértice, sem mapa, com `flatShading`. A semente dá outro galho, outra copa, outro tamanho (±12%) e outro tom.

**Custo.** De 280 a 690 triângulos por árvore (vinte sementes de cada), e 5.100 as dez juntas. A de cartão tem de 400 a 3.700. Mil árvores low poly dão uns 500 mil triângulos, e com instância (a mesma árvore copiada) ficam ainda mais baratas.

**O que ficou aberto:**

1. **Nada entrou no mapa.**
2. **A escolha das dez é minha.** Cobre os seis lugares com a silhueta mais diferente possível. Faltam, se precisar, o juazeiro, o buriti, a palmeira-imperial, a amendoeira, a embaúba e o açaí.
3. **O estilo não é o dos prédios.** A árvore low poly é de cor chapada, e os prédios e as casas têm textura. Com a mesma luz e a mesma sombra a mistura funciona, mas é uma decisão de estilo: ou a cidade inteira vai pro low poly, ou a árvore fica sendo a exceção.


### 4.16. Dois bugs que a sede menor desenterrou

Encolher a fatia da sede mexeu no `rng()` compartilhado, e a cidade
inteira andou. Duas coisas que estavam erradas desde antes apareceram:

1. **Árvore com a copa no asfalto.** O sorteio de árvore do quarteirão
   testava avenida, fatia de equipamento e lote — mas **não a rua da
   grade**. Numa QUINA de quarteirão o tronco fica na calçada de uma
   face e a copa alcança o asfalto da outra. E o laço de árvore da
   FAVELA não testava asfalto nenhum. Os dois ganharam
   `tocaAsfalto(x, y, r + 2)`. Na favela o raio é sorteado ANTES do
   teste de propósito: `entreFav` continua sendo chamado nas mesmas
   voltas, então a favela sai igual — o que muda é só a árvore não
   nascer.

2. **A favela caiu de 262 pra 231 casas.** A reparação de ilha passou a
   tirar mais casas porque as casas de beira de estrada, que entram na
   camada-base dela, tinham andado. Havia dois caminhos: baixar a
   frente da casa (devolvia 264, mas a 2,14 m — justamente o que o dono
   reclamou antes) ou apertar a quadra. O beco saiu de varredura:
   30–38 devolve 262 mas deixa 30 células presas (a reparação empaca
   num bolsão que nenhuma remoção única abre), 31–39 zera as presas mas
   cai pra 248, e **32–42 dá 260 casas com 25.384 de 25.384
   alcançáveis**. Ficou o 32–42.

### 4.13. Faixa de pedestre e semáforo, nos cruzamentos da avenida

O dono mandou a foto de um cruzamento de verdade e pediu faixa nos
cruzamentos das avenidas, com semáforo nos principais. A cidade já tinha
faixa de pedestre — nos três portões do estádio e onde a avenida do
norte chega —, mas eram quatro pontos fixos, escritos na mão. O que
faltava era achar os cruzamentos que a planta gera sozinha.

**Achando o cruzamento.** A avenida é uma sequência de segmentos retos;
a rua da grade é sempre ortogonal, em bandas de x (`COLUNAS`) e de y
(`LINHAS`). O cruzamento é o ponto de cada segmento onde ele atravessa
uma dessas bandas — resolver `x = col.c` ou `y = lin.c` no segmento. O
que decide se é cruzamento DE VERDADE, e não a avenida cortando um
trecho de mato sem rua nenhuma ali, é `naRua()`: a mesma régua que a
máscara usa pra saber se um corpo pode virar a esquina. `CRUZAMENTOS`
sai pronto na planta, pra pintor e 3D lerem o mesmo ponto.

**A LISTRA CORRE NO SENTIDO DO CARRO.** A primeira versão saiu girada
90°: listra atravessada na pista, repetindo ao longo dela — que é o
desenho de uma lombada, não de uma faixa. Quem atravessa uma faixa de
verdade pisa numa listra de cada vez, então a listra é comprida no
sentido em que o carro anda e se repete de uma guia à outra. (As faixas
dos portões do estádio, essas, já estavam certas desde sempre; só a
nova nasceu errada.)

**SÃO QUATRO, UMA POR PERNA.** Tinta por cima do meio do cruzamento não
é faixa. O padrão é o anel: as duas pernas da avenida e as duas da rua,
cada uma encostada na SAÍDA do cruzamento. Foram 46 faixas em 12
cruzamentos — 46 e não 48 porque duas pernas não existem (a avenida
acaba ali).

O retângulo de cada faixa sai pronto da PLANTA (`FAIXAS`: centro,
ângulo, largura de pista, profundidade e a retenção), não do pintor.
Assim dá pra auditar a tinta como se audita casa — contando pares que
se tocam e quinas fora do asfalto —, e não olhando screenshot.

**Onde a perna começa, e por que a conta não é "metade da largura".** A
avenida é DIAGONAL. Andando pela rua a partir do centro do cruzamento,
o quanto se anda até sair do asfalto da avenida é `a/proj` — a
meia-largura da avenida dividida pela projeção de um sentido na normal
do outro. Num cruzamento a 57° isso dá quase o dobro da meia-largura:
encostar a faixa "na largura da avenida" deixava ela DENTRO do
cruzamento. A projeção é a mesma nos dois sentidos (|v·nu| = |u·nv|),
então uma conta só serve pras quatro pernas.

**A perna só nasce se as QUATRO QUINAS estiverem no asfalto.** Testar
só o centro não bastava, e testar o meio das bordas também não: a ponta
da avenida do norte é uma CALOTA (o traço da avenida tem `lineCap`
redondo, e `distAvenida` trunca o `t`), então o meio da borda ainda
caía no asfalto enquanto as quinas já estavam de fora — a faixa
sobrava pra fora do fim da avenida. Com as quatro quinas, zero faixa
fora do asfalto (medido).

**UMA FAIXA NÃO ENCOSTA NA OUTRA.** Recuar pela conta acima põe cada
faixa fora do cruzamento, mas não garante que ela fique fora das
OUTRAS: na quina AGUDA (57° de um lado, 123° do outro) a faixa da rua
e a da avenida saem por direções que ainda se cruzam, e os retângulos
se tocam. O mecanismo é o que um projeto de rua faz de verdade —
RECUAR a faixa pra trás na própria perna, que é a única direção em que
ela continua fazendo sentido:

1. nasce quem cabe inteiro no asfalto;
2. enquanto duas se tocarem (com folga de 6), as duas andam pra trás
   de 6 em 6 na sua própria perna — como as pernas divergem, afastar
   funciona;
3. quem não tem pra onde ir (o passo a tiraria do asfalto) ou já andou
   140 para de andar;
4. o que ainda assim se tocar some, e some a da via mais ESTREITA, que
   é a regra da rua: quem cede é a via menor.

O teste de toque é o do **eixo separador (SAT)** entre dois retângulos
GIRADOS. Caixa alinhada aos eixos não serve aqui: a faixa da avenida
está a 57°, e a caixa dela alinhada é quase o dobro do retângulo de
verdade — acusaria toque onde não há.

**PROF 46 e folga 6 saíram de varredura, não de gosto.** Com os 56 de
profundidade e 10 de folga que eu tinha chutado, o mecanismo salvava 36
das 46 pernas: as outras 10 batiam no teto de recuo e eram apagadas.
Varrendo profundidade × folga × teto, 46/6/140 devolve as 46 com o teto
nem chegando a morder (o pior recuo para em 126), ou seja o afastamento
converge sozinho em vez de ser cortado. O preço é recuo: 4 faixas não
se mexeram, 24 andaram 1,1 m, 13 andaram 3,2 m, 4 andaram 4,3 m e 1
andou 5,4 m. Num cruzamento a 57° isso é o que a rua de verdade faz —
a faixa fica pra trás da esquina.

Medido no fim: **46 faixas, zero pares se tocando, menor folga 6,3,
zero quinas fora do asfalto.**

**A retenção** — a barra branca grossa onde o carro para — vem depois
da faixa, em meia largura de pista (a outra metade é a mão contrária,
que para do outro lado do cruzamento). Só nos cruzamentos com semáforo:
barra de parada em rua sem sinal nenhum é tinta que a prefeitura não
pintou.

**Quando a avenida passa numa esquina da grade** ela atravessa a COLUNA
e a LINHA quase no mesmo lugar, e a conta cospe dois pontos a poucas
dezenas um do outro. Não são dois cruzamentos: é um, de seis pernas, e
desenhar os dois dava dois anéis de faixa embolados. O raio de fusão é
200, generoso de propósito — ao longo da avenida dois cruzamentos do
mesmo tipo nunca ficam a menos de 550, porque a grade é larga —, e fica
o da rua mais larga. De 14 pontos crus sobram **12 cruzamentos**.

**O semáforo, só nos PRINCIPAIS.** Nem todo cruzamento leva poste: as
avenidas de entrada (`sudoeste` e `noroeste`, as que a torcida usa pra
chegar) marcam `principal: true`; os ramais curtos que só viram estrada
no mato e a beira-mar não. Dos 12 cruzamentos, 11 são principais e 10
ganharam poste — um ficou de fora porque não achou esquina livre de
asfalto (o próximo item explica por quê).

**O recuo do poste não é só `avLarg/2 + folga`.** No cruzamento, a rua
que corta a avenida TAMBÉM é asfalto — um recuo perpendicular à avenida
atravessa essa segunda faixa antes de sair dela, e a esquina de verdade
fica mais longe do centro do que a avenida sozinha sugere. A busca
cresce o recuo de 8 em 8 até `noAsfalto` desistir, com teto em 140: se
não limpou até lá, o cruzamento fica sem poste em vez de plantar um
dentro do asfalto.

O poste (`semaforo()`, em `bairro3d.js`) é o mastro do `poste()` de luz
mais alto, com um braço perpendicular à avenida estendendo até a metade
da pista e a cabeça na ponta, três focos empilhados na face que olha
pra quem chega. Entra na mesma malha `TS` dos postes e carros — nenhuma
chamada de desenho a mais.

**A pegadinha que custou uma hora, ainda vale.** `arredores.js` lê
`largura`, `altura` e `celula` **uma vez, na carga**, da cena padrão — e a
malha, a malha de corpo e a memória de rota nascem daquele tamanho. O
comentário do próprio módulo diz: "todas têm o mesmo tamanho de tela".
Trocar de cena não redimensiona nada. A saída, sem mexer no módulo:
**nesta página a cena padrão é o estádio** (`TO.dados.cenaArredores =
TO.dados.cenaEstadio`, antes de `arredores.js` subir). O jogo em
`index.html` não passa por aqui.

## 5. A vida da cena — o que o combate já fazia, e como foi ligado

- **O MOTOR DE LUTA ESTAVA DUAS VERSÕES ATRÁS.** Este branch saiu de um
  ponto antigo do repositório e ficou com um `combate.js` de 2.207
  linhas; o do branch `claude/game-html-news-feed-sndgh4` tem 3.997. O
  sintoma era mudo: `bonecos3.js` daqui já lia `d.ataque`, `d.defendendo`,
  `d.segurando`, `d.seguradoPor`, `d.socorrendo`, `d.esquivou`,
  `d.apanhou`, `d.inimigoPerto` e `d.linha` — as poses todas já estavam
  implementadas —, e o motor velho não escrevia NENHUM desses campos.
  Os bonecos sabiam brigar e nunca recebiam ordem.
  Vieram o `combate.js` e o `arredores.js` daquele branch (o motor novo
  chama `A.campoDoPonto` e `A.celulasDeDiscos`, que o antigo não tinha).
  O motor novo já traz o vetor de câmera e o `d.cor3` que eu tinha
  remendado aqui, então não houve remendo a reaplicar.
  As ações e as teclas são as do `ponte.js`: **Q** bate, **E** segurado
  defende (soltar na hora do golpe é o contragolpe), **F** agarra,
  **C** chama, **2** pedra, **3** bomba, **R** recua, **X** foge,
  **ENTER** manda entrar. As câmeras saíram de X/C/F/V, que viraram
  teclas de briga, e foram pra **Z/V/B/N/M**. O pad ganhou botão de
  SEGURAR, que a defesa precisa. A fila de formação sumiu: o motor novo
  tem uma formação só, o Quadrado, e ela não tem tecla.

Fora isso, o que muda é o que a página ENTREGA pro motor:

- **DUAS TORCIDAS DE VERDADE, não "mandante contra visitante".** A cena
  abria com `criarEstado({local, intencao, tensao, bombas, efetivoRival})`
  e mais nada: os dois lados nasciam genéricos, sem nome, sem ficha e sem
  cor, de camisa do lado. `index.html` nunca fez assim — ele passa
  **bondes** (lado, efetivo, as três cores e a marca `nossa`) e
  **escalação** (as fichas). Agora esta página faz o mesmo:
  - a **planta** escolhe as duas torcidas em `dados/torcidas.js`, com a
    semente dela: uma grande com rival no elenco, de preferência tricolor,
    e um rival de primária LONGE da nossa — duas torcidas de preto e branco
    na mesma briga viram uma só na tela. É a mesma escolha que pinta as
    sedes, então a camisa do boneco e a fachada da sede não têm como
    desencontrar (`CIDADE.TORCIDAS`);
  - a página monta **quatro bondes**, um por spawn (1º escalão, 2º escalão,
    setor visitante e retaguarda), com as três cores da torcida. Os dois
    bondes da mesma torcida trazem o MESMO nome, que é a chave da paleta
    em `bonecos3.js` — com nomes diferentes o segundo entraria como
    "torcida que repete a primária" e sairia de calção trocado;
  - a **escalação** sai do gerador da gestão (`TO.membros.povoarInicial`),
    com a proporção de cargos que a fonte dá pra torcida: 34 fichas com
    apelido, arquétipo, força, defesa, moral e XP. Quem tem ficha tem
    nome na cena e vida pela defesa; o resto é povão.
  - `combate.js` passava `cor` e `cor2` pro disco e **esquecia a terceira**
    — `bonecos3.js` já a lia do bonde pra montar a paleta, mas o disco ia
    sem ela e o desenho tricolor caía na segunda cor duas vezes. Uma linha.

- **`id: 'arredores'`, de propósito.** `combate.js` só liga a vida do lado
  de fora — ficar na sede até a hora, bonde hostil sair atrás do rival,
  fugir é entrar — quando `D.id === 'arredores'` (`fugaPelaEntrada`). A
  página acha a cena pelo registro `TO.dados.cenas.estadio`, não pelo id.
- **O destino é o setor, não o portão.** `entradas` são os dois setores na
  arquibancada (oeste mandante, leste visitante). O campo de fluxo leva
  portão → corredor → vomitório → arquibancada sozinho, pela máscara.
- **SETOR NÃO É PORTA: quem chega FICA.** No motor, chegar numa `entrada`
  chamava `entrarNoEstadio`, que marca `d.entrou` — e `entrou` derruba
  `get vivo`, então a cena filtrava o disco fora. Nos arredores isso está
  certo (a porta leva pra outra tela), mas aqui o setor é o lugar: os
  aliados subiam a arquibancada e sumiam na hora.
  A marca é da CENA, não do motor: `entrada.fica = true` (o `setor()` de
  `cena_estadio.js` põe nos dois) manda o `combate.js` segurar o disco no
  setor em vez de removê-lo — conta em `J.entraram`, amortece a
  velocidade e segue. Sem a marca vale o de sempre, então a cena dos
  arredores não muda.
  Medido, adiantando a simulação: aos 245 s, **fora da cena = 0** (entrou
  0 / sumiu 0), 14 no setor, 22 na arquibancada — contra sumirem todos
  antes.
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
- Cena: 18 degraus · 8 vomitórios · 3 portões · 8 balcões · **37
  quarteirões · 712 lotes (260 na favela) · 552 moitas · 207 árvores ·
  72 postes · 55 carros · 1 campo · 8 equipamentos · 1.822 decalques de
  chão · 12 cruzamentos de avenida com 46 faixas de pedestre, 10 com
  semáforo · 2 sedes, uma de cada nível · 2 bares de 8,7 × 13,8 m** ·
  159.585 triângulos
  estáticos em 6 pedaços de cidade mais o estádio · 165 chamadas de
  desenho sem gente na
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
12. **W andava pro lado contrário.** A câmera fica em `alvo + R·(sen
   giro, cos giro)` e olha pro alvo, então a FRENTE dela é `(−sen giro,
   −cos giro)`: girar a intenção do jogador é girar por **−giro**. O
   código girava por **+giro**, e com a câmera a 90° o W levava o
   boneco pro lado oposto — era esse o "ruim de fazer o boneco ir pro
   destino". Junto veio o outro meio do problema: a intenção era
   requantizada em quatro booleanos, e em oito direções não se segue
   uma rua diagonal. Agora sai um **vetor contínuo**, e `moverLider`
   passou a aceitar `teclas.vetor` — três linhas em `combate.js`, com
   as teclas continuando a valer pra quem não tem câmera.
13. **Poste na rua, moita no asfalto.** Os dois eram filtrados pelo
   CENTRO, e os dois têm tamanho: a moita tem raio de até 40 e o poste
   tem base. Meia moita ficava na rua, e nos cruzamentos a calçada da
   avenida vira asfalto, onde quatro mastros tinham sido plantados.
   O teste passou a ser o quadrado da peça (`tocaAsfalto`), e a
   varredura (`varredura.js`) confere árvore, poste, moita, campo,
   lote, equipamento e carro de uma vez.
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

14. **Quatro árvores com coordenada NaN, desde sempre.** Apareceu quando
    a malha de decalques reclamou de `Computed radius is NaN` — mas a
    culpa não era dela. O sorteio de árvore ao redor das casas de beira
    lê `o.ang` e `o.vf` pra jogar a árvore pra fora da fachada; as **22
    casas axiais da borda da cidade** têm `frente` e caixa, mas não têm
    `ang` nem `vf`, então a conta virava `-undefined` = NaN. As árvores
    nasciam NaN e sumiam caladas, porque `celulaEm(NaN)` não acha célula
    nenhuma e elas eram descartadas sem aviso. Agora o laço se ramifica
    em `o.ang` e tira o recuo da `frente` quando o lote é axial. **É a
    terceira vez que `ang: 0` ser falso em JavaScript morde este
    arquivo** — vale ler qualquer `if(o.ang)` novo com desconfiança.

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
| `dados/cena_estadio.js` | a planta: dobra, vomitórios, portões, comércio, a cidade (grade, costa, avenidas, campos, mato, lotes, sedes), o atacarejo e as casas de muro, a rua sem saída, os dois prédios do baldio e os props de rua, máscara, spawns, setores, PM, grades, filas, gatilho; o `DX` do tabuleiro |
| `js/diajogo/estadio3d.js` | arquibancada, corredor, comércio, vomitórios, gradil, torres, setores, câmera (linha de vista, modo leve), ligação com a simulação e com a gente |
| `js/diajogo/bairro3d.js` | a cidade em pedaços: lotes (axiais e rotacionados; casa, sobrado, barraco, galpão e prédio vêm do `casas3d.js`, só o muro é caixa), calçadas (com o furo da rua sem saída), árvores, carros, postes, campos, moitas |
| `js/diajogo/estadio_pintura.js` | a textura do chão do mapa inteiro: mato, quarteirões (e a rua sem saída), ruas, avenidas, costa, campos, estádio |
| `js/diajogo/construtor3d.js` | o construtor de fachada que os marcos e as casas dividem: ladrilho recortado, módulo, vão com fundo (e em arco), tinta por peça, telhado de quatro águas, torno, extrusão; e `noMundo`/`placasNoMundo`, que põem um modelo solto (a árvore, a peça da praia) no mundo, girado e na escala, com a normal junto |
| `js/diajogo/modelos3d.js` | os cinco marcos (igreja, prédio alto, mercado, centro administrativo, casa), o atacarejo ATACADEX, as duas torres do condomínio do baldio (Edifício Mirante e Residencial Bela Vista, com o muro, a guarita e os portões) e a montagem de cada um |
| `js/diajogo/props3d.js` | os props de rua: contêiner, lixeira de rodinha, saco, caixa de papelão, cesto, barreira, correio, hidrante, balizadores, delineador, cone, cinzeiro, banco e o poste de concreto da rua; cada um montado uma vez por variante e copiado pros lugares que a planta dá, em malhas por quadrado de 1.600 |
| `js/diajogo/casas3d.js` | as casas da cidade: os cinco tipos (T1 a T5), a casa da favela e as oito casas grandes dela (F1, F2, bar, lanchonete, escada, varal, garagem, base), o galpão (G1 de platibanda, G2 de arco), o prédio comum (P1 de reboco, P2 de tijolo), as casas de muro (M1 a M4) e o bar pequeno da torcida embaixo do apartamento (`bartorcida`, aberto ou fechado), o plano de cada lote (tipo, recuo, letreiro) e o lugar livre dos decalques na fachada |
| `js/diajogo/sede3d.js` | a sede da torcida no jeito das construções novas (nível 1 e nível 3, aberta nas cores da torcida ou vaga): as paredes e as portas da planta (`planoDaSede`), textura, janela, telhado à parte e cada cômodo mobiliado; devolve os blocos, os decalques com texto (os escudos com o caminho do PNG do jogo) e a planta baixa. Por enquanto só o artefato usa |
| `js/diajogo/metro3d.js` | o metrô da proposta: a estação inteira (a entrada de vidro, a descida, o mezanino e a plataforma, escrita uma vez e girada pra outra ponta, no corte de casa de boneca da lista `metro_sub`), o túnel ao longo do caminho e o carro do trem. Por enquanto só o artefato usa |
| `js/diajogo/equip3d.js` | os equipamentos novos da proposta: o Shopping Poente, o 2º Distrito Policial (com o pátio e as viaturas) e a Praça da Vila; cada um devolve os blocos, os decalques com texto e a planta baixa. Por enquanto só o artefato usa |
| `js/diajogo/arvores3d.js` | as árvores de todos os mapas: as dezoito espécies (`ESPECIES`), o que vai em cada lugar (`FLORA`: mata, cerrado, caatinga, cidade, praia, sul) e a montagem de cada uma pela semente — o tronco varrido, a copa de cachos com a normal de volume, a fronde da palmeira, o cacto. Devolve as listas `vegetacao` e `folhagem`. Por enquanto só a aba Modelos 3D da planta usa |
| `js/diajogo/arvores_lowpoly.js` | as dez árvores low poly (`ESPECIES_LP`: oiti, mangueira, ipê, jequitibá, ingá, pequizeiro, catingueira, mandacaru, coqueiro e araucária), o que vai em cada lugar (`FLORA_LP`) e a montagem pela semente: a copa de bolas facetadas, o tronco em prisma e a cor chapada por face, sem textura, numa lista só (`lowpoly`); e `montarAsDez`, as dez juntas. Por enquanto só a aba Modelos 3D da planta usa |
| `js/diajogo/praia3d.js` | as onze peças da praia em 3D (`PECAS_PRAIA`: guarda-sol, mesa, barraca, posto, quadra, os dois quiosques, calçadão, beira do mar com a onda, jangada e barco de pesca), no tamanho de verdade, com a semente; devolve os blocos e os decalques. Por enquanto só a aba Modelos 3D da planta usa |
| `ferramentas/planta_html/` | a planta em HTML (o artefato): `index.html` desenha o mapa (com praia — calçadão, quiosque, guarda-sol, onda —, lagoa ou mato a leste, pela praça, e em volta a mata, o cerrado ou o mato seco da caatinga, pela `vegetacao` da praça) e abre em 3D o que se clica (lote, marco, prop, estádio, pórtico, bar, sede, com o botão do telhado na sede, estação do metrô, com a viagem de trem e a descida na plataforma, e os equipamentos novos), tem a aba **Modelos 3D** (as dez árvores low poly, as peças da praia e as árvores de cartão, cada uma grande no 3D, com a ficha e a semente) e põe as torcidas da cidade escolhida nos bares e nas sedes, `proposta.js` gera os três mapas (`MAPAS`: o pequeno, que é o de hoje com a cópia do estádio, 5 espaços de sede, 8 bares e 3 favelas; o médio; e o grande, a expansão com as 4 vagas de estádio, os condomínios, as entradas com pórtico, os 18 bares, os 9 espaços de sede, o shopping e a delegacia novos, a Linha 1 do metrô — o terreno das duas entradas, o salão de cada estação e o caminho do túnel — e as cinco favelas), com a praça decidindo quantas vagas de estádio ocupa e se tem metrô, `conferir_sede.mjs` confere o modelo da sede contra a planta, `conferir_cidades.mjs` confere cada uma das 30 praças contra o jogo de hoje e os três mapas (estádio, sede, bar, favela, metrô) e sai com erro se alguma não cabe no mapa do porte dela, `pintar_variantes.py` pinta as três cores novas da folha das torres em `texturas/`, `montar.sh` junta tudo numa pasta pra publicar (a planta, as torcidas, os clubes, as praças, o manifesto dos escudos e os PNG deles embutidos em `dados/escudos_embutidos.js`, e os módulos 3D) |
| `dados/fonte/cidades_bairros.json`, `ferramentas/importar_bairros.py`, `dados/cidades.js` | as 30 praças: a fonte (tirada dos `.asset` da Unity), o importador (que junta a planilha `Book_3_1.xlsx`, com o `openpyxl`) e o arquivo GERADO que o jogo e a planta leem — porte, bairros, estádios, `temMetro`, `temPraia`, `temLagoa` e `vegetacao` |
| `js/diajogo/modelos_atlas.js` | GERADO pelo pintor: onde cada peça caiu em cada folha e quanto mede em metros |
| `ferramentas/pintar_modelos.py` | pinta as folhas de textura dos marcos, das casas, das casas grandes da favela (o muro da KI-DELÍCIA, a faixa de cerveja, o fibrocimento…) do galpão e do prédio (bloco, tijolo de vidro, vitrô alto, veneziana, portão de correr, os avisos pintados) do atacarejo (a folha `atacadex`: chapa azul, vitrine, marca, painel, doca, totem, carreta), das duas torres (a folha `torres`: concreto e janelinha, a cortina azul, a coroa, o saguão, o tijolinho, a sacada e o guarda-corpo, os nomes, o muro e a guarita) e dos props (a folha `props`), do metrô (a folha `metro`: azulejo, piso e borda, o trem, a catraca, a bilheteria, os painéis e os anúncios) dos equipamentos novos (a folha `equip`: a cortina do shopping, a pastilha e a viatura da delegacia, a pedra portuguesa e o parquinho da praça), da praia (a folha `praia`: deck, lona, tecido do guarda-sol, palha, tábua pintada, balcão de azulejo, cardápio, geladeira, freezer, mesa, vela, casco, canga, prancha) e das árvores (a folha `vegetacao`, com alfa: o cacho de copa de cada espécie, a flor do ipê, a fronde, o leque do buriti, o tufo da araucária, as cascas, o cacto, o coco e a rede do vôlei) e escreve o atlas; roda de novo sempre que mudar uma peça. Com nomes de folha (`pintar_modelos.py metro equip`), pinta só essas e junta no atlas que já existe |
| `img/texturas/modelos/*.jpg`, `grades.png`, `vegetacao.png` | as folhas dos marcos (uma por prédio), a das casas (`casas.jpg`, com as peças da favela), a do metrô (`metro.jpg`), a dos equipamentos novos (`equip.jpg`), a da praia (`praia.jpg`), a das árvores (`vegetacao.png`, com alfa) e a folha de grades vazadas, com alfa (portão de lança, gradil de sacada, grade enferrujada, pé de bananeira, antena e varal incluídos) |
| `estadio3d.html` | a página: a troca da cena padrão, o relógio, o passo fixo, o pad, o teclado, a linha de estado com o renderizador |
| `ferramentas/importar_decalques.py` | corta a folha de contato do pack em atlas: inundação a partir da borda pra tirar o fundo, franja, dessaturação, encaixe na célula |
| `img/texturas/chao.png` | o atlas de decalques de chão, 8 × 4 células de 192 px (capim, entulho, brita, poça, terra, folha) |
| `img/texturas/fonte/chao_pack.png` | a folha de contato como veio do gerador, guardada pra dar pra refazer o atlas |
| `docs/PACK_TEXTURAS.md` | os pedidos de imagem pro gerador: o pack de chão (40 peças, 32 entregues) e o pack de parede |
