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
- **Força dos clubes evolui** (portado do protótipo antigo, com um conserto): a posição
  final de cada competição move a qualidade do clube, e a evolução vive no save, não em
  `times.js`. As faixas herdadas tinham média positiva e em cinco anos os 108 clubes
  chegavam todos no teto — medido. Agora o delta é centrado na média da temporada: dez
  anos depois a soma das qualidades varia 2%, mas Grêmio subiu 16 e o Remo caiu 9.

**Próximo passo recomendado: pôr o mapa pra trabalhar.** A planta da cidade já está de
pé; o que falta é a camada viva por cima dela — onde a torcida rival está agora, o bonde
saindo da sede a caminho do estádio, o clique num alvo abrindo a cena da rua. É isso que
destrava as quatro ações hoje paradas por falta de cena (atacar bar/sede, assaltar alvo
comercial, pressionar o clube), a emboscada em qualquer ponto da praça e a escolta do
aliado.

Depois disso, o patrimônio: bares, lojas e subsedes têm receita, manutenção e insumo
implementados no fechamento, mas não há tela de compra — só existe o bar nível 1 que o
GDD dá de graça na sede nível 1.

**O que ainda falta no mundo:** a Série E do GDD §18.2 — os dados têm 108 clubes, não
156, então ninguém cai da Série D. E a qualidade dos clubes não evolui com os
resultados: quem é forte em 2026 é igualmente forte em 2036.
