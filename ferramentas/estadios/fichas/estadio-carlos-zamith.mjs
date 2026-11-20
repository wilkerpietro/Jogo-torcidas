/* CARLOS ZAMITH (Estádio Municipal Carlos Zamith, Manaus; Amazonas e Manaus,
   que saíram da Arena da Amazônia por decisão do dono) — pelas quatro fotos
   que o dono mandou (16/11/2026: "inicie pelo estádio carlos zamith"; três da
   obra de 2014, ainda de acabamento laranja, e uma de drone recente, já de azul
   e branco) e pelo satélite. O rumo do campo, 159 graus, saiu do contorno do
   gramado no OpenStreetMap; o meio do campo fica 1,4 m fora do meio do contorno.
   No quadro o SUDESTE (o prédio da entrada, com o letreiro e o estacionamento)
   fica à direita e o NORDESTE (a arquibancada do lado da rua) em cima.
   Duas arquibancadas iguais, uma de frente pra outra, de 107 m por 14 de
   fundura, de degrau de concreto sem cadeira, em cima de um embasamento branco
   de 2,8 m (os vestiários e as salas ficam embaixo), com o corredor e a grade
   na frente e o muro azul no alto:
   · EM CIMA (o lado da rua), a de escadas azuis;
   · EMBAIXO, a de corrimãos amarelos, com a cabine no alto, no meio;
   · À DIREITA, atrás do gol, o prédio baixo e comprido da entrada, branco de
     barra azul, com o bloco azul-escuro do letreiro ESTÁDIO CARLOS ZAMITH;
   · À ESQUERDA, atrás do outro gol, nada: o muro e, depois dele, a caixa-d'água
     branca.
   ESTIMADO: a cor do degrau (cinza-azulado nas duas; na foto de drone uma está
   na sombra e a outra no sol), as alturas, as duas bocas de cada arquibancada
   (as manchas escuras do satélite), o muro de trás do gol da esquerda e a
   posição da caixa-d'água.
   AS TORCIDAS (escolha minha): a da casa na arquibancada da cabine, a visitante
   inteira na do lado da rua — uma arquibancada pra cada lado, como nos clássicos. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const BRANCO = '#e9ebe8', AZUL = '#2f66b0', AZUL_ESC = '#1d3f7a', AZUL_CLARO = '#4f93d4', AMARELO = '#e0c12e';
/* a beira de dentro (o fim da grama) e o fundo das duas arquibancadas */
const I = { a: 58.2, b: 40, r: 0.5 };
const LAT = b => ({ a: 58.2, b, r: 0.5 }), FUN = a => ({ a, b: 40, r: 0.5 });
const PONTA = 53.5, FUNDO = 54;
const DEGRAU = { cor: '#aebcd2', cor2: '#a2b1c8', padrao: 'mosaico', mistura: 0.25, semCadeiras: true, espelhoPintado: true,
  vomitorios: { em: [0.32, 0.68], f: 0, larg: 4.2, fundo: 3.6 }, parapeito: 1.3, corFachada: AZUL, corLado: AZUL };
const MURO = (pts, h = 2.4, cor = BRANCO) => pts.slice(1).map((b, i) => { const a = pts[i], du = b[0] - a[0], dv = b[1] - a[1];
  return { u: (a[0] + b[0]) / 2, v: (a[1] + b[1]) / 2, w: Math.hypot(du, dv) + 0.4, d: 0.4, h, cor, giro: Math.atan2(dv, du) / RAD }; });
/* o prédio da entrada: de v = -49 a v = +16, entre u = 62,4 e u = 71,4 */
const PR0 = 62.4, PR1 = 71.4, PV0 = -49, PV1 = 16;

export default {
  id: 'estadio-carlos-zamith', nome: 'Carlos Zamith', clubes: ['amazonas', 'manaus'], norte: 159, vazado: 0.3, folga: 26,
  chao: { cor: '#8c8a84' },
  campo: { corMargem: '#4f9a55' },
  corMureta: BRANCO, corAlambrado: '#c9ccd0',
  aneis: [
    /* a margem de grama em volta do gramado: liga as duas arquibancadas e a frente do prédio */
    { dentro: { a: 55.5, b: 37, r: 0.5 }, fora: I, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    { dentro: I, fora: LAT(FUNDO), reto: true, h: [2.8, 9.6], fileiras: 13, corredorFrente: 2.2,
      trechos: [
        /* À DIREITA, a calçada entre o gramado e o prédio da entrada */
        { de: A(58.2, -38) - 360, ate: A(58.2, 38), tipo: 'passagem', fora: FUN(PR0), cor: '#c4c2ba' },
        { de: A(58.2, 38), ate: A(PONTA, 40), tipo: 'vazio' },
        /* EM CIMA, a do lado da rua: as escadas azuis */
        { de: A(PONTA, 40), ate: A(-PONTA, 40), ...DEGRAU, corEscada: AZUL, corredor: 13.4 },
        { de: A(-PONTA, 40), ate: A(-PONTA, -40), tipo: 'vazio' },
        /* EMBAIXO, a da cabine: os corrimãos amarelos */
        { de: A(-PONTA, -40), ate: A(PONTA, -40), ...DEGRAU, corEscada: AMARELO, corredor: 18 },
        { de: A(PONTA, -40), ate: A(58.2, -38), tipo: 'vazio' }
      ] }
  ],
  fachada: { cor: AZUL },
  refletores: [[-38, 58.5, 30], [0, 58.5, 30], [38, 58.5, 30], [-38, -58.5, 30], [0, -58.5, 30], [38, -58.5, 30]],
  blocos: [
    /* a cabine no alto da arquibancada de baixo, no meio */
    { u: 0, v: -FUNDO + 1.2, w: 18, d: 3.4, h: 3, y: 9.6, cor: BRANCO }, { u: 0, v: -FUNDO + 2.95, w: 16, d: 0.2, h: 1.2, y: 10.6, cor: '#2a3340' },
    /* o prédio da entrada: branco de barra azul-escura, o terraço em cima e o bloco do letreiro na ponta */
    { u: (PR0 + PR1) / 2, v: (PV0 + PV1) / 2, w: PR1 - PR0, d: PV1 - PV0, h: 5, cor: BRANCO },
    { u: PR1 + 0.1, v: (PV0 + PV1) / 2, w: 0.25, d: PV1 - PV0, h: 2.1, cor: AZUL_ESC },
    { u: (PR0 + PR1) / 2, v: (PV0 + PV1) / 2, w: PR1 - PR0 + 0.6, d: PV1 - PV0 + 0.6, h: 0.35, y: 5, cor: '#d5d7d3' },
    { u: PR1 - 2.6, v: PV1 - 4.75, w: 5.6, d: 9.5, h: 9.6, cor: AZUL_ESC },
    { u: PR1 + 0.35, v: PV1 - 4.75, w: 0.3, d: 8.6, h: 2.6, y: 6.2, cor: AZUL_ESC, texto: 'ESTÁDIO CARLOS ZAMITH', corTexto: '#f3f4f1', textoFace: true, giro: 0, textoLargura: 0.92, textoAltura: 0.42 },
    /* os bancos de reserva, ao pé da arquibancada da cabine */
    { u: -13, v: -38.4, w: 8, d: 2.2, h: 2.1, cor: '#2f8a57' }, { u: 13, v: -38.4, w: 8, d: 2.2, h: 2.1, cor: '#2f8a57' },
    /* o MURO DO TERRENO: os dois fechos do lado do prédio e o de trás do gol da esquerda */
    ...MURO([[PR1, PV1], [PR1, FUNDO + 0.2], [PONTA + 0.5, FUNDO + 0.2]]),
    ...MURO([[PR1, PV0], [PR1, -FUNDO - 0.2], [PONTA + 0.5, -FUNDO - 0.2]]),
    ...MURO([[-PONTA - 0.5, FUNDO + 0.2], [-64, FUNDO + 0.2], [-64, -FUNDO - 0.2], [-PONTA - 0.5, -FUNDO - 0.2]]),
    /* a caixa-d'água branca, atrás do gol da esquerda */
    { u: -69.5, v: -6, w: 3.6, d: 3.6, h: 26, cor: '#eef0ee' }
  ],
  /* a câmera da foto de drone do dono: do alto, por cima do estacionamento, olhando o campo ao comprido */
  vista: [128, 52, -8, 0, 0, 0],
  entorno: [
    { tipo: 'estacionamento', u: 92, v: -20, w: 34, d: 70 },
    { tipo: 'rua', de: [-150, 96], ate: [150, 58], larg: 12 }, { tipo: 'rua', de: [116, -160], ate: [116, 160], larg: 10 },
    { tipo: 'estacionamento', u: 0, v: -72, w: 90, d: 26 },
    { tipo: 'predio', u: -110, v: -80, w: 70, d: 50, h: 9, cor: '#b9bbb7' }, { tipo: 'predio', u: -40, v: -118, w: 60, d: 40, h: 9, cor: '#c2c4c0' },
    { tipo: 'arvores', u: -92, v: 20, w: 30, d: 70, n: 16 }, { tipo: 'casas', u: 30, v: 100, nu: 10, nv: 1, passo: 15 },
    { tipo: 'grama', u: -84, v: -10, w: 30, d: 110 }
  ],
  jogo: { mandante1: [254, 286], mandante2: [294, 318], mandante3: [222, 246], visitante: [60, 120], tunelMandante: 350, tunelVisitante: 10, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { raca_amazonas: 'mandante1', gavirmaos: 'mandante1' } }
};
