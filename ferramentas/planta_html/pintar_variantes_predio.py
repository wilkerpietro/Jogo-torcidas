"""
As três variantes de cor da folha do prédio alto (a torre do centro),
pras torres que a planta põe nos bairros nobres (ferramentas/planta_html,
`torresDaPraca`, 01/10/2026: "os prédios ficam somente em bairros de
classe alta"). A folha é a mesma (o atlas é o mesmo, a textura só troca
de arquivo): o embasamento vermelho e o painel ocre das empenas mudam de
cor — o vidro, o concreto, a pilastra branca e o caixilho preto ficam.

    python3 ferramentas/planta_html/pintar_variantes_predio.py

Lê img/texturas/modelos/predio.jpg e escreve
ferramentas/planta_html/texturas/predio_v1.jpg, _v2 e _v3.
"""
import json
import os
import re

import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..'))
SAIDA = os.path.join(AQUI, 'texturas')

# (matiz em graus ou None pra cinza, saturação, fator do brilho) do
# embasamento (as células 'vermelho' e 'vermelho_cego') e do painel ocre
VARIANTES = [
    dict(arquivo='predio_v1.jpg', embasamento=(212, 0.42, 0.95), ocre=(None, 0.05, 1.18)),   # azul-marinho e cinza claro
    dict(arquivo='predio_v2.jpg', embasamento=(152, 0.34, 0.92), ocre=(16, 0.55, 0.95)),    # verde e terracota
    dict(arquivo='predio_v3.jpg', embasamento=(None, 0.04, 0.62), ocre=(44, 0.50, 1.05)),   # grafite e areia
]


def atlas_do_predio():
    with open(os.path.join(RAIZ, 'js', 'diajogo', 'modelos_atlas.js'), encoding='utf-8') as f:
        txt = f.read()
    corpo = re.search(r'export const ATLAS = (\{.*\});\s*$', txt, re.S).group(1)
    return json.loads(corpo)['predio']


def caixa(cel, larg, alt, sangria=10):
    # u0, v0, u1, v1 (v de baixo pra cima) → x0, y0, x1, y1 na imagem, com
    # a sangria da célula (a borda repetida que o mipmap lê de longe)
    u0, v0, u1, v1 = cel[:4]
    return (max(0, int(round(u0 * larg)) - sangria), max(0, int(round((1 - v1) * alt)) - sangria),
            min(larg, int(round(u1 * larg)) + sangria), min(alt, int(round((1 - v0) * alt)) + sangria))


def recolorir(hsv, mascara, cor):
    matiz, sat, brilho = cor
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    if matiz is None:
        s[mascara] = np.clip(sat * 255, 0, 255)
    else:
        h[mascara] = matiz / 360 * 255
        s[mascara] = np.clip(s[mascara] * 0 + sat * 255, 0, 255)
    v[mascara] = np.clip(v[mascara] * brilho, 0, 255)


def main():
    os.makedirs(SAIDA, exist_ok=True)
    A = atlas_do_predio()
    base = Image.open(os.path.join(RAIZ, A['arquivo']) if 'arquivo' in A else os.path.join(RAIZ, 'img/texturas/modelos/predio.jpg')).convert('RGB')
    larg, alt = base.size
    for var in VARIANTES:
        hsv = np.array(base.convert('HSV')).astype(np.float32)
        for nome, cor, quente in (('vermelho', var['embasamento'], 'vermelho'), ('vermelho_cego', var['embasamento'], 'vermelho'),
                                  ('ocre', var['ocre'], 'ocre')):
            x0, y0, x1, y1 = caixa(A['cel'][nome], larg, alt)
            bloco = hsv[y0:y1, x0:x1]
            h, s = bloco[..., 0], bloco[..., 1]
            if quente == 'vermelho':
                m = ((h < 18) | (h > 235)) & (s > 22)
            else:
                m = (h > 8) & (h < 48) & (s > 18)
            recolorir(bloco, m, cor)
            hsv[y0:y1, x0:x1] = bloco
        img = Image.fromarray(hsv.clip(0, 255).astype(np.uint8), 'HSV').convert('RGB')
        destino = os.path.join(SAIDA, var['arquivo'])
        img.save(destino, quality=88)
        print('  ->', os.path.relpath(destino, RAIZ))


if __name__ == '__main__':
    main()
