/* =========================================================
   O GERADOR DE ESTÁDIOS LOW-POLY (14/11/2026)

   O dono: "Quero que cada estádio do jogo tenha esse nível de detalhismo e
   as cenas ocorram em um 3d lowpoly inspirado nesse projeto de criar
   estádios pro Football Manager [...] As cenas continuam ocorrendo vistas
   de cima, mas agora não mais numa imagem e sim nesses estádios lowpoly."

   Cada estádio é uma FICHA (fichas.mjs) em metros, no quadro do gramado:
   u ao longo do comprimento do campo (direita da imagem), v atravessado
   (pra cima da imagem), ângulos em graus a partir de +u, no sentido
   anti-horário (0 = atrás do gol da direita, 90 = lateral de cima, 180 =
   atrás do gol da esquerda, 270 = lateral de baixo). `norte` diz pra onde
   fica o norte nesse quadro (pro sol e pras fotos de conferência).

   A arquibancada é um ANEL entre dois contornos (retângulo de canto
   redondo ou elipse), cortado em TRECHOS por ângulo: cada trecho é
   arquibancada (com cor, mosaico, letreiro nas cadeiras e cobertura),
   passagem (chão de concreto, por onde se anda de um setor a outro) ou
   vazio. Vários anéis fazem os lances (inferior, superior).

   Sai daqui: a malha (three.js) pra ser fotografada de cima, a conta de
   onde se anda (a máscara da cena) e os marcadores do jogo (setores,
   grades, túneis, postos da PM, onde a faixa estende).
   ========================================================= */
const RAD = Math.PI / 180;
const CONCRETO = '#b4b2a9', CONCRETO_ESC = '#8d8b84';

/* o raio do contorno na direção `ang` (graus) */
export function raioDe(ang, c) {
  const dx = Math.cos(ang * RAD), dy = Math.sin(ang * RAD);
  if (c.forma === 'elipse') return c.a * c.b / Math.hypot(c.b * dx, c.a * dy);
  const ax = Math.abs(dx), ay = Math.abs(dy), r = Math.min(c.r || 0, c.a, c.b);
  if (ax > 1e-9) { const t = c.a / ax; if (t * ay <= c.b - r + 1e-9) return t; }
  if (ay > 1e-9) { const t = c.b / ay; if (t * ax <= c.a - r + 1e-9) return t; }
  const cx = c.a - r, cy = c.b - r, dc = ax * cx + ay * cy, cc = cx * cx + cy * cy - r * r;
  return dc + Math.sqrt(Math.max(0, dc * dc - cc));
}
const ponto = (ang, raio) => [Math.cos(ang * RAD) * raio, Math.sin(ang * RAD) * raio];
/* ANEL RETO (`reto: true` no anel de canto redondo): o ponto do contorno não é
   medido pelo raio e sim pelo LADO — nas retas a cadeira de trás fica bem
   atrás da cadeira da frente, e o corredor sai perpendicular ao campo, como
   nos estádios retangulares; só no canto ele abre em leque. */
function paramDe(ang, c) {
  const r = raioDe(ang, c), x = Math.cos(ang * RAD) * r, y = Math.sin(ang * RAD) * r, rr = Math.min(c.r || 0, c.a, c.b), ex = c.a - rr, ey = c.b - rr;
  const ax = Math.abs(x), ay = Math.abs(y), sx = x < 0 ? -1 : 1, sy = y < 0 ? -1 : 1;
  if (ax <= ex + 1e-6) return { tipo: 'h', sy, t: ex ? x / ex : 0 };
  if (ay <= ey + 1e-6) return { tipo: 'v', sx, t: ey ? y / ey : 0 };
  return { tipo: 'c', sx, sy, phi: Math.atan2(ay - ey, ax - ex) };
}
function pontoPor(pm, c) {
  const rr = Math.min(c.r || 0, c.a, c.b), ex = c.a - rr, ey = c.b - rr;
  if (pm.tipo === 'h') return [pm.t * ex, pm.sy * c.b];
  if (pm.tipo === 'v') return [pm.sx * c.a, pm.t * ey];
  return [pm.sx * (ex + rr * Math.cos(pm.phi)), pm.sy * (ey + rr * Math.sin(pm.phi))];
}
const mod360 = a => ((a % 360) + 360) % 360;
const dentroDoArco = (ang, de, ate) => { const a = mod360(ang - de); return a <= mod360(ate - de) || (ate - de) >= 360; };
function semente(n) { let s = n >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* =========================================================
   O LANCE DE ARQUIBANCADA, CADEIRA POR CADEIRA (dono, 14/11/2026, com as
   fotos do Castelão: "adicione mais realismo colocando assentos nas
   arquibancadas, escadaria entre lance de arquibancadas, pequeno corredor
   vazio entre arquibancada e alambrado, vomitório que dá acesso ao
   corredor [...] que também pode ser por lá a briga").

   De dentro pra fora, cada lance tem: o ALAMBRADO (o corrimão de ferro), o
   CORREDOR vazio da frente (2,4 m, plano), e as FILEIRAS subindo, uma
   cadeira a cada 0,75 m e uma fileira a cada 0,9 m. De tantos em tantos
   metros desce uma ESCADA; e em escadas alternadas abre um VOMITÓRIO: a
   boca escura que sai de baixo da arquibancada e dá no corredor.
   ========================================================= */
const PASSO_FILEIRA = 0.9, LARG_CADEIRA = 0.75, FRENTE = 2.4;
const def = (...vs) => vs.find(v => v !== undefined);
function medidasDe(ficha, anel, t, arco, prof) {
  const frente = def(t.corredorFrente, anel.corredorFrente, ficha.corredorFrente, prof >= 7 ? FRENTE : 0);
  const n = Math.max(3, Math.ceil(arco / (t.celula || anel.celula || ficha.celula || LARG_CADEIRA)));
  const N = Math.max(2, Math.round((prof - frente) / (t.passoFileira || anel.passoFileira || ficha.passoFileira || PASSO_FILEIRA)));
  const larguraCel = arco / n, passo = (prof - frente) / N, fc = Math.min(0.6, frente / prof);
  const corr = t.corredor === 0 ? 0 : Math.max(6, Math.round((t.corredor || 16) / larguraCel));
  const esc = Math.max(1, Math.round(1.3 / larguraCel));
  /* os vomitórios: em escadas alternadas; sem escada, de 30 em 30 m */
  const vs = def(t.vomitorios, anel.vomitorios, ficha.vomitorios, {});
  const vomCentros = [], vomMeia = Math.max(1, ((vs && vs.larg) || 3.8) / larguraCel / 2), vomRows = Math.max(2, Math.round(((vs && vs.fundo) || 3.8) / passo));
  if (vs !== false && frente > 0 && N >= 6) {
    const margem = vomMeia + 3;
    if (corr) { const cada = vs.cada || 2; for (let j = 1; j * corr < n; j++) { const c = j * corr + esc / 2; if (j % cada === cada - 1 && c > margem && c < n - margem) vomCentros.push(c); }
      if (!vomCentros.length) { const j = Math.max(1, Math.round(n / corr / 2)), c = j * corr + esc / 2; if (c > margem && c < n - margem) vomCentros.push(c); } }
    else { const d = Math.max(8, Math.round((vs.dist || 30) / larguraCel)); for (let c = d / 2; c < n - margem; c += d) if (c > margem) vomCentros.push(c); }
  }
  const naBoca = i => vomCentros.some(c => Math.abs(i + 0.5 - c) <= vomMeia);
  return { n, N, Nold: t.fileiras || anel.fileiras || 14, prof, arco, frente, fc, passo, larguraCel, corr, esc, vomCentros, vomMeia, vomRows,
    escada: i => (!!t.escadaNaBorda && i < esc) || (!!corr && i > 0 && (i % corr) < esc),
    noVomitorio: (i, k) => k < vomRows && naBoca(i), sobreVomitorio: (i, k) => k === vomRows && naBoca(i) };
}
/* as medidas de um trecho de anel, mais onde cai cada coluna (`pos`, `angs`, `angEm`) */
export function colunasDe(ficha, anel, t) {
  const cd = t.dentro || anel.dentro, cf = t.fora || anel.fora, vao = t.ate - t.de, meio = (t.de + t.ate) / 2;
  const prof = Math.max(1, raioDe(meio, cf) - raioDe(meio, cd)), arco = vao * RAD * (raioDe(meio, cd) + raioDe(meio, cf)) / 2;
  const G = medidasDe(ficha, anel, t, arco, prof), n = G.n;
  const reto = t.reto !== false && !!(anel.reto || t.reto) && cd.forma !== 'elipse' && cf.forma !== 'elipse';
  const pos = reto ? (ang, f) => { const pm = paramDe(ang, cd), a = pontoPor(pm, cd), b = pontoPor(pm, cf); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
                   : (ang, f) => { const r0 = raioDe(ang, cd), r1 = raioDe(ang, cf); return ponto(ang, r0 + (r1 - r0) * f); };
  const angs = [];
  if (reto) { /* colunas de largura igual, medidas pela beira de dentro */
    const MS = Math.max(180, n * 4), ac = [0]; let ant = pos(t.de, 0);
    for (let j = 1; j <= MS; j++) { const q = pos(t.de + vao * j / MS, 0); ac.push(ac[j - 1] + Math.hypot(q[0] - ant[0], q[1] - ant[1])); ant = q; }
    for (let i = 0, j = 0; i <= n; i++) { const alvo = ac[MS] * i / n; while (j < MS - 1 && ac[j + 1] < alvo) j++;
      angs.push(t.de + vao * (j + (ac[j + 1] > ac[j] ? (alvo - ac[j]) / (ac[j + 1] - ac[j]) : 0)) / MS); }
  } else for (let i = 0; i <= n; i++) angs.push(t.de + vao * i / n);
  G.pos = pos; G.angs = angs;
  G.angEm = ci => { const j = Math.min(n - 1, Math.max(0, Math.floor(ci))); return angs[j] + (angs[j + 1] - angs[j]) * (ci - j); };
  return G;
}

/* o trecho do anel que cobre este ângulo */
export function trechoEm(anel, ang) { return anel.trechos.find(t => dentroDoArco(ang, t.de, t.ate)) || null; }
/* todo o miolo de arquibancada da ficha, de dentro pra fora */
export const limites = ficha => ({ dentro: ficha.aneis[0].dentro, fora: ficha.aneis[ficha.aneis.length - 1].fora });

/* ONDE SE ANDA: em cima de arquibancada ou de passagem (em metros, no quadro do gramado) */
export function andavel(ficha, u, v) {
  const d = Math.hypot(u, v); if (d < 1e-6) return false;
  const ang = Math.atan2(v, u) / RAD;
  const ult = ficha.aneis.length - 1;
  for (let ia = 0; ia <= ult; ia++) {
    const anel = ficha.aneis[ia], t = trechoEm(anel, ang); if (!t || t.tipo === 'vazio') continue;
    const r0 = raioDe(ang, t.dentro || anel.dentro), r1 = raioDe(ang, t.fora || anel.fora);
    /* (só a beira de dentro do primeiro anel e a de fora do último encolhem: anéis encostados não deixam fresta) */
    if (d >= r0 + (ia === 0 ? 0.4 : -0.3) && d <= r1 - (ia === ult ? 0.4 : -0.3)) return true;
  }
  for (const t of ficha.retas || []) {
    const a = t.ang * RAD, du = u - t.u, dv = v - t.v, x = -du * Math.sin(a) + dv * Math.cos(a), y = du * Math.cos(a) + dv * Math.sin(a);
    if (Math.abs(x) <= t.comp / 2 - 0.4 && y >= -0.6 && y <= t.prof - 0.4) return true;
  }
  for (const p of ficha.passarelas || []) { if (Math.abs(u - p.u) <= p.w / 2 && Math.abs(v - p.v) <= p.d / 2) return true; }
  return false;
}

export function construir(THREE, ficha) {
  const cena = new THREE.Group(), coberturas = new THREE.Group();
  const cor = h => new THREE.Color(h);
  const mat = (h, extra) => new THREE.MeshLambertMaterial(Object.assign({ color: cor(h) }, extra || {}));
  const sombra = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const caixa = (w, h, d, c, x, y, z, grupo) => { const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c))); m.position.set(x, y, z); (grupo || cena).add(m); return m; };
  /* (u, v, altura) da ficha → (x, y, z) do three: v pra cima da imagem é −z */
  const P = (u, v, h) => [u, h, -v];

  /* ---- malha de faces coloridas ---- */
  function Malha() {
    const pos = [], cores = [];
    const c0 = new THREE.Color();
    return {
      quad(a, b, c, d, h) { c0.set(h); for (const p of [a, b, c, a, c, d]) { pos.push(p[0], p[1], p[2]); cores.push(c0.r, c0.g, c0.b); } },
      malha(extra) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
        g.computeVertexNormals();
        return sombra(new THREE.Mesh(g, new THREE.MeshLambertMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, extra || {}))));
      },
      get vazia() { return !pos.length; }
    };
  }

  /* ---- o chão, a esplanada e o gramado ---- */
  const ch = ficha.chao || {};
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(ch.cor || '#8f8f8a')); m.rotation.x = -Math.PI / 2; m.position.y = -0.05; m.receiveShadow = true; cena.add(m); }
  const M = Malha(), lim = limites(ficha);
  const anelPlano = (c0, c1, altura, h, passo) => {
    for (let a = 0; a < 360; a += passo) {
      const r0a = c0 ? raioDe(a, c0) : 0, r0b = c0 ? raioDe(a + passo, c0) : 0, r1a = raioDe(a, c1), r1b = raioDe(a + passo, c1);
      const p = (ang, r) => { const q = ponto(ang, r); return P(q[0], q[1], altura); };
      M.quad(p(a, r0a), p(a, r1a), p(a + passo, r1b), p(a + passo, r0b), h);
    }
  };
  if (ch.esplanada) anelPlano(null, ch.esplanada, 0.02, ch.corEsplanada || '#cfc8b4', 3);
  /* a margem entre o gramado e a arquibancada (grama, ou a pista de atletismo) */
  const cp = ficha.campo || {}, C = cp.c || 105, L = cp.l || 68;
  anelPlano(null, lim.dentro, 0.06, cp.corMargem || '#4f9a58', 3);
  if (cp.pista) { anelPlano(cp.pista.dentro, cp.pista.fora, 0.08, cp.pista.cor || '#b5533c', 3);
    if (cp.corFosso) anelPlano(cp.pista.fora, lim.dentro, 0.07, cp.corFosso, 3);
    /* as raias */
    for (let k = 1; k < (cp.pista.raias || 0); k++) { const f = k / cp.pista.raias, mix = c => ({ forma: c.forma, a: 0, b: 0, r: 0 });
      const c0 = cp.pista.dentro, c1 = cp.pista.fora, m = { forma: c0.forma, a: c0.a + (c1.a - c0.a) * f, b: c0.b + (c1.b - c0.b) * f, r: (c0.r || 0) + ((c1.r || 0) - (c0.r || 0)) * f };
      anelPlano({ forma: m.forma, a: m.a - 0.12, b: m.b - 0.12, r: Math.max(0, m.r - 0.12) }, { forma: m.forma, a: m.a + 0.12, b: m.b + 0.12, r: m.r + 0.12 }, 0.085, '#e9d9d2', 3); }
  }
  /* as ondas pintadas no chão atrás dos gols (Morumbi) */
  for (const o of cp.ondas || []) for (const sg of (o.lados || [-1, 1])) {
    const nn = 28, uf = v => sg * (o.u + o.amp * Math.sin(v / o.v * Math.PI * (o.ciclos || 1.5) + (o.fase || 0)));
    for (let i = 0; i < nn; i++) { const v0 = -o.v + 2 * o.v * i / nn, v1 = -o.v + 2 * o.v * (i + 1) / nn, e = o.larg / 2;
      M.quad(P(uf(v0) - e, v0, 0.09), P(uf(v0) + e, v0, 0.09), P(uf(v1) + e, v1, 0.09), P(uf(v1) - e, v1, 0.09), o.cor); }
  }
  /* o gramado em faixas */
  const NF = 14;
  for (let i = 0; i < NF; i++) {
    const u0 = -C / 2 + C * i / NF, u1 = u0 + C / NF;
    M.quad(P(u0, -L / 2, 0.1), P(u1, -L / 2, 0.1), P(u1, L / 2, 0.1), P(u0, L / 2, 0.1), i % 2 ? '#3f9450' : '#47a05a');
  }
  /* as linhas */
  const linha = (u0, v0, u1, v1, e) => { e = e || 0.35; const du = u1 - u0, dv = v1 - v0, q = Math.hypot(du, dv) || 1, nx = -dv / q * e, ny = du / q * e;
    M.quad(P(u0 - nx, v0 - ny, 0.13), P(u1 - nx, v1 - ny, 0.13), P(u1 + nx, v1 + ny, 0.13), P(u0 + nx, v0 + ny, 0.13), '#f3f3ee'); };
  const ret = (u0, v0, u1, v1) => { linha(u0, v0, u1, v0); linha(u1, v0, u1, v1); linha(u1, v1, u0, v1); linha(u0, v1, u0, v0); };
  ret(-C / 2, -L / 2, C / 2, L / 2); linha(0, -L / 2, 0, L / 2);
  for (const s of [-1, 1]) { ret(s * C / 2, -20.15, s * (C / 2 - 16.5), 20.15); ret(s * C / 2, -9.16, s * (C / 2 - 5.5), 9.16);
    caixa(1.6, 2.44, 7.32, '#f6f6f2', s * (C / 2 + 0.8), 1.22, 0); }
  for (let a = 0; a < 360; a += 15) { const p = ponto(a, 9.15), q = ponto(a + 15, 9.15); linha(p[0], p[1], q[0], q[1], 0.3); }
  cena.add(M.malha());

  /* ---- os anéis de arquibancada ---- */
  const A = Malha(), R = Malha(), Ro = Malha(), Pm = Malha();
  /* a cor de cada cadeira de um trecho de n × N cadeiras */
  const pintorDe = (t, G, rnd) => {
    const n = G.n, N = G.N, kf = N / G.Nold;
    let letreiro = null;
    if (t.texto) {
      const cv = document.createElement('canvas'); cv.width = n; cv.height = N;
      const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, n, N);
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const alt = Math.round(N * (t.textoAltura || 0.62));
      x.font = `bold ${alt}px "Arial Black", "DejaVu Sans", "Arial", sans-serif`;
      const larg = x.measureText(t.texto).width, cabe = n * (t.textoLargura || 0.8);
      x.save(); x.translate(n / 2, N * (t.textoMeio || 0.5)); x.scale(Math.min(3.2, cabe / larg), 1); x.fillText(t.texto, 0, 0); x.restore();
      letreiro = x.getImageData(0, 0, n, N).data;
    }
    const nTopo = t.faixaTopo ? Math.max(1, Math.round(t.faixaTopo.n * kf)) : 0, nBase = t.faixaBase ? Math.max(1, Math.round(t.faixaBase.n * kf)) : 0;
    const bloco = Math.max(1, Math.round((t.bloco || 10) * 1.7 / G.larguraCel)), blocoF = Math.max(1, Math.round((t.blocoFileiras || 99) * kf));
    return (i, k) => {
      if (letreiro) { const bx = n - 1 - i, by = N - 1 - k; if (letreiro[(by * n + bx) * 4] > 110) return t.corTexto || '#ffffff'; }
      if (nTopo && k >= N - nTopo) return t.faixaTopo.cor;
      if (nBase && k < nBase) return t.faixaBase.cor;
      if (t.padrao === 'mosaico') return rnd() < (t.mistura || 0.45) ? (t.cor2 || '#ffffff') : t.cor;
      if (t.padrao === 'blocos') return (Math.floor(i / bloco) + Math.floor(k / blocoF)) % 2 ? (t.cor2 || t.cor) : t.cor;
      if (t.padrao === 'vazias') return rnd() < (t.mistura || 0.5) ? CONCRETO : t.cor;
      /* faixas pintadas no degrau, de baixo pra cima (a arquibancada listrada da Ilha do Retiro) */
      /* faixas por fração da fundura: [[até onde (0 a 1), cor], ...] (o lado descoberto da Ilha: preto, vermelho no alto e o friso amarelo) */
      if (t.padrao === 'fracoes') { const f = (k + 0.5) / N; for (const [ate, c] of t.fracoes) if (f <= ate) return c; return t.fracoes[t.fracoes.length - 1][1]; }
      if (t.padrao === 'faixas') { const nf = Math.max(1, Math.round((t.faixaM || 3) / G.passo)); return t.cores[Math.floor(k / nf) % t.cores.length]; }
      /* degradê de baixo pra cima, salpicado (Maracanã: amarelo, azul, branco) */
      if (t.padrao === 'degrade') { const cs = t.cores, q = (k + 0.5) / N * (cs.length - 1) + (rnd() - 0.5) * (t.mistura == null ? 1 : t.mistura) * 1.6;
        return cs[Math.max(0, Math.min(cs.length - 1, Math.round(q)))]; }
      return t.cor;
    };
  };
  /* O LANCE: alambrado, corredor da frente, fileiras de cadeiras, escadas e
     vomitórios. `Q(coluna, fração de dentro pra fora, altura)` dá o ponto. */
  const ctL = new THREE.Color(), tomL = (h, f) => '#' + ctL.set(h).multiplyScalar(f).getHexString();
  function desenharLance(t, G, h0, h1, Q, corDe) {
    const { n, N, fc } = G, piso = t.corPiso || ficha.corPiso || '#c1bfb6', ferro = t.corAlambrado || ficha.corAlambrado || '#8b9297';
    const fr = fc > 0 ? Math.min(fc * 0.3, 0.32 / G.prof) : 0;
    const q4 = (i0, i1, f0, f1, h, c) => A.quad(Q(i0, f0, h), Q(i0, f1, h), Q(i1, f1, h), Q(i1, f0, h), c);
    for (let i = 0; i < n; i++) {
      if (fc > 0) { q4(i, i + 1, 0, fc, h0, i % 2 ? piso : tomL(piso, 0.975)); q4(i, i + 1, 0, fr, h0 + 1.1, ferro); }
      const escada = G.escada(i);
      for (let k = 0; k < N; k++) {
        const f0 = fc + (1 - fc) * k / N, f1 = fc + (1 - fc) * (k + 1) / N, df = f1 - f0, sobe = (h1 - h0) / N, hk = h0 + sobe * (k + 0.5), hk1 = hk + sobe;
        if (G.noVomitorio(i, k)) { q4(i, i + 1, f0, f1, h0 - 0.02, '#232427'); continue; }
        if (escada) { const ce = t.corEscada || ficha.corEscada; q4(i, i + 1, f0, f0 + df / 2, hk - sobe / 2, ce || '#d9d7ce'); q4(i, i + 1, f0 + df / 2, f1, hk, ce ? tomL(ce, 0.78) : '#a9a79e'); }
        else {
          const degrau = tomL(t.semCadeiras ? corDe(i, k) : CONCRETO, (k % 2 ? 0.95 : 1) * (0.92 + 0.08 * k / N));
          q4(i, i + 1, f0, f1, hk, degrau);
          if (G.sobreVomitorio(i, k)) q4(i, i + 1, f0, f0 + df * 0.42, hk + 1, '#dddbd2');   /* o parapeito em cima da boca */
          else if (!t.semCadeiras) { const c = corDe(i, k), luz = 0.9 + 0.1 * k / N;
            q4(i + 0.12, i + 0.88, f0 + df * 0.10, f0 + df * 0.58, hk + 0.45, tomL(c, luz * 0.94));     /* o assento */
            q4(i + 0.12, i + 0.88, f0 + df * 0.58, f0 + df * 0.80, hk + 0.9, tomL(c, Math.min(1.25, luz * 1.1))); } /* o encosto */
        }
        if (k < N - 1 && !G.noVomitorio(i, k + 1)) A.quad(Q(i, f1, hk), Q(i, f1, hk1), Q(i + 1, f1, hk1), Q(i + 1, f1, hk), CONCRETO_ESC);
      }
    }
  }
  ficha.aneis.forEach((anel, ia) => {
    const rnd = semente(1234 + ia * 77 + (ficha.id || '').length * 13);
    for (const t of anel.trechos) {
      if (t.tipo === 'vazio') continue;
      const cd = t.dentro || anel.dentro, cf = t.fora || anel.fora;
      const vao = (t.ate - t.de);
      const rm = (raioDe((t.de + t.ate) / 2, cd) + raioDe((t.de + t.ate) / 2, cf)) / 2;
      const arco = vao * RAD * rm;
      if (t.tipo === 'passagem') {
        const n = Math.max(2, Math.ceil(vao / 3));
        for (let i = 0; i < n; i++) {
          const a0 = t.de + vao * i / n, a1 = t.de + vao * (i + 1) / n;
          const p = (ang, c, h) => { const q = ponto(ang, raioDe(ang, c)); return P(q[0], q[1], h == null ? (t.alt || 0.12) : h); };
          A.quad(p(a0, cd), p(a0, cf), p(a1, cf), p(a1, cd), t.cor || CONCRETO);
          /* (a laje alta — a galeria de cima — ganha a parede de fora) */
          if (t.alt > 1) Pm.quad(p(a0, cf, 0), p(a1, cf, 0), p(a1, cf), p(a0, cf), t.corFachada || (ficha.fachada && ficha.fachada.cor) || '#c9c6bb');
        }
        continue;
      }
      const [h0, h1] = t.h || anel.h;
      const G = colunasDe(ficha, anel, t), n = G.n, angs = G.angs, pos = G.pos, prof = G.prof;
      const p = (ang, f, h) => { const q = pos(ang, f); return P(q[0], q[1], h); };
      desenharLance(t, G, h0, h1, (ci, f, h) => p(G.angEm(ci), f, h), pintorDe(t, G, rnd));
      for (let i = 0; i < n; i++) {
        const a0 = angs[i], a1 = angs[i + 1];
        /* a mureta da frente e a parede de trás */
        Pm.quad(p(a0, 0, 0), p(a0, 0, h0 + 1.1), p(a1, 0, h0 + 1.1), p(a1, 0, 0), t.corMureta || ficha.corMureta || '#d9d7cf');
        if (ia === ficha.aneis.length - 1 || t.paredeAtras) {
          const hf = h1 + (t.parapeito == null ? 1.2 : t.parapeito), cf2 = t.corFachada || (ficha.fachada && ficha.fachada.cor) || '#c9c6bb';
          Pm.quad(p(a0, 1, 0), p(a1, 1, 0), p(a1, 1, hf), p(a0, 1, hf), cf2);
          Pm.quad(p(a0, 1, hf), p(a1, 1, hf), p(a1, 1 - 0.8 / prof, hf), p(a0, 1 - 0.8 / prof, hf), cf2);
        }
      }
      /* as laterais do trecho (onde ele acaba em degrau) */
      for (const [ang, viz] of [[t.de, t.de - 0.5], [t.ate, t.ate + 0.5]]) {
        const outro = trechoEm(anel, viz);
        if (outro && outro !== t && outro.tipo !== 'passagem' && outro.tipo !== 'vazio') continue;
        Pm.quad(p(ang, 0, 0), p(ang, 1, 0), p(ang, 1, h1), p(ang, 0, h0), t.corFachada || CONCRETO_ESC);
      }
      /* as bocas de acesso (as caixinhas de concreto no meio da arquibancada) */
      if (t.bocas) { const bc = t.bocas, f = bc.f == null ? 0.3 : bc.f;
        for (let a = t.de + bc.cada / 2; a < t.ate; a += bc.cada) { const r = raioDe(a, cd) + (raioDe(a, cf) - raioDe(a, cd)) * f, w = ponto(a, r), hb = h0 + (h1 - h0) * f + 1.7;
          const m = caixa(bc.d || 5, hb, bc.w || 4, bc.cor || CONCRETO, w[0], hb / 2, -w[1]); m.rotation.y = a * RAD; } }
      /* a cobertura do trecho */
      const cb = t.cobertura;
      if (cb) {
        const nn = Math.max(3, Math.ceil(vao / 4)), av = cb.avanco == null ? 2 : cb.avanco, hc = cb.h, cai = cb.cai == null ? 2.5 : cb.cai;
        for (let i = 0; i < nn; i++) {
          const a0 = t.de + vao * i / nn, a1 = t.de + vao * (i + 1) / nn;
          const q = (ang, dr, h) => { const w = ponto(ang, raioDe(ang, cf) + dr); return P(w[0], w[1], h); };
          const tom = cb.listras && i % 2 ? (cb.cor2 || '#e9e9e4') : (cb.cor || '#f1f1ec');
          const RR = cb.opaca ? Ro : R;
          RR.quad(q(a0, av, hc), q(a1, av, hc), q(a1, -cb.larg, hc - cai), q(a0, -cb.larg, hc - cai), tom);
          RR.quad(q(a0, av, hc), q(a1, av, hc), q(a1, av, hc - 1.4), q(a0, av, hc - 1.4), cb.corBorda || tom);
          /* a treliça de cada módulo */
          if (cb.trelica !== false && i % 2 === 0) { const w0 = ponto(a0, raioDe(a0, cf) + av), w1 = ponto(a0, raioDe(a0, cf) - cb.larg);
            const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(w1[0] - w0[0], w1[1] - w0[1]), 0.5, 0.35), mat(cb.corTrelica || '#8a8f93')));
            m.position.set((w0[0] + w1[0]) / 2, hc - cai / 2 + 0.3, -(w0[1] + w1[1]) / 2); m.rotation.y = Math.atan2(w1[1] - w0[1], w1[0] - w0[0]); coberturas.add(m); }
        }
        /* os pilares de trás */
        if (cb.pilares !== false) for (let i = 0; i <= nn; i += 2) { const a0 = t.de + vao * i / nn, w = ponto(a0, raioDe(a0, cf) + av - 0.6); caixa(0.7, hc, 0.7, cb.corPilar || '#9a9a96', w[0], hc / 2, -w[1]); }
      }
    }
  });
  /* ---- as arquibancadas RETAS (um bloco reto de cadeiras: `u, v` é o meio da
     beira da frente, `ang` pra onde ela sobe, `comp` de ponta a ponta, `prof` da frente ao fundo) ---- */
  (ficha.retas || []).forEach((t, it) => {
    const rnd = semente(4321 + it * 91), a = t.ang * RAD, ox = Math.cos(a), oy = Math.sin(a), tx = -Math.sin(a), ty = Math.cos(a);
    const [h0, h1] = t.h, G = medidasDe(ficha, {}, t, t.comp, t.prof), n = G.n;
    const p = (fi, fk, h) => { const x = -t.comp / 2 + t.comp * fi, y = t.prof * fk; return P(t.u + tx * x + ox * y, t.v + ty * x + oy * y, h); };
    desenharLance(t, G, h0, h1, (ci, f, h) => p(ci / n, f, h), pintorDe(t, G, rnd));
    const hf = h1 + (t.parapeito == null ? 1.2 : t.parapeito), cf2 = t.corFachada || (ficha.fachada && ficha.fachada.cor) || '#c9c6bb';
    Pm.quad(p(0, 0, t.base || 0), p(0, 0, h0 + 1.1), p(1, 0, h0 + 1.1), p(1, 0, t.base || 0), t.corMureta || ficha.corMureta || '#d9d7cf');
    Pm.quad(p(0, 1, 0), p(1, 1, 0), p(1, 1, hf), p(0, 1, hf), cf2);
    for (const fi of [0, 1]) Pm.quad(p(fi, 0, t.base || 0), p(fi, 1, 0), p(fi, 1, h1), p(fi, 0, h0), t.corLado || CONCRETO_ESC);
  });
  /* ---- a cobertura em ANEL inteiro (Maracanã): de um contorno de fora até a boca de dentro, em gomos ---- */
  for (const cb of ficha.coberturasAnel || []) {
    const n = cb.n || 60, hf = cb.h, hd = cb.h - (cb.cai || 0), prof = raioDe(0, cb.fora) - raioDe(0, cb.dentro);
    const pt = (ang, f, dh) => { const r0 = raioDe(ang, cb.dentro), r1 = raioDe(ang, cb.fora), q = ponto(ang, r0 + (r1 - r0) * f); return P(q[0], q[1], hd + (hf - hd) * f + (dh || 0)); };
    const faixa = (f0, f1, c1, c2, dh) => { for (let i = 0; i < n; i++) { const a0 = 360 * i / n, a1 = 360 * (i + 1) / n; R.quad(pt(a0, f0, dh), pt(a0, f1, dh), pt(a1, f1, dh), pt(a1, f0, dh), i % 2 ? (c2 || c1) : c1); } };
    const ff = cb.bordaFora ? cb.bordaFora.larg / prof : 0, fd = cb.bordaDentro ? cb.bordaDentro.larg / prof : 0;
    faixa(fd, 1 - ff, cb.cor || '#f4f3ee', cb.cor2);
    if (ff) faixa(1 - ff, 1, cb.bordaFora.cor); if (fd) faixa(0, fd, cb.bordaDentro.cor);
    for (const an of cb.aneis || []) faixa(an.f, an.f + an.larg / prof, an.cor, null, 0.2);
    /* as nervuras entre os gomos */
    if (cb.nervuras !== false) for (let i = 0; i < n; i++) { const a = 360 * i / n, e = 0.16; R.quad(pt(a - e, fd, 0.12), pt(a - e, 1 - ff, 0.12), pt(a + e, 1 - ff, 0.12), pt(a + e, fd, 0.12), cb.corNervura || '#cfcfc8'); }
    /* a borda de fora e a de dentro, de pé */
    for (let i = 0; i < n; i++) { const a0 = 360 * i / n, a1 = 360 * (i + 1) / n;
      R.quad(pt(a0, 1, 0), pt(a1, 1, 0), pt(a1, 1, -2.2), pt(a0, 1, -2.2), (cb.bordaFora && cb.bordaFora.cor) || cb.cor || '#f4f3ee');
      R.quad(pt(a0, 0, 0), pt(a1, 0, 0), pt(a1, 0, -1.2), pt(a0, 0, -1.2), (cb.bordaDentro && cb.bordaDentro.cor) || cb.cor || '#f4f3ee'); }
  }
  if (!Ro.vazia) cena.add(Ro.malha());
  if (!A.vazia) cena.add(A.malha());
  if (!Pm.vazia) cena.add(Pm.malha());
  if (!R.vazia) coberturas.add(R.malha());

  /* ---- a fachada de pilares (Castelão) ---- */
  const fc = ficha.fachada || {};
  if (fc.pilares) {
    const n = fc.pilares.n, alt = fc.pilares.h, c = fc.pilares.contorno || lim.fora;
    for (let i = 0; i < n; i++) {
      const a = 360 * i / n, w0 = ponto(a, raioDe(a, c) + (fc.pilares.pe || 9)), w1 = ponto(a, raioDe(a, c) + (fc.pilares.topo || 1));
      const comp = Math.hypot(w1[0] - w0[0], w1[1] - w0[1], alt);
      const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(fc.pilares.esp || 1.1, comp, fc.pilares.fundo || 2.2), mat(fc.pilares.cor || '#f4f4ef')));
      m.position.set((w0[0] + w1[0]) / 2, alt / 2, -(w0[1] + w1[1]) / 2);
      m.rotation.order = 'YXZ'; m.rotation.y = -a * RAD + Math.PI / 2; m.rotation.x = -Math.atan2(Math.hypot(w1[0] - w0[0], w1[1] - w0[1]), alt);
      cena.add(m);
    }
  }
  /* ---- os refletores, o placar e as peças soltas ---- */
  for (const r of ficha.refletores || []) {
    const [u, v, h] = r; caixa(0.9, h, 0.9, '#8d9093', u, h / 2, -v);
    const p = caixa(6, 3.4, 0.7, '#d9dcdf', u, h + 1.2, -v); p.rotation.y = Math.atan2(v, -u) + Math.PI / 2;
  }
  /* os pórticos de luz (Morumbi): dois pilares e a treliça deitada em cima, rente à beira de fora */
  for (const pp of ficha.porticos || []) {
    const r = raioDe(pp.ang, lim.fora) + (pp.dr == null ? 2 : pp.dr), c = ponto(pp.ang, r), a = pp.ang * RAD, tx = -Math.sin(a), ty = Math.cos(a), cr = pp.cor || '#e6e8ea';
    for (const sg of [-1, 1]) caixa(1.8, pp.h, 1.8, cr, c[0] + tx * sg * pp.larg / 2, pp.h / 2, -(c[1] + ty * sg * pp.larg / 2));
    for (const [dy, alt, esp] of [[0, 0.9, 3.2], [4.2, 0.9, 3.2]]) { const m = caixa(pp.larg + 6, alt, esp, cr, c[0], pp.h + dy, -c[1]); m.rotation.y = (pp.ang + 90) * RAD; }
    const nb = Math.round(pp.larg / 4); for (let i = 0; i <= nb; i++) { const x = -pp.larg / 2 + pp.larg * i / nb; caixa(0.5, 4.2, 0.5, cr, c[0] + tx * x, pp.h + 2.1, -(c[1] + ty * x)); }
    const luz = caixa(pp.larg * 0.86, 3, 0.9, '#f7f9fb', c[0] - Math.cos(a) * 1.4, pp.h + 2.1, -(c[1] - Math.sin(a) * 1.4)); luz.rotation.y = (pp.ang + 90) * RAD;
  }
  for (const b of ficha.blocos || []) {
    const grupo = b.cobertura ? coberturas : cena;
    const m = caixa(b.w, b.h, b.d, b.cor || '#c9c6bb', b.u, (b.y || 0) + b.h / 2, -b.v, grupo); if (b.giro) m.rotation.y = b.giro * RAD;
    /* o letreiro pintado em cima (a cobertura da Neo Química Arena) */
    if (b.texto) {
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.max(64, Math.round(1024 * b.d / b.w));
      const x = cv.getContext('2d'); x.fillStyle = b.corTexto || '#3a3c40'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const linhas = b.texto.split('|'), px = Math.round(cv.height * (b.textoAltura || 0.42)); x.font = `bold ${px}px "DejaVu Sans", "Arial", sans-serif`;
      const larg = Math.max(...linhas.map(l => x.measureText(l).width)), cabe = 1024 * (b.textoLargura || 0.6);
      linhas.forEach((l, i) => { x.save(); x.translate(512 + 1024 * (b.textoU || 0), cv.height * (b.textoMeio || 0.5) + (i - (linhas.length - 1) / 2) * px * 1.05); x.scale(Math.min(1, cabe / larg), 1);
        x.textAlign = b.textoAlinha || 'center'; x.fillText(l, b.textoAlinha === 'left' ? -larg / 2 : 0, 0); x.restore(); });
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.d), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      pl.rotation.order = 'YXZ'; pl.rotation.x = -Math.PI / 2; pl.rotation.y = ((b.giro || 0) + (b.textoGiro || 0)) * RAD; pl.position.set(b.u, (b.y || 0) + b.h + 0.08, -b.v); grupo.add(pl);
    }
  }
  for (const p of ficha.passarelas || []) { const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.d), mat(p.cor || CONCRETO)); m.rotation.x = -Math.PI / 2; m.position.set(p.u, 0.11, -p.v); m.receiveShadow = true; cena.add(m); }

  /* ---- o entorno: prédios, casas, piscina, árvores, ruas ---- */
  const rnd = semente(99 + (ficha.id || '').length);
  for (const e of ficha.entorno || []) {
    if (e.tipo === 'predio') {
      const m = caixa(e.w, e.h, e.d, e.cor || '#b9bbbd', e.u, e.h / 2, -e.v); if (e.giro) m.rotation.y = e.giro * RAD;
      const andares = Math.floor(e.h / 6);
      for (let k = 1; k < andares; k++) { const f = caixa(e.w + 0.3, 1.1, e.d + 0.3, e.cor2 || '#5f6b78', e.u, k * 6, -e.v); if (e.giro) f.rotation.y = e.giro * RAD; }
    } else if (e.tipo === 'casas') {
      for (let i = 0; i < e.nu; i++) for (let j = 0; j < e.nv; j++) {
        if (rnd() < (e.falha || 0.08)) continue;
        const w = e.passo * (0.62 + rnd() * 0.22), d = e.passo * (0.62 + rnd() * 0.22), h = 3 + rnd() * 2.5;
        const u = e.u + (i - (e.nu - 1) / 2) * e.passo, v = e.v + (j - (e.nv - 1) / 2) * e.passo;
        caixa(w, h, d, '#a9a6a0', u, h / 2, -v); caixa(w + 0.8, 0.9, d + 0.8, ['#c96a4b', '#d17a5a', '#b85c40', '#cfcabd'][Math.floor(rnd() * 4)], u, h + 0.45, -v);
      }
    } else if (e.tipo === 'piscina') {
      caixa(e.w + 3, 0.3, e.d + 3, '#d8d5c8', e.u, 0.15, -e.v); caixa(e.w, 0.2, e.d, '#3aa6d8', e.u, 0.32, -e.v);
    } else if (e.tipo === 'quadra') {
      caixa(e.w, 0.15, e.d, e.cor || '#4f9a58', e.u, 0.1, -e.v);
    } else if (e.tipo === 'rua') {
      const du = e.ate[0] - e.de[0], dv = e.ate[1] - e.de[1], q = Math.hypot(du, dv);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(q, e.larg || 9), mat(e.cor || '#5d5e61')); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(dv, du);
      m.position.set((e.de[0] + e.ate[0]) / 2, 0.01, -(e.de[1] + e.ate[1]) / 2); m.receiveShadow = true; cena.add(m);
    } else if (e.tipo === 'arvores') {
      for (let i = 0; i < e.n; i++) { const u = e.u + (rnd() - 0.5) * e.w, v = e.v + (rnd() - 0.5) * e.d, r = 2.4 + rnd() * 2;
        caixa(0.6, 3, 0.6, '#6b5a45', u, 1.5, -v);
        const m = sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(['#3f8a47', '#4a9a52', '#357a3e'][Math.floor(rnd() * 3)], { flatShading: true }))); m.position.set(u, 3 + r * 0.7, -v); cena.add(m); }
    } else if (e.tipo === 'cupula') {
      const c = sombra(new THREE.Mesh(new THREE.CylinderGeometry(e.r, e.r, e.h, 30), mat(e.cor2 || '#c9c6bb'))); c.position.set(e.u, e.h / 2, -e.v); cena.add(c);
      const t = sombra(new THREE.Mesh(new THREE.ConeGeometry(e.r * 1.05, e.h * 0.5, 30), mat(e.cor || '#efeee8', { flatShading: true }))); t.position.set(e.u, e.h * 1.25, -e.v); cena.add(t);
      const o = sombra(new THREE.Mesh(new THREE.CylinderGeometry(e.r * 0.16, e.r * 0.16, 1.2, 12), mat('#bfc2c4'))); o.position.set(e.u, e.h * 1.5, -e.v); cena.add(o);
    } else if (e.tipo === 'grama') {
      const m = caixa(e.w, 0.12, e.d, e.cor || '#6f9a55', e.u, 0.04, -e.v); if (e.giro) m.rotation.y = e.giro * RAD;
    } else if (e.tipo === 'estacionamento') {
      caixa(e.w, 0.1, e.d, e.cor || '#66676a', e.u, 0.03, -e.v);
      const CARROS = ['#d9d9d6', '#2f3033', '#8f9396', '#b8322e', '#27507f', '#e9e9e6'];
      for (let v = -e.d / 2 + 5; v < e.d / 2 - 3; v += 13) { caixa(e.w - 4, 0.06, 0.3, '#d8d8d2', e.u, 0.1, -(e.v + v + 3));
        for (let u = -e.w / 2 + 3; u < e.w / 2 - 2; u += 2.9) for (const sg of [0, 6]) if (rnd() < (e.cheio == null ? 0.45 : e.cheio)) caixa(2, 1.4, 4.3, CARROS[Math.floor(rnd() * CARROS.length)], e.u + u, 0.8, -(e.v + v + sg)); }
    } else if (e.tipo === 'agua') {
      caixa(e.w, 0.1, e.d, '#3f6f86', e.u, 0.03, -e.v);
    }
  }
  return { cena, coberturas };
}

/* =========================================================
   OS MARCADORES DO JOGO, tirados da ficha: onde nasce cada bonde, as
   grades que separam a visitante, os túneis, os postos da PM e onde a
   faixa estende. `paraPx(u, v)` leva metros pro pixel da imagem.
   ========================================================= */
export function marcadores(ficha, paraPx, pxPorMetro) {
  const lim = limites(ficha), j = ficha.jogo;
  /* de onde até onde vai a arquibancada NESTE ângulo (cada trecho pode ter a sua fundura, e um anel pode não existir ali) */
  const contornoEm = ang => { let d = null, f = null; for (const anel of ficha.aneis) { const t = trechoEm(anel, ang); if (!t || t.tipo === 'vazio') continue; if (!d) d = t.dentro || anel.dentro; f = t.fora || anel.fora; } return { d: d || lim.dentro, f: f || lim.fora }; };
  const noMeio = (ang, f) => { const c = contornoEm(ang), r0 = raioDe(ang, c.d), r1 = raioDe(ang, c.f), q = ponto(ang, r0 + (r1 - r0) * f); return paraPx(q[0], q[1]); };
  const pt = (ang, f) => { const p = noMeio(ang, f); return { x: Math.round(p[0]), y: Math.round(p[1]) }; };
  const meio = arco => (arco[0] + arco[1]) / 2;
  const dirPx = (ang, sinal) => { const a = paraPx(0, 0), b = paraPx(Math.cos(ang * RAD), Math.sin(ang * RAD)), q = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [+(sinal * (b[0] - a[0]) / q).toFixed(2), +(sinal * (b[1] - a[1]) / q).toFixed(2)]; };
  const spawns = [], faixas = {};
  const bonde = (id, rot, lado, ang, entrada, jogador) => {
    spawns.push(Object.assign({ id, rot, lado, entrada }, pt(ang, 0.5), jogador ? { jogador: true } : {}));
    const q = ponto(ang, raioDe(ang, contornoEm(ang).d) + 0.7), p = paraPx(q[0], q[1]);
    faixas[id] = { x: Math.round(p[0]), y: Math.round(p[1]), len: 130, dir: dirPx(ang, -1) };
  };
  bonde('mandante1', 'MANDANTE 1º ESCALÃO', 'mandante', meio(j.mandante1), 'portao_mandante', true);
  if (j.mandante2) bonde('mandante2', 'MANDANTE 2º ESCALÃO', 'mandante', meio(j.mandante2), 'portao_mandante');
  if (j.mandante3) bonde('mandante3', 'MANDANTE 3º ESCALÃO', 'mandante', meio(j.mandante3), 'portao_mandante');
  const [vd, va] = j.visitante;
  bonde('visitante1', 'VISITANTE 1º ESCALÃO', 'visitante', vd + (va - vd) * 0.5, 'portao_visitante');
  bonde('visitante2', 'VISITANTE 2º ESCALÃO', 'visitante', vd + (va - vd) * 0.22, 'portao_visitante');
  bonde('visitante3', 'VISITANTE 3º ESCALÃO', 'visitante', vd + (va - vd) * 0.78, 'portao_visitante');
  /* o túnel é o vomitório do lance de baixo mais perto do ângulo pedido (sem vomitório ali, o fundo da arquibancada) */
  const vomitorioEm = ang => {
    const anel = ficha.aneis[0], t = trechoEm(anel, ang); if (!t || t.tipo) return null;
    const G = colunasDe(ficha, anel, t); if (!G.vomCentros.length) return null;
    let melhor = null; for (const c of G.vomCentros) { const a = G.angEm(c), d = Math.abs(((a - ang + 540) % 360) - 180); if (!melhor || d < melhor.d) melhor = { a, d }; }
    const q = G.pos(melhor.a, G.fc + (1 - G.fc) * (G.vomRows * 0.45) / G.N), p = paraPx(q[0], q[1]);
    return { x: Math.round(p[0]), y: Math.round(p[1]), ang: melhor.a };
  };
  const tunel = (id, rot, lado, ang) => { const v = vomitorioEm(ang);
    return v ? { id, rot, lado, raio: 40, dir: dirPx(v.ang, 1), x: v.x, y: v.y } : Object.assign({ id, rot, lado, raio: 40, dir: dirPx(ang, 1) }, pt(ang, 0.9)); };
  const entradas = [tunel('portao_mandante', 'TÚNEL MANDANTE', 'mandante', j.tunelMandante == null ? meio(j.mandante1) : j.tunelMandante),
                    tunel('portao_visitante', 'TÚNEL VISITANTE', 'visitante', j.tunelVisitante == null ? meio(j.visitante) : j.tunelVisitante)];
  const grades = [vd, va].map((ang, i) => { const a = pt(ang, 0.04), b = pt(ang, 0.96);
    return { id: 'div_v' + (i + 1), rot: 'DIVISÓRIA', de: a, ate: b, modulos: Math.max(3, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 28)), espessura: 10 }; });
  const folga = j.folgaPM || 7;
  const pmPostos = [pt(vd - folga, 0.35), pt(vd - folga, 0.7), pt(va + folga, 0.35), pt(va + folga, 0.7)];
  /* a torcida que tem lugar certo no estádio (`jogo.torcidas`: id da torcida → o setor dela) */
  return Object.assign({ faixas, spawns, entradas, pmPostos, grades }, j.torcidas ? { setorDaTorcida: j.torcidas } : {});
}

/* a máscara da cena (192 × 128 células de 8 px), no formato do jogo: por
   linha, quantas células bloqueadas, quantas livres, quantas bloqueadas… */
export function mascara(ficha, paraMetros, W, H, cel) {
  const linhas = [];
  for (let r = 0; r < H / cel; r++) {
    const partes = []; let v = 0, n = 0;
    for (let c = 0; c < W / cel; c++) {
      let livres = 0;
      for (const [dx, dy] of [[2, 2], [6, 2], [2, 6], [6, 6], [4, 4]]) { const m = paraMetros(c * cel + dx, r * cel + dy); if (andavel(ficha, m[0], m[1])) livres++; }
      const livre = livres >= 4 ? 1 : 0;
      if (livre === v) n++; else { partes.push(n); v = livre; n = 1; }
    }
    partes.push(n); linhas.push(partes.join(','));
  }
  return linhas.join(';');
}
