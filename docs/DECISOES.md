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
