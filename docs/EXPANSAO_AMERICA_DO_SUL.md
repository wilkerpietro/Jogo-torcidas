# EXPANSÃO — AMÉRICA DO SUL

Planejamento aberto em 23/08/2026 a pedido do dono. A planilha viva é
`dados/fonte/Expansao_America_do_Sul.xlsx`, no MESMO formato da aba
`Times` de `Book_3_1.xlsx` — é isso que `ferramentas/importar_planilha.py`
lê pra gerar `dados/times.js`.

## O que já está na planilha

248 clubes em 13 divisões, ficha completa nas 18 colunas:

| País | Divisão | Clubes |
|---|---|---|
| Argentina | Argentina Primera | 30 |
| Bolívia | Bolívia Primera | 16 |
| Chile | Chile Primera | 16 |
| Colômbia | Colômbia Primera A | 20 |
| Equador | Equador Serie A | 16 |
| Paraguai | Paraguai Primera | 12 |
| Peru | Peru Liga 1 | 18 |
| Uruguai | Uruguai Primera | 16 |
| Venezuela | Venezuela Primera | 14 |
| Argentina | Argentina Primera Nacional (2ª) | 38 |
| Argentina | Argentina Primera B (3ª) | 20 |
| Chile | Chile Primera B (2ª) | 16 |
| Colômbia | Colômbia Primera B (2ª) | 16 |

**Torneo Federal A ficou de fora por decisão do dono (23/08/2026).**

## O AMARELO

Célula que eu não consegui confirmar sai **amarela** na planilha — são
406 delas em 248 linhas. A régua está na aba `Legenda`:

| Confiança | O que fica amarelo |
|---|---|
| `alta` (68 clubes) | nada |
| `média` (69 células) | Capacidade do estádio |
| `conferir` (337 células) | Capacidade, Ano de Fundação, Mascote e — quando não achei o nome — o Estádio |

Por coluna: 164 capacidades, 106 anos de fundação, 106 mascotes e 19
nomes de estádio. Nome do clube, nome completo, cidade, cores e divisão
**não têm amarelo em lugar nenhum**: esses eu confirmo.

## A rodada de pesquisa nas capacidades (23/08/2026)

15 estádios conferidos um por um, na aba `Pesquisa`. Onze correções:

| Clube | Estava | Ficou |
|---|---|---|
| Los Andes | 34.000 | **38.000** |
| Colón | 40.000 | **33.716** |
| Atlanta | 14.000 | **18.000** |
| Temperley | 15.000 | **19.500** |
| Chacarita | 25.000 | **24.300** |
| Ferro | 24.442 | **24.268** |
| Nueva Chicago | 28.500 | **28.000** |
| San Martín Tucumán | 30.000 | **30.250** |
| Santiago Wanderers | 21.414 | **21.113** |
| Cobreloa | 12.346 | **12.102** |
| Cúcuta Deportivo | 42.000 | **42.901** |
| Atlético Huila | 26.000 | **27.000** |

Confirmados sem mudança: All Boys 21.500, Quilmes 30.200 e Deportivo
Español 32.500.

**Por que só 15**: Wikipedia e Transfermarkt estão bloqueados no proxy
de saída deste ambiente, então a conferência saiu por busca, um estádio
de cada vez. O que não passou por ela continua amarelo — e o amarelo é
justamente a lista de trabalho da próxima rodada.

## As cinco decisões que atravessam todas as linhas

1. **Coluna "Estado"** → sigla do país (AR, BO, CL…). A tela mostra
   "cidade/UF", então "Rosario/AR" se lê de primeira. Alternativa:
   província ou departamento.
2. **Coluna "Mapa"** → **64 praças novas, teto de 7 clubes cada**
   (régua do dono, 23/08/2026). A praça é um mapa de cidade com malha de
   bairros, e é onde a briga acontece: praça com vinte clubes seria um
   mapa impossível de povoar e uma cidade onde todo mundo é rival de
   todo mundo. O corte é por geografia de verdade — zona da capital
   (Buenos Aires Sul, Norte, Oeste), partido do conurbano (Avellaneda,
   Lanús e Lomas, Morón e Merlo), região do interior (Litoral Argentino,
   Norte Chico, Eixo Cafeteiro). Nenhuma praça passa de 7 e a maior é
   Buenos Aires Sul, com 7. **Cada praça precisa de malha de bairros** —
   é aqui que mora o custo real da expansão, não na tabela de clubes.
   Maracaibo é a única praça com um clube só (Rayo Zuliano): é a
   primeira a cortar se o orçamento de mapa apertar.
3. **Coluna "Competição Regional"** → a copa nacional do país. Lá fora
   não há estadual; a copa é o torneio paralelo que todo clube joga.
4. **Qualidade do elenco** → 6 a 36 na régua brasileira, onde o
   Flamengo é 50. Boca e River entram em 36.
5. **Cores** → só os 10 nomes que o importador conhece. Não há marrom,
   laranja nem roxo: o Platense e o Nacional Potosí entraram como
   grená. Ampliar `CORES` no importador resolve.

## Duas armadilhas que a conferência pegou

- **Nome de divisão colidia entre países.** "División Profesional" é o
  nome da 1ª da Bolívia E do Paraguai, e "Primera División" do Chile E
  do Uruguai. Como `divisao` é string e é ela que agrupa a liga, os dois
  países cairiam na mesma tabela de 28 clubes. Toda divisão passou a
  levar o país no nome.
- **Sete `id` colidiam.** O `id` sai do nome e é a chave que liga
  `times.js`, `torcidas.js` e o grafo de relações — colisão funde dois
  clubes em silêncio. River Plate e Racing (Argentina × Uruguai),
  Universidad Católica (Chile × Equador), Libertad (Paraguai × Equador),
  Nacional (Paraguai × Uruguai × Brasil), Guaraní e Portuguesa contra
  clube brasileiro. Resolvido pela convenção que o Brasil já usa no
  Botafogo/PB: sufixo no nome curto (`Nacional/URU`, `Guaraní/PAR`).

## O que ainda não foi decidido

- **Torcidas.** O jogo tem 139 torcidas pra 108 clubes brasileiros. Uma
  expansão com clube e sem torcida organizada não dá jogo — falta a
  planilha de torcidas dos nove países, com efetivo, cores e o grafo de
  aliança e rivalidade.
- **Malha de bairros das 33 praças novas.** `cidades.js` tem 348 bairros
  pra 30 praças brasileiras.
- **Calendário.** As ligas sul-americanas correm em ano civil e algumas
  em dois torneios por ano (Apertura/Clausura). O motor de temporada
  hoje só sabe pontos corridos e mata-mata brasileiro.
- **Como o jogador chega lá.** Escolher torcida de outro país no começo,
  ou só encontrar essas torcidas em Libertadores e Sul-Americana.
