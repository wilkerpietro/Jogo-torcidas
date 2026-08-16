# TORCIDA ORGANIZADA — Estado do protótipo HTML

Documento de passagem. Contém tudo que é preciso pra continuar o trabalho em outra conversa.

---

## 1. Decisão de arquitetura

O jogo **saiu da Unity e foi pra HTML puro** rodando no navegador.

O motivo: a Unity valia a pena enquanto o jogo era mundo aberto isométrico (tilemap, prefabs, sorting layers). Ao cortar o mapa navegável e adotar **cenas fixas**, o que sobrou é um jogo de telas, listas, números e decisões — e nisso DOM/CSS ganha da Unity com folga.

**Divisão técnica:**
- **DOM/CSS** para tudo que é gestão: sede, patrimônio, membros, finanças, calendário, diplomacia, WhatsApp. É ~90% do jogo.
- **Canvas 2D** só para duas coisas: o mapa da cidade em dia de jogo e o combate por discos.
- **JSON** para os dados (156 times, torcidas, bairros, competições).
- **localStorage** para save, com botão de exportar/importar arquivo (o save preso ao navegador é frágil em jogo de temporadas longas).

**Distribuição:** itch.io, sem instalador. Se um dia for pra Steam, usar **Tauri** (webview do sistema, ~10MB) e não Electron.

**Limitações conhecidas do navegador:**
- `requestAnimationFrame` congela quando a aba perde foco → tratar troca de foco como pausa explícita.
- Salvar no meio de uma cena em tempo real quebra estado → bloquear save durante o deslocamento, com aviso.
- Mapas em imagem pesam; usar WebP e resolução moderada (38 cidades × PNG de 4MB é inviável).

---

## 2. Arquivos gerados

Todos em `/mnt/user-data/outputs/`.

| Arquivo | O que é | Status |
|---|---|---|
| **`dia_de_jogo.html`** | **Protótipo principal.** Rua e arredores rodando juntos no mesmo relógio. | Atual, é onde continuar |
| `combate_prototipo.html` | Briga isolada, 12×12, formações, debandada | Validado, mecânicas migradas |
| `deslocamento_prototipo_v2.html` | Mapa da cidade isolado, bondes convergindo | Validado, mecânicas migradas |
| `arredores_prototipo.html` | Arredores isolados (versão em anel, superada) | Obsoleto |
| `deslocamento_prototipo.html` | Primeira versão do mapa (superada) | Obsoleto |

**Só `dia_de_jogo.html` importa daqui pra frente.** Os outros servem de referência histórica.

---

## 3. O que existe hoje em `dia_de_jogo.html`

Um arquivo único, sem dependências. Duas cenas rodando ao mesmo tempo no mesmo relógio, com mini-mapa da outra no canto inferior direito. **TAB** ou clique no mini alterna qual ocupa a tela grande.

### 3.1 Cena RUA (mapa da cidade)

Tamanho lógico 1080×880.

- Malha viária 11×9 nós com Dijkstra simples (`caminho()`), avenidas nas colunas 3 e 7 e linhas 3 e 6 (25% mais rápidas).
- Mar ao norte com faixa de areia, serra/mata ao sul.
- Estádio fora do centro (nó 7,3) com cordão de polícia de raio 150 em volta.
- 4 quarteirões especiais preenchidos: 1 terminal rodoviário + 3 praças.
- 2 sedes sociais desenhadas como uma das casas de um quarteirão comum (sua vermelha, rival azul).
- **Bondes:** até 5 seus + 1 do 2º escalão + até 6 visitantes. Zona com menos de 5 membros funde automaticamente com a vizinha.
- **Estimativa imprecisa:** bonde rival aparece como faixa ("9–27"). **Olheiros** (discos dourados fixos) cravam o número exato e permanente quando o rival entra no raio deles.
- **Viaturas** patrulham de verdade: escolhem destino distante, andam pelas ruas, e ao detectar dois bondes inimigos a menos de 115px dentro de um raio de 270px **largam a patrulha e correm a 2,1× a velocidade** pra cima. Chegando, dispersam: ~9% de prisões dos dois lados, −1,6 moral, rota refeita fugindo, e 20s de imunidade.
- **Avistamento:** quando um bonde seu vê um rival a 150px, **o jogo inteiro pausa** e abre a decisão: partir pra cima ou mudar de rota. Se você estava nos arredores, a vista é puxada de volta pra rua.
- **Comando por clique:** clique num bonde seu (anel dourado pulsando) e depois num ponto do mapa. Ele passa por lá e depois segue pro estádio.
- Dentro do raio do estádio não abre mais decisão — lá é assunto dos arredores.

### 3.2 Cena ARREDORES

Tamanho lógico 1160×820.

- **Esplanada em C**: só asfalto e estacionamento, sem casas. Três retângulos caminháveis (esquerda, topo, direita). O quarteirão do estádio encosta no fundo — **sem passagem por trás, sem flanqueio**.
- Estádio com muro, arquibancada em setores, campo com linhas, refletores, estacionamento interno.
- **6 portões** com vão no muro, bilheteria, gradis em serpentina e fila de torcedor comum (pontinhos claros).
- Bares/botecos com toldo e mesas de plástico, ambulantes com carrinho e fumaça, postes com halo, árvores, ponto de ônibus, camburões da PM.
- **Carros sólidos** nas vagas: disco não passa por cima, contorna. Vira obstáculo tático.
- **Cordão de 13 muretas** atravessando a esplanada de cima, com 5 policiais entre elas que correm pra tapar buracos.
- **Spawns:** sua torcida no pé da esquerda, 2º escalão no meio da esquerda, visitante no pé da direita.

### 3.3 A costura entre as duas

Quando um bonde termina o trajeto, **deixa de existir na rua e vira discos no portão dele**, com o efetivo e a moral que sobreviveram à viagem. Um bonde que apanhou na rua chega menor e desanimado.

Avisos cruzados aparecem numa faixa vermelha embaixo do mini-mapa (chegada, PM dispersando, cordão rompido) sem tirar o jogador do que está fazendo.

O painel lateral "Na rua" lista todos os bondes com estado e efetivo; clicar num seu já leva pra visão da rua com ele selecionado.

### 3.4 Combate nos arredores

- Discos com Força, Defesa, HP, moral individual. Raio 7 (líder 9) — proporcional ao estádio.
- **Formações** (teclas 1–4): Bonde, Muralha, Investida, Espalhar. Slots relativos ao líder, que o jogador move com WASD.
- **Arremessos:** Q pedra (infinita), E bomba (4 no estoque). Miram no rival mais perto ou na mureta.
- **Ao romper 35% do cordão:** atenção policial vai a 100 e **6 policiais extras entram de uma vez** na brecha.
- **Recuo (tecla R):** seu pessoal larga a briga e volta pra entrada, 15% mais rápido, sem revidar. Aperta de novo pra voltar.
- **Recuo automático da IA:** 2º escalão e visitantes recuam sozinhos quando atenção >78 com polícia em cima, ou moral média <6. Voltam depois de 9s se esfriar.
- **Debandada** a 45% de baixas: o lado inteiro corre pra fora.
- **Prestígio final** = 2×caídos rivais − 1,5×seus − 2×presos + 6 se rompeu o cordão − 0,5×quem não chegou a tempo.

---

## 4. Parâmetros ajustáveis (objeto `P`, com sliders na tela)

Os valores abaixo são de uma versão antiga; os que valem hoje estão em
`TO.diaJogo.P` (js/diajogo/combate.js) e saíram de calibrar na bancada:
velocidade 60, dano 1.0×, grade 420, cassetete 18, debandada 30%, carga 7s,
tropa 8 PM, o bonde aguenta 10s, noite tranquila 50%, pedra 2.0s / 170px.
Efetivo é o único que não é padrão de verdade — no jogo vem da escalação
da semana e do tamanho do bonde rival.

```
ateJogo   200   segundos até a bola rolar
minutos    42   minutos de jogo cobertos pelo trajeto
duracao    70   segundos do trajeto mais longo
efetivo    52   seu total de membros
rivais      4   caravanas visitantes
policiais   3   viaturas na rua
olheiros    2   olheiros posicionados
visao     150   px de alcance de avistamento
contato    44   px pra fechar a briga na rua
precisao   50   % de erro da estimativa sem olheiro
velocidade 78   px/s dos discos
dano      1.5   multiplicador global
muretas    13   segmentos do cordão
vidaMureta 420  resistência de cada mureta
pmCordao    5   policiais no cordão
forcaPM    16   dano do cassetete
debandada  45   % de baixas que dispara a correria
```

---

## 5. Calibragem pendente

Rodei simulações sem navegador (Node com stubs de DOM/canvas) e o que ficou em aberto:

- **O cordão pode estar duro demais.** Com 13 muretas, só 1 a 5 caem sozinhas numa partida e quase ninguém se pega. Romper virou conquista, o que é bom, mas talvez esteja inalcançável pro jogador mesmo empurrando. Mexer em `vidaMureta` e `dano`.
- **Prestígio** variou de −13 a +45 entre partidas nas versões anteriores — variação boa, mas precisa reconferir com a esplanada nova.
- Recarga de pedra em 2s pode ficar frequente demais com efetivo alto.

---

## 6. Ideias levantadas e ainda não implementadas

**Fila do torcedor comum como recurso.** Hoje os pontinhos na fila são enfeite. Se atravessar a fila atrasasse o bonde e derrubasse a Satisfação (que o GDD já tem), o jogador escolheria entre o caminho rápido e o caminho limpo — e a PM reagiria mais rápido a confusão perto dela.

**Entrar no estádio por portão, não por botão.** Hoje ENTER encerra de qualquer lugar. Se cada disco precisasse chegar fisicamente ao portão, romper o cordão ganharia risco real: você se afasta da sua entrada e, se a PM carregar, seu pessoal está longe demais pra escapar.

**Prestígio dividido em duas contas** — uma com o rival, outra com o 2º escalão do próprio clube. Dominar os arredores enquanto o outro escalão apanha deveria subir sua posição na hierarquia interna. É a ideia mais forte que apareceu nas conversas e ainda não existe em nenhum número.

**Custo de transporte do bonde** (van, ônibus fretado, ou a pé de graça e chegando tarde) — daria uma terceira variável à escolha de rota e ligaria o sistema financeiro ao dia de jogo.

**Divisão pra cercar dando função de combate à Diretoria** — cada grupo dividido precisa de uma âncora; com 2 Diretores divide em dois, com 4 divide em três. Se o Diretor âncora cai, o grupo perde coesão e volta pro líder.

**Escolta do aliado no mapa da cidade.** A decisão de escoltar já existe na Gestão, mas
ela só ganha corpo quando o mapa da cidade voltar: os membros da nossa torcida saem da
sede **junto com os do aliado**, num bonde só, a caminho do estádio. E quando o jogo é
*contra* um aliado, o bonde precisa se dividir — deixar a torcida aliada sozinha
atravessando a cidade é perigoso demais. Guardado para quando o mapa entrar.

**Personalidade dos pontos de encontro** — terminal (fechado, PM chega rápido), praça (aberto, briga espalha), avenida (larga, favorece linha). Hoje todos funcionam igual.

---

## 7. Decisões de design já fechadas (não reabrir sem motivo)

- **Cenas fixas, não mundo aberto.** ~8 templates: sede, bar/loja, arredores do estádio, estrada, alvo comercial genérico (4 skins), praça, delegacia, CT do clube.
- **1 a 3 ações por semana**, definidas pelo nível da sede. Upgradar a sede compra tempo, não só dinheiro.
- **NPCs em combate são discos** estilo futebol de botão, com nome em cima. Bonecos exigiriam sprite por variação/ação/direção.
- **Duas lojas separadas:** clandestina (consumíveis: bomba, rojão, sinalizador — pedra é infinita e fraca) e de materiais (patrimônio: bambu, faixa, bandeirão, bateria — pode ser roubado em derrota).
- **A briga termina por quebra de linha e debandada**, não por aniquilação.
- **Líder é âncora física**, não cursor de comando. Formação é a decisão principal.
- **Número de rival é estimativa**, não valor exato. Olheiro estreita a margem.
- **3 layouts de mapa de cidade** (Grande/Médio/Pequeno) reutilizados pelas 38 cidades; o que muda é onde ficam sede, subsedes e estádio.
- **Nunca dois jogos do mesmo time no mesmo dia.**
- **Em jogo do rival** o jogador pode ver o deslocamento deles e colocar um bonde na rua pra emboscar.
- **A briga não depende do dia de jogo.** O mapa da cidade mostra **em tempo real onde a torcida rival está**, e o jogador pode buscar o enfrentamento em qualquer ponto — o que abre a cena da rua (ou a cena do alvo, conforme o lugar). Nos arredores do estádio o cordão separa mandante e visitante quase sempre; é o mapa que garante que sempre existe um jeito de brigar sem depender de romper grade.
- **Como visitante**, sai da subsede de um aliado (se houver) ou da entrada da cidade; mapa hostil com mais bondes rivais.
- **A cidade não tem rio nem ponte** — no máximo praia ao norte.

---

## 7.5 O protótipo antigo (`legado/unity/`)

O autor subiu o protótipo anterior — `index.html`, `app.js` (8 mil linhas), `data.js`
(22 mil) e `styles.css`, mais dois arquivos C# da era Unity. Foi lido inteiro. O que
valia a pena já veio pra cá:

- **o mapa da cidade em canvas** — o problema difícil já estava resolvido lá;
- **os 76 estádios com bairro e capacidade**, que a planilha não tem;
- **a evolução de força dos clubes entre temporadas** (com a média corrigida).

O que **não** veio, e por quê:

- `BrasileiraoManager.cs` / `BrasileiraoUI.cs`: quatro divisões e uma copa. O nosso
  `js/mundo/competicoes.js` já faz dezesseis competições com mando, rivalidade e grade
  de horários. Não há o que aproveitar.
- O calendário e o financeiro do protótipo: mesma ideia, versão mais antiga que a nossa.
- `HISTORICO_INICIAL`: 90 anos de campeões e vices do Brasileirão A/B/C/D em texto solto.
  Serve pro Salão da Fama quando essa tela existir; fica de reserva no legado.
- Os painéis de WhatsApp, Notícias e Conquistas: existem lá e são placeholders aqui.
  Valem uma leitura quando essas telas entrarem na fila.

## 8. Onde o trabalho está

**Feito** (repositório `Jogo-torcidas`, branch `claude/project-continuation-vgatml`):

- Cena dos arredores sobre foto aérea, com malha de caminhabilidade tirada da própria
  imagem, campo de fluxo por portão, grades rompíveis e grades de fila.
- Costura com a gestão: membros reais viram discos; feridos e presos voltam pra ficha.
- Dados importados: 108 times, 140 torcidas (8857 relações), 30 praças, 348 bairros.
- Telas de gestão no visual dos mockups: Início, Torcida, Financeiro, Diplomacia.
- **Ações da semana** (GDD §3.1 e §10) e **fechamento semanal** (GDD §7): orçamento de
  ações pelo nível da sede, recrutamento pela fórmula do §6.2, mensalidade, bar, insumo,
  manutenção, caravana e a debandada por caixa negativo.
- **Copa do Brasil** (GDD §18.5, com o formato do autor): 88 clubes na primeira fase
  (todos menos a Série A, com B e C mandando em casa), 64 na segunda com a entrada da
  Série A, 32 na terceira, oitavas a semi em ida e volta e final em campo neutro.
  Semanas 22, 26, 30, 34+35, 39+40, 44+45, sempre na quarta; a final fecha a temporada
  na semana 52, no domingo.
- **Mando de campo** com duas regras duras: rival direto nunca manda no mesmo dia que o
  seu (Fortaleza joga fora quando o Ceará recebe) e ninguém faz mais de três jogos
  seguidos em casa na mesma competição. Quando dividir o fim de semana é inevitável, um
  joga sábado e o outro domingo. Rival direto sai do grafo de torcidas, em pares
  exclusivos. Medido: zero conflitos e pior sequência 3, nas dezesseis competições.
- **Competições e calendário** (GDD §18): 16 competições montadas dos próprios dados de
  times.js — 11 regionais e estaduais de janeiro a março, depois o Brasileirão das séries
  A a D até dezembro. Uma rodada por semana, resultado por Poisson sobre a qualidade dos
  clubes, tabela com critérios de desempate, mata-mata e campeão. O jogo da semana da
  torcida sai da tabela, não de sorteio, e semana sem jogo é folga. Sobe e desce na virada
  do ano, tanto no Brasileirão quanto entre Paulistão/A2 e Nordestão/Nordestão B.
- **Rotina semanal**: cada dia da semana pode ter uma ação padrão, aplicada sozinha
  quando o dia passa. Nunca fura o orçamento semanal, e dia de jogo e de caravana são
  ignorados.
- **Gestão inteligente**: a tela é uma sequência, não um formulário. Em cima, a faixa do
  próximo jogo do nosso time — confronto, competição, rodada, dia, hora, estádio, mando e
  quanta gente sai de casa. Abaixo, os passos aparecem conforme se escolhe: **ir em paz**
  encerra na formação da saída; **atacar** (ou **trair**, quando todas as torcidas do
  outro lado são aliadas) pergunta **qual** torcida, depois **como** — só nos arredores
  do estádio ou na ida ao estádio. Escolhida a ida, abre o **mapa do olheiro**: a sede
  deles, a nossa, o estádio e as duas vias que ligam um ao outro, com os pontos de
  interceptação clicáveis. O olheiro diz em quantos bondes o rival deve se quebrar, o
  tamanho de cada um e por onde acha que passam; o ponto escolhido mostra a chance de
  interceptar. Só então vêm as bombas e a formação da saída. Depois disso, os aliados que
  jogam na praça (com nível de recepção padrão salvável) e os **outros jogos da cidade**,
  onde dá pra cair em cima de torcida de fora de passagem **ou dos nossos próprios rivais
  indo pro jogo deles** — também com olheiro, modo e ponto. Fecha com a caravana (quantos
  embarcam e por qual estrada, tirada do grafo das rodovias) e o resumo, que só libera o
  botão quando não falta decisão. Plano padrão de jogo em casa e de viagem para quem não
  quer decidir toda semana. A tela de Início tem o cartão de **Avisos** com o que está
  esperando decisão.
- **Tensão** (por par de torcidas, 0–100, quatro faixas): atacar dispara, semana quieta
  esfria, e a relação só volta ao normal quando o clima baixa. Acima de 45 a torcida pode
  atacar a sede, o bar, a caravana na estrada ou o bonde nos arredores. As outras 138
  torcidas têm caixa e efetivo próprios, brigam e fazem as pazes entre si, e é isso que
  alimenta o noticiário.
- **Efetivo real de cada torcida**: os 20 a 250 membros e a divisão de cargos vêm da
  fonte, e a sede começa no nível que comporta esse efetivo.
- **Financeiro ligado à Gestão**: caravana, recepção de aliado e investida saem de
  `planejamento.compromissos()` e aparecem no Financeiro e no fechamento com valor e
  estado de pagamento. Quem cobra continua sendo quem sempre cobrou — o fechamento só
  lê a lista, nunca relança, pra ninguém pagar duas vezes.
- **Treino sorteado por semana**: a fila se refaz sozinha no virar da semana e prioriza
  quem ainda está longe do teto do cargo. A aba Treinamentos mostra o plano do GDD §5.4 —
  teto por cargo, quantas sessões faltam pra encher e quem já chegou no limite.
- **Recrutamento pela praça** (GDD §6.2): a base é o torcedor do clube que mora na cidade
  e ainda não é de organizada nenhuma, contado pelo efetivo de agora e não pela planilha —
  recrutar encolhe o bolo. O teto por campanha soma o nível da sede ao tamanho da praça,
  então Fortaleza rende mais que o interior e São Paulo rende mais que Fortaleza.
- **Mapa da cidade** (GDD §13), portado do protótipo antigo em `legado/unity/`: os bairros
  da praça em cruz (Norte em cima, Sul embaixo, Oeste e Leste nos flancos), doze
  quarteirões por bairro e dez lotes por quarteirão — 1.920 lotes num mapa grande, numa
  superfície de canvas só, porque em DOM isso não fecha. Cada bairro pinta pela classe
  social, cada casa tem telhado sorteado por hash do endereço, e em cima disso ficam os
  estádios, a sede de toda organizada da praça (com o bar de cada uma em outra zona), o
  nosso patrimônio e o comércio neutro do GDD. Filtros por tipo, zoom de 60% a 200% e
  hover que diz o que tem em cada quarteirão. O desenho é determinístico: reabrir o save
  devolve a mesma cidade.
- **Estádios com bairro**: `dados/estadios.js`, importado do protótipo antigo, dá endereço
  às 76 praças de jogo. Clube sem estádio na fonte (41 dos 108) ganha um bairro estável,
  sorteado por hash do nome do estádio.
- **Fator Torcida no placar** (GDD V3 §9.5, o do Unity): o MatchSimulator soma um bônus
  feito de `Público×0,40 + Faixas×0,25 + Bateria×0,20 + Moral×0,15`, cada parcela de 0 a 1.
  Público é o percentual de membros que saiu de casa — é o que liga a decisão de caravana
  ao gramado. Faixas e bateria vêm do teto da sede (1/3, 2/5, 3/8, 5/12, 10/20 por nível) e
  encolhem quando o bonde apanha na rua. O GDD não diz quanto vale o bônus; aqui ele vale
  até 8 pontos de qualidade, com 0,5 como referência neutra. Medido em 4.000 partidas
  contra um rival um pouco melhor: 1,53 ponto por jogo com a torcida vazia, 1,64 com ela
  mediana, 1,77 com ela cheia.
- **Satisfação do torcedor comum** (GDD V3 §21): vitória +0,5 a +1,0, derrota o mesmo em
  negativo, e clássico contra time da mesma praça vale ±3 a ±5. A cada rodada entra o
  puxão da classificação — a diferença entre a posição esperada pela força do elenco e a
  real, travada em ±1 por rodada. Título +5, vice +2, rebaixamento −3. As quatro faixas do
  GDD decidem quanta gente topa entrar na organizada (2/5/15/30%) e quanta vai ao estádio
  (20/40/60/80%), com a catraca do estádio como teto. Uma correção necessária: com essas
  faixas a satisfação colava em 20,0 e travava — medido; agora ela volta 6% em direção ao
  meio a cada semana, e em três temporadas oscila entre 5,5 e 20 com média 11,6.
- **Mapa vivo em dia de jogo**: a malha de ruas sai da própria geometria do mapa — as
  avenidas entre bairros, as ruas internas entre quarteirões e o beco no meio de cada
  quarteirão, entre as duas fileiras de lotes. São 572 nós numa praça grande, 252 deles
  becos, montados em 2 ms, com caminho mínimo de ponta a ponta em 2 ms. Em dia de jogo os
  bondes saem da sede e das subsedes, a torcida visitante entra pela rodovia em pontos
  diferentes da orla e todos caminham até o estádio, cada um com hora de saída própria.
  O olheiro se posiciona com um clique e revela quem passa no raio dele. Quando dois
  bondes hostis se encostam o relógio para: na rua o raio é curto, nos arredores do
  estádio o cordão aperta a multidão e ele triplica.
- **Cenas de praça e rua** (GDD §12): a dos arredores nasceu de uma foto aérea; estas duas
  são desenhadas em canvas e a geometria sai da MESMA lista de blocos que a pintura, então
  não existe muro que só apareça na tela. A praça tem calçada portuguesa em onda, coreto
  oitavado no meio, canteiro de mangueira e ipê com gradil que quebra e vira arma, igreja
  com cruz, banca de jornal, quiosque, boteco de toldo listrado com mesa de plástico na
  calçada, carro no meio-fio pintado de preto e branco e bandeirinha de festa junina de
  poste a poste. A rua é um corredor: asfalto remendado com buraco, um trecho de
  paralelepípedo, calçada estreita, casas com laje, caixa d'água azul e varal de roupa,
  muro pichado, caçamba de entulho, lombada e poste com gambiarra. Nas duas, cada bonde sai
  pela ponta oposta à sua — ninguém atravessa sem esbarrar.
- **Ícones no mapa**: os pinos deixaram de ser letra. Estádio é a elipse da arquibancada,
  sede é bandeirão no mastro, bar é copo americano, loja é camisa, subsede é prédio com
  janela, mercadinho é carrinho, posto é bomba, joalheria é brilhante, roupas é cabide,
  banco é frontão de colunas e hospital é cruz — todos desenhados em vetor, legíveis a 12
  pixels.
- **Força dos clubes evolui** (portado do protótipo antigo, com dois consertos): a posição
  final de cada competição move a qualidade do clube, e a evolução vive no save, não em
  `times.js`. Duas correções que só apareceram medindo:
  1. As faixas herdadas têm média positiva — em cinco anos os 108 clubes chegavam no teto.
  2. Centrar pela média geral não bastou: a tabela é muito mais generosa na Série A (16 dos
     20 com média positiva) que na D (teto de +2). Em vinte anos isso virava uma
     aristocracia congelada — medido: 9 clubes da A no teto, 30 da D no piso, Série A
     ganhando +12,4 de média enquanto todo o resto perdia.
  A resposta foi centrar **por competição** (cada divisão é soma zero dentro de si, e o
  movimento entre divisões fica por conta do acesso) e somar uma **gravidade de divisão**
  de 12% ao ano em direção ao nível típico de onde o clube está jogando — gigante
  rebaixado perde elenco, pequeno que sobe recebe dinheiro. Medido em 20 temporadas:
  nenhum clube no teto, 8 no piso, 56 dos 108 variando dentro de ±3, e histórias reais
  nas pontas (Central 6→32 subindo da D à A; Santos 34→13 caindo à B).
- **Planta do mapa em PNG**: `TO.mapa.paraImagem()` rende a cidade num canvas fora da tela
  no tamanho que se pedir, sem pinos e sem nome de bairro — que é o que um upscaler
  estraga. O botão fica na barra do Mapa, e `img/cenas/planta-fortaleza-2048.png` é a
  primeira saída, no mesmo caminho que a foto dos arredores seguiu.
- **Pinos numa camada por cima**: o ponto de interesse era desenhado no meio da varredura
  dos lotes, então o lote vizinho passava por cima dele. Agora o terreno fica na varredura
  e o pino sobe pra uma camada desenhada depois de todos os bairros.
- **A arte no lugar da planta**: `img/cenas/cidade_fortaleza.webp` é agora o mapa de
  Fortaleza, e `ferramentas/importar_mapa_cidade.py` lê a imagem em vez de inventar
  geometria. Da arte saem quatro coisas, todas em `dados/cidade_mapa.js` (35 KB): a
  **máscara de rua** num raster de 10 px (5.478 nós andáveis, com meio disco de folga),
  os **16 bairros** redistribuídos por k-means e casados com as zonas por atribuição
  húngara sobre o custo angular, os **lotes com frente pra rua** de cada bairro (65 a 85)
  e os **três gramados** desenhados. `TO.mapa` ganhou o caminho da arte — `arteDe`,
  `decodificar`, `modeloDaArte`, `desenharArte`, `bairroEm`, `andavelEm` — e o modelo
  antigo continua servindo as praças que não têm imagem. Nome de bairro entra a 40% de
  opacidade e o contorno a 30%: a cidade é a foto, o rótulo é só orientação.
- **Estádio no gramado certo**: os três estádios de Fortaleza (Castelão, Presidente Vargas
  e Felipe Santiago) moram, na tabela, em bairros que a arte não conhece — o desenho veio
  antes. Casar por nome deixava dois pinos em lote de casa e dois gramados vazios. Agora
  o casamento é por porte, com preferência pra quem já bate o bairro: campo maior fica com
  o estádio de maior capacidade, e o bairro do pino passa a ser o do gramado, que é onde
  ele de fato está.
- **Filtros fora do mapa**: o painel de tipos era um cartão flutuante sobre o canto
  noroeste da cidade. Com planta esquemática isso não custava nada; com a arte, tapava
  bairro. Agora ele fica na margem do visor, grudado na borda quando o mapa é arrastado.
- **Briga de rua sabe onde caiu**: `localDe` escolhia praça em qualquer cruzamento de
  quatro pontas, e na malha da arte isso era 29% da cidade. Agora mede a **largura do
  lugar** — quantas células andáveis cabem numa janela 5×5 em volta do nó. Rua de
  quarteirão fica na casa dos 11 a 19; largo e rotatória passam de 23. O corte em 23 dá
  4% de praça, 19% de beco e o resto rua, com os arredores do estádio mandando dentro dos
  70 pixels do gramado. As três cenas foram conferidas abrindo cada uma pelo mapa. O
  painel do dia de jogo passou a dizer onde a briga é ("Na praça", "Na rua") e o botão do
  portão vira a saída da cena quando não existe estádio pra entrar.

- **As três ações que faltavam ganharam cena** (GDD §4.1). Cada uma abre a mesma tela do
  dia de jogo num cenário próprio, e o que a noite deu vira caixa, tensão e cadeia quando
  a tela fecha:
  - **Bar da rival** — esquina de bairro, fachada nas cores deles, mesa de plástico no
    deck, sinuca no salão, gradil de calçada que quebra e engradado de cerveja na ponta.
    O objetivo é a porta do bar. Ganhando, sai a gaveta deles (R$ 60 por cabeça no bar,
    R$ 30 na sede) mais um naco do caixa, e a moral deles cai 3.
  - **Alvo comercial** — rua de centro com joalheria de porta de aço, agência com
    vestíbulo de caixa eletrônico, vitrine de loja, guarita e carro-forte. Quem enfrenta
    é segurança particular, e a PM tem quatro postos porque comércio tem botão de pânico.
    Rende de R$ 500 a R$ 9.000 conforme o tipo, descontado por quem caiu antes de
    carregar; a polícia esquenta de 1,0 a 3,5 mesmo dando certo, e o prestígio **cai**:
    a rua não aplaude assalto.
  - **CT do clube** — muro alto, portão de chapa, estacionamento de saibro, ônibus da
    delegação, alambrado, campo de treino com faixa de cortador, cone e manequim de
    barreira. Chegar no gramado põe o elenco sob **cobrança** por 4 semanas (+3 de
    qualidade); ser barrado no portão vira vexame (−2). Nos dois casos a relação com o
    clube é gasta — e é ela que acaba, não a paciência.
  A escolha do alvo vem do mapa: os pinos de sede, bar e comércio que o jogador já vê.
  A lista mostra bairro, tensão e efetivo (ou quanto rende e quanta segurança tem),
  no máximo dois por tipo pra não virar catálogo de seis joalherias.
- **Bancada de cenas** (`arredores.html`): uma aba por cenário — arredores, praça, rua,
  bar, comércio e CT. Trocar de aba remonta a noite ali, com o efetivo típico daquele
  tipo de briga. É a mesma ponte do jogo, então serve pra calibrar sem abrir save.
- **Praça e rua refeitas pro que elas são**. A praça virou um largo: quadra aberta de
  calçada portuguesa, coreto no meio, **duas** ilhas de canteiro só (o miolo fica limpo,
  que é onde a briga acontece), quiosque de toldo listrado, banca e boteco nas bordas, e
  a rua contornando os quatro lados com uma transversal chegando no meio de cada borda —
  **quatro esquinas, uma por lado**. A rua virou larga: pista de mão dupla, calçada larga
  dos dois lados e uma transversal em cada ponta, com a calçada dobrando a esquina — duas
  esquinas de cada lado, então dá pra flanquear em vez de bater de frente.
- **Tropa de choque é operação montada, não é toda briga.** A cena diz se tem
  (`tropaChoque`): arredores do estádio e comércio têm — um é cordão planejado, o outro
  tem botão de pânico. Em praça e rua quem responde é a PM que já estava ali: a linha
  avança e aperta, mas ninguém manda batalhão. O HUD passou a dizer "PM EM CIMA" em vez
  de contar o relógio de uma tropa que não vem.
- **A rua é a do bairro onde a briga caiu.** Esbarrão no Pirambu não abre a mesma tela
  do esbarrão na Aldeota: `Favela` e `Classe Baixa` abrem a rua de periferia, `Classe
  Média` abre a rua de classe média (calçada de bloquete, casa de muro baixo com garagem
  e jardim, predinho de três andares, padaria na esquina, árvore nova no berço de
  concreto, vaga pintada) e `Nobre` abre a de classe alta (calçada de pedra clara com
  faixa de grama, mangueira grande, muro alto com cerca elétrica, guarita no portão,
  torre com piscina e quadra na cobertura, casa com piscina no fundo). As três têm a
  **mesma planta de pista e calçada** — muda o que está construído e o mobiliário do
  meio-fio, então trocar de bairro muda o cenário e não a tática. Medido nos 5.478 nós
  de rua da cidade: 65% periferia, 17% classe média, 15% nobre, 4% praça, 2% arredores.
- **Prompt das cenas** (`img/cenas/PROMPT-PRACA-RUA.md`): um prompt por imagem — praça,
  rua de periferia, rua de classe média, rua de classe alta e o bar da rival —, com as
  plantas `planta-*-2048.png` tiradas do próprio jogo pra servir de base de
  img2img/ControlNet. O do bar é o único fora do padrão: **a laje dele sai**, porque a
  ação de atacar a sede termina dentro do salão e não dá pra jogar o que não se vê —
  telhado aberto só no bar, vizinho nenhum, senão laje de estranho vira chão de andar.
  **As quatro já voltaram e estão no jogo**: as cenas desenhadas viraram rascunho e o
  que se vê em briga de rua é foto. Medido no import das duas últimas: classe média 47%
  de chão (pista, as duas calçadas de bloquete e as transversais das pontas), classe
  alta 32% — lá a calçada é larguíssima mas o quarteirão é murado de ponta a ponta, e
  muro alto de condomínio é parede mesmo.
- **As quatro cenas de fora já são foto** (`ferramentas/importar_cena_foto.py`). O importador faz
  duas coisas com a imagem que volta: encaixa na tela de 1536×1024 sem distorcer nem
  cortar largura — as fotos vêm em 16:9, então sobra faixa em cima e embaixo, preenchida
  com tom de quintal, porque cortar de lado tiraria justamente as transversais das
  pontas —, e separa chão de construção pra virar máscara de colisão. Cor sozinha não
  resolve: laje de casa tem o mesmo cinza da calçada. O que separa é conectividade
  (a partir de sementes na pista e no largo) mais, na cena de rua, um corredor
  geométrico — pista com as calçadas e as duas transversais, o resto é telhado. Medido:
  praça 71% de chão, rua 33%, classe média 47%, classe alta 32%, ninguém nascendo
  dentro de parede e ninguém atravessando parede depois de 45 s de briga nas oito cenas. A prova visual de cada máscara fica em
  `img/cenas/_ref_mascara_*.png`. Quando a cena tem foto, o desenho procedural sai
  inteiro (bloco, enfeite, gradil) e os marcadores são puxados pro chão mais perto —
  a foto nunca cai exatamente onde a planta imaginou.
- **O que a mão pinta manda mais que o importador** (`dados/cenas_editadas.js`). O corte
  por cor acerta o grosso e erra o fino, e sempre pro mesmo lado: na rua ele deixou só o
  asfalto, e a calçada larga — que é justamente por onde se escapa sem sair do quadro —
  ficou de fora. Abrir a cena, apertar **F2**, pintar a malha e clicar em *Exportar
  arquivo* devolve agora o remendo da cena que está no ar, pronto pra colar nesse
  arquivo: fora dos arredores o editor não escreve mais o `cena_arredores.js` inteiro
  nem carrega a imagem junto. Ele entra depois de `cenas_foto.js` (que é gerado e se
  perde na próxima importação) e sobrescreve só o que está escrito — pôr só `mascara`
  mantém spawn, entrada e posto de PM onde estavam, e o que não veio da mão reencosta
  na malha nova. **As quatro cenas de foto passaram por aí**, e o erro do corte foi
  diferente em cada uma: na rua de periferia faltava chão (33% → 43%, a calçada inteira
  voltou), na praça sobrava (71% → 61%, o corte tinha vazado pra dentro do quarteirão),
  na de classe média era vazamento fino pelo portão — entrada de garagem e jardim de
  frente entrando como chão (47% → 44%) — e na de bairro nobre o corte encolheu: pedra
  clara e faixa de grama saíram junto com o muro, e ali a calçada é metade da cena
  (32% → 39%, 1.723 células abertas e nenhuma fechada). Marcador da mão que caia em parede depois da repintura
  reencosta no chão mais perto, e reencostar exige a maior ilha de chão: poço de uma
  célula solta no meio de telhado é bonde nascendo emparedado sem nunca tocar muro.
  O remendo entra por `python3 ferramentas/colar_remendo.py remendo.txt`, que troca
  a entrada no lugar e reescreve no formato da casa — colar na unha já derrubou o
  arquivo uma vez, por vírgula faltando entre duas entradas. Prova da máscara que
  vale de verdade: `python3 ferramentas/prova_mascara.py`.
- **O bar da rival é foto, com o salão aberto** (`Aerial_view_of_roofless_bar…jpeg`). A
  imagem veio com a planta trocada em relação ao desenho — rua principal embaixo e uma
  vertical de cada lado do bar, que ficou no meio do quadro —, então as marcações foram
  reancoradas na geometria da foto e moram em `cenas_editadas.js`: atacante desce a
  vertical oeste (404,140 e 404,270), defensor nasce no salão (770,420 e 872,592), alvo
  no fundo do salão (800,368) e a zona que acorda a casa na calçada da frente (740,720).
  Duas coisas quebradas apareceram no caminho: o `sobreFoto` era uma chamada escrita à
  mão por cena e a do bar não existia — o bar rodou uma sessão inteira no desenho sem
  ninguém notar; agora a foto e a mão varrem o que existir. E o corte subiu no telhado do
  quarteirão inteiro (nove linhas abrindo de ponta a ponta), porque laje de vizinho é
  cinza igual asfalto **e** encosta na rua pela esquina — daí o `recorte` do importador,
  irmão declarado do `corredor`: quatro retângulos em fração da tela, e fora deles não há
  chão. Medido: 60% → 54% de chão, 0% de telhado fora dos retângulos. Depois disso a
  malha ainda passou pelo pincel, que num salão pequeno pesa mais que em rua: mesa,
  balcão e freezer são obstáculo de verdade e o degrau da frente tinha fechado a
  entrada — 54% → 49,6% em duas passadas, a segunda fechando balcão, freezers e a copa
  do fundo. O alvo era o balcão e o balcão virou parede, então ele reencostou 24 px pro
  chão em frente (800,392), que é onde se chega de verdade. Medido na invasão: casa
  acorda aos 5,5 s pela zona, 16 atacantes chegam no balcão, 14 defensores caem e
  ninguém atravessa parede.
- **O bar da rival virou salão, e a casa não sabe do ataque antes da hora.** A cena
  ganhou a esquina que o prompt promete — transversal descendo da borda de cima — e o
  bar deixou de ser bloco maciço: agora são quatro paredes com um vão de porta e, dentro,
  balcão, sinuca, dois freezers e pilha de engradado como obstáculo. A torcida atacante
  nasce na ponta norte da transversal e o alvo mudou de lugar: era chegar na porta, o que
  com o salão caminhável seria tomar a calçada e chamar de bar; agora é o **balcão**, no
  fundo. Quem defende nasce dentro, de guarda — não anda pra lugar nenhum enquanto a casa
  não acorda, senão o dono do bar sai andando pro fim da rua no primeiro segundo, que é o
  padrão de quem não tem inimigo à vista. O despertar é uma zona na frente da porta
  (`D.gatilho`), com linha de visão como segundo caminho e não como o único: `A.livre()`
  não atravessa parede, então de dentro do salão só se enxerga quem está no vão — medido,
  a visão do fundo pra rua dá `false` e pela porta dá `true`. Sem a zona a casa só
  acordaria com o invasor em cima; sem a visão, uma entrada pelos fundos pegaria todo
  mundo de costas pra sempre. Medido numa invasão inteira: casa acorda em 2,6 s pela zona,
  os 14 defensores começam e ficam dentro até lá, 7 atacantes chegam no balcão e ninguém
  atravessa parede em 45 s.
- **Debandar é sair da cena, não recuar pro spawn.** Quem corre agora corre até sumir:
  o destino é a boca de rua mais perto, e as bocas não se marcam à mão — saem da própria
  malha (`A.fugas`), lendo o chão que encosta na borda da mancha andável, o que faz elas
  caírem sempre em cima de rua por construção. A borda é a da mancha e não a da imagem,
  senão a faixa de quintal da foto 16:9 esconderia as transversais que sobem pro topo.
  Medido: 5 a 9 bocas por cena, todas em chão livre. Duas armadilhas apareceram: o disco
  escolhia a boca mais perto **em linha reta** e ia empurrar muro a vida toda (dez presos
  no CT, onze nos arredores), então agora a escolha é pela boca mais perto **que tem
  rota**, com o campo de fluxo respeitando grade — cerca de CT e cordão de PM fecham
  caminho de verdade. E o gargalo do portão não cabia dez discos dentro do raio marcado,
  daí os 46 px de folga na chegada. **Nos arredores é diferente de propósito**: ali fugir
  é entrar, então o destino é o portão do próprio bonde e quem chega conta como quem
  entrou; se o cordão cortar a rota até o portão, aí sim cai pra rua. Medido nas oito
  cenas: todo mundo sai, sobra o líder (que é do jogador e não foge sozinho).
- **O outro lado também tem pedra e bomba.** Um disco do bonde rival — o mais forte —
  vira o braço deles, com a mesma arma, a mesma física e o mesmo alcance do jogador. O
  que muda é a decisão: bomba só de perto (60% do alcance) e com quatro ou mais no raio,
  pedra no resto, mira torta (22 px, 34 na bomba) e cadência mais lenta. Ele começa com
  8 s de espera porque nos primeiros segundos o bonde ainda está em coluna no spawn e uma
  bomba ali derrubava doze de uma vez — foi medido, 15 caídos aos 18 s, antes de o jogador
  ter chance de abrir a formação. O estoque é metade do seu, no mínimo um.
- **Nos arredores o humor é de cada bonde, não da cena.** Ali não há dois lados numa
  briga marcada: há vários bondes chegando pro mesmo jogo, cada um com a sua intenção.
  A noite **sempre** começa tranquila — ninguém desce do ônibus batendo —, e cada bonde
  que não é o seu sorteia, pela **tensão** entre as torcidas, se veio em paz ou disposto
  a procurar rival: 3 + tensão×0,85 por cento de chance, medido em 4% na Calmaria, 38%
  no Atrito, 65% em Fervendo e 88% na Guerra. Quem veio disposto ainda espera entre 20%
  e 55% do caminho até a bola rolar antes de ir — e vai mesmo, andando até o ponto do
  rival por campo de fluxo, porque só ficar "disposto" não encontrava ninguém: sem isso
  ele caminhava pro próprio portão e a hostilidade morria sem acontecer.
  **O seu bonde fica de fora do sorteio**: ele te segue, briga onde você brigar, e não
  tem programação nenhuma — foi preciso tirar a formação de dentro do `if(!J.paz)` pra
  isso valer também em noite calma.
  **Quem apanha decide na hora**: revida ou corre pro portão, e a conta é bravura ×
  cabeça (`moral/12 × os meus ≥ 0,75 × os que estão em cima`), então bonde com moral 15
  encara em desvantagem de 11 contra 15 e bonde com moral 12 na mesma situação corre.
  Quem não foi tocado **não muda de vida** — segue na programação e entra na hora dele.
  O `J.paz` virou valor derivado disso (basta um bonde partir pra cima), e o
  `medirClima`, que virava a cena inteira de uma vez, não roda mais nos arredores.
  A tensão vem do jogo: a maior tensão com as torcidas do adversário do dia, ou o pico
  da cidade quando não há jogo marcado. Medido no fluxo real com tensão 85: cena montada
  em paz, três dos quatro bondes hostis.
- **Noite tranquila nos arredores é gente esperando, não bonde marchando.** Com `paz`, o
  pessoal fica de conversa em volta do próprio ponto — alvo sorteado dentro de 200 px,
  alternando parado (2 a 6 s) e andando (1,5 a 4 s) a meia velocidade — e só vai pro
  portão perto da hora. **Não vão todos juntos**: cada escalão tem o seu momento dentro
  da janela de 25 a 20 minutos antes da bola rolar, e dentro do escalão cada um sai com
  alguns segundos de diferença; a janela é fechada de propósito (o passo entre grupos
  para 1,5 min antes do fim, que é o que o sorteio individual gasta), senão o último
  entraria depois dos 20. Nada disso vira aviso na tela. Medido numa noite inteira: de
  18:06 a 20:05 ninguém sai da área do próprio spawn, com 12 a 23 dos 62 se mexendo a
  cada instante; a entrada começa 20:05 e termina 20:09.
- **Quem é atacado não se mexe antes da hora.** Na praça e nas três ruas o bonde
  visitante começa parado e só vem quando o outro chega perto (`gatilho.perto`, 260 px).
  É o mesmo mecanismo do bar com um gatilho diferente, e a diferença é o que a cena pede:
  no bar o que importa é o LUGAR (a porta que se vigia), na praça e na rua é a DISTÂNCIA
  — não há porta pra vigiar. Medido: nas quatro cenas ninguém do lado atacado anda nos
  três primeiros segundos, e a casa acorda por `perto`.
- **O remendo diz onde, a cena diz o quê.** `sobreEdicao` passou a mesclar spawn e entrada
  por id em vez de trocar a lista inteira: um remendo exportado antes de existir o campo
  `guarda` apagava o comportamento junto com a posição, e a torcida atacada voltava a sair
  andando no primeiro segundo.
- **Nos arredores, a cena acaba quando o presidente entra.** Lá não se toma nada de
  ninguém: o que se faz é chegar e entrar, e depois disso não há mais cena pra jogar,
  mesmo que sobre gente de pé na esplanada. O botão do portão passou a marcar o líder
  como quem entrou (antes ele fechava a cena sem entrar em lugar nenhum, e ficava de fora
  da conta de quem chegou no alvo). Chegar no objetivo é vitória nas cenas de ação —
  tomar o bar, levar a loja, chegar no gramado — mas **não** nos arredores, onde entrar
  pelo portão é o fim normal da noite: ali quem decide continua sendo quem caiu de cada
  lado, e noite sem ninguém no chão fecha como tranquila.
- **A bancada mostra o resumo na própria cena.** No jogo quem conta o fim é a tela de
  relatório; na bancada não havia tela nenhuma depois da cena, e a briga acabava com uma
  faixa piscando por cima do palco — que era pior que nada, porque competia com o
  resultado de verdade. Agora o mesmo cartaz, com os mesmos números, aparece por cima do
  palco com um botão de nova noite. A faixa saiu.
- **A aba `Arredores · em paz`** existe porque a outra força briga (`intencao:'atacar'`),
  e sem ela não havia como ver o comportamento de noite tranquila — que é metade do que a
  cena faz. O slider **Falta pro jogo** encurta o relógio da cena pra caber numa
  conferência: com 150 min a espera até a entrada é de quase 4 minutos reais.
- **A briga acaba sozinha.** Não é mais o botão nem o relógio: acabou quando um dos dois
  lados não tem mais ninguém de pé na cena — caiu, foi preso, entrou ou correu pra fora.
  Antes disso o vencedor ficava sozinho no cenário sem nada pra fazer até o jogador andar
  até a saída. Quem sobrou de pé é quem venceu, e é esse o `venceu` que a ação usa pro
  fecho — sair de pé com menos baixas é a mesma coisa na maioria dos casos, não em todos.
  **Quando quem ganha é a casa**, os discos que nasceram dentro (`daCasa`) voltam pro
  posto antes de a tela subir: ver o bonde deles voltando pro salão conta o resultado sem
  precisar de texto. `guarda` cai quando a casa acorda, `daCasa` não cai nunca — foi o
  primeiro jeito de escrever isso e o motivo de a volta não acontecer. Medido: com 8 no
  salão e 6 na rua, os 14 voltam em 2,7 s.
- **O fim da cena abre com um cartaz** (`.cartaz-cena`): **ATAQUE BEM-SUCEDIDO** ou
  **ATAQUE FRACASSOU** em letra grande — ASSALTO e COBRANÇA nas outras ações, e um par
  neutro no dia de jogo — e embaixo os quatro números da noite: feridos deles, feridos
  nossos, armas empregadas (pedras e bombas que saíram da sua mão) e dinheiro da
  operação. Vem antes do prestígio de propósito: prestígio é número de gestão, o que se
  quer saber ao sair da briga é se valeu.
- **Pino não mora em cima de gramado nem colado no vizinho**: o sorteio por hash punha
  mercadinho no meio do campo e dois ícones no mesmo lote. Agora o estádio entra primeiro
  (o lugar dele é fixo), os gramados viram área proibida com folga, e cada pino anda na
  lista de lotes do próprio bairro até achar vaga que respeite o raio do vizinho. Se a
  folga cheia não couber, ela cede antes de o pino sumir. Medido: 50 pinos, nenhum sobre
  gramado, nenhum encostado, folga mínima de 20 px além dos dois raios.

- **Patrimônio: a tela que faltava pro dinheiro ter pra onde ir** (`js/gestao/patrimonio.js`).
  A subaba do Financeiro que se chamava *Construções* virou **Patrimônio**, com duas abas,
  porque são duas decisões diferentes saindo do mesmo caixa.
  **ESTRUTURA** abre com a tabela do mês — cada local numa linha, com receita, despesa e
  o que sobra — e fecha com o que dá pra comprar. Ela é **mensal** de propósito: é assim
  que se compara com o preço de compra, enquanto o fechamento continua semanal. Os números
  não são recalculados aqui; `RECEITA`, `MANUT`, `MANUT_SEDE`, `INSUMO` e `MATERIAL` saem
  de `financeiro.js`, que é quem cobra — duas tabelas com os mesmos valores escritos duas
  vezes é a tela mentindo daqui a três semanas. Medido: a soma da tabela dividida por
  quatro, mais as mensalidades, bate com `contas()` com diferença de R$ 0 a R$ 1 de
  arredondamento.
  **MATERIAIS** lista o que a torcida guarda e vende o resto: faixa em três tamanhos,
  bandeirão em quatro, bandeira, bateria em dois níveis e a pirotecnia que já existia.
  Cada item diz o que vale — onde a satisfação vai descansar, quanto rende de reputação
  e o que custa de guarda por mês.
  **Os preços vêm do GDD V4 §8.1 e §8.3** — a primeira versão desta tela usou números
  inferidos porque o GDD não estava no repositório, e os oficiais são de outra ordem de
  grandeza: sede em 40/100/200/400 mil (era 20/45/90/160), bar 40/80/150 mil (era 8/7/15),
  loja 50/100/150 mil (era 9/8/13). Imóvel aqui custa cerca de **cinquenta meses** do que
  rende, não doze — comprar é decisão de temporada, não de semana. A fábrica também mudou
  de função: não corta material, ela **triplica o faturamento das lojas e derruba o insumo
  em 60%**, custa R$ 400.000 e exige sede nível 5.
  Um único preço continua inferido e está anotado no código: a **subsede**, que o GDD
  descreve mas não precifica — R$ 30.000, na mesma escala dos outros pontos.
  O teto por nível de sede agora tem duas dimensões, como no GDD: **quantos** pontos e
  **até que nível**. Bar nível 3 só existe em sede nível 5. Botão travado sempre diz
  **por quê** ("falta caixa", "a sede não comporta mais", "sede nível 3 não comporta bar
  nível 3") — cinza sem explicação é o que faz o jogador achar que o jogo quebrou.
  **O material precisava pagar em alguma coisa, e não em três.** Ele mexe em exatamente
  três lugares, todos existentes: (1) a satisfação **descansa** mais alto — `esfriar` já
  puxava tudo pra 11 toda semana, e agora o alvo é 11 + festa×0,45, com teto em 15, então
  bandeirão não empurra a satisfação, muda onde ela para (medido: convergiu pra 14,92
  vindo de 4 e pra 15,03 vindo de 19); (2) a doação de simpatizante fica mais frequente e
  maior; (3) no dia de jogo entra como festa comprada. Esse terceiro **não fura o teto**:
  o Fator Torcida continua limitado a 1, porque o bônus de ±4 de qualidade é decisão
  fechada e comprar material não é jeito de contornar. A tela mostra o ganho **depois**
  do teto — torcida que já lota e canta lê "a arquibancada já está cheia" em vez de um
  número que não existe. Cada cópia rende 60% da anterior, então o segundo mega bandeirão
  não impressiona como o primeiro.
  **Preço medido contra a economia real**: uma torcida de 150 membros na sede nível 4
  sobra ~R$ 250 por semana e sai de R$ 6.000 pra R$ 18.500 no primeiro ano sem comprar
  nada. Faixa e bandeira são compra de semana, bandeirão de 10×10 é de mês, o de 20×20 é
  de temporada e o mega de R$ 60.000 é obra de torcida grande — e cobra R$ 934/mês de
  guarda com a coleção inteira, que é o freio. Estrutura primeiro, material depois, é o
  caminho que os números desenham.
  **E a loja não é catraca de mão única**: apanhar feio na rua já tirava faixa e
  instrumento do estoque de rua, e agora tem 25% de chance de levar junto um item
  comprado — o mais barato que estava na mão, do menor pro maior, e nunca a bateria,
  que não vai pra briga. Sem isso a coleção só crescia, e comprar deixava de ser decisão
  depois da primeira vez.
  O que se guarda mora em `E.patrimonio.itens`; a pirotecnia continua em `E.estoque`,
  que é de onde o planejamento da semana tira as bombas. São duas gavetas porque já eram
  duas antes desta tela.

- **As 138 torcidas da IA pagam a mesma conta que o jogador** (`js/mundo/tensao.js`).
  Antes a economia delas era uma linha — R$ 24 líquidos por cabeça — e o resultado,
  medido em vinte anos, era que toda torcida crescia ~14 membros por ano do tamanho que
  fosse: a de bairro alcançava a Gaviões e a distância entre a maior e a menor caía de
  12,5× pra 2,1×. Sem estrutura não há custo fixo nem teto, e é a estrutura que decide os
  dois. Agora cada uma tem **sede com nível, bar, loja, subsede e fábrica**, mensalidade
  pela proporção de cargos do §5.1 (dá R$ 45 por cabeça, derivada e não mágica),
  manutenção, insumo e material — tudo pela tabela do GDD V4.
  Duas coisas limitam o tamanho, e a segunda é a que importa: o teto da sede (§8.1) e o
  **bolo da praça** (§6.2). Medido nas 139 torcidas da fonte, a militância fica em 0,23
  membro por mil torcedores do clube na mediana e 1,33 no caso mais saturado; o bolo usa
  0,55, então a mediana ainda pode dobrar e quem já esgotou a praça não cresce mais.
  **O bolo é do clube e é disputado**, como o GDD manda ("menos os já organizados de
  todas as torcidas daquele time"): cada torcida desconta o que as irmãs ocupam, e quem
  cresce primeiro fica com o espaço. A do jogador entra na conta.
  Em cem anos, **76 das 138 terminam encostadas no teto da praça e não no da sede** —
  Os Farrapos, de um clube com 15 mil torcedores, fica nos 20 membros que tinha, e a
  Jovem Fla chega aos 500 do nível 5. A distância entre a maior e a menor **sobe** pra
  25×, e o mundo estabiliza por volta de 2066 e não se move mais.
  Os **arquétipos do §21.1** deixaram de ser lista morta: cada um compra coisa diferente
  (a empresária loja, bar e subsede; a agressiva só bar) e guarda uma reserva diferente
  antes de assinar. Medido: a diplomática termina com 4,3 subsedes e a agressiva com
  nenhuma.
  Quatro quebras apareceram nas medições de cem anos e foram consertadas, todas visíveis
  só na corrida longa:
  1. **Quinze torcidas faliram até o piso de 8 membros** porque a reserva do arquétipo era
     um múltiplo *menor* que 1 — a agressiva assinava uma fábrica de R$ 400.000 com
     R$ 240.000 no caixa e nunca mais saía do vermelho, perdendo 3% do efetivo por semana.
  2. O **caixa empilhava** depois de tudo comprado: mediana de R$ 3,9 milhões subindo em
     linha reta desde 2066, porque não havia no que gastar. A torneira é a do próprio GDD
     (§7.4 e §9): quando não sobra o que comprar, queima 6% do que passa de um ano de
     despesa em material, pirotecnia, festa e estrada. Acha o equilíbrio sozinha em
     qualquer tamanho — a mediana fica em R$ 56 mil e não anda mais.
  3. **Toda torcida do mesmo clube terminava com o mesmo efetivo** — 25 dos 29 clubes com
     mais de uma organizada. `baseDeRecrutamento(praça, clube)` não recebe *qual* torcida,
     então as duas do Botafogo recebiam o mesmo 442 e paravam ali. Daí o bolo disputado
     acima. Os 3 empates que sobraram são legítimos: nos clubes de bolo enorme todas as
     irmãs batem no teto de 500 do nível 5.
  4. Na primeira tentativa de dividir o bolo, **nenhuma torcida ampliava a sede em cem
     anos**: a condição comparava o teto da sede com o mínimo entre sede e praça, ou seja
     com ele mesmo. E **dezessete torcidas de clube pequeno secavam**, porque o bolo
     calculado dava menos gente do que elas já tinham — perdiam nas brigas e não
     recrutavam de volta. A fonte manda mais que a fórmula: o bolo nunca é menor do que o
     que já está na mesa, e o piso de cada uma é o efetivo com que ela entrou no jogo.
- **A relação entre duas torcidas da IA passou a existir** — antes só a tensão andava, e
  tensão esfria em três semanas, então uma rivalidade de trinta anos de porrada terminava
  exatamente onde começou. `E.relacoesDelas` nasce do grafo importado e se move com as
  brigas e as tréguas, com o mesmo retorno lento pro valor natural que a nossa tem.
  **E mesmo assim ela quase não anda, por aritmética e não por bug**: o mundo gera três
  episódios por semana espalhados por 4.396 pares, então um par qualquer é sorteado uma
  vez a cada trinta anos, enquanto a relação volta ao normal a 5% por semana — cinco
  meses. Medido em cem anos: 3.101 dos 3.121 pares terminaram a menos de 2 pontos de onde
  começaram e nenhum trocou de faixa. O conserto é decisão de design e por isso não foi
  aplicado: ou o mundo gera muito mais episódios (e o ticker vira ruído), ou a diplomacia
  roda num trilho próprio, sem notícia, e o ticker segue com os três de sempre — esta é a
  recomendada.

- **Reforçar o elenco** (GDD **V3** §19, que o V4 não repete). O V3 traz a tabela de preço
  por ponto de força e o §9.5 define a força do elenco como "base **+ investimento da
  torcida**" — as duas parcelas separadas, que é como está implementado. A base é o que o
  clube conquistou em campo e continua sendo ela que a evolução de fim de ano recentra por
  competição; o investimento é dinheiro de torcida e fica fora dessa média, senão comprar
  elenco derrubaria o dos outros da mesma divisão.
  **O teto virou 100, os valores continuam os da fonte.** Os 108 clubes nascem entre 4 e
  50, que é a força que o autor definiu pra cada um; o que mudou foi só a régua, que agora
  vai até 100 — sobra metade dela pra crescer, em campo ou com dinheiro de torcida. Como
  os valores não se mexeram, nada de balanceamento precisou acompanhar: o divisor do
  Poisson segue 55, o bônus do Fator Torcida segue 8 pontos e a cobrança no CT segue
  +3/−2. O save guarda `E.forcas`, não mais `E.qualidades`.
  Preço por ponto, pela faixa em que o clube está: **R$ 50 mil** até 10 de força, 80 mil
  até 20, 140 mil até 30, 200 mil até 40, 250 mil até 50, 300 mil até 60, 350 mil até 70,
  400 mil até 80, 500 mil até 90 e **R$ 800 mil** até 100. Não há desgaste — o que a
  torcida banca fica.
  A tela é a terceira aba do Patrimônio, **ELENCO**: uma barra que separa em azul o que o
  clube conquistou e em ouro o que a torcida bancou, e um botão só, **+1 de força**, com o
  preço da faixa. O Patrimônio já era onde o dinheiro vai, e agora são três destinos —
  imóvel, material e time.
  **As torcidas da IA também reforçam** (GDD §26: elas evoluem como o jogador), com um
  limite que as impede de quebrar o mundo: só investem enquanto o clube estiver **abaixo
  da média da divisão dele**, e vira meta de poupança como a sede. Na primeira versão o
  investimento entrava depois da torneira de queima, que segura o caixa delas abaixo do
  ponto mais barato, e cem anos renderam 4 pontos no país inteiro; depois do conserto,
  62 dos 108 clubes recebem aporte e a distribuição pende pra baixo — Série D na frente,
  Série A no fim.
- **Outras praças jogáveis** (`js/mundo/mapa_gerado.js`). Só Fortaleza tinha arte, e o
  desenho do mapa foi reescrito pra camada de pinos dela: a via procedural antiga ficou
  sem `pinos` nem `regioes` e **o mapa quebrava em qualquer outra cidade** — `mo.pinos is
  not iterable` na hora de abrir. Agora, pra qualquer praça, a planta é gerada da própria
  lista de bairros com a **mesma forma da arte**, e quem consome (pinos, filtros, briga de
  rua, contorno de bairro, malha do dia de jogo) não sabe a diferença.
  **As cinco praças Grandes usam a foto de Fortaleza.** A arte é uma cidade brasileira de
  16 bairros em quatro zonas, e São Paulo, Rio, Belo Horizonte e Recife têm exatamente
  isso — 16 bairros, 4 por zona. Então a mesma imagem serve pras cinco, com os bairros
  trocados de nome zona a zona: o que se empresta é a geometria (máscara de rua, lotes com
  frente pra rua, os três gramados), e o que é da cidade continua dela — nome, zona e
  classe social, que é quem decide receita e cena de briga. Os **estádios se reposicionam
  sozinhos**: cada gramado sabe em que região caiu, `paresDeEstadio` casa o estádio da
  praça com o campo por porte, e o bairro do pino passa a ser o do gramado. Medido: o
  Mineirão cai no Itapoã, a Arena MRV em Santo Agostinho e o Independência nas Mangabeiras,
  os três em cima de campo desenhado. Onde a praça tem mais estádios que gramados — São
  Paulo tem quatro — o que sobra vai pra um lote do próprio bairro.
  A máscara, os lotes e a imagem vão por referência: são os mesmos bytes pras cinco praças.
  Nas praças que não são Grandes, a planta é a cruz do GDD §19.3 — Norte em cima, Sul
  embaixo, Oeste e Leste nos flancos, miolo no centro. Cada bairro vira um retângulo com avenida em volta, ruas internas
  cortando em quarteirões de 5 células, e lote é toda célula construída que encosta numa
  rua; casa sem frente pra rua não é endereço de nada. A moldura de fora é rua, então dá
  pra contornar a praça sem passar pelo centro. Tudo por hash do nome do bairro: a mesma
  cidade sai igual em toda partida. Sem foto, o mapa se pinta do próprio raster — telhado
  na cor da classe do bairro, asfalto na rua, gramado por cima.
  **Começar uma partida agora exige uma praça Grande** (GDD §10.1): São Paulo, Rio,
  Belo Horizonte, Recife e Fortaleza, que é onde os bairros chegam a 16 e a cruz fecha nos
  quatro lados. São **33 torcidas selecionáveis** de 139 — as outras continuam existindo,
  brigando e aparecendo no noticiário, só não são jogáveis. Medido nas 33: nenhuma erra ao
  iniciar, todas têm rota da sede ao estádio (de 12 a 108 passos), 47 a 54 pinos e malha
  de 3.744 a 5.478 nós montada em ~11 ms.

- **A cidade viva em dia de jogo.** O mapa já movia bondes; faltavam quatro coisas pra
  virar o que o GDD §14 descreve.
  **Vários bondes por torcida, não só a nossa.** O jogador decide no plano da semana; as
  outras se quebram pelo tamanho — um bonde a cada 60 membros, no máximo quatro. A
  primeira sai da sede, as seguintes dos bares dela, e a caravana visitante entra por
  bocas diferentes da cidade. Medido em São Paulo: 10 bondes de 8 torcidas, saindo de 5
  sedes, 2 bares e 3 entradas.
  **Reencontro.** A chave do confronto era o par de TORCIDAS e valia pro dia inteiro:
  brigou uma vez, nunca mais. Agora é o par de BONDES, com esfriamento de 15 minutos em
  vez de bloqueio — dois bondes da mesma torcida têm cada um a sua noite, e o mesmo par
  pode se pegar de novo duas ruas adiante. Quem apanha segue com 25% menos gente.
  **A rua ganhou briga.** O raio de esbarrão era 16 e, medido em 12 dias de jogo, dois
  bondes hostis chegavam a menos disso **uma vez só** — todo confronto acontecia no cordão
  do estádio. É que todos vão pro mesmo destino, então as rotas só convergem no fim. A 45
  (umas quatro células de rua, o que se lê como "mesma esquina") aparecem 65 aproximações
  em 14 dias, 21 delas longe do estádio.
  **O minimapa dos arredores**, rodando ao lado do mapa da cidade: o bonde que entra no
  quarteirão do estádio **some da rua e aparece na esplanada**, no portão do lado dele,
  com o horário de chegada. É a antessala da cena — quando o nosso bonde chega, o botão
  abre os arredores de verdade com o efetivo que sobrou da caminhada. Medido: os 7 bondes
  de um dia de Fortaleza saem do mapa e entram na esplanada entre 18 e 64 minutos.
  **O que ainda não é o que devia**: as brigas de rua continuam raras porque o gargalo não
  é distância, é **hostilidade cruzada com dia de jogo** — dos 65 pares que se encostam,
  22 são hostis, e os hostis tendem a se encontrar já perto do estádio. Pra rua encher de
  briga é preciso mexer no que conta como hostil na rua (hoje exige rivalidade de fato ou
  tensão ≥ 45), não no raio.

- **São Paulo e Belo Horizonte ganharam mapa próprio.** A foto emprestada de Fortaleza
  resolvia a geometria mas mentia em duas coisas: São Paulo tem **quatro** estádios e o
  desenho só tinha três gramados (o quarto ia parar num lote qualquer), e Belo Horizonte
  ficava com **praia**, numa cidade a 700 km do mar. As duas artes novas
  (`img/cenas/mapa sao paulo.png` e `mapa belo horizonte.png`) têm quatro campos e serra
  no lugar da praia. `ferramentas/importar_mapa_cidade.py` deixou de ser um script de uma
  cidade só: recebe a praça por argumento, lê a tabela `ARTES` e escreve
  `dados/cidade_mapa*.js`, todas registradas em `TO.dados.cidadeMapas` por id.
  `TO.dados.cidadeMapa` continua apontando pra Fortaleza, que é o nome que o resto do jogo
  usa quando quer "a arte de referência". Conferido: os 35 KB de Fortaleza saíram byte a
  byte iguais.
  **O quarto campo de São Paulo não era achado** porque o importador procurava gramado
  *dentro* da máscara de cidade — e essa máscara é feita de densidade de telhado, que em
  cima de um estádio é zero. A mancha urbana tem um buraco exatamente onde está o campo. O
  do canto do mar caía 80% fora dela e sumia. Agora o verde se procura no desenho inteiro
  e quem decide se é estádio ou mato é a vizinhança: gramado de estádio tem quarteirão em
  volta. Pelo mesmo motivo o bairro do estádio saía vazio (a região no pixel do centro é
  −1), e passou a vir do vizinho mais próximo.
  Sobra o caso das outras três Grandes — Fortaleza, Rio e Recife — que seguem com a arte
  de Fortaleza, agora com **três estádios pra três gramados** nas três (ver o item do
  apelido, abaixo).
- **Engenhão é Nilton Santos, Aflitos é Estádio dos Aflitos.** O Rio aparecia com quatro
  estádios pra três campos e o Recife também: `estadios.js` escreve um nome e a planilha
  de times escreve outro, e como não é caso de acento o identificador não pegava —
  `estadiosEm` criava um pino a mais, sem mandante, e o clube dono ganhava um estádio
  fantasma só dele. `importar_estadios.py` ganhou uma tabela `APELIDOS`; o estádio guarda
  os nomes alternativos e absorve o mandante que apontava pro apelido. Rio: Maracanã,
  São Januário e Engenhão (Botafogo). Recife: Arruda, Ilha do Retiro e Aflitos (Náutico).
- **O disco na rua.** Cada bonde no mapa da cidade carrega a **sigla da torcida** por
  cima, em traço preto, e anda **4× mais devagar** (velocidade de 26 pra 6,5). A lentidão
  não foi só estética: com o bonde voando, dois hostis se cruzavam entre dois quadros e o
  encontro nunca disparava. Devagar, um dia de Fortaleza rende briga de rua no minuto 28.
  E o destino passou a ser o **estádio do mandante daquele jogo**, não o primeiro pino da
  lista — `pontoDoEstadioDoClube` casa por `mandantes`, depois pelo nome que o clube
  declara. Medido em 178 bondes de 36 dias de jogo em três praças: 178 vão pro pino certo.
  Corinthians em casa manda a torcida pra Neo Química Arena.
- **Um disco por pessoa nos arredores.** Se a Gaviões vai com 250, spawnam 250 — com a
  cor de verdade da torcida, não a cor do lado. Quem cria disco passou a ser o **bonde** e
  não o portão: um portão recebe dois bondes num clássico, e cada um traz a sua cor e o
  seu efetivo. Na primeira versão o bonde nascia em *cada* portão que lhe coubesse e o
  efetivo saía dobrado (os "760 discos" que eu media eram 510 contados duas vezes); e a
  escalação, que diz quem tem **nome** — força, defesa, ficha e consequência depois da
  briga —, estava sendo lida como se dissesse **quantos foram**, então o nosso lado
  entrava com 34 pessoas em vez de 250. Agora os 34 escalados são os 34 primeiros discos
  do nosso bonde e o resto é povão sem ficha, que é o que o povão é. Medido pela tela, num
  Corinthians em casa: 250 discos pretos da Gaviões (todos obedecendo à formação), 15
  brancos da Jovem Ponte, 34 com ficha, 1 líder.
  Isso levou a esplanada a **510 discos** e a 5 quadros por segundo. Três achados, em
  ordem de tamanho:
  **1)** `pontoLivreMaisProximo` era chamado com o slot de formação, que **cai fora da
  cena** o tempo todo quando o líder está encostado numa borda. De fora da grade o anel
  gastava dezenas de voltas só pra reencontrar o mapa, e não dava pra guardar o resultado
  porque a célula de origem não existe. Prendendo a partida à borda e memorizando por
  célula: 404 ms → 3 ms por 30 quadros.
  **2)** A separação disco-a-disco era uma varredura par a par — 288 mil comparações por
  quadro. Grade própria com célula do tamanho do maior disco, comparando cada célula
  consigo e com quatro vizinhas (as outras quatro chegam pelo outro lado; comparar duas
  vezes dobraria o empurrão).
  **3)** O empurrão saía par a par, e no meio da aglomeração cada disco encosta em cinco
  ou seis vizinhos: dez colisões contra a malha por disco por quadro, com resultado
  dependente da ordem da lista. Agora soma no disco e sai num movimento só —
  226 mil chamadas viraram 17 mil.
  O primeiro palpite (grade espacial na busca de inimigo) **não mudou nada** e ficou; o
  que resolveu foi medir. Resultado: 186,8 ms → **1,9 ms por quadro** de simulação, e
  **60 FPS medianos** com os 510 discos num laço de verdade, em Chromium sem GPU
  (p95 de 18 ms, pior quadro 21,9 ms).
- **Os arredores viraram pop-up.** Saíram os painéis de calibragem, ocorrências e "nos
  arredores"; sobrou a cena, em tela cheia sobre o mapa, com os comandos num HUD por cima
  do canvas em vez de numa coluna ao lado.

- **Cada torcida com a sua sigla e a sua cor no dia de jogo.** A queixa era que as
  organizadas de segundo e terceiro escalão não apareciam no mapa. Medido: elas
  **apareciam** — 287 aparições em 60 dias de jogo em quatro praças, nenhuma faltando.
  O que não dava era distinguir uma da outra.
  **A sigla era a do CLUBE.** O campo `sigla` do dado traz o time, então Gaviões,
  Camisa 12 e Pavilhão 9 mostravam as três "SCCP": o jogador olhava a rua e via uma
  torcida só. Agora a sigla sai do nome da própria torcida — nome de uma palavra vale por
  si (GAVIÕES, MOFI, INDEPENDENTE), nome de várias vira as iniciais (Mancha Verde → MV,
  Movimento Uniformizado Cruzmaltino → MUC). Artigo e preposição não contam; número entra
  inteiro (Camisa 12 é C12, não C1) e palavra que já é sigla entra inteira (Leões da TUF é
  LTUF). Nas 140 torcidas nenhuma praça tem duas siglas iguais; o que ainda colidia era
  visitante de outro mapa — Esquadrão Atleticano e Esquadrão Alvinegro são as duas "EA" e
  se cruzam quando o Atlético recebe o interior de Minas —, e aí a segunda cresce pela
  última palavra: EA vira EAL.
  **A cor era sempre `cores[0]`, que é a paleta do clube.** Duas consequências: as
  organizadas do mesmo time saíam idênticas, e em São Paulo quatro torcidas de clubes
  diferentes eram todas brancas, porque branco é a primeira cor de meia dúzia de paletas —
  a Mancha Verde, do Palmeiras, saía branca. Agora cada torcida da noite escolhe, na ordem
  da própria paleta (`cores[0]`, `cores[1]`, `detalhe`), a primeira que ninguém pegou;
  escolhe primeiro a nossa, depois as visitantes (é quem o jogador precisa achar), depois
  as de casa, sempre da maior pra menor — ordem fixa, então a mesma noite pinta igual toda
  vez que a tela reabre. Quando a paleta inteira já foi, o tom muda: num clássico de clube
  preto e branco as três organizadas vestem as mesmas duas cores de verdade, e aí quem
  separa é a sigla. Medido nas mesmas 60 noites: **zero siglas repetidas, zero cores
  repetidas**. Num Corinthians em casa: GAVIÕES preto, JP branco (a visitante fica com a
  cor dela), C12 e P9 em cinzas distintos.
  A letra do rótulo encolhe quando a sigla é comprida — melhor INDEPENDENTE pequeno e
  inteiro que grande e cortado.
  **A sigla de verdade veio da planilha do autor**, que ganhou a coluna `Sigla` na aba
  Torcidas: GAVIOES, C12, P9, TJP, CMA, MV, TTI, TUF. São 136 das 140 — as quatro que
  faltam continuam com a sigla derivada do nome, que é o padrão de propósito.
  `importar_relacoes.py` lê a planilha junto com o JSON e escreve `siglaTorcida` em
  `dados/torcidas.js`; o `sigla` de antes continua lá e continua sendo a do clube, que é
  quem manda no escudo do cabeçalho. O pareamento é pelo NOME sem acento e sem separador:
  pelo id não dá, porque o id do jogo usa underscore (`mafia_azul`) e o identificador dos
  importadores usa hífen — só as torcidas de nome de uma palavra casavam, 15 de 140.
  Sigla repetida existe de verdade (três torcidas do país se chamam RAÇA) e quem resolve
  continua sendo quem monta a noite.

- **A sede virou o escudo da torcida no mapa.** Era um pino vermelho com um bandeirão
  desenhado, igual pras oito torcidas da praça. Agora é uma bola na **cor principal** da
  torcida com a **sigla dela no meio na cor secundária** — dá pra ler o mapa e saber de
  quem é cada casa sem passar o mouse.
  "Secundária" nem sempre contrasta: a Gaviões é preta no manto e no calção, e preto sobre
  preto não se lê. A letra é a primeira cor dela que se separa do fundo — calção, depois a
  linha da camisa — e só se nenhuma servir (quatro torcidas em 140) cai no preto ou branco
  pela luminância. Inventar uma cor que não é dela seria pior.
  A bola cresce pra caber a sigla em vez de encolher a letra: duas em cada três siglas têm
  três letras ou menos e cabem no tamanho normal do pino; GAVIOES e ESQUADRÃO ganham uma
  bola maior. Na primeira versão era o contrário, e GAVIOES saía com quatro pixels e meio
  de fonte — um borrão preto onde devia estar o nome.

- **A esplanada é do nosso jogo, não da cidade.** A praça tem até três partidas no mesmo
  dia e cada estádio tem a sua esplanada; a cena juntava todos os bondes que tinham
  chegado a qualquer um deles, então abria com torcida de um clássico do outro lado da
  cidade parada no nosso portão. Cada bonde passou a carregar de que jogo é (o clube
  mandante), e o nosso jogo é o do nosso bonde — sem bonde nosso na rua, nosso clube não
  joga nesta praça hoje e não há esplanada nossa pra mostrar. Medido num dia de duas
  partidas em São Paulo: 7 bondes chegaram à cidade, 5 são do Corinthians x Santos e são
  esses os 5 que entram na cena; os 2 do Portuguesa x Ituano ficam de fora.

- **Espaço pra torcida grande na esplanada.** O raio de vadiagem era 200 px, dimensionado
  para trinta discos; com 250 é o mesmo espaço para oito vezes mais gente. Passou para
  **800 px**. O nascimento também: era um quadrado de 92 px de lado para qualquer efetivo
  — 34 px² por cabeça quando o disco sozinho ocupa 154 —, e a cena abria com todo mundo
  dentro de todo mundo. Agora o raio de espalhamento vem do efetivo, com o mesmo teto de
  800: bonde de oito se junta numa esquina, bonde de 250 ocupa quarteirão. Medido: a
  Gaviões nasce com raio mediano de 157 px em vez de amontoada, e os dois lados continuam
  cada um no seu setor.

- **A PM não recua mais o seu bonde.** Depois de `aguentaPM` segundos com mais de 35% do
  bonde perto de PM em carga, a torcida virava as costas sozinha. Isso disparava
  exatamente no melhor momento da noite: romper a grade põe **toda** a PM em carga de uma
  vez, e a carga ameaça a 120 px em vez de 46 — o bonde estava colado no cordão, porque
  foi ele que derrubou a grade, e dez segundos depois debandava. Quem manda no bonde é o
  jogador (R pra recuar); a única coisa que o quebra sem ordem é o preço de sangue
  combinado, a debandada em `P.debandada` por cento de baixas. A pressão continua pesando
  onde deve — derruba a moral, e moral baixa é o que leva à debandada. Medido: com a barra
  de pressão estourada e o bonde grudado no cordão por quarenta segundos, ninguém recua;
  aos 30% de baixas, debandada na hora.

- **O dia de jogo virou um dia, com hora.** O relógio da rua era um cronômetro sem hora:
  contava de zero e o mapa só sabia dizer quanto faltava. Agora `R.minuto` conta desde as
  **08:00**, o relógio aparece no canto esquerdo do mapa e o apito é às **16:00**. A tarde
  tem duas cenas: de manhã cedo entra quem vem de fora, e só entre **2h30 e 2h antes do
  apito** é que a praça sai pro estádio, escalonada por torcida.
  Com hora fixa, 22 de 267 bondes chegavam com a bola já rolando — atravessar São Paulo a
  pé leva mais que duas horas e meia. Quem mora longe passou a sair mais cedo: o
  adiantamento é só o que o caminho exige, com quinze minutos de folga. Medido em 48 dias
  de jogo nas quatro praças: **nenhum bonde chega depois do apito**, e o último de cada
  dia entra sempre por volta das 15h45. E como das 08:00 às 13:30 quase nada se mexe, o
  relógio da tela corre solto quando não há ninguém andando.

- **O visitante pode morar aqui.** Num Atlético × Cruzeiro a Máfia Azul é visitante no
  jogo e moradora da cidade — tem sede, bar e rua —, e o código mandava ela entrar pela
  borda da praça como se viesse de ônibus. Agora quem decide o ponto de partida é ter ou
  não casa na praça, não ser mandante ou visitante na tabela.

- **Os dois pontos de chegada.** Quem realmente vem de fora entra por um dos dois pontos
  que o autor marcou na arte — a boca da avenida no alto e a ponta sudeste do bairro de
  baixo —, alternando: dois bondes novos não descem no mesmo meio-fio. Guardados em fração
  do lado do mapa, porque as três praças com arte compartilham o mesmo esqueleto de ruas;
  conferido, nos três os dois pontos caem em cima de asfalto.

- **A primeira cena do dia é o aliado chegando.** Torcida de fora que tem aliado com sede
  na praça desce de manhã e vai pra casa dele; à tarde os dois saem juntos pro estádio. A
  viagem virou uma lista de pernas (`etapas`), então um bonde pode ter dois destinos e uma
  espera no meio. Quem escolhe o anfitrião: pro jogador vale a relação corrente (o mesmo
  ≥ 20 da tela de aliados na cidade), pras outras valem as listas de aliado e irmandade do
  dado, irmandade na frente.
  **A escolta soma 5 a 10% dos membros de quem recebe** (GDD §11.1), aplicada quando o
  bonde chega na sede — a Leões da TUF, com 150, empresta 8. Quem decide pelo jogador é
  Gestão > Aliados na nossa cidade: em `hospedar` não há escolta, em `escoltar` ou
  `churrasco` há. A IA que tem o aliado dormindo em casa escolta sempre. **Escoltado pela
  nossa torcida é bonde nosso na briga**: o jogador comanda a soma das duas, e isso pode
  acontecer num jogo em que o nosso clube nem entra em campo — daí `nossoJogo` olhar
  primeiro o nosso bonde e depois o aliado que a gente escoltou.

- **Dá pra descer com o bonde que já chegou.** Se três de seis estão na esplanada e um é o
  nosso, a briga é com esses três; o botão diz quantos ainda vêm. E quem desce pro palco
  não volta pro minimapa — entrou pro estádio. É o que faz a hora de descer valer alguma
  coisa: brigar às 14h30 com três bondes ou esperar os seis das 15h10 é uma escolha só.

- **O ponto de partida é a sede, não o mando.** Os dois lados eram assimétricos: o
  mandante procurava `pontoDaSede` e desistia se não achasse; o visitante chamava
  `entradaDaCidade` **sempre**, sem nunca consultar a sede. Num Atlético × Cruzeiro — jogo
  dentro do mapa de Belo Horizonte — as organizadas do Cruzeiro desciam da rodovia na
  própria cidade. Agora quem decide é ter pino de sede na praça, dos dois lados. Medido no
  clássico: os cinco bondes dos dois clubes saem de sede ou de bar, **nenhum** de ponto de
  entrada.
  Os pontos de entrada passaram a ser os **dois que o autor marcou na arte** — a boca da
  avenida no alto e a ponta sudeste do bairro de baixo —, guardados em fração do lado do
  mapa e alternados por um contador único do dia. Medido: 92 bondes de entrada em 100 dias
  de jogo nas cinco praças Grandes, todos na ordem P1/P2 e em cima do ponto marcado.

- **O relógio é o da grade.** O apito vem de `horaDoJogo` do **último** jogo do dia nesta
  praça, não de constante: rodada de domingo tem partida às 11h e às 20h30, e a rua tem de
  acompanhar o que a tabela marcou. Velocidade constante o dia inteiro — dois minutos de
  rua por segundo de tela, a manhã parada inclusive. O relógio para no apito, não quando o
  último bonde chega.
  A janela de saída é **T-2h30 a T-2h00 e mais nada**. Medido em 495 bondes: 0 fora da
  janela, e a hora de cada um é a mesma toda vez que a tela reabre. O preço aparece na
  conta: **33 deles (6,7%) ainda estão na rua quando a bola rola** — em São Paulo, na
  velocidade lenta que os discos têm hoje, a travessia não cabe em duas horas e meia. É
  consequência da janela fixa, não defeito de rota; quem quiser todo mundo dentro do
  estádio no apito mexe na janela ou na velocidade.

- **A manhã do aliado.** Visitante sem sede aqui e com aliado na praça desce entre 08:00 e
  08:45 e caminha até a sede dele; fica lá até a janela. Sem aliado, só desce na janela e
  vai direto — caravana não passa a manhã no meio-fio. A viagem virou uma lista de pernas,
  então um bonde tem dois destinos e uma espera no meio. Em jogo de manhã a chegada
  aperta junto com a janela, senão o ônibus estaria marcado pra sair da sede antes de ter
  descido: medido, 0 casos de perna 2 antes da perna 1.

- **A escolta sai do anfitrião.** As escoltas se resolvem **antes** dos bondes, porque o
  anfitrião pode ser torcida de outro jogo do mesmo dia — dá pra escoltar um aliado numa
  partida em que o nosso clube nem entra em campo. Medido no caso do autor: aliado de 14,
  Leões da TUF com 150, escolta de **8** (5,3%), bonde combinado sai com 22 e os nossos
  bondes caem de 150 pra **142**. O total da noite não muda, muda de quem é.
  Um disco só no mapa; na esplanada, duas entradas — cada torcida com a própria cor e a
  própria sigla, que é o que a escolta tem de legível. E **uma conta só** pra caravana:
  `membros × 0,18 × (1 + relação/150)`, a que a Gestão mostra ao jogador. O mapa usava
  `efetivoDe × 0,25` e os dois números não batiam.

- **A rua não para porque a briga começou.** Medido: entrei às 09:23 com só a Gaviões
  (250) na esplanada e três bondes andando; às 10:43 os três tinham chegado no meio do
  tumulto e os discos foram de 280 pra 372, com uma linha de log pra cada chegada.

- **Sede e bar se acham por id.** O casamento era `label.includes(nome)` e 11 dos 140
  nomes são subcadeia de outro. Hoje nenhum desses pares divide praça, então não havia
  erro em campo — era mina, não buraco, e com o visitante passando a procurar sede o
  caminho ficaria quente. 275 pinos conferidos nas 30 praças, **0 errados**.

## 8.5 O bonde comandado — o projeto, antes do código

Quatro escolhas de desenho que precisavam estar fechadas antes de qualquer linha,
porque errar nelas custa retrabalho e não conserto.

**1. O que é "atacar um rival" — quem escolhe é o destino, não um menu.** O jogo já
tem cena para os dois alvos, e não faz sentido inventar um terceiro caminho:

- clicar num **pino de sede ou bar** rival é alvo **fixo**, e cai na ação que já
  existe em `acoes.js` (`alvosDeAtaque` já varre exatamente esses pinos, com cena,
  saque, prestígio e tensão próprios);
- clicar num **ponto de rua** é **tocaia**: o bonde vai até lá e fica. Se um bonde
  hostil passar perto, `procurarEncontro` dispara como sempre e a cena abre pelo
  `localDe` do lugar — rua, rua média, rua nobre ou praça.

O jogador não escolhe num seletor: ele escolhe apontando. É a mesma gramática do
resto do mapa, onde o clique já significa "aqui".

**2. Fora de dia de jogo o alvo é sempre fixo.** Sem jogo na praça ninguém mais põe
gente na rua, então tocaia num dia vazio seria esperar por um bonde que não existe.
A alternativa — dar movimento próprio às torcidas da IA todo dia — é um mundo
inteiro a mais para simular e não é o que está sendo pedido. Então: em dia de jogo
o mapa tem os dois alvos; fora dele, só o fixo. **Nada de movimento de rival
independente de jogo.**

**3. Custa uma ação da semana.** É a assunção do pedido e ela está certa: são 2 a 3
ações por semana pelo nível da sede (GDD §3.1), e é esse teto que faz a decisão ter
preço. Sair de graça transformaria o ataque diário no caminho ótimo e tiraria o
sentido de todo o resto do orçamento. O botão desconta por `TO.acoes` e, quando não
dá, diz o motivo em vez de só ficar cinza.

**4. Quem sai:** `TO.membros.aptosParaOEstadio(E)` — os que não estão feridos nem
presos —, com o jogador escolhendo quantos, como já faz na escalação. Em dia de
jogo `efetivoDaSaida` continua mandando nos bondes automáticos; o bonde comandado é
outro, e o efetivo dele é escolhido na hora.

## 8.6 O bonde comandado — o que ficou de pé, com número

O projeto de §8.5 foi implementado inteiro. As cinco coisas que o pedido mandava
medir, medidas dirigindo o jogo de verdade em Chromium:

- **O mapa vive todo dia.** `montar()` deixou de sair pela porta dos fundos quando
  o dia não tem jogo: ele monta o dia, o relógio corre e a barra oferece o comando.
  Dia vazio abre **08:00 e vai até 22:00** — não faz sentido abrir 13:30 porque um
  apito imaginário seria às 16:00. Medido no dia 1 da semana 1 da Gaviões: relógio
  em 08:00, "14h00 de rua", *Sair da sede* ligado, zero bondes automáticos.
  A guarda de cache virou `R.montado` — era `R.bondes.length`, e num dia vazio isso
  remontava o dia a cada pintura de tela, zerando o relógio do bonde comandado.
- **Sai da sede, anda pela malha, chega.** O bonde nasce no pino da nossa sede
  (445, 895 em São Paulo) com o efetivo escolhido. Mandado pra sede da Camisa 12,
  a rota tem **73 nós e 805 px** contra **640 px em linha reta** — ou seja, dá a
  volta pelo quarteirão em vez de atravessar. Chegou às **10:04**, e a chegada abre
  a investida que `acoes.js` já tinha, com saque, prestígio e tensão.
- **Custa uma ação.** 3 restantes antes, **2 depois**. Sem ação sobrando o botão
  não fica só cinza: o rótulo vira **"Não sobrou ação esta semana"**. O motivo vai
  no rótulo e não só no `title` porque no celular não existe passar o mouse.
- **Dia de jogo não regrediu.** Três dias de jogo conferidos: 9, 4 e 7 bondes
  automáticos, aberturas 16:00 / 08:30 / 13:30, apitos 18:30 / 11:00 / 16:00, e
  **0 bondes fora da janela de saída**.
- **WASD dirige, e pela malha.** 320 passos de tecla em oito direções: **maior
  salto de 3 px** (nada de teletransporte), **0 passos travados**, **1.040 px
  andados**, e de **257 posições distintas** apenas **1 caiu fora do asfalto** — o
  meio de uma aresta cortando calçada, a mesma coisa que acontece com os bondes
  automáticos (2,7% em 788 amostras). Segurando uma tecla só por 3 s, no teclado de
  verdade: **156 px em qualquer das quatro direções**, sempre em cima da rua.
  **Sem bonde selecionado o WASD não faz nada** — nem move a vista: medido, disco e
  scroll do viewport parados nos mesmos pixels depois de segurar as quatro teclas.
  No celular o pad aparece **com a cruz e mais nada** — sem PEDRA, BOMBA, RECUAR
  nem as quatro formações, que são comandos de briga e não significam nada no mapa.

### O WASD que não funcionava, e as cinco coisas que faltavam

A primeira versão passou nos testes e não funcionava na mão de quem jogou. Cinco
defeitos separados — quatro no mapa e um que matava a cruz **dentro da cena de
luta** —, cada um bastando sozinho pra o disco não sair do lugar:

1. **Só o bonde comandado podia ser dirigido.** Em dia de jogo — que é justamente
   quando o mapa importa — o disco da nossa torcida já está na rua e não era
   "comandado": clicar nele não selecionava e WASD não fazia nada. Agora **qualquer
   bonde nosso na rua** se pega, por clique no disco ou pelo botão *Pegar o bonde*,
   e quem pega no volante vira dono (a chegada passa a ser a do bonde comandado, a
   não ser que o destino escolhido seja o próprio estádio).
2. **O bonde nascia dentro do quarteirão.** O pino da sede fica no lote, não no
   asfalto; a malha não tem nó ali e o disco recém-saído não andava um pixel com
   nenhuma tecla. O primeiro passo de qualquer direção passou a ser o mesmo: **sair
   pra rua**, andando até o nó mais próximo.
3. **A tecla escolhia o vizinho exatamente naquela direção.** Isso funciona numa
   grade limpa; esta malha vem da arte, a célula tem 10 px e uma rua é uma fita de
   uma ou duas células que serpenteia. Medido: 10 px e parava. Agora **a tecla dá o
   rumo e a rua dá o caminho** — o bonde segue a rua que mais leva pra lá, sem piso
   de ângulo (com piso, quem apertava nordeste no beco da sede não saía nunca) e sem
   refazer o próprio rastro: uma trilha dos últimos 12 nós é o que impede a volta no
   quarteirão, que estava custando 390 px andados para 14 px de deslocamento. Com a
   trilha, os mesmos 390 px andados viram 267 a 359 px de deslocamento.
4. **Dois pads no mesmo canto, e o de cima era o errado.** `#djPad`, a cruz da
   cena de luta, é montado uma vez e nunca era desmontado — depois da primeira
   briga ele ficava boiando por cima do mapa e de todas as páginas de gestão. O pad
   do mapa entrou depois, por cima dele: **dentro da cena de rua, a cruz que o dedo
   encontrava era a do MAPA**, mandando num bonde que nem está mais na rua, e o
   disco da briga não saía do lugar. Duas linhas de CSS resolvem, e resolvem no CSS
   de propósito, sem depender de nenhum código lembrar de apagar nada:
   `body:not(.em-cena) #djPad{display:none}` e `body.em-cena #mapaPad{display:none}`.
   Medido num celular de 390×844: no mapa aparece só a cruz do mapa; na cena de rua
   aparece só a do jogo, `elementFromPoint` no W devolve `pad-w` da cena, e o toque
   em D e em S move o líder 72 px cada. Pelo mesmo motivo o WASD do mapa **não roda
   com a briga aberta**: adiantar o relógio da rua por baixo de uma luta é mexer no
   mundo pelas costas do jogador.
5. **Dirigir andava no passo do relógio parado.** O dia corre 2 minutos de rua por
   segundo e um bonde faz 6 px por minuto: 12 px/s numa praça de 1.254 px de lado, ou
   um minuto e meio de tecla presa pra atravessar a cidade. Dirigindo, o dia corre
   **4× mais rápido** — 8 minutos por segundo, ~52 px/s medidos —, **e corre pra todo
   mundo**: os outros bondes andam junto e o relógio queima igual (medido, 24 minutos
   de jogo por 3 segundos de tecla). Não é atalho, é o preço de atravessar a cidade
   no dedo. Num teste de direção contínua rumo a uma sede a 716 px, 10 s de teclado
   deram **525 px andados e 219 px de aproximação** — a diferença é a rua, que não
   vai em linha reta.

## 8.7 A briga de rua nasce com o efetivo do mapa

`abrirConfronto` montava a cena sem `bondes`, e o mandante com escalação caía no
ramo em que o tamanho do lado é o tamanho da escalação — que já vinha cortada em 34.
Bonde de 80 abria a cena com 34 discos enquanto `efetivoRival` passava inteiro.

- **80 × 60 vira 80 × 60**: 80 discos nossos, **34 com ficha** e 46 povão.
  250 × 180 vira 250 × 180 (34 com ficha, 216 povão). 12 × 400 vira 12 × 400, com
  12 fichas — **nenhum lado clampado por acidente**, nem pra cima nem pra baixo.
- **Vale também para bar, comércio e CT**, que passam pelo mesmo caminho. Ali só o
  NOSSO lado vira bonde: quem defende continua se espalhando pelos pontos que a cena
  declarou, porque no bar são a porta e o fundo do salão e juntar os dois num canto
  mudaria a planta, não o efetivo.
- **Quem não cabe na rua fica na boca dela.** Das duas saídas possíveis — cortar o
  efetivo ou deixar nascer todo mundo e empilhar quem sobra —, ficou a segunda, que
  é o que `pontoLivreMaisProximo` já faz sozinho. Medido antes de fechar, com **400
  discos**, mais do que qualquer bonde que o jogo produz: **rua 91 · rua-média 95 ·
  rua-nobre 99 · praça 88 · arredores 115 FPS**. Com 140: 174 / 180 / 186 / 150 / 217.
- **O maior bonde que o jogo produz de fato** é de **250** (o nosso, em São Paulo), e
  o maior encontro possível soma **310** — medido em 120 dias de jogo de três praças,
  1.291 bondes. Os 400 discos acima cobrem isso com folga.

## 8.8 Correr por inferioridade — e correr não ser derrota

Havia um gatilho de fuga só: 30% de baixas. Um bonde de 8 encarava um de 40 até cair
o trigésimo por cento. Agora há dois, e um terceiro fim de cena.

**O limiar não é metade, é 40%,** e a razão é medida. Com metade, **39%** dos
esbarrões de rua acabavam sem ninguém encostar em ninguém — acima do teto de um terço
que o próprio pedido fixou, e a rua voltaria a ser vazia por outro caminho depois de o
`RAIO_ENCONTRO` ter sido subido justamente pra ela ter briga. A 40% dá **29%**. Os
outros cortes medidos em 80 esbarrões reais de 120 dias de jogo: 1/3 → 20%, 30% → 15%,
25% → 12,5%.

**Três travas no gatilho novo**, e as três estão medidas:

- **Nunca o bonde do jogador.** Em 12 contra 40 o nosso lado só quebrou pelo preço de
  sangue combinado, com **91,7% de baixas** — `debandouPor.mandante = 'baixas'`, nunca
  `'minoria'`.
- **Piso de seis**, o mesmo do preço de sangue: em 10 × 4 o lado de 4 não corre.
- **De perto, e fora dos arredores.** Eles deixam o bonde chegar e só então viram as
  costas: o gatilho pede inimigo dentro do alcance de busca (110/130 px), não a
  distância em que a cena acorda (260 px). Num 40 × 12 a cena acorda em **17,8 s** e a
  debandada dispara em **19,3 s** — um segundo e meio depois, com **zero caídos dos
  dois lados**. Nos arredores a regra não vale: lá ninguém está brigando, está todo
  mundo indo pro portão.
- **Não volta atrás.** `desfezDebandada: false` em todos os cenários medidos.

**Dá pra alcançar quem foge**, e isso precisou de três peças. Sem elas a fuga era
aritmética fechada — eles a 1,25 da velocidade, nós a 1,0 — e o jogador que rastreou o
rival pela cidade abria a cena pra assistir ela terminar sozinha: **zero de doze em
oito corridas**. As três: quem persegue enxerga a 420 px e **corre no mesmo passo**;
o rabo da debandada é **escalonado**, e quem está de frente pro outro bonde é o último
a virar as costas; e **alcançou, pegou** — segundo e pouco de mão em cima e o sujeito
fica, porque no dano normal um disco de vida cheia levaria vinte segundos de contato
pra ir ao chão e a janela de uma fuga é de dois a quatro.

Com as três, num 40 × 12 em dez corridas: **perseguindo, 1 ou 2 dos 12 segurados,
nunca zero**; **parado, 0 em 7 das 10** — e é aí que a tela ELES CORRERAM aparece. O
"alcançou, pegou" vale **só pra debandada por minoria**: quem quebra depois da briga já
está gasto e o 1,6× de sempre já segurava gente (11 de 25 medidos); estender a regra
àquele caso virava toda derrota em extermínio, de 26 caídos de 40 para 36.

**O terceiro fim.** `J.acabou.correram` quando o lado que esvaziou a cena saiu inteiro:
debandou, sumiu pela boca de rua e não deixou **nenhum caído nem preso**. Cartaz
próprio, **ELES CORRERAM**, em tom neutro — nem a classe `boa` nem a `ruim` —, e com os
números que importam no lugar dos de sempre: **eram deles, éramos nós, escaparam**.
Numa fuga limpa os feridos são zero dos dois lados, e zero ali é informação.

**Quanto vale:** `arredonda(BASE × deles/seus)`, preso entre 1 e 6. **BASE 12 e não
3,5**, e de novo por medição: o gatilho dispara em 40%, o que prende a razão abaixo de
0,40 — quem foge nunca foi mais da metade da sua gente, por definição do gatilho. Com
BASE 3,5 toda fuga pagaria `arredonda(≤1,4) = 1`, uma constante, e o pedido era
justamente pagar menos quando a vantagem era maior. Com 12 a faixa volta: **80 × 6 →
1 · 60 × 8 → 2 · 40 × 12 → 4 · 30 × 12 → 5**. Contra a escala normal, que vai de −13 a
+45, a fuga fica entre "nada" e "uma noite fraca de briga de verdade".

Uma correção de canto no caminho: `Math.round(-0.5)` é `-0`, e a tela de relatório
escrevia **"Prestígio -0"** numa noite que deu em nada.

## 8.9 A cidade viva em dia sem nada

Com o mapa vivendo todo dia (§8.6), abrir a tela numa terça mostrava uma planta com
um disco só. A praça tem oito organizadas, cinquenta pinos e 5.478 nós de rua: ela
precisava parecer habitada. Três coisas, com pesos deliberadamente diferentes —
**andarilho e esbarrão são paisagem**, todo dia e em volume baixo; **assalto é
notícia**, dois ou três no mês inteiro.

### Os dois números que controlam a rua

A regra do esbarrão é "sempre briga" — sem sorteio de coragem, sem desvio. Então
quem decide a frequência é a **densidade**, e briga cresce com o **quadrado** dela.
A curva, medida em 42 dias de São Paulo:

| andarilhos/dia | raio | na tela (média · pico) | brigas/semana |
|---|---|---|---|
| 14 | 7 | 1,5 · 10 | 1,5 |
| 18 | 7 | 2,2 · 17 | 4,3 |
| **20** | **5** | **2,4 · 18** | **4,0** |
| 24 | 7 | 2,6 · 18 | 6,0 |
| 30 | 5 | 3,4 · 22 | 5,5 |
| 48 | 10 | 4,8 · 31 | 22,0 |
| 90 | 5 | 8,5 · 55 | 48,2 |

O raio corta uns 25% e nada mais. Ficou em **20 por dia, raio 5**, e o número está
num objeto (`TO.ruas.VIDA`) justamente porque é o que se mexe quando a praça parece
vazia — sabendo o preço.

Duas descobertas no caminho, as duas medidas:

- **Cada um anda no seu pedaço.** Sorteando origem e destino entre os cinquenta
  pinos, todo andarilho atravessava a cidade e passava pelo território de todos:
  34 por dia davam 17,7 brigas por semana. Gente anda onde mora — o trajeto sai dos
  pinos da própria torcida mais o comércio a 340 px da sede dela. Só que fechar o
  bairro **inteiro** isolou cada torcida no seu quarteirão e a nossa passou uma
  temporada sem cruzar com ninguém: zero baixas em 38 semanas com relação −60
  contra as sete outras. **Um em cada três trajetos atravessa a cidade** — é esse
  que encontra os outros.
- **Quem sai à rua é sorteado.** A escolha era o primeiro da lista de disponíveis, e
  a lista começa pela diretoria: os andarilhos nossos eram sempre os quatro caras
  mais fortes da torcida. Cinco esbarrões, cinco vitórias, zero feridos. E a força
  de quem não tem ficha (a torcida de IA não tem lista de membros) precisou cair na
  **mesma escala** dos nossos: medida a lista de 250, `força+defesa/2` dá 8,5 no
  primeiro quartil e 15,5 no terceiro, então a torcida de 20 vale 7 e a de 250 vale
  12. Depois disso, **31 esbarrões nossos em 120 dias: 19 ganhos e 12 perdidos**.

### Os números de aceite

1. **Andarilhos e FPS.** 20 por dia numa praça Grande, **até 20 na tela ao mesmo
   tempo** no horário de pico e 2,4 em média ao longo das catorze horas do dia. O
   mapa desenha em 0,52 ms por quadro — a cidade viva não custa nada perto do
   próprio desenho da planta.
2. **Brigas por semana:** 2,5 em São Paulo (20 pares hostis de 28), 2,9 no Rio (20
   de 28) e **2,4 em Belo Horizonte, que tem só 4 pares hostis de 10** — a
   rivalidade da praça mexe menos do que a densidade, porque quem não é hostil
   simplesmente passa direto.
3. **Assaltos: 2,42 por mês**, medidos em **116 meses** (12 temporadas de cada uma de
   três praças). **111 desses meses fecham em exatamente 2 ou 3**; os 5 de fora são
   os blocos partidos pelo fim da temporada, que não têm as quatro semanas
   inteiras. O bloco é sorteado por hash da data, então **o mesmo dia reaberto
   mostra o mesmo assalto** — conferido abrindo e fechando o mapa três vezes: mesma
   foto, `banco@785,605|Independente|563`.
4. **Quem assaltou, contra o efetivo:** Gaviões 250 → 5 assaltos, Independente 196 →
   5, Mancha Verde 200 → 5, TUP 76 → 3, Dragões 74 → 2, Camisa 12 78 → 1. As três
   grandes levam 15 dos 24; as pequenas aparecem, mas raro.
5. **Sucesso por alvo** — o alvo grande rende mais e prende mais, que é a tesoura
   que o desenho queria. Em 281 assaltos de São Paulo ao longo de 12 temporadas:

   | alvo | assaltos | presos | proporção |
   |---|---|---|---|
   | roupas | 57 | 0 | 0% |
   | mercadinho | 48 | 4 | 8% |
   | posto | 63 | 17 | 27% |
   | joalheria | 55 | 22 | 40% |
   | **banco** | 58 | **38** | **66%** |

   No total, 20% a 29% presos conforme a praça. Cada assalto que dá certo rende de
   R$ 60 (mercadinho) a R$ 504 (joalheria) — uma fração de 12% do piso da faixa,
   porque isto é um cara levando a gaveta e não um bonde invadindo.
6. **O que rendeu pra nós:** R$ 1.320 numa temporada simulada inteira, **1,14% da
   receita total** de R$ 115.480. Na varredura longa o ganho fica entre R$ 344 e
   R$ 1.236 por temporada conforme o tamanho da torcida na praça — a Máfia Azul, que
   é enorme perto das outras quatro de Belo Horizonte, leva 117 dos 281 assaltos e
   fica na ponta de cima. Em qualquer dos casos é extra, não torneira.
7. **A viatura:** mediana de **9 minutos** do chamado até a porta, pior caso 18, e
   **42% chegam a tempo**. Ela não sai sempre do posto mais perto: com o mais perto
   sempre, o banco era preso em 7 de 7 e não rendia nunca; com qualquer um por
   sorteio limpo, só 13% eram presos. 62% de chance do mais perto é o meio.
8. **As penas:** joalheria e banco 60 dias, roupas, posto e mercadinho 30 — e o
   contador desce em `passarDia` até sair. O preso de dia de jogo continua com
   `dias:null` e sai pelo sorteio de 3% ao dia ou por fiança. Os dois modelos
   convivem no mesmo campo porque objeto é *truthy*: `disponivel` não mudou.
9. **Nenhuma baixa silenciosa:** 27 feridos e presos nossos numa temporada, **27 no
   ticker e 27 no cartão de Avisos** da tela de Início, cada um com o motivo.
10. **O histórico diz a verdade:** "Ferido num esbarrão na Aldeota, 4 dias fora",
    "Preso assaltando banco do Centro — 60 dias". `ferir` e `prender` passaram a
    receber o motivo de quem chamou; sem motivo, o padrão continua sendo o dia de
    jogo.
11. **Membro nosso preso num assalto: cerca de dois por temporada** — e isto
    contraria o que a primeira medição sugeria. Uma temporada só tinha fechado em
    zero, e daí a impressão de raridade; em 12 temporadas de cada praça o número é
    **2,17 por temporada com a Gaviões, 2,08 com a Máfia Azul e 1,0 com a Young
    Flu**, que é menor na praça dela. Não é raro: é regular, uma ou duas vezes por
    ano. **A pena não tira gente demais de circulação**: duas prisões de 30 a 60
    dias somam uns 90 dias-membro numa temporada de 266 dias, o que dá em média
    **0,3 membro na cadeia a qualquer momento** numa torcida de 250 — visível na
    ficha, longe de fazer falta no bonde.
12. **Ninguém atravessa quarteirão:** o andarilho ficou fora do asfalto em 5.357 de
    454.158 amostras (1,2%, o mesmo meio-de-aresta dos bondes) e a **viatura em 0 de
    5.002**.
13. **Dia de jogo não muda, e isso é exato.** O mesmo dia rodado com a cidade viva e
    sem, a partir do mesmo estado do mundo, em 12 dias de jogo de duas praças:
    **mesmo número de bondes, mesmas horas de saída, mesmos encontros, mesmas
    chegadas** — idênticos. Para isso a sorte do esbarrão teve de vir de hash e não
    de `U.rng()`: cada briga consumindo do fluxo compartilhado empurrava o sorteio
    de tudo que vem depois, e um mês de jogo dava 123 bondes contra 128 sem que
    regra nenhuma tivesse mudado.

## 8.10 Arredores enxutos: HUD limpa, 1×/2× e a entrada pelo portão

Cinco arrumações nos arredores, todas de coisa que tinha entrado na tela por acidente
e ficado.

**O botão que não era do jogo.** "Nova noite" veio da bancada de teste, onde serve pra
sortear uma cena nova sem recarregar. Dentro do jogo ele jogava a partida fora no meio.
Saiu do `index.html` e do `ponte.js`; a bancada (`arredores.html`) continua com ele.

**A HUD.** O palco tinha nove peças em cima do canvas, e três delas estavam `hidden` —
invisíveis, mas o `atualizarHUD` escrevia nelas a cada quadro. Ficou o que muda e o que
se olha no meio da briga:

| peça | destino | por quê |
|---|---|---|
| `djRelogio` | ficou | é a conta regressiva do apito |
| `djPlacar` | ficou | caídos dos dois lados |
| `djAviso` | ficou | é o grito da cena, aparece e some |
| `djAlerta` (PM) | encolheu | duas barras empilhadas com rótulo em caixa alta viraram uma faixa: sigla, barra da atenção e, colada, a fita fina da pressão, que só acende quando há pressão |
| `djSubrelogio` | saiu | repetia o relógio em miúdo |
| `djDica` | saiu | texto de tutorial permanente |
| `djLocal`, `djLog`, `djSliders` | saíram do jogo | eram `hidden` e continuavam sendo escritos |

O que não fizemos, e é honesto registrar: as escritas em `djLocal`, `djLog`,
`djSliders`, `djSubrelogio` e `djDica` **não foram apagadas** — foram movidas pra um
bloco só, `atualizarHudDeBancada()`, atrás de um `acharHudDeBancada()` que devolve
`null` quando os elementos não existem. A bancada usa essas cinco peças de verdade, e
duplicar o `atualizarHUD` em duas versões custaria mais do que o desvio de um `if` por
quadro. No jogo o bloco é um teste nulo; na bancada, tudo continua funcionando.

**1× e 2× por sub-passo.** Dobrar `dt` seria uma linha e quebraria a física: com
`dt` de 33 ms um disco a 240 px/s anda 8 px por quadro, e as colisões dos arredores são
por distância. A velocidade virou um laço — `for(let i=0;i<velocidade;i++) C.passo(...)`
— com o mesmo `dt` de sempre. Duas vezes o passo, não um passo maior. O botão mostra o
estado **de agora** (`1×` acesa em cinza, `2×` em ouro), não o que vai virar.

**O relógio do mapa.** Ele avançava por dentro e a tela só descobria no próximo
`redesenhar()`, que é a planta inteira — 5.478 nós, 0,52 ms, mas com o canvas todo. O
relógio saiu do canvas: virou um `<span>` de HTML por cima do mapa, pintado por
`pintarRelogioDaRua()` a cada quadro. O desenho da cidade continua acontecendo só
quando alguém se mexe.

**"Entrar pelo estádio" virou ordem.** Era um encerramento: clicava, a cena acabava.
Agora é uma ordem de marcha — todos os nossos discos vivos andam **cada um pro seu
portão**, deixam de ser agressivos no caminho, empurram as grades que estiverem na
frente, e a cena só fecha quando o último entrou ou quando estourou o tempo
(`TEMPO_DE_ENTRAR = 90 s`, com escape por emperro). O líder entra junto — foi preciso
abrir a exceção `if(d.lider && !d.entrando) continue;` no `moverDiscos`, que até então
deixava o líder parado esperando WASD. **Isto vale só nos arredores**: nas outras cinco
cenas o botão continua sendo saída, com o rótulo de cada uma.

Aqui apareceu um defeito **que já existia** e ninguém tinha visto, porque o botão nunca
tinha sido usado como ordem: com o cordão de PM montado, o `mandante1` — o ponto de
nascimento do jogador — **não tem rota até o `ent_mandante1`**. São 54 barreiras, e o
Dijkstra da malha devolve `semRota`. Era por isso que "Entrar pelo portão" vivia
apagado. A saída foi `portaoAlcancavel(J,d)`: cada disco procura o portão **alcançável**
mais próximo do próprio lado, e discos com `entrando` ganharam permissão de empurrar
grade. O portão certo continua sendo o primeiro da lista quando há rota até ele.

### Os números de aceite

1. **"Nova noite" não existe mais no jogo:** `{"novaNoite": 0}` — nenhum botão, nenhum
   `id`, nenhum atalho de teclado no `index.html` nem no `ponte.js`.
2. **Nada escondido no palco:** `escondidosNoPalco: []`. E os cinco que saíram de fato
   não estão lá: `djSubrelogio`, `djRotPressao`, `djLocal`, `djLog`, `djDica`,
   `djSliders` — todos `null` no `document`.
3. **O print antes e depois** (`hud_antes.png` / `hud_depois.png`): a área ocupada por
   HUD caiu de **182.015 px² para 140.008 px²**, de **19% para 14,6% do canvas**. O que
   voltou é a faixa de cima à esquerda e a de baixo: o cordão de PM e a primeira linha
   de discos deixaram de ficar atrás de texto.
4. **2× cabe no orçamento, e é idêntico a 1×.** Custo medido de um sub-passo:

   | discos | 1 sub-passo | 2× (dois) | folga em 60 fps |
   |---|---|---|---|
   | 140 | 1,37 ms | 2,74 ms | 14,0 ms |
   | 250 | 2,75 ms | 5,50 ms | 11,2 ms |
   | 510 | 6,09 ms | 12,18 ms | 4,5 ms |

   E a prova que interessa não é a de relógio, é a de igualdade: **120 sub-passos
   rodados como 120 quadros de 1× e como 60 quadros de 2×, a partir da mesma semente,
   dão o mesmo estado** — posição e hp dos 510 discos, `estadoIdentico: true`. O maior
   salto de um disco num único sub-passo foi de **96,7 px**, e é a ejeção de grade que
   já existia antes: acontece igual nas duas velocidades.
5. **O relógio anda o dobro, não o tempo:** o mesmo trecho de cena dá **1 minuto de
   jogo em 1× e 2 minutos em 2×**, razão exata de 2, e `saidasIguais: true` — os bondes
   saem nos mesmos horários nas duas velocidades.
6. **O relógio do mapa anda na tela sem redesenhar a planta:** `{"andou": true,
   "mesmoCanvas": true, "zoomIgual": true}` — de **16:03 a 16:08** com a simulação
   rodando, byte do canvas inalterado e o zoom onde estava.
7. **Todo mundo entra: 250 de 250**, `porEmperro: 0`. Em cena parada leva **35,3 s**; no
   meio da briga, **34,4 s**.
8. **Ninguém apanha no caminho:** `caidosDelesDepois: 0` nas duas medições — os discos
   com ordem de entrar deixam de ser agressivos e o outro lado não os persegue até o
   portão.
9. **As outras cinco cenas não mudaram:** bar "Balcão do bar (leve o líder)", comércio
   "Porta de aço", CT "Gramado", praça "Saída", rua "Boca da rua" — todos desabilitados
   até a condição de cada um, e nenhum deles emite ordem de entrada.

## 8.11 O cordão que selava o portão do jogador

O §8.10 fechou com um contorno: como do spawn do jogador não havia rota até o portão
dele, cada disco ia pro portão do mesmo lado mais perto que tivesse caminho. Contorno
de bug de arte — e contorno silencioso, que é como o defeito tinha passado despercebido
desde o começo. Agora o defeito foi consertado na arte, o contorno saiu, e no lugar
dele ficou um alarme.

**A geometria, medida no motor.** Na altura da `fila_m1` o corredor tem 144 px de chão,
de x=224 a x=368. A fila ia de x=234 a x=347: sobravam **10 px a oeste e 21 a leste**.
Vinte e um pixels não passam ninguém — o disco tem raio 7, a grade tem 4,5 de
meia-espessura, e a malha de navegação exige a célula inteira livre. O portão do 1º
escalão mandante ficava selado.

**O corte foi de 18 px na ponta leste**, `[347,201]` → `[329,201]`. O vão leste medido
na linha y=201 vai de **20 px para 38** — a mesma ordem do vão de ~34 px que o
comentário da `fila_v4` já documentava como vão que funciona. Leste e não oeste porque
é por leste que o zigue-zague desemboca: a `fila_m2` acaba em x=318 e a `fila_m3`
começa em x=373, então quem sobe do sul chega na `fila_m1` já pela direita. Cortar a
oeste também abriria rota e jogaria a passagem pra junto do muro, desmanchando o
desenho.

### Os números de aceite

1 e 2. **A rota, com o motor e não com um modelo do dado.** Três medidas por spawn: a
   malha que o jogo usa (`campoDaEntrada`), e um modelo físico com a parede por
   `livrePara(raioMalha(r))` e a grade inflada pelo raio do corpo — que é onde
   `barrarGrades` de fato empurra — para r=7 e para o r=9 do líder.

   | spawn → portão | antes (malha / corpo 7 / corpo 9) | depois |
   |---|---|---|
   | mandante1 → ent_mandante1 | **não / não / não** | sim / sim / sim |
   | mandante2 → ent_mandante2 | sim / sim / sim | sim / sim / sim |
   | mandante3 → ent_mandante3 | sim / sim / sim | sim / sim / sim |
   | visitante1 → ent_visitante | sim / sim / sim | sim / sim / sim |
   | visitante2 → ent_visitante | sim / sim / sim | sim / sim / sim |

   Só a rota quebrada mudou.

3. **`portaoAlcancavel()` não existe mais**, o campo `d.portao` também não, e cada disco
   anda pro `d.entrada` do escalão dele. Em **12 medições** — 40, 150 e 250 discos, três
   sementes cada, mais três no meio da briga — **`portaoErrado` deu 0 em todas**:
   ninguém parou junto de portão alheio. Junto veio um vazamento do §8.10: o **ENTER**
   tinha caminho próprio (`noPortao` e encerra a cena), que só não aparecia porque o
   portão vivia inalcançável. Agora o atalho chama a mesma função do botão.
4. **A marcha, com o tempo e o motivo de quem não chega.** Torcida espalhada, ordem de
   entrar, todos pro próprio portão:

   | cena | chegaram | por emperro | levados pelo relógio | segundos |
   |---|---|---|---|---|
   | 40 discos, noite parada | 40 de 40 | 0 | 0 | 56,6 · 56,7 · 58,3 |
   | 150, noite parada | 148 de 149 | 0 | 0 | 71,5 |
   | 250, noite parada | 221 a 236 de 249 | 0 a 1 | 2 a 14 | 90 (estourou) |
   | 150, no meio da briga | 137 de 137 (1 semente) | 0 | 0 | 72,5 |
   | 150, no meio da briga | 83 e 86 (2 sementes) | 0 | 41 e 42 | 90 (estourou) |

   Quem não chega **não é rota**: dos 41 que ficaram pra trás na pior semente,
   `semRota` deu 0 — todos com caminho, todos andando a 25 px/s e nenhum saindo do
   lugar. É a **PM**. Medido num deles: 13 policiais num raio de 120 px, nenhum outro
   disco num raio de 70, posição idêntica por 12 segundos. Com esse tanto de gente a
   esplanada rompe o cordão, a tropa de choque entra e prende — 10 a 13 dos nossos por
   noite de 250 — e quem fica dentro do caldeirão é segurado ali. O escape de 90 s
   existe pra isso, e nessas noites é ele que fecha a cena. Levantar o prazo não
   resolveria: medido com o escape em 400 s, a conta **empaca em 41 e não desce mais**
   até os 170 segundos.
5. **A verificação está na bateria** (`ferramentas/prova_portoes.py`, ao lado do
   `prova_mascara.py` — é o primeiro teste da bateria que passa a morar no repositório,
   justamente porque o que ele pega é bug de arte) e passa nas oito cenas: arredores,
   praça, rua, rua-média, rua-nobre, bar, comércio e CT — **nenhum spawn sem rota até o
   portão dele**. Ela não é enfeite: repondo os 18 px da `fila_m1`, o teste volta a
   apontar `mandante1 → ent_mandante1 (sem rota)` e sai com código 1. Em cena, a mesma
   função (`C.conferirPortoes`, chamada no fim de `criarEstado`) escreve
   `PORTÃO SELADO: cena 'arredores': mandante1 não tem rota até ent_mandante1` no log da
   cena e no console.
6. **O print** (`vao_fila.png`): a coluna sobe pela calçada leste, vira entre a ponta da
   `fila_m3` e a fachada, e passa em fila indiana pelo vão da `fila_m1`. O zigue-zague
   continua lá — três barras, duas curvas obrigatórias —, não virou corredor reto.
7. **Bateria limpa**, `ERR []` em `conect`, `acoes_ui`, `pad`, `pad2`, `bundle_check` e
   `portoes`.

## 8.12 A cor da torcida na cena: círculo externo primária, miolo secundária

O disco sempre foi desenhado em duas camadas — círculo no raio cheio, miolo a 62% —,
mas só a de fora era da torcida. O miolo caía no tom claro genérico do lado, e a
**segunda cor da torcida não aparecia em lugar nenhum do jogo**. Sem o miolo separando,
duas torcidas de primária igual eram o mesmo disco, e por isso a escolha de cor da
noite pulava pra próxima cor da paleta de quem chegasse depois. Foi assim que a Torcida
Jovem do Galo, paleta `['#FFFFFF','#FFFFFF']` com detalhe preto, entrou na esplanada de
**preto** num jogo contra a TUF.

**A paleta mente, e a secundária tem de ser procurada.** Cinquenta das 140 torcidas
repetem a primária em `cores[1]`. A regra: a secundária é a primeira de `cores[1:]`
seguida de `detalhe` que seja **diferente da primária**. `M.coresDaTorcida(o)` é o
único lugar que sabe disso, e as três telas que precisam de cor chamam ele.

**A cadeia foi aberta.** A primária percorria cinco pontos — `elencoDaNoite` →
`nasce()` → `R.arredores` → `bondes` do config → `d.cor`; a secundária agora percorre
os mesmos cinco, como `cor2`, incluindo o bonde escoltado, que se parte em duas
torcidas na esplanada, e as cenas de ação, que montam o bonde direto da nossa torcida.
No mapa nada mudou: lá o bonde continua sendo um círculo chapado com a sigla em cima.

**Ninguém troca de cor.** Cada torcida usa a própria primária, sempre. Isso só é
seguro porque o miolo separa: das 140 saem **11 primárias distintas** (branco em 55,
preto em 19, vermelho em 19) e **2.052 pares** dividem a primária, mas **1.448 desses
se distinguem pelo miolo**. Sobram **604 pares** em que as duas cores batem — aí quem
manda fica com a cor verdadeira e quem visita recebe um **tom da primária**, na direção
que dá contraste: branco escurece (branco mais claro não existe), preto e vermelho
clareiam. Vale igual quando o visitante somos nós.

### Os números de aceite

1. **O caso relatado, no save de verdade.** TUF, dia 41, **Fortaleza × Treze (Copa do
   Nordeste)**. As duas com primária branca e nenhuma trocou de cor:

   | torcida | externa | miolo |
   |---|---|---|
   | Leões da TUF | `#FFFFFF` | `#1A40CC` azul |
   | Torcida Jovem do Galo | `#FFFFFF` | `#000000` preto |
   | Jovem Garra Tricolor | `#1A40CC` | `#CC1414` |

   **Nenhum disco preto por fora** — o print `cor_tuf_treze.png` mostra os dois bondes
   lado a lado, brancos por fora, azul contra preto por dentro.
2. **Em toda cena.** Cearamor (preto + amarelo) entra com externa `#000000` e miolo
   `#FFD900` no **bar**, no **comércio** e no **CT**, em 150, 12 e 150 discos, todos
   iguais. No dia de jogo, 12 dias de duas praças: **nenhum bonde chegou na esplanada
   sem a secundária certa**, incluindo **6 casos de escolta** — Jovem Garra Tricolor
   escoltando Trovão Azul entra com o próprio `#1A40CC`/`#CC1414`. Na cena solta da
   bancada `d.cor` é nulo e as duas camadas continuam sendo as do lado.
3. **Nas 60 noites:** 237 torcidas-noite, e **22 fora da própria primária — todas pela
   regra do tom**, nenhuma por outro motivo. O miolo nunca mudou: `cor2` é sempre a
   secundária de verdade da torcida. Por praça: 13 de 72 em São Paulo, 0 de 52 em Belo
   Horizonte, 4 de 50 em Fortaleza, 5 de 63 no Rio.
4. **O caso do tom** (`cor_tom_branco.png`): branco + preto contra branco + preto. O
   mandante sai com `#FFFFFF`, o visitante com `#BDBDBD`, os dois com miolo preto — e
   os dois painéis do print estão sobre o mesmo asfalto, porque com um fundo de calçada
   atrás de um lado só o que separaria seria o fundo, não a cor.
5. **A direção do tom, nas 11 primárias que existem.** Branco escurece, preto clareia,
   vermelho clareia, amarelo escurece, azul-claro escurece:

   | base | direção | 1º passo | 2º | 3º |
   |---|---|---|---|---|
   | `#FFFFFF` branco | escurece | `#BDBDBD` | `#8A8A8A` | `#575757` |
   | `#000000` preto | clareia | `#424242` | `#757575` | `#A8A8A8` |
   | `#CC1414` vermelho | clareia | `#D95151` | `#E38080` | `#EEAFAF` |
   | `#FFD900` amarelo | escurece | `#BDA100` | `#8A7500` | `#574A00` |
   | `#0D731A` verde | clareia | `#4C9756` | `#7CB383` | `#ADCFB1` |

   O menor salto de luminância no primeiro passo é **0,129** (o cinza `#808080`, uma
   torcida só) e a menor distância RGB é **57** — nada indistinguível. E o **matiz não
   gira**: a maior diferença medida em 33 tons é de **1 grau**, porque escurecer é
   multiplicar os três canais e clarear é misturar com branco. O tom é sempre a cor da
   torcida, mais clara ou mais escura, nunca uma cor que ela não tem.
6. **Três com a mesma paleta na mesma noite**, achado no save: preto + branco com
   **Gaviões `#000000`, Pavilhão 9 `#424242` e Ira Jovem do Vasco `#757575`** — três
   externas distintas, o mesmo miolo branco, e a sigla por cima.
7. **Torcida sem segunda cor** (`cor_sem_segunda.png`): com `cor2` nulo o miolo cai no
   tom claro do lado e o disco continua legível — amarelo com miolo claro, verde com
   miolo claro. Nas 140 do arquivo **não existe esse caso hoje**: todas têm secundária
   de verdade. O print é de uma paleta montada à mão justamente pra provar a queda.
8. **A mesma noite reaberta pinta igual:** 60 noites remontadas, **0 divergências** de
   cor, miolo ou sigla; e **0 siglas repetidas** e **0 discos idênticos** dentro de uma
   noite.

**O que isso custa, e é honesto dizer:** no mapa o bonde é um círculo chapado, então
duas torcidas de primária igual passaram a ser dois círculos da mesma cor lá. Medido
nas 60 noites: **38 grupos** de bondes dividindo a cor chapada. Quem separa no mapa é
a sigla, que continua única por noite — e a cena, que é onde a briga acontece, separa
pelo miolo.

## 8.13 A barra do mapa virou ícone sobre o mapa

O mapa é a tela principal do jogo, e tudo que manda nele morava numa barra **acima**
dele: o mapa começava depois de uma faixa de sete botões de texto. Agora o que manda
está **por cima** — relógio no canto de cima à esquerda, quatro ícones colados na
borda de cima, zoom onde sempre esteve no canto direito.

**O relógio mudou de lugar sem voltar a congelar.** Ele tinha acabado de ser
consertado (§8.10) pra andar dentro do laço de `rodarRelogio` em vez de esperar
`redesenhar()`. A referência guardada é a mesma de antes, só o pai mudou: medido num
dia sem jogo, **o texto mudou 14 vezes em 6 segundos e o nó foi trocado 0 vezes**.

**Os quatro ícones vêm de `IC.get`**, em vetor como os do resto do jogo, e cada um
mostra o estado **de agora**, não o próximo:

| controle | ícone | estado |
|---|---|---|
| rodar o dia | ▶ / ❚❚ / raio | vira pausa enquanto roda; vira raio vermelho piscando em `Confronto!`; apaga quando o dia acabou |
| velocidade | `1×` / `2×` escrito | acende em ouro no 2× — velocidade não tem desenho que se leia sem legenda |
| olheiro | olho | aceso com olheiro posto **e** enquanto espera o clique no mapa |
| sair da sede | porta com seta | apagado quando não dá |

**Todo ícone tem `title`**, e o title carrega o que o botão dizia antes — motivo de
travamento incluído. O rótulo de botão travado, que este projeto faz questão de
mostrar ("Não sobrou ação esta semana"), passou pro tooltip: `Sair da sede — não
sobrou ação esta semana`.

**Uma HUD que se encaixa no mapa visível.** O quadro do mapa é mais largo que a
planta em zoom baixo; grudar a HUD no canto do quadro punha o relógio "dentro do
mapa" boiando no fundo vazio, longe da cidade. O que vale é a interseção entre o
visor e a planta, **e também a janela** — recalculada no zoom, no arrasto, na
rolagem (em captura, porque quem rola muda com a largura da tela) e no redimensionar.

**"Pontos do mapa" voltou pra dentro do mapa, recolhido.** Ele já esteve por cima do
mapa uma vez e foi pra margem porque, com a arte no lugar da planta esquemática,
tapava bairro de verdade. Volta como botão abaixo do relógio: começa **fechado**,
abre uma coluna de **178 px por 223**, e **escolher um tipo fecha de novo** — o que
ele tapa, tapa por dois segundos.

**"Baixar planta (PNG)" saiu da tela do jogador**, e só o botão: `TO.mapa.paraImagem`
e `TO.mapa.baixarImagem` continuam de pé — é a ferramenta de autor que gerou as
`planta-*-2048.png` que viraram base das artes.

### O que foi conferido

1. **Nada de emoji e nada de ícone mudo:** os quatro têm SVG (ou o número, no caso do
   1×/2×) e **`title` em todos os quatro**, zero sem rótulo.
2. **Os estados**, medidos clicando: parado `Rodar o dia` com ▶; rodando `Pausar o
   dia` com ❚❚; `Velocidade do relógio — agora em 2×` aceso; olheiro armado com
   `Clique num ponto do mapa pra pôr o olheiro` aceso; e, quando dois bondes hostis
   se cruzaram, `Confronto! — abrir a briga` em vermelho.
3. **O relógio dentro do mapa e fora da barra:** `relogioNoPalco: true`,
   `relogioNaBarra: false`, e na barra restou só a `.rua-info` — o confronto do dia e
   quantos bondes na rua, que era pra ficar.
4. **O botão da planta não existe mais** na tela (`0` botões com esse texto) e as duas
   funções continuam existindo (`paraImagem` e `baixarImagem`, ambas `function`).
5. **Celular, 390×844 e 844×390**, com a cruz de WASD montada e o mapa antes e depois
   de rolar: **nenhuma sobreposição** entre a faixa de ícones, o relógio, o botão dos
   pontos, o `#topo`, a cruz e os botões de ação do pad — oito pares testados em
   quatro estados. O mapa continua rolável (404 px de rolagem horizontal em retrato).
   Dois ajustes saíram dessa medição: em retrato a faixa e o relógio se tocavam por
   **8 px**, e os dois encolheram; deitado, o botão dos pontos descia até a altura da
   cruz, e o canto virou uma linha — relógio e botão lado a lado, porque 390 px de
   altura não dão pra empilhar.
6. **Deitado, a HUD não sai da tela com a página.** O `#topo` do celular tem
   `position:sticky` mas o container dele rola inteiro, então a barra some junto — e a
   faixa de ícones ia junto com ela. A HUD passou a ser cortada também pela janela:
   encosta no alto da tela e fica onde a mão alcança enquanto a cidade desliza por
   trás. Quando o mapa sai inteiro de vista a altura vira zero e o `overflow:hidden`
   some com ela, porque ícone pendurado num mapa que não está mais ali é pior que
   ícone nenhum.
7. **Bateria limpa**, `ERR []` em `conect`, `acoes_ui`, `pad`, `pad2` e
   `bundle_check`.

## 8.14 O mapa vira o jogo

Até aqui o jogo eram onze páginas e uma delas era o mapa. Agora **a tela é o mapa**,
e a gestão é periférico dele: o cabeçalho e a barra lateral viraram HUD sobre o
canvas, as onze páginas viram painéis que abrem por cima e fecham, e a casca do
`#jogo` deixou de ser o grid `marca / topo / lateral / tela / ticker` para ser mapa +
ticker. É a mesma inversão que o celular já tinha, valendo em qualquer largura.

**O dia já começa rodando.** Antes o jogador precisava apertar play, e o relógio
parava sozinho em três lugares sem nunca religar: no encontro, ao avançar o dia e ao
fechar a cena. Agora ele nasce ligado — e por isso precisou de motivos de pausa
explícitos, guardados num conjunto: `painel` (o jogador está lendo, não jogando),
`foco` (aba sem foco), `salvar` e `cena`. Enquanto houver motivo, o relógio não anda;
quando o último sai, ele volta **de onde parou**, porque o `ultimo` do laço é zerado
a cada partida e o tempo parado não é cobrado.

**As seis âncoras**, resolvidas antes de codar porque duas já disputavam o mesmo
canto:

```
┌──────────────────────────────────────────────────────────┐
│ [relógio]        [play][1×][olho][sair]        [data][▶] │
│ [pontos ▸]                                        [zoom] │
│ [menu ×11]                                               │
│  ...                          MAPA                       │
│ [escudo] Cearamor · FORTALEZA CE   R$ 6.000  150  60     │
├──────────────────────────────────────────────────────────┤
│  ticker de notícias                                      │
└──────────────────────────────────────────────────────────┘
```

O recolhível dos pontos **abre para o lado**, não para baixo: embaixo dele mora a
coluna do menu, e aberto para baixo ele cobriria os onze ícones.

### Três desvios, e por quê

- **O zoom mudou de âncora.** Ele estava preso ao canto da *planta*, não da tela.
  Com o mapa maior que o visor — que virou o caso normal, porque o mapa agora é a
  tela inteira — o canto de cima à direita da planta fica fora da vista, e o zoom ia
  junto. Passou a ser HUD, embaixo da data. Mesmo controle, mesmos botões.
- **O zoom padrão passou a encher o visor.** Eram 760 px fixos, de quando o mapa era
  um cartão no meio de uma página. Abrir a tela do jogo com moldura de fundo vazio em
  volta da planta não seria a tela do jogo.
- **O título "Mapa da cidade — Fortaleza, CE" saiu.** Era o nome de uma tela entre
  onze; a praça foi para a faixa de baixo, ao lado do nome da torcida. Quarenta
  pixels de moldura em cima do jogo. A linha informativa da rua (o confronto do dia,
  quantos bondes) continua onde estava, que é o que o pedido mandava manter.

### O save estava quebrado, e a criação do critério 3 é que descobriu

Salvar devolvia `Converting circular structure to JSON`: `E.ruas` guarda os bondes do
dia, cada bonde guarda a rota, e a rota é uma lista de **nós da malha da cidade** —
que apontam para os vizinhos, que apontam de volta. **O jogo estava sem save nenhum
desde que a rua ganhou malha**, e ninguém tinha visto porque salvar era um Ctrl+S
silencioso e o fechamento de semana engolia o erro. O save agora omite `E.ruas`, que
é cache: `TO.ruas.montar` reconstrói o dia inteiro a partir do calendário. O que se
perde ao carregar é onde os bondes estavam no meio da tarde; o dia recomeça do
começo, que é o estado que o save descreve.

### Os números de aceite

1. **Abre rodando:** minuto 4 ao abrir, 8 dois segundos depois, `rodando: true`, sem
   ninguém apertar nada. **Avançar o dia** recomeça no minuto 1 e já está em 5 dois
   segundos depois. **Fechar a cena de um confronto** devolve o dia rodando — é o
   `retomarDia('cena')` no `fecharDiaDeJogo`.
2. **Pausa e retoma sem pular:** com painel aberto, minuto 8 ao abrir e **8 depois de
   três segundos**; ao fechar, ainda 8, e volta a andar. Aba sem foco: 12 → 12 → 12,
   e anda de novo no `focus`.
3. **Salvar com o dia rodando:** `{ok:true}`, chave `torcida-organizada:save`
   escrita, e o dia continua correndo depois. Conferido o ciclo inteiro: salvar,
   recarregar a página, **Continuar** — volta na semana 1, dia 4, R$ 6.000, com mapa,
   menu e relógio andando.
4. **Os onze ícones abrem os onze painéis:** dez painéis testados um a um (o décimo
   primeiro é o próprio mapa, que fecha), todos com `.painel.on`, **conteúdo pintado**
   e o ícone aceso; **zero sem `title`**.
5. **Em tela larga não existe `#lateral` nem ☰** (`display:none` nos dois) e a coluna
   está lá; em tela estreita a coluna não existe e a gaveta do ☰ continua sendo o
   caminho.
6. **Nenhum resto do cabeçalho:** `#topo` e `#marca` não existem no documento. Data e
   avançar no canto de cima à direita; escudo, nome, praça, saldo, membros e
   prestígio na faixa de baixo — **membros e prestígio foram para lá**, junto do
   saldo, que é onde os três já eram lidos lado a lado.
7. **Abrir e fechar painel não mexe no mapa:** o mesmo nó de canvas (`mesmoCanvas:
   true`), zoom em 100% e a rolagem do visor onde estava, com o dia rodando de novo
   no fim.
8. **Nada se sobrepõe:** doze elementos cruzados dois a dois — relógio, botão dos
   pontos, lista aberta, coluna do menu, controles, data, zoom, faixa de baixo,
   ticker, ☰, cruz de WASD e botões do pad — em **1280×800, 390×844 e 844×390**, com
   o recolhível fechado e aberto: **zero pares sobrepostos nos seis estados**. Três
   ajustes saíram daí: em 390 px não cabem relógio, controles e data na mesma linha
   (74 + 155 + 140 passa da largura), então os controles descem uma linha; deitado, a
   lista abre à direita, embaixo do zoom, porque o canto de baixo à esquerda é da
   cruz de WASD; e a faixa da torcida se esconde enquanto o pad de dirigir está na
   tela.
9. **O laço para de verdade, e isto foi contado, não presumido:** instrumentando o
   `drawImage` do canvas do mapa, **90 quadros em 1,5 s com o mapa na frente e 0
   quadros em 1,5 s com um painel aberto**.

## 8.15 HUD do mapa: um menu só, um bloco de quando, um caminho pro dia

Cinco arrumações sobre a HUD que acabou de entrar, todas de coisa duplicada ou mal
ancorada.

**Um menu só.** O ☰, a gaveta e os três atalhos do canto — GESTÃO, TORCIDA, MENU —
saíram. Os dois primeiros abriam páginas que a coluna já abre e o terceiro abria
justamente a gaveta que estava sendo removida. O `#veu` foi junto: ele só escurecia
o fundo da gaveta, e o painel de gestão é opaco e cobre o mapa inteiro. **A coluna de
ícones é a navegação inteira, em qualquer largura.**

**Um bloco de quando.** Hora e data são a mesma informação em duas escalas; em
cantos opostos, o olho tinha de atravessar a tela pra saber quando está. O relógio
saiu do canto esquerdo e virou a linha de cima de um bloco único no canto direito —
relógio, data, dia da semana e o ≫ de avançar, uma moldura só. O nó do relógio é o
mesmo de antes, então `pintarRelogioDaRua` continua escrevendo nele a cada quadro.

**Um Play.** O mesmo triângulo aparecia duas vezes: no relógio do dia e no avançar
dia. Um anda minutos, o outro pula 24 horas. O play ficou com o relógio, que é quem
tem direito ao símbolo, e o avançar virou **duas setas** (`avancar` em `icones.js`).

**Um caminho pro dia seguinte.** Havia três — o botão flutuante `#avancarFixo`, o
play do cabeçalho e o atalho de canto. Sobrou o ≫ ao lado da data; o flutuante saiu
do HTML e do CSS.

**O canto esquerdo, que o relógio desocupou, ficou com o zoom**, e abaixo dele o
recolhível dos pontos e a coluna do menu.

**E o saldo da semana entrou na faixa de baixo**, com sinal e cor. O número não é
recalculado: sai inteiro de `TO.financeiro.resumoDaSemana(E).saldo` — receita menos
despesa menos o que a Gestão comprometeu, a mesma conta da tela de Financeiro. É
projeção da semana corrente, não resultado fechado, e mora no redesenho da faixa,
nunca no laço por quadro.

### Os números de aceite

1. **Não existe ☰ em largura nenhuma**, nem `#atalhos`, nem `#veu`, nem
   `#avancarFixo` — os quatro ausentes do documento em 1280×800, 390×844 e 844×390,
   com `#lateral` em `display:none`. E a coluna **abriu as 11 páginas nas três
   resoluções**: zero falhas nas 33 aberturas.
2. **A coluna cabe em 844×390 quebrando em coluna**, não encolhendo nem rolando: o
   ícone continua em **32×28 px** em qualquer tela, e o que muda é o número de
   colunas — **1 em 1280×800, 1 em 390×844 e 3 em 844×390**. É `flex-flow: column
   wrap` com a altura limitada pela faixa da torcida; os **11 ícones ficam inteiros
   dentro da tela nas três resoluções**. Empilhados seriam 341 px, e um celular
   deitado tem 390 no total.
3. **Um Play só na tela**, o do relógio: contando os `path` do SVG, `plays: 1` e
   `avancar: 1` nas três resoluções, com `title` "Avançar um dia".
4. **Um caminho pro dia seguinte:** o ≫ do bloco de quando. O `#avancarFixo` saiu.
5. **O relógio anda por quadro:** 8 mudanças de texto em 4 s com **0 trocas de nó**,
   e no fim o mesmo canvas, o mesmo zoom e a mesma rolagem do visor.
6. **O zoom está no canto esquerdo** (x = 23 px em 1280, 30 no celular) e vai de
   **40% a 200%** como antes, medido clicando 20 vezes no − e 40 no +.
7. **O saldo da semana bate com o Financeiro, e mexe na hora.** Semana 6 de um save
   da Cearamor: faixa `+R$ 856`, `resumoDaSemana` 856, tela de Financeiro `R$ 856`.
   Escolhendo **"Churrasco e escolta" (−R$ 375)** na recepção do aliado, pelo botão
   de verdade da Gestão: faixa `+R$ 481`, resumo 481, Financeiro `R$ 481` — os três
   iguais nos dois momentos.
8. **A faixa cabe em 390 px sem corte:** sete peças (escudo, nome, praça, saldo,
   saldo da semana, membros, prestígio), **zero com texto cortado**, `scrollWidth`
   igual ao `clientWidth` em todas. Ela quebra em duas linhas no celular — 69 px de
   altura contra 35 no desktop — e é isso que faz caber.
9. **Nada se sobrepõe:** dez elementos cruzados dois a dois — bloco de quando, botão
   dos pontos, lista aberta, coluna do menu, controles, zoom, faixa, ticker, cruz de
   WASD e ações do pad — em 1280×800, 390×844 e 844×390, com o recolhível fechado e
   aberto: **zero pares nos seis estados**. Um ajuste saiu daí: a pilha da esquerda
   passou a parar 56 px acima do fim da HUD (88 no celular, 168 com o pad de
   dirigir na tela), porque a coluna do menu, solta até o fim, passava por baixo da
   faixa da torcida em tela deitada.

## 8.16 Opções: pular dia vazio, relatório opcional e o ataque à nossa casa

Entrou um 12º ícone na coluna — **Opções** — com duas chaves que mudam o ritmo do
jogo, e o ataque à nossa casa deixou de ser uma linha de texto no fim da semana.

**Pular é simular, não omitir.** Com a chave ligada (o padrão), o ≫ simula os dias
sem jogo e para no próximo que tem alguma coisa. O dia pulado roda a rua inteira
pelo mesmo caminho do dia assistido — `TO.ruas.montar` e `TO.ruas.passo` do primeiro
minuto ao apito — e **com o mesmo passo de relógio**: um quadro a 60 fps empurra 1/30
de minuto de rua, e o pulo usa 1/30. Isso foi decisão medida, não escolha de gosto:
com passo maior o agregado continua igual, mas a identidade de alguns encontros
muda, porque quem esbarra em quem é testado nos instantes amostrados. Custa **49 ms
por dia em vez de 25** — meio segundo a mais numa semana pulada.

**O relatório da semana virou opcional, e nasce desligado.** Três coisas moravam na
mesma linha (`abrirFechamento(rel); TO.estado.salvar();`) e só uma delas é opcional:
salvar é sempre, o resumo é sempre, o modal é a chave. Semana no vermelho ou com
gente saindo abre de qualquer jeito **e para o pulo** — é aí que a torcida começa a
se desfazer, e descobrir isso depois de trinta dias pulados não é conforto.

**O ataque à nossa casa virou cena, começando pelo bar.** Em vez de resolver em
número no virar da semana, ele marca o dia — hash da data mais o id da torcida,
mesma disciplina dos assaltos — e naquele dia abre **a cena do bar com os papéis
trocados**: nós somos os donos da casa, do lado `visitante`, com `guarda:true` dentro
do salão; eles descem a transversal pelo lado `mandante`. Não há cenário novo: o
comportamento de guarda, o despertar por zona e a linha de visão pela porta já
estavam prontos.

**E ninguém paga duas vezes.** Alvo com cena: `ataquesContraNos` só agenda e narra.
Alvo sem cena — subsede, loja, sede — continua exatamente como era. A tensão de
"fomos atacados" acontece nos dois casos, uma vez só.

### Os números de aceite

1. **Pular é igual a assistir.** Do mesmo save (criado uma vez e recarregado por
   variante, porque `novo()` sorteia a própria semente e duas partidas novas nunca
   são a mesma partida), 30 dias de rua cheia — 90 andarilhos por dia, 4,5× o que o
   jogo usa: **caixa, efetivo, feridos, presos, moral, prestígio, satisfação e as 12
   baixas de rua idênticos**. O que diverge quando o passo muda é a **tensão**, em
   dois ou três pontos, porque a identidade de alguns esbarrões troca. Por isso o
   pulo usa o passo da tela: no passo da tela não diverge nada.
   **O que o pulo não simula, e é honesto dizer:** o resto do dia em que o jogador
   apertou ≫. Esse pedaço já era cortado pelo ≫ antes desta rodada — avançar o dia
   sempre encerrou o dia corrente onde ele estava.
2. **Os padrões:** save novo abre com `{pularVazios:true, relatorio:false}`, as duas
   chaves na tela de Opções, e os padrões são aplicados na leitura — save velho abre
   igual, sem migração.
3. **O pulo para e diz por quê.** Medido: 13 dias pulados de uma vez, parando com
   *"13 dias passaram — parou porque zóio fora de combate."* As cinco paradas estão
   no código: jogo na praça, ataque marcado, bonde nosso na rua, decisão nova e
   semana ruim. **Um desvio deliberado na terceira:** o cartão de Avisos tem itens
   que são lembrete permanente — ações sobrando, gente pronta pra promover, fila de
   treino vazia, membro presos por trinta dias — e parar neles seria não pular
   nunca. Para o pulo a pendência **nova**, a que não existia quando o pulo começou.
4. **A semana continua sendo salva** com o relatório desligado: o `TO.estado.salvar()`
   saiu da linha do modal e roda sempre, e o ciclo salvar → recarregar → Continuar já
   estava medido em §8.14.
5. **Semana ruim abre o relatório mesmo com a chave desligada** e escreve o motivo da
   parada — está no `aoFecharSemana`, com `grave = saldo < 0 || caixa < 0 || saiu`.
   Medido pelo caminho normal (semana no azul não abriu); o caso forçado de caixa
   negativo ainda não foi medido.
6. **O resumo chega sem o modal:** *"Semana 2: sobrou R$ 856 · caixa R$ 7.712"* no
   ticker e na lista de avisos, toda virada.
7. Com as duas chaves na posição antiga o jogo se comporta como antes — o pulo é um
   `if` na frente do ≫ e o modal volta a abrir sempre.
8. **A cena do bar com os lados trocados:** medido, **34 nossos do lado `visitante`,
   os 34 com `guarda:true` dentro do salão**, 6 deles descendo pelo `mandante`, e
   **0 discos fora do chão** — ninguém atravessa parede.
9. **O prejuízo é contado uma vez.** No agendamento, a entrada do bar volta com
   `{dinheiro:0, feridos:0, moral:0, prestigio:0}` — o `ataquesContraNos` não cobrou
   nada pelo alvo que tem cena, e o caixa só mexeu o que os alvos **sem** cena
   cobraram. No fecho, a cena cobra sozinha: segurando a casa, `caixaDelta: 0`, um
   ferido nosso e o cartaz **"A CASA FICOU DE PÉ"**. O ramo de derrota — eles levam a
   gaveta e 10% do caixa, espelho do saque do outro lado — está escrito e ainda não
   foi medido numa partida em que eles tomem o bar.
10. **Ataque é evento de dia:** seis chamadas na mesma semana devolvem sempre
    `bar@s1d5` — mesmo dia, e a semana não multiplica, porque o ataque marcado é um
    só e é lido pela data.
11. **Os outros três alvos seguem em número:** 80 rodadas do gerador, **11 ataques
    sem cena resolvidos como sempre e 7 agendados com cena, zero erros**.
12. **O ícone Opções abre o painel** e a coluna passou a ter **12 ícones**; o
    `column wrap` que já resolvia 11 continua resolvendo 12 sem mudar o tamanho do
    ícone.

## 8.17 Gestão em sequência, políticas padrão e o modo automático

A Gestão deixou de ser uma página com tudo empilhado e ganhou **três coisas
separadas**: um assistente que mostra uma decisão por tela, três **políticas** que
valem daqui pra frente, e uma chave que deixa a política fechar o plano sozinha.

**Política não é o `E.padroes` de hoje, e os dois convivem.** O retrato guarda
*quanto* — bombas, bondes, fração da caravana, formação — e não sabe dizer "atacar
quem estiver quente", porque quem está quente muda toda semana. A política decide
*quem* — intenção, alvo, recepção do aliado, investida nos outros jogos — e é
reavaliada toda semana. Quando discordam **ganha a política**, que roda depois do
retrato ter montado o plano. Save que já tem `E.padroes` continua funcionando: a
política nasce em `nunca`, que é não mexer em nada.

**O 30 que não é o 45.** O jogo usa 45 como corte de hostilidade — é de 45 pra cima
que a rival vem pra cima da gente sozinha. A política precisa de um corte mais baixo
porque é intenção, não reação: **`TENSAO_QUENTE = 30`** é "já tem clima ruim o
bastante pra valer a pena", e deixa a faixa 30–45 como a zona em que a gente ataca
antes de apanhar. O número tem nome no código, com esse comentário.

**A política fecha o plano inteiro, ou não serve.** Dizer "atacar" não fecha nada:
`passos()` ainda cobra contra quem, como, olheiro e bombas. Então o **"como" padrão é
`arredores`** — o único que não pede olheiro — e o critério de alvo está escrito:
**rivalidade declarada primeiro, tensão depois, efetivo desempatando**, ordem fixa
para a mesma semana decidir igual toda vez.

### Os números de aceite

7. **"Rival" é o grafo, "quente" é o 30, e as duas opções dão resultados
   diferentes.** Medido num caso construído de propósito: a Falange Coral é rival
   declarada com tensão 5 e a Aliança não é rival com tensão 40. `rivais` devolve
   **Falange Coral, Jovem Garra Tricolor e Leões da TUF**; `quentes` devolve
   **nenhuma** (nenhum rival declarado passa de 30, e a Aliança quente não é rival);
   `todos` devolve 6 e `nunca` devolve 0.
8. **Dez semanas seguidas sem uma interrupção, com os dez planos fechados.** Chave
   `abrirGestao` desligada, política do jogo em `rivais`, dos outros jogos em
   `quentes` e aliados em `hospedar`: **0 interrupções, `falta` vazio nas dez**. O
   que a política escolheu, semana a semana: paz (sem jogo), depois **Jovem Sport,
   Falange Coral, Bamor, Inferno Coral** e as demais — alvo diferente a cada semana,
   porque a lista é reavaliada contra o adversário daquela rodada.
10. Com as chaves nas posições antigas nada regride: `abrirGestao` nasce **ligada**,
    que é o comportamento de hoje (o jogador abre e decide), e as duas políticas de
    ataque nascem em `nunca`, que é não decidir nada em nome dele.

### O que ficou implementado e NÃO medido

Os critérios **1 a 5 e 9** — o assistente abrindo sozinho, a sequência tela a tela, o
Voltar sem perder decisão, o Avançar travado e a falha ruidosa — estão escritos e
sintaticamente de pé, mas **não consegui observá-los rodando**: nos saves que usei
para o teste, `E.proximoJogo` continuou nulo por trinta dias avançados, e sem jogo
marcado `passos()` volta vazio e o assistente não monta. A prova indireta é o
critério 8, que só fecha plano porque `proximoJogo` existe naquelas semanas — ou
seja, o caminho existe, mas o teste que eu montei não caiu nele. Isso é dívida de
medição desta rodada, não um "provavelmente funciona": até ser medido, trate os
critérios 1 a 5 e 9 como não verificados.

## 8.18 Faixa em uma linha, assalto nos avisos, fim das brigas de andarilho

Quatro arrumações, uma delas é remoção.

**A faixa da torcida numa linha só.** O que custava altura era o rótulo "NA SEMANA"
empilhado sob o número: virou um sufixo `/sem` de 8,5 px na mesma linha, com a
explicação inteira no `title`. O sinal e a cor já dizem que aquilo é variação e não
um segundo saldo. **A ordem de sacrifício está escrita no CSS**, não no olho: escudo
e sigla nunca saem; abaixo de 1100 px cai a praça (é a mesma a partida inteira e o
mapa embaixo já a mostra); abaixo de 820 caem membros e prestígio; abaixo de 400 cai
o saldo da semana. Item que não cabe **sai inteiro** — número em reais cortado é
número errado.

**Toda tentativa de assalto vira aviso**, de qualquer torcida da praça, com quem
tentou, o comércio, o bairro e o desfecho. É recado, não decisão: não para o relógio
nem o pulo de dias, porque passa por `anotar` e não cria pendência.

**A briga entre andarilhos saiu inteira** — o teste de hostilidade, o esbarrão, o XP
dos dois, o ferido de 1 a 7 dias do perdedor e o freio de frequência que existia só
pra segurá-la. Os andarilhos ficam: são eles que fazem a cidade parecer habitada e
são eles que assaltam. **Consequência registrada:** com isso o único evento de dia
vazio que mexe na nossa ficha é a **prisão por assalto**, rara por construção — o dia
sem jogo ficou mais calmo do que estava desenhado. Se parecer vazio demais, o ajuste
é o número de andarilhos ou um evento novo, não ressuscitar a briga.

**A Gestão abre na primeira tela da partida nova**, no bloco de políticas, e a chave
que liga a abertura automática **mudou de lugar**: saiu de Opções e passou a morar
com as três políticas, que é onde ela faz sentido — é uma política como as outras. Ela
existe num lugar só.

### Os números de aceite

1. **A faixa é uma linha nas três larguras**, medida: **34 px de altura em 1280×800 e
   em 844×390, 32 px em 390×844**. Fonte 13 px nas duas primeiras e **11 px em 390**.
   Em 390 sobram escudo, nome e saldo em conta — saem quatro peças (praça, saldo da
   semana, membros e prestígio), na ordem escrita.
2. **Nada cortado:** `scrollWidth` igual ao `clientWidth` em todas as peças visíveis e
   na faixa inteira, nas três larguras — zero reticências em valor de reais.
3. **Os avisos de assalto:** 60 dias medidos, **5 avisos**, de três torcidas
   diferentes — *"Independente tentou Banco do Mooca: a PM pegou na porta."*,
   *"Gaviões tentou Joalheria do Grajaú: saiu com R$ 504."*, *"Mancha Verde tentou
   Posto de gasolina do Santo Amaro: a PM pegou na porta."* Nenhum deles cria
   pendência, então nenhum para o pulo.
4. **Não existe mais briga de andarilho:** nos mesmos 60 dias, **0 brigas de rua e 0
   baixas por esbarrão**, com os andarilhos circulando em **20 por dia**.
5. **O único evento de dia vazio que fere ou prende alguém nosso é a prisão por
   assalto:** a lista de baixas de rua fechou os 60 dias **vazia** — nenhuma por
   esbarrão (não existem mais) e nenhuma por assalto (a nossa tentativa saiu com R$
   504 sem ser presa), que é o que "raro por construção" quer dizer.
6. **Partida nova abre na Gestão**, com o bloco de políticas na tela (`painel: true`,
   `gestao: true`, 3 seletores). Save existente abre no mapa: a abertura está presa ao
   caminho de "novo jogo", não ao `entrarNoJogo`.
8. **A chave existe só na Gestão:** o painel de Opções lista duas chaves — "Pular os
   dias sem jogo" e "Abrir o relatório toda semana" —, e a terceira está no bloco de
   políticas.

**Critério 7 não foi medido de novo nesta rodada.** A metade desligada dele — dez
semanas sem interrupção com os dez planos fechados — está medida em §8.17 e não
mudou; a metade ligada continua com a mesma dívida registrada lá.

## 8.19 A virada: o feed vira o jogo

Mudança de direção, não incremento. O jogo deixou de ser "abrir o mapa e apertar
avançar dia" e passou a ser **um fluxo de mensagens que chega sozinho**, com o tempo
correndo por conta própria e parando quando o jogador precisa decidir. O mapa não é
mais a casca: ele continua inteiro — relógio, coluna de ícones, faixa da torcida,
zoom, filtros — mas agora é uma tela que **abre a partir de uma mensagem**.

### O que foi construído

**`js/mundo/feed.js`** é o arquivo novo, e ele tem três regras de higiene escritas no
cabeçalho: **não simula nada** (competição, tensão, economia, membros, patrimônio, a
rua e as cenas continuam onde estavam; o feed lê o que elas produzem e escreve a
linha), **não desenha nada** (`main.js` pinta; aqui só existe o modelo) e **não sorteia
com `U.rng()`** (toda escolha sai de hash da semente com a data, a mesma disciplina do
dia do assalto de §8.9 e do dia do ataque de §8.15).

**A mensagem** tem `id, dia, hora, absoluto, ano, semana, cat, peso, voz, texto,
linhaAbaixo, botoes[], validoAte, respondido`. `anotar(est, msg, tipo)` continua sendo
a chamada de sempre, do mesmo lugar, com os mesmos dois argumentos — o terceiro
argumento novo é opcional e diz de que categoria é a linha. O que mudou é o depois: a
linha vira mensagem do feed e **fica lá**. O corte em 12 do `E.avisos` saiu; `E.feed` é
histórico, é salvo, rola pra trás.

**A voz tem dono.** Quando é um diretor, ela sai de um membro real de `E.membros`, com
nome e cargo, e o mesmo assunto traz sempre o mesmo diretor — é isso que faz o Serrote
que propôs o assalto ser o mesmo Serrote que aparece preso duas mensagens depois. O
diretor da rival não tem ficha, então o nome dele sai do mesmo banco de nomes, preso ao
id da torcida: é sempre o mesmo sujeito falando pela mesma torcida.

**O relógio do tempo** é um `requestAnimationFrame` em `main.js` que avança um dia por
segundo a 1×, e o 1×/2× que já existia multiplica ele. Ele convive com o relógio da
rua, e por isso agora são **dois conjuntos de motivos de pausa**: `pausas` (a rua, que
nasce parada e só anda com o mapa aberto) e `pausasT` (o tempo, que nasce correndo e
para por painel, aba sem foco, save, cena, modal e decisão sem resposta). Um conjunto
só não daria conta — com o mapa aberto a rua tem de andar e o calendário tem de ficar
parado, e é exatamente esse par que um conjunto único não sabe representar.

**A decisão NÃO é motivo de pausa, e isso custou três corridas de seis minutos.** Ela
entrou no conjunto junto com painel, foco e save, e guardar o mesmo fato em dois lugares
deu no pior sintoma que este relógio pode ter: quando a resposta vinha por um caminho
que não passava por quem tirava o motivo, ele ficava pra trás e **o jogo congelava com a
tela limpa** — sem painel, sem modal e sem nada pra responder. Só apareceu na temporada
correndo de verdade, porque o laço headless dos outros testes chama `passarUmDia` na mão
e nunca depende do `requestAnimationFrame`: parou no dia 42 e não voltou. A verdade
passou a ser uma só, `TO.feed.travado`. E `TO.tela` agora expõe os dois conjuntos de
pausa, porque a bateria tem de conseguir dizer **por que** o tempo está parado.

**Um dia é simulado inteiro**, com ou sem tela: `simularDiaDaRua` roda do primeiro
minuto ao apito com o mesmo passo de 1/30 de minuto que o dia assistido usa (a decisão
medida em §8.16 continua valendo). Encontro entre bondes interrompe a rua e vira
convocação.

### As seis regras da fila, e onde cada uma mora

| regra | onde |
|---|---|
| nunca duas da mesma categoria em sequência, exceto a 5 | `publicar()`, e vale também pra decisão |
| na categoria 5, o nosso mapa vem primeiro | `ordenar()`, campo `local` |
| teto de 15 por semana, descartando pelo peso | `publicar()` + `ctl().semana.n` |
| duas decisões no mesmo instante viram fila, não pilha | uma decisão por passada, `ORDEM_DECISAO` 3>2>6>7 |
| determinismo | `hash`/`dado`, sem `rng` |
| o 1×/2× controla a velocidade | `rodarTempo`, mesma variável da cena |

**A rajada publica tudo que pode agora**, na ordem da fila, e a decisão vai por último
de propósito: ela fica no topo, que é onde o olho cai, e é ela que segura o relógio.

**Um bug de hash que parecia determinismo funcionando.** Quase toda chave do feed muda
só no último pedaço — `c7m|2026|0`, `c7m|2026|1`. No FNV-1a puro, mexer no último
caractere multiplica a diferença pelo primo 16777619 ≈ 2²⁴ e para aí: os bits altos
quase não se movem, e `dado()` lê justamente os bits altos. Resultado: treze meses
seguidos caíam na mesma faixa e a cota mensal da diplomacia saía **constante a
temporada inteira** — quatro por mês o ano todo, ou dois o ano todo, conforme a
semente. Três voltas de xor-shift e multiplicação no fim do hash resolveram; a cota
voltou a variar de 2 a 4 dentro da mesma temporada.

### Os 18 critérios, medidos no motor

Salvo onde estiver dito, os números são de **uma temporada de 363 dias com a Gaviões**,
rodada no laço do jogo (`TO.tela.passarUmDia`), respondendo toda decisão com "Seguir
ideologia" ou "Não dar moral".

1. **Partida nova abre no feed.** Duas mensagens: `[5/info] "Jogo iniciado. Cearamor —
   Fortaleza, 150 membros."` e `[6/decisão] "Chefe, antes de tudo: define a nossa
   ideologia…"` com o botão **Definir ideologia**. `travado: true`, e o dia continuou em
   **0 depois de 3 s de tela** — o tempo só começa depois da resposta.
2. **1 dia = 1 s a 1×.** Numa janela limpa de 30 s: **29 dias, 0,3 s parados → 0,98
   dias por segundo corrido**. A temporada inteira, sem interação humana, com um
   respondedor automático apertando "Seguir ideologia" ou "Não dar moral": **364 dias em
   370,9 s de relógio de parede — 363,6 s de tempo corrido (6 min 4 s) e 7,3 s parados
   em 126 decisões**, 135 respostas e 288 mensagens. A 2×: **39 dias em 19,6 s corridos
   → 1,99 dias por segundo**, o dobro exato.
3. **Rajada.** A maior medida numa temporada foi de **5 mensagens no mesmo instante**;
   uma delas, no dia 147: olheiro, resultados da rodada, clássico ganho e a convocação
   pra treta, nesta ordem, com a decisão por cima.
4. **Decisão para o tempo, informativa não.** Com duas decisões na fila (uma de
   categoria 6 e uma de 7 propostas no mesmo dia), saiu **uma só**, `travado: true`; a
   segunda entrou **no mesmo instante** em que a primeira foi respondida, na ordem
   6 → 7, e o relógio só voltou depois da última.
5. **Existem dias em silêncio.** **177 de 363 dias sem mensagem nenhuma (48,8%)**, e o
   **maior silêncio foi de 9 dias** (14 numa segunda corrida). Fora de competição a
   praça não tem rodada e a cota do mundo cai de 3 pra 1 por semana — é assim que o
   intervalo fica calado sem que nenhuma categoria invente conteúdo.
6. **Distribuição numa temporada inteira**, em números absolutos:

   | ideologia | 1 olheiro | 2 dia de jogo | 3 convocação | 4 resultado | 5 mundo | 6 interna | 7 diplomacia | total |
   |---|---|---|---|---|---|---|---|---|
   | defensiva (`nunca`) | 34 | 45 | 34 | 1 | 113 | 9 | 39 | 275 |
   | agressiva (`rivais`) | 33 | 44 | 34 | 44 | 66 | 3 | 37 | 261 |

   **2 e 5 lideram nas duas.** A categoria 4 é a que separa: com a ideologia defensiva
   quase não há ação nossa, e resultado é consequência de ação — 1 mensagem. Com a
   ideologia agressiva ela sobe pra 44 e 22 pares de rival ficam com confronto
   registrado. **A 6 nunca passou de 1 por semana** e a **7 ficou entre 2 e 4 por mês**
   em todos os 13 meses das duas corridas.
7. **Sem repetição.** **0 assuntos da categoria 6 repetidos em duas semanas
   seguidas**, **0 ameaças repetidas dentro da carência de 56 dias** e **0 rivais
   provocando duas vezes seguidas**.
8. **Nenhuma semana passou de 15.** A mais cheia teve **10 mensagens**; a média foi de
   **5,3 por semana**. O que é agrupado: os resultados da rodada saem em **uma linha
   por rodada — 45 linhas cobrindo 180 jogos na temporada**, quatro placares escritos,
   os da nossa praça na frente, e o resto contado (*"e mais 3 jogos"*) em vez de
   sumir. O que é descartado aparece em `contas.descartePorCat` — na corrida de
   referência, **27 mensagens da categoria 6 e 2 da 4**, todas barradas pela cota
   semanal ou pelo prazo, nenhuma pelo teto de 15.
9. **Em 275 mensagens seguidas, 0 repetições de categoria em sequência fora da 5**,
   rajadas incluídas. A 5 repetiu 28 vezes, que é o que a exceção permite.
10. **Na categoria 5, o nosso mapa vem antes:** **0 pares fora de ordem** no mesmo
    instante.
11. **As nove ameaças, cada uma com a condição de pé** (rival: Dragões da Real):

    1. *"Se liga, moleque. Quando menos esperar a gente tá na tua porta."*
    2. *"Sábado a gente se vê no Arena Castelão. Vai com Deus que com a gente não dá."*
    3. *"Some do Vila Mariana, otário. Esse pedaço aí não é de vocês e nunca foi."*
    4. *"Ainda tá cheirando a sangue de vocês lá na Vila Mariana. Volta lá pra tomar mais."*
    5. *"Ganharam com o dobro de gente e tão se achando. Vem sozinho da próxima vez, vacilão."*
    6. *"Aquele barraco que vocês chamam de sede tá com os dias contados."*
    7. *"Boa viagem, hein. Estrada é longa e escura, cuidado no caminho."*
    8. *"Vocês são 250 gato pingado. A gente leva isso aí de bonde, sem suar."*
    9. *"Cuida bem desse bandeirão, viu. Vai ficar bonito pendurado na nossa sede."*

    No estado real daquela semana **só a nº 1 estava de pé** — as outras oito exigiram
    que a condição fosse forçada, que é o que se queria provar. E a nº 7 com
    `caravana: false` devolve **false**; com `true`, **true**.
12. **"Vem, verme" soma exatamente +1** de tensão com aquela rival; **"Não dar moral"
    devolve 0** e o mapa de tensão inteiro sai byte a byte igual. A conta fica visível
    na própria linha do botão: *+1 de tensão com eles* / *nada acontece*.
13. **A convocação abre a cena com o efetivo real e distinto de cada lado.** Ataque ao
    nosso bar, `local: 'bar'`: Gaviões com **63** do lado `visitante` — 25% dos 320
    aptos — e Dragões da Real com **18** do lado `mandante` — 30% dos 60 membros dela.
    Cores `#000000/#FFFFFF` e `#CC1414/#FFFFFF`, primária no anel e secundária no miolo
    como em §8.12; **3 bombas**, as do plano da semana, não as do estoque cru. Forçando o
    caso pedido — nossa torcida em 320 aptos e a rival em 333 membros —, a cena abre
    **80 contra 100**, e o canvas nasce com 80 e 100 discos: `criarEstado` faz
    `Math.round(b.n)` por bonde e nada é reequilibrado na abertura.
    **Aqui morava um bug que já tinha sido consertado uma vez.** `Math.min(aptos.length,
    …)` amarrava o nosso bonde ao tamanho da ESCALAÇÃO, que é cortada em 34 porque 34 é
    quanta gente tem FICHA — nome, força, defesa e consequência depois da briga. Com 250
    membros a cena abria 34 contra 18 quando o certo eram 63 contra 18. Escalação e
    efetivo são duas coisas: `escalacao` é quem tem ficha, `bondes[].n` é quanta gente
    está lá. A desvantagem numérica, quando existe, é resultado da decisão do jogador e
    do que o olheiro apurou — ou não apurou — antes.
14. **O feed é salvo e rola pra trás.** Save no dia 30 com **13 mensagens**, entre elas
    uma rajada de 4 no mesmo instante; recarregada a página e carregado o save, voltaram
    **as mesmas 13, idênticas linha a linha**, a rajada inteira presente e **13 nós na
    lista**.
15. **Mesmo save, mesma semente, mesmo feed.** Duas cargas do mesmo arquivo, 60 dias
    cada: **50 contra 50 mensagens, 0 diferenças**, e caixa, efetivo e mapa de tensão
    idênticos. *A primeira medição deu 47 contra 71 e não era falta de determinismo: o
    jogo salva sozinho no fechamento de toda semana, e a segunda corrida partia do save
    que a primeira tinha deixado pra trás. O teste passou a copiar o save na mão.*
16. **O caixa no vermelho para o tempo, e avisa antes da debandada.** Forçado o caixa
    negativo, a mensagem *"Chefe, o caixa fechou no vermelho. Segunda semana assim e o
    pessoal começa a sair."* saiu com `peso: decisao`, `travado: true`, ainda em
    `semanasNoVermelho: 1` e com **250 membros, nenhum perdido**.
17. **O que saiu existe mesmo:** **0 botões de avançar dia** em toda a tela, e o save
    fica com `opcoes: ["relatorio", "perguntarJogo"]` — `pularVazios` e `abrirGestao`
    são apagados na leitura, então save velho abre sem eles.
    *(O ≫ voltou em §8.22, por pedido do autor, e com outro papel: ele não avança um
    dia parado, empurra o dia que já está correndo, e não passa por cima de decisão
    aberta. A medida de 0 botões vale pra este momento do projeto.)*
18. **O mapa abre a partir de mensagem.** A convocação *"Hoje tem Corinthians × Ponte
    Preta no Neo Química Arena"* abriu o painel do mapa com **canvas, relógio da rua
    correndo (08:32 → 08:37 em 2,5 s), 4 ícones de controle, 13 ícones de menu, faixa da
    torcida e os 2 botões de zoom**. O calendário ficou parado no dia 34 o tempo todo em
    que o mapa esteve aberto, e fechar devolveu o feed com as mensagens onde estavam.

### O que isto aposentou

- **A chave "pular dias vazios"** — o feed é o pulo. Dia sem nada passa em um segundo,
  calado. O código do pulo (`pularDiasVazios`, `porQueParar`, as cinco paradas) saiu
  junto; o que ficou de lá é `simularDiaDaRua`, que virou o coração do dia. *(E que
  saiu em §8.22, com a simulação da rua inteira.)*
- **O ≫ de avançar o dia**, do bloco de quando do mapa. No lugar dele, um ícone de
  saída que devolve o feed. *(Voltou em §8.22, no bloco de data da barra do feed.)*
- **O corte em 12 do `E.avisos`** e a drenagem em torradinhas dentro de `redesenhar`.
  `aviso()` continua vivo só pra retorno imediato de clique — "Salvo", "Bonde solto" —,
  que é conversa da interface, não do mundo.
- **A Gestão abrindo sozinha na partida nova** (§8.18): agora a partida nova abre no
  feed e é a segunda mensagem que chama a Gestão.
- **O resumo semanal automático** (*"Semana 12: sobrou R$ 1.200"*). O saldo já está na
  barra do feed o tempo todo; a linha só sai quando tem o que dizer — gente saindo da
  torcida.
- **"Política" virou "ideologia"** na interface e no código de tela. O botão que não
  faz nada de diferente numa decisão é **Seguir ideologia**.

### Desvios, escritos porque existem

- **Só o bar tem cena com papéis trocados.** A convocação pra cena (categoria 3) sai
  para o ataque ao nosso bar, para o dia do nosso jogo e para o encontro de bondes na
  rua. **A emboscada na estrada continua resolvendo em número**, como sede e loja — é a
  dívida de §8.16, e o dia em que ela ganhar cena a mensagem já está escrita.
- **A festa do aliado cai num dia inventado.** A fonte guarda o **ano** de fundação e
  nada mais, então o dia do ano sai do hash do id. É inventado, mas é fixo: a mesma
  aliada faz aniversário sempre no mesmo dia, em todas as temporadas e em todas as
  partidas.
- **Efetivo é o real de cada lado, e eles são diferentes**: 25% do nosso efetivo
  contra 30% do deles, na regra que a cena do bar já usava. Nada é igualado.
- **O alarme do caixa é o assunto `caixa` da categoria 6, e a debandada é
  resultado (categoria 4).** Eles chegaram a dividir o assunto pra não se revezarem
  semana sim, semana não enchendo a interna de "estamos quebrados" — e aí a linha
  informativa consumia a carência de duas semanas e a DECISÃO que avisa antes da
  debandada nunca saía: o jogador só era avisado depois de perder oito pessoas.
  Separados por categoria, os dois convivem sem se atrapalhar. O alarme é também o
  único assunto **urgente** da categoria: ele fura o teto de uma interna por semana,
  porque rede de segurança que espera a vez não é rede de segurança.
- **Mensagem que cede a vez pela regra 1 e nunca consegue sair é descartada no
  prazo** — 2 dias pra informativa, 6 pra ação, 21 pra decisão. Foi por isso que a
  contagem de descartes entrou no `resumo()`: silêncio por regra tem de ser contável.
- **Torcida quebrada fala muito.** Numa temporada com a Cearamor — que roda **−R$ 833
  por semana** sem o jogador fazer nada — a categoria interna sobe pra 46 e passa a
  liderar sobre a 2. Não é o feed inventando: é a torcida indo à falência e o diretor
  dizendo isso toda semana em que a condição está de pé. A distribuição do critério 6
  foi medida com a Gaviões, que fecha **+R$ 1.191 por semana** parada.

### Celular

Medido em 390×844 e 844×390, com 40 dias de feed na tela: **0 sobreposições** entre a
marca, o bloco de quando, a faixa de ícones e as mensagens, **0 valores cortados** e
**0 rolagem lateral**. A barra do feed quebra em três linhas no retrato (170 px) e em
duas no paisagem (81 px); o nome da torcida ganha a linha inteira no estreito, porque
com os números do lado ele virava "Ga…", que não é nome de coisa nenhuma.

## 8.20 A notícia possível, com vencedor e com conta — e os indicadores das 138

Três frentes que se encontram na mesma linha da tela: a notícia tem de poder ter
acontecido, tem de dizer quem levou a melhor, e tem de mostrar o que moveu. E o que ela
move nas outras torcidas tem de ser o mesmo que se move na nossa.

### O bug que motivou tudo

`paresPossiveis` varria o grafo de rivais e aliados e devolvia **todos os 4.425 pares
do país**, sem filtro de praça nem de calendário. `diplomaciaDelas` sorteava três por
semana entre eles, e daí saía *"Jovem Tricolor depredou o bar da Mancha Verde
Juventude"*: clubes de divisões e regiões diferentes, que só poderiam se cruzar na Copa
do Brasil — que começa em maio. Notícia de briga entre torcidas que não têm como se
encontrar destrói a credibilidade do resto do feed.

### Os dois portões

Rivalidade declarada na fonte é **necessária e não é suficiente**: ela diz que se
odeiam, não que se encontraram. Além dela, o par passa por um destes dois:

| portão | condição | quando a notícia cai |
|---|---|---|
| **a) mesma praça** | as duas têm sede no mesmo mapa | dia aleatório da semana |
| **b) jogo** | os clubes se enfrentam numa rodada | no dia do jogo ou no seguinte |

**O portão (b) olha pra semana que VEM, não pra que acabou.** Isto roda no fechamento,
e a rodada recém-simulada aconteceu em dias que já passaram: publicar a notícia dela
seria publicar no passado, ou uma semana depois. A tabela da semana seguinte já existe
— o placar é que não —, e a briga em volta do jogo não depende do placar. Assim a
notícia cai no dia em que ela pertence.

**O cache saiu de eterno pra semanal.** Era `if(!_pares) _pares = …`, uma vez na vida
do módulo. Com o portão (b) o conjunto muda toda semana, e um cache eterno faria a
correção não pegar: o comportamento antigo voltaria pela porta dos fundos, que é o pior
jeito de um bug voltar — com o código novo escrito e sem efeito.

### O vencedor, e a linha de consequência

O texto era `{A} {verbo} {B}` e o resultado ficava implícito. Agora quem bate e quem
apanha sai de `quemLevaAMelhor` — moral, ousadia e uma pitada de sorte — e o texto
nomeia os dois. Os R$ 300 de quem bate e os R$ 900 de quem apanha são **debitados** e o
que foi debitado fica guardado no `contas` da notícia: é por ele que se confere que o
vencedor do texto é o mesmo lado que a conta beneficiou.

E toda mensagem que move indicador ganha uma segunda linha:

> *Relação entre ambos piora −7 · Tensão entre ambos aumenta +20 · Moral da Ultras do
> ABC cai −1,2 · Prestígio da Máfia Vermelha sobe +0,5*

**A linha sai dos efeitos que foram de fato aplicados, nunca de número escrito no
texto.** Quem aplica devolve `{ind, delta, dono}` — `mover()` devolve o delta depois do
`limitar`, `somar` é lido antes e depois — e `TO.feed.lerEfeito` monta a frase. Número
escrito à mão no texto vira mentira de tela no dia em que a fórmula mudar, e mentira de
tela é a coisa mais difícil de achar depois. **Mensagem que não move nada não tem
linha**: "nenhum efeito" é ruído.

A cor sai do significado, não do sinal: subir é bom em quase tudo, mas **tensão +15 é
vermelho**, e **polícia −1 é vermelho** — o número é a folga que se tem com ela, não a
quantidade de polícia em cima.

### Os indicadores das 138

Moral, prestígio e polícia passam a existir nas outras torcidas, na mesma escala 0–20
do GDD §12, movidos pelos mesmos eventos que movem os nossos. **Satisfação fica de
fora**, e é a exceção justificada: ela é do torcedor comum do CLUBE, não da organizada
— existiria por clube (108) e não por torcida (140).

**Nenhuma ficha individual foi criada.** A nossa moral é a média de gente com nome; a
delas é o número agregado equivalente. Fichas pras 138 seriam dezenas de milhares de
registros recalculados toda semana num laço que já se preocupa em rodar barato.

E nenhum dos três é número morto — indicador que se move e não realimenta comportamento
é decoração:

| indicador | escrito em | **lido em** |
|---|---|---|
| moral | briga, investida, ataque, título/acesso/rebaixamento, caixa no vermelho | `tensao.js:601` (`animo`, a chance de procurar briga) e `tensao.js:613` (`quemLevaAMelhor`) |
| prestígio | briga (proporcional ao de quem apanha), investida, ataque | `tensao.js:641` (quanto prestígio muda de mão) e `planejamento.js:823` (qual alvo a ideologia escolhe) |
| polícia | toda briga e todo assalto; sobe com a ação social | `banida()` — lido em `ruas.js:796` (some do mapa), `tensao.js:578` (não gera notícia) e `tensao.js:748` (não vem pra cima da gente) |

**A ação social entrou porque a simetria exigia.** A nossa polícia sobe com "Ação
social no bairro" — R$ 2.000 por +1,5. A delas só descia: briga e assalto tiram, nada
punha. Em vinte temporadas o país inteiro estaria banido em rodízio. Agora elas fazem a
mesma ação, pelo mesmo preço e com o mesmo efeito, e quem procura menos briga procura
mais a comunidade — o arquétipo divide a chance.

### Os critérios, medidos no motor

**Do noticiário** (5 temporadas com a Gaviões, 291 notícias, conferidas *na hora* — a
tabela é remontada todo ano, e no fim de cinco temporadas as rodadas de 2026 não
existem mais pra comparar; a primeira versão do teste media do save final e acusava 21
notícias impossíveis que eram rodadas que ele não tinha mais como ver):

1. **Zero notícias impossíveis em 291.** Dos **4.425 pares declarados no grafo**, ficam
   elegíveis **261 por semana em média** (218 no mínimo, 330 no máximo) — **4.164
   descartados por semana**.
2. **Zero notícias fora da janela.** Toda notícia do portão (b) saiu no dia do jogo ou
   no seguinte. Ela também **morre na janela**: `validoAte` é o dia seguinte ao jogo, e
   sem isso a fila podia segurá-la — por cota ou pela regra da categoria em sequência —
   e ela saía na segunda-feira contando uma briga que já tinha virado semana.
3. **Nenhuma semana repetiu par**, em 259 semanas. Eram três `U.escolher` independentes
   sem dedupe.
4. **A lista elegível se refez em 231 das 258 viradas de semana.** As 27 que não mudaram
   são semanas sem rodada nova — intervalo de competição, em que só o portão da praça
   contribui e o conjunto é de fato o mesmo.
5. **104 de 104 brigas com o vencedor certo**, em duas temporadas: em todas, quem o
   texto nomeia primeiro é quem pagou **R$ 300**, o perdedor pagou **R$ 900**, a moral
   que cai é a do perdedor e o prestígio que sobe é o do vencedor.
6. **50 de 50 decisões respondidas com a linha batendo com o estado.** O teste fotografa
   moral, prestígio, polícia, satisfação, caixa, tensão e relações antes e depois de
   cada resposta e compara com a soma dos efeitos declarados: 0 divergências acima de
   0,06.
7. **28 das 107 mensagens de uma corrida têm linha; 79 não têm** — e as 79 são as que
   não moveram nada.
8. **`Polícia nossa aperta −1` sai em vermelho** e `afrouxa +1` em verde; `Tensão
   aumenta +1` em vermelho e `diminui −1` em verde.

**Da simetria** (5 temporadas, 138 torcidas):

1. Numa briga entre duas IAs a perdedora perde moral e a vencedora ganha prestígio, e os
   dois números aparecem na linha — o exemplo acima é uma delas.
2. **A moral varia de verdade**: começa em 12 para todas (desvio 0) e termina em **média
   12,29, desvio 4,55, de 0 a 20**, com quartis em 9,6 e 14,7. Em **20 temporadas** ela
   abre ainda mais: **média 10,97, desvio 7,34**, com o primeiro quartil em 3,7 e o
   terceiro em 18,4 — a praça se divide entre quem venceu e quem apanhou.
   Prestígio: **média 6,03, desvio 3,48, de 1,4 a 18,8** em 5 temporadas; **6,47 com
   desvio 5,0, de 0 a 20** em 20.
   Polícia: **média 8,78, desvio 0,69, de 6,9 a 10** — ela oscila pouco porque as três
   brigas por semana se espalham por 138 torcidas.
3. Os três existem nas 138, todos dentro de 0–20 (**0 fora da escala**), e se movem
   pelos mesmos eventos que movem os nossos.
4. **O banimento funciona, e é raro.** Forçando a polícia de uma torcida da nossa praça
   a zero na semana 5: ela é banida até a semana 9, fica com **0 bondes na rua** nas
   semanas 7, 8 e 9, **não gera notícia nenhuma** enquanto está fora, e volta com bonde
   na semana 10. Naturalmente, em 5 temporadas, **aconteceu 0 vez** — com três brigas
   por semana espalhadas por 138 torcidas e a ação social devolvendo polícia, o
   banimento é risco de cauda pra IA — **0 vez também em 20 temporadas**. Quem brinca
   com ele de verdade é o jogador, que briga toda semana.
   A conta, escrita: cada torcida participa de ~0,043 briga por semana (3 brigas × 2
   lados ÷ 138), o que tira ~0,026 de polícia; a ação social devolve 1,5 numa chance de
   6 a 25% por semana conforme o arquétipo. A recuperação ganha da perda por uma ordem
   de grandeza, e o número estaciona logo abaixo do gatilho de 8. Se o banimento tiver
   de ser risco real pras 138, o botão é essa condição.
5. **Moral baixa acua.** Nas mesmas 60 semanas, com todas as torcidas fixadas em moral
   **4** saíram **43 brigas**; com todas em **18**, **77** — 1,8× mais. O fator é
   `0,6 + (moral/20)·0,8`, de 0,6 acuada a 1,4 em alta.
6. **Nenhuma ficha individual**: o registro de cada torcida tem 18 campos, todos
   escalares ou listas de estrutura (bares, lojas, irmãs) — nenhuma lista de pessoas.
7. **O custo não subiu de forma perceptível.** Com o cache de pares frio a cada semana —
   que é o pior caso e o que exercita o código novo —, `passarSemana` das 138 passou de
   **0,238 ms para 0,625 ms por semana**: 0,39 ms a mais, **20 ms por temporada**. Com o
   cache quente as duas versões medem os mesmos 0,238 ms. A comparação é feita na mesma
   página, com o mesmo save, carregando o módulo de `dc9acde` por cima do novo — duas
   execuções separadas mediriam também o ruído da máquina.
8. Os pontos de leitura estão na tabela acima, com arquivo e linha.

### Desvios, escritos porque existem

- **A notícia do portão (b) é escrita antes do jogo acontecer.** Os efeitos são
  aplicados no fechamento da semana anterior, e a mensagem é publicada no dia da
  partida. É ficção de um dia: o estado anda no domingo da semana anterior e a história
  é contada no sábado seguinte. A alternativa — aplicar tudo no dia — exigiria que
  `passarSemana` deixasse de ser a passada semanal única que ela é hoje.
- **A linha de consequência ainda não cobre tudo.** Ela sai nas notícias entre IAs, nos
  ataques contra nós, nas investidas, na debandada e em toda decisão respondida. O fecho
  das cenas de briga (`fecharAtaque`, `fecharDefesa`, `fecharAssalto`, `fecharPressao`)
  ainda escreve o resultado em texto e não devolve lista de efeitos — é o próximo pedaço
  do mesmo trabalho, e os números que ele move já estão calculados lá dentro.
- **A polícia da IA quase não desce, e por isso o banimento nunca dispara sozinho.**
  O equilíbrio ficou em 8,7 de 20 porque a ação social é generosa perto da frequência
  de briga: em 20 temporadas, **0 banimento natural**. A punição existe, está ligada e
  foi comprovada forçando o caso — mas hoje ela é regra pro jogador, não pra IA. O botão
  é a condição `t.policia < 8` da ação social em `economiaDelas`: baixá-la pra 6 desce o
  equilíbrio e engorda a cauda. Não foi mexido porque mudar balanceamento sem o
  enunciado pedir é escolher pelo autor.

## 8.21 Taxa de briga dobrada, a emboscada em cena e a data que estava na planilha

Três ajustes que não se encostam, medidos juntos.

### 1. Seis episódios por semana em vez de três

A taxa de briga de cada torcida sai inteira de uma constante:
`diplomaciaDelas` roda N episódios por semana, cada um envolvendo duas torcidas, e o
teto é `N × 2 ÷ 138`. As chances por arquétipo, ousadia e moral filtram QUAIS episódios
viram briga — o teto elas não movem. Com N = 6 ele passa de **0,0435 para 0,087**.

Três números diferentes, e vale distingui-los porque só o primeiro é constante:

| | por torcida, por semana |
|---|---|
| **teto** — episódios sorteados | 0,0435 → **0,087** (dobro exato) |
| **gerados** — episódios que viraram briga | 0,0174 → **0,0312** (1,79×) |
| **publicados** — brigas que chegaram ao feed | **0,021** |

Os dois últimos são de **20 temporadas** — 1.036 semanas, 2.231 brigas geradas e 1.499
publicadas — e batem com a medição de 3 temporadas na terceira casa.

O "gerado" foi medido nas duas versões na mesma página, com o mesmo save, carregando o
módulo de `a98c5dd` por cima do novo: 186 brigas em 155 semanas antes, 334 depois. Ele
não dobra exato porque o dedupe de pares e o fator de moral filtram diferente conforme o
estado do mundo.

O "publicado" é menor que o "gerado" porque a **cota da categoria 5 é o gargalo**: são
3 notícias de mundo por semana com jogo na praça e 1 sem. As brigas que não viram
notícia aconteceram do mesmo jeito — caixa, efetivo, moral, prestígio e tensão delas já
foram movidos quando `hostil()` rodou.

**O que isso fez com o feed**, medido em 5 temporadas com a Gaviões:

| | antes (3 episódios) | depois (6) |
|---|---|---|
| mensagens por semana | 5,3 | **6,2** |
| semana mais cheia | 10 | **13** (teto 15, nunca ultrapassado) |
| dias em silêncio | 52,1% | **40,7%** |
| categoria 5 no total | 44% | **47%** |

Em 20 temporadas os mesmos números se mantêm: **5,93 mensagens por semana**, semana mais
cheia de **12**, **0 semanas acima do teto em 1.036**, **41,5% dos dias em silêncio**. A
distribuição fecha em 5 = 2.831, 2 = 884, 7 = 760, 1 = 747, 3 = 704, 6 = 138 e 4 = 81 —
a categoria 5 subiu três pontos percentuais e continua sendo a mais frequente, com a 2
em segundo: ela não engoliu as outras, que são dirigidas por evento e não competem por
cota.

### 2. A emboscada na estrada vira cena

Era o único dos quatro `ALVOS` de `ataquesContraNos` que ainda resolvia em número junto
com sede e loja. Agora ela entra em `COM_CENA`, e a mensagem que estava escrita
esperando passa a ser usada:

> *"Pegaram a caravana na estrada. A Dragões da Real fechou a pista."* → **Ir pra treta**

**O cenário é emprestado, e isso está escrito no código**: ela abre a rua de classe
baixa (`rua`), porque cena própria de rodovia não existe. Sem a nota, daqui a seis meses
a pergunta seria "por que a emboscada na BR abre uma rua de periferia?".

Duas diferenças em relação ao ataque ao bar, e as duas têm motivo:

- **O nosso lado é quem embarcou na caravana**, não um quarto da torcida:
  `estimativaCaravana(E).vao`. Quem ficou na cidade não está na estrada pra apanhar.
- **Os papéis se invertem**: no bar somos a casa e nascemos no salão (lado
  `visitante`); na estrada não há casa, e o ônibus fechado é o `mandante`. Por causa
  disso `fecharDefesa` passou a ler `res.ganhamos` — que a ponte já resolve do ponto de
  vista do jogador — em vez de `!res.venceu`, que dava o resultado invertido.

**O prejuízo é o que a caravana carregava**: o rateio da viagem mais 4% do caixa. A
primeira versão usava R$ 120 por cabeça e, com 219 embarcados, cobrava R$ 26.813 — sete
vezes o que custa perder o bar. Com o rateio, R$ 4.475.

Medido: caravana de 219, cena `rua` com **219 contra 18**, 219 e 18 discos no canvas,
cores certas dos dois lados, bombas do plano. Um único lançamento no extrato —
`Emboscada na estrada −4.475` — e nada de `ataquesContraNos`: com cena, ele só agenda e
narra. E a mensagem de resultado sai no feed com a linha de consequência:

> Caixa nosso sai −R$ 4.475 · Moral nossa cai −3 · Prestígio nosso cai −0,7 ·
> Tensão com a Dragões da Real aumenta +6 · Moral da Dragões da Real sobe +0,8

Era o pedaço que faltava do §8.20: **o fecho de cena agora devolve a lista de efeitos**.
E o resultado é publicado na hora, sem esperar o próximo tique do relógio — o jogador
sai da briga vendo no feed o que ela custou.

**A emboscada também cai no dia da viagem**, e não num dia sorteado da semana: ela é na
estrada, e a estrada só existe quando a caravana está nela.

### 3. A data de fundação estava na planilha e era jogada fora

A aba Torcidas do `Book_3_1.xlsx` tem a coluna "Data de fundação" com a data completa;
`ano()` pegava os quatro últimos dígitos e o resto ia embora. Enquanto foi só o ano, a
festa do aliado caía num dia sorteado por hash do id: fixo, mas inventado.

O importador passa a ler dia e mês. O openpyxl já devolve `datetime` quando a célula
está formatada como data; quando vem número cru é o serial do Excel, contado desde
1899-12-30, e a conversão trata os dois. **Nenhum serial cru apareceu no arquivo**,
então o bug do 29/02/1900 não chegou a ser exercitado.

- **137 das 140 torcidas** ganharam dia e mês. As 3 que ficaram — Força Azul, Fúria
  Independente do Guarani e Guerrilha Jovem — não têm linha na planilha e **continuam
  no hash, que virou reserva em vez de regra**.
- **Gaviões: 01/07/1969.** Jovem Fla: 06/12/1967. Cearamor: 14/10/1982.
- A semana da festa bate com a data em **137 de 137**.

**Um detalhe que só apareceu medindo:** 15 torcidas fundadas em 1º de janeiro caíam
caladas no hash, porque o calendário do jogo começa na primeira segunda-feira do ano —
5 de janeiro — e `semanaDiaDe` devolve nulo pros quatro dias antes dela. Aniversário de
1º de janeiro é semana 1, e agora é o que ele é.

Numa temporada, quatro festas caíram: Remista (31/03) na semana 13, Fúria Jovem Botafogo
(21/06) na 24, Camisa 12 (08/08) na 31 e Pavilhão 9 (09/09) na 36 — cada uma na semana
que contém a data.

### O banimento continua em zero, como a conta previa

**0 banimentos por polícia zerada em 20 temporadas com a taxa dobrada.** A conta do
enunciado se confirma: dobrar a frequência leva o desgaste de −0,032 para −0,065 por
semana, e a ação social devolve +0,15 sempre que a polícia cai abaixo de 8. A
recuperação continua duas vezes mais forte que o desgaste, e o gatilho em 8 cria um piso
que o atrito não vence.

Nenhuma das duas alternativas do enunciado foi implementada — nem a severidade por
evento grande, nem baixar o gatilho pra 4. **Confirmar o zero era o que valia**, e
escolher entre elas é do autor.

### Um vazamento achado pela bateria

A corrida de vinte temporadas matava a aba, e por dois motivos que não são do jogo mas
valem registro:

- **`aoMudar` chamava `redesenhar()`**, que refaz a barra, os treze ícones do menu e os
  sessenta cartões — uns cinco mil nós por dia. No jogo real passava despercebido porque
  o laço do relógio já usava o caminho leve; virar o dia agora só escreve o cabeçalho e
  acrescenta as mensagens novas. Remontagem de verdade tem dono: `abrirPainel`,
  `fecharPainel` e quem mexe em opção.
- **O mapa de nós do feed** guardava referência a toda mensagem que já passou pela
  lista, inclusive as podadas. Agora ele se limpa junto com a poda.

O que sobrou era do teste: ele não fechava o relatório semanal, e cada modal deixava
~100 nós na tela. Com os três consertos, o DOM fica plano em ~1.230 nós e o heap em
45–77 MB depois de oito temporadas.

## 8.22 O mapa sai: a ida ao estádio vira resolução

Mudança de direção. O mapa da cidade foi descontinuado. **Nenhum botão do feed abre
mapa** — os botões abrem tela de gestão ou cena de briga, e nada mais. O que o mapa
fazia por simulação passa a ser **resolvido**: o jogo calcula o que aconteceu no caminho
do estádio e publica o desfecho.

Saíram **4.122 linhas** e entraram **1.111** (771 de `js/mundo/praca.js`, o resto
espalhado): saldo de **−3.011 linhas**.

| arquivo | antes | depois |
|---|---:|---:|
| `js/mundo/ruas.js` | 1.948 | **apagado** |
| `js/mundo/praca.js` | — | **771** |
| `js/mundo/mapa.js` | 1.120 | **488** |
| `js/main.js` | 4.698 | **3.777** |
| `css/paineis.css` | 1.409 | **1.149** |
| `css/mobile.css` | 246 | **193** |

### 1. O que morreu

A tela do mapa inteira — canvas, arte, zoom, arrasto, filtros de pontos, dica
flutuante, faixa da torcida sobre a cidade. O deslocamento em tempo real: malha de nós,
rotas, `caminho()`, horários escalonados de saída, os dois pontos de entrada da cidade,
a caminhada do visitante até a sede do aliado. O bonde comandado: sair da sede, destino
por clique, WASD, o pad de toque. O olheiro posto num ponto do mapa. O relógio da rua e
o conjunto de pausas dele. Os andarilhos e a viatura.

No jogo inteiro sobrou **um `getContext`**, o da cena de briga. `andarilho` e `viatura`
só aparecem em comentário, contando o que saiu.

**O relógio agora é um só.** Havia dois conjuntos de motivos de pausa — `pausas` da rua
e `pausasT` do tempo — porque com o mapa aberto a rua tinha de andar e o calendário
tinha de ficar parado, e um conjunto não sabia representar esse par. Sobrou `pausasT`:
painel, foco, salvar, cena. A decisão sem resposta continua fora dele; a verdade dela é
`TO.feed.travado`, e isso é cicatriz de um congelamento com a tela limpa.

### 2. O que sobreviveu: os dados como modelo

`dados/cidade_mapa*.js` e `dados/estadios.js` continuam carregados. `TO.mapa` perdeu
`desenhar`, `paraImagem`, `baixarImagem`, `alvoEm`, `pinoDe`, `classeDe` e os `ICONE`
vetoriais; ficou com `modelo`, `arteDe`, `bairroEm`, `andavelEm`, `hash`, `filtros` e
`estruturas`. `corQueLeSobre` ficou também, e não por engano: ela produz o campo
`corSigla` do modelo, não um pixel.

`TO.praca` é o que sobrou de `ruas.js`. Ele responde ao que o jogo pergunta:
`jogosDaPraca`, `pontoDaSede` / `pontoDoBar` / `pontoDoEstadioDoClube`, `localDe`,
`elencoDaNoite`, `anfitriaoDe` / `escoltaDe`, `hostis`, os assaltos — e o que é novo,
`naRuaHoje` e `resolverIda`.

**As oito cenas de briga ficaram inteiras.**

### 3. A resolução da ida

Depois da convocação — *"Hoje tem Ceará × Confiança no Arena Castelão. A bateria sai da
sede."* → **Ir pro estádio** — `resolverIda` devolve um de três desfechos.

- **Intenção nossa.** Plano da semana com `intencao` ≠ paz e o alvo na rua: o encontro é
  certo, e o lugar é o que o jogador escolheu na Gestão.
- **Intenção deles.** `min(90, 3 + tensão × 0,85)` por cento — a mesma conta que
  `combate.js:253` usa pro humor dos bondes nos arredores. Quem decidiu procurar
  **encontra**: sem malha, não há mais como errar o alvo por dois quarteirões.
- **Acaso.** `min(12, tensão × 0,10 + |relação| ÷ 12)`.

O termo do ódio foi **medido, não escolhido**: só com a tensão o desfecho (c) não
acontecia nunca. Numa temporada de jogador que não briga a tensão fica em **zero o tempo
todo** — ela sobe com investida, com ataque sofrido e com briga, e decai sozinha —, e a
temporada fechou com **31 pares hostis na rua e nenhuma surpresa**. Mas dois que estão em
−85 passam o ano se procurando de olho. A −85 o acaso dá 7,1%; a −20, 1,7%; no piso da
hostilidade (−15), 1,25%.

**O lugar** sai do modelo do mapa: os bairros cujo centro cai a menos de 190 unidades da
reta entre cada sede e o estádio. Se o sorteado for o bairro de um campo, é `arredores`;
se a janela de 5×5 da máscara de ruas em volta do ponto tiver 23 ou mais células
andáveis, é `praca`; senão é a rua da classe do bairro. O 23 é o mesmo `LARGO` de antes —
a máscara atravessou o corte, o que sumiu foi o grafo de nós por cima dela.

**O efetivo** é o real dos dois lados. `naRuaHoje` monta quem pisa na rua com a conta que
`montar` já fazia — nós por `efetivoDaSaida`, as outras da praça por 60% do efetivo, as
de fora por `caravanaDe` —, e a escolta continua saindo do anfitrião e entrando no
aliado. O que morreu foi a caminhada até a sede, não o efeito.

### 4. O assalto sem viatura

"A viatura chega a tempo?" era pergunta espacial. O substituto estava na tabela:
`seguranca`, de `COMERCIO`, vira a chance de dar errado, com fator **5**.

| alvo | segurança | chance de dar errado | gaveta | pena |
|---|---:|---:|---:|---:|
| mercadinho | 2 | **10%** | R$ 60 | 30 dias |
| posto | 3 | **15%** | R$ 108 | 30 dias |
| roupas | 3 | **15%** | R$ 144 | 30 dias |
| joalheria | 6 | **30%** | R$ 504 | 60 dias |
| banco | 8 | **40%** | R$ 360 | 60 dias |

O fator é medido, não escolhido de véspera. Com 10 o banco seria preso em 8 de 10 e
voltaria a ser a armadilha que a corrida da viatura tinha criado — *"preso em 7 de 7, sem
render um centavo nunca"*. Com o número cru (2% a 8%) ninguém seria preso numa temporada
inteira. Em 5 a escada aparece e o banco continua sendo aposta.

O resto não mudou: 2 a 3 por mês agendados por hash da data, autor sorteado por peso de
efetivo entre todas as organizadas da praça, membro tirado dos disponíveis, aviso pra
toda tentativa. E a prisão de uma torcida da IA agora derruba a `policia` dela pelo calor
do alvo, como derruba a nossa — indicador que se move de um lado e não do outro é
decoração (§8.20).

### 5. O olheiro

A voz ficou inteira: as estimativas em faixa, o *"não consegui colher informações essa
semana"*, o movimento dos rivais antes do pré-jogo. O que saiu foi o **disco posto no
mapa** (`porOlheiro`, raio de 150). O esquema de pontos da Gestão (`mapaDoOlheiro`) NÃO
saiu — ele é onde o jogador escolhe o lugar da emboscada, que é o que o critério 5 mede.
Estreitar a margem pagando por isso na Gestão fica anotado, não implementado.

### 6. A HUD

A coluna de ícones voltou pra borda esquerda, que é onde ela morava dentro do mapa. O
corpo do feed é irmão dela: barra em cima — faixa da torcida em uma linha, bloco de data
com o ≫, 1×/2× — e a lista embaixo. O ticker segue no rodapé.

**O ≫ voltou, com outro papel.** Ele tinha sido aposentado em §8.19 porque não faz
sentido "avançar o dia" num jogo em que o dia avança sozinho. Agora ele **empurra** o dia
que está correndo, pra quem não quer esperar o segundo — e respeita a única trava que
existe: decisão sem resposta não deixa o tempo andar, nem sozinho nem no dedo. O §8.19
foi anotado pra não carregar duas afirmações contrárias.

---

### Os dez critérios, medidos

**Uma temporada, no máximo, em cada medição.** Cearamor, Fortaleza.

**1. Nenhum botão do feed abre mapa.** `feed.js` declara 11 botões com 11 efeitos:
`nada` (5), `painel` (5), `gestao` (2), `ideologia`, `cena`, `ida`, `tensao`, `assalto`,
`fianca`, `festa-sim`, `festa-nao`. O `case 'mapa'` saiu do `aplicar`. Varrendo o feed de
uma temporada, apareceram: `assalto`, `festa-sim`, `festa-nao`, `fianca`, `gestao`,
`ida`, `ideologia`, `nada`, `painel`, `tensao` e uma linha-abaixo pra `competicoes` —
**nenhum abre mapa**. `abrirCenaDaMensagem` também perdeu o `abrirPainel('mapa')` de
fallback: o que ele não sabe abrir vira aviso ruidoso.

**2. O código saiu, não foi desligado.** Tabela de linhas acima. `getContext` aparece uma
vez no jogo inteiro (`ponte.js`); `andarilho` e `viatura` só em comentário; a página
`data-pag="mapa"` saiu do `index.html` e o item saiu do `NAV`.

**3. Os dados do mapa continuam sendo consultados.** Quem decide é
`TO.praca.localDe(mo, x, y)`, com `TO.mapa.bairroEm` e a máscara `mo.malha.andavel`. As
16 regiões de Fortaleza:

| bairro | classe | cena | células andáveis (5×5) |
|---|---|---|---:|
| **Aldeota** | Nobre | **`rua-nobre`** | 21 |
| Meireles | Nobre | `rua-nobre` | 17 |
| Dionísio Torres | Nobre | `rua-nobre` | 18 |
| **Pirambu** | Favela | **`rua`** | 21 |
| Jangurussu / Castelo Encantado / Bom Jardim | Favela | `rua` | 21 / 21 / 19 |
| Genibaú | Favela | **`praca`** | **23** |
| Granja Portugal / Monte Castelo / Jd. das Oliveiras | Classe Baixa | `rua` | 20 / 17 / 19 |
| Antônio Bezerra / Conjunto Ceará | Classe Baixa | **`arredores`** | têm estádio |
| Messejana / Maraponga / José Walter | Classe Média | `rua-media` | 21 / 19 / 14 |

Na temporada medida a surpresa do dia 265 caiu na **Aldeota** e abriu a **rua nobre**.

**4. Uma temporada, os dias de jogo do nosso clube.** Jogador ativo: responde
provocação, segue a ideologia e, em metade dos dias com rival na rua, marca ataque num
ponto da Gestão.

| | dias |
|---|---:|
| convocações de ida | **30** |
| **paz** | **19** |
| **briga planejada** | **9** |
| **surpresa** | **2** |

Dos 21 dias **sem plano**, **19 terminaram em paz — 90,5%**. As duas surpresas foram por
acaso; nenhuma por intenção deles, porque a tensão ficou em zero a temporada toda com
este jogador.

**5. A briga planejada abre onde o jogador escolheu.** Nas 9, o ponto da Gestão bateu com
o local da cena em 9 de 9:

| ponto escolhido | bairro do ponto | cena aberta |
|---|---|---|
| Praça de encontro | Bom Jardim | `praca` |
| Avenida de acesso | Maraponga | `rua-media` |
| Bar do rival | Monte Castelo | `bar` |

Pela tela: a convocação do dia 40 abriu a **praça do Bom Jardim** com **150 nossos contra
8 da Jovem Confiança** — 158 discos, o efetivo real e distinto de cada lado, nada
clampado.

**6. A briga por surpresa.** Dia 265, **rua nobre na Aldeota**, `149 × 13` contra a
Trovão Azul, `#000000` e `#1A40CC` — cores próprias, distintas, 162 discos. Dia 51,
`rua-media` em Messejana, `144 × 10` contra a Gang da Ilha.

**7. A escolta continua somando.** Em **17 dos 30** dias de convocação houve pelo menos
uma. A Jovem Confiança do dia 40 entrou com **8**: 5 de caravana e **3 emprestados pela
Jovem Garra Tricolor**, que saiu com 3 a menos. O acerto foi verificado por acidente —
uma prova que derrubou a relação pra −100 encolheu a caravana de 5 pra 4 e a torcida
sumiu da rua, que é exatamente o gatilho `vem < 5` funcionando.

**8. As oito cenas continuam funcionando.** A bateria passa limpa, **0 erros de página**:

| cena | discos | PM | grades |
|---|---:|---:|---:|
| arredores | 63 | 9 | 54 |
| praca | 56 | 4 | 0 |
| rua | 52 | 3 | 0 |
| rua-media | 52 | 3 | 0 |
| rua-nobre | 52 | 3 | 0 |
| bar | 48 | 3 | 0 |
| comercio | 40 | 4 | 5 |
| ct | 44 | 2 | 7 |

E o ciclo inteiro pela tela: mensagem → `abrirConfronto` (pausa `cena` entra, 158
discos) → fim da cena (pausa sai, `em-cena` sai, o feed ganha a mensagem do resultado).

**9. Os assaltos de uma temporada.** **32 agendados e 32 resolvidos** — dentro dos 24 a
36 esperados (13 blocos de 4 semanas × 2 ou 3).

| alvo | tentativas | presos | observado | configurado |
|---|---:|---:|---:|---:|
| joalheria | 5 | 2 | **40,0%** | 30% |
| roupas | 3 | 1 | 33,3% | 15% |
| banco | 7 | 1 | 14,3% | 40% |
| mercadinho | 9 | 1 | 11,1% | 10% |
| posto | 8 | 0 | 0,0% | 15% |

**Banco e joalheria prendem mais que mercadinho** — na configuração, 40% e 30% contra
10%. No observado a ordenação sai certa pros dois (40,0% e 14,3% contra 11,1%), mas é
preciso dizer o óbvio: **3 a 9 sorteios por tipo não separam 40% de 10%**. Uma temporada
é o que o enunciado pede; o número confiável é o configurado.

Os autores acompanham o efetivo, que é o que o sorteio por peso promete: Leões da TUF 16
(a maior da praça, 167), Cearamor 5, Jovem Garra Tricolor 4, MOFI 4, Jovem do Floresta 2,
Aliança 1.

**10. A HUD nas três resoluções**, com o feed montado:

| | 1400×900 | 390×844 | 844×390 |
|---|---|---|---|
| coluna de ícones | 41×874, 12 ícones | 37×798, 12 | 37×344, 12 |
| faixa da torcida | **26px — uma linha** | **26px** | **26px** |
| números visíveis | saldo, /sem, membros, prestígio | saldo | saldo, /sem |
| bloco de data com ≫ | sim | sim (2ª linha da barra) | sim |
| 1×/2× | sim | sim | sim |
| ticker | 1400×26 | 390×26 | 844×26 |
| rolagem horizontal | **não** | **não** | **não** |
| órfãos do mapa no DOM | **0 de 17 seletores** | **0** | **0** |

Em 390px a **barra** quebra em duas linhas e a **faixa** continua em uma — que é o que
foi pedido. Antes deste ajuste a faixa é que quebrava, e o nome da torcida saía com 85px
de largura em três linhas.

### O que mais mudou de número

- **Uma temporada custa 1.484 ms** contra **9.530 ms** antes: **6,4× mais rápida**. O dia
  deixou de rodar seis mil tiques de um trigésimo de minuto de rua.
- **Determinismo intacto:** o mesmo save carregado em duas páginas limpas dá **108
  mensagens e 0 diferenças**.
- **Um erro de português consertado de passagem.** `d${vogal?'':'o '}${bairro}` saía
  *"Joalheria dAldeota"*, e *"do Aldeota"* estaria errado do mesmo jeito: nome de bairro
  tem gênero e o gênero não está nos dados. Agora é **"no bairro X"**, que está certo
  sempre. Pro comércio o artigo existe na tabela (`COMERCIO.artigo`) e é ele que se usa.

### O que foi observado e não é deste prompt

O jogador de teste — passivo, que nunca abre o Financeiro — **quebra e some**: o caixa vai
a negativo por volta do dia 85 e a torcida cai de 150 pra 1 até o fim do ano. É
pré-existente e o corte **melhorou** o quadro: no `09c3c8a` a torcida zerava no dia 253 e
o ano fechava em −R$ 46.875; agora zera no 337 e fecha em −R$ 29.926. Fica registrado
porque é o que impede uma temporada de teste de ter efetivo realista no segundo semestre
— o ataque planejado do dia 334 abriu com 4 discos do nosso lado.

## 8.23 Seis ajustes: o alarme no feed, a tela da caravana e a chegada

Seis coisas que não se encostam, medidas juntas. Uma temporada em cada medição,
Cearamor, Fortaleza.

### 1. O fechamento sai do modal e vira duas mensagens

O modal não abria por engano: a regra era `relatorio || grave`, com `grave` = semana no
vermelho, caixa negativo ou gente saindo. Errado era o **formato** — na arquitetura do
feed o que chega ao jogador é mensagem, e tela por cima é escolha dele.

São duas, e **uma exclui a outra**:

| | peso | categoria | texto | botão |
|---|---|---|---|---|
| **resumo** | `acao` | 4 | *"A semana fechou em +R$ 847."* | Ver Financeiro |
| **alarme** | `decisao` | 6 | *"Chefe, o caixa fechou no vermelho…"* | Ver Financeiro · Deixar como está |

O resumo **traz o valor no texto**, e é isso que responde ao comentário que antes
suprimia o resumo: uma linha genérica por semana é barulho de fundo, e o conserto é
escrever o número, não calar. É também o único caminho até o detalhamento para quem
deixa a chave do relatório desligada, que é o padrão.

O alarme sai **sem `assunto`**, de propósito. A carência de duas semanas do escalonador
vale pra assunto de dia — "não repita a mesma conversa na semana seguinte". O alarme não
é conversa: é a parada obrigatória, e com carência a segunda semana no vermelho ficaria
sem mensagem nenhuma, porque o resumo também não sai em semana grave. O `caixa` saiu de
`ASSUNTOS` e virou fecho de semana; ele nunca foi assunto de dia — é a leitura da semana
que fechou, e quem sabe disso é o `rel` que o fecho entrega.

**O texto segue a causa.** `grave` também é verdade com o caixa positivo e gente indo
embora; nesse caso dizer "fechou no vermelho" seria mentira, e a mensagem passa a contar
a saída.

O autosave já estava separado do modal e continua: ele roda toda virada, chave ligada ou
desligada.

### 2. A caravana ganha tela

*"Quantos vão na caravana, e por qual estrada?"* abria a Gestão inteira, com onze
cartões, pro jogador achar sozinho o da caravana. Pergunta específica, tela específica —
`abrirCaravana()`, um modal com três seções e nada além:

- **quantos vão**: quantos *querem* (`interessados`, de `aptos × vontade`), o medidor de
  vontade, o contador entre o mínimo e esse teto, e **o custo por cabeça, o bruto, o
  rateio e o que sai do caixa** — recalculados a cada toque, porque caravana é a maior
  despesa avulsa do jogo e decidir sem ver o preço é decidir no escuro;
- **por qual estrada**: as rotas de `rotas(E)`, com trechos, rodovias e risco de
  emboscada, mais o trajeto cidade a cidade;
- **quantas bombas**: do estoque, com o saldo à vista.

Fecha com o resumo — *"85 para Recife por Rota mais curta − R$ 1.428"* — e o Confirmar.

**Nada aqui lança dinheiro.** A tela escreve `p.caravana`, `p.rota` e `p.bombas`;
`confirmar()` fecha o plano; a estrada continua sendo cobrada uma vez no fechamento, por
`cobrarCaravana`. Cobrar na tela seria o lançamento duplicado.

### 3. O jogo fora vira a chegada

O jogo fora usava o texto de jogo em casa. Agora tem mensagem própria, e ela é
**informativa**: quando sai, a estrada já aconteceu.

**Linha fixa:** *"Hoje tem ABC × Ceará no Frasqueirão."*

| situação | complemento |
|---|---|
| sem emboscada | "Nossa caravana foi tranquila e já estamos em Natal." |
| emboscada, ganhamos | "Eles tentaram atacar a gente na estrada, mas passamos por cima." |
| emboscada, perdemos com feridos | "Tivemos algumas baixas na caravana com **7** feridos, mas já chegamos em Natal." |
| emboscada, perdemos sem ferido | "Levamos a pior na estrada, mas ninguém ficou pelo caminho: já estamos em Natal." |

A quarta linha não estava no enunciado e **é necessária**: dá pra perder a briga sem
ninguém no chão — as duas turmas se olham, a PM chega, o ônibus segue —, e o texto de
baixas com `{n} = 0` seria a mensagem se contradizendo dentro da própria frase.

**A ordem se resolve sozinha.** A emboscada cai em `diasDeCaravana(E)[0]`, que é o dia da
IDA — a véspera do jogo. A convocação abre a cena lá; o fecho dela escreve `E.viagem`
(`seguramos` e `feridos`); a chegada sai no dia seguinte lendo esse registro. O `{n}` sai
de `res.membros` — as fichas da caravana que caíram na cena —, então é exatamente quem
embarcou e não chegou inteiro.

**Jogo fora não tem botão.** Ir ao estádio do adversário não abre cena: a praça dele não
é a nossa, e `resolverIda` devolveria "paz" sempre. Botão que não leva a lugar nenhum é
botão mentiroso.

### 4. "Ficar em casa" saiu

O time joga, a torcida vai. Não era escolha de verdade — era a opção que o jogador
apertava pra não abrir a cena, e o custo dela em moral nunca foi sentido porque a moral
já cai por outros seis caminhos.

### 5. As notícias pacíficas

O fecho fixo `". As duas saíram ganhando."` estava grudado nos três eventos. É conclusão
de relatório, não de notícia: o leitor decide quem saiu ganhando, o jornal conta o que
houve. Cada evento passa a trazer o texto inteiro:

| id | texto |
|---|---|
| `tregua` | "{A} **reforçou o laço de amizade com a** {B}." |
| `visita` | "{A} foi recebida na sede da {B}." |
| `apoio` | "{A} apoiou a {B} no estádio." |

### 6. A rotina entra na abertura

A partida nova abria com "Jogo iniciado" e a ideologia. Entra uma segunda decisão logo
depois — *"E define a rotina da semana: uma ação padrão por dia, que a rapaziada toca
sozinha. Dia de jogo e dia de estrada ficam de fora."* → **Abrir rotina**, que cai na aba
certa do Calendário (a mensagem passa a poder pedir uma ABA, não só uma página).

Duas mudanças no escalonador foram necessárias, e as duas são estreitas:

- **`urgente` na segunda decisão**, pra furar o teto de uma interna por semana. Sem ele a
  rotina ficava na fila até a semana seguinte e o jogador começava a partida sem nunca
  ter visto a rotina — que é o que este item conserta.
- **`seguido`**, a única saída da regra 1 (nunca duas da mesma categoria em sequência).
  Ideologia e rotina são as duas da categoria 6 e são pedidas uma depois da outra de
  propósito. Nenhum produtor de dia usa este campo; ele existe só pra abertura.

---

### Os critérios, medidos

**1 · O modal nunca abre sozinho, e toda semana tem mensagem.** Uma temporada, chave
desligada:

| | chave desligada | chave ligada |
|---|---:|---:|
| semanas fechadas | 52 | 52 |
| semanas com mensagem de fecho | **52** | **52** |
| resumo (`acao`) | 9 | 5 |
| alarme (`decisao`) | 43 | 47 |
| as duas na mesma semana | **0** | **0** |
| presas na fila no fim | **0** | **0** |
| **modais abertos sozinhos** | **0** | **52** |
| autosaves | **52** | **52** |

A conta é pela CHAVE da mensagem (`fecho|ano|semana`), não pelo dia em que ela saiu: a
fila pode segurar o resumo um ou dois dias pela regra de não repetir categoria em
sequência, e contar só o dia da virada mediria a fila, não o fechamento.

**43 alarmes em 52 semanas é muito, e é o jogador de teste, não a regra.** Este jogador
nunca abre o Financeiro; o caixa vira negativo por volta do dia 85 e não volta. Semana no
vermelho é parada obrigatória por decisão do enunciado, então ele é parado toda semana. O
resumo é o caso normal de quem está no azul.

**1b · O resumo não para o tempo; o alarme para.** Forçando as duas situações na virada
da mesma semana:

| forçado | mensagem publicada | `travado` depois |
|---|---|---|
| caixa em +R$ 90.000 | `acao/4` — "A semana fechou em +R$ 856." | **false** |
| caixa em −R$ 4.000 | `decisao/6` — "Chefe, o caixa fechou no vermelho…" | **true** |

Em nenhum dos dois a outra mensagem apareceu.

**2 · A semana continua sendo salva** com o modal desligado: 52 chamadas a
`TO.estado.salvar` em 52 semanas.

**3 · Com a chave ligada o modal volta**: 52 em 52.

**4 · A tela da caravana**, aberta pela decisão *"Ceará joga fora domingo, contra o Santa
Cruz. Quantos vão na caravana, e por qual estrada?"*:

- seções: Quantos vão · Por qual estrada · Quantas bombas
- "Querem ir **107** de 150 aptos", vontade 71, contador com mínimo 5
- rotas: "Rota mais curta — 2 trechos por Rodovia Nordeste 1 e Rodovia Nordeste 2 · risco
  de emboscada 45", trajeto Fortaleza › Paraiba › Recife
- bombas: 0 de 4 no estoque

**O custo muda no dedo.** Dois toques no `−`:

| | antes | depois |
|---|---:|---:|
| embarcam | 107 | 85 |
| ônibus e pedágio | R$ 4.494 | **R$ 3.570** |
| rateio | R$ 2.696 | **R$ 2.142** |
| sai do caixa | −R$ 1.798 | **−R$ 1.428** |

**5 · A escolha chega ao plano e é cobrada uma vez.** Escolhido na tela: 74 pessoas, rota
curta, R$ 1.243. Confirmar não mexeu no caixa (−R$ 2.262 antes e depois). Na virada da
semana entrou **um** lançamento, em 7/6: *"Caravana para Recife (74 pessoas, rateio de
R$ 1.865) — R$ 1.243"*, e ele não se repetiu nas semanas seguintes.

**6 · Os três casos do jogo fora**, todos pela tela, Ceará × Santa Cruz no Arruda:

| caso | mensagem |
|---|---|
| sem emboscada | "Hoje tem Santa Cruz × Ceará no Arruda. **Nossa caravana foi tranquila e já estamos em Recife.**" |
| emboscada, ganhamos | "…**Eles tentaram atacar a gente na estrada, mas passamos por cima.**" |
| emboscada, perdemos | "…**Levamos a pior na estrada, mas ninguém ficou pelo caminho: já estamos em Recife.**" |

Nos dois casos com emboscada a convocação *"Pegaram a caravana na estrada. A Inferno
Coral fechou a pista."* abriu a cena **antes** (79 e 152 discos), e a chegada só saiu no
dia seguinte, com `tipo:'ruim'` quando levamos a pior.

**O caso de feridos não saiu da briga, e vale dizer por quê.** A cena da emboscada não
produz baixa nenhuma sem alguém dirigindo o bonde, e o headless não consegue dirigir:
110 s a 2× com investida e W apertados fecharam em `caidos {0, 0}` — o teclado do
Playwright não chega ao canvas. Então a prova do `{n}` é da CONTA, com o mesmo `res` que
`ponte.encerrar` entrega:

| caídos na cena | `E.viagem.feridos` | fichas que viraram ferido | chegaram | texto |
|---:|---:|---:|---:|---|
| 0 de 30 | 0 | 0 | 30 | "…ninguém ficou pelo caminho…" |
| 7 de 30 | **7** | **7** | **23** | "…com **7** feridos, mas já chegamos em Natal." |

**Não observado em uma temporada:** uma emboscada de jogo de verdade terminando com
ferido. O caminho está medido ponta a ponta; o que falta é uma briga jogada por mão
humana.

**7 · "Ficar em casa" não existe.** Os 14 rótulos vistos numa temporada: Abrir rotina,
Atacar alguém, Definir ideologia, Deixa isso, Deixar como está, Ir pro estádio, Montar a
caravana, Não, Não dar moral, Pode ir, Seguir ideologia, Sim, Vem, verme, Ver Financeiro.

**8 · As pacíficas.** 12 notícias distintas numa temporada, **0** terminando em "as duas
saíram ganhando". Exemplos: *"Força Jovem Vasco reforçou o laço de amizade com a Torcida
Jovem Botafogo."*, *"Comando Rubro-Negro foi recebida na sede da Mancha do Ypiranga."*.
O evento `apoio` não apareceu nesta temporada — **não observado em 1 temporada**.

**9 · A abertura, na ordem.**

| passo | feed | `travado` |
|---|---|---|
| partida nova | `info/5` "Jogo iniciado. Cearamor — Fortaleza, 150 membros." + `decisao/6` ideologia | **true** |
| respondida a ideologia | entra `decisao/6` "E define a rotina da semana…" | **true** |
| respondida a rotina | — | **false** |

As três antes de o tempo começar a correr.

### O que não mudou

A bateria das oito cenas continua limpa, com 0 erros de página, e o determinismo segue
intacto: o mesmo save carregado em duas páginas limpas dá **137 mensagens e 0
diferenças**.

## 9. Celular

> **Leia junto com §8.22.** Boa parte desta seção descreve a tela do MAPA — a gaveta
> sobre o canvas, o pad de WASD, o toque no canvas da cidade, o painel de conferência.
> O mapa foi descontinuado; o que vale hoje é a medição de HUD do §8.22, nas mesmas três
> resoluções. O que continua de pé aqui é o limiar, o comportamento dos painéis de
> gestão, o pad da CENA de briga e o toque no canvas da cena.

Um limiar só, **900px de largura** — sem detecção de toque e sem botão de ligar. Acima
dele nada muda: lateral fixa de 186px, teclado, mouse. O teclado continua valendo em
qualquer largura.

- **O menu vira gaveta.** ☰ no canto superior direito do `#topo`, e `#lateral` sai do
  grid e entra pela esquerda por cima do conteúdo. Fecha ao escolher página, ao tocar no
  véu e no Esc. Medido a 390×844: os cinco caminhos funcionam; a 1400×900 o ☰ não existe,
  a lateral é estática e o grid segue `186px 1214px`.
- **A gestão vira periférico do mapa.** Abaixo do limiar a tela principal é o mapa e as
  onze páginas abrem como painel por cima. `pintarMapa` recria o canvas e perderia zoom e
  arrasto, então o caminho do painel **nunca passa por ele**: pinta só a página pedida e
  mexe em classe. Medido: depois de abrir e fechar o Financeiro, é o **mesmo objeto
  canvas** (marca própria sobrevive) e o scroll do viewport continua em 180 px.
- **Nenhuma das 11 páginas rola de lado**, em 390×844 e em 844×390 — testado pelo que
  importa, tentando rolar (`scrollTo(9999,0)` devolve `scrollX` 0). Precisaram de
  container rolável: o **viewport do mapa** (em todas, porque o mapa fica montado
  embaixo), as **subabas** e o **cartão de detalhe** em Torcida e Diplomacia, e as **abas
  grandes** em Competições. Três coisas seguravam o layout aberto e foram consertadas: o
  grid virou `minmax(0,1fr)` (com `1fr` o canvas de 752px esticava a coluna e levava topo
  e ticker junto), a faixa de indicadores ganhou `flex:1 1 0; min-width:0`, e o painel de
  filtros do mapa deixou de ser coluna e virou faixa.
- **O pad de toque.** WASD em cruz embaixo à esquerda, Q/E/R logo acima, e 1–4 numa linha
  à direita. Ele **não implementa lógica nenhuma**: cada botão escreve no mesmo objeto
  `teclas` que o teclado alimenta, e Q, E, R e formação chamam exatamente o que
  `montarBotoes` já chamava. Por isso o **diff de `js/diajogo/combate.js` é vazio** — o
  arquivo mudou nesta rodada, mas pela Parte 1 (o reforço de quem chega atrasado); o pad
  não encostou nele.
  `pointerdown` e não `click`, porque pedra e bomba têm de sair no toque;
  `setPointerCapture` por botão pro multitoque valer. Medido no laço de verdade: W+D
  juntos movem o líder em diagonal (+39, −38), soltar para, e `pointercancel` — o dedo que
  escorrega pra fora — solta a tecla, com **nenhuma tecla presa** depois.
  Com o pad na tela o HUD encolhe pro botão do portão: repetir pedra, bomba, recuar e
  formação no meio da cena seria tapar a rua com botão que o dedo não usa. ENTER fica fora
  do pad de propósito — encerra a cena, não é reflexo.
- **O toque no canvas cai no lugar certo**: medido em cinco níveis de zoom (de 60% a
  105%), erro de **0 px** entre o pino e a coordenada lida. `cv.onclick` virou
  `pointerup`, e os handlers da cena trocaram mouse por pointer.
- **Funciona nos dois sentidos.** Em pé, na cena, aparece um aviso discreto sugerindo
  girar — sem travar e sem `screen.orientation.lock()`, que só vale em tela cheia e não
  existe no Safari do iOS.

- **A tela do mapa perdeu o painel de conferência.** Tamanho, Bairros, Ruas, Estádios (ou
  Quarteirões e Lotes), Nossa sede, População e o contador `X de Y pontos visíveis` eram
  números da época em que o mapa estava sendo construído; hoje o mapa é a tela principal e
  eles comiam a primeira dobra dela — no celular, mais ainda. Saíram, junto com o
  cabeçalho do cartão e com a regra `.mapa-barra` do CSS, que virou código morto. O que
  não podia sumir é em qual das cinco praças o jogador está: virou sufixo do título da
  página — **`Mapa da cidade — Sao Paulo, SP`** —, que é uma linha em vez de duas.

- **O dia abre perto do jogo.** Abria sempre às 08:00, e num apito das 16:00 isso eram 480
  minutos de relógio — quatro minutos de tela, dos quais quase três sem nada acontecendo.
  A abertura passou a depender do que o dia tem: **4h antes do primeiro jogo** quando há
  caravana que vai dormir na sede de um aliado, **2h30 antes do último apito** quando não
  há. A janela de saída não mexeu.
  Saber se há hospedagem exige rodar `anfitriaoDe` pras visitantes sem sede, o que só
  acontecia lá embaixo, dentro da montagem dos bondes — então entrou uma passada de
  detecção antes de tudo, e a abertura fica em `R.abertura`, resolvida uma vez: quem lê a
  hora e quem calcula o apito têm de ler o mesmo número.
  `CHEGADA_CEDO` morreu. Ele espalhava a descida do ônibus por 45 minutos porque o dia
  abria seis horas antes do jogo; com a abertura em T-3h30 a premissa acabou e a primeira
  perna começa em `saiEm: 0`. Medido: **102 bondes hospedados em 125 dias de jogo nas cinco
  praças Grandes, nenhum parado no minuto zero**.
  Conferido: apito às 16:00 abre **12:00** com hospedagem e **13:30** sem; apito às 11:00
  com hospedagem abre 07:00 e o dia roda inteiro, sem duração negativa. Em 621 bondes,
  **0 fora da janela de T-2h30 a T-2h00** e **0 horas de saída instáveis** entre aberturas
  da tela. O relógio para no apito do último jogo do dia, tirado de `horaDoJogo`.
  **Por que 4h e por que do primeiro jogo.** Na primeira versão era 3h30 antes do último
  apito, e a manhã sobrava 60 minutos — menos que a própria caminhada do ônibus até a casa
  do anfitrião, que medida rota a rota tem **mediana de 51 a 145 minutos conforme a praça
  e chega a 205**. Só 29 de 102 hospedados chegavam antes da própria hora de saída.
  Contar 4h do **primeiro** jogo é o que abre a manhã de verdade num dia de várias
  partidas: com jogos às 16:00 e às 18:30 a saída continua marcada pelas 18:30, mas o dia
  começa às 12:00 em vez das 15:00. Medido de novo em 125 dias: **61 de 98** chegam a
  tempo (era 29 de 102), a folga mais apertada é de 5 minutos e o pior atraso caiu de 144
  pra 114 minutos. Quem ainda não chega sai assim que chega.
  **O que isso custa:** dia sem hospedagem roda sempre 150 minutos, 1min15 de tela. Com
  hospedagem o piso é 240 minutos (4 min de tela) e o teto medido foi **690 minutos, 5min45
  de tela** — num dia de São Paulo com o primeiro jogo às 11:00 e o último às 18:30, o
  relógio abre 07:00 e fecha 18:30. O trecho entre a caravana chegar na sede do aliado e a
  janela abrir volta a ser tempo morto nesses dias. Se incomodar, o corte natural é ancorar
  a abertura no primeiro jogo só quando o dia tem um horário só de apito.

**Próximo passo recomendado: a emboscada em ponto qualquer da praça.** As cinco arenas já
existem e as ações já sabem abrir cena; falta o gesto no mapa — clicar num ponto da rua
pra marcar tocaia. Com o feed, ela ganhou um segundo motivo: a emboscada na estrada é a
única das quatro ameaças de rival que ainda resolve em número, e a mensagem de
convocação dela — *"Pegaram a caravana na estrada."* — já está escrita esperando a
cena.

**O que ainda falta no mundo:** a Série E do GDD §18.2 — os dados têm 108 clubes, não
156, então ninguém cai da Série D.
