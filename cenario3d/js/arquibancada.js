/* =========================================================
   A ARQUIBANCADA VIVA E A BRIGA NO ESTÁDIO — o dia de jogo (28/09/2026)
   ---------------------------------------------------------
   O dono: "crie a animação da faixa e bandeira sendo estendida por dois
   membros assim que a torcida chega no estádio, animação de bandeiras de
   bambu balançando na arquibancada e na caminhada (exemplo na foto em
   anexo), de tamanho 4x4m que tradicionalmente vão pra arquibancada,
   movimento de bateria de torcida com quantidade padrão por nível de
   sede, alguns torcedores vão tocar na arquibancada, e um puxador que
   fica de costas pro jogo virado pra torcida, incentivando a galera a
   cantar. Além dessas animações de arquibancada, uma torcida pode optar
   por atacar outra dentro do estádio, tentando quebrar a grade pra
   acessar o rival seja pela arquibancada ou pelos corredores do estádio.
   Polícia tenta impedir fazendo cordão de isolamento."

   Tudo sai do plano do dia de jogo (dia_de_jogo.js): a vaga de cada um
   (o fim do caminho de dentro dele, rotas_estadios.js) e a ARQUIBANCADA
   DO MODELO (estadios3d.js, pela planta: `estadios()[].geo`) — os
   pedaços de cada setor (a arquibancada, o u de cada ponta, as
   fileiras) e as DIVISÓRIAS, o gradil entre as torcidas: o da
   arquibancada (da mureta da frente ao corredor de cima) e o do corredor
   de baixo (do chão ao teto). O u é a posição ao longo do anel (no de 20
   e no de 40, de 0 a 9 e fecha; no de 10, a arquibancada do norte vai
   de 0 a 1); a fileira k conta da frente (a mureta) pra cima.

   OS PAPÉIS de cada torcida (os bonecos que chegam no estádio):
   - o PUXADOR: o primeiro do bonde (o da frente, o do rótulo). Chega no
     lugar e vai pra frente da torcida — na fileira de baixo da dela ou,
     se ela ocupa a da frente, em cima da mureta, no meio da faixa —, de
     COSTAS PRO JOGO e de frente pra ela, regendo o canto (`puxador` de
     bonecos3.js: os dois braços no alto no tempo do canto);
   - a FAIXA e a BANDEIRA: os dois que chegam primeiro (e os dois
     seguintes, com 8 ou mais bonecos) levam o pano enrolado no ombro
     desde a sede (um deles); no estádio descem até a mureta da frente, no
     meio da torcida, e andam cada um pro seu lado com uma ponta do pano,
     que vai desenrolando entre eles (o pano no alto, nas mãos, com a
     parte de baixo já caindo por cima da mureta); na ponta, soltam: o
     pano desce e fica pendurado na mureta, virado pro campo (a faixa de
     1,6 m, como a do setor no modelo; a bandeira quadrada com o escudo,
     do tamanho que a mureta deixa até o chão da frente). A cara é a
     régua do jogo (js/gestao/patrimonio.js): fundo na cor primária,
     letra e borda na secundária, o escudo da torcida à esquerda do nome
     e o do clube à direita; a bandeira com o escudo no meio. Depois
     voltam pro lugar;
   - a BATERIA: BATERIA_POR_NIVEL bonecos pelo nível da sede (de 2 no
     ponto de encontro a 12 no complexo), no máximo um quarto da
     torcida; os do lugar mais perto do meio da torcida (uma fileira pra
     cima), com surdo (três em dez, os do meio), repique (dois em dez, os
     da ponta) e caixa. Tocam desde a sede, na caminhada e na
     arquibancada, e o instrumento vai no corpo;
   - os BANDEIRÕES DE BAMBU (a foto do dono): pano de 4 × 4 m num bambu
     de 6 m, um pra cada dez bonecos (de 1 a 4). O pano é de verdade
     (partículas presas no bambu, com gravidade, vento e as ligações
     entre elas) e o bambu vai de um lado pro outro, no oito, nas duas
     mãos de quem leva (`mastro` de bonecos3.js, com o mesmo ângulo);
     na sede, na caminhada e no lugar (os do alto da torcida, espalhados);
   - o resto CANTA JUNTO: palma, braço, pulo, no tempo da torcida (o
     `gestoParam` de bonecos3.js: o ritmo e a fase da torcida inteira,
     que é o da bateria dela).

   A BRIGA NO ESTÁDIO. Entre o visitante e o mandante o estádio tem o
   ISOLAMENTO: um setor vazio da PM entre duas divisórias (o setor `pm`
   de estadios3d.js), na arquibancada e no corredor de baixo. A PM deixa
   GUARDAS lá dentro (três na arquibancada, dois no corredor, tirados do
   efetivo do jogo antes dos postos de fora). Uma torcida que não brigou
   na rua pode tentar INVADIR: ela escolhe (a chance é 40% da de
   procurar na rua a rival que está do outro lado do isolamento; sem
   rival dela ali, sozinha ela não vai) e o caminho — PELA
   ARQUIBANCADA (a divisória do isolamento mais perto dela, andando nas
   fileiras sem passar em poço de vomitório) ou PELO CORREDOR (desce pelo
   vomitório dela, o caminho de entrada ao contrário, e anda no corredor
   até o gradil). Uma por jogo, depois da bola rolar (MIN_ATAQUE).
   A invasão: uns 60% dela (a linha de frente; a bateria, os bandeirões
   e quem estendeu o pano ficam) corre pra grade e EMPURRA (EMPURRA s: a
   grade balança); a grade CEDE e cai pro lado do isolamento. A PM faz o
   CORDÃO DE ISOLAMENTO: os guardas daquele isolamento e o REFORÇO — os
   PMs da revista, que ficaram livres quando a última torcida entrou —
   entram (pela frente da arquibancada, vindo do campo, ou pela porta de
   serviço do corredor) e fecham o isolamento de fileira a fileira (ou
   de parede a parede), de escudo, a 2,2 m da grade. Pancada no cordão
   (CONFRONTO s). Aí:
   - A PM SEGURA (o mais comum): a torcida volta pro lugar, fica gente no
     chão e presa (rendida, de mão na cabeça, levada pra frente do
     isolamento), e o cordão fica na grade quebrada até o fim;
   - A TORCIDA FURA O CORDÃO: a chance é a força dela (a gente × a ficha
     média) contra a do cordão (FICHA_PM por PM): até 45%. Ela passa, a
     PM recua, e ela quebra a segunda grade; a frente da rival (se ela
     está do outro lado, perto) já estava lá, e é pancada entre as duas
     (a tabela de baixas das brigas de IA, BAIXAS, como a da rua) até a
     PM se juntar de novo no meio e separar.
   O painel pode mandar ("Ninguém invade", "Invade pela arquibancada",
   "Invade pelo corredor"; "A PM segura", "A torcida fura o cordão").
   No de 10 mil o mandante fica na outra arquibancada: sozinho o
   visitante não tenta; mandado pelo painel, ele vai, mas do outro lado
   do isolamento não tem ninguém.

   Tudo é conta da hora do jogo (voltar a régua volta a cena); o pano
   dos bandeirões e o balanço das grades correm no relógio de verdade.
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

export const BATERIA_POR_NIVEL = [2, 3, 4, 6, 8, 10, 12];
const ANDA = 1.1;          // m/s: andando na arquibancada (até a mureta, de volta pro lugar)
const DESENROLA = 0.5;     // m/s: cada um andando pro seu lado com a ponta do pano
const PENDURA = 3.0;       // s: o pano passa por cima da mureta e fica
const CORRE = 2.8;         // m/s: a invasão
const EMPURRA = 15;        // s empurrando a grade até ela ceder
const CONFRONTO = 24;      // s de pancada no cordão da PM
const CONTRA = 18;         // s de pancada com a rival, quando fura
const FICHA_PM = 14;       // a força de um PM no cordão (escudo, cassetete, treino), na régua da ficha das torcidas
const H_FAIXA = 1.6;       // m: a faixa (a do setor em estadios3d.js tem a mesma altura)
const GUARDA_ARQ = 3, GUARDA_COR = 2;   // os guardas de cada isolamento: na arquibancada e no corredor de baixo
const MIN_ATAQUE = 4 * 60; // s depois da bola rolar: a invasão
const MAX_ATAQUE = 24;     // bonecos na invasão, no máximo (a cena fica legível)

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const liso = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
function semente(txt) {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) h = Math.imul(h ^ txt.charCodeAt(i), 16777619);
  return () => { h = h + 0x6D2B79F5 | 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/* ======================================================
   A TRILHA NO TEMPO de quem se mexe (a pessoa, o PM): pontos do mundo
   com a hora de chegar em cada um, em reta entre eles; `modo`, o que ele
   faz em cada trecho (anda, corre, empurra, briga, preso...), `olha`
   pra onde fica virado (um ponto do mundo, ou nada: pra onde anda)
   ====================================================== */
function Trilho(t0, P0) { return { ts: [t0], P: [P0], modo: [], olha: [], alvo: [] }; }
const fimDe = tr => tr.ts[tr.ts.length - 1];
/* anda pelos pontos a `vel` m/s (M: unidades por metro) */
function vai(tr, pts, vel, M, modo = 'anda', olha = null) {
  let t = fimDe(tr), a = tr.P[tr.P.length - 1];
  for (const q of pts) {
    const d = Math.hypot(q[0] - a[0], q[2] - a[2], (q[1] - a[1]) * 0.6) / M;
    if (d < 1e-3) continue;
    t += d / vel; tr.ts.push(t); tr.P.push(q); tr.modo.push(modo); tr.olha.push(olha); tr.alvo.push(null); a = q;
  }
  return t;
}
/* anda pelos pontos chegando no último na hora `ate` */
function vaiAte(tr, pts, ate, modo = 'anda', olha = null) {
  let a = tr.P[tr.P.length - 1], L = 0;
  const ls = pts.map(q => { const d = Math.hypot(q[0] - a[0], q[2] - a[2], q[1] - a[1]); a = q; L += d; return L; });
  const t0 = fimDe(tr), dur = Math.max(0.05, ate - t0);
  pts.forEach((q, i) => { if (L > 0 && ls[i] - (i ? ls[i - 1] : 0) < 1e-6) return; tr.ts.push(t0 + dur * (L > 0 ? ls[i] / L : (i + 1) / pts.length)); tr.P.push(q); tr.modo.push(modo); tr.olha.push(olha); tr.alvo.push(null); });
}
/* fica parado até a hora `ate` */
function fica(tr, ate, modo, olha = null, alvo = null) {
  const t = fimDe(tr);
  if (ate <= t + 1e-6) return;
  tr.ts.push(ate); tr.P.push(tr.P[tr.P.length - 1]); tr.modo.push(modo); tr.olha.push(olha); tr.alvo.push(alvo);
}
/* onde está na hora t: {x, y, z, modo, olha, alvo, anda, dx, dz} */
function ondeNo(tr, t, o) {
  const ts = tr.ts, n = ts.length;
  let lo = 0, hi = n - 1, f = 0;
  if (t <= ts[0] || n < 2) { hi = lo = 0; }
  else if (t >= ts[n - 1]) { lo = hi = n - 1; }
  else { while (hi - lo > 1) { const md = (lo + hi) >> 1; if (ts[md] <= t) lo = md; else hi = md; } f = (t - ts[lo]) / Math.max(1e-9, ts[hi] - ts[lo]); }
  const a = tr.P[lo], b = tr.P[hi], seg = Math.min(lo, n - 2);
  o.x = a[0] + (b[0] - a[0]) * f; o.y = a[1] + (b[1] - a[1]) * f; o.z = a[2] + (b[2] - a[2]) * f;
  o.modo = seg >= 0 && n > 1 ? tr.modo[t >= ts[n - 1] ? n - 2 : seg] : null;
  o.olha = seg >= 0 && n > 1 ? tr.olha[t >= ts[n - 1] ? n - 2 : seg] : null;
  o.alvo = seg >= 0 && n > 1 ? tr.alvo[t >= ts[n - 1] ? n - 2 : seg] : null;
  o.anda = lo !== hi && (a[0] !== b[0] || a[2] !== b[2]);
  o.dx = b[0] - a[0]; o.dz = b[2] - a[2];
  o.acabou = t >= ts[n - 1];
  return o;
}

/* ======================================================
   O PLANO: a vaga e o papel de cada um, o pano, a bateria, os
   bandeirões, o puxador, os guardas do isolamento e a invasão
   ====================================================== */
export function planejarArquibancada(p, aux) {
  const { M, BOLA, DENTRO, FATOR = 2, sorte, fichaMedia, chanceDe, escolha = {}, efetivo = 0, revistas = 0, BAIXAS, CHANCE_FAVORITO = 0.7, brigas = [] } = aux;
  const est = p.estadio, geo = est && est.geo;
  if (!geo || !geo.setores || !geo.setores.length) return null;
  const th = -est.giro * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const W = (x, y, z) => p.mundo(x, y, z);
  const modelo = (x, y, z) => { const a = (x - est.centro[0]) / M, c = (z - est.centro[1]) / M; return [a * cs - c * sn, (y - 0.02 * M) / M, a * sn + c * cs]; };
  const dirW = (vx, vz) => [vx * cs + vz * sn, -vx * sn + vz * cs];
  const rumoDe = (vx, vz) => { const [x, z] = dirW(vx, vz); return Math.atan2(x, z); };
  const setor = id => geo.setores.find(s => s.id === id) || null;
  const fechadoF = fam => !!fam.fechado;
  const fechado = A => fechadoF(A.fam);
  /* a distância em u de `de` até `ate` andando pro lado s (no anel que fecha, dá a volta; na arquibancada aberta, null se é pro outro lado) */
  const perto = (fam, u, ref) => { if (!fechadoF(fam)) return u; while (u < ref - 4.5) u += 9; while (u > ref + 4.5) u -= 9; return u; };
  const distUf = (fam, de, ate, s) => { if (fechadoF(fam)) return ((((ate - de) * s) % 9) + 9) % 9; const d = (ate - de) * s; return d >= -1e-6 ? Math.max(0, d) : null; };
  const naFileira = (A, u, k, dy = 0) => { const q = A.ponto(u, k, dy); return W(q[0], q[1], q[2]); };
  const mPorU = (fam, u, d) => { const e = 1e-3, a = fam.ponto(d, u - e), b = fam.ponto(d, u + e); return Math.hypot(b[0] - a[0], b[1] - a[1]) / (2 * e) || 1; };
  const dFileira = (A, k) => A.c.d0 + k * A.c.prof + A.c.prof / 2;
  /* metros andando de u1 a u2 no anel d */
  const metros = (fam, d, u1, u2) => { const n = Math.max(2, Math.ceil(Math.abs(u2 - u1) / 0.004)); let L = 0, a = fam.ponto(d, u1); for (let i = 1; i <= n; i++) { const b = fam.ponto(d, u1 + (u2 - u1) * i / n); L += Math.hypot(b[0] - a[0], b[1] - a[1]); a = b; } return L; };
  /* O QUE NÃO SE PISA na arquibancada: o poço de cada vomitório (as
     fileiras k0 a k1 no trecho dele) e os cortes (a arquibancada inteira) */
  const obstDe = new WeakMap();
  const obst = A => { let o = obstDe.get(A); if (!o) { o = [...(A.vomitorios || []).map(v => ({ ua: v.ua, ub: v.ub, k0: v.k0, k1: v.k1 })), ...((A.c && A.c.cortes) || []).map(c => ({ ua: c.ua, ub: c.ub, k0: 0, k1: A.n }))]; obstDe.set(A, o); } return o; };
  const naU = (A, e, u) => fechado(A) ? [u, u - 9, u + 9, u - 18, u + 18].some(x => x > e.ua && x < e.ub) : u > e.ua && u < e.ub;
  const cruzaU = (A, e, lo, hi) => [0, -9, 9, -18, 18].some(o => (fechado(A) || !o) && e.ub + o > lo && e.ua + o < hi);
  const livreV = (A, u, ka, kb) => !obst(A).some(e => naU(A, e, u) && Math.max(ka, kb) >= e.k0 - 0.5 && Math.min(ka, kb) <= e.k1 + 0.5);
  const livreH = (A, k, ua, ub) => !obst(A).some(e => k >= e.k0 - 0.5 && k <= e.k1 + 0.5 && cruzaU(A, e, Math.min(ua, ub), Math.max(ua, ub)));
  /* o caminho na arquibancada de [u, k] até [u, k]: fileira e trecho em
     cotovelo (primeiro sobe/desce na coluna, depois anda na fileira, ou
     o contrário), por onde não tem poço; senão por uma coluna do meio */
  function rotaNaArq(A, a, b) {
    const [ua, ka] = a, [ub, kb] = b;
    if (livreV(A, ua, ka, kb) && livreH(A, kb, ua, ub)) return [a, [ua, kb], b];
    if (livreH(A, ka, ua, ub) && livreV(A, ub, ka, kb)) return [a, [ub, ka], b];
    for (let i = 1; i < 24; i++) { const uw = ua + (ub - ua) * i / 24; if (livreH(A, ka, ua, uw) && livreV(A, uw, ka, kb) && livreH(A, kb, uw, ub)) return [a, [uw, ka], [uw, kb], b]; }
    return [a, b];
  }
  /* os pontos do mundo de uma rota [u, k] (um a cada 60 cm, no máximo) */
  function pontosNaArq(A, wps) {
    const out = [];
    for (let i = 0; i < wps.length - 1; i++) {
      const [u0, k0] = wps[i], [u1, k1] = wps[i + 1];
      const L = Math.abs(u1 - u0) * mPorU(A.fam, (u0 + u1) / 2, dFileira(A, (k0 + k1) / 2)) + Math.abs(k1 - k0) * 0.6;
      const n = Math.max(1, Math.ceil(L / 0.6));
      for (let j = i ? 1 : 0; j <= n; j++) { const f = j / n; out.push(naFileira(A, u0 + (u1 - u0) * f, k0 + (k1 - k0) * f)); }
    }
    return out;
  }
  const comprimento = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]); return L / M; };
  /* o u e a fileira de uma vaga (modelo) no pedaço P do setor */
  function ukNaPeca(P, v) {
    const A = P.A, c = A.c;
    const k = clamp(Math.round((v[1] - c.y0) / c.esp), 0, A.n - 1), d = dFileira(A, k);
    const u0 = P.ua - 0.05, u1 = P.ub + 0.05, n = Math.max(24, Math.ceil((u1 - u0) / 0.004));
    let best = P.ua, e = Infinity;
    for (let i = 0; i <= n; i++) { const u = u0 + (u1 - u0) * i / n, q = A.fam.ponto(d, u), ev = (q[0] - v[0]) ** 2 + (q[1] - v[2]) ** 2; if (ev < e) { e = ev; best = u; } }
    for (let h = (u1 - u0) / n; h > 1e-6; h /= 2) for (const s of [-1, 1]) { const u = best + s * h, q = A.fam.ponto(d, u), ev = (q[0] - v[0]) ** 2 + (q[1] - v[2]) ** 2; if (ev < e) { e = ev; best = u; } }
    return { u: best, k, e: Math.sqrt(e) + Math.abs(v[1] - (c.y0 + k * c.esp)) };
  }

  /* ---------- A TORCIDA NO LUGAR: o pedaço, o u e a fileira de cada um ---------- */
  const lista = [], porBonde = new Map();
  for (const b of p.vivos) {
    const S = setor(b.setor);
    const gente = b.pessoas.filter(g => !g.fora && g.dentro && g.dentro.pts.length);
    if (!S || !S.pecas || !gente.length) continue;
    const vm = gente.map(g => { const q = g.dentro.pts[g.dentro.pts.length - 1]; return modelo(q[0], q[1], q[2]); });
    let P = null, uks = null, erro = Infinity;
    for (const pc of S.pecas) {
      const r = vm.map(v => ukNaPeca(pc, v)), e = r.reduce((s, x) => s + x.e, 0) / r.length;
      if (e < erro) { erro = e; P = pc; uks = r; }
    }
    if (!P || erro > 1.2) continue;
    const A = P.A, n = b.n;
    const T = { b, A, P, gente, uk: new Array(n).fill(null), vaga: new Array(n).fill(null), chegada: new Float64Array(n).fill(Infinity),
                papel: new Array(n).fill(null), inst: new Array(n).fill(null), trilhos: new Array(n).fill(null), band: [], faixa: null, bandeira: null, puxador: null };
    gente.forEach((g, i) => { T.uk[g.m] = uks[i]; T.vaga[g.m] = g.dentro.pts[g.dentro.pts.length - 1]; T.chegada[g.m] = g.passa + g.dentro.L / (DENTRO * M); });
    const us = uks.map(x => x.u).sort((a, c) => a - c), ks = uks.map(x => x.k).sort((a, c) => a - c);
    T.uLo = us[0]; T.uHi = us[us.length - 1]; T.uC = us[us.length >> 1];
    T.kMin = ks[0]; T.kMax = ks[ks.length - 1]; T.kMed = ks[ks.length >> 1];
    /* o canto da torcida: o tempo (1,5 a 1,7 palma por segundo) e a fase de todo mundo dela */
    const rnd = semente('canto|' + b.t.id);
    T.canto = { ritmo: 4.9 + rnd() * 1.1, fase: rnd() * 6.28 };
    lista.push(T); porBonde.set(b, T);
  }
  if (!lista.length) return null;

  /* ---------- OS PAPÉIS ---------- */
  const ocupado = new Map();     // a arquibancada → os trechos da mureta já com pano
  /* o lugar na mureta pra um pano de `w` m, o mais perto de uRef: dentro
     do pedaço do setor (a 0,8 m das pontas), fora das bocas que abrem na
     frente (o vomitório que desce até a frente, a passagem pro campo, o
     corte) e dos outros panos */
  function lugarNaMureta(T, w, uRef) {
    const A = T.A, P = T.P, d0 = A.c.d0, mU = mPorU(A.fam, uRef, d0), du = w / mU, margem = 0.8 / mU;
    const abertos = [...(A.vomitorios || []).filter(v => v.k0 === 0), ...((A.c.aberturas) || []), ...((A.c.cortes) || [])];
    const outros = ocupado.get(A) || [];
    const livre = (ua, ub) => ua >= P.ua + margem && ub <= P.ub - margem && !abertos.some(e => cruzaU(A, e, ua - 0.2 / mU, ub + 0.2 / mU)) && !outros.some(e => cruzaU(A, e, ua - 0.4 / mU, ub + 0.4 / mU));
    for (let i = 0; i < 600; i++) {
      const uc = uRef + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.1 / mU;
      if (!livre(uc - du / 2, uc + du / 2)) continue;
      outros.push({ ua: uc - du / 2, ub: uc + du / 2 }); ocupado.set(A, outros);
      return { uc, du, w, mU };
    }
    return null;
  }
  /* A FAIXA (ou a bandeira) ESTENDIDA: os dois descem até a mureta no
     meio do pano, andam cada um pra uma ponta desenrolando e soltam */
  function estender(T, quem, lugar, H, tipo) {
    const A = T.A, k0 = 0;
    const centro = [lugar.uc, k0], pontas = [[lugar.uc - lugar.du / 2 + 0.35 / lugar.mU, k0], [lugar.uc + lugar.du / 2 - 0.35 / lugar.mU, k0]];
    const tIni = Math.max(...quem.map(m => T.chegada[m])) + 1.0;
    const idas = quem.map(m => pontosNaArq(A, rotaNaArq(A, [T.uk[m].u, T.uk[m].k], centro)));
    const tJunta = tIni + Math.max(...idas.map(comprimento)) / ANDA + 0.8;
    const tAberta = tJunta + Math.max(2, (lugar.w / 2 - 0.35) / DESENROLA);
    const tSolta = tAberta + PENDURA;
    /* virados pro campo (a mureta) enquanto seguram o pano */
    const q = A.fam.ponto(A.c.d0 - 3, lugar.uc), campo = W(q[0], A.c.y0, q[1]);
    quem.forEach((m, i) => {
      const tr = Trilho(tIni, T.vaga[m]);
      vai(tr, idas[i], ANDA, M, 'anda');
      fica(tr, tJunta, 'estende', campo);
      vaiAte(tr, pontosNaArq(A, [centro, pontas[i]]).slice(1), tAberta, 'estende', campo);
      fica(tr, tSolta, 'estende', campo);
      vai(tr, pontosNaArq(A, rotaNaArq(A, pontas[i], [T.uk[m].u, T.uk[m].k])).slice(1), ANDA, M, 'anda');
      T.trilhos[m] = tr; T.papel[m] = tipo;
    });
    return { tipo, uc: lugar.uc, du: lugar.du, w: lugar.w, mU: lugar.mU, H, quem, tIni, tJunta, tAberta, tSolta };
  }
  for (const T of lista) {
    const b = T.b, A = T.A, n = T.gente.length, rnd = semente('papeis|' + b.t.id);
    const livres = new Set(T.gente.map(g => g.m).filter(m => m !== 0 && !b.daEscolta[m]));
    const tomar = m => { livres.delete(m); return m; };
    const maisPerto = (alvo, k) => [...livres].sort((x, y) => dist3(T.vaga[x], alvo) - dist3(T.vaga[y], alvo)).slice(0, k);
    /* a bateria, pelo nível da sede */
    const nivel = clamp(Math.round(b.t.nivel ?? 1), 0, BATERIA_POR_NIVEL.length - 1);
    const nBat = n >= 6 ? Math.max(2, Math.min(BATERIA_POR_NIVEL[nivel], Math.floor(n / 4))) : 0;
    const bat = maisPerto(naFileira(A, T.uC, clamp(T.kMed + 1, T.kMin, T.kMax)), nBat);
    const nSurdo = bat.length ? Math.max(1, Math.round(bat.length * 0.3)) : 0, nRep = bat.length >= 3 ? Math.max(1, Math.round(bat.length * 0.2)) : 0;
    bat.forEach((m, i) => { tomar(m); T.papel[m] = 'bateria'; T.inst[m] = i < nSurdo ? 'surdo' : i >= bat.length - nRep ? 'repique' : 'caixa'; });
    T.nivel = nivel;
    /* os bandeirões: espalhados no alto da torcida, um a cada 14 bonecos
       (de 1 a 3: o pano tem 4 m, e mais que isso num bloco de 10 m embola),
       a 3,5 m ou mais um do outro quando dá */
    const nBand = n >= 8 ? clamp(Math.round(n / 14), 1, 3) : 0;
    const bandPos = [];
    for (let j = 0; j < nBand; j++) {
      const u = T.uLo + (T.uHi - T.uLo) * (j + 0.5) / nBand, alvo = naFileira(A, u, clamp(T.kMax - 1, T.kMin, T.kMax));
      const longe = [...livres].filter(x => bandPos.every(q => dist3(T.vaga[x], q) >= 3.5 * M));
      const m = (longe.length ? longe : [...livres]).sort((x, y) => dist3(T.vaga[x], alvo) - dist3(T.vaga[y], alvo))[0];
      if (m == null) break;
      bandPos.push(T.vaga[m]);
      tomar(m); T.papel[m] = 'bandeirao';
      T.band.push({ m, j, fase: rnd() * 6.28, amp: 0.75 + rnd() * 0.25, periodo: 2.0 + rnd() * 0.8, param: { a: 0 } });
    }
    /* quem estende o pano: os que chegam primeiro */
    const ordem = [...livres].sort((x, y) => T.chegada[x] - T.chegada[y]);
    const cF = n >= 4 ? ordem.slice(0, 2) : [], cB = n >= 8 ? ordem.slice(2, 4) : [];
    const yPar = A.c.y0 + (A.c.par || 1), yChao = A.c.yChao ?? A.c.yBase ?? 0;
    if (cF.length === 2) {
      let lugar = null;
      for (let w = clamp(3.5 + 0.18 * n, 4.5, 11); w >= 3.5 && !lugar; w -= 1) lugar = lugarNaMureta(T, w, T.uC);
      if (lugar) { T.faixa = estender(T, cF, lugar, Math.min(H_FAIXA, yPar - 0.1 - yChao - 0.15), 'faixa'); cF.forEach(tomar); }
    }
    if (cB.length === 2) {
      const Hb = clamp(yPar - 0.1 - yChao - 0.2, 1.2, 2.2);
      const perto = T.faixa ? T.faixa.uc + (T.faixa.du / 2 + (Hb / 2 + 0.6) / T.faixa.mU) * (rnd() < 0.5 ? -1 : 1) : T.uC;
      const lugar = lugarNaMureta(T, Hb, perto);
      if (lugar) { T.bandeira = estender(T, cB, lugar, Hb, 'bandeira'); cB.forEach(tomar); }
    }
    /* o puxador: na frente da torcida, de costas pro jogo */
    const up = T.faixa ? T.faixa.uc : T.uC, nq = A.fam.ponto(A.c.d0, up);
    let spot, cima = false, kP;
    if (T.kMin >= 2 && livreV(A, up, T.kMin - 1, T.kMin - 1)) { kP = T.kMin - 1; spot = naFileira(A, up, kP); }
    else { const q = A.fam.ponto(A.c.d0 - 0.1, up); spot = W(q[0], yPar, q[1]); cima = true; kP = 0; }
    T.papel[0] = 'puxador';
    if (T.vaga[0]) {
      const tr = Trilho(T.chegada[0] + 1.5, T.vaga[0]), rota = pontosNaArq(A, rotaNaArq(A, [T.uk[0].u, T.uk[0].k], [up, kP]));
      if (cima) rota.push(spot);
      vai(tr, rota.slice(1), ANDA, M, 'anda');
      fica(tr, fimDe(tr) + 0.5, 'puxador');
      T.trilhos[0] = tr;
    }
    T.puxador = { m: 0, u: up, spot, cima, rumo: rumoDe(nq[2], nq[3]) };
  }

  /* ---------- O ISOLAMENTO: os pedaços do setor da PM e as divisórias deles ---------- */
  const divs = geo.divisorias || [];
  const igualU = (fam, x, y) => Math.abs(x - y) < 2e-3 || (fechadoF(fam) && Math.abs(Math.abs(x - y) - 9) < 2e-3);
  const pmPecas = (setor('pm') || { pecas: [] }).pecas || [];
  const buffers = pmPecas.map((P, i) => {
    const A = P.A, de = (tipo, u) => divs.findIndex(d => d.tipo === tipo && d.fam === A.fam && igualU(A.fam, d.u, u));
    const arq = [de('arquibancada', P.ua), de('arquibancada', P.ub)], cor = [de('corredor', P.ua), de('corredor', P.ub)];
    const B = { i, A, ua: P.ua, ub: P.ub, um: (P.ua + P.ub) / 2, arq: arq[0] >= 0 && arq[1] >= 0 ? arq : null, cor: cor[0] >= 0 && cor[1] >= 0 ? cor : null, guardas: [] };
    return B;
  });
  /* OS GUARDAS de cada isolamento, do efetivo do jogo (depois da revista;
     no máximo 30% do que sobra dela — o resto vai pros postos de fora):
     na arquibancada, na coluna do meio, em fileiras espalhadas, olhando o
     campo; no corredor, atravessados, olhando pro visitante */
  const estacoes = [];
  for (const B of buffers) {
    const A = B.A, n = A.n;
    if (B.arq) for (const k of [2, Math.round(n / 2), n - 3].slice(0, GUARDA_ARQ)) {
      const kk = clamp(k, 0, n - 1);
      if (!livreV(A, B.um, kk, kk)) continue;
      const P0 = naFileira(A, B.um, kk), q = A.fam.ponto(A.c.d0, B.um);
      estacoes.push({ B, via: 'arquibancada', P: P0, uk: [B.um, kk], rumo: rumoDe(-q[2], -q[3]) });
    }
    if (B.cor) {
      const dv = divs[B.cor[0]], w = dv.dF - dv.dI;
      for (const f of [0.35, 0.65].slice(0, GUARDA_COR)) {
        const q = dv.fam.ponto(dv.dI + w * f, B.um), q2 = dv.fam.ponto(dv.dI + w * f, B.um + 0.01);
        estacoes.push({ B, via: 'corredor', P: W(q[0], dv.y, q[1]), uk: [B.um, dv.dI + w * f], rumo: Math.atan2(...dirW(q2[0] - q[0], q2[1] - q[1])) });
      }
    }
  }
  const sobra = Math.max(0, efetivo - revistas);
  const nGuardas = Math.min(estacoes.length, Math.floor(sobra * 0.3));
  /* (um de cada isolamento primeiro, na arquibancada; depois o resto na ordem) */
  const ordemEst = estacoes.map((e, i) => ({ e, i, r: buffers.indexOf(e.B) + (e.via === 'corredor' ? 0.5 : 0) + estacoes.slice(0, i).filter(x => x.B === e.B && x.via === e.via).length * buffers.length }))
    .sort((a, c) => a.r - c.r).slice(0, nGuardas).map(x => x.e);
  for (const e of ordemEst) e.B.guardas.push(e);

  /* ---------- A INVASÃO ---------- */
  /* os níveis de corredor com gradil (a altura do piso, as paredes) */
  const niveis = [];
  divs.forEach((d, i) => {
    if (d.tipo !== 'corredor') return;
    let L = niveis.find(l => l.fam === d.fam && Math.abs(l.y - d.y) < 0.05 && Math.abs(l.dI - d.dI) < 0.05);
    if (!L) niveis.push(L = { y: d.y, dI: d.dI, dF: d.dF, fam: d.fam, divs: [] });
    L.divs.push(i);
  });
  /* A SAÍDA DO CORREDOR de cada torcida: o último ponto do caminho do
     setor (o de entrada, rotas_estadios.js) que está num corredor com
     gradil, antes de subir o vomitório */
  for (const T of lista) {
    T.saida = null;
    const cam = T.b.S.caminho || [];
    for (let i = cam.length / 3 - 1; i >= 0 && !T.saida; i--) {
      const x = cam[3 * i], y = cam[3 * i + 1], z = cam[3 * i + 2];
      for (const L of niveis) {
        if (Math.abs(y - L.y) > 0.45) continue;
        const d = L.fam.dDe(x, z);
        if (d < L.dI - 0.3 || d > L.dF + 0.3) continue;
        T.saida = { L, u: L.fam.uDe(x, z).u, d: clamp(d, L.dI + 0.9, L.dF - 0.9), P: W(x, y, z) };
        break;
      }
    }
  }
  /* A SAÍDA DO CORREDOR NO CAMINHO DE CADA UM (o vértice do caminho de
     entrada dele, do fim pro começo, que ainda está no corredor do nível
     L): {k (o índice), u, d}, ou null (ele não passa nesse corredor) */
  const saidaDe = (T, m, L) => {
    const pts = T.b.pessoas[m].dentro.pts;
    for (let i = pts.length - 1; i >= 0; i--) {
      const v = modelo(pts[i][0], pts[i][1], pts[i][2]);
      if (Math.abs(v[1] - L.y) > 0.45) continue;
      const d = L.fam.dDe(v[0], v[2]);
      if (d < L.dI - 0.3 || d > L.dF + 0.3) continue;
      return { k: i, u: L.fam.uDe(v[0], v[2]).u, d: clamp(d, L.dI + 0.9, L.dF - 0.9) };
    }
    return null;
  };
  function candidatosArq(T) {
    const A = T.A, out = [];
    for (const s of [-1, 1]) {
      const ref = s > 0 ? T.uHi : T.uLo;
      let mel = null;
      for (const B of buffers) if (B.A === A && B.arq) { const du = distUf(A.fam, ref, s > 0 ? B.ua : B.ub, s); if (du != null && (!mel || du < mel.du)) mel = { B, du }; }
      if (!mel) continue;
      const B = mel.B, u1 = ref + s * mel.du, u2 = u1 + s * (B.ub - B.ua);
      /* as fileiras da briga: acima de todo poço no caminho (do meio da torcida até o outro lado do isolamento) */
      let kSafe = 0;
      for (const e of obst(A)) if (cruzaU(A, e, Math.min(ref, u2) - 0.02, Math.max(ref, u2) + 0.02) && e.k1 < A.n - 1) kSafe = Math.max(kSafe, e.k1 + 1);
      const kLo = clamp(T.kMed - 3, kSafe, A.n - 4), kHi = Math.min(A.n - 1, kLo + 6);
      if (kLo < kSafe || kHi - kLo < 3) continue;
      const kc = Math.round((kLo + kHi) / 2), dc = dFileira(A, kc);
      const mA = metros(A.fam, dc, ref, u1);
      if (mA > 45) continue;
      /* a rival do outro lado: na mesma arquibancada, antes do próximo isolamento */
      let prox = Infinity;
      for (const B2 of buffers) if (B2 !== B && B2.A === A && B2.arq) { const d = distUf(A.fam, u2, s > 0 ? B2.ua : B2.ub, s); if (d != null) prox = Math.min(prox, d); }
      let alvo = null;
      for (const X of lista) {
        if (X.b.lado === T.b.lado || X.A !== A) continue;
        const du = distUf(A.fam, u2, s > 0 ? X.uLo : X.uHi, s);
        if (du == null || du > prox) continue;
        if (!alvo || du < alvo.du) alvo = { X, du };
      }
      const mV = alvo ? metros(A.fam, dc, u2, u2 + s * alvo.du) : Infinity;
      out.push({ via: 'arquibancada', T, s, B, u1, u2, kLo, kHi, D1: B.arq[s > 0 ? 0 : 1], D2: B.arq[s > 0 ? 1 : 0], mA, mV, alvo: alvo && mV <= 40 ? alvo.X : null, rival: alvo ? alvo.X : null });
    }
    return out;
  }
  function candidatosCor(T) {
    const sa = T.saida, out = [];
    if (!sa) return out;
    const L = sa.L, fam = L.fam, dm = (L.dI + L.dF) / 2;
    for (const s of [-1, 1]) {
      let mel = null;
      for (const i of L.divs) { const du = distUf(fam, sa.u, divs[i].u, s); if (du != null && (!mel || du < mel.du)) mel = { i, du }; }
      if (!mel) continue;
      const B = buffers.find(x => x.cor && x.cor.includes(mel.i));
      if (!B || B.cor[s > 0 ? 0 : 1] !== mel.i) continue;
      const u1 = sa.u + s * mel.du, u2 = u1 + s * (B.ub - B.ua);
      const mA = metros(fam, dm, sa.u, u1);
      if (mA > 60) continue;
      let prox = Infinity;
      for (const j of L.divs) if (!B.cor.includes(j)) { const d = distUf(fam, u2, divs[j].u, s); if (d != null) prox = Math.min(prox, d); }
      let alvo = null;
      for (const X of lista) {
        if (X.b.lado === T.b.lado || !X.saida || X.saida.L !== L) continue;
        const du = distUf(fam, u2, X.saida.u, s);
        if (du == null || du > prox) continue;
        if (!alvo || du < alvo.du) alvo = { X, du };
      }
      const mV = alvo ? metros(fam, dm, u2, u2 + s * alvo.du) : Infinity;
      out.push({ via: 'corredor', T, s, B, L, u1, u2, D1: mel.i, D2: B.cor[s > 0 ? 1 : 0], mA, mV, alvo: alvo && mV <= 45 ? alvo.X : null, rival: alvo ? alvo.X : null });
    }
    return out;
  }
  const custo = c => c.mA + (c.alvo ? c.mV : 60);

  /* A DECISÃO de cada torcida (uma invasão por jogo, a de mais poder primeiro) */
  const emBriga = new Set(); for (const br of brigas) { emBriga.add(br.a); emBriga.add(br.v); }
  const modo = escolha.estadio || 'sorteio', decisoes = new Map();
  const ordemT = lista.slice().sort((x, y) => (y.b.t.poder || 0) - (x.b.t.poder || 0) || y.b.n - x.b.n);
  const cands = new Map();
  for (const T of ordemT) {
    const cs = [...candidatosArq(T), ...candidatosCor(T)];
    cands.set(T, cs);
    /* a chance vem da rival que está do outro lado do isolamento (sem rival ao alcance, sozinha ela não vai) */
    const alvos = [...new Set(cs.map(c => c.alvo).filter(Boolean))];
    decisoes.set(T.b, { chance: Math.round(Math.max(0, ...alvos.map(X => chanceDe(T.b, X.b))) * 0.4), tirou: Math.floor(sorte('invade|' + T.b.t.id)() * 100),
                        vias: [...new Set(cs.map(c => c.via))], invade: false, porque: '' });
  }
  let escolhido = null;
  if (modo === 'arquibancada' || modo === 'corredor') {
    const todos = ordemT.filter(T => !emBriga.has(T.b)).flatMap(T => cands.get(T).filter(c => c.via === modo));
    escolhido = todos.sort((x, y) => custo(x) - custo(y))[0] || null;
  }
  for (const T of ordemT) {
    const dec = decisoes.get(T.b), cs = cands.get(T);
    if (emBriga.has(T.b)) { dec.porque = 'brigou na rua'; continue; }
    if (!cs.length) { dec.porque = 'longe'; continue; }
    if (modo === 'nao') { dec.porque = 'mandada paz'; continue; }
    if (modo === 'arquibancada' || modo === 'corredor') { dec.porque = escolhido && escolhido.T === T ? 'mandada' : escolhido ? 'outra invadiu' : 'não dá por ali'; continue; }
    if (escolhido) { dec.porque = 'outra invadiu'; continue; }
    if (!cs.some(c => c.alvo)) { dec.porque = 'ninguém do outro lado'; continue; }
    if (!dec.chance) { dec.porque = 'sem rival'; continue; }
    if (dec.tirou >= dec.chance) { dec.porque = 'sorteio'; continue; }
    const vale = c => c.alvo && chanceDe(T.b, c.alvo.b) > 0;
    const arqs = cs.filter(x => x.via === 'arquibancada' && vale(x)).sort((x, y) => custo(x) - custo(y)), cors = cs.filter(x => x.via === 'corredor' && vale(x)).sort((x, y) => custo(x) - custo(y));
    escolhido = arqs.length && (!cors.length || sorte('via|' + T.b.t.id)() < 0.65) ? arqs[0] : cors[0];
    dec.porque = 'sorteio';
  }
  let inv = null;
  if (escolhido) {
    inv = coreografar(escolhido);
    const dec = decisoes.get(escolhido.T.b);
    if (inv) { dec.invade = true; dec.via = escolhido.via; }
    else dec.porque = 'não dá';
  }

  /* ======================================================
     A COREOGRAFIA DA INVASÃO: quem vai, por onde, o cordão e o fim
     ====================================================== */
  function coreografar(c) {
    const T = c.T, b = T.b, s = c.s, X = c.alvo, rnd = semente('invasao|' + b.t.id + '|' + (escolha.sorteio || 0));
    const arq = c.via === 'arquibancada';
    const A = T.A, fam = arq ? A.fam : c.L.fam;
    /* as raias da briga: as fileiras (na arquibancada) ou as faixas do corredor, de parede a parede */
    let raias;
    if (arq) { raias = []; for (let k = c.kLo; k <= c.kHi; k++) raias.push(k); }
    else { const w = c.L.dF - c.L.dI - 1.8, n = Math.max(2, Math.floor(w / 0.8) + 1); raias = Array.from({ length: n }, (_, i) => c.L.dI + 0.9 + w * (n > 1 ? i / (n - 1) : 0.5)); }
    const R = raias.length;
    const dRaia = r => arq ? dFileira(A, r) : r;
    const P2 = (u, r) => { if (arq) return naFileira(A, u, r); const q = fam.ponto(r, u); return W(q[0], c.L.y, q[1]); };
    const mU = r => mPorU(fam, c.u1, dRaia(r));
    const uA = (u, m, r) => u + m / mU(r);              // m metros pro lado +u
    /* de (u, r) a (u, r) em reta no espaço (u, raia), um ponto a cada meio metro */
    const reta = (a, z) => { const L = Math.abs(z[0] - a[0]) * mU(a[1]) + Math.abs(z[1] - a[1]) * (arq ? 0.6 : 1); const n = Math.max(1, Math.ceil(L / 0.5)); const out = []; for (let i = 1; i <= n; i++) { const f = i / n; out.push(P2(a[0] + (z[0] - a[0]) * f, a[1] + (z[1] - a[1]) * f)); } return out; };

    /* QUEM VAI: a linha de frente (sem papel, fora a escolta), os mais perto da grade */
    const povoDe = (U, dq) => U.gente.map(g => g.m).filter(m => !U.papel[m] && !U.b.daEscolta[m]).sort((x, y) => dq(x) - dq(y));
    const perto1 = m => arq ? Math.abs(T.uk[m].u - c.u1) : 0;
    const povo = povoDe(T, perto1);
    if (povo.length < 3) return null;
    const nAtk = Math.min(MAX_ATAQUE, Math.max(3, Math.round(povo.length * 0.6)));
    const atac = povo.slice(0, nAtk);
    /* (no corredor, todo mundo precisa achar a saída no caminho dele) */
    const idxSaida = new Map();
    if (!arq) for (const m of atac) { const sa = saidaDe(T, m, c.L); if (!sa) return null; idxSaida.set(m, sa); }
    /* a frente da rival (do outro lado, perto): metade da gente dela, no máximo o tamanho da invasão */
    let frente = [];
    if (X) {
      const pertoX = m => arq ? Math.abs(perto(fam, X.uk[m].u, c.u2) - c.u2) : 0;
      frente = povoDe(X, pertoX).slice(0, Math.min(nAtk, Math.round(X.gente.length * 0.5)));
      if (!arq) frente = frente.filter(m => { const sa = saidaDe(X, m, c.L); if (!sa) return false; idxSaida.set('x' + m, sa); return true; });
    }
    const tudoDentro = Math.max(...atac.map(m => T.chegada[m]), ...frente.map(m => X.chegada[m]));
    const t0 = Math.max(BOLA + MIN_ATAQUE, tudoDentro + 45);

    /* o caminho da vaga até a boca da briga (e de volta), no mundo */
    const ida = (U, m, alvo, lado) => {
      if (arq) return pontosNaArq(A, rotaNaArq(A, [perto(fam, U.uk[m].u, alvo[0]), U.uk[m].k], alvo)).slice(1);
      const pts = U.b.pessoas[m].dentro.pts, sa = idxSaida.get(lado ? 'x' + m : m), out = [];
      for (let i = pts.length - 2; i >= sa.k; i--) out.push(pts[i]);
      return out.concat(reta([perto(fam, sa.u, alvo[0]), sa.d], alvo));
    };
    const olhaPra = (u, r) => P2(u, r);

    /* OS LUGARES NA GRADE: a camada 0 colada nela, as outras atrás */
    const slot = (j, uD, lado) => { const r = raias[j % R], cam = Math.floor(j / R); return [uA(uD, -lado * s * (0.5 + 0.8 * cam), r), r, cam]; };
    const trA = new Map(), trV = new Map(), trP = [];
    const slotsA = atac.map((m, j) => slot(j, c.u1, 1));
    let chegaGrade = 0;
    atac.forEach((m, j) => {
      const tr = Trilho(t0 + j * 0.12, T.vaga[m]);
      chegaGrade = Math.max(chegaGrade, vai(tr, ida(T, m, slotsA[j].slice(0, 2), false), CORRE, M, 'corre'));
      trA.set(m, { tr, j, cam: slotsA[j][2], r: slotsA[j][1], volta: null });
    });
    const tPush = chegaGrade + 0.5, tQ1 = tPush + EMPURRA;
    /* O CORDÃO: 2,2 m pra dentro do isolamento; na arquibancada, uma
       fileira a mais em cima e embaixo */
    const uC = uA(c.u1, s * 2.2, raias[R >> 1]);
    const raiasPM = arq ? [c.kLo - 1, ...raias, c.kHi + 1].filter(k => k >= 0 && k < A.n && livreV(A, uC, k, k)) : raias;
    const guardas = c.B.guardas.filter(e => e.via === c.via);
    const nRef = Math.min(revistas, clamp(raiasPM.length + 3 - guardas.length, 3, 10));
    const nPM = guardas.length + nRef;
    const slotPM = j => { const r = raiasPM[j % raiasPM.length], cam = Math.floor(j / raiasPM.length); return [uA(uC, s * 0.9 * cam, r), r, cam]; };
    /* a entrada do reforço: a frente da arquibancada no meio do isolamento
       (vem do campo; se ali é boca de vomitório, um pouco pro lado) ou a
       porta de serviço do corredor */
    const um = perto(fam, c.B.um, c.u1);
    let uE = um;
    if (arq) for (let i = 0; i < 20 && !livreV(A, uE, 0, 0); i++) uE = um + (i % 2 ? 1 : -1) * Math.ceil((i + 1) / 2) * 0.4 / mU(0);
    const entradaUK = arq ? [uE, 0] : [um, c.L.dF - 0.4], entradaPM = P2(entradaUK[0], entradaUK[1]);
    const caminhoPM = (de, ate) => arq ? pontosNaArq(A, rotaNaArq(A, de, ate)).slice(1) : reta(de, ate);
    const tG = t0 + 4, tAp = t0 + 8;
    /* o canto dos presos, na entrada do isolamento: um do lado do outro */
    const cantoPreso = i => { const r = entradaUK[1], u = uA(entradaUK[0], s * 0.7 * (i + 1) * (arq ? 1 : -1), r); return [u, r]; };
    let nPresos = 0;
    const levarPreso = (tr, de) => { const k = nPresos++; vai(tr, caminhoPM(de, cantoPreso(k)), ANDA, M, 'preso'); };
    const PMs = [];
    for (let j = 0; j < nPM; j++) {
      const sl = slotPM(j), guarda = j < guardas.length ? guardas[j] : null;
      const de = guarda ? [perto(fam, guarda.uk[0], c.u1), guarda.uk[1]] : entradaUK;
      const tr = Trilho(guarda ? tG : tAp, guarda ? guarda.P : entradaPM);
      vai(tr, caminhoPM(de, [sl[0], sl[1]]), 3.0, M, 'corre');
      PMs.push({ tr, guarda, j, r: sl[1], cam: sl[2], entra: tr.ts[0], sl });
    }
    const olhaA = r => olhaPra(uA(c.u1, -s * 2, r), r);          // o PM olha pra quem vem
    for (const q of PMs) fica(q.tr, Math.max(fimDe(q.tr), tQ1), 'cordao', olhaA(q.r));

    /* A GRADE CEDE: a camada 0 entra no isolamento até o cordão, as outras atrás */
    const frenteCordao = r => uA(uC, -s * 0.75, r);
    const tC = tQ1 + 1.8;
    for (const [m, a] of trA) {
      const sl = slotsA[a.j];
      fica(a.tr, tQ1, 'empurra', olhaPra(uA(c.u1, s * 2, sl[1]), sl[1]));
      const uFim = uA(frenteCordao(sl[1]), -s * 0.8 * a.cam, sl[1]);
      vaiAte(a.tr, reta([sl[0], sl[1]], [uFim, sl[1]]), tC, 'corre');
      a.uFim = uFim;
    }
    /* O FIM: a PM segura ou a torcida fura */
    const fA = nAtk * fichaMedia(b.t), fP = Math.max(1, nPM) * FICHA_PM;
    const pFura = clamp(0.55 * fA / (fA + fP) - 0.08, 0.04, 0.45);
    const tirou = rnd();
    const fura = escolha.cordao === 'fura' ? true : escolha.cordao === 'segura' ? false : tirou < pFura;
    const tR = tC + CONFRONTO;
    const conta = (n, [x, y]) => Math.round(n * (x + rnd() * (y - x)));
    const presosA = [], feridosA = [], presosV = [], feridosV = [];
    const inv = { via: c.via, a: b, v: X ? X.b : null, rival: c.rival ? c.rival.b : null, T, X, s, B: c.B, D1: c.D1, D2: c.D2, u1: c.u1, u2: c.u2, raias, raiasPM, kLo: c.kLo, kHi: c.kHi, L: c.L || null,
                  t0, tPush, tQ1, tC, tR, fura, pFura, tirou, nAtk, nFront: frente.length, nPM, nGuardas: guardas.length, nRef, fA, fP,
                  atac: trA, frente: trV, pms: PMs, presosA, feridosA, presosV, feridosV, centro: P2(c.u1, raias[R >> 1]), foco: false };
    /* a frente da rival vai pro lado dela da segunda grade, xingando */
    const tNota = t0 + 6;
    const slotsV = frente.map((m, j) => slot(j, c.u2, -1));
    frente.forEach((m, j) => {
      const tr = Trilho(tNota + j * 0.15, X.vaga[m]);
      vai(tr, ida(X, m, slotsV[j].slice(0, 2), true), CORRE * 0.9, M, 'corre');
      trV.set(m, { tr, j, cam: slotsV[j][2], r: slotsV[j][1] });
    });
    const olhaV = r => olhaPra(uA(c.u2, -s * 2, r), r);
    /* quem volta: do ponto onde está, reto até o lugar na grade, e o caminho de ida ao contrário */
    const voltar = (U, m, a, lado) => { const idaPts = ida(U, m, lado ? slotsV[a.j].slice(0, 2) : slotsA[a.j].slice(0, 2), lado); const volta = idaPts.slice(0, -1).reverse(); volta.push(U.vaga[m]); return volta; };
    /* os que caem e os que a PM prende, entre os que brigam (a camada 0 e a 1) */
    const brigam = [...trA.entries()].filter(([, a]) => a.cam <= 1).map(([m]) => m);
    const sortear = (l, k) => { const x = l.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x.slice(0, k); };
    if (!fura) {
      /* A PM SEGURA: pancada no cordão, a torcida volta, fica gente no chão e presa */
      const nPres = clamp(conta(nAtk, [0.08, 0.2]), 1, brigam.length), nFer = Math.min(brigam.length - nPres, conta(nAtk, [0.05, 0.15]));
      const esc = sortear(brigam, nPres + nFer);
      esc.slice(0, nPres).forEach(m => presosA.push(m)); esc.slice(nPres).forEach(m => feridosA.push(m));
      for (const [m, a] of trA) {
        const alvoPM = a.cam === 0 ? PMs.find(q => q.cam === 0 && q.r === a.r) || null : null, alvo = alvoPM ? { q: alvoPM } : null;
        if (feridosA.includes(m)) { const tc = tC + 4 + rnd() * (CONFRONTO - 7); fica(a.tr, tc, a.cam === 0 ? 'briga' : 'grita', olhaPra(uC, a.r), alvo); fica(a.tr, tc + 0.01, 'ferido'); a.tCai = tc; continue; }
        fica(a.tr, tR - 3, a.cam === 0 ? 'briga' : 'grita', olhaPra(uC, a.r), alvo);
        if (presosA.includes(m)) { fica(a.tr, tR + 6, 'preso'); levarPreso(a.tr, [a.uFim, a.r]); fica(a.tr, tR + 4000, 'preso'); a.preso = true; continue; }
        fica(a.tr, tR, a.cam === 0 ? 'briga' : 'grita', olhaPra(uC, a.r), alvo);
        vai(a.tr, reta([a.uFim, a.r], slotsA[a.j].slice(0, 2)), CORRE * 0.8, M, 'corre');
        vai(a.tr, voltar(T, m, a, false), CORRE * 0.6, M, 'anda');
      }
      /* o cordão: pancada, e depois fica na grade quebrada; dois levam os presos pra entrada do isolamento */
      PMs.forEach((q, j) => {
        fica(q.tr, tR, 'carga', olhaA(q.r));
        if (j < 2 && presosA.length) {
          fica(q.tr, tR + 6, 'cordao', olhaA(q.r));
          vai(q.tr, caminhoPM([q.sl[0], q.sl[1]], cantoPreso(presosA.length + j)), ANDA, M, 'anda');
          fica(q.tr, tR + 4000, 'cordao', olhaPra(...cantoPreso(0)));
          return;
        }
        vai(q.tr, [P2(uA(c.u1, s * (0.7 + 0.9 * q.cam), q.r), q.r)], ANDA, M, 'cordao', olhaA(q.r));
        fica(q.tr, tR + 3600, 'cordao', olhaA(q.r));
      });
      for (const [m, a] of trV) {
        fica(a.tr, tR + 4, 'grita', olhaV(a.r));
        vai(a.tr, voltar(X, m, a, true), ANDA * 1.2, M, 'anda');
      }
      inv.tFim = Math.max(tR + 10, ...[...trA.values()].filter(a => !a.preso && a.tCai == null).map(a => fimDe(a.tr)), ...[...trV.values()].map(a => fimDe(a.tr)));
    } else {
      /* A TORCIDA FURA: o cordão recua pros lados, ela vai até a segunda grade */
      const tF = tC + 10;
      for (const q of PMs) {
        fica(q.tr, tF, 'carga', olhaA(q.r));
        const rr = arq ? clamp(q.r + (q.r <= raias[R >> 1] ? -2 : 2), 0, A.n - 1) : q.r;
        vai(q.tr, [P2(uA(uC, s * (1.4 + 0.5 * q.cam), rr), rr)], 2.0, M, 'recua', olhaA(q.r));
      }
      const uD2 = r => uA(c.u2, -s * 0.5, r);
      let chega2 = tF;
      for (const [m, a] of trA) {
        const alvoPM = a.cam === 0 ? PMs.find(q => q.cam === 0 && q.r === a.r) || null : null;
        fica(a.tr, tF, a.cam === 0 ? 'briga' : 'grita', olhaPra(uC, a.r), alvoPM ? { q: alvoPM } : null);
        const u2 = uA(uD2(a.r), -s * 0.8 * a.cam, a.r);
        chega2 = Math.max(chega2, vai(a.tr, reta([a.uFim, a.r], [u2, a.r]), CORRE, M, 'corre'));
        a.uD2 = u2;
      }
      const tD2 = chega2 + 0.3, tQ2 = tD2 + 7, tS = tQ2 + 1 + (X && frente.length ? CONTRA : 8);
      inv.tD2 = tD2; inv.tQ2 = tQ2; inv.tS = tS;
      /* a pancada com a rival, na boca da segunda grade */
      const nBr = Math.min(brigam.length, trV.size ? trV.size * 3 : 0);
      let venceA = true, bxA = { f: 0, p: 0 }, bxV = { f: 0, p: 0 };
      if (X && frente.length) {
        const fa = nAtk * fichaMedia(b.t), fv = frente.length * fichaMedia(X.b.t), favA = fa === fv ? rnd() < 0.5 : fa > fv;
        venceA = rnd() < CHANCE_FAVORITO ? favA : !favA;
        const tab = perdeu => perdeu ? BAIXAS.perdeu : BAIXAS.venceu;
        bxA = { f: conta(nBr || nAtk, tab(!venceA).ferido), p: conta(nBr || nAtk, tab(!venceA).preso) };
        bxV = { f: conta(frente.length, tab(venceA).ferido), p: conta(frente.length, tab(venceA).preso) };
        inv.venceA = venceA; inv.fa = fa; inv.fv = fv; inv.favoritoA = favA;
      }
      /* e a PM prende uns da invasão quando separa */
      const nPresA = clamp(bxA.p + Math.max(1, Math.round(nAtk * 0.08)), 1, brigam.length), nFerA = Math.min(brigam.length - nPresA, bxA.f);
      const escA = sortear(brigam, nPresA + nFerA);
      escA.slice(0, nPresA).forEach(m => presosA.push(m)); escA.slice(nPresA).forEach(m => feridosA.push(m));
      const brigamV = [...trV.entries()].filter(([, a]) => a.cam <= 1).map(([m]) => m);
      const escV = sortear(brigamV, Math.min(brigamV.length, bxV.f + bxV.p));
      escV.slice(0, Math.min(bxV.p, escV.length)).forEach(m => presosV.push(m)); escV.slice(bxV.p).forEach(m => feridosV.push(m));
      /* o confronto: a camada 0 dos dois passa da boca e se pega */
      const uMeio = r => uA(c.u2, s * 0.4, r);
      const parDe = new Map();
      for (const [m, a] of trA) if (a.cam === 0) { const w = [...trV.entries()].find(([, v]) => v.cam === 0 && v.r === a.r); if (w) parDe.set(m, w[0]); }
      for (const [m, a] of trA) {
        fica(a.tr, tQ2, 'empurra', olhaPra(uA(c.u2, s * 2, a.r), a.r));
        const w = parDe.get(m);
        if (a.cam === 0 && w != null) vai(a.tr, [P2(uA(uMeio(a.r), -s * 0.45, a.r), a.r)], CORRE, M, 'corre');
        const alvoD = w != null ? { rival: w } : null;
        if (feridosA.includes(m)) { const tc = tQ2 + 3 + rnd() * Math.max(2, tS - tQ2 - 6); fica(a.tr, tc, a.cam === 0 ? 'briga' : 'grita', olhaPra(uMeio(a.r), a.r), alvoD); fica(a.tr, tc + 0.01, 'ferido'); a.tCai = tc; continue; }
        fica(a.tr, tS - 2, a.cam === 0 && w != null ? 'briga' : 'grita', olhaPra(uMeio(a.r), a.r), alvoD);
        if (presosA.includes(m)) { fica(a.tr, tS + 5, 'preso'); levarPreso(a.tr, [uA(uMeio(a.r), -s * 0.45, a.r), a.r]); fica(a.tr, tS + 4000, 'preso'); a.preso = true; continue; }
        fica(a.tr, tS, 'grita', olhaPra(uMeio(a.r), a.r));
        vai(a.tr, reta([uA(uMeio(a.r), -s * 0.45, a.r), a.r], slotsA[a.j].slice(0, 2)), CORRE * 0.8, M, 'corre');
        vai(a.tr, voltar(T, m, a, false), CORRE * 0.6, M, 'anda');
      }
      const parV = new Map([...parDe.entries()].map(([m, w]) => [w, m]));
      for (const [m, a] of trV) {
        fica(a.tr, tQ2, 'grita', olhaV(a.r));
        const w = parV.get(m);
        if (a.cam === 0 && w != null) vai(a.tr, [P2(uA(uMeio(a.r), s * 0.45, a.r), a.r)], CORRE, M, 'corre');
        const alvoD = w != null ? { atacante: w } : null;
        if (feridosV.includes(m)) { const tc = tQ2 + 3 + rnd() * Math.max(2, tS - tQ2 - 6); fica(a.tr, tc, a.cam === 0 ? 'briga' : 'grita', olhaPra(uMeio(a.r), a.r), alvoD); fica(a.tr, tc + 0.01, 'ferido'); a.tCai = tc; continue; }
        fica(a.tr, tS - 2, a.cam === 0 && w != null ? 'briga' : 'grita', olhaPra(uMeio(a.r), a.r), alvoD);
        if (presosV.includes(m)) { fica(a.tr, tS + 5, 'preso'); fica(a.tr, tS + 4000, 'preso'); a.preso = true; continue; }
        fica(a.tr, tS + 1, 'grita', olhaV(a.r));
        vai(a.tr, voltar(X, m, a, true), CORRE * 0.6, M, 'anda');
      }
      /* a PM se junta de novo e separa: fica na segunda grade, virada pra invasão */
      for (const q of PMs) {
        fica(q.tr, tS - 3, 'recua', olhaA(q.r));
        const rr = arq ? raiasPM[q.j % raiasPM.length] : q.r;
        vai(q.tr, [P2(uA(c.u2, -s * (0.9 + 0.9 * q.cam), rr), rr)], 3.0, M, 'carga', olhaA(rr));
        fica(q.tr, tS + 3600, 'cordao', olhaA(rr));
      }
      inv.tFim = Math.max(tS + 10, ...[...trA.values()].filter(a => !a.preso && a.tCai == null).map(a => fimDe(a.tr)), ...[...trV.values()].filter(a => !a.preso && a.tCai == null).map(a => fimDe(a.tr)));
    }
    /* as grades: quando balançam e quando caem (as fileiras / as partes da briga) */
    inv.grades = [{ i: c.D1, balanca: tPush, cai: tQ1, s }];
    if (fura) inv.grades.push({ i: c.D2, balanca: inv.tD2, cai: inv.tQ2, s });
    for (const g of inv.grades) { g.tipo = divs[g.i].tipo; g.kLo = c.kLo - 1; g.kHi = c.kHi + 1; }
    inv.gente = { presosA: presosA.length, feridosA: feridosA.length, presosV: presosV.length, feridosV: feridosV.length };
    /* em torcedores (um boneco vale FATOR) */
    inv.torcedores = x => Math.round(x * FATOR);
    return inv;
  }

  /* o fim de tudo: a bola rolando e o que a invasão pede */
  const fim = Math.max(BOLA + 6 * 60, inv ? inv.tFim + 30 : 0, ...lista.map(T => Math.max(T.faixa ? T.faixa.tSolta + 30 : 0, T.bandeira ? T.bandeira.tSolta + 30 : 0)));
  return { lista, porBonde, buffers, estacoes: ordemEst, nGuardas: ordemEst.length, decisoes, invasao: inv, modo, fim, modelo, dirW, rumoDe, W };
}

/* ======================================================
   AS TELAS: a faixa, a bandeira e o bandeirão (a régua do jogo)
   ====================================================== */
const cacheImg = new Map();
function imagem(src, pronta) {
  if (!src || typeof Image === 'undefined') return;
  let e = cacheImg.get(src);
  if (!e) { e = { img: new Image(), ok: false, fila: [] }; cacheImg.set(src, e); e.img.onload = () => { e.ok = true; for (const f of e.fila) f(e.img); e.fila = []; }; e.img.onerror = () => { e.fila = []; }; e.img.src = src; }
  if (e.ok) pronta(e.img); else e.fila.push(pronta);
}
function escudoDe(tipo, id, jaTem) {
  if (jaTem) return jaTem;
  const m = ((window.TO && TO.dados && TO.dados.escudos) || {})[tipo === 'c' ? 'clubes' : 'torcidas'];
  if (!m || !id || !m[id]) return null;
  const caminho = 'img/escudos/' + (tipo === 'c' ? 'clube' : 'torcida') + '-' + id + '.png';
  return (window.__EMBUTIDOS && window.__EMBUTIDOS[caminho]) || caminho;
}
const luz = hex => { const n = parseInt(String(hex || '#888').slice(1), 16); return 0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255); };
const coresDe = t => { const c1 = t.cor || '#555', c2 = t.cor2 && t.cor2.toLowerCase() !== c1.toLowerCase() ? t.cor2 : (luz(c1) > 128 ? '#141414' : '#f4f4f4'); return { c1, c2, c3: t.cor3 || null }; };
function tela(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function textura(cv) { const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx; }
/* A FAIXA: fundo primário, borda e letra na secundária, o escudo da torcida à esquerda e o do clube à direita */
function telaDaFaixa(t, w, h) {
  const H = 128, Wd = clamp(Math.round(H * w / h), 256, 1400), cv = tela(Wd, H), x = cv.getContext('2d');
  const { c1, c2 } = coresDe(t), E = H * 0.72, mg = H * 0.12;
  const esc = { t: null, c: null };
  const pinta = () => {
    x.fillStyle = c1; x.fillRect(0, 0, Wd, H);
    x.strokeStyle = c2; x.lineWidth = H * 0.05; x.strokeRect(H * 0.03, H * 0.03, Wd - H * 0.06, H * 0.06 > 0 ? H - H * 0.06 : H);
    if (esc.t) x.drawImage(esc.t, mg, (H - E) / 2, E, E);
    if (esc.c) x.drawImage(esc.c, Wd - mg - E, (H - E) / 2, E, E);
    const esq = esc.t ? mg + E + 10 : H * 0.18, dir = esc.c ? Wd - mg - E - 10 : Wd - H * 0.18, larg = dir - esq;
    const nome = String(t.nome || t.sigla || '').toUpperCase();
    let px = H * 0.5;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    do { x.font = `700 ${px}px "Barlow Condensed", "Arial Narrow", system-ui, sans-serif`; px -= 2; } while (x.measureText(nome).width > larg && px > 14);
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillText(nome, (esq + dir) / 2 + 2, H / 2 + 2);
    x.fillStyle = c2; x.fillText(nome, (esq + dir) / 2, H / 2);
  };
  pinta();
  const tx = textura(cv);
  imagem(escudoDe('t', t.id, t.escudo), im => { esc.t = im; pinta(); tx.needsUpdate = true; });
  imagem(escudoDe('c', t.clubeId, null), im => { esc.c = im; pinta(); tx.needsUpdate = true; });
  return tx;
}
/* A BANDEIRA: quadrada, a borda de fora secundária, a de dentro terciária, o fundo primário e o escudo no meio (sem escudo, a sigla) */
function telaDaBandeira(t) {
  const Wd = 256, cv = tela(Wd, Wd), x = cv.getContext('2d'), { c1, c2, c3 } = coresDe(t);
  let esc = null;
  const pinta = () => {
    x.fillStyle = c2; x.fillRect(0, 0, Wd, Wd);
    x.fillStyle = c3 || 'rgba(0,0,0,.35)'; x.fillRect(14, 14, Wd - 28, Wd - 28);
    x.fillStyle = c1; x.fillRect(24, 24, Wd - 48, Wd - 48);
    if (esc) { const E = 150; x.drawImage(esc, (Wd - E) / 2, (Wd - E) / 2, E, E); }
    else { x.fillStyle = c2; x.font = '700 84px "Barlow Condensed", "Arial Narrow", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(t.sigla || '').slice(0, 5), Wd / 2, Wd / 2 + 4); }
  };
  pinta();
  const tx = textura(cv);
  imagem(escudoDe('t', t.id, t.escudo), im => { esc = im; pinta(); tx.needsUpdate = true; });
  return tx;
}
/* O BANDEIRÃO: nas cores da torcida, em um de quatro desenhos (o da foto é o meio a meio), com a sigla */
function telaDoBandeirao(t, j) {
  const Wd = 256, cv = tela(Wd, Wd), x = cv.getContext('2d'), { c1, c2, c3 } = coresDe(t), c3b = c3 || c2;
  const desenho = (j + Math.abs(String(t.id).split('').reduce((h, ch) => h * 31 + ch.charCodeAt(0) | 0, 7))) % 4;
  x.fillStyle = c1; x.fillRect(0, 0, Wd, Wd);
  x.fillStyle = c2;
  if (desenho === 0) { x.beginPath(); x.moveTo(0, 0); x.lineTo(Wd, 0); x.lineTo(0, Wd); x.closePath(); x.fill(); }
  else if (desenho === 1) { for (let i = 0; i < 5; i++) if (i % 2) x.fillRect(0, i * Wd / 5, Wd, Wd / 5); }
  else if (desenho === 2) { x.fillRect(0, 0, Wd / 2, Wd / 2); x.fillRect(Wd / 2, Wd / 2, Wd / 2, Wd / 2); }
  else { x.fillRect(0, Wd * 0.36, Wd, Wd * 0.28); x.fillStyle = c3b; x.fillRect(0, Wd * 0.44, Wd, Wd * 0.12); }
  x.font = '700 76px "Barlow Condensed", "Arial Narrow", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const sig = String(t.sigla || '').slice(0, 5);
  x.lineWidth = 8; x.strokeStyle = c1; x.strokeText(sig, Wd / 2, Wd / 2 + 4);
  x.fillStyle = c2 === c1 ? '#fff' : (desenho === 0 ? (luz(c1) > 128 ? '#141414' : '#f4f4f4') : c2); x.fillText(sig, Wd / 2, Wd / 2 + 4);
  return textura(cv);
}
/* a grade (o gradil de ferro): as barras em pé e as duas travessas */
function telaDaGrade() {
  const cv = tela(64, 64), x = cv.getContext('2d');
  x.clearRect(0, 0, 64, 64);
  x.fillStyle = '#9aa3a8';
  for (let i = 0; i < 8; i++) x.fillRect(i * 8 + 3, 0, 2.5, 64);
  x.fillRect(0, 0, 64, 4); x.fillRect(0, 30, 64, 3); x.fillRect(0, 60, 64, 4);
  const tx = new THREE.CanvasTexture(cv); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}

/* ======================================================
   O PANO DE VERDADE (o bandeirão): partículas presas no bambu
   ====================================================== */
function Pano(nx, ny, larg, alt) {
  const N = nx * ny, P = new Float32Array(N * 3), Q = new Float32Array(N * 3);
  const rx = larg / (nx - 1), ry = alt / (ny - 1), rd = Math.hypot(rx, ry), liga = [];
  for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) {
    const i = r * nx + c;
    if (c < nx - 1) liga.push(i, i + 1, rx);
    if (r < ny - 1) liga.push(i, i + nx, ry);
    if (c < nx - 1 && r < ny - 1) liga.push(i, i + nx + 1, rd, i + 1, i + nx, rd);
    if (c < nx - 2) liga.push(i, i + 2, 2 * rx);
  }
  return { nx, ny, N, P, Q, liga: Float32Array.from(liga), rx, ry, pronto: false };
}

/* ======================================================
   A CENA: os panos, os instrumentos, os bandeirões, as grades, a PM
   ====================================================== */
export function criarArquibancada(ctx, p, grupo, aux) {
  const A = p.arq;
  if (!A) return null;
  const { M, luta, sossega, poePM, rotulo, revistadores = [] } = aux;
  const inv = A.invasao;
  const O = {}, V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), Q4 = new THREE.Quaternion(), MT = new THREE.Matrix4(), SC = new THREE.Vector3(), CY = new THREE.Vector3(0, 1, 0);
  const matPano = new Map(), malhas = [];
  const guardar = m => { grupo.add(m); malhas.push(m); return m; };

  /* ---- os panos da mureta (a faixa e a bandeira): uma tira de 3 linhas (a mão, a dobra da mureta, a barra de baixo) ---- */
  const NJ = 24;
  function tira(tx) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array((NJ + 1) * 9), uv = new Float32Array((NJ + 1) * 6), idx = [];
    for (let j = 0; j < NJ; j++) for (let r = 0; r < 2; r++) { const a = j * 3 + r, b = a + 3; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tx, side: THREE.DoubleSide }));
    m.frustumCulled = false; m.visible = false;
    return guardar(m);
  }
  const panos = [];
  for (const T of A.lista) {
    const t = T.b.t;
    if (T.faixa) panos.push({ T, F: T.faixa, malha: tira(telaDaFaixa(t, T.faixa.w, T.faixa.H)), estado: -1 });
    if (T.bandeira) panos.push({ T, F: T.bandeira, malha: tira(telaDaBandeira(t)), estado: -1 });
  }
  /* o pano no tempo t: enrolado (some), desenrolando nas mãos, descendo, pendurado */
  function atualizarPano(pn, t, tr) {
    const { T, F, malha } = pn, Aq = T.A, c = Aq.c, fam = Aq.fam, d0 = c.d0, y0 = c.y0, yPar = y0 + (c.par || 1);
    if (t < F.tJunta) { malha.visible = false; return; }
    malha.visible = true;
    const abre = t < F.tAberta ? Math.max(0.06, liso((t - F.tJunta) / (F.tAberta - F.tJunta))) : 1;
    const desce = t < F.tAberta ? 0 : liso((t - F.tAberta) / PENDURA);
    const pendurado = desce >= 1;
    /* (pendurado e parado: só mexe se o vento mexe; o vento é leve) */
    const yM = y0 + 2.0, dM = d0 + 0.02, dB = d0 - 0.24, yB = yPar + 0.03, L0 = Math.hypot(dM - dB, yM - yB);
    const lAB = (1 - desce) * L0, yA = yB + (yM - yB) * (1 - desce), dA = dB + (dM - dB) * (1 - desce);
    const H = F.H, pos = malha.geometry.attributes.position.array, uv = malha.geometry.attributes.uv.array;
    const vDobra = 1 - Math.min(0.95, lAB / H);
    for (let j = 0; j <= NJ; j++) {
      const sj = j / NJ, s2 = 0.5 + clamp(sj - 0.5, -abre / 2, abre / 2), u = F.uc + (s2 - 0.5) * F.du;
      const vento = pendurado ? 0.03 * Math.sin(tr * 1.3 + sj * 7 + F.uc * 13) : 0.02 * Math.sin(tr * 2.1 + sj * 5);
      const pts = [[dA, yA], [dB, yB], [dB - 0.02 + vento, yB - (H - lAB)]];
      for (let r = 0; r < 3; r++) {
        const q = fam.ponto(pts[r][0], u), w = A.W(q[0], pts[r][1], q[1]), i = (j * 3 + r) * 3;
        pos[i] = w[0]; pos[i + 1] = w[1]; pos[i + 2] = w[2];
        uv[(j * 3 + r) * 2] = sj; uv[(j * 3 + r) * 2 + 1] = r === 0 ? 1 : r === 1 ? vDobra : 0;
      }
    }
    malha.geometry.attributes.position.needsUpdate = true; malha.geometry.attributes.uv.needsUpdate = true;
    malha.geometry.computeVertexNormals();
  }

  /* ---- os instrumentos (surdo, caixa, repique) e o pano enrolado no ombro: instâncias ---- */
  const tocadores = [], enrolados = [];
  for (const T of A.lista) {
    T.gente.forEach(g => { if (T.papel[g.m] === 'bateria') tocadores.push({ T, m: g.m, tipo: T.inst[g.m] }); });
    if (T.faixa) enrolados.push({ T, m: T.faixa.quem[0], F: T.faixa, comp: 1.5 });
    if (T.bandeira) enrolados.push({ T, m: T.bandeira.quem[0], F: T.bandeira, comp: 1.2 });
  }
  const MED = { surdo: { r: 0.25, h: 0.46, y: 0.92, frente: 0.36, lado: 0, deita: 0.45 }, caixa: { r: 0.17, h: 0.15, y: 1.0, frente: 0.3, lado: 0, deita: 0.55 }, repique: { r: 0.14, h: 0.32, y: 1.02, frente: 0.2, lado: -0.2, deita: 1.0 } };
  const corpoInst = tocadores.length ? guardar(new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 14), new THREE.MeshLambertMaterial({ color: '#ffffff' }), tocadores.length)) : null;
  const peleInst = tocadores.length ? guardar(new THREE.InstancedMesh(new THREE.CylinderGeometry(1.03, 1.03, 1, 14), new THREE.MeshLambertMaterial({ color: '#f1ede2' }), tocadores.length)) : null;
  /* o casco na cor da torcida que aparece na camisa dela: a primária, ou a secundária quando a primária é clara (tambor branco some na camisa branca) */
  const corDoCasco = t => { const { c1, c2 } = coresDe(t); return luz(c1) > 175 ? c2 : c1; };
  if (corpoInst) { const cor = new THREE.Color(); tocadores.forEach((q, i) => { cor.set(corDoCasco(q.T.b.t)); corpoInst.setColorAt(i, cor); }); corpoInst.instanceColor.needsUpdate = true; corpoInst.frustumCulled = peleInst.frustumCulled = false; }
  const rolo = enrolados.length ? guardar(new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 10), new THREE.MeshLambertMaterial({ color: '#ffffff' }), enrolados.length)) : null;
  if (rolo) { const cor = new THREE.Color(); enrolados.forEach((q, i) => { cor.set(corDoCasco(q.T.b.t)); rolo.setColorAt(i, cor); }); rolo.instanceColor.needsUpdate = true; rolo.frustumCulled = false; }
  const ESCONDE = new THREE.Matrix4().makeScale(0, 0, 0);

  /* ---- os bandeirões: o bambu (instâncias) e o pano de cada um ---- */
  const bandeiroes = [];
  for (const T of A.lista) for (const bd of T.band) {
    const pano = Pano(9, 9, 4 * M, 4 * M);
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(pano.N * 3), uv = new Float32Array(pano.N * 2), idx = [];
    for (let r = 0; r < pano.ny; r++) for (let c = 0; c < pano.nx; c++) { const i = r * pano.nx + c; uv[2 * i] = c / (pano.nx - 1); uv[2 * i + 1] = 1 - r / (pano.ny - 1); }
    for (let r = 0; r < pano.ny - 1; r++) for (let c = 0; c < pano.nx - 1; c++) { const i = r * pano.nx + c; idx.push(i, i + pano.nx, i + 1, i + 1, i + pano.nx, i + pano.nx + 1); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const malha = guardar(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: telaDoBandeirao(T.b.t, bd.j), side: THREE.DoubleSide })));
    malha.frustumCulled = false;
    bandeiroes.push({ T, bd, pano, malha, ult: null });
  }
  const bambu = bandeiroes.length ? guardar(new THREE.InstancedMesh(new THREE.CylinderGeometry(0.028, 0.036, 1, 6), new THREE.MeshLambertMaterial({ color: '#c9b27a' }), bandeiroes.length)) : null;
  if (bambu) bambu.frustumCulled = false;

  /* ---- as grades da invasão: a divisória viva do cenário sai, entra a nossa em pedaços ---- */
  const est = p.estadio, divs = est.geo.divisorias || [];
  const originais = new Map();       // i → [malhas do cenário]
  if (inv) {
    const quer = new Set(inv.grades.map(g => g.i));
    ctx.doMapa().traverse(o => { const dv = o.userData && o.userData.divisoria; if (o.isMesh && dv && dv.estadio === est.nome && quer.has(dv.i)) { if (!originais.has(dv.i)) originais.set(dv.i, []); originais.get(dv.i).push(o); } });
  }
  /* a tela da grade é a do próprio gradil do estádio (a da divisória viva, 2,5 m por repetição) */
  let mapaGradil = null;
  for (const ms of originais.values()) for (const o of ms) { const mt = o.material; if (!mapaGradil && mt && mt.map && mt.alphaTest > 0) mapaGradil = mt.map; }
  const matGradil = new THREE.MeshLambertMaterial({ map: mapaGradil || telaDaGrade(), transparent: !mapaGradil, alphaTest: mapaGradil ? 0.3 : 0.4, side: THREE.DoubleSide });
  const matPoste = new THREE.MeshLambertMaterial({ color: '#6d757b' });
  /* o painel no tamanho do pedaço da grade (a fileira: a profundidade do degrau; o corredor: um terço dele), a tela na escala do gradil */
  const g0 = inv ? divs[inv.grades[0].i] : null;
  const wP = !g0 ? 1 : g0.tipo === 'arquibancada' ? (g0.pe[0] ? Math.hypot(g0.pe[0][1][0] - g0.pe[0][0][0], g0.pe[0][1][2] - g0.pe[0][0][2]) : 0.4) : (g0.dF - g0.dI) / 3;
  const geoPainel = new THREE.PlaneGeometry(1, 1);
  if (g0) { const uv = geoPainel.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * wP / 2.5, uv.getY(i) * g0.h / 2.5); uv.needsUpdate = true; }
  const geoPoste = new THREE.BoxGeometry(1, 1, 1);
  const paineis = [];                // {g, pe: [a, b] (mundo), h, k, cai (0/1 se cai), lado (+s: o u que ela vai), dirCai}
  if (inv) for (const g of inv.grades) {
    const dv = divs[g.i], fam = dv.fam, lista = [];
    const tg = (u, d) => { const a = fam.ponto(d, u - 1e-3), b = fam.ponto(d, u + 1e-3); const [x, z] = A.dirW(b[0] - a[0], b[1] - a[1]); const l = Math.hypot(x, z) || 1; return [x / l * g.s, z / l * g.s]; };
    if (dv.tipo === 'arquibancada') {
      dv.pe.forEach(([a, b], k) => {
        const wa = A.W(a[0], a[1], a[2]), wb = A.W(b[0], b[1], b[2]), dm = fam.dDe ? fam.dDe((a[0] + b[0]) / 2, (a[2] + b[2]) / 2) : 0;
        lista.push({ g, a: wa, b: wb, h: dv.h * M, k, cai: k >= g.kLo && k <= g.kHi, dir: tg(dv.u, dm), fase: k * 1.7 });
      });
    } else {
      const partes = 3, w = (dv.dF - dv.dI) / partes;
      for (let j = 0; j < partes; j++) {
        const qa = fam.ponto(dv.dI + w * j, dv.u), qb = fam.ponto(dv.dI + w * (j + 1), dv.u);
        lista.push({ g, a: A.W(qa[0], dv.y, qa[1]), b: A.W(qb[0], dv.y, qb[1]), h: dv.h * M, k: j, cai: j === 1, torto: j !== 1, dir: tg(dv.u, dv.dI + w * (j + 0.5)), fase: j * 2.1 });
      }
    }
    paineis.push(...lista);
  }
  const gradeInst = paineis.length ? guardar(new THREE.InstancedMesh(geoPainel, matGradil, paineis.length)) : null;
  if (gradeInst) { gradeInst.frustumCulled = false; gradeInst.visible = false; }
  /* os postes: na arquibancada, um a cada duas fileiras (como o gradil do modelo); no corredor, um em cada ponta de painel */
  for (const pn of paineis) pn.poste = pn.g.tipo === 'arquibancada' ? pn.k % 2 === 0 : true;
  const nPostes = paineis.filter(pn => pn.poste).length;
  const posteInst = nPostes ? guardar(new THREE.InstancedMesh(geoPoste, matPoste, nPostes)) : null;
  if (posteInst) { posteInst.frustumCulled = false; posteInst.visible = false; }

  /* ---- a PM do estádio: os guardas de cada isolamento e o reforço (os da revista) ---- */
  const guardaPM = new Map();          // estação → pm
  for (const e of A.estacoes) guardaPM.set(e, poePM(e.P[0], e.P[2], e.rumo, false));
  for (const e of A.estacoes) { const pm = guardaPM.get(e); pm.alt = e.P[1]; }
  const cordao = [];
  if (inv) {
    const livres = revistadores.slice();
    for (const q of inv.pms) {
      const pm = q.guarda ? guardaPM.get(q.guarda) : (livres.shift() || {}).pm;
      if (pm) cordao.push({ q, pm });
    }
  }
  const rotInv = inv && rotulo ? rotulo('Invasão da ' + inv.a.t.sigla + (inv.via === 'corredor' ? ' pelo corredor' : ''), '#b3261e') : null;
  if (rotInv) { rotInv.position.set(inv.centro[0], inv.centro[1] + 5 * M, inv.centro[2]); rotInv.userData.prio = 0.4; rotInv.userData.escondido = true; guardar(rotInv); }

  /* ======================================================
     A PESSOA NO ESTÁDIO: do lugar dela em diante
     ====================================================== */
  const controla = (b, m, t) => { const T = A.porBonde.get(b); return !!T && T.chegada[m] <= t; };
  const dados = (b, m) => { const T = A.porBonde.get(b); return { T, a: inv && inv.a === b ? inv.atac.get(m) : null, v: inv && inv.v === b ? inv.frente.get(m) : null }; };
  const discoDe = (b, m) => b.gente[m] && b.gente[m].d;
  function olharPara(d, alvo) { if (alvo) d.rumo = Math.atan2(alvo[0] - d.x, alvo[2] - d.y); }
  function pessoa(b, gg, d, t, dt) {
    const m = gg.m, { T, a, v } = dados(b, m);
    const papel = T.papel[m];
    d.gestoForcado = null; d.gestoParam = T.canto; d._cacando = false;
    let jeito = 'arquibancada', briga = null, estado = 'lugar';
    const tr = (a && t >= a.tr.ts[0]) ? a.tr : (v && t >= v.tr.ts[0]) ? v.tr : T.trilhos[m];
    const volta = tr && !a && !v && tr !== T.trilhos[m];
    let naTrilha = false;
    if (tr && t >= tr.ts[0]) {
      ondeNo(tr, t, O);
      naTrilha = !O.acabou || ['ferido', 'preso', 'puxador'].includes(O.modo);
    }
    if (naTrilha) {
      d.x = O.x; d.y = O.z; d.alt = O.y;
      estado = O.modo;
      if (O.anda) { d.rumo = Math.atan2(O.dx, O.dz); if (O.modo === 'corre') d._cacando = true; jeito = undefined; }
      switch (O.modo) {
        case 'estende': d.gestoForcado = 'estende'; if (!O.anda) olharPara(d, O.olha); break;
        case 'empurra': d.gestoForcado = 'empurra'; olharPara(d, O.olha); d.hostil = 1; break;
        case 'grita': d.gestoForcado = ['soco', 'aponta', 'braco'][m % 3]; olharPara(d, O.olha); d.hostil = 1; jeito = 'arquibancada'; break;
        case 'briga': briga = O.alvo; olharPara(d, O.olha); jeito = undefined; break;
        case 'preso': jeito = 'revista'; break;
        case 'ferido': jeito = undefined; break;
        case 'puxador': jeito = 'puxador'; d.rumo = T.puxador.rumo; break;
        default: if (!O.anda) jeito = 'arquibancada';
      }
    } else {
      /* no lugar: virado pro campo, cantando no tempo da torcida */
      const q = T.vaga[m];
      d.x = q[0]; d.y = q[2]; d.alt = q[1];
      d.rumo = Math.atan2(p.centroEst[0] - d.x, p.centroEst[2] - d.y);
      if (papel === 'bateria') d.gestoForcado = T.inst[m] === 'caixa' ? 'caixa' : 'repique';
      else if (papel === 'bandeirao') { const bd = T.band.find(x => x.m === m); d.gestoForcado = 'mastro'; d.gestoParam = bd.param; }
      else if (papel === 'puxador') { jeito = 'puxador'; d.rumo = T.puxador.rumo; }
    }
    /* o chão, a pancada e o ferido */
    if (estado === 'ferido') { sossega(d); d.derrubado = 1; d.derrubadoDur = 2; d.noChao = true; d.jeito = undefined; return; }
    if (d.noChao) { d.derrubado = 0; d.noChao = false; }
    if (briga) {
      let alvoD = null;
      if (briga.pm) alvoD = briga.pm;
      else if (briga.q) { const c = cordao.find(x => x.q === briga.q); alvoD = c ? c.pm : null; }
      else if (briga.rival != null) alvoD = discoDe(inv.v, briga.rival);
      else if (briga.atacante != null) alvoD = discoDe(inv.a, briga.atacante);
      const ganhou = inv.fura ? (b === inv.a ? inv.venceA !== false : inv.venceA === false) : b !== inv.a;
      const fimK = inv.fura ? (t - (inv.tQ2 || inv.tC)) / Math.max(1, (inv.tS || inv.tR) - (inv.tQ2 || inv.tC)) : (t - inv.tC) / CONFRONTO;
      if (alvoD && Math.hypot(alvoD.x - d.x, alvoD.y - d.y) < 2.2 * M) { olharPara(d, [alvoD.x, 0, alvoD.y]); luta(gg, d, alvoD, ganhou, fimK, dt); }
      else { d.hostil = 1; d.ataque = null; }
      d.jeito = undefined;
      return;
    }
    if (estado !== 'empurra' && estado !== 'grita') sossega(d);
    d.jeito = jeito;
  }
  /* no lugar (pro painel: quem está no lugar dele) */
  const noLugar = (b, m, t) => { const { a, v } = dados(b, m); const tr = a ? a.tr : v ? v.tr : null; return !tr || t < tr.ts[0] || (t >= fimDe(tr) && !a?.preso && !v?.preso && a?.tCai == null && v?.tCai == null); };
  /* FORA DO ESTÁDIO (a sede, a rua, o caminho de dentro): a bateria toca, o bandeirão balança */
  function gesto(b, gg, d) {
    const T = A.porBonde.get(b);
    if (!T) return;
    const pa = T.papel[gg.m];
    if (pa === 'bateria') { d.gestoForcado = T.inst[gg.m] === 'caixa' ? 'caixa' : 'repique'; d.gestoParam = T.canto; }
    else if (pa === 'bandeirao') { const bd = T.band.find(x => x.m === gg.m); d.gestoForcado = 'mastro'; d.gestoParam = bd.param; }
    else if (d.gestoForcado || d.gestoParam) { d.gestoForcado = null; d.gestoParam = null; }
  }

  /* ======================================================
     A CADA QUADRO: os panos, os instrumentos, os bandeirões, as grades
     e a PM do estádio
     ====================================================== */
  const escondido = d => !d || !d.vivo || d.noChao || d.jeito === 'revista';
  function quadro(t, tr, dt) {
    for (const pn of panos) atualizarPano(pn, t, tr);
    /* os instrumentos: na cintura, na frente do corpo */
    if (corpoInst) {
      tocadores.forEach((q, i) => {
        const d = discoDe(q.T.b, q.m);
        if (escondido(d)) { corpoInst.setMatrixAt(i, ESCONDE); peleInst.setMatrixAt(i, ESCONDE); return; }
        const md = MED[q.tipo], fx = Math.sin(d.rumo), fz = Math.cos(d.rumo), rx = fz, rz = -fx;
        const px = d.x + (fx * md.frente + rx * md.lado) * M, py = (d.alt || 0) + md.y * M, pz = d.y + (fz * md.frente + rz * md.lado) * M;
        /* o eixo do tambor: deitado pra frente (a pele de cima vira pra quem toca) */
        V1.set(-fx * Math.sin(md.deita), Math.cos(md.deita), -fz * Math.sin(md.deita)).normalize();
        Q4.setFromUnitVectors(CY, V1);
        SC.set(md.r * M, md.h * M, md.r * M); V2.set(px, py, pz); MT.compose(V2, Q4, SC); corpoInst.setMatrixAt(i, MT);
        SC.set(md.r * M, md.h * M * 0.12, md.r * M); V3.copy(V1).multiplyScalar(md.h * M * 0.5).add(V2); MT.compose(V3, Q4, SC); peleInst.setMatrixAt(i, MT);
      });
      corpoInst.instanceMatrix.needsUpdate = true; peleInst.instanceMatrix.needsUpdate = true;
    }
    /* o pano enrolado no ombro de quem leva (até começar a desenrolar) */
    if (rolo) {
      enrolados.forEach((q, i) => {
        const d = discoDe(q.T.b, q.m);
        if (escondido(d) || t >= q.F.tJunta) { rolo.setMatrixAt(i, ESCONDE); return; }
        const fx = Math.sin(d.rumo), fz = Math.cos(d.rumo), rx = fz, rz = -fx;
        V1.set(fx * 0.96, 0.28, fz * 0.96).normalize(); Q4.setFromUnitVectors(CY, V1);
        SC.set(0.11 * M, q.comp * M, 0.11 * M); V2.set(d.x + rx * 0.2 * M, (d.alt || 0) + 1.52 * M, d.y + rz * 0.2 * M); MT.compose(V2, Q4, SC); rolo.setMatrixAt(i, MT);
      });
      rolo.instanceMatrix.needsUpdate = true;
    }
    /* os bandeirões */
    const passo = Math.min(1 / 30, Math.max(0, dt));
    bandeiroes.forEach((bb, i) => {
      const d = discoDe(bb.T.b, bb.bd.m);
      if (escondido(d)) { bb.malha.visible = false; bambu.setMatrixAt(i, ESCONDE); bb.ult = null; return; }
      bb.malha.visible = true;
      const bd = bb.bd, w = 2 * Math.PI / bd.periodo;
      const th = bd.amp * Math.sin(tr * w + bd.fase), be = 0.3 * Math.sin(2 * tr * w + bd.fase * 1.3);
      bd.param.a = th;
      const fx = Math.sin(d.rumo), fz = Math.cos(d.rumo), rx = fz, rz = -fx;
      /* o bambu: das mãos (1,4 m) pra cima, deitado pro lado (th) e pra frente/trás (be) */
      V1.set(rx * Math.sin(th) + fx * Math.sin(be) * Math.cos(th), Math.cos(th) * Math.cos(be), rz * Math.sin(th) + fz * Math.sin(be) * Math.cos(th)).normalize();
      const gx = d.x + fx * 0.15 * M, gy = (d.alt || 0) + 1.4 * M, gz = d.y + fz * 0.15 * M;
      const baixo = 0.8 * M, alto = 5.0 * M;
      Q4.setFromUnitVectors(CY, V1); SC.set(M, alto + baixo, M);
      V2.set(gx + V1.x * (alto - baixo) / 2, gy + V1.y * (alto - baixo) / 2, gz + V1.z * (alto - baixo) / 2); MT.compose(V2, Q4, SC); bambu.setMatrixAt(i, MT);
      /* o pano: a coluna 0 presa nos 4 m de cima do bambu */
      const topo = [gx + V1.x * alto, gy + V1.y * alto, gz + V1.z * alto];
      pano(bb, topo, [V1.x, V1.y, V1.z], [rx, rz], tr, passo);
    });
    if (bambu) bambu.instanceMatrix.needsUpdate = true;
    /* AS GRADES DA INVASÃO */
    if (inv) grades(t, tr);
    /* A PM DO ESTÁDIO */
    pms(t, tr);
    if (rotInv) rotInv.userData.escondido = !(t >= inv.t0 - 5 && t < inv.tFim);
  }
  /* um passo do pano: as presas no bambu, o resto com a gravidade, o
     vento e as ligações (e, se o bambu pulou longe — a régua do tempo, o
     30× —, o pano vai junto sem esticar) */
  function pano(bb, topo, eixo, lado, tr, dt) {
    const P = bb.pano, { nx, ny, N } = P, X = P.P, Y = P.Q;
    const presa = r => [topo[0] - eixo[0] * r * P.ry, topo[1] - eixo[1] * r * P.ry, topo[2] - eixo[2] * r * P.ry];
    if (!P.pronto || !bb.ult || Math.hypot(topo[0] - bb.ult[0], topo[2] - bb.ult[2]) > 2.5 * M) {
      for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) { const q = presa(r), i = (r * nx + c) * 3; X[i] = q[0] + lado[0] * c * P.rx; X[i + 1] = q[1] - c * P.rx * 0.3; X[i + 2] = q[2] + lado[1] * c * P.rx; }
      Y.set(X); P.pronto = true;
    }
    bb.ult = topo;
    if (dt > 0) {
      const sub = 2, h = dt / sub, g = -9.8 * M, vento = 1.6 * M * (1 + 0.6 * Math.sin(tr * 0.7 + bb.bd.fase)), wx = 0.6 * vento, wz = 0.8 * vento;
      for (let s = 0; s < sub; s++) {
        for (let i = 0; i < N; i++) {
          const c = i % nx, k = i * 3;
          if (c === 0) continue;
          const vx = (X[k] - Y[k]) * 0.985, vy = (X[k + 1] - Y[k + 1]) * 0.985, vz = (X[k + 2] - Y[k + 2]) * 0.985;
          const tur = Math.sin(tr * 3.1 + i * 0.7) * 1.2 * M;
          Y[k] = X[k]; Y[k + 1] = X[k + 1]; Y[k + 2] = X[k + 2];
          X[k] += vx + (wx + tur * 0.5) * h * h; X[k + 1] += vy + (g + tur * 0.3) * h * h; X[k + 2] += vz + (wz - tur * 0.5) * h * h;
        }
        for (let r = 0; r < ny; r++) { const q = presa(r), k = r * nx * 3; X[k] = q[0]; X[k + 1] = q[1]; X[k + 2] = q[2]; }
        const L = P.liga;
        for (let it = 0; it < 4; it++) for (let j = 0; j < L.length; j += 3) {
          const a = L[j] * 3, b = L[j + 1] * 3, rest = L[j + 2];
          const dx = X[b] - X[a], dy = X[b + 1] - X[a + 1], dz = X[b + 2] - X[a + 2], l = Math.hypot(dx, dy, dz) || 1e-6;
          const pa = (L[j] % nx) === 0, pb = (L[j + 1] % nx) === 0;
          if (pa && pb) continue;
          const f = (l - rest) / l, ka = pa ? 0 : pb ? 1 : 0.5, kb = pb ? 0 : pa ? 1 : 0.5;
          X[a] += dx * f * ka; X[a + 1] += dy * f * ka; X[a + 2] += dz * f * ka;
          X[b] -= dx * f * kb; X[b + 1] -= dy * f * kb; X[b + 2] -= dz * f * kb;
        }
      }
    }
    const pos = bb.malha.geometry.attributes.position;
    pos.array.set(X); pos.needsUpdate = true;
    bb.malha.geometry.computeVertexNormals();
  }
  /* as grades: a do cenário até a hora de balançar; aí a nossa, em pedaços — balança e cai pro lado do isolamento */
  function grades(t, tr) {
    const ativa = new Set(inv.grades.filter(g => t >= g.balanca).map(g => g.i));
    for (const [i, ms] of originais) for (const o of ms) o.visible = !ativa.has(i);
    if (!gradeInst) return;
    gradeInst.visible = ativa.size > 0;
    if (posteInst) posteInst.visible = ativa.size > 0;
    let jp = 0;
    paineis.forEach((pn, i) => {
      const g = pn.g;
      if (!ativa.has(g.i)) { gradeInst.setMatrixAt(i, ESCONDE); if (pn.poste) posteInst.setMatrixAt(jp++, ESCONDE); return; }
      let ang = 0;
      const empurra = t < g.cai ? liso((t - g.balanca) / 4) : 0;
      if (pn.cai && t < g.cai) ang = 0.07 * empurra * Math.sin(tr * 9 + pn.fase);
      else if (pn.cai) ang = (Math.PI / 2 - 0.04) * liso((t - g.cai) / 0.7);
      else if (pn.torto && t >= g.cai) ang = 0.45 * liso((t - g.cai) / 0.7);
      else if (!pn.cai && t < g.cai) ang = 0.025 * empurra * Math.sin(tr * 9 + pn.fase);
      /* o painel: a base no pé da grade, em pé, deitando pro lado dir */
      const ax = pn.b[0] - pn.a[0], ay = pn.b[1] - pn.a[1], az = pn.b[2] - pn.a[2], L = Math.hypot(ax, ay, az) || 1;
      V1.set(ax / L, ay / L, az / L);
      V2.set(pn.dir[0] * Math.sin(ang), Math.cos(ang), pn.dir[1] * Math.sin(ang)).normalize();
      V3.crossVectors(V1, V2).normalize();
      MT.makeBasis(V1.clone().multiplyScalar(L), V2.clone().multiplyScalar(pn.h), V3);
      MT.setPosition((pn.a[0] + pn.b[0]) / 2 + V2.x * pn.h / 2, (pn.a[1] + pn.b[1]) / 2 + V2.y * pn.h / 2 + 0.01 * M, (pn.a[2] + pn.b[2]) / 2 + V2.z * pn.h / 2);
      gradeInst.setMatrixAt(i, MT);
      /* o poste na ponta de cá do painel (10 cm pra dentro), junto com ele */
      if (pn.poste) {
        const e = Math.min(0.1 * M, L / 4);
        MT.makeBasis(V1.clone().multiplyScalar(0.08 * M), V2.clone().multiplyScalar(pn.h + 0.05 * M), V3.clone().multiplyScalar(0.08 * M));
        MT.setPosition(pn.a[0] + V1.x * e + V2.x * pn.h / 2, pn.a[1] + V1.y * e + V2.y * pn.h / 2 + 0.01 * M, pn.a[2] + V1.z * e + V2.z * pn.h / 2);
        posteInst.setMatrixAt(jp++, MT);
      }
    });
    gradeInst.instanceMatrix.needsUpdate = true;
    if (posteInst) posteInst.instanceMatrix.needsUpdate = true;
  }
  /* A PM DO ESTÁDIO: o guarda no posto; na invasão, a trilha dele (e o reforço, a partir da hora que entra) */
  function pms(t, tr) {
    const noCordao = new Set();
    for (const c of cordao) {
      const q = c.q, pm = c.pm;
      if (t < q.entra) continue;
      noCordao.add(pm);
      ondeNo(q.tr, t, O);
      pm.x = O.x; pm.y = O.z; pm.alt = O.y;
      if (O.anda) pm.rumo = Math.atan2(O.dx, O.dz);
      else if (O.olha) pm.rumo = Math.atan2(O.olha[0] - pm.x, O.olha[2] - pm.y);
      pm.escudo = O.modo !== 'anda';
      pm.carga = O.modo === 'carga';
      /* a cassetada: uma a cada 1,4 s no cordão em carga (fora de fase entre eles) */
      const ph = (tr + q.j * 0.37) % 1.4;
      pm.golpe = O.modo === 'carga' ? Math.max(0, 0.3 - ph) : 0;
      pm.cooldown = pm.golpe > 0 ? 0 : 1.5;
    }
    for (const e of A.estacoes) {
      const pm = guardaPM.get(e);
      if (noCordao.has(pm)) continue;
      pm.x = e.P[0]; pm.y = e.P[2]; pm.alt = e.P[1]; pm.rumo = e.rumo; pm.escudo = false; pm.carga = false; pm.golpe = 0;
    }
  }

  /* ======================================================
     O PAINEL E A CÂMERA
     ====================================================== */
  const hora = s => { const m = Math.floor(s / 60 + 1e-6); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const esc = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const naVia = v => v === 'corredor' ? 'pelo corredor de baixo' : 'pela arquibancada';
  /* o que a torcida faz no estádio (a linha dela no painel) */
  function linha(b) {
    const T = A.porBonde.get(b);
    if (!T) return '';
    const nb = T.gente.filter(g => T.papel[g.m] === 'bateria'), conta = tp => nb.filter(g => T.inst[g.m] === tp).length;
    const inst = [['surdo', 'surdos'], ['caixa', 'caixas'], ['repique', 'repiques']].map(([k, pl]) => { const n = conta(k); return n ? `${n} ${n === 1 ? k : pl}` : ''; }).filter(Boolean).join(', ');
    const partes = [];
    if (T.faixa || T.bandeira) partes.push([T.faixa ? `faixa de ${T.faixa.w.toFixed(1).replace('.', ',')} m` : '', T.bandeira ? 'bandeira' : ''].filter(Boolean).join(' e ') + ' na mureta');
    if (nb.length) partes.push(`bateria de ${nb.length} (nível ${T.nivel} da sede: ${inst})`);
    if (T.band.length) partes.push(`${T.band.length} bandeir${T.band.length === 1 ? 'ão' : 'ões'} de bambu`);
    partes.push(T.puxador.cima ? 'o puxador em cima da mureta' : 'o puxador na frente da torcida');
    const dec = A.decisoes.get(b);
    let d = '';
    if (dec) {
      if (dec.invade) d = ` <b>Vai tentar invadir ${naVia(dec.via)}</b>${inv.v ? ` (a ${esc(inv.v.t.sigla)} está do outro lado do isolamento)` : ''}${dec.porque === 'mandada' ? ' (mandado)' : ` (chance ${dec.chance}%, tirou ${dec.tirou})`}.`;
      else if (dec.porque === 'sorteio' && dec.chance) d = ` No estádio fica no lugar (a chance de invadir era ${dec.chance}%; tirou ${dec.tirou}).`;
      else if (dec.porque === 'longe') d = ' No estádio não encosta no isolamento: não tem como invadir.';
      else if (dec.porque === 'ninguém do outro lado') d = ' No estádio não tem rival dela do outro lado do isolamento: fica no lugar.';
      else if (dec.porque === 'sem rival') d = ' No estádio a torcida do outro lado do isolamento não é rival dela: fica no lugar.';
    }
    return `<small>No estádio: ${partes.join(', ')}.${d}</small>`;
  }
  /* o texto da invasão (um parágrafo do painel) */
  function texto() {
    if (!inv) {
      /* mandou invadir e ninguém foi: por quê */
      if (A.modo !== 'arquibancada' && A.modo !== 'corredor') return '';
      const ds = [...A.decisoes.values()], pelaVia = ds.filter(x => x.vias.includes(A.modo));
      const porque = !pelaVia.length ? `neste estádio nenhuma torcida do jogo encosta no isolamento ${naVia(A.modo)}`
        : pelaVia.every(x => x.porque === 'brigou na rua') ? 'as torcidas que encostam no isolamento por esse caminho já brigaram na rua (cada torcida entra em uma briga só)'
        : 'não achei por onde a linha de frente chega na grade';
      return `<p class="cj-aviso">Ninguém invade ${naVia(A.modo)}: ${porque}.</p>`;
    }
    const a = inv.a.t.sigla, v = inv.v ? inv.v.t.sigla : null, tt = inv.torcedores;
    const cord = `${inv.nPM} PMs (${inv.nGuardas} guardas do isolamento e ${inv.nRef} da revista, que entram ${inv.via === 'corredor' ? 'pela porta de serviço' : 'pela frente, vindo do campo'})`;
    let fimTxt;
    if (!inv.fura) fimTxt = `<b>A PM segura</b> (a chance de furar era ${Math.round(inv.pFura * 100)}%: força ${Math.round(inv.fA)} da ${esc(a)} contra ${Math.round(inv.fP)} do cordão): a ${esc(a)} volta pro lugar e deixa ${tt(inv.gente.feridosA)} no chão e ${tt(inv.gente.presosA)} presos; o cordão fica na grade quebrada.`;
    else fimTxt = `<b>A ${esc(a)} fura o cordão</b> (chance de ${Math.round(inv.pFura * 100)}%) e quebra a segunda grade${v && inv.nFront ? `: pancada com a frente da ${esc(v)} (${tt(inv.nFront)}), ${inv.venceA ? `a ${esc(a)} leva a melhor` : `a ${esc(v)} segura`}, até a PM se juntar e separar. Ficam no chão ${tt(inv.gente.feridosA)} da ${esc(a)} e ${tt(inv.gente.feridosV)} da ${esc(v)}; presos, ${tt(inv.gente.presosA)} e ${tt(inv.gente.presosV)}` : `, mas do outro lado não tem rival perto — a PM se junta e empurra de volta; ${tt(inv.gente.presosA)} presos`}.`;
    return `<p class="cj-aviso ruim">Às ${hora(inv.t0)}, com a bola rolando, a ${esc(a)} tenta invadir ${v ? `o setor da ${esc(v)}` : inv.a.lado === 'mandante' ? 'o lado do visitante' : 'o lado do mandante'} ${naVia(inv.via)}: ${tt(inv.nAtk)} correm pra grade do isolamento e empurram até ela ceder (às ${hora(inv.tQ1)}). A PM faz o cordão de isolamento com ${cord}. ${fimTxt} <button class="cen-bt" data-jogo="invasao">Ver a briga no estádio</button></p>`;
  }
  /* a linha de estado da torcida, na hora da invasão */
  function statusDe(b, t) {
    if (!inv || t < inv.t0 || t > inv.tFim + 20) return null;
    const onde = naVia(inv.via);
    if (b === inv.a) {
      if (t < inv.tPush) return `Invadindo ${onde}: correndo pra grade do isolamento`;
      if (t < inv.tQ1) return 'Empurrando a grade do isolamento';
      if (t < inv.tC + 2) return 'Quebrou a grade: o cordão da PM na frente';
      if (!inv.fura) return t < inv.tR ? 'Pancada no cordão da PM' : `A PM segurou: voltando pro lugar (${inv.torcedores(inv.gente.presosA)} presos, ${inv.torcedores(inv.gente.feridosA)} no chão)`;
      if (t < inv.tD2) return 'Furou o cordão: indo pra segunda grade';
      if (t < inv.tQ2) return 'Empurrando a segunda grade';
      if (t < inv.tS) return inv.v && inv.nFront ? `Pancada com a ${inv.v.t.sigla}` : 'Do outro lado do isolamento';
      return 'A PM separou: voltando pro lugar';
    }
    if (b === inv.v) {
      if (!inv.nFront) return null;
      if (!inv.fura) return t < inv.tR + 4 ? `A ${inv.a.t.sigla} quer invadir: a frente foi pra grade` : 'Voltando pro lugar';
      if (t < inv.tQ2) return `A ${inv.a.t.sigla} furou o cordão: a frente está na grade`;
      if (t < inv.tS) return `Pancada com a ${inv.a.t.sigla}`;
      return 'A PM separou: voltando pro lugar';
    }
    return null;
  }
  /* a câmera na invasão, e o corte do que fica em cima dela (o corredor fica embaixo da arquibancada) */
  const foco = () => inv ? { x: inv.centro[0], y: inv.centro[1], z: inv.centro[2], corredor: inv.via === 'corredor' } : null;
  function alvoDoCorte(t) {
    if (!inv || inv.via !== 'corredor' || !inv.foco || t < inv.t0 - 20 || t > inv.tFim + 20) return null;
    return { x: inv.centro[0], y: inv.centro[1], z: inv.centro[2] };
  }
  function limpar() {
    for (const ms of originais.values()) for (const o of ms) o.visible = true;
    originais.clear();
    if (!mapaGradil) matGradil.map.dispose();
    matGradil.dispose(); geoPainel.dispose(); matPoste.dispose(); geoPoste.dispose();
    for (const m of malhas) if (m.isInstancedMesh && m.geometry !== geoPainel && m.geometry !== geoPoste) { m.geometry.dispose(); m.material.dispose(); }
  }
  function estado(t) {
    const porT = A.lista.map(T => ({ sigla: T.b.t.sigla, setor: T.b.setor, nivel: T.nivel, bateria: T.gente.filter(g => T.papel[g.m] === 'bateria').length,
      inst: T.gente.filter(g => T.inst[g.m]).map(g => T.inst[g.m][0]).join(''), bandeiroes: T.band.length, faixa: T.faixa ? { w: +T.faixa.w.toFixed(1), abre: hora(T.faixa.tJunta), pendura: hora(T.faixa.tSolta) } : null,
      bandeira: T.bandeira ? { H: +T.bandeira.H.toFixed(2), pendura: hora(T.bandeira.tSolta) } : null, puxador: T.puxador.cima ? 'mureta' : 'fileira',
      linhas: [T.kMin, T.kMax], decisao: A.decisoes.get(T.b) ? { ...A.decisoes.get(T.b) } : null }));
    return { torcidas: porT, guardas: A.nGuardas, isolamentos: A.buffers.length,
      invasao: inv ? { via: inv.via, a: inv.a.t.sigla, v: inv.v ? inv.v.t.sigla : null, rival: inv.rival ? inv.rival.t.sigla : null, ini: hora(inv.t0), grade: hora(inv.tQ1), fim: hora(inv.tFim), fura: inv.fura, pFura: +inv.pFura.toFixed(2),
        nAtk: inv.nAtk, nFront: inv.nFront, nPM: inv.nPM, cordao: cordao.length, gente: inv.gente, grades: inv.grades.map(g => g.i), originais: [...originais.values()].reduce((s, l) => s + l.length, 0) } : null };
  }
  return { controla, pessoa, noLugar, gesto, quadro, linha, texto, statusDe, foco, alvoDoCorte, limpar, estado, get invasao() { return inv; } };
}
