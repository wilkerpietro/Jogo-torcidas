#!/usr/bin/env python3
"""
Desenha a prova da máscara que vale de verdade numa cena sobre foto.

O importador ja escreve `_ref_mascara_<cena>.png` com o que ele mesmo
recortou. Isto aqui e pra depois: quando alguem abre a cena no editor
(F2), pinta a malha na mao e cola o resultado em
`dados/cenas_editadas.js`, o que vale passa a ser a mistura dos dois.
Esta ferramenta le a mistura na mesma ordem que o jogo le e devolve
`_ref_mascara_<cena>_editada.png`.

Claro = chao de andar. Escuro = parede. Telhado claro na prova e disco
atravessando muro dentro do jogo.

    python3 ferramentas/prova_mascara.py           # toda cena editada
    python3 ferramentas/prova_mascara.py rua       # so uma
"""
import json, pathlib, re, sys
import numpy as np
from PIL import Image

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CENAS = RAIZ / 'img' / 'cenas'
CEL = 8


def bloco_js(caminho, chave):
    """Le o objeto JS de um dos dois arquivos de dados. Nao e JSON: o
    arquivo da mao tem comentario, aspas simples e string quebrada em
    pedacos somados. Da pra limpar com regex porque a forma e fixa."""
    txt = caminho.read_text(encoding='utf-8')
    txt = txt[txt.index(chave) + len(chave):]
    txt = txt[txt.index('{'):]
    txt = re.sub(r'/\*.*?\*/', '', txt, flags=re.S)      # comentario
    txt = re.sub(r"'\s*\+\s*\n\s*'", '', txt)            # string somada
    txt = re.sub(r"'([^'\\]*)'", r'"\1"', txt)           # aspa simples
    txt = re.sub(r'(\w+)\s*:', r'"\1":', txt)            # chave sem aspa
    txt = re.sub(r'""(\w[\w-]*)""\s*:', r'"\1":', txt)   # ...que ja tinha
    txt = re.sub(r',(\s*[}\]])', r'\1', txt)             # virgula sobrando
    fim, nivel = 0, 0
    for i, c in enumerate(txt):
        if c == '{': nivel += 1
        elif c == '}':
            nivel -= 1
            if nivel == 0: fim = i + 1; break
    return json.loads(txt[:fim])


def desdobrar(mascara, cols, rows):
    g = np.zeros((rows, cols), np.uint8)
    for r, linha in enumerate(mascara.split(';')):
        c, v = 0, 0
        for n in linha.split(','):
            n = int(n)
            if v: g[r, c:c + n] = 1
            c += n
            v ^= 1
    return g


def main():
    foto = bloco_js(RAIZ / 'dados' / 'cenas_foto.js', 'TO.dados.cenasFoto =')
    arq_mao = RAIZ / 'dados' / 'cenas_editadas.js'
    mao = bloco_js(arq_mao, 'TO.dados.cenasEditadas =') if arq_mao.exists() else {}

    pedidos = sys.argv[1:] or sorted(mao)
    if not pedidos:
        print('nenhuma cena editada a mao — nada a provar'); return

    for id_cena in pedidos:
        f = foto.get(id_cena)
        if not f:
            print(f'  {id_cena}: nao e cena sobre foto, pulei'); continue
        mascara = (mao.get(id_cena) or {}).get('mascara') or f['mascara']
        img = Image.open(RAIZ / f['imagem']).convert('RGB')
        cols, rows = img.width // CEL, img.height // CEL
        cel = desdobrar(mascara, cols, rows)

        prova = np.asarray(img).copy()
        grande = np.kron(cel, np.ones((CEL, CEL), np.uint8)).astype(bool)
        prova[~grande] = (prova[~grande] * 0.42).astype(np.uint8)
        destino = CENAS / f'_ref_mascara_{id_cena}_editada.png'
        Image.fromarray(prova).save(destino)

        andavel = 100 * cel.mean()
        antes = 100 * desdobrar(f['mascara'], cols, rows).mean()
        print(f'  {id_cena}: chao {andavel:.1f}% (o importador dava {antes:.1f}%)'
              f' -> {destino.relative_to(RAIZ)}')


if __name__ == '__main__':
    main()
