/* CONSELHEIRO GALVÃO (Aniceto Moscoso, Madureira, Rio de Janeiro) — pelo
   satélite e pelas quatro fotos que o dono mandou (16/11/2026): a tribuna
   social vista de cima, o estádio visto da curva, a tribuna de frente e a
   arquibancada vista da tribuna. O campo (100 x 68 m) corre quase norte-sul;
   no quadro o LESTE fica em cima e o NORTE à esquerda. Não achei mapa de
   setores. Estádio pequeno, apertado no meio do quarteirão:
   · EM CIMA (leste), a ARQUIBANCADA tricolor, descoberta, comprida, que dobra
     o canto e desce até a metade do fundo do sul. No satélite de hoje ela
     está em blocos: azul, grená, azul, grená, azul, com quatro FAIXAS
     AMARELAS no meio (a escada larga de degrau amarelo com a caixa amarela
     da entrada no pé). As fotos do dono, mais antigas, mostram as cadeiras
     azuis (as do Maracanã velho, de 2011) e, na curva e no fundo, o degrau
     pintado de azul e de grená, sem cadeira. Fiz: cadeira azul nos blocos
     azuis da reta (no satélite ainda se veem as fileiras), degrau pintado de
     grená nos blocos grená, degrau azul na curva. No alto, o muro branco das
     faixas (CAMPEÃO ESTADUAL JUVENIL 56-01-05); no pé, a mureta azul com as
     letras amarelas MADUREIRA ESPORTE CLUBE e a grade preta em cima.
   · EMBAIXO (oeste), a TRIBUNA SOCIAL coberta, de uns 48 m, no meio: as
     cadeiras azuis em cima de um muro azul, a passagem de grade branca no
     meio, o lance de cima na sombra, as cabines escuras no fundo, as paredes
     brancas dos lados e a laje com as placas solares; no pé, três casinhas
     brancas avançadas no gramado. O resto do lado é muro azul.
   · À ESQUERDA (norte), NÃO há arquibancada: o muro (pintado em três faixas,
     grená, amarela e azul, na metade do leste) colado nos galpões.
   · À DIREITA (sul), depois do bloco grená, só o muro, as árvores e os
     prédios; atrás do bloco grená, o prédio bege do placar.
   AS TORCIDAS (escolhas minhas, sem fonte): a Ultras Madureira no bloco azul
   do meio da arquibancada; a visitante na curva e no bloco grená do fundo. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const BR = '#f0efea', AM = '#dcb64c', GR = '#a33f43', GR2 = '#b24b4d', AZ = '#2f5cb4', AZ2 = '#3a69c0', AZP = '#4a80c6', AZP2 = '#5389cd', MURO = '#2b54a4';
/* a beira do gramado (a mureta azul com a grade preta), a passagem de cimento do pé da arquibancada (1,8 m) e o fundo de cada lance */
const I = { a: 55.5, b: 39.5, r: 5.5 }, C = d => ({ a: 55.5 + d, b: 39.5 + d, r: 5.5 + d });
const P0 = C(1.8), F = C(10), VP = 41.3, UP = 57.3;
const T = (u0, u1, mais) => ({ de: A(u0, VP), ate: A(u1, VP), corredor: 0, escadaNaBorda: false, vomitorios: false, paredeAtras: true, corFachada: BR, parapeito: 1.6, ...mais });
/* os blocos: a cadeira azul, o degrau pintado de grená e a faixa amarela com a caixa da entrada no pé */
const CADEIRA = { cor: AZ, cor2: AZ2, padrao: 'mosaico', mistura: 0.3 };
const GRENA = { cor: GR, cor2: GR2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corEspelho: '#8e363b' };
const AMARELA = { cor: AM, cor2: '#d3ad45', padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corEspelho: '#c9a43f', vomitorios: { f: 0, em: [0.5], larg: 3.6, fundo: 2.6, cor: '#2a2520', corParapeito: AM } };
const AZUL_PINTADO = { cor: AZP, cor2: AZP2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corEspelho: '#3f72b6' };
const FIM = A(UP, 11), T0 = A(-27, -VP), T1 = A(21, -VP);

export default {
  id: 'estadio-conselheiro-galvao', nome: 'Conselheiro Galvão', clubes: ['madureira'], norte: 197.8, vazado: 0.3, folga: 24,
  chao: { cor: '#7d7972' },
  campo: { c: 100, l: 68, corMargem: '#4f9150' },
  corMureta: '#b9b6ad', corAlambrado: '#22252a', corMuro: MURO,
  alambrado: { cor: '#22252a', corBase: MURO },
  aneis: [
    /* a passagem ao pé de tudo, por dentro da mureta azul com a grade preta: de cimento na frente da arquibancada, de grama no resto
       (é por ela que se passa da arquibancada pra tribuna) */
    { dentro: I, fora: P0, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: A(55.5, 11), ate: A(-49, 39.5), tipo: 'passagem', cor: '#b3b0a7' }, { de: A(-49, 39.5), ate: A(55.5, 11) + 360, tipo: 'passagem', cor: '#4f9150' }] },
    { dentro: P0, fora: F, reto: true, h: [0.4, 5.2], fileiras: 11, corredorFrente: 0.6,
      trechos: [
        /* À DIREITA (sul): o bloco grená do fundo, a faixa amarela e a curva de degrau azul */
        { ...T(0, 0), ...GRENA, de: FIM, ate: A(UP, 20.5) },
        { ...T(0, 0), ...AMARELA, de: A(UP, 20.5), ate: A(UP, 25) },
        { ...T(0, 0), ...AZUL_PINTADO, de: A(UP, 25), ate: A(50, VP) },
        /* EM CIMA (leste): a reta, do sul pro norte */
        T(50, 39, CADEIRA), T(39, 34.5, AMARELA), T(34.5, 14, GRENA), T(14, 9.5, AMARELA), T(9.5, -11, CADEIRA),
        T(-11, -16, AMARELA), T(-16, -36.5, GRENA), T(-36.5, -41.5, AMARELA), T(-41.5, -50, CADEIRA),
        /* À ESQUERDA (norte): sem arquibancada */
        { de: A(-50, VP), ate: T0, tipo: 'vazio' },
        /* EMBAIXO (oeste): o lance de baixo da tribuna social, em cima do muro azul */
        { de: T0, ate: T1, fora: C(8.3), h: [1.6, 5.2], fileiras: 9, corredorFrente: 0, ...CADEIRA, corredor: 7, corEscada: '#cdd2d6', escadaNaBorda: false, vomitorios: false },
        { de: T1, ate: FIM + 360, tipo: 'vazio' }
      ] },
    /* o lance de cima da tribuna, depois da passagem de grade branca */
    { dentro: C(8.3), fora: C(13.3), reto: true, h: [5.8, 8.4], fileiras: 5, corredorFrente: 1.2, corMureta: BR,
      trechos: [
        { de: A(-27, -47.8), ate: A(21, -47.8), ...CADEIRA, corredor: 7, corEscada: '#cdd2d6', escadaNaBorda: false, vomitorios: false, paredeAtras: true, corFachada: BR, parapeito: 3.2 },
        { de: A(21, -47.8), ate: A(-27, -47.8) + 360, tipo: 'vazio' }] }
  ],
  /* a laje da tribuna (sem sombra nas vistas de conferência) */
  telhados: [{ y: 11.6, h: 0.35, cor: '#e9e6e3', sombra: false, pontos: [[-27.6, -44.5], [21.6, -44.5], [21.6, -55], [-27.6, -55]] }],
  fachada: { cor: BR },
  /* sem refletores: nas fotos do dono não há torre nenhuma */
  refletores: [],
  blocos: [
    /* a mureta azul do pé da arquibancada, com as letras amarelas, e o muro branco das faixas no alto */
    { u: 36.5, v: 39.3, w: 0.25, d: 24, h: 1.05, cor: MURO, texto: 'MADUREIRA   ESPORTE   CLUBE', corTexto: AM, textoFace: true, giro: -90, textoLargura: 0.96, textoAltura: 0.62 },
    { u: 20, v: 49.7, w: 0.3, d: 36, h: 1.5, y: 5.3, cor: BR, texto: 'CAMPEÃO ESTADUAL JUVENIL 56-01-05', corTexto: MURO, textoFace: true, giro: -90, textoLargura: 0.9, textoAltura: 0.5 },
    /* o banco coberto de azul, ao pé da arquibancada */
    { u: 17, v: 37.7, w: 12, d: 2.2, h: 2.1, cor: MURO },
    /* a tribuna: a beirada azul-clara da laje, as placas solares, as paredes brancas, as cabines escuras e as colunas */
    { u: -3, v: -44.4, w: 49.2, d: 0.5, h: 0.6, y: 11.3, cor: '#8fc0e2', cobertura: true },
    { u: -21.8, v: -49.6, w: 4.4, d: 9.4, h: 0.12, y: 11.96, cor: '#303c56', cobertura: true },
    { u: -8.3, v: -47.8, w: 15, d: 6, h: 0.12, y: 11.96, cor: '#303c56', cobertura: true },
    { u: 11.4, v: -47.6, w: 18.8, d: 5.6, h: 0.12, y: 11.96, cor: '#303c56', cobertura: true },
    { u: -27.4, v: -50.5, w: 0.5, d: 9, h: 11.6, cor: BR }, { u: 21.4, v: -50.5, w: 0.5, d: 9, h: 11.6, cor: BR },
    { u: -3, v: -54.4, w: 49.2, d: 1.2, h: 11.6, cor: BR }, { u: -3, v: -53.5, w: 44, d: 0.6, h: 2.4, y: 8.8, cor: '#30343b' },
    ...[-19, -11, -3, 5, 13].map(u => ({ u, v: -47.4, w: 0.35, d: 0.35, h: 5.8, y: 5.8, cor: '#dfe3e6' })),
    /* as três casinhas brancas do pé da tribuna, avançadas no gramado */
    ...[-23.5, -3, 17.5].map(u => ({ u, v: -38, w: 6.4, d: 3, h: 2.3, cor: '#edece7' })),
    /* as duas marquises azuis do muro do lado oeste (o muro azul de fora, o gerador levanta sozinho) */
    { u: -31.5, v: -42.4, w: 8, d: 2, h: 0.3, y: 2.6, cor: '#3d66b3' }, { u: 28.5, v: -42.4, w: 6.5, d: 2, h: 0.3, y: 2.6, cor: '#3d66b3' },
    /* o muro do norte: na metade do leste, as três faixas (azul embaixo, amarela e grená) */
    { u: -57.7, v: 21.5, w: 1.1, d: 39, h: 1.2, y: 1.6, cor: AM }, { u: -57.7, v: 21.5, w: 1.1, d: 39, h: 1.2, y: 2.8, cor: '#8f3237' },
    /* o prédio bege do placar, atrás do bloco grená */
    { u: 69.8, v: 18, w: 7, d: 13, h: 11, cor: '#d8ceb0' }, { u: 66.2, v: 21, w: 0.3, d: 6, h: 2.6, y: 8, cor: '#1b1d20' },
    { u: 66.2, v: 14.6, w: 0.3, d: 5, h: 2.6, y: 8, cor: MURO, texto: 'MEC', corTexto: AM, textoFace: true, giro: 180, textoLargura: 0.7, textoAltura: 0.6 }
  ],
  /* a câmera de uma foto do dono: da tribuna, olhando a arquibancada e a curva */
  vista: [-14, 7.5, -47, 34, 3, 40],
  entorno: [
    /* à esquerda (norte): os dois galpões colados no muro */
    { tipo: 'predio', u: -72, v: 30, w: 26, d: 40, h: 9, cor: '#77736c' }, { tipo: 'predio', u: -71, v: -4, w: 24, d: 27, h: 8, cor: '#dcd6c7' },
    /* em cima (leste): as casas coladas no fundo da arquibancada e a rua */
    { tipo: 'casas', u: 0, v: 61, nu: 9, nv: 1, passo: 14 }, { tipo: 'rua', de: [-140, 72], ate: [140, 72], larg: 8 }, { tipo: 'casas', u: 0, v: 86, nu: 14, nv: 1, passo: 15 },
    /* à direita (sul): as árvores atrás do gol e os prédios */
    { tipo: 'arvores', u: 63, v: -4, w: 6, d: 16, n: 3 }, { tipo: 'predio', u: 78, v: -18, w: 28, d: 32, h: 9, cor: '#e3ddcd', giro: -28 },
    { tipo: 'predio', u: 76, v: -52, w: 40, d: 26, h: 8, cor: '#8a857d' },
    /* embaixo (oeste): o estacionamento, o prédio branco do clube, as árvores, a piscina e o campo de grama sintética */
    { tipo: 'estacionamento', u: -42, v: -51.5, w: 24, d: 13, cheio: 0.35 }, { tipo: 'predio', u: 31, v: -51, w: 16, d: 14, h: 9, cor: BR },
    { tipo: 'arvores', u: 48, v: -50, w: 12, d: 8, n: 4 },
    { tipo: 'rua', de: [-56, -60], ate: [24, -60], larg: 6 }, { tipo: 'quadra', u: -12, v: -74, w: 52, d: 20, cor: '#2f8a52' },
    { tipo: 'piscina', u: -52, v: -70, w: 6, d: 12 }, { tipo: 'rua', de: [-140, -100], ate: [140, -100], larg: 12 }
  ],
  jogo: { mandante1: [78, 103], mandante2: [113, 132], mandante3: [245, 290], visitante: [13, 38], tunelMandante: 270, tunelVisitante: 30, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { ultras_madureira: 'mandante1' } }
};
