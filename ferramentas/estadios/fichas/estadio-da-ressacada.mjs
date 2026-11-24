/* RESSACADA (Aderbal Ramos da Silva — Avaí, Florianópolis; no jogo o Barra
   também manda aqui) — pelo satélite, pelas fotos de referência e pelo mapa
   de setores do sócio (14/11/2026); o meio do campo foi tirado do círculo
   central. O campo é norte-sul; o quadro está na posição do mapa do clube:
   o LESTE em cima, o OESTE (o Setor A) embaixo, o NORTE à ESQUERDA.
   · Um ANEL OVAL baixo de cadeira azul com as escadas amarelas dá a volta
     no gramado, que continua em grama atrás dos dois gols.
   · EM CIMA (leste), a COBERTA GRANDE: o anel passa por baixo e, atrás
     dele, sobe o lance de cima, em arco, debaixo do telhado claro que
     acompanha a curva (com as placas solares no meio); os refletores saem
     de cima do telhado.
   · EMBAIXO (oeste), o SETOR A, coberto: uma arquibancada reta e mais
     funda que corta o anel, debaixo do telhado claro, com os bancos de
     reserva na frente e uma torre de refletor em cada ponta.
   · À ESQUERDA (norte) e À DIREITA (sul), as duas curvas descobertas do
     anel. Atrás da curva norte, o estacionamento. */
const AZ = '#2f6fc4', AZ2 = '#2861ad';                  /* a cadeira azul */
const AM = '#e9c531';
const TETO = '#cfcdc6';
/* o anel: a beira do gramado (o oval) e o fundo, 14 m atrás */
const D = { a: 85, b: 40, r: 38 }, F = { a: 99, b: 54, r: 52 };
/* o lance de cima do leste: mais 24 m, em arco */
const F2 = { a: 123, b: 78, r: 76 };
/* o Setor A: reto, 29 m de fundura */
const F_A = { a: 114, b: 69, r: 67 };
const ANEL = { cor: AZ, cor2: AZ2, padrao: 'mosaico', mistura: 0.3, corredor: 17, corEscada: AM, paredeAtras: true, corFachada: '#2f55b0' };

export default {
  id: 'estadio-da-ressacada', nome: 'Ressacada', clubes: ['avai', 'barra'], norte: 180, vazado: 0.4, folga: 22,
  corEscada: AM,
  chao: { cor: '#9a968c' },
  campo: { corMargem: '#55995a' },
  corMureta: '#e6c84a',
  aneis: [
    /* O ANEL: a curva sul, o lado leste, a curva norte e, cortando ele embaixo, o Setor A */
    { dentro: D, fora: F, reto: true, h: [1.5, 7.5], fileiras: 13,
      trechos: [
        { de: -43.8, ate: 34, ...ANEL },
        { de: 34, ate: 148, ...ANEL, paredeAtras: false },
        { de: 148, ate: 220.4, ...ANEL },
        { de: 220.4, ate: 316.2, fora: F_A, h: [1.5, 15.5], cor: AZ, cor2: '#e8eaec', padrao: 'mosaico', mistura: 0.12, corredor: 15, corEscada: AM, escadaNaBorda: true,
          vomitorios: { f: 0.42, cada: 2 }, paredeAtras: true, corFachada: '#e9e9e4' }
      ] },
    /* O LANCE DE CIMA DO LESTE, em arco, debaixo do telhado */
    { dentro: F, fora: F2, reto: true, h: [9, 21], fileiras: 24, corredorFrente: 1.8,
      trechos: [
        { de: 34, ate: 148, cor: AZ, cor2: AZ2, padrao: 'mosaico', mistura: 0.3, corredor: 17, corEscada: AM, vomitorios: { f: 0.1, cada: 2 }, paredeAtras: true, corFachada: '#e9e9e4',
          cobertura: { h: 27, larg: 25.5, avanco: 2, cai: 2, cor: TETO, cor2: '#c2c0b9', listras: true, corTrelica: '#9a9891', corPilar: '#e9e9e4' } }
      ] }
  ],
  fachada: { cor: '#2f55b0' },
  /* os dois do leste saem de cima do telhado; os dois do Setor A ficam nas pontas dele, atrás do anel */
  refletores: [[-53, 71, 44, 27.5], [42, 71, 44, 27.5], [-51, -60, 40], [45.5, -60, 40]],
  blocos: [
    /* LESTE: as placas solares em cima do telhado */
    { u: -17, v: 76.5, w: 14, d: 5, h: 0.2, y: 27.6, cor: '#2b3545', cobertura: true }, { u: 0, v: 76.5, w: 14, d: 5, h: 0.2, y: 27.6, cor: '#2b3545', cobertura: true }, { u: 15, v: 76.5, w: 12, d: 5, h: 0.2, y: 27.6, cor: '#2b3545', cobertura: true },
    /* OESTE: o telhado do Setor A, a testeira azul e os bancos de reserva na frente */
    { u: -2.9, v: -56.6, w: 90, d: 23.6, h: 0.6, y: 20, cor: TETO, cobertura: true },
    { u: -2.9, v: -44.9, w: 90, d: 0.5, h: 1.2, y: 19, cor: '#2f55b0', cobertura: true },
    { u: -11, v: -38.4, w: 12, d: 1.8, h: 1.8, cor: '#d8433f' }, { u: 12.5, v: -38.4, w: 12, d: 1.8, h: 1.8, cor: '#d8433f' }
  ],
  entorno: [
    /* o leste (em cima): a rua de mão dupla atrás da coberta grande, o campo e as casas */
    { tipo: 'rua', de: [-240, 92], ate: [240, 92], larg: 14 },
    { tipo: 'grama', u: -60, v: 122, w: 110, d: 40, cor: '#5a9a4e' }, { tipo: 'casas', u: 70, v: 120, nu: 8, nv: 2, passo: 13 },
    /* o norte (à esquerda): o estacionamento atrás da curva e as ruas */
    { tipo: 'estacionamento', u: -117, v: 10, w: 20, d: 74, cheio: 0.6 },
    { tipo: 'rua', de: [-136, -220], ate: [-136, 220], larg: 11 }, { tipo: 'casas', u: -160, v: 20, nu: 2, nv: 10, passo: 13 },
    /* o oeste (embaixo): o pátio atrás do Setor A, os carros e a rua em diagonal */
    { tipo: 'estacionamento', u: 4, v: -90, w: 34, d: 10, cheio: 0.8 },
    { tipo: 'rua', de: [-240, -78], ate: [-20, -128], larg: 12 }, { tipo: 'casas', u: -110, v: -122, nu: 5, nv: 2, passo: 13 },
    { tipo: 'grama', u: 110, v: -100, w: 150, d: 60, cor: '#b9ad92' },
    /* o sul (à direita): o terreno de areia e a rua */
    { tipo: 'grama', u: 150, v: 0, w: 70, d: 120, cor: '#b9ad92' }, { tipo: 'rua', de: [196, -220], ate: [196, 220], larg: 10 }
  ],
  /* a torcida da casa na curva norte e a visitante na curva sul (as duas escolhas minhas, sem fonte); os outros bondes da
     casa no anel do leste e no Setor A */
  jogo: { mandante1: [164, 196], mandante2: [76, 104], mandante3: [252, 286], visitante: [-16, 16], tunelMandante: 180, tunelVisitante: 0, folgaPM: 5,
          torcidas: { mancha_azul: 'mandante1', jovem_barra: 'mandante1' } }
};
