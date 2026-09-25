#!/usr/bin/env python3
"""Pinta as texturas dos cinco prédios modelados da cidade do estádio.

   São cinco FOLHAS (uma por prédio) e uma folha de GRADES com alfa:

       img/texturas/modelos/predio.jpg     o prédio alto de 14 andares
       img/texturas/modelos/igreja.jpg     a igreja matriz
       img/texturas/modelos/loja.jpg       o prédio de 3 andares com mercado
       img/texturas/modelos/adm.jpg        o centro administrativo
       img/texturas/modelos/casa.jpg       a casa de classe média
       img/texturas/modelos/grades.png     grades e portões vazados (alfa), e a rede do vôlei
       img/texturas/modelos/metro.jpg      o metrô: entrada, plataforma, túnel e trem
       img/texturas/modelos/equip.jpg      o shopping, a delegacia e a praça da proposta
       img/texturas/modelos/praia.jpg      a praia: quiosque, barraca, guarda-sol, posto, barco, o coco

   (As árvores não têm folha: são low poly, de cor por vértice —
   js/diajogo/arvores_lowpoly.js.)

   COMO UMA FOLHA FUNCIONA. Cada folha é um mosaico de CÉLULAS, e cada
   célula é um pedaço de fachada com tamanho de mundo em metros: "uma
   janela do prédio alto, com o peitoril embaixo, 1,5 × 2,9 m". O 3D
   (`js/diajogo/modelos3d.js`) monta a fachada repetindo células — a
   janela do 7º andar é a mesma célula da janela do 3º. Por isso a
   folha de 2048 px dá conta de um prédio inteiro com 90 a 160 px por
   metro, que é o que a câmera de ombro (a 5 m do boneco) enxerga.

   Célula LADRILHÁVEL (reboco, tijolo, telha) é pintada sem costura: a
   borda da direita continua na da esquerda. As outras (janela, porta,
   letreiro) são pintadas uma vez só.

   A MARGEM. Cada célula ganha 6 px de margem copiada da própria borda
   (ou da borda oposta, se for ladrilhável). Sem isso, o mipmap de
   longe mistura a janela com a célula vizinha e aparece uma linha da
   cor errada em volta de cada módulo.

   Este script também ESCREVE `js/diajogo/modelos_atlas.js`: onde cada
   célula caiu na folha (em UV) e quanto ela mede em metros. Não edite
   aquele arquivo à mão — mude aqui e rode de novo:

       python3 ferramentas/pintar_modelos.py
       python3 ferramentas/pintar_modelos.py metro equip    (só essas duas)

   Tudo é determinístico (semente fixa por célula): rodar duas vezes dá
   a mesma imagem, byte a byte no PNG e quase isso no JPG.
"""
import hashlib, json, math, os, sys

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError:
    sys.exit('falta numpy e Pillow: pip install numpy Pillow')

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'img', 'texturas', 'modelos')
ATLAS_JS = os.path.join(RAIZ, 'js', 'diajogo', 'modelos_atlas.js')
MARGEM = 6
QUALIDADE = 86

FONTES = {
    'negrito': ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
                'C:/Windows/Fonts/arialbd.ttf', '/Library/Fonts/Arial Bold.ttf'],
    'normal': ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
               '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
               'C:/Windows/Fonts/arial.ttf', '/Library/Fonts/Arial.ttf'],
}


def fonte(tipo, tam):
    for c in FONTES[tipo]:
        if os.path.isfile(c):
            return ImageFont.truetype(c, max(6, int(tam)))
    print('AVISO: fonte', tipo, 'não achada; o letreiro sai com a fonte padrão')
    return ImageFont.load_default()


# =========================================================
#   FERRAMENTAS DE PINTURA
# =========================================================
def cor(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


def chapado(w, h, c):
    return np.broadcast_to(cor(c), (h, w, 3)).copy()


def ruido(h, w, per, rnd, lad=True):
    """ruído de valor, suave, em torno de zero (±0,5). `per` é o
       tamanho do grão em px. Ladrilhável: a grade é repetida 3 × 3 e a
       interpolação no meio vê os vizinhos certos nas quatro bordas."""
    gh = max(2, int(round(h / per)))
    gw = max(2, int(round(w / per)))
    g = rnd.random((gh, gw)).astype(np.float32)
    if lad:
        t = np.tile(g, (3, 3))
        a = np.asarray(Image.fromarray(t, 'F').resize((3 * w, 3 * h), Image.BICUBIC))
        a = a[h:2 * h, w:2 * w]
    else:
        a = np.asarray(Image.fromarray(g, 'F').resize((w, h), Image.BICUBIC))
    return a - 0.5


def fbm(h, w, per, rnd, oitavas=4, lad=True):
    tot = np.zeros((h, w), np.float32)
    amp, soma = 1.0, 0.0
    for _ in range(oitavas):
        tot += amp * ruido(h, w, max(1.5, per), rnd, lad)
        soma += amp
        amp *= 0.5
        per /= 2
    return tot / soma


def borrar(a, r):
    """desfoque gaussiano separável (o do Pillow não aceita imagem em
       ponto flutuante)"""
    if r <= 0:
        return a
    n = max(1, int(math.ceil(r * 3)))
    k = np.exp(-0.5 * (np.arange(-n, n + 1) / r) ** 2).astype(np.float32)
    k /= k.sum()
    a = a.astype(np.float32)
    p = np.pad(a, ((n, n), (0, 0)), mode='edge')
    a = sum(k[i] * p[i:i + a.shape[0]] for i in range(2 * n + 1))
    p = np.pad(a, ((0, 0), (n, n)), mode='edge')
    return sum(k[i] * p[:, i:i + a.shape[1]] for i in range(2 * n + 1))


def pontos(h, w, n, r0, r1, rnd, lad=True, sinal=None):
    """pintas soltas (chapisco, sujeira de fuligem): mapa em [-1, 1]"""
    im = Image.new('F', (w, h), 0.0)
    d = ImageDraw.Draw(im)
    desl = (-1, 0, 1) if lad else (0,)
    for _ in range(int(n)):
        x, y = rnd.random() * w, rnd.random() * h
        r = r0 + rnd.random() * (r1 - r0)
        v = (sinal if sinal is not None else (1.0 if rnd.random() < 0.5 else -1.0)) * (0.35 + 0.65 * rnd.random())
        for dx in desl:
            for dy in desl:
                cx, cy = x + dx * w, y + dy * h
                if -r <= cx <= w + r and -r <= cy <= h + r:
                    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=float(v))
    return np.asarray(im)


def escorrido(h, w, rnd, n, inicio=(0.0, 0.3), comp=(0.2, 0.8), larg=(1, 4), lad=True, faixa=None):
    """as manchas que a chuva desce pela parede: começam num ponto
       (peitoril, beiral) e somem pra baixo. Mapa em [0, 1]."""
    m = np.zeros((h, w), np.float32)
    x0, x1 = faixa if faixa else (0, w)
    for _ in range(int(n)):
        x = int(rnd.integers(x0, max(x0 + 1, x1)))
        lw = int(rnd.integers(larg[0], larg[1] + 1))
        y0 = int(rnd.uniform(*inicio) * h)
        L = max(4, int(rnd.uniform(*comp) * h))
        a = rnd.uniform(0.35, 1.0)
        ys = np.arange(y0, min(h, y0 + L))
        if not len(ys):
            continue
        queda = a * (1 - (ys - y0) / L) ** 1.4
        for k in range(-lw, lw + 1):
            xx = (x + k) % w if lad else x + k
            if 0 <= xx < w:
                m[ys, xx] = np.maximum(m[ys, xx], queda * (1 - abs(k) / (lw + 1)))
    return np.clip(borrar(m, 0.8), 0, 1)


def pe_de_parede(h, w, alt_px, forca=0.18):
    """a umidade que sobe do chão: escurece o pé da parede"""
    y = np.arange(h, dtype=np.float32)
    t = np.clip((y - (h - alt_px)) / max(1, alt_px), 0, 1) ** 1.6
    return np.broadcast_to((1 - forca * t)[:, None], (h, w)).astype(np.float32)


def multiplicar(img, m):
    return img * m[..., None]


def para_np(pil):
    return np.asarray(pil.convert('RGB'), np.float32) / 255


def para_pil(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGB')


def reboco(w, h, ppm, rnd, base, grao=0.05, pintas=0.0, manchas=0.10, lad=True, fuligem=0.0):
    """reboco pintado. `pintas` é o chapisco (quantas por m²),
       `manchas` o manchado de umidade, `fuligem` pinta escura solta"""
    a = chapado(w, h, base)
    m = 1 + grao * fbm(h, w, 0.35 * ppm, rnd, 4, lad) * 2
    m += manchas * fbm(h, w, 1.4 * ppm, rnd, 3, lad) * 2
    m += 0.025 * ruido(h, w, 1.5, rnd, lad) * 2
    if pintas:
        area = (w / ppm) * (h / ppm)
        m += 0.22 * pontos(h, w, pintas * area, 0.5, 1.4, rnd, lad)
    if fuligem:
        area = (w / ppm) * (h / ppm)
        m -= 0.16 * np.clip(pontos(h, w, fuligem * area, 0.4, 1.1, rnd, lad, sinal=1.0), 0, 1)
    return multiplicar(a, m)


def tijolos(w, h, ppm, rnd, cores, argamassa='#b9b1a4', tam=(0.23, 0.075), junta=0.012, lad=True, var=0.10):
    """tijolinho à vista em amarração corrida. Pra ladrilhar sem
       costura, a célula tem de ter um número inteiro de tijolos — quem
       chama escolhe a largura e a altura em múltiplos de `tam`."""
    # UM NÚMERO INTEIRO DE TIJOLOS na largura, sempre: módulo de fachada
    # encosta em módulo, e tijolo cortado na divisa vira uma costura
    # clara a cada 2,4 m. O tijolo estica o que for preciso (1 cm, 2 cm).
    tw = w / max(1, int(round(w / (tam[0] * ppm))))
    th = h / max(1, int(round(h / (tam[1] * ppm)))) if lad else tam[1] * ppm
    jp = max(1, int(round(junta * ppm)))
    img = Image.new('RGB', (w, h), argamassa)
    d = ImageDraw.Draw(img)
    linhas = int(round(h / th))
    cols = int(round(w / tw)) + 2
    for j in range(linhas + 1):
        y0 = j * th
        desl = (tw / 2) if j % 2 else 0
        for i in range(-1, cols):
            x0 = i * tw + desl
            c = cor(cores[int(rnd.integers(0, len(cores)))]) * (1 + var * 0.6 * (rnd.random() - 0.5) * 2)
            cc = tuple(int(max(0, min(255, v * 255))) for v in c)
            for dx in ((-w, 0, w) if lad else (0,)):
                d.rectangle([x0 + dx, y0, x0 + dx + tw - jp, y0 + th - jp], fill=cc)
    a = para_np(img)
    a = multiplicar(a, 1 + 0.10 * fbm(h, w, 0.08 * ppm, rnd, 3, lad))
    a = multiplicar(a, 1 + 0.08 * fbm(h, w, 1.0 * ppm, rnd, 2, lad))
    return a


def telhas(w, h, ppm, rnd, cores, larg=0.21, passo=0.36, lad=True, musgo=0.0):
    """telha colonial: fileiras de canal, cada telha sombreada como um
       meio-cilindro (claro no meio, escuro nas bordas) e a sombra da
       fileira de cima caindo na de baixo"""
    tw, tp = larg * ppm, passo * ppm
    cols = max(1, int(round(w / tw)))
    tw = w / cols
    rows = max(1, int(round(h / tp)))
    tp = h / rows
    a = np.zeros((h, w, 3), np.float32)
    xs = np.arange(w, dtype=np.float32)
    ys = np.arange(h, dtype=np.float32)
    for j in range(rows):
        y0 = int(round(j * tp))
        y1 = int(round((j + 1) * tp))
        desl = (tw / 2) if j % 2 else 0
        fase = ((xs - desl) % tw) / tw                         # 0..1 dentro da telha
        idx = np.floor((xs - desl) / tw).astype(int)
        forma = np.sin(fase * np.pi) ** 0.6                    # meio-cilindro
        luz = 0.55 + 0.55 * forma
        base = np.zeros((w, 3), np.float32)
        for k in np.unique(idx):
            c = cor(cores[int(rnd.integers(0, len(cores)))]) * (1 + 0.12 * (rnd.random() - 0.5) * 2)
            base[idx == k] = c
        tt = (ys[y0:y1] - y0) / max(1, (y1 - y0))
        # a borda de baixo da fileira é a ponta da telha: clara; o topo fica sob a de cima: sombra
        v = 0.62 + 0.45 * np.clip(tt, 0, 1) ** 0.7
        a[y0:y1] = base[None, :, :] * (luz[None, :, None]) * v[:, None, None]
        # a sombra fina que a ponta de cima joga
        s = min(y1, y0 + max(1, int(0.03 * ppm)))
        a[y0:s] *= 0.55
    a = multiplicar(a, 1 + 0.10 * fbm(h, w, 0.12 * ppm, rnd, 3, lad))
    a = multiplicar(a, 1 + 0.10 * fbm(h, w, 1.2 * ppm, rnd, 2, lad))
    if musgo:
        mm = np.clip(fbm(h, w, 0.5 * ppm, rnd, 3, lad) * 3 - 0.4, 0, 1) * musgo
        a = a * (1 - mm[..., None]) + cor('#5b5a3a')[None, None, :] * mm[..., None] * 0.9
    return a


def vidro(w, h, rnd, base='#11161a', topo='#44525c', reflexo=0.18):
    """vidro visto de fora: escuro, o céu refletido em cima e uma
       faixa diagonal de reflexo"""
    ys = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    xs = np.linspace(0, 1, w, dtype=np.float32)[None, :]
    t = np.clip(ys * 1.2, 0, 1) ** 0.8
    a = cor(topo)[None, None, :] * (1 - t[..., None]) + cor(base)[None, None, :] * t[..., None]
    a = np.broadcast_to(a, (h, w, 3)).copy()
    diag = xs * 0.8 + ys * 0.6
    c = rnd.uniform(0.2, 0.9)
    faixa = np.exp(-((diag - c) / 0.07) ** 2) * reflexo
    a += faixa[..., None]
    a *= (1 + 0.04 * ruido(h, w, max(2, w / 6), rnd, False))[..., None]
    return np.clip(a, 0, 1)


def cortina(a, x0, x1, y0, y1, c='#d9d6cc', dobras=6, rnd=None, luz=0.85):
    """cortina por trás do vidro: pregas verticais, apagada pelo vidro"""
    x0, x1, y0, y1 = int(x0), int(x1), int(y0), int(y1)
    if x1 <= x0 or y1 <= y0:
        return
    xs = np.linspace(0, dobras * 2 * np.pi, x1 - x0, dtype=np.float32)
    prega = 0.82 + 0.18 * np.sin(xs)
    cc = cor(c) * luz
    a[y0:y1, x0:x1] = cc[None, None, :] * prega[None, :, None]


def persiana(a, x0, x1, y0, y1, c='#ecebe6', passo=6, aberta=0.0):
    """persiana de lâminas horizontais. `aberta` (0..1) é quanto dela
       está recolhida lá em cima, mostrando o vidro"""
    x0, x1, y0, y1 = int(x0), int(x1), int(y0), int(y1)
    ytopo = y0
    ybaixo = y0 + int((y1 - y0) * (1 - aberta))
    cc = cor(c)
    for y in range(ytopo, ybaixo):
        f = ((y - ytopo) % passo) / passo
        v = 0.78 + 0.25 * math.sin(f * math.pi)
        if f > 0.85:
            v = 0.62
        a[y, x0:x1] = cc * v
    if aberta:
        a[max(y0, ybaixo - 2):ybaixo + 1, x0:x1] = cc * 0.6


def retangulo(a, x0, y0, x1, y1, c, sombra=True, relevo=0.10):
    """quadro com um fio de luz em cima/esquerda e sombra embaixo/direita"""
    x0, y0, x1, y1 = int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1))
    if x1 <= x0 or y1 <= y0:
        return
    cc = cor(c) if isinstance(c, str) else c
    a[y0:y1, x0:x1] = cc
    if sombra and (x1 - x0) > 3 and (y1 - y0) > 3:
        a[y0:y0 + 1, x0:x1] = np.clip(cc * (1 + relevo * 1.5), 0, 1)
        a[y0:y1, x0:x0 + 1] = np.clip(cc * (1 + relevo), 0, 1)
        a[y1 - 1:y1, x0:x1] = cc * (1 - relevo * 2)
        a[y0:y1, x1 - 1:x1] = cc * (1 - relevo * 1.5)


def moldura(a, x0, y0, x1, y1, esp, c):
    """moldura (batente) de largura `esp` px em volta de um vão"""
    retangulo(a, x0, y0, x1, y0 + esp, c)
    retangulo(a, x0, y1 - esp, x1, y1, c)
    retangulo(a, x0, y0, x0 + esp, y1, c)
    retangulo(a, x1 - esp, y0, x1, y1, c)


def sombra_interna(a, x0, y0, x1, y1, esp, forca=0.35):
    """a sombra que o batente joga dentro do vão: o vão parece fundo"""
    x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
    for k in range(int(esp)):
        f = 1 - forca * (1 - k / esp) ** 1.5
        if y0 + k < y1:
            a[y0 + k, x0:x1] *= f
        if x0 + k < x1:
            a[y0:y1, x0 + k] *= f


def colar(a, b, x, y):
    x, y = int(x), int(y)
    h, w = b.shape[:2]
    a[y:y + h, x:x + w] = b


def desenhar(a, fn):
    """passa a imagem pelo ImageDraw do Pillow e volta: pra arco,
       polígono e texto, que em numpy puro seria um tormento"""
    im = para_pil(a)
    fn(ImageDraw.Draw(im), im)
    a[...] = para_np(im)


def mascara_forma(w, h, fn, borrao=0):
    im = Image.new('L', (w, h), 0)
    fn(ImageDraw.Draw(im))
    m = np.asarray(im, np.float32) / 255
    return borrar(m, borrao) if borrao else m


def aplicar(a, cor_ou_img, m):
    if isinstance(cor_ou_img, str):
        c = cor(cor_ou_img)[None, None, :]
    else:
        c = cor_ou_img
    a[...] = a * (1 - m[..., None]) + c * m[..., None]


# =========================================================
#   A FOLHA
# =========================================================
class Folha:
    def __init__(self, nome, larg=2048, alfa=False):
        self.nome, self.larg, self.alfa = nome, larg, alfa
        self.cels = []
        self.extras = {}

    def cel(self, chave, larg_m, alt_m, ppm, pintor, lad=False):
        w = max(8, int(round(larg_m * ppm)))
        h = max(8, int(round(alt_m * ppm)))
        self.cels.append(dict(chave=chave, w=w, h=h, lm=larg_m, am=alt_m, ppm=ppm, pintor=pintor, lad=lad))

    def montar(self):
        G = MARGEM
        itens = sorted(self.cels, key=lambda c: (-c['h'], -c['w']))
        W = self.larg
        x = y = linha = 0
        for c in itens:
            cw, ch = c['w'] + 2 * G, c['h'] + 2 * G
            if cw > W:
                sys.exit(f'{self.nome}/{c["chave"]}: célula de {cw} px não cabe na folha de {W}')
            if x + cw > W:
                x, y, linha = 0, y + linha, 0
            c['x'], c['y'] = x + G, y + G
            x += cw
            linha = max(linha, ch)
        H = y + linha
        H = (H + 15) // 16 * 16
        canais = 4 if self.alfa else 3
        folha = np.zeros((H, W, canais), np.float32)
        layout = {}
        for c in self.cels:
            semente = int(hashlib.md5((self.nome + '/' + c['chave']).encode()).hexdigest()[:8], 16)
            rnd = np.random.default_rng(semente)
            img = c['pintor'](c['w'], c['h'], c['ppm'], rnd)
            if img.shape[:2] != (c['h'], c['w']):
                sys.exit(f'{self.nome}/{c["chave"]}: o pintor devolveu {img.shape[:2]}, esperado {(c["h"], c["w"])}')
            if img.shape[2] < canais:
                img = np.concatenate([img, np.ones((c['h'], c['w'], 1), np.float32)], axis=2)
            img = np.clip(img[..., :canais], 0, 1)
            # a margem: a borda estendida, ou a borda oposta se ladrilha
            if c['lad']:
                grande = np.tile(img, (3, 3, 1))
                bloco = grande[c['h'] - G:2 * c['h'] + G, c['w'] - G:2 * c['w'] + G]
            else:
                bloco = np.pad(img, ((G, G), (G, G), (0, 0)), mode='edge')
            folha[c['y'] - G:c['y'] + c['h'] + G, c['x'] - G:c['x'] + c['w'] + G] = bloco
            # meio texel pra dentro: o filtro nunca pega a margem no limite exato
            u0 = (c['x'] + 0.5) / W
            u1 = (c['x'] + c['w'] - 0.5) / W
            vb = 1 - (c['y'] + c['h'] - 0.5) / H
            vt = 1 - (c['y'] + 0.5) / H
            layout[c['chave']] = [round(u0, 6), round(vb, 6), round(u1, 6), round(vt, 6), c['lm'], c['am']]
        os.makedirs(SAIDA, exist_ok=True)
        dados = (folha * 255 + 0.5).clip(0, 255).astype(np.uint8)
        if self.alfa:
            caminho = os.path.join(SAIDA, self.nome + '.png')
            Image.fromarray(dados, 'RGBA').save(caminho, optimize=True)
        else:
            caminho = os.path.join(SAIDA, self.nome + '.jpg')
            Image.fromarray(dados, 'RGB').save(caminho, 'JPEG', quality=QUALIDADE, optimize=True, progressive=True)
        print(f'  {self.nome:8s} {W}×{H}  {len(self.cels):2d} células  {os.path.getsize(caminho) / 1024:6.0f} KB')
        return {'arquivo': os.path.relpath(caminho, RAIZ).replace(os.sep, '/'), 'larg': W, 'alt': H,
                'cel': layout, **self.extras}


# =========================================================
#   1. O PRÉDIO ALTO — 12 andares sobre um embasamento de 2
#   Caixilho preto com montante branco, peitoril bege, painel ocre
#   nas empenas e a faixa vermelha do 1º andar do embasamento.
# =========================================================
BRANCO_P = '#ebeae5'
BEGE_P = '#d6cebd'


def em(h, ppm):
    """metro medido DE BAIXO da célula → linha da imagem"""
    return lambda m: h - m * ppm


def p_predio_janela(var):
    def f(w, h, ppm, rnd):
        Y = em(h, ppm)
        a = reboco(w, h, ppm, rnd, BEGE_P, grao=0.04, manchas=0.05, lad=False)
        branco = reboco(w, h, ppm, rnd, BRANCO_P, grao=0.03, manchas=0.04, lad=False)
        a[int(Y(0.12)):] = branco[int(Y(0.12)):]                       # a laje
        a[:int(Y(2.78))] = branco[:int(Y(2.78))]                       # a verga
        a[int(Y(0.90)):int(Y(0.85))] = branco[int(Y(0.90)):int(Y(0.85))] * 0.97  # o peitoril
        x0, x1 = 0.22 * ppm, w - 0.22 * ppm
        y0, y1 = Y(2.72), Y(0.90)
        esp = max(2, int(0.055 * ppm))
        v = vidro(int(x1 - x0) - 2 * esp, int(y1 - y0) - 2 * esp, rnd, reflexo=0.14 + 0.08 * rnd.random())
        vh, vw = v.shape[:2]
        gx, gy = int(x0) + esp, int(y0) + esp
        # o que se vê lá dentro: cortina branca, persiana, ou nada
        if var == 1:
            cortina(v, vw * 0.52, vw, vh * 0.05, vh, '#e2ddd0', 5, luz=0.62)
        elif var == 2:
            cortina(v, 0, vw * 0.3, vh * 0.05, vh, '#cfc8b8', 3, luz=0.55)
            cortina(v, vw * 0.72, vw, vh * 0.05, vh, '#cfc8b8', 3, luz=0.55)
        elif var == 3:
            persiana(v, 0, vw, 0, vh * 0.55, '#bdbab2', passo=max(3, int(0.035 * ppm)))
            v[:int(vh * 0.55)] *= 0.72
        colar(a, v, gx, gy)
        moldura(a, x0, y0, x1, y1, esp, '#e8e8e3')
        # montantes: três verticais e a travessa da bandeira
        for k in (1, 2, 3):
            x = gx + vw * k / 4
            retangulo(a, x - esp * 0.45, gy, x + esp * 0.45, gy + vh, '#e3e3de')
        ty = gy + 0.42 * ppm
        retangulo(a, gx, ty - esp * 0.45, gx + vw, ty + esp * 0.45, '#e3e3de')
        sombra_interna(a, gx, gy, gx + vw, gy + vh, esp * 1.6, 0.4)
        # o escorrido que desce do peitoril pro bege de baixo
        e = escorrido(h, w, rnd, 5, inicio=(0.69, 0.71), comp=(0.08, 0.2), larg=(1, 3), lad=False)
        a = multiplicar(a, 1 - 0.22 * e)
        return a
    return f


def p_predio_ocre(w, h, ppm, rnd):
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#c49a5e', grao=0.07, manchas=0.08, lad=False, fuligem=10)
    # o veio vertical do painel
    a = multiplicar(a, 1 + 0.06 * borrar(ruido(h, w, 3, rnd, False), 0.5) * np.linspace(1, 1, w)[None, :])
    b = reboco(w, h, ppm, rnd, BRANCO_P, grao=0.03, lad=False)
    a[int(Y(0.12)):] = b[int(Y(0.12)):]
    e = escorrido(h, w, rnd, 6, inicio=(0.0, 0.1), comp=(0.3, 0.9), larg=(1, 3), lad=False)
    return multiplicar(a, 1 - 0.18 * e)


def p_predio_janelinhas(w, h, ppm, rnd):
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#d9d6cf', grao=0.04, manchas=0.07, lad=False)
    b = reboco(w, h, ppm, rnd, BRANCO_P, grao=0.03, lad=False)
    a[int(Y(0.12)):] = b[int(Y(0.12)):]
    jw, jh = 0.58 * ppm, 0.62 * ppm
    esp = max(2, int(0.045 * ppm))
    for cx in (w / 2 - 0.36 * ppm, w / 2 + 0.36 * ppm):
        x0, y0 = cx - jw / 2, Y(1.85)
        v = vidro(int(jw) - 2 * esp, int(jh) - 2 * esp, rnd, reflexo=0.12)
        colar(a, v, x0 + esp, y0 + esp)
        moldura(a, x0, y0, x0 + jw, y0 + jh, esp, '#e7e7e2')
        retangulo(a, x0 - 2, y0 + jh, x0 + jw + 2, y0 + jh + esp, '#dedcd6')
    e = escorrido(h, w, rnd, 4, inicio=(0.38, 0.42), comp=(0.15, 0.35), larg=(1, 2), lad=False)
    return multiplicar(a, 1 - 0.2 * e)


def p_predio_topo(w, h, ppm, rnd):
    """o último andar é casa de máquina: parede cheia com veneziana"""
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#d7d4cc', grao=0.05, manchas=0.10, lad=False)
    b = reboco(w, h, ppm, rnd, BRANCO_P, grao=0.03, lad=False)
    a[int(Y(0.12)):] = b[int(Y(0.12)):]
    vw, vh = 0.52 * ppm, 1.15 * ppm
    x0, y0 = w / 2 - vw / 2, Y(2.05)
    esp = max(2, int(0.04 * ppm))
    retangulo(a, x0, y0, x0 + vw, y0 + vh, '#8e8f8c')
    passo = max(3, int(0.06 * ppm))
    for y in range(int(y0 + esp), int(y0 + vh - esp)):
        f = ((y - y0) % passo) / passo
        a[y, int(x0 + esp):int(x0 + vw - esp)] = cor('#6d6f6c') * (0.7 + 0.5 * f)
    moldura(a, x0, y0, x0 + vw, y0 + vh, esp, '#dcdcd6')
    e = escorrido(h, w, rnd, 9, inicio=(0.0, 0.05), comp=(0.4, 1.0), larg=(1, 4), lad=False)
    return multiplicar(a, 1 - 0.22 * e)


def p_concreto(base, pintas=0, manchas=0.08):
    def f(w, h, ppm, rnd):
        a = reboco(w, h, ppm, rnd, base, grao=0.05, manchas=manchas, pintas=pintas, fuligem=3)
        return a
    return f


def p_predio_vermelho(com_janela):
    def f(w, h, ppm, rnd):
        Y = em(h, ppm)
        a = reboco(w, h, ppm, rnd, '#a8474c', grao=0.05, manchas=0.07, lad=False)
        b = reboco(w, h, ppm, rnd, '#c7c5bf', grao=0.04, lad=False)
        a[int(Y(0.35)):] = b[int(Y(0.35)):]
        if com_janela:
            x0, x1, y0, y1 = 0, w, Y(2.6), Y(1.05)
            v = vidro(w, int(y1 - y0), rnd, reflexo=0.12)
            colar(a, v, 0, y0)
            esp = max(2, int(0.05 * ppm))
            retangulo(a, 0, y0 - esp, w, y0, '#e6e6e1')
            retangulo(a, 0, y1, w, y1 + esp, '#e6e6e1')
            for k in range(0, 4):
                x = k * w / 3
                retangulo(a, x - esp / 2, y0, x + esp / 2, y1, '#e6e6e1')
            # as aletas vermelhas na frente do vidro, e a sombra delas
            for x in (w * 0.0, w * 0.5, w * 1.0):
                retangulo(a, x - 0.07 * ppm, y0 - esp, x + 0.07 * ppm, y1 + esp, '#9c4146')
                a[int(y0):int(y1), int(min(w - 1, x + 0.07 * ppm)):int(min(w, x + 0.16 * ppm))] *= 0.7
            sombra_interna(a, 0, y0, w, y1, esp * 2, 0.35)
        e = escorrido(h, w, rnd, 6, inicio=(0.0, 0.1), comp=(0.2, 0.6), larg=(1, 3), lad=False)
        return multiplicar(a, 1 - 0.18 * e)
    return f


def terreo_base(w, h, ppm, rnd, base='#dfddd6'):
    a = reboco(w, h, ppm, rnd, base, grao=0.05, manchas=0.10, lad=False, fuligem=8)
    a = multiplicar(a, pe_de_parede(h, w, 0.9 * ppm, 0.22))
    rod = int(0.22 * ppm)
    a[h - rod:] = reboco(w, rod, ppm, rnd, '#9d9a92', grao=0.06, lad=False)
    return a


def p_predio_vitrine(w, h, ppm, rnd):
    Y = em(h, ppm)
    a = terreo_base(w, h, ppm, rnd)
    x0, x1, y0, y1 = 0.18 * ppm, w - 0.18 * ppm, Y(3.05), Y(0.45)
    esp = max(3, int(0.07 * ppm))
    v = vidro(int(x1 - x0), int(y1 - y0), rnd, base='#1a1e20', topo='#56646c', reflexo=0.2)
    vh, vw = v.shape[:2]
    # a loja lá dentro: prateleira e um cartaz
    for k in range(4):
        yy = int(vh * (0.35 + 0.16 * k))
        v[yy:yy + 3] = v[yy:yy + 3] * 0.6 + cor('#6f6a60') * 0.4
        for i in range(int(vw / 9)):
            if rnd.random() < 0.7:
                c = cor(['#8a3b30', '#2f5d8a', '#c9a23a', '#3f7a45', '#d8d2c6'][int(rnd.integers(0, 5))]) * 0.55
                hh = int(rnd.integers(6, 14))
                v[max(0, yy - hh):yy, i * 9 + 1:i * 9 + 8] = v[max(0, yy - hh):yy, i * 9 + 1:i * 9 + 8] * 0.4 + c * 0.6
    colar(a, v, x0, y0)
    cx = x0 + vw * 0.2
    retangulo(a, cx, y0 + vh * 0.12, cx + 0.45 * ppm, y0 + vh * 0.12 + 0.6 * ppm, '#e8d64a')
    desenhar(a, lambda d, im: d.text((cx + 3, y0 + vh * 0.12 + 4), 'OFERTA', fill=(190, 30, 30), font=fonte('negrito', 0.11 * ppm)))
    moldura(a, x0 - esp, y0 - esp, x1 + esp, y1 + esp, esp, '#e9e9e4')
    for x in (x0 + vw / 2,):
        retangulo(a, x - esp / 2, y0, x + esp / 2, y1, '#e9e9e4')
    sombra_interna(a, x0, y0, x1, y1, esp * 1.5, 0.35)
    return a


def p_predio_porta(w, h, ppm, rnd):
    Y = em(h, ppm)
    a = terreo_base(w, h, ppm, rnd)
    x0, x1, y0, y1 = 0.35 * ppm, w - 0.35 * ppm, Y(3.05), Y(0.30)
    esp = max(3, int(0.07 * ppm))
    v = vidro(int(x1 - x0), int(y1 - y0), rnd, base='#15191b', topo='#4b5961', reflexo=0.22)
    colar(a, v, x0, y0)
    vh, vw = v.shape[:2]
    moldura(a, x0 - esp, y0 - esp, x1 + esp, y1 + esp, esp, '#e9e9e4')
    ty = y0 + 0.55 * ppm
    retangulo(a, x0, ty - esp / 2, x1, ty + esp / 2, '#e9e9e4')
    retangulo(a, x0 + vw / 2 - esp / 2, ty, x0 + vw / 2 + esp / 2, y1, '#e9e9e4')
    for sx in (-1, 1):
        px = x0 + vw / 2 + sx * 0.18 * ppm
        retangulo(a, px - 2, ty + vh * 0.35, px + 2, ty + vh * 0.35 + 0.35 * ppm, '#b8b8b2')
    # dois degraus
    for k, (yy, rec) in enumerate(((Y(0.30), 0.0), (Y(0.15), 0.12))):
        retangulo(a, 0.1 * ppm + rec * ppm, yy, w - 0.1 * ppm - rec * ppm, yy + 0.15 * ppm, '#bdbab2')
    sombra_interna(a, x0, y0, x1, y1, esp * 1.5, 0.3)
    return a


def p_predio_tapume(w, h, ppm, rnd):
    Y = em(h, ppm)
    a = terreo_base(w, h, ppm, rnd)
    x0, x1, y0, y1 = 0.25 * ppm, w - 0.25 * ppm, Y(3.05), Y(0.22)
    # compensado ocre em chapas, com o veio
    cw = (x1 - x0) / 2
    for i in range(2):
        for j in range(2):
            bx0, by0 = x0 + i * cw, y0 + j * (y1 - y0) / 2
            chapa = reboco(int(cw) - 2, int((y1 - y0) / 2) - 2, ppm, rnd, '#c79f66', grao=0.06, manchas=0.06, lad=False)
            veio = borrar(ruido(chapa.shape[0], chapa.shape[1], 2, rnd, False), 0.6)
            veio = np.repeat(veio[:, :1], chapa.shape[1], axis=1) * 0.5 + veio * 0.5
            chapa = multiplicar(chapa, 1 + 0.12 * veio)
            colar(a, chapa, bx0 + 1, by0 + 1)
    for (px, py) in [(x0 + 6, y0 + 6), (x1 - 8, y0 + 6), (x0 + 6, y1 - 8), (x1 - 8, y1 - 8), (x0 + cw, y0 + 6), (x0 + cw, y1 - 8)]:
        retangulo(a, px - 1, py - 1, px + 2, py + 2, '#6b5c48', sombra=False)
    moldura(a, x0 - 4, y0 - 4, x1 + 4, y1 + 2, 4, '#dcdad3')
    return a


def p_predio_parede(w, h, ppm, rnd):
    Y = em(h, ppm)
    a = terreo_base(w, h, ppm, rnd)
    jw, jh = 1.0 * ppm, 0.7 * ppm
    x0, y0 = w / 2 - jw / 2, Y(3.25)
    esp = max(2, int(0.05 * ppm))
    v = vidro(int(jw) - 2 * esp, int(jh) - 2 * esp, rnd, reflexo=0.1)
    colar(a, v, x0 + esp, y0 + esp)
    moldura(a, x0, y0, x0 + jw, y0 + jh, esp, '#e6e6e1')
    for k in range(1, 7):
        x = x0 + esp + (jw - 2 * esp) * k / 7
        a[int(y0 + esp):int(y0 + jh - esp), int(x):int(x) + max(1, esp // 2)] = cor('#2b2b2a')
    e = escorrido(h, w, rnd, 3, inicio=(0.22, 0.26), comp=(0.2, 0.4), larg=(1, 2), lad=False)
    return multiplicar(a, 1 - 0.2 * e)


def p_piso(base, junta=True):
    def f(w, h, ppm, rnd):
        a = reboco(w, h, ppm, rnd, base, grao=0.06, manchas=0.12, fuligem=6)
        if junta:
            a[:1] *= 0.75
            a[:, :1] *= 0.75
        return a
    return f


def folha_predio():
    F = Folha('predio')
    for k in range(4):
        F.cel(f'jan{k}', 1.8, 2.9, 90, p_predio_janela(k))
    F.cel('ocre', 1.5, 2.9, 90, p_predio_ocre)
    F.cel('janelinhas', 2.4, 2.9, 90, p_predio_janelinhas)
    F.cel('topo', 1.8, 2.9, 90, p_predio_topo)
    F.cel('concreto', 2.0, 2.0, 90, p_concreto('#dcd9d1'), lad=True)
    F.cel('vermelho', 1.8, 3.4, 90, p_predio_vermelho(True))
    F.cel('vermelho_cego', 1.8, 3.4, 90, p_predio_vermelho(False))
    F.cel('vitrine', 2.5, 4.0, 110, p_predio_vitrine)
    F.cel('porta', 2.5, 4.0, 110, p_predio_porta)
    F.cel('tapume', 2.5, 4.0, 110, p_predio_tapume)
    F.cel('parede', 2.5, 4.0, 110, p_predio_parede)
    F.cel('terraco', 2.0, 2.0, 80, p_piso('#a9a69e'), lad=True)
    F.cel('cobertura', 2.0, 2.0, 70, p_piso('#8c8a84', junta=False), lad=True)
    return F.montar()


# =========================================================
#   2. A IGREJA MATRIZ — barroco mineiro
#   Reboco branco chapiscado, cantaria ocre nas pilastras e molduras,
#   porta e janelas verdes, cúpula bulbosa nas torres.
# =========================================================
REBOCO_IGREJA = '#e9e8e2'
PEDRA = '#c9b389'
VERDE_PORTA = '#5d8b70'

# O CONTORNO DO FRONTÃO, em metros, do canto de baixo à esquerda. É o
# mesmo desenho pro 3D (que extruda o polígono) e pra pintura (que
# acompanha a borda com a cantaria) — uma fonte só, exportada no atlas.
FRONTAO_L, FRONTAO_A = 5.65, 3.40
_meio = [(2.825, 3.40), (3.18, 3.40), (3.30, 3.24), (3.52, 3.06), (3.80, 2.74), (4.06, 2.34),
         (4.26, 1.98), (4.52, 1.72), (4.84, 1.56), (5.10, 1.36), (5.31, 1.06), (5.47, 0.70),
         (5.60, 0.34), (5.65, 0.0)]
FRONTAO = [(round(FRONTAO_L - x, 3), y) for x, y in reversed(_meio[1:])] + _meio


def reboco_igreja(w, h, ppm, rnd, lad=True):
    a = reboco(w, h, ppm, rnd, REBOCO_IGREJA, grao=0.04, manchas=0.05, pintas=400, lad=lad)
    # o chapisco é granulado cinza miúdo: é ele que faz a parede "branca de igreja velha".
    # Fraco: com o contraste alto ele lia como granito, não como caiação
    area = (w / ppm) * (h / ppm)
    g = np.clip(pontos(h, w, 1800 * area, 0.3, 0.75, rnd, lad, sinal=1.0), 0, 1)
    return multiplicar(a, 1 - 0.15 * g)


def pedra(w, h, ppm, rnd, lad=True, base=PEDRA):
    a = reboco(w, h, ppm, rnd, base, grao=0.08, manchas=0.12, pintas=300, lad=lad, fuligem=30)
    veio = fbm(h, w, 0.25 * ppm, rnd, 3, lad)
    a = multiplicar(a, 1 + 0.10 * veio)
    # o escurecido de tempo, mais forte embaixo
    ys = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    return multiplicar(a, np.broadcast_to(1 - 0.10 * ys, (h, w)))


def p_reboco_igreja(w, h, ppm, rnd):
    a = reboco_igreja(w, h, ppm, rnd, True)
    e = escorrido(h, w, rnd, 7, inicio=(0.0, 0.5), comp=(0.2, 0.5), larg=(1, 3), lad=True)
    return multiplicar(a, 1 - 0.10 * e)


def p_cantaria(w, h, ppm, rnd):
    a = pedra(w, h, ppm, rnd, True)
    # juntas de bloco, a cada 0,6 m
    for k in range(int(round(h / (0.6 * ppm)))):
        y = int(k * 0.6 * ppm)
        a[y:y + 1] *= 0.78
    return a


def mascara_arco(w, h, x0, x1, ytopo, ymola, ybaixo, cheio=False):
    """vão com arco: retângulo de `ymola` pra baixo e meia elipse em
       cima (arco abatido, ou pleno se `cheio`)"""
    def f(d):
        d.rectangle([x0, ymola, x1, ybaixo], fill=255)
        flecha = ymola - ytopo
        d.chord([x0, ymola - flecha, x1, ymola + flecha], 180, 360, fill=255)
    return mascara_forma(w, h, f)


def verde_madeira(w, h, ppm, rnd, base=VERDE_PORTA):
    a = reboco(w, h, ppm, rnd, base, grao=0.07, manchas=0.14, lad=False)
    veio = borrar(ruido(h, w, 2.5, rnd, False), 0.4)
    veio = np.repeat(veio[:1, :], h, axis=0) * 0.6 + veio * 0.4          # veio vertical
    return multiplicar(a, 1 + 0.10 * veio)


def portal(w, h, ppm, rnd, abertura, recheio, banda=0.2, cheio=False):
    """o vão (porta, janela, sineira) com a moldura de cantaria em volta e
       o reboco da igreja fora dela. `abertura` = (x0, x1, topo, mola, baixo)
       em metros medidos de CIMA/ESQUERDA da célula"""
    x0, x1, yt, ym, yb = [v * ppm for v in abertura]
    b = banda * ppm
    a = reboco_igreja(w, h, ppm, rnd, False)
    ped = pedra(w, h, ppm, rnd, False)
    fora = mascara_arco(w, h, x0 - b, x1 + b, yt - b, ym, yb)
    dentro = mascara_arco(w, h, x0, x1, yt, ym, yb)
    aplicar(a, ped, np.clip(fora - dentro, 0, 1))
    miolo = recheio(w, h)
    aplicar(a, miolo, dentro)
    # a sombra que a moldura joga pra dentro do vão: forte rente à borda,
    # somindo pro meio — é o que dá fundura sem geometria nenhuma
    perto_da_borda = dentro * np.clip(1 - borrar(dentro, 0.06 * ppm), 0, 1) * 2
    a *= (1 - 0.45 * np.clip(perto_da_borda, 0, 1))[..., None]
    return a


def p_porta_igreja(w, h, ppm, rnd):
    ab = (0.35, 2.05, 0.55, 1.0, 4.2)          # arco abatido: flecha de 0,45 num vão de 1,7
    def recheio(W, H):
        v = verde_madeira(W, H, ppm, rnd)
        x0, x1, y0 = ab[0] * ppm, ab[1] * ppm, ab[3] * ppm
        meio = (x0 + x1) / 2
        v[:, int(meio) - 1:int(meio) + 2] *= 0.55                      # a fresta entre as folhas
        for folha in ((x0, meio), (meio, x1)):
            fx0, fx1 = folha
            for k, (a0, a1) in enumerate(((1.25, 2.15), (2.35, 3.25), (3.45, 3.95))):
                px0, px1 = fx0 + 0.16 * ppm, fx1 - 0.16 * ppm
                retangulo(v, px0, a0 * ppm, px1, a1 * ppm, v[int(a0 * ppm) + 2, int(px0) + 2] * 1.06, relevo=0.16)
        # ferragem
        for sx in (-1, 1):
            retangulo(v, meio + sx * 0.10 * ppm - 2, 2.55 * ppm, meio + sx * 0.10 * ppm + 2, 2.75 * ppm, '#3a3a34', sombra=False)
        return v
    return portal(w, h, ppm, rnd, ab, recheio, banda=0.24)


def janela_verde(W, H, ppm, rnd, x0, x1, y0, y1, grade_baixo=False):
    """caixilho verde de guilhotina com vidro escuro, e o guarda-corpo
       de balaústre na parte de baixo quando é janela de sacada"""
    v = vidro(W, H, rnd, base='#1c2224', topo='#55636a', reflexo=0.16)
    esp = max(3, int(0.07 * ppm))
    a = v
    moldura(a, x0, y0, x1, y1, esp, VERDE_PORTA)
    meio = (x0 + x1) / 2
    retangulo(a, meio - esp / 2, y0, meio + esp / 2, y1, VERDE_PORTA)
    for k in (1, 2):
        yy = y0 + (y1 - y0) * k / 3
        retangulo(a, x0, yy - esp / 2, x1, yy + esp / 2, VERDE_PORTA)
    if grade_baixo:
        yb0 = y1 - 0.9 * ppm
        retangulo(a, x0, yb0, x1, yb0 + esp * 1.3, '#4f7a60')
        n = int((x1 - x0) / (0.12 * ppm))
        for i in range(n + 1):
            x = x0 + (x1 - x0) * i / max(1, n)
            retangulo(a, x - esp * 0.4, yb0, x + esp * 0.4, y1, '#4f7a60', sombra=False)
    return a


def p_sacada(w, h, ppm, rnd):
    ab = (0.25, 1.45, 0.42, 0.75, 3.0)
    def recheio(W, H):
        return janela_verde(W, H, ppm, rnd, ab[0] * ppm, ab[1] * ppm, ab[2] * ppm - 0.2 * ppm, ab[4] * ppm, True)
    return portal(w, h, ppm, rnd, ab, recheio, banda=0.18)


def p_janela_lateral(w, h, ppm, rnd):
    ab = (0.25, 1.05, 0.25, 0.65, 2.4)
    def recheio(W, H):
        return janela_verde(W, H, ppm, rnd, ab[0] * ppm, ab[1] * ppm, ab[2] * ppm - 0.2 * ppm, ab[4] * ppm, False)
    return portal(w, h, ppm, rnd, ab, recheio, banda=0.16)


def p_janelinha_igreja(w, h, ppm, rnd):
    ab = (0.2, 0.7, 0.2, 0.2, 0.95)
    def recheio(W, H):
        return janela_verde(W, H, ppm, rnd, ab[0] * ppm, ab[1] * ppm, ab[2] * ppm, ab[4] * ppm, False)
    return portal(w, h, ppm, rnd, ab, recheio, banda=0.12)


def p_porta_lateral(w, h, ppm, rnd):
    ab = (0.3, 1.4, 0.3, 0.55, 3.0)
    def recheio(W, H):
        v = verde_madeira(W, H, ppm, rnd)
        meio = (ab[0] + ab[1]) / 2 * ppm
        v[:, int(meio) - 1:int(meio) + 1] *= 0.6
        return v
    return portal(w, h, ppm, rnd, ab, recheio, banda=0.18)


def p_sineira(w, h, ppm, rnd):
    ab = (0.25, 1.05, 0.25, 0.7, 2.6)
    def recheio(W, H):
        v = chapado(W, H, '#2a2724')
        v = multiplicar(v, 1 + 0.2 * ruido(H, W, 6, rnd, False))
        # o sino, de bronze, pendurado lá dentro
        cx, top = (ab[0] + ab[1]) / 2 * ppm, 1.05 * ppm
        s = 0.28 * ppm
        desenhar(v, lambda d, im: d.polygon([(cx - s * 0.35, top), (cx + s * 0.35, top), (cx + s * 0.55, top + s * 0.9),
                                              (cx + s * 0.8, top + s * 1.3), (cx - s * 0.8, top + s * 1.3),
                                              (cx - s * 0.55, top + s * 0.9)], fill=(92, 72, 40)))
        return v
    return portal(w, h, ppm, rnd, ab, recheio, banda=0.18)


def p_losango(w, h, ppm, rnd):
    a = reboco_igreja(w, h, ppm, rnd, False)
    ped = pedra(w, h, ppm, rnd, False)
    cx, cy = w / 2, h / 2
    def diamante(r):
        return lambda d: d.polygon([(cx, cy - r), (cx + r * 0.78, cy), (cx, cy + r), (cx - r * 0.78, cy)], fill=255)
    fora = mascara_forma(w, h, diamante(h * 0.48))
    dentro = mascara_forma(w, h, diamante(h * 0.33))
    aplicar(a, ped, np.clip(fora - dentro, 0, 1))
    aplicar(a, vidro(w, h, rnd, base='#1a2022', topo='#4a585e'), dentro)
    return a


def p_oculo(anel):
    def f(w, h, ppm, rnd):
        a = reboco_igreja(w, h, ppm, rnd, False)
        ped = pedra(w, h, ppm, rnd, False)
        r0, r1 = w * 0.47, w * (0.47 - anel)
        fora = mascara_forma(w, h, lambda d: d.ellipse([w / 2 - r0, h / 2 - r0, w / 2 + r0, h / 2 + r0], fill=255))
        dentro = mascara_forma(w, h, lambda d: d.ellipse([w / 2 - r1, h / 2 - r1, w / 2 + r1, h / 2 + r1], fill=255))
        aplicar(a, ped, np.clip(fora - dentro, 0, 1))
        aplicar(a, vidro(w, h, rnd, base='#191c1d', topo='#3c4448', reflexo=0.08), dentro)
        return a
    return f


def p_placa(w, h, ppm, rnd):
    a = pedra(w, h, ppm, rnd, False, base='#cbb68f')
    retangulo(a, 0.08 * ppm, 0.08 * ppm, w - 0.08 * ppm, h - 0.08 * ppm, a[int(h / 2), int(w / 2)] * 0.92, relevo=0.2)
    desenhar(a, lambda d, im: d.text((w / 2, h / 2), 'MDCCLXXII', fill=(120, 100, 70), anchor='mm', font=fonte('negrito', 0.12 * ppm)))
    return a


def p_frontao(w, h, ppm, rnd):
    """o frontão: reboco com a cantaria correndo por dentro do contorno,
       as duas volutas e o medalhão no meio"""
    a = reboco_igreja(w, h, ppm, rnd, False)
    ped = pedra(w, h, ppm, rnd, False)
    P = lambda x, y: (x * ppm, h - y * ppm)
    cont = [P(x, y) for x, y in FRONTAO]
    fora = mascara_forma(w, h, lambda d: d.polygon(cont, fill=255))
    # a faixa de cantaria acompanha a borda, 0,16 m pra dentro
    dentro = np.clip(borrar(fora, 0.16 * ppm * 0.6), 0, 1)
    borda = np.clip((fora - (dentro > 0.97)).astype(np.float32), 0, 1)
    aplicar(a, ped, borda * fora)
    # as volutas: espirais em relevo de cantaria perto dos cantos de baixo
    def espiral(cx, cy, r, sentido):
        pts = []
        for i in range(90):
            t = i / 89 * 2.6 * np.pi
            rr = r * (1 - i / 110)
            pts.append((cx + sentido * rr * np.cos(t), cy - rr * np.sin(t)))
        return pts
    def vol(d):
        for sentido, cx in ((1, 0.85), (-1, FRONTAO_L - 0.85)):
            ptos = espiral(cx * ppm, h - 0.72 * ppm, 0.42 * ppm, sentido)
            d.line(ptos, fill=255, width=max(3, int(0.09 * ppm)))
    mv = mascara_forma(w, h, vol, 0.6)
    aplicar(a, ped, mv * fora)
    a *= (1 - 0.25 * np.clip(borrar(mv, 2.5) - mv, 0, 1) * fora)[..., None]
    # o medalhão: oval de cantaria com um coração (as armas da matriz)
    cx, cy = w / 2, h - 1.85 * ppm
    rx, ry = 0.55 * ppm, 0.78 * ppm
    anel = mascara_forma(w, h, lambda d: d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], outline=255, width=max(3, int(0.1 * ppm))))
    aplicar(a, ped, anel)
    cor_rel = pedra(w, h, ppm, rnd, False, base='#bfa77c')
    cora = mascara_forma(w, h, lambda d: (d.ellipse([cx - 0.28 * ppm, cy - 0.30 * ppm, cx + 0.02 * ppm, cy - 0.02 * ppm], fill=255),
                                          d.ellipse([cx - 0.02 * ppm, cy - 0.30 * ppm, cx + 0.28 * ppm, cy - 0.02 * ppm], fill=255),
                                          d.polygon([(cx - 0.27 * ppm, cy - 0.12 * ppm), (cx + 0.27 * ppm, cy - 0.12 * ppm), (cx, cy + 0.36 * ppm)], fill=255)), 0.5)
    aplicar(a, cor_rel, cora)
    a *= (1 - 0.3 * np.clip(borrar(cora + anel, 2.0) - (cora + anel), 0, 1))[..., None]
    # fora do contorno não aparece (o 3D recorta), mas a margem fica igual à borda
    return a


def p_cupula(w, h, ppm, rnd):
    """a cúpula bulbosa: ocre, oito gomos (a célula dá a volta inteira)"""
    a = reboco(w, h, ppm, rnd, '#c6ab80', grao=0.07, manchas=0.12, pintas=250, fuligem=12)
    xs = np.linspace(0, 8 * 2 * np.pi, w, endpoint=False, dtype=np.float32)
    gomo = 0.86 + 0.14 * np.cos(xs)
    ys = np.linspace(0, 1, h, dtype=np.float32)
    return a * gomo[None, :, None] * (0.9 + 0.12 * ys)[:, None, None]


def folha_igreja():
    F = Folha('igreja')
    F.cel('reboco', 3.0, 3.0, 90, p_reboco_igreja, lad=True)
    F.cel('cantaria', 1.2, 2.4, 90, p_cantaria, lad=True)
    F.cel('porta', 2.4, 4.45, 115, p_porta_igreja)
    F.cel('sacada', 1.7, 3.2, 110, p_sacada)
    F.cel('janela', 1.3, 2.6, 100, p_janela_lateral)
    F.cel('janelinha', 0.9, 1.15, 110, p_janelinha_igreja)
    F.cel('porta_lat', 1.7, 3.2, 110, p_porta_lateral)
    F.cel('sineira', 1.3, 2.8, 100, p_sineira)
    F.cel('losango', 1.3, 1.3, 110, p_losango)
    F.cel('oculo', 1.0, 1.0, 110, p_oculo(0.12))
    F.cel('oculo_p', 0.5, 0.5, 110, p_oculo(0.14))
    F.cel('placa', 0.9, 0.6, 130, p_placa)
    F.cel('frontao', FRONTAO_L, FRONTAO_A, 90, p_frontao)
    F.cel('cupula', 3.0, 2.0, 90, p_cupula, lad=True)
    F.cel('telha', 2.1, 2.16, 90, lambda w, h, ppm, rnd: telhas(w, h, ppm, rnd, ['#8b4330', '#7d3a2a', '#96503a', '#6f3325'], musgo=0.25), lad=True)
    F.extras['frontao'] = FRONTAO
    return F.montar()


# =========================================================
#   3. O PRÉDIO DE 3 ANDARES COM O MERCADO EMBAIXO
#   Reboco amarelo-claro, faixa marrom em volta das janelas, persiana
#   branca, toldo, ar-condicionado, letreiro verde, porta de enrolar.
# =========================================================
AMARELO = '#e2c98f'
MARROM = '#86664e'
NOME_MERCADO = 'MERCADO SÃO JOÃO'


def p_reboco_amarelo(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, AMARELO, grao=0.04, manchas=0.12, fuligem=4)
    e = escorrido(h, w, rnd, 6, inicio=(0.0, 0.6), comp=(0.15, 0.45), larg=(1, 3), lad=True)
    return multiplicar(a, 1 - 0.12 * e)


def faixa_marrom(w, h, ppm, rnd):
    """a faixa marrom é pastilha miúda: o rejunte aparece de perto"""
    a = reboco(w, h, ppm, rnd, MARROM, grao=0.05, manchas=0.08, lad=False)
    passo = 0.05 * ppm
    for x in np.arange(0, w, passo):
        a[:, int(x):int(x) + 1] *= 0.9
    for y in np.arange(0, h, passo):
        a[int(y):int(y) + 1, :] *= 0.9
    return a


def janela_persiana(a, x0, y0, x1, y1, ppm, rnd, aberta=0.0, placa=None):
    esp = max(3, int(0.05 * ppm))
    v = vidro(int(x1 - x0), int(y1 - y0), rnd, base='#20262a', topo='#5d6a72', reflexo=0.15)
    vh, vw = v.shape[:2]
    persiana(v, 0, vw, 0, vh, '#efeee9', passo=max(4, int(0.045 * ppm)), aberta=aberta)
    colar(a, v, x0, y0)
    moldura(a, x0, y0, x1, y1, esp, '#d9d9d4')
    retangulo(a, (x0 + x1) / 2 - esp / 2, y0, (x0 + x1) / 2 + esp / 2, y1, '#d9d9d4')
    retangulo(a, x0 - esp, y1, x1 + esp, y1 + esp * 1.4, '#cfc9bd')          # o peitoril
    if placa:
        px0, py0 = x0 + (x1 - x0) * 0.58, y0 + (y1 - y0) * 0.18
        pw, ph = 0.36 * ppm, 0.26 * ppm
        retangulo(a, px0, py0, px0 + pw, py0 + ph, '#f4f1e8')
        retangulo(a, px0, py0, px0 + pw, py0 + ph * 0.35, '#c62d2d', sombra=False)
        desenhar(a, lambda d, im: (d.text((px0 + pw / 2, py0 + ph * 0.18), placa, fill=(255, 255, 255), anchor='mm', font=fonte('negrito', 0.055 * ppm)),
                                    d.text((px0 + pw / 2, py0 + ph * 0.68), 'TRATAR AQUI', fill=(30, 30, 30), anchor='mm', font=fonte('negrito', 0.04 * ppm))))


def p_loja_faixa(var):
    def f(w, h, ppm, rnd):
        Y = em(h, ppm)
        a = faixa_marrom(w, h, ppm, rnd)
        x0, x1 = w / 2 - 0.85 * ppm, w / 2 + 0.85 * ppm
        janela_persiana(a, x0, Y(2.38), x1, Y(1.05), ppm, rnd, aberta=[0.0, 0.45, 0.0][var],
                        placa=['', '', 'ALUGA-SE'][var] or None)
        e = escorrido(h, w, rnd, 5, inicio=(0.63, 0.66), comp=(0.1, 0.3), larg=(1, 2), lad=False)
        return multiplicar(a, 1 - 0.2 * e)
    return f


def p_loja_faixa_lateral(w, h, ppm, rnd):
    Y = em(h, ppm)
    a = faixa_marrom(w, h, ppm, rnd)
    janela_persiana(a, w / 2 - 0.36 * ppm, Y(2.38), w / 2 + 0.36 * ppm, Y(1.05), ppm, rnd, aberta=0.3 * rnd.random())
    return a


def p_ar(w, h, ppm, rnd):
    """a condensadora do ar split: gabinete branco, a grade redonda do
       ventilador à direita e a veneziana à esquerda"""
    a = reboco(w, h, ppm, rnd, '#e8e8e4', grao=0.03, manchas=0.05, lad=False)
    cx, cy, r = w * 0.64, h * 0.5, h * 0.40
    fundo = mascara_forma(w, h, lambda d: d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255))
    aplicar(a, '#3b3d3e', fundo)
    def grade(d):
        for k in range(1, 6):
            rr = r * k / 5.6
            d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=210, width=1)
        for k in range(8):
            t = k / 8 * 2 * math.pi
            d.line([(cx, cy), (cx + r * math.cos(t), cy + r * math.sin(t))], fill=200, width=1)
    aplicar(a, '#d0d0cc', mascara_forma(w, h, grade) * fundo)
    for y in np.arange(h * 0.15, h * 0.85, 0.035 * ppm):
        a[int(y):int(y) + 2, int(w * 0.08):int(w * 0.34)] *= 0.72
    retangulo(a, w * 0.08, h * 0.08, w * 0.24, h * 0.13, '#8d9296', sombra=False)
    return multiplicar(a, pe_de_parede(h, w, h * 0.3, 0.2))


def p_ar_lado(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#dededa', grao=0.03, lad=False)
    for y in np.arange(h * 0.2, h * 0.8, 0.03 * ppm):
        a[int(y):int(y) + 1, int(w * 0.2):int(w * 0.8)] *= 0.7
    return a


def p_toldo(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#eeede7', grao=0.03, manchas=0.06, lad=False)
    xs = np.linspace(0, w / (0.08 * ppm) * 2 * np.pi, w, dtype=np.float32)
    a *= (0.9 + 0.1 * np.cos(xs))[None, :, None]
    e = escorrido(h, w, rnd, 8, inicio=(0.1, 0.5), comp=(0.3, 0.6), larg=(1, 2), lad=False)
    a = multiplicar(a, 1 - 0.18 * e)
    return multiplicar(a, pe_de_parede(h, w, h * 0.25, 0.2))


def p_letreiro(w, h, ppm, rnd):
    """o letreiro do mercado: chapa verde, nome em branco, o círculo da
       marca na ponta e as frutas na outra"""
    ys = np.linspace(0, 1, h, dtype=np.float32)
    a = (cor('#34923f')[None, :] * (1 - ys[:, None]) + cor('#246c2e')[None, :] * ys[:, None])[:, None, :] * np.ones((1, w, 1), np.float32)
    a = multiplicar(a, 1 + 0.04 * fbm(h, w, 0.3 * ppm, rnd, 3, False))
    borda = max(3, int(0.05 * ppm))
    moldura(a, 0, 0, w, h, borda, '#dcdcd6')
    # a marca: círculo vermelho com uma maçã branca
    cx, cy, r = 0.62 * ppm, h / 2, h * 0.36
    desenhar(a, lambda d, im: (d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(200, 40, 40), outline=(245, 245, 240), width=max(2, int(0.03 * ppm))),
                                d.ellipse([cx - r * 0.42, cy - r * 0.30, cx + r * 0.42, cy + r * 0.50], fill=(250, 250, 245)),
                                d.line([(cx, cy - r * 0.30), (cx + r * 0.12, cy - r * 0.62)], fill=(250, 250, 245), width=max(2, int(0.02 * ppm)))))
    # as frutas: laranja, maçã, banana, uva
    def frutas(d, im):
        base_x = w - 1.35 * ppm
        cores = [(236, 140, 30), (200, 35, 40), (245, 205, 60), (110, 40, 110), (90, 160, 60), (236, 140, 30)]
        for i in range(14):
            fx = base_x + rnd.random() * 1.1 * ppm
            fy = h * (0.25 + rnd.random() * 0.55)
            rr = h * (0.10 + rnd.random() * 0.08)
            c = cores[int(rnd.integers(0, len(cores)))]
            d.ellipse([fx - rr, fy - rr, fx + rr, fy + rr], fill=c, outline=(40, 60, 30))
    desenhar(a, frutas)
    f1 = fonte('negrito', h * 0.46)
    desenhar(a, lambda d, im: (d.text((w * 0.5, h * 0.40), NOME_MERCADO, fill=(40, 40, 30), anchor='mm', font=f1),
                                d.text((w * 0.5 - 2, h * 0.40 - 2), NOME_MERCADO, fill=(252, 252, 246), anchor='mm', font=f1),
                                d.text((w * 0.5, h * 0.80), 'HORTIFRUTI · FRIOS · BEBIDAS · TELE-ENTREGA', fill=(240, 240, 232), anchor='mm', font=fonte('negrito', h * 0.14))))
    return a


def interior_loja(W, H, ppm, rnd, luz=1.0):
    """o que se vê lá dentro: prateleira cheia de mercadoria colorida"""
    a = chapado(W, H, '#3a3631') * luz
    ys = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    a = a * (0.8 + 0.4 * ys)
    passo = 0.32 * ppm
    y = 0.25 * ppm
    cores = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2980b9', '#ecf0f1', '#8e44ad', '#d35400', '#16a085']
    while y < H - 0.3 * ppm:
        a[int(y):int(y) + 3] = cor('#8d8a82') * luz
        x = 0
        while x < W:
            pw = rnd.uniform(0.05, 0.12) * ppm
            ph = rnd.uniform(0.12, 0.26) * ppm
            if rnd.random() < 0.85:
                c = cor(cores[int(rnd.integers(0, len(cores)))]) * (0.55 + 0.25 * rnd.random()) * luz
                a[max(0, int(y - ph)):int(y), int(x):int(x + pw - 1)] = c
            x += pw
        y += passo
    return a


def p_loja_vitrine(w, h, ppm, rnd):
    a = interior_loja(w, h, ppm, rnd)
    v = vidro(w, h, rnd, base='#000000', topo='#8595a0', reflexo=0.22)
    a = a * 0.75 + v * 0.35
    esp = max(3, int(0.06 * ppm))
    moldura(a, 0, 0, w, h, esp, '#4a3b30')
    retangulo(a, w * 0.62, 0, w * 0.62 + esp, h, '#4a3b30')
    # cartazes amarelos colados no vidro
    for (px, py, txt) in ((0.12, 0.30, 'OFERTA'), (0.34, 0.55, 'PROMOÇÃO'), (0.70, 0.25, 'AÇOUGUE')):
        x0, y0 = w * px, h * py
        pw, ph = 0.55 * ppm, 0.42 * ppm
        retangulo(a, x0, y0, x0 + pw, y0 + ph, '#f2dc3a')
        desenhar(a, lambda d, im, x0=x0, y0=y0, pw=pw, ph=ph, txt=txt: (
            d.text((x0 + pw / 2, y0 + ph * 0.35), txt, fill=(200, 25, 25), anchor='mm', font=fonte('negrito', 0.075 * ppm)),
            d.text((x0 + pw / 2, y0 + ph * 0.72), 'R$ 9,99', fill=(20, 20, 20), anchor='mm', font=fonte('negrito', 0.09 * ppm))))
    return a


def p_enrolar(w, h, ppm, rnd):
    """porta de enrolar recolhida até pouco mais da metade: embaixo
       aparece a loja acesa"""
    a = interior_loja(w, h, ppm, rnd, luz=1.15)
    corte = int(h * 0.46)
    metal = reboco(w, corte, ppm, rnd, '#8e9193', grao=0.04, manchas=0.1, lad=False)
    passo = max(3, int(0.075 * ppm))
    for y in range(corte):
        f = (y % passo) / passo
        metal[y] *= 0.78 + 0.3 * math.sin(f * math.pi)
    a[:corte] = metal
    a[corte:corte + 3] = cor('#555756')
    a[corte + 3:corte + 7] *= 0.55
    retangulo(a, 0, 0, w, 0.16 * ppm, '#7d8082')                        # a caixa do rolo
    return a


def p_tijolinho(w, h, ppm, rnd):
    return tijolos(w, h, ppm, rnd, ['#5c3d2e', '#6b4636', '#4f3427', '#734c3a'], argamassa='#3b2e27')


def p_garagem(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#6d4b36', grao=0.05, manchas=0.12, lad=False)
    passo = max(4, int(0.11 * ppm))
    for x in range(w):
        f = (x % passo) / passo
        a[:, x] *= 0.8 + 0.3 * math.sin(f * math.pi)
    moldura(a, 0, 0, w, h, max(3, int(0.06 * ppm)), '#5a3d2c')
    # a plaquinha azul da firma de segurança
    px, py, pw, ph = w * 0.62, h * 0.30, 0.34 * ppm, 0.42 * ppm
    retangulo(a, px, py, px + pw, py + ph, '#f0f0ea')
    retangulo(a, px + 3, py + 3, px + pw - 3, py + ph * 0.55, '#1f3f86', sombra=False)
    desenhar(a, lambda d, im: (d.text((px + pw / 2, py + ph * 0.3), 'ALARME', fill=(250, 250, 250), anchor='mm', font=fonte('negrito', 0.055 * ppm)),
                                d.text((px + pw / 2, py + ph * 0.78), '24 H', fill=(200, 30, 30), anchor='mm', font=fonte('negrito', 0.07 * ppm))))
    e = escorrido(h, w, rnd, 8, inicio=(0.0, 0.2), comp=(0.3, 0.8), larg=(1, 3), lad=False)
    return multiplicar(a, 1 - 0.2 * e)


def p_cartaz(txt, fundo='#f2dc3a', tinta=(200, 25, 25)):
    def f(w, h, ppm, rnd):
        a = reboco(w, h, ppm, rnd, fundo, grao=0.03, lad=False)
        moldura(a, 0, 0, w, h, 2, '#d6c22f' if fundo == '#f2dc3a' else '#cfcfca')
        linhas = txt.split('|')
        def t(d, im):
            for i, l in enumerate(linhas):
                # a fonte encolhe até a linha caber em 86% da largura
                tam = 0.11 * ppm
                while tam > 6 and fonte('negrito', tam).getlength(l) > w * 0.86:
                    tam *= 0.92
                d.text((w / 2, h * (i + 0.7) / (len(linhas) + 0.4)), l, fill=tinta if i == 0 else (25, 25, 25), anchor='mm',
                       font=fonte('negrito', tam))
        desenhar(a, t)
        return a
    return f


def p_basculante(w, h, ppm, rnd):
    a = chapado(w, h, '#b9bdbd')
    passo = max(4, int(0.1 * ppm))
    for y in range(h):
        f = (y % passo) / passo
        a[y] *= 0.8 + 0.25 * f
    moldura(a, 0, 0, w, h, max(3, int(0.05 * ppm)), '#c9c9c4')
    return a


def folha_loja():
    F = Folha('loja')
    F.cel('reboco', 2.5, 2.5, 110, p_reboco_amarelo, lad=True)
    for k in range(3):
        F.cel(f'faixa{k}', 2.6, 2.9, 105, p_loja_faixa(k))
    F.cel('faixa_lat', 1.2, 2.9, 105, p_loja_faixa_lateral)
    F.cel('ar', 0.85, 0.6, 200, p_ar)
    F.cel('ar_lado', 0.32, 0.6, 200, p_ar_lado)
    F.cel('toldo', 1.4, 1.0, 110, p_toldo)
    F.cel('letreiro', 10.0, 1.1, 110, p_letreiro)
    F.cel('vitrine', 3.3, 2.7, 130, p_loja_vitrine)
    F.cel('enrolar', 3.0, 2.7, 130, p_enrolar)
    F.cel('tijolinho', 1.84, 1.2, 120, p_tijolinho, lad=True)
    F.cel('garagem', 3.0, 2.5, 120, p_garagem)
    F.cel('aluga', 0.8, 0.55, 200, p_cartaz('ALUGA-SE|TRATAR NO LOCAL'))
    F.cel('vende', 0.6, 0.45, 200, p_cartaz('VENDE-SE|APTO 2 QTOS', fundo='#f4f3ee', tinta=(200, 30, 30)))
    F.cel('oferta', 0.6, 0.85, 180, p_cartaz('OFERTA|CARNE|R$ 19,90'))
    F.cel('basculante', 0.9, 0.5, 150, p_basculante)
    F.cel('telha', 2.1, 2.16, 110, lambda w, h, ppm, rnd: telhas(w, h, ppm, rnd, ['#b85f3a', '#c56b42', '#a95334', '#cf7a4c']), lad=True)
    F.cel('laje', 2.0, 2.0, 70, p_piso('#9c9a93', junta=False), lad=True)
    return F.montar()


# =========================================================
#   4. O CENTRO ADMINISTRATIVO
#   Pilotis branco, tijolo aparente entre as faixas brancas, janela
#   em fita de vidro azul, faixa verde-azulada na laje, toldo azul.
# =========================================================
TIJOLO_ADM = ['#a0523a', '#94492f', '#aa5c41', '#8c4530', '#b0644a']


def tijolo_adm(w, h, ppm, rnd, lad=False):
    return tijolos(w, h, ppm, rnd, TIJOLO_ADM, argamassa='#c4b8a8', lad=lad)


def p_adm_modulo(com_janela):
    def f(w, h, ppm, rnd):
        Y = em(h, ppm)
        a = tijolo_adm(w, h, ppm, rnd)
        b = reboco(w, h, ppm, rnd, '#ecebe6', grao=0.03, lad=False)
        for (y0, y1) in ((0, 0.25), (0.95, 1.03), (2.33, 2.45)):
            a[int(Y(y1)):int(Y(y0))] = b[int(Y(y1)):int(Y(y0))]
        if com_janela:
            x0, x1, yt, yb = 0.1 * ppm, w - 0.1 * ppm, Y(2.33), Y(1.03)
            v = vidro(int(x1 - x0), int(yb - yt), rnd, base='#1f3b6e', topo='#6f8fbf', reflexo=0.2)
            colar(a, v, x0, yt)
            esp = max(2, int(0.05 * ppm))
            moldura(a, x0, yt, x1, yb, esp, '#eeeeea')
            for k in (1, 2):
                x = x0 + (x1 - x0) * k / 3
                retangulo(a, x - esp / 2, yt, x + esp / 2, yb, '#eeeeea')
            retangulo(a, x0, yt + 0.38 * ppm - esp / 2, x1, yt + 0.38 * ppm + esp / 2, '#eeeeea')
            sombra_interna(a, x0, yt, x1, yb, esp * 1.6, 0.35)
        e = escorrido(h, w, rnd, 5, inicio=(0.0, 0.3), comp=(0.2, 0.5), larg=(1, 2), lad=False)
        return multiplicar(a, 1 - 0.15 * e)
    return f


def p_adm_terreo(tipo):
    def f(w, h, ppm, rnd):
        Y = em(h, ppm)
        if tipo == 'tijolo':
            a = tijolo_adm(w, h, ppm, rnd)
            x0, x1, yt, yb = 0.3 * ppm, w - 0.3 * ppm, Y(2.5), Y(1.0)
            v = vidro(int(x1 - x0), int(yb - yt), rnd, base='#1f3b6e', topo='#6f8fbf')
            colar(a, v, x0, yt)
            moldura(a, x0, yt, x1, yb, max(2, int(0.05 * ppm)), '#eeeeea')
            return multiplicar(a, pe_de_parede(h, w, 0.6 * ppm, 0.2))
        a = vidro(w, h, rnd, base='#15212e', topo='#50657a', reflexo=0.2)
        esp = max(3, int(0.06 * ppm))
        moldura(a, 0, 0, w, h, esp, '#dcdcd8')
        retangulo(a, 0, Y(2.6) - esp / 2, w, Y(2.6) + esp / 2, '#dcdcd8')
        if tipo == 'porta':
            retangulo(a, w / 2 - esp / 2, Y(2.6), w / 2 + esp / 2, h, '#dcdcd8')
            for sx in (-1, 1):
                retangulo(a, w / 2 + sx * 0.14 * ppm - 2, Y(1.25), w / 2 + sx * 0.14 * ppm + 2, Y(0.9), '#b9b9b4')
        else:
            retangulo(a, w / 2 - esp / 2, 0, w / 2 + esp / 2, h, '#dcdcd8')
        return a
    return f


def p_adm_faixa(w, h, ppm, rnd):
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#ecebe6', grao=0.03, lad=True)
    a[int(Y(0.34)):int(Y(0.18))] = reboco(w, int(Y(0.18)) - int(Y(0.34)), ppm, rnd, '#2c8196', grao=0.04, lad=True)
    return a


def p_adm_platibanda(w, h, ppm, rnd):
    Y = em(h, ppm)
    a = tijolo_adm(w, h, ppm, rnd, lad=True)
    b = reboco(w, h, ppm, rnd, '#eeede8', grao=0.03, lad=True)
    a[:int(Y(0.62))] = b[:int(Y(0.62))]
    e = escorrido(h, w, rnd, 6, inicio=(0.2, 0.25), comp=(0.3, 0.7), larg=(1, 2), lad=True)
    return multiplicar(a, 1 - 0.15 * e)


def p_adm_toldo(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#3b5189', grao=0.04, manchas=0.08, lad=False)
    xs = np.linspace(0, w / (0.1 * ppm) * 2 * np.pi, w, dtype=np.float32)
    a *= (0.86 + 0.14 * np.cos(xs))[None, :, None]
    return multiplicar(a, pe_de_parede(h, w, h * 0.3, 0.25))


def folha_adm():
    F = Folha('adm')
    F.cel('modulo', 2.44, 3.2, 90, p_adm_modulo(True))
    F.cel('modulo_cheio', 2.44, 3.2, 90, p_adm_modulo(False))
    F.cel('terreo_vidro', 2.44, 3.4, 90, p_adm_terreo('vidro'))
    F.cel('terreo_porta', 2.44, 3.4, 90, p_adm_terreo('porta'))
    F.cel('terreo_tijolo', 2.44, 3.4, 90, p_adm_terreo('tijolo'))
    F.cel('faixa', 2.44, 0.5, 90, p_adm_faixa, lad=True)
    F.cel('platibanda', 2.44, 0.8, 90, p_adm_platibanda, lad=True)
    F.cel('toldo', 2.3, 1.0, 90, p_adm_toldo)
    F.cel('concreto', 1.0, 2.0, 90, p_concreto('#eceae4'), lad=True)
    F.cel('tijolo', 2.3, 1.5, 90, lambda w, h, ppm, rnd: tijolo_adm(w, h, ppm, rnd, lad=True), lad=True)
    F.cel('laje', 3.0, 3.0, 60, p_piso('#8f8e89', junta=False), lad=True)
    return F.montar()


# =========================================================
#   5. A CASA DE CLASSE MÉDIA
#   Sobrado cinza com portão de garagem, a edícula verde do lado com
#   portão de grade, telha cerâmica laranja nas duas.
# =========================================================
def reboco_casa(base):
    def f(w, h, ppm, rnd):
        a = reboco(w, h, ppm, rnd, base, grao=0.04, manchas=0.10, fuligem=10)
        # as manchas de sujeira que a foto tem: borrões cinza soltos
        area = (w / ppm) * (h / ppm)
        m = borrar(np.clip(pontos(h, w, 3 * area, 2, 7, rnd, True, sinal=1.0), 0, 1), 3)
        a = multiplicar(a, 1 - 0.18 * m)
        e = escorrido(h, w, rnd, 5, inicio=(0.0, 0.5), comp=(0.15, 0.4), larg=(1, 3), lad=True)
        return multiplicar(a, 1 - 0.12 * e)
    return f


def p_portao_garagem(w, h, ppm, rnd):
    """portão de correr: lambri fechado em cima, grade embaixo com a
       garagem escura atrás, e a travessa no meio"""
    Y = em(h, ppm)
    fundo = chapado(w, h, '#3c3a37')
    ys = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    a = fundo * (0.7 + 0.5 * ys)
    chao = int(Y(0.35))
    a[chao:] = reboco(w, h - chao, ppm, rnd, '#9e9c96', grao=0.05, lad=False)
    lambri = reboco(w, int(Y(1.2)), ppm, rnd, '#d2d3cf', grao=0.03, manchas=0.06, lad=False)
    passo = max(4, int(0.09 * ppm))
    for x in range(w):
        f = (x % passo) / passo
        lambri[:, x] *= 0.84 + 0.2 * math.sin(f * math.pi)
    a[:lambri.shape[0]] = lambri
    for x in np.arange(0.05 * ppm, w, 0.11 * ppm):
        retangulo(a, x, Y(1.2), x + 0.025 * ppm, h - 0.04 * ppm, '#d8d9d5')
    esp = max(3, int(0.06 * ppm))
    moldura(a, 0, 0, w, h, esp, '#dadbd7')
    retangulo(a, 0, Y(1.2) - esp / 2, w, Y(1.2) + esp / 2, '#dadbd7')
    retangulo(a, w / 2 - esp / 2, 0, w / 2 + esp / 2, h, '#dadbd7')
    e = escorrido(h, w, rnd, 6, inicio=(0.0, 0.2), comp=(0.3, 0.6), larg=(1, 2), lad=False)
    return multiplicar(a, 1 - 0.12 * e)


def p_janela_grade(w, h, ppm, rnd):
    a = vidro(w, h, rnd, base='#5b6770', topo='#b8c6cf', reflexo=0.25)
    esp = max(3, int(0.07 * ppm))
    moldura(a, 0, 0, w, h, esp, '#f0f0ec')
    retangulo(a, w / 2 - esp / 2, 0, w / 2 + esp / 2, h, '#f0f0ec')
    # a grade de ferro preta por dentro: quadriculado
    nx, ny = 6, 5
    for i in range(1, nx):
        x = esp + (w - 2 * esp) * i / nx
        retangulo(a, x - 2, esp, x + 2, h - esp, '#1d1d1c', sombra=False)
    for j in range(1, ny):
        y = esp + (h - 2 * esp) * j / ny
        retangulo(a, esp, y - 2, w - esp, y + 2, '#1d1d1c', sombra=False)
    return a


def p_janelinha_vidro(w, h, ppm, rnd):
    a = vidro(w, h, rnd, base='#7a5a3c', topo='#c79a6a', reflexo=0.2)      # reflete a telha laranja
    moldura(a, 0, 0, w, h, max(3, int(0.06 * ppm)), '#efefeb')
    return a


def p_basculante_grade(w, h, ppm, rnd):
    a = vidro(w, h, rnd, base='#4a4f52', topo='#9aa3a8')
    esp = max(3, int(0.06 * ppm))
    moldura(a, 0, 0, w, h, esp, '#efefeb')
    for i in range(1, 5):
        x = w * i / 5
        retangulo(a, x - 2, esp, x + 2, h - esp, '#202020', sombra=False)
    return a


def p_porta_madeira(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#7a5a3e', grao=0.06, manchas=0.1, lad=False)
    veio = borrar(ruido(h, w, 2, rnd, False), 0.5)
    a = multiplicar(a, 1 + 0.12 * (np.repeat(veio[:1], h, axis=0) * 0.6 + veio * 0.4))
    moldura(a, 0, 0, w, h, max(3, int(0.06 * ppm)), '#e8e8e3')
    retangulo(a, w * 0.78, h * 0.5, w * 0.84, h * 0.53, '#c9b77a', sombra=False)
    return a


def p_faixa(base):
    def f(w, h, ppm, rnd):
        return reboco(w, h, ppm, rnd, base, grao=0.03, manchas=0.06, fuligem=3)
    return f


def p_cumeeira(w, h, ppm, rnd):
    a = chapado(w, h, '#c47d45')
    ys = np.linspace(0, np.pi, h, dtype=np.float32)
    a *= (0.6 + 0.45 * np.sin(ys))[:, None, None]
    passo = 0.42 * ppm
    for x in np.arange(0, w, passo):
        a[:, int(x):int(x) + 2] *= 0.55
    return multiplicar(a, 1 + 0.08 * fbm(h, w, 0.1 * ppm, rnd, 3, True))


def folha_casa():
    F = Folha('casa')
    F.cel('cinza', 2.5, 2.5, 120, reboco_casa('#d7d6d1'), lad=True)
    F.cel('verde', 2.5, 2.5, 120, reboco_casa('#b8ccb3'), lad=True)
    F.cel('portao', 4.3, 2.55, 110, p_portao_garagem)
    F.cel('janela_grade', 1.4, 1.1, 160, p_janela_grade)
    F.cel('janelinha', 0.6, 0.6, 160, p_janelinha_vidro)
    F.cel('basculante', 0.6, 0.9, 160, p_basculante_grade)
    F.cel('porta', 0.9, 2.1, 140, p_porta_madeira)
    F.cel('telha', 2.1, 2.16, 115, lambda w, h, ppm, rnd: telhas(w, h, ppm, rnd, ['#cf8a4c', '#c47d42', '#d9965a', '#b8703a', '#d48f50']), lad=True)
    F.cel('cumeeira', 1.26, 0.3, 115, p_cumeeira, lad=True)
    F.cel('escura', 2.0, 0.3, 110, p_faixa('#5d5f61'), lad=True)
    F.cel('branca', 2.0, 0.35, 110, p_faixa('#eeeeea'), lad=True)
    F.cel('piso', 2.0, 2.0, 90, p_piso('#b3b1ab'), lad=True)
    return F.montar()


# =========================================================
#   6. AS GRADES VAZADAS (PNG com alfa)
#   O portão da edícula e a grade da frente do mercado: dá pra ver
#   através, então o 3D usa recorte por alfa.
# =========================================================
def p_grade(cor_barra, passo, larg_barra, travessas, quadrada=False):
    def f(w, h, ppm, rnd):
        a = np.zeros((h, w, 4), np.float32)
        c = cor(cor_barra)
        Y = em(h, ppm)
        bw = max(2, larg_barra * ppm)
        n = max(1, int(round(w / (passo * ppm))))
        for i in range(n):
            x = (i + 0.5) * w / n
            x0, x1 = int(x - bw / 2), int(x + bw / 2) + 1
            xs = np.linspace(-1, 1, x1 - x0, dtype=np.float32)
            sombra = np.ones_like(xs) if quadrada else (0.72 + 0.32 * np.cos(xs * np.pi / 2))
            a[:, x0:x1, :3] = c * sombra[None, :, None]
            a[:, x0:x1, 3] = 1
        for y in travessas:
            y0 = int(Y(y) - bw * 0.8)
            a[max(0, y0):int(Y(y) + bw * 0.8), :, :3] = c * 0.95
            a[max(0, y0):int(Y(y) + bw * 0.8), :, 3] = 1
        return a
    return f


def p_portao_lanca(w, h, ppm, rnd):
    """portão de ferro preto de barra redonda com ponta de lança"""
    a = p_grade('#171818', 0.1, 0.022, (0.12, 1.0), quadrada=False)(w, h, ppm, rnd)
    Y = em(h, ppm)
    a[:int(Y(2.1))] = 0                                   # nada acima da lança
    im = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(im)
    n = max(1, int(round(w / (0.1 * ppm))))
    for i in range(n):
        x = (i + 0.5) * w / n
        d.polygon([(x - 0.03 * ppm, Y(2.02)), (x + 0.03 * ppm, Y(2.02)), (x, Y(2.18))], fill=255)
    m = np.asarray(im, np.float32) / 255
    a[..., :3] = a[..., :3] * (1 - m[..., None]) + cor('#171818') * m[..., None]
    a[..., 3] = np.maximum(a[..., 3], m)
    return a


def p_gr_rede(w, h, ppm, rnd):
    """a rede de vôlei: a malha preta de 10 cm (alfa). A corda é mais
       grossa que a de verdade (2 cm): mais fina, a malha some de longe."""
    a = np.zeros((h, w, 4), np.float32)
    passo = w / max(1, int(round(w / (0.1 * ppm))))
    esp = max(2, int(round(0.02 * ppm)))
    for x in np.arange(0, w, passo):
        a[:, int(x):int(x) + esp] = [0.1, 0.1, 0.1, 1]
    passo_y = h / max(1, int(round(h / (0.1 * ppm))))
    for y in np.arange(0, h, passo_y):
        a[int(y):int(y) + esp, :] = [0.1, 0.1, 0.1, 1]
    return a


def folha_grades():
    F = Folha('grades', larg=512, alfa=True)
    F.cel('branca', 1.0, 2.5, 120, p_grade('#f1f1ee', 0.1, 0.028, (0.06, 1.25, 2.44)), lad=True)
    F.cel('preta', 1.0, 2.2, 120, p_grade('#1e1e1d', 0.12, 0.03, (0.06, 1.1, 2.14), quadrada=True), lad=True)
    F.cel('lanca', 1.0, 2.2, 120, p_portao_lanca, lad=True)
    F.cel('gradil', 1.0, 1.0, 120, p_grade('#e9eaec', 0.09, 0.022, (0.04, 0.95)), lad=True)
    F.cel('bananeira', 1.6, 2.4, 80, p_bananeira)
    F.cel('ferrugem', 1.0, 2.0, 120, p_grade('#6e4632', 0.1, 0.022, (0.1, 1.05, 1.9)), lad=True)
    F.cel('antena', 0.8, 0.8, 120, p_antena)
    F.cel('varal', 2.0, 0.6, 110, p_varal)
    # a rede do vôlei da praia (praia3d.js): a malha, com alfa
    F.cel('rede', 1.0, 1.0, 120, p_gr_rede, lad=True)
    return F.montar()



# =========================================================
#   7. AS CASAS DA CIDADE — cinco tipos que vestem os lotes
#   A casa térrea branca e suja, a casa de tijolo inacabada, a casa
#   com ponto comercial embaixo, o sobrado com laje e caixa d'água e
#   o casarão colonial. As paredes saem CLARAS e neutras: a cor da
#   casa vem do vértice (a tinta multiplica), então uma célula de
#   reboco serve pro sobrado verde e pro mercado azul.
# =========================================================
def p_parede_suja(w, h, ppm, rnd):
    """o reboco branco e encardido da casa térrea: escorrido escuro que
       desce do beiral, mancha de umidade embaixo"""
    a = reboco(w, h, ppm, rnd, '#ebebe8', grao=0.05, manchas=0.10, fuligem=8)
    e = escorrido(h, w, rnd, 18, inicio=(0.0, 0.25), comp=(0.3, 0.95), larg=(1, 5), lad=True)
    a = multiplicar(a, 1 - 0.30 * e)
    area = (w / ppm) * (h / ppm)
    m = borrar(np.clip(pontos(h, w, 2 * area, 3, 9, rnd, True, sinal=1.0), 0, 1), 4)
    return multiplicar(a, 1 - 0.14 * m)


def p_parede_lisa(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#f1f1ee', grao=0.035, manchas=0.07, fuligem=3)
    e = escorrido(h, w, rnd, 6, inicio=(0.0, 0.3), comp=(0.2, 0.6), larg=(1, 3), lad=True)
    return multiplicar(a, 1 - 0.12 * e)


def p_parede_crua(w, h, ppm, rnd):
    """reboco cru, sem tinta: é assim o lado e o fundo de quase toda casa
       de bairro — só a frente leva pintura"""
    a = reboco(w, h, ppm, rnd, '#b9b6ae', grao=0.07, manchas=0.18, fuligem=14)
    e = escorrido(h, w, rnd, 10, inicio=(0.0, 0.3), comp=(0.3, 0.9), larg=(1, 4), lad=True)
    return multiplicar(a, 1 - 0.2 * e)


def p_tijolo_casa(w, h, ppm, rnd):
    return tijolos(w, h, ppm, rnd, ['#a55a44', '#9a513c', '#b0624a', '#8f4a36', '#a8604a', '#b56b52'],
                   argamassa='#9e968a', tam=(0.23, 0.075), junta=0.014, var=0.14)


def p_laje_borda(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#9d9b95', grao=0.07, manchas=0.15, fuligem=10)
    e = escorrido(h, w, rnd, 10, inicio=(0.3, 0.6), comp=(0.4, 0.9), larg=(1, 3), lad=True)
    return multiplicar(a, 1 - 0.25 * e)


def p_calha(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#8e9193', grao=0.03, manchas=0.08, lad=True)
    ys = np.linspace(0, 1, h, dtype=np.float32)
    return a * (0.75 + 0.35 * np.sin(ys * np.pi))[:, None, None]


def moldura_simples(a, ppm, x0, y0, x1, y1, cor_mold='#e8e8e3', esp_m=0.05):
    esp = max(2, int(esp_m * ppm))
    moldura(a, x0, y0, x1, y1, esp, cor_mold)
    return esp


def p_jan2(w, h, ppm, rnd):
    """janela de duas folhas de correr, vidro escuro, e o peitoril"""
    a = vidro(w, h, rnd, base='#1a1f22', topo='#56636b', reflexo=0.18)
    esp = moldura_simples(a, ppm, 0, 0, w, h * 0.93, '#dcdcd7')
    retangulo(a, w / 2 - esp / 2, 0, w / 2 + esp / 2, h * 0.93, '#dcdcd7')
    retangulo(a, 0, h * 0.93, w, h, '#cfcbc2')
    sombra_interna(a, esp, esp, w - esp, h * 0.93 - esp, esp * 1.5, 0.3)
    return a


def p_basc(w, h, ppm, rnd):
    a = vidro(w, h, rnd, base='#20262a', topo='#5d6a72', reflexo=0.1)
    esp = moldura_simples(a, ppm, 0, 0, w, h, '#dcdcd7')
    retangulo(a, w / 2 - esp / 2, 0, w / 2 + esp / 2, h, '#dcdcd7')
    retangulo(a, 0, h / 2 - esp / 2, w, h / 2 + esp / 2, '#dcdcd7')
    return a


def p_porta_vene(w, h, ppm, rnd):
    """porta de chapa com a metade de cima em veneziana"""
    a = reboco(w, h, ppm, rnd, '#d9dad6', grao=0.03, manchas=0.08, lad=False)
    esp = moldura_simples(a, ppm, 0, 0, w, h, '#c9cac5', 0.06)
    passo = max(3, int(0.05 * ppm))
    for y in range(int(h * 0.1), int(h * 0.48)):
        f = ((y - int(h * 0.1)) % passo) / passo
        a[y, int(w * 0.18):int(w * 0.82)] *= 0.7 + 0.35 * f
    retangulo(a, w * 0.16, h * 0.08, w * 0.84, h * 0.09, '#b5b6b1', sombra=False)
    retangulo(a, w * 0.74, h * 0.52, w * 0.82, h * 0.55, '#8a8b86', sombra=False)
    e = escorrido(h, w, rnd, 4, inicio=(0.5, 0.6), comp=(0.2, 0.4), larg=(1, 2), lad=False)
    return multiplicar(multiplicar(a, 1 - 0.15 * e), pe_de_parede(h, w, h * 0.12, 0.25))


def p_veneziana_mad(w, h, ppm, rnd):
    """janela de madeira de duas folhas, fechada"""
    a = reboco(w, h, ppm, rnd, '#5e4535', grao=0.06, manchas=0.12, lad=False)
    passo = max(3, int(0.045 * ppm))
    for y in range(h):
        f = (y % passo) / passo
        a[y] *= 0.8 + 0.28 * f
    esp = moldura_simples(a, ppm, 0, 0, w, h * 0.92, '#4a362a', 0.05)
    retangulo(a, w / 2 - esp / 2, 0, w / 2 + esp / 2, h * 0.92, '#4a362a')
    retangulo(a, -2, h * 0.92, w + 2, h, '#8f8c85')
    return a


def p_jan_vidro(w, h, ppm, rnd):
    a = vidro(w, h, rnd, base='#39506e', topo='#9fb4c8', reflexo=0.25)
    esp = moldura_simples(a, ppm, 0, 0, w, h, '#c9ccce', 0.045)
    for k in (1, 2):
        y = h * k / 3
        retangulo(a, esp, y - 1, w - esp, y + 1, '#c9ccce', sombra=False)
    return a


def p_porta_ferro(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#6d6f6c', grao=0.05, manchas=0.2, lad=False, fuligem=20)
    ferr = np.clip(fbm(h, w, 0.2 * ppm, rnd, 3, False) * 3 - 0.2, 0, 1)
    aplicar(a, '#7a4a2e', ferr * 0.6)                      # a ferrugem
    moldura_simples(a, ppm, 0, 0, w, h, '#5b5d5a', 0.05)
    for y in (h * 0.3, h * 0.65):
        retangulo(a, w * 0.12, y, w * 0.88, y + h * 0.18, a[int(y) + 2, int(w * 0.5)] * 1.05, relevo=0.15)
    retangulo(a, w * 0.78, h * 0.5, w * 0.86, h * 0.53, '#3b3c3a', sombra=False)
    return a


def enrolar(w, h, ppm, rnd, aberta):
    """porta de enrolar: as lâminas de chapa, a caixa do rolo em cima e,
       se `aberta`, o comércio aparecendo embaixo"""
    a = interior_loja(w, h, ppm, rnd, luz=1.1) if aberta else np.zeros((h, w, 3), np.float32)
    corte = int(h * (0.52 if aberta else 1.0))
    metal = reboco(w, corte, ppm, rnd, '#c2c4c3', grao=0.03, manchas=0.1, lad=False, fuligem=6)
    passo = max(3, int(0.065 * ppm))
    for y in range(corte):
        f = (y % passo) / passo
        metal[y] *= 0.78 + 0.3 * math.sin(f * math.pi)
        if f > 0.9:
            metal[y] *= 0.8
    a[:corte] = metal
    if aberta:
        a[corte:corte + 3] = cor('#5b5d5c')
        a[corte + 3:corte + 8] *= 0.5
    else:
        a[int(h * 0.95):] *= 0.7                                           # a soleira
    retangulo(a, 0, 0, w, 0.13 * ppm, '#9ea09f')
    for x in (0, w - 0.05 * ppm):
        retangulo(a, x, 0.13 * ppm, x + 0.05 * ppm, h, '#8d8f8e', sombra=False)
    e = escorrido(h, w, rnd, 6, inicio=(0.05, 0.1), comp=(0.3, 0.8), larg=(1, 3), lad=False)
    return multiplicar(a, 1 - 0.18 * e)


def p_promocoes(w, h, ppm, rnd):
    """o quadro-negro de promoções pregado na parede"""
    a = reboco(w, h, ppm, rnd, '#1f2021', grao=0.04, manchas=0.1, lad=False)
    moldura_simples(a, ppm, 0, 0, w, h, '#3a3a38', 0.03)
    itens = ['ARROZ 5KG 21,90', 'FEIJÃO 1KG 7,49', 'CAFÉ 500G 16,90', 'ÓLEO 900ML 7,99',
             'AÇÚCAR 5KG 19,90', 'FARINHA 1KG 5,49']
    carnes = ['ACÉM 1KG 32,90', 'FRANGO 1KG 13,90', 'LINGUIÇA 1KG 19,90', 'COSTELA 1KG 27,90']
    fT = fonte('negrito', 0.07 * ppm)
    fI = fonte('normal', 0.038 * ppm)
    def t(d, im):
        d.text((w / 2, h * 0.07), '% PROMOÇÕES %', fill=(235, 235, 230), anchor='mm', font=fonte('negrito', 0.045 * ppm))
        for i, it in enumerate(itens):
            d.text((w * 0.08, h * (0.13 + i * 0.055)), it, fill=(225, 225, 220), anchor='lm', font=fI)
        d.text((w / 2, h * 0.52), 'CARNES', fill=(240, 240, 235), anchor='mm', font=fT)
        for i, it in enumerate(carnes):
            d.text((w * 0.08, h * (0.62 + i * 0.07)), it, fill=(225, 225, 220), anchor='lm', font=fI)
    desenhar(a, t)
    return a


def p_jan_cortina(w, h, ppm, rnd):
    """janela de correr com a cortina de lâmina vertical cinza"""
    a = vidro(w, h, rnd, base='#20262a', topo='#667780', reflexo=0.16)
    esp = moldura_simples(a, ppm, 0, 0, w, h * 0.94, '#cfd1d0')
    passo = max(3, int(0.08 * ppm))
    for x in range(esp, w - esp):
        f = ((x - esp) % passo) / passo
        a[esp:int(h * 0.94) - esp, x] = a[esp:int(h * 0.94) - esp, x] * 0.35 + cor('#9a9c9b') * (0.55 + 0.25 * math.sin(f * math.pi))
    retangulo(a, w / 2 - esp / 2, 0, w / 2 + esp / 2, h * 0.94, '#cfd1d0')
    retangulo(a, -2, h * 0.94, w + 2, h, '#c4c1b8')
    return a


def p_porta_ap(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#8c8f8e', grao=0.04, manchas=0.12, lad=False)
    moldura_simples(a, ppm, 0, 0, w, h, '#707372', 0.05)
    v = vidro(int(w * 0.5), int(h * 0.3), rnd, reflexo=0.12)
    colar(a, v, w * 0.25, h * 0.12)
    for x in np.linspace(w * 0.3, w * 0.7, 4):
        retangulo(a, x - 1, h * 0.12, x + 1, h * 0.42, '#2a2a29', sombra=False)
    retangulo(a, w * 0.76, h * 0.52, w * 0.84, h * 0.55, '#3b3c3a', sombra=False)
    return a


def p_porta_alu(w, h, ppm, rnd):
    """porta de alumínio branco de lambril"""
    a = reboco(w, h, ppm, rnd, '#f0f0ee', grao=0.02, manchas=0.05, lad=False)
    passo = max(3, int(0.07 * ppm))
    for y in range(int(h * 0.05), int(h * 0.97)):
        f = (y % passo) / passo
        a[y, int(w * 0.08):int(w * 0.92)] *= 0.86 + 0.16 * f
    moldura_simples(a, ppm, 0, 0, w, h, '#d9dad6', 0.05)
    retangulo(a, w * 0.78, h * 0.5, w * 0.86, h * 0.53, '#8b8c88', sombra=False)
    return multiplicar(a, pe_de_parede(h, w, h * 0.1, 0.2))


def p_jan_grade(w, h, ppm, rnd):
    """janela com grade de ferro preta de barra vertical e a cortina
       branca atrás"""
    a = vidro(w, h, rnd, base='#39424a', topo='#9aa6ae', reflexo=0.14)
    cortina(a, w * 0.05, w * 0.95, h * 0.05, h * 0.95, '#e8e6df', 9, luz=0.72)
    esp = moldura_simples(a, ppm, 0, 0, w, h, '#1e1f1f', 0.045)
    n = int(w / (0.07 * ppm))
    for i in range(1, n):
        x = w * i / n
        retangulo(a, x - 1.5, esp, x + 1.5, h - esp, '#161717', sombra=False)
    for y in (h * 0.25, h * 0.75):
        retangulo(a, esp, y - 1.5, w - esp, y + 1.5, '#161717', sombra=False)
    return a


def p_caixa_dagua(w, h, ppm, rnd):
    """o plástico azul da caixa d'água: a célula dá a volta inteira"""
    a = reboco(w, h, ppm, rnd, '#2336a8', grao=0.04, manchas=0.06, lad=True)
    xs = np.linspace(0, 16 * 2 * np.pi, w, endpoint=False, dtype=np.float32)
    a *= (0.88 + 0.12 * np.cos(xs))[None, :, None]
    ys = np.linspace(0, 1, h, dtype=np.float32)
    return a * (0.8 + 0.3 * ys)[:, None, None]


AMARELO_COL = '#d8a826'
AZUL_COL = '#2447c4'


def p_col_janela(w, h, ppm, rnd):
    """janela de guilhotina colonial: quadro amarelo, vidraça miúda de
       caixilho azul"""
    a = chapado(w, h, AMARELO_COL)
    a = multiplicar(a, 1 + 0.05 * fbm(h, w, 0.2 * ppm, rnd, 3, False))
    b = int(0.1 * ppm)
    moldura(a, 0, 0, w, h, b, AMARELO_COL)
    v = chapado(w - 2 * b, h - 2 * b, '#f4f5f7')
    vh, vw = v.shape[:2]
    nx, ny = 5, 7
    for i in range(nx):
        for j in range(ny):
            x0, y0 = i * vw / nx + 2, j * vh / ny + 2
            x1, y1 = (i + 1) * vw / nx - 2, (j + 1) * vh / ny - 2
            g = vidro(int(x1 - x0), int(y1 - y0), rnd, base='#26407a', topo='#8aa3d8', reflexo=0.25)
            colar(v, g, x0, y0)
    colar(a, v, b, b)
    retangulo(a, b, h / 2 - 2, w - b, h / 2 + 2, '#e9eaec')
    return a


def p_col_porta(w, h, ppm, rnd):
    """porta colonial: moldura amarela, requadro azul e as duas folhas
       escuras de almofada em cruz"""
    a = chapado(w, h, AMARELO_COL)
    a = multiplicar(a, 1 + 0.05 * fbm(h, w, 0.2 * ppm, rnd, 3, False))
    b = int(0.12 * ppm)
    retangulo(a, b, b, w - b, h, AZUL_COL)
    c = int(0.08 * ppm)
    folha = reboco(int(w - 2 * b - 2 * c), int(h - b - c), ppm, rnd, '#3d3f41', grao=0.05, manchas=0.1, lad=False)
    fh, fw = folha.shape[:2]
    for x0 in (0, fw // 2):
        retangulo(folha, x0 + fw * 0.08, fh * 0.1, x0 + fw * 0.42, fh * 0.46, folha[int(fh * 0.2), int(x0 + fw * 0.2)] * 1.12, relevo=0.2)
        retangulo(folha, x0 + fw * 0.08, fh * 0.54, x0 + fw * 0.42, fh * 0.9, folha[int(fh * 0.6), int(x0 + fw * 0.2)] * 1.12, relevo=0.2)
    folha[:, fw // 2 - 1:fw // 2 + 1] *= 0.5
    colar(a, folha, b + c, b + c)
    return a


def p_col_arco(w, h, ppm, rnd):
    """a porta-janela em arco do andar de cima: arco amarelo, o fundo
       azul da bandeira e a porta de vidraça branca"""
    a = np.zeros((h, w, 3), np.float32)
    b = int(0.1 * ppm)
    fora = mascara_arco(w, h, 0, w, 0, w / 2, h, cheio=True)
    dentro = mascara_arco(w, h, b, w - b, b, w / 2 + b * 0.2, h, cheio=True)
    aplicar(a, AMARELO_COL, fora)
    aplicar(a, AZUL_COL, dentro)
    # a porta de vidraça, retangular, embaixo do arco
    px0, px1, py0 = b + 0.05 * ppm, w - b - 0.05 * ppm, w / 2 + 0.05 * ppm
    porta = chapado(int(px1 - px0), int(h - py0), '#f3f4f5')
    ph, pw = porta.shape[:2]
    for i in range(4):
        for j in range(6):
            x0, y0 = (i % 2) * pw / 2 + (i // 2) * 0 + 3, j * ph / 6 + 3
            if i >= 2:
                continue
            for k in range(2):
                xx0 = (i * pw / 2) + k * pw / 4 + 3
                g = vidro(int(pw / 4 - 6), int(ph / 6 - 6), rnd, base='#2a3d63', topo='#93a8cf', reflexo=0.2)
                colar(porta, g, xx0, y0)
    porta[:, pw // 2 - 2:pw // 2 + 2] *= 0.8
    colar(a, porta, px0, py0)
    return multiplicar(a, 1 + 0.04 * fbm(h, w, 0.2 * ppm, rnd, 3, False))



# =========================================================
#   8. AS CASAS GRANDES DA FAVELA — a casa de laje com terraço, a
#   casa rosa de quintal e muro, o bar e a lanchonete KI-DELÍCIA.
#   Entram na folha das CASAS (é a mesma malha da favela); o pé de
#   bananeira, recortado, vai pra folha das grades.
# =========================================================
VERDE_FAV = '#2f6a3c'


def caber(d, texto, larg, alt, tipo='negrito'):
    """a maior fonte (até `alt` px) em que `texto` cabe em `larg` px"""
    tam = alt
    while tam > 6:
        f = fonte(tipo, tam)
        if d.textlength(texto, font=f) <= larg:
            return f
        tam *= 0.92
    return fonte(tipo, 6)


def p_fibro(sujeira):
    """telha de fibrocimento ondulada: a onda corre no sentido da água,
       e o limo e a fuligem escorrem por ela"""
    def f(w, h, ppm, rnd):
        a = reboco(w, h, ppm, rnd, '#bdbeb9', grao=0.04, manchas=0.10 + 0.08 * sujeira, lad=True)
        xs = np.arange(w, dtype=np.float32) / w * 6 * 2 * np.pi
        a *= (0.8 + 0.26 * np.sin(xs))[None, :, None]
        m = np.clip(fbm(h, w, 0.5 * ppm, rnd, 4, True) * 2.2 - 0.3 + 0.4 * sujeira, 0, 1)
        e = escorrido(h, w, rnd, int(8 + 22 * sujeira), inicio=(0.0, 1.0), comp=(0.2, 0.7), larg=(1, 3), lad=True)
        a = multiplicar(a, 1 - (0.28 + 0.32 * sujeira) * m - 0.22 * e)
        a[:max(2, int(0.03 * ppm))] *= 0.78                  # a emenda de uma placa na outra
        return a
    return f


def p_grama(w, h, ppm, rnd):
    """o quintal: grama rala com terra aparecendo"""
    a = multiplicar(chapado(w, h, '#5b7b37'), 1 + 0.35 * fbm(h, w, 0.6 * ppm, rnd, 4, True))
    terra = np.clip(fbm(h, w, 0.8 * ppm, rnd, 3, True) * 2.5 - 0.35, 0, 1)
    aplicar(a, '#7e6b49', terra * 0.6)
    p = pontos(h, w, (w / ppm) * (h / ppm) * 500, 0.6, 1.3, rnd, True)
    return multiplicar(a, 1 + 0.2 * p)


def p_piso_bar(w, h, ppm, rnd):
    """o piso de cerâmica cinza do bar, placa de 40 cm"""
    a = reboco(w, h, ppm, rnd, '#cac8c0', grao=0.03, manchas=0.08, lad=True)
    n, passo = 3, w / 3
    for i in range(n):
        for j in range(n):
            a[int(j * passo):int((j + 1) * passo), int(i * passo):int((i + 1) * passo)] *= 0.92 + 0.16 * rnd.random()
    rej = max(1, int(0.008 * ppm))
    for k in range(n):
        x = int(k * passo)
        a[:, x:x + rej] = cor('#8e8b84')
        a[x:x + rej, :] = cor('#8e8b84')
    s = np.clip(fbm(h, w, 0.4 * ppm, rnd, 3, True) * 2 - 0.4, 0, 1)
    return multiplicar(a, 1 - 0.2 * s)


def p_azulejo(w, h, ppm, rnd):
    """o ladrilho vermelho e preto da escada do bar"""
    a = np.zeros((h, w, 3), np.float32)
    n = 4
    cores = ['#8e2a22', '#6e1f1a', '#2a2422', '#a23a2c', '#5a2a22']
    for i in range(n):
        for j in range(n):
            a[int(j * h / n):int((j + 1) * h / n), int(i * w / n):int((i + 1) * w / n)] = \
                cor(cores[int(rnd.integers(0, len(cores)))]) * (0.9 + 0.2 * rnd.random())
    rej = max(1, int(0.006 * ppm))
    for k in range(n):
        a[:, int(k * w / n):int(k * w / n) + rej] = cor('#b8b0a4')
        a[int(k * h / n):int(k * h / n) + rej, :] = cor('#b8b0a4')
    return multiplicar(a, 1 + 0.08 * ruido(h, w, max(2, w / 8), rnd, True))


def caixilho_verde(a, x0, y0, x1, y1, nx, ny, ppm, rnd, verde=VERDE_FAV, esp_m=0.035):
    """uma grade de vidrinhos com caixilho de ferro verde"""
    esp = max(2, int(esp_m * ppm))
    v = vidro(int(x1 - x0), int(y1 - y0), rnd, base='#26353a', topo='#8aa2ad', reflexo=0.22)
    colar(a, v, x0, y0)
    for i in range(nx + 1):
        x = x0 + (x1 - x0) * i / nx
        retangulo(a, x - esp / 2, y0, x + esp / 2, y1, verde)
    for j in range(ny + 1):
        y = y0 + (y1 - y0) * j / ny
        retangulo(a, x0, y - esp / 2, x1, y + esp / 2, verde)


def p_porta_verde(w, h, ppm, rnd):
    """a porta de ferro verde com vidrinho em cima (a casa de laje)"""
    a = reboco(w, h, ppm, rnd, VERDE_FAV, grao=0.05, manchas=0.15, lad=False)
    moldura_simples(a, ppm, 0, 0, w, h, '#24522e', 0.05)
    caixilho_verde(a, w * 0.12, h * 0.07, w * 0.88, h * 0.55, 2, 4, ppm, rnd)
    retangulo(a, w * 0.12, h * 0.6, w * 0.88, h * 0.93, cor(VERDE_FAV) * 0.92, relevo=0.15)
    retangulo(a, w * 0.78, h * 0.56, w * 0.86, h * 0.59, '#1c1c1a', sombra=False)
    e = escorrido(h, w, rnd, 5, inicio=(0.5, 0.6), comp=(0.2, 0.4), larg=(1, 2), lad=False)
    return multiplicar(a, 1 - 0.2 * e)


def p_vidraca_verde(w, h, ppm, rnd):
    """a porta de correr larga de vidrinhos com caixilho verde: quatro
       folhas, e a fileira de baixo de chapa"""
    a = chapado(w, h, '#24522e')
    esp = max(2, int(0.04 * ppm))
    for k in range(4):
        x0, x1 = w * k / 4, w * (k + 1) / 4
        caixilho_verde(a, x0 + esp, esp, x1 - esp, h * 0.8, 3, 4, ppm, rnd)
        retangulo(a, x0 + esp, h * 0.8, x1 - esp, h - esp, cor(VERDE_FAV) * 0.95, relevo=0.14)
        retangulo(a, x0, 0, x0 + esp, h, '#24522e')
    e = escorrido(h, w, rnd, 8, inicio=(0.75, 0.8), comp=(0.1, 0.25), larg=(1, 2), lad=False)
    return multiplicar(a, 1 - 0.18 * e)


def p_porta_azul(w, h, ppm, rnd):
    """a porta de chapa azul do andar de cima (a casa de laje)"""
    a = reboco(w, h, ppm, rnd, '#2f62b3', grao=0.05, manchas=0.14, lad=False, fuligem=6)
    passo = max(4, int(0.12 * ppm))
    for x in range(0, w, passo):
        a[:, x:x + 2] *= 0.82
    moldura_simples(a, ppm, 0, 0, w, h, '#264f91', 0.05)
    retangulo(a, w * 0.8, h * 0.5, w * 0.88, h * 0.53, '#1b1b1a', sombra=False)
    return a


def madeira(w, h, ppm, rnd, base='#8f6038', tabua=0.12):
    """tábua vertical de madeira velha, com o veio e a fresta"""
    a = reboco(w, h, ppm, rnd, base, grao=0.08, manchas=0.15, lad=False)
    col = borrar(rnd.random((1, w)).astype(np.float32), 1.5)[0]
    a *= (0.86 + 0.26 * col)[None, :, None]
    passo = max(4, int(tabua * ppm))
    for x in range(0, w, passo):
        a[:, x:x + max(1, int(0.008 * ppm))] *= 0.55
    return a


def p_portao_madeira(w, h, ppm, rnd):
    """o portão de madeira de duas folhas com o X de reforço (a casa
       rosa de quintal)"""
    a = madeira(w, h, ppm, rnd, '#9a6a3f')
    esp = max(3, int(0.07 * ppm))
    for k in (0, 1):
        x0, x1 = w * k / 2, w * (k + 1) / 2
        moldura(a, x0, 0, x1, h, esp, '#7e5431')
        def xis(d, im, x0=x0, x1=x1):
            for (p0, p1) in (((x0 + esp, esp), (x1 - esp, h - esp)), ((x1 - esp, esp), (x0 + esp, h - esp))):
                d.line([p0, p1], fill=(118, 80, 46), width=esp)
        desenhar(a, xis)
    retangulo(a, w / 2 - 1, 0, w / 2 + 1, h, '#5a3a22', sombra=False)
    return multiplicar(a, pe_de_parede(h, w, h * 0.15, 0.3))


def p_porta_madeira_fav(w, h, ppm, rnd):
    a = madeira(w, h, ppm, rnd, '#5d3b27', tabua=0.1)
    moldura_simples(a, ppm, 0, 0, w, h, '#4a2e1e', 0.05)
    retangulo(a, w * 0.78, h * 0.5, w * 0.86, h * 0.53, '#c9b48a', sombra=False)
    return a


def p_faixa_cerveja(w, h, ppm, rnd):
    """a faixa de propaganda de cerveja do bar: laranja, a garrafa, o
       copo e o CERVEJA GELADA. Marca nenhuma — é a cara da faixa."""
    ys = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    a = np.broadcast_to(cor('#f6a91f') * (1 - ys) + cor('#e0661a') * ys, (h, w, 3)).copy()
    mw = w / 2
    def t(d, im):
        for k in range(2):
            x0 = mw * k
            bx = x0 + mw * 0.05
            d.rounded_rectangle([bx, h * 0.3, bx + h * 0.24, h * 0.96], radius=h * 0.06, fill=(96, 54, 18))
            d.rectangle([bx + h * 0.08, h * 0.05, bx + h * 0.16, h * 0.32], fill=(96, 54, 18))
            d.rectangle([bx, h * 0.52, bx + h * 0.24, h * 0.74], fill=(238, 228, 198))
            cx = bx + h * 0.4
            d.polygon([(cx, h * 0.32), (cx + h * 0.3, h * 0.32), (cx + h * 0.25, h * 0.96), (cx + h * 0.05, h * 0.96)],
                      fill=(248, 198, 48))
            d.ellipse([cx - h * 0.03, h * 0.18, cx + h * 0.33, h * 0.4], fill=(252, 250, 242))
            f = caber(d, 'CERVEJA GELADA', mw * 0.68, h * 0.46)
            d.text((x0 + mw * 0.28, h * 0.54), 'CERVEJA GELADA', fill=(120, 30, 10), anchor='lm', font=f)
            d.text((x0 + mw * 0.28 - 1, h * 0.52), 'CERVEJA GELADA', fill=(255, 250, 236), anchor='lm', font=f)
    desenhar(a, t)
    return multiplicar(a, 1 - 0.12 * escorrido(h, w, rnd, 10, inicio=(0.0, 0.2), comp=(0.4, 1.0), larg=(1, 2), lad=True))


def p_geladeira(w, h, ppm, rnd):
    """o freezer vertical branco do bar"""
    a = reboco(w, h, ppm, rnd, '#eeeeea', grao=0.02, manchas=0.06, lad=False)
    xs = np.linspace(0, 1, w, dtype=np.float32)
    a *= (0.9 + 0.12 * np.sin(xs * np.pi))[None, :, None]
    retangulo(a, 0, 0, w, h * 0.12, '#2a2c2e')
    def t(d, im):
        d.text((w / 2, h * 0.06), 'GELADA', fill=(230, 60, 40), anchor='mm', font=caber(d, 'GELADA', w * 0.8, h * 0.07))
    desenhar(a, t)
    retangulo(a, w * 0.82, h * 0.3, w * 0.88, h * 0.62, '#9a9c9c')
    retangulo(a, 0, h * 0.95, w, h, '#3a3a3a', sombra=False)
    return a


def p_engradado(w, h, ppm, rnd):
    """o engradado amarelo de cerveja, de lado"""
    a = reboco(w, h, ppm, rnd, '#e8c01c', grao=0.03, manchas=0.08, lad=False)
    for k in range(4):
        x0 = w * (k + 0.2) / 4
        retangulo(a, x0, h * 0.25, x0 + w * 0.6 / 4, h * 0.75, cor('#e8c01c') * 0.62, relevo=0.2)
    retangulo(a, 0, 0, w, h * 0.1, cor('#e8c01c') * 1.05)
    return a


def p_prateleira(w, h, ppm, rnd):
    """a prateleira de garrafas do fundo do bar"""
    a = reboco(w, h, ppm, rnd, '#3a2a1e', grao=0.06, manchas=0.1, lad=False)
    cores = [(56, 110, 52), (120, 70, 30), (205, 205, 200), (150, 40, 30), (40, 60, 110), (210, 170, 60)]
    for j in range(3):
        yb = h * (j + 1) / 3 - h * 0.04
        retangulo(a, 0, yb, w, yb + h * 0.04, '#6a4a30')
        def gar(d, im, yb=yb):
            xx = w * 0.03
            while xx < w * 0.95:
                bw = w * (0.035 + 0.02 * rnd.random())
                bh = h / 3 * (0.55 + 0.3 * rnd.random())
                c = cores[int(rnd.integers(0, len(cores)))]
                d.rectangle([xx, yb - bh * 0.7, xx + bw, yb], fill=c)
                d.rectangle([xx + bw * 0.3, yb - bh, xx + bw * 0.7, yb - bh * 0.7], fill=c)
                xx += bw * 1.35
        desenhar(a, gar)
    return a


def p_armario(w, h, ppm, rnd):
    """o armário amarelo de gavetas do fundo do bar"""
    a = reboco(w, h, ppm, rnd, '#dfb52a', grao=0.03, manchas=0.1, lad=False)
    for k in range(4):
        y0 = h * (0.04 + 0.24 * k)
        retangulo(a, w * 0.06, y0, w * 0.94, y0 + h * 0.21, cor('#dfb52a') * 0.97, relevo=0.18)
        retangulo(a, w * 0.42, y0 + h * 0.08, w * 0.58, y0 + h * 0.11, '#6a5a2a', sombra=False)
    return a


def p_porta_escura(w, h, ppm, rnd):
    """o vão escuro da porta dos fundos, que dá pra dentro da casa"""
    ys = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    a = np.broadcast_to(cor('#3a3c3e') * (1 - ys) * 0.7 + cor('#151617') * ys, (h, w, 3)).copy()
    moldura_simples(a, ppm, 0, 0, w, h, '#d8d6d0', 0.05)
    return a


def p_cartaz_verde(w, h, ppm, rnd):
    a = chapado(w, h, '#2f8a3a')
    def t(d, im):
        d.ellipse([w * 0.22, h * 0.14, w * 0.78, h * 0.58], fill=(250, 214, 60))
        d.ellipse([w * 0.34, h * 0.24, w * 0.66, h * 0.48], fill=(244, 150, 40))
        d.text((w / 2, h * 0.72), 'SUCO', fill=(255, 255, 255), anchor='mm', font=caber(d, 'SUCO', w * 0.8, h * 0.13))
        d.text((w / 2, h * 0.86), 'NATURAL', fill=(255, 255, 255), anchor='mm', font=caber(d, 'NATURAL', w * 0.8, h * 0.09))
    desenhar(a, t)
    moldura_simples(a, ppm, 0, 0, w, h, '#1f5f28', 0.02)
    return a


# as frações do muro pintado que o 3D usa: embaixo, a porta de grade à
# esquerda e a porta de enrolar à direita ficam no amarelo liso
MURAL_PORTA = (0.02, 0.23)
MURAL_ENROLAR = (0.72, 0.97)


def lanches(d, w, h):
    """os desenhos do muro: o x-burguer, o cachorro-quente, a batata, o
       espetinho e o copo de refrigerante"""
    # a fileira toda cabe entre 0,26 e 0,70 da largura: à direita disso
    # vem o toldinho e a porta de enrolar
    hh = min(h * 0.16, w * 0.44 / 6.2)
    y0 = h * 0.34
    y1 = y0 + hh
    x = w * 0.26
    # o x-burguer
    d.ellipse([x, y0, x + hh * 1.3, y0 + hh * 0.55], fill=(214, 150, 60), outline=(90, 40, 10), width=2)
    d.rectangle([x + 2, y0 + hh * 0.45, x + hh * 1.3 - 2, y0 + hh * 0.6], fill=(90, 160, 50))
    d.rectangle([x, y0 + hh * 0.58, x + hh * 1.3, y0 + hh * 0.78], fill=(96, 50, 24))
    d.rounded_rectangle([x, y0 + hh * 0.76, x + hh * 1.3, y1], radius=hh * 0.12, fill=(206, 140, 56), outline=(90, 40, 10), width=2)
    x += hh * 1.55
    # o cachorro-quente
    d.rounded_rectangle([x, y0 + hh * 0.35, x + hh * 1.9, y1], radius=hh * 0.3, fill=(214, 156, 70), outline=(90, 40, 10), width=2)
    d.rounded_rectangle([x - hh * 0.1, y0 + hh * 0.3, x + hh * 2.0, y0 + hh * 0.6], radius=hh * 0.15, fill=(170, 60, 36))
    d.line([(x + hh * 0.1 + k * hh * 0.2, y0 + hh * (0.36 if k % 2 else 0.52)) for k in range(10)], fill=(250, 214, 40), width=2)
    x += hh * 2.25
    # a batata: palito claro com contorno, senão some no amarelo do muro
    for k in range(6):
        d.rectangle([x + hh * (0.12 + k * 0.13), y0 + hh * (0.02 + 0.08 * (k % 3)), x + hh * (0.2 + k * 0.13), y0 + hh * 0.6],
                    fill=(255, 238, 150), outline=(150, 90, 20), width=1)
    d.polygon([(x, y0 + hh * 0.45), (x + hh * 1.0, y0 + hh * 0.45), (x + hh * 0.85, y1), (x + hh * 0.15, y1)], fill=(210, 40, 30))
    x += hh * 1.25
    # o espetinho
    d.line([(x, y1), (x + hh * 1.2, y0)], fill=(140, 110, 70), width=2)
    for k in range(4):
        cx, cy = x + hh * (0.25 + 0.25 * k), y1 - hh * (0.25 + 0.25 * k)
        d.rounded_rectangle([cx - hh * 0.13, cy - hh * 0.13, cx + hh * 0.13, cy + hh * 0.13], radius=hh * 0.05, fill=(128, 62, 30))


def p_mural_ki(w, h, ppm, rnd):
    """o muro pintado da lanchonete KI-DELÍCIA: o nome em vermelho com
       contorno, o que ela vende, os desenhos dos lanches e o cardápio
       pintado à mão. Os cantos de baixo ficam no amarelo liso: ali o 3D
       abre a porta de grade e a porta de enrolar."""
    a = reboco(w, h, ppm, rnd, '#f2c52a', grao=0.06, manchas=0.12, lad=False, fuligem=4)
    a = multiplicar(a, 1 + 0.07 * fbm(h, w, 0.25 * ppm, rnd, 3, False))
    VERM, ESC = (206, 38, 28), (70, 22, 14)
    def t(d, im):
        f = caber(d, 'KI-DELÍCIA', w * 0.72, h * 0.17)
        for dx, dy in ((-3, 0), (3, 0), (0, -3), (0, 3), (3, 3), (-3, 3)):
            d.text((w / 2 + dx, h * 0.135 + dy), 'KI-DELÍCIA', fill=ESC, anchor='mm', font=f)
        d.text((w / 2, h * 0.135), 'KI-DELÍCIA', fill=VERM, anchor='mm', font=f)
        sub = 'LANCHES · ESPETINHOS · BATATA FRITA'
        fs = caber(d, sub, w * 0.62, h * 0.055)
        for dx, dy in ((-2, 0), (2, 0), (0, -2), (0, 2)):
            d.text((w / 2 + dx, h * 0.245 + dy), sub, fill=VERM, anchor='mm', font=fs)
        d.text((w / 2, h * 0.245), sub, fill=(255, 246, 226), anchor='mm', font=fs)
        lanches(d, w, h)
        esq = ['X-SALADA', 'X-BURGUER', 'X-BACON', 'X-CALABRESA', 'X-FRANGO']
        dirr = ['X-TUDO', 'X-CHURRASCO', 'MISTO QUENTE', 'HOT DOG', 'AMERICANO']
        fc = caber(d, 'MISTO QUENTE', w * 0.2, h * 0.045)
        for i, it in enumerate(esq):
            d.text((w * 0.26, h * (0.58 + i * 0.075)), it, fill=ESC, anchor='lm', font=fc)
        for i, it in enumerate(dirr):
            d.text((w * 0.48, h * (0.58 + i * 0.075)), it, fill=ESC, anchor='lm', font=fc)
    desenhar(a, t)
    # a tinta gasta: descasca aqui e ali, e o pé do muro encarde
    desc = np.clip(pontos(h, w, (w / ppm) * (h / ppm) * 3, 2, 6, rnd, False, sinal=1.0), 0, 1)
    aplicar(a, '#b9b1a0', borrar(desc, 1.0) * 0.7)
    return multiplicar(multiplicar(a, pe_de_parede(h, w, h * 0.12, 0.3)),
                       1 - 0.15 * escorrido(h, w, rnd, 12, inicio=(0.0, 0.1), comp=(0.3, 0.9), larg=(1, 3), lad=False))


def p_toldo_ki(w, h, ppm, rnd):
    """o toldinho vermelho em cima da porta de enrolar, com o nome"""
    a = reboco(w, h, ppm, rnd, '#d42a20', grao=0.04, manchas=0.1, lad=False)
    def t(d, im):
        d.text((w / 2, h * 0.46), 'KI-DELÍCIA', fill=(252, 214, 60), anchor='mm', font=caber(d, 'KI-DELÍCIA', w * 0.8, h * 0.55))
    desenhar(a, t)
    a[int(h * 0.86):] *= 0.72
    return a


def p_porta_grade_azul(w, h, ppm, rnd):
    """a porta da lanchonete: grade azul em cima, chapa vermelha
       embaixo com o recado pintado à mão"""
    a = chapado(w, h, '#1d2228')
    corte = int(h * 0.55)
    passo = max(4, int(0.07 * ppm))
    for x in range(int(w * 0.08), int(w * 0.92), passo):
        retangulo(a, x, h * 0.05, x + max(2, int(0.018 * ppm)), corte, '#2d62b0')
    for y in (h * 0.05, h * 0.3, corte - 3):
        retangulo(a, w * 0.06, y, w * 0.94, y + max(2, int(0.025 * ppm)), '#2d62b0')
    a[corte:] = reboco(w, h - corte, ppm, rnd, '#c02a22', grao=0.05, manchas=0.15, lad=False)
    def t(d, im):
        d.text((w * 0.5, corte + (h - corte) * 0.3), 'Família', fill=(245, 240, 230), anchor='mm',
               font=caber(d, 'Família', w * 0.7, h * 0.07, 'normal'))
    desenhar(a, t)
    moldura_simples(a, ppm, 0, 0, w, h, '#23498a', 0.05)
    return a


def p_guarda_sol(c1, c2, n=12):
    """o pano do guarda-sol: gomos alternados. O torno dá uma volta
       inteira na célula, então cada faixa vira um gomo."""
    def f(w, h, ppm, rnd):
        a = np.zeros((h, w, 3), np.float32)
        for k in range(n):
            a[:, int(w * k / n):int(w * (k + 1) / n)] = cor(c1 if k % 2 == 0 else c2)
        ys = np.linspace(0, 1, h, dtype=np.float32)
        return a * (0.84 + 0.16 * ys)[:, None, None]
    return f


def p_portao_chapa(w, h, ppm, rnd):
    """o portão de chapa marrom com o X estampado, com a grade em cima
       (o do lado do bar)"""
    a = reboco(w, h, ppm, rnd, '#8a4c33', grao=0.05, manchas=0.18, lad=False, fuligem=10)
    esp = max(3, int(0.05 * ppm))
    topo = h * 0.14
    for k in (0, 1):
        x0, x1 = w * k / 2, w * (k + 1) / 2
        moldura(a, x0, topo, x1, h, esp, '#6e3a26')
        def xis(d, im, x0=x0, x1=x1):
            for (p0, p1) in (((x0 + esp, topo + esp), (x1 - esp, h - esp)), ((x1 - esp, topo + esp), (x0 + esp, h - esp))):
                d.line([p0, p1], fill=(160, 96, 66), width=max(2, esp // 2))
        desenhar(a, xis)
    a[:int(topo)] = cor('#2a2a2a')
    for x in range(0, w, max(4, int(0.1 * ppm))):
        a[:int(topo), x:x + 2] = cor('#6e3a26')
    a[:3] = cor('#6e3a26')
    return a


def p_bananeira(w, h, ppm, rnd):
    """o pé de bananeira, recortado (alfa): folhas largas com a
       nervura, umas rasgadas, em leque em cima do tronco"""
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(w * 0.45, h), (w * 0.55, h), (w * 0.53, h * 0.5), (w * 0.47, h * 0.5)], fill=(104, 116, 58, 255))
    bx, by = w * 0.5, h * 0.52
    for k in range(8):
        ang = math.radians(-172 + k * 23 + rnd.uniform(-8, 8))
        L = h * rnd.uniform(0.34, 0.48)
        larg = L * rnd.uniform(0.3, 0.38)
        dx, dy = math.cos(ang), math.sin(ang)
        caida = 0.45 * abs(dx)                           # a folha pesa e cai na ponta
        esq, dirr = [], []
        for i in range(13):
            t = i / 12
            cx = bx + dx * L * t
            cy = by + dy * L * t + caida * L * t * t
            m = larg * math.sin(math.pi * min(1, t * 1.05)) ** 0.7
            if rnd.random() < 0.25:
                m *= 0.5                                 # o rasgado
            esq.append((cx - dy * m, cy + dx * m))
            dirr.append((cx + dy * m, cy - dx * m))
        g = rnd.uniform(0.85, 1.15)
        d.polygon(esq + dirr[::-1], fill=(int(96 * g), int(160 * g), int(56 * g), 255))
        d.line([(bx, by)] + [((esq[i][0] + dirr[i][0]) / 2, (esq[i][1] + dirr[i][1]) / 2) for i in range(13)],
               fill=(150, 190, 90, 255), width=1)
    return np.asarray(im, np.float32) / 255



# a segunda leva da favela: a casa da escada de fora, o sobrado do
# varal, o das garagens e o do embasamento
def p_jan_grade_branca(w, h, ppm, rnd):
    """o vitrô de grade branca: vidro escuro atrás das barras deitadas"""
    a = vidro(w, h, rnd, base='#1d2428', topo='#63727a', reflexo=0.15)
    esp = moldura_simples(a, ppm, 0, 0, w, h, '#ecebe6', 0.05)
    for k in range(1, 6):
        y = h * k / 6
        retangulo(a, esp, y - 0.012 * ppm, w - esp, y + 0.012 * ppm, '#e6e5e0')
    retangulo(a, w / 2 - 1, esp, w / 2 + 1, h - esp, '#d8d7d2', sombra=False)
    return a


def p_jan_verde_grade(w, h, ppm, rnd):
    """janela de caixilho verde com a grade de barra em pé"""
    a = vidro(w, h, rnd, base='#1c2327', topo='#5c6b72', reflexo=0.14)
    moldura_simples(a, ppm, 0, 0, w, h, '#2f6a3c', 0.05)
    esp = max(2, int(0.05 * ppm))
    for k in range(1, 6):
        x = w * k / 6
        retangulo(a, x - 0.01 * ppm, esp, x + 0.01 * ppm, h - esp, '#264f30')
    retangulo(a, esp, h / 2 - 0.01 * ppm, w - esp, h / 2 + 0.01 * ppm, '#264f30')
    return a


def p_jan_madeira(w, h, ppm, rnd):
    """janela de caixilho de madeira escura, seis vidros"""
    a = vidro(w, h, rnd, base='#20262a', topo='#5a666c', reflexo=0.12)
    esp = moldura_simples(a, ppm, 0, 0, w, h, '#4a3a2e', 0.06)
    retangulo(a, w / 2 - esp / 2, 0, w / 2 + esp / 2, h, '#4a3a2e')
    for k in (1, 2):
        retangulo(a, 0, h * k / 3 - esp / 3, w, h * k / 3 + esp / 3, '#4a3a2e')
    return a


def p_jan_alu4(w, h, ppm, rnd):
    """janela de alumínio de quatro vidros"""
    a = vidro(w, h, rnd, base='#1d2327', topo='#63727b', reflexo=0.16)
    esp = moldura_simples(a, ppm, 0, 0, w, h * 0.94, '#b9bcbd', 0.04)
    retangulo(a, w / 2 - esp / 2, 0, w / 2 + esp / 2, h * 0.94, '#b9bcbd')
    retangulo(a, 0, h * 0.45, w, h * 0.45 + esp, '#b9bcbd')
    retangulo(a, -2, h * 0.94, w + 2, h, '#9d9a92')
    return a


def p_zinco(w, h, ppm, rnd):
    """a telha de zinco ondulada, com a ferrugem escorrendo"""
    a = reboco(w, h, ppm, rnd, '#a9b1b7', grao=0.03, manchas=0.1, lad=True)
    xs = np.arange(w, dtype=np.float32) / w * 13 * 2 * np.pi
    a *= (0.82 + 0.22 * np.sin(xs))[None, :, None]
    fer = escorrido(h, w, rnd, 14, inicio=(0.0, 1.0), comp=(0.2, 0.6), larg=(1, 3), lad=True)
    aplicar(a, '#7a4a2e', fer * 0.55)
    aplicar(a, '#8a5a3a', np.clip(fbm(h, w, 0.5 * ppm, rnd, 3, True) * 2 - 0.3, 0, 1) * 0.35)
    return a


def p_portao_vermelho(w, h, ppm, rnd):
    """o portão de garagem de chapa vermelha de duas folhas, com a
       bandeira vazada em losango em cima"""
    a = reboco(w, h, ppm, rnd, '#c64a3c', grao=0.04, manchas=0.12, lad=False, fuligem=4)
    topo = int(h * 0.2)
    a[:topo] = cor('#2a2a2a')
    lw = max(2, int(0.02 * ppm))
    def losango(d, im):
        passo = 0.16 * ppm
        k = -float(topo)
        while k < w + topo:
            d.line([(k, 0), (k + topo, topo)], fill=(206, 206, 200), width=lw)
            d.line([(k + topo, 0), (k, topo)], fill=(206, 206, 200), width=lw)
            k += passo
    desenhar(a, losango)
    moldura(a, 0, 0, w, h, max(3, int(0.04 * ppm)), '#a53a2e')
    retangulo(a, 0, topo - 3, w, topo + 3, '#a53a2e')
    retangulo(a, w / 2 - 2, topo, w / 2 + 2, h, '#8e3026', sombra=False)
    e = escorrido(h, w, rnd, 8, inicio=(0.2, 0.3), comp=(0.3, 0.7), larg=(1, 3), lad=False)
    return multiplicar(a, 1 - 0.15 * e)


def p_tijolo_furos(w, h, ppm, rnd):
    """a fiada de cima da parede de tijolo, com os furos de ventilação
       embaixo da laje"""
    a = tijolos(w, h, ppm, rnd, ['#a55a44', '#9a513c', '#b0624a', '#8f4a36', '#a8604a', '#b56b52'],
                argamassa='#9e968a', tam=(0.23, 0.075), junta=0.014, var=0.14)
    n = 9
    for k in range(n):
        x = w * (k + 0.5) / n
        retangulo(a, x - 0.05 * ppm, h * 0.3, x + 0.05 * ppm, h * 0.7, '#1e1a18', sombra=False)
    return a


def p_antena(w, h, ppm, rnd):
    """a antena parabólica de frente, recortada (alfa): o prato claro
       com a concha e o braço do receptor. Marca nenhuma."""
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for k in range(10):
        f = k / 10
        c = int(222 - 44 * f)
        d.ellipse([w * (0.04 + 0.2 * f), h * (0.08 + 0.2 * f), w * (0.88 - 0.2 * f), h * (0.92 - 0.2 * f)],
                  fill=(c, c + 2, c, 255))
    d.ellipse([w * 0.04, h * 0.08, w * 0.88, h * 0.92], outline=(150, 152, 150, 255), width=max(2, int(0.02 * ppm)))
    d.line([(w * 0.46, h * 0.5), (w * 0.9, h * 0.62)], fill=(120, 122, 120, 255), width=max(2, int(0.025 * ppm)))
    d.rectangle([w * 0.86, h * 0.56, w * 0.97, h * 0.7], fill=(90, 92, 90, 255))
    return np.asarray(im, np.float32) / 255


def p_varal(w, h, ppm, rnd):
    """o varal: o fio e a roupa pendurada, recortado (alfa)"""
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.line([(0, h * 0.06), (w, h * 0.06)], fill=(60, 60, 60, 255), width=2)
    cores = [(60, 120, 210), (240, 240, 235), (220, 120, 170), (250, 200, 60), (120, 200, 120), (230, 90, 70), (170, 120, 220)]
    x = w * 0.03
    while x < w * 0.93:
        tipo = int(rnd.integers(0, 3))
        c = cores[int(rnd.integers(0, len(cores)))] + (255,)
        y0 = h * 0.06
        if tipo == 0:                                   # a calça
            cw, ch = w * 0.07, h * 0.8
            d.polygon([(x, y0), (x + cw, y0), (x + cw, y0 + ch), (x + cw * 0.58, y0 + ch), (x + cw * 0.5, h * 0.35),
                       (x + cw * 0.42, y0 + ch), (x, y0 + ch)], fill=c)
        elif tipo == 1:                                 # a camiseta
            cw, ch = w * 0.09, h * 0.55
            d.polygon([(x, y0), (x + cw, y0), (x + cw * 1.12, h * 0.22), (x + cw * 0.85, h * 0.27), (x + cw * 0.85, y0 + ch),
                       (x + cw * 0.15, y0 + ch), (x + cw * 0.15, h * 0.27), (x - cw * 0.12, h * 0.22)], fill=c)
        else:                                           # o pano
            cw, ch = w * 0.045, h * 0.36
            d.rectangle([x, y0, x + cw, y0 + ch], fill=c)
        d.rectangle([x + cw * 0.3, h * 0.02, x + cw * 0.42, h * 0.11], fill=(230, 200, 60, 255))
        x += cw + w * rnd.uniform(0.015, 0.04)
    return np.asarray(im, np.float32) / 255



def p_tijolo_rosa(w, h, ppm, rnd):
    """o tijolo rosado claro, de argamassa cinza e um ou outro tijolo
       faltando (o sobrado das garagens)"""
    a = tijolos(w, h, ppm, rnd, ['#e3a79a', '#d99a8c', '#eab3a6', '#d4907f', '#e0a090', '#cf8f80'],
                argamassa='#b4aca3', tam=(0.23, 0.075), junta=0.014, var=0.10)
    buraco = np.clip(pontos(h, w, (w / ppm) * (h / ppm) * 1.2, 1.5, 3, rnd, True, sinal=1.0), 0, 1)
    return multiplicar(a, 1 - 0.3 * borrar(buraco, 0.8))


# =========================================================
#   9. O GALPÃO E O PRÉDIO COMUM
#   O bloco de cimento aparente, o vitrô alto de ferro, a veneziana
#   do oitão, o portão de correr, os avisos pintados na platibanda, o
#   tijolo de vidro da escada do prédio e o fundo da sacada embutida.
# =========================================================
def p_bloco(w, h, ppm, rnd):
    """o bloco de cimento aparente (39 × 19 cm), cada um num tom, com a
       junta rebaixada — ladrilhável"""
    a = reboco(w, h, ppm, rnd, '#aeada7', grao=0.07, manchas=0.12, lad=True, fuligem=10)
    nx, ny = 5, 6
    bw, bh = w / nx, h / ny
    jt = max(1, int(0.011 * ppm))
    for j in range(ny):
        y0, y1 = int(j * bh), int((j + 1) * bh)
        desl = bw / 2 if j % 2 else 0
        for i in range(nx + 1):
            xa = i * bw + desl - bw
            tom = 0.9 + 0.14 * rnd.random()
            for x in range(int(xa), int(xa + bw)):
                a[y0:y1, x % w] *= tom
            xj = int(i * bw + desl) % w
            a[y0:y1, xj:xj + jt] *= 0.7
        a[y0:y0 + jt, :] *= 0.7
    return a


def p_tijolo_vidro(w, h, ppm, rnd):
    """o tijolo de vidro da escada do prédio: o bloco translúcido
       esverdeado, com o brilho no meio, e a junta de cimento"""
    a = np.zeros((h, w, 3), np.float32)
    n = 4
    for i in range(n):
        for j in range(n):
            x0, x1 = int(i * w / n), int((i + 1) * w / n)
            y0, y1 = int(j * h / n), int((j + 1) * h / n)
            bw, bh = x1 - x0, y1 - y0
            yy, xx = np.mgrid[0:bh, 0:bw].astype(np.float32)
            r = np.hypot((xx - bw / 2) / bw, (yy - bh / 2) / bh)
            brilho = 0.7 + 0.55 * np.clip(1 - r * 2.2, 0, 1)
            a[y0:y1, x0:x1] = cor('#9cc3bf')[None, None, :] * brilho[..., None] * (0.92 + 0.12 * rnd.random())
    jt = max(1, int(0.012 * ppm))
    for k in range(n):
        a[:, int(k * w / n):int(k * w / n) + jt] = cor('#c9c5bc')
        a[int(k * h / n):int(k * h / n) + jt, :] = cor('#c9c5bc')
    return a


def p_vitro_alto(w, h, ppm, rnd):
    """o vitrô basculante de ferro do alto da parede do galpão: muitos
       vidrinhos, uns abertos"""
    a = vidro(w, h, rnd, base='#2a3236', topo='#7d8e96', reflexo=0.2)
    esp = max(2, int(0.03 * ppm))
    for j in range(3):
        y0, y1 = int(j * h / 3), int((j + 1) * h / 3)
        if rnd.random() < 0.5:
            a[y0:y1] = a[y0:y1] * 0.55 + cor('#1a1f22') * 0.45        # a fileira aberta, mais escura
    for i in range(7):
        x = int(i * (w - esp) / 6)
        a[:, x:x + esp] = cor('#3e4447')
    for j in range(4):
        y = int(j * (h - esp) / 3)
        a[y:y + esp, :] = cor('#3e4447')
    return a


def p_veneziana_ar(w, h, ppm, rnd):
    """a veneziana de chapa do oitão do galpão, que deixa o ar passar"""
    a = reboco(w, h, ppm, rnd, '#8d9295', grao=0.03, manchas=0.1, lad=False)
    passo = max(3, int(0.07 * ppm))
    for y in range(h):
        a[y] *= 0.55 + 0.55 * ((y % passo) / passo)
    moldura_simples(a, ppm, 0, 0, w, h, '#6c7174', 0.04)
    return a


def p_portao_galpao(w, h, ppm, rnd):
    """o portão de correr de chapa do galpão, pintado de azul-acinzentado,
       com a nervura, a portinhola de pedestre e a ferrugem no pé"""
    a = reboco(w, h, ppm, rnd, '#5f7c93', grao=0.04, manchas=0.14, lad=False, fuligem=6)
    passo, e1, e2 = max(4, int(0.2 * ppm)), max(2, int(0.02 * ppm)), max(3, int(0.035 * ppm))
    for x in range(0, w, passo):
        a[:, x:x + e1] *= 0.78
        a[:, x + e1:x + e2] *= 1.08
    moldura(a, 0, 0, w, h, max(3, int(0.05 * ppm)), '#4d6679')
    retangulo(a, w / 2 - 2, 0, w / 2 + 2, h, '#3f5566', sombra=False)
    px0, px1, py0 = w * 0.6, w * 0.88, h * 0.34
    moldura(a, px0, py0, px1, h - max(3, int(0.05 * ppm)), max(2, int(0.02 * ppm)), '#465e70')
    retangulo(a, px1 - 0.08 * ppm, h * 0.64, px1 - 0.05 * ppm, h * 0.68, '#222222', sombra=False)
    aplicar(a, '#7a4a2e', escorrido(h, w, rnd, 14, inicio=(0.6, 0.95), comp=(0.1, 0.3), larg=(1, 3), lad=False) * 0.5)
    return multiplicar(a, pe_de_parede(h, w, h * 0.1, 0.3))


def p_aviso(txt, fundo='#f1efe8', tinta=(40, 40, 40)):
    """o aviso pintado direto na platibanda do galpão"""
    def f(w, h, ppm, rnd):
        a = reboco(w, h, ppm, rnd, fundo, grao=0.05, manchas=0.15, lad=False, fuligem=4)
        def t(d, im):
            d.text((w / 2, h * 0.53), txt, fill=tinta, anchor='mm', font=caber(d, txt, w * 0.88, h * 0.68))
        desenhar(a, t)
        return multiplicar(a, 1 - 0.2 * escorrido(h, w, rnd, 10, inicio=(0.0, 0.2), comp=(0.3, 0.9), larg=(1, 3), lad=False))
    return f


def p_sacada_fundo(w, h, ppm, rnd):
    """o fundo da sacada embutida do prédio: a parede clara (a tinta do
       prédio pinta ela) com a porta de vidro de correr e a cortina"""
    a = reboco(w, h, ppm, rnd, '#f1f0eb', grao=0.03, manchas=0.06, lad=False)
    px0, px1, py0 = w * 0.18, w * 0.82, h * 0.1
    v = vidro(int(px1 - px0), int(h - py0), rnd, base='#20272b', topo='#62727a', reflexo=0.18)
    colar(a, v, px0, py0)
    cortina(a, px0 + 4, px0 + (px1 - px0) * 0.42, py0 + 4, h - 2, c='#e6dfcf', dobras=5, rnd=rnd, luz=0.7)
    esp = max(2, int(0.04 * ppm))
    moldura(a, px0, py0, px1, h, esp, '#c9ccce')
    retangulo(a, (px0 + px1) / 2 - esp / 2, py0, (px0 + px1) / 2 + esp / 2, h, '#c9ccce')
    return a


def p_portao_losango(w, h, ppm, rnd):
    """o portão de garagem de chapa da casa de muro: branco, com o
       desenho de losango em relevo (as tiras cruzadas em diagonal), o
       quadro em volta e a divisa das duas folhas no meio"""
    a = reboco(w, h, ppm, rnd, '#e9e8e2', grao=0.03, manchas=0.05, lad=False)
    passo = 0.42 * ppm
    esp = max(2, int(0.035 * ppm))
    def f(d, im):
        for k in range(-int(h / passo) - 2, int(w / passo) + 3):
            x = k * passo
            d.line([(x, h), (x + h, 0)], fill=(206, 205, 198), width=esp)
            d.line([(x, 0), (x + h, h)], fill=(206, 205, 198), width=esp)
            d.line([(x + 2, h), (x + h + 2, 0)], fill=(250, 250, 246), width=max(1, esp // 2))
    desenhar(a, f)
    q = max(3, int(0.07 * ppm))
    moldura(a, 0, 0, w, h, q, '#dcdbd4')
    retangulo(a, w / 2 - q / 2, 0, w / 2 + q / 2, h, '#d3d2cb')
    retangulo(a, w / 2 + 0.1 * ppm, h * 0.5, w / 2 + 0.16 * ppm, h * 0.56, '#5a5a56', sombra=False)
    e = escorrido(h, w, rnd, 8, inicio=(0.0, 0.2), comp=(0.2, 0.6), larg=(1, 2), lad=False)
    return multiplicar(a, 1 - 0.1 * e)


def folha_casas():
    F = Folha('casas')
    F.cel('portao_losango', 2.4, 2.1, 110, p_portao_losango)
    F.cel('suja', 2.5, 2.5, 110, p_parede_suja, lad=True)
    F.cel('lisa', 2.5, 2.5, 110, p_parede_lisa, lad=True)
    F.cel('crua', 2.5, 2.5, 110, p_parede_crua, lad=True)
    F.cel('tijolo', 2.3, 1.5, 110, p_tijolo_casa, lad=True)
    F.cel('laje_borda', 2.0, 0.3, 110, p_laje_borda, lad=True)
    F.cel('laje', 3.0, 3.0, 60, p_piso('#a3a19a', junta=False), lad=True)
    F.cel('telha', 2.1, 2.16, 110, lambda w, h, ppm, rnd: telhas(w, h, ppm, rnd, ['#d08a52', '#c47d46', '#d9955c', '#bd7440', '#cb8650'], musgo=0.12), lad=True)
    F.cel('calha', 2.0, 0.25, 110, p_calha, lad=True)
    F.cel('jan2', 1.2, 1.15, 150, p_jan2)
    F.cel('basc', 0.6, 0.6, 150, p_basc)
    F.cel('porta_vene', 0.9, 2.1, 150, p_porta_vene)
    F.cel('veneziana', 1.1, 1.2, 140, p_veneziana_mad)
    F.cel('jan_vidro', 0.8, 0.7, 150, p_jan_vidro)
    F.cel('porta_ferro', 0.9, 2.1, 140, p_porta_ferro)
    F.cel('enrolar', 2.4, 2.5, 120, lambda w, h, ppm, rnd: enrolar(w, h, ppm, rnd, False))
    F.cel('enrolar_meia', 2.4, 2.5, 120, lambda w, h, ppm, rnd: enrolar(w, h, ppm, rnd, True))
    F.cel('promocoes', 0.8, 1.15, 200, p_promocoes)
    F.cel('jan_cortina', 1.4, 1.2, 140, p_jan_cortina)
    F.cel('jan_peq', 0.7, 0.8, 150, p_jan2)
    F.cel('porta_ap', 0.9, 2.2, 140, p_porta_ap)
    F.cel('porta_alu', 0.9, 2.1, 150, p_porta_alu)
    F.cel('jan_grade', 1.4, 1.0, 150, p_jan_grade)
    F.cel('caixa', 3.0, 1.0, 110, p_caixa_dagua, lad=True)
    F.cel('col_janela', 1.1, 1.6, 140, p_col_janela)
    F.cel('col_porta', 1.3, 2.7, 130, p_col_porta)
    F.cel('col_arco', 1.1, 2.7, 130, p_col_arco)
    # as casas grandes da favela
    F.cel('fibro', 1.1, 1.83, 100, p_fibro(0.0), lad=True)
    F.cel('fibro_sujo', 1.1, 1.83, 100, p_fibro(1.0), lad=True)
    F.cel('grama', 2.0, 2.0, 64, p_grama, lad=True)
    F.cel('piso_bar', 1.2, 1.2, 100, p_piso_bar, lad=True)
    F.cel('azulejo', 0.6, 0.6, 120, p_azulejo, lad=True)
    F.cel('porta_verde', 0.85, 2.1, 120, p_porta_verde)
    F.cel('vidraca_verde', 2.4, 2.2, 100, p_vidraca_verde)
    F.cel('porta_azul', 0.9, 2.0, 120, p_porta_azul)
    F.cel('portao_madeira', 1.5, 1.8, 110, p_portao_madeira)
    F.cel('porta_madeira', 0.85, 2.1, 120, p_porta_madeira_fav)
    F.cel('faixa_cerveja', 4.0, 0.55, 110, p_faixa_cerveja, lad=True)
    F.cel('geladeira', 0.7, 1.8, 110, p_geladeira)
    F.cel('engradado', 0.45, 0.3, 150, p_engradado)
    F.cel('prateleira', 1.2, 1.0, 110, p_prateleira)
    F.cel('armario', 0.8, 1.2, 110, p_armario)
    F.cel('porta_escura', 0.8, 2.0, 80, p_porta_escura)
    F.cel('cartaz_verde', 0.6, 0.8, 140, p_cartaz_verde)
    F.cel('mural_ki', 5.6, 3.8, 90, p_mural_ki)
    F.cel('toldo_ki', 1.4, 0.5, 150, p_toldo_ki)
    F.cel('porta_grade_azul', 0.9, 2.1, 120, p_porta_grade_azul)
    F.cel('guarda_sol_pb', 2.0, 0.8, 128, p_guarda_sol('#1c1c1e', '#f2f2ef'))
    F.cel('guarda_sol_am', 2.0, 0.8, 128, p_guarda_sol('#f2c41c', '#f6f4ec'))
    F.cel('portao_chapa', 2.4, 2.0, 90, p_portao_chapa)
    F.cel('jan_grade_branca', 1.2, 0.9, 140, p_jan_grade_branca)
    F.cel('jan_verde_grade', 0.8, 1.2, 140, p_jan_verde_grade)
    F.cel('jan_madeira', 1.0, 1.1, 140, p_jan_madeira)
    F.cel('jan_alu4', 1.2, 1.0, 140, p_jan_alu4)
    F.cel('zinco', 1.0, 1.8, 100, p_zinco, lad=True)
    F.cel('portao_vermelho', 2.4, 2.3, 100, p_portao_vermelho)
    F.cel('tijolo_furos', 2.3, 0.3, 110, p_tijolo_furos, lad=True)
    F.cel('tijolo_rosa', 2.3, 1.5, 110, p_tijolo_rosa, lad=True)
    # o galpão e o prédio comum
    F.cel('bloco', 2.0, 1.2, 110, p_bloco, lad=True)
    F.cel('tijolo_vidro', 0.8, 0.8, 120, p_tijolo_vidro, lad=True)
    F.cel('vitro_alto', 1.6, 0.7, 120, p_vitro_alto)
    F.cel('veneziana_ar', 1.4, 0.7, 110, p_veneziana_ar)
    F.cel('portao_galpao', 3.2, 3.2, 80, p_portao_galpao)
    F.cel('aviso_deposito', 3.0, 0.7, 110, p_aviso('DEPÓSITO'))
    F.cel('aviso_oficina', 3.0, 0.7, 110, p_aviso('OFICINA', '#f3d34a', (30, 30, 30)))
    F.cel('aviso_aluga', 2.4, 0.7, 110, p_aviso('ALUGA-SE', '#f1efe8', (190, 30, 30)))
    F.cel('sacada_fundo', 1.8, 2.4, 100, p_sacada_fundo)
    F.cel('ar', 0.85, 0.6, 200, p_ar)
    F.cel('ar_lado', 0.3, 0.6, 120, p_ar_lado)
    return F.montar()
# =========================================================
#   10. O ATACAREJO — o ATACADEX
#   Galpão de atacado: chapa azul na testeira e na platibanda com o
#   filete verde e amarelo, parede branca de painel, a vitrine de vidro
#   com a porta automática, painel bordô, cartaz de oferta, a marca
#   (o selo vermelho-laranja com o nome e o emblema do carrinho em
#   cima), o painel amarelo da quina, as docas de caminhão, o telhado
#   de chapa com a claraboia, a coluna da marquise, o asfalto do
#   estacionamento, o totem e o caminhão.
#   A marca é NOSSA: o nome é ATACADEX e o emblema é um carrinho num
#   disco — nada da marca que serviu de referência.
# =========================================================
AZUL_AT = '#2f78c9'
AZUL_AT_ESC = '#1f5596'
BORDO_AT = '#6b1e2b'
AMARELO_AT = '#f7c531'
LARANJA_AT = '#f08a1c'
VERMELHO_AT = '#d23f1b'
NOME_ATACADO = 'ATACADEX'


def chapa_trapezoidal(w, h, ppm, rnd, base, passo_m=0.2, vertical=True, lad=True, suja=0.05):
    """chapa de aço trapezoidal: a onda corre no sentido `vertical`
       (as nervuras em pé, como na testeira) ou deitada"""
    a = chapado(w, h, base)
    n = max(2, int(round((w if vertical else h) / (passo_m * ppm))))
    comp = w if vertical else h
    t = np.arange(comp, dtype=np.float32) / comp * n
    f = t - np.floor(t)
    perfil = np.where(f < 0.18, 1.12, np.where(f < 0.26, 0.86, np.where(f < 0.62, 1.0, np.where(f < 0.7, 0.9, 1.0))))
    if vertical:
        a *= perfil[None, :, None]
    else:
        a *= perfil[:, None, None]
    a = multiplicar(a, 1 + suja * fbm(h, w, 0.5 * ppm, rnd, 3, lad))
    return np.clip(a, 0, 1)


def p_at_azul(w, h, ppm, rnd):
    return chapa_trapezoidal(w, h, ppm, rnd, AZUL_AT, 0.2, True)


def p_at_branco(w, h, ppm, rnd):
    a = chapa_trapezoidal(w, h, ppm, rnd, '#eceeed', 0.5, True, suja=0.04)
    e = escorrido(h, w, rnd, 5, inicio=(0.0, 0.2), comp=(0.2, 0.5), larg=(1, 3), lad=True)
    return multiplicar(a, 1 - 0.07 * e)


def p_at_verde(w, h, ppm, rnd):
    a = chapado(w, h, '#86c53a')
    a[int(h * 0.62):] = cor('#f1d23a')
    return multiplicar(a, 1 + 0.03 * fbm(h, w, 0.3 * ppm, rnd, 2, True))


def interior_atacado(W, H, ppm, rnd):
    """dentro do atacado: pé-direito alto, luz de galpão em fila no teto
       e as gôndolas cheias de caixa colorida"""
    a = chapado(W, H, '#d9d6c9')
    ys = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    a = a * (1.05 - 0.35 * ys)
    # a fileira de luminária
    for x in np.arange(0.3 * ppm, W, 0.9 * ppm):
        retangulo(a, x, 0.35 * ppm, x + 0.55 * ppm, 0.42 * ppm, '#fbfbf4', sombra=False)
    cores = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2980b9', '#ecf0f1', '#8e44ad', '#d35400', '#16a085', '#f39c12']
    y = 1.5 * ppm
    while y < H - 0.1 * ppm:
        a[int(y):int(y) + 3] = cor('#8f8c84')
        x = 0
        while x < W:
            pw = rnd.uniform(0.12, 0.3) * ppm
            ph = rnd.uniform(0.2, 0.42) * ppm
            if rnd.random() < 0.9:
                c = cor(cores[int(rnd.integers(0, len(cores)))]) * (0.6 + 0.3 * rnd.random())
                a[max(0, int(y - ph)):int(y), int(x):int(x + pw - 1)] = c
            x += pw
        y += 0.55 * ppm
    return a


def caixilho_vitrine(a, w, h, ppm, montantes=(1 / 3, 2 / 3), bandeira=3.3):
    esp = max(3, int(0.07 * ppm))
    Y = em(h, ppm)
    moldura(a, 0, 0, w, h, esp, '#f2f2ef')
    for f in montantes:
        retangulo(a, w * f - esp / 2, 0, w * f + esp / 2, h, '#f2f2ef')
    retangulo(a, 0, Y(bandeira) - esp / 2, w, Y(bandeira) + esp / 2, '#f2f2ef')
    retangulo(a, 0, Y(0.3), w, h, '#c9ccca')                 # o rodapé de chapa


def p_at_vidro(w, h, ppm, rnd):
    a = interior_atacado(w, h, ppm, rnd)
    v = vidro(w, h, rnd, base='#0d1418', topo='#7f93a3', reflexo=0.25)
    a = a * 0.55 + v * 0.5
    caixilho_vitrine(a, w, h, ppm)
    return np.clip(a, 0, 1)


def p_at_porta(w, h, ppm, rnd):
    a = interior_atacado(w, h, ppm, rnd)
    v = vidro(w, h, rnd, base='#0d1418', topo='#7f93a3', reflexo=0.2)
    a = a * 0.62 + v * 0.42
    Y = em(h, ppm)
    esp = max(3, int(0.07 * ppm))
    caixilho_vitrine(a, w, h, ppm, montantes=(0.2, 0.8), bandeira=3.3)
    # as duas folhas de correr, com o puxador vertical, e o trilho em cima
    retangulo(a, w * 0.2, Y(2.55) - esp, w * 0.8, Y(2.55), '#b9bcbd')
    retangulo(a, w / 2 - esp / 2, Y(2.55), w / 2 + esp / 2, Y(0.3), '#d9dcdc')
    # a faixa ENTRADA em cima da porta
    x0, x1, y0, y1 = w * 0.22, w * 0.78, Y(3.2), Y(2.7)
    retangulo(a, x0, y0, x1, y1, '#1f8a3c')
    desenhar(a, lambda d, im: d.text(((x0 + x1) / 2, (y0 + y1) / 2), 'ENTRADA', fill=(250, 250, 244), anchor='mm',
                                     font=caber(d, 'ENTRADA', (x1 - x0) * 0.8, (y1 - y0) * 0.7)))
    return np.clip(a, 0, 1)


def p_at_bordo(w, h, ppm, rnd):
    """o painel bordô: chapa lisa, com a junta a cada metro (a de
       nervura lia como cortina)"""
    a = multiplicar(chapado(w, h, BORDO_AT), 1 + 0.05 * fbm(h, w, 0.5 * ppm, rnd, 3, False))
    for x in np.arange(ppm, w - 2, ppm):
        retangulo(a, x - 1, 0, x + 2, h, '#4f1520', sombra=False)
    Y = em(h, ppm)
    esp = max(3, int(0.07 * ppm))
    moldura(a, 0, 0, w, h, esp, '#f2f2ef')
    retangulo(a, 0, Y(0.3), w, h, '#c9ccca')
    return a


def p_at_cartaz(w, h, ppm, rnd):
    a = p_at_vidro(w, h, ppm, rnd)
    Y = em(h, ppm)
    cartazes = [(0.06, 2.0, 1.15, 1.5, '#f7d52a', 'OFERTAS|DA SEMANA'), (0.36, 2.2, 0.85, 1.1, '#e53a2a', 'R$ 4,99|ARROZ 5KG'),
                (0.69, 2.0, 1.1, 1.5, '#f7d52a', 'PREÇO BAIXO|TODO DIA'), (0.4, 0.9, 1.3, 0.55, '#ffffff', 'LEVE 3 PAGUE 2')]
    for (fx, yb, lw, lh, fundo, txt) in cartazes:
        x0, y1 = w * fx, Y(yb)
        x1, y0 = x0 + lw * ppm, Y(yb + lh)
        retangulo(a, x0, y0, x1, y1, fundo)
        linhas = txt.split('|')
        def t(d, im, x0=x0, x1=x1, y0=y0, y1=y1, linhas=linhas, fundo=fundo):
            tinta = (250, 250, 245) if fundo == '#e53a2a' else (200, 30, 25)
            for i, l in enumerate(linhas):
                yy = y0 + (y1 - y0) * (i + 0.6) / (len(linhas) + 0.2)
                d.text(((x0 + x1) / 2, yy), l, fill=tinta if i == 0 else (25, 25, 25), anchor='mm',
                       font=caber(d, l, (x1 - x0) * 0.86, (y1 - y0) / (len(linhas) + 0.6)))
        desenhar(a, t)
    return a


def carrinho(d, cx, cy, s, fill, largura):
    """o carrinho de compras em traço grosso: alça, cesto, rodas"""
    lw = max(2, int(largura))
    alca = [(cx - 0.62 * s, cy - 0.46 * s), (cx - 0.42 * s, cy - 0.46 * s), (cx - 0.26 * s, cy + 0.18 * s)]
    d.line(alca, fill=fill, width=lw, joint='curve')
    cesto = [(cx - 0.36 * s, cy - 0.26 * s), (cx + 0.6 * s, cy - 0.26 * s), (cx + 0.44 * s, cy + 0.18 * s), (cx - 0.24 * s, cy + 0.18 * s)]
    d.polygon(cesto, fill=fill)
    d.line([(cx - 0.24 * s, cy + 0.18 * s), (cx - 0.3 * s, cy + 0.32 * s), (cx + 0.5 * s, cy + 0.32 * s)], fill=fill, width=lw)
    for rx in (cx - 0.2 * s, cx + 0.4 * s):
        r = 0.09 * s
        d.ellipse([rx - r, cy + 0.44 * s - r, rx + r, cy + 0.44 * s + r], fill=fill)


def p_at_emblema(w, h, ppm, rnd):
    """o emblema: disco amarelo com a borda laranja e o carrinho branco"""
    a = chapa_trapezoidal(w, h, ppm, rnd, AZUL_AT, 0.2, True, lad=False)
    r = min(w, h) * 0.49
    cx, cy = w / 2, h / 2
    m = mascara_forma(w, h, lambda d: d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255), borrao=1)
    ys = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    grad = cor('#ffd94a')[None, None, :] * (1 - ys) + cor(LARANJA_AT)[None, None, :] * ys
    aplicar(a, np.broadcast_to(grad, (h, w, 3)), m)
    desenhar(a, lambda d, im: (d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(214, 92, 20), width=max(3, int(0.06 * ppm))),
                                carrinho(d, cx + 0.02 * w, cy - 0.02 * h, r * 1.05, (255, 255, 250), 0.07 * ppm)))
    return a


def p_at_marca(w, h, ppm, rnd):
    """o selo: retângulo de canto redondo, vermelho em baixo e laranja em
       cima, com o nome em branco e a sombra escura"""
    a = chapa_trapezoidal(w, h, ppm, rnd, AZUL_AT, 0.2, True, lad=False)
    raio = h * 0.28
    m = mascara_forma(w, h, lambda d: d.rounded_rectangle([1, 1, w - 2, h - 2], raio, fill=255), borrao=1)
    ys = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    grad = cor(LARANJA_AT)[None, None, :] * (1 - ys) + cor(VERMELHO_AT)[None, None, :] * ys
    aplicar(a, np.broadcast_to(grad, (h, w, 3)), m)
    def t(d, im):
        d.rounded_rectangle([1, 1, w - 2, h - 2], raio, outline=(255, 238, 214), width=max(3, int(0.04 * ppm)))
        f = caber(d, NOME_ATACADO, w * 0.84, h * 0.66)
        d.text((w / 2 + 0.03 * ppm, h / 2 + 0.04 * ppm), NOME_ATACADO, fill=(110, 25, 10), anchor='mm', font=f)
        d.text((w / 2, h / 2), NOME_ATACADO, fill=(255, 255, 250), anchor='mm', font=f)
    desenhar(a, t)
    return a


def p_at_atacadista(w, h, ppm, rnd):
    a = chapa_trapezoidal(w, h, ppm, rnd, AZUL_AT, 0.2, True, lad=False)
    desenhar(a, lambda d, im: d.text((w * 0.02, h / 2), 'ATACADISTA', fill=(255, 255, 252), anchor='lm',
                                     font=caber(d, 'ATACADISTA', w * 0.96, h * 0.78)))
    return a


def p_at_painel(w, h, ppm, rnd):
    """o painel da quina: amarelo, as faixas diagonais laranja e vermelha
       e o carrinho grande em traço branco"""
    a = chapado(w, h, AMARELO_AT)
    def f(d, im):
        for i, (c, larg) in enumerate(((LARANJA_AT, 0.55), (VERMELHO_AT, 0.28), (LARANJA_AT, 0.18))):
            off = (0.35 + i * 0.22) * w
            e = larg * ppm
            d.polygon([(off, h), (off + e, h), (off + e + h * 0.55, 0), (off + h * 0.55, 0)], fill=tuple(int(v * 255) for v in cor(c)))
        carrinho(d, w * 0.36, h * 0.3, w * 0.4, (255, 255, 250), 0.12 * ppm)
    desenhar(a, f)
    return multiplicar(a, 1 + 0.03 * fbm(h, w, 0.6 * ppm, rnd, 3, False))


def p_at_doca(w, h, ppm, rnd):
    """a doca: porta de enrolar cinza dentro do fole de borracha preto, o
       para-choque amarelo e preto embaixo"""
    a = chapa_trapezoidal(w, h, ppm, rnd, '#eceeed', 0.5, True, lad=False)
    Y = em(h, ppm)
    x0, x1, y0, y1 = 0.12 * w, 0.88 * w, Y(4.1), Y(1.2)
    retangulo(a, x0, y0, x1, y1, '#1b1c1d')
    px0, px1, py0 = x0 + 0.28 * ppm, x1 - 0.28 * ppm, y0 + 0.3 * ppm
    porta = chapado(int(px1 - px0), int(y1 - py0), '#9aa0a3')
    passo = max(3, int(0.1 * ppm))
    for yy in range(porta.shape[0]):
        porta[yy] *= 0.86 + 0.18 * math.sin((yy % passo) / passo * math.pi)
    colar(a, porta, px0, py0)
    retangulo(a, 0.2 * w, Y(1.2), 0.8 * w, Y(0.95), '#3c3d3e')
    for i in range(8):
        xa = 0.2 * w + i * 0.6 * w / 8
        retangulo(a, xa, Y(1.18), xa + 0.3 * w / 8, Y(0.97), '#f2c230', sombra=False)
    retangulo(a, 0, Y(0.95), w, h, '#8b8c89')
    return a


def p_at_telhado(w, h, ppm, rnd):
    a = chapa_trapezoidal(w, h, ppm, rnd, '#dfe2e2', 0.25, True, suja=0.06)
    return multiplicar(a, 1 - 0.1 * borrar(np.clip(pontos(h, w, 6, 4, 12, rnd, True, sinal=1.0), 0, 1), 5))


def p_at_claraboia(w, h, ppm, rnd):
    a = chapa_trapezoidal(w, h, ppm, rnd, '#c9dbe6', 0.25, True, suja=0.03)
    return np.clip(a * 1.08, 0, 1)


def p_at_forro(w, h, ppm, rnd):
    a = chapa_trapezoidal(w, h, ppm, rnd, '#e9ebea', 0.3, False, suja=0.03)
    retangulo(a, w * 0.35, h * 0.44, w * 0.65, h * 0.56, '#fffff6', sombra=False)
    return a


def p_at_coluna(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#f3f3f0', grao=0.02, manchas=0.04, lad=False)
    Y = em(h, ppm)
    retangulo(a, 0, Y(0.62), w, Y(0.3), '#f2c230', sombra=False)
    retangulo(a, 0, Y(0.3), w, h, '#1c1c1c', sombra=False)
    return a


def p_at_asfalto(w, h, ppm, rnd):
    a = chapado(w, h, '#4b4d4f')
    a = multiplicar(a, 1 + 0.12 * fbm(h, w, 0.08 * ppm, rnd, 4, True))
    m = borrar(np.clip(pontos(h, w, 5, 6, 22, rnd, True, sinal=1.0), 0, 1), 6)
    return np.clip(multiplicar(a, 1 - 0.16 * m), 0, 1)


def p_at_piso(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#b9b6ad', grao=0.05, manchas=0.08, lad=True)
    for f in (0, 0.5):
        retangulo(a, 0, h * f, w, h * f + 2, '#8e8b83', sombra=False)
        retangulo(a, w * f, 0, w * f + 2, h, '#8e8b83', sombra=False)
    return a


def p_at_linha(w, h, ppm, rnd):
    return multiplicar(chapado(w, h, '#f1f0e8'), 1 + 0.05 * fbm(h, w, 2, rnd, 2, True))


def p_at_totem(w, h, ppm, rnd):
    """o totem da avenida: a marca em cima, o horário no meio, o
       estacionamento grátis embaixo e o pé de concreto"""
    a = chapa_trapezoidal(w, h, ppm, rnd, AZUL_AT, 0.2, True, lad=False)
    Y = em(h, ppm)
    # o emblema e o selo, em cima
    em_ = p_at_emblema(int(1.3 * ppm), int(1.3 * ppm), ppm, rnd)
    colar(a, em_, (w - em_.shape[1]) / 2, Y(8.35))
    selo = p_at_marca(int(2.2 * ppm), int(0.62 * ppm), ppm, rnd)
    colar(a, selo, (w - selo.shape[1]) / 2, Y(7.0))
    desenhar(a, lambda d, im: d.text((w / 2, Y(6.12)), 'ATACADISTA', fill=(255, 255, 252), anchor='mm',
                                     font=caber(d, 'ATACADISTA', w * 0.84, 0.3 * ppm)))
    retangulo(a, 0, Y(5.62), w, Y(5.5), '#86c53a', sombra=False)
    # o quadro branco do horário
    retangulo(a, 0.1 * w, Y(5.3), 0.9 * w, Y(3.55), '#f6f6f2')
    desenhar(a, lambda d, im: (d.text((w / 2, Y(4.85)), 'ABERTO TODOS', fill=(30, 60, 110), anchor='mm', font=caber(d, 'ABERTO TODOS', w * 0.74, 0.3 * ppm)),
                                d.text((w / 2, Y(4.45)), 'OS DIAS', fill=(30, 60, 110), anchor='mm', font=caber(d, 'OS DIAS', w * 0.74, 0.3 * ppm)),
                                d.text((w / 2, Y(3.92)), '7H ÀS 22H', fill=(210, 60, 25), anchor='mm', font=caber(d, '7H ÀS 22H', w * 0.74, 0.42 * ppm))))
    # o estacionamento grátis, na faixa amarela
    retangulo(a, 0.1 * w, Y(3.3), 0.9 * w, Y(2.3), AMARELO_AT)
    desenhar(a, lambda d, im: (d.text((w / 2, Y(3.0)), 'ESTACIONAMENTO', fill=(35, 35, 30), anchor='mm', font=caber(d, 'ESTACIONAMENTO', w * 0.74, 0.3 * ppm)),
                                d.text((w / 2, Y(2.58)), 'GRÁTIS', fill=(200, 40, 20), anchor='mm', font=caber(d, 'GRÁTIS', w * 0.74, 0.34 * ppm))))
    # o pé de concreto
    a[int(Y(1.1)):] = reboco(w, h - int(Y(1.1)), ppm, rnd, '#b4b1a8', grao=0.05, lad=False)
    return a


def p_at_carreta(w, h, ppm, rnd):
    a = chapa_trapezoidal(w, h, ppm, rnd, '#f1f2f0', 0.6, True, lad=False, suja=0.05)
    Y = em(h, ppm)
    retangulo(a, 0, Y(0.55), w, h, AZUL_AT, sombra=False)
    retangulo(a, 0, Y(0.62), w, Y(0.55), '#86c53a', sombra=False)
    em_ = p_at_emblema(int(1.6 * ppm), int(1.6 * ppm), ppm, rnd)
    colar(a, em_, 0.8 * ppm, Y(2.55))
    selo = p_at_marca(int(4.6 * ppm), int(1.15 * ppm), ppm, rnd)
    colar(a, selo, 2.7 * ppm, Y(2.3))
    desenhar(a, lambda d, im: d.text((7.6 * ppm, Y(1.72)), 'ENTREGA PRA TODA A CIDADE', fill=(31, 85, 150), anchor='lm',
                                     font=caber(d, 'ENTREGA PRA TODA A CIDADE', w - 8.0 * ppm, 0.38 * ppm)))
    e = escorrido(h, w, rnd, 10, inicio=(0.0, 0.1), comp=(0.3, 0.7), larg=(1, 3), lad=False)
    return multiplicar(a, 1 - 0.08 * e)


def p_at_carreta_porta(w, h, ppm, rnd):
    a = chapa_trapezoidal(w, h, ppm, rnd, '#e7e8e6', 0.6, False, lad=False)
    esp = max(3, int(0.05 * ppm))
    moldura(a, 0, 0, w, h, esp, '#9ea3a5')
    retangulo(a, w / 2 - esp / 2, 0, w / 2 + esp / 2, h, '#9ea3a5')
    for f in (0.3, 0.7):
        retangulo(a, w * f - 2, esp, w * f + 2, h - esp, '#6f7477', sombra=False)
    return a


def p_at_cavalo(w, h, ppm, rnd):
    """a frente do cavalo mecânico: para-brisa, grade e os faróis"""
    a = reboco(w, h, ppm, rnd, '#b8231c', grao=0.03, manchas=0.05, lad=False)
    Y = em(h, ppm)
    v = vidro(int(w * 0.84), int(0.7 * ppm), rnd, base='#101417', topo='#60717c', reflexo=0.3)
    colar(a, v, w * 0.08, Y(2.05))
    retangulo(a, w * 0.22, Y(1.2), w * 0.78, Y(0.55), '#2a2b2c')
    for fx in (0.08, 0.8):
        retangulo(a, w * fx, Y(0.95), w * fx + 0.28 * ppm, Y(0.7), '#f4f2e0')
    retangulo(a, 0, Y(0.35), w, h, '#303132')
    return a


def p_at_cavalo_lado(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#b8231c', grao=0.03, manchas=0.05, lad=False)
    Y = em(h, ppm)
    v = vidro(int(w * 0.36), int(0.6 * ppm), rnd, base='#101417', topo='#60717c', reflexo=0.3)
    colar(a, v, w * 0.08, Y(2.0))
    moldura(a, w * 0.05, Y(2.1), w * 0.5, Y(0.5), 2, '#8a1a15')
    retangulo(a, 0, Y(0.35), w, h, '#303132')
    return a


def p_at_porta_servico(w, h, ppm, rnd):
    a = chapa_trapezoidal(w, h, ppm, rnd, '#9fa6aa', 0.25, True, lad=False)
    esp = max(3, int(0.05 * ppm))
    moldura(a, 0, 0, w, h, esp, '#e9ebea')
    retangulo(a, w * 0.72, h * 0.5, w * 0.84, h * 0.53, '#2a2b2c', sombra=False)
    x0, x1, y0, y1 = w * 0.14, w * 0.86, h * 0.14, h * 0.26
    retangulo(a, x0, y0, x1, y1, '#f4f2ec')
    desenhar(a, lambda d, im: d.text(((x0 + x1) / 2, (y0 + y1) / 2), 'SÓ FUNCIONÁRIOS', fill=(180, 30, 25), anchor='mm',
                                     font=caber(d, 'SÓ FUNCIONÁRIOS', (x1 - x0) * 0.9, (y1 - y0) * 0.6)))
    return a


def folha_atacadex():
    F = Folha('atacadex')
    F.cel('azul', 2.0, 1.0, 80, p_at_azul, lad=True)
    F.cel('branco', 2.0, 2.0, 60, p_at_branco, lad=True)
    F.cel('verde', 2.0, 0.2, 80, p_at_verde, lad=True)
    F.cel('vidro', 4.0, 4.3, 64, p_at_vidro)
    F.cel('porta', 4.0, 4.3, 64, p_at_porta)
    F.cel('bordo', 4.0, 4.3, 64, p_at_bordo)
    F.cel('cartaz', 4.0, 4.3, 64, p_at_cartaz)
    F.cel('marca', 6.0, 1.5, 100, p_at_marca)
    F.cel('emblema', 2.0, 2.0, 100, p_at_emblema)
    F.cel('atacadista', 5.0, 0.8, 90, p_at_atacadista)
    F.cel('painel', 5.5, 5.4, 45, p_at_painel)
    F.cel('doca', 3.6, 4.3, 60, p_at_doca)
    F.cel('telhado', 3.0, 3.0, 40, p_at_telhado, lad=True)
    F.cel('claraboia', 1.0, 3.0, 40, p_at_claraboia, lad=True)
    F.cel('forro', 2.0, 2.0, 40, p_at_forro, lad=True)
    F.cel('coluna', 0.45, 4.6, 60, p_at_coluna)
    F.cel('asfalto', 4.0, 4.0, 40, p_at_asfalto, lad=True)
    F.cel('piso', 2.0, 2.0, 50, p_at_piso, lad=True)
    F.cel('linha', 0.5, 0.5, 20, p_at_linha, lad=True)
    F.cel('totem', 2.4, 8.5, 50, p_at_totem)
    F.cel('carreta', 12.4, 3.1, 32, p_at_carreta)
    F.cel('carreta_porta', 2.5, 3.1, 50, p_at_carreta_porta)
    F.cel('cavalo', 2.4, 2.2, 60, p_at_cavalo)
    F.cel('cavalo_lado', 2.0, 2.2, 60, p_at_cavalo_lado)
    F.cel('porta_servico', 1.0, 2.2, 80, p_at_porta_servico)
    return F.montar()


# =========================================================
#   11. OS DOIS PRÉDIOS DO BALDIO — o condomínio de duas torres
#   O EDIFÍCIO MIRANTE, de concreto cinza com a cortina de vidro azul
#   no rasgo e na quina, janelinha solta no concreto; e o RESIDENCIAL
#   BELA VISTA, de quadro branco, tijolinho laranja e as sacadas de
#   vidro azul. Os módulos de andar têm os 2,9 m do pé-direito: a
#   fachada é montada empilhando um por andar.
# =========================================================
CONCRETO_T1 = '#aba598'
BRANCO_T2 = '#eeede8'


def junta_de_laje(a, h, ppm, c=0.78):
    """o friso da laje no pé do módulo: é o que conta os andares de longe"""
    Y = em(h, ppm)
    a[int(Y(0.03)):] *= c
    a[:max(1, int(0.012 * ppm))] *= 0.9


def p_t1_concreto(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, CONCRETO_T1, grao=0.06, manchas=0.10, fuligem=4)
    e = escorrido(h, w, rnd, 4, inicio=(0.0, 0.4), comp=(0.3, 0.8), larg=(1, 3), lad=True)
    return multiplicar(a, 1 - 0.10 * e)


def modulo_t1(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, CONCRETO_T1, grao=0.06, manchas=0.08, lad=False, fuligem=3)
    junta_de_laje(a, h, ppm)
    return a


def p_t1_cego(w, h, ppm, rnd):
    a = modulo_t1(w, h, ppm, rnd)
    e = escorrido(h, w, rnd, 3, inicio=(0.0, 0.2), comp=(0.2, 0.6), larg=(1, 2), lad=False)
    return multiplicar(a, 1 - 0.12 * e)


def p_t1_jan(w, h, ppm, rnd):
    """o concreto com a janelinha: vidro escuro, caixilho grafite e o
       peitoril claro que escorre"""
    a = modulo_t1(w, h, ppm, rnd)
    Y = em(h, ppm)
    jw, y0, y1 = 0.72 * ppm, Y(2.3), Y(1.0)
    x0 = w / 2 - jw / 2
    esp = max(2, int(0.04 * ppm))
    v = vidro(int(jw) - 2 * esp, int(y1 - y0) - 2 * esp, rnd, base='#15202a', topo='#6f8596', reflexo=0.16)
    colar(a, v, x0 + esp, y0 + esp)
    moldura(a, x0, y0, x0 + jw, y1, esp, '#3a3d40')
    retangulo(a, x0 + jw / 2 - esp * 0.4, y0, x0 + jw / 2 + esp * 0.4, y1, '#3a3d40', sombra=False)
    sombra_interna(a, x0 + esp, y0 + esp, x0 + jw - esp, y1 - esp, esp * 1.8, 0.45)
    retangulo(a, x0 - 0.05 * ppm, y1, x0 + jw + 0.05 * ppm, y1 + 0.05 * ppm, '#c9c4b8')
    e = escorrido(h, w, rnd, 4, inicio=(0.66, 0.68), comp=(0.1, 0.3), larg=(1, 3), lad=False)
    return multiplicar(a, 1 - 0.22 * e)


def cortina_azul(w, h, ppm, rnd, peitoril=0.9, montantes=(0.5,)):
    """a pele de vidro azul: o vidro de visão em cima, o spandrel opaco
       na altura da laje e os montantes de alumínio"""
    Y = em(h, ppm)
    a = vidro(w, h, rnd, base='#23405e', topo='#9bb6cf', reflexo=0.22)
    a = multiplicar(a, 1 + 0.05 * fbm(h, w, 0.8 * ppm, rnd, 2, False))
    sp = vidro(w, int(peitoril * ppm), rnd, base='#1d3047', topo='#4f6d8c', reflexo=0.08)
    colar(a, sp, 0, Y(peitoril))
    esp = max(2, int(0.045 * ppm))
    al = '#586572'
    retangulo(a, 0, 0, w, esp, al)
    retangulo(a, 0, h - esp, w, h, al)
    retangulo(a, 0, Y(peitoril) - esp / 2, w, Y(peitoril) + esp / 2, al)
    retangulo(a, 0, 0, esp, h, al)
    retangulo(a, w - esp, 0, w, h, al)
    for f in montantes:
        retangulo(a, w * f - esp / 2, 0, w * f + esp / 2, Y(peitoril), al)
    return np.clip(a, 0, 1)


def p_t1_vidro(w, h, ppm, rnd):
    return cortina_azul(w, h, ppm, rnd)


def p_t1_coroa(w, h, ppm, rnd):
    """a coroa: o concreto da massa da direita subindo cego, com a
       veneziana larga da casa de máquinas"""
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, CONCRETO_T1, grao=0.06, manchas=0.12, lad=False, fuligem=4)
    x0, x1, y0, y1 = w * 0.30, w * 0.70, Y(2.9), Y(1.2)
    retangulo(a, x0, y0, x1, y1, '#6f7274')
    passo = max(3, int(0.07 * ppm))
    for y in range(int(y0 + 2), int(y1 - 2)):
        f = ((y - y0) % passo) / passo
        a[y, int(x0 + 2):int(x1 - 2)] = cor('#5d6062') * (0.75 + 0.45 * f)
    moldura(a, x0, y0, x1, y1, max(2, int(0.05 * ppm)), '#8c8f90')
    retangulo(a, 0, 0, w, Y(3.55), '#c2bcb0')                  # o capeamento
    e = escorrido(h, w, rnd, 8, inicio=(0.02, 0.08), comp=(0.3, 0.9), larg=(1, 4), lad=False)
    return multiplicar(a, 1 - 0.2 * e)


def interior_saguao(W, H, ppm, rnd):
    """o saguão lá dentro: teto claro com a luminária, parede bege e a
       mancha verde de um vaso"""
    a = chapado(W, H, '#cfc6b4')
    ys = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    a = a * (1.08 - 0.45 * ys)
    for x in np.arange(0.4 * ppm, W, 1.1 * ppm):
        retangulo(a, x, 0.12 * ppm, x + 0.5 * ppm, 0.18 * ppm, '#fffbea', sombra=False)
    cx = rnd.uniform(0.25, 0.75) * W
    desenhar(a, lambda d, im: d.ellipse([cx - 0.2 * ppm, H - 1.15 * ppm, cx + 0.2 * ppm, H - 0.45 * ppm], fill=(86, 104, 74)))
    retangulo(a, cx - 0.14 * ppm, H - 0.5 * ppm, cx + 0.14 * ppm, H - 0.1 * ppm, '#8a7a66', sombra=False)
    return a


def p_saguao(montantes, porta=False, branco=False):
    def f(w, h, ppm, rnd):
        Y = em(h, ppm)
        a = interior_saguao(w, h, ppm, rnd)
        v = vidro(w, h, rnd, base='#101820', topo='#7d93a6', reflexo=0.2)
        a = a * 0.5 + v * 0.55
        esp = max(3, int(0.06 * ppm))
        c = '#e9e9e4' if branco else '#50575d'
        retangulo(a, 0, 0, w, Y(h / ppm - 0.35), '#e3e1da' if branco else '#b6b0a3')   # a viga em cima
        moldura(a, 0, Y(h / ppm - 0.35), w, h, esp, c)
        for fx in montantes:
            retangulo(a, w * fx - esp / 2, Y(h / ppm - 0.35), w * fx + esp / 2, h, c)
        retangulo(a, 0, Y(2.7) - esp / 2, w, Y(2.7) + esp / 2, c)
        if porta:
            # as duas folhas de abrir com o puxador comprido
            for fx in (0.46, 0.54):
                retangulo(a, w * fx - esp * 0.35, Y(1.5), w * fx + esp * 0.35, Y(0.8), '#cfd2d4')
        retangulo(a, 0, Y(0.08), w, h, '#8f8b82')                  # a soleira
        return np.clip(a, 0, 1)
    return f


def placa_letras(texto, fundo, tinta, sombra=True):
    def f(w, h, ppm, rnd):
        a = reboco(w, h, ppm, rnd, fundo, grao=0.03, manchas=0.04, lad=False)
        fnt = [None]

        def t(d, im):
            fnt[0] = caber(d, texto, w * 0.92, h * 0.62)
            if sombra:
                d.text((w / 2 + max(1, h * 0.03), h / 2 + max(1, h * 0.04)), texto, fill=(90, 88, 84), anchor='mm', font=fnt[0])
            d.text((w / 2, h / 2), texto, fill=tuple(int(v * 255) for v in cor(tinta)), anchor='mm', font=fnt[0])
        desenhar(a, t)
        return a
    return f


def p_cobertura(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#8f8c85', grao=0.10, manchas=0.14, pintas=8)
    return a


def p_t2_branco(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, BRANCO_T2, grao=0.03, manchas=0.05)
    e = escorrido(h, w, rnd, 3, inicio=(0.0, 0.5), comp=(0.2, 0.5), larg=(1, 2), lad=True)
    return multiplicar(a, 1 - 0.06 * e)


TIJOLO_T2 = ['#c56b3b', '#b95f34', '#cf7746', '#b1592f', '#c87040', '#bd6436']


def p_t2_tijolo(w, h, ppm, rnd, lad=True):
    return tijolos(w, h, ppm, rnd, TIJOLO_T2, argamassa='#d9cfc1', lad=lad, var=0.12)


def p_t2_jan_tij(w, h, ppm, rnd):
    """o tijolinho com a janela pequena de requadro branco"""
    Y = em(h, ppm)
    a = p_t2_tijolo(w, h, ppm, rnd, lad=False)
    jw = 0.62 * ppm
    x0, y0, y1 = w / 2 - jw / 2, Y(2.25), Y(1.05)
    req = max(3, int(0.07 * ppm))
    retangulo(a, x0 - req, y0 - req, x0 + jw + req, y1 + req, '#f1f0eb')
    esp = max(2, int(0.035 * ppm))
    v = vidro(int(jw) - 2 * esp, int(y1 - y0) - 2 * esp, rnd, base='#162330', topo='#7f97aa', reflexo=0.15)
    colar(a, v, x0 + esp, y0 + esp)
    moldura(a, x0, y0, x0 + jw, y1, esp, '#dedfdc')
    sombra_interna(a, x0 + esp, y0 + esp, x0 + jw - esp, y1 - esp, esp * 1.6, 0.4)
    return a


def p_t2_jan_br(w, h, ppm, rnd):
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, BRANCO_T2, grao=0.03, manchas=0.05, lad=False)
    junta_de_laje(a, h, ppm, 0.9)
    jw = 0.5 * ppm
    x0, y0, y1 = w / 2 - jw / 2, Y(2.15), Y(1.15)
    esp = max(2, int(0.035 * ppm))
    v = vidro(int(jw) - 2 * esp, int(y1 - y0) - 2 * esp, rnd, base='#162330', topo='#7f97aa', reflexo=0.14)
    colar(a, v, x0 + esp, y0 + esp)
    moldura(a, x0, y0, x0 + jw, y1, esp, '#9a9d9f')
    sombra_interna(a, x0 + esp, y0 + esp, x0 + jw - esp, y1 - esp, esp * 1.6, 0.4)
    e = escorrido(h, w, rnd, 3, inicio=(0.60, 0.62), comp=(0.1, 0.25), larg=(1, 2), lad=False)
    return multiplicar(a, 1 - 0.10 * e)


def p_t2_sacada(w, h, ppm, rnd):
    """o fundo da sacada: a porta de correr de vidro azul de parede a
       parede, o forro da laje de cima na sombra"""
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#dcdad3', grao=0.03, manchas=0.05, lad=False)
    x0, x1, y0, y1 = 0.12 * ppm, w - 0.12 * ppm, Y(2.45), Y(0.05)
    v = cortina_azul(int(x1 - x0), int(y1 - y0), ppm, rnd, peitoril=0.02, montantes=(0.25, 0.5, 0.75))
    colar(a, v, x0, y0)
    moldura(a, x0, y0, x1, y1, max(2, int(0.04 * ppm)), '#eeeeea')
    a[:int(Y(2.45))] *= 0.8                                     # a sombra do forro
    return np.clip(a, 0, 1)


def p_t2_guarda(w, h, ppm, rnd):
    """o guarda-corpo de vidro: vidro verde-azulado, o corrimão branco
       em cima e os montantinhos"""
    Y = em(h, ppm)
    a = vidro(w, h, rnd, base='#3a6378', topo='#a9c6d4', reflexo=0.28)
    a = a * 0.85 + cor('#6f9bb0')[None, None, :] * 0.15
    esp = max(3, int(0.05 * ppm))
    retangulo(a, 0, 0, w, esp * 1.6, '#f3f3ef')
    for f in (0.0, 0.5, 1.0):
        x = min(w - esp, max(0, w * f - esp / 2))
        retangulo(a, x, 0, x + esp, h, '#e9e9e4')
    retangulo(a, 0, Y(0.06), w, h, '#dcdcd6')
    return np.clip(a, 0, 1)


def p_muro_condo(w, h, ppm, rnd):
    """o muro do condomínio: reboco creme, rodapé cinza, capa clara em
       cima e a sujeira que escorre dela"""
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#e4dfd2', grao=0.04, manchas=0.10)
    a[int(Y(0.28)):] = reboco(w, h, ppm, rnd, '#9a978f', grao=0.06, manchas=0.10)[int(Y(0.28)):]
    a[:int(Y(2.28))] = reboco(w, h, ppm, rnd, '#c9c5ba', grao=0.04, manchas=0.06)[:int(Y(2.28))]
    a[int(Y(2.28)):int(Y(2.26))] *= 0.7
    e = escorrido(h, w, rnd, 7, inicio=(0.05, 0.08), comp=(0.2, 0.6), larg=(1, 3), lad=True)
    a = multiplicar(a, 1 - 0.14 * e)
    respingo = np.clip(fbm(h, w, 0.25 * ppm, rnd, 3, True) * 2.5, 0, 1)
    rodape = np.clip((np.arange(h)[:, None] - Y(0.7)) / (0.45 * ppm), 0, 1)
    return multiplicar(a, 1 - 0.18 * respingo * rodape)


def p_guarita(w, h, ppm, rnd):
    """a frente da guarita: o vidro escuro fumê, o interfone e a placa"""
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#e8e6df', grao=0.03, manchas=0.06, lad=False)
    x0, x1, y0, y1 = 0.2 * ppm, w - 0.2 * ppm, Y(2.1), Y(1.05)
    v = vidro(int(x1 - x0), int(y1 - y0), rnd, base='#0b0f12', topo='#46525b', reflexo=0.2)
    colar(a, v, x0, y0)
    moldura(a, x0, y0, x1, y1, max(2, int(0.04 * ppm)), '#6c7074')
    retangulo(a, w / 2 - 0.12 * ppm, Y(1.0), w / 2 + 0.12 * ppm, Y(0.8), '#4f5357')   # o passa-volume
    retangulo(a, x0, Y(2.5), x1, Y(2.25), '#2f5f8a')
    desenhar(a, lambda d, im: d.text((w / 2, Y(2.375)), 'PORTARIA', fill=(240, 240, 236), anchor='mm',
                                     font=caber(d, 'PORTARIA', (x1 - x0) * 0.8, 0.2 * ppm)))
    retangulo(a, 0, Y(0.12), w, h, '#9a978f')
    return a


def folha_torres():
    F = Folha('torres')
    F.cel('t1_concreto', 2.0, 2.0, 90, p_t1_concreto, lad=True)
    F.cel('t1_jan', 1.8, 2.9, 90, p_t1_jan)
    F.cel('t1_cego', 1.8, 2.9, 90, p_t1_cego)
    F.cel('t1_vidro', 1.8, 2.9, 90, p_t1_vidro)
    F.cel('t1_coroa', 7.4, 3.8, 40, p_t1_coroa)
    F.cel('t1_terreo', 2.4, 3.6, 80, p_saguao((0.5,)))
    F.cel('t1_porta', 2.4, 3.6, 80, p_saguao((0.5,), porta=True))
    F.cel('t1_placa', 4.0, 0.6, 110, placa_letras('EDIFÍCIO MIRANTE', '#b8b2a6', '#2d3034'))
    F.cel('cobertura', 2.0, 2.0, 50, p_cobertura, lad=True)
    F.cel('t2_branco', 2.0, 2.0, 90, p_t2_branco, lad=True)
    F.cel('t2_tijolo', 1.84, 1.2, 110, p_t2_tijolo, lad=True)
    F.cel('t2_jan_tij', 1.3, 2.9, 90, p_t2_jan_tij)
    F.cel('t2_jan_br', 1.2, 2.9, 90, p_t2_jan_br)
    F.cel('t2_sacada', 2.7, 2.9, 90, p_t2_sacada)
    F.cel('t2_guarda', 2.7, 1.1, 90, p_t2_guarda)
    F.cel('t2_terreo', 2.4, 4.2, 70, p_saguao((0.5,), branco=True))
    F.cel('t2_porta', 2.4, 4.2, 70, p_saguao((0.5,), porta=True, branco=True))
    F.cel('t2_nome', 10.0, 0.9, 70, placa_letras('RESIDENCIAL BELA VISTA', '#f2f1ec', '#3a3f45'))
    F.cel('muro', 3.0, 2.4, 60, p_muro_condo, lad=True)
    F.cel('guarita', 1.8, 2.7, 80, p_guarita)
    return F.montar()


# =========================================================
#   12. OS PROPS DE RUA — o que se instala e o que se larga na calçada
#   O contêiner verde de tampa cinza, a lixeira de rodinha de tampa
#   colorida, o saco de lixo preto, a caixa de papelão, o cesto de
#   praça de chapa trançada, a barreira de concreto, a caixa de
#   correio vermelha, o hidrante, os balizadores, o delineador, o
#   cone, o cinzeiro de pé e o banco de madeira. O que muda de cor de
#   um pra outro (o cesto, a tampa da lixeira) sai CLARO: a cor vem do
#   vértice, como na casa.
# =========================================================
def p_pr_malha(w, h, ppm, rnd):
    """a chapa trançada do cesto, clara, com o aro liso em cima e
       embaixo e o encardido que sobe do chão"""
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    P = 0.036 * ppm
    t = np.sin(2 * np.pi * (xs + ys) / P) * np.sin(2 * np.pi * (xs - ys) / P)
    m = 0.5 + 0.5 * t
    a = np.repeat((0.95 * (0.6 + 0.4 * m))[..., None], 3, axis=2)
    Y = em(h, ppm)
    a[:max(1, int(Y(0.66)))] = 0.9
    a[int(Y(0.05)):] = 0.88
    a = multiplicar(a, 1 - 0.22 * np.clip((ys / h - 0.55) / 0.45, 0, 1))
    return np.clip(a, 0, 1)


def p_pr_cacamba(w, h, ppm, rnd):
    """o plástico verde do contêiner, com as nervuras e a borda grossa"""
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#4f9b3d', grao=0.04, manchas=0.12, lad=False)
    xs = np.arange(w, dtype=np.float32)
    nerv = 0.5 + 0.5 * np.cos(2 * np.pi * xs / (0.16 * ppm))
    a *= (0.9 + 0.12 * nerv)[None, :, None]
    retangulo(a, 0, 0, w, Y(h / ppm - 0.09), '#428a33')
    e = escorrido(h, w, rnd, 6, inicio=(0.1, 0.3), comp=(0.3, 0.7), larg=(1, 3), lad=False)
    a = multiplicar(a, 1 - 0.22 * e)
    a = multiplicar(a, 1 - 0.25 * np.clip((np.arange(h)[:, None] - Y(0.25)) / (0.25 * ppm), 0, 1))
    return np.clip(a, 0, 1)


def p_pr_tampa_cacamba(w, h, ppm, rnd):
    """a tampa cinza de duas folhas, com as canaletas correndo pro fundo"""
    a = reboco(w, h, ppm, rnd, '#aeafab', grao=0.03, manchas=0.08, lad=False)
    meio = w / 2
    for k in range(2):
        x0, x1 = k * meio + 0.07 * ppm, (k + 1) * meio - 0.07 * ppm
        n = 6
        for i in range(n):
            x = x0 + (i + 0.5) * (x1 - x0) / n
            retangulo(a, x - 0.02 * ppm, 0.07 * ppm, x + 0.02 * ppm, h - 0.07 * ppm, '#8f908c')
    retangulo(a, meio - 0.012 * ppm, 0, meio + 0.012 * ppm, h, '#6c6d69', sombra=False)
    return a


def p_pr_plastico(base):
    def f(w, h, ppm, rnd):
        return reboco(w, h, ppm, rnd, base, grao=0.03, manchas=0.08)
    return f


def p_pr_lixeira(w, h, ppm, rnd):
    """o corpo cinza da lixeira de rodinha: a boca mais grossa em cima,
       a nervura do meio e o encardido"""
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#9c9e9c', grao=0.03, manchas=0.10, lad=False)
    retangulo(a, 0, 0, w, Y(h / ppm - 0.07), '#8c8e8c')
    retangulo(a, w * 0.15, Y(0.56), w * 0.85, Y(0.53), '#8f918f', sombra=False)
    e = escorrido(h, w, rnd, 5, inicio=(0.1, 0.2), comp=(0.3, 0.8), larg=(1, 3), lad=False)
    return multiplicar(a, 1 - 0.16 * e)


def p_pr_tampa_lixeira(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#eeeeec', grao=0.03, manchas=0.05, lad=False)
    retangulo(a, w * 0.12, h * 0.06, w * 0.88, h * 0.14, '#d4d4d0')
    return a


def p_pr_saco(w, h, ppm, rnd):
    """plástico preto: o vinco claro amassado e o brilho em cima"""
    ys = np.mgrid[0:h, 0:w][0].astype(np.float32)
    a = chapado(w, h, '#1b1c1e')
    vinco = np.clip(fbm(h, w, 0.08 * ppm, rnd, 4, True) * 2.4 - 0.35, 0, 1)
    a = a + 0.22 * vinco[..., None]
    a = a + (np.exp(-((ys / h - 0.3) / 0.2) ** 2) * 0.10)[..., None]
    return np.clip(a, 0, 1)


def p_pr_papelao(w, h, ppm, rnd):
    """o papelão com a fita no meio e a setinha de este lado pra cima"""
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#b88a50', grao=0.05, manchas=0.10, lad=False)
    retangulo(a, w * 0.45, 0, w * 0.55, h, '#caa069', sombra=False)
    for fx in (0.16, 0.28):
        desenhar(a, lambda d, im, fx=fx: d.polygon([(w * fx - 4, Y(0.2)), (w * fx, Y(0.27)), (w * fx + 4, Y(0.2))], fill=(64, 52, 40)))
        retangulo(a, w * fx - 1, Y(0.2), w * fx + 1, Y(0.13), '#403428', sombra=False)
    a[:2] *= 0.8
    return a


def p_pr_papelao_dentro(w, h, ppm, rnd):
    return reboco(w, h, ppm, rnd, '#8f6a3c', grao=0.05, manchas=0.12, lad=False)


def p_pr_concreto(w, h, ppm, rnd):
    return reboco(w, h, ppm, rnd, '#d9d7d0', grao=0.05, manchas=0.14, fuligem=4)


def p_pr_correio(w, h, ppm, rnd):
    """a frente da caixa de correio: a portinhola com CARTAS lá em cima
       e o nome embaixo"""
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#c33b27', grao=0.03, manchas=0.08, lad=False)
    x0, x1, y0, y1 = w * 0.13, w * 0.87, Y(0.64), Y(0.50)
    retangulo(a, x0, y0, x1, y1, '#a9301f')
    retangulo(a, x0 + 0.03 * ppm, y0 + 0.02 * ppm, x1 - 0.03 * ppm, y0 + 0.05 * ppm, '#241512', sombra=False)
    px0, px1, py0, py1 = w * 0.3, w * 0.7, y0 + 0.065 * ppm, y1 - 0.02 * ppm
    retangulo(a, px0, py0, px1, py1, '#e9e6de', sombra=False)
    desenhar(a, lambda d, im: d.text(((px0 + px1) / 2, (py0 + py1) / 2), 'CARTAS', fill=(40, 40, 40), anchor='mm',
                                     font=caber(d, 'CARTAS', (px1 - px0) * 0.9, (py1 - py0) * 0.8)))
    desenhar(a, lambda d, im: d.text((w / 2, Y(0.3)), 'CORREIO', fill=(238, 232, 222), anchor='mm',
                                     font=caber(d, 'CORREIO', w * 0.84, 0.12 * ppm)))
    return a


def p_pr_tinta(base, grao=0.04, manchas=0.10, fuligem=0):
    def f(w, h, ppm, rnd):
        return reboco(w, h, ppm, rnd, base, grao=grao, manchas=manchas, fuligem=fuligem)
    return f


def faixas_horizontais(base, faixas, cor_faixa):
    """cilindro pintado com anéis: `faixas` são (base, topo) em metros"""
    def f(w, h, ppm, rnd):
        Y = em(h, ppm)
        a = reboco(w, h, ppm, rnd, base, grao=0.03, manchas=0.06, lad=False)
        for y0, y1 in faixas:
            retangulo(a, 0, Y(y1), w, Y(y0), cor_faixa, sombra=False)
        return a
    return f


def p_pr_espuma(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#e8cf36', grao=0.05, manchas=0.10, lad=False)
    retangulo(a, w * 0.5 - 1, 0, w * 0.5 + 1, h, '#b9a52b', sombra=False)
    return a


def p_pr_tampa_cinzeiro(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#c2c4c1', grao=0.03, manchas=0.06, lad=False)
    for fx, fy in ((0.4, 0.42), (0.6, 0.42), (0.5, 0.6)):
        desenhar(a, lambda d, im, fx=fx, fy=fy: d.ellipse([w * (fx - 0.075), h * (fy - 0.075), w * (fx + 0.075), h * (fy + 0.075)],
                                                          fill=(58, 60, 58)))
    return a


def p_pr_madeira(w, h, ppm, rnd):
    """a ripa envernizada, o veio correndo no comprimento"""
    ys = np.mgrid[0:h, 0:w][0].astype(np.float32)
    n = fbm(h, w, 0.3 * ppm, rnd, 3, True)
    veio = 0.5 + 0.5 * np.sin(2 * np.pi * (ys / (0.012 * ppm) + 3.0 * n))
    a = chapado(w, h, '#8f5d33') * (0.8 + 0.26 * veio)[..., None]
    return np.clip(a, 0, 1)


def p_pr_fuste(w, h, ppm, rnd):
    """o fuste do poste de concreto, do colar até o alto (8,7 m): cinza
       de concreto centrifugado, o escorrido que desce das cruzetas, a
       mancha escura de mão e de fuligem na altura do meio e as faixas
       brancas pintadas embaixo"""
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#8b8c89', grao=0.06, manchas=0.14, fuligem=2)
    e = escorrido(h, w, rnd, 7, inicio=(0.0, 0.15), comp=(0.2, 0.7), larg=(1, 2), lad=True)
    a = multiplicar(a, 1 - 0.18 * e)
    mancha = np.clip(fbm(h, w, 0.3 * ppm, rnd, 3, True) * 2.6 + 0.3, 0, 1)
    faixa = np.exp(-((np.arange(h, dtype=np.float32)[:, None] - Y(3.6)) / (0.9 * ppm)) ** 2)
    a = multiplicar(a, 1 - 0.35 * mancha * faixa)
    for y0, y1, forca in ((0.45, 0.55, 1.0), (1.85, 1.95, 1.0), (3.45, 3.5, 0.55)):
        b = a[int(Y(y1)):int(Y(y0))]
        a[int(Y(y1)):int(Y(y0))] = b * (1 - forca) + cor('#e8e7e2') * forca
    return np.clip(a, 0, 1)


def p_pr_luminaria(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#dcdcd8', grao=0.04, manchas=0.10, lad=False)
    retangulo(a, 0, h * 0.46, w, h * 0.52, '#a9aaa6', sombra=False)
    e = escorrido(h, w, rnd, 3, inicio=(0.1, 0.3), comp=(0.3, 0.6), larg=(1, 2), lad=False)
    return multiplicar(a, 1 - 0.15 * e)


def p_pr_lente(w, h, ppm, rnd):
    a = chapado(w, h, '#f1e7c4')
    ys = np.linspace(-1, 1, h, dtype=np.float32)[:, None]
    xs = np.linspace(-1, 1, w, dtype=np.float32)[None, :]
    a *= (0.75 + 0.25 * np.exp(-(xs ** 2 + ys ** 2) * 1.5))[..., None]
    moldura(a, 0, 0, w, h, max(2, int(0.02 * ppm)), '#a9aaa6')
    return np.clip(a, 0, 1)


def p_pr_transformador(w, h, ppm, rnd):
    """a caixa do transformador: chapa cinza clara, a porta com a
       dobradiça, o aviso amarelo de perigo e a sujeira que escorre"""
    Y = em(h, ppm)
    a = reboco(w, h, ppm, rnd, '#c9cac6', grao=0.05, manchas=0.16, lad=False, fuligem=10)
    moldura(a, w * 0.1, h * 0.1, w * 0.9, h * 0.92, max(2, int(0.015 * ppm)), '#8f908c')
    retangulo(a, w * 0.84, h * 0.45, w * 0.88, h * 0.58, '#5d5e5b')
    desenhar(a, lambda d, im: d.polygon([(w * 0.5, h * 0.2), (w * 0.62, h * 0.4), (w * 0.38, h * 0.4)], fill=(236, 190, 40)))
    desenhar(a, lambda d, im: d.polygon([(w * 0.5, h * 0.25), (w * 0.555, h * 0.36), (w * 0.445, h * 0.36)], fill=(40, 36, 30)))
    e = escorrido(h, w, rnd, 9, inicio=(0.0, 0.1), comp=(0.3, 0.9), larg=(1, 3), lad=False)
    return multiplicar(a, 1 - 0.3 * e)


def folha_props():
    F = Folha('props', larg=1024)
    F.cel('poste_fuste', 1.05, 8.7, 44, p_pr_fuste, lad=True)
    F.cel('poste_base', 0.6, 0.6, 70, p_pr_tinta('#e4e3de', 0.05, 0.14), lad=True)
    F.cel('cruzeta', 0.5, 0.5, 70, p_pr_tinta('#7e7f7c', 0.06, 0.14), lad=True)
    F.cel('luminaria', 0.65, 0.3, 160, p_pr_luminaria)
    F.cel('luminaria_lente', 0.28, 0.6, 120, p_pr_lente)
    F.cel('transformador', 0.64, 0.85, 120, p_pr_transformador)
    F.cel('cesto_malha', 1.4, 0.7, 200, p_pr_malha)
    F.cel('metal', 0.5, 0.5, 100, p_pr_tinta('#9fa2a1', 0.05, 0.12), lad=True)
    F.cel('escuro', 0.2, 0.2, 60, p_pr_tinta('#1e1f20'), lad=True)
    F.cel('cacamba', 1.3, 0.92, 110, p_pr_cacamba)
    F.cel('tampa_cacamba', 1.4, 1.1, 90, p_pr_tampa_cacamba)
    F.cel('plastico', 0.5, 0.5, 80, p_pr_plastico('#8f918f'), lad=True)
    F.cel('plastico_verde', 0.5, 0.5, 80, p_pr_plastico('#4a9139'), lad=True)
    F.cel('lixeira', 0.58, 0.91, 130, p_pr_lixeira)
    F.cel('tampa_lixeira', 0.64, 0.78, 110, p_pr_tampa_lixeira)
    F.cel('pneu', 0.2, 0.2, 60, p_pr_tinta('#1a1a1a', 0.06, 0.05), lad=True)
    F.cel('saco', 1.4, 0.7, 110, p_pr_saco, lad=True)
    F.cel('papelao', 0.5, 0.34, 170, p_pr_papelao)
    F.cel('papelao_dentro', 0.4, 0.4, 80, p_pr_papelao_dentro, lad=True)
    F.cel('concreto', 1.0, 1.0, 110, p_pr_concreto, lad=True)
    F.cel('correio', 0.5, 0.93, 170, p_pr_correio)
    F.cel('correio_lado', 0.45, 0.93, 90, p_pr_tinta('#bf3926', 0.03, 0.08))
    F.cel('hidrante', 0.63, 0.8, 160, p_pr_tinta('#b3342a', 0.05, 0.16, 6))
    F.cel('balizador', 0.41, 0.93, 150, faixas_horizontais('#1d1e20', ((0.62, 0.69), (0.76, 0.83)), '#e3b21f'))
    F.cel('espuma', 0.82, 0.78, 120, p_pr_espuma)
    F.cel('delineador', 0.32, 1.02, 160, faixas_horizontais('#e1701f', ((0.66, 0.74), (0.82, 0.9)), '#f1f1ec'))
    F.cel('cone', 0.94, 0.51, 160, faixas_horizontais('#ea6a1c', ((0.14, 0.2), (0.27, 0.37)), '#f3f3ee'))
    F.cel('cone_base', 0.36, 0.36, 80, p_pr_tinta('#c9521a', 0.04, 0.08), lad=True)
    F.cel('borracha', 0.4, 0.4, 70, p_pr_tinta('#232323', 0.06, 0.06), lad=True)
    F.cel('cinzeiro', 1.1, 0.78, 120, faixas_horizontais('#babcb9', ((0.6, 0.63),), '#9c9e9b'))
    F.cel('tampa_cinzeiro', 0.36, 0.36, 220, p_pr_tampa_cinzeiro)
    F.cel('madeira', 1.8, 0.15, 200, p_pr_madeira, lad=True)
    F.cel('ferro', 0.3, 0.3, 100, p_pr_tinta('#2d2e2f', 0.06, 0.10), lad=True)
    return F.montar()


# =========================================================
#   13. O METRÔ — a entrada, o mezanino, a plataforma, o túnel e o trem
#   A entrada é a da foto do dono: a caixa de vidro com o pórtico
#   branco, a escada e a rolante descendo entre paredes de azulejo
#   azul. Embaixo, a plataforma da outra foto: piso bege, a faixa
#   amarela da borda, a parede de azulejo claro com o friso de
#   triângulos, os anúncios iluminados, o painel dos próximos trens e o
#   trem de frente azul-marinho com a moldura vermelha.
# =========================================================
AZUL_METRO = '#2b3f9c'


def emi(h, ppm):
    """o `em` em pixel inteiro, que serve de índice"""
    return lambda m: int(round(h - m * ppm))

VERMELHO_TREM = '#c3202b'
MARINHO_TREM = '#1b2447'


def ladrilhos(w, h, ppm, rnd, lado_m, cores, rejunte, larg_rej=0.004, brilho=0.10, var=0.06):
    """ladrilho quadrado de `lado_m`, cada um com a sua cor da lista, o
       rejunte e o fio de luz em cima/esquerda que o esmalte faz"""
    nx = max(1, int(round(w / (lado_m * ppm))))
    ny = max(1, int(round(h / (lado_m * ppm))))
    a = np.zeros((h, w, 3), np.float32)
    rej = max(1, int(round(larg_rej * ppm)))
    for i in range(nx):
        for j in range(ny):
            x0, x1 = int(round(i * w / nx)), int(round((i + 1) * w / nx))
            y0, y1 = int(round(j * h / ny)), int(round((j + 1) * h / ny))
            c = cor(cores[int(rnd.integers(0, len(cores)))]) * (1 + var * (rnd.random() - 0.5) * 2)
            a[y0:y1, x0:x1] = c
            if brilho and x1 - x0 > 4 and y1 - y0 > 4:
                a[y0 + rej:y0 + rej + 1, x0:x1] = np.clip(c * (1 + brilho * 2), 0, 1)
                a[y0:y1, x0 + rej:x0 + rej + 1] = np.clip(c * (1 + brilho), 0, 1)
                a[y1 - 2:y1 - 1, x0:x1] = c * (1 - brilho)
            a[y0:y0 + rej, x0:x1] = cor(rejunte)
            a[y0:y1, x0:x0 + rej] = cor(rejunte)
    return multiplicar(a, 1 + 0.05 * fbm(h, w, 0.5 * ppm, rnd, 3, True))


def p_mt_azulejo_azul(w, h, ppm, rnd):
    """o azulejo azul da descida da entrada, de 10 cm, com o rejunte claro"""
    return ladrilhos(w, h, ppm, rnd, 0.10, ['#2d42a3', '#2a3d99', '#3349ad', '#27398f', '#30449f'], '#c9ccd6', 0.005, 0.12)


def p_mt_azulejo_claro(w, h, ppm, rnd):
    """o azulejo cinza-claro da parede da plataforma, de 15 cm"""
    return ladrilhos(w, h, ppm, rnd, 0.15, ['#d9d6cc', '#d3d0c5', '#dedbd2', '#cfccc1'], '#b1ada2', 0.004, 0.06, 0.04)


def p_mt_friso(w, h, ppm, rnd):
    """o friso de triângulos em cima da parede da plataforma (o da foto):
       dentes de serra em bege, caramelo, cinza e marrom"""
    a = chapado(w, h, '#cdbd98')
    cores = ['#c7b186', '#a58c63', '#8b9096', '#dccfb2', '#6c5c48', '#b49c74']
    n = max(2, int(round(w / (0.3 * ppm))))
    passo = w / n

    def fn(d, im):
        for i in range(n):
            x0 = i * passo
            c1 = tuple(int(v * 255) for v in cor(cores[int(rnd.integers(0, len(cores)))]))
            c2 = tuple(int(v * 255) for v in cor(cores[int(rnd.integers(0, len(cores)))]))
            d.polygon([(x0, h), (x0 + passo / 2, h * 0.08), (x0 + passo, h)], fill=c1)
            d.polygon([(x0 + passo / 2, h * 0.08), (x0 + passo, h), (x0 + passo * 1.5, h * 0.08)], fill=c2)
            d.polygon([(x0, 0), (x0 + passo / 2, h * 0.08), (x0 + passo, 0)], fill=c2)
        d.rectangle([0, 0, w, max(1, int(0.03 * ppm))], fill=(60, 50, 40))
        d.rectangle([0, h - max(1, int(0.03 * ppm)), w, h], fill=(60, 50, 40))
    desenhar(a, fn)
    return multiplicar(a, 1 + 0.06 * fbm(h, w, 0.3 * ppm, rnd, 3, True))


def p_mt_piso(w, h, ppm, rnd):
    """o piso da plataforma: placa de granito bege de 60 cm, gasto no meio"""
    a = ladrilhos(w, h, ppm, rnd, 0.60, ['#d8c8a4', '#d2c19c', '#dccda9', '#cfbe98'], '#b5a483', 0.004, 0.03, 0.05)
    grao = pontos(h, w, (w / ppm) * (h / ppm) * 900, 0.4, 1.0, rnd, True)
    a = multiplicar(a, 1 + 0.07 * grao)
    m = np.clip(fbm(h, w, 0.9 * ppm, rnd, 3, True) * 2 - 0.2, 0, 1)
    return multiplicar(a, 1 - 0.08 * m)


def p_mt_tatil(w, h, ppm, rnd):
    """a faixa amarela da borda: o piso tátil de alerta, com os botões"""
    a = reboco(w, h, ppm, rnd, '#e2ad1e', grao=0.03, manchas=0.08, lad=True)
    n = max(2, int(round(w / (0.05 * ppm))))
    r = 0.014 * ppm
    passo = w / n

    def fn(d, im):
        for i in range(n):
            for j in range(int(round(h / passo))):
                cx, cy = (i + 0.5) * passo, (j + 0.5) * passo
                d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(196, 146, 18))
                d.ellipse([cx - r * 0.7, cy - r * 0.8, cx + r * 0.2, cy - r * 0.1], fill=(250, 206, 70))
    desenhar(a, fn)
    return a


def p_mt_borda(w, h, ppm, rnd):
    """a pedra da borda da plataforma: concreto claro, gasto"""
    a = reboco(w, h, ppm, rnd, '#c6c3bb', grao=0.05, manchas=0.10, lad=True)
    for k in range(int(round(w / (1.0 * ppm)))):
        x = int(k * ppm)
        a[:, x:x + max(1, int(0.006 * ppm))] *= 0.7
    return a


def p_mt_lastro(w, h, ppm, rnd):
    """o leito do trilho: o dormente de concreto a cada 60 cm, atravessado,
       e a brita escura entre eles. u corre com o trilho."""
    a = chapado(w, h, '#57544f')
    brita = pontos(h, w, (w / ppm) * (h / ppm) * 1400, 0.8, 2.2, rnd, True)
    a = multiplicar(a, 1 + 0.35 * brita)
    a = multiplicar(a, 1 + 0.10 * fbm(h, w, 0.2 * ppm, rnd, 3, True))
    n = max(1, int(round(w / (0.6 * ppm))))
    for i in range(n):
        xc = (i + 0.5) * w / n
        x0, x1 = int(xc - 0.13 * ppm), int(xc + 0.13 * ppm)
        y0, y1 = int(0.12 * h), int(0.88 * h)
        d = reboco(x1 - x0, y1 - y0, ppm, rnd, '#8a8680', grao=0.05, manchas=0.1, lad=False)
        a[y0:y1, x0:x1] = d
        a[y0:y1, x1:x1 + max(1, int(0.02 * ppm))] *= 0.55
    return a


def p_mt_tunel(w, h, ppm, rnd):
    """o revestimento do túnel: anel de concreto de 1,2 m, com a junta
       e os parafusos, a mancha de umidade escorrendo"""
    a = reboco(w, h, ppm, rnd, '#63615b', grao=0.06, manchas=0.16, lad=True)
    n = max(1, int(round(w / (1.2 * ppm))))
    for i in range(n):
        x = int(i * w / n)
        a[:, x:x + max(1, int(0.02 * ppm))] *= 0.55
        for y in np.linspace(0.1, 0.9, 4):
            yy = int(y * h)
            a[yy:yy + 2, x + 3:x + 6] = cor('#8b8880')
    m = int(round(h / (1.2 * ppm)))
    for j in range(max(1, m)):
        y = int(j * h / max(1, m))
        a[y:y + max(1, int(0.015 * ppm)), :] *= 0.7
    e = escorrido(h, w, rnd, 10, inicio=(0.0, 0.5), comp=(0.3, 0.8), larg=(1, 3), lad=True)
    return multiplicar(a, 1 - 0.25 * e)


def p_mt_teto(w, h, ppm, rnd):
    """o teto de concreto aparente da plataforma, com a marca da fôrma"""
    a = reboco(w, h, ppm, rnd, '#75736e', grao=0.05, manchas=0.12, lad=True)
    for k in range(4):
        y = int(k * h / 4)
        a[y:y + 1, :] *= 0.8
    return a


def p_mt_tijolo(w, h, ppm, rnd):
    """o tijolo marrom da parede do fim da plataforma, onde o túnel entra"""
    return tijolos(w, h, ppm, rnd, ['#6b4633', '#76503a', '#5c3c2c', '#80583f', '#654131'], argamassa='#7d7264',
                   tam=(0.24, 0.08), junta=0.012, lad=True, var=0.12)


def p_mt_degrau(w, h, ppm, rnd):
    """o piso do degrau: granito cinza com a fita amarela antiderrapante
       no bocel (na borda de CIMA da célula)"""
    a = reboco(w, h, ppm, rnd, '#a9a7a1', grao=0.05, manchas=0.06, lad=False)
    a = multiplicar(a, 1 + 0.15 * pontos(h, w, (w / ppm) * (h / ppm) * 1500, 0.4, 1.0, rnd, False))
    f = max(2, int(0.045 * ppm))
    retangulo(a, 0, 0, w, f, '#e0ae22', sombra=False)
    for x in range(0, w, max(3, int(0.012 * ppm))):
        a[:f, x:x + 1] *= 0.8
    a[f:f + 1, :] *= 0.7
    return a


def p_mt_rolante(w, h, ppm, rnd):
    """o degrau da escada rolante visto de cima: o alumínio frisado, as
       duas beiradas amarelas e a linha amarela na ponta"""
    a = chapado(w, h, '#a3a7ab')
    xs = np.arange(w)
    fr = ((xs // max(2, int(0.008 * ppm))) % 2).astype(np.float32)
    a = multiplicar(a, np.broadcast_to((0.78 + 0.3 * fr)[None, :], (h, w)))
    b = max(2, int(0.04 * ppm))
    retangulo(a, 0, 0, b, h, '#e2b01f', sombra=False)
    retangulo(a, w - b, 0, w, h, '#e2b01f', sombra=False)
    retangulo(a, 0, 0, w, max(2, int(0.025 * ppm)), '#e2b01f', sombra=False)
    a[h - 2:h, :] *= 0.45
    return a


def p_mt_rolante_lado(w, h, ppm, rnd):
    """a lateral da escada rolante: a saia de inox embaixo, o vidro fumê
       da balaustrada e o corrimão preto em cima"""
    Y = emi(h, ppm)
    a = chapado(w, h, '#3b3f44')
    retangulo(a, 0, Y(0.25), w, h, '#b9bdc0', sombra=False)                 # a saia de inox
    a[Y(0.25):, :] = multiplicar(a[Y(0.25):, :], 1 + 0.08 * fbm(h - Y(0.25), w, 3, rnd, 2, True))
    v = vidro(w, Y(0.25) - Y(0.95), rnd, base='#2b3136', topo='#56626b', reflexo=0.12)
    a[Y(0.95):Y(0.25)] = v
    retangulo(a, 0, 0, w, Y(0.95), '#1a1a1a', sombra=False)                # o corrimão
    return a


ANUNCIOS = {
    'anuncio1': dict(fundo='#f4c20d', tinta=(160, 20, 20), t1='GELADA', t2='DE VERDADE', forma='garrafa'),
    'anuncio2': dict(fundo='#c3202b', tinta=(250, 250, 244), t1='CAMISA NOVA', t2='JÁ NAS LOJAS', forma='camisa'),
    'anuncio3': dict(fundo='#e8457a', tinta=(250, 250, 244), t1='BAIXE O APP', t2='E VÁ DE METRÔ', forma='celular'),
    'anuncio4': dict(fundo='#3a2266', tinta=(250, 214, 72), t1='SAMBA', t2='SÁBADO NO ESTÁDIO', forma='estrelas'),
}


def p_mt_anuncio(chave):
    """o anúncio iluminado da parede da plataforma: a figura grande no meio
       e o texto embaixo, na caixa de luz"""
    A = ANUNCIOS[chave]

    def f(w, h, ppm, rnd):
        a = chapado(w, h, A['fundo'])
        ys = np.linspace(0, 1, h, dtype=np.float32)[:, None]
        a = multiplicar(a, np.broadcast_to(1.12 - 0.22 * ys, (h, w)))           # a luz de dentro, mais forte em cima

        def fn(d, im):
            cx, cy = w / 2, h * 0.40
            if A['forma'] == 'garrafa':
                d.rounded_rectangle([cx - w * 0.12, cy - h * 0.12, cx + w * 0.12, cy + h * 0.22], radius=w * 0.06, fill=(92, 52, 18))
                d.rectangle([cx - w * 0.05, cy - h * 0.26, cx + w * 0.05, cy - h * 0.1], fill=(92, 52, 18))
                d.rectangle([cx - w * 0.12, cy, cx + w * 0.12, cy + h * 0.09], fill=(240, 236, 220))
                d.ellipse([cx - w * 0.3, cy + h * 0.05, cx - w * 0.14, cy + h * 0.2], fill=(250, 250, 250))
            elif A['forma'] == 'camisa':
                c = (250, 250, 244)
                d.polygon([(cx - w * 0.32, cy - h * 0.15), (cx - w * 0.12, cy - h * 0.2), (cx, cy - h * 0.16), (cx + w * 0.12, cy - h * 0.2),
                           (cx + w * 0.32, cy - h * 0.15), (cx + w * 0.26, cy - h * 0.05), (cx + w * 0.18, cy - h * 0.08),
                           (cx + w * 0.18, cy + h * 0.2), (cx - w * 0.18, cy + h * 0.2), (cx - w * 0.18, cy - h * 0.08),
                           (cx - w * 0.26, cy - h * 0.05)], fill=c)
                d.rectangle([cx - w * 0.18, cy - h * 0.02, cx + w * 0.18, cy + h * 0.04], fill=(30, 30, 30))
                d.text((cx, cy + h * 0.1), '10', fill=(195, 32, 43), anchor='mm', font=caber(d, '10', w * 0.2, h * 0.08))
            elif A['forma'] == 'celular':
                d.rounded_rectangle([cx - w * 0.17, cy - h * 0.22, cx + w * 0.17, cy + h * 0.22], radius=w * 0.05, fill=(30, 30, 36))
                d.rectangle([cx - w * 0.14, cy - h * 0.19, cx + w * 0.14, cy + h * 0.18], fill=(70, 150, 220))
                d.ellipse([cx - w * 0.08, cy - h * 0.08, cx + w * 0.08, cy + h * 0.03], fill=(250, 250, 250))
                d.text((cx, cy - h * 0.025), 'M', fill=(43, 63, 156), anchor='mm', font=caber(d, 'M', w * 0.12, h * 0.07))
            else:
                for k in range(9):
                    x, y, r = rnd.uniform(0.1, 0.9) * w, rnd.uniform(0.1, 0.6) * h, rnd.uniform(0.02, 0.05) * w
                    d.polygon([(x, y - r * 2), (x + r * 0.6, y - r * 0.6), (x + r * 2, y), (x + r * 0.6, y + r * 0.6),
                               (x, y + r * 2), (x - r * 0.6, y + r * 0.6), (x - r * 2, y), (x - r * 0.6, y - r * 0.6)], fill=(250, 214, 72))
                d.ellipse([cx - w * 0.2, cy - h * 0.1, cx + w * 0.2, cy + h * 0.14], outline=(250, 214, 72), width=max(2, int(w * 0.02)))
            d.text((w / 2, h * 0.74), A['t1'], fill=A['tinta'], anchor='mm', font=caber(d, A['t1'], w * 0.86, h * 0.1))
            d.text((w / 2, h * 0.85), A['t2'], fill=A['tinta'], anchor='mm', font=caber(d, A['t2'], w * 0.86, h * 0.055, 'normal'))
        desenhar(a, fn)
        moldura(a, 0, 0, w, h, max(3, int(0.05 * ppm)), '#2a2c2f')
        return np.clip(a, 0, 1)
    return f


def p_mt_partidas(destino):
    """o painel dos próximos trens: fundo preto, as letras de LED âmbar"""
    def f(w, h, ppm, rnd):
        a = chapado(w, h, '#0e0f10')
        linhas = [('PRÓXIMOS TRENS', 'LINHA 1'), ('1  ' + destino, '2 min'), ('2  ' + destino, '9 min'), ('3  ' + destino, '16 min')]

        def fn(d, im):
            alt = h / (len(linhas) + 0.6)
            for k, (esq, dir_) in enumerate(linhas):
                y = alt * (k + 0.8)
                cor_ = (255, 190, 40) if k else (250, 240, 210)
                fe = caber(d, esq, w * 0.6, alt * 0.62, 'negrito')
                d.text((w * 0.05, y), esq, fill=cor_, anchor='lm', font=fe)
                d.text((w * 0.95, y), dir_, fill=cor_, anchor='rm', font=caber(d, dir_, w * 0.3, alt * 0.62, 'negrito'))
        desenhar(a, fn)
        # a grade dos LEDs: uma linha escura a cada 2 px
        a[::3, :] *= 0.55
        a[:, ::3] *= 0.7
        moldura(a, 0, 0, w, h, max(3, int(0.05 * ppm)), '#26282a')
        return np.clip(a, 0, 1)
    return f


def p_mt_trem_lado(w, h, ppm, rnd):
    """o lado do carro, de 12 m: a saia cinza, a faixa azul, o branco da
       caixa, as janelas escuras e as duas portas duplas vermelhas com o
       vidro. u corre o carro, v sobe."""
    Y = emi(h, ppm)
    X = lambda m: int(round(m * ppm))
    a = reboco(w, h, ppm, rnd, '#e4e4e0', grao=0.02, manchas=0.04, lad=False)
    retangulo(a, 0, Y(0.45), w, h, '#3a3c3f', sombra=False)                # a saia, com o truque
    retangulo(a, 0, Y(0.85), w, Y(0.45), '#1f3f8f', sombra=False)          # a faixa azul
    retangulo(a, 0, Y(3.0), w, Y(2.9), '#b9bab7', sombra=False)            # a quina do teto
    portas = [2.6, 9.4]

    def janela(x0, x1):
        y0, y1 = Y(2.35), Y(1.15)
        v = vidro(x1 - x0, y1 - y0, rnd, base='#121418', topo='#3b4650', reflexo=0.14)
        # o banco e a cabeça de quem vai sentado, de sombra
        v[int((y1 - y0) * 0.55):, :] *= 0.8
        a[y0:y1, x0:x1] = v
        moldura(a, x0, y0, x1, y1, max(2, int(0.04 * ppm)), '#2a2c2e')
    xs = [0.35] + [p for c in portas for p in (c - 1.0, c + 1.0)] + [11.65]
    for i in range(0, len(xs), 2):
        a0, a1 = xs[i], xs[i + 1]
        n = max(1, int(round((a1 - a0) / 1.6)))
        for k in range(n):
            janela(X(a0 + k * (a1 - a0) / n + 0.08), X(a0 + (k + 1) * (a1 - a0) / n - 0.08))
    for c in portas:
        x0, x1 = X(c - 0.8), X(c + 0.8)
        retangulo(a, x0, Y(2.45), x1, Y(0.5), VERMELHO_TREM)
        for f0, f1 in ((c - 0.68, c - 0.1), (c + 0.1, c + 0.68)):
            v = vidro(X(f1) - X(f0), Y(1.05) - Y(2.25), rnd, base='#121418', topo='#3b4650', reflexo=0.1)
            a[Y(2.25):Y(1.05), X(f0):X(f1)] = v
        a[Y(2.45):Y(0.5), X(c) - 1:X(c) + 1] = cor('#6a1015')
    # o número do carro e a marca da linha
    def fn(d, im):
        d.ellipse([X(5.6), Y(2.25), X(6.4), Y(1.45)], fill=(43, 63, 156))
        d.text(((X(5.6) + X(6.4)) / 2, (Y(2.25) + Y(1.45)) / 2), 'M', fill=(250, 250, 250), anchor='mm', font=caber(d, 'M', X(0.5), Y(1.8) - Y(2.3)))
    desenhar(a, fn)
    return np.clip(a, 0, 1)


def p_mt_trem_frente(w, h, ppm, rnd):
    """a cara do trem: a moldura vermelha, o rosto azul-marinho, as duas
       janelas grandes, o letreiro do destino e os três faróis de cada lado"""
    Y = emi(h, ppm)
    X = lambda m: int(round(m * ppm))
    a = chapado(w, h, VERMELHO_TREM)
    a = multiplicar(a, 1 + 0.05 * fbm(h, w, 0.4 * ppm, rnd, 2, False))
    retangulo(a, X(0.18), Y(2.85), w - X(0.18), Y(0.55), MARINHO_TREM)
    retangulo(a, 0, Y(0.55), w, h, '#303235', sombra=False)
    for x0, x1 in ((0.32, 1.28), (1.42, 2.38)):
        v = vidro(X(x1) - X(x0), Y(1.55) - Y(2.55), rnd, base='#0c0e12', topo='#48545e', reflexo=0.2)
        a[Y(2.55):Y(1.55), X(x0):X(x1)] = v
        moldura(a, X(x0), Y(2.55), X(x1), Y(1.55), max(2, int(0.03 * ppm)), '#0d1020')
        for k in range(3):
            cx, cy = X(x0 + 0.3 + k * 0.18), Y(1.0)
            r = max(2, int(0.045 * ppm))
            a[cy - r:cy + r, cx - r:cx + r] = cor('#fff6d8')
    retangulo(a, X(0.9), Y(2.8), X(1.8), Y(2.6), '#0b0b0b')

    def fn(d, im):
        d.text(((X(0.9) + X(1.8)) / 2, (Y(2.8) + Y(2.6)) / 2), 'LINHA 1', fill=(255, 190, 40), anchor='mm',
               font=caber(d, 'LINHA 1', X(0.8), Y(2.6) - Y(2.8)))
    desenhar(a, fn)
    return np.clip(a, 0, 1)


def p_mt_trem_teto(w, h, ppm, rnd):
    a = reboco(w, h, ppm, rnd, '#9fa1a2', grao=0.03, manchas=0.1, lad=True)
    for k in range(int(round(w / (0.5 * ppm)))):
        x = int(k * 0.5 * ppm)
        a[:, x:x + 1] *= 0.8
    return a


def p_mt_catraca(w, h, ppm, rnd):
    """a catraca: o armário de inox com o leitor do bilhete e a seta verde"""
    Y = emi(h, ppm)
    a = chapado(w, h, '#b7bbbe')
    a = multiplicar(a, 1 + 0.08 * fbm(h, w, 2, rnd, 2, False))
    xs = np.linspace(0, 1, w, dtype=np.float32)[None, :]
    a = multiplicar(a, np.broadcast_to(0.9 + 0.2 * np.sin(xs * np.pi), (h, w)))
    retangulo(a, w * 0.62, Y(0.98), w * 0.9, Y(0.8), '#23262a')
    retangulo(a, w * 0.66, Y(0.95), w * 0.86, Y(0.86), '#3fd06a', sombra=False)
    retangulo(a, 0, Y(0.08), w, h, '#3c3f42', sombra=False)
    return a


def p_mt_bilheteria(w, h, ppm, rnd):
    """a bilheteria do mezanino: a faixa azul com o nome, o vidro com o
       atendente e o balcão de inox"""
    Y = emi(h, ppm)
    a = ladrilhos(w, h, ppm, rnd, 0.15, ['#d9d6cc', '#d3d0c5'], '#b1ada2', 0.004, 0.05)
    retangulo(a, 0, Y(2.6), w, Y(2.15), AZUL_METRO)
    x0, x1, y0, y1 = w * 0.12, w * 0.88, Y(2.0), Y(1.05)
    fundo = chapado(int(x1 - x0), int(y1 - y0), '#c9c2b0')
    colar(a, fundo, x0, y0)
    # o atendente, de sombra, e o monitor
    retangulo(a, (x0 + x1) / 2 - w * 0.05, y0 + (y1 - y0) * 0.35, (x0 + x1) / 2 + w * 0.05, y1, '#3a4150', sombra=False)
    a[int(y0):int(y1), int(x0):int(x1)] = a[int(y0):int(y1), int(x0):int(x1)] * 0.7 + vidro(int(x1) - int(x0), int(y1) - int(y0), rnd,
                                                                                             base='#1a2126', topo='#8fa3b0', reflexo=0.2) * 0.3
    moldura(a, x0, y0, x1, y1, max(2, int(0.04 * ppm)), '#8d9295')
    retangulo(a, 0, Y(1.05), w, Y(0.95), '#c4c8ca')
    retangulo(a, 0, Y(0.95), w, h, '#9ea3a6')

    def fn(d, im):
        d.text((w / 2, (Y(2.6) + Y(2.15)) / 2), 'BILHETERIA', fill=(250, 250, 250), anchor='mm',
               font=caber(d, 'BILHETERIA', w * 0.7, (Y(2.15) - Y(2.6)) * 0.7))
    desenhar(a, fn)
    return np.clip(a, 0, 1)


def p_mt_mapa(w, h, ppm, rnd):
    """o mapa da linha: a Linha 1 – Azul, das duas estações"""
    a = chapado(w, h, '#f4f3ee')

    def fn(d, im):
        d.text((w * 0.06, h * 0.2), 'LINHA 1 – AZUL', fill=(43, 63, 156), anchor='lm', font=caber(d, 'LINHA 1 – AZUL', w * 0.6, h * 0.16))
        y = h * 0.58
        d.rounded_rectangle([w * 0.12, y - h * 0.05, w * 0.88, y + h * 0.05], radius=h * 0.05, fill=(43, 63, 156))
        for x, nome in ((w * 0.14, 'POENTE'), (w * 0.86, 'NORTE')):
            d.ellipse([x - h * 0.1, y - h * 0.1, x + h * 0.1, y + h * 0.1], fill=(250, 250, 250), outline=(43, 63, 156), width=max(2, int(h * 0.04)))
            d.text((x, y + h * 0.24), nome, fill=(30, 30, 30), anchor='mm', font=caber(d, nome, w * 0.3, h * 0.13))
        r = h * 0.12
        d.ellipse([w * 0.9 - r, h * 0.2 - r, w * 0.9 + r, h * 0.2 + r], fill=(43, 63, 156))
        d.text((w * 0.9, h * 0.2), 'M', fill=(250, 250, 250), anchor='mm', font=caber(d, 'M', r * 1.3, r * 1.3))
    desenhar(a, fn)
    moldura(a, 0, 0, w, h, max(2, int(0.04 * ppm)), '#8d9295')
    return a


def p_mt_placa(w, h, ppm, rnd):
    """a faixa da entrada: o M no círculo e METRÔ, branco no grafite"""
    a = chapado(w, h, '#3b3f44')
    a = multiplicar(a, 1 + 0.05 * fbm(h, w, 0.5 * ppm, rnd, 2, False))

    def fn(d, im):
        r = h * 0.33
        cx = h * 0.62
        d.ellipse([cx - r, h / 2 - r, cx + r, h / 2 + r], outline=(250, 250, 250), width=max(2, int(h * 0.06)))
        d.text((cx, h / 2), 'M', fill=(250, 250, 250), anchor='mm', font=caber(d, 'M', r * 1.25, r * 1.3))
        d.text((cx + r + h * 0.28, h / 2), 'METRÔ', fill=(250, 250, 250), anchor='lm', font=caber(d, 'METRÔ', w - cx - r - h * 0.5, h * 0.52))
    desenhar(a, fn)
    return a


def p_mt_granito(w, h, ppm, rnd):
    """o granito cinza polido do mezanino"""
    a = ladrilhos(w, h, ppm, rnd, 0.5, ['#a4a29c', '#9d9b95', '#a9a7a1'], '#8b8984', 0.003, 0.03, 0.04)
    return multiplicar(a, 1 + 0.18 * pontos(h, w, (w / ppm) * (h / ppm) * 2500, 0.4, 1.1, rnd, True))


def p_mt_forro(w, h, ppm, rnd):
    """o forro de lâmina de alumínio do mezanino"""
    a = chapado(w, h, '#cbced0')
    n = max(2, int(round(h / (0.1 * ppm))))
    for j in range(n):
        y = int(j * h / n)
        a[y:y + max(1, int(0.015 * ppm)), :] = cor('#3e4143')
    return multiplicar(a, 1 + 0.04 * fbm(h, w, 0.5 * ppm, rnd, 2, True))


def p_mt_grelha(w, h, ppm, rnd):
    a = chapado(w, h, '#4b4e51')
    n = max(2, int(round(h / (0.05 * ppm))))
    for j in range(n):
        y = int(j * h / n)
        a[y:y + max(1, int(0.02 * ppm)), :] = cor('#25272a')
    return a


def p_lisa_clara(w, h, ppm, rnd):
    """a peça lisa quase branca: é ela que leva a tinta das peças de uma cor só"""
    return multiplicar(chapado(w, h, '#f2f2ef'), 1 + 0.03 * fbm(h, w, 0.4 * ppm, rnd, 2, True))


def p_mt_logo(w, h, ppm, rnd):
    """o M no círculo, branco no grafite: a placa do poste e do totem"""
    a = chapado(w, h, '#3b3f44')

    def fn(d, im):
        r = w * 0.36
        d.ellipse([w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r], fill=(43, 63, 156), outline=(250, 250, 250), width=max(2, int(w * 0.05)))
        d.text((w / 2, h / 2), 'M', fill=(250, 250, 250), anchor='mm', font=caber(d, 'M', r * 1.3, r * 1.35))
    desenhar(a, fn)
    return a


def folha_metro():
    F = Folha('metro')
    F.cel('lisa', 1.0, 1.0, 24, p_lisa_clara, lad=True)
    F.cel('logo', 0.8, 0.8, 200, p_mt_logo)
    F.cel('azulejo_azul', 1.2, 1.2, 140, p_mt_azulejo_azul, lad=True)
    F.cel('azulejo_claro', 1.2, 1.2, 100, p_mt_azulejo_claro, lad=True)
    F.cel('friso', 2.4, 0.8, 100, p_mt_friso, lad=True)
    F.cel('piso', 2.4, 2.4, 70, p_mt_piso, lad=True)
    F.cel('tatil', 0.6, 0.6, 160, p_mt_tatil, lad=True)
    F.cel('borda', 1.0, 0.5, 120, p_mt_borda, lad=True)
    F.cel('lastro', 2.4, 2.6, 70, p_mt_lastro, lad=True)
    F.cel('tunel', 2.4, 2.4, 50, p_mt_tunel, lad=True)
    F.cel('teto', 2.4, 2.4, 50, p_mt_teto, lad=True)
    F.cel('tijolo', 2.4, 1.2, 90, p_mt_tijolo, lad=True)
    F.cel('degrau', 1.0, 0.32, 160, p_mt_degrau)
    F.cel('rolante', 1.0, 0.4, 200, p_mt_rolante, lad=True)
    F.cel('rolante_lado', 2.0, 1.0, 110, p_mt_rolante_lado, lad=True)
    for k in ANUNCIOS:
        F.cel(k, 1.2, 1.8, 110, p_mt_anuncio(k))
    F.cel('partidas_norte', 3.0, 0.8, 130, p_mt_partidas('NORTE'))
    F.cel('partidas_poente', 3.0, 0.8, 130, p_mt_partidas('POENTE'))
    F.cel('trem_lado', 12.0, 3.0, 50, p_mt_trem_lado)
    F.cel('trem_frente', 2.7, 3.1, 110, p_mt_trem_frente)
    F.cel('trem_teto', 2.0, 2.0, 40, p_mt_trem_teto, lad=True)
    F.cel('catraca', 1.2, 1.0, 150, p_mt_catraca)
    F.cel('bilheteria', 3.0, 2.6, 80, p_mt_bilheteria)
    F.cel('mapa', 2.4, 0.9, 110, p_mt_mapa)
    F.cel('placa', 4.0, 0.6, 120, p_mt_placa)
    F.cel('granito', 2.0, 2.0, 70, p_mt_granito, lad=True)
    F.cel('forro', 2.0, 2.0, 60, p_mt_forro, lad=True)
    F.cel('grelha', 1.0, 1.0, 100, p_mt_grelha, lad=True)
    return F.montar()


# =========================================================
#   14. OS EQUIPAMENTOS NOVOS DA PROPOSTA — o Shopping Poente, o 2º
#   Distrito Policial e a Praça da Vila, numa folha só.
#   O SHOPPING é o da primeira foto do dono: a cortina de vidro verde
#   com a faixa de alumínio em cada laje, o último andar recuado de
#   vidro inclinado, as lojas no térreo. A DELEGACIA é a da segunda:
#   a pastilha bege, a platibanda e o volume de cima em azul, as
#   janelas de caixilho escuro, a bandeira e a viatura. A PRAÇA é de
#   bairro brasileiro: pedra portuguesa em onda, grama, areia do
#   parquinho, o ipê amarelo e a banca de jornal.
# =========================================================
def p_eq_cortina(w, h, ppm, rnd):
    """o módulo da cortina de vidro, um andar de 4,2 m: a faixa de
       alumínio da laje embaixo, o peitoril de vidro opaco, o vidro de
       visão com o forro aceso lá dentro e o montante nas bordas"""
    Y = emi(h, ppm)
    X = lambda m: int(round(m * ppm))
    a = vidro(w, h, rnd, base='#1d2a29', topo='#8aa0a6', reflexo=0.22)
    # lá dentro: o forro claro e a fileira de luminárias, a divisória
    a[Y(3.95):Y(3.7)] = a[Y(3.95):Y(3.7)] * 0.5 + cor('#c9cfc9') * 0.5
    for x in range(X(0.2), w, X(0.75)):
        a[Y(3.88):Y(3.8), x:x + X(0.3)] = cor('#eef2e6')
    a[Y(3.7):Y(1.2)] *= 0.9
    retangulo(a, 0, Y(1.2), w, Y(0.55), '#2e3a39', sombra=False)          # o peitoril de vidro opaco
    a[Y(1.2):Y(0.55)] = multiplicar(a[Y(1.2):Y(0.55)], 1 + 0.08 * fbm(Y(0.55) - Y(1.2), w, 4, rnd, 2, False))
    retangulo(a, 0, Y(0.55), w, h, '#8d9699')                             # a faixa da laje
    retangulo(a, 0, Y(1.23), w, Y(1.17), '#6f787b', sombra=False)          # o travessão
    e = max(2, int(0.05 * ppm))
    retangulo(a, 0, 0, e, h, '#9aa3a6')
    retangulo(a, w - e, 0, w, h, '#7d8588')
    return np.clip(a, 0, 1)


def interior_lojas(W, H, ppm, rnd):
    """o térreo por dentro: a loja clara, a arara de roupa colorida, o
       manequim e o piso brilhante"""
    a = chapado(W, H, '#e7e1d4')
    Yh = lambda m: int(H - m * ppm)
    a[Yh(0.4):] = cor('#d8d2c6')
    cores = ['#c8342b', '#1f5aa8', '#e0a52a', '#1d7a4a', '#f0ede4', '#2b2b2b', '#7a2f86', '#d96a1f']
    x = int(rnd.uniform(0.05, 0.2) * W)
    while x < W - 6:
        c = cores[int(rnd.integers(0, len(cores)))]
        larg = int(rnd.uniform(0.04, 0.09) * ppm)
        a[Yh(1.7):Yh(0.7), x:x + larg] = cor(c) * rnd.uniform(0.8, 1.0)
        x += larg + int(rnd.uniform(0.0, 0.03) * ppm)
        if rnd.random() < 0.08:
            x += int(0.4 * ppm)
    a[Yh(1.75):Yh(1.72), :] = cor('#9a9a98')                          # o cabide da arara
    for k in range(2):
        cx = int(rnd.uniform(0.15, 0.85) * W)
        a[Yh(1.8):Yh(0.4), cx - int(0.12 * ppm):cx + int(0.12 * ppm)] = cor(cores[int(rnd.integers(0, len(cores)))])
        a[Yh(2.0):Yh(1.8), cx - int(0.06 * ppm):cx + int(0.06 * ppm)] = cor('#e3d4c4')
    a[:Yh(3.3)] = cor('#f4f1e8')                                       # o forro aceso
    return multiplicar(a, 1 + 0.06 * fbm(H, W, 0.3 * ppm, rnd, 2, False))


def p_eq_cortina_terreo(w, h, ppm, rnd):
    """o térreo: a vitrine da loja, com a faixa da marca em cima"""
    Y = emi(h, ppm)
    a = interior_lojas(w, h, ppm, rnd)
    v = vidro(w, h, rnd, base='#1a2425', topo='#8da2a8', reflexo=0.18)
    a = a * 0.62 + v * 0.42
    cores = ['#c8342b', '#1f5aa8', '#e0a52a', '#1d7a4a', '#2b2b2b', '#7a2f86', '#d96a1f', '#0e7a82']
    retangulo(a, 0, Y(4.5), w, Y(3.55), cores[int(rnd.integers(0, len(cores)))])
    retangulo(a, w * 0.12, Y(4.25), w * 0.88, Y(3.8), '#f6f3ea', sombra=False)
    e = max(2, int(0.05 * ppm))
    retangulo(a, 0, 0, e, h, '#9aa3a6')
    retangulo(a, w - e, 0, w, h, '#7d8588')
    retangulo(a, 0, Y(3.55), w, Y(3.5), '#6f787b', sombra=False)
    retangulo(a, 0, Y(0.08), w, h, '#5f6668', sombra=False)
    return np.clip(a, 0, 1)


def p_eq_cortina_topo(w, h, ppm, rnd):
    """o vidro do último andar recuado: mais céu refletido, o montante
       e a travessa no meio"""
    a = vidro(w, h, rnd, base='#26363a', topo='#a9bfc6', reflexo=0.3)
    e = max(2, int(0.05 * ppm))
    retangulo(a, 0, 0, e, h, '#a3acae')
    retangulo(a, w - e, 0, w, h, '#848c8f')
    retangulo(a, 0, int(h * 0.5), w, int(h * 0.5) + e, '#8f989b')
    return np.clip(a, 0, 1)


def p_eq_acm(base, junta):
    """o painel de alumínio composto, de 1,2 m, com a junta"""
    def f(w, h, ppm, rnd):
        a = multiplicar(chapado(w, h, base), 1 + 0.04 * fbm(h, w, 0.6 * ppm, rnd, 2, True))
        ys = np.linspace(0, 1, h, dtype=np.float32)[:, None]
        a = multiplicar(a, np.broadcast_to(1.04 - 0.08 * ys, (h, w)))
        j = max(1, int(0.012 * ppm))
        a[:j, :] = cor(junta)
        a[:, :j] = cor(junta)
        return a
    return f


def p_eq_porta_shop(w, h, ppm, rnd):
    """a entrada do shopping: as duas folhas de correr de vidro, o
       caixilho de inox e a bandeira de vidro em cima"""
    Y = emi(h, ppm)
    a = interior_lojas(w, h, ppm, rnd)
    v = vidro(w, h, rnd, base='#1a2425', topo='#9bb0b6', reflexo=0.2)
    a = a * 0.55 + v * 0.5
    esp = max(3, int(0.06 * ppm))
    for x in (0, w / 2 - esp / 2, w - esp):
        retangulo(a, x, 0, x + esp, h, '#b5bcbe')
    retangulo(a, 0, Y(2.5), w, Y(2.42), '#b5bcbe')
    retangulo(a, 0, Y(0.06), w, h, '#8d9295', sombra=False)
    for x in (w * 0.46, w * 0.54):
        retangulo(a, x - 2, Y(1.6), x + 2, Y(0.9), '#dfe3e4')
    return np.clip(a, 0, 1)


def p_eq_membrana(w, h, ppm, rnd):
    """a manta do telhado plano, com a emenda a cada metro"""
    a = reboco(w, h, ppm, rnd, '#8e8a82', grao=0.05, manchas=0.14, lad=True)
    for k in range(int(round(w / ppm))):
        x = int(k * ppm)
        a[:, x:x + max(1, int(0.02 * ppm))] *= 0.82
    return a


def p_eq_granito(w, h, ppm, rnd):
    """a calçada da praça do shopping: granito claro em placa de 50 cm"""
    a = ladrilhos(w, h, ppm, rnd, 0.5, ['#c9c6bf', '#c2bfb7', '#cfccc5', '#bebbb3'], '#9e9b94', 0.004, 0.02, 0.04)
    return multiplicar(a, 1 + 0.12 * pontos(h, w, (w / ppm) * (h / ppm) * 1200, 0.4, 1.0, rnd, True))


def p_eq_pastilha(w, h, ppm, rnd):
    """a pastilha bege da delegacia, 20 × 10 cm em amarração corrida"""
    return tijolos(w, h, ppm, rnd, ['#dcd1b6', '#d6cbb0', '#e0d6bd', '#d2c6aa'], argamassa='#efe9da',
                   tam=(0.2, 0.1), junta=0.006, lad=True, var=0.05)


def p_eq_azul_pol(w, h, ppm, rnd):
    """o painel azul da platibanda e do volume de cima"""
    return p_eq_acm('#2a4a8c', '#1d3464')(w, h, ppm, rnd)


def p_eq_janela_pol(w, h, ppm, rnd):
    """a janela da delegacia: caixilho escuro, 4 × 2 vidros azulados e a
       persiana entreaberta por trás"""
    a = vidro(w, h, rnd, base='#1d2733', topo='#9fb7cc', reflexo=0.2)
    persiana(a, 0, w, 0, int(h * 0.45), c='#dfe2e0', passo=max(3, int(0.03 * ppm)))
    a[:int(h * 0.45)] = a[:int(h * 0.45)] * 0.55 + vidro(w, int(h * 0.45), rnd, base='#1d2733', topo='#9fb7cc', reflexo=0.15) * 0.45
    e = max(2, int(0.045 * ppm))
    for k in range(5):
        x = int(k * (w - e) / 4)
        retangulo(a, x, 0, x + e, h, '#2b2f33')
    for y in (0, h // 2 - e // 2, h - e):
        retangulo(a, 0, y, w, y + e, '#2b2f33')
    return np.clip(a, 0, 1)


def p_eq_porta_pol(w, h, ppm, rnd):
    """a porta de vidro da delegacia, com o adesivo POLÍCIA CIVIL"""
    Y = emi(h, ppm)
    a = chapado(w, h, '#cfd2cd')
    a[Y(2.5):Y(0.1)] = a[Y(2.5):Y(0.1)] * 0.4 + vidro(w, Y(0.1) - Y(2.5), rnd, base='#1c2530', topo='#a4bccf', reflexo=0.22) * 0.6
    e = max(3, int(0.06 * ppm))
    for x in (0, w / 2 - e / 2, w - e):
        retangulo(a, x, 0, x + e, h, '#2b2f33')
    retangulo(a, 0, Y(2.5), w, Y(2.5) + e, '#2b2f33')
    retangulo(a, 0, Y(0.12), w, h, '#2b2f33')

    def fn(d, im):
        for x0, x1 in ((e, w / 2 - e / 2), (w / 2 + e / 2, w - e)):
            d.text(((x0 + x1) / 2, Y(1.35)), 'POLÍCIA CIVIL', fill=(236, 236, 230), anchor='mm', font=caber(d, 'POLÍCIA CIVIL', (x1 - x0) * 0.8, 0.09 * ppm))
    desenhar(a, fn)
    return np.clip(a, 0, 1)


def p_eq_bandeira_br(w, h, ppm, rnd):
    """a bandeira do Brasil: o verde, o losango amarelo, o círculo azul
       com a faixa branca e as estrelinhas"""
    a = chapado(w, h, '#009c3b')

    def fn(d, im):
        mx, my = w * 0.085, h * 0.12
        d.polygon([(mx, h / 2), (w / 2, my), (w - mx, h / 2), (w / 2, h - my)], fill=(255, 223, 0))
        r = h * 0.25
        d.ellipse([w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r], fill=(0, 39, 118))
        d.arc([w / 2 - r * 1.9, h / 2 - r * 0.55, w / 2 + r * 1.3, h / 2 + r * 2.6], 222, 312, fill=(250, 250, 250), width=max(2, int(r * 0.16)))
        for _ in range(22):
            x, y = w / 2 + rnd.uniform(-0.8, 0.8) * r, h / 2 + rnd.uniform(-0.1, 0.8) * r
            if (x - w / 2) ** 2 + (y - h / 2) ** 2 < (r * 0.85) ** 2:
                d.ellipse([x - 1.5, y - 1.5, x + 1.5, y + 1.5], fill=(250, 250, 250))
    desenhar(a, fn)
    # a dobra do pano
    xs = np.linspace(0, 3 * np.pi, w, dtype=np.float32)[None, :]
    return multiplicar(a, np.broadcast_to(0.9 + 0.12 * np.sin(xs), (h, w)))


def p_eq_solar(w, h, ppm, rnd):
    """a placa solar: 6 × 10 células azul-escuras na moldura de alumínio"""
    a = chapado(w, h, '#c3c7ca')
    e = max(2, int(0.03 * ppm))
    nx, ny = 6, 10
    for i in range(nx):
        for j in range(ny):
            x0 = e + i * (w - 2 * e) / nx
            y0 = e + j * (h - 2 * e) / ny
            retangulo(a, x0 + 1, y0 + 1, x0 + (w - 2 * e) / nx - 1, y0 + (h - 2 * e) / ny - 1,
                      cor('#1d2c4d') * (0.9 + 0.2 * rnd.random()), sombra=False)
    ys = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    return multiplicar(a, np.broadcast_to(1.12 - 0.2 * ys, (h, w)))


def p_eq_viatura_lado(invertido):
    """o lado da viatura da Polícia Civil: a caixa preta, a faixa
       branca com o nome e o fio dourado, as janelas escuras. u corre o
       carro da frente pra trás, v sobe do chão. A peça não pode espelhar
       (o nome leria de trás pra frente), então o lado em que a frente
       fica à direita de quem olha é outra célula: a lataria, o vidro, o
       farol e a lanterna invertidos, o nome escrito depois."""
    def f(w, h, ppm, rnd):
        return viatura_lado(w, h, ppm, rnd, invertido)
    return f


def viatura_lado(w, h, ppm, rnd, invertido):
    Y = emi(h, ppm)
    X = lambda m: int(round(m * ppm))
    a = chapado(w, h, '#1c1e21')
    a = multiplicar(a, 1 + 0.05 * fbm(h, w, 0.5 * ppm, rnd, 2, False))
    # a lataria desce do vidro ao para-choque; o vidro é a faixa de cima
    retangulo(a, X(1.25), Y(1.42), X(3.9), Y(1.0), '#0c0e11')
    v = vidro(X(3.8) - X(1.35), Y(1.02) - Y(1.36), rnd, base='#0d1014', topo='#566574', reflexo=0.2)
    a[Y(1.36):Y(1.02), X(1.35):X(3.8)] = v
    a[Y(1.36):Y(1.02), X(2.5):X(2.56)] = cor('#0c0e11')
    retangulo(a, 0, Y(0.78), w, Y(0.56), '#f1f0ea', sombra=False)          # a faixa branca
    retangulo(a, 0, Y(0.56), w, Y(0.53), '#d4a93a', sombra=False)          # o fio dourado
    for cx in (0.85, 3.7):                                                  # a caixa de roda
        r = int(0.38 * ppm)
        a[Y(0.72):h, X(cx) - r:X(cx) + r] = cor('#0a0a0a')
    retangulo(a, 0, Y(0.9), X(0.12), Y(0.7), '#e8e4c8')                    # o farol
    retangulo(a, w - X(0.1), Y(0.95), w, Y(0.72), '#b3201c')               # a lanterna
    if invertido:
        a = np.ascontiguousarray(a[:, ::-1])

    def fn(d, im):
        d.text((w - X(2.35) if invertido else X(2.35), (Y(0.78) + Y(0.56)) / 2), 'POLÍCIA CIVIL', fill=(20, 20, 24), anchor='mm',
               font=caber(d, 'POLÍCIA CIVIL', X(2.2), Y(0.56) - Y(0.78)))
    desenhar(a, fn)
    return np.clip(a, 0, 1)


def p_eq_viatura_ponta(frente):
    def f(w, h, ppm, rnd):
        Y = emi(h, ppm)
        a = chapado(w, h, '#1c1e21')
        v = vidro(w - int(0.3 * ppm), Y(1.02) - Y(1.36), rnd, base='#0d1014', topo='#566574', reflexo=0.25)
        a[Y(1.36):Y(1.02), int(0.15 * ppm):int(0.15 * ppm) + v.shape[1]] = v
        if frente:
            retangulo(a, w * 0.3, Y(0.8), w * 0.7, Y(0.55), '#0a0a0a')
            for x in (w * 0.06, w * 0.8):
                retangulo(a, x, Y(0.85), x + w * 0.14, Y(0.68), '#eeeadb')
        else:
            for x in (w * 0.04, w * 0.82):
                retangulo(a, x, Y(0.9), x + w * 0.14, Y(0.66), '#b3201c')
            retangulo(a, w * 0.38, Y(0.62), w * 0.62, Y(0.48), '#f2f2ee')
        retangulo(a, 0, Y(0.4), w, Y(0.25), '#2d2f33', sombra=False)
        return np.clip(a, 0, 1)
    return f


def p_eq_concreto(base):
    def f(w, h, ppm, rnd):
        a = reboco(w, h, ppm, rnd, base, grao=0.05, manchas=0.1, lad=True)
        for k in range(int(round(w / (1.0 * ppm)))):
            x = int(k * ppm)
            a[:, x:x + max(1, int(0.01 * ppm))] *= 0.8
        return a
    return f


def p_eq_pedra_portuguesa(w, h, ppm, rnd):
    """o calçadão de pedra portuguesa em onda: a pedrinha preta e a branca,
       cada uma com o seu contorno, a onda correndo em u"""
    a = chapado(w, h, '#e8e5dc')
    n = max(4, int(round(w / (0.045 * ppm))))
    passo = w / n
    xs = np.arange(w, dtype=np.float32)
    ys = np.arange(h, dtype=np.float32)
    X, Yy = np.meshgrid(xs, ys)
    onda = np.sin(X / w * 2 * np.pi * 2) * h * 0.12
    faixa = ((Yy + onda) / (h / 4)) % 2
    preta = faixa < 1
    a[preta] = cor('#2a2927')
    # as pedrinhas: uma grade torta com o rejunte escuro
    jit = pontos(h, w, (w / ppm) * (h / ppm) * 380, 0.25 * passo / 2, 0.4 * passo / 2, rnd, True)
    grade = ((((X + 0.3 * passo * np.sin(Yy / passo * 1.7)) % passo) < 1.2) | (((Yy + 0.3 * passo * np.sin(X / passo * 1.3)) % passo) < 1.2))
    a = multiplicar(a, 1 + 0.12 * jit)
    a[grade] *= 0.62
    return np.clip(multiplicar(a, 1 + 0.06 * fbm(h, w, 0.5 * ppm, rnd, 3, True)), 0, 1)


def p_eq_pedra_branca(w, h, ppm, rnd):
    """a pedra portuguesa branca, sem desenho, das beiradas"""
    a = chapado(w, h, '#e5e1d6')
    n = max(4, int(round(w / (0.045 * ppm))))
    passo = w / n
    xs = np.arange(w, dtype=np.float32)
    ys = np.arange(h, dtype=np.float32)
    X, Yy = np.meshgrid(xs, ys)
    grade = ((((X + 0.3 * passo * np.sin(Yy / passo * 1.7)) % passo) < 1.2) | (((Yy + 0.3 * passo * np.sin(X / passo * 1.3)) % passo) < 1.2))
    a = multiplicar(a, 1 + 0.1 * pontos(h, w, (w / ppm) * (h / ppm) * 380, 0.5, 1.5, rnd, True))
    a[grade] *= 0.7
    return np.clip(multiplicar(a, 1 + 0.07 * fbm(h, w, 0.6 * ppm, rnd, 3, True)), 0, 1)


def p_eq_areia(w, h, ppm, rnd):
    a = multiplicar(chapado(w, h, '#d8c393'), 1 + 0.12 * fbm(h, w, 0.3 * ppm, rnd, 4, True))
    return multiplicar(a, 1 + 0.18 * pontos(h, w, (w / ppm) * (h / ppm) * 3000, 0.4, 0.9, rnd, True))


def p_eq_emborrachado(w, h, ppm, rnd):
    """o piso emborrachado do parquinho: placa de 50 cm, terracota com
       uma verde de vez em quando"""
    return ladrilhos(w, h, ppm, rnd, 0.5, ['#b3523a', '#b3523a', '#aa4c35', '#3f7d4a', '#b3523a'], '#7a3a2a', 0.004, 0.0, 0.04)


def p_eq_copa(base, flor=None):
    """a copa da árvore: tufos de folha claros e escuros; o ipê leva a
       flor amarela por cima"""
    def f(w, h, ppm, rnd):
        a = chapado(w, h, base)
        a = multiplicar(a, 1 + 0.45 * fbm(h, w, 0.25 * ppm, rnd, 4, True))
        t = pontos(h, w, (w / ppm) * (h / ppm) * 160, 0.04 * ppm, 0.1 * ppm, rnd, True)
        a = multiplicar(a, 1 + 0.25 * t)
        if flor:
            m = np.clip(fbm(h, w, 0.2 * ppm, rnd, 4, True) * 3 + 0.35, 0, 1)
            aplicar(a, flor, m * 0.85)
            a = multiplicar(a, 1 + 0.2 * pontos(h, w, (w / ppm) * (h / ppm) * 400, 0.02 * ppm, 0.05 * ppm, rnd, True))
        return np.clip(a, 0, 1)
    return f


def p_eq_casca(w, h, ppm, rnd):
    a = chapado(w, h, '#6a5a48')
    xs = np.arange(w, dtype=np.float32)
    fis = np.abs(np.sin(xs / w * 2 * np.pi * 5 + 2 * fbm(1, w, 0.1 * ppm, rnd, 2, True)[0]))
    a = multiplicar(a, np.broadcast_to(0.7 + 0.4 * fis[None, :], (h, w)))
    return multiplicar(a, 1 + 0.2 * fbm(h, w, 0.08 * ppm, rnd, 3, True))


def p_eq_banca(w, h, ppm, rnd):
    """a banca de jornal: o ferro verde, a faixa BANCA DA VILA e as revistas
       penduradas em fileira"""
    Y = emi(h, ppm)
    a = chapado(w, h, '#2e6b3f')
    a = multiplicar(a, 1 + 0.06 * fbm(h, w, 0.4 * ppm, rnd, 2, False))
    retangulo(a, w * 0.04, Y(2.2), w * 0.96, Y(1.9), '#f2efe4')
    x0, x1 = w * 0.06, w * 0.94
    cores = ['#c8342b', '#1f5aa8', '#e0a52a', '#1d7a4a', '#f0ede4', '#2b2b2b', '#7a2f86', '#d96a1f', '#e8457a', '#46b3d9']
    for fila, (yb, yt) in enumerate(((1.75, 1.35), (1.3, 0.9), (0.85, 0.45))):
        x = x0
        while x < x1 - 0.2 * ppm:
            lw = rnd.uniform(0.18, 0.24) * ppm
            c = cores[int(rnd.integers(0, len(cores)))]
            retangulo(a, x, Y(yb), x + lw, Y(yt), c)
            retangulo(a, x + lw * 0.1, Y(yb) + (Y(yt) - Y(yb)) * 0.1, x + lw * 0.9, Y(yb) + (Y(yt) - Y(yb)) * 0.28, '#f6f3ea', sombra=False)
            x += lw + 0.03 * ppm
    retangulo(a, 0, Y(0.35), w, h, '#24532f', sombra=False)

    def fn(d, im):
        d.text((w / 2, (Y(2.2) + Y(1.9)) / 2), 'BANCA DA VILA', fill=(46, 107, 63), anchor='mm',
               font=caber(d, 'BANCA DA VILA', w * 0.8, (Y(1.9) - Y(2.2)) * 0.75))
    desenhar(a, fn)
    return np.clip(a, 0, 1)


def p_eq_agua(w, h, ppm, rnd):
    a = chapado(w, h, '#3d7f95')
    a = multiplicar(a, 1 + 0.25 * fbm(h, w, 0.25 * ppm, rnd, 4, True))
    b = np.clip(fbm(h, w, 0.12 * ppm, rnd, 3, True) * 4 - 0.8, 0, 1)
    aplicar(a, '#d9eef2', b * 0.6)
    return a


def p_eq_grama(w, h, ppm, rnd):
    """o gramado da praça, cortado: a listra da máquina a cada 60 cm"""
    a = multiplicar(chapado(w, h, '#5e8c3a'), 1 + 0.22 * fbm(h, w, 0.4 * ppm, rnd, 4, True))
    xs = np.arange(w, dtype=np.float32)
    fx = ((xs // max(1, int(0.6 * ppm))) % 2).astype(np.float32)
    a = multiplicar(a, np.broadcast_to(0.95 + 0.08 * fx[None, :], (h, w)))
    return multiplicar(a, 1 + 0.18 * pontos(h, w, (w / ppm) * (h / ppm) * 900, 0.5, 1.2, rnd, True))


def p_eq_ripas(w, h, ppm, rnd):
    """o assento de ripa de madeira do banco da praça: três ripas e o vão"""
    a = chapado(w, h, '#2a2016')
    n = 3
    for k in range(n):
        y0, y1 = int(k * h / n + 0.012 * ppm), int((k + 1) * h / n - 0.012 * ppm)
        m = madeira(y1 - y0, w, ppm, rnd, base='#94643a', tabua=10)
        a[y0:y1] = np.transpose(m, (1, 0, 2))
    return a


def p_eq_tabuleiro(w, h, ppm, rnd):
    """o tampo da mesa de xadrez: o tabuleiro no granito"""
    a = reboco(w, h, ppm, rnd, '#9a978f', grao=0.05, manchas=0.06, lad=False)
    m = int(0.06 * ppm)
    n = 8
    s = (w - 2 * m) / n
    for i in range(n):
        for j in range(n):
            c = '#e8e4d8' if (i + j) % 2 else '#2c2a28'
            retangulo(a, m + i * s, m + j * s, m + (i + 1) * s, m + (j + 1) * s, c, sombra=False)
    return a


def p_eq_mosaico(w, h, ppm, rnd):
    """a pastilha azul e branca da borda do chafariz"""
    return ladrilhos(w, h, ppm, rnd, 0.05, ['#2f6fb0', '#e9eef2', '#2a65a4', '#4a88c6', '#f2f4f5'], '#c9ced3', 0.003, 0.1)


def folha_equip():
    F = Folha('equip')
    F.cel('lisa', 1.0, 1.0, 24, p_lisa_clara, lad=True)
    # o shopping
    F.cel('cortina', 1.5, 4.2, 80, p_eq_cortina)
    F.cel('cortina_terreo', 1.5, 4.5, 80, p_eq_cortina_terreo)
    F.cel('cortina_topo', 1.5, 3.4, 80, p_eq_cortina_topo)
    F.cel('acm', 1.2, 1.2, 80, p_eq_acm('#c7cbcc', '#9ea3a5'), lad=True)
    F.cel('acm_escuro', 1.2, 1.2, 80, p_eq_acm('#50575a', '#393e40'), lad=True)
    F.cel('porta_shop', 4.0, 3.0, 90, p_eq_porta_shop)
    F.cel('membrana', 2.0, 2.0, 50, p_eq_membrana, lad=True)
    F.cel('granito', 2.0, 2.0, 60, p_eq_granito, lad=True)
    # a delegacia
    F.cel('pastilha', 1.0, 1.0, 150, p_eq_pastilha, lad=True)
    F.cel('azul_pol', 1.2, 1.2, 80, p_eq_azul_pol, lad=True)
    F.cel('janela_pol', 1.6, 1.3, 110, p_eq_janela_pol)
    F.cel('porta_pol', 2.2, 2.6, 100, p_eq_porta_pol)
    F.cel('bandeira_br', 1.5, 1.05, 200, p_eq_bandeira_br)
    F.cel('solar', 1.0, 1.65, 110, p_eq_solar)
    F.cel('viatura_lado', 4.6, 1.5, 110, p_eq_viatura_lado(False))
    F.cel('viatura_lado_i', 4.6, 1.5, 110, p_eq_viatura_lado(True))
    F.cel('viatura_frente', 1.8, 1.5, 110, p_eq_viatura_ponta(True))
    F.cel('viatura_tras', 1.8, 1.5, 110, p_eq_viatura_ponta(False))
    F.cel('concreto', 2.0, 2.0, 60, p_eq_concreto('#b9b5ab'), lad=True)
    F.cel('concreto_claro', 2.0, 2.0, 60, p_eq_concreto('#d6d2c7'), lad=True)
    # a praça
    F.cel('pedra', 2.4, 2.4, 90, p_eq_pedra_portuguesa, lad=True)
    F.cel('pedra_branca', 2.0, 2.0, 90, p_eq_pedra_branca, lad=True)
    F.cel('areia', 2.0, 2.0, 70, p_eq_areia, lad=True)
    F.cel('emborrachado', 2.0, 2.0, 60, p_eq_emborrachado, lad=True)
    F.cel('copa', 2.0, 2.0, 70, p_eq_copa('#3f6e2e'), lad=True)
    F.cel('copa_ipe', 2.0, 2.0, 70, p_eq_copa('#4e7a2e', '#f1c21b'), lad=True)
    F.cel('casca', 1.0, 2.0, 80, p_eq_casca, lad=True)
    F.cel('banca', 3.0, 2.3, 80, p_eq_banca)
    F.cel('agua', 2.0, 2.0, 60, p_eq_agua, lad=True)
    F.cel('grama', 2.0, 2.0, 70, p_eq_grama, lad=True)
    F.cel('ripas', 1.2, 0.45, 150, p_eq_ripas, lad=True)
    F.cel('tabuleiro', 0.7, 0.7, 180, p_eq_tabuleiro)
    F.cel('mosaico', 1.0, 1.0, 100, p_eq_mosaico, lad=True)
    return F.montar()


# =========================================================
#   15. A PRAIA — o que a areia e o mar têm, em 3D
#   O deck do quiosque, a lona listrada da barraca e da cadeira, o
#   tecido do guarda-sol (a cor vem do vértice), o sapê, a tábua
#   pintada, o balcão de azulejo, o cardápio de giz, a geladeira, o
#   freezer, o tampo da mesa de plástico, o metal, a bandeira do
#   salva-vidas, a madeira velha e o tronco da jangada, a vela, o
#   costado do barco, o isopor, as cangas, a prancha e a prateleira
#   de garrafa. A calçada de pedra portuguesa e a areia são as da
#   praça (folha `equip`).
# =========================================================
def veio(h, w, ppm, rnd, lad=True, estica=10, per=0.03):
    """o veio da madeira: ruído esticado ao longo de x (a fibra corre na
       tábua deitada). Ladrilhável nas duas direções."""
    ws = max(4, w // estica)
    n = fbm(h, ws, max(1.5, per * ppm), rnd, 3, lad)
    if lad:
        t = np.tile(n, (1, 3))
        a = np.asarray(Image.fromarray(t, 'F').resize((3 * w, h), Image.BICUBIC))[:, w:2 * w]
    else:
        a = np.asarray(Image.fromarray(n, 'F').resize((w, h), Image.BICUBIC))
    return a


def tabuado(w, h, ppm, rnd, base, larg_tabua, fresta=0.008, desbote=0.18, pregos=None, lad=True):
    """tábuas deitadas (correndo em x), cada uma no seu tom, com o veio,
       a fresta escura entre elas e, se pedido, o par de pregos a cada
       `pregos` metros (em cima da viga)"""
    n = max(1, int(round(h / (larg_tabua * ppm))))
    th = h / n
    a = chapado(w, h, base)
    v = veio(h, w, ppm, rnd, lad)
    for j in range(n):
        y0, y1 = int(round(j * th)), int(round((j + 1) * th))
        tom = 1 + 0.16 * (rnd.random() - 0.5) * 2
        a[y0:y1] *= tom
        a[y0:y1] *= (1 + 0.35 * v[y0:y1])[..., None]
        f = max(1, int(fresta * ppm))
        a[y0:y0 + f] *= 0.35
        a[y0 + f:y0 + f + 1] *= 0.8
        if pregos:
            passo = pregos * ppm
            x = (rnd.random() * passo) if not lad else 0.3 * passo
            while x < w:
                for yy in (y0 + th * 0.28, y0 + th * 0.72):
                    xi, yi = int(x) % w, int(yy)
                    a[max(0, yi - 1):yi + 2, max(0, xi - 1):xi + 2] *= 0.45
                x += passo
    # o sol desbota em manchas largas
    a = multiplicar(a, 1 + desbote * fbm(h, w, 0.8 * ppm, rnd, 3, lad))
    return np.clip(a, 0, 1)


def p_pr_deck(w, h, ppm, rnd):
    """o deck do quiosque: tábua de 14 cm já cinza de sol, o prego na viga"""
    return tabuado(w, h, ppm, rnd, '#9a7b58', 0.145, 0.009, 0.22, pregos=0.6)


def p_pr_madeira_velha(w, h, ppm, rnd):
    """madeira velha de barco e de pilar: o cinza do sal por cima do marrom"""
    a = tabuado(w, h, ppm, rnd, '#86745f', 0.2, 0.004, 0.25)
    return np.clip(a * 0.9 + cor('#8e8a80')[None, None, :] * 0.12, 0, 1)


def p_pr_tronco(w, h, ppm, rnd):
    """o tronco da jangada (piúba): a madeira clara com a casca que sobrou
       em lascas; a fibra corre em x (o tronco deitado)"""
    a = chapado(w, h, '#b99a6e')
    a = multiplicar(a, 1 + 0.4 * veio(h, w, ppm, rnd, True, 14, 0.02))
    casca = np.clip(fbm(h, w, 0.18 * ppm, rnd, 4, True) * 3 - 0.35, 0, 1)
    aplicar(a, '#5a4632', casca * 0.85)
    return np.clip(multiplicar(a, 1 + 0.12 * fbm(h, w, 0.6 * ppm, rnd, 2, True)), 0, 1)


def p_pr_lona(c1, c2, listra=0.125):
    """lona de barraca e de cadeira de praia: listra em pé nas duas cores,
       a trama do pano e a sujeira de uso"""
    def f(w, h, ppm, rnd):
        xs = np.arange(w, dtype=np.float32)
        n = max(2, int(round(w / (listra * ppm))))
        faixa = (np.floor(xs / (w / n)) % 2).astype(np.float32)
        a = cor(c1)[None, None, :] * (1 - faixa[None, :, None]) + cor(c2)[None, None, :] * faixa[None, :, None]
        a = np.broadcast_to(a, (h, w, 3)).copy()
        ys = np.arange(h, dtype=np.float32)
        trama = 0.94 + 0.06 * np.sin(xs[None, :] * 2.1) * np.sin(ys[:, None] * 2.1)
        a = multiplicar(a, trama.astype(np.float32))
        a = multiplicar(a, 1 + 0.10 * fbm(h, w, 0.4 * ppm, rnd, 3, True))
        return np.clip(a, 0, 1)
    return f


def p_pr_tecido(w, h, ppm, rnd):
    """o pano do guarda-sol, quase branco (a cor vem do vértice), com a
       trama e a costura nas duas bordas do gomo"""
    a = chapado(w, h, '#f4f2ec')
    xs = np.arange(w, dtype=np.float32)
    ys = np.arange(h, dtype=np.float32)
    a = multiplicar(a, (0.95 + 0.05 * np.sin(xs[None, :] * 2.3) * np.sin(ys[:, None] * 2.3)).astype(np.float32))
    a = multiplicar(a, 1 + 0.06 * fbm(h, w, 0.3 * ppm, rnd, 3, False))
    c = max(2, int(0.012 * ppm))
    a[:, :c] *= 0.78
    a[:, -c:] *= 0.78
    return np.clip(a, 0, 1)


def p_pr_palha(w, h, ppm, rnd):
    """o sapê do quiosque: camadas de palha de 25 cm, a fibra caindo, a
       ponta desfiada de cada camada e a sombra dela na de baixo"""
    img = Image.new('RGB', (w, h), (120, 92, 52))
    d = ImageDraw.Draw(img)
    camada = 0.25 * ppm
    n = max(1, int(round(h / camada)))
    camada = h / n
    cores = [(196, 160, 96), (178, 140, 80), (206, 176, 112), (160, 124, 70), (188, 150, 88)]
    for j in range(n + 1):
        y0 = j * camada - camada * 0.1
        for _ in range(int(w * 1.6)):
            x = rnd.random() * w
            comp = camada * rnd.uniform(0.9, 1.35)
            dx = rnd.uniform(-0.05, 0.05) * comp
            c = cores[int(rnd.integers(0, len(cores)))]
            g = rnd.uniform(0.85, 1.1)
            cc = tuple(int(min(255, v * g)) for v in c)
            for off in (-w, 0, w):
                d.line([(x + off, y0), (x + off + dx, y0 + comp)], fill=cc, width=max(1, int(0.006 * ppm)))
    a = para_np(img)
    ys = np.arange(h, dtype=np.float32)
    fase = (ys % camada) / camada
    a = multiplicar(a, np.broadcast_to((0.62 + 0.45 * fase ** 0.6)[:, None], (h, w)).astype(np.float32))
    return np.clip(multiplicar(a, 1 + 0.1 * fbm(h, w, 0.5 * ppm, rnd, 3, True)), 0, 1)


def p_pr_tabuas(w, h, ppm, rnd):
    """a tábua de sobrepor pintada (a parede do quiosque e da cabine do
       salva-vidas): clara, a cor vem do vértice; a sombra da tábua de
       cima e a tinta gasta mostrando a madeira"""
    n = max(1, int(round(h / (0.15 * ppm))))
    th = h / n
    a = chapado(w, h, '#f1efe9')
    ys = np.arange(h, dtype=np.float32)
    fase = (ys % th) / th
    a = multiplicar(a, np.broadcast_to((0.8 + 0.2 * np.clip(fase * 4, 0, 1))[:, None], (h, w)).astype(np.float32))
    gasto = np.clip(fbm(h, w, 0.15 * ppm, rnd, 4, True) * 3 - 0.55, 0, 1)
    aplicar(a, '#9c7a55', gasto * 0.8)
    return np.clip(multiplicar(a, 1 + 0.05 * fbm(h, w, 0.5 * ppm, rnd, 3, True)), 0, 1)


def p_pr_balcao(w, h, ppm, rnd):
    """a frente do balcão: o azulejo azul e branco de 15 cm até o meio e o
       rodapé escuro; em cima, a faixa de madeira do tampo"""
    a = chapado(w, h, '#f0f1ee')
    lado = 0.15 * ppm
    for j in range(int(h / lado) + 1):
        for i in range(int(w / lado) + 1):
            x0, y0 = i * lado, j * lado
            retangulo(a, x0 + 1, y0 + 1, x0 + lado - 1, y0 + lado - 1, '#eef0f2', relevo=0.05)
            cx, cy = x0 + lado / 2, y0 + lado / 2
            def flor(d, im, cx=cx, cy=cy):
                r = lado * 0.32
                d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(40, 90, 160), width=max(1, int(0.008 * ppm)))
                for k in range(4):
                    t = k * math.pi / 2 + math.pi / 4
                    d.ellipse([cx + math.cos(t) * r * 0.7 - r * 0.28, cy + math.sin(t) * r * 0.7 - r * 0.28,
                               cx + math.cos(t) * r * 0.7 + r * 0.28, cy + math.sin(t) * r * 0.7 + r * 0.28], fill=(44, 96, 170))
                d.rectangle([x0, y0, x0 + lado, y0 + lado], outline=(190, 196, 200))
            desenhar(a, flor)
    retangulo(a, 0, h - 0.12 * ppm, w, h, '#2e3336')
    t = int(0.1 * ppm)
    a[0:t] = np.transpose(madeira(t, w, ppm, rnd, '#7a5230'), (1, 0, 2))
    return np.clip(multiplicar(a, 1 + 0.05 * fbm(h, w, 0.4 * ppm, rnd, 2, False)), 0, 1)


def p_pr_cardapio(w, h, ppm, rnd):
    """o cardápio de giz na lousa, na moldura de madeira"""
    a = chapado(w, h, '#253029')
    a = multiplicar(a, 1 + 0.12 * fbm(h, w, 0.2 * ppm, rnd, 3, False))
    borda = int(0.05 * ppm)
    moldura(a, 0, 0, w, h, borda, '#7a5431')
    itens = [('ÁGUA DE COCO', '8'), ('CERVEJA 600', '14'), ('REFRIGERANTE', '7'), ('CAIPIRINHA', '20'),
             ('PASTEL', '10'), ('ISCA DE PEIXE', '45'), ('CAMARÃO', '60'), ('AÇAÍ', '18')]
    def escrever(d, im):
        d.text((w / 2, borda + 0.1 * ppm), 'CARDÁPIO', fill=(246, 244, 236), anchor='mm', font=fonte('negrito', 0.1 * ppm))
        y = borda + 0.22 * ppm
        passo = (h - y - borda - 0.06 * ppm) / len(itens)
        f = fonte('normal', 0.055 * ppm)
        for i, (nome, preco) in enumerate(itens):
            yy = y + i * passo + passo / 2
            d.text((borda + 0.05 * ppm, yy), nome, fill=(236, 234, 226), anchor='lm', font=f)
            d.text((w - borda - 0.05 * ppm, yy), 'R$ ' + preco, fill=(246, 214, 92), anchor='rm', font=f)
            d.line([(borda + 0.05 * ppm, yy + passo * 0.42), (w - borda - 0.05 * ppm, yy + passo * 0.42)], fill=(70, 84, 76), width=1)
    desenhar(a, escrever)
    # o giz: a letra sai falhada
    falha = np.clip(fbm(h, w, 0.012 * ppm, rnd, 2, False) * 3, -1, 1)
    claro = (a.mean(axis=2) > 0.45).astype(np.float32)
    a = a * (1 - 0.35 * np.clip(falha, 0, 1)[..., None] * claro[..., None])
    return np.clip(a, 0, 1)


def p_pr_geladeira(w, h, ppm, rnd):
    """a geladeira de porta de vidro: a moldura vermelha, o letreiro
       GELADINHA em cima e as prateleiras de lata e garrafa"""
    a = chapado(w, h, '#c8202a')
    topo = int(0.26 * ppm)
    retangulo(a, 0, 0, w, topo, '#b51b24')
    def letra(d, im):
        d.text((w / 2, topo / 2), 'GELADINHA', fill=(255, 255, 255), anchor='mm', font=fonte('negrito', 0.11 * ppm))
    desenhar(a, letra)
    m = int(0.05 * ppm)
    x0, y0, x1, y1 = m, topo + m, w - m, h - int(0.12 * ppm)
    a[y0:y1, x0:x1] = cor('#1c2528')
    cores = ['#e02a2a', '#1f5aa8', '#f1c21b', '#2a8f4a', '#f2f2ee', '#7a2f86', '#e8872a', '#c8c8c8']
    n = 5
    ph = (y1 - y0) / n
    for j in range(n):
        yb = y0 + (j + 1) * ph - 2
        a[int(yb):int(yb) + 3, x0:x1] = cor('#9aa3a6')
        x = x0 + 2
        while x < x1 - 0.06 * ppm:
            garrafa = rnd.random() < 0.35
            lw = (0.06 if garrafa else 0.066) * ppm
            hh = (0.24 if garrafa else 0.12) * ppm
            c = cor(cores[int(rnd.integers(0, len(cores)))])
            if garrafa:
                c = cor(['#5a3a1a', '#2d6b2d', '#7a5a1a'][int(rnd.integers(0, 3))])
            retangulo(a, x, yb - hh, x + lw, yb, c * 0.95, relevo=0.2)
            x += lw + 1
    # o vidro por cima
    ys = np.linspace(0, 1, y1 - y0, dtype=np.float32)[:, None]
    xs = np.linspace(0, 1, x1 - x0, dtype=np.float32)[None, :]
    faixa = np.exp(-((xs * 0.8 + ys * 0.5 - 0.5) / 0.08) ** 2) * 0.35
    a[y0:y1, x0:x1] = np.clip(a[y0:y1, x0:x1] * 0.85 + faixa[..., None] + 0.05, 0, 1)
    retangulo(a, x1 - 0.06 * ppm, y0 + (y1 - y0) * 0.4, x1 - 0.035 * ppm, y0 + (y1 - y0) * 0.6, '#d8dcde')
    return np.clip(a, 0, 1)


def p_pr_freezer(w, h, ppm, rnd):
    """o freezer de sorvete: branco, a faixa azul com SORVETES e os
       picolés desenhados"""
    a = reboco(w, h, ppm, rnd, '#f2f2ef', grao=0.02, manchas=0.04, lad=False)
    faixa0, faixa1 = h * 0.18, h * 0.55
    retangulo(a, 0, faixa0, w, faixa1, '#1f6fc0')
    def letra(d, im):
        d.text((w / 2, (faixa0 + faixa1) / 2), 'SORVETES', fill=(255, 255, 255), anchor='mm', font=fonte('negrito', 0.14 * ppm))
        for i, c in enumerate([(236, 90, 120), (250, 200, 60), (120, 200, 90), (150, 90, 60), (240, 240, 240)]):
            x = w * (0.12 + i * 0.19)
            y = h * 0.72
            d.rounded_rectangle([x - 0.04 * ppm, y - 0.08 * ppm, x + 0.04 * ppm, y + 0.06 * ppm], radius=int(0.03 * ppm), fill=c)
            d.line([(x, y + 0.06 * ppm), (x, y + 0.11 * ppm)], fill=(200, 170, 120), width=max(1, int(0.012 * ppm)))
    desenhar(a, letra)
    retangulo(a, 0, 0, w, 0.04 * ppm, '#d8d8d4')
    retangulo(a, 0, h - 0.08 * ppm, w, h, '#3a3d40')
    return np.clip(a, 0, 1)


def p_pr_mesa(w, h, ppm, rnd):
    """o tampo da mesa de plástico: branco, a borda em relevo e a marca
       de cerveja no meio (inventada: PRAIANA)"""
    a = chapado(w, h, '#f3f2ee')
    a = multiplicar(a, 1 + 0.04 * fbm(h, w, 0.2 * ppm, rnd, 3, False))
    moldura(a, 0, 0, w, h, max(2, int(0.025 * ppm)), '#e2e1dc')
    def logo(d, im):
        r = min(w, h) * 0.3
        d.ellipse([w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r], fill=(200, 30, 40))
        d.ellipse([w / 2 - r * 0.84, h / 2 - r * 0.84, w / 2 + r * 0.84, h / 2 + r * 0.84], outline=(250, 206, 60), width=max(2, int(0.012 * ppm)))
        d.text((w / 2, h / 2), 'PRAIANA', fill=(255, 255, 255), anchor='mm', font=fonte('negrito', r * 0.36))
    desenhar(a, logo)
    return np.clip(a, 0, 1)


def p_pr_lisa(w, h, ppm, rnd):
    return np.clip(multiplicar(chapado(w, h, '#f2f1ee'), 1 + 0.03 * fbm(h, w, 0.3 * ppm, rnd, 2, True)), 0, 1)


def p_pr_metal(w, h, ppm, rnd):
    """alumínio escovado: o risco corre em x"""
    a = chapado(w, h, '#c4c8cb')
    a = multiplicar(a, 1 + 0.12 * veio(h, w, ppm, rnd, True, 20, 0.01))
    return np.clip(a, 0, 1)


def p_pr_bandeira(w, h, ppm, rnd):
    """a bandeira do salva-vidas: vermelha em cima, amarela embaixo, com
       a dobra do pano"""
    a = chapado(w, h, '#d62b22')
    a[h // 2:] = cor('#f2c224')
    xs = np.arange(w, dtype=np.float32)
    dobra = 0.88 + 0.14 * np.sin(xs / w * np.pi * 3 + 0.5)
    a = multiplicar(a, np.broadcast_to(dobra[None, :], (h, w)).astype(np.float32))
    return np.clip(a, 0, 1)


def p_pr_vela(w, h, ppm, rnd):
    """a vela da jangada: o pano cru com a costura a cada 40 cm, os
       remendos e o número pintado"""
    a = reboco(w, h, ppm, rnd, '#ece6d6', grao=0.05, manchas=0.14, lad=False)
    for k in range(1, int(h / (0.4 * ppm)) + 1):
        y = int(k * 0.4 * ppm)
        a[y:y + max(1, int(0.006 * ppm))] *= 0.8
    for _ in range(3):
        rw, rh = rnd.uniform(0.2, 0.35) * ppm, rnd.uniform(0.15, 0.3) * ppm
        x, y = rnd.uniform(0.1, 0.8) * w, rnd.uniform(0.2, 0.85) * h
        c = ['#e4dcc6', '#d8c9a4', '#c7473b'][int(rnd.integers(0, 3))]
        retangulo(a, x, y, x + rw, y + rh, c, relevo=0.06)
    def num(d, im):
        d.text((w * 0.55, h * 0.42), '27', fill=(170, 40, 36), anchor='mm', font=fonte('negrito', 0.36 * ppm))
    desenhar(a, num)
    manchas = np.clip(fbm(h, w, 0.3 * ppm, rnd, 3, False) * 2.5 - 0.3, 0, 1)
    aplicar(a, '#b8ad92', manchas * 0.35)
    return np.clip(a, 0, 1)


def p_pr_casco(w, h, ppm, rnd):
    """o costado do barco de pesca (o do 2D: branco, de faixa azul): o
       fundo vermelho, o friso azul na linha d'água, o branco do corpo, a
       faixa azul, a fiada de cima azul com o filete amarelo; a tábua e a
       tinta lascada. Em metros, de baixo pra cima. Ladrilha em x."""
    Y = em(h, ppm)
    a = chapado(w, h, '#f0efe9')
    faixas = [(0, 0.2, '#a3302a'), (0.2, 0.235, '#1f5c9e'), (0.55, 0.62, '#1f5c9e'), (0.69, 0.9, '#1f5c9e'), (0.83, 0.86, '#f2c224')]
    for b0, b1, c in faixas:
        a[int(Y(b1)):int(Y(b0))] = cor(c)
    ys = np.arange(h, dtype=np.float32)
    tab = ((ys % (0.12 * ppm)) < max(1, 0.006 * ppm)).astype(np.float32)
    a = multiplicar(a, np.broadcast_to((1 - 0.25 * tab)[:, None], (h, w)).astype(np.float32))
    lasca = np.clip(fbm(h, w, 0.06 * ppm, rnd, 4, True) * 3.2 - 0.9, 0, 1)
    aplicar(a, '#8a7a62', lasca * 0.7)
    return np.clip(multiplicar(a, 1 + 0.1 * fbm(h, w, 0.5 * ppm, rnd, 3, True)), 0, 1)


def p_pr_isopor(w, h, ppm, rnd):
    """o isopor: branco de bolinha, a alça azul e o adesivo GELO"""
    a = chapado(w, h, '#f4f4f1')
    a = multiplicar(a, 1 + 0.08 * pontos(h, w, (w / ppm) * (h / ppm) * 4000, 0.5, 1.3, rnd, False))
    retangulo(a, 0, 0, w, 0.04 * ppm, '#e6e6e2')
    def adesivo(d, im):
        d.rounded_rectangle([w * 0.3, h * 0.35, w * 0.7, h * 0.7], radius=int(0.02 * ppm), fill=(30, 110, 190))
        d.text((w / 2, h * 0.525), 'GELO', fill=(255, 255, 255), anchor='mm', font=fonte('negrito', 0.08 * ppm))
    desenhar(a, adesivo)
    return np.clip(a, 0, 1)


def p_pr_canga(estilo):
    def f(w, h, ppm, rnd):
        if estilo == 'brasil':
            a = chapado(w, h, '#1f9a4a')
            def des(d, im):
                d.polygon([(w * 0.08, h / 2), (w / 2, h * 0.1), (w * 0.92, h / 2), (w / 2, h * 0.9)], fill=(246, 206, 32))
                r = h * 0.24
                d.ellipse([w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r], fill=(32, 62, 140))
                d.arc([w / 2 - r * 1.25, h / 2 - r * 0.35, w / 2 + r * 1.25, h / 2 + r * 2.1], 200, 340, fill=(246, 246, 240), width=max(2, int(0.02 * ppm)))
            desenhar(a, des)
        elif estilo == 'tiedye':
            ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
            cx, cy = w * 0.45, h * 0.5
            ang = np.arctan2(ys - cy, xs - cx)
            r = np.hypot(xs - cx, ys - cy) / (0.2 * ppm)
            t = (np.sin(r * 1.3 + ang * 3 + fbm(h, w, 0.2 * ppm, rnd, 3, False) * 4) + 1) / 2
            c1, c2, c3 = cor('#e8457a'), cor('#f2a33a'), cor('#7a3fb0')
            a = c1[None, None, :] * t[..., None] + c2[None, None, :] * (1 - t[..., None])
            m = np.clip((np.sin(r * 0.7 - ang * 2) + 0.2), 0, 1)
            a = a * (1 - 0.6 * m[..., None]) + c3[None, None, :] * 0.6 * m[..., None]
        elif estilo == 'listra':
            ys = np.arange(h, dtype=np.float32)
            idx = (np.floor(ys / (0.12 * ppm)) % 3).astype(int)
            pal = np.array([cor('#2fb5b0'), cor('#f4f1ea'), cor('#f07a5a')])
            a = np.broadcast_to(pal[idx][:, None, :], (h, w, 3)).copy()
        else:  # flor
            a = chapado(w, h, '#1b3f73')
            def flores(d, im):
                for _ in range(26):
                    x, y, r = rnd.random() * w, rnd.random() * h, rnd.uniform(0.07, 0.13) * ppm
                    c = [(240, 90, 120), (250, 200, 70), (245, 245, 240)][int(rnd.integers(0, 3))]
                    for k in range(5):
                        t = k * 2 * math.pi / 5 + rnd.random()
                        d.ellipse([x + math.cos(t) * r * 0.55 - r * 0.45, y + math.sin(t) * r * 0.55 - r * 0.45,
                                   x + math.cos(t) * r * 0.55 + r * 0.45, y + math.sin(t) * r * 0.55 + r * 0.45], fill=c)
                    d.ellipse([x - r * 0.2, y - r * 0.2, x + r * 0.2, y + r * 0.2], fill=(250, 220, 90))
            desenhar(a, flores)
        # a franja nas duas pontas e a dobra do pano
        fr = int(0.04 * ppm)
        a[:, :fr] *= 0.8
        a[:, -fr:] *= 0.8
        xs = np.arange(w, dtype=np.float32)
        a = multiplicar(a, np.broadcast_to((0.93 + 0.07 * np.sin(xs / w * np.pi * 5))[None, :], (h, w)).astype(np.float32))
        return np.clip(a, 0, 1)
    return f


def p_pr_prancha(w, h, ppm, rnd):
    """a prancha de surfe por cima: branca, a listra no meio (a longarina)
       e a faixa colorida perto do bico"""
    a = chapado(w, h, '#f6f5f1')
    retangulo(a, 0, h / 2 - 0.006 * ppm, w, h / 2 + 0.006 * ppm, '#c9b79a', sombra=False)
    for x0, x1, c in ((0.62, 0.7, '#1fa0b8'), (0.72, 0.76, '#f2a33a')):
        retangulo(a, w * x0, 0, w * x1, h, c, sombra=False)
    def marca(d, im):
        d.text((w * 0.3, h / 2), 'MARÉ', fill=(40, 40, 40), anchor='mm', font=fonte('negrito', 0.12 * ppm))
    desenhar(a, marca)
    return np.clip(multiplicar(a, 1 + 0.03 * fbm(h, w, 0.2 * ppm, rnd, 2, False)), 0, 1)


def p_pr_prateleira(w, h, ppm, rnd):
    """a prateleira atrás do balcão: duas tábuas com garrafa de cachaça,
       de vodca e de uísque, e o copo americano de boca pra baixo"""
    a = chapado(w, h, '#3b2c20')
    a = multiplicar(a, 1 + 0.15 * fbm(h, w, 0.3 * ppm, rnd, 2, False))
    for yb in (h * 0.48, h * 0.96):
        retangulo(a, 0, yb - 0.03 * ppm, w, yb, '#8a6238')
        x = 0.04 * ppm
        while x < w - 0.1 * ppm:
            tipo = rnd.random()
            if tipo < 0.7:
                gw, gh = 0.075 * ppm, rnd.uniform(0.25, 0.32) * ppm
                c = cor(['#c8a24a', '#e8e4d8', '#6b3a1a', '#2e6b3a', '#b83a2a', '#d9d4c0'][int(rnd.integers(0, 6))])
                retangulo(a, x, yb - 0.03 * ppm - gh * 0.72, x + gw, yb - 0.03 * ppm, c, relevo=0.25)
                retangulo(a, x + gw * 0.32, yb - 0.03 * ppm - gh, x + gw * 0.68, yb - 0.03 * ppm - gh * 0.72, c * 0.9, relevo=0.2)
                retangulo(a, x + gw * 0.1, yb - 0.03 * ppm - gh * 0.5, x + gw * 0.9, yb - 0.03 * ppm - gh * 0.25, '#f2eee2', relevo=0.05)
                x += gw + 0.02 * ppm
            else:
                gw = 0.06 * ppm
                retangulo(a, x, yb - 0.03 * ppm - 0.09 * ppm, x + gw, yb - 0.03 * ppm, '#c9d6d8', relevo=0.3)
                x += gw + 0.015 * ppm
    return np.clip(a, 0, 1)


def p_pr_telha_metal(w, h, ppm, rnd):
    """a telha metálica branca do quiosque moderno: a onda trapezoidal
       corre em u"""
    xs = np.arange(w, dtype=np.float32)
    passo = w / max(1, int(round(w / (0.25 * ppm))))
    f = (xs % passo) / passo
    perfil = np.where(f < 0.35, 1.0, np.where(f < 0.45, 0.75, np.where(f < 0.9, 0.92, 0.75)))
    a = chapado(w, h, '#e8e9e7')
    a = multiplicar(a, np.broadcast_to(perfil[None, :], (h, w)).astype(np.float32))
    return np.clip(multiplicar(a, 1 + 0.06 * fbm(h, w, 0.6 * ppm, rnd, 2, True)), 0, 1)


def p_pr_vidro(w, h, ppm, rnd):
    a = vidro(w, h, rnd, base='#1b2428', topo='#6e8490', reflexo=0.22)
    moldura_simples(a, ppm, 0, 0, w, h, '#d8dcde', 0.03)
    return a


def p_pr_coco(w, h, ppm, rnd):
    """a casca do coco verde: o verde com a estria clara"""
    a = chapado(w, h, '#6c8f2e')
    ys = np.arange(h, dtype=np.float32)
    a = multiplicar(a, np.broadcast_to((0.9 + 0.12 * np.sin(ys / h * np.pi * 6))[:, None], (h, w)).astype(np.float32))
    return np.clip(multiplicar(a, 1 + 0.12 * fbm(h, w, 0.1 * ppm, rnd, 3, True)), 0, 1)


def folha_praia():
    F = Folha('praia')
    F.cel('deck', 2.0, 2.0, 90, p_pr_deck, lad=True)
    F.cel('madeira_velha', 1.0, 1.0, 100, p_pr_madeira_velha, lad=True)
    F.cel('tronco', 1.0, 0.5, 110, p_pr_tronco, lad=True)
    F.cel('lona_vermelha', 1.0, 1.0, 100, p_pr_lona('#d8322e', '#f3efe6'), lad=True)
    F.cel('lona_azul', 1.0, 1.0, 100, p_pr_lona('#1f64b8', '#f3efe6'), lad=True)
    F.cel('lona_laranja', 1.0, 1.0, 100, p_pr_lona('#ee7d22', '#f6e7a6'), lad=True)
    F.cel('lona_verde', 1.0, 1.0, 100, p_pr_lona('#1f8a5a', '#f2e36b'), lad=True)
    F.cel('tecido', 1.0, 1.0, 90, p_pr_tecido)
    F.cel('palha', 1.2, 1.0, 110, p_pr_palha, lad=True)
    F.cel('tabuas', 1.0, 1.0, 100, p_pr_tabuas, lad=True)
    F.cel('balcao', 1.6, 1.0, 110, p_pr_balcao)
    F.cel('cardapio', 0.8, 1.1, 180, p_pr_cardapio)
    F.cel('geladeira', 0.75, 1.8, 110, p_pr_geladeira)
    F.cel('freezer', 1.1, 0.85, 110, p_pr_freezer)
    F.cel('mesa', 0.8, 0.8, 150, p_pr_mesa)
    F.cel('lisa', 0.5, 0.5, 24, p_pr_lisa, lad=True)
    F.cel('metal', 0.5, 0.5, 100, p_pr_metal, lad=True)
    F.cel('bandeira', 0.9, 0.6, 150, p_pr_bandeira)
    F.cel('vela', 1.2, 1.6, 110, p_pr_vela)
    F.cel('casco', 2.0, 0.9, 110, p_pr_casco, lad=True)
    F.cel('isopor', 0.6, 0.45, 160, p_pr_isopor)
    F.cel('canga_brasil', 1.6, 1.0, 110, p_pr_canga('brasil'))
    F.cel('canga_tiedye', 1.6, 1.0, 110, p_pr_canga('tiedye'))
    F.cel('canga_listra', 1.6, 1.0, 110, p_pr_canga('listra'))
    F.cel('canga_flor', 1.6, 1.0, 110, p_pr_canga('flor'))
    F.cel('prancha', 2.0, 0.55, 120, p_pr_prancha)
    F.cel('prateleira', 1.4, 0.9, 140, p_pr_prateleira)
    F.cel('telha_metal', 1.0, 1.0, 90, p_pr_telha_metal, lad=True)
    F.cel('vidro', 1.0, 1.0, 90, p_pr_vidro)
    F.cel('coco', 0.4, 0.4, 150, p_pr_coco, lad=True)
    return F.montar()


FOLHAS = {
    'predio': folha_predio, 'igreja': folha_igreja, 'loja': folha_loja, 'adm': folha_adm, 'casa': folha_casa,
    'atacadex': folha_atacadex, 'torres': folha_torres, 'props': folha_props, 'casas': folha_casas, 'grades': folha_grades,
    'metro': folha_metro, 'equip': folha_equip, 'praia': folha_praia,
}


def atlas_atual():
    """o atlas que já está escrito, pra repintar só algumas folhas"""
    if not os.path.isfile(ATLAS_JS):
        return {}
    txt = open(ATLAS_JS, encoding='utf-8').read()
    return json.loads(txt[txt.index('{'):txt.rindex('}') + 1])


def main():
    """sem argumento pinta todas; com nomes (`metro equip`), só essas, e o
       atlas guarda o que as outras já tinham"""
    pedidas = [a for a in sys.argv[1:] if not a.startswith('-')]
    for n in pedidas:
        if n not in FOLHAS:
            sys.exit(f'não conheço a folha {n!r}: ' + ', '.join(FOLHAS))
    print('pintando as folhas dos prédios modelados:')
    atlas = atlas_atual() if pedidas else {}
    for nome, fn in FOLHAS.items():
        if not pedidas or nome in pedidas:
            atlas[nome] = fn()
    atlas = {n: atlas[n] for n in FOLHAS if n in atlas}
    corpo = json.dumps(atlas, ensure_ascii=False, indent=1)
    with open(ATLAS_JS, 'w', encoding='utf-8') as f:
        f.write('/* GERADO por ferramentas/pintar_modelos.py — não edite à mão.\n'
                '   Onde cada célula das folhas de textura dos prédios modelados\n'
                '   caiu: [u0, v0, u1, v1, largura_m, altura_m], com v0 embaixo. */\n')
        f.write('export const ATLAS = ' + corpo + ';\n')
    print('atlas:', os.path.relpath(ATLAS_JS, RAIZ))


if __name__ == '__main__':
    main()
