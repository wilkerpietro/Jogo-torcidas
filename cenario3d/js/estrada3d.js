/* =========================================================
   A ESTRADA DA CARAVANA (o jogo 3D, 29/09/2026)

   O dono: "crie uma cena de caravana que vai basicamente ser uma
   estrada em linha reta que vai ter curvas na margem direita da pista
   com setas apontando quais cidades estamos passando próximo (são as
   que definimos na rota do itinerário). em algum momento alguma torcida
   pode nos atacar nessa cena quando estivermos passando na cidade caso
   isso realmente esteja programado no itinerário. adapte as duas cenas
   de caravana para aparecerem durante a estrada" — e o exemplo dele:
   Fortaleza a Manaus, a Terror Bicolor atacando em Belém: o ônibus anda
   em linha reta, as placas das cidades aparecem na ordem da viagem
   (Maranhão, Belém, Manaus); em Belém a torcida que ataca está na margem
   da estrada, o ônibus para, a torcida desce e a briga começa; definida
   a briga, quem viaja entra de novo no ônibus e o itinerário segue com
   quem não se feriu.

   A viagem (a ida, na véspera do jogo fora; a volta, depois dele) é um
   palco à parte, longe da praça (a cidade some enquanto ela está na
   tela): uma rodovia reta de mão dupla com o ônibus da torcida na mão
   da direita. Cada praça da rota (o planejamento, `rotaEscolhida`, na
   ordem da viagem) tem o trecho dela: a placa verde de aviso com o
   nome, a SAÍDA — a alça que abre em curva pra direita — com a placa e
   a seta, e a cidade lá no fundo (os prédios, a caixa d'água, a
   igreja). A última é o destino: o ônibus pega a saída dela e a viagem
   acaba.

   A EMBOSCADA DA ROTA (itinerario.js: a emboscada marcada numa praça
   da rota) é no trecho daquela praça, numa das duas cenas do dono
   encaixada na rodovia (caravana3d.js): o POSTO — o ônibus entra no
   pátio e para na frente das bombas; eles esperam na saída do pátio —
   ou a PISTA FECHADA — os dois carros brancos atravessados na mão da
   direita, o ônibus para no meio da pista; eles esperam na calçada,
   atrás. O tabuleiro da briga é o da cena (`cenaDaCaravana`), girado e
   posto em cima da peça: a briga acontece ali, na estrada. Antes dela a
   nossa torcida desce pela porta do ônibus; depois, quem ficou de pé
   volta pra ele (os caídos ficam no chão, os deles vão embora) e a
   viagem segue.

   O MUNDO DA ESTRADA: s é o metro da viagem (o x do mundo), l o metro
   pra direita dela (o z do mundo); O é o mundo no metro 0 da pista.
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import * as K from './detalhe3d.js?v=78b065fe68';
import { montarCaravana, cenaDaCaravana, PLANOS, ESCALA, chaoDeLonge, posteDeRede, fiosEntre, cerca, faixaPintada, capim } from './caravana3d.js?v=78b065fe68';

const PI = Math.PI;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const suave = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
/* A RODOVIA (m): a pista de 7,2 m (duas mãos de 3,6) e o acostamento de
   2,5 m de cada lado; o ônibus na mão da direita */
const MAO = 3.6, PISTA = 2 * MAO, ACOST = 2.5, NA_MAO = 1.8;
/* o trecho de cada praça: a placa de aviso (12 m depois do começo dele),
   a saída (a alça abre 95 m depois; na praça da emboscada, 35 m depois
   da peça) e o fim (190 m) */
const TRECHO = 190, AVISO = 12, SAIDA = 95, DEPOIS_DA_PECA = 35;
/* a alça: começa 25 m antes da saída na beira da mão da direita e abre
   em curva até 60 m pra direita; segue reta até a cidade */
const ALCA_L = 5.7, ALCA_LARG = 4.2;
/* o andar do ônibus (m/s e m/s²): a 100 por hora na pista, a 50 na alça */
const VEL = 28, VEL_ALCA = 13, FREIA = 4.2, ACELERA = 2.8;
/* a pista da peça (px do tabuleiro): de x −2200 a 3700 (caravana3d.js) */
const PECA_X0 = -2200, PECA_X1 = 3700;
/* a porta do ônibus (o K.onibus: a frente no +x, a porta do lado +z, perto da frente) */
const PORTA = { x: 5.15, z: 1.75 };

/* A PLACA VERDE (a de rodovia): o fundo verde, a borda branca, as linhas
   de texto e a seta pra direita e pra cima (a saída) */
function texturaDaPlaca(linhas, seta, w = 512, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#0d6a3a'; x.fillRect(0, 0, w, h);
  const r = h * 0.07, b = h * 0.045;
  x.strokeStyle = '#f4f4ef'; x.lineWidth = h * 0.03;
  x.beginPath(); x.roundRect ? x.roundRect(b, b, w - 2 * b, h - 2 * b, r) : x.rect(b, b, w - 2 * b, h - 2 * b); x.stroke();
  const larg = seta ? w * 0.7 : w * 0.9, cx = seta ? w * 0.4 : w / 2;
  let y = h * 0.1;
  const soma = linhas.reduce((a, l) => a + l.tam, 0);
  y = (h - soma * h) / 2;
  for (const l of linhas) {
    let t = l.tam * h * 0.86;
    const fonte = () => `${l.fino ? '600' : 'bold'} ${t}px "Arial Narrow", Arial, sans-serif`;
    x.font = fonte();
    while (t > 8 && x.measureText(l.txt).width > larg) { t -= 2; x.font = fonte(); }
    x.fillStyle = l.cor || '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(l.txt, cx, y + l.tam * h / 2);
    y += l.tam * h;
  }
  if (seta) {
    /* a seta: a haste que sobe e dobra pra direita (↗) — no canvas o y
       desce, e o giro positivo é no sentido do relógio */
    const sx = w * 0.84, sy = h * 0.5, R = h * 0.26;
    x.save(); x.translate(sx, sy); x.rotate(PI / 4);
    x.fillStyle = '#ffffff';
    x.beginPath();
    x.moveTo(-R * 0.18, R); x.lineTo(R * 0.18, R); x.lineTo(R * 0.18, -R * 0.25); x.lineTo(R * 0.5, -R * 0.25);
    x.lineTo(0, -R); x.lineTo(-R * 0.5, -R * 0.25); x.lineTo(-R * 0.18, -R * 0.25); x.closePath(); x.fill();
    x.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
/* a placa em pé na beira (m): o painel de frente pra quem vem (−s), nos
   dois postes; `alt` é a altura do pé do painel */
function placa(g, s, l, w, h, alt, tex, texturas) {
  const poste = K.fosco('#8b9094');
  for (const dl of [-w / 2 + 0.45, w / 2 - 0.45]) g.add(K.cilindro(0.08, 0.07, alt + h - 0.1, poste, 8, s + 0.14, 0, l + dl));
  g.add(K.caixa(0.07, h, w, K.fosco('#6f7478'), s + 0.05, alt, l));
  const mat = new THREE.MeshLambertMaterial({ map: tex });
  texturas.push(tex, mat);
  g.add(K.painel(w, h, mat, s - 0.002, alt + h / 2, l, -PI / 2));
}
/* a cidade lá no fundo (m): os prédios claros, a caixa d'água e a igreja */
function cidadeNoFundo(g, sc, lc, rnd) {
  const cores = ['#d9d2c3', '#cfc6b4', '#e4ddcf', '#bdb6a8', '#d6c6a6', '#c9cfd4', '#e0d4c0', '#b7c0c6'];
  for (let k = 0; k < 12; k++) {
    const w = 9 + rnd() * 12, d = 9 + rnd() * 12, h = k < 3 ? 22 + rnd() * 26 : 6 + rnd() * 14;
    const x = sc + (rnd() - 0.5) * 110, z = lc + rnd() * 70, ry = (rnd() - 0.5) * 0.25;
    g.add(K.caixa(w, h, d, K.fosco(cores[Math.floor(rnd() * cores.length)]), x, 0, z, ry));
    g.add(K.caixa(w * 0.35, 1.6, d * 0.3, K.fosco('#8f9294'), x, h, z, ry));
  }
  /* a caixa d'água (a torre) e a igreja com a torre e o telhado */
  const cx = sc - 40 + rnd() * 20, cz = lc - 6;
  g.add(K.cilindro(0.7, 0.7, 20, K.fosco('#b4b4ab'), 8, cx, 0, cz));
  g.add(K.cilindro(3.4, 3.4, 5, K.fosco('#d9d9d0'), 14, cx, 20, cz));
  const ix = sc + 30 + rnd() * 20, iz = lc + 10;
  g.add(K.caixa(10, 8, 18, K.fosco('#efe9dc'), ix, 0, iz));
  g.add(K.caixa(4.2, 16, 4.2, K.fosco('#efe9dc'), ix, 0, iz - 10));
  const topo = new THREE.Mesh(new THREE.ConeGeometry(3.1, 4.5, 4), K.fosco('#9c5a3c'));
  topo.position.set(ix, 16 + 2.25, iz - 10); topo.rotation.y = PI / 4; g.add(topo);
  const tel = new THREE.Mesh(new THREE.ConeGeometry(7.4, 3.2, 4), K.fosco('#a35b3a'));
  tel.position.set(ix, 8 + 1.6, iz); tel.rotation.y = PI / 4; tel.scale.z = 1.7; g.add(tel);
}
/* a fita de asfalto ao longo de pontos (m, [s, l]) */
function fita(pts, larg, mat, y) {
  const pos = [], uv = [], idx = [];
  let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const nx = -dz * larg / 2, nz = dx * larg / 2;
    if (i > 0) acc += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    pos.push(x + nx, y, z + nz, x - nx, y, z - nz); uv.push(acc / 4, larg / 4, acc / 4, 0);
    if (i > 0) { const k = 2 * (i - 1); idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  return new THREE.Mesh(geo, mat);
}
/* os pontos deslocados pro lado (a borda da alça) */
function aoLado(pts, d) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz) || 1;
    return [p[0] - dz / L * d, p[1] + dx / L * d];
  });
}
const bezier = (P0, P1, P2, P3, t) => {
  const a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, d = t ** 3;
  return [a * P0[0] + b * P1[0] + c * P2[0] + d * P3[0], a * P0[1] + b * P1[1] + c * P2[1] + d * P3[1]];
};

/* =======================================================
   A ESTRADA
   `cfg`: { C (o cenário), M (unidades por metro), O ([x, z] do mundo no
   metro 0 da pista), cidades ([{ nome }], na ordem da viagem; a última é
   o destino), emb (a emboscada: { i (a praça dela), tipo ('emb-posto' ou
   'emb-onibus'), nome, cores, n }), nossa ({ nome, sigla, cores, n }),
   horas ([min, min]: a hora do dia na saída e na chegada), itinerario
   (o letreiro do ônibus) }
   ======================================================= */
export function criarEstrada(cfg) {
  const { C, M } = cfg, O = cfg.O;
  const PXM = M / ESCALA;
  const W = (s, l, P) => { P = P || {}; P.x = O[0] + s * M; P.z = O[1] + l * M; return P; };
  const rnd = K.sorteio(97);
  const cidades = cfg.cidades || [];
  const emb = cfg.emb && cfg.emb.i >= 0 && cfg.emb.i < cidades.length ? cfg.emb : null;

  /* ---------- O TRAÇADO: os trechos, a peça da emboscada e as alças ---------- */
  const trechos = [];
  let peca = null, s = 70;
  for (let i = 0; i < cidades.length; i++) {
    const t = { i, nome: String(cidades[i].nome || ''), ini: s, aviso: s + AVISO, ultima: i === cidades.length - 1 };
    if (emb && emb.i === i) {
      const P = PLANOS[emb.tipo]({ naEstrada: true });
      const sg = P.onibus.frente, bx = P.onibus.x, rc = (P.pista.y0 + P.pista.y1) / 2;
      /* (a pista da peça em s, contada do ponto em que o ônibus para) */
      const a = sg * (PECA_X0 - bx) / PXM, b = sg * (PECA_X1 - bx) / PXM;
      const s0 = s + 45, sA = s0 - Math.min(a, b);
      peca = { tipo: emb.tipo, P, sg, bx, rc, sA, lA: sg * (P.onibus.y - rc) / PXM, s0, s1: sA + Math.max(a, b), giro: sg < 0 ? PI : 0, trecho: t };
      /* o tabuleiro no mundo: o (0, 0) dele, e o giro (o posto está do outro lado da pista na foto) */
      const q = W(sA - sg * bx / PXM, -sg * rc / PXM);
      peca.O = [q.x, q.z];
      t.peca = peca;
      t.saida = peca.s1 + DEPOIS_DA_PECA;
    } else t.saida = s + SAIDA;
    /* a alça (s, l): a curva de Bézier e a reta até a cidade */
    const e = t.saida, P0 = [e - 25, ALCA_L], P1 = [e + 20, ALCA_L], P2 = [e + 58, 20], P3 = [e + 72, 58];
    const pts = [];
    for (let k = 0; k <= 36; k++) pts.push(bezier(P0, P1, P2, P3, k / 36));
    const dx = P3[0] - P2[0], dz = P3[1] - P2[1], L = Math.hypot(dx, dz);
    for (let k = 1; k <= 8; k++) pts.push([P3[0] + dx / L * 9 * k, P3[1] + dz / L * 9 * k]);
    t.alca = pts;
    t.cidade = [pts[pts.length - 1][0] + 25, pts[pts.length - 1][1] + 30];
    t.fim = t.ultima ? e + 140 : Math.max(e + TRECHO - SAIDA, e + 95);
    trechos.push(t);
    s = t.fim;
  }
  const sFim = s;

  /* ---------- O CAMINHO DO ÔNIBUS: a mão da direita, a parada, a alça do destino ---------- */
  const ult = trechos[trechos.length - 1];
  function ladoEm(sv) {
    let l = NA_MAO;
    if (peca) {
      /* entra (no posto, pelo vão entre o muro e o canteiro; na pista fechada, pro meio dela) e sai de novo */
      const [e0, e1, x0, x1] = peca.sg < 0 ? [peca.sA - 20, peca.sA - 6, peca.sA + 4, peca.sA + 16] : [peca.sA - 30, peca.sA - 6, peca.sA + 8, peca.sA + 30];
      if (sv > e0 && sv <= x0) l = NA_MAO + (peca.lA - NA_MAO) * suave((sv - e0) / (e1 - e0));
      else if (sv > x0 && sv < x1) l = peca.lA + (NA_MAO - peca.lA) * suave((sv - x0) / (x1 - x0));
    }
    const e = ult.alca[0][0];
    if (sv > e - 30) l = l + (ALCA_L - l) * suave((sv - (e - 30)) / 30);
    return l;
  }
  const caminho = [];
  for (let sv = 20; sv < ult.alca[0][0]; sv += 1) caminho.push([sv, ladoEm(sv)]);
  if (peca && !caminho.some(p => Math.abs(p[0] - peca.sA) < 1e-6)) {
    caminho.push([peca.sA, peca.lA]); caminho.sort((a, b) => a[0] - b[0]);
  }
  for (const p of ult.alca) caminho.push(p);
  const U = [0];
  for (let i = 1; i < caminho.length; i++) U.push(U[i - 1] + Math.hypot(caminho[i][0] - caminho[i - 1][0], caminho[i][1] - caminho[i - 1][1]));
  const iParada = peca ? caminho.findIndex(p => Math.abs(p[0] - peca.sA) < 1e-6 && Math.abs(p[1] - peca.lA) < 1e-6) : -1;
  const uParada = iParada >= 0 ? U[iParada] : null;
  /* a viagem acaba com o ônibus já dentro da curva da saída do destino */
  const iAlca = caminho.length - ult.alca.length;
  const uFim = U[Math.min(caminho.length - 1, iAlca + 30)];
  const uAlca = U[iAlca];
  function pontoEm(u, Q) {
    Q = Q || {};
    let i = 1;
    while (i < U.length - 1 && U[i] < u) i++;
    const a = caminho[i - 1], b = caminho[i], f = clamp((u - U[i - 1]) / Math.max(1e-6, U[i] - U[i - 1]), 0, 1);
    Q.s = a[0] + (b[0] - a[0]) * f; Q.l = a[1] + (b[1] - a[1]) * f;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    Q.hs = (b[0] - a[0]) / L; Q.hl = (b[1] - a[1]) / L;
    return Q;
  }
  /* em que trecho o ônibus está (a praça da vez, pro painel) */
  const trechoEm = sv => { let t = trechos[0]; for (const x of trechos) if (sv >= x.ini - 40) t = x; return t; };

  /* ---------- A MONTAGEM ---------- */
  let raiz = null, grupo = null, onibus = null, escondidos = [], texturas = [], montado = false;
  const pecas3d = [];
  function montarGeometria() {
    const g = new THREE.Group();
    const asf = K.pintado('asfalto', K.TEX.asfalto()), acost = K.pintado('acostamento', K.TEX.terra(), { cor: '#d8cdb8' });
    const tinta = K.decalque('faixa', K.TEX.gasta(), '#f1efe6', 0.95), amarela = K.decalque('faixaAmarela', K.TEX.gasta(), '#e3b43a', 0.95);
    /* a pista, fora do trecho da peça (a peça traz a pista dela) */
    const vaos = peca ? [[peca.s0, peca.s1]] : [];
    const pedacos = [];
    let a0 = -260;
    for (const [v0, v1] of vaos) { pedacos.push([a0, v0]); a0 = v1; }
    pedacos.push([a0, sFim + 300]);
    for (const [p0, p1] of pedacos) {
      if (p1 - p0 < 0.5) continue;
      const m = (p0 + p1) / 2, L = p1 - p0;
      g.add(K.chao(L, PISTA, asf, 4, m, 0.005, 0));
      for (const sg of [-1, 1]) {
        g.add(K.chao(L, ACOST, acost, 4, m, 0.002, sg * (MAO + ACOST / 2)));
        g.add(faixaPintada([[p0, sg * (MAO - 0.25)], [p1, sg * (MAO - 0.25)]], 0.15, tinta, 0.012));
      }
      for (let x = Math.ceil(p0 / 12) * 12; x + 4.5 < p1; x += 12) g.add(faixaPintada([[x, 0], [x + 4.5, 0]], 0.14, amarela, 0.012));
    }
    /* as alças, as placas e as cidades lá no fundo */
    for (const t of trechos) {
      g.add(fita(t.alca, ALCA_LARG, asf, 0.008));
      g.add(faixaPintada(aoLado(t.alca, ALCA_LARG / 2 - 0.25), 0.14, tinta, 0.014));
      g.add(faixaPintada(aoLado(t.alca, -(ALCA_LARG / 2 - 0.25)).slice(12), 0.14, tinta, 0.014));
      const nome = t.nome.toUpperCase();
      placa(g, t.aviso, 9.4, 6.2, 2.6, 2.4, texturaDaPlaca([{ txt: nome, tam: 0.44 }, { txt: t.ultima ? 'destino · próxima saída' : 'próxima saída', tam: 0.24, fino: true, cor: '#fff4c2' }], true, 512, 215), texturas);
      const e = t.saida, q = t.alca.find(p => p[0] >= e - 6) || t.alca[0];
      placa(g, e - 6, q[1] + ALCA_LARG / 2 + 3, 4.6, 2.2, 2.6, texturaDaPlaca([{ txt: 'SAÍDA', tam: 0.26, cor: '#fff4c2' }, { txt: nome, tam: 0.42 }], true, 512, 245), texturas);
      cidadeNoFundo(g, t.cidade[0], t.cidade[1], rnd);
    }
    /* o que fica em volta: a cerca dos dois lados (com o vão das alças e
       das peças), os postes da rede do lado de lá, o capim e as árvores */
    const cortes = [];
    for (const t of trechos) {
      const c = t.alca.find(p => p[1] >= 12);
      if (c) cortes.push([c[0] - 14, c[0] + 14]);
    }
    const livreDe = (x, lista) => !lista.some(([a, b]) => x > a && x < b);
    const semPeca = peca ? [[peca.s0 - 4, peca.s1 + 4]] : [];
    const cercas = (l, fora) => {
      let a = -240;
      const fim = sFim + 280, passo = 40;
      for (let x = a; x < fim; x += passo) {
        const b = Math.min(fim, x + passo);
        if (livreDe((x + b) / 2, fora) && livreDe(x + 1, fora) && livreDe(b - 1, fora)) g.add(cerca(x, b, l, rnd));
      }
    };
    cercas(-12.5, semPeca);
    cercas(12.5, semPeca.concat(cortes));
    const postes = [];
    let corrente = [];
    for (let x = -220; x < sFim + 260; x += 58) {
      if (!livreDe(x, semPeca.map(([a, b]) => [a - 20, b + 20]))) { if (corrente.length > 1) postes.push(corrente); corrente = []; continue; }
      const p = posteDeRede(9); p.position.set(x, 0, -9.6); g.add(p); corrente.push(p);
    }
    if (corrente.length > 1) postes.push(corrente);
    for (const c of postes) g.add(fiosEntre(c));
    const perto = (x, z) => trechos.some(t => t.alca.some(p => Math.hypot(p[0] - x, p[1] - z) < 11) || Math.hypot(t.cidade[0] - x, t.cidade[1] - z) < 95);
    const naPeca = (x, z) => peca && x > peca.s0 - 12 && x < peca.s1 + 12 && Math.abs(z) < 70;
    for (let x = -200; x < sFim + 260; x += 9) {
      for (const sg of [-1, 1]) {
        if (rnd() < 0.35) continue;
        const z = sg * (15 + rnd() * 75), xx = x + (rnd() - 0.5) * 8;
        if (perto(xx, z) || naPeca(xx, z)) continue;
        if (rnd() < 0.55) g.add(K.em(K.arvore(5 + rnd() * 5, rnd), xx, 0, z, rnd() * PI));
        else g.add(K.em(K.arbusto(0.8 + rnd() * 0.9, rnd), xx, 0, z, rnd() * PI));
      }
    }
    for (const sg of [-1, 1]) for (let x = -200; x < sFim + 260; x += 60) {
      if (naPeca(x, sg * 13)) continue;
      capim(g, { x0: x, x1: x + 60, z0: sg > 0 ? 6.4 : -13.2, z1: sg > 0 ? 13.2 : -6.4 }, 14, rnd, 0.45);
    }
    g.scale.setScalar(M);
    const junto = K.juntar(g, 'a estrada da caravana');
    g.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    const saida = new THREE.Group();
    saida.name = 'a estrada da caravana';
    saida.position.set(O[0], 0, O[1]);
    saida.add(junto);
    /* o chão até o horizonte (a terra com as manchas de capim) */
    const tam = Math.max(3200, sFim + 1600);
    const longe = chaoDeLonge(tam, 72, rnd);
    longe.scale.setScalar(M); longe.position.set((sFim / 2) * M, -0.1 * M, 0);
    saida.add(longe);
    return saida;
  }
  function montarOnibus() {
    const n = cfg.nossa || {}, c = n.cores || {};
    const b = K.onibus({ comp: 12.4, cor: '#efefeb', cor2: c.cor || '#b3261e', cor3: c.cor2 || '#1f2e44', itinerario: cfg.itinerario || 'EXCURSÃO · CARAVANA' });
    b.scale.setScalar(M);
    const junto = K.juntar(b, 'o ônibus da caravana');
    b.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    const g = new THREE.Group(); g.name = 'o ônibus da caravana';
    g.add(junto);
    return g;
  }

  /* ---------- A GENTE (os bonecos: a nossa torcida e a deles) ---------- */
  const J = { t: 0, discos: [], policiais: [], projeteis: [], grades: [], paz: true, semAnel: true };
  const gente = [];
  const PW = {};
  function disco(o) {
    return Object.assign({ nome: '', spawn: 'estrada', torcida: '', cor: '#777777', cor2: '#eeeeee', cor3: null, lado: 'visitante', lider: false, vivo: true,
                           x: 0, y: 0, alt: 0, rumo: 0, passada: 1.15, derrubado: 0, golpe: 0, apanhou: 0, atordoado: 0, esquivou: 0, tremor: 0,
                           defendendo: 0, hostil: 0, inimigoPerto: 0, chamou: -99, linha: 'frente', mundo: true }, o);
  }
  function pessoa(o, sv, lv) {
    const d = disco(o);
    const p = { d, s: sv, l: lv, alvo: null, vel: 1.6, depois: null, espera: 0 };
    W(sv, lv, PW); d.x = PW.x; d.y = PW.z;
    gente.push(p); J.discos.push(d);
    return p;
  }
  function tirar(p) {
    const i = gente.indexOf(p); if (i >= 0) gente.splice(i, 1);
    const k = J.discos.indexOf(p.d); if (k >= 0) J.discos.splice(k, 1);
  }
  const olharPara = (p, sv, lv) => { p.d.rumo = Math.atan2(sv - p.s, lv - p.l); };
  function andarGente(dt) {
    for (const p of gente.slice()) {
      if (p.espera > 0) { p.espera -= dt; continue; }
      if (!p.alvo) continue;
      const ds = p.alvo[0] - p.s, dl = p.alvo[1] - p.l, L = Math.hypot(ds, dl), passo = p.vel * dt;
      if (L <= passo) {
        p.s = p.alvo[0]; p.l = p.alvo[1]; p.alvo = null;
        const f = p.depois; p.depois = null;
        if (f) f(p);
      } else {
        p.s += ds / L * passo; p.l += dl / L * passo;
        p.d.rumo = Math.atan2(ds, dl);
      }
      if (gente.includes(p)) { W(p.s, p.l, PW); p.d.x = PW.x; p.d.y = PW.z; }
    }
  }
  /* quem vem de onde: as cores e o nome */
  const nossa = () => { const n = cfg.nossa || {}, c = n.cores || {}; return { torcida: n.nome || 'Nós', cor: c.cor, cor2: c.cor2, cor3: c.cor3 || null, lado: 'visitante' }; };
  const deles = () => { const c = (emb && emb.cores) || {}; return { torcida: (emb && emb.nome) || 'Rival', cor: c.cor || '#444444', cor2: c.cor2 || '#dddddd', cor3: c.cor3 || null, lado: 'mandante' }; };
  /* o ponto do tabuleiro (px) na estrada (m) */
  const naEstrada = (x, y) => peca ? [peca.sA + peca.sg * (x - peca.bx) / PXM, peca.sg * (y - peca.rc) / PXM] : [0, 0];
  const spawnDe = id => { const sp = peca && (peca.P.cena.spawns || []).find(x => x.id === id); return sp ? naEstrada(sp.x, sp.y) : null; };
  /* ELES NA BEIRA DA ESTRADA, esperando (perto do ponto de onde entram na briga) */
  let rivais = [];
  function porRivais() {
    if (!peca || rivais.length) return;
    const c = spawnDe('mandante1') || [peca.sA + 16, 5];
    if (Math.abs(c[1]) < MAO + 1) c[1] = MAO + 2.6;
    const n = clamp(Math.round((emb && emb.n) || 14), 6, 22), cor = deles();
    for (let i = 0; i < n; i++) {
      const sv = c[0] + (rnd() - 0.5) * 8, lv = clamp(c[1] + (rnd() - 0.5) * 3.6, MAO + 0.6, c[1] + 3);
      const p = pessoa(Object.assign({ nome: `${cor.torcida} (${i + 1})`, spawn: 'emboscada', hostil: 1, inimigoPerto: 60, lider: i === 0 }, cor), sv, lv);
      olharPara(p, peca.sA, peca.lA);
      rivais.push(p);
    }
  }

  /* ---------- O ÔNIBUS ANDANDO ---------- */
  const B = { u: 0, v: 0, alvo: null, fim: null, fase: 'parado' };
  const QB = {};
  function porOnibus() {
    pontoEm(B.u, QB);
    W(QB.s, QB.l, PW);
    onibus.position.set(PW.x, 0, PW.z);
    onibus.rotation.y = -Math.atan2(QB.hl, QB.hs);
  }
  function portaDoOnibus() {
    pontoEm(B.u, QB);
    /* (a frente no rumo; a porta à direita dele) */
    return [QB.s + QB.hs * PORTA.x - QB.hl * PORTA.z, QB.l + QB.hl * PORTA.x + QB.hs * PORTA.z];
  }
  let relogioAnt = 0;
  function andarOnibus(dt) {
    if (B.fase !== 'andando' || B.alvo == null) return;
    const falta = B.alvo - B.u;
    const vTeto = B.u >= uAlca - 20 ? VEL_ALCA : VEL;
    const vFreio = Math.sqrt(2 * FREIA * Math.max(0, falta));
    B.v = Math.min(B.v + ACELERA * dt, vTeto, vFreio + 0.4);
    B.u = Math.min(B.alvo, B.u + B.v * dt);
    porOnibus();
    if (B.alvo - B.u < 0.02) {
      B.u = B.alvo; B.v = 0; B.fase = 'parado';
      porOnibus();
      const f = B.fim; B.fim = null;
      if (f) f();
    }
  }

  /* ---------- A CÂMERA: atrás do ônibus, e a emboscada inteira quando ele para ---------- */
  const CAM = { alvo: null, az: 0, el: 0.34, dist: 26, modo: 'segue' };
  const Q2 = {};
  function seguir(dt, orb) {
    if (!onibus) return;
    pontoEm(B.u, Q2);
    let ts, tl, az, el, dist;
    if (CAM.modo === 'emboscada' && peca) {
      /* o ônibus parado e eles na beira: do outro lado da pista, meio de trás */
      const rc = rivais.length ? rivais.reduce((a, p) => [a[0] + p.s / rivais.length, a[1] + p.l / rivais.length], [0, 0]) : [peca.sA, peca.lA + 4];
      ts = (Q2.s + rc[0]) / 2; tl = (Q2.l + rc[1]) / 2 + 1;
      const ox = -0.55, oz = -0.83;
      az = Math.atan2(ox, oz); el = 0.62;
      const aspecto = C.vida && C.vida.camera ? C.vida.camera.aspect : 1.6;
      dist = (Math.hypot(Q2.s - rc[0], Q2.l - rc[1]) * 1.25 + 24) / Math.min(1, Math.max(0.5, aspecto * 1.1));
    } else if (CAM.modo === 'gente') {
      ts = Q2.s + 2; tl = Q2.l + 4; az = Math.atan2(-0.35, -0.94); el = 0.72; dist = 30;
    } else {
      /* atrás e um pouco à esquerda, olhando a pista e a beira da direita */
      const b = 0.2, fx = -Q2.hs * Math.cos(b) + Q2.hl * Math.sin(b), fz = -Q2.hl * Math.cos(b) - Q2.hs * Math.sin(b);
      ts = Q2.s + Q2.hs * 13 + 1.5 * -Q2.hl; tl = Q2.l + Q2.hl * 13 + 1.5 * Q2.hs + 1.2;
      az = Math.atan2(fx, fz); el = 0.28; dist = 33;
    }
    W(ts, tl, PW);
    const k = CAM.alvo ? 1 - Math.exp(-dt * 3.2) : 1;
    if (!CAM.alvo) CAM.alvo = { x: PW.x, z: PW.z };
    CAM.alvo.x += (PW.x - CAM.alvo.x) * k; CAM.alvo.z += (PW.z - CAM.alvo.z) * k;
    let da = az - orb.az; da = Math.atan2(Math.sin(da), Math.cos(da));
    orb.az += da * (CAM.primeira ? 1 : k);
    orb.el += (el - orb.el) * (CAM.primeira ? 1 : k);
    orb.dist += (dist * M - orb.dist) * (CAM.primeira ? 1 : k);
    orb.alvo.x = CAM.alvo.x; orb.alvo.z = CAM.alvo.z;
    orb.alto = 0;
    CAM.primeira = false;
  }

  /* ---------- A LUZ DA HORA: da saída à chegada ---------- */
  let horaVista = null;
  const minutoAgora = () => {
    const h = cfg.horas || [600, 900];
    return h[0] + (h[1] - h[0]) * clamp(B.u / Math.max(1, uFim), 0, 1);
  };
  function luz() {
    const h = (((minutoAgora() / 60) % 24) + 24) % 24;
    if (horaVista == null || Math.abs(h - horaVista) > 0.02) { horaVista = h; if (C.vida && C.vida.hora) C.vida.hora(h); }
  }

  /* ---------- O PALCO (o cenário desenha os bonecos, anda a câmera e chama o quadro) ---------- */
  let antes = 0;
  const palco = {
    get J() { return J; },
    livre: true, semAnel: true, escala: 1,
    seguir: (dt, orb) => seguir(dt, orb),
    quadro() {
      /* o relógio de verdade (a máquina lenta pula quadro, e a viagem chega na hora) */
      const agora = performance.now(), dt = antes ? Math.min(1, (agora - antes) / 1000) : 0.016;
      antes = agora;
      /* (o 1×/2× do jogo vale na estrada também: o ônibus e a gente andando) */
      const T = globalThis.TO, vel = (T && T.diaJogo && T.diaJogo.ponte && T.diaJogo.ponte.velocidade) || 1;
      J.t += dt * vel;
      andarOnibus(dt * vel);
      andarGente(dt * vel);
      luz();
      if (R.aCadaQuadro) R.aCadaQuadro(dt);
    },
    alvoDoCorte: () => null
  };

  /* ======================================================
     O QUE O DIA DE JOGO (dia3d.js) PEDE
     ====================================================== */
  const R = {
    trechos, peca, uFim, uParada, sFim,
    get viva() { return montado; },
    get andando() { return B.fase === 'andando'; },
    get parado() { return B.fase === 'parado'; },
    get naParada() { return uParada != null && Math.abs(B.u - uParada) < 0.05; },
    get chegou() { return B.u >= uFim - 0.05; },
    /* a hora do dia na viagem (min) e a praça da vez */
    get minuto() { return minutoAgora(); },
    get praca() { pontoEm(B.u, QB); return trechoEm(QB.s); },
    aCadaQuadro: null,
    montar() {
      if (montado || !C || !C.vida || !C.vida.cena) return false;
      raiz = C.vida.cena; while (raiz.parent) raiz = raiz.parent;
      /* a cidade some enquanto a estrada está na tela (o que é dela fica guardado) */
      escondidos = [];
      for (const o of C.vida.cena.children) if (o.visible) { o.visible = false; escondidos.push(o); }
      grupo = montarGeometria();
      raiz.add(grupo);
      if (peca) {
        const pc = montarCaravana(peca.tipo, peca.O, { giro: peca.giro, semLonge: true, semOnibus: true, naEstrada: true });
        raiz.add(pc); pecas3d.push(pc);
      }
      onibus = montarOnibus();
      raiz.add(onibus);
      B.u = 0; B.v = 0; B.fase = 'parado';
      porOnibus();
      porRivais();
      CAM.alvo = null; CAM.modo = 'segue'; CAM.primeira = true;
      antes = 0; horaVista = null;
      C.vida.palco = palco;
      montado = true;
      luz();
      return true;
    },
    desmontar() {
      if (!montado) return;
      montado = false;
      if (C.vida && C.vida.palco === palco) C.vida.palco = null;
      for (const o of escondidos) o.visible = true;
      escondidos = [];
      for (const o of [grupo, onibus, ...pecas3d]) {
        if (!o) continue;
        o.removeFromParent();
        o.traverse(x => { if (x.geometry) x.geometry.dispose(); });
      }
      for (const t of texturas) t.dispose();
      texturas = []; pecas3d.length = 0; grupo = null; onibus = null;
      gente.length = 0; J.discos.length = 0; rivais = [];
    },
    /* o ônibus anda até a emboscada ('emboscada') ou até o fim da viagem ('fim') */
    rodar(alvo, fim) {
      if (!montado) { if (fim) fim(); return; }
      const u = alvo === 'emboscada' && uParada != null && B.u < uParada - 0.05 ? uParada : uFim;
      B.alvo = u; B.fim = fim || null;
      if (B.u >= u - 0.02) { B.fase = 'parado'; const f = B.fim; B.fim = null; if (f) f(); return; }
      B.fase = 'andando';
      CAM.modo = 'segue';
      /* (quem desceu e não subiu fica: é o caso de quem caiu) */
    },
    /* pula até perto do próximo ponto (a parada ou a chegada): a freada ainda se vê */
    pular() {
      if (!montado || B.fase !== 'andando' || B.alvo == null) return;
      const u = Math.max(B.u, B.alvo - 32);
      B.u = u; B.v = Math.min(VEL, Math.sqrt(2 * FREIA * Math.max(0, B.alvo - u)));
      porOnibus();
      CAM.primeira = true;
    },
    verOnibus() { CAM.modo = B.fase === 'parado' && R.naParada ? 'emboscada' : 'segue'; CAM.primeira = false; },
    /* a emboscada: a câmera mostra o ônibus parado e eles na beira */
    verEmboscada() { CAM.modo = 'emboscada'; },
    /* A NOSSA TORCIDA DESCE (antes da briga): um atrás do outro pela porta,
       e se espalha do lado da porta, de frente pra eles */
    descer(n, fim) {
      if (!montado || !peca) { if (fim) fim(); return; }
      CAM.modo = 'emboscada';
      const q = portaDoOnibus(), cor = nossa(), N = clamp(Math.round(n || 20), 4, 36);
      const alvoDe = spawnDe('visitante1') || [q[0] + 2, q[1] + 3];
      const rc = rivais.length ? rivais.reduce((a, p) => [a[0] + p.s / rivais.length, a[1] + p.l / rivais.length], [0, 0]) : [peca.sA + 10, peca.lA + 4];
      let fora = 0, acabou = false;
      const pronto = () => { if (acabou) return; acabou = true; if (fim) fim(); };
      for (let i = 0; i < N; i++) {
        const p = pessoa(Object.assign({ nome: `${cor.torcida} (${i + 1})`, spawn: 'caravana', lider: i === 0 }, cor), q[0], q[1]);
        p.d.sumiu = true;
        p.espera = i * 0.11;
        const ang = rnd() * 2 * PI, r = 1 + Math.sqrt(rnd()) * 4.2;
        const alvo = [alvoDe[0] + Math.cos(ang) * r * 1.3, alvoDe[1] + Math.sin(ang) * r * 0.8];
        /* (ninguém fica dentro do ônibus: quem cairia nele vai pro lado da porta) */
        pontoEm(B.u, QB);
        if (Math.abs(alvo[0] - QB.s) < 6.8 && Math.abs(alvo[1] - QB.l) < 1.8) alvo[1] = QB.l + 1.8 + rnd() * 1.4;
        p.vel = 2.4 + rnd() * 0.8;
        p.alvo = alvo;
        p.depois = pp => { olharPara(pp, rc[0], rc[1]); pp.d.hostil = 1; pp.d.inimigoPerto = 60; if (++fora >= N) pronto(); };
        p.nossa = true;
      }
      /* (a porta abre: quem sai aparece no degrau) */
      R.aCadaQuadro = () => { for (const p of gente) if (p.nossa && p.d.sumiu && p.espera <= 0) p.d.sumiu = false; };
      /* (no máximo uns segundos: a briga não espera a fila inteira) */
      setTimeout(pronto, 1000 * (N * 0.11 + 3.2));
    },
    /* A BRIGA NA PEÇA: o tabuleiro da cena da emboscada em cima da peça
       encaixada na rodovia (o mesmo tabuleiro, girado) */
    briga() {
      if (!peca) return null;
      if (!peca.briga) peca.briga = cenaDaCaravana(peca.tipo, peca.O, { giro: peca.giro, naEstrada: true });
      return peca.briga;
    },
    /* a briga no ar: o palco é o dela (os bonecos da estrada saem de cena) */
    naBriga() { B.fase = 'parado'; },
    /* A BRIGA ACABOU (o palco dela desmontou): a estrada volta a desenhar, e
       quem estava no fim dela fica onde estava — os de pé, os caídos */
    voltouDaBriga(jb, nossoLado) {
      if (!montado) return;
      C.vida.palco = palco;
      CAM.modo = 'emboscada'; CAM.primeira = true; antes = 0;
      if (!jb || !peca || !peca.briga) return;
      gente.length = 0; J.discos.length = 0; rivais = [];
      const cn = nossa(), cd = deles(), q = portaDoOnibus();
      for (const d0 of jb.discos || []) {
        const nosso = d0.lado === nossoLado;
        /* quem entrou no ônibus já está nele; o preso foi levado; dos deles,
           quem correu foi embora — dos nossos, quem correu volta pro ônibus
           (de perto: no máximo a 22 m da porta) */
        if (d0.entrou || d0.preso || (d0.sumiu && !nosso)) continue;
        let [sv, lv] = naEstrada(d0.x, d0.y);
        const correu = !!d0.sumiu, caido = !correu && !d0.vivo;
        if (correu) { const dx = sv - q[0], dl = lv - q[1], L = Math.hypot(dx, dl); if (L > 22) { sv = q[0] + dx / L * 22; lv = q[1] + dl / L * 22; } }
        const p = pessoa(Object.assign({ nome: d0.nome, spawn: d0.spawn || 'briga', lider: !!d0.lider, vivo: !caido, rumo: 0 }, nosso ? cn : cd), sv, lv);
        p.nossa = nosso;
        if (!nosso) rivais.push(p);
      }
      R.vindoDaBriga = true;
    },
    /* QUEM FICOU DE PÉ VOLTA PRO ÔNIBUS; os caídos ficam no chão e os deles
       vão embora pela beira. `res`: o resultado da briga (feridos e presos
       dos dois lados, o efetivo) — sem a briga jogada (o duelo simulado),
       a proporção dele decide quem cai */
    embarcar(res, fim) {
      if (!montado) { if (fim) fim(); return; }
      CAM.modo = 'emboscada';
      const nossos = gente.filter(p => p.nossa && p.d.vivo);
      if (res && !R.vindoDaBriga) {
        /* (o duelo simulado: a proporção do resultado cai no chão) */
        const lado = res.nossoLado === 'mandante' ? 'Mandante' : 'Visitante', outro = lado === 'Mandante' ? 'Visitante' : 'Mandante';
        const ef = res.efetivo || {}, nN = ef[res.nossoLado === 'mandante' ? 'mandante' : 'visitante'] || nossos.length || 1;
        const nD = ef[res.nossoLado === 'mandante' ? 'visitante' : 'mandante'] || rivais.length || 1;
        const fN = clamp(((res['caidos' + lado] || 0) + (res['presos' + lado] || 0)) / nN, 0, 1);
        const fD = clamp(((res['caidos' + outro] || 0) + (res['presos' + outro] || 0)) / nD, 0, 1);
        for (const p of nossos.slice(0, Math.round(nossos.length * fN))) { p.d.vivo = false; p.alvo = null; }
        for (const p of rivais.slice(0, Math.round(rivais.length * fD))) { p.d.vivo = false; p.alvo = null; }
      }
      R.vindoDaBriga = false;
      const sobem = gente.filter(p => p.nossa && p.d.vivo);
      let dentro = 0, acabou = false;
      const pronto = () => { if (acabou) return; acabou = true; if (fim) fim(); };
      const q = portaDoOnibus();
      sobem.forEach((p, i) => {
        p.d.hostil = 0; p.d.inimigoPerto = 0;
        p.espera = 0.3 + i * 0.05;
        p.vel = 2.6 + rnd() * 0.7;
        p.alvo = [q[0] + (rnd() - 0.5) * 0.4, q[1] + 0.3];
        p.depois = pp => { tirar(pp); if (++dentro >= sobem.length) pronto(); };
      });
      /* os deles de pé vão embora pela beira, pra longe da pista */
      for (const p of rivais) if (p.d.vivo) {
        p.d.hostil = 0; p.d.inimigoPerto = 0;
        p.espera = 0.6 + rnd() * 0.8; p.vel = 2.8 + rnd();
        p.alvo = [p.s + (rnd() - 0.5) * 16, (p.l >= 0 ? 1 : -1) * (26 + rnd() * 10)];
        p.depois = pp => tirar(pp);
      }
      if (!sobem.length) setTimeout(pronto, 900);
      setTimeout(pronto, 12000);
    },
    /* NINGUÉM DESCEU: o ônibus sai de novo (eles ficam na beira, xingando) */
    semDescer() { CAM.modo = 'segue'; },
    /* pro teste: onde está o ônibus e quem está na estrada */
    get estado() {
      pontoEm(B.u, QB);
      const t = trechoEm(QB.s);
      return { u: +B.u.toFixed(1), uFim: +uFim.toFixed(1), uParada: uParada != null ? +uParada.toFixed(1) : null, fase: B.fase, v: +B.v.toFixed(1),
               s: +QB.s.toFixed(1), l: +QB.l.toFixed(2), praca: t ? t.nome : null, cidades: trechos.map(x => x.nome),
               peca: peca ? { tipo: peca.tipo, sA: +peca.sA.toFixed(1), lA: +peca.lA.toFixed(2), s0: +peca.s0.toFixed(1), s1: +peca.s1.toFixed(1), praca: peca.trecho.nome } : null,
               gente: gente.length, nossos: gente.filter(p => p.nossa).length, rivais: rivais.length, caidos: gente.filter(p => !p.d.vivo).length,
               minuto: Math.round(minutoAgora()), camera: CAM.modo };
    }
  };
  return R;
}
