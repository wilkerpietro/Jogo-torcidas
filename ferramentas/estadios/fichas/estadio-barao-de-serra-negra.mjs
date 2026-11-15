/* BARÃO DE SERRA NEGRA (XV de Piracicaba, Piracicaba) — pelo satélite e
   pelas fotos de referência (15/11/2026); o meio do campo foi tirado do
   círculo central. O campo corre de sul-sudoeste a norte-nordeste; no
   quadro o OESTE (a coberta) fica em cima e o NORTE à direita. NÃO achei
   mapa de setores do clube.
   Estádio oval, com a pista de terra em volta do gramado, e a arquibancada
   de fundura diferente em cada canto (o terreno é torto):
   · EM CIMA (oeste), a COBERTA: comprida, 28 m de fundo, debaixo do
     telhado claro, que é mais largo no meio e acompanha a curva nas duas
     pontas. Cadeira azul no meio, cinza-azulada na ponta sul, preta na
     ponta norte.
   · À DIREITA (norte), a curva de cadeira preta, que afina até acabar no
     meio do fundo; dali pra baixo, só o piso ao pé do muro (atrás ficam os
     ginásios).
   · EMBAIXO (leste), a arquibancada descoberta, 20 m de fundo, branca, com
     o XV DE PIRACICABA escrito em preto (foto recente); atrás, as duas
     torres dos refletores e a avenida.
   · À ESQUERDA (sul), a curva clara, mais funda no canto sudoeste (onde o
     escudo é pintado no degrau).
   OS ACESSOS: nenhuma boca de vomitório aparece; ficou sem. */
const BR = '#e6e4dc', BR2 = '#dbd9d0', PT = '#2f3136', PT2 = '#3a3c42', AZ = '#3f69b0', AZ2 = '#3860a4', ESC = '#d9c66a';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a grama e a pista; a beira de dentro da arquibancada (oval); o fundo, um contorno por quadrante (os de quadrantes vizinhos
   têm a mesma meia largura ou o mesmo meio comprimento, então se encontram) */
const GRAMA = { a: 83, b: 40.5, r: 40.5 }, I = { a: 96, b: 47.5, r: 47.5 };
const F_NE = { a: 103, b: 76, r: 69 }, F_NO = { a: 115, b: 76, r: 48 }, F_SO = { a: 115, b: 68, r: 40 }, F_SE = { a: 103, b: 68, r: 45 };
const T = (de, ate, fora, cor, cor2, mais) => ({ de, ate, fora, cor, cor2, padrao: 'mosaico', mistura: 0.35, corredor: 24, corEscada: ESC, vomitorios: false, paredeAtras: true, corFachada: '#e9e9e4', parapeito: 1.5, ...mais });
const DEG = { semCadeiras: true };
/* as pontas do telhado e as divisas das cadeiras da coberta, na beira de dentro */
const TETO_N = 31.5, PRETA_FIM = A(37, 47.5), AZUL_FIM = A(-57, 47.5), TETO_S = 152.7;
const LET_S = A(-40, -47.5), LET_N = A(40, -47.5);

export default {
  id: 'estadio-barao-de-serra-negra', nome: 'Barão de Serra Negra', clubes: ['xv-de-piracicaba'], norte: 25, vazado: 0.4, folga: 24,
  corEscada: ESC,
  chao: { cor: '#7b7870' },
  campo: { corMargem: '#55934f', pista: { dentro: GRAMA, fora: I, cor: '#8a7f72', raias: 0 } },
  corMureta: '#e3e1da',
  aneis: [
    /* A ARQUIBANCADA: as fileiras acompanham o oval e o fundo corta as fileiras; a altura acompanha a fundura */
    { dentro: I, fora: F_NE, normal: true, h: [1.5, 13.5], inclinacao: 0.42, fileiras: 28,
      trechos: [
        /* o fundo norte, da arquibancada do leste até o meio: só o piso ao pé do muro */
        { de: -17, ate: 0, tipo: 'passagem', cor: '#b9b6ad', fora: F_SE },
        /* a curva norte, de cadeira preta, afinando */
        T(0, TETO_N, F_NE, PT, PT2),
        /* a COBERTA: a ponta norte preta, o meio azul, a ponta sul cinza-azulada */
        T(TETO_N, PRETA_FIM, F_NE, PT, PT2, { escadaNaBorda: true }),
        T(PRETA_FIM, 90, F_NE, AZ, AZ2, { corredor: 16, escadaNaBorda: true }), T(90, AZUL_FIM, F_NO, AZ, AZ2, { corredor: 16 }),
        T(AZUL_FIM, TETO_S, F_NO, '#8f9fb5', '#8494aa', { escadaNaBorda: true }),
        /* a curva sul, clara: o canto sudoeste (o do escudo) e a volta até a arquibancada do leste */
        T(TETO_S, 180, F_NO, BR, BR2, { ...DEG, escadaNaBorda: true }), T(180, LET_S, F_SO, BR, BR2, DEG),
        /* a arquibancada do leste, com o XV DE PIRACICABA */
        T(LET_S, LET_N, F_SO, '#eeeeea', '#eeeeea', { ...DEG, corredor: 0, escadaNaBorda: true, passoFileira: 0.45, celula: 0.4, texto: 'XV DE PIRACICABA', corTexto: '#17181b', textoLargura: 0.94, textoAltura: 0.56 }),
        T(LET_N, 343, F_SE, BR, BR2, { ...DEG, escadaNaBorda: true })
      ] }
  ],
  /* o telhado claro da coberta: mais largo no meio, acompanhando a curva nas pontas */
  telhados: [{ y: 17.5, h: 0.6, cor: '#d6cfc0', pontos: [[-95, 68.3], [-90, 60], [-72.5, 67], [-49.2, 67], [-49.2, 60], [30.8, 60], [30.8, 65], [50, 65], [74, 55], [78.3, 60], [50, 74.5], [-50, 77], [-71.7, 77]] }],
  fachada: { cor: '#e9e9e4' },
  /* as duas torres de trás da arquibancada do leste; do lado da coberta, os refletores em cima do telhado */
  refletores: [[-28, -72, 34], [26, -72, 34], [-30, 74, 26, 17.5], [25, 74, 26, 17.5]],
  blocos: [
    /* os bancos de reserva (os túneis brancos), do lado da coberta */
    { u: -28, v: 37.5, w: 9, d: 2.2, h: 2, cor: '#eeeeea' }, { u: -5, v: 37.5, w: 3.5, d: 2.2, h: 2, cor: '#eeeeea' }, { u: 2, v: 37.5, w: 3.5, d: 2.2, h: 2, cor: '#eeeeea' },
    { u: 18.5, v: 37.5, w: 10, d: 2.2, h: 2, cor: '#eeeeea' },
    /* a casinha de teto cinza em cima da pista, no fundo norte */
    { u: 86, v: 9, w: 7, d: 13, h: 3, cor: '#8f9498' }
  ],
  entorno: [
    /* embaixo (leste): a avenida arborizada; em cima (oeste): a rua, as árvores e as casas */
    { tipo: 'rua', de: [-135, -88], ate: [135, -88], larg: 26 }, { tipo: 'arvores', u: 0, v: -76, w: 220, d: 4, n: 20 },
    { tipo: 'rua', de: [-135, 92], ate: [135, 92], larg: 9 }, { tipo: 'arvores', u: -10, v: 84, w: 180, d: 5, n: 22 }, { tipo: 'casas', u: 0, v: 108, nu: 15, nv: 1, passo: 15 },
    /* à direita (norte): os dois ginásios e a piscina do clube */
    { tipo: 'predio', u: 124, v: 12, w: 26, d: 34, h: 13, cor: '#cfc9bb' }, { tipo: 'predio', u: 124, v: -46, w: 32, d: 44, h: 14, cor: '#8a4f4c' },
    { tipo: 'piscina', u: 118, v: 55, w: 18, d: 22 },
    /* à esquerda (sul): a rua e as casas */
    { tipo: 'rua', de: [-126, -80], ate: [-126, 92], larg: 9 }, { tipo: 'arvores', u: -112, v: -62, w: 16, d: 16, n: 5 }
  ],
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Torcida Esquadrão em cima do letreiro, no meio da arquibancada
     do leste, e a visitante na curva norte, de cadeira preta; os outros bondes da casa na curva sul e na coberta */
  jogo: { mandante1: [257, 283], mandante2: [165, 195], mandante3: [80, 100], visitante: [4, 28], tunelMandante: 270, tunelVisitante: 16, folgaPM: 3,
          fracao: { mandante1: 0.3, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { torcida_esquadrao: 'mandante1' } }
};
