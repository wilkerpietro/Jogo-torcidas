/* BEZERRÃO (Estádio Walmir Campelo Bezerra; Gama, DF) — pelo satélite e pelas
   quatro fotos que o dono mandou no meio do levantamento (16/11/2026): duas
   aéreas, a principal vista de frente e a concha vista de lado ("Veja o
   formato da cobertura com mais detalhes"). O campo corre de sul a norte; no
   quadro o OESTE fica em cima e o NORTE à direita. Estádio retangular, de
   quatro arquibancadas retas soltas, elevadas (entra-se por baixo, pelas
   bocas de moldura branca), de cadeira verde com as escadas claras:
   · EM CIMA (oeste), a PRINCIPAL, em três níveis: o lance de baixo (metade
     de degrau de cimento, metade de cadeira verde), o lance grande com GAMA
     escrito em cadeira branca e as sete bocas ao pé, e lá no alto o lance
     pequeno de cadeira com as cabines. Em planta ela é um D: os lados
     fecham pra trás. Por cima do fundo, a CONCHA branca (a meia cúpula do
     Ruy Ohtake): nasce do arco de treliça que passa por cima do lance
     pequeno e desce pra trás e pros lados até o muro verde em D. A concha
     cobre o lance pequeno e as cabines; o lance do GAMA fica descoberto.
   · À DIREITA (norte), a de trás do gol, a mais rasa, com duas bocas; atrás
     dela o placar e a rampa em curva.
   · À ESQUERDA (sul), a outra de trás do gol, mais funda, com duas bocas.
   · EMBAIXO (leste), a lateral comprida, com quatro bocas e os quatro postes
     de refletores no fundo.
   AS FONTES DE SETOR: os ingressos são vendidos por Norte, Sul, Leste, Oeste
   e Cadeira Oeste; uma reportagem de jogo da Série D fala em "Norte
   Visitante". Não achei onde fica a Ira Jovem.
   O QUE É ESTIMADO: todas as alturas (a concha em 33 m no meio do arco e 19
   na beirada), a largura do D atrás (o satélite mostra a casca deslocada
   pela altura), a divisão cimento/cadeira do lance de baixo (as fotos são
   de épocas diferentes: numa ele é todo de cadeira, noutra todo cinza).
   AS TORCIDAS: a visitante atrás do gol do norte (pela reportagem); a Ira
   Jovem do Gama atrás do gol do sul (escolha minha, sem fonte). */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* cada arquibancada com o seu contorno (retângulo de canto vivo): `b` é a beira de uma lateral, `a` a de um fundo */
const LAT = (b, a) => ({ a: a || 100, b, r: 0.5 }), FUN = a => ({ a, b: 90, r: 0.5 });
const VD = '#3f9762', VD2 = '#378a58', VDE = '#2e7d4f', BR = '#eceae4', CIM = '#b9b8b0', ESC = '#d5d6cf';
const BOCA = { larg: 3.4, fundo: 5, cor: '#1f2a24', corParapeito: '#f0f0ea' };
const CAD = { cor: VD, cor2: VD2, padrao: 'mosaico', mistura: 0.4, corEscada: ESC, paredeAtras: true, corFachada: VDE, corMureta: '#e6e6df', parapeito: 1.6 };
/* um MURO por uma linha de pontos: um bloco fino girado em cada trecho */
const MURO = (pts, h = 2.6, cor = '#dedcd4') => pts.slice(1).map((b, i) => { const a = pts[i], du = b[0] - a[0], dv = b[1] - a[1];
  return { u: (a[0] + b[0]) / 2, v: (a[1] + b[1]) / 2, w: Math.hypot(du, dv) + 0.4, d: 0.4, h, cor, giro: Math.atan2(dv, du) / RAD }; });
/* o meio da principal e da concha (a arquibancada está um metro e meio pro sul do meio do campo) */
const CU = -1.5;

export default {
  id: 'estadio-bezerrao', nome: 'Bezerrão', clubes: ['gama', 'ceilandia'], norte: 2, vazado: 0.3, folga: 32,
  chao: { cor: '#9a8f82' },
  campo: { corMargem: '#4b8f4a' },
  corMureta: '#e6e6df', corAlambrado: '#cfd4d0',
  alambrado: { cor: '#cfd4d0', corBase: '#e6e6df' },
  aneis: [
    /* a faixa ao pé das quatro arquibancadas: é por ela que se passa de uma à outra */
    { dentro: { a: 58.2, b: 38.3, r: 0.5 }, fora: { a: 60.7, b: 40.8, r: 0.5 }, reto: true, h: [0.15, 0.15], corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#8f9a84' }] },
    { dentro: LAT(40.8), fora: LAT(65), reto: true, h: [2.6, 13.5], corredorFrente: 1,
      trechos: [
        /* À DIREITA (norte): a de trás do gol, rasa, duas bocas */
        { ...CAD, de: A(60.7, -37) - 360, ate: A(60.7, 40.8), dentro: FUN(60.7), fora: FUN(79.3), h: [2.4, 11.2], corredor: 13, vomitorios: { ...BOCA, f: 0.12, em: [0.32, 0.67] } },
        /* À ESQUERDA (sul): a outra de trás do gol, funda, duas bocas */
        { ...CAD, de: A(-60.7, 40.8), ate: A(-60.7, -36.4), dentro: FUN(60.7), fora: FUN(87.1), h: [2.6, 14.6], corredor: 13, vomitorios: { ...BOCA, f: 0.2, em: [0.33, 0.69] } },
        /* EMBAIXO (leste): a lateral comprida, quatro bocas */
        { ...CAD, de: A(-64.4, -40.8), ate: A(61.7, -40.8), corredor: 15.8, vomitorios: { ...BOCA, f: 0.12, em: [0.18, 0.396, 0.616, 0.837] } }
      ] },
    /* EM CIMA (oeste): a PRINCIPAL. O lance de baixo: metade de degrau de cimento, metade de cadeira verde */
    { dentro: LAT(40.8, 70), fora: LAT(57.5, 70), reto: true, h: [1.6, 7.2], corredorFrente: 2.6,
      trechos: [{ ...CAD, de: A(CU + 63, 40.8), ate: A(CU - 63, 40.8), padrao: 'fracoes', fracoes: [[0.5, CIM], [1, VD]], corredor: 15.6, vomitorios: false, paredeAtras: false }] },
    /* o lance grande, com GAMA em cadeira branca e as sete bocas ao pé; os lados fecham pra trás (o D) */
    { dentro: LAT(57.5, 70), fora: LAT(79.5, 70 * 58 / 62.7), reto: true, h: [7.4, 18.2], corredorFrente: 2.2,
      trechos: [{ ...CAD, de: A(CU + 62.7, 57.5), ate: A(CU - 62.7, 57.5), corredor: 17.9, paredeAtras: false, vomitorios: { ...BOCA, f: 0, fundo: 6, em: [0.115, 0.266, 0.449, 0.508, 0.572, 0.753, 0.904] },
        texto: 'G  A  M  A', corTexto: BR, textoLargura: 0.84, textoAltura: 0.5, textoMeio: 0.56 }] },
    /* o lance pequeno do alto, debaixo da concha */
    { dentro: LAT(79.5, 70), fora: LAT(86, 70 * 42 / 46), reto: true, h: [18.6, 22], corredorFrente: 1.4,
      trechos: [{ ...CAD, de: A(CU + 46, 79.5), ate: A(CU - 46, 79.5), cor: '#57a888', cor2: '#4d9c7c', corredor: 15.3, vomitorios: false, parapeito: 0.6 }] }
  ],
  fachada: { cor: VDE },
  /* a CONCHA: o D de 126 m de boca e 65 de fundo, o arco na linha do alto do lance grande */
  conchas: [{ cu: CU, cv: 45, a: 63, b: 65, p: 2.6, vArco: 81, base: 19, h: 33, opacaDe: 86, cor: '#f6f6f2', cor2: '#eeeeea', corArco: '#d3d7d9', corArco2: '#aab0b5',
    escoras: { n: 8, v: 86.2, h: 22.4, abre: 5, cor: '#dfe2e4', esp: 0.6, pilar: false },
    muro: { cor: VDE, cor2: '#2a7449', hFrente: 3.2, vFrente: 41 } }],
  /* os quatro postes de refletores, no fundo da lateral do leste */
  refletores: [[-37.4, -62.5, 36], [-10.9, -62.5, 36], [15.6, -62.5, 36], [42, -62.5, 36]],
  blocos: [
    /* as cabines e a tribuna de vidro, no alto da principal, debaixo da concha, com a faixa do nome */
    { u: CU, v: 88.2, w: 62, d: 4.4, h: 3.4, y: 22, cor: '#dfe3e2' }, { u: CU, v: 85.9, w: 52, d: 0.3, h: 1.1, y: 23.4, cor: '#2f8a66' },
    /* o túnel do meio da principal, no lance de baixo */
    { u: CU - 1, v: 48, w: 5, d: 9, h: 0.3, y: 4.2, cor: '#1f2a24' },
    /* os dois bancos de reserva, ao pé da principal */
    { u: CU - 22, v: 40.2, w: 9, d: 1.8, h: 1.9, cor: '#e9ebe6' }, { u: CU + 22, v: 40.2, w: 9, d: 1.8, h: 1.9, cor: '#e9ebe6' },
    /* O MURO do terreno (dono, 16/11/2026: "senti falta dos muros atrás do estádio"), traçado no satélite: do canto sul da
       concha, por trás da arquibancada do sul (com as duas guaritas), por trás da lateral do leste (entre ela e o Centro
       Olímpico) e por trás da rampa do norte, até o canto norte da concha. Os trechos enviesados e a ligação do canto
       nordeste são estimados. */
    ...MURO([[-65, 65], [-82.6, 65], [-82.6, 56.7], [-106.4, 56.7], [-106.4, -14.7], [-100.4, -14.7], [-100.4, -50], [-81.2, -52], [-81.2, -68], [-58.4, -83.7],
             [82.4, -83.7], [88.6, -57.5], [124.9, -57.5], [124.9, 28], [94.1, 56.7], [61, 56.7]]),
    { u: -110.5, v: 42, w: 7, d: 7, h: 3.2, cor: '#cfcdc4' }, { u: -110.5, v: 0, w: 8, d: 9, h: 3.2, cor: '#cfcdc4' },
    /* a mureta branca da rampa em curva, atrás da arquibancada do norte */
    ...MURO([[81.6, 40], [97, 34], [108.3, 23.3], [113.5, 12], [114.9, 0], [113, -14], [108.3, -26.7], [100, -42], [89.9, -55.8]], 1.2, '#eeeeea'),
    /* o placar, atrás da arquibancada do norte */
    { u: 84, v: 5, w: 1, d: 9, h: 5, y: 7, cor: '#17191c' }, { u: 84, v: 1.5, w: 0.7, d: 0.7, h: 7, cor: '#8d949a' }, { u: 84, v: 8.5, w: 0.7, d: 0.7, h: 7, cor: '#8d949a' }
  ],
  /* a câmera de uma das fotos do dono: do alto, por trás da lateral do leste, olhando a principal */
  vista: [10, 78, -150, -2, 4, 20],
  entorno: [
    /* em cima (oeste): os estacionamentos de terra batida com as árvores e a avenida */
    { tipo: 'estacionamento', u: -100, v: 100, w: 46, d: 60, cheio: 0.35 }, { tipo: 'estacionamento', u: 70, v: 118, w: 80, d: 28, cheio: 0.06 },
    { tipo: 'arvores', u: -95, v: 62, w: 30, d: 12, n: 4 }, { tipo: 'arvores', u: 95, v: 86, w: 14, d: 50, n: 5 },
    { tipo: 'rua', de: [-150, 108], ate: [-112, 148], larg: 10 }, { tipo: 'rua', de: [100, 132], ate: [142, 70], larg: 12 },
    /* à direita (norte): a rampa em curva e a quadrinha */
    { tipo: 'grama', u: 99, v: -2, w: 14, d: 70, cor: '#b9ac9a' }, { tipo: 'quadra', u: 111, v: -76, w: 28, d: 22, cor: '#5aa58c' },
    /* embaixo (leste): o Centro Olímpico: a pista de atletismo, as piscinas e o ginásio */
    { tipo: 'grama', u: 38, v: -104, w: 98, d: 34, cor: '#a8554a' }, { tipo: 'quadra', u: 38, v: -104, w: 80, d: 20, cor: '#5d8a4f' },
    { tipo: 'predio', u: -92, v: -100, w: 66, d: 24, h: 9, cor: '#e9e6dc', giro: -36 }, { tipo: 'piscina', u: -56, v: -128, w: 24, d: 12 },
    /* à esquerda (sul): o pátio e os prédios */
    { tipo: 'estacionamento', u: -128, v: 30, w: 26, d: 60, cheio: 0.3 }, { tipo: 'predio', u: -128, v: -22, w: 22, d: 26, h: 7, cor: '#bfc4c6' }
  ],
  jogo: { mandante1: [160, 200], mandante2: [235, 305], mandante3: [60, 120], visitante: [-22, 22], tunelMandante: 180, tunelVisitante: 0, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.6, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { ira_jovem_do_gama: 'mandante1' } }
};
