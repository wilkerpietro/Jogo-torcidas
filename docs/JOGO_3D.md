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
