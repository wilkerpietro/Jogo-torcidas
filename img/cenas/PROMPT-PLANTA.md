# Prompt para transformar a planta do mapa em foto aérea

Entrada: `planta-fortaleza-2048.png` (2048×2048, sem pinos, sem nome de bairro).
Alvo: o mesmo acabamento de `arredores.png` — foto de drone a prumo, dia nublado,
cor dessaturada, periferia brasileira.

## O que não pode mudar

O traçado das ruas **é a malha de navegação do jogo**. Se a IA fechar um beco,
deslocar uma avenida ou plantar prédio em cima de rua, os bondes passam a andar
por cima de casa. Então:

- toda faixa escura da planta continua sendo via aberta, do começo ao fim;
- os becos no meio de cada quarteirão — as frestas finas entre as duas fileiras
  de lotes — continuam abertos e conectados nas duas pontas;
- os cruzamentos seguem alinhados, sem deslocar nem arredondar quarteirão;
- a rotatória do centro, a praia a leste, a rodovia e o mato a sudoeste ficam
  onde estão;
- os três retângulos vermelhos com miolo verde são estádios: viram estádio de
  verdade, no mesmo lugar e no mesmo tamanho.

## Como rodar (isto importa mais que o texto)

Não use texto puro — a imagem tem de ser a base:

- **img2img** com *denoising strength* entre **0,35 e 0,50**. Acima de 0,55 o
  modelo redesenha o traçado e a malha quebra.
- Melhor ainda: **ControlNet Canny ou Lineart, peso 0,9–1,1**, com a planta como
  guia. Aí dá pra subir o denoise sem perder rua.
- Faça em **duas passadas**: uma a 2048 para o traçado, outra de *upscale* 2×
  (tile/ultimate SD upscale, denoise 0,2) só para textura.
- Guarde a saída como PNG e converta pro jogo:
  `Image.open(...).convert('RGB').save('mapa_cidade.webp','WEBP',quality=82,method=6)`

## Prompt (inglês — a maioria dos modelos responde melhor)

```
top-down nadir aerial drone photograph of a Brazilian working-class city
district, shot straight down at 90 degrees, orthographic feel, overcast diffuse
daylight, soft shadows, desaturated muted colors, documentary photography,

dense grid of small city blocks separated by paved streets and narrow service
alleys, every street and alley clearly open and passable end to end, worn dark
asphalt with faded lane markings and patched repairs, painted black-and-white
curbs, zebra crossings at intersections, small roundabout with a green island at
the center,

low houses with terracotta clay tile roofs and flat concrete rooftops, blue water
tanks, laundry lines with colorful clothes, satellite dishes, weathered asbestos
sheets, small backyards, occasional two-storey buildings, mango trees along the
sidewalks, scattered parked cars along the curbs,

three football stadiums with real grass pitches and concrete stands, one per
district, sandy beach and blue-green ocean along the east edge, highway with
vegetation and scrub at the southwest corner,

photorealistic, natural materials, sun-bleached concrete, tropical northeast
Brazil, Fortaleza, 8k satellite imagery quality, sharp detail, no people visible
```

## Negative prompt

```
illustration, cartoon, isometric, 3d render, video game asset, painting,
vector art, blueprint, map icons, labels, text, watermark, grid lines,
tilted perspective, oblique angle, fisheye, vignette,
buildings covering the streets, blocked alleys, dead ends, closed roads,
rivers, snow, skyscrapers, european architecture, suburban american houses,
saturated colors, hdr, dramatic lighting, night
```

## Conferência antes de aceitar

1. Abra a saída ao lado da planta e alterne entre as duas: nenhuma rua pode ter
   sumido nem entortado.
2. Passe o olho nos becos do meio de cada quarteirão — são eles que somem primeiro.
3. Cole no jogo e ande com os bondes: `TO.ruas` continua usando a geometria do
   modelo, não a imagem, então um beco fechado no desenho vira disco atravessando
   parede. Se acontecer, refaça com denoise mais baixo.
