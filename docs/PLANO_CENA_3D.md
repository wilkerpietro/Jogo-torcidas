# CENA 3D — o que já roda, o que custa, e o que decidir antes

Documento de trabalho. O pedido era planejar um cenário 3D dos arredores do
estádio, em HTML, com câmera de perto estilo GTA e um personagem humano andando
pelos controles do jogo. Em vez de planejar no papel, subi a coisa rodando: dá
pra abrir, andar e julgar. O que está aqui é o que a maquete provou, o que ela
não resolve, e a conta de cada caminho daqui pra frente.

---

## 1. O que existe agora

| arquivo | o que é | linhas |
|---|---|---:|
| `arredores3d.html` | a bancada 3D: as 9 abas da bancada 2D, agora em 3D | ~230 |
| `js/diajogo/cena3d.js` | o desenhista 3D inteiro | ~700 |
| `vendor/three/` | three.js r160, versão de módulo, embutida no repositório | 655 KB |

**Abrir:** o navegador não carrega módulo ES por `file://`. Precisa de servidor:

```
python3 -m http.server 8000
# depois: http://localhost:8000/arredores3d.html
```

**Controles:** WASD anda (relativo à câmera), 1–4 formação, Q pedra, E bomba,
R recuar, arrastar gira a câmera, roda aproxima. `Z` ombro, `X` alta,
`C` maquete, `F` zenital, `B` troca a altura dos prédios, `H` liga e desliga a sombra,
**`V` alterna 2D ↔ 3D na mesma partida** — é a tecla que interessa, porque
mostra os dois desenhistas lendo o mesmo estado, sem recomeçar nada.

![câmera de ombro](../img/cena3d/ombro.jpg)

![câmera alta](../img/cena3d/alto.jpg)

![maquete](../img/cena3d/maquete.jpg)

---

## 2. A decisão de arquitetura, e por que ela se sustentou

**`combate.js` não foi tocado.** Nenhuma linha. O 3D é um segundo desenhista
que lê o `J` uma vez por quadro e põe em pé; a simulação continua sendo o
mesmo tabuleiro 2D de 1536 × 1024, com a mesma malha de 8 px, a mesma colisão,
os mesmos campos de fluxo, a mesma polícia. É por isso que o `V` funciona.

Três coisas fizeram isso sair barato:

**O chão sai de graça.** `arredores.desenharFundo(ctx)` já sabe pintar qualquer
uma das oito cenas — a foto aérea dos arredores ou a pintura procedural da
praça, da rua, do bar, do comércio, do CT. Chamamos ela num canvas fora da tela
e o resultado vira a textura do plano. **Zero arte nova, e as oito cenas
entraram juntas.**

**Os prédios saem da malha, não de modelagem.** A lista `poligonos.bloqueio`
dos arredores tem 9 retângulos; a foto tem trinta e poucos prédios. Extrudar a
lista deixaria parede invisível espalhada pela cena — você bate e não vê no
quê. Então quem sobe é `A.malha`, a mesma que a colisão usa: componentes
ligados das células bloqueadas → retângulos por *greedy meshing* → uma altura
e uma cor por componente. Nos arredores dá **15 prédios em 111 caixas**, e a
garantia é forte: *não existe parede que só o desenho tem, nem passagem que só
o desenho fecha.*

**O telhado é a própria foto.** O topo de cada caixa recebe a textura do chão
projetada de cima, recortada na região que a caixa ocupa. O telhado da caixa é
o telhado que está na foto, alinhado ao pixel — foi isso que dispensou material
de telhado.

A parede é uma fachada procedural desenhada em canvas (laje, três janelas,
peitoril, reflexo no vidro), em ladrilho, tingida pela cor média do próprio
telhado. Prédio de telha vermelha ganha parede avermelhada sem ninguém
escolher.

---

## 3. O boneco

Seis peças de caixa — cabeça, tronco, dois braços, duas pernas — e **uma malha
instanciada por peça**: 400 pessoas custam 6 chamadas de desenho, não 400. A
passada é procedural: o desenhista guarda a posição do quadro anterior, tira
dali a direção e a velocidade, e balança quadril e ombro com isso. O tronco
sobe e desce meio pixel na passada, que é o que separa "boneco deslizando" de
"gente andando". Quem cai deita com o mesmo boneco.

**Nenhum arquivo de modelo, nenhum osso, nenhuma animação importada.** É de
propósito: o boneco de caixa é o *lugar* onde o boneco do Blender entra depois,
com a mesma interface — `porPessoa(alvo, i, estado, caído, cores)`.

O líder usa boné dourado. A camisa é a cor primária da torcida e o calção é a
secundária — as mesmas duas cores que o disco 2D usa (§8.12).

---

## 4. Os números, medidos

Medidos no navegador, na cena dos arredores, com 63 pessoas em pé.

| o quê | valor |
|---|---:|
| CPU do desenhista 3D por quadro | **0,25 ms** |
| CPU da simulação por quadro (`combate.passo`) | **0,61 ms** |
| montar os prédios do zero (BFS + greedy + geometria) | **20 ms** |
| chamadas de desenho por quadro | **22** |
| triângulos na cena | **~7 000** |
| prédios / caixas nos arredores | 15 / 111 |
| prédios / caixas na praça | 8 / 105 |

**O desenhista 3D custa menos da metade do que a própria simulação custa.**
Isso responde a pergunta de CPU e é o número que mais importa: pôr em pé não é
o gargalo.

**O que eu não pude medir: a placa de vídeo.** Este ambiente só tem rasterizador
por software (SwiftShader), onde a cena roda a 4–5 quadros por segundo. Com 22
chamadas e 7 mil triângulos, num GPU de verdade isto é trivial — mas isso é
inferência, não medição. **Rode aí e olhe o contador de fps antes de acreditar
em mim.** Se estiver ruim, o primeiro suspeito é a sombra: o mapa de 2048²
redesenha a cena inteira todo quadro e é o item mais caro da lista — **`H`
desliga**, e a diferença entre os dois números diz se é ela.

---

## 5. Onde a escala não fecha — e isto é o achado do dia

A cena não é um lugar, é um tabuleiro. Isso não aparecia de cima; de perto,
aparece na hora.

**A régua.** Medi as listras da faixa de pedestre na foto: banda clara de ~4 px
repetindo a cada ~10 px. Faixa de pedestre é listra de meio metro com vão de
meio metro, então **1 px ≈ 10 cm** (±20%, é foto gerada, não levantamento).
Daí sai tudo:

| coisa | na cena | em metros | o que devia ser |
|---|---:|---:|---|
| a cena inteira | 1536 × 1024 px | **154 × 102 m** | um quarteirão — está certo |
| corpo do disco | raio 7 px | **1,4 m de largura** | 0,5 m → **2,8× largo demais** |
| `P.velocidade` | 60 px/s | **6 m/s** | andar é 1,4; correr é 3 → **4× rápido demais** |
| o boneco que desenhei | 31 px de altura | **3,1 m** | 1,8 m → **1,7× alto demais** |
| pedra (§4, alcance) | 170 px | **17 m** | plausível |
| prédio no modo `rua` | 168 px | **16,8 m** | 5 andares — plausível |

O boneco está a 3,1 m porque eu o dimensionei pelo **disco de colisão**, não
pela foto. Se eu o pusesse em 1,8 m, cada pessoa passaria a andar dentro de uma
bolha de colisão duas vezes maior que ela, e a multidão ficaria com buraco de
1 m entre um sujeito e outro — a briga vira roda de capoeira.

**São dois caminhos, e só dois:**

- **(a) Aceitar o boneco grande.** É o que está no ar. Fica com cara de
  boneco de mesa vivo — legível, coeso, e nada mais precisa mudar. O preço é
  que a cena nunca vai parecer uma rua de verdade: as pessoas são gigantes
  correndo a 6 m/s numa avenida de 15 m.
- **(b) Reescalar a cena inteira, ~2,5×.** Corpo com raio 3, velocidade 22 px/s,
  alcance de pedra e raio da PM proporcionais, célula da malha de 8 pra 4 (o
  que quadruplica a malha), máscara refeita, e **todos os spawns, portões,
  postos de PM, grades e filas de `cena_arredores.js` movidos** — mais as oito
  cenas de `cenas.js`. E depois recalibrar `P` inteiro: dano por quadro,
  separação, debandada, carga da PM. **Isso não é trabalho de render, é
  trabalho de level design e de calibragem, e é o maior item desta lista.**

Não dá pra fugir dessa escolha adiando: tudo que for feito de arte a partir de
agora nasce preso a uma das duas réguas.

---

## 6. O que a câmera de perto custa ao jogo — sem enfeitar

Vou ser direto, porque isto é o que decide se vale.

**A formação some.** O GDD já fechou que "líder é âncora física, não cursor de
comando; **formação é a decisão principal**" (§7). Bonde, Muralha, Investida e
Espalhar são figuras que só existem vistas de cima. Na câmera de ombro você vê
seis nucas e mais nada — a decisão principal do combate fica invisível
exatamente na tela em que ela é tomada.

**O cordão some junto.** Romper 35% do cordão é a conquista da cena (§3.4).
De ombro você não enxerga o cordão inteiro, então não sabe onde ele está fino,
nem que ele quebrou até o aviso aparecer. A leitura vira texto.

**A polícia deixa de ser lida e vira susto.** Hoje a atenção policial é
espacial: você vê a viatura vindo e decide. De perto, ela aparece.

**O que a câmera de perto ganha, e é real:** a rua vira lugar. O bonde tem
tamanho. A pedra tem altura de verdade (no 2D a altura do arremesso é mentira
desenhada; em 3D é altura). O portão do estádio deixa de ser uma barra
vermelha e vira uma coisa em que você corre. Isso não é pouco, mas é *outra*
coisa — é ambiente, não é tática.

**A saída honesta é não escolher uma câmera só.** Já está no ar: `Z` ombro para
o deslocamento e a chegada, `X` alta para a briga, `C` maquete para ler o
cordão. Um jogo que troca de câmera pela fase da noite mantém a decisão
legível e ainda entrega a rua. **Minha recomendação é essa** — e se for pra ter
uma câmera só, que seja a `alta` (`X`), que é a que ainda mostra formação.

---

## 7. O que ainda não existe

Em ordem de quanto muda a impressão por hora gasta.

1. **Animação de briga.** Hoje o boneco só anda. Bater, apanhar, arremessar e
   ser preso não têm pose nenhuma — numa briga o corpo vira um poste. É o buraco
   mais visível. Dá pra fazer procedural (braço avança no `d.golpe`, corpo
   recua no dano) sem sair do boneco de caixa: **é a próxima coisa a fazer.**
2. **Meio-fio e calçada.** A malha diz "dá pra pisar" e mais nada, então a
   calçada é chão pintado e o prédio nasce direto do asfalto. Um degrau de 15 cm
   em volta de cada quarteirão resolve 80% da sensação de rua.
3. **Poste, semáforo, lixeira, carro parado.** As cenas desenhadas já têm
   `enfeites` e `varais` em `cenas.js`, e o 3D **ignora os dois** hoje.
   Aproveitar essa lista é barato e é o que tira a cara de maquete vazia.
4. **A textura do chão de perto.** A foto tem 1 texel por unidade de mundo e a
   câmera de ombro amplia isso ~14×. Tem um granulado por cima segurando, mas
   asfalto e calçada continuam borrados a dois metros. O certo é uma segunda
   camada de detalhe por tipo de piso, tirada da máscara.
5. **Colisão da câmera.** Ela atravessa parede. Num corredor estreito o
   jogador vê o miolo do prédio.
6. **Entrada por vetor.** `moverLider` lê quatro booleanos, então a câmera de
   ombro só consegue mandar oito direções (giro a intenção e devolvo os quatro
   que mais se parecem com ela). Andar na diagonal contra a parede fica
   engasgado. O conserto é `moverLider` aceitar `{dx, dy}` — é uma mudança
   pequena em `combate.js` e a primeira que eu faria lá.
7. **Rosto, roupa, variação.** Todo mundo tem o mesmo corpo. Cinco tons de pele
   e duas cores de camisa é o que separa uma pessoa da outra.

---

## 8. O caminho do Blender, quando ele entrar

Você é iniciante no Blender, então vou dizer o que eu faria e o que eu **não**
faria.

**Não modele nem faça o rig de um humano do zero.** É o trabalho mais difícil
que existe pra quem está começando, e não é onde este jogo ganha.

**O caminho curto:** Mixamo (grátis, da Adobe) — pega um personagem pronto ou
sobe um seu, ele faz o rig automático, e você baixa `andar`, `correr`, `soco`,
`levar soco`, `cair`, `arremessar` como FBX. Importa no Blender, junta as
animações num arquivo, exporta **glTF/GLB**. É o formato que o three.js carrega
sem plugin. Uma tarde, não um mês.

**O gargalo é a multidão, não o modelo.** 400 personagens com esqueleto de
verdade não cabem em `InstancedMesh` — cada um precisa das próprias matrizes de
osso. Os três caminhos, do mais fácil ao mais rápido:

- **LOD por distância** — modelo com osso só para os ~20 mais perto da câmera,
  boneco de caixa para o resto. É o que eu faria primeiro: aproveita tudo que
  já está escrito e o boneco de caixa continua ganhando o pão.
- **Textura de animação (VAT)** — assa cada pose num texture e lê no shader.
  Aí sim dá 400 animados em uma chamada, mas exige shader customizado e um
  script de assar no Blender.
- **`InstancedSkinnedMesh`** — existe em versões recentes do three.js, resolve
  o caso médio, e é o que eu olharia antes de partir pra VAT.

**Onde o Blender ganha muito mais rápido:** no cenário, não na gente. Um kit de
quarteirão — fachada de esquina, fachada de meio, poste, ponto de ônibus,
grade, camburão — em glTF, instanciado sobre os retângulos que a maquete já
extrai da malha, transforma a cena e é modelagem de caixa, que é onde iniciante
consegue trabalhar bem. **Se for pra aprender Blender em cima deste jogo,
aprenda por aí.**

---

## 9. As decisões que travam o resto

Nenhuma linha nova deveria ser escrita antes destas três:

1. **A câmera de perto é o jogo, ou é uma das câmeras?** Se for o jogo, a
   formação precisa de outro corpo (indicador em tela, marcação no chão) ou o
   sistema morre. Se for uma das câmeras, não morre nada e o trabalho é menor.
2. **Escala (a) ou (b)?** Boneco grande de tabuleiro, ou reescalar a cena e
   recalibrar `P` inteiro. Amarra toda a arte daqui pra frente.
3. **Isto substitui a cena 2D ou convive com ela?** Conviver custa manter dois
   desenhistas — hoje é barato porque os dois leem o mesmo `J`, e continua
   barato enquanto ninguém pedir efeito que só existe num dos dois.

---

## 10. O que este trabalho NÃO mexeu

- `combate.js`, `arredores.js`, `cenario.js`, `ponte.js`: intactos.
- `arredores.html` (a bancada 2D) e o jogo em `index.html`: intactos. A cena 3D
  é uma página à parte e não está ligada ao dia de jogo.
- Nenhum dado de cena mudou: `cena_arredores.js` e `cenas.js` estão como
  estavam.
