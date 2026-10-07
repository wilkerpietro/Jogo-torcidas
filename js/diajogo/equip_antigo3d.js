/* =========================================================
   OS EQUIPAMENTOS ANTIGOS DO BAIRRO — o hospital, a delegacia, a
   escola, o posto e o shopping
   ---------------------------------------------------------
   Os cinco eram caixas de cor lisa: as peças que `dados/cena_estadio.js`
   monta em "OS EQUIPAMENTOS DO BAIRRO" (o bloco, a marquise, o pilar, o
   muro, a bomba, o totem) desenhadas uma a uma como caixote. Aqui eles
   ganham a roupa da cidade — a MESMA folha das casas (`casas`, e a
   `grades` pro gradil), então não custam material nem chamada de
   desenho a mais: entram nas malhas de casa do pedaço de cidade.

   QUEM MANDA NO LUGAR É A PLANTA. O modelo sai das mesmas peças, nas
   mesmas medidas: o bloco que tranca na máscara é o volume do prédio, o
   pilar é o pilar, o muro é o muro, a bomba é a bomba. Nada do que
   bloqueia muda de lugar; o modelo só veste. E nada passa da borda do
   miolo da quadra (a calçada): na face que encosta nela não sai friso,
   cornija nem beiral. O que o modelo não veste (o carro, a árvore, o
   poste, o mastro, o letreiro, o piso pintado, a tabela de basquete)
   continua com quem desenhava antes — `feitas` diz o que já foi.

     HOSPITAL MUNICIPAL  a lâmina de 4 andares com a janela de fita (o
                         módulo de 3 m por andar, ladrilhado), os frisos
                         das lajes, o andar de cima liso onde vão a cruz
                         e o nome, a platibanda, a casa de máquinas e a
                         caixa d'água no teto; a ala de 2 andares; o
                         pronto-socorro com a porta de vidro e a marquise
                         vermelha de testeira alta; o muro baixo com o
                         gradil branco.
     3º DISTRITO         o prédio de repartição de 2 andares: reboco
                         creme, barrado cinza-azulado, a janela de ferro
                         com grade, a porta de duas folhas no pórtico de
                         4 pilares, o friso entre os andares, a cornija,
                         a antena de rádio no teto; a guarita de beiral.
     ESCOLA MUNICIPAL    os pilares de concreto marcando os vãos, a fita
                         de vitrô de ferro, o barrado azul, o cobogó da
                         escada, a passarela coberta, o muro de barrado.
     POSTO               a conveniência de vitrine com a faixa vermelha,
                         a cobertura com a testeira e o forro de
                         luminária, os pilares, as ilhas de concreto, as
                         bombas e o totem de preço. A marca é NOSSA.
     SHOPPING BEIRA-MAR  a caixa de placa de concreto com a faixa azul,
                         as vitrines do térreo, a torre de vidro da
                         entrada com a marca, a marquise de vidro, as
                         claraboias e as máquinas de ar no teto, o totem.

   O REFERENCIAL é o do mundo, em metros: x = x da planta / METRO, z = y
   da planta / METRO (o sul é +z), y pra cima. Nada gira: os cinco são
   alinhados com a quadra e olham pro sul, que é a frente das peças.
   ========================================================= */
import { Construtor, METRO, mureta } from './construtor3d.js';

const M = METRO;
export const TIPOS_ANTIGOS = new Set(['hospital', 'delegacia', 'escola', 'posto', 'shopping']);

/* ---- a régua ---- */
const emM = o => ({ x0: o.x0 / M, x1: o.x1 / M, z0: o.y0 / M, z1: o.y1 / M });
const cantos = r => [[r.x0, r.z1], [r.x1, r.z1], [r.x1, r.z0], [r.x0, r.z0]];
const cruza = (p, q, m = 0) => p.a0 < q.a1 + m && q.a0 < p.a1 + m && p.b0 < q.b1 + m && q.b0 < p.b1 + m;
const nova = () => ({ B: Construtor('casas'), G: Construtor('grades'), L: { quads: [] } });

/* ---- A VERSÃO DE LONGE ----
   De longe o jogo desenha o prédio sem textura, em cor por vértice (ver
   `ladrilhos3d.js`), e o mapa de alturas automático fazia do hospital uma
   caixa cinza lisa. Aqui o próprio modelo diz a sua: a caixa na cor da
   parede, a laje, e rente às faces as faixas de janela, as portas, o
   barrado e as faixas de cor — o que faz o prédio ser reconhecido a
   100 m, em umas dezenas de triângulos. Cada quadrado guarda a peça da
   folha e a tinta; a cor sai no fim, da média da peça (`opc.medias`). */
const lQuad = (L, a, b, c, d, k, tinta) => L.quads.push({ p: [a, b, c, d], k, tinta: tinta || null });
function lCaixa(L, r, y0, y1, k, tinta, kTopo = 'laje', lados = ['s', 'n', 'l', 'o']) {
  const P = { s: [[r.x0, r.z1], [r.x1, r.z1]], n: [[r.x1, r.z0], [r.x0, r.z0]], l: [[r.x1, r.z1], [r.x1, r.z0]], o: [[r.x0, r.z0], [r.x0, r.z1]] };
  for (const lado of lados) { const [[ax, az], [bx, bz]] = P[lado]; lQuad(L, [ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], k, tinta); }
  if (kTopo) lQuad(L, [r.x0, y1, r.z1], [r.x1, y1, r.z1], [r.x1, y1, r.z0], [r.x0, y1, r.z0], kTopo, null);
}
/* os vãos de uma face (janela, porta, barrado, faixa de cor), 3 cm fora dela */
function lVaos(L, face, vaos) {
  const F = face.F, N = F.N;
  const P = (a, b) => [0, 1, 2].map(i => F.O[i] + F.U[i] * a + F.V[i] * b + N[i] * 0.03);
  for (const v of vaos) if (v.k) lQuad(L, P(v.a0, v.b0), P(v.a1, v.b0), P(v.a1, v.b1), P(v.a0, v.b1), v.k, v.tinta);
}
/* a fachada de módulos de longe: a faixa escura das janelas em cada
   andar, menos os painéis lisos, e as peças (a porta, a cruz) */
function lModulos(L, face, andares, m) {
  const { th, lisos, pecas } = m;
  const faixas = [];
  for (let k = 0; k < andares; k++)
    faixas.push(...menos({ a0: 0.2, a1: face.larg - 0.2, b0: k * th + th * 0.32, b1: k * th + th * 0.78 }, lisos));
  lVaos(L, face, faixas.map(q => ({ ...q, k: 'jan_alu4' })).concat(pecas));
}
const sRGBpraLinear = h => {
  const n = parseInt(String(h).slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
};

/* as quatro faces de um retângulo em planta: o plano de cada uma (O no
   canto de baixo à esquerda de quem olha de fora, U pra direita, V pra
   cima), a largura e onde cai nela um ponto de mundo (x, z) */
function facesDe(B, r, y0 = 0) {
  return {
    s: { F: B.plano([r.x0, y0, r.z1], [1, 0, 0], [0, 1, 0]), larg: r.x1 - r.x0, a: (x, z) => x - r.x0 },
    n: { F: B.plano([r.x1, y0, r.z0], [-1, 0, 0], [0, 1, 0]), larg: r.x1 - r.x0, a: (x, z) => r.x1 - x },
    l: { F: B.plano([r.x1, y0, r.z1], [0, 0, -1], [0, 1, 0]), larg: r.z1 - r.z0, a: (x, z) => r.z1 - z },
    o: { F: B.plano([r.x0, y0, r.z0], [0, 0, 1], [0, 1, 0]), larg: r.z1 - r.z0, a: (x, z) => z - r.z0 }
  };
}
/* a face em que está um letreiro (ou a cruz) da planta, se é deste bloco */
function faceDoDizer(o, r) {
  const x = o.x / M, z = o.y / M, dentroX = x > r.x0 - 0.3 && x < r.x1 + 0.3, dentroZ = z > r.z0 - 0.3 && z < r.z1 + 0.3;
  if (o.oz > 0 && Math.abs(z - r.z1) < 0.5 && dentroX) return 's';
  if (o.oz < 0 && Math.abs(z - r.z0) < 0.5 && dentroX) return 'n';
  if (o.ox > 0 && Math.abs(x - r.x1) < 0.5 && dentroZ) return 'l';
  if (o.ox < 0 && Math.abs(x - r.x0) < 0.5 && dentroZ) return 'o';
  return null;
}
/* o retângulo (na face) que o letreiro ocupa, com uma folga em volta */
function lugarDoDizer(o, f, folga = 0) {
  const c = f.a(o.x / M, o.y / M), w = (o.larg || 120) / M, b0 = (o.base || 24) / M, h = (o.altura || 20) / M;
  return { a0: c - w / 2 - folga, a1: c + w / 2 + folga, b0: b0 - folga, b1: b0 + h + folga };
}
/* quais lados do retângulo encostam na borda do miolo da quadra */
const bordaDe = (r, lim) => lim
  ? { n: Math.abs(r.z0 * M - lim.y0) < 2, s: Math.abs(r.z1 * M - lim.y1) < 2, o: Math.abs(r.x0 * M - lim.x0) < 2, l: Math.abs(r.x1 * M - lim.x1) < 2 }
  : { n: false, s: false, o: false, l: false };

/* um retângulo menos outros (que não se cruzam entre si): as faixas que
   sobram, sem sobreposição */
function menos(R, furos) {
  let pecas = [R];
  for (const f of furos) {
    const novas = [];
    for (const p of pecas) {
      if (f.a0 >= p.a1 || f.a1 <= p.a0 || f.b0 >= p.b1 || f.b1 <= p.b0) { novas.push(p); continue; }
      if (f.a0 > p.a0) novas.push({ a0: p.a0, a1: f.a0, b0: p.b0, b1: p.b1 });
      if (f.a1 < p.a1) novas.push({ a0: f.a1, a1: p.a1, b0: p.b0, b1: p.b1 });
      const a0 = Math.max(p.a0, f.a0), a1 = Math.min(p.a1, f.a1);
      if (f.b0 > p.b0) novas.push({ a0, a1, b0: p.b0, b1: f.b0 });
      if (f.b1 < p.b1) novas.push({ a0, a1, b0: f.b1, b1: p.b1 });
    }
    pecas = novas;
  }
  return pecas.filter(p => p.a1 - p.a0 > 1e-3 && p.b1 - p.b0 > 1e-3);
}

/* A FACHADA DE MÓDULOS: a peça `cel` (um vão de um andar: a janela e a
   parede em volta) ladrilhada na face inteira, na grade dos andares. As
   `especiais` tomam o lugar dos módulos: o módulo que uma delas toca
   vira parede lisa inteiro (a mesma tinta) e a peça dela (`k`: a porta,
   a cruz) entra no meio; sem `k` fica só o liso — é o painel onde o
   letreiro da planta vai colado. */
function fachadaModulos(B, F, larg, alt, andares, cel, tinta, especiais = []) {
  const nCol = Math.max(1, Math.round(larg / B.cel(cel)[4]));
  const tw = larg / nCol, th = alt / andares;
  let lisos = especiais.map(e => ({
    a0: Math.max(0, Math.floor(e.a0 / tw + 1e-3)) * tw, a1: Math.min(nCol, Math.ceil(e.a1 / tw - 1e-3)) * tw,
    b0: Math.max(0, Math.floor(e.b0 / th + 1e-3)) * th, b1: Math.min(andares, Math.ceil(e.b1 / th - 1e-3)) * th }));
  for (let mudou = true; mudou;) {
    mudou = false;
    for (let i = 0; i < lisos.length && !mudou; i++) for (let j = i + 1; j < lisos.length && !mudou; j++) {
      const p = lisos[i], q = lisos[j];
      if (cruza(p, q, -1e-6)) {
        lisos[i] = { a0: Math.min(p.a0, q.a0), a1: Math.max(p.a1, q.a1), b0: Math.min(p.b0, q.b0), b1: Math.max(p.b1, q.b1) };
        lisos.splice(j, 1); mudou = true;
      }
    }
  }
  const pecas = especiais.filter(e => e.k);
  const vaos = pecas.map(e => Object.assign({}, e));
  for (const L of lisos) for (const q of menos(L, pecas)) vaos.push({ ...q, k: 'lisa', modo: 'ladrilho', tinta });
  B.fachada(F, larg, alt, cel, vaos, { tinta, tw, th });
  return { tw, th, lisos, pecas };
}

/* O FRISO: a tira de concreto em volta do prédio na altura `y`, saltando
   `sai` — só onde a face não encosta na calçada. Em cima e embaixo, só o
   lábio que salta (a tampa inteira seria um teto por cima da laje). */
function friso(B, r, y, h, sai, tinta, borda) {
  const d = k => borda[k] ? 0 : sai;
  const X0 = r.x0 - d('o'), X1 = r.x1 + d('l'), Z0 = r.z0 - d('n'), Z1 = r.z1 + d('s');
  const lado = { k: 'laje_borda', tinta, tw: 4, th: h };
  B.caixa(X0, X1, y, y + h, Z0, Z1, { frente: borda.s ? null : lado, tras: borda.n ? null : lado,
                                      dir: borda.l ? null : lado, esq: borda.o ? null : lado, topo: null, base: null });
  const labios = [];
  if (!borda.s) labios.push([X0, X1, r.z1, Z1]);
  if (!borda.n) labios.push([X0, X1, Z0, r.z0]);
  if (!borda.l) labios.push([r.x1, X1, r.z0, r.z1]);
  if (!borda.o) labios.push([X0, r.x0, r.z0, r.z1]);
  for (const [a0, a1, c0, c1] of labios) {
    B.esticar(B.plano([a0, y + h, c1], [1, 0, 0], [0, 0, -1]), 0, a1 - a0, 0, c1 - c0, 'laje_borda', { tinta });
    B.esticar(B.plano([a0, y, c0], [1, 0, 0], [0, 0, 1]), 0, a1 - a0, 0, c1 - c0, 'laje_borda', { tinta, escuro: 0.7 });
  }
}
/* o teto: a laje e a platibanda em volta (a face de fora continua a
   parede; `recuo` afasta um lado que encosta noutro bloco) */
function topo(B, r, H, tinta, hp = 0.9, recuo = {}) {
  const q = { x0: r.x0 + (recuo.o || 0), x1: r.x1 - (recuo.l || 0), z0: r.z0 + (recuo.n || 0), z1: r.z1 - (recuo.s || 0) };
  B.tampa(cantos(q), H + 0.02, 'laje', false);
  B.pintar(tinta);
  mureta(B, cantos(q), H, hp, 0.15, 'lisa');
  B.pintar(null);
}
/* uma casinha no teto (a casa de máquinas, a escada): quatro paredes de
   reboco, a porta de ferro num lado e a laje */
function casinha(B, r, y, h, tinta, porta) {
  const f = facesDe(B, r, y);
  for (const k of ['s', 'n', 'l', 'o']) {
    const L = f[k].larg;
    const vaos = porta === k && L > 1.2 ? [{ a0: L / 2 - 0.42, a1: L / 2 + 0.42, b0: 0, b1: Math.min(2.1, h - 0.3), k: 'porta_ferro', fundo: 0.05 }] : [];
    B.fachada(f[k].F, L, h, 'lisa', vaos, { tinta });
  }
  B.caixa(r.x0 - 0.08, r.x1 + 0.08, y + h, y + h + 0.12, r.z0 - 0.08, r.z1 + 0.08,
          { todas: { k: 'laje_borda', modo: 'esticar' }, topo: 'laje' });
}
/* a caixa d'água de concreto do prédio: a caixa em cima de quatro pés */
function caixaDagua(B, r, y, h) {
  for (const [x, z] of [[r.x0 + 0.25, r.z0 + 0.25], [r.x1 - 0.25, r.z0 + 0.25], [r.x0 + 0.25, r.z1 - 0.25], [r.x1 - 0.25, r.z1 - 0.25]])
    B.caixa(x - 0.14, x + 0.14, y, y + 0.7, z - 0.14, z + 0.14, { todas: 'crua', topo: null, base: null });
  B.caixa(r.x0, r.x1, y + 0.7, y + 0.7 + h, r.z0, r.z1, { todas: 'crua', base: { k: 'crua', escuro: 0.7 }, topo: 'laje' });
}
/* a paredinha lisa de um bloco pequeno, face por face: `vaosDe(lado)`
   diz os vãos de cada uma; o barrado (de 0 a `barra` m) é tirado dos
   vãos que descem até o chão */
function paredesComBarrado(B, r, H, tinta, barra, corBarra, vaosDe, lados = ['s', 'n', 'l', 'o'], L = null) {
  const f = facesDe(B, r);
  for (const lado of lados) {
    const { F, larg } = f[lado];
    const vaos = (vaosDe(lado, f[lado]) || []).filter(v => v.a0 >= -1e-6 && v.a1 <= larg + 1e-6);
    if (barra > 0) for (const q of menos({ a0: 0, a1: larg, b0: 0, b1: barra }, vaos.filter(v => v.b0 < barra)))
      vaos.push({ ...q, k: 'lisa', modo: 'ladrilho', tinta: corBarra });
    B.fachada(F, larg, H, 'lisa', vaos, { tinta });
    if (L) lVaos(L, f[lado], vaos);
  }
  if (L) lCaixa(L, r, 0, H, 'lisa', tinta, 'laje', lados);
  return f;
}
/* um pilar de seção quadrada, com o pé um palmo mais largo */
function pilar(B, x, z, e, y0, y1, tinta, pe = true) {
  B.caixa(x - e, x + e, y0, y1, z - e, z + e, { todas: { k: 'lisa', tinta }, topo: null, base: null });
  if (pe) B.caixa(x - e - 0.04, x + e + 0.04, y0, y0 + 0.25, z - e - 0.04, z + e + 0.04, { todas: { k: 'laje_borda', modo: 'esticar' }, base: null });
}
/* o muro de peça da planta: a mureta no meio da faixa, os pilaretes, e
   em cima o gradil (`gradil` = a altura dele) ou o muro cheio com o
   barrado */
function muroDePeca(C, o, tinta, gradil, corBarra) {
  const { B, G } = C, r = emM(o), H = o.alt / M;
  const emX = r.x1 - r.x0 >= r.z1 - r.z0, e = 0.12;
  const zc = (r.z0 + r.z1) / 2, xc = (r.x0 + r.x1) / 2, L = emX ? r.x1 - r.x0 : r.z1 - r.z0;
  const hm = gradil ? H - gradil : H;
  const q = emX ? { x0: r.x0, x1: r.x1, z0: zc - e, z1: zc + e } : { x0: xc - e, x1: xc + e, z0: r.z0, z1: r.z1 };
  paredesComBarrado(B, q, hm, tinta, corBarra ? Math.min(1.0, hm - 0.2) : 0, corBarra, () => []);
  /* o capeamento sai 4 cm dos dois lados compridos (nas pontas, não: ali pode ser a calçada) */
  const bx = emX ? 0 : 0.04, bz = emX ? 0.04 : 0;
  B.caixa(q.x0 - bx, q.x1 + bx, hm, hm + 0.06, q.z0 - bz, q.z1 + bz, { todas: { k: 'laje_borda', modo: 'esticar' }, base: null });
  const n = Math.max(1, Math.round(L / 2.6));
  for (let i = 0; i <= n; i++) {
    const t = Math.min(Math.max(L * i / n, 0.17), L - 0.17);
    const [x, z] = emX ? [r.x0 + t, zc] : [xc, r.z0 + t];
    B.caixa(x - 0.17, x + 0.17, 0, H + 0.04, z - 0.17, z + 0.17, { todas: { k: 'lisa', tinta }, base: null });
  }
  if (gradil) {
    const Fg = emX ? G.plano([r.x0, hm + 0.06, zc], [1, 0, 0], [0, 1, 0]) : G.plano([xc, hm + 0.06, r.z0], [0, 0, 1], [0, 1, 0]);
    G.ladrilhar(Fg, G.ret(0, L, 0, gradil - 0.1), 'gradil', { tw: 1.0, th: gradil - 0.1 });
  }
}

/* =======================================================
   O HOSPITAL MUNICIPAL
   ======================================================= */
function hospital(eq, P, lim) {
  const blocos = eq.pecas.filter(o => o.k === 'bloco').sort((a, b) => b.alt - a.alt);
  const A = blocos[0], Ala = blocos[1];
  const cruz = eq.pecas.find(o => o.k === 'cruz');
  const dizeres = eq.pecas.filter(o => o.k === 'letreiro');
  const marq = eq.pecas.find(o => o.k === 'marquise');
  const pilares = eq.pecas.filter(o => o.k === 'pilar');
  const muros = eq.pecas.filter(o => o.k === 'muro');
  P.feitas(A, Ala, cruz, marq, ...pilares, ...muros);
  const FRISO = '#bfbbb1';
  /* ---- a lâmina ---- */
  if (A) {
    const C = nova(), B = C.B, r = emM(A), H = A.alt / M, and = Math.max(1, Math.round(H / 3)), th = H / and;
    const borda = bordaDe(r, lim), f = facesDe(B, r), tinta = A.cor;
    const especiais = { s: [], n: [], l: [], o: [] };
    if (cruz) {
      const t = cruz.tam / M, lado = faceDoDizer(cruz, r) || 's', c = f[lado].a(cruz.x / M, cruz.y / M);
      especiais[lado].push({ a0: c - t / 2, a1: c + t / 2, b0: cruz.base / M, b1: cruz.base / M + t, k: 'cruz' });
    }
    for (const d of dizeres) { const lado = faceDoDizer(d, r); if (lado) especiais[lado].push(lugarDoDizer(d, f[lado])); }
    /* a porta do pronto-socorro, debaixo da marquise */
    if (marq && Math.abs(marq.y0 / M - r.z1) < 0.5) {
      const c = f.s.a((marq.x0 + marq.x1) / 2 / M), w = Math.min(3.0, (marq.x1 - marq.x0) / M - 1.4);
      especiais.s.push({ a0: c - w / 2, a1: c + w / 2, b0: 0, b1: Math.min(2.6, th - 0.3), k: 'porta_vidro', fundo: 0.14 });
    }
    /* a porta de serviço, na rua de trás */
    especiais.n.push({ a0: 2.4, a1: 2.4 + 1.9, b0: 0, b1: Math.min(2.6, th - 0.3), k: 'porta_dupla', fundo: 0.1 });
    for (const lado of ['s', 'n', 'l', 'o']) lModulos(C.L, f[lado], and, fachadaModulos(B, f[lado].F, f[lado].larg, H, and, 'hosp_modulo', tinta, especiais[lado]));
    for (let k = 1; k < and; k++) friso(B, r, k * th - 0.1, 0.2, 0.08, FRISO, borda);
    friso(B, r, H - 0.28, 0.28, 0.12, FRISO, borda);
    topo(B, r, H, tinta, 1.0);
    lCaixa(C.L, r, 0, H + 1.0, 'lisa', tinta);
    /* no teto: a casa de máquinas do elevador e a caixa d'água */
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const rM = { x0: r.x0 + w * 0.62, x1: r.x0 + w * 0.62 + 3.4, z0: r.z0 + 0.6, z1: r.z0 + Math.min(d - 0.6, 3.4) };
    const rC = { x0: r.x0 + w * 0.22, x1: r.x0 + w * 0.22 + 3.6, z0: r.z0 + 0.8, z1: r.z0 + Math.min(d - 0.8, 3.2) };
    casinha(B, rM, H, 2.7, tinta, 's');
    caixaDagua(B, rC, H, 1.9);
    lCaixa(C.L, rM, H, H + 2.8, 'lisa', tinta);
    lCaixa(C.L, rC, H + 0.7, H + 2.6, 'crua', null);
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'predio');
  }
  /* ---- a ala de dois andares, encostada na frente da lâmina ---- */
  if (Ala) {
    const C = nova(), B = C.B, r = emM(Ala), H = Ala.alt / M, and = Math.max(1, Math.round(H / 3)), th = H / and;
    const colada = A && Math.abs(r.z0 - A.y1 / M) < 0.1;
    const borda = bordaDe(r, lim);
    if (colada) borda.n = true;
    const f = facesDe(B, r);
    const lados = colada ? ['s', 'l', 'o'] : ['s', 'n', 'l', 'o'];
    for (const lado of lados) lModulos(C.L, f[lado], and, fachadaModulos(B, f[lado].F, f[lado].larg, H, and, 'hosp_modulo', Ala.cor, []));
    for (let k = 1; k < and; k++) friso(B, r, k * th - 0.1, 0.2, 0.08, FRISO, borda);
    friso(B, r, H - 0.24, 0.24, 0.1, FRISO, borda);
    topo(B, r, H, Ala.cor, 0.8, colada ? { n: 0.02 } : {});
    lCaixa(C.L, r, 0, H + 0.8, 'lisa', Ala.cor, 'laje', lados);
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'predio');
  }
  /* ---- a marquise do pronto-socorro: a laje vermelha, a testeira alta
     que segura o letreiro e os dois pilares da frente ---- */
  if (marq) {
    const C = nova(), B = C.B, r = emM(marq), y0 = marq.y / M, y1 = (marq.y + marq.alt) / M, V = marq.cor || '#c9463c';
    const encostada = A && Math.abs(r.z0 - A.y1 / M) < 0.5;
    B.caixa(r.x0, r.x1, y0, y1, r.z0, r.z1, { todas: { k: 'lisa', tinta: V }, topo: 'laje', base: { k: 'lisa', tinta: '#e8e6df' }, tras: encostada ? null : { k: 'lisa', tinta: V } });
    B.caixa(r.x0, r.x1, y1, y1 + 1.05, r.z1 - 0.14, r.z1, { todas: { k: 'lisa', tinta: V }, base: null });
    for (const p of pilares) pilar(B, p.x / M, p.y / M, p.r / M, 0, y0, '#eeece6');
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'mesmo');
  }
  /* ---- o muro da frente: mureta com o gradil branco ---- */
  for (const o of muros) {
    const C = nova();
    muroDePeca(C, o, o.cor || '#c6c2b6', Math.min(1.25, o.alt / M - 0.8));
    const r = emM(o);
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'mesmo');
  }
}

/* =======================================================
   A DELEGACIA (o 3º Distrito)
   ======================================================= */
function delegacia(eq, P, lim) {
  const bloco = eq.pecas.find(o => o.k === 'bloco');
  const marq = eq.pecas.find(o => o.k === 'marquise');
  const pilares = eq.pecas.filter(o => o.k === 'pilar');
  const guarita = eq.pecas.find(o => o.k === 'guarita');
  const muros = eq.pecas.filter(o => o.k === 'muro');
  const dizeres = eq.pecas.filter(o => o.k === 'letreiro');
  P.feitas(bloco, marq, ...pilares, guarita, ...muros);
  const CREME = (bloco && bloco.cor) || '#e3e0d4', BARRA = '#8a939b', FRISO = '#cbc7bc';
  if (bloco) {
    const C = nova(), B = C.B, r = emM(bloco), H = bloco.alt / M, and = Math.max(1, Math.round(H / 3.1)), th = H / and;
    const borda = bordaDe(r, lim);
    paredesComBarrado(B, r, H, CREME, 0.9, BARRA, (lado, face) => {
      const { larg, a } = face;
      const livres = dizeres.filter(d => faceDoDizer(d, r) === lado).map(d => lugarDoDizer(d, face, 0.2));
      const vaos = [];
      if (lado === 's' && marq) {
        const c = a((marq.x0 + marq.x1) / 2 / M, 0);
        vaos.push({ a0: c - 0.95, a1: c + 0.95, b0: 0, b1: 2.6, k: 'porta_dupla', fundo: 0.16 });
      }
      const nb = Math.max(1, Math.floor(larg / 2.4)), bw = larg / nb;
      for (let i = 0; i < nb; i++) for (let fl = 0; fl < and; fl++) {
        const c = bw * (i + 0.5), jan = { a0: c - 0.7, a1: c + 0.7, b0: fl * th + 1.0, b1: fl * th + 2.3, k: 'dp_janela', fundo: 0.1 };
        if (!vaos.concat(livres).some(v => cruza(v, jan, 0.12))) vaos.push(jan);
      }
      return vaos;
    }, undefined, C.L);
    friso(B, r, th - 0.08, 0.16, 0.06, FRISO, borda);
    friso(B, r, H - 0.3, 0.3, 0.12, FRISO, borda);
    topo(B, r, H, CREME, 0.9);
    lCaixa(C.L, r, H - 0.1, H + 0.9, 'lisa', CREME);
    /* no teto: a caixa d'água e a antena do rádio da polícia */
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    caixaDagua(B, { x0: r.x1 - 3.6, x1: r.x1 - 1.4, z0: cz - 0.9, z1: cz + 0.9 }, H, 1.3);
    const ax = r.x0 + 2.0, az = cz;
    B.caixa(ax - 0.05, ax + 0.05, H, H + 6.5, az - 0.05, az + 0.05, { todas: { k: 'laje_borda', modo: 'esticar', tinta: '#5a5e62' }, base: null });
    for (const y of [H + 4.2, H + 5.4]) B.caixa(ax - 0.6, ax + 0.6, y, y + 0.05, az - 0.03, az + 0.03, { todas: { k: 'laje_borda', modo: 'esticar', tinta: '#5a5e62' } });
    P.parte(C, cx, cz, 'predio');
  }
  /* ---- o pórtico: a laje sobre os quatro pilares ---- */
  if (marq) {
    const C = nova(), B = C.B, r = emM(marq), y0 = marq.y / M, y1 = (marq.y + marq.alt) / M;
    const encostada = bloco && Math.abs(r.z0 - bloco.y1 / M) < 0.5;
    B.caixa(r.x0, r.x1, y0, y1, r.z0, r.z1, { todas: { k: 'lisa', tinta: '#e2ded3' }, topo: 'laje', base: { k: 'lisa', tinta: '#efede6' }, tras: encostada ? null : { k: 'lisa', tinta: '#e2ded3' } });
    B.caixa(r.x0 - 0.04, r.x1 + 0.04, y1, y1 + 0.12, r.z0, r.z1 + 0.04, { todas: { k: 'laje_borda', modo: 'esticar', tinta: FRISO }, topo: null, base: null, tras: null });
    for (const p of pilares) pilar(B, p.x / M, p.y / M, p.r / M, 0, y0, '#f0eee8');
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'mesmo');
  }
  /* ---- a guarita, com o beiral ---- */
  if (guarita) {
    const C = nova(), B = C.B, r = emM(guarita), H = guarita.alt / M, e = 0.22;
    paredesComBarrado(B, r, H, guarita.cor || '#dcd8cc', 0.8, BARRA, (lado, face) => {
      const L = face.larg;
      if (lado === 'n') return [{ a0: L / 2 - 0.4, a1: L / 2 + 0.4, b0: 0, b1: 2.05, k: 'porta_alu', fundo: 0.05 }];
      if (lado === 's' || lado === 'o') return [{ a0: L / 2 - 0.5, a1: L / 2 + 0.5, b0: 1.05, b1: 2.0, k: 'jan_alu4', fundo: 0.06 }];
      return [];
    }, undefined, C.L);
    B.caixa(r.x0 - e, r.x1 + e, H, H + 0.14, r.z0 - e, r.z1 + e, { todas: { k: 'laje_borda', modo: 'esticar' }, topo: 'laje', base: { k: 'lisa', tinta: '#e9e7e0' } });
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'predio');
  }
  for (const o of muros) {
    const C = nova();
    muroDePeca(C, o, o.cor || '#c6c2b6', 0, BARRA);
    const r = emM(o);
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'mesmo');
  }
}

/* =======================================================
   A ESCOLA MUNICIPAL
   ======================================================= */
function escola(eq, P, lim) {
  const blocos = eq.pecas.filter(o => o.k === 'bloco');
  const area = b => (b.x1 - b.x0) * (b.y1 - b.y0);
  const A = blocos.reduce((m, b) => (!m || area(b) > area(m) ? b : m), null);
  const Ala = blocos.find(b => b !== A);
  const marq = eq.pecas.find(o => o.k === 'marquise');
  const pilaresPass = marq ? eq.pecas.filter(o => o.k === 'pilar' && o.x >= marq.x0 - 2 && o.x <= marq.x1 + 2 && o.y >= marq.y0 - 2 && o.y <= marq.y1 + 2) : [];
  const muros = eq.pecas.filter(o => o.k === 'muro');
  const dizeres = eq.pecas.filter(o => o.k === 'letreiro');
  P.feitas(A, Ala, marq, ...pilaresPass, ...muros);
  const CREME = (A && A.cor) || '#e6e0cc', AZUL = '#4a76ad', CONCRETO = '#c9c5ba', FRISO = '#c3bfb4';
  /* ---- o bloco das salas: os pilares de concreto marcam os vãos, e
     cada vão tem a fita de vitrô nos dois andares ---- */
  if (A) {
    const C = nova(), B = C.B, r = emM(A), H = A.alt / M, and = Math.max(1, Math.round(H / 3.1)), th = H / and;
    const borda = bordaDe(r, lim), f = facesDe(B, r);
    const rAla = Ala ? emM(Ala) : null;
    for (const lado of ['s', 'n', 'l', 'o']) {
      const { F, larg, a } = f[lado];
      const livres = dizeres.filter(d => faceDoDizer(d, r) === lado).map(d => lugarDoDizer(d, f[lado], 0.15));
      const nb = Math.max(1, Math.round(larg / 3.4)), bw = larg / nb;
      const pil = [];
      for (let i = 0; i <= nb; i++) { const c = Math.min(Math.max(i * bw, 0.15), larg - 0.15); pil.push({ a0: c - 0.15, a1: c + 0.15, b0: 0, b1: H }); }
      const vaos = pil.map(p => ({ ...p, k: 'lisa', modo: 'ladrilho', tinta: CONCRETO }));
      /* a porta da frente, no vão debaixo do letreiro */
      let porta = null;
      if (lado === 's') {
        const alvo = livres.length ? (livres[0].a0 + livres[0].a1) / 2 : larg / 2;
        const i = Math.min(nb - 1, Math.max(0, Math.floor(alvo / bw))), c = bw * (i + 0.5);
        porta = { a0: c - 0.95, a1: c + 0.95, b0: 0, b1: 2.6, k: 'porta_dupla', fundo: 0.15 };
        vaos.push(porta);
      }
      /* nas pontas do bloco (a face de 3,8 m) a janela é só em cima */
      for (let i = 0; i < nb; i++) for (let fl = 0; fl < and; fl++) {
        const jan = { a0: i * bw + 0.3, a1: (i + 1) * bw - 0.3, b0: fl * th + 1.1, b1: fl * th + 2.5, k: 'esc_janela', fundo: 0.1 };
        if (jan.a1 - jan.a0 < 1.2) continue;
        if ((porta && cruza(porta, jan, 0.1)) || livres.some(v => cruza(v, jan, 0.1))) continue;
        vaos.push(jan);
      }
      for (const q of menos({ a0: 0, a1: larg, b0: 0, b1: 1.0 }, vaos.filter(v => v.b0 < 1.0)))
        vaos.push({ ...q, k: 'lisa', modo: 'ladrilho', tinta: AZUL });
      B.fachada(F, larg, H, 'lisa', vaos, { tinta: CREME });
      lVaos(C.L, f[lado], vaos);
      /* do lado do pátio o pilar SALTA da parede (menos atrás da ala); onde
         passa o letreiro ele para embaixo e volta em cima — o letreiro é
         decalque rente à parede, e o pilar na frente comeria as letras */
      if (lado === 's' && !borda.s) for (const p of pil) {
        const x = r.x0 + (p.a0 + p.a1) / 2;
        if (rAla && x > rAla.x0 - 0.2 && x < rAla.x1 + 0.2) continue;
        let trechos = [[0, H]];
        for (const v of livres) if (p.a1 > v.a0 && p.a0 < v.a1)
          trechos = trechos.flatMap(([y0, y1]) => [[y0, Math.min(y1, v.b0)], [Math.max(y0, v.b1), y1]]).filter(([y0, y1]) => y1 - y0 > 0.1);
        for (const [y0, y1] of trechos)
          B.caixa(x - 0.16, x + 0.16, y0, y1, r.z1, r.z1 + 0.12, { todas: { k: 'lisa', tinta: CONCRETO }, base: y0 > 0 ? { k: 'lisa', tinta: CONCRETO, escuro: 0.7 } : null, tras: null });
      }
    }
    friso(B, r, th - 0.1, 0.2, 0.08, FRISO, borda);
    friso(B, r, H - 0.28, 0.28, 0.1, FRISO, borda);
    topo(B, r, H, CREME, 0.8);
    lCaixa(C.L, r, 0, H + 0.8, 'lisa', CREME);
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const rC = { x0: r.x0 + w * 0.7, x1: r.x0 + w * 0.7 + 2.4, z0: r.z0 + 0.5, z1: r.z0 + Math.min(d - 0.5, 2.2) };
    caixaDagua(B, rC, H, 1.4);
    lCaixa(C.L, rC, H + 0.7, H + 2.1, 'crua', null);
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'predio');
  }
  /* ---- a ala da escada e dos banheiros: o cobogó, a porta e o basculante ---- */
  if (Ala) {
    const C = nova(), B = C.B, r = emM(Ala), H = Ala.alt / M;
    const colada = A && Math.abs(r.z0 - A.y1 / M) < 0.1;
    const borda = bordaDe(r, lim);
    if (colada) borda.n = true;
    const th = H / Math.max(1, Math.round(H / 3.1));
    paredesComBarrado(B, r, H, CREME, 1.0, AZUL, (lado, face) => {
      const L = face.larg;
      if (lado === 's') {
        const vaos = [];
        if (L > 3.4) vaos.push({ a0: L - 2.2, a1: L - 0.3, b0: 0, b1: 2.6, k: 'porta_dupla', fundo: 0.15 });
        vaos.push({ a0: 0.5, a1: Math.min(1.9, L - 2.6), b0: 1.2, b1: H - 0.5, k: 'cobogo', modo: 'ladrilho' });
        return vaos.filter(v => v.a1 - v.a0 > 0.4);
      }
      const n = Math.max(1, Math.floor(L / 1.4));
      const vaos = [];
      for (let i = 0; i < n; i++) for (let fl = 0; fl * th + 2.2 < H; fl++) {
        const c = L * (i + 0.5) / n;
        vaos.push({ a0: c - 0.3, a1: c + 0.3, b0: fl * th + 1.6, b1: fl * th + 2.2, k: 'basc', fundo: 0.06 });
      }
      return vaos;
    }, colada ? ['s', 'l', 'o'] : ['s', 'n', 'l', 'o'], C.L);
    friso(B, r, H - 0.26, 0.26, 0.08, FRISO, borda);
    topo(B, r, H, CREME, 0.8, colada ? { n: 0.02 } : {});
    lCaixa(C.L, r, H - 0.1, H + 0.8, 'lisa', CREME, 'laje', colada ? ['s', 'l', 'o'] : ['s', 'n', 'l', 'o']);
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'predio');
  }
  /* ---- a passarela coberta ---- */
  if (marq) {
    const C = nova(), B = C.B, r = emM(marq), y0 = marq.y / M, y1 = (marq.y + marq.alt) / M;
    B.caixa(r.x0, r.x1, y0, y1, r.z0, r.z1, { todas: { k: 'lisa', tinta: CONCRETO }, topo: 'laje', base: { k: 'lisa', tinta: '#e6e3dc' } });
    for (const p of pilaresPass) pilar(B, p.x / M, p.y / M, p.r / M, 0, y0, CONCRETO, false);
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'mesmo');
  }
  for (const o of muros) {
    const C = nova();
    muroDePeca(C, o, o.cor || '#ccc6b4', 0, AZUL);
    const r = emM(o);
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'mesmo');
  }
}

/* =======================================================
   O POSTO (o Posto Beira-Estrada)
   ======================================================= */
const VERMELHO = '#c8232c';
function posto(eq, P, lim) {
  const loja = eq.pecas.find(o => o.k === 'bloco');
  const marqs = eq.pecas.filter(o => o.k === 'marquise');
  const cob = marqs.reduce((m, o) => (!m || (o.x1 - o.x0) * (o.y1 - o.y0) > (m.x1 - m.x0) * (m.y1 - m.y0) ? o : m), null);
  const pilares = eq.pecas.filter(o => o.k === 'pilar');
  const bombas = eq.pecas.filter(o => o.k === 'bomba');
  const totem = eq.pecas.find(o => o.k === 'totem');
  /* as ilhas: o piso comprido que passa por baixo das bombas */
  const ilhas = eq.pecas.filter(o => o.k === 'piso' && bombas.some(b => (b.x0 + b.x1) / 2 > o.x0 && (b.x0 + b.x1) / 2 < o.x1 && (b.y0 + b.y1) / 2 > o.y0 && (b.y0 + b.y1) / 2 < o.y1));
  const dizeres = eq.pecas.filter(o => o.k === 'letreiro');
  P.feitas(loja, ...marqs, ...pilares, ...bombas, totem, ...ilhas);
  /* ---- a conveniência ---- */
  if (loja) {
    const C = nova(), B = C.B, r = emM(loja), H = loja.alt / M, TOPO = loja.teto || VERMELHO;
    const hv = Math.min(2.4, H - 0.9);
    paredesComBarrado(B, r, H, '#eeece6', 0, null, (lado, face) => {
      const L = face.larg, vaos = [];
      if (lado === 's') {
        /* a vitrine de ponta a ponta com a porta de vidro, e em cima a
           faixa vermelha da marca, onde o letreiro vai colado */
        const pa0 = L * 0.26 - 0.9;
        vaos.push({ a0: pa0, a1: pa0 + 1.8, b0: 0, b1: hv, k: 'porta_vidro', fundo: 0.12 });
        vaos.push({ a0: 0.3, a1: pa0 - 0.12, b0: 0, b1: hv, k: 'posto_vitrine', modo: 'ladrilho', tw: 2.6, th: hv });
        vaos.push({ a0: pa0 + 1.92, a1: L - 0.3, b0: 0, b1: hv, k: 'posto_vitrine', modo: 'ladrilho', tw: 2.6, th: hv });
        vaos.push({ a0: 0, a1: L, b0: hv + 0.05, b1: H, k: 'lisa', modo: 'ladrilho', tinta: TOPO });
        return vaos.filter(v => v.a1 - v.a0 > 0.2);
      }
      if (lado === 'n') vaos.push({ a0: L - 1.6, a1: L - 0.75, b0: 0, b1: 2.1, k: 'porta_ferro', fundo: 0.06 });
      const n = Math.max(1, Math.floor(L / 3));
      for (let i = 0; i < n; i++) {
        const c = L * (i + 0.5) / n, jan = { a0: c - 0.3, a1: c + 0.3, b0: 1.7, b1: 2.3, k: 'basc', fundo: 0.05 };
        if (!vaos.some(v => cruza(v, jan, 0.1))) vaos.push(jan);
      }
      vaos.push({ a0: 0, a1: L, b0: H - 0.6, b1: H, k: 'lisa', modo: 'ladrilho', tinta: TOPO });
      return vaos;
    }, undefined, C.L);
    lCaixa(C.L, r, H - 0.1, H + 0.45, 'lisa', TOPO);
    B.tampa(cantos(r), H + 0.02, 'laje', false);
    B.pintar(TOPO); mureta(B, cantos(r), H, 0.45, 0.12, 'lisa'); B.pintar(null);
    for (const [x, z] of [[r.x0 + 1.4, (r.z0 + r.z1) / 2], [r.x1 - 1.6, (r.z0 + r.z1) / 2]]) {
      B.caixa(x - 0.45, x + 0.45, H, H + 0.62, z - 0.18, z + 0.18, { todas: { k: 'ar_lado', modo: 'esticar' }, frente: { k: 'ar', modo: 'esticar' }, base: null });
    }
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'predio');
  }
  /* ---- a cobertura das bombas: a testeira em volta, o forro de
     luminária por baixo, a laje em cima e os quatro pilares ---- */
  if (cob) {
    const C = nova(), B = C.B, r = emM(cob);
    const faixa = marqs.find(o => o !== cob);
    const y1 = (cob.y + cob.alt) / M, y0 = faixa ? Math.min(faixa.y, cob.y) / M : cob.y / M - 0.6;
    const test = { k: 'posto_testeira', tw: 2.0, th: y1 - y0 };
    B.caixa(r.x0, r.x1, y0, y1, r.z0, r.z1, { todas: test, topo: 'laje', base: { k: 'forro_posto', tw: 2.0, th: 2.0 } });
    for (const p of pilares) {
      const x = p.x / M, z = p.y / M, e = p.r / M;
      B.caixa(x - e, x + e, 0, y0, z - e, z + e, { todas: { k: 'lisa', tinta: '#f1f0ec' }, topo: null, base: null });
      B.caixa(x - e - 0.02, x + e + 0.02, 0, 0.9, z - e - 0.02, z + e + 0.02, { todas: { k: 'lisa', tinta: VERMELHO }, topo: { k: 'lisa', tinta: VERMELHO }, base: null });
    }
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'mesmo');
  }
  /* ---- as ilhas de concreto e as bombas ---- */
  if (bombas.length) {
    const C = nova(), B = C.B;
    for (const o of ilhas) {
      const r = emM(o);
      B.caixa(r.x0, r.x1, 0, 0.18, r.z0, r.z1, { todas: { k: 'laje_borda', tw: 2, th: 0.18 }, topo: 'laje', base: null });
    }
    for (const o of bombas) {
      const r = emM(o), H = o.alt / M;
      /* o visor olha pra onde o carro para: pros dois lados compridos da ilha */
      const visorEmZ = !ilhas.length || ilhas.some(i => (i.x1 - i.x0) >= (i.y1 - i.y0));
      const frente = { k: 'posto_bomba', modo: 'esticar' }, lado = { k: 'lisa', tinta: '#ecebe6' };
      B.caixa(r.x0, r.x1, 0.18, H, r.z0, r.z1, visorEmZ
        ? { frente, tras: frente, dir: lado, esq: lado, topo: { k: 'lisa', tinta: VERMELHO }, base: null }
        : { dir: frente, esq: frente, frente: lado, tras: lado, topo: { k: 'lisa', tinta: VERMELHO }, base: null });
    }
    const bx = bombas.reduce((s, o) => s + (o.x0 + o.x1) / 2, 0) / bombas.length / M;
    const bz = bombas.reduce((s, o) => s + (o.y0 + o.y1) / 2, 0) / bombas.length / M;
    P.parte(C, bx, bz, 'mesmo');
  }
  /* ---- o totem de preço: o painel de duas faces no pé de concreto ---- */
  if (totem) {
    const C = nova(), B = C.B, r = emM(totem), H = totem.alt / M;
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, w = Math.min(1.3, r.x1 - r.x0), e = 0.22;
    const painel = { k: 'posto_totem', modo: 'esticar' };
    B.caixa(cx - w / 2, cx + w / 2, 0, H, cz - e, cz + e, { frente: painel, tras: painel, dir: { k: 'lisa', tinta: VERMELHO }, esq: { k: 'lisa', tinta: VERMELHO }, topo: { k: 'lisa', tinta: VERMELHO }, base: null });
    P.parte(C, cx, cz, 'predio');
  }
}

/* =======================================================
   O SHOPPING BEIRA-MAR
   ======================================================= */
const AZUL_SHOP = '#3a4a66';
/* a torre entra na caixa? (a face de trás dela fica dentro, até o teto) */
const rT0 = (r, A) => !!A && r.z0 < A.y1 / M - 0.1 && r.z0 > A.y0 / M && r.x0 >= A.x0 / M - 0.1 && r.x1 <= A.x1 / M + 0.1;
function shopping(eq, P, lim) {
  const blocos = eq.pecas.filter(o => o.k === 'bloco');
  const area = b => (b.x1 - b.x0) * (b.y1 - b.y0);
  const A = blocos.reduce((m, b) => (!m || area(b) > area(m) ? b : m), null);
  const T = blocos.find(b => b !== A);
  const marq = eq.pecas.find(o => o.k === 'marquise');
  const claraboias = eq.pecas.filter(o => o.k === 'claraboia');
  const maquinas = eq.pecas.filter(o => o.k === 'maquina');
  const totem = eq.pecas.find(o => o.k === 'totem');
  const dizeres = eq.pecas.filter(o => o.k === 'letreiro');
  P.feitas(A, T, marq, ...claraboias, ...maquinas, totem);
  /* ---- a caixa: placa de concreto, a faixa azul no alto, as vitrines
     do térreo na frente, a entrada de vidro do lado do estacionamento ---- */
  if (A) {
    const C = nova(), B = C.B, r = emM(A), H = A.alt / M;
    const borda = bordaDe(r, lim), f = facesDe(B, r), rT = T ? emM(T) : null;
    const hMarq = marq ? marq.y / M : 3.4;
    for (const lado of ['s', 'n', 'l', 'o']) {
      const { F, larg, a } = f[lado];
      const vaos = [{ a0: 0, a1: larg, b0: H - 0.8, b1: H, k: 'lisa', modo: 'ladrilho', tinta: AZUL_SHOP }];
      if (lado === 's') {
        /* as vitrines do térreo, de um lado e do outro da torre */
        const t0 = rT ? a(rT.x0, 0) : larg, t1 = rT ? a(rT.x1, 0) : larg;
        for (const [p, q] of [[0.4, t0 - 0.3], [t1 + 0.3, larg - 0.4]])
          if (q - p > 1.2) vaos.push({ a0: p, a1: q, b0: 0, b1: Math.min(3.0, hMarq - 0.3), k: 'shop_vidro', modo: 'ladrilho', tw: 1.5, th: 3.0 });
      } else if (lado === 'l') {
        const c = larg / 2;
        vaos.push({ a0: c - 1.5, a1: c + 1.5, b0: 0, b1: 2.6, k: 'porta_vidro', fundo: 0.14 });
        for (const [p, q] of [[Math.max(0.4, c - 4.5), c - 1.65], [c + 1.65, Math.min(larg - 0.4, c + 4.5)]])
          if (q - p > 0.8) vaos.push({ a0: p, a1: q, b0: 0, b1: 3.0, k: 'shop_vidro', modo: 'ladrilho', tw: 1.5, th: 3.0 });
      } else if (lado === 'n') {
        vaos.push({ a0: 1.2, a1: 3.6, b0: 0, b1: 2.5, k: 'enrolar', fundo: 0.08 });
        vaos.push({ a0: 4.4, a1: 5.25, b0: 0, b1: 2.1, k: 'porta_ferro', fundo: 0.06 });
      }
      B.fachada(F, larg, H, 'shop_painel', vaos.filter(v => v.a1 - v.a0 > 0.2), { tw: 3.0, th: 3.0 });
      lVaos(C.L, f[lado], vaos);
    }
    lCaixa(C.L, r, 0, H, 'shop_painel', null);
    lCaixa(C.L, r, H - 0.1, H + 0.6, 'lisa', AZUL_SHOP);
    friso(B, r, H - 0.82, 0.08, 0.06, '#d9dde0', borda);
    topo(B, r, H, AZUL_SHOP, 0.6);
    for (const o of claraboias) {
      const q = emM(o), y0 = o.y / M, y1 = (o.y + o.alt) / M + 0.2;
      lCaixa(C.L, q, y0, y1, 'lisa', '#b9bec2', 'claraboia');
      B.caixa(q.x0, q.x1, y0, y1, q.z0, q.z1, { todas: { k: 'lisa', tinta: '#b9bec2', modo: 'esticar' }, topo: { k: 'claraboia', tw: 1.5, th: 1.5 }, base: null });
    }
    for (const o of maquinas) {
      const q = emM(o), y0 = o.y / M, y1 = (o.y + o.alt) / M;
      lCaixa(C.L, q, y0, y1, 'veneziana_ar', null, 'lisa');
      B.caixa(q.x0, q.x1, y0, y1, q.z0, q.z1, { todas: { k: 'veneziana_ar', tw: 1.4, th: y1 - y0 }, topo: { k: 'lisa', tinta: '#9fa3a5' }, base: null });
    }
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'predio');
  }
  /* ---- a torre de vidro da entrada, com a marca e a coroa azul ---- */
  if (T) {
    const C = nova(), B = C.B, r = emM(T), H = T.alt / M;
    const f = facesDe(B, r);
    for (const lado of rT0(r, A) ? ['s', 'l', 'o'] : ['s', 'n', 'l', 'o']) {
      const { F, larg } = f[lado];
      const vaos = [{ a0: 0, a1: larg, b0: H - 0.9, b1: H, k: 'lisa', modo: 'ladrilho', tinta: AZUL_SHOP }];
      if (lado === 's') {
        vaos.push({ a0: larg / 2 - 1.5, a1: larg / 2 + 1.5, b0: 0, b1: 2.6, k: 'porta_vidro', fundo: 0.12 });
        const s = Math.min(1.8, larg - 1.2);
        vaos.push({ a0: larg / 2 - s / 2, a1: larg / 2 + s / 2, b0: H - 1.2 - s, b1: H - 1.2, k: 'shop_logo' });
      }
      const nC = Math.max(1, Math.round(larg / 1.5));
      B.fachada(F, larg, H, 'shop_vidro', vaos.filter(v => v.a1 - v.a0 > 0.2), { tw: larg / nC, th: 3.0 });
      lVaos(C.L, f[lado], vaos);
    }
    lCaixa(C.L, r, 0, H, 'shop_vidro', null);
    lCaixa(C.L, r, H - 0.1, H + 0.35, 'lisa', AZUL_SHOP);
    /* a face de trás só aparece acima do teto da caixa */
    const hA = A ? A.alt / M : 0;
    if (rT0(r, A) && H > hA + 0.2) {
      const fn = facesDe(B, r, hA).n;
      B.fachada(fn.F, fn.larg, H - hA, 'shop_vidro', [{ a0: 0, a1: fn.larg, b0: H - hA - 0.9, b1: H - hA, k: 'lisa', modo: 'ladrilho', tinta: AZUL_SHOP }],
                { tw: fn.larg / Math.max(1, Math.round(fn.larg / 1.5)), th: 3.0 });
    }
    topo(B, r, H, AZUL_SHOP, 0.35);
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'predio');
  }
  /* ---- a marquise de vidro da frente ---- */
  if (marq) {
    const C = nova(), B = C.B, r = emM(marq), y0 = marq.y / M, y1 = (marq.y + marq.alt) / M;
    B.caixa(r.x0, r.x1, y0, y1, r.z0, r.z1, { todas: { k: 'lisa', tinta: '#aeb4b8', modo: 'esticar' }, topo: { k: 'claraboia', tw: 1.5, th: 1.5 },
                                              base: { k: 'lisa', tinta: '#dfe1df' }, tras: null });
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'mesmo');
  }
  /* ---- o totem: o pilar azul com a marca lá em cima ---- */
  if (totem) {
    const C = nova(), B = C.B, r = emM(totem), H = totem.alt / M, w = r.x1 - r.x0;
    const logo = { k: 'shop_logo', modo: 'esticar' }, azul = { k: 'lisa', tinta: totem.cor || AZUL_SHOP };
    B.caixa(r.x0, r.x1, 0, H - w - 0.3, r.z0, r.z1, { todas: azul, topo: null, base: null });
    B.caixa(r.x0, r.x1, H - w - 0.3, H - 0.3, r.z0, r.z1, { todas: logo, topo: null, base: null });
    B.caixa(r.x0 - 0.05, r.x1 + 0.05, H - 0.3, H, r.z0 - 0.05, r.z1 + 0.05, { todas: azul, base: null });
    P.parte(C, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 'predio');
  }
}

const MONTAR = { hospital, delegacia, escola, posto, shopping };

/* os construtores de uma parte viram blocos de mundo (unidades), na
   lista da folha de cada um */
function blocosDe(C, y0) {
  const out = {};
  for (const [lista, K] of [['casas', C.B], ['grades', C.G]]) {
    const n = K.pos.length / 3;
    if (!n) continue;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[3 * i] = K.pos[3 * i] * M; pos[3 * i + 1] = y0 + K.pos[3 * i + 1] * M; pos[3 * i + 2] = K.pos[3 * i + 2] * M;
    }
    out[lista] = [{ pos, uv: new Float32Array(K.uv), cor: new Float32Array(K.cor) }];
  }
  return out;
}

/* O MODELO DE UM EQUIPAMENTO ANTIGO. `opc.limite` é o miolo da quadra (a
   borda da calçada, em unidades); `opc.y0`, o chão; `opc.medias`, a cor
   média de cada peça da folha das casas (`modelos_medias.js`) — com ela
   cada prédio leva a versão de longe pronta (`distante`). Devolve as
   partes (cada uma com o meio no mundo, o que ela vira de longe — ver
   `ladrilhos3d.js` — e os blocos de cada folha) e o conjunto de peças da
   planta que o modelo já desenhou. Equipamento que não é um dos cinco
   devolve null. */
export function montarEquipAntigo(eq, opc = {}) {
  if (!eq || !TIPOS_ANTIGOS.has(eq.tipo)) return null;
  const partes = [], feitas = new Set();
  let triangulos = 0, trianguloLonge = 0;
  const med = opc.medias || null, y0 = opc.y0 || 0;
  const P = {
    feitas: (...os) => { for (const o of os) if (o) feitas.add(o); },
    parte: (C, x, z, longe) => {
      triangulos += C.B.pos.length / 9 + C.G.pos.length / 9;
      const pt = { x: x * M, z: z * M, longe, blocos: blocosDe(C, y0) };
      /* a versão de longe pronta (só do prédio, e só com as médias da folha) */
      if (med && longe === 'predio' && C.L.quads.length) {
        const pos = [], cor = [];
        for (const { p, k, tinta } of C.L.quads) {
          const m = med[k] || [0.5, 0.5, 0.5], t = tinta ? sRGBpraLinear(tinta) : [1, 1, 1];
          const c = [m[0] * t[0], m[1] * t[1], m[2] * t[2]];
          for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(p[i][0] * M, y0 + p[i][1] * M, p[i][2] * M); cor.push(c[0], c[1], c[2]); }
        }
        pt.distante = { pos, cor };
        trianguloLonge += pos.length / 9;
      }
      partes.push(pt);
    }
  };
  MONTAR[eq.tipo](eq, P, opc.limite || null);
  return { partes, feitas, triangulos, trianguloLonge };
}
