/* GIULITE COUTINHO (Edson Passos, America, Mesquita) — pelo satélite (três
   fontes) e pelas cinco fotos que o dono mandou depois da primeira versão
   (16/11/2026): a lateral de cabines com um fundo, a lateral principal antiga,
   o fundo CAMPEÃO DOS CAMPEÕES visto de uma lateral então coberta, o fundo
   AMERICA UNIDO VENCERÁS de frente e uma recente, com esse fundo e a lateral
   principal. Dos avisos de ingresso de 2016 sei só que são quatro setores: A
   e B nas laterais, C atrás de um gol e D o da visitante. O campo corre quase
   norte-sul; no quadro o LESTE fica em cima e o NORTE à esquerda.
   Estádio "à inglesa": quatro arquibancadas RETAS, soltas, ELEVADAS (o
   primeiro degrau fica a uns 3 m do chão), de degrau de cimento com as
   escadas, as grades e as paredes vermelhas, longe do campo (uns 19 m atrás
   dos gols e 13 m nas laterais), com os quatro cantos abertos e uma torre de
   refletores em cada canto:
   · À ESQUERDA (norte), o fundo CAMPEÃO DOS CAMPEÕES (a faixa vermelha no
     alto): uns 90 m por 20 m, vinte e poucos degraus, três escadas vermelhas
     com a caixa da boca de acesso em cima de cada uma, perto da frente.
   · À DIREITA (sul), o fundo AMERICA UNIDO VENCERÁS, gêmeo, mas SEM as
     caixas: as três escadas vão de cima a baixo; na frente dele, o placar.
   · EMBAIXO (oeste), a lateral principal (121 m, uns treze degraus, hoje
     pintados de branco, cinco escadas vermelhas), com o muro vermelho de
     trás (o escudo e AMERICA), o bloco vermelho das cabines na ponta sul, a
     caixa branca da torre no meio, a armação vermelha por cima e os três
     túneis vermelhos avançando no gramado. Uma foto antiga mostra a ponta
     norte dela COBERTA de telha, com cadeiras cinza; os três satélites e a
     foto recente não mostram mais telhado (sobraram os tirantes atrás), e
     fiz sem.
   · EM CIMA (leste), a lateral mais rasa (uns oito degraus de cimento, cinco
     escadas vermelhas), com o muro vermelho, os toldos brancos das cabines e
     a caixa d'água branca atrás; os bancos de reserva (os de cobertura
     transparente) ficam deste lado.
   AS TORCIDAS: a visitante num dos fundos (pus no do sul) e a Sangue
   Americano no outro (escolha minha; não sei qual dos dois é o setor C). */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const CIM = '#b4af9f', CIM2 = '#a5a091', ESP = '#97927f', VM = '#c8372d', CONC = '#928e86', BR = '#eceae4', SOMBRA = '#4d4340', BCO = '#f2f0ea', BCO2 = '#e9e6df';
/* a beira de dentro, comum às quatro (o pé das arquibancadas); o fundo de cada uma é um retângulo com o mesmo trecho reto */
const I = { a: 71.75, b: 47.5, r: 0.5 };
const LAT = b => ({ a: 71.75, b, r: 0.5 }), FUN = a => ({ a, b: 47.5, r: 0.5 });
const DEGRAU = { cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corEspelho: ESP, corredor: 0, corEscada: VM, escadaNaBorda: true, vomitorios: false,
  paredeAtras: true, corFachada: VM, corLado: VM, corAlambrado: VM };
const BOCA = { f: 0.14, larg: 5, fundo: 5.5, cor: '#2b2523', corParapeito: VM };
/* um fundo: quatro blocos entre as três escadas vermelhas, com a boca em cima de cada escada (`s` = +1 no sul, -1 no norte) */
const FUNDO = (s, a, v0, v1, cortes, mais, comBoca = true) => { const vs = s > 0 ? [v1, ...cortes.slice().reverse(), v0] : [v0, ...cortes, v1];
  return vs.slice(0, -1).map((v, i) => ({ ...DEGRAU, de: A(s * 71.75, v) - (s > 0 && v < 0 ? 360 : 0), ate: A(s * 71.75, vs[i + 1]) - (s > 0 && vs[i + 1] < 0 ? 360 : 0), fora: FUN(a), escadaNaBorda: i > 0,
    vomitorios: comBoca ? { ...BOCA, em: i === 0 ? [1] : i === vs.length - 2 ? [0] : [0, 1] } : false, ...mais })); };
/* uma lateral: blocos entre as escadas vermelhas (`s` = +1 no leste, -1 no oeste) */
const LATERAL = (s, b, u0, u1, cortes, mais) => { const us = s > 0 ? [u1, ...cortes.slice().reverse(), u0] : [u0, ...cortes, u1];
  return us.slice(0, -1).map((u, i) => ({ ...DEGRAU, de: A(u, s * 47.5), ate: A(us[i + 1], s * 47.5), fora: LAT(b), escadaNaBorda: i > 0, ...mais })); };
const SUL = FUNDO(1, 90, 45, -47, [30, -0.8, -30.4], { h: [2.8, 10.8], fileiras: 21, corMureta: SOMBRA, parapeito: 2.2 }, false);
const LESTE = LATERAL(1, 55, -65.6, 56.9, [-47.1, -23.4, -3.1, 16.9, 39.85], { h: [2.8, 6], fileiras: 8, parapeito: 2 });
const NORTE = FUNDO(-1, 92.1, 40.8, -47, [25.4, -6.7, -33.75], { h: [2.8, 11.5], fileiras: 23, corMureta: SOMBRA, parapeito: 2.2 });
const OESTE = LATERAL(-1, 58, -61.8, 59.4, [-44.7, -15.6, -0.6, 14.4, 42.8], { h: [3.2, 8.4], fileiras: 13, cor: BCO, cor2: BCO2, mistura: 0.25, corEspelho: '#e6e3dc', parapeito: 2.2 });
const V = (a, b) => ({ de: a, ate: b, tipo: 'vazio' });

export default {
  id: 'estadio-giulite-coutinho', nome: 'Giulite Coutinho', clubes: ['america'], norte: 158.7, vazado: 0.2, folga: 26,
  chao: { cor: '#7f7b72' },
  campo: { corMargem: '#4a8b4b' },
  corMureta: VM, corAlambrado: VM,
  /* a grade vermelha em cima da mureta cinza, em volta do gramado */
  alambrado: { cor: VM, corBase: '#8f8e89', h: 2 },
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
  /* as quatro torres de refletores, uma em cada canto (a do nordeste não aparece em foto nenhuma: é por simetria) */
  refletores: [[66, 57, 38], [67, -57, 38], [-67, -57, 38], [-67, 57, 38]],
  blocos: [
    /* os dizeres dos dois fundos, na faixa vermelha do alto */
    { u: -92.3, v: -3, w: 0.4, d: 86, h: 2.2, y: 11.5, cor: VM, texto: 'CAMPEÃO        DOS        CAMPEÕES', corTexto: '#f4f2ec', textoFace: true, textoLargura: 0.9, textoAltura: 0.5 },
    { u: 90.2, v: -1, w: 0.4, d: 90, h: 2.2, y: 10.8, cor: VM, texto: 'AMERICA        UNIDO        VENCERÁS', corTexto: '#f4f2ec', textoFace: true, giro: 180, textoLargura: 0.9, textoAltura: 0.5 },
    /* o placar, na frente do fundo sul */
    { u: 68.4, v: -11, w: 0.6, d: 11, h: 2.6, y: 1.2, cor: '#1c1d20' }, { u: 68.4, v: -15.5, w: 0.3, d: 0.3, h: 1.2, cor: '#5b5b5b' }, { u: 68.4, v: -6.5, w: 0.3, d: 0.3, h: 1.2, cor: '#5b5b5b' },
    /* OESTE: o prédio de trás da lateral principal, o muro vermelho com AMERICA, o bloco vermelho das cabines na ponta sul,
       a caixa branca da torre no meio e a armação vermelha por cima */
    { u: -1.2, v: -62.6, w: 121.2, d: 9.2, h: 8.4, cor: '#8f8b84' },
    { u: -1.2, v: -58.3, w: 121.2, d: 0.5, h: 2.2, y: 8.4, cor: VM },
    { u: 14, v: -58, w: 0.3, d: 34, h: 2, y: 8.5, cor: VM, texto: 'AMERICA', corTexto: '#f4f2ec', textoFace: true, giro: 90, textoLargura: 0.45, textoAltura: 0.55 },
    { u: 44, v: -61, w: 28, d: 5, h: 4.6, y: 8.4, cor: VM }, { u: 1.3, v: -61.2, w: 6.5, d: 5, h: 6.2, y: 8.4, cor: BR }, { u: 1.3, v: -58.6, w: 3, d: 0.2, h: 1.4, y: 12.4, cor: '#2c3138' },
    { u: -45.8, v: -61, w: 8.8, d: 3.6, h: 2.8, y: 8.4, cor: '#b3aea4' }, { u: -18.7, v: -61, w: 4.6, d: 3.6, h: 2.8, y: 8.4, cor: '#b3aea4' },
    { u: -1.2, v: -66.4, w: 121.2, d: 0.35, h: 0.35, y: 13.6, cor: VM, cobertura: true },
    ...[-60, -45, -30, -15, 15, 30, 59].map(u => ({ u, v: -66.4, w: 0.35, d: 0.35, h: 5.2, y: 8.4, cor: VM })),
    /* os três túneis vermelhos que avançam no gramado */
    ...[-45.3, 0, 49].map(u => ({ u, v: -45.4, w: 3.2, d: 4.2, h: 2.4, cor: VM })),
    /* LESTE: a laje de trás, o muro vermelho, as cabines com os toldos brancos, a caixa d'água branca na torre; o túnel vermelho */
    { u: -4.3, v: 58.6, w: 122.5, d: 7, h: 6, cor: '#8f8b84' }, { u: -4.3, v: 55.3, w: 122.5, d: 0.5, h: 2, y: 6, cor: VM },
    { u: -6, v: 58, w: 38.4, d: 5.2, h: 3, y: 6, cor: VM }, { u: -6, v: 57.6, w: 39, d: 6.4, h: 0.25, y: 9, cor: BR },
    { u: -45, v: 56.2, w: 39, d: 1.8, h: 0.2, y: 8.4, cor: BR },
    { u: 37.6, v: 58.6, w: 28.8, d: 3.6, h: 2.6, y: 6, cor: VM }, { u: 37.6, v: 58.6, w: 29.4, d: 4.2, h: 0.25, y: 8.6, cor: BR },
    { u: 24, v: 59.4, w: 3, d: 3, h: 3.4, y: 6, cor: '#a8a49b' }, { u: 24, v: 59.4, w: 3.4, d: 3.4, h: 3, y: 9.4, cor: '#f1f0ea' },
    { u: -49.5, v: 43.6, w: 2.2, d: 4, h: 2.4, cor: VM },
    /* os bancos de reserva de cobertura transparente, do lado leste */
    { u: -19, v: 41.6, w: 10, d: 2, h: 2.1, cor: '#dfe7ea' }, { u: 19, v: 41.6, w: 10, d: 2, h: 2.1, cor: '#dfe7ea' }
  ],
  /* a câmera da foto recente do dono: da lateral leste, com o fundo AMERICA UNIDO VENCERÁS à esquerda e a lateral principal ao fundo */
  vista: [-30, 12, 44, 60, 4, -45],
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
