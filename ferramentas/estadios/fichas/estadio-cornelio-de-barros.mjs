/* CORNÉLIO DE BARROS (Estádio Municipal Cornélio de Barros Muniz e Sá, Salgueiro
   e Ypiranga/PE, Salgueiro) — pelas três fotos aéreas que o dono mandou
   (17/11/2026: "vamos pro Cornélio de Barros"; uma de dia, vazio, e duas de
   noite, uma delas com o estádio cheio) e pelo satélite (o do Google). O rumo do
   campo, 147,5 graus, e o meio do campo saíram do satélite: o contorno do
   OpenStreetMap pega o terreno inteiro e fica 9 m fora do meio do gramado.
   No quadro a arquibancada grande fica EM CIMA e a de trás do gol à DIREITA.
   Arquibancadas em L, de degrau pintado de azul-claro com as escadas creme:
   · EM CIMA, a LATERAL, de 114 m, em DUAS METADES com um degrau no meio: a do
     lado da praça, funda (24 m) e alta, com a caixa branca da boca junto do
     degrau; a outra, mais rasa (19 m) e afunilando pra ponta (16 m), porque o
     fundo acompanha a divisa das casas;
   · À DIREITA, atrás do gol, a outra, de 81 m, de degrau claro, que também
     afunila (18 m no canto da lateral, 15 na ponta do lado da torre), com a
     escada larga branca que separa o lance da ponta, em cima da galeria de
     pilares de tijolo que dá pra rua;
   · EMBAIXO, a outra lateral: a arquibancada BAIXA, de seis degraus de cimento,
     dos dois lados da TORRE das cabines (três andares, branca de faixas azuis,
     de telhadinho), o muro branco por trás e os dois bancos de reserva de
     cobertura azul na frente;
   · À ESQUERDA, atrás do outro gol, só o muro baixo azul-claro e branco, com a
     praça por trás.
   ESTIMADO: as alturas; a cor do degrau da de trás do gol (no satélite é cinza
   claro; de noite parece branca); a galeria de tijolo, que na foto de dia
   aparece de lado; as torres de luz. Na foto do estádio cheio o lance da ponta
   da de trás do gol tem uma faixa de degraus pintada de amarelo, que o satélite
   não mostra: ficou no degrau claro.
   AS TORCIDAS (escolha minha): a da casa no meio da lateral grande, com o apoio
   na mesma lateral e na arquibancada baixa do lado da torre (pra os três
   portões não ficarem colados no mesmo lado); a visitante atrás do gol. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AZUL = '#a9b9cf', AZUL2 = '#9cadc4', CLARO = '#cdd2d8', CLARO2 = '#c0c6cd', CREME = '#e6dca6', BRANCO = '#eeeeea', CELESTE = '#8fb4dc', TIJOLO = '#b0705a';
/* a beira de dentro (o fim da grama) e os fundos */
const I = { a: 56.5, b: 41.5, r: 0.5 };
const LAT = b => ({ a: 56.5, b, r: 0.5 }), FUN = a => ({ a, b: 41.5, r: 0.5 });
/* um contorno qualquer, dado pelos pontos: vira a lista de raios vistos do meio do campo */
const POLI = (pts, a, b) => ({ forma: 'raios', a, b, raios: Array.from({ length: 720 }, (_, i) => { const t = i * 0.5 * RAD, dx = Math.cos(t), dy = Math.sin(t); let r = 0;
  for (let k = 0; k < pts.length; k++) { const [x1, y1] = pts[k], [x2, y2] = pts[(k + 1) % pts.length], ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
    const q = (x1 * ey - y1 * ex) / den, w = (x1 * dy - y1 * dx) / den; if (q > 0 && w >= 0 && w <= 1) r = Math.max(r, q); }
  return r; }) });
/* AS DUAS ARQUIBANCADAS GRANDES MUDAM DE FUNDURA AO LONGO DO COMPRIMENTO (dono, 17/11/2026: "a arquibancada lateral maior varia
   de tamanho ao longo do comprimento dela e a arquibancada atrás do gol também"). Medido no satélite e conferido nas fotos:
   · a LATERAL tem um degrau no meio (em u = 1,7): a metade do lado da praça tem o fundo em v = 65,9 (24 m); a outra metade é
     mais rasa e ainda afunila, do fundo em v = 60,2 junto do degrau até 57,2 na ponta (19 m caindo pra 16);
   · a de TRÁS DO GOL afunila: o fundo em u = 74,9 no canto da lateral e em 71,1 na ponta do lado da torre (18 m caindo pra 15).
   A altura acompanha a fundura (`inclinacao`): onde é mais funda é mais alta. */
const DEG = 1.7, F_ESQ = 65.9;
const F_DIR = POLI([[80, 55.95], [-20, 61.38], [-20, -90], [80, -90]], 80, 62), F_GOL = POLI([[75.58, 60], [70.19, -60], [-90, -60], [-90, 60]], 76, 60);
const fundoGol = v => 73.0 + 0.04486 * (v - 2.55);
const DEGRAU = { padrao: 'mosaico', mistura: 0.25, semCadeiras: true, espelhoPintado: true, corEscada: CREME, vomitorios: false, paredeAtras: true, corFachada: BRANCO, corLado: BRANCO, parapeito: 1.4 };
const MURO = (pts, h, c) => pts.slice(1).map((b, i) => { const a = pts[i], du = b[0] - a[0], dv = b[1] - a[1];
  return { u: (a[0] + b[0]) / 2, v: (a[1] + b[1]) / 2, w: Math.hypot(du, dv) + 0.4, d: 0.4, h, cor: c, giro: Math.atan2(dv, du) / RAD }; });

export default {
  id: 'estadio-cornelio-de-barros', nome: 'Cornélio de Barros', clubes: ['salgueiro', 'ypiranga-pe'], norte: 147.5, vazado: 0.3, folga: 22,
  chao: { cor: '#9a968c' },
  campo: { corMargem: '#6f9a55' },
  corMureta: BRANCO, corAlambrado: '#d9dcdf',
  aneis: [
    /* a grama em volta do campo */
    { dentro: { a: 54, b: 35.5, r: 0.5 }, fora: I, reto: true, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#6f9a55' }] },
    { dentro: I, fora: LAT(F_ESQ), reto: true, h: [1.6, 12.8], inclinacao: 0.46, fileiras: 26, corredorFrente: 1.6,
      trechos: [
        /* À DIREITA, atrás do gol: degrau claro, afunilando, em cima da galeria de tijolo; as escadas brancas onde o satélite
           mostra (v = 30,2, 3,1 e a LARGA em -16,6, que separa o lance da ponta) */
        ...[[-39.8, -18.2, 0], [-18.2, -15, 2], [-15, 3.1, 0], [3.1, 30.2, 1], [30.2, 41, 1]].map(([v0, v1, k]) => ({ de: A(56.5, v0) - (v0 < 0 ? 360 : 0), ate: A(56.5, v1) - (v1 < 0 ? 360 : 0),
          fora: F_GOL, normal: true, ...DEGRAU, cor: k === 2 ? BRANCO : CLARO, cor2: k === 2 ? '#e2e2dd' : CLARO2, corredor: 0, escadaNaBorda: k === 1, corEscada: BRANCO, corFachada: TIJOLO })),
        { de: A(56.5, 41), ate: A(56, 41.5), tipo: 'vazio' },
        /* EM CIMA, a LATERAL, do lado da de trás do gol: mais rasa, afunilando pra ponta; escadas creme em u = 41,6 e 18,4 */
        ...[[56, 41.6, false], [41.6, 18.4, true], [18.4, DEG, true]].map(([u0, u1, esc]) => ({ de: A(u0, 41.5), ate: A(u1, 41.5), fora: F_DIR, normal: true, ...DEGRAU,
          cor: AZUL, cor2: AZUL2, corredor: 0, escadaNaBorda: esc })),
        /* e do lado da praça: a metade funda, com a caixa branca da boca junto do degrau e as escadas em u = -21,5 e -39,7 */
        { de: A(DEG, 41.5), ate: A(-21.5, 41.5), ...DEGRAU, cor: AZUL, cor2: AZUL2, corredor: 0, vomitorios: { em: [0.1], f: 0.1, larg: 4, fundo: 4.4, cor: '#3a4a60', corParapeito: BRANCO } },
        { de: A(-21.5, 41.5), ate: A(-39.7, 41.5), ...DEGRAU, cor: AZUL, cor2: AZUL2, corredor: 0, escadaNaBorda: true },
        { de: A(-39.7, 41.5), ate: A(-56.5, 41.5), ...DEGRAU, cor: AZUL, cor2: AZUL2, corredor: 0, escadaNaBorda: true },
        { de: A(-56.5, 41.5), ate: A(-56, -41.5), tipo: 'vazio' },
        /* EMBAIXO, a lateral da torre: a arquibancada baixa, de seis degraus de cimento, dos dois lados do prédio das cabines
           (dono, 17/11/2026, com mais uma foto: "A outra lateral também tem uma arquibancada") */
        { de: A(-56, -41.5), ate: A(-6.6, -41.5), fora: LAT(47), h: [0.8, 3.2], inclinacao: null, fileiras: 6, ...DEGRAU, cor: '#aaa9a3', cor2: '#9e9d97', corredor: 0, corEscada: BRANCO, parapeito: 1 },
        { de: A(-6.6, -41.5), ate: A(0.6, -41.5), tipo: 'vazio' },
        { de: A(0.6, -41.5), ate: A(56, -41.5), fora: LAT(47), h: [0.8, 3.2], inclinacao: null, fileiras: 6, ...DEGRAU, cor: '#aaa9a3', cor2: '#9e9d97', corredor: 0, corEscada: BRANCO, parapeito: 1 },
        { de: A(56, -41.5), ate: A(56.5, -40), tipo: 'vazio' }
      ] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[-30, 66, 26], [28, 66, 26], [-28, -49, 24], [22, -49, 24]],
  blocos: [
    /* EMBAIXO: o muro branco de barra azul, a torre das cabines e os bancos de reserva */
    ...MURO([[-59.5, -47.6], [57, -47.6]], 4.4, BRANCO), ...MURO([[-59.5, -47.85], [57, -47.85]], 1.1, CELESTE),
    { u: -3, v: -44.6, w: 6.2, d: 6.2, h: 11, cor: BRANCO },
    { u: -3, v: -41.45, w: 5.4, d: 0.2, h: 1.3, y: 4.2, cor: '#27303c' }, { u: -3, v: -41.45, w: 5.4, d: 0.2, h: 1.3, y: 7.8, cor: '#27303c' },
    { u: -6.15, v: -44.6, w: 0.2, d: 6.2, h: 11, cor: CELESTE }, { u: 0.15, v: -44.6, w: 0.2, d: 6.2, h: 11, cor: CELESTE },
    { u: -3, v: -44.6, w: 7.6, d: 7.6, h: 0.5, y: 11, cor: '#d9d9d4' },
    { u: -21, v: -40, w: 11, d: 2.2, h: 2.1, cor: '#3f7fd0' }, { u: 8, v: -40, w: 13, d: 2.2, h: 2.1, cor: '#3f7fd0' },
    /* À ESQUERDA: o muro baixo azul-claro e branco, com a praça por trás */
    ...MURO([[-59.5, -47.6], [-59.5, 41.5]], 3, BRANCO), ...MURO([[-59.2, -47.4], [-59.2, 41.5]], 1.4, CELESTE),
    /* a galeria de pilares de tijolo, por baixo da de trás do gol, do lado da rua */
    ...MURO([[fundoGol(-39.8) + 0.25, -39.8], [fundoGol(41) + 0.25, 41]], 2.6, '#5a4038').map(b => ({ ...b, y: 2.6 })),
    ...Array.from({ length: 15 }, (_, i) => { const v = -39.4 + 80 / 14 * i; return { u: fundoGol(v) + 0.45, v, w: 0.7, d: 0.7, h: 8.4 + 0.02 * (v + 40), cor: TIJOLO, giro: 2.6 }; })
  ],
  /* a câmera da aérea de dia do dono: do alto, do lado da torre, olhando a lateral */
  vista: [-46, 58, -108, 6, 0, 8],
  entorno: [
    { tipo: 'rua', de: [-170, 84], ate: [170, 84], larg: 10 }, { tipo: 'rua', de: [-76, -170], ate: [-76, 170], larg: 10 },
    { tipo: 'rua', de: [-170, -62], ate: [170, -62], larg: 9 }, { tipo: 'arvores', u: -92, v: -10, w: 14, d: 50, n: 7 },
    { tipo: 'casas', u: 0, v: 74, nu: 9, nv: 1, passo: 14 }, { tipo: 'casas', u: 0, v: -78, nu: 10, nv: 1, passo: 14 },
    { tipo: 'arvores', u: 92, v: 0, w: 20, d: 70, n: 16 }, { tipo: 'casas', u: 100, v: -50, nu: 2, nv: 2, passo: 15 }
  ],
  jogo: { mandante1: [92, 118], mandante2: [224, 254], mandante3: [48, 72], visitante: [-20, 20], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { jovem_do_salgueiro: 'mandante1', furia_jovem_ypiranga: 'mandante1' } }
};
