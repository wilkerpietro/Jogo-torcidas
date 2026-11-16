/* ARENA PANTANAL (Cuiabá) — pelo satélite e pelas imagens que o dono mandou
   no meio do levantamento (16/11/2026): fotos de dentro e de fora, duas
   aéreas, o corte do projeto, o esquema das arquibancadas removíveis e o
   MAPA DE SETORES do clube. O campo corre de sul a norte; no quadro o OESTE
   fica em cima e o NORTE à direita, igual ao mapa de setores. Estádio
   retangular de QUATRO arquibancadas soltas, com os cantos abertos:
   · Cada arquibancada tem TRÊS lances de cadeira azul em mosaico: o de
     baixo, descoberto; o DO MEIO, curto, na frente dos camarotes de vidro
     (dono, 16/11/2026: "tem lances de arquibancada no meio que correspondem
     a um camarote. aplique isso também"; na primeira versão eu tinha feito
     só a faixa de vidro, sem cadeira); e o de cima, debaixo da cobertura,
     por cima do segundo andar de camarotes. As bocas têm moldura branca.
   · EM CIMA (oeste) e EMBAIXO (leste), as duas LATERAIS compridas; os
     bancos de reserva ficam ao pé da do oeste.
   · À ESQUERDA (sul) e À DIREITA (norte), as duas de trás do gol, mais
     estreitas, encaixadas entre as pontas das laterais (as "removíveis" do
     projeto).
   · Cada uma tem a sua COBERTURA plana branca, com a VIGA-CAIXÃO branca por
     cima da beira de dentro, apoiada em dois PILARES brancos grandes; em
     cada canto ficam dois pilares lado a lado, e em dois cantos o telão
     entre eles.
   · POR FORA, a FACHADA de tela dourada, em painéis, alta ao longo das
     quatro arquibancadas e mais baixa nos quatro cantos curvos; a grade do
     terreno e a pista vermelha de caminhada em volta.
   OS SETORES (mapa do clube): Oeste, Leste, Sul e Norte, cada um com
   Inferior e Superior; o visitante fica no NORTE SUPERIOR. Reportagens
   dizem que a torcida da casa ocupa o Leste e o Sul.
   O QUE É ESTIMADO: as alturas (tiradas do corte do projeto, sem cota), o
   comprimento das laterais e a posição exata dos pilares (o satélite mostra
   as coberturas deslocadas pela altura), em quais dois cantos fica o telão.
   AS TORCIDAS: a visitante atrás do gol do norte (mapa do clube); a Raça
   Cuiabana atrás do gol do sul (escolha minha, entre o Sul e o Leste). */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* cada arquibancada com o seu contorno (retângulo de canto vivo): `b` é a beira de uma lateral, `a` a de um fundo */
const LAT = b => ({ a: 112, b, r: 0.5 }), FUN = a => ({ a, b: 84, r: 0.5 });
const AZ = '#2c62b8', AZ2 = '#7ea9df', BR = '#ecece8', VIDRO = '#3a4651', OURO = '#cdc193', OURO2 = '#c1b587';
const BOCA = { larg: 3.4, fundo: 4.4, cor: '#1c2530', corParapeito: '#f0f0ec' };
const CAD = (mais) => ({ cor: AZ, cor2: AZ2, padrao: 'mosaico', mistura: 0.42, corEscada: '#d9dbd8', corFachada: '#b9bcba', parapeito: 1.2, ...mais });
/* os três lances: o de baixo e o de cima com uma boca por bloco, o do meio sem boca (`bloco`: a largura de um bloco) */
const BAIXO = bloco => CAD({ corredor: bloco, vomitorios: { ...BOCA, f: 0.45, cada: 1 } }), MEIO = bloco => CAD({ corredor: bloco, vomitorios: false }),
  CIMA = bloco => CAD({ corredor: bloco, paredeAtras: true, vomitorios: { ...BOCA, f: 0.3, cada: 1 } });
/* os pontos de um retângulo de canto redondo (a fachada, a grade e a pista de fora) */
const PTS = (a, b, r, cu = 0, cv = 0, n = 10) => [[a - r, b - r, 0], [-(a - r), b - r, 90], [-(a - r), -(b - r), 180], [a - r, -(b - r), 270]].flatMap(([x, y, a0]) =>
  Array.from({ length: n + 1 }, (_, k) => { const t = (a0 + 90 * k / n) * RAD; return [cu + x + r * Math.cos(t), cv + y + r * Math.sin(t)]; }));
/* uma faixa em pé (muro, grade, fachada) ou deitada (pista) por uma linha fechada de pontos; `canto(i)` diz se o trecho é de canto */
const FAIXA = (pts, n, fn) => pts.map((a, i) => { const b = pts[(i + 1) % pts.length], du = b[0] - a[0], dv = b[1] - a[1], o = fn(i % (n + 1) !== n, i);
  return { u: (a[0] + b[0]) / 2, v: (a[1] + b[1]) / 2, w: Math.hypot(du, dv) + 0.5, giro: Math.atan2(dv, du) / RAD, ...o }; });
/* a COBERTURA de uma arquibancada: a laje branca, as nervuras de treliça por baixo e a viga-caixão branca por cima da beira de
   dentro, que passa das pontas e pousa nos dois pilares. `s`: o lado (+1 ou -1); `lat`: lateral (ao longo de u) ou de fundo. */
const TETO = (lat, s) => { const cob = true, T = '#f1f0ea', N = '#c3c7c8';
  if (lat) { const v0 = 62, v1 = 100.5, vm = (v0 + v1) / 2, d = v1 - v0;
    return [{ u: 0, v: s * vm, w: 149, d, h: 0.7, y: 38, cor: T, cobertura: cob }, { u: 0, v: s * (v0 + 1.6), w: 164, d: 3.2, h: 4.4, y: 38.7, cor: BR, cobertura: cob },
      { u: 0, v: s * (v1 - 0.4), w: 149, d: 0.8, h: 2.6, y: 35.4, cor: N, cobertura: cob },
      ...Array.from({ length: 13 }, (_, k) => ({ u: -72 + 12 * k, v: s * vm, w: 0.7, d, h: 2.6, y: 35.4, cor: N, cobertura: cob })),
      ...[-80, 80].map(u => ({ u, v: s * (v0 + 1.6), w: 4.6, d: 5.4, h: 38.7, cor: BR }))]; }
  const u0 = 78, u1 = 122, um = (u0 + u1) / 2, w = u1 - u0;
  return [{ u: s * um, v: 0, w, d: 108, h: 0.7, y: 37, cor: T, cobertura: cob }, { u: s * (u0 + 1.6), v: 0, w: 3.2, d: 108, h: 4.4, y: 37.7, cor: BR, cobertura: cob },
    { u: s * (u1 - 0.4), v: 0, w: 0.8, d: 108, h: 2.6, y: 34.4, cor: N, cobertura: cob },
    ...Array.from({ length: 9 }, (_, k) => ({ u: s * um, v: -48 + 12 * k, w, d: 0.7, h: 2.6, y: 34.4, cor: N, cobertura: cob })),
    ...[-51.3, 51.3].map(v => ({ u: s * (u0 + 1.6), v, w: 5.4, d: 4.6, h: 37.7, cor: BR }))]; };
const FACH = PTS(124, 103, 48), PISTA = PTS(149, 128, 70);
/* a GRADE do terreno, em quatro pedaços: fica aberta na frente de cada arquibancada (os quatro portões da grade) */
const ARCO = i => PTS(141, 120, 62).slice(i * 11, i * 11 + 11);
const GRADE = [[[141, 9], ...ARCO(0), [9, 120]], [[-9, 120], ...ARCO(1), [-141, 9]], [[-141, -9], ...ARCO(2), [-9, -120]], [[9, -120], ...ARCO(3), [141, -9]]];
/* um muro ou grade por uma linha ABERTA de pontos */
const LINHA = (pts, o) => pts.slice(1).map((b, i) => { const a = pts[i], du = b[0] - a[0], dv = b[1] - a[1]; return { u: (a[0] + b[0]) / 2, v: (a[1] + b[1]) / 2, w: Math.hypot(du, dv) + 0.4, giro: Math.atan2(dv, du) / RAD, ...o }; });
/* os dez portões do mapa do clube: A e B no oeste, C, D e E no sul, F e G no leste, H, I e J no norte */
const PORTOES = [['A', 'OESTE', 38, 105, 0, -1], ['B', 'OESTE', -38, 105, 0, -1], ['C', 'SUL', -126, 35, 1, 0], ['D', 'SUL', -126, 0, 1, 0], ['E', 'SUL', -126, -35, 1, 0],
  ['F', 'LESTE', -38, -105, 0, 1], ['G', 'LESTE', 38, -105, 0, 1], ['H', 'NORTE', 126, 35, -1, 0], ['I', 'NORTE', 126, 0, -1, 0], ['J', 'NORTE', 126, -35, -1, 0]]
  .map(([n, lado, u, v, du, dv]) => ({ n, nome: 'PORTÃO ' + n + ' · ' + lado, u, v, dir: [du, dv], larg: 9, cor: lado === 'NORTE' ? '#7a2f2f' : '#1f5a9a' }));

export default {
  id: 'estadio-arena-pantanal', nome: 'Arena Pantanal', clubes: ['cuiaba'], norte: 9.9, vazado: 0.3, folga: 30,
  /* NÃO SE BRIGA DENTRO (dono, 16/11/2026: "o setor superior da arena pantanal não deve dar acesso ao setor inferior [...] é
     impossível brigar na arquibancada, só nos arredores, porque um setor não se conecta ao outro"): cada lance tem a sua
     entrada por baixo, pelas bocas, e as quatro arquibancadas são soltas. A briga do dia de jogo abre nos arredores. */
  soFora: true,
  chao: { cor: '#c9b697' },
  campo: { corMargem: '#4c9a4b' },
  corMureta: '#e9ecee',
  alambrado: false,
  aneis: [
    /* a faixa ao pé das quatro arquibancadas: é por ela que se passa de uma à outra */
    { dentro: { a: 55.5, b: 42.5, r: 0.5 }, fora: { a: 58, b: 45, r: 0.5 }, reto: true, h: [0.15, 0.15], corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#9aa39a' }] },
    /* OS TAMANHOS SEGUEM O MAPA DE ASSENTOS (dono, 16/11/2026: "refaça o mapa do estádio pro tamanho de cada setor ficar
       condizente a isso"): o lance de baixo é mais curto que o de cima; as laterais têm 6 blocos por lance e as de trás do
       gol têm 5; o lance de cima abre pra trás (o `fora` mais largo que o `dentro`). Na primeira versão os lances de uma
       mesma arquibancada tinham todos o mesmo comprimento. */
    /* NORTE (à direita) e SUL (à esquerda): o lance de baixo das duas de trás do gol, da largura do campo (5 blocos) */
    { dentro: FUN(58), fora: FUN(76), reto: true, h: [1.5, 8.6], corredorFrente: 1.2,
      trechos: [{ ...BAIXO(14.4), de: A(58, -36) - 360, ate: A(58, 36) }, { ...BAIXO(14.4), de: A(-58, 36), ate: A(-58, -36) }] },
    /* o lance DO MEIO delas: meia dúzia de fileiras na frente dos camarotes, em cima da faixa branca de anúncios */
    { dentro: FUN(76), fora: FUN(82), reto: true, h: [9.9, 12.5], corredorFrente: 0.8, corMureta: '#e9ecee',
      trechos: [{ ...MEIO(15.2), de: A(76, -38) - 360, ate: A(76, 38) }, { ...MEIO(15.2), de: A(-76, 38), ate: A(-76, -38) }] },
    /* o lance de cima delas, por cima do vidro dos camarotes: mais largo que o de baixo e abrindo pra trás (5 blocos) */
    { dentro: FUN(82), fora: { a: 106, b: 84 * 49.5 / 46, r: 0.5 }, reto: true, h: [15.2, 28.2], corredorFrente: 1.6, corMureta: VIDRO,
      trechos: [{ ...CIMA(18.4), de: A(82, -46) - 360, ate: A(82, 46) }, { ...CIMA(18.4), de: A(-82, 46), ate: A(-82, -46) }] },
    /* OESTE (em cima) e LESTE (embaixo): o lance de baixo das duas laterais, pouco mais que o comprimento do campo (6 blocos) */
    { dentro: LAT(45), fora: LAT(63), reto: true, h: [1.5, 8.5], corredorFrente: 1.2,
      trechos: [{ ...BAIXO(20), de: A(60, 45), ate: A(-60, 45) }, { ...BAIXO(20), de: A(-60, -45), ate: A(60, -45) }] },
    /* o lance DO MEIO delas, na frente dos camarotes */
    { dentro: LAT(63), fora: LAT(70), reto: true, h: [9.8, 12.8], corredorFrente: 0.8, corMureta: '#e9ecee',
      trechos: [{ ...MEIO(20.6), de: A(62, 63), ate: A(-62, 63) }, { ...MEIO(20.6), de: A(-62, -63), ate: A(62, -63) }] },
    /* o lance de cima delas: bem mais comprido que o de baixo e abrindo pra trás (6 blocos) */
    { dentro: LAT(70), fora: { a: 112 * 71.5 / 67, b: 95, r: 0.5 }, reto: true, h: [15.6, 29.6], corredorFrente: 1.6, corMureta: VIDRO,
      trechos: [{ ...CIMA(22.3), de: A(67, 70), ate: A(-67, 70) }, { ...CIMA(22.3), de: A(-67, -70), ate: A(67, -70) }] }
  ],
  fachada: { cor: '#b9bcba' },
  blocos: [
    /* as quatro COBERTURAS, com as vigas brancas e os oito pilares */
    ...TETO(true, 1), ...TETO(true, -1), ...TETO(false, 1), ...TETO(false, -1),
    /* os dois telões, entre os pilares de dois cantos */
    { u: 79.6, v: 57.2, w: 0.8, d: 6.4, h: 5.2, y: 13, cor: '#14171b' }, { u: -79.6, v: -57.2, w: 0.8, d: 6.4, h: 5.2, y: 13, cor: '#14171b' },
    /* os dois bancos de reserva, ao pé da lateral do oeste */
    { u: -16, v: 42.6, w: 11, d: 1.8, h: 1.9, cor: '#eef0ee' }, { u: 16, v: 42.6, w: 11, d: 1.8, h: 1.9, cor: '#eef0ee' },
    /* a FACHADA de tela dourada: o embasamento escuro e os painéis, altos nas retas e mais baixos nos quatro cantos curvos */
    ...FAIXA(FACH, 10, (canto, i) => ({ d: 0.6, h: canto ? 11 : 27.5, y: canto ? 5 : 4.5, cor: i % 2 ? OURO : OURO2 })),
    ...FAIXA(PTS(123, 102, 47), 10, () => ({ d: 0.5, h: 4.6, cor: '#3b3f42' })),
    /* a grade do terreno e a pista vermelha de caminhada, por fora */
    ...GRADE.flatMap(g => LINHA(g, { d: 0.3, h: 2.2, cor: '#5c6165' })),
    ...FAIXA(PISTA, 10, () => ({ d: 4.5, h: 0.08, cor: '#b0655c' }))
  ],
  /* a câmera de uma das aéreas do dono: do alto, pelo canto, olhando o estádio de fora */
  vista: [-190, 120, -190, 0, 8, 0],
  entorno: [
    /* as árvores dos quatro cantos abertos, por dentro da fachada, e os gramados de fora */
    { tipo: 'arvores', u: 92, v: 80, w: 14, d: 14, n: 3 }, { tipo: 'arvores', u: 92, v: -80, w: 14, d: 14, n: 3 }, { tipo: 'arvores', u: -92, v: 80, w: 14, d: 14, n: 2 }, { tipo: 'arvores', u: -92, v: -80, w: 14, d: 14, n: 2 },
    { tipo: 'grama', u: -165, v: 120, w: 40, d: 60, cor: '#6b9a55' }, { tipo: 'grama', u: 150, v: 150, w: 70, d: 24, cor: '#6b9a55' }, { tipo: 'grama', u: -70, v: -152, w: 120, d: 26, cor: '#6b9a55' }
  ],
  /* OS ARREDORES NO PRÓPRIO MAPA DO ESTÁDIO (dono, 16/11/2026, vendo a briga abrir na cena genérica de rua: "essa cena de
     arredores vai deixar de existir, a lógica que falei de existirem arredores desenhados no mapa do estádio serve
     exatamente pra isso"). Sem ruas do mapa (`osm` vazio): tudo desenhado à mão. O que se pisa: as quatro ruas em volta, os
     quatro caminhos até os portões da grade, a pista vermelha de caminhada e a esplanada entre a grade e a fachada. O
     estádio e o gramado de fora não se pisam. Os portões são os dez do mapa do clube; a visitante entra pelo norte. As ruas
     são padrão (não são as de verdade): a Arena Pantanal não está na lista dos arredores de verdade. */
  arredores: {
    osm: { ruas: [], areas: [], predios: [] }, soFora: true, quadro: { u: 190, v: 150 }, vazado: 0.62, corQuadra: '#8fa076',
    pisos: [
      /* as quatro ruas em volta: a calçada e o asfalto */
      ...[[[-190, 138], [190, 138]], [[-190, -138], [190, -138]], [[-176, -150], [-176, 150]], [[176, -150], [176, 150]]].flatMap(pts => [{ pts, larg: 19, cor: '#b9b5aa', y: 0.05 }, { pts, larg: 12, cor: '#57585c', y: 0.07 }]),
      /* os quatro caminhos, da rua ao portão da grade, e a pista vermelha de caminhada */
      ...[[[0, 118], [0, 134]], [[0, -118], [0, -134]], [[-139, 0], [-172, 0]], [[139, 0], [172, 0]]].map(pts => ({ pts, larg: 16, cor: '#c2b08f', y: 0.08 })),
      { pts: [...PISTA, PISTA[0]], larg: 5, cor: '#b0655c', y: 0.09 },
      /* a esplanada, da grade pra dentro */
      { pts: PTS(141, 120, 62), cor: '#c9b697' },
      /* (a grade só se passa pelos quatro portões dela; o estádio não é chão) */
      ...GRADE.map(pts => ({ pts, larg: 1.4, tira: true })),
      { pts: PTS(125, 104, 49), tira: true }
    ],
    portoes: PORTOES,
    bondes: { mandante1: { de: [-176, -120], portao: 'D', exato: true }, mandante2: { de: [-120, -138], portao: 'F', exato: true }, mandante3: { de: [-120, 138], portao: 'B', exato: true },
              visitante1: { de: [176, 120], portao: 'I', exato: true }, visitante2: { de: [176, -120], portao: 'J', exato: true } },
    /* o cordão que separa o lado do norte (o da visitante) dentro da grade, e os gradis de fila dos portões D e I */
    grades: [{ de: [127, 54], ate: [140, 54] }, { de: [127, -54], ate: [140, -54] }],
    filas: [{ pts: [[-128, 5.5], [-137, 5.5]] }, { pts: [[-128, -5.5], [-137, -5.5]] }, { pts: [[128, 5.5], [137, 5.5]] }, { pts: [[128, -5.5], [137, -5.5]] }],
    pm: [[134, 30], [134, -30], [152, 0], [-134, 22], [-134, -22], [0, 113], [0, -113], [-152, 0], [104, 96], [104, -96]],
    entorno: [
      { tipo: 'arvores', u: 92, v: 80, w: 14, d: 14, n: 3 }, { tipo: 'arvores', u: 92, v: -80, w: 14, d: 14, n: 3 }, { tipo: 'arvores', u: -92, v: 80, w: 14, d: 14, n: 2 }, { tipo: 'arvores', u: -92, v: -80, w: 14, d: 14, n: 2 },
      { tipo: 'arvores', u: 160, v: 121, w: 14, d: 10, n: 3 }, { tipo: 'arvores', u: 160, v: -121, w: 14, d: 10, n: 3 }, { tipo: 'arvores', u: -160, v: 121, w: 14, d: 10, n: 3 }, { tipo: 'arvores', u: -160, v: -121, w: 14, d: 10, n: 3 }
    ],
    vista: [-230, 150, -230, 0, 0, 0]
  },
  jogo: { mandante1: [162, 198], mandante2: [240, 300], mandante3: [60, 120], visitante: [-20, 20], tunelMandante: 180, tunelVisitante: 0, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.6, visitante2: 0.6, visitante3: 0.5 },
          torcidas: { raca_cuiabana: 'mandante1' } }
};
