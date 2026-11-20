/* COLOSSO DA LAGOA (Ypiranga, Erechim) — pelo satélite e pelas fotos de
   referência (14/11/2026). Inaugurado em 1970. O campo é quase norte-sul;
   no quadro o SUL fica à DIREITA, o LESTE em cima e o OESTE (a coberta e a
   avenida) embaixo, igual à foto de drone do clube, com o letreiro de pé.
   Um oval de degrau de cimento pintado em volta da pista de atletismo,
   fechado do lado oeste pela arquibancada social coberta.
   · EM CIMA (leste), a reta do letreiro: verde, com SÓCIO CANARINHO escrito
     duas vezes em amarelo. Atrás dela, as árvores e os campos de treino.
   · AS QUATRO CURVAS são amarelas, com YFC em verde.
   · AS PONTAS (norte à esquerda, sul à direita): verde, amarelo no meio,
     verde. No meio da ponta sul, a casinha branca em cima do degrau.
   · EMBAIXO (oeste), a SOCIAL COBERTA, de dois lances: o de baixo com três
     blocos de cadeira branca no meio (o do meio em fundo amarelo, os outros
     em fundo verde) e o degrau amarelo nas pontas; o de cima debaixo do
     telhado de zinco, claro e manchado de ferrugem, em cinco blocos verdes
     e amarelos alternados. Atrás, a fachada, a bola
     gigante amarela e verde e a avenida.
   · O ovalzinho da ferradura encosta na social por dois pedaços verdes. */
const VD = '#2f8a4a', VD2 = '#297d43';                  /* o verde */
const AM = '#f0cf2e', AM2 = '#e3c127';                  /* o amarelo */
const BR = '#ecece7', BR2 = '#dadad4';
const ZINCO = '#d9d6d0', FERRUGEM = '#bf8a77';
/* a pista (6 raias), a beira de dentro e a de fora do oval */
const PISTA_D = { a: 70, b: 41.5, r: 20 }, PISTA_F = { a: 77, b: 51, r: 27 };
const OV_D = { a: 78, b: 52, r: 28 }, OV_F = { a: 90.5, b: 66, r: 41 };
/* a social: a frente reta, o fim do lance de baixo e o fim do lance de cima */
const SO_D = { a: 78, b: 52.5, r: 24 }, SO_1 = { a: 90.5, b: 63, r: 36 }, SO_2 = { a: 90.5, b: 73.5, r: 36 };
const DEGRAU = { padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corredor: 0, vomitorios: false, paredeAtras: true };
const VERDE = { ...DEGRAU, cor: VD, cor2: VD2 }, AMARELO = { ...DEGRAU, cor: AM, cor2: AM2 };
/* o degrau do letreiro é desenhado mais fino (meio degrau, meia cadeira), pra letra sair legível */
const FINO = { passoFileira: 0.45, celula: 0.4 };
const YFC = { ...AMARELO, ...FINO, texto: 'YFC', corTexto: VD, textoLargura: 0.62, textoAltura: 0.74 };
const SOCIAL = { dentro: SO_D, fora: SO_1, h: [1.2, 6.2], vomitorios: false };

export default {
  id: 'estadio-colosso-da-lagoa', nome: 'Colosso da Lagoa', clubes: ['ypiranga-rs'], norte: 157, vazado: 0.38, folga: 26,
  corEscada: '#e6e4d8',
  chao: { cor: '#8f8b82' },
  campo: { corMargem: '#4a9450', pista: { dentro: PISTA_D, fora: PISTA_F, cor: '#77736c', raias: 6 } },
  corMureta: '#e4e3dc',
  aneis: [
    /* O LANCE DE BAIXO: o oval de degrau pintado e, embaixo, o lance de baixo da social */
    { dentro: OV_D, fora: OV_F, reto: true, h: [1.6, 8], fileiras: 13,
      trechos: [
        /* a ponta sul (à direita), do meio pra cima; a curva sudeste */
        { de: 0, ate: 5.9, ...AMARELO }, { de: 5.9, ate: 17.1, ...VERDE, escadaNaBorda: true },
        { de: 17.1, ate: 46.1, ...YFC, escadaNaBorda: true },
        /* a reta do leste: SÓCIO CANARINHO duas vezes */
        { de: 46.1, ate: 90, ...VERDE, escadaNaBorda: true, ...FINO, texto: 'SÓCIO CANARINHO', corTexto: AM, textoLargura: 0.88, textoAltura: 0.62 },
        { de: 90, ate: 133.9, ...VERDE, escadaNaBorda: true, ...FINO, texto: 'SÓCIO CANARINHO', corTexto: AM, textoLargura: 0.88, textoAltura: 0.62 },
        /* a curva nordeste e a ponta norte (à esquerda) */
        { de: 133.9, ate: 162.9, ...YFC, escadaNaBorda: true },
        { de: 162.9, ate: 174.1, ...VERDE, escadaNaBorda: true }, { de: 174.1, ate: 185.9, ...AMARELO, escadaNaBorda: true }, { de: 185.9, ate: 197.1, ...VERDE, escadaNaBorda: true },
        /* a curva noroeste e o pedaço verde que encosta na social */
        { de: 197.1, ate: 216.6, ...YFC, escadaNaBorda: true }, { de: 216.6, ate: 224.7, ...VERDE, escadaNaBorda: true },
        /* a social, lance de baixo (do norte pro sul): degrau amarelo, três blocos de cadeira branca (o do meio em fundo amarelo), degrau amarelo */
        { de: 224.7, ate: 237.1, ...SOCIAL, ...AMARELO, paredeAtras: false, escadaNaBorda: true, corEscada: BR },
        { de: 237.1, ate: 257.1, ...SOCIAL, cor: BR, cor2: VD, padrao: 'mosaico', mistura: 0.28, corredor: 7.2, escadaNaBorda: true, corEscada: VD },
        { de: 257.1, ate: 280.8, ...SOCIAL, cor: BR, cor2: AM, padrao: 'mosaico', mistura: 0.3, corredor: 7.2, escadaNaBorda: true, corEscada: AM },
        { de: 280.8, ate: 300.6, ...SOCIAL, cor: BR, cor2: VD, padrao: 'mosaico', mistura: 0.28, corredor: 7.2, escadaNaBorda: true, corEscada: VD },
        { de: 300.6, ate: 315.3, ...SOCIAL, ...AMARELO, paredeAtras: false, escadaNaBorda: true, corEscada: VD },
        /* o pedaço verde, a curva sudoeste e a ponta sul, de baixo pro meio */
        { de: 315.3, ate: 323.4, ...VERDE, escadaNaBorda: true, corEscada: BR }, { de: 323.4, ate: 342.9, ...YFC },
        { de: 342.9, ate: 354.1, ...VERDE, escadaNaBorda: true }, { de: 354.1, ate: 360, ...AMARELO, escadaNaBorda: true }
      ] },
    /* O LANCE DE CIMA DA SOCIAL, debaixo do telhado: cinco blocos de degrau, verde e amarelo alternados */
    { dentro: SO_1, fora: SO_2, reto: true, h: [8.4, 13.6], fileiras: 11, corredorFrente: 1.6,
      trechos: [[229.4, 242.8, VD, VD2], [242.8, 260.3, AM, AM2], [260.3, 279.7, VD, VD2], [279.7, 297.2, AM, AM2], [297.2, 310.6, VD, VD2]].map(([de, ate, cor, cor2]) =>
        ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corredor: 0, escadaNaBorda: true, vomitorios: false })) }
  ],
  fachada: { cor: '#d9d6cb' },
  refletores: [[-62, 71, 30], [62, 71, 30], [-60, -57, 30], [60, -57, 30]],
  blocos: [
    /* OESTE: o telhado de zinco manchado de ferrugem, a testeira verde, a mureta das placas e a fachada */
    { u: -0.5, v: -67.9, w: 106, d: 19.4, h: 0.6, y: 17.6, cor: ZINCO, cobertura: true },
    { u: 14, v: -67, w: 26, d: 13, h: 0.2, y: 18.2, cor: FERRUGEM, cobertura: true }, { u: 44, v: -69, w: 9, d: 15, h: 0.2, y: 18.2, cor: FERRUGEM, cobertura: true },
    { u: -24, v: -72, w: 12, d: 8, h: 0.2, y: 18.2, cor: FERRUGEM, cobertura: true }, { u: -44, v: -65, w: 7, d: 6, h: 0.2, y: 18.2, cor: '#c79a8a', cobertura: true },
    { u: -0.5, v: -58.4, w: 106, d: 0.5, h: 1.4, y: 16.4, cor: '#256b3b', cobertura: true },
    { u: -0.5, v: -63.3, w: 105, d: 0.6, h: 1.8, y: 6.4, cor: '#eeeee9' },
    { u: -0.5, v: -75.6, w: 106, d: 4, h: 17.4, cor: '#d8cf9c' },
    /* a casinha branca em cima do degrau, no meio da ponta sul, e os bancos de reserva do lado da social */
    { u: 85.5, v: 0, w: 6, d: 5, h: 3, y: 5.4, cor: '#f1f1ec' },
    { u: -11, v: -38, w: 7, d: 1.8, h: 1.8, cor: '#eeeeea' }, { u: 11, v: -38, w: 7, d: 1.8, h: 1.8, cor: '#eeeeea' },
    /* a sede branca na ponta sul da social */
    { u: 62, v: -70, w: 13, d: 13, h: 7, cor: '#e9e9e5' }
  ],
  entorno: [
    /* o leste (em cima): as árvores e os campos de treino */
    { tipo: 'grama', u: -10, v: 124, w: 250, d: 86, cor: '#5a9a4e' },
    { tipo: 'arvores', u: -25, v: 75, w: 130, d: 9, n: 18 }, { tipo: 'arvores', u: 72, v: 78, w: 26, d: 14, n: 6 },
    /* o norte (à esquerda): a rua, os galpões e as casas */
    { tipo: 'rua', de: [-101, -160], ate: [-101, 160], larg: 8 },
    { tipo: 'predio', u: -128, v: -60, w: 30, d: 58, h: 7, cor: '#dcdcd8', cor2: '#b9b9b4' }, { tipo: 'casas', u: -126, v: 30, nu: 2, nv: 4, passo: 14 },
    /* o sul (à direita): a rua de chão, o estacionamento e as árvores */
    { tipo: 'rua', de: [100, -160], ate: [100, 160], larg: 9 },
    { tipo: 'estacionamento', u: 132, v: -45, w: 40, d: 70, cheio: 0.3 }, { tipo: 'arvores', u: 126, v: 40, w: 30, d: 70, n: 22 },
    /* o oeste (embaixo): as árvores, a bola gigante, a avenida e os prédios do outro lado */
    { tipo: 'arvores', u: -5, v: -88, w: 120, d: 8, n: 12 },
    { tipo: 'cupula', u: -20, v: -95, r: 2.6, h: 3.4, cor: '#f0cf2e', cor2: '#2f8a4a' },
    { tipo: 'rua', de: [-260, -108], ate: [260, -108], larg: 16 },
    { tipo: 'predio', u: -70, v: -142, w: 34, d: 28, h: 34, cor: '#dfe3e6', cor2: '#8fa1ad' }, { tipo: 'estacionamento', u: -20, v: -140, w: 40, d: 30, cheio: 0.5 },
    { tipo: 'predio', u: 40, v: -145, w: 50, d: 34, h: 8, cor: '#e2e0d8' }, { tipo: 'casas', u: 118, v: -140, nu: 4, nv: 2, passo: 14 }
  ],
  /* a Mancha do Ypiranga na reta do letreiro; a visitante na curva nordeste; os outros bondes da casa na ponta sul e na social */
  jogo: { mandante1: [58, 84], mandante2: [343.5, 353.5], mandante3: [255, 285], visitante: [137, 161], tunelMandante: 70, tunelVisitante: 149, folgaPM: 5,
          torcidas: { mancha_do_ypiranga: 'mandante1' } }
};
