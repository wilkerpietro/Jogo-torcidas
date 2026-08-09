#!/usr/bin/env python3
"""
Lê a arte do mapa da cidade e gera dados/cidade_mapa.js.

A planta procedural desenhava bairro, quarteirão e lote. Agora a cidade é
uma imagem, e o que o jogo precisa saber dela é:

  · onde dá pra andar — a malha de ruas, tirada dos pixels de asfalto;
  · onde termina um bairro e começa o outro — 16 regiões;
  · em que lote cada sede, bar e estádio cai.

Nada disso é chutado: sai da própria imagem, por cor. O que o desenho
mostra como rua é rua no jogo, e o que ele mostra como telhado é bloqueio.

    python3 ferramentas/importar_mapa_cidade.py
"""
import json, pathlib, sys
import numpy as np
from PIL import Image
import scipy.ndimage as nd

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ARTE = RAIZ / 'img' / 'cenas' / 'ChatGPT Image 9 de ago. de 2026, 17_50_14.png'
WEBP = RAIZ / 'img' / 'cenas' / 'cidade_fortaleza.webp'
SAIDA = RAIZ / 'dados' / 'cidade_mapa.js'

CIDADE = 'fortaleza'
PASSO = 10          # lado da célula da malha, em pixels da arte
SEMENTE = 20260809  # k-means determinístico: a cidade não se remonta


# ---------------------------------------------------------------- segmentação
def segmentar(a):
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    lum = a.mean(2)
    sat = a.max(2) - a.min(2)
    mato = (G >= R) & (G >= B) & (lum < 125)
    agua = (B > R + 22) & (B > G + 4)
    areia = (R > 145) & (G > 120) & (B > 80) & (R > B + 35)
    telha = (R > G + 18) & (R > 95) & (~mato)

    # a cidade é onde o telhado é denso; o resto é mato, praia e rodovia
    densa = nd.uniform_filter(telha.astype(float), 41) > 0.10
    densa = nd.binary_closing(densa, np.ones((25, 25)))
    densa = nd.binary_fill_holes(densa)
    densa = densa & ~areia & ~agua
    densa = nd.binary_opening(densa, np.ones((9, 9)))
    lab, n = nd.label(densa)
    if n:
        densa = lab == 1 + int(np.argmax(nd.sum(densa, lab, range(1, n + 1))))

    rua = (sat < 32) & (lum > 58) & (lum < 175) & (~mato) & (~agua) & (~areia) \
        & (~telha) & densa
    rua = nd.binary_closing(rua, np.ones((5, 5)))
    rua = nd.binary_opening(rua, np.ones((3, 3)))
    return densa, rua, telha


# ------------------------------------------------------------------- a malha
def malha(rua, passo):
    """Uma célula é andável quando a maior parte dela é asfalto. As ruas da
    arte têm 7 a 16 px; o disco do bonde é maior que isso, então ele anda
    pelo eixo da rua e transborda pro telhado — meio disco na rua, que é
    como o bonde ocupa a rua de verdade."""
    H, W = rua.shape
    n = W // passo
    dens = nd.uniform_filter(rua.astype(float), passo)
    gy, gx = np.mgrid[0:n, 0:n]
    py = ((gy + 0.5) * passo).astype(int).clip(0, H - 1)
    px = ((gx + 0.5) * passo).astype(int).clip(0, W - 1)
    andavel = dens[py, px] > 0.42
    # ilha solta é bonde preso: fica só o continente
    lab, k = nd.label(andavel, np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]]))
    if k:
        maior = 1 + int(np.argmax(nd.sum(andavel, lab, range(1, k + 1))))
        soltos = int((andavel & (lab != maior)).sum())
        andavel = lab == maior
    else:
        soltos = 0
    return andavel, soltos


# ----------------------------------------------------------------- 16 bairros
def regioes(cidade, k, semente):
    ys, xs = np.where(cidade)
    pts = np.stack([xs, ys], 1).astype(float)
    rng = np.random.default_rng(semente)
    amostra = pts[rng.choice(len(pts), min(40000, len(pts)), replace=False)]
    cen = [amostra[rng.integers(len(amostra))]]
    for _ in range(k - 1):
        d = np.min(((amostra[:, None, :] - np.array(cen)[None, :, :]) ** 2).sum(2), 1)
        cen.append(amostra[rng.choice(len(amostra), p=d / d.sum())])
    cen = np.array(cen)
    for _ in range(80):
        lab = ((amostra[:, None, :] - cen[None, :, :]) ** 2).sum(2).argmin(1)
        novo = np.array([amostra[lab == i].mean(0) if (lab == i).any() else cen[i]
                         for i in range(k)])
        if np.abs(novo - cen).max() < 0.4:
            cen = novo
            break
        cen = novo
    lab = ((pts[:, None, :] - cen[None, :, :]) ** 2).sum(2).argmin(1)
    reg = np.full(cidade.shape, -1, np.int16)
    reg[ys, xs] = lab
    return reg, cen


def por_zona(cen, centro):
    """Quatro bairros por zona, como a fonte manda.

    Cortar o círculo em quatro arcos de quatro pelo RANKING do ângulo não
    serve: a cidade não é redonda, e o quinto bairro mais ao norte acabava
    rotulado de leste mesmo estando em cima. Aqui cada região tem um custo
    angular pra cada zona, e a distribuição é feita pelo menor custo com
    teto de quatro por zona — quem fica de fora da zona natural vai pra
    vizinha mais barata, que é o único jeito de fechar 4/4/4/4."""
    from scipy.optimize import linear_sum_assignment
    ang = np.degrees(np.arctan2(cen[:, 1] - centro[1], cen[:, 0] - centro[0]))
    # em tela o y cresce pra baixo: -90 é o norte
    zonas = ['Norte', 'Leste', 'Sul', 'Oeste']
    alvo = {'Norte': -90.0, 'Leste': 0.0, 'Sul': 90.0, 'Oeste': 180.0}
    # 16 regiões × 16 vagas (quatro por zona): resolve tudo de uma vez, porque
    # guloso é míope — ele enfiava o bairro do noroeste na zona leste só
    # porque a leste ainda tinha vaga quando chegou a vez dele
    vagas = [z for z in zonas for _ in range(4)]
    custo = np.zeros((len(cen), len(vagas)))
    for i in range(len(cen)):
        for j, z in enumerate(vagas):
            custo[i, j] = abs((ang[i] - alvo[z] + 180) % 360 - 180)
    li, co = linear_sum_assignment(custo)
    return {int(i): vagas[j] for i, j in zip(li, co)}


# ------------------------------------------------------------------ codificação
def rle(mat):
    """corre a matriz em linhas, alternando falso/verdadeiro — mesma ideia da
    máscara da cena dos arredores"""
    linhas = []
    for r in range(mat.shape[0]):
        runs, atual, cont = [], 0, 0
        for v in mat[r].astype(int):
            if v == atual:
                cont += 1
            else:
                runs.append(cont)
                atual = v
                cont = 1
        runs.append(cont)
        linhas.append(','.join(map(str, runs)))
    return ';'.join(linhas)


DIG = '0123456789abcdefg'          # base 36 truncada: cabe 0 e as 16 regiões


def rle_regioes(reg, passo):
    """As regiões descem pra resolução da malha: um caractere por célula, em
    base 36. '0' é fora da cidade, '1'..'g' são os 16 bairros. Uma linha de
    texto por linha da malha — 125 caracteres cada, e o arquivo inteiro fica
    em 15 KB."""
    n = reg.shape[0] // passo
    gy, gx = np.mgrid[0:n, 0:n]
    py = ((gy + 0.5) * passo).astype(int).clip(0, reg.shape[0] - 1)
    px = ((gx + 0.5) * passo).astype(int).clip(0, reg.shape[1] - 1)
    peq = reg[py, px]
    return ';'.join(''.join(DIG[v + 1] if 0 <= v < 16 else '0' for v in linha)
                    for linha in peq)


def main():
    if not ARTE.exists():
        sys.exit(f'arte ausente: {ARTE}')
    im = Image.open(ARTE).convert('RGB')
    a = np.asarray(im).astype(int)
    H, W = a.shape[:2]
    print(f'  arte {W}x{H}')

    cidade, rua, telha = segmentar(a)
    print(f'  cidade {100*cidade.mean():.1f}% da arte · '
          f'rua {100*rua.sum()/cidade.sum():.1f}% da cidade')

    andavel, soltos = malha(rua, PASSO)
    n = andavel.shape[0]
    print(f'  malha {n}x{n} (passo {PASSO}px) · {andavel.sum()} células andáveis · '
          f'{soltos} descartadas por ficarem ilhadas')

    reg, cen = regioes(cidade, 16, SEMENTE)
    ys, xs = np.where(cidade)
    centro = (xs.mean(), ys.mean())
    zona_de = por_zona(cen, centro)

    # os bairros da fonte, agrupados por zona e ordenados do mais nobre ao menos
    txt = (RAIZ / 'dados' / 'cidades.js').read_text(encoding='utf-8')
    cid = [c for c in json.loads(txt[txt.index('['):txt.rindex(']') + 1])
           if c['id'] == CIDADE][0]
    fila = {}
    for b in cid['bairros']:
        fila.setdefault(b['zona'], []).append(b)
    for z in fila:
        fila[z].sort(key=lambda b: -b['mult'])

    # dentro da zona, o mais nobre fica mais perto do centro
    porzona = {}
    for i, z in zona_de.items():
        porzona.setdefault(z, []).append(i)
    saida = []
    for z, idxs in porzona.items():
        idxs.sort(key=lambda i: (cen[i][0] - centro[0]) ** 2 + (cen[i][1] - centro[1]) ** 2)
        for k, i in enumerate(idxs):
            b = fila[z][k] if k < len(fila[z]) else fila[z][-1]
            area = int((reg == i).sum())
            saida.append({
                'i': i, 'nome': b['nome'], 'id': b['id'], 'zona': z,
                'classe': b['classe'], 'mult': b['mult'],
                'x': round(float(cen[i][0]), 1), 'y': round(float(cen[i][1]), 1),
                'area': round(100 * area / int(cidade.sum()), 1)
            })
    saida.sort(key=lambda s: s['i'])

    # renumera pra ordem da fonte, pra leitura ficar previsível
    ordem = {s['i']: k for k, s in enumerate(saida)}
    reg2 = np.full(reg.shape, -1, np.int16)
    for velho, novo in ordem.items():
        reg2[reg == velho] = novo
    for s in saida:
        s['i'] = ordem[s['i']]
    saida.sort(key=lambda s: s['i'])

    WEBP.parent.mkdir(parents=True, exist_ok=True)
    im.save(WEBP, 'WEBP', quality=82, method=6)
    print(f'  {WEBP.name}: {WEBP.stat().st_size // 1024} KB '
          f'(de {ARTE.stat().st_size // 1024} KB)')

    dados = {
        'cidade': CIDADE,
        'imagem': f'img/cenas/{WEBP.name}',
        'largura': W, 'altura': H, 'passo': PASSO,
        'centro': [round(centro[0], 1), round(centro[1], 1)],
        'bairros': [{k: v for k, v in s.items() if k != 'i'} for s in saida],
        'andavel': rle(andavel),
        'regioes': rle_regioes(reg2, PASSO),
    }
    corpo = json.dumps(dados, ensure_ascii=False)
    SAIDA.write_text(
        '/* MAPA DA CIDADE — malha de ruas e 16 bairros tirados da arte\n'
        '   GERADO por ferramentas/importar_mapa_cidade.py — nao editar a mao. */\n'
        'TO.dados.cidadeMapa = ' + corpo + ';\n', encoding='utf-8')
    print(f'\n{SAIDA.relative_to(RAIZ)}  —  {SAIDA.stat().st_size // 1024} KB')
    print('\n  bairro                  zona    classe          área   centro')
    for s in saida:
        print(f"  {s['nome']:<22} {s['zona']:<7} {s['classe']:<14} "
              f"{s['area']:>4.1f}%  ({s['x']:.0f},{s['y']:.0f})")


if __name__ == '__main__':
    main()
