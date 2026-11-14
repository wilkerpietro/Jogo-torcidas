# Paridade: o que a nossa torcida pode fazer × o que as IAs fazem (12/10/2026)

O pedido, nas palavras do dono: *"Faça uma varredura com agentes pra
identificar o que nossa torcida tem possibilidade de fazer em comparação às
demais."*

Três agentes leram o código, cada um numa frente: economia e patrimônio;
briga, ataques e rua; social, mundo e crescimento. A régua de partida é a do
dono: o que vale para o jogador vale para a IA pela mesma régua.

**Nada foi mudado.** Este é o diagnóstico; as correções esperam decisão.
Referências `arquivo:linha` relativas a `js/`.

---

## 1. O que mais pesa (ordenado)

### Bugs (a IA está errada contra a própria regra)

1. **4º professor de MMA nas IAs com sede 6.** O teto delas usa a garagem
   (4), sem o limite de 3 professores. Com 4, `GANHO_MMA[4]` não existe e o
   treino cai pra ×1: pagam R$ 8 mil por mês por nada.
   Corrigido do nosso lado na sede 6 (`financeiro.js:227`); falta o delas
   (`relacoes.js:289-294, 723`).
2. **Advogados das IAs param em 8.** O limite trava na sede 5; nós vamos a
   12 na sede 6 (`relacoes.js:300-304, 729-733`).
3. **Área de treino:** existe o código pra IA comprar, mas o item saiu da
   fila de compras (`ORDEM`), então elas **nunca** compram
   (`relacoes.js:235, 741-747`).
4. **Saque IA contra IA ignora galpão e cofre** da vítima. No nosso ataque a
   uma IA, eles protegem (`relacoes.js:2533` contra `acoes.js:721-726`).

### Vantagens das IAs que contrariam a mesma régua

5. **Ferrugem da paz (20 dias sem briga).**
   - Nós: −0,5 de moral, −0,2 de prestígio e −0,2 na ficha, sem piso.
   - IAs: só −0,2 na ficha, com piso na ficha de nascença, e sem perder
     moral nem prestígio (`estado.js:521-532` contra `relacoes.js:2167-2177`).
   - É a maior assimetria: explica a nossa torcida passiva derretendo na
     simulação de 20 anos.
6. **A IA recruta, faz festa e reunião todo dia, tudo junto.** Nós dividimos
   3 turnos do expediente. Elas também ganham o +0,2 por dia de domínio por
   recrutar **mesmo com a sede cheia** (`dominio.js:1389-1395`).
7. **Relações entre IAs não apodrecem**; as nossas sim
   (`relacoes.js:1670-1708`).
8. **Saque no nosso bar:** elas levam 10% do nosso caixa; nós levamos 22% do
   delas. A IA nasce com bar de graça mesmo na sede 0 e 1, e com 10 bombas
   (nós, 4). Também não tem quebra séria de ônibus, e a loja dela segue
   faturando com o caixa negativo.
9. **XP de briga:** na IA vai para o quadro inteiro; nós damos só a quem
   desceu (`relacoes.js:1994-2005`).
10. **Trégua furada contra nós:** a trégua não é checada na subsede de fora,
    no calendário de bar e casa, na emboscada da rota nem na meta de domínio.
    A meta de domínio contra nós só exige relação abaixo de +20, não
    hostilidade (`dominio.js:554-561, 1067`).
11. **No nosso "Simular", a escolta do aliado não conta**; na briga das IAs,
    conta (`simular.js:91-98`).
12. **Vice-campeão dá +0,8 de moral às IAs**; para nós, nada
    (`relacoes.js:1619`).

### Vantagens nossas (as que a IA não tem)

13. **Atacar sem corte.** Nós atacamos qualquer pino da praça uma vez por
    semana, sem corte de relação nem de paridade, e **nunca desistimos**. A IA
    desiste depois de 3 fracassos, segue o calendário e tem freios de
    paridade.
14. **Saque do nosso ataque a bar** é calculado sobre **todo o efetivo de pé
    da IA** (60 × efetivo); o delas é sobre o bonde de até 40. Isso infla
    muito o nosso saque.
15. **Só nós:**
    - festas da arquibancada e bateria (Fator Torcida);
    - ingressos e relação com o clube;
    - doação de simpatizante e PIX;
    - assaltos;
    - fiança;
    - Veterano e Velha Guarda;
    - presentes de qualquer tipo;
    - churrasco;
    - ideologia;
    - voo na caravana;
    - várias compras por semana;
    - ação social garantida toda semana (a IA, em 35% das semanas, e só as
      maiores);
    - escolher o bairro do recrutamento (×0,7 a ×1,3);
    - até 3 dados de recrutamento por dia, contra 1 da IA.
16. **Caravana:** a da IA sai com ×0,6 sobre a nossa régua e risco 0 (decisão
    antiga do dono); a das filiais delas também com ×0,6.

---

## 2. Economia, patrimônio e estrutura

| Capacidade | Nós | IAs | Onde |
|---|---|---|---|
| Sede 0→6 | mesmos preços; compra quando quiser | sobe quando um item da fila trava ou a fila acaba; 1 compra por semana | patrimonio.js:38-47 · relacoes.js:897-907 |
| Bar, loja e subsede | escolhemos o bairro | bairro automático; vez na fila | relacoes.js:806-811 · dominio.js:1737 |
| Bar grátis | só da sede 2 em diante | nasce com bar em qualquer sede | financeiro.js:288 · relacoes.js:342 |
| Filial | nós escolhemos a cidade e qual ampliar | maior base; ampliar só por sorteio (1/3) | relacoes.js:769-791 |
| Núcleo da filial | 8 de verdade, cresce pelo recrutamento | 8 no papel, +1 com chance de 1/3 por semana | relacoes.js:958-965 |
| Faixa da subsede | existe, repõe por R$ 5 mil | não existe | patrimonio.js:563 |
| Anexos | quando quiser | últimos itens da fila | relacoes.js:240-245 |
| Área de treino | 4 níveis | **nunca compra** (fora da fila) | relacoes.js:235 |
| Fábrica | sede 5 | só na sede 6 com a fila vazia | relacoes.js:906 |
| Professor e advogado | caixa mínimo de R$ 2 mil / 5 mil | caixa de 3 meses × (n+1); **bugs na sede 6** | relacoes.js:295, 305 |
| Ônibus | quebra séria de R$ 15 mil (1% ao mês) | sem quebra | financeiro.js:720 |
| Bombas | sem teto, começa com 4 | teto de 10, começa com 10 | relacoes.js:319 |
| Faixa e bandeira | quantas quiser | repõe até 1 de cada | relacoes.js:1855 |
| Festas da arquibancada | 5 tipos, até +13% de Fator Torcida | não existe | festas.js |
| Investir no elenco | vários pontos de uma vez | 1 ponto por compra, só abaixo da média da divisão | relacoes.js:926 |
| Mensalidades | 12 por ano | ×¼ toda semana, ou seja 13 por ano | relacoes.js:967 |
| Comércio | + bônus da relação com o clube | sem o bônus | financeiro.js:410 |
| Doação, PIX, ingressos | sim | não | financeiro.js:620 · acoes.js:947 · relacaoclube.js |
| Festa na sede | 1 turno, bloqueada na sede 0 | todo dia, mesmo na sede 0 | relacoes.js:2730 |
| Caixa negativo | vende a loja aos 30 dias | vende aos 35; loja segue faturando | relacoes.js:1037 |
| Presente | qualquer tipo, para qualquer aliada | só sede, IA→IA, a cada 26 semanas; nunca para nós | relacoes.js:821 |
| Queima de caixa | — | 6% × ousadia do excesso acima de 12 meses de despesa | relacoes.js:1183 |

## 3. Briga, ataques e rua

| Capacidade | Nós | IAs | Onde |
|---|---|---|---|
| Ataque a bar ou sede | 1 por semana, qualquer pino, sem corte | bar só pelo calendário (3/8 dos blocos); **sede não** | acoes.js:1065 · relacoes.js:1537 |
| Ataque-surpresa | não temos | contra nós, semanal (×2 com dívida); entre IAs, diário | relacoes.js:1348, 2576 |
| Emboscada na estrada | sofremos 4,8–27% por viagem, com paridade de 70% | 2,4% por jogo, sem paridade | planejamento.js:1678 · relacoes.js:2589 |
| Treta combinada | aposta de R$ 1–6 mil; recusar tem multa | sem aposta, ±15%, sem presos | relacoes.js:2481 |
| Desistir após 3 fracassos | nunca | só em parte dos caminhos | relacoes.js:1303 |
| Trégua | bloqueia o nosso alvo | furada em 4 caminhos | ver §1.10 |
| Resolução | cena ou Simular: os N melhores reais contra os N melhores gerados | n × média do quadro; favorito vence 70% | simular.js:84 · relacoes.js:2260 |
| Ficha | membros reais, novato 3–8 | médias por cargo; subsede IA×IA usa a média da torcida inteira | relacoes.js:1740, 2997 |
| Treino | por fila, com professor e padrinho | passo médio pelo cargo | membros.js:530 · relacoes.js:1804 |
| Ferido e preso | iguais em faixa, mais fiança | iguais, diluídos na média, sem fiança | relacoes.js:2141 |
| Bombas na cena | escolhidas no plano | contra nós, metade das nossas; IA×IA não usa | combate.js:267 |
| Calor da polícia | só nos assaltos | não existe | acoes.js:1264 |
| Faixa perdida | moral e prestígio, × pesoDaDerrota | só prestígio, 5% das brigas | relacoes.js:2054 |
| Prestígio da briga | escala com tamanho e pesoDaDerrota | swing fixo, sem atenuante por menor número | membros.js:806 · relacoes.js:2306 |
| Domínio por briga | rua 10, bar 12 (+6 se quebrou) | rua 8, bar 12 | dominio.js:83, 1494 |

## 4. Social, mundo e crescimento

| Capacidade | Nós | IAs | Onde |
|---|---|---|---|
| Recrutamento | até 3 dados por dia, peso do bairro | 1 por dia, sem peso | acoes.js:122 · relacoes.js:2707 |
| Teto de membros | sede + filiais | min(sede, pool da praça congelado em base × 0,55) | relacoes.js:704 |
| Janela de título | 3 semanas, aberta no dia | 2 semanas, na virada do ano | estado.js:378 · relacoes.js:1627 |
| Promoção | manual, com Veterano | automática, sem Veterano | membros.js:471 · relacoes.js:1870 |
| Idade | −0,6 por ano dos 35 em diante, aposenta aos 46, Velha Guarda | 1/30 aposenta por ano, −0,22 por ano | membros.js:755 · relacoes.js:2183 |
| Moral pelo clube | ±0,6 por jogo + conquistas | só conquistas (com vice +0,8) | estado.js:632 · relacoes.js:1619 |
| Ação social | toda semana | 35% das semanas, só as maiores | dominio.js:1402 |
| Reunião | mensal, com pautas | +6 de relação por semana com a melhor aliada; usa a diretoria **da fonte estática** | relacoes.js:2653 |
| Relações | apodrecem com o tempo | IA×IA não decaem | relacoes.js:1670 |
| Recepção de aliada | escolhida; aliada a partir de 20 | sorteada; aliada a partir de 45 | relacoes.js:2399 |
| Anfitrião da escolta | relação viva | lista **estática** da fonte | praca.js:304 |
| Caravana | régua cheia, por jogo | ×0,6, cobrada 1 vez por semana | relacoes.js:980 |
| Ideologia | sim | não (fila e ousadia) | planejamento.js:1463 |
| Ranking | mesma fórmula, ficha real | mesma fórmula, média do quadro | relacoes.js:2855 |
| Desenvolvimento (protótipo) | efeitos reais | estudam, **sem efeito** | prototipo/desenvolvimento.js |

**Iguais:** domínio diário, cota de pixo, 1 alvo de domínio por mês,
aniversário, fórmula do ranking, caixa no vermelho (−1 de moral por semana) e
custo de R$ 5 por recruta.

**Código morto:**
- `E.campanha` (×1,5 de capacidade) nunca é atribuído (`membros.js:430`);
- `FATIA_PROMO` está declarado e não é usado (`relacoes.js:1744`);
- o comentário da tabela de recrutamento (`acoes.js:112-117`) não bate com
  os números.

---

## 5. Correções sugeridas (esperando o dono)

- **Bugs, sem decisão de desenho:**
  - limitar os professores da IA a 3;
  - abrir os advogados dela até 12 na sede 6;
  - devolver a área de treino à fila;
  - galpão e cofre protegendo no saque IA×IA.
- **Ferrugem da paz igual para todos:** a IA passa a perder moral e
  prestígio, ou nós ganhamos o piso. É a mudança que mais muda o jogo.
- **Saque:** a mesma conta dos dois lados (bonde até 40 + a mesma fatia do
  caixa).
- **Trégua:** checada em todos os caminhos de ataque contra nós.
- **Relações IA×IA** apodrecendo como as nossas.
- **Vice-campeão:** os dois ganham, ou nenhum.
- **Desenvolvimento:** dar às IAs os efeitos dos estudos (hoje só estudam).
