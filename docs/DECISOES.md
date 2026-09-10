# TORCIDA ORGANIZADA — v0.4.0 · o feed é o jogo

Reconstrução decidida pelo dono do jogo em 17/08/2026. Este documento é
o contrato do que ficou, do que saiu e do que é lei.

## O esqueleto-base (LEI — nenhuma notícia colateral passa por cima)

O jogador escolhe uma torcida; as ações giram em torno das partidas do
seu time e dos demais times da cidade onde a torcida tem sede.

1. **O olheiro NUNCA falha.** Três situações, sempre informadas, com
   estimativa de membros de cada torcida e as opções de ataque:
   - (1) somos mandantes contra clube de torcida rival;
   - (2) outro jogo na cidade envolve uma torcida rival;
   - (3) somos visitantes e o adversário tem torcidas rivais.
   Opções: qual torcida atacar · ponto (concentração/praça, pista/rua,
   arredores) · quantos membros · quantas bombas. Botões **Atacar** e
   **Ir em paz** (e **Seguir padrão**, que executa a Ideologia).
2. **No dia do ataque marcado** aparece a mensagem **Ir pra Guerra**,
   que abre a cena com o efetivo empregado e o rival dentro da
   estimativa. Nos arredores, todas as torcidas do jogo spawnam na sua
   posição, inclusive a nossa, mandante ou visitante.
3. **Ataques-surpresa sofridos**: bar/loja em dia comum, concentração em
   dia de jogo em casa, pista a caminho do estádio, estrada na caravana.
4. **Depois de toda briga**: as relações deterioram e sai a mensagem do
   confronto com feridos de cada lado e o vencedor.
5. **Placar do nosso jogo** na noite dele; **resumo agrupado dos jogos
   do dia** (nossa cidade primeiro) com link **Ver Competições**.
6. **Escolta**: aliado hospedado/escoltado atacado na nossa cidade gera
   mensagem pra entrarmos na briga — controlamos os nossos e os dele.

**Toda notícia nova passa pelo crivo do dono antes de entrar.**

## Menu (8 itens, desde 17/08/2026)
Feed · Torcida · Financeiro · Calendário · Competições · Ranking ·
Diplomacia · Notícias.

## Mantido
Tela inicial; seleção em dois passos; competições completas (16
campeonatos, calendário, mando, placar por Poisson **puro** — sem Fator
Torcida); Torcida (membros/hierarquia/treinos/recrutamento); Financeiro
(resumo/patrimônio-estrutura/elenco/transações, mensalidade mensal,
alarme semanal); Calendário (mês/Expediente/agenda); Diplomacia
(relações/alianças/rivalidades/Ideologia); todas as cenas de briga;
economia viva das 139 torcidas; irmandades; fichas de membro; feridos e
presos (pena de até 90 dias, com contagem regressiva); recrutamento com
base real; sede/bar/loja/subsede/fábrica; reforço de elenco; caravana
com rotas; emboscada na estrada **pelos rivais da rota**; recepção de
aliados; save; bancada de cenas; geometria do mapa; base de dados.

## Novo/renomeado
- **Treta marcada** (17/08/2026): evento de briga combinada em rua
  (classe baixa/média/alta), fora de dia de jogo, com efetivos
  idênticos — 5×5, 7×7 ou 10×10. Mensagem aprovada: "Zona {zona}
  marcou uma treta no {bairro} contra a {rival}, bora pro problema?".
  Fecho: relação −2. Régua nova do dono (18/08/2026): o vencedor
  leva NO MÍNIMO 3 de prestígio na régua de 0-100 — 3 no 5×5, 4 no
  7×7, 5 no 10×10 —, o perdedor devolve o mesmo, e a vitória sobe a
  moral de cada membro que desceu (+2). Vale também pras tretas
  entre as IAs (mesma escala, e o vencedor do mundo leva moral).
- **Calendário do trimestre** (17/08/2026): a cada 13 semanas, 2 a 4
  tretas marcadas e 1 a 2 ataques ao nosso bar, sempre em dia comum.
  O bar saiu do sorteio semanal (caía 2x por mês).
- **Festa na sede custa R$ 700** e rende ~20% do que rendia.
  Recalibrada em 18/08/2026 (régua do dono): R$ 4,80 a 6,40 por
  presente — festa com 150+ na sede sempre paga a conta (mínimo
  +R$ 20, média +130); com 200, média +420; abaixo de ~146 é
  prejuízo mesmo, festa de torcida pequena é vaquinha.
- **Relógio por mensagem**: cada mensagem dropada segura a próxima por
  1,5 s; decisão sem resposta trava o tempo; dia sem mensagem passa
  rápido.
- **Expediente da Sede** (ex-rotina): três turnos por dia — manhã,
  tarde, noite — com rendimento reduzido (~35% do semanal por turno).
- **Ideologia**: aba da Diplomacia; é o que o botão "Seguir padrão"
  executa. Corte "quente" agora é relação < −55.
- **Bombas**: compradas na tela do ataque (R$ 120), sem loja de
  materiais. Desde 18/08/2026 também no Financeiro → Patrimônio:
  caixa com 5 por R$ 600, direto pro estoque que as cenas gastam.
- **Briga de bar é briga de salão** (teto do dono, 18/08/2026): em
  todo ataque a bar — nosso, contra nós e entre as IAs — o atacante
  bota no máximo 60 na cena e o defensor no máximo 40. Sede,
  concentração, pista e estrada seguem com as réguas de sempre.
- **relacoes.js** substitui tensao.js: tudo se baseia na RELAÇÃO
  (−100..+100); ataque de rival dispara com relação ≤ −55, briga derruba
  a relação (−22 típico) e a semana puxa devagar de volta ao natural.
- **O mundo briga sozinho** (17/08/2026): as brigas entre IAs nascem
  dos jogos do dia — torcida metida no jogo se pega com a torcida do
  clube adversário ou com hostil local da cidade da partida, com
  efetivos proporcionais aos disponíveis (quem viajou traz menos).
  Feridos ficam de 5 a 15 dias fora (era 30 fixo até 18/08/2026 —
  vale pros nossos e pras IAs), presos de 15 a 90 — o perdedor sai
  carregado: 25-40% de feridos e 5-12% de presos, contra 8-16% e
  1-4% do vencedor. Vencedor leva prestígio e moral, perdedor
  devolve — balanço proporcional (1 + envolvidos/25, teto 8 na
  régua de 0-100). O FAVORITO (efetivo × ficha média) vence 70%,
  não 100 (correção do dono, 18/08/2026 — Gaviões e Raça venciam
  todas): 3 em cada 10 brigas o bonde menor sai por cima, e a
  zebra é paga à altura — +4 de prestígio com teto 10 e moral em
  dobro (+1,2) pro vencedor em menor número. E a relação entre os
  dois azeda. Toda
  briga NOSSA também move o prestígio do rival: ±0,4 na briga de
  rua, −0,6/+0,4 no ataque (treta e defesa já moviam). E dinheiro só
  sai de briga NO BAR — sede e rua não têm saque. O ranking conta os DISPONÍVEIS, então briga mexe em posição.
  Registro completo na aba Brigas das Notícias, e toda segunda o
  jornal resume a semana no feed: quem brigou e quem venceu numa
  coluna, baixas na outra — só as 5 maiores na notícia (decisão do
  dono, 17/08/2026); o resto fica na aba.
- **A paz deprecia** (17/08/2026): 20 dias sem participar de briga
  tiram 1 de prestígio (régua 0-100) e 0,5 de moral, e o relógio
  segue correndo a cada 20 dias parados; qualquer briga zera.
- **Livro de moral e prestígio** (17/08/2026): todo movimento dos
  dois indicadores passa por um registrador com motivo; a sub-tela
  "Moral & Prestígio" da Torcida mostra o histórico item a item.
- **Assaltos** (tabela do dono, 17/08/2026): uma vez por mês, em dia
  comum, um diretor sugere assalto (decisão no feed); a tela pergunta
  o alvo e o efetivo, com membros SORTEADOS entre os disponíveis e um
  dado só pro bonde inteiro. Banco 10/20 → 30-50k/60-120k, 60% de
  cadeia, 360 dias; Joalheria 10/20 → 10-20k/30-40k, 50%, 180;
  Supermercado 5/10 → 5-10k/10-15k; Posto 5/10 → 2-3k/4-5k;
  Mercadinho 2/5 → 1-2k/3-4k; Loja de roupas 2/5 → 0,5-1k/2-3k.
  Caiu, não leva nada. Riscos e penas reapertados em 18/08/2026
  (valores de ganho intactos): Banco 50% de cadeia e 180 dias;
  Joalheria 35% e 120; Supermercado 35% e 120; Posto 20% e 90;
  Mercadinho 10% e 45; Loja de roupas 5% e 30.
- **Recrutamento por sorteio** (tabela do dono, 17/08/2026; números
  reapertados no mesmo dia): cada campanha tira um dado — normal
  10%/5%/85% (um/dois/ninguém); vitória no último jogo 15%/5%/80%;
  derrota 5%/0%/95%; 2 semanas após título ou acesso 40%/20%/40%;
  2 semanas após rebaixamento 0%/0%/100%. R$ 5 por novato; limite
  duro é a vaga da sede (50/90/150/200/500). A base da praça segue
  sendo o portão.
- **Prestígio na régua de 0 a 100** (17/08/2026): vitória rende no
  máximo +10 e derrota tira no máximo −10 — o teto negativo só com
  prejuízo grande de feridos e presos. Acabou o +30 por briga comum.
- **Ranking de torcidas** (17/08/2026): tela própria no menu. Pontos =
  (membros + prestígio×2) × média de força e defesa dos membros. O
  cabeçalho mostra #posição ao lado do nome e as médias de moral,
  ataque e defesa ao lado do prestígio.
- **Baixa nossa tira o rival de circulação** (conferência do dono,
  18/08/2026): os feridos e presos que a NOSSA briga causa no rival
  agora entram nos mesmos lotes das brigas entre IAs — ferido 30
  dias fora, preso de 15 a 90 — descontando dos disponíveis, do
  ranking e das brigas do mundo na hora. Antes a mensagem contava
  81 feridos e o efetivo deles seguia inteiro; o único efeito era um
  corte permanente de 40% dos caídos no ataque vencido, que saiu
  junto (a baixa temporária de verdade substitui o desconto seco).
- **Aniversários** (textos do dono, 18/08/2026): a fonte só guarda o
  ANO de fundação, então o dia e o mês nascem do hash do id — cada
  torcida e cada clube fazem aniversário na mesma data em toda
  partida. Dez dias antes do aniversário de uma ALIADA — só de
  aliada: quem a Diplomacia rotula Aliado ou Irmandade (relação
  viva ≥ 20) ou irmã de clube; a Garra chamando a TUF não faz
  sentido (correção do dono, 18/08/2026) —, ela convida ("Fala
  irmão, dia {data} comemoramos {idade} anos de história. A
  presença de vocês seria uma honra pra gente."): ir
  custa R$ 2.000 e rende +3 de relação (e conta como gesto na
  convivência); não ir tira −3 de relação e −2 de prestígio na
  régua de 0-100 (régua do dono, 18/08/2026 — furar aniversário
  de aliado queima na rua). Dez dias antes do NOSSO aniversário
  o diretor pergunta a festa — grande: R$ 20.000, potencial de
  R$ 20-40 mil, +2 de moral; simples: R$ 5.000, potencial de
  R$ 4-8 mil, +1; nada: −2 de moral. Dez dias antes do aniversário
  do CLUBE, a mesma pergunta — grande: R$ 10.000, potencial de
  R$ 10-20 mil, +2; simples: R$ 3.000, potencial de R$ 2-5 mil,
  +1; nada: −2. O custo e a moral saem na decisão; a receita sai no
  dia da festa, com a mensagem do rendimento. E o mundo também se
  convida (18/08/2026): no aniversário de uma torcida da IA, ela
  chama o próprio círculo — na régua estrita do dono, a mesma do
  nosso convite: só aliada de verdade (relação viva ≥ 20) ou irmã
  de clube; neutra da praça ficou de fora. Cada convidada aceita (R$ 2.000 do caixa dela, +3 de
  relação entre as duas) ou recusa (−3), com chance de ir crescendo
  com a relação — e quebrada não vai. Rival não recebe convite. Nós
  ficamos de fora desse sorteio: o convite pra gente chega pelo
  feed, com decisão nossa.
- **O bar do rival dá sopa** (texto do dono, 18/08/2026): em torno
  de 15 vezes no ano — sorteio por hash, ~29% das semanas, em dia
  comum —, um diretor aponta o bar de um rival DA CIDADE (relação
  ≤ −15, bar mapeado na praça): "Chefe, o bar da {rival} no
  {bairro} tá de porta aberta e gaveta cheia. Bora quebrar o
  balcão?". Atacar abre a mesma cena do ataque manual — com o
  mesmo limite de um bonde por semana; recusar não custa nada.
- **O extrato respira** (decisão do dono, 18/08/2026): bar, loja,
  subsede e festa mexem no caixa na hora, mas não escrevem mais uma
  linha por semana/por festa em Transações — no fim do mês entram
  três linhas consolidadas: "Comércio — receitas do mês", "Comércio
  — manutenção e insumos do mês" e "Festas na sede — N no mês"
  (líquido). O relatório mensal continua detalhado por rótulo, e a
  soma consolidada bate no centavo com o que entrou aos poucos. E
  enquanto o mês corre, a tela de Transações mostra no topo, em
  linha esmaecida, o acumulado do mês corrente ("já no caixa · a
  linha fecha no fim do mês") — informação nenhuma some; a lista
  passou a exibir os 200 lançamentos guardados, não só 60.
- **Professor de MMA** (pedido do dono, 18/08/2026): contratado no
  Financeiro → Patrimônio, sem custo de entrada — R$ 2.000 fixos
  por mês, cobrados no fechamento (linha própria no extrato e na
  tabela de estrutura). Enquanto estiver contratado, a evolução de
  força e defesa no treino DOBRA (0,0-0,6 de fração por sessão em
  vez de 0,0-0,3); o painel de treino mostra a régua nova. Dá pra
  DISPENSAR a qualquer momento (18/08/2026), sem multa: o treino
  volta ao normal e a mensalidade para de cobrar no próximo
  fechamento.
- **A provocação do rival** (pedido do dono, 18/08/2026): toda
  briga NOSSA concluída puxa, logo depois da mensagem do confronto,
  um recado do outro lado — voz "Na rua", assinado pela torcida.
  Textos aprovados pelo dono (18/08/2026). Se ELES venceram,
  deboche: "Anota a placa aí, teu terror tem nome!" / "Correram
  igual galinha, cadê vocês? Ninguém sabe ninguém viu." / "Contamos
  os que correram: faltou dedo pra contar. Fica em casa da
  próxima." Se PERDERAM, promessa de volta: "Aproveita, porque isso
  não fica assim. Nosso bonde volta pesado." / "Fica tranquilo que
  a cobrança vem cara!" / "Riram hoje, choram depois. O revide é
  pesado." Só texto — nenhum efeito de indicador.
- **A situação financeira pesa no ranking** (tabela do dono,
  18/08/2026): coluna própria com o rótulo do saldo atual de cada
  torcida, e o rótulo multiplica os pontos — Endividado (abaixo de
  −R$ 10.000) ×0,6 · Muito ruim (−10.000 a 0) ×0,8 · Pobre (até
  10.000) ×1,0 · Estável (até 20.000) ×1,2 · Bem financeiramente
  (até 40.000) ×1,4 · Rico (acima de 40.000) ×1,6. O título da
  célula mostra o saldo exato e o multiplicador.
- **Partida ao vivo** (17/08/2026): no dia do nosso jogo chega a
  mensagem com o botão INICIAR PARTIDA; clicado, o cartão vira uma
  barra de minutos (2' de jogo por segundo) e os gols do resultado —
  com a etapa na frase (reformulação do dono, 18/08/2026: "pela 3ª
  rodada da Copa do Nordeste" nos grupos; "pela semifinal (ida)",
  "pelas quartas", "pela final" no mata-mata), a posição dos dois na
  tabela e o estádio no texto de abertura —
  já simulado, mas escondido — saem conforme o tempo avança, a maior
  parte dos 30 aos 45 e dos 75 aos 90. Como é decisão, o relógio do
  feed fica preso até o apito final: o placar e o resumo da rodada só
  dropam depois, então nada vaza o resultado. A barra tem botão de
  pause (vira play; a barra de espaço também pausa e solta) e botão
  de velocidade 1×/2×/4× — o padrão é 4×.
- **Expediente presta contas** (17/08/2026): turno que não rodou
  também entra no "Últimos turnos" — festa sem caixa ("custa R$ 700"),
  dia de jogo do clube e dia de caravana aparecem esmaecidos com o
  motivo. O dinheiro sempre esteve certo; o que faltava era o registro
  do que não aconteceu.
- **Convivência** (17/08/2026): mês sem hostilidade entre nós e uma
  torcida melhora a relação em +1; dois meses sem nenhuma ajuda
  (escolta, recepção, reunião) pioram em −1. Cada briga e cada ajuda
  zeram o próprio relógio.
- **Chaveamento olímpico** (17/08/2026): saindo dos grupos, o
  cruzamento é fixo pela classificação — dois grupos (Copa do
  Nordeste; Série D par a par): 1ºA×4ºB, 2ºB×3ºA, 1ºB×4ºA, 2ºA×3ºB;
  grupo único: 1º×4º e 2º×3º. Dali em diante a chave anda sozinha
  (V1×V2, V3×V4), sem re-sorteio por força.
- **Guerra nasce acordada** (17/08/2026): na cena do encontro ninguém
  é da casa de guarda — o bonde rival marcha pro nosso ponto, como na
  treta. (Nas defesas o gatilho da casa continua valendo.)
- **Moral fora da briga** (17/08/2026): dano, velocidade e a decisão de
  revidar não olham mais pra moral — o multiplicador criava bola de
  neve e briga pareada virava varrida. Dano é força contra defesa.
- **Pedra e bomba nossas são sempre manuais** (17/08/2026): braço
  automático só do lado da IA. Treta marcada é mano a mano — sem
  pedra, sem bomba, de lado nenhum.
- **O disco veste a camisa** (pedido do dono, 18/08/2026): o disco
  do membro carrega TODAS as cores da torcida — e como a fonte de
  muitas é curta (a TUF vinha só com branco e azul), a paleta se
  completa com as cores do clube, filtrando tons quase iguais. Com
  três cores: base na primária e DUAS BORDAS — anel de fora na
  secundária, anel de dentro na terciária (régua do dono, 18/08,
  substituindo as listras). Com duas: uma borda na secundária. Com
  uma: sólido. O miolo escuro saiu de todas, e o miolo claro
  genérico que dava "cor de time nenhum" só sobrevive na bancada.
  E o bar é ENDEREÇO, não torcida (correção do dono, 18/08/2026):
  atacando o bar da Falange Coral, quem desce a defender é a
  Falange Coral, com as cores e o nome dela — na cena e no registro
  do confronto; "Bar da Falange Coral" não vira mais torcida.
- **Bomba em TODO confronto** (régua do dono, 18/08/2026 — antes só
  rua e praça): o estoque inteiro de bombas está na mochila em
  qualquer cena — rua, praça, arredores, bar, sede, CT —, planejada
  ou não; o rival segue trazendo a metade. A ÚNICA exceção é a treta
  5×5/7×7/10×10, que é mano a mano e continua sem arma nenhuma.
- **A consequência fala a régua do dono** (correção de 18/08/2026):
  a linha embaixo da mensagem de confronto mostrava o delta interno
  do indicador (0-20) — "Prestígio nosso +0,6" onde o jogador esperava
  +3. Agora todo prestígio nas linhas de consequência sai na régua de
  0 a 100, como o livro de Moral & Prestígio e o cabeçalho já faziam.
- **Relatório do olheiro em tabela** (17/08/2026): uma linha por jogo —
  competição, dia e o confronto com a cor de cada clube na esquerda;
  as torcidas do jogo com cor e estimativa na direita.
- **O mundo vive como a gente** (decisão do dono, 18/08/2026): as
  mecânicas do jogador — menos o olheiro — replicadas pras 138.
  Cada torcida IA tem o próprio calendário do trimestre (2 a 4
  tretas marcadas de 5×5/7×7/10×10 e 1 a 2 ataques ao bar dela, com
  a régua da nanica valendo no bar e o saque de 60 por cabeça + 22%
  do caixa quando o dono perde); relação fervendo (≤ −55) traz
  ataque-surpresa em dia comum, na mesma curva de chance nossa;
  torcida que viaja pro jogo pode ser emboscada por rival da rota; e
  quem visita cidade de aliado pode ter o anfitrião descendo junto —
  a escolta do mundo, com baixas e prestígio pro anfitrião que
  vence. Cada uma compõe um Expediente da Sede de 3 turnos (recrutar
  e, nas grandes, festa) e recruta com o MESMO dado do dono, regime
  por resultado do clube, janela de título/acesso (40/20) e regime
  seco de rebaixamento. A perda de membros ficou idêntica à nossa:
  vermelho derruba moral (−1/semana), ninguém debanda — membro só
  sai ferido ou preso, e volta. O sorteio antigo de 18%/semana saiu.
  Registro de tudo na aba Brigas (agora com teto de 300).
- **Festa sem moral** (17/08/2026): a festa na sede virou só receita
  de ingresso e bebida — o +0,8 de moral por festa rodava todo dia
  pelo expediente e saturava o indicador em dias. Moral agora vem de
  título, acesso, briga e caixa, não de churrasco.
- **Ônibus da torcida** (17/08/2026; régua do rateio em 18/08): R$
  100.000 no Patrimônio. Combustível e manutenção de R$ 1.500 no fim
  de cada mês, e 1% de chance por mês de uma manutenção séria de R$
  15.000. Em troca, a DESPESA da caravana de estrada morre — mas
  quem embarca continua pagando o rateio, e com a estrada de graça
  esse rateio entra no caixa como RECEITA da viagem. A rota de avião
  continua paga do jeito de sempre.
- **Investir no clube tem aba própria** (17/08/2026): o reforço de
  elenco morava escondido dentro de Financeiro → Patrimônio e
  ninguém achava. Virou a subaba Elenco do Financeiro, com a mesma
  conta de sempre, teto 100. Em 18/08/2026 o dono cortou a tabela
  pra 40% do original: o ponto vai de R$ 20 mil (força até 10) a
  R$ 320 mil (força 91–100).
- **Treino é rotina da diretoria** (17/08/2026): o botão "Treinar e
  avançar o dia" saiu. Todo virar de dia a fila é sorteada de novo —
  prioridade pra quem ainda não bateu o teto do cargo, sorteio no
  resto — e treina sozinha, dentro das vagas da sede (2/4/8/12/20).
  O ganho por sessão segue 0,0–0,3 de fração em força e defesa, +1
  XP, teto do cargo (+2 de veterano). Treinar também saiu do
  expediente (seria treino em dobro) e da escalação à mão.
- **Treta marcada pode ser com nanica** (17/08/2026): o sorteio da
  rival da treta cobre TODAS as hostis da praça, da maior rival à
  nanica do bairro — treta é de efetivo idêntico, tamanho não pesa.
  O ataque ao bar continua vindo da maior rival declarada.
- **Prestígio da escolta é do aliado** (17/08/2026): quando o aliado
  hospedado é atacado na nossa cidade e entramos na briga, o
  prestígio da noite vai pra torcida DELE — a briga era dele, nós só
  fomos junto. Pra nós ficam a relação (+10 na hora) e a ajuda no
  relógio da convivência.
- **Ataque de nanica não existe** (17/08/2026): ataque sofrido só vem de
  torcida com pelo menos metade do nosso efetivo (na estrada, a régua é
  a caravana embarcada) — a cena que abria e acabava com o atacante
  correndo por minoria não acontece mais. O contrário segue valendo:
  efetivo muito maior que o nosso ataca à vontade. Quem vem traz a
  turma que o serviço pede: no mínimo os 30% de sempre, até ~90% do
  nosso bonde na cena, nunca mais de 70% da torcida dele.
- **Zoom pela rodinha nas cenas de briga** (18/08/2026): rolar pra
  cima aproxima a cena (de 1× até 4×) e a câmera passa a seguir o
  disco do jogador, sem deixar a vista passar da borda da cena;
  rolar pra baixo volta até a cena inteira de sempre. A rodinha em
  cima da cena não rola mais a página.
- **O clima do estádio na partida ao vivo** (pedido do dono,
  19/08/2026): abaixo da barra de minutos, um cartão mostra o clima —
  TRANQUILO, ESQUENTANDO, TENSO. Ele sobe sozinho conforme o jogo
  anda, com chance POR MINUTO ditada pela pior relação entre as
  torcidas presentes do OUTRO clube: maior rival 3%, rival quente 2%,
  rival 1%, neutro 0,3%. Aliado do outro clube na arquibancada segura
  o clima em tranquilo o jogo inteiro. As irmãs do NOSSO clube não
  entram na conta — vão a todo jogo e travariam o recurso pra sempre.
  Medido: contra maior rival, o clima sobe em ~19 de 20 jogos e chega
  a TENSO em ~15 de 20.
- **Nascimento lado a lado** (pedido do dono, 19/08/2026): o bonde
  não nasce mais numa nuvem redonda sorteada — nasce em GRADE, como a
  formação Quadrado (botão 3): colunas pela raiz do efetivo, passo de
  18 px, bloco centrado no ponto do spawn. Cada um reserva o próprio
  quadrado de 18 px, então ninguém nasce em cima de ninguém; quem não
  couber (beco, degrau de arquibancada) é reencostado no vão livre
  mais próximo, como sempre foi. Medido: vizinho mais próximo a 16 px,
  que é disco encostado em disco.
- **A bancada de cenas voltou** (pedido do dono, 19/08/2026):
  `arredores.html` ganhou as oito cenas novas (três tretas, duas
  emboscadas, três arquibancadas) nas abas, e voltou a montar — ela
  quebrava desde que a ficha do rival passou a vir de `TO.membros`,
  que a página não carregava. Os estádios abrem lá com os setores
  ligados, pra planta ser a mesma que se vai editar. F2 continua sendo
  o editor e o Exportar continua devolvendo o remendo pra colar em
  `dados/cenas_editadas.js`.
- **A briga na arquibancada** (imagens e tabela do dono, 19/08/2026):
  clima TENSO encerra a partida no placar já simulado e abre a cena
  do estádio da capacidade, com TODAS as torcidas presentes, cada uma
  no setor do seu ESCALÃO — 1º escalão é a maior torcida do clube na
  praça, 2º a seguinte, e a ordem vira quando uma passa a outra. Os
  efetivos são os da linha de presença da mensagem; sobrando torcida
  além dos setores, as menores se juntam no último. Setores por
  capacidade (imagens do dono): 10 mil = 3 mandante × 2 visitante,
  20 mil = 3 × 3, 40 mil = 2 × 3, com PM e divisórias entre eles. O
  gramado é bloqueado — a briga é na bancada — e o botão de saída é o
  túnel do próprio setor. As cenas `estadio-*` deixaram de ser os
  arredores: a guerra do dia de jogo voltou pra cena `arredores`.
  O fecho usa a tabela do dono, pela diferença de efetivo: vitória em
  menor número (11+ a menos) Prestígio +3 · Moral −2; parelho (±10)
  +2 · +1; com 11+ a mais só +1. Derrota em menor número −1; parelho
  −2 · Moral −1; com 11+ a mais −3 · Moral −2. A RELAÇÃO com o rival
  cai pela faixa de efetivo, ganhando ou perdendo (preço do dono,
  19/08/2026): −3 em menor número, −2 parelho, −1 com 11+ a mais.
- **Preços das recusas e da derrota na treta** (dono, 19/08/2026):
  ficar de fora da treta marcada custa −1 de prestígio; deixar o bar
  do rival quieto custa −1 de prestígio e −1 de moral; deixar o
  assalto quieto segue de graça; PERDER a treta custa −1 de prestígio
  (não mais o espelho do −3/−4/−5) e −1 de moral pra cada membro que
  foi — vencer segue +3/+4/+5 e +2 de moral. A mesma régua vale pras
  tretas entre IAs. Turno vazio do expediente e a mensagem de guerra
  com botão único ficam como estão.
- **Aniversário na data de verdade** (correção do dono, 19/08/2026):
  a fonte das torcidas já guardava fundacaoDia/fundacaoMes (137 de
  140) e o código sorteava a data por hash — agora a data real manda
  (TUF: 17/02, convite 10 dias antes, 07/02), pra nós, pros convites
  e pras festas entre IAs. O hash fica só de reserva pra quem não tem
  a data: 3 torcidas (forca_azul, furia_independente_do_guarani,
  guerrilha_jovem) e os CLUBES — a fonte dos times só tem o ano; o
  Fortaleza ganhou 18/10 (palavra do dono), o resto espera a lista.
- **As dicas da diretoria** (pedido do dono, 19/08/2026): 40 dicas
  explicando as regras do jogo, caindo duas por mês no feed (semana
  ímpar, dia 2), em ordem de importância pra quem chega, e
  recomeçando quando acabam. Kind 'dica', voz da diretoria, números
  sempre na régua das telas (prestígio 0–100 etc.). Nenhuma trava o
  relógio. Junto: toda opção das telas de Ideologia e do Expediente
  ganhou a explicação do efeito no próprio texto (a da ideologia
  troca com a seleção), e os botões de decisão que mexem em
  indicador ganharam nota de efeito (defesa/fugir, escolta
  entrar/ficar de fora com o −15, treta, aniversários — que já
  tinham).
- **O lote de cenas de 19/08** (fotos do dono, 19/08/2026): nove fotos
  aéreas viraram cena jogável, pelo importador de foto (máscara de
  caminhabilidade por cor + conectividade; ganhou chão de terra, piso
  claro estourado e engorda pra anel fino). As TRETAS têm palco
  próprio por tamanho: 5x5 no beco, 7x7 no pátio do galpão, 10x10 no
  campo de terra murado. A EMBOSCADA da caravana na estrada abre por
  sorteio um dos dois cenários: o pátio do posto ou a pista fechada
  com o ônibus. A frente do CT virou a foto do portão. E os ARREDORES
  têm três estádios pela capacidade do mandante nos dados: até 15 mil
  o pequeno (briga na arquibancada e no terreirão), até 32 mil o
  médio (anel de rua em volta), acima o gigante (laterais vivas,
  portões nas duas ruas do lado). As cenas de estádio se comportam
  como os arredores: ordem de portão, PM, noite que começa calma.
  Ajuste fino de máscara/marcadores fica no editor (F2) +
  cenas_editadas.js, como sempre.
- **O Financeiro delas é o nosso** (18/08/2026): tudo que o jogador
  compra no Financeiro as outras torcidas compram com o caixa delas.
  Já compravam sede, bar, loja, subsede, ampliações, fábrica e
  elenco; entraram o ÔNIBUS (R$ 100 mil na escada de compras, depois
  da fábrica; manutenção mensal na fatia semanal; caravana delas 30%
  maior), o PROFESSOR DE MMA (contrata com saldo folgado e caixa >
  25 mil; R$ 2.000/mês; +1 de força e defesa na ficha gerada — cena
  e média do ranking; duas semanas no vermelho dispensam) e as
  BOMBAS (paiol começa em 10; repõem lote de 5 por R$ 600/semana; na
  cena o rival continua limitado à metade das nossas, mas nunca joga
  mais do que tem no paiol, e o que joga é descontado). Perfil sem
  paiol declarado (bancada) segue a regra antiga.
- **Ficha sem bônus de poder** (18/08/2026): o `poder` da fonte dava
  até +3 de força e defesa por cabeça (poder÷250×3) e cravava as
  gigantes acima de todas por decreto. Saiu das três portas: média
  do ranking (mediaDeFichaGerada), fichas dos rivais nas cenas e os
  nossos membros iniciais. A ficha agora sai só do cargo; no tamanho
  de fonte as médias empatam (~5,6–5,7 pra todas). O que ainda
  separa as torcidas na régua é o crescimento: recruta entra como
  novato e dilui a média de quem cresce, e o teto de 250 da conta
  segura a média das gigantes — isso ficou como está.
- **Nossa partida com a linha de presença** (18/08/2026): a mensagem
  do jogo ganhou "Mandante: Gaviões 250 · Camisa 12 54. Visitante:
  Torcida Jovem 10." — quantos membros cada torcida dos dois clubes
  põe no estádio. Jogo na nossa praça usa a MESMA conta da rua
  (naRuaEm, com escolta e caravana); jogo fora refaz com as mesmas
  réguas: 60% do efetivo pra torcida da casa, caravana pra quem
  viaja (mínimo 5), e a nossa saída é a do planejamento. Lado sem
  ninguém diz "ninguém".
- **Placar da cena com nome das torcidas** (18/08/2026): o quadro de
  "de pé" na briga fala o nome dos dois bondes (ex.: Gaviões ×
  Dragões da Real) em vez de MANDANTE/VISITANTE — no ataque a bar,
  o defensor sem bonde herda o nome da torcida dona. Só a bancada de
  testes, que monta cena sem identidade, mantém o rótulo antigo.
- **Cartaz do fim da noite em uma coluna** (18/08/2026): os dados do
  cartaz (feridos, armas, dinheiro) liam fora de ordem na grade de
  duas colunas — o valor da esquerda parecia pertencer ao rótulo da
  direita. Agora é uma coluna só, sempre de cima pra baixo.
- **Tremor do contato 70% menor** (18/08/2026): o boneco atingido
  sacudia até ±3px por eixo a cada quadro e a briga virava chiado —
  pior com o zoom. A sacudida desenhada caiu pra ±0,9px (corte de
  70%); o acúmulo e o decaimento do tremor por golpe seguem iguais,
  só a amplitude visual encolheu.

- **A grade cerca o visitante por todos os lados** (19/08/2026): a
  lógica do gradil na arquibancada é uma só — o setor visitante fica
  cercado, e não existe brecha por onde um disco atravesse sem
  derrubar módulo. As divisórias desenhadas no rascunho (uma solta no
  20 mil, duas tortas no 40 mil) saíram; no lugar entrou um cerco
  traçado em cima da máscara pintada pelo dono: das travessias
  possíveis entre o setor visitante e o resto da bancada, cada uma
  ganha o seu módulo de grade ancorado 18px DENTRO da parede dos dois
  lados, pra não sobrar fresta entre a grade e a máscara. Deu 1 grade
  no estádio de 10 mil, 6 no de 20 mil e 8 no de 40 mil. Conferido na
  malha do jogo: nenhuma rota do visitante até setor mandante sem
  romper grade, e o túnel de cada setor continua alcançável.
- **Na arquibancada se briga** (19/08/2026): o rival corria antes de
  encostar e a cena terminava 0×0. Três coisas mudaram, e só na
  bancada. (1) Não se corre por ver o tamanho do outro: dentro do
  curral não há pra onde ir, então a fuga por minoria não vale ali.
  (2) O preço de sangue dobra — corre-se com 50% do setor no chão,
  contra os 30% da rua. (3) Quem não enxerga inimigo por perto marcha
  pro setor rival mais próximo que ainda tem gente de pé, e o gradil
  no caminho vira alvo (o campo de rota já dá a volta enquanto houver
  volta). E a PM lá não cancela a briga: ela está DENTRO do setor,
  todo mundo nasce colado nela e o alerta batia 100 antes do primeiro
  soco — continua carregando e prendendo, mas o rival não recua por
  causa dela. Medido nos três estádios: contato por volta dos 8s,
  baixas dos dois lados, e debandada só depois dos 50%.

- **A mão do dono marca grade, posto de PM, boca de fuga e a
  entrada da tropa** (19/08/2026): o editor (F2) só movia o que já
  existia — dava pra arrastar a ponta de uma grade, não pra criar
  uma. Agora a barra tem seis ferramentas: pincel, marcadores,
  **grade nova** (aperta e arrasta; os módulos saem do comprimento, a
  22px por módulo, e dois botões acertam módulos e espessura),
  **posto de PM**, **boca de fuga** e **entrada da tropa**. Botão
  direito (ou Delete) apaga o que estiver sob o cursor — menos bonde
  e portão, que são a identidade da cena e saem só do arquivo. Tudo
  sai no mesmo remendo que se cola em `cenas_editadas.js`.
- **Boca de fuga marcada à mão manda na lida da máscara**
  (19/08/2026): as bocas por onde se some sempre foram lidas da
  própria máscara (todo chão que encosta na borda da mancha andável).
  Continua assim por padrão — é o que garante que a fuga cai em cima
  de rua mesmo depois de repintar a planta. Mas quando a cena declara
  `fugas`, a mão manda e o automático nem roda. Como boca sem rota é
  bonde correndo pra parede a noite toda, o editor confere na hora
  (campo até a boca, com as grades de pé) e acusa qual bonde não
  chega — foi assim que se viu que uma boca dentro do curral do
  visitante deixava os três escalões mandantes sem saída.
- **A tropa de choque entra por onde a cena marcar** (19/08/2026):
  sem marcador ela continua entrando pelo buraco que abriram na
  grade, que é de onde a cena vem sozinha. Com `tropaEm` marcado no
  editor, ela entra sempre dali — cena com portão de serviço, túnel
  ou boca de rua tem lugar certo pra caminhão de choque parar, e
  nascer no meio da briga é teletransporte.
- **Os ouvintes de teclado e mouse ligam uma vez só** (19/08/2026):
  `montar` roda a cada cena aberta e os ouvintes iam se empilhando no
  mesmo canvas e na mesma janela. Da SEGUNDA briga da sessão em
  diante, um R ligava e desligava o recuo no mesmo aperto, um Q
  jogava duas pedras e a rodinha dava zoom dobrado. Apareceu porque o
  F2 abria e fechava o editor no mesmo toque na bancada.

- **Os três estádios com as grades da mão do dono** (20/08/2026): as
  máscaras e as divisórias dos três estádios passaram a ser as que o
  dono traçou no F2, no lugar do cerco automático. Conferido na malha
  do corpo, com as grades de pé: nenhum caminho do setor visitante até
  setor mandante em nenhum dos três, e todo túnel alcançável. Duas
  coisas apareceram na conferência e ficaram registradas: (1) no de 20
  mil, `cerca_3` e `cerca_4` cortam o anel MANDANTE, então o 2º e o 3º
  escalão da casa não chegam ao túnel deles — na arquibancada isso não
  é defeito (o túnel é objetivo do líder, quem debanda some pelas bocas
  da máscara e quem está de pé marcha pro rival), e por isso o aviso de
  PORTÃO SELADO passou a valer só pro setor do jogador fora dos
  arredores; (2) no de 40 mil a passagem entre os dois anéis estava
  mais estreita que um disco — o pé passava, o corpo não —, e o setor
  visitante3 ficava numa ilha de 3.666 células sem rota pra lugar
  nenhum. A passagem que o dono já tinha pintado foi alargada no
  mínimo (três linhas da máscara, y 744–776, entre 356,748 e 340,764) e
  a bancada voltou a ser uma peça só.

- **Um padrão só de disco, e a listra fina** (20/08/2026): o disco
  vestia a camisa com anel grosso — 2 px num raio de 7, e mais 2 pra
  quem tinha terceira cor —, então a primária sobrava como um miolo de
  3 px e o disco lia como alvo de tiro. Pior: a grossura mudava com o
  número de cores da torcida (2,5 px pra quem tem duas, dois anéis de
  2 px pra quem tem três), e como cada cena traz torcidas diferentes,
  cada cena parecia ter um disco diferente. Agora a régua é uma só, em
  toda cena: base na primária e listra de 20% do raio (piso de 1,2 px)
  na borda — uma listra pra duas cores, duas pra três, sempre com a mesma
  espessura. O que muda de uma torcida pra outra é quantas listras,
  nunca a grossura, e a cor que a torcida usa pra se chamar é a que
  toma o disco.
- **Quem defende sempre tem dono** (20/08/2026): no bar quem defende é
  a torcida dona dele e as cores vêm dela; no CT não existe torcida do
  outro lado, e os dez seguranças caíam na cor genérica do LADO —
  vermelho ou azul, cor de time nenhum. Era a única cena com disco que
  não era de ninguém. Passaram a ter farda: chumbo com faixa de
  colete, que não é cor de torcida nenhuma e por isso nunca se confunde
  com a nossa. Conferido nas cenas que o jogo abre (CT, bar da rival,
  treta marcada e dia de jogo): zero discos sem cor.

- **A mesma camisa em toda cena** (20/08/2026): o dono viu a TUF com
  uma listra só em algumas cenas e duas em outras. A paleta da torcida
  não muda — `coresDaTorcida` devolve o mesmo branco/azul/vermelho pela
  torcida e pela ficha —, quem cortava era `montarEncontro`, em
  praca.js: o encontro dos jogos da praça (concentração, pista e
  arredores) copiava só `cor` e `cor2` do bonde, e a terceira ficava
  pra trás. Uma torcida tricolor entrava naquelas cenas com duas cores.
  Agora as três atravessam. Provado com a régua invertida: com o
  conserto, a TUF veste #FFFFFF/#1A40CC/#C8102E nas cinco cenas
  (CT, bar da rival, treta, jogo da praça e arquibancada); sem ele, o
  teste acusa #FFFFFF/#1A40CC no jogo da praça e passa nas outras
  quatro — exatamente o que o dono estava vendo.

- **A emboscada tinha os papéis trocados** (20/08/2026): na estrada
  quem nascia no ônibus, no meio da tela, era o ATACANTE, e a nossa
  caravana nascia numa das pontas — os dois spawns dizem "ELES, PELA
  PISTA" e "NÓS, NO ÔNIBUS" e o código mandava o contrário (medido: 38
  nossos em 'ELES, DE UM LADO', 14 deles em 'NÓS, NO ÔNIBUS'). Vinha
  de quando a emboscada tomava emprestada a rua de periferia, onde
  `mandante` era o lado de casa. Agora o atacado é sempre o
  `visitante`, nas duas cenas de ataque a nós (bar e estrada).
- **Emboscada: o atacado em volta do ônibus, o atacante nas duas
  pontas** (régua do dono, 20/08/2026): as cenas de emboscada marcam
  dois spawns por lado justamente pra isso, mas um bonde tomava um
  spawn só e o outro ficava vazio — metade da emboscada não existia.
  A cena agora pede `espalharBonde` e o bonde se reparte entre os
  pontos do seu lado. E ali não se corre de ver o tamanho do outro
  (`semFugaPorMinoria`): quem ataca veio pra isso e a caravana não tem
  pra onde ir; corre-se de sangue, no preço de rua (30% no chão). Por
  fim, o atacante MARCHA (`marchaAoInimigo`): sem isso ele andava pro
  próprio fim de pista e a emboscada acabava sem um soco. Medido:
  atacante grande (75×39) e pequeno (14×39), nas duas cenas, sempre
  com caídos dos dois lados e sem ninguém virar as costas na largada.

- **A arquibancada esquenta mais** (régua do dono, 20/08/2026): a
  chance por minuto de o clima subir um degrau passou a 3,5% pro
  maior rival, 3,0% pro rival quente, 2,0% pro rival e 1,0% pro
  neutro (era 3,0 / 2,0 / 1,0 / 0,3). Como TENSO precisa de dois
  degraus em 90 minutos, na prática a briga na arquibancada abre em
  83% dos clássicos de ódio, 76% dos quentes, 54% dos jogos contra
  rival e 23% dos neutros. Medido em 20 partidas contra o maior
  rival: subiu em 19, ficou tenso em 17. Aliado do outro clube na
  casa continua segurando o clima em tranquilo o jogo inteiro.

- **O dia de jogo virou itinerário** (régua do dono, 20/08/2026): o
  dia deixou de ser cartões soltos no feed e virou uma LINHA VERTICAL
  de paradas, de baixo pra cima, cada bolinha um ponto do dia. Ela
  anda sozinha e só para em dois lugares: parada com recado, que
  espera resposta, e o jogo, que segura a linha até o apito final.
  Parada em que não aconteceu nada não fala — a bolinha acende, apaga
  e a linha segue. Em casa: concentração, pista, arredores, o jogo,
  arredores, pista. Fora: as praças da rota da caravana na ida, o
  bloco do estádio, e as praças de novo na volta.
  · **Três dias.** Jogo fora ocupa véspera, dia do jogo e dia
    seguinte — não é invenção da tela, é o que
    `financeiro.diasDaViagem` já trancava no calendário. A linha marca
    a virada de cada dia, e as horas saem da hora do jogo
    (`proximoJogo.hora`) com 7h30 por trecho de rodovia.
  · **O que aparece em cada parada** sai do que o jogo já decidia: a
    investida que o PLANEJAMENTO marcou (que continua sendo decidido
    antes do dia, na tela dele) e o ataque que a gente sofre. Uma
    parada pode ter os dois — apanhar e revidar no mesmo ponto —, e aí
    são dois cartões, um de cada vez.
  · **A cena é a mesma.** O itinerário não inventa briga nem
    consequência: chama `abrirGuerra` e `abrirAtaqueAoBar`, as cenas
    abrem POR CIMA da linha e o fecho é o de sempre. Não descer usa a
    mesma porta do feed (`feed.naoDesceu`), com a mesma conta.
  · **Emboscada praça a praça.** Cada cidade da rota tem a sua chance,
    de uma torcida DAQUELA cidade; na volta a chance é metade da ida.
    A emboscada única da viagem, marcada na véspera, saiu.
  · **O dia fica no feed** como registro, parada por parada.
- **Clima tenso PAUSA a partida, não encerra** (20/08/2026): quando a
  arquibancada se pega, o relógio do jogo trava onde está, a cena abre,
  e no fim dela a bola volta a rolar até os 90. Antes a partida era
  encerrada no primeiro soco e o placar congelava. Uma briga de
  arquibancada por jogo: depois dela a PM fica no setor, o clima cai
  pra "esquentando" e não sobe de novo.

- **A frota de ônibus abate a caravana** (20/08/2026): a régua do dono
  é a escada, não o "tem ou não tem". **1 ônibus tira 30% do custo da
  caravana, 2 tiram 60%, 3 deixam a caravana de graça.** O rateio dos
  torcedores continua sendo cobrado do mesmo jeito: com a frota
  completa, o que sobra do rateio vira RECEITA do dia, não despesa.
  · **A manutenção é por ônibus**: R$ 1.500 por mês cada um — 3 custam
    R$ 4.500 por mês —, fora os custos excepcionais de R$ 15.000, que
    cada ônibus pode ter por conta própria.
  · **O preço de compra não muda**: cada ônibus custa o mesmo do
    primeiro, e a garagem para no terceiro. A IA sobe a mesma escada.
  · Avião não tem desconto: ônibus não voa.
- **Duas colunas novas no ranking** (20/08/2026):
  · **Prédios** — quantos imóveis a torcida tem somados, num número só
    (1 sede + 2 bares + 2 lojas = 5). Subsede conta.
  · **Saldo** — o saldo de brigas DO ANO: vitórias menos derrotas
    (100 brigas com 60 vitórias mostram 20). Zera na virada do ano, e
    conta briga de todo mundo, nossa e delas.

- **Acabou o arquétipo das outras torcidas** (20/08/2026): a tabela
  que dava a cada torcida uma "personalidade" de gasto (agressiva,
  fanática, empresária, diplomática, tradicional) saiu. **Toda torcida
  do mundo gasta na mesma fila, nesta ordem:**
  1. Comprar loja · 2. Comprar bar · 3. Contratar professor de MMA ·
  4. Melhorar elenco · 5. Comprar ônibus · 6. Comprar subsede ·
  7. Comprar bombas (até 10) · 8. Evoluir bar · 9. Evoluir loja ·
  10. Evoluir subsede.
  · **E ela ESPERA.** Não pula pra um item barato da frente porque o de
    cima ainda não coube: com R$ 20.000 no caixa dava pra encher o
    paiol e contratar o professor, e ela não faz nem um nem outro
    porque a vez é da loja. Junta dinheiro até dar.
  · **Uma compra por semana**, e o preço é o preço: acabou também o
    colchão de reserva que cada arquétipo exigia.
  · **A sede não está na fila** porque não é preferência, é o que
    destrava: sobe quando o efetivo encosta no teto, ou quando é ela
    que impede o item da vez (loja não cabe em sede nível 1).
  · **A fábrica ficou pro fim**, depois da fila inteira cumprida — não
    está na régua do dono, e é onde o dinheiro que sobra vai parar.
  · **Evoluir subsede não existe** na tabela de preços (subsede só tem
    nível 1): o item fica na fila e passa direto.
  · **A vontade de brigar** (que também vinha do arquétipo) passou a
    sair da OUSADIA, que cada torcida já tinha desde que nasce. A
    escala foi calibrada pra manter a mesma média de ataques por mês.
- **O expediente da sede delas é sempre o mesmo** (20/08/2026):
  **recrutar, festa e reunião de diretoria**, todo dia, pra toda
  torcida. Sem sorteio.
  · A **reunião** faz o mesmo que a nossa: +4,2 de relação com o aliado
    mais próximo da praça delas, e precisa de dois diretores de pé. A
    mesa da diretoria delas NÃO mexe na relação conosco — a nossa
    continua vindo do que a gente faz.
  · A **festa** é turno de todo dia mas só sai quando paga a conta:
    R$ 700 de custo contra R$ 2,80–4,90 por cabeça empatam em ~180
    presentes. Sem esse piso, a vaquinha diária comia o caixa do mundo
    inteiro (a mediana das torcidas caiu de R$ 18.775 pra R$ 1.257 num
    ano de simulação) e a fila de compras nunca andava.
- **A festa custa por nível de sede** (20/08/2026): os R$ 700 fixos só
  fechavam a conta em sede grande — torcida de bairro fazia vaquinha e
  nunca festa. O preço passou a acompanhar o salão:

  | sede | lotação | custo | precisa de | ocupação |
  |------|---------|-------|------------|----------|
  | 1 | 50 | R$ 170 | 36 presentes | 72% |
  | 2 | 90 | R$ 300 | 63 presentes | 70% |
  | 3 | 150 | R$ 500 | 105 presentes | 70% |
  | 4 | 200 | R$ 700 | 146 presentes | 73% |
  | 5 | 500 | R$ 1.700 | 355 presentes | 71% |

  · A conta fecha sempre no mesmo ponto: com a sede ~70% cheia, até a
    noite fraca (R$ 4,80 por cabeça) paga o custo. **Sede nível 4
    continua nos R$ 700 de sempre** — o que mudou foi embaixo.
  · **Vale igual pra elas**: mesmo custo, mesma renda por cabeça
    (R$ 4,80–6,40) e a mesma conta de presentes, contando os
    disponíveis, porque ferido e preso não bebem. A taxa mais baixa que
    elas tinham (R$ 2,80–4,90) saiu.
  · Por isso o custo e o efeito da ação viraram função da torcida: a
    linha do expediente mostra o preço da NOSSA sede, não um fixo.
- **A sede é só destravadora, nunca preferência** (20/08/2026): a
  regra de "efetivo no teto compra sede antes de tudo" saiu. Torcida
  lotada com a loja ainda por comprar compra a LOJA — a fila do dono
  vem primeiro, sempre. O teto de gente sobe sozinho logo atrás,
  porque assim que a sede atual não comporta mais nenhum ponto é ela
  que a fila pede. Sem isso as ricas ficavam guardando R$ 200.000 pra
  uma sede que a fila não tinha pedido e o mundo não construía nada
  (1 ano: 2 lojas antes, 38 depois).
- **A variação do mês no ranking** (20/08/2026): membros, prestígio e
  força média mostram, num número menor à direita, o quanto aquilo
  andou desde a virada do mês — `Sangue Azul 34 (+1) 20 (−2) 3.8
  (+0,0)`. Sempre com sinal: parado é "(+0)", não é vazio. O mundo
  tira uma foto dos três números quando o mês vira, e a tela compara.

- **Garagem e sala de treino cabem na sede** (20/08/2026): ônibus e
  professor não são só dinheiro — precisam de onde guardar e onde
  treinar. **Sede nível 1 não comporta nenhum dos dois; do 2 cabe um,
  do 3 cabem dois, e o terceiro só na sede nível 5.** A régua é a mesma
  pros dois e pras duas mãos (nós e elas).

  | sede | ônibus | professores |
  |------|--------|-------------|
  | 1 | 0 | 0 |
  | 2 | 1 | 1 |
  | 3 | 2 | 2 |
  | 4 | 2 | 2 |
  | 5 | 3 | 3 |

  · Na fila delas, sala cheia não é fim de degrau: quem destrava é a
    SEDE, e é ela que a fila pede em seguida.
  · A conta guardada no cadastro delas é a que CABE — sem isso ficava
    professor fantasma, invisível na ficha e imune à demissão.
  · A tela mostra o motivo em vez de sumir com a opção: "a garagem da
    sede está cheia · cabe na sede nível 5".
- **A comissão técnica vira escada, como a garagem** (20/08/2026): não
  é mais "tem professor ou não tem". **Um professor faz o treino render
  +30% de força e defesa, dois +60% e três +100%** — o dobro só com a
  sala cheia. **Cada um custa R$ 2.000 por mês**, então três saem por
  R$ 6.000, cobrados no fechamento; ninguém paga entrada. Contrata e
  dispensa um por vez, no Financeiro → Patrimônio.
  · Vale igual pra elas, com a mesma folha na conta semanal.
  · Medido em janela curta (antes do teto de cargo saturar a ficha), a
    evolução real sai em **1,28× · 1,58× · 1,95×** — a escada nominal.
- **O professor é o primeiro da fila** (20/08/2026): treino é o que faz
  a torcida virar gente de briga, e ele vem antes do tijolo. Como não
  cobra entrada, o que a fila pede de cada contratação é caixa que
  aguente **três meses da folha nova** — R$ 6.000 pro primeiro,
  R$ 12.000 pro segundo, R$ 18.000 pro terceiro. O degrau enche até
  três, como o dos ônibus. Num ano de mundo simulado, 133 das 138 têm
  professor e 52 já montaram a comissão inteira; ninguém quebrou.
- **As outras torcidas treinam e promovem também** (20/08/2026), pelas
  MESMAS regras da nossa. Antes a ficha delas era conta congelada — a
  pirâmide da fonte e pronto —, então quem crescia só ganhava novato e
  a torcida ficava mais FRACA quanto mais crescia: 5,7 com 20 membros,
  3,5 com 250, e nunca passava disso.
  · Agora cada torcida tem **quadro vivo**: quantos em cada cargo, a
    força média de cada cargo e o XP rodado de cada cargo.
  · **Treino todo dia**, como o nosso: o mesmo passo de 0 a 0,3 por
    sessão, as mesmas vagas de treino por nível de sede (2 no nível 1,
    20 no 5) e a mesma escada de professores (+30%, +60%, +100%).
  · **Promoção uma vez por semana**, com as três exigências nossas:
    o XP (40, 100 e 300), a força (8, 12 e 18) e o dinheiro (grátis,
    R$ 1.000 e R$ 5.000). A Diretoria delas respeita o mesmo teto por
    nível de sede. Sobe um décimo do grupo apto por vez.
  · **A noite de briga rende XP pros dois lados**, na tabela da nossa
    (3 a 15 pela escala do bonde, ×1,5 pra quem ganha), sem diluir pelo
    efetivo — do nosso lado quem vai pra rua leva o XP inteiro, e é
    esse pessoal que sobe de cargo.
  · **A cena recebe a ficha treinada**, não a congelada: quem treinou e
    promoveu no mundo chega na briga com o que ganhou.
  · Medido, mesma torcida e mesmo ponto de partida (4,55): num ano ela
    chega a **8,2 sem professor e 10,1 com**. A nossa, sem professor e
    sem briga, chega a 9,4 — o mundo virou páreo.
- **Onde fica a promoção dos nossos** (20/08/2026): ela sempre esteve em
  Torcida → clicar no membro → **Ações → Promover**, e ninguém achava.
  A lista agora marca em ouro quem está **Pronto p/ promoção** e o
  cartão avisa quantos são, antes da lista — no fim de 250 linhas não
  adiantava nada.
  · **Por que ninguém achava mesmo** (descoberto em 21/08/2026): não era
    só o lugar. O modal nascia em `z-index:50` e o painel aberto está em
    52 — **toda janela aberta de dentro de um painel abria ATRÁS da
    página**. Clicar em Ações não mostrava nada. Corrigido: tela cheia
    passa pra 55, acima do painel e abaixo do aviso e da cena.
- **O perfil do membro é o lugar das ações** (decisão do dono,
  21/08/2026): **dois cliques no nome** na lista da Torcida abrem o
  perfil, e o que está pendente se resolve lá dentro — **pagar fiança**
  e **promover** —, sem o botão Ações, que saiu.
  · O bloco **Pendências** vem antes da ficha: quem abre o perfil de um
    preso quer soltar o cara, não ler a mensalidade dele. Cada pendência
    diz o preço e, quando não dá, o motivo.
  · O corpo se repinta sozinho depois de cada ação: o perfil fica
    aberto e já mostra o cargo novo ou o cara solto.
  · **Selecionar não repinta a lista.** Repintar a cada clique jogava o
    rolo de volta pro topo e o segundo clique caía noutra linha — só a
    marca da seleção troca de lugar agora.
  · A ficha ganhou **Situação**, **Idade** (com aviso de declínio),
    o **teto** ao lado de Força/Defesa e o **desgaste**, quando existe.

- **O QUE TIRA FICHA** (régua do dono, 20/08/2026): até aqui a ficha era
  catraca de mão única — treino somava e nada nunca subtraía, e ninguém
  nunca saía da torcida. Em vinte anos o mundo inteiro encostava em 18,1
  de força média e a coluna do ranking morria. Agora a rua cobra:

  · **Sequela de briga** — 15% dos feridos ficam com marca de −0,2 a
    −0,5 de força E defesa.
  · **A cadeia enferruja**, pela pena CUMPRIDA (não a que o juiz deu):
    até 30 dias cobra 0,5; até 60, 1; até 89, 1,5; de 90 em diante, 2.
  · **Ferrugem da paz** — a cada 20 dias sem briga, −0,2 em todo mundo.
    Entra no mesmo relógio que já derrubava prestígio e moral.
  · **Idade** — todo membro nasce com 16 a 45 anos. Dos **35** em diante
    a virada do ano cobra **0,6** de força e defesa. Aos **46** ele
    pendura a bandeira: sai da lista de membros e vira **Velha Guarda**,
    numa aba própria, com a ficha do último dia e o histórico inteiro.

- **Desgaste permanente × ferrugem** (20/08/2026): a distinção que faz as
  quatro valerem alguma coisa. Quem está no teto do cargo — e depois de
  alguns anos é quase todo mundo — recuperava no treino seguinte tudo o
  que a rua tinha tirado.
  · **Sequela e idade derrubam o TETO da pessoa** (`m.desgaste`), e não
    voltam com treino nenhum.
  · **Cadeia e ferrugem da paz derrubam só a ficha de agora**, e voltam
    treinando — é isso que "enferrujado" quer dizer.
  · O teto de uma pessoa pode ser quebrado (17,5), então encostar nele é
    parar nele exatamente, não pular pro inteiro de cima.

- **O mundo envelhece junto** (20/08/2026): as outras torcidas levam as
  quatro cobranças no quadro por cargo. Como elas não têm ficha
  individual, a régua sai da mesma distribuição de idades (16 a 45): todo
  ano 11 dos 30 anos de faixa estão no declínio, o que dá **−0,22
  permanentes por ano**, e **1 dos 30 pendura a bandeira** — saindo de
  TODO cargo na mesma proporção, porque idade não escolhe patente.
  · Medido em 20 anos de jogo: antes, **139 de 139 torcidas em 18,1**;
    agora **nenhuma**, com a força espalhada de 4,6 a 10,0 e mediana 7,3.

- **O itinerário mora DENTRO da mensagem** (correção do dono,
  20/08/2026): a tela cheia saiu do jogo. A mesma linha de paradas de
  baixo pra cima, com a mesma lógica, é desenhada no cartão da própria
  mensagem que abriu o dia — e por isso é bem mais enxuta: sem
  cabeçalho, sem barra de botões, sem o "lugar" de cada parada. Sobra
  a hora, a bolinha, o nome e o recado ao lado quando a parada tem.
  · A linha é montada UMA vez e o cartão a adota a cada repintura, então
    estado, cartões abertos e o relógio da partida sobrevivem inteiros.
  · Enquanto ela anda, o itinerário É o estado da mensagem: o feed não
    repinta o cartão no meio do caminho.
  · Terminado o dia, a linha FICA na mensagem como registro, e não há
    mais botão de fechar — o que sai é a trava do relógio.
- **O botão abre o DIA, não o jogo** (correção do dono, 20/08/2026):
  "Iniciar partida" ligava o cronômetro do jogo na mesma hora, então o
  relógio corria durante a concentração inteira e a gente chegava no
  estádio com o jogo no segundo tempo. Agora ele só marca o dia como
  aberto; **quem acende a partida é a parada do jogo**, quando a linha
  chega nela.

- **A rodada vira primeira página** (régua do dono, 20/08/2026): a linha
  corrida de placares — “Os jogos de domingo: A 3 × 0 B, C 0 × 3 D…” —
  virou um **recorte de jornal** dentro da própria mensagem do feed. A
  informação é a mesma; o que mudou é a hierarquia.
  · **Gazeta dos Sports**, nome do jornal do nosso mundo — não o de
    verdade, que serviu só de referência visual.
  · **Manchete** é o jogo de maior FORÇA do dia, com a nossa divisão na
    frente quando o clube não é da série de cima.
  · **Na nossa praça** traz os jogos da nossa cidade e a caixa do nosso
    clube, com placar, uma linha e a posição na tabela.
  · **Pelo país** leva de duas a quatro notas curtas, na mesma régua de
    força, escolhidas **pela variedade de condição**: quatro goleadas
    davam quatro notas do mesmo par de moldes. E nenhuma condição entra
    mais vezes do que tem molde — `empate` tem um só.
  · **Placar do dia** é CORTADO em 10 linhas, com prioridade pro nosso
    campeonato e pro da manchete; o resto vira a nota de pé, e o link de
    Ver Competições continua sendo o mesmo de sempre.
  · Papel de jornal envelhecido, tinta com viés marrom e um vermelho
    oxidado só em três coisas: o chapéu, a coluna da nossa praça e as
    goleadas. O recorte **não acompanha o tema do jogo** — papel é papel.
  · Três fontes novas, por escolha do dono (fidelidade acima do peso de
    carregamento): **Ultra** no masthead, **Archivo Narrow** nas
    manchetes e rótulos, **PT Serif** no corpo e nos placares.
- **A régua da capa é a FORÇA, não o placar** (régua do dono,
  20/08/2026): jornal não abre pelo placar mais largo, abre pelo jogo
  dos times de mais força. Um 4 a 0 na quarta divisão não tira a capa
  de um clássico de Série A. Vale pra manchete E pra coluna "Pelo país".
  · **A exceção é o dono do jornal**: se o nosso clube joga numa divisão
    que não é a de cima, o leitor é dali — primeiro vêm os jogos da
    NOSSA divisão, e só depois a força manda. Com o clube na Série A as
    duas réguas dizem a mesma coisa e a exceção não muda nada.
  · Medido: com o clube na Série B, um Cruzeiro × Mamoré de força 36
    NÃO tomou a capa de um América/MG × Athletic de força 20, porque o
    primeiro é de outra divisão.
- **A faixa da classificação** (pedido do dono, 20/08/2026): o jornal
  fecha sempre com a tabela da divisão em que o NOSSO clube joga, e
  quando a competição tem grupos (a Série D tem) só o grupo dele.
  · Resumida em oito linhas. Se ele não estiver entre as oito, saem as
    seis primeiras, um risco, e a vizinhança dele.
  · **O nacional só começa no meio do ano.** Até lá a divisão existe no
    papel mas não tem bola rolada, e a faixa mostraria uma tabela
    zerada — nesses meses ela mostra o campeonato que o clube ESTÁ
    jogando (o estadual, o regional), e troca sozinha quando o nacional
    começa.
- **68 moldes de texto, sob crivo** (aprovados pelo dono, 20/08/2026):
  nenhuma frase do jornal é escrita na hora. São 9 grupos — chapéu,
  manchete, olho, praça, caixa do nosso jogo, notas, rodapé, tarja e
  cabeçalho — e cada um escolhe pela condição do jogo.
  · Onde há mais de um molde pra mesma condição, eles andam numa **fila**:
    dentro da edição nenhum se repete, e o ponto de partida vem da data —
    a mesma rodada dá sempre a mesma página, o que importa porque a
    mensagem sobrevive ao save.
  · Ficaram de fora, de propósito, as frases que o jogo não sustenta:
    “a quarta vitória seguida”, “colado na ponta”, o estádio de um jogo
    que não é do mandante. Molde só afirma o que o jogo sabe.
- **Três consertos que só o teste com dados reais mostrou** (20/08/2026):
  a primeira coluna deixava um palmo de papel em branco quando não havia
  jogo na praça nem o nosso — agora o jornal fecha em duas colunas e as
  notas sobem; a tabela pegava o primeiro campeonato da temporada e
  mostrava “0 pontos em 0 jogos” — agora é o campeonato do jogo de hoje;
  e as notas repetiam — daí a fila e a escolha por variedade.
- **Save antigo não quebra**: mensagem de rodada sem os jogos guardados
  continua mostrando o texto corrido de sempre.

- **Aliada não desce** (régua do dono, 20/08/2026): na briga da
  arquibancada, outra torcida do NOSSO clube que seja **aliada de
  verdade** (relação ≥ 45) da torcida que a gente vai enfrentar fica na
  cadeira e não entra na cena. Fortaleza × Flamengo: a TUF cai em cima
  da Jovem Fla e a Jovem Garra Tricolor, aliada da Jovem Fla, não sai
  do lugar.
  · Vale só pras OUTRAS. A nossa desce porque o jogador mandou descer,
    aliada ou não.
  · O teste é contra a **maior torcida do outro lado** — a que a gente
    vai enfrentar de fato —, não contra qualquer uma que esteja no
    estádio.
  · Se TODA a nossa ala for aliada deles, a nossa desce sozinha.
  · Quem ficou quieto entra na consequência da mensagem da partida,
    logo depois do "O clima azedou e a arquibancada se pegou" que já
    existia. **Texto aprovado pelo dono (20/08/2026):**
    · uma só: `A {torcida} ficou na cadeira: é aliada da {rival}.`
    · mais de uma: `A {torcida} e a {outra} ficaram na cadeira: são
      aliadas da {rival}.`
    · Toda torcida entra com **"da"**, seguindo a convenção que os
      textos já aprovados usam ("A Leões da TUF caiu em cima da
      gente") — o jogo trata torcida como feminina.
- **O efetivo anda com a linha** (régua do dono, 20/08/2026): a caravana
  parte com um número e ele **não volta**. Cada emboscada, cada treta,
  cada briga tira as baixas, e o próximo ponto do itinerário recebe o
  que sobrou — 40 na saída, 6 baixas na emboscada, 34 na parada
  seguinte.
  · **Vale pros dois lados**: o nosso bonde e o da maior torcida do time
    que a gente enfrenta, em casa ou fora.
  · **Baixa é caído E preso**: quem foi pro camburão também não chega
    ao estádio.
  · Os dois números aparecem na barra da linha e ponto a ponto, embaixo
    do nome da parada; o cartão da briga fecha com "segue viagem com
    34 (−6)".
  · O efetivo de partida sai da PRESENÇA que a mensagem da partida já
    calcula. Sem presença declarada, o nosso é o efetivo disponível.

- **O dia de jogo não vira mensagem nova** (decisão do dono,
  21/08/2026): a mensagem "O dia de jogo, parada por parada: …" foi
  **removida**. A linha percorrida já fica dentro da própria mensagem
  do dia de jogo, e cada briga já saiu na mensagem dela — o registro
  repetido era ruído.
- **O lugar da briga é o lugar, não o bairro** (correção do dono,
  21/08/2026): não existe "bairro arquibancada". A briga de
  arquibancada fecha em **"se pegaram na arquibancada"**, sem sufixo.
  · A régua: o `, no bairro X` só entra onde bairro existe de verdade.
    **Arquibancada** (`estadio-10/20/40`) e **estrada** (`emb-onibus`)
    não são endereço de bairro nenhum e fecham no nome do lugar.
  · **Casos similares corrigidos**: arquibancada, beco, pátio do
    galpão, campo de terra, posto e estrada não tinham nome na tabela
    de cenas e caíam todos no genérico "na rua". Agora cada uma diz o
    seu lugar, com as palavras que a própria cena já usa:
    `na arquibancada`, `no beco`, `no pátio do galpão`,
    `no campo de terra`, `no posto`, `na estrada`.

- **A Gazeta encolheu e virou o jornal do NOSSO clube** (decisão do
  dono, 21/08/2026):
  · **Só sai em dia de jogo nosso.** Rodada em que o clube da torcida
    não entrou em campo não vira edição — nenhuma mensagem de jornal.
  · **A manchete é sempre o jogo dele.** A régua antiga (capa pela
    força dos times, com exceção pra nossa divisão) foi substituída:
    não há mais escolha de capa, é o nosso jogo e pronto.
  · **A página fecha no placar grande.** Saíram da edição: "Na nossa
    praça", a caixa do nosso jogo, "Pelo país", o "Placar do dia" e a
    faixa larga da classificação. Sobrou cabeçalho, tarja, chapéu,
    manchete, olho e placar.
  · **Ao lado da manchete, um recorte de SETE linhas** da tabela
    (régua do dono, 21/08/2026), com o nosso clube **no centro** —
    sempre a divisão em que ele joga, e na Série D só o grupo dele.
    · **Do 1º ao 4º lugar**: sempre os sete primeiros.
    · **Nas quatro últimas posições**: sempre os sete últimos.
    · **No meio**: três acima, nós, três abaixo.
    · Tabela com menos de sete times sai inteira.
  · **Sem linha no meio** (21/08/2026): o fio vertical entre a
    manchete e o recorte saiu — o que separa é o espaço.
  · O **"Ver Competições" do cartão voltou**: o jornal não tem mais pé
    próprio, então é o único caminho pra tabela cheia.
  · **"Mostrar jornal completo"** (pedido do dono, 21/08/2026): um
    botão no pé da notícia solta o resto da página — as seções que
    saíram voltam inteiras, do jeito que eram em 20/08/2026 (praça,
    caixa do nosso jogo, pelo país, placar do dia, faixa larga da
    classificação e o pé com "Ver competições"). Nada de texto novo:
    são os mesmos moldes.
    · Quem lembra que a página está aberta é a **própria mensagem**
      (`m.gzAberto`), e o estado entra em `estadoDaMsg` — senão o
      repinte do feed fechava o jornal na cara do leitor.
    · A página cheia é montada na mesma passada da enxuta, aberta ou
      fechada: a fila de moldes tem de ser a mesma, porque a edição é
      uma só.
  · Medido: o cartão fechado tem **369px** (era 703px com o jornal
    inteiro sempre aberto); aberto, **888px**.

- **FUTEBOL E PORRADA** (pedido do dono, 21/08/2026): a briga da nossa
  torcida deixa de ser uma linha de texto e vira a primeira página do
  jornal da rua, **substituindo a mensagem de confronto**.
  · **E substituindo também o "brigas da semana"**, que deixa de
    existir: o resumo de segunda-feira saiu do feed. Notícia de briga
    só sai neste layout. **As brigas do mundo continuam acontecendo e
    continuam registradas** — inteiras, como sempre, em
    **Notícias → Brigas**; o que acabou foi a mensagem semanal.
    Conferido: 199 dias e 28 segundas sem uma única mensagem, com
    3.328 brigas contadas no mundo e a aba cheia.
  · **Mesmo esqueleto da Gazeta**: cabeçalho, tarja, chapéu, manchete,
    olho e placar grande. O placar grande da briga são os **feridos**
    de cada lado.
  · **A voz é da rua**, com gíria — é jornal de banca de esquina, não
    de assinatura: papel mais amarelado, trama mais grossa, manchete
    maior e mais fechada, vermelho mais sujo.
  · **No lugar da classificação, O QUADRO DA NOITE**: envolvidos,
    feridos e presos dos dois lados, com o pior número de cada linha
    na tinta vermelha, e uma tarja fechando com quem levou a melhor
    (cinza quando ninguém levou).
  · **"Ver mais notícias"** abre as outras brigas do MESMO DIA pelo
    país, cada uma com a sua nota, a cidade, o motivo e os números dos
    dois lados. Guarda o estado aberto na própria mensagem
    (`m.ppAberto`), como o jornal completo da Gazeta.
  · **O número da edição é carimbado na hora** (`dados.edicao`): jornal
    velho não muda de número.
  · **"Era menos" é sempre sobre o nosso lado** — vencendo vira mérito,
    apanhando vira explicação.
  · **O camburão passa na frente do lugar** no chapéu: quem foi preso é
    a notícia, a arquibancada é só o endereço.
  · **Nenhuma condição entra mais vezes do que tem molde**, a mesma
    régua do "pelo país" da Gazeta.
  · Medido: cartão fechado **433px**, aberto **927px**.

- **A provocação do rival só em briga que valeu prestígio** (régua do
  dono, 21/08/2026): ninguém manda recado por causa de treta marcada
  de 5 contra 5. A conta é o **maior movimento de prestígio da noite —
  nosso ou deles, pra cima ou pra baixo — e o corte é 3,5 na régua de
  0 a 100**. Fica de fora a treta marcada (1 ponto) e a briga de
  arquibancada miúda (1 a 3); passa a guerra de bar e a cena grande,
  que chegam a 10.
- **FECHAR NÃO É DECIDIR** (correção do dono, 21/08/2026): nas telas de
  ação que o feed abre, fechar valia quase o mesmo que confirmar — a
  mensagem já saía respondida na abertura, então o turno era consumido
  e o relógio voltava a andar sem nada ter acontecido.
  · Agora **abrir não responde**. As telas canceláveis — **Atacar**,
    **Montar a caravana** e **Ver os alvos** (assalto) — abrem com a
    decisão ainda de pé. Fechar volta pro feed com a mensagem inteira,
    botões e tudo, e **o relógio segue parado**.
  · **Quem responde é o Confirmar da tela**, por
    `TO.feed.marcarResposta`. É ele que solta o tempo.
  · **As exceções, que continuam marcando na abertura**: as cenas
    (guerra, defesa, escolta, treta), porque a briga já aconteceu no
    clique e não há o que cancelar; e as duas mensagens de abertura
    (ideologia e Expediente), que não têm outro botão — deixá-las
    pendentes ao fechar prenderia o relógio pra sempre.

- **A RÉGUA DA RELAÇÃO** (régua do dono, 21/08/2026): todo movimento de
  relação do jogo passa a valer **de 5 a 20 pontos**, e **briga sempre
  tira mais**. A faixa foi dividida pra garantir isso:
  · **briga: 10 a 20** — só briga entra aqui;
  · **negativo que não é briga: 5 a 9**;
  · **positivo: 5 a 20**.
  Assim nenhum gesto de paz, por maior que seja, azeda a relação tanto
  quanto o menor dos socos.
  · **Tudo mora numa tabela só**, `TO.relacoes.REL`. Antes os números
    estavam soltos em cinco arquivos, de −1 a −26, e rebalancear era
    caça ao tesouro. Agora nenhum ponto do jogo escreve número de
    relação: todos leem da tabela.
  · **Briga**: ataque ao bar/sede vencendo −20 · briga de rua no dia de
    jogo −18 · ataque perdendo −17 · defesa segurando −15 ·
    arquibancada contra quem era maior −13 · defesa perdida −13 ·
    arquibancada parelha −12 · arquibancada contra o menor −11 ·
    treta marcada −10.
  · **Sem briga**: pichação −9 · largar o aliado −9 · Provocar −8 ·
    ataque-surpresa marcado contra nós −8 · não receber o aliado −7 ·
    furar o aniversário −6.
  · **Positivo**: churrasco e escolta +20 · descer pelo aliado +16 ·
    hospedar e escoltar +12 · ir ao aniversário +8 · hospedar +7 ·
    reunião de diretoria +6 · Aproximar +5.
  · **Entre elas (IA × IA)**: briga −16 · ajudou, contra o rival −12 ·
    treta −10 · ajudou, com a ajudada +14 · convite aceito +8 ·
    convite recusado −6 · reunião +6.
  · **A ARQUIBANCADA PASSOU A AZEDAR DE VERDADE**: era de −1 a −3 e
    virou de −11 a −13. Antes um dia inteiro de setor pegando fogo
    mexia menos que uma semana de paz.
  · **O botão Aproximar caiu de +8 pra +5**, o piso da régua: é o
    único movimento de graça e sem limite de uso do jogo, então tem
    de ser o mais fraco. Agora custa **4 apertadas** pra igualar um
    churrasco.
  · **O tempo NÃO entrou na régua** (esfriar 5%/semana, convivência
    +1/mês, indiferença −1 a cada 2 meses). São gotejamentos semanais,
    não eventos: a 5 pontos por mês, um ano de paz daria +60 e o
    passivo engoliria tudo que o jogador faz.
  · Medido com os novos números: de um rival comum (−30), **dois
    ataques ao bar viram Maior Rival** e são precisas **11 semanas de
    paz** pra sair de lá. Do neutro, **quatro churrascos (R$ 12.000)
    viram Irmandade**.

- **Troca de C e D** (decisão do dono, 21/08/2026): **Amazonas,
  Ferroviário e Floresta descem pra Série D**; **Brasiliense, Sergipe e
  CSA sobem pra Série C**. Os níveis trocam junto, par a par na ordem
  em que o dono listou:
  · Amazonas 10 → **6** · Brasiliense 6 → **10**
  · Ferroviário 10 → **6** · Sergipe 6 → **10**
  · Floresta 8 → **7** · CSA 7 → **8**
  · O `divisaoClube` das torcidas dos seis clubes acompanha (7 registros).
  · Conferido no jogo rodando: a Série C segue com 20 clubes e a D com
    48 em 4 grupos.

- **O ALMANAQUE** (pedido do dono, 21/08/2026): as notícias de virada
  de ano e de título, no mesmo esqueleto de jornal da Gazeta e do
  Futebol e Porrada — cabeçalho, tarja, chapéu, manchete, olho e um
  quadro ao lado. Papel mais claro e trama mais fina: é anuário, não
  banca. Seis edições:
  · **CAMPEÃO** — uma por competição que o **nosso clube jogou**, na
    hora em que o campeão sai. Regional em março, nacional em
    dezembro: cada uma no seu tempo. Competição que ele não jogou não
    vira notícia.
  · **SOBE E DESCE** — quem subiu e quem caiu, na virada.
  · **TORCIDA DO ANO** — a 1ª do ranking no fechamento de 31/12.
  · **REI DA PISTA** — o maior saldo de brigas do ano.
  · **A JANELA** — quem se reforçou, pela evolução de força de um ano
    pro outro.
  · **O PATRIMÔNIO** — quem mais abriu prédio no ano.
  · **A VÉSPERA** (pedido do dono, 21/08/2026): **sete dias antes** de
    cada competição começar, um aviso — **só das competições em que o
    nosso clube está**. O subtítulo diz, **pela força**, quem são os
    favoritos ao título, quem briga pelo acesso (se a competição tem)
    e quem está ameaçado de queda (se tem rebaixamento).
    · Quem briga pelo **acesso** não é quem briga pelo **título**: a
      janela do acesso começa depois dos favoritos, senão a frase
      repetiria os mesmos nomes duas vezes.
    · **O chapéu fala da NOSSA situação**, não da competição: numa
      Série B com acesso e queda, quem está em terceiro lê "Vale o
      acesso" e quem está em décimo oitavo lê "Tem gente pra cair".
    · Quantos sobem e quantos caem sai de `TO.competicoes.emJogo`, que
      lê a escada nacional (4 por 4), a escada regional e o formato de
      cada competição (`rebaixaPorGrupo`, `sobemFinalistas`).
    · **A COPA DO BRASIL TEM MOLDE PRÓPRIO** (pedido do dono,
      21/08/2026): não tem tabela, não tem acesso e não tem queda —
      tem eliminação. Manchete e olho falam disso ("quem tropeçar uma
      vez está fora"), e a tarja diz **jogo único**. Ela também não
      tinha rodada nenhuma, só mata-mata: a estreia passou a sair de
      `estreiaDe`, que lê a primeira fase quando não há rodada, e a
      lista de clubes de `porForca`, que cai no `comp.clubes`.
    · **A BRECHA DO NOSSO CLUBE** (pedido do dono, 21/08/2026): quando
      ele não está nem entre os favoritos nem na zona de risco, a
      notícia abre espaço pra dizer o que se espera dele — "O Fortaleza
      entra como um dos que podem ir longe", "Do {A} se espera meio de
      tabela", "O {A} entra como azarão". Se ele já foi citado como
      favorito ou como ameaçado, a linha não sai: repetir seria encher
      linguiça. E o quadro ganha a linha **o nosso**.
    · **NENHUMA NOTÍCIA DO ALMANAQUE EXPÕE O NÍVEL DE FORÇA** (régua do
      dono, 21/08/2026). O quadro diz o PAPEL de cada um — favorito,
      risco, o nosso — e a expectativa é palavra, não número. A janela
      mostra só o QUANTO mudou (+4), nunca o nível resultante. A força
      continua onde sempre esteve: na tela de Competições.
  · **A FOTO DO ANO** (`E.almanaque`) é tirada no primeiro dia de cada
    ano e no começo do jogo: é contra ela que o balanço compara. Sem
    foto não existe "no ano passado".
  · **A ORDEM DA COLHEITA NÃO É GOSTO**: o placar de brigas é lido
    ANTES do ranking. `ranking` mede o saldo do ano de cada torcida, e
    medir o saldo ZERA o placar quando o ano virou — lendo o ranking
    primeiro, o Rei da Pista saía sempre vazio.
  · **Dois artigos, dois lugares**: "a taça **do** Brasileirão" e "a
    taça **da** Copa" pedem uma forma; "faturou **o** Brasileirão" e
    "terminou **a** Copa" pedem outra. Um artigo só dava "terminou do
    Brasileirão".

- **MATA-MATA DA SÉRIE D EM IDA E VOLTA** (pedido do dono, 21/08/2026):
  a D é a única série que sai dos grupos pro playoff, e playoff de
  acesso não se decide em jogo único. As quatro fases — oitavas,
  quartas, semi e final — passam a ter dois jogos, com o mando
  invertido na volta e o agregado decidindo. Conferido: o grupo acaba
  na semana 32, a chave vai da 33 à 40 e sobra ano.
- **A DISPUTA DE PÊNALTIS** (correção do dono, 21/08/2026): mata-mata
  empatado passava um time **aleatório** — uma moeda pesada pela força,
  sem placar, sem roteiro, sem ninguém ver como. Agora é disputa de
  verdade: cinco cobranças alternadas por lado, morte súbita se
  persistir, e o roteiro fica guardado no jogo, cobrança a cobrança.
  · **A REGRA É A DA VIDA REAL** (conferido pelo dono, 22/08/2026):
    cinco cobranças pra cada lado, alternando, e a série morre no
    instante em que a diferença fica maior do que o que ainda resta pro
    outro bater — não se cobra pênalti decidido. Passadas as cinco, é
    alternada de verdade: **par completo**, os dois batem, e só então
    se olha o placar. Ninguém passa no meio do par. **Medido em 20.000
    disputas**: nenhum empate, ninguém bate mais de cinco na série
    inicial, nenhuma decisão sai no meio do par, e 9.210 delas
    terminaram antes das dez cobranças.
  · **60/40, NÃO 75/25** (régua do dono, 22/08/2026): o favorito tem de
    ter mais chance, mas pênalti é pênalti. A conversão sai da força de
    raspão — o melhor bate a 78,7% e o pior a 72,3% — e isso dá, na
    ponta, **59%** de passagem pro maior clube do país contra o menor.
    A régua saiu de varredura: 0,013 de vantagem dava 54%, 0,045 dava
    63%, 0,06 dava 68%. Ficou em **0,032**.
  · **A DISPUTA É PARTE DO JOGO, NÃO UMA TELA** (correção do dono,
    22/08/2026): a janela separada saiu. A série sai **dentro do tempo
    real da partida, na parada do jogo do itinerário**. O relógio
    congela em 90' enquanto ela corre: a barra fica cheia, o clima da
    arquibancada para de andar (briga nenhuma nasce no meio da série) e
    os arredores só destrancam na última cobrança.
  · **A GRADE, E NÃO LINHA DE TEXTO** (régua do dono, 22/08/2026): a
    primeira versão dentro da partida escrevia uma linha por cobrança
    na lista dos gols, e o dono preferiu de volta a animação do placar:
    o cartão da disputa abre embaixo do placar da partida, com as duas
    fileiras de bolas enchendo uma por vez — verde cheia pra quem
    converteu, riscada de vermelho pra quem perdeu — o placar da série
    subindo em cima e o recado do lance embaixo. Da lista de eventos
    sobrou só uma linha: o aviso do fim do tempo normal.
  · **QUEM CONTA É A MENSAGEM, não o cartão**: a primeira versão da
    série vivia dentro do fechamento que desenhava o cartão, e morria
    junto com ele no primeiro repinte do feed — o jogador via três
    cobranças e a disputa parava. Agora o instante em que a série
    começou fica guardado no estado da mensagem (`penDesde`), e o
    cartão novo nasce com a série em dia, seguindo de onde estava.
    Testado com um repinte no meio da disputa.
  · **O DETALHE APARECE EM TODA TELA** que mostra o placar decidido:
    a tela de Competições (com a série cobrança a cobrança), o
    calendário e a agenda do clube. Um formatador só, pra não haver
    duas versões da mesma verdade.
  · **PÊNALTI SÓ ONDE PRECISA** (conferido a pedido do dono,
    22/08/2026): a disputa só nasce em jogo de mata-mata empatado —
    nenhuma chamada dela existe no laço das rodadas de pontos corridos.
    O que **estava** frouxo era a entrega: a série chegava na mensagem
    da nossa partida por uma vaga solta do estado, e bastava ser um
    jogo nosso pra ela grudar. Dois jogos nossos no mesmo dia — ou uma
    vaga que sobrasse — e os pênaltis apareceriam numa partida de
    rodada, que não decide nada. Agora a série só entra no jogo dos
    **mesmos dois clubes** que a disputaram, esse jogo é o que vira a
    partida ao vivo do dia, e a vaga é esvaziada de qualquer jeito.
    **Medido em 5 anos de calendário**: 165 disputas, todas em chave,
    nenhum jogo de pontos corridos nos pênaltis, e toda série que saiu
    na nossa partida veio de um jogo de mata-mata.
  · **A ORIENTAÇÃO DO PLACAR** (bug pego no teste): na chave de ida e
    volta a disputa rodava com os times da IDA e era guardada no jogo
    da VOLTA, então o placar saía trocado em relação aos nomes — "ASA
    4×2 Paulista" com o **Paulista** classificado. Agora corre na
    orientação da volta, que é onde ela mora.

- **JOINVILLE NA C, INTER DE LIMEIRA NA D** (pedido do dono,
  22/08/2026): os dois trocam de divisão e trocam de nível junto —
  Joinville 6→8, Inter de Limeira 8→6 —, e o `divisaoClube` das duas
  torcidas acompanha (União Tricolor 4→3, Interror 3→4). Conferido no
  jogo rodando: a Série C segue com 20 clubes e a D com 48.

- **A BOLA DE CONTROLE, NO LUGAR DO WASD** (pedido do dono,
  22/08/2026): no celular a cruz de quatro botões saiu e entrou um
  direcional de joystick — base redonda, núcleo que acompanha o dedo até
  a borda, e o dedo pode passar da borda que o ângulo continua valendo.
  · **O QUE MUDA DE VERDADE É O QUE SAI DALI**: quatro botões davam oito
    direções; a bola dá um **vetor**, qualquer ângulo. Ele mora em
    `teclas.eixo`, o mesmo objeto que o teclado alimenta, então só
    `moverLider` precisou aprender a ler — quando o vetor existe é ele
    que manda, e o teclado segue exatamente como estava.
  · **ZONA MORTA de 16% do curso**: dedo em vidro treme, e um toque
    parado no centro não pode virar caminhada. Fora dela a velocidade é
    cheia: a direção é do jogador, o passo é do jogo.
  · Soltar o dedo zera o vetor e devolve o núcleo ao centro — sem isso o
    líder sairia andando sozinho, o mesmo mal que o `setPointerCapture`
    já evitava na cruz. A dica de teclas do canto da cena também some no
    celular: ali não há tecla pra apertar.

- **SALVAR JÁ FECHA, NA IDEOLOGIA** (régua do dono, 22/08/2026): a tela
  tinha Salvar no corpo e Fechar no rodapé, e o Fechar não guardava
  nada — a dúvida de sempre, "salvei ou só fechei?". Agora é um botão
  só, no rodapé, e ele faz as duas coisas. A mesma caixa dentro da
  Diplomacia **mantém** o botão dela: ali é página, não tela, e não há o
  que fechar.

- **A TRETA MARCADA VIRA TRETA APOSTADA** (régua do dono, 22/08/2026):
  as três — 5x5, 7x7 e 10x10 — passam a valer dinheiro, e passam a ser
  coisa de quem tem galão.
  · **SÓ LINHA DE FRENTE DESCE**. Briga combinada de efetivo igual não é
    lugar de novato. A escalação vai pela patente: primeiro os Linha de
    Frente, e **faltando gente apta improvisa um Componente**; dentro de
    cada faixa manda a ficha. Novato só entra se não sobrar mais
    ninguém, pra cena nunca ficar sem bonde.
  · **SEMPRE APOSTADA**: de **R$ 1.000 a R$ 6.000** de cada lado, sempre
    redondo, de mil em mil. O valor sai da semente da própria treta, e
    varia de uma pra outra. Quem ganha leva a dos dois; o caixa da
    perdedora é raspado no que puder cobrir, mesma regra do saque do
    bar.
  · **SEM CAIXA, SEM MENSAGEM**: torcida que não cobre a aposta não é
    chamada — a mensagem nem chega, em vez de chegar como uma escolha
    que não existe. Medido: com o caixa no fundo do poço, o calendário
    marcou 68 tretas em quatro anos e nenhuma virou mensagem.
  · **RECUSAR TEM PREÇO EM DINHEIRO**: além do Prestígio −1, ficam
    **20% da aposta** na mão de quem marcou — apostou cinco mil, recusar
    custa mil. Combinar e não descer sai mais barato que perder, mas não
    sai de graça.
  · **O VALOR ESTÁ NA FRASE** (pedido do dono, 22/08/2026): a aposta é a
    notícia, e não letra miúda de botão. O texto aprovado ganhou o valor
    no meio, sem mexer em mais nada — "Zona Leste marcou uma treta no
    Dionísio Torres contra a Cearamor, **R$ 3.000 de cada lado**, bora
    pro problema?". A nota do botão parou de repetir a aposta e passou a
    dizer o que se leva: a roda inteira.

- **O LÍDER CORRE JUNTO, E EXISTE UM BOTÃO DE FUGIR** (pedido do dono,
  22/08/2026):
  · **O PRESIDENTE NÃO FICA PLANTADO**. Quando o bonde quebrava — por
    sangue ou por medo do tamanho do outro —, todo mundo virava as
    costas e o líder ficava parado no meio da rua: ele é o único disco
    que só o teclado move, e `moverLider` (com razão) larga o comando
    em fuga. Resultado: a cena **nem acabava**, porque `dePe` contava
    aquele disco imóvel e a briga ficava de pé esperando alguém que
    ninguém podia mexer. Agora, fugindo, o líder anda pela mesma rota
    dos outros.
  · **FUGIR É UMA ORDEM, e tem botão** (`F`, e um botão vermelho no HUD
    e no pad do celular). Debandada é o bonde quebrando sozinho; isto é
    o presidente mandando correr **antes** de tomar prejuízo — o preço
    de poupar ficha é perder a briga, e a conta é do jogador.
  · **ORDEM DADA É ORDEM CUMPRIDA**: sem o rabo de 2,6 s que a
    debandada natural dá a quem está encarando o outro bonde. Todo mundo
    vira de uma vez, o líder inclusive, cada um pela rota do seu spawn,
    e a cena fecha sozinha quando o último some — pelo caminho de
    sempre, sem encerramento especial.
  · Dada a ordem, pedra, bomba, recuo e o próprio botão apagam: bonde
    correndo não bate, e botão que promete o que não vai acontecer é
    pior que botão nenhum.
  · **Medido**: dez de dez correram no mesmo instante, o líder saiu pela
    rota, zero caídos, e a cena encerrou sozinha em "sua torcida foi
    corrida do lugar". Na quebra natural, idem.

- **A LINHA "RESULTADO" SAIU DO FEED** (decisão do dono, 22/08/2026):
  ela dizia "Bragantino 1 × 1 Corinthians, pelo Paulistão." logo acima
  de um jornal cuja manchete é esse mesmo placar. Nasceu quando não
  havia jornal nenhum; com a Gazeta na frente, virou eco. O placar do
  nosso jogo continua saindo — na primeira página, que é o lugar dele.
  Conferido em 2 anos: 101 partidas nossas, 101 jornais, zero linhas
  "Resultado" no feed e zero no arquivo de notícias. O rótulo do tipo
  fica no código só por causa de save antigo.

- **A PERIFERIA DA CENA VIRA TRANSMISSÃO DE TV** (pedido do dono,
  22/08/2026): as informações de borda eram quatro objetos sem
  parentesco — relógio numa caixa de borda dura, botão de velocidade
  solto ao lado, barra de PM crua e um bloco de texto colorido por
  atributo `style`, cada um com o seu fundo e o seu alinhamento. Parecia
  depuração deixada na tela.
  · **UMA GRAMÁTICA SÓ**: placas escuras de vidro fosco (`backdrop-filter`),
    canto levemente arredondado, mesma borda e mesma sombra nas três.
  · **O RELÓGIO E A VELOCIDADE VIRARAM UMA TARJA**, porque são o mesmo
    assunto — o tempo da cena —, com um ponto vermelho pulsando de "ao
    vivo" (sem palavra nova: o ponto já diz).
  · **O PLACAR VIROU PLACAR**: duas linhas de time com a tarja da cor do
    bonde à esquerda, nome em caixa alta e número de pé alinhado à
    direita em fonte de largura fixa; embaixo, uma fita com caídos,
    entraram e o clima. **A cor sai do bonde**, então o placar casa com
    as camisas em campo em vez de dois tons cravados. A tarja ganhou um
    fio claro em volta porque camisa preta sumia dentro da placa.
  · "Entraram" só aparece onde há portão pra entrar; a linha da tropa
    some quando não há tropa.
  · **A ARMADILHA**: `#djPalco` zera a entrelinha por causa do canvas, e
    sem `line-height` explícito na HUD todo texto nasce com **zero de
    altura** — o nome dos times sumiu da placa e só o número, de fonte
    mono, escapava por transbordo. A regra antiga carregava um
    `line-height:1.55` que ninguém sabia que estava segurando isso.

- **A FICHA DA SELEÇÃO SÓ DIZ O QUE É VERDADE** (limpeza pedida pelo
  dono, 22/08/2026). Saíram cinco linhas do passo 2:
  · **Finanças** mostrava o saldo guardado no arquivo (R$ 200 pra
    metade das torcidas) e o jogo começa com `max(4000, saldo×4)` — o
    número na tela nunca foi o dinheiro com que se joga.
  · **Influência** e **Territórios** eram fórmulas do próprio efetivo
    (territórios = membros ÷ 16) que não entram em conta nenhuma do
    jogo: dois algarismos repetindo o que a linha "Membros" já dizia.
  · **Mapa da cidade** contava quarteirões de um mapa descontinuado.
  · **Bairro da sede** é trivia na hora de escolher — o nome do bairro
    só ganha sentido depois, dentro do jogo.
  · **A RIVALIDADE MÁXIMA MUDOU DE CRITÉRIO**: era o primeiro da lista
    de maiores rivais; agora é **o rival de efetivo mais próximo do
    nosso**, com o tamanho dele ao lado. É o que responde a pergunta
    que se faz na hora de escolher — com quem eu vou brigar de igual
    pra igual. Empatou, o maior rival declarado tem preferência.
    Sobraram sete linhas: Membros, Sede, Prestígio, Divisão, Estádio,
    Aliados/Rivais e a rivalidade, esta ocupando a linha inteira.

- **A CENA CABE NA TELA** (pedido do dono, 22/08/2026): o palco pedia
  100% da largura e o canvas devolvia a altura proporcional (1140×820)
  — num notebook isso passava do alto do monitor e a cena ganhava barra
  de rolagem no meio da briga. O `max-height:94vh` que já estava lá não
  fazia nada: teto em elemento de fora não encolhe filho de altura
  automática, só o deixa transbordar. Agora o canvas — elemento
  substituído, com tamanho intrínseco — vai de `width:auto`,
  `height:auto` e teto nos **dois** lados medido na janela: encolhe
  sozinho mantendo a proporção, e o palco passa a ter o tamanho dele,
  então a HUD continua colada nas bordas certas. Conferido em cinco
  janelas, de 1920×1080 a 420×820: nenhuma rola, a proporção não muda
  e a HUD fica dentro do palco.
  · **PALCO PEQUENO, HUD PEQUENA**: num celular deitado o palco tem
    553 px e as três placas somavam mais que isso — subiam umas sobre
    as outras. Container query resolveria, mas `container-type:
    inline-size` tira a largura do palco das mãos do conteúdo, e é do
    conteúdo (o canvas) que ela vem. Então a medida é feita em JS, uma
    vez por mudança de tamanho, e vira a classe `hud-mini`.

- **BONDE MUITO MENOR NÃO COMPRA BRIGA NA ARQUIBANCADA** (régua do
  dono, 22/08/2026): quando eles chegam com **40% do nosso número ou
  menos** — isto é, são 60% menores —, a chance de o clima do estádio
  subir cai **pela metade**. Não é que não aconteça; é que quem está em
  muito menor número na casa dos outros pensa duas vezes antes de
  começar. A conta é de quem ESTÁ no estádio (a presença da mensagem
  da partida), e não de quem tem ficha. **Medido em 20.000 partidas**:
  contra bonde do mesmo tamanho a arquibancada se pega em 82% dos
  jogos; contra bonde 60% menor, em 47%. O corte é exato — 45% do nosso
  efetivo ainda não conta, 40% já conta.

- **NA EMBOSCADA, QUEM ATACA VEM EM UMA TURMA SÓ** (correção do dono,
  22/08/2026): as duas cenas de estrada punham o atacante descendo
  pelas DUAS pontas da tela, divididos ao meio. Emboscada é bonde que
  desce junto. O segundo ponto deles saiu das duas cenas — de
  `cenas.js` **e** de `cenas_editadas.js`, que sobrescreve a lista de
  spawns e por onde a primeira remoção passou batido — e o
  `espalharBonde` deixou de ser interruptor da cena inteira: agora ele
  NOMEIA o lado que se espalha. Nas duas emboscadas é `'visitante'`, o
  lado emboscado, que continua em volta do ônibus em dois pontos.
  Conferido nos três portes de atacante: 75 de 75 descem pela mesma
  ponta, e a briga continua acontecendo.

- **A FAIXA DE TRANSMISSÃO SAIU DE CIMA DA CENA** (pedido do dono,
  22/08/2026): as três placas ficaram bonitas, mas continuavam tapando
  pedaço de rua. Agora tudo o que é informação parada mora numa **linha
  só, acima do palco**, na ordem em que se lê: tempo, PM e placar. Sobre
  a cena ficaram apenas o anúncio (que é momento, não informação) e os
  botões (que são comando).
  · **UMA BARRA, NÃO TRÊS PEDAÇOS**: o fundo é da faixa inteira e o que
    separa os assuntos é um fio de um pixel.
  · **A FAIXA NÃO ALARGA O PALCO**: ela vai de `width:0; min-width:100%`,
    então ocupa a largura toda sem puxá-la pra si — quem decide o
    tamanho do palco continua sendo o canvas. Sem isso, nome de torcida
    comprido alargava o palco e a cena encolhia pra caber ao lado dele.
  · **UMA LINHA, ATÉ ONDE UMA LINHA CABE**: num palco de 500 px a faixa
    aperta (rótulo do dado some, "clima" some do clima) e ainda cabe
    inteira; num celular em pé, onde nem isso resolve, ela quebra em
    duas em vez de cortar o que não coube.
  · **A QUEBRA É DECIDIDA, NÃO ACIDENTAL** (correção do dono,
    22/08/2026): com `flex-wrap` solto a faixa quebrava onde calhava e a
    segunda linha nascia empurrada pra direita, com um vão escuro à
    esquerda. Agora a conta é feita em JS e vira classe: não coube, a
    faixa vira **duas linhas inteiras** — tempo e PM fechando a
    primeira de ponta a ponta, o placar sozinho na segunda, com os times
    à esquerda e os dados à direita. Cada linha cheia, nenhuma sobra de
    um lado só.
  · **MEDIR É PERGUNTAR QUANTO PRECISA**, e não quanto está ocupando:
    em linha única os assuntos se espremem e a soma daria sempre
    "coube"; em duas linhas a PM se estica e daria sempre "não coube" —
    a classe nunca mais sairia. Por um quadro a faixa entra no estado
    `medindo`, onde ninguém encolhe nem estica, e o transbordo diz a
    verdade.
  · **A TARJA É A CAMISA** (régua do dono, 22/08/2026): eram uma cor
    chapada; agora são as três da torcida — **primária no corpo,
    secundária na borda de cima, terciária na de baixo**. Torcida de
    duas cores repete a que tem; de uma só, a tarja fica lisa. O fio
    claro em volta continua, porque camisa preta sumia na placa escura.

- **A NOTÍCIA DO MATA-MATA PASSA A CONTAR A VAGA** (crivo do dono,
  22/08/2026): jogo empatado em chave caía no molde de empate e a
  notícia dava o 1 a 1 sem falar da disputa nem de quem passou. Eram
  três buracos em fila:
  · **DE DADO**: a mensagem do jornal levava `pen` como um **sim/não**,
    então não havia como escrever o placar da série nem o nome do
    classificado. Agora vão os dois números (o roteiro cobrança a
    cobrança fica no jogo, que é onde ele serve).
  · **DE CALENDÁRIO**: em ida e volta a vaga só era decidida no
    fechamento da semana, depois de a cópia do jogo já ter ido pro
    feed. Agora a volta é resolvida no dia em que é jogada, e o
    fechamento passa por ali de novo sem mudar nada — `decidirAgregado`
    só decide o que ainda não foi decidido, senão a disputa rodaria
    duas vezes e a manchete diria um nome e a chave, outro.
  · **DE TEXTO**: entram moldes de manchete (3), olho, nota do país (2)
    e caixa do nosso jogo (2) pra classificação nos pênaltis, e o fim
    da nossa partida passa a dizer o placar da série e quem passa.
  · De quebra, dois artigos errados: a fase virou **"nas quartas"** no
    lugar de "no Quartas" (as fases são todas femininas, e duas são
    plurais), e a competição, **"pela Copa do Brasil"** no lugar de
    "pelo".

- **TODA NOTÍCIA DE BRIGA DIZ QUEM GANHOU** (revisão do dono,
  22/08/2026): revisados os 30 moldes do Futebol e Porrada, um a um.
  · **Sete manchetes nomeavam só o perdedor** ou ninguém — "{B} não
    durou nem cinco minutos", "Sobrou pra {B} de todo lado", "A {B}
    caiu de pé, mas caiu", "A polícia chegou e encheu o camburão", as
    três do empate. Todas passaram a nomear quem levou a melhor; as do
    empate nomeiam os dois lados, que antes nem apareciam.
  · **UM MOLDE ESTAVA COM OS LADOS TROCADOS**: em "ninguém desceu" o
    texto dizia "A {B} quebrou tudo e foi embora", e ali `{B}` somos
    NÓS — a notícia acusava a nossa torcida de quebrar o que ela nem
    foi defender.
  · **UM OLHO SERVIA A DUAS CONDIÇÕES OPOSTAS**: o de "era menos"
    valia pra vitória e pra derrota em menor número, e na derrota saía
    dizendo que quem venceu é que estava em desvantagem. Virou dois.
  · **EMPATE NÃO TEM VENCEDOR**: a linha simples do feed lia só
    `ganhamos`, então briga que saiu igual era anunciada como vitória
    deles. Agora usa a mesma conta do jornal.
  · E "1 feridos" virou "1 ferido".

- **NO CELULAR A CÂMERA CHEGA PERTO** (pedido do dono, 22/08/2026): a
  cena inteira num palco de 500 px deixava cada disco com dois pixels de
  raio — o jogador via formiga, não briga. Em tela estreita a câmera
  nasce colada no disco que ele controla, usando o mesmo mecanismo do
  zoom da rodinha, que já seguia o líder.
  · **O VALOR NÃO É CHUTADO**: parte do tamanho que o disco tem de ter
    na tela de verdade (9 px de raio) e volta pela conta da escala —
    palco maior pede menos zoom, palco menor pede mais, com o teto do
    `ZOOM_MAX`. Medido num celular deitado: zoom 3,07, líder com 9 px de
    raio, um terço da cena à vista. No computador nada muda.
  · **A SETA DA BORDA** paga o que se perdeu de visão: encosta na borda
    do palco no rumo do MIOLO do bonde inimigo (a média de quem ainda
    está de pé) e some no instante em que eles aparecem — seta apontando
    pra quem já se vê é enfeite. Leva a cor da camisa deles, sobre um
    disco escuro, porque ela vive sobre telhado claro, asfalto e areia.
  · **O TAMANHO DA SETA É DA TELA, NÃO DO BUFFER**: o canvas tem 1140 px
    de largura e aparece com 500 no celular, então uma seta desenhada em
    "pixels de buffer" chegaria ao dedo com menos da metade do tamanho.
    Ela é medida em pixel de tela e convertida — a margem da borda
    também.
  · A posição da seta fica exposta em `ponte.seta` (nula quando não há
    seta): pixel não se pergunta, e é por ali que o teste confere os
    quatro rumos.

- **NO CELULAR A CENA É SÓ A CENA** (decisão do dono, 22/08/2026): dois
  recados atravessavam o meio da briga e saíram.
  · **"gire o aparelho pra ver a briga inteira"** foi apagado de vez. Ele
    mandava fazer o que o jogo não faz mais: com a câmera colada no
    disco do jogador, ver a briga inteira deixou de ser o ponto. Aviso
    que pede o que o jogo não entrega é barulho.
  · **A BARRA DE COMANDOS saiu de cima do palco.** O botão do
    portão/saída era o último que ainda ficava lá, com um rótulo
    comprido — "Canto do campo (leve o líder)" — deitado por cima dos
    discos. A função não se perdeu: **foi pro pad**, junto dos outros,
    com rótulo curto (SAIR, ou PORTÃO nos arredores) e no mesmo estado
    do botão do HUD, pela mesma porta. No computador o HUD segue como
    era.
  · Conferido nas duas orientações: nada com texto sobra por cima do
    palco, e apertar o botão do pad aciona o mesmo caminho de antes.

- **O ITINERÁRIO É DO JOGO DE HOJE** (bug pego pelo dono, 22/08/2026):
  a linha do dia lia `E.proximoJogo`, e "próximo jogo" é o jogo da
  SEMANA — o que pesa mais, com o mata-mata e o sábado na frente. Numa
  semana com dois jogos nossos, o dia de um jogo **em casa** na quarta
  vinha montado como a viagem do jogo de sábado: praças de estrada,
  véspera de caravana, tudo do jogo errado. Agora a linha pergunta pela
  agenda o que se joga hoje.
  · **E SÓ TOMA A AGENDA QUANDO PRECISA**: sendo o `proximoJogo` o jogo
    de hoje, quem manda continua sendo ele — é lá que moram a rota
    escolhida e o plano da semana. A troca só acontece quando o
    `proximoJogo` fala de outro dia.
  · A montagem da ficha do jogo virou função à parte (`estado.fichaDoJogo`),
    porque agora dois lugares precisam dela.

- **A POSIÇÃO NA TABELA NÃO PODE SER SPOILER** (bug pego pelo dono,
  22/08/2026): a mensagem "Hoje tem X × Y. O X está em 15º na tabela"
  é escrita ANTES de a bola rolar, mas depois de o dia já ter sido
  simulado — e a tabela lida sem cuidado já trazia o resultado de hoje
  dentro. Quem decorava a classificação sabia o placar antes do apito.
  Agora `posicaoNaTabela` aceita um `antesDe {semana, dia}` e a rodada
  daquele dia não conta. **Medido**: antes do jogo [6º, 5º], depois
  [4º, 7º] — a notícia diz 6º e 5º.

- **CADA TORCIDA NA SUA LINHA DA FAIXA** (correção do dono,
  22/08/2026): o placar mostrava UMA torcida por lado e somava o resto
  nela — no Castelão, os 30 da Jovem Garra Tricolor entravam na conta da
  TUF e a faixa dizia "Leões da TUF 187". Na arquibancada quem está lá
  são três torcidas, e cada uma responde pelo seu número. A conta agora
  sai do disco, que já sabia de que torcida é (`d.torcida`), e a lista é
  montada com TODOS os discos, vivos ou não: torcida que foi inteira ao
  chão continua na faixa com zero, porque sumir do placar seria a faixa
  contando outra história que a cena. Medido: 157 · 30 × 23, cada uma
  com a cor dela, e a soma batendo com o que está na tela.

- **O PAD INTEIRO TEM DE CABER** (bug pego pelo dono, 22/08/2026): em pé,
  a tela tem 420 px e o pad pedia mais — a fileira de ações cresceu
  (pedra, bomba, recuar, fugir, sair) e empurrou as **formações 1–4 pra
  fora da tela**. Medido antes do conserto: na treta sobravam 3 de 4
  formações visíveis; na defesa do bar, **nenhuma**.
  · **NÃO DAVA PRA CORTAR POR LARGURA FIXA**: o número de ações muda com
    a cena (treta não tem pedra nem bomba), então um corte acertaria
    numa e erraria na outra. É medida — o que as duas colunas precisam
    contra o que a tela tem —, pela mesma régua da faixa.
  · Não cabendo lado a lado, as formações sobem pra uma linha só delas
    (`wrap-reverse`: embaixo fica o que o dedo já procura, ações e bola).

- **A LNT — LIGA NACIONAL DAS TRETAS** (régua do dono, 22/08/2026): uma
  competição de treta 10×10 entre linhas de frente, duas por ano, uma
  em cada semestre, correndo POR CIMA do calendário — ela não substitui
  a treta marcada do trimestre nem o dia de jogo, ela ocupa o dia vazio.
  Nasce numa edição do **Futebol e Porrada** na primeira semana de 2027.
  · **O formato, divisão por divisão**: 1ª com 24 (4 chaves de 6, turno
    único, passam 4, oitavas → final, caem 4); 2ª igual à 1ª (sobem os
    4 semifinalistas); 3ª com 36 (6 chaves de 6, passam 4 = 24, os **8
    melhores do geral vão direto às oitavas** e os outros 16 jogam o
    16-avos; sobem 4, caem 6); 4ª com 54 (9 chaves de 6, os **32
    melhores do geral** entram no 16-avos, e depois das quartas há um
    **playoff dos perdedores** que dá mais 2 acessos — 6 no total).
  · **Os prêmios**: 1ª 300/150/100/50/30 mil; 2ª 100/50/30/20/10 mil;
    3ª 50/25/15/10/5/3 mil; 4ª 30/15/10/5/3/1,5 mil.
  · **O desempate da chave**: 3 pontos pra vitória, 0 pra derrota,
    depois **saldo de feridos** e depois **quantidade de rivais
    feridos** — quem bate mais e apanha menos passa na frente.
  · **AS QUATRO FINAIS NO MESMO DIA**: a 3ª e a 4ª têm cinco fases e as
    duas primeiras têm quatro, então a 1ª e a 2ª entram no mata-mata uma
    rodada depois. São dez rodadas por edição, uma a cada duas semanas.
  · **DECISÕES QUE O FORMATO EXIGIU, e que ficam registradas pra veto**:
    (a) são 139 torcidas jogáveis pra 138 vagas, então a que sobra fica
    de fora da edição e entra na seguinte **no lugar do pior da 4ª** —
    "a peneira"; (b) duelo de LNT **não tem aposta**: o dinheiro dali é
    prêmio de fase; (c) **recusar é W.O.** — a vaga é do rival, sem
    briga, sem ferido, sem prêmio, e o prestígio cai 2 (o dobro do que
    custa furar uma treta marcada); (d) os duelos entre IAs movem
    prestígio e baixa de verdade, mas **não mexem na relação** entre
    elas — competição não é rixa.
  · Medido: 24/24/36/54 antes e depois do sobe-e-desce, 45 pontos por
    chave de 6 (15 duelos × 3), 4 semifinalistas por divisão, 2 vagas
    pelo playoff, e nenhuma torcida em duas divisões.

- **A FORÇA DA IA É A DOS DEZ QUE DESCEM** (correção do dono,
  23/08/2026): o duelo entre IAs media a torcida pela **média de ficha
  do quadro inteiro**, novato dentro, enquanto o nosso lado escala os
  **dez melhores**. Duas réguas pro mesmo duelo — e a média do quadro
  ainda DILUI com o tamanho, então a torcida de 250 saía mais fraca que
  a de 30. Medido no começo de um jogo: o mundo inteiro cabia entre
  5,59 e 5,77 e **47% dos 9.591 pares empatavam na casa decimal**, o
  que jogava quase metade dos duelos no cara ou coroa. Agora a conta é
  a mesma dos dois lados — os dez que desceriam, na ordem em que a
  diretoria escala (linha de frente, componente, diretoria, novato) —
  e quem chega desfalcado perde força na proporção do que faltou.
  **Medido depois**: o mundo se abre de 8,50 a 11,50, os empates caem
  pra 1.941 pares, e a Gaviões de 250 passa a encabeçar a lista.

- **O FAVORITO GANHA PROPORCIONAL À VANTAGEM** (régua do dono,
  23/08/2026): o 70% cravado dava o mesmo resultado num duelo parelho e
  no mais desigual do mundo — medi 20.000 duelos entre os extremos
  (70,1%) e 20.000 entre dois separados por 0,002 de ficha (69,6%).
  Agora é uma rampa: **55% de igual pra igual, 80% quando um lado é 35%
  mais forte**, e nada passa disso. A conta é de RAZÃO e não de
  diferença, pra que a régua continue valendo quando as fichas do mundo
  subirem com os anos de treino. **Medido numa edição inteira** (427
  duelos entre IAs): parelho 54%, até 15% de vantagem 67%, até 30% 73%.

- **O COFRE DE SAVES** (pedido do dono, 23/08/2026): "toda vez que fecho o
  html eu perco o save". Fui medir e a causa não era o navegador — **era
  a cota**. O feed guarda tudo pra sempre (regra do dono) e cada notícia
  de jornal carrega a PÁGINA inteira em `dados`: a rodada da Gazeta
  sozinha é **84% anexo**. Numa partida corrida até 2031 o save chegou a
  **2.674 KB** e o `localStorage` recusou a gravação — e como quase
  ninguém lia o `{ok:false}` que `salvar()` sempre devolveu, **o jogo
  seguia sem salvar, calado**. Quatro consertos:
  · **O ANEXO VELHO NÃO VAI PRO SAVE.** Notícia com mais de 90 dias é
    gravada sem a página do jornal e volta como a linha de texto dela —
    que é como ela era antes de os jornais existirem. **Nenhuma mensagem
    some**, e decisão em aberto nunca é tocada (é o `dados` dela que
    guarda rival, aposta e fase da LNT). Medido: cinco anos de partida
    caem de 2.674 KB pra **1.751 KB**, e o save volta a caber.
  · **SEIS VAGAS**, a primeira sendo o autosave, na aba **Jogo**. As
    vagas 1 a 5 são pontos de retorno e **o autosave não pisa nelas** —
    a primeira versão deixava a vaga virar "vaga em uso" e o relógio
    passava por cima; ponto de retorno que anda não é ponto de retorno.
  · **DUAS SAÍDAS FORA DO NAVEGADOR**: arquivo `.json` e **texto
    comprimido em gzip** (`TO2z:` + base64), que é a única que funciona
    onde baixar arquivo é bloqueado. Medido: 678 KB de save viram 126 KB
    de texto.
  · **SAVE QUE FALHA GRITA.** `aoFalharSave` põe o motivo na tela na
    hora e deixa o alarme na aba Jogo, e o diagnóstico do armazenamento
    aparece já no menu de abertura. Perder cinco anos em silêncio era o
    pior desfecho possível, e agora ele não existe.
  · Fechar a aba salva (`beforeunload`): antes o autosave só gravava no
    fim da semana, então fechar o jogo na quarta jogava a semana fora.

- **AS BARRAS BRAVAS DOS NOVE PAÍSES** (pedido do dono, 23/08/2026):
  "as barras bravas originais de cada time, com a quantidade de membros
  de acordo com o tamanho estimado da torcida no país". Entraram **100
  barras** — Argentina 38, Colômbia 15, Chile 12, Uruguai 7, Peru 6,
  Equador 6, Bolívia 6, Paraguai 4 — cada uma com **nome real**, ano de
  fundação e bairro-sede de verdade (La 12 na Boca, Los Borrachos del
  Tablón em Núñez, Garra Blanca em Macul, Trinchera Norte no Rímac).
  · **O EFETIVO SEGUE A RÉGUA BRASILEIRA**, 20 a 250, com Gaviões e
    Jovem Fla no teto: 250 pra La 12, Los Borrachos e Garra Blanca; 230
    pra Barra Amsterdam, La Banda del Parque, Trinchera Norte, Comando
    SVR e Los del Sur; e a escada desce até 30 no clube pequeno.
  · **A PESQUISA TEM CRIVO**. Levantei 154 barras; **54 ficaram de
    fora** — quase todas de terceira divisão argentina e clube pequeno —
    porque a pesquisa não confirmou o nome. Nome de organizada que
    existe de verdade não se inventa; se o dono quiser, elas entram com
    nome gerado, mas só com a palavra dele.
  · **49 PRAÇAS NOVAS, 500 BAIRROS REAIS**, no mesmo formato das trinta
    brasileiras: Grande 16 bairros, Médio 12, Pequeno 8, quatro zonas
    equilibradas e as quatro classes com o multiplicador de sempre. Zona
    e classe seguem a geografia onde ela é conhecida — Las Condes nobre,
    Petare favela, El Poblado nobre, Villa Fiorito favela.
  · **A ALIANÇA FICA VAZIA, DE PROPÓSITO.** A barra brava não tem a rede
    de aliadas que a organizada brasileira tem. O grafo entrega o
    **clássico como maior rival** (Boca×River, Racing×Independiente,
    Colo-Colo×U de Chile, Nacional×Peñarol, Olímpia×Cerro,
    Millonarios×Santa Fe, Nacional×Medellín, Barcelona×Emelec,
    Universitario×Alianza, Bolívar×The Strongest, Caracas×Táchira) e
    **rival** pra quem divide praça ou divisão. Hermanamiento entra
    quando o dono mandar.
  · **`dados/barras.js` é arquivo à parte**, e entra depois de
    `cidades.js` e `torcidas.js`. As duas são geradas das fontes
    brasileiras, e regerar qualquer uma apagaria o mundo de fora se ele
    morasse lá dentro.

- **A LNT É DE UM PAÍS SÓ** (correção, 23/08/2026): com as barras
  dentro, `jogaveis()` foi de 139 pra 239 e a peneira despejava as 101
  sobrando na 4ª Divisão de uma vez — chave de 17 numa liga de 6, e a
  edição quebrava ao montar as rodadas. Além do defeito, "Liga
  Nacional" com La 12 e Garra Blanca dentro não é nacional. Agora a
  lista é a do **país da nossa torcida**, e país que não tem as 138 não
  funda liga nenhuma até o dono decidir o formato de lá. A troca com a
  fila de fora virou **um por um**, e quem não entrou continua na frente
  dela — antes a fila inteira entrava de uma vez e quem esperava era
  descartado.

- **O CLUBE DE FORA AINDA NÃO TEM DIA DE JOGO** (pendente, 23/08/2026):
  jogando com uma barra, a rua funciona inteira — treta, assalto, bar
  rival, rivalidade, notícia da Libertadores —, mas o **clube dela não
  entra em campo**: as nove ligas guardam só a classificação, sem
  jogos, e é do `E.temporada` que sai o dia de jogo. Ligar isso pede
  agendar a fecha da divisão do jogador uma semana à frente e ler o
  resultado de volta na tabela. Espera a palavra do dono.

- **TODO CLUBE DE FORA TEM BARRA** (régua do dono, 23/08/2026): "coloque
  o nome das 54 que você tem dúvida; as demais, coloque 'La Barra de
  Albion', por exemplo". Então os **248 clubes** dos nove países têm
  organizada, e cada registro diz de onde o nome veio:
  · **`origem: 'pesquisa'` — 100.** Nome, ano e tamanho confirmados.
  · **`origem: 'conferir'` — 54.** A busca achou o nome mas não fechou a
    confirmação. Entram assim mesmo, marcadas, pra quem quiser conferir
    depois: La Banda del Guapo, La Banda del Ferroviario, Los Marginales
    del Bío-Bío, Los Pijes, La Banda Lila, La Banda Auriazul…
  · **`origem: 'gerada'` — 94.** Não há nome nenhum na fonte, então o
    molde do dono monta um: "La Barra de " + o clube sem o genérico na
    frente (Deportivo, Deportes, Club, Sportivo, Atlético) e sem o
    sufixo de país. "La Barra de Albion", "La Barra del 2 de Mayo", "La
    Barra de Águilas Doradas". O corte do genérico só acontece quando
    sobra nome de verdade — "Atlético Grau" fica inteiro.
  · O efetivo de quem não tem pesquisa sai da qualidade do clube, na
    faixa de baixo da régua (22 a 48), que é onde mora clube pequeno.
  · **15 praças novas** (Sul de CABA, La Matanza, Santiago del Estero,
    Sul do Chile, Sul de Bogotá, Interior da Colômbia, Leste de
    Montevidéu, Interior do Uruguai, Norte do Peru, Ambato, Costa
    Equatoriana, Grande Assunção, Interior do Paraguai, Interior da
    Bolívia, Oruro e Potosí) fecham o mapa em **64 praças e 620 bairros
    reais**. Sem praça com bairro o clube não aparece na seleção.
  · **A aliança fica pra depois** ("depois fazemos as alianças com
    calma"): o grafo entrega clássico e rival, e `aliados`/`irmandade`
    seguem vazios até o dono ditar.

- **O PAÍS DO JOGADOR GERA OS JOGOS** (régua do dono, 23/08/2026): "o
  país cuja torcida que o jogador selecionar deve gerar os jogos e as
  demais geram somente as tabelas". Antes, quem escolhia uma barra não
  tinha dia de jogo nenhum: o dia de jogo nasce de `E.temporada`, e lá
  fora só existia resumo.
  · **O motor de formatos passou a agendar.** `ligas.js` sempre soube
    QUEM joga contra quem — o método do círculo é determinístico —, mas
    jogava tudo no mesmo instante e guardava só a classificação. Agora,
    e só pro país da nossa torcida, cada fase é agendada assim que os
    pares dela são conhecidos: uma **competição-sombra** entra em
    `E.temporada` no formato de `competicoes.js`, o `jogarDia` dele roda
    os jogos, e o motor lê o placar de volta na hora da fecha. Um lugar
    decide os pares, um lugar simula, e a tabela continua sendo a das
    ligas.
  · **O tique fechou a semana**: era quinta e virou domingo, porque a
    fecha é jogada no fim de semana e o tique tem que vir depois dela.
    Pelo mesmo motivo, `jogarDia` passou a rodar ANTES das ligas no
    `avancarDia` — se as tabelas andassem primeiro, leriam a fecha do
    dia ainda sem placar e sorteariam por cima.
  · **A copa nacional do país do jogador também é jogada**, e como ela é
    de jogo único quem decide empate é o `jogarDia`: o jogador ganha a
    **disputa de pênaltis na tela** em vez de um vencedor sorteado por
    baixo. Medido: 10 decisões por pênalti num ano de Copa Argentina.
  · **Quando o jogador é de fora, o Brasil vira resumo**, com as quatro
    séries no mesmo motor dos outros nove — turno e returno nas três
    primeiras, quatro grupos e playoff na D. `competicoes.js` só monta
    temporada pra jogador brasileiro; rodar os dois motores no mesmo
    país daria duas tabelas divergentes pro mesmo Brasileirão. Some o
    estadual e a Copa do Brasil, que é o preço da régua.
  · Medido com a La 12, três anos: **1.302 KB de save**, 19 ms por dia,
    74 dias de jogo do Boca, as três divisões argentinas e as quatro
    séries brasileiras fechando todo ano, e todas as divisões do
    continente mantendo o tamanho depois do sobe-e-desce.
  · Com jogador brasileiro nada mudou de lugar — só o peso: as 148
    barras novas põem mais 148 quadros em `mundoTorcidas`, e o save de
    três anos foi de 1.692 pra **1.844 KB**. O teto que matou o save era
    2.674 KB.

- **A CONMEBOL DE 2026 É A DE VERDADE** (pedido do dono, 23/08/2026): "a
  Libertadores e a Sul-Americana já devem iniciar em 2026 com os times
  reais". O ano 1 não tem temporada jogada pra decidir quem classificou,
  então ele sorteava as vagas pela qualidade do elenco — dava uma
  Libertadores plausível e errada. Agora `conmebol.js` carrega os **47
  clubes da Libertadores 2026 e os 44 da Sul-Americana 2026**, cada um
  na fase em que entrou de verdade, e de 2027 em diante quem decide é o
  campeonato do jogo.
  · **Libertadores:** 28 direto na fase de grupos (Flamengo, Palmeiras,
    Cruzeiro, Mirassol, Fluminense, Corinthians; Boca, Rosario Central,
    Lanús, Platense, Estudiantes, Independiente Rivadavia; Bolívar,
    Always Ready; U. Católica, Coquimbo; Junior, Santa Fe; LDU,
    Independiente del Valle; Libertad, Cerro Porteño; Universitario,
    Cusco; Peñarol, Nacional; La Guaira, UCV), 13 na Fase 2 (Bahia,
    Botafogo, Argentinos, O'Higgins, Huachipato, Tolima, Medellín,
    Barcelona, Guaraní, Sporting Cristal, Liverpool, Carabobo, Nacional
    Potosí) e 6 na Fase 1 (Alianza Lima, Táchira, U. Católica/EQU, 2 de
    Mayo, Juventud, The Strongest). Oito brasileiros e sete argentinos,
    porque Flamengo entrou como campeão da Libertadores e Lanús como
    campeão da Sul-Americana, liberando vaga na tabela de cada país.
  · **Sul-Americana:** 12 direto (São Paulo, Grêmio, Bragantino,
    Atlético-MG, Santos, Vasco; River, Racing, Riestra, San Lorenzo,
    Tigre, Barracas Central) e 32 na Fase Preliminar, quatro por país.
  · **A FASE PRELIMINAR VIROU NACIONAL**, e não só em 2026: é assim que
    a Conmebol faz — quatro clubes do mesmo país, dois duelos, dois
    passam. Antes o motor casava vizinhos numa lista ordenada por força,
    e saíam duelos internacionais que não existem. Agora a lista é
    agrupada por país antes de casar, o que reproduz o sorteio real
    (U. de Chile × Palestino, Atlético Nacional × Millonarios,
    Cienciano × Melgar, Caracas × Metropolitanos…).
  · Se a base de clubes mudar e a conta não fechar (28+13+6 e 12+32), o
    ano 1 volta sozinho pro sorteio por qualidade em vez de quebrar.

- **A LIGA DO PAÍS DO JOGADOR MOSTRA OS JOGOS** (pedido do dono,
  23/08/2026): "sempre mostrar jogos e classificação das competições do
  país que o jogador escolheu, com o mesmo visual que era antes". A tela
  de uma liga de fora nasceu só com tabela, porque só tabela existia.
  Agora que o país do jogador guarda partida com data, ele ganha o
  **painel de rodada com ‹ ›** do lado direito — mesmo lugar, mesmo
  desenho e mesmo `linhaJogo` da competição brasileira —, com a
  classificação à esquerda e o mata-mata descendo pro pé dela. A copa
  nacional do país do jogador segue a mesma regra: chave à esquerda,
  rodada à direita, como a Copa do Brasil. Os outros nove países
  continuam só com tabela, que é tudo o que eles guardam.
  · A rodada pode trazer o próprio rótulo, e a fecha de mata-mata da
    liga de fora se chama "Semifinal · ida", não "Rodada 18".

- **O FILTRO DO PAÍS VIROU BANDEIRA** (pedido do dono, 23/08/2026): "que
  as opções dos países na tela competições seja a bandeirinha
  correspondente e que todos os 10 estejam na mesma linha". Eram dez
  nomes escritos, que em duas linhas quebravam a leitura da tela.
  · **São desenhadas em SVG, não emoji.** A bandeira emoji não aparece
    no Windows — o navegador de lá mostra as duas letras do país no
    lugar do desenho, e a fileira ficaria com "AR" e "BR" escritos.
  · Cada uma é a bandeira civil simplificada **com o detalhe que separa
    as parecidas**: sem o escudo do Equador e as estrelas da Venezuela,
    Colômbia, Equador e Venezuela seriam três retângulos
    amarelo-azul-vermelho iguais. Entram também o sol da Argentina e do
    Uruguai e a estrela do Chile.
  · A fileira é `nowrap` e rola no eixo x em tela estreita: duas linhas
    de bandeira ficam ilegíveis. O nome do país fica no `title` e no
    `aria-label`.
  · A lista de países passou a sair dos clubes, não de `E.ligas`: antes
    ela nascia no primeiro tique da semana, e no dia 1 do jogo a linha
    tinha uma bandeira só e crescia sozinha depois.

- **O MEMBRO DE BARRA TEM NOME DE LÁ** (pedido do dono, 23/08/2026):
  "200 nomes agrupados com 200 sobrenomes genéricos desses países, com
  mais 150 apelidos". Está em `dados/nomes.js`, no bloco `hispano`, e
  quem comanda uma barra recruta dali em vez do banco brasileiro.
  · **200 nomes** (Adrián, Facundo, Lautaro, Nahuel, Ezequiel, Ceferino,
    Gumersindo…), **200 sobrenomes** que cobrem o continente e não um
    país só — Mamani, Quispe e Condori do altiplano; Cristaldo, Insfrán
    e Estigarribia do Paraguai; Cedeño, Loor e Mero da costa
    equatoriana; Huamán e Farfán do Peru; Riquelme e Sepúlveda do Chile
    — e **150 apelidos** em cinco famílias de trinta: o corpo (Gordo,
    Flaco, Zurdo, Cabezón), o bicho (Puma, Cuervo, Yacaré, Ñandú), o
    fogo e o ferro (Trueno, Facón, Martillo), o ofício (Albañil,
    Cartonero, Zafrero) e a origem (Salteño, Camba, Colla, Chapaco).
    Os cinco que o dono deu — La Pulga, Chino, Diablo, Tucu, Pibe —
    abrem a lista.
  · O **apelido continua sendo o nome de rua**: é ele que aparece na
    lista, na briga e no feed, como sempre foi. Nome e sobrenome entram
    na ficha do membro, numa linha nova ("Nome: Jaime Bonilla" para o
    Pato Bonilla). Membro brasileiro não tem primeiro nome no banco, e
    lá a linha simplesmente não aparece.
  · O figurante da cena de briga também segue o país: numa treta em
    Buenos Aires o disco se chama Zurdo, não Pitbull.

- **CADA PAÍS FECHA A CONTA DO ANO** (pedido do dono, 23/08/2026):
  "quando eu selecionar um país as competições dos demais países seguem
  aparecendo, mas somente mostrando a classificação e se tiver
  finalizado dizendo quem foi o campeão, o vice e os demais
  classificados pras competições Conmebol". A tabela dizia quem ganhou,
  mas não o que aquilo valeu.
  · Um quadro novo, **Vagas da Conmebol**, fecha a coluna da primeira
    divisão de qualquer um dos dez países: campeão e vice no alto, e
    embaixo a fila das vagas — Libertadores em ouro, Sul-Americana em
    prata —, numerada de ponta a ponta, porque o 5º do campeonato é o
    primeiro da Sul-Americana e mostrar "1º" ali faria parecer que ele
    ganhou alguma coisa. Só na divisão de cima: repetir o quadro na
    segunda seria dizer que a Primera B dá vaga na Libertadores.
  · A lista sai de `conmebol.vagasDoPais`, que aplica a mesma regra da
    montagem — a ordem do país menos os dois campeões continentais, os
    primeiros pra Libertadores e os seguintes pra Sul-Americana. Campeão
    continental do próprio país aparece à parte, com a nota de que entra
    fora da conta: é isso que dá ao Brasil oito clubes numa Libertadores
    de sete vagas.
  · Com a temporada em andamento o quadro mostra a projeção e avisa: "a
    temporada ainda corre — a lista muda com a tabela".
  · **`ordemDoPais` passou a valer o ano inteiro.** A tabela anual só
    nasce no fechamento do país, então no meio da temporada a função
    devolvia uma lista de um nome — o campeão do Apertura — e o quadro
    mostrava uma vaga de Libertadores e nenhuma de Sul-Americana.
    Faltando gente, entra agora a anual em construção, depois a tabela
    do torneio que está correndo, e por último o que sobrar pela força
    do elenco.
  · E **o campeão do ano abre a fila**, mesmo quando quem ganhou o
    torneio foi outro: numa liga com tabela anual dá pra ser campeão do
    país sem ter ganho o Clausura, e a primeira vaga é dele.

- **O BOTÃO DE SIMULAR** (pedido do dono, 23/08/2026): "um botão de
  simular em todas as ações de confronto. Esse botão vai rodar o motor
  de confronto de duas IAs pra definir o vencedor do duelo. As
  consequências nas relações, prestígio, etc continuam na mesma regra,
  independente se é simulado ou não."
  · **`js/diajogo/simular.js` não tem regra de consequência nenhuma.**
    Ele monta o mesmo objeto `res` que a cena entrega no apito final e
    chama o mesmo `aoTerminar`. Quem cobra prestígio, relação, ferido,
    preso, XP, moral e aposta continua sendo `fecharDiaDeJogo` e
    `aplicarResultadoDaNoite`, que não sabem se a briga foi jogada ou
    simulada. Era essa a promessa.
  · **A régua é a da briga entre duas IAs**: força é efetivo × ficha
    (força + defesa de cada um), o mais forte é o favorito, e o
    favorito vence **70%**. As fichas do outro lado saem do mesmo
    `fichasDoPerfil` que a cena usaria — simular não dá ao rival um
    bonde diferente. As baixas seguem a mesma tabela: quem perde deixa
    de 25% a 40% no chão e de 5% a 12% no camburão; quem ganha, de 8% a
    16% e de 1% a 4%. Quem cai é sorteado com peso invertido pela ficha.
    Medido em 1.600 duelos: favorito entre 66,7% e 72%, feridos
    ganhando ~11% e perdendo ~33%.
  · **O gêmeo nasce sozinho.** Em vez de escrever o botão à mão em cada
    mensagem — e esquecer de uma —, `propor` varre os botões e cria o
    par de todo `acao` que abre cena de briga. Mensagem de confronto
    nova já vem com Simular sem ninguém lembrar.
  · **Ficam de fora as que não são a briga, e sim o plano dela**:
    `tela-caravana` é a viagem inteira e `tela-ataque` é a emboscada
    marcada pro dia do jogo. Nas duas o confronto nasce lá na frente, e
    um Simular apertado antes ficaria de pé esperando — na melhor das
    hipóteses simulando a briga errada. Nessas quem pergunta é a própria
    cena, na hora de abrir, com um cartão de dois botões. O mesmo cartão
    atende o painel de Ações e a Diplomacia, onde não há mensagem pra
    pendurar botão.
  · **Um palco só**: as cinco portas de cena passaram a chamar
    `abrirPalco`, que escolhe entre a ponte e o simulador. O relatório
    de fim de noite é o mesmo, sem os 1,4 s de espera que a cena pede
    pra assentar, e ganhou a linha **"Força na rua"** — o duelo que o
    jogador não viu diz de que lado estava o favoritismo.
  · O que simular NÃO reproduz é a mão do jogador: na cena dá pra virar
    uma briga perdida com formação, pedra e o líder no lugar certo. O
    simulador só conhece ficha e efetivo. É o preço de pular a cena, e
    ele é sempre o mesmo dos dois lados.

- **CINCO CORREÇÕES DA JOGATINA DO DONO** (23/08/2026):
  · **O Simular faltava na linha do dia.** A briga da parada —
    emboscada na estrada, ataque na pista, investida marcada — não passa
    pelo feed, então ela não pegava o gêmeo que o `propor` cria. Agora
    ele entra na mão no cartão da parada, ao lado de quem desce.
  · **O placar da treta lia ao contrário.** O Futebol e Porrada mostrava
    o ferido DE cada lado: "TUF 6 × 36 Cearamor" queria dizer que a TUF
    perdeu seis e derrubou trinta e seis, e se lia como um 6 a 36 pra
    Cearamor — o número grande ficava do lado de quem apanhou. Agora
    cada lado exibe quantos **derrubou**, que é como placar se lê (o
    maior número é o de quem ganhou), o rótulo mudou junto e o vencedor
    vem marcado. O quadro da noite, ao lado, continua contando os
    feridos de cada um.
  · **O nosso jogo sempre tem planejamento.** O relatório do olheiro
    saía só quando havia rival hostil na rua — regra boa pro jogo dos
    OUTROS na nossa praça, e errada pro nosso: Fortaleza × Vitória com a
    TUF, com a irmã do lado e o visitante sem caravana, ficava sem
    logística nenhuma. Agora o nosso jogo sempre reporta; sem alvo, o
    texto diz que rival não tem e o botão de atacar não aparece.
  · **A rota era a do jogo errado.** `rotas()` lia `E.proximoJogo`, que
    é o jogo da SEMANA. Numa semana com dois jogos nossos, a linha do
    dia de um vinha com a estrada do outro: com a TUF jogando em
    Campinas, a volta saía por Porto Alegre, que era o destino do jogo
    seguinte. O itinerário já sabia perguntar qual é o jogo de hoje; era
    a rota que continuava respondendo pelo da semana. Agora o jogo entra
    por parâmetro. Medido: forçando a semana de dois jogos, a estrada
    ia pra Bahia com o jogo no Rio Grande do Norte; agora vai pro RN.
  · **O anuário ganhou a treta do ano e parou de ter página faltando.**

- **A TRETA DO ANO** (pedido do dono, 23/08/2026): "uma lembrança no fim
  do ano da briga que a torcida mais feriu/prendeu rivais". A conta é a
  dos **derrubados**: feridos mais presos que o vencedor deixou do outro
  lado numa noite só. Fica guardada em `E.tretaDoAno`, atualizada a cada
  briga fechada — nossa ou entre duas IAs —, porque o feed larga o anexo
  das notícias velhas depois de 90 dias e uma varredura de fim de ano
  não acharia mais a briga de janeiro.
  · **E TODAS AS PÁGINAS SAEM, SEMPRE.** O sobe-e-desce devolvia `null`
    em ano sem movimento, e o fim de ano vinha com quatro páginas em vez
    de cinco; agora ele diz que não houve. São seis: sobe-e-desce,
    torcida do ano, rei da pista, janela, patrimônio e treta do ano.
  · **O almanaque é um jornal NACIONAL.** Com as barras dentro, o
    ranking passou a somar 388 torcidas de dez países, e a Torcida do
    Ano de uma partida brasileira saía a Comando SVR, de Lima. Prêmio de
    ano é do país de quem joga: torcida do ano, rei da pista, patrimônio
    e treta do ano filtram pelo país da nossa torcida.

- **DOIS RANKINGS, EM ABAS** (pedido do dono, 23/08/2026): "o ranking de
  torcidas deve mostrar dois rankings agora, o do país e o do mundo, em
  abas separadas. A que vai pro cabeçalho do feed é a nacional."
  · A conta de pontos é **a mesma nos dois**; o que muda é quem entra na
    fila. `rankingDoPais` filtra o mundial pelo país da nossa torcida e
    renumera de 1 em diante, levando junto a posição continental de cada
    uma.
  · A tela **abre no país**, que é com quem a gente compete de verdade:
    numa fila de 388 torcidas de dez países, a organizada de interior
    aparecia em 200º por causa da Boca e da Colo-Colo. Na aba do mundo o
    país vem ao lado do nome.
  · **O cabeçalho do feed passou a ser o nacional** — o title dele já
    dizia "ranking nacional" desde 17/08, antes de ser verdade. O
    número do continente foi pro `title`: "12º no ranking nacional · 36º
    na América do Sul".
  · **A Torcida do Ano colhe do país**, e não do mundo: `slice(0, 8)`
    sobre a fila mundial podia entregar oito barras e deixar o país
    inteiro de fora do prêmio.

- **TEXTOS DA TRETA DO ANO APROVADOS** (crivo do dono, 23/08/2026): os
  moldes de chapéu, manchete e olho da página nova do anuário passaram
  sem alteração.

- **O LADO É O DA CENA, NÃO O DO CAMPEONATO** (correção do dono,
  24/08/2026): na emboscada de caravana a nossa torcida entra pela cena
  como **visitante** — o bonde deles é que fecha a pista, e o palco põe
  quem atacou nas pontas. Três telas liam `caidosVisitante` como "deles"
  e `res.venceu` (que diz se o MANDANTE ganhou) como se fosse o nosso
  veredito, e o dono recebeu, ganhando a briga, o cartão "Saímos por
  baixo. 0 caídos deles, 25 nossos · Prestígio +9".
  · O cartão da linha do dia (`itnVoltouDaCena`), o cartaz de fim de
    cena e o relatório da noite passaram a ler `res.nossoLado` pra
    decidir quem é "nós" e quem é "eles" — caídos, efetivo, quem
    escapou e as armas empregadas.
  · O veredito virou `res.ganhamos`, que já vem do ponto de vista do
    jogador. `res.venceu` fica onde ele vale: no mandante.
  · O mesmo cartaz da bancada de cenas (`mostrarFimNaCena`) foi
    corrigido junto, pela mesma régua.

- **QUEM ARMA EMBOSCADA NÃO RECUA DA PM** (correção do dono,
  24/08/2026): medido em seis emboscadas, em duas o atacante virava as
  costas sem levar um soco, sempre com o alerta em 100. Era o `iaRecuo`,
  calibrado pros arredores do estádio, onde existe cordão pra abrir
  distância. Na estrada não existe cordão: quem fechou a pista escolheu
  o lugar e a hora. `emb-posto` e `emb-onibus` ganharam `semRecuoPM` —
  a PM segue carregando e prendendo, o que ela não faz é cancelar a
  emboscada. Nova medição: 0 recuos em 8 cenas.

- **"CORREU COM A" NÃO DIZ QUEM GANHOU** (correção do dono,
  24/08/2026): "LEÕES DA TUF ERA MENOS E AINDA CORREU COM A CEARAMOR"
  lia-se dos dois jeitos — a TUF botou a Cearamor pra correr, ou a TUF
  correu junto com ela —, e em caixa alta ficava pior. O mesmo valia
  pro "mandou" solto. Os moldes de vitória em menor número passaram a
  usar verbo de uma leitura só: **venceu**, **botou pra correr**,
  **passou por cima** — o terceiro molde é palavra do dono: "{A} era
  menor mas mesmo assim passou por cima da {B}".

- **METADE DA DOSE DE TRETA MARCADA E DE BAR** (decisão do dono,
  24/08/2026): a rua estava chamando demais.
  · Calendário do trimestre: **1 a 2** tretas marcadas (era 2 a 4) e
    **3 trimestres com ataque ao nosso bar pra 1 sem** (era 1 a 2 por
    trimestre). Medido em 8 anos: 6 tretas/ano (eram 12) e 3 ataques ao
    nosso bar/ano (eram 6).
  · Sugestão de atacar o bar do rival: **15% das semanas** (era 29%),
    ou ~8 por ano contra ~15. Medido em 40 torcidas × 10 anos: 8,6/ano.
  · A conta vale pro mundo inteiro — as IAs puxam o mesmo sorteio por
    hash, então a rua inteira acalmou junto.

- **O RITMO DA NOTÍCIA É SEMPRE 1,5s** (correção do dono, 24/08/2026):
  ao fechar a briga, a fila inteira do feed era esvaziada de uma vez
  pra o resultado não esperar o próximo tique — e o jornal da rodada, a
  treta das IAs e o recado do diretor apareciam todos no mesmo instante.
  Na briga jogada isso passava despercebido (a cena leva 1,4s pra
  assentar); no duelo **simulado**, que abre o relatório na hora, virava
  rajada. Agora sai só a mensagem da briga e o relógio entrega o resto
  no compasso de sempre. De quebra, o **primeiro tique do relógio**
  também passou a ser de 1,5s quando há fila — ele abria em 450ms, o
  passo do dia calado, e colava a segunda mensagem na primeira. Medido:
  1501, 1501, 1502, 1502 ms.

- **A ROTA DE FUGA DÁ A VOLTA NO CORDÃO** (correção do dono,
  24/08/2026, vídeo da arquibancada): o disco em fuga ficava a cena
  inteira parado, empurrando o cordão da PM. O policial sempre foi
  obstáculo físico (`separar` não deixa atravessar PM), mas o campo de
  fuga só enxergava grade — a rota passava por dentro do cordão e o
  disco morria empurrando.
  · Cada boca de fuga agora tem DOIS campos: um que trata PM viva como
    parede (`desvia`) e o antigo, só com grades, de plano B. A escolha
    é: a boca mais perto com rota que desvia da PM; sem nenhuma, a rota
    que passa por cima (empurrar é melhor que ficar sem alvo). Como a
    PM anda (carga, reforço), o cache expira a cada 1,2s.
  · Disco em fuga que fica ~1s sem sair do lugar risca a própria saída
    do mapa por 5s e re-roteia pra outra boca no quadro seguinte.
  · Medido com uma boca tampada por 16 PMs em anel: antes, os 24 discos
    escolhiam a boca tampada e 13 morriam empurrando o cordão; agora,
    zero e zero — todo mundo sai pela outra boca.

- **O FUTEBOL E PORRADA PERDEU O PLACAR** (decisão do dono,
  24/08/2026): mesmo mostrando derrubados, o par de números grandes lia
  como jogo — e briga não tem placar. A página agora é chapéu, manchete
  e olho de um lado e o QUADRO DA NOITE do outro, protagonista:
  envolvidos, feridos e presos de cada torcida (número maior, pior
  número em vermelho) e a faixa "levou a melhor" embaixo.

- **FERIDO É FERIDO, PRESO É PRESO** (correção do dono, 24/08/2026): o
  bonde de 20 saía da cena com "20 feridos e 5 presos" — 25 baixas em
  20 homens. Dentro do combate `prender()` soma o preso também em
  `J.caidos` (lá "caído" é baixa total, e as réguas de debandada
  precisam disso), mas a ponte exportava o número cru e todo relatório
  somava presos por cima de novo. A fronteira da cena passou a entregar
  `caidos = J.caidos − presos`, que é a conta que o simulado sempre
  fez — relatório, cartaz, notícia, itinerário e LNT recebem a mesma
  régua. A fórmula do prestígio da noite foi junto: com o número cru, o
  preso pesava 1,5 de caído MAIS 2 de preso — 3,5 por cabeça, e só na
  cena jogada.

- **FERIDO NÃO VOLTA PRA BRIGA NA LINHA DO DIA** (régua do dono,
  24/08/2026): dois atritos no mesmo itinerário com as mesmas torcidas
  abriam a segunda cena com efetivo cheio. Agora o itinerário guarda,
  briga a briga, **quem sobrou de cada torcida** (`ITN.resta`, a partir
  do `res.efetivo` menos as baixas), e toda cena aberta pela linha —
  emboscada, ataque na pista, investida — corta o efetivo dos DOIS
  lados por essa sobra (com a caravana viva de teto extra no nosso).
  · O livro é de sobra, não de baixas: descontar baixas da fórmula
    descontava duas vezes, porque a ficha ferida já some da conta
    sozinha (medido: 101 − 15 dava 79).
  · Medido com duas emboscadas da mesma torcida: 1ª cena 101 × 59 com
    15 baixas nossas e 26 deles; a 2ª abriu **86 × 33** — exatamente
    101−15 e 59−26.
  · Fora do itinerário nada muda: o desconto de lá segue sendo os
    membros feridos e os lotes de baixas da IA.

- **A GRADE DE PÊNALTIS NÃO ENTREGA O VENCEDOR** (correção do dono,
  24/08/2026): as fileiras nasciam com uma bolinha por cobrança REAL —
  5 vagas de um lado e 4 do outro só existem quando a série morreu no
  5º do primeiro, então dava pra deduzir o vencedor antes da primeira
  batida. As duas fileiras agora nascem com as MESMAS vagas (5, ou
  mais se a série alongou no pé a pé) e a vaga que ninguém usou fica
  vazia: não precisou bater.

- **O MAPA DAS PRAÇAS** (pedido do dono, 24/08/2026): artefato em HTML
  (`docs/mapa-das-pracas.html`) com as 94 praças do jogo na posição
  geográfica real e as 23 rodovias — as 8 do Brasil e as 15 rutas
  Conmebol — desenhadas como corredores, com pan/zoom, tooltip por
  praça e realce por rodovia. Os TRECHOS desenhados (a sequência de
  praças de cada corredor) são a proposta de cima da qual as rotas de
  itinerário com emboscada vão ser construídas nos 9 países, na mesma
  régua da malha brasileira.
  · **A MALHA VIROU UMA SÓ** (decisão do dono, 24/08/2026): caem as
    ilhas. Dentro do Brasil entraram BR-116 Sertão (Interior do CE ↔
    Bahia), Rio–Bahia (Bahia ↔ BH), Fernão Dias (BH ↔ São Paulo) e
    BR-316 (Belém ↔ Maranhão — a Rodovia Norte não morre mais
    sozinha). Nasceram as **travessias de fronteira**: BR-174
    (Manaus ↔ Oriente da Venezuela), Bioceânica (Mato Grosso ↔ Santa
    Cruz), Rota do Pantanal (Mato Grosso ↔ Assunção), Rota do Chuí
    (Porto Alegre ↔ Montevidéu), Ponte da Amizade (Interior de SC ↔
    Interior do Paraguai) e Rota de Uruguaiana (Interior do RS ↔
    Litoral Argentino). Casos similares resolvidos do lado de lá:
    Ruta 11 (Assunção ↔ Litoral Argentino), Desaguadero (Sul do
    Peru ↔ La Paz), Arica (Norte do Chile ↔ La Paz), Ruta 20
    (Córdoba ↔ Mendoza) e General Paz (Oeste de CABA ↔ Buenos Aires —
    o Oeste só alcançava o centro passando por Mar del Plata).
    **94 de 94 praças conectadas**, conferido por busca em largura.
  · O artefato ganhou um **traçador de rota** (Dijkstra por km reais
    de haversine sobre os trechos desenhados). A simulação pedida —
    Fortaleza jogando em Santiago — sai com **5.613 km em 12
    trechos**: Interior do CE → Bahia → BH → São Paulo → Curitiba →
    Interior de SC → Interior do RS → (Uruguaiana) → Litoral
    Argentino → Rosário → Córdoba → Mendoza → Santiago. Cada parada é
    uma praça onde o itinerário pode armar emboscada.
  · A regra "entre as malhas só de avião" morre junto com as ilhas
    quando isso entrar no motor do jogo.

- **A MALHA FECHADA PELO DONO** (24/08/2026): revisão dele sobre o
  Mapa das Praças, que passa a ser **a planta que norteia a criação de
  rotas no jogo** — 94 praças, 45 rodovias. Entraram, a pedido: BR-364
  (Manaus ↔ Mato Grosso), BR-101 Sul (Curitiba ↔ Litoral Catarinense),
  BR-050 (Brasília ↔ Interior de Minas), BR-153 (Goiânia ↔ Interior do
  PR), Rota de Foz (Interior do PR ↔ Interior do Paraguai), Rota do
  Chaco (Interior da Bolívia ↔ Assunção), Rota da Patagônia (Sul do
  Chile ↔ Cuyo e Patagônia) e Ruta 22 (Interior de Buenos Aires ↔
  Cuyo e Patagônia). **Saiu** a Rota de Uruguaiana (Litoral Argentino ↔
  Interior do RS) — a porta terrestre do Sul é o Chuí. Conectividade
  conferida: 94 de 94; a simulação Fortaleza → Santiago fecha em
  5.571 km e 15 trechos, descendo o litoral e cruzando em Montevidéu.

- **O RELATÓRIO DO OLHEIRO SEM RIVAL NA RUA** (texto do dono,
  24/08/2026): "Dia de bandeira e nada mais?" virou **"Deve ser um dia
  tranquilo"**, e o botão "Só bandeira" virou **"Avançar"**.

- **A MALHA LIGADA NO MOTOR** (24/08/2026): a planta do Mapa das
  Praças virou `dados/malha.js` (94 praças, 45 rodovias, trecho a
  trecho) e o grafo do `planejamento` agora nasce dela — vizinho é a
  PRÓXIMA praça do corredor, não qualquer uma da mesma rodovia. Efeitos:
  · **O continente inteiro é alcançável por terra** — a regra "entre as
    malhas só de avião" morreu. Medido: das 94 praças, as 94 têm rota
    a partir de Fortaleza; SP → Rio passa pelo Subúrbio Carioca.
  · **O TRECHO PESA O QUE MEDE** (regra do dono, 24/08/2026): a rota
    curta é a de menor QUILOMETRAGEM real (haversine sobre as posições
    da malha), fiel ao "traçar rota" do mapa. Pesar 1 por salto
    empatava Fortaleza → Rio entre o sertão e o cerrado e o desempate
    era ordem de inserção — a linha do Vasco saía por Brasília. Agora:
    Fortaleza → Rio pelo sertão (Interior do CE → Bahia → BH → SP →
    Subúrbio → Rio) e Fortaleza → Santiago nos mesmos 15 trechos do
    mapa, pelo Chuí — e a linha do dia monta as praças da ida e da
    volta como paradas, cada uma com emboscada possível. O peso do
    desvio de rival acompanhou a régua (hostilidade × 16 km).
  · Viagem de 5+ trechos ganha o avião como alternativa (custo de
    sempre, sem emboscada).

- **CADA LADO FOGE PRA UM CANTO** (correção do dono, 24/08/2026):
  quando os dois bondes corriam, os dois escolhiam a boca mais perta e
  a tela mostrava caçador e caça fugindo abraçados pela mesma rua.
  Cada lado em fuga agora tem a SUA saída — a mais perto do centro do
  bonde, entre as que têm rota desviando da PM; se os dois escolhem a
  mesma e há outra, quem debandou POR ÚLTIMO cede a boca. Nos
  arredores nada muda: lá fugir é entrar pelo próprio portão. De
  quebra, guarda que debandou deixou de ficar plantado no posto (o
  ramo de guarda rodava antes do ramo de correr).

- **AS VAGAS DA CONMEBOL SAEM DA FOTO DA VIRADA** (correção do dono,
  24/08/2026 — "por que o Ceará tá na Libertadores?"): a edição nova
  monta na primeira rodada do ano, e a essa altura a virada JÁ TINHA
  trocado a temporada pela nova, zerada — `ordemDoBrasil` lia a Série A
  de 2027 com todo mundo em zero ponto, a "ordem" era a ordem de
  inserção da tabela, e o campeão da SÉRIE B (recém-promovido) abria o
  ano na Libertadores. Agora a virada tira uma FOTO da ordem de mérito
  dos 10 países ANTES de zerar qualquer coisa (`E.vagasConmebol`), e a
  montagem lê a foto. O painel de vagas continua na ordem viva: no meio
  do ano ele projeta a edição seguinte.
  · **Revisão completa das réguas**, medida num ano simulado inteiro:
    Brasil-Libertadores = campeão da Copa do Brasil + 6 primeiros da
    Série A (vaga sobrando desce a tabela — campeão duplo puxa o 7º);
    Brasil-Sul-Americana = os 6 seguintes (7º ao 12º); campeão da
    Série B fora das copas; os dois campeões continentais entram por
    vaga própria, sem roubar as do país.
  · **O campeão da copa nacional dos 9 países agora tem vaga** (regra
    real que faltava): entra logo atrás do campeão da liga na fila do
    país. Medido: Vélez campeão da Copa Argentina abriu a fila e foi
    pra Libertadores.

- **TRÊS VIRADAS DE VAGAS CONFERIDAS** (pedido do dono, 24/08/2026):
  simulação de 2026 a 2029, com as edições de 2027, 2028 e 2029
  conferidas clube a clube contra a foto de cada virada. As sete
  réguas passaram nos três anos — e no primeiro deles o Ceará foi DE
  NOVO campeão da Série B e desta vez ficou fora das copas, que era
  exatamente o bug de origem.

- **O DESCONTO DE FICHA POR FERIDO/PRESO CAIU PRA 30%** (régua do
  dono, 24/08/2026): ferido e preso seguem fora de cena e pagando
  moral, mas a marca na força e na defesa vale 30% do que valia.
  · Sequela de ferido: perda 0,2–0,5 → **0,06–0,15** (chance segue 15%).
  · Ferrugem da cadeia: 0,5 / 1 / 1,5 / 2 → **0,15 / 0,3 / 0,45 / 0,6**
    pela pena cumprida.
  · O espelho das IAs foi junto: SEQUELA_MEDIA 0,0525 → 0,01575 e
    CADEIA_MEDIA 1,0 → 0,3.

- **A CONMEBOL NO CALENDÁRIO DO CLUBE** (pedido do dono, 24/08/2026):
  a Libertadores e a Sul-Americana do clube do jogador deixaram de ser
  simuladas por baixo — cada fase dele é um jogo DE VERDADE, pela mesma
  porta da copa nacional (`copa-de-fora`): entra na agenda
  (`libertadores-de-fora`/`sulamericana-de-fora`), o feed noticia, a
  caravana viaja pela malha continental, e a edição LÊ o placar jogado
  em vez de sortear outro. No mata-mata o confronto do jogador decide
  em jogo único, como a copa nacional. Medido com a La 12: as 6 fechas
  do grupo do Boca na agenda, jogadas, e o placar da edição batendo
  jogo a jogo com o jogado.
  · **SORTEIO POR POTES** (pedido do dono): os 32 da fase de grupos em
    4 potes de 8 pela força, um de cada pote por grupo — cabeça de
    chave não cruza com cabeça de chave. Vale pras duas copas.
  · **A tela ganhou os jogos**, como a Série A: painel de rodadas
    navegável (prévia, fechas e mata em ordem cronológica, futuros com
    a chave do sorteio à espera), grupos à esquerda, vagas por país
    embaixo.
  · De quebra: a Sul-Americana jogava 5 das 6 fechas — o sorteio dos
    grupos comia a semana da primeira. O sorteio saiu pra véspera e as
    seis jogam.

- **A FÓRMULA NOVA DO RANKING** (régua do dono, 24/08/2026):
  `pontos = (membros + prestígio + ficha média × 5) × situação`.
  · **Membros contam TODOS** — ferido e preso seguem sendo da torcida;
    a régua parou de os punir duas vezes (a ficha já paga a cicatriz).
  · Prestígio na escala de 0 a 100, como sempre foi na tela.
  · Ficha média = (força + defesa) / 2, vezes cinco.
  · A situação financeira pesa de **0,8 a 1,2** (era 0,6–1,6):
    Endividado 0,8 · Muito ruim 0,88 · Pobre 0,96 · Estável 1,04 ·
    Bem 1,12 · Rico 1,2 — o caixa tempera o ranking, não o domina.
  · A fórmula velha era `(disponíveis + prestígio×2) × ficha ×
    situação` — multiplicar pela ficha esmagava a variação de membros
    e prestígio.

## Limpeza de telas e moral de 0 a 100 (decisão do dono, 24/08/2026)

- **Ranking sem a fórmula na tela.** O recado que explicava a conta dos
  pontos (a fórmula velha, ainda por cima) saiu da tela de Ranking; fica
  só a nota da aba América do Sul dizendo que aquela fila é do continente.
- **Calendário da torcida com os três turnos.** A célula do dia mostrava
  só o primeiro turno preenchido do expediente; agora manhã, tarde e
  noite aparecem, cada um na sua linha.
- **Agenda do time só do país filtrado.** O seletor "Ver agenda de"
  listava os 388 clubes dos dez países; agora acompanha o país escolhido
  na tela de Competições (sem filtro lá, vale o país do jogador). O time
  do jogador entra na lista mesmo fora do filtro.
- **"Pressionar o clube" saiu de Financeiro → Elenco.** O cartão sumiu
  da tela; a ação continua existindo no catálogo por baixo, só não tem
  mais botão.
- **Subaba Torcida → Hierarquia removida.**
- **Recrutamento em gente, não em população.** O cartão dizia "Fora de
  organizada 695 mil", que lia como população; agora diz "Possíveis de
  recrutar 695 pessoas" — o número é o mesmo alcance de sempre, o rótulo
  é que mentia a escala.
- **Moral de 0 a 100.** A moral passa a falar na mesma régua do
  prestígio: o indicador continua 0–20 por dentro (nenhuma mecânica
  mudou — "sem mexer em nada mais", palavra do dono) e a APRESENTAÇÃO
  multiplica por 5 — o painel Moral & Prestígio mostra "60 de 100" e o
  histórico mostra os deltas ×5 pros dois indicadores. A moral de ficha
  dos membros (a média do cabeçalho, a coluna da lista) segue na régua
  0–20 da ficha, junto de força e defesa.

## A reforma do comércio e o expediente novo (decisão do dono, 24/08/2026)

- **Bar e loja rentáveis (proposta aceita).** Receita bruta mensal: bar
  1.600/3.600/7.500 (era 800/1.500/3.000), loja 2.200/5.000/10.000 (era
  1.000/2.000/3.600). Ampliar baixou: bar 50/90 mil (era 80/150), loja
  60/90 mil (era 100/150). Compra, manutenção, insumo (25% da receita) e
  subsede ficaram como eram. Ponto novo passa a se pagar em ~2 anos.
- **Ação social e Campanha de recrutamento aposentadas** — as duas
  piores do expediente, por ordem do dono. Save antigo com elas na
  rotina só pula o turno.
- **Seis ações novas no expediente da sede:**
  · **Visita aos feridos** — grátis; cada ferido sara 2 dias mais
    cedo · Moral +0,3.
  · **Campanha de doação por PIX** — no lugar da "Vaquinha no sinal"
    proposta; grátis, arrecada R$ 8–15 por membro disponível,
    Prestígio −1 (régua de 0 a 100).
  · **Padrinho de treino** — R$ 150 de gratificação; com gente na
    velha guarda, a melhor ficha dela puxa o treino do dia: +15% de
    rendimento e novato ganha XP em dobro.
  · **Treino de bateria** — grátis, precisa de 6 de pé; o Fator
    Torcida volta por esta porta só: com a bateria ensaiada na última
    semana, o clube do jogador manda em casa com +20% da régua de
    força (11 dos 55 pontos do divisor do placar). O resto do mundo
    segue com placar puro.
  · **Inteligência** — R$ 100 por dia; o olheiro tem 50% de chance de
    prever cada emboscada de caravana e ataque não esperado.
  · **Inteligência ×2** — R$ 400 por dia; crava 100% dos ataques.
    Subir da simples pra dupla no mesmo dia paga só a diferença.
- **A campana do olheiro.** Um só funil: os três pontos onde o jogo
  marca ataque (concentração/pista da semana de jogo em casa, bar do
  trimestre, emboscadas da rota no itinerário) chamam o aviso. O
  sorteio de 50% é por hash — a mesma fita nunca é re-sorteada — e a
  chave impede aviso repetido. Textos do dono: "Chefe, descobri que a
  {torcida} vai atacar a gente quando passarmos por {praça}…" na
  estrada, "Fala presida, me passaram a fita…" na chegada, na
  concentração/pista e no bar. A diária paga vale 7 dias, porque o
  expediente não roda em dia de jogo nem de caravana.
- As diárias novas não poluem o extrato: caixa mexe na hora e a linha
  sai no fechamento do mês (PIX, campana e gratificação do padrinho),
  com o acumulado do mês corrente visível em Transações.

## Só existe a moral da torcida (decisão do dono, 24/08/2026)

- **Moral de membro extinta.** Saiu da lista de membros (coluna), do
  perfil, do cabeçalho (a média ⚡ virou a MORAL DA TORCIDA, régua de
  0 a 100) e de toda mecânica: ferir (−3), prender (−4), o resultado
  da noite por membro (preso −4 · caído −3 · vitória +1,5 · derrota
  −0,5) e o ±2/−1 da treta não mexem mais em ficha nenhuma. O campo
  fica parado na ficha por causa de save antigo e da cena. A
  realocação desses fatores está com o dono. As notas de treta que
  citavam "moral de quem foi" foram enxugadas porque descreviam a
  mecânica morta.
- **A moral manda no movimento.** Bar, loja e subsede multiplicam a
  arrecadação pela faixa da moral da torcida (régua de 0 a 100):
  ×0,4 de 0–10, subindo 0,1 por faixa de 10, até ×1,3 de 91–100.
  Vale na conta semanal, na tabela do Patrimônio e no balanço das
  IAs (com a moral delas).
- **Vitória não desconta moral — dois consertos:**
  · O `moralTorcida` da briga usava `venceu`, que é do ponto de vista
    do MANDANTE: ganhar de visitante (ataque a bar, jogo fora,
    itinerário) descontava −0,5 e perder pagava +1. Corrigido na cena
    e no simulado: vale `ganhamos`, e a debandada que pesa é a nossa.
  · A tabela da arquibancada dava Moral −2 na vitória em menor
    número. Nova linha de vitória: menor +2 · parelho +1 · maior
    +0,5 (derrota ficou como era: 0 / −1 / −2).
- **Pichar e colar adesivo e Ir à delegacia aposentadas** do
  expediente (a fiança individual continua no perfil do membro; a
  dica e a pendência que citavam a delegacia foram ajustadas).

## Classificações na mesma régua (pedido do dono, 24/08/2026)

- As tabelas de classificação empilhadas (grupos da Série D, Copa do
  Nordeste etc.) desalinhavam entre si: o layout automático media as
  colunas pelo maior nome de time de cada grupo. Agora a tabela usa
  `table-layout:fixed` com largura cravada nas colunas de número (34px,
  29px no celular) — toda classificação tem o MESMO espaçamento — e o
  nome fica com a sobra, cortando com reticências quando não cabe.

## Uma página por fase (pedido do dono, 24/08/2026)

- Competição com mais de uma fase ganhou um navegador de fases na
  coluna da esquerda — as mesmas setas ‹ › da rodada, na ordem das
  fases. A Libertadores anda Fase 1 → Fase 2 → Fase 3 → classificação
  da fase de grupos (os oito grupos numa página) → Oitavas → Quartas →
  Semi → Final; a Copa do Brasil, da Primeira Fase à Final; Nordestão
  e afins abrem na Classificação e seguem pro mata. A tela abre na
  fase corrente. Competição de fase única (Série A) segue sem setas.
  A coluna dos jogos (rodadas) ficou como era.
- **Fase 1 e 2 da prévia da Libertadores agora ficam guardadas**: os
  duelos eram resolvidos e jogados fora — só a Fase 3 ia pra chave, e
  as duas primeiras páginas nasceriam vazias. De quebra, elas passam
  a aparecer também na linha do tempo das rodadas.
- **Placar numa linha só**: a coluna do meio do duelo tinha 26px
  fixos — "2 × 1" não cabia e descia de linha — e nome comprido
  dobrava o resto. O meio agora estica pro placar e os nomes cortam
  com reticências (na lista de jogos e na chave).

## Média de público e Histórico por competição (pedido do dono, 25/08/2026)

- **Dois botões em toda competição** (Brasileirão e copas, estaduais,
  Libertadores/Sul-Americana, ligas e copas de fora):
  · **Média de público** — quanto cada organizada põe no estádio em
    casa (60% do efetivo vivo; a nossa leva os aptos) e, no quadro ao
    lado, a média como visitante (a caravana típica: 18% do efetivo,
    +30% com ônibus). É a mesma régua que o dia de jogo já usa.
  · **Histórico** — os maiores campeões e a lista de campeões e vices
    por ano, real. Os anos jogados (2026+) emendam por cima da base,
    marcados "no jogo", e contam nos maiores.
- **Base real em `dados/historia.js`** (~370 edições), verificada:
  Série A 1959–2025 completa com vices (Taça Brasil e RGP contam, como
  a CBF conta); Série B 1971–2025; Série C 1981–2025; Série D
  2009–2025; Copa do Brasil 1989–2025 completa; Copa do Nordeste;
  Libertadores 1960–2025 completa com vices; Sul-Americana 2002–2025;
  Paulistão e Cariocão ano a ano de 1971 pra cá com a contagem de
  títulos da história inteira; Mineiro de 2016 e Gauchão de 2011 pra
  cá (contagens completas); ligas estrangeiras na era recente com as
  contagens históricas; Copa Argentina desde 2011-12. Onde a
  documentação confiável acaba, a lista declara a nota em vez de
  inventar dado — Catarinense/Paranaense ano a ano, Venezuela e as
  demais copas nacionais entram por partes.
- O repositório BrasileiraoManager citado pelo dono não está acessível
  a esta sessão (só Jogo-torcidas e sistema-esporte-paraipaba); a base
  foi levantada por pesquisa, com os campeões de 2025 confirmados um a
  um.

## Sede e ônibus no ranking (pedido do dono, 25/08/2026)

- O ranking ganhou duas colunas só de informação, entre Prédios e
  Saldo: o nível da sede (n1–n5) e a quantidade de ônibus. Não entram
  no cálculo dos pontos — o tooltip do cabeçalho avisa. A nossa linha
  lê o estado do jogador; as IAs leem o mundo vivo (a frota delas já
  respeita o teto da sede, como sempre).

## Nome de gente e o histórico que não se perde (pedido do dono, 25/08/2026)

- **Banco de nomes brasileiro**: 400 nomes próprios e 200 sobrenomes,
  todos únicos, com os apelidos atuais mantidos — só apelido deixava o
  jogo artificial. O apelido segue sendo o nome de rua (lista, briga,
  feed); nome e sobrenome são a identidade da ficha, que agora sai
  completa ("Caio Matos" na ficha do "Viga Matos"). As listas
  `simples`/`compostos` ficaram como eram: os JOGADORES de futebol do
  mundo tiram os nomes de lá.
- **O botão Histórico do menu nacional e sua tela saíram**: o
  Histórico por competição supre melhor.
- **O histórico das demais ligas agora chega na tela e não se perde:**
  · As ligas de fora e as copas nacionais SEMPRE arquivaram os
    campeões ano a ano (`ligasHistorico`, `conmebolHistorico` com as
    copas juntas) — mas a tela nova não lia esses arquivos, e os dois
    cortavam em 12 anos. Agora o Histórico de cada liga de fora lê o
    arquivo (com Apertura/Clausura em linhas próprias), as copas
    nacionais também, e os cortes subiram pra 80 anos.
  · `E.temporada.titulos` (Brasil) cortava em 200 entradas (~13
    anos); subiu pra 800.
  · O campeão do ANO CORRENTE, decidido antes da virada, entra na
    frente da lista em toda competição.
  · Trocar de país no filtro passa a resetar a vista, como a troca de
    competição já fazia.

## Sub-sede em outra cidade (decisão do dono, 26/08/2026)

Da chuva de ideias sobre filiais, o dono aprovou o pacote com estas
réguas:

- **Abrir**: exige sede nível 3 e pelo menos 60 de prestígio (12 na
  régua interna), sempre. Custa R$ 90.000; subir de nível custa
  R$ 70.000. Limite por sede-mãe: n3 banca 1 filial, n4 banca 3, n5
  banca 8.
- **Núcleo local**: teto de 20/40/80 membros nos níveis 1/2/3 da
  filial, somado à lotação da matriz. (Confirmado pelo dono em
  26/08/2026 — o "200+30" do exemplo dele era engano, vale 20/40/80.)
- **Receita**: a mesma régua da subsede, vezes o multiplicador de
  bairro da CIDADE da filial (bairro fixado por hash) e o fator
  comercial×moral de sempre. Manutenção de subsede por nível.
- **Recrutar**: mesma regra e mesmo dado de hoje; o novato entra pela
  sede OU pela filial, sorteado pelo peso das vagas de cada casa, e
  cada casa exige torcedor fora de organizada na praça DELA. A
  mensagem diz "(N pela subsede de fora)".
- **Rota mais segura**: perna de caravana passando por cidade com
  filial nossa tem metade da chance de emboscada.
- **Olheiro fixo**: emboscada em cidade de filial SEMPRE sai avisada,
  campana paga ou não — o núcleo local é o olheiro.
- **Jogo na cidade da filial**: todos os membros daquele núcleo vão
  pro jogo, somados à caravana normal dos demais.
- **Ataque nos dois sentidos**: torcida de fora com filial na NOSSA
  praça pode atacar a gente aqui, com o efetivo do núcleo dela e o
  nome decorado ("Jovem Fla Sub-Sede Fortaleza") nas mensagens de
  sofrido de sempre. Sem bonde de socorro: quem defende é quem está
  lá. Nossa filial atacada também se defende SOZINHA, resolvida por
  simulação no feed normal.
- **Sem planejamento de jogo alheio**: jogo na cidade da filial que
  não é do nosso clube NÃO gera mensagem de planejamento. Nossos
  ataques por lá chegam como sugestão esporádica do olheiro da filial
  (~a cada 12 semanas por filial, com núcleo ≥6 e hostil na praça),
  com decisão "Atacar"/"Não atacar" (o dono achou "Manda descer"
  brega, 26/08/2026).
- **Hospedagem de aliado**: aliado jogando na cidade da nossa filial
  é hospedado pelo núcleo — +2 de relação, silencioso.
- **Feed**: tudo da filial cai no feed normal, bem menos frequente
  que a cidade-sede (defesa 0,5%/dia por filial — dose do dono,
  26/08/2026; ataque de filial inimiga pede núcleo ≥6 e relação
  ≤−55).
- **Ranking**: coluna "Filiais" com a contagem de subsedes de fora
  (só informação, não pontua).
- **IA**: entram na fila de compras ('filial' depois de subsede,
  'evoluir:filial' no fim); ao comprar, priorizam a cidade com MAIS
  torcedores do clube delas (fora a própria praça); mesmas travas de
  sede/prestígio/limite; núcleo começa com 8 e cresce ~1 membro a
  cada 3 semanas até o teto (dose do dono, 26/08/2026).
- A ideia do mapa (16) foi recusada: o mapa será reformulado de outra
  forma depois.

## A fila de compras rodante das IAs (decisão do dono, 26/08/2026)

O dono viu a simulação de 3 anos com só 7 torcidas de filial aberta —
as sede n4 morriam pagando bares, lojas e ônibus antes de chegar na
filial — e mandou duas coisas:

- **A filial subiu na fila**: a ordem-base virou mma, loja, bar,
  FILIAL, elenco, ônibus, subsede, bombas e as evoluções.
- **Uma por vez**: cada torcida agora carrega a própria fila, que
  RODA — comprou um bar, a vez do próximo bar vai pro fim da fila
  dela, e assim com tudo. Ninguém enfileira três bares seguidos
  enquanto a filial espera; o patrimônio cresce em rodízio. A sede
  segue fora da fila (é destravadora) e comprá-la não roda nada: o
  item travado fica com a vez. Save antigo ganha a fila na ordem-base
  (chave nova entra no fim, aposentada sai).

Efeito medido em 3 anos simulados: de 7 torcidas com filial (12 no
mundo) pra 40 torcidas (58 filiais), várias já ampliadas pra nível 2
— e em troca as IAs acumulam menos ônibus e prédios repetidos, que
era exatamente o "uma por vez" pedido.

## O dropdown da subsede e a população sem "mil" (pedido do dono, 26/08/2026)

- **Um botão só pra abrir subsede de fora**: em vez de uma oferta por
  cidade na vitrine do Patrimônio, uma única oferta "Abrir subsede em
  outra cidade" com um dropdown do destino dentro — todas as
  candidatas listadas, da maior base pra menor. A compra vai pelo
  valor selecionado ('filial:cidade'), a cidade comprada some do
  dropdown, e cidade fora da lista não passa.
- **A população dividida por mil, na verdade**: o número da planilha
  é o número de verdade — era "60 mil torcedores do Fortaleza na
  praça" e virou "60 torcedores do Fortaleza na praça". Corrigido no
  dropdown da subsede e no cartão "Torcedores do clube" da tela da
  torcida (o "Possíveis de recrutar" já estava em pessoas desde
  24/08).

## Três retoques no feed (textos do dono, 26/08/2026)

- **Relatório do olheiro**: "Chefe, o relatório de hoje. Nós saímos
  com até N. Vamos pra cima de alguém?" virou "Chefe, esses são os
  jogos dos próximos dias na cidade. Nosso bonde vai pro jogo com N
  membros. Fale as ações das torcidas." (a variante de rua vazia
  manteve o fecho "e rival na rua não tem. Deve ser um dia
  tranquilo").
- **Convite do bar rival**: "o bar da X no bairro tá de porta aberta
  e gaveta cheia. Bora quebrar o balcão?" virou "Chefe, chegou a
  informação que o bar da X tá cheio deles lá, a gente quer dar o
  bote neles e roubar o caixa do bar."
- **A presença da partida virou tabela**: o "Mandante: A 54 · B 20.
  Visitante: C 140 · D 12." saiu do texto corrido e virou tabela de
  linha única no cartão, uma coluna por torcida com a cor primária na
  borda esquerda — mandantes primeiro, visitantes depois (célula
  levemente destacada), rolando na horizontal quando não cabe.

## Todo ocorrido mexe no prestígio (ordem do dono, 27/08/2026)

O dono abriu um save com uma torcida do América e um ocorrido no
estádio não creditou prestígio. A revisão geral dos fechos de cena
achou a causa e dois furos de fidelidade:

- **A causa**: o prestígio genérico da noite é
  `arredonda((caídosDeles×2 − caídosNossos×1,5 − presosNossos×2)/3)`
  — em briga pequena ou parelha (venceu com 1×1 caído, 2×2...) isso
  arredonda pra ZERO, e nos encontros de rua/arredores do estádio e
  no ataque a bar essa conta era a única fonte do nosso prestígio: a
  mensagem saía e o indicador não andava.
- **O piso**: vitória agora vale no mínimo +1 na régua de 0 a 100,
  derrota no mínimo −1 — aplicado no fecho do dia de jogo (cenas
  jogadas e simuladas) e nos fechos da filial. A pressão no CT fica
  fora (não é confronto de torcida); treta e arquibancada seguem só
  com as tabelas próprias do dono.
- **Fidelidade das linhas**: `aplicarResultadoDaNoite` agora carimba
  no resultado o que ENTROU de verdade (`prestigioAplicado`,
  `moralAplicada`), e as linhas de efeito dos ocorridos leem daí — no
  teto de 100 a mensagem não promete crédito que não houve, e no
  fecho de DEFESA a linha passou a somar a parte da cena (antes
  mostrava só o ±0,7 fixo e escondia o resto que entrou).

## Grupos regionalizados na divisão inferior (pedido do dono, 27/08/2026)

Os grupos da Série D deixaram o sorteio por força (zigue-zague) e
viraram cortes CONTÍGUOS do mapa, como na Série D real:

- **O método**: os clubes são ordenados pela cadeia de UFs de norte a
  sul (RR→…→RS; dentro da UF, pela cidade — times da mesma praça caem
  sempre juntos) e a fila é fatiada em grupos iguais. O Grupo A é o
  mais ao norte, o D o mais ao sul; a fronteira pode dividir uma UF
  quando a conta não fecha (CE metade no A, metade no B), mas nenhum
  grupo "volta" no mapa.
- O playoff da D já cruzava grupos vizinhos (A×B, C×D), então virou
  cruzamento de vizinhos de mapa de graça.
- A régua é automática: vale pra qualquer divisão nacional que abrir
  em grupos (`cfg.regional`), refeita a cada virada com a safra nova
  de subidos/rebaixados.
- Fora do pacote (sem mudança): Copa do Nordeste e Nordestão Série B
  continuam com sorteio misto (na vida real o sorteio da CdN é misto
  mesmo, e os clubes já são todos do NE); estaduais são de um estado
  só; ligas de fora não têm dado de geografia.

## Ferido de IA não vai ao estádio (conferência do dono, 27/08/2026)

O dono mandou conferir se a conta de membros de torcida IA que vão
ao jogo descontava os feridos. Não descontava: a régua certa já
existia (`disponiveisIA` = membros vivos − feridos/presos anotados
por `baixasIA`), mas os três caminhos de presença usavam o número
cru:

- **Rua da praça em dia de jogo** (`naRuaEm`): torcida da casa saía
  com `membros × 0,6` sem desconto — agora `disponiveisIA × 0,6`.
- **Caravana de visitante** (`caravanaDe`): pior, usava o número
  ESTÁTICO da fonte (nem o efetivo vivo entrava) — agora parte de
  `disponiveisIA`, e de quebra a caravana passou a acompanhar o
  crescimento real da torcida no mundo.
- **Tabela de presença da partida** (feed): mesma troca.

O nosso lado já usava `aptosParaOEstadio` (ferido/preso fora) — a
assimetria acabou.

**E vale SEMPRE (ordem do dono, na sequência)**: nasceu o
`efetivoDePe` (nosso lado = aptos; IA = `disponiveisIA`) e toda conta
de briga passou pela régua — defensores do bar nos alvos de ataque,
tamanho do bonde rival na cena de defesa, estimativa do relatório do
olheiro, alvos do dia de jogo, regra da nanica (ataque ao bar e
ataque-surpresa, dos DOIS lados), candidatas a emboscada na estrada,
paridade dos encontros de rua e a descida da filial. Ficam com a
contagem crua só o que é quadro, não presença: recrutamento
(organizado ferido ainda é organizado) e as colunas de membros do
ranking.

## As três assimetrias da economia IA fechadas (decisão do dono, 27/08/2026)

Da conferência jogador × IA, o dono mandou fechar as três vantagens
que sobravam pro mundo:

- **Caravana paga**: semana com jogo fora da praça cobra da IA a
  mesma régua do jogador — por cabeça (viagem média de 2 trechos, R$
  42), a torcida banca 40% (o rateio dos embarcados cobre o resto) e
  a frota abate 30% por ônibus até zerar com três. Caravana de 30 sem
  ônibus: R$ 504.
- **Fator comercial**: o balanco delas passou a multiplicar bar, loja,
  subsede e filial pela mesma conta do jogador — 0,7 + prestígio×0,4
  + tamanho×0,3 — com o prestígio e o efetivo DELAS. IA nanica parou
  de faturar como média (nanica×gigante mede razão 1,89, a mesma da
  régua 0,73→1,4).
- **Filial pelo bairro da cidade dela**: a receita da filial da IA
  deixou o multiplicador da sede-mãe e passou pro bairro sorteado da
  CIDADE da filial (`multFilial` com dono), como a do jogador.

Medido 1 ano rodado com as três ligadas: 0 torcidas no vermelho,
caixa média R$ 28 mil — a estrada cobra sem afundar ninguém.

## Nome de rua e o elenco fixo de cada torcida (pedido do dono, 27/08/2026)

- **~60% de nome próprio na rua**: os nossos membros agora atendem em
  ~60% dos casos pelo próprio nome (Thales, Pedro...) e só o resto
  tem apelido. Quando a rua chama pelo nome, a ficha bate com ele
  ("Pedro Matos" na ficha, "Pedro" na lista e na briga). Medido: 62%
  em 600 criados.
- **Elenco fixo por torcida, do país certo**: os figurantes de TODA
  torcida — brasileira ou estrangeira — têm nome sorteado por hash do
  nome da torcida e da posição na fila: o membro nº 7 da Jovem Fla se
  chama igual em todo save, em toda cena. A régua dos 60/40 vale pra
  eles também, no banco do PAÍS da torcida (a barra argentina desce
  com Benjamín e Yacaré, não com Pitbull — antes o figurante usava o
  banco da NOSSA torcida e reembaralhava a cada cena). Filial com
  nome decorado ("X Sub-Sede Y") acha a torcida-mãe pelo prefixo, e o
  contador por cena evita repetição sem quebrar a fila fixa.

## A concentração de jogo fora é na praça DELES (correção do dono, 27/08/2026)

O dono flagrou no save do Sangue Americano: jogo fora em Itu e a
"Ultras Madureira caiu em cima da nossa concentração" — torcida da
NOSSA praça atacando numa cidade onde ela não estava. Duas pontas:

- **O vazamento**: numa semana de dois jogos, o ataque-surpresa era
  marcado pro jogo de CASA (o `proximoJogo` da semana), mas o
  itinerário do jogo de meio de semana FORA consumia o marcado —
  ele só conferia ano e semana. O marcado agora carrega a CIDADE do
  ataque e o dia, e o itinerário só o aceita se a praça e o dia
  baterem com o jogo daquela linha. Marcado de save velho, sem
  cidade, só vale em casa.
- **A fonte certa**: semana de jogo fora ganhou o próprio sorteio de
  ataque-surpresa — torcida hostil DA PRAÇA DO MANDANTE pode cair na
  nossa concentração ou pista lá, com a mesma chance da régua de
  casa. A nanica se mede contra a CARAVANA que viajou (não contra a
  torcida inteira em casa), e sub-sede nossa naquela cidade é
  olheiro fixo do aviso, como nas emboscadas.

## Recuado bate de costas (correção do dono, 27/08/2026)

O dono viu que a briga fica fácil de definir quando um lado recua: o
laço de contatos PULAVA o lado em recuo inteiro — recuado não dava
um soco enquanto o outro lado seguia batendo, e apertar R (ou a IA
decidir recuar) virava sentença. Agora o recuo segue mandando o
disco de volta pro spawn (o ramo de movimento não mudou), mas quem
COLAR nele leva o golpe normal: recuo reposiciona, não desarma. Só a
debandada (`fugindo`) continua sem revidar — quem virou as costas de
vez não briga, e é nela que valem o 1,6× e o agarrão de quem
alcança. Medido em treta 12×12: o lado recuado, que dava 0 de dano
por definição, devolveu ~1.300 de dano e derrubou gente, seguindo
apanhando no recuo.

## Data de fundação real dos clubes (pedido do dono, 27/08/2026)

O aniversário do clube lia só o ANO da fonte e sorteava o dia por
hash. Entrou `dados/fundacoes.js`: dia e mês REAIS de fundação de
215 dos 356 clubes — todos os grandes e médios do Brasil e os
principais dos 9 países —, aplicados por cima de times.js na carga
(a fonte não se reescreve). A tubulação do feed já preferia
`fundacaoDia/fundacaoMes` quando existem, então o evento passou a
cair na data histórica: "Dia 18/10 o Fortaleza completa 108 anos."
Os 141 clubes menores sem data conferível seguem no sorteio por hash
(determinístico); o dono pode completar a lista quando quiser — é só
adicionar `id: [dia, mes]` no arquivo.

## A recepção do aliado: bloco na mensagem, conta no dia do jogo (dono, 28/08/2026)

O dono flagrou que o custo de hospedar aliado não entrava nas
despesas — a recepção só era paga quando o jogador CONFIRMAVA a tela
de planejamento; decidindo pelo padrão, a despesa nunca caía. O
pacote:

- **O bloco na mensagem do olheiro**: abaixo da tabela dos jogos, a
  lista de aliados que vêm pra cidade — nome, clube, número EXATO de
  membros e o dia do jogo — com os quatro botões (Não
  receber / Hospedar na sede / Hospedar e escoltar / Churrasco e
  escolta), cada um mostrando o custo total e a relação. A escolha
  acende na hora e fica anotada no plano; os botões apagam depois de
  paga. E o bloco BATE com a tabela de cima (correção do dono,
  31/08/2026): cada mensagem do olheiro cobre os jogos que reportam
  naquele dia, então só entra aliado cujo jogo está listado ali —
  aliado de jogo que reporta noutro dia sai na mensagem daquele dia.
- **A conta vira no DIA DO JOGO do aliado** (`cobrarRecepcoes`, no
  relógio diário): paga o combinado por cabeça, move a relação da
  tabela — não receber cobra a dela também, o que antes nunca
  acontecia — e carimba como pago. Sem caixa, vira 'nada'. O
  pagamento saiu da confirmação do planejamento.
- **Escolta destacada**: escoltar destaca 10 membros nossos (ou os
  aptos que houver). A escolta das IAs anfitriãs segue os 5–10%.
- **A cena da hostilidade com escolta**: o aliado atacado na nossa
  cidade abre a cena com TRÊS bondes — os nossos 10 com a nossa cor e
  ficha de membro, o bonde do aliado com a cor e a ficha gerada DELE,
  e o rival. O jogador comanda os dois primeiros (bonde `controlado`:
  segue a formação do nosso líder e obedece R e F), e as consequências
  de ferido/preso continuam só nos nossos 10.

## O esfriar passivo das relações morreu (ordem do dono, 31/08/2026)

A relação não anda mais sozinha de volta pra base: saiu o puxão
semanal de 5% que derretia tanto as nossas relações quanto as das
IAs entre si — aliança construída ficava escorrendo pro neutro, e
ódio comprado em briga ia embora de graça. Agora só EVENTO move o
ponteiro: briga, recepção, escolta, aniversário, reunião, hospedagem
de filial. A CONVIVÊNCIA do dono (17/08) ficou de pé — +1 por mês
sem hostilidade, −1 por dois meses sem ajuda — porque lê as marcas
de briga e ajuda reais, não o relógio puro.

## Manchete por cenário no Futebol e Porrada (pedido do dono, 31/08/2026)

O jornal ganhou um segundo baralho de manchetes: além das filas por
CONDIÇÃO (atropelo, sufoco, era menos, camburão…), cada CENÁRIO de
briga tem 3 manchetes de vitória e 3 de derrota — pelo menos 6 por
cenário, como o dono pediu. Os grupos: arquibancada (estadio-10/20/40),
emboscada de caravana (emb-posto/emb-onibus), bar, comércio (comercio/
loja), casa da torcida (sede/subsede/ct), praça, rua (rua/media/nobre),
arredores do estádio, treta marcada (beco/galpão/campo) e LNT. As
regras do baralho:

- **Mesma fila, mesmo relógio**: as manchetes do cenário entram na
  MESMA fila das manchetes por condição, e a escolha continua
  determinada pelo dia — a mesma briga dá sempre a mesma página.
- **{A} é sempre o vencedor**: como o mesmo molde serve pra quando
  atacamos e pra quando defendemos a mesma cena, nenhuma frase diz
  quem atacou nem quem era a caravana — só quem venceu, e toda
  manchete nomeia os DOIS lados.
- **Empate e "ninguém desceu" ficam de fora**: são condições sem
  vencedor e seguem só com os moldes próprios.
- Cena sem grupo (ou save antigo sem cena) segue só com as manchetes
  por condição, sem quebrar.

## Manchete de apoio a aliado (pedido do dono, 31/08/2026)

O baralho por cenário ganhou o grupo APOIO: quando a escolta desce
junto do aliado atacado, o fechamento da briga carimba o aliado na
mensagem de confronto (`dados.aliado`) e o jornal monta a página de
apoio — chapéu próprio ("Desceu junto") e 3 manchetes de vitória +
3 de derrota com o `{AL}` (o aliado escoltado) nomeado. O grupo de
apoio passa NA FRENTE do grupo da cena, porque a notícia é a aliança
na porrada. Briga comum segue sem carimbo.

## Bomba a R$400 e custo fixo do comércio dobrado (reajuste do dono, 31/08/2026)

- **Bomba**: R$120 → **R$400 a unidade**. O lote de 5 da IA acompanha
  (R$600 → R$2.000): mesmo preço unitário dos dois lados.
- **Custo fixo mensal de bar e loja dobrou**: bar 240/480/900 e loja
  300/600/1.080 por nível (eram 120/240/450 e 150/300/540). A subsede
  ficou como era, e a IA paga pela mesma tabela (o balanço dela lê
  `FIN().MANUT` direto — sem assimetria).

## Presença no jogo: a régua do jogador vale pra IA (ordem do dono, 31/08/2026)

Mandante e visitante IA vão pro jogo pela MESMA conta da nossa torcida:

- **Em casa vai todo mundo de pé**: caíram os 60% — a IA mandante põe
  o `disponiveisIA` inteiro na rua (menos escoltas destacadas), como
  nós levamos todos os aptos.
- **Fora viaja a caravana da vontade**: `de pé × limitar(0,72 − 0,09×2
  trechos + 0,4×moral, 0,08–0,95)` — a mesma fórmula da nossa
  `estimativaCaravana`, com a viagem média de 2 trechos que a estrada
  delas já assume no custo e risco zero (elas não traçam rota).
  Morreram os 18%, o "cresce com a relação com a gente" e o "ônibus
  enche 30%" — ônibus só barateia, como pra nós.
- A régua nova alcança tudo que refazia a conta velha: tabela de
  presença da partida, rua da praça, alvos da viagem, encontro da
  viagem, relatório do olheiro (que agora lê caravana pra quem vem de
  fora e efetivo inteiro pra quem joga na própria praça — os 62%
  avulsos morreram) e o painel de média de público.
- **O redutor do visitante** (calibragem do dono, mais tarde no
  mesmo dia): a caravana da IA é a régua do jogador **× 0,6** — na
  régua cheia a estrada lotava demais. A nossa caravana segue sem
  redutor: o corte é só na quantidade que a IA põe na estrada.
- Sondagem de 1 ano simulado: 386 torcidas IA, nenhuma no vermelho
  (a caravana maior custa mais, mas o comércio segura).

## O escritório de advocacia (pedido do dono, 31/08/2026)

Advogado se contrata no Financeiro, no molde da comissão técnica:

- **R$ 5.000 por mês por advogado**, cobrados no fechamento do mês —
  nada sai do caixa na contratação.
- **Cada advogado corta 10 dias de cadeia** de todo membro preso, em
  duas portas: prisão NOVA já sai com a pena reduzida (piso de 1 dia —
  preso entrou, a ficha registra), e a CONTRATAÇÃO alivia na hora quem
  já está dentro (quem zera é solto já, e a ferrugem cobra só o que
  ele de fato cumpriu).
- **Demitir é livre**: sem multa, a mensalidade para no próximo
  fechamento e pena já cortada não volta.
- **Aparece em Patrimônio > Estrutura** (correção do dono,
  31/08/2026): o advogado contratado ganha linha na tabela como a
  comissão técnica — nome, nota do corte e a despesa de R$ 5.000/mês.
- **Escada própria da sede**: nível 1 não comporta nenhum, o 2
  comporta 1, o 3 comporta 2, o 4 quatro e o 5, oito. Sede menor não
  conta o que não cabe (mesma régua dos professores).
- **As IAs também têm** (pedido do dono, mais tarde no mesmo dia):
  'advogado' entrou na fila de compras delas com o cofre de três
  meses de folha que a fila já exige do professor. A posição foi
  calibrada em três rodadas do dono: atrás do ônibus ninguém
  contratava (48 de 386 em 3 anos), colado no professor contratava o
  mundo inteiro (329 de 386) — assentou **depois do bar** (4º da
  ordem). A
  mesma régua inteira: R$ 5.000/mês na fatia semanal do balanço,
  escada da sede 0/1/2/4/8, prisão nova de IA já sai com 10 dias a
  menos por advogado, a contratação alivia os lotes de `presosIA` na
  hora (lote que zera é solto) — e no vermelho o advogado é o
  primeiro a ser dispensado, antes do professor de MMA, porque é a
  folha mais cara.

## Despesa do bar dobrou de novo (reajuste do dono, 31/08/2026)

"Despesa de bar tá com valor muito baixo": a manutenção mensal do bar
foi de 240/480/900 pra **480/960/1.800** por nível — a segunda dobra
do dia. Loja e subsede ficaram como estavam, e a IA paga pela mesma
tabela.

## A catraca do recuo nos arredores (análise e ordem do dono, 31/08/2026)

O adversário SEMPRE recuava nos arredores, e a causa era uma catraca:
romper a grade (rotina ali — entrar no estádio empurra o cordão)
ligava `rompido`, que cravava o alerta da PM em 100 a cada tique até
o fim da noite; o recuo do visitante arma com alerta > 78 e só
desarma com alerta < 62 — matematicamente impossível depois do
rompimento. O dono mandou aplicar as opções 1 e 2 da análise:

- **O alerta solta quando a carga acaba**: o `rompido` só crava 100
  enquanto a carga da PM dura (`t ≤ cargaAte`); recomposta a linha, o
  alerta decai no ritmo normal (−1,2/s) e o rival volta pra briga
  quando a PM afrouxa. Medido na cena viva: 100 → 90 → 57 e o
  `recuoVisitante` desarmou sozinho.
- **O reforço reseta abaixo do limiar**: chegava zerando o alerta em
  64 — dois pontos ACIMA dos 62 que desarmam o recuo — e segurava o
  visitante recuado à toa. Agora reseta em 56.
- A opção 3 (semRecuoPM nos arredores, como na arquibancada) ficou
  de fora por ordem do dono.

## A descida da sub-sede abre cena (ordem do dono, 31/08/2026)

O "Atacar" da sugestão do olheiro da filial ("mapeou o bar da...")
resolvia por simulação. Agora ABRE A CENA do ataque a bar, jogável:

- A cena de ação aceita **escalação própria** (`cena.escalacao`): quem
  desce é o núcleo da sub-sede, com ficha real de cada membro — não os
  aptos da cidade-sede.
- Defensores seguem a régua de antes (35% do efetivo de pé do rival,
  entre 4 e 40), e o fechamento passa pela porta de sempre
  (`fecharAtaque`): prestígio, dano no bar e consequência de ferido e
  preso no núcleo de lá.
- Núcleo com menos de 4 de pé continua não descendo ("Não rolou").
- A nota do botão mudou junto: "abre a cena com o núcleo da sub-sede —
  a briga vale prestígio como qualquer ataque a bar".

## Coluna "Origem" em Torcida > Membros (pedido do dono, 31/08/2026)

Torcida com sub-sede ganha uma coluna a mais na tabela de membros,
entre Função e Idade: **Origem** — "Sede" pra quem é da matriz, o
nome da cidade pra quem é do núcleo da filial. A coluna ordena (Sede
antes das sub-sedes) e a busca acha pela origem também. Sem filial,
a tabela segue com as sete colunas de sempre.

## A vida da subsede, corrigida e completada (ordens do dono, 31/08/2026)

Três acertos no mesmo pacote:

- **O núcleo da filial IA entra no TOTAL de membros**: a Cearamor
  abria subsede e seguia com os mesmos 200, porque `f.membros` era um
  contador paralelo. Agora o recruta da filial soma no `t.membros`
  (migração única pra save antigo conta os núcleos existentes), e o
  teto de recrutamento diário da sede ganhou o tamanho dos núcleos —
  quem mora na filial não come a vaga de quem recruta na cidade-mãe.
- **Fundar subsede destaca gente da sede**: 1 diretor + 2 linha de
  frente descem pra abrir a filial — na nossa, os aptos de ficha mais
  fraca de cada cargo (pra não desfalcar o bonde principal), com
  registro no histórico; na IA, o núcleo nasce com 3 (mudaram de
  cidade, não de torcida — o total não muda na compra) e cresce no
  ritmo de sempre.
- **Subsede × subsede na mesma cidade**: duas torcidas com filial na
  mesma praça (Gaviões e Jovem Fla em Fortaleza) podem se pegar por
  lá — passa semanal, núcleos com 6+, relação entre as duas abaixo de
  −20, chance pequena que cresce com o ódio e a briga delas. A briga
  entra em `brigasIA` com os bondes do tamanho dos núcleos, e o
  jornal dá a nota. Irmãs e torcidas do mesmo clube ficam de fora.

## A caravana silenciosa da subsede (ordem do dono, 31/08/2026)

No dia de TODO jogo — em casa e fora — o núcleo de cada filial tenta
se deslocar pra praça da partida. Régua:

- **Sem feed e sem itinerário**: nenhuma mensagem, nenhuma parada —
  só a transação do custo no extrato.
- **Rota sempre a mais curta** (Dijkstra da malha do dono), e o custo
  no padrão da caravana normal: por cabeça e por trecho
  (18 + 12×trechos), 40% pra torcida, frota abatendo 30% por ônibus.
  Sem caixa pro frete, ninguém embarca.
- **Quem embarca**: núcleo de pé × a vontade do jogador
  (0,72 − 0,09×trechos + 0,4×moral). Na IA, com o redutor de
  visitante (×0,6), e o destino sai dos jogos da semana do clube.
- **A estrada cobra**: chance pequena (5% nossa, 4% IA) de a caravana
  do núcleo se pegar com torcida hostil da praça de destino — a nossa
  resolve por simulação e cai no feed como briga normal (cena
  emb-onibus, ferido e preso em quem viajou); a da IA entra em
  brigasIA com o bonde do tamanho do que embarcou.

## O bote na caravana rival (ordem do dono, 31/08/2026)

Quando o clube de uma torcida hostil (relação ≤ −15) joga como
visitante na cidade de uma subsede NOSSA, a caravana deles está na
pista ou na praça — e o olheiro de lá propõe a descida por mensagem
(núcleo com 6+; caravana rival com 5+, senão nem viajou). O "Atacar"
abre a CENA (praça ou pista, sorteio estável por dia) com a escalação
do núcleo contra a caravana QUE VIAJOU — o efetivo rival é o
`caravanaDe` da mensagem, não a torcida inteira. O fechamento passa
pelo fecharAtaque de sempre. Texto da mensagem aguardando o crivo.

## Crivo do dono (31/08/2026): textos aprovados

O dono aprovou em bloco os textos que aguardavam crivo: as 60
manchetes por cenário + 6 de apoio a aliado do Futebol e Porrada
(com o chapéu "Desceu junto") e a mensagem do bote na caravana rival
("Chefe, a caravana da... Manda dar o bote?"). Estão todos de pé.

## Manutenção da subsede: 700/1.200/1.800 por nível (reajuste do dono, 31/08/2026)

A manutenção mensal da subsede saiu dos R$ 90 fixos pra uma tabela
por nível — **700 / 1.200 / 1.800** —, valendo pra subsede LOCAL
(sempre nível 1: R$ 700) e pra FILIAL em outra cidade (pelo nível
dela). A IA paga pela mesma tabela. Nota de régua: a subsede rende
R$ 600/mês × bairro × fator, então no custo novo ela deixa de se
pagar sozinha — passa a ser estrutura de estratégia (recruta, núcleo,
presença), não fonte de renda.

## O perfil das torcidas (crivo do dono, 31/08/2026)

Toda torcida tem perfil, aberto em OVERLAY pelo nome dela nas tabelas
e quadros (texto corrido fica de fora, por ordem do dono). As abas:

- **Visão geral**: clube, praça, fundação, membros e de pé, moral e
  prestígio na régua de 100, relação com a gente, placar de brigas do
  ano, torcida irmã.
- **Patrimônio**: sede, bares/lojas por nível, subsedes, filiais com
  núcleo, ônibus, professores, advogados, bombas, fábrica. A CABEÇA DA
  FILA de compras NÃO aparece (ordem do dono: sem espionagem de graça).
- **Membros**: a MESMA tabela de Torcida > Membros. O elenco é FIXO E
  UNIVERSAL (ordem do dono): o membro nº 37 da Cearamor é o mesmo
  homem em qualquer save — nome do banco determinístico, cargo pela
  pirâmide da fonte, ficha na régua do povoarInicial (base por cargo
  + 0..3, por hash), idade e XP idem. O que é vivo entra por cima:
  o tamanho (t.membros), ferido/preso de hoje (lotes) e a origem
  (núcleos de filial no fim da lista).
- **Brigas**: placar do ano + as últimas brigas registradas.
- **Finanças**: caixa, balanço mensal e o EXTRATO DE VERDADE — a IA
  passou a guardar um anel de 36 lançamentos (semana fechada, compras
  da fila, caravanas, saque sofrido).

Links aplicados na onda 1: ranking, Diplomacia, tabela de presença da
partida, painel de média de público, quadro da noite e notas do
jornal, bloco de recepção de aliado.

**Onda 2 (ordem do dono, mais tarde no mesmo dia)**: o nome da
torcida vira link também no TEXTO CORRIDO de toda mensagem do feed
(e na consequência), na tabela do olheiro, nos alvos da tela de
ataque e nos alvos da tela de caravana. O casamento de nomes é do
maior pro menor ("Fúria Jovem do Botafogo" ganha de "Fúria"), o
texto é escapado antes (HTML em mensagem continua sendo texto), e
clicar no nome dentro de uma opção seleciona E abre o perfil.

## O perfil das cidades (pedido do dono, 31/08/2026)

Mesmo estilo do perfil da torcida, em overlay, aberto pelo nome da
cidade. Duas abas:

- **Visão geral**: UF e região, tamanho e população, metrô,
  policiamento (PMs, guardas, tropa de choque), os TIMES da praça com
  torcedores e estádio (capacidade), outros estádios, rodovias e as
  VIZINHAS PELA ESTRADA (cada uma com o próprio link, via grafo da
  malha).
- **Torcidas e estruturas**: as torcidas DA CASA numa tabela — nome
  (link), membros, sede, bares, lojas, subsedes — e o quadro das
  SUBSEDES DE FORA, com nível e núcleo de cada torcida que plantou
  casa ali (a nossa inclusa).

Os links de cidade seguem o cano dos de torcida: texto corrido das
mensagens (cidade homônima de CLUBE fica de fora do texto — num
"ABC × Fortaleza" o Fortaleza é o clube; torcida homônima ganha da
cidade), Praça e filiais no perfil da torcida, coluna Origem das
tabelas de membros, linhas de filial no Patrimônio > Estrutura e a
cidade das notas do jornal.

## Escudos e capas de cidade (pedido do dono, 01/09/2026)

O dono mandou trocar os quadradinhos de cor por escudos (exceto os
discos das cenas) e pôr foto turística no cabeçalho do perfil da
cidade. A REDE deste ambiente barrou quase tudo (organizadasbrasil,
Wikipedia, OneDrive — só GitHub e registries passam), então o pacote
saiu em duas partes:

- **A fiação, completa**: convenção `img/escudos/clube-<id>.png` e
  `img/escudos/torcida-<id>.png` + manifesto gerado
  (`dados/escudos.js`). Onde houver escudo, o chip vira `<img>`; sem
  arquivo, o quadradinho de cor continua. Aplicado na tabela do
  olheiro (clubes e torcidas), no ranking, no perfil da torcida
  (clube) e no perfil da cidade (times). A capa da cidade lê
  `img/cidades/<id>.jpg` sob um gradiente — sem foto, fica só o
  gradiente, sem quebrar.
- **Os escudos que a rede deixou**: 35 clubes importados da coleção
  FCLOGO do GitHub (Flamengo, Fluminense, Botafogo, Palmeiras + a
  elite argentina, Boca incluso), 64px, 240KB no total.
- **Pendentes da rede/pack do dono**: escudos dos demais clubes
  brasileiros e sul-americanos (o dono tem pasta no OneDrive — chega
  por anexo ou por sessão nova com a política de rede liberada),
  escudos das torcidas (organizadasbrasil) e as fotos das cidades.
  Chegando os arquivos, é só salvar nas convenções acima e regerar o
  manifesto que tudo acende sozinho.

## O perfil da cidade enxuto e por zona (ordens do dono, 01/09/2026)

Três acertos na tela:

- **Visão geral enxuta**: saíram Onde, Tamanho, Metrô e Policiamento
  (o UF·região já mora no subtítulo) — ficou só a QUANTIDADE: a linha
  "População". O estádio já tinha saído na ordem anterior.
- **A fatia de cada time**: ao lado dos torcedores, a porcentagem
  daquela torcida na cidade — a divisão da praça entre os clubes
  (torcedores do clube ÷ soma dos torcedores da cidade).
- **Torcidas e estruturas POR ZONA**: a tabela "Da casa" ficou só
  torcida × membros, e as estruturas viraram seções por zona (na
  ordem dos bairros da cidade), cada linha dizendo a estrutura, a
  dona (com link) e o BAIRRO. O endereço da IA não se sorteia: a sede
  vem da fonte (`bairroSede`) e bar/loja/subsede saem de hash fixo
  por torcida e índice — o mesmo espírito do "endereço não se
  sorteia" do jogador. Subsedes de fora entram na zona delas com
  nível e núcleo.

## Os escudos do acervo do dono — 108 brasileiros (02/09/2026)

O dono subiu o acervo dele de escudos (a pasta do ranking, em dois
rars) e mandou completar os 108 clubes brasileiros do jogo de uma
vez. O casamento foi por nome com normalização (acento, sufixo de
UF, apelidos tipo "América Mineiro" → América/MG, "Vasco da Gama" →
Vasco), com a UF do arquivo desempatando homônimos (Vitória-ES NÃO
casou com o Vitória-BA; os três Botafogo cada um no seu). O primeiro
rar cobriu 85; o segundo, os 23 que faltavam.

- Conversão no padrão da leva do FCLOGO: 64×64 RGBA, escudo centrado
  em fundo transparente, `img/escudos/clube-<id>.png`.
- Manifesto `dados/escudos.js` regenerado do que existe na pasta:
  139 clubes (108 brasileiros + 31 argentinos do FCLOGO). Os 4
  brasileiros que vinham do FCLOGO (Flamengo, Fluminense, Botafogo,
  Palmeiras) foram sobrescritos pela versão do acervo do dono.
- 51 escudos do acervo ficaram de fora por serem de clubes que não
  existem no `times.js` (Brusque, Tombense, Aparecidense…).
- Escudos de TORCIDAS seguem zerados — aguardando fonte.

## A onda 2 dos escudos — quadradinho nenhum fica (ordem do dono, 02/09/2026)

"Substitua os quadrados com a cor primária dos times pelos escudos em
todas as partes faltantes, substituindo inclusive na tela seleção de
torcidas." Os nove pontos que ainda pintavam `<i>` cru de cor de clube
passaram pelo cano do `chipClube` (imagem quando há escudo, quadradinho
quando não): classificação das ligas, jogos da rodada, vagas da
Conmebol, classificação dos outros países, célula de jogo do
calendário, cabeçalho e agenda do time. A tabela da LNT e as brigas
pelo país usam `chipTorcida` (sem pack de torcidas ainda, seguem no
chip — mas já pelo cano novo).

- A SELEÇÃO DE TORCIDA: o `escudo()` de gradiente+sigla ganhou o
  parâmetro `marca` (['c', clubeId] ou ['t', torcidaId]) — a coluna de
  clubes do passo 1 mostra o escudo de verdade; passo 2, ficha e faixa
  do topo ficam prontos pro pack de torcidas (hoje caem no gradiente).
- CSS: cada contexto já dimensionava o `<i>`, então `.to-escudo` herda
  a medida do lugar (13px na célula do mês, 16px nas tabelas, 22px no
  "quem" da agenda); a coluna da `.vaga-cm` alargou de 11 pra 16px.
- Os DISCOS das cenas ficam como estão, por ordem antiga do dono.

## As bandeiras do banco — flag-icons (ordem do dono, 02/09/2026)

"Procure um banco com as bandeiras de todos os países pra inserir no
seleção de torcidas e substituir em competições." Entrou o
**flag-icons** (lipis, MIT, npm v7.5.0) — o banco cobre o mundo
inteiro em SVG 4×3; os dez países do jogo foram copiados pra
`img/bandeiras/<iso>.svg` e servem pelos mesmos canos dos escudos
(`IMG()` + dicionário do arquivo único).

- SELEÇÃO DE TORCIDA: o selo "BRA"/"ARG" escrito virou a bandeira do
  país na coluna do passo 1 (país sem arquivo cai na sigla escrita).
- COMPETIÇÕES: a fileira do filtro nacional trocou os dez SVGs
  desenhados à mão pelo desenho oficial do banco — o dicionário
  `BANDEIRAS` de paths saiu do main.js, ficou só o mapa país→ISO.
- Se um dia entrar país novo, é copiar o SVG do banco pra pasta.

## O tutorial no jogo (crivo do dono, 02/09/2026)

Depois de maquetado em artefato à parte e aprovado texto a texto, o
tutorial entrou no jogo de verdade (`js/gestao/tutorial.js`):

- O CONVITE é a primeira decisão da partida, pelo cano normal do feed
  (`abertura`, chave `abertura|tutorial`): "Bem vindo ao jogo, chefe…"
  com "Mostra o jogo" e "Já sei jogar — pular". Pular marca
  `E.tutorial` e responde com a consequência aprovada ("…o 'Como
  funciona' fica no menu do Jogo").
- O PASSO A PASSO são 15 passos num cartão em overlay (o tempo pausa):
  4 de indicadores — um por passo, com o círculo dourado pulsando no
  número certo da FAIXA (prestígio ⭐, moral ⚡, recrutar nos membros
  👥; relações sem círculo) — e 11 de telas, cada um ABRINDO A TELA
  REAL atrás (com os dados do save), clicando a subaba certa
  (Membros, Patrimônio, Expediente, Alianças, Rivalidades, Brigas) e
  circulando o pedaço que o texto descreve. Textos todos do dono, ao
  pé da letra.
- A BRIGA SIMULADA fecha o tutorial NA CENA DE VERDADE (ordem do
  dono, 02/09/2026): 5×5 na praça pelo palco real — joystick de
  toque, formações, PEDRA (Q), BOMBA (E, 3 de cortesia), recuo e
  fuga —, contra o nosso pior desafeto, com o rival descendo como
  BONDE de 5 (pelo efetivoRival a cena arredondava por spawn e 5
  virava 6). O fecho descarta o resultado: nem ferido, nem preso,
  nem bomba do estoque, nem dinheiro, nem prestígio (provado no
  teste). Os balões do dono ficam por cima e avançam quando o
  jogador FAZ a coisa (mexeu, jogou); o do movimento foi adaptado
  do "mouse" da maquete pros controles reais (WASD/direcional) —
  ÚNICO texto fora do pé da letra, marcado pra crivo.
- "COMO FUNCIONA" no painel Jogo reabre o passo a passo quando
  quiser — é o que a mensagem de pular promete.

A maquete (artefato separado) fica como documento de design.

## A torcida do clube nas cidades é viva (ordem do dono, 02/09/2026)

"Preciso fazer um fluxo dinâmico da evolução da quantidade de
torcedores do time por cidade por ano." A planilha virou só o ponto
de partida; o valor corrente mora no save (`E.torcedoresEv`,
"cidade|clube" → n) e evolui na VIRADA DO ANO
(`TO.mundo.evoluirTorcedores`, chamada junto do sobe-e-desce):

- FOI BEM (campeão de qualquer série nacional, acesso, ou G-4 da
  Série A): a torcida dele sobe 3 a 5% em CADA cidade. FOI MAL
  (rebaixado, ou entre os 4 últimos da Série D): perde 3 a 5%. Quem
  cai nos dois no mesmo ano fica neutro.
- CRESCIMENTO VEGETATIVO: cidade Grande ganha 30–50 pessoas/ano,
  Média 10–20, Pequena 5–10 — repartidas de forma NÃO proporcional
  (pesos sorteados) entre os clubes que JÁ têm torcida na praça.
- Todos os leitores passam pelo helper `torcedoresDoClubeNa`:
  base de recrutamento (GDD §6.2), painel Recrutamento, perfil da
  cidade (torcedores e % da cidade), candidatas a filial do jogador
  e a escolha de praça da filial IA.
- Sondagem de 1 ano: 16 clubes em alta e 16 em baixa, crescimento
  de cada cidade dentro da régua do tamanho, Flamengo +4,2% num ano
  de G-4; sondagem de 10 anos entregue ao dono à parte.
- A MESMA RÉGUA EM CADA PAÍS (ordem do dono, na sequência): as ligas
  de fora fecham o ano com campeão, sobem e caem por divisão, e a
  tabela anual dá o G-4 da primeira divisão e os 4 últimos da última
  — tudo entra no mesmo bem/mal, lido ANTES do montar() rearmar o
  ano. Com o mundo inteiro na régua: 63 clubes em alta e 61 em baixa
  no primeiro ano sondado.

## A sede nível 6 e os anexos (pacote do dono, 02/09/2026)

O dono aprovou o pacote recomendado com as réguas dele:

- **SEDE NÍVEL 6 — o Complexo**: R$ 1.000.000 de obra (ordem dele),
  manutenção R$ 5.000/mês. Teto de membros **700** (ele reformulou o
  1.000 proposto), diretoria 20, treino 30, 4 ônibus/professores,
  12 advogados. **Sem ponto comercial novo** (ordem dele): bares,
  lojas e subsedes ficam no teto da nv5. A IA sobe pela mesma escada
  (a fila lê a tabela).
- **ENFERMARIA DA SEDE** (nv4, R$ 60 mil + R$ 1.200/mês): ferido
  volta em 3–9 dias em vez de 5–15.
- **GALPÃO DE MATERIAL** (nv3, R$ 45 mil + R$ 600/mês): bomba 15%
  mais barata (R$ 340) e o saque no nosso bar leva 30% menos.
- **COFRE BLINDADO** (nv5, R$ 150 mil, sem mensalidade): metade do
  prejuízo de saque não existe. Galpão e cofre acumulam: perda de
  R$ 1.000 vira R$ 350.
- **CUSTO FIXO NA RÉGUA DA MORAL** (ordem dele: "deficitário quando
  a moral estiver baixa"): bar subiu pra 800/1.800/3.800 e loja pra
  600/1.300/2.600 — ~50% da receita cheia, então com moral no chão
  (×0,4–0,6) o ponto fecha no vermelho e só volta a lucrar com a
  torcida animada (provado: bar nv1 com moral 10 rende 635 contra
  800 de custo; com moral 90, 1.905 contra 800). A subsede ficou
  como está: pela régua de 31/08 ela já é prejuízo direto sempre.
  A IA paga pelas mesmas tabelas; sondagem de 1 ano: 0 no vermelho.
- Festa da sede nv6: R$ 2.600 (crivo do dono na sequência).

## O financeiro das IAs na complexidade do nosso (ordem do dono, 02/09/2026)

"O fluxo de caixa delas não chega nem perto da complexidade da nossa
torcida. Tem que ser a mesma complexidade." O `balanco` virou
`balancoDetalhado`, espelho linha a linha do `contas()` do jogador
(unidades mensais; a economiaDelas aplica a fatia semanal):

- MENSALIDADE POR CARGO (pirâmide da fonte dá o valor por cabeça ×
  pagantes) e PRESO NÃO PAGA — era média chapada de R$ 45.
- RECEITA POR PONTO NO BAIRRO DELE: o mesmo hash fixo que o perfil
  da cidade mostra (chaves `id|bar|i` etc.) — era um multiplicador
  único da sede pra tudo. Bares irmãos agora rendem diferente.
- FOLHAS NAS MENSALIDADES CHEIAS: ônibus R$ 1.500, professor
  R$ 2.000 e advogado R$ 5.000 por mês — entravam na fatia errada
  (~¼ do custo do jogador). Assimetria fechada.
- ANEXOS NA FILA DA IA (após bombas): galpão → enfermaria → cofre,
  mesmo preço e porta de sede; compra marca no extrato, mensalidade
  no balanço, e os efeitos valem — cama de 3–9 nos feridosIA (as 3
  camas), bomba do lote 15% mais barata, e o SAQUE contra elas
  respeita galpão (×0,7) e cofre (×0,5) — quem rouba IA protegida
  leva menos.
- O perfil da torcida IA (Finanças) mostra o balanço do mês linha a
  linha, receitas e despesas, como o nosso Financeiro.
- Sondagens pós-espelho: 1 ano — 0 no vermelho, 22 advogados;
  3 anos — 0 no vermelho, 48 advogados (eram 76 com a folha
  subcobrada), mediana de caixa 22,7 mil. Calibração de pé.

## O reajuste dos imóveis (ordens do dono, 02/09/2026)

- SUBSEDE DA CIDADE: R$ 30 mil → **R$ 90 mil** (o preço da filial —
  subsede é subsede, na cidade ou fora).
- FÁBRICA REPENSADA: nada de triplicar o faturamento da loja — agora
  ela **corta 50% do CUSTO da loja** (manutenção e insumo). Vale pro
  jogador e pra IA; a receita da loja voltou à tabela crua.
- ANEXOS reprecificados: enfermaria **R$ 150 mil**, galpão
  **R$ 150 mil**, cofre blindado **R$ 300 mil** (mensalidades e
  portas de sede como estavam).
- AMPLIAÇÃO EM ESCALA PROGRESSIVA: bar nv2/nv3 = 60/120 mil, loja
  70/140 mil, filial 70/140 mil — cada nível custa o dobro do
  anterior (eram quase chapadas: 50/90, 60/90, 70/70).
- Sondagem de 1 ano pós-reajuste: 0 IAs no vermelho, 21 escritórios,
  mediana de caixa 16,3 mil. De pé.

## A venda forçada da loja (ordem do dono, 02/09/2026)

"Quando uma torcida fica por muito tempo endividada (30 dias), uma
loja é vendida no valor de 90.000,00 pra ajudar nas finanças."

- JOGADOR: contador dia a dia no `avancarDia` (`E.diasNoVermelho`);
  caixa positivo zera. Aos 30 dias, sai a loja de NÍVEL MAIS BAIXO,
  entram R$ 90 mil, o contador zera e o feed avisa (⚠ TEXTO MEU no
  crivo: "Chefe, 30 dias no vermelho e não deu mais pra segurar:
  vendemos a loja do bairro X por R$ 90.000 pra botar as contas em
  dia."). Sem loja nenhuma, segue devendo — ninguém vende o que não
  tem.
- IA: mesma régua na fatia semanal do economiaDelas
  (`t.diasVermelho` soma 7 por semana no vermelho → vende na 5ª
  semana, ~35 dias), mesma escolha da loja mais fraca, mesmos
  R$ 90 mil, linha no extrato.
- Testado: jogador vende a nível 1 e guarda a nível 2, o caso sem
  loja não quebra, e a IA vende na 5ª semana com o extrato certo.
- TEXTO APROVADO pelo dono na sequência; e a régua cresceu: além da
  loja, FECHAM ATÉ 3 SUBSEDES no mesmo evento — as da cidade
  primeiro, depois a filial mais fraca, com os destacados voltando
  pra sede (fechar não rende dinheiro; corta a manutenção). Vale
  igual pra IA, com o núcleo voltando pro total. O aviso do feed
  ganha a frase "Fechamos também N subsedes pra estancar a
  sangria." (⚠ frase minha, no crivo).

## A área de treino ampliável (ordem do dono, 02/09/2026)

Oferta nova no Financeiro > Patrimônio, degrau por degrau:

- Nível 1: R$ 100.000 → **+25%** de membros treinando por dia.
- Nível 2: R$ 200.000 → **+50%**.
- Nível 3: R$ 500.000 → **+75%**.

O bônus multiplica as vagas da sede (`capTreino`): sede nv5 vai de
20 pra 25/30/35. Linha na Estrutura (sem mensalidade), lançamento na
compra, e a IA compra pela fila dela (depois das bombas) esticando
as vagas do treino diário delas na mesma régua. A frase do aviso da
venda forçada foi APROVADA pelo dono nesta mesma ordem.

## Receitas do comércio +10% (reajuste do dono, 02/09/2026)

"O ajuste que fizemos deixou muito deficitário. Ajuste o cálculo pra
ficar melhor em torno de uns 10% as receitas em todos os casos." A
tabela-mãe subiu 10%: bar 1.760/3.960/8.250, loja 2.420/5.500/11.000,
subsede 660 — jogador e IA bebem da mesma fonte. A régua da moral
fica: bar nv1 com moral no chão ainda fecha em 698 contra 800 de
custo (vermelho), e com moral alta rende 2.095. Sondagem de 1 ano:
0 IAs no vermelho, mediana de caixa 18,6 mil (subiu de 16,3).

## A fila de compras ditada pelo dono (03/09/2026)

Depois da sonda de 10 anos mostrar que nenhuma IA chegava à sede 6 e
nenhuma construía fábrica, o dono ditou a fila inteira, com
repetições de propósito:

    professor · loja · bar · BOMBA · filial · ônibus · BOMBA ·
    investimento · BOMBA · advogado · subsede ·
    professor · loja · bar · área de treino · filial · investimento ·
    ampliar (bar, loja OU filial, no sorteio) ·
    galpão · enfermaria · cofre

O barato roda DUAS VEZES antes de a obra cara entrar; a bomba
aparece três vezes porque munição é o que se gasta. A ampliação
virou um item só, que sorteia na hora entre bar, loja e filial —
deu num que não tem o que ampliar, a fila anda e o dado rola de
novo na semana seguinte.

- QUEM PEDE SEDE MAIOR PERDE A VEZ (ordem dele): o item travado é
  PULADO e vai pro fim da fila, em vez de mandar comprar a
  ampliação da sede na hora. A torcida segue gastando no que cabe.
- A SEDE VIROU SOBRA, não fura-fila: ela só é comprada quando a
  fila inteira está cumprida ou travada — e aí é a única coisa que
  destrava o resto. (Assumido por mim pra não matar o crescimento
  da sede, que só acontecia por esse caminho; no crivo do dono.)
- O DESTRAVE (conserto de 03/09/2026, no crivo do dono). A sobra
  não bastava: a fila NUNCA acaba, porque bomba se gasta e volta, e
  investimento no clube sempre aceita dinheiro. A década sondada
  deu 250 das 386 torcidas paradas na sede 1, quatro delas com mais
  de R$ 400 mil no bolso. Agora `INFINITO` separa consumível de
  construção: a ordem do dono vale inteira pro que se constrói, mas
  quando só sobra bomba ou investimento na vez, havendo item
  travado pela sede E caixa que já paga a obra, a sede passa na
  frente. Pobre segue no barato, juntando.
- O SEGUNDO FURO, da mesma década: separar consumível de construção
  não bastou. Uma CONSTRUÇÃO CARA na vez — a área de treino, R$ 100
  mil — segurava a fila enquanto a torcida juntava, e ela juntava
  para sempre, porque tudo que era barato estava travado pela sede
  que ninguém comprava. Deu 179 torcidas paradas na sede 1 COM o
  dinheiro da sede 2 no bolso. O destrave passou a olhar o CAIXA: a
  ordem do dono vale pra construção que a torcida pode pagar agora;
  quando a vez é de consumível ou de coisa fora do bolso, e há item
  travado, a sede passa na frente — se ela couber no caixa.
- `FILA_V` versiona a fila: mudou a ORDEM, toda torcida recomeça na
  nova. O casamento por conjunto não daria conta das repetições.
- CONSERTO DE ARRASTO: `FILIAL.porSede` não tinha a coluna da sede 6
  — o Complexo lia `undefined` e voltava a permitir ZERO filiais,
  pro jogador e pra IA. Ficou em 8, o teto da nv5, que é a régua do
  dono de o nível 6 não abrir ponto comercial novo.

## Subsede, saque e recepção entre as IAs (decisão do dono, 03/09/2026)

O dono percebeu duas coisas e mandou uma terceira:

1. **A subsede da IA não levava chefia.** O núcleo da filial delas saía
   inteiro do fim da lista do elenco — ou seja, subsede só de novato.
   Agora a IA destaca a MESMA gente que a gente destaca ao fundar: **1 da
   diretoria e 2 da linha de frente**; o que passar de 3 fecha com o fim
   da lista. E, como no nosso caso, esse núcleo **sai do bonde da sede**:
   `disponiveisIA` desconta quem está destacado.

2. **O saque do ataque ao bar era mudo.** O dinheiro já mudava de mão
   (60 por cabeça do bonde da casa + 22% do caixa do dono, quando a
   atacante vence), mas não aparecia em lugar nenhum. Agora vira linha no
   extrato dos dois lados.

3. **Recepção de aliado passa a existir entre elas.** Quando uma torcida
   vai jogar na praça de uma aliada e **não tem subsede lá**, a dona da
   casa — a aliada mais próxima da praça — decide na régua ditada pelo
   dono: **30% hospeda e escolta**, **20% só hospeda**, **50% não
   recebe**. A conta é a nossa (R$ 50 e R$ 25 por cabeça) e a relação
   anda pela mesma tabela: +12, +7 ou −7. Casa sem caixa pro combinado
   não recebe.

## Fim da inflação de alianças (decisão do dono, 03/09/2026)

Em 10 anos o mundo inteiro aparecia em **+65 / Aliado**. Não era jogo
emergente, era aritmética: a convivência pagava **+1** por mês de paz e
cobrava **−1** a cada dois meses secos — saldo de **+0,5 por mês**, ou
**+65 numa década**. Como toda Neutra nasce em 0 e a faixa de Aliado
começa em +20, a tela virava um mar de aliadas sem ninguém fazer nada.

A correção, ditada pelo dono:

- **A régua da convivência.** Mês sem hostilidade paga **+0,2**; dois
  meses sem ajuda cobram **−1**. O saldo passivo agora é NEGATIVO
  (−0,3 por mês): relação sem contato apodrece, e aliado de verdade só
  se sustenta com evento — recepção, escolta, descer pela outra.

**Cota de aliados: DESCARTADA** (dono, 03/09/2026). Chegou a existir —
teto de alianças pela sede e pelo prestígio, com o excedente esfriando 1
por semana — e o dono mandou tirar. A régua da convivência dá conta
sozinha.

**O gasto de recepção das IAs** também passa a aparecer no balanço
mensal do perfil delas, como linha de despesa das últimas 4 semanas.

## Escudos das torcidas (entrega do dono, 03/09/2026)

O dono mandou o pack com o escudo de todas as torcidas e a ordem foi
clara: **tirar o fundo de todas antes de qualquer coisa, sem comprometer
a integridade da imagem**.

A régua da limpeza (`scratchpad/rar/tirar-fundo.py`):

- a cor do fundo é a **moda das bordas** da imagem, não um branco
  chutado — assim funciona em fundo preto, cinza ou colorido;
- só sai o fundo **ligado à borda**: branco de dentro do escudo fica
  onde está, que é o que "não comprometer a integridade" quer dizer;
- a franja não é cortada no talho — o alfa cresce junto com a distância
  da cor de fundo, então a borda continua suave em qualquer escala;
- o pixel meio-transparente é **descontaminado** (tira a tinta do fundo
  que estava misturada nele), senão sobra auréola clara em fundo escuro.

**A revisão do dono (03/09/2026).** Ele apontou sete escudos ruins —
Esquadrão Alvinegro do Athletic, Camisa 13 do Ceilândia, Força Alviverde,
Força Jovem Paysandu, Garra do CRB, Império Americano e Tubarões da Fiel
— e a conferência achou um oitavo, a Torcida Jovem Águia. Eram duas
doenças diferentes:

1. **O miolo branco era comido.** A mancha de fundo nascia de "tudo que
   não é desenho puro", e isso inclui o antialias das linhas: a franja
   fazia PONTE por dentro de um anel fino e o fundo entrava, apagando o
   disco branco de dentro do escudo. Corrigido em duas mãos: a mancha
   agora nasce só do fundo **chapado** (e depois cresce 3 px pra
   alcançar a própria franja), e — o que fecha de vez — **quando a tinta
   forma um anel que fecha a volta, o que está dentro do anel não é
   fundo por definição**: só se apaga o lado de fora. Isso vale para
   todo o pack, não só pros sete.

2. **Alguns vinham sobre ARTE, não sobre cor chapada** — fundo
   texturizado, moldura decorativa, raios soltos, foto de bandeira,
   crédito do desenhista na lateral. Nesses não existe cor de fundo pra
   remover, e o escudo é recortado no próprio círculo, medido no olho e
   conferido um a um (tabela `RECORTE` em `scratchpad/rar/recortes.py`):
   Força Alviverde, Tubarões da Fiel, Camisa 13, Torcida Jovem Águia e
   Jovem do Floresta (faixas verdes verticais atrás do escudo).

**139 dos 140** casaram com a fonte — a Jovem do Floresta veio depois,
em pacote próprio (03/09/2026). Falta só a **Mancha Negra**. Doze
arquivos vieram com sigla ou apelido em vez do nome da fonte (TUF, TOC,
TMV, JGT, "Gaviões da Fiel", "Força Jovem Paysandu" para a Facção Jovem
Paysandu, entre outros) e foram casados no olho, um a um.

Os arquivos vão pra `img/escudos/torcida-<id>.png` em 128×128, quantizados
em 128 cores com alfa — o pack inteiro pesa **0,78 MB** em vez de 3 MB, e
o olho não vê diferença. O manifesto `dados/escudos.js` ganhou a seção
`torcidas`, que é o que faz a UI trocar o quadradinho de cor pelo escudo
em todas as telas de uma vez.

## As capas das praças (entrega do dono, 03/09/2026)

O dono coletou a foto das 30 praças brasileiras e mandou: **comprimir e
tirar qualidade se preciso pra caber no artifact**. O gancho já existia
desde 01/09 — o cabeçalho do perfil da praça vira cartão-postal — mas
nunca tinha chegado foto.

A régua do tratamento (`scratchpad/rar/capas.py`):

- **corte 16:9 puxado pra cima**: 40% do excesso sai do topo e 60% do
  pé, porque a metade de baixo some no gradiente escuro que leva o nome
  da cidade;
- **1024 px de largura**, e nunca ampliando o original — 8 das 30 vieram
  menores que isso e ficaram no tamanho que tinham;
- **WebP com a qualidade caindo em degrau** até o pacote inteiro caber
  no orçamento: parou em **54**, com 1,91 MB nas 30 (65 KB por praça).
  Em base64 dentro do arquivo único isso vira ~2,5 MB, e o jogo fechou
  em **15,21 MB** — dentro do teto de 16 do artifact, com folga curta.

Duas fotos vinham com marca que o gradiente não engoliria e foram
aparadas antes do corte (tabela `APARO`): **Brasília**, com um logo
circular no canto direito, e **Interior do RS**, com o crédito do
fotógrafo no pé.

**O manifesto `dados/capas.js`** lista quem tem foto. Sem isso o perfil
pediria o arquivo de todas as 94 praças e encheria o console de 404: as
64 da América do Sul ainda não têm cartão-postal e seguem no gradiente
escuro de sempre.

## O sertão e a costa (planta do dono, 03/09/2026)

Três correções na malha das praças, ditadas pelo dono:

1. **Estrada da Bahia ao Rio.** Não existia: pra ir de uma à outra a
   caravana dava a volta por Belo Horizonte e São Paulo — três saltos
   por dentro do continente pra uma viagem que na vida real é de costa.
   Entra a **BR-101 Leste** (`bahia ↔ rio-de-janeiro`), e agora é **1
   salto**.

2. **O Interior de PE desce pro sertão.** Estava em `920.4, 425.6`,
   colado no litoral entre Recife e Alagoas. Vai pra **`856, 456`**: a
   oeste de Recife e ao sul do Interior do CE, que é onde o sertão
   pernambucano fica de verdade. Com isso ele **sai da Rodovia Nordeste
   2** — o corredor da costa passa a ser `paraíba → recife → alagoas →
   sergipe → bahia`, sem desvio pra dentro.

3. **A estrada do sertão fura o Interior de PE.** A **BR-116 Sertão**
   ia direto do Interior do CE à Bahia; agora é `interior-do-ce →
   interior-de-pe → bahia`. E ele **segue ligado a Recife** pela
   **BR-232**, que é a estrada real do sertão pernambucano.

4. **Belo Horizonte ao Subúrbio Carioca.** Entra a **BR-040**, que é a
   estrada real desse trecho. BH ganha a quinta vizinha e o Rio deixa de
   depender de São Paulo pra alcançar Minas.

O Interior de PE fica então com três vizinhas: Interior do CE, Bahia e
Recife; Belo Horizonte fica com cinco: Bahia, Brasília, Interior de
Minas, São Paulo e Subúrbio Carioca. As 94 praças continuam todas
alcançáveis. Os nomes BR-101 Leste, BR-232 e BR-040 estão no crivo do
dono (aprovados em 03/09/2026).

De quebra, o `docs/mapa-das-pracas.html` ganhou o `<meta charset>` que
nunca teve — os acentos apareciam quebrados ("SertÃ£o") na ferramenta
que serve justamente pra conferir a malha.

## Bonecos no lugar dos discos (pedido do dono, 06/09/2026)

O dono refez o formato da briga na bancada "Cenas de Briga de Cima"
(branch `claude/briga-3d-gta-style-k4zjky`) e mandou trazer tudo pro
jogo. Entrou por merge a três vias, arquivo a arquivo, com a base no
upload de 17–19/08 de onde aquela branch nasceu — o que era nosso
(relação, elenco fixo, quadro vivo, aliado escoltado, placar de
transmissão, bola de controle) ficou; o que era deles (o boneco e o
sistema de golpes) entrou por cima.

**O que mudou na briga:**

1. **Boneco humano em vez de disco.** `js/diajogo/bonecos3.js` desenha,
   num canvas WebGL transparente por cima da cena 2D, o boneco do
   Blender (`img/boneco_leve.glb`, embutido em
   `dados/boneco_leve_glb.js`) com Three.js r147 (`js/lib/`). Cabeça,
   ombro, braço, cassetete e escudo da PM, pedra, bomba e fumaça. A
   cena de cima continua sendo o canvas 2D de sempre — foto, malha,
   nome e vida —; o boneco é só a pele. Sem WebGL, cai no disco.
2. **Golpes, não contato contínuo.** O dano era força contra defesa
   por segundo de encosto. Agora cada golpe é um evento com tempo de
   impacto: soco, chute (derruba), joelhada, contragolpe. Quem apanha
   no chão fica esperando socorro; o companheiro livre levanta.
3. **As teclas do líder.** `Q` bate, `E` segura a defesa (soltar na
   hora do golpe é o contragolpe), `F` agarra (com companheiro do lado
   pra aproveitar), `C` chama o bonde pra cima. Pedra foi pro `2` e
   bomba pro `3` — a bomba abre a mira em arco e o clique joga.
   **Fugir saiu do F e foi pro `X`.** No pad de toque, sete ações em
   três colunas acima da bola; pedra e bomba nos números, à direita.
4. **Só o Quadrado.** As quatro formações viraram uma: bloco fechado
   atrás do líder. Linha de frente e retaguarda saem sozinhas; os
   arremessadores são os mais fortes da retaguarda, cada um com a sua
   cadência.
5. **Cerco conta.** Inimigo ao alcance dos dois lados (110° ou mais)
   deixa o boneco cercado: defende pior e apanha mais. Perfil por cargo
   decide quem agarra, quem contragolpeia, quem pisoteia.
6. **Celular: a cena é a tela inteira.** O palco cobre a tela, o canvas
   tem a resolução dela e o zoom segue o líder; a faixa da transmissão
   fica em cima. A camada dos bonecos mora numa caixa própria
   (`#djCanvases`) pra nascer alinhada com o canvas 2D, e não com o
   palco — que tem a faixa.

**O que NÃO entrou por padrão:** a rua vista de perto (`tres.js`,
`briga3d.html`, câmera atrás do líder). Ela existe e abre com a opção
`briga3d` do save ligada; o jogo é o de cima. A vitrine dos bonecos
(`bonecos.html`) e o gerador do Blender (`ferramentas/boneco_blender.py`)
vieram junto.

**Regras nossas mantidas dentro do sistema novo:** recuado bate de
costas (27/08) — o recuado não procura golpe, mas quem colar nele leva
o soco; alcançou, pegou (fuga por minoria) — dois golpes em cima e ele
fica; bonde correndo não joga pedra nem bomba.

**O empacotado passou de 16 MB** com o GLB (3,6 MB em base64) e a
biblioteca (0,7 MB): o bundler recomprime as fotos das cenas e as capas
de cidade (WebP q52/q48) e converte os escudos PNG pra WebP com alfa.
Ficou em 15,5 MB. O repositório segue com as originais.

Pendente de crivo do dono: a tecla `X` pra fugir; o peso do pad de sete
ações em tela de 390 px de altura.

## A cena não morre num quadro (tela branca da emboscada, 06/09/2026)

O dono abriu uma emboscada na estrada no artifact e a cena ficou em
branco com o ícone de imagem quebrada no canto — a briga tinha rodado
uns dez minutos de relógio (caídos 1–1) e apagou. Varredura em todas
as cenas com o jogo de verdade (torcida escolhida, membros reais,
perfil vivo do rival, emboscada pelo lado visitante), sem boneco até o
fim e com boneco em estados avançados (queda, agarrão, PM, fuga): nenhuma
exceção em simulação, desenho 2D ou bonecos. O que sobra é a placa de
vídeo: 143 bonecos esqueletizados numa emboscada e o contexto WebGL
cai — e o ícone de imagem quebrada em cima de um canvas é exatamente
como o Chrome mostra canvas cujo contexto morreu.

Duas coisas mudaram, uma pra causa e outra pra consequência:

1. **O laço da cena é cercado.** Uma exceção dentro do
   `requestAnimationFrame` matava o laço e o canvas ficava com o último
   quadro, ou em branco. Agora simulação, desenho 2D e HUD registram o
   erro no console e o quadro seguinte vem; a camada dos bonecos, que é
   a pesada, se desliga no primeiro erro e a cena segue com o disco, com
   aviso na tela. Perda de contexto WebGL (`webglcontextlost`) é lida
   por `bonecos3.ativo` e tem o mesmo destino; quando o navegador
   devolve o contexto, a cena seguinte já abre com boneco de novo.
   Testado forçando a perda com `WEBGL_lose_context`.
2. **Renderizador mais leve.** Sem antialias (MSAA quadruplica o
   preenchimento e não se vê num boneco de 30 px) e pedindo a GPU
   dedicada (`powerPreference:'high-performance'`).

Se a placa do dono continuar derrubando, o próximo passo é um teto de
bonecos por cena (acima dele, disco), que fica pro crivo dele.

## Quem é quem quando a camisa é da mesma cor (estudo, 06/09/2026)

O dono viu uma arquibancada com Aliança, Falange Coral, Leões da TUF e
Jovem Garra Tricolor de branco e não distinguiu ninguém. Medido nos
dados: de 697 pares de rivais na mesma praça, 139 têm a mesma cor
primária e 50 têm a 1ª E a 2ª iguais (Gaviões × Pavilhão 9). Vista de
cima, de um boneco de 30 px o que aparece é o chão em volta, a cabeça
e o alto dos ombros — o peito (onde mora a faixa da 2ª cor) e o calção
somem na projeção; faixa no peito e camisa metade a metade foram
testadas e caíram por isso.

Protótipo em `bonecos3.estudo`, com chaves, fotografado na rua com as
quatro torcidas brancas e na praça com Gaviões × Pavilhão 9 (prancha
"Quem É Quem na Briga"):

- `calcao` — calção na 1ª cor da torcida. **Pedido do dono; ligado.**
  Não separa torcidas iguais, mas o uniforme inteiro passa a ser da
  torcida. A variante `'segunda'` (calção na 2ª cor) lê-se pouco.
- `desenho` — desenho fixo da camisa por torcida (ombros, mangas ou
  listras na 2ª cor), pintado por vértice na malha do GLB, com registro
  na cena que nunca repete desenho entre torcidas de paleta igual. É a
  única marca que separa Gaviões de Pavilhão 9. Desligado (`'lisa'`).
- `boneCor2` — boné e bandana na 2ª cor. Ajuda; só metade usa boné.
  Desligado.
- `anel` — anel contornado no chão, na 2ª cor (ou na do lado). A marca
  mais legível do estudo e a mais "de tabuleiro"; sozinha não resolve
  os 50 pares de paleta igual. Desligado.

Recomendação submetida: uniforme por torcida sempre ligado (calção,
desenho, boné) e o anel como opção do jogador, ligado só no nosso
bonde; nunca a cor do lado, que apaga o aliado. Fica no crivo do dono.

## Calção, anel e as propostas de camisa (decisão do dono, 06/09/2026)

Depois do estudo "Quem É Quem na Briga", o dono decidiu:

1. **Calção sempre na 1ª cor da torcida.** Quando outra torcida da cena
   tem a mesma primária, a que chegou depois sai com o calção na 2ª cor
   — a nossa é sempre a primeira da fila. Na arquibancada das quatro
   brancas: TUF de calção branco, Terror Tricolor azul-claro, Aliança e
   Falange Coral de preto. Gaviões × Pavilhão 9: preto e branco.
2. **Anel no chão, na 2ª cor, só na cena com primária repetida.** Sem
   colisão não há anel. Contornado de escuro, por baixo da sombra.
3. **A camisa da torcida (decidido em cima das nove propostas):**
   torcida de **três cores** veste gola e **punho duplo** — gola na 2ª
   cor, punho com uma faixa na 2ª e a ponta na 3ª; torcida de **duas
   cores** é metade lisa, metade gola e punhos na 2ª cor, sorteada pelo
   nome (72 de 140 saem com gola) e fixa em todo save, como o elenco.
   Sem desempate na cena: a camisa é identidade da torcida e não muda
   conforme o rival — paleta igual é problema do calção e do anel.
   As outras propostas (ombros, mangas, listras, tiracolo, tricolor)
   continuam no código pra bancada, por `estudo.desenho`.

Quem decide calção e anel é `bonecos3.paletaDaCena(J)`: lê os bondes
da configuração (nossa primeiro), marca quem repete a primária de quem
veio antes (`coresParecidas`, a mesma régua da paleta da torcida) e
entrega calção e cor do anel por torcida. `estudo.calcao` e
`estudo.anel` em `'auto'` aplicam a regra; os outros valores ficam pra
bancada.

Ajustes do dono no mesmo dia, vendo Imbatíveis × Aliança (as duas
branco e preto): **o anel nunca repete a cor** de quem veio antes —
quem repete a primária escolhe calção e anel entre as cores da própria
paleta que não se pareçam com as já usadas, e esgotada a paleta entra
uma cor de reserva (Aliança sai de anel branco contra o preto dos
Imbatíveis); **o anel fica no pé do boneco**, desenhado na camada 3D
junto da sombra (a mesma projeção cisalhada), e não no canvas 2D, onde
caía no meio do desenho; e **o caído fica com 70% de transparência** (30% de opacidade), nos
dois lados; e **o derrubado que não apanhou no chão levanta em 1 s**
(quem apanha lá embaixo continua esperando socorro) — **menos o boneco
do jogador, que levanta em 1 s sempre**, mesmo apanhando no chão.

A regra vale em TODA cena de briga (correção do dono, 06/09/2026: o
bar abria sem anel). Nas cenas de ação — bar da rival, comércio, CT,
recepção na praça — o rival não entra como bonde: chega por
`cfg.rival` e os defensores nascem soltos pelos pontos da cena; e nos
arredores chegam bondes no meio da noite. A paleta da cena agora junta
os bondes da configuração, o rival informado e o que os discos trazem,
e se refaz quando entra gente nova.

**O ferido some** (régua do dono, 06/09/2026): com muita gente no chão
não se sabia quem estava de pé. O caído fica 3 s no chão (a 30%),
esvanece por 1,5 s e desaparece da cena — nos dois lados, no boneco e
no disco. A conta dos caídos não muda. E o anel só existe em quem está
de pé: caído e preso não têm anel, o que por si já diz quem está de pé
no bolo.

Limite técnico registrado: a camisa do GLB tem 206 vértices e não tem
UV, então a cor por vértice sai esfumada — listra fina não se lê.
Listra nítida pede reexportar o boneco com UV na camisa.

## O estádio lê o jogo do dia, não o da semana (correção, 06/09/2026)

O dono viu a TUF pôr 8 na arquibancada do Castelão com 100 aptos e
moral razoável. Causa: `E.proximoJogo` é UM por semana (o mata-mata ou o
de fim de semana ganham), e numa semana com jogo em casa na quarta e
jogo fora no domingo o `efetivoDaSaida` via `precisaCaravana` verdadeiro
e devolvia o tamanho da CARAVANA de domingo — 8 (num save novo, semana
24, dava 13: a caravana pra Novorizontino). Reproduzido e corrigido:
`efetivoDaSaida(E, partida)` recebe a partida do dia; jogo na nossa
praça leva todo mundo apto (menos a escolta), e a caravana só vale pra
viagem. Semana 24 num save novo: 150 em casa, como deve.

## O celular caía depois da primeira briga (crash, 07/09/2026)

**O que o dono viu.** No iPhone, logo depois da primeira cena de briga, o
artifact fechava com "Algo deu errado — Tentar novamente".

**A causa.** Fechada a cena, o palco fica com `display:none` e o canvas
dos bonecos com `clientWidth` zero. `ajustarTamanho` (bonecos3.js) caía
então em `cv.width` como reserva — e multiplicava por `dpr`. No desktop
o dpr é 1 e nada mudava; no celular ele é 1,5, e como o laço da cena
nunca parava, o buffer WebGL crescia 1,5× a CADA QUADRO. Medido num
iPhone emulado: 585 px de largura na cena, 1 976 no quadro seguinte,
um bilhão dois segundos depois. O WebKit do iPhone estoura a memória
alocando isso e o sistema mata a página.

**A correção.**
- O tamanho do canvas dos bonecos vem só da caixa CSS. Sem caixa,
  `ajustarTamanho` devolve false e o quadro não desenha.
- O laço da cena (`ponte.quadro`) para quando o palco fecha: quem esconde
  o palco chama `ponte.parar()`, e o próprio laço se desliga se a briga
  acabou e o canvas saiu da tela. `montar` religa. Antes a simulação e
  as duas camadas de desenho rodavam por trás do feed até fechar a aba.
- Os materiais clonados por boneco (roupa, esmaecido do caído, os dois
  anéis) são liberados da GPU quando a figura sai da cena. Geometria e
  material compartilhados ficam.

**Conferido.** Três brigas do tutorial seguidas num iPhone emulado:
canvas parado em 585×1194 com o palco fechado, zero quadros por segundo
no feed, 14 figuras em cena (não acumulam), sem aviso do WebGL. As
cenas bar, praça, emboscada e estádio rodam com disco e boneco como antes.

## O feed com ícone próprio e o cabeçalho explicado (pedido do dono, 07/09/2026)

Da análise de UI só entram duas coisas, por decisão do dono:
- O ícone do Feed deixa de ser o megafone (um alto-falante genérico) e
  vira a linha do tempo — três pontos com três linhas.
- Todo item do cabeçalho tem texto ao passar o mouse (`title`): nome
  completo da torcida com o clube e a cidade, ranking (Brasil e América
  do Sul), caixa, saldo da semana, membros (total, aptos, feridos,
  presos), prestígio, moral, ataque, defesa, a data, o ≫ e o 1×/2×.

O que ficou de fora fica registrado na conversa, não aqui.

## Quem apanha no chão levanta 2 s depois do último golpe (régua do dono, 07/09/2026)

**O que o dono viu.** TUF × Cearamor na rua: as duas torcidas correram,
sobraram uns bonecos deitados de cada lado que nunca levantavam, e a cena
não acabava — ficaria eterna.

**A causa.** Quem apanhava no chão (`noChao`) esperava socorro e só
levantava sozinho depois de 2,5 s sem "inimigo alcançável" a 70 px. Essa
conta devolvia qualquer inimigo vivo — inclusive um deitado ou fugindo.
Dois caídos de lados opostos, um perto do outro, se seguravam no chão pra
sempre; com os dois bondes debandados ninguém vinha puxar, e como o
deitado conta como vivo a cena nunca esvaziava.

**A régua nova.** Quem está apanhando no chão levanta 2 s depois do
último golpe, tenha ou não inimigo por perto. O que prende no chão é só
o golpe: cada soco zera o relógio. O socorro do companheiro (1,2 s
parado em cima) continua sendo o caminho mais curto; o derrubado que não
apanhou levanta em 1 s; o boneco do jogador sempre em 1 s.

**Conferido.** Três pares de caídos de lados opostos a 30 px, os dois
bondes debandados, na rua e na praça: todos levantam e a cena fecha com
"eles correram". Antes, um par ficava deitado até o fim.

## O pad é o rodapé da cena (pedido do dono, 08/09/2026)

**O que o dono viu.** No celular os sete botões de ação ficavam em três
colunas boiando por cima do canvas, bem onde a briga acontece.

**A decisão.** Os botões não ficam na frente da briga. O pad deixou de
ser fixo sobre o canvas e virou o último bloco da coluna do palco
(faixa → cena → pad), com fundo próprio; a cena fica com a altura que
sobra. Os nove botões — bater, defender, recuar, agarrar, chamar, fugir,
sair, pedra, bomba — dividem UMA linha em partes iguais, e a bola de
controle vai embaixo. Deitado, a bola vai pro lado da linha, no mesmo
rodapé. Pedra e bomba perderam os números 2 e 3 (são teclas, não dizem
nada no dedo).

**Detalhe.** Nove rótulos em 390 px dão 38 px por botão: em Barlow
Condensed a 9 px "DEFENDER" cabe; se a fonte não carregar,
`ajustarRotulosDoPad` desce o corpo até caber.

## Os mais usados em cima, maiores; e a câmera mais perto (pedido do dono, 08/09/2026)

- O rodapé da cena ganha duas linhas: em cima, maiores (52 px, corpo
  12), Bater, Defender, Pedra e Bomba — os que o dedo procura o tempo
  todo; embaixo, Recuar, Agarrar, Chamar, Fugir e Sair. A bola de
  controle continua abaixo (ao lado, deitado).
- O zoom padrão do celular sobe de 2,4× pra 3,4× e o teto da pinça de
  4× pra 5×: com a briga refinada nos bonecos, de longe não dava pra
  ler quem bate em quem. A câmera segue o líder como antes, e a seta
  da borda diz onde está o outro bonde.

## O itinerário é uma linha só (pedido do dono, 08/09/2026)

A trilha de paradas de baixo pra cima saiu do cartão do dia de jogo. O
que fica é a parada de AGORA, numa linha que se atualiza conforme o dia
passa:
- à esquerda, o símbolo do lugar: ônibus na estrada (ida e volta da
  caravana), cidade na concentração e na pista, estádio nos arredores e
  no jogo;
- a hora (e o dia, quando a viagem ocupa mais de um), o nome da parada
  com o lugar ao lado, o estado do dia embaixo ("passando", "recado na
  parada", "a partida rolando", "dia encerrado") e o efetivo à direita;
- embaixo da linha, um pontinho por parada diz quanto do dia já passou
  (o do jogo é maior; parada com briga fica vermelha).
Os recados e a partida abrem embaixo da linha, como antes abriam ao lado
da parada. A lógica (itinerario.js) não mudou: só o desenho.

## Os aniversários de aliadas numa mensagem por mês (pedido do dono, 08/09/2026)

**O que incomodava.** Um convite por aliada, dez dias antes de cada
festa, cada um parando o relógio: com trinta aliadas o feed virava spam
de aniversário.

**A decisão.** Sai UMA mensagem no começo de cada mês (na primeira
passagem de dia do mês) com as aliadas — relação ≥ 20 ou irmã de clube —
que fazem aniversário nele, em ordem de data. Cada aliada tem o seu "Ir
pra festa" e "Não ir" dentro do cartão; quem já respondeu mostra a
etiqueta ("vamos" / "não vamos") e perde os botões. A mensagem é uma
decisão: o relógio fica parado até a última aliada ter resposta. Festa
que já passou quando a lista sai (partida começada no meio do mês) não
entra.

**Conferido por desencargo, como o dono pediu.** O efeito de cada
resposta é o mesmo de antes, aliada por aliada: ir lança −R$ 2.000 no
caixa (6.000 → 4.000 no teste) e soma +8 de relação (30 → 38); não ir
tira −6 de relação (30 → 24) e −2 de prestígio (12 → 11,6 na régua
interna). A consequência no cartão soma as festas e as furadas. Os
botões antigos (`aniv-ir` / `aniv-nao`) continuam existindo pra
mensagem já dropada em save antigo.

## O ocorrido some da linha; o relógio volta na hora depois da lista de aniversários (pedido do dono, 08/09/2026)

- **O ocorrido some da tela.** O cartão do recado no itinerário —
  emboscada, ataque sofrido, investida — fica enquanto a ação dele está
  de pé (botões, cena, saldo) e sai quando a linha chega na parada
  seguinte, ou no fim do dia. As notícias e as consequências continuam
  saindo pelas portas de sempre (Futebol e Porrada, prestígio, feridos,
  presos): o cartão era só o pedido de decisão. A partida fica na linha,
  porque o placar é o registro do dia; o aviso "os arredores só abrem no
  apito final" sai no apito.
- **O delay depois da lista de aniversários.** Respondida a última
  aliada, a mensagem fechava, mas o relógio do feed não era acordado —
  `responderMensagem` faz isso pra toda decisão, e o botão por aliada
  não passava por ele. Agora o clique que fecha a lista chama
  `retomarTempo('decisao')`, e o dia segue na hora (conferido: 2 s
  depois do último clique o dia já tinha virado).

## 40% menos briga, e entre os maiores rivais (régua do dono, 08/09/2026)

**A régua.** Toda chance de briga do jogo cai 40% — a nossa e a das
IAs — MENOS o bar (calendário do trimestre, bar do rival, sub-sede que
desce no bar) e a LNT, que não sorteia. E quando há oportunidade, a
briga é em sua maioria com o MAIOR RIVAL: o declarado na fonte, de um
lado ou do outro, ou relação viva de −70 pra baixo.

**Onde mora.** `TO.relacoes.FREIO_BRIGA = 0,6` e `pesoDoRival` (1 contra
maior rival, 0,5 contra os outros), aplicados em:
- ataque-surpresa contra nós (concentração/pista, em casa e fora): a
  lista é varrida com os maiores rivais primeiro, e a chance leva freio
  e peso; a sub-sede inimiga que desce no bar fica sem freio;
- emboscada de rota (ida e volta): chance × 0,6; havendo maior rival na
  praça, três em quatro vezes é ele quem fecha a pista;
- encontro de rua no dia de jogo: base 88/72/20 → 62/36/10, mágoa 0,5 →
  0,3, teto 95 → 57, acaso 12 → 7,2;
- arquibancada: chance por minuto × 0,6; o alvo é o maior rival presente
  antes da maior torcida;
- tretas do trimestre: 1–2 (média 1,5) → 0/1/2 com 30/50/20% (média
  0,9); três em quatro contra maior rival, se houver (nós e as IAs);
- IA × IA: briga por jogo 18% → 10,8%, com o sorteio do par entre maiores
  rivais em três de quatro vezes; ataque-surpresa delas com freio e peso,
  maiores primeiro; emboscada delas 10% → 6%, maior rival da praça
  primeiro; caravana de filial 4% → 2,4%; guerra de filiais × 0,6 e peso;
- filiais nossas: apanhar sozinha 0,5% → 0,3% ao dia; caravana da filial
  5% → 3%.
Fora do freio, além de bar e LNT: o que o jogador manda (assalto, CT,
investida, bote na caravana rival) e o que acontece dentro da cena.

**Medido** em 200 dias de mundo, sem erro; os números estão no registro
da conversa.

## Pedir ajuda a aliado no jogo fora (pedido do dono, 08/09/2026)

Na tela da caravana, o bloco "Ajuda de aliado na praça deles" lista as
aliadas da cidade do jogo (relação ≥ 20 ou irmã de clube) com o botão
"Pedir ajuda". A resposta vem na hora, com o tipo — a MESMA tabela da
nossa recepção: só hospedagem, hospedagem e escolta, escolta e churrasco,
ou não recebe. Quem decide é a relação (mais uma sorte fixa da semana):
nota = relação ± 10; ≥ 60 churrasco, ≥ 42 escolta, ≥ 26 hospedagem,
senão nada. Um pedido por jogo; fica no plano da semana.

**O que muda.**
- Relação: receber soma a tabela da recepção (+7 / +12 / +20); não
  receber tira −7, o que ela cobra de nós no caso inverso.
- Moral: dormir na sede deles +1; churrasco +2.
- Escolta: 10 membros dela (régua do dono) andam com o nosso bonde a
  partir da CHEGADA na cidade — chegada, concentração, pista, arredores,
  estádio e a saída dos portões — e ficam quando a caravana pega a
  estrada de volta. Na linha do dia o número aparece como "+ 10 da
  Bamor" só nas paradas da cidade; a cena aberta pela linha na cidade
  leva os 10 no nosso lado, e as baixas de uma briga lá saem primeiro
  da escolta. Na estrada (ida e volta) a caravana vai sozinha.
- O caixa dela paga a recepção até onde alcança (25/50/75 por cabeça da
  nossa caravana), e o gasto entra no EXTRATO dela pela mesma porta da
  economia das IAs (`lancarIA`) — conferência pedida pelo dono. O caixa
  das IAs é curto e, se mandasse no nível, escolta e churrasco nunca
  sairiam — quem manda é a relação.

**Conferido.** Bamor (relação 70) respondeu escolta e churrasco: relação
70 → 90, moral +2, 8 na escolta somados ao efetivo pra Bahia, caixa dela
debitado; Camisa 12 do Vitória (relação 22) não recebe. Pedir de novo não
cobra de novo; o efetivo em casa não leva a escolta.

## A partida corre o dobro (pedido do dono, 08/09/2026)

O relógio da partida no cartão "O jogo" do itinerário passa de 2 pra 4
minutos de jogo por segundo real. Em 1× os 90 minutos levam 22 s; no
padrão da casa (4×), uns 6 s. O botão 1×/2×/4× e o espaço (pausa)
continuam iguais; o clima do estádio segue sorteado minuto a minuto.

## O tempo anda mais (pedido do dono, 08/09/2026)

Das medidas propostas, entraram quatro:
1. **O 2× vale em tudo.** O botão de velocidade já dividia o intervalo
   das mensagens; agora divide também o passo do dia vazio, as paradas
   da linha do dia (e os recados dela) e o 1,4 s de assentar a cena
   antes do relatório.
2. **Dia vazio quase sem espera.** Dia sem mensagem passa em 120 ms
   (era 450).
3. **Informação em rajada.** Notícia que não pede resposta — rodada,
   jornal, olheiro informativo, almanaque — sai a 500 ms uma da outra;
   o compasso de 1,5 s fica só pra ANTES de uma decisão, que é o que
   merece ser lido com calma.
4. **A dica só no primeiro mês.** Saem as das semanas 1 e 3 e mais
   nenhuma; o "Como funciona" do menu do Jogo continua com todas.
Ficaram de fora, por decisão do dono: o olheiro virar informação, o
pulo de paradas da linha, o "avançar até", as respostas padrão e o
simular a semana inteira.

## Uma notícia por dia de jogo (pedido do dono, 08/09/2026)

Três brigas num itinerário eram três "Futebol e Porrada". Agora a linha
do dia abre um LOTE ao começar e fecha no fim: cada briga continua
fazendo tudo o que fazia — aplica os efeitos na hora do fechamento da
cena, anota o placar do ano, tira as baixas deles de circulação,
alimenta o almanaque, manda a provocação —, só a notícia fica guardada.
No fim do dia sai UMA: a página é da maior briga, as outras vão numa
lista dentro dela ("A mesma noite: mais 2 tretas nossas", com quadro
curto e a consequência de cada uma), e a linha de consequência da
notícia SOMA os efeitos de todas, indicador por indicador — atenção
pedida pelo dono. Um lote esquecido num save (aba fechada no meio do
dia) é fechado ao entrar no jogo. Conferido: três brigas de teste
viraram uma notícia com "Prestígio nosso +7 · Relação −22 · Moral +0,5",
que é a soma exata das três.

## O número vermelho nos ícones (pedido do dono, 08/09/2026)

- **Torcida:** quantos membros estão com o status "Pronto p/ promoção"
  da tabela — a mesma régua (preso e ferido não contam, mesmo com XP).
- **Notícias:** quantas mensagens de outras torcidas ainda não foram
  lidas. Abrir a aba Mensagens dá tudo por lido.
O número fica no canto de baixo à direita do ícone, na coluna do feed e
na barra lateral, e é refeito a cada repintura do cabeçalho.

## Mensagens entre torcidas (pedido do dono, 08/09/2026)

Notícias ganhou a aba MENSAGENS (a primeira): a comunicação entre
torcidas, com remetente, data, tipo e texto. Quando uma chega, aparece
"Mensagem de {torcida}" ao lado do ícone de Notícias por uns segundos, e
o número do ícone sobe. O que vai pra lá:
- a **provocação** do rival depois da briga (saiu do feed);
- o **convite de aniversário** de cada aliada, sem botão (a decisão
  continua na lista mensal do feed);
- o **agradecimento** por ir à festa dela;
- o **agradecimento** por receber o bonde dela na nossa cidade
  (hospedar, escoltar, churrasco) — e a **cobrança** quando não recebe;
- o **"estamos juntos"** quando ela topa receber a gente na cidade dela,
  e a **recusa** quando não dá.
Os textos estão em feed.js e planejamento.js, sujeitos ao crivo do dono.

## O olheiro só sugere; o planejamento vai pra Mensagens; a dívida cobra vingança (pedido do dono, 08/09/2026)

**O relatório semanal saiu do feed.** A tabela dos jogos com "Atacar /
Ir em paz / Seguir padrão" não existe mais. O planejamento virou coisa
que o jogador faz quando quer, pelo botão "Planejar ataque" em Notícias
→ Mensagens (abre a mesma tela de sempre, com os alvos da semana). A
CARAVANA continua no feed, sempre: "Chefe, domingo o Fortaleza joga
fora, em Goiânia. Monta a caravana."

**No feed fica só a sugestão do olheiro**, e ela só aparece com
OPORTUNIDADE do calendário — nunca inventa jogo:
- rival DE FORA entrando na nossa cidade: "Chefe, a {torcida} vai jogar
  aqui em {cidade} {dia}. Acho interessante a gente bolar um ataque pra
  cima deles, esses vermes na nossa cidade não tem vez."; rival DA NOSSA
  praça na pista do jogo dela: "Chefe, vai ter jogo do {clube} {dia} e a
  {torcida} vai estar na pista. Acho interessante a gente bolar um
  ataque pra cima deles." — botões "Bolar o ataque" e "Deixar quieto";
- a gente na cidade dela (nosso jogo fora): "Chefe, como vamos viajar
  pra {cidade} {dia}, bora aproveitar pra pegar os vermes da {torcida}
  na casa deles.";
- vale sugestão só contra rival de verdade: dívida, rivalidade declarada
  (rival ou maior rival) ou relação de −45 pra baixo; hostil de −15 não
  para o dia.

**A dívida.** Apanhou de uma torcida (perdeu a briga), fica anotado onde
e em que mês (`E.dividas`). Na próxima oportunidade do calendário com
ela, a sugestão passa na frente das outras e cobra: "Chefe, a gente
ainda não engoliu o que esses caras da {torcida} fizeram com a gente em
{cidade}. Eles vão jogar em {nossa cidade} {dia}. É uma oportunidade de
vingar o que eles fizeram com a gente em {mês}." (fora: "A gente vai
jogar em {cidade deles} {dia}…"). O botão vira "Vingar". Ganhar dela
quita a dívida.

**Os pedidos de recepção saíram do olheiro**: a aliada que vem pra nossa
cidade pede casa por mensagem (ver abaixo).

## Cinco mensagens novas entre torcidas (pedido do dono, 08/09/2026)

1. **Pedido de casa.** A aliada que vem pra nossa cidade esta semana
   manda "Fala irmão, vamos a {cidade} {dia} pro jogo do {clube}, uns
   {n} de bonde. Tem como receber a gente?" — com os quatro níveis de
   recepção e o custo por cabeça na hora; a escolha entra no plano e a
   conta vira no dia do jogo, como sempre.
2. **Agradecimento pela escolta.** Depois da briga da escolta em que a
   gente desceu: "Voltamos inteiros por causa do bonde de vocês no
   portão. Isso a gente não esquece." (perdendo: "Apanhamos juntos, mas
   vocês desceram…").
3. **Cobrança.** Ficamos de fora da briga da escolta: "Nosso pessoal
   apanhou na cidade de vocês e ninguém desceu. A gente veio de longe
   confiando. Anotado."
4. **Proposta de trégua.** Rival com quem já houve 3 brigas no ano e
   relação de −55 pra baixo manda "Muito sangue esse ano… Trégua até o
   fim da temporada?" — uma vez por ano, por rival. Aceitar: +15 de
   relação e trégua até o fim do ano civil — ela não marca ataque contra
   nós, não entra nos nossos alvos, não emboscamos nem somos emboscados
   por ela na rota, não há encontro de rua e ela não provoca. Recusar:
   −5.
5. **Aviso de treta marcada.** O rival manda "Hoje à noite, no {bairro},
   {n} contra {n}. {aposta} na roda. Aparece." — a decisão continua no
   feed.

## O itinerário em três fases (pedido do dono, 08/09/2026)

Caravana · ida, O jogo, Caravana · volta (em casa: Ida ao estádio, O
jogo, Volta do estádio). As paradas detalhadas continuam sendo montadas
por baixo — são elas que sabem ONDE e QUEM —, mas a linha mostra só as
três fases, e cada fase tem NO MÁXIMO UM ocorrido: o ataque sofrido
passa na frente (régua do dono), depois a emboscada, e a investida
marcada pelo jogador só entra se ninguém caiu em cima da gente na fase. O cartão diz o lugar e a torcida ("Pegaram a caravana na
estrada. A Os Imbatíveis fechou a pista. Foi em Bahia (Chegada na praça
deles)."). O jogo fica com o incidente do estádio (o clima). A escolta
da aliada anda com a gente no jogo e em qualquer ocorrido na cidade
dela; nas caravanas, não.

## O resumo da noite (pedido do dono, 08/09/2026)

A tela "Fim da noite" deixa de ser o relatório longo de fichas e vira um
resumo só:

- **Título com resultado e lugar**: "VITÓRIA NO NOSSO BAR", "DERROTA NA
  ARQUIBANCADA", "VITÓRIA NA EMBOSCADA", "VITÓRIA NA PISTA"… Quando eles
  amarelaram e saíram inteiros, "ELES CORRERAM {lugar}"; noite sem ninguém
  no chão, "NOITE TRANQUILA". O lugar sai da cena (`lugarDaCena`): estádio →
  arquibancada, emboscada, treta, praça/concentração, pista/rua, arredores,
  CT, comércio, sede, loja, sub-sede; bar é "NO BAR RIVAL" quando fomos nós
  que atacamos e "NO NOSSO BAR" quando defendemos.
- **Duas colunas**, a nossa à esquerda e a outra torcida à direita, com
  brasão e nome: membros envolvidos, feridos, presos e "bombas + pedras" na
  forma `2+5` (2 bombas e 5 pedras arremessadas por aquele lado). Ferido
  aqui é caído sem contar preso, como o resto do jogo já contava.
- **Consequências** logo abaixo: relação com a outra torcida, moral e
  prestígio (na régua de 0 a 100) e dinheiro ganho ou perdido, este só
  quando houve. Os números são a diferença real entre antes e depois de
  fechar a noite (tirada uma foto dos indicadores antes de aplicar), então
  já incluem o "defendemos o que é nosso" e o que o teto de 100 deixou
  entrar.
- A linha final do fecho (o que o Itinerário/a ação dizia da noite) continua
  embaixo, como um recado curto.

Fica de fora o bloco ficha a ficha (quem entrou, quem caiu, XP): isso já
mora na tela da torcida e na notícia única do itinerário.

Corrigido de quebra: o balão "Mensagem de {torcida}" ficava por cima das
telas cheias (ele mora no ícone do feed, que segue vivo por baixo do
relatório) — agora fica abaixo delas.

## As notícias de treta saem do feed (pedido do dono, 08/09/2026)

Com o Fim da noite contando a briga na hora, a notícia do confronto (a
página do Futebol e Porrada) deixa de rolar no feed. Ela continua
existindo do mesmo jeito — nasce em `registrarConfronto`, passa pela fila
e entra na história `e.feed`, de onde o jornal, o arquivo e os saves já
liam — mas o rolo do feed simplesmente não a desenha.

Quem a mostra é **Notícias → Tretas**, uma aba nova só com as nossas
brigas, cada uma com o recorte do jornal. Na hora em que a notícia cai,
o ícone de Notícias ganha o número vermelho (que soma mensagens não
lidas e tretas não abertas) e o balão "Treta com a {torcida}"; abrir a
aba dá tudo por lido. Os efeitos da briga não mudam de lugar: relação,
moral, prestígio e baixas seguem aplicados no fechamento da noite, e a
linha de consequência continua no cartão.

## O ticker de manchetes voltou (pedido do dono, 08/09/2026)

Uma fita logo abaixo do cabeçalho do feed, com as manchetes das
principais notícias dos últimos 21 dias. A ordem é de prioridade, não de
data:

1. **A nossa torcida e o nosso clube**: a manchete do Futebol e Porrada de
   cada treta nossa e a manchete do jornal da rodada (que é sempre o nosso
   jogo). Saem em branco, com o ponto dourado.
2. **O que fala de nós de tabela**: página do almanaque com tom bom ou
   ruim pra gente, LNT que cite a torcida ou o clube, e as brigas do país
   na nossa praça.
3. **O resto do país**: as maiores brigas do nosso país, no máximo quatro,
   pra fita não virar boletim. **Nada de outros países** na fita (ajuste
   do dono, 08/09/2026): a briga entra só se um dos lados é torcida de
   clube do nosso país (`time.pais`, Brasil por padrão), e as da nossa
   cidade vêm na frente das outras.

Dez manchetes no máximo; as do mesmo nível vêm da mais nova pra mais
velha. A fita anda em CSS (metade a metade, emenda sem vão), para no
mouse, e clicar numa manchete abre Notícias na aba certa (Tretas,
Arquivo do feed ou Brigas). Os jornais são de molde determinístico, então
montar a manchete aqui dá o mesmo texto do cartão; ela fica guardada por
id de mensagem pra não refazer página a cada tique. Sem manchete, a fita
some. (O "ticker" da lista de descartados de 17/08 é este, de volta por
pedido do dono.)

## "Relação com a Bar da Falange Coral" (correção do dono, 08/09/2026)

O alvo do ataque chama "Bar da Falange Coral" e guarda a torcida dona em
`deQuem`; o resumo da noite novo usava o nome do alvo como se fosse a
torcida, e a coluna da direita e a linha de relação saíam com o endereço.
A relação em si sempre mexeu na torcida certa (é por id). Agora o rival
do relatório é resolvido pela torcida (`deQuem`, senão o nome da torcida
pelo id), inclusive nos encontros de rua.

## O olheiro sugere menos (pedido do dono, 08/09/2026)

Das oportunidades que o calendário dá, só uma parte vira sugestão de
ataque: contra rival comum (declarado ou hostil de −45 pra baixo) 40%
(−60%); contra maior rival 70% (−30%). A dívida passa sempre: vingança é
cobrança, não sugestão. O corte é por hash da chave da mensagem, então a
mesma oportunidade dá sempre a mesma resposta, e a que foi cortada não
volta no dia seguinte nem cai pro segundo hostil da lista. Medido numa
temporada de 330 dias com a TUF: 37 → 12 contra rivais e 44 → 28 contra
maiores rivais. A constante é `FREIO_OLHEIRO` em `feed.js`.

## As IAs brigam na faixa do jogador (pedido do dono, 08/09/2026)

Com o olheiro sugerindo menos, o mundo ficou brigando muito acima da
gente: medido numa temporada de 330 dias, a mediana era de 40 a 42 brigas
por torcida brasileira no ano (quartis 29–53, Jovem Fla com 139). A faixa
de um jogador comum fica entre ~20 (quem recusa toda sugestão: calendário
do trimestre, ataques sofridos e ocorridos do dia de jogo) e ~40 (quem
aceita metade das sugestões).

Entra `FREIO_IA = 0,4` por cima do `FREIO_BRIGA`, só nas brigas
espontâneas de IA contra IA: ataque-surpresa (60% das brigas do mundo),
sombra do jogo, emboscada de estrada, caravana de subsede e guerra de
filiais. O calendário do trimestre delas (treta marcada e bar), que é o
mesmo nosso, e os ataques contra nós ficam como estão. Resultado medido:
mediana 24 por torcida no ano, quartis 17–31, máximo 73; na nossa praça
(TUF) as rivais ficaram entre 11 e 38. As brigas do mundo no ano caíram
de ~5.750 pra ~3.700.

## A sugestão de viagem do olheiro saiu (pedido do dono, 08/09/2026)

"Chefe, como vamos viajar pra Mato Grosso sábado, bora aproveitar pra
pegar os vermes da Raça Cuiabana na casa deles" não existe mais: a
mensagem anterior é sempre o planejamento da caravana, que já oferece o
ataque, e a sugestão virava repetição. Fica só a cobrança da dívida
("a gente ainda não engoliu… é uma oportunidade de vingar"), que é
memória de derrota e não sugestão espontânea; ela sai sem freio, como
antes.

## As IAs guardam vingança (pedido do dono, 08/09/2026)

Até aqui só o jogador tinha dívida; a IA só tinha a relação piorando
depois da briga, sem memória de quem apanhou de quem. Agora cada torcida
do mundo guarda a própria dívida por torcida (`mundoTorcidas[id].dividas`):

- **Anota** quando perde uma briga — de nós (fechamento em
  `registrarConfronto`) ou de outra IA (toda briga do mundo passa por
  `registrarBrigaIA`). **Quita** quando vence a credora. Vale até o fim
  da temporada (o ano da anotação); a trégua com a gente apaga os dois
  lados.
- **Na fila de alvos a credora passa na frente**: no ataque-surpresa, na
  treta marcada e no bar (`rivalDaPracaIA`), e nos ataques contra nós
  (praça nossa, filial e praça deles).
- **A tentativa sai sem freio**: entre elas a cobrança pula o freio das
  IAs e o peso do rival (sem dobrar — com o dobro e validade de
  temporada inteira cada briga virava revanche da revanche e a mediana
  do mundo subia de 22 pra 36); contra nós sai com o dobro
  (`COBRANCA_MULT = 2`) no lugar do freio geral e do peso. A dívida
  vence em 16 semanas (`VALIDADE_DIVIDA`), além do fim da temporada.
- **Contra nós** o ataque marcado vem com `cobranca` e o aviso do olheiro
  (quando a campana está paga) termina com "É cobrança: eles não
  engoliram a surra que levaram da gente." **Entre elas** a briga sai
  como revanche: em Notícias → Brigas ("· revanche") e no ticker
  ("Revanche: …").

Medido: Falange Coral × MOFI, a perdedora anota e a volta sai como
revanche quitando; contra nós, rival de −80 com efetivo suficiente veio
cobrar em 35 a 49 dias. Com a vingança, a mediana anual do mundo foi de
22 pra 29 brigas por torcida (quartil de cima 37), ainda dentro da faixa
do jogador. A régua de tamanho continua valendo: torcida com menos
da metade do nosso efetivo não vem, dívida ou não.

## O olheiro sugere ainda menos (segunda volta do dono, 08/09/2026)

Sobre a régua do mesmo dia: maior rival cai pela metade (0,7 → 0,35),
exceto o maior rival cuja sede é do mesmo nível que a nossa, que continua
em 0,7 — é a rivalidade parelha, a que interessa; rival comum cai mais
30% (0,4 → 0,28). A dívida continua passando sempre. Medido em 330 dias
com a TUF (sede nível 4): rivais 24 → 6, maiores rivais de outro nível
22 → 4, maior rival parelho 20 → 15. `FREIO_OLHEIRO` em `feed.js`.

## Quem tenta se vingar e se dá mal deixa quieto (regra do dono, 08/09/2026)

A dívida não renasce quando a cobrança falha — sem isso a Cearamor
voltava toda semana num save da TUF. E a derrota numa tentativa de
vingança custa mais que uma derrota comum:

- **IA contra IA** (`registrarBrigaIA`): se a perdedora devia à vencedora,
  a dívida some em vez de ser reanotada. Se ela era quem tomou a
  iniciativa (o lado `a` da briga), a briga sai como `vingancaFrustrada`
  e ela perde, além do normal, 0,6 de moral e 0,3 de prestígio na régua
  interna (`VINGANCA_FRUSTRADA`) — o dobro da derrota comum.
- **IA contra nós** (`registrarConfronto`): se ela nos devia e perdeu, a
  dívida some. Se veio cobrar (o ataque marcado carrega `cobranca`, e o
  alvo da defesa leva a marca), paga os mesmos 0,6 e 0,3 a mais.
- **A nossa**: fomos cobrar (atacamos com dívida aberta) e apanhamos: a
  dívida some e custa −1,0 de moral e −1,0 de prestígio na régua interna
  (−5 e −5 na régua de 0 a 100), com a linha "vingança frustrada" na
  consequência (`VINGANCA_NOSSA` em `feed.js`).
- A derrota comum continua anotando a dívida, dos dois lados.

## A ordem de compras das IAs, versão 4 (dono, 08/09/2026)

Nova fila-modelo (`ORDEM`, `FILA_V = 4` — toda torcida recomeça nela):

```
loja → bar → bombas → evoluir:loja → evoluir:bar → mma → advogado →
loja → bar → bombas → evoluir:loja → evoluir:bar → onibus → filial →
elenco → bombas → mma → subsede → filial → elenco → evoluir:sorteio →
galpao → enfermaria → cofre
```

Comércio primeiro, com a ampliação de loja e bar logo atrás; professor e
advogado depois; a segunda rodada de comércio antes de ônibus, filial e
clube; a área de treino saiu da fila. A mecânica não mudou: fila
rodante por torcida, uma compra por semana, item travado pela sede vai
pro fim, sede só quando não sobra mais nada ou quando destrava o
consumível.

## O fps da cena de briga (pedido do dono, 08/09/2026)

Medido com o perfilador do navegador numa defesa do bar (52 discos): o
JavaScript custava quase nada — o tempo era da placa. Cortando camada
por camada: sem a camada 3D dos bonecos o quadro ia de 4,8 pra 48 fps;
sem a 2D não mudava nada. Dentro da 3D: resolução, anéis, luz e material
mexiam pouco; o número de bonecos mexia tudo (12 bonecos, 49 fps). A
causa era a malha: o GLB "leve" tem ~61 mil vértices e ~23 mil
triângulos por boneco (a cabeça sozinha tem 10 mil, cada cabelo 8 mil),
e 52 bonecos de 30 px eram 1,26 milhão de triângulos por quadro.

Três medidas, em `bonecos3.js`:

1. **A malha é afinada na chegada** (`afinarMalha`): agrupamento de
   vértices por célula fixa de 1,75 m ÷ 48 (≈3,6 cm), média das posições,
   demais atributos (uv, ossos, pesos) do primeiro vértice da célula,
   triângulo degenerado some, normais recalculadas. O modelo inteiro cai
   de 119 mil pra 7,3 mil triângulos; o quadro, de 1,26 milhão pra 139 mil.
   Na vitrine com o modelo detalhado não afina.
2. **Quem está fora da tela não é animado nem desenhado**: corte pela
   posição do disco contra a vista da câmera, com margem de 60 unidades.
   A figura fica na lista (não é liberada), só não entra no quadro. Vale
   pouco no bar (3 de 55) e muito na emboscada a 3,4× no celular.
3. **Resolução adaptativa** da camada dos bonecos: 1,5× → 1× → 0,75×
   quando a média do quadro passa de 1/28 s por 1,2 s; volta a subir com
   4 s de folga abaixo de 1/55 s. A camada 2D do celular acompanha.

4. **Uma malha só por boneco** (`juntarPecas`, pedido do dono no mesmo
   dia): as sete peças esqueletizadas, a cabeça e o cabelo (pendurados
   no osso da cabeça) e os adereços viram um SkinnedMesh com cor por
   vértice — peça pendurada em osso entra com o vértice levado ao espaço
   do corpo e peso 1 naquele osso, que é o mesmo que ser filha dele. A
   textura da pele sai (invisível a 30 px). A geometria juntada é
   guardada por (variantes, cores, desenho) e compartilhada. Chamadas de
   desenho: 725 → 211 (quatro por boneco: corpo, sombra, dois anéis).

Medido no navegador sem placa (software), celular 390×844: 3,6 → 16,9
fps; desktop 1000×800: 3,4 → 10,4 fps. Numa placa de verdade a
proporção é a mesma — o custo era triângulo. Os controles ficam em
`bonecos3.cfg` (cortarForaDaTela, resolucaoAdaptativa, afinarMalha,
afinarCelulas).

## A marca do líder por cima da briga, sem pixel (pedido do dono, 08/09/2026)

Duas correções na cena:

- **A camada 2D volta à densidade cheia.** Ela tinha passado a acompanhar
  a densidade adaptativa dos bonecos, e o nome do líder (que é pintado
  nela) saía pixelado. Medido, a camada 2D não pesa nada; só a 3D desce
  de densidade.
- **A marca de quem o jogador controla vai pra camada de cima.** O anel e
  o nome do líder eram pintados na camada 2D, que fica POR BAIXO dos
  bonecos: no bolo da briga os corpos cobriam a marca. Agora o canvas
  `djSobre`, acima da 3D, recebe a cada quadro (`ponte.desenharSobre`):
  uma seta dourada pulsando sobre a cabeça e o nome numa etiqueta escura
  (o anel amarelo e o halo no pé chegaram a existir e saíram no dia
  seguinte, a pedido do dono), com letra que tem teto pra não virar cartaz no
  zoom de 3,4× do celular. É pro mesmo disco que a câmera segue
  (`focoDoZoom`), e nada disso é coberto por boneco nenhum. A camada de
  baixo deixa de pintar o nome e o anel do líder quando há boneco por
  cima (`semNomeDoLider`).

## Movimento leve: a multidão mexe menos (pedido do dono, 09/09/2026)

O dono achou que a gama de movimentos pesava. Medido, a variedade em si
não custa; o que custa é posar cada boneco a cada quadro. Então a gama
da MULTIDÃO encolhe e o custo cai junto (`cfg.movimentoLeve`, em
`bonecos3.js`):

- Quem não é o líder e não está no meio de nada (não caiu, não bate, não
  apanha, não corre, não foi chamado) tem a pose recalculada a cada três
  quadros, intercalados — vinte poses por segundo, que o olho não separa
  das sessenta. Nos quadros pulados só a posição do disco é copiada.
- O balanço de repouso some pra multidão: o relógio das poses de parado,
  guarda e bloqueio fica congelado na fase do boneco (ele para quieto em
  vez de respirar e balançar). A provocação e a torcida de retaguarda
  saem pra multidão. O líder e quem está brigando seguem com tudo, em
  sessenta.
- O esqueleto só recalcula e sobe as matrizes dos ossos pra placa quando
  o boneco mudou de pose ou de lugar no quadro (`fg.mudou`): um boneco
  parado não custa upload.

Medido no celular, 52 bonecos parados antes da briga, só o JavaScript da
animação (a placa fora da conta): 3,5 ms → 1,1 ms por quadro.

## O ticker não recomeça do zero (correção do dono, 09/09/2026)

Depois do jogo o feed solta várias mensagens em seguida e a tela repinta;
a cada uma a fita era refeita e a animação voltava pro início — o jogador
só via a cabeça da fita (as manchetes novas) e nunca chegava às
anteriores. Agora a fração andada é lida da animação antes da troca e
devolvida depois; quando o feed remonta a fita inteira, a fração e o
instante ficam guardados (`tickerMemoria`) e a nova continua de onde a
anterior estava, contando o tempo que passou. Medido: 0,138 → 0,144 da
volta depois de uma mensagem nova, com a manchete nova dentro e as
anteriores mantidas.

## A pauta da semana em Notícias → Mensagens (pedido do dono, 09/09/2026)

O cartão antigo do olheiro — a tabela de cada jogo com as torcidas que
pisam na rua e a estimativa de cada uma — volta, mas em Notícias →
Mensagens e cobrindo a semana inteira: é de lá que o jogador pode bolar
ataque contra QUALQUER torcida que passe pela cidade, e não só contra a
que o olheiro sugeriu. `feed.pautaDosJogos` monta a pauta (jogos da praça
que ainda não passaram, o nosso jogo fora com a praça deles, e os aliados
que chegam); `main.painelPautaDaSemana` desenha: por jogo, a linha do
plano atual e os botões **Atacar** (abre a tela de ataque com os alvos
daquele jogo, hostis ou não), **Ir em paz** e **Seguir padrão**; no jogo
fora, **Montar a caravana** e **Atacar na praça deles**. Abaixo, o bloco
"Aliados na cidade — como vamos receber?" com os quatro níveis. O botão
solto "Planejar ataque" saiu: a pauta o substitui.

## As faixas (pedido do dono, 09/09/2026)

Toda torcida nasce com uma faixa; a nossa mora em `patrimonio.faixas`
(`nossas` e `tomadas`), a das IAs na ficha viva (`faixas`,
`faixasTomadas`). A imagem é desenhada com as cores e o nome da torcida
(`patrimonio.imagemDaFaixa`); `TO.dados.faixas[id]` com um data-URI
substitui pela arte real — as imagens do dono não estão no repositório,
então o desenho vale até elas chegarem.

- **Na cena** (praça, estádio e bar; `combate.montarFaixa`), quem é
  ATACADO expõe a faixa no pé do spawn de guarda: a cena recebe
  `faixaDefensor` ('nos' | 'eles') e `rivalId` de quem a abre — o
  ataque ao bar/sede (eles), a defesa do nosso bar (nós) e o encontro do
  dia de jogo (`enc.sofrido` decide). Sem faixa na sede, nada é exposto.
- **Recolher**: quando o inimigo chega a 180 px da faixa ou a briga
  estoura, dois da torcida dela (não o líder) largam o que fazem e vão
  até ela; chegando, ficam tirando (pose de socorro) e 3 s depois um dos
  dois sai com ela na mão (`comFaixa`). Se um dos dois cai no caminho,
  outro é chamado.
- **Tomar**: se o portador cai (ferido ou preso), a faixa é tomada pelo
  outro lado. A cena que fecha com a faixa ainda no muro, a dona sem
  ninguém de pé e o atacante vencedor, também conta como tomada.
- **A conta** (`acoes.aplicarFaixa`, chamada no fechamento do dia de
  jogo): −10 de prestígio pra quem perdeu e +5 pra quem tomou, na régua
  de 0 a 100; a faixa muda de dono nos patrimônios e a linha "tomamos a
  faixa da X" / "perdemos a nossa faixa pra X" entra no Fim da noite.
- **Loja**: "Faixa nova" por R$ 5.000 no Patrimônio (`opcoes`/`comprar`,
  id `faixa`), quantas quiser. **Patrimônio** ganha o cartão "Faixas":
  as nossas e as tomadas, estas de cabeça pra baixo (`.faixa-img.virada`).

Junto: **o ponto de fuga é o spawn** (pedido do mesmo dia) — quem
debanda corre pra entrada por onde chegou, em toda cena, e só cai nas
outras bocas se dali não houver rota (`rotaDeFuga`).

## A cara da faixa e o estádio (régua do dono, 09/09/2026)

**Pedido.** "A cor do texto da faixa é sempre a cor secundária da torcida,
a cor de fundo é sempre a primária. Coloque o escudo da torcida do lado
esquerdo do texto e o escudo do time do lado direito. No estádio sempre
todas as torcidas vão estender faixa."

**Como ficou.**
- A imagem da faixa (`TO.patrimonio.imagemDaFaixa`) é um canvas 400×100:
  fundo na cor primária, borda e nome na secundária, escudo da torcida à
  esquerda e escudo do clube à direita (os mesmos `img/escudos/` da UI;
  sem escudo no manifesto, o texto ocupa o espaço). Os escudos carregam
  depois: a faixa nasce só com cor e nome e é redesenhada no mesmo canvas
  quando eles chegam — a cena vê a versão nova sozinha, e o Patrimônio
  recebe um aviso pra trocar o `src`.
- No estádio há UMA FAIXA POR LADO (`J.faixas`): a nossa no primeiro
  setor da nossa ala, a deles no primeiro setor da ala deles, cada uma
  recolhida pela própria torcida. Nas outras cenas continua só a da
  atacada. `J.faixa` segue apontando pra primeira (a de quem defende).
  A ponte devolve `faixas` (lista) além de `faixa`; o fechamento aplica
  cada tomada — no estádio dá pra tomar a deles e perder a nossa na
  mesma noite.

## A retrospectiva de 01/01 e os prêmios (pedido do dono, 09/09/2026)

**Pedido.** "Prefiro que as notícias do almanaque de virada de ano
apareçam no dia 01/01 num overview com uma página pra cada detalhe,
saindo das mensagens, e sem ser mais no layout do almanaque. A torcida
do ano ganha 300 mil, a segunda 150, terceiro 100, quarto 70 e quinto
50. As 5 que tiveram mais saldo positivo de pista também ganham
premiação nos mesmos valores."

**Como ficou.**
- As seis páginas da virada (sobe e desce, torcida do ano, rei da
  pista, a janela, o balanço, a treta do ano) não caem mais no feed:
  viram `E.retrospectiva` e abrem numa tela própria (`#telaRetro`) no
  primeiro dia do ano, segurando o relógio até o jogador fechar. Uma
  página por assunto, com índice clicável, Anterior/Próxima e Fechar.
  Notícias → Arquivo ganha o botão "Rever a retrospectiva de {ano}".
- Layout novo (`.retro-*`): ano em marca-d'água, chapéu, manchete
  grande, olho, tarja de números e um destaque por assunto — pódio com
  escudos (torcida do ano e rei da pista), duas colunas subiram/caíram,
  barras da janela, lista das obras, os dois lados da treta.
- Prêmios (`TO.almanaque.PREMIOS = [300, 150, 100, 70, 50] mil`): o
  top 5 do ranking nacional e as 5 de maior saldo positivo de brigas
  do ano recebem na virada — nós pelo extrato ("Prêmio Torcida do Ano
  2026 — 1º lugar"), as IAs pelo caixa e extrato delas. As páginas
  trazem a tabela "Premiação" e o olho diz quanto a campeã levou.
- As edições de abertura e de campeão continuam no feed, no layout do
  almanaque: o pedido era sobre a virada.

## A subsede nasce com 8 (ordem do dono, 09/09/2026)

**Pedido.** "Além de um diretor e dois linhas de frente, 5 componentes
também se mudam pra subsede da outra cidade. Todos eles saem da sede,
portanto a subsede já surge com 8 membros."

**Como ficou.** Abrir subsede em outra cidade destaca 1 diretor, 2
linha de frente e 5 componentes — os aptos de ficha mais fraca de cada
cargo, como antes. Nas IAs a filial nasce com `membros: 8`. O total da
torcida não muda: é mudança de cidade, não de torcida.

## A faixa estendida na parede e no alambrado (pedido do dono, 09/09/2026)

**Pedido.** "Preciso que a imagem da faixa apareça como estendida em
alguma parede, e quando estiver no estádio ela fique estendida no
alambrado. Dependendo da posição da torcida na arquibancada, como a
faixa sempre vai estar virada pro campo, a faixa vai ficar na posição
vertical." E depois: "Você pode espremer o layout da faixa pra caber no
alambrado ou na respectiva parede."

**Como ficou.**
- Cada cena de faixa (bar, praça, os três estádios) ganhou em
  `dados/cenas.js` um `faixas:{mandante, visitante}` com o ponto no chão
  em frente à parede/alambrado de cada lado, o comprimento e `dir`, a
  direção da parede. Os pontos foram medidos na malha de pisada de cada
  foto: são a última célula livre antes da parede, saindo do spawn do
  lado — a equipe que recolhe chega neles (alcance de 30 px).
- A faixa é desenhada GIRADA, com o topo na parede. No bar e na praça
  o corpo pende pra dentro do salão/calçada, onde está quem vê. NO
  ESTÁDIO ela pende do alambrado pro lado do CAMPO (correção do dono,
  09/09/2026: "ela sempre deve estar virada simulando uma faixa
  estendida mesmo"): o topo fica na grade e o corpo cai sobre o
  gramado, como quem vê do campo — na lateral leste lê de cima pra
  baixo, na oeste de baixo pra cima, atrás do gol fica deitada e
  legível. A visitante do estádio de 40 foi pra lateral oeste, pra não
  sobrar faixa de cabeça pra baixo atrás do gol sul. Uma sombra fina
  cai pro lado do corpo, pra ler como coisa pendurada.
- No estádio ela pende do alambrado pro lado do CAMPO (correção do
  dono, 09/09/2026): o topo fica na grade e o corpo cai sobre o
  gramado, como quem vê do campo — na lateral leste lê de cima pra
  baixo, na oeste de baixo pra cima, atrás do gol fica deitada. No bar
  e na praça o corpo pende pro salão/calçada, onde está quem vê. A
  faixa do visitante do estádio de 40 mil saiu do setor sudoeste (atrás
  do gol, ficaria de cabeça pra baixo) pra lateral oeste.
- Curvada no alambrado (dono, 09/09/2026): a âncora pode trazer `arco`,
  o centro da curva da grade; a faixa é então desenhada em 28 fatias ao
  longo do arco que passa pela grade, com o topo pra fora e o corpo pro
  campo. Vale em todos os setores do estádio de 40 mil (oval), nos dois
  setores do canto noroeste do de 20 mil e no setor leste do de 10 mil,
  cujo alambrado faz curva no alto.
- SEM DEFORMAÇÃO (ordem do dono, 09/09/2026): a barriga e a ondinha de
  pano foram testadas e reprovadas ("está feia"). A faixa é lisa; o que
  dá naturalidade é a curva do alambrado.
- AS CURVAS MEDIDAS, NÃO CHUTADAS (correção do dono, 09/09/2026: "a faixa
  não está alinhada com o alambrado, vasculhe todas as curvas"): o
  script `faixa-ajuste-arco.js` amostra a beira da pisada em frente a
  cada setor (janelas de 150/110/80 px), ajusta círculo e reta por
  mínimos quadrados e escolhe o maior comprimento com erro ≤ 5 px; a
  âncora é projetada na curva ajustada. Resultado: arco no leste do
  estádio de 10 mil (R≈126), nos dois setores do canto noroeste do de
  20 mil (R≈104–127, faixas de 110 e 80 px), na lateral leste e no
  setor sudoeste-baixo do de 40 mil (R≈115–319); reta onde a beira é
  reta. Onde a malha da foto é irregular (escadas dos cantos do de 40
  mil) a faixa fica reta na tangente medida — arco ali só piorava.
- Espremida: na cena a faixa tem proporção 6:1 (a imagem em si continua
  4:1 no Patrimônio), pra caber na linha do alambrado sem invadir o
  campo. Bar: parede leste do salão; praça: fachada leste (rival) e
  oeste (nós); estádio de 10: lateral leste (mandante) e atrás do gol
  norte (visitante); de 20: as duas laterais; de 40: as duas laterais. Sem ponto marcado, vale o lugar antigo, no spawn.

## Bandeiras, faixa em todo setor e o pano que cede (pedido do dono, 09/09/2026)

**Pedido.** "Todas as torcidas, não importa o escalão, também estendem
faixa nas cenas de briga na arquibancada. O membro que possui a faixa
vai ficar na parte de trás da briga sempre. Adicione também bandeiras
no formato quadrado, com bordas com as cores secundária e terciária, e
o fundo com cor primária; a imagem é a logo da torcida; custa 2.000;
outro membro vai recolher. Concentração: uma bandeira (50%) ou uma
faixa (50%); bar: bandeira 70% ou faixa 30%; estádio estende os dois
lado a lado. A faixa estendida tem uma deformidade pra não ser
extremamente reta. É possível consultar quais faixas cada torcida tem
e quantas ganhou, no perfil de cada torcida."

**Como ficou.**
- No estádio cada SETOR estende: `J.setores` guarda que bonde sentou em
  que spawn, e cada bonde com torcida conhecida expõe a faixa e a
  bandeira dele, na âncora do próprio setor (`faixas:{mandante1, …}` em
  `dados/cenas.js`, medidas na malha de pisada). O setor atrás do gol
  sul fica de cabeça pra baixo, porque o pano pende pro campo e a foto
  é de cima — é o que a régua "virada pro campo" manda.
- O portador (faixa ou bandeira) vai pro próprio spawn e fica lá
  (`faixa-atras`); não caça ninguém, só bate em quem colar nele.
- A bandeira: canvas 200×200, fundo primário, borda de fora secundária,
  de dentro terciária (sem terciária, sombra), escudo da torcida no
  meio (sem escudo, a sigla). R$ 2.000 na loja; toda torcida nasce com
  uma; um membro só recolhe; tomada como a faixa, valendo −5/+2 de
  prestígio (faixa: −10/+5). Fica ao lado da faixa na mesma parede, do
  lado que tiver chão. O Patrimônio mostra as nossas e as tomadas (de
  cabeça pra baixo).
- O sorteio por cena (`CHANCE_BANDEIRA`): bar 70% bandeira, praça
  (concentração) 50%; sem a peça sorteada, sai a outra; estádio, as
  duas. Testado em 12 aberturas: bar 7×5, praça 6×6.
- O pano cede: a faixa (reta ou curva) é desenhada em 28 fatias com o
  topo preso e a barra de baixo caindo mais no meio (16% da altura),
  com uma onda leve semeada por peça; a bandeira em 10 fatias.
- Perfil da torcida (aba Visão): "Faixas — N na sede · K tomadas (de
  quem)" e a mesma linha pras bandeiras, pra nós e pras IAs
  (`faixasTomadas`, `bandeirasTomadas`).
- Entre duas IAs na arquibancada (aliada perde pro rival), a peça muda
  de mão e o prestígio delas se ajusta, sem mexer no nosso.

## Bandeiras, faixa por setor e portador na retaguarda (pedido do dono, 09/09/2026)

**Pedido.** "Todas as torcidas, não importa o escalão, também estendem
faixa nas cenas de briga na arquibancada. O membro que possui a faixa
vai ficar na parte de trás da briga sempre. Adicione bandeiras no
formato quadrado, com bordas com as cores secundária e terciária, e o
fundo com cor primária; a imagem é a logo da torcida; custa 2.000,00;
outro membro vai recolher. Concentração: uma bandeira (50%) ou uma faixa
(50%); bar: bandeira 70% ou faixa 30%; estádio estende os dois lado a
lado. É possível consultar quais faixas cada torcida tem e quantas
ganhou, no perfil de cada torcida."

**Como ficou.**
- No estádio cada SETOR expõe: `J.setores` guarda qual bonde sentou em
  qual spawn, e cada bonde com torcida conhecida estende faixa e
  bandeira na âncora do próprio setor (`faixas[<spawn>]` em
  `dados/cenas.js`, medidas na malha de pisada). O bonde espalhado em
  dois setores estende uma vez só. Quem recolhe é gente do mesmo setor.
- A bandeira (`TO.patrimonio.BANDEIRA`): quadrada 200×200, fundo
  primário, borda de fora secundária, de dentro terciária, escudo da
  torcida no meio (sem escudo, a sigla). R$ 2.000 na loja; toda torcida
  nasce com uma (`bandeiras:1` nas IAs). UM membro recolhe. Na cena é um
  quadrado de 1,8 altura de faixa, ao lado da faixa na mesma parede, do
  lado que tiver chão. Tomada como a faixa, valendo menos: −5 pra quem
  perde, +2 pra quem toma (régua de 100) — valores meus, não do pedido.
- O sorteio: bar 70% bandeira / 30% faixa; praça 50/50; estádio os dois.
  Sem a peça sorteada, sai a outra; sem nenhuma, nada.
- O portador (`d.comFaixa`) vai pro próprio spawn — o fundo do setor ou
  do salão — e fica ali; não caça ninguém, só bate em quem colar.
- SÓ PERDE A PEÇA QUEM CAI (correção do dono, 09/09/2026, "estou
  tomando a faixa e bandeira de todas as torcidas mesmo sem ferir"):
  `vivo` é falso também pra quem SAIU pelo túnel, e a regra de fim de
  cena tomava toda peça ainda na parede quando a torcida dona tinha
  debandado inteira — e a peça na mão quando o portador entrava no
  túnel. Agora a peça na mão só é tomada se o portador cai ferido ou
  preso, e a peça na parede só se ninguém da dona está de pé (quem
  fugiu vivo levou junto).
- O PORTADOR VAI JUNTO, MAS ATRÁS (correção do dono, 09/09/2026): não
  fica no spawn — acompanha a aglomeração do PRÓPRIO bonde (quem tem
  inimigo a menos de 200 px; sem briga aberta, o grupo) e para 150 px
  atrás dela (régua do dono, 09/09/2026: era 160/70), do lado oposto
  ao centro dos inimigos, pelo campo de
  fluxo da cena (alvo quantizado em células de 64 px, empurrado pra
  célula pisável). Não caça, só bate em quem colar, e não vira
  socorrista. Medido no estádio: portadores a 30–97 px do bonde e
  sempre mais longe do inimigo que o bonde.
- A FAIXA SAI ANTES DO BONDE (correção do dono, 09/09/2026, "quando um
  adversário corre logo de cara mesmo assim ativa a animação de dois
  membros tirando a faixa pra depois fugir"): na hora da debandada
  (`recolherAntesDeFugir`), toda peça daquele lado ainda exposta entra
  em recolhimento e ganha equipe; `soltarFuga` não vira as costas de
  quem está tirando; quando a peça sai na mão, quem tirou corre com
  ela. Os recolhedores e o portador andam pelo campo de fluxo (em linha
  reta esbarravam na mesa do bar), e o guarda escalado pra tirar sai do
  posto mesmo com a cena ainda dormindo. Medido no ataque ao bar da
  Aliança (4 contra 60): recolhem em 0,2 s, saem com a faixa na mão aos
  4,7 s, o portador foge com ela; perde só quando é derrubado na fuga.
- QUEM SAI DA EQUIPE LARGA A FAIXA (correção do dono, 09/09/2026, "o
  boneco fica insistentemente tentando tirar o material"): o recolhedor
  que debandava, caía ou sumia era tirado da equipe mas continuava
  marcado `faixaIndo`/`tirando` — ficava plantado na faixa pra sempre,
  e a equipe vazia nunca achava outro. `peneirarEquipe` limpa as marcas
  de quem sai, o ramo de movimento ignora quem foge ou está no chão, e
  a escolha seguinte pega outro apto. Testado: um recolhedor que foge é
  substituído e a faixa sai na mão; debandada geral não deixa ninguém
  plantado.
- Entre duas IAs (aliada perdeu pro rival na arquibancada) a peça muda
  de mão e o prestígio delas move; o nosso caixa não entra.
- Perfil da torcida, aba Visão: "Faixas: N na sede · K tomadas (de
  quem)" e o mesmo pra bandeiras. Patrimônio: fileira de bandeiras,
  nossas e tomadas (de cabeça pra baixo).

## Os dizeres da faixa (pedido do dono, 09/09/2026)

**Pedido.** "Faça uma variação de faixas pra não ficar repetitivo demais
com esse texto: 'DESDE {ANO DE FUNDAÇÃO}', 'SEMPRE COM O {MASCOTE DO
TIME}'."

**Como ficou.** `TO.patrimonio.dizerDaFaixa(o, k)` dá o dizer da faixa
k de cada torcida entre três: o nome; "DESDE {fundação}" (só com
`fundacao` na ficha); "SEMPRE COM O {mascote}" (só com `mascote` no
clube; "A" quando o mascote termina em -a, tirando "Super-Homem"). O
primeiro dizer roda por um hash do id, então torcidas diferentes com
uma faixa só não repetem o mesmo. Quando o dizer não é o nome, o nome
vai em letra pequena no alto, pra faixa continuar identificável de
longe. No Patrimônio a faixa k mostra o dizer k; na cena a torcida
sorteia uma entre as que tem. A arte do dono, quando chegar
(`TO.dados.faixas[id]`), continua entrando inteira no lugar.

## A promoção das IAs: todo apto sobe (ordem do dono, 09/09/2026)

**Pergunta e pedido.** "Me diga se os membros das torcidas IA treinam e
evoluem, e implemente que os aptos para promoção deles sejam promovidos,
com prioridade permanente na fila (se tem membro pra promover e dinheiro
em caixa, promove, registra no financeiro)."

**O que havia.** Cada torcida IA tem um quadro por cargo (quantos, força
média, XP média). Treina todo dia com as vagas de treino da sede (2 a
30) e o dobro com professor de MMA; o XP de briga entra inteiro. A
promoção rodava toda semana antes da compra da fila, mas subia só 10%
do grupo e só quando a MÉDIA do cargo alcançava a força exigida — e
como as vagas se diluem em toda a torcida, a média de novato subia 1,6
por ano e nunca chegava aos 8. Resultado medido: 3 de 386 torcidas
promoveram alguém num ano.

**Como ficou.**
- `q.aptos[cargo]` (treinarDelas): as vagas de treino são gente de
  verdade. As vagas do dia se repartem pelos cargos promovíveis na
  proporção do efetivo, cada uma entrega 0,15·ganho de força por
  sessão, e um apto nasce quando junta a força que falta do piso do
  cargo até a exigência (novato 1→8: ~47 sessões; componente 5→12;
  frente 10→18). Nunca passa do efetivo do cargo.
- `promoverDelas`: toda semana, antes da compra da fila, sobe TODO apto
  que tem o XP do cargo, limitado só pelo caixa (componente R$ 0,
  frente R$ 1.000, diretoria R$ 5.000 por cabeça, como nós) e pelo teto
  da Diretoria da sede — o barrado continua apto esperando vaga. Quem
  sobe chega com a força da régua; a média de quem fica cede um pouco.
  Cada promoção paga entra no extrato ("Promoção de N a Linha de
  Frente").
- Medido num ano: 272 de 386 torcidas promoveram; Gaviões foi de
  127/75/38/10 pra 111/90/80/15 (novato/componente/frente/diretoria),
  gastando R$ 19 mil; a pirâmide do mundo ficou 13,5 mil novatos, 9,5
  mil componentes, 6,2 mil linha de frente, 1,2 mil diretoria.

## O portador foge de quem chega perto (pedido do dono, 09/09/2026)

"Acho que o ideal é o portador tentar se distanciar a 200 px de um
inimigo. Pode ser que em algum momento um inimigo se aproxime, sem estar
trocando com um parceiro de torcida." O ponto "150 px atrás da
aglomeração" não protege de um inimigo solto que vem por outro lado.

- `FAIXA_AFASTA = 200` em `combate.js`. No ramo do portador (`comFaixa`),
  depois de escolher o ponto atrás dos seus, com inimigo a menos de 200
  px ele entra em `faixa-evade`: soma a repulsão de cada inimigo dentro
  do raio (peso `(200-d)/d`, mais forte quanto mais perto) com um quarto
  de puxão pro ponto atrás do bonde — pra não fugir da própria torcida —
  e sonda um leque de rumos (0°, ±25°… 180°) a 110 px em volta dessa
  direção. Só aceita ponto onde o corpo cabe (`livrePara`), e fica com o
  que deixa o inimigo mais perto MAIS LONGE (desempate: o rumo mais
  parecido com o ideal). Se nenhum rumo afasta, `faixa-encurralado`: não
  sai do lugar. Sem inimigo a 200 px, volta ao comportamento anterior.
- A distância ao inimigo passou a ser medida de verdade (`maisPerto`),
  inclusive pra decidir quem do bonde está "trocando": `inimigoPerto` só
  enxerga a vizinhança de 90 px da grade de colisão, e a régua é 200.
- Tentou-se andar em linha reta pro ponto sondado: piorou (o ramo
  direto tem histerese e separação; 17 de 25 portadores travaram). O
  campo de fluxo pra célula quantizada ficou.
- Medido (`faixa-evade.js`: peça na mão, todo mundo congelado, um inimigo
  plantado a 100 px do portador num ângulo sorteado, 4 s): nos três
  estádios e no bar, 21 a 25 de 25 portadores chegam a ~200 px; os que
  ficam é parede ou a aglomeração congelada do teste fechando a saída.
  `faixa-tomada-regra`, `faixa-debandada`, `faixas` e `faixa-fuga-cedo`
  seguem passando.

## As IAs sempre repõem faixa e bandeira (ordem do dono, 09/09/2026)

"As torcidas IA sempre vão tentar ter uma faixa e uma bandeira; caso não
tenham, vão comprar como prioridade."

- `reporPanos(E, t, id)` em `relacoes.js`, chamada na semana de cada
  torcida logo depois de `promoverDelas` e ANTES da fila de compras: sem
  faixa na sede (`faixas < 1`) e com R$ 5.000 em caixa, compra uma; sem
  bandeira e com R$ 2.000, compra uma. A faixa vem primeiro por ser a
  mais cara. Cada compra entra no extrato dela ("Faixa nova", "Bandeira
  nova"), pelo preço da loja do jogador.
- É a compra da semana: quem repôs não anda a fila naquela semana. A
  torcida que perde a faixa toda semana gasta a semana nisso — é o que
  "prioridade" quer dizer.
- Quem está no vermelho não compra (o ramo do vermelho vem antes e
  segue pra próxima torcida), como qualquer outra compra.
- Medido (`panos-ia.js`): com faixa e bandeira zeradas, Gaviões com R$ 20
  mil repôs as duas; Galoucura com R$ 3 mil só a bandeira; Cearamor com
  R$ 1 mil nada.

## A Loja do Financeiro e a peça que muda de mão na rua (pedido do dono, 09/09/2026)

"Reorganize as compras em uma nova tela do financeiro chamada Loja,
organizando por natureza, numa proposta de layout diferente, facilitando
as compras rápidas como bomba, faixa e bandeira. Faça com que algumas
brigas entre torcidas IA dêem faixa ou bandeira para o vencedor, em
torno de 5% das brigas."

- A aba LOJA entra no Financeiro (Resumo · Loja · Patrimônio · Elenco ·
  Transações). O cartão "Adquirir e ampliar" SAIU do Patrimônio, que
  ficou com a Estrutura (o que rende) e as faixas e bandeiras (o que a
  torcida tem), mais um botão que leva pra Loja.
- `opcoes(E)` em `patrimonio.js` etiqueta cada item com a `natureza`
  (`naturezaDe(id)`): material (faixa, bandeira, bombas), sede (sede,
  anexos, área de treino, fábrica), pontos (bar, loja, subsede — abrir e
  ampliar), filiais (subsede de fora e ampliação), pessoal (professor
  de MMA, advogado, dispensas), frota (ônibus).
- O layout (`pintarLoja` em `main.js`, CSS `.loja-*`): a faixa do caixa
  em cima; a COMPRA RÁPIDA em três cartões grandes — Bombas com contador
  (−/+, atalhos 5/10/20, total na hora, compra `comprarBombas` na
  quantidade), Faixa e Bandeira com a prévia da PRÓXIMA peça, a
  contagem na sede e um botão; embaixo, uma seção por natureza, com os
  itens em grade de cartões (título, nota, preço, botão; o dropdown da
  cidade dentro do cartão da subsede de fora; "sem custo · Confirmar"
  nas dispensas). Item travado fica apagado com o motivo em vermelho.
- Cinco sub-abas não cabiam em 390px (cortava "Transações"): em tela
  estreita a fileira de sub-abas quebra linha.
- A PEÇA NA RUA: `registrarBrigaIA` — por onde passam a briga de dia de
  jogo, a treta marcada e o bar delas — sorteia `CHANCE_PANO_BRIGA =
  5%`. Saindo, o vencedor leva a faixa ou a bandeira do perdedor (a que
  ele tem; as duas, tira na sorte): a contagem do perdedor desce, a lista
  de tomadas do vencedor sobe, prestígio como na arquibancada (faixa
  −10/+5, bandeira −5/+2 na régua de 0 a 100), e `reg.pano` fica no
  registro. Aparece na fita ("e ficou com a faixa da X"), em Notícias →
  Brigas (em ouro) e no perfil da torcida ("tomou/perdeu a faixa"). Na
  semana seguinte o perdedor repõe na loja (regra anterior).
- Medido: 524 brigas simuladas, 23 com peça (4,4%), contagens batendo
  (10 faixas e 13 bandeiras mudaram de mão). A Loja: compra de bandeira,
  faixa, 7 bombas e a sede pela tela, extrato com os três lançamentos,
  sem rolagem horizontal em 1280 nem em 390.

## A faixa no varal, presa em três pontos (referência do dono, 09/09/2026)

O dono mandou a foto de uma faixa da TUF estendida: "segue a forma que
eu queria que a faixa ficasse, sem ser perfeitamente reta. Veja o que
você consegue replicar, se ficar ruim, descarte." E corrigiu a primeira
leitura: "não é efeito de pano ondulado, mas sim de pano estendido num
varal, com 3 pregadores segurando — sem os pregadores." A tentativa
anterior (barriga caindo no meio) tinha sido reprovada; a onda de tecido
balançando foi a primeira versão desta e também caiu.

- `ondularPano(lisa, c, semente)` em `patrimonio.js`: a arte lisa
  (400×100, a mesma de antes) entra numa tela de 400×124 com margem
  transparente em cima e embaixo, em 100 fatias verticais. A faixa está
  presa nas pontas e no meio (t = 0, 0,5 e 1) e cai entre os pregadores
  por um cosseno — `(1 − cos 4πt)/2`, que chega redondo no pregador; o
  seno partido em dois vãos fazia um bico no meio com costura de sombra.
  O topo cai 6 a 9 px, a barra de baixo 3 a 5 px a mais (varia por faixa
  pela semente `id|variante`), e o declive pinta a dobra: sombra até 14%
  descendo do pregador, brilho até 8% subindo pro próximo.
- A bandeira segue lisa (é um quadrado com escudo, não um pano
  comprido).
- Na cena, `F.h` sobe 24% pra que o tecido visível continue com 1/6 do
  comprimento; a sombra deixou de ser um retângulo preto atrás e virou
  o próprio pano em preto (`filter: brightness(0)`, 50%), deslocado 3 px
  — reta ou no arco do alambrado. Sem imagem carregada, o retângulo
  volta.
- `.faixa-img` no Patrimônio e na Loja ficou 180×56 sem borda nem caixa
  de sombra (a margem transparente mostraria a caixa); a sombra é
  `drop-shadow`, que acompanha o recorte.
- No meio do caminho um recorte errado apagou `dizerDaFaixa`,
  `telasFaixa` e `escudoSrc` do arquivo (o módulo nem carregava);
  voltaram do git antes do commit.
- Conferido em prévia grande (Gaviões, Galoucura, Cearamor, TUF) e nos
  cortes de cena; testes `faixas`, `faixa-tomada-regra`,
  `faixa-bandeira` e `loja` seguem passando.

## A faixa alinhada com o alambrado, medido na imagem (correção do dono, 10/09/2026)

"Perceba que a faixa não fica alinhada com o alambrado em muitos casos,
como no da imagem. Vasculhe os casos que ela não fica alinhada e
corrija." A foto era a quina do mandante 1 no estádio de 10 mil: a
faixa curvava num arco que não era o do muro.

- O ajuste anterior amostrava a borda da MÁSCARA caminhável com raios
  paralelos a `dir`. Numa quina, raios paralelos cortam a curva de
  través e o círculo ajustado sai com centro e raio errados; e a
  máscara tem células de 8 px, então a borda dela é uma escada.
- Agora a cerca é medida na própria imagem (`cerca-ajuste.js`): o fundo
  é desenhado numa tela 1536×1024, o gramado é classificado por matiz
  (42°–150°, saturação > 0,14), as linhas do campo são fechadas por
  dilatação e erosão de 3 células, e só o componente ligado ao centro
  conta como campo. A borda desse componente é a referência nos
  estádios de 10 e 20 mil; no de 40 mil os setores ficam no anel de
  cima, longe do gramado, e a referência é a frente do anel caminhável,
  amostrada AO LONGO DA CURVA atual (raio radial) ficando com a
  transição mais perto da cerca de hoje — os vomitórios no meio do anel
  paravam o raio antes.
- Onde a faixa pendura em cada estádio: no de 10 mil, 3 px fora do
  gramado (o muro encosta na grama); no de 20 mil, 34 px fora — a linha
  das placas, que é onde a arquibancada começa (medido nos quatro
  setores retos: 33 a 38 px); no de 40 mil, a frente do anel.
- Pra cada âncora, círculo (Kåsa) e reta por mínimos quadrados nos
  pontos a até len/2 + 10 da cerca, com comprimentos 150, 110 e 80: fica
  o maior comprimento com desvio ≤ 6 px (gramado) ou 7 px (anel); arco
  só com raio ≥ 45 e desvio abaixo de 90% do da reta; reta quase no eixo
  vira eixo. Atrás do gol do 20 mil a placa faz um degrau reto — arco
  ali é ajuste ao degrau, então é reta, e a faixa encurta pra 110 pra
  não atravessar o degrau.
- O que mudou: 10 mil mandante 1 virou RETA (o trecho de 150 px é reto
  dentro de 2,4 px; o arco que havia era o erro da foto) e moveu 20 px;
  20 mil visitante 2 e 3 ganharam o centro medido (453,320) em vez de
  (478,349)/(463,330), com 150 de comprimento; 40 mil mandante 1 e
  visitante 2 viraram reta (o anel é reto dentro de 4 px nesses 150 px),
  visitante 3 ficou em arco de centro (532,623). Os demais moveram
  menos de 5 px.
- Conferido em cortes de 300 px de cada setor dos três estádios com
  todos os setores ocupados (`cortes-setores.js`); `faixa-tomada-regra`
  e `faixa-setores` passam.

## Quatro telas reformadas e a foto do troféu (aprovado pelo dono, 10/09/2026)

Dos seis mockups apresentados o dono aprovou quatro: perfil do membro,
tela de membros, patrimônio e relatório da noite — este com uma mudança:
"a foto da faixa ou bandeira tomada vira uma imagem dos bonecos do jogo
segurando a faixa tomada, no fundo um cenário de viela urbana de classe
baixa". Feed e diplomacia ficaram como estão.

- PERFIL DO MEMBRO (`abrirFicha`): coluna única. Cabeçalho com as
  iniciais num círculo nas cores da torcida, nome completo e etiquetas
  (cargo, idade e declínio, situação, sede ou subsede, arquétipo); as
  pendências (fiança, promoção) continuam em cima; força e defesa em
  barra grande contra o teto, XP contra o corte do cargo; cinco números
  lidos do histórico (feridas, prisões, promoções, faixas, mensalidade);
  a linha do tempo do histórico do mais recente pro mais antigo, com a
  cor do tipo (ferida vermelha, cadeia verde-PM, promoção verde, faixa
  ouro). O modal passou a `media` e o título é "Perfil do membro".
- MEMBROS (`pintarTorcida`): a coluna de filtros à esquerda saiu. Em
  cima, cinco cartões de resumo (efetivo e de pé, aptos a promoção com o
  custo total, feridos, presos com ou sem advogado, média de força e
  defesa na régua ×5) — os quatro primeiros clicam e filtram; depois os
  filtros em linha por cargo com contagem e por estado (de pé, ferido,
  preso, apto a promoção — `filtroEstado`), a busca à direita; a tabela
  ganha a coluna de ação com o botão Promover na linha de quem bateu o
  corte (o recado "a promoção mora no perfil" saiu). "Apto" na Situação
  virou "De pé" — apto agora é apto a promoção.
- PATRIMÔNIO (`pintarPatrimonio`): as cores no topo (faixas, bandeiras e
  as tomadas, de cabeça pra baixo, num bloco só), a sede numa linha com
  bairro, lotação em barra (vermelha de 90% pra cima), professores,
  advogados e a manutenção; um cartão por ponto de `PAT.linhas` com
  receita e despesa em barra na mesma escala e o saldo do mês (borda
  vermelha quando negativo); o total; e o botão pra Loja no fim.
- RELATÓRIO: o bloco "Troféu da noite" entra logo abaixo do título
  quando TOMAMOS faixa ou bandeira (`blocoTrofeu`): as legendas (peça,
  torcida, prestígio movido) aparecem na hora e a foto revela em
  seguida.
- A FOTO (`fotoDoTrofeu` em `bonecos3.js`): uma cena THREE própria,
  descartada depois do quadro. A viela é procedural — muro de tijolo em
  canvas com reboco caído e a pichação "AQUI É {SIGLA}" nas cores da
  torcida, muros laterais de reboco sujo, chão de asfalto com poça,
  caçamba, sacos de lixo, pneu e um poste com lâmpada acesa; luz de fim
  de tarde mais o poste amarelo, névoa ao fundo. Quatro bonecos GLB dos
  nossos (os quatro primeiros de pé da sede, na ficha de sempre com as
  cores da torcida), os dois do meio com os braços pra frente segurando
  o pano — um plano com a textura da peça tomada, de cabeça pra baixo,
  com o topo nas mãos — e os das pontas de punho pro alto. O modelo
  olha pra −Z e a câmera está em +Z: em vez de adivinhar, a função mede
  onde a mão ficou depois da pose e dá meia-volta em quem está de
  costas. 720×405, JPEG a 86%, ~60 KB, 2,2 s no swiftshader. Sem WebGL
  ou sem GLB carregado em 6 s, o bloco fica só com as legendas.
- AJUSTES DO DONO (10/09/2026, depois de ver): na foto, o pano vai das
  mãos ao chão — uns 65% da altura do boneco —, os QUATRO seguram
  (braços pra frente um pouco abaixo do ombro, lado a lado a 20 px), a
  cena virou noite (céu a 38%, poste amarelo a 1,6, tijolo mais escuro)
  e o muro ficou só com a sigla, maior. Os cartões de resumo da tela de
  membros saíram (ficam os filtros e a tabela).
- Testado (`telas-aprovadas.js`): as três telas em 1280 e 390 sem
  rolagem horizontal, perfil com cinco eventos na linha do tempo, e um
  ataque ao bar da Cearamor em que derrubamos o portador — o relatório
  abriu com o troféu, as legendas e a foto revelada. `faixas` (com o
  seletor novo do Patrimônio) e `loja` passam.

## O Patrimônio volta ao layout antigo (correção do dono, 10/09/2026)

"Preciso do retorno à tela anterior" foi lido como botão de voltar, e
era o contrário: "eu te expliquei errado: preciso que a tela patrimônio
tenha o layout antigo".

- `pintarPatrimonio` volta ao que era em `0adabdd`: a tabela da
  Estrutura (local, receita, despesa, mês, com o total), o botão
  "Comprar e ampliar é na Loja →" e o quadro das Faixas — as nossas, as
  tomadas de cabeça pra baixo e as bandeiras. Os auxiliares
  `comprar`/`oferta` não voltaram: já estavam mortos ali desde que a
  compra foi pra Loja.
- Saíram junto os dois botões de voltar (Patrimônio e Loja) e o rastro
  `subFinAnterior`, mais o CSS `.pat-*` e `.volta-linha`, que ficaram
  sem uso.
- O cartão de patrimônio EM CARTÕES fica descartado; as outras três
  telas aprovadas (perfil do membro, membros, relatório com o troféu)
  seguem como estão.

## A pirâmide da pequena (ordem do dono, 10/09/2026)

"Quero que as torcidas menores surjam com mais membros da diretoria,
linha de frente e componentes, pra compensar a falta de membros e serem
mais competitivas contra as grandes."

- COMO ERA: a fonte dá a mesma pirâmide pra todo mundo, do bonde de 20
  ao de 250 — 5,0% diretoria, 14,9% frente, 30,0% componente, 50,0%
  povão, medido nas 140 torcidas da planilha. Como a briga é efetivo ×
  ficha média, a pequena entrava com a MESMA média (5,7) e um décimo do
  efetivo: perdia duas vezes.
- A RÉGUA NOVA (`compensarPequena` em `membros.js`, dentro de
  `planoDeCargos`, que é por onde passam o elenco do jogador e o quadro
  de toda IA): até 25 membros vale a pirâmide cheia — 12% diretoria,
  28% frente, 35% componente, o resto de povão; de 150 pra cima nada
  muda; no meio o peso cai em escala logarítmica, porque 20 e 40
  membros são mundos diferentes e 200 e 220 não. Quem sobe SAI DO
  POVÃO: o efetivo total continua o que a fonte diz.
- A DIRETORIA NÃO PASSA DO TETO DA SEDE; o excedente vira linha de
  frente. Sem isso, 58 das 140 torcidas precisariam de uma sede maior
  só pra caber a diretoria nova, com a manutenção que vem junto — e
  medido, a ficha média fica praticamente igual (7,90 contra 7,91 na
  faixa até 30 membros). `planoDeCargos` passou a receber o nível da
  sede; `estado.js`, `relacoes.js` (quadroDe) e a ficha da seleção em
  `main.js` passam o que já calculavam.
- MEDIDO no jogo, por faixa de efetivo (diretoria / frente / componente
  / povão e a ficha média):
  até 30: 8,7 / 30,8 / 35,2 / 25,3 · ficha 7,81 (era 5,70)
  30 a 60: 7,9 / 27,5 / 33,8 / 30,8 · ficha 7,35 (era 5,72)
  60 a 120: 6,4 / 21,2 / 32,1 / 40,3 · ficha 6,53 (era 5,70)
  120 a 250: 4,9 / 15,3 / 30,1 / 49,6 · ficha 5,72 (era 5,70)
  acima de 250: sem mudança.
  Uma torcida de 20 sai de 114 de poder pra 156: contra a de 250 ainda
  perde, contra as de 60 a 80 fica páreo — que é o que a compensação se
  propõe a fazer.
- Conferido (`piramide.js`): nenhum plano estoura o efetivo da fonte,
  nenhuma diretoria passa do teto da sede, e a Aliança (20 membros)
  abre com 2/6/7/5 no lugar de 1/3/6/10, ficha 7,6. `faixa-tomada-regra`
  e `promo-ia` seguem passando.

## A foto do troféu é tirada dentro da cena da briga (pedido do dono, 10/09/2026)
- PEDIDO: "vamos alterar essa imagem pra ser uma tela vista dentro da
  cena que ocorreu a briga, por exemplo: se a tuf tomou a faixa no bar,
  os 4 membros estão dentro do bar com a faixa estendida, com a visão de
  longe, idêntica à visão do jogador".
- A viela urbana genérica saiu. `fotoDoTrofeu` agora recebe a cena
  (`ctx.cena`, ou a que os arredores estiverem mostrando), chama
  `arredores.usarCena` se for outra, espera a foto aérea, desenha o fundo
  da própria cena com `desenharFundo` e põe os quatro bonecos por cima
  com a MESMA câmera de cima da briga: ortográfica a 1000 de altura,
  `up` em −Z e o cisalhamento de 0,42 de `ajustarCamera`. O que sai é o
  enquadramento que o jogador conhece, só que parado e de longe.
- O recorte é de 400 unidades de cena de largura (a cena tem 1536), preso
  às bordas: o boneco sai com uns 50 px de altura e o pano com 190 — dá
  pra ler o pano e reconhecer o lugar ao mesmo tempo.
- ONDE POSAR (o que deu trabalho): a primeira versão mirava a média dos
  postos de saída. No bar essa média cai em (613, 356) — no meio da RUA
  ao lado, porque o atacante nasce na vertical oeste e o salão fica a
  nordeste. A foto do bar saía na rua. A ordem de preferência agora é:
  1. a parede em que o pano do lado PERDEDOR estava pendurado
     (`cenas.faixas[outroLado*]`), recuada 72 unidades pra dentro — é
     literalmente onde o pano foi tomado;
  2. o quartel do lado perdedor (média dos spawns dele);
  3. o meio da briga (média de todos os spawns);
  4. o centro da cena.
  Cada centro tenta a fila de quatro em quatro folgas — passo 30/26/22/18
  com raio de boneco 9/8/7/6 — antes de passar pro próximo, e o raio de
  busca em espiral é curto no centro bom (150) e vai abrindo (220, 340,
  420). Assim o salão apertado ganha da rua larga ao lado.
- O PANO FICA NAS MÃOS E DE CABEÇA PRA BAIXO (pedido do dono, 10/09/2026:
  "coloque os membros segurando a faixa e que ela fique esticada de
  cabeça pra baixo"). Faixa tomada se exibe invertida — é assim que o
  troféu se mostra —, então o desenho leva um `rotate(PI)` a mais, só na
  imagem (a sombra fica no ângulo da fila, senão ela viraria pro lado
  errado).
- Pôr o pano "a tantas unidades dos pés" não serve: o cisalhamento levanta
  o corpo na tela e o vão aparece. Agora os ossos das mãos (`c.J.mao`)
  são projetados PELA PRÓPRIA câmera da foto e trazidos de volta ao
  espaço da cena, que é o que o desenho 2D usa. O pano vai da mão mais à
  esquerda até a mais à direita (mais 8 de folga) e pendura da linha das
  mãos pra baixo.
- OS BRAÇOS TIVERAM DE DESCER. Com `ombro` em −1,25 (que é braço pra
  TRÁS, não pra frente — medido: a mão caía 20 unidades acima dos pés,
  acima da própria cabeça) o pano pendurado na mão tapava o boneco
  inteiro. Medido osso a osso na cena do bar: pé a 563,3 · cabeça a
  549,0 · ombro a 550,2. Com `ombro` em +0,95 e `cotovelo` em +0,15 a mão
  vai pra 560,4 — logo à frente do pé —, o pano começa ali e a torcida
  inteira fica à vista atrás dele.
- MEDIDO (`trofeu-foto.js`, 4,9 s pras três): bar → dentro do salão, piso
  quadriculado, mesas e engradados; praça → a rua entre os sobrados e o
  calçadão das barracas; estádio-20 → a arquibancada com o gramado à
  direita. Nas três os quatro aparecem inteiros, segurando o pano
  invertido pelas pontas. `telas-aprovadas.js` segue passando: o relatório abre com o
  bloco do troféu, a foto revelada e a legenda da faixa tomada.

## Bar atacado fica quebrado 45 dias (ordem do dono, 10/09/2026)
- ORDEM: "bar atacado diminui 50% da receita por 45 dias, no sentido
  dele ter sido danificado pelo ataque".
- A marca fica no PRÓPRIO bar (`b.danoAte`, em dia absoluto), e não na
  torcida: o nosso patrimônio e o das IAs guardam bar como objeto de
  lista, então a mesma função serve pros dois lados. Em `financeiro.js`:
  `DANO_BAR = {dias:45, corte:0.5}`, `danificarBar`, `diasDeDano`,
  `multDano` e `barMaisVisado`.
- QUEBRAM O BAR MAIS CARO. Quem invade vai no que tem vidro, mesa e
  geladeira pra quebrar, então o alvo é o de maior nível — e não um
  sorteado, que faria o estrago sumir na torcida com três bares.
- ATAQUE EM CIMA DE ATAQUE NÃO EMPILHA, RENOVA: o prazo passa a contar
  do estrago de agora. Empilhar deixaria o ponto morto por meio ano.
- A DESPESA NÃO CAI. Conserto de vidro e de mesa é justamente o que dói:
  o bar continua custando manutenção cheia enquanto rende metade.
- Vale nos três lugares em que se quebra bar: defesa nossa perdida
  (`fecharDefesa`), ataque nosso ganho (`fecharAtaque`) e briga de IA
  contra IA (`barIA` em `relacoes.js`). Nos dois primeiros a linha entra
  no relatório da cena ("o bar ficou em cacos: metade da receita por 45
  dias").
- ONDE APARECE: a linha semanal do financeiro ganha "· quebrado, N d" e
  a Estrutura do Patrimônio ganha a nota "quebrado no ataque: metade da
  receita por mais N dias". A mesma marca aparece no extrato delas.
- MEDIDO (`bar-dano.js`): bar nível 1 em Antônio Bezerra sai de R$ 393
  pra R$ 173 na semana do ataque e volta a R$ 345 no dia 45 (a diferença
  entre 393 e 345 é a moral que caiu com a defesa perdida, não o dano).
  Do lado da IA, o bar da Cearamor em Maraponga cai de R$ 2.204 pra
  R$ 873. `caixabar`, `barataque`, `bardefesa` e `financeiroia` seguem
  passando.

## A sede tem uma planta por nível (projeto do dono, 10/09/2026)
- O dono mandou o projeto ANTIGO das plantas de sede, cinco desenhos, um
  por nível. Estão salvos em `docs/plantas/sede-nivel-1..5` — são a
  referência, e a proposta de cena foi refeita em cima deles.
- A PLANTA MUDA COM O NÍVEL, e isso responde a pergunta que a primeira
  proposta deixava em aberto. As salas, na ordem em que aparecem:
  - nv 1: pátio, presidência, patrimônio.
  - nv 2: + bar, sala de criações, sala de treinos.
  - nv 3: + centro de operações, dormitório, lojinha, corredor
    (a sala de criações vira "setor criativo").
  - nv 4: + garagem e loja grande.
  - nv 5: + minifábrica, hotel, corredor central
    (a sala de treinos vira "academia de treino").
- PROFUNDIDADE NÃO É A VARIÁVEL. Foi o que a primeira proposta media, e
  os desenhos derrubam: nas plantas do dono quase toda sala abre pro
  pátio ou pro corredor, ninguém fica a cinco portas da rua. O que cresce
  com o nível é a QUANTIDADE de sala — três no nv 1, onze no nv 5. A
  régua vira orçamento de passos: o invasor entra com uns 4 passos (mais
  1 a cada 15 caras de vantagem, teto 8), cada sala custa passo, e sede
  grande não cabe numa invasão só.
- CADA SALA DO DESENHO JÁ TEM DONO NO CÓDIGO: presidência = o caixa e a
  diretoria; patrimônio = as faixas e bandeiras, nossas e tomadas; bar =
  a régua de 45 dias que já roda; sala de criações = o material de faixa;
  sala de treinos = `areaTreino`; centro de operações = o planejamento e
  o olheiro; dormitório = quem dorme na sede; lojinha/loja = o ponto
  comercial; garagem = a frota; minifábrica = `FABRICA` (sede nv 5, corta
  50% do custo das lojas); hotel = a recepção de aliadas.
- OS TRÊS ANEXOS NÃO GANHAM SALA, viram móvel dentro de sala do desenho:
  cofre blindado (nv 5) na presidência, enfermaria (nv 4) no dormitório,
  galpão de material (nv 3) no patrimônio. O efeito de cada um continua o
  que já é no código.
- O QUE OS DESENHOS REVELARAM: (a) nos nv 4 e 5 a presidência encosta na
  parede externa, a um ou dois passos do portão — com o caixa lá dentro,
  o cofre deixa de ser luxo, e fica assim de propósito; (b) o corredor
  não guarda nada e custa passo do invasor, então é a defesa mais barata
  da planta e justifica subir de nível sozinho; (c) loja e garagem têm
  porta pra rua nos nv 4 e 5, então dá pra saquear a loja SEM entrar na
  sede — talvez mereça ser um tipo de ataque separado.
- EM ABERTO, com o dono: o nível 6 reusa a planta do 5 ou ganha desenho
  próprio; o fundo vem de foto aérea ou de planta desenhada; o jogador
  defende jogando ou só vê o resultado; quanto vale um passo em segundos.
- NADA DISSO ESTÁ IMPLEMENTADO. A proposta desenhada está publicada como
  artifact ("Planta da Sede").

## Parede de sede é crista de brilho, não cor (10/09/2026)
- A cena de sede é de DENTRO, e isso quebrou a extração de máscara que
  vale pras cenas de fora. Lá a construção sai por cor: telha é laranja
  (`R > G+18 && R > B+22`), mato é verde, e o que sobra de cinza entre
  luminância 42 e 232 é chão. Numa sede sem telhado não existe telha
  nenhuma — o topo do muro é o MESMO concreto cinza do pátio.
- MEDIDO na 3ª foto do nível 1: 73,3% do quadro virava chão de andar, com
  todas as paredes internas e o muro externo dentro do chão. O jogador
  atravessaria parede.
- O QUE SEPARA É A FORMA. O topo da parede é uma faixa mais clara que a
  vizinhança imediata dela; o piso, mesmo o de ladrilho claro, é chapado.
  `chao()` ganhou o parâmetro `crista`: tira do candidato tudo que estiver
  `crista` níveis de brilho acima da mediana de janela 61, e faz isso
  ANTES da morfologia — depois dela a textura do piso vira cisco e o vão
  da porta fecha.
- CONFERIDO com a semente SÓ da rua: o chão entra pelo portão, toma o
  pátio, atravessa as duas portas e enche o gabinete e o depósito. Se uma
  sala não acendesse, seria porque a porta não existe na foto — o teste
  de conectividade e o de porta viraram o mesmo teste.
- O `recorte` da sede tem dois retângulos: a rua inteira com os dois
  passeios (é dela que o atacante nasce) e o quarteirão da sede. Sem o
  segundo, o quintal do vizinho entrava junto.
- RESULTADO: 51,7% de chão, paredes bloqueadas, vizinhos de fora. As 14
  cenas antigas saem com a máscara byte a byte idêntica — `crista` é 0 por
  padrão e só a sede pede. `varredura-cenas` passa nas 18.
- A ARTE NÃO MUDA por causa disso: parede de concreto cinza está certa.
- A RUA INTEIRA entra no quadro, de ponta a ponta, com as duas calçadas
  (pedido do dono): é o espaço de spawn e de aproximação do atacante.
- COLCHÃO NO PÁTIO só onde não há onde dormir — níveis 1 e 2, encostado na
  parede lateral, meio do pátio livre. Do 3 em diante tem dormitório (3 e
  4) ou ala de hospedagem (5), e colchão solto vira bagunça.

## A queda de FPS com faixas na tela era o `filter` do canvas (10/09/2026)
- RELATO do dono: "as cenas que tem muitas faixas e bandeiras, como a
  cena do estádio, ficam com a framagem baixa" e, decisivo,
  "assim que as faixas sao recolhidas a framagem melhora".
- MEDIDO antes de mexer, no estádio de 40 mil com 8 faixas expostas: a
  camada 2D custava 2,58 ms por quadro com faixa e 0,10 ms sem — 96% da
  camada era pano. No container o WebGL é software e engole o quadro
  inteiro, então medir FPS de tela esconde isso; o jeito de enxergar foi
  cronometrar só a passada 2D (`bench-faixas.js`).
- ABLAÇÃO (`bench-pano.js`, determinística — mesma imagem, mesma
  geometria, 8 faixas por quadro). Faixa RETA: hoje 1,98 ms · sem o
  filtro 0,47 · sem filtro e sem fatiar 0,11. Faixa em ARCO: hoje
  4,91 ms · sem o filtro 1,79 · com as fatias que a curva pede 0,35.
  O `c.filter='brightness(0)'` sozinho respondia por 1,51 dos 1,98 na
  reta e por 3,12 dos 4,91 no arco.
- CAUSA 1, a grande: a sombra do pano era o próprio pano desenhado em
  preto com `c.filter`. Filtro de canvas 2D força um caminho de
  composição à parte, e ele era pago em CADA fatia de CADA faixa de CADA
  quadro. Trocado por uma SILHUETA preta pré-rendida uma vez por imagem,
  guardada num `WeakMap` — a sombra virou `drawImage` comum. Não se
  guarda silhueta de imagem ainda sem tamanho: a faixa chega por `Image`
  e pode não ter carregado no primeiro quadro.
- CAUSA 2: o pano reto era fatiado em 28 pedaços pra acompanhar uma
  barriga que NÃO EXISTE MAIS — o dono reprovou a deformação em
  09/09/2026 e `caidaDoPano` devolve 0 desde então. 28 fatias iguais
  lado a lado dão o mesmo pixel que um `drawImage` só. `panoLiso()`
  detecta a queda zero e usa uma fatia.
- CAUSA 3: no ramo do ARCO as fatias são necessárias (cada uma gira um
  pouco pra acompanhar o alambrado), mas 28 era número redondo, não
  conta. A flecha de cada corda é R·(1−cos(vão/2N)) ≈ R·vão²/8N²; pra
  ficar abaixo de 0,35 unidade — menos de meio pixel na tela — basta
  N = vão·√(R/2,8), com piso 6 e teto nos 28 de antes. No alambrado do
  estádio de 20 mil dá 7.
- MEDIDO DEPOIS, no jogo, pares casados na mesma cena: estádio de 40 mil
  (só faixa reta) 0,68 → 0,08 ms de custo de pano; estádio de 20 mil
  (2 em arco) 0,79 → 0,35 ms. ATENÇÃO ao ler esse par: a medida de cena
  é RUIDOSA — quais faixas saem é sorteio, e com a máquina ocupada o
  próprio piso sem faixa varia de 0,08 a 1,6 ms. Quem manda no registro
  é a ablação determinística acima; o par de cena serve pra confirmar a
  ordem de grandeza, não pra cravar número.
- O PIXEL FOI CONFERIDO, e não só o relógio (`pano-pixel.js`): o desenho
  novo difere do antigo em 5% dos pixels, e a diferença está NAS EMENDAS
  das 28 fatias e no reamostrar de cada pedaço. O antigo tinha costura;
  o novo não. É melhora, não regressão. No ramo do arco a diferença
  ficou em 0,08% dos pixels.
- Na tela, o estádio de 20 mil sai idêntico antes e depois da troca
  (`faixa-tela.js`), e `varredura-cenas` passa nas 18.
- ONDE MAIS ISSO VALE: não sobrou nenhum `c.filter` no caminho de
  desenho do jogo. Se algum dia voltar a fazer falta, a saída é a mesma
  — pré-renderizar o efeito uma vez, e não por quadro.

## Cinco acertos de dados do censo (decisão do dono, 10/09/2026)
- São José sobe de 1% pra 2% em Porto Alegre, e o ponto sai do Grêmio
  (38 → 37). Com isso a regra do dono — toda torcida com pelo menos 2% na
  cidade-sede — vale em 139 de 139.
- A Mancha Negra é APAGADA. Era um registro sem clube, cidade, mapa, UF
  nem região, marcado `incompleta` e mantido "pra não sumir sem ninguém
  notar". O dono notou e mandou apagar. O importador (`importar_relacoes`)
  agora descarta registro sem clube ou cidade e imprime o nome no fim.
- Os sete nomes de praça ficam UNIFICADOS pelo nome canônico da praça
  (Bahia, Mato Grosso, Alagoas, Maranhão, Interior de Minas, Região de
  Campinas, Litoral Catarinense), que é a decisão já escrita no
  importador de bairros ("o mapa representa a região inteira e não só a
  capital"). O registro da torcida passa a carregar esse nome, lido de
  `cidades.js`; a planilha só serve pra achar o id. 28 torcidas mudaram
  de nome de cidade, nada mais.
- O piso de 20 membros FICA.
- As sete praças de interior sobem pra 1.000 mil habitantes (eram 800,
  e o Interior do CE 600). Os `torcedoresEstimados` de cada clube foram
  recalculados como perc% × população, que é a conta que a fonte já
  usava (conferido: 0 divergências antes da mudança). A população do
  jogo vai de 61.050 pra 62.650 mil.
- ARMADILHA ENCONTRADA AO REGENERAR: `torcidas.js` carregava nove
  divisões de clube decididas pelo dono em commits anteriores (Joinville,
  Inter de Limeira, Amazonas, Ferroviário, Floresta, CSA, Sergipe,
  Brasiliense) que existiam SÓ no arquivo gerado, não na fonte. Regenerar
  as revertia. As nove foram levadas pra `torcidas_relacoes.json` antes
  da regeneração; conferido campo a campo que o único diff além disso é
  o nome de cidade. Lição: arquivo "gerado, não editar à mão" que foi
  editado à mão precisa ter a edição levada pra fonte ANTES de qualquer
  regeneração.
- Os dois JSONs de fonte são CRLF; reescritos com o mesmo fim de linha
  pra o diff ficar nas 128 linhas de conteúdo e não nas 9.123 do arquivo.

## A Bamor não fecha a TUF em Fortaleza num dia em que não está lá (10/09/2026)
- RELATO do dono, com print: jogo Fortaleza × Fluminense em casa, e o
  cartão "Caiu em cima da gente · Bamor" na ida ao estádio. A Bamor é de
  Salvador.
- CAUSA: `alcanca(E, id)` decidia se uma torcida de outra praça pode nos
  atacar consultando `naRuaEm` pra QUALQUER dia de 1 a 7. A Bamor estava
  em Fortaleza noutro dia da semana, pelo Bahia, e o ataque era marcado
  pro dia do nosso jogo — em que ela já tinha ido embora.
- CORREÇÃO: `alcanca` aceita `dia`; o agendador do ataque em casa passa o
  dia do nosso jogo, e visitante só alcança a gente se está na cidade
  NESSE dia. Sem `dia` a função vale como antes, pros outros usos.
- MEDIDO (`alcance-dia.js`, `naRuaEm` falseado): visitante na cidade só
  no dia 3, jogo no dia 6, relação −100, 40 fechamentos de semana — ela
  vem 0 vezes; a mesma visitante no dia 6 vem 4 em 40, que é a chance
  normal. Continua valendo que visitante em dia de jogo pode fechar a
  gente: é assim que se cruza torcida na cidade.

## O planejamento é o cartão de segunda-feira do feed (pedido do dono, 10/09/2026)
- PEDIDO: "reimplementar a tela de planejamento no feed num visual
  overview mais detalhado, com uma aba por cidade (caso tenha subsedes),
  sendo uma tela por semana mostrando todos os jogos daquela semana,
  sempre na segunda-feira. O planejamento de caravana também será por
  essa tela, que vai ter um visual estilizado, prático e bonito."
- O CARTÃO (`kind:'semana'`, voz da diretoria) nasce em `semanaDeHoje`,
  dentro de `eventosDoDia`, todo dia 1 de semana com temporada. Com
  jogo nosso é DECISÃO: trava o relógio até "Fechar o planejamento",
  como a caravana travava; na folga é informação sem botão. A chave é
  `semana|ano|semana`, uma por semana.
- UMA ABA POR PRAÇA: a sede e cada subsede de `E.patrimonio.filiais`
  (`m.dados.cidades`); sem subsede não há linha de abas. A aba da
  subsede mostra os jogos daquela praça e quantos do núcleo local estão
  de pé; ela continua descendo por conta própria (as sugestões chegam
  como cartão, como antes).
- A PAUTA de cada aba sai de `pautaDaCidade(E, cidade, semana, ano)`
  (feed.js): os jogos da praça naquela semana via `jogosDaPraca`, que
  ganhou o parâmetro `cidade`; quem estará na rua com faixa de efetivo e
  hostilidade (na sede, `estimativasDaRua`; na subsede, as torcidas
  locais do mandante a 60% e as visitantes por `caravanaDe`); o nosso
  jogo fora entra na aba da sede, que é de onde a caravana sai; e os
  aliados que chegam, pra recepção.
- O PLANO MORA DENTRO DO NOSSO JOGO, com os mesmos gravadores dos modais
  antigos (`definirIntencao`, `definirAtaque`, `definirInvestida`,
  `definirRecepcao`, `pedirAjuda`, `comprarBombas`): contador da
  caravana (do mínimo aos interessados, passo de 10%), chips de estrada
  com custo e risco, o trajeto cidade a cidade com as hostis marcadas,
  ajuda da aliada de lá; chips Ir em paz / Atacar, alvo, onde
  (`ONDE_ATAQUE`), contador de efetivo em casa, contador de bombas (em
  casa compra na hora; fora só o estoque); o resumo do plano com o custo
  no rodapé. Nos outros jogos da praça, Deixar passar / Investir com
  alvo e onde. "Fechar o planejamento" é o `confirmar` de sempre (gasta
  ação de investida, marca `decidido`) e escreve a consequência no
  cartão.
- O CARTÃO SE REPINTA POR DENTRO a cada toque; pro `atualizarFeed` não
  remontar o cartão a cada tique, a chave de estado (`estadoDaMsg`) leva
  o plano inteiro (`chaveDoPlano`) e a aba aberta.
- SÓ A SEMANA CORRENTE TEM CONTROLE: o cartão de uma segunda passada
  fica no feed como registro, lê a semana dele (não a de hoje), todos os
  jogos como passados e sem botão nenhum — selo "semana passada". Sem
  isso, seis cartões de semanas antigas mostravam a semana de hoje com
  chips vivos escrevendo no mesmo plano (visto no teste, corrigido).
- O QUE SAIU: `painelPautaDaSemana` (a lista de jogos em Mensagens) e o
  cartão "Monta a caravana" do olheiro no dia do relatório — a caravana
  já foi fechada na segunda; o relatório do olheiro do jogo fora vira
  informação (quem vai estar na pista de lá, e o tamanho da caravana
  fechada). As sugestões de ataque do olheiro (dívida, rival) continuam
  como decisões, como o dono definiu em 08/09.
- MEDIDO (`cartao-semana.js`, `cartao-semana-fora.js`): cartão de decisão
  na semana 6 (jogo em casa) com 3 jogos, 10 chips, 1 contador; Atacar
  escreve intenção e alvo (Facção Jovem), o resumo acompanha ("em cima da
  Facção Jovem nos arredores · 1 bomba"), Ir em paz volta; Investir num
  jogo alheio grava a investida; Fechar marca respondido, `decidido`,
  solta o relógio e desabilita todos os chips. Semana 7 fora: contador
  129→116, custo −R$ 1.548→−R$ 1.392, rota, alvo da viagem (Garra
  Alvinegra), consequência "Caravana: 116 para Rio Grande do Norte". Com
  uma filial injetada aparecem as abas Fortaleza/sede e ABC
  Paulista/subsede, e a aba da subsede lista os jogos de lá. Regressões
  (`smoke`, `telas-aprovadas`, `varredura-cenas`, `ver-itinerario`) sem
  erro.

## O cartão de segunda fica discreto, com Investir na subsede; as sugestões do olheiro saem (dono, 10/09/2026)
- PEDIDO: "menos extravagante, a ponto do botão de fechar o planejamento
  não precisar de scroll pra ser clicado"; "senti falta dos botões de
  deixar passar e investir nas cidades subsedes"; e, na sequência,
  remover do feed o "Manda dar o bote?" da subsede e "as mensagens de
  sugestão de atacar torcidas na cidade também, já que o planejamento
  voltou".
- O BOTÃO SUBIU PRO CABEÇALHO do cartão: `cartaoMensagem` monta a barra
  de botões como sempre e, no cartão de semana, a encaixa em `.sem-cab`
  (à direita de "Semana N"). Dá pra fechar sem rolar em qualquer semana.
- DENSIDADE: cada jogo virou uma linha em grade (selo do dia de 38px à
  esquerda; clubes, competição e quem está na rua correndo à direita);
  os chips ficaram miúdos (11px, 2×7px de recheio), o plano do nosso
  jogo é uma pilha de linhas com rótulo à esquerda de 78px, e o texto do
  cartão ficou numa frase. Medido no mesmo cenário (semana 6, jogo em
  casa, 2 jogos alheios, 1 aliado): 880px → 527px de altura.
- INVESTIR NA SUBSEDE: a linha do jogo alheio na aba da subsede ganha
  Deixar passar / Investir, com alvo só entre as torcidas de fora
  hostis (a caravana que viajou, que é o que o bote pega) e o ponto em
  concentração ou pista. A investida vai pra `E.plano.investidas` com a
  chave `sub|cidade|semana|casa|visitante` e a marca `filial`; ela não
  gasta ação da semana nem entra em `E.investidas` (o núcleo de lá se
  vira sozinho, como o dono definiu em 25/08). No dia do jogo,
  `boteNaCaravanaRival` lê essa chave e propõe o bote SÓ no alvo e no
  ponto marcados, com o texto "como combinado na segunda".
- O QUE SAIU DO FEED: o "Manda dar o bote?" sem plano (o bote agora só
  existe com Investir marcado na segunda) e as sugestões de ataque do
  olheiro — "bolar um ataque" nos jogos da praça e o "Vingar" da dívida
  na viagem — desligadas por `SUGESTOES_DO_OLHEIRO = false` em
  `olheiroDoDia`, com o código no lugar. Ficam: o relatório de quem está
  na pista do jogo fora (informação), o pedido de casa da aliada, e a
  sugestão esporádica de bar da subsede (não é jogo, o cartão de semana
  não cobre).
- MEDIDO (`sem-sugestoes.js`, 70 dias com filial de 10 e relação −60
  com todas): nenhuma decisão `olheiro` nem `filial-caravana`; as
  decisões que apareceram foram abertura, aniversários, bar rival,
  assalto, semana, partida e a sugestão de bar da subsede.
  `cartao-semana-subsede.js`: Investir na aba ABC Paulista grava a
  investida com `filial`, e no domingo o bote vem "como combinado" na
  Leões da Fabulosa, na praça. Fotos em 1000px e 390px conferidas.

## Descartado (decisão do dono, 17/08/2026)
Indicador de tensão (permanente); Gestão como tela de menu; trair
aliado; formação da saída; escalação manual; plano padrão-retrato;
Início/WhatsApp/Conquistas/Opções como telas; sistema de polícia
(delegado, punição, banimento, revista); satisfação do torcedor comum;
Fator Torcida no placar; assaltos ao comércio (nossos e da IA);
noticiário de brigas entre IAs; materiais/loja (14 itens);
debandada; ticker; histórico de confrontos como telas; todas as notícias
antigas (as 9 categorias) — serão recriadas do zero, texto a texto, sob
crivo.
