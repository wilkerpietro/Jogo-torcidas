/* RAULINO DE OLIVEIRA (o Estádio da Cidadania, Volta Redonda) — só pelo
   satélite, bem nítido; o dono não mandou fotos e não achei mapa de setores.
   O campo corre quase norte-sul; no quadro o LESTE fica em cima e o NORTE à
   esquerda. Estádio fechado, em OCTÓGONO (os quatro cantos chanfrados), com
   a pista de atletismo em volta do gramado:
   · EM CIMA (leste) e EMBAIXO (oeste), as duas laterais COBERTAS de laje de
     concreto, que avança um pedaço por cima dos cantos; a do oeste é a
     principal, bem mais funda (26 m contra 15 m), e deixa as fileiras de
     baixo descobertas: cadeira laranja nas pontas e branca no meio.
   · À ESQUERDA (norte) e À DIREITA (sul), os dois fundos DESCOBERTOS, de
     cadeira laranja com o bloco branco no meio.
   · Os quatro cantos, de cadeira laranja, descobertos na maior parte.
   · Por fora, as torres redondas das rampas nos cantos e a marquise da
     entrada no meio do lado oeste.
   O QUE NÃO SE VÊ do satélite e é suposição minha: as cadeiras debaixo das
   duas lajes (fiz laranja, como as descobertas; no oeste, branco no meio,
   continuando o que aparece na frente), se há camarotes ou segundo lance
   debaixo delas, as bocas de acesso e as alturas.
   AS TORCIDAS (escolhas minhas, sem fonte): a Jovem do Voltaço no fundo
   norte; a visitante no fundo sul. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const LAR = '#e0a13a', LAR2 = '#d7942f', BR = '#e7e1d8', BR2 = '#dcd5cb', CONC = '#8f8b85', LAJE = '#93908a';
/* a beira de dentro (um octógono: retângulo de canto chanfrado) e os fundos de cada canto; todos com o mesmo trecho reto
   das laterais (a - r = 62,5), e cada fundo partido no meio pra casar com os dois cantos vizinhos */
const I = { a: 84.5, b: 46.5, r: 22, chanfro: true };
const F_NE = { a: 97, b: 61.5, r: 34.5, chanfro: true }, F_SE = { a: 99.5, b: 61.5, r: 37, chanfro: true };
const F_NO = { a: 97, b: 72.5, r: 34.5, chanfro: true }, F_SO = { a: 99.5, b: 72.5, r: 37, chanfro: true };
const CAD = { cor: LAR, cor2: LAR2, padrao: 'mosaico', mistura: 0.3, corredor: 11, corEscada: '#c9c5bb', escadaNaBorda: true, vomitorios: false, paredeAtras: true, corFachada: CONC };
const BRANCA = { ...CAD, cor: BR, cor2: BR2 };
const T = (de, ate, fora, mais) => ({ ...CAD, de, ate, fora, ...mais });

export default {
  id: 'estadio-raulino-de-oliveira', nome: 'Raulino de Oliveira', clubes: ['volta-redonda', 'americano'], norte: 193.3, vazado: 0.3, folga: 24,
  chao: { cor: '#7f7b74' },
  campo: { corMargem: '#4c8f4d', corFosso: '#8a8781', pista: { dentro: { a: 76.5, b: 39.4, r: 39.4 }, fora: { a: 82.8, b: 45, r: 45 }, cor: '#75726d', raias: 6 } },
  corMureta: '#b9b5ac',
  aneis: [
    { dentro: I, fora: F_SE, reto: true, h: [2, 8.3], inclinacao: 0.42, fileiras: 17,
      trechos: [
        /* À DIREITA (sul): o fundo descoberto, laranja com o bloco branco no meio */
        T(A(84.5, -24.5) - 360, A(84.5, -10.6) - 360, F_SO, { escadaNaBorda: false }), T(A(84.5, -10.6) - 360, 0, F_SO, BRANCA), T(0, A(84.5, 10.6), F_SE, { ...BRANCA, escadaNaBorda: false }),
        T(A(84.5, 10.6), A(84.5, 24.5), F_SE),
        /* o canto sudeste */
        T(A(84.5, 24.5), A(62.5, 46.5), F_SE),
        /* EM CIMA (leste): a lateral coberta */
        T(A(62.5, 46.5), A(-62.5, 46.5), F_SE),
        /* o canto nordeste */
        T(A(-62.5, 46.5), A(-84.5, 24.5), F_NE),
        /* À ESQUERDA (norte): o fundo descoberto */
        T(A(-84.5, 24.5), A(-84.5, 10.6), F_NE), T(A(-84.5, 10.6), 180, F_NE, BRANCA), T(180, A(-84.5, -10.6), F_NO, { ...BRANCA, escadaNaBorda: false }),
        T(A(-84.5, -10.6), A(-84.5, -24.5), F_NO),
        /* o canto noroeste */
        T(A(-84.5, -24.5), A(-62.5, -46.5), F_NO),
        /* EMBAIXO (oeste): a lateral principal, laranja nas pontas e branca no meio */
        T(A(-62.5, -46.5), A(-27, -46.5), F_NO), T(A(-27, -46.5), A(24, -46.5), F_NO, BRANCA), T(A(24, -46.5), A(62.5, -46.5), F_SO),
        /* o canto sudoeste */
        T(A(62.5, -46.5), A(84.5, -24.5) , F_SO)
      ] }
  ],
  /* as duas lajes de concreto, com o pedaço que avança por cima dos cantos (sem sombra nas vistas de conferência) */
  telhados: [
    { y: 12.6, h: 0.5, cor: LAJE, sombra: false, pontos: [[-75.5, 37.5], [-62.5, 45], [62.5, 45], [79, 37.5], [88, 47], [62.5, 62.5], [-62.5, 62.5], [-84.5, 50.5]] },
    { y: 17.6, h: 0.5, cor: LAJE, sombra: false, pontos: [[-61.7, -51.5], [59.7, -51.5], [70.9, -46.3], [97.1, -59.4], [64.3, -73.5], [-64.3, -73.5], [-90.6, -58.1], [-74.8, -44.3]] }
  ],
  fachada: { cor: CONC },
  refletores: [],
  blocos: [
    /* as armações de luz em cima das duas lajes */
    { u: 5.5, v: 51, w: 30, d: 3.5, h: 1.6, y: 13.1, cor: '#3a3c40', cobertura: true }, { u: 6, v: -56, w: 26, d: 3, h: 1.6, y: 18.1, cor: '#3a3c40', cobertura: true },
    /* a marquise da entrada, no meio do lado oeste, e os bancos de reserva amarelos */
    { u: 0, v: -79, w: 22, d: 9, h: 5, cor: '#a7a39b' },
    { u: -14, v: -40.9, w: 12, d: 1.6, h: 1.8, cor: '#d9b23a' }, { u: 10, v: -40.9, w: 12, d: 1.6, h: 1.8, cor: '#d9b23a' }
  ],
  /* do alto do canto sudoeste, pra ver o octógono, as duas lajes e os fundos laranja */
  vista: [120, 75, -120, 0, 0, 0],
  entorno: [
    /* as torres redondas das rampas, nos cantos */
    { tipo: 'cupula', u: -91, v: 50, r: 6.5, h: 7, cor: '#9b978f', cor2: '#a8a49c' }, { tipo: 'cupula', u: 88, v: 53, r: 6, h: 7, cor: '#9b978f', cor2: '#a8a49c' },
    { tipo: 'cupula', u: -87, v: -76, r: 9, h: 7, cor: '#9b978f', cor2: '#a8a49c' }, { tipo: 'cupula', u: 86, v: -76, r: 7.5, h: 7, cor: '#9b978f', cor2: '#a8a49c' },
    /* em cima (leste): a rua arborizada e as casas */
    { tipo: 'rua', de: [-140, 72], ate: [140, 72], larg: 9 }, { tipo: 'arvores', u: -45, v: 70, w: 60, d: 6, n: 4 }, { tipo: 'casas', u: 0, v: 88, nu: 16, nv: 1, passo: 15 },
    /* à direita (sul): a rua com os carros e as casas */
    { tipo: 'rua', de: [112, -130], ate: [112, 130], larg: 9 }, { tipo: 'casas', u: 130, v: 0, nu: 1, nv: 12, passo: 15 },
    /* embaixo (oeste): a rua e o estacionamento grande do outro lado */
    { tipo: 'rua', de: [-140, -90], ate: [140, -90], larg: 10 }, { tipo: 'estacionamento', u: -10, v: -116, w: 110, d: 36, cheio: 0.25 }, { tipo: 'arvores', u: 80, v: -112, w: 40, d: 30, n: 7 },
    /* à esquerda (norte): a praça calçada, a rua e as casas */
    { tipo: 'rua', de: [-116, -130], ate: [-116, 130], larg: 9 }, { tipo: 'casas', u: -134, v: 0, nu: 1, nv: 12, passo: 15 }
  ],
  jogo: { mandante1: [166, 194], mandante2: [235, 305], mandante3: [55, 125], visitante: [-14, 14], tunelMandante: 270, tunelVisitante: 0, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { jovem_do_voltaco: 'mandante1', imperio_americano: 'mandante1' } }
};
