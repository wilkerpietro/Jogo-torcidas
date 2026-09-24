/* =========================================================
   OS MARCOS — cinco prédios modelados peça por peça, e o atacarejo
   ---------------------------------------------------------
   A igreja matriz, o prédio alto, o prédio de três andares com o
   mercado, o centro administrativo e a casa de classe média; o
   ATACADEX, o atacarejo no mato a oeste da cidade; e as duas torres
   do condomínio que tomou o miolo do baldio. Quem diz
   ONDE cada um fica, pra que lado olha e quais são os volumes grandes
   é a planta (`dados/cena_estadio.js`, "OS MARCOS"); aqui a massa
   ganha fachada.

   COMO A FACHADA É FEITA. Cada prédio tem uma FOLHA de textura
   (`img/texturas/modelos/*.jpg`, pintada por
   `ferramentas/pintar_modelos.py`) com as peças dele: a janela do
   prédio alto com o peitoril embaixo, a porta verde da igreja com a
   cantaria em volta, o letreiro do mercado. A fachada é montada
   repetindo peças — o 7º andar usa a mesma janela do 3º —, e as
   superfícies lisas (reboco, telha, tijolo) são LADRILHADAS no tamanho
   de mundo da peça, recortadas no contorno da face. Uma folha por
   prédio, um material, uma chamada de desenho.

   O construtor de fachada mora em `construtor3d.js` (as casas da
   cidade usam o mesmo).

   O REFERENCIAL. Tudo aqui é em METROS, no referencial do prédio: x da
   esquerda pra direita de quem olha a fachada, y pra cima, z negativo
   entrando no terreno (a fachada fica em z ≈ 0). A conversão pro
   mundo é a mesma rotação que a planta usa (nunca espelha, então o
   letreiro não sai ao contrário).

   Relevo que conta de verdade é GEOMETRIA: pilastra, cornija, laje,
   requadro da janela, toldo, ar-condicionado. O resto é pintura.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';
import { ATLAS } from './modelos_atlas.js';
import { Construtor, METRO, lerp, sub, soma, esc, pv, pe, unit, recuoPoligono, mureta, toldo, arSplit } from './construtor3d.js';

/* =======================================================
   1. A IGREJA MATRIZ
   Duas torres com cúpula bulbosa e pináculos, frontão de volutas
   com o medalhão e a cruz, cantaria nas pilastras e cornijas, porta
   e janelas verdes, nave com telhado de duas águas e a capela-mor
   atrás, mais baixa.
   ======================================================= */
function igreja(B, m) {
  const { fz, T, xa, xb, xm } = m;
  const xc0 = xa + T, xc1 = xb - T, lc = xc1 - xc0;
  const hN = m.hNave, hC = m.hCornija, hF = m.hFundo, hT = m.hTorre;
  const R = 'reboco', P = 'cantaria';
  const naveZ = m.naveZ, fundoZ = m.fundoZ;
  const incl = Math.tan(25 * Math.PI / 180);

  /* ---- a fachada ---- */
  const frente = (x0) => B.plano([x0, 0, fz], [1, 0, 0], [0, 1, 0]);
  const cm = lc / 2;
  B.fachada(frente(xc0), lc, hN, R, [
    { a0: cm - 1.2, a1: cm + 1.2, b0: 0.2, b1: 4.65, k: 'porta' },
    { a0: cm - 0.45, a1: cm + 0.45, b0: 4.85, b1: 5.45, k: 'placa' },
    { a0: cm - 2.075, a1: cm - 0.625, b0: 5.25, b1: 8.45, k: 'sacada' },
    { a0: cm + 0.625, a1: cm + 2.075, b0: 5.25, b1: 8.45, k: 'sacada' },
    { a0: cm - 0.5, a1: cm + 0.5, b0: 7.35, b1: 8.35, k: 'losango' }
  ]);
  for (const x0 of [xa, xc1]) {
    B.fachada(frente(x0), T, hT, R, [
      { a0: T / 2 - 0.25, a1: T / 2 + 0.25, b0: 2.4, b1: 2.9, k: 'oculo_p' },
      { a0: T / 2 - 0.5, a1: T / 2 + 0.5, b0: 6.3, b1: 7.3, k: 'oculo' },
      { a0: T / 2 - 0.65, a1: T / 2 + 0.65, b0: 10.45, b1: 13.25, k: 'sineira' }
    ]);
  }
  /* o frontão, com a cruz em cima */
  const cont = ATLAS.igreja.frontao;
  B.extrudar(B.plano([xc0 + (lc - 5.65) / 2, hC, fz], [1, 0, 0], [0, 1, 0]), cont, 0.45, 'frontao', P, R);
  const topoF = hC + 3.4;
  B.caixa(xm - 0.07, xm + 0.07, topoF, topoF + 1.35, fz - 0.3, fz - 0.16, { todas: P });
  B.caixa(xm - 0.34, xm + 0.34, topoF + 0.82, topoF + 0.95, fz - 0.3, fz - 0.16, { todas: P });

  /* ---- os lados da nave (com a torre na frente) e da capela-mor ---- */
  const L = fz - naveZ;                                  // o comprimento da nave
  const vaosLado = a => [
    { a0: a(T / 2) - 0.25, a1: a(T / 2) + 0.25, b0: 2.4, b1: 2.9, k: 'oculo_p' },
    { a0: a(5.02) - 0.65, a1: a(5.02) + 0.65, b0: 5.5, b1: 8.1, k: 'janela' },
    { a0: a(5.02) - 0.75, a1: a(5.02) + 0.75, b0: 0.25, b1: 3.45, k: 'porta_lat' },
    { a0: a(8.4) - 0.65, a1: a(8.4) + 0.65, b0: 5.5, b1: 8.1, k: 'janela' },
    { a0: a(8.4) - 0.25, a1: a(8.4) + 0.25, b0: 2.4, b1: 2.9, k: 'oculo_p' },
    { a0: a(11.75) - 0.65, a1: a(11.75) + 0.65, b0: 5.5, b1: 8.1, k: 'janela' }
  ];
  /* o lado esquerdo (x = xa) corre de trás pra frente; o direito, de
     frente pra trás — `a(d)` converte "d metros atrás da fachada" */
  B.fachada(B.plano([xa, 0, naveZ], [0, 0, 1], [0, 1, 0]), L, hN, R, vaosLado(d => L - d));
  B.fachada(B.plano([xb, 0, fz], [0, 0, -1], [0, 1, 0]), L, hN, R, vaosLado(d => d));
  const LF = naveZ - fundoZ;
  const janelinhas = a => [1.5, 3.4, 5.3].flatMap(d => [
    { a0: a(d) - 0.45, a1: a(d) + 0.45, b0: 1.55, b1: 2.7, k: 'janelinha' },
    { a0: a(d) - 0.45, a1: a(d) + 0.45, b0: 4.6, b1: 5.75, k: 'janelinha' }]);
  B.fachada(B.plano([xa, 0, fundoZ], [0, 0, 1], [0, 1, 0]), LF, hF, R, janelinhas(d => LF - d));
  B.fachada(B.plano([xb, 0, naveZ], [0, 0, -1], [0, 1, 0]), LF, hF, R, janelinhas(d => d));
  /* o fundo da capela-mor e a empena dela */
  const larg = xb - xa;
  B.fachada(B.plano([xb, 0, fundoZ], [-1, 0, 0], [0, 1, 0]), larg, hF, R, [
    { a0: larg / 2 - 2.2, a1: larg / 2 - 1.3, b0: 4.6, b1: 5.75, k: 'janelinha' },
    { a0: larg / 2 + 1.3, a1: larg / 2 + 2.2, b0: 4.6, b1: 5.75, k: 'janelinha' },
    { a0: larg / 2 - 0.75, a1: larg / 2 + 0.75, b0: 0.25, b1: 3.45, k: 'porta_lat' }
  ]);
  const hFc = hF + 0.35, riseF = (larg / 2 + 0.35) * incl;
  /* a empena acompanha a água por baixo: no pé da parede o telhado já
     subiu o que o beiral avança (0,35 × inclinação), então é um
     pentágono, não um triângulo — com o triângulo sobrava uma fresta
     de céu entre a parede e a telha */
  const empena = (z, n, y0, rise) => {
    const F = n > 0 ? B.plano([xa, y0, z], [1, 0, 0], [0, 1, 0]) : B.plano([xb, y0, z], [-1, 0, 0], [0, 1, 0]);
    const e = 0.35 * incl;
    B.ladrilhar(F, [[0, 0], [larg, 0], [larg, e], [larg / 2, rise], [0, e]], R);
  };
  empena(fundoZ, -1, hFc, riseF);
  /* a parede de trás da nave, que sobra acima da capela-mor, e a empena dela */
  B.ladrilhar(B.plano([xb, hF, naveZ], [-1, 0, 0], [0, 1, 0]), B.ret(0, larg, 0, hN - hF), R);
  const riseN = (larg / 2 + 0.35) * incl;
  empena(naveZ, -1, hC, riseN);

  /* ---- as torres acima da nave ---- */
  for (const x0 of [xa, xc1]) {
    const x1 = x0 + T, z0 = fz - T;
    const sineira = { a0: T / 2 - 0.65, a1: T / 2 + 0.65, b0: 10.45 - hN, b1: 13.25 - hN, k: 'sineira' };
    B.fachada(B.plano([x0, hN, z0], [0, 0, 1], [0, 1, 0]), T, hT - hN, R, [sineira]);
    B.fachada(B.plano([x1, hN, fz], [0, 0, -1], [0, 1, 0]), T, hT - hN, R, [sineira]);
    B.fachada(B.plano([x1, hN, z0], [-1, 0, 0], [0, 1, 0]), T, hT - hN, R, [sineira]);
    /* a cornija do alto da torre, a cúpula, o pináculo das quinas */
    B.caixa(x0 - 0.25, x1 + 0.25, hT, hT + 0.5, z0 - 0.25, fz + 0.25, { todas: P });
    B.caixa(x0 - 0.12, x1 + 0.12, hN, hC, z0 - 0.12, fz + 0.12, { todas: P, base: null });
    const cx = x0 + T / 2, cz = fz - T / 2, y0 = hT + 0.5, s = T / 3.3;
    B.torno(cx, cz, [[1.36 * s, y0], [1.42 * s, y0 + 0.25], [1.46 * s, y0 + 0.55], [1.38 * s, y0 + 0.92],
                     [1.18 * s, y0 + 1.32], [0.86 * s, y0 + 1.72], [0.5 * s, y0 + 2.06], [0.22 * s, y0 + 2.3],
                     [0.07, y0 + 2.45], [0, y0 + 2.5]], 14, 'cupula');
    B.torno(cx, cz, [[0.02, y0 + 2.4], [0.11, y0 + 2.55], [0.12, y0 + 2.66], [0.09, y0 + 2.76], [0.03, y0 + 2.8],
                     [0.03, y0 + 3.1], [0, y0 + 3.6]], 8, P);
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, fz], [x1, fz]]) {
      B.caixa(px - 0.17, px + 0.17, y0, y0 + 0.32, pz - 0.17, pz + 0.17, { todas: P });
      B.torno(px, pz, [[0.13, y0 + 0.32], [0.1, y0 + 0.9], [0.06, y0 + 1.4], [0, y0 + 1.9]], 6, P);
    }
  }

  /* ---- a cantaria: embasamento, pilastras e cornijas ---- */
  const embasa = (x0, x1, z0, z1) => B.caixa(x0, x1, 0, 0.45, z0, z1, { todas: P, base: null });
  embasa(xa - 0.08, xm - 1.25, fz - 0.08, fz + 0.08);
  embasa(xm + 1.25, xb + 0.08, fz - 0.08, fz + 0.08);
  for (const x of [xa, xb]) {
    const s = x === xa ? -1 : 1;
    const zPorta = fz - 5.02;
    embasa(Math.min(x, x + s * 0.08), Math.max(x, x + s * 0.08), zPorta + 0.78, fz);
    embasa(Math.min(x, x + s * 0.08), Math.max(x, x + s * 0.08), fundoZ - 0.08, zPorta - 0.78);
  }
  embasa(xa - 0.08, xb + 0.08, fundoZ - 0.08, fundoZ);
  /* pilastras da fachada: nas quinas das torres (até o alto) e nas
     juntas das torres com o corpo do meio (até a cornija) */
  const pilastraF = (x, y1) => B.caixa(x - 0.28, x + 0.28, 0.45, y1, fz, fz + 0.12, { todas: P, base: null });
  pilastraF(xa + 0.28, hT); pilastraF(xb - 0.28, hT); pilastraF(xc0, hN); pilastraF(xc1, hN);
  /* pilastras dos lados, nas divisas dos panos. Só a da quina da
     frente sobe até o alto da torre; a da junta da nave com a
     capela-mor fica inteira do lado da nave (metade dela pra trás
     subiria solta acima do telhado baixo) */
  for (const d of [0.28, T, 6.7, 10.1, L - 0.28, L + 0.28, L + LF - 0.28]) {
    const z = fz - d, yTopo = d < 1 ? hT : d > L ? hF : hN;
    B.caixa(xa - 0.12, xa, 0.45, yTopo, z - 0.28, z + 0.28, { todas: P, base: null });
    B.caixa(xb, xb + 0.12, 0.45, yTopo, z - 0.28, z + 0.28, { todas: P, base: null });
  }
  /* a cornija da nave, que corre pela fachada e pelos dois lados */
  B.caixa(xa - 0.25, xb + 0.25, hN, hC, fz - 0.3, fz + 0.25, { todas: P });
  B.caixa(xa - 0.25, xa + 0.05, hN, hC, naveZ, fz - 0.3, { todas: P });
  B.caixa(xb - 0.05, xb + 0.25, hN, hC, naveZ, fz - 0.3, { todas: P });
  B.caixa(xa - 0.25, xb + 0.25, hN, hC, naveZ - 0.3, naveZ + 0.05, { frente: null, todas: P });
  B.caixa(xa - 0.2, xb + 0.2, hF, hFc, fundoZ - 0.2, naveZ, { frente: null, todas: P });

  /* os dois degraus de pedra na porta */
  B.caixa(xm - 1.6, xm + 1.6, 0, 0.22, fz, fz + 0.5, { todas: P, base: null });
  B.caixa(xm - 1.45, xm + 1.45, 0.22, 0.45, fz, fz + 0.25, { todas: P, base: null });

  /* ---- os telhados ---- */
  const beiral = 0.35, meia = larg / 2 + beiral;
  const rise = meia * incl, cumN = hC + rise, lenAgua = meia / Math.cos(25 * Math.PI / 180);
  const aguas = (y0, zTras, zFrente, cortes) => {
    /* água da esquerda: U corre de trás pra frente; V sobe pro meio */
    const c = Math.cos(25 * Math.PI / 180), s = Math.sin(25 * Math.PI / 180);
    const Fe = B.plano([xa - beiral, y0, zTras], [0, 0, 1], [c, s, 0]);
    const Fd = B.plano([xb + beiral, y0, zFrente], [0, 0, -1], [-c, s, 0]);
    const comp = zFrente - zTras;
    for (const [F, espelho] of [[Fe, false], [Fd, true]]) {
      if (!cortes) { B.ladrilhar(F, B.ret(0, comp, 0, lenAgua), 'telha'); continue; }
      /* atrás das torres a água é inteira; entre as torres, só o miolo */
      const aT = espelho ? comp - cortes.aT : cortes.aT;
      const b0 = (xc0 - xa + beiral) / c;
      if (!espelho) {
        B.ladrilhar(F, B.ret(0, aT, 0, lenAgua), 'telha');
        B.ladrilhar(F, B.ret(aT, comp, b0, lenAgua), 'telha');
      } else {
        B.ladrilhar(F, B.ret(0, aT, b0, lenAgua), 'telha');
        B.ladrilhar(F, B.ret(aT, comp, 0, lenAgua), 'telha');
      }
    }
  };
  aguas(hC, naveZ - 0.3, fz - 0.45, { aT: (fz - T) - (naveZ - 0.3) });
  aguas(hFc, fundoZ - 0.3, naveZ, null);
  B.viga([xm, cumN, naveZ - 0.3], [xm, cumN, fz - 0.45], 0.3, 0.16, 'telha');
  B.viga([xm, hFc + rise, fundoZ - 0.3], [xm, hFc + rise, naveZ], 0.3, 0.16, 'telha');
  /* a cruzinha na ponta da cumeeira da capela-mor */
  const yc = hFc + rise;
  B.caixa(xm - 0.05, xm + 0.05, yc, yc + 0.95, fundoZ - 0.2, fundoZ - 0.1, { todas: P });
  B.caixa(xm - 0.24, xm + 0.24, yc + 0.6, yc + 0.7, fundoZ - 0.2, fundoZ - 0.1, { todas: P });
}

/* =======================================================
   2. O PRÉDIO ALTO
   Embasamento de dois pisos com a quina chanfrada (o térreo recuado
   sob o balanço do 1º andar, que é a faixa vermelha), doze andares de
   caixilho preto com pilastra branca, empena com painel ocre, a ala
   mais baixa encostada e a casa de máquinas no alto.
   ======================================================= */
function predio(B, m) {
  const { fz, p0, p1, pz0, t0, t1, tz0, tz1 } = m;
  const hT = m.hTerreo, hP = m.hPodio, N = m.andares, PE = m.pe, ch = m.chanfro;
  const hTopo = hP + N * PE, hTorre = m.hTorre;
  const janela = (i, j) => 'jan' + ((i * 7 + j * 13 + ((i * j) % 5)) % 4);

  /* ---- o embasamento ---- */
  const rec = 0.35, r2 = rec * (Math.SQRT2 - 1);
  const piso1 = [[p0 + ch, fz], [p1, fz], [p1, pz0], [p0, pz0], [p0, fz - ch]];
  const piso0 = [[p0 + ch + r2, fz - rec], [p1, fz - rec], [p1, pz0], [p0 + rec, pz0], [p0 + rec, fz - ch - r2]];
  const terreo = [
    k => ['vitrine', 'vitrine', 'porta', 'vitrine', 'tapume', 'vitrine', 'vitrine'][k % 7],
    k => 'parede',
    k => k === 1 ? 'porta' : 'parede',
    k => k % 2 ? 'vitrine' : 'parede',
    k => 'porta'
  ];
  B.paredes(piso0, 0, (F, len, i) => {
    const n = Math.max(1, Math.round(len / 2.5));
    B.modulos(F, 0, len, 0, hT, n, 1, k => terreo[i](k));
  });
  B.paredes(piso1, hT, (F, len, i) => {
    const n = Math.max(1, Math.round(len / 1.8));
    B.modulos(F, 0, len, 0, hP - hT, n, 1, () => i === 1 ? 'vermelho_cego' : 'vermelho');
  });
  B.tampa(piso1, hT, 'concreto', true);                  // o forro do balanço
  B.tampa(piso1, hP, 'terraco');
  mureta(B, piso1, hP, 0.8, 0.2, 'concreto');

  /* ---- a torre ---- */
  const LT = t1 - t0, PT = tz1 - tz0;
  const frenteT = B.plano([t0, hP, tz1], [1, 0, 0], [0, 1, 0]);
  const trasT = B.plano([t1, hP, tz0], [-1, 0, 0], [0, 1, 0]);
  for (const [F, desl] of [[frenteT, 0], [trasT, 3]]) {
    for (let j = 0; j < N; j++) B.modulos(F, 0, LT, j * PE, (j + 1) * PE, 8, 1, i => janela(i + desl, j));
    B.modulos(F, 0, LT, N * PE, (N + 1) * PE, 8, 1, () => 'topo');
  }
  /* as empenas: painel ocre nas pontas, janelinha aos pares no meio */
  const colunas = (F, cols) => {
    let a = 0;
    for (const [k, w] of cols) {
      if (k === 'concreto') B.ladrilhar(F, B.ret(a, a + w, 0, (N + 1) * PE), 'concreto');
      else {
        for (let j = 0; j < N; j++) B.esticar(F, a, a + w, j * PE, (j + 1) * PE, k);
        B.esticar(F, a, a + w, N * PE, (N + 1) * PE, k === 'ocre' ? 'ocre' : 'topo');
      }
      a += w;
    }
  };
  colunas(B.plano([t0, hP, tz0], [0, 0, 1], [0, 1, 0]),
          [['concreto', PT - 7.8], ['ocre', 1.5], ['janelinhas', 2.4], ['janelinhas', 2.4], ['ocre', 1.5]]);
  colunas(B.plano([t1, hP, tz1], [0, 0, -1], [0, 1, 0]),
          [['ocre', 1.5], ['janelinhas', 2.4], ['janelinhas', 2.4], ['ocre', 1.5], ['concreto', PT - 7.8]]);
  /* pilastra branca entre os vãos e a laje de cada andar: o relevo que
     faz a fachada ler como concreto, não como papel de parede */
  for (let k = 0; k <= 8; k++) {
    const x = t0 + k * 1.8;
    B.caixa(x - 0.15, x + 0.15, hP, hTorre, tz1, tz1 + 0.15, { todas: 'concreto', base: null });
    B.caixa(x - 0.15, x + 0.15, hP, hTorre, tz0 - 0.15, tz0, { todas: 'concreto', base: null });
  }
  for (let j = 1; j <= N; j++) {
    const y = hP + j * PE;
    B.caixa(t0 - 0.02, t1 + 0.02, y - 0.07, y + 0.07, tz1, tz1 + 0.1, { todas: 'concreto' });
    B.caixa(t0 - 0.02, t1 + 0.02, y - 0.07, y + 0.07, tz0 - 0.1, tz0, { todas: 'concreto' });
  }
  const tetoT = [[t0, tz1], [t1, tz1], [t1, tz0], [t0, tz0]];
  B.tampa(tetoT, hTorre, 'cobertura');
  mureta(B, tetoT, hTorre, 0.9, 0.18, 'concreto');
  /* a casa de máquinas, com a veneziana, e a caixa d'água */
  B.caixa(t1 - 6.4, t1 - 0.8, hTorre, hTorre + 2.5, tz1 - 5.8, tz1 - 1.4, { todas: 'concreto', topo: 'cobertura', base: null });
  B.esticar(B.plano([t1 - 4.5, hTorre, tz1 - 1.4], [1, 0, 0], [0, 1, 0]), 0, 1.8, 0, 2.5, 'topo', { parte: [0, 1, 0.1, 0.95] });
  B.caixa(t0 + 2.0, t0 + 5.2, hTorre, hTorre + 2.0, tz0 + 2.2, tz0 + 5.2, { todas: 'concreto', topo: 'cobertura', base: null });

  /* ---- a ala mais baixa, encostada à esquerda ---- */
  const { w0, w1, wz0, wz1 } = m, NA = m.andaresAla, hAla = hP + (NA + 1) * PE;
  const ala = (F, cols) => {
    let a = 0;
    for (const [k, w] of cols) {
      for (let j = 0; j < NA; j++) B.esticar(F, a, a + w, j * PE, (j + 1) * PE, k === 'jan' ? janela(a | 0, j) : k);
      B.esticar(F, a, a + w, NA * PE, (NA + 1) * PE, k === 'ocre' ? 'ocre' : 'topo');
      a += w;
    }
  };
  ala(B.plano([w0, hP, wz1], [1, 0, 0], [0, 1, 0]), [['jan', 1.8], ['ocre', w1 - w0 - 1.8]]);
  ala(B.plano([w1, hP, wz0], [-1, 0, 0], [0, 1, 0]), [['ocre', w1 - w0 - 1.8], ['jan', 1.8]]);
  ala(B.plano([w0, hP, wz0], [0, 0, 1], [0, 1, 0]), [['janelinhas', 2.4], ['janelinhas', 2.4], ['ocre', wz1 - wz0 - 4.8]]);
  const tetoA = [[w0, wz1], [w1, wz1], [w1, wz0], [w0, wz0]];
  B.tampa(tetoA, hAla, 'cobertura');
  mureta(B, tetoA, hAla, 0.9, 0.18, 'concreto');
}

/* =======================================================
   3. O PRÉDIO DE TRÊS ANDARES COM O MERCADO
   Térreo de tijolinho com vitrine, porta de enrolar e o letreiro
   verde; em cima, reboco amarelo com as faixas marrons das janelas,
   ar-condicionado e toldo. Garagem com telhadinho de um lado, portão
   de grade e o corredor dos apartamentos do outro.
   ======================================================= */
function loja(B, m, G) {
  const { fz, g0, g1, gz0, m0, m1, mz0, c1, grade: gr } = m;
  const [h1, h2, h3, hTop] = m.alturas;
  const lw = m1 - m0, prof = fz - mz0;
  const fundoVao = 0.15;

  /* ---- a frente ---- */
  B.fachada(B.plano([m0, 0, fz], [1, 0, 0], [0, 1, 0]), lw, h1, 'tijolinho', [
    { a0: 0.35, a1: 3.65, b0: 0.02, b1: 2.72, k: 'vitrine', fundo: fundoVao },
    { a0: 3.95, a1: 6.95, b0: 0.02, b1: 2.72, k: 'enrolar', fundo: fundoVao },
    { a0: 7.25, a1: 10.55, b0: 0.02, b1: 2.72, k: 'vitrine', fundo: fundoVao }
  ]);
  B.ladrilhar(B.plano([m0, h1, fz], [1, 0, 0], [0, 1, 0]), B.ret(0, lw, 0, hTop - h1), 'reboco');
  B.caixa(m0 + 0.15, m1 - 0.15, 2.82, 3.72, fz, fz + 0.25,
          { frente: { k: 'letreiro', modo: 'esticar' }, todas: 'laje', tras: null });
  /* as faixas marrons, com a janela de persiana de cada andar */
  const faixas = [[1.25, ['faixa0', 'faixa1']], [6.95, ['faixa2', 'faixa0']]];
  const altFaixa = (h3 + 0.15 - (h1 + 0.05)) / 2;
  for (const [bx, qual] of faixas) {
    B.caixa(m0 + bx, m0 + bx + 2.6, h1 + 0.05, h3 + 0.15, fz, fz + 0.1, { frente: null, todas: 'reboco', base: null, tras: null });
    const F = B.plano([m0 + bx, h1 + 0.05, fz + 0.1], [1, 0, 0], [0, 1, 0]);
    B.esticar(F, 0, 2.6, 0, altFaixa, qual[0]);
    B.esticar(F, 0, 2.6, altFaixa, 2 * altFaixa, qual[1]);
  }
  const Ff = B.plano([m0, 0, fz + 0.1], [1, 0, 0], [0, 1, 0]);
  arSplit(B, Ff, 2.55, h1 + 0.35);
  arSplit(B, Ff, 2.55, h1 + 0.05 + altFaixa + 0.3);
  arSplit(B, Ff, 8.25, h1 + 0.35);
  const topoJanela = k => h1 + 0.05 + k * altFaixa + 2.42 * altFaixa / 2.9;
  toldo(B, Ff, 1.65, 3.45, topoJanela(0) + 0.2, 0.7, 0.42, 'toldo');
  toldo(B, Ff, 7.35, 9.15, topoJanela(1) + 0.2, 0.7, 0.42, 'toldo');

  /* ---- o lado da esquina (acima da garagem) e o outro ---- */
  const lado = (F, faixasLado, basc, com) => {
    B.fachada(F, prof, h1, 'reboco', basc.map(a => ({ a0: a - 0.45, a1: a + 0.45, b0: 2.95, b1: 3.45, k: 'basculante', fundo: 0.08 })));
    const Fc = B.plano(B.noPlano(F, 0, h1), F.U, F.V);
    B.ladrilhar(Fc, B.ret(0, prof, 0, hTop - h1), 'reboco');
    for (const a of faixasLado) {
      const Fb = B.plano(soma(B.noPlano(F, a, h1 + 0.05), esc(F.N, 0.08)), F.U, F.V);
      B.esticar(Fb, 0, 1.2, 0, altFaixa, 'faixa_lat');
      B.esticar(Fb, 0, 1.2, altFaixa, 2 * altFaixa, 'faixa_lat');
      /* as paredinhas da faixa saltada */
      B.esticar(B.plano(B.noPlano(F, a, h1 + 0.05), F.N, F.V), 0, 0.08, 0, 2 * altFaixa, 'reboco', { escuro: 0.9 });
      B.esticar(B.plano(soma(B.noPlano(F, a + 1.2, h1 + 0.05), esc(F.N, 0.08)), esc(F.N, -1), F.V), 0, 0.08, 0, 2 * altFaixa, 'reboco', { escuro: 0.9 });
    }
    for (const [a, andar, tipo] of com) {
      const Fb = B.plano(soma(B.noPlano(F, 0, 0), esc(F.N, 0.08)), F.U, F.V);
      if (tipo === 'ar') arSplit(B, Fb, a + 0.6, h1 + 0.05 + andar * altFaixa + 0.3);
      else toldo(B, Fb, a + 0.1, a + 1.1, topoJanela(andar) + 0.18, 0.55, 0.38, 'toldo');
    }
  };
  lado(B.plano([m0, 0, mz0], [0, 0, 1], [0, 1, 0]), [1.2, 3.8, 6.4, 9.0], [1.5, 3.5],
       [[3.8, 0, 'ar'], [1.2, 1, 'toldo'], [6.4, 0, 'toldo'], [9.0, 1, 'ar']]);
  lado(B.plano([m1, 0, fz], [0, 0, -1], [0, 1, 0]), [1.5, 5.1, 8.7], [3.0, 7.0],
       [[5.1, 1, 'ar'], [1.5, 0, 'toldo']]);
  /* ---- os fundos ---- */
  const Ft = B.plano([m1, 0, mz0], [-1, 0, 0], [0, 1, 0]);
  B.fachada(Ft, lw, h1, 'reboco', [2.5, 5.4, 8.3].map(a => ({ a0: a - 0.45, a1: a + 0.45, b0: 2.2, b1: 2.7, k: 'basculante', fundo: 0.08 })));
  B.ladrilhar(B.plano([m1, h1, mz0], [-1, 0, 0], [0, 1, 0]), B.ret(0, lw, 0, hTop - h1), 'reboco');
  for (const [bx, qual] of [[1.25, ['faixa1', 'faixa0']], [6.95, ['faixa0', 'faixa1']]]) {
    const F = B.plano(soma(B.noPlano(Ft, bx, h1 + 0.05), esc(Ft.N, 0.08)), Ft.U, Ft.V);
    B.esticar(F, 0, 2.6, 0, altFaixa, qual[0]);
    B.esticar(F, 0, 2.6, altFaixa, 2 * altFaixa, qual[1]);
  }
  B.tampa([[m0, fz], [m1, fz], [m1, mz0], [m0, mz0]], hTop, 'laje');
  B.caixa(m0 + 6.5, m0 + 8.1, hTop, hTop + 1.25, fz - 7.0, fz - 5.4, { todas: 'reboco', topo: 'laje', base: null });

  /* ---- a garagem da esquina, com o telhadinho ---- */
  B.fachada(B.plano([g0, 0, fz], [1, 0, 0], [0, 1, 0]), g1 - g0, 2.8, 'reboco',
            [{ a0: 0.3, a1: 3.3, b0: 0, b1: 2.5, k: 'garagem', fundo: 0.1 }]);
  B.fachada(B.plano([g0, 0, gz0], [0, 0, 1], [0, 1, 0]), fz - gz0, 2.8, 'reboco',
            [{ a0: 3.9, a1: 4.5, b0: 1.3, b1: 1.75, k: 'vende' }]);
  B.ladrilhar(B.plano([g1, 0, gz0], [-1, 0, 0], [0, 1, 0]), B.ret(0, g1 - g0, 0, 2.8), 'reboco');
  B.tampa([[g0, fz], [g1, fz], [g1, gz0], [g0, gz0]], 2.8, 'laje');
  const inc = unit([0, 0.3, -0.62]);
  B.ladrilhar(B.plano([g0 + 0.2, 2.45, fz + 0.62], [1, 0, 0], inc), B.ret(0, g1 - g0 - 0.4, 0, Math.hypot(0.3, 0.62)), 'telha');
  B.caixa(g0 + 0.2, g1 - 0.2, 2.36, 2.46, fz + 0.6, fz + 0.66, { todas: 'laje' });

  /* ---- o corredor dos apartamentos: portão de grade e o muro ---- */
  G.ladrilhar(G.plano([m1 + 0.1, 0, fz], [1, 0, 0], [0, 1, 0]), G.ret(0, c1 - 0.2 - (m1 + 0.1), 0, 2.2), 'preta');
  B.caixa(c1 - 0.2, c1, 0, 2.2, fz - 4.0, fz, { todas: 'reboco', base: null });
  B.esticar(B.plano([(m1 + c1) / 2 - 0.4, 1.15, fz + 0.03], [1, 0, 0], [0, 1, 0]), 0, 0.8, 0, 0.55, 'aluga');
  /* a grade da frente do mercado, dos dois lados da porta de enrolar */
  const gz = fz + gr;
  G.ladrilhar(G.plano([m0 + 0.15, 0, gz], [1, 0, 0], [0, 1, 0]), G.ret(0, 3.6, 0, 2.2), 'preta');
  G.ladrilhar(G.plano([m1 - 3.45, 0, gz], [1, 0, 0], [0, 1, 0]), G.ret(0, 3.3, 0, 2.2), 'preta');
  G.ladrilhar(G.plano([m0 + 0.15, 0, fz], [0, 0, 1], [0, 1, 0]), G.ret(0, gr, 0, 2.2), 'preta');
  G.ladrilhar(G.plano([m1 - 0.15, 0, gz], [0, 0, -1], [0, 1, 0]), G.ret(0, gr, 0, 2.2), 'preta');
  B.esticar(B.plano([m0 + 1.0, 0.9, gz + 0.03], [1, 0, 0], [0, 1, 0]), 0, 0.6, 0, 0.85, 'oferta');
}

/* =======================================================
   4. O CENTRO ADMINISTRATIVO
   Dois andares de tijolo aparente e janela em fita de vidro azul
   sobre pilotis: o térreo de vidro fica recuado atrás da colunata. A
   faixa verde-azulada na laje do 1º andar, toldo azul nas janelas de
   cima e a ala mais baixa ao lado.
   ======================================================= */
function adm(B, m) {
  const { fz, vao, recuo, m0, m1, mz0, a0, a1, az0, az1 } = m;
  const [h1, h2, h3, h4] = m.alturas, [ha1, ha2, ha3] = m.alturasAla;
  const nF = Math.round((m1 - m0) / vao), nL = Math.round((fz - mz0) / vao);
  const andares = (F, n, alturas, base) => {
    const [y1, y2, y3] = alturas;
    B.modulos(F, 0, n * vao, 0, y2 - y1, n, 1, () => 'modulo');
    if (y3 > y2 + 1) {
      B.modulos(F, 0, n * vao, y2 - y1, y3 - y1, n, 1, () => 'modulo');
      B.modulos(F, 0, n * vao, y3 - y1, h4 - y1, n, 1, () => 'platibanda');
    } else B.modulos(F, 0, n * vao, y2 - y1, y3 - y1, n, 1, () => 'platibanda');
  };
  andares(B.plano([m0, h1, fz], [1, 0, 0], [0, 1, 0]), nF, [h1, h2, h3]);
  andares(B.plano([m1, h1, mz0], [-1, 0, 0], [0, 1, 0]), nF, [h1, h2, h3]);
  andares(B.plano([m1, h1, fz], [0, 0, -1], [0, 1, 0]), nL, [h1, h2, h3]);
  andares(B.plano([m0, h1, mz0], [0, 0, 1], [0, 1, 0]), nL, [h1, h2, h3]);
  B.tampa([[m0, fz], [m1, fz], [m1, fz - recuo], [m0, fz - recuo]], h1, 'concreto', true);
  B.tampa([[m0, fz], [m1, fz], [m1, mz0], [m0, mz0]], h4, 'laje');
  /* o térreo recuado, de vidro na frente e tijolo em volta */
  const zg = fz - recuo, nGl = Math.round((zg - mz0) / 2.45);
  B.modulos(B.plano([m0, 0, zg], [1, 0, 0], [0, 1, 0]), 0, m1 - m0, 0, h1, nF, 1, i => i === (nF >> 1) ? 'terreo_porta' : 'terreo_vidro');
  B.modulos(B.plano([m1, 0, zg], [0, 0, -1], [0, 1, 0]), 0, zg - mz0, 0, h1, nGl, 1, () => 'terreo_tijolo');
  B.modulos(B.plano([m1, 0, mz0], [-1, 0, 0], [0, 1, 0]), 0, m1 - m0, 0, h1, nF, 1, i => i === 2 ? 'terreo_porta' : 'terreo_tijolo');
  /* a faixa da laje do 1º andar, os pilotis e os toldos */
  B.caixa(m0 - 0.06, m1 + 0.06, h1 - 0.1, h1 + 0.4, fz, fz + 0.12, { todas: 'faixa', base: 'concreto' });
  B.caixa(m1, m1 + 0.12, h1 - 0.1, h1 + 0.4, mz0, fz, { todas: 'faixa', base: 'concreto' });
  B.caixa(m0 - 0.12, m0, h1 - 0.1, h1 + 0.4, mz0, fz, { todas: 'faixa', base: 'concreto' });
  B.caixa(m0 - 0.06, m1 + 0.06, h1 - 0.1, h1 + 0.4, mz0 - 0.12, mz0, { todas: 'faixa', base: 'concreto' });
  for (let k = 0; k <= nF; k++) {
    const x = m0 + k * vao;
    B.caixa(x - 0.18, x + 0.18, 0, h3, fz - 0.18, fz + 0.18, { todas: 'concreto', base: null });
  }
  const Ff = B.plano([m0, 0, fz], [1, 0, 0], [0, 1, 0]);
  for (let k = 0; k < nF; k++) toldo(B, Ff, k * vao + 0.2, (k + 1) * vao - 0.2, h2 + 2.58, 0.9, 0.45, 'toldo');
  /* a caixa da escada no telhado */
  B.caixa(m1 - 5.5, m1 - 2.5, h4, h4 + 2.0, fz - 6.2, fz - 3.6, { todas: 'tijolo', topo: 'laje', base: null });

  /* ---- a ala ---- */
  const alaAndares = (F, n) => {
    B.modulos(F, 0, n * vao, 0, ha1, n, 1, () => 'terreo_tijolo');
    B.modulos(F, 0, n * vao, ha1, ha2, n, 1, () => 'modulo');
    B.modulos(F, 0, n * vao, ha2, ha3, n, 1, () => 'platibanda');
  };
  const nA = Math.round((a1 - a0) / vao), nAl = Math.round((az1 - az0) / 2.45);
  alaAndares(B.plano([a0, 0, az1], [1, 0, 0], [0, 1, 0]), nA);
  alaAndares(B.plano([a1, 0, az0], [-1, 0, 0], [0, 1, 0]), nA);
  const Fl = B.plano([a0, 0, az0], [0, 0, 1], [0, 1, 0]), wl = az1 - az0;
  B.modulos(Fl, 0, wl, 0, ha1, nAl, 1, () => 'terreo_tijolo');
  B.modulos(Fl, 0, wl, ha1, ha2, nAl, 1, () => 'modulo');
  B.modulos(Fl, 0, wl, ha2, ha3, nAl, 1, () => 'platibanda');
  B.tampa([[a0, az1], [a1, az1], [a1, az0], [a0, az0]], ha3, 'laje');
}

/* =======================================================
   5. A CASA DE CLASSE MÉDIA
   O sobrado cinza com o portão da garagem, a laje branca e a faixa
   escura em cada andar, a janela de grade no quadro saltado; do lado,
   a edícula verde com o alpendre atrás do portão de grade. Telhado de
   quatro águas de telha laranja nas duas.
   ======================================================= */
function casa(B, m, G) {
  const { fz, a0, a1, s0, s1, z0 } = m;
  const sw = s1 - s0, prof = fz - z0;
  const h1 = 2.85, h1b = 3.15, h2 = 5.75, h2b = 6.05, ha = 2.95;
  const cz = 'cinza', vd = 'verde';
  const faixa = (larg, b0, b1) => ({ a0: 0, a1: larg, b0, b1, k: 'escura', modo: 'ladrilho' });
  const vao = (a, w, b0, b1, k, fundo) => ({ a0: a - w / 2, a1: a + w / 2, b0, b1, k, fundo: fundo === undefined ? 0.08 : fundo });

  /* ---- o sobrado: térreo ---- */
  B.fachada(B.plano([s0, 0, fz], [1, 0, 0], [0, 1, 0]), sw, h1, cz,
            [{ a0: 0.4, a1: sw - 0.4, b0: 0, b1: 2.55, k: 'portao', fundo: 0.2 }, faixa(sw, 2.55, h1)]);
  B.fachada(B.plano([s1, 0, fz], [0, 0, -1], [0, 1, 0]), prof, h1, cz,
            [vao(5.9, 0.6, 1.2, 2.1, 'basculante'), vao(9.45, 0.9, 0, 2.1, 'porta'), faixa(prof, 2.55, h1)]);
  B.fachada(B.plano([s0, 0, fz - 5], [0, 0, 1], [0, 1, 0]), 5, h1, cz, [vao(2.65, 0.9, 0, 2.1, 'porta'), faixa(5, 2.55, h1)]);
  B.fachada(B.plano([s1, 0, z0], [-1, 0, 0], [0, 1, 0]), sw, h1, cz, [vao(1.5, 0.6, 1.2, 2.1, 'basculante'), faixa(sw, 2.55, h1)]);
  B.caixa(s0 - 0.1, s1 + 0.1, h1, h1b, z0 - 0.1, fz + 0.45, { todas: 'branca' });
  /* ---- o andar de cima ---- */
  const hA = h2 - h1b, c = sw / 2;
  B.fachada(B.plano([s0, h1b, fz], [1, 0, 0], [0, 1, 0]), sw, hA, cz,
            [vao(c, 1.4, 0.85, 1.95, 'janela_grade', 0.12), faixa(sw, 2.3, hA)]);
  /* o quadro saltado em volta da janela */
  const qy0 = h1b + 0.6, qy1 = h1b + 2.2, qx0 = s0 + c - 0.95, qx1 = s0 + c + 0.95;
  B.caixa(qx0, qx1, qy1 - 0.17, qy1, fz, fz + 0.2, { todas: 'branca', tras: null });
  B.caixa(qx0, qx1, qy0, qy0 + 0.17, fz, fz + 0.2, { todas: 'branca', tras: null });
  B.caixa(qx0, qx0 + 0.17, qy0 + 0.17, qy1 - 0.17, fz, fz + 0.2, { todas: 'branca', tras: null });
  B.caixa(qx1 - 0.17, qx1, qy0 + 0.17, qy1 - 0.17, fz, fz + 0.2, { todas: 'branca', tras: null });
  B.fachada(B.plano([s1, h1b, fz], [0, 0, -1], [0, 1, 0]), prof, hA, cz,
            [vao(3.0, 0.6, 0.9, 1.5, 'janelinha'), vao(8.4, 0.6, 0.7, 1.6, 'basculante'), faixa(prof, 2.3, hA)]);
  B.fachada(B.plano([s0, h1b, z0], [0, 0, 1], [0, 1, 0]), prof, hA, cz,
            [vao(3.9, 0.6, 0.9, 1.8, 'basculante'), vao(9.9, 0.6, 1.0, 1.6, 'janelinha'), faixa(prof, 2.3, hA)]);
  B.fachada(B.plano([s1, h1b, z0], [-1, 0, 0], [0, 1, 0]), sw, hA, cz, [vao(2.5, 0.6, 0.8, 1.7, 'basculante'), faixa(sw, 2.3, hA)]);
  B.caixa(s0 - 0.15, s1 + 0.15, h2, h2b, z0 - 0.15, fz + 0.45, { todas: 'branca' });
  B.telhado4(s0 - 0.3, s1 + 0.3, z0 - 0.3, fz + 0.3, h2b, 1.75, 'telha', 'cumeeira');

  /* ---- a edícula ---- */
  B.fachada(B.plano([a0, 0, z0], [0, 0, 1], [0, 1, 0]), prof, ha, vd,
            [vao(3.3, 0.6, 1.5, 2.1, 'janelinha'), vao(6.7, 0.6, 1.1, 2.0, 'basculante')]);
  B.fachada(B.plano([a1, 0, z0], [-1, 0, 0], [0, 1, 0]), a1 - a0, ha, vd, [vao(2.5, 0.6, 1.1, 2.0, 'basculante')]);
  /* o alpendre: a parede do fundo dele, o muro de lado, piso e forro */
  const za = fz - 5;
  B.fachada(B.plano([a0 + 0.15, 0, za], [1, 0, 0], [0, 1, 0]), a1 - a0 - 0.15, ha, vd,
            [vao(1.05, 0.9, 0, 2.1, 'porta'), vao(2.9, 0.6, 1.3, 1.9, 'janelinha')]);
  B.caixa(a0, a0 + 0.15, 0, ha, za, fz, { esq: null, todas: vd, base: null });
  const alp = [[a0 + 0.15, fz], [a1, fz], [a1, za], [a0 + 0.15, za]];
  B.tampa(alp, 0.03, 'piso');
  B.tampa(alp, ha - 0.02, 'branca', true);
  B.caixa(a0, a1, 2.5, ha, fz - 0.15, fz, { todas: 'escura', base: 'branca', tras: null });
  G.ladrilhar(G.plano([a0 + 0.15, 0, fz - 0.07], [1, 0, 0], [0, 1, 0]), G.ret(0, a1 - a0 - 0.15, 0, 2.5), 'branca');
  B.telhado4(a0 - 0.3, a1 + 0.3, z0 - 0.3, za + 0.2, ha, 1.4, 'telha', 'cumeeira');
  B.telhado4(a0 - 0.3, a1 + 0.3, za - 0.2, fz + 0.3, ha, 1.2, 'telha', 'cumeeira');
}


/* =======================================================
   6. O ATACAREJO — o ATACADEX
   O galpão de atacado no mato a oeste da cidade, de frente pra
   avenida: a marquise comprida sobre as colunas brancas de pé
   amarelo e preto, a testeira azul com o filete verde e amarelo, a
   marca (o selo vermelho-laranja e o emblema do carrinho saindo por
   cima da testeira) e o ATACADISTA; embaixo, a vitrine de vidro com a
   porta automática, o painel bordô e os cartazes. O galpão é chapa
   branca com a faixa azul em cima e embaixo; na parede oeste, o painel
   amarelo da quina e as cinco docas com o fole preto, uma com a
   carreta encostada. O telhado de chapa tem fileiras de claraboia. Na
   frente, o estacionamento pintado, a faixa de pedestre, a guia e o
   totem na esquina. Os carros e os postes são da cidade (a planta os
   põe nas vagas).
   ======================================================= */
function atacadex(B, m) {
  const { E0, E1, zP, zF, hM0, hM1, hP, W, D } = m;
  const L = E1 - E0;
  const yA = 0.03, yC = 0.15;                  // o asfalto e a calçada, acima do chão pintado
  const hTeto = hP - 0.9;                      // a laje do telhado, escondida pela platibanda
  const tampaRet = (x0, x1, z0, z1, y, k, o) => B.tampa([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y, k, false, o);

  /* ---- o chão: o estacionamento em tiras (a borda da avenida é torta),
     o pátio dos caminhões, a calçada da marquise, a de leste e a do fundo ---- */
  const N = m.norte;
  for (let i = 1; i < N.length; i++) {
    const [xa, za] = N[i - 1], [xb, zb] = N[i];
    B.tampa([[xa, 0], [xb, 0], [xb, zb], [xa, za]], yA, 'asfalto');
  }
  tampaRet(E1 + 0.4, W, -D, 0, yA, 'asfalto');
  tampaRet(E0 - 0.4, E1 + 0.4, zP, 0, yC, 'piso');
  tampaRet(0, E0 - 0.4, -D, 0, yC, 'piso');
  tampaRet(E0 - 0.4, E1 + 0.4, -D, zF, yC, 'piso');
  /* a guia da calçada da marquise, de frente pro estacionamento */
  B.ladrilhar(B.plano([0, yA, 0], [1, 0, 0], [0, 1, 0]), B.ret(0, E1 + 0.4, 0, yC - yA), 'piso', { escuro: 0.85 });

  /* ---- as vagas, a faixa de pedestre e a guia da avenida ---- */
  const xsLinha = new Set();
  for (const v of m.vagas) {
    for (const x of [v.x0, v.x1]) {
      const k = x.toFixed(2) + '/' + v.z0;
      if (xsLinha.has(k)) continue;
      xsLinha.add(k);
      tampaRet(x - 0.05, x + 0.05, v.z0, v.z1, yA + 0.01, 'linha');
    }
  }
  const fx = m.faixa;
  for (let z = fx.z0 + 0.5; z + 0.5 <= fx.z1; z += 1.0) tampaRet(fx.x0, fx.x1, z, z + 0.5, yA + 0.01, 'linha');
  const entrada = x => (x > 10 && x < 16) || (x > 42 && x < 52);
  for (let i = 1; i < N.length; i++) {
    const [xa, za] = N[i - 1], [xb, zb] = N[i];
    if (entrada((xa + xb) / 2)) continue;
    const L2 = Math.hypot(xb - xa, zb - za), ux = (xb - xa) / L2, uz = (zb - za) / L2;
    /* a face de pé olhando pra avenida e o topo */
    B.ladrilhar(B.plano([xa, 0, za], [ux, 0, uz], [0, 1, 0]), B.ret(0, L2, 0, 0.18), 'piso');
    B.tampa([[xa, za], [xb, zb], [xb, zb - 0.22], [xa, za - 0.22]], 0.18, 'piso');
  }

  /* ---- a fachada de vidro, sob a marquise: nove vãos de 4 m ---- */
  const nB = 9, wB = L / nB;
  const qual = ['vidro', 'vidro', 'cartaz', 'vidro', 'porta', 'bordo', 'bordo', 'cartaz', 'bordo'];
  const vaosFrente = [];
  for (let i = 0; i < nB; i++) vaosFrente.push({ a0: i * wB, a1: (i + 1) * wB, b0: yC, b1: 4.3, k: qual[i] });
  vaosFrente.push({ a0: 0, a1: L, b0: 6.3, b1: 6.5, k: 'verde', modo: 'ladrilho' },
                  { a0: 0, a1: L, b0: 6.5, b1: hP, k: 'azul', modo: 'ladrilho' });
  B.fachada(B.plano([E0, 0, zP], [1, 0, 0], [0, 1, 0]), L, hP, 'branco', vaosFrente);

  /* ---- as faixas do galpão, iguais nas outras três paredes ---- */
  const bandas = (comp, extra = []) => [
    { a0: 0, a1: comp, b0: 0, b1: 0.9, k: 'azul', modo: 'ladrilho' },
    { a0: 0, a1: comp, b0: 6.3, b1: 6.5, k: 'verde', modo: 'ladrilho' },
    { a0: 0, a1: comp, b0: 6.5, b1: hP, k: 'azul', modo: 'ladrilho' }
  ].flatMap(b => {
    /* a faixa pula o que já ocupa a parede nessa altura */
    let pedacos = [[b.a0, b.a1]];
    for (const e of extra) {
      if (e.b1 <= b.b0 || e.b0 >= b.b1) continue;
      pedacos = pedacos.flatMap(([p0, p1]) => (e.a1 <= p0 || e.a0 >= p1) ? [[p0, p1]]
        : [[p0, e.a0], [e.a1, p1]].filter(([q0, q1]) => q1 - q0 > 0.01));
    }
    return pedacos.map(([p0, p1]) => Object.assign({}, b, { a0: p0, a1: p1 }));
  }).concat(extra);
  const Dz = zP - zF;
  /* a parede leste (a da cidade): as pilastras azuis, a marca pequena e a porta de serviço */
  const leste = [{ a0: 8.0, a1: 9.0, b0: yC, b1: 2.35, k: 'porta_servico', fundo: 0.08 }];
  B.fachada(B.plano([E0, 0, zF], [0, 0, 1], [0, 1, 0]), Dz, hP, 'branco', bandas(Dz, leste));
  /* a marca pequena na faixa azul de cima, perto da quina da frente —
     um plano 3 cm pra fora, com a faixa inteira atrás */
  B.esticar(B.plano([E0 - 0.03, 0, zF], [0, 0, 1], [0, 1, 0]), Dz - 7.4, Dz - 1.4, 6.9, 8.4, 'marca');
  for (let a = 2.0; a < Dz - 0.5; a += 4.0) {
    if (a > 7.4 && a < 9.6) continue;
    B.caixa(E0 - 0.06, E0, 0.9, 6.3, zF + a - 0.3, zF + a + 0.3, { esq: 'azul', frente: 'azul', tras: 'azul', dir: null, topo: null, base: null });
  }
  /* a parede oeste: o painel amarelo na quina e as docas */
  const oeste = [{ a0: zP - m.painel.z1, a1: zP - m.painel.z0, b0: 0.9, b1: 6.3, k: 'painel' }];
  for (const dz of m.docas) oeste.push({ a0: zP - dz - 1.8, a1: zP - dz + 1.8, b0: 0, b1: 4.3, k: 'doca' });
  B.fachada(B.plano([E1, 0, zP], [0, 0, -1], [0, 1, 0]), Dz, hP, 'branco', bandas(Dz, oeste));
  /* o fundo */
  B.fachada(B.plano([E1, 0, zF], [-1, 0, 0], [0, 1, 0]), L, hP, 'branco', bandas(L));

  /* ---- a platibanda por dentro, o telhado de chapa e a claraboia ---- */
  const e = 0.25;
  B.caixa(E0, E1, hTeto, hP, zF, zF + e, { frente: 'branco', topo: 'piso', tras: null, dir: null, esq: null, base: null });
  B.caixa(E0, E1, hTeto, hP, zP - e, zP, { tras: 'branco', topo: 'piso', frente: null, dir: null, esq: null, base: null });
  B.caixa(E0, E0 + e, hTeto, hP, zF + e, zP - e, { dir: 'branco', topo: 'piso', frente: null, tras: null, esq: null, base: null });
  B.caixa(E1 - e, E1, hTeto, hP, zF + e, zP - e, { esq: 'branco', topo: 'piso', frente: null, tras: null, dir: null, base: null });
  tampaRet(E0 + e, E1 - e, zF + e, zP - e, hTeto, 'telhado');
  for (let x = E0 + 3.0; x < E1 - 2.0; x += 4.0)
    tampaRet(x, x + 1.0, zF + 2.0, zP - 2.0, hTeto + 0.06, 'claraboia');

  /* ---- a marquise: a testeira azul com o filete, o forro e as colunas ---- */
  const mx0 = E0 - 0.4, mx1 = E1 + 0.4, mL = mx1 - mx0;
  const Ft = B.plano([mx0, 0, 0], [1, 0, 0], [0, 1, 0]);
  B.ladrilhar(Ft, B.ret(0, mL, hM0, hM0 + 0.16), 'verde');
  B.ladrilhar(Ft, B.ret(0, mL, hM0 + 0.16, hM1), 'azul');
  B.caixa(mx0, mx1, hM0, hM1, zP, 0, { frente: null, tras: null, dir: 'azul', esq: 'azul', topo: 'telhado', base: 'forro' });
  for (const x of m.colunas)
    B.caixa(x - 0.2, x + 0.2, yC, hM0, m.zCol - 0.2, m.zCol + 0.2, { todas: { k: 'coluna', modo: 'esticar' }, topo: null, base: null });

  /* ---- a marca: o selo na testeira, o emblema por cima, o ATACADISTA ---- */
  const xm = E0 + 15.0;
  const selo = [];
  const rS = 0.42, S0 = xm - 3.0, S1 = xm + 3.0, SB = hM0 - 0.08, ST = hM1 + 0.1;
  for (const [cx, cy, a0] of [[S1 - rS, SB + rS, -Math.PI / 2], [S1 - rS, ST - rS, 0], [S0 + rS, ST - rS, Math.PI / 2], [S0 + rS, SB + rS, Math.PI]])
    for (let k = 0; k <= 4; k++) { const a = a0 + (Math.PI / 2) * k / 4; selo.push([cx + rS * Math.cos(a), cy + rS * Math.sin(a)]); }
  const Fs = B.plano([0, 0, 0.05], [1, 0, 0], [0, 1, 0]);
  B.ladrilhar(Fs, selo, 'marca', { tw: S1 - S0, th: ST - SB, oa: S0, ob: SB });
  const rE = 1.05, cxE = xm - 1.6, cyE = ST + 0.55, disco = [];
  for (let k = 0; k < 28; k++) { const a = 2 * Math.PI * k / 28; disco.push([cxE + rE * Math.cos(a), cyE + rE * Math.sin(a)]); }
  B.ladrilhar(B.plano([0, 0, 0.09], [1, 0, 0], [0, 1, 0]), disco, 'emblema', { tw: 2 * rE / 0.98, th: 2 * rE / 0.98, oa: cxE - rE / 0.98, ob: cyE - rE / 0.98 });
  /* o emblema tem costas: de trás da testeira ele também aparece */
  B.ladrilhar(B.plano([0, 0, -0.02], [-1, 0, 0], [0, 1, 0]), disco.map(([a, b]) => [-a, b]).reverse(), 'azul');
  B.esticar(B.plano([0, 0, 0.05], [1, 0, 0], [0, 1, 0]), xm + 3.5, xm + 8.5, hM0 + 0.35, hM0 + 1.15, 'atacadista');

  /* ---- as docas: o fole preto e a plataforma ---- */
  for (const dz of m.docas) {
    B.pintar('#1b1c1d');
    B.caixa(E1, E1 + 0.6, 1.1, 4.3, dz - 1.8, dz - 1.4, { todas: 'linha', base: null });
    B.caixa(E1, E1 + 0.6, 1.1, 4.3, dz + 1.4, dz + 1.8, { todas: 'linha', base: null });
    B.caixa(E1, E1 + 0.6, 3.9, 4.3, dz - 1.4, dz + 1.4, { todas: 'linha', base: null });
    B.pintar(null);
    B.caixa(E1, E1 + 0.45, 0, 1.1, dz - 1.4, dz + 1.4, { todas: 'piso', base: null });
  }

  /* ---- a carreta na doca, e o cavalo ---- */
  const zc = m.docas[m.docaCaminhao];
  const cx0 = E1 + 0.6, cx1 = E1 + 13.0;           // a mesma conta da massa, na planta
  B.caixa(cx0, cx1, 1.15, 4.1, zc - 1.25, zc + 1.25, { frente: { k: 'carreta', modo: 'esticar' }, tras: { k: 'carreta', modo: 'esticar' },
          esq: { k: 'carreta_porta', modo: 'esticar' }, dir: 'branco', topo: 'branco', base: null });
  B.pintar('#2a2b2c');
  B.caixa(cx0 + 0.3, cx1 - 0.3, 0.95, 1.15, zc - 1.0, zc + 1.0, { todas: 'linha', topo: null });
  for (const x of [cx0 + 1.2, cx0 + 2.5, cx0 + 3.8, cx1 + 0.7, cx1 + 1.6])
    for (const s of [-1, 1]) B.caixa(x - 0.5, x + 0.5, 0, 1.0, zc + s * 1.2 - 0.18, zc + s * 1.2 + 0.18, { todas: 'linha' });
  B.caixa(cx1 - 2.4, cx1 - 2.2, 0, 1.15, zc - 0.9, zc + 0.9, { todas: 'linha' });           // o pé de apoio
  B.pintar(null);
  const kx0 = cx1 + 0.05, kx1 = cx1 + 2.25;
  B.caixa(kx0, kx1, 0.5, 3.2, zc - 1.2, zc + 1.2, { dir: { k: 'cavalo', modo: 'esticar' },
          frente: { k: 'cavalo_lado', modo: 'esticar', espelho: true }, tras: { k: 'cavalo_lado', modo: 'esticar' },
          topo: { k: 'linha', tinta: '#a8221b' }, esq: { k: 'linha', tinta: '#2a2b2c' }, base: null });

  /* ---- o totem da esquina ---- */
  const t = m.totem;
  B.caixa(t.x - t.larg / 2, t.x + t.larg / 2, 0, t.alt, t.z - t.esp / 2, t.z + t.esp / 2,
          { frente: { k: 'totem', modo: 'esticar' }, tras: { k: 'totem', modo: 'esticar' }, dir: 'azul', esq: 'azul', topo: 'azul', base: null });
}

/* =======================================================
   7. OS DOIS PRÉDIOS DO BALDIO — o condomínio de duas torres
   O Edifício Mirante (concreto cinza, o rasgo e a quina de vidro
   azul, a coroa da casa de máquinas e a caixa da portaria) e o
   Residencial Bela Vista (quadro branco, tijolinho laranja, as
   sacadas de vidro com a borda branca da laje, a aleta que passa do
   telhado e o pórtico com o nome). Cada um no seu meio terreno, com o
   muro do condomínio: frente, fundo e o lado que dá pra rua.
   ======================================================= */
/* o muro do condomínio: a frente com a guarita, o portãozinho e o
   portão da garagem de grade preta; o fundo; e o lado da rua */
function muroCondominio(B, G, m, kBranco) {
  const { W, D, muro: h } = m, e = 0.25, r = m.recMuro || 0;
  const esq = m.ladoRua === 'esq', dir = m.ladoRua === 'dir';
  const lisa = { todas: 'muro', topo: { k: 'muro', modo: 'esticar', parte: [0, 1, 0.95, 1] }, base: null };
  const g = m.guarita;
  /* a frente, recuada `r` da divisa (a pixação e a placa saem à frente
     dele sem pendurar na calçada), com os três furos */
  const furos = [[g.x0, g.x1], [m.pedestre.a0, m.pedestre.a1], [m.portao.a0, m.portao.a1]].sort((a, b) => a[0] - b[0]);
  let a = esq ? r : 0;
  const fim = dir ? W - r : W;
  for (const [f0, f1] of furos) {
    if (f0 - a > 0.02) B.caixa(a, f0, 0, h, -r - e, -r, lisa);
    a = f1;
  }
  if (fim - a > 0.02) B.caixa(a, fim, 0, h, -r - e, -r, lisa);
  for (const [f0, f1] of [[m.pedestre.a0, m.pedestre.a1], [m.portao.a0, m.portao.a1]]) {
    G.ladrilhar(G.plano([f0, 0, -r - e / 2], [1, 0, 0], [0, 1, 0]), G.ret(0, f1 - f0, 0, 2.2), 'preta');
    for (const x of [f0, f1]) {
      B.caixa(x - 0.16, x + 0.16, 0, h, -r - 0.4, -r, { todas: 'muro', base: null, topo: null });
      B.caixa(x - 0.2, x + 0.2, h, h + 0.12, -r - 0.44, -r, { todas: kBranco });
    }
  }
  /* a guarita encaixada no muro, com o vidro fumê pra rua */
  B.caixa(g.x0, g.x1, 0, g.alt, g.z0, g.z1, { todas: kBranco, frente: null, base: null });
  B.esticar(B.plano([0, 0, g.z1 + 0.01], [1, 0, 0], [0, 1, 0]), g.x0, g.x1, 0, g.alt, 'guarita');
  B.caixa(g.x0 - 0.25, g.x1 + 0.25, g.alt, g.alt + 0.18, g.z0 - 0.2, g.z1, { todas: kBranco, topo: 'cobertura' });
  if (esq) B.caixa(r, r + e, 0, h, -D, -r - e, lisa);
  if (dir) B.caixa(W - r - e, W - r, 0, h, -D, -r - e, lisa);
  B.caixa(esq ? r + e : 0, dir ? W - r - e : W, 0, h, -D, -D + e, lisa);
}

/* uma fileira de faixas verticais numa face: cada faixa é [peça,
   largura]; peça de ANDAR (módulo) é empilhada uma por andar, peça de
   PAREDE é ladrilhada inteira */
function faixas(B, F, a0, b0, nAnd, pe, lista, porAndar) {
  let a = a0;
  for (const [k, w] of lista) {
    if (porAndar.has(k)) B.modulos(F, a, a + w, b0, b0 + nAnd * pe, 1, nAnd, () => k);
    else B.ladrilhar(F, B.ret(a, a + w, b0, b0 + nAnd * pe), k);
    a += w;
  }
}

function torre1(B, m, G) {
  const { x0, x1, zf, zb, hT, pe: PE, andares: N, e1, r1, q0, hTopo, hEsq } = m;
  const dR = m.fundoRasgo, dq = m.dobra, C = m.coroa, Pt = m.portaria, prof = zf - zb;
  const peca = { j: 't1_jan', c: 't1_cego', v: 't1_vidro' };
  /* uma grade de módulos de andar: `padrao` é uma letra por coluna
     (j = janelinha, c = cego, v = vidro) */
  const grade = (F, a0, a1, b0, nAnd, padrao) =>
    B.modulos(F, a0, a1, b0, b0 + nAnd * PE, padrao.length, nAnd, i => peca[padrao[i]]);
  const Ff = B.plano([0, 0, zf], [1, 0, 0], [0, 1, 0]);

  /* ---- o térreo: o saguão de vidro, com a porta atrás da portaria ---- */
  const pc = (Pt.x0 + Pt.x1) / 2 - x0;
  B.fachada(B.plano([x0, 0, zf], [1, 0, 0], [0, 1, 0]), x1 - x0, hT, 't1_concreto', [
    { a0: 2.2, a1: 4.8, b0: 0, b1: hT - 0.3, k: 't1_terreo' },
    { a0: 4.8, a1: 7.4, b0: 0, b1: hT - 0.3, k: 't1_terreo' },
    { a0: 7.4, a1: pc - 1.2, b0: 0, b1: hT - 0.3, k: 't1_terreo' },
    { a0: pc - 1.2, a1: pc + 1.2, b0: 0, b1: hT - 0.3, k: 't1_porta' },
    { a0: pc + 1.2, a1: pc + 3.7, b0: 0, b1: hT - 0.3, k: 't1_terreo' }
  ]);
  const Fd = B.plano([x1, 0, zf], [0, 0, -1], [0, 1, 0]);          // o lado da direita, da frente pro fundo
  const Fe = B.plano([x0, 0, zb], [0, 0, 1], [0, 1, 0]);           // o da esquerda, do fundo pra frente
  const Ft = B.plano([x1, 0, zb], [-1, 0, 0], [0, 1, 0]);          // o fundo, da direita pra esquerda
  for (const [F, L] of [[Fd, prof], [Fe, prof], [Ft, x1 - x0]]) B.ladrilhar(F, B.ret(0, L, 0, hT), 't1_concreto');

  /* ---- a frente: a massa da esquerda, o rasgo, a massa da direita e a quina ---- */
  grade(Ff, x0, e1, hT, N - 1, 'cjc');
  grade(Ff, r1, q0, hT, N, 'jccj');
  grade(Ff, q0, x1, hT, N, 'v');
  /* o RASGO: a cortina de vidro no fundo dele, as duas paredes de
     concreto e o piso na altura do teto do térreo */
  grade(B.plano([0, 0, zf - dR], [1, 0, 0], [0, 1, 0]), e1, r1, hT, N, 'v');
  B.ladrilhar(B.plano([r1, 0, zf - dR], [0, 0, 1], [0, 1, 0]), B.ret(0, dR, hT, hTopo), 't1_concreto', { escuro: 0.85 });
  B.ladrilhar(B.plano([e1, 0, zf], [0, 0, -1], [0, 1, 0]), B.ret(0, dR, hT, hEsq), 't1_concreto', { escuro: 0.85 });
  B.tampa([[e1, zf], [r1, zf], [r1, zf - dR], [e1, zf - dR]], hT, 't1_concreto');
  /* ---- os lados e o fundo ---- */
  grade(Fd, 0, dq, hT, N, 'v');                                     // a quina de vidro dobra pro lado
  grade(Fd, dq, prof, hT, N, 'cjccjc');
  grade(Fe, 0, prof, hT, N - 1, 'cjcvcjc');
  grade(Ft, 0, x1 - e1, hT, N, 'cjcvjc');
  grade(Ft, x1 - e1, x1 - x0, hT, N - 1, 'cjc');
  /* o último andar da massa da direita, por cima do telhado da esquerda */
  grade(B.plano([e1, 0, zb], [0, 0, 1], [0, 1, 0]), 0, prof - dR, hEsq, 1, 'cjcjc');
  /* o friso da laje no vidro: é o relevo que faz a cortina ler como
     andares, e não como papel azul */
  for (let j = 1; j < N; j++) {
    const y = hT + j * PE;
    B.caixa(e1, r1, y - 0.08, y + 0.08, zf - dR, zf - dR + 0.14, { todas: 't1_concreto', base: null });
    B.caixa(q0, x1 + 0.1, y - 0.08, y + 0.08, zf - dq, zf + 0.1, { todas: 't1_concreto' });
  }

  /* ---- os telhados: a massa da esquerda um andar abaixo, a laje de
     cima em L (o rasgo fica aberto pro céu) e a coroa ---- */
  const tetoE = [[x0, zf], [e1, zf], [e1, zb], [x0, zb]];
  B.tampa(tetoE, hEsq, 'cobertura');
  mureta(B, tetoE, hEsq, 1.0, 0.18, 't1_concreto');
  B.tampa([[e1, zf - dR], [r1, zf - dR], [r1, zb], [e1, zb]], hTopo, 'cobertura');
  B.tampa([[r1, zf], [x1, zf], [x1, zb], [r1, zb]], hTopo, 'cobertura');
  mureta(B, [[e1, zf - dR], [r1, zf - dR], [r1, zf], [x1, zf], [x1, zb], [e1, zb]], hTopo, 1.0, 0.18, 't1_concreto');
  B.caixa(C.x0, C.x1, hTopo, C.alt, C.z0, C.z1 + 0.03, { todas: 't1_concreto', frente: null, topo: 'cobertura', base: null });
  B.esticar(B.plano([0, 0, C.z1 + 0.03], [1, 0, 0], [0, 1, 0]), C.x0, C.x1, hTopo, C.alt, 't1_coroa');
  mureta(B, [[C.x0, C.z1 + 0.03], [C.x1, C.z1 + 0.03], [C.x1, C.z0], [C.x0, C.z0]], C.alt, 0.6, 0.15, 't1_concreto');

  /* ---- a caixa da portaria: a laje com o nome e as duas paredes ---- */
  B.caixa(Pt.x0, Pt.x1, 2.9, Pt.alt, Pt.z0, Pt.z1, { todas: 't1_concreto', frente: null, topo: 'cobertura' });
  B.esticar(B.plano([0, 0, Pt.z1 + 0.01], [1, 0, 0], [0, 1, 0]), Pt.x0, Pt.x1, 2.9, Pt.alt, 't1_placa');
  for (const [a, b] of [[Pt.x0, Pt.x0 + 0.25], [Pt.x1 - 0.25, Pt.x1]])
    B.caixa(a, b, 0, 2.9, Pt.z0, Pt.z1, { todas: 't1_concreto', base: null });

  muroCondominio(B, G, m, 't2_branco');
}

function torre2(B, m, G) {
  const { x0, x1, zf, zb, hT, pe: PE, andares: N, hTopo, xm } = m;
  const cn = m.canto, sc = m.sacada, tj = m.tij, fs = m.fundoSacada, P = m.portico, A = m.aletaV;
  const xa = x0 + cn, xb = xa + tj, xc = xb + sc, xd = xc + m.aleta, xe = xd + sc, xf = xe + tj;
  const prof = zf - zb, H = hTopo - hT;
  const porAndar = new Set(['t2_jan_br', 't2_jan_tij', 't2_sacada']);
  const Ff = B.plano([0, 0, zf], [1, 0, 0], [0, 1, 0]);

  /* ---- o térreo alto: o saguão de vidro com a porta debaixo da aleta ---- */
  const r = xm - x0;
  B.fachada(B.plano([x0, 0, zf], [1, 0, 0], [0, 1, 0]), x1 - x0, hT, 't2_branco', [
    { a0: 1.5, a1: (1.5 + r - 1.2) / 2, b0: 0, b1: hT - 0.3, k: 't2_terreo' },
    { a0: (1.5 + r - 1.2) / 2, a1: r - 1.2, b0: 0, b1: hT - 0.3, k: 't2_terreo' },
    { a0: r - 1.2, a1: r + 1.2, b0: 0, b1: hT - 0.3, k: 't2_porta' },
    { a0: r + 1.2, a1: (r + 1.2 + x1 - x0 - 1.5) / 2, b0: 0, b1: hT - 0.3, k: 't2_terreo' },
    { a0: (r + 1.2 + x1 - x0 - 1.5) / 2, a1: x1 - x0 - 1.5, b0: 0, b1: hT - 0.3, k: 't2_terreo' }
  ]);
  const Fd = B.plano([x1, 0, zf], [0, 0, -1], [0, 1, 0]);
  const Fe = B.plano([x0, 0, zb], [0, 0, 1], [0, 1, 0]);
  const Ft = B.plano([x1, 0, zb], [-1, 0, 0], [0, 1, 0]);
  for (const [F, L] of [[Fd, prof], [Fe, prof], [Ft, x1 - x0]]) B.ladrilhar(F, B.ret(0, L, 0, hT), 't2_branco');

  /* ---- a frente e o fundo em faixas: quina branca, tijolinho com a
     janela do lado da sacada, sacada, aleta (ou a faixa branca, no
     fundo), sacada, tijolinho, quina ---- */
  const tijE = [['t2_tijolo', tj - 1.3], ['t2_jan_tij', 1.3]], tijD = [['t2_jan_tij', 1.3], ['t2_tijolo', tj - 1.3]];
  faixas(B, Ff, x0, hT, N, PE, [['t2_jan_br', cn], ...tijE], porAndar);
  faixas(B, Ff, xe, hT, N, PE, [...tijD, ['t2_jan_br', cn]], porAndar);
  /* no fundo o `a` corre da direita pra esquerda: a mesma ordem, espelhada */
  faixas(B, Ft, 0, hT, N, PE, [['t2_jan_br', cn], ...tijE], porAndar);
  faixas(B, Ft, x1 - xb, hT, N, PE, [...tijD, ['t2_jan_br', cn]], porAndar);
  /* AS SACADAS, na frente e no fundo: o fundo de vidro recuado, as
     paredes brancas do recuo, a borda da laje de cada andar e o
     guarda-corpo de vidro */
  const sacadas = (zFace, sentido) => {
    const zFundo = zFace - sentido * fs;
    for (const [s0, s1] of [[xb, xc], [xd, xe]]) {
      const Fs = sentido > 0 ? B.plano([0, 0, zFundo], [1, 0, 0], [0, 1, 0])
                             : B.plano([0, 0, zFundo], [-1, 0, 0], [0, 1, 0]);
      const [a0, a1] = sentido > 0 ? [s0, s1] : [-s1, -s0];
      B.modulos(Fs, a0, a1, hT, hTopo, 1, N, () => 't2_sacada');
      B.tampa([[s0, zFace], [s1, zFace], [s1, zFundo], [s0, zFundo]], hT, 't2_branco');
      for (let j = 0; j < N; j++) {
        const y = hT + j * PE;
        const zA = Math.min(zFace, zFundo), zB = Math.max(zFace, zFundo);
        B.caixa(s0, s1, y - 0.2, y, zA - (sentido < 0 ? 0.05 : 0), zB + (sentido > 0 ? 0.05 : 0), { todas: 't2_branco' });
        const Fg = sentido > 0 ? B.plano([0, 0, zFace + 0.03], [1, 0, 0], [0, 1, 0])
                               : B.plano([0, 0, zFace - 0.03], [-1, 0, 0], [0, 1, 0]);
        B.esticar(Fg, a0, a1, y, y + 1.1, 't2_guarda');
      }
    }
  };
  sacadas(zf, 1);
  sacadas(zb, -1);
  /* as paredes do recuo que não são da aleta nem da faixa do meio */
  B.ladrilhar(B.plano([xb, 0, zf], [0, 0, -1], [0, 1, 0]), B.ret(0, fs, hT, hTopo), 't2_branco', { escuro: 0.85 });
  B.ladrilhar(B.plano([xe, 0, zf - fs], [0, 0, 1], [0, 1, 0]), B.ret(0, fs, hT, hTopo), 't2_branco', { escuro: 0.85 });
  B.ladrilhar(B.plano([xb, 0, zb + fs], [0, 0, -1], [0, 1, 0]), B.ret(0, fs, hT, hTopo), 't2_branco', { escuro: 0.85 });
  B.ladrilhar(B.plano([xe, 0, zb], [0, 0, 1], [0, 1, 0]), B.ret(0, fs, hT, hTopo), 't2_branco', { escuro: 0.85 });
  /* a ALETA na frente, do teto do térreo até passar do telhado, com o
     chapéu; no fundo, a mesma faixa entre as sacadas, rente */
  B.caixa(xc, xd, hT, A.alt, zf - fs, A.z1, { todas: 't2_branco', base: null });
  B.caixa(xc - 0.2, xd + 0.2, A.alt, A.alt + 0.35, zf - fs - 0.2, A.z1 + 0.2, { todas: 't2_branco' });
  B.caixa(xc, xd, hT, hTopo, zb, zb + fs, { todas: 't2_branco', base: null, topo: null });

  /* ---- os lados: quina, tijolinho, a faixa branca do meio, tijolinho, quina ---- */
  const lado = [['t2_jan_br', cn], ['t2_jan_tij', 1.3], ['t2_tijolo', 2.6], ['t2_jan_br', 1.2], ['t2_branco', prof - 2 * cn - 2 * 3.9 - 1.2],
                ['t2_tijolo', 2.6], ['t2_jan_tij', 1.3], ['t2_jan_br', cn]];
  faixas(B, Fd, 0, hT, N, PE, lado, porAndar);
  faixas(B, Fe, 0, hT, N, PE, lado, porAndar);

  /* ---- o telhado, a casa de máquinas e a caixa d'água ---- */
  const teto = [[x0, zf], [x1, zf], [x1, zb], [x0, zb]];
  B.tampa(teto, hTopo, 'cobertura');
  mureta(B, teto, hTopo, 1.0, 0.18, 't2_branco');
  B.caixa(xm - 2.5, xm + 2.5, hTopo, hTopo + 2.8, zb + 1.2, zb + 4.6, { todas: 't2_branco', topo: 'cobertura', base: null });
  B.caixa(xm - 1.6, xm + 1.6, hTopo + 2.8, hTopo + 4.0, zb + 1.6, zb + 4.2, { todas: 't2_branco', topo: 'cobertura', base: null });

  /* ---- o PÓRTICO: os dois pilares de tijolinho, a viga branca com o
     nome, as duas vigas que amarram na fachada e a marquise da porta ---- */
  for (const [a, b] of [[P.x0, P.x0 + P.pilar], [P.x1 - P.pilar, P.x1]])
    B.caixa(a, b, 0, P.y0, P.z0, P.z1, { todas: 't2_tijolo', base: null });
  B.caixa(P.x0, P.x1, P.y0, P.y1, P.z0, P.z1, { todas: 't2_branco' });
  B.esticar(B.plano([0, 0, P.z1 + 0.01], [1, 0, 0], [0, 1, 0]), xm - 5.0, xm + 5.0, P.y0 + 0.2, P.y0 + 1.1, 't2_nome');
  for (const x of [xa + 0.4, xf - 0.4])
    B.caixa(x - 0.2, x + 0.2, P.y0 + 0.3, P.y1, zf, P.z0, { todas: 't2_branco' });
  B.caixa(xm - 2.6, xm + 2.6, hT - 0.25, hT, zf, P.z0, { todas: 't2_branco' });

  muroCondominio(B, G, m, 't2_branco');
}

/* =======================================================
   A MONTAGEM: da planta pro mundo
   ======================================================= */
const MODELOS = {
  igreja: { folha: 'igreja', montar: igreja },
  predio: { folha: 'predio', montar: predio },
  loja:   { folha: 'loja',   montar: loja },
  adm:    { folha: 'adm',    montar: adm },
  casa:   { folha: 'casa',   montar: casa },
  atacadex: { folha: 'atacadex', montar: atacadex },
  torre1: { folha: 'torres', montar: torre1 },
  torre2: { folha: 'torres', montar: torre2 }
};

/* a mesma conta de `paraMundoDoMarco`, na planta */
function paraMundo(f, frente, lx, lz) {
  const M = METRO;
  if (frente === 's') return [f.x0 + lx * M, f.y1 + lz * M];
  if (frente === 'n') return [f.x1 - lx * M, f.y0 - lz * M];
  if (frente === 'o') return [f.x0 - lz * M, f.y0 + lx * M];
  return [f.x1 + lz * M, f.y1 - lx * M];
}

function textura(caminho, aniso) {
  const cam = (typeof window !== 'undefined' && window.__EMBUTIDOS && window.__EMBUTIDOS[caminho]) || caminho;
  const t = new THREE.TextureLoader().load(cam);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

export function montarModelos(P, opc = {}) {
  const K = P.CIDADE;
  const meshes = [], materiais = {};
  let triangulos = 0;
  const material = folha => {
    if (materiais[folha]) return materiais[folha];
    /* GRADE É BARRA FINA: de longe o mipmap mistura a barra com o vão,
       e o recorte seco por alfa (passa ou não passa) vira chiado — um
       moiré no portão inteiro. Com `alphaToCoverage` o alfa vira
       cobertura do antisserrilhado, e a grade de longe fica só mais
       clara, como fica de verdade. */
    const alfa = folha === 'grades';
    const mat = new THREE.MeshLambertMaterial({
      map: opc.semTextura ? null : textura(ATLAS[folha].arquivo, opc.anisotropia || 4),
      vertexColors: true, side: THREE.DoubleSide,
      alphaTest: alfa ? 0.08 : 0, alphaToCoverage: alfa
    });
    return (materiais[folha] = mat);
  };
  /* os marcos moram na ponta de um quarteirão, os dois prédios no
     miolo do baldio e o atacarejo no mato a oeste — a planta dá todos
     do mesmo jeito (fatia, frente, massa) */
  const pecas = [];
  for (const q of K.QUADRAS) {
    if (!q.equip) continue;
    for (const pc of q.equip.pecas) if (pc.k === 'modelo') pecas.push(pc);
  }
  if (K.ATACADEX) pecas.push(K.ATACADEX);
  {
    for (const pc of pecas) {
      if (!MODELOS[pc.modelo]) continue;
      const def = MODELOS[pc.modelo];
      const B = Construtor(def.folha), G = Construtor('grades');
      def.montar(B, pc.massa, G);
      for (const C of [B, G]) {
        if (!C.pos.length) continue;
        const n = C.pos.length / 3, arr = new Float32Array(C.pos.length);
        for (let i = 0; i < n; i++) {
          const [X, Z] = paraMundo(pc.fatia, pc.frente, C.pos[i * 3], C.pos[i * 3 + 2]);
          arr[i * 3] = X; arr[i * 3 + 1] = C.pos[i * 3 + 1] * METRO; arr[i * 3 + 2] = Z;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(C.uv, 2));
        g.setAttribute('color', new THREE.Float32BufferAttribute(C.cor, 3));
        g.computeVertexNormals();
        g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, material(C.folha));
        mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.name = 'marco:' + pc.modelo + (C === G ? ':grade' : '');
        meshes.push(mesh);
        triangulos += n / 3;
      }
    }
  }
  return { meshes, triangulos, materiais: Object.values(materiais) };
}
