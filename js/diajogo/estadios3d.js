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
     blocos, a pista de ônibus em volta e as bilheterias do norte e do
     sul. (Os prédios de entrada do leste e do oeste da foto saíram:
     tapavam o portão 1, o 2 e o letreiro.)

   NO JOGO os três são menores que a foto (o TAMANHO DE JOGO, nos anéis:
   G10, G20, G40), pra caber no mapa da cidade: o campo de 46 × 30 no de
   10 e de 56 × 36 no de 20 e no de 40, a pista, o fosso e as margens
   estreitos, 22 fileiras no de 20; o de 40 tem 15 embaixo e 15 em cima,
   12 vomitórios em cima (dos 29 da foto), o corredor de cima debaixo
   do anel de cima e as escadas internas que sobem do corredor do chão
   pra ele. O degrau, o corredor, o vomitório, o portão, a escada e a
   catraca são do tamanho de gente.

   POR DENTRO, nos três: o CORREDOR debaixo da arquibancada (o de 40 mil
   tem dois, o do chão e o de cima, ligados pelas escadas internas),
   onde a torcida anda, compra e briga longe da arquibancada — o piso,
   o teto, os pilares, os balcões do comércio, a barra na cor de quem
   usa o trecho e o gradil do chão ao teto onde o dono pôs divisória;
   o VOMITÓRIO, o único jeito de ir do corredor pra arquibancada (em
   vala no de 10 mil, com túnel e escada no de 20 e no de 40); e as
   TRÊS ENTRADAS DA RUA — portão 1 e 2 do
   mandante, portão 3 do visitante —, cada uma com catraca, placa e a
   porta que dá no trecho do corredor do lado dela. A vista em corte
   (`cortarEstadio`) tira o teto do corredor pra ver tudo isso de cima.

   POR FORA: no de 20 e no de 40 mil, a FACHADA de concreto aparente —
   o pilar a cada 6 m, a faixa de cada laje, o cobogó entre eles, o
   embasamento e a cimalha —, o LETREIRO com o nome do estádio em cima
   do portão 1 (e no oeste) e, em cada um dos três portões, o PÓRTICO:
   os pilares, a verga com o setor, a marquise com a barra na cor do
   lado e a placa do portão em cima, e a FILA com a grade de contenção.
   No de 10 mil, o muro caiado com a barra azul, o nome pintado e o
   ARCO do portão 1 com o nome. O nome vem de quem monta (`opc.nome`,
   o do estádio da praça); sem ele, o de fábrica. No mapa da cidade
   (`opc.mapa`) o estádio sai sem a camada dos setores e sem a rua de
   fora: o terreno (`info.terreno`) encosta na rua do mapa, com o
   portão 1 no +x.

   OS SETORES do dono (mandante 1º/2º/3º escalão, visitante 1º/2º/3º,
   a PM) vão numa camada à parte — o grupo `setores`, com a cor por
   cima do degrau, o nome, a faixa de cada escalão, o nome de cada
   portão e a cor de cada trecho do corredor — que liga e desliga. As divisórias (o gradil que o dono
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
/* A FACHADA: 12 m × dois andares (dois vãos de 6 m entre pilares). O
   pilar, a faixa da laje, o embasamento e a cimalha são de verdade
   (fachadaDetalhada); aqui fica o que vai entre eles: a viga da laje (o
   pé do andar) com a sombra embaixo dela, o painel de concreto com a
   junta da fôrma a cada 60 cm e, um andar sim, um não, o COBOGÓ (a
   grelha de furos de 20 cm a cada 30, com a moldura) e o BRISE (as
   lâminas deitadas com a sombra entre elas), com o escorrido da chuva
   embaixo. O canvas é de cabeça pra baixo: a linha de baixo é o piso do
   andar do cobogó; o andar de 6 m aqui estica pro andar de cada estádio. */
function pintarFachada() {
  const W = 1024, H = 1024, c = tela(W, H), pxm = W / 12, pym = H / 12;
  const n = ruido(W, H, [[128, 10], [32, 6], [4, 5]], sorteio(71));
  const e = ruido(W, H, [[8, 16, 220]], sorteio(72));
  const ctx = pixels(c, (i, x, y) => {
    const xm = (x / pxm) % 6, ym = ((H - 1 - y) / pym) % 6;
    let v = 196 + n[i] + Math.min(0, e[i]) * 1.1;
    if (ym < 0.6) v += 12;
    else if (ym < 0.68) v -= 30;
    else if ((ym - 0.68) % 0.6 < 0.025) v -= 9;
    if (xm < 0.45 || xm > 5.55) v -= 12;
    return [cl(v + 3, 0, 255), cl(v + 1, 0, 255), cl(v - 3, 0, 255)];
  });
  /* metros acima do piso do andar k (0: o do cobogó, 1: o do brise) → linha do canvas */
  const Y = (m, k) => H - (k * 6 + m) * pym;
  const escorrido = (xa, xb, yb, ate) => {
    const g = ctx.createLinearGradient(0, yb, 0, ate);
    g.addColorStop(0, 'rgba(66,60,52,0.26)'); g.addColorStop(1, 'rgba(66,60,52,0)');
    ctx.fillStyle = g; ctx.fillRect(xa + 8, yb, xb - xa - 16, ate - yb);
  };
  for (const x0 of [0, 6]) {
    /* o cobogó */
    let xa = (x0 + 1.0) * pxm, xb = (x0 + 5.0) * pxm, ya = Y(4.3, 0), yb = Y(1.3, 0);
    const m = 0.12 * pxm;
    escorrido(xa, xb, yb, Y(0.72, 0));
    ctx.fillStyle = '#e6e0d2'; ctx.fillRect(xa - m, ya - m, xb - xa + 2 * m, yb - ya + 2 * m);
    ctx.fillStyle = 'rgba(96,90,80,0.9)'; ctx.fillRect(xa - m, yb + m, xb - xa + 2 * m, 0.05 * pym);
    const p = 0.3 * pxm, f = 0.2 * pxm, py = 0.3 * pym, fy = 0.2 * pym;
    for (let yy = ya + 0.05 * pym; yy + fy <= yb + 0.5; yy += py) for (let xx = xa + 0.05 * pxm; xx + f <= xb + 0.5; xx += p) {
      ctx.fillStyle = '#34312c'; ctx.fillRect(xx, yy, f, fy);
      ctx.fillStyle = 'rgba(255,250,240,0.22)'; ctx.fillRect(xx, yy + fy - 2, f, 2);
    }
    /* o brise: 12 lâminas deitadas no vão escuro, a de cima clara e a sombra embaixo de cada uma */
    xa = (x0 + 0.8) * pxm; xb = (x0 + 5.2) * pxm; ya = Y(4.7, 1); yb = Y(1.0, 1);
    escorrido(xa, xb, yb, Y(0.72, 1));
    ctx.fillStyle = '#e6e0d2'; ctx.fillRect(xa - m, ya - m, xb - xa + 2 * m, yb - ya + 2 * m);
    ctx.fillStyle = '#2f2c28'; ctx.fillRect(xa, ya, xb - xa, yb - ya);
    const passo = (yb - ya) / 12;
    for (let k = 0; k < 12; k++) {
      const y = ya + k * passo;
      ctx.fillStyle = '#d8d1c2'; ctx.fillRect(xa, y, xb - xa, passo * 0.58);
      ctx.fillStyle = '#f1ece1'; ctx.fillRect(xa, y, xb - xa, 2);
      ctx.fillStyle = 'rgba(40,36,32,0.55)'; ctx.fillRect(xa, y + passo * 0.58, xb - xa, passo * 0.14);
    }
    ctx.fillStyle = 'rgba(96,90,80,0.9)'; ctx.fillRect(xa - m, yb + m, xb - xa + 2 * m, 0.05 * pym);
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
/* AS PLACAS ESCRITAS (o portão, o setor, o balcão do corredor, o
   vomitório, a bilheteria): uma folha de 2 × 10 */
const SINAIS = [
  ['PORTÃO 1 · MANDANTE', '#1b6e36', '#ffffff'], ['PORTÃO 2 · MANDANTE', '#1b6e36', '#ffffff'], ['PORTÃO 3 · VISITANTE', '#b3261e', '#ffffff'],
  ['LANCHES', '#e65100', '#ffffff'], ['BAR', '#5e2a84', '#ffffff'], ['CHURRASQUINHO', '#9f1c1c', '#ffffff'], ['PASTEL', '#f2b705', '#2b1d00'],
  ['ÁGUA · REFRIGERANTE', '#0b67a8', '#ffffff'], ['CACHORRO-QUENTE', '#c2410c', '#ffffff'], ['SORVETE', '#b0226b', '#ffffff'],
  ['BANHEIRO', '#37474f', '#ffffff'], ['VOMITÓRIO', '#263238', '#f2b705'], ['SETOR VISITANTE', '#b3261e', '#ffffff'], ['SETOR MANDANTE', '#1b6e36', '#ffffff'],
  ['PM', '#1f3f9a', '#ffffff'], ['SAÍDA', '#2e7d32', '#ffffff'], ['BILHETERIA', '#0b4f8a', '#ffffff'], ['CORREDOR · VOMITÓRIOS', '#263238', '#f2b705'],
  ['ESCADA · ANEL SUPERIOR', '#263238', '#f2b705']
];
const FILAS_SINAIS = 10;
const SINAL = Object.fromEntries(SINAIS.map((x, i) => [x[0], i]));
const VENDAS = ['LANCHES', 'BAR', 'CHURRASQUINHO', 'PASTEL', 'ÁGUA · REFRIGERANTE', 'CACHORRO-QUENTE', 'SORVETE', 'BANHEIRO'].map(n => SINAL[n]);
function pintarSinais() {
  const W = 1024, c = tela(W, FILAS_SINAIS * 128), ctx = c.getContext('2d');
  SINAIS.forEach(([txt, fundo, letra], i) => {
    const x = (i % 2) * 512, y = Math.floor(i / 2) * 128;
    ctx.fillStyle = fundo; ctx.fillRect(x, y, 512, 128);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 6; ctx.strokeRect(x + 9, y + 9, 494, 110);
    ctx.fillStyle = letra; ctx.font = 'bold 54px Arial, Helvetica, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x + 256, y + 66, 468);
  });
  return virarTextura(c, { repete: false });
}
/* a célula k da folha: [u0, v0, u1, v1] */
const celulaDoSinal = k => { const col = k % 2, fil = Math.floor(k / 2); return [col * 0.5 + 0.004, 1 - (fil + 1) / FILAS_SINAIS + 0.004, col * 0.5 + 0.496, 1 - fil / FILAS_SINAIS - 0.004]; };
const PINTORES = {
  concreto: pintarConcreto, parede: pintarParede, piso: pintarPiso, grama: pintarGrama, terra: pintarTerra,
  asfalto: pintarAsfalto, gradil: pintarGradil, rede: pintarRede, trelica: pintarTrelica, placas: pintarPlacas,
  refletor: pintarRefletor, fachada: pintarFachada, boca: pintarBoca, sinais: pintarSinais
};
function tex(nome) { return TEX[nome] || (TEX[nome] = PINTORES[nome]()); }

/* O GRAMADO de cada estádio, com as listras do corte, a falha e as
   linhas (regra: 16,5 m de área, 5,5 de pequena área, 9,15 de círculo,
   pênalti a 11 m, gol de 7,32). `c`: a caixa do gramado em metros
   (x0..x1, z0..z1), o campo (comp × larg), a listra, as duas cores,
   quanto de falha (0 a 1), a força da linha e as áreas técnicas. */
function pintarCampo(c) {
  /* `e`: a escala das marcas (as áreas, o círculo, o pênalti) no campo menor que o de regra */
  const L = c.x1 - c.x0, A = c.z1 - c.z0, pxm = Math.min(16, 2048 / Math.max(L, A)), e = Math.min(1, c.comp / 105, c.larg / 68);
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
  arco(0, 0, 9.15 * e, 0, Math.PI * 2); marca(0, 0);
  const aa = Math.acos(5.5 / 9.15);
  for (const s of [-1, 1]) {
    ret(s * C, -20.16 * e, s * (C - 16.5 * e), 20.16 * e);
    ret(s * C, -9.16 * e, s * (C - 5.5 * e), 9.16 * e);
    marca(s * (C - 11 * e), 0);
    if (s > 0) arco(C - 11 * e, 0, 9.15 * e, Math.PI - aa, Math.PI + aa); else arco(-C + 11 * e, 0, 9.15 * e, -aa, aa);
    for (const t of [-1, 1]) arco(s * C, t * Lg, e, 0, Math.PI * 2);
  }
  /* as áreas técnicas, tracejadas */
  ctx.setLineDash([0.6 * pxm, 0.5 * pxm]);
  for (const [xa, za, xb, zb] of c.tecnicas || []) ret(xa, za, xb, zb);
  ctx.setLineDash([]);
  /* o canto de fora do campo é redondo: o que sobra da caixa não aparece */
  return virarTextura(cv, { repete: false });
}

/* O NOME DO LETREIRO: em maiúscula, com o acento que falta na planilha
   (dados/estadios.js vem sem alguns) e "ESTÁDIO" na frente de quem não é
   estádio nem arena ("DO" nos apelidos que pedem) */
const ACENTOS = [['ESTADIO', 'ESTÁDIO'], ['CENTENARIO', 'CENTENÁRIO'], ['GREMIO', 'GRÊMIO'], ['MANGUEIRAO', 'MANGUEIRÃO'], ['MINEIRAO', 'MINEIRÃO'],
  ['SAO', 'SÃO'], ['QUIMICA', 'QUÍMICA'], ['MENDONCA', 'MENDONÇA'], ['MOCA', 'MOÇA'], ['ANTONIO', 'ANTÔNIO'], ['INDEPENDENCIA', 'INDEPENDÊNCIA'], ['KRUGER', 'KRÜGER']];
const COM_DO = ['MORUMBI', 'MARACANÃ', 'ARRUDA', 'CANINDÉ', 'JUNCO'];
/* só a maiúscula com o acento (a etiqueta do estádio na planta usa esta) */
export function nomeComAcento(nome) {
  let t = ' ' + String(nome || '').trim().replace(/\s+/g, ' ').toUpperCase() + ' ';
  for (const [a, b] of ACENTOS) t = t.split(' ' + a + ' ').join(' ' + b + ' ');
  return t.trim();
}
export function nomeDoLetreiro(nome) {
  const t = nomeComAcento(nome);
  if (COM_DO.includes(t)) return 'ESTÁDIO DO ' + t;
  return /^(ESTÁDIO|ARENA) /.test(t) || / (ARENA|PARQUE)$/.test(t) ? t : 'ESTÁDIO ' + t;
}
/* AS LETRAS DO LETREIRO, recortadas: a face e (com `sombra`) a espessura
   mais escura, pra baixo e pro lado; o nome comprido aperta na largura
   (até 3072 px). `aspecto` é a largura sobre a altura. */
const LETREIROS = new Map();
function pintarLetreiro(texto, cor, sombra) {
  const H = 192, fonte = '900 150px "Arial Black", "Arial", "Helvetica", sans-serif';
  const m = tela(4, 4).getContext('2d');
  m.font = fonte;
  const w = Math.ceil(m.measureText(texto).width) + 48, W = Math.max(64, Math.min(3072, w)), esc = Math.min(1, (W - 48) / Math.max(1, w - 48));
  const c = tela(W, H), ctx = c.getContext('2d');
  ctx.font = fonte; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.setTransform(esc, 0, 0, 1, W / 2, H / 2 + 6);
  if (sombra) { ctx.fillStyle = sombra; for (let k = 7; k >= 1; k--) ctx.fillText(texto, k * 0.9, k * 0.9); }
  ctx.fillStyle = cor; ctx.fillText(texto, 0, 0);
  return { mapa: virarTextura(c, { repete: false, alfa: true }), aspecto: W / H };
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
  refletor: 'refletores', pintura: 'pintura', lona: 'lona', vidro: 'vidro', nariz: 'faixa_branca',
  corr_piso: 'corredor_piso', corr_parede: 'corredor_paredes', corr_teto: 'corredor_teto', sinais: 'placas_escritas', lampada: 'luminarias',
  braco: 'bracos_da_catraca'
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
    nariz: () => L({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }),
    corr_piso: () => L({ map: tex('piso'), vertexColors: true }),
    corr_parede: () => L({ map: tex('parede'), vertexColors: true, side: THREE.DoubleSide }),
    /* o teto do corredor não pega sol: um pouco de luz própria (as luminárias acesas) */
    corr_teto: () => L({ map: tex('parede'), vertexColors: true, emissive: 0x57544c }),
    lampada: () => L({ color: 0xfffaf0, emissive: 0xfff1d0, emissiveIntensity: 0.9 }),
    /* o braço da catraca gira: quem anda (o boneco no cenário) passa por ele */
    braco: () => Object.assign(L({ vertexColors: true }), { userData: { semRisco: true } }),
    sinais: () => L({ map: tex('sinais'), side: THREE.DoubleSide })
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
        malha.name = k.startsWith('setor:') ? 'setor' : k.startsWith('campo:') ? 'gramado' : k.startsWith('letreiro:') ? 'letreiro' : NOMES[k] || k;
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
  function dDe(x, z) { let lo = -60, hi = 220; for (let j = 0; j < 50; j++) { const m = (lo + hi) / 2; if (dentroDe(x, z, m)) hi = m; else lo = m; } return (lo + hi) / 2; }
  return { fechado: true, n: 9, ponto, uDe, dDe, dentroDe, amostras, geo };
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
  return { fechado: false, n: T.length, ponto, uDe, dDe: (x, z) => uDe(x, z).d, amostras };
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
   O QUADRO LOCAL: um eixo reto (o salão do portão, o pórtico, a placa) que nasce
   em P0 (no chão, na face de fora) e entra no rumo w; L(s, t, y) é o
   ponto a s metros pra dentro e t pro lado (o t cresce à direita de quem
   entra), e dir(ds, dt) um rumo no mundo
   ====================================================== */
function quadro(P0, w) {
  const l = Math.hypot(w[0], w[1]), W = [w[0] / l, w[1] / l], tv = [-W[1], W[0]];
  return { P0, w: W, tv, L: (s, t, y) => [P0[0] + W[0] * s + tv[0] * t, y, P0[1] + W[1] * s + tv[1] * t],
    dir: (ds, dt) => [W[0] * ds + tv[0] * dt, 0, W[1] * ds + tv[1] * dt] };
}
/* caixa no quadro: s0..s1 × t0..t1 × y0..y1 (sem a face de baixo) */
function caixaL(M, Q, s0, s1, t0, t1, y0, y1, cor = BRANCO, esc = 2) {
  const cs = [[s0, t0], [s1, t0], [s1, t1], [s0, t1]];
  const b = cs.map(([s, t]) => Q.L(s, t, y0)), a = cs.map(([s, t]) => Q.L(s, t, y1)), C = Q.L((s0 + s1) / 2, (t0 + t1) / 2, 0);
  M.quad(a[0], a[1], a[2], a[3], pl(a[0], esc), pl(a[1], esc), pl(a[2], esc), pl(a[3], esc), cor, CIMA);
  for (let j = 0; j < 4; j++) {
    const k = (j + 1) % 4, L = j % 2 === 0 ? Math.abs(s1 - s0) : Math.abs(t1 - t0);
    M.quad(b[j], b[k], a[k], a[j], [0, y0 / esc], [L / esc, y0 / esc], [L / esc, y1 / esc], [0, y1 / esc], cor, [(b[j][0] + b[k][0]) / 2 - C[0], 0, (b[j][2] + b[k][2]) / 2 - C[2]]);
  }
}
/* parede no quadro, reta de (s0, t0) a (s1, t1), de y0 a y1, virada pro rumo (ds, dt) */
function paredeL(M, Q, s0, t0, s1, t1, y0, y1, cor, ds, dt, esc = 4) {
  if (y1 - y0 < 1e-3) return;
  const L = Math.hypot(s1 - s0, t1 - t0);
  M.quad(Q.L(s0, t0, y0), Q.L(s1, t1, y0), Q.L(s1, t1, y1), Q.L(s0, t0, y1), [0, y0 / esc], [L / esc, y0 / esc], [L / esc, y1 / esc], [0, y1 / esc], cor, Q.dir(ds, dt));
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
  for (const e of (c.topo && c.topo.vaos) || []) extras.push(e.ua, e.ub);
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
        if (t.fachada) { const vao = (t.vaos || []).find(e => naFaixa(e, meio(i))); paredeV(O.m('fachada'), dp + 0.25, vao ? t.yChao + vao.h : t.yChao, ytop, i, t.corFachada || tParede, 1, 12, 2 * (t.andar || 6), t.yChao); }
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
  /* OS VOMITÓRIOS. O dos jogadores (sem `tunel`): o chão escuro e a boca
     pintada no fundo do poço. Com TÚNEL (o de 20 e o de 40): o piso do
     poço fica na altura da fileira da frente, o fundo abre na boca do
     túnel, e o túnel desce a escada por baixo da arquibancada até a
     parede de dentro do corredor — sobe-se de frente pro campo. Em VALA
     (o de 10, baixo demais pra túnel): o poço vai até o corredor, a céu
     aberto, e a escada sobe do chão do corredor até a fileira da frente.
     Em volta, a mureta dos lados (1 m acima do degrau) e a de trás. */
  const Mesc = O.m('escuro'), Mboca = O.m('boca'), Mpv = O.m('piso'), Mteto = O.m('corr_teto');
  const PISO_VOM = vezes(tinta, 0.8), TETO = lin('#cbc6bc'), ESPELHO = 0.18, PISADA = 0.28;
  const tetoH = (M, dA, dB, y, i, cor) => {
    const A = anel(dA), B = anel(dB), a = P(A[i], y), b = P(A[i + 1], y), cc = P(B[i + 1], y), d = P(B[i], y);
    M.quad(a, b, cc, d, pl(a, 4), pl(b, 4), pl(cc, 4), pl(d, 4), cor, [0, -1, 0]);
  };
  const noVom = v => { const r = []; for (let i = 0; i < us.length - 1; i++) if (naFaixa(v, meio(i))) r.push(i); return r; };
  /* a escada que desce pra fora de (dS, yA) até yB: espelho virado pra quem sobe */
  const escadaDesce = (iv, dS, yA, yB) => {
    const nE = Math.max(0, Math.round((yA - yB) / ESPELHO)), r = nE ? (yA - yB) / nE : 0;
    for (const i of iv) for (let j = 0; j < nE; j++) {
      const da = dS + j * PISADA, yH = yA - j * r;
      paredeV(Mdeg, da, yH - r, yH, i, vezes(tinta, 0.78), 1);
      pisoH(Mdeg, da, da + PISADA, yH - r, i, PISO_VOM);
    }
    const pf = [];
    for (let j = 0; j < nE; j++) { const da = dS + j * PISADA, yL = yA - (j + 1) * r; pf.push([da, yL], [da + PISADA, yL]); }
    return { dFim: dS + nE * PISADA, perfil: pf };
  };
  /* a lateral (um polígono no plano d × y), posta no u */
  const lateral = (u, pf) => {
    const tris = THREE.ShapeUtils.triangulateShape(pf.map(q => new THREE.Vector2(q[0], q[1])), []);
    const pt = q => { const x = fam.ponto(q[0], u); return [x[0], q[1], x[1]]; };
    for (const [a, b, cc] of tris) Mpar.tri(pt(pf[a]), pt(pf[b]), pt(pf[cc]), [pf[a][0] / 4, pf[a][1] / 4], [pf[b][0] / 4, pf[b][1] / 4], [pf[cc][0] / 4, pf[cc][1] / 4], tParede);
  };
  for (const v of lista('vom')) {
    const T = v.tunel, iv = noVom(v);
    const yP = v.yPiso ?? (v.k0 > 0 ? yk(v.k0 - 1) : c.yBase), dA = dk(v.k0), dB = dk(v.k1 + 1), yTopo = yk(v.k1);
    Object.assign(v, { yP, dA, dB });
    /* a mureta de trás, na fileira de trás do poço */
    if (v.k1 + 1 < n) for (const i of iv) {
      paredeV(Mpar, dB, yk(v.k1 + 1), yk(v.k1 + 1) + 1.0, i, tParede, -1);
      pisoH(Mpar, dB, dB + 0.15, yk(v.k1 + 1) + 1.0, i, tParede);
    }
    /* o contorno de cima da lateral do poço: 1 m acima de cada fileira dele, de trás pra frente */
    const cima = []; for (let k = v.k1; k >= v.k0; k--) cima.push([dk(k + 1), yk(k) + 1.0], [dk(k), yk(k) + 1.0]);
    if (!T) {
      for (const i of iv) {
        pisoH(Mesc, dA, dB, yP, i, [0.9, 0.9, 0.9]);
        const A = anel(dB), q0 = A[i], q1 = A[i + 1];
        const w = v.ub - v.ua, f0 = (us[i] - v.ua) / w, f1 = (us[i + 1] - v.ua) / w;
        const fu = x => x < 0 ? x + 9 / w : x;
        Mboca.quad(P(q0, yP), P(q1, yP), P(q1, yTopo), P(q0, yTopo), [fu(f0), 0], [fu(f1), 0], [fu(f1), 1], [fu(f0), 1], BRANCO, [-(q0[2] + q1[2]), 0, -(q0[3] + q1[3])]);
      }
      for (const uu of [v.ua, v.ub]) lateral(uu, [[dA, yP], [dB, yP], ...cima]);
      continue;
    }
    if (T.tipo === 'vala') {
      const nE = Math.max(0, Math.round((yP - T.yC) / ESPELHO)), dS = dB - nE * PISADA;
      if (dS > dA + 1e-3) for (const i of iv) pisoH(Mpv, dA, dS, yP, i, PISO_VOM);
      const { perfil } = escadaDesce(iv, dS, yP, T.yC);
      if (yTopo > T.yC + T.hC) for (const i of iv) paredeV(Mpar, dB, T.yC + T.hC, yTopo, i, tParede, -1);
      for (const uu of [v.ua, v.ub]) lateral(uu, [[dA, yP], [dS, yP], ...perfil, ...cima]);
      continue;
    }
    /* túnel */
    const yT = yP + T.hT;
    for (const i of iv) pisoH(Mpv, dA, dB, yP, i, PISO_VOM);
    if (yTopo > yT) for (const i of iv) paredeV(Mpar, dB, yT, yTopo, i, tParede, -1);
    const { dFim, perfil } = escadaDesce(iv, dB, yP, T.yC);
    for (const i of iv) {
      if (T.dI > dFim + 1e-3) pisoH(Mpv, dFim, T.dI, T.yC, i, PISO_VOM);
      tetoH(Mteto, dB, T.dI, yT, i, TETO);
      if (yT > T.yC + T.hC) paredeV(Mpar, T.dI, T.yC + T.hC, yT, i, tParede, -1);
    }
    for (const uu of [v.ua, v.ub]) {
      lateral(uu, [[dA, yP], [dB, yP], ...cima]);
      lateral(uu, [[dB, yT], [dB, yP], ...perfil, [T.dI, T.yC], [T.dI, yT]]);
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
    const pf = perfil(), porta = lista('portasPonta').find(p => Math.abs(p.u - u) < 1e-6);
    if (porta) pf.push([porta.d1, yChao], [porta.d1, yChao + porta.h], [porta.d0, yChao + porta.h], [porta.d0, yChao]);
    const tris = THREE.ShapeUtils.triangulateShape(pf.map(q => new THREE.Vector2(q[0], q[1])), []);
    const e = 1e-3, qa = fam.ponto(d0, u - e), qb = fam.ponto(d0, u + e);
    const tg = [(qb[0] - qa[0]) * sinal, 0, (qb[1] - qa[1]) * sinal];
    const pt = q => { const s = fam.ponto(q[0], u); return [s[0], q[1], s[1]]; };
    for (const [a, b, cc] of tris) Mpar.tri(pt(pf[a]), pt(pf[b]), pt(pf[cc]), [pf[a][0] / 4, pf[a][1] / 4], [pf[b][0] / 4, pf[b][1] / 4], [pf[cc][0] / 4, pf[cc][1] / 4], tParede, tg);
  };
  if (!fam.fechado || c.u1 - c.u0 < 9 - 1e-6) { ponta(c.u0, -1); ponta(c.u1, 1); }
  for (const e of lista('cortes')) { ponta(e.ua, 1); ponta(e.ub, -1); }

  return {
    fam, c, us, n, dk, yk, dn, yn, vomitorios: lista('vom'),
    /* quantos vomitórios ligados ao corredor têm o meio no trecho */
    vomsEm(ua, ub) { const e = { ua, ub }; return lista('vom').filter(v => v.tunel && !v.servico && naFaixa(e, v.u ?? (v.ua + v.ub) / 2)).length; },
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
function faixaDeAnel(M, fam, dA, dB, y, cor, esc = 6, pula = [], u0 = 0, u1 = 9) {
  const us = fam.amostras(u0, u1, pula.flatMap(p => [p.ua, p.ub])), A = us.map(u => fam.ponto(dA, u)), B = us.map(u => fam.ponto(dB, u));
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
/* muro reto alinhado (de x0,z0 a x1,z1, um dos dois constante), com vãos
   [a, b] ao longo dele — [a, b, hv] é porta: o muro fica em cima, de hv
   pra cima (a verga) */
function muro(M, x0, z0, x1, z1, esp, h, cor, vaos = [], y0 = 0) {
  const emX = z0 === z1, a0 = emX ? Math.min(x0, x1) : Math.min(z0, z1), a1 = emX ? Math.max(x0, x1) : Math.max(z0, z1), fixo = emX ? z0 : x0;
  const cortes = [...vaos].sort((p, q) => p[0] - q[0]);
  let a = a0;
  const pedaco = (p, q, ya = y0) => { if (q - p < 0.01 || y0 + h - ya < 0.01) return; if (emX) bloco(M, p, q, fixo - esp / 2, fixo + esp / 2, ya, y0 + h, cor); else bloco(M, fixo - esp / 2, fixo + esp / 2, p, q, ya, y0 + h, cor); };
  for (const [p, q, hv] of cortes) { pedaco(a, Math.max(a, p)); if (hv != null) pedaco(p, q, y0 + hv); a = Math.max(a, q); }
  pedaco(a, a1);
}
/* o portão de gradil com o quadro pintado, de a até b ao longo do muro (x
   ou z fixo). `aberto` ±1 abre as duas folhas de giro pro lado do sinal
   (±x ou ±z); ±2 é o de correr aberto: a folha inteira corrida pra
   depois de b, rente ao muro, do lado do sinal */
function portao(O, emX, fixo, a, b, h, corQuadro, aberto = 0) {
  const Mg = O.m('gradil'), Mp = O.m('pintura'), C = lin(corQuadro), P = (s, y, f = fixo) => emX ? [s, y, f] : [f, y, s];
  const folha = (s0, f0, s1, f1) => { const L = Math.hypot(s1 - s0, f1 - f0); Mg.quad(P(s0, 0.05, f0), P(s1, 0.05, f1), P(s1, h, f1), P(s0, h, f0), [0, 0], [L / 2.5, 0], [L / 2.5, h / 2.5], [0, h / 2.5]); };
  if (!aberto) {
    folha(a, fixo, b, fixo);
    for (const s of [a, (a + b) / 2, b]) caixa(Mp, emX ? s : fixo, 0, emX ? fixo : s, 0.3, 0.3, h + 0.3, 0, C);
    if (emX) bloco(Mp, a, b, fixo - 0.06, fixo + 0.06, h, h + 0.12, C); else bloco(Mp, fixo - 0.06, fixo + 0.06, a, b, h, h + 0.12, C);
    return;
  }
  if (Math.abs(aberto) === 2) {
    const f = fixo + Math.sign(aberto) * 0.3;
    folha(b, f, 2 * b - a, f);
    for (const s of [a, b]) caixa(Mp, emX ? s : fixo, 0, emX ? fixo : s, 0.35, 0.35, h + 0.3, 0, C);
    return;
  }
  const L = (b - a) / 2, f1 = fixo + aberto * L;
  folha(a, fixo + aberto * 0.2, a, f1); folha(b, fixo + aberto * 0.2, b, f1);
  for (const s of [a, b]) caixa(Mp, emX ? s : fixo, 0, emX ? fixo : s, 0.35, 0.35, h + 0.3, 0, C);
}
/* gradil reto de (x0, z0) a (x1, z1), com poste a cada 2,5 m */
function gradilReto(O, x0, z0, x1, z1, y0, h) {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.5)), Mp = O.m('pintura'), POSTE = lin('#6d757b');
  O.m('gradil').quad([x0, y0, z0], [x1, y0, z1], [x1, y0 + h, z1], [x0, y0 + h, z0], [0, 0], [L / 2.5, 0], [L / 2.5, h / 2.5], [0, h / 2.5]);
  for (let j = 0; j <= n; j++) caixa(Mp, x0 + (x1 - x0) * j / n, y0, z0 + (z1 - z0) * j / n, 0.1, 0.1, h + 0.1, 0, POSTE);
}

/* ======================================================
   A FACHADA DE FORA. No de 20 e no de 40 mil, o concreto aparente em
   pórtico: o PILAR a cada 6 m, a FAIXA de cada laje, o EMBASAMENTO
   escuro embaixo e a CIMALHA em cima, com o cobogó pintado entre eles;
   o LETREIRO com o nome do estádio; e em cada portão o PÓRTICO — os
   dois pilares, a verga com a placa do setor, a marquise com a barra na
   cor do lado, a placa do portão em pé em cima dela e as luminárias
   embaixo — e a FILA: a grade de contenção em raias de 1 m. No de 10
   mil, o muro caiado ganha a barra azul, o capeamento, o nome pintado e
   o arco do portão 1.
   ====================================================== */
/* O RELEVO DA FACHADA da arquibancada A (a que tem `topo.fachada`). `c`:
   pilar [largura, fundo], portas (os planos das entradas: o pilar não
   cai no pórtico), pula (trechos de u sem relevo: a torre do meio do de
   20 mil), cor, corBase */
function fachadaDetalhada(O, A, c) {
  const fam = A.fam, t = A.c.topo, dF = A.dn + t.larg + 0.25, y0 = t.yChao, y1 = A.yn + t.par, andar = t.andar || 6;
  const Mw = O.m('parede'), COR = c.cor, [pw, pp] = c.pilar, pula = c.pula || [], portas = c.portas || [];
  const naFaixa = (e, u) => [u, u - 9, u + 9].some(x => x > e.ua && x < e.ub);
  const perto = (x, z) => portas.some(E => {
    const dx = x - E.Q.P0[0], dz = z - E.Q.P0[1];
    return Math.abs(dx * E.Q.w[0] + dz * E.Q.w[1]) < 4 && Math.abs(dx * E.Q.tv[0] + dz * E.Q.tv[1]) < E.hl + 1.9;
  });
  /* O PILAR a cada 6 m, contado do mesmo começo da textura (o comprimento
     no anel da fachada, pelas mesmas amostras): cai sempre na faixa
     escura pintada; vai do chão até a cimalha */
  const us = A.us, R = us.map(u => fam.ponto(dF, u)), len = comprimentos(R), yP = y1 - 1.3;
  let pilares = 0;
  for (let L = 0, i = 0; L < len[len.length - 1] - 1; L += 6) {
    while (i < len.length - 2 && len[i + 1] < L) i++;
    const f = (L - len[i]) / Math.max(1e-9, len[i + 1] - len[i]), a = R[i], b = R[i + 1];
    const x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
    if (perto(x, z) || pula.some(e => naFaixa(e, us[i] + (us[i + 1] - us[i]) * f))) continue;
    let nx = a[2] + (b[2] - a[2]) * f, nz = a[3] + (b[3] - a[3]) * f;
    const l = Math.hypot(nx, nz); nx /= l; nz /= l;
    caixa(Mw, x + nx * (pp / 2 - 0.05), y0, z + nz * (pp / 2 - 0.05), pw, pp, yP - y0, Math.atan2(nz, nx) + Math.PI / 2, COR, 4);
    pilares++;
  }
  /* a faixa corrida em volta (na reta, um pedaço só): a frente no anel dB,
     de ya a yb, o topo e (se pedir) o fundo até dentro da fachada e as
     costas (a cimalha, vista do corredor de cima) */
  const faixa = (dB, ya, yb, cor, vaos, fundo, costas) => {
    const fora = u => [...pula, ...vaos].some(e => naFaixa(e, u));
    const uu = fam.amostras(0, 9, [...pula, ...vaos].flatMap(e => [e.ua, e.ub]));
    const Fr = uu.map(u => fam.ponto(dB, u)), Tr = uu.map(u => fam.ponto(dF - 0.3, u)), Lf = comprimentos(Fr);
    const reto = j => { const a = Fr[j - 1], b = Fr[j], q = Fr[j + 1]; return Math.abs((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0])) < 1e-4 * Math.hypot(q[0] - a[0], q[1] - a[1]); };
    const P = (q, y) => [q[0], y, q[1]], chao = (q, y) => pl(P(q, y), 4);
    for (let i = 0; i < uu.length - 1;) {
      if (fora((uu[i] + uu[i + 1]) / 2)) { i++; continue; }
      let j = i + 1;
      while (j < uu.length - 1 && !fora((uu[j] + uu[j + 1]) / 2) && reto(j)) j++;
      const a = Fr[i], b = Fr[j], ta = Tr[i], tb = Tr[j];
      Mw.quad(P(a, ya), P(b, ya), P(b, yb), P(a, yb), [Lf[i] / 4, ya / 4], [Lf[j] / 4, ya / 4], [Lf[j] / 4, yb / 4], [Lf[i] / 4, yb / 4], cor, [a[2] + b[2], 0, a[3] + b[3]]);
      Mw.quad(P(ta, yb), P(tb, yb), P(b, yb), P(a, yb), chao(ta, yb), chao(tb, yb), chao(b, yb), chao(a, yb), cor, CIMA);
      if (fundo) Mw.quad(P(ta, ya), P(tb, ya), P(b, ya), P(a, ya), chao(ta, ya), chao(tb, ya), chao(b, ya), chao(a, ya), vezes(cor, 0.82), [0, -1, 0]);
      if (costas) Mw.quad(P(ta, y1), P(tb, y1), P(tb, yb), P(ta, yb), [0, 0], [1, 0], [1, 0.1], [0, 0.1], cor, [-(ta[2] + tb[2]), 0, -(ta[3] + tb[3])]);
      i = j;
    }
  };
  faixa(dF + 0.1, y0, y0 + 1.0, c.corBase, t.vaos || [], false, false);
  let faixas = 0;
  for (let y = y0 + andar; y < y1 - 1.6; y += andar, faixas++) faixa(dF + 0.22, y - 0.18, y + 0.18, COR, [], true, false);
  faixa(dF + 0.65, y1 - 1.3, y1 + 0.12, COR, [], true, true);
  return { pilares, faixas, andar };
}
/* O LETREIRO em pé no quadro Q, a face em s, centrado em t = 0: as letras
   de `alto` metros a partir de y0 (até `larg` de largura: o nome
   comprido fica mais baixo). Com `placa` (a cor), a placa atrás, `sai`
   metros pra fora do s, com `margem` em volta; sem ela, as letras são
   pintadas direto na parede. */
function letreiro(O, Q, s, texto, y0, alto, larg, c = {}) {
  const cor = c.cor || '#f6f3ea', sombra = c.sombra === undefined ? '#8e969d' : c.sombra, chave = 'letreiro:' + [texto, cor, sombra].join('|');
  if (!LETREIROS.has(chave)) LETREIROS.set(chave, pintarLetreiro(texto, cor, sombra));
  const L = LETREIROS.get(chave);
  O.proprio(chave, () => new THREE.MeshLambertMaterial({ name: 'letreiro', map: L.mapa, alphaTest: 0.5 }));
  const w = Math.min(larg, alto * L.aspecto), h = w / L.aspecto, ya = y0 + (alto - h) / 2, yb = ya + h;
  let sf = s;
  if (c.placa) {
    const m = c.margem ?? 0.45, sp = s - c.sai, ta = -w / 2 - 2 * m, tb = w / 2 + 2 * m, Mp = O.m('pintura');
    caixaL(Mp, Q, sp, s + 0.1, ta, tb, y0 - m, y0 + alto + m, c.placa);
    const f = [Q.L(sp, ta, y0 - m), Q.L(s, ta, y0 - m), Q.L(s, tb, y0 - m), Q.L(sp, tb, y0 - m)];
    Mp.quad(f[0], f[1], f[2], f[3], [0, 0], [1, 0], [1, 1], [0, 1], vezes(c.placa, 0.8), [0, -1, 0]);
    sf = sp;
  }
  const f = sf - 0.02;
  O.m(chave).quad(Q.L(f, -w / 2, ya), Q.L(f, w / 2, ya), Q.L(f, w / 2, yb), Q.L(f, -w / 2, yb), [0, 0], [1, 0], [1, 1], [0, 1], BRANCO, Q.dir(-1, 0));
  return { largura: w, altura: h };
}
/* A GRADE DE CONTENÇÃO da fila: de s0 a s1 no t, `h` de altura, o tubo
   em cima e um pé a cada 2,5 m */
function grade(O, Q, t, s0, s1, h) {
  const a = Q.L(s0, t, 0), b = Q.L(s1, t, 0), L = Math.abs(s1 - s0), sa = Math.min(s0, s1), sb = Math.max(s0, s1), Mp = O.m('pintura'), TUBO = lin('#8e969b');
  O.m('gradil').quad([a[0], 0.05, a[2]], [b[0], 0.05, b[2]], [b[0], h, b[2]], [a[0], h, a[2]], [0, 0], [L / 2.5, 0], [L / 2.5, 1], [0, 1]);
  caixaL(Mp, Q, sa, sb, t - 0.025, t + 0.025, h, h + 0.05, TUBO);
  const n = Math.max(1, Math.ceil(L / 2.5));
  for (let j = 0; j <= n; j++) { const s = sa + (sb - sa) * j / n; caixaL(Mp, Q, s - 0.03, s + 0.03, t - 0.03, t + 0.03, 0, h, TUBO); }
}
/* O PÓRTICO DO PORTÃO na fachada ou no muro (o plano da entrada E, a porta
   de `h` de altura). `c`: sai (quanto a marquise sai), lado, placa (a do
   portão), setor (a da verga), fila [s0, s1] (pra fora, negativos) e cor.
   Os pilares ficam 2 cm pra fora da parede do salão (face nenhuma
   coincide) e entram 30 cm na fachada (na curva a de trás some nela). */
function porticoDoPortao(O, E, c) {
  const { Q, hl } = E, h = c.h, esp = 0.28, yM = h + 1.1, sai = c.sai, T = hl + 1.6;
  const Mw = O.m('parede'), Mp = O.m('pintura'), CONC = c.cor || lin('#dcd6ca'), LADO = lin(c.lado === 'visitante' ? '#b3261e' : '#1b6e36');
  caixaL(Mw, Q, -0.9, 0.3, hl + 0.02, hl + 1.0, 0, yM - esp, CONC, 4);
  caixaL(Mw, Q, -0.9, 0.3, -hl - 1.0, -hl - 0.02, 0, yM - esp, CONC, 4);
  caixaL(Mw, Q, -0.45, 0.3, -hl - 0.02, hl + 0.02, h, yM - esp, CONC, 4);
  const vb = [Q.L(-0.45, -hl, h), Q.L(0, -hl, h), Q.L(0, hl, h), Q.L(-0.45, hl, h)];
  Mw.quad(vb[0], vb[1], vb[2], vb[3], pl(vb[0], 4), pl(vb[1], 4), pl(vb[2], 4), pl(vb[3], 4), vezes(CONC, 0.85), [0, -1, 0]);
  /* a marquise: a laje, o forro, a barra da frente na cor do lado e as luminárias */
  caixaL(Mp, Q, -sai, 0.3, -T, T, yM - esp, yM, lin('#ece8df'));
  const fb = [Q.L(-sai, -T, yM - esp), Q.L(0, -T, yM - esp), Q.L(0, T, yM - esp), Q.L(-sai, T, yM - esp)];
  Mp.quad(fb[0], fb[1], fb[2], fb[3], [0, 0], [1, 0], [1, 1], [0, 1], lin('#d4d0c6'), [0, -1, 0]);
  paredeL(Mp, Q, -sai - 0.012, -T, -sai - 0.012, T, yM - esp + 0.05, yM - 0.05, LADO, -1, 0);
  for (const t of [-hl / 2, hl / 2]) { const p = Q.L(-sai / 2, t, yM - esp - 0.015); luminaria(O, p[0], p[1], p[2], Q.w[0], Q.w[1]); }
  /* a placa do portão em pé em cima da marquise, a do setor na verga */
  const w = Math.min(hl + 0.9, 3.4);
  placaSinal(O, Q, -sai + 0.35, -w, w, yM + 0.04, yM + 0.04 + w / 2, c.placa);
  if (c.setor != null) placaSinal(O, Q, -0.6, -1.3, 1.3, h + 0.09, h + 0.74, c.setor);
  /* a fila: raias de 1 m (um número ímpar: a do meio fica no eixo) */
  let raias = 0;
  if (c.fila) {
    raias = Math.max(1, Math.round(2 * hl)) | 1;
    for (let k = 0; k <= raias; k++) grade(O, Q, -hl + 2 * hl * k / raias, c.fila[0], c.fila[1], 1.1);
  }
  return { raias };
}
/* a faixa de pedestre atravessada (listras de 50 cm a cada metro, no rumo de quem anda) */
function faixaDePedestre(O, Q, s0, s1, t0, t1) {
  const M = O.m('pintura'), B = lin('#eeeee8');
  for (let t = t0; t + 0.5 <= t1 + 1e-6; t += 1.0) {
    const a = Q.L(s0, t, 0.02), b = Q.L(s1, t, 0.02), c = Q.L(s1, t + 0.5, 0.02), d = Q.L(s0, t + 0.5, 0.02);
    M.quad(a, b, c, d, [0, 0], [1, 0], [1, 1], [0, 1], B, CIMA);
  }
}
/* A BILHETERIA: a casinha (de s0 a s1 no quadro, t0 a t1; a frente em s0,
   virada pra −w), o telhado que sai na frente, as janelas com o balcão e
   a placa em cima */
function bilheteria(O, Q, s0, s1, t0, t1, h, corTeto = '#2f5f8a') {
  const Mp = O.m('pintura'), TETO = lin(corTeto), VIDRO = lin('#2a2c2e'), TAMPO = lin('#8a8f94');
  caixaL(Mp, Q, s0, s1, t0, t1, 0, h, lin('#e7e2d5'));
  caixaL(Mp, Q, s0 - 0.35, s1 + 0.1, t0 - 0.2, t1 + 0.2, h, h + 0.22, TETO);
  const r = [Q.L(s0 - 0.35, t0 - 0.2, h), Q.L(s0, t0 - 0.2, h), Q.L(s0, t1 + 0.2, h), Q.L(s0 - 0.35, t1 + 0.2, h)];
  Mp.quad(r[0], r[1], r[2], r[3], [0, 0], [1, 0], [1, 1], [0, 1], vezes(TETO, 0.7), [0, -1, 0]);
  const n = Math.max(1, Math.round((t1 - t0) / 1.5)), w = (t1 - t0) / n;
  for (let j = 0; j < n; j++) {
    const ta = t0 + j * w + 0.22, tb = t0 + (j + 1) * w - 0.22;
    paredeL(Mp, Q, s0 - 0.01, ta, s0 - 0.01, tb, 1.0, 1.95, VIDRO, -1, 0);
    caixaL(Mp, Q, s0 - 0.28, s0, ta - 0.06, tb + 0.06, 0.94, 1.0, TAMPO);
  }
  const tm = (t0 + t1) / 2, ws = Math.min((t1 - t0) / 2 - 0.1, 1.3);
  placaSinal(O, Q, s0 - 0.5, tm - ws, tm + ws, h + 0.24, h + 0.24 + ws / 2, SINAL.BILHETERIA);
}
/* o acabamento do muro reto (o mesmo de `muro`): a barra de 1 m pintada
   na face de fora (`fora`: +1 ou −1 no eixo que não muda) e o capeamento
   em cima (que passa por cima das portas de verga) */
function acabamentoDoMuro(O, x0, z0, x1, z1, esp, h, fora, vaos, barra, capa) {
  const emX = z0 === z1, a0 = emX ? Math.min(x0, x1) : Math.min(z0, z1), a1 = emX ? Math.max(x0, x1) : Math.max(z0, z1), fixo = emX ? z0 : x0;
  const f = fixo + fora * (esp / 2 + 0.012), Mw = O.m('parede');
  const trechos = lista => { const out = []; let a = a0; for (const [p, q] of [...lista].sort((m, n) => m[0] - n[0])) { if (p > a) out.push([a, p]); a = Math.max(a, q); } if (a1 > a) out.push([a, a1]); return out; };
  const P = (s, y) => emX ? [s, y, f] : [f, y, s];
  for (const [p, q] of trechos(vaos)) Mw.quad(P(p, 0), P(q, 0), P(q, 1.0), P(p, 1.0), [p / 4, 0], [q / 4, 0], [q / 4, 0.25], [p / 4, 0.25], barra, emX ? [0, 0, fora] : [fora, 0, 0]);
  for (const [p, q] of trechos(vaos.filter(v => v[2] == null))) {
    if (emX) bloco(Mw, p - 0.06, q + 0.06, fixo - esp / 2 - 0.06, fixo + esp / 2 + 0.06, h, h + 0.1, capa);
    else bloco(Mw, fixo - esp / 2 - 0.06, fixo + esp / 2 + 0.06, p - 0.06, q + 0.06, h, h + 0.1, capa);
  }
}

/* ======================================================
   O CORREDOR debaixo da arquibancada: o piso, o teto, a parede de dentro
   (com a boca de cada vomitório) e a de fora (com a porta de cada
   entrada), a barra pintada na cor de quem usa o trecho (vermelha do
   visitante, verde do mandante, azul da PM), os pilares, os balcões do
   comércio e o gradil que separa as torcidas — o mesmo das divisórias da
   arquibancada, do chão ao teto. `c`: u0..u1 (o trecho), dI e dF (as
   paredes), y (o piso), h (o pé-direito), bocas e portas [{ua, ub, h}],
   gradis [u], zonas [{ua, ub, lado, cor}], pilar e balcao (a cada
   quantos metros), laje (o teto de baixo, quando tem vão embaixo). As
   pontas do corredor são as da própria arquibancada (com a porta).
   ====================================================== */
const COR_ZONA = { visitante: '#c62828', mandante: '#1b7f3b', pm: '#1f3f9a' };
const zona = (ua, ub, lado) => ({ ua, ub, lado, cor: COR_ZONA[lado] });
/* a boca de cada vomitório na parede de dentro do corredor */
const bocasDe = (A, C) => A.vomitorios.filter(v => v.tunel).map(v => ({ ua: v.ua, ub: v.ub, h: v.tunel.tipo === 'vala' ? C.h : Math.min(C.h, v.yP + v.tunel.hT - C.y), servico: !!v.servico }));
function corredor(O, S, fam, c) {
  const extras = [...(c.gradis || [])];
  for (const L of [c.bocas, c.portas, c.zonas]) for (const e of L || []) extras.push(e.ua, e.ub);
  const us = fam.amostras(c.u0, c.u1, extras);
  const cache = new Map(), anel = d => { let a = cache.get(d); if (!a) { a = us.map(u => fam.ponto(d, u)); a.len = comprimentos(a); cache.set(d, a); } return a; };
  const A = anel(c.dI), B = anel(c.dF), y0 = c.y, y1 = c.y + c.h, barra = Math.min(1.2, c.h * 0.32);
  const naFaixa = (e, u) => fam.fechado ? [u, u - 9, u + 9].some(x => x > e.ua && x < e.ub) : u > e.ua && u < e.ub;
  const em = (L, u) => (L || []).find(e => naFaixa(e, u));
  const meio = i => (us[i] + us[i + 1]) / 2;
  const BARRA = { visitante: lin('#8e3a33'), mandante: lin('#2e5d44'), pm: lin('#2c3d73') };
  const Mp = O.m('corr_piso'), Mt = O.m('corr_teto'), Mw = O.m('corr_parede');
  const TP = lin('#c9c4b8'), TW = lin('#e8e4da'), TT = lin('#cfcac0');
  const P = (q, y) => [q[0], y, q[1]];
  const parede = (R, i, ya, yb, cor, lado) => {
    if (yb - ya < 1e-3) return;
    const q0 = R[i], q1 = R[i + 1];
    Mw.quad(P(q0, ya), P(q1, ya), P(q1, yb), P(q0, yb), [R.len[i] / 4, ya / 4], [R.len[i + 1] / 4, ya / 4], [R.len[i + 1] / 4, yb / 4], [R.len[i] / 4, yb / 4], cor, [(q0[2] + q1[2]) * lado, 0, (q0[3] + q1[3]) * lado]);
  };
  const comBarra = (R, i, ya, lado, cz) => { if (ya < y0 + barra) { parede(R, i, ya, y0 + barra, cz, lado); parede(R, i, y0 + barra, y1, TW, lado); } else parede(R, i, ya, y1, TW, lado); };
  for (let i = 0; i < us.length - 1; i++) {
    const um = meio(i), z = em(c.zonas, um), cz = BARRA[z ? z.lado : 'mandante'];
    const a0 = A[i], a1 = A[i + 1], b0 = B[i], b1 = B[i + 1];
    const f = [P(a0, y0), P(a1, y0), P(b1, y0), P(b0, y0)];
    Mp.quad(f[0], f[1], f[2], f[3], pl(f[0], 4), pl(f[1], 4), pl(f[2], 4), pl(f[3], 4), TP, CIMA);
    const t = [P(a0, y1), P(a1, y1), P(b1, y1), P(b0, y1)];
    Mt.quad(t[0], t[1], t[2], t[3], pl(t[0], 4), pl(t[1], 4), pl(t[2], 4), pl(t[3], 4), TT, [0, -1, 0]);
    if (c.laje) { const b = [P(a0, y0 - 0.4), P(a1, y0 - 0.4), P(b1, y0 - 0.4), P(b0, y0 - 0.4)]; Mt.quad(b[0], b[1], b[2], b[3], pl(b[0], 4), pl(b[1], 4), pl(b[2], 4), pl(b[3], 4), TT, [0, -1, 0]); }
    const bo = em(c.bocas, um); comBarra(A, i, bo ? Math.min(y1, y0 + bo.h) : y0, 1, cz);
    const po = em(c.portas, um); comBarra(B, i, po ? Math.min(y1, y0 + po.h) : y0, -1, cz);
    if (z && S) { const o = [P(a0, y0 + 0.04), P(a1, y0 + 0.04), P(b1, y0 + 0.04), P(b0, y0 + 0.04)]; S.m('setor:' + z.cor).quad(o[0], o[1], o[2], o[3], [0, 0], [1, 0], [1, 1], [0, 1], BRANCO, CIMA); }
  }
  /* o gradil que separa as torcidas, atravessado do chão ao teto */
  for (const u of c.gradis || []) {
    const qa = fam.ponto(c.dI, u), qb = fam.ponto(c.dF, u);
    gradilReto(O, qa[0], qa[1], qb[0], qb[1], y0, c.h - 0.05);
  }
  /* a placa pendurada no teto na frente de cada boca: VOMITÓRIO (a do serviço é da PM; a porta da escada
     interna diz a dela), e na frente de cada porta da parede de fora que tem placa */
  for (const b of c.bocas || []) {
    const q = fam.ponto(c.dI + 0.4, (b.ua + b.ub) / 2), Q = quadro([q[0], q[1]], [-q[2], -q[3]]);
    placaSinal(O, Q, 0, -1.0, 1.0, y1 - 0.64, y1 - 0.14, SINAL[b.placa || (b.servico ? 'PM' : 'VOMITÓRIO')]);
  }
  for (const p of (c.portas || []).filter(x => x.placa)) {
    const q = fam.ponto(c.dF - 0.4, (p.ua + p.ub) / 2), Q = quadro([q[0], q[1]], [q[2], q[3]]);
    placaSinal(O, Q, 0, -1.2, 1.2, y1 - 0.74, y1 - 0.14, SINAL[p.placa]);
  }
  /* o que está a menos de m metros de uma boca, porta ou gradil (pro pilar e o balcão não taparem) */
  const perto = (u, d, m) => {
    const w = larguraU(fam, u, d, m);
    return [...(c.bocas || []), ...(c.portas || [])].some(e => naFaixa({ ua: e.ua - w, ub: e.ub + w }, u)) || (c.gradis || []).some(g => naFaixa({ ua: g - w, ub: g + w }, u));
  };
  /* a posição (u) a cada tantos metros no anel d, com a folga das pontas */
  const aCada = (d, passo, desloc) => {
    const R = anel(d), tot = R.len[R.len.length - 1], out = [];
    for (let s = desloc; s < tot - 3; s += passo) {
      if (s < 3) continue;
      let i = 1; while (i < R.len.length - 1 && R.len[i] < s) i++;
      const f = (s - R.len[i - 1]) / Math.max(1e-9, R.len[i] - R.len[i - 1]);
      out.push(us[i - 1] + (us[i] - us[i - 1]) * f);
    }
    return out;
  };
  let pilares = 0, balcoes = 0;
  const Mpil = O.m('corr_parede'), PIL = lin('#d8d3c8');
  if (c.pilar) for (const u of aCada(c.dI + 1.0, c.pilar, c.pilar / 2)) {
    if (perto(u, c.dI + 1, 1.2)) continue;
    const q = fam.ponto(c.dI + 1.0, u);
    caixa(Mpil, q[0], y0, q[1], 0.6, 0.6, c.h, Math.atan2(q[3], q[2]), PIL);
    pilares++;
  }
  if (c.balcao) {
    let k = c.semente || 0;
    for (const u of aCada(c.dF, c.balcao, c.balcao * 0.4)) {
      const z = em(c.zonas, u);
      if ((z && z.lado === 'pm') || perto(u, c.dF, 3.0)) continue;
      balcao(O, fam, c.dF, u, VENDAS[k++ % VENDAS.length], y0);
      balcoes++;
    }
  }
  /* as luminárias no meio do teto, a cada 6 m */
  let luzes = 0;
  const dm = (c.dI + c.dF) / 2;
  for (const u of aCada(dm, 6, 3)) { const q = fam.ponto(dm, u); luminaria(O, q[0], y1 - 0.03, q[1], -q[3], q[2]); luzes++; }
  const M = anel(dm);
  const r = { comprimento: M.len[M.len.length - 1], largura: c.dF - c.dI, peDireito: c.h, y: c.y, pilares, balcoes, luzes };
  /* de quem é o trecho no u (a conferência das portas; não vai pra ficha) */
  Object.defineProperty(r, 'zonaEm', { value: u => { const z = em(c.zonas, u); return z ? z.lado : null; } });
  return r;
}
/* A LUMINÁRIA do teto: o retângulo aceso de 1,2 × 0,3 m, virado pra baixo, no rumo (dx, dz) */
function luminaria(O, x, y, z, dx, dz) {
  const l = Math.hypot(dx, dz), a = [dx / l * 0.6, dz / l * 0.6], b = [-dz / l * 0.15, dx / l * 0.15];
  const P = (i, j) => [x + a[0] * i + b[0] * j, y, z + a[1] * i + b[1] * j];
  O.m('lampada').quad(P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), [0, 0], [1, 0], [1, 1], [0, 1], BRANCO, [0, -1, 0]);
}
/* O BALCÃO do corredor: a casinha encostada na parede de fora (1,3 m de
   fundo), o balcão na frente (até 1,7 m da parede: no corredor de 6 m do
   de 40 mil, mais fundo tomava a passagem), a janela escura e a placa do
   que vende, virada pro corredor */
function balcao(O, fam, dF, u, k, y0) {
  const q = fam.ponto(dF, u), Q = quadro([q[0], q[1]], [-q[2], -q[3]]);
  const Mp = O.m('pintura'), CORPO = lin('#dcd6c7'), TAMPO = lin('#8a8f94'), JANELA = lin('#2a2c2e'), f = 1.305;
  caixaL(Mp, Q, 0.02, 1.3, -1.8, 1.8, y0, y0 + 2.6, CORPO);
  caixaL(Mp, Q, 1.3, 1.7, -1.6, 1.6, y0, y0 + 1.05, TAMPO);
  Mp.quad(Q.L(f, -1.5, y0 + 1.1), Q.L(f, 1.5, y0 + 1.1), Q.L(f, 1.5, y0 + 1.95), Q.L(f, -1.5, y0 + 1.95), [0, 0], [1, 0], [1, 1], [0, 1], JANELA, Q.dir(1, 0));
  const [u0, v0, u1, v1] = celulaDoSinal(k);
  O.m('sinais').quad(Q.L(f, 1.6, y0 + 2.02), Q.L(f, -1.6, y0 + 2.02), Q.L(f, -1.6, y0 + 2.52), Q.L(f, 1.6, y0 + 2.52), [u0, v0], [u1, v0], [u1, v1], [u0, v1], BRANCO, Q.dir(1, 0));
}

/* ======================================================
   AS ENTRADAS DA RUA
   ====================================================== */
/* onde a fila do portão começa (2,5 m pra fora da porta, no eixo) e o rumo de quem entra, em metros */
const naRua = Q => { const p = Q.L(-2.5, 0, 0); return { ponto: [+p[0].toFixed(2), +p[2].toFixed(2)], rumo: [+Q.w[0].toFixed(4), +Q.w[1].toFixed(4)] }; };
/* O PLANO DE UMA ENTRADA reta: o eixo nasce em P0 (na face de fora — a
   fachada ou o muro) e entra no rumo w; `sF` é onde cada lado (−hl, +hl)
   encosta no anel dCorr (a parede de fora do corredor), `vaoCorr` o
   trecho de u que a porta ocupa nessa parede, `uEm` o u de um ponto do
   eixo e `vao` junta dois u num trecho */
function planoDaEntrada(fam, P0, w, larg, dCorr) {
  const Q = quadro(P0, w), hl = larg / 2;
  const ate = (t, d) => { let lo = 0, hi = 90; for (let j = 0; j < 50; j++) { const m = (lo + hi) / 2, p = Q.L(m, t, 0); if (fam.dDe(p[0], p[2]) > d) lo = m; else hi = m; } return (lo + hi) / 2; };
  const uEm = (s, t) => { const p = Q.L(s, t, 0); return fam.uDe(p[0], p[2]).u; };
  const vao = (a, b) => { if (a > b) [a, b] = [b, a]; if (fam.fechado && b - a > 4.5) [a, b] = [b, a + 9]; return { ua: a, ub: b }; };
  const sF = [ate(-hl, dCorr), ate(hl, dCorr)];
  return { Q, hl, larg, sF, vaoCorr: vao(uEm(sF[0], -hl), uEm(sF[1], hl)), uEm, vao, ate };
}
/* O SALÃO DA ENTRADA, do portão até a parede de fora do corredor: o piso,
   o teto, as paredes dos lados (com os vãos pedidos: a escada), a fila de
   catracas, o portão de enrolar e a placa por fora */
function salao(O, E, c) {
  const { Q, hl, sF } = E, y0 = c.y0 || 0, y1 = y0 + c.h;
  const Mp = O.m('corr_piso'), Mt = O.m('corr_teto'), Mw = O.m('corr_parede');
  const TP = lin('#c9c4b8'), TW = lin('#e8e4da'), TT = lin('#cfcac0');
  const f = [Q.L(0, -hl, y0), Q.L(0, hl, y0), Q.L(sF[1], hl, y0), Q.L(sF[0], -hl, y0)];
  Mp.quad(f[0], f[1], f[2], f[3], pl(f[0], 4), pl(f[1], 4), pl(f[2], 4), pl(f[3], 4), TP, CIMA);
  const t = [Q.L(0, -hl, y1), Q.L(0, hl, y1), Q.L(sF[1], hl, y1), Q.L(sF[0], -hl, y1)];
  Mt.quad(t[0], t[1], t[2], t[3], pl(t[0], 4), pl(t[1], 4), pl(t[2], 4), pl(t[3], 4), TT, [0, -1, 0]);
  /* a laje vista de cima (no corte do de 40 mil, o do corredor de cima, o salão fica embaixo) */
  const tc = t.map(p => [p[0], p[1] + 0.3, p[2]]);
  Mt.quad(tc[0], tc[1], tc[2], tc[3], pl(tc[0], 4), pl(tc[1], 4), pl(tc[2], 4), pl(tc[3], 4), vezes(TT, 0.8), CIMA);
  for (const [lado, tt, sFim] of [[-1, -hl, sF[0]], [1, hl, sF[1]]]) {
    let s = 0;
    for (const a of (c.aberturas || []).filter(x => x.lado === lado).sort((p, q) => p.s0 - q.s0)) {
      if (a.s0 > s) paredeL(Mw, Q, s, tt, a.s0, tt, y0, y1, TW, 0, -lado);
      if (a.h < c.h) paredeL(Mw, Q, a.s0, tt, a.s1, tt, y0 + a.h, y1, TW, 0, -lado);
      s = a.s1;
    }
    if (sFim > s) paredeL(Mw, Q, s, tt, sFim, tt, y0, y1, TW, 0, -lado);
  }
  for (let s = 2.5; s < Math.min(sF[0], sF[1]) - 1; s += 5) { const p = Q.L(s, 0, y1 - 0.03); luminaria(O, p[0], p[1], p[2], Q.w[0], Q.w[1]); }
  const n = c.catraca != null ? catracas(O, Q, c.catraca, -hl, hl, y0) : 0;
  if (c.portao) caixaL(O.m('pintura'), Q, -0.45, -0.02, -hl - 0.1, hl + 0.1, y1 - 0.05, y1 + 0.5, lin('#5f6468'));
  const w = Math.min(hl + 0.4, 2.8);
  if (c.placa != null) placaSinal(O, Q, -0.14, -w, w, y1 + 0.6, y1 + 0.6 + w / 2, c.placa);
  if (c.fundo != null) { const w2 = Math.min(hl - 0.2, 1.4), sE = Math.min(sF[0], sF[1]) - 0.2; placaSinal(O, Q, sE, -w2, w2, y1 - 0.12 - w2 / 2, y1 - 0.12, c.fundo); }
  return { catracas: n };
}
/* A FILA DE CATRACAS atravessada no eixo, em s: o pé de inox de cada uma e o
   braço (num balde à parte: ele gira, não barra quem anda) */
function catracas(O, Q, s, t0, t1, y0) {
  const Mp = O.m('pintura'), Mb = O.m('braco'), INOX = lin('#a9b1b6'), BRACO = lin('#d4d9dc');
  const n = Math.max(2, Math.floor((t1 - t0) / 0.95)), passo = (t1 - t0) / n;
  for (let j = 0; j < n; j++) {
    const t = t0 + passo * j + 0.18;
    caixaL(Mp, Q, s - 0.35, s + 0.35, t - 0.14, t + 0.14, y0, y0 + 1.0, INOX);
    caixaL(Mb, Q, s - 0.03, s + 0.03, t + 0.14, t + Math.min(0.62, passo - 0.2), y0 + 0.85, y0 + 0.91, BRACO);
  }
  return n;
}
/* a placa da folha de placas, em pé no quadro (em s, de t0 a t1, de y0 a
   y1), virada pra fora (−w), com a moldura atrás dela (até s + 0,12) */
function placaSinal(O, Q, s, t0, t1, y0, y1, k) {
  const [u0, v0, u1, v1] = celulaDoSinal(k);
  O.m('sinais').quad(Q.L(s, t0, y0), Q.L(s, t1, y0), Q.L(s, t1, y1), Q.L(s, t0, y1), [u0, v0], [u1, v0], [u1, v1], [u0, v1], BRANCO, Q.dir(-1, 0));
  caixaL(O.m('pintura'), Q, s + 0.02, s + 0.12, t0 - 0.08, t1 + 0.08, y0 - 0.08, y1 + 0.08, lin('#3b4046'));
}
/* A ESCADA INTERNA do corredor do chão pro de cima (o de 40 mil), no vão
   entre os dois — do anel dA (a parede de fora do de baixo) ao dB (a de
   dentro do de cima) —, ao longo do anel: dois lances lado a lado, com a
   parede no meio. O A sobe do patamar de baixo (a porta do corredor do
   chão, na parede de dentro) até o patamar da volta, que pega as duas
   pistas; o B volta, do outro lado da parede, até o patamar de cima (a
   porta do corredor de cima, na parede de fora, em cima da de baixo).
   Em volta, as paredes, o forro 2,1 m acima do patamar de cima e a luz.
   Os lances encostam nas paredes (não têm lateral: a parede é a
   lateral); a de dentro e a de fora ficam 5 cm pra dentro das do
   corredor, que são de dupla face (no mesmo plano, as duas brigavam). O
   comprimento é contado no anel do meio, somado de pouco em pouco (vale
   na reta, no canto e na passagem de um pro outro). `c`: u0 (a ponta
   das portas), sg (pra que lado do u ela vai dali), dA, dB e yT (o piso
   de cima). Devolve as duas portas, a faixa de u que ela ocupa e os
   degraus. */
function escadaInterna(O, fam, c) {
  const { sg, dA, dB, yT } = c, dM = (dA + dB) / 2, e = 0.1, yM = yT / 2, yTeto = yT + 2.1, hB = 2.6, dAp = dA + 0.05, dBp = dB - 0.05;
  const n = Math.round(yM / 0.18), RUN = 0.27, LP = 1.6, LV = 1.6;
  const sB = LP, sV = sB + n * RUN, sFim = sV + LV, pa = 0.1, pb = LP - 0.1;
  /* o u de cada s (metros no anel do meio, da ponta das portas) */
  const tab = [[0, c.u0]];
  for (let s = 0, u = c.u0, q = fam.ponto(dM, u); s < sFim + 0.1;) {
    const u2 = u + sg * 0.002, q2 = fam.ponto(dM, u2);
    s += Math.hypot(q2[0] - q[0], q2[1] - q[1]); u = u2; q = q2; tab.push([s, u]);
  }
  const U = s => {
    let lo = 0, hi = tab.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m][0] <= s) lo = m; else hi = m; }
    const [s0, a0] = tab[lo], [s1, a1] = tab[hi];
    return a0 + (a1 - a0) * (s - s0) / Math.max(1e-9, s1 - s0);
  };
  const Md = O.m('degrau'), Mn = O.m('nariz'), Mw = O.m('corr_parede'), Mt = O.m('corr_teto'), Mp = O.m('corr_piso');
  const TINTA = lin('#cfc6b4'), ESP = vezes(TINTA, 0.8), TW = lin('#e4dfd4'), TT = lin('#cfcac0'), TP = lin('#c9c4b8'), AMARELO = lin('#e2b007');
  const P = (d, s, y) => { const q = fam.ponto(d, U(s)); return [q[0], y, q[1]]; };
  /* na curva, um pedaço a cada 60 cm */
  const pedacos = (s0, s1) => { const k = Math.max(1, Math.ceil(Math.abs(s1 - s0) / 0.6)); return Array.from({ length: k + 1 }, (_, j) => s0 + (s1 - s0) * j / k); };
  /* o piso (ou o forro, virado pra baixo) de d0 a d1 e de s0 a s1, na altura y */
  const plano = (M, d0, d1, s0, s1, y, cor, baixo) => {
    const ss = pedacos(s0, s1);
    for (let j = 0; j < ss.length - 1; j++) {
      const a = P(d0, ss[j], y), b = P(d0, ss[j + 1], y), cc = P(d1, ss[j + 1], y), d = P(d1, ss[j], y);
      M.quad(a, b, cc, d, pl(a, 4), pl(b, 4), pl(cc, 4), pl(d, 4), cor, baixo ? [0, -1, 0] : CIMA);
    }
  };
  /* a parede no anel d, de s0 a s1 e de ya a yb, virada pra fora (lado +1) ou pro campo (−1) */
  const paredeD = (M, d, s0, s1, ya, yb, cor, lado) => {
    if (yb - ya < 1e-3 || Math.abs(s1 - s0) < 1e-3) return;
    const ss = pedacos(s0, s1);
    for (let j = 0; j < ss.length - 1; j++) {
      const qa = fam.ponto(d, U(ss[j])), qb = fam.ponto(d, U(ss[j + 1]));
      M.quad([qa[0], ya, qa[1]], [qb[0], ya, qb[1]], [qb[0], yb, qb[1]], [qa[0], yb, qa[1]], [ss[j] / 4, ya / 4], [ss[j + 1] / 4, ya / 4], [ss[j + 1] / 4, yb / 4], [ss[j] / 4, yb / 4],
        cor, [(qa[2] + qb[2]) * lado, 0, (qa[3] + qb[3]) * lado]);
    }
  };
  /* a parede de través no s, de d0 a d1, virada pro s que cresce (lado +1) ou pro que diminui (−1) */
  const paredeS = (M, s, d0, d1, ya, yb, cor, lado) => {
    const a = P(dM, s, 0), b = P(dM, s + 0.01, 0);
    M.quad(P(d0, s, ya), P(d1, s, ya), P(d1, s, yb), P(d0, s, yb), [d0 / 4, ya / 4], [d1 / 4, ya / 4], [d1 / 4, yb / 4], [d0 / 4, yb / 4], cor, [(b[0] - a[0]) * lado, 0, (b[2] - a[2]) * lado]);
  };
  /* um lance de d0 a d1, de s0 (na altura y0) a s1 (y1): o espelho virado pra quem sobe, o piso e a faixa amarela no nariz */
  const lance = (d0, d1, s0, s1, y0, y1) => {
    const run = (s1 - s0) / n, rr = (y1 - y0) / n, sgn = Math.sign(run);
    for (let j = 0; j < n; j++) {
      const sa = s0 + j * run, sb = sa + run, ya = y0 + j * rr, yb = ya + rr;
      paredeS(Md, sa, d0, d1, ya, yb, ESP, -sgn);
      plano(Md, d0, d1, sa, sb, yb, TINTA);
      const na = P(d0, sa, yb + 0.003), nb = P(d1, sa, yb + 0.003), nc = P(d1, sa + 0.05 * sgn, yb + 0.003), nd = P(d0, sa + 0.05 * sgn, yb + 0.003);
      Mn.quad(na, nb, nc, nd, [0, 0], [1, 0], [1, 1], [0, 1], AMARELO, CIMA);
    }
  };
  /* o chão (no corte ele aparece debaixo dos lances), os lances e os patamares */
  plano(Mp, dA, dB, 0, sFim, 0, TP);
  lance(dAp, dM - e, sB, sV, 0, yM);
  plano(Md, dAp, dBp, sV, sFim, yM, TINTA);
  lance(dM + e, dBp, sV, sB, yM, yT);
  plano(Md, dM + e, dB, 0, sB, yT, TINTA);
  /* as paredes: a de dentro com a porta de baixo, a de fora com a de cima, as das pontas, a do meio (até o patamar da volta) e o forro */
  paredeD(Mw, dAp, 0, pa, 0, yTeto, TW, 1); paredeD(Mw, dAp, pa, pb, hB, yTeto, TW, 1); paredeD(Mw, dAp, pb, sFim, 0, yTeto, TW, 1);
  paredeD(Mw, dBp, 0, pa, 0, yTeto, TW, -1); paredeD(Mw, dBp, pa, pb, 0, yT, TW, -1); paredeD(Mw, dBp, pb, sFim, 0, yTeto, TW, -1);
  paredeS(Mw, 0, dA, dB, 0, yTeto, TW, 1); paredeS(Mw, sFim, dA, dB, 0, yTeto, TW, -1);
  paredeD(Mw, dM - e, 0, sV, 0, yTeto, TW, -1); paredeD(Mw, dM + e, 0, sV, 0, yTeto, TW, 1);
  paredeS(Mw, sV, dM - e, dM + e, yM, yTeto, TW, 1);
  plano(Mt, dA, dB, 0, sFim, yTeto, TT, true);
  for (const [d, s] of [[(dAp + dM) / 2, sV / 2], [(dM + dBp) / 2, sB / 2], [dM, (sV + sFim) / 2]]) {
    const q = P(d, s, yTeto - 0.03), t = P(d, s + 0.01, 0);
    luminaria(O, q[0], q[1], q[2], t[0] - q[0], t[2] - q[2]);
  }
  const faixa = (a, b) => { const x = U(a), y = U(b); return x < y ? { ua: x, ub: y } : { ua: y, ub: x }; };
  return { portaBaixo: { ...faixa(pa, pb), h: hB, placa: 'ESCADA · ANEL SUPERIOR' }, portaCima: { ...faixa(pa, pb), h: yTeto - yT, placa: 'SAÍDA' }, ...faixa(0, sFim), degraus: 2 * n };
}
/* a passagem reta entre duas pontas de corredor (a do nordeste do de 10 mil): piso, teto e as duas paredes */
function passagemReta(O, x0, x1, z0, z1, y0, h) {
  const Mp = O.m('corr_piso'), Mt = O.m('corr_teto'), Mw = O.m('corr_parede'), TP = lin('#c9c4b8'), TW = lin('#e8e4da'), TT = lin('#cfcac0');
  const q = y => [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];
  const f = q(y0), t = q(y0 + h);
  Mp.quad(f[0], f[1], f[2], f[3], pl(f[0], 4), pl(f[1], 4), pl(f[2], 4), pl(f[3], 4), TP, CIMA);
  Mt.quad(t[0], t[1], t[2], t[3], pl(t[0], 4), pl(t[1], 4), pl(t[2], 4), pl(t[3], 4), TT, [0, -1, 0]);
  for (const [z, s] of [[z0, 1], [z1, -1]]) Mw.quad([x0, y0, z], [x1, y0, z], [x1, y0 + h, z], [x0, y0 + h, z], [0, 0], [1, 0], [1, 1], [0, 1], TW, [0, 0, s]);
}
/* O CHÃO DE BAIXO da arquibancada, na frente do corredor (do d0 dela até
   dI, no chão y): só aparece no corte. Onde um vomitório tem piso no chão
   (o último degrau e o túnel, a vala no nível do chão, o túnel dos
   jogadores), o piso é o dele: só aquele trecho fica de fora — o resto
   do vomitório tem chão embaixo, pra ninguém ver o céu por baixo do
   poço. `sempre`: faixas de u sem chão nenhum (o corte do portão). */
function chaoDeBaixo(M, A, dI, y, cor, u0 = 0, u1 = 9, sempre = []) {
  const fam = A.fam, d0 = A.c.d0, noChao = [];
  for (const v of A.vomitorios) {
    const T = v.tunel;
    if (!T) { if (Math.abs(v.yP - y) < 0.05) noChao.push([v.dA, v.dB, v]); continue; }
    if (Math.abs(T.yC - y) > 0.05) continue;
    const nE = Math.max(0, Math.round((v.yP - T.yC) / 0.18));
    if (T.tipo === 'vala') noChao.push(nE ? [v.dB - 0.28, v.dB, v] : [v.dA, v.dB, v]);
    else noChao.push([nE ? v.dB + (nE - 1) * 0.28 : v.dA, T.dI, v]);
  }
  const cortes = [...new Set([d0, dI, ...noChao.flatMap(([a, b]) => [a, b]).filter(d => d > d0 && d < dI)])].sort((a, b) => a - b);
  for (let j = 0; j < cortes.length - 1; j++) {
    const a = cortes[j], b = cortes[j + 1];
    if (b - a < 1e-3) continue;
    const pula = [...sempre, ...noChao.filter(([p, q]) => p < b - 1e-6 && q > a + 1e-6).map(x => x[2])];
    faixaDeAnel(M, fam, a, b, y, cor, 4, pula, u0, u1);
  }
}
/* O CHÃO DE BAIXO entre dois anéis de um anel fechado, cortado pelos
   salões das entradas (o piso deles é deles): um pedaço de um salão ao
   outro, fechado pelo lado reto de cada salão. `vaos` [{ua, ub, d1}]: o
   dente de dA a d1 (a escada interna, que tem chão dela). Só aparece no
   corte. */
function chaoEntreSaloes(M, fam, dA, dB, y, cor, entradas, vaos = []) {
  const lados = entradas.map(E => {
    const m = E.uEm(0, 0), uu = (t, d) => E.uEm(E.ate(t, d), t);
    /* o lado de u menor (no sentido horário, o que vem antes) */
    const antes = t => ((uu(t, dB) - m + 13.5) % 9) - 4.5 < 0;
    const [ta, tb] = antes(E.hl) ? [E.hl, -E.hl] : [-E.hl, E.hl];
    return { m, lo: [uu(ta, dA), uu(ta, dB)], hi: [uu(tb, dA), uu(tb, dB)] };
  }).sort((a, b) => a.m - b.m);
  const pts = (d, u0, u1) => fam.amostras(u0, u1).map(u => { const q = fam.ponto(d, u); return [q[0], q[1]]; });
  /* a borda de dentro de u0 a u1, com o dente de cada vão que cabe nela */
  const dentro = (u0, u1) => {
    const out = [];
    let u = u0;
    const vs = vaos.map(v => { let a = v.ua, b = v.ub; while (a < u0) { a += 9; b += 9; } return { ua: a, ub: b, d1: v.d1 }; }).filter(v => v.ub < u1).sort((p, q) => p.ua - q.ua);
    for (const v of vs) { out.push(...pts(dA, u, v.ua), ...pts(v.d1, v.ua, v.ub)); u = v.ub; }
    return out.concat(pts(dA, u, u1));
  };
  lados.forEach((a, j) => {
    const b = lados[(j + 1) % lados.length];
    let i0 = a.hi[0], i1 = b.lo[0], o0 = a.hi[1], o1 = b.lo[1];
    while (i1 <= i0) i1 += 9;
    while (o1 <= o0) o1 += 9;
    chaoPlano(M, [...dentro(i0, i1), ...pts(dB, o0, o1).reverse()], [], y, cor, 4);
  });
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
    lista.push({ id: s.id, nome: NOME_SETOR[s.id], cor, lugares: A.lugares(s.ua, s.ub, k0, k1), vomitorios: A.vomsEm(s.ua, s.ub), onde: s.onde });
  }
  /* o mesmo escalão pode ter mais de um pedaço: soma */
  const soma = {};
  for (const x of lista) { if (!soma[x.id]) soma[x.id] = { ...x }; else { soma[x.id].lugares += x.lugares; soma[x.id].vomitorios += x.vomitorios; } }
  return Object.values(soma);
}
/* o que é dentro do estádio (o muro do de 10, a fachada do de 20 e do de 40), pro conferidor; não vai pra ficha */
const dentroDo = (f, info) => Object.defineProperty(info, 'dentro', { value: f });
/* os marcadores: o nome de cada portão */
function marcador(G, texto, cor, x, y, z, tam) {
  const r = rotulo(texto, cor, tam);
  r.position.set(x, y, z);
  G.add(r);
}

/* ======================================================
   OS ANÉIS DE CADA UM (o modelo e a planta 2D usam os mesmos)

   O TAMANHO DE JOGO. As fotos são de estádio de verdade (o de 40 mil
   dava 284 × 236 m de terreno), grande demais pro mapa da cidade, que é
   comprimido (a quadra tem 35,6 × 17,8 m; o quarteirão do estádio de
   hoje, 77 × 66). No jogo, cada um encolhe onde não tem gente — o campo
   (com as linhas na mesma proporção), a pista, o fosso, as margens — e
   perde fileiras; o degrau, o corredor, o vomitório, o portão, a
   catraca e a escada continuam do tamanho de gente. O que a foto marca
   (vomitório, divisória do dono, portão) vai pelo u do ANEL DA FOTO: cai
   no mesmo lugar do anel menor (o u anda em fração do lado e do canto).
   ====================================================== */
/* O de 10 mil: tudo sai do meio campo (C × L) e das fileiras. Com o
   campo da foto (C 50, L 34) dá a foto; no jogo, campo de 46 × 30 e a
   passarela do sul de 3,4 m (era de 5,7). Frente da do norte (zFN), da
   do leste (xFL) e da do sul (zFS); as pontas da do norte (xN0, xN1); o
   centro das curvas do leste (xC, raio rC) e da asa do sudoeste (xSO,
   raio rSO); o meio do muro de cada lado (zMN, zMS, xML, xMO; o muro tem
   40 cm) e o terreno (a boca do túnel do portão 3 fica 3,7 m pra fora do
   muro do oeste, o arco do portão 1 do lado do leste). */
const G10 = (() => {
  const C = 23, L = 15, N = 15, P = N * 0.8;
  const zFN = -(L + 6.6), xFL = C + 5.6, zFS = L + 5.5, xN0 = -(C - 4.8), xN1 = C - 3.9, xC = C - 2.3, rC = 7.9, xSO = -(C + 1.5), rSO = 3.4;
  const zMN = zFN - P - 3.4 - 0.2, zMS = zFS + P + 3.4 + 0.2, xML = xFL + P + 2.8 + 0.2, xMO = xSO - rSO - P - 0.2;
  /* o z do meio do portão 1: o mesmo ponto da reta do leste que na foto (z −0,4 entre −34 e 31,6) */
  const p1 = -L + (33.6 / 65.6) * (2 * L - 2.4);
  return { C, L, N, P, zFN, xFL, zFS, xN0, xN1, xC, rC, xSO, rSO, zMN, zMS, xML, xMO, p1,
           terreno: { x0: xMO - 0.2 - 8.7, x1: xML + 0.2 + 7.2, z0: zMN - 0.2 - 5.6, z1: zMS + 0.2 + 6.4 } };
})();
const caminhos10 = ({ C, L, xN0, xN1, zFN, xC, rC, xFL, zFS, xSO, rSO }) => ({
  Fg: anelFechado({ A0: C + 3.75, B0: L + 4.5, r0: 4, k: 1 }),
  Fn: caminho([{ reta: [xN0, zFN, xN1, zFN] }]),
  Fl: caminho([
    { arco: [xC, -L, rC, -90, 0] }, { reta: [xFL, -L, xFL, L - 2.4] }, { arco: [xC, L - 2.4, rC, 0, 90] },
    { reta: [xC, zFS, xSO, zFS] }, { arco: [xSO, zFS - rSO, rSO, 90, 180] }
  ])
});
const aneis10 = () => caminhos10(G10);
const aneis10Foto = () => caminhos10({ C: 50, L: 34, xN0: -45.2, xN1: 46.1, zFN: -40.6, xC: 47.7, rC: 7.9, xFL: 55.6, zFS: 39.5, xSO: -51.5, rSO: 3.4 });
/* as valas do de 10 mil no caminho de jogo, no u da foto: as 4 da do norte
   (longe das divisórias da PM) e as 6 da do leste e sul; o corte do
   portão 1 (10,6 m) e a vala de serviço do meio da do sul (3,6 m) */
function pecas10(Fn, Fl) {
  const F0 = aneis10Foto(), uN = x => F0.Fn.uDe(x, -45).u, uL = (x, z) => F0.Fl.uDe(x, z).u;
  const divN = [uN(-8.2), uN(2.5)];
  const vala = (fam, u) => ({ ...faixaNoU(fam, u, 2.4, 6), k0: 2, k1: 6 });
  const norte = [-38, -14.4, 14.9, 38].map(x => longeDosGradis(Fn, vala(Fn, uN(x)), divN, 0.9, 6));
  const leste = [[61, -20], [61, 20], [44.2, 45], [13.8, 45], [-18, 45], [-40, 45]].map(([x, z]) => vala(Fl, uL(x, z)));
  const corte = faixaNoU(Fl, uL(61, -0.4), 10.6, 0), acesso = faixaNoU(Fl, uL(-0.1, 45), 3.6, 0);
  return { divN, uN, uL, norte, leste, corte, acesso };
}
/* O VOMITÓRIO LONGE DO GRADIL. No anel de jogo o que a foto marca fica
   mais perto (o anel encolhe, o vomitório não): o que cai a menos de `m`
   metros (no anel dRef) de uma divisória anda pro meio do trecho dele e,
   se o trecho é estreito (o da PM), afina. */
function longeDosGradis(fam, v, gradis, m, dRef) {
  if (!gradis.length) return v;
  const dist = (a, b) => ((((a - b) % 9) + 13.5) % 9) - 4.5;
  const mu = larguraU(fam, v.u, dRef, m);
  let meia = (v.ub - v.ua) / 2, esq = -Infinity, dir = Infinity, du = 0;
  for (const g of gradis) { const d = dist(g, v.u); if (d <= 0 && d > esq) esq = d; if (d > 0 && d < dir) dir = d; }
  const lo = esq + mu + meia, hi = dir - mu - meia;
  if (lo > hi) { meia = Math.max(0, (dir - esq) / 2 - mu); du = (esq + dir) / 2; }
  else if (lo > 0) du = lo; else if (hi < 0) du = hi;
  const u = v.u + du;
  return { ...v, u, ua: u - meia, ub: u + meia };
}
const anel20Foto = () => anelFechado({ A0: 67, B0: 45.7, r0: 12, k: 0.68 });
const uDaFoto = (F0, x, z) => F0.uDe(x, z).u;
/* o de 20 mil: campo de 56 × 36 (3 m de grama atrás do gol, 2,5 do lado),
   a pista de 3 m e 22 fileiras; a fachada a 18,4 m da frente da
   arquibancada; o muro a 6,5 m dela no leste e no oeste (a fila dos
   portões), a 2,7 no norte e a 1,9 no sul */
const G20 = (() => {
  const campo = [56, 36], pista = 3, A0 = campo[0] / 2 + 3 + pista, B0 = campo[1] / 2 + 2.5 + pista;
  const N = 22, dn = N * 0.8, dP = dn + 0.55, dFac = dP + 0.25;
  return { campo, pista, A0, B0, r0: 7, N, dn, dP, dFac, xM: A0 + dFac + 6.5, zN: -(B0 + dFac + 2.7), zS: B0 + dFac + 1.9 };
})();
const anel20 = () => anelFechado({ A0: G20.A0, B0: G20.B0, r0: G20.r0, k: 0.68 });
const anel40Foto = () => anelFechado({ A0: 73.6, B0: 50.1, r0: 28, k: 0.8 });
/* o de 40 mil: campo de 56 × 36 (3 m de grama atrás do gol, 2,5 do lado)
   dentro do fosso de 3 m, o anel de baixo com 15 fileiras, o corredor
   entre os anéis (2 m) e o de cima com 15; a fachada a 28,4 m da frente
   de baixo; em volta, a pista de ônibus (4 m) e a praça (a fila dos
   portões, 6 m) */
const G40 = (() => {
  const campo = [56, 36], fosso = 3.4, A0 = campo[0] / 2 + 3 + fosso, B0 = campo[1] / 2 + 2.5 + fosso;
  const NI = 15, NS = 15, dS = NI * 0.8 + 2.0, dP = dS + NS * 0.8 + 2.15, dFac = dP + 0.25, onibus = 4, praca = 6.1;
  const dT = dFac + onibus + praca;
  return { campo, fosso, A0, B0, r0: 13, NI, NS, dS, dP, dFac, onibus, dT, xT: A0 + dT, zT: B0 + dT };
})();
const anel40 = () => anelFechado({ A0: G40.A0, B0: G40.B0, r0: G40.r0, k: 0.8 });
/* os vomitórios da foto: os 8 do de 20 mil e os dois do meio do leste e do oeste */
const VOM20 = [[42.2, -53.8], [-42.2, -53.8], [75.8, -24.7], [75.8, 24.7], [32.8, 54.5], [-32.8, 54.5], [-75.8, 24.7], [-75.8, -24.7], [80, 0], [-80, 0]];
/* os vomitórios do anel de cima do de 40 mil: a foto mostra 29 (um a
   cada 20 m); no anel de jogo, um a cada 11 m ficava de mais, e o dono
   pediu menos. Ficam 12 dos da foto, espelhados (a foto é simétrica):
   dois no norte, um em cada curva, dois em cada lado e dois no sul —
   cada setor do dono com pelo menos um (o v1 e o v2 do sudoeste com os
   dois que a divisa deles separa). O da curva do sudoeste do lado do
   oeste (−100,2, 52,1) saiu, e o espelho dele: ali, entre o salão do
   portão 3 e a PM2, fica a escada interna do visitante. */
const VOM40 = [[24, -88.4], [-24, -88.4], [87, -67.1], [-87, -67.1], [112.8, -11.2], [-112.8, -11.2], [112.8, 11.3], [-112.8, 11.3],
  [87, 67.1], [-87, 67.1], [22, 90.5], [-22, 90.5]];
/* no anel de jogo: o u da foto, a largura de 4,4 m (no meio do poço) e
   longe das divisórias de cima (a PM1 e a PM4) — a 1,5 m: a escada do
   lado do poço passa 1,1 m dele, e não pode encostar no gradil */
function vomitorios40(F) {
  const F0 = anel40Foto(), u = (x, z) => uDaFoto(F0, x, z), dV = G40.dS + 2.8;
  const gradisS = [u(-110, 6.4), u(-110, -2.6), u(-64.9, 82.2), u(-73.2, 80)];
  return VOM40.map(([x, z]) => longeDosGradis(F, faixaNoU(F, u(x, z), 4.4, dV), gradisS, 1.5, dV)).sort((a, b) => a.u - b.u);
}

/* ======================================================
   O ESTÁDIO DE 10 MIL (nível 1)
   foto: 12,65 px por metro, campo de 100 × 68; no jogo (G10), campo de
   46 × 30, as mesmas 15 fileiras
   ====================================================== */
function montar10(O, S, G, opc) {
  const g = G10, tArq = lin('#dcd9d1'), tMuro = lin('#eeebe3'), tPasso = lin('#d2cfc6'), tBaixo = lin('#8e8a80');
  const { Fg, Fn, Fl } = aneis10(), pc = pecas10(Fn, Fl);
  const N = g.N, P = g.P, BASE = { d0: 0, n: N, prof: 0.8, esp: 0.4, y0: 1.0, yBase: 0, yChao: 0, par: 1.0, tinta: tArq, tintaParede: tMuro, nariz: true, topo: { larg: 0, par: 0 } };
  /* O CORREDOR debaixo de cada arquibancada, da fileira 7 até o fundo (6,4
     m de largura, 3 de pé-direito). O VOMITÓRIO é uma vala a céu aberto
     (a arquibancada é baixa demais pra túnel): o poço das fileiras 2 a 6,
     com o piso na altura da fileira 1, e a escada que desce até o chão do
     corredor. Um em cada escada da foto. */
  const C = { dI: 5.6, dF: P, y: 0, h: 3.0 };
  const VALA = { tipo: 'vala', yC: C.y, hC: C.h };
  const escada = (fam, u) => ({ ...faixaNoU(fam, u, 1.2, 6), k0: 0, k1: N - 1 });
  const { divN, uN } = pc;
  /* norte: visitante 1º (da ponta até x −26 da foto), 2º (até a divisória), a PM (entre as divisórias do dono) */
  const valasN = pc.norte.map(v => ({ ...v, tunel: VALA }));
  const An = arquibancada(O, Fn, { ...BASE, u0: 0, u1: 1, semente: 3,
    vom: valasN, escadas: valasN.map(v => escada(Fn, v.u)),
    /* a porta de cada ponta: a do oeste é a do visitante (o caminho do portão 3); a do leste passa pra do leste */
    portasPonta: [{ u: 0, d0: 7.6, d1: 10.0, h: 2.6 }, { u: 1, d0: 8.1, d1: 10.8, h: 2.6 }],
    extras: [...divN, uN(-26)] });
  /* leste e sul: o portão 1 corta a do leste (10,6 m); a vala do meio da do
     sul (a da foto) vai do corredor até o campo, fechada por portão — é a
     entrada da PM e da maca, não é vomitório de torcida */
  const corte = pc.corte, uMeioSul = pc.acesso.u;
  const acesso = { ...pc.acesso, k0: 0, k1: 6, yPiso: 0, tunel: VALA, servico: true };
  const valasL = pc.leste.map(v => ({ ...v, tunel: VALA }));
  const Al = arquibancada(O, Fl, { ...BASE, u0: 0, u1: 5, semente: 4,
    cortes: [corte], vom: [...valasL, acesso], aberturas: [acesso],
    escadas: [...valasL.map(v => escada(Fl, v.u)), ...[0.5, 2.5, 4.5].map(u => ({ ...faixaNoU(Fl, u, 1.2, 6), k0: 0, k1: N - 1 }))],
    portasPonta: [{ u: 0, d0: 6.8, d1: 9.5, h: 2.6 }, { u: corte.ua, d0: 7.6, d1: 10.0, h: 2.6 }, { u: corte.ub, d0: 7.6, d1: 10.0, h: 2.6 }],
    extras: [uMeioSul] });
  for (const u of divN) An.gradil(u);
  const qA = Fl.ponto(0, acesso.ua), qB = Fl.ponto(0, acesso.ub);
  portao(O, true, g.zFS, Math.min(qA[0], qB[0]), Math.max(qA[0], qB[0]), 2.2, '#2f5f8a');

  /* OS CORREDORES: o do norte (visitante | PM | mandante, com o gradil do
     chão ao teto nas divisórias), o do leste até o portão 1 e o do leste e
     sul depois dele; e a passagem do nordeste, entre a ponta da do norte
     e a da do leste */
  const zC0 = Fl.ponto(0, corte.ua)[1], zC1 = Fl.ponto(0, corte.ub)[1], zG1 = (zC0 + zC1) / 2;
  /* o portão 2 no muro do sul, no mesmo ponto da reta do sul que na foto (x 25) */
  const xG2 = Fl.ponto(0, pc.uL(25, 45))[0];
  const E2 = planoDaEntrada(Fl, [xG2, g.zMS + 0.2], [0, -1], 3.0, C.dF);
  const cN = corredor(O, S, Fn, { u0: 0, u1: 1, ...C, bocas: bocasDe(An, C), gradis: divN,
    zonas: [zona(0, divN[0], 'visitante'), zona(divN[0], divN[1], 'pm'), zona(divN[1], 1, 'mandante')], pilar: 7.5, balcao: 15, semente: 0 });
  const cL1 = corredor(O, S, Fl, { u0: 0, u1: corte.ua, ...C, bocas: bocasDe(Al, C), zonas: [zona(0, corte.ua, 'mandante')], pilar: 7.5, balcao: 15, semente: 3 });
  const cL2 = corredor(O, S, Fl, { u0: corte.ub, u1: 5, ...C, bocas: bocasDe(Al, C), portas: [{ ...E2.vaoCorr, h: C.h }],
    zonas: [zona(corte.ub, 5, 'mandante')], pilar: 7.5, balcao: 15, semente: 5 });
  passagemReta(O, g.xN1, g.xC, g.zFN - 10.8, g.zFN - 8.1, 0, 2.6);

  /* A PASSARELA DE CIMA (y 7,0) até o muro, e o muro caiado: 8,1 m onde
     tem arquibancada, 3 m no oeste; os portões e o vão do túnel */
  const yP = An.yn, Mpiso = O.m('piso'), Mpar = O.m('parede');
  const xMi = g.xML - 0.2, xOi = g.xMO + 0.2, zNi = g.zMN + 0.2, zSi = g.zMS - 0.2, zNA = g.zFN - P;
  chaoPlano(Mpiso, retangulo(g.xN0, g.xC, zNi, zNA), [], yP, tPasso, 4);
  const linha = (d, u0, u1) => Fl.amostras(u0, u1).map(u => { const q = Fl.ponto(d, u); return [q[0], q[1]]; });
  chaoPlano(Mpiso, [...linha(P, 0, corte.ua), [xMi, zC0], [xMi, zNi], [g.xC, zNi]], [], yP, tPasso, 4);
  chaoPlano(Mpiso, [...linha(P, corte.ub, 5), [xOi, zSi], [xMi, zSi], [xMi, zC1]], [], yP, tPasso, 4);
  /* o gradil das divisórias do dono segue pela passarela até o muro (senão o visitante dava a volta por cima) */
  for (const u of divN) { const x = Fn.ponto(P, u)[0]; gradilReto(O, x, zNA, x, zNi, yP, 2.4); }
  /* o vão do nordeste entre as duas arquibancadas: fechado em cima da passagem até a passarela */
  bloco(Mpiso, g.xN1, g.xC, zNA, g.zFN - 8.1, 2.6, yP, tPasso);
  /* as bordas soltas da passarela: a ponta oeste da do norte e os lados do portão */
  bloco(Mpar, g.xN0 - 0.2, g.xN0, zNi, zNA, 0, yP + 1.1, tMuro);
  bloco(Mpar, g.xFL + P, xMi, zC0 - 0.2, zC0, 0, yP + 1.1, tMuro);
  bloco(Mpar, g.xFL + P, xMi, zC1, zC1 + 0.2, 0, yP + 1.1, tMuro);
  const hA = yP + 1.1;
  /* o vão do túnel do portão 3 no muro do oeste, e o portão de serviço */
  const zT0 = g.zMN + 1.4, zT1 = g.zMN + 6.2, zS0 = -5.9, zS1 = 4.2, zSO = g.zFS - g.rSO;
  /* [x0, z0, x1, z1, altura, o lado de fora, vãos]: a barra azul por fora e o capeamento */
  const MUROS = [
    [g.xMO - 0.2, g.zMN, g.xN0, g.zMN, 3.0, -1, []], [g.xN0, g.zMN, g.xML + 0.2, g.zMN, hA, -1, []],
    [g.xMO - 0.2, g.zMS, g.xML + 0.2, g.zMS, hA, 1, [[xG2 - 1.5, xG2 + 1.5, C.h]]],
    [g.xML, g.zMN - 0.2, g.xML, g.zMS + 0.2, hA, 1, [[zC0, zC1]]],
    [g.xMO, g.zMN - 0.2, g.xMO, zSO, 3.0, -1, [[zS0, zS1], [zT0, zT1]]], [g.xMO, zSO, g.xMO, g.zMS + 0.2, hA, -1, []]
  ];
  for (const [x0, z0, x1, z1, h, fora, vaos] of MUROS) {
    muro(Mpar, x0, z0, x1, z1, 0.4, h, tMuro, vaos);
    acabamentoDoMuro(O, x0, z0, x1, z1, 0.4, h, fora, vaos, lin('#2f5f8a'), lin('#d3cec3'));
  }
  /* o portão do oeste é de serviço (a ambulância): fica fechado */
  portao(O, false, g.xMO, zS0, zS1, 2.8, '#35607f');

  /* PORTÃO 1 (mandante): o corte da do leste. O portão do muro aberto pra
     fora, a viga com a placa, a fila de catracas; dentro, uma porta de cada
     lado pro corredor (a ponta de cada pedaço) e, no lado do campo, o
     portão fechado. Por fora, o ARCO com o nome do estádio e a
     bilheteria do lado */
  const Q1 = quadro([g.xML + 0.2, zG1], [-1, 0]);
  portao(O, false, g.xML, zC0, zC1, 3.2, '#2f5f8a', 1);
  bloco(O.m('pintura'), g.xML - 0.15, g.xML + 0.15, zC0, zC1, 3.5, 4.2, lin('#3b4046'));
  placaSinal(O, Q1, -0.07, -1.8, 1.8, 3.4, 4.3, SINAL['PORTÃO 1 · MANDANTE']);
  const n1 = catracas(O, Q1, 4, -5.2, 5.2, 0);
  portao(O, false, g.xFL - 0.1, zC0, zC1, 2.4, '#2f5f8a');
  const Marco = O.m('parede');
  for (const [ta, tb] of [[5.45, 6.65], [-6.65, -5.45]]) caixaL(Marco, Q1, -1.2, -0.02, ta, tb, 0, 10.4, tMuro, 4);
  caixaL(Marco, Q1, -1.2, -0.02, -5.45, 5.45, 8.4, 10.4, tMuro, 4);
  const vA = [Q1.L(-1.2, -5.45, 8.4), Q1.L(-0.02, -5.45, 8.4), Q1.L(-0.02, 5.45, 8.4), Q1.L(-1.2, 5.45, 8.4)];
  Marco.quad(vA[0], vA[1], vA[2], vA[3], pl(vA[0], 4), pl(vA[1], 4), pl(vA[2], 4), pl(vA[3], 4), vezes(tMuro, 0.85), [0, -1, 0]);
  letreiro(O, Q1, -1.2, opc.nome, 8.75, 1.3, 12.2, { placa: lin('#2f5f8a'), sai: 0.1, margem: 0.2, cor: '#ffffff', sombra: '#9db3c9' });
  bilheteria(O, quadro([g.xML + 0.2, zG1 - 11.3], [-1, 0]), -2.5, -0.02, -1.5, 1.5, 2.7);
  /* o nome pintado no muro, em azul: no leste (entre o muro do norte e a
     bilheteria) e no sul (entre o muro do oeste e o portão 2) */
  const zLa = g.zMN + 1.2, zLb = zG1 - 13.8, xSa = g.xMO + 1.2, xSb = xG2 - 4.5;
  letreiro(O, quadro([g.xML + 0.2, (zLa + zLb) / 2], [-1, 0]), -0.02, opc.nome, 3.3, 3.2, zLb - zLa, { cor: '#1f4f8c', sombra: null });
  letreiro(O, quadro([(xSa + xSb) / 2, g.zMS + 0.2], [0, -1]), -0.02, opc.nome, 3.3, 3.2, Math.min(44, xSb - xSa), { cor: '#1f4f8c', sombra: null });
  /* PORTÃO 2 (mandante): no muro do sul, o pórtico com a marquise e a
     fila; o salão de 3 m passa debaixo da passarela até o corredor da do
     sul, com a placa do corredor no fundo */
  const n2 = salao(O, E2, { h: C.h, catraca: 2, fundo: SINAL['CORREDOR · VOMITÓRIOS'] }).catracas;
  const r2 = porticoDoPortao(O, E2, { h: C.h, sai: 3.2, fila: [-1.0, -6.0], lado: 'mandante', placa: SINAL['PORTÃO 2 · MANDANTE'], setor: SINAL['SETOR MANDANTE'], cor: tMuro }).raias;

  /* PORTÃO 3 (visitante): o túnel de lona do noroeste, de fora do muro até
     perto do campo. Na boca, o pórtico com a placa e as catracas; do fim
     do túnel, o caminho cercado de gradil até a porta da ponta oeste da
     do norte */
  const Q3 = quadro([g.xMO - 3.7, g.zMN + 0.2], [Math.SQRT1_2, Math.SQRT1_2]), L3 = Math.hypot(11.4, 11.4);
  {
    /* o arco é meia elipse: 3,6 m de largura e 2,6 de altura (um meio
       cilindro de 1,8 m não deixava ninguém passar em pé) */
    const Ml = O.m('lona'), r = 1.8, alto = 2.6, lados = 12, aneis = Math.ceil(L3 / 1.2);
    for (let j = 0; j < aneis; j++) for (let k = 0; k < lados; k++) {
      const s0 = j / aneis * L3, s1 = (j + 1) / aneis * L3, g0 = k / lados * Math.PI, g1 = (k + 1) / lados * Math.PI;
      const Pt = (s, gg) => Q3.L(s, -r * Math.cos(gg), alto * Math.sin(gg));
      const cor = j % 2 ? lin('#dcd8cd') : lin('#cfcabe'), gm = (g0 + g1) / 2, dn = Q3.dir(0, -Math.cos(gm) / r);
      Ml.quad(Pt(s0, g0), Pt(s1, g0), Pt(s1, g1), Pt(s0, g1), [0, 0], [1, 0], [1, 1], [0, 1], cor, [dn[0], Math.sin(gm) / alto, dn[2]]);
    }
    const Mp = O.m('pintura'), VINHO = lin('#7a2a24');
    for (const t of [-2.4, 2.4]) caixaL(Mp, Q3, -1.3, -1.0, t - 0.15, t + 0.15, 0, 3.0, VINHO);
    caixaL(Mp, Q3, -1.3, -1.0, -2.55, 2.55, 2.7, 3.0, VINHO);
    placaSinal(O, Q3, -1.44, -2.2, 2.2, 3.05, 4.15, SINAL['PORTÃO 3 · VISITANTE']);
    for (const t of [-1, 1]) { const a = Q3.L(-1.15, t * 2.25, 0), b = Q3.L(0, t * 1.8, 0); gradilReto(O, a[0], a[2], b[0], b[2], 0, 2.4); }
    const fa = Q3.L(L3, -1.8, 0), fb = Q3.L(L3, 1.8, 0);
    gradilReto(O, fa[0], fa[2], g.xN0 - 0.2, g.zFN - 10.0, 0, 2.4);
    gradilReto(O, fb[0], fb[2], g.xN0 - 0.2, g.zFN - 7.6, 0, 2.4);
  }
  const n3 = catracas(O, Q3, -0.5, -1.95, 1.95, 0);

  /* o banco de reservas na frente da do norte, a mureta branca do gramado, o gol, as bandeirinhas */
  banco(O, -8.8, -2.8, g.zFN + 1.9, g.zFN + 0.1, true);
  banco(O, 2.6, 8.6, g.zFN + 1.9, g.zFN + 0.1, true, '#a11d2b');
  paredeDeAnel(O.m('pintura'), Fg, 0, 0, 0.25, lin('#f2f0ea'), -1);
  paredeDeAnel(O.m('pintura'), Fg, 0.2, 0, 0.25, lin('#f2f0ea'), 1);
  faixaDeAnel(O.m('pintura'), Fg, 0, 0.2, 0.25, lin('#f2f0ea'));
  gramado(O, Fg, 0, 'campo:10', { comp: 2 * g.C, larg: 2 * g.L, listra: 2 * g.C / 16, cores: ['#7f9a4c', '#86a052'], falha: 1.0, linha: 0.55, semente: 101 });
  gol(O, -g.C, -1); gol(O, g.C, 1);
  bandeirinhas(O, g.C, g.L);
  /* (o do noroeste fica fora da frente do portão 3) */
  for (const [x, z] of [[g.xMO + 2.6, g.zMN - 3.0], [g.xML + 2.6, g.zMN - 2.6], [g.xML + 2.6, g.zMS + 2.6], [g.xMO - 2.7, g.zMS + 2.6]]) posteDeLuz(O, x, z, 20);
  /* O CHÃO: a terra batida de dentro, fora das arquibancadas; debaixo
     delas, o chão de concreto (na frente do corredor e debaixo da
     passarela), que só aparece no corte; o de fora e a estrada do leste */
  const cA = Fl.ponto(0, corte.ua), cB = Fl.ponto(0, corte.ub);
  chaoPlano(O.m('terra'), [[xOi, zNi], [g.xN0, zNi], [g.xN0, g.zFN], [g.xN1, g.zFN], [g.xN1, g.zFN - 8.1], [g.xC, g.zFN - 8.1],
    ...linha(0, 0, corte.ua), [xMi, cA[1]], [g.xML + 0.2, cA[1]], [g.xML + 0.2, cB[1]], [xMi, cB[1]], ...linha(0, corte.ub, 5), [xOi, zSO],
    [xOi, zS1], [g.xMO - 0.2, zS1], [g.xMO - 0.2, zS0], [xOi, zS0], [xOi, zT1], [g.xMO - 0.2, zT1], [g.xMO - 0.2, zT0], [xOi, zT0]], [contornoDe(Fg, 0.2)], -0.01, lin('#b7ae8d'), 6);
  const Mb = O.m('piso'), uSul = x => Fl.uDe(x, g.zFS + P).u;
  chaoDeBaixo(Mb, An, C.dI, 0, tBaixo, 0, 1);
  chaoDeBaixo(Mb, Al, C.dI, 0, tBaixo, 0, 5, [corte]);
  chaoPlano(Mb, [[g.xN0, zNi], [g.xC, zNi], [g.xC, g.zFN - 10.8], [g.xN1, g.zFN - 10.8], [g.xN1, zNA], [g.xN0, zNA]], [], 0, tBaixo, 4);
  chaoPlano(Mb, [...linha(P, 0, corte.ua), [xMi, zC0], [xMi, zNi], [g.xC, zNi]], [], 0, tBaixo, 4);
  chaoPlano(Mb, [...linha(P, corte.ub, uSul(xG2 + 1.5)), [xG2 + 1.5, zSi], [xMi, zSi], [xMi, zC1]], [], 0, tBaixo, 4);
  chaoPlano(Mb, [...linha(P, uSul(xG2 - 1.5), 5), [xOi, zSi], [xG2 - 1.5, zSi]], [], 0, tBaixo, 4);
  /* (no mapa, só até a divisa do terreno: a rua em volta é do mapa) */
  const T = g.terreno;
  chaoPlano(O.m('terra'), opc.mapa ? retangulo(T.x0, T.x1, T.z0, T.z1) : retangulo(T.x0 - 19, T.x1 + 23, T.z0 - 20, T.z1 + 20), [retangulo(g.xMO - 0.2, g.xML + 0.2, g.zMN - 0.2, g.zMS + 0.2)], -0.01, lin('#f2e2cc'), 6);

  /* OS SETORES (as imagens do dono): norte v1, v2, PM; leste-sul m1 (até o portão), m2 (até a vala do meio), m3 */
  const setores = camadaDosSetores(S, G, [
    { id: 'v1', arq: An, ua: 0, ub: uN(-26), faixa: 10 },
    { id: 'v2', arq: An, ua: uN(-26), ub: divN[0], faixa: 10 },
    { id: 'pm', arq: An, ua: divN[0], ub: divN[1] },
    { id: 'm1', arq: Al, ua: 0, ub: corte.ua, faixa: 12 },
    { id: 'm2', arq: Al, ua: corte.ub, ub: uMeioSul, faixa: 12 },
    { id: 'm3', arq: Al, ua: uMeioSul, ub: 5, faixa: 12 }
  ], 12);
  marcador(G, 'Portão 1 · mandante', '#1b7f3b', g.xML + 4.4, 6, zG1, 16);
  marcador(G, 'Portão 2 · mandante', '#1b7f3b', xG2, 6, g.zMS + 4.6, 16);
  marcador(G, 'Portão 3 · visitante', '#c62828', g.xMO - 6.9, 6, g.zMN - 3.8, 16);
  const vomitorios = [...An.vomitorios, ...Al.vomitorios].filter(v => v.tunel && !v.servico).length;
  const m = v => v.toFixed(1).replace('.', ',');
  return dentroDo((x, z) => x > g.xMO && x < g.xML && z > g.zMN && z < g.zMS, {
    aneis: [{ nome: 'Norte (visitante)', fileiras: N, degrau: '0,80 × 0,40 m', lugares: An.lugares() },
            { nome: 'Leste e sul', fileiras: N, degrau: '0,80 × 0,40 m', lugares: Al.lugares() }],
    setores, livre: `o resto da do norte, do leste da PM até a ponta (${m(Fn.ponto(0, divN[1])[0])} a ${m(g.xN1)} m), fica sem torcida`,
    vomitorios, tipoVom: 'em vala (a arquibancada é baixa demais pra túnel): o poço das fileiras 2 a 6 e a escada até o chão do corredor',
    alturaArq: yP + 1.1, luz: 'quatro postes de 20 m nos cantos',
    fachada: 'o muro caiado com a barra azul e o capeamento, o nome pintado no leste e no sul, o arco do portão 1 com o nome e a bilheteria do lado dele',
    entradas: [
      { nome: 'Portão 1', lado: 'mandante', onde: `o corte da do leste: o arco com o nome, o portão do muro, ${n1} catracas e uma porta de cada lado pro corredor`,
        chega: [cL1.zonaEm(corte.ua - 1e-3), cL2.zonaEm(corte.ub + 1e-3)], ...naRua(Q1) },
      { nome: 'Portão 2', lado: 'mandante', onde: `no muro do sul: o pórtico com a marquise, a fila de ${r2} raias e o salão de 3 m, com ${n2} catracas, até o corredor da do sul`,
        chega: [cL2.zonaEm((E2.vaoCorr.ua + E2.vaoCorr.ub) / 2)], ...naRua(E2.Q) },
      { nome: 'Portão 3', lado: 'visitante', onde: `o túnel de lona do noroeste: ${n3} catracas na boca e o caminho cercado até a porta do corredor da do norte`,
        chega: [cN.zonaEm(1e-3)], ...naRua(Q3) }
    ],
    corredores: [{ nome: 'Norte', zonas: 'visitante · PM · mandante', ...cN }, { nome: 'Leste (até o portão 1)', zonas: 'mandante', ...cL1 },
                 { nome: 'Leste e sul (do portão 1 à ponta)', zonas: 'mandante', ...cL2 }],
    servico: 'a vala do meio da do sul (a da foto) liga o corredor ao campo, fechada por portão: a entrada da PM e da maca; o portão do oeste, no muro, é de serviço e fica fechado',
    cortes: [{ nome: 'Corte no corredor', y: C.y + C.h - 0.05 }]
  });
}

/* ======================================================
   O ESTÁDIO DE 20 MIL (nível 2)
   foto: 9,7 px por metro, campo de 105 × 68; no jogo (G20), campo de
   56 × 36, pista de 3 m e 22 fileiras
   ====================================================== */
function montar20(O, S, G, opc) {
  const F = anel20(), F0 = anel20Foto(), uF = (x, z) => uDaFoto(F0, x, z), g = G20;
  const tArq = lin('#d9caa9'), tMuro = lin('#e3d8c1'), tPista = lin('#a7a59e'), tBaixo = lin('#8b8478');
  const N = g.N, W = 4.0, dFac = g.dFac;
  /* O CORREDOR em volta, debaixo da arquibancada: da fileira 12 até a
     fachada (8,55 m de largura, 4 de pé-direito). O VOMITÓRIO é o poço
     das fileiras 2 a 8 e o túnel: a escada desce por baixo das fileiras
     até o chão e o túnel segue reto até a parede de dentro do corredor
     (o teto dele, a 4 m, passa 20 cm embaixo da fileira 9). */
  const C = { dI: 9.6, dF: g.dP, y: 0, h: 4.0 };
  const TUNEL = { tipo: 'tunel', dI: C.dI, yC: C.y, hT: 2.6, hC: C.h };
  /* os 8 vomitórios da foto e os dois do meio do leste e do oeste (sem o
     do oeste, o 1º escalão visitante ficava sem vomitório nenhum) */
  const uN = x => uF(x, -60), uO = z => uF(-80, z);
  const div = [uN(-37.6), uN(-25.3), uO(29.4), uO(17.9)];
  const vom = VOM20.map(([x, z]) => longeDosGradis(F, { ...faixaNoU(F, uF(x, z), W, 4.4), k0: 2, k1: 8, tunel: TUNEL }, div, 0.9, 4.4));
  /* os túneis do meio do norte e do sul (os dos jogadores, ao nível do campo) */
  const tuneis = [[0, -47], [0, 47]].map(([x, z]) => ({ ...faixaNoU(F, uF(x, z), 3.6, 2), k0: 0, k1: 5, yPiso: 0 }));
  const esc = (u, k0) => ({ ...faixaNoU(F, u, 1.2, 8), k0, k1: N - 1 });
  /* v1 | v3 no oeste: entre o vomitório do meio e o do noroeste */
  const uV13 = uO(-16.9);
  /* OS PORTÕES: um vão de 5 × 3,4 m na fachada (a porta de enrolar, a
     placa em cima e as catracas do lado de fora); o corredor está logo
     atrás dela */
  const HP = 3.4;
  const naFachada = u => { const q = F.ponto(dFac, u); return planoDaEntrada(F, [q[0], q[1]], [-q[2], -q[3]], 5, C.dF); };
  /* cada um com o pórtico e a marquise; a fila fica entre a fachada e o
     muro (no sul não cabe: o muro está a 1,9 m). O 2 fica a 12 m do meio
     do sul (a foto o põe em x 14 de 52): perto do meio, batia na torre */
  const P = [
    { E: naFachada(uF(100, 0)), nome: 'Portão 1', lado: 'mandante', placa: 'PORTÃO 1 · MANDANTE', sai: 3.0, fila: [-1.6, -5.7], onde: 'no meio da fachada do leste, debaixo do letreiro, de frente pro portão do muro do leste' },
    { E: naFachada(F.uDe(12, 80).u), nome: 'Portão 2', lado: 'mandante', placa: 'PORTÃO 2 · MANDANTE', sai: 1.4, fila: null, onde: 'na fachada do sul (x 12), de frente pro portão do muro do sul' },
    { E: naFachada(uF(-100, -18)), nome: 'Portão 3', lado: 'visitante', placa: 'PORTÃO 3 · VISITANTE', sai: 3.0, fila: [-1.6, -4.4], onde: 'na fachada do oeste, de frente pro portão do muro do oeste' }
  ];
  const ALTO = 1.0 + N * 0.4 + 1.1;
  const A = arquibancada(O, F, {
    u0: 0, u1: 9, d0: 0, n: N, prof: 0.8, esp: 0.4, y0: 1.0, yBase: 0, par: 1.0, tinta: tArq, tintaParede: tMuro, semente: 7,
    topo: { larg: 0.55, par: 1.1, fachada: true, yChao: 0, andar: ALTO / 2, corFachada: tMuro, vaos: P.map(p => ({ ...p.E.vao(p.E.uEm(0, -p.E.hl), p.E.uEm(0, p.E.hl)), h: HP })) },
    vom: [...vom, ...tuneis], aberturas: tuneis.map(t => ({ ua: t.ua, ub: t.ub })),
    escadas: [
      esc(0, 6), esc(4.5, 6), esc(2.5, 0), esc(6.5, 0), esc(1.5, 0), esc(3.5, 0), esc(5.5, 0), esc(7.5, 0),
      ...vom.map(v => esc(v.u, 9))
    ],
    extras: [...div, 1.5, 3.5, 5.5, 7.5, uV13]
  });
  for (const u of div) A.gradil(u);
  /* o corredor: visitante do oeste ao norte, a PM do norte, mandante do norte ao oeste, a PM do oeste */
  const corr = corredor(O, S, F, { u0: 0, u1: 9, ...C, bocas: bocasDe(A, C), portas: P.map(p => ({ ...p.E.vaoCorr, h: HP })), gradis: div,
    zonas: [zona(div[3], div[0], 'visitante'), zona(div[0], div[1], 'pm'), zona(div[1], div[2] + 9, 'mandante'), zona(div[2], div[3], 'pm')],
    pilar: 9, balcao: 16, semente: 1 });
  for (const p of P) {
    p.catracas = salao(O, p.E, { h: HP, catraca: -1.0 }).catracas;
    p.raias = porticoDoPortao(O, p.E, { h: HP, sai: p.sai, fila: p.fila, lado: p.lado, placa: SINAL[p.placa], setor: SINAL[p.lado === 'visitante' ? 'SETOR VISITANTE' : 'SETOR MANDANTE'] }).raias;
  }
  /* A FACHADA: o relevo (menos na torre do meio do norte e do sul) e o
     letreiro com o nome em cima do portão 1 e no oeste, no andar de cima
     (a placa escura acima da placa do portão, abaixo da cimalha) */
  const TORRE = 8.4, zF = g.B0 + dFac;
  const relevo = fachadaDetalhada(O, A, { pilar: [0.8, 0.5], portas: P.map(p => p.E), cor: vezes(tMuro, 1.04), corBase: lin('#7a746a'),
    pula: [faixaNoU(F, 0, TORRE + 0.4, dFac), faixaNoU(F, 4.5, TORRE + 0.4, dFac)] });
  const yLet = ALTO - 1.3 - 0.5 - 2.2;
  for (const [u, w] of [[2.5, [-1, 0]], [uF(-95, 4), [1, 0]]]) { const q = F.ponto(dFac, u); letreiro(O, quadro([q[0], q[1]], w), 0, opc.nome, yLet, 2.2, 28, { placa: lin('#2c3640'), sai: 0.75 }); }

  /* A PISTA cinza, as placas na beira do gramado (com o vão do túnel no
     meio do norte e do sul), o gramado, os gols e os bancos (os cobertos
     no sul, os abertos no norte) */
  const [cc, cl2] = g.campo, CX = cc / 2, CZ = cl2 / 2, dG = -g.pista;
  faixaDeAnel(O.m('piso'), F, dG, 0, 0, tPista, 4);
  placasNoAnel(O, F, dG, [faixaNoU(F, 0, 4.2, dG), faixaNoU(F, 4.5, 4.2, dG)]);
  gramado(O, F, dG, 'campo:20', { comp: cc, larg: cl2, listra: cc / 20, cores: ['#5a8538', '#669343'], falha: 0.35, linha: 0.9, semente: 202,
    tecnicas: [[-12, CZ + 0.2, -5, CZ + 2.4], [5, CZ + 0.2, 12, CZ + 2.4], [-11, -CZ - 2.4, -5, -CZ - 0.2], [5, -CZ - 2.4, 11, -CZ - 0.2]] });
  gol(O, -CX, -1); gol(O, CX, 1);
  bandeirinhas(O, CX, CZ);
  banco(O, -10.5, -5.5, -CZ - 0.8, -CZ - 1.6, false);
  banco(O, 5.5, 10.5, -CZ - 0.8, -CZ - 1.6, false);
  banco(O, -11.5, -5.5, CZ + 0.5, CZ + 2.4, true);
  banco(O, 5.5, 11.5, CZ + 0.5, CZ + 2.4, true, '#a11d2b');

  /* O TERRENO: o muro (2,4 m) com os três portões de correr abertos, cada
     um de frente pro dele, as bilheterias, as torres do meio do norte e
     do sul, as quatro torres de luz na quina, o asfalto de dentro, a
     calçada e a rua */
  const Mpar = O.m('parede'), xM = g.xM, zN = g.zN, zS = g.zS;
  const eixo = E => E.Q.P0, z1 = eixo(P[0].E)[1], x2 = eixo(P[1].E)[0], z3 = eixo(P[2].E)[1];
  muro(Mpar, -xM, zN, xM, zN, 0.3, 2.4, tMuro);
  muro(Mpar, -xM, zS, xM, zS, 0.3, 2.4, tMuro, [[x2 - 6, x2 + 6]]);
  portao(O, true, zS, x2 - 6, x2 + 6, 2.4, '#2f5f8a', -2);
  for (const [x, zc] of [[xM, z1], [-xM, z3]]) {
    muro(Mpar, x, zN, x, zS, 0.3, 2.4, tMuro, [[zc - 7, zc + 7]]);
    portao(O, false, x, zc - 7, zc + 7, 2.4, '#2f5f8a', -2 * Math.sign(x));
    /* as bilheterias dos dois lados do portão do muro, com a janela pro caminho */
    for (const [z, sz] of [[zc - 8.6, -1], [zc + 8.6, 1]]) bilheteria(O, quadro([x - Math.sign(x) * 3.2, z], [0, sz]), 0, 3.0, -1.5, 1.5, 2.8);
  }
  for (const s of [-1, 1]) bloco(Mpar, -TORRE / 2, TORRE / 2, s < 0 ? -zF - 1.8 : zF, s < 0 ? -zF : zF + 1.8, 0, A.yn + 1.1, tMuro);
  /* a torre de luz: no meio do caminho da quina da fachada pra quina do muro */
  const qQ = F.ponto(dFac, 1.5);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) torreDeLuz(O, sx * (qQ[0] + 0.6 * (xM - qQ[0])), sz * (-qQ[1] + 0.6 * (-zN + qQ[1])), 30, 7, 4.4);
  const buraco = contornoDe(F, dFac);
  chaoPlano(O.m('asfalto'), retangulo(-xM, xM, zN, zS), [buraco], 0, lin('#e6e6e6'), 6);
  /* a calçada e a rua em volta (no mapa, a rua é do mapa) */
  if (!opc.mapa) {
    chaoPlano(O.m('piso'), retangulo(-xM - 3, xM + 3, zN - 3, zS + 3), [retangulo(-xM, xM, zN, zS)], 0.02, lin('#c9c6be'), 4);
    chaoPlano(O.m('asfalto'), retangulo(-xM - 14, xM + 14, zN - 14, zS + 14), [retangulo(-xM - 3, xM + 3, zN - 3, zS + 3)], -0.02, lin('#c4c4c4'), 6);
  }
  /* o chão de baixo da arquibancada, na frente do corredor (só aparece no corte) */
  chaoDeBaixo(O.m('piso'), A, C.dI, 0, tBaixo);

  /* OS SETORES: norte v2 | PM | m3; leste m1; sul e sudoeste m2; oeste PM, v1; noroeste v3 */
  const setores = camadaDosSetores(S, G, [
    { id: 'v2', arq: A, ua: 7.5, ub: div[0], faixa: 16 },
    { id: 'pm', arq: A, ua: div[0], ub: div[1] },
    { id: 'm3', arq: A, ua: div[1], ub: 10.5, faixa: 12 },
    { id: 'm1', arq: A, ua: 1.5, ub: 3.5, faixa: 16 },
    { id: 'm2', arq: A, ua: 3.5, ub: div[2], faixa: 12 },
    { id: 'pm', arq: A, ua: div[2], ub: div[3] },
    { id: 'v1', arq: A, ua: div[3], ub: uV13, faixa: 16 },
    { id: 'v3', arq: A, ua: uV13, ub: 7.5, faixa: 16 }
  ], 14);
  for (const p of P) { const q = p.E.Q.L(-5, 0, 0); marcador(G, `${p.nome} · ${p.lado}`, p.lado === 'visitante' ? '#c62828' : '#1b7f3b', q[0], 6, q[2], 12); }
  return dentroDo((x, z) => F.dentroDe(x, z, dFac), {
    aneis: [{ nome: 'Anel único', fileiras: N, degrau: '0,80 × 0,40 m', lugares: A.lugares() }],
    setores, livre: '', vomitorios: vom.length, tipoVom: 'com túnel: o poço das fileiras 2 a 8, a escada que desce por baixo das fileiras e o túnel até o corredor',
    alturaArq: A.yn + 1.1, luz: 'quatro torres de treliça de 30 m nas quinas',
    fachada: `concreto aparente em ${Math.round(ALTO / relevo.andar)} andares de ${relevo.andar.toFixed(1).replace('.', ',')} m: ${relevo.pilares} pilares, a faixa de cada laje, o cobogó e o brise, o embasamento e a cimalha; o letreiro com o nome em cima do portão 1 e no oeste; as quatro bilheterias do lado dos portões do muro`,
    entradas: P.map(p => ({ nome: p.nome, lado: p.lado, onde: `${p.onde}; o pórtico com a marquise${p.raias ? `, a fila de ${p.raias} raias` : ''} e ${p.catracas} catracas do lado de fora`, chega: [corr.zonaEm((p.E.vaoCorr.ua + p.E.vaoCorr.ub) / 2)], ...naRua(p.E.Q) })),
    corredores: [{ nome: 'O anel inteiro', zonas: 'visitante · PM · mandante · PM', ...corr }],
    servico: 'os túneis do meio do norte e do sul são os dos jogadores (não ligam no corredor); as duas torres do meio do norte e do sul não têm porta pra rua',
    cortes: [{ nome: 'Corte no corredor', y: C.y + C.h - 0.05 }]
  });
}

/* ======================================================
   O ESTÁDIO DE 40 MIL (nível 3)
   foto: 7,8 px por metro, campo de 105 × 68; no jogo (G40), campo de
   56 × 36, fosso de 3 m, 15 fileiras embaixo e 15 em cima
   ====================================================== */
function montar40(O, S, G, opc) {
  const F = anel40(), F0 = anel40Foto(), uF = (x, z) => uDaFoto(F0, x, z), g = G40;
  const tArq = lin('#cbb99a'), tMuro = lin('#d6cbb6'), tCorr = lin('#c7c0b2'), tBaixo = lin('#8b8478');
  const NI = g.NI, NS = g.NS, dFac = g.dFac;
  const yC = 1.2 + NI * 0.42;                        // o corredor entre os anéis (7,5 m)
  const y0s = yC + 1.24;                             // a fileira 0 do anel de cima
  /* OS DOIS CORREDORES: o do chão, debaixo do fim do anel de baixo, do
     corredor entre os anéis e da frente do de cima (4,5 m de pé-direito),
     e o de cima, na altura do corredor entre os anéis (7,5 m), inteiro
     debaixo do anel de cima (a fileira mais baixa em cima dele, a 8, fica
     a 12,9 m), da fileira 8 até a fachada. Entre os dois fica o vão de
     4,9 m das ESCADAS INTERNAS, que levam de um ao outro. */
  const C0 = { dI: 9.0, dF: g.dS + 2.0, y: 0, h: 4.5 };
  const C1 = { dI: g.dS + 6.9, dF: g.dP, y: yC, h: 3.5, laje: true };
  /* os 12 vomitórios do anel de cima (VOM40), como os do de 20 mil: o poço
     das fileiras 1 a 5 (o piso dele é o da fileira 0, a da frente), a
     escada que desce por baixo das fileiras até o piso do corredor de
     cima e o túnel até ele (o teto do túnel, a 11,2 m, passa 10 cm
     embaixo da fileira 6) */
  const W = 4.4, dV = g.dS + 2.8;
  const TS = { tipo: 'tunel', dI: C1.dI, yC: C1.y, hT: 2.5, hC: C1.h };
  /* as divisórias do dono: PM1 (anel de cima, oeste), PM2 (de baixo, oeste), PM3 (de baixo, sul), PM4 (de cima, sudoeste) */
  const u = (x, z) => uF(x, z);
  const pm1 = [u(-110, 6.4), u(-110, -2.6)], pm2 = [u(-79.2, 30.8), u(-83, 20.8)], pm3 = [u(-43.3, 58.5), u(-55, 58)], pm4 = [u(-64.9, 82.2), u(-73.2, 80)];
  const gradisI = [...pm2, ...pm3], gradisS = [...pm1, ...pm4];
  const vom = vomitorios40(F).map(v => ({ ...v, k0: 1, k1: 5, tunel: TS }));
  /* as muretas: no meio de dois vomitórios, de cima a baixo nos dois anéis
     (menos a que cai a menos de 1,5 m de um gradil do anel) */
  const mur = vom.map((v, j) => { const w = vom[(j + 1) % vom.length]; let m = (v.u + w.u + (j === vom.length - 1 ? 9 : 0)) / 2; return m % 9; });
  const longeDe = (gs, d) => m => !gs.some(x => Math.abs((((m - x) % 9) + 13.5) % 9 - 4.5) < larguraU(F, m, d, 1.5));
  const pontes = [[0, -52], [0, 52]].map(([x, z]) => faixaNoU(F, uF(x, z), 4.6, 0));
  const tuneis = [[76, 0], [-76, 0]].map(([x, z]) => ({ ...faixaNoU(F, uF(x, z), 5.0, 2), k0: 0, k1: 6, yPiso: 0 }));
  const escI = [...vom.map(v => ({ ...faixaNoU(F, v.u, 1.4, 5), k0: 0, k1: NI - 1 })), { ...faixaNoU(F, pontes[1].u, 1.4, 5), k0: 0, k1: NI - 1 }];
  /* v1 | v2 em cima: entre o vomitório de (−87, 67) e o de (−100, 52) */
  const vSO = (u(-87.5, 67.6) + u(-100.2, 52.1)) / 2;
  /* os vomitórios do anel de baixo (a foto não mostra a boca deles: o anel
     de baixo parece inteiro de degrau): um sim, um não dos de cima, no
     mesmo u (onde tem escada), das fileiras 2 a 7; o túnel desce a escada
     até o corredor do chão. Nenhum encosta num gradil; se o 3º escalão
     visitante ficar sem, ganha o de cima que cai nele (ou um no meio). */
  const TI = { tipo: 'tunel', dI: C0.dI, yC: C0.y, hT: 2.4, hC: C0.h };
  const semGradil = (v, gs) => { const m = larguraU(F, v.u, 4.0, 1.0); return !gs.some(g2 => [g2, g2 - 9, g2 + 9].some(x => x > v.ua - m && x < v.ub + m)); };
  const vomI = vom.filter((v, j) => j % 2 === 0).map(v => ({ ...faixaNoU(F, v.u, 3.0, 4.0), k0: 2, k1: 7, tunel: TI })).filter(v => semGradil(v, gradisI));
  if (!vomI.some(v => v.u > pm3[1] && v.u < pm2[0])) {
    const w = vom.find(v => v.u > pm3[1] && v.u < pm2[0]);
    vomI.push({ ...faixaNoU(F, w ? w.u : (pm3[1] + pm2[0]) / 2, 3.0, 4.0), k0: 2, k1: 7, tunel: TI });
  }
  /* OS PORTÕES: o salão de 5 m (4,5 de pé-direito) da fachada até o
     corredor do chão, com as catracas logo depois da porta. O 1 no meio
     do leste, o 2 no oeste (8 m ao norte do meio), o 3 (visitante) na
     curva do sudoeste, no meio do que é visitante embaixo e em cima */
  const HP = C0.h;
  const naFachada = uu => { const q = F.ponto(dFac, uu); return planoDaEntrada(F, [q[0], q[1]], [-q[2], -q[3]], 5, C0.dF); };
  const uVis = (Math.max(pm3[1], pm4[1]) + Math.min(pm2[0], pm1[0])) / 2;
  /* cada um com o pórtico e a marquise por cima da pista de ônibus, a faixa
     de pedestre atravessada nela e a fila do outro lado, na praça */
  const fila = [-g.onibus - 0.6, -g.onibus - 5.2];
  const P = [
    { E: naFachada(2.5), nome: 'Portão 1', lado: 'mandante', placa: 'PORTÃO 1 · MANDANTE', onde: 'no meio da fachada do leste, debaixo do letreiro' },
    { E: naFachada(F.uDe(-100, -8).u), nome: 'Portão 2', lado: 'mandante', placa: 'PORTÃO 2 · MANDANTE', onde: 'na fachada do oeste, 8 m ao norte do meio' },
    { E: naFachada(uVis), nome: 'Portão 3', lado: 'visitante', placa: 'PORTÃO 3 · VISITANTE', onde: 'na curva do sudoeste, entre a PM3 e a PM2 embaixo e entre a PM4 e a PM1 em cima' }
  ];
  const ALTO = y0s + NS * 0.52 + 1.1;
  const Ai = arquibancada(O, F, {
    u0: 0, u1: 9, d0: 0, n: NI, prof: 0.8, esp: 0.42, y0: 1.2, yBase: -2.4, par: 1.0, tinta: tArq, tintaParede: tMuro, semente: 9,
    topo: { larg: 2.0, par: 0, corPiso: tCorr },
    vom: [...tuneis, ...vomI], aberturas: [...tuneis.map(t => ({ ua: t.ua, ub: t.ub })), ...pontes],
    escadas: escI, muretas: mur.filter(longeDe(gradisI, 6)).map(m => ({ u: m, k0: 0, k1: NI - 1 })),
    extras: gradisI
  });
  const As = arquibancada(O, F, {
    u0: 0, u1: 9, d0: g.dS, n: NS, prof: 0.8, esp: 0.52, y0: y0s, yBase: yC, par: 1.0, tinta: tArq, tintaParede: tMuro, semente: 10,
    topo: { larg: 2.15, par: 1.1, fachada: true, yChao: 0, andar: ALTO / 3, corFachada: tMuro, vaos: P.map(p => ({ ...p.E.vao(p.E.uEm(0, -p.E.hl), p.E.uEm(0, p.E.hl)), h: HP })) },
    vom, muretas: mur.filter(longeDe(gradisS, 20)).map(m => ({ u: m, k0: 0, k1: NS - 1 })),
    /* o poço abre na fileira da frente; dos lados dele, a escada sobe da fileira 1 até a última */
    escadas: vom.flatMap(v => [-1, 1].map(s => { const c = v.u + s * larguraU(F, v.u, dV, W / 2 + 0.6); return { ...faixaNoU(F, c, 1.0, dV), k0: 1, k1: NS - 1 }; })),
    extras: [...gradisS, vSO, 1.5, 3.5]
  });
  for (const x of gradisI) Ai.gradil(x);
  for (const x of gradisS) As.gradil(x);
  /* AS ESCADAS INTERNAS, no vão entre os dois corredores, uma perto de
     cada portão, com as portas na ponta de perto dele: a do 2 e a do 3
     logo depois do salão (no sentido do u; as do 3 antes da PM2 embaixo e
     da PM1 em cima), a do 1 do outro lado do vomitório do leste que fica
     ao norte dele (dos dois lados do salão do 1 tem vomitório colado).
     Nenhuma fica debaixo de um vomitório nem de um salão. */
  const depoisDoSalao = E => { const uu = Math.max(...[-E.hl, E.hl].flatMap(t => [C0.dF, C1.dI].map(d => E.uEm(E.ate(t, d), t)))); return uu + larguraU(F, uu, C0.dF, 0.4); };
  const vomL = vom.find(v => v.u > 2 && v.u < 2.5);
  const base = { dA: C0.dF, dB: C1.dI, yT: C1.y };
  const escs = [
    { lado: 'mandante', onde: 'na curva do nordeste, depois do vomitório ao norte do portão 1', ...escadaInterna(O, F, { ...base, u0: vomL.ua - larguraU(F, vomL.ua, C0.dF, 1.5), sg: -1 }) },
    { lado: 'mandante', onde: 'na curva do noroeste, do lado do salão do portão 2', ...escadaInterna(O, F, { ...base, u0: depoisDoSalao(P[1].E), sg: 1 }) },
    { lado: 'visitante', onde: 'na curva do sudoeste, do lado do salão do portão 3', ...escadaInterna(O, F, { ...base, u0: depoisDoSalao(P[2].E), sg: 1 }) }
  ];
  /* os corredores e as entradas: o do chão (visitante | PM2 | mandante |
     PM3), com a porta de cada salão e a de baixo de cada escada, os
     salões com as catracas, e o de cima (visitante | PM1 | mandante |
     PM4), com a boca de cada vomitório e a porta de cima de cada escada */
  const cI = corredor(O, S, F, { u0: 0, u1: 9, ...C0, bocas: bocasDe(Ai, C0), portas: [...P.map(p => ({ ...p.E.vaoCorr, h: HP })), ...escs.map(e => e.portaBaixo)], gradis: gradisI,
    zonas: [zona(pm3[1], pm2[0], 'visitante'), zona(pm2[0], pm2[1], 'pm'), zona(pm2[1], pm3[0] + 9, 'mandante'), zona(pm3[0], pm3[1], 'pm')],
    pilar: 9, balcao: 18, semente: 2 });
  for (const p of P) {
    p.catracas = salao(O, p.E, { h: HP, catraca: 1.2, fundo: SINAL['CORREDOR · VOMITÓRIOS'] }).catracas;
    p.raias = porticoDoPortao(O, p.E, { h: HP, sai: g.onibus, fila, lado: p.lado, placa: SINAL[p.placa], setor: SINAL[p.lado === 'visitante' ? 'SETOR VISITANTE' : 'SETOR MANDANTE'] }).raias;
    faixaDePedestre(O, p.E.Q, -0.3, -g.onibus + 0.2, -p.E.hl - 0.5, p.E.hl + 0.5);
  }
  const cS = corredor(O, S, F, { u0: 0, u1: 9, ...C1, bocas: [...bocasDe(As, C1), ...escs.map(e => e.portaCima)], gradis: gradisS,
    zonas: [zona(pm4[1], pm1[0], 'visitante'), zona(pm1[0], pm1[1], 'pm'), zona(pm1[1], pm4[0] + 9, 'mandante'), zona(pm4[0], pm4[1], 'pm')],
    pilar: 9, balcao: 18, semente: 6 });

  /* O FOSSO: o gramado até a mureta de dentro, o fundo de terra 2,4 m
     abaixo; as pontes do norte e do sul (rampa) e as do leste e do oeste
     (os túneis dos jogadores, no nível do campo) */
  const [cc, cl2] = g.campo, CX = cc / 2, CZ = cl2 / 2, dG = -g.fosso, dM = dG + 0.4;
  gramado(O, F, dG, 'campo:40', { comp: cc, larg: cl2, listra: cc / 20, cores: ['#4d7f30', '#5b8f3a'], falha: 0, linha: 0.95, semente: 404,
    tecnicas: [[-12, CZ + 0.2, -5, CZ + 2.4], [5, CZ + 0.2, 12, CZ + 2.4]] });
  const Mp = O.m('parede');
  const vaosDoFosso = [...pontes, ...tuneis];
  paredeDeAnel(Mp, F, dG, 0, 0.45, tMuro, -1, 4, vaosDoFosso);
  faixaDeAnel(Mp, F, dG, dM, 0.45, tMuro, 4, vaosDoFosso);
  paredeDeAnel(Mp, F, dM, -2.4, 0.45, tMuro, 1, 4, vaosDoFosso);
  faixaDeAnel(O.m('terra'), F, dM, 0, -2.4, lin('#8d7a62'), 6);
  const Mpi = O.m('piso');
  for (const p of [...pontes, ...tuneis]) {
    const rampa = pontes.includes(p), yF = rampa ? Ai.yk(0) - 0.21 : 0;
    const us = [p.ua, (p.ua + p.ub) / 2, p.ub];
    for (let j = 0; j < 2; j++) {
      const a = F.ponto(dG, us[j]), b = F.ponto(dG, us[j + 1]), c = F.ponto(0, us[j + 1]), d = F.ponto(0, us[j]);
      const A = [a[0], 0.02, a[1]], B = [b[0], 0.02, b[1]], C = [c[0], yF, c[1]], D = [d[0], yF, d[1]];
      Mpi.quad(A, B, C, D, pl(A, 4), pl(B, 4), pl(C, 4), pl(D, 4), tCorr, CIMA);
    }
    for (const uu of [p.ua, p.ub]) {
      const a = F.ponto(dG, uu), b = F.ponto(0, uu);
      Mp.quad([a[0], -2.4, a[1]], [b[0], -2.4, b[1]], [b[0], yF + 1.0, b[1]], [a[0], 1.0, a[1]], [0, 0], [1, 0], [1, 1], [0, 1], tMuro);
    }
  }
  gol(O, -CX, -1); gol(O, CX, 1);
  bandeirinhas(O, CX, CZ);
  banco(O, -11.5, -5.5, CZ + 0.5, CZ + 2.4, true);
  banco(O, 5.5, 11.5, CZ + 0.5, CZ + 2.4, true, '#a11d2b');

  /* POR FORA: a pista de ônibus em volta, a praça, a rua (no mapa, a rua é
     do mapa) e as bilheterias do norte e do sul, na praça. Os prédios de
     entrada do leste e do oeste da foto saíram: tapavam o portão 1 e o 2
     e o letreiro. */
  const dO = dFac + g.onibus, xT = g.xT, zT = g.zT;
  faixaDeAnel(O.m('asfalto'), F, dFac, dO, 0, lin('#d2d2d2'), 6);
  chaoPlano(O.m('piso'), retangulo(-xT, xT, -zT, zT), [contornoDe(F, dO)], 0, lin('#cbc7bf'), 4);
  if (!opc.mapa) chaoPlano(O.m('asfalto'), retangulo(-xT - 14, xT + 14, -zT - 13, zT + 13), [retangulo(-xT, xT, -zT, zT)], 0, lin('#c4c4c4'), 6);
  const zB = g.B0 + dO + 5.8;
  for (const s of [-1, 1]) for (const x of [-8.8, 4.6]) bilheteria(O, quadro([x + 2.1, s * zB], [0, -s]), 0, 5.3, -2.1, 2.1, 3.2);
  /* A FACHADA: o relevo e o letreiro com o nome em cima do portão 1 e no oeste, no andar de cima */
  const relevo = fachadaDetalhada(O, As, { pilar: [1.0, 0.7], portas: P.map(p => p.E), cor: vezes(tMuro, 1.04), corBase: lin('#77705f') });
  const yLet = ALTO - 1.3 - 0.65 - 3.0;
  for (const [uu, w] of [[2.5, [-1, 0]], [6.5, [1, 0]]]) { const q = F.ponto(dFac, uu); letreiro(O, quadro([q[0], q[1]], w), 0, opc.nome, yLet, 3.0, 2 * (g.B0 - g.r0) - 1.5, { placa: lin('#2c3640'), sai: 0.95 }); }
  /* o chão de baixo (só aparece no corte): debaixo do anel de baixo, na
     frente do corredor (sem os túneis), e debaixo do de cima, do corredor
     do chão até a fachada, entre os salões e fora das escadas internas */
  const Mc = O.m('piso');
  chaoDeBaixo(Mc, Ai, C0.dI, 0, tBaixo);
  chaoEntreSaloes(Mc, F, C0.dF, dFac, 0, tBaixo, P.map(p => p.E), escs.map(e => ({ ua: e.ua, ub: e.ub, d1: C1.dI })));

  /* OS SETORES (a imagem do dono do nível 3): em cima, m2 no noroeste até
     a PM1, v2 e v1 no sudoeste com a PM4, m1 no leste; embaixo, a PM2, o
     v3 no sudoeste e a PM3 */
  const setores = camadaDosSetores(S, G, [
    { id: 'm2', arq: As, ua: pm1[1], ub: 9, faixa: 20 },
    { id: 'pm', arq: As, ua: pm1[0], ub: pm1[1] },
    { id: 'v2', arq: As, ua: vSO, ub: pm1[0], faixa: 20 },
    { id: 'v1', arq: As, ua: pm4[1], ub: vSO, faixa: 14 },
    { id: 'pm', arq: As, ua: pm4[0], ub: pm4[1] },
    { id: 'm1', arq: As, ua: 1.5, ub: 3.5, faixa: 20 },
    { id: 'pm', arq: Ai, ua: pm2[0], ub: pm2[1] },
    { id: 'v3', arq: Ai, ua: pm3[1], ub: pm2[0], faixa: 20 },
    { id: 'pm', arq: Ai, ua: pm3[0], ub: pm3[1] }
  ], 18);
  for (const p of P) { const q = p.E.Q.L(-7, 0, 0); marcador(G, `${p.nome} · ${p.lado}`, p.lado === 'visitante' ? '#c62828' : '#1b7f3b', q[0], 8, q[2], 16); }
  const m = v => v.toFixed(1).replace('.', ',');
  return dentroDo((x, z) => F.dentroDe(x, z, dFac), {
    aneis: [{ nome: 'Anel de baixo', fileiras: NI, degrau: '0,80 × 0,42 m', lugares: Ai.lugares() },
            { nome: 'Anel de cima', fileiras: NS, degrau: '0,80 × 0,52 m', lugares: As.lugares() }],
    setores, livre: '', vomitorios: vom.length + vomI.length,
    tipoVom: `com túnel nos dois anéis: ${vom.length} em cima (o poço das fileiras 1 a 5, a escada desce até o corredor de cima) e ${vomI.length} embaixo (fileiras 2 a 7, a escada desce até o corredor do chão)`,
    alturaArq: As.yn + 1.1, luz: 'nenhuma (a foto não mostra torre nem refletor)',
    fachada: `concreto aparente em ${Math.round(ALTO / relevo.andar)} andares de ${m(relevo.andar)} m: ${relevo.pilares} pilares, a faixa de cada laje, o cobogó e o brise, o embasamento e a cimalha; o letreiro com o nome em cima do portão 1 e no oeste; as quatro bilheterias do norte e do sul`,
    entradas: P.map((p, j) => ({ nome: p.nome, lado: p.lado,
      onde: `${p.onde}; o pórtico com a marquise, a faixa de pedestre na pista de ônibus, a fila de ${p.raias} raias e ${p.catracas} catracas no salão, que dá no corredor do chão; dele, a escada interna (${escs[j].onde}) sobe pro corredor de cima`,
      chega: [cI.zonaEm((p.E.vaoCorr.ua + p.E.vaoCorr.ub) / 2), cS.zonaEm((escs[j].portaCima.ua + escs[j].portaCima.ub) / 2)], ...naRua(p.E.Q) })),
    escadas: `As ${escs.length} escadas internas, uma perto de cada portão, ficam no vão de ${m(C1.dI - C0.dF)} m entre os dois corredores: dois lances de ${escs[0].degraus / 2} degraus ao longo do anel, com a parede no meio — um sobe da porta do corredor do chão (a placa ESCADA · ANEL SUPERIOR) até o patamar da volta, o outro volta até a porta do corredor de cima (a placa SAÍDA), em cima da de baixo. É o único caminho de um corredor pro outro.`,
    corredores: [{ nome: 'Do chão (debaixo do anel de baixo)', zonas: 'visitante · PM2 · mandante · PM3', ...cI },
                 { nome: `De cima (debaixo do anel de cima, a ${m(C1.y)} m)`, zonas: 'visitante · PM1 · mandante · PM4', ...cS }],
    servico: 'os túneis do meio do leste e do oeste são os dos jogadores (não ligam no corredor)',
    cortes: [{ nome: 'Corte no corredor do chão', y: C0.y + C0.h - 0.05 }, { nome: 'Corte no corredor de cima', y: C1.y + C1.h - 0.05 }],
    aviso: 'Na imagem do dono, o anel de baixo do norte também está escrito "VISITANTE 3º ESCALÃO" (em maiúscula); o protótipo põe o 3º escalão visitante no sudoeste, que é o que vale aqui.'
  });
}

/* ======================================================
   OS TRÊS, pro catálogo
   ====================================================== */
export const ESTADIOS_JOGO = {
  'estadio-10': { id: 'estadio-10', nome: 'Estádio de 10 mil', nivel: 1, mil: 10000, foto: 'estadio_10', montar: montar10, letreiro: 'Estádio Municipal',
    terreno: { ...G10.terreno, p1: G10.p1 },
    nota: 'O municipal: arquibancada reta no norte, a do leste e sul em L, o corredor embaixo das duas, os vomitórios em vala e os três portões (o 3, do visitante, pelo túnel de lona); por fora, o muro caiado com o nome pintado e o arco do portão 1.' },
  'estadio-20': { id: 'estadio-20', nome: 'Estádio de 20 mil', nivel: 2, mil: 20000, foto: 'estadio_20', montar: montar20, letreiro: 'Estádio Centenário',
    terreno: { x0: -G20.xM - 0.15, x1: G20.xM + 0.15, z0: G20.zN - 0.15, z1: G20.zS + 0.15, p1: 0 },
    nota: 'O anel único bege: o corredor em volta, embaixo, 10 vomitórios com túnel, os três portões com pórtico na fachada de concreto e cobogó, o letreiro, a pista, as placas e as quatro torres de luz.' },
  'estadio-40': { id: 'estadio-40', nome: 'Estádio de 40 mil', nivel: 3, mil: 40000, foto: 'estadio_40', montar: montar40, letreiro: 'Arena da Cidade',
    terreno: { x0: -G40.xT, x1: G40.xT, z0: -G40.zT, z1: G40.zT, p1: 0 },
    nota: 'A tigela de dois anéis de 15 fileiras: um corredor debaixo de cada anel, ligados pelas escadas internas, vomitórios com túnel nos dois, os três portões com pórtico, o letreiro na fachada de três andares, o fosso e a pista de ônibus.' }
};
/* o modelo de cada praça pela lotação (dados/estadios.js): até 15 mil, o
   de 10; até 30 mil, o de 20; acima, o de 40 */
export const modeloDaLotacao = n => n > 30000 ? 'estadio-40' : n > 15000 ? 'estadio-20' : 'estadio-10';
/* A PLANTA 2D de cada um, pro mapa da cidade: o chão do terreno, o muro,
   as arquibancadas em faixa com os vomitórios, a pista, o fosso, o
   gramado e as linhas do campo — em metros, no referencial do modelo (o
   portão 1 no +x, z pro sul). `formas`: {cor, pts} (polígono cheio, na
   ordem de pintar); `linhas`: {cor, pts, larg, fechada}. */
export function plantaDoEstadio(id) {
  const formas = [], linhas = [];
  const ret = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const cheio = (pts, cor) => formas.push({ cor, pts });
  const traco = (pts, cor, larg, fechada = false) => linhas.push({ cor, pts, larg, fechada });
  const anel = (F, d, u0 = 0, u1 = 9) => F.amostras(u0, u1).map(u => { const q = F.ponto(d, u); return [q[0], q[1]]; });
  const faixa = (F, dA, dB, u0, u1) => anel(F, dB, u0, u1).concat(anel(F, dA, u0, u1).reverse());
  const campo = (comp, larg) => {
    const C = comp / 2, L = larg / 2, B = '#f4f4ee', l = 0.14, e = Math.min(1, comp / 105, larg / 68);
    traco(ret(-C, C, -L, L), B, l, true); traco([[0, -L], [0, L]], B, l);
    const circ = (cx, cz, r, a0 = 0, a1 = 2 * Math.PI) => Array.from({ length: 33 }, (_, k) => { const a = a0 + (a1 - a0) * k / 32; return [cx + r * Math.cos(a), cz + r * Math.sin(a)]; });
    traco(circ(0, 0, 9.15 * e), B, l, true);
    for (const s of [-1, 1]) {
      traco([[s * C, -20.16 * e], [s * (C - 16.5 * e), -20.16 * e], [s * (C - 16.5 * e), 20.16 * e], [s * C, 20.16 * e]], B, l);
      traco([[s * C, -9.16 * e], [s * (C - 5.5 * e), -9.16 * e], [s * (C - 5.5 * e), 9.16 * e], [s * C, 9.16 * e]], B, l);
      const aa = Math.acos(5.5 / 9.15);
      traco(s > 0 ? circ(C - 11 * e, 0, 9.15 * e, Math.PI - aa, Math.PI + aa) : circ(-C + 11 * e, 0, 9.15 * e, -aa, aa), B, l);
    }
  };
  const E = ESTADIOS_JOGO[id], T = E.terreno;
  if (id === 'estadio-10') {
    const g = G10, { Fg, Fn, Fl } = aneis10(), pc = pecas10(Fn, Fl), corte = pc.corte;
    const zC0 = Fl.ponto(0, corte.ua)[1], zC1 = Fl.ponto(0, corte.ub)[1], P = g.P;
    cheio(ret(T.x0, T.x1, T.z0, T.z1), '#d9c9a8');
    cheio(ret(g.xMO - 0.2, g.xML + 0.2, g.zMN - 0.2, g.zMS + 0.2), '#b3a888');
    const PASSA = '#c8c5bc', ARQ = '#d4d1c9', xMi = g.xML - 0.2, zNi = g.zMN + 0.2, zSi = g.zMS - 0.2;
    cheio(ret(g.xN0, g.xC, zNi, g.zFN - P), PASSA);
    cheio([...anel(Fl, P, 0, corte.ua), [xMi, zC0], [xMi, zNi], [g.xC, zNi]], PASSA);
    cheio([...anel(Fl, P, corte.ub, 5), [g.xMO + 0.2, zSi], [xMi, zSi], [xMi, zC1]], PASSA);
    cheio(faixa(Fn, 0, P, 0, 1), ARQ);
    cheio(faixa(Fl, 0, P, 0, corte.ua), ARQ); cheio(faixa(Fl, 0, P, corte.ub, 5), ARQ);
    /* as valas dos vomitórios (fileiras 2 a 6: 1,6 a 5,6 m da frente) */
    for (const [F, vs] of [[Fn, pc.norte], [Fl, pc.leste]]) for (const v of vs) cheio(faixa(F, 1.6, 5.6, v.ua, v.ub), '#6e6a62');
    cheio(anel(Fg, 0.2), '#f2f0ea');
    cheio(anel(Fg, 0), '#7f9a4c');
    campo(2 * g.C, 2 * g.L);
    traco(ret(g.xMO, g.xML, g.zMN, g.zMS), '#f4f1ea', 0.4, true);
  } else if (id === 'estadio-20') {
    const F = anel20(), F0 = anel20Foto(), g = G20;
    cheio(ret(T.x0, T.x1, T.z0, T.z1), '#b8b8b3');
    cheio(anel(F, g.dFac), '#cdbf9f');
    cheio(anel(F, g.dn), '#d9caa9');
    for (const [x, z] of VOM20) { const v = faixaNoU(F, uDaFoto(F0, x, z), 4.6, 4.4); cheio(faixa(F, 1.6, 7.2, v.ua, v.ub), '#5c574f'); }
    cheio(anel(F, 0), '#a7a59e');
    cheio(anel(F, -g.pista), '#5f8b3c');
    campo(g.campo[0], g.campo[1]);
    const q = F.ponto(g.dFac, 1.5), tx = q[0] + 0.6 * (g.xM - q[0]), tz = -q[1] + 0.6 * (-g.zN + q[1]), zF = g.B0 + g.dFac;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cheio(ret(sx * tx - 1, sx * tx + 1, sz * tz - 1, sz * tz + 1), '#8d9196');
    for (const s of [-1, 1]) cheio(ret(-4.2, 4.2, s < 0 ? -zF - 1.8 : zF, s < 0 ? -zF : zF + 1.8), '#e3d8c1');
    traco(ret(-g.xM, g.xM, g.zN, g.zS), '#e8dfcb', 0.3, true);
  } else {
    const F = anel40(), g = G40;
    cheio(ret(T.x0, T.x1, T.z0, T.z1), '#cbc7bf');
    cheio(anel(F, g.dFac + g.onibus), '#8f8f8a');
    cheio(anel(F, g.dFac), '#c4b595');
    cheio(anel(F, g.dP - 2.15), '#cbb99a');
    for (const v of vomitorios40(F)) cheio(faixa(F, g.dS + 0.8, g.dS + 4.8, v.ua, v.ub), '#5c574f');
    cheio(anel(F, g.dS), '#c7c0b2');
    cheio(anel(F, g.dS - 2.0), '#c2b192');
    cheio(anel(F, 0), '#8d7a62');
    cheio(anel(F, -g.fosso), '#4d7f30');
    campo(g.campo[0], g.campo[1]);
    const zB = g.B0 + g.dFac + g.onibus + 5.8;
    for (const s of [-1, 1]) for (const x of [-8.8, 4.6]) cheio(ret(x, x + 4.2, s > 0 ? zB - 5.3 : -zB, s > 0 ? zB : -zB + 5.3), '#e7e2d5');
  }
  return { formas, linhas, terreno: { ...T } };
}
/* monta um dos três: o grupo em metros (com a camada `setores` dentro) e a
   ficha. `opc.nome`: o nome do letreiro (sem ele, o de fábrica); `opc.mapa`:
   pro mapa da cidade — sem a camada dos setores e sem o chão de fora do
   terreno (`info.terreno`, em metros; o portão 1 fica sempre no +x) */
export function montarEstadioJogo(id, opc = {}) {
  const E = ESTADIOS_JOGO[id];
  /* os materiais são de todos: o corte de um estádio visto antes não fica */
  for (const m of Object.values(MAT)) if (m.clippingPlanes && m.clippingPlanes.length) { m.clippingPlanes = null; m.needsUpdate = true; }
  const grupo = new THREE.Group(), setores = new THREE.Group();
  grupo.name = E.nome; setores.name = 'setores';
  const O = novaObra(), S = novaObra(), letreiro = nomeDoLetreiro(opc.nome || E.letreiro);
  const info = E.montar(O, S, setores, { nome: letreiro, mapa: !!opc.mapa });
  O.fechar(grupo, !opc.mapa);
  if (!opc.mapa) { S.fechar(setores, false); grupo.add(setores); }
  let tri = 0, malhas = 0;
  grupo.traverse(o => { if (o.isMesh && o.parent === grupo) { tri += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3; malhas++; } });
  const caixa3 = new THREE.Box3();
  for (const o of grupo.children) if (o.isMesh) caixa3.expandByObject(o);
  const tam = caixa3.getSize(new THREE.Vector3());
  info.lugares = info.aneis.reduce((s, a) => s + a.lugares, 0);
  Object.assign(info, { id, nome: E.nome, nivel: E.nivel, triangulos: Math.round(tri), malhas, planta: [tam.x, tam.z], altura: caixa3.max.y, letreiro, terreno: { ...E.terreno } });
  return { grupo, info };
}
/* O CORTE: tira tudo acima da altura y (em metros, a do estádio) — o
   teto do corredor sai e ele aparece de cima, com os vomitórios, as
   portas e os portões; y = null tira o corte. Os nomes (sprite) não são
   cortados. Quem mostra precisa de `renderer.localClippingEnabled`. */
export function cortarEstadio(obj, y) {
  obj.updateWorldMatrix(true, false);
  const plano = y == null ? null : new THREE.Plane(new THREE.Vector3(0, -1, 0), y).applyMatrix4(obj.matrixWorld);
  const vistos = new Set();
  obj.traverse(o => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (vistos.has(m)) continue;
      vistos.add(m);
      m.clippingPlanes = plano ? [plano] : null; m.clipShadows = !!plano; m.needsUpdate = true;
    }
  });
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
