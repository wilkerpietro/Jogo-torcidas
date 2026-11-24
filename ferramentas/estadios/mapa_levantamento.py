#!/usr/bin/env python3
"""O MAPA DE LEVANTAMENTO DOS ARREDORES DE UM ESTÁDIO (dono, 17/11/2026: "inicie a ver
o mapa dos estádios que tem arredores personalizados").

Desenha, em SVG, o que o `osm_arredores.py` gravou: as ruas com o nome, os
prédios, as praças, os trilhos, o campo no meio, a grade de 100 em 100 m, o
anel tracejado a 200 m do meio do campo e a seta do norte. É a folha em que o
dono marca o limite da cena, de onde vem cada torcida e os portões, antes de a
ficha ganhar o `arredores`. Qualquer navegador abre o SVG.

Uso:  python3 ferramentas/estadios/mapa_levantamento.py <arquivo.osm.mjs> "<nome do estádio>" <saida.svg>
Os dados são do OpenStreetMap (© colaboradores do OpenStreetMap, licença ODbL).
"""
import json, math, sys
from html import escape
entrada, nome, saida = sys.argv[1], sys.argv[2], sys.argv[3]
t = open(entrada, encoding='utf-8').read(); d = json.loads(t[t.index('export default ') + 15:].rstrip().rstrip(';'))
MU, MV = d['meia']; K = 2.0; W, H = int(2 * MU * K), int(2 * MV * K)
P = lambda p: (W / 2 + p[0] * K, H / 2 - p[1] * K)
pts = lambda ps: ' '.join('%.1f,%.1f' % P(p) for p in ps)
o = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d" font-family="DejaVu Sans, Arial, sans-serif">' % (W, H, W, H), '<rect width="100%" height="100%" fill="#efe9dc"/>']
COR = {'leisure=park': '#cfe3bd', 'leisure=garden': '#cfe3bd', 'landuse=grass': '#d6e6c6', 'natural=wood': '#b9d6a6', 'natural=scrub': '#c9dcb6', 'landuse=forest': '#b9d6a6',
       'amenity=parking': '#dcdcdc', 'natural=water': '#a9cfe6', 'leisure=pitch': '#bfe0b0', 'leisure=stadium': '#f3dcb6', 'leisure=sports_centre': '#f0e2c4', 'landuse=cemetery': '#d6dccb',
       'amenity=school': '#efe0cf', 'amenity=university': '#efe0cf', 'landuse=railway': '#dcd6d6', 'leisure=swimming_pool': '#a9cfe6'}
for a in d['areas']:
    c = COR.get(a['tipo'])
    if c and len(a['pts']) > 3 and a['pts'][0] == a['pts'][-1]: o.append('<polygon points="%s" fill="%s"/>' % (pts(a['pts']), c))
for a in d['areas']:
    if a['tipo'] == 'leisure=stadium' and len(a['pts']) > 1: o.append('<polyline points="%s" fill="none" stroke="#b8742c" stroke-width="3"/>' % pts(a['pts']))
    elif a['tipo'] in ('barrier=wall', 'barrier=fence') and len(a['pts']) > 1: o.append('<polyline points="%s" fill="none" stroke="#9a8f84" stroke-width="1"/>' % pts(a['pts']))
for b in d['predios']:
    if len(b['pts']) > 2: o.append('<polygon points="%s" fill="#d9cdc0" stroke="#b9aca0" stroke-width="0.7"/>' % pts(b['pts']))
ruas = sorted(d['ruas'], key=lambda r: r['larg']); PEAO = ('footway', 'steps', 'path', 'pedestrian')
for r in ruas:
    if r['tipo'] not in PEAO: o.append('<polyline points="%s" fill="none" stroke="%s" stroke-width="%d" stroke-linejoin="round" stroke-linecap="round"/>' % (pts(r['pts']), '#c9c4bd' if r['tunel'] else '#8f8a84', max(2, int(r['larg'] * K)) + 3))
for r in ruas:
    peao = r['tipo'] in PEAO; cor = '#f6d9a8' if r['ponte'] else '#e3d6bb' if peao else '#fbf0b8' if r['tipo'] in ('trunk', 'primary', 'secondary') else '#ffffff'
    o.append('<polyline points="%s" fill="none" stroke="%s" stroke-width="%d" stroke-linejoin="round" stroke-linecap="round"%s/>' % (pts(r['pts']), cor, 2 if peao else max(2, int(r['larg'] * K)), ' stroke-dasharray="5 4"' if peao else ''))
for tr in d['trilhos']: o.append('<polyline points="%s" fill="none" stroke="#55504a" stroke-width="3" stroke-dasharray="10 5"/>' % pts(tr['pts']))
a, b = P((-52.5, 34)), P((52.5, -34))
o.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#6fb26a" stroke="#fff" stroke-width="2"/><line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#fff"/>' % (a[0], a[1], b[0] - a[0], b[1] - a[1], W / 2, a[1], W / 2, b[1]))
for k in range(-int(MU // 100) * 100, int(MU) + 1, 100):
    x = P((k, 0))[0]; o.append('<line x1="%.1f" y1="0" x2="%.1f" y2="%d" stroke="#bfb5a3" stroke-width="1"/><text x="%.1f" y="14" font-size="12" fill="#7a7266">%d</text>' % (x, x, H, x + 3, k))
for k in range(-int(MV // 100) * 100, int(MV) + 1, 100):
    y = P((0, k))[1]; o.append('<line x1="0" y1="%.1f" x2="%d" y2="%.1f" stroke="#bfb5a3" stroke-width="1"/><text x="3" y="%.1f" font-size="12" fill="#7a7266">%d</text>' % (y, W, y, y + 14, k))
o.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="none" stroke="#c0392b" stroke-width="2" stroke-dasharray="8 6"/>' % (W / 2, H / 2, 200 * K))
melhor = {}
for r in d['ruas']:
    if not r['nome'] or r['tipo'] in ('footway', 'steps', 'path'): continue
    for p, q in zip(r['pts'], r['pts'][1:]):
        if not (abs(p[0]) < MU - 10 and abs(p[1]) < MV - 10 and abs(q[0]) < MU - 10 and abs(q[1]) < MV - 10): continue
        L = math.hypot(q[0] - p[0], q[1] - p[1])
        if L > melhor.get(r['nome'], (0,))[0]: melhor[r['nome']] = (L, p, q)
for nm, (L, p, q) in sorted(melhor.items(), key=lambda x: -x[1][0]):
    if L < 12: continue
    ang = -math.degrees(math.atan2(q[1] - p[1], q[0] - p[0]))
    if ang > 90: ang -= 180
    if ang < -90: ang += 180
    m = P(((p[0] + q[0]) / 2, (p[1] + q[1]) / 2))
    o.append('<text transform="translate(%.1f %.1f) rotate(%.1f)" text-anchor="middle" dy="4" font-size="13" fill="#2b2620" stroke="#fff" stroke-width="3" paint-order="stroke">%s</text>' % (m[0], m[1], ang, escape(nm)))
for b in d['predios'] + [a for a in d['areas'] if a['tipo'].split('=')[0] in ('leisure', 'amenity')]:
    if b['nome'] and len(b['pts']) > 2:
        xs = [p[0] for p in b['pts']]; ys = [p[1] for p in b['pts']]
        if (max(xs) - min(xs)) * (max(ys) - min(ys)) > 900 and abs(sum(xs) / len(xs)) < MU - 20 and abs(sum(ys) / len(ys)) < MV - 20:
            m = P((sum(xs) / len(xs), sum(ys) / len(ys))); o.append('<text x="%.1f" y="%.1f" text-anchor="middle" font-size="11" fill="#6b4f2c" stroke="#f6efe2" stroke-width="3" paint-order="stroke">%s</text>' % (m[0], m[1], escape(b['nome'][:34])))
N = d['norte']; nx, ny = math.cos(math.radians(N)), math.sin(math.radians(N)); cx, cy = W - 70, 80
o.append('<circle cx="%d" cy="%d" r="44" fill="#fff" stroke="#55504a" stroke-width="2"/><line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#c0392b" stroke-width="4"/><text x="%.1f" y="%.1f" text-anchor="middle" dy="6" font-size="18" font-weight="bold" fill="#c0392b" stroke="#fff" stroke-width="3" paint-order="stroke">N</text>' % (cx, cy, cx - nx * 30, cy + ny * 30, cx + nx * 30, cy - ny * 30, cx + nx * 36, cy - ny * 36))
o.append('<rect x="0" y="%d" width="%d" height="34" fill="#2b2620"/><text x="10" y="%d" font-size="15" fill="#f6efe2">%s — levantamento dos arredores · grade de 100 m · anel tracejado a 200 m do meio do campo · rumo do campo %.1f° · © colaboradores do OpenStreetMap</text>' % (H - 34, W, H - 11, escape(nome), N))
o.append('<rect x="8" y="8" width="%d" height="44" fill="#2b2620"/><text x="16" y="40" font-size="30" font-weight="bold" fill="#f6efe2">%s</text>' % (len(nome) * 20 + 24, escape(nome)))
o.append('</svg>'); open(saida, 'w', encoding='utf-8').write('\n'.join(o)); print(saida, W, H, len(melhor), 'ruas com nome')
