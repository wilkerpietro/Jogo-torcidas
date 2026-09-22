# A torcida pequena começa sem sede — o plano (dono, 22/09/2026)

O pedido, nas palavras do dono: *"as torcidas pequenas (de até 30
membros) começam sem sede social, apenas uma ação diária, sem bar
também, vivendo apenas de mensalidades."* Este arquivo é o desenho pra
decidirmos juntos: o que existe hoje, a proposta, e as perguntas em
aberto. Nada disto está no jogo ainda.

## 1. O que existe hoje (medido, 22/09/2026)

| Peça | Como é | Onde |
|---|---|---|
| Nível de sede | 1 a 6; **não existe nível 0** em lugar nenhum. Todo atalho é `\|\| 1` ou `Math.max(1, …)` | `membros.SEDE`, `financeiro.MANUT_SEDE`, `patrimonio.SEDE` (n1 "é onde se começa") |
| Tabela da sede | n1: 50 membros, 2 diretores, 2 de treino, R$ 200/mês; n2: 90/4/4, R$ 480 | `membros.js:106`, `financeiro.js:19` |
| O que a sede gera | teto de membros, de diretoria e de treino; festa (custo por nível); garagem/ônibus, professor de MMA, advogados (n1: 0, 0, 0); bar/loja/subsede (n1: 1 bar, 0 loja, 0 subsede) | `financeiro.TETO_SEDE`, `ADVOGADOS_SEDE`, `patrimonio.TETO` |
| Ampliar a sede | n1→n2 custa R$ 40.000; a primeira sede não tem preço (é onde se começa) | `patrimonio.js:37` |
| Expediente | **3 turnos fixos** (manhã, tarde, noite), independentes da sede e da diretoria | `acoes.TURNOS`, lido em 6 lugares |
| Ações que dependem da sede | recrutar (vaga = capacidade da sede), festa na sede (custo por nível); as outras só têm o rótulo "Sede" | `acoes.LISTA` |
| Bar | a sede n1 **já vem com um bar n1 grátis**, criado preguiçosamente na primeira leitura de `patrimonio(E)` — e **renasce** se a lista ficar vazia | `financeiro.js:268` |
| Renda do bar | R$ 1.760/mês bruto (n1) menos R$ 800 de manutenção | `financeiro.RECEITA/MANUT` |
| Mensalidades | novato 20, componente 50, frente 100, diretoria 100; cobradas uma vez por mês. Torcida de 20 (pirâmide compensada) ≈ **R$ 1.250/mês** | `membros.CARGOS`, `financeiro.js:335` |
| Outras rendas do começo | festa (n1: custa 170, rende 4,8–6,4 por presente — vaquinha em torcida pequena), PIX (8–15 por membro, grátis, −0,2 prestígio), assalto (pauta da reunião) | `acoes.js` |
| Caixa inicial | **R$ 16.000 pra todo mundo**: a fórmula lê `f.dinheiro`, e a fonte grava `saldo` — o `max(4000, saldo×4)` do comentário nunca vale. Com `saldo: 200` daria R$ 4.000 | `estado.js:82`, `main.js:475` |
| A fonte | 139 torcidas; **59 com até 30 membros** (37 com 20, 22 entre 21 e 30) — exatamente as 59 com `sedeNivel: 1` na fonte. Piso de 20 membros fica | `dados/torcidas.js` |
| A pirâmide da pequena | abaixo de 25 membros: 12% diretoria, 28% frente, 35% componente; diretoria cortada no teto da sede | `membros.js:293` (DECISOES 10/09) |
| Seleção | a ficha repete a fórmula do `estado.novo` (nível da sede que cabe o efetivo) — as duas têm de mudar juntas | `main.js:461`, `estado.js:88` |
| Ataques contra nós | os alvos semanais são concentração e pista; o bar só quando o rival tem subsede na praça; o bote na casa de piscina é da zona | `relacoes.js:1138`, `1252` |

## 2. A proposta

**O corte:** torcida com **até 30 membros na fonte** começa no **nível 0
de sede** — "o ponto de encontro" (a esquina, a calçada do bar de
terceiros). São as 59 pequenas; as outras 80 seguem como hoje.

**O que o nível 0 é, em números** (proposta; tudo negociável):

| | nível 0 (ponto de encontro) | nível 1 (a primeira sede) |
|---|---|---|
| teto de membros | **30** — a esquina não cabe mais gente; recrutar para em 30 | 50 |
| diretoria / treino | 2 diretores (a pirâmide compensada dá 2–3 em 20) / **0 de treino** | 2 / 2 |
| manutenção | R$ 0 | R$ 200/mês |
| festa na sede | **não existe** (a ação some do expediente) | custa 170 |
| bar | **nenhum**; o bar grátis chega **junto com a sede n1**, como hoje | 1 bar n1 grátis |
| ônibus, MMA, advogados, loja, subsede | 0 | 0 |
| expediente | **1 turno** (a tarde) | 3 turnos |
| reunião da diretoria (dia 5) | acontece — mas **onde?** (pergunta 4) | no pátio da sede |
| ataques que sofremos | concentração, pista e casa de piscina (a zona), como hoje; sem bar não há ataque ao bar | idem + bar |
| o que se ganha | só as mensalidades (≈ R$ 1.250/mês com 20), PIX e assalto | + bar, + festa |

**Construir a sede (n0 → n1):** vira uma obra do Patrimônio, "Construir a
sede", com preço. Sugestão: **R$ 20.000** (metade do n1→n2, que é
40.000). Com R$ 1.250/mês de mensalidade mais PIX e um assalto de vez em
quando, dá uns 10 a 14 meses de aperto até a sede — que é o arco da
pequena. A inauguração já existe (`E.inauguracao`) e vale pra n1.

**Caixa inicial:** corrigir a leitura (`saldo`, não `dinheiro`). A
pequena começa com **R$ 4.000** (o piso), não 16.000 — senão ela
constrói a sede no primeiro mês e o arco não existe.

**A IA:** as 59 pequenas do mundo continuam com sede n1 na simulação
(a régua delas de teto e treino vem de `SEDE[t.sede]`). O nível 0 é do
jogador: é o começo dele que a gente está desenhando, não a economia
das 386 torcidas.

## 3. As fases (depois de decidido)

1. **Nível 0 nas tabelas** — `SEDE[0]`, `MANUT_SEDE[0] = 0`,
   `FESTA[0] = null`, `TETO_SEDE[0] = 0`, `ADVOGADOS_SEDE[0] = 0`,
   `patrimonio.TETO.*[0] = {qtd:0}`, `patrimonio.SEDE[1] = {custo}`;
   os sete `|| 1` viram leitura honesta do 0 (`acoes.js:39`,
   `financeiro.js:206,232`, `mundo.js:223`, `membros.js:328`,
   `cenas.js:1166`, `estado.js:88`); uma função só pro nível inicial,
   usada pelo `estado.novo` e pela ficha da seleção.
2. **Bar** — o bar grátis só nasce com sede ≥ 1 (a guarda em
   `financeiro.patrimonio`); o pino do mapa e a defesa do bar acompanham.
3. **Expediente** — `turnos(E)`: 1 no nível 0, 3 do 1 em diante; o
   painel do expediente e a célula do calendário leem a lista viva.
4. **Patrimônio** — "Construir a sede" (n0 → n1) com a inauguração;
   recrutar avisa "a esquina não cabe mais gente" em 30.
5. **A reunião sem sede** — a cena (pergunta 4).
6. **Seleção e textos** — a ficha diz "Sede: nenhuma — ponto de
   encontro"; o tutorial e as dicas que falam em sede; DECISOES.
7. **Caixa inicial** — `saldo × 4` com piso 4.000.

## 4. As perguntas pra decidir

1. **O preço da primeira sede.** R$ 20.000? Mais barato (10.000, uns
   cinco meses) ou mais caro (30.000, mais de um ano)?
2. **O turno único.** É a tarde? Ou o jogador escolhe qual dos três? E
   o nível 1 volta aos 3 de uma vez, ou é uma escada (n0: 1, n1: 2, n2+: 3)?
3. **Teto de 30 sem sede.** Recrutar trava em 30 até construir? Ou a
   pequena pode crescer e a sede só destrava treino, festa e bar?
4. **A reunião da diretoria sem sede.** Onde a roda senta? (a) na praça
   do bairro (a cena `praca` ganha cadeiras num canto); (b) numa foto
   nova, a esquina/calçada do ponto de encontro (mais uma imagem pra
   você gerar); (c) vale a tela antiga (o modal) até ter sede, e a cena
   só nasce com a sede n1.
5. **Caixa inicial.** Corrigir pra `saldo × 4` (a pequena começa com
   4.000; a grande com o saldo dela vezes quatro) — ou 16.000 pra todo
   mundo era intencional?
6. **A IA.** As pequenas do mundo ficam como estão (sede n1)?
7. **Bar grátis com a sede.** Mantém — a sede n1 traz o bar — ou o bar
   vira outra obra depois da sede?
