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
     de degrau de concreto claro, em dois lances separados pela faixa branca do
     corredor, com as escadas brancas e as caixas das bocas;
   · na de BAIXO, a metade da direita fica debaixo da COBERTURA escura, em
     balanço, com as CADEIRAS AZUIS no lance de cima; os quatro bancos de
     reserva ficam ao pé dela;
   · os DOIS FUNDOS, atrás dos gols, são INACABADOS: os degraus de terra,
     tomados de mato, mais baixos que as laterais, com a faixa branca do corredor
     no meio; no da esquerda, uma casinha.
   ESTIMADO: as alturas (as laterais sobem uns 17 m); a divisa dos dois lances
   (pus no meio); onde começa e acaba a cobertura (o satélite a mostra deslocada,
   com a sombra) e a fundura dela; a posição das escadas e das bocas; as torres
   de luz.
   AS TORCIDAS (escolha minha): a da casa no meio da lateral da cobertura, com
   o apoio nela e na ponta da outra lateral; a visitante na outra lateral, do
   lado oposto. Os fundos inacabados ficam vazios. */
const CONC = '#c9c8c1', CONC2 = '#bcbbb4', BRANCO = '#f0f0ec', AZUL = '#3f6fb8', AZUL2 = '#3763a8', TERRA = '#8b8266', MATO = '#6f8752';
/* a pista em volta do campo (retângulo de pontas redondas) e as elipses das arquibancadas, 4 m pro lado de cima */
const E = (a, b) => ({ a, b, cv: 4, forma: 'elipse' });
const PISTA_D = { a: 71, b: 42.5, r: 36 }, PISTA_F = { a: 76, b: 47.5, r: 41 };
const I = E(85, 61.5), M = E(104.5, 80), F = E(124, 98.5);
/* onde começa e acaba cada lateral (graus, do meio do campo) e a cobertura */
const C0 = 22.7, C1 = 157.3, B0 = 204, B1 = 335, T0 = 266, T1 = 322;
const DEGRAU = { cor: CONC, cor2: CONC2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corEscada: BRANCO, corredor: 21, corFachada: '#cfcdc4', corLado: '#d9d7cf' };
const RUINA = { cor: TERRA, cor2: MATO, padrao: 'mosaico', mistura: 0.5, semCadeiras: true, corredor: 0, vomitorios: false, corFachada: '#b9b6ab', corLado: '#b9b6ab', parapeito: 0.8 };
const TELHADO = { h: 23, larg: 21, avanco: 6, cai: 0.8, cor: '#2f3136', cor2: '#383a40', listras: true, corBaixo: '#55585e', trelica: false, corPilar: '#d9d7cf' };
/* os trechos da volta: o fundo da direita, a lateral de cima, o fundo da esquerda e a lateral de baixo (a parte coberta à parte) */
const VOLTA = (ruina, lateral, coberta) => [
  { de: B1 - 360, ate: C0, ...ruina }, { de: C0, ate: C1, ...lateral }, { de: C1, ate: B0, ...ruina },
  { de: B0, ate: T0, ...lateral }, { de: T0, ate: T1, ...coberta }, { de: T1, ate: B1, ...lateral }];

export default {
  id: 'estadio-amigao', nome: 'Amigão', clubes: ['treze', 'campinense'], norte: 173.7, vazado: 0.3, folga: 26,
  chao: { cor: '#a39a80' },
  campo: { corMargem: '#5f9a50' },
  corMureta: BRANCO, alambrado: false, muro: { cor: '#d9d7cf' },
  aneis: [
    /* a pista de terra em volta do campo e a bacia de grama até o pé das arquibancadas */
    { dentro: PISTA_D, fora: PISTA_F, h: [0.1, 0.1], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#a8977a' }] },
    { dentro: PISTA_F, fora: I, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#5f9a50' }] },
    /* o lance de BAIXO: concreto nas laterais, terra e mato nos fundos */
    { dentro: I, fora: M, h: [2.4, 9.6], fileiras: 20, corredorFrente: 1.6,
      trechos: VOLTA({ ...RUINA, h: [1.4, 4.6] }, { ...DEGRAU, vomitorios: false }, { ...DEGRAU, vomitorios: false }) },
    /* o lance de CIMA, atrás da faixa branca do corredor: as caixas das bocas; debaixo da cobertura, as cadeiras azuis */
    { dentro: M, fora: F, h: [10.4, 17.6], fileiras: 20, corredorFrente: 1.8, corMureta: BRANCO,
      trechos: VOLTA({ ...RUINA, h: [5, 8.4] }, { ...DEGRAU, vomitorios: { f: 0.04, cada: 1, larg: 3.6, fundo: 3.2, corParapeito: BRANCO }, paredeAtras: true, parapeito: 1.4 },
        { ...DEGRAU, semCadeiras: false, cor: AZUL, cor2: AZUL2, pisoPintado: true, vomitorios: { f: 0.04, cada: 1, larg: 3.6, fundo: 3.2, corParapeito: BRANCO }, paredeAtras: true, parapeito: 1.4,
          cobertura: TELHADO }) }
  ],
  fachada: { cor: '#cfcdc4' },
  refletores: [[-95, 86, 46], [92, 88, 46], [-94, -80, 46], [94, -84, 46]],
  blocos: [
    /* os quatro bancos de reserva, ao pé da lateral da cobertura */
    ...[-31, -9, 11, 33].map(u => ({ u, v: -53.4, w: 10, d: 2.4, h: 2.2, cor: '#e9e9e4' })),
    /* a casinha no fundo inacabado da esquerda */
    { u: -113, v: 16, w: 9, d: 9, h: 4, y: 5.6, cor: '#b9b6ad' }, { u: -113, v: 16, w: 10, d: 10, h: 0.4, y: 9.6, cor: '#8f8c84' }
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
