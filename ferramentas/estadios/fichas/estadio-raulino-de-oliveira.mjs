/* RAULINO DE OLIVEIRA (o Estádio da Cidadania, Volta Redonda) — pelo satélite
   e pelas seis fotos que o dono mandou depois da primeira versão
   (16/11/2026): duas aéreas, uma de drone de frente pra lateral principal,
   uma do canto e duas da lateral VOLTA REDONDA. Não achei mapa de setores.
   O campo corre quase norte-sul; no quadro o LESTE fica em cima e o NORTE à
   esquerda. Estádio fechado, em OCTÓGONO (os quatro cantos chanfrados), de
   cadeira amarelo-ouro, com a pista de atletismo em volta do gramado:
   · EMBAIXO (oeste), a lateral principal, a mais funda (26 m), coberta de
     telha clara (as fileiras de baixo ficam de fora): nas duas pontas o VR
     em cadeira preta; no meio, o bloco AZUL (azul dos lados, claro no
     centro) com as cabines por cima; as caixas brancas das bocas de acesso a
     um quarto da altura.
   · EM CIMA (leste), a outra lateral coberta (15 m), com VOLTA REDONDA
     escrito em cadeira preta de ponta a ponta e as bocas no pé, nas pontas.
   · À ESQUERDA (norte) e À DIREITA (sul), os dois fundos DESCOBERTOS,
     amarelos com o bloco GRENÁ no meio (no satélite, desbotado, parece
     branco: eu tinha feito branco) e o placar no alto.
   · Os quatro cantos, amarelos, descobertos na maior parte, com uma boca
     cada.
   · Em cima das duas coberturas, as torres de luz: uma grande no meio e uma
     menor em cada ponta. Por fora, a fachada branca e verde, as cúpulas das
     rampas nos cantos e a marquise da entrada no meio do lado oeste.
   Estimado: as alturas e o desenho exato do bloco azul.
   AS TORCIDAS (escolhas minhas, sem fonte): a Jovem do Voltaço no fundo
   norte; a visitante no fundo sul. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AM = '#dcae3c', AM2 = '#d2a233', GR = '#8a4a5c', GR2 = '#9c6272', AZ = '#2f6fc0', AZ2 = '#3d7ccb', CLARO = '#bcd9ee', CLARO2 = '#e6eef3', PRETO = '#1f1f22';
const CONC = '#dfe3dc', TELHA = '#b4b7b8';
/* a beira de dentro (um octógono: retângulo de canto chanfrado) e os fundos de cada canto; todos com o mesmo trecho reto
   das laterais (a - r = 62,5), e cada fundo partido no meio pra casar com os dois cantos vizinhos */
const I = { a: 84.5, b: 46.5, r: 22, chanfro: true };
const F_NE = { a: 97, b: 61.5, r: 34.5, chanfro: true }, F_SE = { a: 99.5, b: 61.5, r: 37, chanfro: true };
const F_NO = { a: 97, b: 72.5, r: 34.5, chanfro: true }, F_SO = { a: 99.5, b: 72.5, r: 37, chanfro: true };
/* a boca de acesso: a caixa branca a um quarto da altura, em cima de uma escada */
const BOCA = { f: 0.24, larg: 3.6, fundo: 3.4, cor: '#2c2a27', corParapeito: '#e9e6dd' };
const CAD = { cor: AM, cor2: AM2, padrao: 'mosaico', mistura: 0.3, corredor: 0, corEscada: '#c9c5bb', escadaNaBorda: true, vomitorios: false, paredeAtras: true, corFachada: CONC };
const GRENA = { cor: GR, cor2: GR2 }, AZUL = { cor: AZ, cor2: AZ2 }, CENTRO = { cor: CLARO, cor2: CLARO2, mistura: 0.5 };
const T = (de, ate, fora, mais) => ({ ...CAD, de, ate, fora, ...mais });
const boca = em => ({ vomitorios: { ...BOCA, em } });
/* um canto: uma escada no meio com a boca em cima */
const CANTO = (de, ate, fora) => T(de, ate, fora, { corredor: 16.2, escadaNaBorda: false, vomitorios: { ...BOCA, cada: 1 } });
/* uma ponta amarela da lateral principal: três blocos, duas escadas com boca, e o VR em cadeira preta */
const VR = (de, ate, fora) => T(de, ate, fora, { corredor: 11.9, vomitorios: { ...BOCA, cada: 1 }, texto: 'VR', corTexto: PRETO, textoLargura: 0.5, textoAltura: 0.42 });
/* as torres de luz em cima das coberturas: os dois pés e o painel de lâmpadas */
const TORRE = (u, v, y, w, alt) => [{ u: u - w / 2 + 0.3, v, w: 0.5, d: 0.5, h: alt, y, cor: '#d9dcde', cobertura: true }, { u: u + w / 2 - 0.3, v, w: 0.5, d: 0.5, h: alt, y, cor: '#d9dcde', cobertura: true },
  { u, v, w, d: 0.8, h: alt * 0.45, y: y + alt, cor: '#eef1f3', cobertura: true }];

export default {
  id: 'estadio-raulino-de-oliveira', nome: 'Raulino de Oliveira', clubes: ['volta-redonda', 'americano'], norte: 193.3, vazado: 0.3, folga: 24,
  chao: { cor: '#7f7b74' },
  campo: { corMargem: '#4c8f4d', corFosso: '#8a8781', pista: { dentro: { a: 76.5, b: 39.4, r: 39.4 }, fora: { a: 82.8, b: 45, r: 45 }, cor: '#75726d', raias: 6 } },
  corMureta: '#cfccc3', corAlambrado: '#6f8f6a',
  alambrado: { cor: '#6f8f6a', corBase: '#cfccc3' },
  aneis: [
    { dentro: I, fora: F_SE, reto: true, h: [2, 8.3], inclinacao: 0.42, fileiras: 17,
      trechos: [
        /* À DIREITA (sul): o fundo descoberto, amarelo com o bloco grená no meio; as bocas nas divisas */
        T(A(84.5, -24.5) - 360, A(84.5, -10.6) - 360, F_SO, { escadaNaBorda: false, ...boca([1]) }), T(A(84.5, -10.6) - 360, 0, F_SO, { ...GRENA, ...boca([0]) }),
        T(0, A(84.5, 10.6), F_SE, { ...GRENA, escadaNaBorda: false, ...boca([1]) }), T(A(84.5, 10.6), A(84.5, 24.5), F_SE, boca([0])),
        /* o canto sudeste */
        CANTO(A(84.5, 24.5), A(62.5, 46.5), F_SE),
        /* EM CIMA (leste): a lateral coberta, com VOLTA REDONDA em cadeira preta e as bocas no pé, nas pontas */
        T(A(62.5, 46.5), A(-62.5, 46.5), F_SE, { texto: 'VOLTA    REDONDA', corTexto: PRETO, textoLargura: 0.84, textoAltura: 0.5, vomitorios: { ...BOCA, f: 0, em: [0.035, 0.965] } }),
        /* o canto nordeste */
        CANTO(A(-62.5, 46.5), A(-84.5, 24.5), F_NE),
        /* À ESQUERDA (norte): o fundo descoberto */
        T(A(-84.5, 24.5), A(-84.5, 10.6), F_NE, boca([1])), T(A(-84.5, 10.6), 180, F_NE, { ...GRENA, ...boca([0]) }),
        T(180, A(-84.5, -10.6), F_NO, { ...GRENA, escadaNaBorda: false, ...boca([1]) }), T(A(-84.5, -10.6), A(-84.5, -24.5), F_NO, boca([0])),
        /* o canto noroeste */
        CANTO(A(-84.5, -24.5), A(-62.5, -46.5), F_NO),
        /* EMBAIXO (oeste): a lateral principal: o VR nas pontas e o bloco azul (claro no centro) no meio */
        VR(A(-62.5, -46.5), A(-27, -46.5), F_NO),
        T(A(-27, -46.5), A(-10, -46.5), F_NO, { ...AZUL, ...boca([1]) }), T(A(-10, -46.5), A(7, -46.5), F_NO, { ...CENTRO, ...boca([0, 1]) }), T(A(7, -46.5), A(24, -46.5), F_SO, { ...AZUL, ...boca([0]) }),
        VR(A(24, -46.5), A(62.5, -46.5), F_SO),
        /* o canto sudoeste */
        CANTO(A(62.5, -46.5), A(84.5, -24.5), F_SO)
      ] }
  ],
  /* as duas coberturas de telha clara, com o pedaço que avança por cima dos cantos (sem sombra nas vistas de conferência) */
  telhados: [
    { y: 12.6, h: 0.5, cor: TELHA, sombra: false, pontos: [[-75.5, 37.5], [-62.5, 45], [62.5, 45], [79, 37.5], [88, 47], [62.5, 62.5], [-62.5, 62.5], [-84.5, 50.5]] },
    { y: 17.6, h: 0.5, cor: TELHA, sombra: false, pontos: [[-61.7, -51.5], [59.7, -51.5], [70.9, -46.3], [97.1, -59.4], [64.3, -73.5], [-64.3, -73.5], [-90.6, -58.1], [-74.8, -44.3]] }
  ],
  fachada: { cor: CONC },
  refletores: [],
  blocos: [
    /* as torres de luz em cima das coberturas: a grande do meio e uma menor em cada ponta */
    ...TORRE(5.5, 49, 13.1, 24, 7), ...TORRE(-72, 46, 13.1, 9, 5), ...TORRE(74, 46, 13.1, 9, 5),
    ...TORRE(6, -55, 18.1, 24, 7), ...TORRE(-72, -53, 18.1, 9, 5), ...TORRE(74, -53, 18.1, 9, 5),
    /* as cabines por cima do bloco azul, no fundo da lateral principal */
    { u: -1.5, v: -70.6, w: 32, d: 3.6, h: 4.2, y: 12.6, cor: '#c9a637' }, { u: -1.5, v: -68.7, w: 30, d: 0.2, h: 1.4, y: 14.2, cor: '#26282c' },
    /* o placar no alto de cada fundo */
    { u: -97.6, v: 0, w: 0.6, d: 11, h: 4, y: 8.4, cor: '#e6e6e2' }, { u: -97.2, v: 0, w: 0.2, d: 10, h: 3.2, y: 8.8, cor: '#1c1d20' },
    { u: 100.1, v: 0, w: 0.6, d: 9, h: 3.4, y: 9.4, cor: '#3a3c40' },
    /* a marquise da entrada, no meio do lado oeste, e os bancos de reserva amarelos */
    { u: 0, v: -79, w: 22, d: 9, h: 5, cor: '#a7a39b' },
    { u: -14, v: -40.9, w: 12, d: 1.6, h: 1.8, cor: '#d9b23a' }, { u: 10, v: -40.9, w: 12, d: 1.6, h: 1.8, cor: '#d9b23a' }
  ],
  /* a câmera do drone do dono: de cima da cobertura do leste, de frente pra lateral principal */
  vista: [0, 62, 108, 0, 2, -30],
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
