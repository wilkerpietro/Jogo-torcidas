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

- **GitHub Pages:** `cenario3d/jogo.html` (a mesma pasta do cenário). O
  `montar_pages.sh` põe um `?v=` (o hash do que foi montado) em cada
  módulo, script e folha que a página carrega (conserto de 28/09/2026): o
  Pages manda guardar cada arquivo por 10 minutos, e recarregar logo depois
  de uma publicação misturava a página nova com módulos velhos da cache —
  foi assim que o jogo abriu com uma decisão pendente e nenhum balão.
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
  pega o mouse. O painel aberto pega (conserto de 28/09/2026): o `#jogo`
  tem `pointer-events: none` e a propriedade é herdada, então o painel
  (Torcida, Calendário, Competições…) e o "Fechar" da barra dele ficavam
  surdos ao clique, à roda e ao toque — o clique atravessava pra cidade.
- **O estilo da planta não vaza pro jogo** (conserto de 28/09/2026): o jogo
  3D monta por cima da página da planta, e o `<style>` dela tinha regras
  de classe soltas (`.painel`, `.dados`, `.campo`, `.corpo`, `.nota`,
  `.topo`, `.acoes`…) que são classes do jogo também — o painel virava
  coluna flex, a tabela de membros saía em duas colunas (o cabeçalho numa,
  as linhas na outra), as caixas do Expediente em maiúsculas espaçadas e a
  ficha da torcida na escolha em grade de duas colunas. Agora toda regra
  de classe da planta vale só em `:where(.app, .cen-ficha)` (a planta e a
  ficha do cenário; o `:where` não muda a força da regra). Regra nova de
  classe na planta entra com o mesmo prefixo.
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

Os balões da reunião são os do jogo de feed (`posicionarBaloesDaReuniao`,
`js/main.js`): no 3D quem diz onde fica a cabeça de cada diretor é a câmera
da cidade (`projetar`, com a chave da câmera). O laço de cada quadro só
reposiciona quando a câmera muda; o balão recém-desenhado vai pro lugar
sempre (conserto de 28/09/2026: respondida a primeira pauta, o balão da
próxima ficava fora da tela até alguém arrastar o mapa).

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
  60× até todo mundo no lugar, e a partida — **a 4×** (era a 1× na cidade
  até 29/09/2026: seção 19; o botão do placar de TV anda 4× → 1× → 2×) —
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
  cena 2D dos arredores; a cidade só anda até lá. (Foi pro 3D depois, no
  cordão da PM: seção 23.)
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
  ×); respondida, fica 2,5 s com a resposta. A decisão em aberto fura a fila
  (ela é que segura o relógio): com uma esperando, a notícia no ar sai em
  1,5 s. O mouse só segura a leitura se ele se mexer em cima do balão (4 s
  parado, a leitura volta a correr) — o balão que nasce debaixo de um
  cursor parado não fica preso; e o balão que acabou de ser respondido sai
  no tempo dele mesmo com o cursor em cima do botão clicado. Com o tempo
  parado, o ≫ traz a decisão em aberto de volta pro balão, e o cartão que
  não consegue se desenhar vira um cartão simples com os botões da decisão
  (a fila nunca trava num recado).
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


## 15. O jogo fora, os bares, os jogos da cidade e o aliado hospedado (28/09/2026)

O dono: "Quando o jogador opta por hospedar na sede um aliado, eles aparecem
na sede no dia do jogo e partem da sede pro estádio, os demais jogos na
cidade entre times IA tem dia de jogo normalmente, com as torcidas brigando
ou não entre elas. Aprimore isso. A mecânica de jogo fora de casa também não
está completa, o jogo inicia com o mapa da outra cidade nem ter carregado
ainda. Eu comprei um bar no jogo e o mapa não atualizou com mais um bar pra
minha torcida."

- **O jogo fora abria sem a cidade de lá.** Duas causas. (1) Seis praças
  têm o nome sem acento nos dados do jogo (`dados/cidades.js`: "Sao Paulo",
  "Belem", "Brasilia", "Goiania", "Paraiba", "Suburbio Carioca") e o 3D
  procurava a praça pelo nome: nessas seis o dia de jogo não achava a
  cidade e a linha do dia andava com a praça do jogador na tela. A praça
  agora sai do id do mapa pelo slug (`pracaDe`, em `index.html`, a mesma
  conta de `infoDaCidade`) — no jogo 3D e no dia de jogo. (2) O dia de
  jogo não esperava a montagem que estivesse em curso (a praça do jogador
  remontando por causa de um bar novo, por exemplo) nem conferia se a
  montagem que ele pediu tinha terminado de verdade. `dia3d.js`
  (`esperarPraca`) pede a praça, espera o cenário parar de montar
  (`C.montando`, novo em `cenario.js`), confere que a praça montada é a do
  jogo e só então monta o plano; o painel do dia diz "Carregando o mapa de
  São Paulo…" enquanto isso, e a linha do dia fica travada ("montando o dia
  na cidade"). Montagem que não termina vira erro no painel (e a linha
  segue sem o 3D), em vez de dia de jogo em cima de meia cidade. (3) Com a
  cidade montada, o plano do dia ainda podia recusar o jogo: "o visitante
  do jogo não tem torcida que venha". A lista de clubes de cada praça
  (`dados/cidades.js`) traz também os de fora que têm torcedor nela —
  Flamengo, Corinthians, Palmeiras, São Paulo e Vasco em Fortaleza; o
  Fortaleza em São Paulo — e o plano tirava TODOS os da lista dos "de
  fora" (`clubesDeFora`, em `index.html`): esses clubes ficavam sem lado.
  O Fortaleza em São Paulo caía nisso, e **o jogo em casa contra um desses
  clubes também** (Fortaleza × Flamengo não montava em 3D). Agora "de fora"
  é todo clube que não é o da praça (`local`) nem tem torcida com sede no
  mapa. Conferido: Palmeiras × Fortaleza em São Paulo e Fortaleza ×
  Flamengo, × Corinthians, × Ceará e × Bahia em Fortaleza montam.
- **O bar comprado.** A praça punha UM bar por torcida com sede, o da
  tabela — o save não entrava na conta. Agora o número de bares de cada
  torcida é o do jogo: o patrimônio do jogador (`TO.financeiro.patrimonio`)
  e o mundo vivo da IA (`E.mundoTorcidas[id].bares`, que também compra).
  `index.html` guarda o número (`baresDoJogo`) e a distribuição dos bares
  (`escolherBares`) põe os do jogador primeiro — com menos vaga de bar que
  bar pra pôr, quem fica sem é a IA. A praça remonta quando o número do
  JOGADOR muda (o da IA entra na próxima montagem: remontar a cidade no
  meio do dia porque uma torcida da IA abriu um bar seria pesado, e sem
  motivo pra quem joga). A remontagem espera o painel fechar (a compra é
  na Loja do Financeiro): fechou, a praça monta de novo, a câmera passa na
  porta do bar novo com o aviso "O bar novo da ... abriu as portas", e em
  5 s volta pra sala do presidente. O começo do jogo também mudou: a
  torcida sem bar no save (sede nível 1) não tem mais o bar da tabela.
- **Os jogos da cidade (entre clubes da IA).** No dia de um jogo de dois
  outros clubes na nossa praça (o calendário da praça, `jogosDaPraca`), o
  olheiro avisa TRÊS HORAS ANTES DA BOLA: um recado com pergunta, no balão
  (o tempo para até a resposta) — "Ver na cidade" ou "Seguir o dia". O
  recado entra na fila do dia na hora dele (`jogo3d.js`,
  `anunciarJogosDaCidade`; uma vez por jogo). Vendo, `dia3d.js`
  (`abrirJogoDaCidade`) monta o dia do jogo como o nosso: os bondes das
  torcidas dos dois clubes (quem vai e quantos: a mesma lista da pauta,
  `naRuaEm`), a PM, a revista, a entrada, a arquibancada viva e a partida.
  A BRIGA É A DO MUNDO: o jogo já sorteou, no começo do dia, se as
  torcidas se pegam (`brigasDeHoje`, na aba Brigas das Notícias); tendo
  briga entre duas torcidas do jogo, ela acontece na rua (ou na
  concentração do atacado), a câmera vai até lá e a cidade mostra a 1×,
  com o resultado de lá (quem ganhou e a proporção de feridos e presos de
  cada lado). Sem briga, todas vão em paz. A partida corre com o minuto no
  relógio do dia, os gols saem no painel ("gol do ...", com o placar) e o
  placar final é o da rodada. Ninguém invade: a invasão é só da nossa
  torcida, e ela não está no jogo. O painel tem "Voltar pra sede" (a
  qualquer hora); voltando, o dia da praça segue da hora em que o jogo
  acabou e o tempo do jogo volta a andar. Enquanto o jogo da cidade está no
  ar os recados esperam (o tempo está parado e ninguém da torcida está ali
  pra falar); o ≫ volta pra sede antes de empurrar o dia; e o vigia do
  relógio solta a pausa do jogo da cidade se ela ficar órfã.
- **O aliado hospedado.** A recepção do planejamento (hospedar, hospedar e
  escoltar, churrasco) agora vale no 3D. `planejamento.js` guarda o nível
  que valeu na cobrança do dia (`p.recebido`; sem caixa, vira "nada") e
  diz quem a gente recebe hoje (`hospedesDeHoje`). **Na sede:** de manhã a
  caravana do aliado está lá dentro, com a camisa dele, nas camas do
  alojamento, no sofá, nas rodas e nas mesas (até 12 bonecos; o vaivém
  dos nossos não mexe neles); duas horas e meia antes da bola eles saem
  pela porta, um atrás do outro — e o tempo do jogo espera a saída (até
  12 s), com a câmera na sede inteira, antes de voltar pra sala (o relógio
  da sede corre: sem essa espera o dia acabava antes de eles chegarem na
  porta). **No dia do jogo** (o da cidade, ou o
  nosso em casa contra o clube dele): o bonde do aliado parte da NOSSA
  porta; com escolta (hospedar e escoltar, churrasco), até 10 dos nossos
  andam junto, com a nossa camisa. No nosso jogo em casa ele só hospeda (a
  regra do dono: "o aliado só hospeda a TOMA, e ela sai da sede sozinha pro
  estádio" — o anfitrião do mandante torce contra). Quem recebe os outros
  visitantes é o que o jogo diz (`anfitriaoDe`, `decisaoDoAnfitriao`,
  `escoltaDe` de `js/mundo/praca.js`): o plano do dia (`escolha.hospedes`
  em `dia_de_jogo.js`) não sorteia outro, e a nossa casa só recebe quem o
  jogador disse que recebe.

**Como testar:** em `scratchpad/recados/` (Playwright, na pasta do Pages):
`fora_carrega.js` (o jogo fora em São Paulo: a linha não anda antes da
praça de lá estar montada, e o plano monta nela), `sonda_fora.js` (o plano
do jogo fora em São Paulo e dos jogos em casa contra Flamengo, Corinthians,
Ceará e Bahia, direto no dia de jogo), `bar3d.js` (a compra do bar na Loja com
clique de verdade, o painel fechado, a praça remontando com mais um bar
nosso), `jogo_cidade.js` (um Ceará × clube de fora em Fortaleza com a
torcida visitante aliada e hospedada: os hóspedes na sede, o aviso no
balão, "Ver na cidade", o bonde saindo da nossa porta, a briga do mundo, a
partida, o fim e a volta; `MODO=casa`, o nosso jogo em casa contra o clube
da aliada hospedada; `SEGUIR=1`, o "Seguir o dia": os hóspedes saem da sede
na hora deles). `CEL=1` roda no tamanho de celular, com toque.

**Limites (sinceros):**
- Jogo fora no exterior (Libertadores, Sul-Americana) não tem cidade 3D: a
  linha do dia anda no balão, com a nossa praça na tela.
- Montar São Paulo (o mapa grande) leva uns segundos num PC e bem mais num
  celular fraco; enquanto isso a linha espera — não tem como pular.
- O bar novo remonta a praça inteira (é o mesmo caminho da sede que muda de
  nível). Os outros bares podem trocar de lugar na remontagem (a conta
  junta todos de novo).
- O jogo da cidade só aparece quando o mandante tem torcida com sede no
  mapa 3D; e não aparece em dia de jogo nosso (a cidade é da nossa linha).
- A briga do jogo da cidade só acontece na rua quando as duas torcidas
  estão no jogo (o mundo também sorteia briga com torcida da cidade que não
  é dos dois clubes: essa fica só na aba Brigas).
- O minuto dos gols do jogo da cidade é inventado (fixo pro par): o mundo
  guarda só o placar.
- Os hóspedes na sede aparecem de manhã e saem 2h30 antes da bola; o
  relógio da sede é rápido (o dia inteiro em ~9 s a 1×): de manhã eles
  ficam pouco tempo à vista — o recado do jogo da cidade (3 h antes da
  bola) para o tempo com eles ainda lá dentro, e a saída segura o tempo
  uns segundos.
- As cores do hóspede são as da torcida dele: aliada com as cores parecidas
  com as nossas (a Bamor e a TUF, azul, vermelho e branco) quase não se
  distingue dos nossos dentro da sede.

## 16. A torcida inteira no dia de jogo, o ataque na esquina e na porta da sede, e os recados na vez deles (28/09/2026)

O dono: "Dia de jogo se eu tenho mais de 100 aptos com a TUF e o jogo só
coloca 40 na rota do estádio até a arquibancada. Tem que ser os 100 aptos,
tanto pra mim como pras torcidas IA. A mensagem que surge no itinerário de
ataque à minha torcida seja na pista ou concentração deve ser mais natural:
se for na pista, minha torcida vai normalmente fazer sua rota e em alguma
esquina vai ser abordada pelo adversário, gerando a mensagem de aviso. Se
for na concentração eles vem atacar em frente a sede, antes da torcida
partir. Os recados não aparecem na tela, ficam somente em Notícias >
Mensagens."

- **Um boneco por torcedor.** O plano do dia (`dia_de_jogo.js`) punha um
  boneco pra cada dois torcedores (`FATOR_GENTE` 0,5) e no máximo 40 por
  torcida (`MAX_BONDE`): os 150 aptos da TUF viravam 40 bonecos. Agora é
  um por um, pra todas as torcidas do jogo (a do jogador, as da IA, a
  escolta do aliado), até os lugares com caminho do setor dela na
  arquibancada. As rotas de dentro dos estádios (`rotas_estadios.mjs` →
  `js/diajogo/rotas_estadios.js`) saíram de novo com 400 lugares por setor
  (eram 100; o arquivo foi de 77 KB pra 278 KB): os dois setores do
  visitante do estádio de 10 mil só têm 168 lugares e um do de 40 mil tem
  211 — o visitante maior que isso fica com o setor cheio. 400 é também a
  trava por torcida (`MAX_BONDE`). A PM segue a regra do dono, um PM pra
  cada 4 torcedores do jogo, agora contando gente de verdade: no clássico
  de Fortaleza, 410 torcedores e 103 PMs (eram 136 bonecos e 34 PMs).
- **Só na rua e na calçada.** O dono, com a foto da concentração: "alguns
  membros das torcidas estão dentro de terrenos baldios e casas, organize
  pra eles ficarem somente nas calçadas e ruas, porque senão eles ficam
  presos aí dentro". A grade da rota do dia de jogo agora sabe o que é
  chão de rua: o asfalto, a calçada das quadras e a calçada pintada das
  avenidas (a planta, `naRuaOuCalcada`), mais o terreno do estádio (a
  esplanada e os portões) — `R.publico`. A rodinha da concentração só fica
  nele (a roda inteira, o meio e a volta), a faixa do bonde andando só se
  espalha nele, e andar fora dele (o lote, o terreno baldio, o quintal, a
  sede por dentro, a praça, a viela) custa 8 vezes mais pras rotas
  (`PRIVADO`), e a reta que enxuga a rota não corta caminho por eles: as
  rotas só passam por lá se não tem outro jeito. No mapa de Fortaleza, das
  137 mil células de 1 m que o corpo alcança, 100 mil são chão de rua (a
  conta leva uns 0,1 s por plano); no clássico, nenhuma rodinha fica fora
  dele, e das rotas (330 a 780 m) sobra 0 a 3 m fora — o metro da boca do
  portão e a quina de um meio-fio.
- **A concentração do tamanho da torcida.** Com 150 na porta, as rodinhas
  se espalhavam longe. Agora a roda só fica onde se chega andando da porta,
  pela rua e pela calçada, sem volta grande (`alcanceDaPorta`), a faixa
  abre ao longo da fachada (a rua) e só um tanto pra fora, e a torcida
  grande junta mais (as rodas a 1 m uma da outra a partir de 150 pessoas, a
  1,8 m até 40, e rodas de até 8).
- **O ataque na pista, numa esquina.** A briga mandada pelo jogo na rua cai
  numa ESQUINA da rota do alvo: um ponto dela de onde saem pelo menos três
  ruas de 18 m (`ESQUINA`) nos quatro rumos da grade do mapa (`ehEsquina`);
  quem ataca espera escondido na transversal. Sem esquina que sirva, o ponto
  é o de antes. No jogo 3D (`dia3d.js`, `atacados`) a cidade anda como num
  dia sem nada: o nosso bonde faz a rota dele; perto da esquina o relógio
  cai pra 2× com a câmera atrás do bonde, olhando a esquina; a rival sai
  correndo da transversal e SÓ AÍ o aviso aparece, com ela à vista: "A
  Cearamor tava escondida na esquina e saiu correndo pra cima do bonde!".
- **O ataque na concentração, na porta da sede, antes de sair.** O ponto é
  a frente da porta, onde a torcida está nas rodinhas, e a hora é antes da
  saída do bonde (a briga acaba e sobra 1,5 min, `REAGRUPA_PORTA`, pra
  juntar quem ficou de pé antes da hora de sair). Quem ataca sai da sede
  dele, dobra a última esquina (espera só `ESPERA_PORTA` s) e cai em cima
  da concentração; cada um vai no nosso mais perto de onde ele vem
  (`parear`, refeito quando as rodinhas estão postas), e os nossos brigam
  ali mesmo, na rodinha. O aviso vem quando a rival dobra a esquina
  correndo: "Chefe, a Cearamor dobrou a esquina e tá vindo correndo pra
  porta da sede! Vão cair em cima da concentração antes da gente sair pro
  estádio." Os botões são os do jogo ("Pra cima deles", "Simular",
  "Recuar pra sede"); o combate jogado (`caminhada.js`) abre na porta da
  sede ("Na porta da sede, antes de sair pro estádio").
- **O aviso no alto.** Enquanto o aviso espera a resposta, o balão sobe pro
  alto da tela (em cima do líder do bonde ele podia tampar justamente o
  lado de onde a rival vinha) e a câmera põe a briga na metade de baixo.
  No celular em pé a tela é estreita e o balão do aviso tampa quase a
  metade de cima, e o painel do dia o pé: a câmera mede a faixa que sobra
  entre os dois (`faixa`, pelo tamanho de verdade do balão e do painel) e
  se afasta até caber nela a tocaia com as primeiras filas de quem ataca,
  o ponto e a nossa porta com as rodinhas (na pista, o líder chegando na
  esquina) — de trás de quem ataca (a rival sobe pela tela até a gente),
  ou de lado, se assim tudo cabe bem mais perto (`emPe`); quando o aviso
  aparece, ela acerta pela faixa que ele deixou de verdade. De longe assim
  (70 a 90 m) o boneco fica pequeno no celular: quem é quem se lê pela
  cor da camisa, pelo anel no chão e pela placa de cada torcida. O cartão
  da parada, com os botões, rola pra dentro do balão (no celular ele caía
  embaixo da dobra).
- **Depois do aviso.** A briga que a cidade mostra (a simulada, a de quem
  não desceu) passa a 2× no jogo (a 1× eram 45 s de tela), a velocidade
  que o jogador escolheu volta depois, e o nosso bonde que brigou na ida
  faz a caminhada até o portão (antes ele ia da briga pro estádio a 60×);
  a linha do dia diz "a caminho do estádio · na cidade" enquanto ele anda.
- **A investida marcada** (a gente atacando) usa os mesmos lugares: a porta
  da sede deles antes de saírem (na concentração) e a esquina (na pista),
  com o texto do cartão também do que se vê.
- **Os recados de outras torcidas.** O balão mostrava primeiro toda
  mensagem da nossa torcida — até as que chegavam DEPOIS do recado — e só
  então o recado de outra torcida. Num dia cheio a vez dele não chegava: o
  jogador lia em Notícias → Mensagens, ele ficava lido e saía da fila sem
  ter aparecido. Agora a fila é por ordem de chegada (só a decisão em
  aberto passa na frente), e o jogo carregado traz os recados não lidos
  dos últimos três dias (antes, só os de hoje).

**Como testar** (em `scratchpad/recados/`, Playwright na pasta do Pages):
`recado_fila.js` (com o tempo parado caem uma notícia, um recado da
Cearamor e outra notícia: o balão mostra os três nessa ordem, e o recado
fica lido), `ataque3d.js` com `ALVO=pista` ou `ALVO=concentracao` e
`RESP=quieto`, `RESP=simular` ou `RESP=descer` (TUF × Ceará em Fortaleza
com o ataque marcado da Cearamor: o bonde de 150, onde e quando o aviso
aparece, a briga, a caminhada e a partida), `custo_dia.js` (o custo do
quadro do dia de jogo do cenário com a gente toda). `CEL=1` no tamanho de
celular, com toque.

**Medido** (no navegador de teste, sem placa de vídeo: os números absolutos
são piores que num PC; a proporção é o que vale): o clássico de Fortaleza
foi de 136 bonecos e 34 PMs pra 410 e 103; o plano monta no mesmo tempo
(2 a 3 s); com a arquibancada cheia, a conta dos bonecos por quadro foi de
uns 8 ms pra uns 21 ms, e as chamadas de desenho subiram na mesma
proporção.

**Limites (sinceros):**
- Mais gente pesa. Cada boneco ainda é um corpo com esqueleto (não tem
  multidão instanciada nem boneco de papelão de longe): no celular fraco o
  dia de jogo fica mais lento, principalmente com a câmera na arquibancada.
- Torcida com mais de 400 aptos anda com 400; o visitante maior que o
  setor (168 lugares no estádio de 10 mil) fica com o setor cheio.
- A esquina é achada pela forma da rua (três ruas saindo do ponto). Numa
  rota sem esquina que sirva, a briga cai no meio da rua, como antes, e o
  aviso diz "numa transversal".
- "Recuar pra sede" não põe a torcida pra dentro da sede: ela fica na
  porta e apanha sem reagir (a conta é a do jogo).
- A hora da linha do dia ("Ida ao estádio · 11:00") é a do jogo de feed; a
  cidade 3D anda no horário dela (a saída pro estádio perto das 15h).

## 17. A hora da linha igual à da cidade, os avisos do lado direito, o relógio ligeiro, os jogos da cidade sozinhos e o placar de TV (28/09/2026)

O dono, jogando: "corrija a hora do itinerário pra bater com o 3D. os
recados não devem aparecer na tela, devem ficar somente no notícias >
mensagens e as mensagens que não geram botões de decisão se tornam avisos
do lado direito, na ideia do que era o feed anteriormente, mas somem
rapidamente. as horas pulam rapidamente até ocorrer outro evento de
decisão. se o dia não tiver nada, ele pula [...] o jogo não pergunta se eu
quero acompanhar o que acontece em dia de outros jogos na mesma cidade, o
itinerário delas acontece de forma automática no jogo (enquanto o tempo
passa, eles se locomovem rumo ao estádio e a nossa torcida fica na sede
caso não tenha planejado nada. se tiver planejado, vai em direção ao que
quer atacar seja na pista ou concentração) quando o jogo pergunta se eu
quero ver o itinerário de algum outro jogo na cidade, buga. refaça o
visual de dia de jogo na cidade, com o placar do jogo em tempo real
parecendo um placar de jogo de futebol na TV, e a tela com as informações
do itinerário não ficarem ocupando a tela do jogo assim."

- **A hora da linha é a da cidade.** A linha do dia (o itinerário,
  `js/gestao/itinerario.js`) marcava a ida pra 5 horas antes da bola e a
  volta pra 2h05 depois; a cidade 3D faz a ida quando o plano do dia manda
  (o primeiro bonde saindo da sede, perto das 15h num jogo das 16h). Agora,
  quando o plano monta, o dia 3D passa as horas dele pra linha
  (`TO.tela.horasDaLinha`: a ida na saída do primeiro bonde, o jogo na
  bola, a volta no apito final — os 90 minutos mais os 15 do intervalo,
  que o relógio da cidade agora conta também). O recado da partida ("Hoje
  tem…, Iniciar partida") caía numa hora qualquer da manhã e a cidade
  pulava da manhã pra concentração; agora ele cai 75 minutos antes da bola
  (`horaDaPartida`, jogo3d.js). E, fechado o nosso dia de jogo, o relógio
  da praça segue da hora em que ele acabou (antes voltava pra hora de
  antes do jogo).
- **Os recados de outras torcidas não aparecem na tela.** Ficam só em
  Notícias → Mensagens, com o número vermelho no ícone (a decisão da seção
  16, de trazer o recado pro balão, foi desfeita a pedido do dono).
- **O que não pede decisão vira aviso do lado direito.** A notícia sem
  botão (o olheiro, o jornal, o resultado, a obra…) aparece como um aviso
  pequeno no canto de cima, à direita (embaixo da barra do topo), como era
  o feed: até 4 empilhados, cada um some sozinho em 4,2 s (quem passa o
  mouse em cima segura; clicando, abre a mensagem inteira, com ×) — **desde
  29/09/2026 só a manchete de jornal aparece no canto, em recorte, e fica
  7,5 s: seção 19**. O aviso
  não segura o relógio. O balão no meio da tela ficou só pra decisão (os
  botões), que para o tempo até a resposta, como sempre. O jogo carregado
  não repete avisos velhos.
- **O relógio anda ligeiro.** O dia da praça ia das 7h às 23h em 9 s a 1×;
  agora são 3,6 s (15 minutos de jogo a cada 56 ms). A notícia não segura
  mais as horas (antes cada balão de notícia esperava a leitura), então o
  relógio corre até a hora da próxima mensagem e para só na decisão. Dia
  sem nada (nem mensagem, nem jogo da cidade, nem janela lenta) pula em
  0,26 s, sem o apagão da noite; depois do último evento do dia, o resto
  dele passa em no máximo 1 s. As únicas partes lentas são as que se
  veem na cidade: o jogo da cidade no fundo e a nossa investida (as
  "janelas" do relógio, `vida3d.js`).
  O tempo do jogo conta no relógio da parede e a tela conta por quadro
  (no máximo 0,2 s por quadro): na máquina lenta a tela ficava pra trás e
  o dia virava antes da hora — o teste pegou o jogo da cidade sumindo às
  18h, antes da bola. Agora a mensagem e a virada do dia esperam a tela
  chegar na hora (`ritmo.falta`); se a tela ficar 5 s parada (a cidade
  presa por outro motivo), o jogo segue sem ela, pra nunca prender.
- **Os jogos de outros clubes na cidade passam sozinhos.** O olheiro não
  pergunta mais "quer ver na cidade?" (e o recado antigo dos saves de
  antes é respondido sozinho). No dia de um jogo de dois outros clubes na
  nossa praça — o mandante com torcida com sede no mapa, e sem jogo nosso
  no dia —, o dia dele monta NO FUNDO da vida da praça (`jogoNoFundo`,
  dia3d.js): o plano monta escondido no começo do dia (o relógio espera
  uns segundos por ele), e 15 minutos antes do primeiro bonde sair os
  bondes aparecem na concentração, com um aviso ("Hoje tem Ceará ×
  Sport às 16:00… As torcidas estão saindo pro estádio", com "Ver na
  cidade"). O relógio anda mais devagar da concentração à bola (uns 14 s
  a 1×) e na partida (uns 9 s), o placar de TV aparece desde a
  concentração (com a hora da bola; um toque nele leva a câmera pro
  estádio) e mostra a partida, o gol vira aviso, a briga que o mundo sorteou entre elas (a aba Brigas) acontece na
  rua com aviso, e 15 minutos depois do apito todo mundo some. A nossa
  torcida fica na sede, a vida da praça segue na tela.
- **Com investida marcada, o nosso bonde vai.** Se o planejamento marcou
  investida nesse jogo (Outros jogos na cidade: concentração ou pista), o
  nosso bonde (o efetivo do ataque inteiro, até 400, como no dia de jogo)
  junta na nossa porta 8 minutos antes de sair, anda pela rua e pela calçada (o caminho da
  grade do dia de jogo, `caminhoNaRua`) até o alvo — a porta da sede
  deles, 4 minutos antes de saírem (concentração), ou o meio da rota deles
  pro estádio, na hora em que a cabeça do bonde deles passa ali (pista) —
  e chega 40 s antes. Nos últimos 25 minutos antes do encontro o relógio
  desacelera; quando o bonde junta, a câmera vai pra nossa porta e um
  aviso diz pra onde ele vai; na caminhada ela vai atrás da cabeça do
  bonde (quem mexe na câmera fica com ela); e na chegada ela enquadra o
  ponto do encontro, de trás da gente. A decisão do planejamento ("Ir pra Guerra", com o duelo e o
  simular de sempre) cai na hora do encontro, com o texto do que se vê
  ("A gente tá na rua, esperando o bonde da Cearamor passar a caminho do
  estádio. Eles tão chegando — é agora."). Respondida, o bonde volta pra
  sede pelo mesmo caminho.
- **O bug do itinerário velho no balão** (a foto do dono: "VOLTA DO
  ESTÁDIO 13:05 … 158 NOSSOS · 26 DA FACÇÃO JOVEM" em cima do recado do
  olheiro). A linha que acabou ficava guardada pelo NÚMERO da mensagem; o
  número recomeça num jogo novo e em save carregado, e a linha velha
  aparecia em cima de outra mensagem com o mesmo número. Agora ela fica
  presa à mensagem de verdade (o objeto, não o número), e a linha de outro
  jogo é descartada quando o jogo carrega. A pergunta do olheiro, que
  era onde o dono via isso, também saiu.
- **A tela do dia de jogo.** Na nossa linha do dia a cidade fica livre:
  - o **placar de TV** no alto, no meio: a faixa com a cor de cada clube,
    a sigla (FOR, CEA), os gols no quadro branco e o relógio vermelho da
    partida (o minuto; INT no intervalo; 90+2'; FIM). Antes da bola, a
    hora dela. Embaixo, na nossa partida, o clima da arquibancada e os
    botões de pausar e acelerar a partida;
  - o **painel de baixo** encolheu: a faixa das fases (Ida · Jogo · Volta,
    ou Caravana na ida fora de casa, cada uma com a hora da cidade e a de
    agora acesa) e o efetivo (nós × eles, com a escolta), e os botões
    (Nossa, Estádio, Cidade);
  - o **balão** só aparece com decisão (o aviso do ataque, a invasão): a
    linha do dia inteira (os pontos, a caixa da partida, o saldo) não
    aparece mais no balão; o saldo de uma briga aparece uns segundos e
    sai;
  - o **gol** vira aviso do lado direito ("Gol · 20'").

- **A briga na cidade sem ninguém preso em terreno.** O dono, jogando:
  "optei por atacar uma torcida IA que estava visitando a praça e a cena
  iniciada deu vários membros da minha torcida presos dentro de terrenos,
  e quando o rival corre eles ficam parados e a cena não evolui porque tem
  um membro da torcida IA preso também". A máscara do combate na cidade
  (`caminhada.js`, a briga da praça e da rua) saía da grade do passo, que
  deixa andar no miolo do lote, do terreno baldio e do quintal; o bonde
  nasce em bloco em volta do ponto e quem não cabe é reencostado no vão
  livre mais perto — que podia ser um quintal murado, de onde não há
  caminho de volta. E a cena só fecha quando não sobra ninguém de um
  lado: o preso segurava a briga pra sempre. Agora a máscara é só o chão
  de rua do plano do dia (o asfalto e a calçada, `R.publico`, a mesma
  régua da seção 16), e só o pedaço dela que se alcança andando do alvo,
  da tocaia e do ponto: ninguém nasce nem fica fora do alcance.
  E a briga em máquina lenta: as fotos do dono mostram o medidor em 1 a 3
  quadros por segundo com "Sem placa de vídeo: o navegador desenha no
  processador (Microsoft Basic Render Driver)". O laço da briga
  (`js/diajogo/ponte.js`) dava no máximo 0,05 s de briga por quadro — a 1
  quadro por segundo ela andava 20 vezes mais devagar que o tempo de
  verdade e parecia parada. Agora o quadro longo dá até 4 passos de
  0,05 s (ninguém teleporta; a aba que perdeu o foco volta com no máximo
  0,2 s de uma vez).
- **No celular em pé** o balão da decisão passava da borda da direita (a
  coluna de ícones come a esquerda): agora ele nunca é mais largo que a
  parte livre da tela. A faixa das fases (Ida · Jogo · Volta, a hora e o
  efetivo) ficou mais compacta pra caber numa linha.

**Como testar** (em `scratchpad/recados/`, Playwright na pasta do Pages):
`avisos3d.js` (com o tempo parado caem uma notícia, um recado da Cearamor,
outra notícia e uma decisão: as duas notícias viram aviso e somem, o
recado fica em Mensagens, a decisão fica no balão; depois o tempo solto
por 30 s, com as decisões respondidas na hora, conta os dias que passam),
`fundo3d.js` com `INV=ida` (pista), `INV=praca` (concentração) ou
`INV=nao` (o jogo do Ceará em casa trazido pra amanhã: a janela, o
placar, o nosso bonde, a decisão na chegada, o fim), `linha3d.js` (o nosso
dia de jogo: as horas da linha contra as do plano, o balão só com
decisão, o placar de TV), `briga3d.js` com `INV=ida` ou `INV=praca` (a
investida do jogo da cidade com "Ir pra Guerra": cada disco da cena na
máscara e no chão de rua, e a briga correndo até fechar). `CEL=1` no
tamanho de celular, com toque.

**Medido** (no navegador de teste, sem placa de vídeo, 1 a 3 quadros por
segundo): com as decisões respondidas na hora, passaram 27 dias do jogo
em 30 s (os dias vazios pulam); o jogo da cidade (Floresta × Fluminense
de Feira, trazido pro dia seguinte no teste) abriu a janela às 17:10, o
nosso bonde de 150 saiu às 17:24 e chegou no ponto às 17:30 — a hora da
decisão —, a partida passou no placar de TV e o aviso de fim de jogo
saiu com o placar do mundo (2 × 0); na briga da investida (pista e
concentração), os 150 nossos e os 10–11 deles nasceram todos na rua, e a
cena fechou quando eles debandaram (14 a 20 s de briga).

**Limites (sinceros):**
- A janela do jogo da cidade é um "time-lapse": a ida inteira leva uns
  14 s e a partida uns 9 s a 1×. Dá pra ver os bondes indo, não pra
  acompanhar cada um.
- A briga da investida ("Ir pra Guerra") ainda monta o plano dela à
  parte (o nosso clube contra o clube da rival, como antes): o lugar da
  briga é o que esse plano acha na rota da rival, não necessariamente a
  esquina onde o nosso bonde esperou no jogo do fundo.
- O bonde da investida na cidade é o efetivo inteiro (até 400): com a
  vida da praça e o jogo da cidade juntos, é bastante boneco na tela.
- Na briga, quem não está perto do líder não persegue quem foge: a cena
  fecha quando o outro lado sai inteiro ou cai, e seguir o líder é do
  jogador (é a regra do combate de sempre).
- A máquina sem placa de vídeo (o "Microsoft Basic Render Driver" das
  fotos do dono) continua lenta em tudo: a briga ficou perto do tempo de
  verdade, mas a cidade desenha a 1–3 quadros por segundo. No Chrome, a
  "aceleração de gráficos" ligada (Configurações → Sistema) e o driver da
  placa de vídeo instalado resolvem isso de fora do jogo.
- Testado só em Fortaleza, no navegador de teste (PC e celular em pé).

## 18. A fuga pro vomitório, a estrada da caravana, os jogos da cidade só com investida e o planejamento em popup (29/09/2026)

O dono: "o ato de correr quando estiver no estádio vai ser sempre pro
vomitório mais próximo e depois surge no local padrão da torcida. crie uma
cena de caravana que vai basicamente ser uma estrada em linha reta que vai
ter curvas na margem direita da pista com setas apontando quais cidades
estamos passando próximo (são as que definimos na rota do itinerário). em
algum momento alguma torcida pode nos atacar nessa cena quando estivermos
passando na cidade caso isso realmente esteja programado no itinerário.
adapte as duas cenas de caravana para aparecerem durante a estrada.
[exemplo: Fortaleza a Manaus com a Terror Bicolor atacando quando passar
em Belém: o ônibus percorre a viagem em linha reta com as placas das
cidades na ordem da viagem (Maranhão, Belém e depois Manaus); em Belém a
torcida atacante está na margem da estrada, o ônibus para, os membros
descem e começa a hostilidade; definido o conflito, a torcida viajante
entra de novo no ônibus e o itinerário segue com os que não foram
feridos.] remova esse acompanhamento de perto do dia de outros jogos na
cidade, só vai tornar o jogo mais demorado. só vai parar o tempo caso
tenhamos planejado algo pra algum jogo na cidade. transforme o
planejamento da semana em um popup mais bem elaborado pra facilitar a
tomada de decisão, refazendo todo o layout numa nova proposta."

- **Correr no estádio é pro vomitório mais perto.** Na invasão
  (`ferramentas/planta_html/invasao.js`) os pontos de fuga da cena são os
  vomitórios das duas peças de arquibancada que o tabuleiro pega (a boca
  de cada um, fora da faixa da grade), e a cena liga `fugaNaMaisPerto`:
  quem debanda (`js/diajogo/combate.js`, `rotaDeFuga`) não volta mais pela
  entrada de onde veio nem procura a boca do próprio lado — corre pro
  vomitório mais perto dele que não passa por dentro do inimigo, e some
  ali. Fechada a cena, o dia de jogo põe a torcida de volta no setor dela
  (o lugar do plano do dia), como já fazia.
- **A estrada da caravana** (`ferramentas/planta_html/estrada3d.js`, novo).
  Fora de casa, com estrada na rota (o planejamento, `rotaEscolhida`; de
  avião não tem estrada), a fase da ida da linha do dia é a viagem: um
  palco à parte, longe da praça (a cidade some enquanto ela está na
  tela), com uma rodovia reta de mão dupla — asfalto, faixa amarela,
  acostamento, cerca, postes com fio, árvores, capim — e o ônibus da
  torcida (o branco com as cores dela e o letreiro "CARAVANA · destino")
  na mão da direita. Cada praça da rota, na ordem da viagem, tem o trecho
  dela: a placa verde de aviso com o nome ("BELÉM · próxima saída"), a
  saída — uma alça que abre em curva pra direita — com a placa "SAÍDA" e
  a seta, e a cidade lá no fundo (prédios, a caixa d'água, a igreja). A
  última é o destino: o ônibus pega a saída dela e a viagem acaba; aí a
  praça do jogo carrega e o dia segue como antes (onde a caravana desce,
  a caminhada, a partida). O sol anda com a viagem (a hora da saída até a
  da chegada, a do itinerário), o painel mostra a hora e a praça da vez, e
  o "Pular" leva o ônibus até perto da próxima parada. Na volta (depois do
  apito), a mesma estrada ao contrário, até em casa.
- **A emboscada é na praça marcada, numa das duas cenas do dono.** A
  emboscada que o itinerário marcou numa praça da rota
  (`emboscadaNaPraca`) acontece no trecho dela: a peça da cena
  (`js/diajogo/caravana3d.js`, o posto ou a pista fechada) entra encaixada
  na rodovia, na mesma escala e com o tabuleiro da briga girado junto
  (`montarCaravana`/`cenaDaCaravana` ganharam o `giro`, e o plano do posto
  perde o carro que saía pro pátio, por onde o ônibus entra). No POSTO o
  ônibus sai da pista, entra no pátio e para na frente das bombas, com
  eles esperando na saída do pátio; na PISTA FECHADA ele para no meio da
  pista, do lado dos dois carros brancos atravessados, com eles na
  calçada, atrás. O recado da linha aparece com o ônibus parado e eles à
  vista ("Descer pra treta", "Simular", "Mandar seguir viagem"). Descendo
  (ou simulando), a torcida desce pela porta do ônibus, um atrás do outro,
  e se espalha de frente pra eles; a briga é a de sempre, no mesmo lugar.
  Definida a briga, quem ficou de pé (inclusive quem correu dela) volta
  pro ônibus, os caídos ficam no chão, os deles vão embora pela beira, e
  a viagem segue — o efetivo da linha já sem as baixas, e o bonde que
  chega na cidade do jogo é esse (antes o plano do dia usava o efetivo da
  saída). Sem descer, o ônibus sai de novo e eles ficam na beira.
- **A linha espera a caravana.** Enquanto o ônibus está na estrada (ou a
  cidade do jogo carrega na chegada), a linha do dia não passa pra fase
  seguinte (`naEstrada`/`quandoChegar` do dia 3D, main.js `itnProximo`).
  A lista de paradas detalhadas do itinerário (`detalhadas`) virava a
  lista das três fases por engano (a mesma lista esvaziada) — conserto
  pequeno em `itinerario.js`, é dela que a estrada lê as praças.
- **Os jogos de outros clubes na praça só aparecem com investida.** O
  jogo da cidade (seção 15 e 17) montava no fundo todo dia de jogo alheio,
  com o relógio mais lento na janela dele. Agora ele só monta quando o
  planejamento marcou uma investida nele (a concentração ou a pista): o
  nosso bonde junta na porta, sai, e os bondes do jogo aparecem nessa
  hora; o relógio desacelera só na chegada do nosso bonde. Sem investida
  não monta nada, não tem aviso, e o dia passa no ritmo de sempre (o jogo
  corre só no resultado e na aba Brigas das Notícias).
- **O planejamento da semana virou um popup** (main.js,
  `abrirPlanejamento`; `css/planejamento.css`, novo). O cartão de segunda
  ficou curto — a semana, uma linha por jogo com o que está decidido e o
  botão "Abrir o planejamento" (o "Fechar o planejamento" continua no
  cabeçalho dele). O popup: no alto, a semana e o que a torcida tem pra
  gastar (caixa, aptos pro estádio, bombas no estoque); à esquerda, a
  pauta da semana em ordem de dia — os nossos jogos, os jogos de outros
  clubes na praça e os aliados que chegam —, cada um com uma etiqueta de
  cor do que está decidido ("em paz", "em cima da X · na pista",
  "atacar: falta o alvo", "investida contra X"); à direita, o item
  escolhido: o jogo com os escudos, **quem vai estar na rua** (a nossa
  gente e cada torcida do dia em barra, com a faixa da estimativa e o
  hostil em vermelho) e as decisões em seções numeradas, com as escolhas
  em cartões grandes — a caravana (quantos vão, a estrada com o que ela
  custa à torcida com a gente de agora — o mesmo número do "custa" e do
  pé; o cartão antigo mostrava o frete cheio, que não batia com nada — e a
  barra do risco de emboscada, o trajeto praça por praça com as hostis
  marcadas, a aliada que recebe), a rua (ir em paz ou atacar; contra
  quem, com a faixa e a relação; onde, com o que cada ponto quer dizer; o
  efetivo; as bombas), a investida nos outros jogos e a recepção dos
  aliados (o custo e o efeito na relação de cada opção); no pé, o que a
  semana custa (os compromissos do planejamento), o que falta decidir e
  os botões "Decidir depois" e "Fechar o planejamento" (desligado
  enquanto falta alguma coisa). O popup para o tempo enquanto está
  aberto, fecha no × e no Esc, e abre também pelo ícone novo
  "Planejamento" do menu lateral (fechado o plano, ele abre só pra ver).
  No celular ele ocupa a tela inteira e a pauta vira uma fita de abas em
  cima. As regras não mudaram: o popup escreve o plano pelas mesmas
  funções do cartão de antes (`js/gestao/planejamento.js`;
  `estimativaCaravana` aceita a estrada pedida, pro preço de cada cartão).
- **Na estrada, o alto da tela é dela.** O relógio da barra de cima anda
  com a hora da viagem (antes ficava parado na hora da saída, 07:00, e na
  volta na do apito, 17:39, com a faixa marcando outra), e o placar de TV
  da partida some enquanto o ônibus roda (volta na cidade). O 1×/2× do
  jogo vale na estrada também (o ônibus e a gente descendo e subindo).
- **Os lados.** O dono escreveu "curvas na margem direita" e, no exemplo,
  "curvas à esquerda". A estrada segue a mão brasileira: o ônibus na mão
  da direita, e as saídas, as placas e a emboscada na beira da direita.
  Trocar o lado é o sinal de `l` (metros pra direita) nas saídas, em
  `estrada3d.js`.

**Como testar** (em `scratchpad/recados/`, Playwright na pasta do Pages):
`estrada3d.js` — uma caravana Fortaleza → Manaus pela rota
Maranhão–Belém com a Terror Bicolor marcada em Belém; `CENA=posto` ou
`CENA=onibus` (a cena da emboscada), `RESP=descer`, `simular` ou `seguir`
(a resposta ao recado), `VOLTA=1` (a emboscada na volta, depois do jogo),
`SEM_EMB=1` (a viagem sem emboscada), `CEL=1` (celular em pé). Ele loga a
posição do ônibus, a praça da vez, o recado, a descida, a briga, o
embarque, o efetivo da linha, a cidade montando e a volta pra casa, e
fotografa cada passo. `fuga3d.js` (`VIA=corredor` ou `arquibancada`): a
invasão do estádio, quem corre pra qual vomitório e onde some, e a
torcida de volta no setor. `planejamento3d.js` (`FORA=1` pro jogo fora,
`CEL=1`): o cartão curto, o popup, atacar, fechar o plano e reabrir pelo
menu. `fundo3d.js` com `INV=nao` (o jogo de outros clubes na praça sem
investida: nada monta e o dia passa) ou `INV=ida`/`praca` (com
investida, monta como antes).

**Medido** (no navegador de teste, sem placa de vídeo, 1 a 7 quadros por
segundo):
- Estrada, posto e "Descer pra treta": o ônibus passou por Maranhão,
  saiu da pista em Belém, parou no pátio (a 386 m da saída de casa) com os
  22 deles esperando; desceram 36 dos nossos pela porta; a briga (perdida:
  "sua torcida foi corrida do lugar"), o relatório, os de pé de volta no
  ônibus, a saída de Manaus, a cidade montada e a caminhada — sem erro.
- Estrada, pista fechada e "Descer pra treta": parou no meio da pista, do
  lado dos carros; ganhamos (35 deles e 21 nossos no chão), os de pé
  embarcaram e o bonde que chegou na cidade foi de 129 (150 − 21).
- "Simular" no posto: a linha seguiu com 136. "Mandar seguir viagem" na
  volta: o ônibus saiu do pátio, passou por Maranhão, pegou a saída de
  Fortaleza e o dia fechou em casa.
- Fuga no estádio: pelo corredor, 113 dos 115 discos miram o vomitório
  mais perto (os outros 2 teriam de passar por dentro do inimigo); os 28
  que correram sumiram todos na boca de um vomitório. Pela arquibancada,
  93 de 115 (22 dos nossos com a rival entre eles e o vomitório mais
  perto vão pro outro); os 17 que correram sumiram na boca. Nos dois, a
  torcida voltou pro setor (m1, "no lugar") quando a cena fechou.
- Planejamento, PC e celular em pé: o popup abre pelo cartão curto e pelo
  menu, para o tempo enquanto está aberto, o "Atacar" muda a etiqueta do
  jogo na pauta na hora ("em cima da Narraça · na pista"), o "Fechar o
  planejamento" responde a mensagem ("Caravana: 83 para Manaus. Plano: em
  cima da Narraça.") e reaberto pelo menu ele só mostra (selo "plano
  fechado"); nada transborda no celular.
- O jogo de outros clubes na praça sem investida (Floresta × Fluminense
  de Feira, trazido pro dia seguinte no teste): nada montou (nem o jogo,
  nem janela no relógio, nem aviso) e o dia do jogo passou em 9 s, até o
  dia 4. Na estrada, o relógio de cima marcou a hora da viagem (09:37 nos
  dois) e o placar de TV ficou escondido.

**Limites (sinceros):**
- A viagem é um time-lapse: a estrada de três praças tem uns 600 m e o
  ônibus anda a 28 m/s — a ida inteira leva uns 25 s a 1×, e o sol vai da
  hora da saída à da chegada nesse tempo. As distâncias entre as placas
  são simbólicas (190 m por praça), não as da rodovia.
- A estrada só existe quando a rota é por estrada. De avião a linha segue
  como antes (sem cena de viagem), e a volta pela estrada só aparece
  quando a ida foi por ela.
- Os nomes das praças no recado vêm do dado do itinerário, às vezes sem
  acento ("Foi em Belem"); as placas usam o nome da planta ("BELÉM").
- A fuga "pro vomitório mais perto" é o mais perto que não passa por
  dentro do inimigo (a régua do dono de 17/09): quem tem a rival entre
  ele e o vomitório mais perto corre pro outro. Na arquibancada o
  tabuleiro da invasão pega só um pedaço do anel, então são poucos
  vomitórios em jogo (2 nas fotos).
- O cabeçalho do cartão curto da semana no celular fica apertado (a data,
  o selo e o botão numa linha só).
- O relógio de cima e a data: a data da barra continua sendo a do jogo
  (a ida de véspera aparece com a data do dia do jogo), como antes.
- A máquina sem placa de vídeo continua lenta em tudo (1–7 quadros por
  segundo no teste): a estrada é leve (50–100 mil triângulos), mas a
  cidade que monta na chegada é a mesma de sempre.
- A seção 17 ("o jogo da cidade no fundo" com a janela lenta) vale agora
  só pro dia em que o planejamento marcou investida.

## 19. Ajustes da jogatina: a partida a 4×, o canto só de jornal e o que veio junto (29/09/2026)

O dono, jogando: "Não gosto muito de scrollbar nas mensagens de decisão,
principalmente os verticais. Tente ajustar pra evitar ao máximo o
scrollbar. O tempo padrão que corre a partida é 4x. As mensagens de jornal
que devem aparecer no canto direito são as do Gazeta dos sports e futebol e
porrada, com o layout de manchete de jornal, com aquele padrão que existia
no feed. Toda vida que clico em diminuir ou aumentar quantidade de bombas
ou de envolvidos em caravana ou briga no planejamento a tela volta pro
topo. Corrija isso. Quase todas as vezes que preciso abrir outro mapa
devido a caravanas o jogo buga e recarrega automaticamente."

Cada ponto foi tratado por um agente numa cópia separada do repositório,
com o teste dele; as branches foram juntadas depois.

- **A partida corre a 4× na cidade também.** A partida do dia de jogo em 3D
  nascia a 1× (`itnPartida`, main.js: `vel || (em3d ? 1 : 4)`, e o botão do
  placar de TV nascia "1×"). Agora nasce a 4×, o padrão da casa desde
  08/09, como no feed 2D. A conta é a de sempre: `MIN_POR_SEG` = 4 minutos
  de jogo por segundo a 1×, então 4× são 16 min/s. Os 90' levam 5,6 s (uns
  6,4 s de apito a apito), contra 11,3 s a 2× e 22,5 s a 1×. O botão do
  placar anda 4× → 1× → 2× → 4× (o anel de `alternarVelPartida`, o mesmo do
  feed) e o espaço pausa como antes. A partida que um save já guardou em
  andamento (`minAcum` existe) segue na velocidade guardada; só a partida
  nova nasce a 4×. Não mudaram: a velocidade geral (o 1×/2× da barra de
  cima, que vale pro dia e pra briga), a briga da invasão (só pausa a
  partida; o `vel` não é tocado) e o jogo da cidade no fundo (anda pelo
  relógio do dia, sem `vel`). O relógio da partida é de parede (`minAcum` +
  `t0`), então a 4× nada pula em máquina lenta; mas a tela conta por quadro,
  e com a partida em ~6 s e o dia fechando ~2 s depois do apito o último gol
  podia ficar sem aviso e o relógio da praça recomeçar de uma hora velha:
  por isso `D3.apito` avisa os gols que faltam e põe o relógio do dia no fim
  (bola + 90' + intervalo). **O que isso custa:** o botão "Invadir" do
  painel fica na tela uns 6 s (eram uns 23); pausar no espaço ou pôr o
  placar em 1× antes dá calma, e o clima tenso segue pausando e perguntando
  sozinho (em jogo de rival forte ele chega em 2–5 s de bola rolando).
- **O canto direito é só de jornal.** O canto (`recados3d.js`) deixou de
  mostrar todo texto sem decisão. Agora só a mensagem de jornal vira aviso,
  em RECORTE compacto: a Gazeta dos Sports (`rodada`) e o Futebol e Porrada
  (`confronto`, a treta nossa, `lnt-fundacao`/`lnt-fim` e `obra`), e o
  almanaque cujo jornal for um dos dois (hoje todo almanaque sai em "O
  Almanaque", então nenhum aparece). O recorte é o papel `.gz` do feed, com o
  nome do jornal, o chapéu, a manchete, o olho e, na Gazeta, o placar grande,
  sem o quadro do lado e sem o botão do jornal completo. Vem de
  `TO.tela.recorteDeJornal(e, m)` (main.js): o mesmo nó do cartão da
  mensagem, dos mesmos moldes, com o quadro cortado; o estilo é
  `css/gazeta.css`, `.gz-canto` (330 px no PC, 250 no celular). O filtro é
  `ehJornal(m)`, uma tabela tipo → jornal, fácil de ampliar. Status, dica,
  aniversário etc. não aparecem mais no canto (seguem em Notícias); o gol e o
  jogo da cidade do dia de jogo continuam no cartão escuro.
  **A treta nossa nunca aparecia:** `chegouUma` a ignorava ("não passa pelo
  feed"), mas `dropar` (feed.js) a põe em `E.feed` como as outras. Agora ela
  sai no canto quando o relógio a solta, na hora dela no dia da praça (0,5 a
  3,6 s depois de criada, a 1×); no dia de jogo as brigas do itinerário saem
  numa manchete só, quando o dia fecha (`fecharLote`, como já era). O recorte
  fica 7,5 s (5,8 s a 2×), contados em segundos de parede (no máximo 1 s por
  quadro; antes o aviso contava o quadro do jogo, 0,25 s, e na máquina lenta
  ficava 2 a 4 vezes mais). O mouse em cima segura; o clique ou o toque abre o
  cartão inteiro (com o quadro e o "Mostrar jornal completo"); ele não segura
  o relógio. Só dois recortes de cada vez: numa rajada ficam a treta nossa,
  depois a Gazeta, depois o resto (o mais novo no empate; o que está sob o
  mouse ou aberto não é trocado). O recorte que encosta no balão de uma
  decisão (o celular, e o PC quando quem fala está à direita) espera escondido
  e sem correr até o balão sair. O cartão aberto tem 600 px pro jornal, cresce
  até o que couber na tela e só rola em último caso, com barra fina e nunca de
  lado. Um bug antigo saiu junto: o `p` do aviso escuro vazava pro papel do
  jornal aberto (texto cinza claro cortado em 3 linhas).
- **O planejamento não volta mais pro topo.** A causa: o `pintar()` do
  popup (`abrirPlanejamento`, main.js) refazia a caixa inteira a cada
  clique, e quem rola — o item (`.plj-det`), a pauta (`.plj-lista`) e as
  abas de praça (`.plj-pracas`; no celular a pauta e as abas rolam de lado)
  — nascia de novo com a rolagem no zero; o botão apertado também morria e o
  foco do teclado ia junto. Não era só dos contadores (− / + de "Vão na
  caravana", "Efetivo" e "Bombas"): todo cartão, item da pauta e aba tinha o
  mesmo defeito. Agora o `pintar()` guarda a rolagem de cada um e o lugar do
  foco antes de refazer e devolve depois de desenhar (se o conteúdo novo é
  mais curto, o navegador segura no fim dele). O foco volta pro botão que
  ficou no mesmo lugar, ou pro irmão dele quando aquele desliga (o + que
  bateu no teto passa o foco pro −), com o anel do teclado dentro do botão
  (`css/planejamento.css`). Outro item da pauta ou outra praça é outro
  conteúdo e começa do alto; a pauta e as abas mantêm a posição. Nenhum
  outro gatilho repinta o popup (`estado.mudou`, `atualizarFeed`,
  `pintarTopo`, `salvar` e os timers não tocam nele). As telas antigas
  `abrirCaravana` e `abrirAtaque` mantêm a rolagem (o corpo é refeito dentro
  do mesmo elemento que rola) e só perdem o foco do teclado a cada toque —
  não corrigi. **Medido** (PC e celular emulado, jogo em casa e fora): antes,
  18 dos 20 cliques em − / + caíam em outro lugar depois do 1º clique (item
  102→0 e 379→0; pauta 227→0; abas 850→0; num teste o clique caiu no fundo
  escuro e fechou o popup); depois, a rolagem fica igual (±0 px) nos 20
  cliques de cada contador, na pauta e nas abas, sem erro no console.
- **As mensagens de decisão sem barra de rolagem.** O balão de decisão
  (`.j3d-balao`, `recados3d.js`) tinha um teto de 46% da altura da tela
  (34% no celular) com rolagem por dentro, sem olhar o espaço livre nem o
  conteúdo. No celular deitado (844x390, mais largo que os 760 px da regra
  do celular) o teto era de 179 px: 46 de 56 medidas rolavam e os botões da
  decisão ficavam abaixo da dobra; a tabela de presença da partida tinha
  ainda rolagem horizontal própria (173 a 602 px). Agora, depois de
  desenhar o cartão, `ajustar()` (chamada dentro de `ancorar()`, e só
  refaz a conta quando o cartão ou a tela mudam) mede o balão contra o
  espaço livre — da barra/placar de cima até a borda de baixo, ou até o
  painel do dia de jogo — e escolhe o jeito que cabe, do que menos mexe pro
  que mais mexe: (1) a largura: a da folha (360 px) e, se passa do
  "conforto" (46% da altura, entre 300 e 420 px), os degraus 440/520/600/680
  px (teto de 520 no PC; 680 se a tela tem menos de 560 px de altura, o
  celular deitado); (2) a compactação, cumulativa, medindo de novo a cada
  nível: `.c1` os espaços, `.c2` a letra, `.c3` a hora na linha de quem
  fala, os botões em duas colunas e a tabela mais densa — nada some, só
  encolhe; (3) só se nada couber, o corpo rola (`--corpo-max`): fino, no tom
  do balão, nunca de lado, com os botões da decisão colados embaixo
  (`position:sticky`). O cartão que já cabia fica idêntico. Se o balão não
  cabe em cima da cabeça de quem fala, ele encosta no alto e cobre quem fala,
  sem o rabo (`.sobre`). A tabela de presença da partida quebra em linhas, e
  a caixa `.j3d-dia-caixa` (modal) ganhou um teto de reserva. **Medido** no
  jogo real (28 tipos de decisão com os botões reais, 1280x720, 1366x768,
  1024x600, 1920x1080, celular em pé 390x844 e deitado 844x390): com
  rolagem, antes → depois — PC 40 → 0; celular em pé 18 → 0; celular
  deitado 46 → 2; botão fora da vista, 28 → 0, 10 → 0 e 36 → 2; balão fora
  da tela, 0 → 0 nas três. No dia de jogo (a linha no balão e a caixa
  modal) nada rola nem antes nem depois, salvo o celular deitado (1 → 0).
  **O que ainda rola:** só o cartão antigo do olheiro (tabela + aliados) no
  celular deitado, 51–77 px, com os botões à vista; esse cartão nem é
  gerado pelo jogo atual (`SUGESTOES_DO_OLHEIRO` está desligado em
  `feed.js`), só aparece em save antigo. **O que isso custa:** o balão mais
  largo e mais alto cobre quem fala em vários casos (36 de 83 medidas no PC,
  17 de 56 no celular em pé, 28 de 56 no deitado); se ficar demais, é baixar
  o teto de largura (520) ou o "conforto" (46%) em `ajustar()`. **Como
  testar:** no jogo (`jogo.html?cenario&teste`) fazer cair as decisões mais
  compridas — entrevista, semana cheia, a partida com todas as torcidas — nos
  tamanhos acima e conferir que o balão aparece inteiro, com os botões, sem
  barra (`document.querySelector('.j3d-balao-corpo')` com `scrollHeight <=
  clientHeight`; a classe do balão, `c1`..`c3`, diz o quanto apertou).
- **Abrir outro mapa pela caravana: o que se achou e o que se corrigiu.**
  O dono: "quase todas as vezes que preciso abrir outro mapa devido a
  caravanas o jogo buga e recarrega automaticamente". **A queda da aba e a
  recarga da página NÃO foram reproduzidas** (Chromium com SwiftShader, o
  mais perto que se tem de "sem placa de vídeo": a memória da "GPU" também
  fica na RAM). O que ficou provado: no jogo só existe `location.reload()`
  na troca de idioma (`i18n.js`), sem service worker nem handler global de
  erro; a memória faz platô entre uma viagem e a seguinte (não há
  vazamento crescente); cada caravana monta DUAS cidades inteiras (a de lá
  e a de casa, na volta), com a barra "Montando a cidade… N de 3.808" —
  8 a 20 s com a máquina vazia, 25 a 55 s carregada, bem mais no PC do dono
  — e o pico de RSS do navegador todo é de 2,2 a 2,6 GB por montagem (a
  remontagem da casa é a maior; GPU ~1,2 GB, página ~1 GB), o que é
  plausível de faltar numa máquina de 4 GB, sem prova. O "recarrega" que o
  dono vê pode ser essa remontagem inteira, ou a aba morrendo — não dá pra
  dizer. Foram corrigidas quatro quebras reais do fluxo, provadas no
  navegador de teste, e cortada uma parte da memória: (1) **a placa perde
  o contexto WebGL** (o processo de GPU cai): antes a cidade sumia, o laço
  lançava `Cannot read properties of null (reading 'byteLength')` e, no meio
  do dia de jogo, a linha ficava presa em "a caminho · na cidade" pra
  sempre; agora `cenario.js` avisa na caixa e, quando o contexto volta,
  REMONTA a praça que estava na tela, e `jogo3d.js` (evento
  `cenario-placa-voltou`) põe o dia de jogo pra fora (`dia3d.cidadeRefeita`:
  o plano do dia não sobrevive à cidade refeita, e a linha segue sem a
  cidade em 3D); (2) **o relógio do jogo corria atrás da barra "Montando a
  cidade…"** (na volta da caravana, com a barra em 771 de 3.808, já tinha
  derrubado uma mensagem da fila e travado numa decisão): agora a montagem
  segura o tempo (`praca-montando`); (3) **vazavam ~245 texturas de osso por
  viagem** (cada esqueleto cria a sua e o three.js só a devolve à placa no
  `dispose`): `liberar` em `bonecos3.js` agora dispõe o esqueleto e
  `limpar()` chama `liberar`; (4) **se a montagem falha por falta de
  memória** (`RangeError`), a cidade ficava morta atrás da caixa de erro:
  agora tenta de novo uma vez ("Faltou memória pra montar X. Tentando de
  novo…"). E na memória: as folhas de decalque (letreiros, pichações,
  escudos) guardavam o canvas de cada uma — mais de mil por cidade, 130 MP
  no pico — e subiam as dez folhas de 2048 px de novo aos 0,7 s e aos
  2,5 s; agora só o que repinta (o escudo com PNG) fica com o canvas, o
  resto sobe uma vez e o canvas sai (`FolhasDeDecalque`; o chão e as folhas
  sobem pra placa na hora, um ladrilho por vez, `initTexture`). Medido nas
  duas viagens completas, antes → depois: RSS em regime −50 a −260 MB
  (média ~6%); imagens na placa 439 → 103 MB; pico do processo de GPU
  −300 MB; pico do RSS total −3 a 8% em 3 das 4 montagens e +2% em uma —
  **o pico de 2,2 a 2,5 GB continua**; o tempo de montagem é o mesmo; a
  aparência não mudou (9 vistas de portas, letreiros, pichações e escudos:
  0 pixel diferente em 7, 190 e 102 px de borda de árvore nas outras 2).
  Mais: a praça de fora é "visita" (`abrirPraca(nome, forcar, visita)`): não
  vira a praça lembrada pro boot (antes, se a aba caía com Manaus montando,
  o menu abria Manaus atrás do "Continuar"). **O que ficou sem prova de
  ocorrência no PC do dono:** o tratamento do contexto perdido, a
  retentativa em `RangeError` e a "visita" (marcadas assim nos comentários).
  **Não implementado:** liberar os arrays do mato depois de subir (só saem
  12 MB), mudar a qualidade padrão em placa por software (Leve corta 130 a
  200 MB, Mínima 200 a 250 MB), e o desperdício de "Fortaleza cancelada +
  Fortaleza" no novo jogo/Continuar (20 a 40 s de montagem descartada). Pra
  baixar o pico de verdade seria preciso mexer na geração do mato e das
  peças (transitório de ~+400 MB no mato). **Componentes** (aumento de RSS
  entre fronteiras, Fortaleza | Manaus): chão +107 | +81 MB de textura na
  placa; peças (forno) +339 | +125 MB; juntar malhas +122 | +27; mato +212 |
  +358 MB (o maior transitório, heap JS +172 | +273); regime da cidade: GPU
  ~1,1 a 1,2 GB, página ~0,6 GB, heap JS ~370 MB. **O que ajudaria a
  fechar o caso:** o navegador e a versão do dono, a RAM, a mensagem exata
  ("Ah, não!", tela em branco, volta ao menu), o Gerenciador de Tarefas do
  Chrome (Shift+Esc) e `chrome://crashes`; e, se for falta de RAM, a
  qualidade Leve/Mínima e menos abas. **Como testar:** abrir
  `jogo.html?cenario&cidade=Fortaleza&teste`, começar a partida, abrir um
  jogo fora com estrada e medir o RSS do navegador e o `renderer.info` a
  cada etapa; pra placa, `gl.getExtension('WEBGL_lose_context').loseContext()`
  e `restoreContext()` (ou `Browser.crashGpuProcess` por CDP) e conferir que
  a praça remonta sozinha, inclusive no meio do dia; pro relógio, conferir
  `TO.tela.pausasDoTempo` igual a `['praca-montando']` durante a remontagem
  da casa; pro vazamento, contar as texturas do WebGL contra as do JS depois
  de duas viagens (esperado: 9 órfãs).

**Limites (sinceros):**
- Nenhum dos cinco pontos foi testado num PC de verdade sem placa de vídeo
  nem em outro navegador que não o Chromium do teste (SwiftShader, PC e
  celular emulado). O do mapa é o de menor certeza: a causa do relato do
  dono não foi reproduzida.
- A partida a 4× dura uns 6,5 s de apito a apito; a janela do botão
  "Invadir" do painel também (eram uns 23 s). O clima tenso segue pausando e
  perguntando sozinho.
- O canto direito só tem jornal; status, dica e aniversário só aparecem em
  Notícias. Hoje nenhum almanaque aparece no canto (todos saem em "O
  Almanaque").
- O balão de decisão mais largo e mais alto cobre quem fala em vários casos
  (sem o rabo); ainda rola, por poucos pixels, só o cartão antigo do olheiro
  no celular deitado (que o jogo atual nem gera).
- No planejamento, as telas antigas de caravana e de ataque só perdem o foco
  do teclado a cada toque (a rolagem delas já se mantinha).

## 20. O bote no bar e a treta marcada em 3D (29/09/2026)

O dono: "Algumas cenas como bote no bar e briga marcada apostada ainda não
funcionam no 3d. Veja os detalhes da Briga no bar conforme era no 2d como
quantos de cada lado, faixa ou bandeira estendida, perdedor se for o
defensor o bar rende menos por um tempo, etc. a cena do bar sempre vai ser
no respectivo bar da torcida atacada, no mapa do jogo. Torcidas que ainda
não tem bar não dá pra atacar assim. Aplique os detalhes da treta marcada
também".

As duas cenas caíam na foto 2D porque o `palcoDe` do jogo 3D (vida3d.js)
não conhecia 'bar' nem 'treta-*'. Agora conhece:

- **O bar é o do mapa.** A cena 'bar' vira `palcoDoBar` (vida3d.js) →
  `brigaNoBar` (briga_bar.js, novo). O bar é da torcida atacada: a rival no
  nosso bote, a gente no ataque deles; entre os bares dela no mapa
  (`planta.bares()`), o mais perto da sede de quem ataca. O tabuleiro do
  combate (1536 × 1024 px) é um retângulo da cidade na escala da caminhada
  (√0,3: 43 × 29 m), com o x ao longo da rua da frente e o y da fachada pra
  rua; a fachada fica abaixo do meio, pra transversal subir inteira acima do
  bar. A máscara é a grade do passo do cenário (as paredes, o balcão, as
  mesas e as portas de enrolar levantadas são os riscos do próprio modelo)
  na rua, na calçada e dentro do lote do bar, só o que se alcança andando.
  Os pontos do salão saem de `planoDoBar` (casas3d.js, novo), com as mesmas
  contas do modelo do bar (`barTorcidaDireita`), espelhado com a esquina.
- **Os papéis são os da foto.** Quem ataca desce a transversal em duas
  turmas (1º e 2º escalão) e o objetivo é o BALCÃO DO BAR, lá dentro; quem
  defende está de guarda no salão (DONOS DA CASA) e na varanda (NA VARANDA,
  a cena reparte o bonde entre os dois), de costas pra rua até alguém pisar
  na FRENTE DO BAR (4,6 m) ou aparecer na porta; a saída dele é o FIM DA
  RUA; a PM vem pelas duas pontas da rua da frente. A faixa ou a bandeira de
  quem defende (no bar, bandeira 70% das vezes: combate.js agora lê
  'bar@3d' como bar) fica estendida na parede de fora da esquina, virada pra
  transversal. A câmera de cima tira a laje e o apartamento: vê-se o salão.
  O texto do botão é "Tomar o bar" no nosso ataque e "Largar o bar" na
  defesa (a foto usava o do ataque nos dois casos).
- **Os números e as consequências são os do jogo de feed** (main.js e
  acoes.js, sem mudança): no nosso bote, até 60 nossos contra 35% do efetivo
  de pé deles, até 40 no salão; no ataque deles, um quarto dos nossos aptos
  (até 40) contra o que o serviço pede (até 60). Ganhando o bote: R$ 60 por
  membro de pé deles + 22% do caixa deles (galpão ×0,7, cofre ×0,5) e o bar
  deles quebrado (metade da receita por 45 dias). Perdendo a defesa: R$ 60
  por membro da torcida deles + 10% do nosso caixa (galpão e cofre
  protegem), o nosso bar quebrado 45 dias, moral −3 e prestígio −0,7. Faixa
  ou bandeira tomada vai pro relatório e pro patrimônio de quem tomou.
- **Sem bar, sem bote.** `TO.acoes.temBar(E, id)`: o bar do jogador vem do
  patrimônio, o da IA do mundo vivo dela e, com o jogo em 3D, do mapa da
  praça (`TO.jogo3d.temBar`: no mapa só tem bar quem tem sede, a regra da
  planta). A lista de alvos do "Atacar bar ou sede rival" e o bote que a
  diretoria propõe só oferecem bar de quem tem um (a sede continua na
  lista); o ataque do trimestre ao nosso bar não acontece sem bar nosso
  (feed.js), nem o da sub-sede inimiga (relacoes.js). Exemplo: na praça de
  Curitiba, a Ultras 92 (nível 0, sem sede no mapa) não tem bar pra ser
  atacado; o jogador com sede 1 que não comprou bar também não.
- **A treta marcada na favela.** 'treta-beco', 'treta-galpao' e
  'treta-campo' viram `palcoDaTreta` (vida3d.js) → `brigaNaTreta`
  (briga_treta.js, novo). O mapa 3D não tem bairro (a nota da planta), então
  o lugar sai de um sorteio fixo da treta (o bairro, o rival, o tamanho e a
  LNT): o 5×5 num BECO de favela (entre os oito becos de 20 m ou mais da
  praça, o trecho do meio, até 40 m), o 7×7 e o 10×10 no CAMPINHO DE TERRA
  de uma favela (a cidade 3D não tem pátio de galpão). A saída de cada bonde
  é a ponta do outro (furar pra fora). O resto é do jogo de feed: o mesmo
  efetivo dos dois lados, a linha de frente primeiro, sem pedra nem bomba,
  os dois lados acordados e o deles vindo, a aposta na roda (quem ganha leva
  a dos dois), relação −2 (a régua `REL.treta`), prestígio +3/+4/+5 pro
  vencedor e a variante da LNT.
- A planta ganhou na API: `bares()` com a frente, a esquina, a testada e o
  fundo do lote; `favelas()` (os becos e o campinho); `ehAsfalto()`. O dia
  de jogo ganhou `ganchosDaBriga` (a investida no "bar deles" com o dia no
  ar para o dia e esconde os bondes das duas).

**Como foi testado** (Playwright + SwiftShader, PC 1280×720 e celular
390×844): em Fortaleza (mapa grande, TUF), o bote no bar da Aliança (60
contra 8, eles debandaram: "VITÓRIA NO BAR RIVAL", R$ 1.376 do caixa deles,
o bar deles em cacos por 45 dias), o ataque da Cearamor no nosso bar (45
contra 39, repartidos 20 no salão e 19 na varanda, a nossa bandeira na
parede; perdendo: −R$ 9.600, o bar quebrado 45 dias, a bandeira perdida), e
as tretas de 5 (beco da Favela do Sudoeste, 2,5 m de largura), 7 e 10
(campinho da Favela do Alto): relatório com a aposta, sem arma nem bomba;
com o líder guiado até o canto do outro lado, o 7×7 fecha em "sua torcida
saiu do campinho por cima", prestígio +4 e +R$ 2.000. Em Curitiba (mapa
médio), a Ultras 92 sem bar no mapa nem no save (`temBar` falso) e o bote
no bar dos Dragões Alviverdes; no Interior do RS (mapa pequeno), o bar com
a esquina do outro lado (o tabuleiro espelhado) e a vitória 60 × 18 (R$
3.440). Sem erro de página em nenhum. A máscara de cada cena foi desenhada e
conferida (o lote, a transversal, o balcão, a faixa, o gatilho).

**Limites (sinceros):**
- O bar do mapa é pequeno: o salão tem uns 6 × 4 m nos lotes de 5 a 6 m de
  fundo. 40 a 60 pessoas não cabem lá dentro; a briga vaza pra varanda e
  pra calçada, e o balcão fica entupido (o líder só chega nele depois que os
  donos da casa caem ou correm). O salão da foto 2D era bem maior.
- Sem o gradil da calçada da foto (a grade que segurava a investida e
  quebrava): o bar 3D não tem gradil, e a grade do combate desenhada pela
  cidade sai fora de escala. Ficou de fora.
- Com o jogador parado, o ataque espera: os donos só acordam quando alguém
  pisa na frente do bar ou quando a turma deles sai pra recolher a faixa,
  como na foto.
- O ataque à SEDE rival (que no jogo de feed também abre a foto do bar)
  continua na cena 2D: o palco dele não é um bar, e montar o salão da sede
  como tabuleiro fica pra outra rodada.
- O 7×7 e o 10×10 usam o mesmo tipo de lugar (o campinho). O recado da
  treta ainda fala "em {bairro}" (o bairro do jogo de feed), e o lugar 3D é
  uma favela da praça. A treta acontece na hora em que o dia está (não vira
  noite).
- A investida do dia de jogo no ponto "bar deles" (o planejamento antigo)
  não foi exercitada: o dia de jogo 3D de hoje só planeja a concentração e a
  pista.
- Testado só no Chromium do teste (SwiftShader).

## 21. Os pênaltis no placar de TV, a partida sem cidade e a varredura 2D × 3D (29/09/2026)

O dono: "faça uma varredura nos motores de placar, briga, e outras coisas do
jogo 2d que ainda não foram implementadas na versão 3d. quando um jogo é
necessário penaltis não tá dando pra visualizar no tempo real do jogo".

**Por que não se via.** No jogo de feed a disputa mora no cartão da partida
(main.js, `cenaDePenaltis`): o relógio para em 90', as duas fileiras de
bolas enchem uma cobrança a cada 850 ms e o apito só vem depois da última.
No 3D esse cartão fica escondido (quem mostra a partida é o placar de TV,
seção 17), e o placar não lia a disputa: ficava uns 9 s parado em "90'" e
acabava em FIM com o empate, sem dizer quem passou. E no jogo sem a cidade
do jogo (campo neutro — as finais —, fora do país, praça que não montou) não
havia placar nenhum: a partida sumia inteira da tela.

**O que mudou** (dia3d.js, jogo3d.css, main.js):
- **A disputa no placar de TV.** O relógio mostra PÊN; embaixo do placar, o
  quadro "Disputa de pênaltis": as siglas, as bolas (verde fez, vermelha
  riscada perdeu, vazia a que não bateu), o placar da série e o recado da
  última cobrança ("Fortaleza — na rede!", "Ceará — perdeu!"). No fim, FIM e
  "Fortaleza passa nos pênaltis, por 4 a 3.". O compasso continua sendo o do
  cartão escondido (`penDesde`, `penAte` e `penFim`, guardados na mensagem):
  o placar só lê. Dois avisos no canto direito, junto dos gols: "Fim do tempo
  normal: … Vai pros pênaltis." e quem passou.
- **A partida solta.** Sem o dia da cidade, o itinerário chama o
  `D3.partida` do mesmo jeito, e o placar de TV anda sozinho lendo a mensagem
  (os clubes, as cores e as siglas vêm do jogo que o itinerário abriu). Os
  gols e a disputa viram aviso como no dia. Rede de segurança: se ninguém
  apitar (o cartão escondido saiu da página), o placar mostra FIM sozinho 4 s
  depois de o jogo acabar.
- **O resultado fica na tela.** O dia fecha uns 2 s depois do apito e levava
  o placar junto; agora o placar fica até 8 s depois do apito (`FICA_MS`) e
  sai sozinho. Na volta pela estrada (o alto da tela é dela) o resultado vai
  escrito no painel: "Fim de jogo (Ceará 1 × 1 Fortaleza; Fortaleza passou
  nos pênaltis, por 4 a 3): a caravana pega a estrada de volta…".
- **As siglas que batem.** As três primeiras letras davam COR × COR em
  Corinthians × Coritiba, ATL × ATL nos Atléticos, SAO × SAO em São Paulo ×
  São Caetano; quando batem, entra a sigla do clube no dado (SCCP × CFC,
  CAM × ACG, SPFC × ADSC). Vale pro placar e pro quadro da disputa.

**Teste** (Playwright + SwiftShader): o jogo de hoje, Fortaleza × Ceará em
casa, 1 × 1 com gols aos 30' e aos 70', e a disputa 4 × 3 em dez cobranças
(casa ✓ fora ✓ casa ✓ fora ✗ casa ✗ fora ✓ casa ✓ fora ✓ casa ✓ fora ✗), com o
clima travado pra a arquibancada não abrir no meio.
- **Com a cidade (PC, 1280 × 720):** o dia no ar; os avisos dos dois gols e
  o "Vai pros pênaltis"; o placar em PÊN com a série enchendo (na 5ª
  cobrança, FOR ●●⊘ 2 e CEA ●⊘ 1, "Fortaleza — perdeu!"); no fim, FIM, as
  bolas 4 × 3 certas, "Fortaleza passa nos pênaltis, por 4 a 3." e o aviso
  de quem passou. Medido a cada 0,25 s sem foto: o dia fechou 2,0 s depois
  do FIM (antes, o placar sumia junto) e o placar seguiu na tela, lendo a
  partida solta, até 7,9 s depois do FIM, e saiu. Sem erro de página.
- **Campo neutro (PC e celular 390 × 844):** o dia 3D não abre e o placar
  anda sozinho desde a bola rolando, com as cores e as siglas; a mesma série
  e o mesmo fim; o placar ficou os 8 s depois do FIM e saiu (visto já
  escondido 8,3 s depois no PC e 8,4 s no celular, com a foto no meio); os
  dois avisos; sem erro de página. No celular o quadro cabe embaixo do
  placar; o recado final quebrava em "por 4 / a 3", e agora "por 4 a 3" não
  quebra.
- **Siglas:** SCCP × CFC, CAM × ACG, SPFC × ADSC, FOR × CEA (a função rodada
  à parte).
- A primeira rodada do teste parou aos 61': o clima tenso pausou o jogo e
  abriu a pergunta da invasão, que o teste não respondia. É o jogo certo; o
  teste passou a travar o clima.

**A varredura** está inteira em `docs/VARREDURA_2D_3D.md`: placar e
partida, motor de briga, cenas que ainda caem na foto 2D, gestão e
patrimônio, o que não vale levar pro 3D e os riscos achados. O que pesa mais,
na ordem de impacto sobre esforço: a faixa que não entra na briga da
concentração nem na invasão (o motor liga a faixa pelo nome da cena, e as
cenas 3D se chamam `caminhada@3d` e `invasao@3d`); o bar quebrado que segue
inteiro no mapa; a arquibancada que estende faixa mesmo sem a torcida ter
faixa; a tecla C, que na briga 3D troca a câmera em vez de chamar; o aviso
pago do olheiro, que pela regra do canto (seção 19) fica só em Notícias; e a
briga dos arredores do estádio, a mais comum do jogo, que ainda abre a foto
2D (feita na seção 23).

**Limites (sinceros):**
- O compasso da disputa é fixo (850 ms por cobrança, o do cartão) e não segue
  a velocidade da partida: a 4× o jogo dura uns 6 s e a disputa de dez
  cobranças uns 9 s.
- Quem apita continua sendo o cartão escondido. A partida solta tem rede de
  segurança pro placar; o dia da cidade e a linha do itinerário não têm (ver
  os riscos na varredura).
- No placar da partida solta, o toque não leva a câmera a lugar nenhum (não há
  estádio na tela).
- Sem cidade, o clima tenso abre a pergunta 2D de sempre (não mudou).
- Testado só no Chromium do teste (SwiftShader).

## 22. A faixa na concentração e na invasão, o C que chama, o bar quebrado, a faixa no estádio e o aviso do olheiro (29/09/2026)

O dono: "pode fazer a próxima rodada nessa ordem" — os cinco primeiros itens
da varredura (seção 21 e `docs/VARREDURA_2D_3D.md`), nessa ordem.

**1. A faixa na briga da concentração e na invasão** (combate.js). O motor
ligava a faixa pelo id da cena (`CENAS_FAIXA`: bar, praça, estádio, casa de
piscina), e as cenas do 3D têm o id delas — `caminhada@3d`, `invasao@3d` —:
nessas duas brigas ninguém expunha, tomava nem perdia faixa ou bandeira. Agora
`cenaDaFaixa()` olha também o `base` da cena 3D (qual cena da foto ela faz:
`praca` na concentração, `estadio` na invasão; `rua`, a pista, segue sem
faixa, como no jogo de feed). A cena 3D que não diz onde a faixa pendura (a
invasão pelo corredor, debaixo da arquibancada) fica sem faixa. O resto é o de
sempre do jogo de feed: quem é atacado expõe (meio a meio faixa ou bandeira na
concentração; na invasão, cada torcida a que ela tem), dois correm pra
recolher, e se o lado dela cai inteiro a peça é tomada — a faixa vale −10 pra
quem perde e +5 pra quem toma (a bandeira, −5/+2), e a peça muda de dono no
patrimônio.

**2. O C chama; a câmera é o V** (ponte.js, index.html, i18n). Na briga 3D o
C trocava a câmera e roubava o "chamar" (no PC não dava pra chamar pelo
teclado, e o botão da tela continuava dizendo "Chamar C"). A câmera foi pro V,
e a barra de botões da briga ganhou o botão **"Câmera V"**, que só aparece no
palco 3D (no clique também troca: perto do líder ↔ a cena inteira do alto).
A dica das teclas das páginas de bancada diz "F agarrar · C chamar · … · V
câmera" nas três línguas.

**3. O bar quebrado aparece quebrado** (financeiro.js, vida3d.js, mapa3d.js,
cenario.js). Enquanto dura o conserto (os 45 dias de metade da receita):
- **metade da varanda de tapume** — o compensado pregado, com dois sarrafos
  de través — e, pichada nele, **a sigla de quem quebrou** na cor dela;
- **os cacos na calçada**: vidro, garrafas deitadas, duas cadeiras de plástico
  tombadas e o engradado virado;
- **a roda da porta pela metade** (o bar fatura a metade);
- no **Mapa da cidade**, um X vermelho na porta e "BAR QUEBRADO · N DIAS".
O save não diz qual lote do mapa é o bar quebrado (a praça põe os bares pela
conta de quantos a torcida tem), então é o mesmo que a briga do bote pega: o
bar do dono mais perto da sede de quem quebrou. Pra isso o `danificarBar`
passou a guardar quem quebrou (`danoPor`: o bote no bar deles, o ataque deles
no nosso e o saque entre duas IAs). Bar quebrado antes desta versão não tem
`danoPor`: fica o primeiro bar da dona e o tapume sai sem pichação. Durante uma
briga no próprio bar o tapume e os cacos saem (o combate anda por ali) e
voltam no fim. O conserto acabou, o tapume some sozinho (a rua confere o save
a cada 2 s).

**4. A faixa no estádio é a do patrimônio** (arquibancada.js, dia3d.js,
dia_de_jogo.js). A arquibancada estendia faixa e bandeira sempre, tivesse a
torcida ou não — contradizia o relatório da briga. Agora:
- **quem perdeu a faixa (ou a bandeira) chega sem ela** — a nossa pelo
  patrimônio, a das IAs pela ficha viva do mundo;
- ~~a última faixa que a torcida tomou pendura de cabeça pra baixo do lado da
  dela~~ — **saiu no mesmo dia, a pedido do dono** (seção 23): a mureta mostra
  só as peças que a torcida tem;
- **a peça perdida numa briga do dia sai da mureta** (o patrimônio é conferido
  a cada 2 s);
- na **invasão pela arquibancada**, a faixa de cada lado é a do combate (a que
  se toma); a pendurada das duas torcidas da briga sai enquanto ela dura e
  volta no fim.
Sem o jogo por baixo (a planta, o dia de jogo do botão do cenário) ou com uma
torcida que o mundo do jogo não conhece, tudo estende as suas, como antes.

**5. O aviso pago do olheiro vai pro canto** (recados3d.js, jogo3d.css). Pela
regra da seção 19 o canto direito é só de jornal, e o aviso da campana ("Fala
presida, me passaram a fita de que os caras da X vão atacar…") — que é o que a
diária de Inteligência compra, R$ 100 ou R$ 400 por dia — ficava só em
Notícias › Mensagens, onde ninguém via a tempo. Ele é a exceção: aviso no
canto, com a borda dourada e "Olheiro · Inteligência", fica 10 s (o comum, 4,2)
e é o último a sair quando a pilha enche. O toque abre o cartão inteiro, como
os outros.

**Teste** (Playwright + SwiftShader, jogo.html do Pages, Fortaleza, Leões da
TUF; rival: Cearamor), numa partida nova, com o relógio parado pelo teste:
- **Bar quebrado:** o bar da Cearamor quebrado por nós e o nosso quebrado por
  ela (`danificarBar` direto no save). Os dois tapumes na cena em menos de 2 s
  (16 peças cada); o da Cearamor no mesmo bar que a briga do bote pegaria (o
  mais perto da nossa sede). Fotos: o BAR DO TOC com o tapume e "TUF" pichado
  em azul, e o BAR DO TUF com "TOC" em preto, os cacos, as cadeiras tombadas e
  o engradado. Às 13h, com a câmera perto, 1 na roda da porta de cada bar
  quebrado e 3 no bar inteiro do lado (a conta sorteia 3 a 5 e corta pela
  metade). O Mapa da cidade marcou "BAR QUEBRADO · 45 DIAS" e "· 15 DIAS".
- **Olheiro:** o aviso da campana (`avisoDoOlheiro`, alvo o nosso bar) no
  canto direito, "Olheiro · Inteligência", visível; saiu sozinho depois de uns
  10 s.
- **Concentração, o nosso ataque:** a cena `caminhada@3d` (base `praca`) com a
  bandeira da Cearamor estendida atravessada na rua, na frente do bonde dela
  (o lugar que a caminhada já marcava pro pano, `caminhada.js`); o V trocou a câmera
  (dist. 369 → 777, perto → alto); o C chamou (`chamouEm` marcou o nosso lado);
  a barra mostra "Chamar C" e o botão "Câmera V", e o clique nele trocou a
  câmera. Fim forçado com o lado dela
  todo caído: relatório "Tomamos a bandeira da Cearamor — +2 de prestígio pra
  nós · −5 pra eles"; no save, a bandeira dela saiu (1 → 0) e entrou nas
  nossas tomadas.
- **Concentração, o ataque deles:** a nossa bandeira exposta; fim forçado com
  o nosso lado caído: "perdemos a nossa bandeira pra Cearamor", e a bandeira
  saiu das nossas (1 → 0) e entrou nas tomadas dela.
- **Estádio:** sem faixa nenhuma no patrimônio e com uma faixa da Cearamor nas
  tomadas, o jogo em casa (Fortaleza × Ceará): a arquibancada planejou a
  TUF sem faixa, com a bandeira e com a tomada da Cearamor (6 m, pendurada às
  15h21); na foto, a nossa bandeira e a faixa da Cearamor de cabeça pra baixo
  na mureta (a pendurada de cabeça pra baixo saiu depois: seção 23). A
  invasão pela arquibancada: três peças na cena (a nossa bandeira,
  a faixa e a bandeira da Cearamor), as penduradas das duas torcidas escondidas
  durante a briga, e as três na tela com a câmera do alto. Fim forçado com a
  Cearamor caída: "Tomamos a faixa da Cearamor +5 · −10" e "Tomamos a bandeira
  da Cearamor +2 · −5"; no save, a Cearamor ficou com 0 faixa e 0 bandeira;
  na mureta, a faixa dela saiu (perdida) e as penduradas voltaram.
- Nenhum erro de página em nenhuma rodada.
- **O que o teste pegou no caminho:** a primeira foto do bar saiu da sala do
  presidente (a câmera não tinha voado: o teste mexia na órbita em vez de usar
  o voo da câmera) e a segunda, com a câmera baixa, deu na fachada do hospital
  do outro lado da rua; o teste passou a esperar o voo chegar e a olhar de mais
  alto. E a checagem da dica das teclas achou que, no jogo, essa dica não
  existe (ela é das páginas de bancada): no jogo 3D o V não aparecia em lugar
  nenhum — daí o botão "Câmera V" na barra.

**Limites (sinceros):**
- **Qual bar do mapa** está quebrado é uma escolha nossa, não um dado do save:
  o do dono mais perto da sede de quem quebrou. Com dois bares da mesma
  torcida quebrados por torcidas diferentes, cada um cai no mais perto de quem
  quebrou; bar quebrado antes desta versão (sem `danoPor`) cai no primeiro da
  dona e sai sem pichação.
- O tapume não bloqueia o passo: numa briga no próprio bar ele e os cacos saem
  da cena enquanto ela dura.
- A peça tomada no próprio dia sai da mureta da dona na hora (a tomada não
  pendura mais na de quem tomou: seção 23). A bandeira da mureta ainda depende
  de a torcida levar 8 ou mais; na
  briga da invasão ela aparece pela régua do combate (o patrimônio) — com 7 no
  estádio, a torcida briga com bandeira que não estava pendurada.
- ~~**A sede não mostra as faixas tomadas**~~ (troféu na parede): ficou pra
  depois (esforço médio) — feito na seção 25: o armário das tomadas no
  almoxarifado.
- Na invasão, a faixa do combate fica virada pra arquibancada (quem briga
  precisa ver e alcançar), não pro campo como as penduradas.
- O aviso do olheiro some em 10 s como os outros; quem não viu tem a mensagem
  em Notícias › Mensagens.
- Testado só no Chromium do teste (SwiftShader); no celular, só a regra de
  largura do canto, que é a mesma dos outros avisos.

## 23. A briga dos arredores em 3D e a faixa tomada fora da mureta (29/09/2026)

O dono: "pode fazer a briga dos arredores em 3D. remova a parte 'A última
faixa que a torcida tomou fica pendurada de cabeça pra baixo ao lado da
dela'."

**1. A faixa tomada saiu da mureta** (arquibancada.js). A mureta de cada
torcida estende só as peças que ela tem (a faixa e a bandeira do patrimônio);
a tomada não pendura mais de cabeça pra baixo do lado da dela. O resto da
seção 22 fica: quem perdeu chega sem a peça, a perdida no dia sai da mureta
e, na invasão pela arquibancada, as penduradas das duas torcidas saem
enquanto a briga dura.

**2. A briga dos arredores em 3D** (arredores3d.js, dia_de_jogo.js,
dia3d.js, vida3d.js). Era a briga mais comum do jogo e ainda abria na foto
2D: a investida marcada pros arredores do estádio ("Arredores" é o padrão do
planejamento). Agora ela cai no estádio de verdade, no **cordão da PM**.

- **O lugar:** o plano do dia (dia_de_jogo.js, `planejarArredores`) escolhe
  o cordão divisório — a grade e a fila de PMs de escudo na divisa entre a
  zona do mandante e a do visitante — mais perto das rotas das duas torcidas
  (a da rival pesa o dobro).
- **As duas vão até ele:** o nosso bonde desvia pelo nosso lado (a rota
  sede → cordão → portão, sem pisar na divisa nem na zona da outra) e espera
  colado na grade (3 m dela; do lado do visitante, 6 m, porque a fila de PMs
  fica desse lado); a rival também desvia pelo lado dela e para na grade (quem
  vê a outra torcida do outro lado do cordão vai provocar). A nossa chega 2
  minutos antes; a briga dura 45 s no relógio do dia. A rota da paz de cada
  uma fica desenhada fina, pra comparar.
- **Na cidade:** perto da hora a câmera vai pro cordão (do nosso lado,
  olhando o deles, de alto o bastante pra rival não ficar embaixo do balão),
  o relógio desacelera com a rival chegando e o cartão da linha cai com ela à
  vista: "A gente tá colado no cordão da PM, nos arredores do estádio. A X
  parou do outro lado da grade, na frente dos PMs — é agora." ("Ir pra cima"
  ou "Simular").
- **A cena** (arredores3d.js): o tabuleiro do combate (43 × 29 m, a escala
  das outras brigas da cidade) em volta do cordão, com o x do nosso lado pro
  deles; a máscara é a da caminhada (a rua e a calçada onde o corpo cabe, fora
  do estádio, só o chão ligado a quem briga). **As grades da PM que caem no
  tabuleiro** (o cordão e as ruas fechadas do plano) viram a grade do combate,
  em módulos de 2 m, esticadas 35 cm em cada ponta pra encostar na parede; as
  do dia saem enquanto a briga dura e o palco desenha as do combate com o
  mesmo modelo — o módulo que apanha balança e o que cai deita. **Os PMs** do
  cordão (os do dia que caem no tabuleiro, até 12, os mais perto do meio)
  viram os postos da PM do combate. Cada bonde nasce em dois grupos (a cabeça
  e o grosso, 9 m atrás na rua dele); cada lado sai pelo caminho do portão
  dele ("Seguir pro portão"). A rival não tem caminho até a gente sem passar
  pela grade, então vai nela (o combate já faz isso quando não há volta); o
  primeiro módulo no chão rompe o cordão e a tropa de choque vem, como na
  foto do 2D. O resto é o do jogo de feed: os efetivos, as bombas, a PM, o
  relatório.
- **Depois:** quem caiu e quem foi preso (a conta do combate, ou a do duelo
  simulado) fica no chão ali, dos dois lados da grade — os da frente de cada
  bonde; os outros seguem pro portão e o dia vai pro jogo.
- **Sem cordão que sirva** (nenhum com lugar e caminho pras duas, cada uma do
  seu lado) ou com um bonde que só anda no corredor que abre depois
  (`peloCorredor`), a investida fica como antes: a cidade anda até os
  arredores e a briga abre na foto.
- **A investida no jogo de outros clubes** nos arredores (o jogo da cidade no
  fundo: o nosso bonde anda da sede até um ponto da rota da rival 60 m antes
  do portão dela) também abre em 3D, com o mesmo tabuleiro em volta do ponto
  do encontro — sem cordão, porque a gente não tem lado no jogo dos outros; a
  nossa saída é a rua de onde a gente veio.

**3. O relógio da briga é o da cidade** (ponte.js, palco_briga.js). O HUD da
briga começava sempre às 18h (a noite da foto dos arredores); no palco 3D ele
começa na hora da cidade (o dia de jogo, a estrada ou o relógio da vida) e
anda no ritmo de sempre. Vale pra todas as brigas em 3D.

**Teste** (Playwright + SwiftShader, jogo.html do Pages, Fortaleza, Leões da
TUF; rival: Cearamor, a maior torcida do Ceará), numa partida nova, com o jogo
do dia montado pelo teste (Fortaleza × Ceará às 16h, a investida marcada pros
arredores contra a Cearamor):
- **O plano:** o cordão escolhido fica a 3 m de onde a TUF espera e a 7 m de
  onde a Cearamor para; a TUF sai da sede às 14h57, chega na grade às 15h02,
  a Cearamor chega às 15h04 e a briga vai até 15h05. **Antes do desvio da
  rival**, a primeira versão só levava o nosso bonde: a rota da Cearamor
  passava a 39 m do cordão, ela nunca chegava perto da grade e o palco não
  achava onde pôr o bonde dela — daí as duas desviarem.
- **O cartão e a câmera:** o cartão "Investida marcada · Cearamor" com "Ir pra
  cima" e "Simular"; na foto, a grade atravessando a rua, a fila de PMs do
  lado do visitante, a TUF colada do nosso lado e a Cearamor parada do outro.
  Na primeira versão o balão tampava a rival; a câmera subiu (58 m, 57°) e
  ela ficou inteira abaixo dele.
- **A briga jogada:** a cena `arredores@3d` (base `arredores`) com 10 módulos
  de grade, 10 PMs, 71 da TUF e 45 da Cearamor, 9 módulos da grade do dia
  escondidos no tabuleiro e nenhum portão selado. Em poucos segundos a
  Cearamor foi pra grade (a vida do módulo mais batido caiu a 26%); numa das
  rodadas ela derrubou um módulo e o HUD marcou "TROPA CHEGA EM 5.1S" — o
  cordão rompido do 2D. O V troca a câmera ("o cordão inteiro, do alto"); o
  relógio da briga marcou 15:07, a hora da cidade. Fim forçado pelo teste: o
  relatório fechou, o resultado entrou no dia, a cena saiu e o dia seguiu até
  a partida, com a TUF no lugar.
- **A briga simulada:** "VITÓRIA NOS ARREDORES"; o duelo derrubou 7 da TUF (e
  3 presos) e 12 da Cearamor (e 3 presos); o painel do dia foi de 70 × 45 pra
  60 × 30, e depois da hora da briga os 10 da TUF e os 15 da Cearamor estavam
  no chão a menos de 25 m do meio do cordão, dos dois lados da grade.
- **O lado visitante:** o mesmo jogo com a TUF fora (Ceará × Fortaleza, no
  estádio do Ceará, na mesma praça): a TUF espera a 7 m do cordão, atrás da
  fila de PMs, e a Cearamor (mandante, 150 — o efetivo que o jogo de feed dá
  pra torcida da casa) chega a 3 m; a cena abriu com 12 PMs e a grade de 10
  módulos, a grade apanhou e o dia seguiu até a partida.
- **A investida no jogo dos outros:** só o tabuleiro (o mesmo construtor, com
  o plano do dia no ar e o caminho da nossa sede até 60 m antes do portão da
  rival): monta sem cordão, com 7 PMs, e a nossa saída ("A RUA DE FUGA") a
  15 m do nosso bonde.
- **A faixa tomada fora da mureta:** a parte do estádio do teste da rodada
  anterior, refeita (sem faixa própria e com uma faixa da Cearamor nas nossas
  tomadas): a arquibancada planejou a TUF sem faixa, com a bandeira e **sem a
  tomada pendurada** (o estado da arquibancada nem tem mais esse campo); na
  foto, a bandeira e os bandeirões da TUF e nada de cabeça pra baixo. A
  invasão pela arquibancada seguiu igual (as três peças na cena, as
  penduradas das duas escondidas durante a briga e de volta no fim, a faixa
  tomada da Cearamor saindo da mureta dela).
- Nenhum erro de página em nenhuma rodada.
- **O que o teste não cobre:** o jogo do teste é inventado, fora da agenda da
  temporada, e o jogo de feed procura a rival na rua da agenda (`naRuaEm`) —
  com ele, "o bonde deles não apareceu". O teste faz `resolverIda` devolver o
  encontro que ele devolveria num jogo de verdade (o 'planejada' dos
  arredores); o resto do caminho é o do jogo. A investida no jogo de outros
  clubes não foi jogada inteira (só o tabuleiro), e o fim da briga jogada foi
  forçado (ninguém cai de verdade nesse fim; quem cai foi conferido no
  simulado).

**Limites (sinceros):**
- **As duas torcidas desviam da rota da paz até o cordão.** É o que faz a
  briga acontecer ali, mas o plano da PM do dia (as travessias, a conta de
  encontros na cidade) foi feito com as rotas da paz: a rota nova pode cruzar
  outra torcida na cidade sem a PM ter fechado a rua.
- **A rival para na grade 45 s no relógio do dia**; a briga no palco dura o
  que durar, com o dia parado.
- **Sem cordão que sirva, a briga volta pra foto do 2D** (o cordão tem de ter
  lugar e caminho pras duas, cada uma do seu lado; o bonde que só anda no
  corredor que abre depois não entra).
- **Na investida no jogo dos outros, o tabuleiro não tem grade:** a grade do
  dia que cai nele sai enquanto a briga dura (sem lado nosso no jogo, a gente
  não sabe de que lado da grade chegaria).
- O desenho da briga simulada na cidade é só quem cai e quem é preso, nos dois
  lados da grade; ninguém se atraca por cima dela.
- A grade do combate é a do segmento do cordão (a reta que o plano ajusta às
  células da divisa); onde a divisa faz curva, pode sobrar vão numa ponta.
- Testado só no Chromium do teste (SwiftShader), na tela deitada.

## 24. As faixas de verdade das torcidas (29/09/2026)

**O pedido** (o dono, com três .rar de faixas, `clubs_parte1..3`): "atualize
as faixas das torcidas pra ser conforme essas, vai ter uns times faltando,
esses que faltam vão ser genéricos ainda."

**O que veio nos .rar:** 420 PNG em 86 pastas, uma por clube
(`clubs/corinthians/gaviões 3.png`, `clubs/avai/5.png`). Quase todas com
1024 × 128 px (8:1); 25 menores (≈ 510 × 62) e umas com a arte mais estreita
que a tela (margem transparente dos lados). O nome do arquivo é a torcida e o
número; o arquivo que é só o número é da torcida do clube.

**O que foi feito:**
- **`ferramentas/importar_faixas.py`**: a tabela `MAPA` (pasta do dono → id
  da torcida; os nomes com erro de digitação, como "ceararmor", entram na
  mesma torcida) e, pra cada torcida, uma **tira** `img/faixas/<id>.webp`
  com as faixas dela empilhadas (128 px de altura cada, na largura da arte:
  a margem transparente sai, o que sobra de transparente vira a cor média do
  pano, e nada é esticado), mais o manifesto **`dados/faixas.js`**
  (`TO.dados.faixasReais[id]` = a largura de cada faixa, na ordem). A ordem é
  a do número do arquivo: a faixa 1 é a que a torcida tem desde o começo.
  **95 torcidas** ganharam faixa de verdade (**352 faixas, 6,5 MB**); **44**
  seguem com a gerada (cor e nome). **16 pastas** são de clubes sem torcida
  no jogo e ficaram de fora (Aimoré, Boa, Brusque, Concórdia, Esportivo,
  Jacuipense, Juventus-SC, Luverdense, Macaé, Novo Hamburgo, Oeste, São
  Luiz, São Bento, Tubarão, Tupi e União Frederiquense) — quando a torcida
  entrar em `dados/torcidas.js`, é pôr a linha no `MAPA` e rodar de novo com
  a pasta do .rar (`pip install libarchive-c` abre o RAR5).
- **`js/gestao/patrimonio.js`**: a faixa k da torcida é a arte k dela (dando
  a volta quando ela tem mais faixa que arte); a tela sai na **proporção da
  arte** (com a mesma margem do pano ondulado da gerada), a gerada vai na
  tela enquanto a tira não chega — e fica, se a tira não carregar. Quem pediu
  a URL (o Patrimônio, a Loja) é avisado a cada imagem que chega até a última
  (antes, o aviso do primeiro escudo esvaziava a fila e o segundo não
  chegava). Novas: `faixaReal(o, k)` e `proporcaoDaFaixa(o, k)`.
- **A cena de briga** (`combate.js`): a faixa na parede tem a altura da
  proporção da arte (a gerada seguia com 1/6 do comprimento); a peça guarda
  **qual faixa era** (`variante`), e a tomada leva isso pro patrimônio de
  quem tomou (`acoes.js`) — o Patrimônio mostra a arte certa da tomada.
  **A briga 3D** (`palco_briga.js`) sobe a textura de novo quando a tela
  muda (a arte chegando depois).
- **O estádio 3D** (`arquibancada.js`): a faixa estendida na mureta é uma
  das que a torcida tem (sorteada pela semente do dia), na proporção da arte:
  a altura sai da largura (11 m de faixa → 1,37 m de pano); se a mureta não
  deixa, a largura encolhe.
- **A tela do Patrimônio e da Loja** (`css/paineis.css`): a faixa tem a
  altura fixa (56 px) e a largura da arte (antes, 180 × 56 pra todas).
- **Os pacotes:** o jogo (`index.html` da raiz) e a planta carregam
  `dados/faixas.js`; o `montar.sh` copia as tiras pra `img/faixas/` (o Pages
  e o artefato pedem a tira na hora que a faixa aparece).

**Testado** (Chromium do teste, jogo 3D do Pages, Fortaleza, TUF):
- o manifesto: 95 torcidas, 352 faixas; a TUF com 6 (1024 px cada); a faixa
  7 da TUF volta pra arte 2; a Aliança sem arte (gerada);
- **Patrimônio:** as 3 faixas da TUF com a arte (tela 1024 × 159), as
  tomadas da Cearamor e da MOFI com a arte delas, a da Aliança gerada
  (400 × 124); a Loja mostra a próxima da TUF (a 4ª arte);
- **briga 3D na concentração da Cearamor:** a faixa dela na parede com a
  arte (tela 1021 × 159, pano 4,2 × 0,65 m); tomada no fim, o patrimônio
  guardou a variante;
- **estádio (Fortaleza × Ceará):** a faixa da TUF na mureta com a arte
  (textura 1024 × 128, pano 11 × 1,37 m);
- as tiras pedidas foram só as das torcidas da cena (TUF, Cearamor, MOFI);
  nenhum erro de página.

**Limites (sinceros):**
- **O pacote de arquivo único do jogo 2D** (`empacotar_jogo.py`) não embute
  as tiras: ele está em 13,3 MB de um teto de 16,5, e as faixas são 6,5 MB.
  Nele, a faixa segue a gerada (sem erro: a tira não chega e a gerada fica).
- **A faixa perdida sai do fim da lista** (como antes): se a torcida tem
  três e perde a do meio na briga, a arte que some do Patrimônio é a última.
- 25 faixas vieram menores (≈ 510 × 62) e ficam mais borradas de perto.
- **As bandeiras** seguem as geradas (escudo no meio): o pedido foi das faixas.

## 25. Os armários do almoxarifado: as tomadas e o patrimônio (29/09/2026)

**O pedido** (o dono): "as faixas tomadas vão estar armazenadas dentro do
armário do almoxarifado, e em outro armário o patrimonio próprio. esse
detalhe vai fazer parte de uma mecanica de invasão de sede que vai acontecer
de maneira rara no jogo futuramente."

**O que foi feito:**
- **Os dois armários** (`js/diajogo/sede3d.js`, `armarioDeTela`): armário de
  aço de duas portas de **tela** (dá pra ver o que está dentro), com o
  montante do meio, três prateleiras (quatro nichos de cada lado, o fundo e
  as prateleiras claros por dentro), a testeira com a **placa** (nas cores
  das placas das salas) e, no das tomadas, o **cadeado**.
  - **Sede grande (nível 2+), ALMOXARIFADO:** no lugar das duas estantes do
    fundo, um de cada lado da janela — à esquerda o **PATRIMÔNIO**, à direita
    as **TOMADAS**. A estante da parede da direita fica (encurtada 2 cm pra
    não encostar).
  - **Barracão (nível 1), PATRIMÔNIO:** o armário comprido da planta virou
    os dois, **no mesmo retângulo** (é o móvel que barra a caminhada da
    planta: `conferir_sede.mjs` segue batendo), com os troféus em cima.
  - Um lugar de gente na frente de cada um (`estante`/`armario`, gesto
    `arruma`): os membros da sede vão lá mexer.
- **O que está guardado** (`guardarNoArmario`): cada peça dobrada em pilha no
  nicho — a faixa (da largura do nicho até 62 cm, 6 cm de altura) na cor 1
  da dona com a dobra na cor 2; a bandeira mais estreita e mais fina. As
  pilhas enchem pela altura do peito primeiro. O PATRIMÔNIO tem as faixas e
  as bandeiras da torcida; as TOMADAS, as dos outros, **cada uma na cor de
  quem era dona**. Sem o jogo (o cenário sozinho), o de começo de todo mundo:
  uma faixa e uma bandeira, nenhuma tomada.
- **Segue o save, na hora** (`vida3d.js`, `conferirGuardados`; `jogo3d.js`;
  `index.html`, `guardadosDoJogo`): o do jogador (`faixasDe`/`bandeirasDe`:
  as nossas e as tomadas) e o mundo vivo da IA (`faixasIA`: quantas ela tem e
  as que tomou). Antes de a praça montar vai o de todas as torcidas; com a
  praça montada, a cada 2 s de rua, as da praça. O que está guardado é **uma
  malha só, viva**, por sede (o forno do cenário não junta ela com a cidade):
  mudou o save, troca só a geometria dela — **a cidade não remonta**.

**A base da invasão de sede** (o que já existe pra mecânica que vem depois;
a invasão em si **não** foi feita):
- `montarSede(...).armarios` e `api.planta.torcidas()[i].sede3d.armarios`:
  cada armário com o **tipo** (`patrimonio`/`tomadas`), o cômodo, a caixa no
  mundo, a altura, pra onde a frente olha (`frente`, `rumo`), a **boca** (o
  ponto no chão, 0,7 m na frente, onde quem abre fica), **quantas peças
  cabem** (`cabe`), quantas estão lá (`guardadas`) e **o que tem dentro**
  (`pecas`: faixa ou bandeira e, nas tomadas, o id da dona).
- `api.guardadosDoJogo(id, g)`: quem mudar o patrimônio no fim da invasão
  (a rival levando as dela de volta, ou as nossas) só chama isto — o armário
  troca na hora.
- Os lugares `estante`/`armario` (com o campo `armario`) dizem onde um boneco
  fica pra "arrombar" cada um.
- Uma sugestão pra regra, quando for feita (decisão sua): a invasão rara leva
  primeiro, do armário das tomadas, as peças da própria torcida invasora
  (recupera o que perdeu) e, se sobrar gente e tempo, do patrimônio da dona
  da sede; o cadeado custa uns segundos de quem está na boca.

**Testado** (Chromium do teste, jogo 3D do Pages, Fortaleza, TUF — sede de
nível 3):
- a sede da TUF abre com os dois armários (cabem 56 peças em cada, nesta
  sede) e o de começo (1 faixa e 1 bandeira no PATRIMÔNIO);
- com o save da TUF em 4 faixas, 2 bandeiras e as tomadas (3 faixas: da
  Cearamor, da MOFI e da Aliança; 1 bandeira da Cearamor), a conferência
  trocou 1 torcida: **PATRIMÔNIO 6 peças, TOMADAS 4, cada tomada com a dona
  certa**; a malha viva passou de 40 pra 200 triângulos sem remontar a
  cidade; conferir de novo sem mudança não troca nada;
- **a sede da rival** (Cearamor, nível 3) com uma faixa da TUF nas tomadas
  dela: a ficha mostra `f:leoes_da_tuf` no armário das tomadas;
- **a briga de verdade:** ataque na concentração da Cearamor, a faixa dela
  tomada no fim; depois do relatório, a vida da praça conferiu e o armário
  das tomadas foi de **4 pra 5** (duas da Cearamor);
- `conferir_sede.mjs`: o modelo bate com a planta (o móvel que barra no
  lugar); `conferir_passagem.mjs`: **todo cômodo se alcança do portão** em
  todas as sedes dos três mapas e das praças (o almoxarifado com 89–90% do
  chão alcançável; o patrimônio do barracão, 97%);
- nenhum erro de página.

**Limites (sinceros):**
- **Através da tela as peças aparecem como pilhas coloridas** (a cor da
  dona), não com a arte da faixa (a arte de verdade da seção 24 aparece no
  Patrimônio, na briga e no estádio; dentro do armário, não).
- **A capacidade é de 56 peças por armário** nesta sede grande (112 na maior;
  56 no barracão); o que passar disso não aparece (a ficha diz `guardadas` e
  o total em `pecas`).
- **A sede da IA de outra praça** só pega o save quando a praça dela monta.
- **O telhado das sedes das outras torcidas fica** (a câmera de cima não vê o
  almoxarifado delas); a da torcida do jogador, com o corte da câmera, vê.
- A tela é a rede da folha das grades (9 cm de malha): mais aberta que um
  armário de verdade, pra dar pra ver dentro de longe.
- Testado só no Chromium do teste (SwiftShader), na tela deitada.

## 26. A sede em cinco níveis, o 5 em dois andares e a academia (30/09/2026)

**O pedido** (o dono): "Crie agora os 5 níveis de sede: Nível 1: do jeito que
está / Nível 2: pátio, presidência, patrimônio, sala de treino improvisada no
pátio, marketing / Nível 3: pátio, presidência, hospedagem, patrimônio, sala
de treino ocupando mais espaço no pátio, bar com porta pra ele direto da rua,
marketing / Nível 4: pátio, presidência com mais detalhes dentro, hospedagem
maior, patrimônio, bar com porta pra rua, garagem (cabendo um ônibus e se a
torcida tiver ônibus), marketing / Nível 5: pátio, presidência, hospedagem
grande, patrimônio, bar com porta pra rua, garagem cabendo até 3 ônibus,
setor criativo (onde pode ser criado material, faixas, etc), marketing
[...] O pátio sempre vai ser a maior área da sede, os compartimentos ficam ao
redor dele. [...] Descarte o atual modelo de sede nível 3." Depois: "Se
fizer a sede nível 5 com dois andares não fica melhor? Eu esqueci de
mencionar a área de treino virando uma academia de treino dentro da sede nos
níveis 4 e 5." e "Quando falo dois andares é um térreo e um andar."

**Os cinco modelos** (`js/diajogo/sede3d.js`; m², no terreno do catálogo):

| Nível | Terreno | O que tem |
|---|---|---|
| 1 · o barracão | 12,9 × 9,3 m (o canto do terreno) | pátio 58, presidência 18, patrimônio 17 — o de antes, sem mudança |
| 2 | 16,2 × 12,8 m (a fatia de 16,2 m) | pátio 110 com o treino improvisado (saco pendurado, colchonete), presidência 26, patrimônio 17, marketing 15 |
| 3 | 22,1 × 12,8 m (o terreno inteiro) | pátio 141 com o treino maior, presidência 23, hospedagem 25 (2 beliches), bar 16 com a porta de enrolar pra rua, patrimônio 14, marketing 12 |
| 4 | 22,1 × 12,8 m | pátio 62, **academia 27** no fundo do pátio, garagem 42 (1 ônibus), hospedagem 27 (3 beliches), presidência 25 (mais cheia), bar 17, patrimônio 12, marketing 11 |
| 5 · dois andares | 30,6 × 12,8 m (**o quarteirão inteiro**) | térreo: pátio 150 (descoberto no meio), garagem 116 (3 baias de 3,3 m), presidência 25, bar 24, patrimônio 16 · 1º andar: **academia 61** (ringue, sacos, supino, rack, esteiras), hospedagem 50 (6 beliches), setor criativo 48, marketing 19 e a varanda em U (51) |

- **O pátio** é a maior área em todos (no 4, 62 m² contra os 42 da garagem).
  Os cômodos ficam em volta dele, cada um com a porta pro pátio; o bar só
  tem a porta de enrolar pra rua e a garagem só os portões de grade.
- **O bar** (3 a 5): o balcão com a portinhola, a geladeira, o barman, as
  banquetas, a TV, o freezer; a **mesa do pagode** fica montada no canto e
  os instrumentos e o microfone são uma peça viva que só aparece na festa.
- **A garagem** (4 e 5): o ônibus do kit de detalhe (o da caravana), branco
  com as faixas nas cores da torcida e a sigla no letreiro, de ré, com os
  retrovisores dobrados; só aparecem os que a torcida tem.
- **O marketing:** a mesa com dois monitores, o rapaz sentado no computador
  e os quadros com a camisa da torcida em volta (a de jogo, a listrada, a
  retrô).
- **O setor criativo** (5): a mesa grande com a faixa sendo pintada, a
  costura, os rolos de pano, as latas de tinta, o cavalete.
- **A academia** (4 e 5): no 4, os sacos na viga, o supino, o rack de
  halteres, o espelho e o tatame, no fundo do pátio; no 5, o ringue com as
  cordas nas três cores da torcida, os três sacos, o espelho com o rack, o
  supino e as esteiras.
- **O nível 5 em dois andares:** a laje dos dois blocos (em cima da garagem
  e da coluna do bar), a varanda em U em volta do pátio com o guarda-corpo
  (mureta, grade e corrimão), os pilares na cor 3, e **a escada de concreto**
  encostada no muro do fundo do pátio, do pátio pra varanda: 28 degraus de
  17 cm (a subida é de piso a piso, 4,70 m). O letreiro vai pra fachada de
  cima, e o mastro passa dela.
- **Na frente espelhada** (sul e oeste), o triângulo troca dois cantos: o
  piso segue virado pra cima (é por ele que o passo acha o chão).

**Na planta** (`ferramentas/planta_html/index.html`): o 2 mora numa fatia de
16,2 m do terreno, o 3 e o 4 no terreno inteiro e o 5 no **quarteirão
inteiro** (as casas do resto somem); sem quarteirão largo o bastante, a
torcida de nível 5 fica com o modelo do 4. O catálogo tem os cinco, com
**"Festa na sede: o pagode no bar"**, o número de ônibus e, no 5, **"Só o
térreo" / "O 1º andar" / "Os dois andares"** (a sede cortada na altura da
cabeça de quem está naquele andar).

**No cenário a pé** (`cenario.js`, `subsolo.js`): a sede de dois andares vai
inteira pra um subsolo de andares só dela (o degrau de 30 cm e a faixa do
corpo da rua, a do metrô): o boneco **sobe a escada, anda na varanda e entra
nas salas de cima**. Cada porta viva sabe o piso dela (`y0`): a de cima não
barra quem está embaixo, e o F abre a do andar do pé. O corte da câmera segue
o pé (em cima, some o que passa da cabeça lá em cima).

**No jogo 3D** (`vida3d.js`, `jogo3d.js`, `bonecos3.js`):
- **Quem vai pro 1º andar sobe a escada:** o caminho na grade do térreo até
  o pé dela, a escada em linha reta (cada degrau achado pelo chão a um degrau
  do pé) e a grade de cima (o 1º andar, com chão debaixo) até o lugar. O
  passo de cada quadro anda em pedaços de até 12 cm: com o navegador lento
  (2 quadros por segundo no teste), um quadro inteiro pulava dois degraus e
  o boneco caía pro chão do térreo no meio da escada. Lá em cima, ninguém
  cai pro térreo: quem desce do ringue (45 cm, mais que um degrau) acha o
  chão meio metro abaixo.
- **O botão "Ver o 1º andar" / "Ver o térreo"** (canto de baixo, só na sede
  de dois andares): o térreo é cortado na altura da cabeça, e quem está lá em
  cima não aparece; no 1º andar, o corte sobe, e o térreo aparece pelo vão
  do pátio. A sala do presidente (os recados) volta sempre pro térreo.
- **O pagode no turno de festa:** com o expediente em "Festa na sede", os
  instrumentos aparecem na mesa do bar e os músicos sentam (cavaquinho,
  tantã, pandeiro) com quem canta de pé; acabou a festa, eles saem.
- **Os ônibus da garagem são os do save** (`TO.financeiro.onibusDe`).
- **Os gestos novos:** o saco de pancada (a guarda e o jab/direto), a rosca
  com halter, a guarda no ringue (em cima do tablado), o pincel na faixa, a
  costura, o cavaquinho, o pandeiro e o tantã.
- **O armário do patrimônio:** o clique num dos armários da sede do jogador
  abre a lista do save — no do patrimônio, as faixas, as bandeiras e as
  bombas do estoque; no das tomadas, cada faixa e bandeira tomada, de quem
  era e quando.
- Os pesos dos turnos: o treino da academia é todo dia (o padrinho enche),
  a campanha do PIX leva gente pro marketing, e o computador do marketing
  quase sempre tem alguém.
- **As ilhas da grade do caminho:** o chão livre fica separado em ilhas (o
  miolo do ringue, cercado pelo tablado; o canto atrás da mesa do pagode).
  Quem vai pra um lugar numa ilha anda até o chão mais perto dele e entra
  de lá; quem levanta de uma ilha sai pro chão mais perto. Antes, quem não
  achava caminho aparecia direto no lugar.

**Os testes:**
- `conferir_passagem.mjs` monta os cinco níveis em todas as sedes dos três
  mapas e das praças; no 5, **sobe a escada com o passo do cenário** e confere
  cada sala e varanda de cima. Resultado: **todo cômodo se alcança do portão**
  (o bar pela porta dele, da rua).
- `conferir_sede.mjs` (o barracão, nível 1): o modelo bate com a planta.
- **No cenário a pé** (Chromium do teste, São Paulo, a Gaviões no nível 5):
  o boneco sai do pé da escada, sobe os 28 degraus (0,09 → 4,79 m), anda na
  varanda, abre a porta da academia (o F acha a porta de cima), entra, sai e
  desce de volta pro pátio; as 4 portas de cima ficam com o piso em 4,70 m.
- **No jogo 3D** (o jogo novo, Fortaleza, a Aliança posta no nível 5, com 3
  ônibus e o expediente de festa): a sede de dois andares monta, o pagode
  aparece na mesa do bar com os 4 lugares dele ocupados, os 3 ônibus
  aparecem, o botão troca "Ver o 1º andar" / "Ver o térreo" (e o corte), e o
  armário do patrimônio abre a lista (1 faixa, 1 bandeira, 4 bombas); o das
  tomadas também é achado pelo clique. **Andando:** quem estava no pátio
  subiu os 28 degraus (0,09 → 4,79 m) e foi pro treino da academia; quem
  estava no canto do pagode subiu a escada (passou por 1,94 m) e **subiu no
  ringue pela beira** (5,24 m) e, depois, desceu do tablado e da escada até
  o pátio (5,24 → 4,79 → 0,09 m); quem estava em cima desceu (4,79 → 0,09
  m) e foi pro balcão do bar pela rua. **Os 66 lugares da sede se alcançam
  nos dois sentidos** (da porta até cada um e de cada um até o pátio). E
  um boneco a 3 m/s (dois degraus por quadro) subiu a escada inteira sem
  cair.
- Nenhum erro de página.

**Limites (sinceros):**
- **O nível 5 precisa do quarteirão inteiro** e largo (uns 30 m de frente).
  Onde a torcida de nível 5 não tem um, a sede dela fica com o modelo do 4.
- **O pátio do 4 é menor que o do 3** (62 contra 141 m²): os dois usam o
  mesmo terreno, e no 4 entram a garagem e a academia. Continua sendo a
  maior área da sede, mas o 4 fica mais apertado que o 3 — pra mudar isso,
  o 4 teria de ganhar um terreno maior no mapa.
- **O ônibus tem 10,7 m** (o de verdade tem 12 a 14): foi o que coube na
  baia sem a garagem comer o pátio.
- **A regra do jogo e o 3D não batem nos ônibus:** o jogo deixa ter 1
  ônibus no nível 2 e 2 no 3 e no 4 (`TETO_SEDE`), mas só o 4 (uma vaga) e o
  5 (três) têm garagem. O ônibus que não cabe na garagem existe no save e
  não aparece. Não mexi na regra (é sua).
- **O nível 6 do jogo (o Complexo) usa o modelo do 5.**
- **No jogo, com o térreo na tela, quem está lá em cima não aparece** (a
  sede está cortada na altura da cabeça); com o 1º andar, o térreo debaixo
  dos blocos fica coberto — só o pátio aparece pelo vão.
- **Quem sobe a escada no jogo anda no meio dela, em linha reta:** dois que
  se cruzam na escada se atravessam (a vida não tem colisão entre bonecos).
- **O canto atrás da mesa do pagode (no 5) e o miolo do ringue** não se
  alcançam andando no cenário (a conta do passo dá o bar com 90–91% e a
  academia com 89–90%); no jogo, o boneco entra neles pela beira e passa
  pela cadeira ou pela corda por um instante.
- **O armário abre o pop-up só no jogo 3D e só na sede do jogador** (no
  cenário da planta, o clique mostra a ficha, como antes). O clique acerta a
  caixa do armário: não tem parede no caminho do raio.
- **As outras torcidas** usam o mesmo modelo do nível delas, mas só a sede
  do jogador tem vida por dentro.
- Testado só no Chromium do teste (SwiftShader), na tela deitada.

## 27. A noite acesa: os postes, os refletores, as janelas e os cômodos (30/09/2026)

**O pedido** (o dono): "preciso que a noite tenha as luzes dos postes,
refletores de estádios e janelas das casas não entráveis acesos, assim como
os ambientes entráveis tenham luz interior também".

**Sem luz do three.js.** Cada luz de verdade (PointLight, SpotLight) entra
em todos os materiais e recompila os shaders, e o dono joga sem placa de
vídeo. A noite é feita em **dois mapas do mundo inteiro**, lidos no shader de
cada material (`comNoite` em `cenario.js`), e só quando `uNoite > 0`:

- **O mapa da luz** (1 pixel por metro, RGBA): no RGB, a poça quente de cada
  poste da calçada (`luzesDaRua()` da planta: a lâmpada na ponta do braço, a
  7 m) — forte no chão, meia força a uns 5 m, some aos 16 m; na parede ela
  entra fraca e some acima de uns 9 m. No A, o refletor dos estádios: o
  terreno inteiro de cada estádio e 14 m em volta, de cima.
- **O mapa do teto** (a grade do passo, 0,5 m): a altura do teto mais baixo
  de cada célula coberta, em decímetros. **Dentro** é o que está coberto e
  abaixo do teto, olhando 80 cm pra onde a face olha: o chão e as paredes de
  dentro dos cômodos acendem (luz de lâmpada, amarelada); a parede de fora
  olha pra rua, que não tem teto, e fica no escuro. Vale pra tudo que é
  entrável: a sede, os bares, os corredores dos estádios, o metrô.
- **As janelas das casas não entráveis:** o vidro das células de janela das
  folhas de textura (pelo nome da célula no `ATLAS`) acende com o vidro
  escuro e azulado; uma sorte por janela (o atributo `aSorte`) diz qual
  acende: **metade até as 22h**, 30% à meia-noite, 12% de madrugada.
- **As lâmpadas que brilham sozinhas:** os painéis dos refletores (a folha
  dos estádios), a luminária da calçada e a luz do metrô ganham brilho
  próprio à noite (o balde `|lum` do forno).
- **Os bonecos** também recebem as duas luzes (o remendo do material em
  `bonecos3.js`): quem passa debaixo do poste fica iluminado.

**O estádio de 40 mil ganhou refletor:** a foto não mostra torre nem
refletor, e à noite ele ficava aceso sem ter de onde vir a luz. Agora são
**quatro mastros de 11,5 m em cima da mureta das curvas**, com o painel
virado pro campo (`mastroDeLuz` em `estadios3d.js`). O de 10 (postes de
concreto) e o de 20 (torres de treliça) já tinham.

**A hora:** a luz entra com o céu — começa às 17h20, fica inteira das 18h40
às 5h e apaga até as 6h20 (os tons da noite ficaram mais escuros que os de
antes). No cenário da planta, o seletor **Hora** (Dia, 6 h, 17 h 30, 18 h
30, 20 h, 22 h, 1 h) mostra cada uma; no jogo 3D, é o relógio da vida.

**O custo:** montar os dois mapas leva uns 0,1 s (281 postes e 4 estádios em
São Paulo, mapa grande); as chamadas de desenho não mudam (as janelas e as
lâmpadas continuam nos mesmos baldes do forno).

**Limites (sinceros):**
- **Não tem sombra:** a luz do poste atravessa a marquise, a árvore e o
  carro; a do refletor cobre o terreno inteiro do estádio como um tapete.
- **O dentro é pelo teto:** o que tem teto é aceso por dentro, com ou sem
  lâmpada (a garagem, o depósito, debaixo da marquise). O pátio descoberto
  da sede fica só com o poste da rua.
- **A janela acesa é sorteada por janela, não por casa:** numa casa, uma
  janela acesa e a do lado apagada.
- Testado no Chromium do teste (SwiftShader): as fotos de cima, da rua, do
  bairro, da sede por dentro e dos quatro estádios de São Paulo às 21h, sem
  erro de shader.

## 28. O assalto jogado: o plano, o calendário e a loja em 3D (30/09/2026)

**O pedido** (o dono): "preciso criar uma mecânica de assaltos pra parar de
funcionar de forma sorteada, apesar de cada uma das opções realmente
apresentar mais riscos, mas pro assalto ser executado pelo jogador com todos
os ambientes sendo entráveis com a mecânica de assalto com o objetivo de ser
rápido ou furtivo pra não chamar a atenção da polícia, inspirado na forma
que se assalta no GTA V" — com o roteiro que ele trouxe: planejamento →
execução → exposição → suspeita → alerta → resultado; as barras de Exposição
e Suspeita e a Situação (Normal, Suspeita, Alerta) na tela; o alvo descrito
pelas características (exposição, segurança, movimentação, atenção,
dificuldade, recompensa potencial); equipe maior leva mais e aparece mais; o
dado em segundo plano; a reunião mensal num dia aleatório; a operação no
calendário.

### O caminho no jogo

1. **A reunião da diretoria** é mensal num **dia sorteado do mês** (do 2 ao
   27, pelo hash do mês e da torcida: `diaDaReuniao` em `feed.js`); caindo
   num jogo nosso ou numa viagem, senta no primeiro dia comum depois. O
   calendário marca o dia ("Reunião"). As listas que iam "até a véspera da
   próxima mesa" (as festas das aliadas, os nossos aniversários) vão até a
   véspera da próxima de verdade.
2. **A pauta "Alvos de assalto"** (nove meses em doze, como antes) tem o
   botão **Planejar o assalto**, que abre a tela do plano:
   - **o alvo**, cada um com seis barras: Exposição, Segurança, Movimentação
     (fluxo), Atenção, Dificuldade e Recompensa potencial;
   - **a equipe**: os dois tamanhos da tabela do dono (2/5, 5/10 ou 10/20) —
     quantos entram com o líder e quantos ficam na rua e no carro, e o
     potencial de cada tamanho;
   - **a abordagem**: *Furtivo* (entra como cliente, pega sem ninguém ver:
     pouca exposição e butim menor; se alguém percebe, vira correria) ou
     *Rápido* (anuncia, rende todo mundo e leva o máximo: o alarme toca e a
     polícia vem);
   - **o horário**: *Abertura* (9h10: pouca gente, caixa vazio, ×0,75 no
     potencial), *Tarde* (15h30: loja cheia) ou *Fechamento* (19h35: o caixa
     do dia, ×1,1, rua escura e polícia mais longe — mas quem trabalha olha
     a porta, +15 de atenção);
   - **o dia**: os livres das próximas duas semanas (sem jogo, sem viagem,
     sem outra operação);
   - embaixo, o **risco estimado** (Baixo, Médio, Alto), a chance de alguém
     perceber (no furtivo), a da polícia chegar a tempo deixando a equipe
     fazer, e a **atenção da polícia sobre a torcida**.
3. **O calendário** mostra a operação no dia ("Assalto marcado · alvo ·
   hora"; depois, "Assalto feito · butim").
4. **No dia**, na hora marcada, cai o cartão **OPERAÇÃO EM ANDAMENTO**, com a
   ficha do roteiro — Alvo, Equipe, Recompensa potencial, Exposição e
   Suspeita (zeradas até a ordem; no fim, as da operação) e Estado ("Na
   esquina, esperando a ordem", depois Feita, Deu ruim, Abortada ou
   Cancelada) — e os botões:
   - **Comandar a equipe** (só no jogo 3D): a loja abre em 3D e o jogador
     leva o líder;
   - **Deixar a equipe fazer**: a conta (`simularAssalto`), sem cena;
   - **Cancelar a operação**.
   Faltando gente no dia, a operação cai sozinha (um recado da diretoria);
   jogo ou viagem no dia empurram pro próximo dia livre, como o bote.

### A loja em 3D (`assalto3d.js` + o motor `assalto.js`)

**As seis lojas entráveis** (`js/diajogo/lojas3d.js`): banco (14,2 m de
frente), joalheria (8,6 m), supermercado (16,4 m), posto de gasolina (com a
cobertura das bombas), mercadinho e loja de roupas — com balcão, caixa,
vitrines, gôndolas, geladeiras, cofre, sala da gerência, depósito, a porta
dos fundos e a porta de lado. A planta (`proposta.js`) põe as seis em toda
praça (conferido nas 30), nas pontas das quadras; o letreiro da loja vai na
fachada. `conferir_lojas.mjs` confere, com a conta de colisão do cenário,
que cada ponto do assalto (saque, postos, clientes, fundos, saídas) se
alcança da calçada.

**O motor** (JavaScript puro, sem three.js; `conferir_assalto.mjs` roda sem
navegador) põe na loja quem trabalha (caixa, gerente, segurança com ronda),
os clientes (pela movimentação e pela hora), quem passa na calçada, as
câmeras e o saque. Cada um olha (alcance e ângulo por papel, com parede no
meio: raio na grade de 25 cm) e junta **desconfiança** pelo que vê — anunciar
pesa mais, pegar coisa, estar na área restrita, correr, o bando junto, ficar
45 s sem comprar nada. Com 0,4 ele desconfia (o **?** em cima da cabeça);
com 1, dá o **alerta** (o **!**): liga pra polícia (4 s) ou aperta o botão
do alarme (o alarme silencioso adianta a polícia 8 s).

- **A Exposição** sobe com tudo que é visto e desce devagar sem ninguém
  olhando; **a Suspeita** é a maior desconfiança da loja; **a Situação** vai
  de Normal a Suspeita, Alerta e Polícia no local.
- **A polícia** chega no tempo que a conta dá — a distância da delegacia
  mais perto, a segurança da loja, a atenção da polícia sobre a torcida e o
  horário (de 18 a 95 s) —, com reforço a cada 15 s (até 4 viaturas de 2
  PMs). Quem ela alcança, cai. Os **olheiros** na rua avisam quanto falta.
- **O saque**: cada ponto tem o seu tempo (a vitrine, o caixa, o cofre, que
  precisa de mais gente junto); segurar **E** pega, e cada um da equipe perto
  ajuda. No furtivo, pegar com gente olhando é o que mais pesa.
- **A fuga**: E perto do carro foge; quem está a 10 m entra junto; quem
  ficou longe foge a pé e larga metade; o preso perde o que levava.
- **Os comandos**: WASD anda (em relação à câmera), Shift corre, E age
  (segurado), Q anuncia, Z distrai (quem conversa prende o olhar do outro
  por 25 s), X manda a equipe esperar/seguir, V troca a câmera, Esc aborta
  (com confirmação). No celular, o joystick e os botões.
- **O HUD**: o nome da loja, o jeito, a hora e o tempo; as barras de
  Exposição e Suspeita; a Situação; o butim sobre o potencial; a equipe
  (dentro, fora, presos); a polícia (a caminho, o tempo que falta se tem
  olheiro, quantos PMs); "quantas pessoas te olhando" e as câmeras; a dica
  do que fazer e a barra de progresso do que se está pegando; os avisos.
- **O fim**: o painel do resultado (butim, presos, exposição, alerta,
  polícia no local, câmeras, tempo) e **Voltar pro jogo**. A luz da praça
  vai pra hora do plano durante a cena e volta pra do relógio no fim; a
  câmera volta pra sala do presidente.

### O resultado no save (`acoes.js`, `fecharAssalto`)

O mesmo pra cena jogada e pra conta: o butim entra no caixa ("Assalto —
alvo"); cada preso pega a pena da tabela do dono (banco 180 dias, joalheria e
supermercado 120, posto 90, mercadinho 45, loja de roupas 30); a diretoria
manda o recado; e, se fez barulho (alarme ou gente presa), sai a página do
**Futebol e Porrada** ("Assalto ao supermercado em …: o alarme tocou e o
bando sumiu"). A operação guarda o resultado (`E.assaltos[i].resultado`).

**A atenção da polícia sobre a torcida** (`E.calorPolicia`, 0 a 100) sobe a
cada assalto — +2 no furtivo limpo; alarme +8, polícia no local +6, cada
preso +3, câmera que gravou +6 e a exposição/10 — e esfria 1,5 por dia. Ela
encurta o caminho da viatura na cena e aumenta o risco na conta.

**Deixar a equipe fazer** usa o mesmo plano: a chance de alguém perceber (no
furtivo: a atenção de quem trabalha, o movimento da hora, o tamanho da
equipe, a ficha de quem foi), a da polícia chegar a tempo (a régua antiga do
dono, de 5% na loja de roupas a 50% no banco, mexida pela hora, pela
atenção da polícia, pela ficha e pelo tamanho) e o butim (no rápido, 65–95%
do potencial menos a dificuldade; no furtivo, 30–55%; percebido, 15–40%).
Chegando a polícia, cai parte de quem estava dentro — e às vezes (35% no
rápido, 20% no furtivo percebido) o bonde inteiro é cercado, como na régua
antiga. A equipe é sorteada entre os disponíveis do dia (a régua do dono de
17/08: não é a elite que vai).

### Limites (sinceros)

- **O vidro é vidro só pro olhar do povo**: quem passa na calçada vê a
  equipe pela vitrine (e dá o alerta), mas no desenho a vitrine é uma
  textura — do nível da rua o jogador não enxerga o lado de dentro (de cima,
  o teto da loja se abre).
- **A polícia é simples**: a viatura não aparece, os PMs surgem na calçada
  e correm atrás de quem está mais perto; não atiram, não cercam a quadra,
  não perseguem o carro.
- **O povo da loja também é simples**: desconfia, dá o alerta, liga, foge,
  levanta as mãos quando rendido; não reage nem troca de lugar por conta
  própria além da ronda do segurança.
- **O HUD da cena é só em português** (como o resto das cenas 3D); as telas
  do jogo (planejamento, calendário, cartões, recados, jornal) estão nas três
  línguas.
- **No jogo de feed (2D) não há cena**: o cartão só oferece deixar a equipe
  fazer ou cancelar. Se a loja não abre em 3D (a praça na tela não é a da
  torcida, um dia de jogo no ar), a equipe faz sozinha e o jogo avisa.
- **A atenção da polícia só pesa nos assaltos**: ela não mexe (ainda) no dia
  de jogo, na revista do portão nem nas outras brigas.
- Save antigo: o cartão "Ver os alvos" da reunião e o `tela-assalto` de
  antes abrem a tela nova do planejamento.

## 29. O menu Gráficos: o jogo leve no computador sem placa de vídeo (30/09/2026)

**O pedido** (o dono): "crie mecanismos de melhorar o FPS em computadores
fracos, em um menu de configuração de gráfico". Nos prints dele, o Jogo 3D
a 4–5 fps na sala do presidente, com o aviso do medidor "Sem placa de vídeo:
o navegador desenha no processador (Microsoft Basic Render Driver)", 130 mil
triângulos e 40 chamadas de desenho.

### Onde o quadro gasta (medido antes de mexer)

No navegador de teste sem placa (SwiftShader, janela de 1366 × 768, a sala
do presidente da Leões da TUF em Fortaleza): **1,6 fps** de dia e **0,7 de
noite** com o relógio do jogo andando (como se joga: a virada do dia e as
mensagens travam quadros no meio); com o relógio parado (a medida limpa, a
que as tabelas abaixo usam), 2,5 e 1,9. O JavaScript do quadro (a vida, os
bonecos, os balões) gasta uns 4 ms; o resto é o desenho, e o desenho custa
quase tudo pelo **número de pixels** e pelo **trabalho de cada pixel**. Cada
alavanca sozinha, na mesma vista (janelas de 8 a 10 s, com ruído — servem
pra comparar ordem de grandeza):

| o que mudou | fps de dia |
|---|---|
| nada (suavização ligada, 100%) | 1,6 |
| sem a suavização de bordas (MSAA) | 2,5 |
| metade da resolução | 3,8 |
| metade da resolução, sem suavização | 6,5 |
| um quarto da resolução, sem suavização | 12,8 |
| sem a cidade na tela (só os bonecos) | 35 |
| a luz simples (conta no vértice) | +6% de dia, +10% de noite |
| as luzes da noite apagadas | +11% de dia, +13% de noite |
| blocos do forno de 48 m em vez de 96 (menos triângulos) | +7% (não entrou) |

O HUD do jogo (a barra, a coluna, os balões) não pesa: escondido, o fps
não mudou.

### O menu

- **Onde abre**: o ícone novo da coluna da esquerda (a tela com o ponteiro,
  "Gráficos", só no jogo 3D), as **Configurações** do menu principal (botão
  "Abrir as opções de gráfico") e o **clique no medidor de fps**.
- **Ao vivo**: o painel fica à direita e não cobre a cidade — cada opção
  vale na hora e o fps que muda aparece no alto do painel (com a
  resolução em pixels e o aviso de "sem placa de vídeo"). Enquanto ele está
  aberto, o **relógio do jogo para** (pausa `graficos`).
- **Predefinições**: Mínima, Leve, Normal e Alta, e a "recomendada pra este
  computador". Mexer numa opção vira "Personalizada"; voltar a bater com
  uma predefinição mostra ela de novo. "Voltar ao recomendado" aplica a da
  máquina.
- **As opções** (guardadas no navegador, `cenario-graficos`; valem pra
  ferramenta do cenário também):
  - **Resolução da imagem**: Automática, 100, 85, 70, 50 ou 35%. A
    **automática** mede a mediana do tempo entre quadros a cada 1,5 s (um
    soluço do jogo não conta) e desce o que falta de uma vez (o quadro custa
    mais ou menos os pixels) até 35%; sobra fps, sobe 12% por vez, mais
    devagar a cada subida que não aguentou (a imagem não fica pulsando). A
    que ela achou fica guardada pra próxima abertura. **A automática mira
    em** 20, 30, 45 ou 60 fps.
  - **Suavizar as bordas**: Automático (desligada sem placa de vídeo), Sim
    ou Não. É do contexto do WebGL: **só vale quando o jogo abre de novo**
    — o painel avisa.
  - **Limite de fps**: sem limite, 60 ou 30. Não aumenta o fps; deixa o
    processador livre pro resto do jogo e esquenta menos.
  - **Iluminação**: Completa (a conta do sol e do céu em cada pixel) ou
    Simples (no vértice: nas paredes e no chão, que são planos, sai igual; o
    pixel perde duas variáveis interpoladas).
  - **Luzes da noite**: acesas ou apagadas (apagadas, os shaders nem têm a
    conta do poste, do refletor, da janela e do cômodo; a lente da
    luminária continua acesa).
  - **Distância de visão**: longe, média ou perto (a névoa e o longe da
    câmera; na vista de cima da praça).
  - **Gente na rua**: muita, média ou pouca (os pedestres e a roda na porta
    dos bares da vida da praça; a gente da sede, do dia de jogo e das brigas
    não muda — é o jogo).
  - **Bonecos**: detalhados ou leves (todo mundo no modelo de longe, menos
    o líder).
  - **Texturas**: alta, normal, leve ou mínima (os pixels por metro do chão,
    o letreiro e a **filtragem anisotrópica**, 8× / 8× / 2× / 1×). Trocar
    **remonta a praça**: com a partida no ar, a vida da sede desliga e liga
    de novo pelo caminho de sempre; com o dia de jogo ou o assalto no ar,
    espera eles acabarem.
  - **Medidor de fps**: mostrar ou esconder. Com a resolução abaixo de
    100%, ele diz quanto ("· 35% da resolução").
- **A primeira vez sem placa de vídeo**: o cenário abre um contexto de
  prova antes de criar o desenhista (o nome da placa e o
  `failIfMajorPerformanceCaveat` do navegador) e, sem escolha guardada,
  começa na **Mínima** — já sem a suavização, que não dá pra desligar
  depois sem recarregar. O jogo avisa uma vez por navegador: "Sem placa de
  vídeo: os gráficos começaram no mínimo…".
- Quem tinha escolhido a qualidade na caixa antiga da ferramenta
  (`cenario-qualidade`) fica com a predefinição do mesmo nome. Na
  ferramenta, a caixa virou "Gráficos" (as quatro predefinições).

### De graça pra todo mundo (sem opção)

- **A cúpula do céu** só é desenhada quando o céu aparece: com a câmera
  olhando pra baixo mais que a metade da lente (a sala do presidente, a pé,
  a vista de cima) ela era uma tela inteira de pixels desenhada à toa por
  baixo da cidade.
- **Uma variável interpolada a menos** nos materiais da cidade e do chão: a
  noite usava a posição no mundo que o corte (e o chão) já levavam pro
  pixel.

### O que rende (medido depois, a mesma vista)

Relógio parado, janelas de 15 s, a versão de antes e a nova montadas do
mesmo jeito e medidas pelo mesmo roteiro (um jogo novo da Leões da TUF; a
sala, a sala às 21 h e a praça vista de 450 m):

| predefinição | sala, dia | sala, noite | a praça de cima (450 m) |
|---|---|---|---|
| antes (o de ontem, com suavização, 100%) | 2,5 | 1,9 | 0,96 |
| Normal (sem placa: sem suavização) | 3,2 | 2,3 | 1,7 |
| Leve (automática → 35%) | 10,2 | 10,1 | 2,1 |
| Mínima (automática → 35%) | 16,6 | 15,6 | 3,0 |

Na sala, a Leve rende uns 4× o de antes e a Mínima uns 6,5× (8× de noite).
No PC do dono o desenho é mais rápido que o do navegador de teste (lá,
4–5 fps onde aqui deu 1,6 com o relógio andando): se a proporção se
mantiver, a Mínima fica na casa dos 30 fps na sala e a Leve perto dos 20.
**Não medi no PC dele** — é conta, não medida.

### Limites (sinceros)

- **A imagem a 35% é borrada.** É o preço do fps no computador sem placa
  — o HUD, que é HTML, continua nítido. Quem prefere nitidez escolhe a
  resolução fixa (50 ou 70%) e aceita menos fps.
- **A vista de cima da praça inteira continua pesada** (1,1 milhão de
  triângulos, 400 chamadas): ali o custo é de triângulo, não de pixel, e a
  distância de visão pouco corta (a praça cabe na névoa). Uma versão de
  longe da cidade (o prédio virando caixa, como no jogo de feed antigo)
  resolveria, e não foi feita.
- **A iluminação simples rende pouco** (6–10%): o material básico, sem
  conta nenhuma, prometia mais, mas o resto do pixel (a textura, a cor, a
  névoa, o corte do telhado) pesa igual.
- **A suavização só muda recarregando a página**; a automática já nasce
  desligada sem placa.
- **As cenas à parte** (a festa, a caravana, o assalto, a briga no palco)
  têm materiais e texturas próprios: herdam a resolução, o limite de fps e
  os bonecos leves (e a luz simples nos bonecos); a luz simples, as luzes
  da noite e as texturas são da cidade.

## 30. Os bairros com dona, a cidade dominada e o mapa do Brasil (30/09 e 01/10/2026)

**O pedido** (o dono): "inicie a setorização dos bairros de acordo com os
dados que temos e as zonas também. quando clicamos em menu>mapa vai ter a
opção do mapa do Brasil, onde podemos ver os mapas 2d de qualquer cidade.
Em cada bairro vai apontar qual torcida comanda, e a torcida que comandar
mais bairros domina a cidade" — com as réguas de prestígio e moral, o
padrão de partida, a sede como o bairro mais duro de tomar, as ações que
contam, a barra de 0 a 100 e o corte de 30% na receita em bairro de rival.
E o nome do bar: "BAR DA {torcida}", no feminino, no mapa e na fachada.

### As réguas (js/mundo/dominio.js, `TO.dominio`)

- **A barra**: cada bairro tem uma barra de 0 a 100 repartida entre as
  torcidas (o que sobra é de ninguém). **Dona é quem passa de 50**;
  ninguém acima de 50, o bairro está em disputa. Ação ganha no bairro soma
  na barra de quem ganhou e tira de quem perdeu.
- **A cidade**: domina quem é dona de mais bairros que qualquer outra;
  empate no topo, ninguém domina. **Todo dia** (`TO.dominio.dia`, chamado
  no `avancarDia`): quem domina ganha **+0,1 de prestígio e +0,1 de
  moral**; a primeira e a segunda maior da cidade (pelos membros de hoje)
  que não dominam perdem 0,1 de cada. O "0,1" é na régua de 0 a 100 da
  tela — no indicador interno, de 0 a 20, é 0,02. A torcida do jogador
  muda direto nos indicadores (com uma linha por semana no relatório, não
  uma mensagem por dia); as da IA, pelo `TO.relacoes.mover`.
- **O corte de 30%**: bar, loja, subsede e filial — e a festa da sede —
  em bairro cuja dona é **rival** da torcida (Rival ou Maior Rival, a
  relação de hoje) rendem 30% menos. Aparece no financeiro, no patrimônio
  ("{nota}: a festa rende 30% menos") e no cartão do bairro.
- **O começo**: cada save sorteia o seu padrão pela semente do save. Numa
  cidade de 16 bairros a maior e a segunda maior ficam com uns 5 cada (às
  vezes 4 ou 6); em 30% das cidades as duas começam **empatadas** (a
  cidade começa sem dona), e o resto é rateado entre as demais pelos
  membros de partida, sempre abaixo das duas maiores. Medido nas 94 praças
  com torcida: umas 27 começam empatadas.
- **A sede**: o bairro da sede é sempre da torcida dela no começo, com a
  barra alta, e é o mais difícil de tomar — quem não é da casa ganha
  **metade** ali, e a casa se refaz **meio ponto por dia até 80**. A
  **subsede** (e a filial) também segura o bairro dela (um terço de ponto
  por dia até 65): é assim que ela chega a dominar.
- **Duas sedes no mesmo bairro** (3 praças do Brasil e mais de 30 de fora
  nos dados): a maior fica; a outra vai pro bairro livre mais parecido (a
  mesma zona, depois a vizinha; a mesma classe de bairro). A troca é feita
  nos dados, na carga, e vale igual no jogo de feed, no 3D e na planta.

### O que mexe na barra (pontos de 0 a 100)

| ação | pontos |
|---|---|
| treta marcada (5, 7 ou 10 de cada lado) | 10, 14 ou 18 |
| ataque na pista, na concentração, na praça | 10 |
| briga dos arredores do estádio | 8 |
| segurar (ou tomar) o ataque em casa | 10 |
| bote no bar (+6 se o bar quebrou) | 12 (18) |
| bote na sede | 12 |
| a festa na casa com piscina | 8 |
| estrutura nova no bairro: bar, loja / subsede / filial | 8 / 20 / 15 |
| **ação social no bairro** (nova, uma por semana: R$ 1.500 e 5 membros) | 6 a 10 |
| brigas entre as IAs: na rua / no bar | 8 / 12 |

Quem perde a briga dá os pontos pro outro lado (empate não mexe). O lugar
é o bairro da briga quando ela tem um; sem ele, a concentração conta no
bairro da sede de quem foi atacado, a pista no bairro do estádio. Comprar
bar, loja ou subsede agora pergunta **em que bairro** (o patrimônio lista
os bairros, com a dona e o aviso do corte). A IA também compra (e o bar
dela cai no bairro que ela escolheu) e, uma vez por semana, as duas
maiores de cada cidade que não dominam fazem a ação social delas (35%).

### A planta: os bairros desenhados (ferramentas/planta_html/index.html)

- **Os bairros saem dos dados** (`dados/cidades.js`: o nome, a zona e a
  classe de cada um). A planta divide a cidade em quatro gomos (Norte,
  Leste, Sul, Oeste) pela **área construída** (a régua dos gomos é a dos
  quarteirões, não a da caixa do mapa: a cidade comprida do mapa pequeno
  também sai com um quarto em cada zona). Cada sede vai pro espaço de sede
  da zona do bairro dela, o bairro da sede nasce em volta dela e os outros
  bairros da zona se espalham pelos quarteirões que sobram; cada bar cai
  dentro do bairro que o jogo diz. (**Corrigido no §32**: isso estava
  errado — medido depois, 73 dos 139 bares caíam fora do bairro do jogo;
  e a divisão dos bairros foi refeita.)
- **O que é bairro**: o quarteirão (o de hoje pelo contorno dele — a
  quadra da beira é recortada na guia da avenida da beira), a favela, o
  atacarejo e o estádio; a rua entre dois bairros fica com o mais perto
  (até uns 28 m), **só pela rua e pela calçada** — o mato, a areia e o mar
  não viram bairro (01/10: antes o mapa pintava o bairro por cima do mato
  de São Paulo e da praia de Fortaleza).
- **Nenhum bairro sem chão**: o bairro que fica sem quarteirão (a
  Uruguaiana, no mapa pequeno do Interior do RS) toma o mais perto do
  bairro que tem mais.
- O nome de cada bairro no meio dele; de longe, o nome da zona, no
  primeiro lugar livre perto do meio dela (antes saía tapado pelas
  etiquetas). A caixa **Bairros** liga e desliga a camada.
- Conferido nas 30 praças da planta: nenhum bairro vazio, toda sede no
  bairro dos dados e todo bar dentro de um bairro. Montar uma praça leva
  0,2 a 0,7 s.

### O mapa do jogo 3D (ferramentas/planta_html/mapa3d.js)

- O item **Mapa** da coluna abre a aba **Cidade**: a planta da praça com
  cada bairro **na cor da dona** (mais forte quanto maior a barra; cinza
  em disputa), a sigla e a barra embaixo do nome. Ao lado, quem domina a
  cidade, quantos bairros cada torcida tem e o efeito do dia. O **clique**
  escolhe o bairro (contorno dourado) e o cartão mostra a barra de 0 a
  100 (com o traço dos 50), o que tem nele, a receita do bairro, o corte
  de 30% quando é o caso e o botão da ação social; **dois cliques** levam a
  câmera da cidade até lá.
- A aba **Brasil** mostra o país com as 30 praças na cor de quem domina
  cada uma, e a lista das praças (Brasil por região e as de fora). Outra
  praça do Brasil abre a planta dela — **montada uma vez e guardada**
  (`pracaGuardada`): a planta põe o estado de lá só durante cada desenho e
  devolve o de agora, então o arrasto e o zoom são os de casa, com os
  rótulos no tamanho de sempre (01/10: antes era uma imagem esticada, com
  os nomes ilegíveis). Medido: São Paulo monta em 0,8–0,9 s, Belém em
  0,6–0,8 s, e cada desenho leva 13–17 ms; a praça já vista volta na hora
  (as 4 últimas ficam guardadas enquanto o mapa está aberto). **A cidade
  3D não é remontada**: a planta dela sai idêntica (sedes, bares, lotes,
  bairros, calçadas) antes e depois de ver outras praças — conferido no
  teste.
- As praças de fora do Brasil não têm planta: delas sai o **quadro dos
  bairros por zona** (a mesma bússola do jogo de feed).
- **O jogo de feed** tem o item **Mapa** também (`js/ui/mapa_brasil.js`,
  `css/mapa.css`): o Brasil, a lista das praças e, escolhida uma, o quadro
  dos bairros com o mesmo cartão — ele não tem a planta.
- **O bar**: "BAR DA {torcida}" no letreiro da fachada (o 3D e a cena do
  estádio) e "Bar da {torcida}" nos rótulos do mapa.

### Limites (sinceros)

- **"Ferir membros rivais andando de maneira livre" não existe**: o jogo
  não tem briga a pé solta na cidade (o boneco a pé do cenário não briga).
  As outras ações do pedido contam; essa fica pra quando houver o combate
  livre.
- **±0,1 por dia pesa**: em um ano são uns 36 pontos (de 0 a 100) de
  prestígio e de moral. A cidade que começa empatada tira das duas maiores
  desde o primeiro dia.
- **A zona nem sempre cabe**: o mapa tem um número fixo de espaços de sede
  por gomo; quando uma zona tem mais sedes que espaços (São Paulo tem 4
  sedes na Zona Oeste; o Rio, 4 na Leste), parte dos bairros dela fica num
  gomo vizinho (a lista "fora do gomo" do teste: 1 a 3 por praça).
  Alguns bairros saem pequenos (o menor, no ABC Paulista, com uns 800 m²).
  (Resolvido no §32: os terrenos de reserva e os gomos de cada praça.)
- **Sedes e bares mudam de lote** em relação à versão de antes: a zona do
  bairro agora vem antes da regra das rivais em lados opostos (que vale
  dentro das distribuições que respeitam a zona).
- **O save cresce**: a cidade tocada (pelo jogador ou pela IA) fica
  gravada — uns 50 KB nas duas primeiras semanas de jogo.
- As praças de fora do Brasil só têm o quadro, sem planta.
- Duas praças do mesmo mapa e da mesma costa dividem a montagem da
  planta; a de praia e a de lagoa agora refazem as calçadas da beira
  (antes uma herdava a grade da outra).

## 31. Os arredores do estádio: casas, comércio, estacionamentos e ambulantes (01/10/2026)

**O pedido** (o dono): "Após concluída a questão do mapa, adicione casas,
comércios (como espetinho, hamburgueria, pizzaria, barzinho, ambulantes na
porta do estádio) e outras coisas que fazem sentido com o arredor dos
estádios pra não ficar um visual tão vazio, e adicione pequenos terrenos de
estacionamentos também, típicos de arredores de estádio."

### O entorno (ferramentas/planta_html/proposta.js, `ENTORNO_M`)

- **Onde**: do outro lado da rua que cerca cada estádio, onde era mato,
  quarteirões de uns 34 m de comprido, cada um com a rua dele em volta. Duas
  fileiras de lote de costas (2 × 5,8 m; a da frente olha pro estádio, a de
  trás pra rua dos fundos) ou uma só (8,6 m) quando não cabe. Os do oeste e
  do leste vão de ponta a ponta do estádio (pegam as quinas); os do norte e
  do sul, o comprido dele. O quarteirão não pisa no que o estádio também
  não pisa (a cidade, a favela, o Atacadex, os outros estádios), nem nos
  acessos do estádio, nem na avenida de entrada ou na da beira (nas praças
  sem praia também); o que não cabe inteiro encolhe de 4 em 4 m até 16 m.
- **A fileira da frente**: o **comércio de dia de jogo** — espetinho,
  hamburgueria, pizzaria e barzinho, um de cada antes de repetir em cada
  estádio, até três por quarteirão, de 7,6 a 11 m de frente, com o nome da
  lista (ESPETO DO TORCEDOR, SMASH DA ARQUIBANCADA, PIZZA DA VILA, BOTECO DO
  TORCEDOR…; o mesmo nome não repete perto) — e o **estacionamento de
  terreno**, de 15 a 20 m, de rua a rua: um em cada dois quarteirões de 24 m
  ou mais, de um a três por estádio, com o preço na placa (R$ 20, 25, 30 ou
  40). O resto é casa, sobrado ou terreno baldio, com placa de comércio
  pequeno e pixação como nos outros quarteirões.
- **Nas 30 praças**: 506 quarteirões, 2.763 casas, 441 comércios e 197
  estacionamentos; nenhum por cima de outra coisa (conferido).

### Em 3D (js/diajogo/casas3d.js)

- **O comércio**: o prédio no fundo do lote, a frente aberta com a porta de
  enrolar recolhida embaixo da platibanda (o letreiro com o nome vai nela,
  decalque, nas cores de cada tipo), o piso, o forro, a parede do fundo com
  a porta, a prateleira e o cartaz, o balcão de azulejo com a geladeira, e
  no recuo da frente o que é de cada um: o **espetinho** com a churrasqueira
  de tijolo, os espetos na grelha, o isopor e as mesas de guarda-sol; a
  **hamburgueria** com o toldo listrado vermelho e branco, as banquetas no
  balcão e a chapa; a **pizzaria** com o forno a lenha, a chaminé saindo da
  laje, o toldo verde, branco e vermelho e as mesas de toalha vermelha; o
  **barzinho** com a cobertura de fibrocimento nos dois pilares, a faixa da
  cerveja, os engradados e a TV na parede. O lote alto ganha o andar de
  cima (a moradia do dono).
- **O estacionamento**: o chão de terra batida, o muro de bloco, o portão
  largo de correr aberto (do lado que o gerador sorteou), a guarita, as
  vagas riscadas e os carros parados — o mesmo sorteio no 2D e no 3D
  (`carrosDoEstacionamento`) —, e a placa com o preço.
- **No mapa 2D**: o comércio na cor dele com a borda escura; o
  estacionamento com as vagas, os carros e a guarita; de perto, o nome e o
  preço. A legenda tem "Comércio do estádio", "Estacionamento" e
  "Ambulante".

### Os ambulantes (js/diajogo/ambulantes3d.js)

- **Cinco peças**, em metros, de frente pra rua, com as ferramentas e a
  folha da praia (praia3d.js): o **carrinho de pipoca** (a vitrine com a
  pipoca à vista, a panela, o telhadinho, as rodas de bicicleta), o
  **cachorro-quente** (o carrinho de inox, o painel amarelo, as cubas, os
  três molhos, o guarda-sol), o **espetinho** (a churrasqueira de chapa com
  a brasa e os espetos, o isopor, a cadeira, o papelão do preço), o
  **isopor de bebidas** (os isopores no carrinho de mão com as latinhas, o
  guarda-sol) e o **camelô** (a arara de camisas, as bandeiras no mastro e
  a mesa dos bonés, **nas cores dos mandantes do estádio** —
  dados/estadios.js e dados/times.js). De 950 a 1.250 triângulos cada.
  Estão no catálogo **Modelos 3D** (seção "Os ambulantes").
- **O lugar**: em cada portão, na calçada do estádio (a faixa de 2,5 m entre
  o terreno e a rua), de costas pro terreno, dos dois lados da entrada — a
  boca do portão e o começo da fila (`BOCAS_DOS_PORTOES` em estadios3d.js,
  os mesmos de rotas_estadios.js) —, a 6 m dela ou mais, 2,2 m entre um e
  outro e até 20 m da boca. O portão 1 tem até quatro, o 2 até três e o 3
  (o do visitante) dois. A frente da **bilheteria que dá pra rua**
  (`BILHETERIAS_DA_RUA`: a do portão 1 do de 10 mil e as quatro do de 40)
  fica livre: o carrinho pula pro outro lado dela. Na quina do terreno ou
  na boca de outro portão a fileira acaba.
- **Nas 30 praças**: 666 ambulantes em 74 estádios (os 9 em todos).
- No mapa, cada um é a planta dele na cor do tipo; de perto, a copa do
  guarda-sol e o nome.

### O entorno e os bairros

O entorno é do **bairro do estádio dele**: ele fica fora da conta dos
gomos (a régua das zonas usa o limite da cidade sem ele,
`limiteSemEntorno`) e da onda que dá a rua a cada bairro (na rua nova a
onda só passa até a calçada do outro lado da rua do estádio, como antes);
o quarteirão e a rua dele ganham a cor do bairro do estádio no fim. A
favela também não "cresce" até a rua nova do entorno (a rua dele segura
a casa da favela, mas não puxa). Conferido nas 30 praças contra a versão
de antes do entorno: nenhuma sede tinha mudado de lugar. Depois, a
divisão dos bairros foi refeita (§32): o entorno continua de fora dos
gomos, mas agora pesa no tamanho do bairro do estádio.

### O dia de jogo

Nas 30 praças, o dia de jogo com e sem os ambulantes (conferido antes da
divisão nova dos bairros do §32): **25 praças idênticas**; nas outras 5,
uma rota 1 m mais longa ou mais curta (o carrinho na calçada) e um PM a
mais ou a menos nos cordões. Nenhum erro, todos os bondes chegaram. O
teste com os bairros novos (as sedes mudaram de lugar) está no §32.

### O custo

- A cena de Fortaleza (3 estádios): 1.372.582 triângulos sem o entorno,
  1.541.775 com ele (+12%) e 1.564.597 com os ambulantes; a montagem
  segue em uns 18 s no processador sem placa de vídeo (o mesmo de antes).

### Limites (sinceros)

- **O ambulante não tem vendedor**: é o carrinho, sem boneco do lado. E ele
  fica lá sempre, não só em dia de jogo.
- **O comércio é por fora**: o balcão e a parede do fundo se veem pela
  frente aberta, mas ninguém entra nem é atendido; o estacionamento não
  recebe o carro de quem vai ao jogo (os carros parados são decoração).
- **Comércio e estacionamento são lote particular**: no dia de jogo a
  torcida não corta caminho por dentro deles (custa 8 vezes mais, como
  qualquer lote); o carrinho do ambulante barra o passo (do boneco a pé e
  da torcida), na calçada do estádio.
- **Os bares**: com o entorno, ficaram onde estavam em 28 das 30 praças
  (em duas praças pequenas, um par trocou de dono dentro do mesmo
  bairro). A divisão nova dos bairros (§32) mexeu neles de novo.
- A cena ficou uns 14% mais pesada (o entorno e os ambulantes juntos).

## 32. Os bairros refeitos: a favela sozinha, as zonas no lado certo e o mesmo tamanho (01/10/2026)

**O pedido** (o dono): "vamos começar a corrigir os mapas: as favelas
sozinhas são um bairro só. os nomes genéricos atuais (favela do sudoeste,
do sul, etc) somem, fica somente o nome do bairro. tente redistribuir as
sedes pro bloco de zonas ficar o mais coerente possível (zona sul ficar
exatamente no sul, oeste no lado oeste, etc) e tente fazer com que os
bairros tenham tamanhos parecidos um com o outro."

Tudo em `ferramentas/planta_html/index.html` (`gomosDaPraca`,
`favelasNosBairros`, `setorizar`, `repartir`, `equilibrar`,
`reservasDeSede`, `criarVagasExtras`); o gerador do mapa (proposta.js) não
mudou.

### A favela é um bairro sozinho

- Cada favela do mapa, da maior pra menor, toma **um bairro inteiro, só
  dela**, da zona em que ela fica: o de classe Favela dos dados, senão o
  mais pobre que sobra (Classe Baixa, depois Média, depois Nobre). Nunca o
  bairro de uma sede (a sede fica num terreno de quadra, não na favela), e
  a zona sempre guarda um bairro pras quadras dela.
- **O nome**: "Favela do Sudoeste", "Favela do Sul" etc. sumiram. No mapa
  a favela leva o nome do bairro (com a camada **Bairros** ligada, o nome
  do bairro já fica no meio dela, e o rótulo da favela não se repete). A
  treta marcada diz "No beco da favela Jangurussu, treta marcada" (antes,
  "No beco da Favela do Sul"); a lista de casas por favela, nas notas da
  planta, também.
- O bairro da favela é pintado pelo contorno dela **e pelos lotes dela**
  (o boteco da esquina passava do contorno e ficava com a frente sem
  bairro).
- **104 das 118 favelas** das 30 praças são bairro sozinhas. As outras 14
  ficam com as quadras em volta (é o bairro de quadra que pega ela): são as
  zonas em que todos os bairros que sobram têm sede, ou em que a favela
  levaria o último bairro das quadras (Messejana em Fortaleza, Londrina no
  Interior do PR, Botafogo no Rio, Pelotas II no Interior do RS…).

### As zonas no lado certo

- **Os gomos da praça**: as quatro zonas continuam saindo do meio da
  cidade (a régua da área construída), mas as quatro divisas não são mais
  as diagonais fixas. Os quartos fixos davam zonas de tamanhos diferentes
  (no mapa pequeno, a Leste com 35% da cidade e a Norte com 16%), e a zona
  com duas favelas ficava com um bairro de quadra só, o dobro dos outros.
  Agora cada divisa anda até a área de quadra de cada zona, dividida pelos
  bairros de quadra dela, dar o mesmo nas quatro — **sem sair do lugar**:
  a divisa fica a no máximo 40° da diagonal, cada zona com 50° ou mais, e o
  meio da zona a no máximo 25° do ponto cardeal (o Sul segue no sul, o
  Oeste no oeste). A favela que fica perto da divisa (até 35° dela) pode
  ficar de um lado ou do outro: cada jeito é testado com as divisas presas
  do lado certo de cada favela, e fica o de bairros mais iguais (a favela
  sem bairro dela e a divisa longe da diagonal custam um tico). Medido:
  as divisas andaram em média 14° (no máximo 37°).
- **A sede no gomo da zona dela**: os espaços de sede do gerador ficavam
  quase todos no sul e no leste (no mapa médio, nenhum no gomo oeste; no
  mapa pequeno, nenhum terreno de reserva em lugar nenhum). Agora há os
  **terrenos de reserva**: a ponta de uma quadra de casas (a oeste ou a
  leste; 72% da frente, o fundo inteiro), a 50 m ou mais dos estádios, que
  só vira sede quando uma torcida precisa dela — aí as casas debaixo dela
  somem; sem sede, ela continua casa e não aparece como sede vaga. Cada
  zona com sede ganha as reservas que faltam e mais duas, e a escolha da
  sede (a regra das rivais em lados opostos, como antes) passa a preferir
  **as sedes da mesma zona espalhadas** (duas sedes coladas espremiam um
  dos bairros: em Fortaleza, as três sedes do Sul no miolo deixavam um
  bairro esticado até o estádio do sudoeste).
- A quadra da sede vai pra zona da sede (na divisa, o meio da quadra caía
  no gomo vizinho e a sede ficava no bairro errado).

### Bairros do mesmo tamanho

- Dentro de cada zona, as quadras são repartidas entre os bairros de
  quadra dela **pela mesma área**: cada bairro cresce em volta de uma
  semente, a semente do bairro grande perde força e a do pequeno ganha até
  as áreas igualarem, e a semente anda pro meio do pedaço dela (o pedaço
  sai inteiro e redondo — é um diagrama de potência). A área de cada
  quadra conta a meia rua em volta (o bairro de muita quadra pequena leva
  muita rua); a do estádio conta o entorno dele. A quadra da sede é sempre
  do bairro da sede.
- **O estádio não se divide**: vários começos são testados (cada bairro
  começando no estádio), e o bairro que fica com ele leva também a quadra
  mais perto a 50 m ou mais dele que encosta no estádio e no entorno
  (onde cabe um bar; a que não encosta ficava solta do outro lado da
  avenida, e aí o bairro fica sem). A quadra do
  estádio no mapa novo deixou de contar duas vezes (ela e o estádio,
  uma em cima da outra).
- **Bairro em pedaços custa caro** na escolha, e o pedaço que sobra solto
  passa pro vizinho. No fim, **o acerto na divisa**: a quadra da divisa
  passa do bairro maior pro vizinho menor enquanto isso aproxima os dois
  do tamanho certo, sem nunca partir quem cede e sem mexer na quadra da
  sede, do bar ou do estádio.

### O bar no bairro dele

- O §30 dizia que "cada bar cai dentro do bairro que o jogo diz": **estava
  errado**. Medido agora, na versão de antes destas mudanças, **73 dos 139
  bares** das 30 praças caíam fora do bairro do jogo (o gerador espalhou os
  lotes de bar pela cidade sem saber dos bairros, e o bar sem vaga no
  bairro dele ia pro lote livre mais perto).
- Agora o **boteco de cada favela** é vaga de bar da torcida (com dono,
  vira o bar da torcida, o mesmo modelo do resto da cidade, com o letreiro
  BAR DA …; sem dono, volta a ser o boteco). E, **quando o jogo põe num
  bairro mais bares do que ele tem vaga, uma casa do bairro vira o bar**:
  a casa de quadra nova com frente de 5 a 9,5 m, ou uma casa grande da
  favela (a lanchonete, a de dois andares, a da garagem, a da base — a
  casa comum da favela tem 2 a 3,4 m de frente), a 50 m ou mais dos
  estádios, fora do terreno das sedes, a mais perto do meio do bairro e a
  30 m de outro bar (12 m na favela). A casa de hoje (a do jogo) não vira
  bar. A vaga que ninguém toma não vira nada, e a próxima praça desfaz
  tudo.
- Resultado: **13 de 139 bares** fora do bairro do jogo (eram 73): doze
  em bairro de estádio sem casa nova que sirva a 50 m dele, e um na
  favela da Vila Maria (São Paulo), que teria o quarto bar.

### Medido nas 30 praças

| | antes | agora |
|---|---|---|
| sede fora do gomo da zona dela | 63 | **0** |
| sede fora do bairro dela | 0 | 0 |
| favela que é bairro sozinha | — (a favela se repartia) | **104 de 118** |
| variação do tamanho dos bairros (cv, todos) | 0,68 | 0,52 |
| maior ÷ menor (média por praça, todos) | 14,9× | 9,2× |
| só os bairros de quadra: cv e maior ÷ menor | — | **0,16 e 1,8×** |
| bar fora do bairro do jogo | 73 de 139 | **13 de 139** |
| células do bairro no gomo da zona dele | 72,4% (gomos fixos) | 91,2% (os gomos da praça) |
| zona num pedaço só (o maior pedaço dela) | — | 93,5% |
| bairro vazio, bar sem bairro | 0 | 0 |
| montar uma praça | 0,2 a 0,7 s | 0,1 a 0,8 s (mediana 0,4 s) |

O "todos" inclui os bairros de favela, que são menores (ver os limites).
Contado pelos quartos fixos de antes, a coerência de agora seria 78,5%:
as zonas são outras (as divisas andaram), não dá pra comparar 1 a 1.

**O dia de jogo** nas 30 praças, com as sedes nos lugares novos: nenhum
erro, o clássico de cada praça igual, os 88 bondes na rua inteiros (6.595
pessoas). Contra a versão de antes (com o entorno): 68 das 88 chegadas
na mesma hora; a rota mudou de −621 m a +338 m (a sede andou) e a
chegada, de 25 min mais cedo a 3 min mais tarde.

A planta da cidade 3D sai idêntica antes e depois de abrir o mapa de
outra praça (São Paulo e Belém, no jogo 3D): os campos novos (os gomos,
as reservas, a casa que vira bar) entram na fotografia da praça.

### Limites (sinceros)

- **A favela é menor que um bairro de quadra**: tem 2 a 5% da cidade, e o
  bairro de quadra, 8 a 12%. O bairro de favela fica com um quarto à
  metade do tamanho dos outros (por isso o "maior ÷ menor" de todos os
  bairros ainda é 9×). Igualar de verdade só aumentando as favelas no
  gerador.
- **14 favelas ficaram com as quadras** (listadas acima): a zona não tinha
  bairro sobrando.
- **As zonas não são mais os quatro quartos**: a divisa anda até 40° da
  diagonal pra igualar os bairros. O Sul continua no sul (o meio da zona a
  25° do ponto cardeal no máximo), mas não é um quarto exato do mapa.
- **Zona em pedaços**: a favela do outro lado de um vão, ou o estádio
  separado das quadras pelo mato, deixam pedaço solto (a pior, 82% da zona
  no pedaço maior).
- **No mapa pequeno** o estádio é grande perto de um bairro: os bairros de
  quadra variam mais (cv até 0,40; maior ÷ menor até 3,8× no Interior do
  RS).
- **Sedes e bares mudaram de lote outra vez**: a casa debaixo da sede que
  foi pra um terreno de reserva some; a casa que virou bar perde a casa.
  O número de bares do mapa ("Bares: x de y") agora conta os botecos das
  favelas e as casas que viraram bar, e muda de praça pra praça.
- **13 bares** continuam fora do bairro do jogo (ver acima).

## 33. As torres só no bairro Nobre, e o casarão também (01/10/2026)

**O pedido** (o dono): "Preciso que os prédios fiquem somente em bairros
de classe alta, e as casas de classe mais alta também. Quando digo os
prédios são os prédio altos no formato de torre"

Na planta (`ferramentas/planta_html/index.html`: `torresDaPraca`,
`lugaresDePredio`, `predioNobre`, a guarda de `favelasNosBairros` e o
estádio em `repartir`), no gerador (`proposta.js`: as casas que entram no
lugar de cada torre), em `dados/cena_estadio.js` (o prédio alto com o
número de andares) e em `js/diajogo/casas3d.js` (o casarão). As cores
novas do prédio saem de `ferramentas/planta_html/pintar_variantes_predio.py`.
O mapa "Jogo hoje" (a cidade do jogo de hoje, sem bairros) não mudou.

### Como era

- O gerador põe **3 torres no mapa pequeno, 7 no médio e 9 no grande**: o
  prédio alto do centro (na quadra de hoje 3,5), as duas do baldio (o
  Edifício Mirante e o Residencial Bela Vista) e, no médio e no grande,
  dois e três condomínios de duas torres (na quadra alta, de 44,5 m de
  fundo). Nas 30 praças, **192 torres, 167 fora de bairro Nobre**.
- O **casarão colonial** (o T5 de `casas3d.js`, o sobrado de cornija e
  sacada) saía em 60% dos sobrados perto do centro e em 12% no resto,
  sem olhar o bairro: **708 casarões, 577 fora do Nobre**.

### A torre fora do bairro Nobre vira casa

- Cada torre do gerador só fica quando o lugar dela cai num bairro Nobre
  da praça (o condomínio e as duas do baldio contam juntas, pelo meio).
  Fora dele, o lugar vira casa — o gerador deixa as casas prontas,
  escondidas enquanto a torre fica:
  - **o condomínio**: a quadra alta loteada nas frentes, com um quintal
    no meio;
  - **o prédio do centro**: uma fileira de casas de cada lado da fatia
    dele, com o quintal entre as duas;
  - **o baldio**: casas na frente do terreno murado, com o quintal atrás
    (o que ficava dentro do muro — a árvore do jardim, a pixação — sai
    junto).
- No 2D e no 3D a quadra desenha as casas e o quintal no lugar da torre.

### As torres novas nos bairros Nobres

- O número de torres do gerador (3, 7 ou 9) vai pros bairros Nobres de
  quadra da praça (o bairro Nobre que é a favela não ganha torre). As que
  ficaram contam; cada bairro Nobre ganha pelo menos uma, e o resto vai
  pro que tem mais área por torre.
- A torre nova é o **prédio alto do centro** (o do condomínio pede a
  quadra alta, que o bairro quase nunca tem). Ela toma a **quadra comum
  inteira** (de 22 a 31,5 m de frente: o embasamento de lojas de ponta a
  ponta) ou, na quadra larga, a **ponta de 20 a 26 m**, cortada numa divisa
  de lote; a sobra da casa cortada e o fundo da quadra funda viram o
  jardim do prédio. Uma por quadra, a mais perto do meio do bairro, a
  25 m ou mais das outras torres do bairro quando dá, e nunca em quadra
  de equipamento, de estádio, de entorno, de sede ou de metrô, nem em lote
  de bar, loja, comércio, estacionamento ou favela (a 2 m ou mais do
  terreno de sede, vago também, e a 10 m ou mais do metrô). As casas
  debaixo dela somem (de 8 a 10 na quadra comum). As torres saem antes
  dos bares: nenhum bar cai debaixo de torre nova.
- **De 10 a 16 andares** (10, 12, 14 ou 16, pelo lugar) e **quatro cores**:
  a do prédio do centro (embasamento vermelho e painel ocre) e três
  pintadas na mesma folha — azul-marinho e cinza, verde e terracota,
  grafite e areia —, **em rodízio na praça** (a torre do lado sai de outra
  cor; sorteada pelo lugar, uma das quatro saía em quase metade). O nome
  sai de uma lista de 14 (Edifício Mar Azul, Residencial Brisa do Mar…),
  sem repetir na praça.
- Na planta, a torre é o chão de concreto claro com o jardim em verde; a
  ficha diz "Torre do bairro nobre" e as notas ("As torres e os
  casarões") contam, na praça, as torres que viraram casa e as novas —
  e dizem quando a praça fica sem torre.

### O casarão só no bairro Nobre

- Cada lote de casa leva a marca do bairro (`l.nobre`): **no bairro Nobre,
  metade dos sobrados vira casarão; fora dele, nenhum**. Sem bairros (o
  mapa de hoje), a regra de antes.

### Os bairros: o Nobre com quadra

Duas regras novas, pra o bairro Nobre ficar com quadra de casa:

- **A guarda do último bairro Nobre** (`favelasNosBairros`): o §32 dava à
  favela o bairro mais pobre que sobra na zona e, sem outro, o Nobre — no
  Mato Grosso, no Interior de PE e no de SP, a favela levava o único
  bairro Nobre, e a praça ficava sem torre e sem casarão. Agora a favela
  só leva o último bairro Nobre quando guardá-lo não dá torre: a praça é
  montada com a guarda e, se o Nobre guardado fica sem torre, de novo sem
  ela (os gomos, as sedes e os bairros também). No **Mato Grosso** a
  guarda serviu: a Santa Rosa ficou com as quadras e o prédio do centro
  (1 torre, 6 casarões), e a favela do oeste passou a ser das quadras do
  Jardim das Américas. No **Interior de PE** e no **de SP** não serviu (o
  Nobre guardado ficava só com o estádio): a praça sai igual à de antes,
  e montar ela custa o dobro (0,36 e 0,52 s).
- **O estádio fora do bairro Nobre** (`repartir`): quando a zona tem outro
  bairro, dar o estádio ao Nobre custa como 6% de erro (o bairro do
  estádio fica quase só com ele e o comércio em volta). No **ABC** a Santa
  Paula e em **BH** o Belvedere deixaram de ser o bairro do estádio
  (agora a Assunção e o Prado): ficaram com 10 e 13 quadras de casa. O
  tamanho dos bairros não mudou (a troca é entre pedaços do mesmo
  tamanho).

### Medido nas 30 praças

| | antes | agora |
|---|---|---|
| torres | 192 | 159 |
| torre fora de bairro Nobre | 167 | **0** |
| torres novas (o prédio alto) | — | 131 (e 28 do gerador que ficaram) |
| praças com o número de torres do gerador | 30 | 21 |
| praças sem torre | 0 | 3 |
| casarões | 708 | 416 |
| casarão fora de bairro Nobre | 577 | **0** |
| cores das torres novas (a do centro, v1, v2, v3) | — | 32, 36, 34, 29 |
| andares das torres novas (10, 12, 14, 16) | — | 35, 36, 31, 29 |
| favela que é bairro sozinha | 104 de 118 | 103 de 118 |
| células do bairro no gomo da zona dele | 91,2% | 91,3% |
| bairros de quadra: cv e maior ÷ menor | 0,16 e 1,8× | 0,17 e 1,8× |
| bar fora do bairro do jogo | 13 de 139 | 13 de 139 |
| sede fora do gomo ou do bairro | 0 | 0 |
| triângulos na cena (Fortaleza; Rio) | 1.485.083; 1.544.378 | 1.494.232; 1.555.814 |

**O dia de jogo** nas 30 praças: nenhum erro, o clássico de cada praça
igual, os 88 bondes inteiros na rua (6.595 pessoas) e a hora de chegada
igual nos 88; três rotas mudaram poucos metros (de −14 a +25 m: no ABC,
em BH e em Goiânia). **O mapa de outra praça** no jogo 3D (São Paulo e
Belém; o Interior de PE e o de SP, que montam duas vezes): a planta da
cidade 3D sai idêntica antes e depois.

### Limites (sinceros)

- **Três praças sem torre nenhuma**: o Interior de PE e o de SP (o único
  bairro Nobre é a favela; guardado, ele ficava só com o estádio — e
  também não há casarão) e o Interior do PR (a Foz do Iguaçu não tem
  quadra de casa livre: é o estádio, dois terrenos de sede, a quadra do
  bar, a delegacia e uma quadra de outro uso).
- **Seis com menos torres que o gerador punha**: Mato Grosso 1 de 3,
  Interior de Minas 1 de 3, Interior do RS 1 de 3, Maranhão 2 de 7,
  Paraíba 4 de 7 e São Paulo 3 de 9 (o Morumbi tem poucas quadras
  livres; a Vila Maria, o outro Nobre, é a favela). As torres que faltam
  não vão pra outro lugar: o pedido é torre só no Nobre.
- **Quatro bairros Nobres sem torre**: o Santo Agostinho (BH), a
  Beira-Mar Norte (Litoral Catarinense) e o São Vicente (Santos) ficaram
  só com o estádio e o entorno (a regra do estádio não deu conta da zona
  deles), e a Foz do Iguaçu (acima).
- **A torre nova é sempre o mesmo prédio**, em quatro cores e quatro
  alturas: de longe, as torres de um bairro se parecem.
- **A torre toma a quadra comum inteira**: somem de 8 a 10 casas por
  torre. E o condomínio que virou casa deixa um quintal grande e vazio no
  meio da quadra alta.
- **O casarão é a única casa só do Nobre**: o sobrado de tijolo à vista
  (T2) e as casas de muro continuam em todo bairro, o Nobre também.
- **A rua das casas de veraneio** (as casas com piscina das pontas do
  mapa) fica fora dos bairros e não mudou.

## 34. As praças compostas cortadas em cidades (01/10/2026)

> **Trocado no mesmo dia pelo §35**: o corte do mapa do porte em cidades
> deu lugar às cidades desenhadas do zero, um bloco de 3 × 2 quadras por
> bairro. O que segue é o registro do corte; continuam valendo os dados
> (a cidade de cada bairro, as sedes e os estádios na cidade deles), a
> torcida por bairro, a estrada com o pórtico e a placa, e o dia de jogo
> entre as cidades.

**O pedido** (o dono, caso a caso — o texto inteiro está na conversa):
"Deixe as cidades com a metade da proximidade proposta, pra dar uma
impressão maior de conurbação. [...] Agora as sedes das torcidas e os
estádios tem que ficar obrigatoriamente na sua cidade."

Os dados (a cidade de cada bairro, os bairros que mudam, as sedes e os
estádios na cidade do clube) e a torcida por bairro entraram antes, no
commit "Cidades das praças compostas e a torcida por bairro"
(`dados/fonte/cidades_bairros.json`, `js/mundo/dominio.js`). Esta parte é
o mapa: o gerador (`ferramentas/planta_html/proposta.js`), a planta
(`index.html`) e o cenário 3D (`cenario.js`).

### O gerador: cortar, afastar e ligar

- **`CISOES`**: as 18 praças que viram mais de uma cidade, cada uma com a
  cidade do meio (a de hoje, a do jogo) e as ligações — a cidade, de
  qual outra ela sai, o rumo (n, ne, l, se…), os km da placa e o jeito
  (`longe`, `costa`, `baia`). Goiânia fica inteira (o pedido: "mantenha
  da forma que está"). `cisaoDaPraca` monta isso com os bairros dos dados.
- **A vaga do estádio**: o estádio de cada cidade de fora vai pra vaga do
  lado dela; os do centro, pras que sobram, longe das de fora.
- **O corte** (`cortarEmCidades`): as quadras, as favelas e as vagas são
  repartidas entre as cidades pela proporção dos bairros de cada uma; a
  cidade de fora cresce a partir do estádio dela (ou da ponta do lado
  dela), e a que tem bairro de favela prefere levar uma favela. As áreas
  saem a poucos por cento do alvo em todas as praças.
- **O afastamento** (`afastarCidades`): cada cidade de fora anda pro rumo
  dela até ficar a **50 m** (`VAO_CIDADES_M`, a metade dos 80 a 120 m da
  proposta) da cidade de onde ela sai; a `longe` (Imperatriz, Campos dos
  Goytacazes) a 100 m; Niterói, do outro lado da baía, a 150 m. O que era
  da cidade de hoje onde a quadra foi embora — a rua, o poste, a árvore, o
  carro, o equipamento, o marco, o campo — some do mapa.
- **As estradas**: uma reta (ou em L) da rua de uma cidade à da outra,
  sem encostar em nada; a cidade que a avenida de entrada ou a da beira já
  alcança (Marabá, Balneário Camboriú, Parnaíba) usa a avenida. Na ponta
  de cada cidade, o **pórtico** com o nome dela ("BEM-VINDO A FEIRA DE
  SANTANA"; "AO RIO DE JANEIRO") e, do lado direito de quem sai, a
  **placa verde** com a outra cidade e os km.
- **A baía** (Subúrbio Carioca): a água do mar entre o Rio e Niterói, e a
  estrada vira **ponte** — o tabuleiro de concreto por cima da água, com a
  mureta dos dois lados.
- **A ponta da estrada no chão da cidade**: a ponta sai da caixa da rua
  da cidade; no centro, a quadra recortada pela costa e a avenida da beira
  (torta) têm a caixa maior que elas, e entre a ponta e a rua sobravam 6 a
  15 m de mato — no 3D ninguém passava, e Rondonópolis, Bragança Paulista,
  Niterói e Campos ficavam soltas do resto da praça. Agora a ponta entra
  até encostar no chão de verdade da cidade (`encostar`).
- **A rua de veraneio** volta pra beira da cidade dela, no lado livre —
  nunca por cima de avenida (em Ponta Grossa ela caía atravessada na
  avenida de entrada, e a grade da avenida partia a rua ao meio) —, e o
  mundo da praça cresce até ela (antes ele era medido sem ela, e o cenário
  3D cortava a rua de veraneio fora da área dele).
- **A favela solta** — a que, cortada a praça, não tem beco que chegue
  numa rua da cidade dela (a quadra vizinha foi pra outra cidade, ou virou
  baía) — ganha um beco até a rua mais perto, a continuação de um beco
  dela, reto ou com uma dobra, sem passar por quadra, casa, outra favela
  nem água. São 8: a do noroeste do mapa pequeno, que o corte deixa numa
  cidade de fora em seis interiores (Erechim, Criciúma, Maringá,
  Maranguape, São João del-Rei, Santa Cruz do Capibaribe), e a do norte
  do Rio (ilhada entre o mato e a baía) e de Campinas.

### A planta: os bairros, as sedes e os estádios na cidade deles

- **A cidade é a zona**: o bairro de outra cidade tem a cidade como zona
  (`'C:Feira de Santana'`), e as quadras, a favela, o estádio e os
  terrenos de sede de lá também. Os bairros de uma cidade repartem só o
  chão dela, do mesmo tamanho, pelas mesmas regras de antes (a favela
  sozinha, a sede dentro, o estádio inteiro).
- **O centro sem as quatro zonas**: cortada a praça, o centro pode ficar
  sem bairro numa zona (João Pessoa só tem Norte e Leste; Caxias do Sul,
  só Leste). Aí os gomos são só das zonas que ele tem: cada ponto vai pra
  zona presente de ponto cardeal mais perto, com um peso por zona (até
  35°) que iguala o tamanho dos bairros (`gomosComPeso`).
- **A sede só fica na cidade dela** (a do bairro dela nos dados): cada
  cidade tem os terrenos dela — os do gerador e as reservas —, e a torcida
  da cidade sem terreno que sobre fica sem sede (a mais fraca primeiro).
  A reserva agora também sai da quadra estreita e comprida (a ponta de
  cima ou a de baixo, de frente pro oeste ou pro leste): em Erechim só
  havia quadra assim, e a Mancha do Ypiranga ficava sem sede.
- **O estádio no bairro dele**: na cidade de fora com mais de um bairro
  (Mossoró, Campina Grande, Teresina…) o estádio fica no bairro que os
  dados dizem; e o Jonas Duarte fica no bairro Anápolis, na Goiânia
  inteira (`ESTADIO_NO_BAIRRO`), junto com a sede da Independente.
- **No desenho**: o nome de cada cidade, grande, em cima do miolo dela;
  "Estrada pra Salvador" no pórtico; a estrada, a ponte, a mureta, a baía
  e a placa; a ficha do pórtico diz a cidade dele, e a ficha da praça diz
  as cidades, os bairros, o rumo e os km.

### O cenário 3D

- **A baía é água**: o boneco não entra nela (`api.lagoa()` devolve a
  baía), e o tabuleiro da ponte se pisa; a **mureta** (1,05 m) segura ele
  dos lados. A água entra inteira na área do cenário.
- **A placa verde** em pé, nos dois postes, com o painel de frente pra
  quem sai da cidade; o pórtico com o nome da cidade dele.
- **O alcance**: o lugar onde o boneco nasce e por onde o dia de jogo
  anda era o que se chega da borda da área; no Subúrbio a borda virou mato
  e baía, e a cidade inteira ficava fora. Agora o meio de cada estrada
  entre as cidades também é ponto de partida (`semear`).
- **A grade de proteção** não fecha o beco que liga a favela solta à rua.
- **O mato da costa não cobre a rua da cidade de fora**: na praça sem
  praia, a zona da costa de hoje é pintada de mato, menos dentro da caixa
  de cada cidade de fora. As caixas iam todas num recorte só (par-ímpar),
  e onde duas se cruzavam o mato voltava: no Interior de PE a caixa de
  Caruaru cruza a de Santa Cruz do Capibaribe, e a rua que liga as quadras
  de Santa Cruz virou mato — no 3D o boneco não passava, e a estrada de
  Caruaru dava num pedaço de Santa Cruz solto do resto. Agora é um recorte
  por caixa, um em cima do outro (a máscara do mato do cenário sai do
  mesmo desenho). As caixas se cruzam em mais três praças (Interior de SP,
  Maranhão, Sergipe), longe da zona da costa.

### Medido

| | |
|---|---|
| praças cortadas | 18 (Goiânia inteira) |
| cidades | 73 |
| trechos de estrada | 52 (Belém–Marabá e Florianópolis–Balneário Camboriú pela avenida) |
| pórticos de cidade | 106 |
| placas de km | 98 |
| favelas com beco de ligação | 8 |
| avisos do gerador ("sem estrada", "sem rua") | 0 |
| células de bairro fora da cidade dele | 0 |
| sedes fora da cidade do bairro delas | 0 |
| estádios fora da cidade (ou do bairro) dos dados | 0 |
| sedes nas 30 praças (antes; agora) | 139; 139 — as mesmas em cada praça |
| portas de sede e de bar e pórticos alcançáveis andando (18 praças cortadas, mais São Paulo e Manaus) | todas |
| as cidades ligadas a pé: sedes, bares, pórticos, rua de veraneio e estádios num pedaço só de chão andável (18 praças cortadas, mais Fortaleza e Goiânia) | todas (antes das correções: 3 praças em dois pedaços, e 8 ruas de veraneio fora) |
| montar a praça na planta (as cortadas) | de 0,25 a 1,6 s (antes de 0,04 a 0,7 s) |

**O boneco a pé** atravessa a ponte do Subúrbio de ponta a ponta (de um
lado ao outro da baía), e a mureta segura ele dos lados. **Os bairros**:
o teste das 30 praças (nenhum bairro vazio, toda sede no bairro dos dados,
todo bar com bairro) passa em todas.

### O dia de jogo

- **A torcida de outra cidade da praça anda pela estrada**: a sede fica na
  cidade dela e o estádio na do clube, e o bonde sai da sede, pega a
  estrada e entra na cidade do estádio pelo pórtico. Central × Salgueiro:
  a TJSALG anda 556 m de Salgueiro ao Lacerdão, em Caruaru, passando por
  Santa Cruz do Capibaribe. A rota mais comprida é a da torcida do Guarany
  de Sobral até o Romeirão, em Juazeiro do Norte: 1.141 m. Quem mora
  longe só sai mais cedo — o último bonde chega às 15:27 (antes, 15:29).
- **O corredor que abre vale pra quem vem de longe**: a PM traça primeiro
  o corredor do visitante; a torcida do mandante cujo caminho só chega no
  portão cruzando esse corredor espera ele abrir. Antes, só a do portão
  "ilhado" (o corredor passando na frente dele) esperava; a outra ficava
  sem rota e o bonde sumia. Joinville × Criciúma, no Heriberto Hülse: a
  estrada de Joinville entra em Criciúma na rua do corredor do visitante;
  a PM abre às 15:12 e a UT chega às 15:20. O painel diz "o caminho até o
  portão 1 cruza o corredor do visitante".
- **Os dois bondes que tinham sumido** na primeira rodada depois do corte
  (a TJSALG e a UT) eram estes dois casos — a rua partida de Santa Cruz do
  Capibaribe e o corredor.

| dia de jogo, 20 praças (as 18 cortadas, Goiânia e Fortaleza) | antes do corte | depois |
|---|---|---|
| jogos montados (o mesmo clássico em cada praça) | 20 | 20 |
| bondes | 54 | 54 (os mesmos) |
| bonecos na rua | 3.205 | 3.205 |
| bonde sem rota ou erro no plano | 0 | 0 |
| rota de cada bonde (mediana da diferença) | — | −5 m (de −296 a +793 m) |
| o último bonde chega | 15:29 | 15:27 |

### Limites (sinceros)

- **As cidades são pedaços da mesma grade**: a cidade de fora é feita das
  quadras e da favela que o corte deu a ela, no desenho da cidade de hoje
  — não tem centro, igreja nem praça dela, e algumas saem compridas e
  estreitas (Erechim é uma faixa de duas quadras; o Rio, sem o leste que
  virou baía, fica com uma tira ao longo da avenida).
- **A distância é de brinquedo**: 50 m de mato entre Salvador e Feira de
  Santana; a placa diz os km, que são **aproximados** (a linha reta com um
  quinto a mais, não a estrada de verdade). Imperatriz e Campos, "longe",
  ficam só a 100 m.
- **Belém–Marabá e Florianópolis–Balneário Camboriú** se ligam pela
  avenida de entrada ou pela da beira: têm pórtico, mas não têm placa de km.
- **A baía é um polígono simples**: a margem segue o contorno das
  quadras, em degraus, e ela é bem maior que o necessário (vai até a borda
  do mapa). A ponte é a estrada pintada por cima da água, rente ao chão,
  sem pilar; a grade de proteção da estrada também corre por cima dela.
- **O centro sem as quatro zonas** fica com os gomos das zonas que ele
  tem; os nomes das zonas ("ZONA NORTE"…) só aparecem pro centro — a
  cidade de fora não tem zona no mapa. No Subúrbio Carioca, Nova Iguaçu
  (Zona Norte) fica no norte do mapa, mas o meio dela cai no gomo vizinho
  (o único "fora do gomo" das 30 praças).
- **A sede na reserva estreita** (a quadra comprida de Erechim) tem 9,8 m
  de fundo: cabe a sede do nível 1 (a Mancha do Ypiranga é nível 1); uma
  sede maior ali sairia apertada.
- **O beco de ligação** da favela solta é um beco reto no mato, com a
  grade dos dois lados: resolve o caminho, mas não é bonito.
- **A montagem da praça cortada é mais lenta** na planta (até 1,6 s no
  Litoral Catarinense, antes 0,3 s): o corte, o afastamento e os bairros
  por cidade.
- **Ninguém vai de ônibus dentro da praça**: a torcida cuja sede fica numa
  cidade e o estádio do jogo noutra vai a pé pela estrada (a do Guarany
  anda 1.141 m de Sobral ao Romeirão; a UT, 892 m de Joinville ao
  Heriberto Hülse). Com 50 m de mato entre as cidades — a conurbação do
  pedido — passa; se elas se afastarem, o certo é a torcida descer do
  ônibus no pórtico da cidade do estádio, como a caravana de fora.
- **Quem domina o quê** nas praças compostas: o dono respondeu ("O domínio
  vai continuar sendo por praça inteira e as cidades se comportam como
  bairros") — a dona da praça é quem é dona de mais bairros, somados os de
  todas as cidades dela.

## 35. As cidades desenhadas do zero: um bloco de 3 × 2 quadras por bairro (01/10/2026)

**O pedido** (o dono): "percebo que a sua dificuldade é de encaixar os
quarteirões pra ficar a mesma quantidade do mapa cheio. acredito que o
melhor é redesenhar por cidade o mapa, considerando a sua quantidade de
bairros, sem se importar com o modelo antigo pra essas cidades. se o
bairro é favela, é uma favela. se é classe baixa ou média, é quarteirão
normal, se é classe alta, vai ter casarão e prédios altos. o formato das
cidades pode ser quadrado se for mais fácil, e o importante é que as
cidades não sejam tão distantes umas das outras pra não ficar demorada a
gameplay. uma cidade que é só um bairro pode ter um padrão pra todas as
praças, uma cidade com dois bairros também, e assim vai copiando de uma
pra outra. essas praças com mais de 2 cidades não vão ter mais zonas pra
facilitar a criação do design do mapa." Nas duas perguntas que voltaram:
"Grande fica, pequena vira modelo" (a praça de duas cidades) e "3x2, mas
um bairro com estádio é 3x2+estádio. A favela também tem área parecida
com bairro 3x2 (115x42, não precisa ser exato)".

E a decisão que estava pendente desde a §34: "O domínio vai continuar
sendo por praça inteira e as cidades se comportam como bairros".

### O gerador: as cidades-modelo

O bloco AS CIDADES-MODELO de `ferramentas/planta_html/proposta.js`.

- **Dois jeitos** (`cisaoDaPraca` devolve o `modelo`): na praça de **três
  cidades ou mais** (`'todas'`, 13 praças) o mapa do porte e a cidade de
  hoje não entram — cada cidade é desenhada do zero, numa grade só dela, no
  passo da cidade de hoje (a quadra de 35,6 × 17,8 m, a rua de 6,1 m). Na
  de **duas** (`'pequenas'`: Belém, Mato Grosso, Litoral Catarinense, Rio
  Grande do Norte e Bahia), a grande fica com o mapa do porte inteiro — as
  zonas, a praia, a avenida — e só a pequena é desenhada.
- **Cada bairro é um bloco de 3 × 2 quadras** (uns 119 × 42 m com as ruas
  de dentro). O de classe Favela é uma favela do tamanho do bloco (as ruas
  de dentro viram viela, como na favela de sempre); o Nobre é de quadras, e
  a planta põe nele as torres e os casarões (§33); Baixa e Média, quarteirão
  comum.
- **A cidade é uma grade de blocos quase quadrada** (`arranjoModelo`): uma
  coluna até 4 bairros, duas a partir de 5 — 1 bairro, 1 × 1; 2, 1 × 2;
  3, 1 × 3; 5 e 6, 2 × 3; 7 e 8, 2 × 4; 9 e 10, 2 × 5. A mesma quantidade de
  bairros dá o mesmo desenho em qualquer praça. Nas 18 praças: 35 cidades
  de 1 bairro, 23 de 2, 4 de 3 (Teresina, Campina Grande, Mossoró,
  Niterói), 2 de 6 (João Pessoa e o Rio), 1 de 7 (São Luís), 2 de 9 (Maceió
  e Aracaju) e 1 de 10 (Campinas).
- **De que lado fica o quê**: a cidade dá as costas pras vizinhas; o
  bairro do estádio pega o bloco mais pra fora, depois a favela, depois os
  de classe Baixa e Média; o Nobre fica do lado das vizinhas, onde chega a
  estrada.
- **O estádio** sai do lado de fora do bloco do bairro dele, na borda da
  cidade — na ponta do bloco antes do lado comprido: com o estádio no lado
  comprido o bairro inteiro ficava a menos de 50 m dele, sem sede e sem bar.
- **O terreno de sede**: um por sede do bairro, na quadra dele mais longe
  dos estádios; na favela com sede, a quina dela mais longe dos estádios é
  quadra comum, com o terreno. **O bar**: uma esquina em cada bairro de
  quadras (a favela tem o boteco).
- **A cidade só de favela** (Santa Cruz do Capibaribe, Ipatinga, Teófilo
  Otoni, Palmeira dos Índios) ganha, no lado de cada vizinha, a quina da
  favela como quadra comum: a entrada da cidade, onde a estrada chega.
- **Toda favela chega na rua**: em São Luís a Cidade Operária ficou na
  quina da cidade, com o mato em volta e a outra favela embaixo — a viela
  dela não chegava em rua nenhuma, e o boneco não entrava nos dois bares
  dela. A rua da cidade-modelo é a faixa em volta de cada quadra (a de uma
  encosta na da vizinha, até na diagonal), e a favela anda pela viela até a
  rua que passa num lado dela; a que não chega no resto da cidade ganha a
  quina mais perto dele como quadra comum, do bairro dela (a entrada da
  favela). Só a Cidade Operária precisou.
- **O lugar de cada cidade**: a 50 m da vizinha, todas (a que era "longe" —
  Imperatriz, Campos dos Goytacazes — também). A cidade anda da vizinha no
  rumo dela até ficar livre, e tenta também 45° e 90° pra cada lado; fica no
  que dá a **estrada mais curta**, contada de rua a rua (reta quando as duas
  ruas se olham, em L quando não), com 17 m de castigo a cada 45° de desvio.
  Contar só a distância até a vizinha enganava: no Mato Grosso, Rondonópolis
  ficava a 50 m da quina cortada de Cuiabá, onde não tem rua, e a estrada
  subia 191 m ao lado dela; agora ela fica ao sul, na ponta da avenida de
  entrada, e a estrada é a própria avenida. No Maranhão, Parnaíba fica a
  56 m de São Luís, a oeste, em vez de 130 m ao sul.
- **A estrada em L entra na conta mesmo com a reta** (nas cidades-modelo,
  com 600 a mais, uns 31 m): a reta às vezes corria ao lado da cidade até
  achar rua.
- **O corte saiu do código**: com todas as praças compostas desenhadas
  assim, ninguém mais usava o corte da §34 (`cortarEmCidades` e a escolha
  das vagas por ele, umas 240 linhas). Antes de tirar, o gerador foi rodado
  nas 30 praças com e sem ele: a mesma saída.

### A planta, o cenário e o jogo sem zonas

- **O bairro da cidade-modelo é a zona dele** (`'B:cidade|bairro'`): as
  unidades dele já vêm com o bairro (o gerador diz), a praça toda de modelo
  não tem gomo (`pracaToda`), e cada bairro fica com o bloco dele inteiro. A
  sede que o jogo põe num bairro sem terreno vai pra reserva do bairro dela,
  e a reserva custa um pouco mais que o terreno (em Pelotas a planta
  escolhia a reserva por estar mais longe da rival, e o terreno ficava
  vago).
- **A cor do bairro** na planta, sem zona, é a da cidade (na ordem das
  cidades da praça).
- **Nada da cidade de hoje aparece** na praça de três cidades ou mais: a
  avenida, as trilhas, a praia, a lagoa, a baía, a caixa do mundo antigo; o
  mundo é só as cidades e as estradas.
- **O bar inteiro é do bairro dele**: a célula de 4 m da grade dos bairros
  que o lote do bar toca e ninguém rotulou fica com o bairro do meio do
  lote (em Belém a frente do boteco da favela do sul caía numa célula sem
  bairro, na viela).
- **No jogo** (`js/mundo/dominio.js`): na praça de três cidades ou mais
  (`semZonas`), a zona do bairro é a cidade dele — na régua (a sede
  espalhada, o peso da torcida, o bairro padrão) e na tela (Ações,
  Patrimônio, Financeiro e o mapa do Brasil mostram a cidade onde
  mostravam "Zona Norte"). A dona continua contada pela praça inteira.

### Medido

| | o corte (§34) | agora |
|---|---|---|
| praças compostas | 18 | 18 (13 todas desenhadas, 5 com a pequena desenhada) |
| cidades | 73 | 73 (68 desenhadas do zero) |
| quadras das cidades desenhadas | — | 699 |
| favelas de bairro de favela | — | 26, mais 15 quinas de favela que viraram quadra (terreno de sede ou entrada) |
| estádios em cidade desenhada | — | 31 |
| estrada entre as cidades, somada | 5.316 m | 2.927 m |
| maior trecho de estrada | 328 m (Interior de SP) | 62 m (Alagoas) |
| área do mundo das 18 praças | 10,7 km² | 6,5 km² |
| avisos do gerador ("sem lugar", "sem estrada", "sem rua") | 0 | 0 |
| as 12 praças de uma cidade só | — | o mesmo mapa do gerador de antes, objeto por objeto |
| andando a pé (18 praças): portas de sede e de bar, pórticos, estádios, cada favela pela viela e cada quadra-modelo pela calçada, num pedaço só de chão | portas: todas | tudo |
| bairros (30 praças): vazio, sede fora do bairro dos dados, bar sem bairro | 0 | 0 |
| gerar a praça (só o gerador) | — | de 39 ms (Paraíba) a 0,6 s (Belém) |
| montar a praça na planta (com outros testes rodando junto) | de 0,25 a 1,6 s | de 0,3 a 2,1 s (as de duas cidades são as mais lentas: o mapa do porte inteiro e mais a cidade desenhada) |

| dia de jogo, 20 praças (as 18 compostas, Goiânia e Fortaleza) | o corte (§34) | agora |
|---|---|---|
| jogos montados (o mesmo clássico em cada praça) | 20 | 20 |
| bondes | 54 | 54 (os mesmos) |
| bonecos na rua | 3.205 | 3.205 |
| bonde sem rota ou erro no plano | 0 | 0 |
| a rota mais comprida | 1.141 m (a do Guarany, de Sobral ao Romeirão) | 870 m (a mesma) |
| o último bonde chega | 15:27 | 15:28 |

(Belém, Mato Grosso e Litoral Catarinense se ligam pela avenida de entrada
ou pela da beira, que não entram na conta da estrada: Rondonópolis fica
uns 60 m de avenida depois do pórtico sul de Cuiabá.)

### Limites (sinceros)

- **As cidades são quadradinhas e iguais entre si**: a cidade de um bairro
  é sempre o mesmo bloco de seis quadras, sem centro, igreja nem praça
  dela, e a do mesmo número de bairros tem o mesmo desenho em toda praça (o
  pedido). O que muda é a casa, a cor, a torre, a favela e o estádio.
- **Sem praia, baía nem lagoa na praça de três cidades ou mais**: Maceió,
  Aracaju, João Pessoa e São Luís perdem a praia (e com ela o quiosque e a
  casa de praia), e Niterói chega no Rio por estrada, sem a baía e sem a
  ponte. Foi escolha minha pra o pedido andar; dá pra devolver a costa na
  borda da cidade que tem praia.
- **A geografia cede pra estrada ficar curta**: a cidade vai até 90° fora
  do rumo de verdade — Parnaíba fica a oeste de São Luís; Rondonópolis, ao
  sul de Cuiabá. A placa continua com os km aproximados de verdade.
- **Sem zonas no jogo nessas 13 praças**: o que dependia da zona agora
  depende da cidade. A praça de duas cidades continua com as zonas (na
  cidade pequena, cada bairro fica no bloco dele).
- **A entrada da favela** é uma quadra de casas na quina dela; na Cidade
  Operária, o supermercado de São Luís caiu nela.
- **Cidade de muitos bairros fica comprida**: Campinas, com 10, é uma grade
  de 2 × 5 blocos (60 quadras, uns 245 × 235 m) — quase quadrada, mas a
  maior das 68.

## 36. O bairro 3 × 3, a praia de volta, os rios, as entradas da praça e a rua de acesso do estádio (01/10/2026)

**Os pedidos** (o dono): "adicione mais 3 quarteirões pra ficar 3x3 com três
quarteirões sendo praças, igreja, delegacia, hospital ou escola. Preciso que
as cidades às margens da praia voltem a ser às margens da praia, e que a
decoração de vegetação das demais seja mais bem feita com rios entre uma
cidade e outra. Preciso que volte a existir a entrada da praça em norte e
sul, pra dar a impressão de entrada na praça nas caravanas." E, no meio da
rodada, com um print do mapa: "percebo que a rua a sul do estádio localizado
na parte superior da imagem é mais larga que as demais e esse problema tem
em todos os mapas, que acaba sobrepondo a rua por cima de outras ruas e
calçadas, e pra piorar ainda fica feio visualmente".

### O bairro de 3 × 3 quadras

O bloco de cada bairro das cidades-modelo (`ferramentas/planta_html/proposta.js`,
AS CIDADES-MODELO) passa de 3 × 2 pra 3 × 3 quadras (uns 119 × 66 m com as
ruas de dentro). **A fileira do meio é de três equipamentos**; as outras
duas são o bairro de antes (as casas; no Nobre, as torres e os casarões; a
favela, nas duas fileiras dela).

- **Na favela, a fileira dos equipamentos é a de dentro** (a do lado do meio
  da cidade): ela dá a rua pra favela.
- **Os cinco tipos andam em roda pela cidade** — praça, escola, igreja,
  delegacia, hospital —: o bairro seguinte continua de onde o anterior
  parou, então cada bairro tem três diferentes e a cidade de dois bairros já
  tem os cinco.
- **A frente olha pro meio da cidade**: a fileira de cima do bloco olha pro
  norte, a de baixo pro sul, a do meio pro lado do centro; a igreja, que tem
  a nave comprida, olha pro leste ou pro oeste.
- **Os nomes andam em roda pela praça**: 1º, 2º, 3º Distrito Policial; a
  paróquia de cada santo (São José, Nossa Senhora Aparecida, Santo Antônio...);
  a escola estadual de cada patrono (Rui Barbosa, Castro Alves, Monteiro
  Lobato...); a praça (da Matriz, da Bandeira, Tiradentes...); o hospital
  (Municipal, São Lucas, Santa Casa...).
- **O modelo 3D**: a praça é a Praça da Vila (o calçadão em onda, o
  chafariz, o parquinho, a academia, a banca), a igreja é a de bairro do
  norte, a delegacia é o 2º DP (com o número do distrito na marquise). **A
  escola e o hospital são modelos novos** (`js/diajogo/equip3d.js`,
  `montarEscola` e `montarHospital`), feitos pra quadra comum (o miolo de
  30,6 × 12,9 m), com a roupa dos equipamentos antigos do bairro (a folha das
  casas):
  - **a escola estadual**: o bloco de dois andares de salas no fundo, com os
    pilares de concreto marcando os vãos, a fita de vitrô de ferro, o barrado
    azul e o cobogó da escada; a quadra coberta do lado, de piso verde, com a
    cobertura de zinco em arco e as duas tabelas; o pátio na frente, com as
    árvores, o mastro com a bandeira e a passarela coberta do portão até a
    porta; o muro de barrado com o gradil em cima. Uns 4.100 triângulos.
  - **o hospital**: a lâmina de três andares (o térreo de recepção e dois de
    módulo de janela) com a faixa lisa de cima, a cruz vermelha e o nome; o
    pronto-socorro com a marquise de testeira vermelha e a ambulância
    embaixo; o estacionamento do lado, com os carros e outra ambulância; a
    mureta com o gradil branco na frente. Uns 4.000 triângulos (a delegacia
    tem 6.200, a praça 8.200).
- **A delegacia vale pro assalto**: a polícia sai da delegacia mais perto
  (`delegacias()` já pegava todas).
- **Quantos**: 420 quarteirões de equipamento nas 18 praças compostas — 83
  praças, 86 escolas, 87 igrejas, 87 delegacias, 77 hospitais (3 por bairro,
  140 bairros).

### A praia de volta

Na praça de três cidades ou mais, **a cidade do centro das praças de praia
(Maceió, Aracaju, João Pessoa e São Luís) e a da costa (Parnaíba) voltam pra
beira-mar**: a cidade nasce no trecho reto do sul da costa do mapa do porte,
com o lado leste encostado na guia da avenida da beira; a frente dela é o mar
(o bairro Nobre fica na beira, a favela e o estádio pro lado de dentro, e o
estádio nunca no lado da praia). A avenida da beira corre ao longo delas, e
a praia, a areia, o quiosque e a casa de praia voltam (`temPraia()`).

### Os rios entre as cidades

Na praça de cidades-modelo (as 13 de três cidades ou mais e as de duas
cidades), **cada estrada que liga duas cidades passa numa ponte por cima de
um rio**:

- **O traçado** (o passo 8b' da cisão): o rio cruza a estrada no meio dela,
  de través, e corre pelo vão entre as cidades até a borda do mundo ou até
  encontrar outro rio, que ele vira afluente. É o caminho mais barato numa
  grade de 4 m: a 8 m das cidades no mínimo e de preferência no meio do vão
  (o custo cresce perto delas); estrada, ele só atravessa de través, longe
  das pontas e a 8 m do pórtico e da placa (que ficam em terra); a metade de
  lá não volta pela estrada dela; e nunca pro lado da praia. **A metade sem
  saída** (presa entre a cidade da praia e o mar, por exemplo) **nasce numa
  lagoa** no lugar mais aberto aonde ela chega.
- **O desenho**: a linha da grade vira curva (Chaikin), o rio tem 6,5 m de
  água (o primeiro da praça, 7,5 m) e, em volta, o barro da linha d'água e a
  margem de capim. Na ponta da borda ele segue 1,5 km reto pra fora — na
  planta e no chão de longe do cenário (a faixa d'água com a margem, por
  cima do mato de longe): o rio não acaba na beira do chão pintado.
- **A ponte**: o tabuleiro de concreto 1,3 m mais largo que a pista de cada
  lado, da água mais 4 m pra cada ponta, com a mureta (a da baía); a grade
  de proteção da estrada não passa por cima do tabuleiro (lá a mureta
  segura).
- **No cenário 3D** a água é chão pintado, como a lagoa e a baía: a grade de
  andar marca o contorno de cada rio como água (`lagoa().aguas`) e o
  tabuleiro como chão (`pisa`); o boneco atravessa a ponte e não entra no
  rio. A água não é mato: a árvore do mato não nasce nela, e a da beira fica
  de mata ciliar.
- **Quantos**: 52 rios com 52 pontes (todas as ligações por estrada das 16
  praças de cidades-modelo), uns 20,7 km de rio dentro das áreas, 6 nascendo
  em lagoa.

### A vegetação: as clareiras

No mato largo de cada praça de cidades-modelo, **sete clareiras de pasto**
(de 18 a 30 m de raio), longe das cidades, das ruas, dos rios e da beira do
mundo, cada uma num lugar sorteado entre os mais abertos (não saem em fila):
o capim aberto com a beira mais verde e, em uma de cada duas, a lagoinha. No
3D a árvore do mato fica em volta (a clareira não é mato) e, dentro, uma
árvore solta aqui e outra ali. 126 clareiras, 72 com lagoinha.

### As entradas norte e sul da praça

Na praça toda de modelo não tinha a avenida de entrada, e a caravana descia
no pórtico de uma estrada entre duas cidades. **Agora a praça tem a entrada
norte e a sul**: uma rua reta que vem da borda do mundo e chega na rua de uma
cidade da ponta de cima (e de baixo), com o pórtico de BEM-VINDO. A rua é uma
das de norte a sul da grade da cidade, a que segue reta pra fora sem passar
por nada; entre elas, a mais curta, a mais pro meio da praça e a mais longe
dos estádios. **A caravana desce nela** (`entradas()` dá só a norte e a sul
quando elas existem): "A caravana desce na entrada norte". As 26 entradas
das 13 praças ficam a 112 m ou mais de um estádio.

### A rua de acesso do estádio

**A rua de acesso do portão 1 era de duas pistas** (12 m, o dobro da rua) e
com a ponta redonda: num vão de rua de 6 m ela passava 6 m por cima da
calçada e do lote das quadras dos dois lados, e a ponta entrava 6 m na quadra
do outro lado da rua e no próprio terreno do estádio. Medido nas 30 praças:
43 das 90 ruas de acesso pintavam asfalto por cima de alguma quadra.

- **Agora o acesso tem a largura da rua** (6,1 m), acaba no meio da rua que
  ele encontra e é pintado de ponta reta.
- **A rua de veraneio**: o terreno dela, que não tem rua em volta, às vezes
  encosta na rua da cidade; a conta do acesso supunha a rua em volta, e a
  ponta caía meia rua dentro da quadra do outro lado (Fortaleza, Recife, o
  Rio). Agora o fim é o meio da rua encontrada (`reta().fim`).
- **A faixa de calçada da avenida não é pintada no acesso**: ela pintava a
  calçada por cima da outra metade da rua aonde o acesso chega; a calçada é
  a das quadras.
- **Medido de novo**: 0 das 90. Nas 12 praças de uma cidade só, o mapa muda
  só por isso: com o conserto do acesso desligado, as 12 saem iguais às de
  antes, objeto por objeto (o entorno do estádio e a favela vizinha se
  acomodam no espaço que a rua larga ocupava).

### Medido

| | §35 | agora |
|---|---|---|
| quarteirões das cidades-modelo | 699 (3 × 2 por bairro) | 1.112 (3 × 3), 420 de equipamento |
| praças de cidades-modelo com praia | 0 | 4 (+ Parnaíba, a da costa) |
| rios / pontes | 0 / 0 | 52 / 52 |
| clareiras (com lagoinha) | 0 | 126 (72) |
| entradas da praça (norte e sul) nas 13 praças de três cidades ou mais | 0 | 26 |
| ruas de acesso por cima de quadra (30 praças) | 43 de 90 | 0 de 90 |
| avisos do gerador | 0 | 0 |
| gerar a praça (só o gerador, média / a mais lenta, as 30) | 0,15 s / 0,36 s (Bahia) | 0,19 s / 0,47 s |
| trocar de praça na planta (o gerador, o desenho e os bairros), Interior de SP | 1,1 s | 1,0 s |

**O custo dos rios**: o tamanho da ponte se mede andando pela estrada de
40 em 40 cm e perguntando se o ponto está no rio — e a linha de cada rio,
depois de alisada, tem até 1.900 pontos. Medindo a linha toda a cada
pergunta, o Interior de SP (8 rios) gerava em 1,1 s, e a troca de praça
na planta passava de 2 s. A pergunta agora vai por pedaços de 16
segmentos com a caixa de cada um (`pertoDaLinha`): só se mede o pedaço
cuja caixa chega perto do ponto. A resposta é a mesma — as 30 praças
saem iguais, objeto por objeto, com a conta velha e a nova.

**A pé, no cenário** (a grade de andar do boneco, nas 18 praças compostas):
as sedes, os bares, os pórticos, as 45 favelas (pelas vielas) e as 1.113
quadras das cidades-modelo (pela calçada) ficam todos no mesmo pedaço
andável — o rio não corta caminho (a ponte se pisa) e nenhuma quadra de
equipamento fica presa. Nenhum erro na página.

**A caravana de fora** (sem aliado que receba; o teste escolhe o visitante
de outra praça e manda o aliado não receber): nas 18 praças compostas ela
desce na entrada norte ou na sul — "entrada:norte" ou "entrada:sul" — e
anda de 141 a 809 m até o portão 3, o do visitante, sem erro de rota.

**O dia de jogo** (o clássico da praça, nas 18 compostas, em Fortaleza e
no Recife): o plano monta nas 20, os 56 bondes chegam ao portão (rota de
117 a 842 m, 391 m na média) e nenhum erro de bonde nem da página. Os
bairros das 30 praças (as sedes no bairro dos dados, nenhum bairro vazio,
todo bar com bairro): 0 com problema. O Jogo 3D na Paraíba (começar,
abrir o mapa da cidade, clicar num bairro, ler o domínio): sem erro.

### Limites (sinceros)

- **O rio é chão pintado**, como a lagoa e a baía: no 3D ele não tem
  margem em degrau nem água que mexe, e a ponte é baixa (o tabuleiro no
  chão, com a mureta) — sem arco nem pilar.
- **Belém e o Litoral Catarinense não têm rio**: as duas cidades se ligam
  pela avenida do mapa do porte (a de entrada, a da beira), e não por
  estrada. Belém já tem a lagoa.
- **O rio pode ser comprido**: com as cidades a 50 m umas das outras, o rio
  de um vão segue pelos vãos até a borda — numa praça de 8 ligações (o
  Interior de SP) são 8 rios, e o maior corta o mapa de lado a lado.
- **A clareira é uma mancha de capim com a beira de mato**: sem cerca, sem
  gado, sem trilha até ela.
- **A escola e o hospital são da quadra comum** (30 × 13 m de miolo): a
  quadra coberta da escola é pequena (uns 11 × 8 m) e o hospital tem só três
  andares.
- **A entrada da praça chega numa cidade da ponta** (a de cima e a de
  baixo), não necessariamente no centro: a caravana pode descer numa cidade
  pequena e andar pela estrada até o estádio.

## 37. Maranguape sai, Juazeiro do Norte ganha o terceiro bairro, e os rios refeitos: no máximo dois, pro mar quando tem mar, sem cidade ilhada (01/10/2026)

**O pedido** (o dono): "remova maranguape do jogo e crie mais um bairro pra
juazeiro do Norte. se um mapa tem mar, os rios vão correr em direção ao
mar. cada mapa vai ter no máximo dois rios. o mapa do interior de são
paulo ficou estranho com cidades ilhadas."

### Maranguape sai, o Juazeiro do Norte III entra

- **Nos dados** (`dados/fonte/cidades_bairros.json` → `importar_bairros.py`
  → `dados/cidades.js`): sai o bairro Maranguape (Interior do CE) e entra o
  **Juazeiro do Norte III** — zona Sul, sem sede, com a classe e o
  multiplicador do Maranguape (**Nobre**, 1,5): a praça fica com a mesma
  mistura de classes, e Juazeiro do Norte passa a ter um bairro de cada
  (Classe Média, Classe Baixa e Nobre). As 30 praças seguem com 353
  bairros; Juazeiro do Norte fica com 3.
- **A cisão do Interior do CE** (`CISOES`): Itapipoca, que se ligava em
  Maranguape, liga direto em Limoeiro do Norte (295 km na placa); Sobral–
  Itapipoca, Iguatu–Limoeiro do Norte e Juazeiro do Norte–Iguatu ficam.
  O Interior do CE passa de 5 cidades e 5 estradas pra 5 cidades e 4
  estradas.
- **O save antigo**: o domínio é guardado por id de bairro
  (`js/mundo/dominio.js`). Na praça que o save já gravou, o Juazeiro do
  Norte III começa sem dona (barra vazia) e a barra do Maranguape fica no
  save sem ninguém ler; na que não gravou, o começo é sorteado de novo com
  os bairros de agora.
- **Fica de fora**: `legado/unity/data.js` ainda tem o Maranguape (é do
  Unity antigo, que só o `importar_estadios.py` lê pra parear estádios).

### Os rios refeitos (o passo 8b' da cisão)

- **No máximo dois rios por praça.** Antes, um rio por estrada: 8 no
  Interior de SP, 5 no CE, no RS e em SC — e as cidades ficavam presas
  entre eles. Agora cada estrada é uma travessia possível; o gerador traça
  o rio de cada uma, fica com o melhor sozinho e procura o melhor segundo.
- **Mapa com mar: o rio corre pro mar.** Nas 6 praças de praia com estrada
  (Alagoas, Maranhão, Paraíba, Rio Grande do Norte, Bahia, Sergipe), da
  ponte pra baixo o rio só vai pro leste ou de lado (nunca volta pro
  oeste); a faixa da costa (a avenida da beira e 20 m pra cá dela) ele
  atravessa reto pro leste, e acaba na linha d'água. Rio acima, ele nasce
  numa borda de terra (norte, sul ou oeste) ou, sem saída, numa lagoa.
- **Mapa sem mar: um rumo só.** O rio corre de oeste pra leste ou de norte
  pra sul (o de través da estrada que ele cruza), sem passo pra trás; nasce
  na borda de trás ou numa de lado, e sai na da frente ou numa de lado —
  nunca entra e sai pela mesma borda.
- **Nenhuma cidade ilhada.** A régua (a do dono, "cidades ilhadas"): a
  cidade com água — rio ou mar — a 60 m de dois lados opostos, ou de três
  lados, está ilhada. O segundo rio não pode deixar cidade assim; o rio
  sozinho que deixa paga o dobro na nota; e no fim a conferência: a região
  de toda cidade (com os rios e o mar de parede) chega na beira do mundo.
- **A nota do rio** (menor é melhor): o custo médio de cada passo — longe
  das cidades, das estradas e do outro rio é barato —, ×1,6 pro que nasce
  em lagoa, e mais barata pro que divide as cidades por igual. **O par se
  escolhe junto**: dos três melhores sozinhos, cada um com o melhor segundo
  que aceita — noutra estrada, com cidade entre os dois, sem cidade ilhada,
  sem custar mais que o dobro do primeiro e **sem correr ao lado dele** (a
  120 m um do outro por mais de 150 m parece rio gêmeo).
- **A beira do mundo**: o chão pintado acaba nela, e o rio não corre
  colado nela — a 25 m dela, de dentro ou de fora, o passo custa mais
  (atravessar pra sair do mapa, todo rio atravessa uma vez). No canto da
  grade, a ponta reta de 1,5 km sai pro lado do rumo do rio (antes saía na
  diagonal, feito canal).
- **As curvas**: um relevo de mentira (um ruído de 40 m em 40 m) encarece
  o chão aqui e ali, e o rio contorna; no mato aberto ele serpenteia (duas
  ondas somadas, de 95 m e de 41 m, até 7 m pra cada lado) e endireita
  perto da cidade, da rua, da ponte, da costa e do outro rio.

### Na planta e no cenário

- **A boca no mar**: a margem de capim e o barro do rio só vão em terra
  (até a avenida da beira); na areia, a água corre entre a areia, e a água
  para na linha d'água — a espuma da onda passa na frente da boca.
- **A praia longe do rio**: nada da praia de cidade (quiosque, guarda-sol,
  canga, barraca, posto, quadra de vôlei, coqueiro) fica na água do rio nem
  a 3 m da beira dele, cada coisa pelo tamanho dela; a praia guardada
  (`PRAIAS`) leva os rios na chave. Hoje nenhuma boca cai no trecho da
  praia de cidade (as 6 ficam de 23 a 277 m das pontas da avenida da
  beira): a regra é pra quando cair.
- **O rio fora da área no 3D** (`chaoDeLonge`): o pedaço do rio fora do
  chão pintado — o que corre na beira do mundo e a ponta que segue reta pra
  longe — vira a faixa d'água com a margem, por cima do mato de longe, e
  começa no último ponto dentro da área, por baixo do chão pintado. A boca
  no mar não segue pra longe, a ponta que nasce em lagoa também não, e na
  praia a margem para na areia e a água na linha d'água. **Dois consertos
  do que vinha da §36**: a faixa começava no ponto de antes da ponta, a
  uns 20 m da área, e o rio sumia nesse vão em toda saída; e ela saía
  **preta** — os triângulos estavam virados pra baixo, e o material de dois
  lados vira a normal e fica sem luz.
- **O mar das praças de praia toda de modelo** (Alagoas, Maranhão, Paraíba
  e Sergipe; conserto do que vinha da §36): o mundo dessas praças era a
  caixa das cidades, que acaba na avenida da beira — a areia, a linha
  d'água e o mar ficavam fora. No mapa, o mar era uma tira de uns 10 m;
  **no cenário 3D não tinha mar: era areia até o horizonte** (o mar de
  longe tirava a cor de um ponto que, com a curva da costa, caía na
  areia). Agora o mundo delas vai até 60 m mar adentro — a areia, a
  espuma, as ondas e a boca do rio entram no chão pintado — e o mar de
  longe tira a cor na linha da ponta, 25 m mar adentro.
- `rios()` (a API da planta pro cenário) dá também `mar` e `lagoa`;
  `PRAIA_A_MAIS` (os 105 px da areia a mais) é um só, do gerador.

### Medido

| | §36 | agora |
|---|---|---|
| rios (praças com rio) | 52 (16) | 24 (16) |
| máximo de rios numa praça | 8 (Interior de SP) | 2 |
| rios que deságuam no mar | 0 | 6 (as 6 praças de praia com estrada) |
| nascendo em lagoa | 6 | 3 (Alagoas, Bahia, Sergipe) |
| pontes | 52 | 31 |
| rio dentro das áreas | 20,7 km | 15,2 km |
| cidades com água a 60 m de lados opostos ou de três lados | 36 | 4 — nenhuma cercada |
| … no Interior de SP | 5 das 9 | 0 |
| avisos do gerador | 0 | 0 |
| gerar a praça (só o gerador, média / a mais lenta) | 0,18 s / 0,43 s (Rio Grande do Norte) | 0,22 s / 0,55 s (Bahia; o Interior de SP, 0,53 s) |

(As duas colunas medidas com os mesmos scripts, `rodada37.mjs` e
`tempo_gerar.mjs` — o tempo com a segunda rodada, quente, e com o teste do
navegador rodando ao lado —, no código antigo e no novo.) As 4 que ainda têm água de três lados ficam com o
quarto lado em terra: Bragança Paulista (o rio desce pelo oeste dela e
dobra nas duas quinas), Passo Fundo (o rio passa por baixo dela fazendo
um U), Parnaíba e Natal (o rio de um lado, o mar do outro).

**No navegador** (a cópia de teste montada com `montar.sh`):

- **A pé, chega em tudo?** Nas 18 praças compostas, toda sede, bar,
  pórtico, favela e quadra das cidades-modelo fica no mesmo pedaço andável:
  "tudo ligado" nas 18 (as 4 de praia de novo depois do conserto do mar),
  sem erro da página.
- **A caravana de fora** (sem aliado que receba): nas 18, ela desce na
  entrada norte ou na sul e anda de 141 a 809 m até o portão 3, sem erro de
  rota (como na §36).
- **O dia de jogo** (o clássico da praça, nas 18 compostas, em Fortaleza e
  no Recife): os 20 planos montam, os 56 bondes chegam ao portão (rota de
  117 a 826 m, 388 m na média; o último chega às 15:28) e nenhum erro de
  bonde nem da página.
- **Os bairros das 30 praças** (as sedes no bairro dos dados, nenhum bairro
  vazio, todo bar com bairro): 0 com problema. **O Jogo 3D na Paraíba**
  (começar, abrir o mapa da cidade, clicar num bairro, ler o domínio): sem
  erro.
- **As fotos**: no 3D do Maranhão, a boca do rio atravessa a areia e
  encontra o mar com a espuma na frente, e o rio que sai pela beira oeste
  emenda na faixa de longe (azul, sem vão); o mar aparece com as ondas.

### Limites (sinceros)

- **O rio que nasce em lagoa, em Alagoas, na Bahia e em Sergipe, nasce
  colado na estrada**: rio acima ele não tem saída (o vão entre as duas
  cidades é fechado embaixo pela rua de veraneio), e a lagoa fica no lugar
  mais aberto do bolsão, a poucos metros da estrada.
- **O rio que contorna a cidade da praia corre perto da beira do mapa**:
  pra chegar no mar ele passa pela ponta da cidade da costa, e no Rio
  Grande do Norte e em Sergipe corre de 110 a 180 m a menos de 25 m da
  beira (dentro do chão pintado).
- **Oito praças ficam com um rio só**: Mato Grosso, Rio Grande do Norte e
  Bahia têm uma estrada só; no Interior de Minas, em Alagoas, no Maranhão,
  na Paraíba e em Sergipe o segundo rio não passou nas regras (deixava
  cidade ilhada, corria ao lado do primeiro ou custava mais que o dobro).
  E duas seguem sem rio (Belém e o Litoral Catarinense, ligadas pela
  avenida, como na §36).
- **O mapa 2D do jogo** (o que é assado do cenário) precisa ser assado de
  novo pela sessão do 2D pra pegar os rios novos.
- **O rio continua chão pintado**, como na §36: sem margem em degrau nem
  água que mexe, e a ponte baixa.

## 38. O bairro é um pedaço só, com a sede dentro (02/10/2026)

**O pedido** (do jogo 2D, que assa o mapa dos bairros desta planta): "a sede
tem que ficar DENTRO do bairro dela, e todo bairro tem que ser um território
contínuo, sem enclave." E o dono: "eles sempre têm que ter uniformidade
territorial". O bairro da sede continua o dos dados (o 2D usa esse bairro
no domínio), `dados/plantas.js` e `img/mapas/` ficam como estão (o 2D assa
de novo).

### O que estava errado

- **14 sedes fora do bairro delas na grade**: a quadra da sede era presa
  no bairro dos dados, mas a semente do bairro (no diagrama de potência,
  `repartir`) andava pro meio da zona pra igualar os tamanhos, e a sede
  ficava na ponta de uma cunha fina — sem nenhuma quadra no caminho. A
  quadra da sede virava um enclave no meio de outro bairro (em Fortaleza,
  a sede da JGT, do Jardim das Oliveiras, no meio do Bom Jardim).
- **44 pedaços soltos em 17 praças**: "quem encosta em quem" era a caixa
  das unidades com folga de até 32 m — a quadra que só toca a outra na
  quina da esquina e as dos dois lados do mato contavam como vizinhas, e o
  bairro inteiro nessa conta saía em pedaços na grade. E a quadra "de
  longe" do bairro do estádio (pro bar a 50 m dele) era escolhida pela
  caixa, às vezes do outro lado de outro bairro.

### O que mudou (`setorizar`)

- **A grade das unidades**: a grade de 4 m sai antes de repartir, com a
  unidade (quadra, favela, estádio) em cada célula — as mesmas regras de
  antes: a rua até a unidade mais perto (~28 m, só na rua e na calçada), o
  entorno do estádio, o lote do bar. O bairro de uma célula é o da unidade
  dela, e **duas unidades encostam quando duas células delas se tocam pelo
  lado** (`VIZ_DAS_UNIDADES`) — a mesma vizinhança de 4 que o 2D usa. Daí,
  bairro inteiro nas unidades é bairro inteiro na grade.
- **A rua de acesso do estádio é do estádio** (como o entorno): o estádio
  do outro lado do mato só chega na cidade por ela, e o bloco dele ficava
  ilhado (em Porto Alegre, ia pra favela mais perto).
- **`repartir`** ganha dois começos: um com a semente de cada bairro de
  sede presa na sede (o bairro cresce em volta da quadra dela) e, em cada
  começo de "bairro k no estádio", o estádio dele de verdade. E devolve
  todas as tentativas: **`escolherDivisao` passa cada uma por `inteirar` e
  `equilibrar` e fica com a de menor `notaDaZona`** (o mesmo erro de
  tamanho + o pedaço redondo, no bairro já inteiro). O diagrama cru não
  sabia que o bairro ia ser um pedaço só: em São Paulo, o estádio do norte
  ia pro bairro cuja sede fica do outro lado da zona.
- **`inteirar`** (no lugar do `juntarPedacos`): o pedaço que fica é o da
  quadra da sede, senão o maior. O pedaço que importa (o resto do bairro
  quando a sede ficou do outro lado; o estádio preso; a quadra de longe
  do estádio; o lote de bar da âncora) se liga ao que fica pelo caminho
  mais barato de quadras dos vizinhos — nunca a quadra presa de outro
  bairro, a favela, o estádio nem a cidade-modelo, e o vizinho não pode
  ficar partido num pedaço que importe pra ele; até meio bairro médio da
  zona. O resto vai pro vizinho que mais encosta (o da mesma zona
  primeiro). **A ilha** (o pedaço sem vizinho nenhum) vai pro bairro mais
  perto dela pelo vazio — a mesma conta do 2D.
- **`equilibrar`** só mexe nos bairros da zona (o de outra zona com uma
  quadra ali — a da sede no gomo vizinho — nem entra na conta nem recebe)
  e confere o bairro inteiro na praça toda, não só na zona.
- **A quadra de longe do bairro do estádio** (o bar a 50 m): medida como a
  regra do bar (`criarVagasExtras`: até a área do estádio; a quadra serve
  quando a ponta dela passa de 50 m mais o fundo de um lote), encostada no
  pedaço do bairro que tem o estádio e sem ser a única ligação de outras
  quadras com o bairro delas (em Curitiba, a fileira de cima da zona oeste
  ia junto). A quadra da sede do bairro já serve. Sem quadra assim, o bar
  do bairro vai pro lote livre mais perto, como já era.
- **O estádio no bairro Nobre**: custa 6%, como antes; e o **único Nobre
  da praça** com o estádio e menos de um terço de bairro de casa custa 30%
  — no Mato Grosso, o Santa Rosa ficava com o estádio e uma quadra, sem
  torre; a guarda do Nobre caía e a favela tomava o bairro.
- **A grade sem enclave**: no fim, a mesma conta do
  `ferramentas/plantas_sem_enclaves.py` do 2D (o principal é o maior que
  encosta em outro bairro; o outro pedaço vai pro vizinho de mais divisa;
  a ilha, pro mais perto pelo vazio), protegendo o pedaço da sede. Ela só
  pega o que a própria grade parte (8 células, no Belo Horizonte);
  `SETORES.mexidas` e `SETORES.falhas` contam. O nome do bairro fica no
  pedaço principal dele.

### Medido nas 30 praças

- **Pedaços**: de 44 pedaços soltos em 17 praças pra 0. Sobram 11 ilhas,
  todas com o próprio bairro como o mais perto pelo vazio (a exceção que o
  2D aceita): a quadra solta do outro lado do mato dos mapas grande e
  médio.
- **Sedes**: das 14 fora do pedaço principal do bairro dos dados pra 0 —
  as 139 sedes das 30 praças no pedaço principal, e as 14 da lista do 2D
  passam uma a uma.
- **A conferência do 2D**: as 30 praças assadas do `cenario3d/planta.html`
  do jeito do `assar_plantas.js` e passadas no `plantas_sem_enclaves.py`
  deles: nenhuma célula, sede ou nome mexido.
- **Zonas no lugar**: a fração das células de cada praça no gomo da zona
  do bairro fica igual (0,86 a 0,95); o meio de cada zona andou 21 m no
  máximo; Norte em cima, Leste à direita em todas.
- **Tamanhos** (maior ÷ menor bairro de quadra, em células): melhor em 6
  praças (Brasília 1,27 → 1,16, Santos 1,33 → 1,18, Fortaleza 1,75 → 1,66,
  Litoral Catarinense, Rio Grande do Norte, ABC), igual em 14 e pior em 10
  — São Paulo 1,99 → 2,88, Goiânia 1,41 → 1,70, Recife 1,70 → 1,96,
  Porto Alegre 1,79 → 1,96, Belém 1,72 → 1,96, e um tico em Bahia,
  Curitiba, Manaus, Maranhão e Mato Grosso.
- **Bares fora do bairro que o jogo deu**: de 15 pra 8 (de 139).
- **O resto**: a pé, "tudo ligado" nas 30 praças; o dia de jogo em 8
  praças sem erro de bonde nem da página; a caravana chega nas 4 testadas;
  o teste dos bairros (sede no bairro dos dados, nenhum vazio, todo bar
  com bairro) com 0 problema e o mesmo tempo de montagem (27,9 s → 27,3 s
  nas 30); o Jogo 3D na Paraíba sem erro; os estádios presos pelos dados
  (Jonas Duarte em Anápolis, as cidades de fora) no bairro deles.

### Limites (sinceros)

- **São Paulo ficou mais desigual** (Casa Verde 2.195 células, Bom Retiro
  759): o estádio do norte sozinho pesa mais que um bairro e a sede da
  Casa Verde fica do outro lado da zona — o bairro inteiro tem que ir do
  estádio até ela. Antes a conta fechava porque a sede era um enclave. No
  mesmo tom, mais leve, Goiânia, Recife, Porto Alegre e Belém.
- **Braço até a sede**: alguns bairros de sede ganharam um braço de uma
  quadra até ela (o Jardim das Oliveiras em Fortaleza, a Anápolis em
  Goiânia). É o preço de não mudar a sede de terreno.
- **A quadra do outro lado do mato** fica com o bairro mais perto dela
  pelo vazio, que muitas vezes é a favela (Samambaia Norte em Brasília,
  Vila Pinto em Curitiba): a favela fica com uma quadra solta, como o 2D
  já fazia.
- **O bairro do estádio sem quadra a 50 m** acontece quando a única quadra
  que serviria cortaria outras do bairro delas: o bar dele vai pro lote
  livre mais perto, em outro bairro.
- **O mapa 2D precisa ser assado de novo** pela sessão do 2D
  (`ferramentas/assar_plantas.js`).

## 39. A sede vaga sai; a loja e a subsede da torcida (02/10/2026)

**O pedido**: "exclua essa parte de sede vaga que não tem sentido. crie um
modelo de loja substituindo o bar no mesmo prédio, mas sendo uma loja
temática da torcida com as camisas da torcida e do time à venda. crie
também uma subsede do tamanho de uma casa comum, com dois compartimentos
apenas (barzinho embutido e pátio)." Com as fotos de referência: a loja
da Mancha por dentro, a fachada de uma LOJA OFICIAL, as fachadas das
subsedes da Mancha (Rio Claro, Matão), da Independente (Marília), dos
Gaviões (Guarulhos) e a Independente de Sorocaba por dentro. E no meio
da rodada: "o letreiro deve ser SUBSEDE {praça} se for filial".

### A sede vaga sai

- **O espaço de sede sem dono é casa**: o terreno que o gerador guardava
  pra uma sede (os terrenos de sede, os espaços das quadras de hoje e das
  cidades-modelo) e que nenhuma torcida da praça tomou não aparece mais
  como "sede vaga" — no 2D, no 3D e na ficha ele é a fileira de casas da
  quadra, como as vizinhas. O gerador (`proposta.js`) já deixa as casas de
  cada espaço prontas (`casasNaCaixa` com a lista sem muro; o quintal do
  terreno cortado com a casa) e a planta só esconde as casas debaixo da
  sede que tem dono (`sobSede`).
- **A reserva de sede** (a ponta de uma quadra de casas que só vira sede
  quando precisa) encolhe pro lado de dentro da quadra até não pisar em
  lote visível pela metade; com menos de 17,5 m ela não serve.

### A loja da torcida (`lojaTorcidaDireita`, `js/diajogo/casas3d.js`)

O prédio do bar da torcida — o corredor da escada com a porta do
apartamento e o apartamento em cima, com a sacada — com a loja no térreo:

- **A fachada de vidro rente à calçada** (a LOJA OFICIAL da foto): a
  mureta e a testeira na cor 1, o LED nas bordas, o escudo no meio entre
  LOJA e a sigla (os decalques soltos do lote, `placasDoLote`); a vitrine
  com os manequins de camisa e bermuda; o vidro é uma folha transparente
  (`vidros`), então da rua se vê a loja.
- **Por dentro** (a loja da Mancha): o piso de tábua, as camisas no
  cabide em duas fileiras na parede da escada, a bandeira e mais uma
  fileira na parede da esquina, as mesas de cano com as camisas dobradas,
  a arara, a coluna com a sigla de cima a baixo, o forro de tela com os
  spots e o balcão do caixa; na parede do fundo, na cor da torcida, o
  escudo e as camisas abertas — as da torcida (as cores dela, a sigla, o
  escudo) e as do time (as cores do clube, a sigla, o escudo dele).
- **No catálogo**, "Estruturas da torcida › Loja da torcida", no lote do
  bar do mapa (7,4 × 5,4 m), com "Outra torcida" e "Ver por dentro".

### A subsede (`subsedeTorcida`, `js/diajogo/casas3d.js`)

**O lote de casa comum do mapa é raso**: medido em São Paulo, a casa tem
de 3 a 7 m de frente (4,9 m no meio) e de 4,5 a 5,8 m de fundo. A
subsede mora numa casa dessas, das mais largas (5,5 a 9,5 m de frente),
e tem só os dois cômodos do pedido:

- **A fachada** (Rio Claro, Matão, Marília, Guarulhos): a parede em
  faixas — o rodapé e a faixa de cima na **cor forte** da torcida (a mais
  escura das duas: o verde da Mancha, o vermelho da Independente, o preto
  dos Gaviões), o meio claro —, a porta de enrolar aberta com o toldo de
  chapa na cor forte e a mão-francesa, o escudo pintado do lado da porta
  e, na platibanda, o nome da torcida em letra grande com o brilho do LED
  e, na faixa de cima, **SUBSEDE e o bairro**. **A filial** (a subsede de
  uma torcida de outra praça) diz **SUBSEDE e a praça**; na praça de
  várias cidades, a cidade do bairro (SUBSEDE ITU, não SUBSEDE INTERIOR
  DE SP). A planta põe o texto pronto em `l.subsede.letreiro`.
- **O pátio coberto** (Sorocaba por dentro): o telhado de metal nas
  treliças, caindo pro fundo, com a faixa de telha clara; as paredes de
  bloco pintado de branco com o rodapé cinza e a faixa da cor forte no
  alto; o escudo da torcida pintado na parede livre (a que a rua vê pela
  porta) e o do time na do lado da porta; as bandeiras da torcida e do
  time penduradas na treliça; a lâmpada; a mesa e as cadeiras de plástico
  brancas na faixa livre (a da porta é caminho); os surdos encostados na
  fachada e a TV na parede.
- **O barzinho embutido** no fundo (1,45 a 3,2 m, pelo fundo do lote): a
  porta atrás da porta da rua e o balcão de alvenaria do outro lado — a
  mureta de azulejo e o tampo de granito saindo pro pátio —, a faixa de
  pano da subsede por cima; dentro, o piso xadrez, a prateleira de
  garrafa, a cervejeira, o freezer atrás do balcão e o escudo.
- **No catálogo**, "Estruturas da torcida › Subsede da torcida", num lote
  de 6,6 × 5,2 m, com "Outra torcida", "Filial (de fora)" e "Ver por
  dentro" (o corte a 2,85 m, por cima do forro do barzinho).

### No mapa: o bairro que o jogo diz (`criarEstruturas`)

O jogo diz o bairro de cada loja, subsede e filial (`TO.dominio.
estruturas`: o patrimônio do jogador; o mundo vivo da IA, que começa sem
loja e sem subsede e compra com o tempo; as filiais de outras praças
nesta). Cada uma ganha um lote no bairro dela:

- **A loja abre primeiro numa vaga de bar sem dono do bairro** (o bar
  fechado do ALUGA-SE: é o mesmo prédio); sem vaga, uma casa do bairro de
  5 a 9,5 m de frente vira o prédio do bar com a loja.
- **A subsede e a filial vão numa casa comum** de 5,5 a 9,5 m de frente e
  4,4 a 9 m de fundo (a de 6 m ou mais ganha); na favela, uma casa grande
  (a casa comum lá é estreita demais).
- **Em degraus**, pra estrutura não sumir do bairro: primeiro fora do
  entorno do estádio, a 50 m ou mais dele (a regra da sede e do bar) e a
  15 m de bar, loja e subsede (12 m na favela), o mais perto do meio do
  bairro; sem lote assim, o entorno vale e ganha o lote mais longe do
  estádio (10 m ou mais); por último, a distância das outras cai pra 6 m.
  A torcida do jogador escolhe primeiro.
- **2D**: o lote na cor da torcida com a borda na segunda (como o bar) e
  a letra L ou S; de longe, a loja é um quadrado e a subsede um losango;
  a etiqueta "Loja da X", "Subsede X · Bairro", "Filial X · Praça"; a
  ficha com o bairro, o letreiro e onde ela abriu. A legenda ganhou as
  duas.
- **3D e cenário**: o lote monta o modelo dele (as categorias novas
  `lojatorcida` e `subsede` contam como prédio pra câmera); a fachada da
  estrutura não leva pixação.
- **Jogo 3D** (`jogo3d.js`): a praça remonta quando as lojas e subsedes
  do jogador mudam (as da IA entram na próxima montagem, como os bares),
  e a câmera passa na nova ("A loja nova da X abriu as portas", "A
  subsede nova da X em Y abriu as portas"). A API do cenário ganhou
  `estruturas()` (o tipo, o dono, o bairro, o lote e a porta na calçada).
- **A próxima montagem desfaz tudo** (`desfazerEstruturas`: a casa volta
  a ser casa, a vaga volta a ser bar), e a fotografia da praça
  (`camposDaPraca`) guarda os campos novos.
- **O exemplo** (a planta sem o jogo, o Pages e o artefato, onde a IA
  ainda não comprou nada): a camada **"Lojas e subsedes de exemplo"** põe
  uma loja e uma subsede pra cada torcida com sede, no bairro que a IA do
  jogo escolheria (`bairroPadrao`), e a filial de uma torcida de outra
  praça; a praça monta de novo, e o cenário 3D que abrir depois vem com
  elas. Com o jogo aberto, vale o save.

### Medido

- **A sede vaga**: nas 30 praças, os 82 espaços sem dono viraram 649 casas;
  nenhuma casa escondida em espaço sem dono, nenhuma visível debaixo de
  sede com dono, nenhum lote por cima de outro (igual à medição feita logo
  depois da mudança).
- **As estruturas nas 30 praças**, com uma carga de jogo (cada torcida com
  sede com uma loja e uma subsede no bairro que a IA escolheria, mais uma
  filial de fora): **308 de 308 com lote no bairro dito** (antes dos
  degraus, 283: o bairro do estádio só tem casa larga no entorno, e a
  favela colada no estádio não tinha casa grande longe dele); 18 lojas na
  vaga do bar fechado e 121 em casa; 43 estruturas a menos de 50 m do
  estádio; nenhum erro. Na praça de várias cidades, a filial de uma
  torcida carioca no Interior de SP saiu com "SUBSEDE ITU"; em São Paulo,
  "SUBSEDE SÃO PAULO".
- **O save**: a loja e a subsede do jogador gravadas com o NOME do bairro
  (como o jogo grava) caem nos bairros certos, a API `estruturas()`
  devolve as duas, e sem o save a praça volta sem nenhuma.
- **O cenário da Paraíba** com 5 lojas, 6 subsedes e os 8 bares montou em
  23 s, sem erro.
- **Nada mais mudou**: os bairros e as zonas iguais à medição anterior
  (nenhum pedaço solto, nenhuma sede fora do bairro, o meio da zona que
  mais andou 21 m), os mesmos 8 bares de 139 fora do bairro dado, e as
  sete conferências offline (lojas do assalto, sede, passagem, assalto,
  metrô, estádios, cidades) passando.
- **A conferência do 2D**: as 30 praças assadas do `cenario3d/planta.html`
  do jeito do `assar_plantas.js` passam no `plantas_sem_enclaves.py` sem
  mexer em nenhuma célula. Contra o assado de antes desta rodada mudam 10
  praças, todas pela sede vaga: em 9 a marca de uma sede anda até 13
  unidades (0,7 m — a reserva encolhe pra dentro da quadra) e em Goiânia a
  INDEP vai pra outra reserva, e a grade dos bairros muda.

### Limites (sinceros)

- **O lote de casa do mapa é raso** (uns 5 m de fundo): o pátio da
  subsede fica com uns 3 m — uma mesa, os surdos, a TV. Não é o salão
  comprido da foto de Sorocaba.
- **No 2D a estrutura parece um bar**: a cor da torcida, só a letra (L, S)
  e, de longe, o quadrado ou o losango separam.
- **43 de 308 ficaram a menos de 50 m do estádio** (o bairro do estádio e
  a favela colada nele); a regra dos 50 m segue valendo pra sede e bar.
- **O nível da loja e da subsede e a loja sem insumo não mudam o modelo**
  (o jogo guarda o nível; o mapa só usa o tipo e o bairro).
- **A IA começa sem loja e sem subsede**: no Pages e no artefato, sem o
  jogo, elas só aparecem com a camada de exemplo.
- **O mapa 2D precisa ser assado de novo** pela sessão do 2D
  (`ferramentas/assar_plantas.js`): as casas no lugar da sede vaga em todas
  as praças, e a grade dos bairros de Goiânia.

## 40. A sede da IA pelo save; a fábrica e os anexos da sede (02/10/2026)

**O pedido**: "faça o item 2, o nível da sede da IA no 3D. faça o item 6
também" — os itens da lista do que faltava pro jogo no 3D: o item 2 (o 3D
punha a sede de cada torcida da IA pela tabela, não pelo save: as 59
pequenas que o jogo deixa no ponto de encontro, o nível 0, apareciam com
sede, e a obra que a IA fazia não aparecia) e o item 6 ("Compras do
patrimônio sem visual: a fábrica (R$ 400 mil) não tem modelo, e os anexos
da sede (enfermaria, cofre, área de treino) não aparecem"; e o galpão de
material).

### A sede da IA é a do save (`jogo3d.js`, `conferirIA`)

- **O nível da sede, os bares, a fábrica e os anexos de cada torcida da IA
  vêm do mundo vivo** (`E.mundoTorcidas`), não da tabela. A pequena que
  começa no ponto de encontro (até 30 membros: 59 das 139 torcidas dos
  mapas) fica **sem sede no mapa**, com o bar dela; a que faz a obra
  aparece com a sede nova. Isso entra **na próxima montagem da praça**
  (como os bares da IA: remontar a cidade no meio do dia porque a IA
  comprou alguma coisa seria pesado); **os ônibus da garagem entram na
  hora** (`TO.relacoes.frotaIA`), porque são peças vivas.
- **A praça lembrada** (a que monta atrás do menu antes de o save
  carregar, com a tabela) **remonta quando o jogo entra nela** se não bate
  com o save — a planta guarda a assinatura do que montou (o modelo da
  sede, os bares, a fábrica e os anexos de cada torcida, as lojas e as
  subsedes; `assinaturaDoJogo`, `emDiaComOJogo`).
- **Quem não tem sede junta no ponto de encontro** (`pontoDeEncontro`, na
  planta): a calçada do bar dela; sem bar, a da subsede; **sem os dois, a
  esquina do bairro dela** (a calçada da casa mais perto do meio do bairro
  da sede nos dados). A esquina é pra torcida do jogador no nível 0, que
  pela regra do jogo vive sem bar até comprar um ou chegar na sede 2:
  antes ela não tinha nada no mapa, o bonde dela ficava fora do dia de
  jogo e o jogo do clube dela caía no clássico da praça.
- **No dia de jogo** o bonde de quem não tem sede sai do ponto de encontro
  (`inicio.tipo` 'ponto'), e os textos dizem de onde: "Sai do bar (não tem
  sede)", "Na esquina do bairro", "A concentração na porta do bar", "A
  concentração da X tá na esquina dela". A investida do jogador e a câmera
  "ir pra sede" saem do mesmo lugar (a API ganhou `casaDe`: a sede ou o
  ponto de encontro); a vida da cidade usa o bar da torcida sem sede como
  o lugar de onde ela ataca.

### A fábrica (`fabricaTorcida`, `js/diajogo/casas3d.js`)

A fábrica de material do jogo (R$ 400 mil, sede 5: corta pela metade o
custo das lojas) **é uma confecção de bairro num galpão da quadra nova**:

- **Fora**: o galpão de platibanda na cor clara da torcida (o gelo, se as
  duas são escuras), o rodapé e a faixa de cima na forte, **FÁBRICA DA
  {sigla}** na platibanda e **CONFECÇÃO · ESTAMPARIA** por cima do portão;
  o portão de enrolar aberto, a porta de ferro de quem trabalha e o escudo
  pintado na parede.
- **Dentro**: a fileira de máquinas de costura (a mesa, a máquina, a
  cadeira), o carrossel da estamparia no meio (quatro berços com a camisa
  esticada), a mesa de corte com o pano estendido, a estante dos rolos, a
  arara de camisa pronta e as caixas; as calhas de luz fria no teto. O
  telhado de duas águas fica escondido atrás da platibanda.
- **No mapa** (`criarFabricas`): quem tem a fábrica no save (o patrimônio
  do jogador, o mundo vivo da IA) ganha **o galpão livre mais perto da sede
  dela, no bairro dela** (sem sede, perto do bar): de 4,8 m de frente pra
  cima, sem estrutura, longe do estádio, o sem comércio antes do com
  letreiro. O lote vira a confecção no 2D (a letra F) e no 3D; a próxima
  montagem desfaz. No jogo, a compra remonta a praça e a câmera passa no
  portão ("A fábrica da X em Y começou a produzir").
- **Sem o jogo**, a camada "Lojas e subsedes de exemplo" põe uma fábrica na
  primeira torcida com sede; e o catálogo tem "Estruturas da torcida ›
  Fábrica da torcida", num lote de galpão de 7,0 × 5,2 m.

### Os anexos da sede (`js/diajogo/sede3d.js`)

O que o save diz que a torcida comprou (`sede.anexos`) entra na mobília do
cômodo dele:

- **Enfermaria** (sede 4) na hospedagem, no lugar do último beliche: a
  maca com a cabeceira levantada e a grade, o suporte de soro, o biombo, o
  armarinho de primeiros socorros com a cruz e a placa ENFERMARIA.
- **Galpão de material** (sede 3) no patrimônio, no lugar da estante: a
  gaiola de tela com cadeado, cheia — as caixas de rojão com a faixa de
  perigo, os sinalizadores, as faixas enroladas na prateleira e os
  mastros — e a placa MATERIAL.
- **Cofre blindado** (sede 5) na presidência, no canto do fundo: o cofre
  de aço de 1,5 m com o volante, o segredo e as dobradiças.
- **Área de treino** (as três obras, sem nível de sede) num canto livre do
  pátio de cada nível: o piso de borracha, a placa ÁREA DE TREINO e, a
  cada obra, mais aparelho — a trave de aço com dois sacos (1), o rack de
  halteres e a barra fixa (2), o supino e o pneu de virar (3) — com os
  lugares de treino. O que não cabe no pedaço vira o pequeno (os halteres
  soltos e o colchonete; o pneu velho e o kettlebell), **cada um num
  pedaço livre** (antes os dois caíam no mesmo canto, um em cima do
  outro). No nível 4, a academia também cresce: o terceiro saco na obra 3
  e a barra fixa a partir da 2.
- **No pátio do nível 4** a área vai no muro de cá, no lugar da mesa
  comprida e do banco: o pátio do 4 na cidade tem 7 a 8 m de largura, e a
  área fica com 1,6 a 2,1 m (antes ela pedia 2,2 m e não aparecia no pátio
  de 7,6 m). **No nível 3** ela vai até 1,7 m das portas da coluna (antes
  1,8: no terreno de 21,6 m ela não cabia).
- **No catálogo**, a ficha da sede ganhou os botões dos anexos (só os que
  o nível mostra: Enfermaria onde tem hospedagem, Galpão de material do 2
  pra cima, Cofre blindado do 4 pra cima) e "Área de treino 1/2/3".
- **No jogo**, comprar um anexo remonta a praça do jogador (é a mobília da
  sede); os da IA entram na próxima montagem.

### Medido

- **O item 2 no jogo** (Fortaleza, com a Cearamor): a praça do menu subiu
  com a tabela (Aliança, Jovem do Floresta e Falange Coral no nível 1, com
  sede) e, com o save, as três ficaram no nível 0, sem sede, com o bar e o
  ponto de encontro nele; os níveis da IA batem com o save (TUF 4, JGT e
  MOFI 2). Com a Aliança subindo pro 2 e a TUF comprando 2 ônibus, a volta
  do menu remontou a praça: a Aliança com a sede de nível 2, os 2 ônibus da
  TUF na garagem (9 de 9 malhas visíveis). No dia de jogo Ceará ×
  Ferroviário, a Falange Coral sai do bar.
- **O jogador no nível 0** (a Falange Coral, sem sede e sem bar): o ponto
  de encontro é a esquina do bairro, a câmera do começo vai pra lá, e o
  bonde dela (20) entra no Ceará × Ferroviário — antes ficava fora e o
  jogo virava o clássico. No painel do dia de jogo da planta, a Aliança sem
  sede e sem bar saiu com "Na esquina do bairro" e "Sai da esquina do
  bairro (não tem sede nem bar)".
- **A fábrica nas 30 praças** (o gancho de teste, uma por torcida com
  sede): **139 de 139 com galpão**, 9 fora do bairro da sede (sem galpão
  livre nele), a mais longe a 178 m da sede; a praça volta sem nenhuma. No
  jogo, a compra pelo Patrimônio pôs a da Cearamor num galpão de 5,8 ×
  5,8 m no José Walter — a câmera passou no portão, com o aviso "A fábrica
  da Cearamor em José Walter começou a produzir." — e a da TUF (IA) num de
  4,9 × 4,9 m no Bom Jardim.
- **Os anexos em toda sede que os três mapas e as 30 praças podem ter**
  (27 formatos, montados em node com e sem cada anexo): a enfermaria
  aparece em todo nível 3, 4 e 5 (1 maca); o galpão de material do 2 ao
  5; o cofre no 4 e no 5; a área de treino nos cinco níveis (no nível 4,
  +2, +3 e +4 lugares de treino nas obras 1, 2 e 3; no jogo, a Cearamor
  com a obra 2 foi de 7 pra 9).
- **A passagem de 70 cm** (`conferir_passagem.mjs`, que agora monta cada
  sede sem anexo e com todos os anexos nas três obras da área de treino:
  108 montagens): todo cômodo se alcança do portão, e nenhum perdeu mais de
  3 pontos de alcance com os anexos.
- **Nada mais mudou**: as lojas e subsedes das 30 praças (308 de 308), a
  loja e a subsede do save, o dia de jogo em seis praças de portes
  diferentes, a fumaça do Pages e as conferências offline (sede, cidades,
  lojas do assalto) passando, sem erro.

### Limites (sinceros)

- **O que a IA compra aparece na próxima montagem da praça**, não na hora
  (só os ônibus são na hora).
- **A fábrica é um galpão de 5 a 8 m de frente por uns 5 de fundo**: é a
  confecção de bairro, não um pavilhão industrial; 9 de 139 ficaram fora
  do bairro da sede, por falta de galpão livre nele.
- **A área de treino do nível 4 é pequena** (o pátio do 4 é estreito): a
  trave com os dois sacos e o pequeno; o rack e o supino não cabem lá (a
  academia do 4 cresce no lugar). E ela leva o banco do pátio.
- **A esquina não tem modelo**: é a calçada de uma casa do bairro, onde o
  bonde junta; no mapa não aparece nada da torcida sem sede e sem bar.
- **A torcida do jogador no nível 0 sem bar não tem o que mostrar na
  câmera da sede**: ela voa pra esquina; o mapa do jogo não põe alfinete.
- **Só pelo código, sem teste rodado**: a investida do jogador saindo do
  bar ou da esquina (o teste da investida usa uma torcida com sede) e o
  bar que a briga pega quando quem ataca não tem sede (o mais perto do bar
  dela).

## 41. O jogo 3D recebe o que o 2D ganhou desde 27/09: a rede social, os bonecos novos e as regras (06/10/2026)

O pedido: "veja as mudanças que fiz no 2d como redes sociais, novos bonecos,
regra pra força de recrutamento e traga pro jogo 3d".

### O sync

- O jogo 2D (`origin/claude/game-html-news-feed-sndgh4`) andou 73 commits
  desde a última sincronização (82bd43d, 27/09). Os dois históricos são
  independentes, e o código do jogo de feed na raiz deste ramo é o que o 3D
  empacota (`montar.sh` → `js/jogo.js`).
- **O método**: arquivo que só o 2D mexeu entrou como está; arquivo que os
  dois mexeram partiu da versão do 2D e recebeu, commit a commit, as mudanças
  do 3D desde 27/09 (`git merge-file`), pulando os commits do domínio que o
  2D já tinha importado. Os conflitos foram resolvidos à mão (`main.js`,
  `DECISOES.md`, `acoes.js`, `feed.js`, `planejamento.js`, `index.html`).
- **`dados/plantas.js` vem junto** (a planta assada pelo 2D a partir desta):
  as regras do domínio usam a grade dela — o bairro da pista é vizinho do
  estádio, a emboscada cai no bairro da entrada da praça. Sem ela o 3D caía
  no "mesma zona" e as contas divergiam do 2D. As imagens `img/mapas/` não
  vêm: o mapa do 3D desenha a planta ao vivo.

### A rede social no 3D

- **A coluna do 2D** (os posts caindo um a um, o filtro "Quem eu sigo", o
  "Ver tudo", o recolher) fica por cima da cidade, na borda **esquerda**, ao
  lado dos ícones — a direita é dos recortes de jornal (`.j3d-avisos`). 340
  px de largura; recolhida, vira a tira com o número de posts novos, e o post
  importante (nosso, do nosso clube, das nossas brigas) sai num aviso ao lado
  dela. Some com o mapa aberto e nas cenas de briga; abaixo de 1000 px some,
  como no 2D (a rede segue em Notícias → Mensagens).
- **A escolha de recolher é do 3D** (`to.redeRecolhida3d` — o Pages é a
  mesma origem pros dois jogos): na primeira vez ela nasce aberta em tela de
  1280 px pra cima e recolhida abaixo disso.
- **A coluna aberta é parte ocupada da tela** (`areaLivre`, vida3d.js): a
  câmera centra a sala do presidente e o balão da decisão no que sobra, e o
  medidor de fps sai de baixo dela.
- **`atualizarFeed` no 3D** (sem a lista do feed) faz andar só a coluna.
- **Notícias → Mensagens** é o feed da rede social também no 3D. O cartão
  antigo dos recados (`cartaoRecadoDeTorcida`) saiu: o post do 2D já traz os
  botões do pedido de casa e da trégua.
- **As fotos dos posts** (a briga do Futebol e Porrada, a resenha, a faixa
  tomada de cabeça pra baixo): o módulo do boneco do 3D ganhou `fotoDaBriga`,
  `fotoDaCena` e o renderizador único das fotos, e o `perdeu` (o canvas que
  perdeu o contexto) que o `main.js` novo pergunta.

### Os bonecos novos

- **O modelo do 2D refeito** — corpo anatômico, rosto do MakeHuman, olhos,
  nove tons de pele, camisa com gola e punho, a faixa do peito em duas
  listras (a 3ª cor), calção — entra pelo `img/boneco_leve.glb`.
- **Os dois níveis do 3D saem dele** (`ferramentas/afinar_boneco.mjs`
  refeito): a pele em duas partes (a cabeça, com o rosto, e o resto do
  corpo, cada uma com o seu alvo), o erro máximo em milímetros pelo tamanho
  na tela, o cabelo inflado e empurrado pra fora da cabeça afinada, e a
  textura da pele em 512 px JPEG (era um PNG de 1 MB).
- **Os números**: perto, ~3,9 mil triângulos por boneco (era ~3 mil); longe,
  ~2,3 mil (era ~1,3 mil). Os arquivos: 334 KB e 225 KB.
- **O movimento novo do 2D** veio junto: o andar com joelho, pé,
  sobe-e-desce e braço de gente; o parado que troca o peso de perna; a mão na
  cintura medida no esqueleto novo; quem ganha a briga para e provoca.
- **O shader do rosto do 2D** trocava o `#include <color_fragment>`, onde a
  noite do cenário (`comNoite`) se pendura: o shader não compilava e os
  bonecos sumiam. No 3D o include fica e a conta do alfa vem depois dele.
- **As bancadas** (`bonecos.html`, `arredores.html`) seguem com a cópia
  clássica do 2D (`bonecos3_classico.js`), agora a de hoje.

### As regras

- Vêm junto, no `js/jogo.js`: o novato com 3 a 8 de força e de defesa; as
  pixações nos muros (cota pela sede, a IA espalhada pelo mês, o pixo que
  desbota); o recrutamento no bairro escolhido na reunião; o alvo do mês; a
  estrutura que vale +0,2 por dia; o bairro da sede; a ideologia (o pedido de
  casa já marcado, o apoio fora, a pixação pela diretoria); quem ganha a
  briga provoca.
- **No mapa do 3D** o cartão do bairro (o do 2D, `mapa_brasil.js`) traz as
  pixações, o botão de pixar e quem recruta ali.
- **Conferido no jogo 3D**: 40 novatos entre 3 e 8; a pixação gasta a cota
  e o muro fica nosso; o cartão do bairro com as pixações e o recrutamento;
  a rede social aberta, recolhida e o aviso do post nosso; as fotos dos posts
  com os bonecos novos; a sala do presidente de perto; o dia de jogo; a
  briga do tutorial abrindo — sem erro no console.

### Limites (sinceros)

- **As pixações do save não aparecem nos muros da cidade 3D**: a cidade
  segue com as pixações de enfeite (os nomes das torcidas da praça nos muros,
  sem ligação com o save); quem pixou o quê só se vê no mapa, no cartão do
  bairro.
- **Os bonecos ficaram mais pesados** (+30% no de perto, +75% no de longe):
  no dia de jogo, 49 bonecos visíveis no nível de longe somaram ~112 mil
  triângulos (eram ~64 mil). Em máquina fraca, o menu Gráficos (gente,
  bonecos leves) é quem segura.
- **A faixa, a gola e os punhos travam a borda** (é o que impede fresta entre
  a pele e a roupa): o corpo do nível de longe não desce de ~1,8 mil.
- **O andar e a provocação só foram vistos em fotos paradas** (o teste roda
  sem placa de vídeo, a 2 a 8 quadros por segundo); a briga do tutorial
  abriu com os bonecos novos, mas ela espera o jogador agir.

## 42. O post do jornal é a página do jornal (06/10/2026)

O pedido: "preciso que ajuste os posts do futebol e porrada e gazeta dos
sports pra ter aquele layout de página de jornal que já está no jogo. aparece
junto com os posts da rede social".

- **O que era**: o post da Gazeta dos Sports e do Futebol e Porrada na rede
  social tinha a cara de Instagram do 2D — o cartaz 2:1 (a foto da briga com
  os números por cima, ou o placar com o estádio ao fundo) e a legenda
  embaixo, com o texto inteiro.
- **O que ficou** (`main.js`, `paginaDoPost`): no lugar do cartaz e da
  legenda, o **recorte do jornal**, o mesmo papel do recorte do canto e das
  páginas de Notícias (`css/gazeta.css`, `.gz-canto`) — o nome do jornal, o
  chapéu, a manchete e o olho. O perfil, a hora e o menu em cima, e as
  curtidas e o "Ler a matéria" embaixo, continuam: foi o jornal que postou a
  página dele.
  - **Com a matéria no histórico** (o post que nasce de uma notícia do feed —
    a nossa treta, o nosso jogo, o almanaque, a LNT, a obra) é a página dela,
    a mesma do canto (`recorteDeJornal`).
  - **Sem matéria** (a maior briga do dia pelo país, o jogo de outro time da
    cidade — posts que nunca tiveram página —, ou save antigo com o feed
    aparado) a página sai do post: o chapéu é o que vem antes do " · ", a
    manchete é a do cartaz ("MOFI LEVA A MELHOR NO ATAQUE-SURPRESA",
    "FLORESTA VENCE O FLUMINENSE DE FEIRA EM CASA") e o texto do post vira o
    corpo, em pé e na tinta cheia (o olho itálico e cinza não se lia em
    quatro frases).
  - **O que o cartaz mostrava vira coisa de jornal**: no Porrada, a foto da
    briga com os bonecos logo abaixo da manchete (a mesma foto, pela mesma
    fila: `cartaz.js`, `fotoDoJornal`), com a legenda — as duas torcidas, o
    vencedor em negrito, o lugar — e o quadro curto da noite (envolvidos,
    feridos e presos dos dois lados); na Gazeta, o placar grande, com os
    pênaltis embaixo quando houve.
- **Onde aparece**: na coluna da rede social (340 px), em Notícias →
  Mensagens (a página vai até 560 px) e no aviso do canto com a rede
  recolhida (o aviso é o post inteiro).
- **Um defeito de antes, junto**: o rodapé do post de jornal (curtidas,
  comentários, compartilhamentos, "Ler a matéria" e a etiqueta numa linha só)
  não cabia nos 340 px da coluna do 3D e empurrava o post inteiro pra fora,
  com rolagem de lado — o cartaz já aparecia cortado à direita. O envelope do
  post agora é `minmax(0,1fr)` e o rodapé quebra linha (`paineis.css`).
- **Conferido no jogo 3D** (Fortaleza, Cearamor, 26 dias passados): 13 posts
  de jornal em Notícias → Mensagens, todos como página — 9 do Porrada (7 da
  briga do país, 2 da nossa treta, com a página da matéria), 2 da Gazeta com
  o placar, 1 do almanaque —, as fotos chegando com os bonecos, nenhum post
  passando da coluna, sem erro no console.
- **O que fica igual, de propósito**: o recorte do canto direito
  (`recados3d.js`) continua saindo quando a matéria cai. Com a rede aberta, a
  mesma página aparece nos dois lados por alguns segundos; se incomodar, o
  canto pode deixar os jornais pra rede.

## 43. Os muros de pixação do save, a TUF tricolor, sem spoiler, a bandeira do presidente e as brigas que abriam a foto (06/10/2026)

O pedido, em cinco partes: "as pixações do save agora devem aparecer nos
muros da cidade 3d, sendo somente esses os espaços possíveis de pixação no
jogo. marque de 3 a 5 locais fáceis de pixar, da altura do boneco em todos
os mapas do jogo pra aumentarmos essa dinamica. / a sede da tuf aparece
somente com as cores azul e branco mesmo a torcida tendo 3 cores. apure
isso. / o post do resultado do jogo aparece antes do itinerário do jogo
acontecer: gera spoiler. resolva isso. / a bandeira que fica na parede e
acima da mesa do presidente na sede deve ser mais bonita, similar à
bandeira que colocamos na arquibancada. / as cenas de briga algumas vezes
abrem o cenário 2d, crie os cenários coerentes dentro do mapa 3d".

### Os muros de pixação

- **O jogo já tinha os muros** (`js/mundo/dominio.js`: de 3 a 5 por bairro,
  `vagasPix`, o número fixo pelo hash do bairro; no save, de quem é cada um
  e desde quando). Faltava o lugar de cada um na cidade. A planta agora
  escolhe as paredes (`index.html`, `escolherMurosDePixo`):
  - **os candidatos** são os lotes do bairro com parede pra rua, nesta
    ordem de preferência: o muro do terreno baldio (o muro comprido, o lugar
    clássico da lata), o muro da casa murada, o galpão, a casa e o sobrado
    (e a casa da favela), e por último o prédio. Ficam de fora a sede, o
    bar, a loja e a subsede de torcida, a fábrica, as lojas do assalto, o
    comércio com letreiro e o estacionamento;
  - **espalhados**: cada muro novo é o candidato mais longe dos já
    escolhidos (conta até 60 m); o de categoria pior só ganha se estiver
    15 m mais longe que o melhor;
  - **na altura do boneco**: o lugar do pixo é o da pixação de torcida de
    antes, de 20 cm a 1,75 m do chão, o mais largo que couber na parede
    livre (sem janela nem porta; o portão de chapa vale). O muro sem esse
    lugar sai e entra o próximo candidato.
- **Nas 30 praças: 1.411 muros**, e todo bairro ganhou o número que o jogo
  diz (`vagasPix`).
- **A pixação de torcida de enfeite saiu** (a que cada praça sorteava pela
  sede e pelos bares mais perto): só os muros têm pixação de torcida, a do
  save. O recado de parede (VENDE-SE, TE AMO MARIA, o grafite da favela)
  continua, fora dos muros.
- **A cidade pinta os muros numa camada viva** (`cenario.js`,
  `montarPixos`): uma folha de 8 colunas com uma célula por muro. O **muro
  livre** é a caiação branca de rolo (o "espaço pra pixar"); o **pixado** é
  o dizer da torcida (os mesmos dizeres de antes), as letras altas e finas
  de pixo com contorno e escorrido, na cor 1 dela, **desbotando** com a
  idade (`PIX.desbota`, 60 dias). O jogo diz de quem é cada muro
  (`jogo3d.js`, `donoDoMuro`, pelo `TO.dominio.muros` da praça na tela) e a
  cada 1,5 s a camada repinta só o que mudou: a pixação nossa pelo cartão
  do bairro, a da IA na virada do dia, o pixo que venceu.
- **No mapa da cidade** (menu → mapa), cada muro é um quadradinho na cor de
  quem pixou (o livre, branco), e a lista de muros do cartão do bairro leva
  a câmera até a parede (`mapa3d.js`, `irProMuro`).
- **O que não mudou**: pixar continua sendo a ação do jogo (o cartão do
  bairro, `TO.dominio.pixar`). Andar com um boneco até o muro e pixar à mão
  não existe.

### A sede da TUF nas três cores

- **A causa**: a paleta da planta (`coresDaTorcida`) usava só as cores da
  torcida nos dados, e a TUF vem com duas (branco e azul). O jogo de feed
  já completava a paleta com as cores do clube (`TO.mundo.coresDaTorcida`);
  a planta não.
- **Agora é a mesma regra**: as cores da torcida, depois o detalhe, depois
  as do clube, **sem gêmeas** (duas cores a menos de 60 de distância RGB
  contam como uma — sem isso o azul do Fortaleza entrava como terceira cor,
  gêmeo do azul da TUF, e o vermelho ficava de fora), até três. A TUF ficou
  branco, azul (#1A40CC) e vermelho (#C8102E): os pilares e os caixilhos da
  fachada saem vermelhos. Vale pra toda torcida da planta: a sede, o bar, a
  loja, a camisa dos bonecos e a bandeira.

### Sem spoiler do resultado

- **A causa**: o jogo de feed põe na fila do dia, logo depois do cartão da
  partida ("Hoje tem…, Iniciar partida", o itinerário), a matéria da Gazeta
  da rodada — e é essa matéria que vira o post do jornal com o placar. No
  jogo 3D o cartão é empurrado pra 75 minutos antes da bola (§ do relógio,
  28/09) e a fila do dia é ordenada pela hora: a matéria, que tinha a hora
  de logo depois da do cartão de antes, passava **na frente** dele, e o
  placar caía de manhã.
- **Agora** (`jogo3d.js`, `horaDaPartida`): quem vinha atrás do cartão e
  ficaria antes dele ganha a hora do cartão. A ordenação é estável, então
  elas seguem atrás — e o cartão é decisão, que segura a fila até o apito.

### A bandeira da sala do presidente

- A bandeira pregada na parede (atrás da mesa do presidente nos níveis 2 a
  5, e na sala do nível 1) era três faixas de cor. Agora é **o pano da
  torcida com o desenho da bandeira da arquibancada e da do mastro**: o
  campo na cor 1, a borda na 2, o filete na 3 e o escudo no meio, com as
  dobras do pano (claro e escuro em colunas e a sombra de cima), pendurado
  num varão de metal com dois suportes (`sede3d.js`, `panoNaParede`;
  `index.html`, `texturaBandeira`). Sem dono, as três faixas de antes.

### As brigas que abriam a foto 2D

O levantamento (todas as cenas de briga do jogo de feed contra o roteador do
3D, `vida3d.js`, `palcoDe`) achou quatro que **sempre** caíam na foto: a
reunião da zona na praça (o print do dono era essa), o ataque à sede rival,
a cobrança no clube e a briga do tutorial. As quatro ganharam lugar no mapa
(`ferramentas/planta_html/briga_lugar.js`), no mesmo molde das outras cenas
da cidade (o tabuleiro de 43 × 29 m na escala da caminhada, a máscara pela
grade do passo, só o chão ligado a quem briga). Quantos de cada lado, quem
tem ficha, o saque, os pontos do bairro e a faixa tomada continuam do jogo
de feed: só muda o chão.

- **A reunião da zona** (`praca-reuniao`: o nosso bote na reunião deles e o
  deles na nossa — o "SEGURAR A RODA"): no **bairro da reunião**. Com praça
  no bairro (as cidades-modelo têm uma em 3 de cada 5 bairros), a zona
  atacada fica em roda em volta do chafariz, no calçadão. **Sem praça no
  bairro** — o mapa das capitais tem uma ou duas praças no mapa inteiro —, a
  reunião é **no cruzamento de ruas mais perto do meio do bairro**
  (`planta.cruzamentoDoBairro`: três ou quatro braços de asfalto de 12 m),
  com a roda no meio dele: ela não atravessa a cidade atrás da praça de
  outro bairro. Quem ataca chega pela rua de uma das pontas (sorteio fixo
  pelo lugar e pela rival) e sai por onde veio; quem está na roda só
  levanta quando o bonde chega perto (`soZona`, 8,5 m na praça e 7 m na
  esquina) e foge pela ponta de lá; a faixa (ou bandeira) da zona atacada
  fica em pé entre a roda e quem chega; a PM vem a pé pelas ruas de través.
- **O ataque à sede deles** (a cena `bar` com o alvo `sede`): na **sede da
  torcida no mapa**. Quem ataca desce a rua da frente (do lado que o
  sorteio dá); quem defende está no portão (na calçada) e no **pátio**; o
  objetivo é o pátio, quando se chega nele pelo portão (senão, o portão). O
  telhado da sede abre e as portas dela ficam abertas enquanto a briga
  dura; a faixa deles fica no muro da frente, do lado do portão ("faixa
  deles rasgada na porta").
- **A cobrança no clube** (`ct`): **o mapa não tem CT**, e o clube mora no
  estádio dele — a caravana chega no **Portão 1 do estádio do clube** (o do
  mandante; sem ele no mapa, o principal), os seguranças estão na boca do
  portão e o objetivo é o portão.
- **O tutorial** (5 × 5 "na praça") e **a briga de praça que não tem
  caminhada pra montar** (o encontro sem o jogo do clube rival): no mesmo
  lugar da reunião (a praça do bairro ou o cruzamento dele), um bonde em
  cada ponta.
- **O `main.js` passa o bairro e a zona da briga** (antes eles se perdiam no
  caminho: `abrirAcaoEmCena`, `abrirAtaqueAoBar`, `abrirConfronto`) e marca
  o tutorial (`tutorial: true`, com a rival).
- **Conferido no jogo 3D** (Fortaleza, TUF, contra a Cearamor): as cinco
  abriram em 3D, sem erro no console — o nosso bote na reunião deles (na
  esquina do José Walter: Fortaleza tem só a Praça da Vila), o bote deles
  na nossa (na esquina do Bom Jardim), a sede da Cearamor (nível 4, com o
  pátio ao alcance), o Portão 1 do Castelão e o tutorial (na esquina do
  Conjunto Ceará).
- **O que segue caindo na foto** (de propósito ou por ora):
  - a briga de qualquer praça **de fora** sem o dia de jogo lá (a sub-sede
    em outra cidade): a praça de fora não está montada em 3D;
  - os **arredores** quando o plano do dia não tem esse rival (o ataque
    surpresa): o cordão da PM é do plano;
  - a **arquibancada** quando o clima esquenta sem caminho de invasão;
  - a **reunião da diretoria** da torcida sem sede (não é briga).
- **Uma diferença de texto**: a notícia da reunião (o Futebol e Porrada)
  continua dizendo "na praça" mesmo quando a briga foi na esquina — o
  texto é o do jogo de feed, pela cena.
