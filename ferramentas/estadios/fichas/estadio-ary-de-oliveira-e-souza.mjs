/* ARY DE OLIVEIRA E SOUZA (o Aryzão, Goytacaz, Campos dos Goytacazes) — pelo
   satélite (de antes da pintura azul) e pelas sete fotos de drone que o dono
   mandou (16/11/2026: "Ary de Oliveira e Souza"). O campo corre quase
   norte-sul; no quadro o LESTE fica em cima e o NORTE à esquerda. Não achei
   mapa de setores. Estádio todo pintado de azul, de degrau de cimento, com a
   passagem cinza e a grade ao pé de tudo:
   · EMBAIXO (oeste), a arquibancada principal, COBERTA de telha cinza (76 m):
     na metade do sul, a TRIBUNA, mais alta, de cadeiras em xadrez azul e
     branco, em dois blocos com a boca de entrada no meio e a faixa branca
     ESTÁDIO ARY DE OLIVEIRA E SOUZA · GOYTACAZ F.C. no alto; na metade do
     norte, o degrau azul, com a boca no pé. Depois do fim do telhado ela
     segue descoberta e dobra o canto, descendo até a altura do fundo norte.
   · À ESQUERDA (norte, a rua), a arquibancada baixa de degrau azul.
   · EM CIMA (leste), a arquibancada mais baixa ainda (uns cinco degraus), com
     o muro azul alto atrás, o placar no meio e os postes de luz na frente.
   · À DIREITA (sul), a arquibancada grande de trás do gol, descoberta, reta,
     de degrau azul, com o muro azul em quadros atrás; o canto do leste desce
     em curva pro degrau baixo. Ela acaba antes do canto do oeste.
   · O canto SUDOESTE é aberto: o terreiro de terra, o poste de luz e as
     casinhas brancas de porta azul do clube.
   AS TORCIDAS (escolhas minhas, sem fonte): a Jovem Goyta no degrau azul
   coberto do oeste; a visitante na arquibancada do fundo sul. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AZ = '#2f88de', AZ2 = '#2a7fd4', ESP = '#236fc2', MURO = '#1d5cc0', BR = '#e9ecef', CAD_BR = '#f1f3f5', CAD_AZ = '#2452a6', PISO = '#aaa9a2';
/* a beira do gramado e os fundos: o baixo (leste e norte), o do oeste e o do sul */
const I = { a: 57.4, b: 40.6, r: 4 };
const F_BAIXO = { a: 68.4, b: 48.2, r: 15 }, F_OESTE = { a: 68.4, b: 59.5, r: 15 }, F_SUL = { a: 74.5, b: 46.6, r: 10 };
const DEGRAU = { cor: AZ, cor2: AZ2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corEspelho: ESP, corredor: 0, escadaNaBorda: false, vomitorios: false,
  paredeAtras: true, corFachada: MURO };
const BOCA = { larg: 5, fundo: 3, cor: '#16386f', corParapeito: MURO };
const SUL0 = A(57.4, -31) - 360;

export default {
  id: 'estadio-ary-de-oliveira-e-souza', nome: 'Ary de Oliveira e Souza', clubes: ['goytacaz'], norte: 199.4, vazado: 0.3, folga: 24,
  chao: { cor: '#7d7a73' },
  campo: { corMargem: '#4c8f4c' },
  corMureta: MURO, corPiso: PISO, corAlambrado: '#dfe9e2',
  alambrado: { limiar: 3, cor: '#dfe9e2' },
  aneis: [
    { dentro: I, fora: F_BAIXO, reto: true, h: [1, 4], inclinacao: 0.3, fileiras: 8, corredorFrente: 2.6,
      trechos: [
        /* À DIREITA (sul): a arquibancada grande de trás do gol, com a caixa da entrada no pé, perto da curva */
        { ...DEGRAU, de: SUL0, ate: A(57.4, 36.6), fora: F_SUL, h: [1.2, 7.3], inclinacao: 0.36, fileiras: 16, parapeito: 2, vomitorios: { ...BOCA, f: 0, em: [0.94], larg: 3 } },
        /* o canto sudeste, em curva, descendo pro degrau baixo */
        { ...DEGRAU, de: A(57.4, 36.6), ate: A(53.4, 40.6), inclinacao: 0.3, fileiras: 6, parapeito: 2.4 },
        /* EM CIMA (leste): o degrau baixo com o muro azul alto atrás */
        { ...DEGRAU, de: A(53.4, 40.6), ate: A(-53.4, 40.6), inclinacao: 0.27, fileiras: 5, parapeito: 3 },
        /* o canto nordeste */
        { ...DEGRAU, de: A(-53.4, 40.6), ate: A(-57.4, 36.6), inclinacao: 0.29, fileiras: 6, parapeito: 2 },
        /* À ESQUERDA (norte): a arquibancada baixa da rua; a metade de baixo já abre pro fundo do oeste */
        { ...DEGRAU, de: A(-57.4, 36.6), ate: 180, inclinacao: 0.31, fileiras: 8, corFachada: BR },
        { ...DEGRAU, de: 180, ate: A(-57.4, -36.6), fora: F_OESTE, inclinacao: 0.33, fileiras: 9, corFachada: BR },
        /* o canto noroeste: a curva descoberta que sobe até a arquibancada principal */
        { ...DEGRAU, de: A(-57.4, -36.6), ate: A(-53.4, -40.6), fora: F_OESTE, inclinacao: 0.4, fileiras: 14, corFachada: BR },
        /* EMBAIXO (oeste): o degrau azul (coberto de u = -49,6 em diante), com a boca no pé */
        { ...DEGRAU, de: A(-53.4, -40.6), ate: A(-9, -40.6), fora: F_OESTE, h: [1.2, 9.5], inclinacao: 0.44, fileiras: 20, corFachada: BR, vomitorios: { ...BOCA, f: 0, em: [0.5] } },
        /* a escada branca entre o degrau e a tribuna */
        { ...DEGRAU, de: A(-9, -40.6), ate: A(-7.3, -40.6), fora: F_OESTE, h: [1.2, 9.5], inclinacao: 0.44, fileiras: 20, cor: '#d6dade', cor2: '#cdd2d6', corEspelho: '#c3c8cd', corFachada: BR },
        /* a TRIBUNA: mais alta, de cadeiras em xadrez azul e branco, com a boca no meio */
        { de: A(-7.3, -40.6), ate: A(25, -40.6), fora: F_OESTE, h: [3, 9.5], inclinacao: 0.344, fileiras: 15, cor: CAD_BR, cor2: CAD_AZ, padrao: 'blocos', bloco: 1.6, blocoFileiras: 1,
          corEspelho: ESP, corredor: 0, escadaNaBorda: false, vomitorios: { f: 0.15, em: [0.47], larg: 5, fundo: 4, cor: '#a9553b', corParapeito: AZ }, paredeAtras: true, corFachada: BR },
        /* o canto sudoeste, aberto */
        { de: A(25, -40.6), ate: SUL0 + 360, tipo: 'vazio' }
      ] }
  ],
  /* o telhado de telha cinza da arquibancada do oeste (sem sombra nas vistas de conferência) */
  telhados: [{ y: 13.2, h: 0.35, cor: '#a4a6a7', sombra: false, pontos: [[-49.6, -51.2], [26.3, -51.2], [26.3, -64.8], [-49.6, -64.8]] }],
  fachada: { cor: BR },
  /* os postes de luz: quatro na frente do leste e um no terreiro do sudoeste */
  refletores: [[56, 42.5, 18], [33, 42, 18], [1, 42, 18], [-37, 42, 18], [36, -49, 18]],
  blocos: [
    /* o fundo da arquibancada do oeste, debaixo do telhado: as salas e cabines, com o letreiro pra rua */
    { u: -11.7, v: -62.2, w: 75.9, d: 5.2, h: 13.2, cor: BR },
    { u: -11.7, v: -64.95, w: 0.3, d: 40, h: 1.8, y: 9, cor: MURO, texto: 'GOYTACAZ F.C.', corTexto: '#ffffff', textoFace: true, giro: -90, textoLargura: 0.7, textoAltura: 0.7 },
    /* a faixa branca do alto da tribuna e a fileira de luzes da beirada do telhado */
    { u: 9, v: -59.4, w: 0.3, d: 31, h: 1.6, y: 10.4, cor: '#f1f3f5', texto: 'ESTÁDIO ARY DE OLIVEIRA E SOUZA  ·  GOYTACAZ F.C.', corTexto: '#1f4fa8', textoFace: true, giro: 90, textoLargura: 0.95, textoAltura: 0.5 },
    { u: -11.7, v: -51.1, w: 75.9, d: 0.5, h: 0.45, y: 13.3, cor: '#eef0f2', cobertura: true },
    /* a parede branca da ponta sul da tribuna */
    { u: 25.7, v: -51.5, w: 1.2, d: 17, h: 11, cor: BR },
    /* os bancos de reserva, ao pé da tribuna */
    { u: -15.6, v: -38.4, w: 9.5, d: 2.2, h: 2, cor: '#e6e8e4' }, { u: 18, v: -38.4, w: 12, d: 2.2, h: 2, cor: '#2f5fb5' },
    /* o placar, em cima do muro do leste */
    { u: 4, v: 48.5, w: 7, d: 1, h: 2.4, y: 5.6, cor: '#242c38' },
    /* o canto sudoeste: as casinhas brancas de porta azul do clube */
    { u: 64.5, v: -47, w: 9, d: 30, h: 3.6, cor: BR }, { u: 42, v: -62.5, w: 28, d: 5, h: 3.6, cor: BR },
    { u: 42, v: -59.9, w: 28, d: 0.3, h: 1.2, cor: MURO }
  ],
  /* a câmera da aérea do dono: do alto do leste, com o fundo sul à esquerda e a arquibancada coberta ao fundo */
  vista: [14, 78, 118, 0, 0, -10],
  entorno: [
    /* o terreiro de terra do canto sudoeste */
    { tipo: 'grama', u: 42.5, v: -51.5, w: 31, d: 19, cor: '#b9a98c' },
    /* à esquerda (norte): a rua larga e as casas do outro lado */
    { tipo: 'rua', de: [-77.5, -130], ate: [-77.5, 130], larg: 11 }, { tipo: 'casas', u: -96, v: 0, nu: 1, nv: 12, passo: 15 },
    /* em cima (leste): as casas coladas no muro */
    { tipo: 'casas', u: -2, v: 58, nu: 11, nv: 1, passo: 13 }, { tipo: 'casas', u: 4, v: 74, nu: 12, nv: 1, passo: 14 }, { tipo: 'arvores', u: 16, v: 53, w: 12, d: 6, n: 2 },
    /* à direita (sul): as casas atrás da arquibancada grande */
    { tipo: 'casas', u: 86, v: 4, nu: 1, nv: 9, passo: 14 }, { tipo: 'casas', u: 102, v: 0, nu: 1, nv: 10, passo: 14 },
    /* embaixo (oeste): a rua, as casas e o prédio rosa e azul */
    { tipo: 'rua', de: [-71, -70.5], ate: [140, -70.5], larg: 9 }, { tipo: 'casas', u: -30, v: -86, nu: 7, nv: 1, passo: 15 }, { tipo: 'casas', u: 70, v: -86, nu: 5, nv: 1, passo: 15 },
    { tipo: 'predio', u: 30, v: -88, w: 20, d: 14, h: 20, cor: '#c98a92', cor2: '#3f63b5' }
  ],
  jogo: { mandante1: [225, 252], mandante2: [264, 298], mandante3: [185, 210], visitante: [-24, 28], tunelMandante: 270, tunelVisitante: 0, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { jovem_goyta: 'mandante1' } }
};
