#!/usr/bin/env python3
"""Gera as texturas do bairro em PNG, sem depender de biblioteca de imagem.

   Por que gerar e não desenhar à mão: elas precisam ser LADRILHÁVEIS
   (o telhado repete a textura ao longo do mundo inteiro) e precisam ser
   refeitas quando a escala do cenário mudar. Rodar de novo:

       python3 ferramentas/gerar_texturas.py

   Sai em `img/texturas/`:
     telha.png    128x128 RGB  — telha colonial, para MULTIPLICAR pela
                                 cor do vértice: a média fica perto de 1
                                 pra não escurecer o telhado.
     tijolo.png   256x256 RGBA — quatro falhas de reboco com o tijolo
                                 aparecendo, alfa recortado.
     reboco.png   128x128 RGB  — reboco chapiscado, também multiplicativo.
"""
import math, os, struct, zlib

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'img', 'texturas')


def escrever(caminho, larg, alt, pixels, alfa=False):
    """PNG sem filtro, que a esse tamanho não faz falta."""
    canais = 4 if alfa else 3
    linhas = bytearray()
    for y in range(alt):
        linhas.append(0)
        linhas.extend(pixels[y * larg * canais:(y + 1) * larg * canais])

    def pedaco(tipo, dados):
        c = tipo + dados
        return struct.pack('>I', len(dados)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    cabeca = struct.pack('>IIBBBBB', larg, alt, 8, 6 if alfa else 2, 0, 0, 0)
    with open(caminho, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(pedaco(b'IHDR', cabeca))
        f.write(pedaco(b'IDAT', zlib.compress(bytes(linhas), 9)))
        f.write(pedaco(b'IEND', b''))


class Sorte:
    """ruído com semente: a textura sai igual toda vez"""
    def __init__(self, s): self.s = s & 0xffffffff
    def __call__(self):
        self.s = (self.s * 1664525 + 1013904223) & 0xffffffff
        return self.s / 4294967296.0


def lim(v, a=0, b=255):
    return int(max(a, min(b, v)))


def telha(n=128, colunas=8, fileiras=4):
    """TELHA COLONIAL vista de cima: canais de meia-cana em fileiras.
       A coluna é a canaleta (clara no topo, escura no vale) e a fileira
       tem o degrau da sobreposição, que é a sombra que se vê do alto."""
    r = Sorte(20260918)
    lc, lf = n / colunas, n / fileiras
    # cada telha ganha um tom próprio, e ele REPETE na borda pra ladrilhar
    tons = [[0.93 + r() * 0.16 for _ in range(colunas)] for _ in range(fileiras)]
    px = bytearray(n * n * 3)
    for y in range(n):
        f = int(y // lf)
        ty = (y % lf) / lf                       # 0 no topo da fileira, 1 embaixo
        # o degrau da sobreposição: a telha de baixo passa por cima
        degrau = 1.0 - 0.30 * math.exp(-ty * 9.0)
        # e a fileira escurece um pouco em direção ao beiral
        fileira = 1.0 - 0.05 * ty
        for x in range(n):
            c = int(x // lc)
            tx = (x % lc) / lc
            # a meia-cana: clara na crista, escura no vale entre duas
            cana = 0.80 + 0.30 * math.sin(math.pi * tx) ** 0.7
            v = 226 * cana * degrau * fileira * tons[f][c]
            v += (r() - 0.5) * 13                # granulado do barro
            i = (y * n + x) * 3
            px[i]     = lim(v * 1.00)
            px[i + 1] = lim(v * 0.965)
            px[i + 2] = lim(v * 0.935)
    return px


def tijolo(n=256):
    """QUATRO FALHAS DE REBOCO, 2x2. Onde o reboco caiu aparece o tijolo
       baiano por baixo, e a beirada da falha tem o lábio do reboco que
       ainda está preso. É o que a parede de bairro tem de verdade —
       mancha de sujeira ficava borrão, isto aqui tem desenho.

       Cada quadrante: uma mancha irregular (bolhas somadas) recorta o
       alfa; dentro dela vão as fiadas de tijolo com junta de argamassa;
       na borda de dentro vai o lábio claro do reboco quebrado."""
    r = Sorte(20260921)
    px = bytearray(n * n * 4)
    m = n // 2
    # (bolhas, raio, centro y, achatamento) — uma alta e estreita, uma
    # larga embaixo (umidade que sobe), uma pequena e uma de quina
    receitas = [
        (11, 0.20, 0.50, 1.00),
        (14, 0.24, 0.72, 0.62),
        (7,  0.15, 0.40, 1.00),
        (12, 0.21, 0.58, 0.80),
    ]
    # o tijolo tem 19 cm e a falha tem pouco mais de um metro: são umas
    # seis fiadas atravessando o quadrante, não duas
    TIJ_L, TIJ_A, JUNTA = 13, 6, 1.6
    for q, (bolhas, raio, cy0, achata) in enumerate(receitas):
        ox, oy = (q % 2) * m, (q // 2) * m
        campo = [0.0] * (m * m)
        for _ in range(bolhas):
            cx = m * (0.5 + (r() - 0.5) * 0.52)
            cy = m * (cy0 + (r() - 0.5) * 0.34)
            rr = m * raio * (0.45 + r() * 0.75)
            ra = rr * achata
            for y in range(max(0, int(cy - ra)), min(m, int(cy + ra) + 1)):
                for x in range(max(0, int(cx - rr)), min(m, int(cx + rr) + 1)):
                    d = math.hypot((x - cx) / rr, (y - cy) / ra)
                    if d < 1:
                        campo[y * m + x] = max(campo[y * m + x], 1.0)
        # A BORDA FICA IRREGULAR POR MORDIDA, não por ruído solto: bolhas
        # que SUBTRAEM, plantadas na beirada. Com ruído espalhado o
        # interior virava peneira, e aí quase todo pixel tinha um
        # vizinho de fora — tudo virava lábio de reboco e o tijolo
        # sumia (foi o que saiu na primeira tentativa).
        for _ in range(9):
            cx = m * (0.5 + (r() - 0.5) * 0.66)
            cy = m * (cy0 + (r() - 0.5) * 0.5)
            rr = m * raio * (0.26 + r() * 0.34)
            for y in range(max(0, int(cy - rr)), min(m, int(cy + rr) + 1)):
                for x in range(max(0, int(cx - rr)), min(m, int(cx + rr) + 1)):
                    if math.hypot(x - cx, y - cy) < rr:
                        campo[y * m + x] = 0.0
        # de quem é vizinho: serve pro lábio e pro corte do alfa
        def dentro(x, y):
            return 0 <= x < m and 0 <= y < m and campo[y * m + x] > 0
        for y in range(m):
            for x in range(m):
                if not dentro(x, y):
                    continue
                # o LÁBIO: a até dois pixels da borda, o reboco quebrado
                borda = any(not dentro(x + dx, y + dy)
                            for dx, dy in ((-2,0),(-1,0),(1,0),(2,0),(0,-2),(0,-1),(0,1),(0,2)))
                i = ((oy + y) * n + (ox + x)) * 4
                if borda:
                    v = 206 + (r() - 0.5) * 26
                    px[i] = lim(v); px[i + 1] = lim(v * 0.985); px[i + 2] = lim(v * 0.96)
                    px[i + 3] = 235
                    continue
                # as FIADAS: junta de argamassa e tijolo, com meia fiada
                # de deslocamento a cada linha
                fy = y / TIJ_A
                linha = int(fy)
                desl = (linha % 2) * (TIJ_L / 2)
                dy_j = (y % TIJ_A) < JUNTA
                dx_j = ((x + desl) % TIJ_L) < JUNTA
                if dy_j or dx_j:
                    v = 168 + (r() - 0.5) * 16          # argamassa
                    px[i] = lim(v); px[i + 1] = lim(v * 0.98); px[i + 2] = lim(v * 0.94)
                else:
                    # tijolo: cada um com o seu tom, e o barro é granulado
                    t = 0.82 + ((linha * 7 + int((x + desl) / TIJ_L) * 13) % 11) / 34.0
                    px[i]     = lim(172 * t + (r() - 0.5) * 16)
                    px[i + 1] = lim(96  * t + (r() - 0.5) * 12)
                    px[i + 2] = lim(72  * t + (r() - 0.5) * 10)
                # sombra de dentro da falha: o tijolo está recuado
                sombra = any(not dentro(x + dx, y + dy)
                             for dx, dy in ((-4,0),(-3,0),(3,0),(4,0),(0,-4),(0,-3),(0,3),(0,4)))
                if sombra:
                    for k in range(3):
                        px[i + k] = lim(px[i + k] * 0.72)
                px[i + 3] = 255
    return px


def reboco(n=128):
    """REBOCO chapiscado: granulado fino com manchinhas, multiplicativo."""
    r = Sorte(20260920)
    base = [1.0] * (n * n)
    for _ in range(420):
        cx, cy, rr = r() * n, r() * n, 3 + r() * 9
        k = 1.0 + (r() - 0.5) * 0.10
        for y in range(int(cy - rr), int(cy + rr) + 1):
            for x in range(int(cx - rr), int(cx + rr) + 1):
                d = math.hypot(x - cx, y - cy) / rr
                if d < 1:
                    base[(y % n) * n + (x % n)] *= 1 + (k - 1) * (1 - d)
    px = bytearray(n * n * 3)
    for y in range(n):
        for x in range(n):
            v = 236 * base[y * n + x] + (r() - 0.5) * 9
            i = (y * n + x) * 3
            px[i] = lim(v); px[i + 1] = lim(v * 0.995); px[i + 2] = lim(v * 0.985)
    return px


def main():
    os.makedirs(SAIDA, exist_ok=True)
    escrever(os.path.join(SAIDA, 'telha.png'), 128, 128, telha())
    escrever(os.path.join(SAIDA, 'tijolo.png'), 256, 256, tijolo(), alfa=True)
    escrever(os.path.join(SAIDA, 'reboco.png'), 128, 128, reboco())
    for nome in ('telha.png', 'tijolo.png', 'reboco.png'):
        p = os.path.join(SAIDA, nome)
        print(nome, os.path.getsize(p), 'bytes')


if __name__ == '__main__':
    main()
