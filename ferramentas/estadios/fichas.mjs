/* AS FICHAS DOS ESTÁDIOS (ver estadio_lowpoly.mjs pro quadro e os ângulos:
   u ao longo do campo, v atravessado, 0° = atrás do gol da direita, 90° = a
   lateral de cima, 180° = atrás do gol da esquerda, 270° = a lateral de baixo).
   Medidas em metros, tiradas das fotos de satélite e aéreas de referência. */
const VERM = '#c8102e', PRETO = '#18181a', BRANCO = '#f1f0ea', AMARELO = '#e8c020';

export const FICHAS = {
  /* ARENA CASTELÃO (Fortaleza e Ceará) — o eixo do campo é norte-sul; o norte
     fica à esquerda da imagem. Anel oval fechado, dois lances, cobertura
     branca em volta toda, fachada escura com os 60 pilares brancos inclinados. */
  'estadio-castelao': {
    id: 'estadio-castelao', nome: 'Arena Castelão', clubes: ['fortaleza', 'ceara'], norte: 180, vazado: 0.2,
    chao: { cor: '#8f8d86', esplanada: { a: 182, b: 156, forma: 'elipse' }, corEsplanada: '#d6cfb9' },
    campo: { corMargem: '#4c9656' },
    corMureta: '#e4e2da',
    aneis: [
      { dentro: { a: 60, b: 42, r: 28 }, fora: { a: 84, b: 66, r: 50 }, h: [1.2, 11], fileiras: 12,
        trechos: [{ de: 0, ate: 360, cor: '#dfe2dc', cor2: '#c3cbc6', padrao: 'mosaico', mistura: 0.3, corredor: 18 }] },
      { dentro: { a: 86, b: 68, r: 52 }, fora: { a: 128, b: 108, r: 90 }, h: [14, 34], fileiras: 18,
        trechos: [{ de: 0, ate: 360, cor: '#c2c9c4', cor2: '#a3aea9', padrao: 'mosaico', mistura: 0.3, corredor: 22, parapeito: 3,
                    cobertura: { h: 43, larg: 47, avanco: 9, cai: 3, cor: '#f5f5f1', cor2: '#e6e8e6', listras: true, corTrelica: '#b9bdc0', pilares: false } }] }
    ],
    fachada: { cor: '#3a4046', pilares: { n: 60, h: 41, pe: 15, topo: 6, esp: 1.3, fundo: 2.6, cor: '#f6f6f2' } },
    entorno: [
      { tipo: 'rua', de: [-260, 150], ate: [260, 150], larg: 14 }, { tipo: 'rua', de: [-260, -150], ate: [260, -150], larg: 14 },
      { tipo: 'rua', de: [-196, -200], ate: [-196, 200], larg: 14 }, { tipo: 'rua', de: [196, -200], ate: [196, 200], larg: 14 },
      { tipo: 'arvores', u: -178, v: 0, w: 14, d: 230, n: 26 }, { tipo: 'arvores', u: 178, v: 0, w: 14, d: 230, n: 26 },
      { tipo: 'casas', u: -232, v: 60, nu: 4, nv: 9, passo: 14 }, { tipo: 'casas', u: 232, v: -50, nu: 4, nv: 9, passo: 14 },
      { tipo: 'predio', u: 232, v: 95, w: 44, d: 26, h: 9, cor: '#c9c6bb', cor2: '#aaa79c' }
    ],
    /* a torcida do mandante atrás do gol norte; a visitante atrás do gol sul */
    jogo: { mandante1: [152, 208], mandante2: [70, 110], mandante3: [250, 290], visitante: [-32, 32], tunelMandante: 180, tunelVisitante: 0 }
  },

  /* ILHA DO RETIRO (Sport) — eixo quase norte-sul, norte à esquerda. Ferradura
     rubro-negra: a arquibancada da frente (leste, em cima) com SPORT nas
     cadeiras e a tribuna coberta no alto; as curvas dos dois gols; a social
     (oeste, embaixo) com a cobertura listrada; a marquise branca na quina. */
  'estadio-ilha-do-retiro': {
    id: 'estadio-ilha-do-retiro', nome: 'Ilha do Retiro', clubes: ['sport-recife'], norte: 168,
    chao: { cor: '#8b8a85' },
    campo: { corMargem: '#4c9656' },
    aneis: [
      { dentro: { a: 60, b: 41, r: 20 }, fora: { a: 86, b: 68, r: 40 }, h: [1.4, 13], fileiras: 14,
        trechos: [
          { de: -34, ate: 34, cor: VERM, cor2: PRETO, padrao: 'blocos', bloco: 12, faixaBase: { n: 1, cor: AMARELO }, corredor: 14 },
          { de: 34, ate: 146, cor: VERM, texto: 'SPORT', corTexto: PRETO, textoLargura: 0.5, textoAltura: 0.6, faixaBase: { n: 3, cor: AMARELO }, faixaTopo: { n: 3, cor: PRETO },
            h: [1.4, 18], fileiras: 30, celula: 0.85, corredor: 0 },
          { de: 146, ate: 214, cor: VERM, cor2: PRETO, padrao: 'blocos', bloco: 12, faixaBase: { n: 1, cor: AMARELO }, corredor: 14 },
          { de: 214, ate: 232, tipo: 'passagem' },
          { de: 232, ate: 303, cor: VERM, cor2: PRETO, padrao: 'blocos', bloco: 9, h: [1.4, 12], corredor: 12,
            cobertura: { h: 19, larg: 23, avanco: 3, cai: 2, cor: '#e9e9e4', cor2: '#a9adb0', listras: true, corPilar: '#8d8f92' } },
          { de: 303, ate: 326, cor: VERM, h: [1.4, 10], corredor: 0,
            cobertura: { h: 14, larg: 25, avanco: 2, cai: 1, cor: '#f6f6f3', trelica: false, corPilar: '#d9d9d5' } }
        ] }
    ],
    fachada: { cor: '#b3262e' },
    /* a tribuna coberta no alto da arquibancada da frente */
    blocos: [{ u: 0, v: 71, w: 46, d: 7, h: 6, y: 17, cor: '#2a2a2c' }, { u: 0, v: 70, w: 50, d: 11, h: 0.8, y: 23.4, cor: '#d9d9d5', cobertura: true }],
    refletores: [[-78, 78, 42], [78, 78, 42], [-82, -76, 42], [82, -76, 42]],
    entorno: [
      { tipo: 'piscina', u: -22, v: -104, w: 40, d: 18 }, { tipo: 'piscina', u: 24, v: -108, w: 22, d: 12 },
      { tipo: 'quadra', u: 62, v: -106, w: 30, d: 18, cor: '#c9773f' },
      { tipo: 'predio', u: -40, v: -132, w: 70, d: 16, h: 9, cor: '#cfcabd', cor2: '#aaa59a' },
      { tipo: 'predio', u: -118, v: 96, w: 20, d: 20, h: 62 }, { tipo: 'predio', u: -150, v: 60, w: 22, d: 18, h: 74 },
      { tipo: 'predio', u: 120, v: 100, w: 20, d: 22, h: 58 }, { tipo: 'predio', u: 152, v: 40, w: 20, d: 20, h: 66 }, { tipo: 'predio', u: 150, v: -40, w: 22, d: 20, h: 50 },
      { tipo: 'rua', de: [-200, 112], ate: [200, 112], larg: 10 }, { tipo: 'rua', de: [112, -160], ate: [112, 160], larg: 10 }, { tipo: 'rua', de: [-112, -160], ate: [-112, 160], larg: 10 },
      { tipo: 'casas', u: -150, v: -70, nu: 4, nv: 6, passo: 13 }, { tipo: 'casas', u: 150, v: -100, nu: 4, nv: 4, passo: 13 },
      { tipo: 'arvores', u: -100, v: -104, w: 16, d: 40, n: 8 }
    ],
    jogo: { mandante1: [70, 110], mandante2: [160, 200], mandante3: [250, 288], visitante: [-28, 28], tunelMandante: 90, tunelVisitante: 0 }
  },

  /* AFLITOS (Náutico) — eixo norte-sul, norte à esquerda. A arquibancada
     vermelha e branca do lado leste (em cima) com NÁUTICO nas cadeiras,
     dando a volta atrás dos dois gols; do lado oeste (embaixo) as sociais
     cobertas, com os refletores no teto e a piscina do clube atrás. */
  'estadio-aflitos': {
    id: 'estadio-aflitos', nome: 'Aflitos', clubes: ['nautico'], norte: 180,
    chao: { cor: '#8b8a85' },
    campo: { corMargem: '#4c9656' },
    aneis: [
      { dentro: { a: 59, b: 40, r: 26 }, fora: { a: 81, b: 62, r: 47 }, h: [1.2, 12], fileiras: 13,
        trechos: [
          { de: -44, ate: 44, cor: VERM, cor2: BRANCO, padrao: 'mosaico', mistura: 0.38, corredor: 13 },
          { de: 44, ate: 136, cor: VERM, texto: 'CNC NÁUTICO 1901', corTexto: BRANCO, textoLargura: 0.9, textoAltura: 0.7, corredor: 0, fileiras: 26, celula: 0.85 },
          { de: 136, ate: 224, cor: VERM, cor2: BRANCO, padrao: 'mosaico', mistura: 0.38, corredor: 13 },
          { de: 224, ate: 236, tipo: 'passagem' },
          { de: 236, ate: 304, cor: '#b9b7ae', cor2: VERM, padrao: 'mosaico', mistura: 0.25, h: [1.2, 11], corredor: 11,
            cobertura: { h: 17, larg: 20, avanco: 3, cai: 1.5, cor: '#a3a6a8', cor2: '#96999b', listras: true, corPilar: '#7d8083' } },
          { de: 304, ate: 316, tipo: 'passagem' }
        ] }
    ],
    fachada: { cor: '#b3262e' },
    blocos: [{ u: 0, v: -70, w: 60, d: 12, h: 13, cor: '#bdbab0' }, { u: 0, v: 66, w: 8, d: 3, h: 5, y: 13, cor: '#1c1c1e' }],
    refletores: [[-62, -64, 34], [-38, -66, 34], [-13, -67, 34], [13, -67, 34], [38, -66, 34], [62, -64, 34]],
    entorno: [
      { tipo: 'piscina', u: 4, v: -102, w: 34, d: 17 },
      { tipo: 'predio', u: -108, v: 84, w: 20, d: 18, h: 70 }, { tipo: 'predio', u: -60, v: 104, w: 18, d: 18, h: 86 }, { tipo: 'predio', u: -14, v: 106, w: 18, d: 18, h: 78 },
      { tipo: 'predio', u: 34, v: 106, w: 18, d: 18, h: 90 }, { tipo: 'predio', u: 84, v: 100, w: 20, d: 18, h: 72 }, { tipo: 'predio', u: 122, v: 52, w: 20, d: 20, h: 80 },
      { tipo: 'predio', u: 124, v: -20, w: 18, d: 22, h: 64 }, { tipo: 'predio', u: -124, v: 20, w: 18, d: 22, h: 60 }, { tipo: 'predio', u: -120, v: -60, w: 22, d: 18, h: 52 },
      { tipo: 'predio', u: 70, v: -104, w: 26, d: 16, h: 12, cor: '#cfcabd', cor2: '#aaa59a' }, { tipo: 'predio', u: -62, v: -104, w: 30, d: 16, h: 10, cor: '#cfcabd', cor2: '#aaa59a' },
      { tipo: 'rua', de: [-200, -128], ate: [200, -128], larg: 10 }, { tipo: 'rua', de: [-200, 128], ate: [200, 128], larg: 10 },
      { tipo: 'arvores', u: 0, v: -86, w: 150, d: 6, n: 10 }
    ],
    jogo: { mandante1: [70, 110], mandante2: [160, 200], mandante3: [252, 288], visitante: [-32, 26], tunelMandante: 90, tunelVisitante: 0 }
  }
};
