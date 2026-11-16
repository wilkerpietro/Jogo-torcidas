/* ESTÁDIO DA COLINA (Ismael Benigno, São Raimundo e Nacional, Manaus) — pelas
   cinco fotos que o dono mandou (16/11/2026: "segue o estádio da colina"; uma
   de drone, uma de dentro, dois postais aéreos e a fachada) e pelo satélite. O
   rumo do campo, 11,6 graus, saiu do contorno do gramado no OpenStreetMap; o
   meio do campo (o círculo central no satélite) fica a 1,8 m e 5,5 m do meio do
   contorno.
   No quadro o NORTE fica à direita e o OESTE em cima; o estacionamento fica à
   esquerda (sul) e a Av. Presidente Dutra passa embaixo (leste).
   Estádio fechado nos quatro lados, colado na grama, todo azul-rei: degrau
   claro sem cadeira, escadas azuis, muros e fundos azuis.
   · EM CIMA (oeste), a lateral maior, com a cabine azul no alto, no meio, e os
     bancos de reserva brancos na frente;
   · À DIREITA (norte), atrás do gol, a mais funda (18 m), com a boca no meio;
   · EMBAIXO (leste), a do lado da avenida: mais estreita e íngreme, com as três
     caixas brancas de escada na frente; de fora ela é a parede azul da avenida;
   · À ESQUERDA (sul), a de trás do outro gol: de fora, pro estacionamento, é o
     prédio de térreo de vidro e faixa azul; no canto com a avenida, a torre
     azul da entrada.
   ESTIMADO: as alturas; QUE O LADO SUL É ARQUIBANCADA (no satélite tem as mesmas
   listras azuis de escada e a boca no meio, como a do norte; na foto de drone,
   tirada de trás dela, só aparece a fachada); onde fica o letreiro ESTÁDIO
   ISMAEL BENIGNO (pus na parede da avenida, perto da torre); as torres de luz.
   AS TORCIDAS (escolha minha): a da casa na lateral da cabine, com o apoio
   atrás do gol do sul; a visitante atrás do gol do norte. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AZUL = '#2447ad', AZUL2 = '#1d3b93', BRANCO = '#eceeed';
/* a beira de dentro (o fim da grama) e os fundos de cada lado */
const I = { a: 61, b: 39, r: 0.5 };
const LAT = b => ({ a: 61, b, r: 0.5 }), FUN = a => ({ a, b: 39, r: 0.5 });
/* as laterais vão de u = -50,8 a u = 58,2; os fundos, de v = -38,5 a v = 38,1 */
const LU0 = -50.8, LU1 = 58.2, FV0 = -38.5, FV1 = 38.1;
const DEGRAU = { cor: '#d3d6da', cor2: '#c7cbd1', padrao: 'mosaico', mistura: 0.3, semCadeiras: true, espelhoPintado: true, corEscada: AZUL,
  vomitorios: false, parapeito: 1.4, corFachada: AZUL, corLado: AZUL, corMureta: AZUL };
const BOCA = { em: [0.5], f: 0.2, larg: 4.4, fundo: 3.6 };

export default {
  id: 'estadio-da-colina', nome: 'Estádio da Colina', clubes: ['sao-raimundo', 'nacional'], norte: 11.6, vazado: 0.3, folga: 24,
  chao: { cor: '#8b8a86' },
  campo: { c: 108, l: 70, corMargem: '#4f9a55' },
  corMureta: AZUL, corAlambrado: '#3b5cc0',
  aneis: [
    /* a margem de grama em volta do gramado: liga as quatro arquibancadas */
    { dentro: { a: 57.5, b: 37, r: 0.5 }, fora: I, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    { dentro: I, fora: LAT(50.5), reto: true, h: [2.4, 9.4], fileiras: 11, corredorFrente: 1.6,
      trechos: [
        /* À DIREITA (norte), atrás do gol: a mais funda, com a boca no meio */
        { de: A(61, FV0) - 360, ate: A(61, FV1), fora: FUN(79.2), h: [1.8, 10.6], fileiras: 18, ...DEGRAU, corredor: 12.5, vomitorios: BOCA },
        { de: A(61, FV1), ate: A(LU1, 39), tipo: 'vazio' },
        /* EM CIMA (oeste), a lateral da cabine */
        { de: A(LU1, 39), ate: A(LU0, 39), fora: LAT(52.5), h: [1.8, 8.6], fileiras: 13, ...DEGRAU, corredor: 13.6 },
        { de: A(LU0, 39), ate: A(-61, FV1), tipo: 'vazio' },
        /* À ESQUERDA (sul), atrás do outro gol: de fora é o prédio do estacionamento */
        { de: A(-61, FV1), ate: A(-61, FV0), fora: FUN(76.6), h: [1.8, 9.4], fileiras: 15, ...DEGRAU, corredor: 15.4, vomitorios: BOCA },
        { de: A(-61, FV0), ate: A(LU0, -39), tipo: 'vazio' },
        /* EMBAIXO (leste), a do lado da avenida: estreita e íngreme */
        { de: A(LU0, -39), ate: A(LU1, -39), ...DEGRAU, corredor: 13.6 },
        { de: A(LU1, -39), ate: A(61, FV0), tipo: 'vazio' }
      ] }
  ],
  fachada: { cor: AZUL },
  refletores: [[-30, 56.5, 28], [32, 56.5, 28], [-30, -54.5, 28], [32, -54.5, 28]],
  blocos: [
    /* a cabine azul no alto da lateral do oeste, no meio */
    { u: 3.7, v: 51.2, w: 14, d: 3.2, h: 3.2, y: 8.6, cor: AZUL2 }, { u: 3.7, v: 49.55, w: 12.6, d: 0.2, h: 1.3, y: 9.7, cor: '#27303c' },
    /* os bancos de reserva brancos, ao pé dela */
    { u: -16.8, v: 37.9, w: 13, d: 2, h: 2.1, cor: BRANCO }, { u: 19, v: 37.9, w: 13, d: 2, h: 2.1, cor: BRANCO },
    /* as três caixas brancas de escada na frente da do leste */
    ...[-30, 3.7, 37].map(u => ({ u, v: -38, w: 3, d: 1.8, h: 2.4, cor: BRANCO })),
    /* a torre azul da entrada, no canto do sul com a avenida, e os blocos de escada dos outros cantos */
    { u: -66.5, v: -45.2, w: 10.5, d: 11, h: 12.6, cor: AZUL },
    { u: -59.5, v: 46.2, w: 16.5, d: 12.6, h: 4.2, cor: AZUL2 },
    { u: 65.6, v: -45.2, w: 14, d: 11, h: 4.2, cor: AZUL2 },
    /* o fundo da do sul visto do estacionamento: o térreo de vidro com os pilares brancos e a marquise */
    { u: -76.85, v: (FV0 + FV1) / 2, w: 0.3, d: FV1 - FV0, h: 3.8, cor: '#3b4754' },
    ...Array.from({ length: 13 }, (_, i) => ({ u: -77, v: FV0 + (FV1 - FV0) * i / 12, w: 0.5, d: 0.5, h: 3.8, cor: BRANCO })),
    { u: -77.6, v: (FV0 + FV1) / 2, w: 1.8, d: FV1 - FV0 + 1, h: 0.3, y: 3.8, cor: AZUL2 },
    /* o letreiro na parede da avenida, perto da torre: a faixa branca de letras azuis */
    { u: -34, v: -50.75, w: 0.3, d: 30, h: 2.6, y: 4.4, cor: '#f1f2f0', texto: 'ESTÁDIO ISMAEL BENIGNO', corTexto: AZUL, textoFace: true, giro: -90, textoLargura: 0.92, textoAltura: 0.6 }
  ],
  /* a câmera da foto de drone do dono: do alto, por cima do estacionamento do sul, olhando o campo ao comprido */
  vista: [-150, 62, -14, 0, 0, 0],
  entorno: [
    { tipo: 'estacionamento', u: -112, v: -4, w: 52, d: 84 },
    { tipo: 'rua', de: [-170, -60], ate: [170, -60], larg: 12 }, { tipo: 'rua', de: [-170, -84], ate: [170, -84], larg: 9 },
    { tipo: 'rua', de: [-170, 66], ate: [170, 66], larg: 8 }, { tipo: 'rua', de: [88, -170], ate: [88, 170], larg: 8 },
    { tipo: 'arvores', u: 0, v: -72, w: 180, d: 8, n: 16 },
    { tipo: 'casas', u: 0, v: 84, nu: 13, nv: 2, passo: 14 }, { tipo: 'casas', u: 106, v: 0, nu: 2, nv: 8, passo: 14 },
    { tipo: 'predio', u: 52, v: -100, w: 32, d: 26, h: 9, cor: '#d9dbda' }, { tipo: 'casas', u: -40, v: -104, nu: 8, nv: 1, passo: 15 }
  ],
  jogo: { mandante1: [62, 100], mandante2: [160, 200], mandante3: [108, 138], visitante: [-22, 24], tunelMandante: 90, tunelVisitante: 0, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { forca_azul: 'mandante1', narraca: 'mandante1' } }
};
