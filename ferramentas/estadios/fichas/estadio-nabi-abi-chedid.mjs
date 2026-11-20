/* NABI ABI CHEDID (Bragantino, Bragança Paulista) — o estádio FOI DEMOLIDO:
   o satélite atual do Google mostra o canteiro de obra do estádio novo. O
   modelo é o estádio antigo, medido num satélite mais velho (Bing, com ele
   de pé) e conferido com as fotos de referência (15/11/2026); o meio do
   campo foi tirado do círculo central. O campo corre de sudeste a noroeste;
   no quadro o SUDOESTE (a coberta) fica em cima e o NOROESTE à direita.
   NÃO achei mapa de setores do clube.
   Estádio retangular, apertado entre duas ruas, com os quatro lados
   diferentes:
   · EM CIMA (sudoeste), a COBERTA: reta, comprida, de cadeira clara, toda
     debaixo do telhado cinza (com a faixa mais clara das cabines no meio).
     Na ponta noroeste dela, descoberto, o bloco de cadeira AZUL, que faz o
     canto.
   · À DIREITA (noroeste), atrás do gol: a arquibancada LISTRADA de preto e
     branco, em faixas que sobem da frente ao fundo (as cores do clube).
   · À ESQUERDA (sudeste), atrás do gol: a arquibancada VERDE, alta e
     recuada, com as escadas amarelas e o muro branco na frente; entre ela e
     o gramado, o pátio de concreto.
   · EMBAIXO (nordeste): só um degrau baixo e estreito ao longo da rua,
     coberto pelas lonas vermelhas dos anúncios.
   OS ACESSOS: nenhuma boca de vomitório aparece; ficou sem. */
const PT = '#2b2d33', BR = '#eeeeea', AZ = '#2f58b0', VD = '#5f9e5a', AM = '#e3c94a';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a beira do gramado; a frente e o fundo das arquibancadas do sudoeste, do canto e do noroeste */
const GRAMA = { a: 63, b: 39, r: 3 }, D = { a: 65, b: 40, r: 4 }, F = { a: 84, b: 59, r: 23 };
/* a coberta passa do canto sul: contorno próprio; o degrau baixo do nordeste; a verde, recuada */
const C_D = { a: 80, b: 40, r: 2 }, C_F = { a: 99, b: 59, r: 21 };
const N_D = { a: 80, b: 40, r: 2 }, N_F = { a: 84.5, b: 44.5, r: 6.5 };
const V_D = { a: 77.5, b: 60, r: 2 }, V_F = { a: 88, b: 70.5, r: 12.5 };
const CAD = (de, ate, cor, cor2, mais) => ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: true, corEscada: '#d9d6cc', vomitorios: false, ...mais });
/* a coberta, bloco a bloco (do noroeste pro sudeste): o bloco azul descoberto, o amarelo e os claros */
const COBERTA = [[61, 46.7, AZ, '#2a4f9e'], [46.7, 30, '#d9b84a', '#cfae42'], [30, 10, BR, '#dcdcd6'], [10, -10, BR, '#dcdcd6'], [-10, -30, BR, '#dcdcd6'], [-30, -50, BR, '#dcdcd6'], [-50, -71.7, BR, '#dcdcd6']]
  .map(([u0, u1, cor, cor2]) => CAD(A(u0, 40), A(u1, 40), cor, cor2, { dentro: C_D, fora: C_F, escadaNaBorda: u0 < 61, corEscada: cor === AZ ? AM : '#d9d6cc', paredeAtras: true, corFachada: '#d9d6cc' }));
/* a listrada: 14 faixas de 5 m, preta e branca, da frente ao fundo */
const LISTRADA = Array.from({ length: 14 }, (_, i) => ({ de: A(65, -35 + i * 5) - (i < 7 ? 360 : 0), ate: A(65, -30 + i * 5) - (i < 7 ? 360 : 0) + (i === 6 ? 360 : 0), cor: i % 2 ? BR : PT, cor2: i % 2 ? '#e3e3df' : '#33363d',
  padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corredor: 0, vomitorios: false, paredeAtras: true, corFachada: '#d9d6cc' }));
/* a verde, bloco a bloco (de cima pra baixo no quadro), com as escadas amarelas */
const VERDE = [[55, 35], [35, 20.8], [20.8, 8.3], [8.3, -5.8], [-5.8, -19], [-19, -30]].map(([v0, v1]) => ({ de: A(-77.5, v0), ate: A(-77.5, v1), dentro: V_D, fora: V_F, h: [3, 11], cor: VD, cor2: '#559250',
  padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 0, escadaNaBorda: v0 < 55, corEscada: AM, vomitorios: false, corMureta: BR, paredeAtras: true, corFachada: BR }));

export default {
  id: 'estadio-nabi-abi-chedid', nome: 'Nabi Abi Chedid', clubes: ['bragantino'], norte: 316.4, vazado: 0.4, folga: 20,
  corEscada: '#d9d6cc',
  chao: { cor: '#7b7870' },
  campo: { corMargem: '#4a8a4c' },
  corMureta: '#e3e1da',
  aneis: [
    /* a calçada em volta do gramado; atrás do gol do sudeste ela vira o pátio de concreto até o pé da arquibancada verde */
    { dentro: GRAMA, fora: D, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: -153, ate: 150, tipo: 'passagem', cor: '#a9a69c' }, { de: 150, ate: 207, tipo: 'passagem', cor: '#b9b2a2', fora: V_D }] },
    /* AS ARQUIBANCADAS */
    { dentro: D, fora: F, reto: true, andarReto: true, h: [1.5, 11], fileiras: 20,
      trechos: [
        ...LISTRADA,
        /* o canto oeste: o leque de cadeira azul */
        CAD(A(65, 36), A(61, 40), AZ, '#2a4f9e', { escadaNaBorda: false, paredeAtras: true, corFachada: '#d9d6cc' }),
        ...COBERTA,
        ...VERDE,
        /* o degrau baixo do nordeste, debaixo das lonas vermelhas */
        { de: A(-44, -40), ate: A(58, -40), dentro: N_D, fora: N_F, h: [0.8, 2.6], cor: '#c4324e', cor2: '#b52c46', padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corredor: 0, corredorFrente: 0, vomitorios: false,
          paredeAtras: true, corFachada: '#e3e1da' }
      ] }
  ],
  /* o telhado cinza da coberta e a faixa mais clara das cabines */
  telhados: [
    { y: 15, h: 0.5, cor: '#8f9aa3', pontos: [[-71.7, 42.5], [46.7, 42.5], [46.7, 59.5], [-71.7, 59.5]] },
    { y: 15.5, h: 0.3, cor: '#c9c9c4', pontos: [[-26.7, 42.5], [10, 42.5], [10, 54], [-26.7, 54]] }
  ],
  fachada: { cor: '#d9d6cc' },
  refletores: [[-62, 62, 36], [70, 62, 36], [-58, -47, 36], [64, -48, 36]],
  blocos: [
    /* o muro de trás do gol do sudeste, por fora da verde */
    { u: -90, v: 12, w: 2, d: 88, h: 4, cor: BR }
  ],
  entorno: [
    /* as duas ruas que apertam o estádio, e as casas dos dois lados */
    { tipo: 'rua', de: [-105, 66], ate: [105, 66], larg: 9 }, { tipo: 'rua', de: [-105, -52], ate: [105, -52], larg: 9 },
    { tipo: 'casas', u: 0, v: -70, nu: 12, nv: 1, passo: 15 }, { tipo: 'casas', u: -20, v: 82, nu: 6, nv: 1, passo: 15 },
    /* as árvores atrás da verde e atrás da listrada */
    { tipo: 'arvores', u: -100, v: 10, w: 10, d: 90, n: 16 }, { tipo: 'arvores', u: 98, v: 20, w: 10, d: 50, n: 8 },
    { tipo: 'predio', u: 98, v: -30, w: 10, d: 12, h: 5, cor: '#e9e9e4' }
  ],
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Guerreiros do Leão na arquibancada listrada, atrás do gol do
     noroeste, e a visitante na verde, atrás do gol do sudeste; os outros bondes da casa na coberta */
  jogo: { mandante1: [-18, 18], mandante2: [80, 110], mandante3: [118, 138], visitante: [166, 194], tunelMandante: 0, tunelVisitante: 180, folgaPM: 4,
          fracao: { mandante1: 0.55, mandante2: 0.55, mandante3: 0.55, visitante1: 0.8, visitante2: 0.85, visitante3: 0.75 },
          torcidas: { guerreiros_do_leao: 'mandante1' } }
};
