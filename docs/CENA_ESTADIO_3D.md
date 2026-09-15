# O estádio e o bairro em 3D — a segunda cena

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

## 4. O bairro e o tabuleiro

Grade 3 × 3, estádio no meio, rua de 72 em volta de tudo (é por onde a
torcida chega e por onde se foge):

```
 NO  560 | N  1184 | NE 560       quarteirão: calçada de 32,
 --------+---------+--------      lotes de frente contínua (casa,
 O   560 | ESTÁDIO | L  560       sobrado, prédio, galpão, muro),
 --------+---------+--------      miolo de quintal; carro na guia
 SO  560 | S  1184 | SE 560       das ruas norte e sul do estádio
```

Tabuleiro **2592 × 2048** (324 × 256 células). Os lotes, carros e árvores
nascem na planta com sorteio de semente fixa (`semente(20260915)`): a
máscara e o desenho leem a mesma lista.

**A pegadinha que custou uma hora.** `arredores.js` lê `largura`, `altura`
e `celula` **uma vez, na carga**, da cena padrão — e a malha, a malha de
corpo e a memória de rota nascem daquele tamanho. O comentário do próprio
módulo diz: "todas têm o mesmo tamanho de tela". Trocar de cena não
redimensiona nada: o tabuleiro de 2592 × 2048 foi decodificado num buffer
de 1536 × 1024 e tudo com `y ≥ 1024` virou parede — "PORTÃO SELADO, sem
rota" nos quatro spawns, com a máscara certa. A saída, sem mexer no módulo:
**nesta página a cena padrão é o estádio** (`TO.dados.cenaArredores =
TO.dados.cenaEstadio`, antes de `arredores.js` subir). O jogo em
`index.html` não passa por aqui. Se um dia uma cena do jogo 2D precisar de
tamanho próprio, é `arredores.js` que tem de mudar (`const` → `let` e
realocar em `usarCena`), não a cena.

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
  `gatilho.perto` (300). Sem isso todo mundo caminhava até o destino e
  sumia em 50 segundos, e o estádio ficava vazio antes de você entrar. O
  destino desse grupo é a **saída leste** (fora do portão): é por onde ele
  vai embora depois. A retaguarda deles chega andando do quarteirão NE.
- **O relógio.** `minutosAteJogo = 60` na página: a marcha pro estádio
  começa perto de um minuto (tempo de você chegar antes), e o bonde hostil
  sai atrás do rival entre 20 e 55 segundos. `raioVadiagem = 220` pra
  ninguém vagar até o meio do estádio.
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

- Máscara: 40.811 células andáveis, **34.213 onde um corpo cabe, 100%
  alcançáveis** do spawn do jogador (BFS com a mesma régua do
  `arredores.js`: as 8 vizinhas livres, grades e filas bloqueando). O campo
  de fluxo do próprio módulo, no navegador, alcança 34.231.
- Por andar (células de corpo): rua 25.506 · corredor 4.339 · vomitório
  748 · arquibancada 3.572 · portão 48.
- Cena: 18 degraus · 8 vomitórios · 3 portões · 8 balcões · 172 lotes ·
  49 carros · 87 árvores · **83.436 triângulos** · **15–16 chamadas de
  desenho** (estádio 5, bairro 1, chão 2, gente e grades o resto).
- Boneco do Blender ativo (`comModelo: true`).
- A caminhada do líder pela rota inteira está no §8.

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
9. **Cabeça dentro da viga.** Na parede de dentro do corredor o pé-direito
   é 39, as vigas do teto descem 6 e o boneco em escala 1,15 tem 39 — na
   foto da briga o líder estava com a cabeça dentro de uma viga. Viga só
   de r = 124 pra fora, onde o teto passa de 53; perto da parede o teto é
   liso.

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
escadas do norte: 37 segundos. (Na rodada anterior, com a câmera antiga, o
líder chegou ao setor visitante pela arquibancada em 94 s, e a chegada foi
recebida com bomba: "Bomba deles", cinco mandantes caídos.)

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
| `dados/cena_estadio.js` | a planta: dobra, vomitórios, portões, comércio, bairro (lotes, carros, árvores, torres), máscara, spawns, setores, PM, grades, filas, gatilho |
| `js/diajogo/estadio3d.js` | arquibancada, corredor, comércio, vomitórios, gradil, torres, setores, câmera, ligação com a simulação e com a gente |
| `js/diajogo/bairro3d.js` | os oito quarteirões, numa malha só |
| `js/diajogo/estadio_pintura.js` | a textura do chão, em coordenada de mundo |
| `estadio3d.html` | a página: a troca da cena padrão, o relógio, o pad, o teclado, a linha de estado |
