/* =========================================================
   O BONECO AFINADO: dois níveis tirados do modelo do Blender
   ---------------------------------------------------------
   `img/boneco.glb` (o modelo detalhado, ~22 mil triângulos por boneco:
   a cabeça tem 10,4 mil e cada cabelo 8 mil) continua sendo a fonte e
   não muda. Daqui saem:

   - `img/boneco_perto.glb` — pra quem aparece grande na tela (o boneco
     a pé do cenário, o líder na câmera de ombro): ~2,7 a 3,3 mil
     triângulos por boneco, com o rosto, as mãos e o cabelo;
   - `img/boneco_longe.glb` — pra multidão: ~1,0 a 1,7 mil.

   Antes o jogo afinava na chegada, juntando os vértices numa grade
   (`afinarMalha`, bonecos3.js): 2,2 mil triângulos no jogo e 3,1 mil
   no cenário, mas a cabeça virava uma bolota sem rosto (de 10,4 mil
   pra 270 triângulos) e o corpo quase não afinava. Aqui quem afina é o
   simplificador do meshoptimizer: junta aresta por aresta, sempre a que
   menos muda a forma, e só em cima de vértices que já existem — os pesos
   do esqueleto continuam valendo, e com a borda travada não abre fresta
   entre a pele e a roupa.

   Duas correções depois de afinar, as duas no cabelo:
   - O VOLUME: afinar alisa os cachos pra dentro (o black perdia 8 mm de
     contorno). O cabelo afinado é inflado do quanto o contorno médio dele
     encolheu, a partir do centro da cabeça — menos na borda (a testa, a
     nuca, a costeleta), que fica onde estava.
   - O FURO: o cabelo curto fica a 2 mm do couro, e o erro do afinado
     passa disso; a pele aparecia em manchas no cabelo. Em rodadas, todo
     ponto do cabelo (o canto, o meio de cada aresta, o meio do
     triângulo) que ficou a menos de FOLGA da cabeça afinada empurra os
     cantos do triângulo dele pra fora, até nenhum ficar por dentro.

   A camisa fica inteira no nível de perto: o desenho da torcida é
   pintado nos vértices dela (listras, ombros, faixa).

     npm install --no-save meshoptimizer@1.3.0
     node ferramentas/afinar_boneco.mjs
   ========================================================= */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MeshoptSimplifier as MS } from 'meshoptimizer';
await MS.ready;
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* o alvo de cada peça: `malha` (o começo do nome do nó) e, se precisar,
   `/material`; o valor é [triângulos, erro relativo máximo, trava a
   borda]. Quem não está na lista fica como está. O primeiro que casa vale. */
const NIVEIS = {
  perto: {
    folga: 0.0015,
    alvos: [
      ['cabeca/pele', 450, 0.05, true],
      ['cabelo_moicano_crista', 300, 0.05, true], ['cabelo_rabo_elastico', 200, 0.05, true],
      ['cabelo_black', 900, 0.2, true], ['cabelo_cacheado', 650, 0.2, true],
      ['cabelo_', 300, 0.03, true],
      ['corpo/pele', 1000, 0.05, true],
      ['cordao_grosso', 300, 0.05, true], ['cordao_medalha', 200, 0.05, true],
      ['anel', 160, 0.05, true], ['pulseira', 160, 0.05, true], ['relogio_pulseira', 160, 0.05, true]
    ]
  },
  longe: {
    folga: 0.002,
    alvos: [
      ['cabeca/pele', 100, 0.1, true],
      ['cabelo_moicano_crista', 60, 0.1, true], ['cabelo_rabo_elastico', 40, 0.1, true],
      ['cabelo_black', 250, 0.2, true], ['cabelo_cacheado', 200, 0.2, true],
      ['cabelo_', 80, 0.1, true],
      ['corpo/pele', 300, 0.1, true], ['corpo/camisa', 170, 0.1, true], ['corpo/calca', 120, 0.1, true],
      ['corpo/tenis', 90, 0.1, true], ['corpo/meia', 40, 0.1, true],
      ['cordao_grosso', 60, 0.2, false], ['cordao_medalha', 40, 0.2, false],
      ['anel', 30, 0.2, false], ['pulseira', 30, 0.2, false], ['relogio_pulseira', 30, 0.2, false]
    ]
  }
};

const TIPO = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array, 5121: Uint8Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

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
  const alvoDe = (malha, mat) => cfg.alvos.find(([k]) => { const [m, t] = k.split('/'); return malha.startsWith(m) && (!t || t === mat); });
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
  /* a cabeça: o centro, pro volume e pro furo do cabelo */
  const cab = j.nodes.find(n => n.name === 'cabeca');
  const pCab = cab && j.meshes[cab.mesh].primitives[0];
  const c = [0, 0, 0];
  if (pCab) { const H = dados[pCab.attributes.POSITION]; for (let v = 0; v < H.length; v += 3) for (let k = 0; k < 3; k++) c[k] += H[v + k] * 3 / H.length; }
  const mesmo = (a, b2) => JSON.stringify(a || null) === JSON.stringify(b2 || null);
  const ehCabelo = no => cab && no.name.startsWith('cabelo_') && mesmo(no.translation, cab.translation) && mesmo(no.rotation, cab.rotation) && mesmo(no.scale, cab.scale);
  /* o contorno: o raio máximo em cada setor de direção (16 × 8), a partir do centro da cabeça */
  const setor = (x, y, z) => { const r = Math.hypot(x, y, z); return Math.floor((Math.atan2(z, x) + Math.PI) / (Math.PI / 8)) * 8 + Math.min(7, Math.floor((Math.asin(y / r) + Math.PI / 2) / (Math.PI / 8))); };
  const contorno = P => { const m = new Map(); for (let v = 0; v < P.length; v += 3) { const x = P[v] - c[0], y = P[v + 1] - c[1], z = P[v + 2] - c[2], k = setor(x, y, z); m.set(k, Math.max(m.get(k) || 0, Math.hypot(x, y, z))); } return m; };

  let antes = 0, depois = 0;
  const relatorio = [];
  for (const no of j.nodes) {
    if (no.mesh === undefined) continue;
    for (const p of j.meshes[no.mesh].primitives) {
      const mat = j.materials[p.material].name, idx = new Uint32Array(dados[p.indices]), nt = idx.length / 3;
      antes += nt;
      const a = alvoDe(no.name, mat);
      if (!a || a[1] >= nt) { depois += nt; continue; }
      propria(p);
      const P = dados[p.attributes.POSITION], N = dados[p.attributes.NORMAL];
      const cont0 = ehCabelo(no) ? contorno(P) : null;
      const [novo, erro] = MS.simplifyWithAttributes(idx, P, 3, N, 3, [0.5, 0.5, 0.5], null, a[1] * 3, a[2], a[3] ? ['LockBorder'] : []);
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
      if (cont0) infla = inflar(dados[p.attributes.POSITION], ni, cont0);
      depois += novo.length / 3;
      relatorio.push(`  ${no.name}/${mat}: ${nt} → ${novo.length / 3} (erro ${(erro * MS.getScale(P, 3) * 1000).toFixed(1)} mm${infla ? `, inflado ${(infla * 1000).toFixed(1)} mm` : ''})`);
    }
  }

  /* O VOLUME: o quanto o contorno médio encolheu, devolvido a partir do
     centro da cabeça; na borda, nada (a 2,5 cm dela, tudo) */
  function inflar(P, I, cont0) {
    const cont1 = contorno(P);
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
      const peso = Math.min(1, dmin / 0.025);
      if (!peso) continue;
      const x = P[v * 3] - c[0], y = P[v * 3 + 1] - c[1], z = P[v * 3 + 2] - c[2], r = Math.hypot(x, y, z), f = (r + d * peso) / r;
      P[v * 3] = c[0] + x * f; P[v * 3 + 1] = c[1] + y * f; P[v * 3 + 2] = c[2] + z * f;
    }
    return d;
  }

  /* O FURO: o cabelo por cima da cabeça afinada */
  if (pCab) {
    const HP = dados[pCab.attributes.POSITION], HI = dados[pCab.indices];
    const tris = []; for (let t = 0; t < HI.length; t += 3) tris.push([HI[t], HI[t + 1], HI[t + 2]].map(i => [HP[i * 3], HP[i * 3 + 1], HP[i * 3 + 2]]));
    const sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]], cruz = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], esc = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    /* onde o raio que sai do centro no rumo d deixa a cabeça */
    const saida = d => { let tm = 0; for (const [a, bb, cc] of tris) { const e1 = sub(bb, a), e2 = sub(cc, a), h = cruz(d, e2), det = esc(e1, h); if (Math.abs(det) < 1e-12) continue; const f = 1 / det, s = sub(c, a), u = f * esc(s, h); if (u < 0 || u > 1) continue; const q = cruz(s, e1), w = f * esc(d, q); if (w < 0 || u + w > 1) continue; const t = f * esc(e2, q); if (t > tm) tm = t; } return tm; };
    const AMOSTRAS = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.5, 0.5, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [1 / 3, 1 / 3, 1 / 3]];
    let empurrados = 0;
    for (const no of j.nodes) {
      if (no.mesh === undefined || !ehCabelo(no)) continue;
      for (const p of j.meshes[no.mesh].primitives) {
        const ai = p.attributes.POSITION, P = dados[ai], I = dados[p.indices], nv = P.length / 3;
        const falta = (w0, w1, w2, a, bb, cc) => {
          const q = [0, 1, 2].map(k => w0 * P[a * 3 + k] + w1 * P[bb * 3 + k] + w2 * P[cc * 3 + k]);
          const d = sub(q, c), r = Math.hypot(...d); if (r < 1e-6) return 0;
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
            const d = sub([P[v * 3], P[v * 3 + 1], P[v * 3 + 2]], c), r = Math.hypot(...d);
            for (let k = 0; k < 3; k++) P[v * 3 + k] = c[k] + d[k] / r * (r + precisa[v]);
            empurrados++;
          }
        }
      }
    }
    relatorio.push(`  cabelo empurrado pra fora da cabeça afinada (folga ${(cfg.folga * 1000).toFixed(1)} mm): ${empurrados} vezes`);
  }

  /* o min e o max de toda POSITION (o glTF pede), e o binário de novo:
     um bufferView por accessor, a imagem no fim */
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
    const bv = j.bufferViews[img.bufferView], u8 = new Uint8Array(BIN.buffer, BIN.byteOffset + (bv.byteOffset || 0), bv.byteLength);
    bvs.push({ buffer: 0, byteOffset: junta(u8), byteLength: u8.length }); img.bufferView = bvs.length - 1;
  }
  j.bufferViews = bvs; j.buffers = [{ byteLength: off }];
  /* o carregador do jogo lê daqui que a malha já vem afinada (e não afina de novo) */
  j.asset.extras = { ...(j.asset.extras || {}), afinado: nivel, fonte: 'img/boneco.glb', ferramenta: 'ferramentas/afinar_boneco.mjs' };
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

for (const nivel of Object.keys(NIVEIS)) afinar(path.join(R, 'img/boneco.glb'), nivel);
