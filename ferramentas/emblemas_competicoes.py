#!/usr/bin/env python3
"""EMBLEMAS DAS COMPETIÇÕES (pedido do dono, 01/10/2026)

"Busque as logomarcas das competições que o jogo tem e deixe sem fundo."
Desta sessão só o GitHub responde: os sites de logo, a Wikipédia e os CDNs
de imagem são barrados pela rede. Depois o dono mandou o pacote com as oficiais
(ferramentas/importar_logos_competicoes.py); este script só desenha as
que continuam faltando. Pro resto este script desenha um emblema próprio, vetorial e SEM FUNDO,
nas cores da competição — liga em escudo, copa em medalhão com a taça,
regional em selo redondo, continental em medalhão com estrela. O nome do
arquivo é o mesmo que a logo de verdade teria: trocar um pelo outro é só
pôr o arquivo oficial no lugar (svg ou png com o mesmo nome; o png tem
de entrar no mapa `dados/competicoes_logos.js`).

Uso: python3 ferramentas/emblemas_competicoes.py   (reescreve img/competicoes/*.svg,
     menos os arquivos listados em REAIS)
"""
import os, html

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', 'img', 'competicoes')
# logos oficiais que já moram em img/competicoes: o emblema não as sobrescreve
# (as em png são puladas sozinhas, pelo arquivo)
REAIS = {'mineiro'}

FONTE = "'Arial Black','Arial Bold',Arial,Helvetica,sans-serif"

# slug: (forma, código grande, rótulo de cima, rótulo de baixo, cor1, cor2, cor3)
TABELA = {
  # ---- Brasil, nacionais ----
  'serie-a':            ('liga', 'A', 'BRASILEIRÃO', 'SÉRIE A', '#0b7a3b', '#f4c300', '#ffffff'),
  'serie-b':            ('liga', 'B', 'BRASILEIRÃO', 'SÉRIE B', '#13469b', '#f4c300', '#ffffff'),
  'serie-c':            ('liga', 'C', 'BRASILEIRÃO', 'SÉRIE C', '#b5121b', '#f4c300', '#ffffff'),
  'serie-d':            ('liga', 'D', 'BRASILEIRÃO', 'SÉRIE D', '#4b2a83', '#f4c300', '#ffffff'),
  'copa-do-brasil':     ('copa', 'BR', 'COPA DO', 'BRASIL', '#00843d', '#ffd100', '#ffffff'),
  'lnt':                ('liga', 'LNT', 'LIGA NACIONAL', 'TORCIDAS', '#151515', '#d4a72c', '#ffffff'),
  # ---- Brasil, regionais ----
  'copa-do-nordeste':   ('copa', 'NE', 'COPA DO', 'NORDESTE', '#e67700', '#1b1b1b', '#ffffff'),
  'nordestao-serie-b':  ('regional', 'NE', 'NORDESTÃO', 'SÉRIE B', '#b55a00', '#1b1b1b', '#ffffff'),
  'cariocao':           ('regional', 'RJ', 'CARIOCÃO', 'RIO DE JANEIRO', '#c8102e', '#14388c', '#ffffff'),
  'paulistao':          ('regional', 'SP', 'PAULISTÃO', 'SÃO PAULO', '#141414', '#d6232c', '#ffffff'),
  'paulistao-a2':       ('regional', 'A2', 'PAULISTÃO', 'SÉRIE A2', '#3a3a3a', '#d6232c', '#ffffff'),
  'copa-centro-oeste':  ('copa', 'CO', 'COPA', 'CENTRO-OESTE', '#2e7d32', '#ffd54f', '#ffffff'),
  'gauchao':            ('regional', 'RS', 'GAUCHÃO', 'RIO GRANDE DO SUL', '#00753e', '#d32f2f', '#ffd200'),
  'copa-norte':         ('copa', 'N', 'COPA', 'NORTE', '#00695c', '#ffd600', '#ffffff'),
  'mineiro':            ('regional', 'MG', 'MINEIRO', 'MINAS GERAIS', '#1c1c1c', '#c8102e', '#ffffff'),
  'paranaense':         ('regional', 'PR', 'PARANAENSE', 'PARANÁ', '#0d47a1', '#43a047', '#ffffff'),
  'catarinense':        ('regional', 'SC', 'CATARINENSE', 'SANTA CATARINA', '#b71c1c', '#2e7d32', '#ffffff'),
  # ---- CONMEBOL ----
  'libertadores':       ('continental', '★', 'CONMEBOL', 'LIBERTADORES', '#0a2552', '#d4a017', '#ffffff'),
  'sul-americana':      ('continental', '★', 'CONMEBOL', 'SUDAMERICANA', '#0d5a97', '#e9eef4', '#ffffff'),
  # ---- ligas de fora ----
  'argentina-primera-nacional': ('liga', 'PN', 'PRIMERA', 'NACIONAL', '#6cace4', '#1d2b53', '#ffffff'),
  'argentina-primera-b':        ('liga', 'B', 'PRIMERA', 'ARGENTINA', '#6cace4', '#1d2b53', '#ffffff'),
  'colombia-primera-a':         ('liga', 'A', 'PRIMERA', 'COLOMBIA', '#003893', '#fcd116', '#ce1126'),
  'colombia-primera-b':         ('liga', 'B', 'PRIMERA', 'COLOMBIA', '#003893', '#fcd116', '#ce1126'),
  'peru-liga-1':                ('liga', '1', 'LIGA', 'PERÚ', '#d91023', '#ffffff', '#1b1b1b'),
  'bolivia-primera':            ('liga', 'BO', 'PRIMERA', 'BOLIVIA', '#007934', '#f9e300', '#d52b1e'),
  'chile-primera':              ('liga', 'CL', 'PRIMERA', 'CHILE', '#0039a6', '#d52b1e', '#ffffff'),
  'chile-primera-b':            ('liga', 'B', 'PRIMERA', 'CHILE', '#0039a6', '#d52b1e', '#ffffff'),
  'equador-serie-a':            ('liga', 'A', 'SERIE', 'ECUADOR', '#034ea2', '#ffd100', '#ef3340'),
  'uruguai-primera':            ('liga', 'UY', 'PRIMERA', 'URUGUAY', '#0038a8', '#fcd116', '#ffffff'),
  'venezuela-primera':          ('liga', 'VE', 'PRIMERA', 'VENEZUELA', '#00247d', '#cf142b', '#ffcc00'),
  'paraguai-primera':           ('liga', 'PY', 'PRIMERA', 'PARAGUAY', '#0038a8', '#d52b1e', '#ffffff'),
  # ---- copas nacionais de fora ----
  'copa-argentina':  ('copa', 'AR', 'COPA', 'ARGENTINA', '#6cace4', '#1d2b53', '#ffffff'),
  'copa-bolivia':    ('copa', 'BO', 'COPA', 'BOLIVIA', '#007934', '#f9e300', '#d52b1e'),
  'copa-chile':      ('copa', 'CL', 'COPA', 'CHILE', '#d52b1e', '#0039a6', '#ffffff'),
  'copa-colombia':   ('copa', 'CO', 'COPA', 'COLOMBIA', '#003893', '#fcd116', '#ce1126'),
  'copa-ecuador':    ('copa', 'EC', 'COPA', 'ECUADOR', '#034ea2', '#ffd100', '#ef3340'),
  'copa-paraguay':   ('copa', 'PY', 'COPA', 'PARAGUAY', '#d52b1e', '#0038a8', '#ffffff'),
  'copa-peru':       ('copa', 'PE', 'COPA', 'PERÚ', '#d91023', '#ffffff', '#1b1b1b'),
  'copa-uruguay':    ('copa', 'UY', 'COPA', 'URUGUAY', '#0038a8', '#fcd116', '#ffffff'),
  'copa-venezuela':  ('copa', 'VE', 'COPA', 'VENEZUELA', '#cf142b', '#00247d', '#ffcc00'),
}

def esc(t): return html.escape(t, quote=True)

def tamanho(texto, base, largura):
    """encolhe a letra pra caber na largura (Arial Black ~0.72 em por letra)"""
    return min(base, largura / max(1, len(texto) * 0.72))

def taca(cx, cy, s, cor):
    """a taça: copo, alças e base, em traço cheio"""
    return (f'<g fill="{cor}">'
            f'<path d="M{cx-22*s},{cy-26*s} h{44*s} v{14*s} a{22*s},{22*s} 0 0 1 {-44*s},0 z"/>'
            f'<path d="M{cx-22*s},{cy-22*s} h{-10*s} a{10*s},{10*s} 0 0 0 {12*s},{16*s}" fill="none" stroke="{cor}" stroke-width="{4*s}"/>'
            f'<path d="M{cx+22*s},{cy-22*s} h{10*s} a{10*s},{10*s} 0 0 1 {-12*s},{16*s}" fill="none" stroke="{cor}" stroke-width="{4*s}"/>'
            f'<rect x="{cx-4*s}" y="{cy+8*s}" width="{8*s}" height="{10*s}"/>'
            f'<rect x="{cx-14*s}" y="{cy+18*s}" width="{28*s}" height="{7*s}" rx="{2*s}"/>'
            '</g>')

def arco(id_, r, cx=128, cy=128, de_cima=True):
    if de_cima:
        return f'<path id="{id_}" d="M{cx-r},{cy} A{r},{r} 0 0 1 {cx+r},{cy}" fill="none"/>'
    return f'<path id="{id_}" d="M{cx-r},{cy} A{r},{r} 0 0 0 {cx+r},{cy}" fill="none"/>'

def texto_no_arco(id_, t, cor, tam):
    # no anel, letra branca com contorno escuro: lê em qualquer cor de fundo
    return (f'<text font-family="{FONTE}" font-weight="900" font-size="{tam}" fill="#ffffff" '
            f'stroke="rgba(0,0,0,.45)" stroke-width="2.5" paint-order="stroke" '
            f'letter-spacing="1.5" text-anchor="middle"><textPath href="#{id_}" startOffset="50%">{esc(t)}</textPath></text>')

def liga(cod, cima, baixo, c1, c2, c3):
    tam = tamanho(cod, 104, 150)
    return (
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">'
      f'<stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c1}" stop-opacity=".82"/></linearGradient></defs>'
      # o escudo
      f'<path d="M128 10 L226 40 V120 C226 182 184 224 128 246 C72 224 30 182 30 120 V40 Z" fill="{c2}"/>'
      f'<path d="M128 22 L214 49 V120 C214 175 177 212 128 232 C79 212 42 175 42 120 V49 Z" fill="url(#g)"/>'
      # a faixa diagonal
      f'<path d="M42 150 L214 92 V112 L42 170 Z" fill="{c2}" opacity=".9"/>'
      f'<text x="128" y="66" font-family="{FONTE}" font-weight="900" font-size="{tamanho(cima, 22, 150)}" fill="{c3}" text-anchor="middle" letter-spacing="1">{esc(cima)}</text>'
      f'<text x="128" y="{150 + tam*0.18}" font-family="{FONTE}" font-weight="900" font-size="{tam}" fill="{c3}" text-anchor="middle" '
      f'stroke="{c1}" stroke-width="3" paint-order="stroke">{esc(cod)}</text>'
      f'<text x="128" y="197" font-family="{FONTE}" font-weight="900" font-size="{tamanho(baixo, 18, 96)}" fill="#ffffff" text-anchor="middle" letter-spacing="1" '
      f'stroke="{c1}" stroke-width="3" paint-order="stroke">{esc(baixo)}</text>'
    )

def copa(cod, cima, baixo, c1, c2, c3):
    return (
      f'<circle cx="128" cy="128" r="120" fill="{c2}"/>'
      f'<circle cx="128" cy="128" r="110" fill="{c1}"/>'
      f'<circle cx="128" cy="128" r="74" fill="none" stroke="{c2}" stroke-width="3"/>'
      + arco('a1', 92) + arco('a2', 92, de_cima=False)
      + texto_no_arco('a1', cima, c3, tamanho(cima, 22, 200))
      + f'<g transform="translate(0,8)">' + texto_no_arco('a2', baixo, c3, tamanho(baixo, 22, 220)).replace('<text ', '<text dominant-baseline="hanging" ') + '</g>'
      + taca(128, 118, 1.55, c2)
      + f'<text x="128" y="186" font-family="{FONTE}" font-weight="900" font-size="{tamanho(cod, 30, 70)}" fill="{c3}" text-anchor="middle">{esc(cod)}</text>'
    )

def regional(cod, cima, baixo, c1, c2, c3):
    tam = tamanho(cod, 84, 130)
    return (
      f'<circle cx="128" cy="128" r="120" fill="{c1}"/>'
      f'<circle cx="128" cy="128" r="112" fill="none" stroke="{c3}" stroke-width="3"/>'
      f'<circle cx="128" cy="128" r="72" fill="{c2}"/>'
      + arco('a1', 92) + arco('a2', 92, de_cima=False)
      + texto_no_arco('a1', cima, c3, tamanho(cima, 22, 210))
      + f'<g transform="translate(0,8)">' + texto_no_arco('a2', baixo, c3, tamanho(baixo, 15, 230)).replace('<text ', '<text dominant-baseline="hanging" ') + '</g>'
      + f'<text x="128" y="{128 + tam*0.36}" font-family="{FONTE}" font-weight="900" font-size="{tam}" fill="{c3}" text-anchor="middle">{esc(cod)}</text>'
    )

def continental(cod, cima, baixo, c1, c2, c3):
    folhas = ''
    for lado in (-1, 1):
        for i in range(7):
            ang = 200 + i * 20 if lado < 0 else -20 - i * 20
            import math
            a = math.radians(ang)
            x, y = 128 + 96 * math.cos(a), 128 - 96 * math.sin(a)
            folhas += (f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="13" ry="5.5" fill="{c2}" '
                       f'transform="rotate({-ang + 90 * lado:.1f} {x:.1f} {y:.1f})"/>')
    return (
      f'<circle cx="128" cy="128" r="122" fill="{c1}"/>'
      f'<circle cx="128" cy="128" r="114" fill="none" stroke="{c2}" stroke-width="3"/>'
      + folhas
      + f'<path d="M128 46 L141 84 L181 84 L149 108 L161 146 L128 123 L95 146 L107 108 L75 84 L115 84 Z" fill="{c2}"/>'
      + f'<text x="128" y="176" font-family="{FONTE}" font-weight="900" font-size="{tamanho(baixo, 26, 170)}" fill="{c3}" text-anchor="middle" letter-spacing="1">{esc(baixo)}</text>'
      + f'<text x="128" y="200" font-family="{FONTE}" font-weight="900" font-size="15" fill="{c2}" text-anchor="middle" letter-spacing="3">{esc(cima)}</text>'
    )

FORMAS = {'liga': liga, 'copa': copa, 'regional': regional, 'continental': continental}

def main():
    os.makedirs(SAIDA, exist_ok=True)
    feitos = 0
    for slug, (forma, cod, cima, baixo, c1, c2, c3) in TABELA.items():
        if slug in REAIS or os.path.exists(os.path.join(SAIDA, slug + '.png')): continue
        corpo = FORMAS[forma](cod, cima, baixo, c1, c2, c3)
        svg = ('<?xml version="1.0" encoding="utf-8"?>\n'
               '<!-- emblema provisório desenhado pelo jogo (ferramentas/emblemas_competicoes.py);'
               ' troque pela logo oficial com o mesmo nome -->\n'
               f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">{corpo}</svg>\n')
        with open(os.path.join(SAIDA, slug + '.svg'), 'w', encoding='utf-8') as f:
            f.write(svg)
        feitos += 1
    print(f'{feitos} emblemas em {os.path.normpath(SAIDA)}')

if __name__ == '__main__':
    main()
