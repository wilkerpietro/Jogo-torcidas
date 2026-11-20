/* FREI EPIFÂNIO (Estádio Municipal Frei Epifânio d'Abadia, Imperatriz) — SEM
   FOTOS DO DONO (17/11/2026: "os últimos estádios que faltam, os do
   Maranhão/Piauí. Castelão, Albertão e Frei Epifânio"; o Imperatriz, que nos
   dados mandava no Castelão de São Luís, passa a mandar aqui): pelo satélite
   (o do Google, nítido) e por uma aérea do acervo livre da Wikimedia, sem
   data, tirada por cima da entrada. O rumo do campo, 50 graus, saiu do
   gramado no OpenStreetMap.
   No quadro a lateral coberta fica EMBAIXO e a entrada à ESQUERDA.
   Quatro arquibancadas coladas no gramado, de cadeiras AZUL-CLARAS:
   · EM CIMA, a lateral descoberta, de 100 m por 15, que dobra em CURVA nos dois
     cantos e emenda com as de trás dos gols;
   · À ESQUERDA, atrás do gol, a de 16 m de fundura; por trás dela, pra rua, a
     FACHADA da entrada: a parede clara com os painéis cor de vinho e o
     letreiro ESTÁDIO FREI EPIFÂNIO no meio;
   · À DIREITA, atrás do outro gol, a mais rasa (11 m);
   · EMBAIXO, solta das outras, a lateral COBERTA: o telhado branco de 110 m,
     as cadeiras azuis com o bloco vermelho no meio e as cabines no alto;
   · quatro torres de luz brancas, nos cantos.
   ESTIMADO: as alturas (a lateral descoberta a 7,5 m, o telhado a 13); o tom
   das cadeiras (no satélite estão desbotadas; fiquei com o azul da aérea); o
   tamanho do bloco vermelho e das cabines; os painéis da fachada. O gramado no
   quadro fica 2,5 m fora do meio; centrei tudo.
   AS TORCIDAS (escolha minha): a Força Jovem Cavalina no meio da lateral
   descoberta, com apoio atrás do gol da entrada e na coberta; a visitante
   atrás do outro gol. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AZUL = '#4f9fd6', AZUL2 = '#4491c8', VERMELHO = '#c0463f', VERMELHO2 = '#b33c36', BRANCO = '#efefea', VINHO = '#7a3030', PAREDE = '#dcdcd6';
/* a beira do gramado (canto redondo de centro (50,5; 42)) e os fundos: 15 m em cima, 16 à esquerda, 11 à direita */
const I = { a: 58.5, b: 50, r: 8 }, FE = { a: 74.5, b: 65, r: 24 }, FD = { a: 69.5, b: 65, r: 19 };
/* a coberta: reta, do v = -46 ao -63,5 */
const CI = { a: 220, b: 46, r: 0.5 }, CF = { a: 220, b: 63.5, r: 0.5 };
const CADEIRA = (cor, cor2, mais) => ({ cor, cor2, padrao: 'mosaico', mistura: 0.35, corEscada: '#d9d9d3', corredor: 14, vomitorios: false, paredeAtras: true, corFachada: PAREDE, corLado: PAREDE, parapeito: 1.1, ...mais });
const TELHADO = { h: 13.4, larg: 17.5, avanco: 0.6, cai: -0.8, cor: '#f1f1ed', cor2: '#e6e6e1', listras: true, corBaixo: '#cfcfca', trelica: false, pilares: false, pelaColuna: true };
const COBERTA = (u0, u1, cor, cor2) => ({ de: A(u0, -46), ate: A(u1, -46), dentro: CI, fora: CF, reto: true, h: [1.2, 8.6], ...CADEIRA(cor, cor2, { corredor: 12, cobertura: TELHADO }) });

export default {
  id: 'estadio-frei-epifanio', nome: 'Frei Epifânio', clubes: ['imperatriz'], norte: 50, vazado: 0.3, folga: 22,
  chao: { cor: '#b0a590' },
  campo: { corMargem: '#5c9a52' },
  corMureta: '#d9d9d3', alambrado: { cor: '#eef0f0', limiar: 4 },
  aneis: [
    /* a MURETA do gramado, de volta inteira (vem primeiro: o alambrado nasce na beira dela) */
    { dentro: { a: 57.8, b: 45.2, r: 3 }, fora: { a: 58.1, b: 45.5, r: 3.3 }, reto: true, h: [0.04, 0.08], fileiras: 1, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, cor: '#d9d9d3', cor2: '#d9d9d3', padrao: 'mosaico', mistura: 0, semCadeiras: true, espelhoPintado: true, corredor: 0, vomitorios: false, paredeAtras: false }] },
    /* a grama em volta do campo e o chão até o pé das arquibancadas */
    { dentro: { a: 54.5, b: 36, r: 0.5 }, fora: { a: 57.8, b: 45.2, r: 3 }, reto: true, h: [0.08, 0.08], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#5c9a52' }] },
    { dentro: { a: 58.1, b: 45.5, r: 3.3 }, fora: { a: 76, b: 66, r: 24 }, reto: true, h: [0.06, 0.06], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#bdb8a8' }] },
    /* AS ARQUIBANCADAS, por último */
    { dentro: I, fora: FE, reto: true, h: [1.2, 7.6], fileiras: 15, corredorFrente: 1.2,
      trechos: [
        /* À DIREITA, atrás do gol: a mais rasa */
        { de: A(58.5, -42) - 360, ate: A(58.5, 42), fora: FD, h: [1.2, 5.8], ...CADEIRA(AZUL, AZUL2) },
        { de: A(58.5, 42), ate: A(50.5, 50), fora: FD, ...CADEIRA(AZUL, AZUL2, { corredor: 0 }) },
        /* EM CIMA, a lateral descoberta, e os dois cantos em curva */
        { de: A(50.5, 50), ate: A(-50.5, 50), ...CADEIRA(AZUL, AZUL2) },
        { de: A(-50.5, 50), ate: A(-58.5, 42), ...CADEIRA(AZUL, AZUL2, { corredor: 0 }) },
        /* À ESQUERDA, atrás do gol da entrada */
        { de: A(-58.5, 42), ate: A(-58.5, -42), h: [1.2, 8], ...CADEIRA(AZUL, AZUL2) },
        { de: A(-58.5, -42), ate: A(-56, -46), tipo: 'vazio' },
        /* EMBAIXO, a lateral COBERTA: azul, o bloco vermelho no meio, azul */
        COBERTA(-56, -9, AZUL, AZUL2), COBERTA(-9, 9, VERMELHO, VERMELHO2), COBERTA(9, 54, AZUL, AZUL2),
        { de: A(54, -46), ate: A(58.5, -42), tipo: 'vazio' }
      ] }
  ],
  fachada: { cor: PAREDE },
  refletores: [[-78, 68, 34], [72, 68, 34], [-72, -66, 34], [66, -66, 34]],
  blocos: [
    /* as cabines, no alto da coberta, debaixo do telhado */
    { u: 0, v: -62.4, w: 56, d: 2.2, h: 3, y: 8.8, cor: '#e9e9e4' }, { u: 0, v: -61.2, w: 54, d: 0.2, h: 1.5, y: 9.6, cor: '#55606c' },
    /* os bancos de reserva, ao pé dela */
    { u: -12, v: -43.6, w: 9, d: 2, h: 2, cor: '#e6e8ea' }, { u: 12, v: -43.6, w: 9, d: 2, h: 2, cor: '#e6e8ea' },
    /* a FACHADA da entrada, por trás do gol da esquerda: os quatro painéis cor de vinho, o letreiro no meio e a beira azul no alto */
    ...[-33, -19, 19, 33].map(v => ({ u: -74.7, v, w: 0.3, d: 9, h: 3.6, y: 1.6, cor: VINHO })),
    { u: -74.8, v: 0, w: 0.35, d: 24, h: 6.4, y: 1.2, cor: VINHO },
    { u: -75, v: 0, w: 0.3, d: 22, h: 1.5, y: 5.6, cor: VINHO, giro: 180, texto: 'ESTÁDIO FREI EPIFÂNIO', corTexto: '#f3f3ef', textoFace: true, textoLargura: 0.92, textoAltura: 0.6 },
    { u: -74.6, v: 0, w: 0.5, d: 86, h: 0.5, y: 9.1, cor: '#3f8fc6' }
  ],
  /* a câmera da aérea de referência: do alto, por cima da entrada, olhando o campo ao comprido */
  vista: [-150, 62, 6, 0, 0, 0],
  entorno: [
    { tipo: 'rua', de: [-150, 78], ate: [150, 78], larg: 10 }, { tipo: 'rua', de: [-88, -150], ate: [-88, 150], larg: 10 },
    { tipo: 'rua', de: [-150, -76], ate: [150, -76], larg: 9 }, { tipo: 'rua', de: [82, -150], ate: [82, 150], larg: 8 },
    { tipo: 'casas', u: 0, v: 100, nu: 10, nv: 1, passo: 16 }, { tipo: 'casas', u: 108, v: 0, nu: 1, nv: 9, passo: 16 },
    { tipo: 'arvores', u: -108, v: 0, w: 14, d: 110, n: 10 }, { tipo: 'arvores', u: 30, v: -98, w: 80, d: 16, n: 9 }
  ],
  jogo: { mandante1: [78, 102], mandante2: [165, 195], mandante3: [256, 284], visitante: [-14, 14], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { forca_jovem_cavalina: 'mandante1' } }
};
