/* PASSO D'AREIA (Francisco Novelletto Neto — E.C. São José, Porto Alegre) —
   pelo satélite e pelas fotos de referência (14/11/2026). O campo (sintético)
   é norte-sul; no quadro o NORTE fica à DIREITA e o OESTE em cima. Um
   estádio pequeno e fechado, à inglesa: três arquibancadas cobertas,
   coladas nas linhas do campo, de cadeira azul com escadas amarelas, e um
   fundo sem arquibancada.
   · EM CIMA (oeste), a SOCIAL: as cadeiras azul-marinho e azuis, as
     fileiras da frente descobertas, a laje de concreto por cima das de trás
     e das cabines de vidro; os bancos de reserva na frente e as torres de
     refletor atrás.
   · EMBAIXO (leste), a arquibancada comprida debaixo do telhado claro de
     zinco em pilares azuis, com as cadeiras brancas nas fileiras da frente;
     colada nela, a avenida de duas pistas.
   · À DIREITA (norte), o fundo do telhado largo NÃO TEM ARQUIBANCADA (dono,
     14/11/2026: "o gol oeste do Passo d'Areia não tem arquibancada"): é o
     prédio do clube, com o paredão claro das placas (Aspecir) no alto e as
     portas escuras no térreo, logo atrás do gol.
   · À ESQUERDA (sul), o fundo menor, coberto, com o estacionamento atrás.
   · As quatro quinas são pisos de concreto debaixo das pontas dos telhados. */
const PAREDAO = '#d8d2c5';
const AZ = '#2f61b3', AZ2 = '#27539b';                  /* o azul */
const MAR = '#1f3b70', MAR2 = '#1a3261';                /* o azul-marinho */
const BR = '#e9ebec';
const AM = '#e3c33a';
const ZINCO = '#cfd2d3', LAJE = '#adafac';
/* a beira do campo (as arquibancadas ficam a 3 m das linhas) e as de fora de cada lado
   (o raio de fora deixa o lado reto do tamanho do de dentro, pra arquibancada sair retangular) */
const D = { a: 55.5, b: 37, r: 2 };
const LADO = { a: 71.5, b: 51, r: 18 }, NORTE = { a: 59, b: 53, r: 18 }, SUL = { a: 68.5, b: 53, r: 18 };
const CADEIRA = { padrao: 'mosaico', mistura: 0.3, corredor: 9.2, corEscada: AM, vomitorios: false, paredeAtras: true, corFachada: '#dfe3e6' };
const PISO = { tipo: 'passagem', cor: '#a8a59c' };

export default {
  id: 'estadio-passo-dareia', nome: "Passo d'Areia", clubes: ['sao-jose'], norte: 0, vazado: 0.36, folga: 24,
  corEscada: AM,
  chao: { cor: '#8d8981' },
  campo: { corMargem: '#3f8a4a' },
  corMureta: '#2f61b3',
  aneis: [
    { dentro: D, fora: LADO, reto: true, h: [1.2, 8], fileiras: 15,
      trechos: [
        /* o norte (à direita): sem arquibancada, só a faixa de piso entre o gol e o paredão do prédio */
        { de: -32.2, ate: 32.2, fora: NORTE, ...PISO },
        { de: 32.2, ate: 34.7, ...PISO },
        /* o oeste (em cima), a social: marinho embaixo, azul em cima */
        { de: 34.7, ate: 145.3, ...CADEIRA, padrao: 'fracoes', fracoes: [[0.5, MAR], [1, AZ]], escadaNaBorda: true },
        { de: 145.3, ate: 147.8, ...PISO },
        /* o sul (à esquerda): o fundo menor, com as cadeiras brancas na frente */
        { de: 147.8, ate: 212.2, fora: SUL, h: [1.2, 7.6], ...CADEIRA, padrao: 'fracoes', fracoes: [[0.22, BR], [1, AZ]] },
        { de: 212.2, ate: 214.7, ...PISO },
        /* o leste (embaixo): as cadeiras brancas na frente, o azul atrás */
        { de: 214.7, ate: 325.3, h: [1.2, 8.6], ...CADEIRA, padrao: 'fracoes', fracoes: [[0.25, BR], [0.62, AZ], [1, MAR]], escadaNaBorda: true },
        { de: 325.3, ate: 327.8, ...PISO }
      ] }
  ],
  fachada: { cor: '#dfe3e6' },
  refletores: [[-32, 69, 28], [28, 69, 28], [-30, -56, 26], [34, -56, 26]],
  blocos: [
    /* OESTE: a laje de concreto por cima das fileiras de trás e das cabines, a testeira azul e o prédio das cabines */
    { u: -4.5, v: 56, w: 115, d: 20, h: 0.6, y: 13.4, cor: LAJE, cobertura: true },
    { u: -4.5, v: 46.2, w: 115, d: 0.5, h: 1.2, y: 12.4, cor: '#2f61b3', cobertura: true },
    { u: -4.5, v: 58.6, w: 113, d: 14.6, h: 12.6, cor: '#dfe3e6' },
    /* LESTE: o telhado claro de zinco e a testeira azul */
    { u: 2.5, v: -43.4, w: 110, d: 18.4, h: 0.5, y: 12.6, cor: ZINCO, cobertura: true },
    { u: 2.5, v: -34.4, w: 110, d: 0.5, h: 1.1, y: 11.7, cor: '#2f61b3', cobertura: true },
    /* NORTE: o prédio do clube atrás do gol (o paredão claro), o telhado largo dele, a faixa escura das portas no térreo
       e as placas no alto do paredão */
    { u: 72.3, v: 4, w: 25.4, d: 90, h: 12.4, cor: PAREDAO },
    { u: 72, v: 4, w: 27, d: 92, h: 0.5, y: 12.4, cor: '#d6d9da' },
    { u: 59.3, v: 4, w: 0.5, d: 84, h: 3, cor: '#2a2f36' },
    { u: 59.3, v: 2, w: 0.5, d: 20, h: 3.4, y: 7.6, cor: '#2e7a57' }, { u: 59.3, v: 26, w: 0.5, d: 8, h: 2.6, y: 8, cor: '#c8443f' },
    { u: 59.3, v: 17, w: 0.5, d: 7, h: 2, y: 8.3, cor: '#b9b2a2' }, { u: 59.3, v: -15, w: 0.5, d: 12, h: 2, y: 8.3, cor: '#b9b2a2' }, { u: 59.3, v: -26, w: 0.5, d: 6, h: 2.6, y: 8, cor: '#2f4a8f' },
    /* SUL: o telhado e a testeira */
    { u: -63.2, v: -0.5, w: 19, d: 78, h: 0.5, y: 11.6, cor: '#c8cbcc', cobertura: true },
    { u: -53.9, v: -0.5, w: 0.5, d: 78, h: 1.1, y: 10.7, cor: '#2f61b3', cobertura: true },
    /* os bancos de reserva, do lado da social */
    { u: -10, v: 35.2, w: 7, d: 1.6, h: 1.8, cor: '#d7e3ee' }, { u: 10, v: 35.2, w: 7, d: 1.6, h: 1.8, cor: '#d7e3ee' }
  ],
  entorno: [
    /* o leste (embaixo): a avenida de duas pistas com o canteiro de árvores, as casas e o terreno de obra do outro lado */
    { tipo: 'rua', de: [-220, -62], ate: [220, -62], larg: 11 }, { tipo: 'rua', de: [-220, -79], ate: [220, -79], larg: 9 },
    { tipo: 'arvores', u: 20, v: -70.5, w: 150, d: 3, n: 12 },
    { tipo: 'casas', u: 46, v: -104, nu: 9, nv: 2, passo: 13 }, { tipo: 'grama', u: -84, v: -112, w: 104, d: 46, cor: '#c2ad8f' },
    /* o norte (à direita): a rua, o ginásio e a quadra do outro lado */
    { tipo: 'rua', de: [95, -220], ate: [95, 220], larg: 10 },
    { tipo: 'predio', u: 117, v: -17, w: 23, d: 36, h: 8, cor: '#d9d9d5', cor2: '#a34a45' }, { tipo: 'quadra', u: 119, v: 18, w: 30, d: 17 },
    { tipo: 'casas', u: 118, v: 62, nu: 2, nv: 4, passo: 13 }, { tipo: 'casas', u: 118, v: -78, nu: 2, nv: 3, passo: 13 },
    /* o oeste (em cima): o prédio de apartamentos, as casas e os galpões */
    { tipo: 'predio', u: 1, v: 79, w: 44, d: 16, h: 14, cor: '#d8d6cf', cor2: '#9aa3ab' },
    { tipo: 'casas', u: 58, v: 82, nu: 4, nv: 2, passo: 12.5 }, { tipo: 'casas', u: -52, v: 82, nu: 4, nv: 2, passo: 12.5 },
    { tipo: 'casas', u: 0, v: 116, nu: 16, nv: 2, passo: 13 },
    /* o sul (à esquerda): o estacionamento, as árvores e os prédios de telhado solar */
    { tipo: 'estacionamento', u: -88, v: -40, w: 28, d: 28, cheio: 0.25 }, { tipo: 'arvores', u: -88, v: 24, w: 26, d: 30, n: 14 },
    { tipo: 'predio', u: -86, v: -6, w: 22, d: 28, h: 6, cor: '#d5d5d2', cor2: '#3a4657' },
    { tipo: 'predio', u: -122, v: 26, w: 30, d: 24, h: 8, cor: '#3a4657' }, { tipo: 'predio', u: -124, v: -22, w: 28, d: 40, h: 9, cor: '#cfd0cd', cor2: '#3a4657' }
  ],
  /* Os Farrapos na arquibancada do leste; a visitante no fundo do sul; os outros bondes da casa na social e na ponta norte do leste */
  jogo: { mandante1: [238, 274], mandante2: [72, 108], mandante3: [296, 320], visitante: [164, 196], tunelMandante: 256, tunelVisitante: 180, folgaPM: 5,
          torcidas: { os_farrapos: 'mandante1' } }
};
