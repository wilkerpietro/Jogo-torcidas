/* LACERDÃO (Estádio Luiz José de Lacerda, Central, Caruaru) — pelas quatro
   fotos que o dono mandou (17/11/2026: "vamos pro Lacerdão, do Central. Veja as
   4 fotos pra entender o formato do estádio"; duas aéreas e duas de dentro) e
   pelo satélite (o do Google). O rumo do campo, 66,3 graus, saiu do contorno do
   gramado no OpenStreetMap.
   No quadro a arquibancada principal, coberta, fica EMBAIXO; o prédio dos
   camarotes à DIREITA; a de trás do gol preta e branca à ESQUERDA.
   Estádio de quatro lados diferentes, colado nas casas:
   · EMBAIXO, a PRINCIPAL, de 116 m: junto da faixa de areia, a geral
     descoberta, de degrau claro; atrás e acima dela, a tribuna coberta, de
     cadeiras em blocos brancos e pretos, debaixo do telhado cinza de beira
     alaranjada, apoiado nos pilares da frente;
   · EM CIMA, a outra lateral, de degrau preto com as escadas brancas; a metade
     da direita debaixo de um telhado escuro;
   · À ESQUERDA, atrás do gol, a de degrau preto com as faixas brancas e o
     trapézio branco no meio, e o muro branco no alto;
   · À DIREITA, atrás do outro gol, não há arquibancada: o prédio branco e
     comprido dos camarotes, de dois andares, colado no campo.
   ESTIMADO: as alturas; QUANTO É GERAL E QUANTO É TRIBUNA na principal (o telhado
   esconde a divisa no satélite: pus 7,5 e 18 m); o desenho das faixas brancas da
   de trás do gol (as fotos mostram de longe); a pintura da lateral de cima
   (preta com escadas brancas; na aérea ela tem desenhos brancos que não dá pra
   ler); os blocos de cor das cadeiras da tribuna; as torres de luz.
   AS TORCIDAS (escolha minha): a Comando Alvinegro na geral, no meio; a
   visitante atrás do gol da esquerda. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const PRETO = '#26272a', PRETO2 = '#303135', BRANCO = '#ecece8', BRANCO2 = '#dcdcd7', CLARO = '#bdbcb6', CLARO2 = '#b0afa9';
/* a beira da grama (em cima, à esquerda e à direita), a beira da areia (embaixo) e os fundos */
const I = { a: 59.5, b: 41.5, r: 0.5 }, AREIA = { a: 59.5, b: 49.5, r: 0.5 };
const LAT = b => ({ a: 59.5, b, r: 0.5 }), FUN = a => ({ a, b: 41.5, r: 0.5 });
/* o degrau preto de escadas brancas */
const NEGRO = { cor: PRETO, cor2: PRETO2, padrao: 'mosaico', mistura: 0.2, semCadeiras: true, espelhoPintado: true, corEscada: BRANCO, corredor: 12, vomitorios: false,
  paredeAtras: true, corFachada: BRANCO, parapeito: 1.6 };
/* a pintura da de trás do gol: preta, com quatro faixas brancas e o trapézio branco no meio, mais largo no alto (`x` de uma
   ponta à outra, `y` de baixo pra cima) */
const TRAS_DO_GOL = (x, y, rnd) => { const s = rnd() < 0.1, d = Math.abs(x - 0.5);
  if (d < 0.07 + 0.07 * y || [0.14, 0.3].some(f => Math.abs(d - (0.5 - f)) < 0.022)) return s ? BRANCO2 : BRANCO; return s ? PRETO2 : PRETO; };
/* a tribuna coberta: o telhado cinza de beira alaranjada */
const TELHADO = { h: 19.6, larg: 19, avanco: 1, cai: 0.6, cor: '#77787a', cor2: '#6d6e70', listras: true, corFrente: '#a5673f', altFrente: 1.2, corBaixo: '#3f4144', trelica: false,
  corPilar: '#d9d9d4', pelaColuna: true };
const TRIBUNA = (u0, u1, cor, cor2) => ({ de: A(u0, -57), ate: A(u1, -57), cor, cor2, padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: true, corEscada: '#c9b98a',
  vomitorios: false, paredeAtras: true, corFachada: BRANCO, parapeito: 2, cobertura: TELHADO });

export default {
  id: 'estadio-lacerdao', nome: 'Lacerdão', clubes: ['central'], norte: 66.3, vazado: 0.3, folga: 22,
  chao: { cor: '#8d8a83' },
  campo: { corMargem: '#4f9a55' },
  corMureta: BRANCO, corAlambrado: '#3a3b3d',
  aneis: [
    /* a grama em volta do campo */
    { dentro: { a: 54.5, b: 36, r: 0.5 }, fora: I, reto: true, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    /* a faixa de areia entre o campo e a arquibancada principal */
    { dentro: I, fora: AREIA, reto: true, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [
        { de: 0, ate: A(-59.5, -41.5), tipo: 'vazio' },
        { de: A(-59.5, -41.5), ate: A(59.5, -41.5), tipo: 'passagem', cor: '#cdbf9e' },
        { de: A(59.5, -41.5), ate: 360, tipo: 'vazio' }] },
    /* a lateral de cima e a de trás do gol da esquerda */
    { dentro: I, fora: LAT(56), reto: true, h: [1.2, 7.4], fileiras: 15, corredorFrente: 1.4,
      trechos: [
        { de: 0, ate: A(55, 41.5), tipo: 'vazio' },
        /* EM CIMA: a metade da direita debaixo do telhado escuro, a da esquerda descoberta */
        { de: A(55, 41.5), ate: A(-20, 41.5), ...NEGRO, cobertura: { h: 12, larg: 13.5, avanco: 0.8, cai: 0.8, cor: '#3d3e41', cor2: '#343538', listras: true, corTrelica: '#5a5c60',
          corPilar: '#5a5c60', pelaColuna: true } },
        { de: A(-20, 41.5), ate: A(-55, 41.5), ...NEGRO },
        { de: A(-55, 41.5), ate: A(-59.5, 39), tipo: 'vazio' },
        /* À ESQUERDA, atrás do gol: preta, com as faixas e o trapézio brancos */
        { de: A(-59.5, 39), ate: A(-59.5, -39), fora: FUN(69.5), h: [1.2, 6], fileiras: 11, ...NEGRO, corredor: 0, pinta: TRAS_DO_GOL, parapeito: 2.6 },
        { de: A(-59.5, -39), ate: 360, tipo: 'vazio' }
      ] },
    /* a PRINCIPAL, embaixo: a geral descoberta, junto da areia */
    { dentro: AREIA, fora: LAT(57), reto: true, h: [1, 4.4], fileiras: 8, corredorFrente: 1.2,
      trechos: [
        { de: 0, ate: A(-58, -49.5), tipo: 'vazio' },
        { de: A(-58, -49.5), ate: A(58, -49.5), cor: CLARO, cor2: CLARO2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corEscada: BRANCO, corredor: 14, vomitorios: false },
        { de: A(58, -49.5), ate: 360, tipo: 'vazio' }] },
    /* e a tribuna coberta, atrás e acima dela: três blocos de cadeiras */
    { dentro: LAT(57), fora: LAT(75), reto: true, h: [6.4, 14.8], fileiras: 18, corredorFrente: 1.4, corMureta: BRANCO,
      trechos: [
        { de: 0, ate: A(-50, -57), tipo: 'vazio' },
        TRIBUNA(-50, -16, BRANCO, '#8f9093'), TRIBUNA(-16, 20, PRETO, PRETO2), TRIBUNA(20, 58, BRANCO, '#8f9093'),
        { de: A(58, -57), ate: 360, tipo: 'vazio' }] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[-62, -66, 30], [70, -52, 30], [-62, 52, 30], [60, 62, 30]],
  blocos: [
    /* os pilares da frente do telhado da tribuna */
    ...Array.from({ length: 10 }, (_, i) => ({ u: -50 + 12 * i, v: -57.6, w: 0.6, d: 0.6, h: 19, cor: '#d9d9d4' })),
    /* a faixa da torcida na mureta da tribuna */
    { u: 4, v: -56.9, w: 0.3, d: 60, h: 1.2, y: 5.1, cor: BRANCO, texto: 'DESDE 2000  ·  COM O CENTRAL ONDE ELE ESTIVER', corTexto: PRETO, textoFace: true, giro: 90, textoLargura: 0.94, textoAltura: 0.55 },
    /* os bancos de reserva, na areia */
    { u: -14, v: -47, w: 9, d: 2.2, h: 2.1, cor: BRANCO }, { u: 14, v: -47, w: 9, d: 2.2, h: 2.1, cor: BRANCO },
    /* À DIREITA, atrás do gol: o prédio branco dos camarotes, de dois andares, com a fila de vãos virada pro campo */
    { u: 70, v: 2, w: 16, d: 80, h: 7.4, cor: BRANCO },
    { u: 61.9, v: 2, w: 0.3, d: 78, h: 2.2, y: 1, cor: '#3a3d42' }, { u: 61.9, v: 2, w: 0.3, d: 78, h: 2.2, y: 4.4, cor: '#3a3d42' },
    ...Array.from({ length: 17 }, (_, i) => ({ u: 61.8, v: -37 + 78 / 16 * i, w: 0.5, d: 0.5, h: 7.4, cor: BRANCO })),
    { u: 70, v: 2, w: 17, d: 81, h: 0.3, y: 7.4, cor: '#b9b9b3' }
  ],
  /* a câmera das aéreas do dono: do alto, por cima do prédio dos camarotes, com a principal à esquerda */
  vista: [124, 50, 14, 0, 0, -6],
  entorno: [
    { tipo: 'rua', de: [92, -170], ate: [92, 170], larg: 16 }, { tipo: 'rua', de: [-170, -90], ate: [170, -90], larg: 10 },
    { tipo: 'rua', de: [-170, 60], ate: [60, 100], larg: 9 }, { tipo: 'casas', u: -20, v: 74, nu: 8, nv: 1, passo: 14 },
    { tipo: 'predio', u: -84, v: -30, w: 24, d: 50, h: 9, cor: '#b9b6ad' }, { tipo: 'predio', u: -88, v: 30, w: 26, d: 40, h: 8, cor: '#c9c3b2' },
    { tipo: 'predio', u: 70, v: 78, w: 26, d: 30, h: 12, cor: '#d9d9d3' }, { tipo: 'predio', u: -10, v: -112, w: 60, d: 26, h: 10, cor: '#d4d7d9' }
  ],
  jogo: { mandante1: [255, 285], mandante2: [70, 100], mandante3: [292, 314], visitante: [164, 196], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.34, mandante2: 0.5, mandante3: 0.34, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { comando_alvinegro: 'mandante1' } }
};
