/* =========================================================
   OS PROPS DE RUA — o que se instala e o que se larga na calçada
   ---------------------------------------------------------
   O contêiner de lixo verde de tampa cinza, a lixeira de rodinha de
   tampa colorida, o saco de lixo preto, a caixa de papelão, o cesto
   de praça de chapa trançada, a barreira de concreto, a caixa de
   correio vermelha, o hidrante, os dois balizadores (o preto e
   amarelo e o amarelo de espuma), o delineador, o cone, o cinzeiro de
   pé e o banco de madeira de pé de ferro. O poste NÃO: o dono vai
   mandou o dele depois — o poste de concreto com as duas cruzetas, a
   luminária e, em alguns, o transformador —, e ele veste os postes da
   rua (`K.POSTES`) no lugar da caixa de antes.

   QUEM DIZ ONDE é a planta (`dados/cena_estadio.js`, "OS PROPS DE
   RUA"): uma lista de `{ k, x, y, ang, v, s, alt0 }` — a peça, o ponto,
   pra onde a frente olha, a variante (a cor do cesto e da tampa, o
   jeito do saco), a escala e a altura do chão onde ela pisa (a laje
   da calçada, o piso da praça). Aqui cada peça é montada UMA vez por
   variante, em metros e no referencial dela (x pra direita, y pra
   cima, a frente pra +z), com a folha `props`; depois é copiada pra
   cada lugar, girada e escalada, e tudo o que cai no mesmo quadrado
   de 1.600 do mapa (uns 80 m) vira UMA malha: quase quatrocentas
   peças em uma dúzia de chamadas de desenho.

   Cada peça é um OBJETO pro recorte em ladrilhos (`ladrilhos3d.js`): o
   poste vira uma haste de longe; o resto, que é miúdo, some.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';
import { ATLAS } from './modelos_atlas.js';
import { Construtor, METRO, lerp } from './construtor3d.js';

/* as cores que o vértice dá pro que sai claro na folha */
const COR_CESTO = ['#6aa33a', '#d2b53a', '#3f82ad', '#8b6a3c', '#b8452f'];
const COR_TAMPA = ['#e58a2a', '#b3302a', '#2c5fb8', '#4f9a3c', '#d9b52c'];

const poligono = (r, n, giro = 0) => {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = giro + i / n * Math.PI * 2;
    pts.push([r * Math.cos(t), r * Math.sin(t)]);
  }
  return pts;
};

/* ---- o cesto de praça: a chapa trançada colorida, o aro e o fundo ---- */
function cesto(B, v) {
  B.pintar(COR_CESTO[v % COR_CESTO.length]);
  B.torno(0, 0, [[0.2, 0.0], [0.215, 0.05], [0.215, 0.7]], 8, 'cesto_malha');
  B.pintar(null);
  B.torno(0, 0, [[0.215, 0.7], [0.235, 0.715], [0.235, 0.77], [0.2, 0.785], [0.19, 0.74]], 8, 'metal');
  B.tampa(poligono(0.19, 8), 0.74, 'escuro');
}

/* ---- o contêiner de lixo: corpo verde de nervura, a tampa de duas
   folhas, o encaixe do garfo do caminhão dos lados e as rodinhas ---- */
function cacamba(B) {
  const w = 1.3, d = 1.0, h0 = 0.14, h1 = 1.06;
  const lado = { k: 'cacamba', modo: 'esticar' };
  B.caixa(-w / 2, w / 2, h0, h1, -d / 2, d / 2, { frente: lado, tras: lado, dir: lado, esq: lado, topo: null, base: 'escuro' });
  B.caixa(-w / 2 - 0.05, w / 2 + 0.05, h1, h1 + 0.08, -d / 2 - 0.07, d / 2 + 0.05,
          { todas: 'plastico', topo: { k: 'tampa_cacamba', modo: 'esticar' } });
  for (const s of [-1, 1]) {
    B.caixa(s > 0 ? w / 2 : -w / 2 - 0.07, s > 0 ? w / 2 + 0.07 : -w / 2, 0.66, 0.92, -0.3, 0.3, { todas: 'plastico_verde' });
    B.caixa(-0.45 * s - 0.04, -0.45 * s + 0.04, 0.84, 0.9, d / 2, d / 2 + 0.06, { todas: 'plastico_verde' });
  }
  B.caixa(-0.45, 0.45, 0.84, 0.9, d / 2 + 0.03, d / 2 + 0.06, { todas: 'plastico_verde' });
  for (const x of [-0.5, 0.5]) for (const z of [-0.36, 0.36])
    B.caixa(x - 0.05, x + 0.05, 0, h0, z - 0.06, z + 0.06, { todas: 'pneu' });
}

/* ---- a lixeira de rodinha: corpo cinza, a tampa colorida (a cor é
   a da coleta), a alça e as duas rodas atrás ---- */
function lixeiraRodas(B, v) {
  const w = 0.58, d = 0.7, h = 0.95;
  const lado = { k: 'lixeira', modo: 'esticar' };
  B.caixa(-w / 2, w / 2, 0.04, h, -d / 2, d / 2, { frente: lado, tras: lado, dir: lado, esq: lado, topo: 'escuro', base: null });
  B.pintar(COR_TAMPA[v % COR_TAMPA.length]);
  B.caixa(-w / 2 - 0.03, w / 2 + 0.03, h, h + 0.05, -d / 2 - 0.04, d / 2 + 0.05,
          { todas: 'tampa_lixeira', topo: { k: 'tampa_lixeira', modo: 'esticar' } });
  B.pintar(null);
  B.caixa(-w / 2 + 0.06, w / 2 - 0.06, h - 0.1, h - 0.03, -d / 2 - 0.08, -d / 2, { todas: 'plastico' });
  for (const x of [-w / 2 + 0.03, w / 2 - 0.03])
    B.caixa(x - 0.04, x + 0.04, 0, 0.17, -d / 2 - 0.03, -d / 2 + 0.15, { todas: 'pneu' });
}

/* ---- o saco de lixo: um bolo amassado (o raio muda de gomo pra gomo,
   diferente em cada variante) e as orelhas do nó em cima ---- */
function saco(B, v) {
  const n = 6;
  /* o saco de 100 litros: uns 60 cm de largura e 70 de altura, amarrado */
  const perfil = [[0.0, 0.0], [0.22, 0.02], [0.31, 0.18], [0.3, 0.37], [0.19, 0.53], [0.06, 0.6], [0.035, 0.65], [0.09, 0.73], [0.0, 0.72]];
  const c = B.cel('saco');
  const bolo = (i, j) => 1 + 0.16 * ((((i * 7 + j * 5 + v * 11) % 7) / 6) - 0.5) * 2 * (j > 0 && j < 6 ? 1 : 0.3);
  const P = (i, j) => {
    const t = i / n * Math.PI * 2 + v * 0.7, r = perfil[j][0] * bolo(i % n, j);
    return [r * Math.cos(t), perfil[j][1] * (1 + 0.06 * ((v % 3) - 1)), -r * Math.sin(t)];
  };
  for (let i = 0; i < n; i++) for (let j = 0; j < perfil.length - 1; j++) {
    const u0 = lerp(c[0], c[2], i / n), u1 = lerp(c[0], c[2], (i + 1) / n);
    const v0 = lerp(c[1], c[3], j / (perfil.length - 1)), v1 = lerp(c[1], c[3], (j + 1) / (perfil.length - 1));
    B.poli([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
  }
}

/* ---- a caixa de papelão aberta, com as quatro abas pra fora ---- */
function caixaPapelao(B, v) {
  const w = v % 2 ? 0.42 : 0.5, d = v % 2 ? 0.36 : 0.4, h = v % 2 ? 0.3 : 0.34;
  const lado = { k: 'papelao', modo: 'esticar' };
  B.caixa(-w / 2, w / 2, 0, h, -d / 2, d / 2, { frente: lado, tras: lado, dir: lado, esq: lado, topo: null, base: null });
  B.tampa([[-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]], 0.02, 'papelao_dentro');
  const ab = 0.62, ca = Math.cos(ab), sa = Math.sin(ab);
  B.esticar(B.plano([-w / 2, h, d / 2], [1, 0, 0], [0, ca, sa]), 0, w, 0, d * 0.48, 'papelao');
  B.esticar(B.plano([w / 2, h, -d / 2], [-1, 0, 0], [0, ca, -sa]), 0, w, 0, d * 0.48, 'papelao');
  B.esticar(B.plano([w / 2, h, d / 2], [0, 0, -1], [sa, ca, 0]), 0, d, 0, w * 0.46, 'papelao');
  B.esticar(B.plano([-w / 2, h, -d / 2], [0, 0, 1], [-sa, ca, 0]), 0, d, 0, w * 0.46, 'papelao');
}

/* ---- a barreira de concreto (New Jersey), 2 m ---- */
function barreira(B) {
  const L = 2.0;
  const perfil = [[-0.3, 0], [0.3, 0], [0.3, 0.07], [0.15, 0.26], [0.075, 0.8], [-0.075, 0.8], [-0.15, 0.26], [-0.3, 0.07]];
  B.extrudar(B.plano([L / 2, 0, 0], [0, 0, -1], [0, 1, 0]), perfil, L, 'concreto', 'concreto', 'concreto');
}

/* ---- a caixa de correio: o corpo de topo redondo e o pé ---- */
function correio(B) {
  const w = 0.5, h = 1.05, d = 0.45, pe = 0.12, r = w / 2;
  const cont = [[-r, pe], [r, pe], [r, h - r]];
  for (let i = 1; i < 8; i++) { const t = i / 8 * Math.PI; cont.push([r * Math.cos(t), h - r + r * Math.sin(t)]); }
  cont.push([-r, h - r]);
  B.extrudar(B.plano([0, 0, d / 2], [1, 0, 0], [0, 1, 0]), cont, d, 'correio', 'correio_lado', 'correio_lado');
  B.caixa(-r + 0.05, r - 0.05, 0, pe, -d / 2 + 0.05, d / 2 - 0.05, { todas: 'ferro' });
}

/* ---- o hidrante: o flange, o corpo, a cabeça e as três bocas ---- */
function hidrante(B) {
  B.torno(0, 0, [[0.15, 0], [0.15, 0.05], [0.1, 0.07], [0.1, 0.48], [0.13, 0.5], [0.13, 0.54], [0.09, 0.6], [0.04, 0.66], [0.0, 0.67]],
          8, 'hidrante');
  B.caixa(-0.17, 0.17, 0.33, 0.4, -0.035, 0.035, { todas: 'hidrante' });
  B.caixa(-0.045, 0.045, 0.31, 0.42, 0.0, 0.16, { todas: 'hidrante' });
  B.caixa(-0.025, 0.025, 0.66, 0.71, -0.025, 0.025, { todas: 'hidrante' });
}

function balizador(B) {
  B.torno(0, 0, [[0.065, 0], [0.065, 0.84], [0.045, 0.89], [0.0, 0.91]], 6, 'balizador');
}
function balizadorEspuma(B) {
  B.torno(0, 0, [[0.13, 0], [0.13, 0.66], [0.1, 0.73], [0.0, 0.76]], 8, 'espuma');
}
function delineador(B) {
  B.caixa(-0.19, 0.19, 0, 0.05, -0.19, 0.19, { todas: 'borracha' });
  B.torno(0, 0, [[0.05, 0.05], [0.045, 1.0], [0.03, 1.04], [0.0, 1.05]], 6, 'delineador');
}
function cone(B) {
  B.caixa(-0.18, 0.18, 0, 0.03, -0.18, 0.18, { todas: 'cone_base' });
  B.torno(0, 0, [[0.15, 0.03], [0.03, 0.52], [0.0, 0.53]], 8, 'cone');
}
function cinzeiro(B) {
  B.torno(0, 0, [[0.17, 0], [0.17, 0.72], [0.175, 0.74]], 8, 'cinzeiro');
  B.torno(0, 0, [[0.175, 0.74], [0.16, 0.8], [0.12, 0.83]], 8, 'metal');
  B.tampa(poligono(0.12, 8), 0.83, 'tampa_cinzeiro', false, { oa: -0.18, ob: -0.18 });
}

/* ---- o banco de praça: três ripas no assento, duas no encosto e os
   dois pés de ferro fundido com o braço ---- */
function banco(B) {
  const L = 1.8;
  for (const [z0, z1] of [[0.2, 0.33], [0.05, 0.18], [-0.1, 0.03]])
    B.caixa(-L / 2, L / 2, 0.43, 0.47, z0, z1, { todas: 'madeira' });
  for (const [y0, y1] of [[0.56, 0.68], [0.72, 0.84]])
    B.caixa(-L / 2, L / 2, y0, y1, -0.2, -0.16, { todas: 'madeira' });
  for (const x of [-L / 2 + 0.12, L / 2 - 0.12]) {
    B.caixa(x - 0.03, x + 0.03, 0, 0.43, 0.24, 0.3, { todas: 'ferro' });
    B.caixa(x - 0.03, x + 0.03, 0, 0.88, -0.24, -0.2, { todas: 'ferro' });
    B.caixa(x - 0.03, x + 0.03, 0.39, 0.43, -0.2, 0.3, { todas: 'ferro' });
    B.caixa(x - 0.03, x + 0.03, 0.62, 0.66, -0.2, 0.3, { todas: 'ferro' });
    B.caixa(x - 0.03, x + 0.03, 0.47, 0.62, 0.26, 0.3, { todas: 'ferro' });
  }
}

/* ---- o poste de concreto da rua, o da foto que o dono mandou: o
   fuste afunilado de 9,3 m com o colar branco no pé e as faixas
   pintadas, as duas cruzetas no alto, o braço da luminária pra rua com
   a mão-francesa e, na variante 1, a caixa do transformador do lado da
   calçada, com o cabo pendurado em laço ---- */
function poste(B, v) {
  const oct = { giro: Math.PI / 8 };
  B.torno(0, 0, [[0.25, 0], [0.25, 0.5], [0.19, 0.6]], 8, 'poste_base', oct);
  B.torno(0, 0, [[0.17, 0.6], [0.085, 9.3]], 8, 'poste_fuste', oct);
  B.torno(0, 0, [[0.085, 9.3], [0.07, 9.42], [0.0, 9.5]], 8, 'cruzeta', oct);
  for (const y of [8.55, 8.0]) B.caixa(-0.055, 0.055, y, y + 0.11, -0.9, 0.9, { todas: 'cruzeta' });
  B.caixa(-0.03, 0.03, 7.18, 7.24, 0.08, 1.05, { todas: 'cruzeta' });
  B.viga([0, 6.72, 0.1], [0, 7.18, 0.78], 0.05, 0.05, 'cruzeta');
  B.caixa(-0.14, 0.14, 7.06, 7.3, 0.85, 1.5, { todas: { k: 'luminaria', modo: 'esticar' }, base: { k: 'luminaria_lente', modo: 'esticar' } });
  if (v === 1) {
    B.caixa(-0.32, 0.32, 5.1, 5.95, -0.75, -0.11, { todas: { k: 'transformador', modo: 'esticar' } });
    const cabo = [[0.18, 5.1, -0.42], [0.2, 4.72, -0.36], [0.12, 4.55, -0.22], [0.03, 4.7, -0.12], [0.0, 4.95, -0.1]];
    for (let i = 0; i < cabo.length - 1; i++) B.viga(cabo[i], cabo[i + 1], 0.035, 0.035, 'escuro');
  }
}

const PECAS = {
  cesto, cacamba, lixeira: lixeiraRodas, saco, caixa: caixaPapelao, barreira, correio, hidrante,
  balizador, espuma: balizadorEspuma, delineador, cone, cinzeiro, banco, poste
};
/* quantas variantes de molde cada peça tem (a cor do cesto e da tampa
   entra no molde, o jeito do saco também; o poste tem ou não tem a
   caixa do transformador) */
const VARIANTES = { cesto: 5, lixeira: 5, saco: 4, caixa: 2, poste: 2 };

/* um poste em cada quatro tem transformador: o hash embaralha o ponto
   (os postes caem de 200 em 200, e um hash de multiplicar simples
   punha transformador em mais da metade) */
export function comTransformador(x, y) {
  let h = Math.imul(Math.round(x) ^ Math.imul(Math.round(y), 0x27d4eb2d), 0x9e3779b1);
  h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13;
  return (h >>> 0) % 4 === 0;
}

/* a peça montada, no referencial dela (pro visualizador do mapa, que
   mostra uma peça sozinha) */
export function moldeDaPeca(k, v = 0) {
  if (!PECAS[k]) return null;
  const B = Construtor('props');
  PECAS[k](B, v % (VARIANTES[k] || 1));
  return B;
}

function textura(caminho, aniso) {
  const cam = (typeof window !== 'undefined' && window.__EMBUTIDOS && window.__EMBUTIDOS[caminho]) || caminho;
  const t = new THREE.TextureLoader().load(cam);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

export function montarProps(P, opc = {}) {
  const K = P.CIDADE;
  const lista = K.PROPS || [];
  const moldes = new Map();
  const molde = (k, v) => {
    const vv = (v || 0) % (VARIANTES[k] || 1), chave = k + ':' + vv;
    if (!moldes.has(chave)) {
      const B = Construtor('props');
      PECAS[k](B, vv);
      moldes.set(chave, B);
    }
    return moldes.get(chave);
  };
  const pedacos = new Map();
  const objetos = [];
  /* OS POSTES DA RUA entram aqui também: a planta dá o ponto e pra que
     lado o braço aponta (a rua); um em cada quatro, pelo hash do ponto,
     tem a caixa do transformador */
  const postes = (K.POSTES || []).map(p => ({
    k: 'poste', x: p.x, y: p.y, ang: Math.atan2(p.dx, p.dz), alt0: 1.4, v: comTransformador(p.x, p.y) ? 1 : 0
  }));
  for (const p of lista.concat(postes)) {
    if (!PECAS[p.k]) continue;
    const B = molde(p.k, p.v);
    const chave = Math.floor(p.x / 1600) + ',' + Math.floor(p.y / 1600);
    if (!pedacos.has(chave)) pedacos.set(chave, { pos: [], uv: [], cor: [], ids: [] });
    const T = pedacos.get(chave);
    const id = objetos.length;
    objetos.push({ x: p.x, z: p.y, ang: 0, tipo: p.k === 'poste' ? 'alto' : 'prop' });
    for (let i = B.pos.length / 9; i > 0; i--) T.ids.push(id);
    const c = Math.cos(p.ang || 0), s = Math.sin(p.ang || 0), e = (p.s || 1) * METRO, y0 = p.alt0 || 0;
    for (let i = 0; i < B.pos.length; i += 3) {
      const lx = B.pos[i], ly = B.pos[i + 1], lz = B.pos[i + 2];
      T.pos.push(p.x + (lx * c + lz * s) * e, y0 + ly * e, p.y + (-lx * s + lz * c) * e);
    }
    for (const u of B.uv) T.uv.push(u);
    for (const k of B.cor) T.cor.push(k);
  }
  const mat = new THREE.MeshLambertMaterial({
    map: opc.semTextura ? null : textura(ATLAS.props.arquivo, opc.anisotropia || 4),
    vertexColors: true, side: THREE.DoubleSide
  });
  const meshes = [];
  let triangulos = 0;
  for (const [chave, T] of pedacos) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(T.cor, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true; m.receiveShadow = true;
    m.name = 'props:' + chave;
    m.userData.lad = { modo: 'lod', ids: Int32Array.from(T.ids), impostor: false, folha: 'props' };
    meshes.push(m);
    triangulos += T.pos.length / 9;
  }
  return { meshes, triangulos, materiais: [mat], moldes: moldes.size, pecas: lista.length, postes: postes.length, objetos };
}
