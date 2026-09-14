# experimentos/three

three.js encostando no jogo. Duas coisas moram aqui, e elas têm pesos
bem diferentes.

---

## 1. `cena3d.js` — o renderizador (este é o que importa)

Fica em `js/diajogo/cena3d.js`, junto com o resto do dia de jogo, porque
não é experimento: é candidato a entrar. Ele substitui **uma função** e
só ela — `combate.desenhar`.

Três decisões explicam o arquivo inteiro:

1. **O chão continua sendo o desenho que já existe.** A textura do chão é
   `arredores.desenharFundo` assado num canvas fora da tela. Isso serve a
   foto aérea dos arredores E as cenas desenhadas (praça, rua, bar…) sem
   uma linha de arte nova e sem tocar em `cenario.js`. Era o ponto que
   parecia bloquear a migração; não bloqueia.
2. **A câmera é ortográfica e olha de cima.** Com inclinação 0 o
   enquadramento é o mesmo do canvas 2D, pixel por pixel. Trocar de
   renderizador não muda nada do que o jogador aprendeu.
3. **O disco vira gente, e é só isso que muda de verdade.** Uma
   `InstancedMesh` pinta a multidão inteira numa chamada de desenho, com
   sombra no chão. É o que o 2D não dá: passa de umas centenas de `arc()`
   e o quadro cai.

### Como ligar no jogo

A costura é de três linhas, em `ponte.desenhar()`:

```js
function desenhar(){
  if(!J) return;
  const T3 = TO.diaJogo.cena3d;
  if(T3 && T3.ativo()){ T3.desenhar(J, {}); return; }   // <— só isto
  escala=ajustar(ctx,cv,A.W,A.H);
  C.desenhar(J,ctx,{...});
  ...
}
```

Mais o `T3.iniciar(canvasGL, canvasSobre)` uma vez, quando a tela de dia
de jogo abre. **Ainda não fiz essa ligação no `ponte.js`** — de
propósito, pra não brigar com a versão mais nova do jogo, que está fora
deste repositório.

### O que ele ainda não faz

- **Editor (F2) e sobreposições** (spawn, portão) continuam no 2D.
  Editor é ferramenta, não é jogo.
- **Barra de vida e nome do líder** não viram geometria: são um canvas 2D
  transparente por cima, projetado pela mesma câmera. Funciona inclinado.
- **Inclinação forte fica com tarja preta** em cima e embaixo. É o preço
  da câmera ortográfica; preencher a tela inclinado pede câmera em
  perspectiva, e aí acaba a paridade com o 2D. Decisão pra depois.
- **A altura da gente é cheat.** O jogo é de cima e nunca precisou dizer
  quanto vale um pixel em metro. Na escala real (ombro de 14px ≈ 0,5 m,
  logo 1,75 m ≈ 49px) a multidão vira floresta de palito e tampa a cena.
  O corpo tem 3,2 raios de altura porque lê como gente sem esconder o
  chão.

---

## 2. `bancada3d.html` — a bancada de comparação

A **mesma** briga com os dois renderizadores, trocando no botão. Se o
jogo mudar de comportamento ao trocar de botão, é bug: `passo` é um só.

```
python3 -m http.server 8000
# http://localhost:8000/experimentos/three/bancada3d.html
```

WASD move o líder, 1–4 formação, Q pedra, E bomba, R recuar. Tem abas pra
todas as cenas, controle de inclinação e uma chave pra extrudar os blocos
da cena desenhada.

Em arquivo único, pra mandar por link ou abrir no celular:

```
python3 ferramentas/empacotar_cena.py --cena3d            # dist/bancada3d_unico.html
python3 ferramentas/empacotar_cena.py --cena3d --parcial  # pra publicar como artifact
```

## 3. `prova_multidao.html` — a bancada de quantidade

Anterior e mais boba: rua inventada, sem o jogo em volta, só pra medir
quantos discos a GPU aguenta. Continua servindo pra isso.

---

## Duas coisas que mudaram fora desta pasta

- `js/diajogo/cena3d.js` — o renderizador. Não é importado pelo
  `index.html`: quem carrega é a bancada.
- `ferramentas/empacotar_cena.py` — ganhou o alvo `--cena3d`, uma lista
  de scripts externos que **não** viram embutidos (o three.js vem de CDN;
  600 KB em base64 não ajudam ninguém), e uma correção que vale pros
  outros alvos: o `<style>` da própria página estava sendo jogado fora no
  empacotamento, porque só o `<body>` entrava. O `arredores.html` também
  perdia o dele.
