# A reunião da diretoria — o plano (dono, 22/09/2026)

O pedido, nas palavras do dono: *"transformar a reunião de diplomacia
numa reunião mensal. A reunião abre a cena de uma roda de cadeiras com
todos os diretores reunidos, com o presidente da torcida na frente da
roda e cada pauta da reunião abre um balão de mensagens em cima de algum
membro da diretoria."* E a correção, no mesmo dia: *"Prefiro que os
reunidos sentem em formato de C quadrado, e o presidente sozinho do lado
direito, virado pra eles."* E junto: os botes no bar e na casa de piscina
passam a ser propostos nessa reunião, com dia e alvo; aceitos, entram no
calendário e acontecem no dia. E a torcida ganha um presidente com nome
— o jogador —, que é o boneco controlado nas cenas.

Este arquivo é o desenho inteiro, o que já está feito e o que falta.

## 1. O que já está no jogo (22/09/2026)

| Peça | Onde | Estado |
|---|---|---|
| Presidente com nome, escolhido na abertura (passo 3 da seleção) | `main.js` (`pintarPasso3`), `index.html`, `estado.novo`, `membros.nomearPresidente` | **feito** |
| O presidente é o boneco do jogador nas cenas; preso, ferido ou fora da escalação, o mais forte assume | `combate.criarEstado` (a escolha do líder) | **feito** |
| Save antigo ganha presidente na carga (o mais forte da diretoria) | `estado.repararSave` → `membros.garantirPresidente` | **feito** |
| Presidente não pendura a bandeira por idade; rótulo "Presidente" na tela | `membros.envelhecer`, `membros.cargoNome` | **feito** |
| Reunião **mensal** (dia 5), chamada "Reunião da diretoria" | `feed.reuniaoDeHoje` | **feito** |
| Cada pauta tem o diretor que a traz (`quem`); a tela mostra o nome e a fala num balão | `feed.pautar`/`diretorDaPauta`, `main.abrirReuniao` (`.reu-balao`) | **feito** |
| O modelo da mesa pra cena: presidente, diretores, pautas com o diretor de cada uma | `feed.mesaDaReuniao` | **feito** |
| Botes do mês propostos na reunião, com dia (sem jogo, sem caravana) e alvo | `feed.pautaBote`, `diaDoBote`, `diaLivre`, `alvoDoBar`, `alvoDaCasa` | **feito** |
| Bote aceito → `E.botes`; o calendário mostra; no dia, o cartão abre a cena | `feed.aplicarPauta` (`bote-marcar`), `feed.boteDeHoje`, `main.celulaDoDia` | **feito** |
| A sugestão semanal solta de bar/casa saiu | `feed.eventosDoDia` (passo "bote do dia") | **feito** |
| A pose **sentado na cadeira** do boneco 3D, com três jeitos | `bonecos3.sentadoCadeira`, `d.sentado` | **feito** |
| Disco sentado: não anda, não é empurrado, não acaba a cena | `combate` (laço de movimento, `separar`, `conferirFim`) | **feito** |
| O C quadrado: 12 cadeiras com posição e rumo (4 no fundo, 4 em cima, 4 embaixo, abertura pra direita), o presidente em pé sozinho à direita, virado pra eles — **no pátio de cada sede** | `dados/cenas.js` (`SEDES`, `cadeirasEmC`: `D.cadeiras`, `D.presidente` em cada `sede-N`), `combate.sentarNaRoda`, `arredores.desenharSobreposicoes` (as cadeiras por cima da foto) | **feito** |
| As fotos das sedes 2, 3, 4 e 5 (o 6 usa a do 5) importadas, as cinco cenas `sede-N` registradas, `TO.dados.sedeCenaDoNivel(n)` | `ferramentas/importar_cena_foto.py`, `dados/cenas_foto.js`, `dados/cenas.js` | **feito (22/09)** |
| As abas "Sede 1" a "Sede 5" na bancada (cenas de briga), com a diretoria sentada, e o estado "sentado" na vitrine | `bancada.js`, `bonecos.html` | **feito** |
| O prompt da foto da sala própria | `img/cenas/PROMPT-REUNIAO.md` | **superado** — a reunião é no pátio da sede |

## 2. O que falta — as fases

### Fase A · A reunião muda de endereço — feita (22/09/2026)
A cena solta `reuniao`, com sala própria e prompt próprio
(`img/cenas/PROMPT-REUNIAO.md`), foi **descartada antes de nascer**: o
dono decidiu aproveitar o pátio que cada sede já tem, em vez de gerar
uma sétima cena, e gerou as quatro fotos que faltavam no mesmo dia.

O que ficou feito:
1. as fotos dos níveis 2, 3, 4 e 5 importadas (`importar_cena_foto.py`,
   receitas `sede-2` a `sede-5`), com máscara e faixa; o nível 6 usa a
   foto do 5;
2. as cinco cenas `sede-N` nascem de um laço (`SEDES` em `dados/cenas.js`):
   cada uma com o retângulo do pátio medido na foto e, dentro dele, o C
   quadrado (`cadeirasEmC` → `D.cadeiras`, `D.presidente`) — a posição
   muda de nível pra nível, porque o pátio não fica no mesmo lugar em
   cada planta; o retângulo foi conferido contra a máscara, cadeira por
   cadeira (níveis 2, 4 e 5 ajustados até nenhuma cair em parede);
3. a cena `reuniao` e o pintor `sala` saíram; o `combate` e o `bonecos3`
   não mudaram — a lógica de sentar é a mesma, só vale pra `sede-N`; o
   `cenario.cadeira` passou a desenhar as cadeiras por cima da foto;
4. `TO.dados.sedeCenaDoNivel(n)` diz a cena do nível atual (6 → 5): é
   por ela que a fase B abre a reunião na sede certa.

O que a máscara ainda pede (F2 do dono, na aba "Sede N" da bancada): no
nível 4 só o pátio abriu — as salas ficaram escuras; nos outros níveis as
paredes finas entre pátio e sala nem sempre viraram parede.

### Fase B · A cena da reunião no jogo (código)
Hoje o cartão do dia 5 abre a **tela** da reunião (a trilha de passos com
o balão de cada pauta). A fase B troca a tela pela **cena**:

1. `abrir-reuniao` passa a abrir o palco (`abrirPalco`) com
   `local: TO.dados.sedeCenaDoNivel(E.torcida.sedeNivel)`, `paz:true`,
   `reuniao:true`, `escalacao` = a
   diretoria de pé (presidente primeiro) — o mesmo caminho de
   `abrirAcaoEmCena`, sem rival, sem bomba, sem PM.
2. **Os balões**: uma camada HTML por cima do canvas (como `#djSobre`
   das cenas de perto), um balão por pauta ancorado na posição do disco
   do diretor (`d.x, d.y` → tela). O balão traz o texto da pauta e os
   botões (`decidirPauta`), e o "quando/contra" do bote. Clicar num
   diretor abre o balão dele; os já decididos ficam com a ata em cinza.
3. **O presidente fala**: as duas pautas que hoje não têm diretor — o
   pedido a um aliado e a nossa jogada nos eixos — abrem no balão do
   presidente (em pé, à direita), com os mesmos controles de hoje.
4. **Encerrar**: o botão de encerrar (na faixa da transmissão) chama
   `fecharReuniao`; a cena fecha sem relatório de noite (não é briga).
5. O diretor que fala **gesticula** enquanto o balão está aberto (um
   movimento novo, `falar`, no estilo do `chamar`), e os outros viram a
   cabeça pra ele (`olharPara` no `sentadoCadeira`).

### Fase C · Acabamento
- Preso ou ferido não senta: a cadeira dele fica vazia, e a pauta que
  seria dele vai pra outro (hoje `diretorDaPauta` já pula preso).
- A reunião na sub-sede? Não: a diretoria senta na sede-mãe.
- Com poucos diretores o C encolhe sozinho: as cadeiras são ocupadas na
  ordem fundo → braços, do fundo pra abertura, então seis diretores
  fazem um C pequeno, não um lado só.
- Som ambiente e a fala do presidente quando a pauta é decidida — depois.

## 3. As regras que já valem

- **Dia 5 de todo mês.** Se não há pauta nem jogada nossa nos eixos, não
  há reunião (o cartão não sai).
- **Botes:** cada tipo (bar, casa) tem 35% ao mês, ≈ 8 por ano, a dose
  que a sugestão semanal tinha. O dia é sorteado entre os dias do mês a
  partir do dia 7 que não têm jogo do clube nem véspera/dia seguinte de
  caravana, com dois dias de folga de outro bote. Sem dia livre, o bote
  não é proposto.
- **"Deixar quieto"** custa o que custava: prestígio −1, moral −1.
- **No dia,** se a agenda pôs um jogo em cima (o árbitro adia jogo), o
  bote é empurrado pro próximo dia livre. O cartão do dia tem um botão
  só: o bote foi decidido na reunião.
- **O presidente** é diretoria, 20/20 na cena como todo líder, nunca se
  aposenta, e o nome dele é o que o jogador digitou. Numa escalação sem
  ele (a zona da casa de piscina, o núcleo da filial), o mais forte que
  desceu é o líder.
