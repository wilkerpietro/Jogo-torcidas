/* =========================================================
   A PRAIA EM 3D — as peças da praia do litoral, pra entrar no mapa
   ---------------------------------------------------------
   O que a planta desenha na praia (a areia entre a avenida da beira e o
   mar), peça por peça, pra entrar no mapa depois:

     areia      guarda-sol (com as cadeiras, a canga, o isopor e a
                prancha), mesa com guarda-sol, barraca, posto de
                guarda-vidas, quadra de vôlei
     quiosque   o de palha (o do Nordeste) e o da orla (o de metal, de
                laje fina)
     calçadão   o trecho de pedra portuguesa, com o chuveirão, a
                lixeira, o banco, o poste e os coqueiros
     mar        a beira (a areia molhada, a espuma e a onda quebrando),
                a jangada e o barco de pesca

   Cada peça é montada em METROS em volta da origem, com o chão em y = 0
   e a frente pro +z (o lado de quem olha: o mar, no quiosque; a areia,
   na beira do mar), e `noMundo` põe no lugar. As listas: `praia` (a
   folha praia.jpg), `equip` (a pedra portuguesa, a areia, o concreto —
   equip.jpg), `vegetacao` (o coco) e `rede` (a rede do vôlei: a mesma
   folha, mas transparente de verdade, não recortada — recortada, a
   malha fina some de longe ou vira faixa preta); o coqueiro vem de `arvores3d.js`. O texto que muda (o nome do quiosque,
   da barraca, do barco, o número do posto) é decalque.

   O TAMANHO É O DE VERDADE: a quadra tem 16 × 8 m e a jangada 6 m. O 2D
   da planta desenha as duas menores, como símbolo — quem puser a peça no
   mapa arruma o lugar pra ela.

   A SEMENTE troca o que muda de uma praia pra outra: a cor do
   guarda-sol, da lona e da tábua, o nome, a canga, o que está solto na
   areia e o jeito de cada cadeira.
   ========================================================= */
import { Construtor, METRO, lerp, sub, soma, esc, unit, pv, noMundo, placasNoMundo } from './construtor3d.js';
import { sorteio, varrer, esfera, montarArvore } from './arvores3d.js';

const ALTO = [0, 1, 0];
const escolha = (rnd, lista) => lista[Math.floor(rnd() * lista.length) % lista.length];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const placa = (lista, tipo, texto, fundo, tinta, x, y, z, nx, nz, larg, alt) =>
  lista.push({ tipo, texto, fundo, tinta, x, y, z, nx, nz, larg, alt });

/* =======================================================
   AS FERRAMENTAS
   ======================================================= */
/* O LUGAR: um referencial dentro da peça, com a origem em (x, y, z) e
   girado de `giro` em volta do y (o mesmo sentido de `noMundo`).
   `dentro` dá o lugar de uma coisa dentro desta (a cadeira em volta da
   mesa, a mesa no deck). */
function Lugar(x = 0, z = 0, giro = 0, y = 0) {
  const c = Math.cos(giro), s = Math.sin(giro);
  const vet = v => [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
  const pt = p => [x + p[0] * c - p[2] * s, y + p[1], z + p[0] * s + p[2] * c];
  return { x, y, z, giro, vet, pt,
    dentro: (dx, dz, g = 0, dy = 0) => { const p = pt([dx, dy, dz]); return Lugar(p[0], p[2], giro + g, p[1]); } };
}
const AQUI = Lugar();
function eixos(d) {
  let a = pv(d, ALTO);
  if (Math.hypot(...a) < 1e-4) a = pv(d, [1, 0, 0]);
  a = unit(a);
  return [a, unit(pv(d, a))];
}
/* a BARRA de seção quadrada entre dois pontos (o pé, a vareta, o
   corrimão, o estai) */
function barra(C, p, q, e, k = 'lisa') {
  const [a, b] = eixos(unit(sub(q, p))), h = e / 2, c = C.cel(k);
  const cs = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([s, t]) => soma(esc(a, s), esc(b, t)));
  for (let i = 0; i < 4; i++) {
    const c0 = cs[i], c1 = cs[(i + 1) % 4];
    C.poli([soma(p, c0), soma(p, c1), soma(q, c1), soma(q, c0)], [[c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]]]);
  }
}
/* o TUBO redondo entre dois pontos (o cabo, o mastro, o poste): o tubo
   varrido, sem costura de casca (a peça é lisa) */
const tubo = (C, p, q, r, k = 'metal', lados = 6) => varrer(C, [p, q], [r, r], lados, k, { vPor: 100, rep: 1 });
/* o CILINDRO em pé, fechado em cima e embaixo */
function cilindro(C, L, x, z, y0, y1, r, k = 'lisa', lados = 10) {
  const p = L.pt([x, y0, z]);
  C.torno(p[0], p[2], [[0.001, p[1]], [r, p[1]], [r, p[1] + y1 - y0], [0.001, p[1] + y1 - y0]], lados, k);
}
/* um QUADRILÁTERO qualquer (os quatro cantos no sentido da face) com a
   peça `k` inteira, ou a `parte` dela */
function pano(C, P, k, parte) {
  const c = C.cel(k), [f0, f1, g0, g1] = parte || [0, 1, 0, 1];
  const U0 = lerp(c[0], c[2], f0), U1 = lerp(c[0], c[2], f1), V0 = lerp(c[1], c[3], g0), V1 = lerp(c[1], c[3], g1);
  C.poli(P, [[U0, V0], [U1, V0], [U1, V1], [U0, V1]]);
}
/* a FITA entre duas polilinhas (a lona da cadeira): u de uma à outra,
   v pelo comprimento */
function fita(C, esq, dir, k, parte) {
  const c = C.cel(k), [f0, f1, g0, g1] = parte || [0, 1, 0, 1];
  const S = [0];
  for (let i = 1; i < esq.length; i++) S.push(S[i - 1] + Math.hypot(...sub(esq[i], esq[i - 1])));
  const tot = S[S.length - 1] || 1, U0 = lerp(c[0], c[2], f0), U1 = lerp(c[0], c[2], f1);
  const V = i => lerp(c[1], c[3], lerp(g0, g1, S[i] / tot));
  for (let i = 0; i < esq.length - 1; i++)
    C.poli([esq[i], dir[i], dir[i + 1], esq[i + 1]], [[U0, V(i)], [U1, V(i)], [U1, V(i + 1)], [U0, V(i + 1)]]);
}
/* a MALHA de nu × nv quadrados: `ponto(s, t)` dá o ponto de (s, t) em
   [0, 1]², e a peça estica por cima (s → u, t → v) */
function malha(C, nu, nv, ponto, k, parte) {
  const c = C.cel(k), [f0, f1, g0, g1] = parte || [0, 1, 0, 1];
  const uv = (s, t) => [lerp(c[0], c[2], lerp(f0, f1, s)), lerp(c[1], c[3], lerp(g0, g1, t))];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const s0 = i / nu, s1 = (i + 1) / nu, t0 = j / nv, t1 = (j + 1) / nv;
    C.poli([ponto(s0, t0), ponto(s1, t0), ponto(s1, t1), ponto(s0, t1)], [uv(s0, t0), uv(s1, t0), uv(s1, t1), uv(s0, t1)]);
  }
}
/* o PARALELEPÍPEDO torto (o encosto, o leme): o canto O e as três
   arestas A, B e D, com a peça esticada em cada face */
function paralelepipedo(C, O, A, B, D, k = 'lisa') {
  const p = (i, j, l) => soma(O, soma(esc(A, i), soma(esc(B, j), esc(D, l))));
  for (const f of [[p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)], [p(1, 0, 0), p(0, 0, 0), p(0, 1, 0), p(1, 1, 0)],
                   [p(1, 0, 1), p(1, 0, 0), p(1, 1, 0), p(1, 1, 1)], [p(0, 0, 0), p(0, 0, 1), p(0, 1, 1), p(0, 1, 0)],
                   [p(0, 1, 1), p(1, 1, 1), p(1, 1, 0), p(0, 1, 0)], [p(0, 0, 0), p(1, 0, 0), p(1, 0, 1), p(0, 0, 1)]])
    pano(C, f, k);
}
/* a CAIXA num lugar girado: as seis faces com o plano de cada uma (a
   `caixa` do construtor, que só anda no eixo). `spec` como lá: a peça
   de cada face, {k, modo: 'esticar', parte, tinta}, ou null. */
function bloco(C, L, x0, x1, y0, y1, z0, z1, spec) {
  const P = (x, y, z) => L.pt([x, y, z]), X = L.vet([1, 0, 0]), Z = L.vet([0, 0, 1]);
  const mX = esc(X, -1), mZ = esc(Z, -1);
  const F = {
    frente: [C.plano(P(x0, y0, z1), X, ALTO), x1 - x0, y1 - y0],
    tras: [C.plano(P(x1, y0, z0), mX, ALTO), x1 - x0, y1 - y0],
    dir: [C.plano(P(x1, y0, z1), mZ, ALTO), z1 - z0, y1 - y0],
    esq: [C.plano(P(x0, y0, z0), Z, ALTO), z1 - z0, y1 - y0],
    topo: [C.plano(P(x0, y1, z1), X, mZ), x1 - x0, z1 - z0],
    base: [C.plano(P(x0, y0, z0), X, Z), x1 - x0, z1 - z0]
  };
  for (const nome in F) {
    let s = spec[nome] === undefined ? spec.todas : spec[nome];
    if (!s) continue;
    if (typeof s === 'string') s = { k: s };
    const [f, w, h] = F[nome];
    if (s.modo === 'esticar') C.esticar(f, 0, w, 0, h, s.k, s);
    else C.ladrilhar(f, C.ret(0, w, 0, h), s.k, s);
  }
}
/* o TORO (a boia, o pneu do costado): em volta de `centro`, no plano de
   U e V; as cores se revezam por quarto */
function toro(C, centro, U, V, R, r, k, cores, nA = 16, nT = 6) {
  const N = unit(pv(U, V)), c = C.cel(k);
  const P = (a, t) => soma(centro, soma(esc(soma(esc(U, Math.cos(a)), esc(V, Math.sin(a))), R + r * Math.cos(t)), esc(N, r * Math.sin(t))));
  for (let i = 0; i < nA; i++) {
    C.pintar(cores[Math.floor(i * 4 / nA) % cores.length]);
    const a0 = i / nA * 2 * Math.PI, a1 = (i + 1) / nA * 2 * Math.PI;
    for (let j = 0; j < nT; j++) {
      const t0 = j / nT * 2 * Math.PI, t1 = (j + 1) / nT * 2 * Math.PI;
      C.poli([P(a0, t0), P(a1, t0), P(a1, t1), P(a0, t1)], [[c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]]]);
    }
  }
  C.pintar(null);
}

/* =======================================================
   O QUE SE ESPALHA NA AREIA
   ======================================================= */
const CORES_SOL = [['#d8453a', '#f4efe6'], ['#2f6fb0', '#f4efe6'], ['#f2c14e', '#2f8f5a'], ['#e8772e', '#f4efe6'],
                   ['#1f9aa8', '#f2c14e'], ['#c23a6b', '#f4efe6']];
const LONAS = ['lona_vermelha', 'lona_azul', 'lona_laranja', 'lona_verde'];
const COR_DA_LONA = { lona_vermelha: '#c8322b', lona_azul: '#2f6fb0', lona_laranja: '#e0782e', lona_verde: '#2f8f5a' };
const CANGAS = ['canga_brasil', 'canga_tiedye', 'canga_listra', 'canga_flor'];

/* O GUARDA-SOL: o cabo inclinado (`inclina` rad, pro lado `rumo`), os
   gomos de tecido nas duas cores, o babado recortado, as varetas e os
   tirantes por baixo. O cabo sai do chão do lugar (ou de `y0`, o tampo
   da mesa que ele atravessa). */
function guardaSol(C, L, o = {}) {
  const R = o.raio || 1, H = o.altura || 2.2, n = o.gomos || 8, cores = o.cores || CORES_SOL[0];
  const inc = o.inclina || 0, rumo = o.rumo || 0;
  const eixo = unit(L.vet([Math.sin(inc) * Math.cos(rumo), Math.cos(inc), Math.sin(inc) * Math.sin(rumo)]));
  const [a, b] = eixos(eixo), base = L.pt([0, o.y0 || 0, 0]);
  const Q = (r, t, h) => soma(base, soma(esc(eixo, h), soma(esc(a, r * Math.cos(t)), esc(b, r * Math.sin(t)))));
  C.pintar(o.cabo || '#d8d5cc');
  tubo(C, Q(0, 0, 0), Q(0, 0, H * 0.55), 0.021);
  tubo(C, Q(0, 0, H * 0.55), Q(0, 0, H + 0.09), 0.016);
  /* a copa: o perfil (raio, queda) do alto até a beira */
  const perfil = [[0, 0], [0.45, 0.1], [0.8, 0.26], [1, 0.38]].map(([r, q]) => [r * R, q * R]);
  const c = C.cel('tecido'), g0 = o.giro || 0;
  const uDe = f => [lerp(c[0], c[2], 0.5 - 0.5 * f), lerp(c[0], c[2], 0.5 + 0.5 * f)];
  for (let i = 0; i < n; i++) {
    const t0 = g0 + i / n * 2 * Math.PI, t1 = g0 + (i + 1) / n * 2 * Math.PI;
    C.pintar(cores[i % cores.length]);
    for (let j = 0; j < perfil.length - 1; j++) {
      const [r0, q0] = perfil[j], [r1, q1] = perfil[j + 1];
      const [A0, A1] = uDe(r0 / R), [B0, B1] = uDe(r1 / R);
      const v0 = lerp(c[3], c[1], r0 / R), v1 = lerp(c[3], c[1], r1 / R);
      if (j === 0) C.tri(Q(r1, t0, H - q1), Q(r1, t1, H - q1), Q(0, 0, H), [B0, v1], [B1, v1], [(A0 + A1) / 2, v0]);
      else C.poli([Q(r1, t0, H - q1), Q(r1, t1, H - q1), Q(r0, t1, H - q0), Q(r0, t0, H - q0)], [[B0, v1], [B1, v1], [A1, v0], [A0, v0]]);
    }
    /* o babado: cai da beira, mais fundo no meio do gomo */
    const [rb, qb] = perfil[perfil.length - 1], cai = o.babado || 0.12, tm = (t0 + t1) / 2, rm = rb * Math.cos((t1 - t0) / 2);
    const vb = lerp(c[1], c[3], 0.14);
    C.poli([Q(rb, t0, H - qb), Q(rb, t0, H - qb - cai * 0.55), Q(rm, tm, H - qb - cai), Q(rb, t1, H - qb - cai * 0.55), Q(rb, t1, H - qb)],
           [[c[0], vb], [c[0], c[1]], [(c[0] + c[2]) / 2, c[1]], [c[2], c[1]], [c[2], vb]]);
  }
  /* as varetas (por baixo do tecido) e os tirantes que vêm do cabo */
  C.pintar('#b9b5ac');
  for (let i = 0; i < n; i++) {
    const t = g0 + i / n * 2 * Math.PI;
    const p0 = Q(0.03, t, H - 0.04), p1 = Q(0.8 * R, t, H - 0.26 * R - 0.025), p2 = Q(R, t, H - 0.38 * R - 0.012);
    barra(C, p0, p1, 0.012, 'metal'); barra(C, p1, p2, 0.012, 'metal');
    barra(C, Q(0.02, t, H - 0.52 * R), soma(p0, esc(sub(p1, p0), 0.55)), 0.01, 'metal');
  }
  C.pintar(null);
}
/* a CADEIRA DE PRAIA (a de alumínio, que dobra): o assento baixo e o
   encosto deitado de lona listrada, o braço e os pés de tubo. De frente
   pro +z do lugar. */
function cadeiraDePraia(C, L, lona) {
  const P = (x, y, z) => L.pt([x, y, z]), w = 0.27, e = 0.022;
  C.pintar('#d6d4cd');
  for (const s of [-1, 1]) {
    const x = s * w, xb = s * (w + 0.03);
    const fr = P(x, 0.3, 0.26), tr = P(x, 0.21, -0.2), topo = P(x, 0.9, -0.52);
    barra(C, fr, tr, e, 'metal');
    barra(C, tr, topo, e, 'metal');
    barra(C, P(x, 0, 0.3), fr, e, 'metal');
    barra(C, P(x, 0, -0.36), P(x, 0.46, -0.3), e, 'metal');
    barra(C, P(xb, 0.46, 0.2), P(xb, 0.49, -0.33), e * 1.4, 'metal');
    barra(C, P(xb, 0.29, 0.22), P(xb, 0.46, 0.2), e, 'metal');
  }
  barra(C, P(-w, 0.03, 0.3), P(w, 0.03, 0.3), e, 'metal');
  barra(C, P(-w, 0.03, -0.36), P(w, 0.03, -0.36), e, 'metal');
  C.pintar(null);
  /* a lona: da frente do assento ao alto do encosto, com a barriga */
  const cam = [[0.3, 0.26], [0.19, 0.04], [0.2, -0.19], [0.56, -0.36], [0.9, -0.52]];
  fita(C, cam.map(([y, z]) => P(-w + 0.012, y, z)), cam.map(([y, z]) => P(w - 0.012, y, z)), lona, [0.18, 0.72, 0, 1]);
}
/* a CADEIRA DE PLÁSTICO (a do bar): o assento, os quatro pés abertos,
   o encosto e os braços, de uma cor só. De frente pro +z do lugar. */
function cadeiraPlastica(C, L, cor) {
  const P = (x, y, z) => L.pt([x, y, z]);
  C.pintar(cor);
  bloco(C, L, -0.22, 0.22, 0.41, 0.45, -0.2, 0.21, { todas: 'lisa' });
  for (const [x, z] of [[-0.19, 0.18], [0.19, 0.18], [-0.19, -0.17], [0.19, -0.17]])
    barra(C, P(x, 0.43, z), P(x * 1.24, 0, z * 1.3), 0.045);
  paralelepipedo(C, P(-0.22, 0.43, -0.2), L.vet([0.44, 0, 0]), L.vet([0, 0.44, -0.09]), L.vet([0, 0.006, -0.032]));
  for (const s of [-1, 1]) {
    barra(C, P(s * 0.225, 0.64, -0.245), P(s * 0.225, 0.62, 0.17), 0.04);
    barra(C, P(s * 0.215, 0.44, 0.17), P(s * 0.225, 0.62, 0.17), 0.035);
  }
  C.pintar(null);
}
/* a MESA DE BAR (a de plástico da cervejaria): o tampo com a marca e os
   quatro pés */
function mesaDeBar(C, L, cor = '#f3f1ea') {
  const P = (x, y, z) => L.pt([x, y, z]);
  C.pintar(cor);
  bloco(C, L, -0.4, 0.4, 0.68, 0.72, -0.4, 0.4, { topo: { k: 'mesa', modo: 'esticar', tinta: null }, todas: 'lisa' });
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) barra(C, P(x * 0.34, 0.69, z * 0.34), P(x * 0.38, 0, z * 0.38), 0.045);
  C.pintar(null);
}
/* a MESA COM GUARDA-SOL: a mesa, o guarda-sol que atravessa o tampo e as
   quatro cadeiras viradas pra mesa, cada uma meio torta */
function mesaComGuardaSol(x, L, o = {}) {
  const { B, rnd } = x;
  mesaDeBar(B, L, o.mesa);
  guardaSol(B, L, { raio: 0.95, altura: 2.2, cores: o.cores, giro: rnd() * Math.PI });
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + rnd.entre(-0.18, 0.18), d = rnd.entre(0.58, 0.7);
    cadeiraPlastica(B, L.dentro(Math.cos(a) * d, Math.sin(a) * d, Math.atan2(Math.cos(a), -Math.sin(a)) + rnd.entre(-0.25, 0.25)), o.cadeira || '#f1efe9');
  }
  if (o.coco !== false && rnd() < 0.7) esfera(x.Vg, L.pt([rnd.entre(-0.2, 0.2), 0.83, rnd.entre(0.1, 0.25)]), 0.105, 'coco', 6, 4);
}
/* o ISOPOR: a caixa de gelo com a tampa um pouco maior */
function isopor(C, L, o = {}) {
  const w = o.larg || 0.6, h = 0.4, d = 0.4, lado = { k: 'isopor', modo: 'esticar', parte: [0, 0.28, 0.1, 0.9] };
  bloco(C, L, -w / 2, w / 2, 0, h, -d / 2, d / 2, { frente: { k: 'isopor', modo: 'esticar' }, tras: { k: 'isopor', modo: 'esticar' },
                                                    dir: lado, esq: lado, topo: null, base: null });
  bloco(C, L, -w / 2 - 0.015, w / 2 + 0.015, h, h + 0.05, -d / 2 - 0.015, d / 2 + 0.015, { todas: lado, base: null });
}
/* a CANGA estendida na areia, com a dobra do pano */
function canga(C, L, k, rnd) {
  const W = 1.6, D = 1.0, nu = 4, nv = 2, alt = [];
  for (let i = 0; i <= nu; i++) { alt.push([]); for (let j = 0; j <= nv; j++) alt[i].push(0.012 + rnd() * 0.022); }
  malha(C, nu, nv, (s, t) => L.pt([(s - 0.5) * W, alt[Math.round(s * nu)][Math.round(t * nv)], (0.5 - t) * D]), k);
}
/* a PRANCHA: o contorno de bico fino e rabeta cortada, com a espessura.
   Em pé, fincada na areia e deitada pra trás (`inclina`); ou deitada
   (`deitada`). `k`/`tinta`: a de resgate é amarela lisa. */
function prancha(C, L, o = {}) {
  const comp = o.comp || 2.0, W = o.larg || 0.27, n = 10, cont = [];
  const w = t => W * Math.pow(Math.max(0, Math.sin(Math.PI * (0.1 + 0.9 * t))), 0.62);
  for (let i = 0; i <= n; i++) cont.push([i / n * comp, w(i / n)]);
  for (let i = n - 1; i >= 0; i--) cont.push([i / n * comp, -w(i / n)]);
  let F;
  if (o.deitada) F = C.plano(L.pt([-comp / 2, 0.07, 0]), L.vet([1, 0, 0]), L.vet([0, 0, -1]));
  else {
    const inc = o.inclina === undefined ? 0.22 : o.inclina;
    F = C.plano(L.pt([0, o.y0 === undefined ? -0.4 : o.y0, 0]), unit(L.vet([0, Math.cos(inc), -Math.sin(inc)])), L.vet([-1, 0, 0]));
  }
  if (o.tinta) C.pintar(o.tinta);
  C.extrudar(F, cont, 0.065, o.k || 'prancha', 'lisa', o.k || 'prancha');
  if (o.tinta) C.pintar(null);
}
/* a PILHA DE COCO verde: a volta de baixo e os de cima */
function cocos(Vg, L, n, rnd) {
  const r = 0.11, baixo = [[0, 0], [0.21, 0.03], [-0.2, 0.06], [0.04, 0.21], [0.08, -0.2], [-0.13, -0.16], [0.24, -0.17], [-0.25, 0.22]];
  const cima = [[0.1, 0.08], [-0.09, -0.04], [0.02, 0.18]];
  for (let i = 0; i < Math.min(n, baixo.length); i++) esfera(Vg, L.pt([baixo[i][0], r * 0.92, baixo[i][1]]), r * rnd.entre(0.9, 1.1), 'coco', 6, 4);
  for (let i = 0; i < Math.min(n - baixo.length, cima.length); i++) esfera(Vg, L.pt([cima[i][0], r * 2.6, cima[i][1]]), r * rnd.entre(0.9, 1.1), 'coco', 6, 4);
}
/* a BANQUETA do balcão: o pé redondo, o cano e o assento */
function banqueta(C, L, cor) {
  const p = L.pt([0, 0, 0]);
  C.pintar('#bdb9b0');
  C.torno(p[0], p[2], [[0.001, p[1]], [0.2, p[1]], [0.2, p[1] + 0.03], [0.001, p[1] + 0.03]], 10, 'metal');
  tubo(C, soma(p, [0, 0.03, 0]), soma(p, [0, 0.68, 0]), 0.025);
  C.pintar(cor);
  C.torno(p[0], p[2], [[0.001, p[1] + 0.68], [0.18, p[1] + 0.68], [0.18, p[1] + 0.75], [0.001, p[1] + 0.75]], 10, 'lisa');
  C.pintar(null);
}
/* o CAVALETE do cardápio: as duas tábuas em A, a da frente com o quadro */
function cavalete(C, L) {
  const P = (x, y, z) => L.pt([x, y, z]), h = 1.1, w = 0.8, abre = 0.24, lado = Math.hypot(h, abre);
  C.esticar(C.plano(P(-w / 2, 0, abre), L.vet([1, 0, 0]), unit(L.vet([0, h, -abre]))), 0, w, 0, lado, 'cardapio');
  C.esticar(C.plano(P(w / 2, 0, -abre), L.vet([-1, 0, 0]), unit(L.vet([0, h, abre]))), 0, w, 0, lado, 'madeira_velha');
}

/* =======================================================
   AS PEÇAS
   ======================================================= */
/* O GUARDA-SOL NA AREIA, com o que vem junto: as duas cadeiras na
   sombra, a canga na frente, o isopor e, às vezes, a prancha */
function pecaGuardaSol(x) {
  const { B, rnd } = x;
  guardaSol(B, AQUI, { raio: 1.05, cores: escolha(rnd, CORES_SOL), inclina: 0.13, rumo: rnd.entre(-2.4, -1.6), giro: rnd() });
  cadeiraDePraia(B, Lugar(-0.46, 0.3, rnd.entre(0.05, 0.3)), escolha(rnd, LONAS));
  cadeiraDePraia(B, Lugar(0.5, 0.28, rnd.entre(-0.3, -0.05)), escolha(rnd, LONAS));
  canga(B, Lugar(rnd.entre(-0.3, 0.3), 1.6, rnd.entre(-0.25, 0.25)), escolha(rnd, CANGAS), rnd);
  isopor(B, Lugar(0.08, -0.62, rnd.entre(-0.4, 0.4)));
  if (rnd() < 0.65) prancha(B, Lugar(-1.2, -0.75, rnd.entre(0.2, 0.6)));
  else prancha(B, Lugar(-0.2, 2.75, rnd.entre(-0.3, 0.3)), { deitada: true });
  if (rnd() < 0.6) esfera(x.Vg, [0.95, 0.1, -0.25], 0.1, 'coco', 6, 4);
}
/* A MESA COM GUARDA-SOL (a do quiosque, solta) */
function pecaMesa(x) {
  const { rnd } = x;
  mesaComGuardaSol(x, AQUI, { cores: escolha(rnd, CORES_SOL), cadeira: escolha(rnd, ['#f1efe9', '#c8322b', '#2f6fb0']) });
}
/* A BARRACA: a lona de duas águas (a cumeeira ao comprido, como no 2D)
   nos seis paus, o babado com o nome, e embaixo a mesa, as cadeiras, os
   isopores, a pilha de cadeira e o coco */
function pecaBarraca(x) {
  const { B, Vg, rnd, placas } = x;
  const lona = escolha(rnd, LONAS), cor = COR_DA_LONA[lona];
  const a = 1.5, o = 0.15, hE = 2.05, hR = 2.75, cai = 0.22;
  /* os paus e as travessas */
  B.pintar('#cfccc4');
  for (const [px, pz] of [[-a, -a], [a, -a], [a, a], [-a, a]]) tubo(B, [px, 0, pz], [px, hE - 0.04, pz], 0.025);
  for (const px of [-a, a]) tubo(B, [px, 0, 0], [px, hR - 0.05, 0], 0.025);
  barra(B, [-a, hR - 0.07, 0], [a, hR - 0.07, 0], 0.03, 'metal');
  for (const s of [-1, 1]) barra(B, [-a, hE - 0.07, s * a], [a, hE - 0.07, s * a], 0.03, 'metal');
  B.pintar(null);
  /* as duas águas (a listra desce da cumeeira pro beiral) e as empenas */
  const E0 = a + o, X0 = a + o, yE = hE - (hR - hE) * o / a;
  for (const s of [1, -1]) {
    const O = [-X0, yE, s * E0], V = unit(sub([-X0, hR, 0], O)), len = Math.hypot(...sub([-X0, hR, 0], O));
    B.ladrilhar(B.plano(O, [1, 0, 0], V), B.ret(0, 2 * X0, 0, len), lona);
    B.ladrilhar(B.plano([-X0, yE - cai, s * E0], [1, 0, 0], ALTO), B.ret(0, 2 * X0, 0, cai), lona);   // o babado
  }
  for (const s of [1, -1]) {
    const F = B.plano([s * X0, yE, s * E0], [0, 0, -s], ALTO);
    B.ladrilhar(F, [[0, 0], [2 * E0, 0], [E0, hR - yE]], lona);
    B.ladrilhar(B.plano([s * X0, yE - cai, s * E0], [0, 0, -s], ALTO), B.ret(0, 2 * E0, 0, cai), lona);
  }
  placa(placas, 'letreiro', escolha(rnd, ['BARRACA DA NEIDE', 'BARRACA DO TONHO', 'CANTINHO DO SOL', 'BARRACA DO GALEGO', 'BARRACA DA PRAIA']),
        '#f4efe6', cor, 0, yE - cai / 2, E0 + 0.012, 0, 1, 2.5, cai * 0.86);
  /* embaixo */
  mesaDeBar(B, Lugar(0.1, 0.3, rnd.entre(-0.2, 0.2)));
  for (let i = 0; i < 4; i++) {
    const t = i * Math.PI / 2 + 0.25 + rnd.entre(-0.2, 0.2), d = rnd.entre(0.6, 0.72);
    cadeiraPlastica(B, Lugar(0.1 + Math.cos(t) * d, 0.3 + Math.sin(t) * d, Math.atan2(Math.cos(t), -Math.sin(t)) + rnd.entre(-0.3, 0.3)), '#f1efe9');
  }
  for (let i = 0; i < 3; i++) esfera(Vg, [0.1 + rnd.entre(-0.25, 0.25), 0.83, 0.3 + rnd.entre(-0.25, 0.25)], 0.105, 'coco', 6, 4);
  isopor(B, Lugar(-1.05, -1.0, 0.1));
  isopor(B, Lugar(-1.05, -1.0, 0.18, 0.45), { larg: 0.52 });
  for (let i = 0; i < 4; i++) cadeiraPlastica(B, Lugar(1.05, -1.0, -0.3, i * 0.075), '#f1efe9');
  cocos(Vg, Lugar(-1.15, 0.9), 9, rnd);
}
/* O POSTO DE GUARDA-VIDAS: as quatro pernas com o X, o tablado, a
   cabine vermelha de janela nos três lados e porta atrás, o telhado
   branco, o guarda-corpo, a escada, o mastro da bandeira, a boia e a
   prancha de resgate */
function pecaPosto(x) {
  const { B, rnd, placas } = x;
  const Y = 1.9, T = 0.12, yT = Y + T, a = 0.72, h = 1.75, BRANCO = '#ece8df', VERMELHO = '#cf3f36';
  const madeira = (p, q, e) => barra(B, p, q, e, 'madeira_velha');
  B.pintar(BRANCO);
  const pe = [[-0.85, -0.85], [0.85, -0.85], [0.85, 0.85], [-0.85, 0.85]];
  for (const [px, pz] of pe) B.caixa(px - 0.07, px + 0.07, 0, Y, pz - 0.07, pz + 0.07, { todas: 'madeira_velha', topo: null, base: null });
  for (let i = 0; i < 4; i++) {
    const p = pe[i], q = pe[(i + 1) % 4];
    madeira([p[0], 0.3, p[1]], [q[0], Y - 0.12, q[1]], 0.07);
    madeira([q[0], 0.3, q[1]], [p[0], Y - 0.12, p[1]], 0.07);
  }
  B.caixa(-1.1, 1.1, Y, yT, -1.1, 1.1, { topo: { k: 'deck', tinta: null }, todas: 'madeira_velha' });
  /* o guarda-corpo (aberto atrás, na escada) e a escada */
  const yc = yT + 1.0;
  const corrimao = (p, q) => { madeira([p[0], yc, p[1]], [q[0], yc, q[1]], 0.05); madeira([p[0], yT + 0.5, p[1]], [q[0], yT + 0.5, q[1]], 0.04); };
  for (const [px, pz] of [[-1.05, -1.05], [1.05, -1.05], [1.05, 1.05], [-1.05, 1.05], [0.38, -1.05], [-0.38, -1.05]])
    madeira([px, yT, pz], [px, yc, pz], 0.06);
  corrimao([-1.05, 1.05], [1.05, 1.05]); corrimao([1.05, 1.05], [1.05, -1.05]); corrimao([-1.05, -1.05], [-1.05, 1.05]);
  corrimao([1.05, -1.05], [0.38, -1.05]); corrimao([-0.38, -1.05], [-1.05, -1.05]);
  const z0 = -2.1, z1 = -1.02, topo = yT + 0.95;
  for (const s of [-1, 1]) madeira([s * 0.3, 0, z0], [s * 0.3, topo, z1], 0.065);
  for (let i = 1; i <= 7; i++) { const y = i * yT / 8, z = z0 + (z1 - z0) * y / topo; madeira([-0.3, y, z], [0.3, y, z], 0.05); }
  /* a cabine */
  B.pintar(VERMELHO);
  const janela = (a0, a1) => ({ a0, a1, b0: 0.8, b1: 1.4, k: 'vidro', fundo: 0.04 });
  B.fachada(B.plano([-a, yT, a], [1, 0, 0], ALTO), 2 * a, h, 'tabuas', [janela(0.22, 1.22)]);
  B.fachada(B.plano([a, yT, a], [0, 0, -1], ALTO), 2 * a, h, 'tabuas', [janela(0.37, 1.07)]);
  B.fachada(B.plano([-a, yT, -a], [0, 0, 1], ALTO), 2 * a, h, 'tabuas', [janela(0.37, 1.07)]);
  B.fachada(B.plano([a, yT, -a], [-1, 0, 0], ALTO), 2 * a, h, 'tabuas', [{ a0: 0.36, a1: 1.08, b0: 0, b1: 1.6, k: 'madeira_velha', fundo: 0.05 }]);
  B.pintar('#f2f0ea');
  B.telhado4(-0.98, 0.98, -0.98, 0.98, yT + h, 0.5, 'telha_metal');
  B.pintar(null);
  const num = String(1 + Math.floor(rnd() * 12));
  placa(placas, 'letreiro', 'GUARDA-VIDAS', '#f4f1ea', '#c8322b', 0, yT + 1.575, a + 0.012, 0, 1, 1.3, 0.25);
  for (const s of [-1, 1]) placa(placas, 'logo', num, '#f4f1ea', '#c8322b', s * (a + 0.012), yT + 1.575, 0, s, 0, 0.3, 0.3);
  /* o mastro e a bandeira (vermelha em cima, amarela embaixo), batendo */
  B.pintar('#cfccc4'); tubo(B, [-1.05, yT, 1.05], [-1.05, 5.4, 1.05], 0.03); B.pintar(null);
  malha(B, 5, 1, (s, t) => [-1.03 + s * 0.95, 5.32 - 0.62 + t * 0.62, 1.05 + 0.08 * Math.sin(s * 5.5) * s], 'bandeira');
  /* a boia no guarda-corpo da frente e a prancha de resgate encostada */
  toro(B, [0.5, yc - 0.31, 1.1], [1, 0, 0], ALTO, 0.25, 0.055, 'lisa', ['#e8672c', '#f4f1ea']);
  prancha(B, Lugar(1.3, 1.25, 0.6), { comp: 2.5, larg: 0.3, k: 'lisa', tinta: '#f0c030', inclina: 0.36, y0: 0 });
}
/* A QUADRA DE VÔLEI: 16 × 8 m de fita azul na areia, os dois postes com
   a espuma e os estais, a rede de um metro (2,43 m em cima) com a faixa
   branca, as antenas listradas e a bola */
function pecaQuadra(x) {
  const { B, R, rnd } = x;
  const LX = 8, LZ = 4, f = 0.06, y = 0.012;
  B.pintar('#2f6fb0');
  const linha = (x0, x1, z0, z1) => B.esticar(B.plano([x0, y, z1], [1, 0, 0], [0, 0, -1]), 0, x1 - x0, 0, z1 - z0, 'lisa');
  linha(-LX, LX, LZ - f, LZ); linha(-LX, LX, -LZ, -LZ + f); linha(-LX, -LX + f, -LZ, LZ); linha(LX - f, LX, -LZ, LZ);
  B.pintar(null);
  const zP = LZ + 0.8, yR = 2.43, hR = 1.0, zR = LZ + 0.3;
  for (const s of [-1, 1]) {
    B.pintar('#d9d6ce'); tubo(B, [0, 0, s * zP], [0, 2.6, s * zP], 0.045, 'metal', 8);
    B.pintar('#2f6fb0'); cilindro(B, AQUI, 0, s * zP, 0, 1.85, 0.085, 'lisa', 10);
    B.pintar('#e9e6dc');
    for (const dx of [-1.1, 1.1]) barra(B, [0, 2.5, s * zP], [dx, 0, s * (zP + 1.3)], 0.014);
    barra(B, [0, yR, s * zR], [0, yR + 0.05, s * zP], 0.012);                   // o cabo de cima, até o poste
    barra(B, [0, yR - hR, s * zR], [0, yR - hR + 0.02, s * zP], 0.012);         // o de baixo
    B.pintar(null);
    /* a antena, de dez em dez centímetros vermelha e branca */
    for (let i = 0; i < 9; i++) {
      B.pintar(i % 2 ? '#f4f1ea' : '#d23a30');
      tubo(B, [0, yR - hR + i * 0.2, s * LZ], [0, yR - hR + (i + 1) * 0.2, s * LZ], 0.012, 'lisa', 5);
    }
    B.pintar(null);
  }
  R.ladrilhar(R.plano([0, yR - hR, -zR], [0, 0, 1], ALTO), R.ret(0, 2 * zR, 0, hR), 'rede');
  B.pintar('#f4f1ea');
  B.caixa(-0.014, 0.014, yR - 0.08, yR, -zR, zR, { todas: 'lisa' });
  B.caixa(-0.01, 0.01, yR - hR, yR - hR + 0.05, -zR, zR, { todas: 'lisa' });
  for (const s of [-1, 1]) B.caixa(-0.011, 0.011, yR - hR, yR, s * LZ - 0.025, s * LZ + 0.025, { todas: 'lisa' });
  B.pintar('#f0d04c');
  esfera(B, [rnd.entre(1.5, 3.5), 0.105, rnd.entre(-2, 2)], 0.105, 'lisa', 8, 5);
  B.pintar(null);
}
/* O QUIOSQUE: o deck de madeira com o degrau, o corpo no fundo (a
   janela do balcão com a prateleira de garrafa lá dentro, a porta do
   lado), o balcão de azulejo com as banquetas, o freezer de sorvete, a
   geladeira de bebida, o coco, o cavalete do cardápio e as três mesas
   de guarda-sol pro lado do mar. `orla`: o de metal, de laje fina nas
   colunas, com o letreiro em cima; senão, o de palha nos esteios de
   tronco, com a placa de madeira. */
function pecaQuiosque(x, orla) {
  const { B, Vg, rnd, placas } = x;
  const Y = 0.3, DX = 3.6, DZ = 2.7;
  const nome = orla ? escolha(rnd, ['QUIOSQUE BEIRA-MAR', 'QUIOSQUE ONDA AZUL', 'QUIOSQUE PÉ NA AREIA', 'QUIOSQUE MAR ABERTO'])
                    : escolha(rnd, ['ESTRELA DO MAR', 'BARRACA DO NEGUINHO', 'SOL E MAR', 'CANTINHO DA PRAIA', 'BARRACA DA NETA']);
  const acento = escolha(rnd, ['#1f7a8c', '#2f6fb0', '#2f8f5a', '#c8322b']);
  /* o deck e o degrau */
  B.caixa(-DX, DX, 0, Y, -DZ, DZ, { topo: 'deck', base: null, todas: 'madeira_velha' });
  B.caixa(-0.8, 0.8, 0, 0.15, DZ, DZ + 0.38, { topo: 'deck', base: null, tras: null, todas: 'madeira_velha' });
  /* o corpo */
  const X0 = -1.8, X1 = 1.8, Z0 = -2.55, Z1 = -0.5, H = orla ? 2.5 : 2.3;
  const parede = orla ? 'telha_metal' : 'tabuas';
  B.pintar(orla ? '#f4f3ee' : escolha(rnd, ['#2f86a6', '#e2b33c', '#3f9a6a', '#d8643c']));
  const lado = orla ? [{ a0: 0.3, a1: 1.75, b0: 0.9, b1: 2.1, k: 'vidro', fundo: 0.04 }] : [];
  B.fachada(B.plano([X0, Y, Z1], [1, 0, 0], ALTO), X1 - X0, H, parede, [{ a0: 1.2, a1: 2.8, b0: 0.8, b1: 1.75, k: 'prateleira', fundo: 1.85 }]);
  B.fachada(B.plano([X0, Y, Z0], [0, 0, 1], ALTO), Z1 - Z0, H, parede, orla ? lado : [{ a0: 0.55, a1: 1.35, b0: 0, b1: 2.0, k: 'madeira_velha', fundo: 0.06 }]);
  B.fachada(B.plano([X1, Y, Z1], [0, 0, -1], ALTO), Z1 - Z0, H, parede, lado);
  B.fachada(B.plano([X1, Y, Z0], [-1, 0, 0], ALTO), X1 - X0, H, parede, orla ? [{ a0: 0.4, a1: 1.2, b0: 0, b1: 2.1, k: 'madeira_velha', fundo: 0.05 }] : []);
  B.pintar(null);
  /* o balcão, o freezer e a geladeira, na frente do corpo */
  if (orla) {
    B.pintar(acento);
    B.caixa(-0.6, 1.0, Y, Y + 0.8, Z1, Z1 + 0.42, { topo: null, base: null, todas: 'lisa' });
    B.pintar('#d9d9d6');
    B.caixa(-0.66, 1.06, Y + 0.8, Y + 0.85, Z1 - 0.02, Z1 + 0.6, { todas: 'metal' });
    B.pintar(null);
  } else {
    B.caixa(-0.6, 1.0, Y, Y + 0.8, Z1, Z1 + 0.42, { frente: { k: 'balcao', modo: 'esticar' }, topo: null, base: null, todas: 'madeira_velha' });
    B.caixa(-0.66, 1.06, Y + 0.8, Y + 0.86, Z1 - 0.02, Z1 + 0.6, { todas: 'madeira_velha' });
  }
  B.caixa(-1.75, -0.7, Y, Y + 0.85, Z1, Z1 + 0.62, { frente: { k: 'freezer', modo: 'esticar' }, topo: { k: 'vidro', modo: 'esticar' }, base: null,
                                                    todas: { k: 'lisa', tinta: '#e6e4de' } });
  B.caixa(1.05, 1.78, Y, Y + 1.8, Z1, Z1 + 0.68, { frente: { k: 'geladeira', modo: 'esticar' }, base: null, todas: { k: 'lisa', tinta: '#c8322b' } });
  for (const bx of [-0.35, 0.2, 0.75]) banqueta(B, Lugar(bx, Z1 + 0.95, 0, Y), orla ? acento : '#a8362e');
  cocos(Vg, Lugar(2.2, 0.05, 0, Y), 11, rnd);
  for (let i = 0; i < 3; i++) esfera(Vg, [-0.4 + i * 0.24, Y + 0.95, Z1 + 0.28 + rnd.entre(-0.05, 0.05)], 0.1, 'coco', 6, 4);
  /* o telhado */
  const yB = Y + H;
  if (orla) {
    B.caixa(-2.6, 2.6, yB, yB + 0.16, -2.95, 0.8, { topo: 'telha_metal', todas: { k: 'lisa', tinta: '#f4f3ee' } });
    B.pintar('#e2e2de');
    for (const s of [-1, 1]) tubo(B, [s * 2.4, Y, 0.5], [s * 2.4, yB, 0.5], 0.055, 'metal', 8);
    B.pintar(acento);
    B.caixa(-2.6, 2.6, yB + 0.16, yB + 0.62, 0.64, 0.8, { todas: 'lisa' });
    B.pintar(null);
    placa(placas, 'letreiro', nome, acento, '#ffffff', 0, yB + 0.39, 0.812, 0, 1, 4.6, 0.38);
  } else {
    B.telhado4(-2.55, 2.55, -3.15, 0.75, yB, 1.35, 'palha', 'palha');
    /* a beirada: a palha grossa caindo em volta */
    const cantos = [[-2.55, 0.75], [2.55, 0.75], [2.55, -3.15], [-2.55, -3.15]];
    for (let i = 0; i < 4; i++) {
      const p = cantos[i], q = cantos[(i + 1) % 4], U = unit([q[0] - p[0], 0, q[1] - p[1]]);
      B.ladrilhar(B.plano([p[0], yB - 0.2, p[1]], U, ALTO), B.ret(0, Math.hypot(q[0] - p[0], q[1] - p[1]), 0, 0.2), 'palha');
    }
    for (const s of [-1, 1]) varrer(B, [[s * 2.3, Y, 0.55], [s * 2.3, yB, 0.55]], [0.085, 0.075], 7, 'tronco');
    barra(B, [-2.45, yB - 0.07, 0.55], [2.45, yB - 0.07, 0.55], 0.13, 'madeira_velha');
    B.caixa(-1.25, 1.25, yB - 0.64, yB - 0.14, 0.51, 0.57, { todas: 'madeira_velha' });
    placa(placas, 'letreiro', nome, '#1f5f7a', '#f6f3ea', 0, yB - 0.39, 0.582, 0, 1, 2.3, 0.42);
  }
  /* as mesas pro lado do mar e o cardápio na areia, do lado do degrau */
  const cores = escolha(rnd, CORES_SOL), cadeira = orla ? '#f1efe9' : '#c8322b';
  for (const tx of [-2.4, 0, 2.4]) mesaComGuardaSol(x, Lugar(tx, 1.6, rnd.entre(-0.15, 0.15), Y), { cores, cadeira });
  cavalete(B, Lugar(1.35, 3.1, rnd.entre(-0.3, 0.1)));
}
/* O CALÇADÃO: 12 m de pedra portuguesa (a onda preta e branca corre ao
   longo da praia), o meio-fio e um pedaço da avenida atrás, a areia na
   frente com dois coqueiros, o chuveirão, a lixeira laranja no poste,
   o banco virado pro mar e o poste de luz da orla */
function pecaCalcadao(x) {
  const { B, E, rnd } = x;
  const L = 6, W = 2.1, Y = 0.15;
  E.caixa(-L, L, 0, Y, -W, W, { topo: 'pedra', base: null, frente: 'concreto_claro', tras: 'concreto_claro', dir: null, esq: null });
  E.caixa(-L, L, 0, Y + 0.004, -W, -W + 0.16, { topo: 'concreto', base: null, dir: null, esq: null, frente: null, tras: null });
  E.pintar('#5c5d61');
  E.tampa([[-L, -W - 1.6], [L, -W - 1.6], [L, -W], [-L, -W]], 0.004, 'concreto');
  E.pintar(null);
  E.tampa([[-L, W], [L, W], [L, W + 2.8], [-L, W + 2.8]], 0.004, 'areia');
  /* os coqueiros, na areia rente ao calçadão */
  x.arvore('coqueiro', -3.4, W + 0.9, rnd.entre(0, 6));
  x.arvore('coqueiro', 3.2, W + 1.3, rnd.entre(0, 6));
  /* o chuveirão: o ralo, a coluna, o braço e o chuveiro, e o botão */
  const cx = 0.8, cz = W - 0.55;
  B.pintar('#bdbab3');
  B.caixa(cx - 0.4, cx + 0.4, Y, Y + 0.035, cz - 0.4, cz + 0.4, { topo: 'metal', base: null, todas: 'lisa' });
  tubo(B, [cx, Y, cz], [cx, Y + 2.45, cz], 0.05, 'metal', 8);
  tubo(B, [cx, Y + 2.4, cz], [cx, Y + 2.4, cz + 0.42], 0.028, 'metal', 6);
  cilindro(B, AQUI, cx, cz + 0.45, Y + 2.3, Y + 2.37, 0.1, 'metal', 10);
  B.caixa(cx - 0.06, cx + 0.06, Y + 1.0, Y + 1.14, cz + 0.045, cz + 0.09, { todas: 'lisa' });
  B.pintar(null);
  /* a lixeira laranja no poste */
  const lx = -1.4, lz = -W + 0.45;
  B.pintar('#9a9ca0'); tubo(B, [lx, Y, lz], [lx, Y + 1.05, lz], 0.03, 'metal', 6);
  B.pintar('#e8772e');
  B.torno(lx, lz + 0.2, [[0.001, Y + 0.5], [0.17, Y + 0.5], [0.2, Y + 0.98], [0.21, Y + 1.0], [0.001, Y + 1.0]], 10, 'lisa');
  B.pintar(null);
  /* o banco virado pro mar: dois pés de concreto, o assento e o encosto de ripa */
  const bx = -4.3, bz = W - 0.62;
  for (const s of [-1, 1]) E.caixa(bx + s * 0.75 - 0.07, bx + s * 0.75 + 0.07, Y, Y + 0.42, bz - 0.24, bz + 0.2, { todas: 'concreto_claro', base: null });
  E.caixa(bx - 0.95, bx + 0.95, Y + 0.42, Y + 0.46, bz - 0.22, bz + 0.23, { topo: 'ripas', todas: 'ripas', base: null });
  paralelepipedo(E, [bx - 0.95, Y + 0.5, bz - 0.24], [1.9, 0, 0], [0, 0.36, -0.07], [0, 0, -0.035], 'ripas');
  for (const s of [-1, 1]) barra(E, [bx + s * 0.75, Y + 0.42, bz - 0.24], [bx + s * 0.75, Y + 0.86, bz - 0.33], 0.06, 'concreto_claro');
  /* o poste da orla: a coluna, o braço pra avenida e a luminária */
  const px = 3.0, pz = -W + 0.3;
  B.pintar('#6f7378');
  tubo(B, [px, Y, pz], [px, Y + 7.6, pz], 0.085, 'metal', 8);
  tubo(B, [px, Y + 7.5, pz], [px, Y + 7.7, pz - 1.4], 0.04, 'metal', 6);
  B.caixa(px - 0.16, px + 0.16, Y + 7.58, Y + 7.72, pz - 1.75, pz - 1.2, { todas: 'lisa' });
  B.pintar('#f4f1e2');
  B.caixa(px - 0.13, px + 0.13, Y + 7.56, Y + 7.58, pz - 1.72, pz - 1.23, { base: 'lisa', todas: null });
  B.pintar(null);
}
/* A BEIRA DO MAR: a areia seca, a molhada, a espuma na linha d'água, o
   raso que escurece pro fundo, a espuma da onda que já quebrou e a onda
   quebrando — de crista branca, o lábio caindo pra frente no meio e o
   ombro baixo nas pontas. Aqui o mar fica pro −z e a areia pro +z (quem
   olha vê a onda de frente). */
function pecaBeira(x) {
  const { E, rnd } = x;
  const X0 = -8, X1 = 8, y = 0.02, uvL = [E.cel('lisa')[0], E.cel('lisa')[1]];
  E.tampa([[X0, 2.2], [X1, 2.2], [X1, 6], [X0, 6]], 0.003, 'areia');
  E.pintar('#e0d6c8');
  E.tampa([[X0, -1.5], [X1, -1.5], [X1, 2.2], [X0, 2.2]], 0.002, 'areia');
  E.pintar(null);
  /* a água: a borda recortada na areia molhada e as faixas, do raso claro
     ao fundo escuro */
  const borda = xx => 0.55 + 0.28 * Math.sin(xx * 0.8 + 0.6) + 0.1 * Math.sin(xx * 2.3);
  const faixas = [[null, -0.9, '#a8dccf'], [-0.9, -2.4, '#6cbcb2'], [-2.4, -4.0, '#4ba4a6'], [-4.0, -6.0, '#3a8fa0'], [-6.0, -8.5, '#2f7d95']];
  for (const [za, zb, cor] of faixas) {
    E.pintar(cor);
    for (let xx = X0; xx < X1 - 1e-6; xx += 1) {
      const a = za === null ? borda(xx) : za, b = za === null ? borda(xx + 1) : za;
      E.poli([[xx, y, a], [xx + 1, y, b], [xx + 1, y, zb], [xx, y, zb]], [uvL, uvL, uvL, uvL]);
    }
  }
  /* a espuma: a linha d'água e a renda logo atrás, a da onda que quebrou
     e as manchas soltas */
  E.pintar('#f2f6f4');
  const faixaDeEspuma = (f, larg, y1) => {
    for (let xx = X0; xx < X1 - 1e-6; xx += 0.5) {
      const a = f(xx), b = f(xx + 0.5);
      E.poli([[xx, y1, a], [xx + 0.5, y1, b], [xx + 0.5, y1, b - larg(xx + 0.5)], [xx, y1, a - larg(xx)]],
             [uvL, uvL, uvL, uvL]);
    }
  };
  faixaDeEspuma(xx => borda(xx) + 0.02, () => 0.22, y + 0.008);
  faixaDeEspuma(xx => -0.25 + 0.2 * Math.sin(xx * 1.3 + 2), xx => 0.08 + 0.06 * Math.max(0, Math.sin(xx * 3.1)), y + 0.006);
  faixaDeEspuma(xx => -2.3 + 0.3 * Math.sin(xx * 0.7 + 1), xx => 0.5 + 0.45 * Math.max(0, Math.sin(xx * 1.7 + 0.4)), y + 0.006);
  for (let i = 0; i < 10; i++) {
    const cx = rnd.entre(X0 + 1, X1 - 1), cz = rnd.entre(-3.9, -1.2), r = rnd.entre(0.15, 0.45), n = 6, pts = [];
    for (let j = 0; j < n; j++) { const t = j / n * 2 * Math.PI; const rr = r * rnd.entre(0.6, 1.2); pts.push([cx + rr * Math.cos(t), y + 0.007, cz + rr * Math.sin(t) * 0.6]); }
    E.poli(pts, pts.map(() => uvL));
  }
  E.pintar(null);
  /* a onda: o perfil (z pra frente, y) entre o do ombro (0) e o da onda
     quebrando (1), com a cor de cada trecho — a água verde subindo, a
     crista e o lábio brancos, a sombra embaixo do lábio e a espuma no pé */
  const OMBRO = [[-3.0, 0], [-1.7, 0.08], [-0.8, 0.22], [-0.25, 0.32], [0.25, 0.32], [0.7, 0.24], [0.9, 0.18], [1.2, 0.12], [1.6, 0.06], [2.2, 0.0]];
  const QUEBRA = [[-3.0, 0], [-1.7, 0.12], [-0.8, 0.5], [-0.25, 0.9], [0.25, 0.98], [0.75, 0.72], [0.45, 0.6], [0.2, 0.42], [0.35, 0.13], [0.95, 0.0]];
  const COR_OMBRO = ['#2f7f95', '#3a8f9e', '#469aa2', '#4ea2a6', '#4ba0a5', '#469aa2', '#4299a0', '#3f95a0', '#3d93a0'];
  const COR_QUEBRA = ['#2f7f95', '#3a92a0', '#5cb8ae', '#eef4f1', '#f4f8f6', '#e2ece9', '#2f7d8c', '#62bdb0', '#eaf2ef'];
  const mistura = (c0, c1, t) => {
    const h = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
    const a = h(c0), b = h(c1);
    return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
  };
  const pico = rnd.entre(-2.5, 1.5), N = 20, zW = xx => -5.0 + 0.35 * Math.sin(xx / 4 + 0.7);
  const quebra = xx => Math.pow(clamp(1 - Math.abs(xx - pico) / 5.5, 0, 1), 1.4);
  const ponta = xx => clamp((8 - Math.abs(xx)) / 2.2, 0, 1);
  const secao = xx => {
    const b = quebra(xx), e = ponta(xx), z0 = zW(xx);
    return OMBRO.map((p, i) => [xx, y + lerp(p[1], QUEBRA[i][1], b) * e * 1.5, z0 + lerp(p[0], QUEBRA[i][0], b) * 1.2]);
  };
  for (let i = 0; i < N; i++) {
    const xa = X0 + (X1 - X0) * i / N, xb = X0 + (X1 - X0) * (i + 1) / N, A = secao(xa), Bs = secao(xb), bm = quebra((xa + xb) / 2);
    for (let j = 0; j < A.length - 1; j++) {
      E.pintar(mistura(COR_OMBRO[j], COR_QUEBRA[j], bm));
      E.poli([A[j], Bs[j], Bs[j + 1], A[j + 1]], [uvL, uvL, uvL, uvL]);
    }
  }
  E.pintar(null);
}
/* A JANGADA: os seis paus de piúba que se juntam e levantam na proa, as
   travessas, o banco da vela, o mastro, a retranca, a vela triangular de
   valuma curva (com o remendo e o número) enfunada, o leme e o isopor do
   peixe. Deitada no mar: a proa pro +x. */
function pecaJangada(x) {
  const { B, rnd } = x;
  const n = 6, L = 6.2;
  for (let i = 0; i < n; i++) {
    const f = (i - (n - 1) / 2) / ((n - 1) / 2), af = Math.abs(f);
    const z0 = f * 0.72, z1 = f * 0.34, r = 0.15 - 0.02 * af;
    const x0 = -L / 2 + (af > 0.9 ? 0.3 : 0), x1 = L / 2 - af * 0.4;
    const pts = [[x0, 0.02, z0], [0, 0.03, z0 * 0.97], [x1 - 1.4, 0.06, lerp(z0, z1, 0.62)], [x1, 0.22 + 0.04 * (1 - af), z1]];
    varrer(B, pts, [r, r, r * 0.95, r * 0.75], 7, 'tronco');
  }
  for (const tx of [-2.3, -0.7, 1.3]) B.caixa(tx - 0.06, tx + 0.06, 0.13, 0.24, -0.78, 0.78, { todas: 'madeira_velha' });
  /* o banco da vela e o do mestre */
  B.caixa(1.1, 1.5, 0.52, 0.57, -0.55, 0.55, { todas: 'madeira_velha' });
  for (const s of [-1, 1]) B.caixa(1.25, 1.35, 0.2, 0.52, s * 0.45 - 0.05, s * 0.45 + 0.05, { todas: 'madeira_velha' });
  B.caixa(-2.7, -2.3, 0.35, 0.4, -0.4, 0.4, { todas: 'madeira_velha' });
  for (const s of [-1, 1]) B.caixa(-2.55, -2.45, 0.2, 0.35, s * 0.3 - 0.05, s * 0.3 + 0.05, { todas: 'madeira_velha' });
  /* o mastro e a retranca */
  const tack = [1.28, 1.15, 0], head = [1.12, 6.0, 0], clew = [-2.75, 1.28, 0.55];
  tubo(B, [1.3, 0.2, 0], [1.1, 6.25, 0], 0.06, 'madeira_velha', 7);
  tubo(B, [1.25, 1.1, 0], soma(clew, [-0.15, -0.02, 0.03]), 0.045, 'madeira_velha', 6);
  /* a vela: a testa no mastro, o pé na retranca, a valuma curva pra fora;
     a barriga pro +z (o vento vem do −z) */
  const d = unit(sub(head, clew)), fora = [-d[1], d[0], 0], roach = 0.55;
  const testa = t => [lerp(tack[0], head[0], t), lerp(tack[1], head[1], t), 0];
  const valuma = t => { const p = soma(clew, esc(sub(head, clew), t)); return [p[0] + fora[0] * roach * Math.sin(Math.PI * t), p[1] + fora[1] * roach * Math.sin(Math.PI * t), 0]; };
  const plano = (s, t) => { const a = testa(t), b = valuma(t); return [lerp(a[0], b[0], s), lerp(a[1], b[1], s)]; };
  const NS = 6, NT = 8;
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (let i = 0; i <= NS; i++) for (let j = 0; j <= NT; j++) { const [px, py] = plano(i / NS, j / NT); xmin = Math.min(xmin, px); xmax = Math.max(xmax, px); ymin = Math.min(ymin, py); ymax = Math.max(ymax, py); }
  const c = B.cel('vela');
  const ponto = (s, t) => { const [px, py] = plano(s, t); return [px, py, clew[2] * s * (1 - t) + 0.5 * Math.sin(Math.PI * s) * Math.pow(1 - t, 0.8)]; };
  const uvDe = (s, t) => { const [px, py] = plano(s, t); return [lerp(c[0], c[2], (px - xmin) / (xmax - xmin)), lerp(c[1], c[3], (py - ymin) / (ymax - ymin))]; };
  for (let i = 0; i < NS; i++) for (let j = 0; j < NT; j++) {
    const s0 = i / NS, s1 = (i + 1) / NS, t0 = j / NT, t1 = (j + 1) / NT;
    if (j === NT - 1) B.tri(ponto(s0, t0), ponto(s1, t0), ponto(s0, t1), uvDe(s0, t0), uvDe(s1, t0), uvDe(s0, t1));
    else B.poli([ponto(s0, t0), ponto(s1, t0), ponto(s1, t1), ponto(s0, t1)], [uvDe(s0, t0), uvDe(s1, t0), uvDe(s1, t1), uvDe(s0, t1)]);
  }
  /* o leme, que entra na água atrás, e a cana */
  const dl = unit([-0.45, -1, 0]);
  paralelepipedo(B, [-2.95, 0.78, -0.025], esc(dl, 1.3), esc(unit([-1, 0.45, 0]), 0.3), [0, 0, 0.05], 'madeira_velha');
  barra(B, [-3.0, 0.72, 0], [-2.2, 0.62, 0.1], 0.04, 'madeira_velha');
  isopor(B, Lugar(-1.6, 0.35, rnd.entre(-0.4, 0.4), 0.24));
  if (rnd() < 0.7) isopor(B, Lugar(-0.1, -0.4, rnd.entre(-0.4, 0.4), 0.24), { larg: 0.5 });
}
/* O BARCO DE PESCA: o casco de madeira pintado de faixa (a antivegetativa
   vermelha na linha d'água), o costado e o fundo por dentro, a borda, a
   casaria branca de teto azul com a janela e a porta, o mastro, o cano
   de descarga, a tampa do porão, os pneus de defensa e o nome na popa
   e na proa. A proa pro +x. A esteira de espuma (o 2D desenha) é do barco
   andando: fica pro efeito do jogo, não pro modelo. */
function pecaBarco(x) {
  const { B, rnd, placas } = x;
  /* as seções: x, meia boca na borda, altura da borda, meia boca no
     encolamento, altura dele, e a quilha */
  const SEC = [[-3.6, 0.95, 0.78, 0.76, -0.15, -0.35], [-2.4, 1.12, 0.78, 0.9, -0.2, -0.45], [-0.8, 1.2, 0.8, 0.95, -0.22, -0.5],
               [0.8, 1.15, 0.88, 0.85, -0.2, -0.5], [2.2, 0.92, 1.0, 0.55, -0.1, -0.45], [3.2, 0.55, 1.14, 0.22, 0.1, -0.3], [3.95, 0.03, 1.28, 0.02, 0.62, 0.3]];
  const secao = ([sx, bG, yG, bC, yC, yK], s) => [[sx, yK, 0], [sx, yC, s * bC], [sx, lerp(yC, yG, 0.5), s * (lerp(bC, bG, 0.5) + 0.05 * bG)], [sx, yG, s * bG]];
  const c = B.cel('casco'), U0 = lerp(c[0], c[2], 0.1), U1 = lerp(c[0], c[2], 0.9);
  const vDe = (p, yG) => lerp(c[1], c[3], clamp((p[1] + 0.25) / (yG + 0.25), 0, 1));
  for (const s of [1, -1]) {
    for (let i = 0; i < SEC.length - 1; i++) {
      const A = secao(SEC[i], s), Bq = secao(SEC[i + 1], s);
      for (let j = 0; j < A.length - 1; j++)
        B.poli([A[j], Bq[j], Bq[j + 1], A[j + 1]], [[U0, vDe(A[j], SEC[i][2])], [U1, vDe(Bq[j], SEC[i + 1][2])], [U1, vDe(Bq[j + 1], SEC[i + 1][2])], [U0, vDe(A[j + 1], SEC[i][2])]]);
    }
  }
  /* o espelho de popa */
  const P0 = secao(SEC[0], 1), P1 = secao(SEC[0], -1), yG0 = SEC[0][2];
  const popa = [P0[0], P0[1], P0[2], P0[3], P1[3], P1[2], P1[1]];
  B.poli(popa, popa.map(p => [lerp(c[0], c[2], 0.5 + p[2] * 0.2), vDe(p, yG0)]));
  /* por dentro: o fundo, o costado e a borda (a tábua de cima, azul) */
  const yF = 0.12, meia = sc => { const [, bG, yG, bC, yC] = sc; return lerp(bC, bG, clamp((yF - yC) / (yG - yC), 0, 1)); };
  B.pintar('#8a7a64');
  for (let i = 0; i < SEC.length - 2; i++) {
    const a = SEC[i], b = SEC[i + 1], wa = meia(a) - 0.05, wb = meia(b) - 0.05;
    B.ladrilhar(B.plano([a[0], yF, 0], [1, 0, 0], [0, 0, -1]), [[0, -wa], [b[0] - a[0], -wb], [b[0] - a[0], wb], [0, wa]], 'madeira_velha');
  }
  B.pintar('#d8d2c3');
  for (const s of [1, -1]) for (let i = 0; i < SEC.length - 1; i++) {
    const a = SEC[i], b = SEC[i + 1];
    pano(B, [[a[0], yF, s * (meia(a) - 0.05)], [b[0], yF, s * (meia(b) - 0.05)], [b[0], b[2], s * Math.max(0.01, b[1] - 0.06)], [a[0], a[2], s * (a[1] - 0.06)]], 'lisa');
  }
  B.pintar('#2f5a86');
  for (const s of [1, -1]) for (let i = 0; i < SEC.length - 1; i++) {
    const a = SEC[i], b = SEC[i + 1];
    pano(B, [[a[0], a[2] + 0.04, s * (a[1] + 0.02)], [b[0], b[2] + 0.04, s * (b[1] + 0.02)], [b[0], b[2] + 0.04, s * Math.max(0, b[1] - 0.08)], [a[0], a[2] + 0.04, s * (a[1] - 0.08)]], 'lisa');
    pano(B, [[a[0], a[2] - 0.03, s * (a[1] + 0.02)], [b[0], b[2] - 0.03, s * (b[1] + 0.02)], [b[0], b[2] + 0.04, s * (b[1] + 0.02)], [a[0], a[2] + 0.04, s * (a[1] + 0.02)]], 'lisa');
  }
  barra(B, [3.9, 0.3, 0], [4.02, 1.36, 0], 0.07, 'lisa');
  B.pintar(null);
  /* a casaria: branca, de teto azul, a janela na frente e dos lados e a
     porta atrás */
  const cx0 = -2.6, cx1 = -0.9, cz = 0.72, h = 1.95;
  B.pintar('#f2f1ec');
  const jan = (a0, a1) => ({ a0, a1, b0: 1.05, b1: 1.65, k: 'vidro', fundo: 0.04 });
  B.fachada(B.plano([cx1, yF, cz], [0, 0, -1], ALTO), 2 * cz, h, 'tabuas', [jan(0.15, 0.68), jan(0.76, 1.29)]);
  B.fachada(B.plano([cx0, yF, cz], [1, 0, 0], ALTO), cx1 - cx0, h, 'tabuas', [jan(0.5, 1.2)]);
  B.fachada(B.plano([cx1, yF, -cz], [-1, 0, 0], ALTO), cx1 - cx0, h, 'tabuas', [jan(0.5, 1.2)]);
  B.fachada(B.plano([cx0, yF, -cz], [0, 0, 1], ALTO), 2 * cz, h, 'tabuas', [{ a0: 0.45, a1: 1.0, b0: 0, b1: 1.75, k: 'madeira_velha', fundo: 0.04 }]);
  B.pintar('#2f5a86');
  B.caixa(cx0 - 0.12, cx1 + 0.18, yF + h, yF + h + 0.08, -cz - 0.1, cz + 0.1, { todas: 'lisa' });
  B.pintar('#9fa3a6');
  tubo(B, [-1.7, yF + h + 0.08, 0], [-1.7, yF + h + 1.5, 0], 0.03, 'metal', 6);
  barra(B, [-1.7, yF + h + 1.1, -0.35], [-1.7, yF + h + 1.1, 0.35], 0.03, 'metal');
  B.pintar('#2b2b2b');
  tubo(B, [-2.35, yF + h - 0.4, -cz - 0.06], [-2.35, yF + h + 0.55, -cz - 0.06], 0.045, 'metal', 6);
  B.pintar(null);
  /* a tampa do porão e os pneus velhos de defensa no costado */
  B.pintar('#3f7fa8');
  B.caixa(0.2, 1.4, yF, yF + 0.32, -0.5, 0.5, { topo: 'madeira_velha', base: null, todas: 'madeira_velha' });
  B.pintar(null);
  for (const s of [1, -1]) for (const px of [-1.6, 0.6]) {
    const b = SEC[px < 0 ? 1 : 3][1];
    toro(B, [px, 0.45, s * (b + 0.1)], [1, 0, 0], ALTO, 0.2, 0.07, 'lisa', ['#262626', '#303030'], 10, 5);
  }
  /* o nome: na popa e dos dois lados da proa */
  const nome = escolha(rnd, ['DEUS É FIEL', 'SÃO PEDRO', 'MAR DE PAZ', 'NOSSA SENHORA', 'ESTRELA GUIA']);
  placa(placas, 'pintado', nome, '#f2f2ee', '#2f5a86', -3.63, 0.42, 0, -1, 0, 1.3, 0.24);
  for (const s of [1, -1]) {
    const xa = 1.6, xb = 2.9, ba = 1.0, bb = 0.72, len = Math.hypot(xb - xa, bb - ba);
    const nx = (ba - bb) / len, nz = s * (xb - xa) / len;
    placa(placas, 'pintado', nome, '#f2f2ee', '#2f5a86', (xa + xb) / 2 + nx * 0.05, 0.62, s * ((ba + bb) / 2) + nz * 0.05, nx, nz, 1.25, 0.22);
  }
}

/* =======================================================
   O CATÁLOGO
   ======================================================= */
const MAR = '#3f86a0', AREIA = '#dccb9e';
export const PECAS_PRAIA = {
  guarda_sol: { nome: 'Guarda-sol', grupo: 'Areia', montar: pecaGuardaSol,
    nota: 'O guarda-sol de oito gomos fincado na areia, com as duas cadeiras de alumínio na sombra, a canga na frente, o isopor e a prancha.' },
  mesa: { nome: 'Mesa com guarda-sol', grupo: 'Areia', montar: pecaMesa,
    nota: 'A mesa de plástico da cervejaria, com o guarda-sol que atravessa o tampo e as quatro cadeiras — a do quiosque, solta.' },
  barraca: { nome: 'Barraca', grupo: 'Areia', montar: pecaBarraca,
    nota: 'A lona de duas águas nos seis paus, com o babado do nome; embaixo, a mesa, as cadeiras, os isopores, a pilha de cadeira e o coco.' },
  posto: { nome: 'Posto de guarda-vidas', grupo: 'Areia', montar: pecaPosto,
    nota: 'A cabine vermelha no tablado de quase 2 m, o telhado branco, a escada, a bandeira vermelha e amarela, a boia e a prancha de resgate.' },
  quadra: { nome: 'Quadra de vôlei', grupo: 'Areia', montar: pecaQuadra,
    nota: 'A quadra oficial de 16 × 8 m de fita azul, a rede a 2,43 m com a faixa branca e as antenas, os postes com a espuma e os estais.' },
  quiosque_palha: { nome: 'Quiosque de palha', grupo: 'Quiosque', montar: x => pecaQuiosque(x, false),
    nota: 'O do Nordeste: o deck, o corpo de tábua pintada, o telhado de palha nos esteios de tronco, o balcão de azulejo, o freezer, a geladeira e três mesas.' },
  quiosque_orla: { nome: 'Quiosque da orla', grupo: 'Quiosque', montar: x => pecaQuiosque(x, true),
    nota: 'O da orla da capital: o corpo de metal com a janela de vidro, a laje fina de beiral largo nas colunas e o letreiro em cima.' },
  calcadao: { nome: 'Calçadão', grupo: 'Calçadão', montar: pecaCalcadao,
    nota: '12 m de pedra portuguesa em onda, o meio-fio e a avenida atrás, os coqueiros na areia, o chuveirão, a lixeira laranja, o banco e o poste.' },
  beira: { nome: 'Beira do mar e onda', grupo: 'Mar', montar: pecaBeira,
    nota: 'A areia molhada, a espuma na linha d\'água, o raso que escurece pro fundo e a onda quebrando no meio, de lábio caindo, e baixa nas pontas.' },
  jangada: { nome: 'Jangada', grupo: 'Mar', chao: MAR, montar: pecaJangada,
    nota: 'Os seis paus que se juntam na proa, o banco, o mastro de 6 m e a vela triangular enfunada, com o remendo e o número; o leme e o isopor.' },
  barco: { nome: 'Barco de pesca', grupo: 'Mar', chao: MAR, montar: pecaBarco,
    nota: 'O casco branco de faixa azul com a antivegetativa vermelha, a casaria branca de teto azul, os pneus velhos de defensa e o nome na popa e na proa.' }
};
for (const p of Object.values(PECAS_PRAIA)) p.chao = p.chao || AREIA;

/* MONTA a peça `id` da praia com a `semente`, em (onde.x, onde.z) do
   mundo, girada de `onde.giro`: os blocos vão pra `destino` e os
   decalques voltam no mundo. `info`: a planta (largura × fundo), a altura e os triângulos.
   As listas: praia, equip, vegetacao, rede e, no coqueiro, folhagem. */
export function montarPecaDaPraia(id, onde = {}, destino = {}, semente = 1) {
  const peca = PECAS_PRAIA[id];
  if (!peca) throw new Error('praia3d: não conheço a peça ' + id);
  const rnd = sorteio(semente * 104729 + id.length * 7919 + id.charCodeAt(0));
  const B = Construtor('praia'), E = Construtor('equip'), Vg = Construtor('vegetacao'), R = Construtor('vegetacao'), placas = [];
  let arvores = 0;
  const caixa = [Infinity, -Infinity, 0, Infinity, -Infinity];            // x0, x1, altura, z0, z1
  const k = onde.escala || 1, c = Math.cos(onde.giro || 0), s = Math.sin(onde.giro || 0);
  const x = { B, E, Vg, R, rnd, placas,
    /* a árvore dentro da peça: o lugar dela no mundo sai do lugar da peça */
    arvore(especie, lx, lz, giro = 0) {
      const r = montarArvore(especie, { x: (onde.x || 0) + (lx * c - lz * s) * k * METRO, z: (onde.z || 0) + (lx * s + lz * c) * k * METRO,
                                        y: onde.y || 0, giro: (onde.giro || 0) + giro, escala: k }, destino, semente * 31 + arvores + 1);
      arvores += r.triangulos;
      caixa[0] = Math.min(caixa[0], lx - r.raio / k); caixa[1] = Math.max(caixa[1], lx + r.raio / k); caixa[2] = Math.max(caixa[2], r.altura / k);
      caixa[3] = Math.min(caixa[3], lz - r.raio / k); caixa[4] = Math.max(caixa[4], lz + r.raio / k);
    } };
  peca.montar(x);
  for (const C of [B, E, Vg, R]) for (let i = 0; i < C.pos.length; i += 3) {
    caixa[0] = Math.min(caixa[0], C.pos[i]); caixa[1] = Math.max(caixa[1], C.pos[i]); caixa[2] = Math.max(caixa[2], C.pos[i + 1]);
    caixa[3] = Math.min(caixa[3], C.pos[i + 2]); caixa[4] = Math.max(caixa[4], C.pos[i + 2]);
  }
  noMundo({ praia: B, equip: E, vegetacao: Vg, rede: R }, destino, onde);
  return {
    placas: placasNoMundo(placas, onde),
    info: { larg: (caixa[1] - caixa[0]) * k, fundo: (caixa[4] - caixa[3]) * k, altura: caixa[2] * k,
            triangulos: (B.pos.length + E.pos.length + Vg.pos.length + R.pos.length) / 9 + arvores }
  };
}
