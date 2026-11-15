/* MINEIRÃO (Cruzeiro e Atlético-MG, Belo Horizonte) — pelo satélite (o
   telhado, a abertura e o entorno) e pelas quatro fotos de dentro que o
   dono mandou (15/11/2026). O campo corre quase norte-sul; no quadro o
   OESTE (o lado dos bancos e da tribuna) fica em cima e o NORTE à direita.
   Arena oval de dois lances, toda coberta:
   · O LANCE DE BAIXO: raso e largo, de cadeira cinza bem clara, atrás de um
     muro (o campo é rebaixado), com as bocas LARANJA no meio do lance.
   · A FAIXA ESCURA de vidro dos camarotes, entre os dois lances, dando a
     volta inteira.
   · O LANCE DE CIMA: o grande, da mesma cadeira clara, com as escadas
     escuras separando os blocos e as bocas VERMELHAS perto da frente.
   · A margem verde larga entre o campo e o muro, mais larga atrás dos gols;
     os bancos de teto de vidro do lado oeste.
   · O TELHADO (satélite): por fora, o anel de concreto com as placas
     solares escuras entre as 88 nervuras claras dos pórticos, que descem
     inclinados pela fachada; por dentro, a membrana branca até a abertura
     oval. Um telão pendurado na beira da abertura em cada ponta.
   · Em volta, a esplanada de concreto, com as tendas brancas das entradas.
   As cadeiras ficam debaixo do telhado: a planta dos lances saiu das fotos
   de dentro e da beira que aparece na abertura, não de mapa de setores.
   AS TORCIDAS: o setor Amarelo (o fundo sul) é o das organizadas do
   Cruzeiro (Máfia Azul); a visitante fica no Roxo Superior, do lado do
   portão A (o canto noroeste). A Galoucura ficou no mesmo fundo sul quando
   o Atlético manda (escolha minha, sem fonte). */
const E = (a, b) => ({ a, b, forma: 'elipse' });
const CD = '#e3e6e8', CD2 = '#cdd2d6';                   /* a cadeira cinza bem clara */
const LARANJA = '#dd6a3c', VERMELHO = '#c8452f';         /* as bocas de baixo e as de cima */
/* os contornos: a beira do lance de baixo, o fundo dele, a faixa dos camarotes, o lance de cima, o corredor do alto */
const I = E(75, 50), L = E(96, 71), K = E(100, 75), F = E(128, 100), TOPO = E(140, 108);
/* o telhado: a abertura, a divisa da membrana com o anel de concreto, a beira de fora dos pórticos */
const ABERTURA = E(85, 54), DIVISA = E(111, 79), BEIRA = E(141, 109);
/* as tendas brancas das entradas, em volta da esplanada */
const TENDA = (u, v, giro) => ({ u, v, w: 20, d: 7, h: 4, cor: '#eeeeea', giro });

export default {
  id: 'estadio-mineirao', alambrado: false, muro: false, nome: 'Mineirão', clubes: ['cruzeiro', 'atletico-mineiro'], norte: 8, vazado: 0.42, folga: 30,
  chao: { cor: '#8f8a80', esplanada: E(172, 140), corEsplanada: '#bdb6a6' },
  campo: { corMargem: '#4f9353' },
  corMureta: '#d9d6cc',
  aneis: [
    /* O LANCE DE BAIXO, atrás do muro, com as bocas laranja no meio do lance */
    { dentro: I, fora: L, h: [2.6, 9.6], fileiras: 20,
      trechos: [{ de: 0, ate: 360, cor: CD, cor2: CD2, padrao: 'mosaico', mistura: 0.35, corredor: 14, corEscada: '#b9bcbe',
                  vomitorios: { f: 0.45, cada: 2, larg: 4.5, fundo: 4.5, cor: LARANJA, corParapeito: LARANJA } }] },
    /* A FAIXA ESCURA dos camarotes */
    { dentro: L, fora: K, h: [10.6, 12.6], fileiras: 2, corredorFrente: 0, vomitorios: false, semCadeiras: true, passoFileira: 2, corMureta: '#3a3f45',
      trechos: [{ de: 0, ate: 360, cor: '#2b2f34', cor2: '#34393f', padrao: 'mosaico', mistura: 0.3, corredor: 0 }] },
    /* O LANCE DE CIMA, com as escadas escuras e as bocas vermelhas perto da frente */
    { dentro: K, fora: F, h: [14, 29], fileiras: 26, corredorFrente: 1.5, corMureta: '#d9d6cc',
      trechos: [{ de: 0, ate: 360, cor: CD, cor2: CD2, padrao: 'mosaico', mistura: 0.35, corredor: 15, corEscada: '#5a5e63',
                  vomitorios: { f: 0.18, cada: 1, larg: 3.6, fundo: 3.2, cor: VERMELHO, corParapeito: VERMELHO } }] },
    /* o corredor do alto, debaixo do anel de concreto */
    { dentro: F, fora: TOPO, trechos: [{ de: 0, ate: 360, tipo: 'passagem', alt: 29, cor: '#cfc9bb' }] }
  ],
  coberturasAnel: [
    /* o anel de concreto com as placas solares entre as nervuras dos 88 pórticos */
    { fora: BEIRA, dentro: DIVISA, h: 33, cai: 1, n: 88, cor: '#4b5564', cor2: '#465060', corNervura: '#d6d1c4', larguraNervura: 0.5,
      bordaFora: { larg: 2.5, cor: '#d6d1c4' } },
    /* a membrana branca, do anel até a abertura */
    { fora: DIVISA, dentro: ABERTURA, h: 32, cai: 3.5, n: 88, cor: '#f3f1ea', cor2: '#eeece4', corNervura: '#dcd9cf',
      bordaDentro: { larg: 1.6, cor: '#b9bcbe' } }
  ],
  /* os pórticos de concreto, inclinados, em volta da fachada */
  fachada: { cor: '#c9c3b4', pilares: { n: 88, h: 32, pe: 8, topo: 1, esp: 1.3, fundo: 2.6, cor: '#d6d1c4', contorno: TOPO } },
  blocos: [
    /* os dois telões pendurados na beira da abertura */
    { u: 82, v: 0, w: 2, d: 18, h: 8, y: 20, cor: '#16171a' }, { u: -82, v: 0, w: 2, d: 18, h: 8, y: 20, cor: '#16171a' },
    /* os bancos de teto de vidro, do lado oeste */
    { u: -12, v: 43.5, w: 17, d: 2.6, h: 2.2, cor: '#cfdedd' }, { u: 18, v: 43.5, w: 23, d: 2.6, h: 2.2, cor: '#cfdedd' },
    TENDA(-54, 124, 8), TENDA(62, 120, -8), TENDA(158, 36, 78), TENDA(36, -126, 4), TENDA(-44, -124, -4), TENDA(-156, -38, 80)
  ],
  /* a câmera de uma das fotos do dono: do canto sudeste, olhando o campo e o lado oeste */
  vista: [-70, 14, -45, 45, 5, 28],
  entorno: [
    /* em cima à esquerda (sudoeste): as quadras vermelhas da esplanada */
    { tipo: 'quadra', u: -168, v: 82, w: 22, d: 14, cor: '#c96a5a' }, { tipo: 'quadra', u: -138, v: 92, w: 20, d: 12, cor: '#c96a5a' },
    { tipo: 'quadra', u: -152, v: 108, w: 14, d: 12, cor: '#5f8f6a' },
    /* embaixo à direita (nordeste): a avenida arborizada; embaixo à esquerda, o estacionamento */
    { tipo: 'rua', de: [-10, -205], ate: [240, -62], larg: 24 }, { tipo: 'arvores', u: 150, v: -138, w: 60, d: 16, n: 12 },
    { tipo: 'estacionamento', u: -130, v: -150, w: 110, d: 34, cheio: 0.15 },
    /* em cima (oeste): a avenida */
    { tipo: 'rua', de: [-240, 146], ate: [10, 190], larg: 22 }
  ],
  /* a Máfia Azul (e a Galoucura, quando o Atlético manda) no lance de baixo do fundo sul, o Amarelo; a visitante no lance de
     cima do canto noroeste, o Roxo Superior; os outros bondes da casa no lado leste e no canto sudeste */
  jogo: { mandante1: [165, 195], mandante2: [255, 285], mandante3: [208, 232], visitante: [28, 52], tunelMandante: 180, tunelVisitante: 40, folgaPM: 5,
          fracao: { mandante1: 0.2, mandante2: 0.2, mandante3: 0.2, visitante1: 0.72, visitante2: 0.8, visitante3: 0.64 },
          torcidas: { mafia_azul: 'mandante1', galoucura: 'mandante1' } }
};
