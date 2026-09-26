/* =========================================================
   DA RUA, CADA TORCIDA CHEGA NA ARQUIBANCADA DELA — E SÓ NELA?
   ---------------------------------------------------------
   Os três estádios do jogo (js/diajogo/estadios3d.js) têm três entradas
   da rua (os portões 1 e 2 do mandante, o 3 do visitante), o corredor
   debaixo da arquibancada e o vomitório, que é o único caminho do
   corredor pra arquibancada. Este teste monta cada estádio, passa os
   triângulos pro subsolo (subsolo.js, a mesma conta do boneco a pé no
   metrô) e procura, de 20 em 20 cm, por onde um corpo de RAIO m passa a
   partir da fila de cada portão (`info.entradas[].ponto`, 2,5 m pra fora
   da porta). O corpo sobe até DEGRAU m de um passo (o degrau da
   arquibancada é de 0,40 a 0,52 m) e bate no que tem de FAIXA acima do
   pé; o braço da catraca não conta (ele gira: o material dele diz
   `semRisco`, e o cenário também não bate nele). Fora do estádio (o muro
   do de 10 mil, a fachada do de 20 e do de 40) só se anda perto do
   começo: a rua liga os portões, o teste é do lado de dentro.

   O que ele alcança se mede na camada dos setores: o chão pintado de
   cada setor (a cor do escalão) e de cada trecho do corredor (a cor de
   quem usa). Pede, de cada portão:
   - todo o trecho do corredor do lado dele;
   - pelo menos 90% do chão de cada setor do lado dele (o que fica colado
     numa parede ou num gradil não cabe o corpo);
   - nada do outro lado nem da PM (a faixa da PM é fechada por gradil:
     da rua não se chega nela).

     node ferramentas/planta_html/conferir_estadios.mjs
   ========================================================= */
import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/* o módulo pinta as texturas num canvas; aqui não precisa delas: um
   canvas de mentira, de 1 pixel, que aceita tudo */
const ctx = new Proxy({}, {
  get: (_, k) => k === 'createImageData' ? (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h) * 4) })
    : k === 'measureText' ? () => ({ width: 0 })
    : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} })
    : () => {},
  set: () => true
});
globalThis.document = { createElement: () => ({ get width() { return 1; }, set width(v) {}, get height() { return 1; }, set height(v) {}, getContext: () => ctx }) };

const THREE = await import(path.join(R, 'vendor/three/three.module.min.js'));
const { ESTADIOS_JOGO, montarEstadioJogo } = await import(path.join(R, 'js/diajogo/estadios3d.js'));
const { Subsolo } = await import(path.join(R, 'ferramentas/planta_html/subsolo.js'));

const RAIO = 0.2, PASSO = 0.2, DEGRAU = 0.55, FAIXA = [0.55, 1.9], LIVRE = 10, MINIMO = 0.9;
/* a cor de cada setor e de cada trecho do corredor (as de estadios3d.js) */
const SETOR = { '#1b7f3b': 'm1', '#43a047': 'm2', '#9ccc3c': 'm3', '#c62828': 'v1', '#ef6c00': 'v2', '#f2b705': 'v3', '#1f3f9a': 'pm' };
const ZONA = { '#c62828': 'visitante', '#1b7f3b': 'mandante', '#1f3f9a': 'pm' };
const ladoDoSetor = id => id === 'pm' ? 'pm' : id[0] === 'm' ? 'mandante' : 'visitante';

let falhas = 0;
for (const id of Object.keys(ESTADIOS_JOGO)) {
  const t0 = Date.now();
  const { grupo, info } = montarEstadioJogo(id);
  grupo.updateMatrixWorld(true);
  const niveis = [...new Set(info.corredores.map(c => c.y))];
  const S = Subsolo(1, [], { degrau: DEGRAU, faixa: FAIXA });
  const setores = grupo.getObjectByName('setores'), alvos = [];
  const v = new THREE.Vector3();
  grupo.traverse(o => {
    if (!o.isMesh) return;
    const P = o.geometry.attributes.position, I = o.geometry.index, pts = new Float32Array(I.count * 3);
    for (let k = 0; k < I.count; k++) { v.fromBufferAttribute(P, I.getX(k)).applyMatrix4(o.matrixWorld); pts[k * 3] = v.x; pts[k * 3 + 1] = v.y; pts[k * 3 + 2] = v.z; }
    if (o.parent === setores) {
      /* os alvos: o meio de cada pedaço de chão pintado (sem as lascas coladas num gradil) */
      const cor = '#' + o.material.color.getHexString();
      for (let k = 0; k < I.count * 3; k += 9) {
        const ys = [pts[k + 1], pts[k + 4], pts[k + 7]];
        if (Math.max(...ys) - Math.min(...ys) > 1e-3) continue;
        const area = Math.abs((pts[k + 3] - pts[k]) * (pts[k + 8] - pts[k + 2]) - (pts[k + 6] - pts[k]) * (pts[k + 5] - pts[k + 2])) / 2;
        if (area < 0.08) continue;
        const x = (pts[k] + pts[k + 3] + pts[k + 6]) / 3, z = (pts[k + 2] + pts[k + 5] + pts[k + 8]) / 3;
        const nivel = niveis.find(n => Math.abs(ys[0] - (n + 0.04)) < 0.004);
        if (nivel !== undefined) alvos.push({ nome: 'corredor ' + ZONA[cor], lado: ZONA[cor], x, z, y: nivel });
        else alvos.push({ nome: SETOR[cor], lado: ladoDoSetor(SETOR[cor]), x, z, y: ys[0] - 0.05 });
      }
      return;
    }
    /* o braço da catraca: gira, o corpo passa (o balde dele não barra) */
    if (o.material.userData.semRisco) return;
    S.juntar(pts, pts.length / 3);
  });
  S.fechar();
  console.log(`${ESTADIOS_JOGO[id].nome}: montado em ${((Date.now() - t0) / 1000).toFixed(1)} s, ${S.n} triângulos, ${alvos.length} pontos de chão pintado`);

  let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
  for (const a of alvos) { bx0 = Math.min(bx0, a.x); bx1 = Math.max(bx1, a.x); bz0 = Math.min(bz0, a.z); bz1 = Math.max(bz1, a.z); }
  for (const E of info.entradas) {
    const [sx, sz] = E.ponto, t1 = Date.now();
    const x0 = Math.min(sx, bx0) - 30, z0 = Math.min(sz, bz0) - 30, x1 = Math.max(sx, bx1) + 30, z1 = Math.max(sz, bz1) + 30;
    const nx = Math.ceil((x1 - x0) / PASSO), nz = Math.ceil((z1 - z0) / PASSO);
    const chave = (i, j, y) => (Math.round(y / 0.02) + 200) * nx * nz + j * nx + i;
    const pode = (x, z) => info.dentro(x, z) || Math.hypot(x - sx, z - sz) < LIVRE;
    const visto = new Set(), fila = [];
    const i0 = Math.round((sx - x0) / PASSO), j0 = Math.round((sz - z0) / PASSO), y0 = S.chao(x0 + i0 * PASSO, z0 + j0 * PASSO, 0);
    if (y0 === y0 && S.cabe(x0 + i0 * PASSO, z0 + j0 * PASSO, y0, RAIO)) { visto.add(chave(i0, j0, y0)); fila.push([i0, j0, y0]); }
    for (let f = 0; f < fila.length; f++) {
      const [i, j, y] = fila[f];
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        if (!di && !dj) continue;
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
        const x = x0 + a * PASSO, z = z0 + b * PASSO;
        if (!pode(x, z)) continue;
        const y2 = S.chao(x, z, y);
        if (y2 !== y2) continue;
        const k = chave(a, b, y2);
        if (visto.has(k) || !S.cabe(x, z, y2, RAIO)) continue;
        visto.add(k); fila.push([a, b, y2]);
      }
    }
    /* o alvo foi alcançado se tem um lugar do corpo na célula dele (ou numa do lado), na altura do pé */
    const onde = new Map();
    for (const [i, j, y] of fila) { const k = j * nx + i; if (!onde.has(k)) onde.set(k, []); onde.get(k).push(y); }
    const conta = new Map();
    for (const a of alvos) {
      const i = Math.round((a.x - x0) / PASSO), j = Math.round((a.z - z0) / PASSO);
      let ok = false;
      for (let di = -1; di <= 1 && !ok; di++) for (let dj = -1; dj <= 1 && !ok; dj++) { const l = onde.get((j + dj) * nx + i + di); if (l && l.some(y => Math.abs(y - a.y) < 0.12)) ok = true; }
      const c = conta.get(a.nome) || { lado: a.lado, sim: 0, tot: 0 };
      c.tot++; if (ok) c.sim++;
      conta.set(a.nome, c);
    }
    const erros = [], linha = [];
    for (const [nome, c] of [...conta].sort()) {
      const f = c.sim / c.tot;
      linha.push(`${nome} ${Math.round(100 * f)}%`);
      if (c.lado === E.lado && nome.startsWith('corredor') && c.sim < c.tot) erros.push(`não chega em todo o ${nome}`);
      if (c.lado === E.lado && !nome.startsWith('corredor') && f < MINIMO) erros.push(`só chega em ${Math.round(100 * f)}% do ${nome}`);
      if (c.lado !== E.lado && c.sim) erros.push(`chega no ${nome} (${c.sim} pontos)`);
    }
    if (erros.length) falhas++;
    console.log(`  ${E.nome} (${E.lado}): ${fila.length} lugares do corpo em ${((Date.now() - t1) / 1000).toFixed(1)} s · ${linha.join(' · ')}${erros.length ? '\n    ERRO: ' + erros.join('; ') : ' · ok'}`);
  }
}
console.log(falhas ? `${falhas} portão(ões) com erro` : 'de cada portão a torcida chega no corredor e na arquibancada do lado dela, e só nelas');
process.exit(falhas ? 1 : 0);
