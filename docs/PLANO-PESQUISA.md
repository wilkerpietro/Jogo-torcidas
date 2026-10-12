# Desenvolvimento da Torcida: o plano (dono, 12/10/2026)

O pedido, nas palavras do dono: *"Vamos realizar uma expansão de um modelo
de pesquisa e desenvolvimento pro jogo. Mapeie com agentes como as
pesquisas no Victoria II funcionam pra gente ter como referência pra
utilizar pro nosso jogo. Crie ideias de como fazer isso."*

Este arquivo tem quatro partes, para decidirmos juntos:

1. a referência (como o Victoria II faz);
2. o que o nosso jogo já tem onde a pesquisa encaixa;
3. as ideias;
4. as perguntas em aberto.

Nada disto está no jogo ainda. Existe um **protótipo à parte** (seção 5) pra sentir a diferença.

---

## 1. A referência: a pesquisa no Victoria II

Fontes: o Project Alice (reimplementação aberta do Vic2, com regras e
código), os arquivos de tecnologia do jogo e a wiki. Os números marcados
com "~" não foram confirmados no vanilla.

| Peça | Como funciona no Vic2 |
|---|---|
| **Pontos de pesquisa (RP)** | Saem das pops. Cada tipo dá pontos de forma linear até um **ótimo**, e depois satura. Clérigos dão até o ótimo de 2% da população. Clerks dão 0,5 RP por ponto percentual, até 2 RP (ótimo de 4%). Somam-se pontos fixos pelo status (grande potência +1,5, secundária +1,25, civilizada +1) e ~+4 com alfabetização de 100%. O total é multiplicado pela **pluralidade** (1% de pluralidade = +2% de RP) e pelas techs de Filosofia. |
| **Motor escondido** | A **alfabetização**: sobe com o gasto em educação e com os clérigos. É a bola de neve do jogo, porque quem começa analfabeto fica atrás para sempre. |
| **Reserva** | O RP é um caixa nacional. Sem tech escolhida ele acumula até 365 dias de pesquisa. Trocar de tech não perde o progresso. |
| **Árvore** | 5 categorias (Exército, Marinha, Comércio, Cultura, Indústria) × 5 pastas × 6 techs, ~150 no total. **Pré-requisito**: o ano da tech já chegou e a tech anterior da mesma pasta está feita. Não há dependência cruzada entre pastas. |
| **Custo** | Base de 3.600 a 21.600 por tier. Há **desconto por atraso**: cerca de −0,67% por ano passado da data da tech. Não há penalidade por estar adiantado, porque a trava de ano já impede. |
| **Escolas** | Uma por país. Dão de +15% a −25% de velocidade por categoria; por exemplo, a escola do Exército dá +15% em Exército, −10% em Cultura e +10% em Indústria. A Tradicional é neutra. |
| **O que uma tech faz** | Libera coisas (unidade, prédio, ferrovia, base naval) ou dá um modificador pequeno e acumulativo (+1% de produção por tier, −1% de insumo, +5% de prestígio, +10% de eficiência educacional, +1 foco nacional). |
| **Invenções** | Todo dia 1º, cada invenção liberada por uma tech sorteia uma **chance mensal visível**. A chance é aditiva: base 2 (armas 5), +2 se a alfabetização é ≥ 50%, +2 se está em guerra com quem já tem, −2 a −6 se falta uma pré-invenção. Não custam RP. Algumas invenções viram a guerra (a metralhadora dá +4 de defesa à infantaria). |
| **Prestígio** | Não existe prestígio por ser o primeiro numa tech. Só as **invenções artísticas** dão prestígio dividido entre quem descobre: 3 a 25 pontos. A regra exata de divisão é incerta: 1/n, ou metade para cada próximo. |
| **IA** | Escolhe por pesos multiplicativos: ×2 se combina com a escola, ×0,1 se a alfabetização é baixa. |
| **Interface** | 5 abas, e em cada uma 5 colunas com contador "x/6". A tech escolhida mostra custo, efeitos e o botão Pesquisar. Há a lista de invenções com a % do mês. **Uma tech por vez, sem fila**, e um aviso quando a pesquisa está parada. |
| **Críticas** | A bola de neve da alfabetização. Tudo que aumenta pesquisa vira jogada obrigatória ("Cultura primeiro"). Invenção aleatória decisiva demais tira o controle, mas a % visível ajuda. **Elogio**: o ótimo que satura é simples e legível. |

**O que vale copiar:**
- RP que sai das **pessoas certas** e satura num ótimo;
- multiplicador de **coesão**;
- **trava por data** com desconto por atraso;
- uma pesquisa por vez com **reserva**;
- **escolas** que puxam o estilo;
- **invenções** com % mensal visível;
- prestígio para **quem descobre primeiro**.

**O que evitar:**
- a bola de neve, ou seja, poucas techs que aumentam a própria pesquisa, e com teto;
- a jogada obrigatória;
- invenção aleatória que decide briga sozinha.

---

## 2. O que o nosso jogo já tem (mapeado no código)

| Peça | Hoje | Onde |
|---|---|---|
| Relógio | Dia, semana (fechamento em `fecharSemana`) e mês (`fimDoMes`, que cobra professores, advogados e ônibus). **O mês é o gancho natural dos pontos.** | `estado.js:357`, `financeiro.js:183` |
| Trava que já existe | O **nível da sede** já trava bar, loja, subsede, garagem, sala de treino, advogados, filiais, escolta, turnos e pixo. É o "ano" do Vic2 do nosso jogo. | `membros.SEDE`, `patrimonio.TETO`, `financeiro.TETO_SEDE` |
| Pessoas | Cargos novato/componente/frente/diretoria (teto 8/12/18/20), **velha guarda** e diretoria limitada pela sede (2 a 20) | `membros.js:12`, `:114` |
| Coesão | Moral 0–20, com faixas que já multiplicam o comércio de ×0,4 a ×1,3 | `financeiro.multMoral` |
| Onde gastar tempo | O **expediente**, com 3 turnos (recrutar, festa, visita, PIX, padrinho, bateria, inteligência, reunião). Também a **reunião da diretoria** no dia 5, com as pautas. | `acoes.js:814`, `feed.js:4444` |
| Upgrades comprados | Anexos (enfermaria, galpão, cofre, fábrica), área de treino, professores, advogados, ônibus, festas, faixas e bandeiras | `patrimonio.opcoes()` |
| Fórmulas que dá para mexer | Golpe, vida, esquiva, agarrão e bomba; habilidades por cargo (`PERFIS`: novato não chuta, só a frente agarra); ferido de 5 a 15 dias; pena de 15 a 90 dias; fiança; sequela de 15%; ferrugem da paz a cada 20 dias | `combate.js`, `membros.js` |
| Economia | Receita e manutenção de bar, loja e subsede; insumo da loja; rateio da caravana (0,6); vontade de viajar; ingresso a R$ 10; relação com o clube | `financeiro.js:49`, `planejamento.js:989` |
| Mundo | Recrutamento por regime, domínio dos bairros, pixo, curtidas, relações e alianças | `acoes.js:122`, `dominio.js`, `relacoes.js` |
| IAs | Compram uma coisa por semana numa fila rodante (`ORDEM`), e a sede destrava os itens | `relacoes.js:240`, `:851` |
| Tela | Sub-abas de Torcida (Membros, Treinamentos, Recrutamento, Velha Guarda, Moral) e de Financeiro | `main.js:5646`, `:7896` |

**Regras do dono que valem aqui:**
- tudo que vale para o jogador vale para a IA pela mesma régua;
- notícia nova no feed só entra com o crivo do dono;
- o sistema de polícia e os "materiais da loja (14 itens)" estão descartados, então nenhuma tech deve ressuscitá-los.

---

## 3. As ideias

### 3.1 O nome e a fantasia

**Decidido pelo dono (12/10/2026): "Desenvolvimento da Torcida".** A palavra
"escola" não tem a ver com a identidade do jogo; as categorias passam a se
chamar **áreas**. O texto abaixo guarda a proposta original pra registro.

Torcida não tem laboratório. Ela tem **"o que a torcida aprendeu"**:
- a doutrina de rua passada pela velha guarda;
- o jeito de organizar a caravana;
- o know-how de fazer mosaico;
- o tino comercial do bar.

Nomes possíveis:
- **"Escola da Torcida"** (recomendado);
- "Conhecimento";
- "Doutrina";
- "Evolução".

Cada tech é um **"estudo"**, e cada invenção é um **"achado"** (ou "sacada").

### 3.2 De onde vêm os pontos (o "clérigo" nosso é a velha guarda)

**Pontos de Estudo (PE) por semana**, entregues no `fecharSemana`. A receita segue o Vic2: ótimo que satura, fixo pelo status e multiplicador de coesão.

| Fonte | Regra | Por que |
|---|---|---|
| **Velha guarda** (o nosso clérigo) | até **+4 PE**, linear até o ótimo de **5% do efetivo** | Quem pendurou a bandeira ensina. Dá serventia à velha guarda e premia a torcida antiga. |
| **Diretoria** (o nosso clerk) | até **+3 PE**, linear até o ótimo de **6% do efetivo** | Quem pensa a torcida. Já é limitada pela sede, então não vira bola de neve. |
| **Sede** (o "status") | +0 / 1 / 1,5 / 2 / 3 / 4 / 5 nos níveis 0 a 6 | A sede maior tem sala, estrutura e quadro. |
| **Turno "Estudar"** no expediente (ação nova) | +1 PE por turno usado na semana, até +3 | O jogador troca recrutamento ou PIX por conhecimento. É uma escolha real. |
| **Investir dinheiro** (opcional) | R$ → PE com retorno decrescente (ex.: R$ 5.000 = 1 PE, R$ 20.000 = 2 PE no mês) | É um ralo de caixa para as IAs que acumulam dinheiro (a simulação de 20 anos mostrou IA com caixa parado). |
| **Coesão** (multiplicador) | moral alta ×1,2, média ×1,0, baixa ×0,7 (as faixas do `multMoral`) | É a nossa "pluralidade": torcida rachada não aprende. |

**Ordem de grandeza:**
- torcida pequena: ~3 PE por semana;
- média, sede 3: ~7;
- grande, sede 6: ~14 a 16.

O que estiver acima disso sai do multiplicador e da velha guarda, com teto.

**Reserva:** sem estudo escolhido, os PE acumulam até 52 semanas de produção, igual ao Vic2. A tela avisa *"a diretoria está sem estudo"*.

### 3.3 A árvore: 6 áreas × trilhas de degraus

**Pedido do dono (12/10/2026):** uma sexta área focada no aumento da
quantidade de torcedores do clube, com estudos que melhoram o elenco e
puxando pra ela o recrutamento, que hoje está espalhado pelo jogo, e
estudos que fazem surgir torcedores numa cidade onde o clube ainda não
tem. Ela se chama **Massa**. O protótipo (seção 5) já tem as seis áreas.

A proposta original (5 áreas × 3 trilhas × 4 degraus) segue abaixo.

A ideia é **60 estudos no jogo cheio** e um **recorte de 20 a 25 na primeira versão** (seção 3.8).

| Escola | Trilhas | Mexe em |
|---|---|---|
| **Pista** (o Exército) | Doutrina de rua · Armas e bombas · Liderança | combate, bombas, habilidades por cargo, PM |
| **Estrada** (a Marinha) | Logística · Olheiros · Frota | caravana, rotas, emboscadas, ônibus, escolta |
| **Arquibancada** (a Cultura) | Festa · Canto e bateria · Identidade | festas, Fator Torcida, faixa, bandeira, prestígio |
| **Negócio** (o Comércio) | Bar · Loja e marca · Finanças | receita, manutenção, insumo, mensalidade, saque |
| **Organização** (a Indústria/Filosofia) | Recrutamento · Jurídico e saúde · Disciplina | recrutamento, ferido, pena, fiança, ferrugem, domínio, relações |

**Pré-requisito:** o degrau anterior da mesma trilha e um **nível mínimo de sede** por degrau. A sede é o nosso "ano":

| Degrau | Sede mínima |
|---|---|
| 1º | 0 |
| 2º | 2 |
| 3º | 4 |
| 4º | 5 |

**Custo:** 12 / 30 / 60 / 100 PE por degrau. Na régua de ~7 PE por semana dá:

| Degrau | Tempo |
|---|---|
| 1º | ~2 semanas |
| 2º | ~1 mês |
| 3º | ~2 meses |
| 4º | ~3,5 meses |

Uma temporada abre uns 8 a 10 estudos. A árvore inteira leva ~5 anos de torcida grande, o que casa com o ritmo dos saves de 20 anos.

**Desconto por atraso**, adaptado do "desconto temporal" do Vic2: o estudo fica **mais barato a cada torcida do país que já o tem**, −2% por torcida, até −40%. Com **aliada** o desconto é dobrado: o conhecimento circula entre irmãs. Isso ajuda a torcida pequena a não ficar para trás para sempre e dá peso às alianças.

### 3.4 Exemplos de estudo (efeito pequeno, acumulativo e ancorado no código)

**Pista**

| Estudo | Efeito |
|---|---|
| Formação em bloco | +5% de dano com bonde de 20 ou mais |
| Componente que agarra | o componente ganha o agarrão, que hoje é só da frente (`PERFIS`) |
| Novato que chuta | o novato ganha o chute |
| Bomba caseira | bomba −20% no preço; fica na pilha com o galpão |
| Esquiva de rua | esquiva do chute +0,04 |
| Contragolpe da frente | +10% de chance de contragolpe |
| Disciplina na hora H | fuga do bonde em desvantagem −15% |

**Estrada**

| Estudo | Efeito |
|---|---|
| Rateio organizado | quem viaja paga 65% em vez de 60% |
| Olheiro na estrada | a emboscada no itinerário é avisada um ponto antes |
| Rota de fuga | o risco da rota pesa a metade na vontade de viajar |
| Lanche no ônibus | +5% de vontade de viajar |
| Manutenção preventiva | quebra do ônibus de 1% para 0,5% ao mês |

**Arquibancada**

| Estudo | Efeito |
|---|---|
| Mosaico em série | festas −15% no preço |
| Bateria afinada | +2 pontos de Fator Torcida em todo jogo com bateria |
| Faixa costurada | chance de perder a faixa −20% |
| Hino próprio | prestígio +5% em tudo (o Aesthetics do Vic2) |
| Bandeirão gigante | libera um bandeirão de 2× a área, que entra como festa nova |

**Negócio**

| Estudo | Efeito |
|---|---|
| Chope próprio | bar +10% de receita |
| Estamparia | insumo da loja de 25% para 20% |
| Sócio-torcedor | mensalidade +10% |
| Caixa forte | saque −15%; fica na pilha com o cofre |
| Contabilidade | manutenção de todos os pontos −5% |

**Organização**

| Estudo | Efeito |
|---|---|
| Peneira | +5 pontos percentuais em cada faixa de chance de recrutamento |
| Recrutamento nas escolas | um novato garantido por mês |
| Fisioterapia | ferido volta 1 dia antes; fica na pilha com a enfermaria |
| Jurídico | fiança −20% |
| Disciplina da velha guarda | a ferrugem da paz cai a cada 30 dias em vez de 20 (resolve o "nossa força enferruja sem piso" da simulação) |
| Assessoria | +5 de relação em toda aproximação |

**Liberar coisa nova** é o que dá mais gosto, mas cada item novo tem de passar pelo dono. Dois candidatos que reaproveitam o que já existe:
- o **bandeirão gigante**;
- a **"Escola de Bateria"**: o turno de bateria passa a valer para jogo fora.

**Teto contra bola de neve:** só **dois** estudos aumentam os próprios PE ("Biblioteca da sede" +10% e "Velha guarda professora" ótimo de 5% → 7%). Cada um fica no 3º degrau da Organização.

### 3.5 A linha da torcida (as escolas do Vic2)

A torcida tem uma **linha**, escolhida na fundação, que puxa o ritmo dos estudos:

| Linha | Pista | Estrada | Arquib. | Negócio | Organiz. |
|---|---|---|---|---|---|
| Tradicional | 0 | 0 | 0 | 0 | 0 |
| Linha de frente | +15% | +5% | −10% | −10% | 0 |
| Festeira | −10% | 0 | +15% | +5% | 0 |
| Empresarial | −10% | 0 | 0 | +15% | +5% |
| Viajante | 0 | +15% | +5% | −10% | −10% |
| Política | −5% | 0 | 0 | 0 | +15% |

- **Para as IAs**, a linha sai do perfil que elas já têm. A Gaviões, por exemplo, seria Festeira, e a Mancha seria Linha de frente.
- **Para nós**, a escolha é **casada com a ideologia** que já existe ("seguir ideologia"), em vez de criar mais um eixo.
- **Trocar de linha:** uma vez por temporada, na reunião, ao custo de moral.

### 3.6 Os achados (as invenções do Vic2)

Todo dia 1º, cada achado liberado sorteia a **sua % do mês, que aparece na tela**:
- base de 2%;
- +2% com moral alta;
- +2% se a velha guarda está no ótimo;
- +3% se uma aliada já achou.

Exemplos:
- **"Canto que pegou"**: prestígio +5 dividido. Quem acha primeiro leva cheio e cada próxima torcida leva a metade da anterior.
- **"Mosaico viral"**: a próxima festa vale o dobro de Fator Torcida.
- **"Rota secreta"**: uma rota nova sem risco para uma praça.
- **"Golpe da velha guarda"**: +0,5 de ficha na diretoria. É o único achado de combate, e é pequeno de propósito.

Cada achado vira uma **mensagem da diretoria**, não notícia do feed (a regra do crivo). Se o dono quiser, os achados de prestígio viram post da própria torcida na rede social.

### 3.7 IA, interface e onde o jogador decide

- **IA pela mesma régua:**
  - mesma fórmula de PE, com `velha guarda` e `diretoria` virando frações do efetivo delas;
  - a escolha do estudo é por pesos (×2 na escola da linha, ×2 no que destrava o próximo item da fila de compras dela);
  - a pesquisa delas não ocupa a vez da compra semanal (`ORDEM`), porque corre em paralelo como a nossa.
- **Tela:** uma **sub-aba "Escola" em Torcida** (a menos invasiva; um ícone novo no menu precisaria de aval):
  - 5 colunas (as escolas), cada uma com 3 trilhas e contador "x/4";
  - o estudo atual com barra de progresso e "faltam ~3 semanas";
  - o painel do estudo com custo, efeito em número, desconto e trava;
  - a lista de achados com a % do mês.
- **Na reunião (modo detalhista):** pauta **"o que a torcida vai estudar"**, a cada estudo concluído. O diretor da pauta sugere três estudos, puxados pela linha, e o presidente escolhe. Com isso a pesquisa vira assunto de reunião, não só uma tela.
- **No modo rápido:** a mesma pauta vira mensagem da diretoria com três botões, igual às outras pautas soltas.
- **No ranking:** o número de estudos pode entrar como um termo pequeno da força da torcida (opcional).

### 3.8 Por onde começar: um recorte para a primeira versão

1. **Fase 1, o motor:**
   - PE semanais com velha guarda, diretoria, sede e moral;
   - reserva;
   - uma pesquisa por vez;
   - 5 escolas × 2 trilhas × 2 degraus = **20 estudos**, só de modificadores numéricos que já existem (nada de item novo);
   - sub-aba Escola, IA pela mesma régua, `repararSave`, i18n;
   - medição: simular 5 anos e ver quantos estudos uma torcida pequena, uma média e a Gaviões fecham.
2. **Fase 2, a cara:** linhas da torcida, pauta da reunião, desconto por quem já tem e aliadas.
3. **Fase 3, o sabor:** achados com % mensal e prestígio dividido, 3º e 4º degraus e os itens que liberam coisa nova (com o aval do dono, um por um).

---

## 4. Perguntas para o dono

1. **Nome:** "Escola da Torcida", "Conhecimento" ou outro?
2. **As 5 escolas** (Pista, Estrada, Arquibancada, Negócio, Organização): é esse o recorte?
3. **Dinheiro vira pesquisa?** A ideia é deixar investir R$ em PE com retorno decrescente, ou a pesquisa sai só das pessoas e do tempo?
4. **Turno "Estudar" no expediente:** entra?
5. **Uma por vez sem fila** (como o Vic2), ou uma fila de até 3?
6. **Linha da torcida:** casar com a ideologia que já existe, ou ser uma escolha à parte?
7. **Achados:** entram, e como avisam (mensagem da diretoria ou post da torcida)?
8. **Liberar coisa nova** (bandeirão gigante, etc.) desde a primeira versão, ou só modificadores primeiro?
9. **Velha guarda como fonte principal:** faz sentido para você na fantasia da torcida?


---

## 5. O protótipo à parte (pedido do dono, 12/10/2026)

*"Gostaria de testar isso sem aplicar no jogo no momento, numa versão
fora à parte pra sentir a diferença."*

- **Onde:** `desenvolvimento.html`, no mesmo endereço do jogo:
  https://wilkerpietro.github.io/Jogo-torcidas/desenvolvimento.html
- **O jogo normal não muda:** o `index.html` não carrega nada disto. A
  página do protótipo é uma cópia do `index.html` gerada por
  `ferramentas/gerar_desenvolvimento.py` (rode de novo quando o
  `index.html` mudar), com dois acréscimos:
  - o save mora noutra gaveta do navegador (`torcida-organizada-desenv:`),
    então a partida do jogo normal não é lida nem sobrescrita. Pra levar
    uma partida pra lá, use exportar e importar do menu;
  - o módulo `js/prototipo/desenvolvimento.js`, que age **por fora** do
    código do jogo: embrulha o livro-caixa, os indicadores, o peso do
    recrutamento e o bônus das festas; escuta o fechamento da semana; e
    olha o save uma vez por dia.
- **Na tela:** um botão "Desenvolvimento" no canto de baixo à direita, com
  o estudo atual e a barra de progresso. Ele fica vermelho quando não há
  estudo escolhido. Tocar abre a tela: o estudo atual; os pontos por
  semana e de onde vêm; **"o que o Desenvolvimento já rendeu"** (dinheiro,
  fichas, torcedores, força do elenco do clube, dias de ferido...); as
  rivais que mais estudaram; e as seis áreas com as trilhas. O jogo pausa
  com a tela aberta.
- **No expediente:** uma ação nova, "Estudar (Desenvolvimento)": +1
  ponto na semana por turno, até 3.

### 5.1 O que o protótipo tem

- **Pontos por semana:**
  - velha guarda: até 4, no ótimo de 5% do efetivo;
  - diretoria: até 3, no ótimo de 6% do efetivo;
  - sede: 0 / 1 / 1,5 / 2 / 3 / 4 / 5;
  - turnos de estudo: até 3;
  - tudo × a moral (×0,7 / ×1 / ×1,2).
- **Reserva:** os pontos sem estudo escolhido ficam guardados, até 52
  semanas de produção.
- **Degraus:** custam 12 / 30 / 60 pontos e pedem sede 0 / 2 / 4.
- **Desconto pela difusão:** −1% por torcida que já tem o estudo, −3% se
  for aliada, até −30%.
- **39 estudos em 6 áreas.** A **Massa** tem três trilhas:
  - *Recrutamento:* Peneira (+25% de chance), Peneira técnica (quem entra
    chega com +1,5 de força e defesa) e Portas abertas (+25% e um novato
    garantido por mês);
  - *Torcedores do clube:* Escolinha de torcedor (+0,5% ao mês na nossa
    cidade), Caravana no interior (+0,5% ao mês nas cidades das
    subsedes) e Bandeira fincada (surge torcida do clube na maior cidade
    do país onde ele não tem torcedor, e dá pra abrir subsede lá);
  - *Elenco do clube:* Olheiros da torcida (reforço 15% mais barato),
    Vaquinha pro elenco (+1 de força a cada 6 meses) e Categoria de base
    (+1 a cada 3 meses).
- **As rivais estudam pela mesma régua simplificada**, mas **não ganham os
  efeitos** no protótipo. Elas só aparecem no ranking e baixam o custo
  pela difusão.
- **Só em português.** Se aprovado, o texto entra pelo `_t()` e pelos
  dicionários.

### 5.2 O que ficou de fora do protótipo

A linha da torcida, a pauta da reunião, os achados, dinheiro virando
pontos e os efeitos dentro da cena de briga. Na Pista, os estudos mexem
na ficha dos membros, não na fórmula do golpe.

### 5.3 Medido (2 anos, Leões da TUF, jogador passivo, mesma semente)

| | sem | com Desenvolvimento |
|---|---|---|
| Estudos feitos | — | 17 |
| Força e defesa médias dos membros | 7,85 | 8,29 |
| Caixa | R$ 142.736 | R$ 145.054 |
| Posição no ranking do país | 54º | 50º |

O jogador passivo escolhe sempre o estudo mais barato e não briga. As
diferenças são de propósito pequenas e acumulativas. O sorteio do jogo
diverge entre as duas partidas, então moral e torcedores não são
comparáveis um a um.

### 5.4 O ritmo: ~3 estudos por ano (dono, 12/10/2026)

*"Tem que ser em torno de 3 estudos por ano pra uma torcida média, com as
torcidas variando de 2 a 5."*

- **Custos dos degraus:** 24 / 36 / 48 pontos (eram 12 / 30 / 60). Ficaram
  mais próximos porque a torcida pequena só alcança o 1º degrau (sede < 2),
  e com ele barato ela estudava mais que a média.
- **Pontos por semana** (substitui a régua da 5.1):
  - sede: 0,6 / 0,8 / 1,1 / 1,5 / 1,9 / 2,3 / 2,7 nos níveis 0 a 6;
  - diretoria: até 0,4 (ótimo em 6% do efetivo);
  - velha guarda: até 0,5 (ótimo em 5%);
  - turno de estudo: 0,15 cada, até 3;
  - tudo × a moral (×0,7 / ×1 / ×1,2).
- **Desconto da difusão:** até −20% (era −30%).
- **As IAs** usam a mesma régua; a diretoria delas vale cheia.
- **Medido** (3 anos, jogador passivo que escolhe sempre o estudo mais
  barato):

  | Torcida | Estudos por ano | Média | Pontos por semana |
  |---|---|---|---|
  | Aliança (20 membros, sede 0) | 2, 2, 3 | 2,3 | ~1 |
  | Leões da TUF (150, sede 4) | 2, 3, 3 | 2,7 | 1,7 a 2,3 |
  | Gaviões (250, sede 5) | 4, 4, 3 | 3,7 | 2,1 a 2,8 |

  - O passivo deixa a moral cair, e o multiplicador desce pra ×0,7. Com a
    moral no normal, a TUF fica em ~2,3 pontos por semana, ou seja, ~3,2
    estudos por ano.
  - **As 386 IAs:** mínimo 1,3, 10% ficam até 2, mediana 2,7, 90% ficam até
    4 e o máximo é 5,7 por ano. As pontas são torcidas com a moral no fundo
    ou no topo.

### 5.5 Pequena 2, média 3, grande 5 (dono, 12/10/2026)

*"Torcidas pequenas desenvolvem em média 2 pesquisas por ano, médias 3 e
grandes 5."*

- **Pontos da sede** (substitui a régua da 5.4): 0,5 / 0,6 / 1,3 / 1,6 /
  1,8 / 2,8 / 3,2 nos níveis 0 a 6. Diretoria, velha guarda e turno ficam
  como na 5.4.
- **Moral mais branda:** ×0,85 / ×1 / ×1,15 (era ×0,7 / ×1 / ×1,2). O
  tamanho manda mais que o humor do momento.
- **Desconto da difusão:** até −10%.
- **Medido** (3 anos, jogador passivo):

  | Torcida | Estudos por ano | Média |
  |---|---|---|
  | Aliança (pequena, sede 0) | 2, 1, 3 | 2,0 |
  | Leões da TUF (média, sede 4) | 2, 4, 3 | 3,0 |
  | Gaviões (grande, sede 5) | 4, 5, 5 | 4,7 |

  - **As 386 IAs:** as pequenas ficam em ~1,7 por ano, a mediana (sede 2,
    ~100 membros) em 2,7, 90% ficam até 4 e a maior chega a 6,3.

