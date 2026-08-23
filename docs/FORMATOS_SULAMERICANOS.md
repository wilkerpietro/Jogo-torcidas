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

## O que o motor de hoje não sabe fazer

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
