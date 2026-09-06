# Prompt para o boneco no Blender

Objetivo: sair do cilindro + esfera do `cena3d.js` e ter gente de verdade na
cena. Este arquivo tem três prompts, porque não existe **um** prompt que
resolva — cada caminho serve a uma coisa diferente, e um deles você
provavelmente nem devia seguir.

---

## Antes do prompt: o boneco vai aparecer com 14 × 22 pixels

Isso não é chute, sai do código. Em `js/diajogo/combate.js` o torcedor nasce
com `r = 7` (o líder e o PM com `9`), e em `cena3d.js` a instância é escalada
uniforme por esse raio, com o corpo valendo `ALT_CORPO = 3,2` raios:

| quem | largura | altura | numa cena de 1536 × 1024 |
|---|---|---|---|
| torcedor | 14 px | 22 px | **0,9% da largura da tela** |
| líder / PM | 18 px | 29 px | 1,2% |

Vinte e dois pixels de altura. Nessa escala não existe rosto, não existe
tecido, não existe poro de pele — existe silhueta e cor de camisa. Um boneco
fotorrealista de 40 mil triângulos e textura 4K vai render exatamente o mesmo
borrão que um de 300 triângulos com cor chapada, e vai custar uns dez minutos
de GPU por quadro quando a multidão encher (a `prova_multidao.html` vai até
**20.000** discos).

Então a resposta sincera: **realismo não paga na multidão**. Paga em três
lugares, e são estes:

- **retrato do líder** nos menus, na ficha do membro, na tela de contratação;
- **arte de capa** do itch.io e das capturas de tela;
- **cena de close**, se um dia houver uma — cutscene de invasão de sede, etc.

Para esses três, o realismo é o produto. Para a multidão, o alvo é outro:
silhueta legível de cima e cor por instância. São modelos diferentes, feitos
por caminhos diferentes. O documento cobre os dois.

---

## O que o jogo exige do modelo (isto manda mais que o prompt)

Prompt nenhum salva um modelo que não encaixa. Antes de gerar qualquer coisa:

**Pivô e escala.** Pés na origem (`Z = 0` no Blender), boneco centrado em
`X = 0` e `Y = 0`, altura total da malha = **3,2** unidades. É a malha unitária
que o `cena3d.js` espera: a instância multiplica tudo por `d.r`, então com 3,2
de altura o torcedor sai com os mesmos 22 px de hoje e você não toca no
renderizador. No Blender: `N` → Item → Dimensions → Z = 3.2, com
Apply Scale (`Ctrl+A`) depois.

**Orientação.** Modele de frente pra você na vista `Numpad 1` — ou seja,
olhando pra −Y. O exportador glTF converte Z-up pra Y-up sozinho, e o boneco
sai olhando pra +Z, enquanto o "pra frente" do three.js costuma ser −Z. Ele vai
sair de costas. **Não conserte no Blender**: some `Math.PI` no ângulo quando o
código passar a girar. Uma linha, e o asset continua limpo.

**A multidão hoje não gira.** Repare no `desenhar()`: a rotação por instância
é só inclinação (`rotation.set(tiltX, 0, tiltZ)`), o eixo Y fica em zero. Com
cilindro e esfera isso nunca apareceu, porque a forma é simétrica. Com boneco,
todo mundo fica olhando pro mesmo lado — e fica horroroso. Duas saídas:

1. **modelo simétrico e sem rosto** — capuz, boné, cabeça sem feição. Aguenta
   ficar sem girar. É a saída barata;
2. **girar de verdade**: `d3.rotation.y = Math.atan2(d.vx || 0, d.vy || 0)`
   junto com a inclinação que já existe. Com inclinação pequena a ordem de
   Euler não atrapalha. É a saída certa, e são duas linhas.

**Cor por instância.** O material é `MeshLambertMaterial` sem textura, e a cor
da torcida entra por `setColorAt` — que **multiplica**. Se você assar uma
textura de pele no boneco, o vermelho da torcida tinge o rosto junto. A saída
é dividir em dois `InstancedMesh` com as mesmas matrizes: um pro que é fixo
(pele, bermuda, tênis) e outro pro que é da torcida (camisa, boné). Custa uma
chamada de desenho a mais e, de quebra, finalmente usa o `cor2` que hoje está
declarado e não é lido no 3D.

**Orçamento de triângulos.** Hoje o cilindro de 7 lados + esfera 7×5 dá uns
**90 triângulos**. Teto pra multidão: **300**. Em 20.000 instâncias isso já é
6 milhões de triângulos por quadro. Antes de commitar qualquer boneco novo,
rode a `prova_multidao.html` com ele e olhe o FPS — a bancada existe pra isso.

**Nada de armadura na multidão.** `InstancedMesh` e malha com esqueleto não se
misturam: animação por osso exige uma malha por personagem, e aí acabam os
20.000. Animar multidão pede *vertex animation texture* (o ciclo de andar
assado num mapa de posições) ou skinning na GPU. Isso é assunto pra depois —
por ora, boneco parado que desliza, que é exatamente o que o disco já faz.

**Exportar.** `.glb` (glTF) pro three.js; `.fbx` pro Unity, com as opções
padrão do exportador (`-Z Forward, Y Up`), que costumam cair certas.

---

## Caminho A — folha de referência e modelar na mão

É o caminho que eu seguiria pro boneco da multidão, e é o único que ensina
Blender de verdade. A IA aqui não faz o modelo: ela faz a **referência** que
fica de fundo enquanto você modela. Malha feita na mão sai com topologia
limpa, com a contagem de triângulos que você escolheu e pronta pra riggar.

### Prompt — vista de frente

```
orthographic character reference sheet of a young Brazilian man, single figure,
front view, standing straight in a relaxed A-pose, arms slightly away from the
body, palms facing backwards, fingers relaxed and separated, feet shoulder-width
apart, looking straight ahead, completely neutral expression,

flat even frontal studio lighting, no cast shadows, no rim light, no dramatic
contrast, plain uniform mid-grey background, full body from the top of the head
to the soles of the feet with even margin above and below, figure dead centred,
camera at chest height, very long lens, orthographic feel with no foreshortening,

24 years old, lean athletic build, medium brown skin, short black hair, light
stubble, plain black cap worn straight, plain solid-colour sleeveless football
shirt with no crest and no sponsor logos, plain sport shorts, white socks, worn
trainers, a rolled bandana around one wrist,

photorealistic, sharp focus, even detail across the whole figure, documentary
photography, neutral colour, 8k
```

### Prompt — vista de lado e de costas

**Não gere do zero.** Modelo de texto puro não repete a mesma pessoa: muda a
altura, muda a roupa, muda o corte de cabelo, e aí as duas referências não
casam. É a mesma lição do bar lá no `PROMPT-PRACA-RUA.md` — modelo de edição
obedece melhor a uma ordem curta em cima de uma imagem que já deu certo. Pegue
a vista de frente aprovada e mande:

```
Same man, same clothes, same height, same framing and same lighting, turned to
show an exact side profile facing left. Keep the A-pose, the grey background,
the camera height and the distance identical. Do not change the body, the
clothing or the crop.
```

E depois, com a mesma imagem de frente:

```
Same man, same clothes, same height, same framing and same lighting, seen
exactly from behind. Keep the A-pose, the grey background, the camera height
and the distance identical.
```

### Negativo (vale pras três)

```
perspective, wide angle, fisheye, low angle, high angle, tilted camera,
dramatic lighting, rim light, hard shadows, cast shadow, dark background,
gradient background, vignette,
cropped feet, cropped head, close-up, portrait crop, bust, half body,
multiple people, crowd, group, duplicate figures, mirrored copies, reflection,
text, labels, watermark, logo, club crest, team badge, sponsor, shirt number,
action pose, running, jumping, contrapposto, hands on hips, crossed arms,
hands in pockets, hidden hands, clenched fists, weapon,
long coat, flowing fabric, cape, baggy clothing hiding the silhouette,
anime, cartoon, illustration, painting, 3d render, cgi, video game character,
bodybuilder, obese, elderly, child, woman
```

### Como usar no Blender

1. `Shift+A` → Image → Reference, uma imagem por vista. Ponha a de frente na
   vista `Numpad 1` e a de lado na `Numpad 3`;
2. no painel do objeto de imagem, ligue **Show in Front (X-ray)** e baixe a
   **Opacity** pra uns 0,4;
3. escale a de lado até topo da cabeça e sola do pé baterem com a de frente.
   **Vão bater mal** — a IA não mantém proporção entre duas gerações. Confie na
   anatomia (um corpo tem ~7,5 cabeças de altura), não na imagem: a referência
   é pra pegar volume e roupa, não pra medir;
4. modele metade com **Mirror**, ligue **Subdivision Surface** só pra ver a
   forma, e aplique nada até o fim;
5. pra multidão, **Decimate** no final até cair abaixo de 300 triângulos, e
   confira a silhueta **de cima**, que é a única que o jogador vê.

---

## Caminho B — gerar a malha direto (Meshy, Tripo, Rodin)

Serve pra ter um boneco na tela hoje. Prompt de texto-pra-3D funciona ao
contrário do de imagem: **curto ganha**. Parágrafo longo confunde.

```
young Brazilian football fan, lean build, black cap, plain sleeveless jersey,
sport shorts, trainers, standing in a symmetric A-pose, arms slightly apart,
full body, game-ready character, clean silhouette, neutral colours, no logos,
no text
```

Ligue, se o serviço oferecer: **A-pose/T-pose**, **simetria**, **saída em
quads**, e desligue PBR se você for pintar cor chapada de qualquer jeito.

**O que vai sair de errado** — e vai, não é azar:

- mão fundida num toco, dedo colado;
- rosto derretido, olho torto;
- textura com sombra e luz **assadas dentro dela**, o que briga com a luz do
  jogo e com a cor por instância;
- topologia de triângulo embolado, impossível de riggar bem;
- 100 mil triângulos ou mais.

Consertos, na ordem: **Decimate** (ou **Remesh** em Voxel, se estiver muito
ruim) até o orçamento; jogar a textura fora e usar cor chapada; se precisar de
esqueleto, subir no **Mixamo**, que auto-rigga de graça e ainda dá ciclo de
andar, correr e soco — que é literalmente o que uma briga de torcida precisa.

A 22 pixels de altura, esse boneco passa. Num close ele não passa de jeito
nenhum.

---

## Caminho C — o atalho que eu recomendo pro herói (sem prompt nenhum)

Sendo sincero: se o alvo é **humano realista**, prompt é o pior caminho. Existe
ferramenta que já resolve isso, e a curva pra iniciante é bem menor:

- **MakeHuman** (grátis, programa separado, exporta pro Blender) ou
  **MB-Lab** (addon do Blender, grátis) — humano anatomicamente correto,
  com UV pronta e esqueleto pronto, em segundos. Você mexe em sliders de idade,
  peso, altura, etnia;
- **Human Generator** (addon pago, ~US$ 60) — o mesmo, mais bonito e mais
  rápido, dentro do Blender;
- **Character Creator 4 + Headshot** (pago, caro) — é o nível "realista" de
  verdade, e tem exportação boa pra Unity;
- roupa: modele por cima do corpo com **Shrinkwrap**, ou compre uma base.
  Simulação de pano só se sobrar tempo;
- animação: **Mixamo**, grátis, arrasta o FBX e escolhe o ciclo.

Nesse caminho o prompt volta a servir pra uma coisa só, e é a que ele faz bem:
gerar a **referência de aparência** — como é a cara, o corte de cabelo, a
roupa, o clima da foto — que você persegue nos sliders.

---

## Prompt do retrato (aqui o realismo compensa)

Pro menu, pra ficha de membro, pra capa do itch.io. Aqui não tem modelo 3D
nenhum: é imagem, e imagem a 512 px de rosto mostra tudo o que a multidão
esconde.

```
photorealistic waist-up portrait of a Brazilian torcida organizada leader, man
in his early thirties, medium brown skin, shaved head, thick beard, small scar
above one eyebrow, hard steady gaze straight into the camera, neutral
unsmiling expression,

wearing a plain black sleeveless shirt and a rolled bandana around the neck,
faded tattoos on both forearms, no visible logos, no club crest, no text,

overcast diffuse daylight, soft directional light from the left, shallow depth
of field, out-of-focus concrete wall and stadium fence behind him, desaturated
muted colours, documentary photojournalism, 85mm lens, sharp focus on the eyes,
film grain, natural skin texture with pores and imperfections
```

### Negativo

```
smiling, cheerful, friendly, glamour, beauty retouch, smooth plastic skin,
airbrushed, studio backdrop, ring light, hdr, saturated colours, neon,
club crest, team badge, logo, sponsor, text, watermark, signature,
weapon, blood, violence, gore,
anime, cartoon, illustration, painting, 3d render, cgi, video game character,
full body, wide shot, crowd, multiple people, hands in frame, extra fingers
```

O mesmo acabamento das cenas — luz nublada, cor dessaturada, foto documental —
é de propósito: o retrato tem que parecer da mesma cidade que a `arredores.webp`.

---

## Conferência antes de aceitar

Boneco da multidão:

1. **Olhe de cima, não de frente.** Abra a `prova_multidao.html` ou a
   `bancada3d.html` e enquadre como o jogo enquadra. Se a silhueta some no
   chão, o modelo não serve — por mais bonito que esteja na viewport;
2. **Conte o triângulo.** `N` → Statistics no Blender, ou o painel de estatística
   da bancada. Acima de 300 por instância, decimate de novo;
3. **Troque a cor por instância.** Uma torcida vermelha e uma azul lado a lado:
   se a pele ficar vermelha junto, você assou textura e precisa dividir em dois
   `InstancedMesh`;
4. **FPS na bancada, com 20.000.** É a única medida que vale. Se cair dos 60,
   ou o modelo emagrece ou a multidão vira LOD;
5. **Pivô no pé.** Ponha um boneco em `y = 0` e olhe de lado: se ele flutuar ou
   afundar no chão, a origem está no centro da malha e não entre os pés;
6. **Direção.** Se todo mundo estiver de costas, é o 180° do glTF. Conserte no
   código, não no arquivo.

Retrato:

1. **Sem escudo de time real.** Escudo, nome e uniforme de clube são marca
   registrada, e isso é um jogo que vai pro itch.io. Camisa lisa, cor chapada,
   e a identidade da torcida entra pela cor — que o jogo já controla por
   instância. Vale pro modelo 3D também;
2. **Sem rosto de pessoa real.** Modelo de imagem às vezes devolve alguém
   reconhecível. Se parecer com gente que existe, gere de novo.
