/* CORNÉLIO DE BARROS (Estádio Municipal Cornélio de Barros Muniz e Sá, Salgueiro
   e Ypiranga/PE, Salgueiro) — pelas três fotos aéreas que o dono mandou
   (17/11/2026: "vamos pro Cornélio de Barros"; uma de dia, vazio, e duas de
   noite, uma delas com o estádio cheio) e pelo satélite (o do Google). O rumo do
   campo, 147,5 graus, e o meio do campo saíram do satélite: o contorno do
   OpenStreetMap pega o terreno inteiro e fica 9 m fora do meio do gramado.
   No quadro a arquibancada grande fica EM CIMA e a de trás do gol à DIREITA.
   Arquibancadas em L, de degrau pintado de azul-claro com as escadas creme:
   · EM CIMA, a LATERAL, de 114 m por 20 de fundura, com a caixa branca da boca
     no meio;
   · À DIREITA, atrás do gol, a outra, de 85 m por 15, de degrau claro, em cima
     da galeria de pilares de tijolo que dá pra rua; as duas não se tocam no
     canto;
   · EMBAIXO, a outra lateral: a arquibancada BAIXA, de seis degraus de cimento,
     dos dois lados da TORRE das cabines (três andares, branca de faixas azuis,
     de telhadinho), o muro branco por trás e os dois bancos de reserva de
     cobertura azul na frente;
   · À ESQUERDA, atrás do outro gol, só o muro baixo azul-claro e branco, com a
     praça por trás.
   ESTIMADO: as alturas; a cor do degrau da de trás do gol (no satélite é cinza
   claro; de noite parece branca); a galeria de tijolo, que na foto de dia
   aparece de lado; as torres de luz. Na foto do estádio cheio há mais um lance
   pequeno no canto da de trás do gol com o lado da torre: não entrou.
   AS TORCIDAS (escolha minha): a da casa no meio da lateral grande, com o apoio
   na mesma lateral e na arquibancada baixa do lado da torre (pra os três
   portões não ficarem colados no mesmo lado); a visitante atrás do gol. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AZUL = '#a9b9cf', AZUL2 = '#9cadc4', CLARO = '#cdd2d8', CLARO2 = '#c0c6cd', CREME = '#e6dca6', BRANCO = '#eeeeea', CELESTE = '#8fb4dc', TIJOLO = '#b0705a';
/* a beira de dentro (o fim da grama) e os fundos */
const I = { a: 56.5, b: 41.5, r: 0.5 };
const LAT = b => ({ a: 56.5, b, r: 0.5 }), FUN = a => ({ a, b: 41.5, r: 0.5 });
const DEGRAU = { padrao: 'mosaico', mistura: 0.25, semCadeiras: true, espelhoPintado: true, corEscada: CREME, vomitorios: false, paredeAtras: true, corFachada: BRANCO, corLado: BRANCO, parapeito: 1.4 };
const MURO = (pts, h, c) => pts.slice(1).map((b, i) => { const a = pts[i], du = b[0] - a[0], dv = b[1] - a[1];
  return { u: (a[0] + b[0]) / 2, v: (a[1] + b[1]) / 2, w: Math.hypot(du, dv) + 0.4, d: 0.4, h, cor: c, giro: Math.atan2(dv, du) / RAD }; });

export default {
  id: 'estadio-cornelio-de-barros', nome: 'Cornélio de Barros', clubes: ['salgueiro', 'ypiranga-pe'], norte: 147.5, vazado: 0.3, folga: 22,
  chao: { cor: '#9a968c' },
  campo: { corMargem: '#6f9a55' },
  corMureta: BRANCO, corAlambrado: '#d9dcdf',
  aneis: [
    /* a grama em volta do campo */
    { dentro: { a: 54, b: 35.5, r: 0.5 }, fora: I, reto: true, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#6f9a55' }] },
    { dentro: I, fora: LAT(62), reto: true, h: [1.6, 11.4], fileiras: 23, corredorFrente: 1.6,
      trechos: [
        /* À DIREITA, atrás do gol: degrau claro, em cima da galeria de tijolo */
        { de: A(56.5, -40) - 360, ate: A(56.5, 40), fora: FUN(72), h: [1.6, 9.4], fileiras: 17, ...DEGRAU, cor: CLARO, cor2: CLARO2, corredor: 17, corFachada: TIJOLO },
        { de: A(56.5, 40), ate: A(56, 41.5), tipo: 'vazio' },
        /* EM CIMA, a LATERAL: azul-claro, escadas creme, a caixa branca da boca no meio */
        { de: A(56, 41.5), ate: A(-56.5, 41.5), ...DEGRAU, cor: AZUL, cor2: AZUL2, corredor: 19, vomitorios: { em: [0.5], f: 0.12, larg: 4.4, fundo: 4, cor: '#3a4a60', corParapeito: BRANCO } },
        { de: A(-56.5, 41.5), ate: A(-56, -41.5), tipo: 'vazio' },
        /* EMBAIXO, a lateral da torre: a arquibancada baixa, de seis degraus de cimento, dos dois lados do prédio das cabines
           (dono, 17/11/2026, com mais uma foto: "A outra lateral também tem uma arquibancada") */
        { de: A(-56, -41.5), ate: A(-6.6, -41.5), fora: LAT(47), h: [0.8, 3.2], fileiras: 6, ...DEGRAU, cor: '#aaa9a3', cor2: '#9e9d97', corredor: 0, corEscada: BRANCO, parapeito: 1 },
        { de: A(-6.6, -41.5), ate: A(0.6, -41.5), tipo: 'vazio' },
        { de: A(0.6, -41.5), ate: A(56, -41.5), fora: LAT(47), h: [0.8, 3.2], fileiras: 6, ...DEGRAU, cor: '#aaa9a3', cor2: '#9e9d97', corredor: 0, corEscada: BRANCO, parapeito: 1 },
        { de: A(56, -41.5), ate: A(56.5, -40), tipo: 'vazio' }
      ] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[-30, 66, 26], [28, 66, 26], [-28, -49, 24], [22, -49, 24]],
  blocos: [
    /* EMBAIXO: o muro branco de barra azul, a torre das cabines e os bancos de reserva */
    ...MURO([[-59.5, -47.6], [57, -47.6]], 4.4, BRANCO), ...MURO([[-59.5, -47.85], [57, -47.85]], 1.1, CELESTE),
    { u: -3, v: -44.6, w: 6.2, d: 6.2, h: 11, cor: BRANCO },
    { u: -3, v: -41.45, w: 5.4, d: 0.2, h: 1.3, y: 4.2, cor: '#27303c' }, { u: -3, v: -41.45, w: 5.4, d: 0.2, h: 1.3, y: 7.8, cor: '#27303c' },
    { u: -6.15, v: -44.6, w: 0.2, d: 6.2, h: 11, cor: CELESTE }, { u: 0.15, v: -44.6, w: 0.2, d: 6.2, h: 11, cor: CELESTE },
    { u: -3, v: -44.6, w: 7.6, d: 7.6, h: 0.5, y: 11, cor: '#d9d9d4' },
    { u: -21, v: -40, w: 11, d: 2.2, h: 2.1, cor: '#3f7fd0' }, { u: 8, v: -40, w: 13, d: 2.2, h: 2.1, cor: '#3f7fd0' },
    /* À ESQUERDA: o muro baixo azul-claro e branco, com a praça por trás */
    ...MURO([[-59.5, -47.6], [-59.5, 41.5]], 3, BRANCO), ...MURO([[-59.2, -47.4], [-59.2, 41.5]], 1.4, CELESTE),
    /* a galeria de pilares de tijolo, por baixo da de trás do gol, do lado da rua */
    { u: 72.2, v: 0, w: 0.3, d: 80, h: 2.6, y: 2.6, cor: '#5a4038' },
    ...Array.from({ length: 15 }, (_, i) => ({ u: 72.4, v: -39 + 78 / 14 * i, w: 0.7, d: 0.7, h: 9.6, cor: TIJOLO }))
  ],
  /* a câmera da aérea de dia do dono: do alto, do lado da torre, olhando a lateral */
  vista: [-46, 58, -108, 6, 0, 8],
  entorno: [
    { tipo: 'rua', de: [-170, 84], ate: [170, 84], larg: 10 }, { tipo: 'rua', de: [-76, -170], ate: [-76, 170], larg: 10 },
    { tipo: 'rua', de: [-170, -62], ate: [170, -62], larg: 9 }, { tipo: 'arvores', u: -92, v: -10, w: 14, d: 50, n: 7 },
    { tipo: 'casas', u: 0, v: 74, nu: 9, nv: 1, passo: 14 }, { tipo: 'casas', u: 0, v: -78, nu: 10, nv: 1, passo: 14 },
    { tipo: 'arvores', u: 92, v: 0, w: 20, d: 70, n: 16 }, { tipo: 'casas', u: 100, v: -50, nu: 2, nv: 2, passo: 15 }
  ],
  jogo: { mandante1: [70, 96], mandante2: [224, 254], mandante3: [112, 136], visitante: [-20, 20], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { jovem_do_salgueiro: 'mandante1', furia_jovem_ypiranga: 'mandante1' } }
};
