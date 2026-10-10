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

Foto que ainda nao chegou nao para o importador: a cena dela continua
desenhada ate o arquivo aparecer em img/cenas/.

Correcao de malha nao se faz aqui — dados/cenas_foto.js e reescrito toda
vez. Pinte no editor (F2) e cole em dados/cenas_editadas.js, que entra
depois deste e manda.

Saída (um arquivo só, como todo importador daqui):
    dados/cenas_foto.js
    img/cenas/*.webp — a foto encaixada na tela da cena
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

def foto(w, h, *r):
    """Retangulo em PIXEL DA FOTO ORIGINAL (w x h) -> fracao da tela.
    A casa de piscina tem parede reta de planta baixa: medir na foto
    (com o zoom do visualizador) e escrever o numero e mais honesto do
    que chutar fracao de tela. A conta e a mesma do `encaixar`."""
    esc = LARG / w
    topo = (ALT - round(h * esc)) // 2
    x0, y0, x1, y1 = r
    return (x0 / w, (topo + y0 * esc) / ALT, x1 / w, (topo + y1 * esc) / ALT)


CASA = lambda *r: foto(2000, 1116, *r)

# AS LOJAS DO ASSALTO (10/10/2026): medidas em pixel da TELA (1536x1024),
# ja com a foto encaixada (16:9 -> faixa de 83 px em cima e embaixo)
TL = lambda x0, y0, x1, y1: (x0 / LARG, y0 / ALT, x1 / LARG, y1 / ALT)
TS = lambda x, y: (x / LARG, y / ALT)

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
    # as tres ruas tem a mesma planta, entao a mesma semeadura serve
    {'id': 'rua-media', 'arquivo': 'Aerial_view_of_residential_street_202608131455.jpeg',
     'saida': 'rua_media.webp',
     'sementes': [(0.50, 0.50), (0.20, 0.50), (0.80, 0.50),
                  (0.02, 0.30), (0.02, 0.70), (0.98, 0.30), (0.98, 0.70)],
     'corredor': True},
    {'id': 'rua-nobre', 'arquivo': 'Aerial_view_of_residential_avenue_202608131501.jpeg',
     'saida': 'rua_nobre.webp',
     'sementes': [(0.50, 0.50), (0.20, 0.50), (0.80, 0.50),
                  (0.02, 0.30), (0.02, 0.70), (0.98, 0.30), (0.98, 0.70)],
     'corredor': True},
    # O bar e o unico com transversal no meio do quadro, entao aqui o
    # corredor geometrico atrapalha: ele so procura travessa nos 18% da
    # borda e mataria a esquina. Fica na conectividade pura, com semente
    # tambem dentro do salao — o piso do bar e chao de andar de proposito,
    # e a briga termina la dentro.
    {'id': 'bar', 'arquivo': 'Aerial_view_of_roofless_bar_202608131633.jpeg',
     'saida': 'bar.webp',
     # A foto veio com a rua principal embaixo e DUAS verticais, uma de
     # cada lado do bar — o bar ficou no meio do quadro, na quina de
     # baixo do quarteirao. Semente em cada uma delas, na calcada que
     # contorna o bar e dentro do salao: o piso do bar e chao de andar
     # de proposito, a briga termina la dentro.
     'sementes': [(0.10, 0.83), (0.50, 0.86), (0.90, 0.83),
                  (0.27, 0.10), (0.27, 0.45), (0.27, 0.80),
                  (0.74, 0.10), (0.74, 0.45), (0.74, 0.80),
                  (0.51, 0.71),
                  (0.50, 0.50), (0.44, 0.40), (0.58, 0.58)],
     # a laje do vizinho e cinza igual asfalto e encosta na rua pela
     # esquina: sem recorte a conectividade sobe no telhado do
     # quarteirao inteiro (medido: 9 linhas abrindo de ponta a ponta)
     'recorte': [(0.00, 0.66, 1.00, 1.00),    # a rua principal e a calcada
                 (0.16, 0.00, 0.37, 0.72),    # a vertical oeste
                 (0.62, 0.00, 0.91, 0.72),    # a vertical leste
                 (0.35, 0.28, 0.64, 0.72)]},  # o bar e a calcada dele

    # ---- as SEDES (pedido do dono, 10/09/2026): cena de DENTRO ------
    # Aqui a construcao nao sai por cor: a sede nao tem telhado, entao o
    # topo do muro e o mesmo concreto cinza do patio. Sem `crista` a
    # parede virava chao (medido: 73% do quadro). O recorte segura a rua
    # inteira — e dela que o atacante spawna e caminha ate o portao — e o
    # quarteirao da sede, deixando quintal de vizinho de fora.
    {'id': 'sede-1', 'arquivo': 'sede_nivel_1.png', 'saida': 'sede_1.webp',
     'crista': 8,
     # so a rua: as salas tem de acender pela porta, e nao pela semente.
     # Se alguma nao acender, a porta nao existe na foto.
     'sementes': [(0.477, 0.80), (0.10, 0.80), (0.90, 0.80)],
     'recorte': [(0.00, 0.545, 1.00, 0.930),    # a rua e os dois passeios
                 (0.255, 0.085, 0.750, 0.575)]},# o quarteirao da sede

    # ---- AS OUTRAS SEDES (fotos do dono, 22/09/2026): 2576x1438 do
    #      Flow, a rua no quarto de baixo, o quarteirao sem telhado no
    #      meio. Mesma receita da sede 1: crista tira o topo do muro, o
    #      recorte segura a rua e o quarteirao, e as salas acendem pela
    #      porta a partir da semente da rua. A semente extra e a calcada
    #      na frente do portao, que na foto e um passeio claro e as
    #      vezes nao encosta na pista por cor. O fino e do F2 (dono).
    #      O nivel 6 usa a foto do 5 (decisao do dono, 10/09/2026).
    {'id': 'sede-2', 'arquivo': 'sede_nivel_2.jpg', 'saida': 'sede_2.webp',
     'crista': 8,
     'sementes': [(0.50, 0.85), (0.10, 0.85), (0.90, 0.85), (0.498, 0.72)],
     'recorte': [(0.00, 0.69, 1.00, 0.93),      # a rua e os dois passeios
                 (0.34, 0.25, 0.66, 0.70)]},    # o quarteirao da sede
    {'id': 'sede-3', 'arquivo': 'sede_nivel_3.jpg', 'saida': 'sede_3.webp',
     'crista': 8,
     'sementes': [(0.50, 0.85), (0.10, 0.85), (0.90, 0.85), (0.477, 0.72)],
     'recorte': [(0.00, 0.69, 1.00, 0.93),
                 (0.33, 0.20, 0.68, 0.745)]},
    {'id': 'sede-4', 'arquivo': 'sede_nivel_4.jpg', 'saida': 'sede_4.webp',
     'crista': 8,
     'sementes': [(0.50, 0.85), (0.10, 0.85), (0.90, 0.85),
                  (0.40, 0.72), (0.60, 0.72), (0.70, 0.72)],   # portao, garagem, loja
     'recorte': [(0.00, 0.69, 1.00, 0.93),
                 (0.26, 0.23, 0.75, 0.70)]},
    {'id': 'sede-5', 'arquivo': 'sede_nivel_5.jpg', 'saida': 'sede_5.webp',
     'crista': 8,
     'sementes': [(0.50, 0.85), (0.10, 0.85), (0.90, 0.85),
                  (0.38, 0.72), (0.66, 0.72), (0.75, 0.72)],   # portao, loja, garagem
     'recorte': [(0.00, 0.69, 1.00, 0.93),
                 (0.19, 0.225, 0.815, 0.695)]},

    # ---- lote de 19/08 (pedido do dono): tretas, emboscadas, CT e
    #      os tres estadios por capacidade -------------------------------
    # 5x5: a viela entre os quintais — corredor apertado de ponta a ponta
    {'id': 'treta-beco', 'arquivo': 'treta_beco.jpeg',
     'saida': 'treta_beco.webp', 'corredor': True,
     'sementes': [(0.50, 0.50), (0.15, 0.50), (0.85, 0.50),
                  (0.35, 0.47), (0.65, 0.53)],
     # sem o recorte, a folga de calcada do corredor subia nos
     # terracos dos dois cantos de cima
     'recorte': [(0.00, 0.30, 1.00, 0.66)]},
    # 7x7: o patio do galpao — placa de concreto murada, rua na borda
    {'id': 'treta-galpao', 'arquivo': 'treta_galpao.jpeg',
     'saida': 'treta_galpao.webp',
     'sementes': [(0.45, 0.45), (0.60, 0.55), (0.30, 0.60), (0.55, 0.28),
                  (0.35, 0.32), (0.70, 0.65), (0.25, 0.72)],
     # so o patio: sem o recorte a conectividade escorre pro telhado do
     # galpao e pras ruas em volta, e a treta e murada de proposito
     'recorte': [(0.08, 0.16, 0.88, 0.82)]},
    # 10x10: o campo de terra murado — a arena inteira e o chao
    {'id': 'treta-campo', 'arquivo': 'treta_campo.jpeg',
     'saida': 'treta_campo.webp', 'terra': True,
     'sementes': [(0.50, 0.50), (0.35, 0.35), (0.65, 0.65), (0.30, 0.65),
                  (0.70, 0.35), (0.50, 0.25), (0.50, 0.75)],
     'recorte': [(0.16, 0.20, 0.86, 0.80)]},
    # emboscada 1: o patio do posto de gasolina, com a pista embaixo
    {'id': 'emb-posto', 'arquivo': 'emb_posto.jpeg',
     'saida': 'emb_posto.webp',
     'sementes': [(0.50, 0.50), (0.25, 0.42), (0.75, 0.42), (0.15, 0.70),
                  (0.85, 0.68), (0.50, 0.70), (0.50, 0.92), (0.20, 0.92),
                  (0.80, 0.92)]},
    # emboscada 2: a estrada com o onibus parado no meio da pista
    {'id': 'emb-onibus', 'arquivo': 'emb_onibus.jpeg',
     'saida': 'emb_onibus.webp', 'corredor': True, 'terra': True,
     'sementes': [(0.50, 0.48), (0.10, 0.52), (0.90, 0.45),
                  (0.30, 0.55), (0.70, 0.50)]},
    # frente do CT: a esplanada do portao e a rua embaixo
    {'id': 'ct', 'arquivo': 'ct_frente.jpeg',
     'saida': 'ct_frente.webp',
     'sementes': [(0.50, 0.50), (0.25, 0.50), (0.75, 0.50), (0.50, 0.35),
                  (0.15, 0.62), (0.85, 0.60), (0.20, 0.85), (0.80, 0.85),
                  (0.50, 0.80)]},
    # os tres estadios: anda-se no anel de rua e estacionamento em volta
    # da arquibancada — o miolo (bancada e gramado) fica de fora pelo
    # recorte, e os portoes moram na beira do anel
    # o estadio pequeno nao tem anel externo continuo (casa encostada
    # na borda da foto): o chao e a PROPRIA arquibancada, mais o
    # terreirao da esquerda e a rua da direita — o gramado (mato) fica
    # de fora sozinho
    {'id': 'estadio-10', 'arquivo': 'estadio_10.jpeg',
     'saida': 'estadio_10.webp', 'terra': True, 'claro': True,
     'sementes': [(0.05, 0.30), (0.05, 0.70), (0.95, 0.30), (0.95, 0.70),
                  (0.09, 0.36),
                  (0.50, 0.88), (0.50, 0.10), (0.17, 0.50), (0.83, 0.50),
                  (0.25, 0.15), (0.75, 0.15), (0.25, 0.85), (0.75, 0.85)],
     'excluir': [(0.155, 0.155, 0.855, 0.845)]},
    # a briga e NA ARQUIBANCADA (setores do dono, 19/08/2026): o chao
    # e a propria bancada; o gramado (mato) e o fosso ficam de fora
    {'id': 'estadio-20', 'arquivo': 'estadio_20.jpeg',
     'saida': 'estadio_20.webp', 'terra': True, 'claro': True,
     'sementes': [(0.50, 0.12), (0.50, 0.88), (0.13, 0.50), (0.87, 0.50),
                  (0.25, 0.20), (0.75, 0.20), (0.25, 0.80), (0.75, 0.80),
                  (0.18, 0.35), (0.82, 0.35), (0.18, 0.65), (0.82, 0.65)],
     'recorte': [(0.05, 0.04, 0.95, 0.96)],
     'excluir': [(0.245, 0.215, 0.755, 0.795)]},
    {'id': 'estadio-40', 'arquivo': 'estadio_40.jpeg',
     'saida': 'estadio_40.webp', 'terra': True, 'claro': True,
     'sementes': [(0.50, 0.10), (0.50, 0.90), (0.09, 0.50), (0.91, 0.50),
                  (0.30, 0.15), (0.70, 0.15), (0.30, 0.85), (0.70, 0.85),
                  (0.15, 0.30), (0.85, 0.30), (0.15, 0.70), (0.85, 0.70)],
     'recorte': [(0.02, 0.02, 0.98, 0.98)],
     'excluir': [(0.275, 0.235, 0.725, 0.775)]},

    # ---- CASA DE PISCINA (pedido do dono, 21/09/2026): a resenha da
    #      zona numa casa de praia. Foto zenital 2000x1116 (Google Flow):
    #      a rua de areia embaixo, o lote murado no meio — garagem e casa
    #      na esquerda, quintal de areia com dois carros, deck com
    #      piscina na direita, portao na quina de baixo/direita.
    #      AQUI A PAREDE NAO SAI POR COR NEM POR CRISTA: o topo do muro e
    #      o piso sao o mesmo creme, e a `crista` (que serve na sede)
    #      apagava o deck inteiro ao lado da piscina escura (medido: deck
    #      22% de chao, quartos fechados). A planta e reta, entao as
    #      paredes sao ditas na mao, em pixel da foto, com `excluir`; os
    #      vaos de porta que a sombra fecharia sao abertos com `abrir`.
    #      A garagem fica fechada (na foto ela nao tem vao pra rua nem
    #      pro quintal) e os dois carros sao obstaculo.
    {'id': 'casa-piscina', 'arquivo': 'casa_piscina.jpg',
     'saida': 'casa_piscina.webp', 'terra': True, 'claro': True,
     'sementes': [(0.50, 0.756), (0.15, 0.719), (0.85, 0.719),  # a rua
                  (0.625, 0.651),                                # o portao
                  (0.60, 0.531), (0.45, 0.501), (0.725, 0.531),  # o quintal
                  (0.725, 0.306), (0.56, 0.418), (0.56, 0.231),  # o deck
                  (0.475, 0.395), (0.425, 0.246),                # sala, hall
                  (0.35, 0.253), (0.50, 0.253),                  # quartos
                  (0.34, 0.418), (0.33, 0.332)],                 # deposito, banheiro
     # a rua inteira e o lote; as casas da frente e os vizinhos ficam fora
     'recorte': [CASA(0, 740, 2000, 990), CASA(505, 55, 1505, 750)],
     'excluir': [
         CASA(590, 526, 835, 750),                       # a garagem, fechada
         CASA(890, 578, 1160, 712), CASA(1258, 528, 1432, 718),   # os carros
         # as quatro paredes de fora da casa
         CASA(590, 128, 1090, 140), CASA(586, 128, 600, 530),
         CASA(1076, 128, 1092, 530), CASA(590, 524, 1090, 550),
         # quarto 1 | hall | quarto 2 (as portas dos quartos dao no hall)
         CASA(786, 130, 806, 262), CASA(910, 130, 928, 262),
         CASA(590, 292, 788, 306), CASA(910, 296, 1090, 308),
         # banheiro e vestibulo; a porta do deposito e no vestibulo
         CASA(590, 366, 754, 378), CASA(790, 366, 830, 378),
         CASA(728, 340, 742, 372),
         CASA(820, 366, 834, 526),                       # deposito | sala
         CASA(754, 436, 800, 448), CASA(752, 436, 764, 526),  # o quartinho
         CASA(662, 166, 742, 250), CASA(990, 170, 1070, 258),  # as camas
         CASA(610, 382, 654, 418), CASA(618, 410, 646, 526),   # tralha do deposito
         CASA(726, 498, 758, 526),
         CASA(1150, 136, 1500, 150)],                    # o muro do deck (da faixa)
     'abrir': [
         CASA(605, 64, 1495, 126),        # a passagem atras da casa
         CASA(818, 124, 890, 176),        # a porta dos fundos do hall
         CASA(1092, 118, 1150, 165),      # a boca da passagem no deck
         CASA(836, 520, 900, 560)]},      # a porta da frente
    # ---------- AS LOJAS DO ASSALTO (10/10/2026, uma por nivel) ----------
    # o chao: a rua, a calcada, a rua de lado e o miolo da loja; as paredes
    # de dentro e os moveis sao excluidos na mao, as portas abertas na mao
    {'id': 'assalto-roupas', 'arquivo': 'assalto_roupas.jpg', 'saida': 'assalto_roupas.webp',
     'claro': True,
     'sementes': [TS(500, 720), TS(780, 500), TS(1150, 500), TS(1150, 850), TS(100, 850), TS(690, 330)],
     'recorte': [TL(0, 690, 1536, 940), TL(990, 83, 1300, 750), TL(582, 292, 982, 668)],
     'excluir': [TL(850, 356, 968, 398), TL(680, 432, 765, 553), TL(578, 366, 622, 664),
                 TL(655, 612, 828, 662), TL(646, 288, 660, 378), TL(717, 288, 729, 378),
                 TL(578, 350, 646, 362), TL(936, 298, 964, 324), TL(282, 752, 468, 822)],
     'abrir': [TL(880, 660, 975, 700), TL(0, 692, 1000, 746)]},
    {'id': 'assalto-mercadinho', 'arquivo': 'assalto_mercadinho.jpg', 'saida': 'assalto_mercadinho.webp',
     'claro': True,
     'sementes': [TS(300, 800), TS(800, 450), TS(680, 600), TS(575, 500), TS(960, 400), TS(1150, 400)],
     'recorte': [TL(0, 668, 1536, 905), TL(1040, 83, 1270, 700), TL(507, 349, 1030, 654)],
     'excluir': [TL(550, 350, 918, 390), TL(508, 373, 552, 572), TL(596, 426, 638, 610),
                 TL(510, 573, 638, 610), TL(700, 488, 900, 534), TL(980, 466, 1030, 656),
                 TL(800, 620, 984, 660), TL(922, 345, 941, 442), TL(922, 427, 1035, 441),
                 TL(976, 358, 1017, 402), TL(498, 713, 652, 777)],
     'abrir': [TL(642, 648, 700, 690), TL(945, 424, 976, 446), TL(1022, 440, 1052, 468)]},
    {'id': 'assalto-posto', 'arquivo': 'assalto_posto.jpg', 'saida': 'assalto_posto.webp',
     'claro': True,
     'sementes': [TS(300, 850), TS(760, 600), TS(700, 390), TS(560, 400), TS(700, 300),
                  TS(940, 350), TS(1100, 400)],
     'recorte': [TL(0, 742, 1536, 940), TL(1012, 83, 1160, 742), TL(528, 282, 1006, 742)],
     'excluir': [TL(575, 316, 872, 330), TL(594, 316, 606, 454), TL(861, 316, 873, 454),
                 TL(594, 444, 873, 460), TL(520, 444, 600, 460),
                 TL(655, 360, 760, 380), TL(655, 400, 760, 420), TL(616, 320, 762, 338),
                 TL(598, 343, 617, 442), TL(794, 346, 819, 422), TL(794, 402, 852, 423),
                 TL(662, 542, 700, 671), TL(835, 542, 873, 671),
                 TL(590, 530, 608, 548), TL(930, 530, 948, 548), TL(590, 664, 608, 682), TL(930, 664, 948, 682),
                 TL(972, 698, 1008, 738), TL(528, 322, 552, 348), TL(398, 772, 508, 818)],
     # a pista tem mancha de oleo escura: o chao dela e dito na mao, em
     # faixas que desviam das ilhas de bomba
     'abrir': [TL(745, 438, 792, 468), TL(588, 326, 612, 346), TL(1000, 460, 1022, 740),
               TL(530, 462, 660, 740), TL(702, 462, 833, 740), TL(875, 462, 1003, 695),
               TL(875, 695, 968, 740), TL(660, 462, 702, 540), TL(660, 673, 702, 740),
               TL(833, 462, 875, 540), TL(833, 673, 875, 740), TL(530, 350, 592, 440),
               TL(0, 742, 1012, 772)]},
    {'id': 'assalto-supermercado', 'arquivo': 'assalto_supermercado.jpg', 'saida': 'assalto_supermercado.webp',
     'claro': True,
     'sementes': [TS(300, 900), TS(750, 640), TS(650, 330), TS(700, 270), TS(990, 270), TS(1200, 500)],
     'recorte': [TL(0, 760, 1536, 940), TL(1072, 83, 1310, 800), TL(474, 198, 1066, 745)],
     'excluir': [TL(478, 203, 937, 248), TL(478, 203, 512, 296), TL(902, 248, 937, 292),
                 TL(935, 195, 948, 292), TL(943, 228, 997, 260), TL(1020, 208, 1064, 252),
                 TL(1028, 270, 1062, 294), TL(470, 288, 1070, 304),
                 TL(472, 310, 520, 748), TL(578, 368, 632, 607), TL(693, 368, 744, 607),
                 TL(808, 368, 858, 607), TL(918, 368, 974, 607), TL(1022, 383, 1070, 748),
                 TL(615, 658, 650, 744), TL(653, 658, 684, 720), TL(742, 658, 777, 744),
                 TL(780, 658, 812, 720), TL(860, 658, 894, 744), TL(896, 658, 927, 720),
                 TL(320, 813, 472, 870)],
     'abrir': [TL(545, 284, 612, 308), TL(898, 284, 934, 308), TL(985, 284, 1030, 308),
               TL(530, 738, 602, 772), TL(938, 738, 1012, 772), TL(1058, 212, 1088, 262),
               TL(0, 762, 1100, 812)]},
    {'id': 'assalto-banco', 'arquivo': 'assalto_banco.jpg', 'saida': 'assalto_banco.webp',
     'claro': True,
     'sementes': [TS(300, 880), TS(750, 640), TS(700, 510), TS(700, 450), TS(680, 330),
                  TS(775, 350), TS(920, 360), TS(1080, 400)],
     'recorte': [TL(0, 738, 1536, 940), TL(975, 83, 1150, 800), TL(569, 310, 966, 726)],
     'excluir': [TL(744, 305, 753, 416), TL(799, 305, 809, 416), TL(563, 408, 716, 426),
                 TL(803, 408, 972, 426), TL(563, 476, 926, 490), TL(908, 478, 921, 553),
                 TL(566, 536, 917, 554), TL(564, 583, 601, 704), TL(843, 653, 934, 684),
                 TL(843, 695, 934, 724), TL(940, 593, 969, 684), TL(622, 352, 696, 390),
                 TL(566, 320, 594, 407), TL(808, 334, 879, 399), TL(560, 798, 690, 848)],
     # a sala do cofre abre pro corredor por baixo, do lado direito do cofre
     'abrir': [TL(705, 718, 800, 746), TL(738, 366, 760, 402), TL(896, 402, 944, 432),
               TL(924, 470, 963, 562), TL(904, 495, 926, 530)]},
    {'id': 'assalto-joalheria', 'arquivo': 'assalto_joalheria.jpg', 'saida': 'assalto_joalheria.webp',
     'claro': True,
     'sementes': [TS(300, 850), TS(770, 560), TS(730, 430), TS(720, 320), TS(830, 340), TS(980, 400)],
     'recorte': [TL(0, 690, 1536, 935), TL(885, 83, 1085, 750), TL(662, 266, 880, 678)],
     'excluir': [TL(653, 382, 888, 399), TL(761, 262, 773, 386), TL(660, 398, 800, 417),
                 TL(660, 445, 822, 473), TL(800, 420, 822, 473), TL(696, 498, 729, 627),
                 TL(811, 498, 847, 627), TL(655, 498, 674, 627), TL(866, 498, 885, 627),
                 TL(673, 650, 737, 674), TL(804, 650, 870, 674), TL(656, 270, 702, 322),
                 TL(660, 356, 724, 386), TL(808, 272, 886, 322), TL(464, 758, 616, 812)],
     'abrir': [TL(733, 670, 806, 698), TL(835, 378, 876, 404), TL(756, 330, 778, 360),
               TL(872, 324, 898, 352)]},

]


# ------------------------------------------------------------------ encaixe
def encaixar(img):
    """Largura inteira, sem distorcer. O que falta de altura vira quintal.
    Foto mais ALTA que a tela (as 4:3 do lote de 19/08) é cortada
    centrada — colar com topo negativo zerava a máscara inteira."""
    esc = LARG / img.width
    novo = img.resize((LARG, round(img.height * esc)), Image.LANCZOS)
    tela = Image.new('RGB', (LARG, ALT), QUINTAL)
    topo = (ALT - novo.height) // 2
    if topo < 0:
        novo = novo.crop((0, -topo, LARG, -topo + ALT))
        topo = 0
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
# --------------------------------------------------------- recorte
def recortar(forma, retangulos):
    """Fora destes retangulos nao ha chao, ponto.

    Irmao declarado do corredor(): quando a planta nao e uma pista
    atravessando a tela, o prior geometrico tem de ser dito na mao. No
    bar, laje de vizinho e cinza igual asfalto E encosta na rua pela
    esquina, entao a conectividade sozinha sobe no telhado de todo o
    quarteirao. Os retangulos vao em fracao da tela: (x0, y0, x1, y1)."""
    fica = np.zeros(forma, bool)
    for x0, y0, x1, y1 in retangulos:
        fica[int(y0 * ALT):int(y1 * ALT), int(x0 * LARG):int(x1 * LARG)] = True
    return fica


def chao(a, sementes, topo, altura, usarCorredor=False, recorte=None,
         terra=False, claro=False, engorda=0, excluir=None, crista=0,
         abrir=None):
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
    if terra:
        # campo de terra e estrada de barro: marrom claro, pouco saturado
        # demais pra ser telha e sem verde de mato
        chao_terra = (sat < 78) & (R >= G) & (G >= B) & ~mato & \
                     (lum > 78) & (lum < 225)
        cand |= chao_terra
    if claro:
        # passeio de concreto branco estourado de sol (o anel do estadio
        # pequeno): mais claro que o teto normal de 232
        cand |= cinza & (lum >= 232) & (lum < 253)

    # PAREDE DE SEDE É CRISTA DE BRILHO (cenas de dentro, 10/09/2026).
    # Nas cenas de fora a construção some por cor: telha é laranja, mato é
    # verde. Dentro de uma sede sem telhado não há telha nenhuma — o topo
    # do muro é o MESMO concreto cinza do pátio, e cor não separa os dois
    # (medido: 73% do quadro virava chão, muro incluído). O que separa é a
    # forma: o topo da parede é uma faixa mais clara que a vizinhança dela,
    # e o piso é chapado. Tira-se o que está `crista` acima da mediana de
    # janela larga, ANTES da morfologia, senão a textura do piso vira
    # cisco e o vão da porta fecha.
    if crista:
        cand &= (lum - nd.uniform_filter(lum.astype(np.float32), 61)) <= crista

    # a faixa de quintal, em cima e embaixo, nunca é chão
    cand[:topo, :] = False
    cand[topo + altura:, :] = False

    if usarCorredor:
        asf = cinza & (lum > 45) & (lum < 130)
        asf[:topo, :] = False; asf[topo + altura:, :] = False
        cand &= corredor(asf)
    if recorte:
        cand &= recortar(cand.shape, recorte)
    if excluir:
        # o inverso do recorte: DENTRO destes retangulos nao ha chao.
        # E o gramado dos estadios — a briga e na arquibancada, e sem
        # isto o campo de terra batida do estadio pequeno vira palco.
        cand &= ~recortar(cand.shape, excluir)
    if abrir:
        # o VAO DE PORTA dito na mao: chao por decreto, por cima de cor e
        # de `excluir` — e a passagem atras da casa de piscina, que a
        # foto mostra na sombra e a cor nao pega
        cand |= recortar(cand.shape, abrir)

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
    if engorda:
        # anel estreito demais pro corpo passar (malha do corpo erode a
        # mascara): engorda o chao uns pixels pra rota existir
        m = nd.binary_dilation(m, np.ones((engorda, engorda)))

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
        origem = CENAS / f['arquivo']
        if not origem.exists():
            # foto que ainda nao chegou: a cena continua desenhada
            print(f'{f["id"]:>9}: sem {f["arquivo"]} — segue no desenho')
            continue
        img = Image.open(origem).convert('RGB')
        tela, topo, altura = encaixar(img)
        destino = CENAS / f['saida']
        tela.save(destino, 'WEBP', quality=82, method=6)

        a = np.asarray(tela).astype(np.int16)
        m = chao(a, f['sementes'], topo, altura,
                 f.get('corredor', False), f.get('recorte'),
                 f.get('terra', False), f.get('claro', False),
                 f.get('engorda', 0), f.get('excluir'), f.get('crista', 0),
                 f.get('abrir'))
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
          '   GERADO por ferramentas/importar_cena_foto.py — nao editar a mao.\n'
          '   Correção fica em dados/cenas_editadas.js, que entra depois deste\n'
          '   e manda: o editor (F2) exporta a entrada pronta pra colar la. */\n'
          'TO.dados = TO.dados || {};\n'
          'TO.dados.cenasFoto = ' + json.dumps(fora, ensure_ascii=False) + ';\n')
    alvo = RAIZ / 'dados' / 'cenas_foto.js'
    alvo.write_text(js, encoding='utf-8')
    print(f'\n{alvo.relative_to(RAIZ)} — {len(js)//1024} KB')


if __name__ == '__main__':
    main()
