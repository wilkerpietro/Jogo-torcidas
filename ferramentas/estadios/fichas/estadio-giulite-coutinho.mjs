/* GIULITE COUTINHO (Edson Passos, America, Mesquita) — só pelo satélite: o
   dono pediu o estádio sem mandar fotos, a busca de imagens não devolve nada
   que preste e o mapa de imprensa de 2016 (o único com os setores) recusou o
   acesso. Dos avisos de ingresso de 2016 sei só que são quatro setores: A e
   B nas laterais, C atrás de um gol e D o da visitante. O campo corre quase
   norte-sul; no quadro o LESTE fica em cima e o NORTE à esquerda.
   Estádio "à inglesa": quatro arquibancadas RETAS, soltas, de degrau de
   cimento com a estrutura e as escadas vermelhas, longe do campo (uns 19 m
   atrás dos gols e 13 m nas laterais), com os quatro cantos abertos:
   · À ESQUERDA (norte) e À DIREITA (sul), as duas grandes de trás dos gols,
     gêmeas (uns 90 m por 20 m, vinte e poucos degraus), com três escadas
     vermelhas e, em cada uma, a caixa vermelha da boca de acesso perto da
     frente. (A do sul está na sombra no satélite: as bocas dela são
     espelhadas da do norte, não vistas.)
   · EMBAIXO (oeste), a lateral principal (121 m, uns treze degraus, cinco
     escadas vermelhas), com o prédio das cabines atrás e os três túneis
     vermelhos avançando no gramado; os bancos de reserva ficam deste lado.
   · EM CIMA (leste), a lateral mais rasa (uns oito degraus, cinco escadas
     vermelhas), com as cabines de telhado branco atrás e as caixas d'água.
   AS TORCIDAS: a visitante num dos fundos (pus no do sul) e a Sangue
   Americano no outro (escolha minha; não sei qual dos dois é o setor C). */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const CIM = '#a7a298', CIM2 = '#98938a', ESP = '#8c877e', VM = '#c2463c', CONC = '#928e86', BR = '#eceae4';
/* a beira de dentro, comum às quatro (o pé das arquibancadas); o fundo de cada uma é um retângulo com o mesmo trecho reto */
const I = { a: 71.75, b: 47.5, r: 0.5 };
const LAT = b => ({ a: 71.75, b, r: 0.5 }), FUN = a => ({ a, b: 47.5, r: 0.5 });
const DEGRAU = { cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corEspelho: ESP, corredor: 0, corEscada: VM, escadaNaBorda: true, vomitorios: false,
  paredeAtras: true, corFachada: CONC };
const BOCA = { f: 0.14, larg: 5, fundo: 5.5, cor: '#2b2523', corParapeito: VM };
/* um fundo: quatro blocos entre as três escadas vermelhas, com a boca em cima de cada escada (`s` = +1 no sul, -1 no norte) */
const FUNDO = (s, a, v0, v1, cortes, mais) => { const vs = s > 0 ? [v1, ...cortes.slice().reverse(), v0] : [v0, ...cortes, v1];
  return vs.slice(0, -1).map((v, i) => ({ ...DEGRAU, de: A(s * 71.75, v) - (s > 0 && v < 0 ? 360 : 0), ate: A(s * 71.75, vs[i + 1]) - (s > 0 && vs[i + 1] < 0 ? 360 : 0), fora: FUN(a), escadaNaBorda: i > 0,
    vomitorios: { ...BOCA, em: i === 0 ? [1] : i === vs.length - 2 ? [0] : [0, 1] }, ...mais })); };
/* uma lateral: blocos entre as escadas vermelhas (`s` = +1 no leste, -1 no oeste) */
const LATERAL = (s, b, u0, u1, cortes, mais) => { const us = s > 0 ? [u1, ...cortes.slice().reverse(), u0] : [u0, ...cortes, u1];
  return us.slice(0, -1).map((u, i) => ({ ...DEGRAU, de: A(u, s * 47.5), ate: A(us[i + 1], s * 47.5), fora: LAT(b), escadaNaBorda: i > 0, ...mais })); };
const SUL = FUNDO(1, 90, 45, -47, [30, -0.8, -30.4], { h: [1.5, 9.8], fileiras: 21 });
const LESTE = LATERAL(1, 55, -65.6, 56.9, [-47.1, -23.4, -3.1, 16.9, 39.85], { h: [1.5, 5], fileiras: 8 });
const NORTE = FUNDO(-1, 92.1, 40.8, -47, [25.4, -6.7, -33.75], { h: [1.5, 10.5], fileiras: 23 });
const OESTE = LATERAL(-1, 58, -61.8, 59.4, [-44.7, -15.6, -0.6, 14.4, 42.8], { h: [2, 7.5], fileiras: 13 });
const V = (a, b) => ({ de: a, ate: b, tipo: 'vazio' });

export default {
  id: 'estadio-giulite-coutinho', nome: 'Giulite Coutinho', clubes: ['america'], norte: 158.7, vazado: 0.2, folga: 26,
  chao: { cor: '#7f7b72' },
  campo: { corMargem: '#4a8b4b' },
  corMureta: VM, corAlambrado: '#b9bbb8',
  alambrado: { cor: '#c9cbc8', corBase: '#a39f97' },
  aneis: [
    /* a faixa ao pé das quatro arquibancadas, com a grade na beira de dentro: é por ela que se passa de uma à outra */
    { dentro: { a: 69.75, b: 45.5, r: 0.5 }, fora: I, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4a8b4b' }] },
    { dentro: I, fora: FUN(92.1), reto: true, h: [1.5, 10], fileiras: 22, corredorFrente: 1.6,
      trechos: [
        ...SUL, V(SUL[SUL.length - 1].ate, LESTE[0].de),
        ...LESTE, V(LESTE[LESTE.length - 1].ate, NORTE[0].de),
        ...NORTE, V(NORTE[NORTE.length - 1].ate, OESTE[0].de),
        ...OESTE, V(OESTE[OESTE.length - 1].ate, SUL[0].de + 360)
      ] }
  ],
  fachada: { cor: CONC },
  refletores: [],
  blocos: [
    /* OESTE: o prédio das cabines atrás da lateral principal, com as vigas vermelhas e as cabines em cima */
    { u: -1.2, v: -62.6, w: 121.2, d: 9.2, h: 7.6, cor: '#8f8b84' },
    { u: -1.2, v: -58.2, w: 121.2, d: 0.5, h: 0.5, y: 7.6, cor: VM }, { u: -1.2, v: -67, w: 121.2, d: 0.5, h: 0.5, y: 7.6, cor: VM },
    ...[[-45.8, 8.8], [-18.7, 4.6], [1.3, 11.2], [12.4, 9], [41.1, 10]].map(([u, w]) => ({ u, v: -60.6, w, d: 3.6, h: 2.8, y: 7.6, cor: '#b3aea4' })),
    /* os três túneis vermelhos que avançam no gramado, e os bancos de reserva */
    ...[-45.3, 0, 49].map(u => ({ u, v: -45.4, w: 3.2, d: 4.2, h: 2.4, cor: VM })),
    { u: -22.4, v: -42.4, w: 10, d: 1.8, h: 1.9, cor: '#e9e6df' }, { u: 25.3, v: -42.4, w: 11.5, d: 1.8, h: 1.9, cor: '#e9e6df' },
    /* LESTE: a laje de trás, as cabines de telhado branco, a marquise branca e as caixas d'água; o túnel vermelho */
    { u: -4.3, v: 58.6, w: 122.5, d: 7, h: 5, cor: '#8f8b84' },
    { u: -6, v: 57.6, w: 38.4, d: 5.6, h: 3, y: 5, cor: '#d9d5cb' }, { u: -6, v: 57.6, w: 39, d: 6.2, h: 0.25, y: 8, cor: BR },
    { u: -45, v: 55.8, w: 39, d: 1.6, h: 0.2, y: 7.6, cor: BR, cobertura: true },
    { u: 37.6, v: 58.6, w: 28.8, d: 3.6, h: 2.6, y: 5, cor: '#d9d5cb' }, { u: 37.6, v: 58.6, w: 29.4, d: 4.2, h: 0.25, y: 7.6, cor: BR },
    ...[30, 36, 46, 49.5].map(u => ({ u, v: 60.8, w: 2, d: 2, h: 1.8, y: 5, cor: '#5d5a55' })),
    { u: -49.5, v: 43.6, w: 2.2, d: 4, h: 2.4, cor: VM }
  ],
  /* de cima do canto sudoeste, pra ver as quatro arquibancadas soltas */
  vista: [88, 52, -98, -8, 0, 4],
  entorno: [
    /* em cima (leste): o terreno e os galpões grandes */
    { tipo: 'grama', u: -10, v: 78, w: 130, d: 24, cor: '#7c9a5f' }, { tipo: 'predio', u: -10, v: 118, w: 70, d: 34, h: 11, cor: '#b9b6ae' }, { tipo: 'predio', u: 74, v: 126, w: 60, d: 44, h: 12, cor: '#c9c6be' },
    /* à direita (sul): os campos de treino */
    { tipo: 'grama', u: 150, v: 20, w: 90, d: 130, cor: '#5f9a55' },
    /* embaixo (oeste): o gramado de fora, a rua e as casas */
    { tipo: 'grama', u: -5, v: -80, w: 140, d: 16, cor: '#739a5a' }, { tipo: 'rua', de: [-150, -94], ate: [150, -94], larg: 8 },
    { tipo: 'casas', u: 0, v: -108, nu: 16, nv: 1, passo: 15 }, { tipo: 'casas', u: 0, v: -124, nu: 16, nv: 1, passo: 15 },
    /* à esquerda (norte): o estacionamento e a rua */
    { tipo: 'estacionamento', u: -110, v: -40, w: 24, d: 50, cheio: 0.3 }, { tipo: 'rua', de: [-128, -130], ate: [-128, 130], larg: 9 }, { tipo: 'arvores', u: -112, v: 30, w: 14, d: 50, n: 6 }
  ],
  jogo: { mandante1: [163, 185], mandante2: [245, 295], mandante3: [70, 110], visitante: [-22, 20], tunelMandante: 270, tunelVisitante: 0, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { sangue_americano: 'mandante1' } }
};
