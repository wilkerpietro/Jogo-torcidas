/* FRASQUEIRÃO (Estádio Maria Lamas Farache, ABC, Natal) — SEM FOTOS DO DONO
   (17/11/2026: "Rio Grande do Norte, inicie com o Frasqueirão"): pelo satélite
   (duas fontes: a do Google veio com um defeito em cima de um dos fundos; a da
   Esri é limpa, mas de antes do quarto módulo) e por quatro fotos do acervo
   livre da Wikimedia, três de 2019 e uma de 2008. O rumo do campo, 168 graus,
   saiu do contorno do gramado no OpenStreetMap.
   No quadro a principal, coberta, fica EMBAIXO.
   Quatro módulos retos em volta da grama, de degrau pintado de BRANCO com a
   FAIXA PRETA no terço do meio e as escadas listradas:
   · EM CIMA, a lateral descoberta, de 114 m por 22, com o ESCUDO DO ABC pintado
     no meio (preto, de contorno e faixa atravessada brancos e estrelas amarelas), as duas
     caixas brancas das bocas na frente e o muro branco das placas no alto;
   · À ESQUERDA e À DIREITA, atrás dos gols, as duas de 65 m por 24, iguais (a da
     direita é o quarto módulo, o mais novo); no canto de cima à direita, o placar;
   · EMBAIXO, a PRINCIPAL: as cadeiras brancas em blocos, com as escadas
     listradas de amarelo e preto, as cadeiras pretas na ponta da esquerda e, no
     meio (65 m), por trás e por cima delas, o prédio de três andares de
     camarotes e cabines, de onde sai o telhado branco em balanço.
   ESTIMADO: as alturas; os dois fundos (não tenho foto de frente de nenhum: pus
   os dois como a lateral, pela foto que mostra um deles de lado); o desenho do
   escudo, simplificado; as cores de hoje (as fotos são de 2019); as torres de luz.
   AS TORCIDAS (escolha minha): a Garra Alvinegra no meio da lateral do escudo,
   a Ultras do ABC atrás do gol da esquerda, o terceiro apoio na ponta esquerda da
   principal; a visitante atrás do gol da direita. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const BRANCO = '#ecece7', BRANCO2 = '#e0e0da', PRETO = '#2b2624', PRETO2 = '#35302d', AMARELO = '#e3c23a';
/* a beira da grama e os fundos */
const I = { a: 60, b: 42, r: 0.5 };
const LAT = b => ({ a: 60, b, r: 0.5 }), FUN = a => ({ a, b: 42, r: 0.5 });
/* a pintura: branco, com a faixa preta no terço do meio (`y` de baixo pra cima) */
const naFaixa = y => y > 0.36 && y < 0.66;
const FAIXA = (x, y, rnd) => naFaixa(y) ? (rnd() < 0.15 ? PRETO2 : PRETO) : null;
/* o ESCUDO do ABC no meio da lateral (114 × 22 m): o escudo preto de contorno branco, a faixa branca atravessada e as estrelas */
const ESTRELAS = [[-3.4, 17], [-1.1, 17], [1.2, 17], [3.5, 17], [2.2, 6.4]];
const ESCUDO = (x, y, rnd) => { const dx = (x - 0.5) * 114 + 2.75, yy = y * 22, meia = yy > 9.5 ? 7.4 : yy > 0.8 ? 7.4 * Math.sqrt((yy - 0.8) / 8.7) : -1;
  if (Math.hypot(dx, yy - 21.4) < 0.8) return AMARELO;
  if (yy < 20.4 && Math.abs(dx) < meia) {
    if (Math.abs(dx) > meia - 1.3 || yy > 19.4 || (yy < 9.5 && Math.abs(dx) > meia - 2)) return BRANCO;
    if (ESTRELAS.some(([ex, ey]) => Math.abs(dx - ex) < 0.65 && Math.abs(yy - ey) < 0.6)) return AMARELO;
    if (Math.abs((yy - 11.8) + 0.4 * dx) < 1.5) return BRANCO;
    return PRETO; }
  return FAIXA(x, y, rnd); };
const DEGRAU = { cor: BRANCO, cor2: BRANCO2, padrao: 'mosaico', mistura: 0.25, pinta: FAIXA, semCadeiras: true, espelhoPintado: true, corEscada: '#8f8d88', corredor: 14, vomitorios: false,
  paredeAtras: true, corFachada: BRANCO, corLado: BRANCO, parapeito: 2.2 };
const CADEIRAS = (cor, cor2) => ({ cor, cor2, padrao: 'mosaico', mistura: 0.3, corredor: 13, corEscada: '#c9a63a', vomitorios: { f: 0, cada: 2, larg: 5, fundo: 4, corParapeito: BRANCO },
  paredeAtras: true, corFachada: BRANCO, corLado: BRANCO, parapeito: 1.2 });

export default {
  id: 'estadio-frasqueirao', nome: 'Frasqueirão', clubes: ['abc'], norte: 168, vazado: 0.3, folga: 24,
  chao: { cor: '#b3a68a' },
  campo: { corMargem: '#5f9a50' },
  corMureta: BRANCO, corAlambrado: '#2f3033',
  aneis: [
    /* a grama em volta do campo */
    { dentro: { a: 54.5, b: 36, r: 0.5 }, fora: I, reto: true, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#5f9a50' }] },
    { dentro: I, fora: LAT(64), reto: true, h: [2.6, 12.6], fileiras: 23, corredorFrente: 1.6,
      trechos: [
        /* À DIREITA, atrás do gol: o quarto módulo */
        { de: A(60, -32) - 360, ate: A(60, 32), fora: FUN(84.5), h: [2.6, 13.4], fileiras: 26, ...DEGRAU },
        { de: A(60, 32), ate: A(57, 42), tipo: 'vazio' },
        /* EM CIMA, a lateral do escudo */
        { de: A(57, 42), ate: A(-57, 42), ...DEGRAU, pinta: ESCUDO, vomitorios: { em: [0.37, 0.69], f: 0, larg: 6, fundo: 4.4, corParapeito: BRANCO } },
        { de: A(-57, 42), ate: A(-60, 33), tipo: 'vazio' },
        /* À ESQUERDA, atrás do outro gol */
        { de: A(-60, 33), ate: A(-60, -33), fora: FUN(84), h: [2.6, 13.2], fileiras: 25, ...DEGRAU },
        { de: A(-60, -33), ate: A(-57, -42), tipo: 'vazio' },
        /* EMBAIXO, a PRINCIPAL: as cadeiras brancas de ponta a ponta (as pretas na ponta da esquerda); o meio fica debaixo do
           telhado, que sai do alto do prédio dos camarotes, atrás dela */
        { de: A(-57, -42), ate: A(-33, -42), fora: LAT(57), h: [2.6, 9.8], fileiras: 17, ...CADEIRAS('#34302e', '#2b2624') },
        { de: A(-33, -42), ate: A(33, -42), fora: LAT(57), h: [2.6, 9.8], fileiras: 17, ...CADEIRAS('#e9e9e6', '#d6d6d2'),
          cobertura: { h: 23.4, larg: 12.5, avanco: 9, cai: -2.2, cor: '#eeeeea', cor2: '#e4e4e0', listras: true, corBaixo: '#d2d2ce', trelica: false, pilares: false, pelaColuna: true } },
        { de: A(33, -42), ate: A(57, -42), fora: LAT(57), h: [2.6, 9.8], fileiras: 17, ...CADEIRAS('#e9e9e6', '#d6d6d2') },
        { de: A(57, -42), ate: A(60, -32), tipo: 'vazio' }
      ] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[-64, 52, 40], [66, 52, 40], [-64, -54, 40], [66, -54, 40]],
  blocos: [
    /* o prédio dos camarotes e das cabines, atrás do meio da principal: três andares de galeria por cima do alto das cadeiras, e
       os pilares que seguram o telhado */
    { u: 0, v: -61.6, w: 66, d: 9, h: 22.6, cor: '#b9b6ad' },
    ...[11.2, 15, 18.8].map(y => ({ u: 0, v: -57, w: 64.6, d: 0.2, h: 2.4, y, cor: '#3a3b3e' })),
    ...[9.9, 13.7, 17.5, 21.3].map(y => ({ u: 0, v: -56.8, w: 66.4, d: 0.6, h: 1.3, y, cor: '#cfccc2' })),
    ...Array.from({ length: 8 }, (_, i) => ({ u: -31.5 + 9 * i, v: -56.6, w: 0.8, d: 0.8, h: 24.6, cor: '#e4e4e0' })),
    /* o muro branco das placas no alto da lateral do escudo */
    ...[['#1d3c8f', -38], ['#e9e9e4', -14], ['#b3262b', 20]].map(([cor, u]) => ({ u, v: 64.3, w: 12, d: 0.25, h: 2, y: 15, cor })),
    /* o placar, no canto de cima à direita */
    { u: 66, v: 47, w: 1.2, d: 12, h: 4.6, y: 8, cor: '#17181c', giro: 40 }, { u: 66, v: 47, w: 0.7, d: 0.7, h: 8, cor: '#8d9093' },
    /* os bancos de reserva, ao pé da principal */
    ...[-24, -6, 12, 30].map(u => ({ u, v: -39.6, w: 9, d: 2.2, h: 2, cor: '#3a3b3e' }))
  ],
  /* a câmera das fotos de 2019: do alto da principal, olhando a lateral do escudo e o fundo da direita */
  vista: [24, 11.5, -53, 6, 4, 46],
  entorno: [
    { tipo: 'rua', de: [-170, -100], ate: [170, -100], larg: 16 }, { tipo: 'arvores', u: 0, v: -80, w: 110, d: 8, n: 9 },
    { tipo: 'quadra', u: 118, v: 60, w: 50, d: 80, cor: '#5f9a50' }, { tipo: 'predio', u: 30, v: 100, w: 46, d: 16, h: 6, cor: '#c8683f' },
    { tipo: 'predio', u: 110, v: -10, w: 14, d: 40, h: 7, cor: '#55585c' }, { tipo: 'predio', u: 130, v: 130, w: 22, d: 22, h: 60, cor: '#c9b9a6' },
    { tipo: 'predio', u: 160, v: 100, w: 22, d: 22, h: 60, cor: '#c9b9a6' }, { tipo: 'estacionamento', u: -110, v: 20, w: 40, d: 90 }
  ],
  jogo: { mandante1: [75, 105], mandante2: [164, 196], mandante3: [226, 242], visitante: [-18, 18], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { garra_alvinegra: 'mandante1', ultras_do_abc: 'mandante2' } }
};
