/* ANTÔNIO ACCIOLY (Atlético-GO, Goiânia, Setor Campinas; nos dados do jogo
   o nome está escrito "Antonio Accyoly") — pelo satélite de hoje e pelas
   três fotos que o dono mandou no meio do levantamento (16/11/2026): duas
   de drone e uma de trás do gol. As fotos são de antes de o estádio ganhar
   cobertura nos quatro lados; o satélite já mostra as quatro. O campo corre
   de sudoeste a nordeste; no quadro o NOROESTE fica em cima e o NORDESTE à
   direita. Estádio retangular, de quatro arquibancadas retas coladas no
   campo, de cadeira branca com as escadas e os muros vermelhos, e a faixa
   vermelha em volta do gramado:
   · EM CIMA (noroeste), a PRINCIPAL (dono, 16/11/2026, com uma foto de
     perto: "A arquibancada que você colocou uma parte com a cadeira vermelha
     na verdade é assim"): um lance só, ELEVADO em cima do muro vermelho e
     branco, de cadeira cinza, com o bloco de cadeira vermelha no meio,
     debaixo da cobertura branca grande de treliça branca; ao pé dela, no
     nível do campo, a passagem de cimento e os bancos de reserva de toldo
     branco. (Eu tinha feito dois lances, o de baixo vermelho, lendo errado
     uma foto de longe.) A posição do bloco vermelho ao longo dela é estimada.
   · À DIREITA (nordeste), a de trás do gol, de cadeira branca em oito
     blocos; a cobertura pega só a metade de trás. Atrás dela, duas torres
     de refletores.
   · À ESQUERDA (sudoeste), a outra de trás do gol, de cadeira branca em
     quatro blocos, toda coberta, com duas torres de refletores.
   · EMBAIXO (sudeste), a lateral comprida e rasa, de cadeira branca,
     ELEVADA em cima do muro bege, com a passagem ao pé; coberta.
   · EM VOLTA, o MURO branco de faixa vermelha do terreno (dono: "To
     sentindo falta dos muros atrás do estádio nesse"): pelo satélite, ao
     longo das duas ruas dos fundos e por trás da laje do estacionamento.
   O QUE NÃO SEI: as cores debaixo das coberturas de hoje (usei as das
   fotos), as alturas, e onde fica cada torcida.
   AS TORCIDAS (escolhas minhas, sem fonte): a Dragões Atleticanos atrás do
   gol do sudoeste; a visitante atrás do gol do nordeste. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* cada arquibancada com o seu contorno (retângulo de canto vivo): `b` é a beira de uma lateral, `a` a de um fundo */
const LAT = b => ({ a: 95, b, r: 0.5 }), FUN = a => ({ a, b: 75, r: 0.5 });
const BR = '#eceae4', BR2 = '#e1dfd8', VM = '#a8282d', VM2 = '#7f2126', MURO = '#9c2b2f', TETO = '#eeeeea';
const CZ = '#bfc1c3', CZ2 = '#b0b2b4';
const CAD = { cor: BR, cor2: BR2, padrao: 'mosaico', mistura: 0.3, corEscada: VM, escadaNaBorda: true, vomitorios: false, paredeAtras: true, corFachada: MURO, corMureta: MURO };
const COB = (h, larg, mais) => ({ h, larg, avanco: 0.6, cai: 1, cor: TETO, cor2: '#e3e3de', listras: true, corTrelica: '#c9cbc8', corPilar: '#e6e6e1', ...mais });

export default {
  id: 'estadio-antonio-accyoly', nome: 'Antonio Accyoly', clubes: ['atletico-go'], norte: 55.6, vazado: 0.3, folga: 22,
  chao: { cor: '#a8a294' },
  campo: { corMargem: '#3f8a4b' },
  corMureta: MURO, corAlambrado: '#b5383c',
  alambrado: { cor: '#b5383c', corBase: MURO },
  aneis: [
    /* a faixa vermelha em volta do gramado, ao pé das quatro: é por ela que se passa de uma arquibancada a outra */
    { dentro: { a: 58.5, b: 40.5, r: 0.5 }, fora: { a: 61, b: 43, r: 0.5 }, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#9a5148' }] },
    { dentro: LAT(43), fora: LAT(53), reto: true, h: [1.2, 9], fileiras: 18, corredorFrente: 1,
      trechos: [
        /* À DIREITA (nordeste): a de trás do gol, oito blocos; a cobertura só na metade de trás */
        { ...CAD, de: A(61, -40) - 360, ate: A(61, 43), dentro: FUN(61), fora: FUN(87.5), h: [1.2, 10], fileiras: 22, corredor: 10.4, cobertura: COB(14, 15) },
        /* EM CIMA (noroeste): a passagem de cimento ao pé do muro da principal, no nível do campo */
        { de: A(60, 43), ate: A(-60, 43), tipo: 'passagem', dentro: LAT(43), fora: LAT(50), cor: '#c2bcae' },
        /* À ESQUERDA (sudoeste): a outra de trás do gol, quatro blocos, toda coberta */
        { ...CAD, de: A(-61, 43), ate: A(-61, -42), dentro: FUN(61), fora: FUN(83), h: [1.2, 9], fileiras: 18, corredor: 21.2, cobertura: COB(13.5, 22) },
        /* EMBAIXO (sudeste): a passagem ao pé do muro bege da lateral elevada */
        { de: A(-54.6, -43), ate: A(64, -43), tipo: 'passagem', dentro: LAT(43), fora: LAT(50), cor: '#b9b3a4' }
      ] },
    { dentro: LAT(50), fora: LAT(67), reto: true, h: [3.6, 11.5], fileiras: 15, corredorFrente: 1.2,
      trechos: [
        /* a principal, elevada: cadeira cinza, com o bloco de cadeira vermelha no meio, debaixo da cobertura grande */
        { ...CAD, de: A(60, 50), ate: A(18, 50), cor: CZ, cor2: CZ2, corredor: 14, parapeito: 2.6, cobertura: COB(17, 18.5, { avanco: 1 }) },
        { ...CAD, de: A(18, 50), ate: A(-10, 50), cor: VM, cor2: VM2, mistura: 0.45, corEscada: VM2, corredor: 14, parapeito: 2.6, cobertura: COB(18.2, 18.5, { avanco: 1, corTrelica: '#f1f2ef' }) },
        { ...CAD, de: A(-10, 50), ate: A(-60, 50), cor: CZ, cor2: CZ2, corredor: 12.5, parapeito: 2.6, cobertura: COB(17, 18.5, { avanco: 1 }) },
        /* a lateral elevada do sudeste */
        { ...CAD, de: A(-54.6, -50), ate: A(71.5, -50), dentro: LAT(50), fora: LAT(64), h: [3, 9], fileiras: 12, corredor: 15.8, corMureta: '#d9cdb5', cobertura: COB(13.5, 15) }
      ] }
  ],
  fachada: { cor: MURO },
  /* as quatro torres de refletores, duas atrás de cada gol */
  refletores: [[96, 19, 36], [96, -30, 36], [-88, 26, 36], [-88, -24, 36]],
  blocos: [
    /* as cabines no alto do bloco vermelho da principal */
    { u: 4, v: 65.6, w: 26, d: 2.6, h: 3, y: 11.6, cor: '#2f3a44' }, { u: 4, v: 64.2, w: 26.4, d: 0.3, h: 0.5, y: 11.5, cor: BR },
    /* a faixa branca do muro da principal, por baixo da mureta vermelha */
    { u: 0, v: 49.9, w: 120, d: 0.3, h: 1.6, y: 0.2, cor: BR },
    /* O MURO do terreno: branco, de faixa vermelha em cima (as duas ruas dos fundos, os cantos da rua da frente e o fundo da
       laje do estacionamento) */
    ...[[101.5, 11.5, 0.5, 156], [-103, 11.5, 0.5, 156], [-0.75, 89.5, 205, 0.5], [-79, -66.5, 48.5, 0.5], [87, -66.5, 29.5, 0.5]].flatMap(([u, v, w, d]) =>
      [{ u, v, w, d, h: 2.4, cor: '#e9e6df' }, { u, v, w: w + 0.1, d: d + 0.1, h: 0.6, y: 2.4, cor: MURO }]),
    /* o prédio do clube por trás da ponta sudoeste da principal */
    { u: -40, v: 72, w: 40, d: 8, h: 14, cor: '#e3e1da' },
    /* os bancos de reserva, ao pé da principal */
    { u: -19, v: 44.6, w: 20, d: 2.4, h: 2.1, cor: '#f1f0eb' }, { u: 19, v: 44.6, w: 20, d: 2.4, h: 2.1, cor: '#f1f0eb' },
    /* o placar, no canto do sul */
    { u: -72, v: -52, w: 9, d: 1, h: 5, y: 4, cor: '#1c1d20' }
  ],
  /* a câmera de uma das fotos do dono: de trás do gol do nordeste, olhando o outro gol */
  vista: [78, 9, 4, -60, 3, 0],
  entorno: [
    /* em cima (noroeste): a laje do estacionamento, atrás da principal */
    { tipo: 'estacionamento', u: 28, v: 78.5, w: 140, d: 18, cheio: 0.06 },
    /* embaixo (sudeste): a rua com os carros parados e as casas; à direita (nordeste): a rua e as casas; à esquerda (sudoeste): a rua */
    { tipo: 'rua', de: [-120, -74], ate: [125, -74], larg: 9 }, { tipo: 'arvores', u: 0, v: -86, w: 80, d: 6, n: 6 }, { tipo: 'casas', u: 0, v: -100, nu: 15, nv: 1, passo: 15 },
    { tipo: 'rua', de: [110, 130], ate: [110, -74], larg: 9 }, { tipo: 'casas', u: 130, v: 20, nu: 1, nv: 11, passo: 15 },
    { tipo: 'rua', de: [-112, 60], ate: [-112, -74], larg: 9 }, { tipo: 'casas', u: -132, v: -10, nu: 1, nv: 8, passo: 15 }
  ],
  jogo: { mandante1: [166, 194], mandante2: [245, 295], mandante3: [65, 115], visitante: [-22, 22], tunelMandante: 180, tunelVisitante: 0, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.6, mandante3: 0.6, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { dragoes_atleticanos: 'mandante1' } }
};
