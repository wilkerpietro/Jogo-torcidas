/* =========================================================
   O KIT DE PEÇAS DETALHADAS (o jogo 3D, 28/09/2026)
   ---------------------------------------------------------
   O dono: "Refaça as cenas da caravana e da casa de praia com mais
   detalhismo no threejs".

   As cenas de briga que acontecem fora da cidade assada (a caravana no
   posto e na estrada) e a festa na casa de praia eram de caixa: o
   ônibus um bloco, o carro dois, a bomba uma caixa. Aqui cada peça é
   modelada em Three.js de verdade, em METROS (quem usa escala o grupo
   pelo metro do mundo):

   - a CARROCERIA sai de um perfil de lado extrudado com a borda
     arredondada, com a caixa de roda recortada no perfil (o pneu
     aparece inteiro), a cabine mais estreita que o corpo, os vidros
     assentados no perfil (o para-brisa, o de trás, os de lado), os
     faróis, as lanternas, o retrovisor, a placa e as rodas;
   - as TEXTURAS são pintadas no canvas na hora e repetem por metro (a
     uv é a do mundo): o asfalto com pedrisco, a placa de concreto com a
     junta e a mancha, o bloco do muro, a placa de muro pré-moldado, o
     zinco ondulado com ferrugem, o azulejo da piscina, o deck, o
     tijolo, a prateleira da loja, o letreiro, o painel de preço;
   - os DECALQUES do chão (transparentes, por cima): a marca de pneu, a
     rachadura, a mancha de óleo, a areia soprada, a seta e a faixa
     pintadas e gastas, o ralo;
   - a SOMBRA DE CONTATO: o cenário não tem sombra (é caro), e sem ela
     tudo parece flutuar — embaixo do carro, do ônibus, da bomba, da
     mesa vai um borrão escuro, e no pé de cada parede uma faixa que
     some pra fora;
   - `juntar(grupo)` junta toda a geometria de um grupo por material:
     uma cena inteira de centenas de peças vira umas quarenta malhas (a
     placa de vídeo desenha por chamada, não por triângulo).

   Tudo pequeno de propósito: a peça tem o detalhe que se vê da câmera
   da briga (de 15 a 45 m, bem de cima), e não o que só se vê encostado.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';

const PI = Math.PI;
/* o sorteio de semente fixa (a mesma cena sai igual toda vez) */
export function sorteio(semente = 1) {
  let s = (Math.abs(Math.floor(semente)) % 2147483646) + 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/* =======================================================
   OS MATERIAIS (um por chave: a junção precisa do mesmo objeto)
   ======================================================= */
const MATS = new Map();
function guardado(chave, fazer) { let m = MATS.get(chave); if (!m) { m = fazer(); m.name = chave; MATS.set(chave, m); } return m; }
/* o fosco (a parede, o plástico, o pano), o brilhante (a pintura do
   carro, o cromado), o vidro, a luz (a lâmpada, o farol) */
export const fosco = (cor, lados = false) => guardado('f|' + cor + lados, () => new THREE.MeshLambertMaterial({ color: cor, side: lados ? THREE.DoubleSide : THREE.FrontSide }));
export const brilho = (cor, s = 60, esp = '#555555') => guardado('b|' + cor + s + esp, () => new THREE.MeshPhongMaterial({ color: cor, shininess: s, specular: esp }));
export const vidro = (cor = '#1b2731', op = 0.82) => guardado('v|' + cor + op, () => new THREE.MeshPhongMaterial({ color: cor, shininess: 110, specular: '#9fb3bf', transparent: op < 1, opacity: op }));
export const luz = cor => guardado('l|' + cor, () => new THREE.MeshBasicMaterial({ color: cor }));
export const pintado = (chave, tex, o = {}) => guardado('t|' + chave, () => {
  const M = o.brilho ? THREE.MeshPhongMaterial : THREE.MeshLambertMaterial;
  const m = new M({ map: tex, color: o.cor || '#ffffff', side: o.lados ? THREE.DoubleSide : THREE.FrontSide, transparent: !!o.transparente, alphaTest: o.alphaTest || 0 });
  if (o.brilho) { m.shininess = o.brilho; m.specular = new THREE.Color(o.especular || '#444444'); }
  if (o.opacidade != null) { m.opacity = o.opacidade; m.transparent = true; }
  if (o.transparente || o.semProfundidade) m.depthWrite = false;
  if (o.decalque) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  return m;
});
/* o decalque do chão: a textura com transparência, sem escrever fundo,
   puxado pra frente (não briga com o chão de baixo) */
export const decalque = (chave, tex, cor = '#ffffff', op = 1) => pintado('dec|' + chave + cor + op, tex, { cor, transparente: true, opacidade: op, decalque: true });

/* =======================================================
   AS TEXTURAS (pintadas no canvas, uma vez)
   ======================================================= */
const TEXS = new Map();
function tela(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function textura(chave, w, h, pintar, repete = true) {
  let t = TEXS.get(chave);
  if (t) return t;
  const c = tela(w, h), x = c.getContext('2d');
  pintar(x, w, h);
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repete) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  TEXS.set(chave, t);
  return t;
}
/* o ruído de grão (o pedrisco do asfalto, a areia do concreto) */
function grao(x, w, h, n, cores, tam = [0.6, 1.6], alfa = [0.25, 0.7], semente = 7) {
  const r = sorteio(semente);
  for (let i = 0; i < n; i++) {
    x.globalAlpha = alfa[0] + r() * (alfa[1] - alfa[0]);
    x.fillStyle = cores[Math.floor(r() * cores.length)];
    const s = tam[0] + r() * (tam[1] - tam[0]);
    x.fillRect(r() * w, r() * h, s, s);
  }
  x.globalAlpha = 1;
}
/* a mancha (óleo, umidade): várias elipses de alfa baixo */
function mancha(x, cx, cy, raio, cor, r, n = 14, a0 = 0.05, a1 = 0.09) {
  x.fillStyle = cor;
  for (let i = 0; i < n; i++) {
    x.globalAlpha = a0 + r() * a1;
    x.beginPath(); x.ellipse(cx + (r() - 0.5) * raio, cy + (r() - 0.5) * raio, raio * (0.2 + r() * 0.5), raio * (0.15 + r() * 0.4), r() * PI, 0, 2 * PI); x.fill();
  }
  x.globalAlpha = 1;
}
/* a transparência pintada pixel a pixel: `f(u, v)` (de 0 a 1) → alfa */
function alfaPorPixel(x, w, h, cor, f) {
  const d = x.createImageData(w, h), [r, g, b] = cor;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = 4 * (j * w + i);
    d.data[k] = r; d.data[k + 1] = g; d.data[k + 2] = b; d.data[k + 3] = Math.round(255 * Math.max(0, Math.min(1, f((i + 0.5) / w, (j + 0.5) / h))));
  }
  x.putImageData(d, 0, 0);
}
const suave = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };

export const TEX = {
  /* o asfalto da rodovia: o cinza escuro com pedrisco claro e escuro (4 m) */
  asfalto: () => textura('asfalto', 512, 512, (x, w, h) => {
    x.fillStyle = '#4d4e51'; x.fillRect(0, 0, w, h);
    grao(x, w, h, 30000, ['#3a3b3d', '#5b5c5f', '#666663', '#2f3032', '#727069'], [0.8, 2.2], [0.3, 0.8], 11);
    const r = sorteio(3);
    for (let i = 0; i < 6; i++) mancha(x, r() * w, r() * h, 60 + r() * 70, '#2a2b2d', r, 10);
  }),
  /* o remendo do asfalto (mais escuro, a borda viva) */
  remendo: () => textura('remendo', 256, 256, (x, w, h) => {
    x.fillStyle = '#353639'; x.fillRect(0, 0, w, h);
    grao(x, w, h, 7000, ['#2a2b2d', '#46474a', '#505150'], [0.8, 2], [0.3, 0.8], 5);
  }),
  /* a placa de concreto do pátio: a folha tem 4 placas (2 × 2), com a
     junta, a areia, a mancha de pneu e de óleo; quem usa sorteia um
     quadrante e o giro por placa (a repetição some) */
  concreto: () => textura('concreto', 1024, 1024, (x, w, h) => {
    x.fillStyle = '#bab4a9'; x.fillRect(0, 0, w, h);
    grao(x, w, h, 90000, ['#a8a297', '#c7c1b6', '#9d978c', '#d0cbc1'], [0.8, 2.2], [0.2, 0.6], 17);
    const r = sorteio(29);
    for (let i = 0; i < 9; i++) mancha(x, r() * w, r() * h, 60 + r() * 120, r() < 0.7 ? '#7a746a' : '#5c574f', r, 7, 0.025, 0.035);
    for (let i = 0; i < 10; i++) mancha(x, r() * w, r() * h, 40 + r() * 90, '#dad4c8', r, 8, 0.05, 0.08);
    x.strokeStyle = 'rgba(80,76,68,.4)'; x.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) { x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 7; k++) { px += (r() - 0.5) * 70; py += (r() - 0.5) * 70; x.lineTo(px, py); } x.stroke(); }
    /* as juntas (a cada meia folha) */
    x.fillStyle = '#7b766c';
    for (const p of [0, w / 2]) { x.fillRect(p, 0, 4, h); x.fillRect(0, p, w, 4); }
    x.fillStyle = 'rgba(255,255,255,.18)';
    for (const p of [0, w / 2]) { x.fillRect(p + 4, 0, 2, h); x.fillRect(0, p + 4, w, 2); }
  }),
  /* a mancha de óleo solta (decalque) */
  oleo: () => textura('oleo', 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    const r = sorteio(41);
    mancha(x, w / 2, h / 2, 120, '#1c1a17', r, 30);
    x.globalAlpha = 0.5; x.fillStyle = '#16140f';
    for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(w / 2 + (r() - 0.5) * 150, h / 2 + (r() - 0.5) * 150, 2 + r() * 6, 0, 2 * PI); x.fill(); }
    x.globalAlpha = 1;
  }, false),
  /* a marca de pneu (as duas trilhas curvas de quem manobrou), decalque */
  trilha: () => textura('trilha', 512, 128, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    const r = sorteio(43);
    for (const dy of [h * 0.3, h * 0.72]) for (let k = 0; k < 6; k++) {
      x.strokeStyle = `rgba(45,40,34,${0.025 + r() * 0.035})`; x.lineWidth = 8 + r() * 14;
      x.beginPath(); x.moveTo(-10, dy + (r() - 0.5) * 8); x.bezierCurveTo(w * 0.3, dy - 18 + (r() - 0.5) * 8, w * 0.7, dy - 12, w + 10, dy + 10 + (r() - 0.5) * 8); x.stroke();
    }
  }, false),
  /* a rachadura do concreto e do asfalto (decalque) */
  rachadura: () => textura('rachadura', 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    const r = sorteio(47);
    const galho = (px, py, ang, n, lw) => {
      x.lineWidth = lw; x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < n; k++) { ang += (r() - 0.5) * 0.9; px += Math.cos(ang) * 14; py += Math.sin(ang) * 14; x.lineTo(px, py); if (r() < 0.18 && lw > 1) { x.stroke(); galho(px, py, ang + (r() < 0.5 ? 1 : -1) * 0.9, n / 2, lw * 0.6); x.lineWidth = lw; x.beginPath(); x.moveTo(px, py); } }
      x.stroke();
    };
    x.strokeStyle = 'rgba(40,36,30,.75)'; x.lineCap = 'round';
    galho(20, h * 0.5, 0, 17, 2.6);
  }, false),
  /* o ralo de ferro do pátio */
  ralo: () => textura('ralo', 64, 64, (x, w, h) => {
    x.fillStyle = '#5b5852'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1b1a18'; x.fillRect(6, 6, w - 12, h - 12);
    x.fillStyle = '#4e4b45'; for (let i = 0; i < 7; i++) x.fillRect(8 + i * 7.5, 8, 3.5, h - 16);
  }, false),
  /* a seta pintada no chão, gasta (decalque; aponta pro topo da folha) */
  seta: () => textura('seta', 128, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = '#f2f0e8';
    x.beginPath(); x.moveTo(w / 2, 6); x.lineTo(w - 10, 96); x.lineTo(w * 0.62, 96); x.lineTo(w * 0.62, h - 6); x.lineTo(w * 0.38, h - 6); x.lineTo(w * 0.38, 96); x.lineTo(10, 96); x.closePath(); x.fill();
    const r = sorteio(53); x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 420; i++) { x.globalAlpha = 0.3 + r() * 0.7; x.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4); }
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  }, false),
  /* a tinta de faixa gasta (a folha é 2 m de faixa; decalque) */
  gasta: () => textura('gasta', 256, 32, (x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    const r = sorteio(59); x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 260; i++) { x.globalAlpha = 0.25 + r() * 0.75; x.fillRect(r() * w, r() * h, 1 + r() * 5, 1 + r() * 3); }
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  }),
  /* a areia que o vento joga no concreto e no asfalto (decalque, borda macia) */
  areiaSolta: () => textura('areiaSolta', 256, 256, (x, w, h) => {
    const r = sorteio(61), blobs = [];
    for (let i = 0; i < 9; i++) blobs.push([0.25 + r() * 0.5, 0.25 + r() * 0.5, 0.12 + r() * 0.16]);
    const q = sorteio(63);
    alfaPorPixel(x, w, h, [214, 196, 158], (u, v) => {
      let a = 0; for (const [bx, by, br] of blobs) { const d = Math.hypot(u - bx, v - by) / br; a = Math.max(a, 1 - suave(0.3, 1, d)); }
      return a * (0.6 + 0.4 * q());
    });
  }, false),
  /* a terra de longe, de mancha grande (o chão até o horizonte, por cima
     da terra miúda: a folha tem ~150 m) — decalque de alfa */
  manchasLonge: () => textura('manchasLonge', 512, 512, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    const r = sorteio(67);
    for (let i = 0; i < 70; i++) {
      const cx = r() * w, cy = r() * h, rr = 14 + r() * 60, cor = r() < 0.55 ? '100,98,55' : r() < 0.6 ? '150,120,80' : '220,200,160';
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, `rgba(${cor},${0.2 + r() * 0.25})`); g.addColorStop(1, `rgba(${cor},0)`);
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rr, 0, 2 * PI); x.fill();
    }
  }),
  /* o bloco de concreto aparente do muro (40 × 20 cm; a folha tem 2 × 2 m) */
  bloco: () => textura('bloco', 512, 512, (x, w, h) => {
    x.fillStyle = '#a7a298'; x.fillRect(0, 0, w, h);
    const r = sorteio(53), bw = w / 5, bh = h / 10;
    for (let j = 0; j < 10; j++) for (let i = -1; i < 6; i++) {
      const ox = (j % 2) * bw / 2, v = 168 + Math.floor(r() * 26);
      x.fillStyle = `rgb(${v},${v - 4},${v - 11})`; x.fillRect(i * bw + ox + 2, j * bh + 2, bw - 4, bh - 4);
    }
    grao(x, w, h, 16000, ['#9d988e', '#c9c4ba', '#8f8a80'], [0.6, 1.4], [0.2, 0.5], 57);
    for (let i = 0; i < 9; i++) { x.globalAlpha = 0.05 + r() * 0.08; x.fillStyle = '#5c5448'; x.fillRect(r() * w, h * (0.2 + r() * 0.3), 3 + r() * 9, h); }
    x.globalAlpha = 1;
  }),
  /* a placa de muro pré-moldado (a folha é um vão de 2,5 m entre pilares
     × 2,5 m de altura, com as juntas das placas de 50 cm e a mancha
     escorrida da chuva) */
  premoldado: () => textura('premoldado', 512, 512, (x, w, h) => {
    x.fillStyle = '#cfcbc2'; x.fillRect(0, 0, w, h);
    grao(x, w, h, 20000, ['#bdb9b0', '#dcd8d0', '#b3aea4'], [0.8, 2], [0.2, 0.55], 71);
    const r = sorteio(73);
    for (let i = 0; i < 26; i++) { const px = r() * w, g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(70,64,55,.28)'); g.addColorStop(0.5 + r() * 0.4, 'rgba(70,64,55,0)'); x.fillStyle = g; x.fillRect(px, 0, 4 + r() * 16, h); }
    const g = x.createLinearGradient(0, h * 0.75, 0, h); g.addColorStop(0, 'rgba(140,110,70,0)'); g.addColorStop(1, 'rgba(140,110,70,.35)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(90,86,78,.55)'; for (let j = 1; j < 5; j++) x.fillRect(0, j * h / 5 - 1, w, 3);
  }),
  /* o reboco pintado (claro, com a sujeira de chuva descendo) */
  reboco: () => textura('reboco', 256, 256, (x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    grao(x, w, h, 6000, ['#ebe8e2', '#f6f5f1', '#e2dfd8'], [0.8, 2], [0.2, 0.6], 61);
    const r = sorteio(67);
    for (let i = 0; i < 14; i++) { x.globalAlpha = 0.05 + r() * 0.06; x.fillStyle = '#8a8272'; x.fillRect(r() * w, 0, 2 + r() * 6, h * (0.3 + r() * 0.7)); }
    x.globalAlpha = 1;
  }),
  /* a laje de cima (a manta cinza com as poças secas e a sujeira) */
  laje: () => textura('laje', 512, 512, (x, w, h) => {
    x.fillStyle = '#a9a69f'; x.fillRect(0, 0, w, h);
    grao(x, w, h, 26000, ['#9b9891', '#b7b4ad', '#8f8c86'], [0.8, 2], [0.2, 0.6], 79);
    const r = sorteio(83);
    for (let i = 0; i < 12; i++) mancha(x, r() * w, r() * h, 50 + r() * 90, r() < 0.5 ? '#6f6b63' : '#c4c0b8', r, 10);
  }),
  /* o zinco ondulado (a onda a cada 7,7 cm na folha de 1 m; a emenda
     das telhas no alto da folha: quem usa estica o v pro comprimento da
     telha), com a ferrugem escorrida */
  zinco: (ferrugem = 0.35) => textura('zinco' + ferrugem, 512, 512, (x, w, h) => {
    const n = 13;
    for (let i = 0; i < n; i++) {
      const g = x.createLinearGradient(i * w / n, 0, (i + 1) * w / n, 0);
      g.addColorStop(0, '#8e9396'); g.addColorStop(0.35, '#c9cdcf'); g.addColorStop(0.6, '#a8adb0'); g.addColorStop(1, '#7c8184');
      x.fillStyle = g; x.fillRect(i * w / n, 0, w / n + 1, h);
    }
    grao(x, w, h, 5000, ['#6d7275', '#d7dadc'], [0.8, 1.6], [0.1, 0.3], 69);
    const r = sorteio(71);
    for (let i = 0; i < 30 * ferrugem; i++) {
      x.globalAlpha = 0.12 + r() * 0.25; x.fillStyle = r() < 0.5 ? '#8a4b25' : '#6d3b1f';
      const px = r() * w; x.fillRect(px, r() * h * 0.4, 4 + r() * 18, h * (0.2 + r() * 0.8));
    }
    x.globalAlpha = 1;
    x.fillStyle = 'rgba(30,30,30,.35)'; x.fillRect(0, 0, w, 4);
  }),
  /* a porta de enrolar (a lâmina a cada 8 cm na folha de 1 m) */
  enrolar: () => textura('enrolar', 256, 256, (x, w, h) => {
    x.fillStyle = '#9ea3a6'; x.fillRect(0, 0, w, h);
    for (let j = 0; j < 12; j++) { x.fillStyle = '#b8bcbe'; x.fillRect(0, j * h / 12, w, h / 24); x.fillStyle = '#7d8285'; x.fillRect(0, j * h / 12 + h / 24, w, 2); }
    grao(x, w, h, 2500, ['#6d7275', '#c5c8ca'], [0.6, 1.2], [0.2, 0.5], 73);
  }),
  /* o azulejo da piscina (15 cm), claro na borda e mais fundo no meio,
     com a parede de dentro aparecendo no lado do sol (a folha é a piscina
     inteira: a água de cima escurece no fundo) */
  piscina: (w0 = 4, d0 = 10) => textura('piscina' + w0 + 'x' + d0, 256, Math.round(256 * d0 / w0), (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.62);
    g.addColorStop(0, '#0d7fb4'); g.addColorStop(0.55, '#179ecb'); g.addColorStop(1, '#4cc6e6');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const px = w / (w0 / 0.15);
    x.strokeStyle = 'rgba(255,255,255,.14)'; x.lineWidth = 1;
    for (let i = 0; i < w; i += px) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
    for (let j = 0; j < h; j += px) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); }
    /* a parede de dentro (a faixa clara num lado e a sombra no outro) e a borda de azulejo escuro */
    const e = Math.max(6, w * 0.07);
    let q = x.createLinearGradient(0, 0, e, 0); q.addColorStop(0, 'rgba(210,245,255,.55)'); q.addColorStop(1, 'rgba(210,245,255,0)'); x.fillStyle = q; x.fillRect(0, 0, e, h);
    q = x.createLinearGradient(0, 0, 0, e); q.addColorStop(0, 'rgba(210,245,255,.45)'); q.addColorStop(1, 'rgba(210,245,255,0)'); x.fillStyle = q; x.fillRect(0, 0, w, e);
    q = x.createLinearGradient(w, 0, w - e * 1.5, 0); q.addColorStop(0, 'rgba(4,40,70,.45)'); q.addColorStop(1, 'rgba(4,40,70,0)'); x.fillStyle = q; x.fillRect(w - e * 1.5, 0, e * 1.5, h);
    q = x.createLinearGradient(0, h, 0, h - e * 1.5); q.addColorStop(0, 'rgba(4,40,70,.4)'); q.addColorStop(1, 'rgba(4,40,70,0)'); x.fillStyle = q; x.fillRect(0, h - e * 1.5, w, e * 1.5);
    x.strokeStyle = '#0b5f8a'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, w - 3, h - 3);
    /* a raia escura no fundo e o reflexo da luz na água (a cáustica) */
    x.fillStyle = 'rgba(8,40,80,.35)'; x.fillRect(w / 2 - 3, h * 0.12, 6, h * 0.76); x.fillRect(w / 2 - 14, h * 0.12, 28, 5); x.fillRect(w / 2 - 14, h * 0.88 - 5, 28, 5);
    const r = sorteio(79); x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 1.4;
    for (let i = 0; i < 110; i++) { x.beginPath(); const cx = r() * w, cy = r() * h; x.moveTo(cx, cy); x.quadraticCurveTo(cx + 8, cy - 5, cx + 16 + r() * 10, cy + (r() - 0.5) * 6); x.stroke(); }
  }, false),
  /* a pedra clara do deck (50 cm; a folha tem 2 × 2 m) */
  deck: () => textura('deck', 512, 512, (x, w, h) => {
    x.fillStyle = '#e9e1cf'; x.fillRect(0, 0, w, h);
    const r = sorteio(83), n = 4, s = w / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const v = 222 + Math.floor(r() * 18); x.fillStyle = `rgb(${v},${v - 7},${v - 22})`; x.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
    }
    grao(x, w, h, 12000, ['#d4cab3', '#f4eee0', '#cbbfa5'], [0.8, 1.8], [0.2, 0.5], 89);
    x.strokeStyle = '#bdb29a'; x.lineWidth = 2;
    for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, h); x.stroke(); x.beginPath(); x.moveTo(0, i * s); x.lineTo(w, i * s); x.stroke(); }
  }),
  /* o piso de cerâmica da casa (40 cm; a folha tem 1,6 m) */
  ceramica: () => textura('ceramica', 256, 256, (x, w, h) => {
    x.fillStyle = '#efe8da'; x.fillRect(0, 0, w, h);
    const r = sorteio(97), n = 4, s = w / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const v = 232 + Math.floor(r() * 14); x.fillStyle = `rgb(${v},${v - 5},${v - 16})`; x.fillRect(i * s + 1, j * s + 1, s - 2, s - 2); }
    x.strokeStyle = '#cfc6b3'; x.lineWidth = 1.5;
    for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, h); x.stroke(); x.beginPath(); x.moveTo(0, i * s); x.lineTo(w, i * s); x.stroke(); }
  }),
  /* o piso do banheiro e da cozinha (o ladrilho pequeno, 20 cm) */
  ladrilho: () => textura('ladrilho', 256, 256, (x, w, h) => {
    x.fillStyle = '#dfe4e2'; x.fillRect(0, 0, w, h);
    const r = sorteio(99), n = 8, s = w / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const v = 214 + Math.floor(r() * 18); x.fillStyle = `rgb(${v - 6},${v},${v - 2})`; x.fillRect(i * s + 1, j * s + 1, s - 2, s - 2); }
  }),
  /* o tijolo aparente (a churrasqueira; a folha tem 1 × 0,5 m) */
  tijolo: () => textura('tijolo', 256, 128, (x, w, h) => {
    x.fillStyle = '#d8cfc0'; x.fillRect(0, 0, w, h);
    const r = sorteio(101), bw = w / 4, bh = h / 7;
    for (let j = 0; j < 7; j++) for (let i = -1; i < 5; i++) {
      const ox = (j % 2) * bw / 2, v = r();
      x.fillStyle = v < 0.3 ? '#a4502f' : v < 0.7 ? '#b85d37' : '#9a4a2c'; x.fillRect(i * bw + ox + 1.5, j * bh + 1.5, bw - 3, bh - 3);
    }
    grao(x, w, h, 3000, ['#7a3a22', '#c77a52'], [0.6, 1.4], [0.2, 0.5], 103);
  }),
  /* a areia batida da garagem e da rua de veraneio (a folha tem 3 m) */
  areia: () => textura('areia', 512, 512, (x, w, h) => {
    x.fillStyle = '#dccb9f'; x.fillRect(0, 0, w, h);
    grao(x, w, h, 40000, ['#cdbb8e', '#e8dab3', '#c4b083', '#efe3c1'], [0.8, 2.2], [0.25, 0.7], 107);
    const r = sorteio(109); x.strokeStyle = 'rgba(150,130,90,.25)'; x.lineWidth = 3;
    for (let i = 0; i < 6; i++) { x.beginPath(); const y = r() * h; x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 60, w * 0.7, y + (r() - 0.5) * 60, w, y + (r() - 0.5) * 30); x.stroke(); }
  }),
  /* a terra seca de beira de estrada, com tufo de capim (a folha tem 4 m) */
  terra: () => textura('terra', 512, 512, (x, w, h) => {
    x.fillStyle = '#b39a74'; x.fillRect(0, 0, w, h);
    grao(x, w, h, 30000, ['#a18763', '#c4ad88', '#8f7654', '#cbb795'], [0.8, 2.2], [0.25, 0.7], 113);
    const r = sorteio(127);
    for (let i = 0; i < 70; i++) {
      const cx = r() * w, cy = r() * h; x.strokeStyle = r() < 0.5 ? '#7d7f4a' : '#96915a'; x.lineWidth = 1.2;
      for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + (r() - 0.5) * 12, cy - 4 - r() * 9); x.stroke(); }
    }
  }),
  /* o tufo de capim (a folha em pé, transparente) */
  capim: () => textura('capim', 128, 128, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    const r = sorteio(131);
    for (let i = 0; i < 60; i++) {
      const bx = w * (0.15 + r() * 0.7), topo = h * (0.05 + r() * 0.45), curva = (r() - 0.5) * 40;
      x.strokeStyle = r() < 0.4 ? '#8a8a4a' : r() < 0.7 ? '#a39a5a' : '#6f7a3c'; x.lineWidth = 1.5 + r() * 1.5;
      x.beginPath(); x.moveTo(bx, h); x.quadraticCurveTo(bx + curva * 0.3, (h + topo) / 2, bx + curva, topo); x.stroke();
    }
  }, false),
  /* o tecido listrado (o guarda-sol, a almofada) */
  listras: (a, b, n = 8) => textura('listras' + a + b + n, 256, 64, (x, w, h) => {
    for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * w / n, 0, w / n + 1, h); }
  }),
  /* a prateleira da loja: as fileiras de produto colorido (a folha é uma gôndola de 2 × 1,6 m) */
  prateleiras: () => textura('prateleiras', 512, 410, (x, w, h) => {
    x.fillStyle = '#e9e9e6'; x.fillRect(0, 0, w, h);
    const r = sorteio(131), cores = ['#c8342b', '#1f5aa8', '#e0a52a', '#1d7a4a', '#f0ede4', '#7a2f86', '#d96a1f', '#2b2b2b', '#5fb3d6', '#e4d64a'];
    const n = 5, ph = h / n;
    for (let j = 0; j < n; j++) {
      let px = 4;
      while (px < w - 6) {
        const pw = 8 + r() * 22, alto = ph * (0.45 + r() * 0.42), cor = cores[Math.floor(r() * cores.length)], k = 1 + Math.floor(r() * 4);
        for (let q = 0; q < k && px < w - 6; q++) { x.fillStyle = cor; x.fillRect(px, (j + 1) * ph - 6 - alto, pw - 2, alto); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(px + 2, (j + 1) * ph - 4 - alto, 3, alto - 4); px += pw; }
        px += 2;
      }
      x.fillStyle = '#9a9c9d'; x.fillRect(0, (j + 1) * ph - 6, w, 6);
    }
  }, false),
  /* o que se vê de cima na gôndola (as fileiras de produto no topo) */
  gondolaTopo: () => textura('gondolaTopo', 64, 256, (x, w, h) => {
    x.fillStyle = '#d5d6d4'; x.fillRect(0, 0, w, h);
    const r = sorteio(137), cores = ['#c8342b', '#1f5aa8', '#e0a52a', '#1d7a4a', '#f0ede4', '#7a2f86', '#d96a1f'];
    for (let j = 4; j < h - 4; j += 7) for (const [a, b] of [[4, 28], [36, 60]]) { x.fillStyle = cores[Math.floor(r() * cores.length)]; x.fillRect(a, j, b - a, 5); }
  }, false),
  /* a geladeira de vidro da loja (as latas e as garrafas acesas) */
  geladeira: () => textura('geladeira', 256, 512, (x, w, h) => {
    x.fillStyle = '#dfe9ee'; x.fillRect(0, 0, w, h);
    const r = sorteio(137), n = 6, ph = h / n;
    for (let j = 0; j < n; j++) {
      for (let px = 6; px < w - 12; px += 13) { const cor = ['#c8342b', '#e0a52a', '#1d7a4a', '#1f5aa8', '#f2f2f2', '#6b3a1d'][Math.floor(r() * 6)]; x.fillStyle = cor; x.fillRect(px, (j + 1) * ph - ph * 0.72, 10, ph * 0.66); }
      x.fillStyle = '#b8c4c9'; x.fillRect(0, (j + 1) * ph - 4, w, 4);
    }
    x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(w * 0.1, 0, w * 0.12, h);
  }, false),
  /* o freezer de sorvete visto de cima (a tampa de vidro com os potes) */
  freezer: () => textura('freezer', 256, 128, (x, w, h) => {
    x.fillStyle = '#f2f2ef'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#9ec3d6'; x.fillRect(10, 10, w - 20, h - 20);
    const r = sorteio(139);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 8; i++) { x.fillStyle = ['#f3e3b5', '#e98aa3', '#8b5a3c', '#f5f5f0', '#c9e2a4'][Math.floor(r() * 5)]; x.fillRect(18 + i * 28, 18 + j * 30, 24, 26); }
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(10, 10, w - 20, 8);
    x.fillStyle = '#1f5aa8'; x.fillRect(w / 2 - 1, 10, 2, h - 20);
  }, false),
  /* um letreiro: o texto no fundo, no tamanho que cabe */
  letreiro: (texto, fundo = '#b3261e', cor = '#ffffff', w = 1024, h = 128, fonte = 'bold') => textura('let|' + texto + fundo + cor + w + h, w, h, (x) => {
    x.fillStyle = fundo; x.fillRect(0, 0, w, h);
    let t = h * 0.62;
    x.font = `${fonte} ${t}px "Arial Narrow", Arial, sans-serif`;
    while (t > 10 && x.measureText(texto).width > w * 0.9) { t -= 2; x.font = `${fonte} ${t}px "Arial Narrow", Arial, sans-serif`; }
    x.fillStyle = cor; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, w / 2, h / 2 + 2);
  }, false),
  /* o painel de preço do totem */
  precos: () => textura('precos', 256, 384, (x, w, h) => {
    x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#b3261e'; x.fillRect(0, 0, w, h * 0.22);
    x.fillStyle = '#fff'; x.font = 'bold 44px Arial'; x.textAlign = 'center'; x.fillText('POSTO', w / 2, h * 0.15);
    const linhas = [['GASOLINA', '6,49'], ['ETANOL', '4,59'], ['DIESEL S10', '6,19']];
    linhas.forEach(([n, p], i) => {
      const y = h * 0.3 + i * h * 0.23;
      x.fillStyle = '#1b1b1b'; x.fillRect(12, y, w - 24, h * 0.19);
      x.fillStyle = '#e8e8e2'; x.font = 'bold 20px Arial'; x.textAlign = 'left'; x.fillText(n, 22, y + 30);
      x.fillStyle = '#ff5a2a'; x.font = 'bold 40px "Courier New", monospace'; x.textAlign = 'right'; x.fillText(p, w - 20, y + h * 0.16);
    });
  }, false),
  /* o visor da bomba (o total e os litros em vermelho) */
  visor: () => textura('visor', 128, 128, (x, w, h) => {
    x.fillStyle = '#d9dcdc'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#141617'; x.fillRect(10, 12, w - 20, 34); x.fillRect(10, 56, w - 20, 26);
    x.fillStyle = '#ff4a1c'; x.font = 'bold 26px "Courier New", monospace'; x.textAlign = 'right'; x.fillText('150,00', w - 14, 38); x.font = 'bold 20px "Courier New", monospace'; x.fillText('23,11', w - 14, 76);
    x.fillStyle = '#2b2d2e'; for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) x.fillRect(16 + i * 25, 90 + j * 12, 19, 8);
  }, false),
  /* a placa do carro (o Mercosul) */
  placa: () => textura('placa', 256, 80, (x, w, h) => {
    x.fillStyle = '#f7f7f5'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1f4ea1'; x.fillRect(0, 0, w, 18);
    x.fillStyle = '#fff'; x.font = 'bold 12px Arial'; x.textAlign = 'center'; x.fillText('BRASIL', w / 2, 13);
    x.fillStyle = '#1b1b1b'; x.font = 'bold 44px "Arial Narrow", Arial'; x.fillText('RTF4E21', w / 2, 66);
    x.strokeStyle = '#1b1b1b'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, w - 3, h - 3);
  }, false),
  /* o letreiro de itinerário do ônibus (o laranja aceso no preto) */
  itinerario: texto => textura('itin|' + texto, 512, 64, (x, w, h) => {
    x.fillStyle = '#0f0f10'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ffa12a'; x.font = 'bold 40px "Courier New", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, w / 2, h / 2 + 2);
  }, false),
  /* a ventoinha do ar-condicionado do ônibus, vista de cima */
  ventoinha: () => textura('ventoinha', 128, 128, (x, w, h) => {
    x.fillStyle = '#c9cbc9'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#2b2d2f'; x.beginPath(); x.arc(w / 2, h / 2, w * 0.44, 0, 2 * PI); x.fill();
    x.strokeStyle = '#8d9092'; x.lineWidth = 3;
    for (let k = 1; k < 4; k++) { x.beginPath(); x.arc(w / 2, h / 2, w * 0.11 * k, 0, 2 * PI); x.stroke(); }
    for (let k = 0; k < 8; k++) { const a = k * PI / 4; x.beginPath(); x.moveTo(w / 2, h / 2); x.lineTo(w / 2 + Math.cos(a) * w * 0.44, h / 2 + Math.sin(a) * w * 0.44); x.stroke(); }
    x.fillStyle = '#6c7072'; x.beginPath(); x.arc(w / 2, h / 2, w * 0.08, 0, 2 * PI); x.fill();
  }, false),
  /* o alto-falante (o cone e o tweeter) */
  falante: () => textura('falante', 128, 256, (x, w, h) => {
    x.fillStyle = '#1b1c1e'; x.fillRect(0, 0, w, h);
    const cone = (cy, r) => { const g = x.createRadialGradient(w / 2, cy, 2, w / 2, cy, r); g.addColorStop(0, '#5a5d61'); g.addColorStop(0.3, '#232426'); g.addColorStop(0.85, '#38393c'); g.addColorStop(1, '#0c0c0d'); x.fillStyle = g; x.beginPath(); x.arc(w / 2, cy, r, 0, 2 * PI); x.fill(); };
    cone(h * 0.66, w * 0.4); cone(h * 0.26, w * 0.2);
    x.fillStyle = '#d23a2a'; x.fillRect(w * 0.3, h * 0.06, w * 0.4, 5);
  }, false),
  /* a madeira (tábua, pergolado, porta) */
  madeira: () => textura('madeira', 256, 256, (x, w, h) => {
    x.fillStyle = '#8a5a36'; x.fillRect(0, 0, w, h);
    const r = sorteio(149);
    for (let j = 0; j < h; j += 2) { x.fillStyle = `rgba(${60 + r() * 40},${35 + r() * 25},${20 + r() * 15},.35)`; x.fillRect(0, j, w, 1); }
    for (let i = 0; i < 8; i++) { x.strokeStyle = 'rgba(50,30,15,.3)'; x.beginPath(); x.ellipse(r() * w, r() * h, 6 + r() * 10, 2 + r() * 3, 0, 0, 2 * PI); x.stroke(); }
  }),
  /* o grelhado da churrasqueira (a grelha e a brasa) */
  brasa: () => textura('brasa', 128, 128, (x, w, h) => {
    x.fillStyle = '#1a1411'; x.fillRect(0, 0, w, h);
    const r = sorteio(151);
    for (let i = 0; i < 90; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 6); x.save(); x.translate(r() * w, r() * h); g.addColorStop(0, r() < 0.5 ? '#ff7b1c' : '#ffb341'); g.addColorStop(1, 'rgba(60,15,5,0)'); x.fillStyle = g; x.fillRect(-6, -6, 12, 12); x.restore(); }
    x.strokeStyle = '#8a8d8f'; x.lineWidth = 2; for (let i = 0; i < w; i += 10) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
  }, false),
  /* A SOMBRA DE CONTATO: o retângulo escuro de borda macia (o miolo tem
     metade da folha; quem usa estica a folha um terço além da peça) */
  sombra: () => textura('sombra', 64, 64, (x, w, h) => {
    alfaPorPixel(x, w, h, [0, 0, 0], (u, v) => Math.pow(1 - suave(0, 1, Math.hypot(Math.abs(u - 0.5) * 2, Math.abs(v - 0.5) * 2)), 1.3));
  }, false),
  /* a sombra redonda (a mesa, o guarda-sol, a pessoa) */
  sombraRedonda: () => textura('sombraRedonda', 64, 64, (x, w, h) => {
    alfaPorPixel(x, w, h, [0, 0, 0], (u, v) => 1 - suave(0.25, 1, Math.hypot(u - 0.5, v - 0.5) * 2));
  }, false),
  /* a faixa escura no pé da parede (escura em v = 1, some em v = 0) */
  sombraLinha: () => textura('sombraLinha', 8, 64, (x, w, h) => {
    alfaPorPixel(x, w, h, [0, 0, 0], (u, v) => Math.pow(1 - v, 2.2));
  }, false)
};

/* =======================================================
   AS FORMAS
   ======================================================= */
/* coloca a peça (x, y, z, giro em y) e devolve ela */
export function em(obj, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) { obj.position.set(x, y, z); obj.rotation.set(rx, ry, rz); return obj; }
const malha = (geo, mat) => new THREE.Mesh(geo, mat);
/* a caixa com o pé no chão (y0) */
export function caixa(w, h, d, mat, x = 0, y0 = 0, z = 0, ry = 0) { return em(malha(new THREE.BoxGeometry(w, h, d), mat), x, y0 + h / 2, z, ry); }
/* a caixa com a uv por metro (a textura repete a cada `m` metros; `mv` na vertical) */
export function caixaUV(w, h, d, mat, m = 1, x = 0, y0 = 0, z = 0, ry = 0, mv = m) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const tam = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k, vert = f === 2 || f === 3 ? m : mv;
    uv.setXY(i, uv.getX(i) * tam[f][0] / m, uv.getY(i) * tam[f][1] / vert);
  }
  return em(malha(g, mat), x, y0 + h / 2, z, ry);
}
/* o plano deitado (o chão) com a uv do mundo (repete a cada `m` metros em
   x e `mv` em z) */
export function chao(w, d, mat, m = 1, x = 0, y = 0, z = 0, ry = 0, mv = m) {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-PI / 2);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / m, uv.getY(i) * d / mv);
  return em(malha(g, mat), x, y, z, ry);
}
/* o plano deitado com a folha inteira nele (o decalque, a sombra) */
export function folhaNoChao(w, d, mat, x = 0, y = 0.01, z = 0, ry = 0) { return chao(w, d, mat, w, x, y, z, ry, d); }
/* o plano em pé, de frente pra +z (o letreiro, o painel) */
export function painel(w, h, mat, x = 0, y = 0, z = 0, ry = 0) { return em(malha(new THREE.PlaneGeometry(w, h), mat), x, y, z, ry); }
/* o cilindro em pé (o pé no y0) */
export function cilindro(r0, r1, h, mat, seg = 12, x = 0, y0 = 0, z = 0) { return em(malha(new THREE.CylinderGeometry(r1, r0, h, seg), mat), x, y0 + h / 2, z); }
/* o tubo por uma lista de pontos (a mangueira, a alça, o cabo) */
export function tubo(pts, r, mat, seg = 16, rad = 6) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  return malha(new THREE.TubeGeometry(c, seg, r, rad, false), mat);
}
/* A FORMA DE LADO (x, y): o ponto [x, y] é reta, [x, y, cx, cy] é curva
   (cx, cy o controle) e { arco: [cx, cy, r, a0, a1, horário] } é o arco
   (a caixa de roda) */
function forma(pts) {
  const s = new THREE.Shape(); let ini = true;
  for (const p of pts) {
    if (p.arco) {
      const [cx, cy, r, a0, a1, h] = p.arco;
      if (ini) { s.moveTo(cx + r * Math.cos(a0), cy + r * Math.sin(a0)); ini = false; }
      s.absarc(cx, cy, r, a0, a1, !!h); continue;
    }
    if (ini) { s.moveTo(p[0], p[1]); ini = false; }
    else if (p.length === 4) s.quadraticCurveTo(p[2], p[3], p[0], p[1]); else s.lineTo(p[0], p[1]);
  }
  return s;
}
/* o perfil extrudado em z (de -prof/2 a +prof/2), com a borda arredondada
   (o `bisel` engorda o contorno: a tampa do lado é o contorno, e o resto
   passa `bisel` pra fora dele) */
export function perfil(pts, prof, mat, bisel = 0, curvas = 3) {
  const g = new THREE.ExtrudeGeometry(forma(pts), { depth: Math.max(0.001, prof - 2 * bisel), bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 2, curveSegments: curvas });
  g.translate(0, 0, -(prof - 2 * bisel) / 2);
  return malha(g, mat);
}
/* a placa fina assentada no segmento a → b do perfil (x, y), afastada
   `af` pra fora (pro lado de cima): o para-brisa, o vidro de trás */
export function placaNoPerfil(a, b, larg, mat, af = 0, esp = 0.02, encolhe = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  let nx = -dy / L, ny = dx / L; if (ny < 0) { nx = -nx; ny = -ny; }
  const m = malha(new THREE.BoxGeometry(Math.max(0.01, L - 2 * encolhe), esp, larg), mat);
  m.position.set((a[0] + b[0]) / 2 + nx * (af + esp / 2), (a[1] + b[1]) / 2 + ny * (af + esp / 2), 0);
  m.rotation.z = Math.atan2(dy, dx);
  return m;
}
/* a roda: o pneu, o aro, o cubo e os raios; o eixo em z */
export function roda(r = 0.33, larg = 0.2, corAro = '#b9bec2', raios = 5) {
  const g = new THREE.Group();
  const pneu = malha(new THREE.CylinderGeometry(r, r, larg, 18), fosco('#1b1c1d')); pneu.rotation.x = PI / 2; g.add(pneu);
  for (const s of [-1, 1]) {
    const aro = malha(new THREE.CylinderGeometry(r * 0.64, r * 0.64, 0.02, 14), brilho(corAro, 80, '#999999')); aro.rotation.x = PI / 2; aro.position.z = s * (larg / 2 + 0.004); g.add(aro);
    const cubo = malha(new THREE.CylinderGeometry(r * 0.16, r * 0.2, 0.04, 8), fosco('#5c6064')); cubo.rotation.x = PI / 2; cubo.position.z = s * (larg / 2 + 0.018); g.add(cubo);
    for (let k = 0; k < raios; k++) {
      const a = 2 * PI * k / raios, b = caixa(0.05, r * 0.42, 0.012, fosco('#2c2e30'));
      b.position.set(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, s * (larg / 2 + 0.012)); b.rotation.z = a + PI / 2; g.add(b);
    }
  }
  return g;
}
/* A SOMBRA DE CONTATO embaixo da peça (w × d do chão que ela cobre): o
   miolo escuro do tamanho dela e a borda que some em `b` metros pra
   fora (as nove fatias: a borda não cresce com a peça) */
const matSombra = (op, redonda) => pintado('sombra' + op + (redonda ? 'r' : ''), redonda ? TEX.sombraRedonda() : TEX.sombra(), { cor: '#000000', transparente: true, opacidade: op, decalque: true });
export function sombra(w, d, x = 0, z = 0, ry = 0, op = 0.55, redonda = false, b = null) {
  if (redonda) return folhaNoChao(w * 1.5, d * 1.5, matSombra(op, true), x, 0.008, z, ry);
  b = b ?? Math.min(0.9, 0.25 + 0.12 * Math.min(w, d));
  const xs = [-w / 2 - b, -w / 2 + b * 0.35, w / 2 - b * 0.35, w / 2 + b], zs = [-d / 2 - b, -d / 2 + b * 0.35, d / 2 - b * 0.35, d / 2 + b], us = [0, 0.5, 0.5, 1];
  const pos = [], uv = [], idx = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { pos.push(xs[i], 0, zs[j]); uv.push(us[i], 1 - us[j]); }
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const a = j * 4 + i; idx.push(a, a + 4, a + 1, a + 1, a + 4, a + 5); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(16).fill(0).flatMap(() => [0, 1, 0]), 3)); g.setIndex(idx);
  return em(malha(g, matSombra(op, false)), x, 0.008, z, ry);
}
/* a faixa escura no pé da parede: ao longo de x, de z = 0 (junto da
   parede, escura) até z = larg (clara) */
export function sombraDeParede(L, larg = 0.9, op = 0.35) {
  const g = new THREE.PlaneGeometry(L, larg); g.rotateX(-PI / 2); g.translate(0, 0.006, larg / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + L / 2) / L, 1 - p.getZ(i) / larg);
  return malha(g, pintado('sombraParede' + op, TEX.sombraLinha(), { cor: '#000000', transparente: true, opacidade: op, decalque: true }));
}
/* a sombra dos dois lados de um muro (ao longo de x, com a espessura `e`) */
export function sombraDeMuro(L, e, larg = 0.9, op = 0.35) {
  const g = new THREE.Group();
  const a = sombraDeParede(L, larg, op); a.position.z = e / 2; g.add(a);
  const b = sombraDeParede(L, larg, op); b.rotation.y = PI; b.position.z = -e / 2; g.add(b);
  return g;
}

/* =======================================================
   OS VEÍCULOS (o comprimento em x, a frente pro +x)
   ======================================================= */
/* O CARRO DE PASSEIO: o corpo de baixo (o perfil com a caixa de roda
   recortada, o capô, o porta-malas), a cabine mais estreita em cima
   (o para-brisa, o teto, o vidro de trás), os vidros de lado com a coluna
   do meio, os faróis, as lanternas, a grade, o para-choque, os
   retrovisores, as maçanetas, a linha das portas, a placa e as rodas */
const TIPOS_DE_CARRO = {
  /* L, W, yb (a saia), rr (a roda), ra (a caixa), ef/et (o eixo a partir das pontas),
     o perfil do corpo da frente pra trás e a cabine (A: pé do para-brisa, B: alto do
     para-brisa, C: fim do teto, D: pé do vidro de trás) */
  sedan: { L: 4.5, W: 1.78, yb: 0.27, rr: 0.31, ra: 0.4, ef: 0.9, et: 0.95,
    corpo: (x0, x1) => [[x1 + 0.02, 0.6], [x1 - 0.12, 0.77, x1 + 0.01, 0.76], [x1 - 1.25, 0.9], [x0 + 0.62, 0.93], [x0 + 0.05, 0.92], [x0 - 0.02, 0.8, x0 + 0.02, 0.9], [x0 - 0.02, 0.47]],
    cab: (x0, x1) => [[x1 - 1.25, 0.9], [x1 - 1.98, 1.38], [x0 + 1.32, 1.4], [x0 + 0.62, 0.93]], farol: 0.64, lanterna: 0.8, portas: 4 },
  hatch: { L: 3.95, W: 1.72, yb: 0.27, rr: 0.3, ra: 0.39, ef: 0.78, et: 0.72,
    corpo: (x0, x1) => [[x1 + 0.02, 0.6], [x1 - 0.12, 0.76, x1 + 0.01, 0.75], [x1 - 1.1, 0.9], [x0 + 0.1, 0.95], [x0 - 0.02, 0.85, x0 + 0.01, 0.94], [x0 - 0.02, 0.47]],
    cab: (x0, x1) => [[x1 - 1.1, 0.9], [x1 - 1.85, 1.42], [x0 + 0.42, 1.42], [x0 + 0.1, 0.96]], farol: 0.63, lanterna: 0.84, portas: 2 },
  suv: { L: 4.6, W: 1.86, yb: 0.36, rr: 0.36, ra: 0.46, ef: 0.95, et: 1.0,
    corpo: (x0, x1) => [[x1 + 0.03, 0.85], [x1 - 0.12, 1.02, x1 + 0.02, 1.01], [x1 - 1.2, 1.08], [x0 + 0.1, 1.1], [x0 - 0.02, 1.0, x0 + 0.01, 1.1], [x0 - 0.02, 0.55]],
    cab: (x0, x1) => [[x1 - 1.2, 1.08], [x1 - 1.9, 1.68], [x0 + 0.3, 1.72], [x0 + 0.1, 1.12]], farol: 0.86, lanterna: 0.98, portas: 4, bagageiro: true }
};
export function carro(o = {}) {
  const T = TIPOS_DE_CARRO[o.tipo] || TIPOS_DE_CARRO.sedan, cor = o.cor || '#d9dadb', g = new THREE.Group();
  const { L, W, yb, rr, ra } = T, x0 = -L / 2, x1 = L / 2, xf = x1 - T.ef, xt = x0 + T.et, bis = 0.06;
  const tinta = brilho(cor, 90, '#9a9a9a'), preto = fosco('#15171a'), plast = fosco('#232527');
  const a = Math.asin(Math.max(-0.9, Math.min(0.9, (rr - yb) / ra)));
  const arco = x => ({ arco: [x, rr, ra, PI + a, -a, true] });
  /* o corpo de baixo */
  const pts = [[x0 + 0.26, yb], arco(xt), arco(xf), [x1 - 0.22, yb], [x1 + 0.02, yb + 0.18, x1 + 0.01, yb + 0.01], ...T.corpo(x0, x1), [x0 + 0.26, yb, x0 - 0.01, yb + 0.01]];
  g.add(perfil(pts, W, tinta, bis, 5));
  /* a cabine (mais estreita: o ombro do corpo aparece dos lados) */
  const [A, B, C, D] = T.cab(x0, x1), Wc = W - 0.18, bc = 0.05;
  g.add(perfil([A, B, [C[0], C[1], (B[0] + C[0]) / 2, Math.max(B[1], C[1]) + 0.07], D], Wc, tinta, bc, 6));
  /* os vidros: o para-brisa, o de trás, os de lado (com a coluna do meio na cor) */
  const vid = vidro('#101920', 0.94);
  g.add(placaNoPerfil(A, B, Wc - 0.16, vid, bc + 0.002, 0.02, 0.04));
  g.add(placaNoPerfil(C, D, Wc - 0.16, vid, bc + 0.002, 0.02, 0.04));
  const lado = [[A[0] - 0.1, A[1] + 0.07], [B[0] + 0.03, B[1] - 0.05], [C[0] - 0.03, C[1] - 0.05], [D[0] + 0.1, D[1] + 0.07]];
  const meio = (A[0] + D[0]) / 2 - 0.12;
  for (const s of [-1, 1]) {
    const zc = s * (Wc / 2 + 0.004);
    g.add(em(perfil(lado, 0.012, vid), 0, 0, zc));
    if (T.portas === 4) g.add(caixa(0.08, (B[1] + C[1]) / 2 - A[1] - 0.1, 0.02, tinta, meio, A[1] + 0.05, s * (Wc / 2 + 0.01)));
    /* a linha das portas, as maçanetas e o retrovisor */
    const z = s * (W / 2 + 0.003), yt = A[1] - 0.03;
    const linhas = T.portas === 4 ? [xf - ra - 0.08, meio, xt + ra + 0.06] : [xf - ra - 0.08, meio + 0.35];
    for (const lx of linhas) g.add(caixa(0.012, yt - yb - 0.12, 0.01, preto, lx, yb + 0.1, z));
    for (const mx of T.portas === 4 ? [meio + 0.25, linhas[2] + 0.25] : [linhas[1] + 0.25]) g.add(caixa(0.16, 0.03, 0.02, fosco('#3a3d40'), mx, yt - 0.14, s * (W / 2 + 0.008)));
    g.add(caixa(0.14, 0.11, 0.2, tinta, A[0] - 0.08, A[1] + 0.02, s * (W / 2 + 0.07)));
    g.add(caixa(0.02, 0.09, 0.16, vidro('#6a7880', 1), A[0] - 0.16, A[1] + 0.03, s * (W / 2 + 0.08)));
    /* os faróis e as lanternas */
    g.add(caixa(0.05, 0.1, 0.36, luz('#f3f0e0'), x1 + bis + 0.01, T.farol - 0.02, s * (W / 2 - 0.3)));
    g.add(caixa(0.05, 0.12, 0.38, luz('#b52019'), x0 - bis - 0.03, T.lanterna - 0.06, s * (W / 2 - 0.28)));
  }
  /* a grade, o para-choque de plástico, as placas */
  g.add(caixa(0.05, 0.12, W * 0.4, preto, x1 + bis + 0.03, T.farol - 0.16, 0));
  g.add(caixa(0.1, 0.13, W - 0.08, plast, x1 + 0.02, yb - 0.02, 0));
  g.add(caixa(0.1, 0.13, W - 0.08, plast, x0 - 0.02, yb - 0.02, 0));
  g.add(em(painel(0.4, 0.13, pintado('placa', TEX.placa())), x1 + bis + 0.03, yb + 0.22, 0, PI / 2));
  g.add(em(painel(0.4, 0.13, pintado('placa', TEX.placa())), x0 - bis - 0.03, T.lanterna - 0.2, 0, -PI / 2));
  if (T.bagageiro) for (const s of [-1, 1]) g.add(caixa(B[0] - C[0] - 0.4, 0.05, 0.05, preto, (B[0] + C[0]) / 2, Math.max(B[1], C[1]) + 0.1, s * (Wc / 2 - 0.12)));
  /* as rodas (a face de fora rente à tampa do corpo) */
  for (const ex of [xf, xt]) for (const s of [-1, 1]) g.add(em(roda(rr, 0.2, o.aro || '#aeb3b7', 5), ex, rr, s * (W / 2 - 0.1)));
  g.add(sombra(L * 0.92, W * 0.9, 0, 0, 0, 0.6));
  return g;
}
/* O ÔNIBUS DE VIAGEM: o perfil de lado (a frente quase reta, o teto
   arredondado nas pontas, as três caixas de roda recortadas) extrudado
   com a borda arredondada; a faixa de janela escura dos dois lados com
   as colunas, a porta de vidro do lado direito, o bagageiro, a faixa da
   pintura, o para-brisa com o itinerário, os faróis, as lanternas, a
   grade do motor, os dois retrovisores de orelha, o ar-condicionado com
   as ventoinhas, as escotilhas e as seis rodas */
export function onibus(o = {}) {
  const L = o.comp || 12.4, W = o.larg || 2.55, H = o.alt || 3.5, cor = o.cor || '#eeeeea', cor2 = o.cor2 || '#b3261e', cor3 = o.cor3 || '#1f2e44';
  const g = new THREE.Group(), x0 = -L / 2, x1 = L / 2, yb = 0.48, rr = 0.52, ra = 0.64, bis = 0.08;
  const ef = x1 - 2.45, et1 = x0 + 2.45, et2 = x0 + 3.75;
  const a = Math.asin((rr - yb) / ra), arco = x => ({ arco: [x, rr, ra, PI + a, -a, true] });
  const tinta = brilho(cor, 70, '#666666'), preto = fosco('#131416'), vid = vidro('#0f171d', 0.95);
  const pb0 = [x1 + 0.02, 1.25], pb1 = [x1 - 0.16, H - 0.32];
  g.add(perfil([[x0 + 0.3, yb], arco(et1), arco(et2), arco(ef), [x1 - 0.3, yb], [x1 + 0.02, yb + 0.3, x1 + 0.01, yb + 0.01], pb0, pb1,
                [x1 - 0.5, H, x1 - 0.2, H - 0.02], [x0 + 0.3, H], [x0, H - 0.3, x0 + 0.01, H - 0.01], [x0 - 0.01, yb + 0.3], [x0 + 0.3, yb, x0, yb + 0.01]], W, tinta, bis, 6));
  /* a faixa de janela: o vidro escuro contínuo, a borda preta e as colunas */
  const jy0 = 1.5, jy1 = H - 0.42, jx0 = x0 + 0.4, jx1 = x1 - 0.5, px0 = x1 - 1.55, px1 = x1 - 0.55;
  for (const s of [-1, 1]) {
    const z = s * (W / 2 + 0.005), ate = s > 0 ? px0 - 0.05 : jx1;
    g.add(caixa(ate - jx0, jy1 - jy0, 0.02, vid, (jx0 + ate) / 2, jy0, z));
    g.add(caixa(ate - jx0, 0.05, 0.03, preto, (jx0 + ate) / 2, jy0 - 0.05, z));
    g.add(caixa(ate - jx0, 0.05, 0.03, preto, (jx0 + ate) / 2, jy1, z));
    const n = Math.round((ate - jx0) / 1.55);
    for (let i = 1; i < n; i++) g.add(caixa(0.07, jy1 - jy0, 0.03, preto, jx0 + (ate - jx0) * i / n, jy0, s * (W / 2 + 0.01)));
    /* a faixa da pintura (duas cores) e o bagageiro com as tampas */
    const fz = s * (W / 2 + 0.006), fim = s > 0 ? px0 - 0.02 : x1 - 0.15;
    g.add(caixa(fim - x0 - 0.1, 0.16, 0.02, fosco(cor2), (x0 + 0.1 + fim) / 2, 1.2, fz));
    g.add(caixa(fim - x0 - 0.1, 0.05, 0.02, fosco(cor3), (x0 + 0.1 + fim) / 2, 1.4, fz));
    const b0 = et2 + ra + 0.15, b1 = ef - ra - 0.15, nb = 3;
    for (let i = 0; i <= nb; i++) g.add(caixa(0.02, 0.56, 0.02, preto, b0 + (b1 - b0) * i / nb, 0.56, s * (W / 2 + 0.007)));
    for (const y of [0.56, 1.1]) g.add(caixa(b1 - b0, 0.02, 0.02, preto, (b0 + b1) / 2, y, s * (W / 2 + 0.007)));
    /* as rodas */
    for (const ex of [ef, et1, et2]) g.add(em(roda(rr, 0.32, '#c5c9cc', 8), ex, rr, s * (W / 2 - 0.17)));
  }
  /* a porta dianteira do lado direito (+z, com a frente no +x): duas folhas de vidro */
  for (const k of [0, 1]) {
    const cx = px0 + (px1 - px0) * (k + 0.5) / 2;
    g.add(caixa((px1 - px0) / 2 - 0.04, 2.35, 0.02, vid, cx, 0.55, W / 2 + 0.008));
    g.add(caixa(0.05, 2.35, 0.03, preto, px0 + (px1 - px0) * k, 0.55, W / 2 + 0.012));
  }
  g.add(caixa(0.05, 2.35, 0.03, preto, px1, 0.55, W / 2 + 0.012));
  g.add(caixa(px1 - px0, 0.05, 0.03, preto, (px0 + px1) / 2, 2.9, W / 2 + 0.012));
  /* o para-brisa (com a coluna do meio), o itinerário e o limpador */
  g.add(placaNoPerfil(pb0, pb1, W - 0.28, vid, bis + 0.002, 0.02, 0.03));
  g.add(placaNoPerfil(pb0, pb1, 0.06, preto, bis + 0.012, 0.02, 0.03));
  g.add(em(painel(W - 0.6, 0.26, pintado('itin' + (o.itinerario || ''), TEX.itinerario(o.itinerario || 'FRETADO · CARAVANA'))), x1 - 0.015, H - 0.62, 0, PI / 2));
  for (const s of [-1, 1]) { const l = caixa(0.02, 0.7, 0.03, preto, x1 + bis + 0.04, 1.3, s * 0.5); l.rotation.x = s * 0.45; g.add(l); }
  /* a frente: a grade, os faróis, o para-choque, a placa */
  g.add(caixa(0.05, 0.3, W - 0.9, preto, x1 + bis + 0.035, 0.88, 0));
  for (const s of [-1, 1]) {
    for (const dz of [0.22, 0.46]) g.add(caixa(0.05, 0.14, 0.2, luz('#f4f1e2'), x1 + bis + 0.04, 0.92, s * (W / 2 - dz)));
    g.add(caixa(0.05, 0.08, 0.2, luz('#ff9b2a'), x1 + bis + 0.04, 0.8, s * (W / 2 - 0.3)));
  }
  g.add(caixa(0.22, 0.3, W + 0.02, fosco('#2a2c2e'), x1 + 0.02, 0.42, 0));
  g.add(em(painel(0.4, 0.13, pintado('placa', TEX.placa())), x1 + 0.14, 0.57, 0, PI / 2));
  /* a traseira: o vidro de cima, as lanternas, a grade do motor, o para-choque */
  g.add(caixa(0.03, 0.8, W - 0.6, vid, x0 - bis - 0.03, H - 1.25, 0));
  for (const s of [-1, 1]) g.add(caixa(0.05, 1.1, 0.14, luz('#c3231d'), x0 - bis - 0.035, 0.8, s * (W / 2 - 0.12)));
  for (let i = 0; i < 7; i++) g.add(caixa(0.04, 0.05, W - 0.8, preto, x0 - bis - 0.03, 0.72 + i * 0.11, 0));
  g.add(caixa(0.22, 0.3, W + 0.02, fosco('#2a2c2e'), x0 - 0.02, 0.42, 0));
  /* os retrovisores de orelha (o braço curvo e o espelho pra frente) */
  for (const s of [-1, 1]) {
    g.add(tubo([[x1 - 0.25, H - 0.55, s * (W / 2 - 0.05)], [x1 + 0.2, H - 0.45, s * (W / 2 + 0.18)], [x1 + 0.42, H - 0.8, s * (W / 2 + 0.26)]], 0.03, preto, 10, 5));
    g.add(caixa(0.12, 0.44, 0.22, preto, x1 + 0.44, H - 1.3, s * (W / 2 + 0.28)));
  }
  /* o ar-condicionado no teto (a carenagem com as ventoinhas) e as escotilhas */
  const ax = x1 - 4.4;
  g.add(em(perfil([[-1.5, 0], [1.5, 0], [1.3, 0.32, 1.5, 0.3], [-1.3, 0.32], [-1.5, 0, -1.5, 0.3]], 1.8, fosco('#d7d9d7'), 0.05, 3), ax, H - 0.02, 0));
  for (const dx of [-0.7, 0.7]) g.add(folhaNoChao(0.62, 0.62, pintado('ventoinha', TEX.ventoinha()), ax + dx, H + 0.37, 0));
  for (const s of [-1, 1]) g.add(caixa(2.2, 0.02, 0.22, fosco('#8f9294'), ax, H + 0.345, s * 0.72));
  for (const ex of [x0 + 2.3, x0 + 5.3]) { g.add(caixa(0.78, 0.07, 0.72, fosco('#cfd1cf'), ex, H + bis - 0.01, 0)); g.add(caixa(0.6, 0.02, 0.54, fosco('#9ea1a3'), ex, H + bis + 0.06, 0)); }
  /* a calha do teto dos dois lados */
  for (const s of [-1, 1]) g.add(caixa(L - 0.9, 0.04, 0.04, fosco('#9da0a2'), -0.1, H - 0.12, s * (W / 2 + 0.02)));
  g.add(sombra(L * 0.95, W * 0.95, 0, 0, 0, 0.62));
  return g;
}
/* O CAMINHÃO BAÚ: a cabine (com a caixa da roda, o para-brisa, o
   farol, o retrovisor), o chassi, o baú canelado e as rodas */
export function caminhao(o = {}) {
  const g = new THREE.Group(), cor = o.cor || '#e8e8e4', bau = o.bau || '#d7d9d9', L = o.comp || 8.5, W = 2.45, bis = 0.07;
  const x0 = -L / 2, x1 = L / 2, xc0 = x1 - 2.15, rr = 0.5, ef = x1 - 1.15, et = x0 + 1.5;
  const a = Math.asin((rr - 0.78) / 0.62);
  const tinta = brilho(cor, 60), preto = fosco('#15171a'), vid = vidro('#101920', 0.94);
  const p0 = [x1 + 0.02, 1.6], p1 = [x1 - 0.12, 2.75];
  g.add(perfil([[xc0, 0.78], { arco: [ef, rr, 0.62, PI + a, -a, true] }, [x1 - 0.15, 0.78], [x1 + 0.02, 1.0, x1 + 0.02, 0.8], p0, p1, [x1 - 0.4, 2.98, x1 - 0.12, 2.97], [xc0, 2.98]], W, tinta, bis, 4));
  g.add(placaNoPerfil(p0, p1, W - 0.3, vid, bis + 0.002, 0.02, 0.03));
  for (const s of [-1, 1]) {
    g.add(caixa(0.8, 0.7, 0.02, vid, x1 - 0.72, 1.85, s * (W / 2 + 0.005)));
    g.add(caixa(0.05, 0.15, 0.32, luz('#f3f0e0'), x1 + bis, 0.95, s * (W / 2 - 0.35)));
    g.add(tubo([[x1 - 0.1, 2.4, s * (W / 2)], [x1 + 0.12, 2.4, s * (W / 2 + 0.25)]], 0.025, preto, 4, 4));
    g.add(caixa(0.08, 0.45, 0.2, preto, x1 + 0.15, 1.8, s * (W / 2 + 0.3)));
    g.add(caixa(1.2, 0.03, 0.02, preto, x1 - 1.2, 0.95, s * (W / 2 + 0.006)));
  }
  g.add(caixa(0.05, 0.4, W - 0.9, preto, x1 + bis, 1.05, 0));
  g.add(caixa(0.2, 0.3, W, fosco('#2a2c2e'), x1 + 0.02, 0.45, 0));
  g.add(caixa(L - 0.6, 0.3, 0.9, preto, -0.2, 0.55, 0));
  const nb = xc0 - 0.15 - x0;
  g.add(caixaUV(nb, 2.7, W + 0.05, pintado('zincoBau' + bau, TEX.zinco(0.1), { cor: bau }), 1.2, x0 + nb / 2, 1.08, 0, 0, 2.7));
  g.add(caixa(nb + 0.04, 0.08, W + 0.1, fosco('#8a8d8f'), x0 + nb / 2, 3.78, 0));
  for (const s of [-1, 1]) {
    g.add(em(roda(rr, 0.3, '#a9adb0', 6), ef, rr, s * (W / 2 - 0.2)));
    for (const ex of [et, et + 1.1]) g.add(em(roda(rr, 0.3, '#a9adb0', 6), ex, rr, s * (W / 2 - 0.2)));
  }
  g.add(sombra(L * 0.95, W * 0.95, 0, 0, 0, 0.6));
  return g;
}
/* o contêiner (6 m, canelado, na cor dele) */
export function conteiner(cor = '#8a3b2a', L = 6.05) {
  const g = new THREE.Group();
  g.add(caixaUV(L, 2.6, 2.44, pintado('cont' + cor, TEX.zinco(0.15), { cor }), 3.5, 0, 0, 0, 0, 2.6));
  for (const x of [-L / 2 + 0.05, L / 2 - 0.05]) for (const z of [-1.17, 1.17]) g.add(caixa(0.12, 2.62, 0.12, fosco('#3b3d3f'), x, -0.01, z));
  for (const z of [-1.1, 1.1]) g.add(caixa(L, 0.1, 0.1, fosco('#3b3d3f'), 0, 2.52, z));
  g.add(sombra(L, 2.44, 0, 0, 0, 0.5));
  return g;
}

/* =======================================================
   O POSTO E A ESTRADA
   ======================================================= */
/* A BOMBA (o bico e a mangueira dos dois lados): o pé, o corpo cinza,
   o topo na cor da marca, os dois visores, os coldres com os bicos,
   as mangueiras caindo em curva */
export function bomba(o = {}) {
  const g = new THREE.Group(), marca = o.marca || '#b3261e';
  g.add(caixa(1.05, 0.12, 0.62, fosco('#8f9092')));
  g.add(caixa(0.96, 1.25, 0.52, brilho('#e9e9e6', 40), 0, 0.12, 0));
  g.add(caixa(1.0, 0.4, 0.56, brilho(marca, 50), 0, 1.37, 0));
  g.add(caixa(1.02, 0.04, 0.58, fosco('#2a2a2a'), 0, 1.76, 0));
  for (const s of [-1, 1]) {
    g.add(em(painel(0.42, 0.42, pintado('visor', TEX.visor())), 0, 0.98, s * 0.262, s > 0 ? 0 : PI));
    g.add(em(painel(0.8, 0.16, pintado('bombaMarca' + marca, TEX.letreiro('COMBUSTÍVEL', marca, '#ffffff', 512, 96))), 0, 1.56, s * 0.282, s > 0 ? 0 : PI));
    for (const dx of [-0.34, 0.34]) {
      g.add(caixa(0.14, 0.26, 0.1, fosco('#3a3c3e'), dx, 0.55, s * 0.31));
      g.add(caixa(0.06, 0.2, 0.16, fosco(dx < 0 ? '#1d6b32' : '#2a2a2a'), dx, 0.62, s * 0.37));
      g.add(tubo([[dx * 0.9, 1.5, s * 0.28], [dx * 1.3, 1.2, s * 0.62], [dx * 1.2, 0.35, s * 0.7], [dx, 0.62, s * 0.42]], 0.022, fosco('#141516'), 18, 5));
    }
  }
  return g;
}
/* A ILHA: o concreto de ponta redonda com a guia pintada, as bombas, os
   pilaretes amarelos das pontas, a lixeira, o balde do rodo e o
   extintor */
export function ilhaDeBombas(comp = 9, larg = 2.4, n = 2, o = {}) {
  const g = new THREE.Group(), r = larg / 2;
  const contorno = [[-comp / 2 + r, -r], [comp / 2 - r, -r], [comp / 2, 0, comp / 2, -r], [comp / 2 - r, r, comp / 2, r], [-comp / 2 + r, r], [-comp / 2, 0, -comp / 2, r], [-comp / 2 + r, -r, -comp / 2, -r]];
  const base = perfil(contorno, 0.18, pintado('concretoIlha', TEX.concreto(), { cor: '#e2ddd3' }), 0, 8);
  base.rotation.x = -PI / 2; base.position.y = 0.09;
  const uv = base.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 5, uv.getY(i) / 5);
  g.add(base);
  const guia = perfil(contorno, 0.06, fosco('#e3b93a'), 0, 8);
  guia.rotation.x = -PI / 2; guia.position.y = 0.03; guia.scale.set(1 + 0.12 / comp, 1 + 0.12 / larg, 1); g.add(guia);
  for (let i = 0; i < n; i++) g.add(em(bomba(o), -comp / 2 + comp * (i + 0.5) / n, 0.18, 0));
  for (const s of [-1, 1]) {
    g.add(cilindro(0.09, 0.09, 0.95, brilho('#e8b925', 60), 10, s * (comp / 2 - 0.3), 0.18, 0));
    for (const y of [0.45, 0.75]) g.add(cilindro(0.093, 0.093, 0.07, fosco('#1b1b1b'), 10, s * (comp / 2 - 0.3), 0.18 + y, 0));
  }
  const zl = larg / 2 - 0.24;
  g.add(cilindro(0.18, 0.2, 0.7, fosco('#2f6f3a'), 10, -0.3, 0.18, zl));
  g.add(cilindro(0.15, 0.13, 0.3, fosco('#2b5fa0'), 10, 0.45, 0.18, zl));
  g.add(tubo([[0.45, 0.45, zl], [0.5, 1.1, zl + 0.05]], 0.015, fosco('#7a5a3a'), 3, 4));
  g.add(cilindro(0.09, 0.09, 0.55, brilho('#c8261e', 60), 10, 0.2, 0.18, -zl));
  g.add(sombra(comp, larg, 0, 0, 0, 0.35));
  return g;
}
/* O TOTEM DE PREÇO: o pé de concreto, o mastro vermelho, a marca e o painel */
export function totem() {
  const g = new THREE.Group();
  g.add(caixa(1.6, 0.5, 0.8, fosco('#c9c4ba')));
  g.add(caixa(1.2, 6.2, 0.45, brilho('#b3261e', 50), 0, 0.5, 0));
  for (const s of [-1, 1]) {
    g.add(em(painel(1.1, 1.65, pintado('precos', TEX.precos())), 0, 5.3, s * 0.232, s > 0 ? 0 : PI));
    g.add(em(painel(1.1, 0.5, pintado('marcaTotem', TEX.letreiro('AUTO POSTO', '#ffffff', '#b3261e', 512, 128))), 0, 3.9, s * 0.232, s > 0 ? 0 : PI));
  }
  g.add(sombra(1.6, 0.8, 0, 0, 0, 0.45));
  return g;
}
/* O POSTE: o tubo galvanizado afinando, o braço curvo e a luminária de cabeça chata */
export function poste(alt = 7.5) {
  const g = new THREE.Group();
  g.add(cilindro(0.12, 0.07, alt, brilho('#9da2a5', 40), 10));
  g.add(cilindro(0.2, 0.2, 0.3, fosco('#8a8d8f'), 10));
  g.add(tubo([[0, alt - 0.3, 0], [0.4, alt + 0.1, 0], [1.4, alt + 0.2, 0]], 0.05, brilho('#9da2a5', 40), 12, 6));
  g.add(em(perfil([[-0.1, -0.05], [0.65, -0.05], [0.7, 0.1], [-0.05, 0.14]], 0.34, fosco('#6c7072'), 0.02), 1.3, alt + 0.12, 0));
  g.add(caixa(0.5, 0.03, 0.26, luz('#fff4d6'), 1.62, alt + 0.04, 0));
  g.add(sombra(0.5, 0.5, 0, 0, 0, 0.4, true));
  return g;
}
/* o pneu deitado (o toro achatado) e a pilha */
export function pneu(r = 0.33) {
  const m = malha(new THREE.TorusGeometry(r, r * 0.36, 6, 14), fosco('#1d1e1f'));
  m.rotation.x = PI / 2; m.scale.z = 0.72; m.position.y = r * 0.26;
  return m;
}
export function pilhaDePneus(n = 4, r = 0.33, rnd = Math.random) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const p = pneu(r); p.position.set((rnd() - 0.5) * 0.06, i * r * 0.52 + r * 0.26, (rnd() - 0.5) * 0.06); g.add(p); }
  g.add(sombra(r * 2.7, r * 2.7, 0, 0, 0, 0.45, true));
  return g;
}
/* o pneu em pé, encostado */
export function pneuEmPe(r = 0.33) { const m = malha(new THREE.TorusGeometry(r, r * 0.36, 6, 14), fosco('#1d1e1f')); m.position.y = r * 1.1; m.scale.z = 0.72; return m; }
/* o tambor de 200 l: o corpo, os dois frisos e a tampa com o bocal */
export function tambor(cor = '#2f5f9e') {
  const g = new THREE.Group();
  g.add(cilindro(0.29, 0.29, 0.88, brilho(cor, 30), 16));
  for (const y of [0.3, 0.6]) { const f = malha(new THREE.TorusGeometry(0.295, 0.015, 4, 20), fosco(cor)); f.rotation.x = PI / 2; f.position.y = y; g.add(f); }
  g.add(cilindro(0.27, 0.27, 0.02, fosco('#3a3c3e'), 16, 0, 0.88));
  g.add(cilindro(0.04, 0.04, 0.03, fosco('#9a9c9e'), 8, 0.14, 0.9, 0));
  g.add(sombra(0.6, 0.6, 0, 0, 0, 0.45, true));
  return g;
}
/* o carretel da mangueira do ar e da água (na parede; a parede no -z) */
export function carretel() {
  const g = new THREE.Group();
  const d = malha(new THREE.TorusGeometry(0.28, 0.08, 6, 16), fosco('#1f5aa8')); d.position.y = 0.6; g.add(d);
  const e = malha(new THREE.TorusGeometry(0.2, 0.03, 4, 14), fosco('#d9d9d6')); e.position.y = 0.6; e.position.z = 0.05; g.add(e);
  g.add(caixa(0.1, 1.0, 0.06, fosco('#5a5d60'), 0, 0.1, -0.08));
  g.add(tubo([[0.25, 0.4, 0.05], [0.4, 0.15, 0.25], [0.2, 0.02, 0.6]], 0.02, fosco('#1a1a1a'), 10, 4));
  return g;
}
/* a mangueira enrolada no chão (as voltas) */
export function mangueiraNoChao(cor = '#1a1a1a') {
  const g = new THREE.Group();
  for (let k = 0; k < 4; k++) { const t = malha(new THREE.TorusGeometry(0.28 + k * 0.035, 0.018, 4, 20), fosco(cor)); t.rotation.x = PI / 2; t.position.set(k * 0.02, 0.02 + k * 0.012, -k * 0.015); g.add(t); }
  return g;
}
/* O FREEZER DE SORVETE (o baú branco com a tampa de vidro e a marca) */
export function freezer(marca = '#1f5aa8') {
  const g = new THREE.Group();
  g.add(caixa(1.3, 0.82, 0.68, brilho('#f4f4f2', 40)));
  g.add(folhaNoChao(1.28, 0.66, pintado('freezer', TEX.freezer()), 0, 0.825, 0));
  for (const s of [-1, 1]) g.add(em(painel(0.9, 0.3, pintado('marcaFreezer' + marca, TEX.letreiro('SORVETES', marca, '#ffffff', 512, 160))), 0, 0.5, s * 0.345, s > 0 ? 0 : PI));
  g.add(sombra(1.3, 0.7, 0, 0, 0, 0.45));
  return g;
}
/* A GAIOLA DE BOTIJÃO (a grade com o telhadinho e os botijões) */
export function gaiolaDeGas() {
  const g = new THREE.Group(), gr = fosco('#3c4a44');
  for (const [x, z] of [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]]) g.add(caixa(0.05, 1.5, 0.05, gr, x, 0, z));
  for (const y of [0.05, 0.75, 1.45]) { g.add(caixa(1.55, 0.04, 0.04, gr, 0, y, 0.35)); g.add(caixa(1.55, 0.04, 0.04, gr, 0, y, -0.35)); }
  for (let i = 0; i < 12; i++) g.add(caixa(0.015, 1.45, 0.015, gr, -0.7 + i * 0.127, 0.03, 0.36));
  g.add(caixa(1.7, 0.05, 0.9, fosco('#8f9496'), 0, 1.5, 0));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const x = -0.52 + i * 0.35, y = j * 0.72;
    g.add(cilindro(0.15, 0.15, 0.42, brilho(j ? '#2b62b0' : '#e0762a', 40), 12, x, y + 0.05, 0));
    g.add(cilindro(0.05, 0.05, 0.1, fosco('#9ea2a5'), 8, x, y + 0.47, 0));
  }
  g.add(sombra(1.6, 0.8, 0, 0, 0, 0.45));
  return g;
}
/* a lixeira de plástico (verde, com a tampa) */
export function lixeira(cor = '#2f6f3a') {
  const g = new THREE.Group();
  g.add(caixa(0.55, 0.9, 0.6, brilho(cor, 30)));
  g.add(caixa(0.6, 0.06, 0.66, brilho(cor, 30), 0, 0.9, 0.02));
  for (const s of [-1, 1]) { const rd = malha(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 10), fosco('#1d1e20')); rd.rotation.x = PI / 2; rd.position.set(s * 0.2, 0.08, -0.32); g.add(rd); }
  g.add(sombra(0.55, 0.6, 0, 0, 0, 0.45));
  return g;
}
/* o calibrador de pneu (o pedestal com o visor e a mangueira) */
export function calibrador() {
  const g = new THREE.Group();
  g.add(caixa(0.4, 0.1, 0.4, fosco('#8f9092')));
  g.add(caixa(0.3, 1.3, 0.25, brilho('#e8b925', 50), 0, 0.1, 0));
  g.add(caixa(0.26, 0.2, 0.02, fosco('#1b1b1b'), 0, 1.05, 0.13));
  g.add(tubo([[0.12, 0.9, 0.1], [0.4, 0.5, 0.35], [0.2, 0.05, 0.55], [-0.2, 0.05, 0.5], [-0.1, 0.6, 0.15]], 0.015, fosco('#1a1a1a'), 16, 4));
  g.add(sombra(0.4, 0.4, 0, 0, 0, 0.4, true));
  return g;
}
/* a caixa d'água de fibra (azul, de mil litros) */
export function caixaDagua(r = 0.72) {
  const g = new THREE.Group(), az = brilho('#3f6fb0', 50);
  g.add(cilindro(r * 0.85, r, 0.85, az, 18));
  g.add(cilindro(r + 0.03, r * 0.9, 0.12, az, 18, 0, 0.85));
  g.add(cilindro(0.18, 0.18, 0.06, fosco('#2a4f86'), 10, 0, 0.97));
  return g;
}
/* o arbusto (bolas de folha de cor torta, achatadas) */
export function arbusto(r = 0.9, rnd = Math.random, cores = ['#5f7a37', '#6f8a3e', '#526b30', '#7d8f45']) {
  const g = new THREE.Group();
  const n = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const s = r * (0.45 + rnd() * 0.4), m = malha(new THREE.IcosahedronGeometry(s, 0), fosco(cores[Math.floor(rnd() * cores.length)]));
    m.position.set((rnd() - 0.5) * r, s * 0.6, (rnd() - 0.5) * r); m.scale.y = 0.7; m.rotation.set(rnd() * PI, rnd() * PI, 0); g.add(m);
  }
  g.add(sombra(r * 1.6, r * 1.6, 0, 0, 0, 0.35, true));
  return g;
}
/* a árvore de beira de estrada (o tronco torto e a copa de três bolas) */
export function arvore(alt = 6, rnd = Math.random) {
  const g = new THREE.Group(), tr = fosco('#6b5540');
  const topo = [(rnd() - 0.5) * 0.8, alt * 0.55, (rnd() - 0.5) * 0.8];
  g.add(tubo([[0, 0, 0], [topo[0] * 0.4, alt * 0.3, topo[2] * 0.4], topo], 0.14, tr, 4, 5));
  for (let i = 0; i < 4; i++) {
    const s = alt * (0.2 + rnd() * 0.12), m = malha(new THREE.IcosahedronGeometry(s, 0), fosco(['#5a7a34', '#6b8a3c', '#4f6b2e'][i % 3]));
    m.position.set(topo[0] + (rnd() - 0.5) * alt * 0.35, alt * (0.62 + rnd() * 0.2), topo[2] + (rnd() - 0.5) * alt * 0.35); m.scale.y = 0.75; m.rotation.set(rnd() * PI, rnd() * PI, 0); g.add(m);
  }
  g.add(sombra(alt * 0.7, alt * 0.7, topo[0], topo[2], 0, 0.35, true));
  return g;
}
/* o tufo de capim (duas folhas cruzadas) */
export function touceira(alt = 0.55, rnd = Math.random) {
  const g = new THREE.Group(), mat = pintado('capim', TEX.capim(), { lados: true, alphaTest: 0.45 });
  const a = rnd() * PI;
  for (const d of [0, PI / 2]) { const p = painel(alt * 1.3, alt, mat, 0, alt / 2, 0, a + d); g.add(p); }
  return g;
}

/* A LOJA DE CONVENIÊNCIA: o reboco claro com o barrado cinza, a vitrine
   de vidro com os caixilhos de alumínio e a porta dupla, a testeira na
   cor da marca com o letreiro, a platibanda, a laje com a manta, a caixa
   d'água e os condensadores do ar; dentro, as gôndolas cheias, a
   geladeira de vidro acesa, o balcão com o caixa, a máquina de café e o
   quartinho do fundo (o depósito, com a porta). Frente pro +z (w em x, d
   em z). `o.teto`: false tira a laje (vê-se tudo de cima) */
export function loja(w = 22, d = 12, h = 4.2, o = {}) {
  const g = new THREE.Group(), marca = o.marca || '#b3261e', e = 0.2;
  const reb = pintado('reboco', TEX.reboco(), { cor: '#efece6' });
  /* as paredes de fundo e dos lados (com o barrado) */
  g.add(caixaUV(w, h, e, reb, 2, 0, 0, -d / 2 + e / 2));
  for (const s of [-1, 1]) g.add(caixaUV(e, h, d, reb, 2, s * (w / 2 - e / 2), 0, 0));
  for (const s of [-1, 1]) g.add(caixa(e + 0.02, 0.6, d + 0.02, fosco('#8a8c8e'), s * (w / 2 - e / 2), 0, 0));
  g.add(caixa(w + 0.02, 0.6, e + 0.02, fosco('#8a8c8e'), 0, 0, -d / 2 + e / 2));
  /* a vitrine: o vidro e os montantes; a porta de vidro dupla com o puxador */
  const hv = h - 1.1, zf = d / 2 - 0.06;
  g.add(caixa(w - 2 * e, 0.3, 0.12, fosco('#9ea2a5'), 0, 0, zf));
  g.add(caixa(w - 2 * e, hv - 0.3, 0.02, vidro('#8fb4c4', 0.3), 0, 0.3, zf));
  const nm = Math.round(w / 1.8);
  for (let i = 0; i <= nm; i++) g.add(caixa(0.07, hv, 0.1, brilho('#c3c7ca', 60), -w / 2 + e + (w - 2 * e) * i / nm, 0, zf));
  g.add(caixa(w - 2 * e, 0.07, 0.1, brilho('#c3c7ca', 60), 0, hv - 0.07, zf));
  const px = o.portaX ?? -w * 0.24;
  g.add(caixa(2.0, 2.3, 0.12, brilho('#c3c7ca', 60), px, 0, zf + 0.02));
  g.add(caixa(0.9, 2.15, 0.03, vidro('#8fb4c4', 0.35), px - 0.48, 0.05, zf + 0.08));
  g.add(caixa(0.9, 2.15, 0.03, vidro('#8fb4c4', 0.35), px + 0.48, 0.05, zf + 0.08));
  for (const s of [-1, 1]) g.add(caixa(0.03, 0.5, 0.05, brilho('#d7dadc', 80), px + s * 0.1, 0.9, zf + 0.12));
  g.add(chao(2.2, 1.2, fosco('#5b5e60'), 1, px, 0.012, d / 2 + 0.7));
  /* a testeira com o letreiro, a marquise fina e a platibanda */
  g.add(caixa(w + 0.3, 1.1, 0.3, brilho(marca, 40), 0, h - 1.1, d / 2 - 0.1));
  g.add(caixa(w + 0.3, 0.12, 0.3, fosco('#f1efe9'), 0, h - 1.2, d / 2 - 0.1));
  g.add(em(painel(w * 0.55, 0.62, pintado('letLoja' + (o.nome || ''), TEX.letreiro(o.nome || 'CONVENIÊNCIA 24H', marca, '#ffffff', 1024, 96))), -w * 0.12, h - 0.55, d / 2 + 0.056));
  if (o.teto !== false) {
    const lj = h + 0.18, pl = 0.55;
    g.add(caixa(w, 0.18, d, fosco('#dcd9d2'), 0, h, 0));
    g.add(chao(w - 0.3, d - 0.3, pintado('laje', TEX.laje()), 4, 0, lj + 0.004, 0));
    for (const s of [-1, 1]) {
      g.add(caixaUV(w + 0.3, pl, 0.15, reb, 2, 0, lj, s * (d / 2 + 0.075)));
      g.add(caixaUV(0.15, pl, d, reb, 2, s * (w / 2 + 0.075), lj, 0));
    }
    for (const s of [-1, 1]) g.add(caixa(w + 0.34, 0.05, 0.19, fosco('#c9c6bf'), 0, lj + pl, s * (d / 2 + 0.075)));
    for (const s of [-1, 1]) g.add(caixa(0.19, 0.05, d, fosco('#c9c6bf'), s * (w / 2 + 0.075), lj + pl, 0));
    /* os condensadores do ar, a caixa d'água, os respiros */
    for (const [ax, az] of [[-w * 0.3, -d * 0.25], [w * 0.2, -d * 0.18], [w * 0.36, d * 0.12]]) {
      g.add(caixa(0.9, 0.7, 0.4, fosco('#e7e7e4'), ax, lj, az));
      const v = malha(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16), fosco('#3a3c3e')); v.rotation.x = PI / 2; v.position.set(ax, lj + 0.35, az + 0.21); g.add(v);
      g.add(sombra(0.9, 0.4, ax, az + 0.35, 0, 0.35).translateY(lj));
    }
    g.add(em(caixaDagua(0.72), w * 0.05, lj, -d * 0.2));
    g.add(sombra(1.5, 1.5, w * 0.05 + 0.4, -d * 0.2 + 0.4, 0, 0.35, true).translateY(lj));
    for (const [ax, az] of [[-w * 0.1, d * 0.2], [w * 0.4, -d * 0.35]]) g.add(cilindro(0.06, 0.06, 0.5, fosco('#8d9194'), 8, ax, lj, az));
    g.add(sombraDeParede(w, 0.6, 0.25).translateY(lj).translateZ(-d / 2 + 0.01));
  }
  /* dentro: o piso, as gôndolas, a geladeira de vidro, o balcão com o caixa */
  g.add(chao(w - 2 * e, d - 2 * e, pintado('ceramica', TEX.ceramica()), 1.6, 0, 0.02, 0));
  const prat = pintado('prateleiras', TEX.prateleiras()), topo = pintado('gondolaTopo', TEX.gondolaTopo());
  for (let i = 0; i < 3; i++) {
    const gx = -w * 0.16 + i * 2.6, gz = -d * 0.08;
    g.add(caixa(0.6, 1.6, 4.6, fosco('#d5d6d4'), gx, 0.02, gz));
    for (const s of [-1, 1]) g.add(em(painel(4.5, 1.5, prat), gx + s * 0.302, 0.82, gz, s * PI / 2));
    const t = folhaNoChao(0.58, 4.55, topo, gx, 1.625, gz); g.add(t);
  }
  const gel = pintado('geladeira', TEX.geladeira(), { brilho: 60 });
  for (let i = 0; i < 5; i++) g.add(em(painel(1.1, 2.1, gel), -w / 2 + 1.8 + i * 1.15, 1.15, -d / 2 + 0.76));
  g.add(caixa(5.8, 2.2, 0.55, fosco('#e2e4e4'), -w / 2 + 4.1, 0.02, -d / 2 + 0.47));
  g.add(caixa(5.8, 0.06, 0.55, fosco('#b8bcbf'), -w / 2 + 4.1, 2.22, -d / 2 + 0.47));
  const bx = o.balcaoX ?? -w / 2 + 3.0, bz = d / 2 - 3.0;
  g.add(caixa(3.2, 1.0, 0.8, fosco('#6b4a33'), bx, 0.02, bz));
  g.add(caixa(3.25, 0.05, 0.85, fosco('#2a2826'), bx, 1.0, bz));
  g.add(caixa(0.45, 0.3, 0.35, fosco('#1d1e20'), bx - 0.8, 1.05, bz));
  g.add(caixa(0.32, 0.26, 0.04, luz('#8fd4ff'), bx - 0.8, 1.3, bz + 0.08));
  g.add(caixa(0.4, 0.55, 0.4, fosco('#2b2d30'), bx + 0.9, 1.05, bz));
  g.add(caixa(2.5, 1.9, 0.4, fosco('#d8d4cc'), bx, 0.02, bz - 1.5));
  for (let k = 0; k < 4; k++) g.add(caixa(2.4, 0.03, 0.36, fosco('#9a9c9d'), bx, 0.5 + k * 0.4, bz - 1.5));
  g.add(sombra(3.2, 0.8, bx, bz, 0, 0.3));
  /* o quartinho do fundo (o depósito): as duas paredes e a porta */
  const q0 = w / 2 - e - 3.2, qz = -d / 2 + 3.6;
  g.add(caixaUV(0.12, h, 3.4, reb, 2, q0, 0, -d / 2 + e + 1.7));
  g.add(caixaUV(1.9, h, 0.12, reb, 2, q0 + 0.95, 0, qz));
  g.add(caixa(0.9, 2.1, 0.05, pintado('madeiraPorta', TEX.madeira(), { cor: '#b98a5e' }), q0 + 2.35, 0, qz));
  g.add(caixaUV(0.9, h - 2.1, 0.12, reb, 2, q0 + 2.35, 2.1, qz));
  g.add(caixaUV(0.4, h, 0.12, reb, 2, q0 + 3.0, 0, qz));
  g.add(em(estanteDeposito(2.4, sorteio(11)), q0 + 1.6, 0.02, -d / 2 + e + 0.3));
  g.add(sombraDeParede(w, 1.2, 0.3).translateZ(d / 2 + 0.02));
  for (const s of [-1, 1]) { const a = sombraDeParede(d, 1.0, 0.3); a.rotation.y = s * PI / 2; a.position.x = s * (w / 2 + 0.02); g.add(a); }
  return g;
}
/* O DEPÓSITO DESCOBERTO DO LADO DA LOJA (o muro de três lados, aberto
   pro pátio, com o telheiro de zinco no fundo): o compressor, a bancada
   com o esmeril, os pneus em pilha e encostados, os tambores, o botijão */
export function deposito(w = 11, d = 12, h = 2.8, rnd = Math.random) {
  const g = new THREE.Group(), e = 0.2, reb = pintado('reboco', TEX.reboco(), { cor: '#e4e1da' });
  g.add(caixaUV(w, h, e, reb, 2, 0, 0, -d / 2 + e / 2));
  for (const s of [-1, 1]) g.add(caixaUV(e, h, d, reb, 2, s * (w / 2 - e / 2), 0, 0));
  for (const s of [-1, 1]) g.add(caixa(e + 0.06, 0.06, d + 0.06, fosco('#c9c6bf'), s * (w / 2 - e / 2), h, 0));
  g.add(caixa(w + 0.06, 0.06, e + 0.06, fosco('#c9c6bf'), 0, h, -d / 2 + e / 2));
  g.add(chao(w - 0.4, d - 0.4, pintado('concretoDep', TEX.concreto(), { cor: '#cfcac1' }), 5, 0, 0.012, 0));
  /* o telheiro de zinco no fundo (meia-água, nas mãos-francesas) */
  const tz = 3.2, zin = pintado('zincoTelheiro', TEX.zinco(0.5), { cor: '#c9cdd0', lados: true });
  const t = chao(w - 0.3, tz, zin, 1.05, 0, h - 0.2, -d / 2 + tz / 2 + 0.1, 0, 3); t.rotation.x = 0.12; g.add(t);
  for (const x of [-w / 2 + 0.6, 0, w / 2 - 0.6]) g.add(caixa(0.08, 0.08, tz, fosco('#6b6f72'), x, h - 0.32, -d / 2 + tz / 2 + 0.1));
  /* o compressor: o tanque deitado, o motor, o pé */
  const cx = -w / 2 + 1.7, cz = -d / 2 + 1.1;
  const tq = malha(new THREE.CylinderGeometry(0.32, 0.32, 1.5, 16), brilho('#c8342b', 40)); tq.rotation.z = PI / 2; tq.position.set(cx, 0.45, cz); g.add(tq);
  g.add(caixa(0.5, 0.4, 0.4, fosco('#2b2d30'), cx - 0.3, 0.77, cz));
  for (const s of [-1, 1]) g.add(caixa(0.06, 0.2, 0.3, fosco('#4a4d50'), cx + s * 0.55, 0, cz));
  g.add(tubo([[cx + 0.6, 0.6, cz + 0.2], [cx + 1.2, 0.2, cz + 0.8], [cx + 0.4, 0.03, cz + 1.4], [cx - 0.2, 0.03, cz + 1.0]], 0.02, fosco('#1a1a1a'), 12, 4));
  g.add(sombra(1.6, 0.8, cx, cz, 0, 0.45));
  /* a bancada com as ferramentas e o esmeril */
  const bx = 0.6, bz = -d / 2 + 0.65;
  g.add(caixa(2.2, 0.08, 0.8, pintado('madeiraBancada', TEX.madeira(), { cor: '#a07a55' }), bx, 0.9, bz));
  for (const [ax, az] of [[-1, -0.3], [1, -0.3], [-1, 0.3], [1, 0.3]]) g.add(caixa(0.06, 0.9, 0.06, fosco('#3a3c3e'), bx + ax, 0, bz + az));
  g.add(caixa(0.3, 0.25, 0.2, fosco('#2f6f3a'), bx + 0.7, 0.98, bz - 0.1));
  for (let i = 0; i < 6; i++) g.add(caixa(0.3, 0.04, 0.05, fosco(['#c8342b', '#1f5aa8', '#e0a52a'][i % 3]), bx - 0.8 + i * 0.25, 0.98, bz + 0.15));
  g.add(caixa(1.6, 1.0, 0.03, fosco('#5f6a6f'), bx, 1.3, -d / 2 + e + 0.02));
  g.add(sombra(2.2, 0.8, bx, bz, 0, 0.4));
  /* os pneus em pilha e encostados, os tambores, o botijão */
  for (const [ppx, ppz, n] of [[w / 2 - 1.0, -d / 2 + 1.0, 4], [w / 2 - 1.0, -d / 2 + 1.8, 3], [w / 2 - 1.0, -d / 2 + 2.6, 4], [w / 2 - 1.9, -d / 2 + 1.0, 2], [w / 2 - 1.0, -d / 2 + 3.4, 2]]) g.add(em(pilhaDePneus(n, 0.33, rnd), ppx, 0.012, ppz));
  for (let i = 0; i < 4; i++) g.add(em(pneuEmPe(0.3), -w / 2 + 0.45, 0.012, -d / 2 + 2.6 + i * 0.28, PI / 2));
  g.add(em(tambor('#3a4a5c'), -w / 2 + 0.6, 0.012, d / 2 - 2.0));
  g.add(em(tambor('#6b3a1d'), -w / 2 + 1.25, 0.012, d / 2 - 1.9));
  g.add(cilindro(0.16, 0.16, 0.7, brilho('#c8342b', 40), 12, w / 2 - 2.6, 0.012, -d / 2 + 0.5));
  for (const s of [-1, 1]) { const a = sombraDeParede(d - 0.3, 0.8, 0.3); a.rotation.y = -s * PI / 2; a.position.x = s * (w / 2 - e); g.add(a); }
  g.add(sombraDeParede(w - 0.3, 0.8, 0.3).translateZ(-d / 2 + e));
  return g;
}
/* O MURO DE BLOCO: o pano de bloco aparente, os pilares a cada 3 m e a
   capa de concreto em cima (o comprimento em x) */
export function muroDeBloco(L, h = 2.6, esp = 0.2) {
  const g = new THREE.Group(), bl = pintado('bloco', TEX.bloco());
  g.add(caixaUV(L, h, esp, bl, 2));
  const n = Math.max(1, Math.round(L / 3));
  for (let i = 0; i <= n; i++) g.add(caixaUV(0.34, h + 0.05, esp + 0.14, bl, 2, -L / 2 + L * i / n, 0, 0));
  g.add(caixa(L + 0.2, 0.08, esp + 0.12, fosco('#cfcac0'), 0, h, 0));
  g.add(sombraDeMuro(L, esp + 0.14, 0.9, 0.32));
  return g;
}
/* O MURO PRÉ-MOLDADO (as placas de concreto entre os pilares, o
   comprimento em x) */
export function muroPremoldado(L, h = 2.5, esp = 0.1) {
  const g = new THREE.Group(), pm = pintado('premoldado', TEX.premoldado());
  g.add(caixaUV(L, h, esp, pm, 2.5, 0, 0, 0, 0, h));
  const n = Math.max(1, Math.round(L / 2.5));
  for (let i = 0; i <= n; i++) g.add(caixaUV(0.22, h + 0.12, 0.22, pintado('premoldadoPilar', TEX.premoldado(), { cor: '#e2ded6' }), 1, -L / 2 + L * i / n, 0, 0, 0, h));
  g.add(sombraDeMuro(L, 0.22, 0.9, 0.3));
  return g;
}
/* O PORTÃO DE GRADE (duas folhas de barra, o quadro e o cadeado) */
export function portaoDeGrade(L = 4, h = 2.3, cor = '#3d4a45') {
  const g = new THREE.Group(), m = brilho(cor, 30);
  for (const s of [-1, 1]) {
    const cx = s * L / 4;
    g.add(caixa(L / 2 - 0.04, 0.06, 0.06, m, cx, 0.1, 0)); g.add(caixa(L / 2 - 0.04, 0.06, 0.06, m, cx, h - 0.06, 0)); g.add(caixa(L / 2 - 0.04, 0.05, 0.05, m, cx, h * 0.5, 0));
    for (const bx of [cx - L / 4 + 0.03, cx + L / 4 - 0.03]) g.add(caixa(0.07, h, 0.07, m, bx, 0, 0));
    const nb = Math.round(L / 2 / 0.12);
    for (let i = 1; i < nb; i++) g.add(caixa(0.02, h - 0.16, 0.02, m, cx - L / 4 + (L / 2) * i / nb, 0.1, 0));
  }
  g.add(caixa(0.08, 0.12, 0.05, fosco('#b9a13a'), 0.06, h * 0.5 - 0.1, 0.05));
  return g;
}
/* O PORTÃO DE CHAPA (duas folhas de chapa ondulada no quadro de ferro) */
export function portaoDeChapa(L = 4, h = 2.3, cor = '#9aa0a3') {
  const g = new THREE.Group(), q = brilho('#4a4f52', 30), ch = pintado('chapa' + cor, TEX.zinco(0.25), { cor });
  for (const s of [-1, 1]) {
    const cx = s * L / 4;
    g.add(caixaUV(L / 2 - 0.1, h - 0.15, 0.04, ch, 1, cx, 0.08, 0));
    for (const y of [0.05, h - 0.08]) g.add(caixa(L / 2 - 0.04, 0.07, 0.07, q, cx, y, 0));
    for (const bx of [cx - L / 4 + 0.03, cx + L / 4 - 0.03]) g.add(caixa(0.07, h, 0.07, q, bx, 0, 0));
  }
  g.add(caixa(0.08, 0.12, 0.08, fosco('#b9a13a'), 0.06, h * 0.5 - 0.1, 0.05));
  return g;
}
/* A CONCERTINA (a espiral de arame em cima do muro, o comprimento em x):
   linhas finas (o arame é fino, e linha não custa triângulo) */
export function concertina(L, r = 0.3, passo = 0.42) {
  const n = Math.max(2, Math.round(L / passo)), seg = 8, pts = [];
  let ant = null;
  for (let i = 0; i <= n * seg; i++) {
    const t = i / seg, a = t * 2 * PI, p = [-L / 2 + t * passo + Math.sin(a * 0.5) * 0.02, r + Math.sin(a) * r, Math.cos(a) * r];
    if (ant) pts.push(...ant, ...p);
    ant = p;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(geo, guardado('arame', () => new THREE.LineBasicMaterial({ color: '#c3c7ca' })));
}
/* O GALPÃO DE ZINCO: as paredes de chapa ondulada, o telhado de duas
   águas de zinco (o beiral, a cumeeira, a calha), a porta de enrolar e as
   janelinhas altas (w em x, d em z, a frente pro +z) */
export function galpaoZinco(w, d, h, o = {}) {
  const g = new THREE.Group(), cor = o.cor || '#c5c6c3', fe = o.ferrugem ?? 0.35;
  const zin = pintado('zinco' + cor + fe, TEX.zinco(fe), { cor });
  for (const s of [-1, 1]) g.add(caixaUV(w, h, 0.12, zin, 1, 0, 0, s * (d / 2 - 0.06), 0, 3));
  for (const s of [-1, 1]) g.add(caixaUV(0.12, h, d, zin, 1, s * (w / 2 - 0.06), 0, 0, 0, 3));
  /* as empenas (o triângulo do oitão) e o telhado de duas águas */
  const hc = Math.min(2.4, d * 0.12), beiral = 0.5;
  for (const s of [-1, 1]) { const oi = perfil([[-d / 2, 0], [d / 2, 0], [0, hc]], 0.12, zin); oi.rotation.y = PI / 2; oi.position.set(s * (w / 2 - 0.06), h, 0); g.add(oi); }
  const tel = pintado('zincoTelhado' + (o.corTelhado || '') + fe, TEX.zinco(Math.min(1, fe + 0.25)), { cor: o.corTelhado || '#cdd0d1', lados: true });
  const aba = Math.hypot(d / 2 + beiral, hc * (1 + beiral / (d / 2)));
  for (const s of [-1, 1]) {
    const ang = Math.atan2(hc, d / 2), p = chao(w + 2 * beiral, aba, tel, 1.05, 0, 0, 0, 0, 3);
    p.rotation.set(s * ang, 0, 0);
    p.position.set(0, h + hc / 2 - (beiral * Math.tan(ang)) / 2 + 0.02, s * (d / 2 + beiral) / 2);
    g.add(p);
    g.add(caixa(w + 2 * beiral, 0.12, 0.16, fosco('#8d9194'), 0, h - beiral * Math.tan(ang) - 0.1, s * (d / 2 + beiral - 0.05)));
  }
  g.add(caixa(w + 2 * beiral, 0.12, 0.34, fosco('#9ea2a5'), 0, h + hc - 0.04, 0));
  /* a porta de enrolar e as janelas altas (na frente) */
  const pd = o.porta || Math.min(5, w * 0.35), pX = o.portaX || 0;
  g.add(caixaUV(pd, 4, 0.05, pintado('enrolar', TEX.enrolar()), 1, pX, 0, d / 2 + 0.02));
  g.add(caixa(pd + 0.3, 0.25, 0.3, fosco('#7b7f82'), pX, 4, d / 2 + 0.1));
  for (let i = 0; i < Math.floor(w / 5); i++) {
    const jx = -w / 2 + 2.5 + i * 5; if (Math.abs(jx - pX) < pd / 2 + 1) continue;
    g.add(caixa(1.6, 0.8, 0.04, vidro('#394a52', 0.85), jx, h - 1.5, d / 2 + 0.03));
  }
  const sp = new THREE.Group();
  for (const s of [-1, 1]) { const a = sombraDeParede(w, 1.2, 0.3); a.position.z = s * d / 2; if (s < 0) a.rotation.y = PI; sp.add(a); }
  for (const s of [-1, 1]) { const a = sombraDeParede(d, 1.2, 0.3); a.rotation.y = s * PI / 2; a.position.x = s * w / 2; sp.add(a); }
  g.add(sp);
  return g;
}
/* O TELHEIRO DE MEIA-ÁGUA (os pilares de ferro e a chapa, sem parede) */
export function telheiro(w, d, h = 3, o = {}) {
  const g = new THREE.Group(), fe = o.ferrugem ?? 0.6;
  const tel = pintado('zincoMeia' + fe, TEX.zinco(fe), { cor: o.cor || '#c7cacb', lados: true });
  const cai = 0.5, t = chao(w + 0.4, Math.hypot(d, cai), tel, 1.05, 0, h - cai / 2, 0, 0, 3); t.rotation.x = Math.atan2(cai, d); g.add(t);
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2 + 0.1, d / 2 - 0.1]) g.add(caixa(0.1, h - (z > 0 ? cai : 0), 0.1, fosco('#5b5f62'), x, 0, z));
  g.add(sombra(w, d, 0.4, 0.4, 0, 0.3));
  return g;
}

/* =======================================================
   A CASA DE PRAIA E A FESTA
   ======================================================= */
/* A ESPREGUIÇADEIRA: a armação de plástico branco com as ripas, o encosto
   levantado, os pés, as rodinhas e a almofada (a cor, ou nenhuma) — o
   comprimento em x, a cabeceira no +x */
export function espreguicadeira(corAlm = null) {
  const g = new THREE.Group(), pl = brilho('#f4f4f0', 30), W = 0.66;
  for (const s of [-1, 1]) g.add(caixa(1.26, 0.05, 0.045, pl, -0.33, 0.28, s * (W / 2 - 0.025)));
  for (let i = 0; i < 9; i++) g.add(caixa(0.1, 0.025, W - 0.06, pl, -0.88 + i * 0.135, 0.33, 0));
  const enc = new THREE.Group(); enc.position.set(0.3, 0.33, 0); enc.rotation.z = 0.75;
  for (const s of [-1, 1]) enc.add(caixa(0.66, 0.045, 0.045, pl, 0.33, -0.04, s * (W / 2 - 0.025)));
  for (let i = 0; i < 5; i++) enc.add(caixa(0.1, 0.025, W - 0.06, pl, 0.06 + i * 0.13, 0, 0));
  g.add(enc);
  for (const s of [-1, 1]) g.add(caixa(0.05, 0.28, 0.05, pl, -0.9, 0, s * (W / 2 - 0.03)));
  for (const s of [-1, 1]) g.add(caixa(0.05, 0.2, 0.05, pl, 0.22, 0.08, s * (W / 2 - 0.03)));
  for (const s of [-1, 1]) { const rd = malha(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12), fosco('#6c7074')); rd.rotation.x = PI / 2; rd.position.set(0.22, 0.09, s * (W / 2 + 0.01)); g.add(rd); }
  if (corAlm) {
    const m = fosco(corAlm);
    g.add(caixa(1.18, 0.06, W - 0.1, m, -0.33, 0.345, 0));
    enc.add(caixa(0.62, 0.06, W - 0.1, m, 0.33, 0.012, 0));
  }
  g.add(sombra(1.9, W, 0, 0, 0, 0.45));
  return g;
}
/* O GUARDA-SOL: o mastro, a copa de oito gomos listrada e o pé de concreto */
export function guardaSol(a = '#e2574c', b = '#f4efe2', r = 1.4) {
  const g = new THREE.Group();
  g.add(cilindro(0.025, 0.025, 2.35, fosco('#d9d6cf'), 8));
  const copa = malha(new THREE.ConeGeometry(r, 0.5, 8, 1, true), pintado('gs' + a + b, TEX.listras(a, b, 8), { lados: true }));
  copa.position.y = 2.18; g.add(copa);
  for (let k = 0; k < 8; k++) { const ang = k * PI / 4; g.add(tubo([[0, 2.0, 0], [Math.cos(ang) * r * 0.5, 2.1, Math.sin(ang) * r * 0.5]], 0.008, fosco('#d9d6cf'), 1, 3)); }
  g.add(cilindro(0.05, 0.05, 0.12, fosco(a), 8, 0, 2.4));
  g.add(cilindro(0.22, 0.25, 0.12, fosco('#bdb8ad'), 12));
  g.add(sombra(r * 1.6, r * 1.6, 0.4, 0.3, 0, 0.3, true));
  return g;
}
/* A MESA DE PLÁSTICO com as quatro cadeiras (a branca de bar), os copos
   vermelhos, as latas e as garrafas */
export function mesaComCadeiras(rnd = Math.random, cadeiras = 4) {
  const g = new THREE.Group(), pl = brilho('#f3f3ef', 25);
  g.add(caixa(0.78, 0.04, 0.78, pl, 0, 0.7, 0));
  for (const [x, z] of [[-0.33, -0.33], [0.33, -0.33], [0.33, 0.33], [-0.33, 0.33]]) g.add(caixa(0.05, 0.7, 0.05, pl, x, 0, z));
  const cad = (ang) => {
    const c = new THREE.Group();
    c.add(caixa(0.44, 0.04, 0.42, pl, 0, 0.42, 0));
    for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [0.19, 0.18], [-0.19, 0.18]]) c.add(caixa(0.04, 0.42, 0.04, pl, x, 0, z));
    const e = caixa(0.44, 0.42, 0.04, pl, 0, 0.46, -0.2); e.rotation.x = -0.12; c.add(e);
    for (const s of [-1, 1]) c.add(caixa(0.04, 0.2, 0.3, pl, s * 0.22, 0.5, -0.02));
    c.rotation.y = ang; return c;
  };
  for (let k = 0; k < cadeiras; k++) { const a = k * 2 * PI / Math.max(4, cadeiras) + (rnd() - 0.5) * 0.4, c = cad(a + PI); c.position.set(Math.sin(a) * 0.72, 0, Math.cos(a) * 0.72); g.add(c); }
  for (let k = 0; k < 5; k++) g.add(cilindro(0.035, 0.045, 0.11, fosco('#c8342b'), 8, (rnd() - 0.5) * 0.55, 0.74, (rnd() - 0.5) * 0.55));
  for (let k = 0; k < 3; k++) {
    const x = (rnd() - 0.5) * 0.5, z = (rnd() - 0.5) * 0.5, cor = rnd() < 0.5 ? '#2c6b2f' : '#7a4a14';
    g.add(cilindro(0.035, 0.035, 0.2, vidro(cor, 0.85), 8, x, 0.74, z)); g.add(cilindro(0.012, 0.02, 0.08, vidro(cor, 0.85), 6, x, 0.94, z));
  }
  for (let k = 0; k < 4; k++) g.add(cilindro(0.033, 0.033, 0.12, brilho(['#d8d8d4', '#c8342b', '#1f5aa8'][k % 3], 80), 8, (rnd() - 0.5) * 0.6, 0.74, (rnd() - 0.5) * 0.6));
  g.add(sombra(1.3, 1.3, 0, 0, 0, 0.35, true));
  return g;
}
/* O ISOPOR (a caixa branca com a tampa e o gelo à mostra) */
export function isopor(aberto = false) {
  const g = new THREE.Group(), is = fosco('#f6f6f4');
  g.add(caixa(0.62, 0.4, 0.44, is));
  if (aberto) {
    g.add(chao(0.54, 0.36, fosco('#dfe9ee'), 1, 0, 0.395, 0));
    for (let k = 0; k < 6; k++) g.add(cilindro(0.033, 0.033, 0.12, brilho(['#c8342b', '#e0a52a', '#d8d8d4'][k % 3], 80), 8, -0.2 + (k % 3) * 0.2, 0.3, -0.08 + Math.floor(k / 3) * 0.16));
    const t = caixa(0.64, 0.06, 0.46, is, 0, 0.4, -0.25); t.rotation.x = -1.2; g.add(t);
  } else g.add(caixa(0.64, 0.06, 0.46, is, 0, 0.4, 0));
  g.add(sombra(0.62, 0.44, 0, 0, 0, 0.4));
  return g;
}
/* A CAIXA DE SOM (a de festa, num tripé) */
export function caixaDeSom() {
  const g = new THREE.Group();
  for (const [a, b] of [[-0.35, -0.35], [0.35, -0.35], [0, 0.4]]) g.add(tubo([[0, 1.0, 0], [a, 0, b]], 0.018, fosco('#1a1a1a'), 2, 4));
  g.add(cilindro(0.025, 0.025, 0.5, fosco('#1a1a1a'), 6, 0, 0.95));
  g.add(caixa(0.42, 0.7, 0.36, fosco('#1d1e20'), 0, 1.4, 0));
  g.add(em(painel(0.38, 0.66, pintado('falante', TEX.falante())), 0, 1.75, 0.181));
  g.add(sombra(0.8, 0.8, 0, 0, 0, 0.3, true));
  return g;
}
/* O VARAL DE LUZ: o fio em curva entre os pontos, com a lâmpada a cada 60 cm */
export function varalDeLuz(pontos, cores = ['#ffe6a1', '#ffd36b', '#ffb85c', '#fff3c9']) {
  const g = new THREE.Group(), fio = fosco('#222222');
  for (let i = 0; i + 1 < pontos.length; i++) {
    const [a, b] = [pontos[i], pontos[i + 1]], L = Math.hypot(b[0] - a[0], b[2] - a[2]), cai = Math.min(0.6, L * 0.07);
    const meio = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - cai, (a[2] + b[2]) / 2];
    const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3(...meio), new THREE.Vector3(...b));
    g.add(malha(new THREE.TubeGeometry(curva, 16, 0.008, 3, false), fio));
    const n = Math.max(2, Math.round(L / 0.6));
    for (let k = 1; k < n; k++) {
      const p = curva.getPoint(k / n), l = malha(new THREE.SphereGeometry(0.045, 6, 5), luz(cores[k % cores.length]));
      l.position.set(p.x, p.y - 0.07, p.z); g.add(l);
    }
  }
  return g;
}
/* a boia (o toro inflável listrado) */
export function boia(cor = '#ff6a3d') {
  const m = malha(new THREE.TorusGeometry(0.42, 0.15, 10, 20), pintado('boia' + cor, TEX.listras(cor, '#ffffff', 8), { brilho: 40 }));
  m.rotation.x = PI / 2; m.position.y = 0.04;
  return m;
}
/* o colchão inflável (o retângulo de gomos) */
export function colchaoInflavel(cor = '#f2c230') {
  const g = new THREE.Group(), m = brilho(cor, 60);
  for (let k = 0; k < 6; k++) { const c = malha(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 10), m); c.rotation.x = PI / 2; c.position.set(-0.75 + k * 0.3, 0.07, 0); g.add(c); }
  g.add(caixa(0.3, 0.1, 0.72, m, 0.95, 0.02, 0));
  return g;
}
/* a escada de inox da piscina (os dois corrimãos em curva e os degraus) */
export function escadaDePiscina() {
  const g = new THREE.Group(), inox = brilho('#dfe3e6', 120, '#ffffff');
  for (const s of [-1, 1]) g.add(tubo([[s * 0.25, 0.05, -0.55], [s * 0.25, 0.85, -0.2], [s * 0.25, 0.95, 0.05], [s * 0.25, 0.6, 0.25], [s * 0.25, -0.1, 0.25]], 0.022, inox, 20, 6));
  for (let k = 0; k < 3; k++) g.add(caixa(0.46, 0.03, 0.1, inox, 0, -0.05 - k * 0.3 + 0.35, 0.25));
  return g;
}
/* A PISCINA: o azulejo que escurece no meio (com a parede de dentro
   pintada), a borda de pedra larga e a água por cima (brilhante e meio
   transparente). `borda`: a largura da pedra (0 tira) */
export function piscina(w, d, borda = 0.4) {
  const g = new THREE.Group();
  const fundo = chao(w, d, pintado('fundo' + w + 'x' + d, TEX.piscina(w, d)), 1, 0, 0.0, 0);
  const uv = fundo.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w, uv.getY(i) / d);
  g.add(fundo);
  g.add(chao(w, d, guardado('agua', () => new THREE.MeshPhongMaterial({ color: '#8fdcf0', shininess: 140, specular: '#ffffff', transparent: true, opacity: 0.32, depthWrite: false })), 1, 0, 0.03, 0));
  if (borda > 0) {
    const bd = pintado('deckBorda', TEX.deck(), { cor: '#fbf7ee' }), e = borda;
    g.add(caixaUV(w + 2 * e, 0.08, e, bd, 2, 0, 0.0, -d / 2 - e / 2));
    g.add(caixaUV(w + 2 * e, 0.08, e, bd, 2, 0, 0.0, d / 2 + e / 2));
    for (const s of [-1, 1]) g.add(caixaUV(e, 0.08, d, bd, 2, s * (w / 2 + e / 2), 0.0, 0));
  }
  return g;
}
/* A CHURRASQUEIRA: o tijolo aparente, a bancada de granito, a grelha com
   a brasa e a carne, a coifa e a chaminé */
export function churrasqueira(w = 1.85, d = 1.1) {
  const g = new THREE.Group(), tj = pintado('tijolo', TEX.tijolo());
  g.add(caixaUV(w, 0.9, d, tj, 1, 0, 0, 0));
  g.add(caixa(w + 0.08, 0.05, d + 0.08, brilho('#2a2826', 60), 0, 0.9, 0));
  const br = chao(w - 0.3, d - 0.4, pintado('brasa', TEX.brasa()), 1, 0, 0.955, 0.05);
  const uv = br.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / (w - 0.3), uv.getY(i) / (d - 0.4));
  g.add(br);
  for (let k = 0; k < 5; k++) g.add(caixa(0.14, 0.04, 0.08, fosco(k % 2 ? '#7a3a22' : '#a0522d'), -0.4 + k * 0.2, 0.98, 0.05));
  g.add(caixaUV(w, 1.0, 0.25, tj, 1, 0, 0.95, -d / 2 + 0.12));
  for (const s of [-1, 1]) g.add(caixaUV(0.25, 1.0, d, tj, 1, s * (w / 2 - 0.12), 0.95, 0));
  g.add(em(perfil([[-w / 2, 0], [w / 2, 0], [w / 2 - 0.35, 0.55], [-w / 2 + 0.35, 0.55]], d, fosco('#c9c4ba')), 0, 1.95, 0));
  g.add(caixaUV(0.45, 1.3, 0.45, tj, 1, 0, 2.5, 0));
  g.add(sombra(w, d, 0, 0, 0, 0.45));
  return g;
}
/* O SOFÁ (a base, o encosto, os braços e as almofadas) */
export function sofa(L = 2.1, cor = '#4b5d7a') {
  const g = new THREE.Group(), m = fosco(cor);
  g.add(caixa(L, 0.42, 0.9, m));
  g.add(caixa(L, 0.45, 0.22, m, 0, 0.42, -0.34));
  for (const s of [-1, 1]) g.add(caixa(0.2, 0.25, 0.9, m, s * (L / 2 - 0.1), 0.42, 0));
  for (let k = 0; k < 3; k++) g.add(caixa((L - 0.4) / 3 - 0.03, 0.12, 0.62, fosco('#5a6d8c'), -L / 2 + 0.2 + (L - 0.4) * (k + 0.5) / 3, 0.42, 0.08));
  for (let k = 0; k < 2; k++) { const a = caixa(0.4, 0.38, 0.12, fosco(k ? '#e0a52a' : '#c8342b'), -0.45 + k * 0.9, 0.52, -0.18); a.rotation.x = -0.25; g.add(a); }
  g.add(sombra(L, 0.9, 0, 0, 0, 0.35));
  return g;
}
/* o rack com a TV, o tapete e a mesa de centro */
export function salaDeTV() {
  const g = new THREE.Group();
  g.add(caixa(1.8, 0.5, 0.42, fosco('#5a3b27')));
  g.add(caixa(1.3, 0.78, 0.06, brilho('#111214', 90), 0, 0.55, 0));
  g.add(caixa(1.24, 0.72, 0.01, fosco('#1e2a3a'), 0, 0.58, 0.035));
  g.add(chao(2.2, 1.5, fosco('#b7a78c'), 1, 0, 0.01, 1.4));
  g.add(caixa(0.9, 0.38, 0.55, fosco('#6b4a33'), 0, 0, 1.4));
  return g;
}
/* A CAMA (o estrado, o colchão, o lençol, os travesseiros, a manta, a
   cabeceira e o criado-mudo com o abajur) */
export function cama(L = 2.0, W = 1.4, cor = '#b85a4a', lado = 1) {
  const g = new THREE.Group();
  g.add(caixa(L, 0.3, W, fosco('#6b4a33')));
  g.add(caixa(L - 0.06, 0.22, W - 0.06, fosco('#f3f0e8'), 0, 0.3, 0));
  g.add(caixa(L * 0.62, 0.05, W, fosco(cor), -L * 0.18, 0.5, 0));
  for (const s of [-1, 1]) g.add(caixa(0.36, 0.12, W / 2 - 0.12, fosco('#ffffff'), L / 2 - 0.3, 0.52, s * W / 4));
  g.add(caixa(0.08, 0.9, W + 0.1, fosco('#5a3b27'), L / 2 + 0.04, 0, 0));
  g.add(caixa(0.4, 0.5, 0.4, fosco('#6b4a33'), L / 2 - 0.2, 0, lado * (W / 2 + 0.3)));
  g.add(cilindro(0.1, 0.06, 0.3, fosco('#f1e2b8'), 8, L / 2 - 0.2, 0.5, lado * (W / 2 + 0.3)));
  g.add(sombra(L, W, 0, 0, 0, 0.3));
  return g;
}
/* A COZINHA (a bancada com a pia e o fogão, a geladeira) */
export function cozinha(L = 2.4) {
  const g = new THREE.Group();
  g.add(caixa(L, 0.88, 0.58, fosco('#e8e6df')));
  g.add(caixa(L + 0.02, 0.04, 0.6, brilho('#2c2a28', 70), 0, 0.88, 0));
  g.add(caixa(0.6, 0.02, 0.4, brilho('#d9dcde', 110), -L / 2 + 0.6, 0.905, 0));
  g.add(caixa(0.6, 0.9, 0.58, brilho('#dcdcd8', 50), L / 2 - 0.3, 0, 0));
  for (const [a, b] of [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]]) g.add(cilindro(0.08, 0.08, 0.02, fosco('#1d1e20'), 10, L / 2 - 0.3 + a, 0.9, b));
  g.add(caixa(0.72, 1.8, 0.68, brilho('#f1f1ee', 60), -L / 2 - 0.45, 0, 0));
  g.add(sombra(L + 0.9, 0.7, -0.4, 0, 0, 0.3));
  return g;
}
/* a mesa de jantar com as seis cadeiras de madeira */
export function mesaDeJantar(L = 1.8, W = 0.9) {
  const g = new THREE.Group(), md = pintado('madeiraMesa', TEX.madeira(), { cor: '#c99b6d' });
  g.add(caixa(L, 0.05, W, md, 0, 0.74, 0));
  for (const [x, z] of [[-L / 2 + 0.08, -W / 2 + 0.08], [L / 2 - 0.08, -W / 2 + 0.08], [L / 2 - 0.08, W / 2 - 0.08], [-L / 2 + 0.08, W / 2 - 0.08]]) g.add(caixa(0.06, 0.74, 0.06, fosco('#5a3b27'), x, 0, z));
  for (const s of [-1, 1]) for (const dx of [-0.55, 0, 0.55]) {
    g.add(caixa(0.42, 0.04, 0.42, fosco('#6b4a33'), dx, 0.45, s * (W / 2 + 0.2)));
    g.add(caixa(0.42, 0.5, 0.04, fosco('#6b4a33'), dx, 0.47, s * (W / 2 + 0.4)));
    for (const [a, b] of [[-0.18, -0.18], [0.18, -0.18], [0.18, 0.18], [-0.18, 0.18]]) g.add(caixa(0.035, 0.45, 0.035, fosco('#5a3b27'), dx + a, 0, s * (W / 2 + 0.2) + b));
  }
  g.add(sombra(L + 0.3, W + 0.8, 0, 0, 0, 0.3));
  return g;
}
/* O BANHEIRO (o vaso com a caixa, a pia no gabinete e o box de vidro) */
export function banheiro() {
  const g = new THREE.Group(), lo = brilho('#f7f7f5', 80);
  g.add(cilindro(0.18, 0.2, 0.4, lo, 12, 0, 0, 0.05)); g.add(caixa(0.4, 0.35, 0.18, lo, 0, 0.4, -0.2));
  g.add(caixa(0.6, 0.8, 0.45, fosco('#d8d2c6'), 0.95, 0, -0.1)); g.add(caixa(0.5, 0.06, 0.38, lo, 0.95, 0.8, -0.08));
  g.add(caixa(0.02, 1.9, 0.9, vidro('#b8d4dc', 0.35), -0.55, 0, 0.3));
  g.add(chao(0.9, 0.9, fosco('#c9d1d3'), 1, -1.05, 0.015, 0.3));
  return g;
}
/* A ESTANTE DE AÇO DO DEPÓSITO (as caixas, a bandeira enrolada) */
export function estanteDeposito(L = 1.6, rnd = Math.random) {
  const g = new THREE.Group(), ac = fosco('#8d9296');
  for (const [a, b] of [[-L / 2, -0.2], [L / 2, -0.2], [-L / 2, 0.2], [L / 2, 0.2]]) g.add(caixa(0.04, 1.9, 0.04, ac, a, 0, b));
  for (let k = 0; k < 4; k++) {
    g.add(caixa(L, 0.02, 0.42, ac, 0, 0.1 + k * 0.55, 0));
    let x = -L / 2 + 0.1;
    while (x < L / 2 - 0.3) { const w = 0.25 + rnd() * 0.3, h = 0.2 + rnd() * 0.25; g.add(caixa(w, h, 0.34, fosco(['#b88a50', '#a57a45', '#c9a066'][Math.floor(rnd() * 3)]), x + w / 2, 0.12 + k * 0.55, 0)); x += w + 0.04; }
  }
  const b = malha(new THREE.CylinderGeometry(0.1, 0.1, 1.3, 10), fosco('#1d1d1d')); b.rotation.z = PI / 2; b.position.set(0, 2.05, 0); g.add(b);
  return g;
}
/* a toalha estendida (na espreguiçadeira, no chão) */
export function toalha(cor = '#e0a52a', L = 1.5, W = 0.7) {
  return chao(L, W, pintado('toalha' + cor, TEX.listras(cor, '#ffffff', 6)), L, 0, 0, 0, 0, W);
}
/* a bola de futebol */
export function bola() { const m = malha(new THREE.IcosahedronGeometry(0.11, 1), fosco('#f2f2ee')); m.position.y = 0.11; return m; }
/* o chinelo, o copo, a lata largada no chão (o que sobra de uma festa) */
export function largados(n = 8, raio = 1.5, rnd = Math.random) {
  const g = new THREE.Group();
  for (let k = 0; k < n; k++) {
    const x = (rnd() - 0.5) * 2 * raio, z = (rnd() - 0.5) * 2 * raio, t = rnd();
    if (t < 0.4) { const c = cilindro(0.035, 0.045, 0.11, fosco('#c8342b'), 8, x, 0, z); if (rnd() < 0.5) { c.rotation.z = PI / 2; c.position.y = 0.04; } g.add(c); }
    else if (t < 0.7) { const l = cilindro(0.033, 0.033, 0.12, brilho(['#d8d8d4', '#c8342b', '#1f5aa8'][k % 3], 80), 8, x, 0, z); l.rotation.set(PI / 2, rnd() * PI, 0); l.position.y = 0.035; g.add(l); }
    else g.add(caixa(0.26, 0.02, 0.1, fosco(['#1f5aa8', '#e0a52a', '#2b2b2b'][k % 3]), x, 0, z, rnd() * PI));
  }
  return g;
}

/* =======================================================
   JUNTAR: a geometria por material
   ======================================================= */
/* toda malha do grupo (com a posição dela no grupo) vira uma malha por
   material (o vidro, a água e o decalque ficam por último na ordem de
   desenho), e todo arame vira um só */
export function juntar(grupo, nome = '') {
  grupo.updateMatrixWorld(true);
  const base = grupo.parent ? grupo.parent.matrixWorld.clone().invert() : new THREE.Matrix4();
  const por = new Map(), linhas = new Map(), mt = new THREE.Matrix4();
  /* a cor lisa (sem textura, sem transparência) não precisa de material
     próprio: vai pro vértice, e uma malha leva todas as cores daquele
     jeito de material (fosco, brilho de tal brilho, luz) */
  const chaveDe = m => {
    if (m.map || m.transparent || m.vertexColors || m.alphaTest) return null;
    if (m.isMeshLambertMaterial) return 'L|' + m.side;
    if (m.isMeshPhongMaterial) return 'P|' + m.side + '|' + m.shininess + '|' + m.specular.getHexString();
    if (m.isMeshBasicMaterial) return 'B|' + m.side;
    return null;
  };
  const matCor = (chave, m) => guardado('juntado|' + chave, () => {
    if (m.isMeshLambertMaterial) return new THREE.MeshLambertMaterial({ vertexColors: true, side: m.side });
    if (m.isMeshPhongMaterial) return new THREE.MeshPhongMaterial({ vertexColors: true, side: m.side, shininess: m.shininess, specular: m.specular.clone() });
    return new THREE.MeshBasicMaterial({ vertexColors: true, side: m.side });
  });
  grupo.traverse(o => {
    if (!o.geometry || !o.visible) return;
    mt.multiplyMatrices(base, o.matrixWorld);
    if (o.isLineSegments) {
      let l = linhas.get(o.material.uuid); if (!l) linhas.set(o.material.uuid, l = { mat: o.material, geos: [] });
      const g = o.geometry.clone(); g.applyMatrix4(mt); l.geos.push(g); return;
    }
    if (!o.isMesh) return;
    const cc = chaveDe(o.material), k = cc ? 'cor|' + cc : o.material.uuid;
    let l = por.get(k); if (!l) por.set(k, l = { mat: cc ? matCor(cc, o.material) : o.material, geos: [], cores: cc ? [] : null });
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(mt);
    l.geos.push(g);
    if (l.cores) l.cores.push(o.material.color);
  });
  const saida = new THREE.Group(); saida.name = nome;
  let tri = 0;
  for (const { mat, geos, cores } of por.values()) {
    let n = 0; for (const g of geos) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), cor = cores ? new Float32Array(n * 3) : null;
    let o = 0;
    geos.forEach((g, i) => {
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      if (cor) { const k = cores[i]; for (let j = 0; j < c; j++) { cor[3 * (o + j)] = k.r; cor[3 * (o + j) + 1] = k.g; cor[3 * (o + j) + 2] = k.b; } }
      o += c; g.dispose();
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (cor) geo.setAttribute('color', new THREE.BufferAttribute(cor, 3)); else geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, mat);
    if (mat.transparent) m.renderOrder = mat.polygonOffset ? 1 : 2;
    m.matrixAutoUpdate = false;
    saida.add(m);
    tri += n / 3;
  }
  for (const { mat, geos } of linhas.values()) {
    let n = 0; for (const g of geos) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3); let o = 0;
    for (const g of geos) { pos.set(g.attributes.position.array, o * 3); o += g.attributes.position.count; g.dispose(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.computeBoundingSphere();
    const l = new THREE.LineSegments(geo, mat); l.matrixAutoUpdate = false; saida.add(l);
  }
  saida.userData.triangulos = Math.round(tri);
  return saida;
}
