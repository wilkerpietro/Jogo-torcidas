/* CANINDÉ (Estádio Doutor Osvaldo Teixeira Duarte — Portuguesa, São Paulo) —
   pelo satélite e pelas fotos de referência (15/11/2026); o meio do campo
   foi tirado do círculo central. No quadro o OESTE (a coberta) fica em cima
   e o NORTE à direita, um pouco pra baixo; a Marginal Tietê passa embaixo à
   direita.
   É uma bacia oval baixa, pintada de vermelho e verde com as escadas
   amarelas, e um lance alto só do lado oeste:
   · O ANEL DE BAIXO dá a volta inteira menos no lado leste: degrau de
     cimento vermelho atrás dos dois gols (11 m, da mureta ao muro de fora),
     verde nos dois cantos do oeste, e cadeira em blocos (vermelho, verde)
     na frente da coberta, onde ele é mais fundo (17 m).
   · NO OESTE (em cima), atrás do anel, o corredor amarelo e o lance alto
     em duas faixas separadas por outro corredor: a de baixo em blocos
     vermelho e verde e a de cima com o LUSA escrito nas cadeiras (L verde
     no vermelho, U vermelho no verde, S verde no vermelho, A vermelho no
     verde). Por cima, o telhado de concreto dobrado em 13 panos. O lance
     passa do telhado nas duas pontas: degrau verde na ponta sul (esquerda),
     cadeira vermelha na ponta norte (direita).
   · NO LESTE (embaixo), o anel recua: na frente fica uma meia-lua de
     cadeiras (vermelho-escuro, verde, vermelho-escuro) que desce até o
     campo; atrás dela o corredor amarelo, que nas duas pontas encosta na
     mureta; e atrás do corredor a faixa de degrau pintado (verde, vermelho
     no meio, verde), que emenda no vermelho de trás dos gols.
   OS ACESSOS (satélite e fotos): as bocas são as caixas de concreto na
   FRENTE das faixas de cima, dando nos corredores amarelos (sobe-se por
   baixo da arquibancada até o corredor). O anel de baixo e a meia-lua de
   cadeiras não têm boca: desce-se do corredor. Atrás dos gols não há boca:
   chega-se pelas pontas.
   · As QUATRO TORRES de concreto dos refletores: duas atrás da coberta e
     duas no pátio do lado leste. */
const VM = '#d24a3e', VD = '#3f8f6c';                   /* a cadeira vermelha e a verde do lance alto */
const VMC = '#d9604b', VMC2 = '#cf5642';                /* o degrau de cimento vermelho */
const VDC = '#58a567', VDC2 = '#4f9a5e';                /* o degrau de cimento verde */
const VME = '#8c403e', VME2 = '#7d3838';                /* a cadeira vermelho-escura (desbotada) */
const VDE = '#55886b', VDE2 = '#4b7c61';                /* a cadeira verde desbotada */
const AM = '#d8b452', CONC = '#bdb6a8';
const RAD = Math.PI / 180;
/* OS CONTORNOS. A mureta do campo; o fundo do anel de baixo no oeste (um oval de pontas redondas); o corredor amarelo do
   oeste; a faixa de baixo do lance alto, o corredor do meio e o fundo do lance alto (uma elipse: o lance é uma meia-lua,
   29 m no meio e 13 m nas pontas). */
const I = { a: 69, b: 43.5, r: 30 }, O = { a: 80.5, b: 60, r: 60 }, O2 = { a: 83, b: 62.5, r: 62.5 };
const B2 = { a: 93, b: 72.5, r: 72.5 }, B2B = { a: 95, b: 74.5, r: 74.5 }, FORA_O = { a: 100, b: 91.7, forma: 'elipse' };
/* no leste: o corredor amarelo (por dentro e por fora) e o muro de fora, que é também o de trás dos gols */
const WI = { a: 71.6, b: 59.5, r: 59.5 }, WO = { a: 74.4, b: 62.5, r: 62.5 }, FORA_L = { a: 80.5, b: 71.7, r: 71.7 };
/* os ângulos: as pontas do lance alto (norte e sul), as do telhado, e onde o anel recua no leste (sul e norte) */
const PN = 26.5, TN = 39.5, TS = 140.5, PS = 167.5, LS = 209.5, LN = 330;
const FINO = { passoFileira: 0.45, celula: 0.4 };
const em = (de, ate, angs) => angs.map(a => (a - de) / (ate - de));
/* o degrau de cimento pintado e a cadeira; a escada amarela fica na divisa de cada bloco */
const DEGRAU = (de, ate, cor, cor2, mais) => ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 0, escadaNaBorda: true, corEscada: AM, vomitorios: false, ...mais });
const CADEIRA = (de, ate, cor, cor2, mais) => ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: true, corEscada: AM, vomitorios: false, ...mais });
/* a boca: a caixa de concreto na frente da faixa, dando no corredor */
const BOCA = (de, ate, angs) => ({ vomitorios: { f: 0.04, larg: 4, fundo: 4, em: em(de, ate, angs) } });
const LETRA = (de, ate, cor, texto, corTexto, boca) => ({ ...CADEIRA(de, ate, cor, cor), ...FINO, texto, corTexto, textoLargura: 0.5, textoAltura: 0.66, ...(boca ? BOCA(de, ate, boca) : {}) });
/* O TELHADO: 13 panos de concreto dobrado entre o arco de dentro (um círculo de 113,7 m com o centro em (8, -44,3)) e o de
   fora (uma elipse de 104 por 100 com o centro em (2, -8)); a ponta de fora dos panos do meio é de telha clara */
const dentro = t => { const a = (126 - t * 66.8) * RAD; return [8 + 113.7 * Math.cos(a), -44.3 + 113.7 * Math.sin(a)]; };
const fora = t => { const a = (136.3 - t * 90.7) * RAD; return [2 + 104 * Math.cos(a), -8 + 100 * Math.sin(a)]; };
const entre = (t, f) => { const a = dentro(t), b = fora(t); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
const PANOS = Array.from({ length: 13 }, (_, i) => {
  const t0 = i / 13, t1 = (i + 1) / 13, y = 24 + (i % 2) * 0.3, telha = i >= 3 && i <= 9 ? 0.72 : 1;
  const pano = { y, h: 0.6, cor: i % 2 ? '#a99c85' : '#b8ab93', pontos: [entre(t0, 0), entre(t1, 0), entre(t1, telha), entre(t0, telha)] };
  return telha < 1 ? [pano, { y, h: 0.6, cor: i % 2 ? '#c4c5c2' : '#d2d3d0', pontos: [entre(t0, telha), entre(t1, telha), entre(t1, 1), entre(t0, 1)] }] : [pano];
}).flat();
/* as torres de concreto dos refletores */
const TORRE = (u, v, giro) => ({ u, v, w: 7, d: 3.6, h: 34, cor: '#b3ab9c', giro });
/* os bancos de reserva (os túneis vermelhos), do lado da coberta */
const BANCO = (u, w) => ({ u, v: 40.6, w, d: 3.4, h: 2.2, cor: '#d23a34' });

export default {
  id: 'estadio-caninde', nome: 'Canindé', clubes: ['portuguesa'], norte: 335.9, vazado: 0.4, folga: 20,
  corEscada: AM,
  chao: { cor: '#8a8478' },
  campo: { corMargem: '#5f9a55' },
  corMureta: '#d9d6cc',
  aneis: [
    /* O ANEL DE BAIXO (e, no leste, a meia-lua de cadeiras) */
    { dentro: I, fora: O, h: [2, 5.5], fileiras: 14,
      trechos: [
        /* atrás do gol do norte (à direita): o degrau vermelho, e o canto noroeste verde */
        DEGRAU(LN - 360, 5, VMC, VMC2, { fora: FORA_L, paredeAtras: true }),
        DEGRAU(5, PN, VDC, VDC2, { paredeAtras: true }), DEGRAU(PN, TN, VDC, VDC2),
        /* na frente da coberta: as cadeiras em blocos */
        CADEIRA(TN, 49.8, VME2, '#6f3033'), CADEIRA(49.8, 69.4, '#3f7d60', '#38715a'), CADEIRA(69.4, 91.7, VDE, VDE2),
        CADEIRA(91.7, 113.4, '#c4483d', '#b84238'), CADEIRA(113.4, 126, VME, VME2), CADEIRA(126, TS, VME, VME2),
        /* o canto sudoeste verde (com a boca no meio do degrau) e o degrau vermelho de trás do gol do sul (à esquerda) */
        DEGRAU(TS, 164.5, VDC, VDC2, { corredorFrente: 1, vomitorios: { f: 0.5, larg: 4, fundo: 4, em: em(TS, 164.5, [146]) } }),
        DEGRAU(164.5, LS, VMC, VMC2, { fora: FORA_L, paredeAtras: true }),
        /* o lado leste: a meia-lua de cadeiras, que desce do corredor amarelo até o campo; nas duas pontas, o piso de concreto */
        { de: LS, ate: 227.8, tipo: 'passagem', cor: '#b9b2a2', fora: WI },
        CADEIRA(227.8, 249.5, VME, VME2, { fora: WI, h: [0.8, 2.6] }), CADEIRA(249.5, 271, VDE, VDE2, { fora: WI, h: [0.8, 2.6] }),
        CADEIRA(271, 292.7, VDE, VDE2, { fora: WI, h: [0.8, 2.6] }), CADEIRA(292.7, 314.6, VME, VME2, { fora: WI, h: [0.8, 2.6] }),
        { de: 314.6, ate: LN, tipo: 'passagem', cor: '#b9b2a2', fora: WI }
      ] },
    /* OS CORREDORES AMARELOS: o do oeste, atrás do anel de baixo, e o do leste, entre a meia-lua de cadeiras e o degrau */
    { dentro: O, fora: O2, h: [5.5, 5.5], fileiras: 2, corredorFrente: 0,
      trechos: [
        { de: PN, ate: PS, tipo: 'passagem', alt: 5.5, cor: AM },
        { de: LS, ate: LN, tipo: 'passagem', alt: 2.6, cor: AM, dentro: WI, fora: WO }
      ] },
    /* A FAIXA DE BAIXO DO LANCE ALTO (oeste) e A FAIXA DE DEGRAU DO LESTE, com as bocas na frente */
    { dentro: O2, fora: B2, h: [6.3, 11.3], fileiras: 12, corredorFrente: 1.2,
      trechos: [
        CADEIRA(PN, TN, VME, VME2, BOCA(PN, TN, [33])), CADEIRA(TN, 51, VM, '#c5443a'),
        CADEIRA(51, 94, VD, '#39856a', BOCA(51, 94, [71])), CADEIRA(94, TS, VM, '#c5443a', BOCA(94, TS, [111.6, 139])),
        DEGRAU(TS, PS, VDC, VDC2, BOCA(TS, PS, [164])),
        /* o leste: verde, vermelho no meio, verde */
        DEGRAU(LS, 245.8, VDC, VDC2, { dentro: WO, fora: FORA_L, h: [3, 6.2], paredeAtras: true, ...BOCA(LS, 245.8, [217.6]) }),
        DEGRAU(245.8, 287.8, VMC, VMC2, { dentro: WO, fora: FORA_L, h: [3, 6.2], paredeAtras: true, ...BOCA(245.8, 287.8, [252]) }),
        DEGRAU(287.8, LN, VDC, VDC2, { dentro: WO, fora: FORA_L, h: [3, 6.2], paredeAtras: true, ...BOCA(287.8, LN, [292, 325]) })
      ] },
    /* O CORREDOR DO MEIO do lance alto */
    { dentro: B2, fora: B2B, h: [11.3, 11.3], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: PN, ate: PS, tipo: 'passagem', alt: 11.3, cor: AM }] },
    /* A FAIXA DE CIMA DO LANCE ALTO: o LUSA; a altura acompanha a fundura (a meia-lua é mais baixa nas pontas) */
    { dentro: B2B, fora: FORA_O, h: [11.8, 20.4], inclinacao: 0.5, fileiras: 19, corredorFrente: 1.2,
      trechos: [
        CADEIRA(PN, TN, VME, VME2), CADEIRA(TN, 73, VM, '#c5443a', BOCA(TN, 73, [56])),
        LETRA(73, 88, VD, 'A', VM, [80]), LETRA(88, 103, VM, 'S', VD), LETRA(103, 120, VD, 'U', VM, [104.5]), LETRA(120, TS, VM, 'L', VD, [130]),
        DEGRAU(TS, PS, VDC, VDC2)
      ] }
  ],
  telhados: PANOS,
  fachada: { cor: CONC },
  refletores: [[-56, 84, 41, 34], [57, 84, 41, 34], [-24, -93, 41, 34], [37, -93, 41, 34]],
  blocos: [
    TORRE(-56, 84, 30), TORRE(57, 84, -30), TORRE(-24, -93, 0), TORRE(37, -93, 0),
    BANCO(-12.6, 14), BANCO(-1.2, 3), BANCO(11.9, 14),
    /* o escudo da Lusa pintado atrás do gol do sul */
    { u: -64.5, v: -1.5, w: 4, d: 5, h: 0.3, cor: '#f1efe8' },
    /* o placar no alto do canto nordeste (lugar aproximado, pela foto de dentro) */
    { u: 75.5, v: -33, w: 1, d: 11, h: 4.5, y: 6.5, cor: '#17181b', giro: -32 }
  ],
  entorno: [
    /* embaixo à direita (norte e leste): a Marginal Tietê e os pátios de carros */
    { tipo: 'rua', de: [166, 62], ate: [58, -164], larg: 38 },
    { tipo: 'estacionamento', u: 104, v: 4, w: 20, d: 24, cheio: 0.8 }, { tipo: 'estacionamento', u: 44, v: -80, w: 34, d: 12, cheio: 0.6 },
    { tipo: 'estacionamento', u: -48, v: -84, w: 44, d: 10, cheio: 0.4 },
    /* à esquerda (sul): o pátio dos ônibus, os galpões e as árvores */
    { tipo: 'estacionamento', u: -94, v: -22, w: 14, d: 50, cheio: 0.3 },
    { tipo: 'predio', u: -113, v: 24, w: 18, d: 24, h: 7, cor: '#e3e1da' }, { tipo: 'predio', u: -110, v: 92, w: 28, d: 40, h: 9, cor: '#8f9396' },
    { tipo: 'arvores', u: -112, v: -76, w: 34, d: 40, n: 22 }, { tipo: 'arvores', u: -30, v: -112, w: 60, d: 14, n: 16 },
    /* em cima (oeste): o ginásio de teto em leque, a tenda branca e as árvores do clube */
    { tipo: 'cupula', u: 108, v: 116, r: 27, h: 6, cor: '#cfc3ad', cor2: '#b9ad97' },
    { tipo: 'predio', u: 91, v: 84, w: 18, d: 26, h: 6, cor: '#ecece9' },
    { tipo: 'arvores', u: 14, v: 106, w: 60, d: 14, n: 18 }, { tipo: 'arvores', u: 112, v: 46, w: 30, d: 36, n: 20 },
    { tipo: 'arvores', u: -62, v: 104, w: 30, d: 16, n: 10 }
  ],
  /* a Leões da Fabulosa no meio da faixa de degrau do leste e a visitante atrás do gol do norte, do lado da Marginal
     (escolhas minhas, sem fonte); os outros bondes da casa atrás do gol do sul e na faixa de baixo da coberta */
  jogo: { mandante1: [248, 286], mandante2: [168, 206], mandante3: [56, 92], visitante: [-28, 3], tunelMandante: 267, tunelVisitante: -12, folgaPM: 4,
          fracao: { mandante1: 0.86, mandante2: 0.5, mandante3: 0.36, visitante1: 0.4, visitante2: 0.6, visitante3: 0.5 },
          torcidas: { leoes_da_fabulosa: 'mandante1' } }
};
