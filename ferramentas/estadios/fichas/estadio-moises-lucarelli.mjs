/* MOISÉS LUCARELLI (o Majestoso — Ponte Preta, Campinas) — pelo satélite e
   pelas fotos de referência (15/11/2026); o meio do campo foi tirado do
   círculo central. O campo corre de nordeste a sudoeste; no quadro o
   NOROESTE (a coberta) fica em cima e o NORDESTE (a entrada das torres) à
   direita.
   Bacia oval branca, larga: entre o gramado e a arquibancada sobra uma
   faixa de asfalto, estreita nas laterais e larga nos dois fundos (os
   carros param ali dentro).
   · EM CIMA (noroeste), a COBERTA: o lance mais fundo, com a frente
     descoberta e o telhado escuro por cima do resto; no canto norte o
     telhado claro que acompanha a curva.
   · À DIREITA (nordeste), o prédio da ENTRADA: a arquibancada passa por
     cima dele, entre as duas torres brancas, com o placar no meio.
   · EMBAIXO (sudeste), a arquibancada descoberta, de degrau de cimento
     claro com as escadas amarelas, que faz a volta nos dois cantos.
   · À ESQUERDA (sudoeste), o fundo SEM arquibancada: só o terraço e o muro
     baixo; o degrau recomeça no canto oeste e emenda na coberta.
   OS SETORES (mapa de setores): a coberta é o Setor Vitalícia (com os
   camarotes atrás); o canto norte, ao lado dela, é o SETOR JOVEM; a
   arquibancada do sudeste e o fundo da entrada são o Setor Família; o
   canto oeste é a Imprensa e a VISITANTE.
   OS ACESSOS: o satélite e as fotos não mostram boca de vomitório; as
   escadas amarelas descem do alto até a faixa de asfalto. Ficou sem boca. */
const CIM = '#bdbdb7', CIM2 = '#b0b0aa', AM = '#d8c04a';
/* o gramado oval; a beira da faixa de asfalto; a frente e o fundo da arquibancada; o fundo da coberta */
const GRAMA = { a: 78, b: 37, r: 37 }, I = { a: 85, b: 49, r: 49 }, P = { a: 101, b: 52, r: 52 };
const F = { a: 117.5, b: 68, r: 68 }, F_COB = { a: 117.5, b: 74, r: 74 };
const DEGRAU = (de, ate, mais) => ({ de, ate, cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 15, corEscada: AM, vomitorios: false, ...mais });

export default {
  id: 'estadio-moises-lucarelli', nome: 'Moisés Lucarelli', clubes: ['ponte-preta'], norte: 43.8, vazado: 0.42, folga: 18,
  corEscada: AM,
  chao: { cor: '#77746e' },
  campo: { corMargem: '#55934f', pista: { dentro: GRAMA, fora: I, cor: '#7c776e', raias: 0 } },
  corMureta: '#e9e9e4',
  aneis: [
    /* A FAIXA DE ASFALTO entre o gramado e a arquibancada: estreita nas laterais, larga nos fundos */
    { dentro: I, fora: P, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#7c776e' }] },
    /* A ARQUIBANCADA */
    { dentro: P, fora: F, h: [1.5, 9.5], fileiras: 18,
      trechos: [
        /* o fundo nordeste, por cima do prédio da entrada */
        DEGRAU(-25, 25, { h: [4, 11], corFachada: '#f1f1ed', parapeito: 2 }),
        /* o canto norte, debaixo do telhado claro, e a coberta */
        /* (o canto norte é o SETOR JOVEM: cadeira azul-marinho, com o telhado claro por cima do fundo) */
        { de: 25, ate: 55, fora: F_COB, h: [1.5, 12], cor: '#2a2f45', cor2: '#22263a', padrao: 'mosaico', mistura: 0.35, corredor: 13, corEscada: AM, vomitorios: false },
        /* (a coberta é o SETOR VITALÍCIA: cadeira clara na frente, azul-marinho atrás, e os camarotes debaixo do telhado) */
        { de: 55, ate: 121, fora: F_COB, h: [1.5, 12], cor: '#e2e2dd', padrao: 'fracoes', fracoes: [[0.3, '#e2e2dd'], [1, '#2a2f45']], corredor: 13, corEscada: AM, vomitorios: false },
        /* o canto oeste: o degrau descoberto (a IMPRENSA e, da escada 142 em diante, a VISITANTE) */
        DEGRAU(121, 142), DEGRAU(142, 170),
        /* o fundo sudoeste: sem arquibancada, só o terraço */
        { de: 170, ate: 206, tipo: 'passagem', cor: '#a9a69c' },
        /* a arquibancada do sudeste, que faz a volta nos dois cantos */
        DEGRAU(206, 335)
      ] }
  ],
  /* o telhado claro do canto norte, acompanhando a curva */
  telhados: [{ y: 16, h: 0.5, cor: '#bdbcb6', pontos: [[42, 59], [60, 57], [75, 52], [85, 45], [96, 53], [83, 63], [64, 70], [42, 74]] }],
  fachada: { cor: '#f1f1ed' },
  refletores: [[46, 80, 30], [-42, 80, 30], [-34, -73, 30], [48, -73, 30]],
  blocos: [
    /* o telhado escuro da coberta */
    { u: 3, v: 68.5, w: 76, d: 13, h: 0.5, y: 16.5, cor: '#5c5348', cobertura: true },
    /* a entrada: as duas torres brancas e o placar entre elas */
    { u: 121, v: 14, w: 6, d: 7, h: 24, cor: '#f1f1ed' }, { u: 121, v: -14, w: 6, d: 7, h: 24, cor: '#f1f1ed' },
    { u: 120, v: 0, w: 2, d: 18, h: 5.5, y: 13, cor: '#17181b' },
    /* os bancos de reserva, do lado da coberta */
    { u: -9, v: 42.5, w: 12, d: 3, h: 2, cor: '#d9d9d3' }, { u: 9, v: 42.5, w: 12, d: 3, h: 2, cor: '#d9d9d3' }
  ],
  entorno: [
    /* a rua que contorna o estádio e o bairro de casas em volta */
    { tipo: 'rua', de: [-140, 84], ate: [140, 84], larg: 9 }, { tipo: 'rua', de: [-140, -76], ate: [140, -76], larg: 9 },
    { tipo: 'rua', de: [128, 84], ate: [128, -76], larg: 9 }, { tipo: 'rua', de: [-128, 84], ate: [-128, -76], larg: 9 },
    { tipo: 'casas', u: 0, v: 100, nu: 16, nv: 1, passo: 15 }, { tipo: 'casas', u: 10, v: -92, nu: 14, nv: 1, passo: 15 },
    { tipo: 'arvores', u: -112, v: -66, w: 20, d: 14, n: 6 }, { tipo: 'arvores', u: 0, v: -80, w: 24, d: 6, n: 5 }
  ],
  /* pelo mapa de setores: a Jovem Ponte no Setor Jovem (o canto norte, ao lado da coberta) e a VISITANTE no canto oeste; os
     outros bondes da casa na coberta (Vitalícia / Torolokos) e na arquibancada do sudeste (Setor Família) */
  jogo: { mandante1: [30, 52], mandante2: [75, 105], mandante3: [250, 290], visitante: [142, 168], tunelMandante: 41, tunelVisitante: 155, folgaPM: 5,
          fracao: { mandante1: 0.7, mandante2: 0.7, mandante3: 0.7, visitante1: 0.7, visitante2: 0.75, visitante3: 0.65 },
          torcidas: { jovem_ponte: 'mandante1' } }
};
