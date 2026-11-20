/* ALLIANZ PARQUE (Palmeiras, São Paulo) — pelo mapa de acesso do clube, pelo
   satélite e pelas fotos de referência (15/11/2026). No quadro o OESTE fica
   em cima e o NORTE à direita.
   Arena de três níveis que dão a volta inteira: o lance de BAIXO (Gol
   Norte, Central Leste, Gol Sul, Central Oeste), o anel dos CAMAROTES e o
   lance de CIMA (os Superiores). Cadeira em dois verdes, mais clara
   embaixo e mais escura em cima.
   O estádio NÃO é simétrico: a ponta NORTE (à direita) é redonda e funda,
   em anfiteatro; a ponta SUL (à esquerda) é reta e rasa. Por isso cada
   anel tem dois contornos, um pra cada metade, que se encontram nas
   laterais.
   O telhado tapa todas as cadeiras (o satélite não mostra arquibancada; a
   planta saiu do mapa do clube e das fotos de dentro): branco, com a faixa
   cinza translúcida em volta da abertura, bem mais larga no norte. Os cinco
   pórticos brancos de treliça seguram o telhado; o letreiro azul fica nas
   duas laterais.
   OS ACESSOS (fotos de dentro): aqui o lance de baixo TEM boca no meio do
   lance (as caixas de concreto a meia altura, uma a cada duas escadas), e o
   de cima tem as bocas a um quarto da altura. Os túneis grandes ficam no
   meio dos dois fundos.
   AS TORCIDAS (mapa do clube): a Mancha Verde e a TUP no Gol Norte; a
   visitante no lance de cima do canto sudeste (setores 526 a 530, portão D). */
const V1 = '#3f9a55', V2 = '#8fcf8c';                   /* o lance de baixo: verde e verde-claro */
const V3 = '#2f7f4c', V4 = '#58a868';                   /* o lance de cima: verde-escuro */
const RAD = Math.PI / 180;
/* OS CONTORNOS, um par (sul, norte) por nível; nas laterais os dois têm a mesma meia largura */
const I = [{ a: 60, b: 41, r: 8 }, { a: 65, b: 41, r: 26 }];              /* a beira do campo */
const L = [{ a: 75, b: 60, r: 25 }, { a: 87, b: 60, r: 45 }];             /* o fundo do lance de baixo */
const C = [{ a: 78.5, b: 63.5, r: 28.5 }, { a: 90.5, b: 63.5, r: 48.5 }]; /* o anel de circulação */
const K = [{ a: 82.5, b: 67.5, r: 32.5 }, { a: 94.5, b: 67.5, r: 52.5 }]; /* os camarotes */
const F = [{ a: 93, b: 84, r: 42 }, { a: 119, b: 84, r: 76 }];            /* o fundo do lance de cima */
/* as duas metades de um nível: a norte (de -90 a 90) e a sul (de 90 a 270) */
const metades = (dentro, fora, mais) => [{ de: -90, ate: 90, dentro: dentro[1], fora: fora[1], ...mais }, { de: 90, ate: 270, dentro: dentro[0], fora: fora[0], ...mais }];
/* a linha de um contorno de duas metades, pra desenhar o telhado (anti-horário, começando embaixo no meio) */
const arco = (cu, cv, r, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * RAD; return [cu + r * Math.cos(a), cv + r * Math.sin(a)]; });
const linha = ([s, n]) => [
  ...arco(n.a - n.r, -(n.b - n.r), n.r, -90, 0), ...arco(n.a - n.r, n.b - n.r, n.r, 0, 90),
  ...arco(-(s.a - s.r), s.b - s.r, s.r, 90, 180), ...arco(-(s.a - s.r), -(s.b - s.r), s.r, 180, 270)];
/* O TELHADO: a abertura em cima do campo, a faixa cinza translúcida e o branco de fora */
const VAO = linha([{ a: 54, b: 47, r: 9 }, { a: 54, b: 47, r: 9 }]);
const CINZA = linha([{ a: 65, b: 55, r: 14 }, { a: 92.5, b: 55, r: 40 }]);
const BEIRA = linha([{ a: 95, b: 86.5, r: 42 }, { a: 122, b: 86.5, r: 78 }]);
/* os pórticos de treliça por cima do telhado */
const PORTICO = (u, v, giro) => ({ u, v, w: 44, d: 20, h: 9, y: 39.5, cor: '#eceded', giro, cobertura: true });

export default {
  id: 'estadio-allianz-parque', alambrado: false, muro: false, nome: 'Allianz Parque', clubes: ['palmeiras'], norte: 336.6, vazado: 0.3, folga: 22,
  chao: { cor: '#8b8a85' },
  campo: { corMargem: '#3f8f52' },
  corMureta: '#e9ebe8',
  aneis: [
    /* O LANCE DE BAIXO, com as bocas no meio do lance */
    { dentro: I[0], fora: L[0], reto: true, h: [1.2, 9.5], fileiras: 22,
      trechos: metades(I, L, { cor: V1, cor2: V2, padrao: 'blocos', bloco: 13, blocoFileiras: 7, corredor: 13, vomitorios: { f: 0.42, cada: 2 } }) },
    /* O ANEL DE CIRCULAÇÃO atrás do lance de baixo */
    { dentro: L[0], fora: C[0], reto: true, h: [9.6, 9.6], fileiras: 2, corredorFrente: 0,
      trechos: metades(L, C, { tipo: 'passagem', alt: 9.6, cor: '#b9b7ad' }) },
    /* OS CAMAROTES: a faixa de vidro com poucas fileiras */
    { dentro: C[0], fora: K[0], reto: true, h: [11, 13.2], fileiras: 4, corredorFrente: 1.2, vomitorios: false, corMureta: '#2a4fa3',
      trechos: metades(C, K, { cor: '#24423a', cor2: '#2f5a4c', padrao: 'mosaico', mistura: 0.3, corredor: 13 }) },
    /* O LANCE DE CIMA, com as bocas a um quarto da altura */
    { dentro: K[0], fora: F[0], reto: true, h: [16, 31], inclinacao: 0.62, fileiras: 20, corredorFrente: 2, corMureta: '#2a4fa3',
      trechos: metades(K, F, { cor: V3, cor2: V4, padrao: 'mosaico', mistura: 0.3, corredor: 13, parapeito: 2, vomitorios: { f: 0.25, cada: 2 } }) }
  ],
  telhados: [
    { y: 38, h: 0.8, cor: '#9fa3a1', pontos: CINZA, furo: VAO },
    { y: 38.4, h: 0.8, cor: '#eeeeea', pontos: BEIRA, furo: CINZA }
  ],
  fachada: { cor: '#a7acaa' },
  blocos: [
    PORTICO(48, 72, 108), PORTICO(110, 0, 0), PORTICO(53, -74, 62), PORTICO(-72, -63, 33), PORTICO(-78, 53, -31),
    /* o letreiro azul nas duas laterais do telhado e o escudo no fundo sul */
    { u: -2, v: 68, w: 58, d: 9, h: 0.3, y: 39.3, cor: '#eeeeea', texto: 'Allianz Parque', corTexto: '#3f74b8', textoLargura: 0.94, textoAltura: 0.6, giro: 180, cobertura: true },
    { u: 4, v: -73, w: 58, d: 9, h: 0.3, y: 39.3, cor: '#eeeeea', texto: 'Allianz Parque', corTexto: '#3f74b8', textoLargura: 0.94, textoAltura: 0.6, cobertura: true },
    /* os túneis grandes no meio dos dois fundos e os telões pendurados */
    { u: 68.5, v: 0, w: 5, d: 9, h: 3.2, cor: '#26302b' }, { u: -63.5, v: 0, w: 5, d: 9, h: 3.2, cor: '#26302b' },
    { u: 58, v: 0, w: 1.6, d: 22, h: 7, y: 28, cor: '#17181b' }, { u: -57, v: 0, w: 1.6, d: 22, h: 7, y: 28, cor: '#17181b' }
  ],
  entorno: [
    /* em cima (oeste): o prédio comprido do clube, as quadras e as árvores; no canto, a Rua Palestra Itália */
    { tipo: 'predio', u: -30, v: 91, w: 84, d: 9, h: 10, cor: '#b9c2bd', cor2: '#3f8f6a' },
    { tipo: 'quadra', u: 14, v: 112, w: 36, d: 16, cor: '#3f8a52' }, { tipo: 'quadra', u: 108, v: 104, w: 52, d: 30, cor: '#b0664a' },
    { tipo: 'arvores', u: 50, v: 100, w: 30, d: 20, n: 12 }, { tipo: 'rua', de: [-140, 96], ate: [-80, 122], larg: 12 },
    /* à esquerda (sul): as piscinas e os prédios do clube */
    { tipo: 'piscina', u: -121, v: -10, w: 26, d: 26 }, { tipo: 'predio', u: -122, v: -64, w: 22, d: 44, h: 9, cor: '#c9cbc7' },
    { tipo: 'predio', u: -118, v: 52, w: 20, d: 24, h: 7, cor: '#d6d2c6' },
    /* embaixo (leste): a rua e as casas da Padre Antônio Tomás; no canto, o prédio grande */
    { tipo: 'rua', de: [-140, -100], ate: [100, -100], larg: 9 }, { tipo: 'casas', u: -10, v: -114, nu: 9, nv: 1, passo: 15 },
    { tipo: 'predio', u: 110, v: -96, w: 44, d: 34, h: 16, cor: '#d9d9d4', cor2: '#8f9498' },
    /* à direita (norte): as árvores e o gramado, do lado da Avenida Francisco Matarazzo */
    { tipo: 'arvores', u: 132, v: 52, w: 14, d: 50, n: 12 }, { tipo: 'grama', u: 132, v: -34, w: 16, d: 28, cor: '#5f9a55' },
    { tipo: 'rua', de: [146, 130], ate: [146, -130], larg: 16 }
  ],
  /* a Mancha Verde no meio do Gol Norte e a TUP ao lado dela; a visitante no lance de cima do canto sudeste (mapa do clube) */
  jogo: { mandante1: [270, 302], mandante2: [304, 326], mandante3: [86, 108], visitante: [209, 239], tunelMandante: 0, tunelVisitante: 217, folgaPM: 5,
          fracao: { mandante1: 0.22, mandante2: 0.22, mandante3: 0.22, visitante1: 0.78, visitante2: 0.86, visitante3: 0.7 },
          torcidas: { mancha_verde: 'mandante1', tup: 'mandante2' } }
};
