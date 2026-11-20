/* VILA CAPANEMA (Durival Britto e Silva — Paraná Clube, Curitiba) — pelo
   satélite e pelas fotos de referência (14/11/2026). No satélite metade do
   gramado está coberta por um piso de evento; o meio do campo saiu do meio
   do oval de dentro da pista. O campo é norte-sul; no quadro o NORTE fica à
   DIREITA e o OESTE em cima. Um estádio velho, com a pista de atletismo
   gasta em volta do gramado oval e quatro lados diferentes:
   · EM CIMA (oeste), a SOCIAL: a arquibancada reta com o bloco de cadeira
     vermelha e o de cadeira azul no meio e o cimento nas pontas; atrás, o
     prédio branco das cabines, debaixo do telhado branco (as pontas do
     telhado em azul-escuro).
   · EMBAIXO (leste), a reta descoberta de degrau escuro e, colado atrás, o
     prédio comprido dos camarotes (vermelho, de telhado claro) com as três
     torres azuis das escadas.
   · À DIREITA (norte), a CURVA NORTE, a maior: meio anel fundo de degrau de
     cimento (a ponta do leste com cadeira azul-escura), com a fachada de
     painéis azuis e brancos por fora.
   · À ESQUERDA (sul), a curva sul: só o quarto do sudoeste tem arquibancada
     (baixa, de cimento, com o muro alto atrás); o quarto do sudeste é só o
     muro vermelho com as caixas azuis e as placas, colado na avenida. */
const CIM = '#a39f95', CIM2 = '#96928a';                /* o degrau de cimento velho */
const AZE = '#2b3352', AZE2 = '#252c47';                /* o azul-escuro */
const VM = '#c2433f', AZ = '#3458b0';
/* o gramado oval e a pista (9,5 m) */
const OVAL = { a: 84, b: 38, r: 38 }, PISTA = { a: 93.5, b: 47.5, r: 47.5 };
/* as duas retas: a frente reta além do oval, e o fundo */
const O_D = { a: 120, b: 48, r: 2 }, O_F = { a: 120, b: 61, r: 2 };
const L_D = { a: 120, b: 49.5, r: 2 }, L_F = { a: 120, b: 66, r: 2 };
/* a curva norte (22,5 m de fundura) e a arquibancada do sudoeste (12 m) */
const N_F = { a: 116, b: 70, r: 70 }, S_F = { a: 105.5, b: 59.5, r: 59.5 };
const CIMENTO = { cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corEscada: '#c9c6bc', paredeAtras: true };
const PISO = (de, ate, larg) => ({ de, ate, tipo: 'passagem', cor: '#8f8b83', fora: { a: 93.5 + larg, b: 47.5 + larg, r: 47.5 + larg } });
const CAIXA = (u, v, giro) => ({ u, v, w: 12, d: 4, h: 4.5, cor: AZ, giro });

export default {
  id: 'estadio-vila-capanema', nome: 'Vila Capanema', clubes: ['parana'], norte: 0, vazado: 0.4, folga: 20,
  corEscada: '#c9c6bc',
  chao: { cor: '#8a867e' },
  campo: { corMargem: '#4a9450', pista: { dentro: OVAL, fora: PISTA, cor: '#6b6862', raias: 0 } },
  corMureta: '#d9d7cf',
  aneis: [
    { dentro: PISTA, fora: N_F, reto: true, h: [1.5, 12.5], fileiras: 24,
      trechos: [
        /* a curva norte (à direita): a ponta do leste em cadeira azul-escura, o resto em cimento */
        { de: -39.3, ate: -17.6, cor: AZE, cor2: AZE2, padrao: 'mosaico', mistura: 0.35, corredor: 18, corEscada: '#c9c6bc', paredeAtras: true, corFachada: '#e9e9ef', parapeito: 2.4 },
        { de: -17.6, ate: 39.3, ...CIMENTO, corredor: 18, corFachada: '#e9e9ef', parapeito: 2.4 },
        PISO(39.3, 44.2, 22.5),
        /* a social (em cima), do norte pro sul: cimento, vermelho, azul, cimento */
        { de: 43.8, ate: 58, dentro: O_D, fora: O_F, h: [1.5, 8], ...CIMENTO, paredeAtras: false, corredor: 0, vomitorios: false },
        { de: 58, ate: 84.1, dentro: O_D, fora: O_F, h: [1.5, 8], cor: VM, cor2: '#b33b38', padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: true, vomitorios: false },
        { de: 84.1, ate: 112.6, dentro: O_D, fora: O_F, h: [1.5, 8], cor: AZ, cor2: '#2d4d9c', padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: true, vomitorios: false },
        { de: 112.6, ate: 137.3, dentro: O_D, fora: O_F, h: [1.5, 8], ...CIMENTO, paredeAtras: false, corredor: 0, escadaNaBorda: true, vomitorios: false },
        PISO(136.8, 140.7, 12),
        /* a curva sul: a arquibancada do sudoeste, e o corredor ao pé do muro no sudeste */
        { de: 140.7, ate: 175, fora: S_F, h: [1.5, 7], ...CIMENTO, corredor: 0, vomitorios: false, parapeito: 6, corFachada: '#b9b5aa' },
        PISO(175, 222, 6),
        /* a reta do leste (embaixo): o degrau escuro */
        { de: 218.4, ate: 315.3, dentro: L_D, fora: L_F, h: [1.5, 9.5], cor: '#3a4259', cor2: '#323a50', padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 16, corEscada: '#b9b6ad',
          vomitorios: false },
        PISO(315.8, 320.7, 22.5)
      ] }
  ],
  fachada: { cor: '#d9d7cf' },
  /* os dois da social saem de cima do telhado; os dois do leste ficam atrás do prédio */
  refletores: [[-29, 65, 34, 15.6], [31, 65, 34, 15.6], [-30, -82, 34], [32, -82, 34]],
  blocos: [
    /* OESTE: o prédio branco das cabines, o telhado branco, a tribuna do meio mais baixa e as pontas azul-escuras */
    { u: 1, v: 64.2, w: 82, d: 6.4, h: 14.6, cor: '#ecebe6' },
    { u: 1, v: 60, w: 82.5, d: 15, h: 0.5, y: 15, cor: '#ecebe6', cobertura: true },
    { u: 1, v: 55.5, w: 21.5, d: 9, h: 0.4, y: 13.2, cor: '#d8d2c4', cobertura: true },
    { u: -46.3, v: 61, w: 12.4, d: 12, h: 0.5, y: 12, cor: AZE, cobertura: true }, { u: 46, v: 61, w: 8, d: 12, h: 0.5, y: 12, cor: AZE, cobertura: true },
    /* os bancos de reserva, do lado da social */
    { u: -9, v: 45.6, w: 13, d: 1.6, h: 1.8, cor: '#e9e6df' }, { u: 9, v: 45.6, w: 13, d: 1.6, h: 1.8, cor: '#e9e6df' },
    /* LESTE: o prédio dos camarotes (vermelho, de telhado claro) e as três torres azuis das escadas */
    { u: -0.5, v: -69.6, w: 105, d: 7.4, h: 15, cor: '#bb4640' }, { u: -0.5, v: -69.6, w: 106, d: 8, h: 0.5, y: 15, cor: '#e3e1da' },
    { u: -33, v: -77, w: 9, d: 8, h: 19, cor: AZ }, { u: -0.5, v: -78, w: 9, d: 10, h: 19, cor: AZ }, { u: 33, v: -77, w: 9, d: 8, h: 19, cor: AZ },
    /* SUL: o muro vermelho, as caixas azuis e as placas no quarto do sudeste */
    CAIXA(-99, -24.5, 115), CAIXA(-87.5, -41, 135), CAIXA(-71, -52.5, 155),
    { u: -101, v: -8, w: 14, d: 1, h: 5, cor: VM, giro: 96 }
  ],
  entorno: [
    /* o oeste (em cima): o estacionamento, as árvores e o clube */
    { tipo: 'estacionamento', u: -84, v: 88, w: 44, d: 20, cheio: 0.3 }, { tipo: 'arvores', u: 6, v: 92, w: 90, d: 8, n: 14 },
    { tipo: 'predio', u: -20, v: 112, w: 30, d: 16, h: 6, cor: '#d9d6cd' }, { tipo: 'piscina', u: 30, v: 112, w: 22, d: 12 },
    /* o norte (à direita): a avenida em diagonal e o pátio */
    { tipo: 'rua', de: [86, 104], ate: [140, 36], larg: 14 }, { tipo: 'rua', de: [140, 36], ate: [140, -140], larg: 12 },
    { tipo: 'grama', u: 100, v: 92, w: 16, d: 14, cor: '#5d9450' },
    /* o leste (embaixo): o pátio de trás, os galpões e os carros */
    { tipo: 'predio', u: 58, v: -100, w: 16, d: 14, h: 6, cor: '#e3e1da' }, { tipo: 'predio', u: 104, v: -84, w: 18, d: 30, h: 7, cor: '#dcdad3' },
    { tipo: 'estacionamento', u: -50, v: -104, w: 40, d: 16, cheio: 0.3 },
    /* o sul (à esquerda): a avenida colada na curva, em diagonal, e o mato da linha do trem */
    { tipo: 'rua', de: [-117, 6], ate: [-75, -110], larg: 14 }, { tipo: 'rua', de: [-117, 6], ate: [-117, 130], larg: 14 },
    { tipo: 'arvores', u: -140, v: -70, w: 30, d: 80, n: 26 }
  ],
  /* a Fúria Independente na curva norte e a visitante na arquibancada do sudoeste (as duas escolhas minhas, sem fonte);
     os outros bondes da casa na reta do leste e na social */
  jogo: { mandante1: [-14, 16], mandante2: [250, 290], mandante3: [66, 104], visitante: [147, 166], tunelMandante: 0, tunelVisitante: 157, folgaPM: 5,
          torcidas: { furia_independente: 'mandante1' } }
};
