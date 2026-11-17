/* CASTELÃO DE SÃO LUÍS (Estádio Governador João Castelo; Sampaio Corrêa e Moto
   Club) — SEM FOTOS (dono, 17/11/2026: "vamos pros últimos estádios que faltam,
   os do Maranhão/Piauí. Castelão, Albertão e Frei Epifânio"): só pelo satélite
   (o do Google, nítido, tirado num dia de evento, com um palco no gramado). Não
   achei foto de acervo livre dele. O rumo do campo, 170,6 graus, saiu do
   gramado no OpenStreetMap. (A ficha `estadio-castelao` é a da Arena Castelão,
   de Fortaleza; esta é outra.)
   No quadro a lateral das cadeiras vermelhas fica EMBAIXO (é o lado oeste).
   Uma BACIA oval grande, com a pista de atletismo em volta do gramado:
   · o anel de BAIXO, descoberto, dá a volta inteira: cadeiras VERMELHAS no meio
     da lateral de baixo, AZULADAS nas duas curvas de trás dos gols e CONCRETO
     claro, sem cadeira, na lateral de cima, com as duas escadas largas e o
     túnel no meio;
   · por fora e por cima dele, a MARQUISE de concreto escuro, em gomos, de volta
     inteira: estreita na lateral de cima (12 m), larga nas curvas (30 m) e
     mais larga ainda na de baixo (44 m), onde fica a entrada principal; debaixo
     dela pus o resto da arquibancada, que o satélite não mostra;
   · quatro torres de luz, fora do estádio.
   ESTIMADO: quase tudo o que não é planta — as alturas (a marquise a 26 m); o
   que há debaixo da marquise (pus degrau de concreto até a beira de fora); se a
   lateral de cima é mesmo de degrau sem cadeira (no satélite é uma superfície
   lisa e clara: pode ser outra coisa); os tons das cadeiras; as cabines e a
   tribuna, que não desenhei.
   AS TORCIDAS (escolha minha): as da casa na curva da esquerda; a visitante na
   curva da direita. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const E = (a, b) => ({ a, b, forma: 'elipse' });
const VERMELHO = '#c46458', VERMELHO2 = '#b9584d', LILAS = '#8f97c4', LILAS2 = '#858db9', CONC = '#c9c8c2', CONC2 = '#bfbeb8', ESCURO = '#6b6259';
/* a pista, a beira das arquibancadas, a boca da marquise e a beira de fora (fora do meio: a lateral de baixo é mais funda) */
/* (a pista é de duas retas e dois semicírculos, não uma elipse: em elipse, o canto do campo entrava nela) */
const PISTA_D = { a: 75.5, b: 43, r: 43 }, PISTA_F = { a: 83, b: 50.5, r: 50.5 }, I = E(84, 65), BOCA = E(114, 87), FORA = { a: 145, b: 115, cv: -15, forma: 'elipse' };
const CADEIRA = (cor, cor2, mais) => ({ cor, cor2, padrao: 'mosaico', mistura: 0.35, corEscada: '#d9d3b8', corredor: 14, vomitorios: { f: 0.5, cada: 2, larg: 4, fundo: 4 }, paredeAtras: false, ...mais });
const DEGRAU = mais => ({ cor: CONC, cor2: CONC2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, espelhoPintado: true, corEscada: '#dedcd5', corredor: 16, vomitorios: false, paredeAtras: false, ...mais });
/* onde o vermelho acaba e onde o concreto claro começa */
const V0 = A(-66, -70), V1 = A(66, -70), C0 = 21, C1 = 159;

export default {
  id: 'estadio-castelao-ma', nome: 'Castelão', clubes: ['sampaio-correa', 'moto-club'], norte: 170.6, vazado: 0.3, folga: 26,
  chao: { cor: '#a9a48f' },
  campo: { corMargem: '#4f9a55' },
  corMureta: '#d6d4cc',
  aneis: [
    /* O ANEL DE BAIXO, descoberto, de volta inteira (vem primeiro: o alambrado nasce na beira dele) */
    { dentro: I, fora: BOCA, h: [1.6, 11.4], fileiras: 26, corredorFrente: 1.6,
      trechos: [
        { de: V1 - 360, ate: C0, ...CADEIRA(LILAS, LILAS2) },
        { de: C0, ate: C1, ...DEGRAU({ vomitorios: { em: [0.19, 0.5, 0.81], f: 0, larg: 9, fundo: 9, corParapeito: '#e4e2da' } }) },
        { de: C1, ate: V0, ...CADEIRA(LILAS, LILAS2) },
        { de: V0, ate: V1, ...CADEIRA(VERMELHO, VERMELHO2) }
      ] },
    /* o gramado em volta do campo, a pista de atletismo e a grama até o pé das arquibancadas */
    { dentro: { a: 54.5, b: 36, r: 0.5 }, fora: PISTA_D, h: [0.08, 0.08], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    { dentro: PISTA_D, fora: PISTA_F, h: [0.1, 0.1], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#8a8fb0' }] },
    { dentro: PISTA_F, fora: I, h: [0.09, 0.09], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#5c9a52' }] },
    /* DEBAIXO DA MARQUISE, o resto da arquibancada (por último: é a beira de fora dela que fecha a área) */
    { dentro: BOCA, fora: FORA, h: [11.8, 21.5], fileiras: 26, corredorFrente: 1.4,
      trechos: [{ de: 0, ate: 360, ...DEGRAU({ paredeAtras: true, corFachada: '#b7b2a6', parapeito: 1.2 }) }] }
  ],
  fachada: { cor: '#b7b2a6' },
  refletores: [[-67, 113, 46], [106, 70, 46], [-101, -134, 46], [92, -136, 46]],
  coberturasAnel: [
    { dentro: BOCA, fora: FORA, h: 27, cai: 2, n: 72, cor: ESCURO, cor2: '#5f574f', corNervura: '#8b8379', larguraNervura: 0.14, corBaixo: '#9a958b', beiral: [1.6, 1.2], corBeiral: '#7a7268' }
  ],
  blocos: [
    /* os quatro bancos de reserva, de telhado azul, e as duas rampas de concreto nas pontas do vermelho */
    ...[-30, -11, 11, 30].map(u => ({ u, v: -54, w: 13, d: 2.6, h: 2.2, cor: '#5f7fa8' })),
    { u: -45, v: -57, w: 6, d: 10, h: 0.8, cor: '#d2d0c8' }, { u: 45, v: -57, w: 6, d: 10, h: 0.8, cor: '#d2d0c8' }
  ],
  /* a câmera: do alto, por trás da lateral de cima, olhando o vermelho */
  vista: [40, 150, 250, 0, 0, -10],
  entorno: [
    { tipo: 'rua', de: [-240, -160], ate: [240, -150], larg: 16 }, { tipo: 'rua', de: [170, -240], ate: [150, 240], larg: 12 },
    { tipo: 'rua', de: [-240, 130], ate: [240, 150], larg: 12 }, { tipo: 'estacionamento', u: -10, v: 170, w: 120, d: 40 },
    { tipo: 'quadra', u: -130, v: 150, w: 34, d: 24, cor: '#8a8fc4' }, { tipo: 'predio', u: 130, v: 150, w: 40, d: 16, h: 6, cor: '#cfd2d4' },
    { tipo: 'arvores', u: 190, v: -60, w: 20, d: 120, n: 12 }
  ],
  jogo: { mandante1: [164, 196], mandante2: [200, 222], mandante3: [136, 158], visitante: [-16, 16], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          /* (a fração é medida da beira do anel de baixo até a beira de fora: estes valores caem no meio do anel de baixo) */
          fracao: { mandante1: 0.25, mandante2: 0.24, mandante3: 0.26, visitante1: 0.25, visitante2: 0.3, visitante3: 0.2 },
          torcidas: { tubaroes_da_fiel: 'mandante1', dragoes_da_fiel: 'mandante1', motofolia: 'mandante2' } }
};
