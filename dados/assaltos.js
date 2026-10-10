/* =========================================================
   AS LOJAS DO ASSALTO SOBRE FOTO (pedido do dono, 10/10/2026: "os
   bonecos têm que ser os nossos bonecos")

   Uma cena por alvo, do nível 1 ao 6, com a foto de
   img/cenas/assalto_<alvo>.jpg (prompts em PROMPT-ASSALTOS.md). A
   máscara de andar sai do importador (ferramentas/importar_cena_foto.py,
   receitas `assalto-<alvo>`) e se acerta no F2; aqui fica o que o motor
   do assalto (js/diajogo/assalto_motor.js) precisa e a foto não diz:

   - `M`: quantos pixels da tela dão um metro NAQUELA foto (o gerador
     não respeita escala: a loja de roupas sai a 50 px/m, o posto a 22).
     O motor anda, olha e prende em metros; o boneco cresce na mesma
     conta (a escala dele é 20 px/m);
   - `loja` e `restrita`: as zonas (o salão de cliente e o que é só de
     quem trabalha — atrás do balcão, o depósito, o cofre);
   - `vidros` e `baixos`: o que a máscara fecha pro corpo mas deixa o
     olhar passar (a fachada de vidro, o balcão, a gôndola baixa, a
     vitrine, a ilha de bomba);
   - os pontos, em pixel da tela: a van da fuga, os olheiros, por onde
     a PM chega, por onde o povo passa, a porta, os postos de quem
     trabalha (`rumo` = atan2(dx, dy): 0 olha pra baixo, pra rua), os
     SEGURANÇAS, o saque, as câmeras, os alarmes, o gravador.

   OS SEGURANÇAS (o dono, 10/10/2026: "alguns pontos mais valiosos
   sempre vão ter seguranças, como banco e joalheria"): o banco tem três
   — a porta, o salão e o corredor do cofre —, a joalheria dois — a
   porta e a passagem pros fundos —, o supermercado um na ronda. As
   lojas pequenas não têm.
   ========================================================= */
(function(){
  'use strict';
  const olha = (x, y, x2, y2) => Math.atan2(x2 - x, y2 - y);
  const P = (x, y, o) => Object.assign({x, y}, o || {});
  const R = (x0, y0, x1, y1) => ({x0, y0, x1, y1});
  const L = Math.PI / 2;

  const lojas = {
    /* NÍVEL 1 — a loja de roupas: ninguém de guarda, uma câmera */
    roupas: {
      M: 50,
      loja: [R(578, 288, 986, 672)], restrita: [R(850, 288, 986, 356)],
      vidros: [R(565, 662, 990, 692)],
      baixos: [R(850, 356, 968, 398), R(680, 432, 765, 553), R(655, 612, 828, 662)],
      porta: P(925, 672), saidaRua: P(925, 715),
      carro: P(375, 790, {rumo: -L}),
      olheiros: [P(1012, 725, {rumo: L}), P(470, 722, {rumo: -L})],
      chegadaPM: [P(15, 850), P(1520, 850), P(1160, 95)],
      rua: [P(80, 720), P(250, 720), P(450, 720), P(650, 720), P(850, 720), P(1020, 600), P(1020, 350),
            P(1280, 600), P(1400, 720)],
      fugaPovo: [P(10, 720), P(1525, 720), P(1160, 90)],
      funcionarios: [P(910, 330, {papel: 'caixa', rumo: 0}), P(800, 520, {papel: 'atendente', rumo: olha(800, 520, 720, 490)})],
      segurancas: [],
      clientes: [P(650, 600, {rumo: Math.PI}), P(790, 470, {rumo: -L}), P(640, 430, {rumo: 0}),
                 P(820, 600, {rumo: Math.PI}), P(900, 520, {rumo: Math.PI})],
      saque: [{id: 'caixa', rot: 'caixa', x: 910, y: 420, tempo: 3, peso: 1.5, dono: 'caixa'},
              {id: 'arara0', rot: 'arara', x: 720, y: 418, tempo: 2, peso: 1, calado: 0.8},
              {id: 'arara1', rot: 'arara', x: 720, y: 568, tempo: 2, peso: 1, calado: 0.8}],
      cameras: [P(955, 310, {rumo: olha(955, 310, 700, 550), alcance: 9})],
      alarmes: [P(905, 345)], gravador: null, fundos: P(700, 395)
    },

    /* NÍVEL 2 — o mercadinho: o dono atrás do balcão e o cofrinho no quartinho */
    mercadinho: {
      M: 44,
      loja: [R(505, 347, 1033, 656)], restrita: [R(548, 388, 598, 578), R(925, 345, 1033, 440)],
      vidros: [],
      baixos: [R(596, 426, 638, 610), R(510, 573, 638, 610), R(700, 488, 900, 534), R(800, 620, 984, 660)],
      porta: P(670, 660), saidaRua: P(670, 692),
      carro: P(575, 745, {rumo: -L}),
      olheiros: [P(1045, 690, {rumo: L}), P(420, 690, {rumo: -L})],
      chegadaPM: [P(15, 800), P(1520, 800), P(1150, 95)],
      rua: [P(100, 690), P(300, 690), P(500, 690), P(800, 690), P(1000, 690), P(1050, 500), P(1050, 250),
            P(1265, 690), P(1400, 690)],
      fugaPovo: [P(10, 690), P(1525, 690), P(1150, 90)],
      funcionarios: [P(572, 500, {papel: 'caixa', rumo: L})],
      segurancas: [],
      clientes: [P(800, 460, {rumo: Math.PI}), P(800, 565, {rumo: 0}), P(950, 560, {rumo: L}),
                 P(680, 600, {rumo: Math.PI}), P(660, 450, {rumo: -L})],
      saque: [{id: 'caixa', rot: 'caixa', x: 662, y: 462, tempo: 3, peso: 1.2, dono: 'caixa'},
              {id: 'cigarro', rot: 'cigarros', x: 572, y: 410, tempo: 2, peso: 0.8, dono: 'caixa'},
              {id: 'cofre', rot: 'cofrinho', x: 960, y: 410, tempo: 4, peso: 2, calado: 0.7}],
      cameras: [P(515, 355, {rumo: olha(515, 355, 800, 560), alcance: 8})],
      alarmes: [P(585, 470)], gravador: null, fundos: P(960, 410)
    },

    /* NÍVEL 3 — o posto: dois frentistas na pista, o caixa e o cofre no depósito */
    posto: {
      M: 22,
      loja: [R(600, 322, 868, 452), R(522, 322, 598, 452)], restrita: [R(818, 340, 866, 420), R(522, 322, 598, 452)],
      vidros: [R(598, 440, 873, 462)],
      baixos: [R(655, 360, 760, 380), R(655, 400, 760, 420), R(794, 346, 852, 423),
               R(662, 542, 700, 671), R(835, 542, 873, 671)],
      porta: P(768, 452), saidaRua: P(768, 500),
      carro: P(453, 795, {rumo: -L}),
      olheiros: [P(1030, 760, {rumo: L}), P(300, 760, {rumo: -L})],
      chegadaPM: [P(15, 850), P(1520, 850), P(1100, 95)],
      rua: [P(100, 758), P(300, 758), P(620, 720), P(950, 720), P(1030, 600), P(1030, 300), P(1170, 600),
            P(1300, 758), P(1450, 758)],
      fugaPovo: [P(10, 758), P(1525, 758), P(1100, 90)],
      funcionarios: [P(842, 380, {papel: 'caixa', rumo: -L}), P(680, 520, {papel: 'atendente', rumo: 0}),
                     P(855, 690, {papel: 'atendente', rumo: Math.PI})],
      segurancas: [],
      clientes: [P(700, 390, {rumo: 0}), P(640, 395, {rumo: L}), P(780, 430, {rumo: Math.PI}),
                 P(620, 600, {rumo: L}), P(920, 620, {rumo: -L})],
      saque: [{id: 'caixa', rot: 'caixa', x: 775, y: 390, tempo: 3, peso: 1.5, dono: 'caixa'},
              {id: 'cofre', rot: 'cofre', x: 560, y: 365, tempo: 6, peso: 3, calado: 0.6}],
      cameras: [P(865, 470, {rumo: olha(865, 470, 700, 600), alcance: 13}),
                P(612, 332, {rumo: olha(612, 332, 760, 400), alcance: 8})],
      alarmes: [P(842, 400)], gravador: P(540, 432), fundos: P(560, 400)
    },

    /* NÍVEL 4 — o supermercado: três caixas, um segurança na ronda, o cofre da gerência */
    supermercado: {
      M: 38,
      loja: [R(474, 198, 1066, 745)], restrita: [R(474, 198, 1066, 290)],
      vidros: [R(466, 738, 1076, 764)],
      baixos: [R(615, 658, 684, 744), R(742, 658, 812, 744), R(860, 658, 927, 744)],
      porta: P(566, 750), saidaRua: P(566, 790),
      carro: P(395, 840, {rumo: -L}),
      olheiros: [P(1110, 800, {rumo: L}), P(250, 800, {rumo: -L})],
      chegadaPM: [P(15, 880), P(1520, 880), P(1200, 95)],
      rua: [P(100, 790), P(300, 790), P(600, 790), P(900, 790), P(1090, 600), P(1090, 300), P(1310, 790),
            P(1450, 790)],
      fugaPovo: [P(10, 790), P(1525, 790), P(1200, 90)],
      funcionarios: [P(690, 700, {papel: 'caixa', rumo: -L}), P(817, 700, {papel: 'caixa', rumo: -L}),
                     P(934, 700, {papel: 'caixa', rumo: -L}), P(970, 275, {papel: 'gerente', rumo: Math.PI}),
                     P(700, 268, {papel: 'atendente', rumo: Math.PI})],
      segurancas: [P(1000, 720, {rumo: Math.PI, ronda: [P(750, 640), P(650, 330), P(900, 330)]})],
      clientes: [P(660, 450, {rumo: 0}), P(770, 500, {rumo: Math.PI}), P(880, 420, {rumo: 0}),
                 P(990, 550, {rumo: Math.PI}), P(550, 650, {rumo: L}), P(760, 630, {rumo: Math.PI}),
                 P(540, 400, {rumo: L}), P(880, 620, {rumo: 0})],
      saque: [{id: 'caixa1', rot: 'caixa', x: 668, y: 690, tempo: 3, peso: 1, dono: 'caixa'},
              {id: 'caixa2', rot: 'caixa', x: 795, y: 690, tempo: 3, peso: 1, dono: 'caixa'},
              {id: 'caixa3', rot: 'caixa', x: 912, y: 690, tempo: 3, peso: 1, dono: 'caixa'},
              {id: 'cofre', rot: 'cofreGerencia', x: 1040, y: 262, tempo: 8, peso: 4, precisa: 2, calado: 0.5}],
      cameras: [P(480, 312, {rumo: olha(480, 312, 800, 550), alcance: 14}),
                P(1060, 312, {rumo: olha(1060, 312, 760, 650), alcance: 14}),
                P(950, 205, {rumo: olha(950, 205, 700, 250), alcance: 10})],
      alarmes: [P(700, 690), P(827, 690), P(944, 690), P(975, 240)], gravador: P(1010, 270), fundos: P(700, 268)
    },

    /* NÍVEL 5 — a joalheria: dois seguranças, as vitrines barulhentas e o cofre pra dois */
    joalheria: {
      M: 38,
      loja: [R(662, 266, 880, 678)],
      restrita: [R(662, 266, 880, 382), R(662, 416, 800, 447), R(674, 498, 696, 627), R(847, 498, 866, 627)],
      vidros: [R(655, 672, 890, 696)],
      baixos: [R(696, 498, 729, 627), R(811, 498, 847, 627), R(660, 445, 822, 473),
               R(673, 650, 737, 674), R(804, 650, 870, 674)],
      porta: P(770, 678), saidaRua: P(770, 720),
      carro: P(540, 780, {rumo: -L}),
      olheiros: [P(930, 745, {rumo: L}), P(380, 745, {rumo: -L})],
      chegadaPM: [P(15, 850), P(1520, 850), P(1010, 95)],
      rua: [P(100, 720), P(300, 720), P(500, 720), P(900, 720), P(910, 550), P(910, 250), P(1100, 720),
            P(1400, 720)],
      fugaPovo: [P(10, 720), P(1525, 720), P(1010, 90)],
      funcionarios: [P(685, 560, {papel: 'atendente', rumo: L}), P(857, 560, {papel: 'atendente', rumo: -L}),
                     P(730, 432, {papel: 'caixa', rumo: 0}), P(690, 345, {papel: 'gerente', rumo: 0})],
      segurancas: [P(770, 640, {rumo: Math.PI, ronda: [P(770, 520)]}), P(845, 425, {rumo: 0})],
      clientes: [P(760, 540, {rumo: -L}), P(780, 600, {rumo: L}), P(745, 480, {rumo: Math.PI}),
                 P(800, 490, {rumo: Math.PI}), P(770, 580, {rumo: Math.PI})],
      saque: [{id: 'vE1', rot: 'vitrine', x: 745, y: 530, tempo: 2.5, peso: 2, barulho: true},
              {id: 'vE2', rot: 'vitrine', x: 745, y: 600, tempo: 2.5, peso: 2, barulho: true},
              {id: 'vD1', rot: 'vitrine', x: 795, y: 530, tempo: 2.5, peso: 2, barulho: true},
              {id: 'vD2', rot: 'vitrine', x: 795, y: 600, tempo: 2.5, peso: 2, barulho: true},
              {id: 'caixa', rot: 'caixa', x: 730, y: 485, tempo: 3, peso: 1, dono: 'caixa'},
              {id: 'cofre', rot: 'cofre', x: 720, y: 300, tempo: 10, peso: 5, precisa: 2, calado: 0.5}],
      cameras: [P(668, 668, {rumo: olha(668, 668, 770, 520), alcance: 9}),
                P(875, 410, {rumo: olha(875, 410, 760, 560), alcance: 10}),
                P(760, 272, {rumo: olha(760, 272, 700, 330), alcance: 7})],
      alarmes: [P(685, 540), P(857, 540), P(730, 430)], gravador: P(740, 300), fundos: P(830, 340)
    },

    /* NÍVEL 6 — o banco: quatro guichês, três seguranças, o cofre-forte pra três */
    banco: {
      M: 36,
      loja: [R(568, 308, 968, 728)], restrita: [R(568, 308, 968, 537)],
      vidros: [R(560, 718, 975, 746), R(566, 536, 917, 554)],
      baixos: [R(843, 653, 934, 684), R(843, 695, 934, 724), R(940, 593, 969, 684), R(622, 352, 696, 390)],
      porta: P(752, 728), saidaRua: P(752, 770),
      carro: P(625, 825, {rumo: -L}),
      olheiros: [P(1000, 770, {rumo: L}), P(450, 770, {rumo: -L})],
      chegadaPM: [P(15, 870), P(1520, 870), P(1090, 95)],
      rua: [P(100, 770), P(300, 770), P(500, 770), P(900, 770), P(1000, 600), P(1000, 300), P(1160, 770),
            P(1400, 770)],
      fugaPovo: [P(10, 770), P(1525, 770), P(1090, 90)],
      funcionarios: [P(610, 512, {papel: 'caixa', rumo: 0}), P(688, 512, {papel: 'caixa', rumo: 0}),
                     P(766, 512, {papel: 'caixa', rumo: 0}), P(843, 512, {papel: 'caixa', rumo: 0}),
                     P(660, 340, {papel: 'gerente', rumo: 0})],
      segurancas: [P(752, 690, {rumo: Math.PI, ronda: [P(752, 600), P(900, 620)]}),
                   P(900, 575, {rumo: -L}),
                   P(780, 450, {rumo: Math.PI, ronda: [P(880, 450), P(700, 450)]})],
      clientes: [P(615, 610, {rumo: -L}), P(615, 650, {rumo: -L}), P(615, 690, {rumo: -L}),
                 P(880, 640, {rumo: Math.PI}), P(895, 705, {rumo: Math.PI}), P(740, 615, {rumo: Math.PI}),
                 P(700, 615, {rumo: Math.PI}), P(660, 590, {rumo: Math.PI})],
      saque: [{id: 'guiche1', rot: 'guiche', n: 1, x: 610, y: 566, tempo: 3, peso: 1, dono: 'caixa'},
              {id: 'guiche2', rot: 'guiche', n: 2, x: 688, y: 566, tempo: 3, peso: 1, dono: 'caixa'},
              {id: 'guiche3', rot: 'guiche', n: 3, x: 766, y: 566, tempo: 3, peso: 1, dono: 'caixa'},
              {id: 'guiche4', rot: 'guiche', n: 4, x: 843, y: 566, tempo: 3, peso: 1, dono: 'caixa'},
              {id: 'cofre', rot: 'cofreForte', x: 900, y: 365, tempo: 14, peso: 9, precisa: 3, calado: 0.45}],
      cameras: [P(575, 595, {rumo: olha(575, 595, 760, 650), alcance: 12}),
                P(962, 595, {rumo: olha(962, 595, 760, 650), alcance: 12}),
                P(760, 495, {rumo: olha(760, 495, 760, 620), alcance: 9}),
                P(962, 435, {rumo: olha(962, 435, 780, 440), alcance: 12}),
                P(960, 320, {rumo: olha(960, 320, 870, 370), alcance: 8})],
      alarmes: [P(610, 525), P(766, 525), P(660, 365)], gravador: P(600, 395), fundos: P(700, 450)
    }
  };

  TO.dados = TO.dados || {};
  TO.dados.assaltos = lojas;
})();
