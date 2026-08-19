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
