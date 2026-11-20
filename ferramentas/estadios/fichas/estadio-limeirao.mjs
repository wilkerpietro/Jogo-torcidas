/* LIMEIRÃO (Estádio Major José Levy Sobrinho — Inter de Limeira, Limeira) —
   pelo satélite e pelas fotos de referência (15/11/2026); o meio do campo
   foi tirado do círculo central. O campo corre de sul-sudeste a
   norte-noroeste; no quadro o OESTE (a coberta) fica em cima e o NORTE à
   direita. NÃO achei mapa de setores do clube.
   Bacia fechada, em retângulo de cantos bem redondos, em cima de um morro
   gramado, toda de degrau de cimento:
   · O ANEL dá a volta inteira: 29 a 30 m de fundo nos dois lados, 34 m
     atrás do gol do norte (à direita) e 24 m atrás do gol do sul. Degrau
     pintado de preto, com as escadas brancas e o muro branco no alto.
   · EM CIMA (oeste), a COBERTA: o trecho do anel debaixo do telhado branco,
     deslocado pro norte; cadeira branca nas fileiras da frente, escura
     atrás; por fora, o prédio alto com o A. A. INTERNACIONAL no alto.
   · EMBAIXO (leste), no meio, o INTER escrito em branco no degrau; por cima
     do fundo, a viga comprida dos refletores.
   · Entre o gramado e a arquibancada, a pista de asfalto.
   O satélite mostra o cimento cru e encardido; as aéreas recentes mostram
   o degrau pintado de preto e o INTER bem branco. Vale a pintura recente.
   OS ACESSOS: nenhuma boca de vomitório aparece; ficou sem. */
const PT = '#3a3b40', PT2 = '#44464b', ESC = '#dcdcd6', BR = '#f1f1ed';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a grama; a beira de dentro do anel; o fundo da metade norte (mais funda) e o da metade sul */
const GRAMA = { a: 58, b: 39.5, r: 6 }, I = { a: 76, b: 49.5, r: 25 }, F_N = { a: 110.5, b: 79, r: 58 }, F_S = { a: 99.5, b: 79, r: 50 };
const DEG = (de, ate, mais) => ({ de, ate, fora: (de + ate) / 2 > 90 && (de + ate) / 2 < 270 ? F_S : F_N, cor: PT, cor2: PT2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 24, corEscada: ESC,
  vomitorios: false, paredeAtras: true, corFachada: BR, parapeito: 1.6, ...mais });
/* as pontas da coberta e as do letreiro, na beira de dentro */
const COB_N = A(49.7, 49.5), COB_S = A(-26.7, 49.5), LET_S = A(-36, -49.5), LET_N = A(36, -49.5);

export default {
  id: 'estadio-limeirao', nome: 'Limeirão', clubes: ['inter-de-limeira'], norte: 341, vazado: 0.4, folga: 26,
  corEscada: ESC,
  /* a vista de perto do prédio da coberta */
  vista: [11, 46, 190, 11, 10, 80],
  chao: { cor: '#6f8a55' },
  campo: { corMargem: '#55934f', pista: { dentro: GRAMA, fora: I, cor: '#6b6862', raias: 0 } },
  corMureta: '#e3e1da',
  aneis: [
    /* O ANEL; a altura acompanha a fundura */
    { dentro: I, fora: F_N, reto: true, h: [1.5, 13.5], inclinacao: 0.42, fileiras: 30,
      trechos: [
        /* a curva norte (à direita), até a ponta da coberta */
        DEG(LET_N - 360, 0), DEG(0, COB_N),
        /* a COBERTA: cadeira branca na frente, escura debaixo do telhado */
        { de: COB_N, ate: 90, fora: F_N, cor: '#e3e3de', padrao: 'fracoes', fracoes: [[0.3, '#e3e3de'], [1, '#2b2d33']], corredor: 19, corEscada: ESC, vomitorios: false, paredeAtras: true, corFachada: BR },
        { de: 90, ate: COB_S, fora: F_S, cor: '#e3e3de', padrao: 'fracoes', fracoes: [[0.3, '#e3e3de'], [1, '#2b2d33']], corredor: 19, escadaNaBorda: true, corEscada: ESC, vomitorios: false, paredeAtras: true, corFachada: BR },
        /* o resto do lado oeste, a curva sul (à esquerda) e o começo do lado leste */
        DEG(COB_S, 180, { escadaNaBorda: true }), DEG(180, LET_S),
        /* o INTER escrito no degrau, no meio do lado leste */
        DEG(LET_S, LET_N, { fora: F_N, corredor: 0, escadaNaBorda: true, cor: PT, cor2: PT, passoFileira: 0.45, celula: 0.4, texto: 'INTER', corTexto: BR, textoLargura: 0.9, textoAltura: 0.62 })
      ] }
  ],
  /* o telhado branco da coberta */
  telhados: [{ y: 18, h: 0.6, cor: '#eeeeea', pontos: [[-26.7, 60], [49.7, 60], [49.7, 79.5], [-26.7, 79.5]] }],
  fachada: { cor: BR },
  refletores: [],
  blocos: [
    /* o prédio alto de trás da coberta, com as faixas de janela e o A. A. INTERNACIONAL no alto */
    { u: 11.5, v: 84.5, w: 76, d: 10, h: 21, cor: '#e9e9e4' },
    ...[4, 8, 12, 16].map(y => ({ u: 11.5, v: 89.7, w: 74, d: 0.3, h: 1.4, y, cor: '#3a3d44' })),
    { u: 11.5, v: 89.8, w: 0.5, d: 70, h: 2.6, y: 18.2, cor: '#e9e9e4', giro: 90, texto: 'A. A. INTERNACIONAL', corTexto: '#17181b', textoFace: true, textoLargura: 0.94, textoAltura: 0.7 },
    /* a viga dos refletores por cima do fundo do lado leste, em dois postes */
    { u: 0, v: -80.5, w: 74, d: 1.6, h: 1.6, y: 23, cor: '#55585c' }, { u: -36, v: -80.5, w: 1.4, d: 1.4, h: 23, cor: '#55585c' }, { u: 36, v: -80.5, w: 1.4, d: 1.4, h: 23, cor: '#55585c' },
    /* as casinhas de telha por fora do muro: atrás dos dois gols e no meio do lado leste */
    { u: -104.5, v: 0, w: 9, d: 20, h: 9, cor: '#7f776c' }, { u: 115.5, v: 0, w: 9, d: 20, h: 9, cor: '#7f776c' }, { u: 8, v: -84.5, w: 17, d: 8, h: 9, cor: '#7f776c' },
    { u: -14.5, v: -83.5, w: 19, d: 6, h: 4, cor: '#e9e9e4' },
    /* os bancos de reserva, do lado da coberta */
    { u: -22, v: 41.5, w: 13, d: 1.8, h: 1.8, cor: '#2b2d33' }, { u: -1.5, v: 41.5, w: 5, d: 1.8, h: 1.8, cor: '#e9e9e4' }, { u: 6, v: 41.5, w: 5, d: 1.8, h: 1.8, cor: '#e9e9e4' },
    { u: 23, v: 41.5, w: 13, d: 1.8, h: 1.8, cor: '#2b2d33' }
  ],
  entorno: [
    /* em cima (oeste): o estacionamento; embaixo (leste): o pátio; em volta, o morro gramado, a avenida e as árvores */
    { tipo: 'estacionamento', u: 10, v: 108, w: 110, d: 24, cheio: 0.12 }, { tipo: 'grama', u: 0, v: -112, w: 110, d: 26, cor: '#77746e' },
    { tipo: 'rua', de: [-150, 130], ate: [150, 130], larg: 12 }, { tipo: 'rua', de: [148, 130], ate: [148, -130], larg: 12 },
    { tipo: 'arvores', u: 128, v: 70, w: 20, d: 50, n: 12 }, { tipo: 'arvores', u: -122, v: -70, w: 20, d: 50, n: 10 }, { tipo: 'arvores', u: 60, v: -104, w: 60, d: 10, n: 8 },
    { tipo: 'grama', u: -128, v: -108, w: 22, d: 20, cor: '#c9b18a' }
  ],
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Interror em cima do INTER, no meio do lado leste, e a visitante
     na curva sul (à esquerda); os outros bondes da casa na curva norte e ao lado da coberta */
  jogo: { mandante1: [255, 285], mandante2: [-15, 15], mandante3: [112, 135], visitante: [165, 195], tunelMandante: 270, tunelVisitante: 180, folgaPM: 5,
          fracao: { mandante1: 0.3, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { interror: 'mandante1' } }
};
