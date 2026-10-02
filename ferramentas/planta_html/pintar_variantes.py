"""
As três variantes de cor da folha das torres, pros clones da proposta
(ferramentas/planta_html). É o pintor da folha `torres` rodando de novo
com outra paleta: as mesmas células no mesmo lugar (o atlas é o mesmo, a
textura só troca de arquivo), a mesma semente de cada célula (o grão, a
mancha e o escorrido são os mesmos), outra cor de concreto, de vidro, de
moldura e de tijolo, e outros nomes nas placas.

    python3 ferramentas/planta_html/pintar_variantes.py

Escreve ferramentas/planta_html/texturas/torres_v1.jpg, _v2 e _v3. A
folha do jogo (img/texturas/modelos/torres.jpg) e o atlas não mudam.
"""
import json
import os
import re
import shutil
import sys
import tempfile

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..'))
import pintar_modelos as pm  # noqa: E402

SAIDA = os.path.join(AQUI, 'texturas')

# vidro: (base, topo) da pele de vidro, (base, topo) do spandrel na laje;
# guarda: (base, topo, mistura) do guarda-corpo da sacada
VARIANTES = [
    dict(arquivo='torres_v1.jpg',
         t1='EDIFÍCIO HORIZONTE', t2='RESIDENCIAL PORTO BELO',
         concreto='#c4b79d',
         vidro=(('#1e4a3b', '#8fbea6'), ('#183a2f', '#4a7a64')),
         branco='#f1eee4',
         tijolo=['#8e3b2f', '#7f3329', '#9a4435', '#86372c', '#94402f', '#7a3026'],
         guarda=('#2f5c4b', '#a4cab6', '#6c9d86')),
    dict(arquivo='torres_v2.jpg',
         t1='EDIFÍCIO ATLÂNTICO', t2='RESIDENCIAL MONTE VERDE',
         concreto='#d6d4cc',
         vidro=(('#0f1824', '#4f6377'), ('#0c131c', '#33455a')),
         branco='#dfe1df',
         tijolo=['#6f7275', '#66696c', '#7a7d80', '#5f6265', '#737679', '#6a6d70'],
         guarda=('#2c3842', '#91a2af', '#5b6b77')),
    dict(arquivo='torres_v3.jpg',
         t1='EDIFÍCIO SOLAR', t2='RESIDENCIAL IPÊ AMARELO',
         concreto='#b98f79',
         vidro=(('#3a2c20', '#b59c7d'), ('#2e2319', '#6e5a46')),
         branco='#efe3c6',
         tijolo=['#c9973a', '#bd8b33', '#d3a245', '#b8862f', '#cc9b40', '#c29035'],
         guarda=('#487790', '#b6d3e1', '#7eafc7')),
]


def cortina(cores):
    (vb, vt), (sb, st) = cores

    def f(w, h, ppm, rnd, peitoril=0.9, montantes=(0.5,)):
        # a mesma pele de vidro do pintor, com o vidro da variante
        Y = pm.em(h, ppm)
        a = pm.vidro(w, h, rnd, base=vb, topo=vt, reflexo=0.22)
        a = pm.multiplicar(a, 1 + 0.05 * pm.fbm(h, w, 0.8 * ppm, rnd, 2, False))
        sp = pm.vidro(w, int(peitoril * ppm), rnd, base=sb, topo=st, reflexo=0.08)
        pm.colar(a, sp, 0, Y(peitoril))
        esp = max(2, int(0.045 * ppm))
        al = '#586572'
        pm.retangulo(a, 0, 0, w, esp, al)
        pm.retangulo(a, 0, h - esp, w, h, al)
        pm.retangulo(a, 0, Y(peitoril) - esp / 2, w, Y(peitoril) + esp / 2, al)
        pm.retangulo(a, 0, 0, esp, h, al)
        pm.retangulo(a, w - esp, 0, w, h, al)
        for fx in montantes:
            pm.retangulo(a, w * fx - esp / 2, 0, w * fx + esp / 2, Y(peitoril), al)
        return np.clip(a, 0, 1)
    return f


def guarda(cores):
    base, topo, mistura = cores

    def f(w, h, ppm, rnd):
        Y = pm.em(h, ppm)
        a = pm.vidro(w, h, rnd, base=base, topo=topo, reflexo=0.28)
        a = a * 0.85 + pm.cor(mistura)[None, None, :] * 0.15
        esp = max(3, int(0.05 * ppm))
        pm.retangulo(a, 0, 0, w, esp * 1.6, '#f3f3ef')
        for fx in (0.0, 0.5, 1.0):
            x = min(w - esp, max(0, w * fx - esp / 2))
            pm.retangulo(a, x, 0, x + esp, h, '#e9e9e4')
        pm.retangulo(a, 0, Y(0.06), w, h, '#dcdcd6')
        return np.clip(a, 0, 1)
    return f


def atlas_do_jogo():
    with open(os.path.join(pm.RAIZ, 'js', 'diajogo', 'modelos_atlas.js'), encoding='utf-8') as f:
        txt = f.read()
    corpo = re.search(r'export const ATLAS = (\{.*\});\s*$', txt, re.S).group(1)
    return json.loads(corpo)


def main():
    os.makedirs(SAIDA, exist_ok=True)
    esperado = atlas_do_jogo()['torres']
    guardados = {n: getattr(pm, n) for n in
                 ('CONCRETO_T1', 'BRANCO_T2', 'TIJOLO_T2', 'cortina_azul', 'p_t2_guarda', 'placa_letras', 'SAIDA')}
    placa = guardados['placa_letras']
    try:
        for v in VARIANTES:
            nomes = {'EDIFÍCIO MIRANTE': v['t1'], 'RESIDENCIAL BELA VISTA': v['t2']}
            pm.CONCRETO_T1 = v['concreto']
            pm.BRANCO_T2 = v['branco']
            pm.TIJOLO_T2 = v['tijolo']
            pm.cortina_azul = cortina(v['vidro'])
            pm.p_t2_guarda = guarda(v['guarda'])
            pm.placa_letras = lambda texto, *a, **k: placa(nomes.get(texto, texto), *a, **k)
            tmp = tempfile.mkdtemp()
            pm.SAIDA = tmp
            lay = pm.folha_torres()
            # a variante só serve se as células caíram no mesmo lugar
            if lay['cel'] != esperado['cel'] or (lay['larg'], lay['alt']) != (esperado['larg'], esperado['alt']):
                sys.exit(f'{v["arquivo"]}: o atlas saiu diferente do da folha do jogo')
            shutil.move(os.path.join(tmp, 'torres.jpg'), os.path.join(SAIDA, v['arquivo']))
            shutil.rmtree(tmp, ignore_errors=True)
            print('  ->', os.path.relpath(os.path.join(SAIDA, v['arquivo']), pm.RAIZ))
    finally:
        for n, val in guardados.items():
            setattr(pm, n, val)


if __name__ == '__main__':
    main()
