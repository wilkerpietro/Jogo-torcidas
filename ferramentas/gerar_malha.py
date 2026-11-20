"""
Gera a malha de caminhabilidade da cena dos arredores a partir da foto.

Cor sozinha nao separa telhado de asfalto (medido: telhado lum 69/sat 11,
asfalto lum 71/sat 5). Entao: propagacao a partir de sementes na via,
barrada por bordas fortes (meio-fio, parede, sombra de predio).
"""
import numpy as np
from PIL import Image
from scipy import ndimage

ORIG = 'img/cenas/arredores.png'
CEL  = 8

im = np.asarray(Image.open(ORIG).convert('RGB')).astype(np.float32)
H, W, _ = im.shape
r, g, b = im[:, :, 0], im[:, :, 1], im[:, :, 2]

lum = 0.299 * r + 0.587 * g + 0.114 * b
sat = im.max(2) - im.min(2)
verde = (g > r * 1.05) & (g > b * 1.12)

# ---- 1. o que tem cara de piso (asfalto, calcada, praca)
piso = (sat < 30) & (lum > 44) & (lum < 185) & (~verde)

# ---- 2. bordas: meio-fio, parede, sombra. Sobel sobre a luminancia suavizada
suave = ndimage.gaussian_filter(lum, 1.1)
gx = ndimage.sobel(suave, axis=1)
gy = ndimage.sobel(suave, axis=0)
grad = np.hypot(gx, gy)

LIMIAR_BORDA = 46.0
transitavel = piso & (grad < LIMIAR_BORDA)

# ---- 3. sementes: pontos que sao via com certeza
SEMENTES = [
    (700, 480), (700, 400), (700, 360), (620, 470), (860, 470),
    (690, 760), (690, 950), (640, 1000),
    (100, 660), (300, 660), (500, 655),
    (1450, 650), (1300, 645), (1000, 650),
    (100, 260), (180, 270),
    (1460, 250), (1350, 250),
    (291, 60), (291, 150), (291, 250),
    (1255, 60), (1255, 150), (1255, 250),
    (400, 320), (500, 330), (900, 330), (1100, 330),
    (200, 430), (1350, 430),
    (1000, 500), (1100, 550),
]
sem = np.zeros((H, W), bool)
for x, y in SEMENTES:
    sem[max(0, y - 2):y + 3, max(0, x - 2):x + 3] = True
sem &= transitavel

# ---- 4. propaga so por dentro do transitavel
alcanc = ndimage.binary_propagation(sem, mask=transitavel)

# ---- 5. recupera a faixa junto ao meio-fio que a borda comeu,
#         sem deixar vazar pra dentro de predio
alcanc = ndimage.binary_dilation(alcanc, ndimage.generate_binary_structure(2, 2),
                                 iterations=3, mask=piso)

# ---- 6. tampa buracos pequenos (faixa de pedestre, mancha, carro)
alcanc = ndimage.binary_closing(alcanc, np.ones((5, 5), bool))
alcanc = ndimage.binary_fill_holes(alcanc)

# ---- 6b. o que a foto nao denuncia sozinha: canteiro plantado e
#          terraco privado tem cor de piso, mas ninguem corre por cima
BLOQUEIOS = [
    (728, 444, 806, 624),    # canteiro central com arvores, trecho de cima
    (731, 786, 806, 1016),   # canteiro central com arvores, trecho de baixo
    (213, 466, 578, 618),    # bloco comercial oeste: predio + terraco de mesas
    (881, 436, 1264, 626),   # praca leste: ilha inteira, ate o meio-fio amarelo
]
for x0, y0, x1, y1 in BLOQUEIOS:
    alcanc[y0:y1, x0:x1] = False

# ---- 6c. correcao manual: img/cenas/transitavel.png marca de verde-limao
#          (181,230,29) o que a heuristica perdeu. A mao do autor vence.
import os
PINTURA = 'img/cenas/transitavel.png'
if os.path.exists(PINTURA):
    pin = np.asarray(Image.open(PINTURA).convert('RGB')).astype(int)
    limao = (np.abs(pin - np.array([181, 230, 29])).sum(2) < 60)
    novos = limao & ~alcanc
    alcanc |= limao
    print(f'pintura manual: {limao.sum()} px marcados, {novos.sum()} px novos')

# remove ilhas soltas
rot, n = ndimage.label(alcanc)
if n:
    tam = ndimage.sum(alcanc, rot, range(1, n + 1))
    alcanc = rot == (np.argmax(tam) + 1)

print(f'cobertura: {alcanc.mean()*100:.1f}% da imagem')

# ---- 7. reduz pra grade de CEL px
gh, gw = H // CEL, W // CEL
blocos = alcanc[:gh * CEL, :gw * CEL].reshape(gh, CEL, gw, CEL).mean((1, 3))
malha = (blocos > 0.5).astype(np.uint8)
print(f'grade: {gw}x{gh}  celulas livres: {malha.sum()} ({malha.mean()*100:.1f}%)')

# ---- 8. RLE, o mesmo formato que o editor le e escreve
linhas = []
for row in malha:
    runs, atual, cont = [], 0, 0
    for v in row:
        if v == atual:
            cont += 1
        else:
            runs.append(cont); atual = v; cont = 1
    runs.append(cont)
    linhas.append(','.join(map(str, runs)))
rle = ';'.join(linhas)
open('/tmp/claude-0/-home-user-Jogo-torcidas/81342551-8233-56a3-91a1-0ab4cbc92902/scratchpad/mascara.txt', 'w').write(rle)
print(f'RLE: {len(rle)} caracteres')

# ---- 8b. os marcadores da cena caem em celula valida?
MARCAS = {
    'spawn mandante1': (690, 1000), 'spawn mandante2': (28, 656),
    'spawn mandante3': (28, 262),   'spawn visitante1': (1508, 648),
    'spawn visitante2': (1508, 250),
    'entrada mand1': (291, 78),  'entrada mand3': (536, 306),
    'entrada vis2': (995, 306),  'entrada vis1': (1252, 78),
    'pm 1': (256, 366), 'pm 2': (313, 396), 'pm 3': (781, 350),
    'pm 4': (641, 630), 'pm 5': (1148, 348), 'pm 6': (1160, 405),
    'pm 7': (1322, 222), 'pm 8': (1188, 648), 'pm 9': (1191, 690),
}
def celula_ok(x, y):
    cx, cy = min(gw - 1, x // CEL), min(gh - 1, y // CEL)
    return bool(malha[cy, cx])
def perto_livre(x, y, raio=6):
    cx, cy = x // CEL, y // CEL
    for d in range(raio + 1):
        for dy in range(-d, d + 1):
            for dx in range(-d, d + 1):
                if max(abs(dx), abs(dy)) != d: continue
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < gw and 0 <= ny < gh and malha[ny, nx]:
                    return d * CEL
    return None
ruins = []
for nome, (x, y) in MARCAS.items():
    if not celula_ok(x, y):
        ruins.append((nome, x, y, perto_livre(x, y)))
if ruins:
    print('MARCADORES EM CELULA BLOQUEADA:')
    for nome, x, y, d in ruins:
        print(f'   {nome:20s} ({x},{y})  livre mais perto: {d} px')
else:
    print('todos os marcadores caem em celula caminhavel')

# ---- 9. imagem de conferencia: verde = anda, vermelho = bloqueado
vis = im.copy()
grande = np.repeat(np.repeat(malha, CEL, 0), CEL, 1).astype(bool)
gp = np.zeros((H, W), bool); gp[:grande.shape[0], :grande.shape[1]] = grande
vis[gp] = vis[gp] * 0.55 + np.array([40, 235, 90]) * 0.45
vis[~gp] = vis[~gp] * 0.75 + np.array([235, 40, 40]) * 0.25
Image.fromarray(vis.astype(np.uint8)).save(
    '/tmp/claude-0/-home-user-Jogo-torcidas/81342551-8233-56a3-91a1-0ab4cbc92902/scratchpad/conferencia.png')
print('conferencia salva')
