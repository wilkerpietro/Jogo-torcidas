#!/usr/bin/env python3
"""SEM BAIRRO DENTRO DE BAIRRO (pedido do dono, 02/10/2026: "Acabe de vez
com esses enclaves do bairro dentro de outro, eles sempre tem que ter
uniformidade territorial")

A divisão dos bairros vem da planta do jogo 3D (dados/plantas.js, assada
por ferramentas/assar_plantas.js). Lá, a quadra da sede ou do bar de uma
torcida fica no bairro que os dados dizem, mesmo cercada por outro — e o
mapa mostrava uma quadra de Monte Castelo no meio de Pirambu.

Aqui, em cada praça:
  · cada bairro é dividido em pedaços contíguos (vizinhança de 4);
  · o maior pedaço é o bairro; todo outro pedaço que encosta em outro
    bairro sai dele — tanto a quadra no meio de outro bairro quanto o
    bloco do estádio do outro lado do mato (sem exceção: território de
    bairro é um pedaço só);
  · o pedaço passa pro bairro com quem tem mais divisa, e a conta roda
    de novo até não sobrar nenhum;
  · a ilha que não encosta em bairro nenhum (o bloco do estádio cercado
    de mato) vai pro bairro mais perto dela pelo vazio — e só fica com o
    dela quando o pedaço principal do dela é o vizinho mais perto;
  · o nome do bairro fica dentro do pedaço dele (o centro que caiu fora
    vai pra célula mais perto do pedaço);
  · a sede que estava num enclave continua no bairro dela nos dados: o
    ponto dela no mapa vai pra célula mais perto do pedaço principal.

Uso: python3 ferramentas/plantas_sem_enclaves.py   (reescreve dados/plantas.js)
"""
import json, os
from collections import deque, Counter

ARQ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dados', 'plantas.js')
MARCA = 'TO.dados.plantas = '


def decodificar(g):
    rot = []
    for l in g['l']:
        row = []
        for i in range(0, len(l), 2):
            row += [l[i]] * l[i + 1]
        rot.append(row)
    return rot


def codificar(rot):
    out = []
    for row in rot:
        l, i = [], 0
        while i < len(row):
            e = i + 1
            while e < len(row) and row[e] == row[i]:
                e += 1
            l += [row[i], e - i]
            i = e
        out.append(l)
    return out


def pedacos(rot, nx, ny):
    vis = [[False] * nx for _ in range(ny)]
    comps = {}
    for j in range(ny):
        for i in range(nx):
            k = rot[j][i]
            if k < 0 or vis[j][i]:
                continue
            q = deque([(i, j)]); vis[j][i] = True; cel = []
            while q:
                x, y = q.popleft(); cel.append((x, y))
                for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= a < nx and 0 <= b < ny and not vis[b][a] and rot[b][a] == k:
                        vis[b][a] = True; q.append((a, b))
            comps.setdefault(k, []).append(cel)
    for cs in comps.values():
        cs.sort(key=len, reverse=True)
    return comps


def vizinho_pelo_vazio(rot, nx, ny, ilha):
    """O bairro mais perto da ilha andando pelo vazio (empate: o que
    aparece em mais células na mesma distância)."""
    vis = set(ilha); fr = list(ilha)
    while fr:
        achou = Counter(); prox = []
        for x, y in fr:
            for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if not (0 <= a < nx and 0 <= b < ny) or (a, b) in vis:
                    continue
                vis.add((a, b))
                if rot[b][a] >= 0:
                    achou[rot[b][a]] += 1
                else:
                    prox.append((a, b))
        if achou:
            return max(achou, key=lambda v: achou[v])
        fr = prox
    return None


def limpar(p):
    g = p['g']; nx, ny = g['nx'], g['ny']
    rot = decodificar(g)
    original = [row[:] for row in rot]
    # o pedaço principal de cada bairro é o maior que encosta na cidade
    # (em outro bairro): a ilha do estádio no mato nunca é o bairro, nem
    # quando é maior que o bloco dele (senão o bloco de verdade é que
    # sobra solto e é engolido — e rodar duas vezes daria outro mapa)
    def encosta(k, c):
        for x, y in c:
            for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= a < nx and 0 <= b < ny and rot[b][a] >= 0 and rot[b][a] != k:
                    return True
        return False

    def pedacos_ancorados():
        comps = pedacos(rot, nx, ny)
        for k, cs in comps.items():
            cs.sort(key=lambda c: (not encosta(k, c), -len(c)))
        return comps

    mudou_total = 0
    for _ in range(8):
        comps = pedacos_ancorados()
        mudou = 0
        for k, cs in comps.items():
            for c in cs[1:]:
                s = set(c); viz = Counter()
                for x, y in c:
                    for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                        if (a, b) in s:
                            continue
                        v = rot[b][a] if 0 <= a < nx and 0 <= b < ny else -1
                        viz[v] += 1
                outros = {v: n for v, n in viz.items() if v >= 0 and v != k}
                if outros:
                    novo = max(outros, key=lambda v: outros[v])
                else:
                    novo = vizinho_pelo_vazio(rot, nx, ny, s)
                    if novo is None or novo == k:
                        continue      # o vizinho mais perto é o próprio bairro
                for x, y in c:
                    rot[y][x] = novo
                mudou += len(c)
        mudou_total += mudou
        if not mudou:
            break
    comps = pedacos_ancorados()
    cel_mundo = lambda i, j: [round(g['x0'] + (i + 0.5) * g['cel']), round(g['y0'] + (j + 0.5) * g['cel'])]
    para_cel = lambda x, y: (int((x - g['x0']) // g['cel']), int((y - g['y0']) // g['cel']))

    def mais_perto(k, x, y):
        cs = comps.get(k)
        if not cs:
            return None
        i0, j0 = para_cel(x, y)
        a = min(cs[0], key=lambda c: (c[0] - i0) ** 2 + (c[1] - j0) ** 2)
        return cel_mundo(*a)

    # o nome do bairro dentro do pedaço principal dele
    for k, b in enumerate(p['b']):
        if b[3] is None or k not in comps:
            continue
        i, j = para_cel(b[3], b[4])
        if not (0 <= i < nx and 0 <= j < ny and rot[j][i] == k and (i, j) in set(comps[k][0])):
            cs = comps[k][0]
            cx = sum(c[0] for c in cs) / len(cs); cy = sum(c[1] for c in cs) / len(cs)
            a = min(cs, key=lambda c: (c[0] - cx) ** 2 + (c[1] - cy) ** 2)
            b[3], b[4] = cel_mundo(*a)
    # a sede que estava num enclave: no pedaço principal do bairro dela
    for s in p['s']:
        i, j = para_cel(s[2], s[3])
        if not (0 <= i < nx and 0 <= j < ny):
            continue
        k = original[j][i]
        if k >= 0 and rot[j][i] != k:
            novo = mais_perto(k, s[2], s[3])
            if novo:
                s[2], s[3] = novo
    g['l'] = codificar(rot)
    return mudou_total


def main():
    t = open(ARQ, encoding='utf-8').read()
    i = t.index(MARCA)
    cab, dados = t[:i], json.loads(t[i + len(MARCA):].rstrip().rstrip(';'))
    for cid, p in dados.items():
        n = limpar(p)
        if n:
            print(f'{cid}: {n} células de pedaço solto passadas pro bairro vizinho')
    open(ARQ, 'w', encoding='utf-8').write(cab + MARCA + json.dumps(dados, ensure_ascii=False, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    main()
