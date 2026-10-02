/* =========================================================
   O MATO SIMPLIFICADO — a vegetação em volta da cidade, em 3D
   ---------------------------------------------------------
   A mata, o cerrado, a caatinga e a mata de araucária que cercam a
   cidade, com as árvores low poly (`arvores_lowpoly.js`), sem pesar:

   - PLANTAR (`plantarMato`): uma árvore por célula de uma grade tremida,
     com o lado da célula tirado da DENSIDADE do lugar (a mata fechada tem
     uma árvore a cada 70 m²; o cerrado, a cada 200; a caatinga, a cada
     150); a espécie sai da FLORA_LP do lugar, pelo peso, e cada árvore
     tem a semente dela. `pode(x, z)` diz onde não planta (a cidade, a
     estrada, o mar).
   - MONTAR (`montarMato`): as árvores juntadas em LADRILHOS de 40 m, e
     cada ladrilho com duas malhas — a de perto (cada árvore inteira) e a
     de longe (a versão de 20 a 50 triângulos de cada uma). Quem desenha
     põe as duas num THREE.LOD com o centro no meio do ladrilho: a menos
     de LONGE_M (60 m) da câmera sai a de perto; mais longe, a de longe.
     Uma chamada de desenho por ladrilho, não por árvore.

   Tudo em metros; `noMundo` converte. A mesma semente dá o mesmo mato.
   ========================================================= */
import { METRO, noMundo, sorteio } from './construtor3d.js';
import { facesDaArvore, especieLowpolyDe } from './arvores_lowpoly.js';

/* a área de chão de cada árvore (m²), por lugar */
export const DENSIDADE = { mata: 70, cerrado: 200, caatinga: 150, sul: 90, praia: 120, cidade: 250 };
/* a distância (m) em que a árvore troca da de perto pra de longe */
export const LONGE_M = 60;
/* o lado (m) do ladrilho */
export const LADRILHO_M = 40;

/* PLANTAR a área [x0, x1] × [z0, z1] (m): a lista de árvores
   { x, z, especie, semente, giro } */
export function plantarMato({ x0, x1, z0, z1, lugar = 'mata', densidade, semente = 1, pode = () => true }) {
  const rnd = sorteio(semente * 48271 + 11);
  const d = Math.sqrt(densidade || DENSIDADE[lugar] || 100), out = [];
  for (let x = x0 + d / 2; x < x1; x += d) for (let z = z0 + d / 2; z < z1; z += d) {
    /* o sorteio sai sempre, plantando ou não: tirar um pedaço do mato
       (a estrada nova) não muda a árvore do lado */
    const px = x + (rnd() - 0.5) * d * 0.85, pz = z + (rnd() - 0.5) * d * 0.85;
    const especie = especieLowpolyDe(lugar, rnd), sem = 1 + Math.floor(rnd() * 1e6), giro = rnd() * 2 * Math.PI;
    if (px < x0 || px > x1 || pz < z0 || pz > z1 || !pode(px, pz)) continue;
    out.push({ x: px, z: pz, especie, semente: sem, giro });
  }
  return out;
}

/* MONTAR o mato em ladrilhos: cada um com o centro (m), os blocos de
   perto e de longe (`{ lowpoly: [...] }`, em unidades de mundo) e as
   contas (árvores, triângulos de perto, triângulos de longe) */
export function montarMato(arvores, { lado = LADRILHO_M } = {}) {
  const ladrilhos = new Map();
  for (const a of arvores) {
    const i = Math.floor(a.x / lado), j = Math.floor(a.z / lado), chave = i + ',' + j;
    let t = ladrilhos.get(chave);
    if (!t) ladrilhos.set(chave, t = { i, j, cx: (i + 0.5) * lado, cz: (j + 0.5) * lado, perto: {}, longe: {}, arvores: 0, triPerto: 0, triLonge: 0 });
    const r = facesDaArvore(a.especie, a.semente);
    const onde = { x: a.x * METRO, z: a.z * METRO, giro: a.giro };
    noMundo({ lowpoly: r.perto }, t.perto, onde);
    noMundo({ lowpoly: r.longe }, t.longe, onde);
    t.arvores++; t.triPerto += r.perto.pos.length / 9; t.triLonge += r.longe.pos.length / 9;
  }
  return [...ladrilhos.values()];
}
