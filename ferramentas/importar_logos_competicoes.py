#!/usr/bin/env python3
"""LOGOS DAS COMPETIÇÕES, DO PACOTE DO DONO (01/10/2026)

O dono mandou campeonatos.rar com as logos oficiais. Este script:
  1. tira o FUNDO das que vieram com fundo (jpeg/jfif e png com fundo
     branco): o branco que encosta na borda vira transparente, com a
     beirada suavizada — o branco de DENTRO da logo fica;
  2. põe um HALO claro nas logos escuras (Libertadores, Sudamericana,
     Paulistão…), que sumiriam no fundo escuro do jogo;
  3. reduz tudo pra 320 px no lado maior e grava em img/competicoes/
     com o nome que o jogo usa (dados/competicoes_logos.js).
O Mineiro (SVG) é copiado como veio. A Série C veio em SVG com a letra
verde-escura, que some no fundo do jogo: ela é rasterizada antes (o
'serie c.png' ao lado do svg, tirado no Chromium) e ganha o halo; sem o
png, o svg é copiado como veio.
As que não vieram no pacote seguem com o emblema desenhado pelo jogo
(ferramentas/emblemas_competicoes.py).

Uso: python3 ferramentas/importar_logos_competicoes.py <pasta com as logos> [mais pastas]
"""
import os, sys, shutil
from collections import deque
from PIL import Image, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', 'img', 'competicoes')
LADO = 320

# a bola da Primera B colombiana encosta no fundo branco: a inundação
# entra pelos gomos brancos. Nela o miolo redondo fica inteiro.
MIOLO_REDONDO = {'primera b colombia.jfif'}

# arquivo do pacote → nome no jogo
MAPA = {
  'argentina primera.png': 'argentina-primera',
  'campeonato boliviano.png': 'bolivia-primera',
  'campeonato catarinense.png': 'catarinense',
  'campeonato peruano.png': 'peru-liga-1',
  'campeonato uruguaio.png': 'uruguai-primera',
  'cariocao.jfif': 'cariocao',
  'colombia primera a.png': 'colombia-primera-a',
  'copa do brasil.png': 'copa-do-brasil',
  'copa do nordeste serie b.png': 'nordestao-serie-b',
  'copa do nordeste.png': 'copa-do-nordeste',
  'copa norte.jfif': 'copa-norte',
  'equador primera.webp': 'equador-serie-a',
  'gauchao.png': 'gauchao',
  'libertadores.webp': 'libertadores',
  'mineiro.svg': 'mineiro',
  'paraguay primera.png': 'paraguai-primera',
  'paranaense.png': 'paranaense',
  'paulista a1.png': 'paulistao',
  'paulistao a2.png': 'paulistao-a2',
  'primera b chile.png': 'chile-primera-b',
  'primera b colombia.jfif': 'colombia-primera-b',
  'primera b.png': 'argentina-primera-b',
  'primera chile.png': 'chile-primera',
  'primera nacional.png': 'argentina-primera-nacional',
  'serie a.png': 'serie-a',
  'serie b.webp': 'serie-b',
  'serie c.png': 'serie-c',
  'serie d.png': 'serie-d',
  'sulamericana.png': 'sul-americana',
  'venezuela primera.png': 'venezuela-primera',
  # o segundo pacote (campeonatos_restantes.rar, 01/10/2026)
  'copa argentina.png': 'copa-argentina',
  'copa bolivia.png': 'copa-bolivia',
  'copa centro oeste.png': 'copa-centro-oeste',
  'copa chile.png': 'copa-chile',
  'copa colombia.png': 'copa-colombia',
  'copa equador.png': 'copa-ecuador',
  'copa paraguai.png': 'copa-paraguay',
  'copa peru.png': 'copa-peru',
  'copa uruguai.png': 'copa-uruguay',
  'copa venezuela.png': 'copa-venezuela',
}

def tem_fundo(im):
    """fundo = a borda quase toda opaca e clara"""
    w, h = im.size
    px = im.load()
    borda = [px[x, 0] for x in range(w)] + [px[x, h-1] for x in range(w)] + \
            [px[0, y] for y in range(h)] + [px[w-1, y] for y in range(h)]
    claros = sum(1 for p in borda if p[3] > 200 and min(p[:3]) > 225)
    return claros > len(borda) * 0.6

def tirar_fundo(im, tol=48):
    """inunda a partir da borda tudo que é quase branco; a beirada ganha
    alfa proporcional à distância do branco (sem serrilhado)"""
    w, h = im.size
    px = im.load()
    dist = lambda p: 255*3 - (p[0] + p[1] + p[2])
    vis = bytearray(w*h)
    fila = deque()
    for x in range(w):
        fila.append((x, 0)); fila.append((x, h-1))
    for y in range(h):
        fila.append((0, y)); fila.append((w-1, y))
    while fila:
        x, y = fila.popleft()
        i = y*w + x
        if vis[i]: continue
        p = px[x, y]
        d = dist(p)
        if p[3] > 0 and d > tol*3: continue
        vis[i] = 1
        # quanto mais longe do branco, mais opaco fica (borda suave)
        a = 0 if d < tol else int(min(255, (d - tol) / (tol*2) * 255))
        px[x, y] = (p[0], p[1], p[2], min(p[3], a))
        if d >= tol: continue          # a beirada não espalha
        for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
            if 0 <= nx < w and 0 <= ny < h and not vis[ny*w + nx]:
                fila.append((nx, ny))
    return im

def escura(im):
    """a logo some no fundo escuro do jogo? (muito pixel opaco e escuro)"""
    px = list(im.get_flattened_data()) if hasattr(im, 'get_flattened_data') else list(im.getdata())
    op = [p for p in px if p[3] > 160]
    if not op: return False
    esc = sum(1 for p in op if (0.299*p[0] + 0.587*p[1] + 0.114*p[2]) < 75)
    return esc / len(op) > 0.12

def halo(im, raio=4):
    """um contorno claro, macio, atrás da logo"""
    a = im.split()[3]
    grosso = a.filter(ImageFilter.MaxFilter(raio*2 + 1)).filter(ImageFilter.GaussianBlur(raio*0.6))
    fundo = Image.new('RGBA', im.size, (245, 242, 235, 0))
    fundo.putalpha(grosso.point(lambda v: int(v * 0.92)))
    fundo.alpha_composite(im)
    return fundo

def main(pasta):
    os.makedirs(SAIDA, exist_ok=True)
    feitos = []
    for arq, nome in MAPA.items():
        orig = os.path.join(pasta, arq)
        if not os.path.exists(orig):
            continue
        if arq == 'serie c.png' and not os.path.exists(orig):
            arq, orig = 'serie c.svg', os.path.join(pasta, 'serie c.svg')
        if arq.endswith('.svg'):
            shutil.copyfile(orig, os.path.join(SAIDA, nome + '.svg'))
            feitos.append(nome + '.svg (svg)'); continue
        im = Image.open(orig).convert('RGBA')
        if max(im.size) > LADO*3:      # o Gauchão veio com 4.700 px
            im.thumbnail((LADO*3, LADO*3), Image.LANCZOS)
        notas = []
        if tem_fundo(im):
            orig_px = im.copy()
            im = tirar_fundo(im); notas.append('sem fundo')
            if arq in MIOLO_REDONDO:
                # o círculo da logo (pelo que não é branco) volta opaco
                cinza = orig_px.convert('L').point(lambda v: 255 if v < 235 else 0)
                bb = cinza.getbbox() or (0, 0) + orig_px.size
                cx, cy = (bb[0]+bb[2])/2, (bb[1]+bb[3])/2
                r = min(bb[2]-bb[0], bb[3]-bb[1]) / 2 - 1
                px, po = im.load(), orig_px.load()
                for y in range(im.height):
                    for x in range(im.width):
                        d = ((x-cx)**2 + (y-cy)**2) ** 0.5
                        if d <= r: px[x, y] = po[x, y]
                        elif d <= r + 1.5:
                            q = po[x, y]; px[x, y] = (q[0], q[1], q[2], max(px[x, y][3], int(255*(r+1.5-d)/1.5)))
                notas.append('miolo redondo')
        # pó quase transparente em volta (a Copa Colombia veio com pontinhos
        # soltos) não pode mandar no recorte
        a = im.split()[3].point(lambda v: 0 if v < 40 else v)
        im.putalpha(a)
        bb = a.point(lambda v: 255 if v > 0 else 0).filter(ImageFilter.MinFilter(3)).getbbox()
        if bb: im = im.crop(bb)
        im.thumbnail((LADO - 12, LADO - 12), Image.LANCZOS)
        # folga pra o halo não bater na borda
        tela = Image.new('RGBA', (im.width + 12, im.height + 12), (0, 0, 0, 0))
        tela.alpha_composite(im, (6, 6))
        im = tela
        if escura(im):
            im = halo(im); notas.append('halo')
        im.save(os.path.join(SAIDA, nome + '.png'), optimize=True)
        # o emblema provisório do mesmo nome sai de cena
        prov = os.path.join(SAIDA, nome + '.svg')
        if os.path.exists(prov): os.remove(prov)
        feitos.append(f'{nome}.png {im.size} {" ".join(notas)}')
    print('\n'.join(feitos))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    for pasta in sys.argv[1:]: main(pasta)
