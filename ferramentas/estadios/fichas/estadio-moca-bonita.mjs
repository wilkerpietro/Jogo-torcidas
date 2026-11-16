/* MOÇA BONITA (Proletário Guilherme da Silveira, Bangu e Madureira, Rio de
   Janeiro) — pelo satélite e pelas cinco fotos que o dono mandou (16/11/2026:
   "Veja mais imagens pra produzir melhor"): duas aéreas, a arquibancada do
   leste de frente e duas da tribuna. O campo corre quase norte-sul; no quadro
   o OESTE fica em cima e o NORTE à direita. Não achei mapa de setores.
   Estádio oval, antigo, baixo, com a margem de grama larga em volta do campo
   (uns 20 m nas laterais e 30 m atrás dos gols) e as PLACAS DE PUBLICIDADE
   pretas, baixas, rente ao campo (dono, 16/11/2026: "Retire esse alambrado
   preto rente ao campo. São placas de publicidade, você entendeu errado" — eu
   tinha lido a faixa preta das aéreas como cerca). O alambrado fica na beira
   das arquibancadas, em cima da mureta. A arquibancada é rasa, quase em toda
   a volta:
   · EM CIMA (oeste), a SOCIAL: em cima de um muro branco alto, as cadeiras
     amarelas com a faixa vermelha no meio e as escadas amarelas; no meio
     dela, por cima, a TRIBUNA coberta: o prédio branco de frisos vermelhos
     com dois lances de cadeira azul, as cabines de vidro, a laje branca de
     beirada vermelha e a armação de ferro em cima. Ao pé do muro, os bancos
     de reserva de cadeira azul com a marquise branca.
     (No satélite os blocos da social aparecem vermelhos e brancos, e eu tinha
     feito assim; as fotos do dono mostram cadeira amarela. Valem as fotos.)
   · À DIREITA (norte), a CURVA de cimento, que emenda na social e na
     arquibancada do leste, com as três caixas de acesso por fora.
   · EMBAIXO (leste), a arquibancada comprida de degrau de cimento cinza, com
     as três escadas amarelas, a mureta e o muro de trás brancos com os
     quadros vermelhos.
   · À ESQUERDA (sul), a outra CURVA de cimento, solta das duas laterais (os
     vãos dos cantos são de chão), com o muro branco atrás.
   AS TORCIDAS (escolhas minhas, sem fonte): a Super Bangu (e a Ultras
   Madureira, quando o Madureira manda) no meio da arquibancada do leste; a
   visitante na curva do sul. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const CIM = '#77767a', CIM2 = '#828185', VM = '#c8372d', AM = '#e3c23a', AZ = '#2f4f9e', BR = '#eeece6';
/* a beira de dentro (o fim da grama) e o fundo: do leste e da curva norte (8,5 m), da social (7,5 m) e da curva sul (10 m) */
const I = { a: 84, b: 53, r: 40 }, C = d => ({ a: 84 + d, b: 53 + d, r: 40 + d });
const F = C(8.5), F_SOCIAL = C(7.5), F_SUL = C(10);
const CIMENTO = (de, ate, mais) => ({ de, ate, cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 0, escadaNaBorda: true, corEscada: AM,
  vomitorios: false, paredeAtras: true, corFachada: BR, ...mais });
/* a social: cadeira amarela com a faixa vermelha no meio, em cima do muro branco alto */
const SOCIAL = (u0, u1, escada) => ({ de: A(u0, 53), ate: A(u1, 53), fora: F_SOCIAL, h: [2.6, 5.6], fileiras: 7, padrao: 'fracoes', fracoes: [[0.43, AM], [0.58, VM], [1, AM]],
  corredor: 0, escadaNaBorda: !!escada, corEscada: '#d9a92a', vomitorios: false, paredeAtras: true, corFachada: BR, corMureta: BR });
const CHAO = (de, ate) => ({ de, ate, tipo: 'passagem', cor: '#8a857b' });
const L0 = A(-55, -53) - 360, SUL0 = 151, SUL1 = 212;

export default {
  id: 'estadio-moca-bonita', nome: 'Moça Bonita', clubes: ['bangu', 'madureira'], norte: 358.6, vazado: 0.3, folga: 22,
  chao: { cor: '#817d74' },
  campo: { corMargem: '#4f8f52' },
  corMureta: BR,
  aneis: [
    { dentro: I, fora: F, reto: true, h: [1, 4.2], fileiras: 9,
      trechos: [
        /* EMBAIXO (leste): a arquibancada comprida, em quatro blocos entre as escadas amarelas */
        CIMENTO(L0, A(-42.5, -53) - 360, { escadaNaBorda: false }), CIMENTO(A(-42.5, -53) - 360, A(-1, -53) - 360), CIMENTO(A(-1, -53) - 360, A(41, -53) - 360),
        /* À DIREITA (norte): a curva, com as escadas onde ficam as caixas amarelas de acesso */
        CIMENTO(A(41, -53) - 360, -30), CIMENTO(-30, 0), CIMENTO(0, 26), CIMENTO(26, 54), CIMENTO(54, A(31.7, 53)),
        /* EM CIMA (oeste): a social, de cadeira amarela, em blocos entre as escadas */
        SOCIAL(31.7, 14, true), SOCIAL(14, 0, true), SOCIAL(0, -14, true), SOCIAL(-14, -28, true), SOCIAL(-28, -43.3, true), SOCIAL(-43.3, -55, true),
        /* o canto sudoeste, de chão */
        CHAO(A(-55, 53), SUL0),
        /* À ESQUERDA (sul): a curva de cimento */
        CIMENTO(SUL0, 180, { fora: F_SUL, h: [1, 4.8], fileiras: 10, escadaNaBorda: false }), CIMENTO(180, SUL1, { fora: F_SUL, h: [1, 4.8], fileiras: 10, corEscada: '#8a8783' }),
        /* o canto sudeste, de chão */
        CHAO(SUL1, L0 + 360)
      ] },
    /* A TRIBUNA, por cima do meio da social: os dois lances de cadeira azul no prédio branco de frisos vermelhos */
    { dentro: F_SOCIAL, fora: C(14.5), reto: true, h: [6.8, 9.6], fileiras: 6, corredorFrente: 1.2, corMureta: VM,
      trechos: [
        { de: A(14, 60.5), ate: A(-14, 60.5), cor: AZ, cor2: '#3a5cb0', padrao: 'mosaico', mistura: 0.2, corredor: 0, escadaNaBorda: false, vomitorios: false,
          paredeAtras: true, corFachada: BR, parapeito: 3.4 },
        { de: A(-14, 60.5), ate: A(14, 60.5) + 360, tipo: 'vazio' }] }
  ],
  /* a laje branca da tribuna, de beirada vermelha (sem sombra nas vistas de conferência) */
  telhados: [{ y: 13.2, h: 0.5, cor: '#f1efe9', sombra: false, pontos: [[-16.5, 57.5], [16.5, 57.5], [16.5, 70], [-16.5, 70]] }],
  fachada: { cor: BR },
  refletores: [[65, -43, 26], [-67, 45, 26], [65, 44, 26], [-66, -44, 26]],
  blocos: [
    /* as placas de publicidade pretas, baixas, rente ao campo: no lado leste e atrás dos dois gols (as aéreas do dono) */
    { u: 0, v: -38, w: 112, d: 0.4, h: 0.9, cor: '#16171a' }, { u: 57.5, v: 0, w: 0.4, d: 60, h: 0.9, cor: '#16171a' }, { u: -57.5, v: 0, w: 0.4, d: 60, h: 0.9, cor: '#16171a' },
    /* os bancos de reserva de cadeira azul com a marquise branca, ao pé do muro da social */
    { u: -22, v: 51.6, w: 14, d: 2.2, h: 0.9, cor: AZ }, { u: -22, v: 51.8, w: 15, d: 2.6, h: 0.25, y: 2.3, cor: '#f1efe9' },
    { u: 20, v: 51.6, w: 14, d: 2.2, h: 0.9, cor: AZ }, { u: 20, v: 51.8, w: 15, d: 2.6, h: 0.25, y: 2.3, cor: '#f1efe9' },
    /* a tribuna: a beirada vermelha da laje, as paredes laterais e a armação de ferro em cima */
    { u: 0, v: 57.4, w: 33, d: 0.5, h: 0.6, y: 13.1, cor: VM, cobertura: true },
    { u: -15.2, v: 64.5, w: 1, d: 9, h: 13, cor: BR }, { u: 15.2, v: 64.5, w: 1, d: 9, h: 13, cor: BR },
    { u: 0, v: 64, w: 12, d: 5.5, h: 0.25, y: 16.6, cor: '#4a4c50', cobertura: true },
    ...[[-5.8, 61.5], [5.8, 61.5], [-5.8, 66.5], [5.8, 66.5]].map(([u, v]) => ({ u, v, w: 0.25, d: 0.25, h: 3, y: 13.7, cor: '#4a4c50', cobertura: true })),
    /* os prédios do clube atrás da social */
    { u: -34, v: 67, w: 24, d: 9, h: 7, cor: '#b9b7b0' }, { u: 30, v: 67, w: 22, d: 9, h: 7, cor: '#a9a9a4' },
    /* as três caixas de acesso, por fora da curva norte */
    { u: 82, v: 41, w: 4.5, d: 3.5, h: 4.6, cor: BR, giro: 26 }, { u: 94.5, v: -1, w: 4.5, d: 3.5, h: 4.6, cor: BR }, { u: 78.5, v: -46, w: 4.5, d: 3.5, h: 4.6, cor: BR, giro: -30 },
    /* a casinha do canto sudeste */
    { u: -57.5, v: -45.5, w: 6, d: 6, h: 3.5, cor: '#9a968e' }
  ],
  /* a câmera de uma foto do dono: do campo, de frente pra tribuna */
  vista: [0, 5, 6, 0, 7, 62],
  entorno: [
    /* à direita (norte): o gramado de fora e a quadra de grama sintética; em cima à esquerda (sudoeste), o estacionamento */
    { tipo: 'grama', u: 118, v: -10, w: 36, d: 110, cor: '#6f9a5c' }, { tipo: 'quadra', u: 108, v: 52, w: 22, d: 40, cor: '#3f8a52' },
    { tipo: 'estacionamento', u: -76, v: 58, w: 30, d: 20, cheio: 0.3 },
    /* embaixo (leste): a rua arborizada e as casas; em cima (oeste): a rua e as casas; à esquerda (sul): as casas */
    { tipo: 'rua', de: [-140, -70], ate: [140, -70], larg: 9 }, { tipo: 'arvores', u: 0, v: -66, w: 180, d: 3, n: 14 }, { tipo: 'casas', u: 0, v: -86, nu: 16, nv: 1, passo: 15 },
    { tipo: 'rua', de: [-140, 80], ate: [90, 80], larg: 8 }, { tipo: 'casas', u: -20, v: 96, nu: 14, nv: 1, passo: 15 },
    { tipo: 'casas', u: -116, v: 0, nu: 1, nv: 8, passo: 15 }, { tipo: 'rua', de: [142, 120], ate: [142, -120], larg: 10 }
  ],
  jogo: { mandante1: [258, 282], mandante2: [100, 125], mandante3: [-20, 20], visitante: [166, 194], tunelMandante: 270, tunelVisitante: 180, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { super_bangu: 'mandante1', ultras_madureira: 'mandante1' } }
};
