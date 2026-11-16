/* SEREJÃO, a BOCA DO JACARÉ (Estádio Elmo Serejo Farias; Brasiliense,
   Taguatinga, DF) — pelo satélite e pelas cinco fotos que o dono mandou
   (16/11/2026): uma aérea antiga, a principal vista do gramado, duas de
   dentro e uma do alto da principal. O campo corre de sudoeste a nordeste;
   no quadro o NOROESTE fica em cima e o NORDESTE à direita. Estádio OVAL,
   baixo, de um lance só em volta, com o gramado dez metros fora do meio do
   oval, puxado pro lado da tribuna. AS DUAS PONTAS SÃO MEIO-CÍRCULOS
   INTEIROS (dono, 16/11/2026: "deu a impressão de que o campo tá torto em
   relação ao espaço dele [...] revise o satélite e corrija"): na primeira
   versão fiz o oval com canto de retângulo arredondado (raio 31 a 36 m num
   oval de 50 de meia largura), sobrava espaço nos cantos e o campo parecia
   fora do lugar. Remedi: o campo está alinhado com o estádio (meio grau de
   diferença), o raio das pontas é a meia largura inteira e as quinas do
   campo ficam a 4 m e meio da beira do gramado, do lado da tribuna:
   · EM VOLTA do gramado, a faixa de terra (a pista velha) com o alambrado,
     mais larga do lado de baixo.
   · EM CIMA (noroeste), a PRINCIPAL: duas faixas de cadeira, com o corredor
     no meio; AMARELA no meio, azul-acinzentada (desbotada) dos lados. No
     alto do bloco amarelo, a TRIBUNA azul de laje plana. Ao pé, os bancos
     de reserva azuis.
   · EMBAIXO (sudeste), o lado oposto: três blocos de cadeira azul-escura,
     com os dois vãos de entrada entre eles e o prédio dos vestiários por
     trás do bloco do meio.
   · NAS DUAS PONTAS (sudoeste e nordeste), as CURVAS de degrau de cimento,
     com as escadas pintadas de amarelo.
   · POR FORA, o anel de asfalto e o MURO oval do terreno; três postes de
     refletores de cada lado.
   FOTOS E SATÉLITE SÃO DE ÉPOCAS DIFERENTES: nas fotos a principal tem
   cadeira até embaixo; no satélite de hoje a faixa de baixo aparece escura
   (cadeira tirada ou suja). Fiz como nas fotos.
   O QUE É ESTIMADO: todas as alturas, as divisas dos blocos de cadeira e o
   tamanho da tribuna. Não achei mapa de setores.
   AS TORCIDAS (escolhas minhas, sem fonte): a Facção Brasiliense no bloco
   do meio do lado oposto à tribuna; a visitante na curva do nordeste. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* o meio do oval, medido a partir do meio do campo */
const CU = 0.9, CV = -10.5;
/* um contorno qualquer, dado pelos pontos: vira a lista de raios vistos do meio do campo */
const POLI = (pts, a, b) => ({ forma: 'raios', a, b, raios: Array.from({ length: 720 }, (_, i) => { const t = i * 0.5 * RAD, dx = Math.cos(t), dy = Math.sin(t); let r = 0;
  for (let k = 0; k < pts.length; k++) { const [x1, y1] = pts[k], [x2, y2] = pts[(k + 1) % pts.length], ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
    const q = (x1 * ey - y1 * ex) / den, w = (x1 * dy - y1 * dx) / den; if (q > 0 && w >= 0 && w <= 1) r = Math.max(r, q); }
  return r; }) });
/* os pontos de um oval (retângulo de canto redondo) fora do centro, e o contorno dele */
const PTS = (a, b, r, cu = CU, cv = CV, n = 12) => [[a - r, b - r, 0], [-(a - r), b - r, 90], [-(a - r), -(b - r), 180], [a - r, -(b - r), 270]].flatMap(([x, y, a0]) =>
  Array.from({ length: n + 1 }, (_, k) => { const t = (a0 + 90 * k / n) * RAD; return [cu + x + r * Math.cos(t), cv + y + r * Math.sin(t)]; }));
const OVAL = (a, b, r, cu = CU, cv = CV) => POLI(PTS(a, b, r, cu, cv), a + Math.abs(cu), b + Math.abs(cv));
/* um MURO por uma linha de pontos: um bloco fino girado em cada trecho */
const MURO = (pts, h = 2.6, cor = '#cfcbc0') => pts.slice(1).map((b, i) => { const a = pts[i], du = b[0] - a[0], dv = b[1] - a[1];
  return { u: (a[0] + b[0]) / 2, v: (a[1] + b[1]) / 2, w: Math.hypot(du, dv) + 0.4, d: 0.4, h, cor, giro: Math.atan2(dv, du) / RAD }; });
/* a beira do gramado, o pé das arquibancadas, o corredor do meio da principal e o fundo: todos com as pontas em meio-círculo
   (o raio é a meia largura). A beira do gramado tem o meio dela: a faixa de terra é mais larga do lado de baixo. */
const GR = OVAL(87.8, 47.2, 47.2, CU, -7.7), I = OVAL(90, 54.5, 54.5), M = OVAL(100.5, 65, 65), F = OVAL(115.6, 77.15, 77.15, CU, CV + 3.65);
const AM = '#e2c64a', AM2 = '#d4b63a', AZ = '#8798b3', AZ2 = '#a9b5c6', AZE = '#33466e', AZE2 = '#2a3a5c', CIM = '#8f8c85', CIM2 = '#86837c', ESC = '#d8c98a', MUR = '#6f6258';
const BASE = { vomitorios: false, paredeAtras: true, corFachada: '#8a867e', corMureta: MUR, parapeito: 1.2, corEscada: ESC };
const DEGRAU = { ...BASE, cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corEspelho: '#77746e', corredor: 44 };
const CAD = (cor, cor2, mais) => ({ ...BASE, cor, cor2, padrao: 'mosaico', mistura: 0.4, corredor: 13.5, ...mais });
/* as divisas, vistas do meio do campo */
const P1 = A(75.9, 58), P2 = A(14.7, 60), P3 = A(-16.1, 60), P4 = A(-83.3, 54);                                                    /* a principal: azul, amarelo, azul */
const O1 = A(-72.5, -60), O2 = A(-28, -66), O3 = A(-22.1, -66), O4 = A(22.4, -66), O5 = A(31.4, -66), O6 = A(63.4, -62);    /* o lado oposto: três blocos e dois vãos */

export default {
  id: 'estadio-serejao', nome: 'Serejão', clubes: ['brasiliense'], norte: 48.1, vazado: 0.3, folga: 30,
  chao: { cor: '#8e9298' },
  campo: { corMargem: '#4f9a4c' },
  corMureta: MUR, corAlambrado: '#9b9d9a',
  alambrado: { cor: '#b9bcb8', corBase: MUR },
  aneis: [
    /* a faixa de terra em volta do gramado (a pista velha), com o alambrado */
    { dentro: GR, fora: I, h: [0.15, 0.15], corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#a0664d' }] },
    { dentro: I, fora: F, h: [1.6, 11.5], corredorFrente: 1.2,
      trechos: [
        /* À DIREITA (nordeste): a curva de cimento */
        { ...DEGRAU, de: O6 - 360, ate: P1 },
        /* EM CIMA (noroeste): a faixa de baixo da principal: azul, amarela no meio, azul */
        { ...CAD(AZ, AZ2), de: P1, ate: P2, fora: M, h: [1.8, 5.9], paredeAtras: false },
        { ...CAD(AM, AM2, { corredor: 8 }), de: P2, ate: P3, fora: M, h: [1.8, 5.9], paredeAtras: false },
        { ...CAD(AZ, AZ2), de: P3, ate: P4, fora: M, h: [1.8, 5.9], paredeAtras: false },
        /* À ESQUERDA (sudoeste): a outra curva de cimento */
        { ...DEGRAU, de: P4, ate: O1 },
        /* EMBAIXO (sudeste): os três blocos de cadeira azul-escura e os dois vãos de entrada */
        { ...CAD(AZE, AZE2, { corredor: 22 }), de: O1, ate: O2, h: [1.6, 9.2] },
        { de: O2, ate: O3, tipo: 'passagem', cor: '#a0664d' },
        { ...CAD(AZE, AZE2, { corredor: 22 }), de: O3, ate: O4, h: [1.6, 8.6] },
        { de: O4, ate: O5, tipo: 'passagem', cor: '#a0664d' },
        { ...CAD(AZE, AZE2, { corredor: 22 }), de: O5, ate: O6, h: [1.6, 9.2] }
      ] },
    /* a faixa de cima da principal, do corredor ao fundo */
    { dentro: M, fora: F, h: [6.1, 12.4], corredorFrente: 1.6,
      trechos: [
        { ...CAD(AZ, AZ2), de: P1, ate: P2 },
        { ...CAD(AM, AM2, { corredor: 8 }), de: P2, ate: P3 },
        { ...CAD(AZ, AZ2), de: P3, ate: P4 }
      ] }
  ],
  fachada: { cor: '#8a867e' },
  /* os seis postes de refletores: três atrás da principal, três atrás do lado oposto */
  refletores: [[-79, 88, 34], [-7, 86, 34], [65, 87, 34], [-68, -102, 34], [2, -102, 34], [70, -101, 34]],
  blocos: [
    /* a TRIBUNA no alto do bloco amarelo: a caixa azul de vidro, a laje plana que avança por cima das cadeiras e os pilares */
    { u: 0.45, v: 76, w: 39, d: 8.5, h: 4.6, y: 12.4, cor: '#2f5aa0' }, { u: 0.45, v: 71.6, w: 39.4, d: 0.3, h: 1.2, y: 14.4, cor: '#1f3f78' },
    { u: 0.45, v: 72.2, w: 40.9, d: 16.3, h: 0.9, y: 17.2, cor: '#d2d2cc', cobertura: true },
    ...[-18, -6, 7, 19].map(u => ({ u, v: 66.2, w: 0.5, d: 0.5, h: 6.2, y: 11, cor: '#c9c9c4' })),
    /* os bancos de reserva azuis, ao pé da principal (dois grandes e dois pequenos) */
    { u: -17, v: 41.2, w: 6, d: 1.8, h: 2.2, cor: '#2c4f9e' }, { u: 13, v: 41.2, w: 6, d: 1.8, h: 2.2, cor: '#2c4f9e' },
    { u: -5.2, v: 41.2, w: 2.4, d: 1.6, h: 2.1, cor: '#2c4f9e' }, { u: 1.5, v: 41.2, w: 2.4, d: 1.6, h: 2.1, cor: '#2c4f9e' },
    /* as três casinhas da faixa de terra, do lado oposto */
    ...[-10.8, -0.3, 10].map(u => ({ u, v: -59.5, w: 2.2, d: 5, h: 2.4, cor: '#d9cfa6' })),
    /* o prédio dos vestiários, por trás do bloco do meio do lado oposto */
    { u: -2.3, v: -89.2, w: 38.5, d: 12.3, h: 8.6, cor: '#8b8e90' }, { u: -2.3, v: -89.2, w: 39.5, d: 13.3, h: 0.5, y: 8.6, cor: '#6f7275' },
    /* O MURO oval do terreno, por fora do anel de asfalto (pelo satélite) */
    ...MURO((p => [...p, p[0]])(PTS(136, 102, 90, 0.9, -9, 9)))
  ],
  /* a câmera da foto aérea do dono: do alto, pelo lado oposto à tribuna */
  vista: [-70, 120, -200, 0, 0, -5],
  entorno: [
    /* à esquerda (sudoeste) e embaixo: o mato e o campo de treino; em cima à esquerda: a terra vermelha */
    { tipo: 'grama', u: -172, v: -10, w: 64, d: 230, cor: '#5d8a4f' }, { tipo: 'grama', u: -95, v: -142, w: 130, d: 56, cor: '#5f9450' },
    { tipo: 'grama', u: -105, v: 134, w: 130, d: 50, cor: '#b27a5c' }, { tipo: 'arvores', u: -72, v: 96, w: 46, d: 10, n: 5 },
    { tipo: 'arvores', u: 118, v: 6, w: 10, d: 60, n: 5 },
    /* em cima à direita: a avenida; embaixo à direita: o pátio de asfalto */
    { tipo: 'rua', de: [40, 132], ate: [172, 40], larg: 16 }, { tipo: 'estacionamento', u: 95, v: -140, w: 110, d: 50, cheio: 0.04 }
  ],
  jogo: { mandante1: [255, 285], mandante2: [160, 210], mandante3: [78, 104], visitante: [-30, 25], tunelMandante: 180, tunelVisitante: 0, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { faccao_brasiliense: 'mandante1' } }
};
