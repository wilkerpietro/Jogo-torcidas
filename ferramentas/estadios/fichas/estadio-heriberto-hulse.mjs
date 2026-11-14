/* HERIBERTO HÜLSE (Criciúma Esporte Clube, Criciúma) — pelo satélite, pelas
   fotos de referência e pelo MAPA DE SETORES que o dono mandou (14/11/2026:
   "releia as imagens pra entender melhor o mapa do estádio"; "esse mapa é
   melhor"). O campo é nordeste-sudoeste; no quadro o fundo NORDESTE fica à
   DIREITA, o sudoeste à esquerda, o lado NOROESTE (as cadeiras) em cima e o
   sudeste embaixo — é o mapa do clube girado meia volta. Um anel fechado e
   todo coberto, de planta em OITAVADO, com o telhado de zinco claro. Os
   setores do mapa, na volta:
   · EM CIMA (noroeste), o lado das CADEIRAS, o mais fundo: E e F na ponta
     do sudoeste, o G na frente (descoberto, branco) com o SETOR CADEIRAS
     atrás (o mosaico preto e amarelo, debaixo do telhado) e o H na ponta do
     nordeste; os bancos de reserva na frente; em cima do telhado, a treliça
     dos refletores. Atrás, o prédio da fachada e a rua.
   · O CANTO NORTE (em cima, à direita), o setor I.
   · À DIREITA (nordeste), o fundo mais fundo, J K L M, com a metade da
     frente descoberta; atrás, a bilheteria.
   · O CANTO LESTE (embaixo, à direita), os setores N e O.
   · EMBAIXO (sudeste), P Q R S T, todo debaixo do pano mais claro do
     telhado, com as cabines de imprensa no alto e os postes dos refletores
     em cima do telhado.
   · O CANTO SUL (embaixo, à esquerda), o chanfro grande: o setor U, o da
     VISITANTE (portão 09).
   · À ESQUERDA (sudoeste), o fundo MENOR, A B C: poucos degraus, e logo
     acima do último a parede dos camarotes, com o telão no meio.
   · O CANTO OESTE (em cima, à esquerda), o setor D, também com os
     camarotes em cima. */
const AM = '#f0c61f', AM2 = '#e2b81a';                  /* o amarelo */
const BR = '#e6e6e1', BR2 = '#d5d5cf';                  /* o branco */
const PT = '#232325';                                   /* o preto */
const ZINCO = '#cbcdce', ZINCO2 = '#dbdcd9', PAREDE = '#d3d4d0';
/* a beira da frente de cada lado: o nordeste a 60 m do meio, o sudeste a 38, as cadeiras a 42 (os bancos ficam na
   frente) e o sudoeste a 65 */
const D = { a: 60, b: 38, r: 6 }, D_CAD = { a: 60, b: 42, r: 6 }, D_SO = { a: 65, b: 38, r: 6 };
/* os fundos: os cantos são concêntricos com a frente (cada lado e cada canto sai com a fundura certa, sem abrir em leque) */
const F_CAD = { a: 83.5, b: 65.5, r: 29.5 };            /* as cadeiras e o canto norte: 23,5 m */
const F_NE = { a: 83.5, b: 61.5, r: 29.5 };             /* o fundo nordeste: 23,5 m */
const F_LESTE = { a: 77.5, b: 55.5, r: 23.5 };          /* o canto leste: 17,5 m */
const F_SE = { a: 80, b: 55, r: 26 };                   /* o lado sudeste: 17 m */
const D_U = { a: 65, b: 38, r: 16 }, F_U = { a: 76, b: 49, r: 27 };   /* o setor U, no chanfro grande: 11 m */
const F_SO = { a: 75, b: 62, r: 30 };                   /* o fundo sudoeste: 10 m */
const D_OESTE = { a: 65, b: 42, r: 6 }, F_OESTE = { a: 75, b: 52, r: 16 };   /* o canto oeste: 10 m */
const BLOCO = cor => ({ cor, cor2: cor === AM ? AM2 : BR2, padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: true, corEscada: '#c9c7be', vomitorios: false, paredeAtras: true });
/* um lado em n blocos de cadeira, de cores alternadas (os ângulos saem da posição de cada divisa na beira da frente) */
const ang = (u, v) => Math.atan2(v, u) * 180 / Math.PI;
const LADO = (n, ponto, de, cores, mais) => Array.from({ length: n }, (_, i) => {
  let a0 = ang(...ponto(i / n)), a1 = ang(...ponto((i + 1) / n));
  while (a0 < de - 0.01) a0 += 360; while (a1 < a0) a1 += 360;
  return { de: +a0.toFixed(2), ate: +a1.toFixed(2), ...BLOCO(cores[i % 2]), ...mais };
});
/* o fundo sudoeste e o canto oeste: poucos degraus e a parede dos camarotes logo acima do último, até o telhado */
const CAMAROTES = { h: [1.5, 6.5], parapeito: 12.5, corFachada: PAREDE };

export default {
  id: 'estadio-heriberto-hulse', nome: 'Heriberto Hülse', clubes: ['criciuma'], norte: 49, vazado: 0.36, folga: 22,
  corEscada: '#c9c7be',
  chao: { cor: '#8d8981' },
  campo: { corMargem: '#3f8f4b' },
  corMureta: '#e4e3dc',
  aneis: [
    { dentro: D, fora: F_NE, reto: true, h: [1.5, 13.5], fileiras: 28,
      trechos: [
        /* o fundo nordeste (à direita): M L K J, de baixo pra cima */
        ...LADO(4, f => [60, -32 + 64 * f], -30, [AM, BR], { vomitorios: { f: 0.45, larg: 3.6, fundo: 3.4, em: [0.5] } }),
        /* o canto norte: o setor I */
        { de: 28.07, ate: 37.87, dentro: D_CAD, fora: F_CAD, ...BLOCO(AM), escadaNaBorda: false },
        /* as cadeiras (em cima), da ponta do nordeste pra do sudoeste: H, o G com o setor cadeiras atrás, F, E */
        { de: 37.87, ate: 50.52, dentro: D_CAD, fora: F_CAD, ...BLOCO(BR), faixaBase: { n: 13, cor: AM } },
        { de: 50.52, ate: 126.7, dentro: D_CAD, fora: F_CAD, cor: PT, cor2: AM, padrao: 'mosaico', mistura: 0.42, faixaBase: { n: 13, cor: BR }, corredor: 14, escadaNaBorda: true,
          vomitorios: { f: 0.47, cada: 2 }, paredeAtras: true },
        { de: 126.7, ate: 134.31, dentro: D_CAD, fora: F_CAD, ...BLOCO(BR) },
        { de: 134.31, ate: 142.13, dentro: D_CAD, fora: F_CAD, ...BLOCO(AM) },
        /* o canto oeste: o setor D, com os camarotes em cima */
        { de: 142.13, ate: 153.79, dentro: D_OESTE, fora: F_OESTE, ...BLOCO(BR), ...CAMAROTES },
        /* o fundo sudoeste (à esquerda), o menor: C B A, com a parede dos camarotes e o telão */
        ...LADO(4, f => [-65, 32 - 54 * f], 150, [AM, BR], { dentro: D_SO, fora: F_SO, ...CAMAROTES }),
        /* o canto sul, o chanfro grande: o setor U, da visitante */
        { de: 198.7, ate: 217.79, dentro: D_U, fora: F_U, h: [1.5, 7], ...BLOCO(AM), escadaNaBorda: false, corredor: 12, parapeito: 3 },
        /* o lado sudeste (embaixo): T S R Q P, da esquerda pra direita */
        ...LADO(5, f => [-49 + 103 * f, -38], 215, [BR, AM], { fora: F_SE, h: [1.5, 10], corredor: 10.3 }),
        /* o canto leste: os setores O e N */
        { de: 324.87, ate: 328.4, fora: F_LESTE, h: [1.5, 10], ...BLOCO(AM), escadaNaBorda: false },
        { de: 328.4, ate: 331.93, fora: F_LESTE, h: [1.5, 10], ...BLOCO(BR) }
      ] }
  ],
  /* O TELHADO OITAVADO, com o vão do meio (os pontos saem do satélite); o pano do lado sudeste é mais claro */
  telhados: [
    { y: 20, cor: ZINCO, pontos: [[-86.9, 43.2], [-65, 68], [65.8, 71.5], [85.4, 51.1], [90, -28.2], [65.1, -55.9], [-49.8, -58.3], [-85.5, -27.1]],
      furo: [[-66.3, 40], [-58, 54.4], [58.6, 54.4], [71, 44.5], [71, -27.5], [61.8, -36.7], [-51.9, -37.3], [-66.3, -29.5]] },
    { y: 20.3, h: 0.3, cor: ZINCO2, pontos: [[-49.8, -58.3], [65.1, -55.9], [61.8, -36.7], [-51.9, -37.3]] }
  ],
  fachada: { cor: '#e9e8e2' },
  /* (os postes nascem em cima do telhado, não atravessam a arquibancada) */
  refletores: [[-20.7, -45.6, 30, 20.6], [4.8, -45, 30, 20.6], [30.4, -44.5, 30, 20.6]],
  blocos: [
    /* SUDOESTE: o telão no meio da parede dos camarotes (a moldura amarela e a tela escura, viradas pro campo) */
    { u: -74.6, v: 5, w: 0.5, d: 13, h: 6.4, y: 9, cor: AM }, { u: -74.2, v: 5, w: 0.5, d: 10.6, h: 4.6, y: 9.9, cor: '#1b1c20' },
    /* SUDESTE: as cabines de imprensa no alto da arquibancada e a grade dos refletores na beira do telhado */
    { u: 2.5, v: -53.6, w: 98, d: 2.4, h: 3.6, y: 10, cor: '#2c3238' },
    { u: 5, v: -39.2, w: 74, d: 0.5, h: 1.3, y: 20.6, cor: '#e3e5e6', cobertura: true },
    /* NOROESTE: a treliça dos refletores em cima do telhado das cadeiras e o prédio da fachada debaixo dele */
    { u: 0.6, v: 58, w: 56, d: 1, h: 1.4, y: 25, cor: '#eef0f1', cobertura: true },
    { u: -24, v: 59.5, w: 0.5, d: 4, h: 4.6, y: 20.5, cor: '#8b8f93', cobertura: true }, { u: 0.6, v: 59.5, w: 0.5, d: 4, h: 4.6, y: 20.5, cor: '#8b8f93', cobertura: true }, { u: 25, v: 59.5, w: 0.5, d: 4, h: 4.6, y: 20.5, cor: '#8b8f93', cobertura: true },
    { u: 0, v: 66.8, w: 106, d: 2.4, h: 19.6, cor: '#e9e8e2' },
    /* os bancos de reserva, do lado das cadeiras */
    { u: -12.5, v: 40.1, w: 16, d: 1.8, h: 1.8, cor: '#eef0f1' }, { u: 5.5, v: 40.1, w: 12, d: 1.8, h: 1.8, cor: '#eef0f1' }, { u: 21, v: 40.1, w: 13, d: 1.8, h: 1.8, cor: '#eef0f1' }
  ],
  entorno: [
    /* em cima (noroeste): a rua com os carros parados, o estacionamento e os prédios */
    { tipo: 'rua', de: [-220, 84], ate: [220, 84], larg: 13 },
    { tipo: 'estacionamento', u: -76, v: 108, w: 60, d: 26, cheio: 0.6 },
    { tipo: 'predio', u: -6, v: 112, w: 22, d: 22, h: 40, cor: '#e3e1da', cor2: '#9aa3ab' }, { tipo: 'predio', u: 38, v: 114, w: 20, d: 24, h: 52, cor: '#d9c9b8', cor2: '#9aa3ab' },
    { tipo: 'casas', u: 92, v: 112, nu: 4, nv: 2, passo: 13 },
    /* à direita (nordeste): a rua e as torres de apartamento */
    { tipo: 'rua', de: [101, -220], ate: [101, 220], larg: 11 },
    { tipo: 'predio', u: 125, v: 46, w: 20, d: 24, h: 46, cor: '#e6e4de', cor2: '#9aa3ab' }, { tipo: 'predio', u: 127, v: 6, w: 22, d: 22, h: 38, cor: '#d5cfc4', cor2: '#9aa3ab' },
    { tipo: 'predio', u: 125, v: -36, w: 20, d: 26, h: 30, cor: '#e9e7e1', cor2: '#9aa3ab' },
    /* embaixo (sudeste): as casas e os prédios baixos colados no estádio */
    { tipo: 'casas', u: 14, v: -74, nu: 9, nv: 1, passo: 12.5 }, { tipo: 'casas', u: 10, v: -98, nu: 13, nv: 2, passo: 13 },
    { tipo: 'predio', u: -74, v: -84, w: 22, d: 22, h: 26, cor: '#e2e0d9', cor2: '#9aa3ab' }, { tipo: 'predio', u: 86, v: -78, w: 18, d: 16, h: 12, cor: '#dcdcd8', cor2: '#3a4657' },
    /* à esquerda (sudoeste): o galpão, a rua e os prédios */
    { tipo: 'predio', u: -108, v: 26, w: 30, d: 44, h: 9, cor: '#8f8c86' },
    { tipo: 'rua', de: [-130, -220], ate: [-130, 220], larg: 10 },
    { tipo: 'predio', u: -108, v: -34, w: 24, d: 30, h: 22, cor: '#e4e2dc', cor2: '#9aa3ab' }, { tipo: 'casas', u: -156, v: 0, nu: 2, nv: 9, passo: 13 }
  ],
  /* a visitante no setor U (do mapa do clube); Os Tigres no fundo nordeste e a Guerrilha Jovem no lado sudeste (escolha
     minha, sem fonte); o outro bonde da casa nas cadeiras */
  jogo: { mandante1: [-20, 20], mandante2: [255, 290], mandante3: [70, 105], visitante: [200, 216.5], tunelMandante: 0, tunelVisitante: 208, folgaPM: 4,
          torcidas: { os_tigres: 'mandante1', guerrilha_jovem: 'mandante2' } }
};
