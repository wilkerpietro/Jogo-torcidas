/* =========================================================
   OS TRÊS ESTÁDIOS DO JOGO — o de 10, o de 20 e o de 40 mil
   ---------------------------------------------------------
   São as três cenas de estádio do protótipo do feed de notícias
   (dados/cenas.js da branch do protótipo: "Estádio de 10 mil", "de 20
   mil", "de 40 mil"): a foto aérea de cada um (img/cenas/estadio_10,
   _20, _40) e os setores que o dono pintou em cima dela ("estadio
   nivel 1/2/3.jpg"). Aqui cada um vira modelo 3D, medido na foto com o
   campo de régua:

   · O DE 10 MIL (nível 1) é o municipal de cidade pequena: o campo de
     100 × 68 de grama falhada com a mureta branca em volta, a
     arquibancada reta do norte (a dos visitantes, com a PM entre as
     duas divisórias), a do leste e sul em L com as duas curvas e a asa
     do sudoeste, o portão do mandante cortando a do leste, o túnel do
     visitante (o meio cilindro do noroeste), o túnel do meio da do sul,
     o banco de reservas na frente da do norte, a passarela de cima e o
     muro caiado em volta, com o portão do oeste.
   · O DE 20 MIL (nível 2) é o anel único que fecha em volta: degrau de
     concreto bege, 8 vomitórios, os túneis do meio do norte e do sul,
     a pista cinza entre as placas de publicidade e a arquibancada, as
     quatro torres de luz de treliça, o terreno murado com os portões do
     leste e do oeste e a rua em volta.
   · O DE 40 MIL (nível 3) é a tigela de dois anéis: o fosso seco em
     volta do campo com as quatro pontes (as do leste e do oeste são os
     túneis dos jogadores), o anel de baixo, o corredor entre os anéis,
     o anel de cima com 29 vomitórios e as muretas que dividem em
     blocos, a pista de ônibus em volta, os prédios de entrada do leste
     e do oeste e as torres de escada do norte e do sul.

   OS SETORES do dono (mandante 1º/2º/3º escalão, visitante 1º/2º/3º,
   a PM) vão numa camada à parte — o grupo `setores`, com a cor por
   cima do degrau, o nome, a faixa de cada escalão e os túneis de
   entrada — que liga e desliga. As divisórias (o gradil que o dono
   riscou entre os setores) são do estádio e ficam sempre.

   O DEGRAU É O DE VERDADE: 0,80 m de piso por 0,40 de espelho (0,42 no
   anel de baixo do de 40 mil, 0,52 no de cima). As fotos são geradas e
   desenham o degrau largo demais (1,2 a 1,4 m no de 10 e no de 40) ou
   estreito demais (0,6 no de 20); com o degrau de verdade, a planta da
   foto dá mais lugar do que o nome diz — a ficha mostra a conta, a 0,5
   m de degrau por pessoa.

   REFERENCIAL: metros; origem no centro do campo; x pro leste (a
   direita da foto), z pro sul (o de baixo da foto), y pra cima. O grupo
   sai em metros; quem mostra escala. A textura é pintada aqui mesmo, em
   canvas (uma vez só, guardada), e o .glb leva tudo junto.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';

const RAD = Math.PI / 180;
const cl = (v, a, b) => v < a ? a : v > b ? b : v;
/* sorteio de semente fixa: o mesmo estádio toda vez */
function sorteio(semente) {
  let s = (Math.imul(semente | 0, 2654435761) >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const _cor = new THREE.Color();
/* cor de CSS pra cor de vértice (linear) */
const lin = hex => { _cor.set(hex); return [_cor.r, _cor.g, _cor.b]; };
const vezes = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
const hex255 = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const BRANCO = [1, 1, 1], CIMA = [0, 1, 0];
/* coordenada de textura de chão: o mundo visto de cima, `e` metros por repetição */
const pl = (p, e) => [p[0] / e, -p[2] / e];

/* ======================================================
   A MALHA: um balde de quadriláteros e triângulos por material,
   com a normal chapada da face; `para` diz pra onde a face olha e a
   ordem dos cantos se acerta sozinha
   ====================================================== */
class Malha {
  constructor() { this.p = []; this.n = []; this.t = []; this.c = []; this.i = []; this.nv = 0; }
  get vazia() { return this.nv === 0; }
  _v(p, n, t, c) {
    this.p.push(p[0], p[1], p[2]); this.n.push(n[0], n[1], n[2]); this.t.push(t[0], t[1]); this.c.push(c[0], c[1], c[2]);
    return this.nv++;
  }
  quad(a, b, c, d, ta, tb, tc, td, cor = BRANCO, para = null) {
    const ex = c[0] - a[0], ey = c[1] - a[1], ez = c[2] - a[2], fx = d[0] - b[0], fy = d[1] - b[1], fz = d[2] - b[2];
    let nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx;
    const l = Math.hypot(nx, ny, nz);
    if (l < 1e-10) return;
    nx /= l; ny /= l; nz /= l;
    if (para && nx * para[0] + ny * para[1] + nz * para[2] < 0) { [b, d] = [d, b]; [tb, td] = [td, tb]; nx = -nx; ny = -ny; nz = -nz; }
    const n = [nx, ny, nz];
    const i0 = this._v(a, n, ta, cor), i1 = this._v(b, n, tb, cor), i2 = this._v(c, n, tc, cor), i3 = this._v(d, n, td, cor);
    this.i.push(i0, i1, i2, i0, i2, i3);
  }
  tri(a, b, c, ta, tb, tc, cor = BRANCO, para = null) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz);
    if (l < 1e-12) return;
    nx /= l; ny /= l; nz /= l;
    if (para && nx * para[0] + ny * para[1] + nz * para[2] < 0) { [b, c] = [c, b]; [tb, tc] = [tc, tb]; nx = -nx; ny = -ny; nz = -nz; }
    const n = [nx, ny, nz];
    const i0 = this._v(a, n, ta, cor), i1 = this._v(b, n, tb, cor), i2 = this._v(c, n, tc, cor);
    this.i.push(i0, i1, i2);
  }
  geometria() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.n), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.t), 2));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3));
    g.setIndex(new THREE.BufferAttribute(this.nv > 65535 ? new Uint32Array(this.i) : new Uint16Array(this.i), 1));
    g.computeBoundingSphere();
    return g;
  }
}

/* ======================================================
   AS TEXTURAS, pintadas em canvas uma vez só
   ====================================================== */
const TEX = {};
function tela(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function virarTextura(c, { repete = true, alfa = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repete) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  /* o .glb grava a imagem nesse formato: jpeg onde não tem recorte, que sai bem menor */
  t.userData.mimeType = alfa ? 'image/png' : 'image/jpeg';
  return t;
}
/* ruído de valor que emenda nas bordas: soma de oitavas [célula em x, amplitude, célula em y] */
function ruido(w, h, oitavas, r) {
  const out = new Float32Array(w * h);
  for (const [cel, amp, celY] of oitavas) {
    const cx = Math.max(1, Math.round(w / cel)), cy = Math.max(1, Math.round(h / (celY || cel)));
    const g = new Float32Array(cx * cy);
    for (let i = 0; i < g.length; i++) g[i] = r() * 2 - 1;
    const sx = cx / w, sy = cy / h;
    for (let y = 0; y < h; y++) {
      const fy = y * sy, y0 = Math.floor(fy), ty = fy - y0, vy = ty * ty * (3 - 2 * ty), ya = (y0 % cy) * cx, yb = ((y0 + 1) % cy) * cx;
      for (let x = 0; x < w; x++) {
        const fx = x * sx, x0 = Math.floor(fx), tx = fx - x0, vx = tx * tx * (3 - 2 * tx), xa = x0 % cx, xb = (x0 + 1) % cx;
        out[y * w + x] += amp * ((g[ya + xa] * (1 - vx) + g[ya + xb] * vx) * (1 - vy) + (g[yb + xa] * (1 - vx) + g[yb + xb] * vx) * vy);
      }
    }
  }
  return out;
}
/* pinta pixel a pixel: `f(i, x, y)` devolve [r, g, b] ou [r, g, b, a] */
function pixels(c, f) {
  const ctx = c.getContext('2d'), im = ctx.createImageData(c.width, c.height), d = im.data;
  for (let y = 0, i = 0; y < c.height; y++) for (let x = 0; x < c.width; x++, i++) {
    const p = f(i, x, y);
    d[4 * i] = p[0]; d[4 * i + 1] = p[1]; d[4 * i + 2] = p[2]; d[4 * i + 3] = p.length > 3 ? p[3] : 255;
  }
  ctx.putImageData(im, 0, 0);
  return ctx;
}
/* o concreto do degrau: cinza neutro (a cor de cada estádio vem no vértice), mancha e trinca */
function pintarConcreto() {
  const W = 512, r = sorteio(11), c = tela(W, W);
  const n = ruido(W, W, [[128, 14], [32, 8], [8, 6], [2, 7]], r);
  const m = ruido(W, W, [[64, 1], [16, 0.45]], sorteio(12));
  const ctx = pixels(c, i => {
    const v = 206 + n[i] - (m[i] > 0.5 ? (m[i] - 0.5) * 70 : 0);
    return [cl(v + 3, 0, 255), cl(v + 1, 0, 255), cl(v - 3, 0, 255)];
  });
  ctx.strokeStyle = 'rgba(70,66,60,0.32)'; ctx.lineWidth = 1;
  for (let k = 0; k < 9; k++) {
    let x = 60 + r() * (W - 120), y = 60 + r() * (W - 120);
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let j = 0; j < 6; j++) { x += (r() - 0.5) * 34; y += (r() - 0.5) * 34; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  return virarTextura(c);
}
/* a parede: o mesmo concreto com o escorrido da chuva (célula fina em x, comprida em y) */
function pintarParede() {
  const W = 512, c = tela(W, W);
  const n = ruido(W, W, [[128, 12], [32, 7], [4, 6]], sorteio(21));
  const e = ruido(W, W, [[6, 18, 170], [3, 8, 64]], sorteio(22));
  pixels(c, i => { const v = 206 + n[i] + Math.min(0, e[i]) * 1.3; return [cl(v + 2, 0, 255), cl(v, 0, 255), cl(v - 4, 0, 255)]; });
  return virarTextura(c);
}
/* o piso dos corredores e da pista: placa de 2 m com a junta */
function pintarPiso() {
  const W = 512, c = tela(W, W);
  const n = ruido(W, W, [[128, 11], [16, 6], [2, 6]], sorteio(31));
  pixels(c, (i, x, y) => {
    const v = 200 + n[i] - ((x % 256) < 2 || (y % 256) < 2 ? 38 : 0);
    return [cl(v + 2, 0, 255), cl(v, 0, 255), cl(v - 3, 0, 255)];
  });
  return virarTextura(c);
}
function pintarGrama() {
  const W = 512, c = tela(W, W);
  const n = ruido(W, W, [[128, 16], [32, 11], [8, 8], [2, 10]], sorteio(41));
  const s = ruido(W, W, [[96, 1], [24, 0.5]], sorteio(42));
  pixels(c, i => {
    const seco = cl(s[i] - 0.25, 0, 1);
    return [cl(80 + n[i] * 0.6 + seco * 70, 0, 255), cl(122 + n[i] - seco * 8, 0, 255), cl(50 + n[i] * 0.3 + seco * 26, 0, 255)];
  });
  return virarTextura(c);
}
function pintarTerra() {
  const W = 512, r = sorteio(51), c = tela(W, W);
  const n = ruido(W, W, [[128, 16], [32, 10], [4, 9], [1, 7]], r);
  const ctx = pixels(c, i => [cl(190 + n[i], 0, 255), cl(166 + n[i] * 0.9, 0, 255), cl(134 + n[i] * 0.8, 0, 255)]);
  for (let k = 0; k < 700; k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(96,74,52,0.5)' : 'rgba(220,200,168,0.5)'; ctx.fillRect(r() * W, r() * W, 1 + r() * 2, 1 + r() * 2); }
  return virarTextura(c);
}
function pintarAsfalto() {
  const W = 512, c = tela(W, W);
  const n = ruido(W, W, [[128, 9], [16, 6], [1, 13]], sorteio(61));
  pixels(c, i => { const v = 104 + n[i]; return [cl(v, 0, 255), cl(v + 1, 0, 255), cl(v + 4, 0, 255)]; });
  return virarTextura(c);
}
/* o gradil: o tubo em volta e a tela em losango (recortada) — 2,5 × 2,5 m */
function pintarGradil() {
  const W = 256, c = tela(W, W), ctx = c.getContext('2d');
  ctx.strokeStyle = '#d3d8da'; ctx.lineWidth = 2.2;
  for (let k = -W; k < 2 * W; k += 16) {
    ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + W, W); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(k, W); ctx.lineTo(k + W, 0); ctx.stroke();
  }
  ctx.fillStyle = '#8e969b';
  ctx.fillRect(0, 0, W, 8); ctx.fillRect(0, W - 8, W, 8); ctx.fillRect(0, 0, 7, W); ctx.fillRect(W - 7, 0, 7, W);
  return virarTextura(c, { alfa: true });
}
/* a rede do gol: malha de 12,5 cm, 1 m por repetição */
function pintarRede() {
  const W = 128, c = tela(W, W), ctx = c.getContext('2d');
  ctx.strokeStyle = '#f4f4f2'; ctx.lineWidth = 1.6;
  for (let k = 0; k <= W; k += 16) {
    ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k, W); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, k); ctx.lineTo(W, k); ctx.stroke();
  }
  return virarTextura(c, { alfa: true });
}
/* a treliça da torre de luz: 1,6 m de largura, um X a cada 1,6 m */
function pintarTrelica() {
  const W = 128, H = 512, c = tela(W, H), ctx = c.getContext('2d');
  ctx.strokeStyle = '#9aa1a7'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(3.5, 0); ctx.lineTo(3.5, H); ctx.moveTo(W - 3.5, 0); ctx.lineTo(W - 3.5, H); ctx.stroke();
  ctx.lineWidth = 3.5;
  for (let y = 0; y < H; y += 128) {
    ctx.beginPath(); ctx.moveTo(0, y + 2); ctx.lineTo(W, y + 2); ctx.moveTo(0, y); ctx.lineTo(W, y + 128); ctx.moveTo(W, y); ctx.lineTo(0, y + 128); ctx.stroke();
  }
  return virarTextura(c, { alfa: true });
}
/* AS PLACAS DE PUBLICIDADE: marca inventada (nada de marca de verdade),
   3,6 m cada, oito numa tira de 28,8 m */
const ANUNCIOS = [
  ['CERVEJA TROPA', '#c8102e', '#ffffff'], ['BANCO DA VILA', '#0a3d91', '#ffd200'], ['GÁS LEÃO', '#ff7a00', '#ffffff'],
  ['MOTO RAIO', '#161616', '#ffe000'], ['FARMÁCIA SOL', '#f4f4f0', '#0a7d3b'], ['RÁDIO GOL FM', '#6a1b9a', '#ffffff'],
  ['CIMENTO FORTE', '#56616b', '#ffffff'], ['AÇAÍ DO PORTO', '#3f1370', '#9df5c4']
];
function pintarPlacas() {
  const W = 2048, H = 64, c = tela(W, H), ctx = c.getContext('2d');
  ANUNCIOS.forEach(([txt, fundo, letra], i) => {
    const x = i * 256;
    ctx.fillStyle = fundo; ctx.fillRect(x, 0, 256, H);
    ctx.fillStyle = letra; ctx.font = 'bold 30px Arial, Helvetica, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x + 128, H / 2 + 1, 236);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 254, 0, 2, H);
  });
  return virarTextura(c);
}
/* o painel do refletor: 5 × 8 lâmpadas */
function pintarRefletor() {
  const W = 256, H = 160, c = tela(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = '#34383d'; ctx.fillRect(0, 0, W, H);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) {
    const x = 18 + i * 31, y = 18 + j * 31, g = ctx.createRadialGradient(x, y, 2, x, y, 13);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#e6ebef'); g.addColorStop(1, '#7d868e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
  }
  return virarTextura(c, { repete: false });
}
/* A FACHADA: 12 × 6 m — pilar a cada 6 m, o painel recuado, a viga de
   cima e as janelas de ventilação; repete pra cima de 6 em 6 m */
function pintarFachada() {
  const W = 1024, H = 512, c = tela(W, H), pxm = W / 12;
  const n = ruido(W, H, [[128, 11], [32, 7], [4, 5]], sorteio(71));
  const e = ruido(W, H, [[8, 16, 220]], sorteio(72));
  const ctx = pixels(c, (i, x, y) => {
    const xm = (x / pxm) % 6, ym = y / pxm;
    let v = 198 + n[i] + Math.min(0, e[i]) * 1.2;
    if (xm < 0.9) v += 10; else if (xm < 1.0 || xm > 5.92) v -= 34; else v -= 8;
    if (ym < 0.55) v += 12; else if (ym < 0.63) v -= 36;
    return [cl(v + 3, 0, 255), cl(v + 1, 0, 255), cl(v - 3, 0, 255)];
  });
  for (const x0 of [0, 6]) for (const k of [0, 1]) {
    const x = (x0 + 1.9 + k * 2.4) * pxm, y = 0.95 * pxm, w = 1.2 * pxm, h = 0.45 * pxm;
    ctx.fillStyle = 'rgba(40,40,42,0.9)'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(150,150,150,0.55)';
    for (let j = 1; j < 6; j++) ctx.fillRect(x, y + j * h / 6, w, 1.5);
  }
  return virarTextura(c);
}
/* a boca do túnel no fundo do vomitório: o vão escuro no concreto */
function pintarBoca() {
  const W = 256, c = tela(W, W), ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, W); g.addColorStop(0, '#8e8a83'); g.addColorStop(1, '#6a665f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
  ctx.fillStyle = '#0e0e0f'; ctx.fillRect(W * 0.12, W * 0.28, W * 0.76, W * 0.72);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, W * 0.24, W, W * 0.04);
  return virarTextura(c, { repete: false });
}
const PINTORES = {
  concreto: pintarConcreto, parede: pintarParede, piso: pintarPiso, grama: pintarGrama, terra: pintarTerra,
  asfalto: pintarAsfalto, gradil: pintarGradil, rede: pintarRede, trelica: pintarTrelica, placas: pintarPlacas,
  refletor: pintarRefletor, fachada: pintarFachada, boca: pintarBoca
};
function tex(nome) { return TEX[nome] || (TEX[nome] = PINTORES[nome]()); }

/* O GRAMADO de cada estádio, com as listras do corte, a falha e as
   linhas (regra: 16,5 m de área, 5,5 de pequena área, 9,15 de círculo,
   pênalti a 11 m, gol de 7,32). `c`: a caixa do gramado em metros
   (x0..x1, z0..z1), o campo (comp × larg), a listra, as duas cores,
   quanto de falha (0 a 1), a força da linha e as áreas técnicas. */
function pintarCampo(c) {
  const L = c.x1 - c.x0, A = c.z1 - c.z0, pxm = Math.min(16, 2048 / Math.max(L, A));
  const W = Math.round(L * pxm), H = Math.round(A * pxm), cv = tela(W, H);
  const X = x => (x - c.x0) * pxm, Z = z => (z - c.z0) * pxm;
  const n = ruido(W, H, [[W / 6, 12], [W / 24, 8], [2, 8]], sorteio(c.semente));
  const f = c.falha ? ruido(W, H, [[W / 7, 1], [W / 22, 0.5], [W / 70, 0.22]], sorteio(c.semente + 1)) : null;
  const c1 = hex255(c.cores[0]), c2 = hex255(c.cores[1]), seca = [158, 150, 92], terra = [164, 140, 100], C = c.comp / 2;
  const ss = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ctx = pixels(cv, (i, x, y) => {
    const xm = c.x0 + x / pxm, zm = c.z0 + y / pxm;
    const b = Math.floor((xm + C) / c.listra) & 1 ? c2 : c1;
    const gol = Math.exp(-((Math.abs(xm) - C + 6) ** 2 + zm * zm * 0.6) / 90), meio = Math.exp(-(xm * xm + zm * zm) / 160);
    const q = c.falha ? f[i] + c.falha * (1.1 * gol + 0.5 * meio) + (c.falha - 1) * 0.5 : -9;
    const t = ss(0.25, 0.95, q) * 0.85, u = ss(0.9, 1.5, q) * 0.7, v = n[i];
    const mix = k => (b[k] * (1 - t) + seca[k] * t) * (1 - u) + terra[k] * u;
    return [cl(mix(0) + v * 0.6, 0, 255), cl(mix(1) + v, 0, 255), cl(mix(2) + v * 0.4, 0, 255)];
  });
  ctx.strokeStyle = `rgba(246,246,240,${c.linha})`; ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = Math.max(1.6, 0.12 * pxm);
  const Lg = c.larg / 2;
  const ret = (xa, za, xb, zb) => ctx.strokeRect(X(Math.min(xa, xb)), Z(Math.min(za, zb)), Math.abs(xb - xa) * pxm, Math.abs(zb - za) * pxm);
  const arco = (x, z, r, a0, a1) => { ctx.beginPath(); ctx.arc(X(x), Z(z), r * pxm, a0, a1); ctx.stroke(); };
  const marca = (x, z) => { ctx.beginPath(); ctx.arc(X(x), Z(z), 0.2 * pxm, 0, Math.PI * 2); ctx.fill(); };
  ret(-C, -Lg, C, Lg);
  ctx.beginPath(); ctx.moveTo(X(0), Z(-Lg)); ctx.lineTo(X(0), Z(Lg)); ctx.stroke();
  arco(0, 0, 9.15, 0, Math.PI * 2); marca(0, 0);
  const aa = Math.acos(5.5 / 9.15);
  for (const s of [-1, 1]) {
    ret(s * C, -20.16, s * (C - 16.5), 20.16);
    ret(s * C, -9.16, s * (C - 5.5), 9.16);
    marca(s * (C - 11), 0);
    if (s > 0) arco(C - 11, 0, 9.15, Math.PI - aa, Math.PI + aa); else arco(-C + 11, 0, 9.15, -aa, aa);
    for (const t of [-1, 1]) arco(s * C, t * Lg, 1, 0, Math.PI * 2);
  }
  /* as áreas técnicas, tracejadas */
  ctx.setLineDash([0.6 * pxm, 0.5 * pxm]);
  for (const [xa, za, xb, zb] of c.tecnicas || []) ret(xa, za, xb, zb);
  ctx.setLineDash([]);
  /* o canto de fora do campo é redondo: o que sobra da caixa não aparece */
  return virarTextura(cv, { repete: false });
}

/* O ROTULO (o nome do setor) e a FAIXA da torcida: canvas próprio */
function rotulo(texto, cor, larg) {
  const W = 1024, H = 200, c = tela(W, H), ctx = c.getContext('2d');
  let fs = 92;
  ctx.font = `bold ${fs}px Arial, Helvetica, sans-serif`;
  while (ctx.measureText(texto).width > W - 80 && fs > 30) { fs -= 4; ctx.font = `bold ${fs}px Arial, Helvetica, sans-serif`; }
  const w = Math.min(W - 8, ctx.measureText(texto).width + 70);
  ctx.fillStyle = cor; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.roundRect((W - w) / 2, 30, w, H - 60, 36); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(texto, W / 2, H / 2 + 3);
  const m = new THREE.SpriteMaterial({ map: virarTextura(c, { repete: false, alfa: true }), depthTest: false, transparent: true });
  const s = new THREE.Sprite(m);
  s.scale.set(larg, larg * H / W, 1);
  s.renderOrder = 20;
  s.userData.rotulo = true;
  s.name = 'rotulo';
  return s;
}
function telaDaFaixa(texto, cor1, cor2) {
  const W = 1024, H = 96, c = tela(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = cor1; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = cor2; ctx.fillRect(0, 0, W, 10); ctx.fillRect(0, H - 10, W, 10);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px Arial, Helvetica, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(texto, W / 2, H / 2 + 2, W - 40);
  return virarTextura(c, { repete: false });
}

/* ======================================================
   OS MATERIAIS: um por balde, guardados (a cor do vértice pinta)
   ====================================================== */
const MAT = {};
const NOMES = {
  degrau: 'degraus', parede: 'paredes', fachada: 'fachada', piso: 'pisos', grama: 'grama', terra: 'terra', asfalto: 'asfalto',
  escuro: 'vaos', boca: 'bocas_de_tunel', gradil: 'gradil', rede: 'redes', trelica: 'torres', placas: 'placas',
  refletor: 'refletores', pintura: 'pintura', lona: 'lona', vidro: 'vidro', nariz: 'faixa_branca'
};
function material(k) {
  if (MAT[k]) return MAT[k];
  const L = o => new THREE.MeshLambertMaterial(o);
  const F = {
    degrau: () => L({ map: tex('concreto'), vertexColors: true }),
    parede: () => L({ map: tex('parede'), vertexColors: true, side: THREE.DoubleSide }),
    fachada: () => L({ map: tex('fachada'), vertexColors: true }),
    piso: () => L({ map: tex('piso'), vertexColors: true }),
    grama: () => L({ map: tex('grama'), vertexColors: true }),
    terra: () => L({ map: tex('terra'), vertexColors: true }),
    asfalto: () => L({ map: tex('asfalto'), vertexColors: true }),
    escuro: () => L({ color: 0x2b2926, vertexColors: true }),
    boca: () => L({ map: tex('boca') }),
    gradil: () => L({ map: tex('gradil'), alphaTest: 0.3, alphaToCoverage: true, side: THREE.DoubleSide }),
    rede: () => L({ map: tex('rede'), alphaTest: 0.25, alphaToCoverage: true, side: THREE.DoubleSide }),
    trelica: () => L({ map: tex('trelica'), alphaTest: 0.3, alphaToCoverage: true, side: THREE.DoubleSide }),
    placas: () => L({ map: tex('placas') }),
    refletor: () => L({ map: tex('refletor'), emissive: 0xffffff, emissiveMap: tex('refletor'), emissiveIntensity: 0.35 }),
    pintura: () => L({ vertexColors: true }),
    lona: () => L({ vertexColors: true, side: THREE.DoubleSide }),
    vidro: () => L({ color: 0xa9c9d8, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
    nariz: () => L({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })
  };
  if (k.startsWith('setor:')) MAT[k] = new THREE.MeshBasicMaterial({ color: k.slice(6), transparent: true, opacity: 0.5, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, side: THREE.DoubleSide });
  else MAT[k] = F[k]();
  MAT[k].name = NOMES[k] || k;
  return MAT[k];
}
/* A OBRA: os baldes de um grupo; no fim, uma malha por material */
function novaObra() {
  const baldes = {}, proprios = {};
  return {
    m(k) { return baldes[k] || (baldes[k] = new Malha()); },
    /* material que não é da lista (o gramado de cada estádio) */
    proprio(k, fazer) { proprios[k] = fazer; },
    fechar(grupo, sombra = true) {
      for (const [k, M] of Object.entries(baldes)) {
        if (M.vazia) continue;
        const mat = proprios[k] ? (MAT[k] || (MAT[k] = proprios[k]())) : material(k);
        const malha = new THREE.Mesh(M.geometria(), mat);
        malha.name = k.startsWith('setor:') ? 'setor' : k.startsWith('campo:') ? 'gramado' : NOMES[k] || k;
        if (sombra && !k.startsWith('setor:')) { malha.castShadow = !['vidro', 'nariz', 'rede'].includes(k); malha.receiveShadow = true; }
        grupo.add(malha);
      }
    }
  };
}

/* ======================================================
   OS ANÉIS: a linha da frente de uma arquibancada e as paralelas
   atrás dela (d metros pra fora). `ponto(d, u)` dá [x, z, nx, nz] (nx,
   nz: a normal pra fora); `u` anda no sentido horário visto de cima.
   ====================================================== */
/* ANEL FECHADO: retângulo arredondado — meia-largura A0 + d, meia-altura
   B0 + d, raio r0 + k·d. Com k < 1 o canto cresce mais devagar que o
   lado (como nas fotos: o canto de fora é mais fechado que o de uma
   paralela). u de 0 a 9: 0 metade leste do lado norte, 1 canto NE, 2
   lado leste, 3 canto SE, 4 lado sul, 5 canto SO, 6 lado oeste, 7
   canto NO, 8 metade oeste do lado norte. No lado, u marca o mesmo x
   (ou z) em todo anel — a linha de u constante é reta, perpendicular
   ao lado; o que o lado cresce (a − a0) entra no canto, e ali a linha
   de u constante abre em leque. Por dentro (d < 0), o lado vai em
   fração do próprio tamanho. */
function anelFechado({ A0, B0, r0, k = 1 }) {
  const a0 = A0 - r0, b0 = B0 - r0;
  const geo = d => { const r = Math.max(0.3, r0 + k * d); return { A: A0 + d, B: B0 + d, r, a: A0 + d - r, b: B0 + d - r }; };
  const CANTO = { 1: [1, -1, -90], 3: [1, 1, 0], 5: [-1, 1, 90], 7: [-1, -1, 180] };
  function ponto(d, u) {
    u = ((u % 9) + 9) % 9;
    const i = Math.floor(u), f = u - i;
    const { A, B, r, a, b } = geo(d), fora = d >= 0, ax = fora ? a0 : a, bz = fora ? b0 : b;
    if (i === 0) return [ax * f, -B, 0, -1];
    if (i === 8) return [-ax + ax * f, -B, 0, -1];
    if (i === 2) return [A, -bz + 2 * bz * f, 1, 0];
    if (i === 4) return [ax - 2 * ax * f, B, 0, 1];
    if (i === 6) return [-A, bz - 2 * bz * f, -1, 0];
    const [sx, sz, g0] = CANTO[i], cx = sx * a, cz = sz * b, t0 = g0 * RAD;
    const t = fora ? a - a0 : 0, L = r * Math.PI / 2, s = f * (2 * t + L);
    if (s < t) { const c0 = Math.cos(t0), s0 = Math.sin(t0); return [cx + r * c0 + (t - s) * s0, cz + r * s0 - (t - s) * c0, c0, s0]; }
    if (s > t + L) { const t1 = t0 + Math.PI / 2, c1 = Math.cos(t1), s1 = Math.sin(t1), e = s - t - L; return [cx + r * c1 - e * s1, cz + r * s1 + e * c1, c1, s1]; }
    const th = t0 + (s - t) / r, c = Math.cos(th), sn = Math.sin(th);
    return [cx + r * c, cz + r * sn, c, sn];
  }
  const dentroDe = (x, z, d) => {
    const { A, B, r, a, b } = geo(d), qx = Math.abs(x) - a, qz = Math.abs(z) - b;
    if (qx <= 0 || qz <= 0) return Math.abs(x) <= A && Math.abs(z) <= B;
    return qx * qx + qz * qz <= r * r;
  };
  /* de um ponto (medido na foto) pro anel dele e o u */
  function uDe(x, z) {
    let lo = -60, hi = 220;
    for (let j = 0; j < 60; j++) { const m = (lo + hi) / 2; if (dentroDe(x, z, m)) hi = m; else lo = m; }
    const d = (lo + hi) / 2, dist = u => { const q = ponto(d, u); return (q[0] - x) ** 2 + (q[1] - z) ** 2; };
    let u = 0, e = Infinity;
    for (let j = 0; j < 3600; j++) { const v = j / 400, ev = dist(v); if (ev < e) { e = ev; u = v; } }
    for (let p = 1 / 800; p > 1e-7; p /= 2) for (const s of [-1, 1]) { const v = u + s * p, ev = dist(v); if (ev < e) { e = ev; u = v; } }
    return { u: ((u % 9) + 9) % 9, d };
  }
  function amostras(u0, u1, extras = []) {
    const out = [u0, u1];
    for (let i = Math.ceil(u0); i <= Math.floor(u1); i++) out.push(i);
    for (let i = Math.floor(u0); i < Math.ceil(u1); i++) if ((((i % 9) + 9) % 9) % 2 === 1) for (let j = 1; j < 24; j++) { const v = i + j / 24; if (v > u0 && v < u1) out.push(v); }
    for (let e of extras) { while (e > u1) e -= 9; while (e < u0) e += 9; if (e >= u0 && e <= u1) out.push(e); }
    out.sort((p, q) => p - q);
    return out.filter((v, j) => j === 0 || v - out[j - 1] > 1e-7);
  }
  return { fechado: true, n: 9, ponto, uDe, amostras, geo };
}
/* CAMINHO ABERTO: a frente de uma arquibancada que não fecha (o de 10
   mil), em trechos de reta e de arco (graus) no sentido horário; o anel
   d é a paralela d metros pra fora. u vai de 0 ao número de trechos. */
function caminho(trechos) {
  const T = trechos.map(t => {
    if (t.reta) { const [x0, z0, x1, z1] = t.reta, L = Math.hypot(x1 - x0, z1 - z0); return { reta: true, x0, z0, dx: (x1 - x0) / L, dz: (z1 - z0) / L, L }; }
    const [cx, cz, r, g0, g1] = t.arco;
    return { reta: false, cx, cz, r, t0: g0 * RAD, t1: g1 * RAD };
  });
  function ponto(d, u) {
    let i = Math.floor(u), f = u - i;
    if (i >= T.length) { i = T.length - 1; f = 1; }
    if (i < 0) { i = 0; f = 0; }
    const t = T[i];
    if (t.reta) { const nx = t.dz, nz = -t.dx; return [t.x0 + t.dx * t.L * f + nx * d, t.z0 + t.dz * t.L * f + nz * d, nx, nz]; }
    const th = t.t0 + (t.t1 - t.t0) * f, c = Math.cos(th), s = Math.sin(th);
    return [t.cx + (t.r + d) * c, t.cz + (t.r + d) * s, c, s];
  }
  function uDe(x, z) {
    let m = null;
    T.forEach((t, i) => {
      let f, d, e;
      if (t.reta) {
        const px = x - t.x0, pz = z - t.z0;
        f = (px * t.dx + pz * t.dz) / t.L; d = px * t.dz - pz * t.dx;
        const fc = cl(f, 0, 1); e = Math.abs(f - fc) * t.L; f = fc;
      } else {
        let th = Math.atan2(z - t.cz, x - t.cx);
        const mid = (t.t0 + t.t1) / 2;
        while (th < mid - Math.PI) th += 2 * Math.PI;
        while (th > mid + Math.PI) th -= 2 * Math.PI;
        f = (th - t.t0) / (t.t1 - t.t0);
        const fc = cl(f, 0, 1); e = Math.abs(f - fc) * Math.abs(t.t1 - t.t0) * t.r; f = fc;
        d = Math.hypot(x - t.cx, z - t.cz) - t.r;
      }
      if (!m || e < m.e - 1e-9) m = { u: i + f, d, e };
    });
    return m;
  }
  function amostras(u0, u1, extras = []) {
    const out = [u0, u1];
    for (let i = Math.ceil(u0); i <= Math.floor(u1); i++) out.push(i);
    T.forEach((t, i) => {
      if (t.reta) return;
      const nd = Math.max(2, Math.ceil(Math.abs(t.t1 - t.t0) / (6 * RAD)));
      for (let j = 1; j < nd; j++) { const v = i + j / nd; if (v > u0 && v < u1) out.push(v); }
    });
    for (const e of extras) if (e >= u0 && e <= u1) out.push(e);
    out.sort((p, q) => p - q);
    return out.filter((v, j) => j === 0 || v - out[j - 1] > 1e-7);
  }
  return { fechado: false, n: T.length, ponto, uDe, amostras };
}
function comprimentos(A) { const L = [0]; for (let i = 1; i < A.length; i++) L.push(L[i - 1] + Math.hypot(A[i][0] - A[i - 1][0], A[i][1] - A[i - 1][1])); return L; }
/* quantos u dão `m` metros no anel d, em volta de u */
function larguraU(fam, u, d, m) {
  const e = 1e-4, a = fam.ponto(d, u - e), b = fam.ponto(d, u + e);
  return m / (Math.hypot(b[0] - a[0], b[1] - a[1]) / (2 * e));
}
/* uma faixa de `larg` metros em volta do ponto (x, z) da foto, medida no anel dRef */
function faixaEm(fam, x, z, larg, dRef) {
  const { u, d } = fam.uDe(x, z), h = larguraU(fam, u, dRef ?? Math.max(0, d), larg) / 2;
  return { u, ua: u - h, ub: u + h };
}
function faixaNoU(fam, u, larg, dRef) { const h = larguraU(fam, u, dRef, larg) / 2; return { u, ua: u - h, ub: u + h }; }
/* o trecho entre dois pontos da foto (em u, crescendo) */
function entre(fam, p, q) {
  let a = fam.uDe(p[0], p[1]).u, b = fam.uDe(q[0], q[1]).u;
  if (a > b) [a, b] = [b, a];
  if (fam.fechado && b - a > 4.5) [a, b] = [b, a + 9];
  return { ua: a, ub: b };
}

/* ======================================================
   A ARQUIBANCADA: os degraus de um anel — a fileira k tem o piso de
   d0 + k·prof a d0 + (k+1)·prof, na altura y0 + k·esp —, a mureta da
   frente, o corredor de cima (a mureta de trás e a fachada), as escadas
   (o degrau dividido em dois), os vomitórios (o poço com a boca do
   túnel no fundo e a mureta em volta), as muretas que dividem em
   blocos, os cortes (o portão que atravessa) e a parede das pontas.
   Devolve o que a camada dos setores precisa: o ponto de cada fileira,
   o piso colorido de um trecho e a conta dos lugares.
   ====================================================== */
function arquibancada(O, fam, c) {
  const n = c.n, prof = c.prof, esp = c.esp, d0 = c.d0, y0 = c.y0, yChao = c.yChao ?? c.yBase;
  const dk = k => d0 + k * prof, yk = k => y0 + k * esp;
  const dn = dk(n), yn = yk(n);
  const lista = nome => c[nome] || [];
  const extras = [...(c.extras || [])];
  for (const nome of ['escadas', 'vom', 'cortes', 'aberturas']) for (const e of lista(nome)) extras.push(e.ua, e.ub);
  for (const m of lista('muretas')) extras.push(m.u);
  const us = fam.amostras(c.u0, c.u1, extras);
  const aneis = new Map();
  const anel = d => {
    let a = aneis.get(d);
    if (!a) { a = us.map(u => fam.ponto(d, u)); a.len = comprimentos(a); aneis.set(d, a); }
    return a;
  };
  const naFaixa = (e, u) => fam.fechado ? (u > e.ua && u < e.ub) || (u - 9 > e.ua && u - 9 < e.ub) || (u + 9 > e.ua && u + 9 < e.ub) : u > e.ua && u < e.ub;
  const em = (nome, u) => lista(nome).find(e => naFaixa(e, u));
  const meio = i => (us[i] + us[i + 1]) / 2;
  /* o que a fileira k é no intervalo i: null (cortado), 'poço', 'meia' (escada) ou 'cheia' */
  const tipo = (i, k) => {
    const um = meio(i);
    if (em('cortes', um)) return null;
    const v = em('vom', um);
    if (v && k >= v.k0 && k <= v.k1) return 'poço';
    const e = em('escadas', um);
    if (e && k >= e.k0 && k <= e.k1) return 'meia';
    return 'cheia';
  };
  const tinta = c.tinta, tParede = c.tintaParede || tinta, r = sorteio(c.semente || 1);
  const tom = Array.from({ length: n + 1 }, () => 0.94 + r() * 0.09);
  const corPiso = k => vezes(tinta, tom[k]), corEsp = k => vezes(tinta, tom[k] * 0.8);
  const P = (q, y) => [q[0], y, q[1]];
  const Mdeg = O.m('degrau'), Mpar = O.m('parede');
  /* piso entre os anéis dA e dB, do ponto i ao j (o intervalo i, ou uma
     reta inteira de intervalos iguais) */
  const pisoH = (M, dA, dB, y, i, cor, j = i + 1) => {
    const A = anel(dA), B = anel(dB), a = P(A[i], y), b = P(A[j], y), cc = P(B[j], y), d = P(B[i], y);
    M.quad(a, b, cc, d, pl(a, 4), pl(b, 4), pl(cc, 4), pl(d, 4), cor, CIMA);
  };
  /* parede em pé no anel d, de ya a yb; lado −1 olha pro campo, +1 pra fora */
  const paredeV = (M, d, ya, yb, i, cor, lado, eu = 4, ev = 4, yr = 0, j = i + 1) => {
    const A = anel(d), q0 = A[i], q1 = A[j], u0 = A.len[i] / eu, u1 = A.len[j] / eu;
    M.quad(P(q0, ya), P(q1, ya), P(q1, yb), P(q0, yb), [u0, (ya - yr) / ev], [u1, (ya - yr) / ev], [u1, (yb - yr) / ev], [u0, (yb - yr) / ev],
      cor, [(q0[2] + q1[2]) * lado, 0, (q0[3] + q1[3]) * lado]);
  };
  const Mnariz = c.nariz ? O.m('nariz') : null, BRANCA = lin('#f3f1ea');
  const cortado = i => !!em('cortes', meio(i));
  const murFrente = i => { const um = meio(i), v = em('vom', um); return c.par > 0 && !em('aberturas', um) && !(v && v.k0 === 0); };
  /* o ponto j está na reta dos vizinhos no anel d? (aí dois intervalos viram um quadrilátero só) */
  const colin = (d, j) => {
    const A = anel(d), a = A[j - 1], b = A[j], q = A[j + 1], L = Math.hypot(q[0] - a[0], q[1] - a[1]);
    return Math.abs((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0])) < 1e-4 * L;
  };
  /* OS DEGRAUS, fileira por fileira; na reta, os intervalos iguais seguidos
     viram um quadrilátero só (na curva, um por intervalo) */
  for (let k = 0; k <= n; k++) {
    let i = 0;
    while (i < us.length - 1) {
      if (k === n) {                       // o último espelho, até o corredor de cima
        if (cortado(i)) { i++; continue; }
        let j = i + 1;
        while (j < us.length - 1 && !cortado(j) && colin(dn, j)) j++;
        paredeV(Mdeg, dn, yk(n - 1), yn, i, corEsp(n), -1, 4, 4, 0, j);
        i = j; continue;
      }
      const t = tipo(i, k);
      if (!t || t === 'poço') { i++; continue; }
      const yb = k === 0 ? c.yBase : yk(k) - esp, mf = k === 0 && murFrente(i);
      if (t === 'meia') {
        const ym = yk(k) - esp / 2, dm = dk(k) + prof / 2;
        if (!mf) paredeV(Mdeg, dk(k), yb, ym, i, corEsp(k), -1);
        pisoH(Mdeg, dk(k), dm, ym, i, corPiso(k));
        paredeV(Mdeg, dm, ym, yk(k), i, corEsp(k), -1);
        pisoH(Mdeg, dm, dk(k + 1), yk(k), i, corPiso(k));
        i++; continue;
      }
      let j = i + 1;
      while (j < us.length - 1 && tipo(j, k) === 'cheia' && (k > 0 || murFrente(j) === mf) && colin(dk(k), j) && colin(dk(k + 1), j)) j++;
      if (!mf) paredeV(Mdeg, dk(k), yb, yk(k), i, corEsp(k), -1, 4, 4, 0, j);
      pisoH(Mdeg, dk(k), dk(k + 1), yk(k), i, corPiso(k), j);
      if (Mnariz) pisoH(Mnariz, dk(k), dk(k) + 0.1, yk(k) + 0.004, i, BRANCA, j);
      i = j;
    }
  }
  /* o corredor de cima, as muretas de trás e da frente, a fachada */
  for (let i = 0; i < us.length - 1; i++) {
    if (cortado(i)) continue;
    const mureta = murFrente(i);
    const t = c.topo;
    if (t) {
      if (t.larg > 0) pisoH(O.m('piso'), dn, dn + t.larg, yn, i, t.corPiso || tinta);
      if (t.par > 0) {
        const dp = dn + t.larg, ytop = yn + t.par;
        paredeV(Mpar, dp, yn, ytop, i, tParede, -1);
        pisoH(Mpar, dp, dp + 0.25, ytop, i, tParede);
        if (t.fachada) paredeV(O.m('fachada'), dp + 0.25, t.yChao, ytop, i, t.corFachada || tParede, 1, 12, 6, t.yChao);
        else paredeV(Mpar, dp + 0.25, yn, ytop, i, tParede, 1);
      }
    }
    /* a mureta da frente (a face de fora desce até o chão da frente) */
    if (mureta) {
      paredeV(Mpar, d0, c.yBase, y0 + c.par, i, tParede, -1);
      pisoH(Mpar, d0, d0 + 0.2, y0 + c.par, i, tParede);
      paredeV(Mpar, d0 + 0.2, y0, y0 + c.par, i, tParede, 1);
    }
  }
  /* OS VOMITÓRIOS: o chão escuro do poço, a boca do túnel no fundo, a
     mureta dos lados (1 m acima do degrau) e a de trás */
  const Mesc = O.m('escuro'), Mboca = O.m('boca');
  for (const v of lista('vom')) {
    const yP = v.yPiso ?? (v.k0 > 0 ? yk(v.k0 - 1) : c.yBase), dA = dk(v.k0), dB = dk(v.k1 + 1), yTopo = yk(v.k1);
    for (let i = 0; i < us.length - 1; i++) {
      if (!naFaixa(v, meio(i))) continue;
      pisoH(Mesc, dA, dB, yP, i, [0.9, 0.9, 0.9]);
      const A = anel(dB), q0 = A[i], q1 = A[i + 1];
      const w = v.ub - v.ua, f0 = (us[i] - v.ua) / w, f1 = (us[i + 1] - v.ua) / w;
      const fu = x => x < 0 ? x + 9 / w : x;
      Mboca.quad(P(q0, yP), P(q1, yP), P(q1, yTopo), P(q0, yTopo), [fu(f0), 0], [fu(f1), 0], [fu(f1), 1], [fu(f0), 1], BRANCO, [-(q0[2] + q1[2]), 0, -(q0[3] + q1[3])]);
      if (v.k1 + 1 < n) {
        paredeV(Mpar, dB, yk(v.k1 + 1), yk(v.k1 + 1) + 1.0, i, tParede, -1);
        pisoH(Mpar, dB, dB + 0.15, yk(v.k1 + 1) + 1.0, i, tParede);
      }
    }
    for (const uu of [v.ua, v.ub]) for (let k = v.k0; k <= v.k1; k++) {
      const qa = fam.ponto(dk(k), uu), qb = fam.ponto(dk(k + 1), uu), yt = yk(k) + 1.0;
      Mpar.quad(P(qa, yP), P(qb, yP), P(qb, yt), P(qa, yt), [dk(k) / 4, yP / 4], [dk(k + 1) / 4, yP / 4], [dk(k + 1) / 4, yt / 4], [dk(k) / 4, yt / 4], tParede);
    }
  }
  /* AS MURETAS que dividem a arquibancada em blocos: 1 m acima do degrau */
  for (const m of lista('muretas')) for (let k = m.k0; k <= Math.min(m.k1, n - 1); k++) {
    const v = em('vom', m.u);
    if (v && k >= v.k0 && k <= v.k1) continue;
    const qa = fam.ponto(dk(k), m.u), qb = fam.ponto(dk(k + 1), m.u), h = m.h || 1.0;
    Mpar.quad(P(qa, yk(k)), P(qb, yk(k)), P(qb, yk(k) + h), P(qa, yk(k) + h), [dk(k) / 4, yk(k) / 4], [dk(k + 1) / 4, yk(k) / 4], [dk(k + 1) / 4, (yk(k) + h) / 4], [dk(k) / 4, (yk(k) + h) / 4], tParede);
  }
  /* AS PONTAS: a parede em degrau onde a arquibancada acaba (ou onde o
     portão corta), do chão até o degrau */
  const perfil = () => {
    const p = [[d0, yChao]];
    if (c.par > 0) p.push([d0, y0 + c.par], [d0 + 0.2, y0 + c.par], [d0 + 0.2, y0]); else p.push([d0, y0]);
    for (let k = 1; k <= n; k++) p.push([dk(k), yk(k - 1)], [dk(k), yk(k)]);
    let de = dn;
    const t = c.topo;
    if (t && t.larg > 0) { de = dn + t.larg; p.push([de, yn]); }
    if (t && t.par > 0) { p.push([de, yn + t.par], [de + 0.25, yn + t.par]); de += 0.25; }
    p.push([de, yChao]);
    return p;
  };
  const ponta = (u, sinal) => {
    const pf = perfil(), tris = THREE.ShapeUtils.triangulateShape(pf.map(q => new THREE.Vector2(q[0], q[1])), []);
    const e = 1e-3, qa = fam.ponto(d0, u - e), qb = fam.ponto(d0, u + e);
    const tg = [(qb[0] - qa[0]) * sinal, 0, (qb[1] - qa[1]) * sinal];
    const pt = q => { const s = fam.ponto(q[0], u); return [s[0], q[1], s[1]]; };
    for (const [a, b, cc] of tris) Mpar.tri(pt(pf[a]), pt(pf[b]), pt(pf[cc]), [pf[a][0] / 4, pf[a][1] / 4], [pf[b][0] / 4, pf[b][1] / 4], [pf[cc][0] / 4, pf[cc][1] / 4], tParede, tg);
  };
  if (!fam.fechado || c.u1 - c.u0 < 9 - 1e-6) { ponta(c.u0, -1); ponta(c.u1, 1); }
  for (const e of lista('cortes')) { ponta(e.ua, 1); ponta(e.ub, -1); }

  return {
    fam, c, us, n, dk, yk, dn, yn,
    /* o ponto do meio do piso da fileira k no u */
    ponto(u, k, dy = 0) { const q = fam.ponto(dk(k) + prof / 2, u); return [q[0], yk(k) + dy, q[1]]; },
    /* a cor do setor por cima do degrau (piso e espelho), fora das escadas e dos poços */
    camada(M, ua, ub, k0, k1, cor) {
      const e = { ua, ub };
      for (let i = 0; i < us.length - 1; i++) {
        if (!naFaixa(e, meio(i))) continue;
        for (let k = k0; k <= Math.min(k1, n - 1); k++) {
          if (tipo(i, k) !== 'cheia') continue;
          pisoH(M, dk(k), dk(k + 1), yk(k) + 0.05, i, cor);
          paredeV(M, dk(k) - 0.03, yk(k) - esp, yk(k) + 0.05, i, cor, -1);
        }
      }
    },
    /* lugares: 0,5 m de degrau por pessoa, fora da escada, do poço e do corte */
    lugares(ua, ub, k0 = 0, k1 = n - 1) {
      const e = { ua, ub };
      let m = 0;
      for (let i = 0; i < us.length - 1; i++) {
        if (ua !== undefined && !naFaixa(e, meio(i))) continue;
        for (let k = k0; k <= Math.min(k1, n - 1); k++) if (tipo(i, k) === 'cheia') { const A = anel(dk(k) + prof / 2); m += A.len[i + 1] - A.len[i]; }
      }
      return Math.round(m / 0.5);
    },
    /* O GRADIL da divisória no u: 2,4 m acima do degrau, da mureta da
       frente até o corredor de cima, com um poste a cada duas fileiras */
    gradil(u, h = 2.4) {
      const M = O.m('gradil'), Mp = O.m('pintura'), POSTE = lin('#6d757b');
      const seg = [];
      for (let k = 0; k < n; k++) seg.push([dk(k) + (k === 0 && c.par > 0 ? 0.2 : 0), dk(k + 1), yk(k)]);
      if (c.topo && c.topo.larg > 0) seg.push([dn, dn + c.topo.larg, yn]);
      for (const [da, db, y] of seg) {
        const qa = fam.ponto(da, u), qb = fam.ponto(db, u);
        M.quad(P(qa, y), P(qb, y), P(qb, y + h), P(qa, y + h), [(da - d0) / 2.5, 0], [(db - d0) / 2.5, 0], [(db - d0) / 2.5, h / 2.5], [(da - d0) / 2.5, h / 2.5]);
      }
      for (let k = 0; k <= n; k += 2) { const q = fam.ponto(Math.min(dk(k) + 0.1, dn), u); caixa(Mp, q[0], yk(Math.min(k, n - 1)), q[1], 0.08, 0.08, h, 0, POSTE); }
    },
    /* A FAIXA da torcida pendurada na mureta da frente, virada pro campo */
    faixa(grupo, u, larg, texto, cor1, cor2) {
      const w = larguraU(fam, u, d0, larg), passos = 16, alto = 1.6, ytop = y0 + c.par - 0.1;
      const Mf = new Malha();
      let s0 = 0;
      for (let j = 0; j < passos; j++) {
        const ua = u - w / 2 + w * j / passos, ub = u - w / 2 + w * (j + 1) / passos;
        const qa = fam.ponto(d0 - 0.05, ua), qb = fam.ponto(d0 - 0.05, ub), s1 = s0 + Math.hypot(qb[0] - qa[0], qb[1] - qa[1]);
        Mf.quad(P(qa, ytop - alto), P(qb, ytop - alto), P(qb, ytop), P(qa, ytop), [s0 / larg, 0], [s1 / larg, 0], [s1 / larg, 1], [s0 / larg, 1], BRANCO, [-(qa[2] + qb[2]), 0, -(qa[3] + qb[3])]);
        s0 = s1;
      }
      const m = new THREE.Mesh(Mf.geometria(), new THREE.MeshLambertMaterial({ name: 'faixa', map: telaDaFaixa(texto, cor1, cor2), side: THREE.DoubleSide }));
      m.name = 'faixa';
      grupo.add(m);
    }
  };
}

/* ======================================================
   AS PEÇAS SOLTAS
   ====================================================== */
/* caixa de pé no chão y0, centro (cx, cz), w no rumo, p de fundo, h de altura */
function caixa(M, cx, y0, cz, w, p, h, rumo = 0, cor = BRANCO, esc = 2) {
  const co = Math.cos(rumo), si = Math.sin(rumo), hw = w / 2, hp = p / 2, y1 = y0 + h;
  const P = (u, y, v) => [cx + u * co - v * si, y, cz + u * si + v * co];
  const q = [[-hw, -hp], [hw, -hp], [hw, hp], [-hw, hp]];
  const b = q.map(([u, v]) => P(u, y0, v)), t = q.map(([u, v]) => P(u, y1, v));
  M.quad(t[0], t[1], t[2], t[3], pl(t[0], esc), pl(t[1], esc), pl(t[2], esc), pl(t[3], esc), cor, CIMA);
  for (let j = 0; j < 4; j++) {
    const a = b[j], bb = b[(j + 1) % 4], L = j % 2 === 0 ? w : p;
    M.quad(a, bb, t[(j + 1) % 4], t[j], [0, y0 / esc], [L / esc, y0 / esc], [L / esc, y1 / esc], [0, y1 / esc], cor, [(a[0] + bb[0]) / 2 - cx, 0, (a[2] + bb[2]) / 2 - cz]);
  }
}
/* caixa entre dois cantos alinhados (x0..x1, z0..z1) */
const bloco = (M, x0, x1, z0, z1, y0, y1, cor, esc = 4) => caixa(M, (x0 + x1) / 2, y0, (z0 + z1) / 2, x1 - x0, z1 - z0, y1 - y0, 0, cor, esc);
/* cilindro de a até b */
function cilindro(M, a, b, r, lados, cor = BRANCO) {
  const w = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...w);
  w[0] /= L; w[1] /= L; w[2] /= L;
  const t = Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = [w[1] * t[2] - w[2] * t[1], w[2] * t[0] - w[0] * t[2], w[0] * t[1] - w[1] * t[0]], lu = Math.hypot(...u);
  u[0] /= lu; u[1] /= lu; u[2] /= lu;
  const v = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
  const o = j => { const th = j / lados * Math.PI * 2, c = Math.cos(th) * r, s = Math.sin(th) * r; return [u[0] * c + v[0] * s, u[1] * c + v[1] * s, u[2] * c + v[2] * s]; };
  for (let j = 0; j < lados; j++) {
    const o0 = o(j), o1 = o(j + 1), ad = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
    M.quad(ad(a, o0), ad(a, o1), ad(b, o1), ad(b, o0), [j / lados, 0], [(j + 1) / lados, 0], [(j + 1) / lados, L], [j / lados, L], cor, [o0[0] + o1[0], o0[1] + o1[1], o0[2] + o1[2]]);
  }
}
/* chão plano: um contorno (e buracos), pontos [x, z] */
function chaoPlano(M, contorno, buracos, y, cor, esc) {
  const V = p => new THREE.Vector2(p[0], p[1]);
  const tris = THREE.ShapeUtils.triangulateShape(contorno.map(V), buracos.map(b => b.map(V)));
  const todos = [...contorno, ...buracos.flat()];
  for (const [a, b, c] of tris) {
    const A = [todos[a][0], y, todos[a][1]], B = [todos[b][0], y, todos[b][1]], C = [todos[c][0], y, todos[c][1]];
    M.tri(A, B, C, pl(A, esc), pl(B, esc), pl(C, esc), cor, CIMA);
  }
}
const retangulo = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
/* o contorno de um anel (pontos [x, z]) */
const contornoDe = (fam, d) => fam.amostras(0, 9).slice(0, -1).map(u => { const q = fam.ponto(d, u); return [q[0], q[1]]; });
/* faixa de chão entre dois anéis, e parede em pé num anel */
function faixaDeAnel(M, fam, dA, dB, y, cor, esc = 6, pula = []) {
  const us = fam.amostras(0, 9, pula.flatMap(p => [p.ua, p.ub])), A = us.map(u => fam.ponto(dA, u)), B = us.map(u => fam.ponto(dB, u));
  const fora = u => pula.some(p => (u > p.ua && u < p.ub) || (u + 9 > p.ua && u + 9 < p.ub) || (u - 9 > p.ua && u - 9 < p.ub));
  for (let i = 0; i < us.length - 1; i++) {
    if (fora((us[i] + us[i + 1]) / 2)) continue;
    const a = [A[i][0], y, A[i][1]], b = [A[i + 1][0], y, A[i + 1][1]], c = [B[i + 1][0], y, B[i + 1][1]], d = [B[i][0], y, B[i][1]];
    M.quad(a, b, c, d, pl(a, esc), pl(b, esc), pl(c, esc), pl(d, esc), cor, CIMA);
  }
}
function paredeDeAnel(M, fam, d, ya, yb, cor, lado, esc = 4, pula = []) {
  const us = fam.amostras(0, 9, pula.flatMap(p => [p.ua, p.ub])), A = us.map(u => fam.ponto(d, u)), L = comprimentos(A);
  const fora = u => pula.some(p => (u > p.ua && u < p.ub) || (u + 9 > p.ua && u + 9 < p.ub) || (u - 9 > p.ua && u - 9 < p.ub));
  for (let i = 0; i < us.length - 1; i++) {
    if (fora((us[i] + us[i + 1]) / 2)) continue;
    const q0 = A[i], q1 = A[i + 1];
    M.quad([q0[0], ya, q0[1]], [q1[0], ya, q1[1]], [q1[0], yb, q1[1]], [q0[0], yb, q0[1]], [L[i] / esc, ya / esc], [L[i + 1] / esc, ya / esc], [L[i + 1] / esc, yb / esc], [L[i] / esc, yb / esc],
      cor, [(q0[2] + q1[2]) * lado, 0, (q0[3] + q1[3]) * lado]);
  }
}
/* O GRAMADO: leque do centro até o anel d, com a textura pintada do campo */
function gramado(O, fam, d, chave, cfg) {
  const { A, B } = fam.geo(d), x0 = -A, x1 = A, z0 = -B, z1 = B;
  O.proprio(chave, () => new THREE.MeshLambertMaterial({ name: 'gramado', map: pintarCampo({ ...cfg, x0, x1, z0, z1 }) }));
  const M = O.m(chave), uv = (x, z) => [(x - x0) / (x1 - x0), 1 - (z - z0) / (z1 - z0)];
  const pts = fam.amostras(0, 9).map(u => fam.ponto(d, u));
  for (let i = 0; i < pts.length - 1; i++)
    M.tri([0, 0, 0], [pts[i][0], 0, pts[i][1]], [pts[i + 1][0], 0, pts[i + 1][1]], uv(0, 0), uv(pts[i][0], pts[i][1]), uv(pts[i + 1][0], pts[i + 1][1]), BRANCO, CIMA);
}
/* O GOL: traves de 12 cm, 7,32 × 2,44, a rede 2 m pra trás embaixo e 1 m em cima */
function gol(O, x, lado) {
  const Mb = O.m('pintura'), Mr = O.m('rede'), B = lin('#f7f7f4'), L = 3.66, H = 2.44, pb = 2.0 * lado, pt = 1.0 * lado;
  cilindro(Mb, [x, 0, -L], [x, H, -L], 0.06, 8, B); cilindro(Mb, [x, 0, L], [x, H, L], 0.06, 8, B);
  cilindro(Mb, [x, H, -L - 0.06], [x, H, L + 0.06], 0.06, 8, B);
  for (const z of [-L, L]) cilindro(Mb, [x + pt, H, z], [x + pb, 0, z], 0.025, 5, B);
  cilindro(Mb, [x + pt, H, -L], [x + pt, H, L], 0.025, 5, B);
  cilindro(Mb, [x + pb, 0.02, -L], [x + pb, 0.02, L], 0.025, 5, B);
  const back = Math.hypot(pb - pt, H);
  Mr.quad([x + pt, H, -L], [x + pt, H, L], [x + pb, 0, L], [x + pb, 0, -L], [0, back], [2 * L, back], [2 * L, 0], [0, 0]);
  Mr.quad([x, H, -L], [x, H, L], [x + pt, H, L], [x + pt, H, -L], [0, 0], [2 * L, 0], [2 * L, 1], [0, 1]);
  for (const z of [-L, L]) {
    Mr.quad([x, 0, z], [x + pb, 0, z], [x + pt, H, z], [x, H, z], [0, 0], [Math.abs(pb), 0], [Math.abs(pt), H], [0, H]);
  }
}
function bandeirinhas(O, C, Lg) {
  const Mb = O.m('pintura'), Ml = O.m('lona'), B = lin('#f2f2ee'), A = lin('#f5c400');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * C, z = sz * Lg;
    cilindro(Mb, [x, 0, z], [x, 1.5, z], 0.025, 5, B);
    Ml.quad([x, 1.5, z], [x - sx * 0.4, 1.5, z], [x - sx * 0.4, 1.2, z], [x, 1.2, z], [0, 0], [1, 0], [1, 1], [0, 1], A);
  }
}
/* O BANCO DE RESERVAS: de x0 a x1, a frente em zF (lado do campo) e o
   fundo em zT; o coberto tem as paredes, o teto de acrílico e a fileira
   de cadeira; o aberto é o banco comprido no gramado */
function banco(O, x0, x1, zF, zT, coberto, corBanco = '#1d4f91') {
  const Mp = O.m('pintura'), s = Math.sign(zT - zF), zm = (zF + zT) / 2, CZ = lin('#d8d8d2'), AZ = lin(corBanco);
  if (coberto) {
    bloco(Mp, x0, x1, Math.min(zT, zT - s * 0.15), Math.max(zT, zT - s * 0.15), 0, 2.3, CZ);
    for (const x of [x0, x1 - 0.12]) bloco(Mp, x, x + 0.12, Math.min(zF, zT), Math.max(zF, zT), 0, 2.2, CZ);
    O.m('vidro').quad([x0, 2.3, zT], [x1, 2.3, zT], [x1, 2.0, zF], [x0, 2.0, zF], [0, 0], [1, 0], [1, 1], [0, 1], BRANCO, CIMA);
  }
  const nb = Math.floor((x1 - x0 - 0.4) / 0.55);
  for (let j = 0; j < nb; j++) {
    const x = x0 + 0.2 + 0.275 + j * 0.55, z = coberto ? zT - s * 0.55 : zm;
    caixa(Mp, x, 0.42, z, 0.46, 0.44, 0.08, 0, AZ);
    caixa(Mp, x, 0.5, z + s * 0.2, 0.46, 0.06, 0.45, 0, AZ);
  }
  if (!coberto) { bloco(Mp, x0, x1, zm - 0.3, zm + 0.3, 0, 0.42, lin('#f0f0ea')); }
}
/* A TORRE DE LUZ de treliça: quatro faces recortadas, a plataforma e o
   painel de refletores virado pro centro do campo */
function torreDeLuz(O, x, z, h, largPainel = 9, altoPainel = 5.5) {
  const M = O.m('trelica'), w0 = 1.9, w1 = 1.0;
  const cantos = (w, y) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [x + a * w / 2, y, z + b * w / 2]);
  const b = cantos(w0, 0), t = cantos(w1, h);
  for (let j = 0; j < 4; j++) {
    const k = (j + 1) % 4;
    M.quad(b[j], b[k], t[k], t[j], [0, 0], [1, 0], [1, h / 6.4], [0, h / 6.4], BRANCO, [(b[j][0] + b[k][0]) / 2 - x, 0, (b[j][2] + b[k][2]) / 2 - z]);
  }
  painel(O, x, h, z, largPainel, altoPainel, 18);
}
/* o painel de refletores: centro (x, y embaixo, z), virado pro centro do campo, inclinado `incl` graus pra baixo */
function painel(O, x, y, z, w, h, incl) {
  const L = Math.hypot(x, z), fx = -x / L, fz = -z / L, ti = incl * RAD;
  const f = [fx * Math.cos(ti), -Math.sin(ti), fz * Math.cos(ti)], rgt = [-fz, 0, fx];
  const up = [rgt[1] * f[2] - rgt[2] * f[1], rgt[2] * f[0] - rgt[0] * f[2], rgt[0] * f[1] - rgt[1] * f[0]];
  const c = [x, y + h / 2 + 0.5, z];
  const pt = (a, bb, e) => [c[0] + rgt[0] * a + up[0] * bb + f[0] * e, c[1] + rgt[1] * a + up[1] * bb + f[1] * e, c[2] + rgt[2] * a + up[2] * bb + f[2] * e];
  const hw = w / 2, hh = h / 2;
  O.m('refletor').quad(pt(-hw, -hh, 0.3), pt(hw, -hh, 0.3), pt(hw, hh, 0.3), pt(-hw, hh, 0.3), [1, 0], [0, 0], [0, 1], [1, 1], BRANCO, f);
  const Mp = O.m('pintura'), G = lin('#4a5056');
  Mp.quad(pt(-hw, -hh, -0.3), pt(hw, -hh, -0.3), pt(hw, hh, -0.3), pt(-hw, hh, -0.3), [0, 0], [1, 0], [1, 1], [0, 1], G, [-f[0], -f[1], -f[2]]);
  for (const [a0, b0, a1, b1] of [[-hw, hh, hw, hh], [hw, -hh, -hw, -hh], [-hw, -hh, -hw, hh], [hw, hh, hw, -hh]])
    Mp.quad(pt(a0, b0, -0.3), pt(a1, b1, -0.3), pt(a1, b1, 0.3), pt(a0, b0, 0.3), [0, 0], [1, 0], [1, 1], [0, 1], G, [(a0 + a1) / 2 * rgt[0] + (b0 + b1) / 2 * up[0], (b0 + b1) / 2 * up[1], (a0 + a1) / 2 * rgt[2] + (b0 + b1) / 2 * up[2]]);
  caixa(Mp, x, y - 0.3, z, w * 0.7, 2.2, 0.25, Math.atan2(fz, fx) + Math.PI / 2, G);
}
/* o poste de concreto do de 10 mil, com a cruzeta de quatro refletores */
function posteDeLuz(O, x, z, h) {
  const Mp = O.m('pintura');
  cilindro(Mp, [x, 0, z], [x, h, z], 0.28, 10, lin('#bdbab2'));
  painel(O, x, h - 1.6, z, 3.4, 1.8, 22);
}
/* as placas de publicidade no anel d (0,9 m de altura), viradas pro campo, com os vãos */
function placasNoAnel(O, fam, d, vaos) {
  const us = fam.amostras(0, 9, vaos.flatMap(v => [v.ua, v.ub])), A = us.map(u => fam.ponto(d, u)), B = us.map(u => fam.ponto(d + 0.12, u)), L = comprimentos(A);
  const fora = u => vaos.some(v => (u > v.ua && u < v.ub) || (u + 9 > v.ua && u + 9 < v.ub) || (u - 9 > v.ua && u - 9 < v.ub));
  const Mf = O.m('placas'), Mc = O.m('pintura'), G = lin('#3c4146'), H = 0.9;
  for (let i = 0; i < us.length - 1; i++) {
    if (fora((us[i] + us[i + 1]) / 2)) continue;
    const a = A[i], b = A[i + 1], c = B[i], e = B[i + 1], u0 = L[i] / 28.8, u1 = L[i + 1] / 28.8;
    Mf.quad([a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], H, b[1]], [a[0], H, a[1]], [u0, 0], [u1, 0], [u1, 1], [u0, 1], BRANCO, [-(a[2] + b[2]), 0, -(a[3] + b[3])]);
    Mc.quad([c[0], 0, c[1]], [e[0], 0, e[1]], [e[0], H, e[1]], [c[0], H, c[1]], [0, 0], [1, 0], [1, 1], [0, 1], G, [c[2] + e[2], 0, c[3] + e[3]]);
    Mc.quad([a[0], H, a[1]], [b[0], H, b[1]], [e[0], H, e[1]], [c[0], H, c[1]], [0, 0], [1, 0], [1, 1], [0, 1], G, CIMA);
  }
}
/* muro reto alinhado (de x0,z0 a x1,z1, um dos dois constante), com vãos [a, b] ao longo dele */
function muro(M, x0, z0, x1, z1, esp, h, cor, vaos = [], y0 = 0) {
  const emX = z0 === z1, a0 = emX ? Math.min(x0, x1) : Math.min(z0, z1), a1 = emX ? Math.max(x0, x1) : Math.max(z0, z1), fixo = emX ? z0 : x0;
  const cortes = [...vaos].sort((p, q) => p[0] - q[0]);
  let a = a0;
  const pedaco = (p, q) => { if (q - p < 0.01) return; if (emX) bloco(M, p, q, fixo - esp / 2, fixo + esp / 2, y0, y0 + h, cor); else bloco(M, fixo - esp / 2, fixo + esp / 2, p, q, y0, y0 + h, cor); };
  for (const [p, q] of cortes) { pedaco(a, Math.max(a, p)); a = Math.max(a, q); }
  pedaco(a, a1);
}
/* o portão de gradil com o quadro pintado, de a até b ao longo do muro (x ou z fixo) */
function portao(O, emX, fixo, a, b, h, corQuadro) {
  const Mg = O.m('gradil'), Mp = O.m('pintura'), C = lin(corQuadro), P = (s, y) => emX ? [s, y, fixo] : [fixo, y, s];
  Mg.quad(P(a, 0.05), P(b, 0.05), P(b, h), P(a, h), [0, 0], [(b - a) / 2.5, 0], [(b - a) / 2.5, h / 2.5], [0, h / 2.5]);
  for (const s of [a, (a + b) / 2, b]) caixa(Mp, emX ? s : fixo, 0, emX ? fixo : s, 0.3, 0.3, h + 0.3, 0, C);
  if (emX) bloco(Mp, a, b, fixo - 0.06, fixo + 0.06, h, h + 0.12, C); else bloco(Mp, fixo - 0.06, fixo + 0.06, a, b, h, h + 0.12, C);
}

/* ======================================================
   A CAMADA DOS SETORES
   ====================================================== */
const COR_SETOR = {
  m1: '#1b7f3b', m2: '#43a047', m3: '#9ccc3c', v1: '#c62828', v2: '#ef6c00', v3: '#f2b705', pm: '#1f3f9a'
};
const NOME_SETOR = {
  m1: 'Mandante 1º escalão', m2: 'Mandante 2º escalão', m3: 'Mandante 3º escalão',
  v1: 'Visitante 1º escalão', v2: 'Visitante 2º escalão', v3: 'Visitante 3º escalão', pm: 'PM'
};
/* cada setor: {id, arq (a arquibancada), ua, ub, k0, k1}; a faixa vai no meio, o nome em cima */
function camadaDosSetores(S, G, setores, tamRotulo) {
  const lista = [];
  for (const s of setores) {
    const A = s.arq, k0 = s.k0 ?? 0, k1 = s.k1 ?? A.n - 1, cor = COR_SETOR[s.id];
    A.camada(S.m('setor:' + cor), s.ua, s.ub, k0, k1, BRANCO);
    const um = (s.ua + s.ub) / 2, km = Math.round((k0 + k1) / 2);
    const r = rotulo(NOME_SETOR[s.id], cor, s.id === 'pm' ? tamRotulo * 0.6 : tamRotulo);
    const p = A.ponto(um, km, 3.5);
    r.position.set(p[0], p[1], p[2]);
    G.add(r);
    if (s.id !== 'pm') {
      const comp = A.lugares(s.ua, s.ub, 0, 0) * 0.5;
      const larg = Math.min(s.faixa || 24, comp * 0.7);
      if (s.faixaNoAnel !== false && larg > 4) A.faixa(G, um, larg, NOME_SETOR[s.id].toUpperCase(), cor, s.id[0] === 'm' ? '#0d3b1e' : '#4a0d0d');
    }
    lista.push({ id: s.id, nome: NOME_SETOR[s.id], cor, lugares: A.lugares(s.ua, s.ub, k0, k1), onde: s.onde });
  }
  /* o mesmo escalão pode ter mais de um pedaço: soma */
  const soma = {};
  for (const x of lista) { if (!soma[x.id]) soma[x.id] = { ...x }; else soma[x.id].lugares += x.lugares; }
  return Object.values(soma);
}
/* os marcadores: o túnel de cada lado e o posto da PM */
function marcador(G, texto, cor, x, y, z, tam) {
  const r = rotulo(texto, cor, tam);
  r.position.set(x, y, z);
  G.add(r);
}

/* ======================================================
   O ESTÁDIO DE 10 MIL (nível 1)
   foto: 12,65 px por metro, campo de 100 × 68
   ====================================================== */
function montar10(O, S, G) {
  const tArq = lin('#dcd9d1'), tMuro = lin('#eeebe3'), tPasso = lin('#d2cfc6');
  const Fg = anelFechado({ A0: 53.75, B0: 38.5, r0: 4, k: 1 });
  const Fn = caminho([{ reta: [-45.2, -40.6, 46.1, -40.6] }]);
  const Fl = caminho([
    { arco: [47.7, -34, 7.9, -90, 0] }, { reta: [55.6, -34, 55.6, 31.6] }, { arco: [47.7, 31.6, 7.9, 0, 90] },
    { reta: [47.7, 39.5, -51.5, 39.5] }, { arco: [-51.5, 36.1, 3.4, 90, 180] }
  ]);
  const N = 15, BASE = { d0: 0, n: N, prof: 0.8, esp: 0.4, y0: 1.0, yBase: 0, yChao: 0, par: 1.0, tinta: tArq, tintaParede: tMuro, nariz: true, topo: { larg: 0, par: 0 } };
  const uN = x => Fn.uDe(x, -45).u;
  /* norte: visitante 1º (−45,2 a −26), 2º (até −8,2), a PM (até 2,5) — as divisórias do dono em −8,2 e 2,5 */
  const divN = [uN(-8.2), uN(2.5)];
  const An = arquibancada(O, Fn, { ...BASE, u0: 0, u1: 1, semente: 3,
    escadas: [-38, -14.4, 14.9, 38].map(x => ({ ...faixaEm(Fn, x, -45, 1.2, 6), k0: 0, k1: N - 1 })),
    extras: [...divN, uN(-26)] });
  /* leste e sul: o portão do mandante corta a do leste (z −5,7 a 4,9); o túnel no meio da do sul */
  const corte = entre(Fl, [61, -5.7], [61, 4.9]);
  const tunel = entre(Fl, [1.7, 45], [-1.9, 45]);
  const uMeioSul = Fl.uDe(-0.1, 45).u;
  const Al = arquibancada(O, Fl, { ...BASE, u0: 0, u1: 5, semente: 4,
    cortes: [corte], vom: [{ ...tunel, k0: 0, k1: 5, yPiso: 0 }], aberturas: [tunel],
    escadas: [
      ...[[61, -20], [61, 20], [44.2, 45], [13.8, 45], [-18, 45], [-40, 45]].map(([x, z]) => ({ ...faixaEm(Fl, x, z, 1.2, 6), k0: 0, k1: N - 1 })),
      ...[0.5, 2.5, 4.5].map(u => ({ ...faixaNoU(Fl, u, 1.2, 6), k0: 0, k1: N - 1 }))
    ],
    extras: [uMeioSul] });
  for (const u of divN) An.gradil(u);

  /* A PASSARELA DE CIMA (y 7,0) até o muro, e o muro caiado: 8,1 m onde
     tem arquibancada, 3 m no oeste; os portões e o vão do túnel */
  const yP = An.yn, Mpiso = O.m('piso'), Mpar = O.m('parede');
  chaoPlano(Mpiso, retangulo(-45.2, 47.7, -56.0, -52.6), [], yP, tPasso, 4);
  const tras = (u0, u1) => Fl.amostras(u0, u1).map(u => { const q = Fl.ponto(12, u); return [q[0], q[1]]; });
  chaoPlano(Mpiso, [...tras(0, corte.ua), [70.4, -5.7], [70.4, -56.0], [47.7, -56.0]], [], yP, tPasso, 4);
  chaoPlano(Mpiso, [...tras(corte.ub, 5), [-66.9, 57.2], [70.4, 57.2], [70.4, 4.9]], [], yP, tPasso, 4);
  /* as bordas soltas da passarela: a ponta oeste da do norte e os lados do portão */
  bloco(Mpar, -45.4, -45.2, -56.0, -52.6, 0, yP + 1.1, tMuro);
  bloco(Mpar, 67.6, 70.4, -5.9, -5.7, 0, yP + 1.1, tMuro);
  bloco(Mpar, 67.6, 70.4, 4.9, 5.1, 0, yP + 1.1, tMuro);
  const hA = yP + 1.1;
  muro(Mpar, -67.3, -56.2, -45.2, -56.2, 0.4, 3.0, tMuro);
  muro(Mpar, -45.2, -56.2, 70.8, -56.2, 0.4, hA, tMuro);
  muro(Mpar, -67.3, 57.4, 70.8, 57.4, 0.4, hA, tMuro);
  muro(Mpar, 70.6, -56.4, 70.6, 57.6, 0.4, hA, tMuro, [[-5.7, 4.9]]);
  muro(Mpar, -67.1, -56.4, -67.1, 36.1, 0.4, 3.0, tMuro, [[-5.9, 4.2], [-54.8, -50.0]]);
  muro(Mpar, -67.1, 36.1, -67.1, 57.6, 0.4, hA, tMuro);
  portao(O, false, 70.6, -5.7, 4.9, 3.2, '#2f5f8a');
  portao(O, false, -67.1, -5.9, 4.2, 2.8, '#35607f');

  /* O TÚNEL DO VISITANTE: o meio cilindro do noroeste, de fora do muro até o campo */
  {
    const Ml = O.m('lona'), a = [-70.8, -56.0], b = [-59.4, -44.6], r = 1.8, L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, nx = dz, nz = -dx, lados = 12, aneis = Math.ceil(L / 1.2);
    for (let j = 0; j < aneis; j++) for (let s = 0; s < lados; s++) {
      const t0 = j / aneis * L, t1 = (j + 1) / aneis * L, g0 = s / lados * Math.PI, g1 = (s + 1) / lados * Math.PI;
      const P = (t, g) => [a[0] + dx * t + nx * r * Math.cos(g), r * Math.sin(g), a[1] + dz * t + nz * r * Math.cos(g)];
      const cor = j % 2 ? lin('#dcd8cd') : lin('#cfcabe');
      Ml.quad(P(t0, g0), P(t1, g0), P(t1, g1), P(t0, g1), [0, 0], [1, 0], [1, 1], [0, 1], cor, [nx * Math.cos((g0 + g1) / 2), Math.sin((g0 + g1) / 2), nz * Math.cos((g0 + g1) / 2)]);
    }
  }
  /* o banco de reservas na frente da do norte, a mureta branca do gramado, o gol, as bandeirinhas */
  banco(O, -13.8, -3.5, -38.7, -40.5, true);
  banco(O, 3.3, 13.6, -38.7, -40.5, true, '#a11d2b');
  paredeDeAnel(O.m('pintura'), Fg, 0, 0, 0.25, lin('#f2f0ea'), -1);
  paredeDeAnel(O.m('pintura'), Fg, 0.2, 0, 0.25, lin('#f2f0ea'), 1);
  faixaDeAnel(O.m('pintura'), Fg, 0, 0.2, 0.25, lin('#f2f0ea'));
  gramado(O, Fg, 0, 'campo:10', { comp: 100, larg: 68, listra: 6.25, cores: ['#7f9a4c', '#86a052'], falha: 1.0, linha: 0.55, semente: 101 });
  gol(O, -50, -1); gol(O, 50, 1);
  bandeirinhas(O, 50, 34);
  for (const [x, z] of [[-69.8, -58.8], [73.2, -58.8], [73.2, 60.0], [-69.8, 60.0]]) posteDeLuz(O, x, z, 20);
  /* o chão: a terra batida de dentro, o de fora e a estrada de terra do leste */
  chaoPlano(O.m('terra'), retangulo(-66.9, 70.4, -56.0, 57.2), [contornoDe(Fg, 0.2)], -0.01, lin('#b7ae8d'), 6);
  chaoPlano(O.m('terra'), retangulo(-95, 101, -82, 84), [retangulo(-67.3, 70.8, -56.4, 57.6)], -0.01, lin('#f2e2cc'), 6);

  /* OS SETORES (as imagens do dono): norte v1, v2, PM; leste-sul m1 (até o portão), m2 (até o túnel do meio), m3 */
  const setores = camadaDosSetores(S, G, [
    { id: 'v1', arq: An, ua: 0, ub: uN(-26), faixa: 16 },
    { id: 'v2', arq: An, ua: uN(-26), ub: divN[0], faixa: 16 },
    { id: 'pm', arq: An, ua: divN[0], ub: divN[1] },
    { id: 'm1', arq: Al, ua: 0, ub: corte.ua, faixa: 18.5 },
    { id: 'm2', arq: Al, ua: corte.ub, ub: uMeioSul, faixa: 18.5 },
    { id: 'm3', arq: Al, ua: uMeioSul, ub: 5, faixa: 18.5 }
  ], 16);
  marcador(G, 'Túnel do mandante (portão)', '#1b7f3b', 66, 5, 0, 20);
  marcador(G, 'Túnel do visitante', '#c62828', -64, 5.5, -50, 17);
  return {
    aneis: [{ nome: 'Norte (visitante)', fileiras: N, degrau: '0,80 × 0,40 m', lugares: An.lugares() },
            { nome: 'Leste e sul', fileiras: N, degrau: '0,80 × 0,40 m', lugares: Al.lugares() }],
    setores, livre: 'o resto da do norte, do leste da PM até a ponta (2,5 a 46 m), fica sem torcida',
    vomitorios: 0, alturaArq: yP + 1.1, luz: 'quatro postes de 20 m nos cantos'
  };
}

/* ======================================================
   O ESTÁDIO DE 20 MIL (nível 2)
   foto: 9,7 px por metro, campo de 105 × 68
   ====================================================== */
function montar20(O, S, G) {
  const F = anelFechado({ A0: 67, B0: 45.7, r0: 12, k: 0.68 });
  const tArq = lin('#d9caa9'), tMuro = lin('#e3d8c1'), tPista = lin('#a7a59e');
  const N = 34, W = 5.0;
  const vom = [[42.2, -53.8], [-42.2, -53.8], [75.8, -24.7], [75.8, 24.7], [32.8, 54.5], [-32.8, 54.5], [-75.8, 24.7], [-75.8, -24.7]]
    .map(([x, z]) => ({ ...faixaEm(F, x, z, W, 8), k0: 3, k1: 12 }));
  const tuneis = [[0, -47], [0, 47]].map(([x, z]) => ({ ...faixaEm(F, x, z, 3.6, 2), k0: 0, k1: 5, yPiso: 0 }));
  const esc = (u, k0) => ({ ...faixaNoU(F, u, 1.2, 14), k0, k1: N - 1 });
  const uN = x => F.uDe(x, -60).u, uO = z => F.uDe(-80, z).u;
  const div = [uN(-37.6), uN(-25.3), uO(29.4), uO(17.9)];
  const A = arquibancada(O, F, {
    u0: 0, u1: 9, d0: 0, n: N, prof: 0.8, esp: 0.4, y0: 1.0, yBase: 0, par: 1.0, tinta: tArq, tintaParede: tMuro, semente: 7,
    topo: { larg: 0.55, par: 1.1, fachada: true, yChao: 0, corFachada: tMuro },
    vom: [...vom, ...tuneis], aberturas: tuneis.map(t => ({ ua: t.ua, ub: t.ub })),
    escadas: [
      esc(0, 6), esc(4.5, 6), esc(2.5, 0), esc(6.5, 0), esc(1.5, 0), esc(3.5, 0), esc(5.5, 0), esc(7.5, 0),
      ...vom.map(v => esc(v.u, 13))
    ],
    extras: [...div, 1.5, 3.5, 5.5, 7.5, uO(-24.7)]
  });
  for (const u of div) A.gradil(u);

  /* A PISTA cinza, as placas na beira do gramado (com o vão do túnel no meio do norte e do sul), o gramado */
  faixaDeAnel(O.m('piso'), F, -5.2, 0, 0, tPista, 4);
  placasNoAnel(O, F, -5.2, [faixaNoU(F, 0, 4.2, -5.2), faixaNoU(F, 4.5, 4.2, -5.2)]);
  gramado(O, F, -5.2, 'campo:20', { comp: 105, larg: 68, listra: 5.25, cores: ['#5a8538', '#669343'], falha: 0.35, linha: 0.9, semente: 202,
    tecnicas: [[-22, 34.6, -10.6, 39.8], [10.6, 34.6, 22, 39.8], [-20, -39.8, -10, -35.2], [11, -39.8, 21, -35.2]] });
  gol(O, -52.5, -1); gol(O, 52.5, 1);
  bandeirinhas(O, 52.5, 34);
  banco(O, -19.5, -10.6, -37.6, -38.6, false);
  banco(O, 12.4, 20.3, -37.6, -38.6, false);
  banco(O, -22, -10.6, 38.0, 40.2, true);
  banco(O, 10.6, 22, 38.0, 40.2, true, '#a11d2b');
  /* as quatro torres de luz, na quina de trás */
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) torreDeLuz(O, sx * 88.5, sz * 66.5, 42);

  /* O TERRENO: o muro (2,4 m) com os portões do leste e do oeste e as bilheterias,
     as escadas de fora no meio do norte e do sul, o asfalto de dentro, a calçada e a rua */
  const Mpar = O.m('parede'), Mp = O.m('pintura');
  for (const z of [-76.4, 75.6]) muro(Mpar, -102, z, 102, z, 0.3, 2.4, tMuro);
  for (const x of [-102, 102]) {
    muro(Mpar, x, -76.4, x, 75.6, 0.3, 2.4, tMuro, [[-7.5, 6.5]]);
    portao(O, false, x, -7.5, 6.5, 2.6, '#2f5f8a');
    for (const z of [-10.6, 9.6]) { const s = Math.sign(x); bloco(Mp, x - s * 3.2 - 1.5, x - s * 3.2 + 1.5, z - 1.5 + 0.5, z + 1.5 + 0.5, 0, 2.8, lin('#e9e4d6')); bloco(Mp, x - s * 3.2 - 1.8, x - s * 3.2 + 1.8, z - 1.3, z + 2.3, 2.8, 3.05, lin('#2f5f8a')); }
  }
  for (const s of [-1, 1]) {
    const z0 = s < 0 ? -75.5 : 73.7, z1 = s < 0 ? -73.7 : 75.5, zf = s < 0 ? z0 : z1;
    bloco(Mpar, -6, 6, z0, z1, 0, A.yn + 1.1, tMuro);
    bloco(Mp, -1.2, 1.2, zf - 0.05, zf + 0.05, 0, 2.3, lin('#2d2b29'));
  }
  const buraco = contornoDe(F, 28.0);
  chaoPlano(O.m('asfalto'), retangulo(-102, 102, -76.4, 75.6), [buraco], 0, lin('#e6e6e6'), 6);
  chaoPlano(O.m('piso'), retangulo(-105, 105, -79.4, 78.6), [retangulo(-102, 102, -76.4, 75.6)], 0.02, lin('#c9c6be'), 4);
  chaoPlano(O.m('asfalto'), retangulo(-116, 116, -90, 89), [retangulo(-105, 105, -79.4, 78.6)], -0.02, lin('#c4c4c4'), 6);

  /* OS SETORES: norte v2 | PM | m3; leste m1; sul e sudoeste m2; oeste PM, v1; noroeste v3 */
  const setores = camadaDosSetores(S, G, [
    { id: 'v2', arq: A, ua: 7.5, ub: div[0], faixa: 24 },
    { id: 'pm', arq: A, ua: div[0], ub: div[1] },
    { id: 'm3', arq: A, ua: div[1], ub: 10.5, faixa: 17.7 },
    { id: 'm1', arq: A, ua: 1.5, ub: 3.5, faixa: 24 },
    { id: 'm2', arq: A, ua: 3.5, ub: div[2], faixa: 17.7 },
    { id: 'pm', arq: A, ua: div[2], ub: div[3] },
    { id: 'v1', arq: A, ua: div[3], ub: uO(-24.7), faixa: 24 },
    { id: 'v3', arq: A, ua: uO(-24.7), ub: 7.5, faixa: 24 }
  ], 22);
  marcador(G, 'Entrada do mandante', '#1b7f3b', 99, 7, 0, 18);
  marcador(G, 'Entrada do visitante', '#c62828', -99, 7, 0, 18);
  return {
    aneis: [{ nome: 'Anel único', fileiras: N, degrau: '0,80 × 0,40 m', lugares: A.lugares() }],
    setores, livre: '', vomitorios: vom.length, alturaArq: A.yn + 1.1, luz: 'quatro torres de treliça de 42 m nas quinas'
  };
}

/* ======================================================
   O ESTÁDIO DE 40 MIL (nível 3)
   foto: 7,8 px por metro, campo de 105 × 68
   ====================================================== */
function montar40(O, S, G) {
  const F = anelFechado({ A0: 73.6, B0: 50.1, r0: 28, k: 0.8 });
  const tArq = lin('#cbb99a'), tMuro = lin('#d6cbb6'), tCorr = lin('#c7c0b2');
  const NI = 28, NS = 39;
  const yC = 1.2 + NI * 0.42;                        // o corredor entre os anéis
  /* os 29 vomitórios do anel de cima, onde a foto mostra (espelhados: a foto é simétrica) */
  const V = [[0, -89.6], [24, -88.4], [-24, -88.4], [47.7, -84.6], [-47.7, -84.6]];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const [x, z] of [[69.6, 77.7], [87, 67.1], [100.2, 52.1]]) V.push([sx * x, sz * z]);
  for (const sx of [-1, 1]) for (const [x, z] of [[108.3, -32.9], [112.8, -11.2], [112.8, 11.3], [108.4, 33.1]]) V.push([sx * x, z]);
  for (const x of [22, -22, 44.6, -44.6]) V.push([x, 90.5]);
  const dV = 24.4 + 14.5 * 0.8;
  const vom = V.map(([x, z]) => ({ ...faixaEm(F, x, z, 4.4, dV), k0: 10, k1: 18 })).sort((a, b) => a.u - b.u);
  /* as muretas: no meio de dois vomitórios, de cima a baixo nos dois anéis */
  const mur = vom.map((v, j) => { const w = vom[(j + 1) % vom.length]; let m = (v.u + w.u + (j === vom.length - 1 ? 9 : 0)) / 2; return m % 9; });
  const pontes = [[0, -52], [0, 52]].map(([x, z]) => faixaEm(F, x, z, 4.6, 0));
  const tuneis = [[76, 0], [-76, 0]].map(([x, z]) => ({ ...faixaEm(F, x, z, 5.0, 2), k0: 0, k1: 6, yPiso: 0 }));
  const escI = [...vom.map(v => ({ ...faixaNoU(F, v.u, 1.4, 11), k0: 0, k1: NI - 1 })), { ...faixaNoU(F, pontes[1].u, 1.4, 11), k0: 0, k1: NI - 1 }];
  /* as divisórias do dono: PM1 (anel de cima, oeste), PM2 (de baixo, oeste), PM3 (de baixo, sul), PM4 (de cima, sudoeste) */
  const u = (x, z) => F.uDe(x, z).u;
  const pm1 = [u(-110, 6.4), u(-110, -2.6)], pm2 = [u(-79.2, 30.8), u(-83, 20.8)], pm3 = [u(-43.3, 58.5), u(-55, 58)], pm4 = [u(-64.9, 82.2), u(-73.2, 80)];
  const vSO = u(-100.2, 52.1);
  const Ai = arquibancada(O, F, {
    u0: 0, u1: 9, d0: 0, n: NI, prof: 0.8, esp: 0.42, y0: 1.2, yBase: -2.4, par: 1.0, tinta: tArq, tintaParede: tMuro, semente: 9,
    topo: { larg: 2.0, par: 0, corPiso: tCorr },
    vom: tuneis, aberturas: [...tuneis.map(t => ({ ua: t.ua, ub: t.ub })), ...pontes],
    escadas: escI, muretas: mur.map(m => ({ u: m, k0: 0, k1: NI - 1 })),
    extras: [...pm2, ...pm3]
  });
  const As = arquibancada(O, F, {
    u0: 0, u1: 9, d0: 24.4, n: NS, prof: 0.8, esp: 0.52, y0: yC + 1.24, yBase: yC, par: 1.0, tinta: tArq, tintaParede: tMuro, semente: 10,
    topo: { larg: 2.15, par: 1.1, fachada: true, yChao: 0, corFachada: tMuro },
    vom, muretas: mur.map(m => ({ u: m, k0: 0, k1: NS - 1 })),
    escadas: [
      ...vom.map(v => ({ ...faixaNoU(F, v.u, 1.4, 30), k0: 0, k1: 9 })),
      ...vom.flatMap(v => [-1, 1].map(s => { const c = v.u + s * larguraU(F, v.u, dV, 2.2 + 0.6); return { ...faixaNoU(F, c, 1.0, dV), k0: 10, k1: NS - 1 }; }))
    ],
    extras: [...pm1, ...pm4, vSO, 1.5, 3.5]
  });
  for (const x of [...pm2, ...pm3]) Ai.gradil(x);
  for (const x of [...pm1, ...pm4]) As.gradil(x);

  /* O FOSSO: a faixa de grama gasta em volta do campo, a mureta de dentro,
     o fundo de terra 2,4 m abaixo; as pontes do norte e do sul (rampa) e
     as do leste e do oeste (os túneis dos jogadores, no nível do campo) */
  gramado(O, F, -9.4, 'campo:40', { comp: 105, larg: 68, listra: 5.25, cores: ['#4d7f30', '#5b8f3a'], falha: 0, linha: 0.95, semente: 404,
    tecnicas: [[-22, 35.4, -6.6, 40.4], [7.6, 35.4, 22.9, 40.4]] });
  faixaDeAnel(O.m('grama'), F, -9.4, -5.3, 0, lin('#b4ae84'), 6);
  const Mp = O.m('parede');
  const vaosDoFosso = [...pontes, ...tuneis];
  paredeDeAnel(Mp, F, -5.3, 0, 0.45, tMuro, -1, 4, vaosDoFosso);
  faixaDeAnel(Mp, F, -5.3, -4.9, 0.45, tMuro, 4, vaosDoFosso);
  paredeDeAnel(Mp, F, -4.9, -2.4, 0.45, tMuro, 1, 4, vaosDoFosso);
  faixaDeAnel(O.m('terra'), F, -4.9, 0, -2.4, lin('#8d7a62'), 6);
  const Mpi = O.m('piso');
  for (const p of [...pontes, ...tuneis]) {
    const rampa = pontes.includes(p), yF = rampa ? Ai.yk(0) - 0.21 : 0;
    const us = [p.ua, (p.ua + p.ub) / 2, p.ub];
    for (let j = 0; j < 2; j++) {
      const a = F.ponto(-5.3, us[j]), b = F.ponto(-5.3, us[j + 1]), c = F.ponto(0, us[j + 1]), d = F.ponto(0, us[j]);
      const A = [a[0], 0.02, a[1]], B = [b[0], 0.02, b[1]], C = [c[0], yF, c[1]], D = [d[0], yF, d[1]];
      Mpi.quad(A, B, C, D, pl(A, 4), pl(B, 4), pl(C, 4), pl(D, 4), tCorr, CIMA);
    }
    for (const uu of [p.ua, p.ub]) for (const [dA, dB] of [[-5.3, 0]]) {
      const a = F.ponto(dA, uu), b = F.ponto(dB, uu);
      Mp.quad([a[0], -2.4, a[1]], [b[0], -2.4, b[1]], [b[0], yF + 1.0, b[1]], [a[0], 1.0, a[1]], [0, 0], [1, 0], [1, 1], [0, 1], tMuro);
    }
  }
  gol(O, -52.5, -1); gol(O, 52.5, 1);
  bandeirinhas(O, 52.5, 34);
  banco(O, -22, -6.6, 41.2, 43.8, true);
  banco(O, 7.6, 22.9, 41.2, 43.8, true, '#a11d2b');

  /* POR FORA: a pista de ônibus em volta, a praça, a rua; os prédios de
     entrada do leste e do oeste e as torres de escada do norte e do sul */
  faixaDeAnel(O.m('asfalto'), F, 58.0, 64.0, 0, lin('#d2d2d2'), 6);
  chaoPlano(O.m('piso'), retangulo(-142, 142, -118, 118), [contornoDe(F, 64.0)], 0, lin('#cbc7bf'), 4);
  chaoPlano(O.m('asfalto'), retangulo(-156, 156, -131, 131), [retangulo(-142, 142, -118, 118)], 0, lin('#c4c4c4'), 6);
  const Mb = O.m('pintura'), CZ = lin('#d0c7b5'), ES = lin('#2c2a28');
  for (const s of [-1, 1]) {
    bloco(Mb, s > 0 ? 136 : -145, s > 0 ? 145 : -136, -12.5, 12.5, 0, 9, CZ);
    for (const z of [-8, 0, 8]) bloco(Mb, s > 0 ? 135.9 : -136.1, s > 0 ? 136.1 : -135.9, z - 1.4, z + 1.4, 0, 2.6, ES);
    bloco(Mb, s > 0 ? 131.8 : -136.2, s > 0 ? 136.2 : -131.8, -2.2, 2.2, 7.4, 9, CZ);
    for (const x of [-8.8, 4.6]) {
      const z0 = s > 0 ? 108.2 : -113.5, z1 = s > 0 ? 113.5 : -108.2, zf = s > 0 ? z1 : z0;
      bloco(Mb, x, x + 4.2, z0, z1, 0, 3.2, CZ);
      bloco(Mb, x - 0.3, x + 4.5, z0 - 0.3, z1 + 0.3, 3.2, 3.45, lin('#2f5f8a'));
      for (const xx of [x + 0.5, x + 2.4]) bloco(Mb, xx, xx + 1.3, zf - 0.05, zf + 0.05, 1.0, 2.1, ES);
    }
  }

  /* OS SETORES (a imagem do dono do nível 3): em cima, m2 no noroeste até
     a PM1, v2 e v1 no sudoeste com a PM4, m1 no leste; embaixo, a PM2, o
     v3 no sudoeste e a PM3 */
  const setores = camadaDosSetores(S, G, [
    { id: 'm2', arq: As, ua: pm1[1], ub: 9, faixa: 30 },
    { id: 'pm', arq: As, ua: pm1[0], ub: pm1[1] },
    { id: 'v2', arq: As, ua: vSO, ub: pm1[0], faixa: 30 },
    { id: 'v1', arq: As, ua: pm4[1], ub: vSO, faixa: 22 },
    { id: 'pm', arq: As, ua: pm4[0], ub: pm4[1] },
    { id: 'm1', arq: As, ua: 1.5, ub: 3.5, faixa: 30 },
    { id: 'pm', arq: Ai, ua: pm2[0], ub: pm2[1] },
    { id: 'v3', arq: Ai, ua: pm3[1], ub: pm2[0], faixa: 30 },
    { id: 'pm', arq: Ai, ua: pm3[0], ub: pm3[1] }
  ], 30);
  marcador(G, 'Túnel do mandante', '#1b7f3b', 116.5, 40, -52.7, 22);
  marcador(G, 'Túnel do visitante', '#c62828', -93.8, 40, 77.5, 22);
  return {
    aneis: [{ nome: 'Anel de baixo', fileiras: NI, degrau: '0,80 × 0,42 m', lugares: Ai.lugares() },
            { nome: 'Anel de cima', fileiras: NS, degrau: '0,80 × 0,52 m', lugares: As.lugares() }],
    setores, livre: '', vomitorios: vom.length, alturaArq: As.yn + 1.1, luz: 'nenhuma (a foto não mostra torre nem refletor)',
    aviso: 'Na imagem do dono, o anel de baixo do norte também está escrito "VISITANTE 3º ESCALÃO" (em maiúscula); o protótipo põe o 3º escalão visitante no sudoeste, que é o que vale aqui.'
  };
}

/* ======================================================
   OS TRÊS, pro catálogo
   ====================================================== */
export const ESTADIOS_JOGO = {
  'estadio-10': { id: 'estadio-10', nome: 'Estádio de 10 mil', nivel: 1, mil: 10000, foto: 'estadio_10', montar: montar10,
    nota: 'O municipal: arquibancada reta no norte, a do leste e sul em L, o túnel do visitante e o muro caiado.' },
  'estadio-20': { id: 'estadio-20', nome: 'Estádio de 20 mil', nivel: 2, mil: 20000, foto: 'estadio_20', montar: montar20,
    nota: 'O anel único bege com 8 vomitórios, a pista, as placas e as quatro torres de luz.' },
  'estadio-40': { id: 'estadio-40', nome: 'Estádio de 40 mil', nivel: 3, mil: 40000, foto: 'estadio_40', montar: montar40,
    nota: 'A tigela de dois anéis: o fosso, 29 vomitórios em cima, as muretas em blocos e a pista de ônibus.' }
};
/* monta um dos três: o grupo em metros (com a camada `setores` dentro) e a ficha */
export function montarEstadioJogo(id) {
  const E = ESTADIOS_JOGO[id];
  const grupo = new THREE.Group(), setores = new THREE.Group();
  grupo.name = E.nome; setores.name = 'setores';
  const O = novaObra(), S = novaObra();
  const info = E.montar(O, S, setores);
  O.fechar(grupo); S.fechar(setores, false);
  grupo.add(setores);
  let tri = 0, malhas = 0;
  grupo.traverse(o => { if (o.isMesh && o.parent === grupo) { tri += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3; malhas++; } });
  const caixa3 = new THREE.Box3();
  for (const o of grupo.children) if (o.isMesh) caixa3.expandByObject(o);
  const tam = caixa3.getSize(new THREE.Vector3());
  info.lugares = info.aneis.reduce((s, a) => s + a.lugares, 0);
  Object.assign(info, { id, nome: E.nome, nivel: E.nivel, triangulos: Math.round(tri), malhas, planta: [tam.x, tam.z], altura: caixa3.max.y });
  return { grupo, info };
}
/* O .GLB: a cópia sem os nomes (sprite não vai), com material PBR fosco
   (o Lambert sai metálico no exportador), em metros */
const PBR = new Map();
export async function glbDoEstadio(obj) {
  const { GLTFExporter } = await import('../../vendor/three/GLTFExporter.js');
  const copia = obj.clone(true);
  const tirar = [];
  copia.traverse(o => {
    if (o.isSprite) { tirar.push(o); return; }
    if (!o.isMesh) return;
    const m = o.material;
    if (!PBR.has(m)) {
      const p = new THREE.MeshStandardMaterial({ name: m.name, map: m.map || null, color: m.color ? m.color.clone() : 0xffffff, vertexColors: !!m.vertexColors,
        roughness: m.name === 'vidro' ? 0.1 : 0.92, metalness: 0, transparent: !!m.transparent, opacity: m.opacity ?? 1, alphaTest: m.alphaTest || 0, side: m.side,
        emissive: m.emissive ? m.emissive.clone() : 0x000000, emissiveMap: m.emissiveMap || null, emissiveIntensity: m.emissiveIntensity ?? 1 });
      PBR.set(m, p);
    }
    o.material = PBR.get(m);
  });
  for (const o of tirar) o.parent.remove(o);
  return new Promise((ok, erro) => new GLTFExporter().parse(copia, ok, erro, { binary: true, onlyVisible: true }));
}
