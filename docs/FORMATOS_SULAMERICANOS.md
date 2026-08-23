# OS FORMATOS REAIS DAS LIGAS SUL-AMERICANAS

Pesquisa de 23/08/2026, temporada 2026 de cada país. É a régua que o
motor de competições precisa reproduzir — **idêntico ao real**, decisão
do dono. Nada disto está implementado ainda; este documento é o crivo.

## O que cada país joga hoje

### Argentina — Liga Profesional
Dois torneios independentes, **Apertura** e **Clausura**, mesmo formato
e campeão próprio cada um.
- 30 clubes em **duas zonas de 15**
- Fase regular de **16 fechas**: 14 dentro da zona, 1 fecha de clássicos
  interzonais e 1 fecha interzonal a mais
- **Os 8 melhores de cada zona** vão aos oitavos
- Dos oitavos às semifinais, **jogo único na casa do mais bem
  classificado**; a final é **jogo único em campo neutro**
- Campeão de Liga: quem somar mais pontos na **tabela geral** do ano
- **Caem 2**: o último da **tabela anual** e o último da **tabela de
  promedios** (média das temporadas 2024, 2025 e 2026)

### Colômbia — Liga BetPlay
**Apertura** e **Finalización**, campeão próprio cada um.
- 20 clubes, fase regular de **19 fechas**, todos contra todos
- **Os 8 melhores** vão aos **cuadrangulares semifinales**: dois grupos
  de 4, **6 fechas** ida e volta
- **O líder de cada grupo** vai à final, disputada em **ida e volta**

### Uruguai — Campeonato Uruguayo
Três torneios no ano, somados numa tabela.
- **Apertura**: 16 clubes, todos contra todos a uma rueda (15 fechas)
- **Torneo Intermedio**: os 16 divididos em **dois grupos de 8** pela
  posição no Apertura, um jogo contra cada rival do grupo, e os
  **vencedores de cada zona fazem a final** do Intermedio
- **Clausura**: outra rueda de 15 fechas
- **Tabla Anual**: soma dos três torneios, 37 jogos por clube. O
  vencedor da anual ganha vaga nas finais do Campeonato
- Se o campeão do Apertura vencer também o Clausura (e a anual), é
  campeão uruguaio direto. Senão, **final entre os vencedores**

### Equador — LigaPro Serie A
- **Primeira Etapa**: 30 fechas, todos contra todos (16 clubes)
- A classificação acumulada divide os clubes em três grupos, e os
  **seis primeiros disputam um hexagonal final** que define o campeão
- O líder da primeira fase **não** garante mais vaga internacional
  direta: tem de jogar o hexagonal

### Peru — Liga 1
- 18 clubes, **Apertura** e **Clausura**, **17 jornadas cada**
- Mesmo clube campeão dos dois → **campeão nacional direto**
- Campeões diferentes → **playoffs de 4**: os dois campeões mais os
  **dois melhores da tabela acumulada** que não sejam eles

### Venezuela — Liga FUTVE
**Apertura** e **Clausura**, mesmo formato, em três fases:
- 14 clubes, **13 fechas** todos contra todos
- **Os 8 melhores** vão aos **cuadrangulares semifinales**: dois grupos
  de 4, **6 fechas** ida e volta
- O primeiro de cada grupo faz a **final** do torneio
- **Serie Final** entre o campeão do Apertura e o do Clausura define o
  **Campeão Absoluto**; mesmo campeão nos dois torneios é absoluto
  direto

### Chile — Liga de Primera
Turno longo único: **30 fechas**, todos contra todos ida e volta entre
março e dezembro. **Campeão é o líder**, sem mata-mata.

### Paraguai — División Profesional
**Apertura** e **Clausura**, 12 clubes, todos contra todos **ida e
volta** (22 fechas cada). **Dois campeões por ano.**

### Bolívia — División Profesional
- **Liga**: todos contra todos, **30 jogos**, campeão é o líder
- **Copa de la División Profesional** no segundo semestre: 16 clubes em
  **4 grupos de 4**

## IMPLEMENTADO (23/08/2026) — `js/mundo/ligas.js` e `js/mundo/conmebol.js`

Os nove formatos acima rodam no jogo, na **opção 1** que o dono
escolheu: o Brasil segue com a tabela de jogos inteira no motor de
sempre, e as ligas de fora rodam o formato real guardando **só a
classificação e o mata-mata**. As fechas da fase regular são sorteadas
pelo método do círculo, resolvidas e descartadas — nunca ficam no save.

**Medido em 5 anos de jogo**: save 1.824 KB, 13 ms por dia, e toda
divisão dos nove países mantendo o tamanho depois do sobe-e-desce.
Contra os 2.374 KB **no primeiro ano** que a versão detalhada dava.

### As duas copas da Conmebol

**Libertadores** — 47 clubes: Brasil 7, Argentina 6, os outros oito 4
cada, mais os campeões da Libertadores e da Sul-Americana do ano
anterior. 28 entram direto e 19 disputam a prévia, que afunila
exatamente como a Conmebol: Fase 1 com os 6 mais fracos (3 duelos),
Fase 2 com esses 3 mais os 13 que esperavam (16 clubes, 8 duelos), e
Fase 3 com 8 clubes — 4 vão aos grupos e **os 4 que caem vão pra
Sul-Americana**. Oito grupos de quatro, seis fechas, os dois primeiros
às oitavas. Oitavas, quartas e semi em ida e volta; final em jogo único.

**Sul-Americana** — 44 clubes: Brasil 6, Argentina 6, os outros 4 cada.
12 entram direto, 32 jogam a Fase Preliminar (16 duelos) e os 16
vencedores completam a chave com os 4 que caíram da Fase 3 da
Libertadores: 12 + 16 + 4 = 32. Oito grupos de quatro. O **primeiro**
de cada grupo vai direto às oitavas; o **segundo** cai no **playoff**
contra os oito **terceiros dos grupos da Libertadores**, e ali quem vem
da Libertadores joga a ida em casa.

**Nove copas nacionais** — uma por país, mata-mata com todas as
divisões daquele país, mando de quem tem a divisão mais alta. O Brasil
não ganhou uma nova: já tem a Copa do Brasil no motor de sempre.

### A tela e as notícias (23/08/2026)

**Competições ganhou duas abas.** `América do Sul` mostra um país por
vez, com os torneios do ano, a classificação de cada zona, o
quadrangular ou hexagonal em andamento, o mata-mata e a tabela anual.
`Conmebol` mostra a Libertadores, a Sul-Americana e as nove copas
nacionais, com os oito grupos e a chave.

**Três notícias, e nada mais.** As ligas de fora NÃO viram mensagem
rodada a rodada — seriam trinta linhas por semana sobre gente que o
jogador não conhece. O feed só conta:
1. o nosso clube quando joga a Libertadores ou a Sul-Americana;
2. o campeão de cada uma delas;
3. o resumo dos nove países quando o ano fecha.

**Medido em 3 anos**: save 1.542 KB, 10,2 ms por dia. E o mundo de fora
custa **64 KB** disso — `ligas` 13 KB, `conmebol` 11 KB, histórico
25 KB e promedios 15 KB. Ele nem aparece entre os seis maiores campos
do save; quem pesa é o feed, como sempre foi.

### A seleção de torcida virou dois passos

País, liga e clube na mesma tela, em três colunas encadeadas; a torcida
do clube no passo seguinte, com a ficha embaixo. Antes era uma lista
única de 139 torcidas com uma fileira de abas por divisão — com dez
países e 356 clubes aquilo virava um paredão. Os países sem torcida
aparecem apagados, com o número de clubes, esperando a vez deles.

### Dois consertos que a medição pegou

- **Torneio que estourava o calendário.** O Finalización colombiano
  abre na semana 30 e pede 19 fechas mais o quadrangular de 6 — dá 55
  num ano de 52. Ele não terminava, e sem terminar ninguém caía: a
  Primera A foi de 20 pra **26 clubes** em três anos enquanto a B
  minguava pra 10. O conserto é o que o futebol faz quando o calendário
  aperta — rodada no meio de semana, aqui mais de uma fecha por tique.
- **Torneio que abre em fase de grupos.** O Intermedio uruguaio não tem
  fase regular, e a semana da primeira fase só era marcada na transição
  — ele nunca começava.

## O que o motor não sabia fazer (e agora sabe)

`criarCompeticao` monta UMA competição com `{grupos, passam, voltas}`:
fase de grupos, mata-mata olímpico, um campeão. Falta:

1. **Vários torneios por divisão no mesmo ano** (Apertura, Clausura,
   Intermedio), cada um com campeão próprio
2. **Fase de grupos DEPOIS da fase regular** — o cuadrangular colombiano
   e venezuelano, o hexagonal equatoriano
3. **Zonas com rodada interzonal** — a fecha de clássicos argentina
4. **Tabela anual e acumulada** somando torneios diferentes
5. **Promedios** — média de três temporadas, que decide um rebaixamento
   na Argentina
6. **Final entre campeões de torneios** — Peru, Venezuela, Uruguai
7. **Mata-mata de jogo único na casa do melhor classificado**, com final
   em campo neutro

## A conta que trava tudo, e o que fazer com ela

Medido em 23/08/2026 com os 356 clubes já importados e o motor de hoje
montando todas as divisões:

| | 108 clubes (Brasil) | 356 clubes (tudo) |
|---|---|---|
| jogos na temporada | 2.122 | **20.714** |
| campo `temporada` no save | 154 KB | **1.568 KB** |
| save no dia 266 do ano 1 | 849 KB | **2.374 KB** |
| custo de um dia | 8,4 ms | **21,2 ms** |

O save de um ano com o mundo inteiro é **maior que uma partida
brasileira de cinco anos**, e estoura a cota do navegador antes de
fechar a primeira temporada — o problema que o cofre de saves acabou de
resolver, de volta pela porta dos fundos.

**Por isso `SO_BRASIL = true` em `competicoes.js`**: os 248 clubes estão
importados e guardados, mas a temporada só monta o Brasil. O motor de
formatos entra junto com a decisão de armazenamento, nunca antes.

### As duas saídas

1. **Liga do jogador em detalhe, resto em resumo.** O país do jogador
   guarda a tabela de jogos inteira, como hoje. Os outros oito rodam o
   formato real mas guardam só o que a tela mostra — classificação,
   campeão, quem subiu e quem caiu — e não os 20 mil jogos. O formato
   continua idêntico ao real; o que muda é o que sobra no save.
2. **Tudo em detalhe.** Exige tirar o save do `localStorage` e pôr no
   IndexedDB, que não tem cota de 5 MB. Mais trabalho, e o save por
   texto fica grande demais pra copiar e colar.
