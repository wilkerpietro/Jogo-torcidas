# O jogo em 3D — o jogo de feed por cima da cidade

Pedido do dono (27/09/2026): "Comece a importar os detalhes de movimento
dos bonecos e motor de briga pra dentro do jogo, assim como toda a rotina
do html Torcida Organizada. Traga toda a hud pro jogo, como o menu
lateral, as informações superiores, o menu inicial, e os dias passando.
Haverá algumas mudanças que irei apontar pontualmente. Confira todo o
código do jogo que possui formato de feed pra irmos adaptando pra essa
versão 3d."

Este arquivo é o mapa dessa adaptação: o que já veio, onde está, e o que
falta pra cada pedaço do jogo de feed virar 3D.

## 1. Como abrir

- **GitHub Pages:** `cenario3d/jogo.html` (a mesma pasta do cenário).
- **Aqui:** `sh ferramentas/planta_html/montar.sh <pasta>`, servir a pasta
  (`python3 -m http.server -d <pasta>`) e abrir `local.html?jogo`.
- `?cidade=Recife` escolhe a praça que monta atrás do menu (sem ela, a do
  último jogo, ou Fortaleza).

## 2. Como é feito

A página é a do cenário (a planta, `ferramentas/planta_html/index.html`)
com `?jogo` (ou `window.__JOGO`, que o `jogo.html` do Pages põe). Ela monta
a praça em 3D e chama `montarJogo` (`ferramentas/planta_html/jogo3d.js`),
que carrega o jogo de feed por cima:

| Pedaço | De onde vem |
|---|---|
| A casca (menu, seleção, `#jogo`, cena, relatório, retrospectiva) | o `<body>` do `index.html` da raiz, sem os scripts — o `montar.sh` gera `js/jogo_casca.js` |
| Os scripts do jogo | os 71 do `index.html` da raiz, na mesma ordem, num arquivo só (`js/jogo.js`, gerado) |
| O CSS | os 6 do jogo num arquivo só (`css/jogo.css`) + `jogo3d.css`, que muda onde cada pedaço fica |
| O boneco das cenas | o do cenário (`js/diajogo/bonecos3.js`, Three r160, os dois níveis afinados), pendurado em `TO.diaJogo.bonecos3` por `bonecos3_global.js` |
| Escudos, fotos das praças, bandeiras | embutidos em `dados/imagens_jogo.js` (o `IMG()` do jogo lê de lá) |
| As fotos das cenas de briga | as 25 `.webp` que os dados citam, em `img/cenas/` |

O jogo é **o mesmo** do Pages (o código veio do branch
`claude/game-html-news-feed-sndgh4`, commit 82bd43d): o mesmo `main.js`, o
mesmo relógio, os mesmos painéis e cenas. O 3D muda a tela, não as regras.

### O que o 3D já faz

- **A cidade é a tela.** O menu inicial e a escolha da torcida abrem por
  cima da praça em 3D. Começada (ou carregada) a partida, a praça vira a da
  torcida do jogador (`E.torcida.mapa` → a praça de `dados/cidades.js`) e a
  câmera voa até a porta da sede dela.
- **O HUD do jogo de feed, inteiro:** a barra de cima (escudo, ranking,
  caixa, saldo da semana, membros, prestígio, moral, força, a data, o ≫ que
  empurra o dia e o 1×/2×), a fita das manchetes, a coluna de ícones (os
  nove painéis e o menu principal) e o feed, que vira uma coluna à direita
  e recolhe pelo botão da borda (com o número do que chegou enquanto estava
  fechado).
- **Os dias passam** como no jogo de feed: o relógio pinga as mensagens e
  vira o dia sozinho; decisão sem resposta, painel, modal ou cena param o
  tempo.
- **Arrastar no meio da tela move a câmera** da cidade: o que não é HUD não
  pega o mouse.
- **A cidade para de desenhar** quando algo a cobre inteira (um painel, uma
  cena de briga, o relatório, um modal): o último quadro fica e o
  processador fica com o jogo.
- **Um boneco só.** As cenas do jogo (a reunião da diretoria, as brigas)
  desenham o boneco do cenário: os dois níveis afinados, os jeitos do dia
  de jogo e as poses da reunião que vieram do Pages (sentado na cadeira,
  olhar pra quem fala, falar sentado e em pé).
- **O motor de briga é o mais novo** (`combate.js` do Pages, 4.159 linhas,
  com o "setor não é porta" do estádio 3D deste ramo).

## 3. O que ainda é "de feed" — e a proposta pra cada um

Em ordem de peso pro jogo. Cada item espera o dono apontar as mudanças.

1. **O dia de jogo.** No jogo de feed ele é o cartão da partida com o
   itinerário em três fases (ida, jogo, volta) e um evento por fase. No 3D
   já existe o dia de jogo da IA (`dia_de_jogo.js`: as torcidas saindo das
   sedes, a caravana na entrada da cidade, o anfitrião, a PM, a revista, a
   briga na rua). **Proposta:** o cartão da partida abre o dia na cidade; os
   bondes saem do `praca.naRuaEm` do jogo (a mesma lista que a briga usa); a
   torcida do jogador é um bonde a mais, com a rota que ele escolher (o
   pedido de 27/09: "o jogador vai poder optar por fazer outra rota com sua
   torcida"); o evento de cada fase acontece no ponto da cidade onde as
   rotas se cruzam.
2. **As brigas.** Hoje abrem na cena de briga do jogo de feed (a foto aérea
   2D com o boneco 3D por cima), em cima da cidade. **Proposta:** a briga
   acontece na própria rua da cidade, com o mesmo `combate.js`: um recorte
   da cidade em volta do ponto (1536×1024 px do motor, uns 79×53 m) vira a
   máscara de caminhar (a grade do boneco a pé do cenário já sabe onde cabe
   gente), os bondes entram onde estão, e o boneco é o mesmo. O motor não
   muda — muda de onde ele tira o chão. (O caminho já foi feito uma vez: o
   estádio 3D, `estadio3d.html`, roda o combate num tabuleiro dobrado.)
3. **A reunião da diretoria.** Hoje é a foto do pátio da sede, com as
   cadeiras e os balões. **Proposta:** a roda dentro da sede 3D (`sede3d.js`
   já tem os cômodos), com as mesmas cadeiras e os mesmos balões.
4. **O mapa do jogo e o mapa da cidade são dois.** O jogo de feed tem o
   mapa dele (`js/mundo/mapa.js` e `mapa_gerado.js`: a arte de Fortaleza,
   São Paulo e Belo Horizonte e a cruz gerada das outras 27, com os
   bairros, os pinos das sedes e dos bares e as distâncias da briga), e o
   3D tem a planta (`proposta.js`, os três mapas por porte). São dois
   modelos da mesma praça, cada um com as sedes e os bares no seu lugar:
   um ponto de um não é um ponto do outro. **Proposta:** a planta do 3D
   passa a ser a única; `pontoDaSede`, `pontoDoBar` e os bairros do jogo
   leem dela. É a peça de arquitetura que destrava o resto (o dia de jogo e
   a briga na rua dependem dela).
5. **O feed.** Fica como a coluna das mensagens (é o celular do
   presidente). Alguns cartões podem ganhar um "ver na cidade" — o olheiro
   apontando o bar da rival, a obra do patrimônio, a caravana chegando.
6. **Os painéis** (Torcida, Financeiro, Calendário, Competições, Ranking,
   Diplomacia, Notícias, Jogo) ficam como são: são planilha. Os que têm
   lugar na cidade (o bar, a loja, a sede do patrimônio; as sedes das
   rivais na diplomacia) podem ganhar o botão que leva a câmera até lá.
7. **Os dias na cidade.** A hora do dia na luz, gente na rua nos dias de
   folga, a sede aberta no expediente.

## 4. As regras do dia de jogo desta rodada (27/09/2026)

No planejador do 3D (`dia_de_jogo.js`) e, quando é regra do jogo, no jogo
também (`js/mundo/praca.js`, anotado em `docs/DECISOES.md`):

- `BASE_PROCURA`: maior rival 55, rival 25 (o jogo tinha 62/36).
- Quem vai pra rua: a torcida da praça, todo mundo de pé; a de fora, a
  caravana do jogo (uns 47% das de pé, no mínimo 5).
- O anfitrião do visitante é o do jogo (a irmandade ou os aliados do
  visitante, com sede na praça; o empate pelo hash do par). Ele sorteia:
  a irmandade 10/30/60, o aliado 35/45/20 (não recebe / hospeda / hospeda
  e escolta). Do clube mandante, só hospeda. A escolta é a do jogo: 5 a 10%
  do efetivo de quem hospeda.
- A briga entre duas IAs é a do jogo (`brigaIA`): força = gente × ficha
  média; o favorito vence 70%; feridos e presos dos dois lados pela tabela
  de `simular.js`. O preso fica rendido, de mãos pra cima.
- Só do 3D: o bonde escoltado pela PM também pode atacar.

## 5. Como testar

Os roteiros de teste ficam fora do repositório (na pasta de rascunho da
sessão); o que eles fazem, pra refazer:

- **O jogo 3D inteiro:** abrir `?teste&jogo`, esperar a praça, "Novo jogo",
  `TO.tela.escolherTorcida('TUF')`, começar; responder o que travar (o
  primeiro botão, ou o de pular), fechar os painéis e modais que as
  respostas abrirem, encerrar as cenas com `TO.diaJogo.ponte.encerrar()`,
  e conferir que os dias passam, que os painéis abrem e que o arrasto move
  a câmera.
- **O jogo de feed (a raiz, `index.html`):** o mesmo roteiro, sem a
  cidade.
- **O dia de jogo do 3D:** os 90 planos das 30 praças (o clássico, o mando
  invertido e um visitante de fora em cada).
