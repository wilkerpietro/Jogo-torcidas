/* ARENA JOINVILLE (Joinville Esporte Clube, Joinville) — pelo satélite e
   pelas fotos de referência (14/11/2026). No satélite o gramado está sendo
   refeito (terra); o meio do campo saiu do meio do retângulo de terra. O
   campo é norte-sul; no quadro o NORTE fica à DIREITA e o OESTE em cima.
   Um anel fechado de um lance só, de planta retangular com os quatro cantos
   chanfrados, colado nas linhas do campo, todo de cadeira vermelha, branca
   e preta (o vermelho embaixo, o preto no alto), com a fachada de tijolo
   vermelho por fora.
   · EM CIMA (oeste), a COBERTA: o lance de baixo, a faixa escura das
     cabines e o lance de cima, tudo debaixo do telhado claro e remendado,
     que vem até a beira do campo, com as duas caixas-d'água em cima; atrás,
     o prédio dos acessos.
   · EMBAIXO (leste), a arquibancada descoberta, com as bocas dos
     vomitórios, e as duas torres de refletor atrás; depois, o pátio de
     terra do estacionamento.
   · À ESQUERDA (sul) e À DIREITA (norte), os dois fundos descobertos; no
     meio do fundo norte, um bloco sem cadeira (só o degrau de cimento).
     Atrás do sul, as torres brancas das escadas; atrás do norte, a galeria
     e a avenida. */
const VM = '#c23a4a', BR = '#ececea', PT = '#2b2b30';
/* de baixo pra cima: vermelho e branco, depois preto e branco, salpicado */
const CADEIRA = { padrao: 'degrade', cores: [VM, BR, VM, BR, PT, BR, PT], mistura: 1.3, cor: VM, corEscada: '#d9d6cc', paredeAtras: true, corFachada: '#b5482f' };
const TETO = '#e6dcc4', REMENDO = '#aeb1b3';
/* a frente (3 m das linhas) e o fundo, 24 m atrás; os cantos são concêntricos */
const D = { a: 60, b: 41, r: 3 }, F = { a: 84, b: 65, r: 27 };
/* a coberta: o fim do lance de baixo (14 m) e o fim do lance de cima */
const W_1 = { a: 74, b: 55, r: 17 }, W_2 = { a: 87, b: 68, r: 30 };
/* os cantos: só o degrau pintado, em duas faixas lisas (o rosado do vermelho com branco embaixo, o cinza do preto com
   branco em cima); cadeira solta abre em leque e vira risco, e o salpicado sai em blocos grandes demais */
const CANTO = { padrao: 'fracoes', fracoes: [[0.5, '#d08a92'], [1, '#8d8d90']], semCadeiras: true, corredor: 0, vomitorios: false, paredeAtras: true, corFachada: '#b5482f' };
const VOM = em => ({ f: 0.28, larg: 4.4, fundo: 4.4, em });

export default {
  id: 'estadio-arena-joinville', nome: 'Arena Joinville', clubes: ['joinville'], norte: 0, vazado: 0.36, folga: 22,
  corEscada: '#d9d6cc',
  chao: { cor: '#9a958a' },
  campo: { corMargem: '#3f8f4b' },
  corMureta: '#e9e8e2',
  aneis: [
    { dentro: D, fora: F, reto: true, h: [1.5, 13], fileiras: 26,
      trechos: [
        /* o fundo norte (à direita): cadeira, o bloco de cimento sem cadeira no meio, cadeira */
        { de: -32.3, ate: -10.4, ...CADEIRA, corredor: 0, escadaNaBorda: true, vomitorios: VOM([0.14]) },
        { de: -10.4, ate: 11.8, cor: '#c2c0b8', cor2: '#b5b3aa', padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 0, escadaNaBorda: true, vomitorios: false, paredeAtras: true, corFachada: '#b5482f' },
        { de: 11.8, ate: 32.3, ...CADEIRA, corredor: 0, escadaNaBorda: true, vomitorios: VOM([0.86]) },
        /* o canto noroeste */
        { de: 32.3, ate: 35.7, ...CANTO },
        /* o oeste (em cima), o lance de baixo da coberta */
        { de: 35.7, ate: 144.3, fora: W_1, h: [1.5, 7.5], cor: VM, cor2: BR, padrao: 'mosaico', mistura: 0.45, corredor: 19, corEscada: '#d9d6cc', escadaNaBorda: true, vomitorios: false },
        /* o canto sudoeste e o fundo sul (à esquerda) */
        { de: 144.3, ate: 147.7, ...CANTO },
        { de: 147.7, ate: 212.3, ...CADEIRA, corredor: 24, escadaNaBorda: true, vomitorios: VOM([0.07, 0.35, 0.68, 0.93]) },
        /* o canto sudeste, o leste (embaixo) e o canto nordeste */
        { de: 212.3, ate: 215.7, ...CANTO },
        { de: 215.7, ate: 324.3, ...CADEIRA, corredor: 0, vomitorios: VOM([0.19, 0.38, 0.65, 0.84]) },
        { de: 324.3, ate: 327.7, ...CANTO }
      ] },
    /* O LANCE DE CIMA DA COBERTA, atrás da faixa das cabines */
    { dentro: W_1, fora: W_2, reto: true, h: [10.5, 16], fileiras: 12, corredorFrente: 3,
      trechos: [{ de: 44, ate: 136, cor: VM, cor2: BR, padrao: 'mosaico', mistura: 0.45, corredor: 19, corEscada: '#d9d6cc', escadaNaBorda: true, vomitorios: false, paredeAtras: true, corFachada: '#b5482f' }] }
  ],
  fachada: { cor: '#b5482f' },
  /* as duas torres do leste, atrás da arquibancada */
  refletores: [[-28, -70, 36], [30, -70, 36]],
  blocos: [
    /* OESTE: o telhado claro e remendado até a beira do campo, as duas caixas-d'água, a faixa escura das cabines e o prédio dos acessos */
    { u: 0, v: 56.3, w: 123.4, d: 34, h: 0.6, y: 22, cor: TETO, cobertura: true },
    { u: -34.5, v: 47, w: 17.5, d: 16, h: 0.2, y: 22.6, cor: REMENDO, cobertura: true }, { u: 19, v: 48, w: 36.5, d: 16, h: 0.2, y: 22.6, cor: REMENDO, cobertura: true },
    { u: 53, v: 53, w: 17, d: 8, h: 0.2, y: 22.6, cor: REMENDO, cobertura: true }, { u: -52, v: 43.5, w: 18, d: 8, h: 0.2, y: 22.6, cor: REMENDO, cobertura: true },
    { u: -19, v: 67.5, w: 10, d: 8, h: 4, y: 22.6, cor: '#8f8c84', cobertura: true }, { u: 17.5, v: 67.5, w: 10, d: 8, h: 4, y: 22.6, cor: '#8f8c84', cobertura: true },
    { u: 0, v: 56.5, w: 112, d: 2.6, h: 3, y: 7.5, cor: '#2c2f33' },
    { u: -1.5, v: 80, w: 53, d: 13, h: 12, cor: '#8f8c86' },
    /* os bancos de reserva (vermelhos), do lado da coberta */
    { u: -11, v: 39.3, w: 9, d: 1.6, h: 1.8, cor: '#c8463f' }, { u: 11, v: 39.3, w: 9, d: 1.6, h: 1.8, cor: '#c8463f' },
    /* SUL: as torres brancas das escadas; NORTE: a galeria comprida */
    { u: -92, v: 6.5, w: 6, d: 10, h: 15, cor: '#ecebe6' }, { u: -92, v: -13.5, w: 6, d: 10, h: 15, cor: '#ecebe6' }, { u: -90, v: -44, w: 5, d: 5, h: 13, cor: '#ecebe6' },
    { u: 91, v: 0, w: 12, d: 72, h: 6, cor: '#cfc9bd' }
  ],
  entorno: [
    /* o oeste (em cima): os galpões da fábrica vizinha */
    { tipo: 'predio', u: -40, v: 112, w: 150, d: 30, h: 9, cor: '#bdb9ae', cor2: '#a9a59b' }, { tipo: 'predio', u: 95, v: 112, w: 60, d: 30, h: 9, cor: '#d5d3cd' },
    { tipo: 'arvores', u: 105, v: 70, w: 26, d: 30, n: 10 },
    /* o norte (à direita): a avenida com as palmeiras */
    { tipo: 'arvores', u: 106, v: -10, w: 8, d: 150, n: 12 },
    { tipo: 'rua', de: [118, -220], ate: [118, 220], larg: 14 }, { tipo: 'casas', u: 146, v: 0, nu: 2, nv: 12, passo: 13 },
    /* o leste (embaixo): o pátio de terra do estacionamento */
    { tipo: 'grama', u: 0, v: -112, w: 300, d: 76, cor: '#b3a78f' },
    { tipo: 'estacionamento', u: 10, v: -78, w: 74, d: 8, cheio: 0.25 },
    /* o sul (à esquerda): o terreno de terra e o mato */
    { tipo: 'grama', u: -136, v: 20, w: 60, d: 150, cor: '#a89c85' }, { tipo: 'arvores', u: -150, v: -70, w: 50, d: 60, n: 30 }
  ],
  /* a União Tricolor no fundo sul e a visitante no fundo norte (as duas escolhas minhas, sem fonte); os outros bondes da
     casa no leste e na coberta */
  jogo: { mandante1: [164, 196], mandante2: [250, 290], mandante3: [72, 108], visitante: [14, 32], tunelMandante: 180, tunelVisitante: 30, folgaPM: 5,
          torcidas: { uniao_tricolor: 'mandante1' } }
};
