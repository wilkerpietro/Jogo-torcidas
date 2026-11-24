/* AMIGÃO (Estádio Governador Ernani Sátyro, Treze e Campinense, Campina Grande)
   — pelas duas fotos aéreas que o dono mandou (17/11/2026: "Vamos pra Paraíba
   agora, estádio amigão [...] Veja as fotos"; uma de dia e uma de noite, cada
   uma tirada de trás de um gol) e pelo satélite (o do Google). O rumo do campo,
   173,7 graus, saiu do contorno do gramado no OpenStreetMap; o meio do campo
   fica 1,5 m e 2,5 m fora do meio desse contorno.
   No quadro a arquibancada da cobertura fica EMBAIXO.
   Oval em elipse, grande, com o campo no fundo de uma bacia de grama e a pista
   de terra em volta dele. A elipse das arquibancadas fica 4 m fora do meio do
   campo (a grama é mais larga do lado de cima).
   · As DUAS LATERAIS são arquibancadas grandes em meia-lua, de 37 m de fundura,
     de degrau de concreto claro, num LANCE SÓ, com o corredor horizontal no
     meio (de longe ele parece a divisa de dois andares, e na primeira versão eu
     fiz dois; o dono corrigiu), as escadas brancas e as caixas das bocas;
   · na de BAIXO, a metade da direita fica debaixo da COBERTURA escura, em
     balanço, com o degrau AZUL do corredor pra cima; os quatro bancos de
     reserva ficam ao pé dela;
   · os DOIS FUNDOS, atrás dos gols, são INACABADOS: a terra em degraus, tomada
     de mato, mais baixa que as laterais, com os PILARES de concreto das
     fundações espalhados em fileiras, o caminho branco do corredor no meio, a
     casinha branca no da esquerda e, por fora, o muro de losangos azul-marinho
     e vermelhos (pela terceira foto do dono, de perto).
   ESTIMADO: as alturas (as laterais sobem uns 17 m); a altura do corredor (pus
   no meio); quantos pilares e onde (a foto mostra um pedaço de um fundo); o
   desenho dos losangos, que saiu em quadros desencontrados; onde começa e acaba
   a cobertura (o satélite a mostra deslocada,
   com a sombra) e a fundura dela; a posição das escadas e das bocas; as torres
   de luz.
   AS TORCIDAS (escolha minha): a da casa no meio da lateral da cobertura, com
   o apoio nela e na ponta da outra lateral; a visitante na outra lateral, do
   lado oposto. Os fundos inacabados ficam vazios. */
const RAD = Math.PI / 180;
const CONC = '#c9c8c1', CONC2 = '#bcbbb4', BRANCO = '#f0f0ec', AZUL = '#3f6fb8', AZUL2 = '#3763a8', TERRA = '#8b8266', MATO = '#6f8752';
/* a pista em volta do campo (retângulo de pontas redondas) e as elipses das arquibancadas, 4 m pro lado de cima */
const E = (a, b) => ({ a, b, cv: 4, forma: 'elipse' });
const PISTA_D = { a: 71, b: 42.5, r: 36 }, PISTA_F = { a: 76, b: 47.5, r: 41 };
const I = E(85, 61.5), F = E(124, 98.5);
/* onde começa e acaba cada lateral (graus, do meio do campo) e a cobertura */
const C0 = 22.7, C1 = 157.3, B0 = 204, B1 = 335, T0 = 266, T1 = 322;
/* AS ARQUIBANCADAS SÃO UM LANCE SÓ (dono, 17/11/2026: "não tem dois andares, são só corredores horizontais pra facilitar o
   trânsito dos torcedores. É porque visto de longe parece diferença de andares mesmo"): o degrau sobe contínuo do pé ao alto, e
   no meio passa o CORREDOR horizontal, que aqui é só a faixa clara pintada (`y` de baixo pra cima). As bocas abrem em cima dele. */
const noCorredor = (y, meia) => Math.abs(y - 0.5) < meia;
const LATERAL = (x, y) => noCorredor(y, 0.022) ? '#e9e8e2' : null;
const COBERTA = (x, y, rnd) => noCorredor(y, 0.022) ? '#e9e8e2' : y > 0.52 ? (rnd() < 0.3 ? AZUL2 : AZUL) : null;
const INACABADO = (x, y) => noCorredor(y, 0.034) ? '#dddcd4' : null;
const BOCAS = { f: 0.53, cada: 1, larg: 3.6, fundo: 3.2, corParapeito: BRANCO };
const DEGRAU = { cor: CONC, cor2: CONC2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, espelhoPintado: true, corEscada: BRANCO, corredor: 21, vomitorios: BOCAS,
  paredeAtras: true, parapeito: 1.4, corFachada: '#cfcdc4', corLado: '#d9d7cf' };
const RUINA = { h: [1.4, 8.4], cor: TERRA, cor2: MATO, padrao: 'mosaico', mistura: 0.5, pinta: INACABADO, semCadeiras: true, corredor: 0, vomitorios: false, paredeAtras: true,
  corFachada: BRANCO, corLado: '#b9b6ab', parapeito: 1.2 };
const TELHADO = { h: 23, larg: 21, avanco: 6, cai: 0.8, cor: '#2f3136', cor2: '#383a40', listras: true, corBaixo: '#55585e', trelica: false, corPilar: '#d9d7cf' };
/* um ponto dos fundos inacabados: no ângulo `ang`, a fração `f` do pé ao alto (as elipses ficam 4 m fora do meio) */
const raio = (ang, c) => { const dx = Math.cos(ang * RAD), dy = Math.sin(ang * RAD), k = dx * dx / (c.a * c.a) + dy * dy / (c.b * c.b), b = -2 * dy * c.cv / (c.b * c.b), q = c.cv * c.cv / (c.b * c.b) - 1;
  return (-b + Math.sqrt(b * b - 4 * k * q)) / (2 * k); };
const PT = (ang, f) => { const r = raio(ang, I) + (raio(ang, F) - raio(ang, I)) * f; return [r * Math.cos(ang * RAD), r * Math.sin(ang * RAD)]; };
const FUNDOS = [[B1 - 360, C0], [C1, B0]];
/* OS PILARES dos fundos inacabados (dono: "Adicione os pilares que ficam atrás dos gols pra dar um realismo maior"): os tocos de
   concreto das fundações, em fileiras que acompanham a curva — três entre o pé e o corredor, duas do corredor pro alto */
const PILARES = FUNDOS.flatMap(([a0, a1], k) => [[0.12, 5.5], [0.25, 5.5], [0.38, 5.5], [0.66, 7.5], [0.84, 7.5]].flatMap(([f, passo], j) => { const out = [], r = raio((a0 + a1) / 2, I) + 39 * f, da = passo / r / RAD;
  for (let a = a0 + 1.6 + (j % 2) * da / 2, i = 0; a < a1 - 1.2; a += da, i++) { const [u, v] = PT(a, f), s = ((i * 7 + j * 3 + k * 5) % 5) / 5;
    out.push({ u, v, w: 0.55, d: 0.55, h: 1.5 + s * 0.9, y: 1.2 + 7 * f, cor: s > 0.5 ? '#c9c6bb' : '#b3b0a6', giro: a }); }
  return out; }));
/* o MURO DE LOSANGOS de fora dos fundos (azul-marinho, vermelho e branco), em duas fiadas desencontradas */
const LOSANGOS = FUNDOS.flatMap(([a0, a1]) => { const out = [], da = 3.2 / 124 / RAD; let i = 0;
  for (let a = a0 + 0.6; a < a1 - 0.6; a += da, i++) for (const fiada of [0, 1]) { const am = a + (fiada ? da / 2 : 0), r = raio(am, F) + 0.3;
    out.push({ u: r * Math.cos(am * RAD), v: r * Math.sin(am * RAD), w: 0.3, d: 1.7, h: 1.5, y: 0.5 + fiada * 1.5, cor: (i + fiada) % 2 ? '#1d2c5e' : '#c9404f', giro: am }); }
  return out; });
/* a casinha branca do fundo da esquerda, do corredor pro alto */
const CASA = PT(176, 0.7);

export default {
  id: 'estadio-amigao', nome: 'Amigão', clubes: ['treze', 'campinense'], norte: 173.7, vazado: 0.3, folga: 26,
  chao: { cor: '#a39a80' },
  campo: { corMargem: '#5f9a50' },
  corMureta: BRANCO, alambrado: false, muro: { cor: '#d9d7cf' },
  aneis: [
    /* a pista de terra em volta do campo e a bacia de grama até o pé das arquibancadas */
    { dentro: PISTA_D, fora: PISTA_F, h: [0.1, 0.1], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#a8977a' }] },
    { dentro: PISTA_F, fora: I, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#5f9a50' }] },
    /* A VOLTA: um lance só. Concreto nas laterais (a parte coberta com as cadeiras azuis do corredor pra cima), terra e mato nos
       fundos, mais baixos */
    { dentro: I, fora: F, h: [2.4, 17.6], fileiras: 40, corredorFrente: 1.6,
      trechos: [
        { de: B1 - 360, ate: C0, ...RUINA }, { de: C0, ate: C1, ...DEGRAU, pinta: LATERAL }, { de: C1, ate: B0, ...RUINA },
        { de: B0, ate: T0, ...DEGRAU, pinta: LATERAL }, { de: T0, ate: T1, ...DEGRAU, pinta: COBERTA, cobertura: TELHADO }, { de: T1, ate: B1, ...DEGRAU, pinta: LATERAL }
      ] }
  ],
  fachada: { cor: '#cfcdc4' },
  refletores: [[-95, 86, 46], [92, 88, 46], [-94, -80, 46], [94, -84, 46]],
  blocos: [
    /* os quatro bancos de reserva, ao pé da lateral da cobertura */
    ...[-31, -9, 11, 33].map(u => ({ u, v: -53.4, w: 10, d: 2.4, h: 2.2, cor: '#e9e9e4' })),
    /* a casinha no fundo inacabado da esquerda */
    { u: CASA[0], v: CASA[1], w: 8, d: 10, h: 4.2, y: 5.6, cor: '#eeeeea' }, { u: CASA[0], v: CASA[1], w: 9, d: 11, h: 0.4, y: 9.8, cor: '#b9bbb8' },
    ...PILARES, ...LOSANGOS
  ],
  /* a câmera da foto de dia do dono: do alto, por trás do fundo da direita, com a cobertura à esquerda */
  vista: [150, 62, 44, -10, 0, -4],
  entorno: [
    { tipo: 'rua', de: [-200, 140], ate: [200, 140], larg: 12 }, { tipo: 'rua', de: [150, -200], ate: [150, 200], larg: 12 },
    { tipo: 'estacionamento', u: 40, v: -138, w: 120, d: 30 }, { tipo: 'quadra', u: -60, v: 150, w: 60, d: 40, cor: '#6f9a55' },
    { tipo: 'predio', u: -160, v: 60, w: 24, d: 24, h: 24, cor: '#d9d9d3' }, { tipo: 'predio', u: -168, v: 20, w: 22, d: 22, h: 20, cor: '#d4d7d9' },
    { tipo: 'casas', u: 0, v: 172, nu: 14, nv: 1, passo: 16 }, { tipo: 'arvores', u: -150, v: -80, w: 30, d: 60, n: 8 }
  ],
  jogo: { mandante1: [256, 286], mandante2: [216, 244], mandante3: [30, 56], visitante: [112, 148], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { torcida_jovem_do_galo: 'mandante1', faccao_jovem: 'mandante1' } }
};
