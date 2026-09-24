/* =========================================================
   O CONSTRUTOR DE FACHADA — o que os marcos e as casas dividem
   ---------------------------------------------------------
   Junta triângulos em METROS, no referencial do prédio (x da esquerda
   pra direita de quem olha a fachada, y pra cima, z negativo entrando
   no terreno), com a UV apontando pra uma célula da folha de textura
   (`modelos_atlas.js`). Quem usa converte pro mundo no fim.

   O que ele sabe fazer: LADRILHAR uma face no tamanho de mundo da
   peça (recortando no contorno), ESTICAR uma peça num retângulo, a
   FACHADA com vãos (parede e janela nunca se sobrepõem), módulos em
   grade, caixas, tampas, telhado de quatro águas, torno, extrusão e
   viga. E PINTA: `pintar(cor)` multiplica a cor do vértice das peças
   seguintes — a parede clara da folha vira o sobrado verde ou o
   mercado azul, e a janela desenhada depois de `pintar(null)` não
   pega tinta nenhuma.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';
import { ATLAS } from './modelos_atlas.js';

export const METRO = 34 / 1.75;
export const lerp = (a, b, t) => a + (b - a) * t;
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const soma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const esc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const pv = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const pe = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const unit = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/* =======================================================
   O CONSTRUTOR — junta triângulos com a UV da folha
   ======================================================= */
export function Construtor(folha) {
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
  /* a tinta corrente, já no espaço linear (é nele que o three lê a cor
     do vértice) */
  let tinta = [1, 1, 1];
  const linear = new THREE.Color();
  function pintar(c) {
    if (!c) { tinta = [1, 1, 1]; return; }
    if (Array.isArray(c)) { tinta = c; return; }
    linear.set(c);
    tinta = [linear.r, linear.g, linear.b];
  }
  function tri(p, q, r, a, b, c, escuro) {
    pos.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2]);
    uv.push(a[0], a[1], b[0], b[1], c[0], c[1]);
    for (const v of [p, q, r]) {
      const t = tom(v[1]) * (escuro || 1);
      cor.push(t * tinta[0], t * tinta[1], t * tinta[2]);
    }
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
  /* `o.tinta` pinta só esta peça (a corrente volta no fim) */
  const comTinta = (o, fn) => {
    if (o.tinta === undefined) return fn();
    const antes = tinta; pintar(o.tinta); fn(); tinta = antes;
  };
  function ladrilhar(F, pol, k, o = {}) { comTinta(o, () => ladrilharJa(F, pol, k, o)); }
  function ladrilharJa(F, pol, k, o) {
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
  function esticar(F, a0, a1, b0, b1, k, o = {}) { comTinta(o, () => esticarJa(F, a0, a1, b0, b1, k, o)); }
  function esticarJa(F, a0, a1, b0, b1, k, o) {
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
    /* a TINTA é da parede (e do requadro, que é parede); a janela, a
       porta e a peça desenhada saem sem tinta nenhuma, a não ser que
       o vão peça a dele */
    const tParede = oParede.tinta === undefined ? tinta : oParede.tinta;
    const antes = tinta;
    const oP = Object.assign({}, oParede, { tinta: tParede });
    const xs = [...new Set([0, larg, ...vaos.flatMap(v => [v.a0, v.a1])])].filter(x => x >= 0 && x <= larg).sort((a, b) => a - b);
    const ys = [...new Set([0, alt, ...vaos.flatMap(v => [v.b0, v.b1])])].filter(y => y >= 0 && y <= alt).sort((a, b) => a - b);
    const noVao = (a, b) => vaos.some(v => a > v.a0 && a < v.a1 && b > v.b0 && b < v.b1);
    for (let j = 0; j < ys.length - 1; j++) {
      const b0 = ys[j], b1 = ys[j + 1], bm = (b0 + b1) / 2;
      let ini = null;
      for (let i = 0; i <= xs.length - 1; i++) {
        const livre = i < xs.length - 1 && !noVao((xs[i] + xs[i + 1]) / 2, bm);
        if (livre && ini === null) ini = xs[i];
        if (!livre && ini !== null) { ladrilhar(F, ret(ini, xs[i], b0, b1), parede, oP); ini = null; }
      }
    }
    for (const v of vaos) {
      const oV = Object.assign({}, v, { tinta: v.tinta === undefined ? null : v.tinta });
      if (v.modo === 'ladrilho') { ladrilhar(F, ret(v.a0, v.a1, v.b0, v.b1), v.k, oV); continue; }
      if (!v.fundo) { esticar(F, v.a0, v.a1, v.b0, v.b1, v.k, oV); continue; }
      const d = v.fundo, Fi = recuado(F, d), rq = v.requadro || parede;
      esticar(Fi, v.a0, v.a1, v.b0, v.b1, v.k, oV);
      const P = (a, b) => noPlano(F, a, b);
      const w = v.a1 - v.a0, tq = v.requadro ? null : tParede;
      /* O VÃO EM ARCO (`arco` = a flecha, em metros): a peça é um
         retângulo e o canto dela acima do arco tem de ser PAREDE — os
         dois cantos voltam em leque a partir da quina, e o intradorso
         (a volta do arco, de fora até o fundo) fecha o vão curvo. As
         laterais param na mola; a verga reta some. */
      const mola = v.arco ? v.b1 - v.arco : v.b1, h = mola - v.b0;
      ladrilhar(plano(P(v.a0, v.b0), esc(F.N, -1), F.V), ret(0, d, 0, h), rq, { escuro: 0.82, tinta: tq });
      ladrilhar(plano(soma(P(v.a1, v.b0), esc(F.N, -d)), F.N, F.V), ret(0, d, 0, h), rq, { escuro: 0.82, tinta: tq });
      if (!v.arco) ladrilhar(plano(soma(P(v.a0, v.b1), esc(F.N, -d)), F.U, F.N), ret(0, w, 0, d), rq, { escuro: 0.7, tinta: tq });
      ladrilhar(plano(P(v.a0, v.b0), F.U, esc(F.N, -1)), ret(0, w, 0, d), rq, { escuro: 0.95, tinta: tq });
      if (v.arco) {
        const am = (v.a0 + v.a1) / 2, rx = w / 2, N = 8, arc = [];
        for (let i = 0; i <= N; i++) { const t = Math.PI * i / N; arc.push([am + rx * Math.cos(t), mola + v.arco * Math.sin(t)]); }
        for (let i = 0; i < N; i++) {
          const quina = i < N / 2 ? [v.a1, v.b1] : [v.a0, v.b1];
          ladrilhar(F, [quina, arc[i], arc[i + 1]], parede, oP);
          const A0 = P(arc[i][0], arc[i][1]), A1 = P(arc[i + 1][0], arc[i + 1][1]);
          ladrilhar(plano(A0, unit(sub(A1, A0)), esc(F.N, -1)), ret(0, Math.hypot(...sub(A1, A0)), 0, d), rq,
                    { escuro: 0.76, tinta: tq });
        }
      }
    }
    tinta = antes;
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
           paredes, tampa, torno, extrudar, viga, telhado4, aguaDeTelhado, pintar,
           get triangulos() { return pos.length / 9; }, pos, uv, cor, folha };
}

/* a mureta em volta de uma laje: face de fora (continua a parede), face
   de dentro e o capeamento em cima. `pts` é o piso, no mesmo sentido
   de sempre (frente-esquerda → frente-direita → fundo). */
export function recuoPoligono(pts, d) {
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
export function mureta(B, pts, y, alt, esp, k) {
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
export function toldo(B, F, a0, a1, yTopo, sai, queda, k) {
  const O = B.noPlano(F, a0, yTopo - queda);
  const base = [O[0] + F.N[0] * sai, O[1], O[2] + F.N[2] * sai];
  const V = unit([-F.N[0] * sai, queda, -F.N[2] * sai]);
  const G = B.plano(base, F.U, V);
  B.esticar(G, 0, a1 - a0, 0, Math.hypot(sai, queda), k);
}
/* a condensadora do ar split pendurada na parede de plano `F` */
export function arSplit(B, F, a, y) {
  const P = (da, dy, dn) => soma(B.noPlano(F, a + da, y + dy), esc(F.N, dn));
  const w = 0.84, h = 0.6, d = 0.3;
  const frente = B.plano(P(-w / 2, 0, d), F.U, F.V);
  B.esticar(frente, 0, w, 0, h, 'ar');
  B.esticar(B.plano(P(w / 2, 0, d), esc(F.N, -1), F.V), 0, d, 0, h, 'ar_lado');
  B.esticar(B.plano(P(-w / 2, 0, 0), F.N, F.V), 0, d, 0, h, 'ar_lado');
  B.esticar(B.plano(P(-w / 2, h, d), F.U, esc(F.N, -1)), 0, w, 0, d, 'ar_lado');
  B.esticar(B.plano(P(-w / 2, 0, 0), F.U, F.N), 0, w, 0, d, 'ar_lado', { escuro: 0.7 });
}
