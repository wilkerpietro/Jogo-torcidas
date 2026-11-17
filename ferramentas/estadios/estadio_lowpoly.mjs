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

/* O CONTORNO MEDIDO PONTO A PONTO (`forma: 'raios'`; dono, 15/11/2026, o Mineirão: "observe detalhadamente a imagem do mapa
   pra planta da arquibancada vista de cima ser extremamente fiel ao mapa"): `raios` é a lista dos raios, em metros, medidos
   do meio do campo em ângulos iguais a partir de 0 (120 raios = um a cada 3 graus); entre dois, interpola. `a` e `b` (o raio em
   0 e em 90 graus, mais ou menos) só servem pras câmeras de conferência. Conta como contorno curvo, como a elipse: as
   colunas saem do meio do campo (nada de `reto` nem de `normal`). */
const curva = c => c.forma === 'elipse' || c.forma === 'raios';
/* o raio do contorno na direção `ang` (graus) */
export function raioDe(ang, c) {
  if (c.forma === 'raios') { const n = c.raios.length, p = (((ang % 360) + 360) % 360) / 360 * n, i = Math.floor(p), f = p - i;
    return c.raios[i % n] * (1 - f) + c.raios[(i + 1) % n] * f; }
  const dx = Math.cos(ang * RAD), dy = Math.sin(ang * RAD);
  if (c.forma === 'elipse') {
    /* a elipse pode estar FORA DO CENTRO (`cu`, `cv`): é o que faz a arquibancada mais funda de um lado que do outro (o Arruda) */
    if (c.cu || c.cv) { const cu = c.cu || 0, cv = c.cv || 0, A = dx * dx / (c.a * c.a) + dy * dy / (c.b * c.b), B = -2 * (dx * cu / (c.a * c.a) + dy * cv / (c.b * c.b)), C = cu * cu / (c.a * c.a) + cv * cv / (c.b * c.b) - 1;
      return (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A); }
    return c.a * c.b / Math.hypot(c.b * dx, c.a * dy);
  }
  const ax = Math.abs(dx), ay = Math.abs(dy), r = Math.min(c.r || 0, c.a, c.b);
  if (ax > 1e-9) { const t = c.a / ax; if (t * ay <= c.b - r + 1e-9) return t; }
  if (ay > 1e-9) { const t = c.b / ay; if (t * ax <= c.a - r + 1e-9) return t; }
  /* CANTO CHANFRADO (`chanfro: true`; o Raulino de Oliveira, que é um octógono): o canto é uma reta de (a, b - r) a (a - r, b),
     no lugar do quarto de círculo */
  if (c.chanfro) return (c.a + c.b - r) / (ax + ay);
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
  /* (no chanfro, `phi` é a fração do caminho pela reta do canto, de 0 a 90 graus) */
  if (c.chanfro) return { tipo: 'c', sx, sy, phi: Math.max(0, Math.min(1, rr ? (ay - ey) / rr : 0)) * Math.PI / 2 };
  return { tipo: 'c', sx, sy, phi: Math.atan2(ay - ey, ax - ex) };
}
function pontoPor(pm, c) {
  const rr = Math.min(c.r || 0, c.a, c.b), ex = c.a - rr, ey = c.b - rr;
  if (pm.tipo === 'h') return [pm.t * ex, pm.sy * c.b];
  if (pm.tipo === 'v') return [pm.sx * c.a, pm.t * ey];
  if (c.chanfro) { const f = pm.phi / (Math.PI / 2); return [pm.sx * (ex + rr * (1 - f)), pm.sy * (ey + rr * f)]; }
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
    /* `em`: as bocas em lugares certos do trecho (fração do comprimento; 0 e 1 dão meia boca na divisa, que fecha com a do vizinho) */
    if (vs.em) vs.em.forEach(f => vomCentros.push(Math.max(0, Math.min(1, f)) * n));
    else if (corr) { const cada = vs.cada || 2; for (let j = 1; j * corr < n; j++) { const c = j * corr + esc / 2; if (j % cada === cada - 1 && c > margem && c < n - margem) vomCentros.push(c); }
      if (!vomCentros.length) { const j = Math.max(1, Math.round(n / corr / 2)), c = j * corr + esc / 2; if (c > margem && c < n - margem) vomCentros.push(c); } }
    else { const d = Math.max(8, Math.round((vs.dist || 30) / larguraCel)); for (let c = d / 2; c < n - margem; c += d) if (c > margem) vomCentros.push(c); }
  }
  const naBoca = i => vomCentros.some(c => Math.abs(i + 0.5 - c) <= vomMeia);
  /* a boca pode abrir no MEIO do lance (`vomitorios.f`, fração da fundura; 0 = na frente, dando no corredor) */
  const vomK0 = Math.round(Math.max(0, Math.min(0.8, (vs && vs.f) || 0)) * N);
  return { n, N, Nold: t.fileiras || anel.fileiras || 14, prof, arco, frente, fc, passo, larguraCel, corr, esc, vomCentros, vomMeia, vomRows,
    /* a cor do fundo da boca e do parapeito em cima dela (`vomitorios.cor`, `vomitorios.corParapeito`: as bocas vermelhas do Mineirão) */
    vomCor: (vs && vs.cor) || '#232427', vomParapeito: (vs && vs.corParapeito) || '#dddbd2',
    escada: i => (!!t.escadaNaBorda && i < esc) || (!!corr && i > 0 && (i % corr) < esc),
    vomK0, noVomitorio: (i, k) => k >= vomK0 && k < vomK0 + vomRows && naBoca(i), sobreVomitorio: (i, k) => k === vomK0 + vomRows && naBoca(i) };
}
/* as medidas de um trecho de anel, mais onde cai cada coluna (`pos`, `angs`, `angEm`) */
export function colunasDe(ficha, anel, t) {
  const cd = t.dentro || anel.dentro, cf = t.fora || anel.fora, vao = t.ate - t.de, meio = (t.de + t.ate) / 2;
  const prof = Math.max(1, raioDe(meio, cf) - raioDe(meio, cd)), arco = vao * RAD * (raioDe(meio, cd) + raioDe(meio, cf)) / 2;
  const G = medidasDe(ficha, anel, t, arco, prof), n = G.n;
  const reto = t.reto !== false && !!(anel.reto || t.reto) && !curva(cd) && !curva(cf);
  /* `normal: true` (anel ou trecho, com a beira de dentro em retângulo de canto redondo): a escada sai PERPENDICULAR à beira de
     dentro e vai reta até o fundo, seja qual for o desenho do fundo. É o caso da arquibancada cujas fileiras acompanham a
     beira do campo e cujo fundo corta as fileiras (mais funda no meio, rasa nas pontas: o Willie Davids; dono, 15/11/2026:
     "as listras de escadaria entre os blocos ficou esquisito e infiel à realidade" — no anel reto de fundo não concêntrico a
     escada saía torta). Dois trechos vizinhos dividem a mesma linha de divisa, mesmo com fundos diferentes. */
  const normal = !!def(t.normal, anel.normal, false) && !curva(cd), memo = new Map();
  const peloNormal = ang => { let q = memo.get(ang); if (q) return q;
    const pm = paramDe(ang, cd), a = pontoPor(pm, cd), ph = cd.chanfro ? Math.PI / 4 : pm.phi, nx = pm.tipo === 'h' ? 0 : pm.tipo === 'v' ? pm.sx : pm.sx * Math.cos(ph), ny = pm.tipo === 'h' ? pm.sy : pm.tipo === 'v' ? 0 : pm.sy * Math.sin(ph);
    const fora = s => { const x = a[0] + nx * s, y = a[1] + ny * s; return Math.hypot(x, y) - raioDe(Math.atan2(y, x) / RAD, cf); };
    let s0 = 0, s1 = 4; while (fora(s1) < 0 && s1 < 400) s1 *= 2;
    for (let k = 0; k < 40; k++) { const m = (s0 + s1) / 2; if (fora(m) < 0) s0 = m; else s1 = m; }
    q = [a, [a[0] + nx * s1, a[1] + ny * s1]]; if (memo.size < 20000) memo.set(ang, q); return q; };
  const pos0 = normal ? (ang, f) => { const [a, b] = peloNormal(ang); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
            : reto ? (ang, f) => { const pm = paramDe(ang, cd), a = pontoPor(pm, cd), b = pontoPor(pm, cf); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
                   : (ang, f) => { const r0 = raioDe(ang, cd), r1 = raioDe(ang, cf); return ponto(ang, r0 + (r1 - r0) * f); };
  /* `fecha: k` no trecho (a tribuna do Lacerdão; dono, 17/11/2026: a arquibancada coberta é "Triangular"): o lance FECHA PRA
     TRÁS em volta do MEIO DELE — a fileira da frente tem a largura toda e a do fundo, `k` vezes ela (0,5 = metade), com as
     paredes dos lados em diagonal. (O trapézio de `fora` com `a` menor fecha em volta do meio do CAMPO; este, do meio do trecho.) */
  let pos = pos0;
  if (t.fecha != null && t.fecha < 1) { const m = f => { const a = pos0(t.de, f), b = pos0(t.ate, f); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }, k = t.fecha;
    pos = (ang, f) => { const q = pos0(ang, f), c = m(f), s = 1 - f * (1 - k); return [c[0] + (q[0] - c[0]) * s, c[1] + (q[1] - c[1]) * s]; }; }
  const angs = [];
  if (reto || normal) { /* colunas de largura igual, medidas pela beira de dentro */
    const MS = Math.max(180, n * 4), ac = [0]; let ant = pos(t.de, 0);
    for (let j = 1; j <= MS; j++) { const q = pos(t.de + vao * j / MS, 0); ac.push(ac[j - 1] + Math.hypot(q[0] - ant[0], q[1] - ant[1])); ant = q; }
    for (let i = 0, j = 0; i <= n; i++) { const alvo = ac[MS] * i / n; while (j < MS - 1 && ac[j + 1] < alvo) j++;
      angs.push(t.de + vao * (j + (ac[j + 1] > ac[j] ? (alvo - ac[j]) / (ac[j + 1] - ac[j]) : 0)) / MS); }
  } else for (let i = 0; i <= n; i++) angs.push(t.de + vao * i / n);
  G.pos = pos; G.angs = angs;
  /* a fundura de verdade NESTE ângulo: da beira de dentro ao fundo, pelo caminho que a coluna faz (dono, 15/11/2026, o Barão de
     Serra Negra: "tem um desnível na arquibancada lateral que não tem sentido, deve ser reto" — a altura saía da fundura medida
     do centro do campo, que numa arquibancada reta cresce pras pontas, e o topo fazia barriga) */
  G.fundura = ang => { const a = pos(ang, 0), b = pos(ang, 1); return Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1])); };
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
    const anel = ficha.aneis[ia];
    /* `andarReto: true` (anel `reto` de arquibancada RETANGULAR e funda, longe do centro — o Bruno Daniel): o trecho vale pelo
       pé da perpendicular na beira de dentro, como no desenho, e não pelo ângulo visto do centro; sem isso sobra uma cunha de
       chão invisível depois de cada ponta da arquibancada. */
    if (anel.andarReto) {
      let achou = false;
      for (const t of anel.trechos) { if (t.tipo === 'vazio') continue;
        /* (o fundo pode ser elipse — o muro enviesado do Jorjão —; só a beira de dentro tem de ser retângulo de canto redondo) */
        const cd = t.dentro || anel.dentro, cf = t.fora || anel.fora; if (curva(cd)) continue;
        const cx = Math.max(-(cd.a - cd.r), Math.min(cd.a - cd.r, u)), cy = Math.max(-(cd.b - cd.r), Math.min(cd.b - cd.r, v)), dd = Math.hypot(u - cx, v - cy);
        if (dd < cd.r - 0.3) continue;
        const fx = cx + (u - cx) / dd * cd.r, fy = cy + (v - cy) / dd * cd.r;
        if (!dentroDoArco(Math.atan2(fy, fx) / RAD, t.de, t.ate)) continue;
        if (d <= raioDe(ang, cf) - (ia === ult ? 0.4 : -0.3)) { achou = true; break; } }
      if (achou) return true; continue;
    }
    const t = trechoEm(anel, ang); if (!t || t.tipo === 'vazio') continue;
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
  /* uma barra redonda entre dois pontos `[u, v, altura]` (os arcos, os mastros e os pilares das coberturas) */
  const barra = (a, b, esp, c, grupo) => { const va = new THREE.Vector3(...P(a[0], a[1], a[2])), vb = new THREE.Vector3(...P(b[0], b[1], b[2])), d = vb.clone().sub(va), len = d.length();
    if (len < 0.05) return; const m = sombra(new THREE.Mesh(new THREE.CylinderGeometry(esp / 2, esp / 2, len, 7), mat(c)));
    m.position.copy(va.add(vb).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); (grupo || cena).add(m); };

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
  const A = Malha(), R = Malha(), Ro = Malha(), Pm = Malha(), R0 = R;
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
      /* `pinta(x, y, rnd)`: a ficha pinta as cadeiras por conta dela (o mosaico da bandeira do Pará no Mangueirão). `x` vai de
         0 a 1 da esquerda pra direita DE QUEM OLHA DO CAMPO, `y` de 0 (a fileira da frente) a 1 (a do fundo); devolve a cor,
         ou nada pra deixar a pintura de sempre. */
      if (t.pinta) { const c = t.pinta((n - 1 - i + 0.5) / n, (k + 0.5) / N, rnd); if (c) return c; }
      if (t.padrao === 'mosaico') return rnd() < (t.mistura || 0.45) ? (t.cor2 || '#ffffff') : t.cor;
      if (t.padrao === 'blocos') return (Math.floor(i / bloco) + Math.floor(k / blocoF)) % 2 ? (t.cor2 || t.cor) : t.cor;
      if (t.padrao === 'vazias') return rnd() < (t.mistura || 0.5) ? CONCRETO : t.cor;
      /* faixas pintadas no degrau, de baixo pra cima (a arquibancada listrada da Ilha do Retiro) */
      /* redemoinho: faixas tortas que dão a volta no estádio (a pintura tricolor do Arruda). `bandas`: [[cor, graus], ...];
         `fase`: onde a primeira começa; `torcao`: quantos graus a faixa anda da frente ao fundo */
      if (t.padrao === 'redemoinho') { const bs = t.bandas, tot = bs.reduce((q, b) => q + b[1], 0);
        let a = ((G.angEm ? G.angEm(i + 0.5) : 0) - (t.fase || 0) + (t.torcao || 0) * (k / N)) % tot; if (a < 0) a += tot;
        for (const [c, w] of bs) { if (a < w) return c; a -= w; } return bs[0][0]; }
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
        let corCad = null;   /* (a cor sorteada da cadeira desta célula: o espelho usa a mesma, sem sortear de novo) */
        if (G.noVomitorio(i, k)) { q4(i, i + 1, f0, f1, h0 - 0.02, G.vomCor); continue; }
        /* A ESCADA É DE CONCRETO LISO (dono, 14/11/2026: "refaça as escadas entre os blocos de arquibancada pra ficarem
           condizente com a realidade"): a faixa clara entre dois blocos de cadeiras, o degrau só um tom abaixo — antes
           saía tracejada de branco e cinza. Com `corEscada` (a escada pintada), a cor cheia e o degrau um tom abaixo. */
        if (escada) { const ce = t.corEscada || ficha.corEscada || '#c9c7be'; q4(i, i + 1, f0, f0 + df / 2, hk - sobe / 2, ce); q4(i, i + 1, f0 + df / 2, f1, hk, tomL(ce, 0.92)); }
        else {
          /* `pisoPintado: true` (a lateral do Barradão): cadeira em cima de degrau PINTADO — o piso leva a cor da cadeira, um tom
             abaixo, em vez do concreto (a listra pintada no degrau continua onde há cadeira). A cor é sorteada aqui e a cadeira,
             mais abaixo, usa a mesma. */
          const cad = !t.semCadeiras && t.pisoPintado && !G.sobreVomitorio(i, k) ? corDe(i, k) : null;
          const base = t.semCadeiras ? corDe(i, k) : (cad ? tomL(cad, 0.8) : CONCRETO), degrau = tomL(base, (k % 2 ? 0.95 : 1) * (0.92 + 0.08 * k / N));
          q4(i, i + 1, f0, f1, hk, degrau);
          /* `espelhoPintado: true` (o tobogã do Souza): arquibancada de cimento pintada por inteiro, o espelho leva a cor do
             degrau em vez do concreto — sem isso o desenho pintado nos degraus sai desbotado visto de frente */
          if (t.semCadeiras && t.espelhoPintado) corCad = base;
          if (G.sobreVomitorio(i, k)) q4(i, i + 1, f0, f0 + df * 0.42, hk + 1, G.vomParapeito);   /* o parapeito em cima da boca */
          else if (!t.semCadeiras) { const c = cad || corDe(i, k), luz = 0.9 + 0.1 * k / N; corCad = c;
            q4(i + 0.12, i + 0.88, f0 + df * 0.10, f0 + df * 0.58, hk + 0.45, tomL(c, luz * 0.94));     /* o assento */
            q4(i + 0.12, i + 0.88, f0 + df * 0.58, f0 + df * 0.80, hk + 0.9, tomL(c, Math.min(1.25, luz * 1.1))); } /* o encosto */
        }
        /* o espelho do degrau (a face de pé entre uma fileira e a outra): concreto; com `corEspelho` (o Independência), a cor
           do encosto das cadeiras, que é o que se vê de frente nas fotos — de cima ele não aparece */
        /* (com cadeira e sem `corEspelho`, o espelho sai no tom da cadeira da fileira: visto de frente, o que aparece entre uma
           fileira e a outra são os encostos, não o concreto — dono, 15/11/2026, a social de São Januário: "você pintou o chão
           da social em vez das cadeiras". De cima o espelho não aparece: a imagem do jogo não muda) */
        const espelho = escada ? CONCRETO_ESC : (t.corEspelho || (!t.semCadeiras && ficha.corEspelho) || (corCad ? tomL(corCad, 0.82) : CONCRETO_ESC));
        if (k < N - 1 && !G.noVomitorio(i, k + 1)) A.quad(Q(i, f1, hk), Q(i, f1, hk1), Q(i + 1, f1, hk1), Q(i + 1, f1, hk), espelho);
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
          /* (no anel reto a passagem segue a mesma régua das vizinhas — pelo lado, não pelo raio — pra emendar nelas sem sobra) */
          const retoP = t.reto !== false && !!(anel.reto || t.reto) && !curva(cd) && !curva(cf);
          const p = (ang, c, h) => { const q = retoP ? pontoPor(paramDe(ang, cd), c) : ponto(ang, raioDe(ang, c)); return P(q[0], q[1], h == null ? (t.alt || 0.12) : h); };
          A.quad(p(a0, cd), p(a0, cf), p(a1, cf), p(a1, cd), t.cor || CONCRETO);
          /* (a laje alta — a galeria de cima — ganha a parede de fora) */
          /* (`semParede`: a laje fica solta, sem o paredão embaixo — quem fecha a frente é a fachada de galerias) */
          if (t.alt > 1 && !t.semParede) Pm.quad(p(a0, cf, 0), p(a1, cf, 0), p(a1, cf), p(a0, cf), t.corFachada || (ficha.fachada && ficha.fachada.cor) || '#c9c6bb');
        }
        continue;
      }
      const h0 = (t.h || anel.h)[0];
      const G = colunasDe(ficha, anel, t), n = G.n, angs = G.angs, pos = G.pos, prof = G.prof;
      const p = (ang, f, h) => { const q = pos(ang, f); return P(q[0], q[1], h); };
      /* A ALTURA ACOMPANHA A FUNDURA (`inclinacao`: quanto sobe por metro de fundura; dono, 14/11/2026, o Arruda: a
         arquibancada de cima cresce redonda, sem degrau entre um trecho e outro). Sem `inclinacao`, vale a altura
         fixa do trecho (`h`). Com ela, onde a arquibancada é mais funda ela também é mais alta, de forma contínua. */
      const incl = def(t.inclinacao, anel.inclinacao);
      const h1 = incl != null ? h0 + incl * prof : (t.h || anel.h)[1];
      const hEm = incl != null ? (ang, h) => h <= h0 ? h : h0 + (h - h0) * G.fundura(ang) / prof : (ang, h) => h;
      desenharLance(t, G, h0, h1, (ci, f, h) => { const a = G.angEm(ci); return p(a, f, hEm(a, h)); }, pintorDe(t, G, rnd));
      for (let i = 0; i < n; i++) {
        const a0 = angs[i], a1 = angs[i + 1];
        /* a mureta da frente e a parede de trás */
        Pm.quad(p(a0, 0, 0), p(a0, 0, h0 + 1.1), p(a1, 0, h0 + 1.1), p(a1, 0, 0), t.corMureta || ficha.corMureta || '#d9d7cf');
        if (ia === ficha.aneis.length - 1 || t.paredeAtras) {
          const par = t.parapeito == null ? 1.2 : t.parapeito, hfa = hEm(a0, h1) + par, hfb = hEm(a1, h1) + par, cf2 = t.corFachada || (ficha.fachada && ficha.fachada.cor) || '#c9c6bb';
          Pm.quad(p(a0, 1, 0), p(a1, 1, 0), p(a1, 1, hfb), p(a0, 1, hfa), cf2);
          Pm.quad(p(a0, 1, hfa), p(a1, 1, hfb), p(a1, 1 - 0.8 / prof, hfb), p(a0, 1 - 0.8 / prof, hfa), cf2);
        }
      }
      /* as laterais do trecho (onde ele acaba em degrau) */
      for (const [ang, viz] of [[t.de, t.de - 0.5], [t.ate, t.ate + 0.5]]) {
        const outro = trechoEm(anel, viz);
        /* (o vizinho mais raso ou mais baixo deixa a lateral deste à mostra: é o degrau entre um trecho e outro) */
        const degrau = outro && outro !== t && ((outro.fora || anel.fora) !== cf || (outro.h || anel.h)[1] !== (t.h || anel.h)[1]);
        if (outro && outro !== t && outro.tipo !== 'passagem' && outro.tipo !== 'vazio' && !degrau) continue;
        Pm.quad(p(ang, 0, 0), p(ang, 1, 0), p(ang, 1, hEm(ang, h1)), p(ang, 0, h0), t.corFachada || (ficha.fachada && degrau && ficha.fachada.cor) || CONCRETO_ESC);
      }
      /* as bocas de acesso (as caixinhas de concreto no meio da arquibancada) */
      if (t.bocas) { const bc = t.bocas, f = bc.f == null ? 0.3 : bc.f;
        for (let a = t.de + bc.cada / 2; a < t.ate; a += bc.cada) { const r = raioDe(a, cd) + (raioDe(a, cf) - raioDe(a, cd)) * f, w = ponto(a, r), hb = hEm(a, h0 + (h1 - h0) * f) + 1.7;
          const m = caixa(bc.d || 5, hb, bc.w || 4, bc.cor || CONCRETO, w[0], hb / 2, -w[1]); m.rotation.y = a * RAD; } }
      /* a cobertura do trecho */
      const cb = t.cobertura;
      if (cb) {
        const nn = Math.max(3, Math.ceil(vao / 4)), av = cb.avanco == null ? 2 : cb.avanco, hc = cb.h, cai = cb.cai == null ? 2.5 : cb.cai;
        /* o ponto da cobertura neste ângulo, a `dr` metros do fundo. Por padrão mede-se do centro do campo; com `pelaColuna:
           true` a cobertura acompanha a COLUNA da arquibancada (o Dutrinha: num lance `reto` que não está centrado no eixo, a
           medida do centro faz o telhado passar da ponta da arquibancada, enviesado). */
        const pc = cb.pelaColuna ? (ang, dr) => { const a = G.pos(ang, 0), b = G.pos(ang, 1), L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [b[0] + (b[0] - a[0]) / L * dr, b[1] + (b[1] - a[1]) / L * dr]; }
                                 : (ang, dr) => ponto(ang, raioDe(ang, cf) + dr);
        for (let i = 0; i < nn; i++) {
          const a0 = t.de + vao * i / nn, a1 = t.de + vao * (i + 1) / nn;
          const q = (ang, dr, h) => { const w = pc(ang, dr); return P(w[0], w[1], h); };
          const tom = cb.listras && i % 2 ? (cb.cor2 || '#e9e9e4') : (cb.cor || '#f1f1ec');
          const RR = cb.opaca ? Ro : R;
          RR.quad(q(a0, av, hc), q(a1, av, hc), q(a1, -cb.larg, hc - cai), q(a0, -cb.larg, hc - cai), tom);
          /* `corBaixo` (a laje do Rei Pelé): a face de baixo de outra cor (o concreto cinza visto de dentro, debaixo do marrom) */
          if (cb.corBaixo) RR.quad(q(a0, av, hc - 0.3), q(a1, av, hc - 0.3), q(a1, -cb.larg, hc - cai - 0.3), q(a0, -cb.larg, hc - cai - 0.3), cb.corBaixo);
          RR.quad(q(a0, av, hc), q(a1, av, hc), q(a1, av, hc - 1.4), q(a0, av, hc - 1.4), cb.corBorda || tom);
          /* `corFrente` (o Rei Pelé): a testeira da beira da FRENTE, de outra cor (a faixa azul na boca do telhado marrom) */
          if (cb.corFrente) { const hfr = hc - cai, af = cb.altFrente || 1.3; RR.quad(q(a0, -cb.larg, hfr), q(a1, -cb.larg, hfr), q(a1, -cb.larg, hfr - af), q(a0, -cb.larg, hfr - af), cb.corFrente); }
          /* a treliça de cada módulo */
          if (cb.trelica !== false && i % 2 === 0) { const w0 = pc(a0, av), w1 = pc(a0, -cb.larg);
            const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(w1[0] - w0[0], w1[1] - w0[1]), 0.5, 0.35), mat(cb.corTrelica || '#8a8f93')));
            m.position.set((w0[0] + w1[0]) / 2, hc - cai / 2 + 0.3, -(w0[1] + w1[1]) / 2); m.rotation.y = Math.atan2(w1[1] - w0[1], w1[0] - w0[0]); coberturas.add(m); }
        }
        /* os pilares de trás */
        if (cb.pilares !== false) for (let i = 0; i <= nn; i += 2) { const a0 = t.de + vao * i / nn, w = pc(a0, av - 0.6); caixa(0.7, hc, 0.7, cb.corPilar || '#9a9a96', w[0], hc / 2, -w[1]); }
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
    /* `opaca: true`: o pedaço de fora da arquibancada sai inteiro na vista de cima, como o anel de placas solares do Mineirão
       fora das cadeiras (a regra do Beira-Rio: em cima das cadeiras a cobertura sai transparente; fora delas, inteira) */
    const R = cb.opaca ? Ro : R0;
    /* A COBERTURA DE UM TRECHO SÓ (o Raulino de Oliveira; dono, 16/11/2026: "Preciso que a cobertura do estádio do Volta Redonda
       seja mais realista, é só um bloco solto acima da arquibancada"): `de` e `ate` limitam o arco; `angulos: [..]` dá as divisas
       dos gomos uma a uma (pra elas caírem nas quinas de um contorno chanfrado e a telha ter a mesma largura na reta toda);
       `beiral: [fora, dentro]` é a altura da testeira (telha fina: 0,3); `pilares: { f, base, cor, esp, cada, viga }` põe um pilar
       em cada divisa, do degrau (`base`) até a telha, e a viga por baixo, da frente ao fundo; `mastros: { f, h, abre, cor, esp,
       cada }` põe em cima de cada divisa o cavalete em A com os dois tirantes, um pra beira da frente e um pra de trás. */
    const de = cb.de || 0, vao = (cb.ate == null ? de + 360 : cb.ate) - de, angs = cb.angulos || Array.from({ length: (cb.n || 60) + 1 }, (_, i) => de + vao * i / (cb.n || 60));
    const n = angs.length - 1, inteiro = !cb.angulos && vao >= 360, hf = cb.h, hd = cb.h - (cb.cai || 0), am = (angs[0] + angs[n]) / 2, prof = raioDe(inteiro ? 0 : am, cb.fora) - raioDe(inteiro ? 0 : am, cb.dentro);
    /* `normal: true` (com a beira de dentro em retângulo de canto redondo ou chanfrado): cada divisa sai PERPENDICULAR à beira
       de dentro e vai reta até o contorno de fora, que pode ter qualquer desenho (a telha de uma lateral reta não abre em leque) */
    const memoN = new Map(), porNormal = ang => { let q = memoN.get(ang); if (q) return q;
      const cd = cb.dentro, pm = paramDe(ang, cd), a = pontoPor(pm, cd), ph = cd.chanfro ? Math.PI / 4 : pm.phi, nx = pm.tipo === 'h' ? 0 : pm.tipo === 'v' ? pm.sx : pm.sx * Math.cos(ph), ny = pm.tipo === 'h' ? pm.sy : pm.tipo === 'v' ? 0 : pm.sy * Math.sin(ph);
      const sai = s => { const x = a[0] + nx * s, y = a[1] + ny * s; return Math.hypot(x, y) - raioDe(Math.atan2(y, x) / RAD, cb.fora); };
      let s0 = 0, s1 = 2; while (sai(s1) < 0 && s1 < 400) s1 *= 2;
      for (let k = 0; k < 40; k++) { const m = (s0 + s1) / 2; if (sai(m) < 0) s0 = m; else s1 = m; }
      q = [a, [a[0] + nx * s1, a[1] + ny * s1]]; if (memoN.size < 20000) memoN.set(ang, q); return q; };
    /* `alturas: ang => [fora, dentro]`: a altura da beira de fora e da de dentro muda ao longo da volta (a cobertura em sela
       do Mangueirão: a beira de dentro sobe em arco no meio das laterais e desce nas pontas). Sem ela, valem `h` e `cai`. */
    const alt = (ang, f) => { if (!cb.alturas) return hd + (hf - hd) * f; const [x1, x0] = cb.alturas(ang); return x0 + (x1 - x0) * f; };
    const pu = cb.normal ? (ang, f, dh) => { const [a, b] = porNormal(ang); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, alt(ang, f) + (dh || 0)]; }
      : (ang, f, dh) => { const r0 = raioDe(ang, cb.dentro), r1 = raioDe(ang, cb.fora), q = ponto(ang, r0 + (r1 - r0) * f); return [q[0], q[1], alt(ang, f) + (dh || 0)]; };
    const pt = (ang, f, dh) => { const q = pu(ang, f, dh); return P(q[0], q[1], q[2]); };
    const faixa = (f0, f1, c1, c2, dh) => { for (let i = 0; i < n; i++) { const a0 = angs[i], a1 = angs[i + 1]; R.quad(pt(a0, f0, dh), pt(a0, f1, dh), pt(a1, f1, dh), pt(a1, f0, dh), i % 2 ? (c2 || c1) : c1); } };
    /* AS PÉTALAS (a Arena das Dunas; dono, 17/11/2026: "Preste bem atenção nos detalhes que o desenho é complexo"): com
       `petalas: { fenda, passos, fatias, crista, curva, testeira, opacaDe, corFenda, arco }`, cada gomo é uma casca solta, em forma
       de duna — nasce baixa na beira de fora, sobe abaulada até a crista (na fração `crista` a partir da beira de dentro) e
       acaba na testeira reta da beira de dentro; de través ela é uma almofada (`bojo` no meio). Entre uma e outra fica a
       `fenda` (fração do gomo, de cada lado), fechada mais embaixo pela faixa translúcida `corFenda`. `alturas(ang)` devolve
       `[fora, dentro, crista]` e vale pro MEIO de cada pétala: uma pétala inteira fica numa altura e a vizinha noutra, em
       degraus. `opacaDe`: a fração a partir da qual a pétala sai inteira na vista de cima (o pedaço de fora das cadeiras). */
    if (cb.petalas) { const pe = cb.petalas, fen = pe.fenda == null ? 0.05 : pe.fenda, m = pe.passos || 9, kk = pe.fatias || 4, fc = pe.crista == null ? 0.3 : pe.crista, pw = pe.curva || 2.6, bj = cb.bojo || 0;
      const tst = pe.testeira == null ? 3 : pe.testeira, fo = pe.opacaDe == null ? 2 : pe.opacaDe, cF = pe.corFenda || '#8f979c';
      const pets = Array.from({ length: n }, (_, i) => { const d = angs[i + 1] - angs[i], am = (angs[i] + angs[i + 1]) / 2, [hF, hD, hC0] = cb.alturas ? cb.alturas(am) : [hf, hd], hC = hC0 == null ? hD + 2 : hC0;
        const perfil = f => f <= fc ? hD + (hC - hD) * Math.sin(f / fc * Math.PI / 2) : hF + (hC - hF) * Math.pow(Math.max(0, 1 - Math.pow((f - fc) / (1 - fc), pw)), 1 / pw);
        return { a0: angs[i] + d * fen, a1: angs[i + 1] - d * fen, perfil }; });
      const xy = (ang, f, h) => { const q = pu(ang, f, 0); return P(q[0], q[1], h); };
      pets.forEach((pt2, i) => { const c = i % 2 ? (cb.cor2 || cb.cor || '#f4f3ee') : (cb.cor || '#f4f3ee');
        const pp = (t, f, dh) => xy(pt2.a0 + (pt2.a1 - pt2.a0) * t, f, pt2.perfil(f) + bj * Math.sin(Math.PI * t) * (1 - 0.45 * f * f) + (dh || 0));
        for (let j = 0; j < m; j++) { const f0 = j / m, f1 = (j + 1) / m, M = (f0 + f1) / 2 >= fo ? Ro : R;
          for (let q = 0; q < kk; q++) { const t0 = q / kk, t1 = (q + 1) / kk;
            M.quad(pp(t0, f0), pp(t0, f1), pp(t1, f1), pp(t1, f0), c);
            if (cb.corBaixo) M.quad(pp(t0, f0, -0.5), pp(t0, f1, -0.5), pp(t1, f1, -0.5), pp(t1, f0, -0.5), cb.corBaixo); } }
        /* a testeira: a caixa reta da ponta de dentro, e os dois lados da pétala fechados até a metade */
        for (let q = 0; q < kk; q++) { const t0 = q / kk, t1 = (q + 1) / kk; R.quad(pp(t0, 0), pp(t1, 0), pp(t1, 0, -tst), pp(t0, 0, -tst), pe.corTesteira || c); }
        for (const t of [0, 1]) for (let j = 0; j < m; j++) { const f0 = j / m, f1 = (j + 1) / m, lado = 1.4; ((f0 + f1) / 2 >= fo ? Ro : R).quad(pp(t, f0), pp(t, f1), pp(t, f1, -lado), pp(t, f0, -lado), pe.corLado || '#dcdcd6'); }
        /* a faixa translúcida da fenda, até a pétala seguinte */
        const prox = pets[(i + 1) % n]; if (i < n - 1 || inteiro) for (let j = 0; j < m; j++) { const f0 = j / m, f1 = (j + 1) / m, M = (f0 + f1) / 2 >= fo ? Ro : R, h0 = Math.min(pt2.perfil(f0), prox.perfil(f0)) - 1, h1 = Math.min(pt2.perfil(f1), prox.perfil(f1)) - 1;
          M.quad(xy(pt2.a1, f0, h0), xy(pt2.a1, f1, h1), xy(prox.a0, f1, h1), xy(prox.a0, f0, h0), cF); }
        /* O ARCO de cada divisa (dono, 17/11/2026, com os recortes de perto: "a parte superior é cheia de fendas no meio da
           arquibancada"): a treliça branca de painéis translúcidos que sai da ponta de dentro da cobertura e desce em quarto de
           elipse até o pé, no meio da arquibancada, entre dois blocos de cadeiras. `arco: { pe: contorno onde ela pisa, h:
           altura do pé (número ou função do ângulo), passos, borda, cor, cor2, corBorda }`. */
        if (pe.arco && (i < n - 1 || inteiro)) { const ar = pe.arco, na = ar.passos || 8, am2 = (pt2.a1 + prox.a0) / 2, hTip = Math.min(pt2.perfil(0), prox.perfil(0)) - 1, hPe = typeof ar.h === 'function' ? ar.h(am2) : ar.h;
          const pa = (ang, sq) => { const th = sq * Math.PI / 2, r0 = raioDe(ang, cb.dentro), r1 = raioDe(ang, ar.pe), q = ponto(ang, r0 + (r1 - r0) * Math.sin(th)); return P(q[0], q[1], hPe + (hTip - hPe) * Math.cos(th)); };
          const e0 = pt2.a1, e1 = prox.a0, w = e1 - e0, bd = ar.borda == null ? 0.16 : ar.borda, cB = ar.corBorda || '#7c858b';
          for (let j = 0; j < na; j++) { const s0 = j / na, s1 = (j + 1) / na;
            R.quad(pa(e0, s0), pa(e0, s1), pa(e0 + w * bd, s1), pa(e0 + w * bd, s0), cB); R.quad(pa(e1 - w * bd, s0), pa(e1 - w * bd, s1), pa(e1, s1), pa(e1, s0), cB);
            R.quad(pa(e0 + w * bd, s0), pa(e0 + w * bd, s1), pa(e1 - w * bd, s1), pa(e1 - w * bd, s0), j % 2 ? (ar.cor2 || ar.cor || '#e6ebee') : (ar.cor || '#e6ebee')); } } });
      continue; }
    const ff = cb.bordaFora ? cb.bordaFora.larg / prof : 0, fd = cb.bordaDentro ? cb.bordaDentro.larg / prof : 0;
    /* AS FOLHAS (o Beira-Rio): com `bojo`, cada gomo é uma folha abaulada — a espinha do meio sobe `bojo` metros, e
       a luz pega um lado e o outro de cada folha de jeito diferente; `fenda` deixa um vão escuro entre as folhas */
    /* AS ALMOFADAS (a lona da Fonte Nova; dono, 16/11/2026, com as fotos de cima: "mais detalhes sobre a cobertura pra fazer de
       forma mais detalhada"): com `almofadas: k`, cada gomo é cortado em k almofadas da beira de dentro à de fora — a lona
       abaulada entre dois cabos radiais, presa embaixo nos cabos de volta, com a espinha subindo `bojo` no meio de cada uma e
       descendo a 30% nas pontas. `recorte: m` puxa pra fora o meio da beira de dentro de cada gomo (a beira recortada). */
    if (cb.bojo && cb.almofadas) { const k = cb.almofadas, b = cb.bojo, rec = (cb.recorte || 0) / prof, f0g = fd, f1g = 1 - ff;
      for (let i = 0; i < n; i++) { const a0 = angs[i], a1 = angs[i + 1], am = (a0 + a1) / 2;
        for (let j = 0; j < k; j++) { const g0 = f0g + (f1g - f0g) * j / k, g1 = f0g + (f1g - f0g) * (j + 1) / k, gm = (g0 + g1) / 2, m0 = j === 0 ? g0 + rec : g0;
          const c = (i + j) % 2 ? (cb.cor2 || cb.cor || '#f4f3ee') : (cb.cor || '#f4f3ee');
          R.quad(pt(a0, g0, 0), pt(a0, gm, 0), pt(am, gm, b), pt(am, m0, b * 0.3), c); R.quad(pt(a0, gm, 0), pt(a0, g1, 0), pt(am, g1, b * 0.3), pt(am, gm, b), c);
          R.quad(pt(am, m0, b * 0.3), pt(am, gm, b), pt(a1, gm, 0), pt(a1, g0, 0), c); R.quad(pt(am, gm, b), pt(am, g1, b * 0.3), pt(a1, g1, 0), pt(a1, gm, 0), c); } }
    } else if (cb.bojo) { const fen = (cb.fenda || 0) * vao / n / 2;
      for (let i = 0; i < n; i++) { const a0 = angs[i] + fen, a1 = angs[i + 1] - fen, am = (a0 + a1) / 2, c = i % 2 ? (cb.cor2 || cb.cor || '#f4f3ee') : (cb.cor || '#f4f3ee'), b = cb.bojo;
        R.quad(pt(a0, fd, 0), pt(a0, 1 - ff, 0), pt(am, 1 - ff, b), pt(am, fd, b * 0.4), c);
        R.quad(pt(am, fd, b * 0.4), pt(am, 1 - ff, b), pt(a1, 1 - ff, 0), pt(a1, fd, 0), c); }
    } else faixa(fd, 1 - ff, cb.cor || '#f4f3ee', cb.cor2);
    if (ff) faixa(1 - ff, 1, cb.bordaFora.cor); if (fd) faixa(0, fd, cb.bordaDentro.cor);
    /* `corBaixo` (a laje do Rei Pelé): a face de baixo de outra cor (o concreto cinza visto de dentro) */
    if (cb.corBaixo) faixa(0, 1, cb.corBaixo, null, -0.35);
    /* (`dh` no anel: negativo pendura a faixa por baixo da cobertura — a passarela de luz da Fonte Nova) */
    for (const an of cb.aneis || []) faixa(an.f, an.f + an.larg / prof, an.cor, null, an.dh == null ? 0.2 : an.dh);
    /* as nervuras entre os gomos */
    if (cb.nervuras !== false) for (let i = 0; i < (inteiro ? n : n + 1); i++) { const a = angs[i], e = cb.larguraNervura || 0.16; R.quad(pt(a - e, fd, 0.12), pt(a - e, 1 - ff, 0.12), pt(a + e, 1 - ff, 0.12), pt(a + e, fd, 0.12), cb.corNervura || '#cfcfc8'); }
    /* a borda de fora e a de dentro, de pé */
    const bF = cb.beiral ? cb.beiral[0] : 2.2, bD = cb.beiral ? cb.beiral[1] : 1.2;
    for (let i = 0; i < n; i++) { const a0 = angs[i], a1 = angs[i + 1];
      R.quad(pt(a0, 1, 0), pt(a1, 1, 0), pt(a1, 1, -bF), pt(a0, 1, -bF), (cb.bordaFora && cb.bordaFora.cor) || cb.corBeiral || cb.cor || '#f4f3ee');
      R.quad(pt(a0, 0, 0), pt(a1, 0, 0), pt(a1, 0, -bD), pt(a0, 0, -bD), (cb.bordaDentro && cb.bordaDentro.cor) || cb.corBeiral || cb.cor || '#f4f3ee'); }
    /* os pilares com a viga por baixo, e os mastros em A com os tirantes por cima */
    const pl = cb.pilares, ms = cb.mastros, grupo = cb.opaca ? cena : coberturas;
    /* AS ALETAS (o Mangueirão; dono, 16/11/2026, com a foto de fora: "corrija a cobertura"): em cada divisa, a viga branca
       que nasce rente à laje (em `de`, fração da frente pro fundo) e vai subindo até passar `h` metros da beira de fora, em
       cima da COLUNA fina que desce até o chão. `aletas: { h, de, esp, cor, cada, coluna, base }`. E `trelicas: { angs, esp,
       alt, cor }`: as treliças de aço deitadas por cima da laje, da beira de dentro à de fora, nos ângulos dados. */
    const al = cb.aletas;
    if (al) for (let i = 0; i < (inteiro ? n : n + 1); i++) { if (i % (al.cada || 1)) continue; const a = angs[i], e = al.esp || 0.4, c = al.cor || '#f4f4f0';
      /* (`bico`: quanto a ponta da aleta passa da beira de fora, em fração da largura da cobertura) */
      const pe = pu(a, al.de == null ? 0.3 : al.de, 0.15), topo = pu(a, 1 + (al.bico || 0), al.h == null ? 3 : al.h), beira = pu(a, 1, 0);
      barra(pe, topo, e, c, grupo); barra(beira, topo, e, c, grupo);
      if (al.coluna !== false) barra([beira[0], beira[1], al.base || 0], beira, e * 0.9, c, cena); }
    if (cb.trelicas) for (const a of cb.trelicas.angs) { const tr = cb.trelicas, e = tr.esp || 1.4, h0 = tr.alt == null ? 1.1 : tr.alt, c = tr.cor || '#e6e8ea';
      barra(pu(a, 0.02, h0), pu(a, 1.02, h0), e, c, grupo);
      for (const f of [0.02, 0.35, 0.68, 1.02]) barra(pu(a, f, 0), pu(a, f, h0), e * 0.35, c, grupo); }
    if (pl || ms) for (let i = 0; i < (inteiro ? n : n + 1); i++) { const a = angs[i];
      if (pl && i % (pl.cada || 1) === 0) { const f = pl.f == null ? 0.85 : pl.f, topo = pu(a, f, -0.1);
        barra([topo[0], topo[1], pl.base || 0], topo, pl.esp || 0.36, pl.cor || '#d9dcde', grupo);
        if (pl.viga !== false) barra(pu(a, 0, -0.32), pu(a, 1, -0.32), pl.espViga || 0.3, pl.corViga || pl.cor || '#d9dcde', grupo); }
      if (ms && i % (ms.cada || 1) === 0) { const f = ms.f == null ? 0.85 : ms.f, pe = pu(a, f, 0.1), topo = pu(a, f, ms.h || 3), q0 = pu(a - 0.4, f, 0), q1 = pu(a + 0.4, f, 0);
        const dl = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1, ab = ms.abre == null ? 1.2 : ms.abre, tx = (q1[0] - q0[0]) / dl * ab, ty = (q1[1] - q0[1]) / dl * ab, c = ms.cor || '#eef0f1', e = ms.esp || 0.22;
        barra([pe[0] - tx, pe[1] - ty, pe[2]], topo, e, c, grupo); barra([pe[0] + tx, pe[1] + ty, pe[2]], topo, e, c, grupo);
        barra(topo, pu(a, 0, 0.1), e * 0.6, c, grupo); barra(topo, pu(a, 1, 0.1), e * 0.6, c, grupo); } }
  }
  /* ---- A COBERTURA DE FOLHAS (o Beira-Rio; dono, 14/11/2026: "observe a cobertura pra ficar mais condizente"): cada
     folha é uma membrana abaulada que nasce numa ponta no chão, do lado de fora, alarga subindo pela fachada, encosta
     nas vizinhas no alto e vai até o anel de dentro. `perfil`: [[f, altura, largura], ...] de dentro (f = 0) pra fora
     (f = 1 na beira da arquibancada; mais que 1, a perna descendo); a largura vai de 1 (encostada) a 0 (a ponta).
     A parte em cima das cadeiras sai vazada na foto de cima; a perna, do lado de fora, fica inteira. ---- */
  for (const fo of ficha.folhas || []) {
    const n = fo.n || 60, perfil = fo.perfil, bojo = fo.bojo == null ? 3 : fo.bojo, fen = fo.fenda == null ? 0.05 : fo.fenda, passo = 360 / n, T = [-1, -0.6, -0.2, 0.2, 0.6, 1];
    const pt = (ang, f, h) => { const r0 = raioDe(ang, fo.dentro), r1 = raioDe(ang, fo.fora), q = ponto(ang, r0 + (r1 - r0) * f); return P(q[0], q[1], h); };
    for (let i = 0; i < n; i++) {
      const ac = passo * (i + 0.5), c = i % 2 ? (fo.cor2 || fo.cor || '#f6f6f2') : (fo.cor || '#f6f6f2');
      const est = perfil.map(([f, h, w]) => T.map(t => pt(ac + t * (passo / 2) * w * (1 - fen), f, h + bojo * Math.max(0.25, w) * (1 - t * t))));
      for (let k = 0; k < est.length - 1; k++) { const Mf = perfil[k][0] >= 1 ? Ro : R;
        for (let j = 0; j < T.length - 1; j++) Mf.quad(est[k][j], est[k + 1][j], est[k + 1][j + 1], est[k][j + 1], c); }
    }
    /* o anel de dentro (a treliça branca que segura as folhas) */
    const hd = perfil[0][1] + bojo, la = fo.anel == null ? 0.07 : fo.anel;
    for (let i = 0; i < n * 2; i++) { const a0 = 180 * i / n, a1 = 180 * (i + 1) / n;
      R.quad(pt(a0, 0.01, hd), pt(a1, 0.01, hd), pt(a1, -la, hd), pt(a0, -la, hd), i % 2 ? '#e3e6e8' : '#d3d7da');
      R.quad(pt(a0, -la, hd), pt(a1, -la, hd), pt(a1, -la, hd - 2.4), pt(a0, -la, hd - 2.4), '#c5c9cc'); }
  }
  /* ---- A COBERTURA DE ABÓBADAS (o Romeirão; dono, 14/11/2026): uma fileira de módulos de lona branca ao longo de
     uma arquibancada reta. Cada módulo é uma casca abaulada que nasce baixa atrás da arquibancada, sobe em arco e
     avança por cima das últimas fileiras até a treliça da frente, onde ficam os refletores. `u`, `comp`: o meio e o
     comprimento da fileira; `vFrente`, `vFundo`: de onde a onde vai (o sinal diz o lado); `perfil`: [[f, altura]],
     da frente (f = 0) ao pé de trás (f = 1). ---- */
  for (const ab of ficha.abobadas || []) {
    const n = ab.n || 8, mod = ab.comp / n, bojo = ab.bojo == null ? 2.6 : ab.bojo, T = [-1, -0.6, -0.2, 0.2, 0.6, 1], perfil = ab.perfil;
    const pv = f => ab.vFrente + (ab.vFundo - ab.vFrente) * f;
    for (let i = 0; i < n; i++) {
      const uc = ab.u - ab.comp / 2 + mod * (i + 0.5), c = i % 2 ? (ab.cor2 || ab.cor || '#f6f6f2') : (ab.cor || '#f6f6f2');
      const est = perfil.map(([f, h]) => T.map(t => P(uc + t * mod * 0.485, pv(f), h + bojo * (1 - t * t))));
      for (let k = 0; k < est.length - 1; k++) for (let j = 0; j < T.length - 1; j++) R.quad(est[k][j], est[k + 1][j], est[k + 1][j + 1], est[k][j + 1], c);
      /* o arco da frente de cada módulo (a testeira) e o tímpano de treliça de trás */
      for (let j = 0; j < T.length - 1; j++) { const a0 = est[0][j], a1 = est[0][j + 1]; R.quad(a0, a1, [a1[0], perfil[0][1] - 0.6, a1[2]], [a0[0], perfil[0][1] - 0.6, a0[2]], ab.corTesteira || '#dfe2e4'); }
      /* (`fundo: false` deixa a casca aberta atrás; `fundo: altura` fecha só até essa altura, `corFundo` pinta) */
      const ul = est[est.length - 1], bF = typeof ab.fundo === 'number' ? ab.fundo : 0.3; if (ab.fundo !== false) for (let j = 0; j < T.length - 1; j++) R.quad(ul[j], ul[j + 1], [ul[j + 1][0], bF, ul[j + 1][2]], [ul[j][0], bF, ul[j][2]], ab.corFundo || '#aab1b6');
    }
    /* a treliça da frente, com a fileira de refletores, e os pilares brancos de trás de cada divisa */
    /* (`concreto: true`, as abóbadas de concreto do Godofredo Cruz: sem a treliça nem os refletores da frente) */
    const hf = perfil[0][1], vf = ab.vFrente, sg = ab.vFundo > ab.vFrente ? 1 : -1;
    if (!ab.concreto) {
    caixa(ab.comp, 0.5, 0.5, '#8d949a', ab.u, hf - 0.4, -vf, coberturas); caixa(ab.comp, 0.5, 0.5, '#8d949a', ab.u, hf - 2.8, -(vf + sg * 1.6), coberturas);
    for (let k = 0; k <= n * 3; k++) caixa(0.35, 2.6, 0.35, '#8d949a', ab.u - ab.comp / 2 + ab.comp * k / (n * 3), hf - 1.6, -(vf + sg * 0.8), coberturas);
    for (let k = 0; k < n * 2; k++) caixa(2.2, 1.1, 0.7, '#22262a', ab.u - ab.comp / 2 + ab.comp * (k + 0.5) / (n * 2), hf - 3.2, -(vf - sg * 0.2), coberturas);
    }
    for (let k = 0; k <= n; k++) { const f = ab.pilarEm == null ? 0.62 : ab.pilarEm, hp = perfil.reduce((q, [pf, ph]) => Math.abs(pf - f) < Math.abs(q[0] - f) ? [pf, ph] : q, perfil[0])[1];
      caixa(ab.espPilar || 0.8, hp, ab.espPilar || 0.8, ab.corPilar || '#f1f1ed', ab.u - ab.comp / 2 + mod * k, hp / 2, -pv(f), ab.concreto ? coberturas : cena); }
  }
  /* ---- A CONCHA (o Bezerrão; dono, 16/11/2026: "Veja o formato da cobertura com mais detalhes"): a meia cúpula branca atrás
     de um arco alto. Em planta é um D: a superelipse de centro (`cu`, `cv`), semieixos `a` (ao longo do campo) e `b` (pra
     trás) e expoente `p` (2 = elipse; mais que 2, os lados mais retos), cortada na frente pela linha do ARCO (`vArco`). O
     arco sobe de `base` (a altura da beirada, nas duas pontas) até perto de `h` (no meio); dali a casca ainda sobe um
     pouco pra trás, até o cume (`cume`: a que fração do caminho do arco à beirada, 0,22 por padrão; 0 = o cume é o
     próprio arco), e desce em quarto de círculo até a beirada, que corre em cima do MURO em D (`muro: { cor, hFrente, vFrente }`: nasce baixo ao lado da frente da
     arquibancada e chega na altura da beirada na linha do arco). `lado: -1` vira a concha pro outro lado do campo.
     `opacaDe`: de que `v` pra trás a casca sai inteira na foto de cima (atrás das cadeiras; na frente disso sai
     transparente, como toda cobertura). `escoras: { n, v, h, abre, cor, esp }`: os cavaletes em V que seguram o arco,
     com o pé no alto da arquibancada. ---- */
  for (const c of ficha.conchas || []) {
    const sg = c.lado === -1 ? -1 : 1, p = c.p || 2, y0 = Math.abs(c.vArco - c.cv), k = Math.pow(y0 / c.b, p), t0 = Math.asin(Math.pow(y0 / c.b, p / 2)), n = c.n || 30, m = c.m || 9;
    /* a altura: cada fatia (um `x`) tem a sua crista, que cai pros lados como o arco; ao longo da fatia, da frente (f = 0)
       à beirada (f = 1), o perfil sobe até o cume e cai em quarto de círculo */
    const aF = c.a * Math.pow(1 - k, 1 / p), fc = c.cume == null ? 0.22 : c.cume, yBeira = x => c.b * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / c.a, p)), 1 / p);
    const crista = x => (c.h - c.base) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(x) / aF), p)));
    const alt = (x, y) => { const yr = yBeira(x), f = yr > y0 + 0.01 ? Math.max(0, Math.min(1, (y - y0) / (yr - y0))) : 1, q = (f - fc) / (1 - fc);
      return c.base + crista(x) * Math.sqrt(Math.max(0, 1 - q * q)); };
    const beira = t => [c.a * Math.sign(Math.cos(t)) * Math.pow(Math.abs(Math.cos(t)), 2 / p), c.b * Math.sign(Math.sin(t)) * Math.pow(Math.abs(Math.sin(t)), 2 / p)];
    const pt = (x, y, h) => P(c.cu + x, c.cv + sg * y, h == null ? alt(x, y) : h);
    const th = i => t0 + (Math.PI - 2 * t0) * i / n, corArco = c.corArco || '#c9cdd0', hArco = c.hArco || 2.2;
    for (let i = 0; i < n; i++) {
      const [xa, ya] = beira(th(i)), [xb, yb] = beira(th(i + 1)), cor = i % 2 ? (c.cor2 || c.cor || '#f4f4f0') : (c.cor || '#f4f4f0');
      for (let j = 0; j < m; j++) {
        /* (as fileiras se apertam perto da beirada, onde a casca cai mais depressa) */
        const f0 = Math.sin(j / m * Math.PI / 2), f1 = Math.sin((j + 1) / m * Math.PI / 2);
        const a0 = [xa, y0 + (ya - y0) * f0], a1 = [xa, y0 + (ya - y0) * f1], b0 = [xb, y0 + (yb - y0) * f0], b1 = [xb, y0 + (yb - y0) * f1];
        const M = c.opacaDe != null && sg * (c.cv + sg * (a0[1] + b1[1]) / 2 - c.opacaDe) >= 0 ? Ro : R;
        M.quad(pt(...a0), pt(...b0), pt(...b1), pt(...a1), cor);
      }
      /* o arco de treliça da frente: a testeira e o banzo de baixo */
      const za = alt(xa, y0), zb = alt(xb, y0);
      R.quad(pt(xa, y0 - 0.15, za + 0.3), pt(xb, y0 - 0.15, zb + 0.3), pt(xb, y0 - 0.15, zb - hArco), pt(xa, y0 - 0.15, za - hArco), corArco);
      R.quad(pt(xa, y0 - 0.15, za - hArco), pt(xb, y0 - 0.15, zb - hArco), pt(xb, y0 + 2.6, zb - hArco), pt(xa, y0 + 2.6, za - hArco), c.corArco2 || '#aeb4b9');
    }
    if (c.escoras) { const e = c.escoras, abre = e.abre == null ? 4 : e.abre;
      for (let q = 0; q < e.n; q++) { const x = -aF * 0.84 + aF * 1.68 * (e.n > 1 ? q / (e.n - 1) : 0.5), pe = [c.cu + x, e.v, e.h];
        for (const d of [-abre, abre]) barra(pe, [c.cu + x + d, c.cv + sg * y0, alt(x + d, y0) - hArco], e.esp || 0.55, e.cor || '#d9dcde', coberturas);
        if (e.pilar !== false) caixa(1, e.h - (e.pe || 0), 1, e.corPilar || '#d9dcde', pe[0], (e.h + (e.pe || 0)) / 2, -pe[1], cena); } }
    if (c.muro) { const mu = c.muro, yF = sg * (mu.vFrente - c.cv), tA = Math.asin(Math.sign(yF) * Math.pow(Math.min(1, Math.abs(yF) / c.b), p / 2)), n2 = mu.n || 56, hF = mu.hFrente == null ? 4 : mu.hFrente;
      const topo = y => y >= y0 ? c.base : hF + (c.base - hF) * Math.max(0, (y - yF) / Math.max(0.1, y0 - yF));
      for (let i = 0; i < n2; i++) { const [xa, ya] = beira(tA + (Math.PI - 2 * tA) * i / n2), [xb, yb] = beira(tA + (Math.PI - 2 * tA) * (i + 1) / n2);
        Pm.quad(pt(xa, ya, 0), pt(xb, yb, 0), pt(xb, yb, topo(yb)), pt(xa, ya, topo(ya)), i % 2 ? (mu.cor2 || mu.cor || '#2e7d4f') : (mu.cor || '#2e7d4f')); } }
  }
  /* ---- O ALAMBRADO e O MURO (dono, 15/11/2026: "adicionando cerca de alambrado ao redor do campo caso a arquibancada não
     seja colada no campo"; "um muro por de trás da arquibancada [...] pra mostrar pro jogador uma limitação da área de
     briga"). Os dois nascem sozinhos, do desenho da ficha:
     · o ALAMBRADO corre pela beira de dentro do PRIMEIRO anel: onde ele é chão (`passagem`), do chão pra cima; onde ele é
       arquibancada longe do campo (mais de `limiar` metros da linha, 8 por padrão), em cima da mureta;
     · o MURO fecha todo lugar onde o chão andável acaba sem parede: o fundo e as pontas de cada lance, a beira de fora e as
       pontas de cada piso, o fundo e os lados de cada `reta`. O teste é o do jogo (`andavel`): se um metro adiante não se
       anda, tem muro.
     `alambrado: false` e `muro: false` na ficha desligam (as arenas, que não têm nem um nem outro);
     `alambrado: { h, cor, limiar }` e `muro: { cor }` ajustam. ---- */
  {
    const ALA = ficha.alambrado, MURO = ficha.muro, ult = ficha.aneis.length - 1;
    const corMuro = (MURO && MURO.cor) || ficha.corMuro || (ficha.fachada && ficha.fachada.cor) || '#d9d6cc';
    const dir = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], q = Math.hypot(dx, dy) || 1; return [dx / q, dy / q]; };
    const entre = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    const semChao = (q, n, d) => !andavel(ficha, q[0] + n[0] * d, q[1] + n[1] * d);
    /* um pedaço de muro entre dois pontos da beira (`n` aponta pra fora): as duas faces e a faixa de cima */
    const muroEntre = (e0, e1, n, ha, hb, esp) => {
      const i0 = [e0[0] - n[0] * esp, e0[1] - n[1] * esp], i1 = [e1[0] - n[0] * esp, e1[1] - n[1] * esp];
      Pm.quad(P(e0[0], e0[1], 0), P(e1[0], e1[1], 0), P(e1[0], e1[1], hb), P(e0[0], e0[1], ha), corMuro);
      Pm.quad(P(i0[0], i0[1], 0), P(i1[0], i1[1], 0), P(i1[0], i1[1], hb), P(i0[0], i0[1], ha), corMuro);
      Pm.quad(P(e0[0], e0[1], ha), P(e1[0], e1[1], hb), P(i1[0], i1[1], hb), P(i0[0], i0[1], ha), corMuro);
    };
    /* a régua de um lance e a de um piso: onde cai cada ponto e a altura do degrau ali */
    const lance = (anel, t) => { const G = colunasDe(ficha, anel, t), cd = t.dentro || anel.dentro, cf = t.fora || anel.fora, h0 = (t.h || anel.h)[0], incl = def(t.inclinacao, anel.inclinacao);
      const h1 = incl != null ? h0 + incl * G.prof : (t.h || anel.h)[1], fund = G.fundura, topo = ang => incl != null ? h0 + (h1 - h0) * fund(ang) / G.prof : h1;
      const passo = Math.max(1, Math.round(3 / G.larguraCel)), ix = []; for (let i = 0; i < G.n; i += passo) ix.push(i); ix.push(G.n);
      return { pos: G.pos, angs: ix.map(i => G.angs[i]), h0, prof: G.prof, alt: (ang, f) => h0 + (topo(ang) - h0) * Math.max(0, (f - G.fc) / Math.max(0.05, 1 - G.fc)), chao: false }; };
    const piso = (anel, t) => { const cd = t.dentro || anel.dentro, cf = t.fora || anel.fora, vao = t.ate - t.de, retoP = t.reto !== false && !!(anel.reto || t.reto) && !curva(cd) && !curva(cf);
      const em = (ang, c) => retoP ? pontoPor(paramDe(ang, cd), c) : ponto(ang, raioDe(ang, c)), pos = (ang, f) => entre(em(ang, cd), em(ang, cf), f);
      const n = Math.max(2, Math.ceil(vao / 2)), m = t.de + vao / 2, a = pos(m, 0), b = pos(m, 1);
      return { pos, angs: Array.from({ length: n + 1 }, (_, i) => t.de + vao * i / n), h0: 0, prof: Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1])), alt: () => 0, chao: true }; };
    if (MURO !== false) {
      ficha.aneis.forEach((anel, ia) => { for (const t of anel.trechos) {
        if (t.tipo === 'vazio' || (t.tipo === 'passagem' && t.alt > 1)) continue;
        const L = t.tipo === 'passagem' ? piso(anel, t) : lance(anel, t), alto = L.chao ? 2.6 : (t.parapeito == null ? 1.2 : t.parapeito), esp = 0.8, vao = t.ate - t.de;
        /* o fundo (o lance do último anel e o de `paredeAtras` já têm a parede) */
        if (L.chao || !(ia === ult || t.paredeAtras)) for (let i = 0; i < L.angs.length - 1; i++) { const a0 = L.angs[i], a1 = L.angs[i + 1], am = (a0 + a1) / 2, q = L.pos(am, 1), n = dir(L.pos(am, 0.8), q);
          if (semChao(q, n, 1.2)) muroEntre(L.pos(a0, 1), L.pos(a1, 1), n, L.alt(a0, 1) + alto, L.alt(a1, 1) + alto, esp); }
        /* as duas pontas */
        if (vao < 359.5) for (const [ang, den] of [[t.de, t.de + Math.min(0.6, vao * 0.05)], [t.ate, t.ate - Math.min(0.6, vao * 0.05)]]) { const K = Math.max(1, Math.ceil(L.prof / 3));
          for (let k = 0; k < K; k++) { const f0 = k / K, f1 = (k + 1) / K, fm = (f0 + f1) / 2, e = L.pos(ang, fm), n = dir(L.pos(den, fm), e);
            if (semChao(e, n, 1)) muroEntre(L.pos(ang, f0), L.pos(ang, f1), n, L.alt(ang, f0) + alto, L.alt(ang, f1) + alto, esp); } }
      } });
      for (const t of ficha.retas || []) { const a = t.ang * RAD, o = [Math.cos(a), Math.sin(a)], tg = [-Math.sin(a), Math.cos(a)], pt = (x, y) => [t.u + tg[0] * x + o[0] * y, t.v + tg[1] * x + o[1] * y];
        const par = t.parapeito == null ? 1.2 : t.parapeito, hy = y => t.h[0] + (t.h[1] - t.h[0]) * y / t.prof + par, K = Math.max(1, Math.ceil(t.comp / 3)), J = Math.max(1, Math.ceil(t.prof / 3));
        for (let k = 0; k < K; k++) { const x0 = -t.comp / 2 + t.comp * k / K, x1 = -t.comp / 2 + t.comp * (k + 1) / K; if (semChao(pt((x0 + x1) / 2, t.prof), o, 1.2)) muroEntre(pt(x0, t.prof), pt(x1, t.prof), o, hy(t.prof), hy(t.prof), 0.8); }
        for (const sg of [-1, 1]) { const n = [tg[0] * sg, tg[1] * sg]; for (let k = 0; k < J; k++) { const y0 = t.prof * k / J, y1 = t.prof * (k + 1) / J;
          if (semChao(pt(sg * t.comp / 2, (y0 + y1) / 2), n, 1)) muroEntre(pt(sg * t.comp / 2, y0), pt(sg * t.comp / 2, y1), n, hy(y0), hy(y1), 0.8); } }
      }
    }
    if (ALA !== false && ficha.aneis.length) {
      const cfg = ALA && typeof ALA === 'object' ? ALA : {}, corA = cfg.cor || '#e3e6e8', corBase = cfg.corBase || '#cfccc2', limiar = cfg.limiar == null ? 8 : cfg.limiar, CAMPO = { a: 52.5, b: 34, r: 0 }, tela = [];
      /* a cerca por uma linha de pontos: um poste a cada 3 m, o cano de cima e a tela */
      const cerca = (pts, base, alt) => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3)), d = dir(a, b), n = [-d[1] * 0.2, d[0] * 0.2], g = [-d[1] * 0.3, d[0] * 0.3];
          for (let k = 0; k < m; k++) { const p0 = entre(a, b, k / m), p1 = entre(a, b, (k + 1) / m), y = base + alt;
            caixa(0.42, alt, 0.42, corA, p0[0], base + alt / 2, -p0[1]);
            /* (no chão, a cerca nasce de uma mureta baixa de concreto) */
            if (base < 0.5) { Pm.quad(P(p0[0] - g[0], p0[1] - g[1], 0.6), P(p1[0] - g[0], p1[1] - g[1], 0.6), P(p1[0] + g[0], p1[1] + g[1], 0.6), P(p0[0] + g[0], p0[1] + g[1], 0.6), corBase);
              for (const sg of [-1, 1]) Pm.quad(P(p0[0] + g[0] * sg, p0[1] + g[1] * sg, 0), P(p1[0] + g[0] * sg, p1[1] + g[1] * sg, 0), P(p1[0] + g[0] * sg, p1[1] + g[1] * sg, 0.6), P(p0[0] + g[0] * sg, p0[1] + g[1] * sg, 0.6), corBase); }
            Pm.quad(P(p0[0] - n[0], p0[1] - n[1], y), P(p1[0] - n[0], p1[1] - n[1], y), P(p1[0] + n[0], p1[1] + n[1], y), P(p0[0] + n[0], p0[1] + n[1], y), corA);
            for (const q of [P(p0[0], p0[1], base), P(p1[0], p1[1], base), P(p1[0], p1[1], y), P(p0[0], p0[1], base), P(p1[0], p1[1], y), P(p0[0], p0[1], y)]) tela.push(q[0], q[1], q[2]); } }
        if (pts.length) { const z = pts[pts.length - 1]; caixa(0.42, alt, 0.42, corA, z[0], base + alt / 2, -z[1]); } };
      const anel = ficha.aneis[0];
      for (const t of anel.trechos) {
        if (t.tipo === 'vazio' || (t.tipo === 'passagem' && t.alt > 1)) continue;
        if (t.tipo === 'passagem') { const L = piso(anel, t); cerca(L.angs.map(a => L.pos(a, 0)), 0, cfg.h || 2.4); continue; }
        const m = (t.de + t.ate) / 2; if (raioDe(m, t.dentro || anel.dentro) - raioDe(m, CAMPO) < limiar) continue;
        const L = lance(anel, t); cerca(L.angs.map(a => L.pos(a, 0)), L.h0 + 1.1, 1.5);
      }
      if (tela.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tela, 3));
        cena.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: corA, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }))); }
    }
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
  /* ---- A FACHADA DE GALERIAS ABERTAS (o Mangueirão; dono, 16/11/2026, com duas fotos de fora: "veja como se constrói a
     fachada do estádio, voce fez só um bloco liso"). Estádio de concreto dos anos 70 não tem parede por fora: tem ANDARES
     DE GALERIA, um em cima do outro, abertos. De fora se vê a beira branca de cada laje com a mureta, o vão escuro entre
     uma e outra, os pilares grossos recuados e, embaixo, o anel largo da rampa, também aberto por baixo.
     `fachada.galerias: { dentro, fora, pisos: [altura, ...], bordas: [altura, ...] (só a beira, onde o piso já existe),
     esp, guarda, cor, corPiso, corFundo, topo, pilares: { n, recuo, larg, h, cor }, deck: { fora, h, guarda, cor, corPiso,
     corVao } }`. ---- */
  if (fc.galerias) {
    /* (malha própria: as do chão e das paredes já foram fechadas mais acima) */
    const g = fc.galerias, passo = g.passo || 3, esp = g.esp == null ? 0.45 : g.esp, gd = g.guarda == null ? 1 : g.guarda, Gm = Malha();
    /* (`de`, `ate`: as galerias só num arco — a ferradura da Fonte Nova, aberta num dos fundos) */
    const A0 = g.de || 0, A1 = g.ate == null ? A0 + 360 : g.ate;
    const faixaV = (c, dr, h0, h1, cor) => { for (let a = A0; a < A1 - 1e-6; a += passo) { const q0 = ponto(a, raioDe(a, c) + dr), q1 = ponto(a + passo, raioDe(a + passo, c) + dr);
      Gm.quad(P(q0[0], q0[1], h0), P(q1[0], q1[1], h0), P(q1[0], q1[1], h1), P(q0[0], q0[1], h1), cor); } };
    const laje = (c0, c1, h, cor) => { for (let a = A0; a < A1 - 1e-6; a += passo) { const p = (ang, c) => { const q = ponto(ang, raioDe(ang, c)); return P(q[0], q[1], h); };
      Gm.quad(p(a, c0), p(a, c1), p(a + passo, c1), p(a + passo, c0), cor); } };
    /* o fundo escuro das galerias (a sombra de dentro), encostado na parede de trás da arquibancada */
    if (g.corFundo) faixaV(g.dentro, 0.25, 0, g.topo || Math.max(...(g.pisos || []), ...(g.bordas || [])), g.corFundo);
    for (const h of g.pisos || []) { laje(g.dentro, g.fora, h, g.corPiso || '#cfccc2'); faixaV(g.fora, 0, h - esp, h + gd, g.cor || '#eeede7'); }
    for (const h of g.bordas || []) faixaV(g.fora, 0.05, h - esp, h + gd, g.cor || '#eeede7');
    if (g.pilares) { const pl = g.pilares, n = pl.n || 48, L = pl.larg || 1.6;
      for (let i = 0; i < n; i++) { const a = A0 + (A1 - A0) * (i + 0.5) / n, q = ponto(a, raioDe(a, g.fora) - (pl.recuo == null ? 3 : pl.recuo)); caixa(L, pl.h, L, pl.cor || '#d9d6cc', q[0], pl.h / 2, -q[1], cena); } }
    if (g.deck) { const d = g.deck, gdd = d.guarda == null ? 1 : d.guarda;
      laje(g.fora, d.fora, d.h, d.corPiso || '#d6d3c8');
      faixaV(d.fora, 0, d.h - 0.7, d.h + gdd, d.cor || '#eeede7'); faixaV(d.fora, -0.3, 0, d.h - 0.7, d.corVao || '#3f4144'); }
    if (!Gm.vazia) cena.add(Gm.malha());
  }
  /* ---- os refletores, o placar e as peças soltas ---- */
  for (const r of ficha.refletores || []) {
    /* com o quarto número (a altura do pé), o poste nasce em cima da cobertura em vez de vir do chão (dono, 14/11/2026:
       "deixe de fazer o refletor atravessar a arquibancada, ele só começa da cobertura pra cima") e sai junto com ela na foto */
    const [u, v, h, pe = 0] = r, g = pe ? coberturas : cena; caixa(0.9, h - pe, 0.9, '#8d9093', u, pe + (h - pe) / 2, -v, g);
    const p = caixa(6, 3.4, 0.7, '#d9dcdf', u, h + 1.2, -v, g); p.rotation.y = Math.atan2(v, -u) + Math.PI / 2;
  }
  /* os pórticos de luz (Morumbi): dois pilares e a treliça deitada em cima, rente à beira de fora */
  for (const pp of ficha.porticos || []) {
    const r = raioDe(pp.ang, lim.fora) + (pp.dr == null ? 2 : pp.dr), c = ponto(pp.ang, r), a = pp.ang * RAD, tx = -Math.sin(a), ty = Math.cos(a), cr = pp.cor || '#e6e8ea';
    for (const sg of [-1, 1]) caixa(1.8, pp.h, 1.8, cr, c[0] + tx * sg * pp.larg / 2, pp.h / 2, -(c[1] + ty * sg * pp.larg / 2));
    for (const [dy, alt, esp] of [[0, 0.9, 3.2], [4.2, 0.9, 3.2]]) { const m = caixa(pp.larg + 6, alt, esp, cr, c[0], pp.h + dy, -c[1]); m.rotation.y = (pp.ang + 90) * RAD; }
    const nb = Math.round(pp.larg / 4); for (let i = 0; i <= nb; i++) { const x = -pp.larg / 2 + pp.larg * i / nb; caixa(0.5, 4.2, 0.5, cr, c[0] + tx * x, pp.h + 2.1, -(c[1] + ty * x)); }
    const luz = caixa(pp.larg * 0.86, 3, 0.9, '#f7f9fb', c[0] - Math.cos(a) * 1.4, pp.h + 2.1, -(c[1] - Math.sin(a) * 1.4)); luz.rotation.y = (pp.ang + 90) * RAD;
  }
  /* ---- OS ARCOS DE TRELIÇA por cima da cobertura (o Nilton Santos; dono, 16/11/2026: "aplique o arco de decoração da
     cobertura corretamente"): `arcos: [{ de: [u, v], ate: [u, v], pe, topo, inclina, base, n, esp, cor, pilar: { r, cor } }]`.
     Um tubo grosso em parábola, do alto de um pilar (`pe`, a altura dos pés) ao alto do outro, com o meio a `topo` metros e
     tombado `inclina` metros pra dentro do estádio; dele descem os tirantes em zigue-zague até a linha da cobertura (`base`, a
     altura do telhado embaixo do arco). Em cada pé, o pilar redondo de concreto com o anel da passarela. O arco sai transparente
     na vista de cima, como toda cobertura (`cobertura: false` deixa opaco); os pilares, de fora das arquibancadas, inteiros. ---- */
  for (const ar of ficha.arcos || []) {
    const n = ar.n || 14, [u0, v0] = ar.de, [u1, v1] = ar.ate, L = Math.hypot(u1 - u0, v1 - v0), cor = ar.cor || '#f1f1ee', esp = ar.esp || 2.2, g = ar.cobertura === false ? cena : coberturas;
    /* (a normal que aponta pro meio do campo) */
    let nx = -(v1 - v0) / L, ny = (u1 - u0) / L; if (nx * (u0 + u1) + ny * (v0 + v1) > 0) { nx = -nx; ny = -ny; }
    const inc = ar.inclina || 0, base = ar.base == null ? ar.pe : ar.base;
    const noArco = f => { const k = 4 * f * (1 - f); return [u0 + (u1 - u0) * f + nx * inc * k, v0 + (v1 - v0) * f + ny * inc * k, ar.pe + (ar.topo - ar.pe) * k]; };
    const noTelhado = f => { const k = 4 * f * (1 - f); return [u0 + (u1 - u0) * f + nx * inc * 0.5 * k, v0 + (v1 - v0) * f + ny * inc * 0.5 * k, base]; };
    for (let i = 0; i < n; i++) { const f0 = i / n, f1 = (i + 1) / n, fm = (i + 0.5) / n;
      barra(noArco(f0), noArco(f1), esp, cor, g);
      /* (os tirantes só onde o arco já passou da altura do telhado) */
      if (noArco(fm)[2] > base + 3) { barra(noArco(f0), noTelhado(fm), esp * 0.22, cor, g); barra(noTelhado(fm), noArco(f1), esp * 0.22, cor, g);
        if (i > 0 && noArco((i - 0.5) / n)[2] > base + 3) barra(noTelhado((i - 0.5) / n), noTelhado(fm), esp * 0.3, cor, g); } }
    if (ar.pilar !== false) for (const [u, v] of [ar.de, ar.ate]) { const pl = ar.pilar || {}, r = pl.r || 2.6, cp = pl.cor || '#d3d3cd';
      const cil = (raio, h, y, c) => { const m = sombra(new THREE.Mesh(new THREE.CylinderGeometry(raio, raio, h, 14), mat(c))); m.position.set(u, y + h / 2, -v); cena.add(m); };
      cil(r, ar.pe, 0, cp); cil(r + 1.1, 1.2, ar.pe * 0.66, '#e6e6e1'); cil(r + 0.25, 3, ar.pe - 1.5, '#eeeeea'); }
  }
  for (const b of ficha.blocos || []) {
    const grupo = b.cobertura ? coberturas : cena;
    const m = caixa(b.w, b.h, b.d, b.cor || '#c9c6bb', b.u, (b.y || 0) + b.h / 2, -b.v, grupo); if (b.giro) m.rotation.y = b.giro * RAD;
    /* o letreiro pintado em cima (a cobertura da Neo Química Arena) */
    if (b.texto) {
      /* `textoFace: true`: o letreiro vai em pé, na face do bloco que olha pra `+u` (girada com o `giro`) — a fachada do Moisés Lucarelli */
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.max(64, Math.round(1024 * (b.textoFace ? b.h / b.d : b.d / b.w)));
      const x = cv.getContext('2d'); x.fillStyle = b.corTexto || '#3a3c40'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const linhas = b.texto.split('|'), px = Math.round(cv.height * (b.textoAltura || 0.42)); x.font = `bold ${px}px "DejaVu Sans", "Arial", sans-serif`;
      const larg = Math.max(...linhas.map(l => x.measureText(l).width)), cabe = 1024 * (b.textoLargura || 0.6);
      linhas.forEach((l, i) => { x.save(); x.translate(512 + 1024 * (b.textoU || 0), cv.height * (b.textoMeio || 0.5) + (i - (linhas.length - 1) / 2) * px * 1.05); x.scale(Math.min(1, cabe / larg), 1);
        x.textAlign = b.textoAlinha || 'center'; x.fillText(l, b.textoAlinha === 'left' ? -larg / 2 : 0, 0); x.restore(); });
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      if (b.textoFace) {
        const g = (b.giro || 0) * RAD, r = b.w / 2 + 0.08;
        const pf = new THREE.Mesh(new THREE.PlaneGeometry(b.d, b.h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
        pf.rotation.y = Math.PI / 2 + g; pf.position.set(b.u + r * Math.cos(g), (b.y || 0) + b.h / 2, -b.v - r * Math.sin(g)); grupo.add(pf);
        continue;
      }
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.d), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      pl.rotation.order = 'YXZ'; pl.rotation.x = -Math.PI / 2; pl.rotation.y = ((b.giro || 0) + (b.textoGiro || 0)) * RAD; pl.position.set(b.u, (b.y || 0) + b.h + 0.08, -b.v); grupo.add(pl);
    }
  }
  /* ---- OS TELHADOS EM POLÍGONO (o oitavado do Heriberto Hülse): uma laje fina com o contorno que a ficha der
     (`pontos`, em metros) e, se houver, o vão do meio (`furo`). Sai transparente na foto de cima, como toda
     cobertura; com `cobertura: false` fica opaco (telhado de prédio). ---- */
  for (const t of ficha.telhados || []) {
    const sh = new THREE.Shape(t.pontos.map(q => new THREE.Vector2(q[0], q[1])));
    if (t.furo) sh.holes.push(new THREE.Path(t.furo.map(q => new THREE.Vector2(q[0], q[1]))));
    const g = new THREE.ExtrudeGeometry(sh, { depth: t.h || 0.5, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
    const m = sombra(new THREE.Mesh(g, mat(t.cor || '#cbcdce', { flatShading: true }))); m.position.y = t.y || 0;
    /* `sombra: false`: o telhado não escurece as arquibancadas nas vistas de conferência (o Independência, com o fundo inteiro
       debaixo do telhado, saía cinza, sem cadeira à vista; dono, 15/11/2026: "As arquibancadas atrás do gol também têm
       cadeiras, da mesma cor das demais"). A vista de cima do jogo já é feita sem a sombra das coberturas. */
    if (t.sombra === false) m.castShadow = false;
    (t.cobertura === false ? cena : coberturas).add(m);
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
    } else if (e.tipo === 'piso') {
      /* O PISO DESENHADO do quarteirão do estádio (dono, 16/11/2026: "preciso de mais detalhismo no quarteirão do estádio [...]
         pode ter calçadas, ciclovias, jardim maior, ou concreto também, ou piso de praça"): um retângulo (`u, v, w, d, giro`)
         ou um polígono (`pts`, com `furo` opcional) pintado com um padrão que se repete em metros. `padrao`: 'ladrilho' (a
         junta a cada `passo`), 'xadrez' (duas cores), 'pedra' (a pedra portuguesa, em ondas), 'ciclovia' (vermelha, com as
         faixas brancas da beira e a tracejada do meio; corre ao longo de `w`) ou 'liso'. */
      const T = 256, cp = document.createElement('canvas'); cp.width = cp.height = T; const x = cp.getContext('2d'), c1 = e.cor || '#c4bfb2', c2 = e.cor2 || '#aaa598', pas = e.passo || 3; let per = pas;
      x.fillStyle = c1; x.fillRect(0, 0, T, T);
      if (e.padrao === 'xadrez') { per = pas * 2; x.fillStyle = c2; x.fillRect(0, 0, T / 2, T / 2); x.fillRect(T / 2, T / 2, T / 2, T / 2); }
      else if (e.padrao === 'pedra') { per = pas * 2; x.fillStyle = c2; for (const y0 of [0, T / 2]) { x.beginPath(); x.moveTo(0, y0 + T * 0.1); for (let i = 0; i <= T; i += 4) x.lineTo(i, y0 + T * 0.1 + Math.sin(i / T * Math.PI * 2) * T * 0.085); for (let i = T; i >= 0; i -= 4) x.lineTo(i, y0 + T * 0.33 + Math.sin(i / T * Math.PI * 2) * T * 0.085); x.closePath(); x.fill(); } }
      else if (e.padrao === 'ladrilho') { x.strokeStyle = c2; x.lineWidth = 6; x.strokeRect(0, 0, T, T); }
      else if (e.padrao === 'ciclovia') { x.fillStyle = e.cor || '#b5553f'; x.fillRect(0, 0, T, T); x.fillStyle = '#f1efe6'; x.fillRect(0, 6, T, 12); x.fillRect(0, T - 18, T, 12); x.fillStyle = '#f2d24a'; x.fillRect(0, T / 2 - 5, T * 0.5, 10); }
      const tex = new THREE.CanvasTexture(cp); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
      let g;
      if (e.padrao === 'ciclovia' && !e.pts) { g = new THREE.PlaneGeometry(e.w, e.d); g.rotateX(-Math.PI / 2); tex.repeat.set(Math.max(1, Math.round(e.w / 4)), 1); }
      else { const gr = (e.giro || 0) * RAD, cg = Math.cos(gr), sg = Math.sin(gr), pts = e.pts || [[-e.w / 2, -e.d / 2], [e.w / 2, -e.d / 2], [e.w / 2, e.d / 2], [-e.w / 2, e.d / 2]].map(([a, b]) => [e.u + a * cg - b * sg, e.v + a * sg + b * cg]);
        const sh = new THREE.Shape(pts.map(q => new THREE.Vector2(q[0], q[1]))); if (e.furo) sh.holes.push(new THREE.Path(e.furo.map(q => new THREE.Vector2(q[0], q[1]))));
        g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); tex.repeat.set(1 / per, 1 / per); }
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex })); m.receiveShadow = true;
      if (e.padrao === 'ciclovia' && !e.pts) { m.position.set(e.u, e.y || 0.11, -e.v); if (e.giro) m.rotation.y = e.giro * RAD; } else m.position.y = e.y || 0.105;
      cena.add(m);
    } else if (e.tipo === 'jardim') {
      /* O JARDIM: o gramado com a cerca viva em volta, o caminho que atravessa, os canteiros de flor, as árvores e os bancos */
      caixa(e.w, 0.14, e.d, e.cor || '#6f9a55', e.u, 0.07, -e.v);
      for (const [du, dv, w, d] of [[0, e.d / 2 - 0.4, e.w, 0.8], [0, -e.d / 2 + 0.4, e.w, 0.8], [e.w / 2 - 0.4, 0, 0.8, e.d], [-e.w / 2 + 0.4, 0, 0.8, e.d]]) caixa(w, 0.75, d, '#3f7a3f', e.u + du, 0.375, -(e.v + dv));
      if (e.w >= 18 || e.d >= 18) { if (e.w >= e.d) caixa(2.4, 0.18, e.d, '#d9d3c5', e.u, 0.09, -e.v); else caixa(e.w, 0.18, 2.4, '#d9d3c5', e.u, 0.09, -e.v); }
      const FL = ['#d8443a', '#f2c230', '#e98fb0', '#f4f1ea', '#8a5fc0', '#e8792e'];
      for (let i = 0; i < Math.max(2, Math.round(e.w * e.d / 85)); i++) caixa(1.6 + rnd() * 1.8, 0.34, 1.2 + rnd() * 1.4, FL[Math.floor(rnd() * FL.length)], e.u + (rnd() - 0.5) * (e.w - 5), 0.22, -(e.v + (rnd() - 0.5) * (e.d - 5)));
      for (let i = 0; i < (e.n || 0); i++) { const u = e.u + (rnd() - 0.5) * (e.w - 4), v = e.v + (rnd() - 0.5) * (e.d - 4), r = 2.2 + rnd() * 1.9;
        caixa(0.6, 3, 0.6, '#6b5a45', u, 1.5, -v); const m = sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(['#3f8a47', '#4a9a52', '#357a3e', '#5aa64f'][Math.floor(rnd() * 4)], { flatShading: true }))); m.position.set(u, 3 + r * 0.7, -v); cena.add(m); }
      if (e.bancos !== false) { const hz = e.w >= e.d, n = Math.max(1, Math.round((hz ? e.w : e.d) / 12));
        for (let i = 0; i < n; i++) for (const sgn of [-1, 1]) { const f = ((i + 0.5) / n - 0.5) * (hz ? e.w : e.d); if (hz) caixa(1.9, 0.5, 0.6, '#7a5a3a', e.u + f, 0.25, -(e.v + sgn * (e.d / 2 + 0.9))); else caixa(0.6, 0.5, 1.9, '#7a5a3a', e.u + sgn * (e.w / 2 + 0.9), 0.25, -(e.v + f)); } }
    } else if (e.tipo === 'chafariz') {
      const r = e.r || 4; for (const [rr, h, c] of [[r, 0.6, '#b9b5aa'], [r - 0.5, 0.64, '#5fa8d0'], [r * 0.3, 1.2, '#b9b5aa'], [r * 0.24, 1.26, '#7fc0e0'], [0.3, 2.6, '#c9c5ba']]) { const m = sombra(new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, h, 22), mat(c))); m.position.set(e.u, h / 2, -e.v); cena.add(m); }
    } else if (e.tipo === 'poste') {
      caixa(0.2, e.h || 5.5, 0.2, '#5c6165', e.u, (e.h || 5.5) / 2, -e.v); caixa(1.3, 0.14, 0.34, '#efe9c8', e.u, e.h || 5.5, -e.v);
    } else if (e.tipo === 'banco') {
      const m = caixa(1.9, 0.5, 0.6, '#7a5a3a', e.u, 0.25, -e.v); if (e.giro) m.rotation.y = e.giro * RAD;
    } else if (e.tipo === 'ambulante') {
      /* OS AMBULANTES da porta do estádio (dono, 16/11/2026: "pontos de venda como barraquinhas, churrasquinho, cachorro quente
         e etc, como o outro jogo 3d fazia"): os cinco do jogo 3D antigo (cenario3d/js/ambulantes3d.js), em poucas peças.
         `sabor`: 'pipoca' (o carrinho de vidro), 'cachorro' (o carrinho de inox com o guarda-sol amarelo e vermelho),
         'espetinho' (a churrasqueira, o isopor e o toldo listrado), 'bebidas' (os isopores e o guarda-sol azul) ou 'camelo' (a
         arara de camisas nas `cores` do clube, a mesa dos bonés e a bandeira). `giro` em graus; `escala` aumenta a peça inteira
         (na cena vista de cima, do tamanho de verdade ela some). */
      const g = (e.giro || 0) * RAD, cg = Math.cos(g), sg = Math.sin(g), K = e.escala || 1, em = (x, z) => [e.u + (x * cg + z * sg) * K, e.v + (x * sg - z * cg) * K];
      const pc = (w, h, d, cor, x, y, z) => { const q = em(x, z), m = caixa(w * K, h * K, d * K, cor, q[0], y * K, -q[1]); m.rotation.y = g; return m; };
      const sol = (x, z, r, c1, c2) => { const q = em(x, z); caixa(0.08 * K, 2.1 * K, 0.08 * K, '#d9d9d6', q[0], 1.05 * K, -q[1]);
        const a = sombra(new THREE.Mesh(new THREE.ConeGeometry(r * K, 0.5 * K, 8), mat(c1, { flatShading: true }))); a.position.set(q[0], 2.3 * K, -q[1]); cena.add(a);
        const b = sombra(new THREE.Mesh(new THREE.ConeGeometry(r * 0.45 * K, 0.32 * K, 8), mat(c2, { flatShading: true }))); b.position.set(q[0], 2.5 * K, -q[1]); cena.add(b); };
      const toldo = (c1, c2) => { for (const [x, z] of [[-1.2, -0.9], [1.2, -0.9], [-1.2, 0.9], [1.2, 0.9]]) pc(0.08, 2.2, 0.08, '#d9d9d6', x, 1.1, z); for (let k = 0; k < 4; k++) pc(0.66, 0.08, 2.1, k % 2 ? c2 : c1, -0.99 + 0.66 * k, 2.24, 0); };
      if (e.sabor === 'pipoca') { pc(1.1, 0.7, 0.7, '#c62828', 0, 0.75, 0); pc(1.0, 0.6, 0.6, '#e9f1f4', 0, 1.4, 0); pc(1.3, 0.1, 0.9, '#c62828', 0, 1.78, 0); pc(0.06, 0.5, 0.5, '#2a2a2a', -0.62, 0.3, 0); pc(0.06, 0.5, 0.5, '#2a2a2a', 0.62, 0.3, 0); }
      else if (e.sabor === 'cachorro') { pc(1.5, 0.85, 0.75, '#c9ced2', 0, 0.55, 0); pc(1.4, 0.3, 0.1, '#e9f1f4', 0, 1.12, 0.3); pc(0.3, 0.2, 0.3, '#b23b2c', 0.4, 1.08, -0.1); sol(-0.2, -0.2, 1.4, '#f2c230', '#c62828'); }
      else if (e.sabor === 'espetinho') { pc(1.2, 0.8, 0.5, '#2f2f31', 0, 0.5, 0); pc(1.05, 0.06, 0.36, '#d8492a', 0, 0.93, 0); pc(0.6, 0.5, 0.45, '#eef0ee', 1.2, 0.25, 0.1); pc(0.45, 0.45, 0.45, '#e9e9e4', -1.1, 0.45, -0.5); toldo(e.cor || '#c62828', '#f4f1ea'); }
      else if (e.sabor === 'bebidas') { pc(0.7, 0.5, 0.5, '#eef0ee', -0.4, 0.45, 0); pc(0.7, 0.5, 0.5, '#2f6fb0', 0.4, 0.45, 0); pc(0.7, 0.45, 0.5, '#eef0ee', 0, 0.95, 0); pc(0.45, 0.45, 0.45, '#e9e9e4', 1.2, 0.45, -0.4); sol(0, -0.3, 1.45, '#2f6fb0', '#f4f1ea'); }
      else { const cs = e.cores || ['#f2c230', '#1f8a3c']; pc(2.2, 0.06, 0.06, '#8d949a', 0, 1.7, 0); pc(0.06, 1.7, 0.06, '#8d949a', -1.1, 0.85, 0); pc(0.06, 1.7, 0.06, '#8d949a', 1.1, 0.85, 0);
        for (let k = 0; k < 5; k++) pc(0.34, 0.6, 0.1, cs[k % cs.length], -0.84 + 0.42 * k, 1.36, 0);
        pc(1.3, 0.75, 0.7, '#7a5a3a', 0.2, 0.375, -1.1); for (let k = 0; k < 3; k++) pc(0.28, 0.1, 0.28, cs[(k + 1) % cs.length], -0.2 + 0.42 * k, 0.8, -1.1);
        pc(0.06, 3.2, 0.06, '#8d949a', -1.4, 1.6, -1.1); pc(0.9, 0.55, 0.05, cs[0], -0.93, 2.9, -1.1); }
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
    /* (em que altura da arquibancada o bonde fica: no meio, ou onde a ficha disser — `jogo.fracao`, 0 = na frente, 1 = no fundo) */
    spawns.push(Object.assign({ id, rot, lado, entrada }, pt(ang, (j.fracao && j.fracao[id] != null) ? j.fracao[id] : 0.5), jogador ? { jogador: true } : {}));
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
    const q = G.pos(melhor.a, G.fc + (1 - G.fc) * (G.vomK0 + G.vomRows * 0.45) / G.N), p = paraPx(q[0], q[1]);
    return { x: Math.round(p[0]), y: Math.round(p[1]), ang: melhor.a };
  };
  /* (sem vomitório, o túnel fica no fundo da arquibancada; numa arquibancada rasa — menos de 12 m andáveis — ele vem mais pra
     frente, senão cai fora do chão: a arquibancadinha de 4 m do Ulrico Mursa) */
  const fundoEm = ang => { const c = contornoEm(ang); return raioDe(ang, c.f) - raioDe(ang, c.d) < 12 ? 0.7 : 0.9; };
  const tunel = (id, rot, lado, ang) => { const v = vomitorioEm(ang);
    return v ? { id, rot, lado, raio: 40, dir: dirPx(v.ang, 1), x: v.x, y: v.y } : Object.assign({ id, rot, lado, raio: 40, dir: dirPx(ang, 1) }, pt(ang, fundoEm(ang))); };
  const entradas = [tunel('portao_mandante', 'TÚNEL MANDANTE', 'mandante', j.tunelMandante == null ? meio(j.mandante1) : j.tunelMandante),
                    tunel('portao_visitante', 'TÚNEL VISITANTE', 'visitante', j.tunelVisitante == null ? meio(j.visitante) : j.tunelVisitante)];
  const grades = [vd, va].map((ang, i) => { const a = pt(ang, 0.04), b = pt(ang, 0.96);
    return { id: 'div_v' + (i + 1), rot: 'DIVISÓRIA', de: a, ate: b, modulos: Math.max(3, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 28)), espessura: 10 }; });
  /* AS GRADES DOS ESCANTEIOS (dono, 15/11/2026, com fotos do Castelão: "a cada escanteio de estádio deve ter uma grade
     limitadora também [...] pra limitar a passagem. Isso deve servir pra deixar a cena das brigas um pouco mais lenta. Em
     casos de arquibancadas que não são conectadas umas com as outras, a grade fica no chão entre uma arquibancada e outra").
     Uma grade por canto, do campo pra fora, atravessando TODO o chão andável naquela direção (lance, corredor, piso, reta):
     assim não sobra por onde contornar. Em volta da direção do canto (±12 graus) fica a linha mais CURTA: numa arquibancada
     contínua ela corta o lance; entre duas arquibancadas separadas ela cai no vão, no chão. Não nasce dentro de setor de
     torcida nem do curral da visitante. `jogo.gradesCanto: false` desliga. */
  if (j.gradesCanto !== false) {
    const c = lim.dentro, q2 = Math.SQRT1_2, pc = curva(c) ? [c.a * q2, c.b * q2] : [c.a - (c.r || 0) * (1 - q2), c.b - (c.r || 0) * (1 - q2)];
    const rMax = Math.max(raioDe(0, lim.fora), raioDe(90, lim.fora), raioDe(45, lim.fora)) + 45;
    const dentroDe = (ang, [d, a], m) => { const x = ((ang - (d - m)) % 360 + 360) % 360; return x <= (a - d) + 2 * m; };
    const ocupado = ang => dentroDe(ang, [vd, va], (j.folgaPM || 7) + 2) || ['mandante1', 'mandante2', 'mandante3'].some(k => j[k] && dentroDe(ang, j[k], 1.5));
    /* o chão andável ao longo de uma direção: de onde começa até onde acaba */
    const chaoEm = ang => { const cx = Math.cos(ang * RAD), sy = Math.sin(ang * RAD); let r0 = null, r1 = null;
      for (let r = 20; r <= rMax; r += 0.5) if (andavel(ficha, cx * r, sy * r)) { if (r0 == null) r0 = r; r1 = r; }
      return r0 == null ? null : [r0, r1]; };
    [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([sx, sy], k) => {
      const base = Math.atan2(sy * pc[1], sx * pc[0]) / RAD; let melhor = null;
      for (const larg of [12, 26]) { for (let da = -larg; da <= larg; da += 1) { const ang = base + da; if (ocupado(ang)) continue;
          const ch = chaoEm(ang); if (!ch || ch[1] - ch[0] < 1.5) continue;
          const nota = (ch[1] - ch[0]) * (1 + 0.02 * Math.abs(da)); if (!melhor || nota < melhor.nota) melhor = { ang, ch, nota }; }
        if (melhor) break; }
      if (!melhor) return;
      const cx = Math.cos(melhor.ang * RAD), sn = Math.sin(melhor.ang * RAD), a = paraPx(cx * (melhor.ch[0] - 0.4), sn * (melhor.ch[0] - 0.4)), b = paraPx(cx * (melhor.ch[1] + 0.4), sn * (melhor.ch[1] + 0.4));
      grades.push({ id: 'canto_' + (k + 1), rot: 'GRADE DO ESCANTEIO', de: { x: Math.round(a[0]), y: Math.round(a[1]) }, ate: { x: Math.round(b[0]), y: Math.round(b[1]) },
        modulos: Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 28)), espessura: 10 });
    });
  }
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
