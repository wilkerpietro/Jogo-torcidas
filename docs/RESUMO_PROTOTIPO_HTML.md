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

## 9. Celular

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
  A abertura passou a depender do que o dia tem: **3h30 antes** quando há caravana que vai
  dormir na sede de um aliado, **2h30 antes** quando não há. A janela de saída não mexeu.
  Saber se há hospedagem exige rodar `anfitriaoDe` pras visitantes sem sede, o que só
  acontecia lá embaixo, dentro da montagem dos bondes — então entrou uma passada de
  detecção antes de tudo, e a abertura fica em `R.abertura`, resolvida uma vez: quem lê a
  hora e quem calcula o apito têm de ler o mesmo número.
  `CHEGADA_CEDO` morreu. Ele espalhava a descida do ônibus por 45 minutos porque o dia
  abria seis horas antes do jogo; com a abertura em T-3h30 a premissa acabou e a primeira
  perna começa em `saiEm: 0`. Medido: **102 bondes hospedados em 125 dias de jogo nas cinco
  praças Grandes, nenhum parado no minuto zero**.
  Conferido: apito às 16:00 abre **12:30** com hospedagem e **13:30** sem; apito às 11:00
  com hospedagem abre 07:30 e o dia roda inteiro, sem duração negativa. Em 638 bondes,
  **0 fora da janela de T-2h30 a T-2h00** e **0 horas de saída instáveis** entre aberturas
  da tela. O relógio para no apito do último jogo do dia, tirado de `horaDoJogo`.
  **O que a medição mostrou de ruim:** a manhã dá 60 minutos (3h30 − 2h30) e a caminhada
  do ponto de entrada até a sede do aliado leva, medida rota a rota, **mediana de 51 a 145
  minutos conforme a praça, e até 205**. Resultado: só **29 dos 102** hospedados chegam na
  sede antes da própria hora de saída — a folga mais apertada foi de 2 minutos —, e os
  outros 73 saem atrasados, o pior deles em 144 minutos. Eles saem assim que chegam, como
  combinado, mas na prática a maioria não usa a hospedagem: chega na casa do aliado depois
  da hora de sair dela. Pra fechar, ou a manhã precisa de ~3h em vez de 1h (abertura em
  T-5h30), ou o ônibus tem de descer mais perto da sede do anfitrião.

**Próximo passo recomendado: a emboscada em ponto qualquer da praça.** As cinco arenas já
existem e as ações já sabem abrir cena; falta o gesto no mapa — clicar num ponto da rua
pra marcar tocaia.

**O que ainda falta no mundo:** a Série E do GDD §18.2 — os dados têm 108 clubes, não
156, então ninguém cai da Série D.
