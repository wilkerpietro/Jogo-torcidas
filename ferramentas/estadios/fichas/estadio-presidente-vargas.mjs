/* PRESIDENTE VARGAS (o PV; Ferroviário e Floresta, Fortaleza) — pelas três
   fotos que o dono mandou (17/11/2026, quando a primeira prova já estava
   assada: a tribuna vista de frente, do gramado, uma aérea do lado oposto e a
   fachada da entrada, da rua),
   pelo satélite (o do Google, nítido) e por duas fotos do acervo livre da
   Wikimedia, de 2011. O rumo do campo, 163,5 graus, saiu do gramado no
   OpenStreetMap.
   No quadro a tribuna coberta fica EMBAIXO (é o lado oeste).
   Um ANEL SÓ, fechado, em retângulo de cantos redondos, colado no gramado (não
   tem pista), de CADEIRAS AZUIS com as escadas amarelas: 21,5 m de fundura,
   num LANCE SÓ. De longe parece ter dois andares, e eu fiz dois; o dono
   corrigiu, com a foto de perto de uma boca: o que corta o lance ao meio são
   os FERROS DE PROTEÇÃO brancos, e cada boca é uma caixa cor de areia com a
   escada em Y — uma desce pelo meio, duas sobem pelos lados. Por fora, o muro
   azul com a listra laranja.
   · EMBAIXO, no meio, a TRIBUNA: o telhado de aço, inclinado, com a frente no
     alto (e nela o letreiro O PV TAMBÉM É SEU. PRESERVE O ESTÁDIO.) e o fundo
     em cima de duas colunas redondas de concreto, com o arco branco por cima;
     debaixo dele, os dois andares de cabines envidraçadas no alto da
     arquibancada; ao pé, o túnel e os bancos; atrás, pra rua, a ENTRADA: a
     marquise branca com o letreiro ESTÁDIO PRESIDENTE VARGAS em cima, os
     pilares azuis, a faixa amarela, as grades cor de madeira, os muros azuis
     dos lados e a escadaria vermelha;
   · À DIREITA, no alto do fundo, o placar;
   · quatro torres de luz altas, de concreto, duas de cada lado.
   ESTIMADO: as alturas (o alto da arquibancada a 10,6 m, a frente do telhado a
   22); a posição das bocas e das escadas; as medidas da entrada (a foto é de
   perto e de lado); o desenho das listras do muro de fora. As letras da
   entrada são soltas, brancas, contra o céu: aqui ficaram numa placa azul. As cadeiras estão desbotadas (na aérea do dono são
   de um azul claro): pus um azul médio. O vidro da frente das arquibancadas,
   as bandeirinhas da beira e a rampa curva da entrada não entraram.
   AS TORCIDAS (escolha minha): a da casa atrás do gol da esquerda, com apoio
   na lateral de cima e na outra ponta dela; a visitante atrás do gol da
   direita, o do placar. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AZUL = '#3470c4', AZUL2 = '#4a86d6', AMARELO = '#dcae2f', BRANCO = '#efefea', AREIA = '#d8b45c', MURO = '#4f84cc';
/* os contornos: todos de canto redondo com o mesmo centro (54, 38) */
const C = d => ({ a: 60 + d, b: 44 + d, r: 6 + d });
const CADEIRA = mais => ({ cor: AZUL, cor2: AZUL2, padrao: 'mosaico', mistura: 0.4, corEscada: AMARELO, corredor: 12, vomitorios: false, paredeAtras: false, ...mais });
/* A VOLTA de um anel de beira `d`: as quatro retas (a de baixo em três pedaços, com a tribuna no meio) e os quatro cantos */
const VOLTA = (d, reta, mais = {}) => { const a = 60 + d, b = 44 + d, canto = { ...reta, corredor: 0, vomitorios: false, grade: reta.grade && { ...reta.grade, f: 0.5 } };
  return [
    { de: A(a, -38) - 360, ate: A(a, 38), ...reta }, { de: A(a, 38), ate: A(54, b), ...canto },
    { de: A(54, b), ate: A(-54, b), ...reta }, { de: A(-54, b), ate: A(-a, 38), ...canto },
    { de: A(-a, 38), ate: A(-a, -38), ...reta }, { de: A(-a, -38), ate: A(-54, -b), ...canto },
    { de: A(-54, -b), ate: A(-19, -b), ...reta }, { de: A(-19, -b), ate: A(16, -b), ...reta, ...mais }, { de: A(16, -b), ate: A(54, -b), ...reta },
    { de: A(54, -b), ate: A(a, -38), ...canto }
  ]; };

export default {
  id: 'estadio-presidente-vargas', nome: 'Presidente Vargas', clubes: ['ferroviario', 'floresta'], norte: 163.5, vazado: 0.3, folga: 24,
  chao: { cor: '#b89a8a' },
  campo: { corMargem: '#4f9a55' },
  corMureta: '#b9bcbe', alambrado: false,
  aneis: [
    /* a grama em volta do campo, até o muro baixo */
    { dentro: { a: 55.5, b: 37, r: 0.5 }, fora: C(0), reto: true, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    /* A VOLTA, num LANCE SÓ (dono, 17/11/2026, com a foto de perto de uma boca: "A imagem dá impressão de dois andares mas não
       é: o estádio tem ferros de proteção no meio da arquibancada e o vomitório tem escadas que acessam a parte de cima e de
       baixo em Y"). Na primeira versão eu tinha feito duas metades com um corredor no meio. As bocas abrem a um terço da
       altura, numa caixa cor de areia com um patamar de cada lado: a escada do meio desce, e do alto de cada patamar sobe
       outra; os ferros brancos correm na fileira do alto das caixas. No meio da lateral de baixo, o telhado da tribuna. */
    { dentro: C(0), fora: C(21.5), reto: true, h: [1.5, 10.6], fileiras: 23, corredorFrente: 1,
      trechos: VOLTA(0, CADEIRA({ corredor: 16, vomitorios: { f: 0.34, cada: 2, larg: 2.6, fundo: 3.4, emY: true, asa: 3.6, corParapeito: AREIA }, grade: { cor: '#f1f1ee' },
          paredeAtras: true, corFachada: MURO, corLado: AREIA, parapeito: 1.1 }),
        { cobertura: { h: 15.5, larg: 21, avanco: 11, cai: -6.5, cor: '#f1f1ed', cor2: '#e6e6e1', listras: true, corBaixo: '#8d9296', trelica: false, pilares: false, pelaColuna: true } }) },
    /* o MURO DE FORA em listras: três muros finos, um na frente do outro e cada um mais baixo — de cima pra baixo, a faixa
       azul, a listra laranja e o azul claro de baixo */
    /* (o muro da frente de cada um sobe 1 m acima dele e encosta no de trás do anterior: leva a cor do anterior e fica mais
       baixo que ele, senão as duas cores brigam na mesma parede e a listra sai falhada) */
    ...[[21.5, 11.6, MURO, MURO], [21.8, 9.7, '#e08a2c', MURO], [22.1, 8.6, '#86abd9', '#e08a2c']].map(([d, alto, cor, frente]) => ({ dentro: C(d), fora: C(d + 0.3), reto: true, h: [alto - 0.1, alto], fileiras: 1, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, cor, cor2: cor, padrao: 'mosaico', mistura: 0, semCadeiras: true, espelhoPintado: true, corredor: 0, vomitorios: false,
        paredeAtras: true, corFachada: cor, corLado: cor, parapeito: 0, corMureta: frente }] }))
  ],
  fachada: { cor: MURO },
  refletores: [[-35, 71, 44], [30, 71, 44], [-33, -69, 44], [31, -69, 44]],
  /* o arco branco por cima do telhado, de uma coluna redonda de concreto à outra */
  arcos: [{ de: [-17.5, -66], ate: [14.5, -66], pe: 17.4, topo: 24.5, base: 18.2, n: 10, esp: 0.5, cor: '#f3f3ef', pilar: { r: 1.2, cor: '#bdbcb5' } }],
  blocos: [
    /* a TRIBUNA: o prédio da entrada atrás da arquibancada e os dois andares de cabines envidraçadas no alto dela */
    { u: -1.5, v: -71, w: 36, d: 11, h: 11, cor: '#efefea' },
    /* a ENTRADA, pra rua: as grades cor de madeira, a faixa amarela, os oito pilares azuis, a marquise branca e o letreiro em cima */
    { u: -1.5, v: -76.6, w: 31, d: 0.3, h: 5.6, y: 1.2, cor: '#c88a4c' }, { u: -1.5, v: -76.7, w: 31, d: 0.35, h: 1, y: 6.8, cor: '#e7c63a' },
    ...Array.from({ length: 8 }, (_, i) => ({ u: -16.5 + i * 30 / 7, v: -77.2, w: 0.9, d: 0.9, h: 9.4, cor: '#2f62b0' })),
    { u: -1.5, v: -78.6, w: 39, d: 6.4, h: 0.6, y: 9.4, cor: '#f3f3ef' },
    { u: -1.5, v: -80.6, w: 0.3, d: 31, h: 1.7, y: 10, cor: '#3a6fc0', giro: -90, texto: 'ESTÁDIO PRESIDENTE VARGAS', corTexto: '#ffffff', textoFace: true, textoLargura: 0.94, textoAltura: 0.62 },
    /* os muros azuis dos dois lados dela e a escadaria vermelha, em dois degraus largos */
    { u: -27, v: -76, w: 15, d: 0.5, h: 6.4, cor: '#2f62b0' }, { u: 24, v: -76, w: 15, d: 0.5, h: 6.4, cor: '#2f62b0' },
    { u: -1.5, v: -80, w: 46, d: 6.4, h: 0.6, cor: '#b3342c' }, { u: -1.5, v: -78.6, w: 42, d: 3.4, h: 1.2, cor: '#b3342c' },
    { u: -1.5, v: -64.8, w: 30, d: 2.8, h: 5.8, y: 10.8, cor: '#e4e6e6' },
    ...[11.6, 14.4].map(y => ({ u: -1.5, v: -63.3, w: 29, d: 0.2, h: 1.7, y, cor: '#5b7184' })),
    /* o letreiro na testeira da frente do telhado */
    { u: -1.5, v: -44.4, w: 0.3, d: 36, h: 1.7, y: 20.4, cor: '#f1f1ed', giro: 90, texto: 'O PV TAMBÉM É SEU. PRESERVE O ESTÁDIO.', corTexto: '#1f3f7a', textoFace: true, textoLargura: 0.8, textoAltura: 0.55, cobertura: true },
    /* o túnel, no meio, e os dois bancos de reserva ao pé dela */
    { u: -1.5, v: -43.2, w: 6, d: 2, h: 1.7, cor: '#eeeeea' },
    { u: -15, v: -41.6, w: 10, d: 2.4, h: 2.1, cor: '#e3cf55' }, { u: 12, v: -41.6, w: 10, d: 2.4, h: 2.1, cor: '#e3cf55' },
    /* o placar, no alto do fundo da direita */
    { u: 82.6, v: 0, w: 1, d: 11, h: 4.6, y: 11, cor: '#15171b' }
  ],
  /* a câmera da aérea de referência: do alto, por trás do fundo da direita, com a tribuna à esquerda */
  vista: [185, 120, 20, 0, 0, 0],
  entorno: [
    { tipo: 'rua', de: [-170, -96], ate: [170, -84], larg: 12 }, { tipo: 'rua', de: [104, -170], ate: [96, 170], larg: 10 },
    { tipo: 'predio', u: -128, v: 10, w: 60, d: 70, h: 12, cor: '#d2d2cc' }, { tipo: 'predio', u: -60, v: 108, w: 70, d: 40, h: 12, cor: '#cfd2d4' },
    { tipo: 'estacionamento', u: 116, v: 18, w: 34, d: 60 }, { tipo: 'casas', u: 0, v: -116, nu: 12, nv: 1, passo: 15 },
    { tipo: 'casas', u: 130, v: -80, nu: 2, nv: 3, passo: 15 }
  ],
  jogo: { mandante1: [164, 196], mandante2: [76, 104], mandante3: [112, 134], visitante: [-16, 16], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { falange_coral: 'mandante1', jovem_do_floresta: 'mandante1' } }
};
