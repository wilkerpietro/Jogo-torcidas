#!/usr/bin/env python3
"""As marcas do dono na prancheta "Marcação dos Arredores" (o artefato; um documento `marcas/<id-da-ficha>` por estádio),
passadas para ferramentas/estadios/marcas_do_dono.mjs, que a bancada lê para montar os arredores de verdade
(arredores_marcas.mjs).

Uso:  python3 ferramentas/estadios/marcas_importar.py <pasta com os <id>.json lidos do banco do artefato>

As marcas ficam no quadro do levantamento (metros a partir do meio do campo; `u` ao longo do campo, pelo `rumo` do
levantamento; `v` pra cima do mapa). O montador gira tudo pro `norte` da ficha quando os dois não batem.
"""
import json, os, sys

pasta = sys.argv[1]
saida = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'marcas_do_dono.mjs')
tudo = {}
for nome in sorted(os.listdir(pasta)):
    if not nome.endswith('.json'):
        continue
    d = json.load(open(os.path.join(pasta, nome), encoding='utf-8'))
    d = d.get('data', d)
    ident = d['estadio']
    pontos = [{'k': p['k'], 'de': p['de'], 'u': p['u'], 'v': p['v'], **({'nota': p['nota']} if p.get('nota') else {})} for p in d.get('pontos', [])]
    tudo[ident] = {'nome': d['nome'], 'rumo': d['rumo'], 'centro': [d['lat'], d['lon']], 'pontos': pontos,
                   'corte': [[c['u'], c['v']] for c in d.get('corte', [])], **({'obs': d['obs']} if d.get('obs') else {})}
with open(saida, 'w', encoding='utf-8') as f:
    f.write('/* GERADO por ferramentas/estadios/marcas_importar.py — não editar à mão.\n'
            '   O que o dono marcou na prancheta "Marcação dos Arredores", estádio por estádio: as chegadas (k: "chegada") e as\n'
            '   entradas (k: "entrada") de cada torcida (de: o clube, ou "visitante"), na ordem em que ele marcou, e os cantos do\n'
            '   corte do mapa. Metros a partir do meio do campo, no quadro do levantamento (u ao longo do campo, pelo `rumo`). */\n')
    f.write('export const MARCAS = {\n')
    f.write(',\n'.join('  %s: %s' % (json.dumps(k), json.dumps(v, ensure_ascii=False)) for k, v in sorted(tudo.items())))
    f.write('\n};\n')
print('ok:', len(tudo), 'estádios ->', saida)
