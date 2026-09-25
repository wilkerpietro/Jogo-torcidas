/* =========================================================
   AS ÁRVORES — o catálogo das árvores de todos os mapas do jogo
   ---------------------------------------------------------
   Cada praça tem a vegetação dela (`vegetacao` em dados/cidades.js:
   mata, cerrado ou caatinga), a cidade tem a árvore de rua e de praça, a
   praia tem o coqueiro e a amendoeira, e o Sul tem a araucária. As
   espécies (ESPECIES) e o que vai em cada lugar (FLORA):

     mata      jequitibá (a emergente, de sapopema), ingá, embaúba, açaí
     cerrado   pequizeiro, ipê-amarelo, buriti (a vereda)
     caatinga  catingueira (seca, só o galho), juazeiro (o verde da seca),
               mandacaru, xique-xique
     cidade    oiti, mangueira, ipê-amarelo, ipê-roxo, palmeira-imperial
     praia     coqueiro, amendoeira
     sul       araucária

   COMO A ÁRVORE É FEITA:
   - o TRONCO e o GALHO são um tubo varrido ao longo de uma curva
     (`varrer`), com a casca da espécie ladrilhada (a peça inteira a cada
     tanto de comprimento, e o anel levado de um ponto ao outro sem
     torcer);
   - a COPA é feita de CACHOS: quatro cartões recortados (três em pé,
     girados de 60°, e um deitado, pra copa não sumir vista de cima) com o
     desenho do cacho da espécie. A normal do cartão aponta pra fora da
     copa (do centro dela, puxada pra cima), e não pra onde o cartão
     olha: assim a copa inteira pega luz como um volume, o lado do sol
     claro e o de trás escuro, em vez do salpicado de cartão aceso e
     cartão apagado. O cartão sai nas duas faces (a folhagem só desenha a
     da frente), cada uma com a mesma normal de fora;
   - a PALMEIRA tem a FRONDE: uma fita que sai da coroa e cai com o peso,
     de corte em V (as duas metades levantadas), com o desenho da fronde
     deitado nela;
   - o CACTO é uma coluna de oito lados com a pele de costela.

   A SEMENTE decide a árvore: a mesma semente dá a mesma árvore; outra
   semente, a mesma espécie com outro galho, outra copa e outro tamanho
   (±12%). Uma mata de cem árvores sai com cem árvores diferentes.

   O que sai: a lista `vegetacao` (tronco, galho, cacto, coco — a folha de
   textura vegetacao.png, nas duas faces) e a lista `folhagem` (os
   cartões, com a normal própria). Em metros, em volta da origem, e
   `noMundo` põe no lugar.
   ========================================================= */
import { Construtor, METRO, sub, soma, esc, unit, pv, pe, noMundo } from './construtor3d.js';
import { ATLAS } from './modelos_atlas.js';

/* o sorteio de semente fixa (mulberry32) */
export function sorteio(semente) {
  let est = (semente >>> 0) || 1;
  const r = () => {
    est = (est + 0x6D2B79F5) >>> 0; let t = est;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.entre = (a, b) => a + r() * (b - a);
  return r;
}
const ALTO = [0, 1, 0];
const direcao = (az, el) => [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* =======================================================
   AS FERRAMENTAS
   ======================================================= */
function eixosDe(d) {
  let a = pv(d, ALTO);
  if (Math.hypot(...a) < 1e-4) a = pv(d, [1, 0, 0]);
  a = unit(a);
  return [a, unit(pv(d, a))];
}
/* VARRER: o tubo ao longo da polilinha `pts`, com o raio de cada ponto.
   A casca `k` dá `rep` voltas em u (uma por metro de volta, no mínimo
   uma) e, em v, a peça inteira a cada altura dela: onde a costura cai no
   meio de um trecho, entra um anel ali, e a UV nunca dá a volta dentro de
   um gomo. */
function varrer(C, pts, raios, lados, k, o = {}) {
  const c = C.cel(k), vPor = o.vPor || c[5];
  const P = [pts[0]], R = [raios[0]], S = [0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(...sub(b, a)), s0 = S[S.length - 1];
    if (L < 1e-5) continue;
    let prox = (Math.floor(s0 / vPor + 1e-6) + 1) * vPor;
    while (prox < s0 + L - 1e-4) {
      const t = (prox - s0) / L;
      P.push(soma(a, esc(sub(b, a), t))); R.push(raios[i - 1] + (raios[i] - raios[i - 1]) * t); S.push(prox);
      prox += vPor;
    }
    P.push(b); R.push(raios[i]); S.push(s0 + L);
  }
  const n = P.length;
  if (n < 2) return;
  const T = P.map((p, i) => unit(sub(P[Math.min(n - 1, i + 1)], P[Math.max(0, i - 1)])));
  let [a, b] = eixosDe(T[0]);
  const aneis = [];
  for (let i = 0; i < n; i++) {
    if (i) { const t = T[i]; a = unit(sub(a, esc(t, pe(a, t)))); b = unit(pv(t, a)); }
    aneis.push([a, b]);
  }
  const rMedio = R.reduce((x, y) => x + y, 0) / n;
  const rep = o.rep || Math.max(1, Math.round(2 * Math.PI * rMedio / c[4]));
  const porVolta = Math.max(1, Math.round(lados / rep)), L = porVolta * rep, giro = o.giro || 0;
  const noAnel = (i, t) => soma(P[i], soma(esc(aneis[i][0], R[i] * Math.cos(t)), esc(aneis[i][1], R[i] * Math.sin(t))));
  for (let i = 0; i < n - 1; i++) {
    const v0 = S[i] / vPor - Math.floor(S[i] / vPor + 1e-6), v1 = Math.min(1, v0 + (S[i + 1] - S[i]) / vPor);
    const V0 = c[1] + (c[3] - c[1]) * Math.max(0, v0), V1 = c[1] + (c[3] - c[1]) * v1;
    for (let j = 0; j < L; j++) {
      const t0 = giro + j / L * 2 * Math.PI, t1 = giro + (j + 1) / L * 2 * Math.PI;
      const f0 = (j % porVolta) / porVolta, f1 = (j % porVolta + 1) / porVolta;
      const U0 = c[0] + (c[2] - c[0]) * f0, U1 = c[0] + (c[2] - c[0]) * f1;
      C.poli([noAnel(i, t0), noAnel(i, t1), noAnel(i + 1, t1), noAnel(i + 1, t0)], [[U0, V0], [U1, V0], [U1, V1], [U0, V1]]);
    }
  }
}
/* o GALHO: a curva que sai de `origem` na direção `dir`, em `n` passos,
   tremendo e puxada pra `puxa` (pra cima, na maioria) */
function galho(origem, dir, comp, n, rnd, o = {}) {
  const pts = [origem];
  let d = unit(dir), p = origem;
  const w = o.treme === undefined ? 0.15 : o.treme;
  for (let i = 0; i < n; i++) {
    if (o.puxa) d = unit(soma(d, esc(o.puxa, o.forca || 0.15)));
    d = unit([d[0] + (rnd() - 0.5) * w, d[1] + (rnd() - 0.5) * w * 0.5, d[2] + (rnd() - 0.5) * w]);
    p = soma(p, esc(d, comp / n));
    pts.push(p);
  }
  return pts;
}
const afina = (pts, r0, r1) => pts.map((_, i) => r0 + (r1 - r0) * i / (pts.length - 1));
/* a ESFERA (o coco, a bola): um torno de poucos lados */
function esfera(C, c, r, k, lados = 6, aneis = 4) {
  const perfil = [];
  for (let i = 0; i <= aneis; i++) { const t = -Math.PI / 2 + i / aneis * Math.PI; perfil.push([Math.max(0.001, r * Math.cos(t)), c[1] + r * Math.sin(t)]); }
  C.torno(c[0], c[2], perfil, lados, k);
}

/* A FOLHAGEM: os cartões com a normal de fora. `cartao` põe um retângulo
   (centro p, eixos U e V unitários) com a peça `k`; a normal de cada
   canto sai do `centro` da copa, puxada pra cima; o tom escurece embaixo
   e no miolo (a oclusão que o Lambert não dá). Sai nas duas faces. */
export function Folhagem(folha = 'vegetacao') {
  const A = ATLAS[folha];
  const pos = [], uv = [], cor = [], nor = [];
  const cel = k => { const c = A.cel[k]; if (!c) throw new Error(`arvores3d: a folha "${folha}" não tem a peça "${k}"`); return c; };
  function tri(P, T, N, K, i, j, k) {
    for (const q of [i, j, k]) { pos.push(...P[q]); uv.push(...T[q]); nor.push(...N[q]); cor.push(...K[q]); }
  }
  /* o quadrilátero nas duas faces: `N` e `Nv` (a normal da frente e a do
     verso), `T` e `Tv` (a UV de cada face) */
  function quad(P, T, N, K, Tv, Nv) {
    tri(P, T, N, K, 0, 1, 2); tri(P, T, N, K, 0, 2, 3);
    tri(P, Tv || T, Nv || N, K, 0, 2, 1); tri(P, Tv || T, Nv || N, K, 0, 3, 2);
  }
  const uvDe = (k, parte) => {
    const c = cel(k), [f0, f1, g0, g1] = parte || [0, 1, 0, 1];
    const U0 = c[0] + (c[2] - c[0]) * f0, U1 = c[0] + (c[2] - c[0]) * f1, V0 = c[1] + (c[3] - c[1]) * g0, V1 = c[1] + (c[3] - c[1]) * g1;
    return [[U0, V0], [U1, V0], [U1, V1], [U0, V1]];
  };
  /* `copa`: { c: centro, R, Ry } pra normal e pra sombra; `tom`: a cor */
  function cartao(p, U, V, w, h, k, copa, o = {}) {
    const P = [soma(p, soma(esc(U, -w / 2), esc(V, -h / 2))), soma(p, soma(esc(U, w / 2), esc(V, -h / 2))),
               soma(p, soma(esc(U, w / 2), esc(V, h / 2))), soma(p, soma(esc(U, -w / 2), esc(V, h / 2)))];
    const tom = o.tom || [1, 1, 1];
    const N = P.map(q => unit(soma(sub(q, copa.c), [0, copa.Ry * 0.6 + 0.3, 0])));
    const K = P.map(q => {
      const baixo = clamp((q[1] - (copa.c[1] - copa.Ry)) / (2 * copa.Ry), 0, 1);
      const fora = clamp(Math.hypot(q[0] - copa.c[0], q[2] - copa.c[2]) / Math.max(0.5, copa.R), 0, 1);
      const ao = (0.5 + 0.5 * baixo) * (0.78 + 0.22 * fora);
      return [tom[0] * ao, tom[1] * ao, tom[2] * ao];
    });
    quad(P, uvDe(k, o.parte), N, K, o.parteVerso ? uvDe(k, o.parteVerso) : null);
  }
  return { pos, uv, cor, nor, cel, quad, cartao, uvDe, folha };
}
/* o CACHO: três cartões em pé girados de 60° (inclinados um pouco) e um
   deitado. `deitado` (a amendoeira, a araucária no alto) deita mais os
   três; `semTampa` tira o de cima (o galho seco, o tufo em pé). */
function cacho(F, p, s, k, copa, rnd, o = {}) {
  const giro = rnd() * Math.PI, inc = o.deitado ? 0.9 : 0.35;
  const tom = o.tom || [1, 1, 1];
  const t = [tom[0] * rnd.entre(0.88, 1.08), tom[1] * rnd.entre(0.88, 1.08), tom[2] * rnd.entre(0.88, 1.08)];
  for (let i = 0; i < 3; i++) {
    const a = giro + i * Math.PI / 3;
    const U = [Math.cos(a), 0, Math.sin(a)];
    const w = [-Math.sin(a), 0, Math.cos(a)];
    const V = unit(soma([0, Math.cos(inc * rnd.entre(0.4, 1)), 0], esc(w, Math.sin(inc * rnd.entre(-1, 1)))));
    F.cartao(p, U, V, s, s, k, copa, { tom: t });
  }
  if (!o.semTampa) {
    const a = giro + Math.PI / 6;
    F.cartao(soma(p, [0, s * 0.12, 0]), [Math.cos(a), 0, Math.sin(a)], unit([-Math.sin(a), (rnd() - 0.5) * 0.3, Math.cos(a)]), s, s, k, copa, { tom: t });
  }
}
/* a FRONDE da palmeira: a fita de `base` na direção `dir` (com a subida
   do começo), comprimento `L`, largura `larg`, caindo `caida` na ponta;
   o corte em V levanta as duas metades de `v` radianos. A normal é a do
   plano de cada metade (pra cima na frente, pra baixo no verso). */
function fronde(F, base, dir, L, larg, caida, k, o = {}) {
  const N = 8, pts = [];
  const d = unit(dir);
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push(soma(soma(base, esc(d, L * t)), [0, -caida * L * t * t, 0])); }
  const v = o.v === undefined ? 0.35 : o.v, c = F.cel(k), tom = o.tom || [1, 1, 1];
  const perfil = t => (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.15))) * (1 - 0.55 * t * t);
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N;
    const tg0 = unit(sub(pts[Math.min(N, i + 1)], pts[Math.max(0, i - 1)])), tg1 = unit(sub(pts[Math.min(N, i + 2)], pts[i]));
    const lado = tg => { let l = pv(tg, ALTO); if (Math.hypot(...l) < 1e-4) l = [1, 0, 0]; return unit(l); };
    const l0 = lado(tg0), l1 = lado(tg1);
    const up0 = unit(pv(l0, tg0)), up1 = unit(pv(l1, tg1));
    const borda = (p, l, up, tg, s, t) => soma(p, soma(esc(l, s * larg / 2 * perfil(t) * Math.cos(v)), esc(up, larg / 2 * perfil(t) * Math.sin(v))));
    const V0 = c[1] + (c[3] - c[1]) * t0, V1 = c[1] + (c[3] - c[1]) * t1, Um = (c[0] + c[2]) / 2;
    const ao0 = 0.75 + 0.25 * t0, ao1 = 0.75 + 0.25 * t1;
    for (const s of [-1, 1]) {
      const P = [pts[i], pts[i + 1], borda(pts[i + 1], l1, up1, tg1, s, t1), borda(pts[i], l0, up0, tg0, s, t0)];
      const Ue = s < 0 ? c[0] : c[2];
      const T = [[Um, V0], [Um, V1], [Ue, V1], [Ue, V0]];
      const nf = unit(pv(sub(P[1], P[0]), sub(P[3], P[0])));
      const n = nf[1] < 0 ? esc(nf, -1) : nf, nv = esc(n, -1);
      const K = [ao0, ao1, ao1, ao0].map(a => [tom[0] * a, tom[1] * a, tom[2] * a]);
      /* a frente olha pra cima: a ordem do quadrilátero segue a normal */
      const P2 = nf[1] < 0 ? [P[0], P[3], P[2], P[1]] : P, T2 = nf[1] < 0 ? [T[0], T[3], T[2], T[1]] : T;
      F.quad(P2, T2, [n, n, n, n], K, T2.slice(), [nv, nv, nv, nv]);
    }
  }
  return pts[N];
}

/* =======================================================
   AS FORMAS
   ======================================================= */
/* A FOLHOSA: o tronco, os galhos-mestres saindo do topo dele (abertos de
   `abertura` sobre a horizontal), os galhos de ponta, e os cachos nas
   pontas e espalhados na casca do elipsoide da copa (do topo até
   `cobre` da altura dele). */
function folhosa(x, p) {
  const { B, F, rnd, f } = x;
  const ht = p.fuste * f, r0 = p.raio * f;
  const incl = p.inclina || 0.05;
  const tronco = galho([0, 0, 0], [rnd.entre(-incl, incl), 1, rnd.entre(-incl, incl)], ht, 4, rnd, { treme: p.torto || 0.06, puxa: ALTO, forca: 0.05 });
  B.pintar(p.tinta || null);
  varrer(B, tronco, afina(tronco, r0, r0 * 0.72), 10, p.casca);
  const topo = tronco[tronco.length - 1];
  const R = p.copa * f, Ry = R * p.achatado;
  const centro = soma(topo, [0, Ry * p.subida, 0]);
  const copa = { c: centro, R, Ry };
  const pontas = [];
  for (let i = 0; i < p.galhos; i++) {
    const az = (i + rnd() * 0.7) / p.galhos * 2 * Math.PI, el = p.abertura + rnd.entre(-0.15, 0.15);
    const comp = R * rnd.entre(0.55, 0.8) / Math.max(0.35, Math.cos(el));
    const base = tronco[Math.max(1, tronco.length - 1 - (i % 2))];
    const g = galho(base, direcao(az, el), comp, 3, rnd, { treme: 0.22, puxa: ALTO, forca: p.sobe || 0.06 });
    varrer(B, g, afina(g, r0 * 0.55, r0 * 0.14), 7, p.casca);
    pontas.push(g[g.length - 1]);
    for (let s = 0; s < p.ramos; s++) {
      const b2 = g[1 + Math.floor(rnd() * (g.length - 1))];
      const g2 = galho(b2, direcao(az + rnd.entre(-1, 1), el + rnd.entre(-0.25, 0.35)), comp * rnd.entre(0.35, 0.55), 2, rnd, { treme: 0.3 });
      varrer(B, g2, afina(g2, r0 * 0.2, r0 * 0.05), 5, p.casca);
      pontas.push(g2[g2.length - 1]);
    }
  }
  B.pintar(null);
  const s = p.cacho * f;
  for (const q of pontas) cacho(F, q, s * rnd.entre(0.85, 1.15), p.folha, copa, rnd, { deitado: p.deitado, tom: p.tom });
  /* a casca da copa na espiral de Fibonacci (o espaço entre um cacho e
     outro quase igual: o sorteio puro juntava uns e abria buraco), com um
     tremor pra não ficar regular */
  const giroF = rnd() * 6.28;
  for (let i = 0; i < p.cachos; i++) {
    const z = 1 - 2 * p.cobre * (i + 0.5) / p.cachos, th = giroF + i * 2.39996 + rnd.entre(-0.25, 0.25);
    const ph = Math.acos(clamp(z + rnd.entre(-0.06, 0.06), -1, 1)), rr = rnd.entre(0.68, 0.95);
    const q = [centro[0] + R * rr * Math.sin(ph) * Math.cos(th), centro[1] + Ry * rr * Math.cos(ph), centro[2] + R * rr * Math.sin(ph) * Math.sin(th)];
    cacho(F, q, s * rnd.entre(0.8, 1.2), p.folha, copa, rnd, { deitado: p.deitado, tom: p.tom });
  }
  /* o alto do miolo: sem ele, a copa de casca sai com um buraco no topo */
  for (let i = 0; i < 3; i++) {
    const q = soma(centro, [rnd.entre(-0.3, 0.3) * R, Ry * rnd.entre(0.45, 0.8), rnd.entre(-0.3, 0.3) * R]);
    cacho(F, q, s * rnd.entre(0.95, 1.2), p.folha, copa, rnd, { deitado: p.deitado, tom: p.tom });
  }
  return { tronco, topo, copa };
}

/* a SAPOPEMA do jequitibá: a raiz-tábua que sobe pelo tronco */
function sapopemas(B, r0, alt, n, rnd, k) {
  const c = B.cel(k);
  for (let i = 0; i < n; i++) {
    const az = (i + rnd() * 0.5) / n * 2 * Math.PI, d = [Math.cos(az), 0, Math.sin(az)];
    const sai = rnd.entre(1.1, 1.8), sobe = alt * rnd.entre(0.8, 1.1);
    const P = [esc(d, r0 * 0.8), esc(d, r0 + sai), soma(esc(d, r0 * 0.9), [0, sobe, 0])];
    B.poli(P, [[c[0], c[1]], [c[2], c[1]], [c[0], c[3]]]);
  }
}

/* A PALMEIRA: o tronco (reto ou deitado e subindo), a coroa, as frondes
   em duas voltas (as de cima mais em pé, as de baixo caindo), e o que a
   espécie tem: palmito, coco, a saia seca */
function palmeira(x, p) {
  const { B, F, rnd, f } = x;
  const H = p.altura * f, az = rnd() * 2 * Math.PI, incl = (p.inclina || 0) * rnd.entre(0.6, 1.2);
  const n = 9, pts = [], raios = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, desvio = incl * H * (1.2 * t - 0.45 * t * t);
    pts.push([Math.cos(az) * desvio + (rnd() - 0.5) * 0.04, H * t, Math.sin(az) * desvio + (rnd() - 0.5) * 0.04]);
    const inchaco = p.barriga ? 1 + p.barriga * Math.sin(Math.PI * clamp(t * 1.6, 0, 1)) : 1;
    raios.push(p.raio * f * (1 + 0.55 * (1 - t) ** 8) * (1 - 0.22 * t) * inchaco);
  }
  B.pintar(p.tinta || null);
  varrer(B, pts, raios, 10, p.casca);
  B.pintar(null);
  let topo = pts[n];
  if (p.palmito) {
    const alto = soma(topo, [0, p.palmito * f, 0]);
    B.pintar(p.tintaPalmito || null);
    varrer(B, [topo, alto], [raios[n] * 1.05, raios[n] * 0.8], 10, 'palmito');
    B.pintar(null);
    topo = alto;
  }
  /* a coroa: o bulbo de onde as frondes saem */
  B.pintar('#7a6a48');
  esfera(B, topo, raios[n] * 1.4, p.casca, 8, 4);
  B.pintar(null);
  const copa = { c: soma(topo, [0, 0.4, 0]), R: p.fronde * f, Ry: p.fronde * f * 0.5 };
  for (let i = 0; i < p.frondes; i++) {
    const volta = i % 2, a = (i + rnd() * 0.4) / p.frondes * 2 * Math.PI + volta * 0.3;
    const el = volta ? rnd.entre(-0.15, 0.25) : rnd.entre(0.35, 0.8);
    const L = p.fronde * f * rnd.entre(0.85, 1.1) * (volta ? 1 : 0.9);
    fronde(F, soma(topo, [0, rnd.entre(-0.1, 0.25), 0]), direcao(a, el), L, p.larg, p.caida * (volta ? 1.2 : 0.8), p.folha,
           { v: p.v, tom: [rnd.entre(0.9, 1.05), rnd.entre(0.92, 1.05), rnd.entre(0.9, 1)] });
  }
  if (p.secas) for (let i = 0; i < p.secas; i++) {
    const a = rnd() * 2 * Math.PI;
    fronde(F, soma(topo, [0, -0.25, 0]), direcao(a, -1.15 + rnd() * 0.3), p.fronde * f * 0.6, 1.0, 0.1, 'saia_seca', { v: 0.2 });
  }
  if (p.cocos) {
    B.pintar(null);
    for (let i = 0; i < p.cocos; i++) {
      const a = rnd() * 2 * Math.PI, r = raios[n] * 1.5 + rnd() * 0.15;
      esfera(B, soma(topo, [Math.cos(a) * r, -0.35 - rnd() * 0.3, Math.sin(a) * r]), 0.12 + rnd() * 0.03, 'coco', 6, 4);
    }
  }
  return { topo, copa };
}

/* o CACTO: a coluna (8 lados, a pele de costela) ao longo de uma curva */
function coluna(B, pts, r, tinta) {
  B.pintar(tinta || null);
  varrer(B, pts, pts.map((_, i) => i === pts.length - 1 ? r * 0.55 : r), 8, 'mandacaru', { rep: 1 });
  B.pintar(null);
}
/* o braço do cacto: sai da coluna na horizontal, faz o cotovelo e sobe */
function braco(origem, az, sai, sobe) {
  const d = [Math.cos(az), 0, Math.sin(az)], pts = [origem];
  for (let i = 1; i <= 4; i++) { const t = i / 4, a = t * Math.PI / 2; pts.push(soma(origem, soma(esc(d, sai * Math.sin(a)), [0, sai * (1 - Math.cos(a)) * 0.9, 0]))); }
  const cot = pts[pts.length - 1];
  for (let i = 1; i <= 3; i++) pts.push(soma(cot, [0, sobe * i / 3, 0]));
  return pts;
}

/* =======================================================
   AS ESPÉCIES
   ======================================================= */
const FOLHOSAS = {
  oiti: { fuste: 2.4, raio: 0.21, copa: 3.2, achatado: 0.78, subida: 0.55, galhos: 5, abertura: 0.8, ramos: 2, cacho: 1.9, cachos: 26, cobre: 0.85,
          folha: 'cacho_cidade', casca: 'casca_rugosa', tinta: '#d8d2cc' },
  mangueira: { fuste: 2.2, raio: 0.42, copa: 4.8, achatado: 0.7, subida: 0.75, galhos: 6, abertura: 0.55, ramos: 2, cacho: 2.4, cachos: 38, cobre: 0.7,
               folha: 'cacho_manga', casca: 'casca_rugosa', tinta: '#bdb2a8' },
  inga: { fuste: 3.4, raio: 0.26, copa: 4.2, achatado: 0.55, subida: 0.8, galhos: 5, abertura: 0.5, ramos: 3, cacho: 2.2, cachos: 26, cobre: 0.58,
          folha: 'cacho_mata', casca: 'casca_lisa' },
  juazeiro: { fuste: 1.6, raio: 0.3, copa: 3.4, achatado: 0.7, subida: 0.7, galhos: 5, abertura: 0.55, ramos: 2, cacho: 2.0, cachos: 28, cobre: 0.66,
              folha: 'cacho_juazeiro', casca: 'casca_rugosa', tinta: '#cfc4b8', torto: 0.2 },
  pequizeiro: { fuste: 2.3, raio: 0.25, inclina: 0.3, torto: 0.45, copa: 2.8, achatado: 0.5, subida: 0.85, galhos: 4, abertura: 0.45, ramos: 2, cacho: 1.8,
                cachos: 9, cobre: 0.5, folha: 'cacho_cerrado', casca: 'casca_cortica' },
  jequitiba: { fuste: 14, raio: 0.62, copa: 7.0, achatado: 0.36, subida: 0.35, galhos: 6, abertura: 0.55, ramos: 3, cacho: 3.0, cachos: 46, cobre: 0.62,
               folha: 'cacho_jequitiba', casca: 'casca_rugosa', tinta: '#c9beb4', sobe: 0.03 },
  ipe_amarelo: { fuste: 2.6, raio: 0.22, copa: 3.7, achatado: 0.6, subida: 0.75, galhos: 5, abertura: 0.95, ramos: 2, cacho: 1.8, cachos: 15, cobre: 0.55,
                 folha: 'flor_ipe_amarelo', casca: 'casca_rugosa', tinta: '#b4aca2' },
  ipe_roxo: { fuste: 2.6, raio: 0.22, copa: 3.7, achatado: 0.6, subida: 0.75, galhos: 5, abertura: 0.95, ramos: 2, cacho: 1.8, cachos: 15, cobre: 0.55,
              folha: 'flor_ipe_roxo', casca: 'casca_rugosa', tinta: '#b4aca2' }
};

const FORMAS = {
  ...Object.fromEntries(Object.entries(FOLHOSAS).map(([k, p]) => [k, x => {
    const r = folhosa(x, p);
    if (k === 'jequitiba') { x.B.pintar(p.tinta); sapopemas(x.B, p.raio * x.f, 2.2 * x.f, 5, x.rnd, p.casca); x.B.pintar(null); }
    return r;
  }])),

  /* a AMENDOEIRA: o galho em andares deitados (a árvore-pagode da praia) */
  amendoeira(x) {
    const { B, F, rnd, f } = x;
    const H = 8.5 * f;
    const tronco = galho([0, 0, 0], [rnd.entre(-0.08, 0.08), 1, rnd.entre(-0.08, 0.08)], H * 0.85, 5, rnd, { treme: 0.05 });
    B.pintar('#a39a90');
    varrer(B, tronco, afina(tronco, 0.24 * f, 0.1 * f), 9, 'casca_lisa');
    const andares = [[0.32, 3.6], [0.55, 2.8], [0.78, 1.9]];
    const copa = { c: [0, H * 0.6, 0], R: 3.6 * f, Ry: H * 0.35 };
    const s = 1.7 * f;
    for (const [h, comp] of andares) {
      const y = H * h, base = tronco.reduce((m, q) => Math.abs(q[1] - y) < Math.abs(m[1] - y) ? q : m);
      const n = 5, giro = rnd() * 6.28;
      for (let i = 0; i < n; i++) {
        const az = giro + (i + rnd() * 0.5) / n * 2 * Math.PI;
        const g = galho(base, direcao(az, rnd.entre(0.02, 0.18)), comp * f * rnd.entre(0.85, 1.1), 3, rnd, { treme: 0.12 });
        varrer(B, g, afina(g, 0.09 * f, 0.03 * f), 6, 'casca_lisa');
        for (let j = 1; j < g.length; j++) cacho(F, soma(g[j], [0, 0.15, 0]), s * rnd.entre(0.8, 1.15), 'cacho_amendoeira', copa, rnd, { deitado: true });
      }
    }
    cacho(F, soma(tronco[tronco.length - 1], [0, 0.3, 0]), s, 'cacho_amendoeira', copa, rnd, { deitado: true });
    B.pintar(null);
  },

  /* a EMBAÚBA: o tronco fino e branco de anel, o candelabro no alto e a
     roseta de folha de mão na ponta de cada braço (verde em cima,
     prateada embaixo) */
  embauba(x) {
    const { B, F, rnd, f } = x;
    const H = 8.5 * f;
    const tronco = galho([0, 0, 0], [rnd.entre(-0.1, 0.1), 1, rnd.entre(-0.1, 0.1)], H * 0.72, 5, rnd, { treme: 0.05 });
    varrer(B, tronco, afina(tronco, 0.14 * f, 0.09 * f), 8, 'casca_branca');
    const topo = tronco[tronco.length - 1];
    const copa = { c: soma(topo, [0, 1.2 * f, 0]), R: 2.6 * f, Ry: 1.2 * f };
    const n = 3 + Math.floor(rnd() * 2), giro = rnd() * 6.28;
    for (let i = 0; i < n; i++) {
      const az = giro + i / n * 2 * Math.PI;
      const g = galho(topo, direcao(az, 0.45), 1.1 * f, 2, rnd, { treme: 0.1, puxa: ALTO, forca: 0.45 });
      const g2 = galho(g[g.length - 1], ALTO, rnd.entre(0.8, 1.6) * f, 2, rnd, { treme: 0.1 });
      const tudo = g.concat(g2.slice(1));
      varrer(B, tudo, afina(tudo, 0.08 * f, 0.04 * f), 6, 'casca_branca');
      const ponta = tudo[tudo.length - 1];
      const m = 8, g0 = rnd() * 6.28;
      for (let j = 0; j < m; j++) {
        const a = g0 + j / m * 2 * Math.PI, rad = [Math.cos(a), 0, Math.sin(a)];
        const V = unit(soma(rad, [0, -0.45, 0])), U = [-Math.sin(a), 0, Math.cos(a)];
        const w = rnd.entre(1.3, 1.65) * f;
        F.cartao(soma(ponta, soma(esc(rad, w * 0.52), [0, -0.15 * f, 0])), U, V, w, w, 'folha_embauba', copa,
                 { parte: [0, 0.5, 0, 1], parteVerso: [0.5, 1, 0, 1] });
      }
    }
  },

  /* a CATINGUEIRA na seca: dois ou três caules tortos da base, a
     forquilha, e na ponta o galho fino sem folha */
  catingueira(x) {
    const { B, F, rnd, f } = x;
    const copa = { c: [0, 3.6 * f, 0], R: 2.8 * f, Ry: 1.8 * f };
    const n = 2 + Math.floor(rnd() * 2);
    for (let i = 0; i < n; i++) {
      const az = rnd() * 6.28;
      const c1 = galho([0, 0, 0], direcao(az, rnd.entre(1.05, 1.3)), rnd.entre(2.0, 2.8) * f, 3, rnd, { treme: 0.35 });
      varrer(B, c1, afina(c1, 0.13 * f, 0.07 * f), 7, 'casca_seca');
      const topo = c1[c1.length - 1];
      for (let j = 0; j < 3; j++) {
        const g = galho(topo, direcao(az + rnd.entre(-1.2, 1.2), rnd.entre(0.55, 1.0)), rnd.entre(1.2, 1.9) * f, 2, rnd, { treme: 0.35 });
        varrer(B, g, afina(g, 0.06 * f, 0.02 * f), 5, 'casca_seca');
        cacho(F, soma(g[g.length - 1], [0, 0.35 * f, 0]), rnd.entre(1.9, 2.4) * f, 'galhos_secos', copa, rnd, { semTampa: true });
      }
    }
  },

  /* o MANDACARU: o pé lenhoso, a coluna e os braços em candelabro */
  mandacaru(x) {
    const { B, rnd, f } = x;
    const H = rnd.entre(4.2, 5.6) * f;
    B.pintar('#8a8070');
    varrer(B, [[0, 0, 0], [0, 0.8 * f, 0]], [0.2 * f, 0.17 * f], 8, 'casca_seca');
    B.pintar(null);
    coluna(B, [[0, 0.7 * f, 0], [0.02, H * 0.5, 0.01], [0, H, 0], [0, H + 0.12 * f, 0]], 0.15 * f);
    const n = 4 + Math.floor(rnd() * 3), giro = rnd() * 6.28;
    for (let i = 0; i < n; i++) {
      const az = giro + (i + rnd() * 0.5) / n * 2 * Math.PI, y = rnd.entre(1.2, 2.6) * f;
      coluna(B, braco([Math.cos(az) * 0.1 * f, y, Math.sin(az) * 0.1 * f], az, rnd.entre(0.35, 0.6) * f, rnd.entre(1.2, H - y - 0.3)), 0.12 * f);
    }
  },

  /* o XIQUE-XIQUE: o cacto rasteiro, braço que deita no chão e levanta */
  xiquexique(x) {
    const { B, rnd, f } = x;
    const n = 7 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const az = rnd() * 6.28, o = [Math.cos(az) * 0.1, 0.05, Math.sin(az) * 0.1];
      const sai = rnd.entre(0.35, 0.9) * f;
      const pts = [o];
      for (let j = 1; j <= 3; j++) pts.push(soma(o, [Math.cos(az) * sai * j / 3, 0.06 * j, Math.sin(az) * sai * j / 3]));
      const fim = pts[pts.length - 1];
      for (let j = 1; j <= 3; j++) pts.push(soma(fim, [Math.cos(az) * 0.08 * j, rnd.entre(0.35, 0.9) * f * j / 3, Math.sin(az) * 0.08 * j]));
      coluna(B, pts, 0.07 * f, '#9cb8a8');
    }
  },

  /* o COQUEIRO: deitado, a ponta subindo, a fronde de 4,5 m, o cacho de
     coco e uma folha seca pendurada */
  coqueiro: x => palmeira(x, { altura: 11, raio: 0.19, inclina: 0.22, casca: 'casca_aneis', frondes: 18, fronde: 4.4, larg: 1.3, caida: 0.55,
                                folha: 'fronde_coqueiro', cocos: 9, secas: 2, v: 0.4 }),
  /* a PALMEIRA-IMPERIAL: reta, cinza de cimento, a barriga no primeiro
     terço e o palmito verde de 2 m */
  imperial: x => palmeira(x, { altura: 15, raio: 0.26, barriga: 0.12, casca: 'casca_palmeira', tinta: '#c9c6bf', palmito: 2.2, frondes: 16,
                                fronde: 5.6, larg: 1.5, caida: 0.45, folha: 'fronde_imperial', v: 0.45 }),
  /* o AÇAÍ: a touceira de caule fino, cada um com o palmito e a fronde
     caída */
  acai(x) {
    const { rnd, f } = x;
    const n = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const az = i / n * 6.28 + rnd(), d = [Math.cos(az) * 0.3, 0, Math.sin(az) * 0.3];
      const sub2 = { ...x, B: x.B, F: x.F, f: f * rnd.entre(0.75, 1.05) };
      const antes = x.B.pos.length, antesF = x.F.pos.length;
      palmeira(sub2, { altura: 9.5, raio: 0.075, inclina: 0.08, casca: 'casca_aneis', tinta: '#a8a296', palmito: 1.1, tintaPalmito: '#b88a6a',
                       frondes: 9, fronde: 2.7, larg: 1.1, caida: 0.95, folha: 'fronde_acai', v: 0.15 });
      /* cada caule sai do seu lugar na touceira */
      for (let k = antes; k < x.B.pos.length; k += 3) { x.B.pos[k] += d[0]; x.B.pos[k + 2] += d[2]; }
      for (let k = antesF; k < x.F.pos.length; k += 3) { x.F.pos[k] += d[0]; x.F.pos[k + 2] += d[2]; }
    }
  },
  /* o BURITI: o tronco reto e grosso, o leque na ponta do pecíolo e a
     saia de folha seca embaixo da coroa */
  buriti(x) {
    const { B, F, rnd, f } = x;
    const H = 12.5 * f;
    const pts = [[0, 0, 0], [0.02, H * 0.5, 0], [0, H, 0.02]];
    B.pintar('#9a948a');
    varrer(B, pts, [0.32 * f, 0.28 * f, 0.26 * f], 10, 'casca_palmeira');
    const topo = pts[2];
    const copa = { c: soma(topo, [0, 1.6 * f, 0]), R: 3.4 * f, Ry: 2.2 * f };
    const n = 14;
    for (let i = 0; i < n; i++) {
      const az = (i + rnd() * 0.5) / n * 2 * Math.PI, el = rnd.entre(0.25, 1.15);
      const d = direcao(az, el), L = rnd.entre(2.0, 2.8) * f;
      const fim = soma(topo, esc(d, L));
      B.pintar('#8f8a5a');
      varrer(B, [topo, soma(topo, esc(d, L * 0.5)), fim], [0.06 * f, 0.045 * f, 0.03 * f], 5, 'casca_palmeira');
      /* o leque de frente pro pecíolo */
      const U = unit(pv(d, ALTO)), V = unit(pv(U, d));
      const w = rnd.entre(2.2, 2.7) * f;
      F.cartao(soma(fim, esc(d, 0.15)), U, V, w, w, 'leque_buriti', copa, { tom: [rnd.entre(0.9, 1.05), 1, rnd.entre(0.9, 1)] });
    }
    B.pintar(null);
    for (let i = 0; i < 9; i++) {
      const az = i / 9 * 6.28 + rnd() * 0.4;
      fronde(F, soma(topo, [0, -0.1, 0]), direcao(az, -1.25 + rnd() * 0.2), 2.4 * f, 1.1, 0.05, 'saia_seca', { v: 0.1 });
    }
  },
  /* a ARAUCÁRIA: o tronco nu e reto, e só no alto os andares de galho que
     saem deitados e levantam na ponta (o candelabro), com o tufo em pé */
  araucaria(x) {
    const { B, F, rnd, f } = x;
    const H = 17 * f;
    const tronco = galho([0, 0, 0], [rnd.entre(-0.03, 0.03), 1, rnd.entre(-0.03, 0.03)], H, 6, rnd, { treme: 0.02 });
    varrer(B, tronco, afina(tronco, 0.42 * f, 0.14 * f), 10, 'casca_escamas');
    const copa = { c: [0, H * 0.9, 0], R: 4.6 * f, Ry: 2.2 * f };
    const andares = 5;
    for (let a = 0; a < andares; a++) {
      const y = H * (0.62 + a * 0.085), base = [tronco[0][0], y, tronco[0][2]];
      const comp = (4.6 - a * 0.7) * f, n = 6, giro = rnd() * 6.28;
      for (let i = 0; i < n; i++) {
        const az = giro + (i + rnd() * 0.4) / n * 2 * Math.PI;
        const d = direcao(az, -0.05), pts = [base];
        for (let j = 1; j <= 4; j++) {
          const t = j / 4, sobe = t > 0.6 ? (t - 0.6) * comp * 0.9 : 0;
          pts.push(soma(base, soma(esc(d, comp * t), [0, sobe - 0.1 * t, 0])));
        }
        B.pintar('#8a6a55');
        varrer(B, pts, afina(pts, 0.07 * f, 0.03 * f), 5, 'casca_escamas');
        B.pintar(null);
        const ponta = pts[pts.length - 1];
        cacho(F, soma(ponta, [0, 0.6 * f, 0]), rnd.entre(1.9, 2.3) * f, 'tufo_araucaria', copa, rnd, { deitado: true });
        cacho(F, soma(pts[2], [0, 0.45 * f, 0]), rnd.entre(1.3, 1.6) * f, 'tufo_araucaria', copa, rnd, { semTampa: true });
      }
    }
    cacho(F, soma(tronco[tronco.length - 1], [0, 0.6 * f, 0]), 2.0 * f, 'tufo_araucaria', copa, rnd, { deitado: true });
  }
};

/* =======================================================
   O CATÁLOGO
   ======================================================= */
export const ESPECIES = {
  jequitiba: { nome: 'Jequitibá', grupo: 'mata', nota: 'A emergente da mata: o fuste reto de 14 m com a sapopema no pé e a copa larga em guarda-chuva por cima de todas.' },
  inga: { nome: 'Ingá', grupo: 'mata', nota: 'A árvore média da mata e da beira de rio: o tronco claro e a copa larga e irregular.' },
  embauba: { nome: 'Embaúba', grupo: 'mata', nota: 'A pioneira da beira da mata e da estrada: o tronco branco de anel, o candelabro e a folha de mão, verde em cima e prateada embaixo.' },
  acai: { nome: 'Açaí', grupo: 'mata', nota: 'A touceira da mata do Norte: três a cinco caules finos, cada um com o palmito avermelhado e a fronde caída.' },
  pequizeiro: { nome: 'Pequizeiro', grupo: 'cerrado', nota: 'O cerrado: o tronco torto de cortiça grossa e a copa rala e baixa, de folha de couro.' },
  ipe_amarelo: { nome: 'Ipê-amarelo', grupo: 'cerrado', nota: 'O ipê em flor (sem folha), do cerrado e da cidade: o tronco cinza e a copa em taça, toda amarela.' },
  buriti: { nome: 'Buriti', grupo: 'cerrado', nota: 'A palmeira da vereda: o tronco reto e grosso, o leque na ponta do pecíolo e a saia de folha seca.' },
  catingueira: { nome: 'Catingueira', grupo: 'caatinga', nota: 'A caatinga na seca: dois ou três caules tortos e cinza e o galho fino sem folha.' },
  juazeiro: { nome: 'Juazeiro', grupo: 'caatinga', nota: 'O verde da caatinga, que não perde a folha na seca: o tronco curto e a copa redonda e fechada.' },
  mandacaru: { nome: 'Mandacaru', grupo: 'caatinga', nota: 'O cacto em candelabro: o pé lenhoso, a coluna de costela e os braços que sobem.' },
  xiquexique: { nome: 'Xique-xique', grupo: 'caatinga', nota: 'O cacto rasteiro: o braço deita no chão e levanta na ponta.' },
  oiti: { nome: 'Oiti', grupo: 'cidade', nota: 'A árvore de rua: o fuste limpo de 2,4 m (a poda deixa o caminhão passar) e a copa redonda e fechada.' },
  mangueira: { nome: 'Mangueira', grupo: 'cidade', nota: 'A de quintal e de praça: o tronco grosso e curto, a copa enorme e escura, com a manga.' },
  ipe_roxo: { nome: 'Ipê-roxo', grupo: 'cidade', nota: 'O ipê de praça em flor, rosa-arroxeado.' },
  imperial: { nome: 'Palmeira-imperial', grupo: 'cidade', nota: 'A da avenida e do palácio: o tronco reto e cinza, a barriga no primeiro terço e o palmito verde.' },
  coqueiro: { nome: 'Coqueiro', grupo: 'praia', nota: 'O da orla: o tronco de anel deitado que levanta a ponta, a fronde comprida, o cacho de coco e a folha seca.' },
  amendoeira: { nome: 'Amendoeira', grupo: 'praia', nota: 'A castanheira da praia: o galho em andares deitados e a folha grande, que fica vermelha antes de cair.' },
  araucaria: { nome: 'Araucária', grupo: 'sul', nota: 'O pinheiro do Paraná: o tronco nu e reto e, só no alto, os andares de galho em candelabro.' }
};
/* o que vai em cada lugar (a proporção é o peso no sorteio) */
export const FLORA = {
  mata: { jequitiba: 1, inga: 4, embauba: 2, acai: 2 },
  cerrado: { pequizeiro: 5, ipe_amarelo: 1, buriti: 1 },
  caatinga: { catingueira: 5, juazeiro: 2, mandacaru: 2, xiquexique: 2 },
  cidade: { oiti: 5, mangueira: 2, ipe_amarelo: 1, ipe_roxo: 1, imperial: 1 },
  praia: { coqueiro: 4, amendoeira: 1 },
  sul: { araucaria: 3, inga: 2 }
};

/* MONTA uma árvore da `especie` com a `semente`, em (onde.x, onde.z) do
   mundo, e põe os blocos em `destino.vegetacao` e `destino.folhagem`.
   Devolve a altura, o raio da copa e os triângulos. */
export function montarArvore(especie, onde = {}, destino = {}, semente = 1) {
  const forma = FORMAS[especie];
  if (!forma) throw new Error('arvores3d: não conheço a espécie ' + especie);
  const rnd = sorteio(semente * 7919 + especie.length * 104729);
  const B = Construtor('vegetacao'), F = Folhagem('vegetacao');
  const x = { B, F, rnd, f: onde.fator || rnd.entre(0.88, 1.12) };
  forma(x);
  let alt = 0, raio = 0;
  for (const P of [B.pos, F.pos]) for (let i = 0; i < P.length; i += 3) { alt = Math.max(alt, P[i + 1]); raio = Math.max(raio, Math.hypot(P[i], P[i + 2])); }
  noMundo({ vegetacao: B, folhagem: F }, destino, onde);
  return { altura: alt * (onde.escala || 1), raio: raio * (onde.escala || 1), triangulos: B.pos.length / 9 + F.pos.length / 9 };
}
/* as ferramentas servem a quem monta outra coisa de tubo (a jangada, o
   mastro, o guarda-sol da praia) */
export { varrer, galho, esfera };

/* sorteia uma espécie do lugar, pelo peso */
export function especieDe(lugar, rnd) {
  const tab = FLORA[lugar] || FLORA.mata, tot = Object.values(tab).reduce((a, b) => a + b, 0);
  let r = rnd() * tot;
  for (const [k, p] of Object.entries(tab)) { if ((r -= p) < 0) return k; }
  return Object.keys(tab)[0];
}
