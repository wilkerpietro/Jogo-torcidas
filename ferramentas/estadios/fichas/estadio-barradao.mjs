/* BARRADÃO (Estádio Manoel Barradas, Vitória, Salvador) — pelas três fotos
   que o dono mandou (16/11/2026: "vamos pro barradão"; uma do alto do canto da
   arquibancada, um postal aéreo e, na correção, uma da lateral vista do fundo)
   e pelo satélite. O rumo do campo, 158 graus, saiu do contorno do gramado no
   OpenStreetMap; o meio do campo (o círculo central no satélite) fica 7 m fora
   do meio desse contorno.
   No quadro a lateral grande (oeste) fica EMBAIXO, o prédio da tribuna (leste)
   EM CIMA, o fundo do sul-sudeste à DIREITA e o do norte-noroeste à ESQUERDA.
   Arquibancada em U, cavada na encosta, de três lados e cantos chanfrados (por
   fora o chanfro tem 28 m, por dentro 6, e os cantos abrem em leque), em cima
   de um muro vermelho:
   · os DEGRAUS DE BAIXO PINTADOS DE PRETO, uns 8 m, na volta toda (dono,
     16/11/2026: "veja como existe uma listra preta nos degraus de baixo");
   · acima deles o degrau VERMELHO, com outra faixa preta no alto; no meio da
     lateral, as cadeiras vermelhas e, no alto, o prédio vermelho da cabine,
     de três andares, com o letreiro ESTÁDIO MANOEL BARRADAS;
   · nas duas de trás do gol, o LEÃO preto pintado no degrau: de perfil, virado
     pra esquerda de quem olha do campo, a juba grande com o recorte do
     focinho, as quatro patas retas com os três vãos vermelhos e o rabo erguido
     com o tufo virado pra frente. Ocupa um setor só, entre duas escadas (o
     segundo a contar do lado da lateral), da faixa preta de baixo até quase a
     de cima. O contorno foi traçado ponto a ponto na foto do dono, ampliada, e
     tirado da perspectiva pelas duas escadas do setor (dono, 16/11/2026: "o
     desenho do leão ficou muito feio, leia de forma detalhada como se desenha
     esse leão e faça fielmente").
   · no quarto lado, longe do campo (uns 40 m de grama), o prédio vermelho e
     preto da tribuna e dos vestiários, com o placar em cima.
   ESTIMADO: as alturas (o U sobe uns 18 m na encosta); as duas de trás do gol
   ficaram iguais e centradas (no satélite uma está 5 m mais perto do gol que a
   outra) e acabam 6 m antes na ponta do lado do prédio; o leão do fundo da
   direita é o mesmo desenho (lá só há o satélite, que mostra a figura no mesmo
   setor); duas das quatro torres de luz.
   O MURO DO TERRENO não entrou: o estádio fica dentro do vale do clube, e o
   Barradão é dos diferenciados, que levam os arredores de verdade.
   AS TORCIDAS (dono, 16/11/2026: "o mandante fica na arquibancada leste, atrás
   do gol, e o visitante fica na arquibancada no extremo oeste"): Os Imbatíveis
   atrás do gol da direita (o do lado leste); a visitante atrás do gol da
   esquerda; a Camisa 12 na lateral, perto do fundo da casa (escolha minha). */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const VERM = '#c9353a', VERM2 = '#bd2f34', PRETO = '#232427', PRETO2 = '#2c2d31', MURO_V = '#b3262b', GRADE = '#d9cdb4';
/* a beira da grama, o fim dos degraus pretos e o fundo do U */
const I = { a: 64.5, b: 49, r: 6 }, M = { a: 73, b: 57.5, r: 9 }, O = { a: 99.5, b: 83.6, r: 28 };
/* a faixa preta do alto começa a 83% da subida do degrau vermelho */
const ALTO = 0.83;
/* O LEÃO: o contorno no setor dele (`x` de uma escada à outra, da esquerda pra direita de quem olha do campo; `y` do pé do
   degrau vermelho até a faixa preta do alto) */
const LEAO = [[0.149, 0.944], [0.21, 0.972], [0.416, 0.979], [0.484, 0.943], [0.533, 0.824], [0.562, 0.703], [0.596, 0.606], [0.652, 0.536], [0.749, 0.491],
  [0.828, 0.451], [0.876, 0.394], [0.917, 0.326], [0.892, 0.609], [0.818, 0.636], [0.828, 0.697], [0.848, 0.726], [0.959, 0.731], [0.949, 0.675], [0.972, 0.356],
  [0.955, 0.244], [0.879, 0], [0.781, 0], [0.786, 0], [0.811, 0.128], [0.791, 0.172], [0.74, 0.175], [0.706, 0.135], [0.679, 0.001], [0.674, 0], [0.583, 0],
  [0.59, 0.021], [0.606, 0.143], [0.588, 0.181], [0.537, 0.184], [0.513, 0.149], [0.481, 0.018], [0.476, 0], [0.386, 0.001], [0.39, 0.025], [0.394, 0.097],
  [0.372, 0.164], [0.308, 0.187], [0.263, 0.119], [0.241, 0.037], [0.238, 0.013], [0.201, 0.016], [0.206, 0.075], [0.211, 0.193], [0.204, 0.288], [0.18, 0.407],
  [0.172, 0.525], [0.164, 0.642], [0.163, 0.747], [0.169, 0.786], [0.209, 0.795], [0.216, 0.835], [0.157, 0.838], [0.152, 0.894]];
const noLeao = (x, y) => { let c = false; for (let i = 0, j = LEAO.length - 1; i < LEAO.length; j = i++) { const [xi, yi] = LEAO[i], [xj, yj] = LEAO[j];
  if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
/* a pintura do degrau vermelho: a faixa preta no alto e, no setor do leão, a figura */
const pinta = leao => (x, y, rnd) => { const s = rnd() < 0.1;
  if (y > ALTO || (leao && noLeao(x, (y - 0.004) / ALTO))) return s ? PRETO2 : PRETO; return s ? VERM2 : VERM; };
/* os degraus pretos de baixo e o degrau vermelho de cima (sem cadeira, pintados por inteiro) */
const PRETOS = { cor: PRETO, cor2: PRETO2, padrao: 'mosaico', mistura: 0.15, semCadeiras: true, espelhoPintado: true, corredor: 0, escadaNaBorda: true, corEscada: GRADE,
  vomitorios: false, corMureta: MURO_V, corPiso: '#3a3b40' };
const DEGRAU = (leao, mais) => ({ cor: VERM, cor2: VERM2, padrao: 'mosaico', mistura: 0.1, pinta: pinta(leao), semCadeiras: true, espelhoPintado: true, corredor: 0,
  escadaNaBorda: true, corEscada: GRADE, vomitorios: false, parapeito: 1.2, corFachada: PRETO, corLado: PRETO, corPiso: '#3a3b40', corMureta: PRETO, ...mais });
/* os trechos do U num anel `reto`. As duas de trás do gol têm quatro setores entre as escadas, nas mesmas alturas de `v` (as
   divisas em -21,3, 7,8 e 29,1, tiradas da foto e do satélite); `fundo(i)` dá o trecho de cada um (i de 0 a 3, do lado da lateral
   pro lado do prédio) e `lateral` a lista dos trechos da lateral, por faixa de `u` */
const DIV = [-21.3, 7.8, 29.1];
const U = (c, fundo, canto, lateral) => { const s = c.a - c.r, t = c.b - c.r, vs = [-t, ...DIV, t], out = [];
  for (let i = 0; i < 4; i++) out.push({ de: A(c.a, vs[i]) - (vs[i] < 0 ? 360 : 0), ate: A(c.a, vs[i + 1]) - (vs[i + 1] < 0 ? 360 : 0), ...fundo(i, 'direita') });
  out.push({ de: A(c.a, t), ate: A(-c.a, t), tipo: 'vazio' });
  for (let i = 3; i >= 0; i--) out.push({ de: A(-c.a, vs[i + 1]), ate: A(-c.a, vs[i]), ...fundo(i, 'esquerda') });
  out.push({ de: A(-c.a, -t), ate: A(-s, -c.b), ...canto });
  for (const [u0, u1, tr] of lateral(s)) out.push({ de: A(u0, -c.b), ate: A(u1, -c.b), ...tr });
  out.push({ de: A(s, -c.b), ate: A(c.a, -t) - 360 + 360, ...canto });
  return out; };

export default {
  id: 'estadio-barradao', nome: 'Barradão', clubes: ['vitoria'], norte: 158.1, vazado: 0.3, folga: 26,
  chao: { cor: '#7f9a6b' },
  campo: { c: 108, l: 68, corMargem: '#4f9a55' },
  corMureta: MURO_V, alambrado: { cor: '#1c1d20' }, muro: { cor: '#1c1d20' },
  aneis: [
    /* a grama em volta do campo, até o muro vermelho */
    { dentro: { a: 58, b: 38, r: 1 }, fora: I, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    /* os DEGRAUS PRETOS de baixo, em cima do muro vermelho */
    { dentro: I, fora: M, reto: true, h: [2.8, 6.4], fileiras: 8, corredorFrente: 1.2,
      trechos: U(I, () => PRETOS, { ...PRETOS, escadaNaBorda: false }, s => [[-s, -28, PRETOS], [-28, 0, PRETOS], [0, 28, PRETOS], [28, s, PRETOS]]) },
    /* o DEGRAU VERMELHO, acima deles: o leão no segundo setor de cada fundo, as cadeiras vermelhas no meio da lateral */
    { dentro: M, fora: O, reto: true, h: [6.6, 18.6], fileiras: 28, corredorFrente: 0,
      trechos: U(M, i => DEGRAU(i === 1), DEGRAU(false, { escadaNaBorda: false }),
        s => [[-s, -44, DEGRAU(false)], [-44, -28, DEGRAU(false)],
              [-28, -9.5, DEGRAU(false, { semCadeiras: false, espelhoPintado: false })], [-9.5, 9.5, DEGRAU(false, { semCadeiras: false, espelhoPintado: false })],
              [9.5, 28, DEGRAU(false, { semCadeiras: false, espelhoPintado: false })], [28, 44, DEGRAU(false)], [44, s, DEGRAU(false)]]) }
  ],
  fachada: { cor: PRETO },
  refletores: [[-30, 62, 45], [34, 66, 45], [-36, -93, 42], [46, -96, 42]],
  blocos: [
    /* o prédio vermelho da cabine no alto da lateral, no meio: três andares, com as faixas de vidro e o letreiro */
    { u: 0, v: -78.6, w: 21, d: 9.5, h: 9.5, y: 14, cor: MURO_V },
    { u: 0, v: -73.8, w: 19, d: 0.25, h: 1.5, y: 15.2, cor: '#17181c' }, { u: 0, v: -73.8, w: 19, d: 0.25, h: 1.5, y: 20.6, cor: '#17181c' },
    { u: -1.2, v: -73.75, w: 0.3, d: 15, h: 1.5, y: 18, cor: '#17181c', texto: 'ESTÁDIO MANOEL BARRADAS', corTexto: '#f1f1ee', textoFace: true, giro: 90, textoLargura: 0.92, textoAltura: 0.5 },
    { u: 8.6, v: -73.75, w: 2, d: 0.3, h: 2.2, y: 17.7, cor: '#17181c' },
    /* o prédio da tribuna e dos vestiários, do outro lado do campo: vermelho, de teto preto, com a faixa de vidro dos
       camarotes e o placar em cima */
    { u: 1.5, v: 80, w: 93, d: 14, h: 8, cor: MURO_V }, { u: 1.5, v: 80, w: 94, d: 15, h: 0.5, y: 8, cor: '#1c1d20' },
    { u: 1.5, v: 72.9, w: 88, d: 0.3, h: 2.2, y: 4.8, cor: '#15171c' }, { u: 1.5, v: 72.85, w: 93, d: 0.3, h: 1.2, y: 0, cor: '#1c1d20' },
    { u: 6, v: 76, w: 9, d: 1, h: 5, y: 8.5, cor: '#15161a' }, { u: 6, v: 75.45, w: 8, d: 0.15, h: 4, y: 9, cor: '#2b3550' },
    { u: 62, v: 82, w: 26, d: 10, h: 4.2, cor: '#a8242a' },
    /* os bancos de reserva brancos, ao pé da lateral */
    ...[-17, -5.5, 5.5, 17].map(u => ({ u, v: -45.6, w: 9, d: 3, h: 2.3, cor: '#e9e9e4' }))
  ],
  /* a câmera da primeira foto do dono: do alto do canto entre a lateral e o fundo da direita, olhando o leão do outro fundo */
  vista: [96, 25, -80, -30, 4, 8],
  entorno: [
    { tipo: 'quadra', u: -20, v: 138, w: 112, d: 72, cor: '#4f9a55' }, { tipo: 'quadra', u: 138, v: 60, w: 70, d: 108, cor: '#4f9a55' },
    { tipo: 'rua', de: [-170, -106], ate: [170, -106], larg: 9 }, { tipo: 'rua', de: [112, -170], ate: [112, 0], larg: 8 },
    { tipo: 'estacionamento', u: 0, v: 96, w: 80, d: 12 },
    { tipo: 'predio', u: -30, v: -122, w: 60, d: 14, h: 6, cor: '#8c8f8a' }, { tipo: 'predio', u: 40, v: -122, w: 50, d: 14, h: 6, cor: '#8c8f8a' },
    { tipo: 'arvores', u: -124, v: 20, w: 30, d: 150, n: 34 }, { tipo: 'arvores', u: -90, v: 70, w: 40, d: 30, n: 10 },
    { tipo: 'arvores', u: 0, v: -150, w: 240, d: 30, n: 30 }, { tipo: 'arvores', u: 130, v: -60, w: 30, d: 90, n: 18 }
  ],
  jogo: { mandante1: [-18, 18], mandante2: [296, 316], mandante3: [262, 290], visitante: [164, 196], tunelMandante: 80, tunelVisitante: 100, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { os_imbativeis: 'mandante1', camisa_12_do_vitoria: 'mandante2' } }
};
