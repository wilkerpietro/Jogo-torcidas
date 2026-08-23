# EXPANSÃO — AMÉRICA DO SUL

Planejamento aberto em 23/08/2026 a pedido do dono. A planilha viva é
`dados/fonte/Expansao_America_do_Sul.xlsx`, no MESMO formato da aba
`Times` de `Book_3_1.xlsx` — é isso que `ferramentas/importar_planilha.py`
lê pra gerar `dados/times.js`.

## O que já está na planilha

158 clubes, as nove primeiras divisões, ficha completa nas 18 colunas:

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

Cada linha traz uma coluna **Confiança** que não vai pro jogo e serve só
pra revisão: `alta` (68 clubes), `média` (49) e `conferir` (41). O que
está em `conferir` é elenco pequeno de divisão nacional, onde capacidade
de estádio e ano de fundação pedem uma fonte antes de virar dado.

## O que falta, e por que ficou pra depois

126 clubes das divisões de baixo, com o elenco listado na aba
**A confirmar** (nome + cidade) e a ficha por preencher:

| País | Divisão | Clubes |
|---|---|---|
| Argentina | Primera Nacional (2ª) | 38 |
| Argentina | Primera B Metropolitana (3ª) | 20 |
| Argentina | Torneo Federal A (3ª) | 36 |
| Chile | Primera B (2ª) | 16 |
| Colômbia | Categoría Primera B (2ª) | 16 |

Motivo declarado: a composição dessas divisões muda todo ano e a ficha
dos clubes menores (capacidade, fundação, mascote) não sai de memória
sem risco de virar invenção. O elenco vai listado pra ser conferido
ANTES de alguém encher 18 colunas × 126 linhas.

## As cinco decisões que atravessam todas as linhas

1. **Coluna "Estado"** → sigla do país (AR, BO, CL…). A tela mostra
   "cidade/UF", então "Rosario/AR" se lê de primeira. Alternativa:
   província ou departamento.
2. **Coluna "Mapa"** → 33 praças novas, uma por polo mais um
   "Interior de X" por país. O Brasil faz 108 clubes com 30 praças, e
   **cada praça precisa de malha de bairros** — é aqui que mora o custo
   real da expansão, não na tabela de clubes.
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
