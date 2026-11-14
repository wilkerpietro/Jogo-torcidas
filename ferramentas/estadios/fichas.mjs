/* AS FICHAS DOS ESTÁDIOS (ver estadio_lowpoly.mjs pro quadro e os ângulos:
   u ao longo do campo, v atravessado, 0° = atrás do gol da direita, 90° = a
   lateral de cima, 180° = atrás do gol da esquerda, 270° = a lateral de baixo).
   Medidas em metros, tiradas das fotos de satélite e aéreas de referência. */
const VERM = '#c8102e', PRETO = '#18181a', BRANCO = '#f1f0ea', AMARELO = '#e8c020';
const E = (a, b) => ({ a, b, forma: 'elipse' });
const MAR_AM = '#efc12f', MAR_AZ = '#4a8fd0', MAR_AZ2 = '#3b7cc0', MAR_BG = '#e7e2d0';
const MOR_V = '#c9373b', MOR_V2 = '#b32d31';
const ILHA_V = '#c93a43';
/* o contorno de fora do andar de cima do Arruda, a `d` metros do de dentro */
const ARR_FORA = d => ({ a: 90 + d, b: 59 + d, r: 59 + d });
const ARR_BANDAS = [['#c3202d', 30], ['#efeee9', 13], ['#1d1d1f', 30], ['#efeee9', 13]];
const ILHA_TETO = { h: 26, larg: 11, avanco: 2.5, cai: 1.2, cor: '#8f8e89', cor2: '#7d7c78', listras: true, corTrelica: '#5f5e5b', corPilar: '#8a8985' };
const NEO_B = '#ecebe6', NEO_C = '#b9bbbb';

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
      { dentro: { a: 84, b: 66, r: 50 }, fora: { a: 128, b: 108, r: 90 }, h: [14, 34], fileiras: 18,
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

  /* ILHA DO RETIRO (Sport) — pela planta de setores, pelas fotos e pelas
     correções do dono (14/11/2026). O quadro é o da planta, a TV em cima:
     · EM CIMA, o LADO COBERTO (Sociais e Cadeiras), o único de dois
       andares: o de baixo de cadeira vermelha, a faixa preta com a frase
       em amarelo e o de cima preto com SPORT em vermelho, uma letra por
       bloco entre as escadas amarelas, e a cobertura de concreto no alto;
     · EMBAIXO, o LADO DESCOBERTO (a Arquibancada Central), um andar só e
       fundo: preto, a faixa vermelha no alto e o friso amarelo. A GANG DA
       ILHA fica na ponta dele do lado da Sede;
     · À DIREITA, atrás do gol, a ARQUIBANCADA DA SEDE, um andar só, de
       degrau listrado, mais funda no meio — é onde fica a JOVEM;
     · À ESQUERDA, atrás do outro gol, a ARQUIBANCADA VISITANTE, um andar
       só, um bloco solto listrado de vermelho e preto;
     · na quina SUDOESTE, entre a visitante e a Central, a curva preta com
       SPORT pintado em vermelho. */
  'estadio-ilha-do-retiro': {
    id: 'estadio-ilha-do-retiro', nome: 'Ilha do Retiro', clubes: ['sport-recife'], norte: 90, vazado: 0.45, corEscada: AMARELO,
    chao: { cor: '#8b8a85' },
    campo: { corMargem: '#3f9a50' },
    corMureta: '#2a2a2c',
    aneis: [
      { dentro: { a: 77, b: 42.5, r: 34 }, fora: { a: 91, b: 55, r: 46 }, reto: true, h: [1.2, 8], fileiras: 12,
        trechos: [
          /* a Sede: a curva do lado da Central, o meio fundo atrás do gol (a Jovem) e a curva do lado das cadeiras */
          { de: -45.5, ate: -14.4, padrao: 'faixas', cores: [ILHA_V, PRETO], faixaM: 2.4, semCadeiras: true, corredor: 13 },
          { de: -14.4, ate: 19, fora: { a: 106, b: 71.5, r: 58 }, h: [1.2, 15], padrao: 'faixas', cores: [ILHA_V, PRETO], faixaM: 2.4, semCadeiras: true, corredor: 13, faixaTopo: { n: 1, cor: AMARELO } },
          { de: 19, ate: 26, padrao: 'faixas', cores: [ILHA_V, PRETO], faixaM: 2.4, semCadeiras: true, corredor: 0 },
          /* o lado coberto, o andar de baixo: cadeira vermelha */
          { de: 26, ate: 148, cor: ILHA_V, cor2: '#b9454c', padrao: 'mosaico', mistura: 0.25, corredor: 11 },
          /* a Visitante (antes da folga, pra a divisória valer a fundura dela) e a folga ao lado */
          { de: 156, ate: 192, fora: { a: 112, b: 76, r: 18 }, reto: false, h: [1.2, 16], padrao: 'faixas', cores: [PRETO, VERM], faixaM: 3, semCadeiras: true, corredor: 14, faixaTopo: { n: 1, cor: AMARELO } },
          { de: 148, ate: 156, tipo: 'passagem' },
          /* a curva sudoeste: SPORT pintado na curva */
          { de: 192, ate: 226, cor: PRETO, texto: 'SPORT', corTexto: VERM, textoLargura: 0.86, textoAltura: 0.66, semCadeiras: true, corredor: 0, vomitorios: false, faixaTopo: { n: 1, cor: ILHA_V } },
          /* o lado descoberto: um andar só, fundo */
          { de: 226, ate: 314.5, fora: { a: 106, b: 71.5, r: 58 }, h: [1.2, 15], padrao: 'fracoes', fracoes: [[0.66, '#2b2b2d'], [0.95, ILHA_V], [1, AMARELO]], corredor: 14, corEscada: '#8f8e89' }
        ] },
      /* o andar de cima, só no lado coberto */
      { dentro: { a: 91, b: 55, r: 46 }, fora: { a: 106, b: 71.5, r: 58 }, reto: true, h: [9, 20], fileiras: 16, corredorFrente: 1.8,
        trechos: [
          { de: 19, ate: 50.7, cor: ILHA_V, cor2: '#b9454c', padrao: 'mosaico', mistura: 0.25, corredor: 12 },
          { de: 50.7, ate: 66.4, cor: PRETO, cor2: '#2c2c2e', padrao: 'mosaico', mistura: 0.3, corredor: 7, cobertura: ILHA_TETO },
          { de: 66.4, ate: 75.9, cor: PRETO, texto: 'T', corTexto: VERM, textoLargura: 0.74, textoAltura: 0.78, corredor: 0, escadaNaBorda: true, vomitorios: false, cobertura: ILHA_TETO },
          { de: 75.9, ate: 86.3, cor: PRETO, texto: 'R', corTexto: VERM, textoLargura: 0.74, textoAltura: 0.78, corredor: 0, escadaNaBorda: true, vomitorios: false, cobertura: ILHA_TETO },
          { de: 86.3, ate: 96.8, cor: PRETO, texto: 'O', corTexto: VERM, textoLargura: 0.74, textoAltura: 0.78, corredor: 0, escadaNaBorda: true, vomitorios: false, cobertura: ILHA_TETO },
          { de: 96.8, ate: 107, cor: PRETO, texto: 'P', corTexto: VERM, textoLargura: 0.74, textoAltura: 0.78, corredor: 0, escadaNaBorda: true, vomitorios: false, cobertura: ILHA_TETO },
          { de: 107, ate: 116.1, cor: PRETO, texto: 'S', corTexto: VERM, textoLargura: 0.74, textoAltura: 0.78, corredor: 0, escadaNaBorda: true, vomitorios: false, cobertura: ILHA_TETO },
          { de: 116.1, ate: 121, cor: PRETO, cor2: '#2c2c2e', padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: true, vomitorios: false, cobertura: ILHA_TETO },
          { de: 121, ate: 129.3, cor: ILHA_V, cor2: '#b9454c', padrao: 'mosaico', mistura: 0.25, corredor: 0, escadaNaBorda: true, vomitorios: false, cobertura: ILHA_TETO },
          { de: 129.3, ate: 148, cor: ILHA_V, cor2: '#b9454c', padrao: 'mosaico', mistura: 0.25, corredor: 12 }
        ] }
    ],
    fachada: { cor: '#b3262e' },
    blocos: [
      /* a faixa preta com a frase, entre os dois andares do lado coberto */
      { u: 0, v: 55.3, w: 88, d: 1.9, h: 0.5, y: 8.6, cor: '#151515', texto: 'O SPORT QUE EMOCIONA    O SPORT QUE A GENTE AMA', corTexto: AMARELO, textoLargura: 0.94, textoAltura: 0.62 },
      /* a antena no teto */
      { u: 6, v: 68, w: 6, d: 6, h: 9, y: 27, cor: '#b9b6ad', cobertura: true },
      /* as cabines pretas no meio do lado descoberto */
      { u: -24, v: -58, w: 5, d: 3.4, h: 2.6, y: 7.4, cor: '#19191b' }, { u: 0, v: -58, w: 5, d: 3.4, h: 2.6, y: 7.4, cor: '#19191b' }, { u: 24, v: -58, w: 5, d: 3.4, h: 2.6, y: 7.4, cor: '#19191b' },
      /* o tapete rubro-negro atrás do gol da Sede e o escudo atrás do outro */
      { u: 56, v: 0, w: 2.1, d: 34, h: 0.06, y: 0.14, cor: PRETO }, { u: 58.1, v: 0, w: 2.1, d: 34, h: 0.06, y: 0.14, cor: VERM }, { u: 60.2, v: 0, w: 2.1, d: 34, h: 0.06, y: 0.14, cor: PRETO },
      { u: 62.3, v: 0, w: 2.1, d: 34, h: 0.06, y: 0.14, cor: VERM }, { u: 64.4, v: 0, w: 2.1, d: 34, h: 0.06, y: 0.14, cor: PRETO }, { u: 66.5, v: 0, w: 2.1, d: 34, h: 0.06, y: 0.14, cor: VERM },
      { u: -62, v: -12, w: 5, d: 5, h: 0.06, y: 0.14, cor: VERM }, { u: -62, v: -12, w: 3, d: 3, h: 0.06, y: 0.22, cor: AMARELO },
      /* os bancos amarelos na beira do campo, do lado coberto */
      { u: -24, v: 39.8, w: 9, d: 1.7, h: 1.3, cor: AMARELO }, { u: 0, v: 39.8, w: 7, d: 1.7, h: 1.3, cor: AMARELO }, { u: 24, v: 39.8, w: 9, d: 1.7, h: 1.3, cor: AMARELO }
    ],
    /* as quatro torres de luz atrás da visitante */
    refletores: [[-118, 46, 40], [-119, 26, 40], [-119, -8, 40], [-118, -30, 40]],
    entorno: [
      /* atrás do lado coberto: os prédios altos, o rio e as piscinas do clube */
      { tipo: 'agua', u: 0, v: 134, w: 400, d: 26 },
      { tipo: 'predio', u: -86, v: 104, w: 18, d: 18, h: 96 }, { tipo: 'predio', u: -46, v: 106, w: 18, d: 18, h: 96 }, { tipo: 'predio', u: -6, v: 106, w: 18, d: 18, h: 86 }, { tipo: 'predio', u: 30, v: 106, w: 18, d: 18, h: 90 },
      { tipo: 'piscina', u: 76, v: 104, w: 34, d: 16 }, { tipo: 'piscina', u: 108, v: 100, w: 16, d: 12 },
      /* atrás do lado descoberto: o estacionamento, os galpões e as quadras */
      { tipo: 'estacionamento', u: -10, v: -104, w: 90, d: 30 }, { tipo: 'predio', u: -96, v: -98, w: 44, d: 26, h: 9, cor: '#e4e2da', cor2: '#bdbbb2' },
      { tipo: 'quadra', u: 70, v: -100, w: 30, d: 18 }, { tipo: 'quadra', u: 104, v: -100, w: 26, d: 18, cor: '#c9773f' },
      { tipo: 'rua', de: [-200, -124], ate: [200, -124], larg: 10 }, { tipo: 'rua', de: [128, -160], ate: [128, 160], larg: 10 }, { tipo: 'rua', de: [-134, -160], ate: [-134, 160], larg: 10 },
      { tipo: 'arvores', u: 120, v: 40, w: 8, d: 70, n: 6 }
    ],
    /* a Jovem no meio da Sede; a Gang da Ilha na ponta do lado descoberto perto da Sede; as outras, no lado coberto */
    jogo: { mandante1: [-4, 16], mandante2: [290, 312], mandante3: [70, 110], visitante: [157, 191], tunelMandante: 6, tunelVisitante: 174, folgaPM: 5,
            torcidas: { jovem_sport: 'mandante1', gang_da_ilha: 'mandante2' } }
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
  },

  /* MARACANÃ (Flamengo e Fluminense) — pelas fotos do dono (14/11/2026). Anel
     oval inteiro em dois lances, cadeiras em degradê amarelo → azul → branco,
     a cobertura branca de lona em 72 gomos que tapa quase todas as cadeiras
     (a boca oval em cima do campo), a galeria de concreto por fora, os dois
     telões pendurados atrás dos gols e o Maracanãzinho ao lado. Nota do dono:
     organizada atrás do gol leste (0°), visitante no escanteio sudoeste. */
  'estadio-maracana': {
    id: 'estadio-maracana', nome: 'Maracanã', clubes: ['flamengo', 'fluminense'], norte: 0, vazado: 0.42, folga: 22,
    chao: { cor: '#8c8b86', esplanada: { a: 178, b: 158, forma: 'elipse' }, corEsplanada: '#bdb9ad' },
    campo: { corMargem: '#4c9656' },
    corMureta: '#dcd9cf',
    aneis: [
      { dentro: E(76, 52), fora: E(100, 76), h: [1.2, 10], fileiras: 18,
        trechos: [{ de: 0, ate: 360, padrao: 'degrade', cores: [MAR_AM, MAR_AM, MAR_AZ, MAR_AZ2], mistura: 0.9, corredor: 17 }] },
      { dentro: E(100, 76), fora: E(130, 108), h: [12, 30], fileiras: 24,
        trechos: [{ de: 0, ate: 360, padrao: 'degrade', cores: [MAR_AZ2, MAR_AZ, MAR_BG, MAR_BG], mistura: 0.9, corredor: 21 }] },
      { dentro: E(130, 108), fora: E(148, 128), trechos: [{ de: 0, ate: 360, tipo: 'passagem', alt: 30, cor: '#ecebe5' }] }
    ],
    coberturasAnel: [{ fora: E(152, 132), dentro: E(80, 61), h: 42, cai: 7, n: 72, cor: '#f6f5f0', cor2: '#eeede7', corNervura: '#d3d3cc',
      bordaFora: { larg: 5, cor: '#8a94a0' }, bordaDentro: { larg: 2.2, cor: '#c6c9cb' }, aneis: [{ f: 0.3, larg: 1.3, cor: '#c9ccce' }] }],
    fachada: { cor: '#c4c0b4', pilares: { n: 60, h: 30, pe: 5, topo: 1, esp: 1.2, fundo: 2.6, cor: '#dedbd0', contorno: E(148, 128) } },
    blocos: [
      { u: 90, v: 0, w: 1.6, d: 22, h: 8, y: 25, cor: '#16171a' }, { u: -90, v: 0, w: 1.6, d: 22, h: 8, y: 25, cor: '#16171a' },
      /* as duas rampas monumentais */
      { u: 96, v: 144, w: 96, d: 20, h: 13, giro: 24, cor: '#bdb9ad' }, { u: -96, v: -144, w: 96, d: 20, h: 13, giro: 24, cor: '#bdb9ad' }
    ],
    entorno: [
      { tipo: 'cupula', u: -208, v: -112, r: 52, h: 17 },
      { tipo: 'piscina', u: -70, v: -205, w: 50, d: 22 }, { tipo: 'piscina', u: -20, v: -212, w: 24, d: 20 },
      { tipo: 'predio', u: -46, v: -180, w: 110, d: 14, h: 10, cor: '#d9d6cb', cor2: '#b5b2a7' },
      { tipo: 'rua', de: [-300, 176], ate: [300, 150], larg: 18 }, { tipo: 'rua', de: [-300, 196], ate: [300, 170], larg: 8, cor: '#7b7468' },
      { tipo: 'rua', de: [196, -260], ate: [212, 260], larg: 14 }, { tipo: 'rua', de: [-300, -168], ate: [300, -176], larg: 12 },
      { tipo: 'arvores', u: 178, v: -110, w: 30, d: 60, n: 12 }, { tipo: 'arvores', u: 176, v: 96, w: 26, d: 50, n: 9 }, { tipo: 'arvores', u: -176, v: 110, w: 30, d: 50, n: 10 },
      { tipo: 'arvores', u: -150, v: -150, w: 40, d: 20, n: 6 },
      { tipo: 'casas', u: 246, v: -60, nu: 4, nv: 12, passo: 15 }, { tipo: 'casas', u: -250, v: 60, nu: 4, nv: 10, passo: 15 },
      { tipo: 'predio', u: 240, v: 70, w: 22, d: 24, h: 46 }, { tipo: 'predio', u: 262, v: 112, w: 20, d: 22, h: 58 }, { tipo: 'predio', u: -244, v: -40, w: 22, d: 22, h: 40 }
    ],
    jogo: { mandante1: [-28, 28], mandante2: [70, 110], mandante3: [250, 290], visitante: [206, 240], tunelMandante: 0, tunelVisitante: 223 }
  },

  /* MORUMBI (São Paulo) — pelas fotos do dono (14/11/2026). Oval sem
     cobertura, todo de cadeira vermelha: o lance de baixo, a faixa escura dos
     camarotes (com as duas coberturas azuis nas laterais) e o lance grande de
     cima com as bocas de concreto; a pista de atletismo e as ondas tricolores
     atrás dos gols; os quatro pórticos brancos de luz; os telões nas pontas e
     as piscinas do clube ao lado. Nota do dono: organizada atrás do gol leste,
     visitante no gol oeste. */
  'estadio-morumbi': {
    id: 'estadio-morumbi', nome: 'Morumbi', clubes: ['sao-paulo'], norte: 180, folga: 14,
    chao: { cor: '#8a8984' },
    campo: { corMargem: '#4c9656', corFosso: '#aaa69a', pista: { dentro: { a: 80, b: 44, r: 44 }, fora: { a: 88, b: 52, r: 52 }, cor: '#b9584a', raias: 6 },
      ondas: [{ u: 60, amp: 2.6, v: 24, larg: 2.7, cor: '#f1efe8' }, { u: 63.4, amp: 2.6, v: 24, larg: 2.7, cor: '#c8363a' }, { u: 66.8, amp: 2.6, v: 24, larg: 2.7, cor: '#4a4c50' }] },
    corMureta: '#d6d2c6',
    aneis: [
      { dentro: { a: 93, b: 57, r: 57 }, fora: { a: 101, b: 65, r: 65 }, h: [1.5, 5.5], fileiras: 8,
        trechos: [{ de: 0, ate: 360, cor: MOR_V, cor2: MOR_V2, padrao: 'mosaico', mistura: 0.3, corredor: 15 }] },
      { dentro: { a: 101, b: 65, r: 65 }, fora: { a: 105, b: 69, r: 69 }, h: [6.6, 7.6], fileiras: 2, corredorFrente: 0, vomitorios: false, semCadeiras: true, passoFileira: 2,
        trechos: [
          { de: -58, ate: 58, cor: '#55585c', corredor: 0 },
          { de: 58, ate: 122, cor: '#55585c', corredor: 0, cobertura: { h: 10.5, larg: 7, avanco: 0.5, cai: 0.8, cor: '#2f58b8', cor2: '#2a4fa6', listras: true, trelica: false, pilares: false, opaca: true } },
          { de: 122, ate: 238, cor: '#55585c', corredor: 0 },
          { de: 238, ate: 302, cor: '#55585c', corredor: 0, cobertura: { h: 10.5, larg: 7, avanco: 0.5, cai: 0.8, cor: '#2f58b8', cor2: '#2a4fa6', listras: true, trelica: false, pilares: false, opaca: true } }
        ] },
      { dentro: { a: 105, b: 69, r: 69 }, fora: { a: 124, b: 92, r: 90 }, h: [9, 27], fileiras: 26,
        trechos: [{ de: 0, ate: 360, cor: MOR_V, cor2: MOR_V2, padrao: 'mosaico', mistura: 0.3, corredor: 19, parapeito: 2, bocas: { cada: 15, f: 0.22, w: 4.5, d: 5 } }] }
    ],
    fachada: { cor: '#d2cec2' },
    porticos: [{ ang: 38, larg: 46, h: 46 }, { ang: 142, larg: 46, h: 46 }, { ang: 218, larg: 46, h: 46 }, { ang: 322, larg: 46, h: 46 }],
    blocos: [{ u: 121, v: 0, w: 2.4, d: 26, h: 9, y: 27, cor: '#17181b' }, { u: -121, v: 0, w: 2.4, d: 26, h: 9, y: 27, cor: '#17181b' }],
    entorno: [
      { tipo: 'piscina', u: 150, v: 26, w: 16, d: 34 }, { tipo: 'piscina', u: 150, v: -22, w: 18, d: 20 },
      { tipo: 'quadra', u: 150, v: -62, w: 18, d: 32, cor: '#c9773f' }, { tipo: 'arvores', u: 140, v: 70, w: 30, d: 30, n: 9 },
      { tipo: 'estacionamento', u: -150, v: -70, w: 26, d: 60 }, { tipo: 'arvores', u: -146, v: 60, w: 24, d: 60, n: 10 },
      { tipo: 'rua', de: [-200, 104], ate: [200, 104], larg: 9 }, { tipo: 'rua', de: [-200, -104], ate: [200, -104], larg: 9 },
      { tipo: 'casas', u: -100, v: 124, nu: 9, nv: 2, passo: 13 }, { tipo: 'casas', u: 60, v: 124, nu: 12, nv: 2, passo: 13 },
      { tipo: 'casas', u: -40, v: -124, nu: 14, nv: 2, passo: 13 }
    ],
    jogo: { mandante1: [-28, 28], mandante2: [70, 110], mandante3: [250, 290], visitante: [152, 208], tunelMandante: 0, tunelVisitante: 180 }
  },

  /* NEO QUÍMICA ARENA (Corinthians) — pelas fotos do dono (14/11/2026).
     Retangular: o lance de baixo dá a volta no campo; em cima dele, só nas
     duas laterais, os lances altos (leste em cima da imagem, oeste embaixo,
     com a faixa preta dos camarotes e o prédio branco atrás). Atrás do gol
     norte (esquerda) o degrau de concreto sem cadeira das organizadas; os dois
     telões nas pontas; as duas coberturas brancas com o nome da arena e as
     vigas que fecham o retângulo. Nota do dono: organizadas no gol oeste
     (esquerda), visitante na curva nordeste. */
  'estadio-neo-quimica-arena': {
    id: 'estadio-neo-quimica-arena', nome: 'Neo Química Arena', clubes: ['corinthians'], norte: 180, vazado: 0.46, folga: 58,
    chao: { cor: '#8e8d88', esplanada: { a: 104, b: 118, r: 2 }, corEsplanada: '#b5b2a8' },
    campo: { corMargem: '#4c9656' },
    corMureta: '#2e3033',
    aneis: [
      { dentro: { a: 58, b: 39.5, r: 3 }, fora: { a: 81, b: 62.5, r: 26 }, reto: true, h: [1, 10.5], fileiras: 16,
        trechos: [
          { de: -33, ate: 33, cor: NEO_B, cor2: NEO_C, padrao: 'mosaico', mistura: 0.14, corredor: 13 },
          { de: 33, ate: 147, cor: NEO_B, cor2: NEO_C, padrao: 'mosaico', mistura: 0.1, corredor: 13 },
          { de: 147, ate: 213, cor: '#c4c2ba', cor2: '#b6b4ac', padrao: 'mosaico', mistura: 0.5, corredor: 13, semCadeiras: true },
          { de: 213, ate: 327, cor: NEO_B, cor2: NEO_C, padrao: 'mosaico', mistura: 0.1, corredor: 13, faixaTopo: { n: 2, cor: '#2e3033' } }
        ] }
    ],
    retas: [
      { u: 0, v: 62.5, ang: 90, comp: 130, prof: 38, h: [13, 35], base: 9, fileiras: 24, cor: NEO_B, cor2: NEO_C, padrao: 'mosaico', mistura: 0.1, corredor: 14, corFachada: '#e9e9e5' },
      { u: 0, v: -62.5, ang: 270, comp: 130, prof: 38, h: [15, 35], base: 9, fileiras: 22, cor: NEO_B, cor2: NEO_C, padrao: 'mosaico', mistura: 0.1, corredor: 14, faixaBase: { n: 3, cor: '#2e3033' }, corFachada: '#e9e9e5' }
    ],
    fachada: { cor: '#e4e4e0' },
    blocos: [
      /* as duas coberturas e as vigas das pontas */
      { u: 0, v: 76, w: 168, d: 54, h: 1.6, y: 40, cor: '#f4f4f0', cobertura: true, texto: 'neo|química|arena', textoLargura: 0.2, textoAltura: 0.2, textoMeio: 0.52, textoAlinha: 'left' },
      { u: 0, v: -76, w: 168, d: 54, h: 1.6, y: 40, cor: '#f4f4f0', cobertura: true, texto: 'neo|química|arena', textoLargura: 0.2, textoAltura: 0.2, textoMeio: 0.52, textoAlinha: 'left' },
      { u: -76, v: 0, w: 16, d: 98, h: 1.6, y: 40, cor: '#ebebe7', cobertura: true }, { u: 76, v: 0, w: 16, d: 98, h: 1.6, y: 40, cor: '#ebebe7', cobertura: true },
      /* o prédio oeste, a fachada de vidro leste e os telões */
      { u: 0, v: -107, w: 150, d: 12, h: 37, cor: '#efefeb' }, { u: 0, v: 103, w: 140, d: 5, h: 30, cor: '#cfd6dc' },
      { u: 84, v: 0, w: 2.2, d: 36, h: 9, y: 13, cor: '#17181b' }, { u: -84, v: 0, w: 2.2, d: 36, h: 9, y: 13, cor: '#17181b' }
    ],
    entorno: [
      { tipo: 'grama', u: -150, v: 0, w: 60, d: 260, cor: '#7c9a5c' }, { tipo: 'rua', de: [-128, -200], ate: [-128, 200], larg: 10 },
      { tipo: 'estacionamento', u: 146, v: 30, w: 52, d: 150 }, { tipo: 'rua', de: [112, -200], ate: [112, 200], larg: 9 },
      { tipo: 'arvores', u: -150, v: 40, w: 40, d: 120, n: 9 }, { tipo: 'arvores', u: 150, v: -84, w: 44, d: 30, n: 7 },
      { tipo: 'estacionamento', u: -20, v: -160, w: 200, d: 60 }, { tipo: 'estacionamento', u: 10, v: 160, w: 180, d: 60 }
    ],
    jogo: { mandante1: [152, 208], mandante2: [65, 115], mandante3: [245, 295], visitante: [12, 40], tunelMandante: 180, tunelVisitante: 26, folgaPM: 5 }
  },

  /* ARRUDA (Santa Cruz) — pela planta e pelas fotos do dono (14/11/2026).
     Oval de dois andares, o norte em cima. O andar de BAIXO dá a volta
     inteira. O de CIMA é fino atrás do gol da esquerda (oeste) e vai
     ficando mais fundo pelo norte até o gol da direita (leste), onde é o
     maior, em cinco degraus: cada trecho tem a sua fundura e a sua altura. Os dois são de
     degrau pintado no redemoinho tricolor (vermelho, branco, preto). Só a
     lateral de baixo (sul) é coberta, e só o andar de cima dela: as
     cadeiras cinzas debaixo da cobertura de concreto. Em volta do gramado,
     a margem larga de terra clara. Nota do dono: Inferno Coral no leste,
     Raça Coral no norte, visitante no oeste. */
  'estadio-arruda': {
    id: 'estadio-arruda', nome: 'Arruda', clubes: ['santa-cruz'], norte: 90, vazado: 0.5, folga: 16,
    chao: { cor: '#8b8a85' },
    campo: { corMargem: '#cfc8b2' },
    corMureta: '#eeeeea',
    aneis: [
      { dentro: { a: 80, b: 49, r: 49 }, fora: { a: 90, b: 59, r: 59 }, h: [1.5, 7], fileiras: 8, corredorFrente: 1.8,
        trechos: [
          { de: -25, ate: 205, padrao: 'redemoinho', bandas: ARR_BANDAS, fase: 123, torcao: 8, semCadeiras: true, corredor: 20 },
          { de: 205, ate: 335, cor: '#c0333c', cor2: '#a82c34', padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corredor: 18 }
        ] },
      /* o andar de cima, EM DEGRAUS (correção do dono, 14/11/2026: "deve se inspirar na imagem em anexo" — a vista
         aérea em que cada trecho tem o seu tamanho): cinco trechos, cada um mais fundo e mais alto que o anterior,
         do oeste até o leste; e a lateral coberta */
      { dentro: { a: 90, b: 59, r: 59 }, fora: ARR_FORA(34), h: [9, 20], fileiras: 16, corredorFrente: 2,
        trechos: [
          { de: -25, ate: 25, fora: ARR_FORA(34), h: [9, 26], padrao: 'redemoinho', bandas: ARR_BANDAS, fase: 80, torcao: 12, semCadeiras: true, corredor: 22, parapeito: 2, bocas: { cada: 12.5, f: 0.42, w: 4, d: 4, cor: '#e9e8e2' } },
          { de: 25, ate: 75, fora: ARR_FORA(28), h: [9, 23], padrao: 'redemoinho', bandas: ARR_BANDAS, fase: 80, torcao: 12, semCadeiras: true, corredor: 22, parapeito: 2, bocas: { cada: 12.5, f: 0.42, w: 4, d: 4, cor: '#e9e8e2' } },
          { de: 75, ate: 125, fora: ARR_FORA(22), h: [9, 20], padrao: 'redemoinho', bandas: ARR_BANDAS, fase: 80, torcao: 12, semCadeiras: true, corredor: 22, parapeito: 2, bocas: { cada: 12.5, f: 0.42, w: 4, d: 4, cor: '#e9e8e2' } },
          { de: 125, ate: 165, fora: ARR_FORA(16), h: [9, 17], padrao: 'redemoinho', bandas: ARR_BANDAS, fase: 80, torcao: 12, semCadeiras: true, corredor: 22, parapeito: 2 },
          { de: 165, ate: 205, fora: ARR_FORA(13), h: [9, 15.5], padrao: 'redemoinho', bandas: ARR_BANDAS, fase: 80, torcao: 12, semCadeiras: true, corredor: 22, parapeito: 2 },
          /* a lateral coberta: só o andar de cima, as cadeiras debaixo do concreto */
          { de: 205, ate: 335, fora: ARR_FORA(22), h: [9, 20], cor: '#b9b6ac', cor2: '#a5a299', padrao: 'mosaico', mistura: 0.3, corredor: 16,
            cobertura: { h: 30, larg: 21, avanco: 3, cai: 1.5, cor: '#7b7972', cor2: '#696761', listras: true, corTrelica: '#4f4e4a', corPilar: '#8a8985' } }
        ] }
    ],
    fachada: { cor: '#d9d6cb' },
    blocos: [
      /* o gramado em volta do campo, dentro da margem de terra */
      { u: 0, v: 0, w: 121, d: 80, h: 0.02, y: 0.07, cor: '#4c9656' },
      /* os bancos de reserva do lado coberto e o placar no alto do norte */
      { u: -22, v: -41.5, w: 10, d: 2, h: 1.6, cor: '#d98a92' }, { u: 22, v: -41.5, w: 10, d: 2, h: 1.6, cor: '#d98a92' },
      { u: 2, v: 77, w: 14, d: 2, h: 5, y: 20, cor: '#17181b' }
    ],
    refletores: [[-82, 86, 46], [84, 90, 46], [-94, -88, 46], [96, -86, 46]],
    entorno: [
      { tipo: 'casas', u: -40, v: 118, nu: 16, nv: 3, passo: 13 }, { tipo: 'agua', u: 60, v: 142, w: 200, d: 10 },
      { tipo: 'casas', u: -146, v: 10, nu: 3, nv: 14, passo: 13 }, { tipo: 'casas', u: 158, v: 60, nu: 3, nv: 6, passo: 13 },
      { tipo: 'arvores', u: 150, v: -30, w: 30, d: 70, n: 14 }, { tipo: 'predio', u: 150, v: 118, w: 26, d: 18, h: 8, cor: '#d9d6cb', cor2: '#b5b2a7' },
      { tipo: 'estacionamento', u: -30, v: -112, w: 110, d: 22, cheio: 0.25 }, { tipo: 'quadra', u: 96, v: -116, w: 44, d: 26 },
      { tipo: 'rua', de: [-220, -98], ate: [220, -98], larg: 9 }, { tipo: 'rua', de: [-124, -160], ate: [-124, 160], larg: 9 }, { tipo: 'rua', de: [136, -160], ate: [136, 160], larg: 9 },
      { tipo: 'rua', de: [-220, 100], ate: [220, 100], larg: 8 }
    ],
    /* o Inferno Coral atrás do gol do leste; a Raça Coral no norte; a visitante atrás do gol do oeste */
    jogo: { mandante1: [-18, 18], mandante2: [72, 108], mandante3: [250, 290], visitante: [163, 197], tunelMandante: 0, tunelVisitante: 180,
            torcidas: { inferno_coral: 'mandante1', raca_coral: 'mandante2' } }
  }
};
