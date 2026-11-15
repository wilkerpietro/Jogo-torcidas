/* ULRICO MURSA (Portuguesa Santista, Santos) — pelo satélite e pelas fotos
   de referência (15/11/2026); o meio do campo foi tirado do círculo
   central. O campo corre de sudoeste a nordeste; no quadro o NOROESTE (a
   social coberta) fica em cima e o NORDESTE (o fundo do estacionamento) à
   direita. NÃO achei mapa de setores do clube.
   Estádio pequeno, retangular, rubro-verde, com arquibancada em três lados:
   · EM CIMA (noroeste), a SOCIAL COBERTA: cadeira em blocos vermelhos e
     verdes com as escadas brancas, em cima de um muro branco (os bancos de
     reserva ficam ao pé dele), debaixo do telhado de telha escura. Na
     ponta nordeste, o prédio do clube com o telhado grande; atrás, os
     telhados e a escadaria de trás.
   · EMBAIXO (sudeste), a arquibancada baixa descoberta, de degrau pintado
     de vermelho e de verde (desbotado), com as cinco escadas brancas.
   · À ESQUERDA (sudoeste), atrás do gol, a arquibancadinha vermelha de
     poucos degraus.
   · À DIREITA (nordeste), atrás do gol, NÃO há arquibancada: só o muro, a
     faixa de grama e o estacionamento.
   OS ACESSOS: não aparece boca de vomitório em lado nenhum; ficou sem. */
const VM = '#c8452f', VM2 = '#b93f2b';                  /* a cadeira vermelha */
const VD = '#2f7d5a', VD2 = '#2a7152';                  /* a cadeira verde */
const VMD = '#c9685a', VMD2 = '#bd5f52';                /* o degrau vermelho desbotado */
const VDD = '#6b9c80', VDD2 = '#619276';                /* o degrau verde desbotado */
const BR = '#eeeeea';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a calçada em volta do gramado; a beira das arquibancadas; o fundo da social, da arquibancada do sudeste e da do fundo */
const CALCADA = { a: 55, b: 37.5, r: 2 }, I = { a: 57.2, b: 40, r: 3 };
const F_SOCIAL = { a: 71.9, b: 54.7, r: 17.7 }, F_SUDESTE = { a: 64.7, b: 47.5, r: 10.5 }, F_FUNDO = { a: 61.3, b: 44.1, r: 7.1 };
/* a social: os blocos de cadeira, de nordeste pra sudoeste (pela foto de frente: o bloco do meio é vermelho) */
const BLOCOS = [[50, 42, VM], [42, 30, VD], [30, 18, VM], [18, 6, VD], [6, -6, VM], [-6, -18, VM], [-18, -30, VD], [-30, -41, VM]];
const SOCIAL = BLOCOS.map(([u0, u1, cor]) => ({ de: A(u0, 40), ate: A(u1, 40), cor, cor2: cor === VM ? VM2 : VD2, padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: true, corEscada: BR,
  vomitorios: false, fora: F_SOCIAL, h: [2.6, 8.6], corMureta: BR, paredeAtras: true, corFachada: BR }));
/* a arquibancada do sudeste: os degraus pintados entre as escadas brancas (as cores do satélite) */
const DEGRAUS = [[-50, -40.8, VDD], [-40.8, -17.5, VMD], [-17.5, 1.3, VDD], [1.3, 20.3, VDD], [20.3, 39.2, VMD], [39.2, 48, VMD]];
const SUDESTE = DEGRAUS.map(([u0, u1, cor]) => ({ de: A(u0, -40), ate: A(u1, -40), cor, cor2: cor === VMD ? VMD2 : VDD2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 0,
  escadaNaBorda: u0 > -50, corEscada: BR, vomitorios: false, fora: F_SUDESTE, h: [1.2, 4.4], paredeAtras: true, corFachada: BR }));

export default {
  id: 'estadio-ulrico-mursa', nome: 'Ulrico Mursa', clubes: ['portuguesa-santista'], norte: 56.7, vazado: 0.4, folga: 22,
  corEscada: BR,
  chao: { cor: '#7b7870' },
  campo: { corMargem: '#4f9353' },
  corMureta: BR,
  aneis: [
    /* a calçada em volta do gramado */
    { dentro: CALCADA, fora: I, reto: true, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#a9a69c' }] },
    /* AS ARQUIBANCADAS */
    { dentro: I, fora: F_SOCIAL, reto: true, h: [1.2, 4.4], fileiras: 10,
      trechos: [
        ...SOCIAL,
        /* a arquibancadinha vermelha atrás do gol do sudoeste */
        { de: A(-57.2, 28), ate: A(-57.2, -36), cor: '#b5564a', cor2: '#a94e43', padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 16, corEscada: BR, vomitorios: false,
          fora: F_FUNDO, h: [1, 2.8], corredorFrente: 0, paredeAtras: true, corFachada: BR },
        ...SUDESTE
      ] }
  ],
  /* o telhado de telha escura da social */
  telhados: [{ y: 12.5, h: 0.5, cor: '#55524e', pontos: [[-41, 41.5], [50, 41.5], [50, 55.5], [-41, 55.5]] }],
  fachada: { cor: BR },
  refletores: [[58, 42, 30], [-52, 60, 30], [-46, -52, 30], [46, -52, 30]],
  blocos: [
    /* o prédio do clube na ponta nordeste da social, com o telhado grande */
    { u: 58.8, v: 53.5, w: 17.5, d: 23, h: 12, cor: '#4f4d4b' },
    /* o prédio da ponta sudoeste e, atrás da social, os telhados e a escadaria de trás */
    { u: -52, v: 52, w: 21, d: 20, h: 9, cor: '#6a6763' }, { u: -21, v: 60, w: 50, d: 9, h: 6, cor: '#6b5a4f' },
    { u: 20, v: 60, w: 34, d: 8, h: 4, cor: '#9a9891' },
    /* os bancos de reserva ao pé do muro da social */
    { u: -20, v: 38.6, w: 6.5, d: 2.4, h: 2, cor: '#8fc9c4' }, { u: -0.8, v: 38.6, w: 16.5, d: 2.4, h: 2, cor: '#e9e3d6' },
    /* o muro de trás do gol do nordeste */
    { u: 59, v: 0, w: 1, d: 74, h: 3, cor: '#3f4a45' }
  ],
  entorno: [
    /* à direita (nordeste): a faixa de grama e o estacionamento */
    { tipo: 'grama', u: 65, v: 4, w: 7, d: 38, cor: '#5f9a55' }, { tipo: 'estacionamento', u: 78, v: 10, w: 16, d: 56, cheio: 0.6 },
    /* à esquerda (sudoeste): as tendas brancas e os barracões */
    { tipo: 'cupula', u: -86, v: 44, r: 19, h: 8, cor: '#f1efe9', cor2: '#e3e1da' }, { tipo: 'cupula', u: -86, v: 5, r: 11, h: 5, cor: '#f1efe9', cor2: '#e3e1da' },
    { tipo: 'predio', u: -70, v: -18, w: 6, d: 30, h: 3, cor: '#c9b9a0' },
    /* embaixo (sudeste): as árvores e a avenida */
    { tipo: 'arvores', u: -10, v: -58, w: 90, d: 8, n: 18 }, { tipo: 'rua', de: [-95, -70], ate: [95, -56], larg: 12 },
    /* em cima (noroeste): o mato do morro */
    { tipo: 'arvores', u: 0, v: 74, w: 150, d: 10, n: 34 }
  ],
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Força Rubro Verde na ponta sudoeste da arquibancada descoberta e
     a visitante na ponta nordeste dela; os outros bondes da casa na social */
  jogo: { mandante1: [A(-40, -40), A(-19, -40)], mandante2: [A(12, 40), A(-12, 40)], mandante3: [A(42, 40), A(24, 40)], visitante: [A(22, -40), A(47, -40)],
          tunelMandante: A(-29, -40), tunelVisitante: A(34, -40), folgaPM: 4,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { forca_rubro_verde: 'mandante1' } }
};
