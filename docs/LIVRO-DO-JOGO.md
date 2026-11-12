# Torcida Organizada — o livro do jogo

Estado do projeto em 12/11/2026 (commit `b53b27c`, branch `claude/game-html-news-feed-sndgh4`).

**Para que serve este livro.** Ele descreve o jogo como está hoje, para que outra sessão o reconstrua do zero sem precisar ler os ~84 mil linhas de código. Tudo aqui saiu da leitura do código atual, não do histórico. Onde algo não foi confirmado, o texto diz "(não confirmado)". O diário de mudanças, com a intenção de cada decisão do dono, é `docs/DECISOES.md` (mais de 11 mil linhas); ele serve de apoio, mas pode estar superado por mudanças posteriores.

**Como ler.** A Parte I dá a visão geral, a arquitetura e as telas. A Parte II traz as regras de gestão e o feed. A Parte III traz o mundo: torcidas, relações, domínio, futebol. A Parte IV traz o dia de jogo: cenas, combate, polícia, assalto, bonecos, som. A Parte V cobre idiomas, ferramentas, arte, o jogo 3D, problemas conhecidos e conselhos para a reconstrução. A numeração dos capítulos recomeça em cada parte; uma referência como "(9.7)" aponta para o capítulo 9, seção 7, da mesma parte.

**Como foi escrito.** As Partes II e III foram escritas por leitura completa dos arquivos de regra e conferidas por amostragem; as Partes I, IV e V, por quem fez as mudanças mais recentes no combate e na interface. Prestígio e moral vivem de 0 a 20 no save e aparecem de 0 a 100 na tela (×5); cada parte diz qual régua está usando.

---

# PARTE I — VISÃO GERAL, ARQUITETURA E TELAS

## 1. O que é o jogo

Torcida Organizada é um simulador de gestão de uma torcida organizada de futebol brasileira. O jogador é o **presidente** de uma torcida real (escolhida entre as 387 do banco de dados, em 10 países da América do Sul), numa cidade real, torcendo por um clube real.

O jogo tem três camadas que se alimentam:

1. **O dia a dia (o feed).** O tempo corre sozinho, um dia por vez. Cada dia solta mensagens num feed: recados da diretoria, pedidos de aliados, provocações de rivais, notícias de jornal. Algumas são só informação; outras são **decisões** com botões, e o relógio para até o jogador responder.
2. **A gestão.** Dinheiro, membros (cada um com nome, idade, força, defesa, cargo e ficha), patrimônio (sede, bares, lojas, subsedes), alianças e rivalidades, caravanas para jogos fora, domínio dos bairros da cidade, festas na arquibancada.
3. **A ação.** Brigas em tempo real, vistas de cima sobre uma foto aérea ou um cenário desenhado. O jogador controla o presidente (um boneco); o resto do bonde luta sozinho. Há também assaltos jogados (furtivos, com cone de visão) e a partida de futebol ao vivo com barra de tensão na arquibancada.

Os dois indicadores centrais são **prestígio** (o nome da torcida na rua, que entra no ranking nacional) e **moral**. O jogo não tem condição de vitória: é uma caixa de areia com ranking, retrospectiva de fim de ano e temporadas de futebol que se repetem.

Existem dois modos, escolhidos ao criar a partida e fixos no save: **rápido** (`rapido`) e **completo** (`detalhista`). A diferença real hoje é pequena: o rápido não tem a reunião mensal da diretoria (as pautas chegam uma por dia como mensagem), resolve bote e assalto na hora e abre o mapa no Brasil. **O domínio dos bairros e as brigas de bairro valem nos dois modos.** A tabela completa está na Parte II, capítulo 1.

Existem duas versões jogáveis no mesmo repositório:

- **O jogo de feed (2D)**, na raiz: `index.html`. É a versão principal e a que este livro descreve.
- **O jogo 3D**, em `cenario3d/`: a cidade inteira modelada em 3D, com o mesmo motor de regras rodando por cima. Descrito na Parte V.

## 2. Tecnologia e arquitetura

### 2.1 Pilha

- HTML, CSS e JavaScript puros. **Sem build, sem bundler, sem framework, sem dependências de pacote.** Qualquer servidor de arquivos estáticos na raiz serve (`python3 -m http.server`).
- Publicado no GitHub Pages (`https://wilkerpietro.github.io/Jogo-torcidas/`).
- Bibliotecas de terceiros, só para os bonecos 3D das brigas: `js/lib/three.min.js` (Three r147, global), `GLTFLoader.js`, `SkeletonUtils.js`.
- O save fica no `localStorage`, comprimido com gzip pelo `CompressionStream` do navegador quando existe.
- Sem áudio em arquivo: o som é sintetizado com WebAudio (`js/som.js`).

### 2.2 O padrão de módulo

Tudo vive num único global, `TO`. Cada arquivo é uma função imediata que devolve um objeto de exports:

```js
TO.financeiro = (function(){
  const U = TO.util;
  function fecharMes(E){ ... }
  return { fecharMes, ... };
})();
```

- `TO.util` (`js/nucleo.js`): matemática (`limitar`, `dist`, `entre`, `inteiro`, `escolher`, `embaralhar`), aleatório com semente (`usarSemente`, `rng`), formatação (`dinheiro`, `numero`) e ajudantes de DOM (`$`, `$$`, `el`).
- `TO.dados.*`: os dados estáticos (um arquivo por tabela em `dados/`).
- `TO.estado.E`: o objeto do save, passado como primeiro argumento `E` para quase toda função de regra.
- `_t(texto, params)` e `_tn(n, singular, plural)`: tradução (ver Parte V). **O texto em português é a chave.**

A ordem de carga importa, porque não há módulos ES. A ordem do `index.html` é:

1. `js/nucleo.js`, `js/i18n.js`, os dicionários `dados/i18n/*.js`.
2. Os dados: `nomes`, `cidades`, `times`, `fundacoes`, `escudos`, `faixas`, `competicoes_logos`, `capas`, `torcidas`, `barras`, `malha`, `estadios`, `plantas`, `historia`, `genero`, `cidade_mapa*`, `diplomacia`, `eixos`, `cena_arredores`, `cenas_foto`, `cenas_editadas`, `assaltos`, `cenas`.
3. O mundo: `mundo`, `dominio`, `elenco`, `competicoes`, `relacoes`, `eixos`, `relacaoclube`, `mapa`, `mapa_gerado`, `praca`, `ligas`, `conmebol`.
4. A gestão: `membros`, `torcedores`, `financeiro`, `patrimonio`, `festas`, `acoes`, `planejamento`, `itinerario`.
5. `js/estado.js`.
6. Os jornais e o feed: `gazeta`, `porrada`, `almanaque`, `feed`.
7. O dia de jogo: `cenario`, `arredores`, `som`, `combate`, `festas_cena`, `tres`, as libs do Three, `dados/boneco_leve_glb.js`, `bonecos3`, `ponte`, `simular`, `assalto_motor`.
8. A interface: `ui/icones`, `ui/cartaz`, `ui/mapa_brasil`, `ui/mapa_planta`, `ui/mapa_caravana`, `ui/assalto2d`, `gestao/tutorial`.
9. `js/main.js` (a casca: todas as telas e a ligação entre tudo).

### 2.3 Tamanho de cada parte

| Parte | Arquivos principais | Linhas (aprox.) |
|---|---|---|
| Casca e telas | `js/main.js` | 12.500 |
| Feed e rede social | `js/mundo/feed.js` | 7.000 |
| Combate | `js/diajogo/combate.js` | 4.900 |
| Relações e torcidas do computador | `js/mundo/relacoes.js` | 3.400 |
| Bonecos 3D das brigas | `js/diajogo/bonecos3.js` | 3.300 |
| Ponte (laço, HUD, entrada) | `js/diajogo/ponte.js` | 2.000 |
| Câmera de perto (WebGL cru) | `js/diajogo/tres.js` | 2.000 |
| Competições | `competicoes.js`, `ligas.js`, `conmebol.js` | 3.900 |
| Gestão | `js/gestao/*.js` | 7.300 |
| Domínio | `js/mundo/dominio.js` | 1.300 |
| Estado e save | `js/estado.js` | 1.100 |
| CSS | `css/*.css` | 5.400 |

### 2.4 Convenções do código

- Nomes de função, variável e arquivo em português, sem acento no identificador.
- Comentários longos, datados, citando o pedido do dono entre aspas. Cada regra importante tem o porquê ao lado.
- Estado de regra nunca fica no DOM: tudo o que precisa sobreviver está em `E`.
- A interface redesenha por função (`redesenhar`, `pintarTopo`, `atualizarFeed`) em vez de data binding.
- Determinismo onde importa: sorteios de mundo usam hash de texto (`TO.mapa.hash`) ou a semente do save, para o mesmo save dar sempre o mesmo resultado.
- Páginas auxiliares na raiz: `arredores.html` (bancada das cenas de briga, com o editor de máscara no F2), `bonecos.html` (vitrine dos bonecos e poses), `briga3d.html`, `vitrine-torcidas.html`, `desenvolvimento.html` (protótipo, gerado por `ferramentas/gerar_desenvolvimento.py`).

## 3. Fluxo das telas

### 3.1 Menu principal

Título "TORCIDA ORGANIZADA — desde 1997" e os itens: **Continuar** (se há autosave), **Novo jogo**, **Carregar jogo**, **Configurações**, e dois itens apagados (Conquistas, Créditos). Configurações tem o idioma (português, español, english), que fica no navegador (`to.idioma`) e recarrega a página.

### 3.2 Novo jogo: seleção em passos

1. **Escolher a torcida**: lista filtrável por país, estado e clube, com escudo, cidade, tamanho e posição no ranking. A torcida escolhida define a cidade (a "praça"), o clube e o ponto de partida (membros, dinheiro, prestígio).
2. **Nome do presidente** e **modo de jogo** (rápido ou completo, dois cartões lado a lado).
3. A partida nasce (`TO.estado.novo`) e abre o tutorial (pode pular).

### 3.3 A tela principal: o feed

É a tela do jogo. De cima para baixo e da esquerda para a direita:

- **Coluna de ícones** (esquerda, sempre visível, também no celular): Feed, Mapa, Torcida, Financeiro, Calendário, Competições, Ranking, Diplomacia, Notícias, Jogo (cofre de saves), Menu principal. Ícones SVG de traço (`js/ui/icones.js`), com contadores vermelhos de pendências.
- **Barra do topo**: escudo e nome da torcida, posição no ranking (`#12`), dinheiro, número de membros, prestígio e moral (na régua de 0 a 100).
- **Linha da data**: dia da semana, data, "semana N de 52 · ano", botão `»` para avançar um dia na mão, e o botão de velocidade `1×/2×`.
- **Ticker de manchetes** ("Últimas"): fita que rola com as notícias, as da nossa torcida e do nosso clube na frente. **No celular (até 1000 px) o ticker não aparece.**
- **O rolo do feed**: cartões de mensagem, o mais novo em cima. Cada cartão tem o rótulo de quem fala (DIRETORIA, JORNAL, FUTEBOL E PORRADA, "MENSAGEM DA <torcida>"), o texto, e, se for decisão, os botões com o efeito anunciado embaixo de cada um ("Prestígio +4 · Relação −2"). Depois de respondido, mostra "Você respondeu: …" e a consequência.
- **Coluna da rede social** (direita, só acima de 1000 px): os posts das torcidas e dos dois jornais, com avatar, arroba, cidade, "há quanto tempo", imagem (cartaz), curtidas, comentários, compartilhamentos e o menu `⋯` (Parar de seguir / Mostrar menos). Pode ser recolhida numa tira; recolhida, os posts importantes viram um aviso que some em 5 s no canto.
- **No celular**, a rede social vira um cartão flutuante perto do pé da tela (84 px acima da borda em aparelho de toque, para livrar a barra do navegador), um post por vez, entrando pela esquerda, parando 3 s e saindo pela direita. Post de torcida aparece sem a arte; post de jornal aparece como recorte de página de jornal.

### 3.4 O relógio

- O tempo anda sozinho: **um dia por tique**. Dia sem mensagem passa em 120 ms; com mensagem na fila, cada mensagem cai no compasso dela (decisão espera mais que informação). A velocidade 2× divide as esperas.
- O relógio **para por motivo com nome** (`pausarTempo('painel')`, `'cena'`, …): painel aberto, cena aberta, decisão sem resposta (`TO.feed.travado`), retrospectiva de fim de ano. Um vigia religa o relógio se ele parar sem motivo.
- O botão `»` avança um dia na mão; se o dia não puder andar, um aviso diz o motivo.

### 3.5 Os painéis

Todo o resto é **painel por cima do feed**, com fundo escuro, cabeçalho com o nome da seção e abas. Abrir um painel pausa o tempo. Os painéis:

| Painel | O que tem |
|---|---|
| **Mapa** | Aba Brasil (contorno do país com as 30 praças, cada uma na cor de quem domina) e a planta da cidade com os bairros na cor da torcida dona; o cartão do bairro mostra a barra de 7 pontos, quem mora ali, as estruturas e o aviso "rende 15% menos". No modo rápido o painel abre no mapa do Brasil. Pixação e ação social estão desligadas nos dois modos. |
| **Torcida** | Membros (lista com cargo, idade, força, defesa, situação), Treinamento, o "livro" de Moral & Prestígio (cada item que somou ou tirou), Velha Guarda, perfil de cada membro. |
| **Financeiro** | Extrato do mês, receitas e despesas por linha (com a nota "bairro da TUF −15%" quando há corte), Patrimônio (sede, bares, lojas, subsedes, ônibus, professores, advogados), Loja de festas, Elenco (dinheiro da torcida para o time). |
| **Calendário** | O mês com os jogos do clube, as ações marcadas, aniversários e festas. |
| **Competições** | Em três níveis (país → competição → fase), com tabelas, chaves, logos, as ligas dos dez países e as copas continentais. |
| **Ranking** | Duas abas: nacional e por praça/região; "rei da pista". |
| **Diplomacia** | Relações com cada torcida, alianças, os eixos de aliança, perfil de torcida e de cidade. |
| **Notícias** | Abas: Mensagens (a rede social inteira), Arquivo do feed, Tretas/Brigas, e os jornais. |
| **Jogo** | O cofre de saves: vagas, autosave, exportar e importar. |

Perfis abrem como painel próprio: **perfil do membro**, **perfil da torcida** (qualquer torcida do mundo, com relação, patrimônio, histórico de brigas), **perfil da cidade**, **perfil do eixo**.

### 3.6 O planejamento da semana e a reunião

- **Segunda-feira**: o planejamento da semana (popup): o jogo do fim de semana, a intenção (ir em paz, atacar, defender…), a caravana, o pedido de recepção aos aliados.
- **Reunião mensal da diretoria** (modo completo): uma cena com a diretoria sentada em cadeiras em "C", na sede do nível atual; cada diretor fala uma pauta num balão (alvos de domínio do mês, convites de festa, ataques a bar e casa, alvos de assalto, aniversários). O presidente responde a cada pauta. No modo rápido essas pautas chegam como mensagens da diretoria no feed.

### 3.7 O dia de jogo no feed

No dia do jogo do clube, o feed abre **o itinerário**: uma linha do tempo com paradas (concentração, pista, arredores, arquibancada, volta), cada uma com hora e o que pode acontecer. Fora de casa, o mapa do Brasil mostra a rota da caravana com o ônibus andando de praça em praça; uma hostilidade no caminho abre um balão sobre a praça.

**A partida ao vivo** roda dentro do cartão (ou, no estádio, dentro da cena da arquibancada com um placar de TV):

- O relógio vai de 0 a 90 minutos, a 4 minutos de jogo por segundo real vezes a velocidade da partida. A velocidade padrão é **4×** e o botão alterna 1× → 2× → 4×; há botão de pausa.
- Os gols aparecem conforme a barra alcança o minuto. No mata-mata empatado, a disputa de pênaltis sai cobrança a cobrança numa grade.
- **O clima do estádio** tem três degraus (tranquilo, esquentando, tenso). Por minuto de jogo há uma chance de subir um degrau, conforme a pior relação entre as torcidas presentes: maior rival 3,5%, rival quente 3,0%, rival 2,0%, neutro 1,0%. Com aliado nosso no estádio o clima não sobe.
- **A barra de tensão** (0 a 100) com dois botões: **Amenizar** (−15) e **Provocar** (+15), cada um com recarga de 5 minutos de jogo. Em 100 a arquibancada se pega e abre a cena de briga no setor. Depois de uma briga a PM ocupa o setor e a tensão não estoura de novo.

### 3.8 Fim de cena e fim de ano

- Toda cena termina num **resumo da noite**: quem venceu, envolvidos, caídos, presos, o que mudou em moral, prestígio, relação, caixa e domínio.
- Na virada do ano abre a **retrospectiva**, em páginas: sobe e desce (acessos e rebaixamentos), campeões, torcida do ano, rei da pista, as praças, as regiões, a janela, o balanço, a treta do ano.

---

# PARTE II — GESTÃO, ECONOMIA E O FEED

Este volume descreve o jogo **como ele está no código hoje**. Onde algo existe no código mas não roda, está marcado "(desligado)"; onde a regra mora em arquivo fora do escopo desta parte, "(fora do escopo)" ou "(não confirmado)". Arquivos e funções aparecem entre crases.

Convenções:

- `E` é o objeto da partida (o save). `TO` é o global onde cada módulo se registra (`TO.estado`, `TO.membros`, `TO.financeiro`, `TO.feed`…).
- `U(a; b)` = sorteio uniforme entre `a` e `b`. `limitar(v; mín; máx)` = corte nos limites.
- Prestígio e moral vivem de **0 a 20** no save e aparecem de **0 a 100** na tela (×5). Quando o texto disser "na tela", é a régua de 0 a 100.

## 1. O estado do jogo

Fonte: `js/estado.js` (`TO.estado`), `js/nucleo.js` (`TO.util`, `TO.genero`).

### 1.1 Utilidades de base (`nucleo.js`)

- **Aleatório com semente** (`semear`): xorshift de 32 bits (`s ^= s<<13; s ^= s>>17; s ^= s<<5`), resultado `s / 2^32`. `usarSemente(s)` troca o gerador global; `rng`, `entre(a,b)`, `inteiro(a,b)` (inclusivo), `escolher(lista)`, `embaralhar(lista)` (Fisher-Yates) usam esse gerador. Partida nova e partida carregada chamam `usarSemente(E.semente)`.
- **Dinheiro**: `dinheiro(v)` → `R$ 12.000` (negativo com `−`), separador conforme o idioma.
- **Faixas 0–20** (`faixa`): até 4 "Crítico"; até 9 "Baixo"; até 14 "Neutro"; até 20 "Alto".
- **Gênero** (`TO.genero`): escolhe artigo/preposição (do/da/de, no/na/em, pelo/pela/por, o/a) para competição, estádio, fase, cidade e clube, a partir da tabela `dados/genero.js`, em português, espanhol e inglês.
- Geometria (`dist`, `pontoEmPoligono`, `maisProximoNoSegmento`) e atalhos de DOM (`$`, `$$`, `criar`).

### 1.2 Como nasce um jogo novo (`novo(opc)`)

`opc`: `semente`, `modo`, `torcida` (a ficha da torcida escolhida na fonte de dados), `efetivo`, `presidente` (nome digitado), `agora`.

1. Semente: a informada ou um inteiro aleatório até 1e9.
2. Cria `E` com os padrões da tabela 1.3.
3. Com torcida escolhida:
   - **Caixa inicial** = `max(4.000, round(saldo da fonte × 4))` (saldo ausente conta como 1.000). Sem torcida escolhida: 12.000.
   - **Prestígio** = `round(prestígio da fonte / 5)` (fonte ausente: 15 → 3); **moral** = `round(moral da fonte / 5)` (ausente: 60 → 12). Sem torcida: moral 12, prestígio 6.
   - `E.efetivoAlvo` = membros da fonte (ou 60).
   - Nível da sede: `membros.nivelInicialDaSede` (3.3).
   - **Relações**: para cada outra torcida completa do mundo, se a relação de base (`TO.mundo.relacaoBase`) não é "Neutro", grava `E.relacoes[id] = TO.mundo.valorInicial(tipo)`.
4. Povoa os membros (`membros.povoarInicial`), nomeia o presidente, sorteia a fila de treino.
5. `E.forcas = {}`; liga as competições ao save; monta a temporada (`competicoes.montarTemporada`); tira a "foto do ano zero" do almanaque.
6. Escolhe o jogo da semana (`sortearProximoJogo`) e lança "Caixa inicial" com valor 0 no extrato.
7. (Na tela, o jogo novo chama `feed.abertura(E)`, que põe três decisões na fila: tutorial, ideologia e expediente — capítulo 9.)

### 1.3 Campos de primeiro nível de `E`

Criados em `novo`:

| Campo | Tipo | Significado |
|---|---|---|
| `versao` | número | 2. Save de outra versão não abre pela vaga/texto |
| `semente` | inteiro | semente do gerador aleatório |
| `criadoEm` | número | carimbo passado pela tela |
| `modo` | `'rapido'` / `'detalhista'` | modo de jogo, fixo no save (1.5) |
| `data` | `{ano, semana, dia, absoluto}` | começa em 2026, semana 1, dia 1, absoluto 0 |
| `torcida` | objeto | `id, nome, sigla, clube, clubeId, cidade, uf, mapa` (id da cidade), `bairroSede, cores[2], sedeNivel`, mais o que veio da fonte (fundação etc.) |
| `relacoes` | `{idTorcida: −100…+100}` | relação com cada torcida; par ausente vale o valor inicial da relação de base |
| `indicadores` | `{moral, prestigio}` | 0–20 |
| `relacaoClube` | 0–100 | relação com o clube, nasce 50 |
| `sequenciaClube` | lista de `'V'/'E'/'D'` | últimos 8 resultados do clube |
| `dinheiro` | número | caixa |
| `membros` | lista | fichas (capítulo 3) |
| `proximoId` | inteiro | próximo id de membro |
| `transacoes` | lista | extrato, até 200 linhas `{dia, descricao, valor}` |
| `estoque` | `{bombas}` | começa com 4 bombas |
| `acoes` | `{usadas, feitas?, rotinaFalha?, ultimoAtaqueManual?}` | contador do dia e histórico de ações |
| `expediente` | `{manha, tarde, noite}` | id da ação de cada turno |
| `feed` | lista | mensagens já entregues (histórico inteiro) |
| `feedFila` | lista | mensagens esperando a vez |
| `feedCtl` | `null` | reservado; sem uso nos arquivos lidos |
| `historicoNoites` | lista | resumo de cada briga `{semana, prestigio, feridos, presos, entraram}` |
| `efetivoAlvo` | número | tamanho inicial pretendido |
| `forcas` | objeto | força dos clubes (competições) |
| `temporada` | objeto | calendário e tabelas do ano (competições) |
| `proximoJogo` | ficha ou `null` | o jogo da semana (1.6) |
| `postura` | `'folga'` / `'estadio'` / `'viajar'` | consequência do calendário |

Criados depois, pelo uso (agrupados):

| Grupo | Campos | Significado |
|---|---|---|
| Tempo e marcos | `ultimaBriga`, `ultimaDepreciacao`, `titulosVistos`, `titulosPagos`, `ultimoJogoClube {venceu, perdeu}`, `janelaRecruta {tipo, ate}`, `recrutamento {bairro, ano, semana}` (ou `{mult, ate}`), `classifAnterior`, `elencoVirada {ano, de, para}`, `sobeDesceNoFeed`, `almanaquePendente`, `retrospectiva {ano, paginas, vista}` | relógio da paz, títulos já contados, último resultado do clube, janela de recrutamento, bairro do recrutamento, páginas da virada do ano |
| Indicadores | `historicoIndicadores` (300 linhas `{dia, ano, ind, delta, motivo}`), `relacaoClubeHistorico` (200), `clube {relacao, cobranca}` | livro de moral/prestígio e da relação com o clube |
| Membros | `presidenteId`, `velhaGuarda` (400), `historicoRecrutamento` (60), `campanha` (não confirmado), `padrinhoAbs`, `bateriaAbs`, `campana {nivel, pagoAbs}`, `calorPolicia`, `assaltos` (24), `baixasDeRua` | presidente, aposentados, ações do dia, calor da polícia e operações de assalto |
| Financeiro | `patrimonio`, `onibus`, `professorMMA`, `advogados`, `festas` (estoque de festas de arquibancada), `resumoMes`, `mesCorrente`, `ultimaSemana`, `ultimoFechamento`, `historicoSemanas` (60), `historicoMeses` (26), `caixaAberturaSemana`, `semanasNoVermelho`, `diasNoVermelho`, `caravanasPagas` (80), `inauguracao`, `estornoFestaFeito`, `festasAniversario` | capítulos 4 e 5 |
| Planejamento | `plano`, `planosExtra`, `padroes {casa, fora}`, `padraoRecepcao`, `politicas {jogo, outros, apoio, pixo}`, `investidas`, `ataqueMarcado`, `viagem`, `botes`, `bairrosMes` | capítulo 7 e 9 |
| Feed e rede social | `feedSeq`, `mensagens` (300), `mensagensAgendadas`, `feedPrefs`, `feedDepoisDoJogo`, `loteBrigas`, `reuniao {pauta, seq, ultima}`, `statusRel {visto, recusa, ultima}`, `dividas`, `brigasCom`, `nossasBrigas` (40), `brigasMemoraveis` (120), `brigasNossasTotal`, `treguas`, `tbtUsados` (200), `zoeiraSemana`, `brigasNoFeedAte`, `lazerPendente`, `protestos`, `titulosNoFeed`, `nossaFotoNoFeed`, `obrasDaCidade` (12), `baresQuebrados` (6), `veredictosVistos`, `aberturasVistas`, `campeoesVistos`, `entrevistaUltimas`, `dicaSeq`, `penaltisPendente`, `tutorial {feito, pulou}` | capítulo 9 |
| Mundo (fora do escopo desta parte) | `mundoTorcidas` (estado de cada torcida da IA), `relacoesDelas`, `marcaAjuda`, `marcaHostil`, `repeticoes`, `tentativas`, `brigasIA`, `brigasIATotal`, `brigasAno`, `dominio`, `eixos`, `elencos`, `ligas`, `ligasHistorico`, `conmebol`, `conmebolHistorico`, `conmebolCampeoes`, `vagasConmebol`, `divisoes`, `regionais`, `investimento`, `torcedoresEv`, `almanaque`, `fotoMes`, `convitesIA`, `titulosIA` | competições, relações, domínio dos bairros, eixos de aliança, almanaque |
| Só dos protótipos | `desenv`, `influencia` | capítulo 10 |
| Fora do save | `vaga` (de qual vaga veio; gravado em memória na carga), `ruas` (campo antigo, sempre descartado ao gravar) | — |

### 1.4 O relógio

- `E.data = {ano, semana, dia, absoluto}`. **Dia** vai de 1 (segunda) a 7 (domingo). **Semana** de 1 a `SEMANAS_ANO` (52). O **ano do jogo tem 52 semanas = 364 dias**. `absoluto` conta dias desde o começo e nunca zera.
- Data de parede: semana 1, dia 1 = **segunda-feira, 5 de janeiro de 2026** (`BASE`). `dataDaSemana(ano, semana, dia)` soma `(ano − 2026) × 364 + (semana − 1) × 7 + (dia − 1)` dias à base; `semanaDiaDe(data)` faz o inverso; `dataTexto` devolve `dd/mm/aaaa` e o nome do dia.
- "Mês" não é unidade do relógio: o financeiro e a reunião olham o **calendário de parede** (dia 1º para mensalidade e fechamento; dia 5 para a reunião).
- `DIA_JOGO: 6` é só o padrão; o dia real de cada jogo vem da agenda.

**Ritmo na tela** (`main.js: rodarTempo`): o tempo anda sozinho. Com mensagem na fila, solta uma por vez — 1.500 ms antes de uma decisão, 500 ms entre informações; sem mensagem, passa um dia a cada 120 ms; tudo dividido pela velocidade (2×). Decisão sem resposta **trava** o tempo. Painel aberto, cena e tutorial pausam.

### 1.5 Os dois modos de jogo

Escolhidos na criação, gravados em `E.modo`, imutáveis. `TO.estado.rapido(E)` responde se é o rápido. Save sem o campo vira `detalhista`.

| | Modo rápido (`rapido`) | Modo completo (`detalhista`) |
|---|---|---|
| Reunião mensal da diretoria | **não há**: as pautas do mês são criadas e chegam uma por dia como mensagem (`pautaSoltaDeHoje`) | **há**: no dia 5 chega a decisão "Reunião da diretoria" com todas as pautas |
| Pauta "Onde a gente recruta" | não é criada | criada todo mês |
| Bote a bar / resenha rival | chega como sugestão para **agora**, com botão "Deixar quieto" | é marcado na reunião para um dia do mês; no dia chega o cartão |
| Convites de aniversário de aliadas | mensagem `convites` com peso de decisão | pauta da reunião + mensagem `convites` informativa |
| Assalto | planejado e executado no mesmo dia (sem escolher data) | escolhe-se um dia entre 2 e 14 dias à frente |
| Pedido a aliado (diplomacia) | um por mês, na aba Alianças | um por reunião |
| Mapa | abre no mapa do Brasil; a lista da cidade não mostra os bairros | abre na cidade, com bairros e domínio |
| Calendário | não mostra a data da reunião | mostra |
| Domínio dos bairros e brigas de bairro | **ligados** (`dominio.js: rapido = () => false` — "o domínio vale nos dois modos") | ligados |
| Pixação e ação social no bairro | (desligadas nos dois modos: `dominio.js: pixar` e `social` devolvem `ok:false`) | (desligadas) |

O texto de seleção ainda descreve o rápido como "sem reunião mensal" e o detalhista como "a cidade em bairros"; o comentário de `estado.js` que fala em "sem domínio" no rápido está superado pelo código.

### 1.6 O jogo da semana

- `sortearProximoJogo(E)`: pega da agenda (`competicoes.jogoDaSemana`) o jogo do nosso clube na semana. Sem jogo: `proximoJogo = null`, `postura = 'folga'`.
- `fichaDoJogo(E, agenda)` monta: `competicao, fase, compId, rodada, rodadas, pontosCorridos, mata, dia, neutro, casa, mandante {nome, sigla, cores}, visitante, estadio, capacidade, hora` (padrão 21:00), `advId, mapaAdv, cidadeAdv, chave` (`ano-semana-adversário`).
- `conferirProximoJogo(E)` roda todo dia: se a agenda mudou o dia ou a hora do mesmo jogo, a ficha é refeita (o plano continua, pois a chave é por adversário); se o jogo saiu da semana ou entrou um novo, sorteia de novo.

### 1.7 O que acontece a cada dia (`avancarDia`), em ordem

1. `dia++`, `absoluto++`.
2. Dívida: `financeiro.venderLojaSeEndividado` (4.6).
3. **Se o dia passou de 7 — virada de semana** (1.8).
4. `E.acoes.usadas = 0`; roda o **expediente** do dia (6.1).
5. `membros.passarDia`: feridos e presos descontam um dia.
6. **Treino**: sorteia a fila e treina (3.7).
7. **Paz prolongada**: se passaram 20 dias desde a última briga (ou desde a última depreciação): prestígio −0,2, moral −0,5 e todo membro perde 0,2 de força e de defesa. Qualquer briga registrada zera o relógio.
8. **Véspera do jogo da semana** (`dia === dia do jogo − 1`): cobra a caravana (7.6) e chama `feed.emboscadaDaViagem` (hoje sem efeito: a emboscada sai pelo itinerário).
9. Guarda em memória (fora do save) a foto das competições "de antes do jogo" se o nosso clube joga hoje, para as telas não darem o resultado antes do apito.
10. `competicoes.jogarDia`: joga todos os jogos do dia. `conferirProximoJogo`.
11. **Resultado do nosso clube** (`resultadosDoClubeHoje`): cada jogo nosso de hoje → vitória moral +0,6, derrota −0,6, empate 0; grava `ultimoJogoClube` e a sequência. Título conquistado hoje → moral +2,5 (uma vez por competição/ano).
12. O mesmo para as torcidas da IA (`relacoes.resultadosDelasHoje`).
13. Ligas sul-americanas e copas da Conmebol (`ligas.rodar`, `conmebol.rodar`).
14. Brigas entre as IAs (`relacoes.brigasDeHoje`) e o dia do mundo (`relacoes.mundoDia`).
15. Domínio dos bairros (`dominio.dia`): ver 2.2.
16. **Eventos do feed** (`feed.eventosDoDia`): capítulo 9.
17. Avisa os ouvintes (`mudou`) e, se fechou semana, os ouvintes do fecho (a tela abre o relatório).

### 1.8 Virada de semana (dentro do passo 3), em ordem

1. `competicoes.jogarSemana`: recolhe jogos que sobraram e avança fases.
2. **Título fresco**: competição com campeão = nosso clube ainda não visto → abre `janelaRecruta {tipo:'titulo', ate: semanaAbs + 3}`.
3. `financeiro.fecharSemana` (4.4) — inclui o fechamento do mês quando a semana seguinte contém um dia 1º.
4. `dia = 1`, `semana++`.
5. **Se a semana passou de 52 — virada de ano** (1.9).
6. `competicoes.arrumarAgenda` (no máximo dois jogos por semana, três dias entre eles — fora do escopo) e depois `sortearProximoJogo`.
7. `relacoes.passarSemana`: economia das torcidas da IA, relações esfriam, ataques-surpresa da semana agendados.

### 1.9 Virada de ano, em ordem

1. `semana = 1`, `ano++`.
2. `membros.envelhecer` (3.11) e o envelhecimento das torcidas da IA.
3. `guardarTitulos`: empilha os campeões e vices do ano em `E.temporada.titulos` (até 800).
4. Para cada competição: efeitos de campeão e vice nas torcidas da IA; **vice do nosso clube → moral +0,8**; título nosso que ainda não pagou → moral +2,5.
5. Colheita do almanaque **antes** de zerar: foto das vagas da Conmebol, placar de brigas do ano, ranking do país, campeões.
6. `competicoes.evoluirForca` (força dos elencos; grava `elencoVirada` do nosso clube) e `aplicarSobeDesce` (acessos e rebaixamentos; guarda em `sobeDesceNoFeed`).
7. `mundo.evoluirTorcedores`: a torcida de cada clube nas cidades cresce ou encolhe.
8. Prêmios da virada (`almanaque.premiar`) e páginas da retrospectiva (`almanaquePendente`).
9. **Se o nosso clube subiu ou caiu**: acesso → moral +2, `recrutamento ×1,6 por 4 semanas`, `janelaRecruta 'titulo'` por 2 semanas; rebaixamento → moral −3, `×0,45 por 8 semanas`, `janelaRecruta 'rebaixamento'` por 2 semanas.
10. Monta a temporada nova e tira a foto do ano que começa.

### 1.10 Save e carga

- **Chaves no `localStorage`**: autosave em `torcida-organizada:save`; vagas do jogador em `torcida-organizada:vaga:1` … `:5`; cartão de cada vaga em `torcida-organizada:cartao:<vaga>`.
- **Seis vagas** (`VAGAS = ['auto','1','2','3','4','5']`). O autosave grava **sempre** na vaga `auto`; vaga numerada só muda quando o jogador manda salvar nela.
- **Cartão** da vaga: `nome, torcida, sigla, clube, ano, semana, dia, membros, quando` (data real ISO). A lista de vagas (`listarSaves`) usa os cartões e o tamanho em caracteres.
- **Quando salva**: `TO.estado.salvar()` é chamado pela tela depois de praticamente toda ação do jogador (responder mensagem, comprar, mudar plano…), ao sair para o menu e no `beforeunload` (modo síncrono).
- **Bloqueio**: `bloquear(true)` durante cena em tempo real; nesse estado `salvarEm` recusa ("aguarde chegar ao estádio").
- **O que é gravado** (`paraGravar`): o `E` inteiro em JSON, menos `ruas`; mensagens do feed com mais de **90 dias** perdem o anexo `dados` (ficam com `semAnexo: true`), exceto decisão ainda não respondida.
- **Compressão**: se o navegador tem `CompressionStream`, a vaga guarda `TO2z:` + base64 do gzip do JSON; a gravação é assíncrona e, com duas gravações seguidas, só a última escreve. Sem `CompressionStream` (ou no modo síncrono) grava o JSON cru. O modo síncrono pula se o estado é idêntico ao último gravado.
- **Falha**: cota estourada ou navegador que recusa → `{ok:false, motivo}` e aviso pelos ouvintes de `aoFalharSave`. `diagnostico()` testa se o armazenamento responde.
- **Carga** (`carregarDe(vaga)`, assíncrona): lê, descomprime conforme o prefixo (`TO2z:` gzip, `TO2j:` base64, ou JSON cru) e chama `adotar`. `saveMaisNovo()` devolve a vaga de cartão mais recente — é a que o "Continuar" abre.
- **Texto** (`paraTexto` / `deTexto`): o mesmo formato `TO2z:`/`TO2j:` para copiar e colar; aceita também JSON cru colado.
- **Arquivo** (`exportar` / `importar`): baixa `torcida-<nome>-s<semana>.json` com o `E` **completo** (com todos os anexos); `importar` exige apenas que o arquivo tenha `membros` e `data` (não confere versão).
- `apagarSave(vaga)` remove vaga e cartão. `existeSave()` diz se há save em qualquer vaga.

**Ao adotar um save** (`adotar` + `repararSave`), nesta ordem:

1. Troca no texto o clube "Rio Negro" (`rio-negro`) por "São Raimundo" (`sao-raimundo`).
2. Recusa se `versao !== 2`.
3. Reaplica a semente, liga as competições.
4. Poda de `relacoesDelas` os pares iguais ao valor inicial.
5. Garante presidente.
6. Remove da rede social os tipos de post extintos (chaves começando por `pixo`, `chegada`, `nosso-jogo`, `resultado`, `goleada-r`, `goleada-d`, `classico-d`, `queda`).
7. Apaga `E.lnt` e fecha sem efeito decisões abertas de `treta` e `lnt-treta` ("Esse assunto já passou").
8. Repara o domínio dos bairros e garante moradia dos membros.
9. Define `modo` se faltar.
10. Limpa a chave `'undefined'` de relações e devolve R$ 2.000 por cada cobrança errada "Presença na festa da undefined" (uma vez).

### 1.11 Portas de entrada no caixa e nos indicadores

- `lancar`, `lancarNoResumo`, `registrarLinha`: ver 4.1.
- `mexerIndicador(E, ind, delta, motivo)`: soma `delta` ao indicador, limita em 0–20 e grava no livro o delta **realmente aplicado** (ver capítulo 2).
- `anotar(E, msg)` está aposentada: só escreve no console.

## 2. Indicadores

Fonte: `estado.js: mexerIndicador`, e todos os pontos que a chamam (`membros.js`, `financeiro.js`, `acoes.js`, `planejamento.js`, `feed.js`), mais `dominio.js: dia` e `relacaoclube.js`.

### 2.1 Escalas

| Indicador | Onde mora | Escala interna | Na tela |
|---|---|---|---|
| Prestígio | `E.indicadores.prestigio` | 0–20 | 0–100 (×5, arredondado) |
| Moral | `E.indicadores.moral` | 0–20 | 0–100 (×5) |
| Dinheiro | `E.dinheiro` | reais, pode ser negativo | `R$` |
| Relação com cada torcida | `E.relacoes[id]` | −100 a +100 | igual |
| Relação com o clube | `E.relacaoClube` | 0–100 (nasce 50) | igual |
| Calor da polícia | `E.calorPolicia` | 0–100 | rótulo (tranquila / desconfiada / de olho / na cola) |
| Força e defesa do membro | ficha | 1 ao teto do cargo (máx. 20, +2 veterano) | igual |

- Todo movimento de prestígio e moral passa por `mexerIndicador`, que grava em `E.historicoIndicadores` (300 linhas) o delta real, com motivo — é o "livro" que a tela mostra item a item. Exceção: o efeito diário do domínio, que soma direto e lança **uma linha por semana**.
- Nas tabelas abaixo os valores estão na **escala interna (0–20)**; entre parênteses, o equivalente na tela.
- Faixas de leitura (0–20): até 4 Crítico, até 9 Baixo, até 14 Neutro, acima Alto.
- Status de uma relação: aliada a partir de **+20**; hostil a partir de **−15**; "quente" a partir de **−55** (`relacoes.js`).

### 2.2 Prestígio — o que sobe e o que desce

| Evento | Variação interna (tela) |
|---|---|
| Resultado de briga (qualquer cena) | prestígio da noite ÷ 5, limitado a ±4 por briga (±20); antes passa pelo fator do tamanho/peso da derrota (3.13). Na briga simulada o bruto é `limitar(round((caídos deles × 2 − caídos nossos × 1,5 − presos nossos × 2) / 3); −10; 10)` |
| Briga na arquibancada | vitória +0,6 / +0,4 / +0,2 (éramos menos / parelho / mais); derrota −0,2 / −0,4 / −0,6 |
| Briga de bairro | vitória +0,8 (+0,6 se "bobeira"); derrota −0,2 |
| Defender e segurar | +0,7 (+3,5) |
| Defender e perder, ou fugir | −0,7 × peso da derrota |
| "Ninguém desce" na briga de bairro contra nós | −0,7 |
| Tomar faixa de rival | +2,0 (+10) |
| Tomar bandeira de rival | +1,0 (+5) |
| Perder a nossa faixa | −4,0 × peso (−20) |
| Perder a nossa bandeira | −2,0 × peso (−10) |
| 20 dias sem briga | −0,2 (−1) |
| Campanha de doação por PIX | −0,2 (−1) |
| Furar aniversário de aliada | −0,4 (−2) |
| Deixar quieto um bote a bar/resenha | −0,2 (−1) |
| Vingança frustrada (perder atacando quem nos devia) | −1,0 (−5) |
| Encabeçar protesto no CT (assunto do clube) | +0,4 (+2) |
| Entrevista | de −0,2 a +0,6 conforme a resposta (9.6) |
| Domínio da cidade | +0,02 por dia (+0,1) para quem domina; −0,02 por dia para a 1ª e a 2ª maiores que não dominam (`dominio.js`) |

Efeitos do prestígio: fator comercial (até +0,4 no multiplicador de bar/loja/subsede); valor da doação de simpatizante; requisito de 12 (60) para abrir filial; ranking de torcidas (fora do escopo).

### 2.3 Moral — o que sobe e o que desce

| Evento | Variação interna (tela) |
|---|---|
| Vitória do clube em campo | +0,6 (+3) |
| Derrota do clube | −0,6 (−3) |
| Título do clube | +2,5 (+12,5) |
| Vice | +0,8 (+4) |
| Acesso / rebaixamento do clube | +2 (+10) / −3 (−15) |
| Resultado de briga | `moralTorcida` da cena × fator (briga simulada: +1 vitória, −1 derrota) |
| Briga na arquibancada | vitória +2 / +1 / +0,5; derrota −0,5 / −1 / −2 |
| Briga de bairro | ±0,8 (±0,6 se "bobeira") |
| Defender e segurar | +1,5 (+7,5) |
| Defender e perder, ou fugir | −3 × peso da derrota (−15) |
| "Ninguém desce" no bairro | −0,6 (−3) |
| Tomar faixa / bandeira | +1,0 / +0,6 |
| Perder faixa / bandeira | −3,0 × peso / −2,0 × peso |
| 20 dias sem briga | −0,5 (−2,5) |
| Caixa no vermelho | −1 por semana (−5) |
| Visita aos feridos | +0,3 (+1,5) |
| Recebidos por aliada fora de casa | +0,4 (churrasco) / +0,2 (hospedar, escolta) |
| Pressionar o clube (ação manual) | +0,8 se chegou / −1,2 se falhou |
| Deixar quieto um bote | −1 (−5) |
| Vingança frustrada | −1,0 (−5) |
| Festa de aniversário da torcida ou do clube | grande +2, simples +1, nada −2 |
| Veredicto da campanha | protestar +1,0; segurar −1,0; festa +1,0 |
| Segurar a torcida no protesto do CT | −0,6 (−3) |
| Entrevista | de −0,6 a +0,6 conforme a resposta |
| Domínio da cidade | ±0,02 por dia como no prestígio; e **−0,04 por dia (−0,2)** enquanto o bairro da nossa sede não for nosso |

Efeitos da moral: multiplicador da receita do comércio (0,4 a 1,3 — ver 4.2); vontade de viajar na caravana (+0,4 × moral/20); pontos de desenvolvimento no protótipo.

### 2.4 Dinheiro

Tudo o que mexe no caixa está no capítulo 4 (regulares), 5 (compras), 6 (ações, saques, assaltos), 7 (caravana, recepções) e 9 (festas, aniversários, veredicto). Caixa negativo: moral −1 por semana, lojas sem insumo, e venda forçada aos 30 dias.

### 2.5 Relação com outras torcidas

Valores da tabela `relacoes.js: REL` usados pelos arquivos desta parte (a "hostilidade" subtrai; os positivos somam):

| Evento | Variação |
|---|---|
| Atacar bar/sede e vencer | −20 |
| Briga de rua no dia de jogo | −18 |
| Atacar e perder | −17 |
| Defender e segurar | −15 |
| Defender e perder | −13 |
| Arquibancada (éramos menos / parelho / mais) | −13 / −12 / −11 |
| Briga de bairro, treta | −10 |
| Largar o aliado apanhando (escolta) | −9 |
| Rival marca ataque contra nós | −8 |
| Não receber aliada na cidade / aliada recusa receber | −7 |
| Furar aniversário | −6 |
| "Ninguém desce" no bairro | −6 |
| Churrasco e escolta | +20 |
| Hospedar e escoltar | +12 |
| Ir ao aniversário | +8 (R$ 2.000) |
| Hospedar | +7 |
| Reunião de diretoria | +6 |
| Entrevista ("aproximar") | ±5 ou ±10 |
| Presente de patrimônio | +50 |
| Trégua aceita / recusada | +15 / −5 |
| Aliada intermedeia (aproximação / paz / largar) | aceitar +3 com ela; recusar −3 |
| Aliada visita cidade onde temos subsede | +2 por semana |

Ganhos por caravana e por festa caem pela metade a cada repetição com a mesma torcida no mesmo ano (`ganhoRepetido`).

### 2.6 Relação com o clube

Ver 4.8 (faixas e efeitos). Movimentos: presença no estádio/caravana (+1 a +6), briga no dia de jogo (−4 a −10), protesto no CT (−8 ou +2), veredicto (−15), entrevista (−20 a +3; elogio só sobe até 70).

## 3. Membros

Fonte: `js/gestao/membros.js` (módulo `TO.membros`), com apoio de `financeiro.js` (advogado, MMA), `acoes.js` (recrutamento) e `elenco.js` (moradia).

### 3.1 A ficha de um membro

Criada por `membros.js: criar(E, opc)`:

| Campo | Tipo | Significado |
|---|---|---|
| `id` | inteiro | sequencial, tirado de `E.proximoId++` |
| `apelido` | texto | 60% de chance de ser o próprio nome; senão sai da lista de apelidos |
| `nome`, `sobrenome` | texto | do banco de nomes (`TO.dados.nomes`; clube de fora do Brasil usa `nomes.hispano`) |
| `cargo` | `novato` / `componente` / `frente` / `diretoria` | ver 3.2 |
| `forca`, `defesa` | inteiros | os dois atributos de luta |
| `fracForca`, `fracDefesa` | 0–1 | fração acumulada do treino; ao passar de 1 vira +1 no atributo |
| `idade` | inteiro | sorteada de 16 a 45 na criação |
| `xp` | inteiro | experiência; só serve de requisito de promoção e entra na fiança |
| `moral` | 12 | gravado, sem uso próprio (não confirmado que algo leia) |
| `arquetipo` | id | sorteado de `TO.dados.nomes.arquetipos` |
| `veterano` | bool | marca de quem "bateu no teto" sem vaga na Diretoria (+2 de teto) |
| `ferido` | `null` ou `{dias}` | dias restantes de molho |
| `preso` | `false`/`null` ou `{dias,total,motivo,desde}` | pena restante, pena total, motivo, dia absoluto da prisão |
| `olheiro` | bool | gravado como `false`; sem uso (não confirmado) |
| `naFila` | bool | está na fila de treino de hoje |
| `entrou` | `{semana,dia}` | quando entrou |
| `filial` | `null` ou id de cidade | membro do núcleo de uma subsede de outra cidade |
| `historico` | lista `{t,x}` | linhas da ficha (promovido, ferido, sequela, preso, volta, idade, aposentou, filial, presidente, advogado) |
| `presidente` | bool (opcional) | só o presidente tem |
| `desgaste` | número (opcional) | perda permanente acumulada (idade e sequelas); baixa o teto |
| `sequelas` | inteiro (opcional) | quantas sequelas já teve |
| `bairro` | id (opcional) | bairro onde mora (`elenco.js`, ver 3.15) |

Nome exibido (`nomeDe`): Diretoria aparece como "apelido sobrenome"; os demais só o apelido. `cargoNome` devolve "Presidente" para quem tem `presidente`.

### 3.2 Cargos, tetos e promoção

| Cargo | Teto de força/defesa | Mensalidade (R$/mês) | XP para subir | Força E defesa mínimas para subir | Custo da promoção | Ficha nova (força e defesa sorteadas) | XP inicial (jogo novo) |
|---|---|---|---|---|---|---|---|
| Novato | 8 | 20 | 40 | 8 | 0 | 3–8 | 0–30 |
| Componente | 12 | 50 | 100 | 12 | R$ 1.000 | 5–8 | 40–95 |
| Linha de Frente | 18 | 100 | 300 | 18 | R$ 5.000 | 10–13 | 100–290 |
| Diretoria | 20 | 100 | — | — | — | 14–17 | 300–500 |

- **Teto efetivo** (`tetoDe`): `max(1, teto do cargo + 2 se veterano − desgaste)`.
- **Promoção** (`podePromover` / `promover`): exige XP, força **e** defesa no mínimo do cargo atual, caixa para o custo; para virar Diretoria precisa haver vaga (`capDiretoria`, pela sede — ver 5.1). O custo sai por `estado.lancar`.
- **Veterano**: se a única trava for "Diretoria lotada" e o membro ainda não for veterano, `promover` o torna veterano: `forca += 2`, `defesa += 2`, teto +2. Não muda de cargo.
- No povoamento inicial os atributos são limitados ao teto do cargo.

### 3.3 Povoamento inicial e pirâmide

`povoarInicial(E, total, cargos, sedeNivel)`:

- `total` = `opc.efetivo` ou `membros` da torcida na fonte de dados, ou 34.
- Se a fonte traz `cargos` (`diretoria`, `frente`, `componentes`, `povao`), usa esses números; o que faltar para o total vira novato.
- Sem `cargos`: Diretoria `max(2, 5%)`, Frente 15%, Componente 30%, resto Novato.
- **Compensação da torcida pequena** (`compensarPequena`): a pirâmide é puxada para `Diretoria 12% / Frente 28% / Componente 35%` com peso `k`: `k = 1` até 25 membros; `k = 0` a partir de 150; entre os dois `k = ln(150/total) / ln(150/25)`. Cada cargo recebe `round(k × (alvo − atual))` a mais quando o alvo é maior. A Diretoria é cortada no teto da sede (o excedente vira Frente) e, se a soma passar do total, corta-se Componente, depois Frente, depois Diretoria.
- **Nível inicial da sede** (`nivelInicialDaSede`): torcida com até 30 membros começa no nível 0 (ponto de encontro); as demais no maior entre o `sedeNivel` da fonte (ou 1) e o primeiro nível (a partir de 1) cuja capacidade de membros e de diretores comporta a torcida.

### 3.4 Presidente

- `nomearPresidente(E, nome)`: escolhe o diretor de maior `forca+defesa` (desempate por XP); se não houver diretor, cria um (força 14, defesa 14, XP 400) no topo da lista. O nome digitado pelo jogador (até 28 caracteres) vira apelido/nome (primeira palavra) e sobrenome (resto). Idade menor que 26 é ressorteada entre 28 e 42. Grava `E.presidenteId`.
- O presidente **não se aposenta** (o corte dos 46 anos pula quem tem `presidente`), mas envelhece e sofre o desgaste da idade.
- `garantirPresidente` roda na carga de save antigo.

### 3.5 Capacidade (teto de membros)

Tabela `SEDE` de `membros.js` (índice = nível da sede):

| Nível da sede | Membros (matriz) | Diretores | Vagas de treino/dia |
|---|---|---|---|
| 0 (ponto de encontro) | 30 | 2 | 1 |
| 1 | 60 | 2 | 2 |
| 2 | 100 | 4 | 4 |
| 3 | 160 | 6 | 8 |
| 4 | 220 | 10 | 12 |
| 5 | 380 | 15 | 20 |
| 6 | 550 | 20 | 30 |

- `capacidadeMatriz(E)` = membros da tabela × 1,5 se houver campanha ativa (`E.campanha.ate >= semana`; nada nos arquivos lidos liga `E.campanha` — não confirmado).
- `capacidade(E)` = matriz + soma do teto de cada subsede de outra cidade (20 / 40 / 80 nos níveis 1/2/3).
- `aptosParaOEstadio(E)`: disponíveis (não feridos, não presos) **e** da matriz (`!m.filial`). `aptosDaFilial(E, cidade)`: disponíveis daquela filial.

### 3.6 Recrutamento

É a ação de expediente `recrutar` (`acoes.js`). Por turno em que roda:

1. `vaga = capacidade − membros`. Sem vaga ou sem base (torcedores do clube na cidade fora de organizada, `TO.mundo.baseDeRecrutamento`) a ação não roda.
2. Sorteio único `r`: `r < dois` → 2 novatos; `r < dois + um` → 1; senão 0 ("Ninguém quis entrar hoje").
3. As chances vêm do **regime** (`regimeRecrutamento`):

| Regime | Quando | Chance de 1 | Chance de 2 |
|---|---|---|---|
| `titulo` | janela `E.janelaRecruta` aberta por título ou acesso | 40% | 20% |
| `rebaixado` | janela aberta por rebaixamento | 0% | 0% |
| `ganhou` | o clube venceu o último jogo | 15% | 5% |
| `perdeu` | o clube perdeu o último jogo | 5% | 0% |
| `normal` | empate ou sem jogo | 10% | 5% |

4. As chances são multiplicadas pelo peso do bairro do recrutamento (`TO.dominio.pesoDoRecrutamento`, fora do escopo), com teto de 90% (um) e 50% (dois).
5. Cada novato custa **R$ 5** (lançado no extrato). Nasce como `novato` (força/defesa 3–8, idade 16–45).
6. Onde entra: sorteio ponderado pelas vagas entre a matriz e cada subsede de outra cidade que tenha vaga e base na cidade dela. `elenco.morarNoRecrutamento` dá ao novato o bairro escolhido como bairro de recrutamento.
7. Histórico em `E.historicoRecrutamento` (60 entradas).

A janela `E.janelaRecruta = {tipo, ate}` abre: por título do clube (`ate = semanaAbs + 3`, conferido na virada de semana), por acesso (`tipo:'titulo'`, +2 semanas) e por rebaixamento (`tipo:'rebaixamento'`, +2 semanas). Vale enquanto `semanaAbs < ate`.

Existe ainda `E.recrutamento = {mult, ate}` (`torcedores.js: abrirJanela`), aberto no acesso (×1,6 por 4 semanas) e no rebaixamento (×0,45 por 8 semanas); `torcedores.janela(E)` devolve o multiplicador, mas a ação de recrutar atual **não o lê** (desligado na prática). As constantes `MULT_SEDE`, `CAP_RECRUTA` e `REDUCAO` de `acoes.js` também não são usadas pela ação (mortas).

### 3.7 Treino

Automático, todo dia, sem botão (`estado.js: avancarDia` chama `sortearFila` e `treinarFila`):

- **Capacidade** (`capTreino`): `round(vagas da sede × multiplicador da área de treino)`; multiplicadores por nível da área de treino 0–4: ×1 / ×1,25 / ×1,5 / ×1,75 / ×2.
- **Fila** (`sortearFila`): zera `naFila` de todos; embaralha os disponíveis que ainda têm o que ganhar (abaixo do teto), depois os que já estão no teto; os primeiros `capTreino` entram.
- **Sessão** (`treinar`): `fracForca += U(0; 0,3) × fator` e `fracDefesa += U(0; 0,3) × fator`, sorteios independentes. `fator = ganho dos professores de MMA × 1,15 se houver padrinho de treino hoje`. Cada fração que chega a 1 vira +1 ponto, até o teto. Dá **+1 XP** (novato com padrinho: +2).
- **Professores de MMA** (`financeiro.js`): 0/1/2/3 professores → ganho ×1 / ×1,30 / ×1,60 / ×2,00. Máximo 3, limitado também pelo que a sede comporta (ver 5.8). R$ 2.000/mês cada.
- `planoDeTreino(m)` estima sessões restantes como `ceil(falta / 0,15)`.

### 3.8 Ferido

`ferir(E, m, dias, motivo)`:

- Dias de molho: o valor passado, ou sorteio **5–15** dias (sem enfermaria) / **3–9** dias (com enfermaria).
- Sai da fila de treino. Ferido continua pagando mensalidade (só preso não paga).
- **Sequela**: 15% de chance por ferimento. Tira de 0,06 a 0,15 de força e de defesa, **permanente** (soma em `desgaste`, baixa o teto) e conta em `m.sequelas`.
- `passarDia`: `ferido.dias--`; em 0, volta.
- A ação "Visita aos feridos" tira 2 dias de cada ferido.

### 3.9 Preso, advogado e fiança

`prender(E, m, dias, motivo)`:

- Pena: se `dias` vier (assalto), `min(360, dias)`; senão sorteio de 15 a 90 dias.
- **Advogados**: cada advogado contratado corta 10 dias da pena no ato da prisão (`corte = min(pena − 1, advogados × 10)`); a pena nunca cai abaixo de 1 dia.
- Preso não paga mensalidade, não treina, não está disponível.
- `passarDia`: `preso.dias--`; em 0 é solto.
- **Ferrugem da cadeia** ao sair (por qualquer via), conforme os dias efetivamente cumpridos (`total − restantes`): até 30 dias −0,15; até 60 −0,30; até 89 −0,45; 90 ou mais −0,60 de força e de defesa (não permanente: volta no treino). 0 dias cumpridos não tira nada.
- **Fiança / resgate** (`fianca`, `resgatar`): `round((800 + xp × 2) × (1 + diasRestantes/20))`. Paga pelo extrato; solta na hora (com a ferrugem).
- **Contratar advogado** (`patrimonio.js`, ação `advogado`): além do efeito nas prisões futuras, na contratação roda `aliviarPena(E, 10)`: todo preso perde 10 dias de pena; quem zera sai. Demitir não devolve dias.
- Limite de advogados pelo nível da sede (0→6): 0, 0, 1, 2, 4, 8, 12. R$ 5.000/mês cada, cobrados no fechamento do mês.

### 3.10 Perda de atributos (`perder`)

`perder(m, quanto, permanente)` tira `quanto` de força e de defesa: primeiro da fração; depois desce pontos inteiros (nunca abaixo de 1). Com `permanente`, soma em `m.desgaste`. Usos:

| Causa | Quanto | Permanente |
|---|---|---|
| 20 dias sem briga (todo mundo) | 0,2 | não |
| Idade ≥ 35, a cada virada de ano | 0,6 | sim |
| Sequela de ferimento (15%) | 0,06–0,15 | sim |
| Saída da cadeia | 0,15–0,60 | não |

### 3.11 Idade, aposentadoria e Velha Guarda

`envelhecer(E)` roda na virada do ano:

- Todos fazem +1 ano.
- Com **46 anos ou mais** (exceto o presidente) o membro sai de `E.membros` e entra em `E.velhaGuarda` (ficha resumida: id, nomes, cargo, idade, força, defesa, xp, veterano, sequelas, arquétipo, histórico, ano, entrou). Limite de 400 registros.
- De **35 anos em diante**, quem fica perde 0,6 de força e defesa, permanente.
- A Velha Guarda habilita a ação "Padrinho de treino" (6.2).

### 3.12 XP

- +1 por sessão de treino (+2 novato com padrinho).
- O que cada cena de briga devolver em `r.xp` por membro (`aplicarResultadoDaNoite`).
- XP não se perde e não sobe atributo: é requisito de promoção e componente da fiança.

### 3.13 Resultado de uma briga sobre os membros e indicadores

`aplicarResultadoDaNoite(E, res)`:

- Para cada membro do resultado: `preso` → `prender` (15–90 dias); `caido` → `ferir`; `entrou` → só conta. Soma o XP.
- **Fator do tamanho**: `limitar((mandante + visitante)/50; 0,4; 2)`.
- **Peso da derrota**: `limitar(nossos/deles; 0,25; 1)`.
- **Fator da perda**: `limitar(menorLado × 2/50; 0,4; 2) × pesoDaDerrota`.
- Prestígio da noite (régua de tela): positivo → `max(1, round(p × fator))`; negativo → `−max(1, round(|p| × fatorPerda))`; limitado a ±20. Aplicado ao indicador como `limitar(p/5; −4; 4)`.
- Moral: `moralTorcida × fator` (ou `× fatorPerda` se negativa).
- Entra em `E.historicoNoites` (`semana, prestigio, feridos, presos, entraram`).

### 3.14 Membros de filial

- `m.filial = idDaCidade`. Ao abrir uma subsede em outra cidade são destacados os **mais fracos** disponíveis da matriz: 1 diretor, 2 de frente, 5 componentes (os que existirem).
- Contam para o teto da filial, não da matriz. Não entram em `aptosParaOEstadio`.
- Se a filial fecha por dívida, voltam para a matriz (`filial = null`).

### 3.15 Onde mora cada membro (`js/mundo/elenco.js`)

`TO.elenco` dá um bairro a cada membro — nosso e das torcidas da IA — para as brigas de bairro saberem quem está onde.

- **Nossos**: `bairroDoNosso(E, m)` grava `m.bairro` (id do bairro) na primeira consulta. A cidade é a da filial do membro ou a da torcida. `garantirNossos(E)` roda na carga do save. `morarNoRecrutamento(E, m)`: novato da matriz mora no bairro de recrutamento do momento (`TO.dominio.bairroDoRecrutamento`).
- **Sorteio do bairro** (`sortearBairro`, determinístico por hash da chave): peso de cada bairro = `max(0,05; presença da torcida no bairro)` vezes:
  - bairro de referência (o da sede, na cidade-casa; o da filial, fora): ×4 em casa, ×6 fora;
  - fora de casa, vizinho do bairro da filial: ×2; demais bairros fora de casa: ×0,15;
  - em casa, mesma zona da sede: ×1,5.
- **IA** (`fila(E, tid, cid)`): a lista inteira da torcida naquela cidade é gerada por hash (não é salva), um membro por índice: cargo sorteado pela pirâmide da torcida (`membros.planoDeCargos(100, cargos)`), idade 16–45, bairro pelo sorteio acima, força e defesa pela faixa de ficha nova do cargo — ou, se a torcida tem "quadro" com média por cargo (`relacoes.quadroDe`), `média ± 1,5`, limitada de 1 ao teto do cargo. Tamanho: `membros` da torcida (em casa) ou da filial dela. A lista é refeita quando muda o tamanho, a semana ou o ano.
- `disponiveis(E, tid, cid)`: nossos = disponíveis da matriz (cidade-casa) ou da filial; IA = fração `disponíveis/total` da lista, escolhida por hash da semana.
- `maisFortes(E, tid, cid, max=20)`: os de maior força+defesa.
- `noBairro(E, tid, cid, bairro, max=15)`: moradores disponíveis do bairro, mais fortes primeiro; se forem menos que `min(3, max)`, completa até esse mínimo com gente de outros bairros da mesma zona.
- `moradores(E, cid, bairro)`: contagem de moradores por torcida.
- **Tamanho de um ataque**: `ataqueContra(nDef) = max(2, floor(nDef × 1,6))`; `ataqueSorteado(nDef, r)` sorteia entre `max(2, ceil(nDef × 0,7))` e esse teto.

## 4. Financeiro

Fonte: `js/gestao/financeiro.js` (`TO.financeiro`), `estado.js` (`lancar`, `lancarNoResumo`, `registrarLinha`), `relacaoclube.js`.

### 4.1 Como o dinheiro entra e sai

- `E.dinheiro` é o caixa (pode ficar negativo). Caixa inicial: ver 1.2.
- `estado.lancar(E, descricao, valor)`: mexe no caixa **e** grava linha em `E.transacoes` (`{dia:'semana/dia', descricao, valor}`, 200 linhas no máximo).
- `estado.lancarNoResumo(E, grupo, valor, conta)`: mexe no caixa na hora, **sem** linha no extrato; acumula em `E.resumoMes[grupo] = {rec, des, n}`. Grupos: `comercio`, `festa`, `pix`, `campana`, `padrinho`.
- `estado.registrarLinha`: só a linha, sem mexer no caixa (usada no fim do mês para resumir os grupos acima).
- Os valores de tabela são **mensais**; a cobrança é **semanal**, a ¼ do valor (`SEM = 1/4`), no fechamento de cada semana. Com 52 semanas no ano, cada valor de tabela é pago o equivalente a 13 vezes por ano.

### 4.2 Receitas

| Receita | Regra | Quando |
|---|---|---|
| Mensalidades | soma da mensalidade do cargo de cada membro **não preso** (Novato 20, Componente 50, Frente 100, Diretoria 100) — valor cheio, não ¼ | no fechamento da semana que contém o dia 1º de um mês do calendário (`semanaDaMensalidade`) |
| Bar | `RECEITA.bar[nível] × multiplicador do bairro × fator × ¼ × dano × corte do domínio` | toda semana |
| Loja | `RECEITA.loja[nível] × multiplicador do bairro × fator × ¼ × multiplicador do clube × corte do domínio`; loja `semInsumo` não fatura | toda semana |
| Subsede (bairro) | `660 × multiplicador do bairro × fator × ¼ × corte` | toda semana |
| Subsede em outra cidade | `660 × multFilial × fator × ¼ × corte` | toda semana |
| Doação de simpatizante | 10% de chance por semana: `round(200 + prestígio(0–20) × U(30; 90))` | fechamento da semana |
| Festa na sede | ação de expediente (6.2) | no turno |
| Campanha de PIX | ação de expediente (6.2) | no turno |
| Rateio da caravana | quando a frota zera o custo da estrada (7) | véspera do jogo fora |
| Saque de bar rival, assalto | ver 6 | no ato |
| Venda forçada da loja | R$ 90.000 (4.6) | 30 dias no vermelho |

Tabela de receita mensal por nível:

| Ponto | Nível 1 | Nível 2 | Nível 3 |
|---|---|---|---|
| Bar | 1.760 | 3.960 | 8.250 |
| Loja | 2.420 | 5.500 | 11.000 |
| Subsede (qualquer nível) | 660 | 660 | 660 |

Multiplicadores:

- **Fator comercial** (`fatorComercial`): `0,7 + (prestígio/20) × 0,4 + limitar(membros/150; 0; 1) × 0,3` → de 0,7 a 1,4.
- **Fator da moral** (`multMoral`/`faixaDaMoral`), com a moral na régua 0–100 (`moral × 5`): até 10 → 0,4; depois +0,1 a cada faixa de 10 (11–20 → 0,5; 21–30 → 0,6; …; 91–100 → 1,3).
- `fator = fatorComercial × multMoral`.
- **Multiplicador do bairro**: `TO.mundo.multiplicador(bairro)` (fora do escopo). Para filial, `multFilial` usa um bairro da cidade escolhido por hash (`torcida|filial|cidade`).
- **Dano do bar**: bar quebrado em ataque rende **metade por 45 dias** (`DANO_BAR`); `barMaisVisado` = o bar de maior nível é o que quebra.
- **Corte do domínio**: `TO.dominio.fator × TO.dominio.fatorTorcida` do bairro (fora do escopo; a nota da tela fala em "rende 15% menos" em bairro dominado por outra).
- **Multiplicador do clube na loja** (`relacaoClube.multLoja`): relação com o clube 51–75 → ×1,05; 76–100 → ×1,15 ("material oficial"); abaixo, ×1.

### 4.3 Despesas

| Despesa | Valor mensal | Cobrança |
|---|---|---|
| Manutenção da sede | nível 0: 0 · n1: 200 · n2: 480 · n3: 960 · n4: 1.800 · n5: 3.000 · n6: 5.000 | ¼ por semana |
| Manutenção de bar | n1 800 · n2 1.800 · n3 3.800 | ¼ por semana |
| Manutenção de loja | n1 600 · n2 1.300 · n3 2.600 (×0,5 com fábrica) | ¼ por semana |
| Manutenção de subsede / filial | n1 700 · n2 1.200 · n3 1.800 (subsede de bairro é sempre n1) | ¼ por semana |
| Insumos das lojas | 25% da receita **de tabela** da loja (`RECEITA.loja[nível] × 0,25`), ×0,5 com fábrica; não depende do faturamento real | ¼ por semana |
| Enfermaria | 1.200 | ¼ por semana |
| Galpão | 600 | ¼ por semana |
| Professor de MMA | 2.000 por professor | inteiro, na semana que fecha o mês |
| Advogado | 5.000 por advogado | inteiro, na semana que fecha o mês |
| Ônibus | 1.500 por ônibus | inteiro, na semana que fecha o mês; cada ônibus tem 1% de chance por mês de "manutenção séria" de R$ 15.000 |
| Caravana | ver 7 | véspera do jogo fora |
| Compromissos do planejamento | `TO.planejamento.compromissos` (7) — entram no relatório da semana como despesa "da gestão" | já pagos no ato; o fecho só os lista |
| Promoção, fiança, compras de patrimônio, bombas, festas de arquibancada, recrutamento (R$ 5/novato), campana (R$ 100/400 por dia), padrinho (R$ 150), festa na sede | ver capítulos 3, 5, 6, 8 | no ato |

"Manutenção do comércio" é uma linha só (bar + loja + subsedes + filiais). Receitas e despesas marcadas como comércio (`com:true`: bar, loja, subsede, filial, manutenção do comércio, insumos) entram pelo `lancarNoResumo('comercio')` — sem linha semanal no extrato.

### 4.4 Fechamento da semana (`fecharSemana`)

Roda na virada de semana (1.4). Em ordem:

1. Calcula `contas(E)` e monta o relatório `rel` (receitas, despesas, notas, `caixaAntes = E.caixaAberturaSemana`).
2. Lança receitas e despesas (comércio no resumo; o resto no extrato).
3. 10% de chance de doação de simpatizante.
4. Anexa os compromissos do planejamento ao relatório.
5. Marca cada loja `semInsumo = (caixa < 0)` — loja de caixa negativo não fatura na semana seguinte (aparece como nota "sem insumo").
6. **Caixa negativo**: `E.semanasNoVermelho++` e **moral −1** ("Caixa no vermelho"), toda semana enquanto durar. De volta ao azul: zera o contador.
7. Avisos das ações de expediente que falharam (`E.acoes.rotinaFalha`), que é zerado.
8. Conta os promovíveis; grava `caixaDepois`, `foraDaConta = (caixaDepois − caixaAntes) − saldo`; `E.caixaAberturaSemana = caixa`.
9. Se é a última semana do mês (`fimDoMes`: a semana seguinte contém um dia 1º): escreve no extrato as linhas-resumo do mês (comércio receitas; comércio manutenção e insumos; festas na sede com a contagem; doações por PIX; campana do olheiro; padrinho de treino) e zera `E.resumoMes`.
10. Na mesma condição cobra MMA, advogados e ônibus (com o sorteio da quebra de 1%).
11. Acumula a semana em `E.mesCorrente`; grava `E.ultimaSemana = rel`; se fim de mês, `rel.mes = fecharMes(E)`.
12. Empilha em `E.historicoSemanas` (60 entradas: semana, receita, despesa, saldo, caixa, saídas).

### 4.5 Fechamento do mês (`fecharMes`)

- O "mês" é o conjunto de semanas entre duas semanas que contêm um dia 1º.
- Monta o relatório mensal a partir de `E.mesCorrente` (receitas e despesas agrupadas por rótulo e ordenadas por valor, saldo, caixa antes/depois, `foraDaConta`, semanas, notas, total de compromissos).
- Grava `E.ultimoFechamento`, zera `E.mesCorrente`, empilha em `E.historicoMeses` (26 entradas).
- Não há cobrança própria do mês além das do item 10 acima.

### 4.6 Dívida e venda forçada (`venderLojaSeEndividado`)

Roda todo dia, no começo de `avancarDia`:

- Caixa ≥ 0 → `E.diasNoVermelho = 0`.
- Caixa < 0 → `E.diasNoVermelho++`. Ao chegar a **30 dias**:
  1. Vende a loja de **menor nível** (se houver) por **R$ 90.000**. O código soma o valor duas vezes — `E.dinheiro += 90000` e em seguida `lancar(..., 90000)` — então o caixa sobe **R$ 180.000** e o extrato mostra uma linha de R$ 90.000.
  2. Fecha até **3** unidades, sem receber nada: primeiro subsedes de bairro (as mais recentes), depois subsedes de outra cidade (a de menor nível primeiro; os membros dela voltam para a matriz).
  3. Se não havia loja nem subsede, nada acontece e o contador segue subindo.
  4. Zera `diasNoVermelho` e propõe ao feed um `aviso` da diretoria ("30 dias no vermelho…").
- Além disso: moral −1 por semana no vermelho (4.4) e lojas sem insumo.

Não há juros, empréstimo nem fim de jogo por dívida nestes arquivos.

### 4.7 Cortes

Neste módulo, "corte" aparece em quatro sentidos, todos multiplicadores:

| Corte | Efeito |
|---|---|
| Corte do domínio (`corte(cid, bairro)`) | reduz a receita do ponto em bairro de outra torcida |
| Dano do bar | ×0,5 por 45 dias após ataque perdido |
| Fábrica | ×0,5 em manutenção e insumo das lojas |
| Advogado | −10 dias de pena por advogado |

Não existe tela de "cortar gastos" no código lido: o que o jogador pode desligar para economizar é dispensar professor de MMA e demitir advogado (5.8).

### 4.8 Fator Torcida e relação com o clube

- **Fator Torcida** (`competicoes.js: fatorDoJogo`): pontos somados à força do mandante na simulação do placar, numa régua cujo divisor é 55. Só duas fontes do jogador:
  - **Bateria**: se a ação "Treino de bateria" rodou nos últimos 7 dias (`abs − E.bateriaAbs <= 7`) e o nosso clube é o mandante: `55 × 0,20 = +11` pontos.
  - **Festas de arquibancada** (capítulo 8): `55 × soma dos percentuais`; a favor do nosso clube em casa ou fora.
  - As torcidas da IA também somam as festas delas (`relacoes.festasDelasNoJogo`).
- **Relação com o clube** (`E.relacaoClube`, 0–100, nasce em 50; `relacaoclube.js`):

| Faixa | Rótulo | Ingressos cedidos (% dos membros) | Bônus da loja | Abate da caravana |
|---|---|---|---|---|
| 0–25 | ruim | 0 | 0 | 0 |
| 26–50 | morna | 10% | 0 | 0 |
| 51–75 | boa | 30% | +5% | 0 |
| 76–100 | ótima | 60% | +15% | 20% |

  - Ingresso vale R$ 10 (`PRECO_INGRESSO`): `ingressosDoJogo` = `round(membros × pct)` ingressos.
  - Presença: em casa, mais de 80% dos membros no estádio → +2; fora, mais de 60% na viagem → +6; mais de 40% → +4; mais de 20% → +1.
  - Briga: nos arredores −6 (casa) / −4 (fora); na arquibancada −10 (casa) / −6 (fora).
  - `E.sequenciaClube`: últimos 8 resultados (`V`/`E`/`D`); "sequência ruim" = 3 ou mais derrotas nos últimos 5.
  - Histórico em `E.relacaoClubeHistorico` (200).
- Existe um segundo registro, `E.clube = {relacao:50, cobranca}`, usado só pela ação manual "Pressionar o clube" (6.3); ele não conversa com `E.relacaoClube`.

### 4.9 Postura e caravana (resumo; detalhe no capítulo 7)

- `postura(E)`: sem jogo → `folga`; jogo fora em outra cidade → `viajar`; senão `estadio`.
- `precisaCaravana`: jogo fora, em cidade (`mapaAdv`) diferente da nossa.
- `diasDeCaravana(E)`: véspera e dia seguinte de cada jogo fora (não neutro) em outra cidade — nesses dias e no dia de jogo do clube o expediente não roda.
- `cobrarCaravana`: na véspera do jogo; uma vez por jogo (`E.caravanasPagas[chave]`, 80 chaves). Valor = custo estimado pelo planejamento (ou R$ 3.000 sem estimativa) menos o abate do clube (20% na relação ótima). Se o custo deu zero e há rateio (rota que não é de avião), o rateio **entra** como receita.

## 5. Patrimônio

Fonte: `js/gestao/patrimonio.js` (`TO.patrimonio`), `financeiro.js` (tetos e mensalidades), `membros.js` (capacidade).

Estado: `E.torcida.sedeNivel` (0–6) e `E.patrimonio = {bares:[], lojas:[], subsedes:[], filiais:[], fabrica:false, itens:{}, enfermaria?, galpao?, cofre?, areaTreino?, faixas?, barGratisDado?}`. Fora dele: `E.onibus`, `E.professorMMA`, `E.advogados` (`{desde, n}`), `E.estoque.bombas`, `E.festas`.

Toda compra passa por `comprar(E, id)` → `comprarSemPost`; se der certo, o feed publica um post da "nossa casa" (`feed.nossaCasaNoFeed`). A lista do que se pode comprar é `opcoes(E)`; cada opção tem `custo`, `trava` (motivo que impede) e `natureza` (aba: `material`, `sede`, `pontos`, `filiais`, `aliados`, `pessoal`, `frota`). Trava padrão: "falta caixa" quando `E.dinheiro < custo`.

### 5.1 Sede

| Nível | Custo para chegar | Membros | Diretores | Treino/dia | Manutenção/mês | Bares (qtd / nível máx.) | Lojas (qtd / nível máx.) | Subsedes de bairro | Filiais (outra cidade) | Ônibus / professores de MMA | Advogados |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 (ponto de encontro) | — | 30 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 30.000 | 60 | 2 | 2 | 200 | 1 / n1 | 0 | 0 | 0 | 0 | 0 |
| 2 | 40.000 | 100 | 4 | 4 | 480 | 1 / n1 | 1 / n1 | 1 | 0 | 1 | 1 |
| 3 | 100.000 | 160 | 6 | 8 | 960 | 1 / n2 | 1 / n2 | 2 | 1 | 2 | 2 |
| 4 | 200.000 | 220 | 10 | 12 | 1.800 | 2 / n2 | 2 / n2 | 5 | 3 | 2 | 4 |
| 5 | 400.000 | 380 | 15 | 20 | 3.000 | 2 / n3 | 2 / n3 | 8 | 8 | 3 | 8 |
| 6 | 1.000.000 | 550 | 20 | 30 | 5.000 | 3 / n3 | 3 / n3 | 12 | 12 | 4 (ônibus) / 3 (MMA) | 12 |

- **Nível 0** é o "ponto de encontro" (torcidas de até 30 membros começam nele): sem manutenção, sem ponto comercial, sem festa na sede, e o expediente só tem o turno da **tarde** (`acoes.turnos`). "Construir a sede" (R$ 30.000) leva ao nível 1.
- Subir de nível grava `E.inauguracao = {tipo:'sede', nivel, quando, contada:false}` (o feed usa para a inauguração).
- **Bar grátis**: na primeira vez que `financeiro.patrimonio(E)` roda com sede ≥ 2 e nenhum bar, a torcida ganha um bar nível 1 (`gratis:true`) num bairro fora da zona da sede, escolhido por hash; `barGratisDado` impede repetir.
- Sede em bairro dominado por outra torcida: a festa na sede rende 15% menos (nota da tela; o fator vem de `TO.dominio.fator`).

### 5.2 Bar, loja e subsede de bairro

| Ponto | Compra | Ampliar n1→n2 | Ampliar n2→n3 | Receita/mês n1/n2/n3 | Manutenção/mês n1/n2/n3 |
|---|---|---|---|---|---|
| Bar | 40.000 | 60.000 | 120.000 | 1.760 / 3.960 / 8.250 | 800 / 1.800 / 3.800 |
| Loja | 50.000 | 70.000 | 140.000 | 2.420 / 5.500 / 11.000 | 600 / 1.300 / 2.600 (+ insumo de 25% da receita de tabela) |
| Subsede (bairro) | 90.000 | — | — | 660 | 700 |

- Quantidade e nível máximo pelo nível da sede (tabela 5.1). Travas: "a sede não comporta mais"; "sede nível N não comporta X nível Y".
- **Bairro**: o jogador escolhe o bairro na compra (`comprar:tipo:bairro`); sem escolha vai para um bairro por hash. A lista (`bairrosParaAbrir`) ordena: bairro padrão, bairros nossos, sem dona, de outra, e por último os que rendem 15% menos; mostra dona, força (de 7), fatia da torcida do clube e multiplicador.
- **Ampliar** sempre sobe o ponto de **menor nível** daquele tipo.
- Comprar avisa o domínio (`TO.dominio.estrutura`) e registra obra no feed (`feed.registrarObra`). Subsede nova grava `E.inauguracao = {tipo:'subsede', bairro}`.
- Receita real: ver fórmulas em 4.2.

### 5.3 Subsede em outra cidade (filial)

| Item | Valor |
|---|---|
| Compra | R$ 90.000 |
| Ampliar | n1→n2 R$ 70.000 · n2→n3 R$ 140.000 |
| Teto de membros do núcleo | n1 20 · n2 40 · n3 80 |
| Quantas a sede banca | sede 3: 1 · sede 4: 3 · sede 5: 8 · sede 6: 12 |
| Requisitos | sede nível 3 ou mais **e** prestígio ≥ 12 (60 na tela) |
| Receita / manutenção | 660/mês × multiplicadores · 700 / 1.200 / 1.800 por mês |

- Cidades candidatas (`cidadesCandidatas`): cidades com torcedores do nosso clube (`TO.mundo.torcedoresDoClubeNa > 0`), sem filial nossa e que não sejam a nossa cidade; ordenadas por número de torcedores.
- Ao abrir: `p.filiais.push({cidade, nivel:1, faixa:true})`; destaca da matriz os mais fracos disponíveis (1 diretor, 2 de frente, 5 componentes); grava `E.inauguracao`.
- O núcleo recruta, defende e ataca na cidade dele (texto da opção; mecânica em `dominio.js`/`feed.js`).
- **Faixa da subsede**: cada filial tem uma faixa própria ("NOME DA TORCIDA + CIDADE"; nome com mais de 16 letras vira sigla). Se for tomada (`faixa:false`), a opção "Faixa nova pra uma subsede" repõe por R$ 5.000. Filial da IA que perde a faixa a recupera sozinha em 28 dias (`faixaDe`).

### 5.4 Anexos da sede

| Anexo | Custo | Mensalidade | Sede mínima | Efeito |
|---|---|---|---|---|
| Enfermaria | 150.000 | 1.200 | 4 | ferido volta em 3–9 dias em vez de 5–15 |
| Galpão de material | 150.000 | 600 | 3 | bomba 15% mais barata (R$ 340); saque sofrido no nosso bar ×0,7 |
| Cofre blindado | 300.000 | 0 | 5 | saque sofrido ×0,5 |
| Fábrica | 400.000 | 0 | 5 | corta 50% da manutenção e do insumo das lojas |
| Área de treino n1 / n2 / n3 / n4 | 100.000 / 200.000 / 500.000 / 1.000.000 | 0 | n4 exige sede 6 | +25% / +50% / +75% / +100% de vagas de treino por dia |

- Galpão e cofre acumulam (`protegerPerda`: ×0,7 e depois ×0,5 → 35% do prejuízo).
- Cada anexo é comprado uma vez; a área de treino sobe um nível por compra.

### 5.5 Ônibus

- R$ 100.000 cada; R$ 1.500/mês por ônibus (fim do mês); 1% de chance por ônibus por mês de oficina de R$ 15.000.
- Máximo 4 (`ONIBUS_MAX`), limitado pela garagem da sede: níveis 0–6 → 0, 0, 1, 2, 2, 3, 4.
- Desconto na caravana de estrada: 1 ônibus 30% · 2 ônibus 60% · 3 ônibus 100% · 4 ônibus 100% e +10% da torcida topa a caravana (`VONTADE_ONIBUS4`). Rota de avião continua paga. Com frota cheia o rateio dos passageiros vira receita (capítulo 7).

### 5.6 Faixas e bandeiras

| Item | Custo | Ao tomar a de um rival | Ao perder a nossa |
|---|---|---|---|
| Faixa | 5.000 | prestígio +10 e moral +5 (tela) → +2,0 e +1,0 no indicador | prestígio −20 e moral −15 (tela) × peso da derrota (mín. 0,5) |
| Bandeira | 2.000 | prestígio +5, moral +3 (tela) | prestígio −10, moral −10 (tela) × peso |

- Estado: `E.patrimonio.faixas = {nossas:[{n, desde}], tomadas:[{de, nome, quando, variante}], bandeiras:{nossas, tomadas}}`. Todo jogo começa com 1 faixa e 1 bandeira.
- A faixa é a que a torcida expõe quando é atacada; a bandeira (quadrada, com o escudo) sai no lugar da faixa no bar e na concentração e junto dela no estádio.
- Quem toma a nossa ganha o espelho: a rival ganha `+ganho` e nós perdemos `perda`; quando tomamos, a rival perde `perda/5` de prestígio e `moralPerda/5` de moral (`acoes.js: aplicarFaixa`). Faixa perdida sai de `nossas` (a última); a da subsede marca `filial.faixa = false`.
- A arte: há faixa real em tira de imagem para algumas torcidas (`TO.dados.faixasReais`, `img/faixas/<id>.webp`, 128 px de altura por variante); as demais são geradas em canvas (400×100, cores da torcida, escudo da torcida à esquerda e do clube à direita, dizer em Barlow Condensed) e "onduladas" em 100 fatias. Os dizeres possíveis: o nome; "DESDE <ano>" (se há fundação); "SEMPRE COM O/A <MASCOTE>". A bandeira é 200×200 com o escudo (ou a sigla).

### 5.7 Bombas

- R$ 400 cada (R$ 340 com galpão). Vendidas em caixa de 5 na loja de patrimônio (**a caixa cobra `5 × 400` mesmo com galpão**; o desconto só vale em `comprarBombas`, usada pelo planejamento).
- Estoque em `E.estoque.bombas`; jogo novo começa com 4.

### 5.8 Pessoal contratado

| Contrato | Custo | Limite | Efeito |
|---|---|---|---|
| Professor de MMA | sem taxa de contratação (só exige ter R$ 2.000 em caixa); R$ 2.000/mês cada | 3, e o que a sede comporta (0, 0, 1, 2, 2, 3, 3) | treino ×1,30 / ×1,60 / ×2,00 |
| Advogado | sem taxa de contratação (exige R$ 5.000 em caixa); R$ 5.000/mês cada | pela sede: 0, 0, 1, 2, 4, 8, 12 | −10 dias de pena por advogado em toda prisão nova; na contratação, −10 dias para todos os presos |

Dispensar/demitir é grátis e imediato; a mensalidade para no fechamento seguinte.

### 5.9 Presente a um aliado

- Opção "Dar uma melhoria de presente a um aliado": só aparece destravada se houver aliado (relação ≥ 20, `TO.eixos.aliadosNossos`).
- Presentes: ampliar a sede dele (preço da tabela de sede, pelo nível dele), abrir loja (50.000), abrir bar (40.000), abrir subsede em outra cidade (90.000). Valem as mesmas travas de teto da sede **dele**.
- Efeito: o patrimônio é dele; a relação conosco sobe **+50**.

### 5.10 Tela de patrimônio (`linhas`)

Uma linha por item com receita e despesa mensais já com os multiplicadores do momento: sede, anexos, área de treino, cada bar (com dias de dano), cada loja (com "sem insumo"/"fábrica"), cada filial (núcleo/teto), cada subsede, ônibus, professores, advogados.

## 6. Ações e expediente

Fonte: `js/gestao/acoes.js` (`TO.acoes`), `estado.js: rodarExpediente`.

### 6.1 O expediente da sede

- Três turnos por dia: **manhã, tarde, noite** (`TURNOS`). Sede nível 0 só tem a **tarde**.
- `E.expediente = {manha, tarde, noite}` guarda o id da ação de cada turno. É uma **rotina**: fica valendo todo dia até o jogador trocar.
- A cada virada de dia, `rodarExpediente` executa as ações dos turnos em ordem. **Não roda** em dia de jogo do clube nem em dia de caravana (véspera e dia seguinte de jogo fora em outra cidade); nesses dias grava uma linha "Expediente de folga: …".
- Só ações **não manuais** podem ir para o expediente (`agendaveis`). Ação que falha (sem caixa, sem requisito) é registrada em `E.acoes.rotinaFalha` e vira aviso no fechamento da semana.
- Histórico: `E.acoes.feitas` (últimas 60: semana, dia, id, msg, ok).
- `E.acoes.usadas` é zerado todo dia; `restantes(E) = nº de turnos − usadas`. Hoje só as investidas do planejamento consomem esse contador (as ações do expediente não o incrementam).

### 6.2 Ações agendáveis no expediente

| Id | Nome | Custo | Requisito | Efeito |
|---|---|---|---|---|
| `recrutar` | Recrutar | R$ 5 por novato que entrar | haver vaga e base de torcedores | sorteio de 0, 1 ou 2 novatos conforme o regime (3.6) |
| `festa` | Festa na sede | por nível da sede 1–6: 170 / 300 / 500 / 600 / 1.100 / 1.500 | sede ≥ 1 e caixa | receita = `round(aptos da matriz × U(4,8; 6,4) × corte do domínio no bairro da sede)`; custo e receita vão ao grupo `festa` do resumo do mês. Ponto de equilíbrio `ceil(custo/4,8)` presentes: 36 / 63 / 105 / 125 / 230 / 313 |
| `visita` | Visita aos feridos | grátis | haver ferido | cada ferido sara 2 dias antes; **moral +0,3** (o texto da ação diz "+1,5", que é o mesmo valor na régua de tela) |
| `pix` | Campanha de doação por PIX | grátis | 3 disponíveis | arrecada `round(disponíveis × U(8; 15))`; **prestígio −0,2** (−1 na tela) |
| `padrinho` | Padrinho de treino | R$ 150 | haver alguém na Velha Guarda | uma vez por dia: o treino do dia rende +15% e novato ganha 2 XP por sessão (`E.padrinhoAbs`) |
| `bateria` | Treino de bateria | grátis | 6 aptos na matriz | marca `E.bateriaAbs`; por 7 dias o nosso clube joga em casa com +11 pontos (20% da régua de 55) |
| `inteligencia` | Inteligência | R$ 100/dia | caixa | `E.campana = {nivel:1, pagoAbs}`: o olheiro tem 50% de chance de prever emboscada ou ataque |
| `inteligencia2` | Inteligência ×2 | R$ 400/dia (R$ 300 se a simples já foi paga hoje) | caixa | `E.campana.nivel = 2`: o olheiro crava todos os ataques |
| `reuniao` | Reunião de diretoria | grátis | 2 diretores disponíveis e alguma relação acima de −70 | **+6** de relação com a torcida de **maior** relação atual; marca ajuda |

Como rodam no dia seguinte ao agendamento e todo dia depois, o custo é diário por turno ocupado.

### 6.3 Ações manuais (fora do expediente)

| Id | Nome | Requisito | O que faz |
|---|---|---|---|
| `atacar` | Atacar bar ou sede rival | 6 aptos na matriz; 1 ataque por semana (`E.acoes.ultimoAtaqueManual`); haver alvo no mapa | abre a cena de briga (`cena:'bar'`, `acao:'atacar'`) |
| `pressionar` | Pressionar o clube | 6 aptos; `E.clube.relacao > 5`; sem cobrança ativa | abre a cena do CT (`efetivoRival: 10`) |

**Atacar bar ou sede** (`alvosDeAtaque`, `fecharAtaque`):

- Alvos: pinos `sede` e `bar` de outras torcidas no mapa da nossa cidade, ordenados da pior relação para a melhor.
- Defensores no alvo: `max(4, round(efetivo de pé do rival × 0,35))`; em bar, no máximo 40.
- **Vitória**:
  - Bar: saque = `60 × limitar(defensores; 4; 40) + 22% do caixa deles`; ×0,7 se eles têm galpão; ×0,5 se têm cofre. O dinheiro sai do caixa deles e entra no nosso extrato. O bar deles (o de maior nível) fica quebrado: metade da receita por 45 dias.
  - Moral deles −3.
  - Relação −20 (`ataqueGanho`); prestígio deles −0,6.
- **Derrota**: relação −17 (`ataquePerdido`); prestígio deles +0,4.
- Nosso prestígio e moral vêm do resultado da briga (3.13).

**Pressionar o clube** (`fecharPressao`): chegando ao gramado, `E.clube.relacao −18` e moral +0,8; falhando, −28 e moral −1,2. Trava nova cobrança por 4 semanas. (Esse registro `E.clube` é separado de `E.relacaoClube`; ver 4.8.)

### 6.4 Fechamento das cenas de briga (`fecharCena`)

O motor da cena (fora do escopo) devolve `res`; `fecharCena(E, ctx, res)` despacha por `ctx.acao`:

| `acao` | Função | Efeitos além dos da briga em si |
|---|---|---|
| `atacar` | `fecharAtaque` | ver 6.3 |
| `pressionar` | `fecharPressao` | ver 6.3 |
| `defender` | `fecharDefesa` | ver abaixo |
| `bairro` | `fecharBairro` | ver abaixo |
| `estadio` | `fecharEstadio` | ver abaixo |

**Defesa** (`fecharDefesa`; alvo `bar`, `sede`, `concentracao`, `pista`, `emboscada`…):

- **Perdemos**: moral `−3 × peso da derrota`, prestígio `−0,7 × peso`. Se o alvo era o bar: perda = `60 × limitar(nossos defensores; 4; 40) + 22% do nosso caixa (se positivo)`, protegida por galpão (×0,7) e cofre (×0,5); o nosso bar de maior nível fica quebrado 45 dias. Relação −13; a rival ganha moral +0,8 e prestígio +0,6.
- **Seguramos, mas levaram faixa/bandeira nossa**: sem bônus.
- **Seguramos**: moral +1,5, prestígio +0,7. Relação −15; a rival perde moral −1,0 e prestígio −0,5.
- Emboscada na estrada grava `E.viagem` (se seguramos, embarcados, feridos).

**Briga de bairro** (`fecharBairro`): peso 4 (ou 3 se `tipo:'bobeira'`). Vitória: prestígio `+peso/5`, moral `+peso/5`; a rival perde prestígio 0,2 e moral `peso/5`. Derrota: prestígio −0,2, moral `−peso/5`; a rival ganha prestígio `peso/5` e moral `peso/5`. Relação −10 (`treta`).

**Briga na arquibancada** (`fecharEstadio`), pela diferença `nossos − deles`:

| Situação | Vitória (prestígio tela / moral) | Derrota (prestígio tela / moral) | Relação |
|---|---|---|---|
| Éramos 11+ a menos | +3 / +2 | −1 / −0,5 | −13 |
| Parelho (diferença até 10) | +2 / +1 | −2 / −1 | −12 |
| Éramos 11+ a mais | +1 / +0,5 | −3 / −2 | −11 |

(prestígio da tabela é dividido por 5 ao entrar no indicador.)

**Briga de rua no dia de jogo** (`fecharBrigaDeRua`): relação −18 (`briga`); prestígio da rival −0,4 se ganhamos, +0,4 se perdemos.

**Faixa e bandeira** (`aplicarFaixa`): ver 5.6.

Todos os fechamentos registram o confronto no feed (`feed.registrarConfronto`).

### 6.5 Assaltos

Dois caminhos convivem:

**a) Assalto planejado** (o atual: `planejarAssalto` → no dia, `simularAssalto` ou a cena jogável → `fecharAssalto`).

Alvos (`ASSALTOS`):

| Alvo | Efetivo (pequeno / grande) | Butim pequeno | Butim grande | Chance-base de polícia | Pena (dias) | Gente dentro (peq./gr.) |
|---|---|---|---|---|---|---|
| Banco | 10 / 20 | 30.000–50.000 | 60.000–120.000 | 50% | 180 | 6 / 8 |
| Joalheria | 10 / 20 | 10.000–20.000 | 30.000–40.000 | 35% | 120 | 5 / 6 |
| Supermercado | 5 / 10 | 5.000–10.000 | 10.000–15.000 | 35% | 120 | 4 / 6 |
| Posto de gasolina | 5 / 10 | 2.000–3.000 | 4.000–5.000 | 20% | 90 | 3 / 5 |
| Mercadinho | 2 / 5 | 1.000–2.000 | 3.000–4.000 | 10% | 45 | 2 / 3 |
| Loja de roupas | 2 / 5 | 500–1.000 | 2.000–3.000 | 5% | 30 | 2 / 3 |

Perfil de cada alvo (0–100):

| Alvo | Recompensa | Exposição | Segurança | Movimentação | Atenção | Dificuldade |
|---|---|---|---|---|---|---|
| Banco | 95 | 80 | 90 | 60 | 85 | 90 |
| Joalheria | 75 | 70 | 70 | 40 | 75 | 70 |
| Supermercado | 45 | 60 | 45 | 85 | 45 | 50 |
| Posto | 25 | 55 | 30 | 50 | 40 | 30 |
| Mercadinho | 15 | 35 | 15 | 45 | 30 | 15 |
| Loja de roupas | 10 | 40 | 20 | 50 | 35 | 15 |

Horários:

| Horário | Hora | Potencial | Atenção | Clientes | PM |
|---|---|---|---|---|---|
| Abertura | 09:10 | ×0,75 | −10 | ×0,55 | ×0,9 |
| Tarde | 15:30 | ×1,00 | 0 | ×1,25 | ×1,15 |
| Fechamento | 19:35 | ×1,10 | +15 | ×0,5 | ×0,85 |

Abordagens: **Furtivo** (entra como cliente; butim menor) e **Rápido** (anuncia; alarme toca).

- **Marcar** (`planejarAssalto`): alvo, tamanho da equipe, abordagem, horário e dia. Dias possíveis (`diasParaAssalto`): de 2 a 14 dias à frente, no mesmo ano (semana ≤ 52), dia livre (`feed.diaLivre`) e sem outro assalto marcado. Guarda em `E.assaltos` (até 24).
- **Ficha** (`fichaDoAssalto`): potencial = `teto do butim × multiplicador do horário` (arredondado à centena); atenção = `perfil + ajuste do horário`.
- **Qualidade da equipe** `q` = média de `(força+defesa)/2` dividida por 20 (0–1).
- **Calor da polícia** (`E.calorPolicia`, 0–100): esfria 1,5 por chamada de `esfriarCalor` (quem chama é o feed). Rótulos: ≥60 "na cola", ≥30 "de olho", ≥10 "desconfiada", senão "tranquila".
- **Risco** (`riscoDoAssalto`):
  - Ser notado (furtivo): `limitar(0,12 + 0,55 × atenção × (0,55 + 0,45 × movimentação × clientes) + 0,1 se equipe grande − 0,3 × q; 0,06; 0,85)`; rápido = 1.
  - Alerta da PM: `limitar(chance-base × pm do horário × (1 + (calor − 20)/100) × (1,25 − 0,5 × q) × 1,15 se grande; 0,02; 0,9)`.
  - Polícia (furtivo): `notado × pmAlerta × 1,1 + (1 − notado) × pmAlerta × 0,12`; rápido: `pmAlerta`. Rótulo: ≥45% Alto, ≥20% Médio, senão Baixo.
- **Simulado** (`simularAssalto`): equipe = `n` disponíveis sorteados, o mais forte é o líder. Fração do potencial: rápido `U(0,65; 0,95) × (1 − 0,25 × dificuldade) + 0,1 × q`; furtivo não notado `U(0,3; 0,55) × (1 − 0,2 × dificuldade) + 0,08 × q`; furtivo notado `U(0,15; 0,4) + 0,05 × q`. Se a polícia chega: 35% (rápido) ou 20% (furtivo) de **todos presos e butim zero**; senão prende de 50–100% (rápido) ou 30–80% (furtivo) dos que estavam dentro (mínimo 1) e o butim é multiplicado por `(1 − presos/dentro) × 0,85`.
- **Fechamento** (`fecharAssalto`): butim entra no extrato; presos pegam a pena do alvo (menos o corte dos advogados); o calor sobe `(8 se houve alerta, senão 2) + 6 se polícia + 3 por preso + 6 se a câmera gravou + exposição/10` (operação abortada sem alerta: +1). Mensagem `assalto` da diretoria no feed; se houve alerta ou preso, sai também notícia de polícia no jornal Futebol e Porrada.

**b) Assalto imediato** (`executarAssalto(E, alvo, n)`, modelo antigo, ainda exportado): `n` disponíveis sorteados; com a chance-base do alvo **todos** são presos com a pena do alvo; senão o butim é sorteado na faixa. Gera mensagem `assalto`. (Se a tela atual ainda chama este caminho: não confirmado.)

### 6.6 Demais ações do jogador

| Ação | Estado no código |
|---|---|
| Pixação | **(desligada)**: `dominio.js: pixar()` devolve `{ok:false}`, a cota de muros é 0; a política `pixo` do planejamento segue gravada sem efeito |
| Ação social no bairro | **(desligada)**: `dominio.js: social()` devolve `{ok:false}` (a constante `SOCIAL = {custo:1500, gente:5}` ficou sem uso) |
| Treta marcada / LNT | **(desligadas)**: decisões antigas fecham com "Esse assunto já passou" |
| Bote a bar rival e a resenha de zona rival | vêm da reunião mensal ou da pauta solta (9.7) e abrem cena de ataque |
| Briga de bairro | sugerida pelo feed, três por mês (9.8) |
| Ataque da subsede de outra cidade | sugerido pelo olheiro da filial (9.9) |
| Assalto | pauta "Alvos de assalto" (9.7) → planejamento (6.5) |
| Provocar / aproximar, pedido a aliado, eixos | telas de diplomacia (`relacoes.js`, `eixos.js`, fora do escopo) |
| Reforçar o elenco do clube | fora do escopo (`E.investimento`) |

## 7. Planejamento do dia de jogo

Fonte: `js/gestao/planejamento.js` (`TO.planejamento`), `js/gestao/itinerario.js` (`TO.itinerario`), `financeiro.js` (cobrança), com as decisões chegando ao jogador pelo feed (capítulo 9).

### 7.1 O plano

`plano(E, jogo)` devolve (e cria, se preciso) o plano do jogo. O plano do "jogo da semana" mora em `E.plano`; o de um segundo jogo da mesma semana, em `E.planosExtra[chave]`. A chave é a do jogo (`ano-semana-adversário`) ou `folga-ano-semana`.

| Campo | Padrão | Significado |
|---|---|---|
| `chave` | — | identifica o jogo |
| `intencao` | `'paz'` | `'paz'` ou `'atacar'` (o texto ainda prevê `'trair'`, sem caminho que o grave — desligado) |
| `alvoTorcida` | `null` | id da torcida que vamos atacar |
| `como` | `'arredores'` | `'arredores'` ou `'ida'` |
| `olheiro` | `null` | ponto da ida onde o olheiro fica (id de `PONTOS`) |
| `alvo` | `'arredores'` | derivado: paz → `null`; `como:'ida'` → o ponto do olheiro; senão `'arredores'` |
| `bombas` | 0 | quantas do estoque levar |
| `efetivoAtaque` | — | quantos vão no ataque (opcional) |
| `bondes` | 1 | em quantos bondes a torcida se divide |
| `destinos` | `{}` | destino de cada bonde |
| `investidas` | `{}` | ataques a visitantes de **outros** jogos na nossa cidade |
| `caravana` | `null` | quantos vão na caravana (`null` = todos os interessados) |
| `rota` | `null` | id da rota (`curta`, `segura`, `ar`) |
| `recepcao` | `{}` | nível de recepção por aliado visitante |
| `pago` | `{}` | o que já foi cobrado/gasto |
| `ajuda` | — | resposta do aliado ao pedido de apoio fora de casa |
| `decidido` | `false` | plano fechado (`confirmar`) |

- **Padrões** (`salvarPadrao`, `E.padroes.casa` / `E.padroes.fora`): guarda intenção, como, olheiro, alvo, bombas, bondes, destinos, rota e a fração da caravana (`vao/interessados`). Plano novo nasce do padrão do tipo de jogo e já `decidido`. `esquecerPadrao` apaga.

### 7.2 Intenções e onde atacar

- Intenções (`intencoes`): **Ir em paz** ("entrar pelo portão, bandeira e bateria") e **Atacar** ("procurar a torcida rival antes da bola rolar"). Escolher paz zera alvo, olheiro e bombas.
- **Onde** (`ONDE_ATAQUE`, a escolha que a tela oferece):

| Id | Rótulo | Vira no plano | Parada do itinerário |
|---|---|---|---|
| `praca` | Na concentração | `como:'ida'`, `olheiro:'praca'` | concentração |
| `pista` | Na pista | `como:'ida'`, `olheiro:'avenida'` | pista |
| `arredores` | Nos arredores | `como:'arredores'` | arredores |

- **Pontos do mapa** (`PONTOS`; a tabela completa segue existindo e alimenta o relatório do olheiro e os destinos de bonde):

| Id | Nome | Risco (de 5) | Prestígio | Na ida | Nota |
|---|---|---|---|---|---|
| `arredores` | Arredores do estádio | 3 | 4 | não | cordão da PM em peso, mas é onde o rival inteiro está |
| `bar` | Bar da rival | 2 | 5 | sim | poucos lá dentro, mas é humilhação que fica |
| `praca` | Praça de encontro | 2 | 2 | sim | aberta, a briga espalha |
| `terminal` | Terminal rodoviário | 4 | 3 | sim | fechado, a PM chega rápido |
| `avenida` | Avenida de acesso | 2 | 3 | sim | larga, favorece a linha e a fuga |
| `viaduto` | Viaduto da via expressa | 3 | 4 | sim | gargalo, sem saída pelos lados |

  No itinerário, `praca` → concentração; `avenida`, `terminal`, `viaduto` → pista; `arredores` → arredores. Os campos `risco` e `prestigio` só aparecem como texto nestes arquivos (efeito em cena não confirmado).
- **Alvos**:
  - `alvosDoJogo(E)`: torcidas do clube adversário que não são irmãs nossas, da pior relação para a melhor; `aliada` = relação ≥ 20.
  - `alvosNaRua(E, ctx)`: em casa, quem está na rua naquele dia (`TO.praca.naRuaEm`), sem as nossas e as irmãs; fora (`ctx.fora`), `alvosDaViagem`: torcidas do clube adversário com `n = max(4, disponíveis)`. Tiram-se aliadas (relação ≥ 20) e quem está em trégua. Se só há aliados na rua, `alvosDoAtaque` devolve a lista crua (atacar aliado é possível).
  - O efetivo do alvo aparece como **faixa**: erro de 25% a 50% (fixo por torcida/semana), arredondado de 5 em 5, mínimo 5.
- **Efetivo do ataque** (`efetivoDoAtaque`): teto = `max(5, efetivoDaSaida)`; piso = `min(5, teto)`; padrão = teto.
- **Bombas**: de 0 ao estoque (`E.estoque.bombas`). O passo-a-passo chama a ausência de bombas de "só na pedra" — pedra não é item de estoque.

### 7.3 Olheiro (relatório)

`relatorioDoOlheiro(E, idTorcida)` — determinístico por torcida/ano/semana:

- Efetivo = `max(6, disponíveis da torcida)`; se ela vem de fora para o jogo na nossa casa, usa a caravana dela.
- Bondes: mais de 140 → 3; mais de 70 → 2; senão 1. Sorteio: acima de 0,80 → +1; abaixo de 0,18 (e mais de 1) → −1. Entre 1 e 4.
- Tamanho de cada bonde proporcional a pesos `1 + r×0,6` (o primeiro +0,9), mínimo 4.
- Confiança: `limitar(88 − max(0, −relação − 45) × 0,35 − (bondes − 1) × 9; 35; 95)`.
- Cada bonde recebe um ponto de ida sorteado.
- `leituraDoPonto`: chance de pegar gente no ponto = `limitar((62 se há bonde ali, senão 14) + (confiança − 70) × 0,4; 8; 92)`.

### 7.4 Bondes

`divisao(E, bondes)`: zonas = as primeiras `bondes` zonas da cidade; `porBonde = floor(gente / bondes)`; `solidez = limitar(1 − (bondes − 1) × 0,18; 0,4; 1)`. `destinos(E)`: cada bonde vai "direto pro estádio" ou a um ponto de ataque. (A tela atual do ataque usa `ONDE_ATAQUE`; uso em cena de `bondes`/`solidez` não confirmado.)

### 7.5 Quanta gente sai (`efetivoDaSaida`)

- **Em casa**: aptos da matriz + membros de filiais que vêm ao jogo.
- **Fora**: os que vão na caravana (`estimativaCaravana.vao`) + núcleos de filiais + escolta do aliado (se a ajuda foi concedida naquela cidade).
- **Filiais no jogo** (`filiaisNoJogo`): a filial da própria cidade do jogo entra com todos os aptos, sem custo. As outras mandam caravana própria se tiverem pelo menos 2 aptos: `n = max(2, round(aptos × vontade))`, os mais fortes; custo `(18 + 12 × max(1, trechos)) × n × 0,4 × (1 − desconto da frota)`; só embarcam se o caixa cobrir. A lista de quem embarcou é congelada por dia/destino.

### 7.6 Caravana

**Rotas** (`rotas`): só há caravana em jogo fora em outra cidade.

| Rota | Quando existe | Custo de referência | Observação |
|---|---|---|---|
| `curta` | há estrada | `1.200 + 900 × trechos` | menor distância (Dijkstra por km na malha `TO.dados.malha`) |
| `segura` | se for diferente da curta | `1.200 + 900 × trechos + 600` | caminho que soma `hostilidade da cidade × 16` km a cada cidade |
| `ar` (avião) | sem estrada, ou rota curta com 5 trechos ou mais | 5.200 | sem emboscada; ônibus não desconta |

- `hostilidade(cidade)` = a pior relação negativa com uma torcida da cidade (0 a 100). **Risco** da rota = soma da hostilidade das cidades de passagem (sem origem e destino).
- O `custo` da rota é só rótulo; a cobrança real é por cabeça:

**Vontade de viajar** (`vontadeDeViajar`):

`limitar(0,72 − trechos × 0,09 + (moral/20) × 0,4 − (risco/100) × 0,15 + 0,10 se a frota tem 4 ônibus (e não é avião) + 0,15 se o jogo é decisivo; 0,08; 0,95)`

- **Jogo decisivo**: qualquer jogo de Libertadores; mata-mata em Quartas, Semifinal ou Final; ou uma das 10 últimas rodadas das Séries A, B ou C do Brasileirão.

**Estimativa** (`estimativaCaravana`):

| Grandeza | Fórmula |
|---|---|
| Interessados | `max(5, round(aptos da matriz × vontade))` |
| Vão | o que o jogador escolheu, entre 5 e os interessados (padrão: todos) |
| Custo por cabeça | estrada: `18 + 12 × trechos`; avião: 95 |
| Bruto | `porCabeça × vão` |
| Rateio (pago pelos que vão) | 60% do bruto |
| Parte da torcida | 40% do bruto |
| Custo ao caixa | `parte da torcida × (1 − desconto da frota)`; frota 1/2/3+ → 30% / 60% / 100% |

- **Cobrança** (`financeiro.cobrarCaravana`): na véspera do jogo da semana (`dia do jogo − 1`), uma vez por jogo. Abate do clube: 20% se a relação com o clube é ótima. Se o custo é zero (3+ ônibus) e a rota não é aérea, o **rateio entra como receita**.
- No mesmo dia, `feed.emboscadaDaViagem(E)` resolve a estrada.
- **IA**: `caravanaDe(torcida)` = `min(vivos, max(5, round(vivos × vontade × 0,6)))`; custo `(18 + 12 × trechos) × n × 0,4 × (1 − desconto)`.

### 7.7 Emboscadas na estrada

`emboscadaNaPraca(E, cidade, ida)` — uma verificação por cidade do trajeto, determinística por ano/semana/cidade/sentido:

- Candidatas (`hostisNaPraca`): torcidas da cidade com relação ≤ −15, fora de trégua, que não "desistiram" de nós e com pelo menos 70% do tamanho da nossa caravana em gente disponível; mais **subsedes hostis** de torcidas de outras cidades com filial ali (mínimo 6 membros e 70% da caravana).
- Se há "maior rival" entre elas, em 3 de 4 casos o sorteio é só entre os maiores rivais.
- Chance (%): `limitar(8 + max(0, −relação − 15) × 0,35; 0; 45) × 0,6` (freio de briga). Na **volta**, metade. Com filial nossa na cidade, metade de novo.
- Cena sorteada: `emb-posto` ou `emb-onibus`.
- `emboscadaDaRota` (versão por rota inteira, mesma fórmula, sem a metade da volta) continua exportada.

### 7.8 Apoio do aliado fora de casa (recepção recebida)

- Só existe se não temos filial na cidade do jogo (`semRecepcao`).
- `aliadasNaPracaDeles`: torcidas da cidade que são irmãs ou têm relação ≥ 20.
- `pedirAjuda(E, aliado, jogo)` — um pedido por jogo. Nota = `relação + (hash % 21) − 10`:

| Nota | Resposta | Relação (base) | Moral nossa | Escolta |
|---|---|---|---|---|
| ≥ 60 | churrasco | +20 | +0,4 | sim |
| ≥ 42 | escolta | +12 | +0,2 | sim |
| ≥ 26 | hospedar | +7 | +0,2 | não |
| < 26 | nada | −7 | 0 | não |

- O ganho positivo passa por `relacoes.ganhoRepetido` (via `caravana`): cada repetição no mesmo ano com o mesmo par vale metade da anterior (`base / 2^n`).
- O custo (25/50/75 por cabeça × os que vão) sai do **caixa do aliado**.
- **Escolta**: `min(teto pela sede do aliado, disponíveis dele)`; teto por nível de sede 0–6: 10, 10, 10, 10, 20, 30, 30. Soma ao nosso efetivo na cidade do jogo.
- O aliado posta a resposta no feed ("Bem-vindos, irmãos!…" ou a recusa) e, no dia seguinte ao jogo, sai o nosso agradecimento público.
- Política `apoio: 'sempre'` (`pedirApoioDaSemana`): pede sozinha à aliada de melhor relação em todo jogo fora.

### 7.9 Recepção de aliados na nossa cidade

- `aliadosNaCidade(E, semana)`: torcidas aliadas (relação ≥ 20) de clubes visitantes que jogam na nossa cidade na semana, com a estimativa da caravana delas.

| Nível | Custo por cabeça | Relação |
|---|---|---|
| Não receber | 0 | −7 |
| Hospedar na sede | 25 | +7 |
| Hospedar e escoltar | 50 | +12 |
| Churrasco e escolta | 75 | +20 |

- Nível por aliado em `plano.recepcao[id]`; senão o padrão `E.padraoRecepcao`; senão "não receber".
- `cobrarRecepcoes(E)` roda no dia do jogo do aliado: cobra `porCabeça × estimativa`; **sem caixa, cai para "não receber"**. Aplica a relação (com a regra da repetição), marca ajuda e agenda para o dia seguinte o post do aliado (agradecimento, ou a cobrança pública "nem apareceu").

### 7.10 Investidas em outros jogos da cidade

- `outrosJogosNaCidade`: jogos da semana na nossa cidade em que o nosso clube não joga, com as torcidas visitantes.
- `definirInvestida(E, chave, {alvo, como, olheiro})`; ao `confirmar`, cada investida consome **1 ação** do dia (`E.acoes.usadas`) e entra em `E.investidas`.

### 7.11 Políticas automáticas (`E.politicas`)

| Política | Opções (padrão em negrito) |
|---|---|
| `jogo` (ataque no nosso jogo) e `outros` (outros jogos na cidade) | **`nunca`** · `rivais` (sempre atacar rivais de base) · `quentes` (rivais com relação abaixo de −55) · `todos` |
| `apoio` | **`manual`** · `sempre` |
| `pixo` | **`eu`** · `ia` — sem efeito: a pixação está desligada |

`aplicarPolitica` escolhe o melhor alvo (rival de base primeiro, pior relação, maior prestígio, mais membros) e marca ataque "nos arredores".

### 7.12 Compromissos e pendências

- `compromissos(E)`: lista para o financeiro — caravana (valor e se já foi paga), recepção de cada aliado, investidas (custam ação, não dinheiro). Totais: `total`, `pago`, `pendente`.
- `pendencias(E)`: ações sobrando, rota não escolhida, plano não fechado, aliado chegando sem recepção definida, baixas de rua recentes, presos, promovíveis, caixa no vermelho.

### 7.13 Itinerário do dia (`itinerario.montar`)

Monta a linha do tempo do dia de jogo a partir do jogo de hoje (ou do próximo jogo):

| Parada | Horário em relação ao jogo |
|---|---|
| Concentração | −5h00 |
| Pista (ida) | −4h00 |
| Arredores (ida) | −3h00 |
| O jogo | hora da tabela |
| Arredores (volta) | +2h05 |
| Pista (volta) | +2h50 |

- **Com viagem por estrada**: a caravana chega 10h30 antes do jogo; cada trecho de rodovia leva 7h30; a volta sai 4h30 depois do jogo. Cada cidade do caminho é uma parada; em cada uma (menos a origem na ida e a sede na volta) roda `emboscadaNaPraca`. Emboscada prevista gera aviso do olheiro (`feed.avisoDoOlheiro`; forçado se temos filial na cidade).
- **Eventos** possíveis numa parada: `sofrido` (ataque marcado contra nós na concentração ou na pista — `E.ataqueMarcado`), `emboscada`, `investida` (o nosso ataque planejado). Cada evento abre a tela de defesa ou de guerra.
- As paradas são agrupadas em 3 fases — ida, jogo, volta — e cada fase mostra **um** evento, por prioridade: sofrido, emboscada, investida.
- Com escolta de aliado, as paradas da cidade do jogo ficam marcadas `comEscolta`.
- `efetivoInicial`: nós (presença do cartão da partida, sem a escolta) e o maior grupo do outro lado.
- `trajetoNaCidade`: no mapa da cidade, da nossa sede (em casa), ou da sede do aliado que recebe / da nossa subsede / de uma entrada da cidade (fora), até o estádio.

### 7.14 Tetos de gente por cena

Os tetos são aplicados na hora de abrir a cena (`main.js: abrirAcaoEmCena` e a abertura da defesa) e nos geradores do feed:

| Cena | Nosso lado | Lado deles |
|---|---|---|
| Ataque a bar rival | no máximo **60** | `max(4, 35% do efetivo de pé)`, no máximo **40** |
| Ataque a sede rival | os aptos da matriz | `max(4, 35% do efetivo de pé)` |
| Defesa do nosso bar | 25% dos aptos, mínimo 2, no máximo **40** | entre 30% e 70% do efetivo deles, mirando 90% do nosso; no máximo **60** |
| Defesa de sede/outros alvos na cidade | 25% dos aptos | idem, sem o teto de 60 |
| Resenha de zona (casa de piscina) / reunião de zona | o bonde da zona: `limitar(aptos ÷ 4; 4; 20)`, os mais fortes dos que "moram" na zona | a zona deles, na mesma régua (4–20) |
| Ataque sofrido na concentração ou na pista | todos os aptos (o que sobrou da caravana, fora de casa) | 30%–70% deles |
| Emboscada na estrada | os que foram na caravana | 30%–70% deles; se for subsede, o núcleo dela — e o nosso lado é limitado a 1,3 × esse núcleo |
| Nossa subsede atacada | o núcleo da filial | subsede hostil: o núcleo dela; torcida local: `limitar(núcleo × U(0,9; 1,5); 6; 40)`, no máximo 50% dela |
| Ataque da filial a bar | núcleo da filial (mín. 4) | `limitar(35% do efetivo; 4; 40)` |
| Briga de bairro, ataque nosso | até `floor(moradores deles × 1,6)` (mín. 2) | moradores do bairro: até 15 (7 se "bobeira") |
| Briga de bairro, contra nós | nossos moradores do bairro: até 15 (7 se "bobeira") | até `floor(nossos × 1,6)` |
| Pressão no CT | aptos | 10 |
| Caravana da filial emboscada | os que viajaram | `max(4, n × U(0,8; 1,4))` |

### 7.15 Simular

Todo botão de mensagem que abre uma cena de briga (`cena-guerra`, `cena-defesa`, `cena-escolta`, `cena-bairro`, `atacar-bar-rival`, `atacar-casa-rival`, `atacar-reuniao-rival`) ganha automaticamente um botão gêmeo **"Simular"** (`feed.js: comSimular`): "Roda o duelo sem abrir a cena. As consequências são as mesmas." A resolução é de `diaJogo.simular.rodar` (fora do escopo): devolve o mesmo formato de resultado da cena — caídos e presos por lado, `ganhamos`, XP, `moralTorcida` (+1/−1) e prestígio `limitar(round((caídos deles × 2 − caídos nossos × 1,5 − presos nossos × 2)/3); −10; 10)` — e o fechamento (`membros.aplicarResultadoDaNoite` + `acoes.fecharCena`) é o mesmo.

## 8. Festas da torcida no estádio e torcedores comuns

### 8.1 Festas de arquibancada (`js/gestao/festas.js`, `TO.festas`)

São itens de estoque comprados antes e gastos no jogo. Catálogo:

| Id | Nome | Custo (cada) | Empurrão no placar | O que aparece |
|---|---|---|---|---|
| `papel` | Chuva de papel picado | R$ 3.000 | 4% | papel picado nas cores da torcida na entrada do time e a cada gol nosso |
| `trapos` | Festa com trapos | R$ 6.000 | 5% | tiras de tecido penduradas na arquibancada o jogo inteiro |
| `bandeirao` | Bandeirão | R$ 12.000 | 8% | a torcida sobe o bandeirão, que tremula por cima das cabeças |
| `mosaico` | Mosaico | R$ 20.000 | 10% | cada um levanta um papel: forma o escudo do clube ou as cores da torcida |
| `mosaico3d` | Mosaico 3D | R$ 35.000 | 13% | a bandeira gigante em pé na arquibancada, com arte da torcida |

Regras:

- **Estoque** em `E.festas[id]`; máximo **20 de cada**. Compra por `comprar(E, id, qtd)`, paga no extrato ("Festa na arquibancada: …").
- **Uso** (`usarNoJogo(E, j)`, chamado por `competicoes.fatorDoJogo` quando o jogo é simulado): se o jogo é do nosso clube, se há estoque e se "vamos estar lá", gasta **uma unidade de cada tipo que houver em estoque** — todas de uma vez, sem escolha por jogo — e grava a lista em `j.festas` (a cena e o cartão da partida desenham a partir dela).
- **"Vamos estar"**: em casa, pelo menos 6 aptos na matriz; fora, na nossa própria cidade (clássico) sempre; fora em outra cidade, se a saída tem pelo menos **10** pessoas (`MIN_FORA`).
- **Efeito**: pontos = `55 × soma dos percentuais` (régua `REGUA = 55`, o divisor do placar). Em casa soma a favor do mandante (nós); fora, o mesmo valor entra negativo para o mandante, isto é, a nosso favor. Com as cinco festas: 40% → 22 pontos.
- As torcidas da IA usam festas nos jogos dos clubes delas (`relacoes.festasDelasNoJogo`, fora do escopo).
- Soma-se à bateria (+11 em casa por 7 dias; 4.8).

### 8.2 Festa na sede e festas de data

Não confundir com as de arquibancada:

| Festa | Onde | Regra |
|---|---|---|
| Festa na sede | ação de expediente | 6.2 |
| Aniversário da torcida / do clube | pauta da reunião (9.7) | grande ou simples; custo na hora, receita no dia |
| Festa da campanha | mensagem `veredicto` (9.5) | R$ 10.000, volta 9.000–16.000, moral +1,0 |
| Aniversário de aliada | convites (9.7) | ir custa R$ 2.000 |

### 8.3 Torcedores comuns (`js/gestao/torcedores.js`, `TO.torcedores`)

O módulo é pequeno; a "satisfação do torcedor comum" não existe mais no jogo (o resultado do time mexe só na moral da torcida).

| Item | Valor |
|---|---|
| `ORGANIZAR` | 0,15 — fração dos torcedores alcançados que "querem" entrar; hoje só alimenta o número informativo `querem` da previsão de recrutamento |
| `ORGANIZAR_MAX` | 0,30 — sem uso |
| `base(E)` | `TO.mundo.baseDeRecrutamento(cidade, clube, efetivoDe)`: torcedores do clube na cidade que não estão em organizada (cálculo em `mundo.js`, fora do escopo) |
| `abrirJanela(E, mult, semanas)` | grava `E.recrutamento = {mult, ate}`; chamada no acesso (×1,6, 4 semanas) e no rebaixamento (×0,45, 8 semanas) |
| `janela(E)` | devolve o multiplicador enquanto a janela vale; **ninguém o usa** na ação de recrutar (desligado). Além disso, a pauta "Onde a gente recruta" regrava `E.recrutamento` como `{bairro, ano, semana}` |

O que os torcedores comuns fazem hoje no jogo:

- São a **base do recrutamento**: sem torcedor do clube fora de organizada na cidade, a ação não roda (3.6); o mesmo vale por cidade de filial.
- Definem onde se pode abrir **subsede em outra cidade** (cidades com torcedores do nosso clube; 5.3).
- Pesam por bairro no domínio, na receita (`fatorTorcida`) e no peso do recrutamento (`dominio.js`, fora do escopo).
- Crescem ou encolhem na virada do ano conforme a fase do clube (`mundo.evoluirTorcedores`, fora do escopo).

## 9. O feed

Fonte: `js/mundo/feed.js` (`TO.feed`). O feed é a tela principal: é por ele que o jogo fala com o jogador e é nele que o jogador decide.

Há **dois armazéns** distintos no save:

| Armazém | O que guarda | Quem escreve |
|---|---|---|
| `E.feed` (+ fila `E.feedFila`) | mensagens **do jogo para o jogador**: recados da diretoria, do olheiro, dos jornais, de outras torcidas; decisões com botões. Cada uma tem um `kind` | `propor` |
| `E.mensagens` (+ `E.mensagensAgendadas`) | a **rede social**: posts públicos das torcidas e dos dois jornais, e recados privados de torcidas (pedido, trégua, cobrança). Cada um tem um `tipo` | `mensagemDe`, `postDoJornal` |

Os ids saem do mesmo contador `E.feedSeq`.

### 9.1 A fila de mensagens

**`propor(E, msg)`** — põe uma mensagem na fila. Campos:

| Campo | Padrão | Significado |
|---|---|---|
| `id` | `E.feedSeq++` | — |
| `kind` | — | tipo da mensagem (9.3) |
| `peso` | `'info'` | `'info'` (só ler) ou `'decisao'` (exige resposta) |
| `voz` | — | quem fala: `diretor`, `olheiro`, `jornal`, `porrada`, `torcida`, `eixo`, `na rua` |
| `tipo` | `''` | tom: `boa`, `ruim`, `neutro`, `bom` |
| `texto` | — | o recado |
| `chave` | — | se já existe mensagem com a mesma chave no feed ou na fila, a nova é descartada |
| `quando` | `{ano, semana, dia, abs}` | data do jogo |
| `hora` | entre 08:00 e 22:59, por hash do dia e do `kind` | horário mostrado |
| `botoes` | `null` | `[{id, rot, acao, nota/dica, args}]` |
| `links` | `null` | atalhos para telas |
| `dados` | — | anexo (a página do jornal, o alvo, a lista…) |
| `efeitos`, `consequencia` | — | o que mudou, em linha de texto |
| `respondido` | `null` | `{botao, rot}` depois da resposta |

- Botões cuja `acao` abre cena de briga ganham o gêmeo **Simular** (7.15).
- **`dropar(E)`** — entrega a próxima: se o feed está travado, não faz nada; senão tira a primeira da fila e a põe no topo de `E.feed`. Casos especiais: `protesto-ct` só é entregue se o clube ainda está em sequência ruim (senão é descartado) e em dia comum (senão volta para o fim da fila), e tem o texto refeito na hora. Ao entregar, gera o **post de jornal** correspondente (9.4). Mensagem `confronto` entra como não lida (contador de "tretas").
- **`travado(E)`** — verdadeiro enquanto houver em `E.feed` uma mensagem de `peso:'decisao'` sem `respondido`. Travado, o tempo não anda e nada mais é entregue.
- **`pendentes(E)`** — tamanho da fila. `decisaoAberta(E)` — a decisão que está travando.
- **Ritmo**: 1,5 s antes de uma decisão (`INTERVALO_DROP = 1500`), 0,5 s entre informações, 120 ms por dia vazio (`main.js`).
- **`responder(E, idMsg, idBotao)`** — executa a `acao` do botão (tabela em 9.3), grava `respondido` e, quando há, `consequencia`. Algumas ações só abrem tela e a mensagem é fechada depois (`marcarResposta`), quando a tela conclui.
- **Lote de brigas** (`abrirLote` / `fecharLote`): durante o dia de jogo, as mensagens `confronto` são acumuladas; ao fechar, uma só vai para a fila — a da maior briga, com texto "Dia de jogo com N brigas (rivais): X feridos nossos, Y do lado deles… Levamos a melhor em G de N", efeitos somados e as outras em `dados.outrasNossas`.
- O save guarda o feed inteiro; só o anexo `dados` de mensagens com mais de 90 dias é cortado (1.10).

### 9.2 A ordem dos eventos do dia (`eventosDoDia`)

Rodam nesta ordem, cada passo protegido contra erro:

1. posts de resultado guardados de ontem; 2. posts agendados; 3. tréguas; 4. status de relação; 5. eixos; 6. diplomacia entre as IAs; 7. reunião mensal; 8. pauta solta (modo rápido); 9. cartão da semana; 10. olheiro; 11. dia de jogo (investidas); 12. evento do trimestre; 13. ataque sofrido; 14. briga de bairro; 15. escolta; 16. assunto do clube; 17. bote do dia; 18. assalto do dia; 19. obra da cidade; 20. veredicto da campanha; 21. aniversários; 22. cobrança das recepções; 23. pedido de apoio fora; 24. ataque à filial; 25. olheiro da filial; 26. caravana das filiais; 27. bote na caravana rival; 28. hospedagem da filial; 29. placar (cartão da partida e rodada); 30. mundo (Conmebol e ligas); 31. almanaque; 32. dica; 33. brigas do mundo na rede; 34. a cidade na rede.

"Dia comum" (`diaComumFeed`) = dia sem jogo do nosso clube e fora de véspera/dia seguinte de viagem. Vários eventos só saem em dia comum.

### 9.3 Todos os tipos (`kind`) de mensagem

| `kind` | Peso | Quem fala | Quando aparece | Botões → efeito |
|---|---|---|---|---|
| `tutorial` | decisão | diretor | uma vez, na abertura do jogo novo | **Mostra o jogo** → abre o tutorial · **Já sei jogar — pular** → `E.tutorial = {feito, pulou}` |
| `abertura` (ideologia) | decisão | diretor | abertura | **Definir ideologia** → tela de ideologia |
| `abertura` (expediente) | decisão | diretor | abertura | **Abrir o Expediente** → painel do expediente |
| `dica` | info | diretor | terças das semanas 1 e 3 do primeiro mês (só enquanto a semana absoluta ≤ 4) | — (40 dicas em sequência, `E.dicaSeq`) |
| `semana` | decisão se há jogo; info se não | diretor | toda segunda, se há jogo nosso ou jogos na nossa cidade/cidades de filial | **Fechar o planejamento** → confirma o plano de todos os jogos da semana (consome as investidas) e resume "Caravana: N para X. Plano: …". Sem jogo: "Semana de folga do time." |
| `partida` | decisão | jornal | no dia de cada jogo do nosso clube | **Iniciar partida** → abre a partida ao vivo; fecha em `encerrarPartida` com "Final: A x × y B" (e pênaltis). Ao criar: pontos de presença na relação com o clube e, em casa, a venda de ingressos (4.8) |
| `rodada` | info | jornal | junto com `partida`, se houve outros jogos no dia | link **Ver Competições**. Até 8 placares + "e mais N" |
| `confronto` | info | diretor | depois de toda briga nossa (`registrarConfronto`) | — . Texto "{nós} e {eles} se pegaram {onde}, no bairro X: N feridos nossos, M deles… A {vencedora} levou a melhor"; consequência com os deltas |
| `sofrido` | decisão | diretor | rival ataca nosso bar, resenha de zona, reunião de zona ou subsede | **Descer pra briga / Segurar…** → cena de defesa (+ Simular) · **Deixar quebrarem / Largar…** → defesa perdida sem briga (6.4) |
| `campana` | info | olheiro | aviso de ataque ou emboscada que vem, se a Inteligência foi paga nos últimos 7 dias (nível 1: 50%; nível 2: sempre; com filial nossa na cidade: sempre) | — |
| `guerra` | decisão | diretor | no dia de um outro jogo na cidade para o qual marcamos investida | **Ir pra Guerra** → cena (+ Simular). O cartão `guerra` do **nosso** jogo está **(desligado)** — a briga do nosso jogo sai pelo itinerário |
| `olheiro` | decisão | olheiro | sugestão de ataque 2 dias antes de jogo | **(desligado)**: `SUGESTOES_DO_OLHEIRO = false` |
| `bairro` | decisão | diretor | três vezes por mês (9.8) | ataque nosso: **Ir pra cima** → cena (+ Simular) · **Deixar quieto** → nada. Contra nós: **Abrir a cena** (+ Simular) · **Ninguém desce** → 1 ponto do bairro para eles, moral −0,6, prestígio −0,7, relação −6 |
| `dominio` | info | porrada | quando um bairro muda de dona (`dominio.js`) | — |
| `escolta` | decisão | diretor | aliada recebida com escolta/churrasco é atacada na nossa cidade (35% no dia do jogo dela, se há rival de base dela na cidade) | **Entrar na briga** → cena (+ Simular) · **Ficar de fora** → relação −9 e recado público de lamento da aliada |
| `barrival` | decisão | diretor | dia do bote marcado a bar rival (ou na hora, no modo rápido) | **Descer no bar** → ataque a bar (6.3) (+ Simular) · no modo rápido, **Deixar quieto** → prestígio −0,2, moral −1 |
| `casarival` | decisão | diretor | dia do bote à resenha de uma Zona rival | **Dar o bote** → cena `casa-piscina` com o bonde da zona (precisa de 4) (+ Simular) · **Deixar quieto** (rápido) → idem |
| `filial-ataque` | decisão | olheiro | a cada 12 semanas por subsede de outra cidade, com núcleo de 6+ | **Atacar** → cena com o núcleo contra bar ou subsede rival · **Não atacar** |
| `filial-caravana` | decisão | olheiro | dia de jogo na cidade da filial, com investida planejada e núcleo de 6+ | **Atacar** → cena na praça ou na rua contra a caravana/torcida alvo · **Não atacar** |
| `reuniao` | decisão | diretor | dia 5 de cada mês, modo completo | **Sentar com a diretoria** → tela da reunião (9.7) |
| `pauta` | decisão | diretor, ou a torcida que pediu | modo rápido: um item da pauta por dia | os botões do item (9.7) |
| `convites` | info (completo) / decisão (rápido) | diretor | quando há aniversário de aliada no mês | lista com **ir** / **não ir** por aliada |
| `aniversario` | info | diretor | no dia do aniversário da torcida ou do clube, se houve festa marcada | — ("A festa rendeu R$ X") |
| `assalto-dia` | decisão | diretor | no dia e horário da operação marcada | **Comandar a equipe** → cena jogável · **Deixar a equipe fazer** → simulado (mostra o risco) · **Cancelar a operação** |
| `assalto` | info | diretor | resultado de assalto; ou operação que caiu por falta de gente | — |
| `almanaque` | info | jornal | 7 dias antes da estreia de cada competição; quando sai um campeão; notícia de polícia de assalto | — (anexo `dados.pagina`) |
| `obra` | info | porrada | uma por dia, tirada da fila `E.obrasDaCidade` | — . `responderObra` (botões "bravo"/"ameno") existe, mas nada cria esses botões **(desligado)** |
| `entrevista` | decisão | jornal | "assunto do clube" em mês par (9.6) | duas perguntas com opções |
| `protesto-ct` | decisão | diretor | "assunto do clube" em mês ímpar, se há 3+ derrotas nos últimos 5 | **Encabeçar o protesto** → relação com o clube −8, prestígio +0,4 · **Segurar a torcida** → relação +2, moral −0,6 |
| `veredicto` | decisão | "na rua" | quando acaba uma competição para o nosso clube e a campanha foi notável (9.5) | protesto/segurar ou festa/sem festa |
| `status` | decisão | a outra torcida | relação caiu de rival ou de aliada para a faixa neutra | ex-rival: **Fechado, neutro** / **Rival continua rival** (relação volta a −16; perguntam de novo em 12 semanas). Ex-aliada: **Encerrar a aliança** / **A aliança fica** (relação segura em +20) |
| `eixo-saida` | info | eixo | uma torcida (ou nós) saiu de um eixo do qual fazemos parte | — |
| `conmebol-fim` | info | jornal | campeão da Libertadores ou da Sul-Americana | link **Ver a chave** |
| `mundo-fim` | info | jornal | fecharam as ligas da América do Sul | link **Ver as ligas** |
| `aviso` | info | diretor | venda forçada da loja por dívida (`financeiro.js`) | — |
| `treta`, `lnt-treta`, `aniversarios` | — | — | legado: nada mais os cria; na carga, os abertos fecham com "Esse assunto já passou" | — |

Ações de botão que seguem no código sem gerador ativo: `paz`, `paz-praca`, `paz-grupo`, `padrao-grupo`, `seguir-padrao`, `seguir-padrao-praca`, `tela-ataque`, `tela-caravana` (cartões antigos do planejamento), `atacar-reuniao-rival`, `aniv-ir`, `aniv-nao`.

### 9.4 A rede social

**Post de torcida** — `mensagemDe(E, torcidaId, texto, tipo, extra)`:

- Campos: `id, de, nome, texto, tipo` (padrão `recado`), `chave, dados, resposta, quando, lida, curtidas`, e opcionais `publico, zona` (o post é de uma "Zona X da torcida"), `card`, `arte` (o que a tela desenha), `comentarios`.
- Não duplica: mesma `chave` (publicada ou agendada), ou mesmo autor + texto + dia.
- `extra.em` no futuro agenda o post para aquele dia absoluto (`publicarAgendadas` solta todo dia).
- Post `publico` já nasce lido. Post **não** público é recado direto para nós: dispara o gancho `aoChegarMensagem` (notificação) e conta em `mensagensNaoLidas`.
- Limite de **300** posts; ao passar, sai primeiro o post público mais antigo.
- **Comentário** (`comentar`): `{de, nome, texto, zona, abs…}` pendurado em `pai.comentarios`.

**Curtidas** (`curtidasDe`): `(membros da autora + membros de todas as torcidas irmãs ou com relação ≥ 20 com ela) × 0,55 × sorte`, sorte entre 0,85 e 1,15 por hash; mínimo 1. Post de jornal: média das curtidas das torcidas citadas. `curtimos(E, m)` diz se a nossa torcida "curtiu": post nosso; notícia de jogo do nosso clube; notícia de briga que vencemos; post de irmã ou aliada.

**Os jornais** (`JORNAIS`): **Gazeta dos Sports** (`@gazetadossports`) e **Futebol e Porrada** (`@futeboleporrada`). `postDoJornal` cria post com `de:null, jornal, tipo:'noticia', publico:true`.

- Toda mensagem entregue pelo feed com matéria vira também post de jornal (`postDaMateria`): `rodada` → Gazeta (página montada por `TO.gazeta`); `almanaque` → Gazeta (a página do anexo); `confronto` → Futebol e Porrada (`TO.porrada.montar`); `obra` → Futebol e Porrada (`montarObra`). Texto = `CHAPÉU · manchete. olho`. Leva um **cartaz**: de jogo (`{t:'jogo', c, f, gc, gf, comp, rod, fase, pen, venceu, foco, neutro}`) ou de briga (`{t:'briga', a, b, venceuA, onde, cena, cidade}`, cada lado com `id, nome, n, feridos, presos`).
- Além disso a Gazeta publica **"O FUTEBOL DA CIDADE"** / **"CLÁSSICO DA CIDADE"**: até 3 jogos do dia de clubes da nossa cidade (fora o nosso), com posição na tabela ou pênaltis; e o Futebol e Porrada publica **"PORRADA PELO PAÍS"**: em 35% dos dias com briga relevante, a maior briga do dia (por efetivo) entre torcidas do nosso país, com efetivos, feridos, bairro/domínio, pano tomado e total de brigas do dia.

**`importante(E, m)`** — marca o post como importante para nós quando: é nosso; tem cartaz de jogo do nosso clube; tem cartaz de briga com a gente; a chave contém o nosso id ou o do clube; ou o texto cita o nome da nossa torcida.

**Esconder e parar de seguir** (`E.feedPrefs`):

- Só post público que não é nosso pode ser escondido (`podeEsconder`).
- **Parar de seguir este perfil** (`pararDeSeguir`): o perfil é `j:<jornal>` ou `t:<torcida>[:zona]` → some tudo dele (`naoSigo`). `voltarASeguir` desfaz.
- **Seguir/deixar de seguir** por lista (`seguir(tipo, id, sim)`, tipos `torcida`, `clube`, `jornal`; `seguirTodos`): não dá para deixar de seguir a própria torcida nem o próprio clube. Notícia de jogo some se **todos** os clubes dela foram deixados.
- **Mostrar menos** (`mostrarMenos`): por "natureza" do post — `brigas` (tipos zoeira, resposta, provocacao, treta, tbt), `futebol` (comemoracao, reclamacao, protesto, convocacao, noticia), `agenda` (caravana, resenha, convite, agradecimento, juntos), `longe` (torcida a mais de 1 trecho de estrada), `jornal:<id>`, `outros`. Níveis 1/2/3 escondem 60% / 80% / 95% dos posts daquela natureza (por hash do id). `mostrarNormal` desfaz.

**Tipos de post e quando saem**:

| `tipo` | Quem posta | Quando |
|---|---|---|
| `zoeira` | a vencedora de uma briga entre IAs | brigas do dia, do nosso país, com vencedor, na nossa cidade ou envolvendo um maior rival nosso; no máximo 1 por dia e 3 por semana. Às vezes assinada por uma Zona (bar/surpresa, 50%). Cita o ganho no domínio do bairro. A perdedora comenta em 30% dos casos (70% se for rival nossa) |
| `zoeira` (nossa briga) | quem venceu a nossa briga | depois de cada briga nossa sem empate; se perdemos, em 50% dos casos o texto é um deboche direto; em trégua, a rival não posta. Se vencemos, a rival comenta (sempre, se a briga mexeu 3,5+ de prestígio na tela — `PROVOCA_REGUA`; senão 40%) |
| `comemoracao` (resenha) | a Zona vencedora | briga em resenha de zona (casa de piscina); o lado perdedor comenta |
| `comemoracao` (clássico) | a torcida do clube vencedor | clássico com vencedor; chance por distância: nosso clube 100%, rival nosso 100%, mesma cidade 85%, 1 trecho 50%, 2 trechos 25%, mais longe 5%; até 2 por dia |
| `comemoracao` (título, acesso) | a torcida do clube | título: competição nacional sempre, estadual/regional pela chance acima. Acesso: na virada do ano |
| `provocacao` (queda) | a torcida do clube rival de quem caiu | virada do ano; até 6 posts de acesso/queda |
| `provocacao` ("é só lazer") | a visitante | foi jogar na cidade de um maior rival e não perdeu briga lá; sai no dia seguinte (o nosso, dois dias depois) |
| `convocacao` | nós; e a maior torcida de outro mandante da cidade (50%) | dia de jogo em casa |
| `caravana` | nós | 2 dias antes de jogo fora ("Caravana confirmada!") |
| `resenha` | nós (1 em 3) ou outra torcida da cidade | sextas, 60% |
| `tbt` | nós (1 em 3), torcida da cidade ou rival nosso | quintas, um por semana: lembra briga vencida há mais de 4 semanas com 3+ feridos de diferença (e o dobro), ou pano tomado |
| `protesto` | torcida da nossa cidade | segundas: clube com 3+ derrotas nos últimos 5 jogos; no máximo 2 por semana e um por clube a cada 21 dias; "FORA, DIRETORIA" se 4+ derrotas sem vitória ou zona de queda |
| `convite` | nós | 7 dias antes do aniversário da nossa torcida |
| `inauguracao` | nós | a cada mudança de patrimônio: sede, bar, loja, subsede (nova ou ampliada), filial, ônibus, fábrica, enfermaria, galpão, área de treino, faixa, bandeira; e marco de membros (a cada 50 até 1.000, depois a cada 100) |
| `juntos` / `recusa` | a aliada | resposta ao nosso pedido de apoio fora de casa |
| `agradecimento` / `cobranca` | a aliada (ou nós, público) | dia seguinte à recepção ou à festa; cobrança se não recebemos ou se largamos a escolta |
| `pedido` (privado) | a aliada | 2 dias antes de jogar na nossa cidade: "Caravana confirmada…" — respondemos com o nível de recepção (`responderMensagemDe`) |
| `tregua` (privado) | a rival | 3+ brigas no ano contra nós e relação ≤ −55: propõe trégua até o fim do ano. Aceitar: relação +15, dívidas quitadas, ninguém procura ninguém; recusar: −5 |
| `noticia` | jornais | ver acima |

Os posts de resultado do dia (Gazeta da cidade, protestos, clássico, títulos) esperam o apito final: se há cartão `partida` aberto hoje, ficam guardados em `E.feedDepoisDoJogo` e saem quando a partida é encerrada (ou no dia seguinte).

### 9.5 Veredicto da campanha

`veredictoDeHoje` olha cada competição uma vez por ano, quando ela **acaba para o nosso clube**:

- Desfecho: título; liga terminada (posição, rebaixado, promovido); eliminação em mata-mata (posição = `confrontos da fase × 2`, mínimo 2).
- "Esperado" = posição do clube na fila por força do elenco.
- **Bom**: título, acesso, ou terminar 8+ posições acima do esperado. **Ruim**: rebaixamento, 8+ posições abaixo, ou "zebra" (eliminado, fora da final, por time com 8+ pontos de força a menos). No meio: não sai nada.

| Lado | Mensagem | Botões |
|---|---|---|
| Ruim | "… Vamos pra porta do CT?" | **Encabeçar o protesto no CT**: moral +1,0, relação com o clube −15 · **Não é hora, a gente segura**: moral −1,0 |
| Bom | "… A rua quer festa na sede. A gente banca?" | **Fazer a festa (R$ 10.000)**: volta de 9.000 a 16.000, moral +1,0 (sem caixa, não acontece) · **Comemorar sem gastar** |

### 9.6 Assunto do clube: entrevista e protesto

- Doze vezes por ano (uma por faixa de 52/12 semanas), num dia comum sorteado: em faixa **par**, entrevista; em faixa **ímpar**, protesto no CT — só se o clube tem 3+ derrotas nos últimos 5 jogos.
- **Entrevista** (`entrevista`): "O {Diário da Bola | Jornal da Arquibancada | Rádio Torcida FM} ligou…". **Duas perguntas**: uma sobre o clube, uma "da rua", sorteadas evitando as da entrevista anterior. A mensagem fecha quando as duas são respondidas.
- "Time mal" = sequência ruim, ou posição no último quarto da tabela. Elogio ao clube com o time mal custa moral.
- **Elogio só sobe a relação com o clube até 70** (`TETO_ELOGIO`).
- Efeitos por opção (prestígio e moral na escala interna; "relação com a outra" em passos de 5):

| Pergunta | Opções → efeito |
|---|---|
| Diretoria | elogiar: clube +2 (moral −0,6 se mal) · cobrar investimento: clube −5, prestígio +0,2 · pedir a saída: clube −20, prestígio +0,6 |
| Temporada | elogiar: +1 (−0,4 se mal) · criticar: −6, +0,2 · em cima do muro |
| Técnico | bancar: +2 (−0,4 se mal) · pedir demissão: −4, +0,2 · "quem decide é a diretoria" |
| Ingresso mais caro | bancar o aumento: +2 e moral −0,6 sempre · reclamar: −5, +0,2 · não entrar nessa |
| Elenco | defender: +1 (−0,4 se mal) · cobrar nome a nome: −3, +0,2 · "é dentro do vestiário" |
| Venda de mando | apoiar: +2 e moral −0,6 · condenar: −5, prestígio +0,4 · "a torcida vai de qualquer jeito" |
| Programa de sócio | apoiar: +2 (−0,4 se mal) · criticar: −4, +0,2 · sem opinião |
| Confusão no último jogo (só se houve briga recente) | assumir e prometer paz: clube +3, prestígio −0,2 · "foi provocação": −3, +0,4 · não comentar |
| Elenco piorou na virada (até a semana 18, variação de força ≤ −2) | cobrar reforço: −4, +0,2 · bancar: +2 e moral −0,4 · esperar |
| Elenco melhorou (variação ≥ +2) | dar crédito: +2 · conter a euforia · "título ou nada": −2, +0,2 |
| Coirmã (outra torcida do mesmo clube) | peitar: relação −5 com ela, prestígio +0,4 · "cabe todo mundo": +5 · ignorar |
| Relação com a rival/aliada | "em paz": +5 · "rixa de verdade": −5, prestígio +0,2 |
| Tombo do clube da rival (perdeu por 2+ gols) | esfregar: −10, moral +0,6 · deboche: −5, moral +0,4 · não comentar |
| Ranking das organizadas | cravar que somos a maior: −5 com a líder, moral +0,6 · "número não mede raça" · reconhecer: +5 com a líder |
| Bar quebrado (até 12 semanas) | bar nosso: prometer resposta (−10 com o atacante, moral +0,6). Fomos nós: assumir (−10, +0,6). De terceiros: tirar onda (−10, +0,4) ou "bar de torcida não se mexe" (+5) |
| Boato de pedido a aliado | confirmar: prestígio +0,2 · negar |
| Fama de violenta | negar · "só nos defendemos": +0,2 · assumir: prestígio +0,4, clube −3 |
| Faixa de cobrança | "vamos": prestígio +0,4, clube −3 · "momento de apoiar": clube +1 (−0,6 se mal) · depende |
| O que a arquibancada prepara | prometer festa: clube +1 · surpresa: prestígio +0,2 · "sem resultado não tem festa": clube −2, +0,2 |

### 9.7 A reunião mensal e a pauta

`E.reuniao = {pauta[], seq, ultima}`. No **dia 5** de cada mês (`reuniaoDeHoje`):

1. **Pautas velhas não decididas fecham sozinhas**: aniversário próprio → "não fazer nada" (moral −2); assalto → deixar quieto; convites de mês anterior → todos "não ir" (relação −6 e prestígio −0,4 cada).
2. **Pautas novas** (`pautar`; cada item tem `id, chave, tipo, rot, voz, texto, botoes, decidido, consequencia, quem` — o diretor responsável, em rodízio entre os diretores não presos, fora o presidente):

| Pauta | Quando entra | Botões → efeito |
|---|---|---|
| **Aproximação** | 1 mês em 3 (hash); há aliada nossa que é aliada de uma torcida neutra para nós (não maior rival de aliada nossa; passa pelas regras de eixo) | **Aproximar**: relação com a neutra vira `max(atual + 15, 25)`; +3 com a intermediária · **Deixar como está**: −3 com a intermediária |
| **Fim de treta** | 1 mês em 2; aliada nossa é aliada de uma rival nossa (não a maior rival) | **Encerrar a treta**: relação com a rival vira 0; +3 com a intermediária · **Rival continua rival**: −3 |
| **Cobrança de aliada** | 1 mês em 3; duas aliadas nossas são rivais entre si | **Largar a X**: relação com X vira 0; +3 com a que cobrou · **Continuar com as duas**: −3 |
| **Bote no bar** | 35% por mês; há bar de rival com relação ≤ −15 | **Marcar o bote**: entra em `E.botes` para um dia livre do mês (2+ dias à frente, sem outro bote a 2 dias) · **Deixar quieto**: prestígio −0,2, moral −1 |
| **Bote na casa de piscina** | 35% por mês; rival da praça tem faixa ou bandeira; a resenha é de uma Zona, num bairro da zona | idem; vencendo, toma a faixa (ou a bandeira) |
| **Onde a gente recruta** (só modo completo) | todo mês | três bairros sugeridos (ou qualquer bairro, pela lista): grava `E.recrutamento.bairro` — novato passa a morar ali e o peso do recrutamento é o daquele bairro |
| **Convites de festa** | há aliada (irmã ou relação ≥ 20) aniversariando até o dia 4 do mês seguinte | por aliada: **ir** — R$ 2.000, relação +8 (metade a cada repetição no ano), agradecimento público no dia seguinte à festa · **não ir** — relação −6, prestígio −0,4 |
| **Aniversário da torcida / do clube** | o aniversário cai até o dia 4 do mês seguinte | torcida: **Festa grande** R$ 20.000, moral +2, receita no dia de 20.000 a 40.000 · **Festa simples** R$ 5.000, moral +1, receita 4.000–8.000 · **Nada** moral −2. Clube: grande R$ 10.000 (10.000–20.000), simples R$ 3.000 (2.000–5.000), mesmas morais |
| **Alvos de assalto** | 9 meses em 12 (hash); há diretor disponível e 2+ membros disponíveis | **Planejar o assalto** → tela (6.5) · **Deixar quieto** |
| **Convite de eixo** / **Nome na mesa** | eventos de `TO.eixos` | **Entrar no eixo** (vira aliada de todos, rival dos maiores rivais do eixo) / **Ficar de fora** (−3 com a porta-voz; chamam de novo em meio ano) · **Aceitar no eixo** / **Vetar** |

3. **Modo completo**: sai a mensagem `reuniao` ("Reunião da diretoria — {mês}. N assuntos na mesa."), mesmo sem assunto se ainda cabemos em mais um eixo. A tela da reunião mostra presidente, diretores e pautas; `decidirPauta` aplica o botão; `fecharReuniao` tira da pauta o que foi decidido.
4. **Modo rápido**: não há mensagem `reuniao`; os itens são criados (menos "Onde a gente recruta") e `pautaSoltaDeHoje` entrega **um por dia**, na ordem bote → assalto → aniversário → festas → resto. Bote vira direto `barrival`/`casarival` para agora (só em dia comum); convites viram `convites` com peso de decisão; o resto vira `pauta`.

**Botes marcados** (`boteDeHoje`): no dia, se não for dia comum, adia para o próximo dia livre (até 10 dias); senão entrega `barrival` ou `casarival`. Botes dos tipos `treta` e `reuniao` só são marcados como feitos (desligados).

### 9.8 Brigas de bairro

`planoDosBairros(E)` sorteia, a cada mês (com a semente do save), **três datas** com pelo menos 3 dias entre elas: uma vez **nossa** e duas vezes **contra**. `bairroDeHoje` entrega a primeira vez vencida, em dia comum.

**Vez nossa** (`alvoNosso`):

- Candidatos: bairros da nossa cidade que têm "defensora" (`dominio.defensoraDe`) fora de trégua.
- Nota do bairro: `nossa parte na barra × 3 + 2 se é vizinho de bairro nosso + ruído (0 a 3,3)`. Vai o de maior nota.
- Tipo da cena: `jogo` (50%, só se a rival joga fora hoje); senão `praca` (60%) ou `bobeira` (40%).

**Vez contra** (`alvoContra`):

- Bairro: um dos nossos (ou o da nossa sede).
- Atacante: torcida presente na cidade que não é amiga, sem trégua e com pelo menos 2 membros ali. Prioridade: a maior torcida cuja **sede fica num bairro que é nosso** ("eles querem de volta"); senão a de maior nota: `parte dela no bairro × 4 + 3 se é rival + membros/100 (até 3) + ruído`.
- Tipo: `praca` (60%) ou `bobeira` (40%).

**Cena por classe do bairro** (`cenaDoBairro`): a classe do bairro (`Nobre` → nobre; `Classe Média` → média; qualquer outra → popular) escolhe o cenário; com mais de uma opção, o bairro tem a sua fixa (hash).

| Classe | `praca` (reunião) | `jogo` (vendo o jogo) | `bobeira` |
|---|---|---|---|
| Popular | `bairro-f4` (a pracinha) | `bairro-f2` (o bar da lagoa) | `bairro-f3` (os becos) |
| Média | `bairro-m1` (a quadra do parque) ou `bairro-m2` (a praça do lago) | `bairro-m3` (o quiosque da praça) | `bairro-m1-rua` (a rua do parque) |
| Nobre | `bairro-n1` (a praça) ou `bairro-n3` (o campo society) | `bairro-n3-bar` (o barzinho do society) | `bairro-n2` (o corredor comercial) |
| Sem classe / cenário ausente | `treta-campo` | `treta-galpao` | `treta-beco` |

**Efetivos — o ataque sorteado**: o lado da casa são os **moradores** do bairro (`elenco.noBairro`: até 15, ou 7 na bobeira; se morarem menos de 3, completa com gente da mesma zona). O teto do atacante é `floor(moradores × 1,6)`, mínimo 2 (`elenco.ataqueContra`); na vez contra, o tamanho com que eles vêm é sorteado entre `ceil(moradores × 0,7)` e esse teto (`elenco.ataqueSorteado`; a aplicação é da tela/cena — não confirmado em detalhe).

Resultado: `acoes.fecharBairro` (6.4) e o ponto na barra do bairro (`dominio.confronto`, fora do escopo). "Ninguém desce": 1 ponto para eles, moral −0,6, prestígio −0,7, relação −6.

### 9.9 Ataques, emboscadas e demais eventos gerados pelo feed

**Ataque-surpresa da rival** (`eventoDoTrimestreHoje` + `ataqueSofridoHoje`):

- A agenda da rival (`relacoes.eventoDeHoje`) pede um ataque do tipo `bar` ou `casa` (o tipo `treta` é ignorado — desligado).
- Condições: rival da praça que não desistiu de nós e sem trégua; nenhum outro ataque marcado na semana; ela tem pelo menos 50% do nosso número de aptos em gente disponível; para `casa`, precisamos ter faixa ou bandeira.
- Marca `E.ataqueMarcado = {torcida, nome, alvo, cena ('bar' | 'casa-piscina'), zona, bairro, ano, semana, dia}` e passa pelo aviso do olheiro.
- No mesmo dia sai `sofrido`. Textos por alvo: bar ("Invadiram nosso bar!"), casa ("…invadindo a resenha da Zona X"), reunião, subsede.
- Ataques na **concentração**, na **pista** e **emboscadas** não geram `sofrido`: aparecem como parada do itinerário do dia de jogo (7.13).

**Subsede de outra cidade**:

- Ataque à nossa subsede (`filialDeHoje`): cada filial tem **0,3% de chance por dia** (0,5% × freio 0,6) se o núcleo tem 4+ aptos, não é dia do nosso jogo e não há ataque marcado na semana. Atacante: uma das 3 de pior relação (≤ −15) entre torcidas locais com 6+ disponíveis e subsedes hostis com 6+. Relação −8 e `sofrido` na hora.
- Sugestão de ataque (`filial-ataque`): a cada 12 semanas por filial.
- Bote na caravana rival (`filial-caravana`): quando planejamos investida no jogo da cidade da filial.
- Caravana da filial (`caravanaDasFiliais`): no dia do jogo cobra a caravana de cada núcleo que viaja; **3%** de chance (5% × 0,6) de emboscada, resolvida por simulação, contra a rival de pior relação da cidade de destino.
- Hospedagem (`hospedagemDaFilialSemana`): toda terça, aliadas (relação ≥ 20) que visitam uma cidade com subsede nossa na semana ganham +2 de relação.

**Dívidas e vingança** (`registrarConfronto`): perder uma briga (sem empate) grava `E.dividas[rival] = {ano, semana, mes, cidade, onde}`; vencer apaga. Perder **atacando** uma torcida com quem tínhamos dívida = "vingança frustrada": moral −1,0, prestígio −1,0 e a dívida some. O espelho vale para as IAs (dívida delas conosco; cobrança frustrada tira moral e prestígio delas).

**Registro de toda briga nossa** (`registrarConfronto`): zera o relógio da paz; anota a briga nos dois lados; desconta as baixas da IA; define empate (não ganhamos e caídos iguais); aplica o domínio do bairro; conta `E.brigasCom[rival]` (para a trégua); guarda em `E.nossasBrigas` (40) e, se foi vitória com 3+ feridos de diferença e o dobro, em `E.brigasMemoraveis` (120, alimenta o #TBT); anota no almanaque; propõe o `confronto`; dispara os posts da rede.

**Obras da cidade** (`registrarObra`): compras e ampliações nossas e das torcidas da nossa cidade (bar, loja, subsede, sede, fábrica, filial, presente de sede) entram em `E.obrasDaCidade` (12) e viram notícia `obra`, uma por dia. Bares quebrados em ataque entram em `E.baresQuebrados` (6) e alimentam a pergunta da entrevista por 12 semanas.

**Assaltos** (`assaltoDeHoje`): todo dia esfria o calor da polícia em 1,5. No dia da operação: se não é dia comum, adia; se falta gente, cancela e avisa; senão entrega `assalto-dia` no horário do plano (09:10, 15:30 ou 19:35). Regras do assalto em 6.5.

**Almanaque e retrospectiva** (`almanaqueDoDia`): as páginas da virada do ano viram `E.retrospectiva` (a tela abre e segura o relógio); aberturas de competição e campeões viram mensagens `almanaque`.

**Status de relação** (`statusDeHoje`): uma pergunta por semana, priorizando torcida da nossa cidade, só para torcidas com laço conosco (relação de base não neutra, mesma cidade, cidade de filial nossa, já brigamos, ou mesmo eixo). Se recusamos há menos de 12 semanas, a relação é simplesmente devolvida à beira (−16 ou +20) sem perguntar.

**Pauta dos jogos** (`pautaDosJogos`, `pautaDaCidade`): monta, para a tela de planejamento da semana, os jogos da nossa cidade (e das cidades de filial), com as torcidas que estarão na rua, a faixa de efetivo de cada uma, quem é hostil, e as aliadas que chegam.

## 10. Tutorial e os protótipos "Desenvolvimento" e "Influência"

### 10.1 Tutorial (`js/gestao/tutorial.js`, `TO.tutorial`)

- **Entrada**: a primeira mensagem do jogo novo (`kind:'tutorial'`) oferece "Mostra o jogo" ou "Já sei jogar — pular". Pular grava `E.tutorial = {feito:true, pulou:true}`. `TO.tutorial.iniciar()` é a única função pública.
- **Parte 1 — passeio pelas telas**: pausa o tempo (`pausarTempo('tutorial')`), abre um balão fixo "Diretoria · passo a passo" com contador "Passo N de 15", botão **Avançar →** e **Pular o resto**. Em cada passo abre o painel e a aba correspondentes e circula os elementos citados.

| Passo | Tela | O que explica |
|---|---|---|
| 1 | Indicadores · Prestígio | o respeito no universo das torcidas; sobe vencendo brigas, com patrimônio e dominando rivais |
| 2 | Indicadores · Moral | satisfação do membro; alta = mais presença em jogo e briga |
| 3 | Indicadores · Recrutar | a fase do clube dita a facilidade de recrutar |
| 4 | Indicadores · Relações | nível de relação com cada torcida |
| 5 | Feed | "o feed é onde o jogo acontece": decisões com opções e consequências |
| 6 | Torcida · Membros | força, defesa, cargo, XP, feridos e presos |
| 7 | Financeiro · Patrimônio (1 de 2) | sede com bar embutido; lojas, bares e subsedes; o nível da sede limita o patrimônio |
| 8 | Financeiro · Patrimônio (2 de 2) | treinadores de luta e advogados |
| 9 | Calendário · Expediente da Sede | a ação passiva da torcida; calendário dos times |
| 10 | Competições | tabelas e jogos de todos os campeonatos |
| 11 | Ranking | a régua nacional das torcidas: "subir aqui é o objetivo do ano" |
| 12 | Diplomacia · Alianças | aliados ajudam e pedem ajuda |
| 13 | Diplomacia · Rivalidades | rivais procuram hostilidade na cidade, fora e na estrada |
| 14 | Notícias · Brigas | notícias do mundo e brigas IA × IA |
| 15 | Jogo | o cofre de saves: vaga, arquivo ou texto |

- **Parte 2 — briga de demonstração**: o último "Avançar" vira "Fechar com a briga →" e abre uma cena de briga sem custo (`TO.tela.abrirBrigaDoTutorial`), com quatro balões em sequência:
  1. **A pista**: mover com WASD (ou o direcional no toque) — cumpre ao teclar/tocar.
  2. **A porrada**: não se clica para bater, basta encostar — botão "Entendi".
  3. **O arsenal**: `Q` joga pedra, `E` joga bomba — cumpre ao usar.
  4. **A fuga**: o rival corre quando perde uma porcentagem dos envolvidos — botão "Entendi — terminar o serviço".
- **Desfecho**: "A rival correu!" (vitória) ou "Fim da demonstração" (derrota, sem custo), com **Brigar de novo** e **Voltar pro jogo**.
- **Fim** (`terminar`): grava `E.tutorial = {feito:true, pulou}`, salva e retoma o tempo.
- Há ainda as **dicas** do primeiro mês (mensagem `dica`, 9.3), independentes do tutorial.

### 10.2 O que são os protótipos

`js/prototipo/desenvolvimento.js` e `js/prototipo/influencia.js` **não são carregados pelo jogo principal** (`index.html`). Só entram em **`desenvolvimento.html`**, página gerada a partir do `index.html` por `ferramentas/gerar_desenvolvimento.py`, que:

- carrega o jogo inteiro mais os dois scripts;
- redireciona o `localStorage`: toda chave `torcida-organizada:…` vira `torcida-organizada-desenv:…` — **o save do protótipo é separado** do save do jogo normal;
- cada protótipo se registra como página do menu por `TO.ui.registrarPagina` (antes da página "Jogo") e se pendura nos ganchos `estado.aoFecharSemana` e `estado.aoMudar`.

No jogo principal nada disso roda; os campos `E.desenv` e `E.influencia` só existem em saves do protótipo.

### 10.3 Protótipo "Desenvolvimento da Torcida" (`TO.desenvolvimento`)

Uma árvore de estudos pagos com **pontos de desenvolvimento (PD)** ganhos por semana.

**Estado** `E.desenv = {pd, atual, prog, progs, feitos[], turnos, ultimaSemana, ultimoDia, rendeu{…}, ia{}, cidadesNovas[], marcos{}, historico[]}`.

**Renda semanal de PD** (`fontes`):

| Fonte | Valor |
|---|---|
| Velha guarda | `0,5 × min(1; (velha guarda ÷ membros) ÷ 5%)` (8% com "Velha guarda professora") |
| Diretoria | `0,4 × min(1; (diretores ÷ membros) ÷ 6%)`; +0,2 com "Velha guarda professora" |
| Sede | por nível 0–6: 0,5 / 0,6 / 1,3 / 1,6 / 1,8 / 2,8 / 3,2 |
| Turnos de estudo | 0,15 por turno "Estudar" na semana, até 3 |
| Multiplicador | moral abaixo de 8: ×0,85; de 8 a 13,99: ×1; 14+: ×1,15; "Biblioteca da sede": ×1,1 |

- O saldo guardado tem teto de `renda semanal × 52 + 60`.
- **Custo** por degrau 1/2/3: **24 / 36 / 48 PD**. Desconto de 1% por torcida da IA que já tem o estudo (3% se a relação com ela é ≥ 45), até 10%.
- **Requisitos**: o degrau anterior da mesma trilha; sede nível 2 para o degrau 2 e nível 4 para o degrau 3.
- Um estudo em curso por vez (`escolher`); o progresso de um estudo trocado fica guardado; ao concluir, o próximo da trilha começa sozinho se estiver liberado.
- Ação nova no expediente: **"Estudar (Desenvolvimento)"**, grátis, até 3 turnos por semana.

**Os 39 estudos** (6 áreas, 13 trilhas, 3 degraus cada):

| Área · trilha | Degrau 1 | Degrau 2 | Degrau 3 |
|---|---|---|---|
| Pista · Doutrina de rua | Treino coletivo: treino rende +20% | Linha de frente firme: frente e diretoria +0,6 de força e defesa | Bonde disciplinado: novatos e componentes +0,6 de defesa |
| Pista · Material de rua | Bomba caseira: bomba 20% mais barata | Esconderijo: saque no nosso bar leva 25% menos | Arsenal próprio: +2 bombas por mês |
| Estrada · Logística | Rateio organizado: caravana 15% mais barata | Lanche no ônibus: toda caravana paga dá +0,2 de moral | Frota cuidada: custo dos ônibus −40% |
| Estrada · Hospitalidade | Casa de irmão: receber aliada custa 30% menos | Rede de aliadas: relação com cada aliada (45+) sobe +1 por mês | Estrada conhecida: toda caravana paga dá +0,1 de prestígio |
| Arquibancada · Festa | Mosaico em série: festas de arquibancada 15% mais baratas | Coro ensaiado: as festas empurram o time 25% a mais | Bateria de respeito: o treino de bateria vale 14 dias |
| Arquibancada · Identidade | Hino próprio: todo ganho de prestígio +10% | Faixa costurada em casa: faixa e bandeira 25% mais baratas | Orgulho de pertencer: toda perda de moral pesa 20% menos |
| Negócio · Bar e loja | Chope próprio: receitas do comércio +8% | Estamparia: despesas do comércio −10% | Marca da torcida: receitas +12% (com o Chope, +20%) |
| Negócio · Finanças | Sócio-torcedor: mensalidades +10% | Rede de simpatizantes: doação +50% | Contabilidade: professores e advogados 10% mais baratos |
| Organização · Saúde e jurídico | Fisioterapia: ferido novo volta 2 dias antes | Jurídico: pena nova 20% menor e fiança 20% mais barata | Plano de saúde: todo ferido sara 1 dia a mais por semana |
| Organização · Disciplina | Disciplina da velha guarda: a ferrugem da paz tira metade | Biblioteca da sede: +10% de PD | Velha guarda professora: ótimo da velha guarda em 8% e +0,2 PD da diretoria |
| Massa · Recrutamento | Peneira: chance de recrutar +25% | Peneira técnica: novato chega com +1,5 de força e defesa (até o teto) | Portas abertas: chance +25% (com a Peneira, +50%) e um novato garantido por mês |
| Massa · Torcedores do clube | Escolinha de torcedor: torcida do clube na cidade +0,5% por mês | Caravana no interior: +0,5% por mês nas cidades das subsedes | Bandeira fincada: surge torcida do clube numa cidade sem torcedor (60 / 30 / 15 conforme o porte), abrindo a possibilidade de subsede |
| Massa · Elenco do clube | Olheiros da torcida: reforço no elenco 15% mais barato | Vaquinha pro elenco: +1 de força no elenco a cada 6 meses | Categoria de base: +1 de força a cada 3 meses |

**Como os efeitos entram**: o protótipo **embrulha** funções do jogo em tempo de execução — `estado.lancar` (multiplica o valor conforme o texto do lançamento: "Bombas", "Caravana", "Ônibus", "Recepção da", "Festa na arquibancada", "Faixa nova", "Professor", "Advogado", "Fiança de", "Reforço no elenco", "Mensalidades", "Doação de simpatizante"), `estado.lancarNoResumo` (comércio), `estado.mexerIndicador` (prestígio e moral), `dominio.pesoDoRecrutamento`, `festas.usarNoJogo` — e roda rotinas por dia (`porDia`), por semana (`porSemana`) e por mês (`porMes`).

**IA**: cada torcida do mundo ganha `(PD da sede + 0,4) × multiplicador da moral` por semana, escolhe estudos ao acaso entre os liberados e recebe efeitos simplificados (ficha média por cargo, caixa, membros, prestígio, moral, penas, torcedores, força do elenco).

**Tela**: página "Desenvolvimento" com resumo, árvore por área e o que os estudos já renderam (`E.desenv.rendeu`).

### 10.4 Protótipo "Influência dos eixos" (`TO.influencia`)

Um sistema de disputa de **apoio** entre os eixos de aliança (`TO.eixos`), rodado uma vez por semana (`semana(E)`).

**Estado** `E.influencia = {apoio{torcida: {eixo: %}}, hist[], nossa{auto, alvos[], defesa, bandeira}, semana, ult, avisos}`.

**Constantes**:

| Constante | Valor | Significado |
|---|---|---|
| `POTENCIAS` / `MULT_POTENCIA` | 7 / 1,5 | as 7 torcidas de maior PI de cada país têm o PI × 1,5 |
| `ALIADA` | 20 | só se influencia quem tem relação ≥ 20 conosco |
| `GANHO` | 3 | pontos de apoio por semana por PI de campanha, sobre `(PI do alvo + 5)` |
| `BASE_CASA` / `BASE_SEM_EIXO` | 0,5 / 1 | deriva semanal a favor do(s) eixo(s) de casa / de "sem eixo" |
| `ALVOS_IA` / `ALVOS_NOSSOS` | 4 / 3 | quantas torcidas cada um trabalha por semana |
| `DEFESA_IA` | 10% (tranquila) / 30% (apoio da própria bandeira abaixo de 60) | fatia do PI gasta em defesa |
| `RESIST_MAX` / `SEM_EIXO_RES` | 0,6 / −0,3 | teto da resistência; torcida sem eixo é 30% mais fácil de virar |
| `INCLINA` | 50 | apoio a um eixo de fora acima disso: as relações começam a andar |
| `ENTRAR_MIN` | 30 | apoio mínimo para entrar num eixo |
| `TRAICAO` | 50 | sair de um eixo tira 50 de relação com cada membro (até o neutro) |
| `DERIVA_REL` | 1,5 (até 3) | relação por semana quando inclinada |
| `EIXOS_MAX` | 8 | teto de eixos ativos por país |

**A semana**:

1. **Pontos de influência (PI)** de cada torcida: `membros^0,85 ÷ 10 × (0,6 + prestígio ÷ 25) × (1 + nível da sede × 0,1)`; potências ×1,5.
2. Cada torcida com eixo levanta uma **bandeira** (o eixo que ela promove: o de maior apoio interno; a nossa pode ser escolhida) e gasta `PI × (1 − defesa)` em campanha, dividida entre os alvos. A IA escolhe até 4 aliadas (relação ≥ 20, do mesmo país) pelo peso `(relação − 10) ÷ 50 × (1,5 − apoio atual ÷ 100) × √(membros + 4)`. Nós: automático (até 3) ou alvos escolhidos à mão (até 3; nossa defesa padrão 25%).
3. Em cada torcida, o apoio a cada eixo sobe `pontos recebidos × 3 ÷ (PI dela + 5)`, multiplicado por `(1 − resistência)` se o eixo é de fora. Resistência = `0,1 + 0,25 × min(1; membros ÷ 500) + defesa`, entre −0,3 e 0,6. Soma-se a deriva da casa e normaliza-se para 100%. Apoio inicial: sem eixo 100% "sem eixo"; um eixo 80/20; dois eixos 65/25/10.
4. **Consequências** (só para a IA): apoio a um eixo de fora acima de 50 → a relação com os membros desse eixo sobe (até 60) e com os do eixo de casa cai (até 0); se menos da metade do eixo de casa ainda é aliada, **sai** dele; apoio ≥ 30 e vaga → **entra** no eixo de fora. Eixo que fica com um membro só é dissolvido.
5. **Para nós**: se um eixo de fora tem mais apoio dentro da nossa base do que a nossa bandeira → moral −0,3 na semana ("a nossa base está dividida").
6. Eventos (`entrou`, `saiu`, `inclinou`, `pressao`, `dissolveu`) vão para `hist` (120) e viram avisos de tela.

**Tela**: página "Influência dos eixos", com a nossa campanha, as aliadas e o apoio ao nosso eixo em cada uma, e o quadro dos eixos.

### 10.5 Ligação com o jogo principal

| Item | Situação |
|---|---|
| Scripts carregados em `index.html` | não |
| Página própria | `desenvolvimento.html` (gerada; não editar à mão) |
| Save | gaveta separada (`torcida-organizada-desenv:`) |
| Como altera as regras | embrulhando funções de `TO.estado`, `TO.dominio`, `TO.festas` e acrescentando a ação "Estudar" a `TO.acoes.LISTA`, só dentro da página do protótipo |
| Portas deixadas no jogo principal | `TO.ui.registrarPagina` (em `main.js`), que no `index.html` ninguém chama |

---

# PARTE III — O MUNDO: TORCIDAS, RELAÇÕES, DOMÍNIO E FUTEBOL

Estado descrito: o código atual de `js/mundo/*.js` e a forma dos dados em `dados/*.js`. Tudo vive no global `TO` (`TO.dados.*` para dados, `TO.mundo`, `TO.relacoes`, `TO.dominio`, `TO.eixos`, `TO.praca`, `TO.relacaoClube`, `TO.competicoes`, `TO.ligas`, `TO.conmebol`, `TO.almanaque`, `TO.gazeta`, `TO.porrada`, `TO.mapa`, `TO.mapaGerado`, `TO.elenco`). `E` é o save (estado da partida).

Convenções usadas no texto:

- **Relação**: número de −100 a +100 entre duas torcidas.
- **Indicadores** (moral, prestígio): régua interna de 0 a 20; a tela mostra ×5 (0 a 100). Quando o texto diz "+0,6 de moral" é na régua 0–20.
- **Semana absoluta** (`relacoes.js: semanaAbs`): `(ano − 2026) × 52 + semana`. O ano tem 52 semanas de 7 dias (dia 1 = segunda … 7 = domingo). `E.data.absoluto` é o dia corrido.
- **Hash determinístico**: FNV-1a de 32 bits (`mapa.js: hash`, igual em `dominio.js: hash`): `h = 2166136261; para cada caractere: h ^= código; h = imul(h, 16777619) >>> 0`. Onde o texto diz "por hash", o resultado é o mesmo em todo save/carregamento.
- **(desligado)** = a função existe mas não faz nada ou nunca é chamada. **(não confirmado)** = não verificado fora dos arquivos lidos.

---

## 1. O mundo e os dados

### 1.1 Quantos há de cada coisa

| Coisa | Quantidade | Onde |
|---|---|---|
| Países | 10 (Brasil + Argentina, Bolívia, Chile, Colômbia, Equador, Paraguai, Peru, Uruguai, Venezuela) | campo `pais` de `times.js` |
| Clubes | 356 (108 do Brasil, 248 de fora) | `dados/times.js` |
| Praças (cidades jogáveis) | 94 (30 do Brasil em `cidades.js` + 64 de fora, empurradas por `barras.js`) | `TO.dados.cidades` |
| Bairros | 973 (353 no Brasil, 620 fora) | `cidade.bairros` |
| Torcidas | 387 (139 brasileiras em `torcidas.js` + 248 "barras" em `barras.js`) | `TO.dados.torcidas` |
| Estádios mapeados | 72 (só Brasil) | `dados/estadios.js` |
| Rodovias/rotas da malha | 48 (19 `BR`, 22 `CONMEBOL`, 7 `INT` de fronteira) | `dados/malha.js` |
| Eixos de aliança de nascença | 5 | `dados/eixos.js` |

Clubes por divisão (`time.divisao`):

| Divisão | Clubes | | Divisão | Clubes |
|---|---|---|---|---|
| Brasileirão Série A | 20 | | Argentina Primera | 30 |
| Brasileirão Série B | 20 | | Argentina Primera Nacional | 38 |
| Brasileirão Série C | 20 | | Argentina Primera B | 20 |
| Brasileirão Série D | 48 | | Bolívia Primera | 16 |
| Chile Primera | 16 | | Chile Primera B | 16 |
| Colômbia Primera A | 20 | | Colômbia Primera B | 16 |
| Equador Serie A | 16 | | Paraguai Primera | 12 |
| Peru Liga 1 | 18 | | Uruguai Primera | 16 |
| Venezuela Primera | 14 | | | |

Clubes brasileiros por regional (`time.regional`): Cariocão 10, Paulistão 10, Paulistão A2 10, Copa do Nordeste 16, Nordestão Série B 18, Mineiro 6, Gauchão 8, Paranaense 6, Catarinense 6, Copa Norte 8, Copa Centro-Oeste 10. Clube de fora tem `regional:""` e o campo `copa` com o nome da copa nacional (ex.: `"Copa Argentina"`).

Torcidas por país: Brasil 139 (Nordeste 47, Sudeste 47, Sul 25, Centro-Oeste 10, Norte 10), Argentina 88, Colômbia 36, Chile 32, Peru 18, Uruguai 16, Equador 16, Bolívia 16, Venezuela 14, Paraguai 12. Cada clube de fora tem exatamente 1 barra; no Brasil, 29 clubes têm mais de uma organizada. Todo clube tem pelo menos uma torcida (356 clubes com torcida).

Praças: 10 `Grande` (nível 1, 16 bairros, grade 14×14), 35 `Médio` (nível 2, 12 bairros, grade 10×12), 49 `Pequeno` (nível 3, 8 bairros — uma tem 9 —, grade 8×8). Por região: Sudeste 9, Nordeste 10, Sul 6, Centro-Oeste 3, Norte 2; Argentina 22, Colômbia 9, Chile 8, Equador 5, Bolívia 5, Uruguai 4, Peru 4, Venezuela 4, Paraguai 3. Uma praça pode ser uma cidade ("Fortaleza"), parte de uma cidade ("Subúrbio Carioca", "Buenos Aires Sul") ou uma região ("Interior de SP", "Oruro e Potosí"); teto de 7 clubes por praça de fora.

### 1.2 O registro de um clube (`dados/times.js`)

```js
{id:"flamengo", nome:"Flamengo", nomeCompleto:"Clube de Regatas do Flamengo",
 sigla:"CRF", alcunha:"Mengão", cidade:"Rio de Janeiro", uf:"RJ",
 estadio:"Maracanã", capacidade:78838, cores:["#c8102e","#151515"],
 fundacao:1895, mascote:"Urubu", qualidade:50,
 divisao:"Brasileirão Série A", mapa:"rio-de-janeiro",
 regional:"Cariocão", pais:"Brasil"}
```

- `qualidade` é a força inicial do elenco: de 4 a 50 na fonte (Flamengo = 50; Boca e River = 36). A régua do jogo vai de 1 a 100 (`competicoes.js: FORCA_MIN/FORCA_MAX`).
- `mapa` é o id da praça onde o clube manda os jogos. `uf` de clube de fora é a sigla do país (AR, BO, CL…).
- `dados/fundacoes.js`: `{clubeId:[dia, mês]}` para 215 clubes — aplicado por cima de `times.js` na carga; clube fora da lista tem o dia sorteado por hash.
- Ids que colidiam entre países levam sufixo (`nacional-uru`, `guarani-par`, `u-catolica-equ`).

### 1.3 O registro de uma torcida (`dados/torcidas.js`, `dados/barras.js`)

```js
{id:"alianca", nome:"Aliança", clube:"Ceará", clubeId:"ceara",
 sigla:"CSC", siglaTorcida:"ALIANCA", cidade:"Fortaleza", mapa:"fortaleza",
 uf:"CE", regiao:"Nordeste", estadio:"Arena Castelão", divisaoClube:2,
 bairroSede:"Pirambu", fundacao:2018, fundacaoMes:5, fundacaoDia:20,
 cores:["#FFFFFF","#000000"], detalhe:"#000000",
 membros:20, sedeNivel:1, moral:60, prestigio:15, saldo:200, poder:28,
 cargos:{povao:10, componentes:6, frente:3, diretoria:1},
 aliados:[…27 ids], irmandade:[…4], rivais:[…61], maioresRivais:["jovem_garra_tricolor","leoes_da_tuf"]}
```

| Campo | Significado |
|---|---|
| `sigla` | sigla do **clube** (não da torcida) |
| `siglaTorcida` | sigla da torcida (384 das 387 têm); sem ela, deriva-se do nome (1.6) |
| `mapa` | id da praça onde mora |
| `regiao` | região do Brasil; nas barras, o **nome do país** |
| `divisaoClube` | 1–4 (A–D) — só usado como reserva para montar o texto da divisão |
| `bairroSede` | nome do bairro da sede (pode ser trocado na carga, ver 5.3) |
| `fundacao/Mes/Dia` | aniversário da torcida (384 têm dia/mês) |
| `membros` | efetivo inicial, de 20 a 250 |
| `sedeNivel` | 1 a 5 na fonte |
| `moral`, `prestigio` | na régua 0–100 da fonte (moral 60; prestígio 15 a 60) |
| `saldo` | caixa da fonte (≈ 10 × membros) |
| `poder` | número da fonte; só serve para sortear a `ousadia` da torcida do computador (3.1) |
| `cargos` | pirâmide da fonte: `povao`, `componentes`, `frente`, `diretoria` |
| `aliados`, `irmandade`, `rivais`, `maioresRivais` | listas de ids; o grafo é simétrico |
| `fora:true`, `origem` | marcam as barras (torcidas de fora do Brasil) |
| `incompleta` | campo previsto; hoje nenhuma torcida o tem |

Barras (`dados/barras.js`, gerado): mesmo formato, id com prefixo `b-` (ex.: `b-boca-juniors`, "La 12", 250 membros, `sedeNivel:4`, `prestigio:60`, `saldo:2500`). A barra nasce só com `rivais`/`maioresRivais` do próprio país (aliados e irmandade vazios), exceto os 13 "hermanamientos" com organizadas brasileiras: o arquivo empurra a barra para a `irmandade` da brasileira (ex.: `young_flu`↔`b-velez`, `independente`↔`b-colo-colo`, `forca_jovem_vasco`↔`b-universidad-de-chile`). O arquivo entra **depois** de `cidades.js` e `torcidas.js` e concatena nos mesmos vetores.

### 1.4 O registro de uma praça (`dados/cidades.js`)

```js
{id:"abc-paulista", nome:"ABC Paulista", uf:"SP", regiao:"Sudeste",
 nivel:2, tamanho:"Médio", quarteiroes:120, grade:[10,12], populacao:2700,
 temMetro:false, temPraia:false, temLagoa:false, vegetacao:"mata",
 estadios:["Estadio Bruno Daniel", …], rodovias:["Rodovia Sudeste 2"],
 multMedio:0.817, torcedores:60, guardas:1, pms:3, choque:0,
 bairros:[{id:"jardim", nome:"Jardim", zona:"Sul", classe:"Nobre", mult:1.5,
           sedes:[], cidade:"ABC Paulista"}, …],
 times:[{clube:"Corinthians", clubeId:"corinthians", sigla:"SCCP", perc:24,
         torcedores:648, estadioProprio:false, local:false}, …]}
```

- `times` é a lista de clubes que têm torcedores na praça (não só os que moram nela): `torcedores` = quantos torcedores do clube vivem ali; `local:true` = o clube é da casa. Praça de fora tem `fora:true`.
- `bairros[].cidade` (só nas praças brasileiras) diz a que cidade real o bairro pertence quando a praça junta várias cidades.
- `bairros[].sedes` = nomes das torcidas com sede no bairro (dado de exibição).

### 1.5 Bairros: zonas e classes

Zonas: `Norte`, `Sul`, `Leste`, `Oeste` (≈ 240 bairros em cada). Classes e multiplicador de renda (`bairro.mult`, lido por `mundo.js: multiplicador`):

| Classe | `mult` | Bairros | Peso de "povo" (5.9) |
|---|---|---|---|
| Nobre | 1,5 | 148 | 0,8 |
| Classe Média | 1,0 | 306 | 1,0 |
| Classe Baixa | 0,8 | 338 | 1,15 |
| Favela | 0,4 | 181 | 1,3 |

O `mult` multiplica a receita de bar, loja e subsede no bairro. `mundo.js: bairro(idCidade, nomeOuId)` acha o bairro por id ou por nome sem acento; `bairrosPorZona` agrupa por zona.

### 1.6 Estádios (`dados/estadios.js`)

```js
{id:"albertao", nome:"Albertão", mapa:"maranhao", bairro:"Teresina I",
 capacidade:44200, mandantes:["river"], apelidos:[…]}   // apelidos é opcional
```

`mundo.js: estadiosEm(idMapa)` devolve os estádios da praça e **completa** com os que os clubes da praça declaram em `time.estadio` e que não estão na lista (comparação pelo identificador do nome e dos `apelidos`). O estádio completado ganha `estimado:true`, capacidade do clube e um bairro fixo: `bairros[hash FNV do identificador do nome % nº de bairros]`. `estadioDoClube(id)` acha o estádio pela lista `mandantes`.

### 1.7 Quem é jogável e a ficha do jogador

- `mundo.js: jogaveis()` = torcidas sem `incompleta` (hoje, todas as 387).
- `selecionaveis()` = jogáveis cuja praça existe e tem bairros (hoje, todas as 387). Qualquer torcida de qualquer país pode ser comandada.
- `ficha(o)` monta o objeto que vira `E.torcida`:

| Campo da ficha | De onde vem |
|---|---|
| `id, nome, cores, detalhe, fundacao, membros, bairroSede, clube, clubeId, sigla, mapa, cargos` | cópia da torcida |
| `cidade` | nome da praça; `uf`, `regiao`, `estadio` (da torcida ou do clube) |
| `divisao` | `time.divisao` (ou "Série A–D" por `divisaoClube`); `regional` do clube |
| `grade`, `nivelCidade` | da praça (padrão `[8,8]` e 3) |
| `sedeNivel` | **0** se `membros ≤ 30` (a pequena começa no "ponto de encontro"), senão `sedeNivel` da fonte |
| `prestigio` (padrão 15), `moral` (60), `dinheiro` = `saldo`, `poder` | da fonte |
| `influencia` | `limitar(round(min(membros/250,1)×64 + min(torcedoresDaPraça/1060,1)×30), 1, 100)` |
| `territorios` | `max(1, round(membros/16))` |
| `rival`, `rivalMembros` | o **rival pareado**: entre `maioresRivais` + `rivais`, o de efetivo mais próximo do nosso (empate: o primeiro da lista) |
| `qtdAliados`, `qtdRivais` | tamanhos das listas (aliados+irmandade; rivais+maiores rivais) |

### 1.8 Siglas, cores e escudos

**Sigla da torcida** (`mundo.js: siglaTorcida`): usa `siglaTorcida` do dado; sem ela: nome de uma palavra vale inteiro em maiúsculas; nome de várias vira as iniciais, ignorando `da, de, do, das, dos, e, a, o, as, os, em, no, na`; número entra inteiro (Camisa 12 → C12) e palavra já em maiúsculas entra inteira (Leões da TUF → LTUF). `mundo.js: sigla(f)` (do clube) = `f.sigla` cortada em 4 letras, ou as iniciais do nome (3 letras).

**Sigla única na noite** (`praca.js: siglaUnica`): se duas torcidas na rua têm a mesma sigla, a segunda ganha letras da última palavra do nome, e por fim um número.

**Cores** (`mundo.js: coresDaTorcida`): junta `cores[]`, `detalhe` e as cores do **clube**, e devolve as três primeiras que sejam distintas (`cor`, `cor2`, `cor3`). Duas cores são "a mesma" se a distância euclidiana em RGB for menor que 60. Na noite de jogo (`praca.js: elencoDaNoite`), duas torcidas com o mesmo par `cor|cor2` são separadas clareando ou escurecendo a primária: fator `min(0,82; 0,26 + 0,20×(i−1))`, escurecendo se a luminância passa de 0,6. No mapa, a cor do texto sobre o pino (`mapa.js: corQueLeSobre`) é `cores[1]` ou `detalhe` se a diferença de luminância for ≥ 0,22; senão preto (`#151515`) ou branco (`#f2f2f2`).

**Escudos** (`dados/escudos.js`): manifesto `{clubes:{id:1}, torcidas:{id:1}}` dos arquivos `img/escudos/clube-<id>.png` e `torcida-<id>.png` — 138 clubes e 139 torcidas (as brasileiras). Sem escudo, a tela usa um quadrado de cor.

**Faixas reais** (`dados/faixas.js`): `{torcidaId:[larguras em px]}` para 95 torcidas; cada uma tem uma tira `img/faixas/<id>.webp` com faixas de 128 px de altura empilhadas. Fora da lista, a faixa é gerada com cores e nome.

**Capas** (`dados/capas.js`): manifesto das fotos `img/cidades/<id>.webp` — as 30 praças brasileiras. **Logos** (`dados/competicoes_logos.js`): nome da competição (e apelidos) → `img/competicoes/<arquivo>.png`, 48 entradas.

### 1.9 Torcedores do clube na praça (base viva)

- `mundo.js: torcedoresDoClubeNa(cidade, clube)`: valor corrente em `E.torcedoresEv["cidade|clube"]`; sem ele, `torcedores` da planilha.
- `baseDeRecrutamento(cidade, clube, vivos)` = torcedores do clube na praça − soma dos membros das organizadas daquele clube na praça (nunca menor que 0).
- **Virada do ano** (`evoluirTorcedores`):
  1. "Foi bem": G-4 e campeão da Série A, campeão das Séries B/C/D, quem subiu de série; nas ligas de fora: campeão, quem sobe e os 4 primeiros da tabela anual da 1ª divisão. "Foi mal": quem caiu, os 4 últimos da Série D; fora: quem cai e os 4 últimos da última divisão. Quem está nas duas listas fica neutro.
  2. Em **cada** praça, a torcida do clube que foi bem é multiplicada por `1 + (3 a 5)%`; a do que foi mal, por `1 − (3 a 5)%` (mínimo 1).
  3. A praça cresce: Grande +30 a 50 pessoas, Média +10 a 20, Pequena +5 a 10, repartidas entre os clubes da praça com pesos aleatórios `0,2 + rand()` (não proporcional).

### 1.10 Plantas das cidades e mapas

Há três fontes de geometria de cidade:

1. **`dados/plantas.js`** (30 praças brasileiras; gerado da planta do jogo 3D). Por praça: `w,h` (tamanho da imagem `img/mapas/<id>.webp`), `L` (retângulo do mundo coberto), `g` (grade de bairros: `x0,y0,cel,nx,ny` e `l` = uma lista por linha em corridas `[índice do bairro, quantas células]`, −1 = fora), `b` (bairros na ordem da grade: `[id, nome, zona, x, y]`), `r` (rótulos `[texto, x, y, 'e'|'c']` — etiqueta ou nome de cidade), `s` (sedes: `[torcida, sigla, x, y]`), `z` (centro de cada zona). O domínio usa essa grade para saber quais bairros são vizinhos e qual bairro fica na entrada da cidade (5.10).
2. **`dados/cidade_mapa*.js`** (`TO.dados.cidadeMapas`: Fortaleza, Belo Horizonte, São Paulo; `TO.dados.cidadeMapa` = Fortaleza, a "dona da foto"). Arte 1254×1254, `passo:10`: `bairros[{nome,id,zona,classe,mult,x,y,area}]`, `estadios[{x,y,w,h,bairro}]`, `andavel` (por linha, corridas alternadas não-andável/andável separadas por vírgula, linhas por `;`), `regioes` (um caractere base-36 por célula = índice do bairro + 1; `0` = fora), `lotes{índiceDoBairro:[[col,lin],…]}` (células onde cabe um pino).
3. **Planta gerada** (`mapa_gerado.js`, cap. 9) para todas as outras praças.

`dados/malha.js` — o mapa do Brasil e do continente: `TO.dados.malha` = 48 rodovias `{nome, fam:'BR'|'CONMEBOL'|'INT', seg:[[praça, praça, …], …]}` (cada `seg` é um corredor na ordem em que a caravana passa; praça vizinha é a próxima do corredor) e `TO.dados.malhaXY` = posição das 94 praças, `x=(lon+82)×20`, `y=(13−lat)×20`. O grafo de rotas do planejamento e a quilometragem saem daqui. A tela do mapa do Brasil (`js/ui/mapa_brasil.js`, fora deste livro) desenha o contorno do país com as 30 praças brasileiras pintadas na cor da dona da cidade.

### 1.11 Outros dados de apoio

| Arquivo | Conteúdo |
|---|---|
| `dados/cenas.js` | 37 cenas de briga desenhadas (1536×1024, célula 8): `praca`, `rua`, `rua-media`, `rua-nobre`, `bar`, `comercio`, `ct`, `casa-piscina`, `subsede`, `sede-1…5`, `treta-beco/galpao/campo`, `emb-posto`, `emb-onibus`, `estadio-10/20/40`, 11 cenas `bairro-*`, 3 `*-3d`, `praca-reuniao`. Cada uma: `blocos` (o que bloqueia e o que se pinta), `spawns`, `entradas`, `faixas`, `gatilho`, `saida` etc. |
| `dados/cenas_foto.js` | 38 cenas sobre foto: `{imagem, mascara (RLE de caminhabilidade), faixa, bocas, meio, topo, altura}`; correções em `cenas_editadas.js` |
| `dados/cena_arredores.js` | a cena dos arredores do estádio sobre foto aérea: polígonos `caminhavel/bloqueio`, `spawns`, `entradas`, `pmPostos`, `filas`, `grades` |
| `dados/assaltos.js` | 6 alvos de assalto (`roupas, mercadinho, posto, supermercado, joalheria, banco`): escala `M` (px por metro), zonas `loja/restrita`, `vidros`, `baixos`, porta, carro, olheiros, chegada da PM, funcionários, seguranças, clientes, `saque[]`, câmeras, alarmes |
| `dados/nomes.js` | `apelidos` (99), `simples` (38), `compostos` (18), `nomes` (400), `sobrenomes` (200), `hispano`, `arquetipos` (5) |
| `dados/historia.js` | campeões e vices reais por competição (24 chaves: Séries A–D, Copa do Brasil, Copa do Nordeste, 6 estaduais, Libertadores, Sul-Americana, `liga:<país>` ×9, `copa:Copa Argentina`): `{nome, nota, maiores:[[clube, títulos]], anos:[[ano, campeão, vice]]}` |
| `dados/genero.js` | gênero gramatical de competição, estádio, cidade, clube e fase (listas `f`/`m`) para o artigo certo nos textos |
| `dados/diplomacia.js` | `regras.relacoes` (cores e travas de cada tipo, cap. 2) e `parametros` da era antiga (sede, membros, combate, fatorTorcida) — de `parametros`, nada é lido pelos arquivos deste livro (não confirmado fora deles) |

### 1.12 Nome de jogador de futebol (`mundo.js: nomeDeJogador`)

Jogador não é entidade; só há nome para duas mensagens do feed. O nome sai do hash de `"jog|clube|ano|índice"` (função `hashN`: FNV-1a + avalanche) e é estável. Forma sorteada por `hash % 100`: simples 34%, diminutivo 34%, composto 22%, sobrenome 10%. No "diminutivo", 35% das vezes sai aumentativo (`-ão`; `c` final vira `ç`), senão `-inho` (`g`→`gu`, `c`→`qu`); nome terminado em consoante ou curto demais sai simples. A lista de compostos exclui "Ana Paula". Não usa `apelidos`.

---

## 2. Relações entre torcidas

### 2.1 A escala e os níveis

Dois mapas no save:

- `E.relacoes[id]` — a relação **nossa** com cada torcida.
- `E.relacoesDelas["a|b"]` — a relação entre duas torcidas do computador (chave com os ids em ordem alfabética, `relacoes.js: chaveDe`).

Enquanto o par não foi mexido, vale o **valor inicial** do tipo declarado na fonte (`mundo.js: relacaoBase`, com precedência Maior Rival > Rival > Irmandade > Aliado > Neutro):

| Tipo na fonte | Valor inicial | Faixa do rótulo (`statusDoValor`) |
|---|---|---|
| Maior Rival | −85 | `v ≤ −70` |
| Rival | −45 | `−70 < v < −15` |
| Neutro | 0 | `−15 ≤ v < 20` |
| Aliado | +45 | `20 ≤ v < 70` |
| Irmandade | +80 | `v ≥ 70` |

Cortes usados pelas regras (`relacoes.js`):

| Constante | Valor | Uso |
|---|---|---|
| `HOSTIL` | −15 | daqui para baixo há risco de briga |
| `QUENTE` | −55 | daqui para baixo o rival vem sozinho (ataque-surpresa, proposta de trégua) |
| `ALIADO` | +45 | aliado "de verdade" (anfitrião que desce junto na briga das IAs) |
| `ALIADO_MIN` / `REL_ALIADA_DA_MESA` / `dominio.ALIADA` / `eixos.DIPLO_ALIADO` | +20 | corte de "aliada" |
| `TETO_DA_REUNIAO` | 69 | até onde a reunião das IAs leva |

`dados/diplomacia.js: regras.relacoes` dá, por tipo, `ordem`, `corFundo`, `corTexto` e três travas: `podeMelhorar` (falso para Maior Rival), `podePiorar` (falso para Irmandade), `podeAtacar` (verdadeiro para todos). As travas desligam os botões Aproximar/Provocar na tela de Diplomacia.

**Maior rival vivo** (`relacoes.js: ehMaiorRival`): relação ≤ −70 → sim; relação ≥ +20 → não; no meio, vale a fonte (qualquer dos dois declara o outro como Maior Rival). `pesoDoRival` = 1 para maior rival, 0,5 (`PESO_OUTROS`) para os demais — multiplica as chances de briga.

**Irmãs** (`mundo.js: saoIrmas`): duas torcidas do **mesmo clube** ligadas por `irmandade` na fonte. Irmãs nunca brigam, por regra (todos os caminhos de briga checam), independentemente do número. Irmandade entre clubes diferentes é só aliança forte.

### 2.2 Tabela `REL` — quanto cada coisa mexe

Valores de `relacoes.js: REL`. As perdas são aplicadas com `hostilidade(E, id, quanto)` (subtrai, limita a −100..100 e marca a semana da última hostilidade).

| Chave | Valor | Sinal | Quando |
|---|---|---|---|
| `ataqueGanho` | 20 | − | invadimos bar/sede/loja/reunião dela e vencemos (`acoes.js`) |
| `briga` | 18 | − | encontro de rua no dia de jogo (`acoes.js: fecharBrigaDeRua`) |
| `ataquePerdido` | 17 | − | invadimos e apanhamos |
| `defesaSegura` | 15 | − | defendemos a casa ou a caravana e seguramos |
| `arquibancadaMenos` | 13 | − | briga na arquibancada com 11+ a menos que eles |
| `defesaPerdida` | 13 | − | defendemos e perdemos |
| `arquibancadaIgual` | 12 | − | arquibancada com efetivo parelho (±10) |
| `arquibancadaMais` | 11 | − | arquibancada com 11+ a mais |
| `treta` | 10 | − | briga de bairro/treta (`acoes.js: fecharBairro`) |
| `pichacao` | 9 | − | pichar território do rival (ação aposentada; sem uso encontrado) |
| `largarAliado` | 9 | − | deixar o aliado apanhando sozinho na escolta (`feed.js: abandonar-escolta`) |
| `provocar` | 8 | − | botão Provocar na Diplomacia |
| `ataqueMarcado` | 8 | − | uma rival marca ataque-surpresa contra nós |
| `naoReceber` | 7 | − | aliado joga na nossa cidade e não o recebemos |
| `furarAniversario` | 6 | − | não ir ao aniversário da aliada (e −0,4 de prestígio) |
| `churrasco` | 20 | + | recepção nível churrasco |
| `descerPeloAliado` | 16 | + | entrar na briga do aliado (escolta) |
| `hospedarEscolta` | 12 | + | hospedar e escoltar |
| `irAniversario` | 8 | + | ir à festa dela (custa R$ 2.000) |
| `hospedar` | 7 | + | só hospedar |
| `reuniao` | 6 | + | ação "Reunião de diretoria" (com a de maior relação acima de −70; exige 2 diretores de pé) |
| `aproximar` | 5 | + | botão Aproximar; também a unidade da resposta de entrevista que cita outra torcida (`ef.outra × 5`) |
| `iaBriga` | 16 | − | briga entre duas torcidas do computador |
| `iaAjudouAmiga` | 14 | + | entre a dona da briga e quem desceu por ela |
| `iaAjudouRival` | 12 | − | entre quem ajudou e o rival |
| `iaTreta` | 10 | − | treta marcada entre elas (desligado: a treta do trimestre não é agendada) |
| `iaConviteAceito` | 8 | + | convite de aniversário aceito entre elas |
| `iaConviteRecusado` | 6 | − | convite recusado |
| `iaReuniao` | 6 | + | reunião de diretoria delas |

Outras fontes com número próprio:

| Fonte | Efeito |
|---|---|
| Ninguém desceu na briga de bairro (`feed.js: bairro-ninguem`) | relação −6, moral −0,6, prestígio −0,7, e o ponto do bairro vai para elas |
| Aliada visitante joga na nossa praça (`feed.js`, semanal) | +2 com cada torcida visitante cuja relação já é ≥ 20 (`planejamento.RELACAO_ALIADO`) |
| Presente nosso a uma torcida (`relacoes.js: presentear`) | +50 (`PRESENTE_GANHO`); tipos `sede`, `loja`, `bar`, `filial`, pelo preço da obra dela |
| Presente entre elas | +50 entre as duas (3.6) |
| Briga de bairro mensal das IAs (`dominio.js: brigasDasIAs`) | −2 entre atacante e defensora |
| Pedido ao aliado na reunião (2.8) | +2 se topou, −3 se recusou |
| Recusar convite de eixo (`eixos.js: recusar`) | −3 com a torcida que trouxe o convite |
| Sair de um eixo (2.9 / 6.1) | −20 com cada membro que fica |
| Entrar num eixo | sobe para +45 com cada membro; desce para −45 com cada maior rival do eixo |
| Trégua aceita / recusada | +15 / −5 |

**Ganho repetido** (`ganhoRepetido(E, a, b, via, base)`): para as vias `festa` (aniversário) e `caravana` (recepção), o ganho cai pela metade a cada repetição do mesmo par no mesmo ano: `round(base / 2^n)`.

### 2.3 Convivência: a relação esfria e apodrece sozinha

Conosco (`relacoes.js: convivencia`, toda virada de semana):

- **Paz**: a cada 4 semanas sem hostilidade nossa contra a torcida, a relação **sobe** `0,2 × (0,5 a 1,5)` — o fator é fixo por torcida, por hash (`passoDaPaz`). Isso faz rival esfriar em direção ao neutro.
- **Seca**: a cada 8 semanas sem "ajuda" (marcada por `marcarAjuda`: reunião, recepção, aniversário, escolta, visita), a relação **desce** `1 × (0,6 a 1,4)` (`passoDaSeca`). Isso faz aliada esquecida cair.
- O primeiro relógio de cada torcida começa defasado por hash (0–3 semanas para a paz, 0–7 para a seca).

Entre elas (`convivenciaDelas`, só em semanas absolutas múltiplas de 4): mesma regra para todo par que já foi mexido ou que está declarado em `aliados`, `irmandade` ou `rivais` (os `maioresRivais` da fonte não entram na lista inicial); a paz anda 1 passo se a última hostilidade tem ≥ 4 semanas, a seca 1 passo se a última aproximação tem ≥ 8.

### 2.4 Mudança de status pede aval (`feed.js: statusDeHoje`)

- `E.statusRel.visto[id]` guarda o último grupo reconhecido: `rival` (Rival ou Maior Rival), `neutro`, `aliado` (Aliado ou Irmandade).
- **Subir** de status (neutro→aliada, neutro→rival) não pergunta.
- **Cair para neutro** (rival que esfriou, aliada que secou) gera um cartão de decisão — só se a torcida tem laço conosco (não é Neutra na fonte, ou é da nossa praça, ou de cidade onde temos filial, ou já brigou conosco, ou divide eixo). Sem laço, muda calada.
- No máximo **uma pergunta por semana**; a da nossa praça passa na frente.
- Aceitar: o status vira neutro. Recusar: a relação volta para a beira do status antigo (**−16** para rival, **+20** para aliada) e ela só pergunta de novo após **12 semanas** (`RECUSA_STATUS`); nesse prazo o número é reposto na beira a cada dia.

### 2.5 Pautas de aliadas: aproximação, paz e "larga a X?"

Chegam na reunião (seis reuniões por ano), decididas por hash do ano e do mês:

| Pauta | Frequência | Condição | Aceitar | Recusar |
|---|---|---|---|---|
| **Aproximação** (`pautaAproximacao`) | 1 reunião em 3 | uma aliada nossa é aliada de uma torcida que para nós é neutra; não pode ser maior rival de nenhuma aliada nossa; tem de passar em `circuloEmComum` e `trancaDeAliado` (6.1); prefere praça onde não temos aliada | a neutra vira aliada: `max(v + 15, 25)`; +3 com a intermediária | −3 com a intermediária |
| **Paz** (`pautaPaz`) | 1 reunião em 2 | uma aliada nossa é aliada de um **rival** nosso (maior rival não entra) | a relação com o rival **zera** (neutro); +3 com a intermediária | −3 com a intermediária |
| **Cobrança "Larga a X?"** (`pautaAfastar`) | 1 reunião em 3 | duas aliadas nossas que são **rivais entre si** (relação entre elas < −15); a cobrada não pode ser nossa irmã; prioriza o par de maiores rivais | a cobrada **zera** (neutra, nunca rival); +3 com quem pediu | −3 com quem pediu; nada muda com a outra |

O espelho entre as torcidas do computador é a jogada `afastar` da mesa delas (6.1).

### 2.6 Aniversários e convites

- **Nosso convite**: a pauta de aniversários (`feed.js: pautaAniversarios`/`responderFesta`) lista as aliadas que fazem festa. Ir custa R$ 2.000 e rende `ganhoRepetido(…, 'festa', 8)` (8, depois 4, 2…) e conta como ajuda; a torcida posta um agradecimento no dia seguinte à festa. Não ir: −6 de relação e −0,4 de prestígio.
- **Entre elas** (`relacoes.js: convitesDeAniversario`, todo dia): quando é o dia do aniversário de uma torcida (dia/mês da fonte; sem data: dia do ano `1 + hash(id|aniv) % 364`), ela convida o seu círculo = torcidas da mesma praça + `aliados` + `irmandade` da fonte, filtrando quem tem relação ≥ 20 com ela (ou é irmã). A convidada aceita se tem caixa > R$ 2.000 **e** `rand < limitar(0,5 + rel/100; 0,15; 0,95)`. Aceitou: paga R$ 2.000 e a relação sobe `ganhoRepetido(…, 'festa', 8)`. Recusou (ou não pôde pagar): −6. O registro fica em `E.convitesIA` (últimos 100).

### 2.7 Recepção de caravana

- **Nossa** (`planejamento.js`, fora deste livro): quatro níveis com efeito tirado de `REL` — não receber −7, hospedar +7, hospedar e escoltar +12, churrasco +20.
- **Entre elas** (`relacoes.js: recepcaoIA`, na semana em que o clube joga fora, em outra praça, e a caravana tem ≥ 2 cabeças, e a visitante não tem filial lá): a anfitriã é a torcida da praça de destino com maior relação ≥ 20. Nível pela relação: ≥ 70 churrasco, ≥ 45 escolta, senão hospedar; custo por cabeça R$ 75 / 50 / 25, pago pela anfitriã — se o caixa dela não cobre, desce de nível até "nada". Efeito: `ganhoRepetido(…, 'caravana', 20 | 12 | 7)`, ou −7 se não recebeu. O gasto entra nas despesas dela por 4 semanas ("Recepção de aliados").
- **Escolta na rua** (`praca.js: anfitriaoDe`/`escoltaDe`): a visitante com caravana ≥ 5 ganha um anfitrião da praça; grau 2 se a relação é ≥ 60 (ou irmã), grau 1 se ≥ 20 (`planejamento.RELACAO_ALIADO`). O efetivo da escolta é `min(tetoDaEscolta(sede), disponíveis)`; teto por nível de sede 0–6: 10, 10, 10, 10, 20, 30, 30. Quem escolta sai com esse efetivo a menos na própria saída (mínimo 4).

### 2.8 Pedidos ao aliado (`eixos.js: pedirAoAliado`)

Um pedido por reunião. Aliado = relação conosco ≥ 20.

- Tipos: `aproximar` (pedir que o aliado se aproxime de uma torcida que é nossa aliada e ainda não é aliada dele) e o inverso, afastar (pedir que largue uma aliada dele). Irmã do aliado nunca é alvo.
- Força do pedido: `limitar((relação conosco − 20)/60, 0, 1)`. Chance de topar: `0,25 + 0,6 × força` (25% a 85%), decidida por hash da semana e do par.
- Topou: a relação **entre as duas** sobe (ou desce) `round(15 + 10 × força)`, com teto +45 na aproximação e piso 0 no afastamento; +2 conosco.
- Não topou: −3 conosco.

### 2.9 Rivalidade, dívida e desistência

- **Hostis conosco** (`praca.js: hostis`): relação ≤ −15 e sem trégua; irmãs nunca. Entre duas do computador a função usa o tipo da fonte (Rival/Maior Rival).
- **Dívida de revanche** (`relacoes.js: dividaIA`): quem perde uma briga anota uma dívida com quem venceu (`t.dividas[credor]`), válida no mesmo ano e por 16 semanas (`VALIDADE_DIVIDA`). Devedora cobra primeiro: nas listas de candidatas a credora vem na frente e, contra nós, a chance de ataque é multiplicada por 2 (`COBRANCA_MULT`) em vez do freio normal. Se a devedora ataca e **perde de novo**, a dívida é quitada e ela sofre "vingança frustrada": −0,6 de moral e −0,3 de prestígio. Se vence, quita.
- **Desistência** (`registrarTentativa`/`desistiu`): cada ataque fracassado de A contra B soma 1; com **3** (`DESISTE`) A para de atacar B. Um ataque que dá certo zera a contagem; qualquer ataque de B contra A também zera a de A.
- **Chance de procurar briga na rua** (`praca.js`, dia de jogo em casa): ver 6.3.

### 2.10 Trégua

- **Proposta** (`feed.js: treguasDoDia`): rival com quem já houve **3 ou mais brigas no ano** (`E.brigasCom[id].n`) e relação ≤ −55 manda proposta pública, uma vez por ano por rival.
- **Aceitar**: `E.treguas[id] = ano` (vale até o fim do ano), relação +15, dívidas dos dois lados apagadas. **Recusar**: −5.
- **Efeito** (`relacoes.js: emTregua`): a torcida em trégua não é candidata a ataque-surpresa contra nós (pela praça, pela filial dela na nossa cidade, na praça do jogo fora) e não conta como hostil na rua (`praca.js: hostis`). As subsedes hostis da praça de fora (`subsedesHostisNaPraca`) não passam pelo teste de trégua neste arquivo (não confirmado no planejamento).

### 2.11 Traição

Aliado pode ser atacado (`podeAtacar` é verdadeiro para todos os tipos); o preço é o da tabela (`ataqueGanho` −20 / `ataquePerdido` −17). Não há um sistema separado de "traição" nestes arquivos: as consequências passam pela queda da relação, pela saída forçada do eixo quando dois membros viram rivais (6.1) e pela cobrança "larga a X?" (2.5).

---

## 3. As torcidas controladas pelo computador

### 3.1 O estado de cada uma (`E.mundoTorcidas[id]`)

Criado na primeira consulta (`relacoes.js: mundo`) para todas as jogáveis, menos a do jogador:

| Campo | Valor inicial | Significado |
|---|---|---|
| `membros` | `o.membros` (padrão 20) | efetivo total (inclui os núcleos das filiais) |
| `sede` | `TO.membros.nivelInicialDaSede` → 0 se ≤ 30 membros; senão o maior entre `sedeNivel` da fonte e o nível em que o efetivo cabe | nível da sede, 0 a 6 |
| `piso` | = membros iniciais | o teto de membros nunca cai abaixo disso |
| `caixa` | `saldo × 4` (padrão 200×4) | dinheiro |
| `moral` | 12 | régua 0–20 |
| `prestigio` | `round(prestigio da fonte / 5)`, 0–20 | régua 0–20 |
| `bares` | `[{nivel:1}]` se sede ≥ 2, senão vazio; `barGratisDado` | bares (objetos com `nivel`, `bairro`, dano) |
| `lojas`, `subsedes`, `fabrica` | `[]`, 0, falso | comércio |
| `onibus`, `mma`, `bombas` | 0, 0, 4 | frota, professores, bombas |
| `faixas`, `bandeiras`, `faixasTomadas`, `bandeirasTomadas` | 1, 1, `[]`, `[]` | panos |
| `filiais` | `[]` | `{cidade, nivel, membros}` |
| `fila` | cópia de `ORDEM` (3.5) | fila de compras |
| `vermelho` | 0 | semanas seguidas no negativo |
| `mult` | `mult` do bairro da sede | reserva para receita |
| `pool` | 3.4 | bolo de torcedores recrutáveis da praça |
| `irmas` | ids das organizadas do mesmo clube na mesma praça | repartem o `pool` |
| `ousadia` | `limitar(poder/260 + uniforme(−0,15; 0,15); 0,05; 1)` | temperamento |

`brigaDe(t) = 0,6 + ousadia × 1,1` — multiplicador de agressividade (0,655 a 1,7).

Campos que aparecem depois: `quadro` (3.2), `feridosIA`/`presosIA` (lotes `{n, ate}`), `dividas`, `extrato` (últimas 36 linhas), `brigasAno {ano, v, d}`, `ultimaBrigaIA`, `ultimaFerrugem`, `ultimoJogo {venceu, perdeu}`, `janelaIA {tipo, ate}`, `relClube` (0–100, nasce 50), `calor` (polícia), `festas {id:n}`, `advogados`, `galpao`, `enfermaria`, `cofre`, `areaTreino`, `recepcoes`, `presenteEm`, `diasVermelho`, `recrutouEm`.

### 3.2 O quadro (pirâmide e força média)

A torcida do computador não guarda membro por membro; guarda um **quadro** (`quadroDe`):

- `cargos {novato, componente, frente, diretoria}` — quantos em cada cargo (do `planoDeCargos` com a pirâmide da fonte e a sede);
- `forca[c]` — força média do cargo; nasce em `MEDIA_FICHA`: novato 5,5 · componente 6,5 · frente 11,5 · diretoria 15,5;
- `xp[c]`, `desgaste[c]`, `aptos[c]`, `total`.

Quando `membros` cresce, os novos entram como novatos (a média do cargo é recalculada com 5,5 e o XP dilui). Quando diminui, saem primeiro os novatos, depois componentes, frente, diretoria.

**Força média da torcida** (`mediaDeFichaGerada` → `mediaDoQuadro`): média ponderada de `forca[c]` pelos cargos. É o número usado nas brigas entre elas e no ranking.

**Treino diário** (`treinarDelas`): vagas = `SEDE[sede].treino × AREA_TREINO[areaTreino]` (treino por nível 0–6: 1, 2, 4, 8, 12, 20, 30; área de treino ×1 / 1,25 / 1,5 / 1,75 / 2). `fatia = min(vagas, total)/total`. Cada cargo ganha `fatia × 0,15 × ganhoMMA` de força por dia (ganho por nº de professores 0–3: ×1 / 1,30 / 1,60 / 2,00), limitado ao teto do cargo menos o desgaste, e `fatia` de XP. O acumulador `aptos[c]` cresce `vagasDoCargo × 0,15 × ganhoMMA / (forcaPromo − base do cargo)`; bases (`BASE_FICHA`): 3, 5, 10, 14.

**Promoção semanal** (`promoverDelas`, só com caixa ≥ 0): de cima para baixo, sobem `floor(aptos)` membros do cargo se o XP médio do cargo ≥ `xpPromo`; diretoria limitada às vagas da sede (2, 2, 4, 6, 10, 15, 20) e ao caixa (`custoPromo` por cabeça). Quem sobe leva `max(forcaPromo, média do cargo)`.

**XP de briga** (`xpDeBrigaIA`): todo o quadro ganha XP por briga — base 3 (bonde ≤ 10), 6 (≤ 30), 10 (≤ 60), 15 (acima); ×1,5 se venceu.

**Desgaste**:

- por noite de briga (`desgasteDaNoite`): força de todos os cargos cai `feridos × 0,01575 / total` (permanente — entra em `desgaste`) e `presos × 0,3 / total` (temporário);
- **ferrugem da paz** (`ferrugemDaPaz`, diário): 20 dias sem briga → −0,2 de força em todos os cargos, −0,5 de moral, −0,2 de prestígio; repete a cada 20 dias de paz;
- **idade** (`envelhecerDelas`, virada do ano): −0,22 de força permanente (`0,6 × 11/30`), cada cargo perde `round(n/30)` membros (aposentadoria), o desgaste acumulado alivia `×(1 − 1/6)`, e `membros` passa a ser o total do quadro (mínimo 1; o `piso` desce junto).

**Elenco para exibição** (`elencoDaTorcida`): gera nomes, cargo, idade, força/defesa e XP de cada membro por hash, coerentes com o quadro, e marca quem está "Preso"/"Ferido" (com dias) e quem é de filial. Para as brigas de bairro há outra geração, com bairro de moradia (`elenco.js`, 5.7).

### 3.3 Feridos, presos e disponíveis

- `foraDeCombate` = soma dos lotes `feridosIA` e `presosIA` ainda não vencidos. `disponiveisIA` = `membros − fora de combate − membros nas filiais`.
- Cama do ferido (`camaIA`): 5 a 15 dias; 3 a 9 com enfermaria.
- Pena do preso (`penaIA`): 15 a 90 dias − 10 por advogado (mínimo 1). Contratar advogado corta 10 dias de todos os presos atuais.
- Presos não pagam mensalidade.

### 3.4 Crescimento: teto e recrutamento

- **Pool da praça** (`poolDaPraca`): `max(round(baseDeRecrutamento × 0,55), soma dos membros das organizadas do clube na praça)`; se não há base, 500. A base aqui é a de torcedores do clube na praça sem descontar ninguém.
- **Espaço** (`espacoDaPraca`): `max(piso, pool − membros das irmãs)` (a nossa torcida conta se for irmã).
- **Teto** (`tetoDe`): `min(lotação da sede, espaço da praça)` + membros das filiais. Lotação por nível 0–6: 30, 60, 100, 160, 220, 380, 550.
- **Recrutar** (uma tentativa por dia quando faz parte do expediente, 3.7): precisa de vaga e caixa ≥ R$ 10. Tabela (`acoes.js: TABELA_RECRUTA`), multiplicada por 1,2:

| Regime (`regimeIA`) | Chance de +1 | Chance de +2 |
|---|---|---|
| `titulo` (3 semanas após título ou acesso) | 40% → 48% | 20% → 24% |
| `rebaixado` (3 semanas após rebaixamento) | 0 | 0 |
| `ganhou` (clube venceu o último jogo) | 15% → 18% | 5% → 6% |
| `perdeu` | 5% → 6% | 0 |
| `normal` | 10% → 12% | 5% → 6% |

Cada recruta custa R$ 5. Tetos das chances: 90% e 50%.
- **Núcleo da filial**: nasce com 8; toda semana, 1/3 de chance de +1 até o teto do nível da filial.
- **Aposentadoria**: 1/30 de cada cargo por ano (3.2).

### 3.5 A semana financeira (`economiaDelas`, na virada de semana)

Para cada torcida, nesta ordem:

1. Saneamento: professores e frota limitados à sede; núcleos de filial crescem; bar grátis ao chegar à sede 2.
2. **Festas de arquibancada** (`comprarFestasIA`): com caixa ≥ R$ 23.000, compra 1 festa por semana (da mais cara para a mais barata do catálogo `TO.festas.CATALOGO`), até 2 de cada, desde que sobrem R$ 20.000.
3. **Assalto** (3.8).
4. **Balanço** (`balancoDetalhado`), valores mensais; a semana lança `¼` do comércio e, na semana da mensalidade, o bloco mensal inteiro:
   - Receitas: mensalidades (por cargo, só dos não presos); bares `RECEITA.bar[nível]` (1.760 / 3.960 / 8.250), lojas (2.420 / 5.500 / 11.000), subsedes e filiais (660), cada um × `mult` do bairro × `fator` × corte de domínio (5.8) × fator de torcida do bairro (5.9); bar quebrado rende menos; loja não fatura com caixa negativo; loja ganha o bônus da relação com o clube.
   - `fator = faixaDaMoral(moral×5) × (0,7 + (prestígio/20)×0,4 + min(membros/150, 1)×0,3)`; `faixaDaMoral` vai de 0,4 a 1,3.
   - Despesas: manutenção da sede (0, 200, 480, 960, 1.800, 3.000, 5.000 por nível), do comércio (bar 800/1.800/3.800; loja 600/1.300/2.600, metade com fábrica; subsede 700/1.200/1.800), insumo das lojas (25% da receita bruta, metade com fábrica), ônibus R$ 1.500 cada, professores R$ 2.000 cada, advogados R$ 5.000 cada, recepções das últimas 4 semanas, enfermaria e galpão.
5. Doação de simpatizante: 10% por semana, `200 + prestígio × (30 a 90)`.
6. Ônibus: na semana da mensalidade, 1% por ônibus de "manutenção séria" de R$ 15.000.
7. **Caravana**: se o clube joga fora em outra praça na semana, paga a caravana (`custoCaravanaIA`, com abatimento da relação com o clube) e dispara a recepção (2.7). Filiais com ≥ 2 membros também viajam: vontade `limitar(0,72 − 0,09×saltos + (moral/20)×0,4; 0,08; 0,95) × 0,6`; com 0,96% de chance (`0,04 × 0,6 × 0,4`) a caravana da filial briga com a torcida mais hostil (relação ≤ −20) da cidade de destino.
8. **Relação com o clube** (`clubeDelas`): +2 por jogo em casa e +1 por jogo fora na semana; −5 se brigou nos últimos 7 dias; limites 0–100. Em jogo em casa, vende ingressos: `disponíveis × % da faixa × R$ 10`.
9. **Caixa negativo**: `vermelho++`, moral −1; com 2 semanas seguidas demite 1 advogado (ou 1 professor); com 28 dias no vermelho vende a loja de menor nível por R$ 90.000 e fecha até 3 subsedes/filiais. No vermelho não promove nem compra.
10. Caixa positivo: promove (3.2), repõe faixa (R$ 5.000) ou bandeira (R$ 2.000) se ficou sem; senão faz **uma compra** da fila.
11. Sem nada a comprar: se o caixa passa de 12 meses de despesa, queima `6% × brigaDe` do excesso por semana.

**Fila de compras** (`ORDEM`, 28 posições; o item comprado vai para o fim da fila):

`loja, bar, bombas, presente, evoluir:loja, evoluir:bar, mma, advogado, loja, bar, bombas, evoluir:loja, evoluir:bar, onibus, filial, elenco, bombas, mma, subsede, presente, filial, elenco, evoluir:sorteio, area-treino, galpao, enfermaria, cofre, area-treino`

Regras (`proximaCompra`/`itemDaFila`):

- A vez é do primeiro item possível; ela **espera** juntar o dinheiro (não pula para o seguinte), exceto `bombas` e `elenco`, que deixam a fila andar.
- Item que só cabe com sede maior é "travado" e vai para o fim; havendo travados e caixa para a próxima sede, a compra é a **sede** (custos 30 mil, 40 mil, 100 mil, 200 mil, 400 mil, 1 milhão para os níveis 1–6).
- Fila vazia: sobe a sede; com a sede no nível da fábrica (5) e sem fábrica, compra a fábrica (R$ 400 mil).
- `mma`/`advogado` são contratações sem custo de compra, mas exigem caixa ≥ 1 mensalidade do profissional; tetos: professores `min(3, garagem da sede)` (garagem 0,0,1,2,2,3,4), advogados por sede 0,0,1,2,4,8,12.
- `bombas`: lote de 5 por R$ 2.000 (R$ 1.700 com galpão), teto 10.
- `onibus`: R$ 100.000, até a garagem da sede. `filial`: exige prestígio mínimo e vaga por sede; cidade = a praça com mais torcedores do clube onde ainda não tem filial. `elenco`: investe 1 ponto de força no clube (7.9) só se a força dele está abaixo da média da divisão. `evoluir:sorteio`: amplia bar, loja ou filial por sorteio.
- Bar/loja novos ganham bairro por `dominio.js: compraIA` (5.11).

### 3.6 Presentes entre elas

Item `presente` da fila (`aliadaPraPresente`): a torcida procura, no círculo (aliados e irmandade da fonte + torcidas da praça), uma aliada (relação ≥ 20 ou irmã) com sede 1 ou 2 e pelo menos **2 níveis abaixo** da dela, que não recebeu presente nas últimas 26 semanas. Prefere a sede mais baixa, depois a relação mais alta (irmã +50 de nota). Paga a obra da sede seguinte da aliada (exige caixa ≥ custo + R$ 5.000); a aliada sobe de sede e a relação entre as duas sobe 50. Vira manchete de obra ("Presente de aliada") se interessa ao jogador. Nunca presenteiam a nossa torcida.

### 3.7 O expediente diário (`mundoDia`)

Todo dia, para o mundo inteiro: `treinarDelas`, `ferrugemDaPaz`, registro do último resultado do clube de cada torcida. Depois, por torcida, três ações escolhidas por `expedienteIA`:

- tem vaga → `recrutar`;
- caixa < R$ 5.000 → `festa` e `pix`; senão, se há na praça uma aliada com relação entre 20 e 68 → `reuniao`;
- completa até 3 com `recrutar` (se há vaga) ou `festa`.

| Ação | Regra |
|---|---|
| `recrutar` | 3.4 |
| `festa` (na sede) | custo por sede 1–6: 170, 300, 500, 600, 1.100, 1.500 (700 na sede 0); precisa de público ≥ `ceil(custo/4,8)`; rende `disponíveis × (4,8 a 6,4)` × corte de domínio do bairro da sede |
| `reuniao` | só na segunda-feira (dia 1), com ≥ 2 diretores no quadro: +6 com a torcida da praça de maior relação ≥ 20 que não seja maior rival, até o teto 69 |
| `pix` | com ≥ 3 de pé: rende `disponíveis × (8 a 15)` e custa −0,2 de prestígio |

No mesmo laço: o ataque ao bar do trimestre (3.9), o ataque-surpresa (3.9). Depois: emboscadas na estrada e convites de aniversário (2.6).

**Moral pelo futebol** (`resultadosDelasHoje`): vitória do clube +0,6, derrota −0,6. Conquistas (`conquistaDoClube`, uma vez por competição/ano): campeão +2,5, vice +0,8, acesso +2, rebaixado −3; campeão/acesso e rebaixamento abrem a janela de recrutamento de 3 semanas.

### 3.8 Assaltos delas (`assaltoIA`, semanal)

- `calor` (atenção da polícia) cai 10,5 por semana.
- Precisa de ≥ 6 de pé. Chance de tentar: `0,04 × brigaDe × (1 − min(1, calor/100))`.
- Valor: inteiro entre 500 e o teto da sede 0–6: 3.000, 6.000, 12.000, 25.000, 45.000, 80.000, 120.000.
- Dá certo com chance `0,65 − calor/200`: entra no caixa, calor +6 a 14. Dá errado: 1 a 3 presos, calor +14.

### 3.9 Brigas entre elas

**A resolução única** (`relacoes.js: brigaIA(E, a, b, cidade, rótulo, opts)`; `a` é o atacante):

1. Exige ≥ 8 disponíveis de cada lado e que `a` não tenha desistido de `b`.
2. Bonde de cada lado: `max(4, round(disponíveis × f))`, `f` uniforme em 0,18–0,35 se a torcida é da cidade da briga, 0,08–0,18 se é de fora; limitado aos disponíveis e a `tetoA`/`tetoB` quando dados.
3. Ajuda: se há anfitriã (`ajudaA`/`ajudaB`), ela entra com `max(3, min(teto da escolta da sede, round(disponíveis dela × 0,15)))`.
4. Poder = `bonde × força média do quadro` (+ o mesmo da ajuda).
5. O favorito (maior poder; empate por moeda) vence com **70%**.
6. Baixas sobre o bonde: perdedor 25–40% feridos e 5–12% presos; vencedor 8–16% feridos e 1–4% presos (a ajuda sofre pela mesma régua, do lado dela). Viram lotes com cama e pena (3.3).
7. Prestígio: `swing = limitar(round(1 + (nA+nB)/25) + (4 se zebra), 1, 8 ou 10 se zebra) / 5`; vencedor +swing, perdedor −swing ("zebra" = o vencedor tinha o bonde menor). Moral: vencedor +0,6 (+1,2 na zebra), perdedor −0,6. Ajuda vencedora: +0,2 de prestígio.
8. Relação: −16 entre as duas; +14 entre dona e ajuda; −12 entre ajuda e rival.
9. Registro (`registrarBrigaIA`): entra em `E.brigasIA` (últimas 300) com ano/semana/dia, cidade, tipo (`rua`, `bar`, `estrada`, `subsede`), efetivos, feridos, presos, vencedor; atualiza dívidas (2.9), placar do ano (`brigasAno.v/d`), XP, desgaste, `ultimaBrigaIA`, candidata a "treta do ano" (8.3). Com 5% de chance (`CHANCE_PANO_BRIGA`) o vencedor toma uma faixa ou bandeira do perdedor: prestígio do perdedor `−perda/5` (faixa 20, bandeira 10 → −4 / −2), do vencedor `+ganho/5` (10, 5 → +2 / +1). Briga "memorável" (vencedor da nossa praça, nosso ou nosso maior rival; perdedor com ≥ 3 feridos a mais e ≥ 2× os do vencedor) vai para `E.brigasMemoraveis` (120).
10. Estas brigas **não mexem** na barra de domínio dos bairros (`dominio.js: brigaIA` devolve nulo).

**Quando acontecem:**

| Origem | Frequência | Quem contra quem |
|---|---|---|
| **Jogo do dia** (`brigasDeHoje`) | 4,32% por jogo (`0,18 × 0,6 × 0,4`) | pares entre as torcidas dos dois clubes e as da cidade do jogo; pelo menos uma do par é de um clube do jogo; clubes diferentes; não irmãs; relação ≤ −15 ou rivais na fonte. Havendo pares de maiores rivais, 75% das vezes o sorteio é só entre eles. A torcida de fora (sem filial na cidade) ganha, com 50%, a ajuda de uma anfitriã local (relação ≥ 45, ou Aliado/Irmandade na fonte, ou irmã) |
| **Ataque ao bar** (`barIA`) | calendário do trimestre: por bloco de 13 semanas e por torcida, 3/8 de chance de 1 ataque ao bar e 3/8 de 1 evento "casa" (`eventosDoTrimestre`, por hash); só o de `bar` é executado para elas | a rival da praça ataca (credora primeiro; senão a maior), se tem ≥ 50% do efetivo da dona; bonde atacante ≤ 60, defensor ≤ 40. Vitória do atacante: saque = `60 × bonde defensor + 22% do caixa da dona`, reduzido ×0,7 com galpão e ×0,5 com cofre; o bar mais visado fica quebrado |
| **Ataque-surpresa** (`surpresaIA`) | diário, por torcida | contra a hostil da praça com relação ≤ −55 (credoras e maiores rivais primeiro), se a atacante tem ≥ 50% do efetivo da vítima. Chance: `((−55 − rel)/45) × 0,28 × brigaDe / 7 × 0,6 × (1 se cobra dívida; senão 0,4 × pesoDoRival)` |
| **Emboscada na estrada** (`estradaIA`) | 2,4% por jogo entre praças diferentes (`0,10 × 0,6 × 0,4`) | uma torcida do visitante é emboscada na primeira cidade intermediária da rota onde há hostil (maior rival primeiro); tipo `estrada` |
| **Guerra de filiais** (`guerraDeFiliais`) | semanal | em cada cidade, entre núcleos de filial (≥ 6) de torcidas diferentes e entre torcida local e filial visitante, com relação ≤ −20. Chance: `((−20 − rel)/120) × 0,10 × max(brigaDe) × 0,6 × pesoDoRival × 0,4`. O atacante que vence toma a faixa da subsede (reposição em 28 dias) |
| **Caravana de filial** | 0,96% por viagem | 3.5, item 7 |
| **Briga de bairro mensal** | 1 por torcida a cada 30 dias | 5.7 (resolução própria) |

`FREIO_BRIGA = 0,6` e `FREIO_IA = 0,4` são os dois freios globais embutidos nas contas acima.

### 3.10 Ataques delas contra nós (`ataquesContraNos`, na virada da semana)

No máximo **um** ataque marcado por semana (`E.ataqueMarcado`), procurado em quatro portas, nesta ordem:

1. **Torcida que nos alcança** (da nossa praça, ou visitante na rua na semana), em jogo nosso **em casa**: relação ≤ −55, sem trégua, não irmã, não desistiu, disponíveis ≥ 50% dos nossos aptos. Chance `((−55 − r)/45) × 0,28 × brigaDe × (2 se cobra dívida; senão 0,6 × pesoDoRival)`. Alvo sorteado entre `concentracao` (cena praça) e `pista` (cena rua), pesos iguais; dia = dia do jogo.
2. **Filial dela na nossa cidade** (núcleo ≥ 6): mesma régua com 0,18 no lugar de 0,28. Se é jogo em casa e o núcleo tem ≥ 50% dos nossos aptos, ataca na rua; senão ataca o nosso **bar** num dia sorteado por hash (`1 + hash(ano|semana|id) % 7`), sem freio.
3. **Jogo fora**: torcida da praça do adversário, relação ≤ −55, disponíveis ≥ 50% da nossa caravana; mesma chance da porta 1.
4. **Subsede hostil na praça de fora** com núcleo ≥ 70% da caravana: régua de 0,18.

Marcar o ataque custa −8 de relação e gera o aviso do olheiro. Além disso, cada filial **nossa** tem 0,3% ao dia (`0,005 × 0,6`) de sofrer ataque à subsede (`feed.js`).

### 3.11 A regra de paridade

Princípio do projeto: o que vale para o jogador vale para as torcidas do computador pela mesma régua. No código atual:

| Tema | Como está |
|---|---|
| Receita, manutenção, preços de obra, tetos da sede | mesmas tabelas (`financeiro`, `patrimonio`, `membros`) |
| Recrutamento | mesma tabela por regime, ×1,2 fixo no lugar do peso do bairro (o nosso varia de ×0,7 a ×1,3); R$ 5 por recruta |
| Ferrugem da paz | igual: 20 dias sem briga → ficha −0,2, moral −0,5, prestígio −0,2 |
| Moral pelo clube | ±0,6 por jogo, título +2,5, vice +0,8, acesso +2, rebaixamento −3, pagos no dia |
| Relação com o clube | elas têm `relClube` (ingressos, bônus de loja, abatimento de caravana) |
| Assalto, PIX, doação de simpatizante, festa de arquibancada, quebra de ônibus | existem dos dois lados |
| Caixa negativo | −1 de moral por semana; venda de loja (nós aos 30 dias, elas aos 28) |
| Relações | as delas também esfriam e apodrecem (2.3) |
| Professores e advogados | mesmos tetos por sede (3 professores; até 12 advogados) |
| Saque de bar | galpão (×0,7) e cofre (×0,5) protegem também a vítima do computador |
| Diferenças que continuam | elas fazem recrutar + festa/reunião no mesmo dia (três ações, sem turnos); uma compra por semana pela fila; resolvem briga por média do quadro e 70% para o favorito; XP de briga vai para o quadro inteiro; nunca nos dão presente; começam com 4 bombas e teto 10; a caravana da filial sai com ×0,6; desistem após 3 fracassos (nós não) |

`docs/PARIDADE-TORCIDAS.md` é o diagnóstico de 12/10/2026 e está em parte superado pelo código (as linhas acima são o código).

---

## 4. Ranking e prestígio

### 4.1 A fórmula do ranking (`relacoes.js: ranking`)

Uma linha por torcida jogável (o mundo inteiro, 387):

```
pontos = round( (membros + prestígio×5 + força×5) × multiplicador da situação financeira )
```

| Termo | Nossa torcida | Torcida do computador |
|---|---|---|
| `membros` | `E.membros.length` | `t.membros` |
| `prestígio×5` | indicador (0–20) × 5, arredondado | idem (`t.prestigio`) |
| `força` | (média de força + média de defesa) / 2 dos membros reais | força média do quadro (3.2) |
| caixa | `E.dinheiro` | `t.caixa` |

Situação financeira (`situacaoFinanceira(caixa)`):

| Caixa | Rótulo | Multiplicador |
|---|---|---|
| < −10.000 | Endividado | 0,80 |
| ≤ 0 | Muito ruim | 0,88 |
| ≤ 10.000 | Pobre | 0,96 |
| ≤ 20.000 | Estável | 1,04 |
| ≤ 40.000 | Bem financeiramente | 1,12 |
| > 40.000 | Rico | 1,20 |

Ordem: pontos, depois membros, depois nome. Cada linha traz também `predios` (1 + bares + lojas + subsedes), `saldo` (brigas ganhas − perdidas no ano) e as variações de membros, prestígio e força em relação à **foto do mês** (`fotoDoMes`: medição guardada na primeira consulta de cada mês do calendário). O resultado é guardado em cache enquanto não mudarem data, nosso efetivo, prestígio, dinheiro, placar de brigas e contadores de brigas/baixas do mundo.

### 4.2 Recortes: país, praça, região

- **Nacional** (`rankingDoPais`): o ranking filtrado pelo país do clube da torcida (o do jogador, por padrão), renumerado (`pos`), guardando `posMundo`. `posicaoNoRanking` = nossa posição no país; `posicaoNoMundo` = na lista inteira.
- **Por praça e por região**: não há ranking separado guardado; na virada do ano o almanaque percorre o ranking nacional e o placar de brigas e pega, para cada praça e cada região, a **primeira** torcida que aparece (4.4).

### 4.3 Pontos por briga e "rei da pista"

- O placar de brigas (`placarDoAno`) é `{ano, v, d}` por torcida — o nosso em `E.brigasAno`, o delas em `t.brigasAno`. Zera quando o ano muda (na primeira leitura do ano novo).
- Cada briga conta 1 vitória para o vencedor e 1 derrota para o perdedor (`anotarBriga`): as nossas são anotadas pelo feed ao fechar a briga (para os dois lados), as delas em `registrarBrigaIA`. Não há pontuação diferente por tipo ou tamanho de briga.
- **Rei da pista** = a torcida do país do jogador com maior **saldo** (`v − d`) positivo no ano; desempate por mais vitórias (`almanaque.js: reiDaPista`). Só entra quem tem saldo > 0.
- O que a briga rende em **prestígio**: entre elas, o `swing` de 3.9 (0,2 a 2,0 na régua 0–20); nas nossas, o prestígio delas se mexe junto (ex.: briga de rua ±0,4; defesa nossa: −0,5 se seguramos, +0,6 se perdemos; moral delas −1,0 / +0,8) — o nosso lado é calculado em `acoes.js`/`membros.js` (fora deste livro).

### 4.4 Bônus de fim de ano (`almanaque.js: premiar`, na virada)

Pagos antes de o ano virar apagar o placar, só a torcidas **do país do jogador**; para a nossa entram no extrato (`TO.estado.lancar`), para as outras somam no caixa.

| Prêmio | Quem | Valor |
|---|---|---|
| Torcida do Ano | 1º ao 5º do ranking nacional | R$ 300 mil, 150 mil, 100 mil, 70 mil, 50 mil |
| Rei da Pista | 1º ao 5º por saldo de brigas (> 0) | os mesmos cinco valores |
| Melhor do ranking da praça | a mais bem colocada de cada praça | Grande R$ 70 mil · Média R$ 50 mil · Pequena R$ 30 mil |
| Rei da pista da praça | o maior saldo de cada praça | idem |
| Melhor do ranking da região | a mais bem colocada de cada região (`cidade.regiao`) | R$ 90 mil |
| Rei da pista da região | o maior saldo de cada região | R$ 90 mil |

Os prêmios se somam (uma torcida pode levar ranking + pista, praça + região).

### 4.5 Promovidos e outros efeitos de virada

- **Clubes promovidos/rebaixados** (7.7): a torcida do clube ganha +2 de moral no acesso e −3 no rebaixamento; a nossa abre janela de recrutamento de 2 semanas (regime `titulo` ou `rebaixamento`) e a fila de torcedores muda (×1,6 por 4 semanas no acesso; ×0,45 por 8 no rebaixamento); as delas abrem janela de 3 semanas.
- **Membros promovidos** das torcidas do computador: 3.2 (`promoverDelas`).
- Vice-campeão: +0,8 de moral para todas as torcidas do clube (a nossa incluída). Campeão: +2,5.

### 4.6 Prestígio diário pelo domínio

Ver 5.6: a dona da cidade ganha +0,02 por dia de prestígio e de moral (0,1 na régua 0–100); as duas maiores torcidas da cidade que não são a dona perdem o mesmo.

---

## 5. Domínio dos bairros (`dominio.js`)

### 5.1 A barra de 7 pontos

- Cada bairro tem uma barra de **7 pontos inteiros** (`MAX = 7`) repartida entre torcidas: `E.dominio.c[cidade].b[bairro] = {torcidaId: pontos}`. A soma nunca passa de 7; pode ser menor (pontos sem dono).
- **Dona do bairro**: a torcida com **4 ou mais** pontos (`DOMINA = 4`). Sem ninguém com 4, o bairro está "em disputa".
- O estado da cidade do jogador é criado e gravado no save na primeira consulta; o das outras cidades é calculado por hash da semente do save e só é copiado para o save quando alguém mexe nele (`paraMexer`). O formato do save é `E.dominio = {v:2, c, donos, log, acum, dia, semanaVirou}`.

### 5.2 A partilha inicial (`inicial` / `inicialDaCidade`)

Gerador pseudoaleatório determinístico (`sorteio`, mulberry32 com semente = hash de `"semente|dominio|cidade"`).

1. Os bairros são agrupados pela cidade real (`bairro.cidade`); cada torcida entra no grupo do bairro da sua sede. Grupo sem torcida fica com todos os bairros vazios.
2. **Cotas** de bairros por torcida, dentro do grupo (N bairros; torcidas ordenadas por efetivo):
   - uma só torcida: fica com todos;
   - duas ou mais: `k = max(1, round(N × 5/16))`; a 1ª recebe `k` + variação sorteada em {0, 0, +1, −1}; a 2ª recebe o mesmo (30% de chance de empate) ou ±1; as demais recebem 1 (o bairro da sede) e o que sobrar é distribuído por efetivo, sem passar de `min(k1, k2) − 1`; a sobra final vai alternadamente para as duas primeiras.
3. Cada torcida recebe primeiro o bairro da própria sede; depois, em rodadas, quem está mais longe da cota escolhe o bairro livre de melhor nota: `−12 × presença do clube no bairro` (5.9), `−15` se já tem estrutura ali, `+ rand×3`.
4. Pontos: no bairro da sede a dona começa com **5**; nos outros, 5 com chance `0,2 + 0,5 × (efetivo / maior efetivo da cidade)`, senão 4. Com 60% de chance uma segunda torcida (rival, de preferência com bairro na mesma zona) entra com 2 pontos (40%) ou 1 — nunca passando de 7.
5. Garantia: toda torcida tem **pelo menos 1 ponto** no bairro da própria sede.

### 5.3 A sede de cada torcida e o bairro da sede

- **Um bairro abriga a sede de uma torcida só** (`espalhar`, na carga): em cada praça, as torcidas são ordenadas por efetivo; a maior fica com o `bairroSede` da fonte; a que encontra o bairro ocupado é realocada para o bairro livre de menor nota: +100 se é de outra cidade real, +0/10/20 se é da mesma zona/zona vizinha/zona oposta, −3 se é da mesma classe, +2 por sede já instalada na zona, + desempate por hash. A realocação **reescreve** `torcida.bairroSede` (o original fica em `bairroSedeDados`) e a lista `bairro.sedes`.
- Zonas vizinhas (`VIZINHAS`): Norte e Sul são vizinhas de Leste e Oeste; Leste e Oeste, de Norte e Sul. Em praça com 3 ou mais cidades reais, a "zona" passa a ser a cidade do bairro (`semZonas`).
- `sedeDe(torcida, cidade)` devolve o bairro da sede; `casaDe(cidade, bairro)` devolve a torcida cuja sede fica ali. `reparar(E)` acerta `E.torcida.bairroSede` ao carregar.
- **Ponto fixo** (`fixoDe`): a torcida nunca perde o **último ponto** no bairro da própria sede; uma torcida de fora nunca perde o último ponto no bairro da sua filial naquela cidade (`bairroDaFilial` = `bairros[hash("torcida|filial|cidade") % n]`).
- **Sede perdida** (`sedesPerdidas`, diário): a torcida que não é dona do bairro da própria sede perde **0,04 de moral por dia** (0,2 na régua 0–100) até retomar — vale para a nossa e para as do computador.

### 5.4 Como os pontos passam (`transferir` / `passarPonto`)

Toda briga que vale domínio move **exatamente 1 ponto**:

1. Se o vencedor já tem 7: nada.
2. Se o perdedor tem mais pontos que o seu ponto fixo no bairro: perde 1 e o vencedor ganha 1.
3. Senão, se a soma da barra é menor que 7: o vencedor ganha 1 "de ninguém".
4. Senão: nada muda.

Se a dona do bairro mudou (`virou`), entra no log (últimas 60 viradas) e, se nos envolve, vira aviso no feed (tomamos, perdemos, perdemos o bairro da sede); viradas entre terceiros na nossa cidade são juntadas num resumo semanal (segunda-feira).

**O que ainda mexe na barra:**

| Fonte | Como |
|---|---|
| Briga nossa (`confronto`, chamado pelo feed ao fechar a briga) | 1 ponto no bairro onde a briga aconteceu, do perdedor para o vencedor; empate não mexe |
| Ninguém desceu numa briga de bairro contra nós (`bairro-ninguem`) | 1 ponto nosso para a rival |
| Briga de bairro mensal das IAs (`brigasDasIAs`) | 1 ponto (5.7) |

**O que não mexe mais (desligado):**

| Coisa | Estado no código |
|---|---|
| Brigas das IAs de jogo, bar, surpresa, estrada, filial | `dominio.brigaIA()` devolve nulo |
| Comprar bar, loja, subsede, filial | `dominio.estrutura()` devolve nulo; `compraIA` só escolhe o bairro |
| Pixação | `PIX = {dia:0, cota:0…}`, `vagasPix`, `muros`, `saldoPix`, `pixar`, `ganharPix` — todos vazios |
| Ação social | `podeSocial`, `social`, `alvoSocial` vazios (a tabela `SOCIAL {custo:1500, gente:5}` sobra sem uso) |
| Recrutar no bairro | `recrutouHoje()` vazio, `RECRUTA_DIA = 0` |
| Metas/alvos de domínio | `metasDoDia()` vazio; `alvosDe()` devolve lista vazia |
| Tabela `GANHO` (treta 10/14/18, rua 10, arredores 8, estádio 6, bar 12…) | constantes da régua antiga de 0–100; nenhuma função as usa |
| `rapido()` (modo rápido) | sempre falso |

### 5.5 Onde a briga conta (`ondeDaBriga`)

O bairro da briga sai, nesta ordem: do bairro informado no local; da cena — estrada/emboscada → bairro da **entrada** da cidade (rótulo "Entrada/Estrada" da planta, 5.10); praça/concentração → bairro da **sede do atacado** (ou o do estádio); pista → um **vizinho do bairro do estádio** (por hash da data); estádio, arquibancada, invasão, escolta, rua, arredores → bairro do **estádio**. `previaBriga` simula os dois resultados para mostrar antes ("vencendo, nós 4/7; perdendo, nós 2/7 e ela 5/7 (o bairro vira da X)").

### 5.6 Domínio da cidade e efeitos diários (`dia`)

- `placar(cidade)`: conta quantos bairros cada torcida domina. **Dona da cidade** = quem tem mais bairros que todas as outras; empate no topo = cidade sem dona.
- Todo dia, em cada praça com torcida:
  - a dona ganha **+0,02 de prestígio e +0,02 de moral** (`DIA`; 0,1 na régua 0–100);
  - as **duas maiores torcidas** da cidade (por efetivo vivo) que não são a dona perdem 0,02 de cada;
  - mudou a dona da nossa cidade: aviso no feed.
- Para nós, os ganhos/perdas do dia acumulam em `E.dominio.acum` e entram no histórico de indicadores uma vez por semana ("Dominamos X (a semana)" / "Sem o domínio de X (a semana)").
- Em seguida rodam `sedesPerdidas` (5.3), o resumo da semana (segunda) e `brigasDasIAs`.

### 5.7 As brigas mensais das IAs e o foco na sede

`brigasDasIAs`, diário; cada torcida do computador age **um dia a cada 30** (`hash("semente|diaIA|torcida|mês") % 30 === dia absoluto % 30`; "mês" = `ano×12 + floor((semana−1)/4,35)`).

1. Candidatos: bairros da cidade com uma **defensora** válida (`defensoraDe`): a dona do bairro — ou, sem dona, a torcida com mais pontos — que não seja a atacante, **não seja a torcida do jogador** e não seja amiga da atacante (relação ≥ 20 ou irmãs). Bairro cuja dona é amiga não é alvo.
2. **Foco em recuperar a sede**: se a atacante não domina o bairro da própria sede e ele é candidato, o alvo é ele.
3. Senão, o bairro de maior nota: `3 × pontos que ela já tem ali + 2 se é vizinho de um bairro dela + rand×3`.
4. Defensores: até **15** membros da defensora que **moram no bairro** (`elenco.js: noBairro`), os mais fortes; se moram menos de 3, completa até 3 com os mais fortes da mesma zona.
5. Atacantes: os `n` mais fortes da atacante, `n` sorteado entre `max(2, ceil(defensores × 0,7))` e `max(2, floor(defensores × 1,6))` (`ataqueSorteado`).
6. Força de cada lado = soma de (força + defesa) dos membros; lista vazia vale `máximo × 8`. A atacante vence com probabilidade `fa / (fa + fd)`.
7. O vencedor leva 1 ponto do perdedor (`transferir`, motivo `briga-ia`) e a relação entre as duas cai 2.

**Quem mora onde** (`elenco.js`): cada membro gerado tem bairro sorteado com pesos = presença do clube no bairro (mínimo 0,05) × 4 no bairro da sede, × 1,5 na zona da sede; para núcleo de filial: × 6 no bairro da filial, × 2 nos vizinhos, × 0,15 no resto. Os nossos membros ganham bairro pelo mesmo sorteio; o recruta novo mora no **bairro do recrutamento** escolhido. Só entra na briga quem está de pé (para as do computador, a fração disponível é sorteada por hash semanal).

As brigas de bairro **contra nós** (alvos, convocação, "ninguém desceu") são montadas pelo feed (`feed.js: bairroDeHoje`, `planoDosBairros`), fora deste livro.

### 5.8 Corte de 15% em bairro de dona não aliada (`fator`)

Receita de bar, loja, subsede, filial e da festa na sede é multiplicada por **0,85** (`CORTE`) quando o bairro tem dona, a dona não é a própria torcida e não é **amiga** (`amigas`: mesma torcida, irmãs, ou relação ≥ 20). Vale para nós e para as do computador. A nota na tela: "bairro da SIGLA −15%".

### 5.9 A torcida do clube em cada bairro (presença)

`pesos(cidade)` reparte os torcedores de cada clube pelos bairros:

- peso do bairro = `POVO[classe]` (Favela 1,3 · Classe Baixa 1,15 · Classe Média 1,0 · Nobre 0,8)
- × **0,08** (`DE_FORA`) se o clube é local de uma das cidades reais da praça e o bairro é de outra cidade;
- × **1,6** no bairro que abriga sede de uma organizada do clube (`REDUTO_SEDE`), × **1,25** na mesma zona/cidade dessa sede (`REDUTO_ZONA`);
- × variação fixa por hash de 0,85 a 1,15 (`VARIA = 0,15`).

`presenca(cidade, clube, bairro)` = peso do bairro / peso médio (1 = média). Usos:

| Uso | Fórmula |
|---|---|
| Receita do ponto (`fatorTorcida`) | `0,5 + 0,5 × min(presença, 2)` → ×0,5 a ×1,5 |
| `fatorGanho` | `0,4 + 0,6 × min(presença, 1,5)` → ×0,4 a ×1,3 (exportado; sem uso nas regras atuais da barra) |
| Torcedores no bairro (`torcedoresNoBairro`) | torcedores do clube na praça × peso do bairro / soma dos pesos; devolve a lista por clube com a fatia (`perc`) |
| Peso do recrutamento (`pesoDoRecrutamento`) | `0,7 + 0,3 × min(presença, 2)` → ×0,7 a ×1,3 sobre a chance de recrutar (só o jogador) |
| Sugestão de bairros para recrutar (`bairrosPraRecrutar`) | os 3 de maior `min(presença, 2)`, × 0,6 se o bairro abriga a sede de outra torcida |

O bairro do recrutamento do jogador (`E.recrutamento.bairro`) não mexe mais na barra; continua pesando a chance e decidindo onde o recruta mora.

### 5.10 Vizinhança, estádio e entrada

- `vizinhosDe(cidade, bairro)`: pela grade da planta (`plantas[cidade].g`), dois bairros são vizinhos se têm células lado a lado (horizontal ou vertical). Sem planta: os bairros da mesma zona.
- `bairroDoEstadio`: o bairro do estádio pedido (por nome ou apelido); sem estádio, `bairros[hash("cidade|estadio") % n]`.
- `bairroDaPista`: um vizinho do bairro do estádio, por hash da chave.
- `bairroDaEntrada`: sorteia por hash um rótulo "Entrada…"/"Estrada…" da planta e pega o bairro cuja célula está mais perto; sem planta, o bairro do estádio.

### 5.11 Estruturas e bairros das torcidas do computador

- `estruturas(E, cidade)`: lista de `{tid, tipo, bairro, i}` — sede de cada torcida; nossos bares/lojas/subsedes nos bairros gravados; os delas no bairro gravado no objeto ou no **bairro padrão**; fábrica no bairro da sede; filiais no `bairroDaFilial`.
- `bairroPadrao(o, tipo, i)`: por hash, entre os bairros que não abrigam sede de ninguém, da mesma cidade real da sede, de preferência na mesma zona (depois na zona vizinha).
- `bairroNovoIA` (bar e loja comprados): menor nota entre os bairros sem sede: 0 se o bairro já é dela, 20 se não tem dona, 90 se a dona é rival, 45 caso contrário; +25 se já tem ponto do mesmo tipo ali; `+30 × (1 − min(presença, 1,5))`; `+ rand×10`. O nome do bairro é gravado no objeto (`obj.bairro`). Subsede usa o bairro padrão; filial não escolhe bairro.
- `rivais(E, a, b)`: relação < −15 (ou fonte, sem save); `amigas`: 5.8.

### 5.12 Classes de bairro: resumo dos efeitos

| Classe | Renda do ponto (`mult`) | Peso de torcedores (`POVO`) | Cena de rua (`praca.js: RUA_DA_CLASSE`) |
|---|---|---|---|
| Nobre | ×1,5 | 0,8 | `rua-nobre` |
| Classe Média | ×1,0 | 1,0 | `rua-media` |
| Classe Baixa | ×0,8 | 1,15 | `rua` |
| Favela | ×0,4 | 1,3 | `rua` |

---

## 6. Eixos, relação com o clube e a praça

### 6.1 Eixos de aliança (`eixos.js`)

`eixos.js` trata só dos **eixos** — blocos de torcidas aliadas. A ideologia da torcida não mora neste arquivo (fica no planejamento; fora deste livro).

**Dados de nascença** (`dados/eixos.js: base`): União Punho Cruzado (UPC, 11 membros), Dedo pro Alto (DPA, 17), Lado A (10), Lado B (18), União Punho Colado (UPCo, 9) — só torcidas brasileiras. `nomesNovos` traz 12 nomes em português e 12 em espanhol para eixos que nascem no jogo; cada nome sai uma vez por save; acabando os nomes, não nasce mais eixo.

**Save**: `E.eixos = {lista:[{id, nome, sigla, base, fundado, membros}], historico, recusas, vetos, propostas, nomesUsados, seq, seqHist, vistoAte, nossos:{mesa, convites, recusaram, recusaramNos}}`.

| Constante | Valor | Regra |
|---|---|---|
| `MAX_POR_TORCIDA` | 2 | uma torcida cabe em no máximo dois eixos |
| `ALIADO_AO_ENTRAR` | +45 | quem entra fica no mínimo em +45 com cada membro (`consolidar`/`entrar`) |
| `RIVAL_AO_ENTRAR` | −45 | quem entra fica no máximo em −45 com cada **maior rival do eixo** (exceto irmãs) |
| `RECRUTA_CADA_DIAS` | 15 | cada eixo tenta chamar alguém a cada 15 dias (dia definido por hash do id) |
| `PROPOSTA_CADA` | 13 semanas | no eixo nosso, um nome na mesa a cada 13 semanas |
| `FUNDA_CADA` / `FUNDA_CHANCE` | 13 semanas / 75% | tentativa de eixo novo: 4 por ano, 3 vingam em média |
| `METADE_ALIADA` | 0,5 | o candidato precisa ser aliado (≥ 20) de pelo menos metade dos membros |
| `RECUSA_CADA` / `RECUSA_NOSSA` | 26 semanas | prazo até um eixo voltar a nos chamar / até voltarmos a chamar quem disse não |
| `MIN_FUNDADORES` | 3 | um eixo nasce com 3 |
| `MAX_EM_COMUM` | 3 | dois eixos não podem ter mais de 3 membros em comum (não vale entre dois eixos de nascença) |
| `SAIDA_DO_EIXO` | −20 | quem sai perde 20 com cada um que fica |
| `MESA_CADA` | 13 semanas | intervalo entre duas jogadas nossas (fundar, candidatar) |
| `CONVITE_CADA_DIAS` | 15 dias | cada eixo nosso convida um nome a cada 15 dias |
| `DIPLO_CADA_DIAS` | 91 dias | cada torcida do computador senta a mesa 4 vezes por ano |
| `DIPLO_PARCEIRAS` | 12 | com quantas aliadas ela trabalha na mesa |
| `TRANCA_ALIADO` | 20 | corte da "tranca de aliado" |
| `CIRCULO_EM_COMUM` | 0,5 | fração do círculo que precisa ser comum |

**Maiores rivais do eixo**: a união dos maiores rivais de cada membro (declarados na fonte, de qualquer lado, ou com relação ≤ −70) que não são do eixo.

**Quem pode entrar** (`podeEntrar`): não é membro; está em menos de 2 eixos; não saiu desse eixo há menos de 26 semanas; é do mesmo país de todos os membros; não é maior rival nem rival (< −15) de nenhum membro; é aliado de ≥ metade; não é irmã de um maior rival do eixo; respeita o limite de membros em comum.

**Eventos do dia** (`eventosDoDia`):

1. **Saneamento** (`sanearEixos`): rival não convive no eixo. Se dois membros (não irmãos) são rivais entre si, sai o de menor soma de relações com o resto (empate por hash); −20 com cada um que fica; veto de 26 semanas para voltar.
2. **Recrutamento**: no dia de cada eixo, o melhor candidato (nota = soma das relações com os membros, +40 se é de uma praça onde o eixo não tem ninguém):
   - se somos nós: vira **convite** no feed (se não recusamos esse eixo nas últimas 26 semanas);
   - se o eixo é nosso: vira **proposta** para aprovarmos (uma a cada 13 semanas; podemos vetar);
   - senão: entra direto.
3. **Fundação**: a cada 13 semanas (semana e dia por hash, 75% de chance), procura-se um grupo de até 5 torcidas do computador com relação ≥ +45 entre **todas**, sem maiores rivais entre si, com pelo menos metade ainda sem eixo, respeitando o máximo em comum; o maior grupo com ≥ 3 funda o eixo. O nome sai da lista `pt` se metade ou mais é do Brasil, senão `es`.

**As nossas jogadas:**

| Jogada | Regra |
|---|---|
| Fundar (`fundarNosso`) | cabemos em mais um eixo; a mesa está livre (13 semanas); nome de 3 a 32 letras, sem repetir; convidar ≥ 2 torcidas com relação ≥ +45 conosco, sem rivais entre si. Cada convidada aceita com chance `limitar((rel − 5)/80 + (0,1 se não tem eixo; −0,2 se tem); 0,08; 0,92)`. Nasce se pelo menos 2 aceitam; quem recusou só volta a ouvir em 26 semanas |
| Candidatar-se (`candidatar`) | chance `limitar((média das relações com os membros + 10)/90 + 0,1 se o eixo não tem ninguém da nossa praça − 0,15 se já temos eixo; 0,05; 0,9)`. Recusado: 26 semanas de espera para aquele eixo |
| Convidar (`convidar`) | um nome a cada 15 dias por eixo; mesma chance do convite de fundação |
| Recusar convite (`recusar`) | −3 com a torcida que trouxe o convite; o eixo espera 26 semanas |
| Vetar proposta (`vetar`) | aquele nome não volta por 26 semanas |

Sorteios por hash (não mudam recarregando o save).

**A mesa delas** (`diplomaciaDelas`/`mesaDela`): a cada 91 dias, cada torcida do computador trabalha com as 12 aliadas mais próximas (relação ≥ 20) e escolhe **uma** jogada:

| Jogada | Entre | Efeito | Peso |
|---|---|---|---|
| `aproximar` | duas parceiras com relação entre −15 e +45 | sobe `round(15 + 10×força)`, teto +45 | 1; +2 se só uma é do eixo dela; +1 se as duas são |
| `pacificar` | duas parceiras com relação < −15 | sobe `round(15 + 5×força)`, teto 0 | 1; +2 se alguma é do eixo |
| `afastar` | uma parceira do eixo que é aliada (≥ 20) de um maior rival do eixo hostil à anfitriã | cai `round(15 + 10×força)`, piso 0; irmã não se larga | 3 |

`força = limitar((menor relação da anfitriã com as duas − 20)/60, 0, 1)`; a jogada só sai se o hash da semana der menos que `0,25 + 0,6 × força`. Travas (só `aproximar`/`pacificar`): nunca entre maiores rivais; `circuloEmComum` — as duas precisam ter em comum **mais da metade** do círculo de aliadas da que tem o círculo menor (só na aproximação); `trancaDeAliado` — nenhuma das duas pode ser aliada (≥ 20) de um maior rival da outra. Se a jogada toca o nosso eixo, entra no histórico de novidades.

Histórico (`novidades`): entradas `entrou`, `saiu`, `fundou`, `aproximar`, `pacificar`, `afastar`, com marca de "nova" até a tela ser aberta.

### 6.2 Relação com o clube (`relacaoclube.js`)

Medidor separado de moral e prestígio, de **0 a 100**, guardado em `E.relacaoClube`; **nasce em 50**. Toda mudança entra em `E.relacaoClubeHistorico` (últimas 200) com dia, delta, motivo e tipo.

**Faixas e benefícios** (`FAIXAS`):

| Faixa | Rótulo | Ingressos | Bônus de loja | Abatimento na caravana |
|---|---|---|---|---|
| 0–25 | ruim | 0 | 0 | 0 |
| 26–50 | morna | 10% | 0 | 0 |
| 51–75 | boa | 30% | +5% | 0 |
| 76–100 | ótima | 60% | +15% | 20% |

- **Ingressos** (`ingressosDoJogo`): em jogo em casa, a torcida vende `round(total de membros × %)` ingressos aos próprios membros a **R$ 10** (`PRECO_INGRESSO`).
- **Loja**: receita × `(1 + bônus)`. **Caravana**: custo × `(1 − abatimento)`.

**O que mexe:**

| Evento | Variação |
|---|---|
| Jogo em casa com mais de 80% dos membros no estádio | +2 |
| Jogo fora: caravana com > 60% / > 40% / > 20% dos membros | +6 / +4 / +1 (só o degrau mais alto) |
| Briga nos arredores do estádio | −6 em casa, −4 fora |
| Briga na arquibancada | −10 em casa, −6 fora |
| Respostas de entrevista (`feed.js`) | conforme a opção; elogio só leva até o teto `TETO_ELOGIO` (70) |

**Sequência do clube** (`registrarResultadoClube`): guarda os últimos 8 resultados (V/E/D). `sequenciaRuim` = 3 ou mais derrotas nos últimos 5 jogos (condição do protesto no CT).

Para as torcidas do computador, a versão simplificada está em 3.5 (item 8).

### 6.3 A praça em dia de jogo (`praca.js`)

**Jogos na praça** (`jogosDaPraca`): todos os jogos da semana cujo mandante é da praça, com dia e hora.

**Quem está na rua** (`naRuaEm(E, dia)`), um "bonde" por torcida:

- torcidas do mandante com sede na praça: efetivo = disponíveis (a nossa: efetivo da saída planejada) menos o que cederam de escolta (mínimo 4);
- torcidas do visitante que moram na praça: idem;
- torcidas do visitante de fora: só aparecem se a caravana (`planejamento.caravanaDe`) tem **5 ou mais**; somam a escolta do anfitrião, se houver (2.7). Torcida que tem filial na praça não vem como caravana.

Cada bonde leva `cor`, `cor2`, `cor3`, `sigla` (únicas na noite, 1.8), `deFora`, `escolta`.

**Encontro na ida ao estádio** (`resolverIda`), jogo em casa:

1. Se o plano do jogo tem intenção de ataque com alvo que está na rua → briga **planejada** no lugar escolhido (arredores, bar, praça ou rua do bairro), com o nosso efetivo limitado ao do plano.
2. Senão, para cada inimigo na rua (hostil: relação ≤ −15, sem trégua, não irmã), do maior para o menor:
   - **Procuraram** com chance (em %): `limitar((BASE + mágoa × 0,3) × fator de paridade; 0; 57)`
     - `BASE` pelo grau de rivalidade: maior rival 62, rival 36, hostil 10 (grau pela fonte; ou relação ≤ −60 = maior, ≤ −30 = rival);
     - `mágoa = max(0, −relação − 45)`;
     - `fator de paridade` com `r = efetivo deles / nosso`: 0 se `r < 0,45`; cresce linearmente até 1 em `r = 0,80`; acima, `min(1,3; 1 + (r − 0,8) × 0,5)`.
   - Se não procuraram, **acaso**: chance `min(7,2; max(0, −relação)/20)` %.
   - O lugar (`lugarDoEncontro`): um bairro, por hash, dentre os que ficam a menos de **190** unidades da reta entre a nossa sede (e a deles) e o estádio; o tipo de local sai do ponto sorteado no bairro.
3. Sem encontro: paz.

**Tipo de local** (`localDe`): a menos de 70 unidades de um campo → `arredores`; em área larga (≥ 23 células andáveis numa janela 5×5) → `praca`; senão a rua da classe do bairro (5.12).

**Encontro fora de casa** (`encontroDaViagem`): só existe se planejamos atacar uma torcida na viagem; local pelo plano (`arredores`, `pista`, `praca`); bairro: sede dela (praça), vizinho do estádio (pista) ou bairro do estádio; efetivo deles = disponíveis (mínimo 4), o nosso = o do ataque planejado (mínimo 2).

**Investida em jogo de terceiros** (`encontroDaPraca`): quando marcamos uma investida num jogo de outros clubes na nossa cidade, contra um alvo que está na rua naquele dia.

`hostis(E, a, b)` entre duas torcidas do computador usa só a fonte (Rival/Maior Rival).

---

## 7. Futebol

### 7.1 Visão geral e calendário anual

O ano tem 52 semanas. Vitória 3 pontos, empate 1, derrota 0. Três motores:

| Motor | Arquivo | Cobre | Quando roda |
|---|---|---|---|
| Temporada brasileira | `competicoes.js` | regionais, Séries A–D, Copa do Brasil — **jogo a jogo** | todo dia (`jogarDia`) |
| Ligas "de fora" | `ligas.js` | as ligas dos outros 9 países (e as do Brasil, quando o jogador é de outro país) — **resumidas** | domingo (dia 7) |
| Conmebol | `conmebol.js` | Libertadores, Sul-Americana e as copas nacionais dos países de fora | quarta (dia 3) |

Se o jogador é do **Brasil**: a temporada brasileira é completa; os outros países correm resumidos. Se é de **outro país** (`competicoes.js: paisDoJogador`): `montarTemporada` devolve a temporada vazia (`deFora:true`), o Brasil corre resumido pelas regras de `FORMATOS_BR` (sem estaduais e sem Copa do Brasil) e a liga e a copa do país do jogador ganham jogos marcados na agenda.

Calendário (semanas do ano):

| Semanas | O quê |
|---|---|
| 1–13 | regionais e estaduais; **todas as finais na semana 13** |
| 6–13 | Libertadores: fases 1 (6–7), 2 (9–10), 3 (12–13) |
| 13–14 | Sul-Americana: fase preliminar |
| 14–48 | Séries A, B e C (35 semanas, 38 rodadas) |
| 14 em diante | Série D: grupos (19 semanas, 22 rodadas) e depois mata-mata |
| 15–25 (ímpares) | Libertadores: 6 rodadas de grupos |
| 16–26 (pares) | Sul-Americana: 6 rodadas de grupos |
| 22, 26, 30 | Copa do Brasil: 1ª, 2ª e 3ª fases |
| 30/32 | Sul-Americana: playoff |
| 32/34 · 38/40 · 44/46 · 49 | Libertadores: oitavas, quartas, semi, final |
| 35/37 · 39/41 · 43/45 · 48 | Sul-Americana: oitavas, quartas, semi, final |
| 34/35 · 39/40 · 44/45 · 50 | Copa do Brasil: oitavas, quartas, semi, final |
| 10, 14, 18, 24, 28, 34, 40, 46 | copas nacionais de fora (uma fase por data) |
| até 51 | ligas de fora |
| virada | sobe e desce, evolução de força, almanaque (8.3) |

A temporada é sorteada com semente `E.semente + ano` (ligas: `+ ano×7`; Conmebol: `+ ano×13`).

**Grade de horários** (`GRADE`; dia 6 = sábado, 7 = domingo, 3 = quarta):

| Competição | Horários |
|---|---|
| Série A | sáb 16:00, 18:30, 21:00 · dom 11:00, 16:00, 18:30, 20:30 |
| Série B | sáb 17:00, 20:30 · dom 16:00, 18:00, 20:00 |
| Série C | sáb 16:30, 19:30 · dom 15:00, 17:00 |
| Série D | sáb 15:00, 17:00 · dom 10:00, 15:00, 16:00 |
| Regionais | sáb 16:00, 18:30 · dom 11:00, 16:00, 18:30 |
| Copa do Brasil | qua 19:00, 21:30; final dom 16:00 |
| Rodada de meio de semana | qua 19:00, 19:30, 21:30 |
| Ligas de fora (jogador) | sáb 17:00, 19:30 · dom 16:00, 18:30, 20:00; mata-mata: ida qui 21:30, volta dom 18:00 |
| Conmebol e copas de fora | qua 21:30 |

**Rodadas de meio de semana**: regionais têm 2, nacionais têm 3 (`MEIO_POR_TIPO`), nas rodadas de índice `round(total × i/(n+1))`; a rodada de meio divide a semana com a rodada seguinte.

### 7.2 Regionais e estaduais (semanas 1–13)

Formato por nome (`FORMATO`); sem entrada, `formatoRegional(n)`: ≥ 16 clubes → 2 grupos, passam 4; ≥ 12 → 2 grupos, passam 2; ≥ 7 → 1 grupo, passam 4, turno único; menos → 1 grupo, passam 4, turno e returno. Se o formato não cabe em 13 semanas, o returno cai.

| Regional | Clubes | Grupos | Turnos | Passam | Início (semana) | Observação |
|---|---|---|---|---|---|---|
| Catarinense | 6 | 1 | 2 | 4 | 4 | |
| Mineiro | 6 | 1 | 2 | 4 | 4 | |
| Paranaense | 6 | 1 | 2 | 4 | 4 | |
| Paulistão | 10 | 1 | 1 | 4 | 5 | o último desce para a A2 |
| Paulistão A2 | 10 | 1 | 1 | 4 | 5 | o campeão sobe |
| Cariocão | 10 | 1 | 1 | 4 | 5 | |
| Copa Centro-Oeste | 10 | 1 | 1 | 4 | 5 | |
| Gauchão | 8 | 1 | 1 | 4 | 7 | |
| Copa Norte | 8 | 1 | 1 | 4 | 7 | |
| Copa do Nordeste | 16 | 2 de 8 | 1 | 4 por grupo | 6 | o último de cada grupo desce |
| Nordestão Série B | 18 | 2 de 9 | 1 | 4 por grupo | 4 | campeão e vice sobem |

- Grupos por **serpentina de força** (`dividirGrupos`): clubes ordenados por força, distribuídos 1-2-2-1.
- Fase de grupos: todos contra todos dentro do grupo (`roundRobin`, método do círculo; mando alterna a cada rodada).
- Mata-mata em **jogo único**, uma fase por semana, com a final na semana 13:
  - 1 grupo, 4 passam: 1º×4º e 2º×3º;
  - 2 grupos, 4 passam: A1×B4, B2×A3, B1×A4, A2×B3;
  - fases seguintes: vencedores em pares consecutivos, mando do mais forte.
- Empate no mata-mata: pênaltis (7.6).

### 7.3 Brasileirão: Séries A, B, C e D (a partir da semana 14)

- **Séries A, B, C** (20 clubes cada; regra: divisão com até 20 clubes): pontos corridos, turno e returno, 38 rodadas em 35 semanas (14 a 48). Campeão = 1º da tabela, vice = 2º.
- **Série D** (48 clubes; regra: mais de 20): 4 grupos **regionais** de 12 (`dividirGruposPorRegiao`: clubes ordenados pela cadeia de UFs `RR, AP, AM, PA, AC, RO, TO, MA, PI, CE, RN, PB, PE, AL, SE, BA, GO, DF, MT, MS, ES, MG, RJ, SP, PR, SC, RS`, depois por praça; fatias iguais), turno e returno (22 rodadas, 19 semanas). Passam 4 por grupo → 16 clubes em mata-mata de **ida e volta** (ida numa semana, volta na seguinte, mando invertido): oitavas (A1×B4, B2×A3, B1×A4, A2×B3, idem C/D), quartas, semifinal, final. Agregado empatado: pênaltis.
- Critérios de desempate da tabela (`tabela`): pontos, vitórias, saldo, gols pró, ordem alfabética.

### 7.4 Copa do Brasil

Todos os 108 clubes brasileiros. Fases (`COPA_FASES`):

| Fase | Semana(s) | Formato | Sorteio |
|---|---|---|---|
| Primeira fase | 22 | jogo único; os 88 clubes fora da Série A | potes |
| Segunda fase | 26 | jogo único; entram os 20 da Série A (64 clubes) | potes |
| Terceira fase | 30 | jogo único (32) | potes |
| Oitavas | 34 e 35 | ida e volta | potes |
| Quartas | 39 e 40 | ida e volta | livre |
| Semifinal | 44 e 45 | ida e volta | livre |
| Final | 50 | jogo único em **campo neutro** | livre |

- **Potes** (`sortearPorPotes`): os clubes são ordenados por divisão (A melhor) e depois por força; a metade de cima enfrenta a metade de baixo, embaralhadas. **Mando** (`mandante`): no jogo único, o de melhor divisão (empate: o mais forte); na ida e volta, a ida é na casa do pior e a volta na do melhor. Número ímpar: um clube passa sem jogar.
- **Campo neutro** (`campoNeutro`): o estádio de maior capacidade que não seja de nenhum dos dois finalistas.
- Empate (no jogo único ou no agregado): pênaltis.

### 7.5 Arrumação de mandos e da agenda

- **Mandos** (`ajustarMandos`, ao montar regionais e séries): (a) dois **rivais diretos** não mandam jogo no mesmo dia da mesma janela (fim de semana ou meio de semana); (b) nenhum clube faz mais de **3** jogos seguidos em casa ou fora (`MAX_SEGUIDOS`). Rivais diretos (`rivaisDiretos`): pares de clubes ligados por `maioresRivais` das torcidas, casados um a um por peso (mesma praça +1000, + maior efetivo das torcidas de cada clube, +1 se citado dos dois lados). O algoritmo primeiro tenta mudar o dia do jogo (sábado↔domingo; quarta→terça→quinta) e depois inverte mandos por busca local (até 1.200 + 900 passos; no returno inverte as duas pernas juntas).
- **Agenda do nosso clube** (`arrumarAgenda`, antes de cada dia/semana): no máximo **2 jogos por semana** e **3 dias** de folga entre jogos. O jogo de menor peso é adiado (ou antecipado) em até 6 semanas — pesos: Conmebol e competições de fora 3 (fixos, não se movem), mata-mata e copa 2, nacional 1, regional 0. Dias preferidos ao remarcar: sábado, domingo, quarta, quinta, sexta, terça, segunda.
- `jogoDaSemana` = o jogo "principal" da semana (mata-mata e fim de semana pesam mais).

### 7.6 Como um jogo é simulado

**Força do clube**: `forçaDe = limitar(força base + investimento, 1, 100)`. Base = `E.forcas[id]` (após a primeira virada) ou `qualidade` da fonte; investimento = pontos comprados por torcidas (`E.investimento[id]`).

**Placar** (`simular(casa, fora, bônus)`):

```
dif        = (força da casa − força do visitante + bônus) / 55
λ casa     = limitar(1,60 + dif × 1,5 ; 0,25 ; 5)
λ visitante= limitar(1,10 − dif × 1,5 ; 0,20 ; 5)
gols de cada lado = sorteio de Poisson com a média λ
```

O **mando** vale por si 0,5 gol de diferença nas médias (1,60 contra 1,10).

**Fator torcida** — o `bônus` (`fatorDoJogo`), em pontos de força somados ao mandante:

| Parcela | Valor |
|---|---|
| Bateria (`bonusTorcida`) | **+11** (`55 × 0,20`) se o mandante é o clube do jogador e a bateria tocou nos últimos 7 dias (`E.bateriaAbs`) |
| Festas da nossa torcida (`TO.festas.usarNoJogo`) | `55 × soma dos percentuais das festas usadas`, a favor do nosso clube |
| Festas das torcidas do computador (`relacoes.js: festasDelasNoJogo`) | cada torcida dos dois clubes com festas em estoque gasta uma de cada tipo: `±55 × soma dos pct` (mais para o mandante, menos para o visitante); a visitante de outra praça só monta festa se a caravana tem ≥ 10 |

Jogos das ligas resumidas e os duelos da Conmebol sem o jogador usam `simular(a, b, 0)` — só força e mando.

**Pênaltis** (`disputaDePenaltis`):

- chance de converter de cada lado: `limitar(0,755 + (p − 0,5) × 2 × 0,032 ; 0,55 ; 0,95)`, `p = força / (soma das forças)` — o mais forte chega a ≈ 78,7%, o mais fraco a ≈ 72,3%;
- série de **5** cobranças alternadas (mandante primeiro), encerrada assim que um lado não pode mais ser alcançado;
- depois, cobranças alternadas até desempatar, no máximo **50** rodadas; se ainda empatar, sorteio ponderado pelas chances;
- a disputa do nosso clube fica guardada (`E.penaltisPendente`) para ser mostrada.

### 7.7 Acesso, rebaixamento e classificação

**Brasil** (`aplicarSobeDesce`, na virada): entre A–B, B–C e C–D trocam **4** clubes (`TROCA`): os 4 piores de cima descem, os 4 melhores de baixo sobem. Da Série D ninguém cai; a Série A não tem acesso. "Melhores" em pontos corridos = os 4 primeiros; na Série D = campeão, vice e os dois eliminados na semifinal. Regionais: Paulistão ↔ Paulistão A2 troca 1; Copa do Nordeste ↔ Nordestão Série B troca 2. O resultado fica em `E.divisoes[id]` / `E.regionais[id]` (sobrepõem a fonte) e no histórico `E.sobeDesce` (400 linhas).

**Fora** (`ligas.js: aplicarSobeDesce`): entre divisões seguidas do mesmo país, trocam `min(quem cai de cima, quem sobe de baixo)` clubes; fica em `E.divisoesLiga[id]`.

**Vagas da Conmebol**: 7.10.

### 7.8 Evolução da força na virada (`evoluirForca`)

Para cada clube que disputou competições da temporada, soma-se um delta sorteado pela posição final:

| Competição | Posição → delta (inteiro sorteado) |
|---|---|
| Série A | 1º–4º: 5 + (−5 a 5) · 5º–16º: 2 + (−5 a 5) · 17º–20º: −6 a 3 |
| Série B | 1º–4º: 3 + (−2 a 5) · demais: −4 a 2 |
| Série C | 1º–4º: 2 + (−1 a 4) · 5º–10º: −1 a 2 · 11º–16º: −2 a 2 · demais: −2 a 1 |
| Série D (por grupo) | 1º–4º: 2 + (−1 a 2) · 5º–12º: −1 a 2 · demais: −1 a 1 |
| Outras (regionais, copas, ligas agendadas) | 1º–2º: 0 a 2 · demais: −1 a 1 — tudo × 0,5 |

Em cada competição a média dos deltas é zerada (soma zero). Nova força = `round(força + delta total/2 + (média da divisão − força) × 0,12)`, limitada a 1–100 (a "gravidade" de 12% puxa cada clube para a média da divisão). O resultado alimenta a página "janela" do almanaque. Clubes que só correm nas ligas resumidas não passam por esta evolução.

### 7.9 Investimento no elenco (`investir`)

Uma torcida compra pontos de força para o clube. Preço de **cada ponto**, pela força atual:

| Força até | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 |
|---|---|---|---|---|---|---|---|---|---|---|
| Custo (R$ mil) | 20 | 32 | 56 | 80 | 100 | 120 | 140 | 160 | 200 | 320 |

O jogador compra quantos pontos couberem no caixa; a torcida do computador compra 1 por vez e só se o clube está abaixo da média da divisão (3.5).

### 7.10 Libertadores e Sul-Americana (`conmebol.js`)

**Quem entra.** Em **2026** valem as listas reais embutidas (`REAIS`): Libertadores — 28 clubes direto nos grupos, 13 na fase 2, 6 na fase 1; Sul-Americana — 12 diretos e 32 na fase preliminar (se algum id faltar nos dados, cai na regra geral). Nos anos seguintes, vagas por país:

| País | Libertadores | Sul-Americana |
|---|---|---|
| Brasil | 7 | 6 |
| Argentina | 6 | 6 |
| Bolívia, Chile, Colômbia, Equador, Paraguai, Peru, Uruguai, Venezuela | 4 cada | 4 cada |

- A ordem de cada país é a **foto tirada na virada** (`fotoDasVagas`): Brasil = campeão da Copa do Brasil, depois a tabela da Série A; fora = campeão do ano, campeões dos torneios, tabela anual (`ligas.js: ordemDoPais`). O campeão da copa nacional sobe para a 2ª posição da fila.
- Os primeiros da fila vão para a Libertadores, os seguintes para a Sul-Americana. Os **campeões vigentes** das duas copas entram na Libertadores como vaga extra.
- Na regra geral, os 28 mais fortes da Libertadores vão direto aos grupos e os 12 mais fortes da Sul-Americana também; o resto joga as fases prévias.

**Libertadores:**

| Fase | Semanas | Formato |
|---|---|---|
| Fase 1 | 6–7 | os 6 últimos da prévia, ida e volta → 3 |
| Fase 2 | 9–10 | os 3 + os que esperavam (13 em 2026) → 8 |
| Fase 3 | 12–13 | 8 → 4 entram nos grupos; os 4 eliminados vão para os grupos da Sul-Americana |
| Grupos | 15, 17, 19, 21, 23, 25 | 32 clubes, 8 grupos de 4 por 4 potes de força; turno e returno |
| Oitavas | 32 e 34 | 1º de um grupo × 2º do grupo seguinte; ida e volta |
| Quartas / Semi | 38 e 40 / 44 e 46 | ida e volta |
| Final | 49 | jogo único, campo neutro |

Os dois primeiros de cada grupo avançam; os terceiros vão ao playoff da Sul-Americana.

**Sul-Americana:**

| Fase | Semanas | Formato |
|---|---|---|
| Fase preliminar | 13–14 | 32 clubes agrupados por país (duelos nacionais), ida e volta → 16 |
| Grupos | 16, 18, 20, 22, 24, 26 | 12 diretos + 16 + 4 vindos da Libertadores = 32; 8 grupos de 4 |
| Playoff | 30 e 32 | 2º de cada grupo × 3º de grupo da Libertadores |
| Oitavas | 35 e 37 | 1º de grupo × vencedor do playoff |
| Quartas / Semi | 39 e 41 / 43 e 45 | ida e volta |
| Final | 48 | jogo único, campo neutro |

Regras comuns: ida na casa do segundo do par, volta na do primeiro; agregado empatado → pênaltis; classificação dos grupos por pontos, saldo, gols pró. Os duelos **sem o nosso clube** são resolvidos de uma vez na quarta-feira da última semana da fase. Os jogos **do nosso clube** são marcados na agenda (competições `libertadores-de-fora` / `sulamericana-de-fora`, tipo `copa-de-fora`), jogados no dia com fator torcida, e a Conmebol lê o resultado. O campeão fica em `E.conmebolCampeoes`; cada edição é arquivada em `E.conmebolHistorico` (80 anos).

**Copas nacionais de fora** (`criarCopasNacionais`): uma por país das ligas resumidas (nome do campo `copa` do clube, ou "Copa <país>"). Entram os clubes mais fortes até a maior potência de 2 que caiba; com 16 ou mais, potes (metade forte × metade fraca). Jogo único, quarta 21:30, mando do mais forte, pênaltis no empate; uma fase em cada semana de `10, 14, 18, 24, 28, 34, 40, 46`. No país do jogador os jogos entram na agenda.

### 7.11 As ligas de fora (`ligas.js`)

Andam um "tique" por semana, no domingo: em cada tique jogam-se `ceil(total de rodadas / (51 − semana de início))` rodadas. Fase nova começa na semana seguinte; mata-mata joga uma fase por semana. Desempate: pontos, saldo, gols pró. Tipos de fase: `regular` (zonas, todos contra todos; rodadas interzonais opcionais), `quadrangular`/`hexagonal` (grupos), `mata` (jogo único ou ida e volta), `final2` (final em ida e volta entre os vencedores dos grupos). Os clubes de cada divisão são embaralhados a cada ano antes de repartir as zonas.

| Divisão | Torneios (semana de início) | Formato de cada torneio | Título do ano | Sobe / cai |
|---|---|---|---|---|
| Argentina Primera (30) | Apertura (6), Clausura (30) | 2 zonas de 15, 16 rodadas (14 na zona + 2 interzonais); 8 por zona → mata-mata de 16 em jogo único, final neutra | campeão do Clausura; "Campeão de Liga" = 1º da tabela anual | caem 2: o pior nos **promedios** (pontos por jogo de 3 anos) + o último da anual |
| Argentina Primera Nacional (38) | um (8) | 2 zonas de 19, 19 rodadas; 8 por zona → mata de 16, jogo único | campeão do torneio | sobem 2 (anual); caem 4 |
| Argentina Primera B (20) | um (8) | 19 rodadas; 8 → mata, jogo único | campeão do torneio | sobem 2 |
| Bolívia Primera (16) | Liga (6), Copa da División (32) | Liga: 30 rodadas. Copa: 4 grupos de 4 (6 rodadas) → mata de 4, ida e volta | campeão do último torneio | caem 2 |
| Chile Primera (16) | um (10) | 30 rodadas | líder | caem 2 |
| Chile Primera B (16) | um (10) | 30 rodadas + mata de 4, ida e volta | campeão do torneio | sobem 2 |
| Colômbia Primera A (20) | Apertura (4), Finalización (30) | 19 rodadas; 8 → 2 quadrangulares (6 rodadas); final ida e volta | campeão do Finalización | caem 2 |
| Colômbia Primera B (16) | Apertura B (4), Finalización B (30) | 15 rodadas; idem | campeão do último torneio | sobem 2 |
| Equador Serie A (16) | LigaPro (8) | 30 rodadas + hexagonal dos 6 primeiros (10 rodadas) | **líder da fase regular** (o hexagonal é jogado, mas `coroar` lê a tabela regular) | caem 2 |
| Paraguai Primera (12) | Apertura (5), Clausura (30) | 22 rodadas cada | campeão do Clausura | cai 1 |
| Peru Liga 1 (18) | Apertura (6), Clausura (30) | 17 rodadas cada | **playoff do título** com 4: os campeões + os melhores da anual; mesmo campeão nos dois = título direto | caem 2 |
| Uruguai Primera (16) | Apertura (6), Intermedio (24), Clausura (32) | Apertura/Clausura: 15 rodadas. Intermedio: 2 grupos de 8 (7 rodadas) + final em jogo único | **final dos campeões**: os campeões dos torneios + o líder da anual, em ida e volta | caem 2 |
| Venezuela Primera (14) | Apertura (6), Clausura (30) | 13 rodadas; 8 → 2 quadrangulares; final ida e volta | **Série Final** entre os dois campeões | caem 2 |
| Brasileirão A, B, C (jogador de fora) | um (16) | 38 rodadas | líder (A: também "Campeão de Liga") | A cai 4; B e C sobem 4 e caem 4 |
| Brasileirão D (jogador de fora) | um (16) | 4 zonas, 11 rodadas; 4 por zona → mata de 16, ida e volta | campeão | sobem 4 |

- Decisões de fim de ano (`decidirEntre`): ida e volta, agregado, pênaltis.
- Em países de divisão única, os "caem" são calculados mas não há troca (não existe divisão de baixo).
- No **país do jogador** (`T.comJogos`): os jogos do torneio entram em `E.temporada` como competição `fora-<id>` (tipo `liga-de-fora`), são jogados dia a dia com fator torcida e a liga lê o placar marcado.
- Histórico: `E.ligasHistorico` (80 anos), `E.promedios[divisão][clube]` (últimos 3 anos na Argentina Primera).

### 7.12 O que a expansão sul-americana cobre

Implementado: 248 clubes em 13 divisões de 9 países; 248 barras (uma por clube) em 64 praças com 620 bairros e rivalidades internas; 13 irmandades com organizadas brasileiras; a malha de rotas `CONMEBOL` e de fronteira `INT`; as ligas com os formatos acima; copas nacionais; Libertadores e Sul-Americana com as listas reais de 2026; ranking nacional e prêmios por país; nomes de eixos em espanhol; jogar com torcida de qualquer país. Não coberto: estádios mapeados por bairro (`estadios.js` só tem o Brasil; os de fora são estimados por hash), escudos de torcida e capas de praça de fora (os manifestos só listam as brasileiras), plantas assadas (`plantas.js` só tem as 30 praças brasileiras — as de fora usam a planta gerada), o Torneo Federal A argentino. `docs/EXPANSAO_AMERICA_DO_SUL.md` e `docs/FORMATOS_SULAMERICANOS.md` são o planejamento e descrevem pendências já resolvidas no código (torcidas, bairros, calendário).

---

## 8. Jornais e almanaque

Os três módulos só **montam o conteúdo** de uma página (objetos com chapéu, manchete, olho, tarja, quadro); quem decide quando publicar é o feed, e quem desenha é a interface. Os textos saem de listas de moldes (`MOLDES`) com chaves `{A}`, `{B}`… A escolha do molde é determinística: pela data (`dia + mês×31`) ou pelo ano.

### 8.1 Gazeta dos Sports (`gazeta.js`) — o recorte da rodada

`montar(E, mensagem)` recebe os jogos do dia (`dados.jogos`) e o nosso (`dados.nosso`); **sem jogo nosso não há edição**.

**Capa:**

| Peça | Regra |
|---|---|
| Cabeça | "Ano" em romano (`ano − 2025`), nº da edição (`dia absoluto + 100`), data por extenso |
| Tarja | nº de jogos, de competições e de gols do dia; rodada/fase de até 2 competições |
| Chapéu | "Dia de decisão" (mata-mata) → "A maior goleada do dia" (saldo ≥ 3) → "Clássico na nossa praça" (dois clubes da mesma praça) → "Rodada do meio de semana" (segunda a sexta) → "O jogo do dia" |
| Manchete | sempre sobre o **nosso jogo**: pênaltis; empate com gols / 0×0; eliminação em mata-mata; por saldo: 5+, 4, 3, 2; 1 gol fora / 1 gol em casa. Dois ou três moldes por caso, em rodízio |
| Olho | variantes: pênaltis, mata-mata, empate, sem estádio, "dia cheio" (≥ 8 jogos e saldo < 3), padrão |
| Placar | mandante, gols, visitante, e se somos a casa ou o visitante |
| Recorte da tabela (`recorteDaTabela`) | **7 linhas** centradas no nosso clube (3 acima e 3 abaixo, ajustado nas pontas), da competição do jogo; na Conmebol, o nosso grupo |

**Página cheia** (`paginaCheia`):

- **Na praça**: os outros jogos disputados na nossa cidade (1 jogo: frase com estádio; 2: os dois placares; nenhum: frase de cidade quieta).
- **A nossa caixa**: placar e a frase do resultado (vitória em casa/fora, empate, derrota, goleada a favor ≥ 3, goleada contra ≥ 3, classificados/eliminados nos pênaltis) e a posição na tabela.
- **Notas**: até **4** outros jogos, um por tipo de resultado antes de repetir, ordenados por: jogos da nossa divisão primeiro, depois o clube mais forte envolvido, soma das forças, saldo, gols.
- **Placares**: até **10** linhas (`LINHAS`), agrupadas por competição/rodada — a nossa competição primeiro; o resto vira "e mais N".
- **Classificação**: os **8** primeiros (`TOPO_TABELA`) da nossa divisão (ou da competição com mais rodadas nossas); se estamos abaixo do 8º: os 6 primeiros, um salto e nós com um vizinho de cada lado.

### 8.2 Futebol e Porrada (`porrada.js`) — brigas e obras

**Edição de briga** (`montar`), sobre uma briga **nossa** (`a` = nós, `b` = eles):

- Condição da manchete: sem resistência → `semLuta`; mesmo nº de feridos e não vencemos → `empate`; 4 ou mais presos somados → `cadeia`; vencemos → `vitoriaMenos` (éramos menos de 80% deles), `atropelo` (diferença de feridos ≥ 3) ou `vitoria`; perdemos → `apanhouMenos`, `apanhou` (≥ 3) ou `derrota`.
- À lista de manchetes da condição somam-se as **manchetes da cena** (vitória/derrota) do grupo do lugar: arquibancada, emboscada, bar, comércio, casa (sede, subsede, CT, casa de piscina), praça, rua, arredores, treta (becos e cenas de bairro) e **apoio** (quando um aliado desceu junto; usa `{AL}`).
- Chapéu: "Ninguém desceu" · "Noite de camburão" (≥ 4 presos) · "Desceu junto" (aliado) · "O setor se pegou" (arquibancada) · "Era menos e não correu" · "Atropelo" · "O pau do dia".
- Olho: onde foi (nome da cena + ", no bairro X" quando cabe), efetivos, feridos e presos.
- Tarja: total na treta, feridos, presos, lugar. Placar: **derrubados** de cada lado. Quadro: os dois lados com efetivo, feridos, presos e o vencedor.
- Cabeça: ano em romano, edição = nº da nossa briga (`E.brigasNossasTotal`), data.
- **Outras brigas do dia** (`outrasBrigas`): das brigas do mundo no mesmo dia (`E.brigasIA`), até **6** notas (`MOSTRA`), das maiores para as menores, variando o tipo: `cadeia` (≥ 12 presos), `empate` (mesmos feridos), `atropelo` (diferença ≥ 3), `vitoria`; com cidade e o motivo ("na sombra de Fulano × Beltrano", "ataque ao bar", "emboscada na estrada"…). Sem nenhuma: "O resto do país passou o dia em paz."
- **As nossas outras da noite** (`nossasOutras`) e o total da noite, quando houve mais de uma.

**Edição de obra** (`montarObra`): sai quando uma torcida que nos interessa constrói — a nossa, uma da nossa praça, ou qualquer uma com relação de módulo ≥ 25 (`feed.js: obraInteressa`). Grupos: `abriu` (bar, loja, subsede), `ampliou`, `sede`, `fabrica`, `filial`, `presente` (sede dada por aliada). Chapéus: "Porta nova na cidade", "Reforma na cidade", "A casa cresceu", "Material próprio", "Bandeira fora da cidade", "Presente de aliada". Na praça, o olho compara os "pontos" (bares + lojas + subsedes) dela com os nossos, e o **quadro da cidade** mostra as duas colunas (bares, lojas, subsedes, pontos) e quem tem mais. Edição nº `dia absoluto + 200`.

### 8.3 O Almanaque (`almanaque.js`)

Todas as páginas têm `jornal: 'O Almanaque'`, uma `edicao`, `tom` (`boa`, `ruim` ou neutro) e um quadro de até **6 linhas** (`LINHAS`).

**Durante o ano:**

| Página | Quando | Conteúdo |
|---|---|---|
| **Abertura** ("Edição de véspera") | uma semana antes da estreia de uma competição em que o nosso clube joga | os 3 favoritos (mais fortes), quem briga pelo acesso (os seguintes, até o nº de vagas), os ameaçados (os mais fracos, até o nº de quedas), e a faixa do nosso clube: copa — alto (< 25% da fila), meio (< 70%), baixo; liga — risco (há queda e estamos nos 15% finais), alto (< 30%), meio (< 70%), baixo. Chapéu: "Mata-mata", "Tem gente pra cair", "Vale o acesso" ou "Começa a disputa" |
| **Campeão** ("Edição de campeão") | quando uma competição que o nosso clube disputou tem campeão | manchete em três tons: nosso título, vice nosso ("rival") ou de outros; pódio |

**Retrospectiva da virada** (`fecharAno`), nesta ordem:

| # | Página | Conteúdo |
|---|---|---|
| 1 | **Sobe e desce** ("Edição da virada") | todos os clubes que trocaram de divisão no país (no Brasil, o resultado de 7.7; fora, calculado das ligas); destaca se o nosso subiu ou caiu |
| 2 | **Os campeões** ("Edição de campeão") | todas as taças do ano: Libertadores e Sul-Americana; no nosso país primeiro, depois os outros em ordem alfabética — nacionais, copa, regionais; ligas de fora com cada torneio e o campeão do ano; copas nacionais |
| 3 | **Torcida do ano** ("Prêmio do ano") | o 1º do ranking nacional, os pontos, a distância para a 2ª, o prêmio, e o pódio de 6 |
| 4 | **Rei da pista** ("Prêmio do ano") | o maior saldo de brigas do ano (vitórias–derrotas), o prêmio, e os 6 primeiros |
| 5 | **Os donos de cada praça** | por praça (grandes, médias, pequenas; alfabética): a melhor do ranking e o rei da pista, com o bônus; quanto a nossa levou |
| 6 | **Os donos de cada região** | o mesmo por região, bônus de R$ 90 mil cada |
| 7 | **A janela** ("Edição da janela", com o ano seguinte) | quem mais ganhou e quem mais perdeu força no elenco (7.8): os 6 que mais subiram e os 2 que mais caíram |
| 8 | **O ano da obra** ("Edição do balanço") | a torcida do país que mais abriu prédios no ano (diferença entre a foto de 1º de janeiro, `tirarFoto`, e hoje) e as 6 primeiras |
| 9 | **A treta do ano** ("Edição da rua") | a briga do ano com mais derrubados (feridos + presos do perdedor) envolvendo torcida do nosso país (`anotarTreta`, atualizada a cada briga do mundo): quem, onde, semana, baixas dos dois lados |

Páginas sem dado saem na versão "vazia" (ex.: "2027 passou sem uma treta pra contar"). As páginas 3 a 6, 8 e 9 só consideram torcidas do país do jogador.

**Ordem da virada** (`estado.js`): envelhecem os membros (nossos e delas) → moral por título e vice → foto das vagas da Conmebol → placar de brigas do ano e ranking são lidos (o placar antes do ranking, porque medir o ranking zera o placar do ano novo) → campeões do ano → evolução de força → sobe e desce → torcedores das praças → **prêmios pagos** → páginas guardadas em `E.almanaquePendente` (o feed as publica) → moral de acesso/rebaixamento → temporada nova → foto do ano que começa.

### 8.4 Prêmios

Os valores estão em 4.4: `PREMIOS = [300.000, 150.000, 100.000, 70.000, 50.000]` para Torcida do Ano e para Rei da Pista; `BONUS_PRACA = {Grande 70.000, Médio 50.000, Pequeno 30.000}`; `BONUS_REGIAO = 90.000`. Lançamentos no extrato: "Prêmio Torcida do Ano AAAA — Nº lugar", "Prêmio Rei da Pista AAAA — Nº lugar", "Bônus AAAA: melhor do ranking em <praça>", "Bônus AAAA: rei da pista em <praça>", e os dois da região.

---

## 9. Mapa (`mapa.js` e `mapa_gerado.js`)

O mapa de cidade como tela saiu do jogo; estes módulos continuam fornecendo a **geometria** que os outros sistemas consultam: onde ficam sede, bar e estádio, a que bairro pertence um ponto, por onde se anda.

### 9.1 Hash determinístico

`TO.mapa.hash(texto)`: FNV-1a de 32 bits (base 2166136261, primo 16777619), resultado sem sinal. É usado em todo o jogo para escolhas estáveis: `hash(chave) % n`.

### 9.2 Estruturas da cidade (`mapa.js: estruturas`)

Lista de pinos da praça do jogador:

| Tipo | Regra |
|---|---|
| `estadio` | cada estádio de `estadiosEm` cujo bairro existe; guarda capacidade e mandantes |
| `sede` | cada torcida da praça, no `bairroSede`; com sigla e cor de texto legível |
| `bar` (das outras) | um por torcida, em bairro de **zona diferente** da sede: `bairrosForaDaZona[hash(id) % n]` |
| `bar-nosso`, `loja-nossa`, `subsede` | o nosso patrimônio, no bairro gravado |
| Neutros | mercadinho, posto de gasolina, joalheria, loja de roupas, banco, hospital; quantos por tamanho da praça (tabela abaixo); cada tipo vai para os bairros de menor `hash("tipo|bairro")` |

| Bairros na praça | Mercadinho | Posto | Joalheria | Roupas | Banco | Hospital |
|---|---|---|---|---|---|---|
| 16 | 12 | 3 | 3 | 6 | 6 | 3 |
| 12 | 8 | 2 | 2 | 4 | 4 | 2 |
| 8 | 4 | 1 | 1 | 2 | 2 | 1 |

Filtros de exibição (`E.mapaFiltros`): estádios, sedes, bares, lojas, subsedes e cada tipo neutro.

### 9.3 Qual arte a praça usa (`arteDe`)

1. Arte própria em `TO.dados.cidadeMapas` (Fortaleza, Belo Horizonte, São Paulo).
2. **Foto emprestada** (`mapa_gerado.js: emprestada`): praça `Grande` com o mesmo nº de bairros da arte-base (Fortaleza, 16) e a mesma contagem por zona herda a malha de ruas e as posições da base; os bairros são trocados zona a zona, na ordem; cada estádio herda o bairro em que cai.
3. **Planta gerada** (`gerar`) para as demais.

### 9.4 Planta gerada (`mapa_gerado.js: gerar`)

Superfície de 1200×1200 unidades, célula de 10 (`PASSO`) → grade de **120×120**. Avenida entre bairros: 2 células; rua interna: 1; quarteirão: 5×5 células.

**Disposição dos bairros** (`planta(porLado)`, `porLado` = maior nº de bairros numa zona):

| Bairros por zona | Grade de blocos | Onde cada zona fica |
|---|---|---|
| 4 (praça de 16) | 4 colunas × 6 linhas | Norte: 2×2 no alto, ao centro; Sul: 2×2 embaixo; Oeste: 2×2 à esquerda do meio; Leste: 2×2 à direita |
| 3 (praça de 12) | 5 × 5 (anel) | Norte na linha de cima, Sul na de baixo, Oeste na coluna esquerda, Leste na direita; miolo vazio |
| até 2 (praça de 8) | 3 colunas × 4 linhas | Norte no alto, Sul embaixo, Oeste e Leste nas laterais |

Lado do bloco = `floor(120 / max(colunas, linhas))`; o conjunto é centralizado e cercado por um anel de avenida.

**Cada bairro** (`montarBairro`):

1. Todas as células do bloco recebem o índice do bairro (mapa de regiões).
2. A borda de 2 células vira avenida (andável).
3. Ruas internas a cada 6 células (5 de quarteirão + 1 de rua), nas duas direções.
4. **Lotes** = células não andáveis encostadas numa rua (frente de quarteirão), ordenadas por `hash("idDoBairro|col,lin")`.
5. Registro do bairro: `{nome, id, zona, classe, mult, i, x, y (centro), area (% da superfície)}`.

**Estádios**: no centro do bairro do estádio (ou num bairro por hash do nome), retângulo de 80×57,5 unidades (`QUARTEIRAO×PASSO×1,6` por `×1,15`); os lotes sob o gramado são removidos.

**Saída**, no mesmo formato da arte importada: `{cidade, sintetica:true, largura, altura, passo, bairros, lotes, estadios, andavel, regioes}` — `andavel` em corridas por linha (alternando não-andável/andável, começando por não-andável), `regioes` com um caractere base-36 por célula (índice + 1; `0` = fora de bairro). O resultado é guardado em cache por praça.

### 9.5 Modelo sobre a arte (`mapa.js: modeloDaArte`)

1. `decodificar`: transforma `andavel` e `regioes` em matrizes (`Uint8Array`/`Int8Array`) de `n×n`, `n = largura/passo`.
2. **Estádios** (`paresDeEstadio`): cada estádio da lista casa com um campo desenhado — primeiro pelo bairro; os que sobram, o de maior capacidade com o campo de maior área.
3. **Demais pinos** (`lugarNaArte`): `lote = lotes[bairro][hash("bairro|tipo|rótulo|i") % nº de lotes]`, no centro da célula; bairro sem lotes → centro do bairro.
4. **Colisão**: raio do pino 11 (estádio: `max(13; 0,42 × menor lado do campo)`); o pino não pode cair no gramado (folga 6) nem encostar em outro (folga 5, depois 2, depois 0). Até **40** tentativas por folga, trocando o índice (`i + t×97`); sem vaga, fica no primeiro lote sorteado.
5. Resultado: `{arte, tam, malha, pinos, regioes, total, mostrando}`.

Consultas: `bairroEm(modelo, x, y)` (bairro da célula, pelo mapa de regiões) e `andavelEm(modelo, x, y)`.

### 9.6 Modelo em grade (sem arte)

Reserva de `modelo(E)` para quando não há arte: superfície de 1000 (`TAM`), margem 10, avenida de 14; cada bairro é uma célula com **12 quarteirões** (3×4) de **10 lotes**. Disposição: 4 por zona → 4×6; 3 → 5×5; senão 2×4. `especiaisDoBairro` distribui os pinos nos quarteirões: o estádio ocupa sempre o quarteirão 6; os outros, `hash("bairro|q|tipo|rótulo|i") % 12` (pulando os ocupados) e lote `hash("bairro|l|…") % 10`; ordem de prioridade: estádio, sede, nossos pontos, bar alheio. Como `arteDe` sempre devolve a planta gerada quando a praça tem bairros, este caminho só roda se `TO.mapaGerado` não estiver carregado.

### 9.7 Pontos e locais usados pela praça (`praca.js`)

- `pontoDaSede`, `pontoDoBar`, `pontoDoEstadio`, `pontoDoEstadioDoClube` (pelo mandante, depois pelo nome do estádio do clube, depois qualquer estádio): buscam o pino no modelo.
- `pontoNoBairro(modelo, bairro, chave)`: até 24 tentativas em espiral a partir do centro do bairro (ângulo por hash, raio crescente até `14 × passo`), aceitando o primeiro ponto andável dentro do bairro; senão, o centro.
- `corredor(modelo, de, até)`: bairros cujo centro fica a menos de 190 unidades do segmento entre os dois pontos (6.3).

---

# PARTE IV — O DIA DE JOGO: CENAS, COMBATE, POLÍCIA, ASSALTO E BONECOS

## 1. Como uma cena funciona

Uma **cena** é um tabuleiro de 1536 × 1024 px visto de cima, com uma malha de caminhada, pontos de nascimento, bocas de saída e, às vezes, grades e postos de PM. Sobre ela roda a simulação da briga.

Quatro módulos, cada um com um papel:

| Módulo | Papel |
|---|---|
| `js/diajogo/arredores.js` (`A`) | Carrega e desenha o fundo, mantém a malha de caminhada, resolve colisão de tudo o que anda (`A.mover`, `A.caminhavel`, `A.cabe`, `A.pontoLivreMaisProximo`, `A.barrarGrades`), desenha sobreposições e tem o editor visual (F2). Não conhece disco nem briga. |
| `js/diajogo/cenario.js` | Pinta as cenas **desenhadas** (praça e rua): calçada portuguesa, meio-fio, muro pichado, boteco, caçamba, poste. Só pinta o que a lista de blocos da cena conhece. |
| `js/diajogo/combate.js` (`C`) | A simulação: discos, golpes, IA, polícia, projéteis, faixas, fim da briga. Não desenha gente quando os bonecos estão ligados. |
| `js/diajogo/ponte.js` | O laço (`requestAnimationFrame`), o HUD, o teclado, o pad de toque, o zoom, a mira da bomba, o editor de cena e o encerramento (monta o resultado `res`). |

Por cima do canvas 2D fica um canvas WebGL transparente onde `js/diajogo/bonecos3.js` desenha os bonecos de corpo inteiro na mesma câmera de cima. Se o WebGL falha, a cena volta para os discos 2D sem parar. `js/diajogo/tres.js` é uma câmera alternativa "de perto", em terceira pessoa, com WebGL cru (sem biblioteca).

O laço chama `C.passo(J, dt, teclas, true)` uma vez por quadro (duas vezes em 2×, com o mesmo `dt`, para a física não mudar) e limita `dt` a 0,05 s.

### 1.1 Os dados de uma cena

Cada cena (`dados/cenas.js`, `dados/cenas_foto.js`, `dados/cena_arredores.js`) tem:

| Campo | Significado |
|---|---|
| `id`, `nome`, `local` | Identidade e o texto "Na pracinha do bairro". |
| `largura`, `altura`, `celula` | 1536, 1024, 8 px por célula da malha. |
| `imagem`, `foto` | A foto aérea de fundo (webp) e a marca de que a cena é de foto. |
| `mascara` | A malha de caminhada codificada em corridas (RLE por linha). Gerada por `ferramentas/importar_cena_foto.py`. |
| `poligonos` | `caminhavel` e `bloqueio`: correções da máscara desenhadas à mão. |
| `blocos`, `enfeites`, `varais` | Para as cenas desenhadas: o que bloqueia e o que só enfeita. |
| `spawns` | Onde cada bonde nasce: `{id, rot, lado: 'mandante'|'visitante', x, y, jogador, guarda, entrada}`. |
| `entradas` | As bocas (portão, saída de rua): `{id, lado, x, y, raio, dir, fica}`. |
| `fugas` | Pontos de fuga na ponta das ruas: `{x, y, raio}`. |
| `gatilho` | Para cenas em que um lado começa sem saber do outro: `{lado, perto, rot, espera, aviso, soZona}`. |
| `pmPostos` | Postos da polícia `{x, y}`. |
| `grades` | Módulos de grade de isolamento (com vida; quebram). |
| `saida` | Textos do botão de sair e a dica. |
| Marcas opcionais | `tropaChoque:false` (sem batalhão), `tropaEm` (por onde a tropa entra), `semRecuoPM`, `debandadaEm`, `semFugaPorMinoria`, `fugaNaMaisPerto`. |

### 1.2 As 37 cenas

| Grupo | Ids |
|---|---|
| Rua e praça desenhadas | `praca`, `rua`, `rua-media`, `rua-nobre` (e as variantes `-3d`) |
| Alvos | `bar`, `comercio`, `ct`, `casa-piscina`, `subsede` |
| Sedes por nível | `sede-1` a `sede-5` (a reunião da diretoria acontece nelas) |
| Tretas marcadas (cenas herdadas) | `treta-beco`, `treta-galpao`, `treta-campo` |
| Emboscadas da caravana | `emb-posto`, `emb-onibus` |
| Arquibancada por capacidade | `estadio-10`, `estadio-20`, `estadio-40` |
| Bairro, classe popular | `bairro-f2`, `bairro-f3`, `bairro-f4` |
| Bairro, classe média | `bairro-m1`, `bairro-m1-rua`, `bairro-m2`, `bairro-m3` |
| Bairro, classe nobre | `bairro-n1`, `bairro-n2`, `bairro-n3`, `bairro-n3-bar` |
| Reunião da zona | `praca-reuniao` |
| Arredores do estádio | `cenaArredores` (foto aérea, com grades e filas) |

A cena da briga de bairro sai da classe do bairro e da situação:

| Classe | Praça | Jogo (bar/quadra) | De bobeira |
|---|---|---|---|
| Popular | `bairro-f4` | `bairro-f2` | `bairro-f3` |
| Média | `bairro-m1`, `bairro-m2` | `bairro-m3` | `bairro-m1-rua` |
| Nobre | `bairro-n1`, `bairro-n3` | `bairro-n3-bar` | `bairro-n2` |

### 1.3 Como se abre uma cena

`main.js` tem um abridor por situação (`abrirBrigaNoEstadio`, `abrirBrigaBairro`, `abrirGuerra`, `abrirDefesa`, `abrirEscolta`, `abrirAcaoEmCena`, `abrirBrigaDoTutorial`). Todos chamam `abrirPalco({canvas, config, aoTerminar})`. A `config` leva:

- `escalacao`: os nossos membros que descem (cada disco é um membro de verdade: nome, força, defesa, cargo).
- `bondes`: `[{lado, n, nossa, nome, cor, cor2, cor3, sigla, perfil}]`.
- `intencao`: `'atacar'`, `'paz'`, `'defender'`.
- `bombas`, `efetivoRival`, `fichasRival` (as fichas do outro lado), `local` (o id da cena).
- `paz`, `assistir`, `setores`, `reuniao` para as cenas sem briga.

O jogador pode **jogar** a cena ou **simular** (botão "Simular" em toda ação de confronto).

## 2. O combate

### 2.1 Os discos

Cada pessoa é um `Disco`: posição, raio (~7 a 8 px), velocidade, **rumo** (para onde olha), lado, vida e a ficha.

- **Vida**: `hpMax = 90 + defesa × 7`. Ou seja, a defesa vira resistência.
- **Frente e costas**: o disco só acerta quem está num cone de 140° em volta do rumo. Parado, gira a 6,5 rad/s; andando, a 11 rad/s. Apanhar por trás vira o disco para quem bateu (se ninguém o ocupava de frente há 0,4 s).
- **Linha**: `'frente'` ou `'retaguarda'`. A maioria não procura contato de cara: os de mais força e defesa vão para a frente; o resto fica atrás e alguns arremessam pedra e bomba.
- **Cargo e o que cada um sabe**: novato só soca; componente também chuta; linha de frente e diretoria chutam e agarram. O líder faz tudo. Sem ficha, a força diz o cargo (≥10 frente, ≥5 componente).
- **Estados**: `vivo`, `caido` (ferido, some depois de 3 s + 1,5 s esvanecendo), `preso`, `fugindo`, `sumiu` (saiu pela boca), `entrou` (entrou no estádio), `derrubado` (no chão por 1 s), `noChao` (apanhou deitado: espera socorro ou 2 s sem apanhar), `atordoado`, `segurando`/`seguradoPor`.

### 2.2 Parâmetros gerais (`TO.diaJogo.P`)

| Parâmetro | Valor | Significado |
|---|---|---|
| `velocidade` | 60 px/s | Passo de quem anda. |
| `dano` | 1,0 | Multiplicador geral. |
| `debandada` | 30 | % de baixas que faz um lado correr. |
| `vidaGrade` | 420 | Vida de um módulo de grade. |
| `forcaPM` | 18 | Dano do cassetete. |
| `atrasoCarga` / `tropaCarga` / `duracaoCarga` | 7 s / 8 PMs / 18 s | A tropa de choque depois da grade rompida. |
| `cdPedra` / `cdBomba` | 2 s / 2,5 s | Recarga dos arremessos. |
| `alcancePedra` / `alcanceBomba` | 170 / 210 px | Alcance. |
| `bombas` / `bombasRival` | 4 / 2 | Padrão de cena solta. |
| `minutosAteJogo` | 150 | Nos arredores: o relógio da cena até a bola rolar. |

### 2.3 O golpe

O soco é um **evento**, não contato contínuo.

| Golpe | Duração | Impacto aos | Recarga | Efeito |
|---|---|---|---|---|
| Soco | 0,36 s | 0,15 s | 0,18 s (+ até 0,2 s) | Dano base. |
| Chute | 0,58 s | 0,28 s | 0,42 s | Dano × 1,3 e **derruba** de 50% a 75% das vezes (`0,75 − defesa/80`). |
| Joelhada (segurando alguém) | 0,42 s | 0,20 s | — | Dano × 1,5, sempre entra. |
| Agarrão | 0,50 s | 0,22 s | 1 s após tentar, 1,5 s após soltar | Ver 2.5. |

A fórmula do dano (`acertar`):

```
bruto = força × (0,8 a 1,2) − defesa_do_alvo × 0,5
dano  = max(1, bruto) × P.dano × 0,55 × 0,9
        × 1,6 se o alvo foge
        × 1,3 chute · × 1,5 joelhada
        × 1,8 se o alvo está agarrado · × 1,3 se o alvo está segurando alguém
        × 1,3 se o alvo está cercado (e não num gargalo)
        × 1,1 se quem bate atendeu a um "chamar"
        × 1,15 se quem bate está com raiva
        × 0,8 se o alvo é nosso e a postura é Proteger
        × 0,85 se o alvo está num gargalo
```

- **Não existe defesa.** Ninguém bloqueia, esquiva ou dá contragolpe (removido em 16/10/2026). Golpe que chega, entra. A ficha de defesa continua valendo como redução de dano e como vida.
- **O golpe do jogador sempre entra.** O Q mira sozinho o rival de pé mais perto até **1,8 vez o alcance** (alcance = raio + raio + 9 px), de qualquer lado; o boneco vira no ato. Se o Q é apertado com o braço ainda indo, o próximo golpe fica na fila e sai emendado.
- **Passo de entrada**: até o impacto, quem bate anda em direção ao alvo (8 px a IA, 16 o jogador). O jogador anda a 35% durante o golpe.
- **Empurrão**: quem apanha é empurrado para trás (soco 4 px, chute 9; 1,5× se caiu).
- **Série**: golpes emendados em menos de 0,7 s contam uma série; o desenho segue direto, gancho, direto, uppercut, jab, trocando de mão.
- **No chão**: quem está derrubado leva 2,6× e, se apanhar lá, fica esperando socorro. O boneco do jogador sempre levanta em 1 s.
- **Cercado**: inimigos ao alcance com 110° ou mais entre dois deles.
- **Cansado**: abaixo de 30% de vida, o golpe demora 0,14 s a mais para voltar.
- **Respiro**: a cada 3 a 6 golpes a IA para de 0,45 a 1,0 s.

### 2.4 Os comandos do jogador

| Tecla | Botão no toque | Faz |
|---|---|---|
| WASD / setas | bola de controle (vetor livre) | Anda com o presidente. |
| Q | BATER | Golpe com mira automática. |
| F | AGARRAR | Agarra o rival mais perto. |
| C | CHAMAR | Puxa o bonde para cima (recarga 20 s). |
| 2 | PEDRA | Arremessa pedra no rival mais perto. |
| 3 | BOMBA | Abre a mira; clique ou soltar o dedo joga. |
| V ou B | POSTURA | Alterna Massacrar → Tomar a faixa → Proteger. |
| R | RECUAR | O bonde recua para trás do líder. |
| X | FUGIR | Manda correr. |
| Enter | SAIR | Entra no estádio ou sai da cena (leva o líder até a boca). |
| Rodinha | pinça | Zoom de 1× a 5×; com zoom a câmera segue o líder. |
| F2 | — | Editor de cena. |

**Chamar**: cada um atende com 25% + 60% × moral/20. Quem atende ganha 5 s de ímpeto (+10% de dano). Se os que atenderam mais o líder superam os rivais à vista (300 px), o outro lado recua 2,5 s. A IA também chama.

### 2.5 O agarrão

- Entra com `0,75 + (força − defesa)/40`, entre 55% e 95%.
- Segura de 2,4 a 3,4 s (× 0,8 se quem segura é mais fraco) e puxa o agarrado colado.
- O agarrado não bate e leva 1,8× de quem chegar; quem segura só dá joelhada e leva 1,3×.
- Quem segura só larga com uma pancada de 14 ou mais de dano, ou se alguém cair.
- A IA agarra quando tem companheiro do lado (chance 0,2 por instante).

### 2.6 A postura do bonde

O jogador escolhe o que o bonde faz sozinho (vale só dentro da briga):

| Postura | O bonde |
|---|---|
| **Massacrar** (padrão) | Foca em bater. |
| **Tomar a faixa** | Até 5 membros (no máximo um terço do bonde, os mais inteiros) contornam a briga pelo mesmo anel e vão em cima de quem segura a faixa ou a bandeira deles. Têm bônus de velocidade e um desvio se ficarem presos 2,5 s. |
| **Proteger** | O bonde ancora num ponto de guarda em volta do nosso material, não sai caçando, segura a mão em um quarto das oportunidades e leva 20% menos dano. |

### 2.7 Faixa e bandeira

Cenas com material têm uma faixa (e, no estádio, uma por lado, mais a bandeira). Os estados:

1. **Exposta**: estendida no lugar. Com inimigo a 180 px (ou 1,5 s de briga), a torcida dona corre para recolher.
2. **Recolhendo**: dois membros vão até ela e ficam 3 s tirando.
3. **Na mão**: um portador sai com ela; ele foge de inimigo (tenta ficar a 200 px) e só bate em quem colar. Há escolta.
4. **Tomada**: se o portador cai ferido ou preso, o outro lado toma. Quem sai pelo túnel com ela, salva.

Quem debanda recolhe a faixa antes de correr. Faixa tomada pesa muito em moral e prestígio (regras na Parte II). Briga de bairro não tem faixa.

### 2.8 Pedra e bomba

- **Pedra**: acerta um rival a até 32 px do ponto: 22 de dano. Também fere grade (30).
- **Bomba**: cai, o pavio queima de 1 a 1,5 s com a zona de perigo desenhada, e explode num raio de 92 px: dano `58 − distância × 0,4`, atordoa 1,1 s e joga para longe. Fere grade (até 110) e sobe o alerta em 16.
- Ninguém vê a bomba na hora: a IA leva de 0,2 a 0,6 s para reagir (0,3 s a mais no meio da troca de socos) e então corre para fora do raio, para longe do rival.
- A retaguarda arremessa sozinha, com cadência própria. Bomba usada sai do estoque das duas torcidas.

### 2.9 Moral em cena, gargalo e tombo

- Quando alguém cai, quem está a 130 px e é do mesmo lado reage: **novato hesita** (60% de chance; por 1,2 a 2,6 s não bate e recua) e **linha de frente e diretoria ficam com raiva** (70%; por 2 a 3,5 s batem 15% mais forte).
- **Gargalo**: disco com parede dos dois lados do corpo leva 15% menos e não conta como cercado.
- **Tombo**: quem cai esbarra em quem está logo atrás, no rumo do golpe.

### 2.10 Como a briga acaba

- **Debandada por baixas**: um lado com 30% de baixas corre (na arquibancada, 50%).
- **Debandada por minoria**: o rival corre se ficou com 40% ou menos de gente de pé que o outro lado (não vale na arquibancada nem para o jogador).
- **Sem rival de pé**: a cena entra em "comemorando" por 5 s (quem sobrou provoca) e fecha.
- **Sair/entrar**: levar o líder até a boca encerra.
- Quem corre vai para a boca de rua mais perto que não passa por dentro do inimigo. Rival que correu sem brigar e é alcançado fica (dois golpes em cima).
- Mínimo para debandada valer: 6 de cada lado.

### 2.11 O resultado da cena

`ponte.encerrar` monta `res`, que o resto do jogo consome:

- `ganhamos`, `correram`, `nossoLado`, `efetivo` de abertura, `armas` usadas, `bombasUsadas`.
- `membros`: para cada um dos nossos, se caiu, foi preso ou entrou.
- `faixa`/`faixas`: tomada ou não, e por quem.
- `moralTorcida`: +1 se ganhamos; −1 se perdemos; −2 se debandamos.
- **Prestígio da noite** (escala de 0 a 100):

```
prestígio = limitar( arredondar( (feridos_deles × 2 − feridos_nossos × 1,5
                                  − presos_nossos × 2 + 6 se a grade rompeu) / 3 ), −10, +10 )
```

  Se eles correram sem brigar, vale `prestigioDaFuga` (de 1 a 6, pela razão dos efetivos).

Depois, `main.js: fecharDiaDeJogo` ajusta:

- Vitória vale no mínimo +1, derrota no máximo −1 (exceto pressão no CT).
- Vitória em menor número vale mais: o prestígio positivo é multiplicado por `deles/nossos`, preso entre 0,5× e 2×, com teto 10.
- Briga de bairro e de arquibancada zeram prestígio e moral genéricos: têm tabela própria (domínio e a régua do estádio).
- Na escolta, o prestígio vai para o aliado (vira relação).
- Apanhar em menor número pesa menos: o peso da derrota é `nossos/deles`, entre 0,25 e 1.
- Os membros caídos viram **feridos** e os presos viram **presos** de verdade no save (Parte II).

### 2.12 Simular

`js/diajogo/simular.js` devolve o mesmo `res` sem abrir a cena:

- Força de cada lado = soma de força e defesa de quem desce.
- O mais forte vence 70% das vezes.
- Baixas: quem perde deixa de 25% a 40% no chão e de 5% a 12% presos; quem ganha, de 8% a 16% e de 1% a 4%. Cai primeiro o mais fraco.
- O prestígio sai da mesma fórmula da cena.

## 3. A polícia

### 3.1 O alerta

`J.alerta` vai de 0 a 100 e cai 1,2 por segundo. Sobe com:

| Fato | Alerta |
|---|---|
| Começar a cena | 12 (+8 se a intenção é atacar) |
| Encostar na PM (brigando com ela) | +7 por segundo |
| Módulo de grade derrubado | +13 |
| PM derrubado | +18 |
| Bomba | +16 |
| Briga à vista da PM (6 ou mais brigando a até 300 px da linha) | +2,6 por segundo, até 88 |
| PM acuada | +5 por segundo |

Em 100, sem grade rompida e com posto na cena, chega **reforço** de 3 PMs (até 3 vezes) e o alerta volta a 56.

### 3.2 Os degraus

A PM sobe um degrau por vez e desce com folga:

| Degrau | Sobe em | Desce abaixo de | O que faz |
|---|---|---|---|
| 0 Parada | — | — | Ronda em volta do posto; bate em quem briga a até 80 px e não se afasta mais de 80 px do posto. |
| 1 Manda dispersar | 45 | 30 | Aviso e apito; braço erguido. Passa a algemar quem ficou no chão. |
| 2 Avança em linha | 70 | 55 | O posto de cada PM anda até 170 px no rumo da confusão, 14 px/s, todos na mesma direção. |
| 3 Bomba de efeito moral | 85 | 72 | Uma lata a cada 7 s no maior bolo a até 420 px. |
| 4 Carga | Grade rompida ou viatura | — | Todos correm (96 px/s) num alvo comum, cada um no seu lugar da linha. |

- **Cassetete**: 18 de dano, atordoa 0,6 s, recarga 2 s. Quem leva da PM de ronda fica **3 s sem procurar conflito e se afasta dela**. A tropa de choque bate 1,4× com recarga 1,25 s e não dispersa.
- **Preso**: quem chega a zero de vida apanhando da PM.
- **Bomba de efeito moral**: estoura em 0,9 s; raio 78 px; atordoa 1 s quem está dentro; por 6 s ninguém bate lá dentro, a IA sai da nuvem e o jogador anda a 60%. Não tira vida.
- **Algema**: PM sem ninguém para enfrentar vai até quem está no chão a até 110 px (caído ferido ou derrubado apanhando) e, ficando 1,2 s em cima dele, prende. O caído vira preso sem contar duas vezes.
- **PM acuada**: com 5 brigões para cada PM (e 10 ou mais) a até 170 px, ela fecha em bloco e pede reforço.
- **Grade rompida**: todos em carga; em cena com tropa de choque, 8 PMs (vida 380) entram em 7 s pelo buraco ou por `tropaEm`, e a carga dura 18 s. Depois "a tropa recompõe a linha".
- **Viatura**: chamada no primeiro caído (ou no degrau 1). Chega em 26 a 36 s, com sirene 10 s antes. Descem 3 PMs em carga de ronda por 16 s. Entra pela boca marcada, por um posto da PM ou pela boca de rua mais longe da confusão. Dentro do setor do estádio não entra carro: é reforço a pé.
- **Recuo do rival**: com alerta acima de 78 e mais de 22% do bonde deles sob ameaça da PM, o visitante recua 9 s (não na arquibancada).
- A PM não manda no bonde do jogador: só avisa a pressão.

## 4. O assalto

Motor próprio (`js/diajogo/assalto_motor.js`), palco em `js/ui/assalto2d.js`, dados em `dados/assaltos.js`. É um jogo de **percepção**, inspirado em assalto de GTA V: planejamento → execução → exposição → suspeita → alerta → resultado.

- O tabuleiro vem da máscara da foto da loja (8 px por célula). Três camadas: onde o corpo cabe, onde o olhar passa (vidro e móvel baixo deixam ver), e a zona (rua, salão público, área restrita).
- Pontos do mapa: carro da fuga, porta, caixas, cofre, vitrines, prateleiras, gravador das câmeras, botão do alarme, postos de quem trabalha (caixa, atendente, gerente, segurança), fregueses, câmeras, olheiros, por onde a PM chega.
- O jogador vê a **Exposição**, a **Suspeita** e a **Situação** (Normal → Suspeita → Alerta), e o cone do olhar de cada funcionário e câmera, cortado pelas paredes. Sobre quem desconfia aparece "?" e depois "!".
- Pode ser furtivo ou rápido; alguém pode ligar para a polícia; a polícia chega, prende, e a equipe leva o que conseguiu.
- Controles: WASD, Shift (correr), E, Q, Z, X, V, Esc; no toque, joystick e botões.
- Há seis fotos de alvo, cada uma num nível de dificuldade. A pena de prisão em assalto pode chegar a 360 dias (banco). O "calor" da polícia com a torcida sobe a cada assalto barulhento e esfria dia a dia.

O planejamento do assalto (alvo, equipe, jeito) é uma tela do `main.js`; a escolha dos alvos chega pela diretoria.

## 5. Os bonecos

`js/diajogo/bonecos3.js` desenha gente de corpo inteiro sobre a cena.

- **Modelo**: humano feito no Blender (`ferramentas/boneco_base.py` → `img/boneco.glb` e `img/boneco_leve.glb`; embutido em `dados/boneco_leve_glb.js`). Clonado com esqueleto por figura. Enquanto o GLB não chega, vale um corpo de cápsulas com a mesma hierarquia de juntas.
- **Aparência por semente**: cabelo, boné, bandana, barba, óculos, cordão, relógio, camisa da torcida com listras, bermuda ou calça, tênis, nove tons de pele. O mesmo membro é sempre o mesmo boneco.
- **Animação por pose-alvo**: cada estado escreve uma pose (ângulos por junta) e a pose atual persegue a alvo com velocidade por estado. Repertório: parado, andar, correr, jab, direto, gancho, uppercut, empurrão, chute frontal, chute baixo, joelhada, agarrar, guarda (quatro tipos), provocar, apanhar, cambalear, arremessar, fugir, cobrir da bomba, cair (de frente, de costas, de lado), ser derrubado e levantar, segurar, ser segurado, chamar, socorrer, sentar preso, sentar na cadeira, falar, torcer. Cada um com três variações por figura.
- **Reação ao golpe pelo tipo**: golpe no corpo dobra o tronco para frente; uppercut joga a cabeça para trás; gancho vira cabeça e ombro; jab e direto estalam a cabeça.
- **Queda pelo lado do golpe**: de frente para o golpe cai de costas; de costas, cai de frente; de lado, de lado.
- **Camada de realismo** por cima de qualquer movimento: o corpo se inclina ao arrancar e frear, deita na curva, a cabeça atrasa na virada; abaixo de 45% de vida a guarda cai e a respiração pesa; poses de hesitar, raiva, tossir no gás e cobrir a cabeça.
- **Desempenho**: malha afinada na chegada, as peças viram uma chamada de desenho por boneco, quem está fora da tela não é animado, a resolução desce quando o quadro aperta. No "movimento leve", a multidão só recalcula a pose a cada três quadros; um sexto dela "acorda" por 1,3 s em rodízio para não parecer estátua.
- **PM**: farda, escudo, cassetete; braço erguido no degrau 1; agacha para algemar.
- **Efeitos**: pedra, bomba (clarão, anel, estilhaços, fumaça), grades de ferro, fumaça do gás e a viatura com giroflex.
- **Fotos**: o mesmo módulo tira a "foto do troféu" (quatro dos nossos segurando a faixa tomada, na cena da briga), a "foto da briga" (para o cartaz do jornal) e a "foto da cena".

`js/diajogo/festas_cena.js` desenha as festas da arquibancada por cima dos bonecos: mosaico (cada um levanta um papel e o setor forma o escudo), bandeirão, trapos, papel picado e o mosaico 3D em pé no fundo do setor.

## 6. Som e câmera

- `js/som.js`: tudo sintetizado (ruído filtrado e osciladores). Sons: soco, chute, queda, pedra, bomba, gás, apito, sirene. O combate só anota o nome em `J.sons`; a ponte toca uma vez por quadro. O áudio acorda no primeiro toque ou tecla. `TO.som.ligado` liga e desliga (guardado em `to.som`); **ainda não há botão na tela**.
- `J.tremorCam` (0 a 1): chute envolvendo o líder, queda do líder, bomba e gás sacodem o palco por um instante (transformação CSS nos canvas).

---

# PARTE V — IDIOMAS, FERRAMENTAS, ARTE, O JOGO 3D E A RECONSTRUÇÃO

## 1. Idiomas

- Três línguas: português (original), español, english.
- **O texto em português é a chave.** Todo texto visível passa por `_t('…', {params})` ou `_tn(n, singular, plural)`. Em português devolve o próprio texto; nas outras procura no dicionário e, se não achar, cai no português.
- Dicionários em `dados/i18n/*.js`, um por fatia do código, com `es` e `en` lado a lado, registrados por `TO.i18n.registrar({...})`.
- O HTML estático é traduzido no boot por `traduzirDom` (troca nós de texto e `title`/`placeholder` cujo texto inteiro está no dicionário).
- O idioma é do navegador (`to.idioma`), não do save. Mensagens antigas do feed ficam na língua em que nasceram.
- `python3 ferramentas/i18n_faltando.py` lista as chaves sem tradução (deve dar 0) e as órfãs (hoje cerca de 1.480, nunca limpas).
- Glossário e regras em `docs/I18N.md`.

## 2. Ferramentas (`ferramentas/`)

| Script | Para que serve |
|---|---|
| `importar_cena_foto.py` | Transforma uma foto aérea em cena: gera a máscara de caminhada por cor/polígonos, spawns e fugas. Receitas por cena. |
| `empacotar_cena.py`, `prova_mascara.py`, `prova_portoes.py` | Apoio e conferência das cenas. |
| `boneco_base.py` | Gera o boneco no Blender. |
| `importar_planilha.py`, `importar_relacoes.py`, `importar_barras.py`, `importar_expansao.py`, `importar_estadios.py`, `importar_bairros.py`, `importar_mapa_cidade.py` | Importam os dados do mundo a partir das planilhas e fontes em `dados/fonte` e `ferramentas/fonte`. |
| `importar_logos_competicoes.py`, `emblemas_competicoes.py` | Logos das competições. |
| `assar_plantas.js`, `plantas_sem_enclaves.py`, `gerar_malha.py` | A planta 2D de cada cidade (`img/mapas/<id>.webp`) e a malha de estradas. |
| `gerar_desenvolvimento.py` | Gera `desenvolvimento.html` (o protótipo). Roda a cada mudança. |
| `i18n_faltando.py` | Confere traduções. |
| `empacotar_jogo.py` | Gera o jogo num arquivo HTML só (não é mais o caminho principal). |
| `simular_mundo.js` | Simulação do mundo fora do navegador. |
| `colar_remendo.py` | Utilitário de edição. |

## 3. Arte e arquivos

- `img/` tem cerca de 239 MB: fotos das cenas (`img/cenas/*.webp` e `.jpg`), escudos (`img/escudos/clube-<id>.png`, `torcida-<id>.png`), faixas, bandeiras, fotos de cidade, logos de competição, plantas (`img/mapas/`), o boneco (`.glb`). Arquivos `_ref_*` são referência do editor e não são carregados.
- `img/cenas/PROMPT-BAIRRO.md` guarda os prompts usados para gerar as fotos aéreas das cenas de bairro (visão zenital, sem vegetação alta que tape o chão).
- Fontes próprias em `css/fontes/` (licença OFL). O visual é escuro, com tipografia condensada em caixa alta, vermelho-rubro e ouro como cores de destaque; os jornais usam papel envelhecido (`css/gazeta.css`).
- Na raiz há dois arquivos de outro projeto (`BrasileiraoManager.cs`, `BrasileiraoUI.cs`), que o jogo não usa.

## 4. O jogo 3D (`cenario3d/`)

Uma segunda versão, com a cidade inteira em 3D (Three r160 como módulo, carregado de CDN). Cerca de 168 mil linhas, 43 MB.

### 4.1 Como é montado

- `cenario3d/index.html` e `planta.html`: a **planta** da cidade em 2D, que monta cada coisa em 3D. `jogo.html` é a mesma página com `window.__JOGO = true`.
- `js/cenario.js`: monta a praça inteira de uma vez. O chão é o desenho da planta em ladrilhos; casas, sedes, estádios, postes, árvores e carros saem de uma lista de peças e vão para um "forno" que junta malhas por material e bloco de terreno. Tem boneco a pé com colisão.
- `js/proposta.js`: a grade da cidade (quadras de 35,6 × 17,8 m, ruas de 6,1 m), favelas, condomínios, estádios.
- `js/jogo3d.js`: carrega **o mesmo jogo de feed** por cima da cidade. A casca HTML vem de `js/jogo_casca.js`; os scripts do jogo vêm num arquivo só, `js/jogo.js` (68 mil linhas), gerado por um `montar.sh` **que não está neste repositório**.
- No 3D o feed não aparece na tela: cada decisão chega num **balão** na boca de quem a traz (`recados3d.js`); o resto vira aviso ou manchete de jornal no canto.

### 4.2 O que o 3D tem a mais

| Módulo | O que faz |
|---|---|
| `vida3d.js` | A vida da praça: relógio do dia (7h às 23h), a sede com gente nos lugares, o presidente na sala, membros indo aos bares, gente comum nas calçadas. |
| `sede3d.js` | A sede mobiliada por nível, com cômodos. |
| `rua3d.js` | **A rua livre**: em dia sem nada marcado o presidente sai a pé com quatro do bonde, pode bater em rivais, pixar, recrutar e assaltar; às 23h volta. |
| `dia_de_jogo.js`, `dia3d.js` | O dia de jogo na cidade: caminhada das torcidas até o estádio por rotas que evitam se cruzar, cordões da PM, revista, emboscada em esquina. |
| `arquibancada.js`, `invasao.js` | Arquibancada viva (faixa estendida por dois, bandeiras de bambu 4×4 m, bateria, puxador) e a invasão do setor rival quebrando a grade. |
| `caravana3d.js`, `estrada3d.js` | As emboscadas da viagem (posto e estrada) em 3D. |
| `assalto.js`, `assalto3d.js`, `lojas3d.js` | O assalto na loja de verdade da cidade. |
| `briga_lugar.js`, `briga_bar.js`, `palco_briga.js` | Levam cada briga para o lugar certo da cidade (praça, sede, portão, rua, bar); o tabuleiro do combate vira um retângulo do mundo. |
| `mapa3d.js`, `dominio.js` | O mapa e o domínio no 3D. **O domínio do 3D é a versão antiga, de barra de 0 a 100**, diferente da barra de 7 pontos do 2D. |
| `estadios3d.js`, `casas3d.js`, `modelos_atlas.js`, `detalhe3d.js` | Modelos. |

### 4.3 Estado atual do 3D

- O combate e a ponte dentro de `jogo.js` foram atualizados em 12/11/2026 por mesclagem com o 2D: sem defesa, golpe do jogador que sempre entra, posturas, polícia em degraus, viatura, som.
- O resto do pacote (`main.js`, `feed.js`, gestão) é de 07/10/2026 e **não tem** o que o 2D ganhou depois: elenco fixo, barra de 7 pontos, brigas de bairro, remoção da liga de tretas, rede social no celular.
- No 3D a tecla V troca a câmera; a postura fica no B.
- A briga do 3D carrega `bonecos3_cena.js`, cópia idêntica de `bonecos3.js`.

## 5. Problemas conhecidos e dívidas

- **Auditoria incompleta.** Uma leitura completa em busca de bugs foi iniciada e interrompida. O que as verificações mecânicas mostraram, e não foi corrigido:
  - Cinco chaves duplicadas em objetos: `bonecos3.js` (`corBone`, `barba`), `competicoes.js` (`simular`), `feed.js` (`subsede`), `relacoes.js` (`brigaIA`).
  - Um bloco morto `if(false && …)` em `feed.js`.
  - Cerca de 50 variáveis ou funções nunca usadas (por exemplo `painelHierarquia`, `cartazDaCena`, `pisoDoCargo`, `penaltis`).
  - Um 404 no carregamento (provavelmente o `favicon.ico`).
- **Bugs achados ao escrever este livro, ainda não corrigidos:**
  - A venda forçada da loja por dívida credita R$ 90 mil duas vezes (`financeiro.js: venderLojaSeEndividado` soma no caixa e depois chama `lancar`, que soma de novo): o caixa sobe R$ 180 mil.
  - A caixa de 5 bombas ignora o desconto do galpão.
  - O botão de fugir da defesa anuncia "Moral −3 · Relação −6", mas o código aplica moral −15 na tela e relação −13.
  - Textos e comentários desatualizados: a tela de seleção e um comentário de `estado.js` ainda dizem que o modo rápido não tem domínio.
- **Código desligado que continua no projeto**: pixação e ação social (`dominio.js` devolve `ok:false`), sugestões do olheiro, o cartão de guerra do nosso jogo, a treta do trimestre, `feed.emboscadaDaViagem`.
- **Save grande**: cerca de 3,4 MB antes da compressão depois de um ano; 1,5 MB é o estado das torcidas do computador.
- **Sem risco real de perder**: a torcida só perde membros por aposentadoria. Derrota e dívida não tiram ninguém.
- **Sem objetivo de médio prazo**: não há metas nem condição de vitória.
- **Equilíbrio da polícia nova não foi jogado à mão**: nos testes automáticos com o jogador parado, o nosso lado venceu 5 de 6 brigas de bairro (antes 6 de 6).
- **Os movimentos novos dos bonecos e o som não foram avaliados por uma pessoa.**
- **Duas versões divergentes** (2D e 3D), com um pacote gerado por script ausente.
- **Dicionário com ~1.480 chaves órfãs.**
- **Sem testes automatizados no repositório.** Os testes desta fase foram scripts de Playwright descartáveis.
- **Sem contador de acessos.**

## 6. Conselhos para reconstruir do zero

1. **Separe regra de tela desde o primeiro dia.** Hoje as regras estão bem isoladas em `js/mundo` e `js/gestao`, mas `main.js` (12,5 mil linhas) mistura telas, relógio, abertura de cenas e fechamento de resultado. Na reconstrução: um núcleo de simulação puro (sem DOM), testável fora do navegador, e a interface só lendo e mandando comandos.
2. **Um formato de estado com versão e migração explícita.** O save atual acumula campos e migrações espalhadas.
3. **Uma fonte só para as duas versões.** Se houver 2D e 3D, as duas devem importar o mesmo núcleo, não uma cópia empacotada.
4. **Dados em JSON com esquema**, não scripts que populam um global.
5. **Mantenha o que funciona como ideia de design**: o feed como espinha do jogo; decisões com o efeito escrito no botão; membros com nome e ficha; o texto em português como chave de tradução; cenas como tabuleiro de 1536 × 1024 com máscara de caminhada; o combate por evento de golpe; o relógio que para por motivo com nome; determinismo por semente.
6. **Decida cedo o que fica de fora.** Foram descartados pelo dono: indicador de tensão permanente, trair aliado, escalação manual, sistema de polícia fora das cenas (delegado, banimento), satisfação do torcedor comum, a liga de tretas e a treta apostada.
7. **Ordem sugerida**: (a) estado, relógio e save; (b) mundo e dados; (c) membros e finanças; (d) feed com decisões; (e) futebol e calendário; (f) relações e torcidas do computador; (g) planejamento e dia de jogo simulado; (h) cena de briga jogada; (i) domínio de bairros; (j) rede social, jornais e retrospectiva; (k) assalto, festas, polícia em degraus, som.
8. **Escreva testes de simulação**: um ano de jogo sem erro, saldo de caixa dentro de faixa, taxa de vitória em briga parelha perto de 50%. Foi isso que pegou os desequilíbrios nesta fase.

## 7. Glossário

| Termo | Significado |
|---|---|
| **Praça** | A cidade (ou região) onde a torcida vive. Há 94: 30 no Brasil e 64 nos outros nove países. |
| **Bonde** | O grupo que desce para a rua numa cena. |
| **Sede** | A casa da torcida; tem níveis. |
| **Subsede / filial** | Núcleo em outro bairro ou em outra cidade. |
| **Irmã** | Torcida do mesmo clube. |
| **Aliada / rival** | Níveis de relação entre torcidas. |
| **Faixa** | O material mais valioso; perder a faixa é a maior desonra. |
| **Caravana** | A viagem para o jogo fora de casa. |
| **Escolta** | Entrar na briga de um aliado, do lado dele. |
| **Dona do bairro** | Quem tem 4 ou mais dos 7 pontos da barra do bairro. |
| **Rei da pista** | Prêmio de fim de ano para quem mais venceu na rua. |
| **Velha guarda** | Os membros que se aposentaram aos 46 anos. |
| **Gazeta dos Sports** | O jornal de futebol do jogo. |
| **Futebol e Porrada** | O jornal das brigas. |
| **Disco** | Uma pessoa na simulação da cena. |
| **`E`** | O objeto do save. |
| **`J`** | O estado de uma cena em andamento. |
| **`D`** | Os dados da cena aberta. |
| **O dono** | O autor do jogo; os comentários citam os pedidos dele. |
