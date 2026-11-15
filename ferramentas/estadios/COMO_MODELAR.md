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

ARQUIBANCADA QUE DOBRA NA PONTA (o Novelli Júnior): não faça a ponta como
bloco solto. A dobra é um trecho de canto emendado no lance (contorno
próprio com `b - r` igual ao fim do lance reto, `r` de 2 m, o `fora` com o
mesmo `r` mais a fundura, e `celula: 0.045` pra ter colunas), seguido de
uma `reta` encostada no fim do leque, com a mesma fundura e altura.

O TAMANHO DO QUADRO sai do `fora` do ÚLTIMO anel: o anel maior (o que vai
mais longe do centro) tem de ser o último da lista, senão a foto corta a
arquibancada e os marcadores caem fora (o Alfredo de Castilho).

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
