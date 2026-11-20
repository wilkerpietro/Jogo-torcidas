/* BRINCO DE OURO DA PRINCESA (Guarani, Campinas) — pelo satélite ampliado
   lado por lado e pelas fotos de referência (15/11/2026); o meio do campo
   foi tirado do círculo central. O campo é norte-sul; no quadro o OESTE (a
   coberta) fica em cima e o NORTE à direita. NÃO achei mapa de setores do
   clube; os setores das torcidas foram ditos pelo dono.
   Bacia oval verde, com o gramado largo em volta do campo, um anel baixo
   que dá a volta inteira e, só do lado leste, o TOBOGÃ por cima dele.
   · EM CIMA (oeste), a SOCIAL COBERTA: o trecho mais fundo do anel, com o
     telhado marrom em 17 panos acompanhando a curva; as fileiras da frente
     ficam descobertas, com as escadas claras.
   · À ESQUERDA (sul), a curva de degrau verde-claro com as cinco escadas
     amarelo-claras (16 m de fundo).
   · À DIREITA (norte), a curva verde mais funda (20 m), em blocos.
   · EMBAIXO (leste), o TOBOGÃ: o lance alto e íngreme em meia-lua, do
     mesmo verde das outras arquibancadas (dono, 15/11/2026: "Deixe a
     arquibancada superior da cor das demais"), que nasce em cima do fundo do anel de
     baixo (que continua por baixo dele). Tem a caixa branca das cabines na
     frente, no meio, e quatro bocas de vomitório a meia altura, que o
     satélite mostra uma a uma.
   OS ACESSOS: as únicas bocas que aparecem são as quatro do tobogã. No
   anel de baixo desce-se pelas escadas. */
const VC = '#9fd0a3', VC2 = '#92c597';                  /* o degrau verde-claro da curva sul */
const VD = '#62a877', VD2 = '#579c6c';                  /* o degrau verde da curva norte e da social */
const ESC = '#e6e0ae';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a beira de dentro (oval de pontas redondas); o fundo da curva sul; o fundo da social e da curva norte */
const I = { a: 93, b: 60, r: 60 }, F_SUL = { a: 109, b: 76, r: 76 }, F_NORTE = { a: 113, b: 81, r: 81 };
/* o tobogã: a frente e o fundo são duas elipses (a meia-lua) */
const T_FRENTE = { a: 116, b: 66.75, forma: 'elipse' }, T_FUNDO = { a: 125, b: 96.5, forma: 'elipse' };
/* os ângulos (na beira de dentro): as pontas do telhado, e onde o anel de baixo passa por baixo do tobogã */
const TETO_N = 40, TETO_S = 132.4, TOB_S = 218, TOB_N = 323.9;
/* as pontas do tobogã (vistas do centro) e as quatro bocas, onde o satélite mostra */
const T0 = 225.7, T1 = 318.2;
const BOCAS = [A(-44, -74.75), A(1.7, -80.25), A(12.8, -80.25), A(51.7, -74.75)].map(a => (a - T0) / (T1 - T0));
const DEGRAU = (de, ate, cor, cor2, mais) => ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 0, escadaNaBorda: true, corEscada: ESC, vomitorios: false, ...mais });
/* O TELHADO da social: 17 panos marrons entre dois arcos */
const frente = u => [u, 66.25 - (u - 4) ** 2 / 510], fundo = u => [u, 81.6 - (u - 4) ** 2 / 491];
const PANOS = Array.from({ length: 17 }, (_, i) => { const u0 = -52 + i * 115 / 17, u1 = u0 + 115 / 17 - 0.5, um = (u0 + u1) / 2;
  return { y: 15 + (i % 2) * 0.25, h: 0.5, cor: i % 2 ? '#5b4b41' : '#66554a', pontos: [frente(u0), frente(um), frente(u1), fundo(u1), fundo(um), fundo(u0)] }; });
/* os bancos de reserva verde-água, do lado da social */
const BANCO = (u, w) => ({ u, v: 41.5, w, d: 2.6, h: 2, cor: '#7fb5a8' });

export default {
  id: 'estadio-brinco-de-ouro', nome: 'Brinco de Ouro', clubes: ['guarani'], norte: 0, vazado: 0.4, folga: 20,
  corEscada: ESC,
  chao: { cor: '#7d7a72' },
  campo: { corMargem: '#55934f' },
  corMureta: '#dfe3dc',
  aneis: [
    /* O ANEL DE BAIXO; a altura acompanha a fundura */
    { dentro: I, fora: F_NORTE, reto: true, normal: true, h: [1.5, 10], inclinacao: 0.42, fileiras: 22,
      trechos: [
        /* a curva norte (à direita): o degrau verde em blocos */
        DEGRAU(TOB_N - 360, TETO_N, VD, VD2, { corredor: 15 }),
        /* a social coberta (em cima): as fileiras da frente descobertas, o resto debaixo do telhado */
        { de: TETO_N, ate: TETO_S, cor: '#4f9a62', cor2: '#458c57', padrao: 'mosaico', mistura: 0.3, corredor: 26, corEscada: ESC, vomitorios: false, paredeAtras: true, corFachada: '#dfe3dc' },
        /* a curva sul (à esquerda): o degrau verde-claro, com as escadas onde o satélite mostra */
        DEGRAU(TETO_S, 150.6, VC, VC2, { fora: F_SUL }), DEGRAU(150.6, 161, VC, VC2, { fora: F_SUL }), DEGRAU(161, 175, VC, VC2, { fora: F_SUL }),
        DEGRAU(175, 185, VC, VC2, { fora: F_SUL }), DEGRAU(185, 203, VC, VC2, { fora: F_SUL }), DEGRAU(203, TOB_S, VC, VC2, { fora: F_SUL }),
        /* o lado leste (embaixo): o anel de baixo, que passa por baixo do tobogã */
        DEGRAU(TOB_S, TOB_N, VD, VD2, { fora: T_FRENTE, corredor: 20, escadaNaBorda: false })
      ] },
    /* O TOBOGÃ */
    { dentro: T_FRENTE, fora: T_FUNDO, h: [9, 25], fileiras: 30, corredorFrente: 1.5, corMureta: '#c9cdc6',
      trechos: [{ de: T0, ate: T1, cor: VD, cor2: VD2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 20, corEscada: ESC, paredeAtras: true, corFachada: '#c9cdc6', parapeito: 1.6,
                  vomitorios: { f: 0.45, larg: 4.5, fundo: 4.5, em: BOCAS } }] }
  ],
  telhados: PANOS,
  fachada: { cor: '#dfe3dc' },
  refletores: [[-84, 80, 34], [92, 80, 34], [-96, -70, 34], [104, -66, 34]],
  blocos: [
    /* a caixa branca das cabines na frente do tobogã, no meio */
    { u: 2.6, v: -71.5, w: 28.7, d: 7, h: 3.4, y: 10.6, cor: '#dfe0dc' },
    /* a casinha clara na ponta norte do telhado */
    { u: 66, v: 64, w: 6, d: 5, h: 12, cor: '#e9e3d0' },
    /* o escudo pintado no gramado, do lado do tobogã */
    { u: -1.3, v: -49, w: 9, d: 9, h: 0.15, cor: '#e9ece8' },
    BANCO(-42, 11), BANCO(-15.5, 25), BANCO(15, 26), BANCO(49, 6)
  ],
  entorno: [
    /* em cima à direita (noroeste): as piscinas do clube; em cima à esquerda, as árvores e a tenda */
    { tipo: 'piscina', u: 108, v: 66, w: 22, d: 20 }, { tipo: 'piscina', u: 64, v: 104, w: 26, d: 10 }, { tipo: 'grama', u: 112, v: 92, w: 40, d: 30, cor: '#d9c9a4' },
    { tipo: 'arvores', u: -90, v: 88, w: 60, d: 26, n: 22 }, { tipo: 'cupula', u: -114, v: 52, r: 9, h: 3, cor: '#e3d9cf', cor2: '#d3c9bf' },
    /* embaixo (leste): as quadras cobertas de teto branco e as quadras de saibro */
    { tipo: 'predio', u: -98, v: -84, w: 46, d: 28, h: 7, cor: '#e9e4d6' }, { tipo: 'predio', u: -26, v: -108, w: 72, d: 16, h: 7, cor: '#e9e4d6' },
    { tipo: 'grama', u: 92, v: -110, w: 70, d: 30, cor: '#c9936b' }, { tipo: 'quadra', u: 124, v: -72, w: 16, d: 30, cor: '#3f6b55' },
    /* à esquerda (sul): os prédios do clube e a avenida */
    { tipo: 'predio', u: -118, v: -38, w: 16, d: 30, h: 8, cor: '#6f6a62' }, { tipo: 'arvores', u: -122, v: 8, w: 10, d: 40, n: 8 },
    { tipo: 'rua', de: [-140, 130], ate: [-140, -130], larg: 16 },
    /* à direita (norte): a rua e as árvores */
    { tipo: 'arvores', u: 126, v: -20, w: 10, d: 60, n: 10 }, { tipo: 'rua', de: [142, 130], ate: [142, -130], larg: 10 }
  ],
  /* dono, 15/11/2026: "Fúria fica no gol sul e a visitante na gol norte". A Fúria Independente no meio da curva sul (à
     esquerda) e a visitante no meio da curva norte (à direita); os outros bondes da casa no tobogã e na social */
  jogo: { mandante1: [165, 195], mandante2: [258, 284], mandante3: [74, 104], visitante: [-17, 17], tunelMandante: 180, tunelVisitante: 0, folgaPM: 5,
          fracao: { mandante1: 0.6, mandante2: 0.62, mandante3: 0.6, visitante1: 0.6, visitante2: 0.65, visitante3: 0.55 },
          torcidas: { furia_independente_do_guarani: 'mandante1' } }
};
