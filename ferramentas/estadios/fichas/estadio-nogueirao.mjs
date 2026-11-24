/* NOGUEIRÃO (Estádio Manoel Leonardo Nogueira, Baraúnas e Potiguar, Mossoró) —
   pelas três fotos aéreas que o dono mandou (17/11/2026: "Vamos pro Nogueirão";
   duas de drone, recentes, tiradas por cima do prédio da entrada, e uma antiga,
   do lado oposto) e pelo satélite. O estádio foi DEMOLIDO: o satélite de hoje
   (Google) mostra só o terreno com o entulho; as medidas saíram do satélite
   antigo da Esri, que só existe em baixa resolução (1,7 px/m), e do contorno do
   estádio no OpenStreetMap. O rumo do campo, 126,4 graus, saiu do gramado no
   OpenStreetMap.
   No quadro o prédio da entrada fica EMBAIXO e o letreiro pintado EM CIMA.
   Um ANEL SÓ, estreito (8,5 m, nove degraus), em retângulo de cantos redondos,
   levantado do chão (o pé do degrau fica a uns 3 m, em cima de um muro com as
   portas), em volta de um pátio de TERRA com o gramado no meio:
   · EM CIMA, a lateral dos LETREIROS pintados no degrau: EXTINCHAMAS em
     vermelho no amarelo, CACIM em branco no verde, EXTINCHAMAS de novo;
   · À ESQUERDA, a curva de trás do gol com o degrau em blocos alternados,
     vermelhos e de concreto, em cima do muro branco de barra vermelha;
   · À DIREITA, a outra curva, de concreto, com um pedaço verde no canto de cima;
   · EMBAIXO, o concreto dos dois lados do PRÉDIO da entrada, de paredes azuis
     e telhado cinza, com a marquise pra rua.
   ESTIMADO: as alturas; a fundura do anel (o satélite antigo é um borrão: 8 a
   10 m); quantos blocos vermelhos tem a curva e onde cai cada um; o tamanho do
   prédio (37 m por 17); o desenho das letras, que saiu numa grade de 75 cm; as
   torres de luz. A foto antiga mostra o degrau todo cinza-azulado e uma
   tribuna de telhado azul onde hoje é o prédio: valeram as duas recentes.
   AS TORCIDAS (escolha minha): a da casa no meio da lateral dos letreiros, com
   apoio na curva da esquerda e no concreto de baixo; a visitante na curva da
   direita. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const CONC = '#c4c1b8', CONC2 = '#b8b5ac', BRANCO = '#efefea', AMARELO = '#e6c01f', VERMELHO = '#c4302a', VERDE = '#1f8a4c', TELHA = '#c2573a', TERRA = '#b79a6c', ESCURO = '#3a3632';
/* o anel: por dentro 166 m por 108, por fora 183 por 125; os cantos redondos têm o mesmo centro (61, 32) */
const I = { a: 83, b: 54, r: 22 }, F = { a: 91.5, b: 62.5, r: 30.5 };
/* AS LETRAS pintadas no degrau, numa grade de 7 linhas: cada casa da grade é um lugar (75 cm) de um degrau */
const LETRA = {
  E: ['####', '#...', '#...', '###.', '#...', '#...', '####'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'], I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'], C: ['.###', '#...', '#...', '#...', '#...', '#...', '.###'],
  H: ['#..#', '#..#', '#..#', '####', '#..#', '#..#', '#..#'], A: ['.##.', '#..#', '#..#', '####', '#..#', '#..#', '#..#'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], S: ['.###', '#...', '#...', '.##.', '...#', '...#', '###.']
};
/* `LETREIRO(texto, casas, vao, cor)`: o `pinta` do trecho — o texto no meio dele, de pé pra quem olha do campo. `casas` é
   quantos lugares o gerador pôs no trecho (medido na prova: 62 nos amarelos, com `celula: 0.64`, e 34 no verde); o trecho
   precisa de NOVE degraus (`passoFileira: 1.04` nos amarelos). Se a medida do anel mudar, meça de novo, senão cai uma coluna
   e o H vira F. */
const LETREIRO = (texto, n, vao, corLetra) => { const linhas = Array.from({ length: 7 }, () => '');
  [...texto].forEach((ch, i) => LETRA[ch].forEach((l, k) => { linhas[k] += (i ? '.'.repeat(vao) : '') + l; }));
  const larg = linhas[0].length, folga = Math.floor((n - larg) / 2);
  return (x, y) => { const col = Math.floor(x * n) - folga, lin = 7 - Math.floor(y * 9); return lin >= 0 && lin < 7 && linhas[lin][col] === '#' ? corLetra : null; }; };
/* os blocos alternados da curva da esquerda (`quantos` por trecho, sempre par, pra alternância seguir de um trecho pro outro) */
const BLOCOS = quantos => (x, y, rnd) => Math.floor(x * quantos) % 2 ? (rnd() < 0.25 ? '#b84f35' : TELHA) : null;
const DEGRAU = { cor: CONC, cor2: CONC2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, espelhoPintado: true, corEscada: BRANCO, corredor: 13, vomitorios: false,
  paredeAtras: true, corFachada: BRANCO, corLado: BRANCO, parapeito: 1.1 };
const PINTADO = cor => ({ ...DEGRAU, cor, cor2: cor, mistura: 0, corredor: 0 });
/* as PORTAS do muro de baixo do degrau, viradas pro campo: nas retas e nos cantos (o centro do canto é (±61, ±32), raio 22) */
const PORTA = (u, v, giro) => ({ u, v, w: 0.25, d: 2.3, h: 2.1, cor: ESCURO, giro });
const NA_RETA = (u0, v0, u1, v1) => { const L = Math.hypot(u1 - u0, v1 - v0), n = Math.round(L / 4.2), giro = Math.atan2(v1 - v0, u1 - u0) / RAD + 90;
  return Array.from({ length: n }, (_, i) => PORTA(u0 + (u1 - u0) * (i + 0.5) / n, v0 + (v1 - v0) * (i + 0.5) / n, giro)); };
const NO_CANTO = (su, sv) => Array.from({ length: 8 }, (_, i) => { const a = (i + 0.5) / 8 * 90 * RAD; return PORTA(su * (61 + 21.9 * Math.cos(a)), sv * (32 + 21.9 * Math.sin(a)), Math.atan2(sv * Math.sin(a), su * Math.cos(a)) / RAD); });
/* a barra vermelha do muro da curva da esquerda */
const BARRA = [{ u: -82.9, v: 0, w: 0.25, d: 64, h: 0.9, cor: VERMELHO },
  ...[1, -1].flatMap(sv => Array.from({ length: 10 }, (_, i) => { const a = (i + 0.5) / 10 * 90 * RAD; return { u: -(61 + 21.9 * Math.cos(a)), v: sv * (32 + 21.9 * Math.sin(a)), w: 0.25, d: 3.6, h: 0.9, cor: VERMELHO, giro: Math.atan2(sv * Math.sin(a), -Math.cos(a)) / RAD }; }))];

export default {
  id: 'estadio-nogueirao', nome: 'Nogueirão', clubes: ['baraunas', 'potiguar'], norte: 126.4, vazado: 0.3, folga: 24,
  chao: { cor: '#b5a488' },
  campo: { corMargem: TERRA },
  corMureta: BRANCO, alambrado: false,
  aneis: [
    /* o pátio de terra em volta do gramado, até o pé do muro */
    { dentro: { a: 55.5, b: 37, r: 0.5 }, fora: I, reto: true, h: [0.1, 0.1], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: TERRA }] },
    /* O ANEL, levantado: nove degraus em cima do muro das portas */
    { dentro: I, fora: F, reto: true, h: [3, 7], fileiras: 9, corredorFrente: 0.8, passoFileira: 0.85,
      trechos: [
        /* À DIREITA: a reta e os dois cantos, de concreto; o pedaço verde fica no canto de cima, junto do letreiro */
        { de: A(83, -32) - 360, ate: A(83, 32), ...DEGRAU },
        { de: A(83, 32), ate: A(61, 54), ...DEGRAU, corredor: 0, pinta: (x, y, rnd) => x < 0.3 ? VERDE : null },
        /* EM CIMA, a lateral dos letreiros */
        { de: A(61, 54), ate: A(15, 54), ...PINTADO(AMARELO), celula: 0.64, passoFileira: 1.04, pinta: LETREIRO('EXTINCHAMAS', 62, 1, VERMELHO) },
        { de: A(15, 54), ate: A(12, 54), ...PINTADO(BRANCO) },
        { de: A(12, 54), ate: A(-12, 54), ...PINTADO(VERDE), pinta: LETREIRO('CACIM', 34, 2, BRANCO) },
        { de: A(-12, 54), ate: A(-15, 54), ...PINTADO(BRANCO) },
        { de: A(-15, 54), ate: A(-61, 54), ...PINTADO(AMARELO), celula: 0.64, passoFileira: 1.04, pinta: LETREIRO('EXTINCHAMAS', 62, 1, VERMELHO) },
        /* À ESQUERDA: os blocos alternados, vermelhos e de concreto */
        { de: A(-61, 54), ate: A(-83, 32), ...DEGRAU, corredor: 0, pinta: BLOCOS(4) },
        { de: A(-83, 32), ate: A(-83, -32), ...DEGRAU, corredor: 0, pinta: BLOCOS(6) },
        { de: A(-83, -32), ate: A(-61, -54), ...DEGRAU, corredor: 0, pinta: BLOCOS(4) },
        /* EMBAIXO: o concreto dos dois lados do prédio da entrada */
        { de: A(-61, -54), ate: A(-17, -54), ...DEGRAU },
        { de: A(-17, -54), ate: A(20, -54), tipo: 'vazio' },
        { de: A(20, -54), ate: A(61, -54), ...DEGRAU },
        { de: A(61, -54), ate: A(83, -32), ...DEGRAU, corredor: 0 }
      ] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[-46, 50, 24], [46, 50, 24], [-24, -51, 24], [26, -51, 24]],
  blocos: [
    /* o PRÉDIO da entrada: as paredes azuis com a faixa branca, o telhado cinza e a marquise pra rua */
    { u: 1.5, v: -61.5, w: 37, d: 17, h: 6.6, cor: '#3d58a8' }, { u: 1.5, v: -61.5, w: 37.2, d: 17.2, h: 1.1, y: 4.6, cor: BRANCO },
    { u: 1.5, v: -61.5, w: 38.6, d: 18.6, h: 0.45, y: 6.6, cor: '#b3b6b8' },
    { u: 1.5, v: -72.4, w: 15, d: 5, h: 0.5, y: 3.8, cor: BRANCO }, { u: 1.5, v: -70.2, w: 7, d: 0.3, h: 3.2, cor: '#2a3a78' },
    /* as placas e os bancos de reserva, ao pé dele */
    { u: -20, v: -49.5, w: 7, d: 0.3, h: 1.7, cor: BRANCO }, { u: 23, v: -49.5, w: 7, d: 0.3, h: 1.7, cor: BRANCO },
    { u: -10, v: -51, w: 6, d: 2, h: 2, cor: '#d9dcdf' }, { u: 13, v: -51, w: 6, d: 2, h: 2, cor: '#d9dcdf' },
    /* as portas do muro, pro campo */
    ...NA_RETA(-60, 53.9, 60, 53.9), ...NA_RETA(82.9, -31, 82.9, 31), ...NA_RETA(21, -53.9, 60, -53.9), ...NA_RETA(-60, -53.9, -18, -53.9),
    ...NO_CANTO(1, 1), ...NO_CANTO(1, -1),
    ...BARRA
  ],
  /* a câmera das duas fotos de drone do dono: do alto, por cima do prédio da entrada, olhando os letreiros */
  vista: [0, 78, -150, 0, 0, 6],
  entorno: [
    { tipo: 'rua', de: [-180, -84], ate: [180, -84], larg: 10 }, { tipo: 'rua', de: [-106, -180], ate: [-106, 180], larg: 10 },
    { tipo: 'rua', de: [106, -180], ate: [106, 180], larg: 9 }, { tipo: 'casas', u: 0, v: -106, nu: 12, nv: 1, passo: 16 },
    { tipo: 'casas', u: -128, v: 0, nu: 1, nv: 10, passo: 16 }, { tipo: 'quadra', u: 20, v: 92, w: 70, d: 44, cor: '#c2a878' },
    { tipo: 'arvores', u: -96, v: 20, w: 8, d: 90, n: 6 }
  ],
  jogo: { mandante1: [76, 104], mandante2: [166, 194], mandante3: [226, 244], visitante: [-16, 16], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { furia_jovem_baraunas: 'mandante1', imperio_vermelho: 'mandante1' } }
};
