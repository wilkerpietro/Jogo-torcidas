/* VILA BELMIRO (Estádio Urbano Caldeira — Santos) — pelo satélite e pelas
   fotos de referência (15/11/2026); o meio do campo foi tirado do círculo
   central. O campo corre de nordeste a sudoeste; no quadro o NOROESTE (a
   coberta) fica em cima e o NORDESTE (a curva do placar) à direita.
   Estádio de bairro, retangular, apertado entre as ruas, preto e branco:
   · EM CIMA (noroeste), a COBERTA: um lance só de cadeira preta, com o SFC
     escrito em branco na metade sudoeste; no meio, por cima do fundo, a
     laje clara da tribuna e das cabines.
   · À DIREITA (nordeste), a CURVA DO PLACAR: o lance baixo que faz a volta
     nos dois cantos, de cadeira preta com as escadas amarelas, e o placar
     grande com o escudo no alto do meio. É onde ficam a Torcida Jovem e a
     Sangue Jovem (fotos).
   · EMBAIXO (sudeste), a arquibancada comprida de dois lances: cadeira
     branca embaixo; em cima cadeira preta com o SANTOS F.C. escrito em
     branco, e por cima o andar dos camarotes com o telhado estreito.
   · À ESQUERDA (sudoeste), o fundo coberto: cadeira branca embaixo e o
     lance de cima debaixo do telhado escuro.
   OS ACESSOS: as fotos não mostram boca de vomitório em nenhum lance. As
   escadas amarelas descem até a frente; entra-se pelas pontas e por baixo
   até o corredor da frente. */
const PT = '#2a2d34', PT2 = '#22252b';                  /* a cadeira preta */
const BR = '#e7e7e2', BR2 = '#d9d9d3';                  /* a cadeira branca */
const AM = '#d9bf4a';
const FINO = { passoFileira: 0.45, celula: 0.4 };
/* a beira do campo; o fundo do lance de baixo (sudoeste e sudeste) e os fundos de cada lado */
const I = { a: 58, b: 38, r: 5 }, B = { a: 67, b: 47, r: 14 };
const CURVA = { a: 72, b: 52, r: 19 }, COBERTA = { a: 76, b: 56, r: 23 }, FUNDO = { a: 82, b: 62, r: 29 }, LESTE = { a: 76, b: 56, r: 23 };
const CAD = (de, ate, cor, cor2, mais) => ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.3, corredor: 14, corEscada: AM, vomitorios: false, ...mais });

export default {
  id: 'estadio-vila-belmiro', nome: 'Vila Belmiro', clubes: ['santos'], norte: 27.8, vazado: 0.4, folga: 18,
  corEscada: AM,
  chao: { cor: '#77746e' },
  campo: { corMargem: '#4f9353' },
  corMureta: '#e9e9e4',
  aneis: [
    /* O LANCE DE BAIXO, com a fundura de cada lado */
    { dentro: I, fora: B, reto: true, h: [1.2, 5], fileiras: 10,
      trechos: [
        /* a curva do placar (à direita), fazendo a volta nos dois cantos */
        CAD(-36, 36, PT, PT2, { fora: CURVA, h: [1.2, 7.5], corredor: 12, paredeAtras: true, corFachada: '#f1f1ed' }),
        /* a coberta (em cima): cadeira preta, com o SFC na metade sudoeste */
        CAD(36, 111, PT, PT2, { fora: COBERTA, h: [1.2, 10], paredeAtras: true, corFachada: '#f1f1ed' }),
        CAD(111, 144, PT, PT, { fora: COBERTA, h: [1.2, 10], ...FINO, corredor: 0, escadaNaBorda: true, texto: 'SFC', corTexto: '#f1f1ed', textoLargura: 0.82, textoAltura: 0.7, paredeAtras: true, corFachada: '#f1f1ed' }),
        /* o canto oeste: o piso ao pé do prédio */
        { de: 144, ate: 151, tipo: 'passagem', cor: '#b9b6ad' },
        /* o fundo sudoeste e a arquibancada do sudeste: cadeira branca */
        CAD(151, 209, BR, BR2), CAD(209, 324, BR, BR2)
      ] },
    /* O LANCE DE CIMA do fundo sudoeste (debaixo do telhado escuro) e o da arquibancada do sudeste (o SANTOS F.C.) */
    { dentro: B, fora: LESTE, reto: true, h: [6.5, 11], fileiras: 10, corredorFrente: 0, corMureta: '#17181b',
      trechos: [
        CAD(151, 209, PT, PT2, { fora: FUNDO, h: [6.5, 13.5] }),
        CAD(209, 219, PT, PT2, { corredor: 0 }),
        CAD(219, 321, PT, PT, { ...FINO, corredor: 0, texto: 'SANTOS F.C.', corTexto: '#f1f1ed', textoLargura: 0.86, textoAltura: 0.62 }),
        CAD(321, 324, PT, PT2, { corredor: 0 })
      ] }
  ],
  fachada: { cor: '#f1f1ed' },
  refletores: [[-40, -60, 26, 17.5], [0, -60, 26, 17.5], [40, -60, 26, 17.5], [-30, 66, 28, 16.5], [30, 66, 28, 16.5]],
  blocos: [
    /* a coberta: o prédio da tribuna atrás do meio do lance e a laje clara por cima */
    { u: 0, v: 63, w: 44, d: 13, h: 15.5, cor: '#e9e9e4' },
    { u: 0, v: 57, w: 44, d: 25, h: 0.5, y: 16, cor: '#cfd0cc', cobertura: true },
    /* os prédios do clube atrás da coberta, de um lado e do outro da laje */
    { u: -38, v: 68, w: 30, d: 20, h: 9, cor: '#a8674a' }, { u: 40, v: 62, w: 30, d: 8, h: 8, cor: '#d9d9d3' },
    /* o telhado escuro do fundo sudoeste */
    { u: -75.5, v: 2, w: 17, d: 92, h: 0.5, y: 17, cor: '#484b50', cobertura: true },
    /* o andar dos camarotes e o telhado estreito por cima da arquibancada do sudeste */
    { u: -4, v: -58.5, w: 112, d: 4.4, h: 4, y: 11.2, cor: '#d9dad6' },
    { u: -4, v: -57, w: 114, d: 8, h: 0.4, y: 17, cor: '#eeeeea', cobertura: true },
    /* o placar com o escudo no alto do meio da curva */
    { u: 73.5, v: -4, w: 2.2, d: 13, h: 9, y: 8, cor: '#2a2c30', texto: 'SFC', corTexto: '#e9e9e4' },
    /* os bancos de reserva, do lado da coberta */
    { u: -9, v: 35.6, w: 11, d: 1.6, h: 1.8, cor: '#e9e9e4' }, { u: 9, v: 35.6, w: 11, d: 1.6, h: 1.8, cor: '#e9e9e4' }
  ],
  entorno: [
    /* as ruas em volta: atrás da curva, atrás da arquibancada do sudeste e atrás do fundo sudoeste */
    { tipo: 'rua', de: [88, 84], ate: [88, -84], larg: 10 }, { tipo: 'rua', de: [-110, -72], ate: [110, -72], larg: 10 },
    { tipo: 'rua', de: [-96, 84], ate: [-96, -84], larg: 10 },
    /* o bairro de casas dos quatro lados */
    { tipo: 'casas', u: 6, v: -90, nu: 11, nv: 1, passo: 15 }, { tipo: 'casas', u: 106, v: 0, nu: 1, nv: 9, passo: 15 },
    { tipo: 'casas', u: -112, v: 0, nu: 1, nv: 9, passo: 15 }, { tipo: 'casas', u: 62, v: 86, nu: 4, nv: 1, passo: 15 },
    { tipo: 'arvores', u: 96, v: 22, w: 8, d: 16, n: 4 }
  ],
  /* a Torcida Jovem no meio da curva do placar e a Sangue Jovem ao lado dela (fotos); a visitante no fundo sudoeste (escolha
     minha, sem fonte) */
  jogo: { mandante1: [-16, 12], mandante2: [-34, -18], mandante3: [240, 270], visitante: [160, 200], tunelMandante: 0, tunelVisitante: 180, folgaPM: 4,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.3, visitante1: 0.25, visitante2: 0.3, visitante3: 0.2 },
          torcidas: { torcida_jovem: 'mandante1', sangue_jovem: 'mandante2' } }
};
