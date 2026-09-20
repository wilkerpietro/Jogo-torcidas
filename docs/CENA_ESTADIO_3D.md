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
- **A ESCALA É A DO BONECO.** Ele tem 39 unidades e mede 1,75 m, então
  uma unidade é 4,5 cm. Pelas alturas antigas a casa tinha 1,6 m, a
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

**A planta**, fiel à foto: **200 × 400** (9 × 18 m), com a largura
valendo metade da profundidade, como o dono pediu. Começou em 116 ×
232 e cresceu: no apertado a quarta cadeira de cada mesa batia na
parede e não havia como entrar atrás do balcão.

| onde | o que |
|---|---|
| sul | a fachada com a porta de vidro de duas folhas |
| oeste | faixa de serviço, balcão em L, prateleira de garrafa |
| sudoeste | as pilhas de engradado de cerveja |
| meio/leste | três mesas de pé central, cadeira de plástico |
| norte | dois freezers, e a TV passando futebol em cima deles |
| nordeste | o banheiro |

**Só nas faces LESTE e OESTE do quarteirão.** O miolo tem uns 595 no
sentido comprido e 249 no curto: 400 de fundo só cabe no comprido, que
corre em x. Virado pro norte ou pro sul o bar não entraria — e é melhor
ele existir numa face certa do que caber torto em qualquer uma.

**Dá pra entrar no balcão.** A faixa de serviço atrás dele tem 38 de
vão, e o corpo pede 24: o dono do bar fica atrás do balcão de verdade.
Ela fecha ao sul pelo pé do L e a leste pelo braço comprido, e fica
aberta ao norte — que é por onde se entra, como em balcão de verdade.
No armário encostado na parede oeste, duas prateleiras de garrafa:
âmbar de uísque, verde de cerveja, incolor de cachaça. Cada garrafa são
três caixas (corpo, ombro e gargalo) mais a faixa do rótulo.

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

A mesa bloqueia e a cadeira não: cadeira de plástico se empurra com o
pé, e uma fila delas fechando o corredor seria pior que qualquer ganho
de fidelidade. Medido no bar grande: **604 e 612 células de corpo
dentro dos dois bares, todas alcançáveis da rua** — e com 20 bonecos
dentro sobra corredor pra andar, que era o teste que o dono pediu.

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
  semáforo · 2 sedes, uma de cada nível · 2 bares de 9 × 18 m** ·
  151.825 triângulos
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
| `dados/cena_estadio.js` | a planta: dobra, vomitórios, portões, comércio, a cidade (grade, costa, avenidas, campos, mato, lotes, sedes), máscara, spawns, setores, PM, grades, filas, gatilho |
| `js/diajogo/estadio3d.js` | arquibancada, corredor, comércio, vomitórios, gradil, torres, setores, câmera (linha de vista, modo leve), ligação com a simulação e com a gente |
| `js/diajogo/bairro3d.js` | a cidade em pedaços: lotes (axiais e rotacionados), calçadas, árvores, carros, postes, campos, moitas |
| `js/diajogo/estadio_pintura.js` | a textura do chão do mapa inteiro: mato, quarteirões, ruas, avenidas, costa, campos, estádio |
| `estadio3d.html` | a página: a troca da cena padrão, o relógio, o passo fixo, o pad, o teclado, a linha de estado com o renderizador |
| `ferramentas/importar_decalques.py` | corta a folha de contato do pack em atlas: inundação a partir da borda pra tirar o fundo, franja, dessaturação, encaixe na célula |
| `img/texturas/chao.png` | o atlas de decalques de chão, 8 × 4 células de 192 px (capim, entulho, brita, poça, terra, folha) |
| `img/texturas/fonte/chao_pack.png` | a folha de contato como veio do gerador, guardada pra dar pra refazer o atlas |
| `docs/PACK_TEXTURAS.md` | os pedidos de imagem pro gerador: o pack de chão (40 peças, 32 entregues) e o pack de parede |
