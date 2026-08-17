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
  Fecho: relação −2, prestígio +1 pro ganhador e −1 pro perdedor.
- **Calendário do trimestre** (17/08/2026): a cada 13 semanas, 2 a 4
  tretas marcadas e 1 a 2 ataques ao nosso bar, sempre em dia comum.
  O bar saiu do sorteio semanal (caía 2x por mês).
- **Festa na sede custa R$ 700** e rende ~20% do que rendia.
- **Relógio por mensagem**: cada mensagem dropada segura a próxima por
  1,5 s; decisão sem resposta trava o tempo; dia sem mensagem passa
  rápido.
- **Expediente da Sede** (ex-rotina): três turnos por dia — manhã,
  tarde, noite — com rendimento reduzido (~35% do semanal por turno).
- **Ideologia**: aba da Diplomacia; é o que o botão "Seguir padrão"
  executa. Corte "quente" agora é relação < −55.
- **Bombas**: compradas na tela do ataque (R$ 120), sem loja de
  materiais.
- **relacoes.js** substitui tensao.js: tudo se baseia na RELAÇÃO
  (−100..+100); ataque de rival dispara com relação ≤ −55, briga derruba
  a relação (−22 típico) e a semana puxa devagar de volta ao natural.
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
  Supermercado 5/10 → 5-10k/10-15k, 50%, 180; Posto 5/10 → 2-3k/4-5k,
  30%, 120; Mercadinho 2/5 → 1-2k/3-4k, 20%, 60; Loja de roupas 2/5 →
  0,5-1k/2-3k, 10%, 30. Caiu, não leva nada. (A pena explícita pode
  ir a 360 dias; a da briga segue no teto de 90.)
- **Recrutamento por sorteio** (tabela do dono, 17/08/2026): cada
  campanha tira um dado — normal 20%/10%/70% (um/dois/ninguém);
  vitória no último jogo 30%/20%/50%; derrota 10%/5%/85%; 2 semanas
  após título ou acesso 40%/40%/20%; 2 semanas após rebaixamento
  10%/0%/90%. R$ 5 por novato; limite duro é a vaga da sede
  (50/90/150/200/500). A base da praça segue sendo o portão.
- **Prestígio na régua de 0 a 100** (17/08/2026): vitória rende no
  máximo +10 e derrota tira no máximo −10 — o teto negativo só com
  prejuízo grande de feridos e presos. Acabou o +30 por briga comum.
- **Ranking de torcidas** (17/08/2026): tela própria no menu. Pontos =
  (membros + prestígio×2) × média de força e defesa dos membros. O
  cabeçalho mostra #posição ao lado do nome e as médias de moral,
  ataque e defesa ao lado do prestígio.
- **Partida ao vivo** (17/08/2026): no dia do nosso jogo chega a
  mensagem com o botão INICIAR PARTIDA; clicado, o cartão vira uma
  barra de minutos (2' de jogo por segundo) e os gols do resultado —
  com a posição dos dois na tabela e o estádio no texto de abertura —
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
- **Relatório do olheiro em tabela** (17/08/2026): uma linha por jogo —
  competição, dia e o confronto com a cor de cada clube na esquerda;
  as torcidas do jogo com cor e estimativa na direita.
- **Ataque de nanica não existe** (17/08/2026): ataque sofrido só vem de
  torcida com pelo menos metade do nosso efetivo (na estrada, a régua é
  a caravana embarcada) — a cena que abria e acabava com o atacante
  correndo por minoria não acontece mais. O contrário segue valendo:
  efetivo muito maior que o nosso ataca à vontade. Quem vem traz a
  turma que o serviço pede: no mínimo os 30% de sempre, até ~90% do
  nosso bonde na cena, nunca mais de 70% da torcida dele.

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
