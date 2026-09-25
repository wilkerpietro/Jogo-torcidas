/* =========================================================
   A CIDADE EM LADRILHOS, COM A VERSÃO DE LONGE
   ---------------------------------------------------------
   A cidade saía em poucas malhas grandes — as casas em quadrados de
   80 m, as árvores numa malha só pra cidade inteira —, e a câmera não
   tinha o que descartar: se um pedacinho da malha aparecia, ela ia
   inteira pra placa. Na câmera de ombro, olhando uma rua, o jogo
   desenhava 3,5 vezes o que estava na tela, e quase tudo o que estava
   na tela ficava a mais de 50 m, com o detalhe de perto.

   Aqui as malhas que a cidade monta (`bairro3d`, `props3d`) são
   recortadas em LADRILHOS de 40 m, e cada ladrilho tem três estados:
     - DE PERTO: tudo, como foi montado;
     - DE LONGE: uma malha só, de cor por vértice, sem textura — cada
       prédio vira blocos (o mapa de alturas do telhado dele, numa grade),
       cada árvore a versão de longe dela, o poste uma haste, o carro
       continua o carro, e o que é miúdo (lixeira, cone, banco, móvel,
       decalque) some;
     - ALÉM DA NÉVOA: nada. O que a névoa já apagou não vai pra placa.
   A troca é pela distância da CÂMERA ao PONTO MAIS PERTO do ladrilho
   (a caixa dele), não ao meio: pelo meio, a borda de perto de um
   ladrilho grande trocava pra caixa a 35 m da câmera. Quem manda nas
   distâncias é o modo leve (`distancias`); quem chama `atualizar` a
   cada quadro é a cena, antes de desenhar.

   POR QUE 40 M. Medido nas cinco vistas do jogo, com a troca pelo ponto
   mais perto: com 60 m, no modo leve (sem sombra, que é o do celular),
   o quadro tinha de 20 a 70% mais triângulos e só umas 5 chamadas a
   menos; a vantagem do 60 m é na sombra (cada ladrilho é uma chamada
   por material, e a sombra passa por todos os que tocam a caixa dela),
   e sombra só liga em máquina forte. Com 80 m a favela vista de cima
   desenhava o dobro.

   QUEM DIZ O QUÊ É CADA TRIÂNGULO é quem monta: a malha traz
   `userData.lad = { modo, ids, impostor, folha, solta }` e o grupo traz
   a tabela de OBJETOS — `{ x, z, ang, tipo, longe }` — que diz onde o
   objeto está (é o meio dele que escolhe o ladrilho: a casa inteira cai
   num ladrilho só, e a de perto e a de longe trocam juntas) e o que ele
   vira de longe:
     'predio'  blocos de altura (só os triângulos das malhas `impostor`) —
               ou, se quem montou mandou, a `longe` pronta dele (o hospital,
               a escola: a caixa com as faixas de janela);
     'arvore'  `longe`, a versão de longe da árvore, já no mundo;
     'alto'    uma haste da base ao topo (poste, mastro, semáforo);
     'mesmo'   os mesmos triângulos (o carro);
     'chao'    só o que olha pra cima (a laje, o piso);
     'prop'    nada.
   `modo: 'sempre'` é o que não muda com a distância (o tampo da laje,
   que veste o material do chão, e a moita): vai recortado pelo meio de
   cada triângulo, nos dois níveis. Malha sem `lad` passa como está (a
   porta que gira, a bandeira que tremula, os letreiros que a pixação
   reescreve, o telhado da sede que some).

   A COR DE LONGE é a cor do vértice vezes a MÉDIA da textura naquele
   ponto: a célula do atlas em que a UV cai (`modelos_medias.js`) ou a
   textura solta do bairro (o reboco, a telha). Sem isso a parede de
   tijolo, que é vértice branco vezes textura de tijolo, sairia branca.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';
import { ATLAS } from './modelos_atlas.js';
import { MEDIAS, MEDIAS_SOLTAS } from './modelos_medias.js';

/* o lado do ladrilho: 40 m (o boneco tem 34 unidades pra 1,75 m) */
export const LADO = 777;

/* ---- a cor média da textura num ponto da UV ----
   Uma grade de 64 × 64 por folha diz em que célula cada ponto cai (as
   células não se sobrepõem; a margem de 6 px de cada uma segura o erro
   da grade na borda). */
const GRADE = 64;
const indices = new Map();
function indiceDaFolha(folha) {
  if (indices.has(folha)) return indices.get(folha);
  const A = ATLAS[folha], M = MEDIAS[folha];
  let idx = null;
  if (A && M) {
    const cor = [], grade = new Int16Array(GRADE * GRADE).fill(-1);
    for (const [k, c] of Object.entries(A.cel)) {
      const m = M[k];
      if (!m) continue;
      const n = cor.length;
      cor.push(m);
      const i0 = Math.max(0, Math.floor(c[0] * GRADE)), i1 = Math.min(GRADE - 1, Math.floor(c[2] * GRADE));
      const j0 = Math.max(0, Math.floor(c[1] * GRADE)), j1 = Math.min(GRADE - 1, Math.floor(c[3] * GRADE));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) grade[j * GRADE + i] = n;
    }
    idx = { cor, grade };
  }
  indices.set(folha, idx);
  return idx;
}
const BRANCO = [1, 1, 1];
function mediaDaTextura(L, u, v) {
  if (L.solta) return MEDIAS_SOLTAS[L.solta] || BRANCO;
  if (!L.folha) return BRANCO;
  const idx = indiceDaFolha(L.folha);
  if (!idx) return BRANCO;
  const i = Math.min(GRADE - 1, Math.max(0, Math.floor(u * GRADE)));
  const j = Math.min(GRADE - 1, Math.max(0, Math.floor(v * GRADE)));
  const n = idx.grade[j * GRADE + i];
  return n < 0 ? BRANCO : idx.cor[n];
}

/* a cor (linear) de um triângulo: a do vértice (ou a do material) vezes
   a média da textura no meio da UV dele */
function corDoTriangulo(m, t, saida) {
  const g = m.geometry, L = m.userData.lad, C = g.attributes.color, U = g.attributes.uv;
  if (C) {
    const a = C.array, k = t * 9;
    saida[0] = (a[k] + a[k + 3] + a[k + 6]) / 3;
    saida[1] = (a[k + 1] + a[k + 4] + a[k + 7]) / 3;
    saida[2] = (a[k + 2] + a[k + 5] + a[k + 8]) / 3;
  } else {
    const c = m.material.color || { r: 1, g: 1, b: 1 };
    saida[0] = c.r; saida[1] = c.g; saida[2] = c.b;
  }
  if (U && (L.folha || L.solta)) {
    const a = U.array, k = t * 6;
    const med = mediaDaTextura(L, (a[k] + a[k + 2] + a[k + 4]) / 3, (a[k + 1] + a[k + 3] + a[k + 5]) / 3);
    saida[0] *= med[0]; saida[1] *= med[1]; saida[2] *= med[2];
  }
  return saida;
}

/* =======================================================
   A VERSÃO DE LONGE DE CADA OBJETO
   ======================================================= */
const _c = [0, 0, 0];

/* o tecido de longe: posição e cor, um triângulo por vez */
function triLonge(F, ax, ay, az, bx, by, bz, cx, cy, cz, r, g, b) {
  F.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
  F.cor.push(r, g, b, r, g, b, r, g, b);
}
function quadLonge(F, p, q, r_, s, cor) {
  triLonge(F, p[0], p[1], p[2], q[0], q[1], q[2], r_[0], r_[1], r_[2], cor[0], cor[1], cor[2]);
  triLonge(F, p[0], p[1], p[2], r_[0], r_[1], r_[2], s[0], s[1], s[2], cor[0], cor[1], cor[2]);
}

/* os mesmos triângulos, com a cor de longe (o carro); `soTopo`: só o que
   olha pra cima (a laje) */
function copiarTriangulos(o, F, soTopo) {
  const T = o._tris;
  for (let n = 0; n < T.length; n += 2) {
    const m = T[n], t = T[n + 1], P = m.geometry.attributes.position.array, k = t * 9;
    if (soTopo) {
      const ux = P[k + 3] - P[k], uy = P[k + 4] - P[k + 1], uz = P[k + 5] - P[k + 2];
      const vx = P[k + 6] - P[k], vy = P[k + 7] - P[k + 1], vz = P[k + 8] - P[k + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz);
      if (!len || Math.abs(ny) / len < 0.7) continue;
    }
    corDoTriangulo(m, t, _c);
    triLonge(F, P[k], P[k + 1], P[k + 2], P[k + 3], P[k + 4], P[k + 5], P[k + 6], P[k + 7], P[k + 8], _c[0], _c[1], _c[2]);
  }
}

/* a haste: a caixa da base (o quarto de baixo do objeto) até o topo, na
   cor média — o poste de longe */
function haste(o, F) {
  const T = o._tris;
  let y0 = Infinity, y1 = -Infinity;
  for (let n = 0; n < T.length; n += 2) {
    const P = T[n].geometry.attributes.position.array, k = T[n + 1] * 9;
    for (let v = 0; v < 9; v += 3) { y0 = Math.min(y0, P[k + v + 1]); y1 = Math.max(y1, P[k + v + 1]); }
  }
  if (!(y1 > y0)) return;
  const corte = y0 + (y1 - y0) * 0.25;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, r = 0, g = 0, b = 0, soma = 0;
  for (let n = 0; n < T.length; n += 2) {
    const m = T[n], t = T[n + 1], P = m.geometry.attributes.position.array, k = t * 9;
    for (let v = 0; v < 9; v += 3) if (P[k + v + 1] <= corte) {
      x0 = Math.min(x0, P[k + v]); x1 = Math.max(x1, P[k + v]); z0 = Math.min(z0, P[k + v + 2]); z1 = Math.max(z1, P[k + v + 2]);
    }
    corDoTriangulo(m, t, _c);
    r += _c[0]; g += _c[1]; b += _c[2]; soma++;
  }
  if (!(x1 > x0) || !(z1 > z0)) return;
  const cor = [r / soma, g / soma, b / soma];
  caixaLonge(F, x0, x1, z0, z1, y0, y1, cor, cor, null);
}

/* uma caixa alinhada (sem o fundo), no referencial `rot` */
function caixaLonge(F, x0, x1, z0, z1, y0, y1, corTopo, corLado, rot, lados = [1, 1, 1, 1]) {
  const P = (x, y, z) => rot ? rot(x, y, z) : [x, y, z];
  const a = P(x0, y0, z0), b = P(x1, y0, z0), c = P(x1, y0, z1), d = P(x0, y0, z1);
  const e = P(x0, y1, z0), f = P(x1, y1, z0), g = P(x1, y1, z1), h = P(x0, y1, z1);
  quadLonge(F, e, h, g, f, corTopo);
  if (lados[0]) quadLonge(F, a, e, f, b, corLado);      // o lado de z0
  if (lados[1]) quadLonge(F, c, g, h, d, corLado);      // o de z1
  if (lados[2]) quadLonge(F, d, h, e, a, corLado);      // o de x0
  if (lados[3]) quadLonge(F, b, f, g, c, corLado);      // o de x1
}

/* O PRÉDIO DE LONGE: o mapa de alturas do telhado dele, numa grade no
   referencial do prédio, e cada retângulo de mesma altura vira um bloco.
   Pega o que conta de longe — a laje, o quarto em cima da laje, a caixa
   d'água, o muro baixo, a torre da igreja — e larga janela, porta,
   calha e grade. A cor do topo é a do telhado naquele ponto; a dos
   lados, a média das paredes. */
function predio(o, F) {
  const T = o._tris;
  if (!T || !T.length) return;
  /* o giro: o do lote, mas confere — a caixa certa é a menor (o sinal do
     giro muda de quem montou pra quem montou) */
  const giros = o.ang ? [o.ang, -o.ang] : [0];
  let melhor = null;
  for (const ang of giros) {
    const c = Math.cos(ang), s = Math.sin(ang);
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let n = 0; n < T.length; n += 2) {
      const P = T[n].geometry.attributes.position.array, k = T[n + 1] * 9;
      for (let v = 0; v < 9; v += 3) {
        const dx = P[k + v] - o.x, dz = P[k + v + 2] - o.z;
        const u = dx * c + dz * s, w = -dx * s + dz * c;
        if (u < x0) x0 = u; if (u > x1) x1 = u; if (w < z0) z0 = w; if (w > z1) z1 = w;
      }
    }
    const area = (x1 - x0) * (z1 - z0);
    if (!melhor || area < melhor.area - 1e-6) melhor = { ang, c, s, x0, x1, z0, z1, area };
  }
  const { c, s, x0, z0 } = melhor;
  const W = melhor.x1 - x0, D = melhor.z1 - z0;
  if (!(W > 0.5) || !(D > 0.5)) return;
  /* a grade: umas cinco células no lado menor, de 0,6 a 2 m, no máximo 28 */
  let lado = Math.min(40, Math.max(12, Math.min(W, D) / 5));
  lado = Math.max(lado, W / 28, D / 28);
  const nx = Math.max(1, Math.ceil(W / lado)), nz = Math.max(1, Math.ceil(D / lado));
  const H = new Float32Array(nx * nz).fill(-Infinity), C = new Float32Array(nx * nz * 3);
  let yMin = Infinity, pr = 0, pg = 0, pb = 0, pa = 0;
  const L = [0, 0, 0, 0, 0, 0], Y = [0, 0, 0];
  for (let n = 0; n < T.length; n += 2) {
    const m = T[n], t = T[n + 1], P = m.geometry.attributes.position.array, k = t * 9;
    for (let v = 0; v < 3; v++) {
      const dx = P[k + v * 3] - o.x, dz = P[k + v * 3 + 2] - o.z;
      L[v * 2] = dx * c + dz * s - x0; L[v * 2 + 1] = -dx * s + dz * c - z0;
      Y[v] = P[k + v * 3 + 1];
      if (Y[v] < yMin) yMin = Y[v];
    }
    const ux = P[k + 3] - P[k], uy = P[k + 4] - P[k + 1], uz = P[k + 5] - P[k + 2];
    const vx = P[k + 6] - P[k], vy = P[k + 7] - P[k + 1], vz = P[k + 8] - P[k + 2];
    const nX = uy * vz - uz * vy, nY = uz * vx - ux * vz, nZ = ux * vy - uy * vx;
    const len = Math.hypot(nX, nY, nZ);
    if (!len) continue;
    const ny = nY / len;
    corDoTriangulo(m, t, _c);
    if (Math.abs(ny) < 0.3) {                   // parede: entra na cor dos lados
      const a = len / 2;
      pr += _c[0] * a; pg += _c[1] * a; pb += _c[2] * a; pa += a;
      continue;
    }
    /* telhado (olhando pra cima ou pra baixo: o forro do beiral também
       diz onde a casa acaba): cada centro de célula dentro do triângulo
       leva a altura dele ali */
    const ax = L[0], az = L[1], bx = L[2], bz = L[3], cx = L[4], cz = L[5];
    const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
    if (Math.abs(det) < 1e-6) continue;
    const i0 = Math.max(0, Math.floor(Math.min(ax, bx, cx) / lado)), i1 = Math.min(nx - 1, Math.floor(Math.max(ax, bx, cx) / lado));
    const j0 = Math.max(0, Math.floor(Math.min(az, bz, cz) / lado)), j1 = Math.min(nz - 1, Math.floor(Math.max(az, bz, cz) / lado));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const px = (i + 0.5) * lado, pz = (j + 0.5) * lado;
      const l1 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / det;
      const l2 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / det;
      const l3 = 1 - l1 - l2;
      if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) continue;
      const h = l1 * Y[0] + l2 * Y[1] + l3 * Y[2], q = j * nx + i;
      if (h > H[q]) { H[q] = h; C[q * 3] = _c[0]; C[q * 3 + 1] = _c[1]; C[q * 3 + 2] = _c[2]; }
    }
  }
  /* a altura em degraus de meio metro, contada do pé do prédio; o que
     não chega a meio degrau (o chão do quintal) é chão */
  const PASSO = 10;
  const Q = new Int16Array(nx * nz);
  for (let q = 0; q < Q.length; q++) Q[q] = H[q] > yMin ? Math.round((H[q] - yMin) / PASSO) : 0;
  const corLado = pa > 0 ? [pr / pa, pg / pa, pb / pa] : null;
  const rot = (u, y, w) => {
    const X = u + x0, Z = w + z0;
    return [o.x + X * c - Z * s, y, o.z + X * s + Z * c];
  };
  /* os retângulos de mesma altura, o maior que der a partir de cada canto */
  const usado = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const q0 = j * nx + i, h = Q[q0];
    if (!h || usado[q0]) continue;
    let i1 = i;
    while (i1 + 1 < nx && Q[j * nx + i1 + 1] === h && !usado[j * nx + i1 + 1]) i1++;
    let j1 = j;
    for (;;) {
      if (j1 + 1 >= nz) break;
      let ok = true;
      for (let ii = i; ii <= i1; ii++) { const q = (j1 + 1) * nx + ii; if (Q[q] !== h || usado[q]) { ok = false; break; } }
      if (!ok) break;
      j1++;
    }
    let r = 0, g = 0, b = 0, n = 0;
    for (let jj = j; jj <= j1; jj++) for (let ii = i; ii <= i1; ii++) {
      const q = jj * nx + ii; usado[q] = 1;
      r += C[q * 3]; g += C[q * 3 + 1]; b += C[q * 3 + 2]; n++;
    }
    const topo = [r / n, g / n, b / n];
    const ladoCor = corLado || [topo[0] * 0.8, topo[1] * 0.8, topo[2] * 0.8];
    /* o lado que encosta num vizinho igual ou mais alto não aparece */
    const tapado = (ia, ib, ja, jb) => {
      if (ia < 0 || ib >= nx || ja < 0 || jb >= nz) return false;
      for (let jj = ja; jj <= jb; jj++) for (let ii = ia; ii <= ib; ii++) if (Q[jj * nx + ii] < h) return false;
      return true;
    };
    const lados = [!tapado(i, i1, j - 1, j - 1), !tapado(i, i1, j1 + 1, j1 + 1), !tapado(i - 1, i - 1, j, j1), !tapado(i1 + 1, i1 + 1, j, j1)];
    caixaLonge(F, i * lado, Math.min(W, (i1 + 1) * lado), j * lado, Math.min(D, (j1 + 1) * lado),
               yMin, yMin + h * PASSO, topo, ladoCor, rot, lados.map(Number));
  }
}

/* =======================================================
   OS LADRILHOS
   ======================================================= */
/* junta os triângulos `tris` de cada malha-fonte (todas do mesmo
   material) numa geometria só, com os mesmos atributos */
function juntar(fontes) {
  let n = 0, m0 = null;
  for (const [m, tris] of fontes) { n += tris.length; if (!m0) m0 = m; }
  const nomes = Object.keys(m0.geometry.attributes);
  const geo = new THREE.BufferGeometry();
  for (const a of nomes) {
    const tam = m0.geometry.attributes[a].itemSize, out = new Float32Array(n * 3 * tam);
    let k = 0;
    for (const [m, tris] of fontes) {
      const src = m.geometry.attributes[a];
      if (!src) {
        /* a fonte sem cor de vértice vai branca, que é o neutro */
        if (a === 'color') out.fill(1, k, k + tris.length * 3 * tam);
        k += tris.length * 3 * tam; continue;
      }
      const A = src.array, passo = 3 * tam;
      for (const t of tris) { out.set(A.subarray(t * passo, t * passo + passo), k); k += passo; }
    }
    geo.setAttribute(a, new THREE.BufferAttribute(out, tam));
  }
  geo.computeBoundingSphere();
  return geo;
}

/* MATERIAIS IGUAIS VIRAM UM SÓ. Quem monta a cidade cria um material
   por malha (o reboco do quarteirão e o da beira, o de cor por vértice
   dos soltos, das árvores, das moitas), e cada material diferente é uma
   chamada de desenho a mais POR LADRILHO. O que tem o mesmo tipo, a
   mesma textura e as mesmas chaves vira o mesmo — e a malha dele no
   ladrilho, uma só. A sombra (projeta, recebe) e a ordem de desenho
   também separam, que a malha junta só pode ter um valor de cada. */
function assinatura(m) {
  const M = m.material, c = M.color;
  return [M.type, M.map ? M.map.uuid : '', M.vertexColors, M.alphaTest, M.side, M.transparent, M.opacity,
          M.alphaToCoverage, M.depthWrite, c ? c.getHex() : '', m.castShadow, m.receiveShadow, m.renderOrder].join('|');
}

/* RECORTA as malhas dos grupos em ladrilhos. Devolve a raiz (um Group
   com os LODs e o que passou inteiro), a lista de ladrilhos, o material
   de longe e `distancias(longe, fim)`, que o modo leve chama. */
export function emLadrilhos(grupos, opc = {}) {
  const lado = opc.lado || LADO;
  const canonicos = new Map();
  const canonico = m => {
    const k = assinatura(m);
    if (!canonicos.has(k)) canonicos.set(k, m.material);
    return canonicos.get(k);
  };
  const ladrilhos = new Map(), passam = [];
  const ladrilho = (x, z) => {
    const i = Math.floor(x / lado), j = Math.floor(z / lado), k = i + ',' + j;
    let t = ladrilhos.get(k);
    if (!t) ladrilhos.set(k, t = { i, j, k, perto: new Map(), sempre: new Map(), objetos: [] });
    return t;
  };
  const guardar = (mapa, m, t) => {
    const mat = m.userData.lad._mat;
    let e = mapa.get(mat);
    if (!e) mapa.set(mat, e = { fontes: new Map(), sombra: m.castShadow, recebe: m.receiveShadow, nome: m.name, ordem: m.renderOrder });
    let lista = e.fontes.get(m);
    if (!lista) e.fontes.set(m, lista = []);
    lista.push(t);
  };
  const PRECISA = { predio: 1, alto: 1, mesmo: 1, chao: 1 };
  for (const g of grupos) {
    const objs = g.objetos || [];
    for (const o of objs) { o._tris = null; o._lad = null; }
    for (const m of g.meshes) {
      const L = m.userData && m.userData.lad;
      if (!L || !m.isMesh) { passam.push(m); continue; }
      L._mat = canonico(m);
      const P = m.geometry.attributes.position.array, nt = P.length / 9;
      const ids = L.ids;
      for (let t = 0; t < nt; t++) {
        /* sem dono (ou `sempre`): vai pelo meio do triângulo, igual de
           perto e de longe — o que ninguém marcou não some */
        const o = L.modo === 'sempre' || !ids || ids[t] < 0 ? null : objs[ids[t]];
        if (!o) {
          const k = t * 9;
          guardar(ladrilho((P[k] + P[k + 3] + P[k + 6]) / 3, (P[k + 2] + P[k + 5] + P[k + 8]) / 3).sempre, m, t);
          continue;
        }
        if (!o._lad) { o._lad = ladrilho(o.x, o.z); o._lad.objetos.push(o); }
        guardar(o._lad.perto, m, t);
        /* o que a versão de longe do objeto precisa: o prédio, só das
           malhas que fazem o volume (a janela de grade e o decalque não) */
        if (PRECISA[o.tipo] && !o.longe && (o.tipo !== 'predio' || L.impostor !== false)) (o._tris || (o._tris = [])).push(m, t);
      }
    }
    /* o objeto que só tem versão de longe pronta (a árvore) também cai
       no ladrilho dele, mesmo sem triângulo tiled (não acontece hoje) */
    for (const o of objs) if (o.longe && !o._lad) { o._lad = ladrilho(o.x, o.z); o._lad.objetos.push(o); }
  }

  const matLonge = opc.materialLonge || new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const raiz = new THREE.Group();
  raiz.name = 'ladrilhos';
  const lista = [];
  const conta = { ladrilhos: 0, perto: 0, longe: 0, malhasPerto: 0 };
  const malhaDe = (geo, mat, e, nome) => {
    const mm = new THREE.Mesh(geo, mat);
    mm.castShadow = e.sombra; mm.receiveShadow = e.recebe; mm.renderOrder = e.ordem || 0;
    mm.name = nome;
    mm.matrixAutoUpdate = false;
    return mm;
  };
  for (const t of ladrilhos.values()) {
    const cx = (t.i + 0.5) * lado, cz = (t.j + 0.5) * lado;
    const perto = new THREE.Group(), longe = new THREE.Group();
    perto.name = 'perto'; longe.name = 'longe';
    for (const [mat, e] of t.perto) {
      const geo = juntar(e.fontes);
      perto.add(malhaDe(geo, mat, e, e.nome + '@' + t.k));
      conta.perto += geo.attributes.position.count / 3; conta.malhasPerto++;
    }
    for (const [mat, e] of t.sempre) {
      const geo = juntar(e.fontes);
      perto.add(malhaDe(geo, mat, e, e.nome + '@' + t.k));
      longe.add(malhaDe(geo, mat, e, e.nome + '@' + t.k));
    }
    /* a versão de longe dos objetos do ladrilho */
    const F = { pos: [], cor: [] };
    for (const o of t.objetos) {
      if (o.longe) { for (const v of o.longe.pos) F.pos.push(v); for (const v of o.longe.cor) F.cor.push(v); }
      else if (o.tipo === 'predio') predio(o, F);
      else if (o.tipo === 'alto' && o._tris) haste(o, F);
      else if (o.tipo === 'mesmo' && o._tris) copiarTriangulos(o, F, false);
      else if (o.tipo === 'chao' && o._tris) copiarTriangulos(o, F, true);
    }
    if (F.pos.length) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(F.pos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(F.cor, 3));
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      longe.add(malhaDe(geo, matLonge, { sombra: true, recebe: true }, 'longe@' + t.k));
      conta.longe += F.pos.length / 9;
    }
    /* a caixa do ladrilho: a das malhas dele (a casa do canto passa da
       divisa), é dela que sai a distância */
    const cx0 = new THREE.Box3();
    for (const nv of [perto, longe]) for (const mm of nv.children) {
      if (!mm.geometry.boundingBox) mm.geometry.computeBoundingBox();
      cx0.union(mm.geometry.boundingBox);
    }
    const grupo = new THREE.Group();
    grupo.name = 'ladrilho@' + t.k;
    grupo.add(perto, longe);
    for (const o of [grupo, perto, longe]) { o.matrixAutoUpdate = false; o.updateMatrix(); }
    longe.visible = false;
    raiz.add(grupo);
    lista.push({ k: t.k, cx, cz, grupo, perto, longe, caixa: cx0, estado: 0 });
    conta.ladrilhos++;
  }
  for (const m of passam) raiz.add(m);
  /* as fontes já foram copiadas: a geometria delas não vai pra placa, e
     a malha larga os números (uns 40 MB a menos de memória, que no
     celular contam) */
  const VAZIA = new THREE.BufferGeometry();
  for (const g of grupos) for (const m of g.meshes) if (m.userData && m.userData.lad && m.geometry) {
    m.geometry.dispose();
    m.geometry = VAZIA;
    m.userData.lad.ids = null;
  }
  for (const g of grupos) for (const o of g.objetos || []) { o._tris = null; o._lad = null; }

  /* O MODO LEVE decide onde troca pra de longe e onde some (a distância
     da câmera à caixa do ladrilho). A volta pra perto é 6% mais perto
     que a ida pra longe: parada na divisa, a câmera não pisca. */
  let dLonge = opc.longe || 1400, dFim = opc.fim || 1e9, travado = null;
  function distancias(longe, fim) { dLonge = longe; dFim = Math.max(fim, longe + lado); }
  function atualizar(p) {
    if (travado) return;
    for (const t of lista) {
      const b = t.caixa;
      const dx = Math.max(b.min.x - p.x, 0, p.x - b.max.x), dy = Math.max(b.min.y - p.y, 0, p.y - b.max.y);
      const dz = Math.max(b.min.z - p.z, 0, p.z - b.max.z), d = Math.hypot(dx, dy, dz);
      const vaiLonge = t.estado === 1 ? d > dLonge * 0.94 : d > dLonge;
      const estado = d > dFim ? 2 : vaiLonge ? 1 : 0;
      if (estado === t.estado) continue;
      t.estado = estado;
      t.perto.visible = estado === 0;
      t.longe.visible = estado === 1;
    }
  }
  /* pro teste e pra foto: `null` devolve o automático; 'perto' ou
     'longe' travam todos os ladrilhos num estado */
  function forcar(nivel) {
    travado = nivel || null;
    for (const t of lista) {
      t.estado = -1;
      if (!nivel) continue;
      t.perto.visible = nivel === 'perto';
      t.longe.visible = nivel === 'longe';
    }
  }
  return { raiz, lista, materialLonge: matLonge, conta, distancias, atualizar, forcar };
}
