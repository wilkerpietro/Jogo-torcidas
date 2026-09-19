# -*- coding: utf-8 -*-
"""IMPORTA O PACK DE DECALQUE DE CHÃO.

   A arte vem numa folha de contato 8 × 4 com fundo PRETO e sem alfa —
   não foi o que se pediu (pediu-se um arquivo por peça, com alfa ou com
   fundo magenta), mas dá pra salvar, e o motivo é geométrico: cada peça
   é um BOLO ISOLADO no meio da célula. Então o fundo não é "o que é
   escuro", é "o escuro LIGADO À BORDA" — e isso se acha por inundação,
   não por limiar de luminância.

   A diferença não é de gosto. No cascalho escuro da folha, 27% da arte
   tem luminância abaixo de 25: recortar por limiar deixa a peça com
   metade dos pixels (medido: 51%), cheia de furos. Por inundação
   sobrevivem 92%.

   Fundo preto tem uma segunda propriedade boa: imagem composta sobre
   preto É a sua própria versão com alfa pré-multiplicado (o pixel vale
   α·C). Então a franja anti-serrilhada da borda se recupera exata:
   α sai da luminância e a cor volta dividindo por α. Sem isso toda
   folha de capim fica com contorno preto.

   Sai em `img/texturas/chao.png`: atlas 8 × 4 de células quadradas, a
   arte centrada e com a proporção dela preservada por preenchimento
   transparente — assim a placa no 3D pode ser um quadrado e a proporção
   se resolve sozinha.
"""
import sys
from collections import deque
from PIL import Image

FONTE = 'img/texturas/fonte/chao_pack.png'
SAIDA = 'img/texturas/chao.png'
CEL, MARGEM = 192, 8            # célula do atlas e folga até a borda
DESSATURA = 0.76                # o verde do pack grita ao lado da paleta do jogo
LIMIAR = 16                     # o que conta como "preto de fundo"


def faixas(vazio, minimo):
    """os trechos NÃO vazios de um vetor de booleanos"""
    out, i = [], 0
    while i < len(vazio):
        if not vazio[i]:
            j = i
            while j < len(vazio) and not vazio[j]:
                j += 1
            if j - i >= minimo:
                out.append((i, j))
            i = j
        else:
            i += 1
    return out


def grade(im):
    """acha as 8 colunas e as 4 linhas pelas faixas totalmente pretas"""
    w, h = im.size
    px = im.load()
    lum = [[max(px[x, y][:3]) for x in range(w)] for y in range(h)]
    colVazia = [all(lum[y][x] <= LIMIAR for y in range(h)) for x in range(w)]
    linVazia = [all(v <= LIMIAR for v in lum[y]) for y in range(h)]
    return faixas(colVazia, 20), faixas(linVazia, 20), lum


def recortar(im, lum, x0, y0, x1, y1):
    """devolve a célula em RGBA: fundo = o preto que se alcança da borda"""
    w, h = x1 - x0, y1 - y0
    px = im.load()
    escuro = [[lum[y0 + y][x0 + x] <= LIMIAR for x in range(w)] for y in range(h)]
    fora = [[False] * w for _ in range(h)]
    fila = deque()
    for x in range(w):
        for y in (0, h - 1):
            if escuro[y][x] and not fora[y][x]:
                fora[y][x] = True; fila.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if escuro[y][x] and not fora[y][x]:
                fora[y][x] = True; fila.append((y, x))
    while fila:
        y, x = fila.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and escuro[ny][nx] and not fora[ny][nx]:
                fora[ny][nx] = True; fila.append((ny, nx))

    cel = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    saida = cel.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x0 + x, y0 + y][:3]
            l = lum[y0 + y][x0 + x]
            if not fora[y][x]:
                a = 255                                    # miolo da peça
            elif l > 2:
                a = min(255, int(l * 255 / 90))            # franja: α da luminância
            else:
                continue
            if a <= 0:
                continue
            if a < 255:                                    # desfaz o pré-multiplicado
                k = 255.0 / a
                r, g, b = min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k))
            # dessatura em direção ao cinza da própria peça
            m = (r + g + b) / 3.0
            r = int(m + (r - m) * DESSATURA)
            g = int(m + (g - m) * DESSATURA)
            b = int(m + (b - m) * DESSATURA)
            saida[x, y] = (r, g, b, a)
    return cel.crop(cel.getbbox() or (0, 0, w, h))


def main():
    im = Image.open(FONTE).convert('RGB')
    cols, lins, lum = grade(im)
    if len(cols) != 8 or len(lins) != 4:
        sys.exit('grade inesperada: %d colunas, %d linhas' % (len(cols), len(lins)))
    atlas = Image.new('RGBA', (CEL * 8, CEL * 4), (0, 0, 0, 0))
    n = 0
    for r, (y0, y1) in enumerate(lins):
        for c, (x0, x1) in enumerate(cols):
            peca = recortar(im, lum, max(0, x0 - 6), max(0, y0 - 6),
                            min(im.size[0], x1 + 6), min(im.size[1], y1 + 6))
            alvo = CEL - 2 * MARGEM
            e = min(alvo / peca.size[0], alvo / peca.size[1])
            nova = peca.resize((max(1, round(peca.size[0] * e)),
                               max(1, round(peca.size[1] * e))), Image.LANCZOS)
            atlas.paste(nova, (c * CEL + (CEL - nova.size[0]) // 2,
                               r * CEL + (CEL - nova.size[1]) // 2), nova)
            n += 1
    atlas.save(SAIDA, optimize=True)
    print('%s: %d peças, %dx%d' % (SAIDA, n, atlas.size[0], atlas.size[1]))


main()
