/* =========================================================
   AS ROTAS DE DENTRO DOS ESTÁDIOS, pro dia de jogo
   ---------------------------------------------------------
   No dia de jogo (dia_de_jogo.js, no cenário 3D) cada torcida sai da
   sede, chega no portão dela e vai até o LUGAR EXATO dela na
   arquibancada. Da rua até o portão o caminho é achado na hora (a
   cidade muda de praça pra praça); de dentro do estádio, não: o estádio
   é sempre um dos três modelos (estadios3d.js), girado e posto no mapa,
   e achar o caminho nos andares dele custa uns 8 s por portão no de 40
   mil. Então sai daqui, uma vez, pra cada modelo:

   - a BOCA de cada portão: 8 m pra fora da fila (`info.entradas[].ponto`,
     que já fica 2,5 m pra fora da porta), onde a rua encosta;
   - o PORTÃO DE CADA SETOR: dos portões do lado dele (o 1 e o 2 do
     mandante, o 3 do visitante), o de caminho mais curto até o centro do
     setor (o meio do piso na altura da faixa, na fileira do meio);
   - o CAMINHO da boca até o centro, pelos andares (a fila, a catraca, o
     salão, o corredor, a escada interna do de 40, o vomitório e a
     arquibancada), enxugado em retas: dois pontos seguidos se veem se o
     corpo anda em linha reta de um pro outro (o chão a um degrau, o
     corpo cabendo);
   - as VAGAS: as NVAGAS mais perto do centro (o lugar de cada um, a 0,5
     m de degrau por pessoa, estadios3d.js), cada uma com o ponto do
     caminho onde a pessoa sai dele e a CAUDA (as retas até a vaga).

   A busca é a do conferidor (conferir_estadios.mjs): o corpo de RAIO m,
   o degrau de 0,55 m (a fileira da arquibancada tem de 0,40 a 0,52), a
   faixa do corpo de 0,55 a 1,90 m acima do pé, de 10 em 10 cm, com o
   custo de cada passo (10 reto, 14 na diagonal: o caminho mais curto de
   verdade, e não o de menos passos). Grava js/diajogo/rotas_estadios.js.
   Rode de novo quando mexer num estádio (o dia de jogo avisa quando a
   marca do modelo não bate).

     node ferramentas/planta_html/rotas_estadios.mjs
   ========================================================= */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/* o módulo pinta as texturas num canvas; aqui não precisa delas */
const ctx = new Proxy({}, {
  get: (_, k) => k === 'createImageData' ? (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h) * 4) })
    : k === 'measureText' ? () => ({ width: 0 })
    : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} })
    : () => {},
  set: () => true
});
globalThis.document = { createElement: () => ({ get width() { return 1; }, set width(v) {}, get height() { return 1; }, set height(v) {}, getContext: () => ctx }) };

const THREE = await import(path.join(R, 'vendor/three/three.module.min.js'));
const { ESTADIOS_JOGO, montarEstadioJogo, marcaDoEstadio } = await import(path.join(R, 'js/diajogo/estadios3d.js'));
const { Subsolo } = await import(path.join(R, 'ferramentas/planta_html/subsolo.js'));

const RAIO = 0.25, PASSO = 0.1, DEGRAU = 0.55, FAIXA = [0.55, 1.9], BOCA = 8, LIVRE = 14, NVAGAS = 100, AMOSTRA = 0.05;
const SAIDA = path.join(R, 'js/diajogo/rotas_estadios.js');
/* a marca do modelo (estadios3d.js): se ela não bate com a do estádio do mapa, a rota é de outro estádio */
export const marcaDe = marcaDoEstadio;
const r2 = v => Math.round(v * 100) / 100;

const saida = {};
const resumo = [];
for (const id of Object.keys(ESTADIOS_JOGO)) {
  const t0 = Date.now();
  const { grupo, info } = montarEstadioJogo(id, { vagas: true });
  grupo.updateMatrixWorld(true);
  /* OS ANDARES: os triângulos do estádio (sem a camada dos setores; o braço
     da catraca gira, o corpo passa) */
  const S = Subsolo(1, [], { degrau: DEGRAU, faixa: FAIXA });
  const v = new THREE.Vector3();
  grupo.traverse(o => {
    if (!o.isMesh || (o.parent && o.parent.name === 'setores') || o.material.userData.semRisco) return;
    const P = o.geometry.attributes.position, I = o.geometry.index, pts = new Float32Array(I.count * 3);
    for (let k = 0; k < I.count; k++) { v.fromBufferAttribute(P, I.getX(k)).applyMatrix4(o.matrixWorld); pts[k * 3] = v.x; pts[k * 3 + 1] = v.y; pts[k * 3 + 2] = v.z; }
    S.juntar(pts, pts.length / 3);
  });
  S.fechar();
  const casa = q => Math.round(q / PASSO), X = i => i * PASSO;
  const chave = (i, j, yq) => ((yq + 3000) * 20000 + (j + 10000)) * 20000 + (i + 10000);

  /* A BUSCA de cada portão, a partir da boca */
  const buscas = info.entradas.map((E, g) => {
    const [px, pz] = E.ponto, L = Math.hypot(px, pz), dx = px / L, dz = pz / L;
    const pode = (x, z) => info.dentro(x, z) || Math.hypot(x - px, z - pz) < LIVRE;
    /* a boca: pra fora da fila, onde o corpo cabe no chão da rua */
    let boca = null;
    for (const d of [BOCA, BOCA - 1, BOCA + 1, BOCA - 2, BOCA + 2, BOCA - 3, 4, 3]) {
      const i = casa(px + dx * d), j = casa(pz + dz * d), y = S.chao(X(i), X(j), 0);
      if (y === y && S.cabe(X(i), X(j), y, RAIO) && pode(X(i), X(j))) { boca = { i, j, y }; break; }
    }
    if (!boca) throw new Error(`${id}, ${E.nome}: a boca não cabe`);
    /* o custo de cada passo: 10 reto, 14 na diagonal (o balde de Dial) */
    let cap = 1 << 16, I = new Int32Array(cap), J = new Int32Array(cap), Y = new Float32Array(cap), PAI = new Int32Array(cap), D = new Int32Array(cap);
    let n = 0;
    const idx = new Map();
    const novo = (i, j, y, pai, d) => {
      if (n === cap) {
        cap *= 2;
        const cresce = (A, T) => { const B = new T(cap); B.set(A); return B; };
        I = cresce(I, Int32Array); J = cresce(J, Int32Array); Y = cresce(Y, Float32Array); PAI = cresce(PAI, Int32Array); D = cresce(D, Int32Array);
      }
      I[n] = i; J[n] = j; Y[n] = y; PAI[n] = pai; D[n] = d;
      return n++;
    };
    const baldes = Array.from({ length: 15 }, () => []);
    const k0 = novo(boca.i, boca.j, boca.y, -1, 0);
    idx.set(chave(boca.i, boca.j, Math.round(boca.y / 0.02)), k0);
    baldes[0].push(k0);
    let feitos = new Uint8Array(1 << 20), dAtual = 0, vivos = 1;
    while (vivos) {
      const b = baldes[dAtual % 15];
      if (!b.length) { dAtual++; continue; }
      const k = b.pop(); vivos--;
      if (k >= feitos.length) { const f2 = new Uint8Array(feitos.length * 2); f2.set(feitos); feitos = f2; }
      if (feitos[k] || D[k] !== dAtual) continue;
      feitos[k] = 1;
      const i = I[k], j = J[k], y = Y[k];
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        if (!di && !dj) continue;
        const a = i + di, c = j + dj, x = X(a), z = X(c);
        if (!pode(x, z)) continue;
        const y2 = S.chao(x, z, y);
        if (y2 !== y2) continue;
        const ch = chave(a, c, Math.round(y2 / 0.02)), d2 = dAtual + (di && dj ? 14 : 10);
        const ja = idx.get(ch);
        if (ja !== undefined) {
          if (D[ja] > d2 && !(ja < feitos.length && feitos[ja])) { D[ja] = d2; PAI[ja] = k; baldes[d2 % 15].push(ja); vivos++; }
          continue;
        }
        if (!S.cabe(x, z, y2, RAIO)) { idx.set(ch, -1); continue; }
        const kk = novo(a, c, y2, k, d2);
        idx.set(ch, kk);
        baldes[d2 % 15].push(kk); vivos++;
      }
    }
    /* onde cada casa (i, j) foi alcançada, pra achar o alvo */
    const onde = new Map();
    for (let k = 0; k < n; k++) { const q = (J[k] + 10000) * 20000 + I[k] + 10000; const l = onde.get(q); if (l) l.push(k); else onde.set(q, [k]); }
    /* o estado do corpo em (x, y, z) (ou a menos de 20 cm dele, no mesmo piso), o de menor custo */
    const achar = (x, y, z) => {
      const ci = casa(x), cj = casa(z);
      let melhor = -1;
      for (let di = -2; di <= 2; di++) for (let dj = -2; dj <= 2; dj++) {
        const l = onde.get((cj + dj + 10000) * 20000 + ci + di + 10000);
        if (!l) continue;
        for (const k of l) if (Math.abs(Y[k] - y) < 0.12 && (melhor < 0 || D[k] < D[melhor])) melhor = k;
      }
      return melhor;
    };
    const caminho = k => { const c = []; for (; k >= 0; k = PAI[k]) c.push(k); return c.reverse(); };
    return { E, g, boca, n, achar, caminho, I, J, Y, D, pode, ms: Date.now() - t0 };
  });

  /* A RETA de a pra b se anda? (o chão a um degrau de amostra em amostra, o corpo cabendo, dentro da área da busca) */
  const pos = (B, k) => [X(B.I[k]), B.Y[k], X(B.J[k])];
  function seVeem(B, a, b) {
    const [xa, ya, za] = pos(B, a), [xb, yb, zb] = pos(B, b);
    const L = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.ceil(L / AMOSTRA));
    let y = ya;
    for (let s = 1; s <= n; s++) {
      const t = s / n, x = xa + (xb - xa) * t, z = za + (zb - za) * t;
      if (!B.pode(x, z)) return false;
      const y2 = S.chao(x, z, y);
      if (y2 !== y2) return false;
      if (!S.cabe(x, z, y2, RAIO * 0.9)) return false;
      y = y2;
    }
    return Math.abs(y - yb) < 0.15;
  }
  /* o caminho (estados) em retas: de cada ponto, o mais longe que se vê */
  function enxugar(B, c) {
    const out = [0];
    let i = 0;
    while (i < c.length - 1) {
      let bom = i + 1, passo = 2;
      while (i + passo < c.length && seVeem(B, c[i], c[i + passo])) { bom = i + passo; passo *= 2; }
      let lo = bom, hi = Math.min(c.length - 1, i + passo);
      if (hi > lo && seVeem(B, c[i], c[hi])) lo = hi;
      else while (hi - lo > 1) { const m = (lo + hi) >> 1; if (seVeem(B, c[i], c[m])) lo = m; else hi = m; }
      out.push(lo); i = lo;
    }
    return out;
  }
  const plano = (B, c, ks) => ks.flatMap(k => pos(B, c[k]).map(r2));

  const setores = {};
  for (const s of info.setores) {
    if (s.id === 'pm') continue;
    const lado = s.id[0] === 'm' ? 'mandante' : 'visitante';
    const [cx, cy, cz] = s.centro;
    /* as vagas, da mais perto do centro pra mais longe */
    const vagas = s.vagas.map(p => ({ p, d: Math.hypot(p[0] - cx, (p[1] - cy) * 1.5, p[2] - cz) })).sort((a, b) => a.d - b.d);
    /* o portão: o de caminho mais curto até o centro (ou, se o centro não se
       alcança, até a vaga alcançável mais perto dele) */
    let melhor = null;
    for (const B of buscas) {
      if (B.E.lado !== lado) continue;
      for (const vg of vagas.slice(0, 40)) {
        const k = B.achar(vg.p[0], vg.p[1], vg.p[2]);
        if (k < 0) continue;
        if (!melhor || B.D[k] < melhor.B.D[melhor.k]) melhor = { B, k, centro: vg.p };
        break;
      }
    }
    if (!melhor) { resumo.push(`  ${id} ${s.id}: nenhum portão do ${lado} chega`); continue; }
    const B = melhor.B, main = B.caminho(melhor.k), simp = enxugar(B, main);
    /* a posição de cada estado do caminho principal (pra achar onde a cauda sai) */
    const noMain = new Map(main.map((k, m) => [k, m]));
    const lista = [];
    let semCaminho = 0, maxCauda = 0;
    for (const vg of vagas) {
      if (lista.length >= NVAGAS) break;
      const k = B.achar(vg.p[0], vg.p[1], vg.p[2]);
      if (k < 0) { semCaminho++; continue; }
      const c = B.caminho(k);
      /* o último estado em comum com o caminho principal (a árvore da busca é uma só) */
      let d = 0;
      while (d + 1 < c.length && noMain.get(c[d + 1]) === d + 1) d++;
      /* a cauda sai do último ponto enxuto antes de d */
      let a = 0;
      while (a + 1 < simp.length && simp[a + 1] <= d) a++;
      const cauda = main.slice(simp[a], d + 1).concat(c.slice(d + 1));
      const ce = enxugar(B, cauda).slice(1);
      /* o fim é a vaga mesmo (o meio do piso), não o estado da grade */
      const pts = plano(B, cauda, ce);
      pts.splice(pts.length - 3, 3, r2(vg.p[0]), r2(vg.p[1]), r2(vg.p[2]));
      lista.push([a, ...pts]);
      maxCauda = Math.max(maxCauda, ce.length);
    }
    const caminho = plano(B, main, simp);
    setores[s.id] = { portao: B.g, caminho, centro: melhor.centro.map(r2), vagas: lista };
    const comp = (B.D[melhor.k] / 10 * PASSO);
    resumo.push(`  ${id} ${s.id}: ${B.E.nome} (${lado}), ${comp.toFixed(0)} m, ${simp.length} pontos no caminho, ${lista.length} vagas (cauda de até ${maxCauda} retas)${semCaminho ? `, ${semCaminho} vagas sem caminho no meio delas` : ''}`);
  }
  saida[id] = {
    marca: marcaDe(info),
    portoes: buscas.map(B => ({ nome: B.E.nome, lado: B.E.lado, ponto: B.E.ponto.map(r2), boca: [r2(X(B.boca.i)), r2(B.boca.y), r2(X(B.boca.j))] })),
    setores
  };
  resumo.splice(resumo.length - Object.keys(setores).length, 0,
    `${ESTADIOS_JOGO[id].nome}: ${S.n} triângulos, ${buscas.map(B => `${B.E.nome} ${B.n} lugares do corpo`).join(', ')} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

const txt = `/* =========================================================
   AS ROTAS DE DENTRO DOS ESTÁDIOS (o dia de jogo, dia_de_jogo.js)
   GERADO por ferramentas/planta_html/rotas_estadios.mjs — não editar à
   mão: rode de novo quando mexer num estádio (estadios3d.js).
   Em metros, no referencial do modelo (o centro do campo na origem, x
   pro leste, z pro sul, y pra cima). Pra cada modelo: a marca (bate com
   a do estádio do mapa?), os portões (o ponto da fila e a boca, onde a
   rua encosta) e, pra cada setor, o portão dele, o caminho da boca até
   o centro do setor ([x, y, z] em fila) e as vagas, da mais perto do
   centro pra mais longe: [a, x, y, z, …], onde \`a\` é o ponto do
   caminho de onde a cauda sai e o último ponto é a vaga.
   ========================================================= */
export const ROTAS_ESTADIOS = ${JSON.stringify(saida)};
`;
fs.writeFileSync(SAIDA, txt);
console.log(resumo.join('\n'));
console.log(`${path.relative(R, SAIDA)} — ${(txt.length / 1024).toFixed(0)} KB`);
