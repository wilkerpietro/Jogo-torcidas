/* BARRADÃO (Estádio Manoel Barradas, Vitória, Salvador) — pelas duas fotos
   que o dono mandou (16/11/2026: "vamos pro barradão"; uma do alto do canto da
   arquibancada e um postal aéreo) e pelo satélite. O rumo do campo, 158 graus,
   saiu do contorno do gramado no OpenStreetMap; o meio do campo (o círculo
   central no satélite) fica 7 m fora do meio desse contorno.
   No quadro a lateral grande fica EMBAIXO e o prédio da tribuna EM CIMA.
   Arquibancada em U, cavada na encosta, de três lados e cantos chanfrados (por
   fora o chanfro tem 28 m, por dentro 6, e os cantos abrem em leque):
   · junto do campo, a faixa de CADEIRAS PRETAS, de uns 8 m, na volta toda;
   · acima dela, o DEGRAU PINTADO DE VERMELHO, com a faixa preta no alto; nas
     duas de trás do gol, o LEÃO preto pintado no degrau (o satélite mostra a
     figura escura nas duas);
   · no alto da lateral, no meio, a cabine vermelha.
   · EM CIMA, no quarto lado, longe do campo (uns 40 m de grama), o prédio
     vermelho e preto da tribuna e dos vestiários, com o placar em cima, e as
     duas torres de luz.
   ESTIMADO: as alturas (o U sobe uns 17 m na encosta); o DESENHO DO LEÃO (uma
   silhueta simples, de perfil; a de verdade é mais detalhada); as duas de trás
   do gol ficaram iguais e centradas (no satélite uma está 5 m mais perto do
   gol que a outra) e acabam 6 m antes na ponta de cima.
   O MURO DO TERRENO não entrou: o estádio fica dentro do vale do clube, e o
   Barradão é dos diferenciados, que levam os arredores de verdade.
   AS TORCIDAS: Os Imbatíveis no meio da lateral (escolha minha); a Camisa 12
   atrás do gol da esquerda, onde está a faixa dela na foto do dono; a
   visitante atrás do gol da direita (escolha minha). */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const VERM = '#c9353a', VERM2 = '#bd2f34', PRETO = '#232427', PRETO2 = '#2e2f33';
/* a beira da grama, o fim das cadeiras e o fundo do U */
const I = { a: 64.5, b: 49, r: 6 }, M = { a: 73, b: 57.5, r: 9 }, O = { a: 99.5, b: 83.6, r: 28 };
/* o leão: uma silhueta de perfil numa caixa de 40 × 20 (o focinho à esquerda, o rabo à direita) */
const LEAO = [[4, 12], [5, 15], [8, 17.5], [13, 17], [16, 14.5], [26, 14], [31, 15], [35, 17], [38, 18.5], [37.5, 16.5], [34, 13], [33, 9], [34.5, 3], [36, 1], [32, 1],
  [31, 5], [29, 8.5], [19, 8], [18, 4], [19, 1], [15, 1], [14.5, 5], [13, 8], [10, 7.5], [6, 9], [4, 10.5]];
const noLeao = (x, y) => { let c = false; for (let i = 0, j = LEAO.length - 1; i < LEAO.length; j = i++) { const [xi, yi] = LEAO[i], [xj, yj] = LEAO[j];
  if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
/* a pintura do degrau de trás do gol: vermelho, a faixa preta no alto e o leão no meio (`x` da esquerda pra direita de quem
   olha do campo, `y` de baixo pra cima) */
const comLeao = espelha => (x, y, rnd) => { const s = rnd() < 0.12, lx = ((espelha ? 1 - x : x) - 0.2) / 0.6 * 40, ly = (y - 0.16) / 0.68 * 20;
  if (y > 0.9 || noLeao(lx, ly)) return s ? PRETO2 : PRETO; return s ? VERM2 : VERM; };
const semLeao = (x, y, rnd) => { const s = rnd() < 0.12; return y > 0.9 ? (s ? PRETO2 : PRETO) : (s ? VERM2 : VERM); };
const CADEIRA = { cor: PRETO, cor2: PRETO2, padrao: 'mosaico', mistura: 0.25, corredor: 14, corEscada: '#55565b', vomitorios: false };
const DEGRAU = pinta => ({ cor: VERM, cor2: VERM2, padrao: 'mosaico', mistura: 0.12, pinta, semCadeiras: true, espelhoPintado: true, corredor: 20, corEscada: '#d9d7d1',
  vomitorios: false, parapeito: 1.2, corFachada: PRETO, corLado: PRETO });
/* os trechos do U num anel `reto`: os dois fundos, os dois cantos em leque e a lateral; em cima, nada */
const U = (c, fundo1, canto, lateral, fundo2) => { const s = c.a - c.r, t = c.b - c.r; return [
  { de: A(c.a, -t) - 360, ate: A(c.a, t), ...fundo1 },
  { de: A(c.a, t), ate: A(-c.a, t), tipo: 'vazio' },
  { de: A(-c.a, t), ate: A(-c.a, -t), ...fundo2 },
  { de: A(-c.a, -t), ate: A(-s, -c.b), ...canto },
  { de: A(-s, -c.b), ate: A(s, -c.b), ...lateral },
  { de: A(s, -c.b), ate: A(c.a, -t), ...canto }]; };

export default {
  id: 'estadio-barradao', nome: 'Barradão', clubes: ['vitoria'], norte: 158.1, vazado: 0.3, folga: 26,
  chao: { cor: '#7f9a6b' },
  campo: { c: 108, l: 68, corMargem: '#4f9a55' },
  corMureta: PRETO, alambrado: { cor: '#1c1d20' }, muro: { cor: '#1c1d20' },
  aneis: [
    /* a grama em volta do campo, até a mureta preta */
    { dentro: { a: 58, b: 38, r: 1 }, fora: I, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    /* as CADEIRAS PRETAS, junto do campo */
    { dentro: I, fora: M, reto: true, h: [1.2, 5], fileiras: 8, corredorFrente: 2,
      trechos: U(I, CADEIRA, { ...CADEIRA, corredor: 0 }, CADEIRA, CADEIRA) },
    /* o DEGRAU VERMELHO, acima delas: o leão nas duas de trás do gol */
    { dentro: M, fora: O, reto: true, h: [5.4, 17.5], fileiras: 28, corredorFrente: 1.4,
      trechos: U(M, DEGRAU(comLeao(false)), { ...DEGRAU(semLeao), corredor: 0 }, { ...DEGRAU(semLeao), corredor: 18 }, DEGRAU(comLeao(true))) }
  ],
  fachada: { cor: PRETO },
  refletores: [[-30, 62, 45], [34, 66, 45]],
  blocos: [
    /* a cabine vermelha no alto da lateral, no meio */
    { u: 0, v: -81.4, w: 13, d: 4.4, h: 4, y: 17.5, cor: '#b3262b' }, { u: 0, v: -79.1, w: 11.6, d: 0.2, h: 1.6, y: 19, cor: '#1c1d20' },
    /* o prédio da tribuna e dos vestiários, do outro lado do campo: vermelho, de teto preto, com a faixa de vidro dos
       camarotes e o placar em cima */
    { u: 1.5, v: 80, w: 93, d: 14, h: 8, cor: '#b3262b' }, { u: 1.5, v: 80, w: 94, d: 15, h: 0.5, y: 8, cor: '#1c1d20' },
    { u: 1.5, v: 72.9, w: 88, d: 0.3, h: 2.2, y: 4.8, cor: '#15171c' }, { u: 1.5, v: 72.85, w: 93, d: 0.3, h: 1.2, y: 0, cor: '#1c1d20' },
    { u: 6, v: 76, w: 9, d: 1, h: 5, y: 8.5, cor: '#15161a' }, { u: 6, v: 75.45, w: 8, d: 0.15, h: 4, y: 9, cor: '#2b3550' },
    { u: 62, v: 82, w: 26, d: 10, h: 4.2, cor: '#a8242a' },
    /* os bancos de reserva brancos, ao pé da lateral */
    ...[-17, -5.5, 5.5, 17].map(u => ({ u, v: -45.6, w: 9, d: 3, h: 2.3, cor: '#e9e9e4' }))
  ],
  /* a câmera da foto do dono: do alto do canto entre a lateral e o fundo da direita, olhando o leão do outro fundo */
  vista: [94, 24, -78, -30, 2, 12],
  entorno: [
    { tipo: 'quadra', u: -20, v: 138, w: 112, d: 72, cor: '#4f9a55' }, { tipo: 'quadra', u: 138, v: 60, w: 70, d: 108, cor: '#4f9a55' },
    { tipo: 'rua', de: [-170, -106], ate: [170, -106], larg: 9 }, { tipo: 'rua', de: [112, -170], ate: [112, 0], larg: 8 },
    { tipo: 'estacionamento', u: 0, v: 96, w: 80, d: 12 },
    { tipo: 'predio', u: -30, v: -122, w: 60, d: 14, h: 6, cor: '#8c8f8a' }, { tipo: 'predio', u: 40, v: -122, w: 50, d: 14, h: 6, cor: '#8c8f8a' },
    { tipo: 'arvores', u: -124, v: 20, w: 30, d: 150, n: 34 }, { tipo: 'arvores', u: -90, v: 70, w: 40, d: 30, n: 10 },
    { tipo: 'arvores', u: 0, v: -150, w: 240, d: 30, n: 30 }, { tipo: 'arvores', u: 130, v: -60, w: 30, d: 90, n: 18 }
  ],
  jogo: { mandante1: [252, 288], mandante2: [164, 196], mandante3: [226, 246], visitante: [-18, 18], tunelMandante: 80, tunelVisitante: 100, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { os_imbativeis: 'mandante1', camisa_12_do_vitoria: 'mandante2' } }
};
