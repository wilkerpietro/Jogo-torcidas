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

## 8. A caminhada do líder

(medida com o roteiro `sim3.js`: waypoints em rua, tecla apertada a cada
passo até chegar; velocidade do líder ~41 px/s)

| perna | chegou em | onde | altura 3D | tempo |
|---|---|---|---|---|
| sede → esquina da rua norte | (658, 551) | rua | 0 | 5,2 s |
| rua oeste até a frente do portão | (664, 1013) | rua | 0 | 7,8 s |
| calçada do portão | (700, 1019) | rua | 0 | 0,7 s |
| portão → corredor | (796, 1019) | corredor | 0 | 1,6 s |
| corredor → pé do vomitório 4 | (807, 945) | vomitório | 5 | 1,3 s |
| escada acima → arquibancada | (954, 939) | arquibancada | 52 | 2,5 s |

Do spawn à arquibancada: **19 segundos**, sem tocar em grade. (A travessia
pelo corredor norte até o setor visitante e o encontro estão sendo medidos;
entram na próxima revisão deste documento.)

Na primeira tentativa o líder foi **preso**: o roteiro mirava reto no vão e
encostou no cordão da PM do próprio portão; o alerta subiu a 79 em vinte
segundos e a PM levou o líder antes de ele entrar. Foi isso que tirou o
cordão do portão da casa.

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
