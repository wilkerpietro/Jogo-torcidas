/* ESTÁDIO CENTENÁRIO (Francisco Stédile — S.E.R. Caxias, Caxias do Sul) — pelo
   satélite e pelas fotos de referência (14/11/2026). Inaugurado em 1976. O
   campo é norte-sul; no quadro o NORTE fica à DIREITA e o OESTE em cima (igual
   ao Alfredo Jaconi, o vizinho). É uma FERRADURA baixa de degrau pintado em
   volta de um gramado oval (sem pista), fechada do lado oeste pela
   arquibancada coberta.
   · EM CIMA (oeste), o lado das SOCIAIS, reto e alto, de dois lances: o de
     baixo descoberto, em quatro blocos de cadeira (do sul pro norte: branco
     com a faixa grená, azul, grená, azul), com duas bocas de túnel; o de cima
     debaixo da cobertura marrom de telha, em sete blocos (azul nas pontas,
     marrom no meio). Atrás, o esqueleto de concreto e a rua.
   · A FERRADURA (curva sul à esquerda, lado leste embaixo, curva norte à
     direita): um lance só de degrau de cimento pintado, em gomos azuis e
     grenás alternados, com a risca branca da escada numa divisa e a boca do
     vomitório na outra. O lado leste é mais fundo e fica em cima do prédio
     que dá pra avenida, com as torres dos refletores na calçada.
   · A ponta noroeste da ferradura (grená, colada nas sociais) é a da
     visitante, que entra pelo portão 10, na Thomas Beltrão de Queiroz.
   · Atrás do gol do sul, no gramado, o escudo do clube (a engrenagem). Ao
     norte, o campo de treino. */
const AZ = '#2557b6', AZ2 = '#1f4ca3';                  /* o azul */
const GR = '#8d3142', GR2 = '#7e2a3a';                  /* o grená */
const BR = '#e8e8e3', BR2 = '#d6d6d0';                  /* o branco */
const MAR = '#6f5347', MAR2 = '#624a3f';                /* a cadeira marrom do lance de cima */
const TELHA = '#513a30';
/* a ferradura: o gramado oval, a beira de fora do leste (15 m de fundura) e a das curvas do lado oeste (mais rasa) */
const HS_D = { a: 87, b: 44, r: 36 }, HS_L = { a: 99.5, b: 59, r: 49 }, HS_O = { a: 99.5, b: 54, r: 45 };
/* as sociais: a frente reta de ponta a ponta, o fim do lance de baixo e o fim do lance de cima */
const SO_D = { a: 87, b: 44, r: 30 }, SO_1 = { a: 99.5, b: 60, r: 42 }, SO_2 = { a: 99.5, b: 74, r: 42 };
/* um gomo da ferradura: `ini` e `fim` dizem o que há em cada divisa ('E' a risca branca da escada, 'V' a boca do vomitório) */
const GOMO = (de, ate, cor, ini, fim, mais) => ({ de, ate, cor, cor2: cor === AZ ? AZ2 : GR2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corredor: 0,
  escadaNaBorda: ini === 'E', vomitorios: (ini === 'V' || fim === 'V') ? { f: 0.25, larg: 4.4, fundo: 3.6, em: [...(ini === 'V' ? [0] : []), ...(fim === 'V' ? [1] : [])] } : false, ...mais });
const O = { fora: HS_O };
const SOCIAL = { dentro: SO_D, fora: SO_1, h: [1.5, 10.5], padrao: 'mosaico', corredor: 0, escadaNaBorda: true, paredeAtras: true };

export default {
  id: 'estadio-centenario', nome: 'Centenário', clubes: ['caxias'], norte: 0, vazado: 0.4, folga: 26,
  corEscada: '#ecece8',
  chao: { cor: '#8b8a85' },
  campo: { corMargem: '#448f4b' },
  corMureta: '#e4e3dc',
  aneis: [
    /* O LANCE DE BAIXO: a ferradura e, em cima, o lance descoberto das sociais */
    { dentro: HS_D, fora: HS_L, reto: true, h: [2.2, 8.2], fileiras: 12,
      trechos: [
        /* a curva norte, do meio pro oeste: azul, grená e a ponta grená da visitante */
        GOMO(0, 16.2, AZ, 'E', '', O), GOMO(16.2, 25.5, GR, '', '', O), GOMO(25.5, 37.2, GR, 'E', '', O),
        /* as sociais, lance de baixo (do norte pro sul): azul, grená, azul, branco com a faixa grená */
        { de: 37.2, ate: 57.5, ...SOCIAL, cor: AZ, cor2: AZ2, mistura: 0.3, vomitorios: false },
        { de: 57.5, ate: 90, ...SOCIAL, cor: GR, cor2: BR, mistura: 0.22, vomitorios: { f: 0.3, larg: 4.4, fundo: 4, em: [0] } },
        { de: 90, ate: 122.5, ...SOCIAL, cor: AZ, cor2: BR, mistura: 0.22, vomitorios: { f: 0.3, larg: 4.4, fundo: 4, em: [1] } },
        { de: 122.5, ate: 141.8, ...SOCIAL, padrao: 'fracoes', fracoes: [[0.78, BR], [1, GR]], vomitorios: { f: 0.3, larg: 4.4, fundo: 4, em: [0] } },
        /* a curva sul: azul colado nas sociais, grená atrás do gol */
        GOMO(141.8, 165.6, AZ, '', 'V', O), GOMO(165.6, 180, GR, 'V', '', O),
        GOMO(180, 198.5, GR, 'E', 'V'), GOMO(198.5, 221.3, AZ, 'V', 'V'),
        /* o lado leste */
        GOMO(221.3, 240.7, GR, 'V', ''), GOMO(240.7, 272.2, AZ, 'E', 'V'), GOMO(272.2, 301.3, GR, 'V', ''), GOMO(301.3, 319.2, AZ, 'E', 'V'),
        /* a curva norte, do leste pro meio */
        GOMO(319.2, 343.4, GR, 'V', 'V'), GOMO(343.4, 360, AZ, 'V', '')
      ] },
    /* O LANCE DE CIMA DAS SOCIAIS, debaixo da cobertura: azul nas pontas, marrom no meio */
    { dentro: SO_1, fora: SO_2, reto: true, h: [13, 20.5], fileiras: 14, corredorFrente: 1.8,
      trechos: [
        { de: 46.7, ate: 68, cor: AZ, cor2: AZ2, padrao: 'mosaico', mistura: 0.3, corredor: 16.1, escadaNaBorda: true, vomitorios: false },
        { de: 68, ate: 112, cor: MAR, cor2: MAR2, padrao: 'mosaico', mistura: 0.35, corredor: 16.1, escadaNaBorda: true, vomitorios: { f: 0.3, larg: 4.2, fundo: 3.6, em: [0, 1] } },
        { de: 112, ate: 133.3, cor: AZ, cor2: AZ2, padrao: 'mosaico', mistura: 0.3, corredor: 16.1, escadaNaBorda: true, vomitorios: false }
      ] }
  ],
  fachada: { cor: '#dedcd3' },
  refletores: [[-37, -67, 30], [5, -68, 30], [40, -67, 30], [-62, 78, 30], [60, 78, 30]],
  blocos: [
    /* OESTE: a cobertura marrom de telha, a testeira e o esqueleto de concreto atrás do lance de cima */
    { u: -0.5, v: 68, w: 114, d: 26, h: 0.7, y: 25.5, cor: TELHA, cobertura: true },
    { u: -0.5, v: 55.2, w: 114, d: 0.5, h: 1.3, y: 24.4, cor: '#3d2c25', cobertura: true },
    { u: -0.5, v: 77.6, w: 114, d: 6.8, h: 25, cor: '#bdb8ab' },
    /* a mureta com as placas entre os dois lances e a faixa do clube na frente das sociais */
    { u: -0.5, v: 60.4, w: 113, d: 0.6, h: 2.2, y: 10.6, cor: '#e9e8e2' },
    { u: 0, v: 42.6, w: 14, d: 1.6, h: 1.6, cor: '#8d3142' }, { u: -25, v: 42.9, w: 22, d: 0.8, h: 1.2, cor: '#f1f1ec' }, { u: 25, v: 42.9, w: 22, d: 0.8, h: 1.2, cor: '#f1f1ec' },
    /* o escudo no gramado atrás do gol do sul (a engrenagem grená, o miolo branco e azul) */
    { u: -70, v: -1, w: 8, d: 8, h: 0.12, cor: '#8d3142' }, { u: -70, v: -1, w: 8, d: 8, h: 0.12, cor: '#8d3142', giro: 45 },
    { u: -70, v: -1, w: 5.4, d: 5.4, h: 0.2, cor: '#f0f0ec' }, { u: -70, v: -1, w: 3.2, d: 3.2, h: 0.28, cor: '#2557b6' },
    /* os bancos de reserva, do lado das sociais */
    { u: -12, v: 38.4, w: 8, d: 1.8, h: 1.8, cor: '#eeeeea' }, { u: 12, v: 38.4, w: 8, d: 1.8, h: 1.8, cor: '#eeeeea' },
    /* o telão no alto da curva sul, do lado das sociais */
    { u: -86.5, v: 41.5, w: 1, d: 8, h: 4.5, y: 9, cor: '#17181b', giro: -53 }
  ],
  entorno: [
    /* o oeste (em cima): a rua das sociais, o pátio da ponta sul e as casas da ponta norte */
    { tipo: 'rua', de: [-260, 91], ate: [260, 91], larg: 13 },
    { tipo: 'estacionamento', u: -95, v: 68, w: 66, d: 26, cheio: 0.15 },
    { tipo: 'arvores', u: -90, v: 84, w: 60, d: 5, n: 5 },
    { tipo: 'casas', u: 102, v: 70, nu: 4, nv: 2, passo: 13 }, { tipo: 'arvores', u: 118, v: 38, w: 30, d: 40, n: 26 },
    { tipo: 'casas', u: 0, v: 116, nu: 20, nv: 2, passo: 13 },
    /* o norte (à direita): o campo de treino */
    { tipo: 'grama', u: 160, v: -12, w: 106, d: 84, cor: '#4c9a4f' },
    /* o sul (à esquerda): o posto na esquina e a avenida que contorna a curva */
    { tipo: 'predio', u: -116, v: 24, w: 24, d: 44, h: 6, cor: '#cfcfc9', cor2: '#3b4756' },
    { tipo: 'rua', de: [-140, 150], ate: [-140, 40], larg: 12 }, { tipo: 'rua', de: [-140, 40], ate: [-112, -40], larg: 12 }, { tipo: 'rua', de: [-112, -40], ate: [-76, -74], larg: 12 },
    /* o leste (embaixo): a avenida encostada no estádio e o bairro */
    { tipo: 'rua', de: [-78, -74], ate: [260, -74], larg: 13 },
    { tipo: 'casas', u: 6, v: -98, nu: 19, nv: 2, passo: 12.5 }, { tipo: 'casas', u: -150, v: -60, nu: 3, nv: 6, passo: 13 }
  ],
  /* a Falange Grená atrás do gol do sul; a visitante na ponta noroeste da ferradura (portão 10); os outros bondes da casa
     no lado leste */
  jogo: { mandante1: [167, 196], mandante2: [250, 270], mandante3: [303, 317], visitante: [17.5, 36], tunelMandante: 198.5, tunelVisitante: 25.5, folgaPM: 5,
          torcidas: { falange_grena: 'mandante1' } }
};
