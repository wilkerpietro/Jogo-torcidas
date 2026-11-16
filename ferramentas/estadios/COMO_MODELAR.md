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
FOTO ANTIGA CONTRA SATÉLITE NOVO: quando as fotos do dono e o satélite
mostram épocas diferentes (cadeira na foto, bloco pintado no satélite), diga
qual é qual e o que foi feito; não escolha calado.

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
