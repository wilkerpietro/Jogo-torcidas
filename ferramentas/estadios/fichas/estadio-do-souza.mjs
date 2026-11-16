/* ESTÁDIO DO SOUZA (Francisco Vasques, Tuna Luso, Belém) — pelas duas fotos de
   drone que o dono mandou (16/11/2026: "só tem arquibancada em uma lateral e uma
   arquibancada maior atrás do gol") e pelo satélite (as medidas saíram dele; o
   contorno do gramado no OpenStreetMap deu o rumo, 131 graus).
   No quadro o SUDESTE (o tobogã) fica à direita e o NORDESTE (a lateral
   coberta, com a sede social e as piscinas atrás) em cima. A Av. Almirante
   Barroso passa à esquerda, depois do terreno de terra batida onde se estaciona.
   · À DIREITA, atrás do gol, o TOBOGÃ: 71 m de largura por 27 de fundura, de
     degrau pintado de verde com a faixa branca em trapézio no meio e a CRUZ DE
     MALTA vermelha; duas bocas escuras embaixo, a mureta branca com o letreiro
     na frente e o muro branco no alto.
   · EM CIMA, a LATERAL COBERTA: baixa (uns oito degraus verdes), de ponta a
     ponta, com o telhado branco de uma água e os pilares finos na frente.
   · À ESQUERDA e EMBAIXO não há arquibancada: o muro verde atrás do gol, e do
     outro lado os bancos de reserva, as placas e as quadras de grama sintética.
   ESTIMADO (sem foto de perto nem mapa de setores): a altura do tobogã (uns 13 m)
   e a da lateral, o tamanho do gramado (108 × 72 dentro de uma grama de 121 × 83),
   o texto do letreiro, as torres de luz e o muro do terreno do lado das quadras.
   AS TORCIDAS (escolha minha): a da Tuna na lateral coberta, que é o setor que
   abre em todo jogo; a visitante no tobogã, atrás do gol. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const VERDE = '#2a8a66', VERDE2 = '#25805e', BRANCO = '#e9ece7', BRANCO2 = '#dfe3dd', VERM = '#b3282d', VERM2 = '#a52328';
/* a beira de dentro (o fim da grama) e os fundos: a lateral e o tobogã, cada um com o mesmo trecho reto da beira de dentro */
const I = { a: 60.5, b: 41, r: 0.5 };
const LAT = b => ({ a: 60.5, b, r: 0.5 }), FUN = a => ({ a, b: 41, r: 0.5 });
/* o tobogã vai de v = -37.4 a v = +33.6 (três metros pro lado das quadras) e tem 27,5 m de fundura */
const TV0 = -37.4, TV1 = 33.6, TLARG = TV1 - TV0, TFUN = 27.5;
/* a pintura do tobogã: `x` da esquerda pra direita de quem olha do campo, `y` de baixo pra cima. A faixa branca é um
   trapézio (metade da largura embaixo, um quarto no alto); a cruz de malta, de braços que abrem, tem 12,4 m */
const RC = 6.2;
function tobogã(x, y, rnd) {
  const X = (x - 0.5) * TLARG, Y = (y - 0.5) * TFUN, ax = Math.abs(X), ay = Math.abs(Y), s = rnd() < 0.14;
  const braco = (ao, pe) => ao <= RC && ao >= 0.4 && pe <= 0.7 + ao * 0.46;
  if (braco(ax, ay) || braco(ay, ax) || (ax < 0.8 && ay < 0.8)) return s ? VERM2 : VERM;
  if (ax <= TLARG * (0.25 - 0.135 * y)) return s ? BRANCO2 : BRANCO;
  return s ? VERDE2 : VERDE;
}
const MURO = (pts, h = 2.6, cor = '#2f7d5c') => pts.slice(1).map((b, i) => { const a = pts[i], du = b[0] - a[0], dv = b[1] - a[1];
  return { u: (a[0] + b[0]) / 2, v: (a[1] + b[1]) / 2, w: Math.hypot(du, dv) + 0.4, d: 0.4, h, cor, giro: Math.atan2(dv, du) / RAD }; });

export default {
  id: 'estadio-do-souza', nome: 'Estádio do Souza', clubes: ['tuna-luso'], norte: 131, vazado: 0.3, folga: 26,
  chao: { cor: '#8a8478' },
  campo: { c: 108, l: 72, corMargem: '#4f9a55' },
  corMureta: BRANCO, corAlambrado: '#2f7d5c', muro: { cor: '#2f7d5c' },
  aneis: [
    /* a margem de grama em volta do gramado, ao pé de tudo: é por ela que se passa da lateral ao tobogã */
    { dentro: { a: 57, b: 38.5, r: 0.5 }, fora: I, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    { dentro: I, fora: LAT(49.5), reto: true, h: [0.9, 4.4], fileiras: 8,
      trechos: [
        /* À DIREITA, o TOBOGÃ */
        { de: A(60.5, TV0) - 360, ate: A(60.5, TV1), fora: FUN(60.5 + TFUN), h: [2, 13.5], fileiras: 28, cor: VERDE, cor2: VERDE2, padrao: 'mosaico', mistura: 0.14,
          pinta: tobogã, semCadeiras: true, espelhoPintado: true, corredor: 0, vomitorios: { em: [0.27, 0.73], f: 0.08, larg: 4.4, fundo: 3.6 }, parapeito: 1.9, corFachada: BRANCO, corLado: BRANCO2 },
        { de: A(60.5, TV1), ate: A(52, 41), tipo: 'vazio' },
        /* EM CIMA, a LATERAL COBERTA */
        { de: A(52, 41), ate: A(-58, 41), cor: VERDE, cor2: VERDE2, padrao: 'mosaico', mistura: 0.22, semCadeiras: true, espelhoPintado: true, corEscada: BRANCO, corredor: 15,
          vomitorios: false, paredeAtras: true, corFachada: BRANCO, parapeito: 1.6,
          cobertura: { h: 7.6, larg: 9.6, avanco: 4.6, cai: 1.1, cor: '#e8eae6', cor2: '#dcdfda', listras: true, corTrelica: '#b9bdb8', corPilar: '#d9dcd7', pelaColuna: true } },
        /* À ESQUERDA e EMBAIXO: nada (o muro e o alambrado saem do gerador) */
        { de: A(-58, 41), ate: A(60.5, TV0), tipo: 'vazio' }
      ] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[-40, 56.5, 22], [36, 56.5, 22], [-40, -49.5, 22], [36, -49.5, 22]],
  blocos: [
    /* o letreiro na mureta da frente do tobogã, virado pro campo */
    { u: 60.25, v: (TV0 + TV1) / 2, w: 0.3, d: 60, h: 1.3, y: 1.1, cor: BRANCO, texto: 'TUNA LUSO BRASILEIRA  ·  ESTÁDIO FRANCISCO VASQUES', corTexto: '#1f6f50', textoFace: true, giro: 180, textoLargura: 0.94, textoAltura: 0.55 },
    /* a parede branca do fundo da lateral (a sede social começa ali) e os pilares finos da frente do telhado */
    { u: -3, v: 52, w: 110, d: 4.4, h: 6.3, cor: '#e2e5df' },
    ...[-56, -41, -26, -11, 4, 19, 34, 50].map(u => ({ u, v: 41.4, w: 0.3, d: 0.3, h: 6.4, cor: '#dfe2dd' })),
    /* os bancos de reserva, do lado das quadras */
    { u: -13, v: -39.7, w: 8, d: 2.3, h: 2.1, cor: '#2c8f86' }, { u: 13, v: -39.7, w: 8, d: 2.3, h: 2.1, cor: '#2c8f86' },
    { u: 0, v: -40, w: 3, d: 1.8, h: 2, cor: BRANCO },
    /* o muro do terreno: o do lado das quadras (o corredor de terra atrás das placas) e o fecho no canto da lateral */
    ...MURO([[-61, -41.5], [-61, -47.5], [61.5, -47.5], [61.5, -38]]),
    ...MURO([[-61, 41.5], [-61, 54.2], [-58, 54.2]])
  ],
  /* a câmera da primeira foto do dono: do alto, por trás do gol da esquerda, olhando o tobogã */
  vista: [-98, 36, 4, 60, 3, 0],
  entorno: [
    { tipo: 'rua', de: [-138, -170], ate: [-138, 170], larg: 42 },
    { tipo: 'estacionamento', u: -88, v: 12, w: 44, d: 64 },
    { tipo: 'predio', u: -92, v: -56, w: 32, d: 48, h: 10, cor: '#8d8f8c' },
    { tipo: 'piscina', u: -10, v: 96, w: 56, d: 24 }, { tipo: 'piscina', u: -62, v: 90, w: 18, d: 14 },
    { tipo: 'predio', u: -28, v: 70, w: 9, d: 9, h: 4, cor: '#b5563a' }, { tipo: 'predio', u: 14, v: 70, w: 9, d: 9, h: 4, cor: '#b5563a' },
    { tipo: 'predio', u: 82, v: 84, w: 30, d: 22, h: 7, cor: '#b5563a' },
    { tipo: 'quadra', u: -36, v: -62, w: 44, d: 24, cor: '#2f6b45' }, { tipo: 'quadra', u: 14, v: -62, w: 50, d: 24, cor: '#3f8a4c' },
    { tipo: 'predio', u: -20, v: -90, w: 116, d: 20, h: 8, cor: '#a9aba6' },
    { tipo: 'quadra', u: 118, v: 44, w: 44, d: 72, cor: '#4f9a55' }, { tipo: 'grama', u: 122, v: -40, w: 56, d: 70 },
    { tipo: 'arvores', u: 20, v: 122, w: 120, d: 16, n: 14 }
  ],
  jogo: { mandante1: [76, 104], mandante2: [108, 140], mandante3: [43, 72], visitante: [-27, 25], tunelMandante: 90, tunelVisitante: 5, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { movimento_uniformizado_cruzmaltino: 'mandante1' } }
};
