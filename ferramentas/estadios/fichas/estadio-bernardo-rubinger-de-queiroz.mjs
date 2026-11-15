/* BERNARDO RUBINGER DE QUEIROZ (Mamoré, Patos de Minas) — pelo satélite e
   pelas quatro fotos de drone que o dono mandou (15/11/2026). O campo corre
   quase norte-sul; no quadro o OESTE fica em cima e o NORTE à direita.
   Uma ferradura aberta pro sul, com as pontas arredondadas, em cima de um
   barranco (o estádio é cercado de mato e cerrado):
   · EM CIMA (oeste), a lateral de CADEIRAS, a mais funda (20 m): blocos de
     cadeira vermelha (desbotada, nas fotos parece rosa) e, nos dois blocos do
     meio pro sul, verde na metade de cima; atrás desses dois, a parte COBERTA
     da estrutura verde de pilares, com o PREDESTINADO A GRANDES GLÓRIAS! na
     frente do telhado. As cadeiras viram a curva do canto noroeste e descem
     pelo fundo norte até um terço dele.
   · À DIREITA (norte), o resto do fundo, de DEGRAU verde com as escadas
     brancas, que vira o canto nordeste e segue pela lateral de baixo.
   · EMBAIXO (leste), a lateral de DEGRAU verde, mais rasa (10 m), com o
     PEROVITA escrito em branco no degrau e a calçada atrás.
   · À ESQUERDA (sul), o fundo ABERTO: a grama, o muro e, uns 12 m atrás do
     gol, a fileira de cabines de telhado marrom, com uns degraus embaixo.
   A altura acompanha a fundura (`inclinacao`); um anel só, `normal`, com um
   fundo pra metade de cima e outro pra de baixo.
   AS TORCIDAS (escolhas minhas, sem mapa de setores): a Independente do
   Mamoré nas cadeiras da lateral oeste, debaixo da coberta; a visitante nas
   cabines do fundo aberto do sul. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const VM = '#b8505f', VM2 = '#c97b8e', VD = '#2f6b4a', VD2 = '#3a7a56';     /* a cadeira vermelha desbotada e a verde */
const DEG = '#3e5a4b', DEG2 = '#46634f', BRANCO = '#e6e7e3';                /* o degrau verde e as escadas brancas */
/* a beira de dentro (cantos de 8 m) e o fundo de cada metade: a de cima (oeste e o canto noroeste, 20 m de lateral) e a de baixo
   (leste e o canto nordeste, 10 m de lateral); as duas acabam no fundo norte a 67,5 m do meio */
const I = { a: 54.5, b: 39, r: 8 }, F_N = { a: 67.5, b: 59, r: 21 }, F_S = { a: 67.5, b: 49, r: 14 };
const CAD = (de, ate, mais) => ({ de, ate, cor: VM, cor2: VM2, padrao: 'mosaico', mistura: 0.4, corredor: 0, escadaNaBorda: true, corEscada: '#d9cfa8', vomitorios: false, ...mais });
const DGR = (de, ate, mais) => ({ de, ate, cor: DEG, cor2: DEG2, padrao: 'mosaico', mistura: 0.25, semCadeiras: true, corEspelho: '#35503f', corredor: 0, escadaNaBorda: true, corEscada: BRANCO, vomitorios: false, ...mais });
/* os dois blocos debaixo da coberta: vermelho embaixo, verde em cima */
const COB = { padrao: 'fracoes', fracoes: [[0.5, VM], [1, VD]] };
/* as cabines do fundo aberto: 12 telhadinhos marrons */
const CABINES = Array.from({ length: 12 }, (_, i) => ({ u: -69.5, v: -29.3 + i * 5.35, w: 11, d: 5.1, h: 0.4, y: 4.2, cor: i % 2 ? '#5b3a2c' : '#6a4535', cobertura: true }));

export default {
  id: 'estadio-bernardo-rubinger-de-queiroz', nome: 'Bernardo Rubinger de Queiroz', clubes: ['mamore'], norte: 1, vazado: 0.25, folga: 18,
  chao: { cor: '#7d7a70' },
  campo: { corMargem: '#55934f' },
  corMureta: '#e6e7e3',
  aneis: [
    /* a margem em volta do gramado; no fundo aberto ela vai até as cabines */
    { dentro: { a: 52.8, b: 34.3, r: 0.5 }, fora: I, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [
        { de: A(-50, -39) - 360, ate: A(-50, 39), tipo: 'passagem', cor: '#5f9a5e' },
        { de: A(-50, 39), ate: A(-50, -39), tipo: 'passagem', cor: '#5f9a5e', fora: { a: 65, b: 41, r: 1 } }] },
    /* A FERRADURA: as cadeiras do oeste e do canto noroeste, o fundo norte e a lateral leste de degrau */
    { dentro: I, fora: F_N, normal: true, h: [1.4, 9], inclinacao: 0.4, fileiras: 22,
      trechos: [
        /* o fundo norte, metade de baixo: degrau verde (o bloco do canto, mais claro no satélite) */
        DGR(A(54.5, -21), 360, { fora: F_S }), DGR(A(54.5, -38), A(54.5, -21), { fora: F_S, cor: '#5d7656', cor2: '#66805e' }),
        /* o fundo norte, metade de cima: degrau verde e, do canto pra cá, as cadeiras vermelhas */
        DGR(0, A(54.5, 21.7)), CAD(A(54.5, 21.7), A(36, 39)),
        /* a lateral oeste de cadeiras: os blocos entre as escadas, os dois do meio pro sul debaixo da coberta */
        CAD(A(36, 39), A(14, 39)), CAD(A(14, 39), A(-8, 39), COB), CAD(A(-8, 39), A(-30, 39), COB), CAD(A(-30, 39), A(-50, 39)),
        { de: A(-50, 39), ate: A(-50, -39), tipo: 'vazio' },
        /* a lateral leste de degrau verde, com o PEROVITA */
        DGR(A(-50, -39), A(-28.3, -39), { fora: F_S }), DGR(A(-28.3, -39), A(-5.8, -39), { fora: F_S }),
        DGR(A(-5.8, -39), A(38, -39), { fora: F_S, texto: 'PEROVITA', corTexto: BRANCO, textoLargura: 0.92, textoAltura: 0.62 }),
        DGR(A(38, -39), A(54.5, -38) , { fora: F_S })
      ] },
    /* a calçada atrás da lateral leste e do fundo norte; o anel de fora dá o tamanho do quadro */
    { dentro: F_S, fora: { a: 80, b: 72, r: 20 },
      trechos: [
        { de: A(-50, -49), ate: 360, tipo: 'passagem', cor: '#6c6a64', fora: { a: 75, b: 56, r: 18 } },
        { de: 0, ate: A(67.5, 21.7), tipo: 'passagem', cor: '#6c6a64', dentro: F_N, fora: { a: 75, b: 66, r: 25 } }] }
  ],
  /* a coberta da lateral oeste: o telhado, a laje de trás e os pilares verdes */
  telhados: [{ y: 13.5, h: 0.5, cor: '#d9d9d2', pontos: [[-30, 53], [12, 53], [12, 70], [-30, 70]] }],
  /* as cabines de telhado marrom do fundo aberto, com uns degraus embaixo */
  retas: [{ u: -64.5, v: 0, ang: 180, comp: 64, prof: 9.5, h: [0.6, 3], fileiras: 4, cor: DEG, cor2: DEG2, padrao: 'mosaico', mistura: 0.2, semCadeiras: true, corEspelho: '#35503f',
    corredor: 0, corEscada: BRANCO, vomitorios: false, corFachada: '#4d4a45' }],
  fachada: { cor: '#c9c9c2' },
  refletores: [[-60, -56, 30], [42, -58, 30], [-55, 64, 30], [58, 66, 30]],
  blocos: [
    /* a coberta: a laje de trás, os pilares do pórtico e a frente do telhado com o lema */
    { u: -9, v: 67, w: 42, d: 6, h: 11, cor: '#2f6b4a' },
    ...[-29, -22, -15, -8, -1, 6, 11].map(u => ({ u, v: 69.5, w: 1.2, d: 1.2, h: 16, cor: '#2f7a52' })),
    { u: -9, v: 69.5, w: 42, d: 1.4, h: 1.2, y: 15.2, cor: '#2f7a52' },
    { u: -9, v: 52.9, w: 0.4, d: 42, h: 1.6, y: 12.2, cor: '#2f6b4a', texto: 'PREDESTINADO A GRANDES GLÓRIAS!', corTexto: '#f1f2ee', textoFace: true, giro: -90, textoLargura: 0.9, textoAltura: 0.6 },
    /* os bancos de reserva, ao pé das cadeiras */
    { u: -28, v: 37.4, w: 15, d: 2.2, h: 2, cor: '#8f9498' }, { u: -1, v: 37.4, w: 12, d: 2.2, h: 2, cor: '#8f9498' }, { u: 22, v: 37.4, w: 12, d: 2.2, h: 2, cor: '#8f9498' },
    /* a parede de trás das cabines */
    { u: -74.5, v: 2.8, w: 1, d: 64, h: 4.4, cor: '#4d4a45' },
    ...CABINES
  ],
  /* a câmera da primeira foto do dono: do alto do fundo aberto, olhando a ferradura */
  vista: [-125, 70, 8, 20, 0, 0],
  entorno: [
    /* à esquerda (sul) e em cima à esquerda, o mato; à direita (norte), a estrada e o cerrado */
    { tipo: 'arvores', u: -112, v: -5, w: 40, d: 150, n: 40 }, { tipo: 'arvores', u: -70, v: 92, w: 50, d: 30, n: 14 },
    { tipo: 'rua', de: [80, 130], ate: [96, -110], larg: 9 }, { tipo: 'arvores', u: 120, v: 30, w: 40, d: 140, n: 22 },
    /* em cima (oeste), o pátio grande de chão batido */
    { tipo: 'estacionamento', u: 5, v: 104, w: 90, d: 40, cheio: 0 },
    /* embaixo (leste), o barranco com mato */
    { tipo: 'arvores', u: 0, v: -80, w: 150, d: 20, n: 20 }
  ],
  jogo: { mandante1: [96, 120], mandante2: [125, 140], mandante3: [-15, 10], visitante: [172, 188], tunelMandante: 108, tunelVisitante: 180, folgaPM: 3,
          fracao: { mandante1: 0.45, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { independente_do_mamore: 'mandante1' } }
};
