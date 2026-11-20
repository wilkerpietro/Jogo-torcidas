/* =========================================================
   OS ARREDORES DE VERDADE DE UM ESTÁDIO (dono, 16/11/2026: "Cena de arredores
   fiel à realidade em todos os estádios e o acesso ao estádio também";
   "ruas do openstreetmap, quarteirões preenchidos com casas genéricas (pegar
   do projeto antigo do jogo 3d), e os prédios, torres, ginásios, clubes e
   viadutos feitos à mão"; "O limite é dois quarteirões ao redor do estádio.
   Entrada do estádio bem feita com os corredores que dão acesso exatamente
   aos setores das respectivas organizadas").

   A ficha do estádio ganha `arredores`:
     osm       as ruas de verdade, no quadro da ficha (osm_arredores.py);
     quadro    { u, v, cu, cv }: meia largura e meia altura da cena, em metros, e o
               meio dela (se não for o meio do campo);
     limite    o contorno de até onde se anda (dono, com o desenho por cima da
               primeira versão: "Pode ser uma cena só desse tamanho"): fora
               dele a cidade continua desenhada, mais escura, e não se pisa;
     pisos     o chão andável FORA das ruas, em ordem: `{ pts }` (polígono),
               `{ pts, larg }` (faixa) e `{ pts, tira: true }` (recorta);
     portoes   [{ n, nome, u, v, dir: [du, dv] }]: onde fica cada portão e pra
               que lado se entra;
     bondes    { mandante1: { de: [u, v], portao: n }, .. }: de onde cada
               bonde chega (o ponto encosta sozinho na rua mais perto; com
               `exato: true` fica onde foi posto, se ali se anda) e por
               qual portão entra;
     servico   true: as ruas de serviço do mapa (as do estacionamento) também
               entram, sem calçada e sem casa (o Serra Dourada, que fica no
               meio de um estacionamento);
     grades    [{ de, ate }] (o cordão que separa a visitante), filas
               [{ pts }] (o gradil de organizar fila), pm [[u, v], ..];
     predios   { 'nome no mapa': { h, cor } }: a altura dos prédios que o
               mapa tem contorno; `entorno`: o que é feito à mão (os mesmos
               tipos do `entorno` da ficha).
   As CASAS são as do jogo 3D antigo (cenario3d/js/casas3d.js), no modo
   chapado (cor lisa, sem textura): um lote a cada 7 a 12 m, dos dois lados
   de cada rua, onde couber.
   ========================================================= */
const RAD = Math.PI / 180;
/* o metro do jogo 3D antigo, em unidades do mundo dele (construtor3d.js) */
const M = 34 / 1.75;
const VIAS = new Set(['trunk', 'primary', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'residential', 'living_street', 'unclassified', 'pedestrian']);
const dSeg = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, q = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / q)); return Math.hypot(px - ax - dx * t, py - ay - dy * t); };
const dentroPoli = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
function semente(n) { let s = n >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---- A PLANTA: a malha de 1 m com as vias, o chão andável e os lotes ---- */
export function preparar(ficha) {
  const ar = ficha.arredores, osm = ar.osm, MU = ar.quadro.u, MV = ar.quadro.v, cu = ar.quadro.cu || 0, cv = ar.quadro.cv || 0, B = 26;
  const x0 = cu - MU - B, y0 = cv - MV - B, GW = Math.ceil((MU + B) * 2), GH = Math.ceil((MV + B) * 2);
  const via = new Uint8Array(GW * GH), ocup = new Uint8Array(GW * GH), piso = new Uint8Array(GW * GH);
  const cel = (u, v) => { const i = Math.floor(u - x0), j = Math.floor(v - y0); return i < 0 || j < 0 || i >= GW || j >= GH ? -1 : j * GW + i; };
  const calc = ar.calcada == null ? 2.6 : ar.calcada;
  const ruas = osm.ruas.filter(r => (VIAS.has(r.tipo) || (ar.servico && r.tipo === 'service')) && !(ar.semRua || []).includes(r.nome)).map(r => Object.assign({}, r, { larg: (ar.largura && ar.largura[r.nome]) || r.larg }))
    .sort((a, b) => b.larg - a.larg);
  const pintarFaixa = (pts, meia, valor, alvo) => { for (let k = 0; k < pts.length - 1; k++) { const ax = pts[k][0], ay = pts[k][1], bx = pts[k + 1][0], by = pts[k + 1][1];
      const i0 = Math.max(0, Math.floor(Math.min(ax, bx) - meia - x0)), i1 = Math.min(GW - 1, Math.ceil(Math.max(ax, bx) + meia - x0));
      const j0 = Math.max(0, Math.floor(Math.min(ay, by) - meia - y0)), j1 = Math.min(GH - 1, Math.ceil(Math.max(ay, by) + meia - y0));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (dSeg(x0 + i + 0.5, y0 + j + 0.5, ax, ay, bx, by) <= meia) alvo[j * GW + i] = valor; } };
  const pintarPoli = (pts, valor, alvo) => { let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const p of pts) { a0 = Math.min(a0, p[0]); a1 = Math.max(a1, p[0]); b0 = Math.min(b0, p[1]); b1 = Math.max(b1, p[1]); }
    for (let j = Math.max(0, Math.floor(b0 - y0)); j <= Math.min(GH - 1, Math.ceil(b1 - y0)); j++) for (let i = Math.max(0, Math.floor(a0 - x0)); i <= Math.min(GW - 1, Math.ceil(a1 - x0)); i++)
      if (dentroPoli(pts, x0 + i + 0.5, y0 + j + 0.5)) alvo[j * GW + i] = valor; };
  /* as vias: 2 = calçada, 1 = asfalto */
  for (const r of ruas) if (r.tipo !== 'service') pintarFaixa(r.pts, r.larg / 2 + calc, 2, via);
  /* (a rua de serviço não tem calçada: com 5 m, na escala da cena, o corpo do boneco não cabia nela e o bonde ficava preso;
     anda-se numa faixa de pelo menos 9 m — o asfalto desenhado continua com a largura do mapa) */
  for (const r of ruas) pintarFaixa(r.pts, r.tipo === 'service' ? Math.max(r.larg / 2, ar.servicoMeia || 4.5) : r.larg / 2, 1, via);
  /* onde não cabe casa: as vias, o estádio, os prédios e as áreas do mapa, e o que a ficha reservar */
  for (let q = 0; q < via.length; q++) if (via[q]) ocup[q] = 1;
  for (const a of osm.areas) if (/stadium|pitch|park|parking|wood|railway/.test(a.tipo) && a.pts.length > 3) pintarPoli(a.pts, 1, ocup);
  for (const p of osm.predios) pintarPoli(p.pts, 1, ocup);
  for (const p of ar.reservas || []) pintarPoli(p, 1, ocup);
  for (const e of ar.entorno || []) if (e.w && e.d) pintarPoli([[e.u - e.w / 2 - 1, e.v - e.d / 2 - 1], [e.u + e.w / 2 + 1, e.v - e.d / 2 - 1], [e.u + e.w / 2 + 1, e.v + e.d / 2 + 1], [e.u - e.w / 2 - 1, e.v + e.d / 2 + 1]], 1, ocup);
  /* o chão andável fora das vias, na ordem da ficha */
  for (const p of ar.pisos || []) { if (p.larg) pintarFaixa(p.pts, p.larg / 2, p.tira ? 0 : 1, piso); else pintarPoli(p.pts, p.tira ? 0 : 1, piso); }
  for (let q = 0; q < piso.length; q++) if (piso[q]) ocup[q] = 1;
  /* OS LOTES: andando por cada rua, dos dois lados, um lote onde couber (o fundo encolhe se bater em alguma coisa) */
  const rnd = semente(ar.semente || 7), lotes = [];
  const cabe = (fu, fv, tx, ty, nx, ny, w, d) => { for (let a = 0.5; a < d; a += 1) for (let b = -w / 2 + 0.5; b < w / 2; b += 1) { const q = cel(fu + tx * b + nx * a, fv + ty * b + ny * a); if (q < 0 || ocup[q]) return false; } return true; };
  const marcar = (fu, fv, tx, ty, nx, ny, w, d) => { for (let a = 0; a <= d; a += 0.5) for (let b = -w / 2; b <= w / 2; b += 0.5) { const q = cel(fu + tx * b + nx * a, fv + ty * b + ny * a); if (q >= 0) ocup[q] = 2; } };
  for (const r of ruas) { if (r.tipo === 'pedestrian' || r.tipo === 'service' || r.ponte || r.tunel) continue;
    const eixo = r.tipo !== 'residential' && r.tipo !== 'living_street';
    for (const lado of [1, -1]) { let s = rnd() * 3;
      for (let k = 0; k < r.pts.length - 1; k++) { const ax = r.pts[k][0], ay = r.pts[k][1], bx = r.pts[k + 1][0], by = r.pts[k + 1][1], L = Math.hypot(bx - ax, by - ay); if (L < 1) continue;
        const tx = (bx - ax) / L, ty = (by - ay) / L, nx = -ty * lado, ny = tx * lado, rec = r.larg / 2 + calc + 0.3;
        while (s + 6 <= L) { const w = Math.min(L - s, eixo ? 7 + rnd() * 6 : 7 + rnd() * 5), d0 = 15 + rnd() * 9, fu = ax + tx * (s + w / 2) + nx * rec, fv = ay + ty * (s + w / 2) + ny * rec;
          let d = 0; for (const dd of [d0, d0 * 0.75, 10.5, 8]) if (cabe(fu, fv, tx, ty, nx, ny, w, dd)) { d = dd; break; }
          if (d) { marcar(fu, fv, tx, ty, nx, ny, w, d); const h = rnd(), g = rnd();
            const o = eixo ? (h < 0.28 ? { tipo: 'casa', placa: true, alt: 3.7 } : h < 0.5 ? { tipo: 'sobrado', placa: true, alt: 6.8 } : h < 0.72 ? { tipo: 'predio', alt: 9 + 3 * Math.floor(g * 3), placa: g < 0.5 } : h < 0.8 ? { tipo: 'galpao', alt: 6 } : { tipo: 'sobrado', alt: 6.4 })
                           : (h < 0.5 ? { tipo: 'casa', alt: 3.3 } : h < 0.86 ? { tipo: 'sobrado', alt: 6.4 } : h < 0.95 ? { tipo: 'predio', alt: 9 + 3 * Math.floor(g * 2) } : { tipo: 'casa', placa: true, alt: 3.7 });
            if (d < 9.5 && o.tipo === 'predio') { o.tipo = 'sobrado'; o.alt = 6.4; delete o.placa; }
            lotes.push(Object.assign({ u: fu, v: fv, tx, ty, nx, ny, w, d }, o)); s += w; } else s += 2; }
        s = Math.max(0, s - L); } } }
  const andavel = (u, v) => { const q = cel(u, v); return q >= 0 && (via[q] > 0 || piso[q] > 0) && (!ar.limite || dentroPoli(ar.limite, u, v)); };
  /* o ponto de rua (no eixo) mais perto de um lugar: é onde nasce o bonde */
  const naRua = (u, v) => { let m = null; for (const r of ruas) for (let k = 0; k < r.pts.length - 1; k++) { const ax = r.pts[k][0], ay = r.pts[k][1], bx = r.pts[k + 1][0], by = r.pts[k + 1][1], dx = bx - ax, dy = by - ay, q = dx * dx + dy * dy || 1e-9;
      const t = Math.max(0, Math.min(1, ((u - ax) * dx + (v - ay) * dy) / q)), x = ax + dx * t, y = ay + dy * t, d = Math.hypot(u - x, v - y); if (Math.abs(x - cu) > MU - 4 || Math.abs(y - cv) > MV - 4 || (ar.limite && !dentroPoli(ar.limite, x, y))) continue; if (!m || d < m.d) m = { d, u: x, v: y }; }
    return m ? [m.u, m.v] : [u, v]; };
  return { ar, osm, MU, MV, cu, cv, calc, ruas, lotes, via, piso, cel, andavel, naRua };
}

/* ---- O DESENHO: as ruas, as calçadas, as casas, os prédios do mapa, os portões ---- */
export function construirArredores(THREE, ficha, prep, casasMod) {
  const { ar, osm, MU, MV, cu, cv, calc, ruas, lotes } = prep, grupo = new THREE.Group();
  const mat = (h, extra) => new THREE.MeshLambertMaterial(Object.assign({ color: new THREE.Color(h) }, extra || {}));
  const sombra = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const caixa = (w, h, d, c, u, y, v, giro) => { const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c))); m.position.set(u, y, -v); if (giro) m.rotation.y = giro; grupo.add(m); return m; };
  /* uma malha de triângulos coloridos (o chão das ruas) */
  const Malha = () => { const pos = [], cor = [], c = new THREE.Color();
    const tri = (a, b, d, h) => { c.set(h); for (const p of [a, b, d]) { pos.push(p[0], p[1], p[2]); cor.push(c.r, c.g, c.b); } };
    return { tri, quad: (a, b, d, e, h) => { tri(a, b, d, h); tri(a, d, e, h); }, malha: () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); m.receiveShadow = true; return m; } }; };
  const P = (u, v, y) => [u, y, -v], C = Malha();
  const faixa = (pts, meia, y, h) => { for (let k = 0; k < pts.length - 1; k++) { const ax = pts[k][0], ay = pts[k][1], bx = pts[k + 1][0], by = pts[k + 1][1], L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L * meia, ny = (bx - ax) / L * meia;
      C.quad(P(ax + nx, ay + ny, y), P(bx + nx, by + ny, y), P(bx - nx, by - ny, y), P(ax - nx, ay - ny, y), h); }
    for (const p of pts) for (let i = 0; i < 12; i++) { const a0 = i * 30 * RAD, a1 = (i + 1) * 30 * RAD; C.tri(P(p[0], p[1], y), P(p[0] + Math.cos(a0) * meia, p[1] + Math.sin(a0) * meia, y), P(p[0] + Math.cos(a1) * meia, p[1] + Math.sin(a1) * meia, y), h); } };
  const poli = (pts, y, h) => { const sh = new THREE.Shape(pts.map(q => new THREE.Vector2(q[0], q[1]))), g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, mat(h)); m.position.y = y; m.receiveShadow = true; grupo.add(m); };
  /* o chão dos quarteirões */
  { const m = new THREE.Mesh(new THREE.PlaneGeometry((MU + 60) * 2, (MV + 60) * 2), mat(ar.corQuadra || '#8d887d')); m.rotation.x = -Math.PI / 2; m.position.set(cu, 0.0, -cv); m.receiveShadow = true; grupo.add(m); }
  /* as calçadas, o asfalto e a faixa do meio das ruas maiores */
  for (const r of ruas) if (r.tipo !== 'service') faixa(r.pts, r.larg / 2 + calc, 0.05, r.tipo === 'pedestrian' ? '#c9c2b0' : '#b9b5aa');
  for (const r of ruas) if (r.tipo !== 'pedestrian') faixa(r.pts, r.larg / 2, r.tipo === 'service' ? 0.085 : 0.09, r.tipo === 'service' ? '#646569' : r.larg >= 10 ? '#4f5054' : '#57585c');
  for (const r of ruas) { if (r.larg < 10) continue; let s = 2;
    for (let k = 0; k < r.pts.length - 1; k++) { const ax = r.pts[k][0], ay = r.pts[k][1], bx = r.pts[k + 1][0], by = r.pts[k + 1][1], L = Math.hypot(bx - ax, by - ay) || 1, tx = (bx - ax) / L, ty = (by - ay) / L, nx = -ty * 0.11, ny = tx * 0.11;
      for (; s + 3 < L; s += 7) { const u0 = ax + tx * s, v0 = ay + ty * s, u1 = ax + tx * (s + 3), v1 = ay + ty * (s + 3); C.quad(P(u0 + nx, v0 + ny, 0.11), P(u1 + nx, v1 + ny, 0.11), P(u1 - nx, v1 - ny, 0.11), P(u0 - nx, v0 - ny, 0.11), '#d9c36a'); }
      s = Math.max(0, s - L); } }
  /* o chão andável fora das ruas: o calçadão, o estacionamento, a rua de serviço */
  for (const p of ar.pisos || []) { if (p.tira) continue; if (p.larg) faixa(p.pts, p.larg / 2, p.y || 0.07, p.cor || '#a9a59a'); else poli(p.pts, p.y || 0.06, p.cor || '#a9a59a'); }
  grupo.add(C.malha());
  /* AS CASAS do jogo 3D antigo, no modo chapado */
  let casas = 0, falhas = 0;
  if (casasMod) { casasMod.OPCOES_CASAS.tudoLowPoly = true; const destino = { casas: [] };
    for (const l of lotes) { let ang = Math.atan2(l.nx, l.ny); if (Math.abs(ang) < 1e-4) ang = 1e-4;
      const lote = { ang, vf: 1, cx: (l.u + l.nx * l.d / 2) * M, cy: -(l.v + l.ny * l.d / 2) * M, w: l.w * M, h: l.d * M, tipo: l.tipo, alt: l.alt * M, nobre: false };
      if (l.placa) lote.placa = true;
      try { const p = casasMod.planoDaCasa(lote); if (p) { casasMod.montarCasa(lote, p, destino); casas++; } else falhas++; } catch (e) { falhas++; if (falhas < 4) console.error('casa: ' + e.message); } }
    let n = 0; for (const b of destino.casas) n += b.pos.length;
    const pos = new Float32Array(n), cor = new Float32Array(n); let o = 0;
    for (const b of destino.casas) { for (let i = 0; i < b.pos.length; i++) pos[o + i] = b.pos[i] / M; if (b.cor.length === b.pos.length) cor.set(b.cor, o); else cor.fill(0.8, o, o + b.pos.length); o += b.pos.length; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(cor, 3)); g.computeVertexNormals();
    grupo.add(sombra(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })))); }
  /* OS PRÉDIOS QUE O MAPA TEM (o contorno é do mapa; a altura, da ficha ou do tipo) e as áreas */
  for (const p of osm.predios) { if (p.tipo === 'stadium' || dentroDoEstadio(osm, p.pts)) continue;
    const o = (ar.predios && ar.predios[p.nome]) || {}, h = o.h || (+p.altura) || (+p.andares ? +p.andares * 3 : p.tipo === 'apartments' ? 36 : 7);
    const sh = new THREE.Shape(p.pts.map(q => new THREE.Vector2(q[0], q[1]))), g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
    grupo.add(sombra(new THREE.Mesh(g, mat(o.cor || (p.tipo === 'apartments' ? '#d6d2c6' : '#b9b4a8'), { flatShading: true }))));
    const t = new THREE.ShapeGeometry(sh); t.rotateX(-Math.PI / 2); const m = new THREE.Mesh(t, mat(o.corTeto || '#8f8d88')); m.position.y = h + 0.05; m.receiveShadow = true; grupo.add(m); }
  for (const a of osm.areas) { if (a.pts.length < 4 || dentroDoEstadio(osm, a.pts)) continue;
    if (a.tipo === 'leisure=pitch') poli(a.pts, 0.06, /Quadra/.test(a.nome) ? '#b5553f' : '#4f9a55'); else if (a.tipo === 'leisure=park' || a.tipo === 'natural=wood') poli(a.pts, 0.06, '#6f9a5c'); }
  /* O NOME DAS RUAS, escrito no asfalto (uma vez cada, no trecho mais comprido dentro do quadro) */
  const vistos = new Map();
  for (const r of ruas) { if (!r.nome || (ar.semNome || []).includes(r.nome)) continue;
    for (let k = 0; k < r.pts.length - 1; k++) { const a = r.pts[k], b = r.pts[k + 1], mu = (a[0] + b[0]) / 2, mv = (a[1] + b[1]) / 2, L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Math.abs(mu - cu) > MU - 25 || Math.abs(mv - cv) > MV - 12 || L < 34 || (ar.limite && !dentroPoli(ar.limite, mu, mv))) continue;
      const q = vistos.get(r.nome); if (!q || L > q.L) vistos.set(r.nome, { L, mu, mv, tx: (b[0] - a[0]) / L, ty: (b[1] - a[1]) / L, larg: r.larg }); } }
  const letreiro = (txt, u, v, y, tx, ty, larg, alt, corTexto, fundo) => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.max(32, Math.round(1024 * alt / larg)); const x = cv.getContext('2d');
    if (fundo) { x.fillStyle = fundo; x.fillRect(0, 0, cv.width, cv.height); }
    x.fillStyle = corTexto; x.textAlign = 'center'; x.textBaseline = 'middle'; let px = cv.height * 0.72; x.font = '700 ' + px + 'px Arial, Helvetica, sans-serif';
    const lw = x.measureText(txt).width; if (lw > cv.width * 0.94) { px *= cv.width * 0.94 / lw; x.font = '700 ' + px + 'px Arial, Helvetica, sans-serif'; }
    x.fillText(txt, cv.width / 2, cv.height / 2);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    if (tx < -0.01 || (Math.abs(tx) <= 0.01 && ty < 0)) { tx = -tx; ty = -ty; }
    pl.rotation.order = 'YXZ'; pl.rotation.x = -Math.PI / 2; pl.rotation.y = Math.atan2(ty, tx); pl.position.set(u, y, -v); grupo.add(pl); };
  for (const [nome, q] of vistos) letreiro(nome.toUpperCase(), q.mu, q.mv, 0.13, q.tx, q.ty, Math.min(q.L * 0.8, nome.length * 2.1), Math.min(3, q.larg * 0.36), 'rgba(236,233,220,0.78)');
  /* OS PORTÕES: os dois pilares, a viga com o nome em cima e as catracas */
  for (const g of ar.portoes || []) { const dl = Math.hypot(g.dir[0], g.dir[1]) || 1, du = g.dir[0] / dl, dv = g.dir[1] / dl, tx = -dv, ty = du, larg = g.larg || 9, giro = Math.atan2(ty, tx), cor = g.cor || '#1f6a45';
    for (const sg of [-1, 1]) caixa(0.7, 4, 0.7, '#e9ebe6', g.u + tx * sg * larg / 2, 2, g.v + ty * sg * larg / 2);
    /* (a viga é larga e o nome vai deitado em cima dela, grande: é de cima que a cena é vista) */
    caixa(larg + 1.4, 1.5, 3, cor, g.u, 4.25, g.v, giro);
    letreiro(g.nome || ('PORTÃO ' + g.n), g.u, g.v, 5.06, tx, ty, larg + 1, Math.min(2.5, (larg + 1) / 5), '#f4f5f0');
    for (let k = 0; k < 4; k++) { const f = (k + 0.5) / 4 - 0.5; caixa(0.9, 1.1, 0.5, '#3b3e42', g.u + tx * f * (larg - 1.4) + du * 1.2, 0.55, g.v + ty * f * (larg - 1.4) + dv * 1.2, giro); } }
  /* os muros da ficha (a rua de serviço, o fundo dos lotes) */
  for (const m of ar.muros || []) for (let k = 0; k < m.pts.length - 1; k++) { const a = m.pts[k], b = m.pts[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); caixa(L, m.h || 2.6, m.esp || 0.4, m.cor || '#d9d6cc', (a[0] + b[0]) / 2, (m.h || 2.6) / 2, (a[1] + b[1]) / 2, Math.atan2(b[1] - a[1], b[0] - a[0])); }
  return { grupo, casas, falhas };
}
function dentroDoEstadio(osm, pts) { const e = osm.areas.find(a => a.tipo === 'leisure=stadium'); if (!e) return false; const cu = pts.reduce((q, p) => q + p[0], 0) / pts.length, cv = pts.reduce((q, p) => q + p[1], 0) / pts.length; return dentroPoli(e.pts, cu, cv); }

/* ---- OS MARCADORES da cena, no formato da cena de arredores do jogo (dados/cena_arredores.js) ---- */
export function marcadoresArredores(ficha, prep, paraPx) {
  const ar = prep.ar, px = (u, v) => { const p = paraPx(u, v); return { x: Math.round(p[0]), y: Math.round(p[1]) }; }, par = (u, v) => { const p = paraPx(u, v); return [Math.round(p[0]), Math.round(p[1])]; };
  const portao = n => (ar.portoes || []).find(g => g.n === n), ROT = { mandante1: '1º ESCALÃO MANDANTE', mandante2: '2º ESCALÃO MANDANTE', mandante3: '3º ESCALÃO MANDANTE', visitante1: '1º ESCALÃO VISITANTE', visitante2: '2º ESCALÃO VISITANTE', visitante3: '3º ESCALÃO VISITANTE' };
  const entradas = [], spawns = [], idDe = n => 'ent_p' + n;
  for (const id of ['mandante1', 'mandante2', 'mandante3', 'visitante1', 'visitante2', 'visitante3']) { const b = ar.bondes[id]; if (!b) continue; const g = portao(b.portao), lado = id.startsWith('m') ? 'mandante' : 'visitante', q = b.exato && prep.andavel(b.de[0], b.de[1]) ? b.de : prep.naRua(b.de[0], b.de[1]);
    if (!entradas.find(e => e.id === idDe(g.n))) { const dl = Math.hypot(g.dir[0], g.dir[1]) || 1;
      entradas.push(Object.assign({ id: idDe(g.n), rot: 'ENTRADA ' + (lado === 'visitante' ? 'VISITANTE' : ROT[id]) + ' · ' + (g.nome || 'PORTÃO ' + g.n), lado, raio: 34, dir: [+(g.dir[0] / dl).toFixed(2), +(-g.dir[1] / dl).toFixed(2)] }, px(g.u, g.v))); }
    spawns.push(Object.assign({ id, rot: ROT[id], lado }, px(q[0], q[1]), id === 'mandante1' ? { jogador: true } : {}, { entrada: idDe(g.n) })); }
  return { spawns, entradas, pmPostos: (ar.pm || []).map(p => px(p[0], p[1])),
    filas: (ar.filas || []).map((f, i) => ({ id: 'fila_' + (i + 1), pontos: f.pts.map(p => par(p[0], p[1])), espessura: 9 })),
    grades: (ar.grades || []).map((g, i) => { const a = px(g.de[0], g.de[1]), b = px(g.ate[0], g.ate[1]); return { id: 'grade_' + (i + 1), rot: 'GRADE DE PROTEÇÃO', de: a, ate: b, modulos: Math.max(2, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 26)), espessura: 11 }; }),
    fugas: spawns.map(s => ({ x: s.x, y: s.y, raio: 34 })) };
}
/* a máscara, no formato do jogo: por linha, quantas células bloqueadas, quantas livres, quantas bloqueadas… */
export function mascaraArredores(prep, paraMetros, W, H, cel) {
  const linhas = [];
  for (let r = 0; r < H / cel; r++) { const partes = []; let v = 0, n = 0;
    for (let c = 0; c < W / cel; c++) { let livres = 0; for (const [dx, dy] of [[2, 2], [6, 2], [2, 6], [6, 6], [4, 4]]) { const m = paraMetros(c * cel + dx, r * cel + dy); if (prep.andavel(m[0], m[1])) livres++; }
      const livre = livres >= 4 ? 1 : 0; if (livre === v) n++; else { partes.push(n); v = livre; n = 1; } }
    partes.push(n); linhas.push(partes.join(',')); }
  return linhas.join(';');
}
