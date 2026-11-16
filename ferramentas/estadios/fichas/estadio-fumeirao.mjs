/* FUMEIRÃO (Estádio Municipal Coaracy da Mata Fonseca, ASA, Arapiraca) — SÓ PELO
   SATÉLITE (o do Google): o dono pediu "depois o estádio de arapiraca"
   (16/11/2026) e ainda não mandou fotos. O rumo do campo, 17,6 graus, saiu do
   contorno do gramado no OpenStreetMap.
   No quadro a lateral coberta fica EM CIMA.
   Quatro arquibancadas retas em volta da grama (120 × 84 m de grama pra um campo
   de 105 × 68):
   · EM CIMA, a lateral principal, de 120 m, coberta de telha clara em quatro
     panos (o do meio é diferente: a tribuna), com os bancos de reserva ao pé;
   · EMBAIXO, a outra lateral, descoberta, de degrau cinza, com três bocas;
   · À DIREITA, atrás do gol, a de degrau cinza, que emenda na lateral de baixo
     por um canto arredondado;
   · À ESQUERDA, atrás do outro gol, a mais curta (68 m), solta das laterais.
   ESTIMADO, QUASE TUDO: as alturas, as cores (pus o degrau de cimento cinza e os
   muros brancos de barra preta, pelas cores do ASA; do satélite não dá pra ver
   pintura), se a da esquerda é coberta (li como descoberta), as torres de luz.
   AS TORCIDAS (escolha minha): a Mancha Negra no meio da lateral descoberta; a
   visitante atrás do gol da esquerda. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const CIM = '#a9aaac', CIM2 = '#9c9da0', BRANCO = '#ecece8', PRETO = '#26272a';
/* a beira de dentro (o fim da grama) e os fundos de cada lado */
const I = { a: 64, b: 46, r: 0.5 };
const LAT = b => ({ a: 64, b, r: 0.5 }), FUN = a => ({ a, b: 46, r: 0.5 });
const DEGRAU = { cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corEscada: BRANCO, corredor: 15, vomitorios: false, paredeAtras: true, corFachada: BRANCO, parapeito: 1.3 };
const TELHA = { h: 11.5, larg: 12.6, avanco: 0.8, cai: 1.2, cor: '#c9cbc8', cor2: '#bcbfbc', listras: true, corTrelica: '#8f9396', corPilar: '#d9d9d4', pelaColuna: true };

export default {
  id: 'estadio-fumeirao', nome: 'Fumeirão', clubes: ['asa'], norte: 17.6, vazado: 0.3, folga: 24,
  chao: { cor: '#a39a86' },
  campo: { corMargem: '#4f9a55' },
  corMureta: BRANCO, corAlambrado: '#d9dcdf',
  aneis: [
    /* a grama em volta do campo, até o pé das arquibancadas */
    { dentro: { a: 55.5, b: 37, r: 0.5 }, fora: I, reto: true, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    { dentro: I, fora: LAT(59), reto: true, h: [1.4, 7.4], fileiras: 13, corredorFrente: 1.6,
      trechos: [
        /* À DIREITA, atrás do gol: emenda na lateral de baixo pelo canto */
        { de: A(64, -45.5) - 360, ate: A(64, 40), fora: FUN(76.5), ...DEGRAU },
        { de: A(64, 40), ate: A(62, 46), tipo: 'vazio' },
        /* EM CIMA, a lateral coberta: dois panos de telha, a tribuna no meio, mais dois panos */
        { de: A(62, 46), ate: A(12, 46), ...DEGRAU, cobertura: TELHA },
        { de: A(12, 46), ate: A(-10, 46), cor: '#3a3c40', cor2: BRANCO, padrao: 'blocos', bloco: 1.2, corredor: 0, vomitorios: false, paredeAtras: true, corFachada: BRANCO, parapeito: 2.6,
          pisoPintado: true, cobertura: { ...TELHA, h: 12.4, cor: '#dedfdb', cor2: '#d2d4d0' } },
        { de: A(-10, 46), ate: A(-58, 46), ...DEGRAU, cobertura: TELHA },
        { de: A(-58, 46), ate: A(-64, 38), tipo: 'vazio' },
        /* À ESQUERDA, atrás do outro gol: a mais curta, solta das laterais */
        { de: A(-64, 38), ate: A(-64, -30), fora: FUN(77), ...DEGRAU },
        { de: A(-64, -30), ate: A(-50, -46), tipo: 'vazio' },
        /* EMBAIXO, a lateral descoberta, com as três bocas */
        { de: A(-50, -46), ate: A(64, -45.5), ...DEGRAU, vomitorios: { em: [0.22, 0.44, 0.68], f: 0.25, larg: 4.6, fundo: 3.4 } }
      ] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[-30, 63, 26], [30, 63, 26], [-30, -62, 26], [30, -62, 26]],
  blocos: [
    /* os bancos de reserva, ao pé da lateral coberta */
    ...[-22, 0, 22].map(u => ({ u, v: 43.2, w: 9, d: 2.2, h: 2.1, cor: BRANCO })),
    /* a barra preta no pé dos muros de fora das duas laterais */
    { u: 2, v: 59.25, w: 122, d: 0.3, h: 1.4, cor: PRETO }, { u: 4, v: -59.25, w: 110, d: 0.3, h: 1.4, cor: PRETO }
  ],
  /* do alto do canto da lateral descoberta, olhando a coberta */
  vista: [-70, 30, -70, 10, 2, 30],
  entorno: [
    { tipo: 'rua', de: [-170, -84], ate: [170, -70], larg: 14 }, { tipo: 'rua', de: [88, -170], ate: [88, 170], larg: 12 },
    { tipo: 'rua', de: [-96, -170], ate: [-96, 170], larg: 9 }, { tipo: 'casas', u: -10, v: -70, nu: 9, nv: 1, passo: 14 },
    { tipo: 'predio', u: 40, v: 108, w: 50, d: 14, h: 6, cor: '#e4e4df' }, { tipo: 'casas', u: 118, v: 0, nu: 2, nv: 9, passo: 15 },
    { tipo: 'casas', u: -124, v: 0, nu: 2, nv: 9, passo: 15 }
  ],
  jogo: { mandante1: [256, 286], mandante2: [-18, 14], mandante3: [72, 100], visitante: [168, 196], tunelMandante: 88, tunelVisitante: 100, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { mancha_negra_do_asa: 'mandante1' } }
};
