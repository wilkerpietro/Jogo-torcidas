# Como modelar um estádio low-poly

Cada estádio do jogo é uma **ficha** (um objeto JavaScript) que o gerador
`estadio_lowpoly.mjs` transforma em modelo 3D. O jogo não desenha o 3D ao
vivo: `assar.js` fotografa o modelo de cima e grava a imagem, a máscara de
onde se anda e os marcadores (setores, túneis, grades, PM). Este guia é
pra quem vai escrever uma ficha nova a partir de fotos.

## O fluxo

1. Junte pelo menos 5 fotos do estádio: uma de cima (satélite), aéreas de
   lados diferentes, uma de dentro e, se achar, a planta de setores.
   As fotos são só referência: ficam fora do repositório, nunca entram num
   commit.
2. Escreva a ficha em `ferramentas/estadios/fichas/<id>.mjs`, exportada
   como `default`, com as constantes dela dentro do próprio arquivo.
3. Confira, sem gravar nada no jogo (o servidor da raiz precisa estar em
   `127.0.0.1:8799`):

   ```
   FICHA=ferramentas/estadios/fichas/<id>.mjs CONF=<pasta> node ferramentas/estadios/assar.js
   ```

   Saem em `<pasta>`: `<id>_satelite.jpg` (de cima, cobertura fechada),
   `<id>_cima.webp` (como aparece no jogo, cobertura transparente),
   `<id>_aerea.jpg`, `<id>_aerea2.jpg` (do lado oposto) e `<id>_tv.jpg`.
4. Olhe as imagens, compare com as fotos, ajuste. Repita até parecer.
5. Pra entrar no jogo: uma linha de `import` e uma de registro no fim de
   `fichas.mjs`, e `node ferramentas/estadios/assar.js`.

## O quadro

- Medidas em **metros**. O campo fica sempre deitado: `u` ao longo do
  comprimento (direita da imagem), `v` atravessado (pra cima da imagem).
  O campo tem 105 × 68, centrado em (0, 0).
- Trecho que CRUZA O ZERO (atrás do gol da direita): o `de` tem de ser
  negativo (`-22` a `23`, não `338` a `23`), senão sai um triângulo
  atravessando o campo.
- **Ângulos** em graus, anti-horário a partir de `+u`: 0 = atrás do gol
  da direita, 90 = lateral de cima, 180 = atrás do gol da esquerda, 270 =
  lateral de baixo. Um trecho vai de `de` até `ate` (`ate` > `de`; `de`
  pode ser negativo, por exemplo `-30` a `30`).
- `norte`: pra onde fica o norte no quadro (90 = pra cima, 0 = direita,
  180 = esquerda, 270 = pra baixo). Serve pro sol.
- **Contorno**: `{ a, b, r }` é um retângulo de cantos redondos (meio
  comprimento `a` em `u`, meia largura `b` em `v`, raio do canto `r`;
  `r` igual a `b` dá o oval de estádio antigo). `{ a, b, forma: 'elipse' }`
  é uma elipse (com `cu`, `cv` ela sai do centro).

## A ficha

```js
export default {
  id: 'estadio-nome', nome: 'Nome do estádio', clubes: ['id-do-clube'],
  norte: 90, vazado: 0.34, folga: 14,
  chao: { cor: '#8b8a85', esplanada: <contorno>, corEsplanada: '#bdb9ad' },
  campo: { corMargem: '#4c9656' },
  corMureta: '#d9d7cf',
  aneis: [ ... ], retas: [ ... ],
  coberturasAnel: [ ... ], folhas: [ ... ], abobadas: [ ... ],
  fachada: { cor: '#c9c6bb' },
  blocos: [ ... ], refletores: [ [u, v, altura], ... ], porticos: [ ... ],
  entorno: [ ... ],
  jogo: { ... }
};
```

- `vazado`: quanto a cobertura aparece na foto de cima do jogo (0 some, 1
  fecha). Com cobertura grande, 0,28 a 0,45, pra torcida aparecer.
- `folga`: metros de margem em volta da arquibancada na foto. Aumente se a
  cobertura, a fachada ou um prédio passam da arquibancada.

### `aneis`: as arquibancadas

De dentro pra fora. Cada anel fica entre dois contornos e é cortado em
trechos por ângulo. Um lance em cima do outro são dois anéis, e o
`dentro` do de cima deve ser o `fora` do de baixo (anéis encostados
formam um chão só; uma fresta isola o lance).

```js
{ dentro: <contorno>, fora: <contorno>, reto: true, h: [1.2, 11], fileiras: 14,
  corredorFrente: 2.4, inclinacao: undefined,
  trechos: [ { de: 0, ate: 360, cor: '#c8343a', cor2: '#b22c33', padrao: 'mosaico', mistura: 0.3, corredor: 13 } ] }
```

- `h`: altura da primeira e da última fileira. Uma arquibancada sobe uns
  0,5 m por metro de fundura.
- `reto: true` (só em retângulo de canto redondo): as escadas saem
  perpendiculares ao campo e o canto abre em leque. Use em estádio
  retangular. Nesse caso os ângulos dos trechos valem na beira de DENTRO.
- `fileiras`: só serve de régua pras faixas e blocos (`faixaTopo`,
  `blocoFileiras`). O número real de fileiras sai da fundura (0,9 m cada).
- `corredorFrente`: o corredor vazio entre a primeira fileira e o
  alambrado (2,4 m; 0 desliga).
- `andarReto: true` (anel `reto`): use quando a arquibancada é um retângulo
  fundo e longe do centro (o Bruno Daniel). O chão andável passa a valer
  pelo pé da perpendicular na beira de dentro, como o desenho; sem isso
  sobra chão invisível depois de cada ponta.
- `normal: true` (também vale no trecho): a escada sai perpendicular à beira
  de dentro e vai reta até o fundo. Use quando a arquibancada é mais funda
  num lugar que no outro sem ser em degraus (as fileiras acompanham a beira
  do campo e o fundo corta as fileiras): no anel `reto` comum a escada sai
  torta. Confira no satélite quantas escadas há e onde; se o espaçamento
  não for regular, faça um trecho por vão, com `escadaNaBorda: true`.

**Trecho** (`tipo` ausente = arquibancada):

- `tipo: 'passagem'`: chão de concreto andável (liga setores). Com `alt`
  vira laje alta.
- `tipo: 'vazio'`: nada ali (não se anda).
- Pintura: `cor`, e um `padrao`:
  - `'mosaico'` (`cor2`, `mistura`): salpicado de duas cores;
  - `'blocos'` (`cor2`, `bloco` em metros, `blocoFileiras`): xadrez;
  - `'faixas'` (`cores: [..]`, `faixaM`): faixas de baixo pra cima;
  - `'fracoes'` (`fracoes: [[0.66, cor], [0.95, cor], [1, cor]]`): faixas
    por fração da fundura;
  - `'degrade'` (`cores: [..]`, `mistura`): degradê de baixo pra cima;
  - `'redemoinho'` (`bandas: [[cor, graus], ..]`, `fase`, `torcao`):
    faixas tortas que dão a volta;
  - `'vazias'` (`mistura`): cadeiras faltando.
- `texto`, `corTexto`, `textoLargura`, `textoAltura`: letreiro escrito nas
  cadeiras (lido de quem olha de frente pra arquibancada).
- `faixaTopo: { n, cor }`, `faixaBase: { n, cor }`: fileiras de outra cor.
- `semCadeiras: true`: só o degrau pintado (arquibancada de cimento).
- `corredor`: de quantos em quantos metros desce uma escada (0 = sem
  escada). `corEscada`: escada pintada (sem ela, concreto liso).
  `escadaNaBorda: true`: uma escada na divisa do trecho.
- `vomitorios: { f, cada, larg, fundo }` ou `false`: as bocas de acesso.
  `f` é onde abrem (0 = na frente, dando no corredor; 0,4 = no meio do
  lance); `cada: 2` = uma a cada duas escadas. Com `em: [0, 0.5, 1]` as bocas
  caem em lugares certos do trecho (fração do comprimento; 0 e 1 fazem meia
  boca na divisa, que fecha com a meia boca do trecho vizinho).
  A boca só nasce se o trecho tem corredor na frente: num anel com
  `corredorFrente: 0` não sai nenhuma. Faixa de cima encostada num corredor
  (o Canindé) leva `corredorFrente: 1.2` e `f: 0.04`: a caixa fica na
  frente da faixa, dando no corredor.
- `h`, `dentro`, `fora`: valem só pro trecho (um setor mais fundo ou mais
  alto que os vizinhos). Com `fora` diferente num anel `reto`, ponha
  `reto: false` no trecho.
  Estádio assimétrico (o Allianz Parque, com uma ponta redonda e funda e a
  outra reta e rasa): em cada anel, um trecho de -90 a 90 e outro de 90 a
  270, cada um com o seu `dentro` e o seu `fora`; os dois contornos têm a
  mesma meia largura `b`, então se encontram nas laterais.
  Pra uma arquibancada retangular num anel `reto` (cada lado com a sua
  fundura), dê ao contorno de fora um raio que deixe o lado reto do tamanho
  do de dentro (`a - r` e `b - r` iguais nos dois), senão ela abre em leque.
- `cobertura: { h, larg, avanco, cai, cor, cor2, listras, corTrelica, corPilar, pilares, trelica, opaca }`:
  marquise em cima do trecho, da beira de trás pra frente (`larg` metros
  pra dentro, `avanco` pra fora).
- `parapeito`, `corFachada`, `corMureta`.

TRECHO QUE PASSA POR ZERO GRAU: `ate` tem de ser maior que `de` (de 339 a
360, não de 339 a 0); de trás pra frente o gerador desenha paredes cruzando
o campo (o Bernardo Rubinger de Queiroz). E faixa de chão que precisa ligar
duas partes não pode começar no canto arredondado da beira: ali ela fica
fina demais e o teste dá duas ilhas.

ARCO DE TRELIÇA POR CIMA DA COBERTURA (o Nilton Santos): `arcos: [{ de: [u,
v], ate: [u, v], pe, topo, inclina, base, n, esp, cor, pilar: { r, cor } }]`.
Parábola do alto de um pilar ao outro (`pe` nos pés, `topo` no meio),
tombada `inclina` metros pra dentro, com tirantes até a altura `base` do
telhado e um pilar redondo em cada pé (`pilar: false` tira). Os pés ficam
de FORA da beira do telhado. E `alambrado: false, muro: false` só nas arenas
de cadeira colada no campo: estádio com pista em volta leva os dois.

FAIXA PRETA RENTE AO CAMPO NA FOTO AÉREA = PLACA DE PUBLICIDADE, não
alambrado (Moça Bonita; dono, 16/11/2026: "São placas de publicidade, você
entendeu errado"). Placa é `bloco` baixo (0,9 m) e não mexe no chão andável;
o alambrado continua na beira das arquibancadas.

O ESPELHO DO DEGRAU (a face de pé entre as fileiras): com cadeira, ele sai
sozinho no tom da cadeira da fileira (São Januário; antes era sempre
concreto e a arquibancada vista de frente ficava cinza). Num trecho sem
cadeira continua concreto, a menos que a ficha dê `corEspelho`. Nunca chame
o sorteio de cor (`corDe`) duas vezes na mesma célula: ele puxa o próximo
número da semente e muda o mosaico de cima.

ARQUIBANCADA TODA DEBAIXO DO TELHADO (o Independência): nas vistas de perto
ela sai cinza, sem cadeira à vista. `telhados[].sombra: false` tira a sombra
do telhado e `corEspelho` (na ficha ou no trecho) pinta o espelho do degrau
na cor do encosto. Nenhuma das duas muda a vista de cima do jogo.

RETÂNGULO NUNCA COM CANTO ZERO (o Independência): num anel `reto`, contorno
`{ a, b, r: 0 }` faz o gerador tomar o lado do fundo pelo da lateral e
juntar todas as colunas do fundo num ponto do canto (o lance sai só com os
degraus). Use `r: 0.5`. Arquibancadas separadas por torre ou prédio de
canto: uma faixa de `passagem` na beira do campo, ao pé delas, liga o chão
(senão o teste dá duas ilhas).

PLANTA TIRADA DO MAPA DE SETORES, RAIO A RAIO (o Mineirão; dono,
15/11/2026: "observe detalhadamente a imagem do mapa pra planta da
arquibancada vista de cima ser extremamente fiel ao mapa"). Quando nem
elipse nem retângulo de canto redondo servem, o contorno pode ser uma
tabela: `{ forma: 'raios', raios: [...120 valores...], a, b }`, o raio a
partir do meio do campo de 3 em 3 graus (0 = +u, anti-horário). Como medir:
1) girar e escalar o mapa pelo retângulo do campo (105 x 68) com o
`quadro.sh` (no mapa do Mineirão: 4,25 px/m no recorte ampliado 3x);
2) conferir o giro no satélite de área maior (ruas, prédios vizinhos);
3) raio a raio, anotar onde começa e acaba cada cor e cada linha preta
(onde a linha some na cor do setor, varrer linha por linha com limiar
próprio); 4) desenhar as tabelas por cima do mapa e conferir canto a canto
ANTES de assar; 5) assar e pôr a vista de cima na mesma escala, com as
mesmas linhas, embaixo do mapa. Contorno `raios` é curvo: as colunas saem
do meio do campo. Faixa que só existe num lado (camarotes): o contorno de
dentro dela é igual ao de fora no resto da volta, e o trecho ali é
`vazio`.

LANCE QUE DÁ A VOLTA INTEIRA (o Mineirão; dono, 15/11/2026: "Falta as
cadeiras na superior e as escadas. Veja as regras que apliquei nos
anteriores"): nunca um trecho só de 0 a 360 em contorno curvo; a largura
das colunas sai do raio no meio do trecho, e onde o raio é maior a cadeira
estica. Cortar em blocos de largura igual (12 a 15 m, medidos no meio do
lance), em PARES de blocos: `escadaNaBorda: true` (a escada de concreto
liso na divisa, sem `corEscada`) e `corredor` igual a 52% da largura do par
(a escada do meio), com `vomitorios: { cada: 1, f }`: a boca fica EM CIMA da
escada do meio, uma boca a cada duas escadas (dono, 15/11/2026, com foto do
Mineirão: a boca fica "no meio da altura das cadeiras e da escada"). Boca
no meio do bloco de cadeiras está errado. Telhado transparente por cima das
cadeiras sem `nervuras` (de cima elas parecem escadas a mais). Mosaico
de dois tons parecidos (se o contraste for grande, vira chuvisco e as
fileiras somem). Telhado escuro por cima das cadeiras: a parte de fora das
cadeiras com `opaca: true` e o resto transparente, com `vazado` baixo.

ARENA COBERTA: A ABERTURA DO TELHADO NÃO É A BEIRA DA ARQUIBANCADA (o
Mineirão; dono, 15/11/2026: "ele não é tão oval assim como você desenhou").
Por fora oval não quer dizer lance de baixo oval: procurar o mapa de
setores antes de desenhar. Lance de baixo retangular dentro de um oval = os
anéis da frente em retângulo de canto redondo (`reto`) e a parte de trás de
`normal: true` até o oval, com os cantos sem boca.

BOCA COLORIDA E NERVURA GROSSA (o Mineirão): `vomitorios: { cor, corParapeito }`
pinta a boca de acesso (as laranja do lance de baixo e as vermelhas do de
cima); `coberturasAnel[].larguraNervura` (em graus, de cada lado) engrossa a
nervura entre os gomos (as nervuras claras entre as placas solares). Arena
toda coberta: o satélite só dá o telhado; a cor da cadeira, as bocas e a
faixa dos camarotes só saem de foto de dentro. Sem foto, avisar o dono.

A ALTURA PELA FUNDURA (`inclinacao`) usa a fundura DE VERDADE de cada
coluna, da beira de dentro ao fundo pelo caminho que a escada faz
(`G.fundura`), e não a medida do centro do campo. Arquibancada reta de
fundura constante sai com o topo reto (dono, 15/11/2026, o lado leste do
Barão: "tem um desnível na arquibancada lateral que não tem sentido, deve
ser reto"). Se o topo de um lado reto fizer barriga, o erro é de contorno.

FRENTE CURVA COM MURO DE TRÁS RETO = SELA (o fundo sul do Barão de Serra
Negra; dono, 15/11/2026: "tem um desnível nos dois lados da arquibancada
atrás do gol que o satélite não captou bem"). O satélite não mostra altura.
Se as fileiras acompanham a curva da pista e o muro de trás é reto, a
arquibancada é rasa e BAIXA no meio e funda e ALTA nos dois cantos. Não
arredondar o fundo por conta: medir a fundura atrás do gol em duas linhas
do satélite e desenhar o muro lance por lance (`LINHA_RETA`, um trecho por
lance, divisa no ponto `NS` de onde a escada chega ao canto do muro). Foto
aérea oblíqua manda na altura; conferir com `vista` da mesma câmera.

ESTÁDIO OVAL DE FUNDURA DIFERENTE EM CADA CANTO (o Barão de Serra Negra):
um anel só com `normal: true` e, em cada trecho, o `fora` do QUADRANTE em
que ele está: quatro retângulos de canto redondo (`a` do lado esquerdo ou
direito, `b` de cima ou de baixo, `r` de cada canto). Vizinhos dividem o
mesmo `a` ou o mesmo `b`, então emendam nos eixos. Corte os trechos em 0,
90, 180 e 270.

MURO DE TRÁS ENVIESADO (a arquibancada que afina, o Jorjão): não faça em
degraus nem em fatias (sai serrilhado). O `fora` do trecho é uma "reta":
um círculo de 700 m de raio que passa pelas duas pontas do muro, com o
centro do lado do campo (`LINHA_RETA` na ficha do Jorjão), e o trecho leva
`normal: true`. Canto em leque entre duas funduras: um trecho só, com
`normal: true` e `fora` em elipse centrada no canto (`a` = raio do canto +
fundura de um lado, `b` = raio + fundura do outro).

COMPARE COM A FOTO DO DONO do mesmo ângulo: ponha na ficha uma `vista` no
lugar da câmera da foto e olhe as duas juntas antes de entregar. Conte os
blocos na foto duas vezes antes de mudar o que já estava certo.

ARQUIBANCADA QUE DOBRA NA PONTA (o Novelli Júnior): não faça a ponta como
bloco solto. A dobra é um trecho de canto emendado no lance (contorno
próprio com `b - r` igual ao fim do lance reto, `r` de 2 m, o `fora` com o
mesmo `r` mais a fundura, e `celula: 0.045` pra ter colunas), seguido de
uma `reta` encostada no fim do leque, com a mesma fundura e altura.

O TAMANHO DO QUADRO sai do `fora` do ÚLTIMO anel: o anel maior (o que vai
mais longe do centro) tem de ser o último da lista, senão a foto corta a
arquibancada e os marcadores caem fora (o Alfredo de Castilho).

ESTÁDIO DE ARQUIBANCADAS SOLTAS COM A GRADE NA MURETA (o Conselheiro Galvão):
o alambrado nasce no PRIMEIRO anel. Se o primeiro anel é a margem larga de
`passagem` (o Zama Maciel), a grade sai rente ao campo. Quando a foto mostra a
grade em cima da mureta do pé da arquibancada, faça o primeiro anel ser uma
`passagem` estreita (1,8 m) que começa na linha da mureta e dá a volta toda:
a cerca nasce na beira de dentro dela (`alambrado: { cor, corBase }` pinta a
grade e a mureta), o muro de fora se levanta sozinho onde não há arquibancada
e ela ainda liga os lances soltos num chão só. Os lances começam no fundo
dessa passagem.
DEGRAU PINTADO (sem cadeira) visto de frente sai cinza se não levar
`corEspelho`: ponha a cor da pintura, um tom abaixo.
Quando a pintura é um DESENHO (a cruz de malta do tobogã do Souza, feita com
`pinta`), uma cor só de espelho não serve: `espelhoPintado: true` faz cada
espelho levar a cor do degrau dele.
FOTO ANTIGA CONTRA SATÉLITE NOVO: quando as fotos do dono e o satélite
mostram épocas diferentes (cadeira na foto, bloco pintado no satélite), diga
qual é qual e o que foi feito; não escolha calado.

QUATRO ARQUIBANCADAS RETAS E SOLTAS (o Giulite Coutinho): um anel `reto` de
beira retangular comum, cada arquibancada em trechos com o seu `fora`
(`FUN(a)` nos fundos, `LAT(b)` nas laterais) e `vazio` nos cantos. Escada em
lugar medido: um trecho por vão, `escadaNaBorda: true` do segundo em diante.
Boca em cima da escada: `vomitorios: { em: [0, 1] }` (meia boca em cada
divisa; `[1]` no primeiro trecho, `[0]` no último). Gere os trechos com uma
função e confira por código que o `ate` de um é o `de` do seguinte.

ESTÁDIO EM OCTÓGONO (o Raulino de Oliveira): contorno `{ a, b, r, chanfro:
true }`: o canto é uma reta de `(a, b - r)` a `(a - r, b)`. Use no anel
`reto`. Cada canto com o seu `fora` chanfrado; em todos, `a - r` igual ao do
contorno de dentro (as laterais saem retas); os fundos partidos em 0° e 180°
pra casar com os dois cantos. Laje que avança por cima do canto: `telhados`
com o polígono inteiro.

BLOCO DESBOTADO NO SATÉLITE: cadeira escura desbotada (grená, azul) aparece
quase branca vista de cima. Não chame de branco sem foto de perto (o bloco
do meio dos fundos do Raulino é grená).
LETREIRO EM CADEIRA (`texto` no trecho): um trecho só, de ponta a ponta, sem
`escadaNaBorda` no meio; as bocas vão no pé (`f: 0`), nas pontas.

ESTÁDIO DEMOLIDO OU REFORMADO (o Godofredo Cruz): o acervo antigo de satélite
guarda edições desde 2014: `python3 -I tiles2.py <lon> <lat> 17 3 saida.jpg
wb:10` (a edição 10 é a de fevereiro de 2014; só vai até o zoom 17, 1,1 m
por ponto). Dá a planta e as medidas; o detalhe vem das fotos.
FOTO AÉREA PODE VIR ESPELHADA: se duas aéreas do mesmo lado mostram a rua em
lados opostos, uma está invertida. Desempate por uma foto com letreiro
legível e pelo satélite.
ABÓBADA DE CONCRETO: `abobadas` com `concreto: true`; `fundo: false` na fila
da frente (senão a parede de trás dela corta a arquibancada).

ESTÁDIO EM OBRA (o Serra Dourada): o satélite mostra o canteiro, não o estádio. Pergunte ao dono se ele quer o de antes ou o
do projeto ANTES de desenhar o que se vê de cima; do satélite só sai a planta.
ESTÁDIO QUASE REDONDO: contornos `{ forma: 'elipse', a, b, cu, cv }`; o anel que dá a volta inteira com cadeira vai em blocos
de ângulo igual (36 de 10 graus), gerados por função.

FAIXA ESCURA AO PÉ DE UMA ARQUIBANCADA NUMA FOTO DE LONGE pode ser o muro dela (arquibancada elevada), não um lance de
baixo: só faça dois lances com foto de perto (a principal do Antônio Accioly).
O MURO DO TERRENO: o gerador só levanta muro na beira do chão andável. O muro de fora (o da rua, o do fundo do
estacionamento) é `blocos`, pelo satélite; o dono sente falta dele na vista de cima.

O CONTORNO DO GRAMADO NO OPENSTREETMAP dá o rumo do campo, mas o centro pode estar vários metros fora (8,7 m no Jonas
Duarte, 10 m no Serra Dourada): confira as linhas do gramado no quadro e meça tudo a partir do meio de verdade.
TRECHO COM `fora` MAIS FUNDO NUM ANEL `reto`: mantenha `a - r` igual ao do `fora` do anel, senão a emenda faz dente.

FAIXA CINZA ENTRE O GRAMADO E A ARQUIBANCADA NÃO É SEMPRE PISTA: em estádio antigo pode ser a GERAL, degraus baixos e rasos
que o satélite achata (o Jonas Duarte; o dono corrigiu com uma foto de perto). Procure foto oblíqua antes de pôr `passagem`.
A geral é um anel de lance baixo (`h: [0.2, 1.7]`, `passoFileira: 0.7`, `corredor: 0`, `vomitorios: false`, `semCadeiras`),
um anel `passagem` estreito atrás (o corredor) e só então a arquibancada, com a frente alta.

COBERTURA EM CONCHA (meia cúpula atrás de um arco, o Bezerrão): `conchas: [{ cu, cv, a, b, p, vArco, base, h, cume, opacaDe,
escoras, muro }]`. O D da planta sai do satélite, mas a casca é alta e o satélite a mostra DESLOCADA (e a sombra dela parece
parte dela): meça a boca do D pelas pontas da arquibancada, que estão no chão, e peça ao dono uma foto de lado para o perfil.
ARQUIBANCADA QUE FECHA PRA TRÁS (trapézio): num anel `reto`, dê ao `fora` um `a` menor que o do `dentro`; a coluna leva a
mesma fração do lado da frente ao fundo. Arquibancadas que se cruzam em ângulo (lateral mais comprida que o vão entre as de
trás do gol) vão em ANÉIS SEPARADOS: dentro de um anel os trechos não podem repetir ângulo.

O MURO DO TERRENO ENTRA SEMPRE, SEM ESPERAR PEDIDO (o dono sentiu falta no Antônio Accioly e de novo no Bezerrão): trace no
satélite a linha branca ou a sombra fina em volta do estádio e ponha com o ajudante `MURO(pontos, altura, cor)` da ficha do
Bezerrão (um bloco fino com `giro` em cada trecho; serve pra muro enviesado e em curva). Diga o que foi estimado.

GRAMADO FORA DO MEIO DO ESTÁDIO (o Serejão: dez metros puxado pra um lado): a ficha é sempre centrada no CAMPO; o oval
das arquibancadas vai deslocado. Retângulo de canto redondo não aceita centro próprio: use os ajudantes `PTS(a, b, r, cu, cv)`
e `OVAL(...)` da ficha do Serejão, que viram contorno `forma: 'raios'` (as colunas saem radiais, e os ângulos dos trechos
continuam medidos do meio do campo: `A(u, v)` de um ponto da divisa).

O RAIO DAS PONTAS DE UM OVAL SE MEDE, NÃO SE CHUTA (o Serejão: o dono achou o campo "torto" no espaço dele): ache no quadro
o ponto mais de fora da ponta e um ponto da curva perto da reta; se o raio der igual à meia largura, a ponta é meio-círculo
inteiro (`r` = `b`). Confira pondo o desenho assado ao lado do satélite e olhando a distância das quinas do campo à beira.

FOTO TIRADA DO GRAMADO ESCONDE OS DEGRAUS DE BAIXO (o muro e o ângulo raso): não conclua dela que a cadeira desce até o
campo. Se o satélite mostra a faixa de baixo escura e a de cima clara, é cimento embaixo e cadeira em cima (o Serejão; eu
tinha descartado o satélite como "outra época" e o dono corrigiu). Satélite e foto só são "de épocas diferentes" com prova.

ARENA DE ARQUIBANCADAS SOLTAS E VÁRIOS LANCES (a Arena Pantanal): procure o MAPA DE ASSENTOS numerado antes de desenhar; ele
diz quantos blocos tem cada lance e qual é mais comprido (o de baixo costuma ser mais curto que o de cima). Cada lance é um
anel; laterais e fundos em anéis separados; o lance de cima que abre pra trás leva o `fora` mais largo que o `dentro`. Entre
o lance de baixo e o de cima costuma haver o lance curto dos camarotes: não troque por uma faixa de vidro. Cobertura plana
grande tapa o lance de cima no satélite e aparece deslocada: comprimentos e pilares saem das fotos, não da beira do telhado.
Fachada, grade e pista em curva: os ajudantes `PTS` e `FAIXA` da ficha da Arena Pantanal (um bloco girado por trecho).

COBERTURA DE TRECHO NUM LANCE `reto` FORA DO EIXO: ponha `pelaColuna: true` na `cobertura` (o Dutrinha). Sem isso ela é medida
do centro do campo e passa da ponta da arquibancada, enviesada. NÃO COMECE ESTÁDIO PEQUENO SÓ PELO SATÉLITE quando ele mostra
"um prédio comprido" colado na arquibancada: pode ser a própria arquibancada pintada de branco. Peça foto ao dono antes.

ARREDORES PADRÃO (todo estádio fora da lista dos 21 dos arredores de verdade): ponha o id em `COM_PADRAO`
(arredores_padrao.mjs) e asse com `ARREDORES=1 SO=<id>`; exija "caminho até o portão: todos" e olhe a cena com os marcadores
por cima (grades, gradis, PM, bondes). O gerador faz os 9 quarteirões, as entradas, o gradil que conduz e o cordão da PM a
partir da ficha: o MURO DO TERRENO desenhado nos `blocos` vira o contorno do que não se pisa, e os ângulos de `jogo` dizem
onde fica cada portão. Ajustes na ficha, em `arredoresPadrao: { solido, margem, portoes, entradaDe, entorno, ... }` (a
Arena Pantanal). O quarteirão do estádio é uma praça desenhada pelo gerador (calçada, ciclovia, jardins, chafariz,
estacionamento, ambulantes) e é também o que a cena de DENTRO mostra em volta do estádio: quem entra na lista tem de regravar
as duas cenas, e o `entorno` desenhado à mão na ficha deixa de aparecer. `soFora: true` é do estádio em que os setores não se ligam por dentro: a briga da arquibancada abre aqui.

A CENA DE ARREDORES SE TESTA ANDANDO, NÃO SÓ PELA MÁSCARA (16/11/2026): a linha
"caminho até o portão: todos" do assar.js só diz que existe passagem na máscara.
Ela não vê fila indiana, gente presa no gradil, bonde que não acompanha o líder
nem portão em que não se entra: tudo isso só apareceu rodando a chegada no jogo.
Depois de gravar os arredores de um estádio, abrir a bancada da chegada
(`node ferramentas/chegada/montar.js <pasta>` e servir a pasta) e ver os cinco
bondes irem até o portão, de mandante e de visitante. O gradil conta três células
de espessura no mapa de rota: abertura estreita demais some.

NADA PARADO NA CALÇADA, RENTE AO GRADIL (16/11/2026): posto de PM, barraca ou
poste do lado de fora do gradil, na calçada, fica no caminho de quem vem rente a
ele. O torcedor não atravessa PM e o campo de rota não desvia de PM: forma fila
atrás dele. Posto de portão vai do lado de dentro do gradil, ao lado do funil.

GRADIL QUE FECHA TEM DE ENTRAR NO QUE ELE FECHA (16/11/2026): gradil que acaba
"na altura" da parede deixa fresta, e o campo de rota passa por qualquer fresta em
que caiba uma célula. O funil do portão e o cordão seguem alguns metros pra dentro
do sólido do estádio. E "caminho até o portão: todos" não basta pra saber se o
bonde chega em tempo: conferir de que rua cada bonde nasce (a caminhada, não a
linha reta) e rodar a chegada com a visitante por último.

ESTÁDIO COM COBERTURA NO ANEL INTEIRO E PISTA (o Mangueirão, 16/11/2026): do
satélite só se vê uma faixa estreita de arquibancada; a faixa escura entre o
verde e a cobertura é sombra, não é a medida do lance. A PISTA dá a conta: a
reta de fora de uma pista de oito raias fica a 46,3 m do eixo e a ponta a
88,5 m do meio, então a mureta está pra fora disso. A fundura de cada lance sai
das fileiras contadas nas fotos (0,85 m por fileira), repartida entre a mureta e
a volta de fora. Foto tirada de dentro e do alto mostra as cadeiras E o tampo da
cobertura ao mesmo tempo: não quer dizer que a arquibancada é descoberta.
O MAPA DE RUAS vem de api.openstreetmap.org (map?bbox=...); o Overpass não
responde daqui. Desenho nas cadeiras que não é letra: `pinta(x, y, rnd)`.

COBERTURA: ANTES DE REPARTIR EM PEDAÇOS, VER DE FORA SE ELA É UMA SÓ (o
Mangueirão, 16/11/2026): do satélite e das fotos de dentro eu li "alta nas
laterais, baixa nas pontas" e fiz quatro lajes com degrau entre elas; a foto de
fora mostrou um anel contínuo em sela. Cobertura que muda de altura ao longo da
volta é `alturas: ang => [fora, dentro]` num anel só, não vários anéis.

FACHADA NÃO É PAREDE (o Mangueirão, 16/11/2026: "voce fez só um bloco liso"):
antes de fechar o lado de fora, olhar uma foto de fora. Estádio de concreto
antigo tem andares de galeria abertos: `fachada.galerias` (lajes com a beira
branca, vão escuro, pilares recuados, o anel da rampa). Parede lisa só onde a
foto mostra parede lisa.

LANCE QUE MUDA DE ALTURA AO LONGO DA VOLTA (o Mangueirão, 16/11/2026): o gerador
conta as fileiras de um trecho pela fundura do MEIO dele. Lance fundo no meio da
lateral e raso atrás do gol, num trecho só, sai com as mesmas fileiras em tudo.
Cortar em blocos (um trecho por bloco, `escadaNaBorda: true`, `corredor: 0`),
com o contorno do fundo no desenho de verdade (ali, uma elipse). Olhar numa foto
de dentro se a linha do alto do lance é reta ou em arco antes de escolher o oval.

SATÉLITE SEM IMAGEM (Marabá, 16/11/2026): se o ladrilho da Esri vier cinza com
"Map data not yet available", descer o zoom não resolve; troque a fonte (os
ladrilhos de satélite do Google, mesma conta de x, y e zoom). Confira a data: o
do Zinho de Oliveira é de antes da reforma, e as fotos do dono mandam.
COBERTURA MAIS ALTA NA FRENTE: `cai` negativo na `cobertura` do trecho; ponha
`trelica: false`, senão a treliça sai por cima da telha.

DUAS ARQUIBANCADAS IGUAIS QUE O SATÉLITE MOSTRA DE FUNDURAS DIFERENTES (o Carlos
Zamith: 16 m numa, 12 na outra): a imagem é oblíqua e o alto de cada uma sai
deslocado pro mesmo lado, alongando uma e encurtando a outra. A fundura de
verdade é a média; a diferença, dividida por dois, dá o deslocamento do topo.
CLUBE DE ESTÁDIO NOVO SEM DONO DITO: pergunte ao dono quem manda nele antes de
mexer nos dados (no Zamith, a resposta tirou os dois clubes da Arena da Amazônia).

ARQUIBANCADA VISTA POR TRÁS PARECE PRÉDIO (a Colina, 16/11/2026): numa foto de
drone tirada de trás de uma arquibancada só aparecem a fachada e a beira do
alto; os degraus ficam escondidos. O satélite decide: listras de escada e boca
no meio são arquibancada. Diga ao dono que é leitura sua.

ARQUIBANCADA PINTADA POR SETOR (o Joia da Princesa, 16/11/2026): um trecho por
setor, com `escadaNaBorda: true`, `corredor: 0` e `espelhoPintado: true`; os
ajudantes `VM`, `BR` e `VD` da ficha dele encurtam a lista. Anote de que foto
saiu a cor de cada setor e diga ao dono quais são chute.
ENFEITE REPETIDO AO LONGO DO MURO DE FORA (pilastras, quadros, cobogó): o
ajudante `muroDeFora(contorno, passo)` da mesma ficha percorre as retas e os
arcos do retângulo de canto redondo e devolve os blocos já com o `giro`.

FIGURA PINTADA NO DEGRAU (o leão do Barradão, 16/11/2026): NÃO INVENTE A
SILHUETA (a primeira, inventada, o dono achou "muito feio"). Amplie a foto umas
seis vezes com uma grade de pixels, trace o contorno ponto a ponto (uns
sessenta) e tire a perspectiva: `x` é a fração entre as duas escadas que fecham
o setor (cada escada com a sua inclinação na foto), `y` a fração entre a beira
de baixo e a de cima da zona pintada. Desenhe o polígono solto e compare com a
foto antes de assar. Veja em que SETOR a figura fica (entre quais escadas) e
faça desse setor um trecho, com `escadaNaBorda`, pra escada não cortar o
desenho; no `pinta` o `x` já é a fração do trecho. Asse uma vista de frente
(uma cópia da ficha com outra `vista`) pra conferir.
LANCE DE CIMA ENCOSTADO NO DE BAIXO: a mureta do lance de cima (1,1 m) aparece
como uma tira entre os dois; dê a ela a cor do lance de baixo (`corMureta`).
LISTRA PINTADA NO DEGRAU NÃO É CADEIRA: cadeira escura em piso claro sai cinza
salpicado; pra listra aparecer, `semCadeiras` com `espelhoPintado` e `corPiso`
escuro.
FAIXA DE OUTRA COR NA ARQUIBANCADA NÃO É OUTRO LANCE (o Barradão; o dono: "é só
cor diferente mesmo, com as escadas contínuas"): se as escadas da foto sobem
direto de uma cor pra outra, é UM anel só e a faixa vai no `pinta` (por fração
da subida). Dois anéis só quando há muro, corredor ou mudança de inclinação
entre as duas partes. Onde há cadeira em cima do degrau pintado,
`pisoPintado: true`.
ARQUIBANCADA EM U DE CANTO CHANFRADO: três contornos de canto redondo (beira,
fim das cadeiras, fundo) com `r` crescendo pra fora, anéis `reto`, e o ajudante
`U(contorno, fundo1, canto, lateral, fundo2)` da ficha dele, que tira os ângulos
das pontas dos lados retos. O lado aberto é um trecho `vazio`.
O CONTORNO DO GRAMADO NO OPENSTREETMAP PODE INCLUIR A GRAMA DE FORA DO CAMPO (no
Barradão, 40 m de grama até o prédio): o meio do campo é o do círculo central.

COBERTURA DE LONA EM ALMOFADAS (a Fonte Nova, 16/11/2026): na `coberturasAnel`,
`bojo` com `almofadas: 3` (fileiras da boca à beira) e `recorte` (a beira de
dentro recortada); `bordaFora` é o anel chato de concreto; `mastros` com `f` no
terço de fora dá os postes com os tirantes; a passarela de luz é um `aneis` com
`dh` negativo. Conte os vãos e as fileiras numa foto aérea.
COBERTURA ALTA NO SATÉLITE OBLÍQUO sai deslocada inteira (12 m na Fonte Nova): a
boca e a beira de fora deslocam igual; use os semieixos e centre no campo.
ESTÁDIO EM FERRADURA: o lado aberto é `passagem` no anel de baixo e `vazio` nos de
cima; as `galerias` da fachada levam `de` e `ate`. A cobertura pode dar a volta
inteira mesmo assim (olhe uma foto de dentro virada pro lado aberto).
CADEIRA QUE DE LONGE É UMA MANCHA DE COR (arena de cadeira colorida):
`pisoPintado: true`, senão o concreto entre as cadeiras apaga a cor.
COR DE CADEIRA DEBAIXO DE COBERTURA: o nível de cima fica na sombra e parece de
outra cor (na Fonte Nova li verde onde é o mesmo azul claro de baixo). Compare
os níveis numa foto em que os dois estejam na mesma luz antes de dar cor nova.
SOMBRA EM CONCRETO BRANCO SAI AZUL NA FOTO (o Almeidão, 17/11/2026: fiz azul a
lateral da cobertura, que é do mesmo concreto da outra). Arquibancada que só
aparece na sombra NÃO ganha cor própria: fica da cor da vizinha que está no sol,
a menos que uma foto com sol nela mostre outra coisa.

DEGRAU EM BLOCOS DE DUAS CORES ALTERNADAS (o Mendonção, 16/11/2026): `padrao:
'blocos'` com `cor`, `cor2` e `bloco` — o bloco sai com 1,7 vez o número dado em
metros (pra 13 m, `bloco: 7.6`); sem `blocoFileiras` a faixa vai do pé ao alto.

FORMATO QUE NÃO É OVAL NEM RETÂNGULO (o Rei Pelé, 16/11/2026: tiras retas atrás
dos gols e uma lateral em arco de círculo): meça no quadro a beira de dentro e
a de fora em vários `u`; se a fundura cresce pro meio, ajuste um círculo a cada
beira (três pontos bastam) e monte o contorno por pontos, `forma: 'raios'`
(ajudantes `POLI` e `D` da ficha dele). Arquibancada solta do resto vai em
anéis próprios. Num contorno `raios` as colunas saem radiais: numa tira reta
longe do centro as escadas ficam inclinadas (diga ao dono).
DE QUE LADO FICA CADA COR: numa foto oblíqua, veja o que está à esquerda e à
direita de quem olha (olhando pra -u, o lado de +v fica à direita) antes de
decidir qual fundo é o da foto.
TESTEIRA DE OUTRA COR NA BOCA DO TELHADO: `corFrente` na `cobertura` do trecho.

O QUE SÓ A FOTO DE DENTRO MOSTRA (o Rei Pelé, 16/11/2026): quantos NÍVEIS há
debaixo de uma cobertura (do satélite pareciam dois, eram três, com um muro
entre os de baixo); se a cobertura é laje ou telha com treliça (`trelica:
false`, `corBaixo`); e se uma faixa de cor é ao comprido ou é ESCADA pintada
(no satélite as duas parecem riscos). Peça ou procure uma antes de fechar.
ESCADA PINTADA QUE PRECISA APARECER: um trecho estreito (2,6 m) de degrau da cor,
com `espelhoPintado`, entre dois trechos comuns.

COBERTURA QUE MUDA DE ALTURA AO LONGO DA VOLTA (o declive da laje do Rei Pelé,
16/11/2026): a `cobertura` do trecho só tem uma altura; use uma `coberturasAnel`
com `de`, `ate` e `alturas: ang => [fora, dentro]` (um degrau suave entre a
altura do meio e a das pontas). E NÃO LEVE UM NÍVEL PELA VOLTA TODA SEM OLHAR
CADA LADO: o lance de cima pode existir só na lateral; atrás dos gols, no lugar
dele, uma galeria (`tipo: 'passagem'` com `alt`).

O QUE O SATÉLITE E A AÉREA ENGANAM EM ESTÁDIO PEQUENO (o Fumeirão, 16/11/2026,
feito sem foto e corrigido três vezes): degrau claro em panos parece TELHA;
pintura do degrau não se vê; dois lances com uma faixa branca no meio parecem um
só; e ARQUIBANCADA VISTA POR TRÁS SOME atrás das placas de publicidade (numa
aérea tirada de fora só aparecem as placas e a fachada). Sem foto de dentro,
diga ao dono que a versão é provisória; e não tire uma arquibancada que o
satélite mostra só porque uma aérea de fora não a mostra.
ARQUIBANCADA QUE DOBRA NUM CANTO SÓ: anel próprio com contorno de canto redondo
(`r` igual à curva) e um trecho pro canto, em leque; as outras, de canto vivo,
ficam noutro anel. PLACAS DE PUBLICIDADE EM FILA: o ajudante `PLACAS(u0, v0, u1,
v1, y)` da ficha dele.

MARGEM DE GRAMA OU AREIA MAIOR DE UM LADO (o Lacerdão, 17/11/2026): a beira comum
é a do lado estreito; do lado largo entra um anel `passagem` só naquele trecho
(os outros `vazio`), e as arquibancadas daquele lado começam na beira dele.
TRIBUNA COBERTA COM PILAR NA FRENTE: a `cobertura` só põe pilar atrás; os da
frente são `blocos` finos em fila.

ARQUIBANCADA ESCURA VISTA DE CIMA PARECE TELHADO (o Lacerdão, 17/11/2026, a lateral
maior lida como cobertura): AMPLIE a aérea antes de decidir — telhado é liso ou
em gomos; arquibancada tem fileiras finas e pintura (triângulo, escudos). E
descubra DE ONDE A AÉREA FOI TIRADA: o que está em primeiro plano é o fundo de
uma arquibancada visto por trás (muro, vãos, placas), não um prédio. Com as
fotos de dentro, amarre os lados pelo que fica atrás de cada arquibancada (no
Lacerdão, o hotel da avenida atrás da de faixas brancas).
ESCUDO PINTADO NO DEGRAU, simplificado: o ajudante `escudo(x, y, cx, cy, r, L, F)`
da ficha dele (um anel com miolo), dentro do `pinta`.

LANCE QUE FECHA PRA TRÁS FORA DO MEIO DO CAMPO (a tribuna triangular do Lacerdão,
17/11/2026): `fecha: k` no trecho (a fileira do fundo com `k` vezes a largura da
da frente, em volta do meio do TRECHO). A `cobertura` do trecho fecha junto: se o
telhado é retangular, faça com `blocos` (`cobertura: true`). O chão andável
continua retangular; tape os dois cantos com blocos na altura do pé do lance.
"FORMATO DE TRIÂNGULO" DITO PELO DONO: antes de escolher o que é triangular
(parede, planta, pintura), procure a foto de FRENTE daquele lance.

ARQUIBANCADA BAIXA ATRÁS DE MURO NÃO APARECE NA AÉREA (o Cornélio de Barros,
17/11/2026): o lado que parece só "muro e bancos de reserva" pode ter seis
degraus de cimento; procure a sombra em degraus no satélite e uma foto tirada
do outro lado antes de deixar o lado vazio.
TRÊS SETORES DA CASA NO MESMO LADO DÃO TRÊS PORTÕES COLADOS e os bondes cruzam o
funil do vizinho (dez travessias no teste de chegada): espalhe os setores por
lados diferentes quando houver arquibancada.

ARQUIBANCADA QUE NÃO É RETÂNGULO (o Cornélio de Barros, 17/11/2026; o dono: "varia
de tamanho ao longo do comprimento dela"): em estádio encaixado entre casas o
fundo acompanha a divisa do lote. AMPLIE o satélite três vezes e meça o fundo
nas DUAS pontas e no meio de cada arquibancada antes de dar um número só;
procure degrau (duas metades de fundura diferente) e fundo inclinado. Na ficha:
`fora` por pontos (`POLI`), `normal: true` no trecho e `inclinacao` no anel
(com `inclinacao: null` nos trechos que não devem segui-la); um trecho por vão
entre escadas, com as escadas onde o satélite mostra.

ESTÁDIO INACABADO (o Amigão, 17/11/2026: os dois fundos são degraus de terra com
mato): trecho `semCadeiras` de mosaico terra e mato, com `h` mais baixo que o
das arquibancadas vizinhas, sem escada nem boca, e nenhum setor de `jogo` nele.
TRAVESSIA ACUSADA PELO CONFERIDOR: olhe o tamanho do passo (`cruza.js` imprime os
dois pontos). Passo de mais de 100 px entre duas amostras cortando o bico de um
funil é a corda da amostragem, não travessia; passo curto é de verdade.

CORREDOR HORIZONTAL NÃO É DIVISA DE ANDAR (o Amigão, 17/11/2026; o dono: "visto de
longe parece diferença de andares"): faixa clara no meio de uma arquibancada,
com as bocas em cima, é um corredor de circulação num lance só. Um anel, a faixa
no `pinta` (por fração da subida), `vomitorios.f` logo acima dela. Dois anéis só
com muro alto entre as partes, visto numa foto de perto.
PEÇAS ESPALHADAS NUMA CURVA (os pilares dos fundos do Amigão): gere os `blocos`
na ficha, com o ponto no ângulo e na fração entre as duas elipses (os ajudantes
`raio` e `PT` da ficha dele, que valem pra elipse fora do meio).

DEGRAU PINTADO EM ZIGUE-ZAGUE (o Marizão, 17/11/2026): o ajudante `ZIGUE(L, F)` da
ficha dele, no `pinta` — faixas brancas que sobem e descem com uma onda
triangular ao longo do comprimento (`L` e `F` em metros, pra onda ter o mesmo
tamanho em trechos de larguras diferentes).
FOTOS DE ÉPOCAS DIFERENTES (o Marizão: a de drone sem o telhado, a aérea com ele,
a de dentro com outra pintura): diga ao dono de qual saiu cada coisa.
CLUBE QUE GANHA ESTÁDIO: troque os dados ANTES de rodar o teste e REGRAVE a cena
do estádio de onde ele saiu, senão o jogo ainda abre o antigo pra ele.

DESENHO PINTADO NO DEGRAU (o escudo do Frasqueirão, 17/11/2026): cada casa da
grade tem perto de 1 m, então um escudo de 13 m só comporta uma camada de
contorno, a faixa e as estrelas (com contorno preto, branco e miolo, virou um
borrão). Ponha o desenho ENTRE duas escadas (a escada corta a pintura) e
confira com uma `vista` de frente, de perto, antes de assar no jogo.
FOTO DE FRENTE DE UMA ARQUIBANCADA: a direita e a esquerda dela são as de quem
está no campo. Pra de baixo do quadro, ficam trocadas em relação ao quadro (as
cadeiras pretas do Frasqueirão foram pra ponta errada na primeira prova).
PRÉDIO ATRÁS DA ARQUIBANCADA (os camarotes do Frasqueirão): o satélite mostra o
telhado por cima de tudo e engana na fundura. A foto de frente diz se o degrau
passa por baixo do prédio (aqui passa, com a mesma fundura de ponta a ponta).

LETREIRO PINTADO NO DEGRAU (o Nogueirão, 17/11/2026): o ajudante `LETREIRO` da
ficha dele desenha o texto no `pinta`, com letras de 7 linhas, uma casa por
lugar. O gerador NÃO conta os lugares pelo comprimento em metros do trecho: num
anel `reto` ele usa o arco e a fundura vistos do meio do campo, então um trecho
de 46 m longe do meio saiu com 53 lugares e 11 degraus. Meça na prova (um
`console.error` dentro do `pinta`, que o `assar.js` repassa) e acerte com
`celula` e `passoFileira` no trecho; com uma coluna a menos o H vira F. Sem
escada no trecho do letreiro (`corredor: 0`).
ESTÁDIO DEMOLIDO (o Nogueirão): o satélite novo mostra o terreno vazio. O da
Esri em zoom 18 ou 17 costuma guardar a imagem antiga, e o contorno do
OpenStreetMap continua lá.

COBERTURA EM PÉTALAS (a Arena das Dunas, 17/11/2026): `petalas` na
`coberturasAnel` — `{ fenda, passos, fatias, crista, curva, testeira, opacaDe,
corFenda }`. Cada gomo de `angulos` vira uma casca de duna; `alturas(ang)`
devolve `[fora, dentro, crista]` e vale pro meio da pétala (elas ficam em
degraus). Uma `coberturasAnel` pra cada grupo de pétalas de mesma boca e mesma
beira (oeste, leste, norte, sul). `curva: 2` dá a duna redonda; 2,6 sai
quadrada. `opacaDe` é a fração a partir da qual a pétala aparece inteira na
vista de cima (o fundo do anel de cima).
O SATÉLITE INCLINA O QUE É ALTO: as fendas de uma cobertura de 40 m aparecem
até 18 m fora do lugar, e mais do lado mais alto. Meça as arquibancadas pelo
pé, e centre a cobertura nelas.
A FRAÇÃO DO SETOR (`jogo.fracao`) é medida do primeiro anel (a grama em volta
do campo) até o último (o pódio de fora). Com esplanada e pódio na ficha, 0,5
cai fora das cadeiras: calcule a fração do meio do anel onde a torcida fica.
OS ÂNGULOS DOS TRECHOS de um anel têm de dar 360 sem se sobrepor: um trecho
errado por cima de outro some sem aviso (o anel de cima das Dunas saiu certo
por acaso na primeira prova).

ANEL DE CIMA EM BLOCOS COM FENDAS (a Arena das Dunas, correção do dono): o
ajudante `BLOCOS(angs, mais)` da ficha dela — um trecho por vão, com `fecha` e
um `vazio` estreito de cada lado; por baixo, um anel `passagem` do mesmo
contorno faz o piso que aparece nas fendas. NÃO desce arco pela fenda: a faixa
translúcida entre duas pétalas fica só na cobertura (eu pus um arco descendo
até a arquibancada e o dono mandou tirar; num recorte de perto, uma faixa da
cobertura vista de baixo parece uma peça que desce).
FAIXAS ENTRE DOIS ANÉIS (os camarotes das Dunas): o muro da frente de cada anel
vai do chão até 1,1 m acima do primeiro degrau, e o que fica na frente esconde
o de trás. Empilhe anéis estreitos, cada um um pouco mais pra fora e mais alto
que o anterior: cada muro só aparece acima do topo do muro da frente. Um trecho
`passagem` não tem muro; use um degrau só (`LAJE`).
AS DUAS LATERAIS PODEM SER DIFERENTES: confira cada uma numa foto antes de
copiar a de um lado pro outro, e ache qual é qual por um prédio de fora que
apareça numa foto de dentro e na aérea.

MURO DE FORA EM LISTRAS (o Presidente Vargas, 17/11/2026): três anéis finos de
um degrau, um na frente do outro, cada um mais baixo que o de trás. O muro da
FRENTE de cada um sobe 1 m acima dele e encosta no muro de trás do anterior:
dê a ele a cor do anterior (`corMureta`) e deixe-o mais baixo, senão as duas
cores brigam na mesma parede e a listra sai em pedaços.
ANEL RETO DE CANTOS REDONDOS, VOLTA INTEIRA: o ajudante `VOLTA(d, reta, mais)`
da ficha do PV dá as quatro retas e os quatro cantos de um anel `reto` (os
ângulos mudam de anel pra anel, porque são medidos na beira de dentro).
LETREIRO NUM BLOCO: a face do `textoFace` olha pra `+u`; `giro: 90` vira pra
`+v` e `giro: -90` pra `-v`.
TELHADO SOBRE COLUNAS COM ARCO (a tribuna do PV): `cobertura` no trecho com
`cai` negativo (a frente no alto) e `arcos` com `pilar` pras duas colunas.

FAIXA NO MEIO DA ARQUIBANCADA NÃO É SEGUNDO ANDAR (o Amigão, e de novo o
Presidente Vargas, 17/11/2026): de longe, um corredor, uma fila de bocas ou um
corrimão corrido parecem a divisa de dois lances. Sem uma foto de perto, faça
UM lance e diga ao dono que a faixa pode ser outra coisa.
BOCA EM Y E FERROS DE PROTEÇÃO (o Presidente Vargas): `vomitorios: { emY: true,
asa: 3.6, f, larg, fundo, corParapeito }` faz a caixa com um patamar de cada
lado, a escada do meio só pra baixo e duas subindo das pontas; `grade: { cor }`
no trecho põe o corrimão na fileira do alto das caixas (ou em `f`).

ALAMBRADO DE VIDRO (o Presidente Vargas): `alambrado: { cor, corTela, opacidade,
limiar }` na ficha. Ele nasce na beira de dentro do PRIMEIRO anel: se a
arquibancada é colada no gramado, ponha o anel dela antes do anel da grama, e
baixe o `limiar` (o padrão, 8 m, pula o trecho perto da linha de fundo).
GRADE NO ALTO DA ARQUIBANCADA: `gradeFundo: { alt, cor }` no trecho, com
`parapeito` baixo.
FACHADA DE HOJE: foto antiga de acervo pode trazer outra pintura por fora (o PV
de 2011 era azul com listra laranja; hoje é de painéis cinza com faixa azul).
Sem foto recente da rua, diga ao dono de que ano é a fachada que você fez.

QUAL LADO É QUAL NUMA FOTO DE DENTRO: girando pra direita, a ordem é sempre
fundo norte, lateral leste, fundo sul, lateral oeste. Se a foto mostra
"fundo, torre, lateral", o canto é o nordeste ou o sudoeste; "lateral,
torre, fundo", o sudeste ou o noroeste. Desempate por uma coisa que o
satélite mostre só de um lado (boca de acesso, cor do degrau, telhado).
DEGRAU PINTADO DE BRANCO parece telhado no satélite: confira se as escadas
aparecem por cima (aparecem no degrau; o telhado as esconderia).
ARQUIBANCADA ESPELHADA NA SOMBRA: não copie as bocas da gêmea; diga que não
viu (o fundo sul do Giulite Coutinho não tem as bocas do norte).

LADOS DE FUNDURA DIFERENTE NO MESMO ANEL (o Ary de Oliveira e Souza): cada
trecho leva o seu `fora` e a sua `inclinacao`. Pra reta não sair torta, o
`fora` de um lado tem de ter `a - r` (ou `b - r`) igual ao do contorno de
dentro. No canto entre um lado raso e um fundo, parta o lado raso no meio
(em 0°, 90°, 180° ou 270°, onde os dois contornos dão o mesmo ponto): a
metade de lá usa o fundo raso, a de cá já usa o fundo do lado fundo; o canto
usa o do lado fundo. Com `inclinacao`, a curva sobe sozinha de uma altura à
outra.
FOTO DE DRONE: antes de ler os lados, ache em cada foto o norte pelo
satélite (rua, telhado, casas). Muro visto por fora esconde degrau baixo.

### O alambrado e o muro (nascem sozinhos)

- O **alambrado** corre pela beira de dentro do PRIMEIRO anel: do chão onde
  o anel é `passagem`; em cima da mureta onde é arquibancada a mais de 8 m
  da linha do campo. Pra ele sair em volta do gramado, o primeiro anel tem
  de ser o piso entre o gramado e a arquibancada.
- O **muro** fecha onde o chão andável acaba sem parede (fundo e pontas de
  lance, beira e pontas de piso, fundo e lados de `reta`).
- `alambrado: false`, `muro: false`: desligam (arenas).
  `alambrado: { h, cor, corBase, limiar }`, `muro: { cor }`: ajustam.

### `retas`: bloco reto de cadeiras fora de anel

`{ u, v, ang, comp, prof, h: [h0, h1], base, ...pintura do trecho }`:
`(u, v)` é o meio da beira da frente, `ang` pra onde ela sobe, `comp` de
ponta a ponta, `prof` da frente ao fundo. Anda-se nela, mas os setores do
jogo só nascem em `aneis`.

### Coberturas inteiras

- `coberturasAnel: [{ fora, dentro, h, cai, n, cor, cor2, corNervura, bordaFora: { larg, cor }, bordaDentro: { larg, cor }, bojo, fenda }]`:
  anel de cobertura em gomos, do contorno de fora até a boca de dentro
  (`cai` negativo sobe de fora pra dentro).
  COBERTURA DE UMA LATERAL SÓ, COM ESTRUTURA (o Raulino de Oliveira): `de`,
  `ate` limitam o arco; `angulos: [..]` dá as divisas dos painéis (calcule
  pelos pontos da beira da frente, a cada 6 m); `normal: true` faz cada
  divisa sair perpendicular à beira da frente (`dentro` tem de ser retângulo
  de canto redondo ou chanfrado; `fora` pode ser qualquer contorno, até um
  polígono lido raio a raio com `forma: 'raios'`); `beiral: [fora, dentro]`
  é a altura da testeira (telha fina: 0,35); `pilares: { f, base, cor, esp,
  cada, viga }` põe o pilar em cada divisa e a viga por baixo; `mastros: {
  f, h, abre, cor, esp, cada }` põe o cavalete em A com os dois tirantes.
  NÃO faça cobertura de arquibancada com `telhados` (chapa solta no ar, sem
  apoio): o dono recusou. `telhados` é pra laje de prédio e marquise.
- `folhas: [{ fora, dentro, n, bojo, fenda, cor, cor2, perfil: [[f, altura, largura], ..] }]`:
  folhas abauladas (o Beira-Rio).
- `abobadas: [{ u, comp, vFrente, vFundo, n, bojo, cor, cor2, perfil: [[f, altura], ..] }]`:
  fileira de cascas ao longo de uma lateral reta (o Romeirão).

- `telhados: [{ pontos: [[u, v], ..], furo: [[u, v], ..], y, h, cor, cobertura }]`:
  telhado em polígono, com o vão do meio opcional (o oitavado do Heriberto
  Hülse). Sai transparente na foto de cima; `cobertura: false` deixa opaco.

### Peças soltas

- `blocos: [{ u, v, w, d, h, y, cor, giro, cobertura: true, texto, corTexto }]`:
  caixas (prédio, telão, tribuna, banco de reserva). `w` em `u`, `d` em
  `v`, `h` a altura, `y` a altura do pé. `cobertura: true` faz o bloco
  sair transparente na foto de cima (use em teto). `texto` pinta um
  letreiro em cima.
- `refletores: [[u, v, altura], ..]`, `porticos: [{ ang, larg, h }]`.
  `textoFace: true` num bloco escreve o `texto` em pé, na face que olha pra
  `+u` (girada com o `giro`): letreiro de fachada. Janelas são blocos finos
  e escuros encostados na fachada (o Moisés Lucarelli gera as dele em volta
  do centro da curva).
  Um quarto número no refletor (`[u, v, altura, pe]`) faz o poste nascer na
  altura `pe` (em cima da cobertura) em vez de vir do chão.
- `fachada: { cor, pilares: { n, h, pe, topo, esp, fundo, cor, contorno } }`.
- `campo.pista: { dentro, fora, cor, raias }` e `campo.corFosso`: pista
  de atletismo.
- `passarelas: [{ u, v, w, d, cor }]`: chão plano andável.

### `entorno`

`{ tipo: 'predio', u, v, w, d, h, cor, cor2 }`, `{ tipo: 'casas', u, v, nu, nv, passo }`,
`{ tipo: 'rua', de: [u, v], ate: [u, v], larg }`, `{ tipo: 'arvores', u, v, w, d, n }`,
`{ tipo: 'estacionamento', u, v, w, d, cheio }`, `{ tipo: 'piscina' | 'quadra' | 'grama' | 'agua', u, v, w, d, cor }`,
`{ tipo: 'cupula', u, v, r, h }`.

### `jogo`: onde fica cada torcida

```js
jogo: { mandante1: [160, 200], mandante2: [70, 110], mandante3: [250, 290], visitante: [10, 42],
        tunelMandante: 180, tunelVisitante: 26, folgaPM: 5,
        fracao: { mandante1: 0.2 }, torcidas: { id_da_torcida: 'mandante1' } }
```

Cada setor é uma faixa de ângulo onde EXISTE arquibancada. `mandante1` é
o setor da maior torcida da casa. `visitante` vira um curral fechado por
duas grades. `fracao` diz em que altura da arquibancada o bonde fica (0 =
na frente, 1 = no fundo; padrão 0,5). Vale também pros bondes da
visitante (`visitante1`, `visitante2`, `visitante3`). `torcidas` fixa uma torcida num
setor (os ids estão em `cenario3d/js/jogo.js`, procure por
`"clubeId": "<clube>"`).

As GRADES DOS ESCANTEIOS nascem sozinhas (uma por canto, pela linha mais
curta de chão perto do canto, fora dos setores das torcidas). Confira na
briga de teste se nenhuma ficou num lugar estranho; `gradesCanto: false`
no `jogo` desliga.

## Os acessos: por onde o público entra

Não ponha boca de vomitório por padrão. Olhe, em cada arquibancada, por
onde se entra (o satélite mostra os quadrados escuros; as fotos de dentro
mostram os túneis):

1. **Boca no meio do lance** (o túnel que sai de baixo da arquibancada):
   `vomitorios: { f, em: [..] }`, nos lugares que a foto mostra.
2. **Corredor na frente**, ao pé do lance: `corredorFrente`.
3. **Por cima** (galeria ou passarela atrás do último degrau, como no
   Couto Pereira e no Barradão): um anel só de trechos
   `{ tipo: 'passagem', alt }` encostado no fundo do lance, e
   `vomitorios: false` no lance. Lance, galeria, lance, galeria, lance são
   cinco `aneis` encostados; as caixas de escada da galeria são `blocos`
   baixos e escuros em cima do piso.
4. **Pela ponta** (escada lateral): nada no meio do lance.

Sem prova na foto ou no satélite, `vomitorios: false`.

**Estádio de dois andares** (arena): o padrão é o dos cortes de
arquitetura. O lance de BAIXO não tem boca: atrás da última fileira passa
o anel de circulação, e o público desce dele (`vomitorios: false` e um
anel de `passagem` com `alt` encostado no fundo). Por cima desse anel
ficam os camarotes. O lance de CIMA tem a boca no lance, a um quarto ou um
terço da altura (`vomitorios: { f: 0.3, cada: 2 }`).

`vista: [u, altura, v, alvoU, alvoAltura, alvoV]` na ficha pede uma foto de
perto na conferência (`_perto.jpg`), pra olhar uma fachada.

Arquibancada com MENOS degraus num trecho (atrás de um gol): o trecho leva
um `dentro` mais pra fora e o `h` só da parte de cima; na frente dele, um
trecho `passagem` no mesmo ângulo fecha o chão.

## Os arredores de verdade (só nos estádios da lista do dono)

1. `python3 ferramentas/estadios/osm_arredores.py <id> <lat> <lon> <norte> 250 210` (lat e lon do MEIO DO CAMPO; confira o
   `norte` da ficha pelo contorno do gramado que o mapa traz: se as ruas saírem tortas no quadro, é o `norte`).
2. Sobreponha as ruas ao satélite no quadro e meça onde ficam as fachadas; acerte a ficha antes de pôr portão.
3. Na ficha, `arredores: { osm, quadro: { u, v, cu, cv }, limite, soFora, pisos, portoes, bondes, grades, filas, pm, muros,
   predios, entorno, vista }` (o cabeçalho de `arredores.mjs` explica cada um; a do Independência é o exemplo).
4. `ARREDORES=1 FICHA=... CONF=... node ferramentas/estadios/assar.js` pra conferir; sem `FICHA`, com `SO=<id>`, grava no jogo.
   A linha tem de terminar em "caminho até o portão: todos".
Procure a lista de portões e setores do estádio ANTES; o que a fonte não disser (o ponto na fachada), diga que é seu.

## O que conferir antes de entregar

**Antes de desenhar** (a lição da Vila Belmiro, que precisou ser refeita):

- Procure o MAPA DE SETORES do clube (busca de imagem: "<estádio> mapa de
  setores ingressos"). O nome de cada setor diz o que ele é e quem fica
  nele: "cadeira coberta" debaixo de uma "arquibancada" explica uma faixa
  escura que no satélite parece telhado; "visitante" diz onde fica a
  torcida de fora.
- Amplie o satélite LADO POR LADO (recorte de cada lado a 200%) antes de
  medir. Na vista inteira os setores pequenos, as escadas e as bocas somem.
- Letreiro nas cadeiras só entra se aparecer no satélite ou numa foto
  recente. Foto de dentro costuma ser antiga.
- Rua enviesada atrás de um lado dá laje em trapézio e fundo em degraus:
  não endireite.
- "Telhado no satélite não é arquibancada" vale também ao contrário (o
  Anacleto Campanella): mancha lisa e inclinada, de cor de chapa, encostada
  no alambrado, pode ser a própria arquibancada tubular. Arquibancadas
  tubulares são planos retos e separados: use `retas`, uma por lance, cada
  uma no seu ângulo. Na dúvida, mostre ao dono as duas leituras.
- Se o satélite pega o estádio EM REFORMA (o Maião), tire dele só as medidas
  e use as aéreas mais recentes pro que existe hoje; diga isso ao dono.
- Faixa escura na frente de um telhado alto pode ser a SOMBRA dele, não
  cadeira preta (o Santa Cruz): veja pra onde caem as outras sombras e
  confira numa foto de frente.
- Se o satélite do Google mostra obra, entulho ou outro estádio (o Nabi Abi
  Chedid foi demolido), procure imagem mais velha no Bing e na Esri antes de
  medir, diga ao dono de que época é o modelo e deixe a escolha com ele.
- Se um lado sai cortado no satélite baixado, baixe de novo com o centro
  deslocado antes de medir.

- O meio do campo: ache o círculo central no satélite antes de medir (um
  erro de 6 m ali entorta os dois fundos).
- Se existir mapa de setores do clube, ele manda no desenho: diz onde há
  arquibancada, onde há camarote e onde fica a visitante.
- Telhado no satélite não quer dizer arquibancada.
- Arquibancada coberta nem sempre é um prédio à parte: veja se ela é só um
  trecho do mesmo anel com telhado em cima (o Estádio do Café). Nesse caso é
  um `trecho` do anel, não um bloco reto encostado.
- Não parta um lance em dois por causa de uma linha clara no satélite: só há
  dois anéis se as fotos mostrarem o degrau ou a mureta entre eles.
- Canto em leque (anel `reto` de raio pequeno): use `semCadeiras: true` com
  pintura lisa (`fracoes`); cadeira solta ali abre e vira risco.
- Onde um trecho reto de contorno próprio encosta num anel oval, faça a ponta
  do anel entrar um pouco por baixo dele, senão sobra fresta e o chão parte.

- A vista de cima bate com o satélite: forma, proporção com o campo, quais
  lados têm arquibancada, quais são cobertos, quantos lances.
- As cores e os letreiros batem com as fotos.
- Todo lugar onde tem setor do jogo tem arquibancada, e as arquibancadas
  formam um chão só (lances encostados; `passagem` onde há um vão por onde
  se passa).
- Nenhuma caixa em cima de arquibancada sem querer.
- Exemplos pra copiar em `fichas.mjs`: Arena do Grêmio (retangular, três
  níveis, cobertura em anel), Beira-Rio (oval, folhas), Arruda (lance de
  cima em degraus, pintura em redemoinho), Ilha do Retiro (lados
  diferentes, letreiro), Arena Romeirão (retangular, abóbadas, um lance).
