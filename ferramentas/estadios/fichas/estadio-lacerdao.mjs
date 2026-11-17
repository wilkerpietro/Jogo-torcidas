/* LACERDÃO (Estádio Luiz José de Lacerda, Central, Caruaru) — pelas quatro
   fotos que o dono mandou (17/11/2026: "vamos pro Lacerdão, do Central. Veja as
   4 fotos pra entender o formato do estádio"; duas aéreas e duas de dentro) e
   pelo satélite (o do Google). O rumo do campo, 66,3 graus, saiu do contorno do
   gramado no OpenStreetMap.
   A PRIMEIRA VERSÃO ESTAVA ERRADA EM DOIS LADOS, e o dono mandou as fotos de novo:
   "O Lacerdão tem uma arquibancada lateral maior que os outros lances de
   arquibancada. A outra arquibancada lateral tem sua parte superior em formato
   de triângulo. Observe bem os outros detalhes". Eu tinha lido a arquibancada
   grande como TELHADO (ela é escura e vista de cima) e o fundo da de trás do gol
   como um prédio de camarotes. As aéreas foram tiradas de um prédio do outro
   lado da avenida, por cima do FUNDO da arquibancada de trás do gol.
   No quadro a arquibancada grande fica EMBAIXO, a tribuna coberta EM CIMA e a
   avenida à DIREITA.
   · EMBAIXO, a LATERAL MAIOR, de 112 m por 26 de fundura, descoberta: degrau
     preto com o TRIÂNGULO BRANCO no meio (a base no alto, a ponta embaixo) e os
     escudos brancos; a caixa branca das cabines no alto, a barra alaranjada na
     frente, e a faixa de areia com os bancos de reserva ao pé dela;
   · EM CIMA, a outra lateral: o lance de baixo, preto, com os escudos brancos,
     de ponta a ponta, com a escadaria branca no meio; e por cima dele, em 78 m,
     a TRIBUNA COBERTA, que é TRIANGULAR: a fileira de baixo tem a largura toda
     e as de cima vão fechando, com as paredes brancas em diagonal dos dois
     lados; cadeiras em xadrez branco e preto nos lados e pretas no meio; o
     telhado retangular e chato nos pilares, com o letreiro CENTRAL CAMPEÃO
     BRASILEIRO SÉRIE B 1986 na testeira, e a faixa da torcida na mureta;
   · À DIREITA, atrás do gol, do lado da avenida, a de degrau preto com as
     faixas brancas inclinadas; por trás, o muro branco com a fila de vãos;
   · À ESQUERDA, atrás do outro gol, a mais rasa, preta, debaixo de um telhado
     escuro de beira branca.
   ESTIMADO: as alturas; o desenho exato do triângulo e dos escudos (simplifiquei
   os escudos em anéis brancos); as faixas da de trás do gol (as fotos mostram de
   lado); os blocos de cor das cadeiras da tribuna; a da esquerda (só aparece de
   longe); as torres de luz.
   AS TORCIDAS (escolha minha): a Comando Alvinegro no lance de baixo da tribuna,
   onde está a torcida na foto do dono; a visitante atrás do gol da esquerda. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const PRETO = '#26272a', PRETO2 = '#303135', BRANCO = '#ecece8', BRANCO2 = '#dcdcd7';
/* a beira da grama (em cima, à esquerda e à direita), a beira da areia (embaixo) e os fundos */
const I = { a: 59.5, b: 41.5, r: 0.5 }, AREIA = { a: 59.5, b: 49.5, r: 0.5 };
const LAT = b => ({ a: 59.5, b, r: 0.5 }), FUN = a => ({ a, b: 41.5, r: 0.5 });
/* o degrau preto pintado */
const NEGRO = { cor: PRETO, cor2: PRETO2, padrao: 'mosaico', mistura: 0.2, semCadeiras: true, espelhoPintado: true, corEscada: BRANCO, corredor: 0, vomitorios: false,
  paredeAtras: true, corFachada: BRANCO, corLado: BRANCO, parapeito: 1.6 };
const cor = (branco, rnd) => { const s = rnd() < 0.1; return branco ? (s ? BRANCO2 : BRANCO) : (s ? PRETO2 : PRETO); };
/* um escudo simplificado: o anel branco com o miolo, de raio `r` metros, num lance de `L` × `F` metros */
const escudo = (x, y, cx, cy, r, L, F) => { const d = Math.hypot((x - cx) * L, (y - cy) * F); return (d < r && d > r * 0.62) || d < r * 0.3; };
/* A LATERAL MAIOR (112 × 26 m; `x` da esquerda pra direita de quem olha do campo, isto é, do lado da avenida pro outro; `y` de
   baixo pra cima): o triângulo branco de base no alto e ponta embaixo, e três escudos nas partes pretas */
const GRANDE = (x, y, rnd) => cor((y > 0.03 && x > 0.7 - 0.3 * y && x < 0.7 + 0.1 * y) || [[0.14, 0.5], [0.3, 0.26], [0.9, 0.55]].some(([cx, cy]) => escudo(x, y, cx, cy, 3, 112, 26)), rnd);
/* o lance de baixo da outra lateral (113 × 6,5 m): preto, com os escudos em fila */
/* (e a escadaria branca do meio, que sobe pra tribuna) */
const BAIXO = (x, y, rnd) => cor(Math.abs(x - 0.655) < 0.07 || [0.07, 0.19, 0.31, 0.43, 0.87, 0.95].some(cx => escudo(x, y, cx, 0.5, 2.2, 113, 6.5)), rnd);
/* a de trás do gol da avenida (78 × 16,5 m): preta, com seis faixas brancas inclinadas, três pra cada lado */
const FAIXAS = (x, y, rnd) => cor([0.1, 0.24, 0.38].some(c => Math.abs(x - (c + 0.07 * y)) < 0.022 || Math.abs(x - (1 - c - 0.07 * y)) < 0.022), rnd);
/* A TRIBUNA COBERTA É TRIANGULAR (dono, 17/11/2026, com a foto de frente: "A arquibancada coberta é [...] Triangular"): a
   fileira de baixo tem os 78 m e as de cima vão fechando até a metade, com as paredes brancas subindo em diagonal dos dois
   lados. As cadeiras: xadrez branco e preto nos dois lados, pretas no meio, com as duas escadas claras (`x` de um lado ao
   outro do trapézio, `y` de baixo pra cima). O telhado, que é retangular, vai nos `blocos`. */
const TRIB0 = -20, TRIB1 = 58, TRIBM = (TRIB0 + TRIB1) / 2, FECHA = 0.5;
const CADEIRAS = (x, y, rnd) => { if ([0.36, 0.64].some(c => Math.abs(x - c) < 0.012)) return '#c9b98a';
  if (x > 0.36 && x < 0.64) return rnd() < 0.12 ? PRETO2 : PRETO; return rnd() < 0.5 ? BRANCO : PRETO; };

export default {
  id: 'estadio-lacerdao', nome: 'Lacerdão', clubes: ['central'], norte: 66.3, vazado: 0.3, folga: 22,
  chao: { cor: '#8d8a83' },
  campo: { corMargem: '#4f9a55' },
  corMureta: BRANCO, corAlambrado: '#3a3b3d',
  aneis: [
    /* a grama em volta do campo */
    { dentro: { a: 54.5, b: 36, r: 0.5 }, fora: I, reto: true, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    /* a faixa de areia entre o campo e a lateral maior */
    { dentro: I, fora: AREIA, reto: true, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [
        { de: 0, ate: A(-59.5, -41.5), tipo: 'vazio' },
        { de: A(-59.5, -41.5), ate: A(59.5, -41.5), tipo: 'passagem', cor: '#cdbf9e' },
        { de: A(59.5, -41.5), ate: 360, tipo: 'vazio' }] },
    /* as duas de trás do gol e o lance de baixo da lateral da tribuna */
    { dentro: I, fora: LAT(48), reto: true, h: [1, 3.8], fileiras: 7, corredorFrente: 1.2,
      trechos: [
        /* À DIREITA, atrás do gol, do lado da avenida: as faixas brancas inclinadas */
        { de: A(59.5, -39) - 360, ate: A(59.5, 39), fora: FUN(76), h: [1.2, 8.8], fileiras: 18, ...NEGRO, pinta: FAIXAS, parapeito: 2.4 },
        { de: A(59.5, 39), ate: A(58, 41.5), tipo: 'vazio' },
        /* EM CIMA: o lance de baixo, preto, com os escudos */
        { de: A(58, 41.5), ate: A(-55, 41.5), ...NEGRO, pinta: BAIXO, parapeito: 1.2 },
        { de: A(-55, 41.5), ate: A(-59.5, 38), tipo: 'vazio' },
        /* À ESQUERDA, atrás do outro gol: a mais rasa, debaixo do telhado escuro de beira branca */
        { de: A(-59.5, 38), ate: A(-59.5, -38), fora: FUN(67.5), h: [1, 5], fileiras: 9, ...NEGRO, corredor: 14,
          cobertura: { h: 9, larg: 8.6, avanco: 0.6, cai: 0.4, cor: '#3d3e41', cor2: '#343538', listras: true, corFrente: BRANCO, altFrente: 0.9, trelica: false, corPilar: BRANCO, pelaColuna: true } },
        { de: A(-59.5, -38), ate: 360, tipo: 'vazio' }
      ] },
    /* a TRIBUNA COBERTA, por cima do lance de baixo: triangular (fecha pra trás), de paredes brancas em diagonal */
    { dentro: LAT(48), fora: LAT(58.6), reto: true, h: [6, 11.4], fileiras: 11, corredorFrente: 1.2, corMureta: BRANCO,
      trechos: [
        { de: 0, ate: A(TRIB1, 48), tipo: 'vazio' },
        { de: A(TRIB1, 48), ate: A(TRIB0, 48), fecha: FECHA, cor: PRETO, cor2: BRANCO, padrao: 'mosaico', mistura: 0.5, pinta: CADEIRAS, corredor: 0, vomitorios: false,
          paredeAtras: true, corFachada: BRANCO, corLado: BRANCO, parapeito: 2 },
        { de: A(TRIB0, 48), ate: 360, tipo: 'vazio' }] },
    /* a LATERAL MAIOR, embaixo: um lance só, descoberto, de 26 m de fundura */
    { dentro: AREIA, fora: LAT(75.6), reto: true, h: [1.8, 14.8], fileiras: 29, corredorFrente: 1.2, corMureta: '#a5673f',
      trechos: [
        { de: 0, ate: A(-50, -49.5), tipo: 'vazio' },
        { de: A(-50, -49.5), ate: A(58, -49.5), ...NEGRO, pinta: GRANDE, parapeito: 1.2 },
        { de: A(58, -49.5), ate: 360, tipo: 'vazio' }] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[61, 52, 32], [-62, 52, 30], [-58, -80, 32], [64, -80, 32]],
  blocos: [
    /* a caixa branca das cabines, no alto da lateral maior, por cima da base do triângulo */
    { u: 6, v: -77, w: 24, d: 3.4, h: 3.2, y: 14.8, cor: BRANCO }, { u: 6, v: -75.2, w: 22.6, d: 0.2, h: 1.3, y: 16, cor: '#27303c' },
    /* os bancos de reserva, na areia */
    { u: -14, v: -46.6, w: 8, d: 2.2, h: 2.1, cor: '#3a3d42' }, { u: 14, v: -46.6, w: 8, d: 2.2, h: 2.1, cor: '#3a3d42' },
    /* os pilares da frente do telhado da tribuna e a faixa da torcida na mureta dela */
    ...Array.from({ length: 9 }, (_, i) => ({ u: TRIB0 + 0.4 + (TRIB1 - TRIB0 - 0.8) / 8 * i, v: 48.4, w: 0.5, d: 0.5, h: 16, cor: '#d9d9d4' })),
    ...Array.from({ length: 9 }, (_, i) => ({ u: TRIB0 + 0.4 + (TRIB1 - TRIB0 - 0.8) / 8 * i, v: 58.4, w: 0.5, d: 0.5, h: 16, cor: '#d9d9d4' })),
    { u: TRIBM, v: 47.9, w: 0.3, d: 56, h: 1.1, y: 4.8, cor: BRANCO, texto: 'DESDE 2000  ·  COM O CENTRAL ONDE ELE ESTIVER', corTexto: PRETO, textoFace: true, giro: -90, textoLargura: 0.94, textoAltura: 0.55 },
    /* o telhado da tribuna, retangular e chato, com a testeira do letreiro na frente */
    { u: TRIBM, v: 53.2, w: TRIB1 - TRIB0 + 1.6, d: 12.4, h: 0.5, y: 16, cor: '#4a4b4e', cobertura: true },
    { u: TRIBM, v: 46.9, w: 0.3, d: TRIB1 - TRIB0 + 1.6, h: 1.5, y: 15, cor: '#d4d4cf', texto: 'CENTRAL CAMPEÃO BRASILEIRO SÉRIE B 1986', corTexto: PRETO, textoFace: true, giro: -90, textoLargura: 0.9, textoAltura: 0.55, cobertura: true },
    /* as paredes brancas dos dois lados: os cantos que o triângulo deixa, na altura do pé da tribuna */
    { u: TRIB0 + 5.2, v: 53.4, w: 10.4, d: 10.2, h: 6, cor: BRANCO }, { u: TRIB1 - 5.2, v: 53.4, w: 10.4, d: 10.2, h: 6, cor: BRANCO },
    /* o fundo da de trás do gol, pra avenida: a fila de vãos escuros no alto e as placas embaixo */
    { u: 76.25, v: 0, w: 0.3, d: 76, h: 1.6, y: 7.4, cor: '#3a3d42' },
    ...Array.from({ length: 16 }, (_, i) => ({ u: 76.3, v: -37.5 + 5 * i, w: 0.5, d: 0.5, h: 11.2, cor: BRANCO })),
    ...['#d9d9d4', '#c9c0a8', '#e9e9e4', '#b9b6ad', '#d9d9d4', '#c9c0a8', '#e9e9e4', '#b9b6ad'].map((c, i) => ({ u: 76.4, v: -33 + 9.4 * i, w: 0.25, d: 8, h: 2.6, y: 3.6, cor: c }))
  ],
  /* a câmera das aéreas do dono: do alto do prédio da avenida, com a lateral maior à esquerda */
  vista: [132, 54, 10, 0, 0, -8],
  entorno: [
    { tipo: 'rua', de: [94, -170], ate: [94, 170], larg: 18 }, { tipo: 'rua', de: [-170, -92], ate: [170, -92], larg: 10 },
    { tipo: 'rua', de: [-170, 62], ate: [60, 102], larg: 9 }, { tipo: 'casas', u: -40, v: 76, nu: 6, nv: 1, passo: 14 },
    { tipo: 'predio', u: -86, v: -30, w: 24, d: 50, h: 9, cor: '#b9b6ad' }, { tipo: 'predio', u: -90, v: 30, w: 26, d: 40, h: 8, cor: '#c9c3b2' },
    { tipo: 'predio', u: 70, v: 80, w: 26, d: 30, h: 12, cor: '#d9d9d3' }, { tipo: 'predio', u: -10, v: -114, w: 60, d: 26, h: 10, cor: '#d4d7d9' },
    { tipo: 'predio', u: 128, v: 30, w: 30, d: 60, h: 48, cor: '#cfd0c8' }, { tipo: 'predio', u: 124, v: -40, w: 26, d: 50, h: 18, cor: '#a9c0c0' }
  ],
  jogo: { mandante1: [72, 102], mandante2: [255, 285], mandante3: [-18, 18], visitante: [164, 196], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.2, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { comando_alvinegro: 'mandante1' } }
};
