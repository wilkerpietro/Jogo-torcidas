/* SÃO JANUÁRIO (Vasco, Rio de Janeiro) — pelo satélite e pelas seis imagens
   que o dono mandou (15/11/2026): três fotos da social, uma de drone do lado
   sul, o mapa de setores dos ingressos e o mapa antigo de setores. O campo
   corre de norte-noroeste a sul-sudeste; no quadro o LESTE (a arquibancada do
   VASCO) fica em cima e o NORTE à esquerda.
   O estádio é o oval da pista antiga, com a margem de grama larga em volta do
   campo, e a arquibancada em U, aberta pro sul:
   · EM CIMA (leste), a ARQUIBANCADA 9, reta, de degrau escuro com o VASCO
     pintado em branco de fora a fora; na ponta sul, o SETOR VISITANTE (os dois
     mapas).
   · À ESQUERDA (norte), a CURVA atrás do gol: branca com a Cruz de Malta
     vermelha no meio, clara do lado do VASCO (a Arquibancada 5) e preta do
     lado da social (o VIP); em volta dela, o anel dos CAMAROTES. Entre a pista
     e o degrau, a calçada de concreto.
   · EMBAIXO (oeste), a SOCIAL, em dois andares: embaixo, os blocos grandes de
     cadeira com ✠ C ✠ R, a tribuna de honra no meio, V ✠ G ✠ (de quem olha do
     campo, da esquerda pra direita), com as escadas amarelas; em cima, as
     cadeiras pretas e brancas debaixo do telhado de beirada vermelha com o
     CLUB DE REGATAS VASCO DA GAMA na frente; atrás, a fachada antiga.
   · À DIREITA (sul), aberto: a pista, o telão em dois pés e o mastro das
     bandeiras atrás do gol; atrás, o campo de treino, as quadras e o parque
     aquático.
   AS TORCIDAS: a visitante na ponta sul da Arquibancada 9 (os mapas); a Força
   Jovem no meio dela (escolha minha, sem fonte). */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const ESCURO = '#2b3440', ESCURO2 = '#323c49', CLARO = '#d8dbde', PRETO = '#23262b', MARROM = '#6d6152', BR = '#eeeeea', AMARELO = '#d8b84a';
/* a pista (o oval), a calçada de concreto, o fim do anel de dentro da curva e o fundo de tudo */
const OVAL = { a: 92.5, b: 46.5, r: 46.5 }, W = { a: 95.5, b: 49.5, r: 49.5 }, M = { a: 110, b: 62, r: 62 }, F = { a: 122, b: 75, r: 75 };
/* as pontas: a arquibancada do VASCO de u = 64 a -57, a curva até a social, a social até u = 54 */
const VS = A(64, 49.5), VE = A(-57, 49.5), SO = A(-61.5, -49.5), SE = A(54, -49.5) ;
const DEG = { padrao: 'mosaico', mistura: 0.2, semCadeiras: true, corredor: 18, escadaNaBorda: true, corEscada: BR, vomitorios: false };
/* o andar de baixo da social, em nove blocos de cadeira: as cruzes, as letras e a tribuna no meio */
const SOCIAL_BAIXO = ['✠', 'G', '✠', 'V', '', 'R', '✠', 'C', '✠'].map((t, k) => {
  const u0 = -61.5 + k * 115.5 / 9, u1 = u0 + 115.5 / 9, de = A(u0, -49.5), ate = A(u1, -49.5);
  if (!t) return { de, ate, fora: M, cor: '#2a2c30', cor2: '#33363b', padrao: 'mosaico', mistura: 0.2, semCadeiras: true, corredor: 0, escadaNaBorda: true, corEscada: AMARELO, vomitorios: false };
  return { de, ate, fora: M, cor: BR, cor2: '#e4e5e2', padrao: 'mosaico', mistura: 0.1, corredor: 0, escadaNaBorda: true, corEscada: AMARELO, vomitorios: false,
    texto: t, corTexto: t === '✠' ? '#c8262d' : '#1c1d20', textoLargura: 0.75, textoAltura: 0.9 };
});

export default {
  id: 'estadio-sao-januario', nome: 'São Januário', clubes: ['vasco'], norte: 168.2, vazado: 0.3, folga: 20,
  chao: { cor: '#83807a' },
  campo: { corMargem: '#4f9353' },
  corMureta: BR,
  aneis: [
    /* a calçada de concreto entre a pista e o degrau; no sul, a pista aberta */
    { dentro: OVAL, fora: W, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#a9a69e' }] },
    /* A ARQUIBANCADA, de ponta a ponta do U (o anel de dentro na curva) */
    { dentro: W, fora: M, h: [1.4, 8.5], fileiras: 16,
      trechos: [
        { de: VS, ate: A(26, 49.5), fora: F, h: [1.4, 13.5], fileiras: 28, cor: ESCURO, cor2: ESCURO2, ...DEG },
        { de: A(26, 49.5), ate: A(-40, 49.5), fora: F, h: [1.4, 13.5], fileiras: 28, cor: ESCURO, cor2: ESCURO2, ...DEG, corredor: 0, escadaNaBorda: false,
          texto: 'VASCO', corTexto: '#f1f2ee', textoLargura: 0.96, textoAltura: 0.8 },
        { de: A(-40, 49.5), ate: VE, fora: F, h: [1.4, 13.5], fileiras: 28, cor: ESCURO, cor2: ESCURO2, ...DEG },
        /* a curva: clara em cima, a Cruz de Malta atrás do gol, azul-escura embaixo */
        { de: VE, ate: 174, cor: CLARO, cor2: '#c9cdd1', ...DEG, corEscada: '#9aa1a8' },
        { de: 174, ate: 188, cor: BR, cor2: BR, ...DEG, corredor: 0, escadaNaBorda: false, texto: '✠', corTexto: '#c8262d', textoLargura: 0.9, textoAltura: 0.95 },
        { de: 188, ate: SO, cor: PRETO, cor2: '#2c3036', ...DEG, corEscada: '#5a5e63' },
        /* a SOCIAL, o andar de baixo: os blocos ✠ G ✠ V, a tribuna, R ✠ C ✠ (do norte pro sul) */
        ...SOCIAL_BAIXO,
        /* o sul, aberto */
        { de: SE, ate: VS + 360, tipo: 'vazio' }
      ] },
    /* o anel de fora da curva, de concreto escuro com as nervuras */
    { dentro: M, fora: F, h: [8.6, 14], fileiras: 12, corredorFrente: 0,
      trechos: [
        { de: VS, ate: VE, tipo: 'vazio' },
        /* os camarotes em volta da curva (os telhadinhos de cada um, com as nervuras) */
        { de: VE, ate: SO, cor: MARROM, cor2: '#5f5547', ...DEG, corredor: 9, corEscada: '#4a4238', paredeAtras: true, corFachada: '#b9b4a8' },
        /* a SOCIAL, o andar de cima: as cadeiras pretas e brancas */
        { de: SO, ate: SE, cor: PRETO, cor2: '#f1f1ee', padrao: 'mosaico', mistura: 0.5, corredor: 13, escadaNaBorda: true, corEscada: AMARELO, vomitorios: false,
          paredeAtras: true, corFachada: BR },
        { de: SE, ate: VS + 360, tipo: 'vazio' }
      ] }
  ],
  /* o telhado da social */
  telhados: [{ y: 18, h: 0.5, cor: '#9a9c9a', sombra: false, pontos: [[-62, -46], [54, -46], [54, -76], [-62, -76]] }],
  fachada: { cor: BR },
  refletores: [[-70, 66, 34], [70, 66, 34], [-74, -70, 34], [62, -70, 34]],
  blocos: [
    /* a beirada vermelha do telhado da social, com o CLUB DE REGATAS VASCO DA GAMA na frente */
    { u: -4, v: -46.3, w: 116, d: 0.6, h: 0.8, y: 17.6, cor: '#c8262d', cobertura: true },
    { u: -4, v: -46.8, w: 0.4, d: 60, h: 1.6, y: 16, cor: '#1c1d20', texto: 'CLUB DE REGATAS VASCO DA GAMA', corTexto: '#f1f2ee', textoFace: true, giro: 90, textoLargura: 0.94, textoAltura: 0.55, cobertura: true },
    /* o telão em dois pés e o mastro das bandeiras atrás do gol do sul */
    { u: 70, v: -10, w: 1.2, d: 1.2, h: 10, cor: '#3a3c40' }, { u: 70, v: 2, w: 1.2, d: 1.2, h: 10, cor: '#3a3c40' },
    { u: 70, v: -4, w: 1.6, d: 15, h: 7, y: 10, cor: '#16171a' }, { u: 76, v: -4, w: 0.4, d: 0.4, h: 22, cor: '#d9dad6' },
    /* a fachada antiga atrás da social, de telhado vermelho */
    { u: -4, v: -80, w: 118, d: 6, h: 16, cor: '#f1efe8' }, { u: -4, v: -80, w: 119, d: 7, h: 0.5, y: 16, cor: '#b5533c' },
    /* os bancos de reserva, ao pé da arquibancada do VASCO, e o placar */
    { u: -12, v: 44, w: 10, d: 2.4, h: 2, cor: '#8f9498' }, { u: 12, v: 44, w: 10, d: 2.4, h: 2, cor: '#8f9498' },
    /* o prédio baixo do sul, na pista */
    { u: 112, v: -32, w: 22, d: 14, h: 5, cor: '#b9bbbd' }
  ],
  vista: [0, 16, 8, 0, 5, -60],
  entorno: [
    /* em cima à direita (leste, perto do sul), o campo de treino; à direita (sul), as quadras e o parque aquático */
    { tipo: 'grama', u: 128, v: 88, w: 56, d: 70, cor: '#5f9a55' }, { tipo: 'quadra', u: 152, v: -40, w: 22, d: 18, cor: '#c96a4a' },
    { tipo: 'piscina', u: 168, v: -84, w: 42, d: 20 },
    /* em cima à esquerda (norte), os galpões; embaixo (oeste), a rua da fachada e as casas */
    { tipo: 'predio', u: -150, v: 50, w: 50, d: 60, h: 10, cor: '#9a9c9e' }, { tipo: 'predio', u: -40, v: 98, w: 120, d: 26, h: 9, cor: '#8f9396' },
    { tipo: 'rua', de: [-170, -92], ate: [190, -92], larg: 12 }, { tipo: 'casas', u: 0, v: -112, nu: 18, nv: 1, passo: 15 },
    { tipo: 'casas', u: -150, v: -40, nu: 2, nv: 4, passo: 15 }
  ],
  jogo: { mandante1: [255, 285], mandante2: [197, 219], mandante3: [165, 195], visitante: [47, 63], tunelMandante: 95, tunelVisitante: 48, folgaPM: 4,
          fracao: { mandante1: 0.45, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { forca_jovem_vasco: 'mandante1' } }
};
