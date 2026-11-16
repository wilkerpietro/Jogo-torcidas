/* ARENA FONTE NOVA (Bahia, Salvador) — pelas nove fotos que o dono mandou
   (16/11/2026: "vamos pra fonte nova", cinco de dentro, e depois "mais detalhes
   sobre a cobertura pra fazer de forma mais detalhada", duas aéreas, uma do
   Dique e uma de dentro olhando a lona) e pelo satélite. O rumo do campo, 178,8
   graus, saiu do contorno do gramado no OpenStreetMap.
   No quadro o SUL (o lado aberto, virado pro Dique do Tororó) fica à DIREITA,
   o NORTE à esquerda, o LESTE em cima e o OESTE embaixo.
   Arquibancada em FERRADURA, de três níveis de cadeiras, aberta no fundo sul:
   · embaixo, o anel de cadeiras azul claro (verde-água), na ferradura inteira;
   · no meio, o nível estreito, o ÚNICO de outro tom: azul mais fechado, atrás
     da testeira cinza;
   · em cima, o mesmo azul claro de baixo, atrás da faixa cor de vinho dos
     anúncios, na ferradura inteira.
   · no fundo sul, a laje sobre pilares altos onde a ferradura abre, e a viga do
     letreiro ARENA FONTE NOVA; nas duas pontas da ferradura, os painéis
     vermelhos de fora.
   A COBERTURA dá a volta inteira, também por cima do lado aberto:
   · por fora, o anel chato de concreto claro, de uns 9 m, em cima dos pilares
     brancos da fachada;
   · a LONA branca em três fileiras de almofadas abauladas entre os cabos
     radiais (quarenta vãos), com a beira de dentro recortada;
   · os mastros finos em cima, com os tirantes, e por baixo, perto da boca, a
     passarela preta da luz; o telão grande pendurado no norte e o pequeno no sul.
   Por fora, as galerias abertas de lajes brancas (as lâminas horizontais).
   ESTIMADO: as alturas (a cobertura a uns 39 m), a fundura de cada nível (os
   três somam 45 m; a cobertura esconde a arquibancada no satélite), o número
   de vãos (quarenta) e de fileiras de almofadas (três), onde acaba cada nível
   na boca da ferradura. O satélite é oblíquo:
   a cobertura sai 12 m deslocada, e ficou centrada no campo.
   O MURO DO TERRENO e a esplanada do sul (as tendas, a escadaria, o
   edifício-garagem) não entraram: a Fonte Nova é dos diferenciados, que levam
   os arredores de verdade.
   AS TORCIDAS (escolha minha, sem mapa de setores): a Bamor atrás do gol do
   norte, a Terror Tricolor ao lado dela; a visitante no canto do sudeste,
   embaixo, onde está a torcida de fora na foto de jogo do dono. */
/* o azul claro (verde-água) dos níveis de baixo e de cima, e o azul mais fechado do anel do meio, o único de tom diferente
   (dono, 16/11/2026: "só o anel central da arena fonte nova tem arquibancada com tom diferente do azul claro predominante") */
const AGUA = '#36c0bf', AGUA2 = '#2fb3c6', MEIO = '#2b84b0', MEIO2 = '#2677a3';
const CONC = '#dfe0dc', VINHO = '#7a2433';
/* a beira de dentro e os fundos dos três níveis (o contorno abre `d` metros pra fora) */
const C = d => ({ a: 61 + d, b: 42 + d, r: 26 + d });
/* a cobertura: a boca e a beira de fora (elipses medidas no satélite) e o pé das galerias da fachada */
const BOCA = { a: 67, b: 46, forma: 'elipse' }, BEIRA = { a: 132.5, b: 105, forma: 'elipse' }, GALERIA = { a: 127, b: 99.5, forma: 'elipse' };
/* onde a ferradura abre: o nível de baixo vai mais perto do meio do fundo sul que os de cima */
const AB1 = 24, AB2 = 30;
/* (`pisoPintado`: de longe cada nível é uma mancha de cor só, como nas fotos; com o piso de concreto a cadeira saía apagada) */
const CADEIRA = (cor, cor2, mais) => ({ cor, cor2, padrao: 'mosaico', mistura: 0.35, corredor: 12, pisoPintado: true, ...mais });

export default {
  id: 'estadio-arena-fonte-nova', nome: 'Arena Fonte Nova', clubes: ['bahia'], norte: 178.8, vazado: 0.3, folga: 36,
  chao: { cor: '#9a988f' },
  campo: { corMargem: '#4f9a55' },
  corMureta: '#cfd1d2', alambrado: false, muro: false,
  aneis: [
    /* EMBAIXO: o anel verde-água; na boca da ferradura, o piso de concreto atrás do gol */
    { dentro: C(0), fora: C(19), h: [1.6, 9.2], fileiras: 22,
      trechos: [
        { de: -AB1, ate: AB1, tipo: 'passagem', cor: '#b9b6ac' },
        { de: AB1, ate: 360 - AB1, ...CADEIRA(AGUA, AGUA2, { vomitorios: { f: 0.5, cada: 2 } }) }] },
    /* NO MEIO: o nível estreito, o único de outro tom: azul mais fechado */
    { dentro: C(19), fora: C(28), h: [11.6, 16.2], fileiras: 10, corredorFrente: 1.2, corMureta: '#c9ccd0',
      trechos: [
        { de: -AB2, ate: AB2, tipo: 'vazio' },
        { de: AB2, ate: 360 - AB2, ...CADEIRA(MEIO, MEIO2, { vomitorios: { f: 0, cada: 1 } }) }] },
    /* EM CIMA: o mesmo azul claro de baixo, atrás da faixa cor de vinho, na ferradura inteira (o trecho sem cadeira que eu
       tinha posto no noroeste saiu — dono, 16/11/2026: "coloque as cadeiras azuis no noroeste do nível de cima") */
    { dentro: C(28), fora: C(45), h: [20, 31.5], fileiras: 19, corredorFrente: 1.4, corMureta: VINHO,
      trechos: [
        { de: -AB2, ate: AB2, tipo: 'vazio' },
        { de: AB2, ate: 360 - AB2, ...CADEIRA(AGUA, AGUA2, { vomitorios: { f: 0.06, cada: 2 } }) }] }
  ],
  /* a fachada: as galerias abertas, de lajes brancas, só na ferradura */
  fachada: { cor: CONC, galerias: { de: AB2, ate: 360 - AB2, dentro: C(45), fora: GALERIA, pisos: [7, 13, 19, 25], bordas: [31], topo: 31, esp: 0.6, guarda: 1.3,
    cor: '#f0f0ec', corPiso: '#cfcfc9', corFundo: '#4c4f52', pilares: { n: 44, recuo: 2.2, larg: 1.3, h: 36, cor: '#e9e9e4' } } },
  coberturasAnel: [
    { fora: BEIRA, dentro: BOCA, h: 39, cai: 2.5, n: 40, cor: '#f5f4ee', cor2: '#eeece4', bojo: 2.8, almofadas: 3, recorte: 2.4, corNervura: '#d4d2ca', larguraNervura: 0.1,
      bordaFora: { larg: 9, cor: '#e9e8e2' }, beiral: [2.6, 0.4], corBeiral: '#e4e3dd',
      aneis: [{ f: 0.1, larg: 2.4, cor: '#2b2e34', dh: -3.4 }],
      pilares: { f: 0.965, base: 0, cor: '#efefec', esp: 0.75, cada: 1, viga: true, espViga: 0.16, corViga: '#cfcfca' },
      mastros: { f: 0.8, h: 11, abre: 0.3, cor: '#f3f4f4', esp: 0.22, cada: 1 } }
  ],
  blocos: [
    /* a laje sobre pilares na boca da ferradura, atrás do gol do sul */
    { u: 99, v: 0, w: 22, d: 74, h: 1, y: 10.6, cor: '#c9c9c3' }, { u: 88.2, v: 0, w: 0.3, d: 74, h: 1.1, y: 11.6, cor: '#e4e4df' },
    ...[-30, -18, -6, 6, 18, 30].flatMap(v => [92, 106].map(u => ({ u, v, w: 1.1, d: 1.1, h: 10.6, cor: '#b9b9b3' }))),
    /* a viga do letreiro, entre os pilares altos do lado aberto */
    { u: 124, v: 0, w: 1, d: 46, h: 2.2, y: 15, cor: '#ecece8', texto: 'ARENA FONTE NOVA', corTexto: '#c2272d', textoFace: true, giro: 0, textoLargura: 0.9, textoAltura: 0.6 },
    /* os dois painéis vermelhos nas pontas da ferradura, virados pro sul */
    { u: 108, v: 58, w: 0.6, d: 9, h: 22, y: 8, cor: '#b3262b', giro: -28 }, { u: 108, v: -58, w: 0.6, d: 9, h: 22, y: 8, cor: '#b3262b', giro: 28 },
    /* os telões pendurados: o grande no norte, o pequeno no sul */
    { u: -60, v: 0, w: 1.4, d: 17, h: 9, y: 23, cor: '#17181c', cobertura: true }, { u: -59.2, v: 0, w: 0.2, d: 15.6, h: 7.6, y: 23.7, cor: '#2b3550', cobertura: true },
    { u: 64, v: 0, w: 1, d: 9, h: 5, y: 26.5, cor: '#17181c', cobertura: true },
    /* os bancos de reserva, do lado oeste */
    { u: -15, v: -38.6, w: 15, d: 2.6, h: 2.3, cor: '#e9eaf0' }, { u: 15, v: -38.6, w: 15, d: 2.6, h: 2.3, cor: '#e9eaf0' }
  ],
  /* a câmera da primeira foto do dono: do alto do fundo norte, olhando o lado aberto */
  vista: [-98, 31, -44, 60, 0, 12],
  entorno: [
    { tipo: 'agua', u: 250, v: 20, w: 150, d: 260 },
    { tipo: 'arvores', u: 168, v: 40, w: 20, d: 160, n: 22 },
    { tipo: 'piso', pts: [[112, -70], [160, -70], [160, 70], [112, 70]], cor: '#c9c6bb', cor2: '#c1beb3', padrao: 'liso', y: 0.05 },
    { tipo: 'predio', u: 150, v: -6, w: 18, d: 60, h: 6, cor: '#d9d9d3' },
    { tipo: 'rua', de: [176, -200], ate: [176, 200], larg: 14 }, { tipo: 'rua', de: [-200, 122], ate: [200, 150], larg: 16 },
    { tipo: 'rua', de: [-200, -128], ate: [200, -128], larg: 12 }, { tipo: 'estacionamento', u: 40, v: -160, w: 150, d: 44 },
    { tipo: 'predio', u: -160, v: 60, w: 30, d: 30, h: 36, cor: '#d9d6cb' }, { tipo: 'predio', u: -168, v: 10, w: 26, d: 26, h: 30, cor: '#cfd3d6' },
    { tipo: 'predio', u: -160, v: -50, w: 34, d: 26, h: 24, cor: '#d6d0c2' }, { tipo: 'casas', u: -40, v: 172, nu: 14, nv: 2, passo: 16 }
  ],
  jogo: { mandante1: [160, 200], mandante2: [206, 232], mandante3: [128, 154], visitante: [28, 52], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { bamor: 'mandante1', terror_tricolor: 'mandante2' } }
};
