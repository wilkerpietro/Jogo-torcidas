/* =========================================================
   OS ARREDORES PADRÃO DE UM ESTÁDIO (dono, 16/11/2026: "nos arredores do
   estádio, deve haver uma estrutura de polícia com efetivo policial e
   grades, similar ao que o jogo 3d fazia, e o jogo deve ter 9 quarteirões
   com o quarteirão do estádio estando no meio. As grades devem induzir a
   torcida a fazer a rota até a sua respectiva entrada pro seu local").

   Serve pra todo estádio que NÃO está na lista dos arredores de verdade (os
   21 dos grandes, que levam as ruas do mapa). A ficha pede com
   `arredoresPadrao: true` (ou um objeto com ajustes) e este módulo devolve o
   `arredores` pronto, no formato de arredores.mjs:

   · OS 9 QUARTEIRÕES: o do estádio no meio e oito em volta, separados por
     quatro ruas (duas ao longo do campo, duas atravessadas) que seguem até a
     beira da cena. As casas dos oito de fora são as do jogo 3D antigo, uma
     fileira de frente pra cada rua (arredores.mjs as põe).
   · O QUARTEIRÃO DO ESTÁDIO: o SÓLIDO (o estádio com os muros e os prédios
     dele: o casco de tudo o que a ficha desenha em pé) e, em volta, o
     calçadão até a rua.
   · AS ENTRADAS: três do mandante (1º, 2º e 3º escalão) e uma da visitante,
     cada uma na beira do sólido, virada pro setor dela (`jogo.mandante1..3`
     e `jogo.visitante` da ficha).
   · AS GRADES QUE CONDUZEM: o GRADIL contínuo entre a calçada e o calçadão,
     em volta do quarteirão inteiro, aberto só na frente de cada entrada, e
     de cada abertura o FUNIL de dois gradis até o portão.
   · O CORDÃO DA POLÍCIA: a zona da visitante é o pedaço do contorno do
     quarteirão em volta da entrada dela, até a metade do caminho da entrada
     mandante mais próxima de cada lado. Em cada ponta, a GRADE DE PROTEÇÃO
     atravessa a rua (é a que quebra) e o gradil atravessa o calçadão até o
     estádio; atrás dela, do lado do mandante, o efetivo da PM. Há PM também
     em cada portão.
   · OS BONDES: chegam pelas pontas das ruas, na beira da cena. Os da
     visitante, pelas pontas que ficam dentro da zona dela; os do mandante,
     pelas outras.

   AJUSTES (`arredoresPadrao: { ... }`): `solido` (o contorno do que não se
   pisa, quando o casco não serve), `margem` (a largura do calçadão, 12 m),
   `fundo` (a fundura dos quarteirões de fora, 62 m), `ruas` (os nomes:
   { cima, baixo, esquerda, direita }), `portoes` ([{ n, nome, u, v, dir }])
   com `entradaDe` ({ mandante1: n, .., visitante: n }), `tiras` (pisos a
   recortar a mais), `pisos` (pisos a mais, desenhados), `entorno`, `px`.
   ========================================================= */
import { colunasDe, raioDe } from './estadio_lowpoly.mjs';
/* QUEM JÁ TEM os arredores padrão (a lista cresce estádio a estádio, com a cena conferida; os 21 dos arredores de verdade
   não entram aqui: levam `arredores` com as ruas do mapa na própria ficha) */
export const COM_PADRAO = new Set(['estadio-dutrinha', 'estadio-arena-pantanal', 'estadio-serejao', 'estadio-bezerrao', 'estadio-jonas-duarte', 'estadio-antonio-accyoly']);
const RAD = Math.PI / 180;
const dentroPoli = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
/* o casco convexo de uma nuvem de pontos */
function casco(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), vira = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && vira(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && vira(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
/* o sólido do estádio: tudo o que a ficha põe em pé (as arquibancadas, os muros, os prédios, os postes) */
function solidoDe(ficha) {
  const pts = [];
  /* (as arquibancadas pelo desenho de verdade, coluna a coluna: o teste de chão de um lance `reto` sobra em cunha nas pontas) */
  for (const anel of ficha.aneis || []) for (const t of anel.trechos) { if (t.tipo === 'vazio') continue;
    if (t.tipo === 'passagem') { for (let a = t.de; a <= t.ate; a += 3) { const r = raioDe(a, t.fora || anel.fora); pts.push([Math.cos(a * RAD) * r, Math.sin(a * RAD) * r]); } continue; }
    const G = colunasDe(ficha, anel, t); for (const a of G.angs) { pts.push(G.pos(a, 0)); pts.push(G.pos(a, 1)); } }
  for (const b of ficha.blocos || []) { if ((b.h || 0) + (b.y || 0) < 1 || b.cobertura) continue; const g = (b.giro || 0) * RAD, c = Math.cos(g), s = Math.sin(g);
    for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) pts.push([b.u + x * b.w * c + z * b.d * s, b.v + x * b.w * s - z * b.d * c]); }
  for (const k of ficha.conchas || []) for (let t = 0; t < 360; t += 6) pts.push([k.cu + k.a * Math.cos(t * RAD), k.cv + (k.lado === -1 ? -1 : 1) * Math.abs(k.b * Math.sin(t * RAD))]);
  for (const r of ficha.refletores || []) pts.push([r[0], r[1]]);
  const h = casco(pts), cu = h.reduce((q, p) => q + p[0], 0) / h.length, cv = h.reduce((q, p) => q + p[1], 0) / h.length;
  return h.map(p => { const d = Math.hypot(p[0] - cu, p[1] - cv) || 1; return [p[0] + (p[0] - cu) / d * 1.2, p[1] + (p[1] - cv) / d * 1.2]; });
}

export function arredoresPadrao(ficha) {
  const o = ficha.arredoresPadrao === true ? {} : (ficha.arredoresPadrao || {});
  const solido = o.solido || solidoDe(ficha), margem = o.margem == null ? 12 : o.margem, fundo = o.fundo == null ? 62 : o.fundo, LARG = 10, CALC = 2.6, MEIA = LARG / 2 + CALC;
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const p of solido) { u0 = Math.min(u0, p[0]); u1 = Math.max(u1, p[0]); v0 = Math.min(v0, p[1]); v1 = Math.max(v1, p[1]); }
  u0 = Math.floor(u0 - margem); u1 = Math.ceil(u1 + margem); v0 = Math.floor(v0 - margem); v1 = Math.ceil(v1 + margem);
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, MU = (u1 - u0) / 2 + 2 * MEIA + fundo, MV = (v1 - v0) / 2 + 2 * MEIA + fundo, nomes = o.ruas || {};
  /* as quatro ruas, pelo eixo, até depois da beira da cena */
  const R = { cima: v1 + MEIA, baixo: v0 - MEIA, esquerda: u0 - MEIA, direita: u1 + MEIA };
  const ruas = [
    { nome: nomes.cima || '', tipo: 'residential', larg: LARG, pts: [[cu - MU - 30, R.cima], [cu + MU + 30, R.cima]] }, { nome: nomes.baixo || '', tipo: 'residential', larg: LARG, pts: [[cu - MU - 30, R.baixo], [cu + MU + 30, R.baixo]] },
    { nome: nomes.esquerda || '', tipo: 'residential', larg: LARG, pts: [[R.esquerda, cv - MV - 30], [R.esquerda, cv + MV + 30]] }, { nome: nomes.direita || '', tipo: 'residential', larg: LARG, pts: [[R.direita, cv - MV - 30], [R.direita, cv + MV + 30]] }];
  /* O CONTORNO DO QUARTEIRÃO, andando no sentido anti-horário a partir do canto de baixo à direita: s (metros) → ponto, e
     pra que lado é fora (`n`) e ao longo (`t`) */
  const Wq = u1 - u0, Hq = v1 - v0, P = 2 * (Wq + Hq);
  const noContorno = s => { s = ((s % P) + P) % P;
    if (s < Hq) return { p: [u1, v0 + s], n: [1, 0], t: [0, 1], lado: 'direita' };
    if (s < Hq + Wq) return { p: [u1 - (s - Hq), v1], n: [0, 1], t: [-1, 0], lado: 'cima' };
    if (s < 2 * Hq + Wq) return { p: [u0, v1 - (s - Hq - Wq)], n: [-1, 0], t: [0, -1], lado: 'esquerda' };
    return { p: [u0 + (s - 2 * Hq - Wq), v0], n: [0, -1], t: [1, 0], lado: 'baixo' }; };
  const sDe = (u, v) => { const d = [[u1 - u, Math.max(0, Math.min(Hq, v - v0))], [v1 - v, Hq + Math.max(0, Math.min(Wq, u1 - u))], [u - u0, Hq + Wq + Math.max(0, Math.min(Hq, v1 - v))], [v - v0, 2 * Hq + Wq + Math.max(0, Math.min(Wq, u - u0))]];
    return d.reduce((q, x) => x[0] < q[0] ? x : q)[1]; };
  const CANTOS = [0, Hq, Hq + Wq, 2 * Hq + Wq];   /* (o de baixo à direita, o de cima à direita, o de cima à esquerda, o de baixo à esquerda) */
  /* a beira do sólido numa direção, vista do meio dele */
  const su = solido.reduce((q, p) => q + p[0], 0) / solido.length, sv = solido.reduce((q, p) => q + p[1], 0) / solido.length;
  const beira = ang => { const dx = Math.cos(ang * RAD), dy = Math.sin(ang * RAD); let r = 0; for (let k = 0; k < solido.length; k++) { const [x1, y1] = solido[k], [x2, y2] = solido[(k + 1) % solido.length], ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
      const q = ((x1 - su) * ey - (y1 - sv) * ex) / den, w = ((x1 - su) * dy - (y1 - sv) * dx) / den; if (q > 0 && w >= 0 && w <= 1) r = Math.max(r, q); } return [su + dx * (r + 2.2), sv + dy * (r + 2.2)]; };
  /* AS ENTRADAS: as da ficha, ou uma pra cada setor, na beira do sólido, virada pro setor */
  const J = ficha.jogo || {}, meio = f => f ? (f[0] + f[1]) / 2 : null, ROT = { mandante1: '1º ESCALÃO MANDANTE', mandante2: '2º ESCALÃO MANDANTE', mandante3: '3º ESCALÃO MANDANTE', visitante: 'VISITANTE' };
  let portoes, entradaDe;
  if (o.portoes) { portoes = o.portoes; entradaDe = o.entradaDe; }
  else { portoes = []; entradaDe = {};
    for (const [id, ang] of [['mandante1', meio(J.mandante1)], ['mandante2', meio(J.mandante2)], ['mandante3', meio(J.mandante3)], ['visitante', meio(J.visitante)]]) { if (ang == null) continue;
      /* (o ângulo do setor é visto do meio do campo: o portão fica onde essa direção sai do sólido) */
      const alvo = [Math.cos(ang * RAD) * 400, Math.sin(ang * RAD) * 400], a2 = Math.atan2(alvo[1] - sv, alvo[0] - su) / RAD, g = beira(a2), n = portoes.length + 1;
      portoes.push({ n, nome: id === 'visitante' ? 'PORTÃO ' + n + ' · VISITANTE' : 'PORTÃO ' + n, u: +g[0].toFixed(1), v: +g[1].toFixed(1), dir: [-Math.cos(a2 * RAD), -Math.sin(a2 * RAD)], larg: 9, cor: id === 'visitante' ? '#7a2f2f' : '#1f6a45' }); entradaDe[id] = n; } }
  const portao = n => portoes.find(g => g.n === n);
  /* as aberturas do gradil: uma na frente de cada entrada usada */
  const usadas = [...new Set(Object.values(entradaDe))].map(n => { const g = portao(n), s = sDe(g.u, g.v); return { n, g, s, c: noContorno(s) }; });
  const ABRE = 7, dist = (a, b) => { const d = Math.abs(a - b) % P; return Math.min(d, P - d); };
  const filas = [], grades = [], pm = [];
  /* o gradil em volta do quarteirão, aberto na frente de cada entrada */
  { const cortes = usadas.map(e => [e.s - ABRE, e.s + ABRE]).sort((a, b) => a[0] - b[0]); let s = cortes.length ? cortes[cortes.length - 1][1] - P : 0;
    const trecho = (a, b) => { if (b - a < 2) return; const pts = [noContorno(a).p]; for (const c of [...CANTOS, ...CANTOS.map(x => x + P), ...CANTOS.map(x => x - P)].sort((x, y) => x - y)) if (c > a + 0.5 && c < b - 0.5) pts.push(noContorno(c).p); pts.push(noContorno(b).p); filas.push({ pts }); };
    if (!cortes.length) trecho(0, P); else for (const [a, b] of cortes) { trecho(s, a); s = b; } }
  /* o funil de cada abertura até o portão */
  for (const e of usadas) { const g = e.g, c = e.c, gl = Math.hypot(g.dir[0], g.dir[1]) || 1, tx = -g.dir[1] / gl, ty = g.dir[0] / gl;
    for (const sg of [-1, 1]) filas.push({ pts: [[c.p[0] + c.t[0] * sg * ABRE, c.p[1] + c.t[1] * sg * ABRE], [g.u + tx * sg * 5.5 * (tx * c.t[0] + ty * c.t[1] >= 0 ? 1 : -1), g.v + ty * sg * 5.5 * (tx * c.t[0] + ty * c.t[1] >= 0 ? 1 : -1)]] });
    pm.push([c.p[0] + c.t[0] * (ABRE + 4) + c.n[0] * 1.5, c.p[1] + c.t[1] * (ABRE + 4) + c.n[1] * 1.5]); }
  /* O CORDÃO: a zona da visitante vai, de cada lado da abertura dela, até a metade do caminho da abertura mandante mais
     próxima (no máximo 30% do contorno), e pega pelo menos um canto, que é por onde ela chega */
  const eV = usadas.find(e => e.n === entradaDe.visitante), zona = { de: 0, ate: 0 };
  if (eV) {
    const outras = usadas.filter(e => e !== eV), lim = dir => { let m = P * 0.3; for (const e of outras) { const d = ((dir * (e.s - eV.s)) % P + P) % P; if (d > 0) m = Math.min(m, d / 2); } return Math.max(18, m); };
    let a = lim(-1), b = lim(1);
    const cantoEm = (de, ate) => CANTOS.some(c => { const d = ((c - de) % P + P) % P; return d > 6 && d < ((ate - de) % P + P) % P - 6; });
    if (!cantoEm(eV.s - a, eV.s + b)) { /* estica o lado em que o canto está mais perto, até 14 m depois dele (se não bater noutra abertura) */
      const dc = dir => Math.min(...CANTOS.map(c => { const d = ((dir * (c - eV.s)) % P + P) % P; return d > 0 ? d : P; }));
      const da = dc(-1), db = dc(1); if (db <= da) b = Math.max(b, db + 14); else a = Math.max(a, da + 14); }
    zona.de = eV.s - a; zona.ate = eV.s + b;
    for (const [s, sg] of [[zona.de, 1], [zona.ate, -1]]) { const c = noContorno(s);
      /* a grade de proteção atravessa a rua; o gradil atravessa o calçadão até o estádio */
      grades.push({ de: [c.p[0] + c.n[0] * (2 * MEIA - 0.4), c.p[1] + c.n[1] * (2 * MEIA - 0.4)], ate: [c.p[0] + c.n[0] * 0.3, c.p[1] + c.n[1] * 0.3] });
      let d = 0; while (d < 90 && !dentroPoli(solido, c.p[0] - c.n[0] * d, c.p[1] - c.n[1] * d)) d += 0.5;
      filas.push({ pts: [c.p, [c.p[0] - c.n[0] * (d + 1), c.p[1] - c.n[1] * (d + 1)]] });
      /* o efetivo, atrás da grade, do lado do mandante (`sg` aponta pra dentro da zona: a PM fica do outro lado) */
      for (const [fn, ft] of [[MEIA, 6], [MEIA - 3.5, 9], [-Math.min(d, 8) / 2, 6]]) pm.push([c.p[0] + c.n[0] * fn - c.t[0] * sg * ft, c.p[1] + c.n[1] * fn - c.t[1] * sg * ft]); }
    pm.push([eV.c.p[0] + eV.c.n[0] * MEIA, eV.c.p[1] + eV.c.n[1] * MEIA]);
  }
  /* OS BONDES: as oito pontas de rua (duas em cada canto do quarteirão: a rua de cada lado continua até a beira da cena) */
  const naZona = s => eV && (((s - zona.de) % P + P) % P) < (((zona.ate - zona.de) % P + P) % P);
  const B = 9, pontas = [
    { canto: 0, p: [cu + MU - B, R.baixo] }, { canto: 0, p: [R.direita, cv - MV + B] }, { canto: 1, p: [cu + MU - B, R.cima] }, { canto: 1, p: [R.direita, cv + MV - B] },
    { canto: 2, p: [cu - MU + B, R.cima] }, { canto: 2, p: [R.esquerda, cv + MV - B] }, { canto: 3, p: [cu - MU + B, R.baixo] }, { canto: 3, p: [R.esquerda, cv - MV + B] }].map(q => Object.assign(q, { visita: naZona(CANTOS[q.canto]), livre: true }));
  const bondes = {}, pegar = (alvo, visita) => { const c = pontas.filter(q => q.visita === visita), livres = c.filter(q => q.livre), lista = livres.length ? livres : c; if (!lista.length) return null;
    const q = lista.reduce((m, x) => Math.hypot(x.p[0] - alvo[0], x.p[1] - alvo[1]) < Math.hypot(m.p[0] - alvo[0], m.p[1] - alvo[1]) ? x : m); const usado = !q.livre; q.livre = false;
    /* (ponta repetida: o segundo bonde nasce 22 m mais pra dentro da rua) */
    return usado ? [q.p[0] + Math.sign(cu - q.p[0]) * (Math.abs(q.p[1] - R.cima) < 1 || Math.abs(q.p[1] - R.baixo) < 1 ? 22 : 0), q.p[1] + Math.sign(cv - q.p[1]) * (Math.abs(q.p[0] - R.esquerda) < 1 || Math.abs(q.p[0] - R.direita) < 1 ? 22 : 0)] : q.p; };
  for (const id of ['mandante1', 'mandante2', 'mandante3']) { const n = entradaDe[id]; if (n == null) continue; const g = portao(n), de = pegar([g.u, g.v], false); if (de) bondes[id] = { de, portao: n, exato: true }; }
  if (eV) for (const id of ['visitante1', 'visitante2']) { const de = pegar([eV.g.u, eV.g.v], true); if (de) bondes[id] = { de, portao: eV.n, exato: true }; }
  const quadra = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  /* o miolo dos quatro quarteirões do meio de cada lado: as árvores do fundo dos quintais */
  const fq = 2 * MEIA + fundo * 0.72, quintais = [
    { tipo: 'arvores', u: cu, v: v1 + fq, w: Wq - 30, d: 12, n: Math.round(Wq / 16) }, { tipo: 'arvores', u: cu, v: v0 - fq, w: Wq - 30, d: 12, n: Math.round(Wq / 16) },
    { tipo: 'arvores', u: u0 - fq, v: cv, w: 12, d: Hq - 30, n: Math.round(Hq / 16) }, { tipo: 'arvores', u: u1 + fq, v: cv, w: 12, d: Hq - 30, n: Math.round(Hq / 16) }];
  return { osm: { ruas, areas: [], predios: [] }, padrao: true, soFora: !!ficha.soFora, quadro: Object.assign({ u: MU, v: MV, cu, cv }, o.px ? { px: o.px } : {}), vazado: 0.62, semente: o.semente || 11, corQuadra: o.corQuadra || '#8d887d',
    reservas: [quadra], pisos: [{ pts: quadra, cor: o.corCalcadao || '#b3ad9f' }, ...(o.pisos || []), { pts: solido, tira: true }, ...(o.tiras || [])],
    portoes, bondes, grades, filas: filas.concat(o.filas || []), pm: pm.concat(o.pm || []), entorno: quintais.concat(o.entorno || []), vista: o.vista || [cu - MU * 0.9, MU * 0.75, cv - MV * 1.5, cu, 0, cv] };
}
