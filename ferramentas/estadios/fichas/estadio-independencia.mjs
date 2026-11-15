/* INDEPENDÊNCIA (Arena Independência, América-MG, Belo Horizonte) — pelo
   satélite, pelas sete fotos que o dono mandou (15/11/2026) e pelo esquema
   com as medidas (campo de 105 x 68, 7 m da linha lateral à arquibancada,
   4 m da linha de fundo à arquibancada de trás do gol). O campo corre
   quase leste-oeste; no quadro o NORTE fica em cima e o LESTE à direita.
   Arena em U, de cadeira verde, toda coberta:
   · AS DUAS LATERAIS (a do norte, na Rua Genoveva de Souza; a do sul, na
     Rua Ismênia Tunes) e o FUNDO OESTE (atrás do gol, o Setor Minas), cada
     uma com três níveis (a Wikipédia: o primeiro com 15 mil lugares, o
     segundo de imprensa e camarotes, o terceiro com 6 mil, 27 m de altura,
     bem inclinado): o lance de baixo, a faixa de circulação com os
     camarotes de vidro e o lance de cima.
   · As laterais passam do gol leste (a do norte até 75 m do meio do campo,
     a do sul até 68 m), onde o pilar alto segura a ponta do telhado.
   · Nos dois cantos do oeste, as TORRES de concreto e vidro, com as caixas
     d'água em cima.
   · O FUNDO LESTE (Rua Pitangui) é aberto: o prédio do clube de teto
     escuro e o estacionamento.
   · O TELHADO: chapa clara, com a treliça branca na frente de cada
     arquibancada e o "América Futebol Clube" escrito nas duas laterais
     (como no satélite).
   OS ACESSOS (a regra dos dois andares, dono, 15/11/2026): o lance de
   baixo sem boca, entra-se pela faixa de circulação atrás dele; o lance de
   cima com a boca a um quarto da altura, em escadas alternadas.
   OS SETORES (Lance!): o Pitangui e o Ismênia nas laterais, o Minas atrás
   do gol (portões na Rua de Serviço); a visitante entra pelo portão 8, na
   Rua Ismênia Tunes, então fica na lateral sul. NÃO achei mapa de setores:
   a ponta da lateral sul pra visitante e o fundo oeste pra Seita Verde são
   escolhas minhas. */
const V = '#2f8a50', V2 = '#3f9e60';                     /* a cadeira verde, em dois tons (vivos, como nas fotos) */
const CADEIRA = { cor: V, cor2: V2, padrao: 'mosaico', mistura: 0.3 };
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* AS TRÊS ARQUIBANCADAS, cada nível com o seu contorno (retângulo de canto vivo): `b` é a beira da lateral, `a` a do fundo */
const LAT = b => ({ a: 80, b, r: 0.5 }), FUN = a => ({ a, b: 62, r: 0.5 });
/* (canto de meio metro, nunca zero: com raio zero o gerador toma o lado do fundo pelo da lateral e junta todas as colunas no canto) */
/* onde acabam as arquibancadas: a lateral norte de u = -50 a 74, a sul de -56 a 66; o fundo oeste de v = -32 a 47,5 */
const N0 = -50, N1 = 74, S0 = -56, S1 = 66, O0 = -32, O1 = 47.5;
/* um nível: as beiras de cada lado (norte e sul em v, oeste em u) e o que vai em cada trecho */
const NIVEL = (bN, bN2, bS, bS2, aO, aO2, mais, maisO = mais) => [
  { de: A(N1, bN), ate: A(N0, bN), dentro: LAT(bN), fora: LAT(bN2), ...mais },
  { de: A(-aO, O1), ate: A(-aO, O0), dentro: FUN(aO), fora: FUN(aO2), ...maisO },
  { de: A(S0, -bS), ate: A(S1, -bS), dentro: LAT(bS), fora: LAT(bS2), ...mais }];
const ROOF = '#d3d4cf', TRELICA = '#eceeea', TORRE = '#cfd0ca';
/* (as fotos do drone, dono, 15/11/2026: "Mais fotos do estádio vistas de um drone que fez tour lá. Veja os detalhes e aplique")
   o lance de baixo das laterais tem a escada de concreto avermelhado; o do fundo oeste NÃO tem cadeira: é degrau pintado de
   verde, com as escadas pretas (só três ou quatro de ponta a ponta); o nível do meio das laterais são os camarotes de vidro de
   frente branca, e o do fundo, cadeiras em blocos curtos na frente do corredor dos bares; no lance de cima, as bocas são as
   gaiolas brancas de escada (de cima, manchas brancas a um quinto da altura) */
const ESC_TERRA = '#9a6c5a', DEGRAU_VERDE = { cor: '#2f9163', cor2: '#2a865b', padrao: 'mosaico', mistura: 0.15, semCadeiras: true, corEspelho: '#236e48',
  corredor: 22, corEscada: '#26282a' };

export default {
  id: 'estadio-independencia', alambrado: false, muro: false, nome: 'Independência', clubes: ['america-mg'], norte: 85.2, vazado: 0.08, folga: 26,
  chao: { cor: '#86827a' },
  campo: { corMargem: '#4f9353' },
  corMureta: '#d9dbd6',
  /* o espelho de cada degrau no verde do encosto (de frente, nas fotos, as fileiras são verdes, não de concreto) */
  corEspelho: '#2a7a47',
  aneis: [
    /* a beira do campo, ao pé das três arquibancadas (atrás das placas de publicidade): é por aqui que se passa de uma
       arquibancada pra outra por dentro, contornando as torres dos cantos */
    { dentro: { a: 54.5, b: 39, r: 0.5 }, fora: { a: 56.5, b: 41, r: 0.5 }, reto: true, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: A(54.5, 39), ate: A(54.5, -39) + 360, tipo: 'passagem', cor: '#5f9a5e' }] },
    /* O LANCE DE BAIXO (o primeiro nível), sem boca */
    { dentro: LAT(41), fora: LAT(58), reto: true, h: [1.2, 8.4], fileiras: 19, vomitorios: false,
      trechos: NIVEL(41, 58, 41, 58, 56.5, 70, { ...CADEIRA, corredor: 12, corEscada: ESC_TERRA }, DEGRAU_VERDE) },
    /* a faixa de circulação atrás dele, por onde se entra */
    { dentro: LAT(58), fora: LAT(60.5), reto: true, h: [8.8, 8.8], fileiras: 2, corredorFrente: 0,
      trechos: NIVEL(58, 60.5, 58, 60.5, 70, 72.5, { tipo: 'passagem', alt: 8.8, cor: '#c9c7bf' }) },
    /* O NÍVEL DO MEIO: nas laterais, os camarotes de vidro de frente branca; no fundo oeste, cadeiras em blocos curtos na frente
       do corredor dos bares */
    { dentro: LAT(60.5), fora: LAT(63), reto: true, h: [9.6, 11.4], fileiras: 2, corredorFrente: 0, vomitorios: false,
      trechos: NIVEL(60.5, 63, 60.5, 63, 72.5, 77, { semCadeiras: true, passoFileira: 2, corMureta: '#eef0ed', cor: '#2f363b', cor2: '#3a4248', padrao: 'mosaico', mistura: 0.3, corredor: 0 },
        { ...CADEIRA, h: [9.6, 12.4], fileiras: 5, corredor: 9, corEscada: '#c9cbc6', escadaNaBorda: true, corMureta: '#eef0ed' }) },
    /* O LANCE DE CIMA (o terceiro nível), alto e íngreme, com as gaiolas brancas de escada em escadas alternadas */
    { dentro: LAT(63), fora: LAT(75), reto: true, h: [12.6, 27], fileiras: 13, corredorFrente: 1.4,
      trechos: NIVEL(63, 75, 63, 73, 77, 86, { ...CADEIRA, corredor: 12, corEscada: '#c9cbc6', vomitorios: { f: 0.2, cada: 2, larg: 4.5, fundo: 4.5, cor: '#e9ebe7', corParapeito: '#f6f7f4' },
        paredeAtras: true, corFachada: '#c9cbc6', corMureta: '#eef0ed' }) },
    /* o corredor do alto, atrás do último degrau */
    { dentro: LAT(75), fora: { a: 89, b: 78, r: 0.5 }, reto: true,
      trechos: NIVEL(75, 77.5, 73, 75.5, 86, 88.5, { tipo: 'passagem', alt: 27, cor: '#c9c7bf' }) }
  ],
  /* O TELHADO das três arquibancadas, de chapa clara (sem sombra nas vistas de conferência: debaixo dele, as cadeiras verdes
     iluminadas, como nas fotos do dono) */
  telhados: [
    { y: 31, h: 0.5, cor: ROOF, sombra: false, pontos: [[N0, 40], [N1 + 0.6, 40], [N1 + 0.6, 80], [N0, 80]] },
    { y: 31, h: 0.5, cor: ROOF, sombra: false, pontos: [[S0, -40], [S1 + 2, -40], [S1 + 2, -74], [S0, -74]] },
    { y: 31, h: 0.5, cor: ROOF, sombra: false, pontos: [[-57.5, O1], [-89, O1], [-89, O0], [-57.5, O0]] }
  ],
  fachada: { cor: '#c9cbc6' },
  blocos: [
    /* a treliça branca na frente de cada telhado */
    { u: (N0 + N1) / 2, v: 54, w: N1 - N0, d: 6, h: 2.2, y: 31.4, cor: TRELICA, cobertura: true },
    { u: (S0 + S1) / 2 + 1, v: -47, w: S1 - S0 + 2, d: 6, h: 2.2, y: 31.4, cor: TRELICA, cobertura: true },
    { u: -61, v: (O0 + O1) / 2, w: 6, d: O1 - O0, h: 2.2, y: 31.4, cor: TRELICA, cobertura: true },
    /* o "América Futebol Clube" escrito nas duas laterais do telhado */
    { u: 12, v: 64, w: 54, d: 7, h: 0.3, y: 31.6, cor: ROOF, texto: 'América Futebol Clube', corTexto: '#9aa39d', textoLargura: 0.94, textoAltura: 0.62, cobertura: true },
    { u: 6, v: -58, w: 54, d: 7, h: 0.3, y: 31.6, cor: ROOF, texto: 'América Futebol Clube', corTexto: '#9aa39d', textoLargura: 0.94, textoAltura: 0.62, giro: 180, cobertura: true },
    /* os pilares altos que seguram a ponta do telhado das laterais, do lado aberto */
    { u: N1 - 1, v: 62, w: 3.5, d: 7, h: 31, cor: '#bfc1bc' }, { u: S1 + 1, v: -58, w: 3.5, d: 7, h: 31, cor: '#bfc1bc' },
    /* OS BLOCOS dos dois cantos do oeste (a laje escura com as caixas d'água, no satélite), atrás das arquibancadas, e na quina
       virada pro campo a TORRE estreita de concreto e vidro, da altura do telhado (as fotos do dono) */
    { u: -67, v: 63.8, w: 34, d: 32, h: 28, cor: TORRE }, { u: -67, v: 63.8, w: 34, d: 32, h: 0.4, y: 28, cor: '#6e6f6b' },
    { u: -72, v: -48, w: 32, d: 32, h: 28, cor: TORRE }, { u: -72, v: -48, w: 32, d: 32, h: 0.4, y: 28, cor: '#6e6f6b' },
    { u: -55, v: 52.5, w: 11, d: 11, h: 32, cor: '#d9dad5' }, { u: -54.4, v: 51.9, w: 9.6, d: 9.6, h: 26, y: 3, cor: '#4f5e66' },
    { u: -61, v: -37, w: 11, d: 11, h: 32, cor: '#d9dad5' }, { u: -60.4, v: -36.4, w: 9.6, d: 9.6, h: 26, y: 3, cor: '#4f5e66' },
    { u: -66, v: 72, w: 3.4, d: 3.4, h: 3.2, y: 28.4, cor: '#f1f1ee' }, { u: -66, v: 68, w: 3.4, d: 3.4, h: 3.2, y: 28.4, cor: '#f1f1ee' }, { u: -66, v: 64, w: 3.4, d: 3.4, h: 3.2, y: 28.4, cor: '#f1f1ee' },
    { u: -72, v: -46, w: 3.4, d: 3.4, h: 3.2, y: 28.4, cor: '#f1f1ee' }, { u: -72, v: -50, w: 3.4, d: 3.4, h: 3.2, y: 28.4, cor: '#f1f1ee' }, { u: -72, v: -54, w: 3.4, d: 3.4, h: 3.2, y: 28.4, cor: '#f1f1ee' },
    /* o fundo leste, aberto (as fotos do drone): o prédio baixo do clube, de frente verde-escura com o escudo, o AMÉRICA FC e o
       DECACAMPEÃO virados pro campo, e o telão grande em cima dele */
    { u: 78, v: -8, w: 22, d: 44, h: 7, cor: '#74766f' },
    { u: 66.8, v: 6, w: 0.5, d: 16, h: 2.6, y: 3.6, cor: '#1f3b2d', texto: 'AMÉRICA FC', corTexto: '#f1f2ee', textoFace: true, giro: 180, textoLargura: 0.8, textoAltura: 0.55 },
    { u: 66.8, v: -17, w: 0.5, d: 16, h: 2.6, y: 3.6, cor: '#1f3b2d', texto: 'DECACAMPEÃO', corTexto: '#f1f2ee', textoFace: true, giro: 180, textoLargura: 0.85, textoAltura: 0.55 },
    { u: 66.6, v: 17, w: 0.6, d: 4.5, h: 5.5, y: 3, cor: '#e9ece8' }, { u: 66.4, v: 17, w: 0.4, d: 3.6, h: 4.4, y: 3.5, cor: '#2f7d55' },
    { u: 73, v: 2, w: 2, d: 18, h: 8, y: 7, cor: '#1c1d20' },
    /* o muro branco com a grade, do lado norte do fundo aberto */
    { u: 64, v: 33, w: 1, d: 18, h: 3, cor: '#e6e6e1' },
    /* os bancos de reserva, ao pé da lateral sul (os retângulos brancos do satélite) */
    { u: -22, v: -37.6, w: 13, d: 2.4, h: 2, cor: '#d9dedb' }, { u: -4, v: -37.6, w: 8, d: 2.4, h: 2, cor: '#d9dedb' }, { u: 15, v: -37.6, w: 8, d: 2.4, h: 2, cor: '#d9dedb' }
  ],
  /* a câmera de uma das fotos do dono: do canto do gol leste, olhando o fundo oeste */
  vista: [-30, 4, 10, 70, 6, 2],
  entorno: [
    /* em cima (norte): a Rua Genoveva de Souza e as casas; embaixo (sul): a Rua Ismênia Tunes e as casas */
    { tipo: 'rua', de: [-140, 86], ate: [140, 92], larg: 10 }, { tipo: 'casas', u: 0, v: 106, nu: 16, nv: 1, passo: 15 },
    { tipo: 'rua', de: [-140, -86], ate: [140, -80], larg: 10 }, { tipo: 'casas', u: -10, v: -102, nu: 15, nv: 1, passo: 15 },
    /* à direita (leste): o estacionamento e a Rua Pitangui; à esquerda (oeste), as casas */
    { tipo: 'estacionamento', u: 100, v: 40, w: 30, d: 60, cheio: 0.2 }, { tipo: 'estacionamento', u: 100, v: -50, w: 26, d: 50, cheio: 0.2 },
    { tipo: 'rua', de: [128, 120], ate: [124, -120], larg: 10 }, { tipo: 'casas', u: -112, v: 0, nu: 1, nv: 9, passo: 15 }
  ],
  /* (escolhas minhas, sem mapa de setores) a Seita Verde no lance de baixo do fundo oeste (o Setor Minas); a visitante na ponta
     leste do lance de baixo da lateral sul (o portão 8, na Rua Ismênia Tunes); os outros bondes da casa nas duas laterais */
  jogo: { mandante1: [168, 192], mandante2: [80, 100], mandante3: [228, 248], visitante: [296, 318], tunelMandante: 180, tunelVisitante: 307, folgaPM: 4,
          fracao: { mandante1: 0.25, mandante2: 0.2, mandante3: 0.2, visitante1: 0.22, visitante2: 0.26, visitante3: 0.18 },
          torcidas: { seita_verde: 'mandante1' } }
};
