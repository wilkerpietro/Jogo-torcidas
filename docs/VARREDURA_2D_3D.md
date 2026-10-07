# Varredura: o que o jogo 2D tem e o 3D ainda não (29/09/2026)

Pedido do dono (29/09/2026): "faça uma varredura nos motores de placar, briga,
e outras coisas do jogo 2D que ainda não foram implementadas na versão 3d".

**Como foi feita.** Quatro leituras do código em paralelo: placar e partida,
motor de briga, cenas que ainda caem na foto 2D, e o resto (gestão,
patrimônio, recados). Os itens do topo de cada lista foram conferidos de novo
no código antes de entrar aqui; os de baixo têm o arquivo e a linha de onde
saíram, mas não foram rodados um a um.

**Legenda do esforço.** P = pequeno (horas, um arquivo). M = médio (um ou dois
dias, mais de um arquivo, precisa de teste no 3D). G = grande (modelo novo,
cena nova ou mudança de fluxo).

**Tamanho do buraco.** O 3D já cobre o dia a dia: sede com vida, reunião,
cidade com gente, dia de jogo inteiro (bondes, PM, fila, arquibancada), a
caminhada com ataque na concentração e na pista, a invasão no estádio, a
estrada da caravana, a festa na casa de piscina, o bote no bar e a treta
marcada. O que falta se concentra em três lugares: **a briga dos arredores do
estádio** (a mais comum do jogo, ainda na foto 2D — feita depois, na terceira
rodada: seção 23 do `JOGO_3D.md`), **as consequências que não aparecem na
cidade** (bar quebrado, faixa tomada, sede ampliada) e **o que o cartão da
partida contava e o placar de TV não conta**.

---

## Resolvido nesta rodada

- **Pênaltis no placar de TV** (`dia3d.js`, `jogo3d.css`): o relógio mostra
  PÊN, o quadro da disputa enche cobrança a cobrança (verde fez, vermelho
  perdeu), com o placar da série e o recado ("Fortaleza — na rede!"); no fim,
  FIM e "X passa nos pênaltis, por 4 a 3". Dois avisos no canto direito: a ida
  pros pênaltis e quem passou.
- **Partida sem cidade 3D** (campo neutro, fora do país, praça que não montou):
  antes sumia inteira da tela; agora o placar de TV anda sozinho, lendo a
  mensagem da partida (gols, pênaltis, avisos).
- **O resultado fica na tela**: o dia fecha uns 2 s depois do apito e levava o
  placar junto; agora ele fica 8 s depois do apito. Na volta pela estrada, o
  resultado vai escrito no painel.
- **Siglas iguais** no placar (Corinthians × Coritiba dava COR × COR): quando as
  três letras batem, entra a sigla do clube no dado (SCCP × CFC).

Detalhes e testes na seção 21 do `docs/JOGO_3D.md`.

## Resolvido na rodada seguinte (29/09/2026, "pode fazer a próxima rodada nessa ordem")

Os cinco primeiros da tabela abaixo, na ordem; detalhes e testes na seção 22
do `docs/JOGO_3D.md`.

- **Faixa e bandeira na concentração e na invasão** (`combate.js`,
  `cenaDaFaixa`): a cena 3D diz pelo `base` qual cena da foto ela faz. Testado:
  a bandeira da rival exposta na concentração dela, tomada no fim (+2/−5 de
  prestígio, a peça muda de dono); a nossa exposta e perdida quando atacam a
  nossa; na invasão pela arquibancada, três peças na cena (a nossa bandeira e a
  faixa e a bandeira da rival), as duas da rival tomadas no fim.
- **Bar quebrado aparece quebrado** (`vida3d.js`, `mapa3d.js`): tapume em
  metade da varanda com a sigla de quem quebrou pichada, cacos na calçada, a
  roda da porta pela metade e o bar marcado no Mapa da cidade ("BAR QUEBRADO ·
  N DIAS"). Quem quebrou passou a ficar guardado (`danoPor`).
- **Faixa perdida ou tomada no estádio** (`arquibancada.js`): a mureta estende
  só o que a torcida tem; a perdida numa briga do dia sai da mureta. (A última
  faixa tomada pendurava de cabeça pra baixo do lado da dela — saiu na rodada
  seguinte, a pedido do dono.) A sede passou a mostrar as tomadas na quarta
  rodada (os armários do almoxarifado, abaixo).
- **Tecla C**: o C chama; a câmera foi pro V.
- **Aviso pago do olheiro**: vira aviso no canto direito, em destaque, 10 s.

---

## Resolvido na terceira rodada (29/09/2026, "pode fazer a briga dos arredores em 3D")

Detalhes e testes na seção 23 do `docs/JOGO_3D.md`.

- **A briga dos arredores em 3D** (`arredores3d.js`, `dia_de_jogo.js`,
  `dia3d.js`, `vida3d.js`): a investida marcada pros arredores cai no **cordão
  da PM** do plano do dia (a grade e a fila de PMs na divisa das zonas), no
  cordão mais perto da rota da rival. O nosso bonde desvia até ele pelo nosso
  lado e espera colado na grade; a rival para do outro lado; o cartão cai com
  ela à vista, e a briga abre ali, com a grade de verdade (quebrável: o
  primeiro módulo no chão rompe o cordão e chama a tropa de choque, como no
  2D) e os PMs do cordão. Quem cai fica no chão no cordão; o dia segue. A
  investida no jogo de outros clubes nos arredores também abre em 3D (no
  caminho da rival, sem cordão).
- **A faixa tomada de cabeça pra baixo saiu da mureta** (pedido do dono).
- **O relógio da briga 3D** começa na hora da cidade (era sempre 18h, a noite
  da foto dos arredores).

## Resolvido na quarta rodada (29/09/2026, os armários e as faixas de verdade)

Detalhes e testes nas seções 24 e 25 do `docs/JOGO_3D.md`.

- **As tomadas na sede** (`sede3d.js`, `vida3d.js`): dois armários de aço de
  porta de tela no almoxarifado (no barracão, no cômodo do patrimônio) — um
  com o patrimônio da torcida (as faixas e as bandeiras dela), outro com as
  tomadas, cada peça na cor da dona. Segue o save (o do jogador e o mundo
  vivo da IA) e troca na hora, sem remontar a cidade. É a base da invasão de
  sede, que vem depois (a ficha de cada armário: onde fica, a boca, o que tem
  dentro, de quem).
- **As faixas de verdade** (`patrimonio.js`, `arquibancada.js`, `combate.js`):
  a arte que o dono mandou, em 95 torcidas (352 faixas); as 44 sem arte
  seguem com a gerada.

## O que eu faria primeiro

Ordem por impacto sobre esforço, não por área. Os itens 1 a 6 foram feitos
(acima); o próximo da fila é o 7.

| # | O quê | Por quê | Esforço |
|---|-------|---------|---------|
| 1 | ~~**Faixa e bandeira na briga da concentração e na invasão**~~ (feito) | Regressão: o motor só liga a faixa pelo nome da cena, e as cenas 3D se chamam `caminhada@3d` e `invasao@3d`. No 2D a faixa tomada vale −10/+5 de prestígio e muda de dono no patrimônio; no 3D ninguém toma nem perde faixa nessas brigas. | P (+ teste) |
| 2 | ~~**Bar quebrado aparece quebrado**~~ (feito) | Depois do bote no bar (agora em 3D), o bar fica 45 dias "quebrado no ataque" no patrimônio, mas no mapa ele segue inteiro e cheio no dia seguinte. | P |
| 3 | ~~**Faixa perdida ou tomada no estádio**~~ (feito; a sede também, na quarta rodada) | A arquibancada 3D estende faixa e bandeira sempre, tenha a torcida faixa ou não; as tomadas não aparecem em lugar nenhum. Contradiz o relatório da briga. | P (estádio) / M (sede) |
| 4 | ~~**Tecla C na briga 3D**~~ (feito: câmera no V) | No PC o C troca a câmera e não chama mais os parceiros; o botão da tela continua dizendo "Chamar C". Precisa só decidir a tecla da câmera (sugestão: V). | P |
| 5 | ~~**Aviso pago do olheiro**~~ (feito) | Pela sua regra da seção 19, só jornal vai pro canto direito; o aviso de ataque da Inteligência (R$ 100 ou R$ 400 por dia) fica só em Notícias › Mensagens. Vale uma exceção pra ele. | P |
| 6 | ~~**Briga dos arredores em 3D**~~ (feito: a versão fiel ao 2D, no cordão da PM) | É a briga mais comum: "arredores" é o padrão do planejamento e da política. A cidade anda até o estádio e aí abre a foto 2D. | M (versão na caminhada) / G (fiel ao 2D: cordão, grades, portão) |
| 7 | **Sede nível 2 a 6 e anexos** | São as compras mais caras do jogo e o 3D só tem três estados (sem sede, barracão, sede grande). | M (anexos, nível da IA) / G (modelo por nível) |

---

## Placar e partida

1. **Gols minuto a minuto** — no 2D a lista "20' · GOL do X — 1 × 0" cresce no
   cartão e fica depois do apito (`main.js` 1573–1583). No 3D cada gol vira um
   aviso de 4,2 s que divide a pilha de 4 com os recortes; a 4× o jogo dura uns
   6 s, e um gol que cai numa rajada pode passar sem registro. **P.**
2. **Competição, fase e ida/volta durante o jogo** — no 2D o texto "pela
   semifinal (ida)… no Castelão" fica acima da partida. No 3D só aparece no
   balão do "Iniciar partida"; o placar tem siglas, gols e relógio. Os dados já
   estão no jogo (`estado.js` 190–191). **P.**
3. **"A arquibancada se pegou" sem contexto** — sem caminho de invasão (ou sem
   cidade 3D) a pergunta de briga cai do nada no meio do jogo, e a
   consequência ("O clima azedou…", "X ficou na cadeira: é aliada da Y") nunca
   aparece (`main.js` 1629–1630, 1794–1795, 1881–1884). **P.**
4. **Gazeta sem classificação e sem o resto do jornal** — o recorte do canto
   tira a classificação, os outros placares da rodada e a tabela
   (`main.js` 3795–3801); ele vive 7,5 s. **P–M.**
5. **Títulos e campeões** — campeão das nossas competições (O Almanaque),
   da Libertadores/Sul-Americana e o fim das ligas não chegam à tela 3D
   (o canto só aceita Gazeta e Futebol e Porrada). O jogador pode não saber
   que o clube foi campeão. **P.**
6. **Barra de minutos e intervalo** — o 3D mostra só o número; "INT" nunca
   aparece, embora a seção 17 prometa. Impacto baixo. **P.**
7. **Nem o 2D mostra ao vivo:** agregado de ida e volta, W.O. e prorrogação
   (o motor vai direto aos pênaltis, `competicoes.js` 1083–1085).

## Motor de briga

1. ~~**Faixa na concentração e na invasão**~~ — feito (seção 22 do
   `JOGO_3D.md`): `cenaDaFaixa` lê o `base` da cena 3D. **P.**
2. **Seta de borda apontando o bonde rival** — no 2D (`ponte.js` 439–492); no
   3D não existe. Com a câmera a 16–21 m do líder, o rival sai do quadro e nada
   indica o lado. **P.**
3. **Barra de vida de cada brigador** — no 3D só o líder tem. Não se vê quem
   está pra cair pra escolher alvo ou recuar. **M.**
4. **Vida da grade na invasão** — o gradil balança e tomba, mas não mostra
   quanto falta pra romper. **P.**
5. ~~**Tecla C**~~ — feito: o C chama e a câmera é o V. **P.**
6. **Portões e saídas dos dois lados** — só o anel do nosso objetivo aparece;
   não se vê por onde o rival foge. **P.**
7. **"De olho" na caminhada** — no 2D o alvo só reage quando o bonde chega
   perto (`gatilho`, grupos de guarda); na caminhada 3D ele reage desde o
   primeiro segundo. Pode ser de propósito. **P.**
8. **Marca do líder** — no 3D o nome e a vida estão lá, sem a seta amarela
   pulsando; no bolo de gente o líder demora mais pra achar. **P.**
9. **Bomba em chão alto** — os estilhaços quicam numa altura fixa e
   atravessam o degrau da arquibancada. Só visual. **P.**
10. ~~**Relógio da briga**~~ — feito junto com os arredores (seção 23 do
    `JOGO_3D.md`): no palco 3D o relógio começa na hora da cidade. **P.**

Igual nos dois (mesmo código): PM com cassetete e escudo, presos, caídos,
pedra e bomba, HUD de pressão, carga, placar, 1×/2×, pad e o relatório do fim.

## Cenas que ainda caem na foto 2D

Em ordem de frequência no jogo.

1. ~~**Investida nos arredores**~~ (a mais comum) — feito: o cordão da PM
   no estádio 3D (seção 23 do `JOGO_3D.md`). Continua na foto quando o plano
   não acha cordão que sirva (sem cordão perto das duas rotas, ou com o bonde
   que anda no corredor que abre depois). **M–G.**
2. **Investida de surpresa** — quando o alvo planejado não veio, o jogo troca
   por outra rival e lugar sorteado; em casa sai uma caminhada 3D avulsa (em
   outro lugar), ou foto 2D se o sorteio cair nos arredores. **P** pra
   sincronizar.
3. **Clima tenso sem caminho de invasão** — sem caminho até o setor rival, ou
   sem o rival presente, cai na foto da arquibancada. **M.**
4. **Brigas de jogo fora sem dia 3D na praça deles** (campo neutro, exterior,
   mandante sem mapa) — concentração, pista e ataque sofrido. **G.**
5. **Investida em jogo alheio da praça** — nos arredores agora é 3D, no ponto
   do encontro (sem cordão: a gente não tem lado no jogo dos outros); na
   concentração ou na pista sai 3D avulso, longe de onde o bonde chegou. **P**
   (ganchos).
6. **Treta marcada em praça sem beco comprido ou campinho** — raro. **M.**
7. **Ataque à sede rival** — o bar vai pro 3D; a sede cai no 2D. **M** (um
   `briga_sede.js` no molde do `briga_bar.js`).
8. **Reunião sem sede em 3D** (nível 0) — cai na foto. **M.**
9. **Escolta do aliado** — sai 3D avulso, não na rota do aliado. **M.**
10. **Sub-sede** (ataque e caravana) — cai no 2D. **G** (outra praça).
11. **Pressionar o clube (CT)** — não existe CT no mapa. **G.**
12. **Briga do tutorial** — a config não tem `rivalId`. **P.**

Já vão pro 3D: concentração e pista do nosso jogo, invasão (com caminho),
ataque sofrido em casa, emboscada na estrada, treta e LNT, bote no bar, defesa
do nosso bar, casa de piscina, reunião com sede.

## Outros sistemas (gestão, patrimônio, recados)

1. ~~**Bar quebrado por 45 dias**~~ (nosso e das IAs) — feito: tapume,
   cacos, roda pela metade e o risco no Mapa da cidade. **P.**
2. ~~**Faixa e bandeira perdidas ou tomadas**~~ — feito: o estádio (a mureta
   segue o patrimônio; a tomada pendurada de cabeça pra baixo saiu a pedido do
   dono) e a sede (os dois armários do almoxarifado: o patrimônio e as
   tomadas, seção 25 do `JOGO_3D.md`). **M** (sede).
3. **Sede nível 2 a 6, anexos e ampliações** — incluindo a IA (`t.sede++` nunca
   chega à planta). **M / G.**
4. **Torcida sem sede (nível 0)** — o ponto de encontro das pequenas não tem
   lugar no mapa; "Sala do presidente" não leva a lugar nenhum. **M.**
5. **Loja e subsede na praça** — a planta só conhece bar e sede; é a mesma
   queixa que você fez do bar na seção 15. **M.**
6. **Recados que só ficam em Notícias › Mensagens** — o aviso pago do olheiro
   já vai pro canto (feito); seguem só no arquivo: loja vendida por dívida,
   receita da festa, abertura da LNT, fim da Conmebol e do ano. Pela sua regra
   da seção 19, o canto é só de jornal; o que vale abrir exceção é decisão
   sua. **P.**
7. **Festas de aniversário e do título** — a sede 3D só reage à festa do
   expediente; no dia do aniversário ou do título ela fica normal. **M.**
8. **Presos e feridos** — só somem da sede; hospital e delegacia existem na
   cidade e não são usados. **M.**
9. **Treino, professor de MMA, área de treino** — não há lugar de treino na
   sede. **M.**
10. **Assalto** — só o modal; o posto, o Atacadex e o shopping existem na
    cidade. **M.**
11. **Protesto no CT** — só o balão; não há CT no mapa. **M / G.**
12. **Aliadas fora do dia de jogo** (festa delas, presente, reunião) — ninguém
    da aliada aparece. **P / M.**
13. **Recrutamento** — só mais gente na secretaria. **P.**
14. **Bateria ensaiada (+20% em casa)** — a bateria do estádio segue só o
    nível da sede. **P.**
15. **Ônibus da torcida** (1 a 3) — a estrada tem sempre um ônibus genérico. **P.**
16. **Filiais em outra cidade** — o prédio não existe. **G.**
17. **Troféus** — a estante da sede é decorativa, com quantidade fixa. **P.**
18. **Pixação** — os muros são pintados uma vez, na montagem. **P.**
19. **"Ver na cidade" nos painéis** (Perfil, Patrimônio, Diplomacia) — proposta
    da seção 3, ainda não feita. **P.**

## O que não vale levar pro 3D

Calendário, Expediente, Ideologia, Planejamento (o popup resolve),
Competições, Ranking, tabelas da LNT, Diplomacia e Eixos, a Gazeta completa,
Almanaque e Retrospectiva, fechamento do mês, relatório de briga e Perfis. São
planilha e leitura, e funcionam bem como painel sobre a cidade parada; no
máximo ganham o "ver na cidade".

## Riscos técnicos achados na varredura

- **O placar de TV depende do cartão 2D escondido.** O cartão da partida
  (`widgetPartida`) roda escondido e é ele quem sobe o clima, conta os
  pênaltis e dá o apito. Se o nó dele sair da página (Notícias → Arquivo
  redesenha o cartão; trocar de aba em Notícias mata o timer), o jogo nunca
  apita e a linha do itinerário fica parada. O placar da partida solta ganhou
  uma rede de segurança (mostra FIM sozinho 4 s depois de o jogo acabar), mas a linha continua
  dependendo do cartão, e o placar do dia da cidade também.
- **Regras presas ao nome da cena** (`combate.js` 289, 2200, 3739, 3751, 3785,
  3836; `ponte.js` 919): toda cena nova `*@3d` pode perder comportamento sem
  aviso — o item 1 do motor de briga é exatamente isso. Testar pelo `base` da
  cena resolve de uma vez.
- **Escala das grades e projéteis**: o boneco não usa `escalaDoTabuleiro` nas
  grades, na altura do voo nem no tamanho dos projéteis; uma cena 3D nova com
  grade sai fora de escala.
- **Recarregar no meio da partida** mostra o cartão 2D inteiro no balão, sem o
  placar de TV (`main.js` 3703).
