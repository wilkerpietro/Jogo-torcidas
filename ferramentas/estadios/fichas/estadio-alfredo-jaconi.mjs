/* ESTÁDIO ALFREDO JACONI (Juventude, Caxias do Sul) — pelo satélite e pelas
   fotos de referência (14/11/2026). Inaugurado em 1975; 19.924 lugares pela
   CBF (o clube fala em 23.726). O campo é norte-sul; no quadro o NORTE fica à
   DIREITA e o OESTE em cima. Retangular, de cantos pequenos, colado no
   gramado do lado leste e com a faixa dos bancos do lado oeste.
   · EM CIMA (oeste), o lado das SOCIAIS, o maior: o lance de baixo
     descoberto (branco nas pontas, verde e branco no meio) e, atrás dele, o
     lance de cima de cadeira verde debaixo da cobertura cinza, que hoje tem
     as placas solares em cima e a fileira de refletores na beira. Atrás, o
     prédio branco do clube, a torre treliçada e o estacionamento.
   · EMBAIXO (leste), a arquibancada COBERTA de ponta a ponta: o degrau
     branco de cimento embaixo, a faixa verde em cima, as cabines escuras no
     fundo e a cobertura cinza com os postes verdes dos refletores na beira
     da frente. As casas do bairro encostam nela.
   · À DIREITA (norte), a FERRADURA NORTE: o degrau de cimento pintado de
     verde, sem cadeira, e atrás dele o barranco de grama com as escadas
     brancas, o muro verde das placas e o placar; depois, o mato. A ponta
     oeste dela (do vão da escada até a quina) é a da visitante, que entra
     pelo portão 5, na São João.
   · À ESQUERDA (sul), a FERRADURA SUL, igual, com a passarela de concreto
     em cima, dando pra rua; a Mancha Verde fica na metade leste dela.
   · As quatro quinas são leques de degrau de cimento claro. */
const JAC_V = '#2f9d62', JAC_V2 = '#288f58';            /* o verde pintado das ferraduras */
const JAC_CAD = '#3aa364', JAC_CAD2 = '#2f8f57';        /* a cadeira verde */
const JAC_BR = '#e6e8e1', JAC_BR2 = '#d3d7cf';          /* o branco (cadeira e degrau caiado) */
const JAC_CIM = '#d7d6ce', JAC_CIM2 = '#cbcac2';        /* o cimento claro das quinas */
const JAC_TETO = '#a6a8a7', JAC_POSTE = '#2c7a4b';
/* os contornos: o lado oeste fica a 9,5 m da linha lateral (os bancos), o leste a 4 m */
const O_DENTRO = { a: 62, b: 43.5, r: 8 }, O_FORA = { a: 76, b: 56.5, r: 22 };
const L_DENTRO = { a: 62, b: 38, r: 8 }, L_FORA = { a: 76, b: 54.5, r: 22 };
const LESTE = { dentro: L_DENTRO, fora: L_FORA };
/* o lance de cima do oeste e a passarela da Ferradura Sul */
const O_CIMA = { a: 76, b: 66, r: 22 };
const PASS_O = { a: 79.5, b: 60, r: 25.5 }, PASS_L = { a: 79.5, b: 58, r: 25.5 };
const FERRADURA = { cor: JAC_V, cor2: JAC_V2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 0 };
const QUINA = { cor: JAC_CIM, cor2: JAC_CIM2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 0, paredeAtras: true };
/* os postes verdes dos refletores na beira da cobertura do leste */
const POSTES = Array.from({ length: 13 }, (_, i) => ({ u: -55 + i * 9, v: -38.2, w: 0.45, d: 0.45, h: 5.4, y: 16.2, cor: JAC_POSTE, cobertura: true }));
const LAMPADAS = Array.from({ length: 12 }, (_, i) => ({ u: -50.5 + i * 9, v: -37.9, w: 2.4, d: 0.8, h: 0.9, y: 20.6, cor: '#f3f5f6', cobertura: true }));
/* a altura do barranco da Ferradura Norte em cada u (pra assentar as escadas brancas) */
const BARRANCO = u => 7.5 + (u - 76.3) / 22 * 5.5;
const ESCADA = (u, v, w, d) => ({ u, v, w, d, h: 0.5, y: BARRANCO(u) - 0.1, cor: '#e9e9e4' });

export default {
  id: 'estadio-alfredo-jaconi', nome: 'Alfredo Jaconi', clubes: ['juventude'], norte: 0, vazado: 0.42, folga: 27,
  vomitorios: false, corEscada: '#eeeeea',
  chao: { cor: '#8b8a85' },
  campo: { corMargem: '#3f9450' },
  corMureta: '#e4e4de',
  aneis: [
    /* O LANCE DE BAIXO, a volta inteira (os trechos do lado leste, colado no campo, levam os contornos deles) */
    { dentro: O_DENTRO, fora: O_FORA, reto: true, h: [1.5, 7.5], fileiras: 15,
      trechos: [
        /* a Ferradura Norte, do meio pro oeste: o degrau verde, o vão da escada e a ponta da visitante */
        { de: 0, ate: 13.6, ...FERRADURA, escadaNaBorda: true },
        { de: 13.6, ate: 15.4, tipo: 'passagem', cor: '#9c9b94' },
        { de: 15.4, ate: 29.8, ...FERRADURA },
        /* a quina noroeste */
        { de: 29.8, ate: 38.85, ...QUINA },
        /* o lance de baixo das sociais (descoberto): branco nas pontas, verde e branco no meio, a boca do túnel */
        { de: 38.85, ate: 59.6, cor: JAC_BR, cor2: JAC_BR2, padrao: 'mosaico', mistura: 0.3, corredor: 14, vomitorios: { f: 0.35, cada: 1, larg: 5, fundo: 4.5 } },
        { de: 59.6, ate: 120.87, cor: JAC_CAD, cor2: JAC_BR, padrao: 'mosaico', mistura: 0.32, corredor: 12.5 },
        { de: 120.87, ate: 141.15, cor: JAC_BR, cor2: JAC_BR2, padrao: 'mosaico', mistura: 0.3, corredor: 14 },
        /* a quina sudoeste */
        { de: 141.15, ate: 150.2, ...QUINA },
        /* a Ferradura Sul: a metade oeste e a metade leste (a da Mancha Verde) */
        { de: 150.2, ate: 180, ...FERRADURA },
        { de: 180, ate: 205.82, ...LESTE, ...FERRADURA, escadaNaBorda: true },
        /* a quina sudeste */
        { de: 205.82, ate: 215.1, ...LESTE, ...QUINA },
        /* a arquibancada coberta do leste: o degrau branco de cimento embaixo, a faixa verde em cima */
        { de: 215.1, ate: 324.9, ...LESTE, h: [1.5, 9.5], padrao: 'fracoes', fracoes: [[0.56, JAC_BR], [0.6, '#bdbcb4'], [1, JAC_CAD]], semCadeiras: true, corredor: 13.5, corEscada: '#cfcec6', paredeAtras: true, parapeito: 4, corFachada: '#e2e1da' },
        /* a quina nordeste e a metade leste da Ferradura Norte */
        { de: 324.9, ate: 334.18, ...LESTE, ...QUINA },
        { de: 334.18, ate: 360, ...LESTE, ...FERRADURA }
      ] },
    /* O LANCE DE CIMA DAS SOCIAIS (cadeira verde, cimento nas pontas) e a passarela de concreto em cima da Ferradura Sul */
    { dentro: O_FORA, fora: O_CIMA, reto: true, h: [9, 14.5], fileiras: 10, corredorFrente: 1.6,
      trechos: [
        { de: 51.46, ate: 60.47, cor: JAC_BR, cor2: JAC_BR2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corredor: 0 },
        { de: 60.47, ate: 127.9, cor: JAC_CAD, cor2: JAC_CAD2, padrao: 'mosaico', mistura: 0.3, corredor: 13 },
        { de: 127.9, ate: 132.62, cor: JAC_BR, cor2: JAC_BR2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corredor: 0 },
        { de: 133.7, ate: 180, tipo: 'passagem', alt: 7.7, cor: '#c2c0b7', fora: PASS_O },
        { de: 180, ate: 225.2, tipo: 'passagem', alt: 7.7, cor: '#c2c0b7', dentro: L_FORA, fora: PASS_L }
      ] }
  ],
  /* o barranco de grama atrás da Ferradura Norte, com o muro verde das placas no alto */
  retas: [
    { u: 76.3, v: 1, ang: 0, comp: 76, prof: 22, h: [7.5, 13], base: 7.5, fileiras: 12, cor: '#5f9c4e', cor2: '#578f47', padrao: 'mosaico', mistura: 0.4, semCadeiras: true,
      corredor: 0, corredorFrente: 0, vomitorios: false, parapeito: 3.4, corFachada: '#2c8f55', corMureta: '#2c8f55', corLado: '#4f8743' }
  ],
  fachada: { cor: '#d5d3ca' },
  blocos: [
    /* OESTE: a cobertura das sociais, as placas solares em cima dela e a fileira de refletores na beira da frente */
    { u: -3.5, v: 63.8, w: 97, d: 15.5, h: 0.6, y: 20, cor: JAC_TETO, cobertura: true },
    { u: 31, v: 66.2, w: 25, d: 8.5, h: 0.25, y: 20.6, cor: '#2b3545', cobertura: true }, { u: 5, v: 66.2, w: 24, d: 8.5, h: 0.25, y: 20.6, cor: '#2b3545', cobertura: true },
    { u: -19.5, v: 66.2, w: 20, d: 8.5, h: 0.25, y: 20.6, cor: '#2b3545', cobertura: true }, { u: -41, v: 66.2, w: 20, d: 8.5, h: 0.25, y: 20.6, cor: '#2b3545', cobertura: true },
    { u: -3.5, v: 56.3, w: 95, d: 0.8, h: 0.9, y: 19.4, cor: '#eef0f1', cobertura: true },
    /* o prédio branco do clube debaixo da cobertura, o anexo da ponta sul, a loja verde da esquina e a torre treliçada */
    { u: -3.5, v: 68.9, w: 99, d: 5.2, h: 17.8, cor: '#e3e2db' },
    { u: -61, v: 66.5, w: 15, d: 13, h: 8.5, cor: '#dddbd3' }, { u: -77, v: 61, w: 8, d: 11, h: 5.5, cor: '#2f9a55' },
    { u: -15, v: 75.4, w: 3.2, d: 3.2, h: 30, cor: '#eceae4' },
    /* os bancos de reserva e a cobertura do túnel, do lado oeste; a boca do túnel na quina sudoeste */
    { u: -13, v: 40.6, w: 9, d: 2, h: 1.8, cor: '#eeeeea' }, { u: 13, v: 40.6, w: 9, d: 2, h: 1.8, cor: '#eeeeea' }, { u: 0, v: 41.2, w: 4, d: 3.4, h: 2.4, cor: '#f4f4f0' },
    { u: -57, v: 38.4, w: 5, d: 4, h: 2.6, cor: '#cfcec6' },
    /* LESTE: a cobertura de ponta a ponta, a testeira da frente, as cabines escuras no fundo e os postes dos refletores */
    { u: -1, v: -46.4, w: 115, d: 17.6, h: 0.6, y: 15.6, cor: '#b0b2b1', cobertura: true },
    { u: -1, v: -37.8, w: 115, d: 0.5, h: 1.5, y: 14.5, cor: '#dcdcd6', cobertura: true },
    { u: -1, v: -52.7, w: 110, d: 3.4, h: 3.4, y: 10.2, cor: '#25302b' }, { u: -1, v: -50.8, w: 110, d: 0.5, h: 1, y: 9.6, cor: '#1c2320' },
    ...POSTES, ...LAMPADAS, { u: -1, v: -38.2, w: 109, d: 0.3, h: 0.3, y: 21.5, cor: JAC_POSTE, cobertura: true },
    /* NORTE: o placar e as placas no alto do muro, o bar verde na ponta e as escadas brancas do barranco */
    { u: 97.6, v: 3, w: 1, d: 9, h: 5, y: 16.6, cor: '#17181b' }, { u: 97.6, v: 3, w: 0.7, d: 0.7, h: 16.6, cor: '#6d7175' },
    { u: 98.9, v: 27, w: 0.5, d: 12, h: 2.2, y: 16.4, cor: '#22346b' }, { u: 98.9, v: 13, w: 0.5, d: 12, h: 2.2, y: 16.4, cor: '#f1f1ec' }, { u: 98.9, v: -22, w: 0.5, d: 14, h: 2.2, y: 16.4, cor: '#eef0ea' },
    { u: 94, v: 31, w: 6, d: 12, h: 3.2, y: 12.4, cor: '#2c8f55' },
    ESCADA(81, 22, 5, 4), ESCADA(86, 12, 5, 4), ESCADA(82, -3, 4, 3.4), ESCADA(89, -4, 4, 3.4), ESCADA(84, -25, 5, 4), ESCADA(92, -30, 4, 3.4)
  ],
  entorno: [
    /* o norte: o mato atrás do barranco */
    { tipo: 'grama', u: 205, v: -70, w: 206, d: 370, cor: '#3d6b3b' },
    { tipo: 'arvores', u: 124, v: -18, w: 42, d: 176, n: 120 }, { tipo: 'arvores', u: 205, v: -70, w: 120, d: 340, n: 170 },
    /* o oeste: o estacionamento, o galpão de telhado azul, as casas e a rua (que vira a São João subindo pro mato) */
    { tipo: 'estacionamento', u: -17, v: 91, w: 60, d: 22, cheio: 0.3 },
    { tipo: 'predio', u: 27, v: 93, w: 20, d: 27, h: 7, cor: '#3d6fc4' },
    { tipo: 'casas', u: 48, v: 87, nu: 1, nv: 4, passo: 13 }, { tipo: 'casas', u: 84, v: 85, nu: 3, nv: 4, passo: 13 },
    { tipo: 'rua', de: [64.5, 58], ate: [64.5, 118], larg: 8 },
    { tipo: 'rua', de: [-280, 118], ate: [300, 118], larg: 10 },
    { tipo: 'casas', u: 0, v: 148, nu: 17, nv: 3, passo: 13.5 }, { tipo: 'arvores', u: -20, v: 107, w: 70, d: 6, n: 8 },
    /* o sul: a rua larga encostada na Ferradura Sul e o bairro */
    { tipo: 'rua', de: [-86, -280], ate: [-86, 280], larg: 13 },
    { tipo: 'casas', u: -112, v: 6, nu: 3, nv: 17, passo: 13 }, { tipo: 'rua', de: [-140, -280], ate: [-140, 280], larg: 10 },
    { tipo: 'casas', u: -168, v: 6, nu: 3, nv: 17, passo: 13 },
    /* o leste: as casas coladas na arquibancada coberta, a rua e os prédios mais longe */
    { tipo: 'casas', u: -4, v: -68, nu: 11, nv: 2, passo: 11.5 },
    { tipo: 'rua', de: [-86, -83], ate: [72, -83], larg: 8 },
    { tipo: 'casas', u: -6, v: -108, nu: 12, nv: 3, passo: 13 }, { tipo: 'rua', de: [-280, -134], ate: [80, -134], larg: 9 },
    { tipo: 'predio', u: -40, v: -160, w: 18, d: 18, h: 44 }, { tipo: 'predio', u: 14, v: -172, w: 18, d: 20, h: 56 }, { tipo: 'predio', u: -104, v: -158, w: 20, d: 18, h: 36 },
    { tipo: 'predio', u: 60, v: -150, w: 16, d: 16, h: 30, cor: '#e6e4dc', cor2: '#9aa3ab' }
  ],
  /* a Mancha Verde na metade leste da Ferradura Sul; a visitante na ponta oeste da Ferradura Norte (portão 5, na São João);
     os outros bondes da casa na metade leste da Ferradura Norte (onde ficam as faixas da barra) e na coberta do leste */
  jogo: { mandante1: [184, 204], mandante2: [338, 357], mandante3: [255, 285], visitante: [16.5, 29], tunelMandante: 194, tunelVisitante: 22, folgaPM: 5,
          torcidas: { mancha_verde_juventude: 'mandante1' } }
};
