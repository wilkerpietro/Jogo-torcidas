/* =========================================================
   O SUBSOLO: onde o boneco pisa embaixo da rua (o metrô)
   ---------------------------------------------------------
   Na rua o chão é um plano só, e o corpo bate nos riscos da faixa
   (passo.js), riscados uma vez na montagem. Embaixo não: a escada fixa
   e a rolante descem da rua ao mezanino (5,2 m), a outra desce à
   plataforma (10 m), e a faixa do corpo tem de ir junto com o pé. Aqui
   ficam os TRIÂNGULOS das estações (os mesmos que o forno assa), num
   balde por metro, e a cada passo:

   - O CHÃO é o triângulo virado pra cima mais alto debaixo do meio do
     corpo que esteja a um DEGRAU (30 cm) do pé de agora, pra cima ou
     pra baixo: o degrau da escada (17 cm), a rampa da rolante, o piso.
     A rua (y = 0) conta fora do poço. Mais que um degrau não se pisa:
     nem o banco (47 cm), nem a catraca, nem o trilho (1,1 m abaixo da
     plataforma).
   - A PAREDE é o que os triângulos de perto têm na FAIXA DO CORPO
     contada do pé (de 35 cm a 1,80 m acima dele), riscado na hora pela
     mesma conta da rua; mais a BORDA da plataforma, que não tem parede
     (o chão acaba e o trilho está 1,1 m abaixo). Os braços das catracas
     ficam de fora: eles giram, o corpo passa.

   Quem usa: o cenário 3D (cenario.js, o boneco a pé) e o conferidor do
   metrô (conferir_metro.mjs), que prova com a mesma conta que da
   calçada se chega à plataforma. Em unidades de mundo da planta (x, y
   pra cima, z = o y da planta).
   ========================================================= */
import { FAIXA_M, riscosDaFaixa } from './passo.js';

/* o degrau: o mais que o pé sobe ou desce de um passo pro outro (m) */
export const DEGRAU_M = 0.3;

/* `estacoes`: o `andar` de cada estação (metro3d.js: o poço, a caixa, a
   borda, os braços das catracas e as alturas dos níveis). `op` troca o
   degrau e a faixa do corpo (em metros): o conferidor dos estádios anda
   na arquibancada, de degrau de 0,40 a 0,52 m */
export function Subsolo(M, estacoes, op = {}) {
  const faixa = op.faixa || FAIXA_M;
  const CEL = 1 * M, DEG = (op.degrau ?? DEGRAU_M) * M, Y0 = faixa[0] * M, Y1 = faixa[1] * M, FINO = 0.01 * M;
  const bracos = [], bordas = [];
  for (const e of estacoes) {
    for (const b of e.bracos || []) bracos.push(b);
    if (e.borda) bordas.push(e.borda);
  }
  const folga = 0.02 * M;
  const noRet = (r, x, z, f = 0) => x >= r.x0 - f && x <= r.x1 + f && z >= r.z0 - f && z <= r.z1 + f;

  /* OS TRIÂNGULOS: nove números cada, no mundo */
  let T = new Float32Array(9 * 4096), n = 0;
  function juntar(P, nv) {
    for (let o = 0; o + 8 < nv * 3; o += 9) {
      if (doBraco(P, o)) continue;
      if (n * 9 + 9 > T.length) { const t2 = new Float32Array(T.length * 2); t2.set(T); T = t2; }
      for (let k = 0; k < 9; k++) T[n * 9 + k] = P[o + k];
      n++;
    }
  }
  /* o triângulo inteiro dentro da caixa de um braço de catraca */
  function doBraco(P, o) {
    for (const b of bracos) {
      let dentro = true;
      for (let v = 0; v < 3 && dentro; v++) {
        const x = P[o + v * 3], y = P[o + v * 3 + 1], z = P[o + v * 3 + 2];
        dentro = noRet(b, x, z, folga) && y >= b.y0 - folga && y <= b.y1 + folga;
      }
      if (dentro) return true;
    }
    return false;
  }

  /* FECHAR: os baldes (cada triângulo em toda célula que a caixa dele
     toca) e, do que é chão, o plano e as três arestas */
  let x0 = 0, z0 = 0, nx = 1, nz = 1, ini = null, idx = null, plano = null, marca = null;
  function fechar() {
    T = T.slice(0, n * 9);
    x0 = Infinity; z0 = Infinity; let x1 = -Infinity, z1 = -Infinity;
    for (let k = 0; k < n; k++) for (let v = 0; v < 3; v++) {
      const x = T[k * 9 + v * 3], z = T[k * 9 + v * 3 + 2];
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z;
    }
    if (!n) { x0 = z0 = 0; x1 = z1 = 1; }
    nx = Math.max(1, Math.ceil((x1 - x0) / CEL)); nz = Math.max(1, Math.ceil((z1 - z0) / CEL));
    const faixa = k => {
      const o = k * 9;
      const a = Math.min(T[o], T[o + 3], T[o + 6]), b = Math.max(T[o], T[o + 3], T[o + 6]);
      const c = Math.min(T[o + 2], T[o + 5], T[o + 8]), d = Math.max(T[o + 2], T[o + 5], T[o + 8]);
      return [Math.max(0, Math.floor((a - x0) / CEL)), Math.min(nx - 1, Math.floor((b - x0) / CEL)),
              Math.max(0, Math.floor((c - z0) / CEL)), Math.min(nz - 1, Math.floor((d - z0) / CEL))];
    };
    const conta = new Uint32Array(nx * nz + 1);
    for (let k = 0; k < n; k++) { const [i0, i1, j0, j1] = faixa(k); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) conta[j * nx + i + 1]++; }
    for (let c = 0; c < nx * nz; c++) conta[c + 1] += conta[c];
    ini = conta; idx = new Uint32Array(conta[nx * nz]);
    const pos = conta.slice(0, nx * nz);
    for (let k = 0; k < n; k++) { const [i0, i1, j0, j1] = faixa(k); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) idx[pos[j * nx + i]++] = k; }
    /* o CHÃO: o triângulo virado pra cima (até 60° de inclinação) guarda
       o plano (y = a·x + b·z + c); o resto guarda NaN */
    plano = new Float32Array(n * 3).fill(NaN);
    for (let k = 0; k < n; k++) {
      const o = k * 9;
      const ux = T[o + 3] - T[o], uy = T[o + 4] - T[o + 1], uz = T[o + 5] - T[o + 2];
      const vx = T[o + 6] - T[o], vy = T[o + 7] - T[o + 1], vz = T[o + 8] - T[o + 2];
      const Nx = uy * vz - uz * vy, Ny = uz * vx - ux * vz, Nz = ux * vy - uy * vx, L = Math.hypot(Nx, Ny, Nz);
      if (!L || Ny / L < 0.5) continue;
      plano[k * 3] = -Nx / Ny; plano[k * 3 + 1] = -Nz / Ny;
      plano[k * 3 + 2] = T[o + 1] + (Nx * T[o] + Nz * T[o + 2]) / Ny;
    }
    marca = new Uint32Array(n);
  }

  /* o poço de alguma estação (a rua ali não tem chão) */
  const noPoco = (x, z) => estacoes.some(e => e.poco && noRet(e.poco, x, z));
  /* a estação cuja caixa tem (x, z) */
  const estacaoEm = (x, z, f = 0) => estacoes.find(e => e.caixa && noRet(e.caixa, x, z, f)) || null;

  /* O CHÃO debaixo de (x, z) a um degrau de `yPe` (NaN: não tem) */
  function chao(x, z, yPe) {
    let melhor = -Infinity;
    if (Math.abs(yPe) <= DEG && !noPoco(x, z)) melhor = 0;
    if (!ini) return melhor === -Infinity ? NaN : melhor;
    const i = Math.floor((x - x0) / CEL), j = Math.floor((z - z0) / CEL);
    if (i >= 0 && j >= 0 && i < nx && j < nz) {
      const c = j * nx + i;
      for (let q = ini[c]; q < ini[c + 1]; q++) {
        const k = idx[q];
        const a = plano[k * 3];
        if (a !== a) continue;
        const y = a * x + plano[k * 3 + 1] * z + plano[k * 3 + 2];
        if (y > yPe + DEG || y < yPe - DEG || y <= melhor) continue;
        /* (x, z) dentro do triângulo, visto de cima (com um fio de folga,
           pra não cair na costura entre dois) */
        const o = k * 9;
        const ax = T[o], az = T[o + 2], bx = T[o + 3], bz = T[o + 5], cx = T[o + 6], cz = T[o + 8];
        const d1 = (bx - ax) * (z - az) - (bz - az) * (x - ax);
        const d2 = (cx - bx) * (z - bz) - (cz - bz) * (x - bx);
        const d3 = (ax - cx) * (z - cz) - (az - cz) * (x - cx);
        const e = 1e-3 * M * M;
        if ((d1 >= -e && d2 >= -e && d3 >= -e) || (d1 <= e && d2 <= e && d3 <= e)) melhor = y;
      }
    }
    return melhor === -Infinity ? NaN : melhor;
  }

  /* OS RISCOS de perto: os triângulos das células em volta de (x, z) até
     `raio`, cortados na faixa do corpo contada de `yPe`, mais a borda
     da plataforma no nível dela. Ficam em R (nR riscos) até a próxima
     conta */
  let R = new Float32Array(4 * 512), nR = 0, vez = 0, perto = new Float32Array(9 * 256);
  const emitir = (ax, az, bx, bz) => {
    if (nR * 4 + 4 > R.length) { const r2 = new Float32Array(R.length * 2); r2.set(R); R = r2; }
    R[nR * 4] = ax; R[nR * 4 + 1] = az; R[nR * 4 + 2] = bx; R[nR * 4 + 3] = bz; nR++;
  };
  function riscar(x, z, yPe, raio) {
    nR = 0;
    if (ini) {
      if (++vez === 0xffffffff) { marca.fill(0); vez = 1; }
      const ya = yPe + Y0, yb = yPe + Y1;
      const i0 = Math.max(0, Math.floor((x - raio - x0) / CEL)), i1 = Math.min(nx - 1, Math.floor((x + raio - x0) / CEL));
      const j0 = Math.max(0, Math.floor((z - raio - z0) / CEL)), j1 = Math.min(nz - 1, Math.floor((z + raio - z0) / CEL));
      let m = 0;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const c = j * nx + i;
        for (let q = ini[c]; q < ini[c + 1]; q++) {
          const k = idx[q];
          if (marca[k] === vez) continue;
          marca[k] = vez;
          const o = k * 9;
          if (Math.max(T[o + 1], T[o + 4], T[o + 7]) < ya || Math.min(T[o + 1], T[o + 4], T[o + 7]) > yb) continue;
          if (m * 9 + 9 > perto.length) { const p2 = new Float32Array(perto.length * 2); p2.set(perto); perto = p2; }
          for (let t = 0; t < 9; t++) perto[m * 9 + t] = T[o + t];
          m++;
        }
      }
      if (m) riscosDaFaixa(perto, m * 3, ya, yb, FINO, emitir);
    }
    for (const b of bordas) if (Math.abs(b[4] - yPe) <= DEG) emitir(b[0], b[1], b[2], b[3]);
  }
  /* o ponto do risco s mais perto de (x, z) */
  const Q = { x: 0, z: 0 };
  function maisPerto(s, x, z) {
    const ax = R[s * 4], az = R[s * 4 + 1], dx = R[s * 4 + 2] - ax, dz = R[s * 4 + 3] - az;
    const L2 = dx * dx + dz * dz;
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)) : 0;
    Q.x = ax + dx * t; Q.z = az + dz * t;
    return Q;
  }
  /* tira o círculo (`c`, com x e z) de dentro dos riscos da faixa de
     `yPe`, deslizando (a conta da rua, passo.js) */
  function empurrar(c, yPe, r) {
    riscar(c.x, c.z, yPe, r + 0.2 * M);
    let mexeu = false;
    for (let volta = 0; volta < 3; volta++) {
      let aqui = false;
      for (let s = 0; s < nR; s++) {
        const p = maisPerto(s, c.x, c.z), dx = c.x - p.x, dz = c.z - p.z, d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        const d = Math.sqrt(d2);
        if (d > 1e-6) { c.x = p.x + dx / d * r; c.z = p.z + dz / d * r; }
        else {
          const ex = R[s * 4 + 2] - R[s * 4], ez = R[s * 4 + 3] - R[s * 4 + 1], L = Math.hypot(ex, ez) || 1;
          c.x += -ez / L * r; c.z += ex / L * r;
        }
        aqui = mexeu = true;
      }
      if (!aqui) break;
    }
    return mexeu;
  }
  /* cabe o corpo (raio r) com o meio em (x, z) e o pé em yPe */
  function cabe(x, z, yPe, r) {
    riscar(x, z, yPe, r + 0.05 * M);
    for (let s = 0; s < nR; s++) { const p = maisPerto(s, x, z); if ((p.x - x) ** 2 + (p.z - z) ** 2 < r * r) return false; }
    return true;
  }
  /* UM PASSO de (x, z, yPe) pra (x + dx, z + dz): o corpo desliza nos
     riscos, e o chão novo tem de estar a um degrau. Devolve o lugar
     (x, z, y) ou null. `c` é o objeto que recebe a conta */
  function passo(c, x, z, yPe, dx, dz, r) {
    c.x = x + dx; c.z = z + dz;
    let y = chao(c.x, c.z, yPe);
    if (y !== y) return null;
    empurrar(c, y, r);
    y = chao(c.x, c.z, yPe);
    if (y !== y || !cabe(c.x, c.z, y, r * 0.97)) return null;
    c.y = y;
    return c;
  }
  return { juntar, fechar, chao, empurrar, cabe, passo, noPoco, estacaoEm, riscar,
           get n() { return n; }, get riscos() { return { R, n: nR }; }, estacoes };
}
