/* =========================================================
   A ARENA DA FESTA EM 3D (a festa de aniversário da torcida, 23/11/2026)

   O dono escolheu a festa como cena 3D ao vivo, e depois de ver a
   primeira (de blocos lisos e, na segunda, com jogo de luz e varal de
   lâmpadas) pediu: "retire o jogo de luz, retire essas lâmpadas
   pequenas no meio. O cenário precisa ser similar ao cenário antigo do
   mapa 3d. Tenha cuidado com o piso, dê mais realismo". Então a arena é
   montada com o MESMO kit do mapa 3D antigo (detalhe3d.js): o piso de
   placa de concreto com junta, mancha e rachadura, o muro pré-moldado,
   o poste, a mesa de plástico com as cadeiras, o freezer, o isopor, a
   lixeira, o sofá e a sombra de contato embaixo de cada peça — e as
   peças da festa (o palco com o grid de treliça, os telões, a torre de
   som, as tendas dos bares, o camarote elevado) no mesmo jeito: metro,
   textura pintada no canvas e luz parada.

   O chão é 3D (a placa de concreto da arena, a rua em volta); o que tem
   altura entra na mesma cena e na mesma câmera dos bonecos
   (bonecos3_cena.js, `porCenario`), com a câmera de cima e o
   cisalhamento de sempre — a frente e o topo das peças aparecem.

   A PLANTA É A DA CENA. Cada peça vem da lista `pecas` da cena
   (jogo.js, cena `festa`): tipo, pegada no tabuleiro (x, y, w, h, em
   px) e para onde a frente olha (`frente`: n, s, e, w). O tabuleiro
   tem 24 px por metro, e as peças são feitas em METROS, com a origem no
   chão, no centro, e a frente para +Z — o padrão combinado pras peças
   do Blender (cenario3d/modelos/festa/, a lista em `pecas.json`).
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { GLTFLoader } from './GLTFLoader.js?v=d0e8be7621';
import * as K from './detalhe3d.js?v=d0e8be7621';

const M = 24;                                   // px do tabuleiro por metro
const ROT = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };
const PI = Math.PI;

/* ---------- materiais ---------- */
const { fosco, brilho, pintado, TEX } = K;
const metal = () => brilho('#a9b0b6', 50, '#777777');
const preto = () => fosco('#151517');
/* o que é só desta montagem (as placas e os telões com o nome da
   torcida): sai da placa de vídeo quando a montagem troca */
let proprios = [];
function painel(g, w, h, x, y, z, pintar, px = 512, ry = 0) {
  const cv = document.createElement('canvas');
  cv.width = px; cv.height = Math.max(16, Math.round(px * h / w));
  pintar(cv.getContext('2d'), cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mt = new THREE.MeshLambertMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.55 });
  proprios.push(mt);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mt);
  m.position.set(x, y + h / 2, z); m.rotation.y = ry;
  g.add(m); return m;
}
/* o texto cabe na largura (`larg`), com um contorno escuro pra ler de longe */
const texto = (c, t, x, y, tam, cor, peso = 900, larg = 0) => {
  const fonte = n => `${peso} ${n}px "Archivo Black","IBM Plex Sans",sans-serif`;
  c.font = fonte(tam);
  if (larg) { const w = c.measureText(t).width; if (w > larg) { tam = Math.floor(tam * larg / w); c.font = fonte(tam); } }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = Math.max(2, tam * 0.1); c.strokeStyle = 'rgba(0,0,0,.5)';
  c.strokeText(t, x, y);
  c.fillStyle = cor; c.fillText(t, x, y);
};
/* a cor do texto sobre a cor 1 da torcida: a 2, ou branco/preto se der igual */
function contraste(o) {
  if (o.cor2 && o.cor2.toLowerCase() !== String(o.cor1).toLowerCase()) return o.cor2;
  const c = new THREE.Color(o.cor1); return (c.r + c.g + c.b) / 3 > 0.55 ? '#111111' : '#ffffff';
}
/* o telão do show: a imagem parada (escura, com a faixa na cor da torcida) */
function fundoDeTelao(c, w, h, o) {
  const gr = c.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#101826'); gr.addColorStop(1, '#05070c');
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.fillStyle = o.cor1; c.globalAlpha = 0.85; c.fillRect(0, h * 0.62, w, h * 0.22); c.globalAlpha = 1;
}

/* ---------- formas (em metros, com o pé no chão) ---------- */
const add = (g, m) => { g.add(m); return m; };
const caixa = (g, w, h, d, x, y, z, mt) => add(g, K.caixa(w, h, d, mt, x, y, z));
const cil = (g, r, h, x, y, z, mt, seg = 10) => add(g, K.cilindro(r, r, h, mt, seg, x, y, z));
/* treliça quadrada (box truss) de a até b: os quatro tubos e as travessas */
function trelica(g, a, b, lado = 0.4) {
  const [x0, y0, z0] = a, [x1, y1, z1] = b, dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, comp = Math.hypot(dx, dy, dz);
  const t = new THREE.Group();
  t.position.set(x0, y0, z0);
  t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
  const r = lado / 2, mt = metal();
  for (const [p, q] of [[-r, -r], [r, -r], [-r, r], [r, r]]) caixa(t, 0.05, comp, 0.05, p, 0, q, mt);
  const n = Math.max(1, Math.round(comp / lado));
  for (let i = 0; i <= n; i++) {
    const y = i * comp / n;
    caixa(t, lado, 0.03, 0.03, 0, y, -r, mt); caixa(t, lado, 0.03, 0.03, 0, y, r, mt);
    caixa(t, 0.03, 0.03, lado, -r, y, 0, mt); caixa(t, 0.03, 0.03, lado, r, y, 0, mt);
  }
  g.add(t);
}
/* o refletor parado (a lata preta com a lente) */
function refletor(g, x, y, z) {
  caixa(g, 0.3, 0.35, 0.3, x, y - 0.35, z, preto());
  add(g, K.cilindro(0.1, 0.1, 0.04, K.luz('#fff1d0'), 10, x, y - 0.42, z));
}
/* a caixa de som de palco (a frente com o falante pintado) */
function caixaDeSom(g, w, h, d, x, y, z, ry = 0) {
  const c = new THREE.Group(); c.position.set(x, y, z); c.rotation.y = ry;
  caixa(c, w, h, d, 0, 0, 0, fosco('#18181a'));
  add(c, K.em(K.painel(w * 0.9, h * 0.92, pintado('falante', TEX.falante())), 0, h / 2, d / 2 + 0.005));
  g.add(c);
}

/* =======================================================
   AS PEÇAS — em metros, frente pra +Z. `L` é a largura (x local), `P`
   a profundidade (z local).
   ======================================================= */
const PECAS = {
  /* O PALCO: o praticável de 1,8 m com a saia preta e a faixa da
     torcida, o piso de compensado, o painel de LED no fundo com o nome,
     o grid de treliça a 10,5 m em quatro torres, os refletores parados,
     as caixas penduradas e as de chão, a bateria e a mesa do DJ */
  palco(g, L, P, o) {
    const H = 1.8;
    caixa(g, L, H, P, 0, 0, 0, fosco('#1b1b1e'));
    add(g, K.chao(L, P, pintado('palcoPiso', TEX.deck(), { cor: '#4a4540' }), 2, 0, H + 0.005, 0));
    painel(g, L, H * 0.5, 0, H * 0.25, P / 2 + 0.01, (c, w, h) => {
      c.fillStyle = o.cor1; c.fillRect(0, 0, w, h);
      texto(c, o.nome.toUpperCase(), w / 2, h / 2, h * 0.62, contraste(o), 900, w * 0.6);
    }, 1024);
    /* a escadinha de serviço atrás */
    for (let i = 0; i < 6; i++) caixa(g, 1.2, (i + 1) * H / 6, 0.3, L / 2 - 1.5, 0, -P / 2 - 0.15 - (5 - i) * 0.3, fosco('#2a2a2e'));
    /* o painel de LED do fundo */
    const tw = L * 0.8, th = 6.2;
    caixa(g, tw + 0.4, th + 0.4, 0.5, 0, H, -P / 2 + 0.5, preto());
    painel(g, tw, th, 0, H + 0.2, -P / 2 + 0.76, (c, w, h) => {
      fundoDeTelao(c, w, h, o);
      texto(c, `${o.anos} ANOS`, w / 2, h * 0.36, h * 0.32, '#ffffff', 900, w * 0.6);
      texto(c, o.nome.toUpperCase(), w / 2, h * 0.73, h * 0.13, contraste(o), 900, w * 0.8);
    }, 1024);
    /* o grid */
    const TOPO = 10.5, xs = [-L / 2 + 0.4, L / 2 - 0.4], zs = [-P / 2 + 0.35, P / 2 - 0.35];
    for (const x of xs) for (const z of zs) trelica(g, [x, 0, z], [x, TOPO, z], 0.55);
    for (const z of zs) trelica(g, [xs[0], TOPO, z], [xs[1], TOPO, z], 0.45);
    for (const x of [xs[0], -L / 6, L / 6, xs[1]]) trelica(g, [x, TOPO, zs[0]], [x, TOPO, zs[1]], 0.4);
    trelica(g, [xs[0], TOPO - 3.2, zs[1]], [xs[1], TOPO - 3.2, zs[1]], 0.35);
    for (let i = 0; i < 10; i++) refletor(g, -L / 2 + 1.6 + i * (L - 3.2) / 9, TOPO - 3.4, zs[1]);
    for (let i = 0; i < 6; i++) refletor(g, -L / 2 + 2.5 + i * (L - 5) / 5, TOPO - 0.2, zs[0] + 1.2);
    /* as caixas penduradas (line array) e as de chão */
    for (const x of [-L / 2 - 0.8, L / 2 + 0.8]) {
      for (let k = 0; k < 7; k++) caixaDeSom(g, 1.1, 0.4, 0.8, x, TOPO - 1.8 - k * 0.43, P / 2 - 0.6);
      cil(g, 0.03, 1.6, x, TOPO - 1.6, P / 2 - 0.6, metal());
      caixaDeSom(g, 1.4, 1.1, 1.1, x, 0, P / 2 - 0.4); caixaDeSom(g, 1.4, 1.1, 1.1, x, 1.1, P / 2 - 0.4);
    }
    for (const x of [-L / 2 + 2, L / 2 - 2]) caixaDeSom(g, 0.8, 0.45, 0.6, x, H, P / 2 - 0.5);
    /* a bateria no praticável e a mesa do DJ */
    caixa(g, 4, 0.4, 3, 0, H, -1.2, fosco('#2a2a30'));
    for (const [x, z, r] of [[-0.8, -1.5, 0.3], [0.8, -1.5, 0.3], [0, -0.7, 0.35], [-1.3, -0.6, 0.22], [1.3, -0.6, 0.22]]) cil(g, r, 0.4, x, H + 0.4, z, brilho('#c8ccd0', 60));
    /* os pedestais de microfone na frente do palco */
    for (const x of [-1.2, 0, 1.6]) {
      cil(g, 0.18, 0.02, x, H, 3.2, preto(), 8);
      cil(g, 0.015, 1.45, x, H, 3.2, metal(), 6);
      add(g, K.em(K.cilindro(0.03, 0.035, 0.1, preto(), 8, 0, 0, 0), x, H + 1.45, 3.12, 0, -0.5));
    }
    caixa(g, 2.4, 1.0, 0.8, 0, H, 1.5, fosco('#141416'));
    caixa(g, 2.2, 0.06, 0.6, 0, H + 1.0, 1.5, brilho('#2a2d33', 50));
    add(g, K.sombra(L, P, 0, 0, 0, 0.5));
  },
  /* os telões dos lados do palco, numa torre de treliça */
  telao(g, L, P, o) {
    const W = Math.max(5, L * 1.2), Ht = 4.2, base = 3.4;
    for (const x of [-W / 2 + 0.35, W / 2 - 0.35]) trelica(g, [x, 0, 0], [x, base + Ht + 0.6, 0], 0.4);
    trelica(g, [-W / 2 + 0.35, base + Ht + 0.6, 0], [W / 2 - 0.35, base + Ht + 0.6, 0], 0.35);
    caixa(g, W + 0.3, Ht + 0.3, 0.35, 0, base - 0.15, -0.1, preto());
    painel(g, W, Ht, 0, base, 0.09, (c, w, h) => {
      fundoDeTelao(c, w, h, o);
      texto(c, o.sigla || o.nome, w / 2, h * 0.36, h * 0.34, '#ffffff', 900, w * 0.8);
      texto(c, `${o.anos} ANOS`, w / 2, h * 0.73, h * 0.14, contraste(o), 900, w * 0.8);
    }, 512);
    caixaDeSom(g, 1.4, 1.1, 1.1, 0, 0, 0.4); caixaDeSom(g, 1.4, 1.1, 1.1, 0, 1.1, 0.4);
    add(g, K.sombra(W * 0.6, P, 0, 0, 0, 0.4));
  },
  /* a grade de contenção */
  gradil(g, L) {
    const mt = brilho('#9aa0a6', 40), n = Math.max(2, Math.round(L / 2));
    for (let i = 0; i <= n; i++) {
      const x = -L / 2 + i * L / n;
      caixa(g, 0.05, 1.1, 0.05, x, 0, 0, mt);
      caixa(g, 0.05, 0.04, 0.7, x, 0.02, 0, mt);
    }
    caixa(g, L, 0.04, 0.04, 0, 1.06, 0, mt); caixa(g, L, 0.04, 0.04, 0, 0.12, 0, mt);
    for (let i = 0; i < L / 0.12; i++) caixa(g, 0.015, 0.92, 0.015, -L / 2 + i * 0.12, 0.14, 0, mt);
  },
  /* a torre de som no meio da pista: o andar com a mesa e o toldo preto */
  'torre-som'(g, L, P, o) {
    const A = 2.3, T = 5.2;
    for (const x of [-L / 2 + 0.2, L / 2 - 0.2]) for (const z of [-P / 2 + 0.2, P / 2 - 0.2]) trelica(g, [x, 0, z], [x, T, z], 0.3);
    caixa(g, L, 0.15, P, 0, A, 0, fosco('#2a2a30'));
    add(g, K.chao(L, P, pintado('palcoPiso', TEX.deck(), { cor: '#4a4540' }), 2, 0, A + 0.155, 0));
    caixa(g, L * 0.75, 0.85, 0.7, 0, A + 0.15, -0.3, preto());
    caixa(g, L * 0.72, 0.04, 0.6, 0, A + 1.0, -0.3, brilho('#2a2d33', 50));
    caixa(g, L * 0.75, 0.6, 0.05, 0, A + 0.15, P / 2 - 0.2, metal());
    painel(g, L, 0.8, 0, A - 0.95, P / 2 + 0.02, (c, w, h) => { c.fillStyle = o.cor1; c.fillRect(0, 0, w, h); texto(c, o.sigla || '', w / 2, h / 2, h * 0.65, contraste(o), 900, w * 0.85); }, 256);
    /* o quadro de treliça em cima, com os refletores parados */
    for (const z of [-P / 2 + 0.2, P / 2 - 0.2]) trelica(g, [-L / 2 + 0.2, T, z], [L / 2 - 0.2, T, z], 0.3);
    for (const x of [-L / 2 + 0.2, L / 2 - 0.2]) trelica(g, [x, T, -P / 2 + 0.2], [x, T, P / 2 - 0.2], 0.3);
    for (const x of [-L / 4, L / 4]) refletor(g, x, T, P / 2 - 0.2);
    add(g, K.sombra(L, P, 0, 0, 0, 0.45));
  },
  /* A TENDA DO BAR: a lona vermelha de quatro águas sobre os pés de
     ferro, a saia branca com o nome, o balcão de frente pra pista, o
     freezer, a geladeira e o isopor atrás, e os engradados */
  'tenda-bar'(g, L, P, o) {
    const h = 2.6, tubo = brilho('#c9ccce', 40);
    for (const x of [-L / 2 + 0.08, L / 2 - 0.08]) for (const z of [-P / 2 + 0.08, P / 2 - 0.08]) caixa(g, 0.07, h, 0.07, x, 0, z, tubo);
    caixa(g, L, 0.35, P, 0, h - 0.35, 0, fosco('#efece6'));
    const teto = new THREE.Mesh(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1), fosco('#b8262a'));
    teto.rotation.y = PI / 4; teto.scale.set(L, 1.9, P); teto.position.set(0, h + 0.95, 0);
    g.add(teto);
    painel(g, L * 0.9, 0.3, 0, h - 0.33, P / 2 + 0.01, (c, w, hh) => { c.fillStyle = '#efece6'; c.fillRect(0, 0, w, hh); texto(c, 'BAR', w / 2, hh / 2, hh * 0.8, '#b8262a', 900, w); }, 256);
    /* o balcão */
    caixa(g, L - 0.5, 1.05, 0.6, 0, 0, P / 2 - 0.5, fosco('#6b4a2c'));
    caixa(g, L - 0.4, 0.05, 0.72, 0, 1.05, P / 2 - 0.5, fosco('#8a6a46'));
    caixa(g, L - 0.5, 0.3, 0.02, 0, 0.55, P / 2 - 0.19, fosco(o.cor1));
    for (let i = 0; i < 6; i++) cil(g, 0.035, 0.24, -L / 2 + 0.6 + i * (L - 1.2) / 5, 1.1, P / 2 - 0.5, K.vidro(i % 2 ? '#2c6b2f' : '#7a4a14', 0.9), 8);
    /* o fundo: o freezer, a geladeira de porta de vidro, o isopor e os engradados */
    const fz = K.freezer('#c8342b'); fz.position.set(-L / 2 + 1.1, 0, -P / 2 + 0.7); g.add(fz);
    caixa(g, 0.8, 2.0, 0.75, L / 2 - 0.7, 0, -P / 2 + 0.6, brilho('#e8e8e8', 40));
    add(g, K.em(K.painel(0.7, 1.7, pintado('geladeira', TEX.geladeira())), L / 2 - 0.7, 1.05, -P / 2 + 0.98));
    const is = K.isopor(true); is.position.set(0.2, 0, -P / 2 + 0.6); g.add(is);
    for (let i = 0; i < 3; i++) caixa(g, 0.6, 0.3, 0.4, -0.6, i * 0.31, -0.3, fosco(i % 2 ? '#d8b23a' : '#b52c2c'));
    add(g, K.sombra(L, P, 0, 0, 0, 0.45));
  },
  /* a mesa alta de bistrô */
  'mesa-alta'(g) {
    cil(g, 0.04, 1.05, 0, 0, 0, metal());
    cil(g, 0.25, 0.03, 0, 0, 0, metal());
    add(g, K.cilindro(0.38, 0.38, 0.04, fosco('#d8d8dc'), 16, 0, 1.05, 0));
    const is = K.isopor(true); is.scale.setScalar(0.5); is.position.set(0, 1.09, 0); g.add(is);
    add(g, K.sombra(0.8, 0.8, 0, 0, 0, 0.35, true));
  },
  /* A MESA DE PLÁSTICO com as quatro cadeiras (a do kit do mapa) */
  mesa(g, L, P, o, p) {
    g.add(K.mesaComCadeiras(K.sorteio(Math.round(p.x * 7 + p.y)), 4));
  },
  /* O CAMAROTE ELEVADO: o deque de madeira a 3 m sobre os pilares de
     ferro, o guarda-corpo de grade (aberto nas duas escadas), a divisa
     no meio, os sofás e as mesas altas, e a placa na ponta sul (que é a
     que a câmera vê). A frente (+Z) é a pista; +X é a ponta sul. */
  'camarote-alto'(g, L, P, o, p) {
    const A = 3, d = 0.25, ferro = brilho('#3a3d40', 30);
    caixa(g, L, d, P, 0, A - d, 0, fosco('#2c2a2a'));
    add(g, K.chao(L, P, pintado('deckCamarote', TEX.deck(), { cor: '#8a6e52' }), 2.4, 0, A + 0.005, 0));
    for (let x = -L / 2 + 0.3; x <= L / 2 + 0.01; x += (L - 0.6) / 6) for (const z of [-P / 2 + 0.3, 0, P / 2 - 0.3]) {
      caixa(g, 0.2, A - d, 0.2, x, 0, z, ferro);
      add(g, K.sombra(0.3, 0.3, x, z, 0, 0.35));
    }
    for (const z of [-P / 2 + 0.3, 0, P / 2 - 0.3]) caixa(g, L - 0.4, 0.2, 0.12, 0, A - d - 0.2, z, ferro);
    /* a saia preta da ponta sul e a placa */
    caixa(g, 0.04, A - d, P, L / 2 - 0.02, 0, 0, fosco('#121214'));
    painel(g, P * 0.7, 1.0, 0, A + 1.5, 0, (c, w, h) => {
      c.fillStyle = '#121214'; c.fillRect(0, 0, w, h);
      c.fillStyle = o.cor1; c.fillRect(0, h * 0.82, w, h * 0.18);
      texto(c, 'CAMAROTE', w / 2, h * 0.42, h * 0.55, '#f2f0ea', 900, w * 0.9);
    }, 512, PI / 2).position.x = L / 2 + 0.03;
    for (const z of [-P * 0.3, P * 0.3]) caixa(g, 0.08, 1.5, 0.08, L / 2 - 0.05, A, z, ferro);
    /* o guarda-corpo de grade */
    const grade = (comp, x, z, ry) => {
      const q = new THREE.Group(); q.position.set(x, A, z); q.rotation.y = ry;
      caixa(q, comp, 0.05, 0.06, 0, 1.0, 0, ferro); caixa(q, comp, 0.04, 0.04, 0, 0.1, 0, ferro);
      for (let i = 0; i <= comp / 0.14; i++) caixa(q, 0.02, 0.9, 0.02, -comp / 2 + i * 0.14, 0.12, 0, ferro);
      g.add(q);
    };
    const vaos = (p && p.vaos) || [[-6.67, -4.58], [5, 7.08]];
    let x0 = -L / 2;
    for (const [a, b] of vaos.concat([[L / 2, L / 2]])) { if (a > x0 + 0.1) grade(a - x0, (a + x0) / 2, P / 2 - 0.05, 0); x0 = b; }
    grade(L, 0, -P / 2 + 0.05, 0);
    grade(P, -L / 2 + 0.05, 0, PI / 2); grade(P, L / 2 - 0.05, 0, PI / 2);
    grade(P - 0.2, 0, 0, PI / 2);
    /* os sofás encostados no fundo e as mesas altas */
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const so = K.sofa(2.4, '#2a2a30'); so.position.set(s * L / 4 + (k - 1) * 2.7, A, -P / 2 + 0.75); g.add(so);
      }
      for (const [dx, dz] of [[-2.2, 1.8], [2.2, 2.8], [0, 4.4]]) {
        const m = new THREE.Group(); m.position.set(s * L / 4 + dx, A, dz); PECAS['mesa-alta'](m); g.add(m);
      }
    }
  },
  /* a escada do camarote: sobe da frente (+Z, a pista) pro fundo (o deque, 3 m) */
  escada(g, L, P) {
    const n = 12, A = 3, ferro = brilho('#3a3d40', 30);
    for (let i = 0; i < n; i++) {
      caixa(g, L, 0.05, P / n + 0.02, 0, (i + 1) * A / n - 0.05, P / 2 - (i + 0.5) * P / n, fosco('#5a5a60'));
      caixa(g, L, (i + 1) * A / n - 0.05, 0.03, 0, 0, P / 2 - (i + 1) * P / n, fosco('#2e2e33'));
    }
    for (const x of [-L / 2, L / 2]) {
      const cor = new THREE.Group(); cor.position.set(x, 0, P / 2); cor.rotation.x = -Math.atan2(A, P);
      caixa(cor, 0.05, 0.05, Math.hypot(A, P), 0, 1.0, -Math.hypot(A, P) / 2, ferro);
      g.add(cor);
      caixa(g, 0.05, 1.0, 0.05, x, 0, P / 2 - 0.05, ferro);
    }
  },
  /* os banheiros químicos, em fila: azuis com o teto branco e a porta */
  'banheiro-quimico'(g, L, P) {
    const n = Math.max(2, Math.floor(L / 1.3)), w = L / n;
    for (let i = 0; i < n; i++) {
      const x = -L / 2 + w / 2 + i * w;
      caixa(g, w - 0.08, 2.25, P - 0.2, x, 0, 0, brilho(i % 3 ? '#2a64b8' : '#2f6fc8', 30));
      caixa(g, w - 0.02, 0.1, P - 0.1, x, 2.25, 0, brilho('#e8eef4', 30));
      caixa(g, w * 0.62, 1.9, 0.03, x, 0.1, P / 2 - 0.09, fosco('#1f4a8a'));
      caixa(g, 0.15, 0.06, 0.04, x + w * 0.2, 1.1, P / 2 - 0.06, fosco('#d8d8d8'));
    }
    add(g, K.sombra(L, P, 0, 0, 0, 0.45));
  },
  /* o carrinho de espetinho: inox, a grelha em brasa, o toldo e o isopor */
  espetinho(g, L, P, o) {
    const inox = brilho('#b8bcc0', 70, '#999999');
    caixa(g, L * 0.8, 0.9, P * 0.75, 0, 0, 0, inox);
    caixa(g, L * 0.66, 0.06, P * 0.55, 0, 0.9, 0, fosco('#1a1a1a'));
    add(g, K.chao(L * 0.62, P * 0.48, pintado('brasa', TEX.brasa()), 0.5, 0, 0.965, 0));
    for (let i = 0; i < 7; i++) caixa(g, 0.04, 0.04, P * 0.5, -L * 0.28 + i * L * 0.093, 0.98, 0, fosco('#7a3a1a'));
    for (const x of [-L * 0.38, L * 0.38]) caixa(g, 0.04, 2.1, 0.04, x, 0, -P * 0.33, inox);
    caixa(g, L * 0.95, 0.05, P * 1.05, 0, 2.1, -P * 0.1, fosco(o.cor1));
    const is = K.isopor(false); is.position.set(-L * 0.2, 0, P * 0.9); g.add(is);
    add(g, K.sombra(L * 0.85, P * 0.8, 0, 0, 0, 0.45));
  },
  /* a catraca da portaria */
  catraca(g, L, P) {
    caixa(g, L * 0.45, 1.0, P * 0.8, 0, 0, 0, brilho('#8a8e92', 60));
    for (let i = 0; i < 3; i++) {
      const a = i * PI * 2 / 3, m = caixa(g, 0.55, 0.04, 0.04, 0, 0.9, 0, brilho('#c8ccd0', 80));
      m.position.x = L * 0.25 + Math.cos(a) * 0.3; m.position.z = Math.sin(a) * 0.3; m.rotation.y = -a;
    }
    add(g, K.sombra(L * 0.5, P * 0.8, 0, 0, 0, 0.35));
  },
  /* o muro da arena: o pré-moldado do mapa, com a faixa da torcida pendurada aqui e ali */
  tapume(g, L, P, o) {
    g.add(K.muroPremoldado(L, 2.5, 0.12));
    const n = Math.floor(L / 18);
    for (let i = 0; i < n; i++) {
      const x = -L / 2 + (i + 0.5) * L / n;
      painel(g, 4.2, 1.0, x, 1.1, 0.09, (c, w, h) => {
        c.fillStyle = o.cor1; c.fillRect(0, 0, w, h);
        c.fillStyle = contraste(o); c.fillRect(0, h * 0.08, w, h * 0.06); c.fillRect(0, h * 0.86, w, h * 0.06);
        texto(c, o.sigla || o.nome, w / 2, h / 2, h * 0.55, contraste(o), 900, w * 0.9);
      }, 256);
    }
  },
  /* o pórtico da entrada: duas torres de treliça e a faixa da festa */
  portico(g, L, P, o) {
    for (const x of [-L / 2 + 0.3, L / 2 - 0.3]) trelica(g, [x, 0, 0], [x, 5, 0], 0.4);
    trelica(g, [-L / 2 + 0.3, 5, 0], [L / 2 - 0.3, 5, 0], 0.4);
    painel(g, L - 1.2, 1.3, 0, 3.5, 0.25, (c, w, h) => {
      c.fillStyle = o.cor1; c.fillRect(0, 0, w, h);
      texto(c, `FESTA DOS ${o.anos} ANOS`, w / 2, h * 0.36, h * 0.38, contraste(o), 900, w * 0.9);
      texto(c, o.nome.toUpperCase(), w / 2, h * 0.76, h * 0.24, contraste(o), 700, w * 0.9);
    }, 768);
    for (const x of [-L / 2 + 0.3, L / 2 - 0.3]) add(g, K.sombra(0.6, 0.6, x, 0, 0, 0.4));
  },
  /* o poste de iluminação da arena (o do mapa) */
  poste(g, L, P, o, p) { const q = K.poste(8); q.rotation.y = (p && p.giro) || 0; g.add(q); },
  /* a lixeira de rodinha */
  lixeira(g) { g.add(K.lixeira('#2f6f3a')); }
};

/* =======================================================
   O CHÃO: a rua de asfalto em volta e a arena de placa de concreto,
   com a mancha grande por cima (a terra que o povo traz no pé), as
   manchas de bebida e de óleo, as rachaduras e a areia
   soprada perto da entrada. Tudo pintado uma vez e repetido por metro
   (as TEX do kit).
   ======================================================= */
function chao(raiz, D) {
  const g = new THREE.Group(); g.scale.setScalar(M);
  const W = (D.largura || 1536) / M, H = (D.altura || 1024) / M;
  const r = K.sorteio(2311);
  raiz.add(g);
  g.add(K.chao(W + 20, H + 20, pintado('asfalto', TEX.asfalto()), 4, W / 2, -0.03, H / 2));
  const x0 = 30 / M, z0 = 30 / M, x1 = W - 30 / M, z1 = H - 22 / M;
  g.add(K.chao(x1 - x0, z1 - z0, pintado('concretoArena', TEX.concreto(), { cor: '#c9c3b8' }), 6, (x0 + x1) / 2, -0.015, (z0 + z1) / 2));
  g.add(K.folhaNoChao(x1 - x0, z1 - z0, K.decalque('manchasArena', TEX.manchasLonge(), '#ffffff', 0.55), (x0 + x1) / 2, -0.01, (z0 + z1) / 2));
  const dec = (tex, chave, op, x, z, s, ry) => g.add(K.folhaNoChao(s, s, K.decalque(chave, tex, '#ffffff', op), x, -0.005, z, ry));
  for (let i = 0; i < 14; i++) dec(TEX.oleo(), 'oleoArena', 0.35, (210 + r() * 260) / M, (380 + r() * 600) / M, 0.8 + r() * 1.4, r() * PI);
  for (let i = 0; i < 10; i++) dec(TEX.oleo(), 'oleoArena', 0.3, (420 + r() * 700) / M, (360 + r() * 580) / M, 0.6 + r() * 1.0, r() * PI);
  for (let i = 0; i < 12; i++) dec(TEX.rachadura(), 'rachaArena', 0.6, (100 + r() * 1300) / M, (120 + r() * 820) / M, 1.5 + r() * 2.5, r() * PI);
  for (let i = 0; i < 4; i++) dec(TEX.areiaSolta(), 'areiaArena', 0.55, (700 + r() * 140) / M, (920 + r() * 60) / M, 3 + r() * 2, r() * PI);
  raiz.remove(g);
  const j = K.juntar(g, 'chao');
  raiz.add(j);
}

/* =======================================================
   AS PEÇAS DO BLENDER (cenario3d/modelos/festa/). Cada tipo da planta
   tem o seu arquivo; sem ele, fica o modelo daqui. Quem diz quais
   arquivos já estão na pasta é a lista `pecas.json` dela (um pedido só,
   uma vez por sessão): peça que chega entra na lista e passa a valer.
   ======================================================= */
const ARQUIVOS = {
  palco: 'palco.glb', telao: 'telao.glb', 'torre-som': 'torre_som.glb',
  'tenda-bar': 'tenda_bar.glb', 'camarote-alto': 'camarote.glb', escada: 'escada_camarote.glb',
  'mesa-alta': 'mesa_alta.glb', mesa: 'mesa_plastico.glb', catraca: 'catraca.glb', gradil: 'gradil.glb',
  portico: 'portico.glb', espetinho: 'espetinho.glb', 'banheiro-quimico': 'banheiro_quimico.glb'
};
const PASTA = 'modelos/festa/';
const glbs = new Map();          // arquivo → Promise<THREE.Object3D|null>
let lista = null;
const prontos = () => lista || (lista = fetch(PASTA + 'pecas.json?v=d0e8be7621')
  .then(r => r.ok ? r.json() : { arquivos: [] }).then(j => new Set(j.arquivos || [])).catch(() => new Set()));
function carregarPeca(arquivo) {
  if (glbs.has(arquivo)) return glbs.get(arquivo);
  const url = PASTA + arquivo;
  const p = prontos().then(tem => tem.has(arquivo)
    ? new Promise(ok => new GLTFLoader().load(url, gl => ok(gl.scene), undefined, err => { console.error('peça da festa:', arquivo, err); ok(null); }))
    : null);
  glbs.set(arquivo, p);
  return p;
}
/* o material `cor1`/`cor2`/`cor3` do modelo sai na cor da torcida */
function pintarNasCores(raiz, o) {
  raiz.traverse(m => {
    if (!m.isMesh) return;
    const lista = Array.isArray(m.material) ? m.material : [m.material];
    const novos = lista.map(mt => {
      const nome = String((mt && mt.name) || '').toLowerCase();
      const cor = nome === 'cor1' ? o.cor1 : nome === 'cor2' ? o.cor2 : nome === 'cor3' ? (o.cor3 || o.cor1) : null;
      if (!cor) return mt;
      const c = mt.clone(); c.color = new THREE.Color(cor); proprios.push(c); return c;
    });
    m.material = Array.isArray(m.material) ? novos : novos[0];
  });
}
/* o gradil do Blender é um módulo: repete ao longo do comprimento */
function porGLB(g, modelo, L, P, tipo, o) {
  g.clear();
  if (tipo === 'gradil') {
    const cx = new THREE.Box3().setFromObject(modelo), tam = new THREE.Vector3(); cx.getSize(tam);
    const passo = Math.max(0.5, tam.x), n = Math.max(1, Math.round(L / passo));
    for (let i = 0; i < n; i++) {
      const c = modelo.clone(true); pintarNasCores(c, o);
      c.position.x = -L / 2 + passo / 2 + i * (L / n); c.scale.x = (L / n) / passo;
      g.add(c);
    }
    return;
  }
  const c = modelo.clone(true); pintarNasCores(c, o);
  g.add(c);
}

/* =======================================================
   A MONTAGEM: o chão, e uma peça por item da planta, no lugar e na
   escala do tabuleiro (metros × 24), virada pra `frente`. Cada peça sai
   juntada por material (`juntar` do kit): a arena inteira fica em
   poucas chamadas de desenho.
   ======================================================= */
let atual = null;
export function cenarioDaFesta(D) {
  if (!D || !Array.isArray(D.pecas)) return null;
  const TO = window.TO || {}, E = TO.estado && TO.estado.E;
  const cores = E && E.torcida && TO.mundo ? TO.mundo.coresDaTorcida(E.torcida) : { cor: '#c0392b', cor2: '#f1f1f1', cor3: null };
  const P = (E && E.festaAniv) || {};
  const o = {
    cor1: cores.cor || '#c0392b', cor2: cores.cor2 || '#f1f1f1', cor3: cores.cor3 || null,
    nome: (E && E.torcida && E.torcida.nome) || 'Torcida',
    sigla: E && E.torcida && TO.mundo ? TO.mundo.siglaTorcida(E.torcida) : '',
    anos: P.idade || ''
  };
  liberar(atual);
  proprios = [];
  const raiz = new THREE.Group();
  raiz.name = 'festa3d';
  /* a festa é à noite: a luz da cena baixa um pouco (bonecos3_cena.js) */
  raiz.userData.luz = 0.72;
  /* o chão que sobe: o deque do camarote e as escadas (em px do tabuleiro) */
  const alturas = D.alturas || [];
  raiz.userData.alturaEm = (x, y) => {
    for (const a of alturas)
      if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h)
        return (a.rampa === 'x' ? (x - a.x) / a.w : 1) * a.alt * M;
    return 0;
  };
  chao(raiz, D);
  for (const p of D.pecas) {
    const f = PECAS[p.tipo];
    if (!f || p.sem3d) continue;
    const giro = ROT[p.frente || 's'] || 0;
    const deLado = p.frente === 'e' || p.frente === 'w';
    /* o gradil e o muro correm no lado mais comprido da pegada */
    const comprido = (p.tipo === 'gradil' || p.tipo === 'tapume') && p.h > p.w;
    const L = (deLado || comprido ? p.h : p.w) / M, Pz = (deLado || comprido ? p.w : p.h) / M;
    const g = new THREE.Group();
    g.position.set(p.x + p.w / 2, 0, p.y + p.h / 2);
    g.rotation.y = comprido && !deLado ? PI / 2 : giro;
    g.scale.setScalar(M);
    raiz.add(g);
    const k = new THREE.Group();
    g.add(k);
    f(k, L, Pz, o, p);
    const j = K.juntar(k);
    g.remove(k);
    g.add(j);
    const arq = ARQUIVOS[p.tipo];
    if (arq) carregarPeca(arq).then(modelo => { if (modelo && atual === raiz) porGLB(g, modelo, L, Pz, p.tipo, o); });
  }
  atual = raiz;
  return raiz;
}
/* o que é só desta montagem sai da placa: as malhas juntadas (geometria
   própria) e os materiais com o nome da torcida. O material do kit é
   guardado e serve à próxima montagem: fica. */
function liberar(g) {
  if (!g) return;
  g.traverse(m => { if ((m.isMesh || m.isLineSegments) && m.geometry) m.geometry.dispose(); });
  for (const mt of proprios) { if (mt.map) mt.map.dispose(); mt.dispose(); }
  proprios = [];
}
export { ARQUIVOS, M as PX_POR_METRO };
