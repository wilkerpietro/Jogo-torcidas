/* BATISTÃO (Estádio Estadual Lourival Baptista, Confiança e Sergipe, Aracaju) —
   pelas três fotos que o dono mandou (16/11/2026: "segue as imagens do
   batistão"; duas aéreas, uma de dia e uma de noite, e uma de dentro) e pelo
   satélite (o do Google; a Esri não tem Aracaju). O rumo do campo, 179,8 graus,
   saiu do contorno do gramado no OpenStreetMap.
   No quadro o SUL fica à direita, o NORTE à esquerda, o LESTE em cima e o OESTE
   (a lateral das cadeiras brancas) embaixo.
   Oval inteiro de um lance só, em elipse (208 × 167 m por fora), com a grama
   também em elipse e a pista estreita de concreto ao pé da mureta:
   · a metade do NORTE de cadeiras VERMELHAS (o lado do Sergipe) e a metade do
     SUL de cadeiras AZUIS (o lado do Confiança);
   · a lateral do OESTE de cadeiras brancas, debaixo da cobertura branca: a de
     telha em gomos e, na ponta do sul, a de lona em abóbadas lisas;
   · a lateral do LESTE também coberta, de telha em gomos, com as cadeiras
     vermelhas e azuis se encontrando debaixo dela;
   · por fora, o muro amarelo na volta toda; quatro torres de luz.
   ESTIMADO: as alturas; a cor das cadeiras debaixo da cobertura do leste (o
   satélite mostra uma faixa escura; pus o vermelho e o azul se encontrando no
   meio, como parece na foto de dentro); onde ficam as bocas.
   AS TORCIDAS (escolha minha, pelas cores): a do Confiança atrás do gol do
   sul, no azul; a do Sergipe atrás do gol do norte, no vermelho; a visitante
   no meio da lateral do leste. */
const VERM = '#a8283c', VERM2 = '#992436', AZUL = '#2c4f9e', AZUL2 = '#274690', BRANCA = '#dcdfe5', BRANCA2 = '#ccd1da', AMARELO = '#e3b92f';
/* a beira da grama, a frente da arquibancada (o fim da pista) e o muro de fora: elipses */
const GRAMA = { a: 82.5, b: 58, forma: 'elipse' }, DENTRO = { a: 86.5, b: 61.5, forma: 'elipse' }, FORA = { a: 104, b: 83.5, forma: 'elipse' };
/* onde começam e acabam as duas coberturas (pelas pontas delas no satélite) */
const L0 = 51, L1 = 138, O0 = 222, O1 = 308, LONA = 278;
const CADEIRA = (cor, cor2, mais) => ({ cor, cor2, padrao: 'mosaico', mistura: 0.3, corredor: 13, pisoPintado: true, vomitorios: { f: 0.45, cada: 2, cor: '#3a3320', corParapeito: AMARELO },
  parapeito: 1.3, corFachada: AMARELO, ...mais });
const TELHA = { h: 15, larg: 21, avanco: 1.2, cai: 1.6, cor: '#eeede6', cor2: '#d9d8d0', listras: true, corTrelica: '#c9c9c3', corPilar: '#d9d9d3' };

export default {
  id: 'estadio-batistao', nome: 'Batistão', clubes: ['confianca', 'sergipe'], norte: 179.8, vazado: 0.3, folga: 24,
  chao: { cor: '#8f8c84' },
  campo: { c: 107, l: 70, corMargem: '#4f9a55' },
  corMureta: '#e9e7de', alambrado: { cor: '#d9dcdf' },
  aneis: [
    /* a pista estreita de concreto, entre a grama e a mureta */
    { dentro: GRAMA, fora: DENTRO, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#c9c5b8' }] },
    { dentro: DENTRO, fora: FORA, h: [1.8, 10.6], fileiras: 22, corredorFrente: 1.6,
      trechos: [
        /* o fundo do SUL e os dois cantos dele: azul */
        { de: O1 - 360, ate: L0, ...CADEIRA(AZUL, AZUL2) },
        /* a lateral do LESTE, coberta: o azul e o vermelho se encontram no meio */
        { de: L0, ate: 95, ...CADEIRA(AZUL, AZUL2, { cobertura: TELHA }) },
        { de: 95, ate: L1, ...CADEIRA(VERM, VERM2, { cobertura: TELHA }) },
        /* o fundo do NORTE e os dois cantos dele: vermelho */
        { de: L1, ate: O0, ...CADEIRA(VERM, VERM2) },
        /* a lateral do OESTE, a das cadeiras brancas: a telha em gomos e, na ponta do sul, a lona lisa */
        { de: O0, ate: LONA, ...CADEIRA(BRANCA, BRANCA2, { cobertura: TELHA }) },
        { de: LONA, ate: O1, ...CADEIRA(BRANCA, BRANCA2, { cobertura: { ...TELHA, h: 15.6, cor: '#f6f6f2', cor2: '#eceee9', corTrelica: '#e4e4df' } }) }
      ] }
  ],
  fachada: { cor: AMARELO },
  refletores: [[-80, 80, 40], [74, 82, 40], [-80, -82, 40], [74, -84, 40]],
  blocos: [
    /* os bancos de reserva, do lado das cadeiras brancas */
    { u: -15, v: -54.5, w: 13, d: 2.2, h: 2.2, cor: '#e9eaf0' }, { u: 13, v: -54.5, w: 13, d: 2.2, h: 2.2, cor: '#e9eaf0' }
  ],
  /* a câmera da foto de dentro do dono: do alto do fundo do sul, no azul, olhando o fundo vermelho */
  vista: [112, 20, 4, -40, 2, 0],
  entorno: [
    { tipo: 'rua', de: [-170, 104], ate: [170, 104], larg: 12 }, { tipo: 'rua', de: [128, -170], ate: [150, 170], larg: 12 },
    { tipo: 'rua', de: [-170, -106], ate: [170, -106], larg: 9 }, { tipo: 'rua', de: [-124, -170], ate: [-124, 170], larg: 9 },
    { tipo: 'piscina', u: -108, v: 76, w: 34, d: 22 }, { tipo: 'predio', u: 150, v: 40, w: 40, d: 60, h: 14, cor: '#cfd0cc' },
    { tipo: 'arvores', u: 20, v: 95, w: 90, d: 8, n: 9 }, { tipo: 'casas', u: 0, v: 124, nu: 14, nv: 1, passo: 16 },
    { tipo: 'casas', u: -150, v: -20, nu: 2, nv: 8, passo: 16 }, { tipo: 'predio', u: -100, v: -122, w: 40, d: 26, h: 9, cor: '#d9d9d3' },
    { tipo: 'estacionamento', u: 20, v: -124, w: 120, d: 24 }
  ],
  jogo: { mandante1: [-20, 20], mandante2: [160, 200], mandante3: [252, 286], visitante: [78, 112], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { trovao_azul: 'mandante1', jovem_confianca: 'mandante3', esquadrao_colorado: 'mandante2' } }
};
