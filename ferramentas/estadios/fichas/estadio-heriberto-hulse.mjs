/* HERIBERTO HÜLSE (Criciúma Esporte Clube, Criciúma) — pelo satélite e pelas
   fotos de referência (14/11/2026). O campo é nordeste-sudoeste; no quadro o
   fundo NORDESTE fica à DIREITA, o sudoeste à esquerda, o lado NOROESTE (as
   cadeiras) em cima e o sudeste embaixo. Um anel fechado e todo coberto, de
   planta em OITAVADO (os quatro cantos chanfrados), com o telhado de zinco
   claro. As arquibancadas não têm a mesma fundura:
   · EM CIMA (noroeste), as CADEIRAS, o lado mais fundo: a parte da frente
     descoberta, de cadeira amarela, e a de trás, debaixo do telhado, no
     mosaico preto e amarelo; em cima do telhado, a treliça comprida dos
     refletores; na frente, os bancos de reserva.
   · À DIREITA (nordeste), o fundo mais fundo, em blocos amarelos e brancos,
     com a metade da frente descoberta.
   · EMBAIXO (sudeste), a arquibancada mais rasa, toda debaixo do telhado
     mais claro, em blocos amarelos e brancos, com os postes dos refletores
     na beira do telhado.
   · À ESQUERDA (sudoeste), o outro fundo, todo coberto, em blocos amarelos
     e brancos.
   · Os cantos são degrau de cimento claro, em leque. O do oeste (entre o
     fundo sudoeste e as cadeiras) é o menor: poucos degraus, a parede
     clara logo acima do último e o telão nela. */
const AM = '#f0c61f', AM2 = '#e2b81a';                  /* o amarelo */
const BR = '#e6e6e1', BR2 = '#d5d5cf';                  /* o branco */
const PT = '#232325';                                   /* o preto */
const ZINCO = '#cbcdce', ZINCO2 = '#dbdcd9';
/* a beira do gramado (o lado das cadeiras fica 6 m mais longe, por causa dos bancos) e as de fora de cada lado */
const D = { a: 57, b: 38.5, r: 6 }, DT = { a: 57, b: 44.3, r: 6 };
const F_CIMA = { a: 90, b: 70, r: 39 }, F_DIR = { a: 90, b: 71, r: 38.5 }, F_BAIXO = { a: 78.5, b: 55.5, r: 27.5 }, F_ESQ = { a: 78.5, b: 60, r: 27.5 };
const CANTO = { cor: BR, cor2: BR2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 0, vomitorios: false, paredeAtras: true };
const BLOCO = cor => ({ cor, cor2: cor === AM ? AM2 : BR2, padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: true, corEscada: '#c9c7be', vomitorios: false, paredeAtras: true });
/* um lado em n blocos de cadeira, amarelo e branco alternados (os ângulos saem da posição de cada divisa na beira de dentro) */
const ang = (u, v) => { const a = Math.atan2(v, u) * 180 / Math.PI; return a; };
const LADO = (n, ponto, de, mais) => Array.from({ length: n }, (_, i) => {
  let a0 = ang(...ponto(i / n)), a1 = ang(...ponto((i + 1) / n));
  while (a0 < de - 0.01) a0 += 360; while (a1 < a0) a1 += 360;
  return { de: +a0.toFixed(2), ate: +a1.toFixed(2), ...BLOCO(i % 2 ? BR : AM), ...mais };
});

export default {
  id: 'estadio-heriberto-hulse', nome: 'Heriberto Hülse', clubes: ['criciuma'], norte: 49, vazado: 0.36, folga: 22,
  corEscada: '#c9c7be',
  chao: { cor: '#8d8981' },
  campo: { corMargem: '#3f8f4b' },
  corMureta: '#e4e3dc',
  aneis: [
    { dentro: D, fora: F_DIR, reto: true, h: [1.5, 12], fileiras: 28,
      trechos: [
        /* o fundo nordeste (à direita): o mais fundo, sete blocos */
        ...LADO(7, f => [57, -32.5 + 65 * f], -30, { h: [1.5, 17] }),
        /* o canto norte */
        { de: 29.7, ate: 41, dentro: DT, fora: F_CIMA, h: [1.5, 16], ...CANTO },
        /* as cadeiras (em cima): a ponta branca, depois o amarelo na frente e o mosaico preto e amarelo atrás */
        { de: 41, ate: 58, dentro: DT, fora: F_CIMA, h: [1.5, 15.5], cor: BR, cor2: BR2, padrao: 'mosaico', mistura: 0.3, faixaBase: { n: 13, cor: AM }, corredor: 14, vomitorios: false, paredeAtras: true },
        { de: 58, ate: 139, dentro: DT, fora: F_CIMA, h: [1.5, 15.5], cor: PT, cor2: AM, padrao: 'mosaico', mistura: 0.42, faixaBase: { n: 13, cor: AM }, corredor: 14, vomitorios: { f: 0.45, cada: 2 }, paredeAtras: true },
        /* o canto oeste, o menor (dono, 14/11/2026: "tem uma parede logo acima do último degrau e um telão"): poucos degraus
           e, colada no último, a parede clara que sobe até o telhado */
        { de: 139, ate: 150.3, dentro: DT, fora: { a: 68, b: 55.3, r: 12 }, h: [1.5, 6.5], ...CANTO, parapeito: 11.5, corFachada: '#d3d4d0' },
        /* o fundo sudoeste (à esquerda): sete blocos, todo coberto */
        ...LADO(7, f => [-57, 32.5 - 59.5 * f], 150, { fora: F_ESQ }),
        /* o canto sul: o chanfro maior (as duas arquibancadas acabam antes dele) */
        { de: 205.35, ate: 221.84, fora: { a: 64, b: 43, r: 13 }, h: [1.5, 6], ...CANTO },
        /* o lado sudeste (embaixo): dez blocos, todo coberto */
        ...LADO(10, f => [-43 + 94 * f, -38.5], 221, { fora: F_BAIXO, h: [1.5, 10.5] }),
        /* o canto leste */
        { de: 323, ate: 330.3, fora: { a: 90, b: 55.5, r: 30 }, h: [1.5, 11], ...CANTO }
      ] }
  ],
  /* O TELHADO OITAVADO, com o vão do meio; o pano do lado sudeste é mais claro */
  telhados: [
    { y: 20, cor: ZINCO, pontos: [[-59.2, 74.7], [71.7, 74.7], [94.2, 52.2], [94.2, -27], [75.8, -56.7], [-43.3, -56.7], [-80.3, -27], [-80.3, 45.5]],
      furo: [[-51.7, 57.2], [65, 57.2], [77.5, 46.3], [77.5, -25.3], [68.3, -37.8], [-45, -37.8], [-60.8, -28.7], [-60.8, 38]] },
    { y: 20.3, h: 0.3, cor: ZINCO2, pontos: [[-43.3, -56.7], [75.8, -56.7], [68.3, -37.8], [-45, -37.8]] }
  ],
  fachada: { cor: '#e9e8e2' },
  /* (os postes nascem em cima do telhado, não atravessam a arquibancada) */
  refletores: [[-13, -43.5, 30, 20.6], [12, -43.5, 30, 20.6], [38, -43.5, 30, 20.6]],
  blocos: [
    /* o telão na parede do canto oeste: a moldura amarela e a tela escura, viradas pro campo */
    { u: -63.2, v: 51.3, w: 12, d: 0.5, h: 6.4, y: 9, cor: AM, giro: 45 }, { u: -62.7, v: 50.8, w: 9.6, d: 0.5, h: 4.6, y: 9.9, cor: '#1b1c20', giro: 45 },
    /* a treliça dos refletores em cima do telhado das cadeiras */
    { u: 2, v: 61.5, w: 66, d: 1, h: 1.4, y: 25, cor: '#eef0f1', cobertura: true },
    { u: -30, v: 63.5, w: 0.5, d: 5, h: 4.6, y: 20.5, cor: '#8b8f93', cobertura: true }, { u: 2, v: 63.5, w: 0.5, d: 5, h: 4.6, y: 20.5, cor: '#8b8f93', cobertura: true }, { u: 34, v: 63.5, w: 0.5, d: 5, h: 4.6, y: 20.5, cor: '#8b8f93', cobertura: true },
    /* os bancos de reserva, do lado das cadeiras */
    { u: -12, v: 40.6, w: 9, d: 2, h: 1.8, cor: '#eef0f1' }, { u: 12, v: 40.6, w: 9, d: 2, h: 1.8, cor: '#eef0f1' }
  ],
  entorno: [
    /* em cima (noroeste): a rua, o estacionamento e os prédios */
    { tipo: 'rua', de: [-220, 86], ate: [220, 86], larg: 13 },
    { tipo: 'estacionamento', u: -70, v: 110, w: 60, d: 26, cheio: 0.6 },
    { tipo: 'predio', u: 0, v: 112, w: 22, d: 22, h: 40, cor: '#e3e1da', cor2: '#9aa3ab' }, { tipo: 'predio', u: 44, v: 114, w: 20, d: 24, h: 52, cor: '#d9c9b8', cor2: '#9aa3ab' },
    { tipo: 'casas', u: 96, v: 112, nu: 4, nv: 2, passo: 13 },
    /* à direita (nordeste): a rua e as torres de apartamento */
    { tipo: 'rua', de: [104, -220], ate: [104, 220], larg: 11 },
    { tipo: 'predio', u: 128, v: 46, w: 20, d: 24, h: 46, cor: '#e6e4de', cor2: '#9aa3ab' }, { tipo: 'predio', u: 130, v: 6, w: 22, d: 22, h: 38, cor: '#d5cfc4', cor2: '#9aa3ab' },
    { tipo: 'predio', u: 128, v: -36, w: 20, d: 26, h: 30, cor: '#e9e7e1', cor2: '#9aa3ab' },
    /* embaixo (sudeste): as casas e os prédios baixos colados no estádio */
    { tipo: 'casas', u: 14, v: -74, nu: 9, nv: 1, passo: 12.5 }, { tipo: 'casas', u: 10, v: -98, nu: 13, nv: 2, passo: 13 },
    { tipo: 'predio', u: -62, v: -84, w: 22, d: 22, h: 26, cor: '#e2e0d9', cor2: '#9aa3ab' }, { tipo: 'predio', u: 86, v: -78, w: 18, d: 16, h: 12, cor: '#dcdcd8', cor2: '#3a4657' },
    /* à esquerda (sudoeste): o galpão, a rua e os prédios */
    { tipo: 'predio', u: -104, v: 26, w: 30, d: 44, h: 9, cor: '#8f8c86' },
    { tipo: 'rua', de: [-126, -220], ate: [-126, 220], larg: 10 },
    { tipo: 'predio', u: -104, v: -30, w: 24, d: 30, h: 22, cor: '#e4e2dc', cor2: '#9aa3ab' }, { tipo: 'casas', u: -152, v: 0, nu: 2, nv: 9, passo: 13 }
  ],
  /* Os Tigres no fundo sudoeste; a Guerrilha Jovem no lado sudeste; a visitante no fundo nordeste */
  jogo: { mandante1: [165, 195], mandante2: [255, 285], mandante3: [80, 110], visitante: [-14, 14], tunelMandante: 180, tunelVisitante: 0, folgaPM: 5,
          torcidas: { os_tigres: 'mandante1', guerrilha_jovem: 'mandante2' } }
};
