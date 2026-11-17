/* JUNCO (Estádio Municipal Plácido Aderaldo Castelo, Guarany de Sobral, Sobral)
   — pelas cinco fotos que o dono mandou (17/11/2026: "Vamos pro Junco agora. A
   última foto é antiga mas é boa pra entender o desenho da pintura da
   arquibancada": duas das arquibancadas vistas do campo, o pórtico da entrada,
   a tribuna de perto e uma aérea antiga) e pelo satélite (o do Google,
   nítido). O rumo do campo, 161 graus, saiu do gramado no OpenStreetMap.
   No quadro a tribuna das cabines fica EMBAIXO.
   Um OVAL com a pista de terra em volta do gramado e o muro branco baixo, com
   o alambrado azul, por fora dela. As arquibancadas são de DEGRAU PINTADO, sem
   cadeira, em trechos AZUIS e CINZA alternados, com as escadas amarelas na
   divisa de cada um e o muro azul no alto:
   · EM CIMA, o arco comprido, de cinco trechos (cinza, azul, cinza, azul,
     cinza), com o placar no alto e o letreiro SOBRAL no chão, à frente;
   · À ESQUERDA e À DIREITA, as duas curvas de trás dos gols, mais rasas, cada
     uma com um trecho azul no meio;
   · EMBAIXO, solta do oval, a TRIBUNA: reta, mais funda e mais alta, cinza com
     o trecho azul no meio, e no alto dela o prédio branco comprido das cabines,
     de telhado azul; atrás, pra rua, o PÓRTICO da entrada: três arcos brancos
     de meia-lua, cada um com o anel azul no meio, entre pilares azuis e
     brancos, com as grades cor de vinho.
   ESTIMADO: as alturas (o anel a 4,6 m, a tribuna a 8,6); onde começa e acaba
   cada trecho de cor nas duas curvas (medi no satélite, mas ali a tinta está
   mais apagada); o pórtico, que saiu em degraus de caixa em vez de meia-lua, e
   as medidas dele; o placar; as torres de luz. As fotos de dentro mostram o
   azul mais vivo que o satélite: fiquei com o das fotos.
   AS TORCIDAS (escolha minha): a Força Jovem Guarany no meio da tribuna, com
   apoio no arco de cima e na curva da esquerda; a visitante na curva da
   direita. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AZUL = '#2f55c4', AZUL2 = '#2a4db6', CINZA = '#9aa3b0', CINZA2 = '#8f98a6', AMARELO = '#e3b63a', MURO = '#2a3fa6', BRANCO = '#f1f1ed', TERRA = '#a98e6b';
/* o oval: por dentro 180 m por 104, por fora 206 por 136 (o arco de cima é mais fundo que as curvas) */
const E = (a, b) => ({ a, b, forma: 'elipse' });
const I = E(90, 52), F = E(103, 68);
/* a tribuna: reta, de u = -36 a 37, do v = -57 ao -72 */
const TI = { a: 220, b: 57, r: 0.5 }, TF = { a: 220, b: 72, r: 0.5 };
/* um trecho de degrau pintado, com a escada amarela na divisa */
const DEGRAU = (cor, cor2, mais) => ({ cor, cor2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, espelhoPintado: true, corEscada: AMARELO, corredor: 0, escadaNaBorda: true, vomitorios: false,
  paredeAtras: true, corFachada: MURO, corLado: MURO, parapeito: 1.4, corMureta: MURO, ...mais });
const AZ = mais => DEGRAU(AZUL, AZUL2, mais), CZ = mais => DEGRAU(CINZA, CINZA2, mais);
/* o PÓRTICO: três arcos em degraus de caixa (a meia-lua branca), o anel azul no meio de cada um, os quatro pilares e as grades */
const PU = 6, PV = -93;
const PORTICO = [
  ...[-14.7, -4.9, 4.9, 14.7].flatMap((d, i) => [{ u: PU + d, v: PV, w: 1.5, d: 1.2, h: 9 + (i === 1 || i === 2 ? 1 : 0), cor: BRANCO }, { u: PU + d, v: PV - 0.65, w: 0.7, d: 0.2, h: 9 + (i === 1 || i === 2 ? 1 : 0), cor: MURO }]),
  ...[-9.8, 0, 9.8].flatMap(d => [
    { u: PU + d, v: PV, w: 8.4, d: 0.5, h: 0.4, y: 5, cor: BRANCO }, { u: PU + d, v: PV, w: 8.2, d: 0.4, h: 1.5, y: 5.4, cor: BRANCO },
    { u: PU + d, v: PV, w: 6.8, d: 0.4, h: 1.2, y: 6.9, cor: BRANCO }, { u: PU + d, v: PV, w: 4.4, d: 0.4, h: 0.8, y: 8.1, cor: BRANCO },
    { u: PU + d, v: PV - 0.25, w: 1.7, d: 0.15, h: 1.7, y: 5.9, cor: MURO }, { u: PU + d, v: PV - 0.3, w: 0.9, d: 0.15, h: 0.9, y: 6.3, cor: '#cfe0ee' },
    { u: PU + d, v: PV + 0.2, w: 8.2, d: 0.15, h: 5, cor: '#8f3b3b' }, { u: PU + d, v: PV - 0.1, w: 8.4, d: 0.3, h: 0.35, y: 2.6, cor: MURO }]),
  { u: PU, v: PV - 0.3, w: 0.25, d: 6.6, h: 1.1, y: 7, cor: BRANCO, giro: -90, texto: 'ESTÁDIO PLÁCIDO ADERALDO CASTELO', corTexto: '#2c2f3a', textoFace: true, textoLargura: 0.96, textoAltura: 0.42 }
];

export default {
  id: 'estadio-junco', nome: 'Junco', clubes: ['guarany-de-sobral'], norte: 161, vazado: 0.3, folga: 32,
  chao: { cor: '#b3a587' },
  campo: { corMargem: '#5c9a52' },
  corMureta: BRANCO, muro: { cor: '#e6e6e1' },
  /* o alambrado azul, em cima do muro branco de volta da pista */
  alambrado: { cor: '#2f47a8', limiar: 5 },
  aneis: [
    /* o MURO BRANCO baixo, de volta inteira (vem primeiro: é na beira dele que o alambrado nasce) */
    { dentro: E(88, 50), fora: E(88.4, 50.4), h: [0.04, 0.08], fileiras: 1, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, cor: BRANCO, cor2: BRANCO, padrao: 'mosaico', mistura: 0, semCadeiras: true, espelhoPintado: true, corredor: 0, vomitorios: false, paredeAtras: false, corMureta: BRANCO }] },
    /* a pista de terra e o chão até o pé das arquibancadas */
    { dentro: { a: 55.5, b: 37, r: 0.5 }, fora: E(88, 50), h: [0.06, 0.06], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: TERRA }] },
    { dentro: E(88.4, 50.4), fora: F, h: [0.07, 0.07], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#b5a88c' }] },
    /* AS ARQUIBANCADAS, por último (é a beira de fora delas que fecha a área) */
    { dentro: I, fora: F, h: [0.9, 4.6], fileiras: 11, corredorFrente: 1.2, passoFileira: 1.2,
      trechos: [
        /* À DIREITA, a curva de trás do gol: cinza, o azul no meio, cinza */
        { de: A(72, -44) - 360, ate: 0, ...CZ() }, { de: 0, ate: 17, ...AZ() }, { de: 17, ate: 37.5, ...CZ() },
        { de: 37.5, ate: 39.6, tipo: 'vazio' },
        /* EM CIMA, o arco comprido: cinza, azul, cinza, azul, cinza */
        { de: 39.6, ate: 60.5, ...CZ() }, { de: 60.5, ate: 81, ...AZ() }, { de: 81, ate: 102.3, ...CZ() }, { de: 102.3, ate: 122.9, ...AZ() }, { de: 122.9, ate: 140.4, ...CZ() },
        { de: 140.4, ate: 144.5, tipo: 'vazio' },
        /* À ESQUERDA, a outra curva */
        { de: 144.5, ate: 173, ...CZ() }, { de: 173, ate: 185.5, ...AZ() }, { de: 185.5, ate: A(-74, -46), ...CZ() },
        { de: A(-74, -46), ate: A(-36, -57), tipo: 'vazio' },
        /* EMBAIXO, a TRIBUNA, reta, mais funda e mais alta */
        { de: A(-36, -57), ate: A(-8, -57), dentro: TI, fora: TF, reto: true, h: [1.2, 8.6], passoFileira: 0.95, ...CZ({ corFachada: BRANCO }) },
        { de: A(-8, -57), ate: A(9, -57), dentro: TI, fora: TF, reto: true, h: [1.2, 8.6], passoFileira: 0.95, ...AZ({ corFachada: BRANCO }) },
        { de: A(9, -57), ate: A(37, -57), dentro: TI, fora: TF, reto: true, h: [1.2, 8.6], passoFileira: 0.95, ...CZ({ corFachada: BRANCO, escadaNaBorda: true }) },
        { de: A(37, -57), ate: A(72, -44), tipo: 'vazio' }
      ] }
  ],
  fachada: { cor: MURO },
  refletores: [[-45, 74, 30], [44, 77, 30], [-44, -80, 30], [48, -80, 30]],
  blocos: [
    /* o prédio branco das cabines, no alto da tribuna: as janelas, a faixa azul embaixo e o telhado azul */
    { u: 0.5, v: -75.2, w: 73, d: 6, h: 13, cor: BRANCO }, { u: 0.5, v: -72.15, w: 68, d: 0.2, h: 1.3, y: 10.6, cor: '#5b6470' },
    { u: 0.5, v: -72.1, w: 73, d: 0.25, h: 1.2, y: 8.6, cor: MURO }, { u: 0.5, v: -75.2, w: 74.4, d: 7.2, h: 0.35, y: 13, cor: MURO },
    /* os bancos de reserva, ao pé dela, e o placar no alto do arco de cima, em cima da treliça */
    { u: -12, v: -48, w: 8, d: 2.2, h: 2, cor: '#e6e8ea' }, { u: 12, v: -48, w: 8, d: 2.2, h: 2, cor: '#e6e8ea' },
    { u: 8, v: 69.4, w: 15, d: 0.8, h: 3.2, y: 8.2, cor: '#17181c' }, { u: 2, v: 69.4, w: 0.5, d: 0.8, h: 8.2, cor: '#8d9093' }, { u: 14, v: 69.4, w: 0.5, d: 0.8, h: 8.2, cor: '#8d9093' },
    /* o letreiro SOBRAL no chão, à frente do arco de cima, de frente pra ele */
    { u: 0, v: 46.5, w: 16, d: 3.4, h: 0.12, cor: '#b5a88c', texto: 'SOBRAL', corTexto: '#3b3a36', textoGiro: 180, textoLargura: 0.96, textoAltura: 0.9 },
    ...PORTICO
  ],
  /* a câmera da aérea antiga do dono: do alto, por trás do arco de cima, olhando a tribuna */
  vista: [30, 95, 185, 0, 0, -10],
  entorno: [
    { tipo: 'rua', de: [-200, 96], ate: [0, 150], larg: 16 }, { tipo: 'rua', de: [-110, -200], ate: [-90, 40], larg: 9 },
    { tipo: 'rua', de: [60, -110], ate: [200, -60], larg: 10 }, { tipo: 'predio', u: 36, v: 100, w: 46, d: 40, h: 11, cor: '#c9cdd0' },
    { tipo: 'casas', u: 140, v: 40, nu: 3, nv: 6, passo: 16 }, { tipo: 'casas', u: 30, v: 150, nu: 8, nv: 1, passo: 15 },
    { tipo: 'arvores', u: -120, v: 40, w: 20, d: 80, n: 8 }
  ],
  jogo: { mandante1: [258, 284], mandante2: [78, 104], mandante3: [160, 192], visitante: [-14, 18], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { forca_jovem_guarany: 'mandante1' } }
};
