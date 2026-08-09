# Imagens das cenas

| Arquivo | Peso | Uso |
|---|---|---|
| `arredores.webp` | ~203 KB | **é o que o jogo carrega** |
| `arredores.png` | ~2,7 MB | mestre sem perda, fica só como fonte |
| `_ref_arredores_marcado.png` | ~2,9 MB | referência com as marcações, não é carregada |

## Peso

O GDD §2.3 avisa: imagem pesada inviabiliza o download. O PNG de 2,7 MB virou
WebP de 203 KB com qualidade 82 — 93% menor, sem diferença visível no jogo.

Na hora de publicar no itch.io, **suba só o `.webp`**. Os dois PNG existem para
poder regerar a cena depois; não precisam ir no build.

Para regerar o WebP:

```python
from PIL import Image
Image.open('img/cenas/arredores.png').convert('RGB') \
     .save('img/cenas/arredores.webp', 'WEBP', quality=82, method=6)
```

## Trocar a imagem

`dados/cena_arredores.js` está calibrado para **1536 × 1024**. Se a nova imagem
tiver outro tamanho, ajuste `largura` e `altura` lá — spawns, portões, postos de
PM e grades escalam junto.

A malha de caminhabilidade **não** escala: ela é específica daquela foto. Depois de
trocar a imagem, abra `arredores.html`, aperte **F2** e refaça a malha no pincel,
ou rode de novo o script que a extrai da foto.

## Editor

Na cena, **F2** abre o editor:

- **pincel** — clique libera passagem, shift ou botão direito bloqueia, `[` e `]` mudam o tamanho
- **marcadores** — arrasta spawn, portão, posto de PM e as pontas das grades
- **exportar** — gera o `dados/cena_arredores.js` inteiro, pronto pra substituir
- arrastar um arquivo de imagem pra tela troca o fundo na hora, sem commitar nada
