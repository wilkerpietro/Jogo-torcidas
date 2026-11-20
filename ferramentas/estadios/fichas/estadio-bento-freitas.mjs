/* BENTO FREITAS (Grêmio Esportivo Brasil, Pelotas) — pelo satélite e pelas
   fotos de referência (14/11/2026). O campo é quase norte-sul; no quadro o
   SUL fica à DIREITA, o NORTE à esquerda, o LESTE em cima e o OESTE (a
   social e a rua) embaixo. Retangular, de cantos chanfrados, com três
   arquibancadas velhas de degrau pintado em U e o lado oeste picado.
   · À DIREITA (sul), a arquibancada do letreiro: funda, de faixas vermelhas
     e pretas, com o muro preto no alto escrito A MAIOR E MAIS FIEL e a
     cabine escura em cima.
   · EM CIMA (leste), a arquibancada comprida e mais baixa, de faixas
     vermelhas e pretas, com o escudo (GEB) pintado no meio, as placas no
     alto e os dois postes de refletor atrás; depois, o terreno baldio e a
     avenida do canal.
   · À ESQUERDA (norte), a outra arquibancada de fundo, igual à do sul sem
     o letreiro; atrás dela, os prédios altos.
   · EMBAIXO (oeste), da direita pra esquerda: a social de DOIS lances
     (cadeira vermelha; o de cima com as escadas amarelas, debaixo do
     telhado claro), o degrau baixo com o prédio vermelho das cabines atrás
     e, na ponta norte, o pátio sem arquibancada com a torre do refletor. */
const VM = '#c4484b', VM2 = '#b23f43';                  /* o vermelho desbotado */
const PT = '#2b2728';                                   /* o preto */
const CAD = '#d2413f', CAD2 = '#c13836';                /* a cadeira vermelha da social */
/* a beira do gramado e a de fora (o leste tem 13 m de fundura; os fundos, 17 m) */
const D = { a: 58, b: 39.5, r: 2 }, F = { a: 75, b: 52.5, r: 9 };
/* o oeste: o fim do lance de baixo da social, o fim do lance de cima e o fim do degrau baixo das cabines */
const SO_1 = { a: 75, b: 53, r: 9 }, SO_2 = { a: 75, b: 64, r: 9 }, CAB = { a: 75, b: 46.5, r: 9 };
const FAIXAS = { padrao: 'faixas', cores: [VM, VM, PT], faixaM: 1.1, semCadeiras: true, corredor: 0, paredeAtras: true, corFachada: PT };
const BOCAS = em => ({ f: 0.4, larg: 3.6, fundo: 3.2, em });

export default {
  id: 'estadio-bento-freitas', nome: 'Bento Freitas', clubes: ['brasil-de-pelotas'], norte: 199, vazado: 0.4, folga: 24,
  corEscada: '#d98f8f',
  chao: { cor: '#8d8981' },
  campo: { corMargem: '#4c8f4e' },
  corMureta: PT, corAlambrado: '#3a3536',
  aneis: [
    /* O LANCE DE BAIXO: o U das três arquibancadas velhas e, embaixo, o lance de baixo da social e o degrau das cabines */
    { dentro: D, fora: F, reto: true, h: [2.2, 8.6], fileiras: 14,
      trechos: [
        /* o sul (à direita), a do letreiro: mais alta, com o muro preto no alto */
        { de: -32.9, ate: 32.9, ...FAIXAS, h: [2.2, 11], parapeito: 2.8, vomitorios: BOCAS([0.157, 0.396, 0.607, 0.85]) },
        /* a quina sudeste e o leste, a do escudo */
        { de: 32.9, ate: 35.2, ...FAIXAS, h: [2.2, 9.6], vomitorios: false },
        { de: 35.2, ate: 144.8, ...FAIXAS, passoFileira: 0.45, celula: 0.4, parapeito: 1, texto: 'GEB', corTexto: '#f1efe9', textoLargura: 0.12, textoAltura: 0.66, vomitorios: BOCAS([0.1, 0.26, 0.42, 0.61, 0.78, 0.94]) },
        /* a quina nordeste e o norte (à esquerda) */
        { de: 144.8, ate: 147.1, ...FAIXAS, h: [2.2, 9.4], vomitorios: false },
        { de: 147.1, ate: 212.9, ...FAIXAS, h: [2.2, 10.4], parapeito: 1.6, vomitorios: BOCAS([0.15, 0.39, 0.61, 0.85]) },
        /* a ponta norte do oeste: o pátio sem arquibancada */
        { de: 212.9, ate: 250.5, tipo: 'vazio' },
        /* o degrau baixo na frente do prédio das cabines */
        { de: 250.5, ate: 301.3, fora: CAB, h: [1.4, 4.4], cor: VM, cor2: VM2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 19, corEscada: '#e9e4de', vomitorios: false },
        /* a social, lance de baixo: três blocos de cadeira vermelha */
        { de: 301.3, ate: 324.8, fora: SO_1, h: [1.6, 7.6], cor: CAD, cor2: CAD2, padrao: 'mosaico', mistura: 0.3, corredor: 10.6, escadaNaBorda: true, corEscada: '#e7b9b6', vomitorios: false, paredeAtras: true },
        /* a quina sudoeste: o chanfro que fecha na arquibancada do letreiro */
        { de: 324.8, ate: 327.1, ...FAIXAS, h: [2.2, 9.6], vomitorios: false }
      ] },
    /* O LANCE DE CIMA DA SOCIAL: cadeira vermelha, escadas amarelas, debaixo do telhado claro */
    { dentro: SO_1, fora: SO_2, reto: true, h: [9.6, 15.2], fileiras: 12, corredorFrente: 1.6,
      trechos: [
        { de: 294.4, ate: 316.6, cor: CAD, cor2: CAD2, padrao: 'mosaico', mistura: 0.3, corredor: 10.6, corEscada: '#e6c43c', vomitorios: { f: 0.1, larg: 3.6, fundo: 3, em: [0.3] } }
      ] }
  ],
  fachada: { cor: '#5a5354' },
  refletores: [[-24, 57, 30], [24, 57, 30], [-44, -53, 32], [40, -66, 26]],
  blocos: [
    /* SUL: o muro preto do letreiro no alto da arquibancada e a cabine escura em cima */
    { u: 76.2, v: 0, w: 66, d: 3.4, h: 0.4, y: 13.8, cor: PT, giro: -90, texto: 'A MAIOR E MAIS FIEL', corTexto: '#f3f1ec', textoLargura: 0.94, textoAltura: 0.78 },
    { u: 80.4, v: -8, w: 4, d: 9, h: 5, y: 9.5, cor: '#2c3236' },
    /* LESTE: as placas no alto da arquibancada */
    { u: 0, v: 53, w: 104, d: 0.5, h: 2.2, y: 8.6, cor: '#eeece6' },
    /* OESTE: o telhado claro da social, o prédio vermelho das cabines com a laje clara e os bancos de reserva */
    { u: 40, v: -59, w: 34, d: 11.6, h: 0.5, y: 20, cor: '#d6d9db', cobertura: true },
    { u: 5, v: -50.6, w: 38, d: 7.6, h: 8.4, cor: '#c7474f' }, { u: 5, v: -50.6, w: 39, d: 8.2, h: 0.4, y: 8.4, cor: '#e7e3dd' },
    { u: -9, v: -37.2, w: 7, d: 1.8, h: 1.8, cor: '#dfe6ea' }, { u: 12, v: -37.2, w: 7, d: 1.8, h: 1.8, cor: '#dfe6ea' },
    /* o pátio da ponta norte do oeste: o sobrado vermelho e os barracões */
    { u: -34, v: -47, w: 14, d: 9, h: 6.5, cor: '#b3413f' }, { u: -50, v: -45, w: 9, d: 6, h: 3.2, cor: '#cfc9c0' }
  ],
  entorno: [
    /* o leste (em cima): o terreno baldio, a avenida do canal em diagonal e as casas da ponta sul */
    { tipo: 'grama', u: 12, v: 78, w: 150, d: 44, cor: '#84905a' },
    { tipo: 'rua', de: [-170, 44], ate: [120, 124], larg: 15 },
    { tipo: 'casas', u: 100, v: 80, nu: 3, nv: 3, passo: 13 },
    /* o sul (à direita): as casas encostadas na arquibancada do letreiro */
    { tipo: 'casas', u: 96, v: -6, nu: 2, nv: 8, passo: 12.5 }, { tipo: 'casas', u: 128, v: -6, nu: 1, nv: 8, passo: 12.5 },
    /* o norte (à esquerda): o prédio branco colado na ponta da arquibancada e o conjunto alto atrás */
    { tipo: 'predio', u: -90, v: -44, w: 18, d: 18, h: 27, cor: '#e9e9e6', cor2: '#9aa3ab' },
    { tipo: 'predio', u: -104, v: 6, w: 34, d: 56, h: 32, cor: '#e2e3e1', cor2: '#8f9aa3' },
    { tipo: 'predio', u: -140, v: -30, w: 22, d: 40, h: 12, cor: '#d5d2ca' },
    /* o oeste (embaixo): o prédio rosado atrás da social, a rua e as casas */
    { tipo: 'predio', u: 16, v: -64.5, w: 20, d: 12, h: 17, cor: '#dcc5bb', cor2: '#a9aeb3' },
    { tipo: 'rua', de: [-170, -79], ate: [170, -79], larg: 9 },
    { tipo: 'casas', u: -38, v: -62, nu: 4, nv: 1, passo: 12 },
    { tipo: 'casas', u: 0, v: -100, nu: 19, nv: 2, passo: 12.5 }
  ],
  /* a Comando Rubro-Negro na arquibancada do letreiro (sul); a visitante na arquibancada do norte; os outros bondes da casa
     no leste e na social */
  jogo: { mandante1: [-17, 17], mandante2: [72, 108], mandante3: [304, 322], visitante: [162, 198], tunelMandante: 4, tunelVisitante: 184, folgaPM: 5,
          torcidas: { comando_rubro_negro: 'mandante1' } }
};
