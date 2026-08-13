#!/usr/bin/env python3
"""
Põe a foto aérea no lugar do desenho, nas cenas de praça e de rua.

A cena de briga roda numa tela fixa de 1536x1024 e a colisão sai de uma
máscara de 8 px por célula (192x128). Este script faz as duas coisas a
partir da foto:

  1. encaixa a imagem na tela sem distorcer nem cortar largura — as fotos
     vêm em 16:9 e a tela é 3:2, então sobra faixa em cima e embaixo, que
     é preenchida com o tom do quintal. Cortar de lado não serve: é
     justamente na borda que ficam as transversais das pontas;
  2. separa o que é chão de andar do que é construção, e escreve a
     máscara no formato que arredores.js já lê.

Cor sozinha não resolve — telhado de laje e asfalto têm cinza parecido.
O que separa é a conectividade: o chão de rua é uma mancha só, ligada às
sementes que a gente sabe onde ficam (o meio da pista, o largo da praça).
Telhado cinza solto no meio de quarteirão não encosta em rua nenhuma.

    python3 ferramentas/importar_cena_foto.py

Saída (um arquivo só, como todo importador daqui):
    dados/cenas_foto.js
    img/cenas/praca.webp
    img/cenas/rua.webp
"""
import base64, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage as nd

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CENAS = RAIZ / 'img' / 'cenas'
LARG, ALT, CEL = 1536, 1024, 8
COLS, ROWS = LARG // CEL, ALT // CEL
QUINTAL = (74, 64, 52)          # o tom da faixa que sobra em cima e embaixo

FONTES = [
    {'id': 'praca', 'arquivo': 'Aerial_view_of_public_square_202608131340.jpeg',
     'saida': 'praca.webp',
     # sementes em fração da tela: o largo no meio e as quatro bocas
     'sementes': [(0.50, 0.50), (0.50, 0.12), (0.50, 0.88),
                  (0.05, 0.50), (0.95, 0.50),
                  (0.20, 0.16), (0.80, 0.16), (0.20, 0.84), (0.80, 0.84)]},
    {'id': 'rua', 'arquivo': 'Aerial_view_of_residential_street_202608131403.jpeg',
     'saida': 'rua.webp',
     # a pista no meio e as duas transversais das pontas
     'sementes': [(0.50, 0.50), (0.20, 0.50), (0.80, 0.50),
                  (0.02, 0.30), (0.02, 0.70), (0.98, 0.30), (0.98, 0.70)],
     # laje de casa é cinza igual calçada e encosta nela: sem um corredor
     # geométrico o telhado inteiro vira chão de andar
     'corredor': True},
]


# ------------------------------------------------------------------ encaixe
def encaixar(img):
    """Largura inteira, sem distorcer. O que falta de altura vira quintal."""
    esc = LARG / img.width
    novo = img.resize((LARG, round(img.height * esc)), Image.LANCZOS)
    tela = Image.new('RGB', (LARG, ALT), QUINTAL)
    topo = (ALT - novo.height) // 2
    tela.paste(novo, (0, topo))
    return tela, topo, novo.height


# --------------------------------------------------------------- corredor
def corredor(asf, calcada=132):
    """A cena de rua é uma pista atravessando a tela e uma transversal em
    cada ponta. Fora disso é quintal e telhado, e telhado de laje tem o
    mesmo cinza da calçada — só a geometria separa os dois."""
    def faixas(perfil, limiar):
        """as corridas contínuas acima do limiar, da maior pra menor"""
        fora, ini = [], None
        for i, v in enumerate(perfil):
            if v >= limiar and ini is None: ini = i
            elif v < limiar and ini is not None:
                fora.append((ini, i)); ini = None
        if ini is not None: fora.append((ini, len(perfil)))
        return sorted(fora, key=lambda f: f[0] - f[1])

    # o limiar tem de ser alto: laje de casa dá 0,3 de cinza e afogaria a
    # pista, que dá 0,8. Medido nas duas fotos antes de fixar o número.
    m = np.zeros(asf.shape, bool)
    linhas = faixas(asf.mean(1), 0.55)
    if linhas:
        r0, r1 = linhas[0]
        m[max(0, r0 - calcada):r1 + calcada, :] = True
    # as duas pontas: a transversal de cada borda, procurada só na borda
    col = asf.mean(0)
    t = int(LARG * 0.18)
    for lado, corte in ((col[:t], 0), (col[LARG - t:], LARG - t)):
        cs = faixas(lado, 0.48)
        if cs:
            c0, c1 = cs[0]
            m[:, max(0, corte + c0 - 40):corte + c1 + 40] = True
    return m


# ------------------------------------------------------- chão de andar
def chao(a, sementes, topo, altura, usarCorredor=False):
    """1 onde dá pra pisar. Cor dá o candidato; conectividade dá a resposta."""
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mx, mn = a.max(2), a.min(2)
    sat, lum = mx - mn, a.mean(2)

    # asfalto, calçada e piso de praça: cinza, de escuro a bem claro.
    # telha (laranja) e mato (verde) saem por saturação e por matiz.
    telha = (R > G + 18) & (R > B + 22)
    mato = (G > R + 8) & (G > B + 8)
    agua = (B > R + 20) & (B > G + 8)
    cinza = (sat < 34) & ~telha & ~mato & ~agua
    cand = cinza & (lum > 42) & (lum < 232)

    # a faixa de quintal, em cima e embaixo, nunca é chão
    cand[:topo, :] = False
    cand[topo + altura:, :] = False

    if usarCorredor:
        asf = cinza & (lum > 45) & (lum < 130)
        asf[:topo, :] = False; asf[topo + altura:, :] = False
        cand &= corredor(asf)

    # fecha junta e remove cisco antes de olhar conectividade
    cand = nd.binary_closing(cand, np.ones((5, 5)))
    cand = nd.binary_opening(cand, np.ones((7, 7)))

    lab, n = nd.label(cand)
    fica = np.zeros(n + 1, bool)
    for fx, fy in sementes:
        x, y = int(fx * LARG), int(fy * ALT)
        # a semente pode cair num pixel de faixa: procura o rótulo em volta
        jan = lab[max(0, y - 18):y + 18, max(0, x - 18):x + 18]
        for k in np.unique(jan):
            if k:
                fica[k] = True
    m = fica[lab]

    # tapa buraco pequeno (carro, bueiro, sombra) e volta a limpar borda
    m = nd.binary_closing(m, np.ones((9, 9)))
    buracos = nd.binary_fill_holes(m) & ~m
    lab2, n2 = nd.label(buracos)
    if n2:
        area = nd.sum(buracos, lab2, range(1, n2 + 1))
        pequenos = np.isin(lab2, 1 + np.flatnonzero(area < 2600))
        m |= pequenos
    return m


def para_celulas(m):
    """Uma célula é chão quando a maior parte dela é chão."""
    c = m.reshape(ROWS, CEL, COLS, CEL).mean(axis=(1, 3))
    return (c >= 0.55).astype(np.uint8)


def rle(cel):
    """Mesmo formato de cena_arredores.js: corridas por linha, começando em 0."""
    linhas = []
    for r in range(ROWS):
        runs, atual, cont = [], 0, 0
        for v in cel[r]:
            if v == atual:
                cont += 1
            else:
                runs.append(cont); atual = v; cont = 1
        runs.append(cont)
        linhas.append(','.join(map(str, runs)))
    return ';'.join(linhas)


# ------------------------------------------------------------- âncoras
def ancoras(cel):
    """Onde a cena pode pôr bonde, saída e viatura, lido da própria máscara.

    faixa  = a pista, a linha de chão mais larga do meio da tela
    bocas  = o x de cada transversal, nas duas pontas
    """
    largura = cel.sum(1)
    meio = ROWS // 2
    # a pista é a fatia contínua de linhas largas em volta do meio
    limiar = max(6, int(largura.max() * 0.55))
    r0 = meio
    while r0 > 0 and largura[r0 - 1] >= limiar:
        r0 -= 1
    r1 = meio
    while r1 < ROWS - 1 and largura[r1 + 1] >= limiar:
        r1 += 1
    faixa = [int(r0 * CEL), int((r1 + 1) * CEL)]

    col = cel.sum(0)
    alto = max(4, int(ROWS * 0.55))
    esq = [c for c in range(COLS // 3) if col[c] >= alto]
    dir = [c for c in range(COLS - COLS // 3, COLS) if col[c] >= alto]
    bocas = [int((esq[len(esq) // 2] + 0.5) * CEL) if esq else 40,
             int((dir[len(dir) // 2] + 0.5) * CEL) if dir else LARG - 40]
    return {'faixa': faixa, 'bocas': bocas,
            'meio': int((faixa[0] + faixa[1]) / 2)}


def main():
    fora = {}
    for f in FONTES:
        img = Image.open(CENAS / f['arquivo']).convert('RGB')
        tela, topo, altura = encaixar(img)
        destino = CENAS / f['saida']
        tela.save(destino, 'WEBP', quality=82, method=6)

        a = np.asarray(tela).astype(np.int16)
        m = chao(a, f['sementes'], topo, altura, f.get('corredor', False))
        cel = para_celulas(m)
        anc = ancoras(cel)
        fora[f['id']] = {
            'imagem': f'img/cenas/{f["saida"]}',
            'mascara': rle(cel),
            'faixa': anc['faixa'], 'bocas': anc['bocas'], 'meio': anc['meio'],
            'topo': topo, 'altura': altura,
        }
        print(f'{f["id"]:>7}: {destino.stat().st_size//1024:4d} KB · '
              f'chão {100*cel.mean():.1f}% · faixa {anc["faixa"]} · '
              f'bocas {anc["bocas"]} · quintal {topo}px em cima')

        # prova visual: a máscara por cima da foto
        prova = np.asarray(tela).copy()
        grande = np.kron(cel, np.ones((CEL, CEL), np.uint8)).astype(bool)
        prova[~grande] = (prova[~grande] * 0.42).astype(np.uint8)
        Image.fromarray(prova).save(CENAS / f'_ref_mascara_{f["id"]}.png')

    js = ('/* CENAS SOBRE FOTO — máscara de caminhabilidade tirada da imagem\n'
          '   GERADO por ferramentas/importar_cena_foto.py — nao editar a mao. */\n'
          'TO.dados = TO.dados || {};\n'
          'TO.dados.cenasFoto = ' + json.dumps(fora, ensure_ascii=False) + ';\n')
    alvo = RAIZ / 'dados' / 'cenas_foto.js'
    alvo.write_text(js, encoding='utf-8')
    print(f'\n{alvo.relative_to(RAIZ)} — {len(js)//1024} KB')


if __name__ == '__main__':
    main()
