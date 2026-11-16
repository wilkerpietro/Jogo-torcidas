#!/usr/bin/env python3
"""AS RUAS DE VERDADE EM VOLTA DE UM ESTÁDIO (dono, 16/11/2026: "Pode ser ruas
do openstreetmap, quarteirões preenchidos com casas genéricas [...] e os
prédios, torres, ginásios, clubes e viadutos feitos à mão").

Baixa o OpenStreetMap em volta do estádio e grava, no QUADRO DA FICHA (metros,
`u` ao longo do campo, `v` pra cima da imagem, a mesma conta do `norte` dela),
as ruas, os trilhos, os contornos de prédio que existirem e as áreas (praça,
mata, estacionamento, campo). O que sai é
`ferramentas/estadios/arredores/<id>.osm.mjs`; quem desenha é o gerador.

Uso:  python3 ferramentas/estadios/osm_arredores.py <id> <lat> <lon> <norte> [meia_largura_m] [meia_altura_m]
      (lat, lon: o meio do campo; norte: o `norte` da ficha)
Os dados são do OpenStreetMap (© colaboradores do OpenStreetMap, licença ODbL):
o crédito vai na tela de créditos do jogo.
"""
import json, math, subprocess, sys, xml.etree.ElementTree as ET
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
ident, lat0, lon0, norte = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
MU = float(sys.argv[5]) if len(sys.argv) > 5 else 320.0
MV = float(sys.argv[6]) if len(sys.argv) > 6 else 220.0
R = math.hypot(MU, MV) + 40
dlat, dlon = R / 111320.0, R / (111320.0 * math.cos(math.radians(lat0)))
url = f'https://api.openstreetmap.org/api/0.6/map?bbox={lon0 - dlon:.6f},{lat0 - dlat:.6f},{lon0 + dlon:.6f},{lat0 + dlat:.6f}'
bruto = subprocess.run(['curl', '-sS', '-m', '120', '-A', 'estadios-lowpoly/1.0', url], capture_output=True, check=True).stdout
raiz = ET.fromstring(bruto)
n, s, c = math.radians(norte), math.sin(math.radians(norte)), math.cos(math.radians(norte))
def quadro(lat, lon):
    e = (lon - lon0) * 111320.0 * math.cos(math.radians(lat0)); nn = (lat - lat0) * 111320.0
    return [round(e * s + nn * c, 1), round(-e * c + nn * s, 1)]
nos = {x.get('id'): quadro(float(x.get('lat')), float(x.get('lon'))) for x in raiz.findall('node')}
dentro = lambda p: abs(p[0]) <= MU + 30 and abs(p[1]) <= MV + 30
# a largura do leito de cada tipo de via, em metros (sem as calçadas)
LARG = {'trunk': 16, 'primary': 14, 'secondary': 12, 'secondary_link': 8, 'tertiary': 10, 'tertiary_link': 7, 'residential': 8, 'living_street': 7,
        'unclassified': 8, 'service': 5, 'pedestrian': 6, 'footway': 2.5, 'steps': 2.5, 'path': 2}
ruas, trilhos, predios, areas = [], [], [], []
for w in raiz.findall('way'):
    tg = {x.get('k'): x.get('v') for x in w.findall('tag')}
    pts = [nos[x.get('ref')] for x in w.findall('nd') if x.get('ref') in nos]
    if len(pts) < 2 or not any(dentro(p) for p in pts): continue
    if tg.get('highway') in LARG:
        larg = LARG[tg['highway']]
        if tg.get('lanes', '').isdigit() and tg['highway'] not in ('footway', 'steps', 'path'): larg = max(larg, int(tg['lanes']) * 3.3)
        ruas.append({'nome': tg.get('name', ''), 'tipo': tg['highway'], 'larg': larg, 'mao': tg.get('oneway') == 'yes', 'ponte': tg.get('bridge') == 'yes' or tg.get('bridge') == 'viaduct',
                     'tunel': tg.get('tunnel') == 'yes', 'pts': pts})
    elif tg.get('railway') in ('rail', 'subway', 'light_rail'):
        trilhos.append({'nome': tg.get('name', ''), 'tipo': tg['railway'], 'ponte': tg.get('bridge') == 'yes', 'pts': pts})
    elif 'building' in tg:
        predios.append({'nome': tg.get('name', ''), 'tipo': tg['building'], 'andares': tg.get('building:levels', ''), 'altura': tg.get('height', ''), 'pts': pts})
    else:
        for k in ('leisure', 'landuse', 'natural', 'amenity', 'barrier', 'railway'):
            if k in tg: areas.append({'nome': tg.get('name', ''), 'tipo': k + '=' + tg[k], 'pts': pts}); break
saida = {'fonte': 'OpenStreetMap (© colaboradores do OpenStreetMap, ODbL)', 'centro': [lat0, lon0], 'norte': norte, 'meia': [MU, MV], 'ruas': ruas, 'trilhos': trilhos, 'predios': predios, 'areas': areas}
arq = RAIZ / 'ferramentas' / 'estadios' / 'arredores' / (ident + '.osm.mjs')
arq.write_text('/* GERADO por ferramentas/estadios/osm_arredores.py — não editar à mão.\n   As ruas de verdade em volta do estádio, no quadro da ficha (metros). Dados do OpenStreetMap\n   (© colaboradores do OpenStreetMap, licença ODbL). */\nexport default ' + json.dumps(saida, ensure_ascii=False, separators=(',', ':')).replace('},{', '},\n{') + ';\n', encoding='utf-8')
print(arq.name, '| ruas:', len(ruas), '| trilhos:', len(trilhos), '| prédios:', len(predios), '| áreas:', len(areas), '|', round(arq.stat().st_size / 1024), 'KB')
