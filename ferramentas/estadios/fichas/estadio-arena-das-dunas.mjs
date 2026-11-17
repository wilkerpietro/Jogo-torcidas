/* ARENA DAS DUNAS (América/RN, Natal) — pelas cinco fotos que o dono mandou
   (17/11/2026: "Vamos pro Arena das Dunas. Preste bem atenção nos detalhes que o
   desenho é complexo"; três de dentro e duas aéreas, uma delas de 2014, ainda
   com as arquibancadas provisórias da Copa) e pelo satélite (o do Google). O
   rumo do campo, 174,4 graus (quase de norte a sul), saiu do mapa do
   OpenStreetMap.
   No quadro o lado OESTE, o das pétalas maiores, fica EMBAIXO; o norte, à
   ESQUERDA; o sul, o lado aberto, à DIREITA.
   AS ARQUIBANCADAS, de cadeiras azuis em mosaico de dois tons:
   · o anel de BAIXO dá a volta inteira no campo, sem pista, de cantos redondos;
   · nas DUAS LATERAIS, por cima dele, a faixa escura dos camarotes e o anel de
     CIMA, que acompanha a curva e acaba antes dos cantos;
   · atrás dos DOIS GOLS só existe o anel de baixo, com a esplanada por trás.
   A COBERTURA são as PÉTALAS: cascas brancas soltas, em forma de duna, que
   nascem baixas do lado de fora (são a fachada), sobem abauladas por cima das
   arquibancadas e acabam numa testeira reta sobre o campo; cada uma fica numa
   altura, em degraus, com uma fenda translúcida entre elas. São vinte:
   · OITO no oeste, as mais altas e mais fundas (54 m), as duas do meio no topo;
   · SETE no leste, mais baixas e mais rasas (40 m);
   · DUAS no norte, pequenas, por trás da esplanada: o fundo fica descoberto;
   · TRÊS no sul, quase rentes ao chão, só na borda: o fundo do sul é ABERTO,
     com a tenda branca comprida na esplanada.
   ESTIMADO: todas as alturas (pus 41 m na crista do oeste e 35 na do leste);
   a divisão das pétalas (o satélite inclina o que é alto: as fendas do oeste
   aparecem 18 m deslocadas pro sul, as do leste 11; pus as pétalas com o meio
   no meio do campo); a fundura dos anéis debaixo da cobertura, que o satélite
   não mostra; quantas fileiras; onde ficam os telões (um em cada canto do
   norte); a tenda do sul; as escadas de fora, que pus uma em cada divisa de
   pétala, em dois lances, sem as rampas compridas.
   AS TORCIDAS (escolha minha): a Máfia Vermelha atrás do gol do norte, com
   apoio no anel de baixo das duas laterais; a visitante atrás do gol do sul. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AZUL = '#2f62b0', AZUL2 = '#3f80cf', MARINHO = '#254c8c', BRANCO = '#f3f2ec', BRANCO2 = '#ebeae3', CONC = '#c9c9c3';
/* os contornos (retângulos de canto redondo, todos com o canto no mesmo centro) */
const L0 = { a: 66, b: 43.5, r: 14 }, L1 = { a: 91, b: 68.5, r: 39 }, U1 = { a: 111, b: 88.5, r: 59 };
/* a boca da cobertura, a beira de fora das pétalas e a do pódio (elipses fora do meio: o oeste é mais fundo que o leste) */
const BOCA = { a: 92, b: 61, r: 45 };
const FORA = { a: 134, b: 107, cv: -6, forma: 'elipse' }, PODIO = { a: 140, b: 113, cv: -5.5, forma: 'elipse' };
const CADEIRA = mais => ({ cor: AZUL, cor2: AZUL2, padrao: 'mosaico', mistura: 0.42, pinta: (x, y, rnd) => rnd() < 0.14 ? MARINHO : null, corredor: 12, corEscada: '#c4c8cc',
  vomitorios: { f: 0.5, cada: 2, larg: 4, fundo: 3.4, corParapeito: '#e4e4df' }, paredeAtras: true, corFachada: '#dcdcd6', corLado: '#dcdcd6', parapeito: 1.1, ...mais });
/* onde o anel de cima começa e acaba em cada lateral */
const C0 = 40, C1 = 140;
const VIDRO = '#3c4856';
/* a laje clara dos camarotes: um degrau só, estreito, que serve de muro branco por baixo do vidro */
const LAJE = { cor: '#e6e6e1', cor2: '#e6e6e1', padrao: 'mosaico', mistura: 0, semCadeiras: true, espelhoPintado: true, corredor: 0, vomitorios: false, corMureta: '#e6e6e1', paredeAtras: false };
/* AS PÉTALAS: as divisas, em graus (0 é o meio do fundo do sul, 90 o do leste, 180 o do norte, 270 o do oeste), e as alturas
   de cada uma: [a beira de fora, a testeira de dentro, a crista] */
const LESTE = [20, 35.8, 54.2, 76.2, 103.8, 125.8, 144.2, 157.8], NORTE = [157.8, 179.4, 196];
const OESTE = [196, 213.6, 230.3, 247.7, 270, 292.3, 309.7, 326.4, 340], SUL = [-20, -7, 7, 20];
const ALT_LESTE = ang => { const d = Math.abs(90 - ang); return d < 14 ? [7, 32, 35] : d < 35 ? [7, 31, 34] : d < 52 ? [7, 29.5, 32.2] : [7, 21, 23.5]; };
const ALT_OESTE = ang => { const d = Math.abs(270 - ang); return d < 25 ? [7, 37, 41] : d < 40 ? [7, 35.5, 39] : d < 55 ? [7, 32, 35.2] : [7, 23, 26]; };
const PETALA = { cor: BRANCO, cor2: BRANCO2, corBaixo: '#d2d5d4', bojo: 2.2 }, FORMA = { fenda: 0.022, curva: 2.05, corFenda: '#b3b9bc' };

/* AS ESCADAS DE FORA: em cada divisa de pétala, a escada larga que desce do pódio pro chão (dois lances, em degraus de caixa) */
const raioE = (ang, c) => { const dx = Math.cos(ang * RAD), dy = Math.sin(ang * RAD), k = dx * dx / (c.a * c.a) + dy * dy / (c.b * c.b), b = -2 * dy * c.cv / (c.b * c.b), q = c.cv * c.cv / (c.b * c.b) - 1;
  return (-b + Math.sqrt(b * b - 4 * k * q)) / (2 * k); };
const ESCADAS = [...new Set([...LESTE, ...NORTE, ...OESTE, ...SUL.map(a => (a + 360) % 360)])].flatMap(ang => { const r = raioE(ang, PODIO), em = d => [(r + d) * Math.cos(ang * RAD), (r + d) * Math.sin(ang * RAD)];
  return [[2.6, 5.4, 4.4], [7.6, 5, 2.2]].map(([d, w, h]) => { const [u, v] = em(d); return { u, v, w, d: 7.5, h, cor: '#cdccc5', giro: ang }; }); });

export default {
  id: 'estadio-arena-das-dunas', nome: 'Arena das Dunas', clubes: ['america-rn'], norte: 174.4, vazado: 0.3, folga: 26,
  chao: { cor: '#b7ab93' },
  campo: { corMargem: '#4f9a55' },
  corMureta: '#dfe1e2', alambrado: false,
  aneis: [
    /* a grama em volta do campo, até o pé do anel de baixo */
    { dentro: { a: 55.5, b: 37, r: 0.5 }, fora: L0, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    /* O ANEL DE BAIXO: a volta inteira */
    { dentro: L0, fora: L1, h: [1.6, 10.2], fileiras: 26, corredorFrente: 1.6,
      trechos: [{ de: 0, ate: 360, ...CADEIRA() }] },
    /* por cima dele, nas duas laterais, a faixa escura dos camarotes e O ANEL DE CIMA; atrás dos gols, a esplanada */
    { dentro: { a: 90.6, b: 68.1, r: 38.6 }, fora: L1, h: [12.4, 12.6], fileiras: 1, corredorFrente: 0,
      trechos: [
        { de: -C0, ate: C0, tipo: 'vazio' }, { de: C0, ate: C1, ...LAJE },
        { de: C1, ate: 360 - C1, tipo: 'vazio' }, { de: 360 - C1, ate: 360 - C0, ...LAJE }
      ] },
    { dentro: L1, fora: U1, h: [15.8, 27], fileiras: 21, corredorFrente: 1.4,
      trechos: [
        { de: -C0, ate: C0, tipo: 'passagem', cor: CONC, h: [10.3, 10.3] },
        { de: C0, ate: C1, ...CADEIRA({ vomitorios: { f: 0.08, cada: 2, larg: 4, fundo: 3.4, corParapeito: '#e4e4df' }, corMureta: VIDRO }) },
        { de: C1, ate: 360 - C1, tipo: 'passagem', cor: CONC, h: [10.3, 10.3] },
        { de: 360 - C1, ate: 360 - C0, ...CADEIRA({ vomitorios: { f: 0.08, cada: 2, larg: 4, fundo: 3.4, corParapeito: '#e4e4df' }, corMureta: VIDRO }) }
      ] },
    /* o pódio de fora, de onde nascem as pétalas */
    { dentro: U1, fora: PODIO, h: [6.6, 6.6], fileiras: 2, corredorFrente: 0, corMureta: '#bdbdb7',
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#c4c3bc' }] }
  ],
  fachada: { cor: '#cfcfc9' },
  refletores: [],
  coberturasAnel: [
    { ...PETALA, dentro: BOCA, fora: FORA, angulos: LESTE, alturas: ALT_LESTE, petalas: { ...FORMA, opacaDe: 0.7, crista: 0.3, testeira: 3.2 } },
    { ...PETALA, dentro: BOCA, fora: FORA, angulos: OESTE, alturas: ALT_OESTE, petalas: { ...FORMA, opacaDe: 0.55, crista: 0.3, testeira: 3.6 } },
    { ...PETALA, bojo: 1.6, dentro: { a: 101, b: 82, forma: 'elipse' }, fora: { a: 124, b: 99, cv: -6, forma: 'elipse' }, angulos: NORTE, alturas: () => [7, 15, 17.4],
      petalas: { ...FORMA, opacaDe: 0.5, crista: 0.35, testeira: 2.4 } },
    { ...PETALA, bojo: 0.9, dentro: { a: 126, b: 100, cv: -6, forma: 'elipse' }, fora: { a: 137.5, b: 110, cv: -6, forma: 'elipse' }, angulos: SUL, alturas: () => [6.9, 9.4, 10.4],
      petalas: { ...FORMA, opacaDe: 0, crista: 0.4, testeira: 1.6 } }
  ],
  blocos: [
    /* a tenda branca comprida na esplanada do fundo do sul, em cima dos pilares */
    { u: 104, v: 2, w: 10, d: 70, h: 0.45, y: 14.4, cor: '#f1f1ec' },
    ...[-30, -15, 0, 15, 30].flatMap(v => [100.5, 107.5].map(u => ({ u, v: v + 2, w: 0.5, d: 0.5, h: 4.2, y: 10.3, cor: '#d9d9d4' }))),
    /* os telões, nos dois cantos do norte, no fim do anel de cima */
    { u: -84, v: 52, w: 1.2, d: 13, h: 6.5, y: 15, cor: '#15171b', giro: 33, cobertura: true },
    { u: -84, v: -52, w: 1.2, d: 13, h: 6.5, y: 15, cor: '#15171b', giro: -33, cobertura: true },
    ...ESCADAS,
    /* os bancos de reserva, do lado oeste */
    { u: -14, v: -40.6, w: 12, d: 2.4, h: 2.1, cor: '#e9eaf0' }, { u: 14, v: -40.6, w: 12, d: 2.4, h: 2.1, cor: '#e9eaf0' }
  ],
  /* a câmera da aérea de fora do dono: do alto, pelo lado das pétalas grandes */
  vista: [-70, 95, -235, 0, 6, 0],
  entorno: [
    { tipo: 'rua', de: [-240, 150], ate: [240, 170], larg: 22 }, { tipo: 'rua', de: [170, -240], ate: [190, 240], larg: 18 },
    { tipo: 'rua', de: [-240, -168], ate: [240, -160], larg: 12 }, { tipo: 'predio', u: -190, v: 200, w: 40, d: 30, h: 28, cor: '#d9d6cb' },
    { tipo: 'predio', u: 210, v: -150, w: 44, d: 30, h: 8, cor: '#d4d7d9' }, { tipo: 'arvores', u: 60, v: -150, w: 150, d: 10, n: 14 },
    { tipo: 'estacionamento', u: -190, v: -40, w: 44, d: 130 }
  ],
  jogo: { mandante1: [160, 200], mandante2: [72, 108], mandante3: [252, 288], visitante: [-20, 20], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          /* (a fração é medida da beira do campo até a beira do pódio: 0,27 cai no meio do anel de baixo) */
          fracao: { mandante1: 0.27, mandante2: 0.27, mandante3: 0.235, visitante1: 0.27, visitante2: 0.3, visitante3: 0.24 },
          torcidas: { mafia_vermelha: 'mandante1' } }
};
