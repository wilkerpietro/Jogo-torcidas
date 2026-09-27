/* =========================================================
   O DIA DE JOGO — o clássico da praça, no cenário 3D
   ---------------------------------------------------------
   O dono pediu (27/09/2026): "Comece a iniciar rotas de entrada no
   estádio das torcidas pra chegar ao seu local exato na arquibancada,
   através da sua respectiva entrada, partindo da sua sede. Crie um jogo
   fictício de dois times da mesma cidade pras respectivas torcidas se
   locomoverem até lá. A polícia vai fazer cordões de isolamento ao redor
   do estádio pra evitar que haja encontro entre elas, e as torcidas vão
   fazer rotas no intuito de não se chocarem."

   O JOGO (fictício): os dois clubes da praça (dados/cidades.js, na ordem
   de lá) que têm torcida com sede no mapa; o primeiro manda, no estádio
   dele (dados/estadios.js: `mandantes`), domingo às 16h. Cada torcida do
   clube vai pro setor do ESCALÃO dela (a de mais poder no 1º, a seguinte
   no 2º…): o mandante pelos portões 1 e 2, o visitante pelo 3 — o portão
   de cada setor é o de caminho mais curto até ele (rotas_estadios.js).

   O PLANO DA PM, nos ARREDORES (o que se anda até ARREDOR m dos portões):
   - o CORREDOR DO VISITANTE: a PM traça primeiro a rota da torcida
     visitante até o portão 3, pagando caro pra passar perto dos portões
     do mandante; a ZONA DO VISITANTE é o pedaço dos arredores que fica
     mais perto do portão 3 (andando) mais o corredor, o que se anda até
     CORREDOR m da rota (a rua inteira, de parede a parede, e a boca das
     transversais); o resto dos arredores é a ZONA DO MANDANTE. (Dividir só
     pelo portão mais perto não serve: no de 40 mil o portão 3 fica num
     bolsão que só se alcança passando pela zona do mandante);
   - o CORDÃO DIVISÓRIO onde uma zona encosta na outra: a grade de
     contenção e a fila de PMs de escudo, de um lado ao outro da rua;
   - as BOCAS, onde a rua sai dos arredores: a boca por onde entra a rota
     de uma torcida vira REVISTA (a grade em funil e 3 PMs; o bonde para
     ali); as outras bocas da zona do visitante ficam FECHADAS (a grade
     atravessada e 2 PMs); as do mandante, abertas;
   - a ESCOLTA: 4 PMs andam com o bonde do 1º escalão visitante, da sede
     até a revista.

   AS ROTAS da sede à boca do portão saem da GRADE DA ROTA, de 1 m, feita
   da grade do passo do cenário (o que o corpo alcança, fora do estádio),
   com a FOLGA de cada lugar (a distância até a parede, o carro, o poste):
   o meio da rua custa 1, a beira custa até 4. Nos arredores, só a zona
   do lado da torcida, e nunca o cordão. Fora deles, AS TORCIDAS SE
   EVITAM: primeiro saem as rotas do visitante (o corredor), depois as do
   mandante pagando caro perto delas, depois as do visitante de novo,
   pagando perto das do mandante; e todas pagam perto da sede rival. O
   custo de cada lado é uma tabela (uma conta por célula, antes da
   busca), e a busca é o A* na grade de 1 m. Depois, o
   HORÁRIO: cada bonde sai pra chegar na boca na hora dele (o visitante
   antes: a PM traz ele cedo); se ainda assim dois bondes rivais passam a
   menos de ENCONTRO m um do outro na cidade, a saída do visitante
   adianta de 3 em 3 minutos.

   DENTRO DO ESTÁDIO a rota é a de rotas_estadios.js (da boca do portão
   até o centro do setor, pela fila, a catraca, o corredor e o vomitório,
   e dali até a vaga de cada um), girada e posta no mapa.

   O BONDE é uma coluna de até LARG pessoas por fileira atrás da
   primeira, que estreita onde a rua estreita; na boca vira fila, e cada
   um passa a catraca CATRACA s depois do da frente.

   Unidades: as de mundo da planta (1 m = M), x pro leste, z (o y da
   planta) pro sul. O relógio do jogo em segundos do dia.
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { ROTAS_ESTADIOS } from './rotas_estadios.js';

const ARREDOR = 110;        // m de rua a partir dos portões: os arredores (encolhe se uma sede fica perto)
const CORREDOR = 8;         // m de rua (andando, sem atravessar parede) em volta da rota do visitante: o corredor dele nos arredores
const FOLGA_BOA = 2.5;      // m até a parede: daí pra mais, o passo custa 1
const FOLGA_MIN = 0.7;      // m: com menos, o bonde não passa
const MARCHA = 1.25;        // m/s, o bonde na rua
const DENTRO = 1.05;        // m/s, na fila, na escada, no corredor
const ESPACO = 0.9;         // m entre as fileiras do bonde
const LADO = 0.8;           // m entre um e outro na fileira
const LARG = 4;             // gente por fileira
const CATRACA = 1.2;        // s entre um e o próximo na catraca
const REVISTA = 1.5;        // s de revista por pessoa (o bonde inteiro espera)
const ENCONTRO = 60;        // m: rivais mais perto que isso na cidade é encontro
const TRAVESSIA = 15;       // m: as rotas de dois rivais mais perto que isso na cidade é um cruzamento (a PM fecha)
const MARGEM = 300;         // s: num cruzamento, o primeiro passa (o rabo) pelo menos isso antes de o segundo chegar
const LONGE_DO_PORTAO = 12; // m: a rota que traça o corredor do visitante não passa mais perto que isso da boca de um portão do mandante (quando o mapa deixa)
const PERTO_DO_VISITANTE = 15; // m: quando o corredor abre pro mandante, ele ainda não chega mais perto que isso do portão do visitante
const LONGE_DO_LADO = 6;    // o quanto custa a mais, por fora dos arredores, andar rente ao pedaço do lado rival (cai pela metade a cada 17 m)
const BOLA = 16 * 3600;     // a bola rola às 16h
const FATOR_GENTE = 0.3;    // um boneco por 3,3 membros
const MAX_BONDE = 40;       // bonecos por torcida, no máximo
const VEZES = [1, 10, 30, 60];

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const hora = s => { const m = Math.floor(s / 60 + 1e-6); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const luz = hex => { const n = parseInt(String(hex).slice(1), 16); return 0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255); };
/* a cor que se vê em cima do chão: a primeira da torcida, ou a segunda se a primeira é branca, preta ou cinza */
const corDaFita = t => { const cs = [t.cor, t.cor2, t.cor3].filter(Boolean); const viva = cs.find(c => { const l = luz(c), n = parseInt(c.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255; return l > 40 && l < 225 && Math.max(r, g, b) - Math.min(r, g, b) > 40; }); return viva || (luz(cs[0] || '#888') > 128 ? '#f2f2f2' : '#1c1c1c'); };

/* ======================================================
   O MONTE (fila de prioridade) de números: a chave em Float64, o valor em Int32
   ====================================================== */
class Monte {
  constructor(cap = 1 << 16) { this.k = new Float64Array(cap); this.v = new Int32Array(cap); this.n = 0; }
  push(v, k) {
    if (this.n === this.k.length) { const k2 = new Float64Array(this.n * 2), v2 = new Int32Array(this.n * 2); k2.set(this.k); v2.set(this.v); this.k = k2; this.v = v2; }
    let i = this.n++;
    while (i > 0) { const p = (i - 1) >> 1; if (this.k[p] <= k) break; this.k[i] = this.k[p]; this.v[i] = this.v[p]; i = p; }
    this.k[i] = k; this.v[i] = v;
  }
  pop() {
    const topo = this.v[0], ultK = this.k[--this.n], ultV = this.v[this.n];
    let i = 0;
    for (;;) {
      let f = 2 * i + 1;
      if (f >= this.n) break;
      if (f + 1 < this.n && this.k[f + 1] < this.k[f]) f++;
      if (this.k[f] >= ultK) break;
      this.k[i] = this.k[f]; this.v[i] = this.v[f]; i = f;
    }
    this.k[i] = ultK; this.v[i] = ultV;
    return topo;
  }
  get chave() { return this.k[0]; }
}

/* ======================================================
   A GRADE DA ROTA: 1 m por célula, da grade do passo (0,5 m)
   ====================================================== */
function GradeDaRota(crua, M, foraDoEstadio) {
  const { g, nx, nz, ox, oz, c, ALCANCE } = crua;
  /* a FOLGA na grade fina: a distância até o que não se anda (chanfro 3-4) */
  const d = new Uint16Array(nx * nz);
  for (let k = 0; k < d.length; k++) d[k] = g[k] & ALCANCE ? 65000 : 0;
  /* o estádio (da fachada pra dentro) não é rua: dentro dele a rota é a de rotas_estadios.js */
  foraDoEstadio((i0, i1, j0, j1, dentro) => {
    for (let j = Math.max(0, j0); j <= Math.min(nz - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(nx - 1, i1); i++)
      if (d[j * nx + i] && dentro(ox + (i + 0.5) * c, oz + (j + 0.5) * c)) d[j * nx + i] = 0;
  }, { nx, nz, ox, oz, c });
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i; let v = d[k]; if (!v) continue;
    if (i > 0) v = Math.min(v, d[k - 1] + 3);
    if (j > 0) { v = Math.min(v, d[k - nx] + 3); if (i > 0) v = Math.min(v, d[k - nx - 1] + 4); if (i < nx - 1) v = Math.min(v, d[k - nx + 1] + 4); }
    d[k] = v;
  }
  for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) {
    const k = j * nx + i; let v = d[k]; if (!v) continue;
    if (i < nx - 1) v = Math.min(v, d[k + 1] + 3);
    if (j < nz - 1) { v = Math.min(v, d[k + nx] + 3); if (i < nx - 1) v = Math.min(v, d[k + nx + 1] + 4); if (i > 0) v = Math.min(v, d[k + nx - 1] + 4); }
    d[k] = v;
  }
  /* a grade grossa: 2 × 2 células finas, com a maior folga delas (em metros) */
  const CX = Math.ceil(nx / 2), CZ = Math.ceil(nz / 2), N = CX * CZ;
  const folga = new Float32Array(N), anda = new Uint8Array(N), mult = new Float32Array(N);
  for (let J = 0; J < CZ; J++) for (let I = 0; I < CX; I++) {
    let m = 0;
    for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) { const i = 2 * I + a, j = 2 * J + b; if (i < nx && j < nz) m = Math.max(m, d[j * nx + i]); }
    const f = m / 3 * 0.5, K = J * CX + I;
    folga[K] = f;
    anda[K] = f >= FOLGA_MIN ? 1 : 0;
    mult[K] = 1 + 3 * Math.max(0, (FOLGA_BOA - f) / FOLGA_BOA);
  }
  const L = 2 * c;                               // o lado da célula grossa, em unidades de mundo
  const centro = K => [ox + ((K % CX) + 0.5) * L, oz + (Math.floor(K / CX) + 0.5) * L];
  const celula = (x, z) => { const I = Math.floor((x - ox) / L), J = Math.floor((z - oz) / L); return I < 0 || J < 0 || I >= CX || J >= CZ ? -1 : J * CX + I; };
  /* a célula andável mais perto de (x, z), até `raio` m */
  function perto(x, z, raio = 25, ok = K => anda[K]) {
    const I0 = Math.floor((x - ox) / L), J0 = Math.floor((z - oz) / L);
    for (let r = 0; r <= raio; r++) {
      let melhor = -1, md = Infinity;
      for (let J = J0 - r; J <= J0 + r; J++) for (let I = I0 - r; I <= I0 + r; I++) {
        if (Math.max(Math.abs(I - I0), Math.abs(J - J0)) !== r || I < 0 || J < 0 || I >= CX || J >= CZ) continue;
        const K = J * CX + I;
        if (!ok(K)) continue;
        const [cx, cz] = centro(K), dd = (cx - x) ** 2 + (cz - z) ** 2;
        if (dd < md) { md = dd; melhor = K; }
      }
      if (melhor >= 0) return melhor;
    }
    return -1;
  }
  /* a folga (m) em (x, z) */
  const folgaEm = (x, z) => { const K = celula(x, z); return K < 0 ? 0 : folga[K]; };
  return { CX, CZ, N, folga, anda, mult, L, M, centro, celula, perto, folgaEm };
}

/* O CAMINHO de menor custo (A*): `custo[K]` é o multiplicador da célula
   (Infinity: não passa); o passo de a pra b custa o comprimento × a média
   dos dois. Sem `fim`, é o Dijkstra de todas as `fontes` até `limite` (m) */
function Buscador(R) {
  /* a distância em 64 bits: em 32, o número guardado arredonda pra cima e
     o mesmo caminho parece "melhor" de novo toda vez — cada vizinho volta
     pro monte, sem fim (na Bahia invertida, a memória acabava) */
  const dist = new Float64Array(R.N).fill(Infinity), pai = new Int32Array(R.N).fill(-1);
  let tocados = new Int32Array(1 << 16), nToc = 0;
  const toca = K => { if (nToc === tocados.length) { const t2 = new Int32Array(nToc * 2); t2.set(tocados); tocados = t2; } tocados[nToc++] = K; };
  function limpar() { for (let i = 0; i < nToc; i++) { const K = tocados[i]; dist[K] = Infinity; pai[K] = -1; } nToc = 0; }
  const DI = [1, -1, 0, 0, 1, 1, -1, -1], DJ = [0, 0, 1, -1, 1, -1, 1, -1], DL = [1, 1, 1, 1, Math.SQRT2, Math.SQRT2, Math.SQRT2, Math.SQRT2];
  function buscar(fontes, custo, fim = -1, limite = Infinity) {
    limpar();
    const monte = new Monte(1 << 14), CX = R.CX, CZ = R.CZ;
    const fx = fim >= 0 ? fim % CX : 0, fz = fim >= 0 ? (fim - fim % CX) / CX : 0, R2 = Math.SQRT2 - 1;
    const h = fim < 0 ? () => 0 : K => { const I = K % CX, dx = Math.abs(I - fx), dz = Math.abs((K - I) / CX - fz); return dx > dz ? dx + R2 * dz : dz + R2 * dx; };
    for (const K of fontes) { if (K < 0 || custo[K] === Infinity) continue; dist[K] = 0; toca(K); monte.push(K, h(K)); }
    while (monte.n) {
      const chave = monte.chave, K = monte.pop();
      if (chave - h(K) > dist[K] + 1e-3) continue;
      if (K === fim) break;
      const I = K % CX, J = (K - I) / CX, cK = custo[K], dK = dist[K];
      for (let v = 0; v < 8; v++) {
        const a = I + DI[v], b = J + DJ[v];
        if (a < 0 || b < 0 || a >= CX || b >= CZ) continue;
        const K2 = b * CX + a, c2 = custo[K2];
        if (c2 === Infinity) continue;
        /* na diagonal, as duas do lado têm de passar (não corta a quina) */
        if (v >= 4 && (custo[J * CX + a] === Infinity || custo[b * CX + I] === Infinity)) continue;
        const nd = dK + DL[v] * (cK + c2) * 0.5;
        /* (escrito assim, um custo que não é número não entra: senão a busca não acaba) */
        if (!(nd < dist[K2]) || nd > limite) continue;
        if (dist[K2] === Infinity) toca(K2);
        dist[K2] = nd; pai[K2] = K;
        monte.push(K2, nd + h(K2));
      }
    }
    if (fim < 0 || dist[fim] === Infinity) return null;
    const cam = [];
    for (let K = fim; K >= 0; K = pai[K]) cam.push(K);
    return cam.reverse();
  }
  return { buscar, dist, pai };
}

/* distância (m, chanfro) na grade grossa até as células marcadas em `fonte` */
function distanciaAte(R, fonte) {
  const { CX, CZ, N } = R, d = new Float32Array(N);
  for (let K = 0; K < N; K++) d[K] = fonte[K] ? 0 : 1e9;
  const a = 1, b = Math.SQRT2;
  for (let J = 0; J < CZ; J++) for (let I = 0; I < CX; I++) {
    const K = J * CX + I; let v = d[K];
    if (I > 0) v = Math.min(v, d[K - 1] + a);
    if (J > 0) { v = Math.min(v, d[K - CX] + a); if (I > 0) v = Math.min(v, d[K - CX - 1] + b); if (I < CX - 1) v = Math.min(v, d[K - CX + 1] + b); }
    d[K] = v;
  }
  for (let J = CZ - 1; J >= 0; J--) for (let I = CX - 1; I >= 0; I--) {
    const K = J * CX + I; let v = d[K];
    if (I < CX - 1) v = Math.min(v, d[K + 1] + a);
    if (J < CZ - 1) { v = Math.min(v, d[K + CX] + a); if (I < CX - 1) v = Math.min(v, d[K + CX + 1] + b); if (I > 0) v = Math.min(v, d[K + CX - 1] + b); }
    d[K] = v;
  }
  return d;
}

/* os grupos de células marcadas (vizinhas de 8 lados) */
function grupos(R, marca) {
  const { CX, CZ, N } = R, visto = new Uint8Array(N), out = [];
  for (let K0 = 0; K0 < N; K0++) {
    if (!marca[K0] || visto[K0]) continue;
    const g = [K0]; visto[K0] = 1;
    for (let q = 0; q < g.length; q++) {
      const K = g[q], I = K % CX, J = (K - I) / CX;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const a = I + di, b = J + dj;
        if (a < 0 || b < 0 || a >= CX || b >= CZ) continue;
        const K2 = b * CX + a;
        if (marca[K2] && !visto[K2]) { visto[K2] = 1; g.push(K2); }
      }
    }
    out.push(g);
  }
  return out;
}
/* a reta que atravessa um grupo de células (o eixo maior dele): {a, b, meio, dir} em mundo */
function retaDoGrupo(R, g) {
  let sx = 0, sz = 0;
  const pts = g.map(K => R.centro(K));
  for (const [x, z] of pts) { sx += x; sz += z; }
  const mx = sx / pts.length, mz = sz / pts.length;
  let xx = 0, zz = 0, xz = 0;
  for (const [x, z] of pts) { xx += (x - mx) ** 2; zz += (z - mz) ** 2; xz += (x - mx) * (z - mz); }
  const ang = 0.5 * Math.atan2(2 * xz, xx - zz), ux = Math.cos(ang), uz = Math.sin(ang);
  let t0 = Infinity, t1 = -Infinity;
  for (const [x, z] of pts) { const t = (x - mx) * ux + (z - mz) * uz; t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
  const meiaCel = R.L / 2;
  return { a: [mx + ux * (t0 - meiaCel), mz + uz * (t0 - meiaCel)], b: [mx + ux * (t1 + meiaCel), mz + uz * (t1 + meiaCel)], meio: [mx, mz], dir: [ux, uz], n: g.length };
}

/* ======================================================
   A TRILHA: uma linha de pontos [x, y?, z] com o comprimento acumulado
   ====================================================== */
function Trilha(pts) {
  const n = pts.length, acc = new Float64Array(n);
  for (let i = 1; i < n; i++) acc[i] = acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]);
  const L = n ? acc[n - 1] : 0;
  let ult = 0;
  /* o ponto na distância s: x, y, z e a direção (tx, tz) */
  function ponto(s, o = {}) {
    s = clamp(s, 0, L);
    if (n < 2) { o.x = pts[0][0]; o.y = pts[0][1]; o.z = pts[0][2]; o.tx = 0; o.tz = 1; return o; }
    let i = ult;
    if (i >= n - 1 || acc[i] > s) i = 0;
    while (i < n - 2 && acc[i + 1] < s) i++;
    ult = i;
    const a = pts[i], b = pts[i + 1], l = acc[i + 1] - acc[i] || 1, t = (s - acc[i]) / l;
    o.x = a[0] + (b[0] - a[0]) * t; o.y = a[1] + (b[1] - a[1]) * t; o.z = a[2] + (b[2] - a[2]) * t;
    o.tx = (b[0] - a[0]) / l; o.tz = (b[2] - a[2]) / l;
    return o;
  }
  return { pts, acc, L, ponto };
}

/* ======================================================
   O PLANO: o jogo, as zonas, a PM, as rotas e o horário
   ====================================================== */
export function planejar(ctx, escolha = {}) {
  const { M, P } = ctx;
  const t0 = performance.now(), tempos = {};
  const marca = k => { tempos[k] = Math.round(performance.now() - t0); };
  const torcidas = P.torcidas().filter(t => t.clubeId);
  const clubes = P.clubes(), estadios = P.estadios();
  /* OS JOGOS POSSÍVEIS: dois clubes da praça com torcida com sede; os
     daqui primeiro (a ordem de dados/cidades.js) */
  const comSede = id => torcidas.filter(t => t.clubeId === id && t.porta);
  const lista = clubes.filter(c => comSede(c.id).length);
  const pares = [];
  for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
    const a = lista[i], b = lista[j];
    if (a.local && b.local) pares.push([a, b]);
  }
  if (!pares.length) for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) pares.push([lista[i], lista[j]]);
  if (!pares.length) return { erro: 'Nesta praça não tem dois clubes com torcida com sede no mapa: não dá pra montar o clássico.' };
  const par = pares[clamp(escolha.par || 0, 0, pares.length - 1)];
  const [casa, fora] = escolha.inverter ? [par[1], par[0]] : par;
  /* O ESTÁDIO: o do mandante no mapa; sem ele, o principal */
  const est = estadios.find(e => e.modelo && e.mandantes.includes(casa.id)) || estadios.find(e => e.modelo && e.principal) || estadios.find(e => e.modelo);
  if (!est) return { erro: 'O mapa desta praça não tem estádio do jogo.' };
  const rotas = ROTAS_ESTADIOS[est.modelo];
  if (!rotas) return { erro: 'Não tem rota de dentro do ' + est.modelo + ' (rode ferramentas/planta_html/rotas_estadios.mjs).' };
  /* o estádio mudou depois das rotas de dentro? (a marca do modelo, estadios3d.js) */
  const rotaVelha = !!(est.marca && rotas.marca && est.marca !== rotas.marca);
  /* o modelo no mundo: girado (o giro em graus) e na escala do mapa, 2 cm acima do chão */
  const th = -est.giro * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const mundo = (x, y, z) => [est.centro[0] + M * (x * cs + z * sn), 0.02 * M + M * y, est.centro[1] + M * (-x * sn + z * cs)];
  const centroEst = mundo(0, 0, 0);

  /* AS TORCIDAS DO JOGO: as dos dois clubes com sede, cada uma no setor
     do escalão dela (o que o modelo tem: o 3º visitante do de 10 divide o 2º) */
  const setoresDoLado = l => Object.keys(rotas.setores).filter(s => s[0] === l).sort();
  const lados = [{ lado: 'mandante', clube: casa, l: 'm' }, { lado: 'visitante', clube: fora, l: 'v' }];
  const vagasUsadas = {};
  const bondes = [];
  for (const L of lados) {
    const ts = comSede(L.clube.id).sort((a, b) => (b.poder || 0) - (a.poder || 0) || (b.membros || 0) - (a.membros || 0));
    const disponiveis = setoresDoLado(L.l);
    ts.forEach((t, r) => {
      const setor = disponiveis[Math.min(r, disponiveis.length - 1)], S = rotas.setores[setor];
      const jaUsadas = vagasUsadas[setor] || 0;
      const n = Math.min(MAX_BONDE, Math.max(5, Math.round((t.membros || 20) * FATOR_GENTE * (escolha.gente || 1))), S.vagas.length - jaUsadas);
      if (n <= 0) return;
      vagasUsadas[setor] = jaUsadas + n;
      bondes.push({ t, lado: L.lado, clube: L.clube, escalao: r + 1, setor, S, portao: rotas.portoes[S.portao], nPortao: S.portao, vaga0: jaUsadas, n, cor: corDaFita(t) });
    });
  }
  if (!bondes.some(b => b.lado === 'mandante') || !bondes.some(b => b.lado === 'visitante')) return { erro: 'Falta torcida com sede de um dos dois clubes.' };
  marca('jogo');

  /* A GRADE DA ROTA (o alcance da grade do passo só é feito na primeira vez que alguém precisa) */
  ctx.grade.alcancar();
  const crua = ctx.grade.crua();
  const R = GradeDaRota(crua, M, (marcar, G) => {
    for (const e of estadios) {
      if (!e.terreno || !ctx.noEstadio) continue;
      const t = e.terreno;
      marcar(Math.floor((t.x0 - G.ox) / G.c), Math.ceil((t.x1 - G.ox) / G.c), Math.floor((t.y0 - G.oz) / G.c), Math.ceil((t.y1 - G.oz) / G.c), ctx.noEstadio);
    }
  });
  const B = Buscador(R);
  marca('grade');

  /* OS PORTÕES no mundo: a boca (onde a rua encosta) de cada um, na grade */
  const portoes = rotas.portoes.map((p, i) => {
    const w = mundo(p.boca[0], 0, p.boca[2]), K = R.perto(w[0], w[2], 20);
    return { ...p, i, mundo: w, K, lado: p.lado };
  });
  if (portoes.some(p => p.K < 0)) return { erro: 'A boca de um portão do ' + est.nome + ' não dá na rua.' };
  const N = R.N, CX = R.CX, CZ = R.CZ, dm = R.L / M, iV = portoes.findIndex(p => p.lado === 'visitante');

  /* OS ARREDORES: o que se anda até `raio` m de algum portão; o PORTÃO
     MAIS PERTO de cada pedaço (`dono`) e o lado dele (`perto`: 0, um do
     mandante; 1, o do visitante) */
  const livre = new Float32Array(N);
  for (let K = 0; K < N; K++) livre[K] = R.anda[K] ? 1 : Infinity;
  const perto = new Int8Array(N).fill(-1), dono = new Int8Array(N).fill(-1), dPortao = new Float32Array(N).fill(Infinity);
  /* a distância andando até cada portão (em células) */
  const dG = portoes.map((p, i) => {
    B.buscar([p.K], livre, -1, 900);
    const dd = new Float32Array(N);
    for (let K = 0; K < N; K++) { const d = dd[K] = B.dist[K]; if (d < dPortao[K]) { dPortao[K] = d; dono[K] = i; perto[K] = p.lado === 'mandante' ? 0 : 1; } }
    return dd;
  });
  /* o raio: ARREDOR, ou menos se uma sede do jogo fica perto (ela tem de sair de fora deles) */
  let raio = ARREDOR;
  for (const b of bondes) {
    const K = R.perto(b.t.porta.x, b.t.porta.y, 25);
    b.K0 = K;
    if (K >= 0 && dPortao[K] < Infinity) raio = Math.min(raio, 0.7 * dPortao[K] * dm);
  }
  raio = Math.max(45, raio);
  const noArredor = new Uint8Array(N);
  for (let K = 0; K < N; K++) if (R.anda[K] && dPortao[K] * dm <= raio) noArredor[K] = 1;
  marca('arredores');

  /* O CUSTO DE ANDAR de cada lado, numa tabela: o meio da rua mais barato
     que a beira; fora dos arredores, caro perto da sede rival e da rota
     rival (quando já tem); dentro, só a zona do lado (quando já tem) — e,
     antes das zonas, o visitante paga pra passar perto dos portões do
     mandante */
  const campo = Ks => { const f = new Uint8Array(N); for (const K of Ks) if (K >= 0) f[K] = 1; return distanciaAte(R, f); };
  const dSedes = { mandante: campo(bondes.filter(b => b.lado === 'mandante').map(b => b.K0)), visitante: campo(bondes.filter(b => b.lado === 'visitante').map(b => b.K0)) };
  const dRotas = { mandante: null, visitante: null };
  let zonaV = null, divisa = null, dCorredor = null;
  const outro = l => l === 'mandante' ? 'visitante' : 'mandante';
  /* a distância (reta) até o pedaço dos arredores de cada lado: por fora
     deles, a rota de um passa longe do pedaço do outro (senão o visitante
     contorna a zona do mandante rente à borda, e passa na boca por onde o
     mandante entra). Antes das zonas, o lado do portão mais perto */
  let dLado = null, proibidoV = null;
  function medirLados(doVisitante) {
    const fm = new Uint8Array(N), fv = new Uint8Array(N);
    for (let K = 0; K < N; K++) if (noArredor[K]) (doVisitante(K) ? fv : fm)[K] = 1;
    dLado = { mandante: distanciaAte(R, fm), visitante: distanciaAte(R, fv) };
  }
  medirLados(K => perto[K] === 1);
  function custoDo(lado, peloCorredor = false) {
    const c = new Float32Array(N), dS = dSedes[outro(lado)], dR = dRotas[outro(lado)], dL = dLado[outro(lado)];
    for (let K = 0; K < N; K++) {
      if (!R.anda[K]) { c[K] = Infinity; continue; }
      let v = R.mult[K];
      if (noArredor[K]) {
        /* o proibido só vale pra traçar o corredor; depois, o visitante anda na zona dele inteira */
        if (lado === 'visitante' && proibidoV && proibidoV[K] && !zonaV) { c[K] = Infinity; continue; }
        if (zonaV && peloCorredor) {
          /* o mandante do portão ilhado: anda no corredor do visitante depois
             que ele abre (o cordão sai), mas nunca perto do portão do visitante */
          if (dG[iV][K] * dm <= PERTO_DO_VISITANTE) { c[K] = Infinity; continue; }
          if (divisa[K] || zonaV[K] === 1) v += 3;
        } else if (zonaV) {
          if (divisa[K] || (zonaV[K] === 1) !== (lado === 'visitante')) { c[K] = Infinity; continue; }
          /* o mandante evita a rua do corredor do visitante (do outro lado do cordão) */
          if (lado === 'mandante') v += 8 * Math.exp(-dCorredor[K] * dm / 12);
        }
        else if (lado === 'visitante' && perto[K] === 0) v += 8;
      } else {
        v += 6 * Math.exp(-dS[K] * dm / 45);
        v += LONGE_DO_LADO * Math.exp(-dL[K] * dm / 25);
        if (dR) v += 10 * Math.exp(-dR[K] * dm / 30);
      }
      c[K] = v;
    }
    return c;
  }
  function rotasDo(lado, peloCorredor = false, so = null) {
    const c = custoDo(lado, peloCorredor);
    for (const b of bondes) if (b.lado === lado && (!so || so(b))) {
      if (b.K0 < 0) { b.erro = 'a sede não dá na rua'; b.cels = null; continue; }
      b.cels = B.buscar([b.K0], c, portoes[b.nPortao].K);
      b.erro = b.cels ? null : 'não achei caminho da sede ao ' + b.portao.nome.toLowerCase();
    }
    const f = new Uint8Array(N);
    for (const b of bondes) if (b.lado === lado && b.cels) for (const K of b.cels) if (!noArredor[K]) f[K] = 1;
    dRotas[lado] = distanciaAte(R, f);
  }
  /* a BOCA dos arredores: onde a rua sai deles */
  const boca = new Uint8Array(N);
  for (let K = 0; K < N; K++) {
    if (!noArredor[K]) continue;
    const I = K % CX, J = (K - I) / CX;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = I + di, b2 = J + dj;
      if (a < 0 || b2 < 0 || a >= CX || b2 >= CZ) continue;
      const K2 = b2 * CX + a;
      if (!noArredor[K2] && R.anda[K2]) boca[K] = 1;
    }
  }
  /* 1. O CORREDOR DO VISITANTE: a PM traça primeiro a rota dele, da sede
     ao portão 3, longe dos portões do mandante (e fora do `proibidoV`);
     2. AS ZONAS: a do visitante é o pedaço dos arredores do lado do portão
     dele mais o corredor (CORREDOR m pra cada lado da rota); o resto é do
     mandante. A boca dos portões do mandante é sempre do mandante. E a
     DIVISA, onde a zona de um lado encosta na do outro: o cordão.
     Devolve quantos visitantes têm rota */
  function zonear() {
    zonaV = null; divisa = null;
    rotasDo('visitante');
    zonaV = new Uint8Array(N);
    /* o corredor: o que se anda até CORREDOR m da rota (a rua inteira, de
       parede a parede, e a boca das transversais); e a distância reta até
       a rota, pro mandante evitar a rua dela */
    const f = new Uint8Array(N), fontes = [];
    for (const b of bondes) if (b.lado === 'visitante' && b.cels) for (const K of b.cels) if (noArredor[K]) { f[K] = 1; fontes.push(K); }
    dCorredor = distanciaAte(R, f);
    B.buscar(fontes, livre, -1, CORREDOR / dm);
    for (let K = 0; K < N; K++) if (noArredor[K] && (perto[K] === 1 || B.dist[K] * dm <= CORREDOR)) zonaV[K] = 1;
    const r = Math.ceil(6 / dm);
    for (const p of portoes) if (p.lado === 'mandante') {
      const I0 = p.K % CX, J0 = (p.K - I0) / CX;
      for (let J = J0 - r; J <= J0 + r; J++) for (let I = I0 - r; I <= I0 + r; I++) if (I >= 0 && J >= 0 && I < CX && J < CZ) zonaV[J * CX + I] = 0;
    }
    /* mas o caminho do corredor (e a célula de cada lado) é sempre do
       visitante, mesmo na frente de um portão do mandante: ele passa antes,
       e a torcida daquele portão espera na sede a PM abrir o corredor */
    for (const K of fontes) {
      const I = K % CX, J = (K - I) / CX;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = I + di, b2 = J + dj; if (a >= 0 && b2 >= 0 && a < CX && b2 < CZ && noArredor[b2 * CX + a]) zonaV[b2 * CX + a] = 1; }
    }
    divisa = new Uint8Array(N);
    for (let K = 0; K < N; K++) {
      if (!noArredor[K]) continue;
      const I = K % CX, J = (K - I) / CX;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = I + di, b2 = J + dj;
        if (a < 0 || b2 < 0 || a >= CX || b2 >= CZ) continue;
        const K2 = b2 * CX + a;
        if (noArredor[K2] && zonaV[K2] !== zonaV[K]) divisa[K] = 1;
      }
    }
    /* quantos visitantes têm rota (nenhum, se o portão deles não dá na rua pela zona deles) */
    return daNaRua(portoes[iV].K, K => !divisa[K] && zonaV[K] === 1) ? bondes.filter(b => b.lado === 'visitante' && b.cels).length : 0;
  }
  /* o portão dá na rua (fora dos arredores) andando só por onde `ok` deixa? */
  function daNaRua(K0, ok) {
    const visto = new Uint8Array(N), fila = [K0];
    visto[K0] = 1;
    for (let q = 0; q < fila.length; q++) {
      const K = fila[q];
      if (!noArredor[K]) return true;
      const I = K % CX, J = (K - I) / CX;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = I + di, b2 = J + dj;
        if (a < 0 || b2 < 0 || a >= CX || b2 >= CZ) continue;
        const K2 = b2 * CX + a;
        if (!visto[K2] && R.anda[K2] && (!noArredor[K2] || ok(K2))) { visto[K2] = 1; fila.push(K2); }
      }
    }
    return false;
  }
  /* A CONFERÊNCIA: todo portão do mandante que uma torcida dele usa tem de
     dar na rua pela zona do mandante. Se o corredor cortou um (passou na
     rua dele e o deixou ilhado), a PM traça o corredor de novo mais longe
     daquele portão (16, 24, 36, 54 m andando) — enquanto o visitante ainda
     chegar no portão dele */
  const usados = [...new Set(bondes.filter(b => b.lado === 'mandante' && b.K0 >= 0).map(b => b.nPortao))];
  /* o corredor não passa na frente de um portão do mandante (a boca dele
     é sempre do mandante, e cortaria o corredor), quando o mapa deixa */
  const naFrente = new Uint8Array(N);
  const doMandante = portoes.map((p, i) => i).filter(i => portoes[i].lado === 'mandante');
  for (let K = 0; K < N; K++) if (noArredor[K] && doMandante.some(i => dG[i][K] * dm <= LONGE_DO_PORTAO)) naFrente[K] = 1;
  const nVisSede = bondes.filter(b => b.lado === 'visitante' && b.K0 >= 0).length;
  proibidoV = naFrente;
  let nVis = zonear();
  if (nVis < nVisSede) {
    const com = nVis;
    proibidoV = null; nVis = zonear();
    if (nVis <= com) { proibidoV = naFrente; nVis = zonear(); }
  }
  const longeDe = [], ilhadosAgora = () => usados.filter(i => !daNaRua(portoes[i].K, K => !divisa[K] && !zonaV[K]));
  let ilhados = ilhadosAgora();
  const tentativas = [{ D: 0, nVis, ilhados: ilhados.map(i => portoes[i].nome) }];
  for (const D of [16, 24, 36, 54]) {
    if (!ilhados.length) break;
    const antes = proibidoV;
    proibidoV = antes ? antes.slice() : new Uint8Array(N);
    for (let K = 0; K < N; K++) if (noArredor[K] && ilhados.some(i => dG[i][K] * dm <= D)) proibidoV[K] = 1;
    const n = zonear();
    tentativas.push({ D, nVis: n, ilhados: ilhadosAgora().map(i => portoes[i].nome) });
    if (n < nVis) { proibidoV = antes; zonear(); break; }
    for (const i of ilhados) if (!longeDe.includes(portoes[i].nome)) longeDe.push(portoes[i].nome);
    ilhados = ilhadosAgora();
  }
  /* 3. O MANDANTE, pela zona dele, longe das rotas do visitante; 4. O
     VISITANTE DE NOVO, no corredor, longe das do mandante */
  medirLados(K => zonaV[K] === 1);
  rotasDo('mandante');
  /* O CORREDOR QUE ABRE: se ainda sobrou portão do mandante ilhado (o mapa
     obriga o corredor a passar na frente dele), a torcida desse portão
     espera: a PM segura o corredor até o último visitante passar a catraca
     e só então abre (o cordão sai) pro mandante andar nele */
  const peloCorredor = b => b.lado === 'mandante' && !b.cels && ilhados.includes(b.nPortao);
  if (bondes.some(peloCorredor)) {
    const quem = bondes.filter(peloCorredor);
    rotasDo('mandante', true, peloCorredor);
    for (const b of quem) if (b.cels) b.peloCorredor = true;
  }
  for (const b of bondes) if (b.lado === 'mandante' && !b.cels && ilhados.includes(b.nPortao)) b.erro = 'o ' + b.portao.nome.toLowerCase() + ' ficou ilhado na zona do visitante (o corredor dele passa na rua do portão, e o mapa não deixa outro)';
  rotasDo('visitante');
  /* quem ficou sem rota: é o mapa (a sede não chega no portão nem sem PM
     nenhuma) ou é a zona? */
  for (const b of bondes) if (!b.cels && b.K0 >= 0) {
    b.semMapa = !B.buscar([b.K0], livre, portoes[b.nPortao].K);
    if (b.semMapa) b.erro = 'a sede não chega no ' + b.portao.nome.toLowerCase() + ' nem sem a PM: o mapa não liga as duas';
  }
  marca('rotas');
  const naRotaQueAbre = new Uint8Array(N);
  for (const b of bondes) if (b.peloCorredor) for (const K of b.cels) {
    const I = K % CX, J = (K - I) / CX;
    for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const a = I + di, b2 = J + dj; if (a >= 0 && b2 >= 0 && a < CX && b2 < CZ) naRotaQueAbre[b2 * CX + a] = 1; }
  }
  const cordoes = grupos(R, divisa).filter(g => g.length >= 2).map(g => ({ ...retaDoGrupo(R, g), cels: g, abre: g.some(K => naRotaQueAbre[K]) }));
  const bocas = grupos(R, boca).map(g => {
    let m = 0; for (const K of g) m += zonaV[K] ? -1 : 1;
    return { ...retaDoGrupo(R, g), cels: g, lado: m >= 0 ? 'mandante' : 'visitante', usada: [], abre: g.some(K => naRotaQueAbre[K]) };
  });
  const bocaDe = new Int32Array(N).fill(-1);
  bocas.forEach((q, i) => { for (const K of q.cels) bocaDe[K] = i; });
  /* a zona de cada pedaço dos arredores (0: mandante, 1: visitante; -1: fora deles) */
  const zona = new Int8Array(N).fill(-1);
  for (let K = 0; K < N; K++) if (noArredor[K]) zona[K] = zonaV[K];
  marca('zonas');

  /* a rota em pontos de mundo, enxuta (reta onde a folga deixa), com a
     boca dos arredores por onde ela entra (a revista) */
  const pode = { mandante: new Uint8Array(N), visitante: new Uint8Array(N) };
  for (let K = 0; K < N; K++) {
    if (!R.anda[K] || R.folga[K] < 1.0) continue;
    if (!noArredor[K]) { pode.mandante[K] = pode.visitante[K] = 1; continue; }
    if (divisa[K]) continue;
    if (zonaV[K]) pode.visitante[K] = 1; else pode.mandante[K] = 1;
  }
  const podeReta = (Ka, Kb, ok) => {
    const [xa, za] = R.centro(Ka), [xb, zb] = R.centro(Kb), n = Math.ceil(Math.hypot(xb - xa, zb - za) / (R.L * 0.5));
    for (let s = 0; s <= n; s++) {
      const K = R.celula(xa + (xb - xa) * s / n, za + (zb - za) * s / n);
      if (K < 0 || !ok[K]) return false;
    }
    return true;
  };
  for (const b of bondes) {
    if (!b.cels) continue;
    const ok = pode[b.lado], c = b.cels, keep = [0];
    let i = 0;
    while (i < c.length - 1) {
      let j = Math.min(c.length - 1, i + 60);
      while (j > i + 1 && !podeReta(c[i], c[j], ok)) j--;
      keep.push(j); i = j;
    }
    /* a revista: a primeira célula da rota dentro dos arredores (na boca dela) */
    let kRev = c.findIndex(K => noArredor[K]);
    if (kRev < 0) kRev = c.length - 1;
    let bi = bocaDe[c[kRev]];
    if (bi < 0) { let md = Infinity; const [x, z] = R.centro(c[kRev]); bocas.forEach((q, qi) => { const d = Math.hypot(x - q.meio[0], z - q.meio[1]); if (d < md) { md = d; bi = qi; } }); }
    if (bi >= 0) bocas[bi].usada.push(b);
    b.boca = bi;
    /* os pontos: a porta da sede, os da rota enxuta (com a revista no meio, marcada) e a boca do portão */
    const pts = [[b.t.porta.x, 0, b.t.porta.y]];
    for (const k of keep) {
      if (k > kRev && !pts.revista) { const [x, z] = R.centro(c[kRev]); pts.push([x, 0, z]); pts.revista = pts.length - 1; }
      const [x, z] = R.centro(c[k]); pts.push([x, 0, z]);
    }
    if (!pts.revista) pts.revista = pts.length - 1;
    const pb = portoes[b.nPortao].mundo;
    pts.push([pb[0], 0, pb[2]]);
    for (const p of pts) p[1] = ctx.chaoDaRua(p[0], p[2]);
    b.rua = Trilha(pts);
    b.sRevista = b.rua.acc[pts.revista];
    b.comprimento = b.rua.L / M;
  }
  marca('enxugar');

  /* O HORÁRIO: cada um chega na boca do portão na hora dele (o visitante
     antes), e a saída do visitante adianta enquanto um bonde rival passa
     perto de outro na cidade, ou chega num CRUZAMENTO das rotas sem
     MARGEM de tempo do outro */
  const alvo = b => BOLA - (b.lado === 'visitante' ? 55 : 40) * 60 + (b.escalao - 1) * 5 * 60;
  const tRevista = b => b.n * REVISTA;
  const durRua = b => b.rua.L / M / MARCHA + tRevista(b);
  const vivos = bondes.filter(b => b.rua);
  for (const b of vivos) b.sai = alvo(b) - durRua(b);
  /* onde está a cabeça (s na rua) na hora t */
  const cabeca = (b, t) => {
    const s1 = b.sRevista / M / MARCHA, T = t - b.sai;
    if (T <= 0) return 0;
    if (T < s1) return T * MARCHA * M;
    if (T < s1 + tRevista(b)) return b.sRevista;
    return Math.min(b.rua.L, b.sRevista + (T - s1 - tRevista(b)) * MARCHA * M);
  };
  /* a hora em que a cabeça passa no ponto s da rua; e o rabo (o bonde tem uma fileira a cada ESPACO m) */
  const quando = (b, s) => b.sai + s / M / MARCHA + (s > b.sRevista ? tRevista(b) : 0);
  const quandoRabo = (b, s) => quando(b, s) + Math.ceil(b.n / LARG) * ESPACO / MARCHA;
  const Q = {};
  const naCidade = (b, s) => { const p = b.rua.ponto(s, Q), K = R.celula(p.x, p.z); return K < 0 || !noArredor[K]; };
  /* a menor distância entre dois bondes rivais na cidade (fora dos arredores): a cabeça e o rabo de cada um */
  function encontro(a, b) {
    const t0 = Math.min(a.sai, b.sai), t1 = Math.max(a.sai + durRua(a), b.sai + durRua(b));
    let melhor = { d: Infinity, t: 0, x: 0, z: 0 };
    const pa = {}, pb = {};
    for (let t = t0; t <= t1; t += 10) {
      const sa = cabeca(a, t), sb = cabeca(b, t);
      if (t < a.sai || t < b.sai) continue;
      if (sa >= a.rua.L - 1 || sb >= b.rua.L - 1) continue;
      for (const oa of [0, a.n / LARG * ESPACO * M]) for (const ob of [0, b.n / LARG * ESPACO * M]) {
        const s1 = Math.max(0, sa - oa), s2 = Math.max(0, sb - ob);
        if (!naCidade(a, s1) || !naCidade(b, s2)) continue;
        a.rua.ponto(s1, pa); b.rua.ponto(s2, pb);
        const d = Math.hypot(pa.x - pb.x, pa.z - pb.z) / M;
        if (d < melhor.d) melhor = { d, t, x: (pa.x + pb.x) / 2, z: (pa.z + pb.z) / 2 };
      }
    }
    return melhor;
  }
  const rivaisDe = b => vivos.filter(o => o.lado !== b.lado);
  /* OS CRUZAMENTOS: cada trecho em que a rota de um mandante passa a menos
     de TRAVESSIA m da de um visitante, na cidade (nos arredores, quem
     separa é o cordão), e o ponto mais perto dele. Quando dá, as rotas se
     evitam (o custo); quando o mapa obriga (o visitante mora do lado do
     mandante e o portão dele fica do outro), elas se cruzam, e quem separa
     é o horário */
  const cruzamentos = [];
  {
    const pa = {}, pb = {}, passo = 2 * M;
    for (const a of vivos) if (a.lado === 'mandante') for (const o of rivaisDe(a)) {
      let trecho = null;
      const fecha = () => { if (trecho) cruzamentos.push(trecho); trecho = null; };
      for (let sa = 0; sa <= a.rua.L; sa += passo) {
        if (!naCidade(a, sa)) { fecha(); continue; }
        a.rua.ponto(sa, pa);
        let md = Infinity, sb = 0;
        for (let s = 0; s <= o.rua.L; s += passo) { o.rua.ponto(s, pb); const d = (pa.x - pb.x) ** 2 + (pa.z - pb.z) ** 2; if (d < md) { md = d; sb = s; } }
        md = Math.sqrt(md) / M;
        if (md > TRAVESSIA || !naCidade(o, sb)) { fecha(); continue; }
        if (!trecho || md < trecho.d) { o.rua.ponto(sb, pb); trecho = { a, o, sa, sb, d: md, x: (pa.x + pb.x) / 2, z: (pa.z + pb.z) / 2 }; }
      }
      fecha();
    }
  }
  /* a folga de tempo num cruzamento (s): quanto antes de o segundo chegar (a cabeça) o primeiro já passou (o rabo) */
  const folgaNo = c => Math.max(quando(c.a, c.sa) - quandoRabo(c.o, c.sb), quando(c.o, c.sb) - quandoRabo(c.a, c.sa));
  /* a nota do horário de um visitante: 1 quando nenhum rival chega a ENCONTRO m dele na rua e ele passa cada cruzamento com MARGEM */
  const notaDo = b => {
    let e = { d: Infinity };
    for (const o of rivaisDe(b)) { const x = encontro(b, o); if (x.d < e.d) e = x; }
    let n = Math.min(1, e.d / ENCONTRO);
    for (const c of cruzamentos) if (c.o === b) n = Math.min(n, folgaNo(c) / MARGEM);
    return n;
  };
  for (const b of vivos.filter(b => b.lado === 'visitante').sort((a, c) => a.escalao - c.escalao)) {
    const base = b.sai;
    let melhor = { adianta: 0, n: notaDo(b) };
    for (let k = 1; k <= 10 && melhor.n < 1; k++) {
      b.sai = base - k * 180;
      const n = notaDo(b);
      if (n > melhor.n) melhor = { adianta: k * 3, n };
    }
    b.sai = base - melhor.adianta * 60;
    b.adiantou = melhor.adianta;
  }
  /* o corredor abre um minuto depois do último visitante passar a catraca;
     o mandante que anda nele sai mais tarde, se precisar, pra entrar nele
     depois disso */
  let tAbre = null;
  if (vivos.some(b => b.peloCorredor)) {
    tAbre = Math.max(...vivos.filter(b => b.lado === 'visitante').map(b => b.sai + durRua(b) + 4 + (b.n - 1) * CATRACA)) + 60;
    for (const b of vivos) if (b.peloCorredor) {
      const k = b.cels.findIndex(K => noArredor[K] && (zonaV[K] === 1 || divisa[K]));
      if (k < 0) continue;
      const [x, z] = R.centro(b.cels[k]);
      /* o ponto da rua dele mais perto dessa célula */
      let sEntra = 0, md = Infinity;
      for (let s = 0; s <= b.rua.L; s += M) { b.rua.ponto(s, Q); const d = (Q.x - x) ** 2 + (Q.z - z) ** 2; if (d < md) { md = d; sEntra = s; } }
      const atraso = tAbre + 30 - quando(b, sEntra);
      if (atraso > 0) { b.sai += atraso; b.esperou = Math.ceil(atraso / 60); }
    }
  }
  let menor = { d: Infinity };
  for (const a of vivos) for (const o of rivaisDe(a)) if (a.lado === 'mandante') { const e = encontro(a, o); if (e.d < menor.d) menor = { ...e, a, b: o }; }
  /* AS TRAVESSIAS: os cruzamentos (os de 25 m um do outro viram um só).
     A PM fecha a rua de quem passa DEPOIS dos dois lados da rota de quem
     passa ANTES, e libera um minuto depois do último deste passar */
  const travessias = [];
  for (const c of cruzamentos.slice().sort((p, q) => p.d - q.d)) {
    const oAntes = quando(c.o, c.sb) <= quando(c.a, c.sa);
    const antes = oAntes ? c.o : c.a, depois = oAntes ? c.a : c.o, sAntes = oAntes ? c.sb : c.sa, sDepois = oAntes ? c.sa : c.sb;
    const libera = quandoRabo(antes, sAntes) + 60, chega = quando(depois, sDepois);
    const junto = travessias.find(v => Math.hypot(v.x - c.x, v.z - c.z) < 25 * M);
    if (junto) {
      junto.libera = Math.max(junto.libera, libera); junto.chega = Math.min(junto.chega, chega);
      if (!junto.antes.includes(antes)) junto.antes.push(antes);
      if (!junto.depois.includes(depois)) junto.depois.push(depois);
      continue;
    }
    travessias.push({ x: c.x, z: c.z, d: c.d, antes: [antes], depois: [depois], sAntes, sDepois, libera, chega });
  }
  for (const v of travessias) v.folga = v.chega - v.libera + 60;
  marca('horario');

  /* dentro do estádio: a hora em que cada um passa a catraca e o caminho dele até a vaga */
  for (const b of vivos) {
    b.chega = b.sai + durRua(b);
    const S = b.S, cam = [];
    for (let i = 0; i < S.caminho.length; i += 3) cam.push(mundo(S.caminho[i], S.caminho[i + 1], S.caminho[i + 2]));
    b.dentro = [];
    for (let m = 0; m < b.n; m++) {
      const vg = S.vagas[b.vaga0 + m], a = vg[0], pts = cam.slice(0, a + 1);
      for (let i = 1; i < vg.length; i += 3) pts.push(mundo(vg[i], vg[i + 1], vg[i + 2]));
      b.dentro.push(Trilha(pts));
    }
    b.entra = m => b.chega + 4 + m * CATRACA;
    b.fim = b.entra(b.n - 1) + b.dentro[b.n - 1].L / M / DENTRO;
  }

  /* A PM: o cordão divisório, a revista na boca de cada rota e, fechadas,
     as outras bocas da zona do visitante (as do mandante ficam abertas: é
     por onde chega o resto da torcida dele) */
  const pm = { cordoes: [], fechadas: [], revistas: [], abertas: [] };
  for (const c of cordoes) pm.cordoes.push(c);
  for (const q of bocas) (q.usada.length ? pm.revistas : q.lado === 'visitante' ? pm.fechadas : pm.abertas).push(q);
  marca('pm');
  return {
    casa, fora, pares: pares.map(p => p[0].nome + ' × ' + p[1].nome), par: escolha.par || 0,
    estadio: est, centroEst, mundo, portoes, bondes, vivos, R, zona, noArredor, divisa, raio, bocas, cordoes, pm, menor, travessias, cabeca, M, rotaVelha, longeDe, tentativas, tAbre, portoesQueAbrem: [...new Set(vivos.filter(b => b.peloCorredor).map(b => b.portao.nome))],
    inicio: Math.min(...vivos.map(b => b.sai)) - 120, fimTudo: Math.max(...vivos.map(b => b.fim)), tempos
  };
}

/* ======================================================
   A CENA DO DIA DE JOGO: os bonecos, a PM, a grade, as fitas, as zonas
   ====================================================== */
export function criarDiaDeJogo(ctx) {
  const { M, raiz } = ctx;
  const $ = s => raiz.querySelector(s);
  const ESTILO = `
.cen-jogo { position: absolute; right: 12px; top: calc(var(--topo-alt, 60px) + 18px); width: min(380px, calc(100% - 24px)); max-height: calc(100% - var(--topo-alt, 60px) - 90px);
  overflow: auto; padding: 12px 14px; border-radius: 10px; background: color-mix(in srgb, var(--folha) 94%, transparent); border: 1px solid var(--linha);
  box-shadow: 0 2px 14px rgba(0,0,0,.16); font-size: 13px; }
.cen-jogo[hidden] { display: none; }
.cen-jogo .cj-sobre { margin: 0; font: 600 11px/1.2 var(--f-ui); letter-spacing: .06em; text-transform: uppercase; color: var(--tinta-2); }
.cen-jogo h2 { margin: 3px 0 2px; font: 700 19px/1.15 var(--f-ui); padding-right: 30px; }
.cen-jogo .cj-onde { margin: 0 0 8px; color: var(--tinta-2); }
.cen-jogo .cj-rel { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 6px 0 8px; }
.cen-jogo .cj-rel b { font: 700 22px/1 var(--f-dado); font-variant-numeric: tabular-nums; min-width: 64px; }
.cen-jogo .cj-rel .cen-bt { padding: 6px 10px; }
.cen-jogo .cj-vezes { display: inline-flex; border: 1px solid var(--linha); border-radius: 8px; padding: 2px; background: var(--papel); }
.cen-jogo .cj-vezes button { font: 600 12px/1 var(--f-ui); color: var(--tinta-2); background: none; border: 0; border-radius: 6px; padding: 6px 8px; cursor: pointer; }
.cen-jogo .cj-vezes button[aria-pressed="true"] { background: var(--acento); color: var(--folha); }
.cen-jogo input[type=range] { width: 100%; margin: 0 0 6px; }
.cen-jogo ul { list-style: none; margin: 6px 0; padding: 0; display: grid; gap: 6px; }
.cen-jogo li { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 4px 8px; align-items: start; padding: 6px 8px; border-radius: 8px; background: var(--papel); border: 1px solid var(--linha); }
.cen-jogo li i { width: 14px; height: 14px; border-radius: 3px; margin-top: 2px; box-shadow: inset 0 0 0 1px rgba(0,0,0,.25); }
.cen-jogo li b { font: 700 13.5px/1.2 var(--f-ui); }
.cen-jogo li small { display: block; color: var(--tinta-2); font-size: 12px; line-height: 1.35; }
.cen-jogo li .cj-estado { color: var(--tinta); font-weight: 600; }
.cen-jogo .cj-lado { margin: 10px 0 0; font: 700 12px/1.2 var(--f-ui); letter-spacing: .05em; text-transform: uppercase; color: var(--tinta-2); }
.cen-jogo .cj-pm, .cen-jogo .cj-aviso { margin: 8px 0 0; font-size: 12.5px; color: var(--tinta-2); }
.cen-jogo .cj-aviso.ruim { color: #b3261e; font-weight: 600; }
.cen-jogo .cj-ctrl { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; align-items: center; }
.cen-jogo .cj-ctrl select { font: 600 13px/1.2 var(--f-ui); color: var(--tinta); background: var(--papel); border: 1px solid var(--linha); border-radius: 8px; padding: 6px 6px; max-width: 100%; }
.cen-jogo .cj-ctrl label { display: inline-flex; gap: 5px; align-items: center; font: 600 12.5px/1 var(--f-ui); color: var(--tinta-2); }
@media (max-width: 760px) { .cen-jogo { left: 8px; right: 8px; width: auto; top: auto; bottom: 8px; max-height: 46vh; } }`;
  const estilo = document.createElement('style'); estilo.textContent = ESTILO; document.head.appendChild(estilo);
  const painel = document.createElement('aside');
  painel.className = 'cen-jogo'; painel.hidden = true; painel.setAttribute('aria-label', 'Dia de jogo');
  raiz.appendChild(painel);

  let plano = null, escolha = { par: 0, inverter: false, gente: 1 }, t = 0, rodando = false, vezes = 30, seguir = null, verRotas = true;
  let grupo = null, discos = [], policiais = [];
  const J = { discos: [], policiais: [], projeteis: [], grades: [], paz: true, t: 0 };
  const Q = {}, Q2 = {};

  /* ---- a grade de contenção (a de ferro, 2 m × 1,1 m), uma malha por instância ---- */
  const geoGrade = (() => {
    const partes = [];
    const caixa = (x0, x1, y0, y1, z0, z1) => { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); partes.push(g); };
    const w = 1.0, h = 1.1;
    caixa(-w, -w + 0.04, 0.08, h, -0.02, 0.02); caixa(w - 0.04, w, 0.08, h, -0.02, 0.02);
    caixa(-w, w, h - 0.04, h, -0.02, 0.02); caixa(-w, w, 0.22, 0.26, -0.02, 0.02);
    for (let k = 1; k < 12; k++) { const x = -w + k * 2 * w / 12; caixa(x - 0.008, x + 0.008, 0.26, h - 0.04, -0.008, 0.008); }
    for (const x of [-w + 0.1, w - 0.1]) caixa(x - 0.03, x + 0.03, 0, 0.08, -0.3, 0.3);
    let n = 0; for (const g of partes) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = [];
    let o = 0;
    for (const g of partes) {
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      for (let k = 0; k < g.index.count; k++) idx.push(g.index.getX(k) + o);
      o += g.attributes.position.count; g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setIndex(idx);
    geo.scale(M, M, M);
    return geo;
  })();
  const matGrade = new THREE.MeshLambertMaterial({ color: '#9aa3a8' });

  /* ---- um rótulo (sprite) com texto ---- */
  function rotulo(texto, fundo, tinta = '#fff', alto = 2.2) {
    const cv = document.createElement('canvas'), c = cv.getContext('2d'), f = 44;
    c.font = `700 ${f}px system-ui, sans-serif`;
    const w = Math.ceil(c.measureText(texto).width) + 28;
    cv.width = w; cv.height = f + 22;
    c.font = `700 ${f}px system-ui, sans-serif`;
    c.fillStyle = fundo; c.beginPath(); c.roundRect(0, 0, w, f + 22, 12); c.fill();
    c.fillStyle = tinta; c.textBaseline = 'middle'; c.fillText(texto, 14, (f + 22) / 2 + 2);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false, transparent: true }));
    sp.renderOrder = 20;
    sp.scale.set(alto * M * w / (f + 22), alto * M, 1);
    sp.userData.alto = alto;
    return sp;
  }

  /* ---- a fita de uma rota no chão ---- */
  function fita(pts, cor, larg = 0.9, alto = 0.14) {
    const pos = [], idx = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const nx = -dz * larg * M / 2, nz = dx * larg * M / 2, y = pts[i][1] + alto * M;
      pos.push(pts[i][0] + nx, y, pts[i][2] + nz, pts[i][0] - nx, y, pts[i][2] - nz);
      if (i) { const k = 2 * i; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide }));
    m.renderOrder = 5;
    return m;
  }

  /* ---- as zonas dos arredores pintadas no chão (uma textura, 1 px por metro) ---- */
  function chaoDasZonas(p) {
    const R = p.R;
    let I0 = Infinity, I1 = -1, J0 = Infinity, J1 = -1;
    for (let K = 0; K < R.N; K++) if (p.noArredor[K]) { const I = K % R.CX, J = (K - I) / R.CX; I0 = Math.min(I0, I); I1 = Math.max(I1, I); J0 = Math.min(J0, J); J1 = Math.max(J1, J); }
    if (I1 < 0) return null;
    const w = I1 - I0 + 1, h = J1 - J0 + 1, cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d'), img = c.createImageData(w, h);
    const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
    const cm = rgb('#2e7d32'), cvz = rgb('#c62828'), cd = rgb('#1f3f9a');
    for (let J = J0; J <= J1; J++) for (let I = I0; I <= I1; I++) {
      const K = J * R.CX + I, o = ((J - J0) * w + (I - I0)) * 4;
      if (!p.noArredor[K]) continue;
      const cc = p.divisa[K] ? cd : p.zona[K] === 0 ? cm : cvz;
      img.data[o] = cc[0]; img.data[o + 1] = cc[1]; img.data[o + 2] = cc[2]; img.data[o + 3] = p.divisa[K] ? 150 : 70;
    }
    c.putImageData(img, 0, 0);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = THREE.NearestFilter;
    const [x0, z0] = R.centro(J0 * R.CX + I0);
    const geo = new THREE.PlaneGeometry(w * R.L, h * R.L); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
    m.position.set(x0 - R.L / 2 + w * R.L / 2, 0.1 * M, z0 - R.L / 2 + h * R.L / 2);
    m.renderOrder = 4;
    return m;
  }

  /* ---- a PM parada: {x, y (o z do mundo), alt, rumo, escudo} ---- */
  function poePM(x, z, rumo, escudo = true) {
    const p = { x, y: z, alt: ctx.chaoDaRua(x, z), rumo, vivo: true, escudo, cooldown: 0, golpe: 0, carga: false };
    policiais.push(p);
    return p;
  }
  /* a grade de contenção de a a b (em mundo), em pedaços de 2 m */
  function poeGrades(a, b, lista) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) / M, n = Math.max(1, Math.round(L / 2.05));
    const ang = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
    for (let k = 0; k < n; k++) {
      const t0 = (k + 0.5) / n, x = a[0] + (b[0] - a[0]) * t0, z = a[1] + (b[1] - a[1]) * t0;
      lista.push({ x, z, ang, esc: Math.min(1, L / n / 2.05) });
    }
  }

  /* uma lista de grades ({x, z, ang, esc}) numa malha de instâncias */
  function malhaDeGrades(lista) {
    if (!lista.length) return null;
    const im = new THREE.InstancedMesh(geoGrade, matGrade, lista.length), mt = new THREE.Matrix4(), q4 = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), eixo = new THREE.Vector3(0, 1, 0);
    lista.forEach((g, i) => { q4.setFromAxisAngle(eixo, g.ang); sc.set(g.esc, 1, 1); ps.set(g.x, ctx.chaoDaRua(g.x, g.z), g.z); mt.compose(ps, q4, sc); im.setMatrixAt(i, mt); });
    return im;
  }

  /* ======================================================
     MONTAR: o plano, a PM, as fitas e os bonecos na porta da sede
     ====================================================== */
  function montar() {
    desmontar();
    plano = planejar(ctx, escolha);
    if (plano.erro) { painel.innerHTML = cabecalho() + `<p class="cj-aviso ruim">${esc(plano.erro)}</p>`; ligarPainel(); return false; }
    grupo = new THREE.Group(); grupo.name = 'dia-de-jogo';
    ctx.doMapa().add(grupo);
    const p = plano, R = p.R, grades = [];
    /* o que sai numa hora marcada: a grade (numa malha à parte) e os PMs
       que vão pra calçada — a travessia, e o corredor que abre pro mandante */
    p.pmsQueSaem = []; p.gradesQueSaem = []; p.nGradesQueSaem = 0;
    const gradesAbre = [], abreCorredor = p.tAbre != null;
    /* os PMs de uma fila de a a b (em mundo) que, na hora de abrir, se
       espremem nas duas pontas (a calçada), 0,7 m um do outro */
    const abrirFila = (lista, a, b) => {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
      let na = 0, nb = 0;
      for (const q of lista) {
        const t0 = ((q.pm.x - a[0]) * ux + (q.pm.y - a[1]) * uz) / L, d = (0.4 + 0.7 * (t0 < 0.5 ? na++ : nb++)) * M;
        const [px, pz] = t0 < 0.5 ? [a[0] + ux * d, a[1] + uz * d] : [b[0] - ux * d, b[1] - uz * d];
        const ox = q.pm.x - (a[0] + ux * t0 * L), oz = q.pm.y - (a[1] + uz * t0 * L);
        p.pmsQueSaem.push({ pm: q.pm, fecha: [q.pm.x, q.pm.y], abre: [px + ox, pz + oz], libera: p.tAbre, rumoFecha: q.pm.rumo, rumoAbre: q.pm.rumo });
      }
    };
    /* O CORDÃO DIVISÓRIO: a grade na divisa e os PMs de escudo virados pro visitante, 1,2 m pro lado dele */
    for (const c of p.cordoes) {
      const abre = abreCorredor && c.abre;
      poeGrades(c.a, c.b, abre ? gradesAbre : grades);
      const L = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]) / M, n = Math.max(2, Math.round(L / 1.4));
      /* o lado do visitante: a célula do visitante mais perto do meio */
      const nx = -c.dir[1], nz = c.dir[0];
      const Kv = R.celula(c.meio[0] + nx * 2 * M, c.meio[1] + nz * 2 * M), s = Kv >= 0 && p.zona[Kv] === 1 ? 1 : -1;
      const fila = [];
      for (let k = 0; k < n; k++) {
        const t0 = (k + 0.5) / n, x = c.a[0] + (c.b[0] - c.a[0]) * t0 + s * nx * 1.2 * M, z = c.a[1] + (c.b[1] - c.a[1]) * t0 + s * nz * 1.2 * M;
        if (R.folgaEm(x, z) < 0.3) continue;
        fila.push({ pm: poePM(x, z, Math.atan2(s * nx, s * nz)) });
      }
      if (abre) abrirFila(fila, c.a, c.b);
      const r = rotulo(abre ? 'Cordão da PM · abre às ' + hora(p.tAbre) : 'Cordão da PM', '#1f3f9a'); r.position.set(c.meio[0], 5 * M, c.meio[1]); r.userData.prio = 2 + 1 / (1 + c.n); grupo.add(r);
    }
    /* AS BOCAS: a fechada (só as da zona do visitante) leva a grade atravessada e dois PMs; a da revista, o funil e três */
    for (const q of p.pm.fechadas.concat(p.pm.revistas)) {
      const nx = -q.dir[1], nz = q.dir[0];
      /* pra fora: o lado sem arredor */
      const Kf = R.celula(q.meio[0] + nx * 2 * M, q.meio[1] + nz * 2 * M), s = Kf >= 0 && !p.noArredor[Kf] ? 1 : -1;
      const L = Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) / M;
      if (!q.usada.length) {
        const abre = abreCorredor && q.abre;
        poeGrades(q.a, q.b, abre ? gradesAbre : grades);
        const fila = [0.3, 0.7].map(k => ({ pm: poePM(q.a[0] + (q.b[0] - q.a[0]) * k - s * nx * 1.0 * M, q.a[1] + (q.b[1] - q.a[1]) * k - s * nz * 1.0 * M, Math.atan2(s * nx, s * nz)) }));
        if (abre) abrirFila(fila, q.a, q.b);
      } else {
        /* a abertura de 3 m onde a rota passa */
        const b0 = q.usada[0], rp = b0.rua.ponto(b0.sRevista, {}), tRota = ((rp.x - q.a[0]) * q.dir[0] + (rp.z - q.a[1]) * q.dir[1]);
        const abre = 1.6 * M;
        const pa = [q.a[0] + q.dir[0] * (tRota - abre), q.a[1] + q.dir[1] * (tRota - abre)], pb = [q.a[0] + q.dir[0] * (tRota + abre), q.a[1] + q.dir[1] * (tRota + abre)];
        if (tRota - abre > 0.5 * M) poeGrades(q.a, pa, grades);
        if (L * M - (tRota + abre) > 0.5 * M) poeGrades(pb, q.b, grades);
        for (const [dx, dz] of [[-1.2, 1.3], [1.2, 1.3], [0, 2.4]]) {
          const x = rp.x + q.dir[0] * dx * M + s * nx * dz * M, z = rp.z + q.dir[1] * dx * M + s * nz * dz * M;
          poePM(x, z, Math.atan2(-s * nx, -s * nz), false);
        }
        const r = rotulo('Revista · ' + q.usada.map(b => b.t.sigla).join(', '), '#1f3f9a'); r.position.set(rp.x, 4.5 * M, rp.z); r.userData.prio = 1; grupo.add(r);
      }
    }
    /* AS TRAVESSIAS: na rua de quem passa depois, dos dois lados da rota
       de quem passa antes, a grade de parede a parede e 3 PMs do lado do
       cruzamento, virados pra fora dele; na hora de liberar, a grade sai e
       os PMs vão pra calçada */
    for (const v of p.travessias) {
      const rota = v.depois[0].rua, outra = v.antes[0].rua, gradesV = [];
      /* a distância (m) do ponto até a rota de quem passa antes, perto do cruzamento */
      const ateOutra = (x, z) => { let md = Infinity; for (let s = Math.max(0, v.sAntes - 60 * M); s <= Math.min(outra.L, v.sAntes + 60 * M); s += M) { outra.ponto(s, Q2); md = Math.min(md, Math.hypot(Q2.x - x, Q2.z - z)); } return md / M; };
      for (const lado of [-1, 1]) {
        let ali = null;
        for (let k = 6; k <= 30 && !ali; k++) {
          const s = v.sDepois + lado * k * M;
          if (s < 0 || s > rota.L) break;
          rota.ponto(s, Q);
          if (ateOutra(Q.x, Q.z) >= 6) ali = { x: Q.x, z: Q.z, tx: Q.tx, tz: Q.tz };
        }
        if (!ali) continue;
        const meia = Math.max(0.6, R.folgaEm(ali.x, ali.z) - 0.3), nx = ali.tz, nz = -ali.tx;
        poeGrades([ali.x - nx * meia * M, ali.z - nz * meia * M], [ali.x + nx * meia * M, ali.z + nz * meia * M], gradesV);
        const rumoFecha = Math.atan2(lado * ali.tx, lado * ali.tz);
        for (let i = 0; i < 3; i++) {
          const lat = (i - 1) * meia * 0.6, la = i === 0 ? -(meia - 0.3) : meia - 0.3, ao = -lado * (1.2 + (i === 1 ? 1.3 : 0));
          const fecha = [ali.x + nx * lat * M - lado * ali.tx * 1.2 * M, ali.z + nz * lat * M - lado * ali.tz * 1.2 * M];
          const abre = [ali.x + nx * la * M + ali.tx * ao * M, ali.z + nz * la * M + ali.tz * ao * M];
          const sg = Math.sign(la);
          p.pmsQueSaem.push({ pm: poePM(fecha[0], fecha[1], rumoFecha), fecha, abre, libera: v.libera, rumoFecha, rumoAbre: Math.atan2(-sg * nx, -sg * nz) });
        }
      }
      const mg = malhaDeGrades(gradesV);
      if (mg) { mg.name = 'grades-da-travessia'; grupo.add(mg); p.gradesQueSaem.push({ malha: mg, libera: v.libera }); p.nGradesQueSaem += gradesV.length; }
      const r = rotulo('Travessia · PM fecha até ' + hora(v.libera), '#1f3f9a'); r.position.set(v.x, 4.5 * M, v.z); r.userData.prio = 1; grupo.add(r);
    }
    /* o corredor que abre pro mandante: as grades dele numa malha à parte */
    const mgA = malhaDeGrades(gradesAbre);
    if (mgA) { mgA.name = 'grades-do-corredor'; grupo.add(mgA); p.gradesQueSaem.push({ malha: mgA, libera: p.tAbre }); p.nGradesQueSaem += gradesAbre.length; }
    /* as grades numa malha só (instâncias) */
    const im = malhaDeGrades(grades);
    if (im) { im.name = 'grades-da-pm'; grupo.add(im); }
    p.nGrades = grades.length + p.nGradesQueSaem;
    /* A ESCOLTA: 4 PMs com o bonde do 1º escalão visitante */
    const escoltado = p.vivos.find(b => b.lado === 'visitante' && b.escalao === 1);
    p.escolta = escoltado ? [0, 1, 2, 3].map(k => ({ pm: poePM(escoltado.rua.pts[0][0], escoltado.rua.pts[0][2], 0, false), k, b: escoltado })) : [];
    p.nPMs = policiais.length;
    /* AS FITAS das rotas e o rótulo de cada sede */
    p.fitas = [];
    for (const b of p.vivos) {
      const f = fita(b.rua.pts, b.cor); f.name = 'rota ' + b.t.sigla; grupo.add(f); p.fitas.push(f);
      const r = rotulo(`${b.t.sigla} · ${b.n}`, b.cor, luz(b.cor) > 150 ? '#1a1a1a' : '#fff'); r.userData.prio = 0; b.rotulo = r; grupo.add(r);
    }
    const z = chaoDasZonas(p); if (z) { z.name = 'zonas'; grupo.add(z); p.chaoZonas = z; }
    /* OS BONECOS: cada um com o lugar na porta da sede (a torcida junta na calçada, virada pra rua) */
    for (const b of p.vivos) {
      const P0 = b.t.porta, fx = P0.fx, fz = P0.fy;
      b.gente = [];
      for (let m = 0; m < b.n; m++) {
        const r = Math.floor(m / 6), c = m % 6;
        let gx = P0.x + fx * (0.5 + r * 0.8) * M + fz * (c - 2.5) * 0.8 * M, gz = P0.y + fz * (0.5 + r * 0.8) * M - fx * (c - 2.5) * 0.8 * M;
        const d = { nome: b.t.sigla + ' ' + (m + 1), spawn: b.t.id, torcida: b.t.sigla, cor: b.t.cor, cor2: b.t.cor2, cor3: b.t.cor3 || undefined,
                    x: gx, y: gz, alt: ctx.chaoDaRua(gx, gz), rumo: Math.atan2(fx, fz), vivo: true, passada: 1.15,
                    derrubado: 0, golpe: 0, apanhou: 0, atordoado: 0, esquivou: 0, tremor: 0, defendendo: 0, hostil: 0, inimigoPerto: 0, chamou: -99, linha: 'frente' };
        const junto = [gx, gz];
        b.gente.push({ d, junto, m, dJunto: Math.hypot(junto[0] - b.rua.pts[0][0], junto[1] - b.rua.pts[0][2]) });
        discos.push(d);
      }
    }
    t = p.inicio;
    J.discos = discos; J.policiais = policiais;
    atualizar(0);
    desenharPainel();
    return true;
  }
  function desmontar() {
    if (grupo) {
      grupo.traverse(o => {
        if (o.isInstancedMesh) { o.dispose(); return; }
        if (o.geometry && o.geometry !== geoGrade) o.geometry.dispose();
        if (o.material && o.material !== matGrade) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      });
      grupo.removeFromParent();
    }
    grupo = null; discos = []; policiais = []; plano = null;
    J.discos = discos; J.policiais = policiais;
  }

  /* ======================================================
     O PASSO DO RELÓGIO: cada boneco onde deve estar na hora t
     ====================================================== */
  const estadoDe = (b, m) => {
    if (t < b.sai) return 'na sede';
    const e = b.entra(m);
    if (t >= e) { const s = (t - e) * DENTRO * M; return s >= b.dentro[m].L ? 'no lugar' : 'entrando'; }
    const sh = plano.cabeca(b, t);
    if (sh >= b.rua.L - 1) return 'na fila';
    if (Math.abs(sh - b.sRevista) < 1 && t - b.sai > b.sRevista / M / MARCHA) return 'na revista';
    return 'andando';
  };
  const suave = (a, b, k) => a + (b - a) * k;
  function atualizar(dt) {
    if (!plano) return;
    const p = plano;
    for (const b of p.vivos) {
      const sh = p.cabeca(b, t), L = b.rua.L;
      /* quantos já passaram a catraca (a fila anda) */
      let dentro = 0; while (dentro < b.n && b.entra(dentro) <= t) dentro++;
      b.dentroN = dentro;
      let noLugar = 0;
      for (const g of b.gente) {
        const d = g.d, m = g.m;
        const x0 = d.x, z0 = d.y;
        const e = b.entra(m);
        if (t >= e) {
          /* DENTRO: pela rota do estádio até a vaga */
          const tr = b.dentro[m], s = (t - e) * DENTRO * M;
          tr.ponto(s, Q);
          d.x = Q.x; d.y = Q.z;
          const yc = ctx.chaoDoEstadio ? ctx.chaoDoEstadio(Q.x, Q.z, d.alt ?? Q.y) : NaN;
          d.alt = yc === yc && Math.abs(yc - Q.y) < 1.2 * M ? suave(d.alt ?? yc, yc, 0.5) : Q.y;
          if (s >= tr.L) { noLugar++; d.rumo = Math.atan2(p.centroEst[0] - d.x, p.centroEst[2] - d.y); }
          continue;
        }
        /* NA RUA: a fileira dele atrás da cabeça; na boca vira fila */
        const r = Math.floor(m / LARG), c = m % LARG;
        let s = sh - (r * ESPACO + (c % 2) * 0.3) * M;
        const fila = m - dentro;
        s = Math.min(s, L - (fila * 0.7 + 0.4) * M);
        if (s + g.dJunto <= 0 || t < b.sai) {
          /* ainda na porta da sede */
          d.x = g.junto[0]; d.y = g.junto[1]; d.alt = ctx.chaoDaRua(d.x, d.y);
          continue;
        }
        if (s < 0) {
          /* da porta até o começo da rota */
          const k = clamp((s + g.dJunto) / g.dJunto, 0, 1), p0 = b.rua.pts[0];
          d.x = g.junto[0] + (p0[0] - g.junto[0]) * k; d.y = g.junto[1] + (p0[2] - g.junto[1]) * k;
        } else {
          b.rua.ponto(s, Q);
          /* o lado dele na fileira: estreita onde a rua estreita, e some perto da boca (a fila) */
          const folga = p.R.folgaEm(Q.x, Q.z), max = Math.max(0, folga - 0.6);
          let lat = clamp((c - (LARG - 1) / 2) * LADO, -max, max);
          lat *= clamp((L - s) / (8 * M), 0, 1) * clamp(s / (3 * M), 0, 1);
          d.x = Q.x + Q.tz * lat * M; d.y = Q.z - Q.tx * lat * M;
        }
        d.alt = ctx.chaoDaRua(d.x, d.y);
        const mx = d.x - x0, mz = d.y - z0;
        if (mx * mx + mz * mz > 1e-4) d.rumo = Math.atan2(mx, mz);
      }
      b.noLugar = noLugar;
      /* o rótulo em cima da cabeça do bonde (ou em cima da torcida, no lugar) */
      const lider = b.gente[0].d;
      b.rotulo.position.set(lider.x, (lider.alt || 0) + 3.4 * M, lider.y);
      /* a passada: o relógio acelerado não pode virar corrida */
      for (const g of b.gente) { g.d.passada = 1.15 * Math.max(1, rodando ? vezes : 1); g.d._cacando = false; }
    }
    /* a escolta: dois na frente e dois atrás do bonde, até a revista */
    for (const e of p.escolta) {
      const b = e.b, sh = p.cabeca(b, t), atras = (Math.ceil(b.n / LARG) * ESPACO + 1.5) * M;
      const s = Math.min(e.k < 2 ? sh + 2 * M : Math.max(0, sh - atras), b.sRevista - (e.k < 2 ? -0 : 3 * M));
      b.rua.ponto(Math.max(0, s), Q2);
      const folga = p.R.folgaEm(Q2.x, Q2.z), lat = Math.min(2.2, Math.max(0.6, folga - 0.6)) * (e.k % 2 ? 1 : -1);
      const x0 = e.pm.x, z0 = e.pm.y;
      e.pm.x = Q2.x + Q2.tz * lat * M; e.pm.y = Q2.z - Q2.tx * lat * M; e.pm.alt = ctx.chaoDaRua(e.pm.x, e.pm.y);
      const mx = e.pm.x - x0, mz = e.pm.y - z0;
      if (mx * mx + mz * mz > 1e-4) e.pm.rumo = Math.atan2(mx, mz);
    }
    /* a travessia e o corredor que abre: fechados até a hora; aí a grade sai e os PMs andam (25 s) pra calçada */
    for (const g of p.gradesQueSaem) g.malha.visible = t < g.libera;
    for (const q of p.pmsQueSaem) {
      const k = clamp((t - q.libera) / 25, 0, 1), pm = q.pm;
      pm.x = q.fecha[0] + (q.abre[0] - q.fecha[0]) * k; pm.y = q.fecha[1] + (q.abre[1] - q.fecha[1]) * k;
      pm.alt = ctx.chaoDaRua(pm.x, pm.y);
      pm.rumo = k <= 0 ? q.rumoFecha : k >= 1 ? q.rumoAbre : Math.atan2(q.abre[0] - q.fecha[0], q.abre[1] - q.fecha[1]);
    }
    /* a passada dos PMs que andam, como a dos bonecos */
    for (const pm of policiais) pm.passada = 1.15 * Math.max(1, rodando ? vezes : 1);
    J.t = t;
  }

  /* ======================================================
     O PAINEL
     ====================================================== */
  function cabecalho() {
    return `<button class="cen-x" data-jogo="fechar" aria-label="Fechar o dia de jogo">×</button><p class="cj-sobre">Dia de jogo · clássico fictício</p>`;
  }
  function linhaDe(b) {
    const est = b.estadoTxt || '—';
    return `<li><i style="background:${esc(b.cor)}"></i><div><b>${esc(b.t.sigla)}</b> <small>${esc(b.t.nome)} · ${b.escalao}º escalão · ${b.n} bonecos (${b.t.membros || '?'} membros)</small>
      <small>Sai da sede (${esc(b.t.bairro || '—')}) às ${hora(b.sai)}${b.adiantou ? ` (${b.adiantou} min antes, pra não cruzar rival)` : ''}${b.esperou ? ` (${b.esperou} min depois: espera o corredor do visitante abrir)` : ''} · ${Math.round(b.comprimento)} m até o ${esc(b.portao.nome.toLowerCase())} · setor ${esc(b.setor)}</small>
      <small class="cj-estado" data-bonde="${esc(b.t.id)}">${esc(est)}</small></div></li>`;
  }
  /* o que o plano diz do encontro entre rivais na cidade */
  const siglas = l => { const n = l.slice().sort((a, b) => a.escalao - b.escalao).map(b => esc(b.t.sigla)); return n.length > 1 ? n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1] : n[0]; };
  function encontroTxt(p) {
    const e = p.menor && p.menor.d < Infinity ? p.menor : null, v = p.travessias;
    if (e && e.d < ENCONTRO) return `Encontro provável: ${esc(e.a.t.sigla)} e ${esc(e.b.t.sigla)} passam a <b>${Math.round(e.d)} m</b> um do outro às ${hora(e.t)}, na cidade.`;
    const partes = [];
    if (e) partes.push(`Na rua, o mais perto que dois bondes rivais chegam um do outro: <b>${Math.round(e.d)} m</b> (${esc(e.a.t.sigla)} e ${esc(e.b.t.sigla)}, às ${hora(e.t)}).`);
    else partes.push('Nenhum bonde rival está na rua ao mesmo tempo que outro, fora dos arredores.');
    if (!v.length) partes.push(`As rotas rivais não se cruzam na cidade: nenhuma passa a menos de ${TRAVESSIA} m de outra.`);
    else partes.push(`As rotas rivais se cruzam em ${v.length === 1 ? 'um ponto' : v.length + ' pontos'} da cidade, onde o mapa não deixa uma evitar a outra: ` +
      v.map(x => `${siglas(x.antes)} passa${x.antes.length > 1 ? 'm' : ''} até ${hora(x.libera - 60)} e ${siglas(x.depois)} chega${x.depois.length > 1 ? 'm' : ''} às ${hora(x.chega)}`).join('; ') +
      '. Ali quem separa é o horário, e a PM fecha a travessia enquanto o primeiro passa.');
    return partes.join(' ');
  }
  function desenharPainel() {
    const p = plano;
    if (!p || p.erro) return;
    const menor = p.menor && p.menor.d < Infinity ? p.menor : null;
    const pmN = p.pm;
    const nCord = policiais.length - p.escolta.length;
    painel.innerHTML = cabecalho() + `
      <h2>${esc(p.casa.nome)} × ${esc(p.fora.nome)}</h2>
      <p class="cj-onde">${esc(p.estadio.nome)} · domingo, bola rolando às 16h00</p>
      <div class="cj-rel"><b class="cj-relogio">${hora(t)}</b>
        <button class="cen-bt" data-jogo="toca" aria-pressed="${rodando}">${rodando ? 'Pausar' : 'Começar'}</button>
        <span class="cj-vezes" role="group" aria-label="Velocidade">${VEZES.map(v => `<button data-vezes="${v}" aria-pressed="${v === vezes}">${v}×</button>`).join('')}</span></div>
      <input type="range" class="cj-tempo" min="${Math.floor(p.inicio)}" max="${Math.ceil(p.fimTudo + 60)}" step="1" value="${Math.round(t)}" aria-label="A hora do jogo">
      <p class="cj-lado">Mandante · portões 1 e 2</p><ul>${p.vivos.filter(b => b.lado === 'mandante').map(linhaDe).join('')}</ul>
      <p class="cj-lado">Visitante · portão 3</p><ul>${p.vivos.filter(b => b.lado === 'visitante').map(linhaDe).join('')}</ul>
      ${p.bondes.filter(b => !b.rua).map(b => `<p class="cj-aviso ruim">${esc(b.t.sigla)}: ${esc(b.erro || 'sem rota')}</p>`).join('')}
      ${p.rotaVelha ? `<p class="cj-aviso ruim">O ${esc(p.estadio.modelo.replace('estadio-', 'estádio de ') + ' mil')} mudou depois das rotas de dentro dele: dentro do estádio a torcida pode atravessar parede. Rode ferramentas/planta_html/rotas_estadios.mjs de novo.</p>` : ''}
      <p class="cj-pm"><b>A PM</b>: ${pmN.cordoes.length} cordão${pmN.cordoes.length === 1 ? '' : 'ões'} na divisa das zonas (a verde é do mandante, a vermelha do visitante), ${pmN.revistas.length} revista${pmN.revistas.length === 1 ? '' : 's'} e ${pmN.fechadas.length} rua${pmN.fechadas.length === 1 ? '' : 's'} fechada${pmN.fechadas.length === 1 ? '' : 's'} na borda dos arredores (${Math.round(p.raio)} m de rua em volta dos portões)${p.travessias.length ? `, ${p.travessias.length} travessia${p.travessias.length === 1 ? '' : 's'} na cidade` : ''}${p.longeDe.length && p.tAbre == null ? ` (o corredor do visitante foi traçado longe do ${esc(p.longeDe.map(n => n.toLowerCase()).join(' e do '))}, que ele deixava ilhado)` : ''} · ${nCord} PMs parados, ${p.escolta.length} na escolta do visitante · ${p.nGrades} grades.${p.tAbre != null ? ` O ${esc(p.portoesQueAbrem.map(n => n.toLowerCase()).join(' e o '))} fica no caminho do visitante (o mapa não deixa outro): a PM segura o corredor até o último visitante entrar e só às ${hora(p.tAbre)} abre a rua pro mandante.` : ''}</p>
      <p class="cj-aviso${(menor && menor.d < ENCONTRO) || p.travessias.some(v => v.folga < 60) ? ' ruim' : ''}">${encontroTxt(p)}</p>
      <div class="cj-ctrl">
        <button class="cen-bt" data-jogo="plano">Ver o plano</button>
        <button class="cen-bt" data-jogo="estadio">Ver o estádio</button>
        <select data-jogo="seguir" aria-label="Seguir uma torcida"><option value="">Seguir…</option>${p.vivos.map(b => `<option value="${esc(b.t.id)}"${seguir === b ? ' selected' : ''}>${esc(b.t.sigla)}</option>`).join('')}</select>
        <label><input type="checkbox" data-jogo="rotas"${verRotas ? ' checked' : ''}> Rotas e zonas</label>
      </div>
      <div class="cj-ctrl">
        ${p.pares.length > 1 ? `<select data-jogo="par" aria-label="O jogo">${p.pares.map((n, i) => `<option value="${i}"${i === p.par ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>` : ''}
        <button class="cen-bt" data-jogo="inverter">Inverter o mando</button>
        <select data-jogo="gente" aria-label="Quanta gente"><option value="0.5"${escolha.gente === 0.5 ? ' selected' : ''}>Pouca gente</option><option value="1"${escolha.gente === 1 ? ' selected' : ''}>Gente normal</option><option value="2"${escolha.gente === 2 ? ' selected' : ''}>Muita gente</option></select>
      </div>`;
    ligarPainel();
    atualizarPainel(true);
  }
  let ultimoPainel = 0;
  function atualizarPainel(ja) {
    if (!plano || plano.erro) return;
    const agora = performance.now();
    if (!ja && agora - ultimoPainel < 250) return;
    ultimoPainel = agora;
    const r = painel.querySelector('.cj-relogio'); if (r) r.textContent = hora(t);
    const lt = painel.querySelector('.cj-tempo'); if (lt && document.activeElement !== lt) lt.value = Math.round(t);
    for (const b of plano.vivos) {
      const el = painel.querySelector(`[data-bonde="${CSS.escape(b.t.id)}"]`);
      if (!el) continue;
      const lider = estadoDe(b, 0), ult = estadoDe(b, b.n - 1);
      let txt;
      if (lider === 'na sede') txt = 'Na porta da sede';
      else if (ult === 'no lugar') txt = `Todos no lugar, no setor ${b.setor}`;
      else if (b.dentroN > 0) txt = `Passando a catraca: ${b.dentroN} de ${b.n} dentro, ${b.noLugar} no lugar`;
      else if (lider === 'na fila') txt = 'Na fila do ' + b.portao.nome.toLowerCase();
      else if (lider === 'na revista') txt = 'Na revista da PM';
      else txt = `Andando: ${Math.round(plano.cabeca(b, t) / M)} de ${Math.round(b.comprimento)} m`;
      el.textContent = txt;
    }
    const bt = painel.querySelector('[data-jogo="toca"]');
    if (bt) { bt.textContent = rodando ? 'Pausar' : t >= plano.fimTudo ? 'De novo' : t > plano.inicio + 1 ? 'Continuar' : 'Começar'; bt.setAttribute('aria-pressed', String(rodando)); }
  }
  function ligarPainel() {
    for (const el of painel.querySelectorAll('[data-jogo]')) {
      const a = el.dataset.jogo;
      if (el.tagName === 'SELECT' || el.type === 'checkbox') el.onchange = () => acao(a, el);
      else el.onclick = () => acao(a, el);
    }
    for (const el of painel.querySelectorAll('[data-vezes]')) el.onclick = () => { vezes = +el.dataset.vezes; for (const o of painel.querySelectorAll('[data-vezes]')) o.setAttribute('aria-pressed', String(o === el)); };
    const lt = painel.querySelector('.cj-tempo');
    if (lt) lt.oninput = () => { t = +lt.value; atualizar(0); atualizarPainel(true); ctx.pedir(); };
  }
  function acao(a, el) {
    if (a === 'fechar') { fechar(); return; }
    if (!plano || plano.erro) { if (a === 'inverter' || a === 'par' || a === 'gente') refazer(a, el); return; }
    if (a === 'toca') {
      if (t >= plano.fimTudo) t = plano.inicio;
      rodando = !rodando;
      if (rodando && !seguir) verPlano();
    } else if (a === 'plano') { seguir = null; verPlano(); }
    else if (a === 'estadio') { seguir = null; verEstadio(); }
    else if (a === 'seguir') { seguir = plano.vivos.find(b => b.t.id === el.value) || null; if (seguir) { const d = seguir.gente[0].d; ctx.voarPara(d.x, d.y, 45 * M, 0.95, undefined, d.alt || 0); } }
    else if (a === 'rotas') { verRotas = el.checked; mostrarRotas(); }
    else refazer(a, el);
    atualizarPainel(true);
    ctx.pedir();
  }
  function refazer(a, el) {
    if (a === 'inverter') escolha.inverter = !escolha.inverter;
    if (a === 'par') { escolha.par = +el.value; escolha.inverter = false; }
    if (a === 'gente') escolha.gente = +el.value;
    rodando = false; seguir = null;
    montar(); mostrarRotas(); verPlano();
    ctx.pedir();
  }
  function mostrarRotas() {
    if (!plano || plano.erro) return;
    for (const f of plano.fitas) f.visible = verRotas;
    if (plano.chaoZonas) plano.chaoZonas.visible = verRotas;
  }
  /* a câmera: o plano todo (as sedes e o estádio), de cima */
  function verPlano() {
    const p = plano; if (!p || p.erro) return;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const b of p.vivos) for (const q of b.rua.pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[2]); z1 = Math.max(z1, q[2]); }
    const r = Math.max(x1 - x0, z1 - z0) / 2 + 30 * M;
    ctx.voarPara((x0 + x1) / 2, (z0 + z1) / 2, r / Math.tan(21 * Math.PI / 180) * 0.95, 1.2, 0);
  }
  function verEstadio() {
    const c = plano.centroEst;
    ctx.voarPara(c[0], c[2], 150 * M, 0.75, -0.6);
  }

  /* ======================================================
     O QUE O CENÁRIO CHAMA
     ====================================================== */
  function abrir() {
    painel.hidden = false;
    if (!plano) { if (!montar()) return; mostrarRotas(); verPlano(); }
    ctx.pedir();
  }
  function fechar() {
    painel.hidden = true; rodando = false; seguir = null;
    desmontar();
    ctx.aoFechar && ctx.aoFechar();
    ctx.pedir();
  }
  /* a cada quadro (dt de verdade) */
  function quadro(dt) {
    if (!plano || plano.erro) return;
    if (rodando) {
      t += dt * vezes;
      if (t >= plano.fimTudo + 30) { t = plano.fimTudo + 30; rodando = false; }
    }
    atualizar(dt);
    if (seguir) { const d = seguir.gente[0].d; ctx.seguirPonto(d.x, d.y, d.alt || 0); }
    atualizarPainel();
  }
  /* os rótulos, do tamanho de sempre na tela (mais longe, maior): depois
     que a câmera andou no quadro */
  const vRot = new THREE.Vector3(), caixas = [];
  function ajustarRotulos() {
    if (!grupo) return;
    const cam = ctx.cam, tg = Math.tan(cam.fov * Math.PI / 360);
    cam.updateMatrixWorld();
    const sprites = grupo.children.filter(o => o.isSprite).sort((a, b) => (a.userData.prio || 0) - (b.userData.prio || 0));
    caixas.length = 0;
    for (const o of sprites) {
      const dd = cam.position.distanceTo(o.position), k = clamp(dd / (110 * M), 0.5, 8);
      const w = o.scale.x / o.scale.y;
      o.scale.set(o.userData.alto * M * k * w, o.userData.alto * M * k, 1);
      /* quem cobre na tela um rótulo mais importante (a torcida, a revista, o cordão maior) some */
      vRot.copy(o.position).applyMatrix4(cam.matrixWorldInverse);
      const z = -vRot.z;
      if (z <= 0) { o.visible = true; continue; }
      vRot.copy(o.position).project(cam);
      const hh = o.scale.y / (2 * z * tg) * 1.1, hw = o.scale.x / (2 * z * tg * cam.aspect) * 1.05;
      const cx = vRot.x, cy = vRot.y;
      o.visible = !caixas.some(c => Math.abs(c[0] - cx) < c[2] + hw && Math.abs(c[1] - cy) < c[3] + hh);
      if (o.visible) caixas.push([cx, cy, hw, hh]);
    }
  }
  return {
    abrir, fechar, quadro, ajustarRotulos, J,
    get aberto() { return !painel.hidden; },
    get rodando() { return rodando; },
    get plano() { return plano; },
    /* pro teste: pula pra hora h (segundos do dia) e diz onde está cada um */
    irPara(h) { t = h; atualizar(0); atualizarPainel(true); ctx.pedir(); },
    estado() {
      if (!plano || plano.erro) return plano;
      return { hora: hora(t), t, inicio: plano.inicio, fim: plano.fimTudo, raio: plano.raio, tempos: plano.tempos, rotaVelha: plano.rotaVelha,
               menor: plano.menor && { d: plano.menor.d, t: plano.menor.t, a: plano.menor.a && plano.menor.a.t.sigla, b: plano.menor.b && plano.menor.b.t.sigla },
               pm: { cordoes: plano.pm.cordoes.length, revistas: plano.pm.revistas.length, fechadas: plano.pm.fechadas.length, pms: policiais.length, grades: plano.nGrades },
               longeDe: plano.longeDe, tentativas: plano.tentativas, abre: plano.tAbre != null ? hora(plano.tAbre) : null,
               travessias: plano.travessias.map(v => ({ antes: v.antes.map(b => b.t.sigla).join('+'), depois: v.depois.map(b => b.t.sigla).join('+'), d: Math.round(v.d), libera: hora(v.libera), chega: hora(v.chega), folga: Math.round(v.folga / 60) })),
               bondes: plano.vivos.map(b => ({ sigla: b.t.sigla, lado: b.lado, escalao: b.escalao, setor: b.setor, portao: b.portao.nome, n: b.n, m: Math.round(b.comprimento), sai: hora(b.sai), chega: hora(b.chega), fim: hora(b.fim), adiantou: b.adiantou || 0, esperou: b.esperou || 0,
                                             estado: estadoDe(b, 0) + ' / ' + estadoDe(b, b.n - 1), dentro: b.dentroN, noLugar: b.noLugar })),
               erros: plano.bondes.filter(b => !b.rua).map(b => b.t.sigla + ': ' + (b.erro || '')) };
    },
    limpar() { rodando = false; seguir = null; desmontar(); painel.hidden = true; }
  };
}
