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
const mod360 = a => ((a % 360) + 360) % 360;
const dentroDoArco = (ang, de, ate) => { const a = mod360(ang - de); return a <= mod360(ate - de) || (ate - de) >= 360; };
function semente(n) { let s = n >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* o trecho do anel que cobre este ângulo */
export function trechoEm(anel, ang) { return anel.trechos.find(t => dentroDoArco(ang, t.de, t.ate)) || null; }
/* todo o miolo de arquibancada da ficha, de dentro pra fora */
export const limites = ficha => ({ dentro: ficha.aneis[0].dentro, fora: ficha.aneis[ficha.aneis.length - 1].fora });

/* ONDE SE ANDA: em cima de arquibancada ou de passagem (em metros, no quadro do gramado) */
export function andavel(ficha, u, v) {
  const d = Math.hypot(u, v); if (d < 1e-6) return false;
  const ang = Math.atan2(v, u) / RAD;
  for (const anel of ficha.aneis) {
    const t = trechoEm(anel, ang); if (!t || t.tipo === 'vazio') continue;
    const r0 = raioDe(ang, t.dentro || anel.dentro), r1 = raioDe(ang, t.fora || anel.fora);
    if (d >= r0 + 0.4 && d <= r1 - 0.4) return true;
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
  if (cp.pista) { anelPlano(cp.pista.dentro, cp.pista.fora, 0.08, cp.pista.cor || '#b5533c', 3); }
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
  const A = Malha(), R = Malha(), Pm = Malha();
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
          const p = (ang, c) => { const q = ponto(ang, raioDe(ang, c)); return P(q[0], q[1], 0.12); };
          A.quad(p(a0, cd), p(a0, cf), p(a1, cf), p(a1, cd), t.cor || CONCRETO);
        }
        continue;
      }
      const [h0, h1] = t.h || anel.h, N = t.fileiras || anel.fileiras || 14;
      const n = Math.max(3, Math.ceil(arco / (t.celula || 1.7)));
      /* o letreiro nas cadeiras: um desenho de n × N "cadeiras" */
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
      const corr = t.corredor === 0 ? 0 : Math.max(6, Math.round((t.corredor || 16) / (arco / n)));
      const corDe = (i, k) => {
        if (corr && i % corr === 0 && i > 0) return CONCRETO;
        if (letreiro) { const bx = n - 1 - i, by = N - 1 - k; if (letreiro[(by * n + bx) * 4] > 110) return t.corTexto || '#ffffff'; }
        if (t.faixaTopo && k >= N - t.faixaTopo.n) return t.faixaTopo.cor;
        if (t.faixaBase && k < t.faixaBase.n) return t.faixaBase.cor;
        if (t.padrao === 'mosaico') return rnd() < (t.mistura || 0.45) ? (t.cor2 || '#ffffff') : t.cor;
        if (t.padrao === 'blocos') return (Math.floor(i / (t.bloco || 10)) + Math.floor(k / (t.blocoFileiras || 99))) % 2 ? (t.cor2 || t.cor) : t.cor;
        if (t.padrao === 'vazias') return rnd() < (t.mistura || 0.5) ? CONCRETO : t.cor;
        return t.cor;
      };
      /* (de cima o degrau não aparece: a fileira de trás de cada par sai um tom abaixo, e a arquibancada clareia pro alto) */
      const ct = new THREE.Color(), tom = (h, f) => '#' + ct.set(h).multiplyScalar(f).getHexString();
      for (let i = 0; i < n; i++) {
        const a0 = t.de + vao * i / n, a1 = t.de + vao * (i + 1) / n;
        const r0a = raioDe(a0, cd), r1a = raioDe(a0, cf), r0b = raioDe(a1, cd), r1b = raioDe(a1, cf);
        for (let k = 0; k < N; k++) {
          const f0 = k / N, f1 = (k + 1) / N, hk = h0 + (h1 - h0) * (k + 0.5) / N, hk1 = h0 + (h1 - h0) * (k + 1.5) / N;
          const p = (ang, ra, rb, f, h) => { const q = ponto(ang, ra + (rb - ra) * f); return P(q[0], q[1], h); };
          A.quad(p(a0, r0a, r1a, f0, hk), p(a0, r0a, r1a, f1, hk), p(a1, r0b, r1b, f1, hk), p(a1, r0b, r1b, f0, hk), tom(corDe(i, k), (k % 2 ? 0.9 : 1) * (0.9 + 0.1 * k / N)));
          if (k < N - 1) A.quad(p(a0, r0a, r1a, f1, hk), p(a0, r0a, r1a, f1, hk1), p(a1, r0b, r1b, f1, hk1), p(a1, r0b, r1b, f1, hk), CONCRETO_ESC);
        }
        /* a mureta da frente e a parede de trás */
        const q = (ang, r, h) => { const w = ponto(ang, r); return P(w[0], w[1], h); };
        Pm.quad(q(a0, r0a, 0), q(a0, r0a, h0 + (h1 - h0) * 0.5 / N + 0.9), q(a1, r0b, h0 + (h1 - h0) * 0.5 / N + 0.9), q(a1, r0b, 0), t.corMureta || ficha.corMureta || '#d9d7cf');
        if (ia === ficha.aneis.length - 1 || t.paredeAtras) {
          const hf = h1 + (t.parapeito == null ? 1.2 : t.parapeito), cf2 = t.corFachada || (ficha.fachada && ficha.fachada.cor) || '#c9c6bb';
          Pm.quad(q(a0, r1a, 0), q(a1, r1b, 0), q(a1, r1b, hf), q(a0, r1a, hf), cf2);
          Pm.quad(q(a0, r1a, hf), q(a1, r1b, hf), q(a1, r1b - 0.8, hf), q(a0, r1a - 0.8, hf), cf2);
        }
      }
      /* as laterais do trecho (onde ele acaba em degrau) */
      for (const [ang, viz] of [[t.de, t.de - 0.5], [t.ate, t.ate + 0.5]]) {
        const outro = trechoEm(anel, viz);
        if (outro && outro !== t && outro.tipo !== 'passagem' && outro.tipo !== 'vazio') continue;
        const r0 = raioDe(ang, cd), r1 = raioDe(ang, cf), q = (r, h) => { const w = ponto(ang, r); return P(w[0], w[1], h); };
        Pm.quad(q(r0, 0), q(r1, 0), q(r1, h1), q(r0, h0), t.corFachada || CONCRETO_ESC);
      }
      /* a cobertura do trecho */
      const cb = t.cobertura;
      if (cb) {
        const nn = Math.max(3, Math.ceil(vao / 4)), av = cb.avanco == null ? 2 : cb.avanco, hc = cb.h, cai = cb.cai == null ? 2.5 : cb.cai;
        for (let i = 0; i < nn; i++) {
          const a0 = t.de + vao * i / nn, a1 = t.de + vao * (i + 1) / nn;
          const q = (ang, dr, h) => { const w = ponto(ang, raioDe(ang, cf) + dr); return P(w[0], w[1], h); };
          const tom = cb.listras && i % 2 ? (cb.cor2 || '#e9e9e4') : (cb.cor || '#f1f1ec');
          R.quad(q(a0, av, hc), q(a1, av, hc), q(a1, -cb.larg, hc - cai), q(a0, -cb.larg, hc - cai), tom);
          R.quad(q(a0, av, hc), q(a1, av, hc), q(a1, av, hc - 1.4), q(a0, av, hc - 1.4), cb.corBorda || tom);
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
  for (const b of ficha.blocos || []) { const m = caixa(b.w, b.h, b.d, b.cor || '#c9c6bb', b.u, (b.y || 0) + b.h / 2, -b.v, b.cobertura ? coberturas : cena); if (b.giro) m.rotation.y = b.giro * RAD; }
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
  const noMeio = (ang, f) => { const r0 = raioDe(ang, lim.dentro), r1 = raioDe(ang, lim.fora), q = ponto(ang, r0 + (r1 - r0) * f); return paraPx(q[0], q[1]); };
  const pt = (ang, f) => { const p = noMeio(ang, f); return { x: Math.round(p[0]), y: Math.round(p[1]) }; };
  const meio = arco => (arco[0] + arco[1]) / 2;
  const dirPx = (ang, sinal) => { const a = paraPx(0, 0), b = paraPx(Math.cos(ang * RAD), Math.sin(ang * RAD)), q = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [+(sinal * (b[0] - a[0]) / q).toFixed(2), +(sinal * (b[1] - a[1]) / q).toFixed(2)]; };
  const spawns = [], faixas = {};
  const bonde = (id, rot, lado, ang, entrada, jogador) => {
    spawns.push(Object.assign({ id, rot, lado, entrada }, pt(ang, 0.5), jogador ? { jogador: true } : {}));
    const q = ponto(ang, raioDe(ang, lim.dentro) + 2.2), p = paraPx(q[0], q[1]);
    faixas[id] = { x: Math.round(p[0]), y: Math.round(p[1]), len: 130, dir: dirPx(ang, -1) };
  };
  bonde('mandante1', 'MANDANTE 1º ESCALÃO', 'mandante', meio(j.mandante1), 'portao_mandante', true);
  if (j.mandante2) bonde('mandante2', 'MANDANTE 2º ESCALÃO', 'mandante', meio(j.mandante2), 'portao_mandante');
  if (j.mandante3) bonde('mandante3', 'MANDANTE 3º ESCALÃO', 'mandante', meio(j.mandante3), 'portao_mandante');
  const [vd, va] = j.visitante;
  bonde('visitante1', 'VISITANTE 1º ESCALÃO', 'visitante', vd + (va - vd) * 0.5, 'portao_visitante');
  bonde('visitante2', 'VISITANTE 2º ESCALÃO', 'visitante', vd + (va - vd) * 0.22, 'portao_visitante');
  bonde('visitante3', 'VISITANTE 3º ESCALÃO', 'visitante', vd + (va - vd) * 0.78, 'portao_visitante');
  const tunel = (id, rot, lado, ang) => Object.assign({ id, rot, lado, raio: 40, dir: dirPx(ang, 1) }, pt(ang, 0.9));
  const entradas = [tunel('portao_mandante', 'TÚNEL MANDANTE', 'mandante', j.tunelMandante == null ? meio(j.mandante1) : j.tunelMandante),
                    tunel('portao_visitante', 'TÚNEL VISITANTE', 'visitante', j.tunelVisitante == null ? meio(j.visitante) : j.tunelVisitante)];
  const grades = [vd, va].map((ang, i) => { const a = pt(ang, 0.04), b = pt(ang, 0.96);
    return { id: 'div_v' + (i + 1), rot: 'DIVISÓRIA', de: a, ate: b, modulos: Math.max(3, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 28)), espessura: 10 }; });
  const folga = j.folgaPM || 7;
  const pmPostos = [pt(vd - folga, 0.35), pt(vd - folga, 0.7), pt(va + folga, 0.35), pt(va + folga, 0.7)];
  return { faixas, spawns, entradas, pmPostos, grades };
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
