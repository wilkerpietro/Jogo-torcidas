/* =========================================================
   A RUA DE VERANEIO (o jogo 3D, 27/09/2026)
   ---------------------------------------------------------
   O dono: "crie uma rua de casas de veraneio em pontas do mapa pra
   criar a cena de ataque à festa na casa com piscina".

   A rua é de areia, com as casas de muro dos dois lados: do lado de
   cá (o do norte, ou o do oeste), os lotes grandes, de 20 × 30 m, com
   a casa de telha, a piscina e o coqueiro; do outro, os lotes menores,
   de 16 × 20 m, com a casa de telha atrás do muro e da pérgola de
   madeira na frente. No MEIO do lado de cá fica a CASA DA FESTA, a da
   foto da cena (img/cenas/casa_piscina.webp) refeita em 3D, com a regra
   de PROMPT-CASA-PISCINA.md:

     - o portão da frente (o de carro, de correr, e o de gente, no canto
       do corredor) dá na garagem de areia, com os dois carros;
     - a casa, no lado esquerdo do lote: a sala (com a porta da frente e
       a porta pro deck da piscina), a cozinha (com a porta pro corredor),
       o DEPÓSITO (o compartimento pequeno onde quem pega a faixa se
       tranca), o banheiro, o hall e os dois quartos;
     - o CORREDOR aberto do lado esquerdo da casa, da frente até o deck
       do fundo;
     - a piscina no lado direito, com o deck em volta pelos quatro lados,
       as espreguiçadeiras e a churrasqueira no canto do fundo;
     - o DECK DO FUNDO, largo, de uma divisa à outra, e o MURO DO FUNDO
       liso, sem nada encostado: é onde a faixa da torcida fica estendida.

   Tudo em metros, no referencial do lote (o mesmo de casas3d.js): x da
   esquerda pra direita de quem olha a fachada da rua (0 a W), z = 0 na
   divisa da frente e negativo pra dentro do lote. `montarLoteDeVeraneio`
   leva os blocos pro mundo (a folha das casas e a das grades), e o
   `plano` da casa da festa sai no mundo também: é dele que o jogo 3D
   tira os pontos da briga (quem defende em cada canto, o portão que
   acorda a casa, a faixa e o depósito).
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { Construtor, METRO } from './construtor3d.js?v=56086e89a7';
import * as K from './detalhe3d.js?v=56086e89a7';

const M = METRO;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* as medidas da rua (m) */
export const VERANEIO = { lote: 20, fundo: 30, loteSul: 16, fundoSul: 20, rua: 8, n: 7, margem: 4 };

function hash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
const sorte = semente => k => (hash(semente + ':' + k) % 100003) / 100003;
const escolher = (s, k, lista) => lista[Math.floor(s(k) * lista.length) % lista.length];

/* as tintas do veraneio: reboco claro, as cores de casa de praia */
const REBOCO = ['#f3eee2', '#efe6d2', '#f6f3ea', '#e9dfc8', '#f2e4cf', '#e8efe9', '#f0e9dc'];
const TELHA = ['#e89a7c', '#dc8a6c', '#f0a887', '#d4866a'];
/* a mesma telha no desenho da planta (a cor da folha já vezes a tinta) */
const TELHA_2D = ['#d9713f', '#cf6a3a', '#e07b46', '#c9633a'];
const MURO = '#ece6d6', CIMENTO = '#d9d4c6', AREIA = '#e2d3a8', DECK = '#f6ecd8', PISCINA = '#2fb3d9', BORDA = '#f1efe6';
const MADEIRA = '#7a5234', BRANCO = '#f4f3ee', PRETO = '#26282b';
const lisa = tinta => ({ k: 'lisa', tinta });

/* o referencial do lote → o mundo (o mesmo de casas3d.js) */
export function frameDoLote(l) {
  const f = l.frente, mx = (l.x0 + l.x1) / 2, mz = (l.y0 + l.y1) / 2;
  if (f === 'n') return { fx: mx, fz: l.y0, rx: -1, rz: 0, nx: 0, nz: -1 };
  if (f === 's') return { fx: mx, fz: l.y1, rx: 1, rz: 0, nx: 0, nz: 1 };
  if (f === 'o') return { fx: l.x0, fz: mz, rx: 0, rz: 1, nx: -1, nz: 0 };
  return { fx: l.x1, fz: mz, rx: 0, rz: -1, nx: 1, nz: 0 };
}
const medidasDoLote = l => { const nS = l.frente === 'n' || l.frente === 's'; return [(nS ? l.x1 - l.x0 : l.y1 - l.y0) / M, (nS ? l.y1 - l.y0 : l.x1 - l.x0) / M]; };
/* (x, z) do lote → (x, z) do mundo */
export function noMundoDoLote(l) {
  const f = frameDoLote(l), [W] = medidasDoLote(l), meio = W / 2;
  return (x, z) => { const lx = x - meio; return [f.fx + (lx * f.rx + z * f.nx) * M, f.fz + (lx * f.rz + z * f.nz) * M]; };
}

/* =======================================================
   AS PEÇAS
   ======================================================= */
/* uma parede reta, de (a, z) a (b, z) (ao longo de x) ou de (x, a) a (x, b)
   (ao longo de z), com os vãos ({a0, a1, b1}: a porta vai do chão até b1) */
function parede(B, eixo, fixo, a, b, esp, h, vaos, tinta, k = 'suja', y0 = 0) {
  const e = esp / 2, lista = (vaos || []).filter(v => v.a1 > a && v.a0 < b).sort((p, q) => p.a0 - q.a0);
  let ini = a;
  const caixa = (a0, a1, yb, yt) => {
    if (a1 - a0 < 0.01 || yt - yb < 0.01) return;
    if (eixo === 'x') B.caixa(a0, a1, yb, yt, fixo - e, fixo + e, { todas: { k, tinta }, base: null });
    else B.caixa(fixo - e, fixo + e, yb, yt, a0, a1, { todas: { k, tinta }, base: null });
  };
  for (const v of lista) {
    caixa(ini, Math.max(ini, v.a0), y0, h);
    /* a verga em cima do vão (a janela tem o peitoril embaixo também) */
    if (v.b1 < h) caixa(Math.max(a, v.a0), Math.min(b, v.a1), v.b1, h);
    if (v.b0 > 0) caixa(Math.max(a, v.a0), Math.min(b, v.a1), y0, v.b0);
    ini = Math.max(ini, v.a1);
  }
  caixa(ini, b, y0, h);
}
/* o piso de um retângulo, na altura y */
const piso = (B, x0, x1, z0, z1, y, k, tinta) => B.tampa([[x0, z1], [x1, z1], [x1, z0], [x0, z0]], y, k, false, { tinta });
/* o telhado de quatro águas (o do construtor: a fiada de telha corre
   paralela ao beiral), com a tinta da telha por cima da folha */
function telhado4(B, x0, x1, z0, z1, h, tinta) {
  B.pintar(tinta);
  B.telhado4(x0, x1, z0, z1, h, clamp(Math.min(x1 - x0, z1 - z0) * 0.24, 0.9, 1.6), 'telha', 'telha');
  B.pintar(null);
}
/* o carro parado (a caixa do corpo, a cabine e as rodas) */
function carro(B, x, z, ang, cor) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const pt = (a, b) => [x + a * c - b * s, z + a * s + b * c];
  const caixaGirada = (a0, a1, b0, b1, y0, y1, tinta) => {
    /* uma caixa girada: as quatro paredes e o topo, em polígono */
    const p = [pt(a0, b0), pt(a1, b0), pt(a1, b1), pt(a0, b1)];
    B.pintar(tinta);
    const cl = B.cel('lisa'), uvs = [[cl[0], cl[1]], [cl[2], cl[1]], [cl[2], cl[3]], [cl[0], cl[3]]];
    for (let i = 0; i < 4; i++) {
      const [ax, az] = p[i], [bx, bz] = p[(i + 1) % 4];
      B.poli([[ax, y0, az], [bx, y1, bz], [bx, y0, bz]], [uvs[0], uvs[2], uvs[1]]);
      B.poli([[ax, y0, az], [ax, y1, az], [bx, y1, bz]], [uvs[0], uvs[3], uvs[2]]);
    }
    B.poli([[p[0][0], y1, p[0][1]], [p[3][0], y1, p[3][1]], [p[2][0], y1, p[2][1]]], [uvs[0], uvs[3], uvs[2]]);
    B.poli([[p[0][0], y1, p[0][1]], [p[2][0], y1, p[2][1]], [p[1][0], y1, p[1][1]]], [uvs[0], uvs[2], uvs[1]]);
    B.pintar(null);
  };
  caixaGirada(-2.2, 2.2, -0.88, 0.88, 0.3, 0.95, cor);
  caixaGirada(-1.1, 1.0, -0.8, 0.8, 0.95, 1.45, cor);
  caixaGirada(-1.05, 0.95, -0.82, 0.82, 1.0, 1.38, '#2b3440');
  for (const [a, b] of [[-1.4, -0.9], [1.4, -0.9], [1.4, 0.9], [-1.4, 0.9]]) caixaGirada(a - 0.32, a + 0.32, b - 0.1, b + 0.1, 0, 0.62, PRETO);
}
/* a espreguiçadeira branca de plástico */
function espreguicadeira(B, x, z, ao) {
  const [w, d] = ao ? [1.9, 0.62] : [0.62, 1.9];
  B.caixa(x - w / 2, x + w / 2, 0.28, 0.34, z - d / 2, z + d / 2, { todas: lisa(BRANCO) });
  if (ao) B.caixa(x + w / 2 - 0.5, x + w / 2, 0.34, 0.75, z - d / 2, z + d / 2, { todas: lisa(BRANCO) });
  else B.caixa(x - w / 2, x + w / 2, 0.34, 0.75, z + d / 2 - 0.5, z + d / 2, { todas: lisa(BRANCO) });
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) B.caixa(x + a * (w / 2 - 0.06) - 0.03, x + a * (w / 2 - 0.06) + 0.03, 0, 0.28, z + b * (d / 2 - 0.06) - 0.03, z + b * (d / 2 - 0.06) + 0.03, { todas: lisa(BRANCO), base: null, topo: null });
}
/* a mesa de plástico com as quatro cadeiras (a festa) */
function mesaDePlastico(B, x, z) {
  B.caixa(x - 0.4, x + 0.4, 0.7, 0.74, z - 0.4, z + 0.4, { todas: lisa(BRANCO) });
  B.caixa(x - 0.03, x + 0.03, 0, 0.7, z - 0.03, z + 0.03, { todas: lisa(BRANCO), base: null, topo: null });
  for (const [a, b] of [[-0.72, 0], [0.72, 0], [0, -0.72], [0, 0.72]]) {
    B.caixa(x + a - 0.21, x + a + 0.21, 0.4, 0.44, z + b - 0.21, z + b + 0.21, { todas: lisa(BRANCO) });
    const ea = a ? [x + a + Math.sign(a) * 0.17, x + a + Math.sign(a) * 0.21, z + b - 0.21, z + b + 0.21] : [x + a - 0.21, x + a + 0.21, z + b + Math.sign(b) * 0.17, z + b + Math.sign(b) * 0.21];
    B.caixa(ea[0], ea[1], 0.44, 0.85, ea[2], ea[3], { todas: lisa(BRANCO) });
  }
}
/* a caixa de isopor e o engradado (a festa no deck) */
const isopor = (B, x, z) => B.caixa(x - 0.3, x + 0.3, 0, 0.42, z - 0.22, z + 0.22, { todas: lisa('#f4f4f2') });
/* a churrasqueira de alvenaria no canto */
function churrasqueira(B, x0, x1, z0, z1) {
  B.caixa(x0, x1, 0, 0.9, z0, z1, { todas: { k: 'tijolo' }, base: null });
  B.caixa(x0 + 0.08, x1 - 0.08, 0.9, 0.93, z0 + 0.08, z1 - 0.08, { todas: lisa('#2a2724') });
  const cz = (z0 + z1) / 2;
  B.caixa(x0, x1, 0.9, 1.9, z0, z0 + 0.25, { todas: { k: 'tijolo' } });
  B.caixa(x0 + 0.05, x1 - 0.05, 1.9, 2.2, z0, z1 - 0.1, { todas: { k: 'tijolo' } });
  B.caixa((x0 + x1) / 2 - 0.12, (x0 + x1) / 2 + 0.12, 2.2, 3.0, cz - 0.12, cz + 0.12, { todas: { k: 'tijolo' } });
}

/* =======================================================
   A CASA DA FESTA: o plano (em metros, no referencial do lote)
   ------------------------------------------------------
   O plano é a fonte das duas coisas: o 3D (as paredes com as portas e
   as janelas, a mobília) e a MÁSCARA da briga (`cenaDaFesta`: onde o
   corpo pisa). A parede é { eixo, fixo, a, b, esp, h, vaos, tinta }:
   ao longo de x (fixo em z) ou de z (fixo em x), de a a b; o vão é
   porta (do chão até b1) ou janela (do peitoril b0 até b1 — embaixo
   dela é parede, e a briga não passa). O OBSTÁCULO é o retângulo que
   barra o corpo e não é parede: a piscina, a churrasqueira, as
   espreguiçadeiras, as mesas com as cadeiras, os carros, a mobília.
   ======================================================= */
export function planoDaCasaDaFesta(W = 20, D = 30) {
  const casa = { x0: 2.4, x1: 11.4, z0: -19, z1: -7 };
  const comodos = [
    { nome: 'SALA', tipo: 'sala', x0: 6.4, x1: 11.4, z0: -12, z1: -7 },
    { nome: 'COZINHA', tipo: 'cozinha', x0: 2.4, x1: 6.4, z0: -12, z1: -7 },
    { nome: 'DEPÓSITO', tipo: 'deposito', x0: 2.4, x1: 4.4, z0: -15, z1: -12 },
    { nome: 'BANHEIRO', tipo: 'banheiro', x0: 4.4, x1: 6.0, z0: -15, z1: -12 },
    { nome: 'HALL', tipo: 'hall', x0: 6.0, x1: 11.4, z0: -15, z1: -12 },
    { nome: 'QUARTO', tipo: 'quarto', x0: 2.4, x1: 7.8, z0: -19, z1: -15 },
    { nome: 'QUARTO', tipo: 'quarto', x0: 7.8, x1: 11.4, z0: -19, z1: -15 }
  ];
  /* a piscina, com o deck em volta pelos quatro lados */
  const piscina = { x0: 13.6, x1: 17.6, z0: -21, z1: -11 };
  const portaoCarro = { a0: 12.5, a1: 17.5 }, portaoGente = { a0: 0.55, a1: 1.8 };
  const porta = (a0, a1) => ({ a0, a1, b1: 2.1 }), jan = (a0, a1) => ({ a0, a1, b0: 1.0, b1: 2.1 });
  const C = casa, H = 2.9, esp = 0.15, di = 0.12;
  const paredes = [
    /* O MURO: a frente (os dois portões), os lados e o fundo (liso: é nele que a faixa fica) */
    { eixo: 'x', fixo: -0.1, a: 0, b: W, esp: 0.2, h: 2.0, vaos: [{ ...portaoCarro, b1: 9 }, { ...portaoGente, b1: 9 }], tinta: 'muro', k: 'suja' },
    { eixo: 'z', fixo: 0.1, a: -D, b: 0, esp: 0.2, h: 2.0, vaos: [], tinta: 'muro', k: 'suja' },
    { eixo: 'z', fixo: W - 0.1, a: -D, b: 0, esp: 0.2, h: 2.0, vaos: [], tinta: 'muro', k: 'suja' },
    { eixo: 'x', fixo: -D + 0.1, a: 0, b: W, esp: 0.2, h: 2.4, vaos: [], tinta: 'muro', k: 'lisa' },
    /* A CASA, as de fora: a frente (a porta da sala e a janela da cozinha),
       o lado do corredor (a porta da cozinha), o lado da piscina (a porta
       da sala pro deck) e o fundo (as janelas dos quartos) */
    { eixo: 'x', fixo: C.z1, a: C.x0, b: C.x1, esp, h: H, vaos: [porta(8.9, 10.1), jan(3.4, 5.2), jan(6.9, 8.3)] },
    { eixo: 'z', fixo: C.x0, a: C.z0, b: C.z1, esp, h: H, vaos: [porta(-10.0, -8.9), jan(-18, -16.4), jan(-14.2, -13.4)] },
    { eixo: 'z', fixo: C.x1, a: C.z0, b: C.z1, esp, h: H, vaos: [porta(-11.0, -9.8), jan(-17.8, -16), jan(-14, -12.8)] },
    { eixo: 'x', fixo: C.z0, a: C.x0, b: C.x1, esp, h: H, vaos: [jan(3.6, 5.2), jan(8.4, 10.0)] },
    /* as de dentro: cozinha | sala (o vão largo), a linha do depósito e do
       banheiro (o hall aberto pra sala), os dois do meio, a dos quartos e
       a que divide os quartos */
    { eixo: 'z', fixo: 6.4, a: -12, b: -7, esp: di, h: H, vaos: [{ a0: -11.2, a1: -8.4, b1: 2.3 }] },
    { eixo: 'x', fixo: -12, a: 2.4, b: 11.4, esp: di, h: H, vaos: [porta(2.95, 3.95), porta(4.75, 5.75), { a0: 6.1, a1: 11.3, b1: 2.3 }] },
    { eixo: 'z', fixo: 4.4, a: -15, b: -12, esp: di, h: H, vaos: [] },
    { eixo: 'z', fixo: 6.0, a: -15, b: -12, esp: di, h: H, vaos: [] },
    { eixo: 'x', fixo: -15, a: 2.4, b: 11.4, esp: di, h: H, vaos: [porta(6.35, 7.35), porta(8.6, 9.6)] },
    { eixo: 'z', fixo: 7.8, a: -19, b: -15, esp: di, h: H, vaos: [] }
  ];
  const PL = {
    W, D, casa, comodos, piscina, paredes, H,
    corredor: { x0: 0.2, x1: casa.x0, z0: casa.z0, z1: 0 },
    garagem: { x0: casa.x0, x1: W - 0.2, z0: casa.z1, z1: 0 },
    deckFundo: { x0: 0.2, x1: W - 0.2, z0: -D + 0.2, z1: casa.z0 },
    deckPiscina: { x0: casa.x1, x1: W - 0.2, z0: casa.z0, z1: casa.z1 },
    portaoCarro, portaoGente,
    /* o portão de correr, recolhido pro lado (aberto: é festa) */
    folhaDoPortao: { x0: portaoCarro.a1, x1: Math.min(W - 0.3, portaoCarro.a1 + 2.4), z: -0.3 },
    churrasqueira: { x0: W - 2.2, x1: W - 0.35, z0: -D + 0.35, z1: -D + 1.45 },
    espreguicadeiras: [[W - 1.1, -13], [W - 1.1, -15.5], [W - 1.1, -18]],
    mesas: [[6.5, -24.5], [11.5, -26], [15.6, -25]],
    isopores: [[12.3, -23.6], [12.9, -23.4]],
    carros: [[6.6, -3.6, 0.08, '#2d2f33'], [15.2, -3.4, -0.35, '#3a3d44']],
    /* a mobília de dentro (baixa: a briga passa em volta) */
    moveis: [
      { x0: 9.4, x1: 11.2, z0: -11.8, z1: -11.0, h: 0.95, tinta: '#4b5d7a', nome: 'sofá' },
      { x0: 2.5, x1: 4.9, z0: -7.7, z1: -7.15, h: 0.9, tinta: '#d8d2c2', nome: 'bancada' },
      { x0: 2.6, x1: 4.2, z0: -14.9, z1: -14.45, h: 1.9, tinta: '#9aa0a4', nome: 'estante' },
      { x0: 2.6, x1: 4.6, z0: -18.8, z1: -17.2, h: 0.5, tinta: '#f1eee6', nome: 'cama' },
      { x0: 9.0, x1: 11.0, z0: -18.8, z1: -17.2, h: 0.5, tinta: '#f1eee6', nome: 'cama' },
      { x0: 6.7, x1: 8.5, z0: -7.62, z1: -7.18, h: 0.5, tinta: '#5a3b27', nome: 'rack' },
      { x0: 7.15, x1: 8.05, z0: -9.08, z1: -8.52, h: 0.38, tinta: '#6b4a33', nome: 'mesinha' },
      { x0: 4.98, x1: 5.72, z0: -7.78, z1: -7.1, h: 1.8, tinta: '#f1f1ee', nome: 'geladeira' },
      { x0: 3.85, x1: 5.35, z0: -11.2, z1: -9.6, h: 0.8, tinta: '#c99b6d', nome: 'mesa da cozinha' }
    ],
    /* as caixas de som da festa (no tripé, nos cantos do deck do fundo) */
    caixasDeSom: [[1.2, -28.8], [10.2, -29.3]],
    /* a faixa: no chão, na frente do muro do fundo, no meio do deck */
    faixa: { x: 7.8, z: -D + 0.9, larg: 6.2 },
    /* o depósito, onde quem pega a faixa se tranca */
    abrigo: { x: 3.4, z: -13.3 },
    /* o portão que acorda a casa: a garagem inteira, rente ao muro da frente */
    gatilho: { x: 15, z: -1.8, raio: 4.4 },
    /* os cinco cantos de quem defende (os da cena de foto): o deck do lado
       da casa, a churrasqueira, a beira da piscina, as espreguiçadeiras e
       a sala */
    postos: [
      { id: 'visitante1', rot: 'DECK, LADO DA CASA', x: 6.0, z: -23 },
      { id: 'visitante2', rot: 'CHURRASQUEIRA', x: W - 3.2, z: -D + 2.4 },
      { id: 'visitante3', rot: 'BEIRA DA PISCINA', x: 12.6, z: -16 },
      { id: 'visitante4', rot: 'ESPREGUIÇADEIRAS', x: W - 2.4, z: -14 },
      { id: 'visitante5', rot: 'NA SALA', x: 8.8, z: -9.5 }
    ],
    /* a beira da piscina (onde o atacante leva o líder) */
    beira: { x: 15.6, z: -9.6 }
  };
  /* O QUE BARRA O CORPO sem ser parede (retângulos, no lote) */
  const caixaDoCarro = ([x, z, a]) => {
    const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)), hx = 2.2 * c + 0.88 * s, hz = 2.2 * s + 0.88 * c;
    return { x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz };
  };
  PL.obstaculos = [
    { ...piscina, nome: 'piscina' },
    { ...PL.churrasqueira, nome: 'churrasqueira' },
    ...PL.espreguicadeiras.map(([x, z]) => ({ x0: x - 0.31, x1: x + 0.31, z0: z - 0.95, z1: z + 0.95, nome: 'espreguiçadeira' })),
    ...PL.mesas.map(([x, z]) => ({ x0: x - 0.93, x1: x + 0.93, z0: z - 0.93, z1: z + 0.93, nome: 'mesa' })),
    ...PL.isopores.map(([x, z]) => ({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.22, z1: z + 0.22, nome: 'isopor' })),
    ...PL.carros.map(c => ({ ...caixaDoCarro(c), nome: 'carro' })),
    ...PL.moveis.filter(m => m.h > 0.35),
    ...PL.caixasDeSom.map(([x, z]) => ({ x0: x - 0.42, x1: x + 0.42, z0: z - 0.42, z1: z + 0.42, nome: 'caixa de som' })),
    { x0: PL.folhaDoPortao.x0, x1: PL.folhaDoPortao.x1, z0: PL.folhaDoPortao.z - 0.05, z1: PL.folhaDoPortao.z + 0.05, nome: 'portão' }
  ];
  return PL;
}

/* a casa da festa, no referencial do lote: a areia, o corredor, as paredes,
   o portão e o telhado; o deck, a cerâmica, a piscina, a churrasqueira, a
   festa, os carros e a mobília são do kit (`detalheDaCasaDaFesta`) */
function montarCasaDaFesta(B, G, PL, s) {
  const { W, D, casa: C } = PL, rebo = escolher(s, 'reboco', REBOCO);
  piso(B, 0.2, W - 0.2, -D + 0.2, 0, 0.02, 'lisa', AREIA);
  piso(B, PL.corredor.x0, PL.corredor.x1, PL.corredor.z0, -0.3, 0.04, 'laje', CIMENTO);
  /* AS PAREDES do plano: o muro e a casa */
  for (const p of PL.paredes) parede(B, p.eixo, p.fixo, p.a, p.b, p.esp, p.h, p.vaos, p.tinta === 'muro' ? MURO : rebo, p.k || 'suja');
  /* o portão de correr, recolhido pro lado (aberto: é festa) */
  const fp = PL.folhaDoPortao;
  G.esticar(G.plano([fp.x0, 0, fp.z], [1, 0, 0], [0, 1, 0]), 0, fp.x1 - fp.x0, 0, 1.9, 'lanca');
  /* O TELHADO (à parte: o jogo corta ele pra ver dentro) */
  telhado4(B.telhado || B, C.x0 - 0.45, C.x1 + 0.45, C.z0 - 0.45, C.z1 + 0.45, PL.H, escolher(s, 'telha', TELHA));
}

/* =======================================================
   A CASA DA FESTA EM DETALHE (o kit de detalhe3d.js, 28/09/2026)
   ------------------------------------------------------
   O dono: "Refaça as cenas da caravana e da casa de praia com mais
   detalhismo no threejs". O que era caixa na casa da festa sai do
   construtor e vem do kit, em malha de verdade e com a sombra de
   contato: o deck de pedra clara, a cerâmica da casa e o ladrilho do
   banheiro; a piscina (o azulejo que escurece no fundo, a água, a borda
   de pedra, a escada de inox, a boia e o colchão); a churrasqueira de
   tijolo; a festa — as espreguiçadeiras, as mesas de plástico com as
   cadeiras, os copos, as latas e as garrafas, os guarda-sóis, os
   isopores, as caixas de som, o varal de luz, as toalhas, o que ficou
   largado no chão —; os dois carros na areia; e a mobília (o sofá, a TV,
   a cozinha com a geladeira e a mesa, o banheiro, as camas, a estante do
   depósito). As posições são as do plano (a máscara da briga sai dele).
   Devolve o grupo no mundo (juntado por material), com cada malha
   marcada `peca`: o cenário não assa ela (o forno achataria a sombra
   macia e o vidro), põe inteira na cena e no corte da câmera.
   ======================================================= */
export function detalheDaCasaDaFesta(l) {
  const [W, D] = medidasDoLote(l), PL = planoDaCasaDaFesta(W, D), f = frameDoLote(l);
  const rnd = K.sorteio(Math.abs(Math.round(l.x0 * 7 + l.y0 * 13)) + 5), PI = Math.PI;
  const fora = new THREE.Group(), g = new THREE.Group();
  fora.position.set(f.fx, 0, f.fz); fora.rotation.y = Math.atan2(-f.rz, f.rx); fora.scale.setScalar(M);
  g.position.x = -W / 2; fora.add(g);
  const pt = (o, x, z, ry = 0, y = 0) => { o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  /* o piso de um retângulo com a textura presa ao lote (as emendas batem de um pedaço pro outro) */
  const pisoK = (x0, x1, z0, z1, y, mat, m) => {
    if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return;
    const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0); geo.rotateX(-PI / 2); geo.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / m, -p.getZ(i) / m);
    g.add(new THREE.Mesh(geo, mat));
  };
  const C = PL.casa, P = PL.piscina, bd = 0.35, df = PL.deckFundo, dp = PL.deckPiscina;
  /* O DECK de pedra clara, em volta da piscina (sem passar por baixo dela nem da borda) */
  const deck = K.pintado('deckFesta', K.TEX.deck(), { cor: '#fbf6ea' });
  const px0 = P.x0 - bd, px1 = P.x1 + bd, pz0 = P.z0 - bd, pz1 = P.z1 + bd;
  pisoK(df.x0, df.x1, df.z0, pz0, 0.05, deck, 2);
  pisoK(df.x0, px0, pz0, df.z1, 0.05, deck, 2); pisoK(px1, df.x1, pz0, df.z1, 0.05, deck, 2);
  pisoK(dp.x0, px0, dp.z0, dp.z1, 0.05, deck, 2); pisoK(px1, dp.x1, dp.z0, dp.z1, 0.05, deck, 2);
  pisoK(px0, px1, pz1, dp.z1, 0.05, deck, 2);
  /* A CERÂMICA da casa e o ladrilho do banheiro */
  const cer = K.pintado('ceramicaFesta', K.TEX.ceramica(), { cor: '#fbf6ec' }), lad = K.pintado('ladrilho', K.TEX.ladrilho());
  const ban = PL.comodos.find(c => c.tipo === 'banheiro');
  pisoK(C.x0, C.x1, C.z0, ban.z0, 0.08, cer, 1.6); pisoK(C.x0, C.x1, ban.z1, C.z1, 0.08, cer, 1.6);
  pisoK(C.x0, ban.x0, ban.z0, ban.z1, 0.08, cer, 1.6); pisoK(ban.x1, C.x1, ban.z0, ban.z1, 0.08, cer, 1.6);
  pisoK(ban.x0, ban.x1, ban.z0, ban.z1, 0.08, lad, 1.6);
  /* A PISCINA, a escada, a boia e o colchão */
  pt(K.piscina(P.x1 - P.x0, P.z1 - P.z0, bd), (P.x0 + P.x1) / 2, (P.z0 + P.z1) / 2, 0, 0.05);
  pt(K.escadaDePiscina(), P.x1 - 0.9, P.z1 - 0.02, PI, 0.05);
  pt(K.boia('#ff6a3d'), P.x0 + 1.4, P.z1 - 3.5, 0, 0.09);
  pt(K.colchaoInflavel('#f2c230'), P.x0 + 2.6, P.z0 + 2.8, 0.5, 0.09);
  /* A CHURRASQUEIRA no canto do fundo */
  const cq = PL.churrasqueira;
  pt(K.churrasqueira(cq.x1 - cq.x0, cq.z1 - cq.z0), (cq.x0 + cq.x1) / 2, (cq.z0 + cq.z1) / 2, 0, 0.05);
  /* A FESTA: as espreguiçadeiras (uma com a almofada, uma com a toalha), as
     mesas com as cadeiras e o que tem em cima, os guarda-sóis, os isopores,
     as caixas de som, o varal de luz, o que ficou largado, a bola */
  PL.espreguicadeiras.forEach(([x, z], i) => pt(K.espreguicadeira(i === 1 ? '#2f7fbf' : null), x, z, -PI / 2, 0.05));
  pt(K.toalha('#e0a52a', 1.2, 0.6), PL.espreguicadeiras[2][0], PL.espreguicadeiras[2][1] + 0.3, PI / 2, 0.39);
  pt(K.toalha('#2b8f6a', 1.5, 0.7), P.x0 - 1.1, P.z1 - 2.4, 0.3, 0.06);
  PL.mesas.forEach(([x, z]) => pt(K.mesaComCadeiras(rnd), x, z, rnd() * PI, 0.05));
  pt(K.guardaSol('#e2574c', '#f4efe2', 1.35), PL.mesas[0][0], PL.mesas[0][1], 0.3, 0.05);
  pt(K.guardaSol('#2f7fbf', '#f4efe2', 1.35), PL.mesas[2][0], PL.mesas[2][1], 1.1, 0.05);
  PL.isopores.forEach(([x, z], i) => pt(K.isopor(i === 0), x, z, (rnd() - 0.5) * 0.6, 0.05));
  PL.caixasDeSom.forEach(([x, z]) => pt(K.caixaDeSom(), x, z, Math.atan2(8 - x, -22 - z), 0.05));
  pt(K.varalDeLuz([[2.6, 2.7, -19.08], [6.5, 2.32, -29.72], [8.0, 2.7, -19.08], [12.5, 2.32, -29.72], [11.3, 2.7, -19.08]]), 0, 0, 0, 0.05);
  pt(K.largados(14, 3.2, rnd), 8.5, -24.2, 0, 0.05);
  pt(K.largados(7, 1.6, rnd), P.x0 - 1.0, P.z0 - 1.4, 0, 0.05);
  pt(K.bola(), 9.6, -21.4, 0, 0.05);
  /* OS DOIS CARROS na areia da garagem */
  PL.carros.forEach(([x, z, a, cor], i) => pt(K.carro({ tipo: i ? 'hatch' : 'suv', cor }), x, z, -a, 0.02));
  /* A MOBÍLIA */
  const mov = n => PL.moveis.find(m => m.nome === n), meio = m => [(m.x0 + m.x1) / 2, (m.z0 + m.z1) / 2];
  let q = mov('sofá'); pt(K.sofa(q.x1 - q.x0, '#4b5d7a'), ...meio(q), 0, 0.08);
  q = mov('rack'); pt(K.salaDeTV(), (q.x0 + q.x1) / 2, (q.z0 + q.z1) / 2, PI, 0.08);
  q = mov('bancada'); pt(K.cozinha(q.x1 - q.x0), ...meio(q), PI, 0.08);
  q = mov('mesa da cozinha'); pt(K.mesaDeJantar(1.2, 0.8), ...meio(q), 0, 0.08);
  q = mov('estante'); pt(K.estanteDeposito(q.x1 - q.x0, rnd), ...meio(q), 0, 0.08);
  PL.moveis.filter(m => m.nome === 'cama').forEach((c, i) => pt(K.cama(c.x1 - c.x0, c.z1 - c.z0, i ? '#3f7a8c' : '#b85a4a', i ? 1 : -1), ...meio(c), i ? 0 : PI, 0.08));
  pt(K.banheiro(), (ban.x0 + ban.x1) / 2, (ban.z0 + ban.z1) / 2, -PI / 2, 0.08);
  /* a sombra no pé dos muros e das paredes de fora da casa */
  const muro = (L, x, z, ry) => { const s = K.sombraDeParede(L, 0.8, 0.26); s.position.set(x, 0.05, z); s.rotation.y = ry; g.add(s); };
  muro(W - 0.4, W / 2, -D + 0.2, 0); muro(D - 0.4, 0.2, -D / 2, PI / 2); muro(D - 0.4, W - 0.2, -D / 2, -PI / 2);
  muro(C.x1 - C.x0, (C.x0 + C.x1) / 2, C.z0 - 0.08, PI); muro(C.z1 - C.z0, C.x1 + 0.08, (C.z0 + C.z1) / 2, PI / 2);
  const junto = K.juntar(fora, 'a festa na casa de praia');
  fora.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  junto.traverse(o => { if (o.isMesh || o.isLineSegments) o.userData.peca = true; });
  return junto;
}

/* =======================================================
   A BRIGA NA CASA DA FESTA (a cena 'casa-piscina@3d' do jogo 3D)
   ------------------------------------------------------
   O combate do jogo de feed roda num tabuleiro de 1536 × 1024 (a célula
   de 8), o mesmo de todas as cenas; aqui o tabuleiro é um retângulo do
   MUNDO, em cima da casa da festa: 1 px do tabuleiro é 1 unidade do
   mundo (19,4 por metro), o x corre ao longo da rua e o y vai do muro do
   fundo da casa (em cima) pra rua (embaixo) e pro outro lado dela — a
   casa e a rua como na foto da cena (img/cenas/casa_piscina.webp).
   `noMundo(x, y)` leva o ponto do tabuleiro pro mundo; `doMundo`, o
   contrário. A MÁSCARA sai do plano da casa (não da grade do passo do
   cenário): a rua de areia inteira e o lote da festa pisam; as paredes
   (engrossadas até uma célula, pra não vazar), a piscina e o que o plano
   diz que barra, não; os lotes vizinhos ficam fora da briga (é muro). A
   porta de verdade tem de 0,9 a 1,2 m, e a da máscara, 1,3 m no mínimo:
   o corpo da briga precisa de três células de vão pra passar.
   ======================================================= */
export const TABULEIRO = { W: 1536, H: 1024, CEL: 8 };
export function cenaDaFesta(l, opc = {}) {
  const { W: TW, H: TH, CEL } = TABULEIRO, COLS = TW / CEL, ROWS = TH / CEL;
  const [W, D] = medidasDoLote(l), PL = planoDaCasaDaFesta(W, D), f = frameDoLote(l), noLote = noMundoDoLote(l);
  const RUA = opc.rua || VERANEIO.rua, FUNDO = 20;
  /* lote (m) → tabuleiro (px): o meio do lote no meio do x; o muro do fundo a FUNDO px do alto */
  const bx = x => (x - W / 2) * M + TW / 2, by = z => (z + D) * M + FUNDO;
  const lx = x => (x - TW / 2) / M + W / 2, lz = y => (y - FUNDO) / M - D;
  /* o tabuleiro no mundo: a origem (o canto de cima à esquerda) e os dois eixos */
  const [ox, oz] = noLote(lx(0), lz(0));
  const u = [f.rx, f.rz], v = [f.nx, f.nz];
  const noMundo = (x, y) => [ox + x * u[0] + y * v[0], oz + x * u[1] + y * v[1]];
  const doMundo = (wx, wz) => { const dx = wx - ox, dz = wz - oz; return [dx * u[0] + dz * u[1], dx * v[0] + dz * v[1]]; };
  /* A MÁSCARA */
  const malha = new Uint8Array(COLS * ROWS);
  const pintar = (r, valor) => {
    /* a célula cujo meio cai no retângulo (em px) */
    const c0 = Math.max(0, Math.ceil(r.x0 / CEL - 0.5)), c1 = Math.min(COLS - 1, Math.floor(r.x1 / CEL - 0.5));
    const r0 = Math.max(0, Math.ceil(r.y0 / CEL - 0.5)), r1 = Math.min(ROWS - 1, Math.floor(r.y1 / CEL - 0.5));
    for (let j = r0; j <= r1; j++) for (let i = c0; i <= c1; i++) malha[j * COLS + i] = valor;
  };
  const doLote = r => ({ x0: bx(Math.min(r.x0, r.x1)), x1: bx(Math.max(r.x0, r.x1)), y0: by(Math.min(r.z0, r.z1)), y1: by(Math.max(r.z0, r.z1)) });
  /* a parede engrossada até pegar uma fileira de células inteira */
  const GROSSA = (CEL + 1) / M;
  const barrar = (r, folga = 0) => pintar(doLote({ x0: r.x0 - folga, x1: r.x1 + folga, z0: r.z0 - folga, z1: r.z1 + folga }), 0);
  /* 1) a rua de areia, de ponta a ponta, e o lote da festa */
  /* (a rua sobe até a linha do muro da frente: o vão do portão fica
     aberto de ponta a ponta — a parede é pintada por cima, com os vãos) */
  pintar({ x0: 0, x1: TW, y0: by(-0.3), y1: by(RUA - 0.25) }, 1);
  pintar(doLote({ x0: 0.2, x1: W - 0.2, z0: -D + 0.2, z1: 0 }), 1);
  /* 2) as paredes, com os vãos de porta (a janela é parede embaixo) */
  const VAO_MIN = 1.3;
  for (const p of PL.paredes) {
    const e = Math.max(p.esp, GROSSA) / 2;
    const portas = p.vaos.filter(q => !(q.b0 > 0)).map(q => {
      const w = Math.max(VAO_MIN, q.a1 - q.a0), c = (q.a0 + q.a1) / 2;
      return { a0: Math.max(p.a + 0.3, c - w / 2), a1: Math.min(p.b - 0.3, c + w / 2) };
    }).sort((a, b) => a.a0 - b.a0);
    let ini = p.a - e;
    const trecho = (a0, a1) => { if (a1 - a0 <= 0) return; barrar(p.eixo === 'x' ? { x0: a0, x1: a1, z0: p.fixo - e, z1: p.fixo + e } : { x0: p.fixo - e, x1: p.fixo + e, z0: a0, z1: a1 }); };
    for (const q of portas) { trecho(ini, q.a0); ini = Math.max(ini, q.a1); }
    trecho(ini, p.b + e);
  }
  /* 3) o que barra o corpo e não é parede */
  for (const o of PL.obstaculos) barrar(o);
  /* 4) o que quem monta diz que barra, no mundo (o tronco do coqueiro da rua) */
  for (const o of opc.obstaculos || []) {
    const [x, y] = doMundo(o.x, o.z), r = Math.max(o.r || 0, CEL * 0.6);
    pintar({ x0: x - r, x1: x + r, y0: y - r, y1: y + r }, 0);
  }
  /* o texto da máscara (as corridas de cada linha, começando pelo que barra) */
  const linhas = [];
  for (let j = 0; j < ROWS; j++) {
    const runs = []; let v0 = 0, n = 0;
    for (let i = 0; i < COLS; i++) { const v1 = malha[j * COLS + i]; if (v1 === v0) n++; else { runs.push(n); v0 = v1; n = 1; } }
    runs.push(n);
    linhas.push(runs.join(','));
  }
  const pt = p => ({ x: Math.round(bx(p.x)), y: Math.round(by(p.z)) });
  const meioDaRua = by(RUA / 2);
  const cena = {
    id: 'casa-piscina@3d', base: 'casa-piscina', tres: true, nome: 'Casa de veraneio',
    local: 'Na resenha deles, numa casa de veraneio',
    largura: TW, altura: TH, celula: CEL, imagem: null, mascara: linhas.join(';'),
    blocos: [], enfeites: [], varais: [], grades: [], pintura: null,
    saida: { perto: 'Tomar a casa', longe: 'Beira da piscina (leve o líder)',
             feito: 'sua torcida tomou a resenha deles',
             dica: 'Leve o líder até a beira da piscina.' },
    /* a faixa estendida no muro do fundo (o ponto é no chão, na frente dele; `dir` aponta pro muro) */
    faixas: { visitante: { ...pt(PL.faixa), len: Math.round(PL.faixa.larg * M), dir: [0, -1] } },
    faixaAbrigo: { ...pt(PL.abrigo), raio: 22, rot: 'DEPÓSITO' },
    espalharBonde: 'visitante', semBocas: true,
    spawns: [
      /* o bonde que ataca chega pela rua, longe do portão (é ele que acorda a casa) */
      { id: 'mandante1', rot: '1º ESCALÃO', lado: 'mandante', ...pt({ x: W + 10, z: RUA * 0.62 }), jogador: true, entrada: 'piscina' },
      { id: 'mandante2', rot: '2º ESCALÃO', lado: 'mandante', ...pt({ x: W + 17, z: RUA * 0.45 }), entrada: 'piscina' },
      ...PL.postos.map(p => ({ id: p.id, rot: p.rot, lado: 'visitante', ...pt(p), guarda: true, entrada: 'fim_rua' }))
    ],
    entradas: [
      { id: 'piscina', rot: 'BEIRA DA PISCINA', lado: 'mandante', ...pt(PL.beira), raio: 56, dir: [0, -1] },
      { id: 'fim_rua', rot: 'FIM DA RUA', lado: 'visitante', x: 40, y: Math.round(meioDaRua), raio: 46, dir: [-1, 0] }
    ],
    gatilho: { ...pt(PL.gatilho), raio: Math.round(PL.gatilho.raio * M), lado: 'mandante', soZona: true,
               rot: 'PORTÃO DA CASA', espera: 'a resenha ainda não te viu',
               aviso: 'gritaram no portão — a casa inteira veio pra cima' },
    pmPostos: [{ x: 80, y: Math.round(meioDaRua) }, { x: TW - 80, y: Math.round(meioDaRua) }]
  };
  /* o chão de cada ponto do tabuleiro (m): o piso da casa, o deck, a areia */
  const dentro = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
  const chao = (x, y) => {
    const X = lx(x), Z = lz(y);
    if (X < 0 || X > W || Z < -D || Z > 0) return 0.02;
    if (dentro(PL.casa, X, Z)) return 0.08;
    if (dentro(PL.deckFundo, X, Z) || dentro(PL.deckPiscina, X, Z)) return 0.05;
    return 0.02;
  };
  return { cena, noMundo, doMundo, u, v, origem: [ox, oz], chao, plano: PL, mundo: festaNoMundo(l),
           casa: (() => { const [cx, cz] = noLote((PL.casa.x0 + PL.casa.x1) / 2, (PL.casa.z0 + PL.casa.z1) / 2); return { x: cx, z: cz }; })(),
           malha, COLS, ROWS };
}

/* =======================================================
   AS CASAS VIZINHAS
   ======================================================= */
/* O ARRANJO de cada vizinha (m, no referencial do lote): de que lado
   fica a casa, a piscina e o portão — o 3D e o desenho da planta leem
   daqui, pra baterem */
function arranjoDaVizinha(W, D, s) {
  const esq = s('lado') < 0.5, cx0 = esq ? 2 : W - 12, cz1 = -8 - s('fundo') * 2, px0 = esq ? 13.5 : 2.5, pz1 = -10 - s('pz') * 4;
  return { esq, casa: { x0: cx0, x1: cx0 + 10, z0: cz1 - 11, z1: cz1 }, piscina: { x0: px0, x1: px0 + 4, z0: pz1 - 7, z1: pz1 },
           deck: { x0: px0 - 1, x1: px0 + 5, z0: pz1 - 8, z1: pz1 + 1 }, portao: { a0: esq ? 13 : 2, a1: esq ? 17.5 : 6.5 } };
}
const arranjoDaVizinhaSul = (W, D) => ({ casa: { x0: 2.2, x1: W - 2.2, z0: -16.5, z1: -6.5 }, portao: { a0: W / 2 - 1.8, a1: W / 2 + 1.8 } });
/* a casa de veraneio do lado de cá (20 × 30): muro, a casa de telha de
   um lado, a piscina pequena do outro, o coqueiro na frente */
function montarVizinha(B, G, W, D, s) {
  const rebo = escolher(s, 'reboco', REBOCO), H = 2.9, A = arranjoDaVizinha(W, D, s), esq = A.esq;
  piso(B, 0.2, W - 0.2, -D + 0.2, 0, 0.02, 'lisa', AREIA);
  parede(B, 'x', -0.1, 0, W, 0.2, 1.9, [{ a0: A.portao.a0, a1: A.portao.a1, b1: 9 }], MURO, 'suja');
  parede(B, 'z', 0.1, -D, 0, 0.2, 1.9, [], MURO, 'suja');
  parede(B, 'z', W - 0.1, -D, 0, 0.2, 1.9, [], MURO, 'suja');
  parede(B, 'x', -D + 0.1, 0, W, 0.2, 2.2, [], MURO, 'suja');
  const { x0: cx0, x1: cx1, z0: cz0, z1: cz1 } = A.casa;
  const jan = (a0, a1) => ({ a0, a1, b0: 1.0, b1: 2.1 });
  parede(B, 'x', cz1, cx0, cx1, 0.15, H, [{ a0: cx0 + 4.5, a1: cx0 + 5.5, b1: 2.1 }, jan(cx0 + 1.2, cx0 + 3), jan(cx0 + 7, cx0 + 8.8)], rebo);
  parede(B, 'x', cz0, cx0, cx1, 0.15, H, [jan(cx0 + 2, cx0 + 3.6), jan(cx0 + 6.4, cx0 + 8)], rebo);
  parede(B, 'z', cx0, cz0, cz1, 0.15, H, [jan(cz0 + 3, cz0 + 4.4)], rebo);
  parede(B, 'z', cx1, cz0, cz1, 0.15, H, [jan(cz0 + 6, cz0 + 7.4)], rebo);
  piso(B, cx0, cx1, cz0, cz1, 0.08, 'lisa', '#e5dfd0');
  telhado4(B, cx0 - 0.45, cx1 + 0.45, cz0 - 0.45, cz1 + 0.45, H, escolher(s, 'telha', TELHA));
  /* a piscina pequena e o deck */
  const dk = A.deck, pc = A.piscina;
  piso(B, dk.x0, dk.x1, dk.z0, dk.z1, 0.05, 'piso_bar', DECK);
  piso(B, pc.x0, pc.x1, pc.z0, pc.z1, 0.07, 'lisa', PISCINA);
  if (s('carro') < 0.6) carro(B, esq ? 15.2 : 4.5, -3.5, 0.1 - s('ca') * 0.2, escolher(s, 'corcarro', ['#e8e8e6', '#2d2f33', '#8a1f1f', '#3f607c', '#9a9d9f']));
}
/* a casa do outro lado da rua (16 × 20): muro baixo com a pérgola de
   madeira na frente, a casa de telha atrás */
function montarVizinhaSul(B, G, W, D, s) {
  const rebo = escolher(s, 'reboco', REBOCO), H = 2.8, A = arranjoDaVizinhaSul(W, D);
  piso(B, 0.2, W - 0.2, -D + 0.2, 0, 0.02, 'lisa', AREIA);
  parede(B, 'x', -0.1, 0, W, 0.2, 1.4, [{ a0: A.portao.a0, a1: A.portao.a1, b1: 9 }], MURO, 'suja');
  parede(B, 'z', 0.1, -D, 0, 0.2, 1.8, [], MURO, 'suja');
  parede(B, 'z', W - 0.1, -D, 0, 0.2, 1.8, [], MURO, 'suja');
  parede(B, 'x', -D + 0.1, 0, W, 0.2, 1.8, [], MURO, 'suja');
  /* a pérgola: as vigas de madeira em cima do portão */
  for (let k = 0; k < 7; k++) { const x = W / 2 - 2.1 + k * 0.7; B.caixa(x - 0.06, x + 0.06, 2.2, 2.34, -1.6, 0, { todas: lisa(MADEIRA) }); }
  for (const x of [W / 2 - 2.2, W / 2 + 2.2]) B.caixa(x - 0.1, x + 0.1, 0, 2.2, -1.6, -1.4, { todas: lisa(MADEIRA) });
  B.caixa(W / 2 - 2.3, W / 2 + 2.3, 2.1, 2.2, -1.6, -1.45, { todas: lisa(MADEIRA) });
  const { x0: cx0, x1: cx1, z0: cz0, z1: cz1 } = A.casa;
  const jan = (a0, a1) => ({ a0, a1, b0: 1.0, b1: 2.1 });
  parede(B, 'x', cz1, cx0, cx1, 0.15, H, [{ a0: W / 2 - 0.5, a1: W / 2 + 0.5, b1: 2.1 }, jan(cx0 + 1, cx0 + 2.6), jan(cx1 - 2.6, cx1 - 1)], rebo);
  parede(B, 'x', cz0, cx0, cx1, 0.15, H, [jan(cx0 + 2, cx0 + 3.4)], rebo);
  parede(B, 'z', cx0, cz0, cz1, 0.15, H, [], rebo);
  parede(B, 'z', cx1, cz0, cz1, 0.15, H, [], rebo);
  piso(B, cx0, cx1, cz0, cz1, 0.08, 'lisa', '#e5dfd0');
  telhado4(B, cx0 - 0.4, cx1 + 0.4, cz0 - 0.4, cz1 + 0.4, H, escolher(s, 'telha', TELHA));
}

/* O LOTE EM PLANTA (o desenho 2D da planta): os retângulos no mundo —
   a casa (o telhado), a piscina e o deck — pelo mesmo arranjo do 3D */
export function plantaDoLote(l) {
  const [W, D] = medidasDoLote(l), s = sorte('ver' + Math.round(l.x0) + ',' + Math.round(l.y0)), noMundo = noMundoDoLote(l);
  const ret = r => { const [ax, az] = noMundo(r.x0, r.z0), [bx, bz] = noMundo(r.x1, r.z1); return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), y0: Math.min(az, bz), y1: Math.max(az, bz) }; };
  if (l.veraneio === 'festa') {
    const PL = planoDaCasaDaFesta(W, D);
    return { casa: ret(PL.casa), piscina: ret(PL.piscina), deck: [ret(PL.deckFundo), ret(PL.deckPiscina)], telha: escolher(s, 'telha', TELHA_2D) };
  }
  if (l.veraneio === 'sul') return { casa: ret(arranjoDaVizinhaSul(W, D).casa), deck: [], telha: escolher(s, 'telha', TELHA_2D) };
  const A = arranjoDaVizinha(W, D, s);
  return { casa: ret(A.casa), piscina: ret(A.piscina), deck: [ret(A.deck)], telha: escolher(s, 'telha', TELHA_2D) };
}

/* =======================================================
   A MONTAGEM DE UM LOTE, no mundo
   ======================================================= */
/* `l`: o lote da planta ({x0, x1, y0, y1, frente, veraneio: 'festa' |
   'norte' | 'sul'}). Os blocos vão pro `destino` (casas, grades,
   telhado), como a sede; o que a casa da festa devolve é o plano dela no
   mundo */
export function montarLoteDeVeraneio(l, destino = {}, opc = {}) {
  const [W, D] = medidasDoLote(l), s = sorte('ver' + Math.round(l.x0) + ',' + Math.round(l.y0));
  const B = Construtor('casas'), G = Construtor('grades'), Tt = Construtor('casas');
  let PL = null;
  if (l.veraneio === 'festa') {
    PL = planoDaCasaDaFesta(W, D);
    B.telhado = Tt;
    montarCasaDaFesta(B, G, PL, s);
  } else if (l.veraneio === 'sul') montarVizinhaSul(B, G, W, D, s);
  else montarVizinha(B, G, W, D, s);
  const noMundo = noMundoDoLote(l), y0 = opc.y0 || 0;
  const bloco = C => {
    const n = C.pos.length / 3;
    if (!n) return null;
    const pos = new Float32Array(n * 3), P = C.pos;
    for (let i = 0; i < n; i++) {
      const [wx, wz] = noMundo(P[3 * i], P[3 * i + 2]);
      pos[3 * i] = wx; pos[3 * i + 1] = y0 + P[3 * i + 1] * M; pos[3 * i + 2] = wz;
    }
    return { pos, uv: new Float32Array(C.uv), cor: new Float32Array(C.cor) };
  };
  for (const [C, lista] of [[B, 'casas'], [G, 'grades'], [Tt, 'telhado']]) {
    const b = bloco(C);
    if (b) (destino[lista] = destino[lista] || []).push(b);
  }
  return l.veraneio === 'festa' ? { W, D, plano: PL, mundo: festaNoMundo(l) } : { W, D };
}
/* O PLANO DA CASA DA FESTA NO MUNDO (o jogo 3D tira dele os pontos da
   briga): os retângulos viram caixas no mundo ({x0, x1, z0, z1}) e os
   pontos, (x, z) */
export function festaNoMundo(l) {
  const [W, D] = medidasDoLote(l), PL = planoDaCasaDaFesta(W, D), f = frameDoLote(l), noMundo = noMundoDoLote(l);
  const ret = r => { const [ax, az] = noMundo(r.x0, r.z0), [bx, bz] = noMundo(r.x1, r.z1); return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) }; };
  const pt = p => { const [x, z] = noMundo(p.x, p.z); return { ...p, x, z }; };
  /* os rumos no mundo: `frente`, do lote pra rua; `fundo`, da rua pro
     muro do fundo. A faixa, estendida no chão rente ao muro do fundo,
     olha pra casa (pra frente) */
  const fundo = [-f.nx, -f.nz];
  const faixa = { ...pt(PL.faixa), olha: [f.nx, f.nz] };
  return {
    lote: { x0: l.x0, x1: l.x1, z0: l.y0, z1: l.y1 }, casa: ret(PL.casa), piscina: ret(PL.piscina),
    comodos: PL.comodos.map(c => ({ ...ret(c), nome: c.nome, tipo: c.tipo })),
    corredor: ret(PL.corredor), garagem: ret(PL.garagem), deckFundo: ret(PL.deckFundo), deckPiscina: ret(PL.deckPiscina),
    faixa, abrigo: pt(PL.abrigo), gatilho: { ...pt(PL.gatilho), raio: PL.gatilho.raio * M }, postos: PL.postos.map(pt), beira: pt(PL.beira),
    portao: pt({ x: (PL.portaoCarro.a0 + PL.portaoCarro.a1) / 2, z: 0 }), portaoGente: pt({ x: (PL.portaoGente.a0 + PL.portaoGente.a1) / 2, z: 0 }),
    mesas: PL.mesas.map(([x, z]) => pt({ x, z })), churrasqueira: ret(PL.churrasqueira),
    frente: [f.nx, f.nz], fundo, W, D
  };
}

