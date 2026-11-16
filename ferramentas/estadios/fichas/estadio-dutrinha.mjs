/* DUTRINHA (Estádio Presidente Eurico Gaspar Dutra; Mixto, Cuiabá, Centro
   Sul) — pelo satélite (a planta) e pelas quatro fotos que o dono mandou
   (16/11/2026: "segue imagens melhores do dutrinha"): a principal vista do
   gramado, duas aéreas (uma de dia, uma de noite) e uma aérea por trás da
   principal. O campo corre de sudoeste a nordeste; no quadro o NOROESTE fica
   em cima e o NORDESTE à direita. Estádio pequeno, tombado, VERDE E BRANCO,
   de duas arquibancadas, uma de cada lado do campo, e muro nos dois fundos:
   · EM CIMA (noroeste), a PRINCIPAL: degrau de cimento pintado de branco,
     elevada em cima das salas (parede verde na frente), com o TELHADO VERDE
     de metal sobre a parte de trás e a TRIBUNA branca com o nome do estádio
     no meio; por trás, o prédio branco de base verde. Ao pé dela, os bancos
     de reserva e a grade verde.
   · EMBAIXO (sudeste), a arquibancada baixa descoberta, de degrau pintado de
     VERDE, do comprimento do campo, com as casinhas brancas atrás.
   · À ESQUERDA (sudoeste), o muro de placas de cimento; À DIREITA
     (nordeste), o muro branco de base verde. Só muro, sem arquibancada.
   · Três postes de refletores de cada lado; a torre de tijolo atrás da
     principal.
   AS FOTOS SÃO DE DUAS ÉPOCAS: duas mostram a principal descoberta, só com
   a tribuna (e é assim que o satélite a mostra); as outras duas, a de noite
   com os refletores novos entre elas, mostram o telhado verde. Fiz COM o
   telhado verde, que me parece o estado mais novo; não tenho data.
   (Na primeira versão, só pelo satélite, a principal saiu com seis metros
   de fundo e de cimento: eu tinha lido os degraus brancos de cima como o
   telhado de um prédio.)
   O QUE É ESTIMADO: as alturas, quanto do fundo o telhado cobre, a posição
   da tribuna e dos postes, a torre de tijolo. Não achei mapa de setores.
   AS TORCIDAS (escolhas minhas, sem fonte): a Boca Suja na arquibancada
   verde do sudeste; a visitante na ponta sudoeste da principal. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const LAT = b => ({ a: 112, b, r: 0.5 });
const BR = '#eeeeea', BR2 = '#e3e3de', VD = '#1f7a55', VDC = '#4fa884', VDT = '#2f9a68', MUR = '#ecebe5';
/* um MURO por uma linha de pontos: um bloco fino girado em cada trecho */
const MURO = (pts, h = 2.8, cor = MUR, d = 0.4) => pts.slice(1).map((b, i) => { const a = pts[i], du = b[0] - a[0], dv = b[1] - a[1];
  return { u: (a[0] + b[0]) / 2, v: (a[1] + b[1]) / 2, w: Math.hypot(du, dv) + d, d, h, cor, giro: Math.atan2(dv, du) / RAD }; });
/* o muro branco de base verde */
const MUROVB = pts => [...MURO(pts), ...MURO(pts, 1, VD, 0.55)];
/* a principal: degrau branco, elevada, com o telhado verde na parte de trás */
const PRINC = { cor: BR, cor2: BR2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corEspelho: '#cfcfc9', corEscada: '#dcdcd6', vomitorios: false, paredeAtras: true, corFachada: BR, corMureta: VD, parapeito: 2.2 };
const TELHADO = { pelaColuna: true, h: 13.6, larg: 11.5, avanco: 0.3, cai: 1.5, cor: VDT, cor2: '#2a8c5e', listras: true, corTrelica: '#e9e9e4', corPilar: '#e9e9e4' };
/* a do sudeste: degrau verde, baixa */
const VERDE = { cor: '#3f9e73', cor2: '#389268', padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corEspelho: '#2f8059', corEscada: '#dcdcd6', vomitorios: false, paredeAtras: true, corFachada: BR, corMureta: VDC, parapeito: 1.4 };

export default {
  id: 'estadio-dutrinha', nome: 'Dutrinha', clubes: ['mixto', 'uniao-rondonopolis'], norte: 43.1, vazado: 0.3, folga: 26,
  chao: { cor: '#9c968a' },
  campo: { corMargem: '#4f9a4c' },
  corMureta: VDC, corAlambrado: '#3f9e73',
  alambrado: { cor: '#3f9e73', corBase: VDC },
  aneis: [
    /* a faixa em volta do gramado, com a grade verde: é por ela que se passa de uma arquibancada à outra */
    { dentro: { a: 57, b: 38, r: 0.5 }, fora: { a: 59.5, b: 40.5, r: 0.5 }, reto: true, h: [0.15, 0.15], corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#8fa184' }] },
    { dentro: LAT(40.5), fora: LAT(56.5), reto: true, h: [2.4, 9.6], corredorFrente: 1,
      trechos: [
        /* EM CIMA (noroeste): a principal, em três panos: os dois de telhado verde e o do meio, da tribuna */
        { ...PRINC, de: A(54, 40.5), ate: A(7, 40.5), corredor: 15.6, cobertura: TELHADO },
        { ...PRINC, de: A(7, 40.5), ate: A(-15, 40.5), corredor: 0 },
        { ...PRINC, de: A(-15, 40.5), ate: A(-63, 40.5), corredor: 16, cobertura: TELHADO },
        /* EMBAIXO (sudeste): a arquibancada baixa de degrau verde, em dois panos */
        { ...VERDE, de: A(-51.1, -40.5), ate: A(-0.4, -40.5), fora: LAT(46.5), h: [0.8, 3.8], corredor: 16.9 },
        { ...VERDE, de: A(0.4, -40.5), ate: A(63, -40.5), fora: LAT(46.5), h: [0.8, 3.8], corredor: 15.6 }
      ] }
  ],
  fachada: { cor: BR },
  /* os seis postes de refletores, três de cada lado */
  refletores: [[-42, 59.5, 24], [0, 60.5, 24], [40, 59.5, 24], [-40, -50, 24], [5, -50, 24], [50, -50, 24]],
  blocos: [
    /* a TRIBUNA branca no meio da principal, com a faixa verde do nome e a marquise escura na frente */
    { u: -4, v: 53.5, w: 6, d: 22, h: 5.6, y: 9.6, cor: BR, giro: -90, texto: 'ESTÁDIO PRESIDENTE EURICO GASPAR DUTRA', textoFace: true, corTexto: VD },
    { u: -4, v: 50.3, w: 20, d: 0.3, h: 1.1, y: 13.6, cor: VD }, { u: -4, v: 47.6, w: 22, d: 5.6, h: 0.3, y: 12, cor: '#474b50', cobertura: true },
    /* o prédio branco de base verde, por trás da principal */
    { u: -5.6, v: 59.4, w: 114.8, d: 5.4, h: 10.4, cor: BR }, { u: -5.6, v: 59.4, w: 115.2, d: 5.8, h: 2.4, cor: VD },
    /* a torre de tijolo, atrás da ponta nordeste da principal */
    { u: 46, v: 65, w: 3, d: 3, h: 17, cor: '#b98a5a' }, { u: 46, v: 65, w: 3.8, d: 3.8, h: 2.2, y: 17, cor: '#c9a577' },
    /* os dois bancos de reserva, ao pé da principal */
    { u: -28, v: 39.6, w: 8.4, d: 1.6, h: 2, cor: '#b9a98f' }, { u: 37.1, v: 39.6, w: 8.4, d: 1.6, h: 2, cor: '#b9a98f' },
    /* as casinhas brancas de base verde, atrás da arquibancada do sudeste */
    { u: -43.7, v: -52, w: 14.6, d: 5, h: 3.4, cor: BR }, { u: -2.8, v: -52, w: 29.4, d: 5, h: 3.4, cor: BR }, { u: 40, v: -52, w: 24, d: 5, h: 3.4, cor: BR },
    { u: -43.7, v: -52, w: 14.9, d: 5.3, h: 1, cor: VD }, { u: -2.8, v: -52, w: 29.7, d: 5.3, h: 1, cor: VD }, { u: 40, v: -52, w: 24.3, d: 5.3, h: 1, cor: VD },
    /* O MURO do terreno, pelo satélite: o de placas de cimento da rua do sudoeste; o branco de base verde do fundo do
       sudeste, da rua do nordeste e do pátio da avenida. A ligação do canto norte é estimada. */
    ...MURO([[-62.3, 70.3], [-62.3, -43], [-60.2, -55.6]], 3, '#bdbbb3'),
    ...MUROVB([[-60.2, -55.6], [64.4, -55.6], [64.4, 43], [58, 50], [58, 70.3], [-62.3, 70.3]]),
    ...MUROVB([[59.2, 40.5], [59.2, -40.5]])
  ],
  /* a câmera da aérea do dono: do alto, por trás do fundo do sudoeste, com a principal à esquerda */
  vista: [-150, 75, 8, -5, 0, 4],
  entorno: [
    /* em cima (noroeste): o pátio e a avenida; dos lados, as duas ruas; embaixo, o estacionamento */
    { tipo: 'estacionamento', u: -5, v: 66.5, w: 110, d: 6, cheio: 0.1 }, { tipo: 'rua', de: [-125, 80], ate: [125, 80], larg: 12 }, { tipo: 'casas', u: 0, v: 102, nu: 14, nv: 1, passo: 15 },
    { tipo: 'rua', de: [-70, 80], ate: [-70, -100], larg: 9 }, { tipo: 'casas', u: -92, v: -8, nu: 1, nv: 9, passo: 15 },
    { tipo: 'rua', de: [71, 80], ate: [71, -100], larg: 9 }, { tipo: 'arvores', u: 96, v: -5, w: 26, d: 110, n: 12 },
    { tipo: 'estacionamento', u: -22, v: -80, w: 70, d: 34, cheio: 0.06 }, { tipo: 'predio', u: 40, v: -82, w: 30, d: 26, h: 7, cor: '#d9d6cc' }
  ],
  jogo: { mandante1: [232, 282], mandante2: [288, 324], mandante3: [40, 100], visitante: [118, 145], tunelMandante: 180, tunelVisitante: 0, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.5, visitante3: 0.5 },
          torcidas: { boca_suja: 'mandante1' } }
};
