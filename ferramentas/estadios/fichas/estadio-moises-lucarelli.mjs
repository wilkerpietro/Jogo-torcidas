/* MOISÉS LUCARELLI (o Majestoso — Ponte Preta, Campinas) — pelo satélite e
   pelas fotos de referência (15/11/2026); o meio do campo foi tirado do
   círculo central. O campo corre de nordeste a sudoeste; no quadro o
   NOROESTE (a coberta) fica em cima e o NORDESTE (a entrada das torres) à
   direita.
   Bacia oval branca, larga: entre o gramado e a arquibancada sobra uma
   faixa de asfalto, estreita nas laterais e larga nos dois fundos (os
   carros param ali dentro).
   · EM CIMA (noroeste), a COBERTA: o lance mais fundo, com a frente
     descoberta e o telhado escuro por cima do resto; no canto norte o
     telhado claro que acompanha a curva.
   · À DIREITA (nordeste), o prédio da ENTRADA: a arquibancada passa por
     cima dele, entre as duas torres brancas, com o placar no meio.
   · EMBAIXO (sudeste), a arquibancada descoberta, de degrau pintado de
     branco com as escadas amarelas, que faz a volta nos dois cantos, com
     o PONTE PRETA escrito de ponta a ponta (dono, 15/11/2026).
   · À ESQUERDA (sudoeste), atrás do gol, a arquibancada tem MENOS degraus
     (dono, 15/11/2026, com três fotos): só a parte de cima, junto ao muro
     de fora, com o pátio de asfalto e o muro branco em arco na frente. Eu
     tinha deixado esse fundo sem arquibancada.
   OS SETORES (mapa de setores): a coberta é o Setor Vitalícia (com os
   camarotes atrás); o canto norte, ao lado dela, é o SETOR JOVEM; a
   arquibancada do sudeste e o fundo da entrada são o Setor Família; o
   canto oeste é a Imprensa e a VISITANTE.
   OS ACESSOS: o satélite e as fotos não mostram boca de vomitório; as
   escadas amarelas descem do alto até a faixa de asfalto. Ficou sem boca. */
const CIM = '#d0d0ca', CIM2 = '#c3c3bd', AM = '#d8c04a';                 /* o degrau pintado de branco */
/* o gramado oval; a beira da faixa de asfalto; a frente e o fundo da arquibancada; o fundo da coberta */
const GRAMA = { a: 78, b: 37, r: 37 }, I = { a: 85, b: 49, r: 49 }, P = { a: 101, b: 52, r: 52 };
const F = { a: 117.5, b: 68, r: 68 }, F_COB = { a: 117.5, b: 74, r: 74 };
/* a frente da arquibancada RASA de trás do gol do sudoeste (menos degraus: só a parte de cima, junto ao muro de fora) */
const RASA = { a: 108, b: 58.5, r: 58.5 };
const RAD = Math.PI / 180;
/* A FACHADA DA ENTRADA (a foto do dono): o prédio branco em curva, de janelas escuras em três fileiras, as duas torres e, na
   frente, o calçadão de listras pretas e brancas em leque. Tudo gira em volta do centro da curva do fundo nordeste. */
const NA_CURVA = (fi, raio, cu = 49.5) => [cu + raio * Math.cos(fi * RAD), raio * Math.sin(fi * RAD)];
const JANELA = (fi, y, h, raio = 68.2, cu = 49.5) => { const [u, v] = NA_CURVA(fi, raio, cu); return { u, v, w: 0.35, d: 2.5, h, y, cor: '#2b2d31', giro: fi }; };
const FILEIRAS = fi => [JANELA(fi, 1.2, 2.2), JANELA(fi, 5, 1.5), JANELA(fi, 8.2, 1.4)];
const JANELAS = [
  ...Array.from({ length: 19 }, (_, i) => FILEIRAS(-17 - i * 3.6)).flat(),                       /* do lado do sudeste */
  ...Array.from({ length: 7 }, (_, i) => FILEIRAS(17 + i * 3.6)).flat(),                         /* do lado da coberta, até o canto */
  ...Array.from({ length: 10 }, (_, i) => { const fi = 44 + i * 3.4; return [JANELA(fi, 1.2, 2.2, 74.2, 43.5), JANELA(fi, 5, 1.5, 74.2, 43.5), JANELA(fi, 8.2, 1.4, 74.2, 43.5)]; }).flat()
];
const TORRE = (fi, faixas) => { const [u, v] = NA_CURVA(fi, 71);
  return [{ u, v, w: 7, d: 7, h: 23, cor: '#f1f1ed', giro: fi }, { u, v, w: 5, d: 5, h: 1.2, y: 23, cor: '#3a3c40', giro: fi },
    ...faixas.map(([t, larg]) => { const [a, b] = NA_CURVA(fi, 74.6); return { u: a - t * Math.sin(fi * RAD), v: b + t * Math.cos(fi * RAD), w: 0.3, d: larg, h: 13, y: 6.5, cor: '#1d1e21', giro: fi }; })]; };
const LISTRAS = Array.from({ length: 50 }, (_, i) => { const fi = -56 + i * 2.28, [u, v] = NA_CURVA(fi, 80.5);
  return { tipo: 'grama', u, v, w: 13, d: 3.25, cor: i % 2 ? '#eeeeea' : '#1d1e21', giro: fi }; });
const DEGRAU = (de, ate, mais) => ({ de, ate, cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 15, corEscada: AM, vomitorios: false, ...mais });

export default {
  id: 'estadio-moises-lucarelli', nome: 'Moisés Lucarelli', clubes: ['ponte-preta'], norte: 43.8, vazado: 0.42, folga: 20,
  corEscada: AM,
  /* a vista de perto da entrada, pra conferir a fachada */
  vista: [205, 34, -34, 112, 9, 0],
  chao: { cor: '#77746e' },
  campo: { corMargem: '#55934f', pista: { dentro: GRAMA, fora: I, cor: '#7c776e', raias: 0 } },
  corMureta: '#e9e9e4',
  aneis: [
    /* A FAIXA DE ASFALTO entre o gramado e a arquibancada: estreita nas laterais, larga nos fundos */
    { dentro: I, fora: P, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#7c776e' }] },
    /* A ARQUIBANCADA */
    { dentro: P, fora: F, h: [1.5, 9.5], fileiras: 18,
      trechos: [
        /* o fundo nordeste, por cima do prédio da entrada */
        DEGRAU(-25, 25, { h: [4, 11], corFachada: '#f1f1ed', parapeito: 2 }),
        /* o canto norte, debaixo do telhado claro, e a coberta */
        /* (o canto norte é o SETOR JOVEM: cadeira azul-marinho, com o telhado claro por cima do fundo) */
        { de: 25, ate: 55, fora: F_COB, h: [1.5, 12], cor: '#2a2f45', cor2: '#22263a', padrao: 'mosaico', mistura: 0.35, corredor: 13, corEscada: AM, vomitorios: false },
        /* (a coberta é o SETOR VITALÍCIA: cadeira clara na frente, azul-marinho atrás, e os camarotes debaixo do telhado) */
        { de: 55, ate: 121, fora: F_COB, h: [1.5, 12], cor: '#e2e2dd', padrao: 'fracoes', fracoes: [[0.3, '#e2e2dd'], [1, '#2a2f45']], corredor: 13, corEscada: AM, vomitorios: false },
        /* o canto oeste: o degrau descoberto (a IMPRENSA e, da escada 142 em diante, a VISITANTE) */
        DEGRAU(121, 142), DEGRAU(142, 170),
        /* o fundo sudoeste (dono, 15/11/2026): atrás do gol a arquibancada tem MENOS degraus: só a parte de cima, junto ao muro de
           fora (9,5 m), com o muro na frente e o pátio de asfalto embaixo; depois dela, a rampa até a arquibancada do sudeste */
        { de: 170, ate: 192, tipo: 'passagem', cor: '#7c776e', fora: RASA },
        DEGRAU(170, 192, { dentro: RASA, h: [4.9, 9.5], corredor: 14, corMureta: '#e9e9e4' }),
        { de: 192, ate: 206, tipo: 'passagem', cor: '#a9a69c' },
        /* a arquibancada do sudeste, que faz a volta nos dois cantos, com o PONTE PRETA escrito no degrau (dono, 15/11/2026); na
           ponta do canto leste, o painel preto da torcida */
        DEGRAU(206, 322, { passoFileira: 0.45, celula: 0.4, texto: 'PONTE PRETA', corTexto: '#34363b', textoLargura: 0.9, textoAltura: 0.7 }),
        DEGRAU(322, 335, { cor: '#2a2b2f', cor2: '#232428' })
      ] }
  ],
  /* o telhado claro do canto norte, acompanhando a curva */
  telhados: [{ y: 16, h: 0.5, cor: '#bdbcb6', pontos: [[42, 59], [60, 57], [75, 52], [85, 45], [96, 53], [83, 63], [64, 70], [42, 74]] }],
  fachada: { cor: '#f1f1ed' },
  refletores: [[46, 80, 30], [-42, 80, 30], [-34, -73, 30], [48, -73, 30]],
  blocos: [
    /* o telhado escuro da coberta */
    { u: 3, v: 68.5, w: 76, d: 13, h: 0.5, y: 16.5, cor: '#5c5348', cobertura: true },
    /* A ENTRADA: o corpo do meio com o letreiro em pé, a faixa escura da sacada e os portões; as duas torres (a da direita de
       quem chega com as listras pretas, a da esquerda com o painel escuro); em cima, a cabine branca, o placar e a placa laranja */
    { u: 119.4, v: 0, w: 3.6, d: 22, h: 13.5, cor: '#f1f1ed', texto: 'ESTÁDIO MOISÉS LUCARELLI|A. A. PONTE PRETA', corTexto: '#2b2d31', textoFace: true, textoLargura: 0.88, textoAltura: 0.15, textoMeio: 0.34 },
    { u: 121.3, v: 0, w: 0.3, d: 20, h: 1.7, y: 3.6, cor: '#8f9194' }, { u: 121.3, v: 0, w: 0.3, d: 12, h: 2.6, cor: '#2b2d31' },
    ...TORRE(12.5, [[-1.5, 0.7], [0, 0.7], [1.5, 0.7]]), ...TORRE(-12.5, [[0, 4]]),
    { u: 118, v: 0, w: 4.5, d: 6, h: 3.6, y: 13.5, cor: '#f1f1ed' }, { u: 119.6, v: -7.2, w: 0.6, d: 6.4, h: 3.2, y: 14, cor: '#17181b' },
    { u: 119.6, v: 7.2, w: 0.6, d: 6.4, h: 3.2, y: 14, cor: '#d8662e' },
    ...JANELAS,
    /* o muro branco em arco no pátio de trás do gol do sudoeste */
    { u: -91, v: 0, w: 1, d: 13, h: 1.4, cor: '#eeeeea' }, { u: -89.4, v: 12.6, w: 1, d: 12, h: 1.4, cor: '#eeeeea', giro: -14 }, { u: -89.4, v: -12.6, w: 1, d: 12, h: 1.4, cor: '#eeeeea', giro: 14 },
    /* os bancos de reserva, do lado da coberta */
    { u: -9, v: 42.5, w: 12, d: 3, h: 2, cor: '#d9d9d3' }, { u: 9, v: 42.5, w: 12, d: 3, h: 2, cor: '#d9d9d3' }
  ],
  entorno: [
    /* o calçadão de listras pretas e brancas em leque na frente da entrada */
    ...LISTRAS,
    /* a rua que contorna o estádio e o bairro de casas em volta */
    { tipo: 'rua', de: [-140, 84], ate: [140, 84], larg: 9 }, { tipo: 'rua', de: [-140, -76], ate: [140, -76], larg: 9 },
    { tipo: 'rua', de: [142, 84], ate: [142, -76], larg: 9 }, { tipo: 'rua', de: [-128, 84], ate: [-128, -76], larg: 9 },
    { tipo: 'casas', u: 0, v: 100, nu: 16, nv: 1, passo: 15 }, { tipo: 'casas', u: 10, v: -92, nu: 14, nv: 1, passo: 15 },
    { tipo: 'arvores', u: -112, v: -66, w: 20, d: 14, n: 6 }, { tipo: 'arvores', u: 0, v: -80, w: 24, d: 6, n: 5 }
  ],
  /* pelo mapa de setores: a Jovem Ponte no Setor Jovem (o canto norte, ao lado da coberta) e a VISITANTE no canto oeste; os
     outros bondes da casa na coberta (Vitalícia / Torolokos) e na arquibancada do sudeste (Setor Família) */
  jogo: { mandante1: [30, 52], mandante2: [75, 105], mandante3: [250, 290], visitante: [142, 168], tunelMandante: 41, tunelVisitante: 155, folgaPM: 5,
          fracao: { mandante1: 0.7, mandante2: 0.7, mandante3: 0.7, visitante1: 0.7, visitante2: 0.75, visitante3: 0.65 },
          torcidas: { jovem_ponte: 'mandante1' } }
};
