# Texturas PBR do chão — solte os arquivos CC0 aqui

Esta pasta é o material ladrilhado do chão. Ela existe por um motivo
medido: a textura do chão de hoje tem **9,1 pixels por metro** (4096 px
esticados sobre 450 m de mundo). A referência que queremos tem 256 a 512
px/m. Pintar o mundo inteiro nessa densidade daria uma imagem de 115.200
× 86.784 px — 10 gigapixels, não existe.

A saída é a de qualquer motor: **parar de pintar o mundo e ladrilhar
material**. Uma textura pequena repetida a cada 2–4 m dá os 256+ px/m, e
a variação vem de máscara, decalque e cor — não de uma imagem gigante.

O `texChao` (a pintura da cidade vista de cima) continua existindo, mas
muda de papel: ele deixa de ser a APARÊNCIA e vira a MÁSCARA. A cor que
ele pinta em cada ponto (`#3a3a38` rua, `#8d897d` calçada, mato, areia)
passa a dizer QUAL destes materiais entra ali, e o shader mistura.

## Onde baixar (os dois são CC0, uso comercial liberado)

- **ambientCG** — https://ambientcg.com
- **Poly Haven** — https://polyhaven.com/textures

## O que baixar, exatamente

| item | escolha | por quê |
|---|---|---|
| resolução | **1K** (1024) | a 2 m de ladrilho já dá 512 px/m. 2K dobra a memória sem ganho visível; 4K/8K trava o navegador |
| formato | **JPG** | PNG aqui é 4× o tamanho sem ganho — não tem transparência envolvida |
| normal | **NormalGL** (OpenGL) | ⚠️ veja o aviso abaixo |

### ⚠️ A pegadinha: NormalGL, nunca NormalDX

O ambientCG oferece os dois. **Three.js usa a convenção OpenGL** (canal
verde = +Y). Se você baixar o `NormalDX`, o relevo sai **invertido** —
buraco vira bolha, a luz bate do lado errado, e é o tipo de erro que
parece "tá feio" em vez de "tá errado", então custa um dia pra achar.

No Poly Haven o arquivo certo tem `nor_gl` no nome (não `nor_dx`).

### Escolha textura CHATA, não bonita

Este é o erro mais comum. Uma textura com uma trinca marcante, uma
mancha forte ou uma folha caída vira **aquela mesma trinca repetida a
cada 3 metros** por toda a cidade — e o olho pega repetição muito mais
rápido do que pega falta de detalhe. Prefira a mais uniforme e sem graça
das opções: a variação interessante entra depois, por decalque e por
máscara.

Pelo mesmo motivo: evite textura com **sombra assada** (foto tirada com
sol de lado). O motor já faz a luz; sombra pintada dentro briga com ela.

## As cinco pastas

| pasta | onde entra no mapa | o que procurar |
|---|---|---|
| `asfalto/` | rua, avenida, beco | *Asphalt* |
| `concreto/` | calçada, pátio, piso, praça | *Concrete*, *PavingStones* |
| `terra/` | lote vazio, baldio, mato, terreno | *Ground*, *Soil*, *Dirt* |
| `grama/` | gramado do estádio, praça, grama | *Grass* |
| `areia/` | praia, orla | *Sand* |

## Como soltar os arquivos

**Pode soltar exatamente como veio do download**, sem renomear nada —
só jogue dentro da pasta do material certo. O carregador reconhece os
padrões dos dois sites:

```
img/texturas/pbr/asfalto/
  Asphalt012_1K-JPG_Color.jpg          ← ambientCG
  Asphalt012_1K-JPG_NormalGL.jpg
  Asphalt012_1K-JPG_Roughness.jpg
  Asphalt012_1K-JPG_AmbientOcclusion.jpg   (opcional)
```

ou

```
img/texturas/pbr/grama/
  grass_02_diff_1k.jpg                 ← Poly Haven
  grass_02_nor_gl_1k.jpg
  grass_02_rough_1k.jpg
  grass_02_ao_1k.jpg                   (opcional)
```

Os que o carregador procura, em ordem de preferência:

- **cor**: `*Color*`, `*_diff*`, `*albedo*`, `*basecolor*`, `cor.jpg`
- **relevo**: `*NormalGL*`, `*_nor_gl*`, `*normal*`, `normal.jpg`
- **rugosidade**: `*Roughness*`, `*_rough*`, `rugosidade.jpg`
- **oclusão** (opcional): `*AmbientOcclusion*`, `*_ao*`, `ao.jpg`

Não precisa dos outros arquivos do pacote (Displacement, Opacity,
Metalness, os `.usda`/`.mtlx`) — pode apagar ou deixar, são ignorados.

## O mínimo que funciona

Se sobrar só a **cor** de algum material, já dá pra rodar: o carregador
deriva um relevo aproximado a partir dela (é o que o `estadio3d.js` já
faz pro grão do chão hoje). Fica pior que o normal map de verdade, mas
não trava nada — então não deixe de soltar um material só porque faltou
um mapa.

## Orçamento de memória

Cinco materiais × três mapas × 1024² × RGBA, com mipmap, dá uns **84 MB**
de vídeo. Aceitável, mas não é de graça: se apertar em celular, a saída é
cair pra 512 nos materiais que aparecem menos (areia, grama), e não tirar
material da lista.
