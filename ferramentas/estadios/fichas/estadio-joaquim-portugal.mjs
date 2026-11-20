/* JOAQUIM PORTUGAL (Arena Sicredi, Athletic, São João del-Rei) — pelas nove
   fotos de drone que o dono mandou (15/11/2026) e pelo satélite (o do Google é
   da obra de 2025, com a lateral de cima em terra e o gramado em troca; o do
   Bing, de antes da reforma; as medidas saíram dele, o desenho, das fotos).
   No quadro o NOROESTE (a lateral da tubular cinza) fica em cima e o NORDESTE
   (o fundo da Akafloor) à direita.
   Estádio pequeno, de arquibancadas soltas em volta do gramado, com a margem
   de grama sintética e o alambrado preto:
   · À ESQUERDA, atrás do gol, a TUBULAR grande: uns 50 m de largura e 20
     fileiras de banco, em listras de cinza e vermelho-tijolo, com quatro
     escadas vermelhas e, no alto, a faixa ARENA SICREDI · O ATHLETIC CLUB ·
     PODE CONTAR COM A GENTE. À esquerda dela (de quem olha do campo) o galpão
     do Miro Batatas; à direita, a casinha de telhado branco.
   · EM CIMA, a TUBULAR CINZA nova, em duas partes, com as escadas
     avermelhadas e as torres de luz no meio; no canto da direita, a
     arquibancadinha curva de degrau.
   · À DIREITA, atrás do gol, a de DEGRAU PRETO de espelho branco, com três
     escadas amarelas, a faixa VISITE SÃO JOÃO DEL-REI na frente e, atrás, o
     muro com o painel dos Laticínios Del Rios e o galpão da AKAFLOOR.
   · EMBAIXO, a lateral principal, de ponta a ponta: o lance baixo de degrau
     preto com escadas amarelas, a TRIBUNA de cadeiras pretas com o camarote
     de cadeiras amarelas, a faixa O NOSSO CLUBE COM ARDOR DEFENDEREMOS! e a
     torre preta da imprensa no meio, e o pavilhão coberto de dois andares
     perto do fundo da Akafloor; os bancos de reserva ao pé dela.
   AS TORCIDAS (escolhas minhas, sem mapa de setores): o Esquadrão Alvinegro
   na tubular de trás do gol; a visitante na de degrau preto, atrás do outro
   gol. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AM = '#e3c437', PRETO = '#2f3136', PRETO2 = '#3c3e43', BRANCO = '#e6e7e3';
/* a beira de dentro, comum a todas (o fim da margem de grama); o fundo de cada arquibancada é um retângulo com o mesmo trecho
   reto da beira de dentro (senão as colunas abrem em leque) */
const I = { a: 56, b: 39, r: 0.5 };
const LAT = b => ({ a: 56, b, r: 0.5 }), FUN = a => ({ a, b: 39, r: 0.5 });
/* o degrau preto de espelho branco, das duas de concreto */
const DEGRAU = { cor: PRETO, cor2: PRETO2, padrao: 'mosaico', mistura: 0.2, semCadeiras: true, corEspelho: BRANCO, corEscada: AM, vomitorios: false };
/* o banco das tubulares, em listras */
const TUBULAR = { padrao: 'mosaico', mistura: 0.5, semCadeiras: true, vomitorios: false, paredeAtras: false, parapeito: 1.1 };

export default {
  id: 'estadio-joaquim-portugal', nome: 'Joaquim Portugal', clubes: ['athletic'], norte: 63, vazado: 0.15, folga: 30,
  chao: { cor: '#7e7a72' },
  campo: { corMargem: '#3f8f4a' },
  corMureta: '#26282b', corAlambrado: '#26282b',
  aneis: [
    /* a margem de grama sintética em volta do gramado, ao pé de todas: é por ela que se passa de uma arquibancada a outra */
    { dentro: { a: 54, b: 36.5, r: 0.5 }, fora: I, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#3a8546' }] },
    { dentro: I, reto: true, fora: FUN(67), h: [1, 5.5], fileiras: 9,
      trechos: [
        /* À DIREITA, a de degrau preto (o fundo da Akafloor) */
        { de: A(56, -26) - 360, ate: A(56, 33), fora: FUN(66.5), ...DEGRAU, corredor: 15 },
        { de: A(56, 33), ate: A(43, 39), tipo: 'vazio' },
        /* EM CIMA, a tubular cinza, em duas partes */
        { de: A(43, 39), ate: A(23, 39), fora: LAT(52), h: [1.6, 9.5], fileiras: 14, cor: '#9b9d9f', cor2: '#8a8c8f', ...TUBULAR, corredor: 9, corEscada: '#7d4a45', escadaNaBorda: true },
        { de: A(23, 39), ate: A(-10, 39), fora: LAT(53), h: [1.6, 10], fileiras: 15, cor: '#9b9d9f', cor2: '#8a8c8f', ...TUBULAR, corredor: 11, corEscada: '#7d4a45', escadaNaBorda: true },
        { de: A(-10, 39), ate: A(-56, 22), tipo: 'vazio' },
        /* À ESQUERDA, a tubular grande de trás do gol: listras cinza e vermelho-tijolo, quatro escadas vermelhas */
        { de: A(-56, 22), ate: A(-56, -28), fora: FUN(73), h: [2.4, 12], fileiras: 20, cor: '#8f5b53', cor2: '#aeaca7', ...TUBULAR, corredor: 11.5, corEscada: '#b2342b' },
        { de: A(-56, -28), ate: A(-52, -39), tipo: 'vazio' },
        /* EMBAIXO, a lateral principal: o lance baixo de degrau preto, a tribuna e o pavilhão coberto */
        { de: A(-52, -39), ate: A(-5, -39), fora: LAT(45), h: [0.8, 3.8], fileiras: 5, ...DEGRAU, corredor: 16 },
        { de: A(-5, -39), ate: A(29, -39), fora: LAT(43), h: [1, 3.2], fileiras: 3, cor: '#1f2023', cor2: '#2b2c30', padrao: 'mosaico', mistura: 0.2, corEspelho: BRANCO, corEscada: AM, corredor: 12, vomitorios: false },
        { de: A(29, -39), ate: A(55.5, -39), tipo: 'passagem', fora: LAT(47), cor: '#5b5d61' },
        { de: A(55.5, -39), ate: A(56, -26), tipo: 'vazio' }
      ] }
  ],
  /* a arquibancadinha curva do canto de cima à direita */
  retas: [{ u: 56.3, v: 39.3, ang: 45, comp: 9, prof: 6.5, h: [0.8, 3.6], fileiras: 6, ...DEGRAU, corredor: 0, corFachada: '#3a3c40' }],
  fachada: { cor: '#3a3c40' },
  refletores: [[-30, -50, 24], [27, -50, 24], [-6, 50, 24], [30, 50, 24]],
  blocos: [
    /* a faixa no alto da tubular grande, de pé, virada pro campo */
    { u: -73.4, v: -3, w: 0.4, d: 48, h: 1.8, y: 12, cor: '#f2f3f0', texto: 'ARENA SICREDI · O ATHLETIC CLUB · PODE CONTAR COM A GENTE', corTexto: '#2f8a4c', textoFace: true, textoLargura: 0.96, textoAltura: 0.6 },
    /* a casinha de telhado branco ao lado dela e o galpão do Miro Batatas do outro lado */
    { u: -63, v: 30.5, w: 10, d: 10, h: 6, cor: '#5f6266' }, { u: -63, v: 30.5, w: 11, d: 11, h: 0.4, y: 6, cor: '#eef0ee' },
    /* a lateral principal: o prédio da tribuna com o camarote, o telhado, a faixa e a torre da imprensa */
    { u: 12, v: -46, w: 34, d: 6, h: 5.5, cor: '#26282b' },
    { u: 12, v: -44.5, w: 34, d: 8, h: 0.4, y: 6.6, cor: '#8f9396', cobertura: true },
    { u: 18, v: -42.9, w: 0.5, d: 22, h: 1.6, y: 3.4, cor: '#1c1d20', texto: 'O NOSSO CLUBE COM ARDOR DEFENDEREMOS!', corTexto: '#f1f2ee', textoFace: true, giro: 90, textoLargura: 0.9, textoAltura: 0.55 },
    { u: -1, v: -47, w: 4.5, d: 4.5, h: 10.5, cor: '#1c1d20' }, { u: -1, v: -44.6, w: 0.3, d: 3, h: 1.6, y: 8.4, cor: '#f2f3f0', texto: 'Arena Sicredi', corTexto: '#2f8a4c', textoFace: true, giro: 90, textoLargura: 0.9, textoAltura: 0.42 },
    /* o pavilhão coberto de dois andares, perto do fundo da Akafloor */
    { u: 42, v: -46.5, w: 26, d: 1.2, h: 5.5, cor: '#3a3c40' }, { u: 42, v: -43.5, w: 26, d: 8, h: 0.4, y: 5.8, cor: '#2a2c30', cobertura: true },
    { u: 42, v: -43.5, w: 26, d: 8, h: 0.25, y: 2.8, cor: '#4a4c50', cobertura: true },
    /* os bancos de reserva ao pé da lateral principal */
    { u: 15, v: -37.6, w: 14, d: 2.2, h: 2, cor: '#1c1d20' }, { u: -18, v: -37.6, w: 12, d: 2.2, h: 2, cor: '#1c1d20' },
    /* o fundo da Akafloor: a faixa da frente, o muro de trás com o painel dos Laticínios Del Rios */
    { u: 55.8, v: 20, w: 0.3, d: 14, h: 1.2, y: 1.4, cor: '#f1f2ee', texto: 'VISITE SÃO JOÃO DEL-REI', corTexto: '#1c1d20', textoFace: true, giro: 180, textoLargura: 0.9, textoAltura: 0.6 },
    { u: 67.6, v: 3.5, w: 1.2, d: 60, h: 6.5, cor: '#7c8085' },
    { u: 67.2, v: 12, w: 0.5, d: 12, h: 4.5, y: 6.5, cor: '#1f3b2d', texto: 'LATICÍNIOS DEL RIOS', corTexto: '#f1f2ee', textoFace: true, giro: 180, textoLargura: 0.9, textoAltura: 0.3 },
    /* o galpão da Akafloor, com o nome na parede virada pro campo */
    { u: 88, v: 10, w: 36, d: 60, h: 11, cor: '#eceeec' }, { u: 88, v: 10, w: 37, d: 61, h: 0.4, y: 11, cor: '#c7b998' },
    { u: 69.8, v: 20, w: 0.4, d: 30, h: 5, y: 5, cor: '#eceeec', texto: 'AKAFLOOR', corTexto: '#1c1d20', textoFace: true, giro: 180, textoLargura: 0.85, textoAltura: 0.7 }
  ],
  /* a câmera de uma das fotos do dono: do alto, por cima do fundo da Akafloor, olhando a tubular grande */
  vista: [100, 62, -12, -30, 0, 4],
  entorno: [
    { tipo: 'predio', u: -80, v: -60, w: 34, d: 26, h: 9, cor: '#d4d7d9' },
    { tipo: 'casas', u: 0, v: 72, nu: 10, nv: 2, passo: 15 }, { tipo: 'casas', u: 10, v: -62, nu: 10, nv: 1, passo: 15 },
    { tipo: 'casas', u: -92, v: 25, nu: 1, nv: 4, passo: 15 }, { tipo: 'arvores', u: -110, v: 0, w: 20, d: 70, n: 14 },
    { tipo: 'rua', de: [-140, -80], ate: [140, -80], larg: 9 }, { tipo: 'predio', u: 100, v: -60, w: 40, d: 30, h: 8, cor: '#dfe0dc' }
  ],
  jogo: { mandante1: [167, 196], mandante2: [70, 96], mandante3: [228, 252], visitante: [-16, 16], tunelMandante: 181, tunelVisitante: 0, folgaPM: 3,
          fracao: { mandante1: 0.45, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { esquadrao_alvinegro: 'mandante1' } }
};
