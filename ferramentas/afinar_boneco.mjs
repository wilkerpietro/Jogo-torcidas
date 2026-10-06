/* =========================================================
   O BONECO AFINADO: dois níveis tirados do modelo do jogo 2D
   ---------------------------------------------------------
   A FONTE (06/10/2026): `img/boneco_leve.glb`, o boneco refeito pelo
   jogo 2D sobre humanos de verdade (ferramentas/boneco_base.py): o corpo
   anatômico e a cabeça do MakeHuman numa malha só com esqueleto (`corpo`,
   uma peça por material — pele, camisa, faixa, faixa2, gola, punho,
   punho2, calça/calção, meia), os olhos (`rosto_olhos`), o tênis de cada
   pé e os cabelos e adereços pendurados nos ossos. São ~6,3 mil
   triângulos de corpo, e o boneco vestido passa de 7 mil — pesado pra
   300 bonecos numa praça. Daqui saem:

   - `img/boneco_perto.glb` — pra quem aparece grande na tela (o boneco
     a pé do cenário, a sala do presidente): ~3 mil triângulos por boneco,
     com o rosto quase inteiro, as mãos e o cabelo;
   - `img/boneco_longe.glb` — pra multidão: ~1,2 mil.

   Quem afina é o simplificador do meshoptimizer: junta aresta por aresta,
   sempre a que menos muda a forma, e só em cima de vértices que já
   existem — os pesos do esqueleto continuam valendo. Cada peça tem a
   borda travada: a divisa entre a pele e a roupa não abre fresta.

   - A PELE EM DUAS PARTES: a cabeça (acima do pescoço) e o resto do
     corpo são afinados cada um com o seu alvo — o rosto (a UV do mapa de
     detalhe: lábio, olho, sobrancelha) leva mais triângulos que a canela.
     A volta do pescoço fica travada nas duas, e a malha segue fechada.
   - O CABELO: afinar alisa os cachos pra dentro e a pele aparecia em
     manchas. O cabelo afinado é inflado do quanto o contorno médio dele
     encolheu, a partir do centro da cabeça (menos na borda — a testa, a
     nuca, a costeleta), e todo ponto dele que ficou a menos de FOLGA da
     cabeça afinada empurra os cantos do triângulo pra fora. O cabelo
     está pendurado no osso da cabeça; a cabeça é a pele do `corpo`, então
     a conta é feita no espaço de cada cabelo (a cabeça vai até lá).
   - A TEXTURA DA PELE (o mapa de detalhe, 1024 px em PNG, 1 MB) entra
     em 512 px, JPEG: no jogo o boneco tem de 30 a 150 px de altura.

     npm install --no-save meshoptimizer@1.3.0
     node ferramentas/afinar_boneco.mjs
   ========================================================= */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { MeshoptSimplifier as MS } from 'meshoptimizer';
await MS.ready;
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTE = 'img/boneco_leve.glb';
/* a altura (m, em pé) que separa a cabeça do resto da pele: o osso do
   pescoço está a 1,455 m e o da cabeça a 1,522 m */
const CORTE_CABECA = 1.49;
const TEXTURA_PX = 512, TEXTURA_Q = 86;

/* o alvo de cada peça: `malha` (o começo do nome do nó) e, se precisar,
   `/material` (e `:cabeca` ou `:corpo`, as duas partes da pele); o valor é
   [triângulos, erro máximo em mm, trava a borda]. O erro é em milímetros
   e não relativo ao tamanho da peça: a pele agora é o corpo inteiro (1,75
   m), e 10% dele desmanchava mão e pé. Quem não está na lista fica como
   está. O primeiro que casa vale. */
const NIVEIS = {
  /* perto: o boneco tem de 110 px de altura pra cima na tela (1 px ≈ 13 mm
     no de 135 px) — o rosto segura 6 mm, o resto 15 */
  perto: {
    folga: 0.0015,
    alvos: [
      ['corpo/pele:cabeca', 650, 6, true], ['corpo/pele:corpo', 520, 15, true],
      ['corpo/camisa', 480, 15, true], ['corpo/calca', 420, 15, true], ['corpo/gola', 110, 8, true],
      ['corpo/faixa', 70, 8, true], ['corpo/faixa2', 70, 8, true],
      ['corpo/punho', 60, 8, true], ['corpo/punho2', 60, 8, true], ['corpo/meia', 60, 10, true],
      ['rosto_olhos/olho', 90, 3, true],
      ['tenis/tenis', 100, 10, true],
      ['cabelo_rabo_elastico', 160, 5, true], ['cabelo_', 380, 10, true],
      ['cordao_grosso', 220, 5, true], ['cordao_medalha', 160, 5, true],
      ['anel', 60, 3, true], ['pulseira', 80, 4, true], ['relogio_pulseira', 80, 4, true]
    ]
  },
  /* longe: a multidão, de 20 a 110 px de altura (1 px ≈ 16 a 90 mm) */
  longe: {
    folga: 0.002,
    alvos: [
      ['corpo/pele:cabeca', 170, 25, true], ['corpo/pele:corpo', 230, 60, true],
      ['corpo/camisa', 190, 50, true], ['corpo/calca', 150, 50, true], ['corpo/gola', 40, 30, true],
      ['corpo/faixa', 36, 30, true], ['corpo/faixa2', 36, 30, true],
      ['corpo/punho', 30, 30, true], ['corpo/punho2', 30, 30, true], ['corpo/meia', 24, 40, true],
      ['rosto_olhos/olho', 24, 12, false],
      ['tenis/tenis', 40, 40, true], ['tenis/sola', 16, 40, true],
      ['cabelo_moicano_crista', 60, 25, true], ['cabelo_rabo_elastico', 40, 15, true],
      ['cabelo_coque_bola', 60, 20, true], ['cabelo_rabo_ponta', 60, 20, true],
      ['cabelo_', 140, 35, true],
      ['cordao_grosso', 60, 20, false], ['cordao_medalha', 40, 20, false],
      ['anel', 30, 12, false], ['pulseira', 30, 15, false], ['relogio_pulseira', 30, 15, false]
    ]
  }
};

const TIPO = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array, 5121: Uint8Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

/* as matrizes (coluna por coluna, como no glTF) */
const mul = (A, B) => { const C = new Array(16).fill(0); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) C[c * 4 + r] += A[k * 4 + r] * B[c * 4 + k]; return C; };
const trs = n => {
  if (n.matrix) return n.matrix;
  const [x, y, z, w] = n.rotation || [0, 0, 0, 1], [sx, sy, sz] = n.scale || [1, 1, 1], [tx, ty, tz] = n.translation || [0, 0, 0];
  return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
          2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
          2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, tx, ty, tz, 1];
};
const inv = m => {
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  return [(a11 * b11 - a12 * b10 + a13 * b09) * d, (a02 * b10 - a01 * b11 - a03 * b09) * d, (a31 * b05 - a32 * b04 + a33 * b03) * d, (a22 * b04 - a21 * b05 - a23 * b03) * d,
          (a12 * b08 - a10 * b11 - a13 * b07) * d, (a00 * b11 - a02 * b08 + a03 * b07) * d, (a32 * b02 - a30 * b05 - a33 * b01) * d, (a20 * b05 - a22 * b02 + a23 * b01) * d,
          (a10 * b10 - a11 * b08 + a13 * b06) * d, (a01 * b08 - a00 * b10 - a03 * b06) * d, (a30 * b04 - a31 * b02 + a33 * b00) * d, (a21 * b02 - a20 * b04 - a23 * b00) * d,
          (a11 * b07 - a10 * b09 - a12 * b06) * d, (a00 * b09 - a01 * b07 + a02 * b06) * d, (a31 * b01 - a30 * b03 - a32 * b00) * d, (a20 * b03 - a21 * b01 + a22 * b00) * d];
};
const aplicar = (M, x, y, z) => [M[0] * x + M[4] * y + M[8] * z + M[12], M[1] * x + M[5] * y + M[9] * z + M[13], M[2] * x + M[6] * y + M[10] * z + M[14]];

/* a textura da pele em 512 px, JPEG (o Pillow faz a conta) */
function texturaMenor(png) {
  const r = spawnSync('python3', ['-c', `import sys, io
from PIL import Image
im = Image.open(io.BytesIO(sys.stdin.buffer.read())).convert('RGB').resize((${TEXTURA_PX}, ${TEXTURA_PX}), Image.LANCZOS)
o = io.BytesIO(); im.save(o, 'JPEG', quality=${TEXTURA_Q}, optimize=True); sys.stdout.buffer.write(o.getvalue())`], { input: png, maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error('textura: ' + r.stderr.toString());
  return new Uint8Array(r.stdout);
}

function afinar(entrada, nivel) {
  const cfg = NIVEIS[nivel];
  const b = fs.readFileSync(entrada);
  const lenJ = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + lenJ).toString()), BIN = b.subarray(20 + lenJ + 8);
  /* os dados de cada accessor, soltos */
  const dados = j.accessors.map(a => {
    const bv = j.bufferViews[a.bufferView], T = TIPO[a.componentType], n = NC[a.type];
    const off = (bv.byteOffset || 0) + (a.byteOffset || 0);
    return new T(BIN.buffer.slice(BIN.byteOffset + off, BIN.byteOffset + off + a.count * n * T.BYTES_PER_ELEMENT));
  });
  const alvoDe = (malha, mat, parte) => cfg.alvos.find(([k]) => {
    const [km, kp] = k.split(':'), [m, t] = km.split('/');
    return malha.startsWith(m) && (!t || t === mat) && (!kp || kp === parte);
  });
  /* índices divididos entre peças (o anel, a pulseira e o relógio têm a
     mesma lista): quem for afinado ganha a sua */
  const usos = new Map();
  for (const m of j.meshes) for (const p of m.primitives) usos.set(p.indices, (usos.get(p.indices) || 0) + 1);
  const propria = p => {
    if (usos.get(p.indices) < 2) return;
    usos.set(p.indices, usos.get(p.indices) - 1);
    j.accessors.push({ ...j.accessors[p.indices] }); dados.push(dados[p.indices].slice());
    p.indices = j.accessors.length - 1; usos.set(p.indices, 1);
  };
  /* as matrizes do mundo, em pé (o corpo esqueletizado já está no mundo: o
     osso em repouso vezes a inversa do bind é a identidade) */
  const pai = new Map(); j.nodes.forEach((n, i) => (n.children || []).forEach(c => pai.set(c, i)));
  const mundo = i => { let M = trs(j.nodes[i]); for (let p = pai.get(i); p !== undefined; p = pai.get(p)) M = mul(trs(j.nodes[p]), M); return M; };
  const iCorpo = j.nodes.findIndex(n => n.name === 'corpo' && n.mesh !== undefined);
  const pPele = iCorpo >= 0 ? j.meshes[j.nodes[iCorpo].mesh].primitives.find(p => j.materials[p.material].name === 'pele') : null;
  const ehCabelo = no => no.name.startsWith('cabelo_') && no.mesh !== undefined;

  /* a cabeça (a pele acima do pescoço, no mundo): o centro, pro volume e pro furo do cabelo */
  const naCabeca = (P, I, t) => P[I[t] * 3 + 1] > CORTE_CABECA && P[I[t + 1] * 3 + 1] > CORTE_CABECA && P[I[t + 2] * 3 + 1] > CORTE_CABECA;
  const c = [0, 0, 0];
  if (pPele) {
    const P = dados[pPele.attributes.POSITION]; let n = 0;
    for (let v = 0; v < P.length; v += 3) if (P[v + 1] > CORTE_CABECA + 0.06) { for (let k = 0; k < 3; k++) c[k] += P[v + k]; n++; }
    for (let k = 0; k < 3; k++) c[k] /= Math.max(1, n);
  }
  /* o contorno de um cabelo: o raio máximo em cada setor de direção (16 × 8), a partir do centro da cabeça no espaço dele */
  const setor = (x, y, z) => { const r = Math.hypot(x, y, z); return Math.floor((Math.atan2(z, x) + Math.PI) / (Math.PI / 8)) * 8 + Math.min(7, Math.floor((Math.asin(y / r) + Math.PI / 2) / (Math.PI / 8))); };
  const contorno = (P, cc) => { const m = new Map(); for (let v = 0; v < P.length; v += 3) { const x = P[v] - cc[0], y = P[v + 1] - cc[1], z = P[v + 2] - cc[2], k = setor(x, y, z); m.set(k, Math.max(m.get(k) || 0, Math.hypot(x, y, z))); } return m; };
  const centroDe = no => aplicar(inv(mundo(j.nodes.indexOf(no))), c[0], c[1], c[2]);

  /* AFINAR UMA LISTA DE TRIÂNGULOS de uma peça; devolve a lista nova (nos índices velhos) */
  const simplificar = (idx, P, N, a) => MS.simplifyWithAttributes(idx, P, 3, N, 3, [0.5, 0.5, 0.5], null, a[1] * 3,
    a[2] / 1000 / MS.getScale(P, 3), a[3] ? ['LockBorder'] : []);

  let antes = 0, depois = 0;
  const relatorio = [];
  for (const no of j.nodes) {
    if (no.mesh === undefined) continue;
    for (const p of j.meshes[no.mesh].primitives) {
      const mat = j.materials[p.material].name, idx = new Uint32Array(dados[p.indices]), nt = idx.length / 3;
      antes += nt;
      const P = dados[p.attributes.POSITION], N = dados[p.attributes.NORMAL];
      /* a pele: a cabeça e o corpo, cada um com o seu alvo */
      const partes = p === pPele ? (() => {
        const cab = [], cor = [];
        for (let t = 0; t < idx.length; t += 3) (naCabeca(P, idx, t) ? cab : cor).push(idx[t], idx[t + 1], idx[t + 2]);
        return [['cabeca', new Uint32Array(cab)], ['corpo', new Uint32Array(cor)]];
      })() : [[null, idx]];
      const alvos = partes.map(([parte, ix]) => [parte, ix, alvoDe(no.name, mat, parte)]);
      if (!alvos.some(([, ix, a]) => a && a[1] < ix.length / 3)) { depois += nt; continue; }
      propria(p);
      const cont0 = ehCabelo(no) ? contorno(P, centroDe(no)) : null;
      let novo = [], erroMax = 0;
      for (const [parte, ix, a] of alvos) {
        if (!a || a[1] >= ix.length / 3) { novo.push(...ix); continue; }
        const [n, erro] = simplificar(ix, P, N, a);
        novo.push(...n); erroMax = Math.max(erroMax, erro);
        if (parte) relatorio.push(`  ${no.name}/${mat}:${parte}: ${ix.length / 3} → ${n.length / 3}`);
      }
      /* só os vértices usados, na ordem nova */
      const usa = new Int32Array(P.length / 3).fill(-1); let k = 0;
      for (const i of novo) if (usa[i] < 0) usa[i] = k++;
      const velhos = new Int32Array(k); for (let i = 0; i < usa.length; i++) if (usa[i] >= 0) velhos[usa[i]] = i;
      for (const ai of Object.values(p.attributes)) {
        const d = dados[ai], n = NC[j.accessors[ai].type], out = new d.constructor(k * n);
        for (let v = 0; v < k; v++) for (let q = 0; q < n; q++) out[v * n + q] = d[velhos[v] * n + q];
        dados[ai] = out; j.accessors[ai].count = k;
      }
      const ni = k < 65536 ? new Uint16Array(novo.length) : new Uint32Array(novo.length);
      for (let t = 0; t < novo.length; t++) ni[t] = usa[novo[t]];
      dados[p.indices] = ni; j.accessors[p.indices].count = ni.length; j.accessors[p.indices].componentType = k < 65536 ? 5123 : 5125;
      let infla = 0;
      if (cont0) infla = inflar(dados[p.attributes.POSITION], ni, cont0, centroDe(no));
      depois += novo.length / 3;
      relatorio.push(`  ${no.name}/${mat}: ${nt} → ${novo.length / 3} (erro ${(erroMax * MS.getScale(P, 3) * 1000).toFixed(1)} mm${infla ? `, inflado ${(infla * 1000).toFixed(1)} mm` : ''})`);
    }
  }

  /* O VOLUME: o quanto o contorno médio encolheu, devolvido a partir do
     centro da cabeça; na borda, nada (a 2,5 cm dela, tudo) */
  function inflar(P, I, cont0, cc) {
    const cont1 = contorno(P, cc);
    let soma = 0, n = 0;
    for (const [k, r1] of cont1) if (cont0.has(k)) { soma += Math.max(0, cont0.get(k) - r1); n++; }
    const d = n ? soma / n : 0;
    if (d < 0.0005) return 0;
    /* a borda: aresta com um triângulo só */
    const arestas = new Map();
    for (let t = 0; t < I.length; t += 3) for (const [x, y] of [[I[t], I[t + 1]], [I[t + 1], I[t + 2]], [I[t + 2], I[t]]]) { const ch = x < y ? x * 1e6 + y : y * 1e6 + x; arestas.set(ch, (arestas.get(ch) || 0) + 1); }
    const borda = new Set();
    for (const [ch, q] of arestas) if (q === 1) { borda.add(Math.floor(ch / 1e6)); borda.add(ch % 1e6); }
    const bs = [...borda];
    for (let v = 0; v < P.length / 3; v++) {
      let dmin = Infinity;
      for (const w of bs) dmin = Math.min(dmin, Math.hypot(P[v * 3] - P[w * 3], P[v * 3 + 1] - P[w * 3 + 1], P[v * 3 + 2] - P[w * 3 + 2]));
      const peso = bs.length ? Math.min(1, dmin / 0.025) : 1;
      if (!peso) continue;
      const x = P[v * 3] - cc[0], y = P[v * 3 + 1] - cc[1], z = P[v * 3 + 2] - cc[2], r = Math.hypot(x, y, z), f = (r + d * peso) / r;
      P[v * 3] = cc[0] + x * f; P[v * 3 + 1] = cc[1] + y * f; P[v * 3 + 2] = cc[2] + z * f;
    }
    return d;
  }

  /* O FURO: o cabelo por cima da cabeça afinada (a cabeça levada pro espaço de cada cabelo) */
  if (pPele) {
    const HPm = dados[pPele.attributes.POSITION], HIm = dados[pPele.indices];
    const trisMundo = []; for (let t = 0; t < HIm.length; t += 3) if (naCabeca(HPm, HIm, t)) trisMundo.push([HIm[t], HIm[t + 1], HIm[t + 2]].map(i => [HPm[i * 3], HPm[i * 3 + 1], HPm[i * 3 + 2]]));
    const sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]], cruz = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], esc = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const AMOSTRAS = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.5, 0.5, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [1 / 3, 1 / 3, 1 / 3]];
    let empurrados = 0;
    for (const no of j.nodes) {
      if (!ehCabelo(no)) continue;
      const Mi = inv(mundo(j.nodes.indexOf(no))), cc = aplicar(Mi, c[0], c[1], c[2]);
      const tris = trisMundo.map(tr => tr.map(q => aplicar(Mi, q[0], q[1], q[2])));
      /* onde o raio que sai do centro no rumo d deixa a cabeça */
      const saida = d => { let tm = 0; for (const [a, bb, c2] of tris) { const e1 = sub(bb, a), e2 = sub(c2, a), h = cruz(d, e2), det = esc(e1, h); if (Math.abs(det) < 1e-12) continue; const f = 1 / det, s = sub(cc, a), u = f * esc(s, h); if (u < 0 || u > 1) continue; const q = cruz(s, e1), w = f * esc(d, q); if (w < 0 || u + w > 1) continue; const t = f * esc(e2, q); if (t > tm) tm = t; } return tm; };
      for (const p of j.meshes[no.mesh].primitives) {
        const ai = p.attributes.POSITION, P = dados[ai], I = dados[p.indices], nv = P.length / 3;
        const falta = (w0, w1, w2, a, bb, c2) => {
          const q = [0, 1, 2].map(k => w0 * P[a * 3 + k] + w1 * P[bb * 3 + k] + w2 * P[c2 * 3 + k]);
          const d = sub(q, cc), r = Math.hypot(...d); if (r < 1e-6) return 0;
          const t = saida([d[0] / r, d[1] / r, d[2] / r]); return t ? t + cfg.folga - r : 0;
        };
        for (let rodada = 0; rodada < 30; rodada++) {
          const precisa = new Float32Array(nv); let pior = 0;
          for (let t = 0; t < I.length; t += 3) {
            let m = 0; for (const [w0, w1, w2] of AMOSTRAS) m = Math.max(m, falta(w0, w1, w2, I[t], I[t + 1], I[t + 2]));
            if (m > 1e-5) { for (const v of [I[t], I[t + 1], I[t + 2]]) precisa[v] = Math.max(precisa[v], m); pior = Math.max(pior, m); }
          }
          if (pior < 1e-4) break;
          for (let v = 0; v < nv; v++) if (precisa[v] > 0) {
            const d = sub([P[v * 3], P[v * 3 + 1], P[v * 3 + 2]], cc), r = Math.hypot(...d);
            for (let k = 0; k < 3; k++) P[v * 3 + k] = cc[k] + d[k] / r * (r + precisa[v]);
            empurrados++;
          }
        }
      }
    }
    relatorio.push(`  cabelo empurrado pra fora da cabeça afinada (folga ${(cfg.folga * 1000).toFixed(1)} mm): ${empurrados} vezes`);
  }

  /* o min e o max de toda POSITION (o glTF pede), e o binário de novo:
     um bufferView por accessor, a imagem no fim (a da pele, menor) */
  for (const m of j.meshes) for (const p of m.primitives) {
    const ai = p.attributes.POSITION, P = dados[ai], mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let v = 0; v < P.length; v += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], P[v + k]); mx[k] = Math.max(mx[k], P[v + k]); }
    j.accessors[ai].min = mn; j.accessors[ai].max = mx;
  }
  const partes = []; let off = 0;
  const junta = u8 => { const o = off; partes.push(u8); off += u8.length; const pad = (4 - off % 4) % 4; if (pad) { partes.push(new Uint8Array(pad)); off += pad; } return o; };
  const bvs = [];
  j.accessors.forEach((a, i) => {
    const u8 = new Uint8Array(dados[i].buffer, dados[i].byteOffset, dados[i].byteLength), alvo = j.bufferViews[a.bufferView].target;
    bvs.push({ buffer: 0, byteOffset: junta(u8), byteLength: u8.length, ...(alvo ? { target: alvo } : {}) });
    a.bufferView = i; delete a.byteOffset;
  });
  for (const img of j.images || []) {
    const bv = j.bufferViews[img.bufferView];
    let u8 = new Uint8Array(BIN.buffer, BIN.byteOffset + (bv.byteOffset || 0), bv.byteLength);
    if (img.mimeType === 'image/png' && /^pele/.test(img.name || '')) { u8 = texturaMenor(Buffer.from(u8)); img.mimeType = 'image/jpeg'; }
    bvs.push({ buffer: 0, byteOffset: junta(u8), byteLength: u8.length }); img.bufferView = bvs.length - 1;
  }
  j.bufferViews = bvs; j.buffers = [{ byteLength: off }];
  /* o carregador do jogo lê daqui que a malha já vem afinada (e não afina de novo) */
  j.asset.extras = { ...(j.asset.extras || {}), afinado: nivel, fonte: FONTE, ferramenta: 'ferramentas/afinar_boneco.mjs' };
  let js = Buffer.from(JSON.stringify(j)); if (js.length % 4) js = Buffer.concat([js, Buffer.alloc(4 - js.length % 4, 0x20)]);
  const bin = Buffer.concat(partes.map(p => Buffer.from(p.buffer, p.byteOffset, p.byteLength)));
  const cabec = Buffer.alloc(12); cabec.writeUInt32LE(0x46546C67, 0); cabec.writeUInt32LE(2, 4); cabec.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const cj = Buffer.alloc(8); cj.writeUInt32LE(js.length, 0); cj.writeUInt32LE(0x4E4F534A, 4);
  const cb = Buffer.alloc(8); cb.writeUInt32LE(bin.length, 0); cb.writeUInt32LE(0x004E4942, 4);
  const saida = path.join(R, `img/boneco_${nivel}.glb`);
  fs.writeFileSync(saida, Buffer.concat([cabec, cj, js, cb, bin]));
  console.log(`${nivel}: ${antes} → ${depois} triângulos no arquivo (todas as variantes) · ${(fs.statSync(entrada).size / 1024).toFixed(0)} → ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`);
  console.log(relatorio.join('\n'));
}

for (const nivel of Object.keys(NIVEIS)) afinar(path.join(R, FONTE), nivel);
