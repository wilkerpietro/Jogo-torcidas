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

## Menu (7 itens)
Feed · Torcida · Financeiro · Calendário · Competições · Diplomacia ·
Notícias.

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
