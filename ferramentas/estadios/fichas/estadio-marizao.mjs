/* MARIZÃO (Estádio Antônio Mariz, Sousa, em Sousa-PB) — pelas três fotos que o
   dono mandou (17/11/2026: "Vamos pro estádio do Sousa, ele vai ter estádio
   próprio agora"; uma de dentro, uma de drone da arquibancada principal e uma
   aérea) e pelo satélite (o do Google), de onde saíram as medidas. O campo corre
   de norte a sul; no quadro o SUL fica à direita e o LESTE em cima.
   Três arquibancadas de degrau pintado de VERDE, com as escadas brancas e a
   mureta amarela, e um fundo sem arquibancada:
   · EMBAIXO (oeste), a PRINCIPAL, de 108 m por 23 de fundura: nas duas pontas,
     um lance só, até o alto; no meio (52 m), o lance de baixo e, por cima dele,
     a tribuna de cadeiras verde-claras debaixo do telhado branco, com o prédio
     branco das cabines atrás. O degrau dela é pintado em ZIGUE-ZAGUE verde e
     branco (a foto de dentro); os bancos de reserva ficam ao pé;
   · EM CIMA (leste), a outra lateral, comprida e rasa (9 m), verde, de escadas
     brancas juntas umas das outras;
   · À DIREITA (sul), atrás do gol, a de 84 m por 10, igual;
   · À ESQUERDA (norte), atrás do outro gol, só o muro amarelo com as placas.
   ESTIMADO: as alturas; o desenho do zigue-zague (a foto mostra de perto um
   pedaço) e se ele vale na principal inteira (pus); a largura da tribuna e do
   telhado (52 m, pela aérea; o satélite é anterior ao telhado); as escadas cor
   de vinho que a aérea mostra entre as brancas não entraram; as torres de luz.
   AS TORCIDAS (escolha minha): a Força Alviverde no meio da lateral do leste,
   com o apoio nas duas pontas da principal; a visitante atrás do gol. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const VERDE = '#3f9a5f', VERDE2 = '#378d55', BRANCO = '#f0f0ec', AMARELO = '#e0b63a', CLARO = '#8fc9a3';
/* a beira da grama e os fundos */
const I = { a: 55.5, b: 46.5, r: 0.5 };
const LAT = b => ({ a: 55.5, b, r: 0.5 }), FUN = a => ({ a, b: 46.5, r: 0.5 });
const DEGRAU = { cor: VERDE, cor2: VERDE2, padrao: 'mosaico', mistura: 0.2, semCadeiras: true, espelhoPintado: true, corEscada: BRANCO, corredor: 7, vomitorios: false,
  paredeAtras: true, corFachada: BRANCO, corLado: BRANCO, parapeito: 1.3, corMureta: AMARELO };
/* o zigue-zague verde e branco da principal: faixas brancas que sobem e descem ao longo do comprimento (`L` × `F` metros) */
const ZIGUE = (L, F) => (x, y) => { const t = (x * L / 6.4) % 1, tri = Math.abs(t * 2 - 1), q = ((y * F + tri * 2.6) / 4.8) % 1; return q < 0.4 ? BRANCO : null; };
/* a principal: de u = -52 a u = 55,5; a tribuna, no meio, de -26 a 26 */
const P0 = -52, P1 = 55.5, T0 = -26, T1 = 26, B = -46.5;
const PONTA = (u0, u1) => ({ de: A(u0, B), ate: A(u1, B), fora: LAT(70), h: [1.4, 12.4], fileiras: 24, ...DEGRAU, corredor: 13, pinta: ZIGUE(u1 - u0, 23.5) });
const MURO = (pts, h, c) => pts.slice(1).map((b, i) => { const a = pts[i], du = b[0] - a[0], dv = b[1] - a[1];
  return { u: (a[0] + b[0]) / 2, v: (a[1] + b[1]) / 2, w: Math.hypot(du, dv) + 0.4, d: 0.4, h, cor: c, giro: Math.atan2(dv, du) / RAD }; });

export default {
  id: 'estadio-marizao', nome: 'Marizão', clubes: ['sousa'], norte: 180.5, vazado: 0.3, folga: 22,
  chao: { cor: '#a39a86' },
  campo: { corMargem: '#5f9a50' },
  corMureta: AMARELO, corAlambrado: '#3a6b4a',
  aneis: [
    /* a grama em volta do campo */
    { dentro: { a: 54, b: 36, r: 0.5 }, fora: I, reto: true, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#5f9a50' }] },
    { dentro: I, fora: LAT(57), reto: true, h: [1.2, 5.8], fileiras: 10, corredorFrente: 1.6,
      trechos: [
        /* À DIREITA (sul), atrás do gol */
        { de: A(55.5, -41.8) - 360, ate: A(55.5, 41.8), fora: FUN(67), h: [1.2, 6.2], fileiras: 11, ...DEGRAU },
        { de: A(55.5, 41.8), ate: A(55.5, 46.5), tipo: 'vazio' },
        /* EM CIMA (leste), a lateral comprida e rasa */
        { de: A(55.5, 46.5), ate: A(-55.5, 46.5), ...DEGRAU },
        /* À ESQUERDA (norte): só o muro */
        { de: A(-55.5, 46.5), ate: A(P0, B), tipo: 'vazio' },
        /* EMBAIXO (oeste), a PRINCIPAL: a ponta, o lance de baixo da tribuna, a outra ponta */
        PONTA(P0, T0),
        { de: A(T0, B), ate: A(T1, B), h: [1.4, 6.2], fileiras: 11, ...DEGRAU, corredor: 13, pinta: ZIGUE(T1 - T0, 10.5), parapeito: 0.4 },
        PONTA(T1, P1),
        { de: A(P1, B), ate: A(55.5, -41.8), tipo: 'vazio' }
      ] },
    /* a TRIBUNA, por cima do meio da principal: as cadeiras verde-claras debaixo do telhado branco */
    { dentro: LAT(57), fora: LAT(66), reto: true, h: [7.8, 11.6], fileiras: 8, corredorFrente: 1.4, corMureta: BRANCO,
      trechos: [
        { de: 0, ate: A(T0, -57), tipo: 'vazio' },
        { de: A(T0, -57), ate: A(T1, -57), cor: CLARO, cor2: '#7fbd95', padrao: 'mosaico', mistura: 0.3, pisoPintado: true, corredor: 13, corEscada: BRANCO, vomitorios: false,
          paredeAtras: true, corFachada: BRANCO, corLado: BRANCO, parapeito: 1,
          cobertura: { h: 17.4, larg: 10.4, avanco: 7, cai: 0.5, cor: '#eeeeea', cor2: '#e2e2de', listras: true, corBaixo: '#c9c9c4', trelica: false, corPilar: '#d9d9d4', pelaColuna: true } },
        { de: A(T1, -57), ate: 360, tipo: 'vazio' }] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[-28, 60, 26], [28, 60, 26], [-40, -74, 26], [44, -74, 26]],
  blocos: [
    /* o prédio branco das cabines, atrás da tribuna, com as duas fiadas de janelas */
    { u: 0, v: -69.5, w: 50, d: 6.6, h: 16.6, cor: BRANCO },
    { u: 0, v: -66.1, w: 46, d: 0.2, h: 1.4, y: 12.4, cor: '#2f4a3a' }, { u: 0, v: -66.1, w: 46, d: 0.2, h: 1.2, y: 14.6, cor: '#2f4a3a' },
    /* os bancos de reserva verdes e amarelos, ao pé da principal */
    { u: -19, v: -43, w: 9, d: 2.2, h: 2.1, cor: '#2f7d4a' }, { u: 19, v: -43, w: 9, d: 2.2, h: 2.1, cor: '#2f7d4a' }, { u: 0, v: -43.4, w: 5, d: 1.8, h: 2, cor: AMARELO },
    /* À ESQUERDA (norte): o muro amarelo com as placas de publicidade, e a casinha por trás */
    ...MURO([[-57.5, -47], [-57.5, 57.4]], 3.2, AMARELO),
    ...['#e9e9e4', '#1d2c5e', '#b3262b', '#e9e9e4', '#2f6fc4', '#d9b62a', '#e9e9e4', '#b3262b'].map((cor, i) => ({ u: -57.2, v: -38 + 10.8 * i, w: 0.2, d: 9, h: 1.3, y: 0.2, cor })),
    { u: -64, v: 5, w: 8, d: 10, h: 3.6, cor: '#c9c6bb' }
  ],
  /* a câmera da aérea do dono: do alto, por cima da principal, olhando a lateral do leste */
  vista: [2, 78, -112, 0, 0, 8],
  entorno: [
    { tipo: 'rua', de: [-82, -170], ate: [-70, 170], larg: 12 }, { tipo: 'rua', de: [-170, 84], ate: [170, 84], larg: 9 },
    { tipo: 'predio', u: 24, v: -100, w: 44, d: 24, h: 9, cor: '#b9c7d6' }, { tipo: 'predio', u: 92, v: 6, w: 30, d: 22, h: 8, cor: '#b9c0c6' },
    { tipo: 'casas', u: -110, v: -20, nu: 2, nv: 9, passo: 15 }, { tipo: 'predio', u: -30, v: 76, w: 34, d: 22, h: 5, cor: '#c98a5f' },
    { tipo: 'arvores', u: 30, v: 70, w: 30, d: 16, n: 7 }
  ],
  jogo: { mandante1: [76, 104], mandante2: [296, 318], mandante3: [224, 244], visitante: [-20, 20], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { forca_alviverde: 'mandante1' } }
};
