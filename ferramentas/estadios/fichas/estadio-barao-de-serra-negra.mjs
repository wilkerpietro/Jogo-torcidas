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
   · À ESQUERDA (sul), a de trás do gol, de degrau claro (dono, 15/11/2026,
     com duas fotos aéreas: "tem um desnível nos dois lados da arquibancada
     atrás do gol que o satélite não captou bem"). As fileiras acompanham a
     curva da pista, mas o MURO DE TRÁS É RETO, com os dois cantos
     chanfrados. Por isso ela é RASA E BAIXA no meio, atrás do gol (12 m de
     fundo), e vai ficando funda e alta para os dois lados: no canto
     sudoeste sobe até encontrar a coberta; no canto sudeste sobe até o
     painel alto do canto (o do escudo, nas fotos antigas), entre duas
     escadas amarelas, que fica da altura da arquibancada do leste. No meio,
     ao pé dela, a caixa amarela do túnel. (Eu tinha feito o fundo redondo,
     com 19 m de fundura atrás do gol, e o desnível sumia.)
     As fotos do dono são de uma pintura antiga (listras grená, o escudo no
     painel do sudeste); no satélite de hoje o degrau é todo claro e o
     escudo está pintado no canto sudoeste, com um letreiro que não deu pra
     ler: ficou sem escudo e sem letreiro.
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
/* O FUNDO SUL. A beira de dentro fica 5 m mais pra fora que a do norte (o oval não é centrado no campo): um contorno só pro
   lado sul, que encontra o outro nas retas das laterais */
const I_S = { a: 101, b: 47.5, r: 47.5 }, CS = -(I_S.a - I_S.r);
/* o muro de trás, reto, de canto a canto (medido no satélite): o fim da reta da coberta, a ponta do telhado, o canto sudoeste,
   o meio (atrás do gol), o canto sudeste, o fim do chanfro e o começo da reta do leste */
const M_COB = [-71.7, 75.8], M_TETO = [-95.5, 67], M_SO = [-115.5, 43], M_MEIO = [-113.2, 0], M_SE = [-115.5, -34.8], M_CHANFRO = [-89, -58.9], M_LESTE = [-53.5, -68];
/* um lance reto de muro: um círculo de 700 m que passa pelas duas pontas (a mesma saída do Jorge Ismael de Biasi) */
const LINHA_RETA = ([u0, v0], [u1, v1]) => { const R = 700, mu = (u0 + u1) / 2, mv = (v0 + v1) / 2, du = u1 - u0, dv = v1 - v0, L = Math.hypot(du, dv); let nu = -dv / L, nv = du / L;
  if (nu * mu + nv * mv > 0) { nu = -nu; nv = -nv; } const h = Math.sqrt(R * R - L * L / 4); return { a: R, b: R, forma: 'elipse', cu: mu + nu * h, cv: mv + nv * h }; };
/* o ângulo (na beira de dentro) do ponto de onde a escada, saindo perpendicular, chega a um canto do muro */
const NS = ([u, v]) => { const f = Math.atan2(v, u - CS); return A(CS + I_S.r * Math.cos(f), I_S.r * Math.sin(f)); };
/* um trecho do fundo sul, de um canto do muro ao outro */
const SUL = (de, ate, m0, m1, mais) => T(de, ate, LINHA_RETA(m0, m1), BR, BR2, { ...DEG, dentro: I_S, corredor: 0, escadaNaBorda: true, ...mais });
/* as pontas do telhado e as divisas das cadeiras da coberta, na beira de dentro */
const TETO_N = 31.5, PRETA_FIM = A(37, 47.5), AZUL_FIM = A(-57, 47.5), TROCA_O = A(-45, 47.5), TROCA_L = A(-53.5, -47.5);
const LET_S = A(-40, -47.5), LET_N = A(40, -47.5);

export default {
  id: 'estadio-barao-de-serra-negra', nome: 'Barão de Serra Negra', clubes: ['xv-de-piracicaba'], norte: 25, vazado: 0.4, folga: 24,
  corEscada: ESC,
  chao: { cor: '#7b7870' },
  campo: { corMargem: '#55934f', pista: { dentro: GRAMA, fora: I_S, cor: '#8a7f72', raias: 0 } },
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
        T(PRETA_FIM, 90, F_NE, AZ, AZ2, { corredor: 16, escadaNaBorda: true }), T(90, TROCA_O, F_NO, AZ, AZ2, { corredor: 16 }),
        T(TROCA_O, AZUL_FIM, F_NO, AZ, AZ2, { corredor: 16, dentro: I_S }),
        T(AZUL_FIM, NS(M_COB), F_NO, '#8f9fb5', '#8494aa', { dentro: I_S, escadaNaBorda: true }),
        T(NS(M_COB), NS(M_TETO), LINHA_RETA(M_COB, M_TETO), '#8f9fb5', '#8494aa', { dentro: I_S, corredor: 0, escadaNaBorda: true }),
        /* O FUNDO SUL, de degrau claro, com o muro de trás reto: o canto sudoeste (alto, colado na coberta), a descida até o
           meio, atrás do gol (baixo), a subida até o canto sudeste, o painel alto do canto e o pedaço até a arquibancada do leste */
        SUL(NS(M_TETO), NS(M_SO), M_TETO, M_SO), SUL(NS(M_SO), 180, M_SO, M_MEIO),
        SUL(180, NS(M_SE), M_MEIO, M_SE),
        SUL(NS(M_SE), NS(M_CHANFRO), M_SE, M_CHANFRO), SUL(NS(M_CHANFRO), TROCA_L, M_CHANFRO, M_LESTE),
        T(TROCA_L, LET_S, F_SO, BR, BR2, { ...DEG, dentro: I_S, corredor: 0, escadaNaBorda: true }),
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
    { u: 86, v: 9, w: 7, d: 13, h: 3, cor: '#8f9498' },
    /* a caixa amarela do túnel, ao pé da arquibancada de trás do gol do sul (fotos do dono) */
    { u: -103.2, v: 0, w: 5, d: 6, h: 3.8, cor: '#d9b84a' }
  ],
  /* a câmera da foto do dono: do alto do fundo norte, olhando o fundo sul */
  vista: [118, 78, 46, -88, 0, 2],
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
