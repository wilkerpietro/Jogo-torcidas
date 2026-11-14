/* BOCA DO LOBO (Esporte Clube Pelotas, Pelotas) — pelo satélite e pelas fotos
   de referência (14/11/2026). O campo é quase norte-sul (o fundo da geral é o
   do norte-nordeste); no quadro a GERAL fica à ESQUERDA, o fundo do 1908 à
   direita, a arquibancada ECP e a avenida em cima (pro letreiro sair de pé)
   e a COBERTA embaixo. Retangular, de quatro lados diferentes, tudo em
   degrau de cimento pintado de azul com letra amarela.
   · EM CIMA (lado da avenida), a arquibancada comprida com E C P em
     amarelo, as escadas amarelas, a boca do túnel na frente e os dois
     postes de refletor atrás.
   · À DIREITA (fundo sul), a arquibancada do 1908 em amarelo, com a faixa
     amarela LOBÃO A MAIOR PAIXÃO no alto e a boca azul do túnel na frente.
     Não pega o fundo inteiro: fica deslocada pro lado da avenida. Atrás, os
     prédios de tijolo.
   · À ESQUERDA (fundo norte), a GERAL, a maior e mais funda, azul-escura,
     com o círculo do escudo pintado, a boca do túnel na frente e as duas
     torres de refletor atrás.
   · EMBAIXO, o degrau baixo ao longo do campo e, no meio dele pro lado do
     1908, a COBERTA de dois lances debaixo da marquise de concreto com as
     nervuras; ao lado, a sede; na esquina, o quiosque redondo. */
const AZ = '#2f61a6', AZ2 = '#28548f';                  /* o azul */
const AZE = '#27457a', AZE2 = '#223d6c';                /* o azul-escuro da geral */
const AM = '#e6c63c';                                   /* o amarelo */
const CONC = '#b8b2a3';
/* a beira do gramado e a de fora (ECP e 1908 com 16 m de fundura; a geral com 28 m; o degrau baixo com 7,5 m) */
/* (o raio de fora deixa o lado reto de fora do tamanho do de dentro: assim cada arquibancada sai retangular, sem abrir em leque) */
const D = { a: 62.5, b: 41.5, r: 2 }, F = { a: 78.5, b: 57.5, r: 18 };
const GERAL = { a: 90.5, b: 57.5, r: 18 }, BAIXO = { a: 78.5, b: 49, r: 18 };
/* a coberta: o fim do lance de baixo e o fim do lance de cima */
const CO_1 = { a: 78.5, b: 60, r: 18 }, CO_2 = { a: 78.5, b: 70, r: 18 };
const FINO = { passoFileira: 0.45, celula: 0.4 };
const DEGRAU = { cor: AZ, cor2: AZ2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, paredeAtras: true, corFachada: '#3c5f95' };
const PISO = { tipo: 'passagem', cor: '#a9a59b' };
/* as nervuras da marquise da coberta */
const NERVURAS = Array.from({ length: 9 }, (_, i) => ({ u: -2.5 + i * 5.06, v: -63, w: 0.6, d: 19.6, h: 0.9, y: 19.5, cor: '#8d887c', cobertura: true }));

export default {
  id: 'estadio-boca-do-lobo', nome: 'Boca do Lobo', clubes: ['pelotas'], norte: 202, vazado: 0.4, folga: 24,
  corEscada: AM,
  chao: { cor: '#8d8981' },
  campo: { corMargem: '#4b8f4d' },
  corMureta: '#2c4f8a',
  aneis: [
    /* O LANCE DE BAIXO: as quatro arquibancadas e os pisos das quinas */
    { dentro: D, fora: F, reto: true, h: [1.6, 9], fileiras: 16,
      trechos: [
        /* o fundo do 1908 (à direita) */
        { de: -20.4, ate: 30.4, ...DEGRAU, ...FINO, corredor: 15, faixaTopo: { n: 3, cor: AM }, texto: '1908', corTexto: AM, textoLargura: 0.8, textoAltura: 0.56, textoMeio: 0.46,
          vomitorios: { f: 0, larg: 5, fundo: 5, em: [0.28] } },
        { de: 30.4, ate: 39.7, ...PISO },
        /* a arquibancada E C P (em cima) */
        { de: 39.7, ate: 140.3, ...DEGRAU, ...FINO, corredor: 16.6, texto: 'E   C   P', corTexto: AM, textoLargura: 0.62, textoAltura: 0.6, vomitorios: { f: 0, larg: 5, fundo: 5, em: [0.67] } },
        { de: 140.3, ate: 149.6, ...PISO },
        /* a geral (à esquerda): o pedaço de cima e o do círculo do escudo, com a boca do túnel na divisa */
        { de: 149.6, ate: 163.6, fora: GERAL, h: [1.6, 14.5], ...DEGRAU, cor: AZE, cor2: AZE2, corredor: 0, vomitorios: { f: 0, larg: 5, fundo: 5, em: [1] } },
        { de: 163.6, ate: 212.3, fora: GERAL, h: [1.6, 14.5], ...DEGRAU, ...FINO, cor: AZE, cor2: AZE2, corredor: 19, corEscada: '#c9b24a', texto: 'O', corTexto: '#7f9ccb', textoLargura: 0.2, textoAltura: 0.5,
          vomitorios: { f: 0, larg: 5, fundo: 5, em: [0] } },
        { de: 212.3, ate: 216.1, ...PISO },
        /* o degrau baixo ao longo do campo (embaixo): azul com a beira amarela */
        { de: 216.1, ate: 323, fora: BAIXO, h: [1, 4.2], cor: AZ, cor2: AZ2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 18, faixaBase: { n: 2, cor: AM }, vomitorios: false },
        { de: 323, ate: 339.6, ...PISO }
      ] },
    /* A COBERTA, lance de baixo e lance de cima, debaixo da marquise */
    { dentro: BAIXO, fora: CO_1, reto: true, h: [4.8, 9.6], fileiras: 10, corredorFrente: 1.4,
      trechos: [{ de: 266.5, ate: 307.8, cor: '#2a4d86', cor2: '#223f70', padrao: 'mosaico', mistura: 0.3, corredor: 13.6, corEscada: AM, vomitorios: false, paredeAtras: true, corFachada: '#2f61a6' }] },
    { dentro: CO_1, fora: CO_2, reto: true, h: [11.2, 15.6], fileiras: 9, corredorFrente: 1.4,
      trechos: [{ de: 267.1, ate: 302.3, cor: AZ, cor2: AZ2, padrao: 'mosaico', mistura: 0.3, corredor: 13.6, corEscada: AM, vomitorios: false }] }
  ],
  fachada: { cor: '#3c5f95' },
  refletores: [[-30, 60, 28], [30, 60, 28], [-94, 24, 32], [-94, -24, 32], [-9, -74, 30], [44, -74, 30]],
  blocos: [
    /* o 1908: a faixa amarela LOBÃO A MAIOR PAIXÃO no alto do muro */
    { u: 79.6, v: 6.6, w: 58, d: 2.6, h: 0.4, y: 10.6, cor: AM, giro: -90, texto: 'LOBÃO A MAIOR PAIXÃO', corTexto: '#2f61a6', textoLargura: 0.9, textoAltura: 0.74 },
    /* a coberta: a marquise de concreto com as nervuras, a fileira de refletores na beira, a parede amarela das cabines e as empenas azuis */
    { u: 17.5, v: -63, w: 42.5, d: 20, h: 0.6, y: 19, cor: CONC, cobertura: true }, ...NERVURAS,
    { u: 17.5, v: -52.8, w: 40, d: 0.5, h: 0.8, y: 19.6, cor: '#eef0f1', cobertura: true },
    { u: 17.5, v: -71.6, w: 41.6, d: 2.2, h: 19, cor: '#3f66a3' }, { u: 17.5, v: -70.3, w: 40.4, d: 0.4, h: 3.4, y: 15.6, cor: '#e0c64a' },
    { u: -3.9, v: -62, w: 0.6, d: 17, h: 19, cor: '#2f61a6' }, { u: 38.9, v: -62, w: 0.6, d: 17, h: 19, cor: '#2f61a6' },
    /* os bancos de reserva, do lado da coberta */
    { u: -10, v: -38.6, w: 7, d: 1.8, h: 1.8, cor: '#e9eef2' }, { u: 12, v: -38.6, w: 7, d: 1.8, h: 1.8, cor: '#e9eef2' }
  ],
  entorno: [
    /* em cima: a avenida com os carros parados e as casas do outro lado */
    { tipo: 'rua', de: [-220, 69], ate: [220, 69], larg: 15 },
    { tipo: 'predio', u: 16, v: 92, w: 30, d: 16, h: 8, cor: '#d9d6cd' }, { tipo: 'casas', u: -62, v: 94, nu: 6, nv: 2, passo: 13 }, { tipo: 'casas', u: 86, v: 94, nu: 6, nv: 2, passo: 13 },
    /* à direita: os prédios de tijolo atrás do 1908 */
    { tipo: 'predio', u: 93, v: 22, w: 15, d: 22, h: 13, cor: '#b65c42', cor2: '#e8e2d8' }, { tipo: 'predio', u: 93, v: -6, w: 15, d: 20, h: 13, cor: '#b65c42', cor2: '#e8e2d8' },
    { tipo: 'predio', u: 94, v: 46, w: 16, d: 16, h: 15, cor: '#e6e4de', cor2: '#9aa3ab' }, { tipo: 'casas', u: 126, v: 8, nu: 2, nv: 8, passo: 13 },
    /* embaixo: a sede ao lado da coberta, o prédio do outro lado, o quiosque redondo, o terreno de obra, a rua e a praça */
    { tipo: 'predio', u: -21, v: -62, w: 31, d: 15, h: 7, cor: '#8f8c85', cor2: '#6f6c66' }, { tipo: 'predio', u: 50, v: -61, w: 19, d: 20, h: 7, cor: '#77736d' },
    { tipo: 'cupula', u: 71, v: -62, r: 8.5, h: 4, cor: '#d9caa4', cor2: '#cfcabd' },
    { tipo: 'grama', u: -70, v: -60, w: 28, d: 26, cor: '#b6a88b' },
    { tipo: 'rua', de: [-220, -84], ate: [220, -84], larg: 12 },
    { tipo: 'arvores', u: 0, v: -110, w: 300, d: 30, n: 70 },
    /* à esquerda: a rua e as casas atrás da geral */
    { tipo: 'rua', de: [-100, -220], ate: [-100, 220], larg: 9 }, { tipo: 'casas', u: -124, v: 0, nu: 2, nv: 9, passo: 13 }
  ],
  /* a Força Jovem na geral; a visitante no fundo do 1908; os outros bondes da casa na arquibancada ECP e no degrau da coberta */
  jogo: { mandante1: [168, 204], mandante2: [72, 108], mandante3: [276, 300], visitante: [-12, 24], tunelMandante: 163.6, tunelVisitante: -6, folgaPM: 5,
          torcidas: { forca_jovem_pelotas: 'mandante1' } }
};
