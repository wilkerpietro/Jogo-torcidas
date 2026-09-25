/* =========================================================
   AS ÁRVORES LOW POLY — dez árvores de pouca face e cor chapada
   ---------------------------------------------------------
   AS ÁRVORES DO JOGO — todas (a rua, a praça, a praia, o mato em volta
   da cidade). Não tem textura nem recorte:
   - a COPA é um sólido facetado: bolas de 80 faces (a icosfera dividida
     uma vez), com cada vértice mexido pra perder o jeito de bola, o fundo
     às vezes chato e as faces de baixo mais escuras (a sombra de dentro);
   - o TRONCO e o GALHO são prismas de cinco a sete lados, dobrados na
     curva, e fecham na ponta;
   - a COR é chapada, uma por face, com um tremor de tom de face pra face
     — é o que dá o jeito de low poly;
   - a PALMEIRA tem a folha em fita dobrada em V, com a borda em serra; a
     ARAUCÁRIA, o tufo em prato; o CACTO, a coluna de costela.

   Uma árvore tem de 280 a 690 triângulos DE PERTO. E cada uma tem a
   versão DE LONGE, de 20 a 110 (`facesDaArvore(...).longe`), tirada do
   registro da de perto — onde ficou cada bola da copa, cada galho, cada
   folha —, então a troca não salta:
     copa      (oiti, mangueira, ipê, jequitibá, ingá, pequizeiro) uma ou
               duas bolas de 20 faces no volume da copa, na cor média
               dela, e o tronco num prisma de três lados;
     palmeira  (coqueiro) o tronco de três lados e seis folhas em losango;
     araucária o tronco e um prato por andar, da largura do andar;
     cacto     (mandacaru) cada coluna com quatro lados e o joelho;
     galho     (catingueira) os caules e os dois primeiros galhos.
   É o MATO SIMPLIFICADO (`mato3d.js`): a árvore a menos de 60 m da câmera
   sai inteira; mais longe, a de longe.

   `caber: { alt, raio }` encaixa a árvore num lugar dado (a árvore de
   rua da planta tem o raio da calçada): a altura e a copa esticam cada
   uma pro seu lado.

   As dez, pelo lugar (FLORA_LP):
     cidade    oiti, mangueira, ipê
     mata      ingá, jequitibá (e o ipê)
     cerrado   pequizeiro (e o ipê)
     caatinga  catingueira (na seca, só o galho), mandacaru
     praia     coqueiro
     sul       araucária (e o ingá)
   O ipê é um só: a semente dá a cor (amarelo, roxo, rosa ou branco).

   A SEMENTE dá outra árvore da mesma espécie: outro galho, outra copa,
   outro tamanho (±12%) e outro tom. Sai numa lista só, `lowpoly`: a
   posição e a cor de cada face (a UV vai zerada). O material é o de cor
   de vértice, chapado (`flatShading`), sem mapa.
   ========================================================= */
import { METRO, sub, soma, esc, unit, pv, noMundo, sorteio } from './construtor3d.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const lin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
/* a cor em hex, no espaço linear (é nele que o three lê a cor do vértice) */
function cor(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [lin((n >> 16 & 255) / 255), lin((n >> 8 & 255) / 255), lin((n & 255) / 255)];
}
const vezes = (k, f) => [k[0] * f, k[1] * f, k[2] * f];
const mistura = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function eixos(d) {
  let a = pv(d, [0, 1, 0]);
  if (Math.hypot(...a) < 1e-4) a = pv(d, [1, 0, 0]);
  a = unit(a);
  return [a, unit(pv(d, a))];
}

/* =======================================================
   AS FERRAMENTAS
   ======================================================= */
/* O REGISTRO da árvore que está sendo montada: cada bola da copa, cada
   tubo (o primeiro é o tronco), cada prato, cada folha de palmeira e
   cada galho da catingueira — é dele que sai a árvore de longe */
let REG = null;
const registrar = (tipo, x) => { if (REG) REG[tipo].push(x); };
/* AS FACES: cada triângulo numa cor só (a face chapada), tremida um tanto
   pra cima ou pra baixo */
function Faces(rnd) {
  const pos = [], uv = [], cor = [];
  const um = (p, q, r, k) => {
    pos.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2]);
    uv.push(0, 0, 0, 0, 0, 0);
    cor.push(k[0], k[1], k[2], k[0], k[1], k[2], k[0], k[1], k[2]);
  };
  const tremer = (k, t) => vezes(k, 1 + (rnd() - 0.5) * 2 * t);
  return {
    pos, uv, cor,
    tri(p, q, r, k, t = 0.07) { um(p, q, r, tremer(k, t)); },
    /* o quadrilátero numa cor só (as duas metades juntas: a face do prisma) */
    quad(p, q, r, s, k, t = 0.07) { const c = tremer(k, t); um(p, q, r, c); um(p, r, s, c); }
  };
}
/* a ICOSFERA: o icosaedro (20 faces) e ele dividido uma vez (80) */
const ICOSAEDRO = (() => {
  const t = (1 + Math.sqrt(5)) / 2;
  const v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
             [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(unit);
  const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
             [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  return { v, f };
})();
function dividir({ v, f }) {
  const V = v.slice(), meio = new Map(), nf = [];
  const m = (a, b) => {
    const k = a < b ? a * 4096 + b : b * 4096 + a;
    if (!meio.has(k)) { V.push(unit(soma(V[a], V[b]))); meio.set(k, V.length - 1); }
    return meio.get(k);
  };
  for (const [a, b, c] of f) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
  return { v: V, f: nf };
}
const ESFERA = [ICOSAEDRO, dividir(ICOSAEDRO)];

/* a BOLA facetada (o pedaço de copa, a fruta): a icosfera no centro `c`
   com os raios [rx, ry, rz] (ou r e `achata`), cada vértice mexido de até
   `mexe` do raio — a mesma mexida pro vértice que as faces dividem,
   senão abre fresta. `fundo`: corta a bola embaixo (a fração do raio de
   baixo que fica). As faces de baixo saem mais escuras (`escuro`). */
function bola(F, c, r, k, rnd, o = {}) {
  const E = ESFERA[o.nivel === undefined ? 1 : o.nivel];
  const [rx, ry, rz] = typeof r === 'number' ? [r, r * (o.achata || 1), r] : r;
  const mexe = o.mexe === undefined ? 0.14 : o.mexe, g = rnd() * Math.PI * 2, cg = Math.cos(g), sg = Math.sin(g);
  const piso = o.fundo === undefined ? -Infinity : c[1] - ry * o.fundo;
  const V = E.v.map(p => {
    const m = 1 + (rnd() - 0.5) * 2 * mexe, x = p[0] * m, z = p[2] * m;
    return [c[0] + (x * cg - z * sg) * rx, Math.max(piso, c[1] + p[1] * m * ry), c[2] + (x * sg + z * cg) * rz];
  });
  const escuro = o.escuro === undefined ? 0.62 : o.escuro;
  if (o.copa !== false) registrar('copas', { c, rx, ry, rz, k, fundo: o.fundo });
  for (const [a, b, d] of E.f) {
    const P = V[a], Q = V[b], R = V[d], t = clamp(((P[1] + Q[1] + R[1]) / 3 - (c[1] - ry)) / (2 * ry), 0, 1);
    F.tri(P, Q, R, vezes(k, lerp(escuro, 1.06, Math.pow(t, 0.7))), o.treme);
  }
}
/* o TUBO facetado (o tronco, o galho, a coluna do cacto): a polilinha
   `pts` com o raio de cada ponto e `lados` lados, o anel levado de um
   ponto ao outro sem torcer. `estrela`: a costela do cacto (um vértice
   sim, outro não, recolhido); `faixas`: as cores que se revezam por
   trecho (o anel do coqueiro); `ponta`: fecha em bico (o alto do cacto)
   em vez de chato; `tampa: false` deixa aberto. */
function tubo(F, pts, raios, k, lados, rnd, o = {}) {
  const n = pts.length;
  registrar('tubos', { pts, raios, k: k || (o.faixas && o.faixas[0]), ponta: o.ponta, estrela: o.estrela });
  const T = pts.map((p, i) => unit(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)])));
  let [a, b] = eixos(T[0]);
  const g = o.giro === undefined ? rnd() * Math.PI : o.giro, est = o.estrela || 1;
  const aneis = [];
  for (let i = 0; i < n; i++) {
    if (i) { const t = T[i]; a = unit(sub(a, esc(t, a[0] * t[0] + a[1] * t[1] + a[2] * t[2]))); b = unit(pv(t, a)); }
    aneis.push(Array.from({ length: lados }, (_, j) => {
      const ang = g + j / lados * 2 * Math.PI, rr = raios[i] * (j % 2 ? est : 1);
      return soma(pts[i], soma(esc(a, rr * Math.cos(ang)), esc(b, rr * Math.sin(ang))));
    }));
  }
  for (let i = 0; i < n - 1; i++) {
    const kk = o.faixas ? o.faixas[i % o.faixas.length] : k;
    for (let j = 0; j < lados; j++) {
      const j1 = (j + 1) % lados;
      F.quad(aneis[i][j], aneis[i][j1], aneis[i + 1][j1], aneis[i + 1][j], kk, o.treme);
    }
  }
  if (o.tampa === false) return;
  const topo = aneis[n - 1], kt = o.faixas ? o.faixas[(n - 2) % o.faixas.length] : k;
  if (o.ponta) {
    const c = soma(pts[n - 1], esc(T[n - 1], o.ponta));
    for (let j = 0; j < lados; j++) F.tri(topo[j], topo[(j + 1) % lados], c, kt, o.treme);
  } else for (let j = 1; j < lados - 1; j++) F.tri(topo[0], topo[j], topo[j + 1], kt, o.treme);
}
/* a CURVA do galho: sai de `p` na direção `d`, em `n` passos, tremendo */
function curva(p, d, L, n, rnd, treme = 0.25) {
  const pts = [p];
  let dd = unit(d), q = p;
  for (let i = 0; i < n; i++) {
    dd = unit([dd[0] + (rnd() - 0.5) * treme, dd[1] + (rnd() - 0.5) * treme * 0.5, dd[2] + (rnd() - 0.5) * treme]);
    q = soma(q, esc(dd, L / n));
    pts.push(q);
  }
  return pts;
}
const afina = (n, r0, r1) => Array.from({ length: n }, (_, i) => lerp(r0, r1, i / Math.max(1, n - 1)));
/* o PRATO (o tufo da araucária): a lente de seis lados, o aro mexido,
   a face de baixo na sombra */
function prato(F, c, r, h, k, rnd, lados = 6) {
  registrar('pratos', { c, r, h, k });
  const g = rnd() * Math.PI;
  const aro = Array.from({ length: lados }, (_, i) => {
    const t = g + i / lados * 2 * Math.PI, rr = r * rnd.entre(0.8, 1.1);
    return [c[0] + rr * Math.cos(t), c[1] + rnd.entre(-0.1, 0.1) * h, c[2] + rr * Math.sin(t)];
  });
  const cima = [c[0], c[1] + h * 0.6, c[2]], baixo = [c[0], c[1] - h * 0.4, c[2]];
  for (let i = 0; i < lados; i++) {
    const j = (i + 1) % lados;
    F.tri(aro[i], aro[j], cima, k);
    F.tri(aro[j], aro[i], baixo, vezes(k, 0.62));
  }
}
/* a FOLHA DA PALMEIRA: a fita que sai de `p` pro rumo `dir`, sobe um
   tanto e cai com o peso (`sobe`, `cai`), dobrada em V na nervura, com
   a borda em serra (o dente é o folíolo) */
function fronde(F, p, dir, L, larg, cai, k, rnd, o = {}) {
  const N = o.n || 4, d = unit([dir[0], 0, dir[2]]), lado = [-d[2], 0, d[0]], sobe = o.sobe === undefined ? 0.35 : o.sobe;
  const eixo = t => soma(p, [d[0] * L * t, L * (sobe * t - cai * t * t), d[2] * L * t]);
  const w = t => larg * Math.sin(Math.PI * Math.min(1, 0.12 + 0.88 * t)) * (1 - 0.25 * t);
  const V = 0.45;
  registrar('frondes', { eixo, w, lado, k, seca: !!o.seca });
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N, tm = (t0 + t1) / 2, c0 = eixo(t0), c1 = eixo(t1);
    for (const s of [-1, 1]) {
      const b0 = soma(c0, soma(esc(lado, s * w(t0)), [0, w(t0) * V, 0]));
      const b1 = soma(c1, soma(esc(lado, s * w(t1)), [0, w(t1) * V, 0]));
      const bm = soma(eixo(tm), soma(esc(lado, s * w(tm) * 1.3), [0, w(tm) * V - 0.06 * L / N, 0]));
      F.tri(c0, b0, bm, k); F.tri(c0, bm, c1, k); F.tri(bm, b1, c1, k);
    }
  }
}
/* o TAPETE de flor caída no chão (o do ipê): o disco recortado e as
   pétalas soltas em volta */
function tapete(F, c, r, k, rnd) {
  const n = 12, aro = [];
  for (let i = 0; i < n; i++) { const t = i / n * 2 * Math.PI, rr = r * rnd.entre(0.55, 1.05); aro.push([c[0] + rr * Math.cos(t), c[1], c[2] + rr * Math.sin(t)]); }
  const kk = vezes(k, 0.9);
  for (let i = 0; i < n; i++) F.tri(c, aro[(i + 1) % n], aro[i], kk, 0.05);
  for (let i = 0; i < 10; i++) {
    const t = rnd() * 2 * Math.PI, d = r * rnd.entre(1.0, 1.5), q = [c[0] + d * Math.cos(t), c[1], c[2] + d * Math.sin(t)], s = rnd.entre(0.08, 0.16);
    F.tri([q[0] - s, q[1], q[2]], [q[0] + s, q[1], q[2] + s * 0.4], [q[0], q[1], q[2] - s], kk, 0.1);
  }
}

/* =======================================================
   AS DEZ
   ======================================================= */
const FLORES_IPE = [['amarelo', '#f0c11e', 0.45], ['roxo', '#b95a9e', 0.3], ['rosa', '#e583b4', 0.15], ['branco', '#f1ede2', 0.1]];
const FORMAS = {
  /* o OITI: o fuste limpo de rua e a copa redonda e fechada */
  oiti(x) {
    const { F, rnd, f } = x, casca = cor('#6a5646'), verde = cor('#3f7d35');
    const H = 2.5 * f, topo = [rnd.entre(-0.12, 0.12), H + 0.8 * f, rnd.entre(-0.12, 0.12)];
    tubo(F, [[0, -0.05, 0], [0, H * 0.55, 0], topo], [0.24 * f, 0.18 * f, 0.13 * f], casca, 6, rnd);
    for (let i = 0; i < 2; i++) {
      const a = rnd() * 2 * Math.PI;
      tubo(F, [[0, H * 0.92, 0], [Math.cos(a) * 1.1 * f, H + 1.3 * f, Math.sin(a) * 1.1 * f]], [0.1 * f, 0.06 * f], casca, 5, rnd);
    }
    const R = 2.3 * f, c = [topo[0], H + R * 0.95, topo[2]];
    bola(F, c, [R, R * 0.86, R], verde, rnd, { fundo: 0.72 });
    const n = 2 + (rnd() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n + rnd();
      bola(F, [c[0] + Math.cos(a) * R * 0.62, c[1] - R * rnd.entre(0.05, 0.25), c[2] + Math.sin(a) * R * 0.62], R * rnd.entre(0.5, 0.6), verde, rnd, { fundo: 0.6 });
    }
  },
  /* a MANGUEIRA: o tronco grosso e curto, os quatro galhos fortes, a copa
     enorme e escura em cúpula e a manga pendurada na beira */
  mangueira(x) {
    const { F, rnd, f } = x, casca = cor('#5a4232'), verde = cor('#376b30');
    const H = 1.9 * f, base = [0.08 * f, H, 0.04 * f];
    tubo(F, [[0, -0.05, 0], [0.05 * f, H * 0.6, 0], base], [0.42 * f, 0.36 * f, 0.32 * f], casca, 7, rnd);
    const pontas = [];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + rnd.entre(-0.4, 0.4);
      const pts = curva(base, [Math.cos(a), 0.9, Math.sin(a)], 2.6 * f, 2, rnd, 0.3);
      tubo(F, pts, [0.24 * f, 0.17 * f, 0.1 * f], casca, 5, rnd);
      pontas.push(pts[pts.length - 1]);
    }
    const R = 3.1 * f;
    bola(F, [0, H + 3.1 * f, 0], [R, R * 0.72, R], verde, rnd, { fundo: 0.65 });
    /* os calombos na ponta dos galhos, e a manga pendurada na beira de fora
       de cada um (embaixo do meio da copa ela não aparece) */
    for (const p of pontas) {
      const rc = R * rnd.entre(0.55, 0.68), c = [p[0] * 1.15, p[1] + 0.3 * f, p[2] * 1.15], fora = unit([c[0], 0, c[2]]);
      bola(F, c, rc, verde, rnd, { fundo: 0.6, achata: 0.8 });
      const n = 1 + (rnd() < 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const lado = rnd.entre(-0.5, 0.5), d = [fora[0] - fora[2] * lado, 0, fora[2] + fora[0] * lado];
        bola(F, [c[0] + d[0] * rc * 0.78, c[1] - rc * 0.8 * 0.6 - 0.1 * f, c[2] + d[2] * rc * 0.78], [0.11 * f, 0.15 * f, 0.11 * f],
             cor(rnd() < 0.6 ? '#e8a032' : '#c8b43a'), rnd, { nivel: 0, mexe: 0.05, escuro: 0.9, copa: false });
      }
    }
  },
  /* o IPÊ em flor, sem folha: o tronco cinza, os galhos em taça, a copa
     de flor na ponta de cada galho e o tapete de flor no chão. A semente
     dá a cor. */
  ipe(x) {
    const { F, rnd, f } = x, cinza = cor('#8f8a80');
    let r = rnd(), qual = FLORES_IPE[0];
    for (const c of FLORES_IPE) { if ((r -= c[2]) < 0) { qual = c; break; } }
    if (x.florPedida) qual = FLORES_IPE.find(c => c[0] === x.florPedida) || qual;
    x.flor = qual[0];
    const flor = cor(qual[1]);
    const H = 2.6 * f, la = rnd.entre(-0.3, 0.3), lb = rnd.entre(-0.3, 0.3);
    const tronco = [[0, -0.05, 0], [la * 0.5 * f, H * 0.5, lb * 0.5 * f], [la * f, H, lb * f]];
    tubo(F, tronco, [0.24 * f, 0.19 * f, 0.16 * f], cinza, 6, rnd);
    const n = 4 + (rnd() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const a = i / n * 2 * Math.PI + rnd.entre(-0.3, 0.3);
      const pts = curva(tronco[2], [Math.cos(a) * 0.75, 1, Math.sin(a) * 0.75], rnd.entre(3.2, 4.2) * f, 3, rnd, 0.35);
      tubo(F, pts, afina(4, 0.13 * f, 0.05 * f), cinza, 5, rnd);
      const p = pts[pts.length - 1];
      bola(F, [p[0], p[1] + 0.3 * f, p[2]], rnd.entre(1.3, 1.7) * f, flor, rnd, { achata: 0.7, fundo: 0.7, escuro: 0.72 });
    }
    tapete(F, [la * 0.5 * f, 0.015, lb * 0.5 * f], 3.2 * f, flor, rnd);
  },
  /* o JEQUITIBÁ: a emergente da mata — o fuste reto de 13 m com a
     sapopema no pé e a copa larga e chata em guarda-chuva */
  jequitiba(x) {
    const { F, rnd, f } = x, casca = cor('#7a6452'), verde = cor('#467c3a');
    const H = 13.5 * f, topo = [rnd.entre(-0.3, 0.3) * f, H, rnd.entre(-0.3, 0.3) * f];
    tubo(F, [[0, -0.05, 0], [0, H * 0.35, 0], [topo[0] * 0.6, H * 0.7, topo[2] * 0.6], topo], [0.62 * f, 0.5 * f, 0.42 * f, 0.34 * f], casca, 7, rnd);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * 2 * Math.PI + rnd.entre(-0.3, 0.3), d = [Math.cos(a), 0, Math.sin(a)], lado = [-d[2], 0, d[0]];
      const alto = rnd.entre(1.4, 2.2) * f, fora = rnd.entre(1.3, 1.9) * f, e = 0.13 * f;
      const A = [d[0] * 0.3 * f, alto, d[2] * 0.3 * f], B = [d[0] * fora, 0, d[2] * fora], C = [d[0] * 0.5 * f, 0, d[2] * 0.5 * f];
      F.tri(A, soma(C, esc(lado, e)), B, casca); F.tri(A, B, soma(C, esc(lado, -e)), casca);
    }
    const pontas = [];
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * 2 * Math.PI + rnd.entre(-0.3, 0.3);
      const pts = curva(soma(topo, [0, -1.2 * f, 0]), [Math.cos(a), 0.55, Math.sin(a)], rnd.entre(4, 5.5) * f, 2, rnd, 0.25);
      tubo(F, pts, [0.28 * f, 0.18 * f, 0.1 * f], casca, 5, rnd);
      pontas.push(pts[pts.length - 1]);
    }
    for (const p of pontas) bola(F, [p[0], p[1] + 0.6 * f, p[2]], [3.0 * f, 1.5 * f, 3.0 * f], verde, rnd, { fundo: 0.55 });
    bola(F, [topo[0], topo[1] + 2.2 * f, topo[2]], [3.4 * f, 1.8 * f, 3.4 * f], verde, rnd, { fundo: 0.5 });
  },
  /* o INGÁ: a da mata e da beira de rio — o tronco claro que abre em três
     no baixo e a copa larga e torta */
  inga(x) {
    const { F, rnd, f } = x, casca = cor('#8a7a66'), verde = cor('#5e9747');
    const H = 1.9 * f, base = [0, H, 0];
    tubo(F, [[0, -0.05, 0], [0.05 * f, H * 0.5, 0], base], [0.3 * f, 0.25 * f, 0.22 * f], casca, 6, rnd);
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * 2 * Math.PI + rnd.entre(-0.5, 0.5);
      const pts = curva(base, [Math.cos(a) * 0.8, 1, Math.sin(a) * 0.8], rnd.entre(3.4, 4.6) * f, 3, rnd, 0.3);
      tubo(F, pts, afina(4, 0.18 * f, 0.07 * f), casca, 5, rnd);
      const p = pts[pts.length - 1];
      bola(F, [p[0], p[1] + 0.4 * f, p[2]], rnd.entre(1.9, 2.5) * f, verde, rnd, { achata: 0.72, fundo: 0.65 });
    }
    bola(F, [0, H + 4.2 * f, 0], 2.2 * f, verde, rnd, { achata: 0.7, fundo: 0.6 });
    const a = rnd() * 2 * Math.PI;
    bola(F, [Math.cos(a) * 3.2 * f, H + 2.9 * f, Math.sin(a) * 3.2 * f], 1.5 * f, verde, rnd, { achata: 0.75, fundo: 0.6 });
  },
  /* o PEQUIZEIRO: o cerrado — o tronco torto de cortiça, os galhos que
     saem de lado e a copa rala e chata, em tufos */
  pequizeiro(x) {
    const { F, rnd, f } = x, casca = cor('#7d6448'), verde = cor('#7a9446');
    const pts = curva([0, -0.05, 0], [rnd.entre(-0.3, 0.3), 1, rnd.entre(-0.3, 0.3)], 2.2 * f, 3, rnd, 0.55);
    tubo(F, pts, afina(4, 0.3 * f, 0.2 * f), casca, 6, rnd);
    const top = pts[pts.length - 1];
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * 2 * Math.PI + rnd.entre(-0.5, 0.5);
      const g = curva(top, [Math.cos(a), 0.45, Math.sin(a)], rnd.entre(2.0, 2.9) * f, 3, rnd, 0.6);
      tubo(F, g, afina(4, 0.15 * f, 0.06 * f), casca, 5, rnd);
      const p = g[g.length - 1];
      bola(F, [p[0], p[1] + 0.25 * f, p[2]], [rnd.entre(1.2, 1.6) * f, 0.7 * f, rnd.entre(1.2, 1.6) * f], verde, rnd, { fundo: 0.5 });
    }
    bola(F, [top[0], top[1] + 1.4 * f, top[2]], [1.4 * f, 0.8 * f, 1.4 * f], verde, rnd, { fundo: 0.5 });
  },
  /* a CATINGUEIRA na seca: dois ou três caules tortos e cinza, e o galho
     fino que se divide três vezes, sem folha */
  catingueira(x) {
    const { F, rnd, f } = x, cinza = cor('#a8a296');
    const n = 2 + (rnd() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const a = i / n * 2 * Math.PI + rnd.entre(-0.4, 0.4);
      ramo(F, [Math.cos(a) * 0.1 * f, -0.05, Math.sin(a) * 0.1 * f], [Math.cos(a) * 0.35, 1, Math.sin(a) * 0.35], rnd.entre(1.8, 2.4) * f, 0.13 * f, 3, rnd, cinza);
    }
  },
  /* o MANDACARU: o pé lenhoso, a coluna de cinco costelas e os braços que
     saem de lado e sobem; às vezes, o fruto vermelho no alto */
  mandacaru(x) {
    const { F, rnd, f } = x, verde = cor('#4f8150'), lenho = cor('#7a6a55');
    const H = rnd.entre(4.2, 5.6) * f, r = 0.24 * f;
    tubo(F, [[0, -0.05, 0], [0, 0.7 * f, 0]], [0.28 * f, 0.26 * f], lenho, 8, rnd, { tampa: false });
    tubo(F, [[0, 0.6 * f, 0], [0, H * 0.5, 0], [0, H, 0]], [r, r, r * 0.95], verde, 10, rnd, { estrela: 0.72, ponta: 0.09 * f, giro: 0 });
    const n = 3 + Math.floor(rnd() * 3), topos = [[0, H, 0]];
    for (let i = 0; i < n; i++) {
      const a = i / n * 2 * Math.PI + rnd.entre(-0.4, 0.4), d = [Math.cos(a), 0, Math.sin(a)];
      const y0 = rnd.entre(1.4, H * 0.55), fora = rnd.entre(0.45, 0.7) * f, alto = rnd.entre(1.4, Math.max(1.5, H - y0 - 0.3)), rb = r * rnd.entre(0.7, 0.85);
      const pts = [[d[0] * r * 0.5, y0, d[2] * r * 0.5], [d[0] * fora, y0 + 0.12 * f, d[2] * fora],
                   [d[0] * (fora + 0.15 * f), y0 + 0.45 * f, d[2] * (fora + 0.15 * f)], [d[0] * (fora + 0.18 * f), y0 + alto, d[2] * (fora + 0.18 * f)]];
      tubo(F, pts, [rb, rb, rb, rb * 0.95], verde, 10, rnd, { estrela: 0.72, ponta: 0.08 * f, giro: 0 });
      topos.push(pts[3]);
    }
    if (rnd() < 0.6) { const t = topos[Math.floor(rnd() * topos.length)]; bola(F, soma(t, [0.08 * f, 0.22 * f, 0]), 0.09 * f, cor('#c0306a'), rnd, { nivel: 0, mexe: 0.05, escuro: 0.9, copa: false }); }
  },
  /* o COQUEIRO: o tronco deitado que levanta a ponta, com o anel, o
     palmito, as doze folhas em arco, duas secas penduradas e o cacho */
  coqueiro(x) {
    const { F, rnd, f } = x;
    const H = rnd.entre(8.5, 10.5) * f, inc = rnd.entre(0.18, 0.32), rumo = rnd() * 2 * Math.PI, d = [Math.cos(rumo), 0, Math.sin(rumo)];
    const N = 9, pts = [];
    for (let i = 0; i <= N; i++) { const t = i / N, off = inc * H * (t - 0.4 * t * t); pts.push([d[0] * off, H * t - 0.05, d[2] * off]); }
    tubo(F, pts, afina(N + 1, 0.21 * f, 0.14 * f), null, 6, rnd, { faixas: [cor('#9a8566'), cor('#86735a')], tampa: false });
    const topo = pts[N];
    tubo(F, [soma(topo, [0, -0.1, 0]), soma(topo, [0, 0.55 * f, 0])], [0.17 * f, 0.08 * f], cor('#6f8a3a'), 6, rnd, { ponta: 0.15 * f });
    const verde = cor('#5b9a3c'), escuro = cor('#4a8a34'), nF = 12;
    for (let i = 0; i < nF; i++) {
      const a = i / nF * 2 * Math.PI + rnd.entre(-0.2, 0.2), alta = i % 2 === 0;
      fronde(F, soma(topo, [0, 0.35 * f, 0]), [Math.cos(a), 0, Math.sin(a)], rnd.entre(3.8, 4.8) * f, 0.72 * f,
             alta ? rnd.entre(0.5, 0.7) : rnd.entre(0.8, 1.05), mistura(verde, escuro, rnd()), rnd, { sobe: alta ? 0.55 : 0.3 });
    }
    for (let i = 0; i < 2; i++) {
      const a = rnd() * 2 * Math.PI;
      fronde(F, soma(topo, [0, 0.1, 0]), [Math.cos(a), 0, Math.sin(a)], 3.2 * f, 0.45 * f, 1.7, cor('#a88a50'), rnd, { sobe: 0.1, seca: true });
    }
    for (let i = 0; i < 6; i++) {
      const a = rnd() * 2 * Math.PI, dd = rnd.entre(0.2, 0.36) * f;
      bola(F, soma(topo, [Math.cos(a) * dd, rnd.entre(-0.35, 0.05) * f, Math.sin(a) * dd]), 0.17 * f, cor(rnd() < 0.7 ? '#7a9a30' : '#8a6a34'), rnd,
           { nivel: 0, mexe: 0.08, escuro: 0.85, copa: false });
    }
  },
  /* a ARAUCÁRIA: o tronco nu e reto e, só no alto, os andares de galho
     que sobem na ponta (o candelabro), cada um com o tufo em prato; o de
     baixo mais comprido — a copa em taça */
  araucaria(x) {
    const { F, rnd, f } = x, casca = cor('#6b4c38'), verde = cor('#325f35'), claro = cor('#3f7040');
    const H = rnd.entre(15, 19) * f;
    tubo(F, [[0, -0.05, 0], [0, H * 0.5, 0], [0, H, 0]], [0.38 * f, 0.28 * f, 0.12 * f], casca, 6, rnd);
    const andares = 4;
    for (let i = 0; i < andares; i++) {
      const t = i / (andares - 1), y = H * lerp(0.62, 0.95, t), L = lerp(4.4, 1.7, t) * f, n = i === andares - 1 ? 5 : 6, g = rnd() * 2 * Math.PI;
      for (let j = 0; j < n; j++) {
        const a = g + j / n * 2 * Math.PI + rnd.entre(-0.15, 0.15), d = [Math.cos(a), 0, Math.sin(a)];
        const p2 = [d[0] * L, y + L * 0.35, d[2] * L];
        tubo(F, [[0, y, 0], [d[0] * L * 0.75, y + L * 0.12, d[2] * L * 0.75], p2], [0.1 * f, 0.07 * f, 0.05 * f], casca, 3, rnd);
        prato(F, soma(p2, [0, 0.3 * f, 0]), rnd.entre(1.6, 1.95) * f * lerp(1, 0.75, t), 0.95 * f, mistura(verde, claro, rnd()), rnd);
      }
    }
    prato(F, [0, H + 0.35 * f, 0], 1.7 * f, 1.1 * f, verde, rnd);
  }
};
/* o galho da catingueira: a curva e, na ponta, dois ou três galhos
   menores, até `nivel` chegar a zero */
function ramo(F, p, d, L, r, nivel, rnd, k) {
  const pts = nivel >= 2 ? curva(p, d, L, 2, rnd, 0.35) : [p, soma(p, esc(unit(d), L))];
  registrar('ramos', { pts, r, nivel, k });
  tubo(F, pts, nivel >= 2 ? [r, r * 0.8, r * 0.62] : [r, r * 0.62], k, nivel >= 2 ? 5 : 3, rnd);
  if (!nivel) return;
  const q = pts[pts.length - 1];
  for (let i = 0; i < 2; i++) {
    const nd = unit(soma(unit(d), [rnd.entre(-0.9, 0.9), rnd.entre(0, 0.5), rnd.entre(-0.9, 0.9)]));
    ramo(F, q, nd, L * rnd.entre(0.55, 0.75), r * 0.62, nivel - 1, rnd, k);
  }
}

/* =======================================================
   O CATÁLOGO
   ======================================================= */
export const ESPECIES_LP = {
  oiti: { nome: 'Oiti', lugar: 'cidade', nota: 'A árvore de rua: o fuste limpo de 2,5 m e a copa redonda e fechada, com dois ou três calombos.' },
  mangueira: { nome: 'Mangueira', lugar: 'cidade', nota: 'A de quintal e de praça: o tronco grosso e curto, a copa enorme e escura em cúpula e a manga na beira.' },
  ipe: { nome: 'Ipê', lugar: 'cidade', nota: 'Em flor, sem folha: o tronco cinza, os galhos em taça e o tapete de flor no chão. A semente dá a cor: amarelo, roxo, rosa ou branco.' },
  jequitiba: { nome: 'Jequitibá', lugar: 'mata', nota: 'A emergente da mata: o fuste reto de 13 m, a sapopema no pé e a copa larga e chata em guarda-chuva.' },
  inga: { nome: 'Ingá', lugar: 'mata', nota: 'A da mata e da beira de rio: o tronco claro que abre em três no baixo e a copa larga e torta.' },
  pequizeiro: { nome: 'Pequizeiro', lugar: 'cerrado', nota: 'O cerrado: o tronco torto de cortiça, o galho de lado e a copa rala e chata, em tufos.' },
  catingueira: { nome: 'Catingueira', lugar: 'caatinga', nota: 'A caatinga na seca: dois ou três caules cinza e o galho fino, sem folha.' },
  mandacaru: { nome: 'Mandacaru', lugar: 'caatinga', nota: 'O cacto em candelabro: o pé lenhoso, a coluna de costela e os braços que sobem; às vezes, o fruto vermelho.' },
  coqueiro: { nome: 'Coqueiro', lugar: 'praia', nota: 'O da orla: o tronco de anel deitado que levanta a ponta, as folhas em arco, duas secas penduradas e o cacho de coco.' },
  araucaria: { nome: 'Araucária', lugar: 'sul', nota: 'O pinheiro do Paraná: o tronco nu e, só no alto, os andares de galho em candelabro com o tufo em prato.' }
};
/* o que vai em cada lugar (a proporção é o peso no sorteio) */
export const FLORA_LP = {
  cidade: { oiti: 5, mangueira: 2, ipe: 2 },
  mata: { inga: 4, jequitiba: 1, ipe: 1 },
  cerrado: { pequizeiro: 5, ipe: 2 },
  caatinga: { catingueira: 5, mandacaru: 3 },
  praia: { coqueiro: 1 },
  sul: { araucaria: 3, inga: 2 }
};

/* A ÁRVORE DE LONGE, tirada do registro da de perto (ver o cabeçalho) */
const FAMILIA = { oiti: 'copa', mangueira: 'copa', ipe: 'copa', jequitiba: 'copa', inga: 'copa', pequizeiro: 'copa',
                  catingueira: 'galho', mandacaru: 'cacto', coqueiro: 'palmeira', araucaria: 'araucaria' };
function deLonge(familia, R, rnd) {
  const F = Faces(rnd);
  const prisma = (t, lados = 3) => { const n = t.pts.length; tubo(F, [t.pts[0], t.pts[n - 1]], [t.raios[0] * 0.9, t.raios[n - 1] * 0.9], t.k, lados, rnd, { tampa: false }); };
  const tronco = R.tubos[0];
  if (familia === 'copa') {
    if (tronco) prisma(tronco);
    /* o volume da copa inteira (a caixa das bolas) e a cor média, pesada pelo tamanho */
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity, pes = 0;
    const k = [0, 0, 0];
    for (const b of R.copas) {
      x0 = Math.min(x0, b.c[0] - b.rx); x1 = Math.max(x1, b.c[0] + b.rx);
      y0 = Math.min(y0, b.c[1] - b.ry * (b.fundo === undefined ? 1 : b.fundo)); y1 = Math.max(y1, b.c[1] + b.ry);
      z0 = Math.min(z0, b.c[2] - b.rz); z1 = Math.max(z1, b.c[2] + b.rz);
      const v = b.rx * b.ry * b.rz; pes += v; for (let i = 0; i < 3; i++) k[i] += b.k[i] * v;
    }
    if (!pes) return F;
    const kk = vezes(k, 1 / pes), H = y1 - y0, W = x1 - x0, D = z1 - z0;
    /* copa larga e baixa (a do jequitibá, a do ingá) sai em duas bolas, pra não virar um disco */
    const partes = Math.max(W, D) / H > 2.4 && R.copas.length > 2 ? 2 : 1;
    for (let i = 0; i < partes; i++) {
      const emX = W >= D, fr = partes === 1 ? 0.5 : (i + 0.5) / 2;
      const cx = emX ? x0 + W * fr : (x0 + x1) / 2, cz = emX ? (z0 + z1) / 2 : z0 + D * fr;
      const rx = (emX ? W / partes : W) / 2 * 0.95, rz = (emX ? D : D / partes) / 2 * 0.95;
      bola(F, [cx, y0 + H * 0.52, cz], [rx, H / 2 * 0.95, rz], kk, rnd, { nivel: 0, mexe: 0.08, fundo: 0.8, escuro: 0.66, copa: false });
    }
  } else if (familia === 'palmeira') {
    if (tronco) { const n = tronco.pts.length, ix = [0, Math.round(n / 3), Math.round(2 * n / 3), n - 1];
                  tubo(F, ix.map(i => tronco.pts[i]), ix.map(i => tronco.raios[i]), tronco.k, 3, rnd, { tampa: false }); }
    /* seis folhas verdes, em losango: a base, o meio (com a largura) e a ponta */
    R.frondes.filter(f => !f.seca).forEach((f, i) => {
      if (i % 2) return;
      const b = f.eixo(0), m = f.eixo(0.45), t = f.eixo(1), w = f.w(0.45) * 1.1;
      F.tri(b, soma(m, esc(f.lado, w)), t, f.k); F.tri(b, t, soma(m, esc(f.lado, -w)), f.k);
    });
  } else if (familia === 'araucaria') {
    if (tronco) prisma(tronco);
    /* um prato por andar: os pratos agrupados pela altura, e o de cima */
    const ps = R.pratos.slice().sort((a, b) => a.c[1] - b.c[1]), andares = [];
    for (const p of ps) { const u = andares[andares.length - 1]; if (u && p.c[1] - u[u.length - 1].c[1] < 0.9) u.push(p); else andares.push([p]); }
    for (const an of andares) {
      const y = an.reduce((a, p) => a + p.c[1], 0) / an.length, h = an.reduce((a, p) => a + p.h, 0) / an.length;
      const r = Math.max(...an.map(p => Math.hypot(p.c[0], p.c[2]) + p.r * 0.8));
      prato(F, [0, y, 0], r, h, an[0].k, rnd, 5);
    }
  } else if (familia === 'cacto') {
    for (const t of R.tubos) {
      const n = t.pts.length, ix = n > 3 ? [0, Math.floor(n / 2), n - 1] : t.pts.map((_, i) => i);
      tubo(F, ix.map(i => t.pts[i]), ix.map(i => t.raios[i]), t.k, 4, rnd, { ponta: t.ponta, tampa: t.ponta ? undefined : false });
    }
  } else if (familia === 'galho') {
    for (const g of R.ramos) if (g.nivel >= 2) tubo(F, [g.pts[0], g.pts[g.pts.length - 1]], [g.r, g.r * 0.62], g.k, 3, rnd, { tampa: false });
  }
  return F;
}
/* as FACES da árvore da `especie` com a `semente`, em metros, com o pé na
   origem: a de perto, a de longe, a altura, o raio da copa e (no ipê) a
   cor. `o.fator`: o tamanho (senão a semente sorteia ±12%); `o.flor`: a
   cor do ipê; `o.caber: { alt, raio }`: estica a árvore pro lugar dado */
export function facesDaArvore(especie, semente = 1, o = {}) {
  const forma = FORMAS[especie];
  if (!forma) throw new Error('arvores_lowpoly: não conheço a espécie ' + especie);
  const rnd = sorteio(semente * 7919 + especie.length * 104729 + 17);
  const F = Faces(rnd), x = { F, rnd, f: o.fator || rnd.entre(0.88, 1.12), florPedida: o.flor };
  REG = { copas: [], tubos: [], pratos: [], frondes: [], ramos: [] };
  try { forma(x); } finally { var R = REG; REG = null; }
  const L = deLonge(FAMILIA[especie], R, sorteio(semente * 31 + 7));
  const medir = P => { let a = 0, r = 0; for (let i = 0; i < P.length; i += 3) { a = Math.max(a, P[i + 1]); r = Math.max(r, Math.hypot(P[i], P[i + 2])); } return [a, r]; };
  let [alt, raio] = medir(F.pos);
  if (o.caber) {
    const kxz = o.caber.raio / Math.max(0.1, raio), ky = o.caber.alt / Math.max(0.1, alt);
    for (const P of [F.pos, L.pos]) for (let i = 0; i < P.length; i += 3) { P[i] *= kxz; P[i + 1] *= ky; P[i + 2] *= kxz; }
    alt = o.caber.alt; raio = o.caber.raio;
  }
  return { perto: F, longe: L, altura: alt, raio, flor: x.flor };
}
/* MONTA a árvore da `especie` com a `semente` em (onde.x, onde.z) do
   mundo e põe o bloco em `destino.lowpoly` (ou `o.lista`); `o.longe`
   monta a de longe. Devolve a altura, o raio da copa, os triângulos (os
   da que montou e os das duas) e, no ipê, a cor da flor. */
export function montarArvoreLowpoly(especie, onde = {}, destino = {}, semente = 1, o = {}) {
  const r = facesDaArvore(especie, semente, { fator: onde.fator, flor: o.flor, caber: o.caber });
  const F = o.longe ? r.longe : r.perto;
  noMundo({ [o.lista || 'lowpoly']: F }, destino, onde);
  const k = onde.escala || 1;
  return { altura: r.altura * k, raio: r.raio * k, triangulos: F.pos.length / 9,
           perto: r.perto.pos.length / 9, longe: r.longe.pos.length / 9, flor: r.flor };
}
/* sorteia uma espécie do lugar, pelo peso */
export function especieLowpolyDe(lugar, rnd) {
  const tab = FLORA_LP[lugar] || FLORA_LP.mata, tot = Object.values(tab).reduce((a, b) => a + b, 0);
  let r = rnd() * tot;
  for (const [k, p] of Object.entries(tab)) { if ((r -= p) < 0) return k; }
  return Object.keys(tab)[0];
}
/* AS DEZ JUNTAS, pra comparar: as altas atrás (jequitibá, araucária,
   coqueiro, ingá, mangueira), de 11 em 11 m, e as baixas na frente,
   desencontradas (a de trás aparece no vão das da frente) */
export function montarAsDez(onde = {}, destino = {}, semente = 1, o = {}) {
  const fila = [['jequitiba', 'araucaria', 'coqueiro', 'inga', 'mangueira'], ['oiti', 'ipe', 'pequizeiro', 'catingueira', 'mandacaru']];
  const k = onde.escala || 1, c = Math.cos(onde.giro || 0), s = Math.sin(onde.giro || 0);
  let triangulos = 0, altura = 0;
  fila.forEach((linha, j) => linha.forEach((especie, i) => {
    const lx = (i - 2) * 11 + (j ? 5.5 : 0), lz = j ? 6 : -6;
    const r = montarArvoreLowpoly(especie, { x: (onde.x || 0) + (lx * c - lz * s) * k * METRO, z: (onde.z || 0) + (lx * s + lz * c) * k * METRO,
                                             y: onde.y || 0, giro: (onde.giro || 0) + i * 1.3, escala: k }, destino, semente + i + j * 5, o);
    triangulos += r.triangulos; altura = Math.max(altura, r.altura);
  }));
  return { altura, triangulos, especies: 10 };
}
