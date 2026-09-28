# O jogo em 3D — o jogo de feed por cima da cidade

Pedido do dono (27/09/2026): "Comece a importar os detalhes de movimento
dos bonecos e motor de briga pra dentro do jogo, assim como toda a rotina
do html Torcida Organizada. Traga toda a hud pro jogo, como o menu
lateral, as informações superiores, o menu inicial, e os dias passando.
Haverá algumas mudanças que irei apontar pontualmente. Confira todo o
código do jogo que possui formato de feed pra irmos adaptando pra essa
versão 3d."

Este arquivo é o mapa dessa adaptação: o que já veio, onde está, e o que
falta pra cada pedaço do jogo de feed virar 3D.

## 1. Como abrir

- **GitHub Pages:** `cenario3d/jogo.html` (a mesma pasta do cenário).
- **Aqui:** `sh ferramentas/planta_html/montar.sh <pasta>`, servir a pasta
  (`python3 -m http.server -d <pasta>`) e abrir `local.html?jogo`.
- `?cidade=Recife` escolhe a praça que monta atrás do menu (sem ela, a do
  último jogo, ou Fortaleza).

## 2. Como é feito

A página é a do cenário (a planta, `ferramentas/planta_html/index.html`)
com `?jogo` (ou `window.__JOGO`, que o `jogo.html` do Pages põe). Ela monta
a praça em 3D e chama `montarJogo` (`ferramentas/planta_html/jogo3d.js`),
que carrega o jogo de feed por cima:

| Pedaço | De onde vem |
|---|---|
| A casca (menu, seleção, `#jogo`, cena, relatório, retrospectiva) | o `<body>` do `index.html` da raiz, sem os scripts — o `montar.sh` gera `js/jogo_casca.js` |
| Os scripts do jogo | os 71 do `index.html` da raiz, na mesma ordem, num arquivo só (`js/jogo.js`, gerado) |
| O CSS | os 6 do jogo num arquivo só (`css/jogo.css`) + `jogo3d.css`, que muda onde cada pedaço fica |
| O boneco das cenas | o do cenário (`js/diajogo/bonecos3.js`, Three r160, os dois níveis afinados), pendurado em `TO.diaJogo.bonecos3` por `bonecos3_global.js` |
| Escudos, fotos das praças, bandeiras | embutidos em `dados/imagens_jogo.js` (o `IMG()` do jogo lê de lá) |
| As fotos das cenas de briga | as 25 `.webp` que os dados citam, em `img/cenas/` |

O jogo é **o mesmo** do Pages (o código veio do branch
`claude/game-html-news-feed-sndgh4`, commit 82bd43d): o mesmo `main.js`, o
mesmo relógio, os mesmos painéis e cenas. O 3D muda a tela, não as regras.

### O que o 3D já faz

- **A cidade é a tela.** O menu inicial e a escolha da torcida abrem por
  cima da praça em 3D. Começada (ou carregada) a partida, a praça vira a da
  torcida do jogador (`E.torcida.mapa` → a praça de `dados/cidades.js`) e a
  câmera voa até a porta da sede dela.
- **O HUD do jogo de feed, inteiro:** a barra de cima (escudo, ranking,
  caixa, saldo da semana, membros, prestígio, moral, força, a data, o ≫ que
  empurra o dia e o 1×/2×), a fita das manchetes e a coluna de ícones (os
  nove painéis e o menu principal). O feed NÃO aparece (28/09/2026): cada
  mensagem chega num balão, na boca de quem a traz (seção 14).
- **Os dias passam** como no jogo de feed: o relógio pinga as mensagens e
  vira o dia sozinho; decisão sem resposta, painel, modal ou cena param o
  tempo.
- **Arrastar no meio da tela move a câmera** da cidade: o que não é HUD não
  pega o mouse.
- **A cidade para de desenhar** quando algo a cobre inteira (um painel, uma
  cena de briga, o relatório, um modal): o último quadro fica e o
  processador fica com o jogo.
- **Um boneco só.** As cenas do jogo (a reunião da diretoria, as brigas)
  desenham o boneco do cenário: os dois níveis afinados, os jeitos do dia
  de jogo e as poses da reunião que vieram do Pages (sentado na cadeira,
  olhar pra quem fala, falar sentado e em pé).
- **O motor de briga é o mais novo** (`combate.js` do Pages, 4.159 linhas,
  com o "setor não é porta" do estádio 3D deste ramo).

## 3. O que ainda é "de feed" — e a proposta pra cada um

Em ordem de peso pro jogo. Cada item espera o dono apontar as mudanças.

1. **O dia de jogo.** No jogo de feed ele é o cartão da partida com o
   itinerário em três fases (ida, jogo, volta) e um evento por fase. No 3D
   já existe o dia de jogo da IA (`dia_de_jogo.js`: as torcidas saindo das
   sedes, a caravana na entrada da cidade, o anfitrião, a PM, a revista, a
   briga na rua). **Proposta:** o cartão da partida abre o dia na cidade; os
   bondes saem do `praca.naRuaEm` do jogo (a mesma lista que a briga usa); a
   torcida do jogador é um bonde a mais, com a rota que ele escolher (o
   pedido de 27/09: "o jogador vai poder optar por fazer outra rota com sua
   torcida"); o evento de cada fase acontece no ponto da cidade onde as
   rotas se cruzam.
2. **As brigas.** *(Em andamento: a festa na casa de praia e as duas
   emboscadas da caravana já são 3D — seção 7 —, e as de praça e de rua
   viraram a briga da caminhada ao estádio — seção 11. As outras cenas
   seguem na foto 2D.)* Hoje abrem na cena de briga do jogo de feed (a foto aérea
   2D com o boneco 3D por cima), em cima da cidade. **Proposta:** a briga
   acontece na própria rua da cidade, com o mesmo `combate.js`: um recorte
   da cidade em volta do ponto (1536×1024 px do motor, uns 79×53 m) vira a
   máscara de caminhar (a grade do boneco a pé do cenário já sabe onde cabe
   gente), os bondes entram onde estão, e o boneco é o mesmo. O motor não
   muda — muda de onde ele tira o chão. (O caminho já foi feito uma vez: o
   estádio 3D, `estadio3d.html`, roda o combate num tabuleiro dobrado.)
3. **A reunião da diretoria.** Hoje é a foto do pátio da sede, com as
   cadeiras e os balões. **Proposta:** a roda dentro da sede 3D (`sede3d.js`
   já tem os cômodos), com as mesmas cadeiras e os mesmos balões.
4. **O mapa do jogo e o mapa da cidade são dois.** O jogo de feed tem o
   mapa dele (`js/mundo/mapa.js` e `mapa_gerado.js`: a arte de Fortaleza,
   São Paulo e Belo Horizonte e a cruz gerada das outras 27, com os
   bairros, os pinos das sedes e dos bares e as distâncias da briga), e o
   3D tem a planta (`proposta.js`, os três mapas por porte). São dois
   modelos da mesma praça, cada um com as sedes e os bares no seu lugar:
   um ponto de um não é um ponto do outro. **Proposta:** a planta do 3D
   passa a ser a única; `pontoDaSede`, `pontoDoBar` e os bairros do jogo
   leem dela. É a peça de arquitetura que destrava o resto (o dia de jogo e
   a briga na rua dependem dela).
5. **O feed.** Saiu da tela (28/09/2026): as mensagens chegam em balão,
   na boca de quem as traz (seção 14). Alguns recados podem ganhar um "ver
   na cidade" — o olheiro apontando o bar da rival, a obra do patrimônio, a
   caravana chegando.
6. **Os painéis** (Torcida, Financeiro, Calendário, Competições, Ranking,
   Diplomacia, Notícias, Jogo) ficam como são: são planilha. Os que têm
   lugar na cidade (o bar, a loja, a sede do patrimônio; as sedes das
   rivais na diplomacia) podem ganhar o botão que leva a câmera até lá.
7. **Os dias na cidade.** A hora do dia na luz, gente na rua nos dias de
   folga, a sede aberta no expediente.

## 4. As regras do dia de jogo desta rodada (27/09/2026)

No planejador do 3D (`dia_de_jogo.js`) e, quando é regra do jogo, no jogo
também (`js/mundo/praca.js`, anotado em `docs/DECISOES.md`):

- `BASE_PROCURA`: maior rival 55, rival 25 (o jogo tinha 62/36).
- Quem vai pra rua: a torcida da praça, todo mundo de pé; a de fora, a
  caravana do jogo (uns 47% das de pé, no mínimo 5).
- O anfitrião do visitante é o do jogo (a irmandade ou os aliados do
  visitante, com sede na praça; o empate pelo hash do par). Ele sorteia:
  a irmandade 10/30/60, o aliado 35/45/20 (não recebe / hospeda / hospeda
  e escolta). Do clube mandante, só hospeda. A escolta é a do jogo: 5 a 10%
  do efetivo de quem hospeda.
- A briga entre duas IAs é a do jogo (`brigaIA`): força = gente × ficha
  média; o favorito vence 70%; feridos e presos dos dois lados pela tabela
  de `simular.js`. O preso fica rendido, de mãos pra cima.
- Só do 3D: o bonde escoltado pela PM também pode atacar.

## 5. Como testar

Os roteiros de teste ficam fora do repositório (na pasta de rascunho da
sessão); o que eles fazem, pra refazer:

- **O jogo 3D inteiro:** abrir `?teste&jogo`, esperar a praça, "Novo jogo",
  `TO.tela.escolherTorcida('TUF')`, começar; responder o que travar (o
  primeiro botão, ou o de pular), fechar os painéis e modais que as
  respostas abrirem, encerrar as cenas com `TO.diaJogo.ponte.encerrar()`,
  e conferir que os dias passam, que os painéis abrem e que o arrasto move
  a câmera.
- **O jogo de feed (a raiz, `index.html`):** o mesmo roteiro, sem a
  cidade.
- **O dia de jogo do 3D:** os 90 planos das 30 praças (o clássico, o mando
  invertido e um visitante de fora em cada).
- **As brigas da seção 7:** com a vida ligada, `TO.tela.abrirAcaoEmCena({
  cena: 'casa-piscina' | 'emb-posto' | 'emb-onibus', acao: 'atacar', ... })`;
  conferir que o palco monta (`C.vida.palco.seguir`), que o líder anda com o
  WASD, que o C troca a câmera, e que ao fechar a cena o relatório abre e a
  câmera volta pra sede. Pras peças sozinhas: uma página que importa
  `js/diajogo/caravana3d.js` e chama `montarCaravana(tipo, [0, 0])` e
  `cenaDaCaravana` (a máscara pintada por cima em vermelho mostra se o que
  barra bate com o que se vê).
- **A briga da caminhada (seção 11):** no jogo, `TO.tela.abrirAcaoEmCena({
  cena: 'rua' | 'praca', acao: 'atacar', ... })` e a defesa
  (`e.ataqueMarcado` + `TO.tela.abrirDefesa()`); conferir que
  `TO.jogo3d.vida.caminhada` tem a cena, o palco segue o líder, as saídas
  ficam nas pontas da rua do alvo e o relatório abre no fim.
- **A arquibancada e a invasão (seção 12):** o cenário com `?teste&cenario`,
  o botão "Dia de jogo", os selects `invade` e `cordao` do painel; o
  `dia.estado().arquibancada` diz os papéis de cada torcida e a invasão
  (a via, quem, as horas, se furou, presos e feridos); `dia.irPara(t)` e
  `cenario.olhar(...)` pras fotos (a faixa desenrolando, a bateria, os
  bandeirões, o puxador, a grade caindo, o cordão).

## 6. A vida na cidade (28/09/2026)

`ferramentas/planta_html/vida3d.js`: o relógio do dia (7h às 23h; as
mensagens do feed caem na hora delas e a luz do cenário segue a hora); a
sede com os membros do save pelos cômodos (cada móvel que recebe gente
marca o lugar em `sede3d.js`); o presidente sentado e quem traz a mensagem
na cadeira da frente, com o cartão em balão (o balão e a fila dos recados
são do mensageiro, `recados3d.js`, seção 14); a reunião da diretoria na mesa
da sala da sede (o palco da reunião, que desmonta quando a cena fecha); os
pedestres nas calçadas e a turma de cada bar de torcida na porta.

## 7. As brigas na cidade: a festa e a caravana

`ferramentas/planta_html/palco_briga.js`: a briga é a MESMA do jogo de feed
(o `combate.js`, a ponte, o HUD, os comandos); quem desenha é o cenário. O
tabuleiro do combate (1536 × 1024 px) é um retângulo do mundo — `noMundo(x,
y)` leva o ponto do tabuleiro pro mundo e `u`, `v` são os eixos dele —, e
cada disco vira o boneco da cidade no ponto dele. A câmera vai atrás do
líder (C troca entre perto e do alto), o WASD anda pela câmera, a faixa fica
estendida no muro, o objetivo é o anel dourado no chão, e o nome do líder
vai em cima da cabeça. O que passa da cabeça dele entre ele e a câmera fica
ralo (o corte do cenário).

- **A festa na casa de praia** (`casa-piscina@3d`, `js/diajogo/veraneio3d.js`):
  a rua de veraneio numa ponta do mapa, a casa da festa no meio dela; a
  máscara sai do plano da casa (paredes, portas, piscina, móveis). O
  tabuleiro é 1:1 com o mundo (1 px = 5,1 cm).
- **As emboscadas da caravana** (`emb-posto@3d`, `emb-onibus@3d`,
  `js/diajogo/caravana3d.js`): palcos à parte, longe da praça, que entram
  na cena quando a briga abre e saem quando fecha. **Escala (o dono,
  28/09/2026: "essa cena aparentemente é muito grande, o novo cenário deve
  ser menor já que não são tantos bonecos nessa cena" — 30% da área):** 1
  px do tabuleiro = √0,3 unidade (2,8 cm), e o tabuleiro dá 43 × 29 m — a
  escala das duas fotos (`img/cenas/emb_posto.webp`, `emb_onibus.webp`). O
  plano é em px da foto, e os spawns, as entradas e os postos da PM são os
  que o dono ajeitou no editor (`dados/cenas_editadas.js`). O motor segue
  em px: o corpo (7 px) vira 20 cm de raio e a marcha (60 px/s) 1,7 m/s. O
  palco recebe a `escala` (o anel do objetivo, a faixa) e o boneco também
  (o anel da bomba no chão).

## 8. O detalhe em Three.js (28/09/2026)

O dono: "Refaça as cenas da caravana e da casa de praia com mais
detalhismo no threejs". `js/diajogo/detalhe3d.js` é um kit de peças em
metros, feito pra câmera da briga (de 15 a 45 m, bem de cima):

- **Veículos:** o ônibus de viagem, o carro (sedã, hatch, SUV), o caminhão
  baú e o contêiner. A carroceria é o perfil de lado extrudado com a borda
  arredondada e a caixa de roda recortada (o pneu aparece inteiro), a
  cabine mais estreita que o corpo, e os vidros assentados no perfil.
- **Posto e estrada:** a bomba, a ilha, o totem, o poste, os pneus, o
  tambor, o carretel, o freezer de sorvete, a gaiola de botijão, a lixeira,
  o calibrador, a caixa d'água, a loja, o depósito, o muro de bloco, o muro
  pré-moldado, os portões (grade e chapa), a concertina (em linha: arame
  fino não precisa de triângulo), o galpão e o telheiro de zinco, o
  arbusto, a árvore, o capim.
- **Casa e festa:** a piscina, a escada, a boia, o colchão, a
  churrasqueira, a espreguiçadeira, o guarda-sol, a mesa com as cadeiras e
  os copos, o isopor, a caixa de som, o varal de luz, a toalha, o que fica
  largado no chão, o sofá, a TV, a cozinha, a mesa de jantar, o banheiro, a
  cama, a estante.
- **Texturas pintadas no canvas** (repetem por metro): asfalto, remendo,
  placa de concreto (a folha tem 2 × 2 placas e cada placa sorteia uma e o
  giro — a repetição some), bloco, pré-moldado, reboco, laje, zinco com
  ferrugem, azulejo da piscina, deck, cerâmica, ladrilho, tijolo, areia,
  terra, prateleiras, geladeira, letreiros, painel de preço, placa do carro.
- **Decalques do chão:** a marca de pneu, a rachadura, a mancha de óleo, a
  areia soprada, a seta e a faixa pintadas e gastas, o ralo.
- **A sombra de contato:** o cenário não tem mapa de sombra (é caro); cada
  peça leva o borrão escuro embaixo (nove fatias: a borda não cresce com a
  peça) e cada parede a faixa escura no pé.
- **`juntar(grupo)`:** junta a geometria por material, e as cores lisas vão
  pro vértice (uma malha por jeito de material). O posto inteiro: ~40 mil
  triângulos em 74 malhas; a estrada, ~32 mil em 63.

Onde entra:

- **A caravana:** `montarCaravana(tipo, O)` monta o posto ou a estrada com
  o kit (a loja com a vitrine, as prateleiras, as geladeiras, o balcão e os
  quartinhos; o depósito aberto; as ilhas; o ônibus; o carro; a pintura do
  pátio; os muros; o canteiro com o poste; a cerca e os postes da rede do
  outro lado da pista; os galpões, o telheiro, os contêineres e o caminhão
  atrás dos muros da estrada) e o chão até o horizonte com a cor mudando
  por vértice. O palco põe o material de cada peça no corte da câmera.
- **A festa:** `detalheDaCasaDaFesta(l)` (veraneio3d.js) põe o deck, a
  cerâmica, a piscina, a churrasqueira, a festa, os dois carros e a mobília
  no lote da casa da festa. As malhas vão marcadas `peca`: o forno do
  cenário não assa elas (achataria a sombra macia e o vidro) — entram
  inteiras na cena e no corte. O construtor ficou só com a areia, o
  corredor, as paredes, o portão e o telhado (o jogo corta o telhado pra
  ver dentro da casa).

## 9. O mapa da cidade no menu (28/09/2026)

O dono: "Preciso que o mapa da cidade seja uma opção no menu lateral do
jogo". A coluna de ícones ganha o **Mapa da cidade** (`NAV` de
`js/main.js`: o item `mapa3d` só existe com a cidade em 3D). Ele abre a
planta da praça inteira por cima da cidade (`ferramentas/planta_html/mapa3d.js`):
o mesmo desenho do mapa da planta (`pintarMapa` de `index.html`: as ruas,
as quadras, as sedes, os bares na cor da torcida, os estádios, a praia, os
rótulos), com o alfinete da sede do jogador e o leque da câmera da cidade.
Arrastar move, a roda aproxima no cursor, o clique leva a câmera até lá e
fecha; o dia para enquanto ele está aberto (como num painel) e Esc, o × e
o ícone de novo fecham.

## 10. A mira da bomba com o mouse (28/09/2026)

O dono: "Adicione uma forma de mirar a bomba com o mouse no 3d". Na briga
em 3D, o **3** abre a mira: o alvo é o ponto do chão debaixo do mouse
(`chaoNaTela` do cenário, na altura do líder), o anel do raio da bomba e o
X no chão, o círculo tracejado do alcance em volta do líder e o arco do
arremesso; o clique joga, o botão direito (ou o 3 de novo) cancela. No
toque, o pad arrasta a mira no sentido da câmera. A ponte do jogo
(`js/diajogo/ponte.js`) pergunta ao palco (`pontoDaTela`, `deltaDaTela`
de `palco_briga.js`) em vez de usar o tabuleiro 2D.

## 11. A briga da caminhada: a praça e a rua na cidade (28/09/2026)

O dono: "A cena de ataque em praça ou rua agora vão ser os ataques de
alguma torcida em outra nos dias de caminhada ao estádio". As cenas de
praça e de rua do jogo de feed (a investida do jogador ou o ataque que ele
sofre, com bonde) abrem na própria cidade 3D (`ferramentas/planta_html/caminhada.js`):
o plano do dia de jogo com a briga mandada (`escolha.briga`), o tabuleiro
deitado ao longo da rua do alvo — na praça, a concentração dele (de 8 a 45
m da porta de onde sai); na rua, o meio do caminho, fora dos arredores do
estádio —, a máscara da grade do passo, a faixa no chão no sentido da
marcha e a PM chegando pelas pontas. O alvo sai pela rua dele, pra frente
(pro estádio); quem ataca some pela saída mais longe de onde as duas
torcidas nascem — a rua de onde o alvo veio, a de onde ele mesmo veio, a
rota dele pro estádio ou, se todas saem do tabuleiro colado em alguém, o
ponto da beira ligado à tocaia mais longe de todo mundo.

**Fora de casa** (desde a seção 13): com o dia de jogo no ar na cidade do
jogo, a briga da caminhada fora de casa abre na cidade deles, no plano do
dia — o mesmo cenário da briga em casa. Sem o dia no ar (a sub-sede, a
praça sem mapa 3D), segue na foto 2D.

## 12. A arquibancada viva e a briga no estádio (28/09/2026)

O dono: "crie a animação da faixa e bandeira sendo estendida por dois
membros assim que a torcida chega no estádio, animação de bandeiras de
bambu balançando na arquibancada e na caminhada [...] de tamanho 4x4m [...],
movimento de bateria de torcida com quantidade padrão por nível de sede
[...], e um puxador que fica de costas pro jogo virado pra torcida [...].
Uma torcida pode optar por atacar outra dentro do estádio, tentando
quebrar a grade pra acessar o rival seja pela arquibancada ou pelos
corredores do estádio. Polícia tenta impedir fazendo cordão de
isolamento."

`ferramentas/planta_html/arquibancada.js`, chamado pelo dia de jogo
(`dia_de_jogo.js`: o plano no fim do `planejar`, a cena no `montar`, cada
boneco no lugar dele no `atualizar`). A arquibancada vem do modelo do
estádio pela planta (`estadios()[].geo`: os pedaços de cada setor e as
DIVISÓRIAS — o gradil entre as torcidas, que o forno do cenário deixa vivo
pra poder cair).

- **O puxador** é o primeiro do bonde: chega e vai pra frente da torcida
  (a fileira de baixo dela, ou em cima da mureta quando ela ocupa a
  frente), de costas pro jogo, regendo (`puxador` de `bonecos3.js`).
- **A faixa e a bandeira:** os dois primeiros que chegam (e os dois
  seguintes) trazem o pano enrolado no ombro desde a sede, descem até a
  mureta, andam cada um pra uma ponta desenrolando e soltam: o pano fica
  pendurado virado pro campo. A cara é a régua do jogo (patrimônio): fundo
  na cor primária, letra e borda na secundária, o escudo da torcida à
  esquerda e o do clube à direita; a bandeira quadrada com o escudo.
- **A bateria:** pelo nível da sede (`BATERIA_POR_NIVEL`: 2, 3, 4, 6, 8,
  10, 12 do nível 0 ao 6; no máximo um quarto da torcida), com surdo,
  repique e caixa no corpo; toca desde a sede, na caminhada e no lugar.
- **Os bandeirões de bambu:** 4 × 4 m num bambu de 6 m, um a cada 14
  bonecos (de 1 a 3), com o pano simulado (partículas presas no bambu,
  gravidade, vento) e o bambu no oito; na sede, na caminhada e no alto da
  torcida.
- **O resto canta junto**, no tempo da torcida (`gestoParam`).
- **O isolamento:** entre o visitante e o mandante o estádio tem o setor
  vazio da PM, entre duas divisórias (na arquibancada e no corredor de
  baixo). A PM deixa guardas lá (3 na arquibancada, 2 no corredor, do
  efetivo do jogo, até 30% do que sobra da revista).
- **A invasão:** uma por jogo. **A IA não invade mais sozinha** (seção 13:
  no jogo, a invasão é a da torcida do jogador, jogada no combate); o
  painel da planta ainda manda ("Ninguém invade sozinho" é o padrão; "As
  torcidas decidem" é o sorteio antigo: 40% da chance de procurar na rua a
  rival que está do outro lado do isolamento, e sem rival dela ali ela não
  vai). Quem brigou na rua invade também. Pela arquibancada (a
  divisória mais perto, andando nas fileiras sem passar em poço de
  vomitório) ou pelo corredor (desce pelo vomitório dela e anda no
  corredor). Uns 60% da torcida correm pra grade e empurram 15 s; a grade
  cai pro lado do isolamento; os guardas e o reforço (os PMs da revista,
  livres depois que todo mundo entrou) fazem o cordão a 2,2 m da grade, de
  escudo; 24 s de pancada. A PM segura (volta pro lugar, gente no chão e
  presa) ou a torcida fura (até 45%, pela força dela contra a do cordão),
  quebra a segunda grade e se pega com a frente da rival (a tabela de
  baixas da rua) até a PM se juntar e separar. A briga se vê a 1× (o
  relógio para nela e a câmera vai até lá; no corredor, o corte do cenário
  abre o que fica em cima).
- **O painel** diz o papel de cada torcida no estádio, a decisão e a
  invasão, e manda nela: "No estádio: ninguém invade sozinho / As
  torcidas decidem (sorteio) / Invade pela arquibancada / Invade pelo
  corredor" e "O cordão: sorteio / A PM segura / A torcida fura o cordão".

**Limites:** no estádio de 10 mil o mandante fica na outra arquibancada —
sozinho o visitante não tenta; mandado pelo painel, ele vai, mas do outro
lado do isolamento não tem ninguém.
A grade que cai só cai na cena (quem anda a pé no cenário continua
barrado por ela). O pano do bandeirão atravessa gente e os outros panos
(não tem colisão entre eles).

## 13. O dia de jogo ligado ao jogo (28/09/2026)

O dono: "Vamos ligar o dia de jogo com arquibancada e invasão no cenário
3d. A invasão deve ser controlável pela torcida do jogador somente. Que
brigou na rua pode invadir no estádio também. As brigas fora de casa
devem respeitar o mesmo cenário das brigas em casa, com o jogador sendo
visitante podendo iniciar a rota ou na entrada ou na casa do aliado".

`ferramentas/planta_html/dia3d.js` (o controlador) e
`ferramentas/planta_html/invasao.js` (a invasão jogada), com ganchos em
`js/main.js` (a linha do dia) e `jogo3d.js`.

- **A linha do dia de jogo manda.** Quando o itinerário abre (o "Iniciar
  partida" do feed), a cidade do jogo — a nossa em casa, a deles fora —
  monta o dia de jogo do cenário com o jogo de verdade: o mandante e o
  visitante, a hora da bola (`proximoJogo.hora`), quem foi (a presença da
  partida, com o número de cada torcida) e o nosso bonde (o efetivo da
  linha). As outras torcidas da IA não atacam ninguém na rua (a briga da
  rua é só a do itinerário) nem invadem no estádio.
- **As fases andam na cidade.** Ida: a caminhada de todas as torcidas até
  o estádio, com a PM, os cordões e a revista, a 30× (o painel embaixo tem
  1×/10×/30×/60×, "Pular", e a câmera: a nossa torcida, o estádio, a
  cidade). Se a fase tem a briga da caminhada (o ataque sofrido ou a
  investida marcada, na concentração ou na pista), o dia é planejado com
  ela dentro: a cidade anda até os dois bondes se encontrarem, e só aí o
  cartão da linha aparece. **Descer** abre o combate no mesmo ponto (o
  plano é o do dia) com os outros bondes parados em volta; **Simular** e
  **ninguém descer** a cidade mostra a 1× (o resultado do duelo manda em
  quem ganha e em quem fica no chão; sem descer, a rival bate e 10% dos
  nossos caem). Depois a caminhada segue. O jogo: o resto da entrada a
  60× até todo mundo no lugar, e a partida — **a 1× na cidade** (dá pra
  ver a arquibancada e decidir; o botão da velocidade continua valendo) —
  com o relógio do dia no minuto dela e a câmera do campo olhando a nossa
  torcida. Volta: o dia fecha e a cidade volta a ser a praça do jogador.
- **A invasão é só da nossa torcida, e é escolha.** Na partida o painel
  mostra "Invadir o setor da X: pela arquibancada / pelo corredor" quando
  a nossa torcida tem caminho até um isolamento com rival do outro lado (a
  até 40 m da segunda grade). A do 1º escalão costuma sentar longe do
  visitante (no Castelão, a TUF fica a ~100 m do isolamento): ela
  atravessa o anel até a grade e o combate começa lá. O clima tenso não
  força mais a briga na cidade 3D: pergunta "Invadir o setor deles?"
  (invadir por um caminho, simular ou ficar no lugar — ficando, a PM
  acalma e a bola volta). Desde 28/09/2026 a pergunta é um recado na
  linha do dia, no balão do líder do bonde (seção 14), e não uma caixa. Uma briga de arquibancada por jogo, como antes;
  a conta é a da tabela do estádio (`fecharEstadio`), contra a rival do
  outro lado do isolamento — as outras torcidas do nosso clube não descem.
- **A invasão jogada** (`invasao.js`): o combate do jogo em cima da
  arquibancada de verdade. O tabuleiro (43 × 29 m) é a arquibancada
  DESENROLADA: o x anda ao longo do anel (em metros na fileira do meio),
  do nosso setor pro da rival; o y é a profundidade, com a mureta embaixo
  (a câmera fica do lado do campo, olhando a arquibancada). A máscara é o
  degrau fora dos poços dos vomitórios (no corredor, a faixa entre as
  paredes); as duas divisórias do isolamento são as GRADES do combate, em
  módulos de 1,5 m que quebram um a um, desenhadas com o gradil do próprio
  estádio (a divisória do modelo sai enquanto a cena está no ar), subindo
  com os degraus, balançando na pancada e caindo quando o módulo zera. A
  PM são os guardas do isolamento; a tropa entra pela frente, vindo do
  campo. O fim da briga é o líder voltar pro túnel do nosso lado. As
  outras torcidas ficam no estádio em volta (paradas no lugar, com a
  bateria e os bandeirões); as duas da briga saem do dia enquanto o
  combate desenha as delas.
- **Fora de casa**, a cidade troca pra do adversário (a praça dele no mapa
  3D) e, se a aliada respondeu que recebe no pedido de ajuda do
  planejamento e tem sede no mapa, o jogador escolhe onde a caravana
  desce: **na sede da aliada** (com a escolta dela junto, se ela escolta)
  ou **na entrada da cidade** (pelo pórtico) — a pergunta também é um
  recado na linha do dia, no balão (seção 14). Sem aliada que receba, desce
  na entrada. A briga da caminhada fora é a mesma da de casa (o combate no
  plano do dia, na cidade deles).

**Como testar:** `scratchpad/dia/dia.js` (Playwright): novo jogo com a TUF,
o jogo de hoje montado na mão (Fortaleza × Ceará em casa; `FORA=1`, um
jogo em Belo Horizonte com a Máfia Azul recebendo), o ataque da rival na
pista, a linha aberta com `TO.tela.abrirItinerario`, e o dia inteiro: a
concentração, a caminhada, o encontro, a briga jogada, a entrada, a
partida, a invasão pela arquibancada e a volta. `scratchpad/inv/todas.js`
confere, praça por praça, os caminhos de invasão de cada torcida e o
tabuleiro (a grade do combate em cima da divisória do modelo).

**Limites (sinceros):**
- A linha do dia (no balão do líder do bonde, seção 14) mostra as horas
  dela (a concentração 5 h antes da bola) e a cidade mostra as do plano (a
  caminhada começa ~1 h antes): são dois relógios.
- O resultado da invasão não tira ninguém da arquibancada no 3D (a conta
  vai pro jogo; os bonecos continuam no lugar).
- A briga dos arredores (a investida marcada nos arredores) continua na
  cena 2D dos arredores; a cidade só anda até lá.
- A emboscada na estrada (fora de casa) é a do palco à parte da caravana;
  a caminhada na cidade deles vem depois, na fase do jogo.
- Sem mapa 3D pra praça do jogo, sem torcida do mandante com sede no mapa
  ou em campo neutro, o dia segue só na linha do dia (no balão, na sede).
- No swiftshader do teste a cidade roda a 1–2 quadros por segundo; o
  "Pular" existe porque a caminhada inteira a 30× leva uns 40 s de verdade.


## 14. Sem feed na tela: os recados em balão (28/09/2026)

O dono: "Exclua a exposição do feed na tela. As mensagens sempre vão ser
via balões de alguém falando com o jogador."

`ferramentas/planta_html/recados3d.js` (o mensageiro), com `TO.semFeed`
(o `jogo3d.js` liga antes de carregar o jogo; o `main.js` não monta o rolo
do feed, e o botão da borda que recolhia o feed saiu). A história continua
em `E.feed`, igual; Notícias segue com o arquivo (tudo o que já passou, pra
reler) e com as abas Mensagens e Tretas. O jogo de feed da raiz
(`index.html`) não mudou.

- **Quem fala.** Na sede, quem traz o recado senta na cadeira da frente da
  mesa do presidente — o diretor, o olheiro, o repórter, o enviado de outra
  torcida, pela voz da mensagem (`vida3d.js`, `sentarRecado`) — e o balão
  fica em cima da cabeça dele, abrindo pro lado contrário ao presidente. No
  dia de jogo, quem fala é o líder do nosso bonde (`dia3d.falante`: o balão
  em cima do nome do bonde, na rua e na arquibancada). Sem quem fala na tela
  (a câmera noutro canto, a praça sem sede, a cidade montando), o balão
  encosta no alto, com o botão que leva a câmera até ele ("Ir pra sala do
  presidente" / "Ver a nossa torcida").
- **Uma de cada vez, nenhuma perdida.** A fila guarda as mensagens na ordem
  em que caíram. A notícia fica o tempo de ler — 3 s mais 1 s a cada 30
  letras, entre 4 e 11 s (mais 3 s com tabela; no 2×, 1,4 vez mais rápido);
  a régua embaixo do balão mostra quanto falta —, o mouse em cima segura, e
  um clique dentro prende até o ×. O × e o "Próximo ▸" passam na hora; o pé
  do balão conta quantos recados esperam. A decisão fica até a resposta (sem
  ×); respondida, fica 2,5 s com a resposta.
- **O relógio espera quem fala.** O ritmo do jogo 3D (`TO.jogo3d.ritmo`)
  soma o que falta ler (o balão no ar e a fila) no tempo da próxima
  mensagem: o dia só pinga a seguinte quando o balão acaba, e a fila não
  cresce sem fim. Fechou antes da hora, o relógio refaz a conta.
- **O que esconde o balão (e segura a fila):** painel, mapa, cena de briga,
  a reunião da diretoria, modal e o relatório. A decisão respondida por trás
  (a reunião encerrada, a tela do ataque confirmada) não volta.
- **O dia de jogo.** O cartão da partida é o balão; com a linha do dia
  andando, o balão mostra só a linha (a parada de agora, os recados da
  parada com os botões — descer, simular, deixar quieto — e a partida) e não
  sai até a linha fechar; aí fica 5 s com o dia fechado. Se a linha começa
  com outro recado no ar, ela passa na frente (o outro volta pra fila, sem
  contar como ouvido). As duas perguntas do dia que eram caixas por cima de
  tudo viraram recados na linha: "Onde a caravana desce?" (fora de casa) e
  "Invadir o setor deles?" (o clima tenso; também o botão de invadir do
  painel). Sem linha do dia no ar, elas voltam a ser a caixa de sempre.
- **Os recados de outras torcidas** (Notícias → Mensagens: provocação,
  convite, agradecimento, pedido de casa, trégua) também chegam assim: o
  enviado dela, com a camisa dela. O pedido de casa e a trégua vêm com os
  botões; sem resposta, seguem esperando em Notícias → Mensagens (não param
  o tempo, como antes). O que foi entregue fica lido. Eles esperam a vez:
  as mensagens da nossa torcida passam na frente.
- **O que fica no save:** `E.ouvido3d`, o id da mensagem mais nova já
  ouvida. Carregar o jogo refaz a fila com o que está acima dela; save sem a
  marca (jogo novo, save de antes) começa pelas de hoje. Decisão em aberto
  sempre volta.
- **O menu lateral:** o primeiro item deixou de ser "Feed" e virou "Sala do
  presidente" (fecha o painel e leva a câmera até a sala; no dia de jogo,
  até o nosso bonde). O passo do tutorial que falava do feed fala dos
  balões.
- A notícia de treta segue fora (Notícias → Tretas), como no feed.

**Como testar:** `scratchpad/recados/sede.js` (Playwright): jogo novo com a
TUF e o relógio correndo por uns dias — cada decisão respondida no balão, as
telas e painéis que ela abre fechados, a reunião encerrada, notícias
fechadas no × e no "Próximo"; no fim, confere que toda mensagem do `E.feed`
(menos as de treta) passou pelo balão e a maior fila. `scratchpad/recados/
dia_balao.js`: o dia de jogo com a linha no balão do líder do bonde, o
cartão da briga, a partida e o balão fechando no fim do dia.

**Limites (sinceros):**
- O relógio espera o balão: num dia com muita notícia, o dia anda mais
  devagar que no feed (é o preço de ler tudo). O × e o "Próximo" existem
  pra isso, e o ≫ continua empurrando o dia.
- Recado que saiu do balão não volta: pra reler, Notícias (o arquivo guarda
  as mensagens; a aba Mensagens, os recados de outras torcidas).
- O pedido de casa e a trégua sem resposta no balão ficam esperando em
  Notícias → Mensagens, com o número vermelho no ícone; o balão não volta
  pra lembrar.
- O balão cobre um pedaço da sala (às vezes o presidente, com a câmera
  atrás dele) e, na partida, um pedaço da arquibancada. O planejamento da
  semana e a tabela do olheiro rolam por dentro do balão (até 46% da altura
  da tela).
- O "Mensagem de X" que piscava do lado do ícone de Notícias saiu do 3D (o
  enviado entrega em pessoa); o número vermelho continua.
