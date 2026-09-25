/* =========================================================
   O PASSO: onde o corpo do boneco bate
   ---------------------------------------------------------
   O corpo é um círculo de raio r no chão, e bate no que as coisas têm
   na FAIXA DO CORPO — de 35 cm a 1,80 m do chão: a parede, o muro, a
   grade, a folha da porta aberta, o carro, o poste, o tronco, a mesa, a
   cadeira. O meio-fio, o capacho e o degrau baixo ficam embaixo dela;
   a verga, a prateleira alta e a copa, em cima.

   De cada triângulo que corta a faixa sai o RISCO, no chão, do pedaço
   dele que está nela: a parede (em pé) vira um risco só, ao longo
   dela; o tampo da mesa e o assento da cadeira (deitados), o contorno.
   É contra esses riscos que o corpo desliza — exato, sem grade: a porta
   de 80 cm passa, o vão de 40 cm entre dois móveis não.

   Quem usa: o cenário 3D (cenario.js, o boneco a pé) e o conferidor da
   sede (conferir_passagem.mjs), que prova com a mesma conta que todo
   cômodo da sede se alcança do portão.
   ========================================================= */
export const FAIXA_M = [0.35, 1.8];

/* OS RISCOS DA FAIXA: P são triângulos soltos (x, y, z em unidades de
   mundo), n vértices; y0 e y1 a faixa, em unidades; `emitir(ax, az, bx,
   bz)` recebe cada risco. `fino` é a espessura abaixo da qual o pedaço
   é uma reta (a parede vista de cima), em unidades */
export function riscosDaFaixa(P, n, y0, y1, fino, emitir) {
  const A = new Float64Array(24), B = new Float64Array(24);
  const cortar = (de, m, y, acima, pra) => {
    let k2 = 0;
    for (let k = 0; k < m; k++) {
      const a = k * 3, b = ((k + 1) % m) * 3;
      const da = acima ? de[a + 1] - y : y - de[a + 1], db = acima ? de[b + 1] - y : y - de[b + 1];
      if (da >= 0) { pra[k2 * 3] = de[a]; pra[k2 * 3 + 1] = de[a + 1]; pra[k2 * 3 + 2] = de[a + 2]; k2++; }
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        pra[k2 * 3] = de[a] + (de[b] - de[a]) * t; pra[k2 * 3 + 1] = y; pra[k2 * 3 + 2] = de[a + 2] + (de[b + 2] - de[a + 2]) * t; k2++;
      }
    }
    return k2;
  };
  for (let o = 0; o + 8 < n * 3; o += 9) {
    const ya = P[o + 1], yb = P[o + 4], yc = P[o + 7];
    const ymax = Math.max(ya, yb, yc), ymin = Math.min(ya, yb, yc);
    if (ymax < y0 || ymin > y1) continue;
    for (let k = 0; k < 9; k++) A[k] = P[o + k];
    let m = 3, poli = A;
    if (ymin < y0) { m = cortar(poli, m, y0, true, B); poli = B; }
    if (ymax > y1) { const pra = poli === A ? B : A; m = cortar(poli, m, y1, false, pra); poli = pra; }
    if (m < 2) continue;
    /* os dois pontos mais longe um do outro; se o resto está colado na
       reta deles, o pedaço é uma reta (em pé) e sai um risco só */
    let ia = 0, ib = 0, dmax = -1;
    for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) {
      const d = (poli[i * 3] - poli[j * 3]) ** 2 + (poli[i * 3 + 2] - poli[j * 3 + 2]) ** 2;
      if (d > dmax) { dmax = d; ia = i; ib = j; }
    }
    if (dmax <= 1e-8) continue;
    const ax = poli[ia * 3], az = poli[ia * 3 + 2], bx = poli[ib * 3], bz = poli[ib * 3 + 2], L = Math.sqrt(dmax);
    let largo = 0;
    for (let i = 0; i < m; i++) largo = Math.max(largo, Math.abs((poli[i * 3] - ax) * (bz - az) - (poli[i * 3 + 2] - az) * (bx - ax)) / L);
    if (largo < fino) { emitir(ax, az, bx, bz); continue; }
    for (let k = 0; k < m; k++) {
      const a = k * 3, b = ((k + 1) % m) * 3;
      emitir(poli[a], poli[a + 2], poli[b], poli[b + 2]);
    }
  }
}

/* AS PAREDES: os riscos num balde por célula (`cel` unidades), pra
   achar depressa os que estão perto do corpo. `juntar` põe o risco (o
   repetido entra uma vez: a borda que dois triângulos da mesma face
   dividem; `novaCoisa` diz que a coisa mudou); `fechar` arruma tudo em
   vetores; `empurrar` tira o corpo de dentro dos riscos (deslizando),
   `cabe` diz se o corpo cabe ali */
export function Paredes(x0, z0, x1, z1, cel) {
  const nx = Math.max(1, Math.ceil((x1 - x0) / cel)), nz = Math.max(1, Math.ceil((z1 - z0) / cel));
  let seg = new Float32Array(4096), n = 0;
  let ini = null, idx = null;
  /* o risco repetido: ele vem colado no igual (a borda que dois
     triângulos da mesma face dividem), então basta olhar os últimos 16
     da mesma coisa, pela ponta — a ponta vira um número só (x e z a meia
     unidade, somados com folga pra não dar negativo) */
  const ponta = (x, z) => (Math.round(x * 2) + 262144) * 1048576 + (Math.round(z * 2) + 262144);
  const ult1 = new Float64Array(16), ult2 = new Float64Array(16);
  let nUlt = 0;
  const minimo2 = (0.01 * 34 / 1.75) ** 2;       // (1 cm)²: menor que isso não é risco
  function juntar(ax, az, bx, bz) {
    if ((bx - ax) ** 2 + (bz - az) ** 2 < minimo2) return;
    let k1 = ponta(ax, az), k2 = ponta(bx, bz);
    if (k1 > k2) { const t = k1; k1 = k2; k2 = t; }
    for (let i = Math.min(nUlt, 16) - 1; i >= 0; i--) if (ult1[i] === k1 && ult2[i] === k2) return;
    ult1[nUlt & 15] = k1; ult2[nUlt & 15] = k2; nUlt++;
    if (n * 4 + 4 > seg.length) { const s2 = new Float32Array(seg.length * 2); s2.set(seg); seg = s2; }
    seg[n * 4] = ax; seg[n * 4 + 1] = az; seg[n * 4 + 2] = bx; seg[n * 4 + 3] = bz; n++;
  }
  function fechar() {
    seg = seg.slice(0, n * 4);
    /* duas passadas: conta quantos riscos cada balde tem, depois põe */
    const conta = new Uint32Array(nx * nz + 1), faixas = new Int32Array(n * 4);
    for (let s = 0, o = 0; s < n; s++, o += 4) {
      const ax = seg[o], az = seg[o + 1], bx = seg[o + 2], bz = seg[o + 3];
      const i0 = Math.max(0, Math.floor(((ax < bx ? ax : bx) - x0) / cel)), i1 = Math.min(nx - 1, Math.floor(((ax < bx ? bx : ax) - x0) / cel));
      const j0 = Math.max(0, Math.floor(((az < bz ? az : bz) - z0) / cel)), j1 = Math.min(nz - 1, Math.floor(((az < bz ? bz : az) - z0) / cel));
      faixas[o] = i0; faixas[o + 1] = i1; faixas[o + 2] = j0; faixas[o + 3] = j1;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) conta[j * nx + i + 1]++;
    }
    for (let c = 0; c < nx * nz; c++) conta[c + 1] += conta[c];
    ini = conta; idx = new Uint32Array(conta[nx * nz]);
    const pos = conta.slice(0, nx * nz);
    for (let s = 0, o = 0; s < n; s++, o += 4)
      for (let j = faixas[o + 2]; j <= faixas[o + 3]; j++) for (let i = faixas[o]; i <= faixas[o + 1]; i++) idx[pos[j * nx + i]++] = s;
  }
  /* o ponto do risco s mais perto de (x, z) */
  const P = { x: 0, z: 0 };
  function maisPerto(s, x, z) {
    const ax = seg[s * 4], az = seg[s * 4 + 1], dx = seg[s * 4 + 2] - ax, dz = seg[s * 4 + 3] - az;
    const L2 = dx * dx + dz * dz;
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)) : 0;
    P.x = ax + dx * t; P.z = az + dz * t;
    return P;
  }
  /* os riscos das células em volta de (x, z) até r; `fn(s)` pra cada um
     (um risco em várias células pode vir mais de uma vez) */
  function perto(x, z, r, fn) {
    const i0 = Math.max(0, Math.floor((x - r - x0) / cel)), i1 = Math.min(nx - 1, Math.floor((x + r - x0) / cel));
    const j0 = Math.max(0, Math.floor((z - r - z0) / cel)), j1 = Math.min(nz - 1, Math.floor((z + r - z0) / cel));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const c = j * nx + i;
      for (let k = ini[c]; k < ini[c + 1]; k++) if (fn(idx[k]) === false) return false;
    }
    return true;
  }
  function cabe(x, z, r) {
    return perto(x, z, r, s => { const p = maisPerto(s, x, z); return (p.x - x) ** 2 + (p.z - z) ** 2 >= r * r; });
  }
  /* tira o círculo (o objeto `c`, com x e z) de dentro dos riscos: cada
     risco que ele invade o empurra pra fora, pela reta do ponto mais
     perto; três voltas resolvem o canto */
  function empurrar(c, r) {
    let mexeu = false;
    for (let volta = 0; volta < 3; volta++) {
      let aqui = false;
      perto(c.x, c.z, r, s => {
        const p = maisPerto(s, c.x, c.z), dx = c.x - p.x, dz = c.z - p.z, d2 = dx * dx + dz * dz;
        if (d2 >= r * r) return;
        const d = Math.sqrt(d2);
        if (d > 1e-6) { c.x = p.x + dx / d * r; c.z = p.z + dz / d * r; }
        else {
          /* em cima do risco: sai pela normal dele */
          const ex = seg[s * 4 + 2] - seg[s * 4], ez = seg[s * 4 + 3] - seg[s * 4 + 1], L = Math.hypot(ex, ez) || 1;
          c.x += -ez / L * r; c.z += ex / L * r;
        }
        aqui = mexeu = true;
      });
      if (!aqui) break;
    }
    return mexeu;
  }
  return { juntar, novaCoisa: () => { nUlt = 0; }, fechar, cabe, empurrar, perto, maisPerto, get n() { return n; }, get seg() { return seg; } };
}
