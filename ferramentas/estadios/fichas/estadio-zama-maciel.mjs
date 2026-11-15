/* ZAMA MACIEL (URT, Patos de Minas) — só pelo satélite (15/11/2026): a busca
   de fotos não trouxe nada do estádio e o dono não mandou fotos deste. O campo
   corre quase norte-sul; no quadro o OESTE fica em cima e o NORTE à direita.
   Estádio pequeno, no meio de um quarteirão do centro (a Rua Uberlândia):
   · EM CIMA (oeste), três partes: a ARQUIBANCADA COBERTA do lado sul, a
     TRIBUNA no meio (as fileiras claras na frente do prédio de telhado
     escuro) e a outra COBERTA do lado norte (o laudo dos bombeiros fala no
     portão 02, da arquibancada coberta, e no 03, da tribuna).
   · EMBAIXO (leste), a lateral comprida DESCOBERTA, de degrau de cimento
     avermelhado, com o muro branco atrás, de ponta a ponta.
   · À ESQUERDA (sul), a arquibancadinha estreita de trás do gol, com as
     letras pintadas no degrau (no satélite parecem TUF; li URT de cabeça
     pra baixo — confirmar).
   · À DIREITA (norte), NÃO há arquibancada: o muro, a grade e as árvores.
   As cores, a altura e o número de degraus são estimados (sem foto).
   AS TORCIDAS (escolhas minhas, sem mapa de setores): a Poeira Azul na
   lateral descoberta do leste; a visitante na arquibancadinha do sul. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const I = { a: 56.5, b: 39, r: 0.5 };
const LAT = b => ({ a: 56.5, b, r: 0.5 }), FUN = a => ({ a, b: 39, r: 0.5 });
const CIMENTO = { cor: '#9b9893', cor2: '#8e8b86', padrao: 'mosaico', mistura: 0.25, semCadeiras: true, corEscada: '#e6e6e1', vomitorios: false, corredor: 14 };

export default {
  id: 'estadio-zama-maciel', nome: 'Zama Maciel', clubes: ['urt'], norte: 96, vazado: 0.3, folga: 26,
  chao: { cor: '#7e7a72' },
  campo: { corMargem: '#4f9353' },
  corMureta: '#e6e6e1',
  aneis: [
    /* a margem de grama em volta do gramado, ao pé de todas */
    { dentro: { a: 52.8, b: 34.3, r: 0.5 }, fora: I, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9353' }] },
    { dentro: I, fora: LAT(46), reto: true, h: [1, 4.5], fileiras: 8,
      trechos: [
        /* EM CIMA (oeste): a coberta do norte, a tribuna e a coberta do sul */
        { de: A(56, 39), ate: A(11, 39), fora: LAT(55), h: [1.2, 7], fileiras: 13, ...CIMENTO },
        { de: A(11, 39), ate: A(10, 39), tipo: 'vazio' },
        { de: A(10, 39), ate: A(-14, 39), fora: LAT(45), h: [1.4, 4.2], fileiras: 6, cor: '#e9e9e5', cor2: '#d9dad6', padrao: 'mosaico', mistura: 0.3,
          corredor: 8, corEscada: '#bdbdb8', vomitorios: false },
        { de: A(-14, 39), ate: A(-17, 39), tipo: 'vazio' },
        { de: A(-17, 39), ate: A(-56, 39), fora: LAT(51), h: [1.2, 6], fileiras: 11, ...CIMENTO },
        { de: A(-56, 39), ate: A(-56.5, 30), tipo: 'vazio' },
        /* À ESQUERDA (sul): a arquibancadinha de trás do gol, com as letras no degrau */
        { de: A(-56.5, 30), ate: A(-56.5, -35), fora: FUN(64.5), h: [0.8, 3.2], fileiras: 6, ...CIMENTO, corredor: 16,
          texto: 'URT', corTexto: '#f1f2ee', textoLargura: 0.3, textoAltura: 0.7 },
        { de: A(-56.5, -35), ate: A(-56, -39), tipo: 'vazio' },
        /* EMBAIXO (leste): a lateral comprida descoberta, de cimento avermelhado */
        { de: A(-56, -39), ate: A(55, -39), cor: '#8f7166', cor2: '#836960', padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corEscada: '#e6e6e1',
          vomitorios: false, corredor: 18, paredeAtras: true, corFachada: '#e9e9e4' },
        /* À DIREITA (norte): sem arquibancada */
        { de: A(55, -39), ate: A(56, 39) + 360, tipo: 'vazio' }
      ] }
  ],
  /* os telhados das duas cobertas do oeste */
  telhados: [
    { y: 9, h: 0.4, cor: '#9da1a3', pontos: [[-58, 38.5], [-16, 38.5], [-16, 52], [-58, 52]] },
    { y: 10, h: 0.4, cor: '#9da1a3', pontos: [[11, 41], [57.5, 41], [57.5, 56], [11, 56]] }
  ],
  fachada: { cor: '#e9e9e4' },
  refletores: [[-42, -48, 24], [10, -48, 24], [-36, 54, 24], [36, 58, 24]],
  blocos: [
    /* o prédio da tribuna, de telhado escuro */
    { u: -2, v: 52.5, w: 25, d: 15, h: 10, cor: '#d6d3cb' }, { u: -2, v: 52.5, w: 26, d: 16, h: 0.4, y: 10, cor: '#8f8a80' },
    /* o muro branco atrás da lateral leste e o do fundo norte, com a grade */
    { u: -0.5, v: -47.2, w: 112, d: 1.4, h: 5, cor: '#e6e6e1' }, { u: 57.5, v: 0, w: 1, d: 76, h: 3, cor: '#2f3a33' },
    /* os bancos de reserva, ao pé da tribuna */
    { u: -14, v: 37.5, w: 9, d: 2.2, h: 2, cor: '#d9dad6' }, { u: 10, v: 37.5, w: 9, d: 2.2, h: 2, cor: '#d9dad6' }
  ],
  vista: [80, 30, -20, -40, 4, 20],
  entorno: [
    /* embaixo (leste), a Rua Uberlândia; à direita (norte) e à esquerda (sul), as ruas; em volta, as casas e os galpões */
    { tipo: 'rua', de: [-140, -56], ate: [140, -56], larg: 12 }, { tipo: 'rua', de: [82, 120], ate: [82, -120], larg: 12 },
    { tipo: 'rua', de: [-84, 120], ate: [-84, -120], larg: 10 },
    { tipo: 'casas', u: 0, v: -72, nu: 14, nv: 1, passo: 15 }, { tipo: 'casas', u: -20, v: 75, nu: 10, nv: 1, passo: 15 },
    { tipo: 'predio', u: -72, v: 40, w: 20, d: 30, h: 8, cor: '#d7cfbf' }, { tipo: 'predio', u: -72, v: -20, w: 16, d: 34, h: 7, cor: '#c9714f' },
    { tipo: 'arvores', u: 68, v: 2, w: 12, d: 24, n: 6 }, { tipo: 'predio', u: 68, v: 35, w: 12, d: 24, h: 7, cor: '#c9c9c4' },
    { tipo: 'predio', u: 70, v: -30, w: 18, d: 24, h: 9, cor: '#d9d9d4' }
  ],
  jogo: { mandante1: [255, 285], mandante2: [120, 140], mandante3: [40, 68], visitante: [168, 192], tunelMandante: 270, tunelVisitante: 180, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { poeira_azul: 'mandante1' } }
};
