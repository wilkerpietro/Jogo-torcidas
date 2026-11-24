/* INDEPENDÊNCIA (Arena Independência, América-MG, Belo Horizonte) — pelo
   satélite, pelas sete fotos que o dono mandou (15/11/2026) e pelo esquema
   com as medidas (campo de 105 x 68, 7 m da linha lateral à arquibancada,
   4 m da linha de fundo à arquibancada de trás do gol). O campo corre
   quase leste-oeste (aponta 98,5 graus: o leste, um pouco pro sul); no
   quadro o NORTE fica em cima e o LESTE à direita. (O `norte` da ficha
   estava 85,2, com o sinal trocado; o OpenStreetMap e o satélite deram
   98,5 — corrigido em 16/11/2026, com os nomes das ruas.)
   Arena em U, de cadeira verde, toda coberta:
   · AS DUAS LATERAIS (a do norte, na Rua Pitangui: o Setor Pitangui; a do
     sul, na Rua Ismênia Tunes: o Setor Ismênia) e o FUNDO OESTE (atrás do
     gol, na Rua de Serviço: o Setor Minas), cada
     uma com três níveis (a Wikipédia: o primeiro com 15 mil lugares, o
     segundo de imprensa e camarotes, o terceiro com 6 mil, 27 m de altura,
     bem inclinado): o lance de baixo, a faixa de circulação com os
     camarotes de vidro e o lance de cima.
   · As laterais passam do gol leste (a do norte até 75 m do meio do campo,
     a do sul até 68 m), onde o pilar alto segura a ponta do telhado.
   · Nos dois cantos do oeste, as TORRES de concreto e vidro, com as caixas
     d'água em cima.
   · O FUNDO LESTE é aberto: o prédio do clube de teto escuro e o
     estacionamento, até a Rua Marcionila Montijo.
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
import OSM from '../arredores/estadio-independencia.osm.mjs';
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
const NIVEL = (bN, bN2, bS, bS2, aO, aO2, mais, maisO = mais, maisS = {}) => [
  { de: A(N1, bN), ate: A(N0, bN), dentro: LAT(bN), fora: LAT(bN2), ...mais },
  { de: A(-aO, O1), ate: A(-aO, O0), dentro: FUN(aO), fora: FUN(aO2), ...maisO },
  { de: A(S0, -bS), ate: A(S1, -bS), dentro: LAT(bS), fora: LAT(bS2), ...mais, ...maisS }];
const ROOF = '#d3d4cf', TRELICA = '#eceeea', TORRE = '#cfd0ca';
/* (as fotos do drone, dono, 15/11/2026: "Mais fotos do estádio vistas de um drone que fez tour lá. Veja os detalhes e aplique")
   o lance de baixo das laterais tem a escada de concreto avermelhado; o do fundo oeste NÃO tem cadeira: é degrau pintado de
   verde, com as escadas pretas (só três ou quatro de ponta a ponta); o nível do meio das laterais são os camarotes de vidro de
   frente branca, e o do fundo, cadeiras em blocos curtos na frente do corredor dos bares; no lance de cima, as bocas são as
   gaiolas brancas de escada (de cima, manchas brancas a um quinto da altura) */
const ESC_TERRA = '#9a6c5a', DEGRAU_VERDE = { cor: '#2f9163', cor2: '#2a865b', padrao: 'mosaico', mistura: 0.15, semCadeiras: true, corEspelho: '#236e48',
  corredor: 22, corEscada: '#26282a' };

export default {
  id: 'estadio-independencia', alambrado: false, muro: false, nome: 'Independência', clubes: ['america-mg'], norte: 98.5, vazado: 0.08, folga: 26,
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
      trechos: NIVEL(41, 58, 41, 55, 56.5, 70, { ...CADEIRA, corredor: 12, corEscada: ESC_TERRA }, DEGRAU_VERDE, { h: [1.2, 7.1], fileiras: 16 }) },
    /* a faixa de circulação atrás dele, por onde se entra */
    { dentro: LAT(58), fora: LAT(60.5), reto: true, h: [8.8, 8.8], fileiras: 2, corredorFrente: 0,
      trechos: NIVEL(58, 60.5, 55, 57.5, 70, 72.5, { tipo: 'passagem', alt: 8.8, cor: '#c9c7bf' }, undefined, { alt: 7.5 }) },
    /* O NÍVEL DO MEIO: nas laterais, os camarotes de vidro de frente branca; no fundo oeste, cadeiras em blocos curtos na frente
       do corredor dos bares */
    { dentro: LAT(60.5), fora: LAT(63), reto: true, h: [9.6, 11.4], fileiras: 2, corredorFrente: 0, vomitorios: false,
      trechos: NIVEL(60.5, 63, 57.5, 59.5, 72.5, 77, { semCadeiras: true, passoFileira: 2, corMureta: '#eef0ed', cor: '#2f363b', cor2: '#3a4248', padrao: 'mosaico', mistura: 0.3, corredor: 0 },
        { ...CADEIRA, h: [9.6, 12.4], fileiras: 5, corredor: 9, corEscada: '#c9cbc6', escadaNaBorda: true, corMureta: '#eef0ed' }, { h: [8.3, 10.1] }) },
    /* O LANCE DE CIMA (o terceiro nível), alto e íngreme, com as gaiolas brancas de escada em escadas alternadas */
    { dentro: LAT(63), fora: LAT(75), reto: true, h: [12.6, 27], fileiras: 13, corredorFrente: 1.4,
      trechos: NIVEL(63, 72.5, 59.5, 66.5, 77, 83.5, { ...CADEIRA, corredor: 12, corEscada: '#c9cbc6', vomitorios: { f: 0.2, cada: 2, larg: 4.5, fundo: 4.5, cor: '#e9ebe7', corParapeito: '#f6f7f4' },
        paredeAtras: true, corFachada: '#c9cbc6', corMureta: '#eef0ed' }, undefined, { h: [11.4, 22], fileiras: 8 }) },
    /* o corredor do alto, atrás do último degrau */
    { dentro: LAT(72.5), fora: { a: 86, b: 75, r: 0.5 }, reto: true,
      trechos: NIVEL(72.5, 74.5, 66.5, 68.5, 83.5, 85.5, { tipo: 'passagem', alt: 27, cor: '#c9c7bf' }, undefined, { alt: 22 }) }
  ],
  /* O TELHADO das três arquibancadas, de chapa clara (sem sombra nas vistas de conferência: debaixo dele, as cadeiras verdes
     iluminadas, como nas fotos do dono) */
  telhados: [
    { y: 31, h: 0.5, cor: ROOF, sombra: false, pontos: [[N0, 40], [N1 + 0.6, 40], [N1 + 0.6, 75], [N0, 75]] },
    { y: 31, h: 0.5, cor: ROOF, sombra: false, pontos: [[S0, -40], [S1 + 2, -40], [S1 + 2, -69], [S0, -69]] },
    { y: 31, h: 0.5, cor: ROOF, sombra: false, pontos: [[-57.5, O1], [-86, O1], [-86, O0], [-57.5, O0]] }
  ],
  fachada: { cor: '#c9cbc6' },
  blocos: [
    /* a treliça branca na frente de cada telhado */
    { u: (N0 + N1) / 2, v: 54, w: N1 - N0, d: 6, h: 2.2, y: 31.4, cor: TRELICA, cobertura: true },
    { u: (S0 + S1) / 2 + 1, v: -47, w: S1 - S0 + 2, d: 6, h: 2.2, y: 31.4, cor: TRELICA, cobertura: true },
    { u: -61, v: (O0 + O1) / 2, w: 6, d: O1 - O0, h: 2.2, y: 31.4, cor: TRELICA, cobertura: true },
    /* o "América Futebol Clube" escrito nas duas laterais do telhado */
    { u: 12, v: 62, w: 54, d: 7, h: 0.3, y: 31.6, cor: ROOF, texto: 'América Futebol Clube', corTexto: '#9aa39d', textoLargura: 0.94, textoAltura: 0.62, cobertura: true },
    { u: 6, v: -57, w: 54, d: 7, h: 0.3, y: 31.6, cor: ROOF, texto: 'América Futebol Clube', corTexto: '#9aa39d', textoLargura: 0.94, textoAltura: 0.62, giro: 180, cobertura: true },
    /* os pilares altos que seguram a ponta do telhado das laterais, do lado aberto */
    { u: N1 - 1, v: 62, w: 3.5, d: 7, h: 31, cor: '#bfc1bc' }, { u: S1 + 1, v: -58, w: 3.5, d: 7, h: 31, cor: '#bfc1bc' },
    /* OS BLOCOS dos dois cantos do oeste (a laje escura com as caixas d'água, no satélite), atrás das arquibancadas, e na quina
       virada pro campo a TORRE estreita de concreto e vidro, da altura do telhado (as fotos do dono) */
    { u: -67.5, v: 61, w: 35, d: 27, h: 28, cor: TORRE }, { u: -67.5, v: 61, w: 35, d: 27, h: 0.4, y: 28, cor: '#6e6f6b' },
    { u: -70.5, v: -50, w: 29, d: 36, h: 28, cor: TORRE }, { u: -70.5, v: -50, w: 29, d: 36, h: 0.4, y: 28, cor: '#6e6f6b' },
    { u: -55, v: 52.5, w: 11, d: 11, h: 32, cor: '#d9dad5' }, { u: -54.4, v: 51.9, w: 9.6, d: 9.6, h: 26, y: 3, cor: '#4f5e66' },
    { u: -61, v: -37, w: 11, d: 11, h: 32, cor: '#d9dad5' }, { u: -60.4, v: -36.4, w: 9.6, d: 9.6, h: 26, y: 3, cor: '#4f5e66' },
    { u: -66, v: 70, w: 3.4, d: 3.4, h: 3.2, y: 28.4, cor: '#f1f1ee' }, { u: -66, v: 66, w: 3.4, d: 3.4, h: 3.2, y: 28.4, cor: '#f1f1ee' }, { u: -66, v: 62, w: 3.4, d: 3.4, h: 3.2, y: 28.4, cor: '#f1f1ee' },
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
    /* em cima (norte): a Rua Pitangui e as casas; embaixo (sul): a Rua Ismênia Tunes e as casas */
    { tipo: 'rua', de: [-140, 82.4], ate: [140, 81.4], larg: 10 }, { tipo: 'casas', u: 0, v: 99, nu: 16, nv: 1, passo: 15 },
    { tipo: 'rua', de: [-134, -83], ate: [158, -81.5], larg: 8 }, { tipo: 'casas', u: -10, v: -100, nu: 15, nv: 1, passo: 15 },
    /* à direita (leste): os estacionamentos e a Rua Marcionila Montijo; à esquerda (oeste), as casas da Rua Alexandre Tourinho */
    { tipo: 'estacionamento', u: 102, v: 41, w: 18, d: 52, cheio: 0.2 }, { tipo: 'estacionamento', u: 101, v: -43, w: 22, d: 20, cheio: 0.2 },
    { tipo: 'rua', de: [161, 81], ate: [156, -82], larg: 8 }, { tipo: 'casas', u: -112, v: 0, nu: 1, nv: 9, passo: 15 }
  ],
  /* (escolhas minhas, sem mapa de setores) a Seita Verde no lance de baixo do fundo oeste (o Setor Minas); a visitante na ponta
     leste do lance de baixo da lateral sul (o portão 8, na Rua Ismênia Tunes); os outros bondes da casa nas duas laterais */
  jogo: { mandante1: [168, 192], mandante2: [80, 100], mandante3: [228, 248], visitante: [296, 318], tunelMandante: 180, tunelVisitante: 307, folgaPM: 4,
          fracao: { mandante1: 0.25, mandante2: 0.2, mandante3: 0.2, visitante1: 0.22, visitante2: 0.26, visitante3: 0.18 },
          torcidas: { seita_verde: 'mandante1' } },
  /* OS ARREDORES DE VERDADE (dono, 16/11/2026: "Refaça o independência pra testarmos. O limite é dois quarteirões ao redor do
     estádio. Entrada do estádio bem feita com os corredores que dão acesso exatamente aos setores das respectivas
     organizadas"). As ruas são as do OpenStreetMap; as casas, as do jogo 3D antigo; o resto, à mão, pelo satélite.
     OS PORTÕES (Lance!, 2024): 1 e 2 na Rua Ismênia (Vip e Especial Ismênia), 3 e 4 na Rua Pitangui (Especial e Vip
     Pitangui), 5 e 6 na Rua de Serviço (Cadeira e Especial Minas) e o 8 na Rua Ismênia Tunes (a visitante). A fonte dá a rua
     e o setor de cada um, NÃO o lugar na fachada: pus cada portão na frente do setor a que ele serve.
     A RUA DE SERVIÇO é a viela de dentro do muro, atrás do fundo oeste: é por ela que a Seita Verde chega ao Setor Minas
     (entra pela ponta da Rua Pitangui; a ponta da Rua Ismênia Tunes, do lado da visitante, fica fechada).
     O TAMANHO E QUEM VEM DE ONDE (dono, 16/11/2026, com o contorno desenhado por cima da primeira versão: "Pode ser uma cena
     só desse tamanho, com a rua córrego da mata sendo o ponto de spawn do visitante, e a rua genoveva de Souza ser o ponto
     de spawn do mandante"): a cena vai da Rua Alexandre Tourinho à Marcionila Montijo e da Genoveva de Souza à Ismênia
     Tunes, mais o trecho da Córrego da Mata; fora do contorno a cidade continua desenhada, escurecida, e não se pisa.
     Os três bondes da casa nascem na Genoveva de Souza (o da Seita Verde vai pro portão 6, o segundo pro 3, o terceiro
     dá a volta pela Alexandre Tourinho até o portão 2); os dois da visitante nascem na Córrego da Mata e vão pro portão 8.
     O cordão corta a Rua Ismênia Tunes entre o portão 2 e o 8. */
  arredores: {
    /* (`soFora`: aqui não se briga dentro; a briga da arquibancada abre na rua) */
    osm: OSM, quadro: { u: 178, v: 177, cu: 22, cv: 5 }, vazado: 0.62, semente: 11, soFora: true,
    /* o contorno do dono, passado pro quadro da ficha */
    limite: [[-98, 168], [8, 177], [171, 175], [181, 163], [181, 114], [198, 74], [196, 6], [188, -55], [174, -93], [106, -93], [85, -141], [79, -163], [26, -169], [23, -157], [54, -100],
             [-140, -101], [-151, -92], [-152, -18], [-142, 92], [-91, 98], [-81, 108], [-84, 136], [-91, 157]],
    pisos: [
      /* os dois estacionamentos do lado leste (o contorno é do mapa) e o calçadão da fachada sul */
      ...OSM.areas.filter(a => a.tipo === 'amenity=parking').map(a => ({ pts: a.pts, cor: '#9c9a94' })),
      { pts: [[-93, -75.5], [110, -75.5], [110, -68.2], [-93, -68.2]], cor: '#b3afa4' },
      /* (o corpo do estádio e o prédio do clube não são chão) */
      { pts: [[-85.4, -68.4], [76, -68.4], [76, 74.3], [-85.4, 74.3]], tira: true }, { pts: [[66, -34], [92, -34], [92, 15], [66, 15]], tira: true },
      /* a Rua de Serviço, da ponta da Rua Pitangui até depois do portão 5 */
      { pts: [[-89.2, 74.4], [-89.2, -40]], larg: 7.6, cor: '#bdb9ae', y: 0.08 }
    ],
    portoes: [
      { n: 6, nome: 'PORTÃO 6 · MINAS', u: -89.2, v: 0, dir: [1, 0], larg: 7 },
      { n: 5, nome: 'PORTÃO 5 · MINAS', u: -89.2, v: -30, dir: [1, 0], larg: 7 },
      { n: 3, nome: 'PORTÃO 3 · PITANGUI', u: 0, v: 75.4, dir: [0, -1] },
      { n: 4, nome: 'PORTÃO 4 · PITANGUI', u: 45, v: 75.4, dir: [0, -1] },
      { n: 2, nome: 'PORTÃO 2 · ISMÊNIA', u: -40, v: -70.6, dir: [0, 1] },
      { n: 1, nome: 'PORTÃO 1 · ISMÊNIA', u: -10, v: -70.6, dir: [0, 1] },
      { n: 8, nome: 'PORTÃO 8 · VISITANTE', u: 47, v: -70.6, dir: [0, 1], cor: '#7a2f2f' }
    ],
    bondes: { mandante1: { de: [-60, 136], portao: 6 }, mandante2: { de: [20, 136], portao: 3 }, mandante3: { de: [110, 136], portao: 2 },
              visitante1: { de: [52, -152], portao: 8 }, visitante2: { de: [64, -126], portao: 8 }, visitante3: { de: [44, -160], portao: 8 } },
    /* o cordão: na Rua Ismênia Tunes, entre o portão 2 e o 8, e no estacionamento do lado leste */
    grades: [{ de: [12, -68.5], ate: [12, -89.3] }, { de: [76.2, -55], ate: [123, -55] }],
    /* o gradil de fila na frente de cada portão: o corredor de 14 m e a chicana, com 7 m de vão */
    filas: [
      { pts: [[40, -68.6], [40, -78.2]] }, { pts: [[54, -68.6], [54, -78.2]] }, { pts: [[40, -78.2], [47, -78.2]] },
      { pts: [[-47, -68.6], [-47, -78.2]] }, { pts: [[-33, -68.6], [-33, -78.2]] }, { pts: [[-33, -78.2], [-40, -78.2]] },
      { pts: [[-7, 74.6], [-7, 80.6]] }, { pts: [[7, 74.6], [7, 80.6]] }, { pts: [[-7, 80.6], [0, 80.6]] }
    ],
    pm: [[7, -82], [17, -82], [12, -72], [86, -59], [108, -59], [0, 84], [-89.2, 79], [-56, -82], [64, -82], [150, -86], [-134, -86], [84, -90]],
    /* os muros: o do fundo dos lotes da Rua Alexandre Tourinho (a Rua de Serviço corre entre ele e o estádio) e o que fecha
       a viela depois do portão 6 */
    muros: [{ pts: [[-93.2, -75.3], [-93.2, 74]], h: 3 }, { pts: [[-93.2, -44], [-85.4, -44]], h: 3 }, { pts: [[-93.2, -75.3], [-85.4, -75.3]], h: 3 }],
    predios: { 'Edifício Seattle': { h: 46, cor: '#d9d5c9', corTeto: '#b9b6ad' }, 'Edifício Portland': { h: 46, cor: '#cfd3cf', corTeto: '#b9b6ad' } },
    entorno: [
      /* à mão, pelo satélite: os carros dos dois estacionamentos, as árvores da divisa leste, a quadra e a piscina do clube
         do quarteirão do sudoeste */
      { tipo: 'estacionamento', u: 102.7, v: 41, w: 18, d: 52, cheio: 0.18 }, { tipo: 'estacionamento', u: 101.7, v: -43, w: 22, d: 20, cheio: 0.18 },
      { tipo: 'arvores', u: 118.7, v: -25, w: 5, d: 44, n: 6 }, { tipo: 'arvores', u: 177.7, v: -43, w: 22, d: 30, n: 6 },
      { tipo: 'quadra', u: -114.3, v: -127, w: 26, d: 28, cor: '#b5553f' }, { tipo: 'piscina', u: -116.3, v: -155, w: 10, d: 18 }
    ],
    /* de cima do sudoeste, olhando a Rua Ismênia Tunes e os portões 2 e 8 */
    vista: [-60, 95, -210, 5, 0, -70]
  }
};
