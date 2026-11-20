/* VILA BELMIRO (Estádio Urbano Caldeira — Santos) — REFEITA pelo mapa de
   setores do clube que o dono mandou (15/11/2026: "Preste mais atenção aos
   detalhes da Vila Belmiro pra ficar mais realista"), conferido setor por
   setor no satélite ampliado e numa aérea recente; o meio do campo foi
   tirado do círculo central. O campo corre de nordeste a sudoeste; no
   quadro a Rua PRINCESA ISABEL (noroeste) fica em cima, a curva da
   TIRADENTES (nordeste) à direita, a Rua DOM PEDRO (sudeste) embaixo e a
   Rua JOSÉ DE ALENCAR (sudoeste) à esquerda.
   · À DIREITA, a ARQUIBANCADA TIRADENTES (Cosmo Damião): a curva de degrau
     de cimento em cima do prédio, que faz a volta nos dois cantos; o braço
     do lado da Dom Pedro é mais comprido. O placar grande fica na frente
     dela, colado atrás do gol. O canto norte é pintado de preto.
   · EM CIMA, a PRINCESA ISABEL, da curva pro fundo: a CADEIRA CATIVA /
     ESPECIAL (cadeira azul-marinho: primeiro os quatro blocos descobertos,
     que descem até o campo; depois o lance debaixo da laje clara, com a
     faixa dos camarotes de baixo na frente), a CADEIRA SOCIAL (o bloco
     menor azul-marinho) e, na ponta do canto oeste, a ARQUIBANCADA PRINCESA
     ISABEL, o degrau de cimento das escadas amarelas: é o setor VISITANTE.
   · EMBAIXO, a DOM PEDRO: a CADEIRA TÉRREA branca na beira do campo; por
     cima dela o lance da CADEIRA SOCIAL (cadeira escura), que tapa a
     cadeira coberta e a cativa; no alto, a faixa do CAMAROTE SUPERIOR com o
     telhado estreito. Tudo isso faz a volta no canto sul.
   · À ESQUERDA, a JOSÉ DE ALENCAR: a GERAL SANTISTA, a faixa branca atrás
     do gol; por cima, a ARQUIBANCADA J. DE ALENCAR, o degrau pintado de
     preto com o FORÇA em branco, que tapa a cadeira coberta. NÃO tem
     telhado (eu tinha posto um). O fundo dela é em degraus, porque a rua
     de trás é enviesada: raso na ponta oeste, fundo na ponta sul.
   OS ACESSOS: as bocas que o satélite mostra são as quatro caixas amarelas
   na frente do lance de cima da Dom Pedro. Nos outros lances não aparece
   boca: desce-se pelas escadas.
   SEM LETREIRO nas cadeiras: o SFC e o SANTOS F.C. são de fotos de 2012 e
   2014 e não aparecem mais no satélite nem na aérea recente. */
const NAVY = '#262b3c', NAVY2 = '#1f2332';              /* a cadeira azul-marinho da Princesa Isabel */
const ESC = '#34363d', ESC2 = '#2b2d33';                /* a cadeira escura da Dom Pedro */
const BR = '#e7e7e2', BR2 = '#d9d9d3';                  /* a cadeira branca da térrea */
const CIM = '#74767b', CIM2 = '#696b70';                /* o degrau de cimento da curva */
const PRETO = '#202125', AM = '#d9c24a', CLARA = '#d6d2b4';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* OS CONTORNOS, lado por lado (cada lado tem a sua beira e a sua fundura) */
const CU_I = { a: 62.5, b: 38, r: 12 }, CU_F = { a: 73.5, b: 49, r: 23 };          /* a curva, metade norte */
const CL_I = { a: 62.5, b: 52, r: 12 }, CL_F = { a: 73.5, b: 61, r: 21.5 };        /* a curva, metade leste (o braço comprido) */
const N_I = { a: 58, b: 37.75, r: 4 };                                             /* a Princesa Isabel: a beira */
const N_F1 = { a: 71, b: 50.75, r: 17 }, N_F2 = { a: 78.25, b: 58, r: 24.25 }, N_F3 = { a: 73.55, b: 53.3, r: 19.55 };
const G_I = { a: 60.8, b: 40, r: 4 }, G_F = { a: 67.3, b: 46.5, r: 10.5 };         /* a Geral Santista */
const D_I = { a: 60.8, b: 36, r: 8 }, D_F = { a: 67.3, b: 42.5, r: 14.5 }, D_U = { a: 79.5, b: 54.7, r: 26.7 };   /* a Dom Pedro */
/* o fundo em degraus da arquibancada J. de Alencar (a rua de trás é enviesada) */
const JA = a => ({ a, b: a - 20.8, r: a - 56.8 });
const CAD = (de, ate, cor, cor2, mais) => ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: true, corEscada: CLARA, vomitorios: false, ...mais });
const DEG = (de, ate, cor, cor2, mais) => ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 0, escadaNaBorda: true, corEscada: CLARA, vomitorios: false, ...mais });
/* a curva: o degrau em cima do prédio, com a mureta alta na frente */
const CURVA = { h: [3, 8], paredeAtras: true, corFachada: '#f1f1ed', parapeito: 1.4 };
/* a Princesa Isabel: os blocos que descem até o campo e o lance por cima dos camarotes de baixo (a faixa clara na frente) */
const BLOCO = (u0, u1) => CAD(A(u0, 37.75), A(u1, 37.75), NAVY, NAVY2, { fora: N_F1, h: [1.2, 7.7] });
const ALTO = { corredorFrente: 5.75, h: [3.5, 8.2] };
/* as quatro bocas amarelas na frente do lance de cima da Dom Pedro (pelo u de cada uma) */
const BOCAS_DP = [-48.7, -15.3, 2.2, 36.3].map(u => (u + 52.8) / 96.2);

export default {
  id: 'estadio-vila-belmiro', nome: 'Vila Belmiro', clubes: ['santos'], norte: 27.8, vazado: 0.4, folga: 18,
  corEscada: CLARA,
  chao: { cor: '#77746e' },
  campo: { corMargem: '#4f9353' },
  corMureta: '#e9e9e4',
  aneis: [
    /* O LANCE DE BAIXO de cada lado */
    { dentro: N_I, fora: N_F1, reto: true, h: [1.2, 7.7], fileiras: 12,
      trechos: [
        /* a ARQUIBANCADA TIRADENTES: a curva (de leste a norte); as duas escadas claras e o canto norte pintado de preto */
        DEG(-46.5, A(62.5, -28.6) - 360, CIM, CIM2, { dentro: CL_I, fora: CL_F, ...CURVA }),
        DEG(A(62.5, -28.6) - 360, 0, CIM, CIM2, { dentro: CL_I, fora: CL_F, ...CURVA }),
        DEG(0, A(62.5, 14.5), CIM, CIM2, { dentro: CU_I, fora: CU_F, ...CURVA }),
        DEG(A(62.5, 14.5), 27, CIM, CIM2, { dentro: CU_I, fora: CU_F, ...CURVA }),
        DEG(27, 35, PRETO, '#2a2b30', { dentro: CU_I, fora: CU_F, ...CURVA }),
        /* a CADEIRA CATIVA / ESPECIAL: os quatro blocos descobertos, que descem até o campo */
        BLOCO(54, 46), BLOCO(46, 38), BLOCO(38, 30), BLOCO(30, 21.7),
        /* ... e o lance debaixo da laje, com a faixa dos camarotes de baixo na frente */
        CAD(A(21.7, 37.75), A(-21.7, 37.75), NAVY, NAVY2, { fora: N_F2, ...ALTO, h: [3.5, 10.8], corredor: 10.8, escadaNaBorda: false, paredeAtras: true, corFachada: '#e9e9e4' }),
        /* a CADEIRA SOCIAL (o bloco menor) */
        CAD(A(-21.7, 37.75), A(-39.6, 37.75), NAVY, NAVY2, { fora: N_F3, ...ALTO, corredor: 9, paredeAtras: true, corFachada: '#b9b9b4' }),
        /* a ARQUIBANCADA PRINCESA ISABEL (VISITANTE): o degrau de cimento com as escadas amarelas */
        DEG(A(-39.6, 37.75), A(-52, 37.75), '#b4b4ae', '#a8a8a2', { fora: N_F3, ...ALTO, corredor: 4.5, corEscada: AM, paredeAtras: true, corFachada: '#b9b9b4' }),
        /* o canto oeste: o piso de concreto ao pé do prédio */
        { de: A(-50, 40), ate: A(-60.8, 27), tipo: 'passagem', cor: '#c2bfb6', dentro: G_I, fora: { a: 70, b: 49, r: 13 } },
        /* a GERAL SANTISTA: a faixa branca atrás do gol */
        DEG(A(-60.8, 27), A(-60.8, -27), BR, BR2, { dentro: G_I, fora: G_F, h: [1, 2.6], escadaNaBorda: false }),
        /* a CADEIRA TÉRREA da Dom Pedro, que faz a volta no canto sul, e o piso do PMR na ponta */
        CAD(A(-60.8, -27), A(43.4, -36), BR, BR2, { dentro: D_I, fora: D_F, h: [1, 3.2], corredor: 12, escadaNaBorda: false, corEscada: '#c9c9c3' }),
        { de: A(43.4, -36), ate: A(50, -36), tipo: 'passagem', cor: '#c2bfb6', dentro: D_I, fora: D_F }
      ] },
    /* O LANCE DE CIMA da José de Alencar e o da Dom Pedro */
    { dentro: G_F, fora: D_U, reto: true, h: [5.5, 10.8], fileiras: 12, corredorFrente: 0, corMureta: '#e9e9e4',
      trechos: [
        /* a ARQUIBANCADA J. DE ALENCAR: o degrau preto, raso na ponta oeste e fundo na ponta sul, com o FORÇA em branco */
        DEG(A(-67.3, 32), A(-67.3, 16), PRETO, '#27282d', { fora: JA(72.5), inclinacao: 0.5, escadaNaBorda: false, paredeAtras: true, corFachada: '#e9e9e4' }),
        DEG(A(-67.3, 16), 180, PRETO, '#27282d', { fora: JA(75.5), inclinacao: 0.5, escadaNaBorda: false, paredeAtras: true, corFachada: '#e9e9e4' }),
        DEG(180, A(-67.3, -16), PRETO, PRETO, { fora: JA(79), inclinacao: 0.5, corEscada: AM, passoFileira: 0.45, celula: 0.4, texto: 'FORÇA', corTexto: '#f1f1ed', textoLargura: 0.8, textoAltura: 0.5,
          paredeAtras: true, corFachada: '#e9e9e4' }),
        DEG(A(-67.3, -16), A(-67.3, -28), PRETO, '#27282d', { fora: JA(82.5), inclinacao: 0.5, escadaNaBorda: false, paredeAtras: true, corFachada: '#e9e9e4' }),
        /* a CADEIRA SOCIAL DOM PEDRO (por cima da coberta e da cativa): o canto sul e a reta, com as quatro bocas amarelas na frente */
        CAD(A(-67.3, -28), A(-52.8, -42.5), ESC, ESC2, { dentro: D_F, corredorFrente: 1.6, escadaNaBorda: false }),
        CAD(A(-52.8, -42.5), A(43.4, -42.5), ESC, ESC2, { dentro: D_F, corredorFrente: 1.6, corredor: 12, escadaNaBorda: false, corEscada: '#c9c9c3',
          vomitorios: { f: 0.04, larg: 2.6, fundo: 3.4, em: BOCAS_DP } })
      ] }
  ],
  /* a laje clara por cima da cadeira cativa (a rua de trás é enviesada: a laje é mais funda na ponta sudoeste) */
  telhados: [{ y: 17.5, h: 0.5, cor: '#c9cac6', pontos: [[-21.7, 46.5], [21.7, 46.5], [21.7, 58.6], [-21.7, 71.5]] }],
  fachada: { cor: '#f1f1ed' },
  /* os refletores em cima do telhado do camarote superior e na beira da laje */
  refletores: [[-40, -56, 20, 16.4], [-12, -56, 20, 16.4], [14, -56, 20, 16.4], [38, -56, 20, 16.4], [-14, 47.5, 21, 18], [14, 47.5, 21, 18]],
  blocos: [
    /* o placar grande, colado atrás do gol, na frente da curva */
    { u: 57.6, v: -1, w: 1.6, d: 13, h: 8.5, y: 3.5, cor: '#1c1d20' },
    /* a Princesa Isabel: o prédio debaixo do fundo da laje, o prédio de trás dos blocos e os dois de trás da social e da visitante */
    { u: 0, v: 62.5, w: 43, d: 9, h: 16.5, cor: '#e3e3de' }, { u: 38, v: 55, w: 32, d: 7, h: 9, cor: '#d9d9d3' },
    { u: -38, v: 59, w: 32, d: 10, h: 11, cor: '#b9b9b4' }, { u: -38, v: 73, w: 31, d: 16, h: 9, cor: '#a8674a' },
    /* o prédio branco do canto oeste */
    { u: -63, v: 59, w: 12, d: 16, h: 12, cor: '#f1f1ed' },
    /* a Dom Pedro: a faixa do camarote superior e o telhado estreito por cima */
    { u: -4.7, v: -56.1, w: 96.2, d: 2.7, h: 5, y: 10.8, cor: '#e9e9e4' },
    { u: -4.7, v: -55.4, w: 97, d: 4.6, h: 0.4, y: 16, cor: '#eeeeea', cobertura: true },
    /* a torre antiga do placar, com o escudo, atrás da José de Alencar */
    { u: -86, v: -5, w: 3, d: 9, h: 19, cor: '#2a2c30' },
    /* os bancos de reserva, do lado da Princesa Isabel */
    { u: -9, v: 35.9, w: 10, d: 1.5, h: 1.8, cor: '#e9e9e4' }, { u: 9, v: 35.9, w: 10, d: 1.5, h: 1.8, cor: '#e9e9e4' }
  ],
  entorno: [
    /* as quatro ruas: a Tiradentes atrás da curva, a Dom Pedro, a José de Alencar (enviesada) e a Princesa Isabel (enviesada) */
    { tipo: 'rua', de: [84, 70], ate: [84, -84], larg: 10 }, { tipo: 'rua', de: [-110, -68], ate: [110, -68], larg: 10 },
    { tipo: 'rua', de: [-80, 60], ate: [-96, -68], larg: 10 }, { tipo: 'rua', de: [-70, 90], ate: [84, 62], larg: 9 },
    /* o bairro de casas em volta */
    { tipo: 'casas', u: 6, v: -86, nu: 11, nv: 1, passo: 15 }, { tipo: 'casas', u: 102, v: -6, nu: 1, nv: 9, passo: 15 },
    { tipo: 'casas', u: -114, v: -6, nu: 1, nv: 9, passo: 15 }, { tipo: 'casas', u: 48, v: 88, nu: 5, nv: 1, passo: 15 },
    { tipo: 'arvores', u: 94, v: 30, w: 8, d: 16, n: 4 }
  ],
  /* a Torcida Jovem e a Sangue Jovem na arquibancada J. de Alencar (a pintura do degrau e as fotos da faixa debaixo da torre do
     placar antigo); os outros bondes da casa na curva da Tiradentes. A VISITANTE na Arquibancada Princesa Isabel, a ponta do
     canto oeste (mapa do clube). */
  jogo: { mandante1: [-13, 7], mandante2: [45, 54], mandante3: [56, 82], visitante: [153, 159], tunelMandante: 180, tunelVisitante: 140, folgaPM: 4,
          fracao: { mandante1: 0.72, mandante2: 0.72, mandante3: 0.5, visitante1: 0.25, visitante2: 0.3, visitante3: 0.2 },
          torcidas: { torcida_jovem: 'mandante1', sangue_jovem: 'mandante2' } }
};
