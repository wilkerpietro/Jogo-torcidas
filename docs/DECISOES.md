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
