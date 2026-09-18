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
     manchas.png  256x256 RGBA — quatro manchas de parede (mofo, chuva,
                                 barro e maresia), alfa recortado.
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


def manchas(n=256):
    """QUATRO MANCHAS de parede, 2x2. Alfa recortado, cor escura: elas
       entram como decalque por cima do reboco, então o que importa é o
       desenho do escorrido, não a cor da parede embaixo."""
    r = Sorte(20260919)
    px = bytearray(n * n * 4)
    m = n // 2
    receitas = [
        # (cor,            gotas, largura, escorrido, topo)
        ((58, 66, 52),     26, 0.36, 0.72, 0.02),   # mofo do beiral
        ((74, 72, 64),     18, 0.30, 0.86, 0.00),   # água de chuva
        ((96, 78, 56),     22, 0.42, 0.34, 0.55),   # barro do respingo, embaixo
        ((82, 84, 86),     20, 0.50, 0.30, 0.10),   # maresia, esparramada
    ]
    for q, (cor, gotas, larg, escorre, topo) in enumerate(receitas):
        ox, oy = (q % 2) * m, (q // 2) * m
        campo = [0.0] * (m * m)
        # bolhas: o corpo da mancha
        for _ in range(gotas):
            cx = m * (0.5 + (r() - 0.5) * larg * 1.6)
            cy = m * (topo + r() * 0.30)
            rr = m * (0.05 + r() * 0.11)
            for y in range(max(0, int(cy - rr)), min(m, int(cy + rr) + 1)):
                for x in range(max(0, int(cx - rr)), min(m, int(cx + rr) + 1)):
                    d = math.hypot(x - cx, y - cy) / rr
                    if d < 1:
                        campo[y * m + x] = max(campo[y * m + x], (1 - d) ** 1.4)
        # escorridos: a água desce e deixa rastro
        for _ in range(int(gotas * 0.8)):
            x = int(m * (0.5 + (r() - 0.5) * larg * 1.5))
            y = int(m * (topo + r() * 0.22))
            w = 1 + int(r() * 2.5)
            alcance = int(m * escorre * (0.35 + r() * 0.65))
            for k in range(alcance):
                yy = y + k
                if yy >= m: break
                f = (1 - k / max(1, alcance)) ** 1.5
                x += (r() - 0.5) * 0.9
                for dx in range(-w, w + 1):
                    xx = int(x) + dx
                    if 0 <= xx < m:
                        campo[yy * m + xx] = max(campo[yy * m + xx], f * (1 - abs(dx) / (w + 1)))
        for y in range(m):
            for x in range(m):
                a = campo[y * m + x]
                if a <= 0.02: continue
                a = min(1.0, a * (0.75 + r() * 0.5))
                i = ((oy + y) * n + (ox + x)) * 4
                px[i]     = lim(cor[0] + (r() - 0.5) * 20)
                px[i + 1] = lim(cor[1] + (r() - 0.5) * 20)
                px[i + 2] = lim(cor[2] + (r() - 0.5) * 20)
                px[i + 3] = lim(a * 205)
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
    escrever(os.path.join(SAIDA, 'manchas.png'), 256, 256, manchas(), alfa=True)
    escrever(os.path.join(SAIDA, 'reboco.png'), 128, 128, reboco())
    for nome in ('telha.png', 'manchas.png', 'reboco.png'):
        p = os.path.join(SAIDA, nome)
        print(nome, os.path.getsize(p), 'bytes')


if __name__ == '__main__':
    main()
