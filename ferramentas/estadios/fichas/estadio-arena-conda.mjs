/* ARENA CONDÁ (Chapecoense, Chapecó) — pelo satélite e pelas fotos de
   referência (14/11/2026); o meio do campo foi tirado do círculo central. O
   campo é norte-sul; no quadro o NORTE fica à DIREITA e o OESTE em cima.
   Quatro arquibancadas retas, separadas nos cantos (onde ficam as torres dos
   refletores), cada uma de um jeito:
   · EM CIMA (oeste), a COBERTA: cadeira verde com as escadas amarelas e os
     blocos de cadeira branca no alto; as fileiras da frente descobertas, o
     telhado claro por cima das de trás; os bancos de reserva na frente.
   · EMBAIXO (leste), a arquibancada descoberta de degrau de cimento, com as
     escadas amarelas, as duas bocas grandes de vomitório no meio do lance e
     o tablado com o escudo na frente, no meio.
   · À ESQUERDA (sul), o fundo descoberto, também de cimento com as escadas
     amarelas, com as três bocas de vomitório na frente, as placas no alto e
     o telão.
   · À DIREITA (norte), o fundo do prédio: a arquibancada debaixo do telhado
     verde grande e, atrás dela, o prédio branco de escritórios; depois, a
     praça do chafariz e a rua com os carros. */
const CIM = '#bdbbb0', CIM2 = '#b1afa3';                /* o degrau de cimento */
const VD = '#2f9460', VD2 = '#288453';                  /* a cadeira verde */
const BR = '#e6e8e3';
const AM = '#e8c531';
const VERDE = '#1f9a57';
/* a frente de cada lado: o norte a 58 m do meio, o leste a 42, o oeste a 46 (os bancos ficam na frente) e o sul a 63 */
const D = { a: 58, b: 42, r: 2 };
const O_D = { a: 62, b: 46, r: 2 }, O_F = { a: 62, b: 74, r: 2 };          /* oeste: de u = -59 a 50, 28 m de fundura */
const N_D = { a: 58, b: 50, r: 2 }, N_F = { a: 78, b: 50, r: 2 };          /* norte: 20 m */
const L_D = { a: 64, b: 42, r: 2 }, L_F = { a: 64, b: 65, r: 2 };          /* leste: 23 m */
const S_D = { a: 63, b: 51, r: 2 }, S_F = { a: 85, b: 51, r: 2 };          /* sul: 22 m */
const CIMENTO = { cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corEscada: AM, escadaNaBorda: true, paredeAtras: true, corFachada: VERDE };
/* os cantos: um piso de concreto entre uma arquibancada e a outra */
const PISO = (de, ate, dentro) => ({ de, ate, tipo: 'passagem', cor: '#a8a59b', dentro, fora: { a: dentro.a + 8, b: dentro.b + 8, r: 8 } });

export default {
  id: 'estadio-arena-conda', nome: 'Arena Condá', clubes: ['chapecoense'], norte: 0, vazado: 0.38, folga: 42,
  corEscada: AM,
  chao: { cor: '#8d8981' },
  campo: { corMargem: '#3f8f4b' },
  corMureta: VERDE,
  aneis: [
    { dentro: D, fora: N_F, reto: true, h: [1.5, 12.5], fileiras: 24,
      trechos: [
        /* o fundo norte (à direita), debaixo do telhado verde */
        { de: -34.59, ate: 38.42, dentro: N_D, fora: N_F, h: [1.5, 11.5], cor: VD, cor2: VD2, padrao: 'mosaico', mistura: 0.3, corredor: 17, corEscada: AM, vomitorios: false, paredeAtras: true },
        PISO(38.42, 42.61, { a: 58, b: 46, r: 2 }),
        /* o oeste (em cima), a coberta: verde, com os blocos brancos no alto do meio */
        { de: 42.61, ate: 73.3, dentro: O_D, fora: O_F, h: [1.5, 15.5], cor: VD, cor2: VD2, padrao: 'mosaico', mistura: 0.3, corredor: 17, corEscada: AM, escadaNaBorda: true, paredeAtras: true,
          vomitorios: { f: 0.36, larg: 4, fundo: 4, em: [0.56] } },
        { de: 73.3, ate: 113.5, dentro: O_D, fora: O_F, h: [1.5, 15.5], padrao: 'fracoes', fracoes: [[0.5, VD], [0.92, BR], [1, VD]], corredor: 17, corEscada: AM, escadaNaBorda: true, paredeAtras: true,
          vomitorios: { f: 0.36, larg: 4, fundo: 4, em: [0.52] } },
        { de: 113.5, ate: 142.06, dentro: O_D, fora: O_F, h: [1.5, 15.5], cor: VD, cor2: VD2, padrao: 'mosaico', mistura: 0.3, corredor: 17, corEscada: AM, escadaNaBorda: true, paredeAtras: true,
          vomitorios: { f: 0.36, larg: 4, fundo: 4, em: [0.42] } },
        PISO(142.06, 143.86, { a: 63, b: 46, r: 2 }),
        /* o fundo sul (à esquerda): cimento, com as três bocas na frente */
        { de: 143.86, ate: 211.89, dentro: S_D, fora: S_F, ...CIMENTO, corredor: 28, parapeito: 2.6, vomitorios: { f: 0.04, larg: 7, fundo: 5, em: [0.14, 0.475, 0.837] } },
        PISO(211.89, 214.11, { a: 63, b: 42, r: 2 }),
        /* o leste (embaixo): cimento, com as duas bocas grandes no meio do lance */
        { de: 214.11, ate: 323.47, dentro: L_D, fora: L_F, h: [1.5, 13], ...CIMENTO, corredor: 19.6, parapeito: 2.2, vomitorios: { f: 0.48, larg: 9, fundo: 7.5, em: [0.2, 0.69] } },
        PISO(323.47, 325.41, { a: 58, b: 42, r: 2 })
      ] }
  ],
  fachada: { cor: '#dfe2de' },
  /* as quatro torres dos refletores, nos cantos, fora das arquibancadas */
  refletores: [[-72, -52, 32], [65, -56, 32], [56, 61, 32], [-68, 55, 32]],
  blocos: [
    /* OESTE: o telhado claro por cima das fileiras de trás, a testeira verde e os bancos de reserva */
    { u: -4.5, v: 65.2, w: 109, d: 18, h: 0.6, y: 20, cor: '#d2d4d3', cobertura: true },
    { u: -4.5, v: 56.1, w: 109, d: 0.5, h: 1.2, y: 19, cor: VERDE, cobertura: true },
    { u: -22, v: 42.6, w: 14, d: 1.8, h: 1.8, cor: '#e9eef0' }, { u: -2, v: 42.6, w: 9, d: 1.8, h: 1.8, cor: '#e9eef0' }, { u: 15, v: 42.6, w: 14, d: 1.8, h: 1.8, cor: '#e9eef0' },
    /* NORTE: o telhado verde grande e o prédio branco de escritórios atrás da arquibancada */
    { u: 76.2, v: 3.7, w: 31, d: 91, h: 0.8, y: 23, cor: VERDE, cobertura: true },
    { u: 85.4, v: 3.7, w: 12.4, d: 90, h: 22, cor: '#eef0ee' },
    { u: 91.7, v: 3.7, w: 0.4, d: 16, h: 16, y: 3, cor: VERDE },
    /* LESTE: o tablado com o escudo na frente da arquibancada, no meio */
    { u: -13.8, v: -43.6, w: 7, d: 5, h: 3.2, cor: VERDE }, { u: -13.8, v: -43.6, w: 5.6, d: 3.8, h: 0.2, y: 3.2, cor: '#f1f3ef' }, { u: -13.8, v: -43.6, w: 3, d: 3, h: 0.2, y: 3.4, cor: VERDE, giro: 45 },
    /* SUL: as placas no alto da arquibancada e o telão */
    { u: -85.6, v: 3.5, w: 0.5, d: 84, h: 2.4, y: 13.6, cor: '#eef0ec' },
    { u: -85.2, v: -4, w: 1, d: 9, h: 5, y: 14.2, cor: '#1b1c20' }
  ],
  entorno: [
    /* o oeste (em cima): a rua e as casas com árvores */
    { tipo: 'rua', de: [-220, 92], ate: [220, 92], larg: 11 },
    { tipo: 'arvores', u: 0, v: 102, w: 180, d: 6, n: 16 }, { tipo: 'casas', u: 0, v: 124, nu: 16, nv: 2, passo: 13 },
    { tipo: 'predio', u: -80, v: 66, w: 10, d: 10, h: 6, cor: '#d9d6cd' },
    /* o norte (à direita): a praça do chafariz, a rua com os carros parados e os prédios */
    { tipo: 'piscina', u: 84, v: 67, w: 9, d: 9 },
    { tipo: 'estacionamento', u: 103, v: 6, w: 14, d: 110, cheio: 0.7 },
    { tipo: 'rua', de: [117, -220], ate: [117, 220], larg: 10 },
    { tipo: 'predio', u: 142, v: 40, w: 22, d: 26, h: 34, cor: '#e3e1da', cor2: '#9aa3ab' }, { tipo: 'casas', u: 144, v: -30, nu: 2, nv: 6, passo: 13 },
    /* o leste (embaixo): os galpões de telhado branco colados na arquibancada e a rua */
    { tipo: 'predio', u: -32, v: -82, w: 70, d: 17, h: 8, cor: '#e7e7e3' }, { tipo: 'predio', u: 48, v: -96, w: 38, d: 20, h: 9, cor: '#c9c6bb' },
    { tipo: 'rua', de: [-220, -112], ate: [220, -112], larg: 10 }, { tipo: 'casas', u: 0, v: -134, nu: 16, nv: 2, passo: 13 },
    /* o sul (à esquerda): a rua com os carros e os prédios */
    { tipo: 'estacionamento', u: -98, v: -6, w: 12, d: 96, cheio: 0.5 },
    { tipo: 'rua', de: [-110, -220], ate: [-110, 220], larg: 10 },
    { tipo: 'predio', u: -134, v: 30, w: 22, d: 30, h: 28, cor: '#e6e4de', cor2: '#9aa3ab' }, { tipo: 'casas', u: -136, v: -40, nu: 2, nv: 6, passo: 13 }
  ],
  /* a Jovem Chape no fundo sul; a visitante na ponta norte da arquibancada do leste (as duas escolhas minhas, sem fonte);
     os outros bondes da casa no leste e na coberta */
  jogo: { mandante1: [164, 194], mandante2: [245, 272], mandante3: [80, 108], visitante: [301, 321], tunelMandante: 178, tunelVisitante: 296, folgaPM: 5,
          torcidas: { jovem_chape: 'mandante1' } }
};
