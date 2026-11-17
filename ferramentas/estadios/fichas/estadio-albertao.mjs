/* ALBERTÃO (Estádio Governador Alberto Tavares Silva, Ríver, Teresina) — SEM
   FOTOS DO DONO (17/11/2026: "os últimos estádios que faltam, os do
   Maranhão/Piauí. Castelão, Albertão e Frei Epifânio"): pelo satélite (o do
   Google, nítido) e por uma aérea do acervo livre da Wikimedia, sem data,
   tirada do lado da entrada. O rumo do campo, 163,8 graus, saiu do gramado no
   OpenStreetMap.
   No quadro a lateral da marquise fica EMBAIXO (é o lado oeste).
   Uma BACIA oval de um lance só, de volta inteira, em volta de um gramado oval
   com o fosso e o muro por fora:
   · as cadeiras são claras, quase brancas, com o AMARELO no meio das duas
     laterais e o AZULADO na curva da direita (o satélite de hoje mostra tudo
     desbotado; a aérea antiga tem as cores mais vivas);
   · EMBAIXO, a MARQUISE de concreto, escura, de nervuras: cobre o fundo da
     lateral e avança 35 m pra fora dela, por cima das rampas, numa meia-lua que
     afina até sumir nas duas curvas;
   · quatro torres de luz altas, de concreto, nos cantos, fora da bacia.
   ESTIMADO: as alturas (o alto da bacia a 16,5 m, a marquise a 25); onde começa
   e acaba cada cor; a marquise por baixo e o que há atrás dela (não desenhei as
   rampas nem as aletas da fachada, só a parede); as cabines; o pórtico da
   entrada, que a aérea mostra longe do estádio e não entrou.
   AS TORCIDAS (escolha minha): a Esporão do Galo na curva da esquerda, com
   apoio na lateral de cima; a visitante na curva da direita. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const E = (a, b) => ({ a, b, forma: 'elipse' });
const CLARO = '#dcdcd6', CLARO2 = '#cfcfc9', AMARELO = '#e0cf6a', AMARELO2 = '#d6c45e', AZULADO = '#9aa4c8', AZULADO2 = '#8f99bd';
/* o gramado oval, o fosso com o muro, a beira de dentro e a de fora da bacia */
const GRAMA = E(76, 52), FOSSO = E(84.5, 59), I = E(85.5, 60), F = E(114, 96.5);
const CADEIRA = (cor, cor2) => ({ cor, cor2, padrao: 'mosaico', mistura: 0.35, corEscada: '#bdbbb2', corredor: 15, vomitorios: { f: 0.5, cada: 2, larg: 4, fundo: 4.4, corParapeito: '#c9c7be' },
  paredeAtras: true, corFachada: '#b3ada0', parapeito: 1.2 });
/* onde começa e acaba o amarelo de cada lateral e o azulado da curva da direita */
/* a marquise: a boca, a beira de fora e a altura dela em cima da beira da bacia (a rampa é reta, de 25 m na boca a 20 na beira de fora) */
const BOCA = E(108, 89), FORA = E(120, 132), rE = (ang, c) => 1 / Math.sqrt(Math.cos(ang * RAD) ** 2 / (c.a * c.a) + Math.sin(ang * RAD) ** 2 / (c.b * c.b));
const NA_BEIRA = ang => 25 - 5 * (rE(ang, F) - rE(ang, BOCA)) / (rE(ang, FORA) - rE(ang, BOCA));
const MARQ = { de: 205, ate: 335, n: 36, cor: '#6f685d', cor2: '#655e54', corNervura: '#9a9386', larguraNervura: 0.3, corBaixo: '#a09a8e', corBeiral: '#8a8377' };
const T0 = A(23, 75), T1 = A(-15, 75), B0 = A(-28, -75), B1 = A(36, -75);

export default {
  id: 'estadio-albertao', nome: 'Albertão', clubes: ['river'], norte: 163.8, vazado: 0.3, folga: 26,
  chao: { cor: '#b3a48a' },
  campo: { corMargem: '#5c9a52' },
  corMureta: '#d2d0c8',
  aneis: [
    /* o MURO do fosso, de volta inteira (vem primeiro: o alambrado nasce na beira dele) */
    { dentro: FOSSO, fora: E(84.9, 59.4), h: [0.04, 0.08], fileiras: 1, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, cor: '#d2d0c8', cor2: '#d2d0c8', padrao: 'mosaico', mistura: 0, semCadeiras: true, espelhoPintado: true, corredor: 0, vomitorios: false, paredeAtras: false }] },
    /* o gramado oval em volta do campo, a volta de terra e o fosso */
    { dentro: { a: 54.5, b: 36, r: 0.5 }, fora: GRAMA, h: [0.08, 0.08], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#5c9a52' }] },
    { dentro: GRAMA, fora: FOSSO, h: [0.07, 0.07], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#a89a78' }] },
    { dentro: E(84.9, 59.4), fora: I, h: [0.06, 0.06], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#8f8a7a' }] },
    /* A BACIA, num lance só (por último: é a beira de fora dela que fecha a área) */
    { dentro: I, fora: F, h: [2.2, 16.5], fileiras: 36, corredorFrente: 1.6,
      trechos: [
        { de: -30, ate: 30, ...CADEIRA(AZULADO, AZULADO2) },
        { de: 30, ate: T0, ...CADEIRA(CLARO, CLARO2) }, { de: T0, ate: T1, ...CADEIRA(AMARELO, AMARELO2) }, { de: T1, ate: B0, ...CADEIRA(CLARO, CLARO2) },
        { de: B0, ate: B1, ...CADEIRA(AMARELO, AMARELO2) }, { de: B1, ate: 330, ...CADEIRA(CLARO, CLARO2) }
      ] }
  ],
  fachada: { cor: '#b3ada0' },
  refletores: [[-95, 104, 56], [100, 104, 56], [-108, -112, 56], [112, -112, 56]],
  /* a MARQUISE: a meia-lua de concreto, de nervuras, com a beira de dentro mais alta (25 m) que a de fora (20). Em dois
     pedaços, pra vista de cima do jogo: o de cima das cadeiras sai transparente, como toda cobertura; o de fora delas, inteiro */
  coberturasAnel: [
    { ...MARQ, dentro: BOCA, fora: F, alturas: ang => [NA_BEIRA(ang), 25], beiral: [0, 1.6] },
    { ...MARQ, dentro: F, fora: FORA, alturas: ang => [20, NA_BEIRA(ang)], beiral: [2.4, 0], opaca: true }
  ],
  blocos: [
    /* os quatro bancos de reserva, ao pé da lateral da marquise */
    ...[-27, -9, 9, 27].map(u => ({ u, v: -55.5, w: 12, d: 2.6, h: 2.2, cor: '#d9d7cf' })),
    /* a parede de trás da marquise, por onde sobem as rampas (uma parede só, curva, em pedaços) */
    ...Array.from({ length: 18 }, (_, i) => { const ang = 212 + i * (116 / 17), r = 1 / Math.sqrt(Math.cos(ang * RAD) ** 2 / (118 * 118) + Math.sin(ang * RAD) ** 2 / (128 * 128));
      return { u: r * Math.cos(ang * RAD), v: r * Math.sin(ang * RAD), w: 1.2, d: 13, h: 19, cor: '#a8a295', giro: ang }; })
  ],
  /* a câmera da aérea de referência: do alto, pelo lado da marquise */
  vista: [-60, 130, -260, 0, 0, 0],
  entorno: [
    { tipo: 'rua', de: [-240, 60], ate: [-60, 200], larg: 20 }, { tipo: 'rua', de: [-170, -240], ate: [-150, 60], larg: 12 },
    { tipo: 'casas', u: 190, v: 60, nu: 3, nv: 9, passo: 16 }, { tipo: 'casas', u: 90, v: 170, nu: 6, nv: 2, passo: 16 },
    { tipo: 'estacionamento', u: -150, v: -110, w: 40, d: 90 }, { tipo: 'arvores', u: 130, v: -40, w: 12, d: 120, n: 9 }
  ],
  jogo: { mandante1: [164, 196], mandante2: [78, 100], mandante3: [200, 224], visitante: [-16, 16], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { esporao_do_galo: 'mandante1' } }
};
