/* GODOFREDO CRUZ (Americano, Campos dos Goytacazes) — o estádio ANTIGO, do
   Parque Tamandaré, demolido em 2014. O dono escolheu este (16/11/2026: "o
   Americano ganha estádio próprio"; "Vamos pro estádio do americano de
   Campos") e mandou quatro fotos: uma de dentro, duas aéreas (uma delas
   espelhada) e uma por trás das abóbadas. A PLANTA saiu do satélite de 2014
   (o acervo antigo, 1,1 m por ponto: dá a forma e as medidas, não o
   detalhe). O campo corre quase norte-sul; no quadro o LESTE fica em cima e
   o NORTE à esquerda. Estádio oval, de cadeira preta e muro branco:
   · EMBAIXO (oeste, a avenida), a arquibancada principal, a mais funda, de
     cadeira preta, coberta pelas ABÓBADAS de concreto (oito grandes atrás e
     uma fila de pequenas na frente), em cima da armação branca de painéis
     pretos; a ponta sul dela fica descoberta.
   · No canto NOROESTE, o leque de cadeira preta, descoberto, emendado nela.
   · À ESQUERDA (norte), NÃO há arquibancada: o prédio baixo branco de faixa
     preta SAÍDAS DE EMERGÊNCIA, de portas vermelhas, e o muro branco em
     curva.
   · EM CIMA (leste), a arquibancada comprida e rasa, de cadeira preta em
     blocos com as escadas brancas, com as placas no alto (AMERICANO CAMPEÃO
     DA TAÇA RIO 2002).
   · À DIREITA (sul), a curva de cadeira preta, que emenda na do leste e na
     principal; por fora, o prédio do clube e a piscina.
   Estimado: as alturas, o número de fileiras e de blocos (o satélite é
   grosso), o desenho das abóbadas.
   AS TORCIDAS (escolhas minhas, sem fonte): a Império Americano na curva do
   sul; a visitante no leque do noroeste. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const PR = '#27282c', PR2 = '#34353a', BR = '#eceae4', ESC = '#d9d8d2', CONC = '#a9aaa6', CONC2 = '#9fa09c', FAIXA = '#1d1e21', VM = '#c2382f';
/* a beira do gramado (o alambrado branco), a beira das arquibancadas e os fundos, todos ovais de mesmo centro */
const GRAMA = { a: 83, b: 38, r: 38 }, I = { a: 86, b: 41, r: 41 }, C = d => ({ a: 86 + d, b: 41 + d, r: 41 + d });
const CAD = { cor: PR, cor2: PR2, padrao: 'mosaico', mistura: 0.3, corEscada: ESC, vomitorios: false, paredeAtras: true, corFachada: BR };
const NO = A(-45 - 41 * Math.cos(39 * RAD), -41 * Math.sin(39 * RAD));
/* as portas vermelhas do prédio das saídas */
const PORTAS = [-18, -9, 0, 9, 18].map(v => ({ u: -88.3, v: v - 3, w: 0.3, d: 3, h: 2.2, cor: VM }));

export default {
  id: 'estadio-godofredo-cruz', nome: 'Godofredo Cruz', clubes: ['americano'], norte: 200.2, vazado: 0.3, folga: 24,
  chao: { cor: '#7f7b74' },
  campo: { corMargem: '#4f9150' },
  corMureta: '#bdbab1', corAlambrado: '#eceeea',
  alambrado: { cor: '#eceeea', corBase: '#bdbab1' },
  aneis: [
    /* a passagem de cimento entre o alambrado e as arquibancadas: liga tudo num chão só */
    { dentro: GRAMA, fora: I, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#b3b0a7' }] },
    { dentro: I, fora: C(26), reto: true, h: [1.2, 12], inclinacao: 0.42, fileiras: 30, corredorFrente: 1.2,
      trechos: [
        /* À DIREITA (sul): a curva de cadeira preta */
        { ...CAD, de: A(45, -41) - 360, ate: A(45, 41), fora: C(12), corredor: 13, parapeito: 2.2 },
        /* EM CIMA (leste): a comprida e rasa, com as placas no alto */
        { ...CAD, de: A(45, 41), ate: 142, fora: C(8), corredor: 11, escadaNaBorda: true, parapeito: 1.4 },
        /* À ESQUERDA (norte): sem arquibancada */
        { de: 142, ate: NO, tipo: 'vazio' },
        /* o leque do noroeste */
        { ...CAD, de: NO, ate: A(-45, -41), corredor: 10 },
        /* EMBAIXO (oeste): a principal, debaixo das abóbadas */
        { ...CAD, de: A(-45, -41), ate: A(45, -41), corredor: 9.25, escadaNaBorda: true, parapeito: 3 }
      ] }
  ],
  /* as abóbadas de concreto: as oito grandes de trás e a fila das pequenas da frente */
  abobadas: [
    { concreto: true, u: -5, comp: 74, vFrente: -51, vFundo: -67.8, n: 8, bojo: 3, cor: CONC, cor2: CONC2, corTesteira: '#c9cac6', corFundo: BR, fundo: 14.4, perfil: [[0, 14.6], [1, 14.6]], pilarEm: 0.94, corPilar: BR, espPilar: 0.7 },
    { concreto: true, u: -5, comp: 74, vFrente: -45, vFundo: -51, n: 8, bojo: 1.6, cor: CONC2, cor2: CONC, corTesteira: '#c9cac6', fundo: false, perfil: [[0, 13], [1, 13]], pilarEm: 1, corPilar: BR, espPilar: 0.5 }
  ],
  fachada: { cor: BR },
  refletores: [],
  blocos: [
    /* a armação branca de painéis pretos, por trás da principal, e a faixa preta do alto */
    { u: -5, v: -67.4, w: 74, d: 0.5, h: 3.4, y: 5.4, cor: FAIXA }, { u: -5, v: -67.4, w: 74, d: 0.5, h: 2.6, y: 10.2, cor: FAIXA },
    ...Array.from({ length: 9 }, (_, i) => ({ u: -42 + i * 9.25, v: -67.5, w: 0.7, d: 0.8, h: 14.4, cor: BR })),
    /* as placas do alto da arquibancada do leste */
    { u: 0, v: 49.6, w: 0.3, d: 92, h: 1.5, y: 6, cor: FAIXA, texto: 'AMERICANO CAMPEÃO DA TAÇA RIO 2002', corTexto: '#f1f2ee', textoFace: true, giro: -90, textoLargura: 0.5, textoAltura: 0.6 },
    /* o prédio das saídas, atrás do gol do norte: branco, de faixa preta e portas vermelhas */
    { u: -92, v: -3, w: 7, d: 46, h: 3.4, cor: BR },
    { u: -88.4, v: -3, w: 0.3, d: 46, h: 1, y: 2.5, cor: FAIXA, texto: 'SAÍDAS DE EMERGÊNCIA', corTexto: '#f1f2ee', textoFace: true, textoLargura: 0.5, textoAltura: 0.62 },
    ...PORTAS,
    /* o placar, atrás do gol do sul, e os bancos de reserva do lado da principal */
    { u: 80, v: 0, w: 1, d: 13, h: 2.6, cor: '#2c2e33' },
    { u: -20, v: -37, w: 9, d: 1.8, h: 1.9, cor: '#e9e8e2' }, { u: 20, v: -37, w: 9, d: 1.8, h: 1.9, cor: '#e9e8e2' }
  ],
  /* a câmera da foto do dono: do alto, por trás das abóbadas, olhando a arquibancada do leste */
  vista: [-8, 46, -122, -4, 2, 6],
  entorno: [
    /* embaixo (oeste): a avenida, que faz a curva pro sul, e as casas do outro lado */
    { tipo: 'rua', de: [-135, -80], ate: [60, -80], larg: 13 }, { tipo: 'rua', de: [60, -80], ate: [135, -36], larg: 13 },
    { tipo: 'casas', u: -40, v: -100, nu: 12, nv: 1, passo: 15 }, { tipo: 'casas', u: 100, v: -84, nu: 3, nv: 1, passo: 15 },
    /* à esquerda (norte): a rua e as casas */
    { tipo: 'rua', de: [-106, -80], ate: [-106, 110], larg: 9 }, { tipo: 'casas', u: -124, v: 20, nu: 1, nv: 10, passo: 15 },
    /* em cima (leste): as árvores e o campo de treino */
    { tipo: 'arvores', u: -30, v: 66, w: 70, d: 22, n: 9 }, { tipo: 'grama', u: 50, v: 84, w: 100, d: 46, cor: '#6f9a58' },
    /* à direita (sul): o prédio do clube e a piscina */
    { tipo: 'predio', u: 116, v: 38, w: 26, d: 26, h: 9, cor: '#5d5651' }, { tipo: 'piscina', u: 116, v: 0, w: 18, d: 36 }
  ],
  jogo: { mandante1: [-22, 22], mandante2: [62, 118], mandante3: [240, 300], visitante: [199, 221], tunelMandante: 270, tunelVisitante: 210, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { imperio_americano: 'mandante1' } }
};
