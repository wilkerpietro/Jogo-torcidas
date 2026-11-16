/* REI PELÉ (o Trapichão, CRB e CSA, Maceió) — pelas cinco imagens que o dono
   mandou (16/11/2026: "alagoas, vamos pro rei pelé [...] aparentemente o formato
   dele é bem complexo"; três aéreas e dois quadros de um vídeo de drone) e pelo
   satélite (o do Google), que foi o que destrinchou o formato. O rumo do campo,
   164 graus, saiu do contorno do gramado no OpenStreetMap.
   No quadro a lateral em ARCO fica EMBAIXO e a arquibancada RETA em cima.
   São DUAS arquibancadas diferentes em volta de uma pista bege em forma de D:
   · o U de dois andares, de telhado marrom em gomos e testeira azul: as duas de
     trás do gol são TIRAS RETAS de 21 m de fundura (vão de v = 99 até virar), e
     a lateral de baixo é um ARCO de círculo (164 m de raio por dentro), que
     chega a 37 m de fundura no meio. Embaixo, o lance descoberto de degrau
     cinza com a faixa de cadeiras; em cima, o lance coberto, com as cadeiras
     nas primeiras fileiras;
   · UMA METADE VERMELHA E A OUTRA AZUL, dividida no meio do campo: as cadeiras
     e as faixas são vermelhas do lado esquerdo (norte, o do CRB) e azuis do
     direito (sul, o do CSA), no U e na arquibancada reta;
   · do outro lado, solta do U, a arquibancada RETA de 138 m: o lance de baixo
     descoberto, de degrau cinza com as faixas de cor, e o de cima
     debaixo do mesmo telhado marrom;
   · a grama é um retângulo de pontas redondas, 20 m mais comprida que o campo
     atrás de cada gol; a pista bege fecha reta do lado da arquibancada reta e
     em arco do lado do U;
   · por fora, no canto, a torre de concreto e a cúpula branca do museu.
   ESTIMADO: as alturas; QUANTO DE CADA ANDAR DO U (o telhado esconde a divisa no
   satélite, que ainda sai deslocado: pus 9 m embaixo e 12 em cima nos fundos, 15
   e 22 no meio do arco); onde ficam as faixas de cor da arquibancada reta; as
   torres de luz; onde fica o letreiro (pus no meio do arco, por fora). As escadas das tiras de trás do gol saem inclinadas (o gerador puxa as
   colunas pro meio do campo); a tira em si está no lugar.
   AS TORCIDAS (escolha minha): a do CRB atrás do gol da esquerda, a do CSA
   atrás do gol da direita, a Garra no meio do arco; a visitante na arquibancada
   reta. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const CINZA = '#babdc1', CINZA2 = '#adb0b5', VERM = '#c2343c', AZUL = '#2f6fc4', AZUL_ESC = '#27468f', MARROM = '#5c4038', MARROM2 = '#4f3730', CONC = '#b9b3a6';
/* um contorno qualquer, dado pelos pontos: vira a lista de raios vistos do meio do campo */
const POLI = (pts, a, b) => ({ forma: 'raios', a, b, raios: Array.from({ length: 720 }, (_, i) => { const t = i * 0.5 * RAD, dx = Math.cos(t), dy = Math.sin(t); let r = 0;
  for (let k = 0; k < pts.length; k++) { const [x1, y1] = pts[k], [x2, y2] = pts[(k + 1) % pts.length], ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
    const q = (x1 * ey - y1 * ex) / den, w = (x1 * dy - y1 * dx) / den; if (q > 0 && w >= 0 && w <= 1) r = Math.max(r, q); }
  return r; }) });
/* o D: reto em cima (em `topo`), as duas tiras retas (em ±`x`) e o arco de baixo (círculo de centro (0, cv) e raio R) */
const D = (x, topo, cv, R, n = 40) => { const pts = [[x, topo], [-x, topo]];
  for (let i = 0; i <= n; i++) { const u = -x + 2 * x * i / n; pts.push([u, cv - Math.sqrt(R * R - u * u)]); }
  return POLI(pts, x, Math.max(topo, R - cv)); };
/* a pista (fecha reta em v = 54,4), a beira do U (as tiras continuam até v = 99), a divisa dos dois andares e o fundo do U */
const PISTA = D(87.7, 54.4, 117, 164), BEIRA = D(87.7, 99, 117, 164), MEIO = D(96.7, 99, 120, 182), FUNDO = D(109, 99, 127.4, 211.8);
/* os ângulos (vistos do meio do campo) onde cada tira de trás do gol começa em cima e vira arco embaixo */
const TIRA = A(98, 99), VIRA = -A(98, -30) + 360;   /* 45,3 e 17 graus */
const DEGRAU = { cor: CINZA, cor2: CINZA2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corredor: 14, vomitorios: false };
/* o telhado marrom em gomos, de testeira azul; `larg` é quanto ele avança do fundo pra frente */
const TELHA = larg => ({ h: 21, larg, avanco: 0.8, cai: 1.4, cor: MARROM, cor2: MARROM2, listras: true, corFrente: AZUL, corTrelica: '#8a8f93', corPilar: '#a9a59a' });
/* UMA METADE VERMELHA E A OUTRA AZUL (dono, 16/11/2026, com mais um quadro do vídeo: "a arquibancada é um lado azul outro
   lado vermelha"): do meio do campo pra esquerda as cadeiras são vermelhas (o lado do CRB), pra direita azuis (o do CSA) */
const EMBAIXO = cor => ({ ...DEGRAU, faixaTopo: { n: 4, cor } });
const EMCIMA = (larg, cor) => ({ ...DEGRAU, faixaBase: { n: 5, cor }, paredeAtras: true, corFachada: CONC, parapeito: 1.4, cobertura: TELHA(larg) });
/* os trechos do U: a tira da direita, o vão de cima (a arquibancada reta fica ali, em outro anel), a tira da esquerda e o
   arco, em cinco pedaços (o telhado é mais fundo no meio) */
const U = (tira, arco) => [
  { de: -VIRA, ate: TIRA, ...tira(false) },
  { de: TIRA, ate: 180 - TIRA, tipo: 'vazio' },
  { de: 180 - TIRA, ate: 180 + VIRA, ...tira(true) },
  ...[[180 + VIRA, 222, 0, true], [222, 250, 1, true], [250, 270, 2, true], [270, 290, 2, false], [290, 318, 1, false], [318, 360 - VIRA, 0, false]]
    .map(([de, ate, k, verm]) => ({ de, ate, ...arco(k, verm) }))];
/* a arquibancada reta: de u = -68 a u = 70, a frente na beira da pista */
const RETA = b => ({ a: 70, b, r: 0.5 }), R0 = A(70, 54.4), R1 = A(-68, 54.4);

export default {
  id: 'estadio-rei-pele', nome: 'Rei Pelé', clubes: ['crb', 'csa'], norte: 164.1, vazado: 0.3, folga: 26,
  chao: { cor: '#908d85' },
  campo: { c: 106, l: 70, corMargem: '#4f9a55' },
  corMureta: '#e9e9e4', alambrado: false, muro: { cor: '#e4e4df' },
  aneis: [
    /* a grama de pontas redondas, mais comprida que o campo, e a pista bege em D */
    { dentro: { a: 56, b: 37.5, r: 1 }, fora: { a: 75, b: 39.5, r: 25 }, h: [0.08, 0.08], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    { dentro: { a: 75, b: 39.5, r: 25 }, fora: PISTA, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#cdbf9e' }] },
    /* o U, EMBAIXO: o lance descoberto */
    { dentro: BEIRA, fora: MEIO, h: [1.4, 6.6], fileiras: 12, corredorFrente: 1.2,
      trechos: U(v => EMBAIXO(v ? VERM : AZUL), (k, v) => EMBAIXO(v ? VERM : AZUL)) },
    /* o U, EM CIMA: o lance coberto, debaixo do telhado marrom */
    { dentro: MEIO, fora: FUNDO, h: [8.4, 16.2], fileiras: 14, corredorFrente: 1.2, corMureta: '#e9e9e4',
      trechos: U(v => EMCIMA(15, v ? VERM : AZUL_ESC), (k, v) => EMCIMA([17, 22, 26][k], v ? VERM : AZUL_ESC)) },
    /* a arquibancada RETA, do outro lado: o lance de baixo, descoberto, com as faixas de cor */
    { dentro: RETA(54.4), fora: RETA(70), reto: true, h: [1.4, 8], fileiras: 16, corredorFrente: 1.2,
      trechos: [
        ...[[R0, 90, AZUL], [90, R1, VERM]].map(([de, ate, c]) => ({ de, ate, ...DEGRAU, padrao: 'fracoes',
          fracoes: [[0.24, CINZA], [0.32, c], [0.58, CINZA], [0.66, c], [0.86, CINZA], [1, c]], corredor: 15 })),
        { de: R1, ate: R0 + 360, tipo: 'vazio' }] },
    /* e o lance de cima dela, debaixo do mesmo telhado marrom */
    { dentro: RETA(70), fora: RETA(88.8), reto: true, h: [9.6, 17.6], fileiras: 18, corredorFrente: 1.2, corMureta: '#e9e9e4',
      trechos: [
        { de: A(70, 70), ate: A(-68, 70), ...DEGRAU, corredor: 15, paredeAtras: true, corFachada: CONC, parapeito: 1.4, cobertura: { ...TELHA(21), h: 22.5, pelaColuna: true } },
        { de: A(-68, 70), ate: A(70, 70) + 360, tipo: 'vazio' }] }
  ],
  fachada: { cor: CONC },
  refletores: [[-84, -86, 45], [84, -86, 45], [-84, 106, 45], [84, 106, 45]],
  blocos: [
    /* os bancos de reserva, na pista, ao pé do arco */
    { u: -22, v: -41.6, w: 16, d: 2.4, h: 2.2, cor: '#e9e9e4' }, { u: 22, v: -41.6, w: 16, d: 2.4, h: 2.2, cor: '#e9e9e4' }, { u: 0, v: -42.4, w: 8, d: 2, h: 2.2, cor: '#c2343c' },
    /* o letreiro da entrada, na faixa branca do lado de fora do arco */
    { u: 0, v: -85.2, w: 0.4, d: 44, h: 3, y: 3.2, cor: '#f1f1ee', texto: 'ESTÁDIO REI PELÉ', corTexto: '#1f5fc0', textoFace: true, giro: -90, textoLargura: 0.92, textoAltura: 0.6 },
    /* a torre de concreto e a cúpula branca do museu, por fora, no canto do arco com a tira da direita */
    { u: 92, v: -84, w: 8, d: 3, h: 26, cor: '#b3ada0' },
    { u: 106, v: -62, w: 13, d: 13, h: 4.4, cor: '#e9e9e4' }, { u: 106, v: -62, w: 8, d: 8, h: 2.6, y: 4.4, cor: '#f4f4f1' }
  ],
  /* a câmera do segundo quadro de vídeo do dono: do alto, do lado da arquibancada reta, olhando o arco coberto */
  vista: [30, 40, 78, -20, 4, -60],
  entorno: [
    { tipo: 'predio', u: 14, v: 126, w: 112, d: 40, h: 14, cor: '#c9c3b2' },
    { tipo: 'rua', de: [-170, -118], ate: [170, -118], larg: 14 }, { tipo: 'rua', de: [132, -170], ate: [132, 170], larg: 12 },
    { tipo: 'rua', de: [-128, -170], ate: [-128, 170], larg: 9 }, { tipo: 'estacionamento', u: 0, v: -104, w: 150, d: 16 },
    { tipo: 'casas', u: -154, v: 0, nu: 2, nv: 12, passo: 15 }, { tipo: 'casas', u: 0, v: -146, nu: 16, nv: 1, passo: 15 },
    { tipo: 'predio', u: 120, v: 60, w: 14, d: 50, h: 6, cor: '#8f9a8c' }, { tipo: 'arvores', u: 118, v: -30, w: 8, d: 30, n: 4 }
  ],
  jogo: { mandante1: [164, 194], mandante2: [-14, 16], mandante3: [254, 286], visitante: [72, 108], tunelMandante: 262, tunelVisitante: 278, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { comando_alvirrubro: 'mandante1', garra: 'mandante3', mancha_azul_do_csa: 'mandante2' } }
};
