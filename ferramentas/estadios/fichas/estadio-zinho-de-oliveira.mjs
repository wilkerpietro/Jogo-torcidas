/* ZINHO DE OLIVEIRA (Estádio Municipal Zinho Oliveira, Águia de Marabá, Marabá)
   — pelas cinco fotos que o dono mandou (16/11/2026: "segue imagens do zinho de
   oliveira, vamos separar o águia de marabá") e pelo satélite (o do Google; o da
   Esri não tem Marabá). O rumo do campo, 70 graus, saiu do contorno do terreno
   no OpenStreetMap e das linhas do gramado.
   No quadro o NOROESTE (a rua, com a arquibancada coberta) fica em cima e o
   NORDESTE à direita. Estádio apertado no meio das casas da Velha Marabá, com a
   grama de 105 × 70 m e arquibancada de degrau verde nos quatro lados:
   · EM CIMA, a ARQUIBANCADA COBERTA: um prédio de 60 m, branco de pilastras
     amarelas e barra verde pra rua, com a faixa de cobogó verde e o letreiro
     ESTÁDIO MUNICIPAL ZINHO OLIVEIRA; o telhado cinza de uma água sobre a
     estrutura verde, os vestiários embaixo.
   · À ESQUERDA (sudoeste) e À DIREITA (nordeste), atrás dos gols, as de degrau
     verde de espelho branco, de uns nove degraus, com o muro branco atrás; atrás
     da da direita, o degrau velho de concreto, marrom, cercado de tela.
   · EMBAIXO (sudeste), colada nas casas, a lateral baixa: quatro degraus verdes
     com a barra azul na frente e o muro branco atrás.
   ESTIMADO (sem foto de perto de cada uma): as alturas, a inclinação do telhado
   (mais alto do lado do campo), o tamanho do gramado (100 × 66), as torres de
   luz e os anexos dos dois lados do prédio. O satélite é anterior à reforma.
   AS TORCIDAS (escolha minha, pela foto do jogo: as bandeiras estão atrás do
   gol do sudoeste): a Jovem Águia atrás do gol da esquerda; a visitante atrás
   do gol da direita. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const VERDE = '#1f8d4d', VERDE2 = '#1b8346', BRANCO = '#eceee9', AMARELO = '#f2cf1d', MARROM = '#8a6f5c', AZUL = '#2b63b8';
/* a beira de dentro (o fim da grama) e os fundos de cada lado */
const I = { a: 52.6, b: 35.2, r: 0.5 };
const LAT = b => ({ a: 52.6, b, r: 0.5 }), FUN = a => ({ a, b: 35.2, r: 0.5 });
const DEGRAU = { cor: VERDE, cor2: VERDE2, padrao: 'mosaico', mistura: 0.2, semCadeiras: true, corEspelho: BRANCO, corEscada: '#d9dcd6', vomitorios: false, paredeAtras: true, corFachada: BRANCO };
const MURO = (pts, h = 3.2, cor = BRANCO) => pts.slice(1).map((b, i) => { const a = pts[i], du = b[0] - a[0], dv = b[1] - a[1];
  return { u: (a[0] + b[0]) / 2, v: (a[1] + b[1]) / 2, w: Math.hypot(du, dv) + 0.4, d: 0.4, h, cor, giro: Math.atan2(dv, du) / RAD }; });
/* o prédio da coberta: de u = -29.5 a 30.8; a arquibancada vai até v = 43.7 e o prédio até a rua, em v = 49.7 */
const PU0 = -29.5, PU1 = 30.8, PUM = (PU0 + PU1) / 2, PLARG = PU1 - PU0, RUA = 49.7, ALT = 8.6;

export default {
  id: 'estadio-zinho-de-oliveira', nome: 'Zinho de Oliveira', clubes: ['aguia-de-maraba'], norte: 70, vazado: 0.3, folga: 22,
  chao: { cor: '#8a857b' },
  campo: { c: 100, l: 66, corMargem: '#4f9a55' },
  corMureta: BRANCO, corAlambrado: '#2f7d4c',
  aneis: [
    /* a margem de grama em volta do gramado, ao pé de tudo: liga as quatro arquibancadas */
    { dentro: { a: 51, b: 34, r: 0.5 }, fora: I, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    { dentro: I, fora: LAT(39.8), reto: true, h: [0.5, 2.2], fileiras: 4, corredorFrente: 1.2,
      trechos: [
        /* À DIREITA (nordeste), atrás do gol: o degrau verde e, atrás dele, o degrau velho de concreto */
        { de: A(52.6, -33) - 360, ate: A(52.6, 33), fora: FUN(66), h: [1.2, 6.8], fileiras: 13, ...DEGRAU, padrao: 'fracoes', fracoes: [[0.52, VERDE], [0.56, '#cfd2cc'], [1, MARROM]], corredor: 17 },
        { de: A(52.6, 33), ate: A(PU1, 35.2), tipo: 'vazio' },
        /* EM CIMA, a ARQUIBANCADA COBERTA */
        { de: A(PU1, 35.2), ate: A(PU0, 35.2), fora: LAT(43.7), h: [1.6, 6.2], fileiras: 9, ...DEGRAU, corredor: 12, escadaNaBorda: true, parapeito: 2.4,
          cobertura: { h: 8.9, larg: 9.6, avanco: 6.1, cai: -1.2, cor: '#b9b7af', cor2: '#aeaca4', listras: true, corTrelica: '#1f7a44', corPilar: '#1f7a44', pelaColuna: true, trelica: false } },
        { de: A(PU0, 35.2), ate: A(-52.6, 33), tipo: 'vazio' },
        /* À ESQUERDA (sudoeste), atrás do gol: o degrau verde, com o muro branco atrás */
        { de: A(-52.6, 33), ate: A(-52.6, -33), fora: FUN(62.8), h: [1.2, 5.4], fileiras: 9, ...DEGRAU, corredor: 17 },
        { de: A(-52.6, -33), ate: A(-50, -35.2), tipo: 'vazio' },
        /* EMBAIXO (sudeste), a lateral baixa colada nas casas: quatro degraus verdes, a barra azul na frente */
        { de: A(-50, -35.2), ate: A(50, -35.2), ...DEGRAU, passoFileira: 0.8, corredor: 20, corMureta: AZUL, parapeito: 2.6 },
        { de: A(50, -35.2), ate: A(52.6, -33), tipo: 'vazio' }
      ] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[-31.5, 34.2, 20], [32.8, 34.2, 20], [-24.4, -40.6, 20], [26, -40.6, 20]],
  blocos: [
    /* o prédio da coberta, do fundo da arquibancada até a rua: branco, com a barra verde embaixo, a faixa de cobogó verde,
       as pilastras amarelas e o letreiro */
    { u: PUM, v: (43.7 + RUA) / 2, w: PLARG, d: RUA - 43.7, h: ALT, cor: BRANCO },
    { u: PUM, v: RUA + 0.1, w: PLARG, d: 0.25, h: 1.7, cor: VERDE },
    { u: PUM, v: RUA + 0.1, w: PLARG, d: 0.25, h: 0.9, y: 4.6, cor: '#23884c' },
    ...Array.from({ length: 14 }, (_, i) => ({ u: PU0 + PLARG * i / 13, v: RUA + 0.2, w: 0.55, d: 0.45, h: ALT, cor: AMARELO })),
    { u: PUM - 2.3, v: RUA + 0.35, w: 0.3, d: 13.4, h: 1.6, y: 4.3, cor: '#1c7f45', texto: 'ESTÁDIO MUNICIPAL ZINHO OLIVEIRA', corTexto: '#f3f4f0', textoFace: true, giro: 90, textoLargura: 0.94, textoAltura: 0.5 },
    { u: PUM - 2.3, v: RUA + 0.5, w: 4.4, d: 0.9, h: 0.25, y: 2.7, cor: AMARELO },
    /* os anexos dos dois lados do prédio (a bilheteria de laje e o depósito) */
    { u: -43, v: 45.4, w: 22, d: 8, h: 3.4, cor: BRANCO }, { u: -43, v: 45.4, w: 22.6, d: 8.6, h: 0.3, y: 3.4, cor: '#c9c7be' },
    { u: 40, v: 46.2, w: 14, d: 6.4, h: 3.2, cor: BRANCO },
    /* o MURO DO TERRENO: branco, com a barra verde do lado da rua */
    ...MURO([[-62.8, RUA], [PU0, RUA]], 3.6), ...MURO([[PU1, RUA], [66, RUA]], 3.6),
    ...MURO([[-62.8, RUA + 0.25], [PU0, RUA + 0.25]], 1.2, VERDE), ...MURO([[PU1, RUA + 0.25], [66, RUA + 0.25]], 1.2, VERDE),
    ...MURO([[-62.8, RUA], [-62.8, -39.8], [66, -39.8], [66, RUA]], 3.4),
    /* a tela alta atrás do gol da direita, em volta do degrau velho */
    { u: 66.2, v: 0, w: 0.2, d: 66, h: 6, y: 3.4, cor: '#7d8f86' }
  ],
  /* a câmera da foto de drone do dono: do alto, do lado da rua, olhando o campo por cima da coberta */
  vista: [0, 46, 108, 0, 0, -8],
  entorno: [
    { tipo: 'rua', de: [-150, 56], ate: [150, 56], larg: 11 }, { tipo: 'rua', de: [-76, 160], ate: [-76, -160], larg: 8 },
    { tipo: 'rua', de: [-150, -86], ate: [150, -86], larg: 8 },
    { tipo: 'casas', u: 0, v: 74, nu: 12, nv: 2, passo: 14 }, { tipo: 'casas', u: 4, v: -61, nu: 11, nv: 3, passo: 13 },
    { tipo: 'casas', u: 92, v: 0, nu: 3, nv: 7, passo: 14 }, { tipo: 'casas', u: -100, v: 0, nu: 2, nv: 8, passo: 14 },
    { tipo: 'arvores', u: 78, v: -22, w: 16, d: 30, n: 7 }, { tipo: 'arvores', u: -70, v: -10, w: 8, d: 40, n: 5 }
  ],
  jogo: { mandante1: [160, 200], mandante2: [66, 114], mandante3: [245, 295], visitante: [-22, 22], tunelMandante: 84, tunelVisitante: 62, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { jovem_aguia: 'mandante1' } }
};
