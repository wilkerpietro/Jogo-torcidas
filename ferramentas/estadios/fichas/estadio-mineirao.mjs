/* MINEIRÃO (Cruzeiro e Atlético-MG, Belo Horizonte) — pelo satélite (o
   telhado, a abertura e o entorno) e pelas sete fotos (seis de dentro e uma aérea) que o
   dono mandou (15/11/2026). O campo corre quase norte-sul; no quadro o
   OESTE (o lado dos bancos e da tribuna) fica em cima e o NORTE à direita.
   A FORMA (dono, 15/11/2026, com o mapa de setores: "ele não é tão oval
   assim como você desenhou"): por fora o estádio é oval, mas o LANCE DE
   BAIXO é um retângulo de cantos chanfrados colado no campo; só o lance de
   cima acompanha o oval. Por isso o lance de baixo é fundo no meio dos
   quatro lados e quase some nos cantos. (Eu tinha tomado a borda do gramado
   que aparece pela abertura do telhado como a beira da arquibancada.)
   Arena de dois lances, toda coberta:
   · O LANCE DE BAIXO: raso e largo, atrás de um muro (o campo é
     rebaixado), partido em dois por um CORREDOR largo de concreto: a parte
     da frente e, atrás do corredor, a parte de trás, mais alta, em cima de
     um muro LARANJA, com as bocas laranja dando no corredor.
   · A CADEIRA, nos dois lances: mosaico de cinza claro com cinza mais
     escuro, bem misturado.
   · A FAIXA ESCURA de vidro dos camarotes, entre os dois lances, só nas
     duas laterais (C201 a C236 no oeste, C237 a C274 no leste, pelo mapa);
     atrás dos gols, no lugar dela, o muro de concreto.
   · O LANCE DE CIMA: o grande, da mesma cadeira, com as escadas escuras
     separando os blocos e as bocas VERMELHAS perto da frente; no meio do
     lado oeste, o bloco escuro da tribuna de imprensa.
   · A margem verde larga entre o campo e o muro, mais larga atrás dos gols;
     os bancos de teto de vidro do lado oeste.
   · O TELHADO (satélite): por fora, o anel de concreto com as placas
     solares escuras entre as 88 nervuras claras dos pórticos, que descem
     inclinados pela fachada; por dentro, a membrana branca até a abertura
     oval. Um telão pendurado na beira da abertura em cada ponta.
   · Em volta, a esplanada de concreto, com as tendas brancas das entradas.
   OS SETORES (mapa do dono; o norte do desenho aponta pro canto de cima à
   esquerda): o LARANJA é o fundo norte (135 a 145 e 335 a 344, portão F);
   o ROXO, a lateral oeste (101 a 111 e 301 a 312, portões A e B); o
   AMARELO, o fundo sul (112 a 122 e 313 a 322, portão C); o do leste (123
   a 134 e 323 a 334, portões D e E) é o Vermelho.
   AS TORCIDAS: o Amarelo é o das organizadas do Cruzeiro (Máfia Azul); a
   visitante fica no Roxo Superior, do lado do portão A (a ponta norte da
   lateral oeste). A Galoucura ficou no mesmo fundo sul quando o Atlético
   manda (escolha minha, sem fonte). */
const E = (a, b) => ({ a, b, forma: 'elipse' });
const CD = '#e8eaec', CD2 = '#a9b0b7';                   /* a cadeira: cinza claro e cinza mais escuro, em mosaico */
const CADEIRA = { cor: CD, cor2: CD2, padrao: 'mosaico', mistura: 0.45 };
const LARANJA = '#dd6a3c', VERMELHO = '#c8452f';         /* as bocas de baixo e as de cima */
/* os contornos: a beira do lance de baixo, o fundo dele, a faixa dos camarotes, o lance de cima, o corredor do alto */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* o lance de baixo: três retângulos de canto redondo, paralelos (a beira, o corredor, a parte de trás) */
const I = { a: 72, b: 47, r: 24 }, MEIO = { a: 79, b: 54, r: 31 }, MEIO2 = { a: 82, b: 57, r: 34 };
/* daqui pra fora, o oval: o fundo do lance de baixo, os camarotes, o lance de cima e o corredor do alto */
const L = E(98, 73), K = E(102, 77), F = E(128, 100), TOPO = E(140, 108);
/* onde começam e acabam os cantos (na beira da parte de trás do lance de baixo) */
const C0 = A(82, 23), C1 = A(48, 57);
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
    /* O LANCE DE BAIXO, a parte da frente: retangular, atrás do muro */
    { dentro: I, fora: MEIO, reto: true, h: [2.6, 5.6], fileiras: 9,
      trechos: [{ de: 0, ate: 360, ...CADEIRA, corredor: 14, corEscada: '#b9bcbe', vomitorios: false }] },
    /* o corredor largo de concreto que parte o lance de baixo */
    { dentro: MEIO, fora: MEIO2, reto: true, h: [5.7, 5.7], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', alt: 5.7, cor: '#cdc9be' }] },
    /* O LANCE DE BAIXO, a parte de trás: da beira retangular até o oval, em cima do muro laranja, com as bocas laranja dando
       no corredor; funda no meio dos quatro lados e quase nada nos cantos */
    { dentro: MEIO2, fora: L, normal: true, h: [7.2, 10.4], inclinacao: 0.2, fileiras: 10, corredorFrente: 1.2, corMureta: LARANJA,
      trechos: [[-C0, C0], [C1, 180 - C1], [180 - C0, 180 + C0], [180 + C1, 360 - C1]].map(([de, ate]) =>
        ({ de, ate, ...CADEIRA, corredor: 14, escadaNaBorda: true, corEscada: '#b9bcbe', vomitorios: { f: 0, cada: 2, larg: 4.5, fundo: 3.4, cor: LARANJA, corParapeito: LARANJA } }))
        .concat([[C0, C1], [180 - C1, 180 - C0], [180 + C0, 180 + C1], [360 - C1, 360 - C0]].map(([de, ate]) =>
          ({ de, ate, ...CADEIRA, corredor: 0, vomitorios: false }))) },
    /* A FAIXA ESCURA dos camarotes, só nas duas laterais; atrás dos gols, o muro de concreto */
    { dentro: L, fora: K, h: [11.6, 13.4], fileiras: 2, corredorFrente: 0, vomitorios: false, semCadeiras: true, passoFileira: 2,
      trechos: [
        { de: 48, ate: 132, cor: '#2b2f34', cor2: '#34393f', padrao: 'mosaico', mistura: 0.3, corredor: 0, corMureta: '#3a3f45' },
        { de: 132, ate: 228, cor: '#cdc9be', cor2: '#c6c2b7', padrao: 'mosaico', mistura: 0.3, corredor: 0 },
        { de: 228, ate: 312, cor: '#2b2f34', cor2: '#34393f', padrao: 'mosaico', mistura: 0.3, corredor: 0, corMureta: '#3a3f45' },
        { de: 312, ate: 408, cor: '#cdc9be', cor2: '#c6c2b7', padrao: 'mosaico', mistura: 0.3, corredor: 0 }] },
    /* O LANCE DE CIMA, oval, com as escadas escuras e as bocas vermelhas perto da frente; no meio do lado oeste, a tribuna de imprensa */
    { dentro: K, fora: F, h: [14.5, 29], fileiras: 26, corredorFrente: 1.5, corMureta: '#d9d6cc',
      trechos: [
        { de: 82, ate: 98, cor: '#3d4147', cor2: '#4c5158', padrao: 'mosaico', mistura: 0.4, corredor: 0, escadaNaBorda: true, corEscada: '#5a5e63', vomitorios: false },
        { de: 98, ate: 442, ...CADEIRA, corredor: 15, escadaNaBorda: true, corEscada: '#5a5e63',
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
    { u: 84, v: 0, w: 2, d: 18, h: 8, y: 20, cor: '#16171a' }, { u: -84, v: 0, w: 2, d: 18, h: 8, y: 20, cor: '#16171a' },
    /* os bancos de teto de vidro, do lado oeste */
    { u: -12, v: 42.5, w: 17, d: 2.6, h: 2.2, cor: '#cfdedd' }, { u: 18, v: 42.5, w: 23, d: 2.6, h: 2.2, cor: '#cfdedd' },
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
  /* a Máfia Azul (e a Galoucura, quando o Atlético manda) na parte de trás do lance de baixo do fundo sul, o Amarelo; a
     visitante no lance de cima da ponta norte da lateral oeste, o Roxo Superior do portão A; os outros bondes da casa na
     lateral leste e no canto sudeste */
  jogo: { mandante1: [165, 195], mandante2: [255, 285], mandante3: [206, 226], visitante: [42, 64], tunelMandante: 180, tunelVisitante: 53, folgaPM: 5,
          fracao: { mandante1: 0.25, mandante2: 0.25, mandante3: 0.07, visitante1: 0.72, visitante2: 0.8, visitante3: 0.64 },
          torcidas: { mafia_azul: 'mandante1', galoucura: 'mandante1' } }
};
