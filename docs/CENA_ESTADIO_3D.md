# O ESTÁDIO EM 3D — briga na arquibancada, no corredor e na escada

Documento de trabalho, no mesmo espírito do `PLANO_CENA_3D.md`: o que foi
feito, o que custou, o que foi medido e o que ficou aberto.

O pedido era um cenário de estádio inspirado numa foto do Presidente Vargas,
com os membros das torcidas brigando na arquibancada e embaixo, nos
corredores, com escadas de acesso entre os dois — usando o movimento dos
bonecos que já existe e os botões de movimento que já existem.

---

## 1. O que abrir

```
python3 -m http.server 8000
# depois: http://localhost:8000/estadio3d.html
```

Módulo ES não carrega por `file://`; precisa de servidor.

**Controles.** WASD anda (relativo à câmera), 1–4 formação, Q pedra, E bomba,
R recuar, arrastar gira a câmera, roda aproxima. `Z` ombro, `X` alta, `C`
maquete, `F` zenital, `H` sombra, `V` alterna 2D ↔ 3D na mesma partida,
ESPAÇO pausa. **No celular, tudo isso está em botão na tela** — a cruz de
WASD, pedra, bomba, recuar, as quatro formações e as quatro câmeras.

---

## 2. O problema, e a saída

A briga tem dois andares: arquibancada em cima, corredor **embaixo dela**, e
os vomitórios — os buracos na arquibancada — ligando os dois. E `combate.js`
é um tabuleiro **plano** de 1536 × 1024: uma célula, um lugar. Não tem andar,
não tem altura, não tem escada.

**Nenhuma linha de `combate.js` foi tocada.** O tabuleiro continua plano e
continua sendo uma célula por lugar — o que mudou é o mapa que leva do
tabuleiro pro mundo. `planta.mundo(x, y)` devolve um ponto em TRÊS dimensões,
e **duas faixas distantes do tabuleiro caem no mesmo ponto do mundo, em
alturas diferentes**: a arquibancada e o corredor. Andar do corredor pro
degrau é andar uma distância no tabuleiro e subir no mundo.

Foi assim depois de uma correção do dono. A primeira versão punha o corredor
*ao lado* da arquibancada, não embaixo, com a escada por fora — e ficava um
anel externo, não um estádio. A dobra é o que faz o corredor ser corredor.

### A dobra, faixa por faixa

`d` é a distância ao gramado no TABULEIRO; `r` é a distância no MUNDO.

| faixa | d | r | altura | |
|---|---|---|---|---|
| pista | 0 → 26 | = d | 0 | bloqueia |
| geral | 26 → 122 | = d | 6 → 56,6 | **anda** (12 degraus) |
| cadeira | 122 → 170 | = d | 61 → 84 | bloqueia (6 fileiras) |
| muro | 170 → 186 | = d | — | bloqueia |
| **corredor** | 186 → 254 | **102 + (d−186)** | **0** | **anda** |
| fachada | 254 → 270 | 170 + (d−254) | 0 → 108 | bloqueia, com portões |
| rua | 270 → | 186 + (d−270) | 0 | anda |

Repare no corredor: `d` de 186 a 254 vira `r` de 102 a 170, que é exatamente
onde a arquibancada está por cima. O corredor tem 68 de fundo e o pé-direito
é o fundo da laje — **39 no ponto mais apertado, contra 34 de boneco.** É
corredor de estádio: baixo.

### Por que a arquibancada de cima é cadeira, e não se pisa

Não é enfeite: é o que fecha a conta da dobra. O vomitório é uma tira do
tabuleiro que atravessa da geral até o corredor, e ela **come** as células da
arquibancada no caminho — porque uma célula só pode estar num lugar. Se a
arquibancada de cima fosse andável, essas células comidas virariam laje que
se vê e não se pisa, que é a mentira que este projeto não comete. Sendo
cadeira, elas já eram bloqueadas em toda parte, e a tira só as usa por baixo,
como túnel. A cadeira também é o que a foto mostra.

### O vomitório, pela prancha

Sai do degrau 5 da geral (r=66, altura 29) e desce até o chão do corredor
(r=130): **64 de tiro pra 29 de queda, 24 graus**. São seis. As medidas vieram
de uma prancha técnica de vomitório que o dono mandou, convertidas pela régua
desta cena (o boneco tem 34 pra 1,75 m, então **1 m ≈ 19,4**):

| na prancha | aqui |
|---|---|
| guarda-corpo de concreto, 0,90 m | mureta de 17,5 dos dois lados |
| corrimão, 1,10 m | 21,4 acima do piso do degrau |
| **corrimão central** partindo a escada | tubo no eixo, com montante por degrau |
| **corrimão lateral** em cima das muretas | tubo + montante, acompanhando o degrau |
| **faixa amarela, mínimo 5 cm**, no nariz | 1,6 em todo degrau — do vomitório E da geral |

**Os degraus passaram de 16 pra 10 por causa dessa régua.** Com 16, cada
degrau tinha 4 de piso e 1,8 de subida — **20 cm por 9 cm**, degrau de casa de
boneca, e nem se via. Com 10, dá 6,4 por 2,9: **33 cm de piso por 15 de
espelho**, que é escada de verdade. A colisão conta os mesmos dez: `rampa()`
quantiza a altura em degrau, não em rampa, então o pé sobe o degrau inteiro
de uma vez, como sobe na vida.

**A faixa amarela da arquibancada é pintura, não volume**, e é decisão de
custo: o degrau já é geometria, e um filete de 1,6 em relevo custaria vinte
mil triângulos pra aparecer menos do que aparece pintado.

### O corredor saiu de duas fotos, não da planta

O dono mandou dois quadros de dentro do Presidente Vargas, e eles mudaram
quatro coisas que nenhuma planta teria dito:

1. **O teto é a laje da arquibancada**, inclinada, com as **vigas aparentes**
   correndo no sentido do degrau. Não é forro plano: é concreto nervurado, e
   é ele que dá a sensação de estar embaixo de alguma coisa pesada.
2. **Pilar quadrado** no meio do corredor, de tantos em tantos metros.
3. **Um lado é aberto.** Balcão de um lado e, do outro, mureta na altura da
   cintura com a luz estourando por cima. Então a fachada não é muro cego: é
   **arcada** — pilar, mureta, e vazio até a laje.
4. **O comércio é balcão na parede**, não quiosque solto: lanche, pipoca,
   cerveja, cachorro-quente, banheiro e a loja da torcida, com toldo e placa.
   São doze, e estão na MÁSCARA — o corpo esbarra neles.

É a mesma regra que já valia na cena 3D dos arredores ("o que bloqueia a
passagem é exatamente o que aparece na tela"), com um irmão novo: **a altura
que o desenho mostra é exatamente a altura que a planta declara.** Não existe
degrau que só o olho vê, nem corrimão que o corpo atravessa.

### A planta é uma só, lida por dois

`dados/cena_estadio.js` é a fonte. Dela saem a **máscara de caminhabilidade**
(gerada na carga, é o que `combate.js` enxerga) e a **geometria 3D**. Mudar um
número move os dois. A máscara é gerada e não colada: colada ela envelhece na
primeira vez que alguém muda um número, e aí a planta e a colisão passam a
discordar sem ninguém perceber.

**Confirmado por busca em largura sobre a máscara gerada:** 16 497 células
andáveis, 100% alcançáveis do ponto de partida do jogador — geral, vomitório,
corredor e rua, todos ligados só pelos caminhos que a planta declara.

### Não há cena 2D, e é decisão do dono

Este cenário é só 3D. Não é preguiça: a dobra torna a vista de cima uma
mentira. Desenhado de cima, o tabuleiro mostra o corredor *ao lado* da
arquibancada, que é onde ele está no tabuleiro e não é onde ele está no
estádio. A pintura que existe (`estadio_pintura.js`) é do **mundo**, e serve
só de textura pro 3D.

## 4. Os bonecos: os do jogo, não uns novos

O pedido foi pegar o movimento dos bonecos que já existe. Havia dois
candidatos no repositório e nos artefatos:

- o **boneco de caixa** de `cena3d.js` — dez peças, instanciado, 10 chamadas
  de desenho pra 400 pessoas;
- o **boneco do jogo** (artefato *Torcida Organizada*, 12/09/2026) — modelo
  humano feito no Blender, clonado com esqueleto, com cabelo, boné, barba,
  óculos, camisa listrada da torcida, bermuda e tênis, e um repertório de
  vinte e poucos movimentos com três variações cada.

Entrou o **do jogo**, como `js/diajogo/bonecos3.js`, porque é o que está no
jogo e porque dois bonecos diferentes no mesmo jogo seriam dois jogos.

**Uma escolha que foi refeita.** A primeira tentativa trouxe a versão da
*Vitrine dos Bonecos* (06/09), que é a mesma anatomia sem a camada de
desempenho. O resultado, medido no navegador: **72 figuras, 819 chamadas de
desenho, 1 668 996 triângulos por quadro.** Isso não roda em celular, e a
cabeça saía cheia de particularidade de perto. A versão do jogo já tinha
resolvido exatamente isso — a malha é afinada na chegada por agrupamento de
vértices, as catorze peças viram uma chamada, quem está fora da tela não é
animado nem desenhado. Trocada a versão, mesma cena:

| | Vitrine (06/09) | Jogo (12/09) |
|---|---:|---:|
| chamadas de desenho | 819 | **28** |
| triângulos por quadro | 1 668 996 | **60 100** |
| figuras desenhadas | 72 | 16 (as que cabem na tela) |

**29× menos chamada e 28× menos triângulo, com o mesmo boneco.** Foi por isso
que a camada de desempenho do jogo entrou junto: ela não é detalhe, é o que
separa a cena de rodar de não rodar.

### O que mudou pra ele caber aqui — e nada disso é de pose

1. **Virou módulo ES.** O artefato era script solto com `THREE` global (r147);
   aqui o three é o r160 de módulo que já estava vendido. O `GLTFLoader` e o
   `SkeletonUtils` entraram como `vendor/three/GLTFLoader.js`, com duas
   adaptações e só duas: eles escrevem em `THREE` (que num módulo é selado, e
   por isso recebem uma cópia mutável do namespace), e `encoding` virou
   `colorSpace` no r152 — sem isso a textura do rosto sai lavada.
2. **O GLB vem de arquivo.** No artefato ele vinha em base64 porque o sandbox
   barra requisição; aqui é `img/boneco.glb` (2,7 MB) e quem busca é o
   próprio carregador. Fica 3,6 MB de JavaScript a menos, e o modelo volta a
   ser um arquivo que dá pra abrir no Blender.
3. **O chão pode não ser zero.** `piso(x, z)` entra somado na raiz da figura,
   no fim de toda a pose. A passada, o soco, a queda e o agarrão continuam
   sem saber que existe degrau — e é por isso que a arquibancada não custou
   uma linha de pose.
4. **O corte fora da tela aceita outro teste.** A cena de cima corta por
   retângulo do tabuleiro; a câmera de ombro não tem retângulo, então quem
   tem a câmera passa o teste (tronco de visão, uma esfera por pessoa).
5. **`entrarEm(cena)`.** No jogo o módulo é dono do renderizador, da câmera e
   da luz; aqui quem é dono é `estadio3d.js`, e só entra a gente.

### A ponte de sinais, e o que ela NÃO inventa

O boneco do jogo lê um combate mais rico do que o deste branch: ele espera
`ataque` com tipo e instante do impacto, `apanhou`, `derrubado`,
`defendendo`, `esquivou`, `segurando`, `seguradoPor`, `linha`,
`inimigoPerto`. O `combate.js` daqui guarda outra lista, mais curta.

Havia dois caminhos: mexer no combate — e aí a briga muda, o balanceamento
muda, e o que era pra ser uma cena nova vira um jogo novo — ou traduzir.
`js/diajogo/sinais3d.js` traduz, sem tocar numa linha de simulação:

| o que o combate guarda | o que o boneco passa a ler |
|---|---|
| `golpe` subindo | `ataque` com tipo, duração e instante do impacto |
| `tremor` subindo | `apanhou` — o tranco é evento, não nível |
| projétil novo | `arremesso`, com a origem de volta por `x − vx·t` |
| `agarrado` | `seguradoPor`, e quem bate em cima é o `segurando` |
| `ang` | `rumo` (só conversão de eixo) |
| parado e sem briga | `linha:'retaguarda'` — **o boneco torce** |

**O que não dá pra inventar fica em repouso, e é honesto que fique.**
`derrubado`, `defendendo`, `esquivou`, `chamou`, `socorrendo` e `fugaBomba`
ficam zerados, porque o combate daqui não tem esses estados — desenhar um
sujeito esquivando quando a simulação não esquivou é a tela mentindo sobre a
regra. No dia que o combate ganhar esses campos, o tradutor encolhe; ele é
uma ponte, não um lugar.

O `linha:'retaguarda'` merece uma nota: numa cena de rua ele seria enfeite;
num estádio é o que a arquibancada **faz** quando não está brigando. Quem não
está em briga, torce.

---

## 5. Os botões de movimento

São os mesmos de `ponte.js`, com as mesmas classes e o mesmo desenho, em
`js/diajogo/pad3d.js` e `css/pad3d.css`. A regra que valia lá vale aqui e é a
mesma frase: **o pad não implementa lógica nenhuma.** Cada botão escreve no
MESMO objeto `teclas` que o teclado alimenta, e as ações de uma tecolada só
chamam exatamente o que a tecla chama. Por isso `combate.js` não precisa
saber que existe botão: `moverLider` continua lendo `teclas['w'|'a'|'s'|'d']`
e a diagonal sai de encostar em dois botões ao mesmo tempo.

**Uma diferença de propósito:** aqui o pad **não** está atrás de
`@media (max-width:900px)`. Na cena 2D o teclado dá conta em tela grande, e o
pad só existe porque no celular não dá pra apertar tecla com o jogo rodando.
A câmera de ombro é outra coisa: a mão esquerda anda e a direita gira a
câmera arrastando, e isso vale no monitor tanto quanto no telefone.

---

## 6. O que ficou aberto

1. **A escala continua sem resposta.** Vale aqui o §5 do `PLANO_CENA_3D.md`
   inteiro: o gramado é 496 × 320 e não 105 × 68 m, porque o disco tem raio 7
   e a pessoa tem 34 de altura. É a escolha (a) daquele documento — boneco de
   mesa vivo — assumida e escrita num lugar só, pra mudar num lugar só.
2. **Dois bonecos no mesmo repositório.** `cena3d.js` (arredores, praça, rua)
   continua com o boneco de caixa; o estádio usa o do Blender. Não incomoda
   hoje porque são páginas diferentes, e incomoda no dia que alguém comparar
   as duas. A migração é pequena — trocar a multidão por `entrarEm` e passar
   o mesmo `sinais3d.js` —, mas é outra sessão e outro teste. **Não fiz de
   propósito:** `cena3d.js` está como estava, sem uma linha mexida.
3. **A arquibancada não tem cadeira.** O azul é pintura, não volume. De perto
   isso aparece. Cadeira instanciada é barata (uma chamada pra toda a bacia),
   mas atravessa o boneco que está em pé em cima dela — e a torcida
   organizada fica de pé. A saída certa é cadeira só nos setores onde não se
   briga, e isso é dado de cena que ainda não existe.
4. **A cobertura é uma laje.** Sem treliça, sem calha, sem o beiral irregular
   da foto. É onde um kit de Blender entraria primeiro (§8 do plano antigo:
   "onde o Blender ganha muito mais rápido é no cenário, não na gente").
5. **Placar, bandeirão, faixa, fumaça de sinalizador.** Nada disso existe. O
   estádio está vazio de torcida que não briga — e um estádio de jogo não é
   isso.
6. **O fps de verdade.** Este ambiente só tem rasterizador por software, onde
   qualquer cena roda a 4 quadros por segundo. Os números de chamada e de
   triângulo acima são medidos e valem; o fps não foi medido em placa de
   verdade. **Rode aí e olhe o contador antes de acreditar.** Se estiver
   ruim, o primeiro suspeito é a sombra — `H` desliga, e a diferença entre os
   dois números diz se é ela.

---

## 7. O que este trabalho NÃO mexeu

- `combate.js`, `arredores.js`, `cenario.js`, `ponte.js`, `cena3d.js`: intactos.
- `cenas.js`, `cena_arredores.js` e todo dado de cena: intactos. A cena do
  estádio se acrescenta ao mapa de cenas de fora, como `cenas_foto.js` já
  fazia, e o pintor dela se acrescenta ao pintor do mesmo jeito.
- `arredores.html`, `arredores3d.html` e o jogo em `index.html`: intactos. O
  estádio é uma página à parte e não está ligado ao dia de jogo.
