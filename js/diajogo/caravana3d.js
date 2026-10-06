/* =========================================================
   A CARAVANA NA ESTRADA (o jogo 3D, 28/09/2026)
   ---------------------------------------------------------
   O dono: "Crie também a cena 3d da caravana inspirado nas duas
   imagens" — as duas emboscadas da viagem do jogo de feed:

   - O POSTO (img/cenas/emb_posto.webp, "No posto, na parada da
     caravana"): o pátio de concreto em placas, murado nos três lados,
     aberto pra rodovia embaixo; a loja de conveniência no fundo (a
     vitrine pro pátio, as prateleiras, as geladeiras, o balcão, os dois
     quartinhos) e o depósito do lado dela, aberto pro pátio, com o
     compressor, a bancada e a coluna de pneus; as duas ilhas de bomba no
     meio; o ônibus da caravana parado na frente das bombas; o carro
     saindo pra pista; o canteiro com o poste; pilha de pneu, tambor, a
     mangueira no muro; as faixas, as setas, o óleo e a marca de pneu no
     chão.
   - A ESTRADA (img/cenas/emb_onibus.webp, "Na estrada, pista fechada"):
     a pista de duas mãos, com a faixa amarela no meio e os remendos; o
     ônibus verde parado e dois carros brancos fechando ele na mão de
     baixo; as calçadas de placa com a areia soprada; os muros de placa
     pré-moldada com a concertina em cima, os dois portões abertos e os
     dois de chapa fechados; os galpões de zinco, o telheiro, os
     contêineres e o caminhão atrás dos muros.

   A ESCALA (o dono, 28/09/2026: "essa cena aparentemente é muito
   grande, o novo cenário deve ser menor já que não são tantos bonecos
   nessa cena" — "precisa ser 30% da área proposta no último commit").
   No commit anterior 1 px do tabuleiro (1536 × 1024) era 1 unidade do
   mundo, 5,1 cm: o posto dava 79 × 53 m pra uns 40 bonecos. Agora é
   `ESCALA` = √0,3 unidade por px (2,8 cm): o tabuleiro dá 43 × 29 m, 30%
   da área, e é a escala das duas fotos — o ônibus de 12 m ocupa na
   briga o que ocupa na foto, e o PLANO é em px da foto: as posições são
   as da foto, e os spawns, as entradas e os postos da PM são os que o
   dono ajeitou no editor (dados/cenas_editadas.js). O motor da briga é o
   mesmo, em px: o corpo (7 px) vira 20 cm de raio, e a marcha (60 px/s),
   1,7 m/s — gente do tamanho da foto.

   As duas são palcos à parte, fora da cidade (a viagem é longe da
   praça): o cenário põe a peça num canto vazio do mundo quando a cena
   abre, e tira quando ela fecha. A peça é montada com o kit de peças
   detalhadas (detalhe3d.js) e juntada por material.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';
import * as K from './detalhe3d.js';
import { METRO } from './construtor3d.js';

const M = METRO;
export const TABULEIRO = { W: 1536, H: 1024, CEL: 8 };
/* 1 px do tabuleiro = ESCALA unidades do mundo (30% da área do 1:1) */
export const ESCALA = Math.sqrt(0.3);
const PXM = M / ESCALA;                 // px do tabuleiro por metro (~35,5)
const X = px => px / PXM;               // px → m
const PX = m => m * PXM;                // m → px
const PI = Math.PI;

/* =======================================================
   OS PLANOS (px da foto = px do tabuleiro)
   ======================================================= */
/* a caixa (px) do carro girado: cinco quadrados ao longo dele (a
   diagonal não vira um retângulo gordo) */
function caixasDoCarro(c) {
  const L = PX(c.tipo === 'hatch' ? 3.95 : 4.5), W = PX(1.8), [dx, dy] = c.dir, n = Math.hypot(dx, dy) || 1;
  const out = [];
  for (const t of [-0.4, -0.2, 0, 0.2, 0.4]) {
    const cx = c.x + dx / n * L * t, cy = c.y + dy / n * L * t, h = W * 0.5;
    out.push({ x0: cx - h, x1: cx + h, y0: cy - h, y1: cy + h });
  }
  return out;
}
/* O POSTO: o pátio de x 82 a 1448 e de y 22 a 885, a rodovia de 885 a 1135.
   `op.naEstrada` (a emboscada na rodovia da viagem, estrada3d.js): o
   carro que saía pra pista sai do plano — o ônibus entra no pátio por ali */
function planoDoPosto(op = {}) {
  const P = {
    nome: 'Posto', patio: { x0: 82, x1: 1448, y0: 22, y1: 885 }, pista: { y0: 885, y1: 1135 },
    muroEsq: { x: 78.5, y0: 12, y1: 872, portao: [385, 535] }, muroDir: { x: 1451.5, y0: 12, y1: 862 }, muroFundo: { y: 18.5, x0: 75, x1: 1455 },
    loja: { x0: 575, x1: 997, y0: 22, y1: 250, calcada: 262 },
    deposito: { x0: 997, x1: 1225, y0: 22, y1: 262 },
    ilha: { comp: 5.4, larg: 1.3 }, ilhas: [{ x: 604, y: 521 }, { x: 948, y: 521 }],
    onibus: { x: 815, y: 738, comp: 12, frente: -1, cor: '#efefeb', cor2: '#b3261e', cor3: '#1f2e44' },
    carros: op.naEstrada ? [] : [{ x: 1118, y: 860, dir: [0.53, 0.85], tipo: 'sedan', cor: '#c3c6ca' }],
    canteiro: { x0: 452, x1: 1078, y0: 828, y1: 884 }, poste: { x: 765, y: 858 },
    pneus: [[97, 292, 3], [97, 326, 4], [97, 360, 3], [470, 42, 3], [503, 40, 4], [536, 45, 2]],
    tambores: [[1436, 367, '#e0b83a'], [1436, 397, '#2f5f9e'], [100, 37, '#34465a'], [126, 44, '#2d3b4d']],
    carretel: { x: 88, y: 582 }, mangueiras: [[106, 637, '#8a2a22'], [538, 248, '#1a1a1a']],
    ralos: [[370, 390], [378, 712]]
  };
  const o = P.onibus, cC = PX(o.comp) / 2, cL = PX(2.55) / 2 + 6, il = P.ilha;
  P.solidos = [
    { x0: -400, x1: 86, y0: -400, y1: 880 },            // o muro da esquerda (e o que é de fora)
    { x0: 1444, x1: 2000, y0: -400, y1: 870 },          // o da direita
    { x0: -400, x1: 2000, y0: -400, y1: 25 },           // o do fundo
    { x0: 86, x1: 124, y0: 268, y1: 384 },              // os pneus no muro da esquerda
    { x0: 86, x1: 128, y0: 560, y1: 664 },              // o carretel e a mangueira
    { x0: 82, x1: 142, y0: 22, y1: 60 },                // os tambores do canto
    { x0: 450, x1: 556, y0: 22, y1: 66 },               // os pneus do fundo
    { x0: 571, x1: 1001, y0: 22, y1: 264 },             // a loja (com a calçada)
    { x0: 997, x1: 1228, y0: 22, y1: 94 },              // o fundo do depósito: o compressor, a bancada, o botijão
    { x0: 1206, x1: 1230, y0: 22, y1: 266 },            // a parede da direita do depósito
    { x0: 1146, x1: 1208, y0: 98, y1: 242 },            // a coluna de pneus do depósito
    { x0: 1416, x1: 1452, y0: 348, y1: 416 },           // os tambores da direita
    ...P.ilhas.map(p => ({ x0: p.x - PX(il.comp) / 2 - 8, x1: p.x + PX(il.comp) / 2 + 8, y0: p.y - PX(il.larg) / 2 - 6, y1: p.y + PX(il.larg) / 2 + 6 })),
    { x0: o.x - cC - 12, x1: o.x + cC + 4, y0: o.y - cL, y1: o.y + cL },
    ...P.carros.flatMap(caixasDoCarro)
  ];
  P.cena = {
    id: 'emb-posto@3d', base: 'emb-posto', nome: 'Posto', local: 'No posto, na parada da caravana',
    espalharBonde: 'visitante', semFugaPorMinoria: true, marchaAoInimigo: true, semRecuoPM: true,
    saida: { perto: 'Voltar pro ônibus', longe: 'Ônibus (leve o líder)', feito: 'a torcida voltou pro ônibus e a caravana seguiu',
             dica: 'Leve o líder de volta pro ônibus.' },
    /* os do editor do dono (dados/cenas_editadas.js), na foto */
    spawns: [
      { id: 'mandante1', rot: 'ELES, PELA PISTA', lado: 'mandante', x: 200, y: 820, entrada: 'ent_mandante' },
      { id: 'visitante1', rot: 'NÓS, NAS BOMBAS', lado: 'visitante', x: 700, y: 640, jogador: true, entrada: 'ent_visitante' },
      { id: 'visitante2', rot: 'NÓS, NO ÔNIBUS', lado: 'visitante', x: 830, y: 700, entrada: 'ent_visitante' }
    ],
    entradas: [
      { id: 'ent_mandante', rot: 'PISTA', lado: 'mandante', x: 260, y: 900, raio: 48, dir: [-1, 0] },
      { id: 'ent_visitante', rot: 'ÔNIBUS', lado: 'visitante', x: 1276, y: 880, raio: 48, dir: [1, 0] }
    ],
    pmPostos: [{ x: 120, y: 500 }, { x: 1380, y: 880 }],
    /* A FUGA NO MEIO DA PISTA (o dono, 06/10/2026: "somente no meio da
       rua"), as do jogo de feed: o eixo da rodovia nas duas pontas */
    fugas: [{ x: 20, y: 975, raio: 34 }, { x: 1516, y: 975, raio: 34 }]
  };
  return P;
}
/* A ESTRADA: a pista de y 385 a 642, as calçadas até os muros (em cima
   em 155, embaixo em 865), com o portão aberto de cada lado e o de
   chapa fechado do lado dele */
function planoDaEstrada(op = {}) {
  const P = {
    nome: 'Estrada', pista: { y0: 385, y1: 642 }, calcadas: [{ y0: 158, y1: 385 }, { y0: 642, y1: 862 }],
    muroCima: { y: 155, trechos: [[-2200, 665], [895, 3700]], chapa: [805, 895], vao: [665, 805] },
    muroBaixo: { y: 865, trechos: [[-2200, 685], [880, 3700]], chapa: [685, 790], vao: [790, 880] },
    onibus: { x: 785, y: 513, comp: 12.4, frente: 1, cor: '#2f5d49', cor2: '#d9c24a', cor3: '#1d3a2d' },
    carros: [{ x: 728, y: 613, dir: [1, 0], tipo: 'sedan', cor: '#eceeef' }, { x: 906, y: 619, dir: [-1, 0], tipo: 'hatch', cor: '#e2e4e5' }]
  };
  const o = P.onibus, cC = PX(o.comp) / 2;
  P.solidos = [
    { x0: -400, x1: 665, y0: -400, y1: 161 }, { x0: 805, x1: 2000, y0: -400, y1: 161 },
    { x0: -400, x1: 790, y0: 859, y1: 1400 }, { x0: 880, x1: 2000, y0: 859, y1: 1400 },
    { x0: o.x - cC - 4, x1: o.x + cC + 14, y0: 452, y1: 578 },
    ...P.carros.flatMap(caixasDoCarro)
  ];
  P.cena = {
    id: 'emb-onibus@3d', base: 'emb-onibus', nome: 'Estrada', local: 'Na estrada, pista fechada',
    espalharBonde: 'visitante', semFugaPorMinoria: true, marchaAoInimigo: true, semRecuoPM: true,
    saida: { perto: 'Voltar pro ônibus', longe: 'Ônibus (leve o líder)', feito: 'a torcida voltou pro ônibus e a caravana seguiu',
             dica: 'Leve o líder de volta pro ônibus.' },
    spawns: [
      { id: 'mandante1', rot: 'ELES, NA PISTA', lado: 'mandante', x: 150, y: 584, entrada: 'ent_mandante' },
      { id: 'visitante1', rot: 'NÓS, NO ÔNIBUS', lado: 'visitante', x: 687, y: 569, jogador: true, entrada: 'ent_visitante' },
      { id: 'visitante2', rot: 'NÓS, ATRÁS', lado: 'visitante', x: 850, y: 600, entrada: 'ent_visitante' }
    ],
    entradas: [
      { id: 'ent_mandante', rot: 'PISTA OESTE', lado: 'mandante', x: 40, y: 584, raio: 48, dir: [-1, 0] },
      { id: 'ent_visitante', rot: 'PISTA LESTE', lado: 'visitante', x: 1496, y: 584, raio: 48, dir: [1, 0] }
    ],
    pmPostos: [{ x: 400, y: 470 }, { x: 1100, y: 540 }],
    /* (a fuga no meio da pista, nas duas pontas: as do jogo de feed) */
    fugas: [{ x: 20, y: 512, raio: 34 }, { x: 1516, y: 512, raio: 34 }]
  };
  return P;
}
export const PLANOS = { 'emb-posto': planoDoPosto, 'emb-onibus': planoDaEstrada };

/* =======================================================
   AS PEÇAS DO CHÃO (em metros)
   ======================================================= */
/* O PÁTIO DE PLACAS: uma placa de `lado` m por quadrado do retângulo, cada
   uma com um quarto sorteado da folha de concreto (2 × 2 placas) e girado:
   a repetição some */
function placas(r, lado, y, mat, rnd) {
  const pos = [], uv = [], idx = [];
  let n = 0;
  for (let z = r.z0; z < r.z1 - 0.01; z += lado) for (let x = r.x0; x < r.x1 - 0.01; x += lado) {
    const x1 = Math.min(r.x1, x + lado), z1 = Math.min(r.z1, z + lado);
    const q = Math.floor(rnd() * 4), u0 = (q % 2) * 0.5, v0 = Math.floor(q / 2) * 0.5, fu = (x1 - x) / lado * 0.5, fv = (z1 - z) / lado * 0.5;
    const cantos = [[u0, v0 + fv], [u0 + fu, v0 + fv], [u0 + fu, v0], [u0, v0]];
    const gira = fu > 0.499 && fv > 0.499 ? Math.floor(rnd() * 4) : 0;
    pos.push(x, y, z, x1, y, z, x1, y, z1, x, y, z1);
    for (let k = 0; k < 4; k++) uv.push(...cantos[(k + gira) % 4]);
    idx.push(n, n + 3, n + 2, n, n + 2, n + 1);
    n += 4;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(n).fill(0).flatMap(() => [0, 1, 0]), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return new THREE.Mesh(g, mat);
}
/* A FAIXA PINTADA ao longo dos pontos (m, [x, z]), com a tinta gasta
   repetindo a cada 2 m */
export function faixaPintada(pts, larg, mat, y = 0.03) {
  const pos = [], uv = [], idx = [];
  let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const nx = -dz * larg / 2, nz = dx * larg / 2;
    if (i > 0) acc += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    pos.push(x + nx, y, z + nz, x - nx, y, z - nz); uv.push(acc / 2, 1, acc / 2, 0);
    if (i > 0) { const k = 2 * (i - 1); idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return new THREE.Mesh(g, mat);
}
/* a curva de Bézier (px) em pontos (m) */
function curva(p0, c, p1, n = 18) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, d = t * t; out.push([X(a * p0[0] + b * c[0] + d * p1[0]), X(a * p0[1] + b * c[1] + d * p1[1])]); }
  return out;
}
/* O CHÃO DE LONGE: a terra até o horizonte, com a cor mudando devagar
   por vértice (a mancha de capim, a terra mais escura); fora da junção */
export function chaoDeLonge(tam, seg, rnd) {
  const g = new THREE.PlaneGeometry(tam, tam, seg, seg); g.rotateX(-PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, cor = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    uv.setXY(i, x / 4, -z / 4);
    const n = 0.5 + 0.25 * Math.sin(x * 0.021 + 1.3) * Math.cos(z * 0.017) + 0.25 * Math.sin((x + z) * 0.043 + 0.7) * Math.sin(z * 0.031 - x * 0.012);
    const verde = Math.max(0, Math.sin(x * 0.009 + z * 0.013) * 0.6 + (rnd() - 0.5) * 0.35);
    const k = 0.84 + n * 0.22;
    cor.push(k * (1 - 0.2 * verde), k * (1 - 0.03 * verde), k * (1 - 0.34 * verde));
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: K.TEX.terra(), vertexColors: true }));
  m.name = 'chão de longe da caravana';
  return m;
}
/* o decalque solto no chão (a mancha, a trilha, a rachadura, a areia) */
const decal = (g, chave, tex, w, d, x, z, ry, y = 0.035, cor = '#ffffff', op = 1) => g.add(K.folhaNoChao(w, d, K.decalque(chave, tex, cor, op), X(x), y, X(z), ry));
/* a seta pintada: `dir` é o rumo no tabuleiro ([dx, dy]) */
const setaNoChao = (g, x, y, dir, comp, larg) => g.add(K.folhaNoChao(X(larg), X(comp), K.decalque('seta', K.TEX.seta(), '#f4f2ea', 0.9), X(x), 0.036, X(y), Math.atan2(-dir[0], -dir[1])));
/* O POSTE DA REDE (o de concreto, com a cruzeta e os isoladores); os fios
   saem dos isoladores (`userData.fios`, no grupo) */
export function posteDeRede(alt = 9) {
  const g = new THREE.Group();
  g.add(K.cilindro(0.17, 0.1, alt, K.fosco('#aaa79f'), 6));
  g.add(K.caixa(0.12, 0.12, 2.0, K.pintado('madeiraCruzeta', K.TEX.madeira(), { cor: '#8a6a4a' }), 0, alt - 0.7, 0));
  g.userData.fios = [];
  for (const dz of [-0.9, 0, 0.9]) { g.add(K.cilindro(0.045, 0.035, 0.16, K.fosco('#e8e6e0'), 6, 0, alt - 0.58, dz)); g.userData.fios.push([0, alt - 0.44, dz]); }
  g.add(K.caixa(0.5, 0.6, 0.45, K.fosco('#8d9194'), 0.3, alt - 2.3, 0));
  g.add(K.sombra(0.5, 0.5, 0, 0, 0, 0.4, true));
  return g;
}
/* os fios de poste em poste (a barriga no meio), em linhas */
export function fiosEntre(postes, cai = 0.7) {
  const pts = [];
  for (let i = 0; i + 1 < postes.length; i++) {
    const a = postes[i], b = postes[i + 1];
    for (let k = 0; k < 3; k++) {
      const pa = a.userData.fios[k], pb = b.userData.fios[k];
      const A = [a.position.x + pa[0], pa[1], a.position.z + pa[2]], B = [b.position.x + pb[0], pb[1], b.position.z + pb[2]];
      let ant = A;
      for (let s = 1; s <= 10; s++) {
        const t = s / 10, p = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - cai * 4 * t * (1 - t), A[2] + (B[2] - A[2]) * t];
        pts.push(...ant, ...p); ant = p;
      }
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#2b2b2b' }));
}
/* A CERCA DE ARAME (os mourões e os quatro fios), ao longo de x */
export function cerca(x0, x1, z, rnd, alt = 1.3) {
  const g = new THREE.Group(), md = K.pintado('madeiraMourao', K.TEX.madeira(), { cor: '#7a6048' }), pts = [];
  for (let x = x0; x <= x1; x += 2.6) g.add(K.caixa(0.1, alt + (rnd() - 0.5) * 0.15, 0.1, md, x + (rnd() - 0.5) * 0.2, 0, z + (rnd() - 0.5) * 0.12, rnd()));
  for (let k = 0; k < 4; k++) { const y = 0.3 + k * (alt - 0.4) / 3; pts.push(x0, y, z, x1, y, z); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#77736b' })));
  return g;
}
/* o capim espalhado num retângulo (m) */
export function capim(g, r, n, rnd, alt = 0.5) {
  for (let i = 0; i < n; i++) g.add(K.em(K.touceira(alt * (0.6 + rnd() * 0.8), rnd), r.x0 + rnd() * (r.x1 - r.x0), -0.02, r.z0 + rnd() * (r.z1 - r.z0)));
}
/* a ilhota de meio-fio (o canteiro): o contorno de ponta redonda, deitado */
function ilhota(comp, larg, alt, matTopo, matLado) {
  const r = larg / 2, c = [[-comp / 2 + r, -r], [comp / 2 - r, -r], [comp / 2, 0, comp / 2, -r], [comp / 2 - r, r, comp / 2, r], [-comp / 2 + r, r], [-comp / 2, 0, -comp / 2, r], [-comp / 2 + r, -r, -comp / 2, -r]];
  const g = new THREE.Group();
  const lado = K.perfil(c, alt, matLado, 0, 8); lado.rotation.x = -PI / 2; lado.position.y = alt / 2; g.add(lado);
  const topo = K.perfil(c, 0.01, matTopo, 0, 8); topo.rotation.x = -PI / 2; topo.position.y = alt + 0.004;
  const uv = topo.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3);
  g.add(topo);
  return g;
}

/* =======================================================
   A LOJA E O DEPÓSITO DO POSTO (como na foto: a loja de 11,9 × 6,4 m,
   a vitrine no meio da frente, as prateleiras do fundo e da esquerda, a
   gôndola do meio, as geladeiras, o balcão com o caixa e os dois
   quartinhos da direita; o depósito aberto do lado)
   ======================================================= */
function lojaDoPosto(rnd) {
  const g = new THREE.Group(), w = X(422), d = X(228), h = 3.5, e = 0.2;
  const reb = K.pintado('rebocoLoja', K.TEX.reboco(), { cor: '#f1eee8' }), barr = K.fosco('#8c8e90'), prat = K.pintado('prateleiras', K.TEX.prateleiras());
  const parede = (x0, x1, z0, z1, y0 = 0, y1 = h) => g.add(K.caixaUV(x1 - x0, y1 - y0, z1 - z0, reb, 2, (x0 + x1) / 2, y0, (z0 + z1) / 2));
  const barrado = (x0, x1, z0, z1) => g.add(K.caixa(x1 - x0 + 0.02, 0.5, z1 - z0 + 0.02, barr, (x0 + x1) / 2, 0, (z0 + z1) / 2));
  /* as paredes de fora e o barrado cinza */
  parede(0, w, 0, e); parede(0, e, 0, d); parede(w - e, w, 0, d);
  barrado(0, w, 0, e); barrado(0, e, 0, d); barrado(w - e, w, 0, d);
  /* a frente: a parede dos dois lados, a vitrine no meio, a porta dupla */
  const v0 = X(655 - 575), v1 = X(830 - 575), hv = 2.7, pc = X(795 - 575);
  parede(0, v0, d - e, d); parede(v1, w, d - e, d); parede(v0, v1, d - e, d, hv, h);
  barrado(0, v0, d - e, d); barrado(v1, w, d - e, d);
  const alu = K.brilho('#c3c7ca', 60), vid = K.vidro('#8fb4c4', 0.3);
  g.add(K.caixa(v1 - v0, 0.3, 0.14, K.fosco('#9ea2a5'), (v0 + v1) / 2, 0, d - e / 2));
  g.add(K.caixa(v1 - v0, hv - 0.3, 0.02, vid, (v0 + v1) / 2, 0.3, d - e / 2));
  for (let i = 0; i <= 4; i++) g.add(K.caixa(0.07, hv, 0.12, alu, v0 + (v1 - v0) * i / 4, 0, d - e / 2));
  g.add(K.caixa(v1 - v0, 0.07, 0.12, alu, (v0 + v1) / 2, hv - 0.07, d - e / 2));
  g.add(K.caixa(1.9, 2.3, 0.1, alu, pc, 0, d - e / 2 + 0.03));
  for (const s of [-1, 1]) { g.add(K.caixa(0.86, 2.18, 0.03, K.vidro('#8fb4c4', 0.38), pc + s * 0.45, 0.04, d - e / 2 + 0.08)); g.add(K.caixa(0.03, 0.5, 0.05, K.brilho('#d7dadc', 80), pc + s * 0.08, 0.9, d - e / 2 + 0.11)); }
  /* a testeira vermelha com o letreiro de ponta a ponta */
  g.add(K.caixa(w + 0.3, 0.85, 0.3, K.brilho('#b3261e', 40), w / 2, h - 0.85, d - 0.05));
  g.add(K.em(K.painel(w * 0.6, 0.55, K.pintado('letLoja', K.TEX.letreiro('CONVENIÊNCIA  ·  24 HORAS', '#b3261e', '#ffffff', 1024, 96))), w / 2, h - 0.43, d + 0.106));
  /* os dois quartinhos da direita (o de cima e o de baixo), com as portas */
  const qx = X(893 - 575), qz = X(120 - 22), md = K.pintado('madeiraPorta', K.TEX.madeira(), { cor: '#a8784f' });
  parede(qx - 0.06, qx + 0.06, e, 0.8); parede(qx - 0.06, qx + 0.06, 1.7, 3.5); parede(qx - 0.06, qx + 0.06, 4.4, d - e);
  parede(qx - 0.06, qx + 0.06, 0.8, 1.7, 2.1, h); parede(qx - 0.06, qx + 0.06, 3.5, 4.4, 2.1, h);
  g.add(K.caixa(0.05, 2.1, 0.88, md, qx, 0, 1.25)); g.add(K.caixa(0.05, 2.1, 0.88, md, qx, 0, 3.95));
  parede(qx, w - e, qz - 0.06, qz + 0.06);
  /* o piso: a cerâmica da loja e o ladrilho dos quartinhos */
  g.add(K.chao(qx - e, d - 2 * e, K.pintado('ceramica', K.TEX.ceramica()), 1.6, (e + qx) / 2, 0.02, d / 2));
  g.add(K.chao(w - e - qx, d - 2 * e, K.pintado('ladrilho', K.TEX.ladrilho()), 1.6, (qx + w - e) / 2, 0.02, d / 2));
  /* a prateleira do fundo (de ponta a ponta) e a da esquerda */
  const f0 = X(620 - 575), f1 = X(840 - 575);
  g.add(K.caixa(f1 - f0, 1.9, 0.5, K.fosco('#d5d6d4'), (f0 + f1) / 2, 0.02, e + 0.25));
  g.add(K.em(K.painel(f1 - f0 - 0.1, 1.75, prat), (f0 + f1) / 2, 1.0, e + 0.506));
  g.add(K.caixa(0.5, 1.9, X(190 - 60), K.fosco('#d5d6d4'), e + 0.25, 0.02, X((60 + 190) / 2 - 22)));
  g.add(K.em(K.painel(X(190 - 60) - 0.1, 1.75, prat), e + 0.506, 1.0, X((60 + 190) / 2 - 22), PI / 2));
  /* a gôndola do meio, dos dois lados, com o topo cheio */
  const gx0 = X(665 - 575), gx1 = X(805 - 575), gz = X(137 - 22);
  g.add(K.caixa(gx1 - gx0, 1.5, 0.9, K.fosco('#d5d6d4'), (gx0 + gx1) / 2, 0.02, gz));
  for (const s of [-1, 1]) g.add(K.em(K.painel(gx1 - gx0 - 0.1, 1.35, prat), (gx0 + gx1) / 2, 0.8, gz + s * 0.452, s > 0 ? 0 : PI));
  g.add(K.folhaNoChao(0.88, gx1 - gx0 - 0.05, K.pintado('gondolaTopo', K.TEX.gondolaTopo()), (gx0 + gx1) / 2, 1.525, gz, PI / 2));
  /* as geladeiras de vidro (acesas, de frente pra loja) */
  const gz0 = X(55 - 22), gz1 = X(160 - 22), gxg = X(866 - 575);
  g.add(K.caixa(0.8, 2.15, gz1 - gz0, K.fosco('#e2e4e4'), gxg, 0.02, (gz0 + gz1) / 2));
  g.add(K.em(K.painel(gz1 - gz0 - 0.1, 1.9, K.pintado('geladeira', K.TEX.geladeira(), { brilho: 60 })), gxg - 0.405, 1.1, (gz0 + gz1) / 2, -PI / 2));
  /* o balcão com o caixa, a máquina de café e a vitrine de cigarro */
  const b0 = X(590 - 575), b1 = X(740 - 575), bz = X(207 - 22);
  g.add(K.caixa(b1 - b0, 1.0, 0.7, K.pintado('madeiraBalcao', K.TEX.madeira(), { cor: '#8b6446' }), (b0 + b1) / 2, 0.02, bz));
  g.add(K.caixa(b1 - b0 + 0.05, 0.05, 0.75, K.brilho('#2a2826', 60), (b0 + b1) / 2, 1.02, bz));
  g.add(K.caixa(0.45, 0.3, 0.35, K.fosco('#1d1e20'), b1 - 0.6, 1.07, bz)); g.add(K.caixa(0.32, 0.24, 0.04, K.luz('#8fd4ff'), b1 - 0.6, 1.3, bz - 0.12));
  g.add(K.caixa(0.36, 0.5, 0.36, K.fosco('#2b2d30'), b0 + 0.5, 1.07, bz));
  g.add(K.caixa(1.8, 1.7, 0.35, K.fosco('#d8d4cc'), (b0 + b1) / 2 - 0.4, 0.02, bz - 1.05));
  for (let k = 0; k < 4; k++) g.add(K.caixa(1.7, 0.2, 0.04, K.fosco(['#c8342b', '#1f5aa8', '#e0a52a', '#f0ede4'][k]), (b0 + b1) / 2 - 0.4, 0.35 + k * 0.35, bz - 1.05 + 0.19));
  /* os quartinhos: o de cima com o freezer e a estante; o de baixo com o freezer branco e a pia */
  g.add(K.em(K.freezer('#1f5aa8'), (qx + w) / 2 - 0.2, 0.02, e + 0.6));
  g.add(K.em(K.estanteDeposito(1.4, rnd), w - e - 0.35, 0.02, 1.7, PI / 2));
  g.add(K.em(K.freezer('#c8342b'), (qx + w) / 2 + 0.2, 0.02, d - e - 0.55));
  g.add(K.caixa(0.6, 0.85, 0.5, K.fosco('#d8d2c6'), w - e - 0.35, 0.02, qz + 0.7));
  /* o teto: a laje, a manta, a platibanda, a caixa d'água, os condensadores */
  const lj = h + 0.16, pl = 0.5;
  g.add(K.caixa(w, 0.16, d, K.fosco('#dcd9d2'), w / 2, h, d / 2));
  g.add(K.chao(w - 0.3, d - 0.3, K.pintado('laje', K.TEX.laje()), 4, w / 2, lj + 0.004, d / 2));
  for (const s of [0, 1]) { parede(-0.075, w + 0.075, s ? d : -0.15, s ? d + 0.15 : 0, lj, lj + pl); parede(s ? w : -0.15, s ? w + 0.15 : 0, 0, d, lj, lj + pl); }
  for (const [ax, az] of [[w * 0.2, d * 0.3], [w * 0.62, d * 0.25]]) {
    g.add(K.caixa(0.9, 0.7, 0.4, K.fosco('#e7e7e4'), ax, lj, az));
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16), K.fosco('#3a3c3e')); v.rotation.x = PI / 2; v.position.set(ax, lj + 0.35, az + 0.21); g.add(v);
    g.add(K.sombra(0.9, 0.4, ax, az + 0.3, 0, 0.3).translateY(lj));
  }
  g.add(K.em(K.caixaDagua(0.7), w * 0.82, lj, d * 0.42));
  g.add(K.sombra(1.4, 1.4, w * 0.82 + 0.35, d * 0.42 + 0.35, 0, 0.3, true).translateY(lj));
  g.add(K.sombraDeParede(w, 0.6, 0.22).translateX(w / 2).translateY(lj).translateZ(0.01));
  /* a calçada da frente (o degrau de concreto), a lixeira, o balde azul */
  const cz = K.pintado('concretoCalcada', K.TEX.concreto(), { cor: '#d6d1c7' });
  g.add(K.caixaUV(w + 0.1, 0.1, X(262 - 250), cz, 3, w / 2, 0, d + X(12) / 2));
  g.add(K.em(K.lixeira('#2f6f3a'), X(628 - 575), 0.1, d + 0.3, PI / 2));
  g.add(K.cilindro(0.16, 0.18, 0.32, K.brilho('#2b62b0', 40), 12, X(598 - 575), 0.1, d + 0.18));
  /* as sombras no pé das paredes de fora */
  g.add(K.sombraDeParede(w, 1.0, 0.3).translateX(w / 2).translateZ(d + X(12) + 0.01));
  const sl = K.sombraDeParede(d, 0.9, 0.3); sl.rotation.y = -PI / 2; sl.position.set(-0.01, 0, d / 2); g.add(sl);
  return g;
}
function depositoDoPosto(rnd) {
  const g = new THREE.Group(), w = X(228), d = X(240), h = 2.6, e = 0.2;
  const reb = K.pintado('rebocoDep', K.TEX.reboco(), { cor: '#e6e3dc' });
  g.add(K.caixaUV(w, h, e, reb, 2, w / 2, 0, e / 2));
  g.add(K.caixaUV(e, h, d, reb, 2, w - e / 2, 0, d / 2));
  g.add(K.caixa(w + 0.06, 0.06, e + 0.06, K.fosco('#c9c6bf'), w / 2, h, e / 2));
  g.add(K.caixa(e + 0.06, 0.06, d + 0.06, K.fosco('#c9c6bf'), w - e / 2, h, d / 2));
  g.add(K.chao(w - e, d - e, K.pintado('concretoDep', K.TEX.concreto(), { cor: '#cfcac1' }), 3, (w - e) / 2, 0.022, (d + e) / 2));
  /* o telheiro de zinco no fundo (a frente mais baixa) */
  const tz = 1.9, t = K.chao(w - e, tz, K.pintado('zincoTelheiro', K.TEX.zinco(0.5), { cor: '#c9cdd0', lados: true }), 1.05, (w - e) / 2, h - 0.25, e + tz / 2, 0, 3);
  t.rotation.x = 0.12; g.add(t);
  for (const x of [0.4, (w - e) / 2, w - e - 0.4]) g.add(K.caixa(0.06, 0.06, tz, K.fosco('#6b6f72'), x, h - 0.42, e + tz / 2));
  /* o compressor (o tanque deitado, o motor, a mangueira) */
  const cx = X(1018 - 997), cz = X(68 - 22);
  const tq = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.3, 16), K.brilho('#2b5fa0', 40)); tq.rotation.z = PI / 2; tq.position.set(cx + 0.2, 0.42, cz); g.add(tq);
  g.add(K.caixa(0.45, 0.38, 0.38, K.fosco('#c8342b'), cx - 0.05, 0.72, cz));
  for (const s of [-1, 1]) g.add(K.caixa(0.06, 0.16, 0.3, K.fosco('#4a4d50'), cx + 0.2 + s * 0.5, 0, cz));
  g.add(K.tubo([[cx + 0.7, 0.55, cz + 0.2], [cx + 1.1, 0.2, cz + 0.8], [cx + 0.5, 0.03, cz + 1.2], [cx + 0.1, 0.03, cz + 0.9]], 0.02, K.fosco('#1a1a1a'), 12, 4));
  g.add(K.sombra(1.4, 0.7, cx + 0.2, cz, 0, 0.45));
  /* a bancada com as ferramentas, o esmeril e o painel de ferramenta na parede */
  const bx = X(1095 - 997), bz = X(65 - 22);
  g.add(K.caixa(2.2, 0.08, 0.8, K.pintado('madeiraBancada', K.TEX.madeira(), { cor: '#a07a55' }), bx, 0.9, bz));
  for (const [ax, az] of [[-1, -0.3], [1, -0.3], [-1, 0.3], [1, 0.3]]) g.add(K.caixa(0.06, 0.9, 0.06, K.fosco('#3a3c3e'), bx + ax, 0, bz + az));
  g.add(K.caixa(0.3, 0.25, 0.2, K.fosco('#2f6f3a'), bx + 0.7, 0.98, bz - 0.1));
  for (let i = 0; i < 6; i++) g.add(K.caixa(0.3, 0.04, 0.05, K.fosco(['#c8342b', '#1f5aa8', '#e0a52a'][i % 3]), bx - 0.8 + i * 0.25, 0.98, bz + 0.15));
  g.add(K.caixa(1.6, 1.0, 0.03, K.fosco('#5f6a6f'), bx, 1.3, e + 0.02));
  g.add(K.sombra(2.2, 0.8, bx, bz, 0, 0.4));
  /* o botijão vermelho, a mangueira enrolada no chão */
  g.add(K.cilindro(0.16, 0.16, 0.7, K.brilho('#c8342b', 40), 12, X(1168 - 997), 0.022, X(72 - 22)));
  g.add(K.cilindro(0.06, 0.06, 0.12, K.fosco('#9ea2a5'), 8, X(1168 - 997), 0.72, X(72 - 22)));
  g.add(K.em(K.mangueiraNoChao('#1a1a1a'), X(1110 - 997), 0.022, X(125 - 22)));
  /* a coluna de pneus da direita (quatro pilhas) */
  for (const [y, n] of [[120, 3], [155, 4], [190, 3], [224, 2]]) g.add(K.em(K.pilhaDePneus(n, 0.42, rnd), X(1172 - 997), 0.022, X(y - 22)));
  /* as sombras no pé das paredes, por dentro */
  g.add(K.sombraDeParede(w - e, 0.8, 0.3).translateX((w - e) / 2).translateZ(e));
  const sd = K.sombraDeParede(d - e, 0.8, 0.3); sd.rotation.y = -PI / 2; sd.position.set(w - e, 0, (d + e) / 2); g.add(sd);
  return g;
}

/* =======================================================
   A MONTAGEM DO POSTO (em m: x = px / PXM, z = y / PXM)
   ======================================================= */
function montarPosto(g, P, rnd, op = {}) {
  const pt = (o, x, y, ry = 0, alt = 0) => { o.position.set(X(x), alt, X(y)); o.rotation.y = ry; g.add(o); return o; };
  const pa = P.patio;
  /* O PÁTIO: as placas de 3 m, de muro a muro e do fundo até a pista */
  g.add(placas({ x0: X(pa.x0 - 8), x1: X(pa.x1 + 8), z0: X(pa.y0 - 4), z1: X(pa.y1) }, 3, 0.02, K.pintado('concretoPatio', K.TEX.concreto(), { cor: '#e6e1d8' }), rnd));
  /* A RODOVIA: o asfalto, a borda, a faixa da mão e o acostamento do outro lado */
  const pz0 = X(P.pista.y0), pz1 = X(P.pista.y1), px0 = X(-2200), px1 = X(3700);
  g.add(K.chao(px1 - px0, pz1 - pz0, K.pintado('asfalto', K.TEX.asfalto()), 4, (px0 + px1) / 2, 0.005, (pz0 + pz1) / 2));
  g.add(K.chao(px1 - px0, 2.2, K.pintado('acostamento', K.TEX.terra(), { cor: '#d8cdb8' }), 4, (px0 + px1) / 2, -0.04, pz1 + 1.1));
  const tinta = K.decalque('faixa', K.TEX.gasta(), '#f1efe6', 0.95), amarela = K.decalque('faixaAmarela', K.TEX.gasta(), '#e3b43a', 0.95);
  g.add(faixaPintada([[px0, pz0 + 0.3], [px1, pz0 + 0.3]], 0.12, tinta, 0.012));
  g.add(faixaPintada([[px0, pz1 - 0.3], [px1, pz1 - 0.3]], 0.12, tinta, 0.012));
  for (let x = px0; x < px1; x += 8) g.add(faixaPintada([[x, (pz0 + pz1) / 2 - 0.08], [x + 3, (pz0 + pz1) / 2 - 0.08]], 0.12, amarela, 0.012));
  for (let x = px0; x < px1; x += 8) g.add(faixaPintada([[x, (pz0 + pz1) / 2 + 0.08], [x + 3, (pz0 + pz1) / 2 + 0.08]], 0.12, amarela, 0.012));
  for (const [x, z, w, d] of [[180, 960, 3.2, 1.6], [1250, 1060, 2.4, 1.8], [2100, 950, 4, 1.4], [-600, 1040, 3, 2]]) g.add(K.chao(w, d, K.decalque('remendo', K.TEX.remendo(), '#ffffff', 0.9), 1, X(x), 0.011, X(z)));
  for (const [x, z, ry] of [[420, 1000, 0.3], [980, 950, 2.2], [1500, 1080, 1.1], [-300, 960, 0.8]]) decal(g, 'rachadura', K.TEX.rachadura(), 2.6, 2.6, x, z, ry, 0.013);
  /* O CANTEIRO com o poste (a ilhota de meio-fio entre o pátio e a pista) */
  const cn = P.canteiro;
  pt(ilhota(X(cn.x1 - cn.x0), X(cn.y1 - cn.y0), 0.15, K.pintado('canteiroTopo', K.TEX.concreto(), { cor: '#e2d6bd' }), K.fosco('#d6d2c8')), (cn.x0 + cn.x1) / 2, (cn.y0 + cn.y1) / 2);
  capim(g, { x0: X(cn.x0 + 40), x1: X(cn.x1 - 40), z0: X(cn.y0 + 12), z1: X(cn.y1 - 12) }, 26, rnd, 0.35);
  g.children.slice(-26).forEach(o => { o.position.y = 0.15; });
  pt(K.poste(7.5), P.poste.x, P.poste.y, -PI / 2, 0.15);
  /* OS MUROS DE BLOCO (e o portão de chapa fechado no da esquerda) */
  const me = P.muroEsq, md = P.muroDir, mf = P.muroFundo, H = 2.4;
  const muro = (x0, y0, x1, y1) => { const L = X(Math.hypot(x1 - x0, y1 - y0)); pt(K.muroDeBloco(L, H, 0.2), (x0 + x1) / 2, (y0 + y1) / 2, -Math.atan2(y1 - y0, x1 - x0)); };
  muro(me.x, me.y0, me.x, me.portao[0]); muro(me.x, me.portao[1], me.x, me.y1);
  pt(K.portaoDeChapa(X(me.portao[1] - me.portao[0]), 2.3), me.x, (me.portao[0] + me.portao[1]) / 2, PI / 2);
  muro(md.x, md.y0, md.x, md.y1);
  muro(mf.x0, mf.y, mf.x1, mf.y);
  /* A LOJA E O DEPÓSITO */
  pt(lojaDoPosto(rnd), P.loja.x0, P.loja.y0);
  pt(depositoDoPosto(rnd), P.deposito.x0, P.deposito.y0);
  pt(K.pneuEmPe(0.4), 1003, 224, 0.4);
  /* AS ILHAS DE BOMBA */
  for (const il of P.ilhas) pt(K.ilhaDeBombas(P.ilha.comp, P.ilha.larg, 2), il.x, il.y);
  /* O ÔNIBUS DA CARAVANA E O CARRO SAINDO PRA PISTA */
  const o = P.onibus;
  if (!op.semOnibus) pt(K.onibus({ comp: o.comp, cor: o.cor, cor2: o.cor2, cor3: o.cor3, itinerario: 'FRETADO · CARAVANA' }), o.x, o.y, o.frente > 0 ? 0 : PI);
  for (const c of P.carros) pt(K.carro({ tipo: c.tipo, cor: c.cor }), c.x, c.y, -Math.atan2(c.dir[1], c.dir[0]));
  /* OS MIÚDOS: os pneus, os tambores, o carretel, as mangueiras, os ralos */
  for (const [x, y, n] of P.pneus) pt(K.pilhaDePneus(n, 0.45, rnd), x, y, 0, 0.02);
  for (const [x, y, cor] of P.tambores) pt(K.tambor(cor), x, y, rnd() * PI, 0.02);
  pt(K.carretel(), P.carretel.x, P.carretel.y, PI / 2, 0.02);
  for (const [x, y, cor] of P.mangueiras) pt(K.mangueiraNoChao(cor), x, y, rnd() * PI, 0.02);
  for (const [x, y] of P.ralos) g.add(K.folhaNoChao(0.72, 0.72, K.pintado('ralo', K.TEX.ralo()), X(x), 0.028, X(y)));
  /* A PINTURA DO PÁTIO (a tinta gasta): as duas retas, as curvas das
     mãos, as vagas do fundo e as três setas */
  const pinta = K.decalque('faixaPatio', K.TEX.gasta(), '#f2f0e8', 0.8);
  g.add(faixaPintada([[X(495), X(395)], [X(1045), X(395)]], 0.13, pinta));
  g.add(faixaPintada([[X(565), X(642)], [X(1040), X(642)]], 0.13, pinta));
  g.add(faixaPintada(curva([286, 818], [290, 470], [370, 425]), 0.13, pinta));
  g.add(faixaPintada(curva([1255, 818], [1250, 470], [1110, 398]), 0.13, pinta));
  g.add(faixaPintada(curva([322, 700], [360, 650], [470, 640]), 0.13, pinta));
  g.add(faixaPintada(curva([1085, 645], [1215, 660], [1250, 800]), 0.13, pinta));
  for (const x of [180, 272, 372, 470]) g.add(faixaPintada([[X(x), X(30)], [X(x), X(250)]], 0.12, pinta));
  setaNoChao(g, 882, 340, [-1, 0], 145, 44); setaNoChao(g, 228, 740, [0, 1], 110, 38); setaNoChao(g, 1312, 668, [0, -1], 140, 42);
  /* o óleo em volta das bombas, a marca de pneu de quem manobrou, as rachaduras, a areia no canto */
  for (const [x, y, s] of [[590, 455, 1.4], [562, 598, 1.1], [606, 588, 0.9], [930, 455, 1.2], [952, 592, 1.3], [880, 560, 0.8], [700, 470, 0.7], [1002, 604, 0.9], [640, 610, 0.6],
                           [300, 150, 1.1], [420, 110, 0.9], [1060, 180, 1.2], [1100, 700, 0.7], [470, 820, 0.8], [1330, 520, 0.9]]) decal(g, 'oleo', K.TEX.oleo(), s, s, x, y, rnd() * PI, 0.031, '#ffffff', 0.85);
  for (const [x, y, ry, l] of [[340, 330, 0.5, 9], [560, 300, -0.2, 8], [1180, 330, -0.6, 9], [1000, 460, 0.1, 7], [720, 620, 0.05, 8], [1250, 600, 1.2, 7], [300, 600, 1.4, 8], [880, 250, 0.0, 6]])
    decal(g, 'trilha', K.TEX.trilha(), l, 1.9, x, y, ry, 0.032, '#ffffff', 0.9);
  for (const [x, y, ry] of [[430, 300, 0.4], [300, 470, 1.9], [470, 780, 2.6], [1180, 640, 0.9], [1320, 300, 2.2], [690, 150, 1.2], [1380, 760, 0.3], [180, 640, 1.1]])
    decal(g, 'rachadura', K.TEX.rachadura(), 2.4, 2.4, x, y, ry, 0.033);
  for (const [x, y, s] of [[120, 830, 3], [1400, 120, 3.5], [130, 120, 2.6], [1420, 820, 2.8]]) decal(g, 'areiaSolta', K.TEX.areiaSolta(), s, s, x, y, rnd() * PI, 0.034, '#ffffff', 0.8);
  /* EM VOLTA: a terra com o capim e o mato; do outro lado da pista a
     cerca de arame, o pasto e os postes da rede */
  capim(g, { x0: X(-420), x1: X(70), z0: X(-60), z1: X(880) }, 110, rnd);
  capim(g, { x0: X(-300), x1: X(1840), z0: X(-420), z1: X(10) }, 150, rnd);
  capim(g, { x0: X(1462), x1: X(1900), z0: X(-60), z1: X(880) }, 90, rnd);
  capim(g, { x0: X(-2200), x1: X(3700), z0: X(1215), z1: X(1600) }, 260, rnd, 0.6);
  for (const [x, y, r] of [[-80, 120, 1.1], [-60, 700, 0.9], [-170, 450, 1.3], [1540, 200, 1.0], [1620, 600, 1.2], [300, -90, 1.0], [900, -70, 1.3], [1300, -100, 0.9], [40, 900, 0.8], [1500, 905, 0.9]])
    pt(K.arbusto(r, rnd), x, y, rnd() * PI);
  for (const [x, y, a] of [[-280, 300, 7], [-230, 820, 6], [620, -280, 8], [1180, -240, 6.5], [1760, 360, 7.5], [1800, 780, 6], [-700, -300, 9], [2200, -200, 8], [200, 1560, 7], [950, 1480, 6], [1600, 1600, 8]])
    pt(K.arvore(a, rnd), x, y, rnd() * PI);
  g.add(cerca(X(-2200), X(3700), X(1255), rnd));
  const postes = [];
  for (let x = -2000; x < 3700; x += 1064) postes.push(pt(posteDeRede(9), x, 1190, 0));
  g.add(fiosEntre(postes));
}

/* =======================================================
   A MONTAGEM DA ESTRADA
   ======================================================= */
function montarEstrada(g, P, rnd, op = {}) {
  const pt = (o, x, y, ry = 0, alt = 0) => { o.position.set(X(x), alt, X(y)); o.rotation.y = ry; g.add(o); return o; };
  const px0 = X(-2200), px1 = X(3700), pz0 = X(P.pista.y0), pz1 = X(P.pista.y1), pm = (pz0 + pz1) / 2;
  /* A PISTA: o asfalto, as bordas brancas (com o vão dos portões), a
     faixa amarela tracejada, os remendos e as rachaduras */
  g.add(K.chao(px1 - px0, pz1 - pz0, K.pintado('asfalto', K.TEX.asfalto()), 4, (px0 + px1) / 2, 0.005, pm));
  const tinta = K.decalque('faixa', K.TEX.gasta(), '#f1efe6', 0.95), amarela = K.decalque('faixaAmarela', K.TEX.gasta(), '#e3b43a', 0.95);
  for (const [a, b] of [[-2200, 640], [925, 3700]]) g.add(faixaPintada([[X(a), pz0 + 0.2], [X(b), pz0 + 0.2]], 0.13, tinta, 0.012));
  for (const [a, b] of [[-2200, 245], [660, 3700]]) g.add(faixaPintada([[X(a), pz1 - 0.2], [X(b), pz1 - 0.2]], 0.13, tinta, 0.012));
  for (let x = 260; x < 600; x += 45) g.add(faixaPintada([[X(x), pz1 - 0.2], [X(x + 22), pz1 - 0.2]], 0.13, tinta, 0.012));
  for (let x = 215 - 320 * 8; x < 3700; x += 320) g.add(faixaPintada([[X(x), pm], [X(x + 90), pm]], 0.14, amarela, 0.012));
  for (const [x0, y0, x1, y1] of [[280, 395, 370, 600], [455, 400, 595, 440], [1180, 398, 1265, 440], [425, 575, 525, 620], [-400, 420, -250, 560], [1900, 520, 2080, 630]])
    g.add(K.chao(X(x1 - x0), X(y1 - y0), K.decalque('remendo', K.TEX.remendo(), '#ffffff', 0.92), 1, X((x0 + x1) / 2), 0.011, X((y0 + y1) / 2)));
  for (const [x, y, ry] of [[330, 470, 0.4], [520, 600, 1.8], [150, 420, 2.4], [1320, 470, 0.9], [1050, 610, 2.1], [1450, 590, 0.2]]) decal(g, 'rachadura', K.TEX.rachadura(), 2.6, 2.6, x, y, ry, 0.013);
  for (const [x, y, s] of [[600, 470, 1.2], [1010, 430, 0.9], [380, 520, 0.8], [1240, 600, 1.0]]) decal(g, 'oleo', K.TEX.oleo(), s, s, x, y, rnd() * PI, 0.014, '#ffffff', 0.7);
  /* AS CALÇADAS: as placas de concreto cobertas de poeira, com o chão de
     terra no caminho de cada portão */
  const cal = K.pintado('concretoCalcada2', K.TEX.concreto(), { cor: '#e7d6b5' });
  for (const c of P.calcadas) g.add(placas({ x0: px0, x1: px1, z0: X(c.y0), z1: X(c.y1) }, 3, 0.02, cal, rnd));
  const terra = K.pintado('terraPortao', K.TEX.areia(), { cor: '#e2cfa8' });
  g.add(K.chao(X(140), X(385 - 150), terra, 3, X(735), 0.026, X((150 + 385) / 2)));
  g.add(K.chao(X(90), X(1400 - 650), terra, 3, X(835), 0.026, X((650 + 1400) / 2)));
  for (let i = 0; i < 26; i++) {
    const cima = i % 2 === 0, x = -900 + rnd() * 3200, y = cima ? 170 + rnd() * 200 : 655 + rnd() * 195, s = 1.5 + rnd() * 3;
    decal(g, 'areiaSolta', K.TEX.areiaSolta(), s * 1.6, s, x, y, rnd() * PI, 0.03, '#ffffff', 0.85);
  }
  for (const [x, y] of [[735, 250], [740, 330], [835, 760], [830, 690]]) decal(g, 'areiaSolta', K.TEX.areiaSolta(), 4, 3, x, y, rnd() * PI, 0.03, '#ffffff', 0.9);
  for (const [x, y, ry] of [[200, 280, 1.2], [1100, 240, 0.4], [400, 780, 2.2], [1300, 720, 1.6]]) decal(g, 'rachadura', K.TEX.rachadura(), 2.2, 2.2, x, y, ry, 0.031);
  /* OS MUROS DE PLACA com a concertina, e os portões de chapa fechados */
  const H = 2.6;
  for (const mr of [P.muroCima, P.muroBaixo]) {
    for (const [a, b] of mr.trechos) {
      const L = X(b - a), m = pt(K.muroPremoldado(L, H), (a + b) / 2, mr.y);
      m.add(K.concertina(L, 0.3).translateY(H + 0.02));
    }
    const [a, b] = mr.chapa;
    pt(K.portaoDeChapa(X(b - a), 2.4, '#8f979a'), (a + b) / 2, mr.y);
  }
  /* ATRÁS DOS MUROS DE CIMA: o galpão de telha enferrujada (a porta pro
     terreiro do portão), o terreiro de terra, e o prédio de zinco com a
     parede azul e o ar-condicionado */
  pt(K.galpaoZinco(19, 13, 6, { cor: '#b9b4a8', corTelhado: '#caa28a', ferrugem: 0.9, porta: 4.5 }), 180, -250, PI / 2);
  pt(K.galpaoZinco(24, 12, 5.4, { cor: '#b7b3a8', ferrugem: 0.5, porta: 4 }), -1100, -130, 0);
  g.add(K.chao(X(700), X(560), K.pintado('terraTerreiro', K.TEX.terra(), { cor: '#d8c19a' }), 4, X(800), 0.018, X(-130)));
  pt(K.galpaoZinco(30, 12, 5.6, { cor: '#4d6fa3', ferrugem: 0.35, porta: 5, portaX: -6 }), 1700, -110, 0);
  g.add(K.caixa(0.9, 0.7, 0.4, K.fosco('#e7e7e4'), X(1200), 2.2, X(112)));
  pt(K.galpaoZinco(22, 14, 6.2, { cor: '#c4c0b6', ferrugem: 0.6, porta: 4 }), 2700, -160, 0);
  for (const [x, y, n] of [[560, -40, 3], [610, -95, 5]]) for (let k = 0; k < n; k++) g.add(K.caixa(1.2, 0.14, 1.0, K.pintado('madeiraPalete', K.TEX.madeira(), { cor: '#b08a60' }), X(x), k * 0.15, X(y), 0.3 + (rnd() - 0.5) * 0.1));
  pt(K.caixaDagua(0.75), 1000, -60);
  pt(K.pilhaDePneus(3, 0.4, rnd), 920, -100);
  pt(K.carro({ tipo: 'hatch', cor: '#7c2a24' }), 960, -300, 0.4);
  /* ATRÁS DOS MUROS DE BAIXO: o telheiro comprido com os contêineres e
     os caixotes, o terreiro do portão, o caminhão, o galpão da direita */
  pt(K.telheiro(X(690), 5, 3.2, { ferrugem: 0.7 }), 345, 980);
  pt(K.conteiner('#6b7a86'), 380, 1070, PI / 2);
  pt(K.conteiner('#8a3b2a'), 150, 1110, 0);
  g.add(K.caixa(2.3, 1.6, 2.2, K.pintado('madeiraCaixote', K.TEX.madeira(), { cor: '#9c7a52' }), X(472), 0, X(1000), 0.1));
  g.add(K.caixa(2.0, 1.2, 2.0, K.fosco('#8e9294'), X(575), 0, X(1010), -0.05));
  g.add(K.chao(X(300), X(700), K.pintado('terraTerreiro', K.TEX.terra(), { cor: '#d8c19a' }), 4, X(935), 0.018, X(1220)));
  pt(K.caminhao({ cor: '#f2f2f0', bau: '#d8dadb' }), 1137, 1080, PI / 2);
  pt(K.galpaoZinco(14, 10, 5, { cor: '#bdb8ad', ferrugem: 0.55, porta: 4 }), 1500, 1110, PI);
  pt(K.telheiro(10, 6, 3.4, { ferrugem: 0.4 }), 2200, 1000);
  pt(K.conteiner('#2f5d49'), 2150, 1010, 0);
  pt(K.galpaoZinco(26, 12, 5.8, { cor: '#c9c4b9', ferrugem: 0.45, porta: 4 }), -900, 1120, PI);
  /* O ÔNIBUS VERDE PARADO E OS DOIS CARROS BRANCOS FECHANDO ELE */
  const o = P.onibus;
  if (!op.semOnibus) pt(K.onibus({ comp: o.comp, cor: o.cor, cor2: o.cor2, cor3: o.cor3, itinerario: 'EXCURSÃO · CARAVANA' }), o.x, o.y, o.frente > 0 ? 0 : PI);
  for (const c of P.carros) pt(K.carro({ tipo: c.tipo, cor: c.cor }), c.x, c.y, -Math.atan2(c.dir[1], c.dir[0]));
  /* OS POSTES DA REDE na calçada de cima, o capim no pé dos muros, o mato longe */
  const postes = [];
  for (let x = -1900; x < 3700; x += 1064) postes.push(pt(posteDeRede(9), x, 185, 0));
  g.add(fiosEntre(postes));
  capim(g, { x0: px0, x1: px1, z0: X(160), z1: X(175) }, 120, rnd, 0.4);
  capim(g, { x0: px0, x1: px1, z0: X(846), z1: X(860) }, 120, rnd, 0.4);
  capim(g, { x0: px0, x1: px1, z0: X(-900), z1: X(-560) }, 160, rnd, 0.6);
  capim(g, { x0: px0, x1: px1, z0: X(1320), z1: X(1700) }, 160, rnd, 0.6);
  for (const [x, y, a] of [[-400, -700, 8], [700, -800, 7], [2000, -760, 9], [3000, -700, 7], [-600, 1500, 8], [600, 1550, 7], [1700, 1500, 9], [2800, 1560, 7]]) pt(K.arvore(a, rnd), x, y, rnd() * PI);
}

/* =======================================================
   A PEÇA: a montagem no mundo (o canto do tabuleiro em `O`)
   ======================================================= */
/* `tipo`: 'emb-posto' ou 'emb-onibus'; `O`: [x, z] do mundo onde fica o
   canto de cima à esquerda do tabuleiro. Devolve o grupo pronto (as
   peças juntadas por material, em unidades do mundo). `op` (a emboscada
   encaixada na rodovia da viagem, estrada3d.js): `giro` (o tabuleiro
   girado em volta de O, rad), `semLonge` (o chão até o horizonte é o da
   rodovia), `semOnibus` (o ônibus é o da viagem, que chega andando) e
   `naEstrada` (o plano sem o carro saindo do posto) */
export function montarCaravana(tipo, O, op = {}) {
  const P = PLANOS[tipo](op), rnd = K.sorteio(tipo === 'emb-posto' ? 7 : 11);
  const g = new THREE.Group();
  if (tipo === 'emb-posto') montarPosto(g, P, rnd, op); else montarEstrada(g, P, rnd, op);
  g.scale.setScalar(M);
  const junto = K.juntar(g, 'caravana: ' + tipo);
  g.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  const saida = new THREE.Group();
  saida.name = 'palco da caravana: ' + tipo;
  saida.position.set(O[0], 0, O[1]);
  saida.rotation.y = op.giro || 0;
  saida.add(junto);
  saida.userData.triangulos = junto.userData.triangulos;
  /* o chão até o horizonte (a cor por vértice: fica fora da junção) */
  if (!op.semLonge) {
    const longe = chaoDeLonge(1600, 64, rnd);
    longe.scale.setScalar(M); longe.position.set(X(768) * M, -0.1 * M, X(512) * M);
    saida.add(longe);
    saida.userData.triangulos += 64 * 64 * 2;
  }
  saida.userData.plano = P;
  return saida;
}

/* =======================================================
   A BRIGA (a cena do combate, com a máscara)
   ======================================================= */
/* `op`: o mesmo de `montarCaravana` (o `giro` do tabuleiro em volta de O
   e o plano da rodovia): o tabuleiro no mundo segue a peça */
export function cenaDaCaravana(tipo, O, op = {}) {
  const { W: TW, H: TH, CEL } = TABULEIRO, COLS = TW / CEL, ROWS = TH / CEL;
  const P = PLANOS[tipo](op);
  const malha = new Uint8Array(COLS * ROWS).fill(1);
  /* o que barra: a célula cujo meio cai no sólido (engrossado até uma célula) */
  const barrar = r => {
    const e = Math.max(0, (CEL + 1 - Math.min(r.x1 - r.x0, r.y1 - r.y0)) / 2);
    const c0 = Math.max(0, Math.ceil((r.x0 - e) / CEL - 0.5)), c1 = Math.min(COLS - 1, Math.floor((r.x1 + e) / CEL - 0.5));
    const r0 = Math.max(0, Math.ceil((r.y0 - e) / CEL - 0.5)), r1 = Math.min(ROWS - 1, Math.floor((r.y1 + e) / CEL - 0.5));
    for (let j = r0; j <= r1; j++) for (let i = c0; i <= c1; i++) malha[j * COLS + i] = 0;
  };
  for (const r of P.solidos) barrar(r);
  const linhas = [];
  for (let j = 0; j < ROWS; j++) {
    const runs = []; let v0 = 0, n = 0;
    for (let i = 0; i < COLS; i++) { const v1 = malha[j * COLS + i]; if (v1 === v0) n++; else { runs.push(n); v0 = v1; n = 1; } }
    runs.push(n);
    linhas.push(runs.join(','));
  }
  const cena = Object.assign({ tres: true, largura: TW, altura: TH, celula: CEL, imagem: null, mascara: linhas.join(';'),
                               blocos: [], enfeites: [], varais: [], grades: [], pintura: null }, P.cena);
  /* (o giro é o do Three em volta do eixo de cima: o x do tabuleiro vai
     pra (cos, −sen) e o y pra (sen, cos)) */
  const g = op.giro || 0, cg = Math.cos(g), sg = Math.sin(g);
  const noMundo = (x, y) => [O[0] + (x * cg + y * sg) * ESCALA, O[1] + (y * cg - x * sg) * ESCALA];
  const doMundo = (x, z) => { const dx = (x - O[0]) / ESCALA, dz = (z - O[1]) / ESCALA; return [dx * cg - dz * sg, dx * sg + dz * cg]; };
  /* o chão (m): o concreto do pátio e o asfalto; em cima do canteiro, o meio-fio */
  const cn = P.canteiro;
  const chao = (x, y) => cn && x > cn.x0 + 12 && x < cn.x1 - 12 && y > cn.y0 + 2 && y < cn.y1 - 2 ? 0.155 : 0.02;
  return { cena, noMundo, doMundo, u: [cg, -sg], v: [sg, cg], origem: O, escala: ESCALA, chao, plano: P, malha, COLS, ROWS };
}
