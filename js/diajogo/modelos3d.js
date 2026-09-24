/* =========================================================
   OS MARCOS — cinco prédios modelados peça por peça
   ---------------------------------------------------------
   A igreja matriz, o prédio alto, o prédio de três andares com o
   mercado, o centro administrativo e a casa de classe média. Quem diz
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

const METRO = 34 / 1.75;
const lerp = (a, b, t) => a + (b - a) * t;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const soma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const esc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const pv = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const pe = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/* =======================================================
   O CONSTRUTOR — junta triângulos com a UV da folha
   ======================================================= */
function Construtor(folha) {
  const A = ATLAS[folha];
  const pos = [], uv = [], cor = [];
  const cel = k => {
    const c = A.cel[k];
    if (!c) throw new Error(`modelos3d: a folha "${folha}" não tem a peça "${k}"`);
    return c;
  };
  /* o pé da parede um pouco mais escuro: é a oclusão do chão, que o
     Lambert sozinho não dá, e sem ela o prédio "flutua" na calçada */
  const tom = y => 0.8 + 0.2 * Math.min(1, Math.max(0, y / 1.3));
  function tri(p, q, r, a, b, c, escuro) {
    pos.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2]);
    uv.push(a[0], a[1], b[0], b[1], c[0], c[1]);
    for (const v of [p, q, r]) { const t = tom(v[1]) * (escuro || 1); cor.push(t, t, t); }
  }
  function poli(P, T, escuro) {
    for (let i = 1; i < P.length - 1; i++) tri(P[0], P[i], P[i + 1], T[0], T[i], T[i + 1], escuro);
  }
  /* um PLANO: origem O e dois eixos unitários U (largura) e V (altura);
     a normal de fora é U × V */
  const plano = (O, U, V) => ({ O, U, V, N: pv(U, V) });
  const noPlano = (F, a, b) => soma(F.O, soma(esc(F.U, a), esc(F.V, b)));
  const recuado = (F, d) => plano(soma(F.O, esc(F.N, -d)), F.U, F.V);

  /* recorte de polígono convexo por um retângulo (Sutherland–Hodgman) */
  function recortar(pol, a0, a1, b0, b1) {
    const lados = [[p => p[0] >= a0, (p, q) => (a0 - p[0]) / (q[0] - p[0])],
                   [p => p[0] <= a1, (p, q) => (a1 - p[0]) / (q[0] - p[0])],
                   [p => p[1] >= b0, (p, q) => (b0 - p[1]) / (q[1] - p[1])],
                   [p => p[1] <= b1, (p, q) => (b1 - p[1]) / (q[1] - p[1])]];
    let s = pol;
    for (const [dentro, t] of lados) {
      if (!s.length) break;
      const out = [];
      for (let i = 0; i < s.length; i++) {
        const p = s[i], q = s[(i + 1) % s.length];
        const dp = dentro(p), dq = dentro(q);
        if (dp) out.push(p);
        if (dp !== dq) { const k = t(p, q); out.push([lerp(p[0], q[0], k), lerp(p[1], q[1], k)]); }
      }
      s = out;
    }
    return s;
  }
  /* LADRILHAR: um polígono convexo do plano F coberto pela peça
     repetida no tamanho de mundo dela (ou em `tw` × `th`). A grade
     parte de (oa, ob), então duas faces vizinhas podem continuar o
     mesmo desenho. */
  function ladrilhar(F, pol, k, o = {}) {
    const c = cel(k), tw = o.tw || c[4], th = o.th || c[5], oa = o.oa || 0, ob = o.ob || 0;
    let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
    for (const [a, b] of pol) { amin = Math.min(amin, a); amax = Math.max(amax, a); bmin = Math.min(bmin, b); bmax = Math.max(bmax, b); }
    const i0 = Math.floor((amin - oa) / tw + 1e-6), i1 = Math.ceil((amax - oa) / tw - 1e-6);
    const j0 = Math.floor((bmin - ob) / th + 1e-6), j1 = Math.ceil((bmax - ob) / th - 1e-6);
    for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) {
      const A0 = oa + i * tw, B0 = ob + j * th;
      const q = recortar(pol, A0, A0 + tw, B0, B0 + th);
      if (q.length < 3) continue;
      const P = q.map(([a, b]) => noPlano(F, a, b));
      const T = q.map(([a, b]) => [lerp(c[0], c[2], (a - A0) / tw), lerp(c[1], c[3], (b - B0) / th)]);
      poli(P, T, o.escuro);
    }
  }
  const ret = (a0, a1, b0, b1) => [[a0, b0], [a1, b0], [a1, b1], [a0, b1]];
  /* ESTICAR: a peça inteira num retângulo, uma vez só. `parte` pega só
     um pedaço dela (frações u0, u1, v0, v1). */
  function esticar(F, a0, a1, b0, b1, k, o = {}) {
    const c = cel(k);
    const [f0, f1, g0, g1] = o.parte || [0, 1, 0, 1];
    const U0 = lerp(c[0], c[2], f0), U1 = lerp(c[0], c[2], f1);
    const V0 = lerp(c[1], c[3], g0), V1 = lerp(c[1], c[3], g1);
    const P = [noPlano(F, a0, b0), noPlano(F, a1, b0), noPlano(F, a1, b1), noPlano(F, a0, b1)];
    const T = o.espelho ? [[U1, V0], [U0, V0], [U0, V1], [U1, V1]] : [[U0, V0], [U1, V0], [U1, V1], [U0, V1]];
    poli(P, T, o.escuro);
  }
  /* as seis faces de uma caixa, cada uma com o seu plano e o tamanho */
  function faces(x0, x1, y0, y1, z0, z1) {
    return {
      frente: [plano([x0, y0, z1], [1, 0, 0], [0, 1, 0]), x1 - x0, y1 - y0],
      tras:   [plano([x1, y0, z0], [-1, 0, 0], [0, 1, 0]), x1 - x0, y1 - y0],
      dir:    [plano([x1, y0, z1], [0, 0, -1], [0, 1, 0]), z1 - z0, y1 - y0],
      esq:    [plano([x0, y0, z0], [0, 0, 1], [0, 1, 0]), z1 - z0, y1 - y0],
      topo:   [plano([x0, y1, z1], [1, 0, 0], [0, 0, -1]), x1 - x0, z1 - z0],
      base:   [plano([x0, y0, z0], [1, 0, 0], [0, 0, 1]), x1 - x0, z1 - z0]
    };
  }
  /* CAIXA: `spec` diz o que vai em cada face — o nome da peça (que é
     ladrilhada), {k, modo:'esticar'}, ou null pra não desenhar.
     `todas` vale pras que não foram ditas. */
  function caixa(x0, x1, y0, y1, z0, z1, spec) {
    const F = faces(x0, x1, y0, y1, z0, z1);
    for (const nome of ['frente', 'tras', 'dir', 'esq', 'topo', 'base']) {
      let s = spec[nome] === undefined ? spec.todas : spec[nome];
      if (!s) continue;
      if (typeof s === 'string') s = { k: s };
      const [f, w, h] = F[nome];
      if (s.modo === 'esticar') esticar(f, 0, w, 0, h, s.k, s);
      else ladrilhar(f, ret(0, w, 0, h), s.k, s);
    }
  }
  /* FACHADA COM VÃOS. A parede é partida pelas bordas dos vãos; o que
     cai dentro de um vão leva a peça dele (e, se o vão tem `fundo`, o
     requadro de quatro paredinhas), o resto leva a parede ladrilhada.
     Nada fica por cima de nada — parede e janela no mesmo plano, sem
     briga de profundidade. */
  function fachada(F, larg, alt, parede, vaos, oParede = {}) {
    const xs = [...new Set([0, larg, ...vaos.flatMap(v => [v.a0, v.a1])])].filter(x => x >= 0 && x <= larg).sort((a, b) => a - b);
    const ys = [...new Set([0, alt, ...vaos.flatMap(v => [v.b0, v.b1])])].filter(y => y >= 0 && y <= alt).sort((a, b) => a - b);
    const noVao = (a, b) => vaos.some(v => a > v.a0 && a < v.a1 && b > v.b0 && b < v.b1);
    for (let j = 0; j < ys.length - 1; j++) {
      const b0 = ys[j], b1 = ys[j + 1], bm = (b0 + b1) / 2;
      let ini = null;
      for (let i = 0; i <= xs.length - 1; i++) {
        const livre = i < xs.length - 1 && !noVao((xs[i] + xs[i + 1]) / 2, bm);
        if (livre && ini === null) ini = xs[i];
        if (!livre && ini !== null) { ladrilhar(F, ret(ini, xs[i], b0, b1), parede, oParede); ini = null; }
      }
    }
    for (const v of vaos) {
      if (v.modo === 'ladrilho') { ladrilhar(F, ret(v.a0, v.a1, v.b0, v.b1), v.k, v); continue; }
      if (!v.fundo) { esticar(F, v.a0, v.a1, v.b0, v.b1, v.k, v); continue; }
      const d = v.fundo, Fi = recuado(F, d), rq = v.requadro || parede;
      esticar(Fi, v.a0, v.a1, v.b0, v.b1, v.k, v);
      const P = (a, b) => noPlano(F, a, b);
      const h = v.b1 - v.b0, w = v.a1 - v.a0;
      ladrilhar(plano(P(v.a0, v.b0), esc(F.N, -1), F.V), ret(0, d, 0, h), rq, { escuro: 0.82 });
      ladrilhar(plano(soma(P(v.a1, v.b0), esc(F.N, -d)), F.N, F.V), ret(0, d, 0, h), rq, { escuro: 0.82 });
      ladrilhar(plano(soma(P(v.a0, v.b1), esc(F.N, -d)), F.U, F.N), ret(0, w, 0, d), rq, { escuro: 0.7 });
      ladrilhar(plano(P(v.a0, v.b0), F.U, esc(F.N, -1)), ret(0, w, 0, d), rq, { escuro: 0.95 });
    }
  }
  /* MÓDULOS: uma grade de nx × ny peças no retângulo, cada uma
     esticada no seu vão. `qual(i, j)` escolhe a peça. */
  function modulos(F, a0, a1, b0, b1, nx, ny, qual) {
    const w = (a1 - a0) / nx, h = (b1 - b0) / ny;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const k = qual(i, j);
      if (k) esticar(F, a0 + i * w, a0 + (i + 1) * w, b0 + j * h, b0 + (j + 1) * h, k);
    }
  }
  /* AS PAREDES DE UM PISO POLIGONAL (convexo, em planta, no sentido
     frente-esquerda → frente-direita → fundo). `cada(F, comprimento, i)`
     monta a fachada de cada lado. */
  function paredes(pts, y0, cada) {
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      const U = unit([q[0] - p[0], 0, q[1] - p[1]]);
      cada(plano([p[0], y0, p[1]], U, [0, 1, 0]), Math.hypot(q[0] - p[0], q[1] - p[1]), i);
    }
  }
  /* uma tampa horizontal num polígono convexo (topo ou fundo) */
  function tampa(pts, y, k, emBaixo, o) {
    const F = emBaixo ? plano([0, y, 0], [1, 0, 0], [0, 0, 1]) : plano([0, y, 0], [1, 0, 0], [0, 0, -1]);
    ladrilhar(F, pts.map(([x, z]) => [x, emBaixo ? z : -z]), k, o);
  }
  /* O TORNO: um perfil [[raio, y], ...] girado em volta de (cx, cz).
     A peça dá UMA volta inteira em u; em v ela acompanha o perfil. */
  function torno(cx, cz, perfil, lados, k, o = {}) {
    const c = cel(k);
    const L = [0];
    for (let j = 1; j < perfil.length; j++)
      L.push(L[j - 1] + Math.hypot(perfil[j][0] - perfil[j - 1][0], perfil[j][1] - perfil[j - 1][1]));
    const tot = L[L.length - 1] || 1;
    const giro = o.giro || 0;
    for (let i = 0; i < lados; i++) {
      const t0 = giro + i / lados * Math.PI * 2, t1 = giro + (i + 1) / lados * Math.PI * 2;
      const u0 = lerp(c[0], c[2], i / lados), u1 = lerp(c[0], c[2], (i + 1) / lados);
      for (let j = 0; j < perfil.length - 1; j++) {
        const [r0, y0] = perfil[j], [r1, y1] = perfil[j + 1];
        const v0 = lerp(c[1], c[3], L[j] / tot), v1 = lerp(c[1], c[3], L[j + 1] / tot);
        const P = [[cx + r0 * Math.cos(t0), y0, cz - r0 * Math.sin(t0)], [cx + r0 * Math.cos(t1), y0, cz - r0 * Math.sin(t1)],
                   [cx + r1 * Math.cos(t1), y1, cz - r1 * Math.sin(t1)], [cx + r1 * Math.cos(t0), y1, cz - r1 * Math.sin(t0)]];
        poli(P, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], o.escuro);
      }
    }
  }
  /* EXTRUDAR um contorno (qualquer, até côncavo) desenhado no plano F:
     a frente leva a peça `kFrente` esticada no retângulo que envolve o
     contorno, o lado leva `kLado`, o fundo `kFundo` */
  function extrudar(F, contorno, fundo, kFrente, kLado, kFundo) {
    const c = cel(kFrente);
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const [a, b] of contorno) { a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
    const tris = THREE.ShapeUtils.triangulateShape(contorno.map(([a, b]) => new THREE.Vector2(a, b)), []);
    const Fb = recuado(F, fundo), cf = cel(kFundo || kFrente);
    const uvDe = (cc, a, b) => [lerp(cc[0], cc[2], (a - a0) / (a1 - a0)), lerp(cc[1], cc[3], (b - b0) / (b1 - b0))];
    for (const [i, j, k] of tris) {
      const p = contorno[i], q = contorno[j], r = contorno[k];
      tri(noPlano(F, p[0], p[1]), noPlano(F, q[0], q[1]), noPlano(F, r[0], r[1]),
          uvDe(c, p[0], p[1]), uvDe(c, q[0], q[1]), uvDe(c, r[0], r[1]));
      tri(noPlano(Fb, r[0], r[1]), noPlano(Fb, q[0], q[1]), noPlano(Fb, p[0], p[1]),
          uvDe(cf, r[0], r[1]), uvDe(cf, q[0], q[1]), uvDe(cf, p[0], p[1]));
    }
    for (let i = 0; i < contorno.length; i++) {
      const p = contorno[i], q = contorno[(i + 1) % contorno.length];
      const P0 = noPlano(F, p[0], p[1]), Q0 = noPlano(F, q[0], q[1]);
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (len < 1e-4) continue;
      ladrilhar(plano(P0, unit(sub(Q0, P0)), esc(F.N, -1)), ret(0, len, 0, fundo), kLado, { escuro: 0.9 });
    }
  }
  /* uma VIGA ao longo de um segmento qualquer: a cumeeira do telhado,
     o espigão. Três faces (as de baixo ficam dentro do telhado). */
  function viga(p, q, larg, alt, k) {
    const ao = unit(sub(q, p)), L = Math.hypot(...sub(q, p));
    let lado = pv(ao, [0, 1, 0]);
    if (Math.hypot(...lado) < 1e-3) lado = [1, 0, 0];
    lado = unit(lado);
    const cima = unit(pv(lado, ao));
    const b = soma(p, esc(cima, alt * 0.35));
    const a = esc(lado, larg / 2), t = esc(cima, alt);
    ladrilhar(plano(soma(soma(b, a), t), ao, esc(lado, -1)), ret(0, L, 0, larg), k);
    ladrilhar(plano(soma(b, a), ao, cima), ret(0, L, 0, alt), k, { escuro: 0.9 });
    ladrilhar(plano(sub(b, a), ao, cima), ret(0, L, 0, alt), k, { escuro: 0.9 });
  }
  /* TELHADO DE QUATRO ÁGUAS no retângulo do beiral, com a cumeeira no
     sentido mais comprido e os quatro espigões */
  function telhado4(x0, x1, z0, z1, y, h, k, kCumeeira) {
    const w = x1 - x0, d = z1 - z0, cima = y + h;
    /* o espigão começa um palmo acima do beiral: a capa de telha que
       cobre a aresta termina ali, e não sai pela quina do telhado */
    const espigao = (p, q) => viga([lerp(p[0], q[0], 0.08), lerp(p[1], q[1], 0.08), lerp(p[2], q[2], 0.08)], q, 0.24, 0.12, kCumeeira);
    let planos;
    if (w <= d) {
      const xm = (x0 + x1) / 2, r0 = Math.min(z0 + w / 2, (z0 + z1) / 2), r1 = Math.max(z1 - w / 2, (z0 + z1) / 2);
      planos = [
        [[x0, y, z0], [x0, y, z1], [xm, cima, r1], [xm, cima, r0]],
        [[x1, y, z1], [x1, y, z0], [xm, cima, r0], [xm, cima, r1]],
        [[x0, y, z1], [x1, y, z1], [xm, cima, r1]],
        [[x1, y, z0], [x0, y, z0], [xm, cima, r0]]
      ];
      if (kCumeeira) {
        viga([xm, cima, r0], [xm, cima, r1], 0.26, 0.14, kCumeeira);
        for (const [cx, cz, rz] of [[x0, z0, r0], [x1, z0, r0], [x0, z1, r1], [x1, z1, r1]]) espigao([cx, y, cz], [xm, cima, rz]);
      }
    } else {
      const zm = (z0 + z1) / 2, r0 = Math.min(x0 + d / 2, (x0 + x1) / 2), r1 = Math.max(x1 - d / 2, (x0 + x1) / 2);
      planos = [
        [[x0, y, z1], [x1, y, z1], [r1, cima, zm], [r0, cima, zm]],
        [[x1, y, z0], [x0, y, z0], [r0, cima, zm], [r1, cima, zm]],
        [[x0, y, z0], [x0, y, z1], [r0, cima, zm]],
        [[x1, y, z1], [x1, y, z0], [r1, cima, zm]]
      ];
      if (kCumeeira) {
        viga([r0, cima, zm], [r1, cima, zm], 0.26, 0.14, kCumeeira);
        for (const [cx, cz, rx] of [[x0, z0, r0], [x0, z1, r0], [x1, z0, r1], [x1, z1, r1]]) espigao([cx, y, cz], [rx, cima, zm]);
      }
    }
    for (const pts of planos) aguaDeTelhado(pts, k);
  }
  /* uma água do telhado: o beiral (os dois primeiros pontos) é o eixo U,
     e V sobe pela água até a cumeeira */
  function aguaDeTelhado(pts, k) {
    const O = pts[0], U = unit(sub(pts[1], O));
    const topo = pts[2];
    const rel = sub(topo, O);
    const V = unit(sub(rel, esc(U, pe(rel, U))));
    const F = plano(O, U, V);
    ladrilhar(F, pts.map(p => { const r = sub(p, O); return [pe(r, U), pe(r, V)]; }), k);
  }
  return { cel, tri, poli, plano, noPlano, recuado, ladrilhar, esticar, ret, faces, caixa, fachada, modulos,
           paredes, tampa, torno, extrudar, viga, telhado4, aguaDeTelhado,
           get triangulos() { return pos.length / 9; }, pos, uv, cor, folha };
}

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

/* a mureta em volta de uma laje: face de fora (continua a parede), face
   de dentro e o capeamento em cima. `pts` é o piso, no mesmo sentido
   de sempre (frente-esquerda → frente-direita → fundo). */
function recuoPoligono(pts, d) {
  const n = pts.length, linhas = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const ux = q[0] - p[0], uz = q[1] - p[1], l = Math.hypot(ux, uz);
    const nx = uz / l, nz = -ux / l;                     // a normal pra dentro
    linhas.push([[p[0] + nx * d, p[1] + nz * d], [ux / l, uz / l]]);
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const [a, u] = linhas[(i + n - 1) % n], [b, v] = linhas[i];
    const det = u[0] * v[1] - u[1] * v[0];
    const t = det === 0 ? 0 : ((b[0] - a[0]) * v[1] - (b[1] - a[1]) * v[0]) / det;
    out.push([a[0] + u[0] * t, a[1] + u[1] * t]);
  }
  return out;
}
function mureta(B, pts, y, alt, esp, k) {
  B.paredes(pts, y, (F, len) => B.ladrilhar(F, B.ret(0, len, 0, alt), k));
  const dentro = recuoPoligono(pts, esp);
  B.paredes(dentro.slice().reverse(), y, (F, len) => B.ladrilhar(F, B.ret(0, len, 0, alt), k, { escuro: 0.85 }));
  const c = B.cel(k);
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const A = [pts[i][0], y + alt, pts[i][1]], Bq = [pts[j][0], y + alt, pts[j][1]];
    const C = [dentro[j][0], y + alt, dentro[j][1]], D = [dentro[i][0], y + alt, dentro[i][1]];
    B.poli([A, Bq, C, D], [[c[0], c[1]], [c[2], c[1]], [c[2], lerp(c[1], c[3], 0.1)], [c[0], lerp(c[1], c[3], 0.1)]]);
  }
}
/* um toldo inclinado: preso na parede em `yTopo`, caindo `queda` e
   avançando `sai` pra fora da face. O plano `F` é o da parede. */
function toldo(B, F, a0, a1, yTopo, sai, queda, k) {
  const O = B.noPlano(F, a0, yTopo - queda);
  const base = [O[0] + F.N[0] * sai, O[1], O[2] + F.N[2] * sai];
  const V = unit([-F.N[0] * sai, queda, -F.N[2] * sai]);
  const G = B.plano(base, F.U, V);
  B.esticar(G, 0, a1 - a0, 0, Math.hypot(sai, queda), k);
}
/* a condensadora do ar split pendurada na parede de plano `F` */
function arSplit(B, F, a, y) {
  const P = (da, dy, dn) => soma(B.noPlano(F, a + da, y + dy), esc(F.N, dn));
  const w = 0.84, h = 0.6, d = 0.3;
  const frente = B.plano(P(-w / 2, 0, d), F.U, F.V);
  B.esticar(frente, 0, w, 0, h, 'ar');
  B.esticar(B.plano(P(w / 2, 0, d), esc(F.N, -1), F.V), 0, d, 0, h, 'ar_lado');
  B.esticar(B.plano(P(-w / 2, 0, 0), F.N, F.V), 0, d, 0, h, 'ar_lado');
  B.esticar(B.plano(P(-w / 2, h, d), F.U, esc(F.N, -1)), 0, w, 0, d, 'ar_lado');
  B.esticar(B.plano(P(-w / 2, 0, 0), F.U, F.N), 0, w, 0, d, 'ar_lado', { escuro: 0.7 });
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
   A MONTAGEM: da planta pro mundo
   ======================================================= */
const MODELOS = {
  igreja: { folha: 'igreja', montar: igreja },
  predio: { folha: 'predio', montar: predio },
  loja:   { folha: 'loja',   montar: loja },
  adm:    { folha: 'adm',    montar: adm },
  casa:   { folha: 'casa',   montar: casa }
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
  for (const q of K.QUADRAS) {
    if (!q.equip || q.equip.tipo !== 'marco') continue;
    for (const pc of q.equip.pecas) {
      if (pc.k !== 'modelo' || !MODELOS[pc.modelo]) continue;
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
