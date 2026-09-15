/* =========================================================
   A CIDADE EM VOLTA DO ESTÁDIO
   ---------------------------------------------------------
   Quarteirões de casa de telha, sobrado, prédio e galpão, as
   casas rotacionadas na frente das avenidas, carro na guia,
   árvore na calçada, poste, os dois campos de várzea com cerca
   e arquibancadinha, e o mato com as moitas. Tudo vem da planta
   (`P.CIDADE`): o que bloqueia na máscara é o que sai aqui, no
   mesmo lugar. É cenário de fundo, então é caixa — com telhado,
   janela e sombra de face, que é o que faz quarteirão ler como
   quarteirão. Cor por vértice, sem textura.

   EM PEDAÇOS: os quarteirões saem em malhas de 4 × 4 células, e
   não numa só — é o que deixa a câmera descartar o que está
   fora do quadro, que numa cidade desse tamanho é quase tudo.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';

export function montarBairro(P) {
  const K = P.CIDADE;
  const meshes = [];
  let triangulos = 0;
  const tmp = new THREE.Color();
  const Tecido = () => ({ pos: [], cor: [] });

  function tri(T, a, b, c, hex, tom) {
    T.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    tmp.set(hex).multiplyScalar(tom === undefined ? 1 : tom);
    for (let k = 0; k < 3; k++) T.cor.push(tmp.r, tmp.g, tmp.b);
  }
  /* caixa com sombra de face: topo claro, lados em dois tons — sem
     isso um bairro de caixas Lambert vira um bloco só */
  const TONS = [1.0, 0.9, 0.86, 0.94, 0.8];
  function caixaV(T, v, hex) {
    const f = (a, b, c, d, tom) => { tri(T, v[a], v[b], v[c], hex, tom); tri(T, v[a], v[c], v[d], hex, tom); };
    f(4,7,6,5, TONS[0]); f(0,4,5,1, TONS[1]); f(2,6,7,3, TONS[2]); f(1,5,6,2, TONS[3]); f(3,7,4,0, TONS[4]);
  }
  function caixa(T, x0, x1, y0, y1, z0, z1, hex) {
    caixaV(T, [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],
               [x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]], hex);
  }
  /* caixa girada de `ang` em torno do centro (cx, cz) */
  function caixaRot(T, cx, cz, w, h, y0, y1, ang, hex) {
    const c = Math.cos(ang), s = Math.sin(ang), hw = w / 2, hh = h / 2;
    const p = (u, v, y) => [cx + u * c - v * s, y, cz + u * s + v * c];
    caixaV(T, [p(-hw,-hh,y0), p(hw,-hh,y0), p(hw,hh,y0), p(-hw,hh,y0),
               p(-hw,-hh,y1), p(hw,-hh,y1), p(hw,hh,y1), p(-hw,hh,y1)], hex);
  }
  function piramide(T, cx, y0, y1, r, cz, hex) {
    const b = [[cx-r,y0,cz-r],[cx+r,y0,cz-r],[cx+r,y0,cz+r],[cx-r,y0,cz+r]];
    const t = [cx, y1, cz];
    const tons = [0.92, 0.84, 0.78, 1.0];
    for (let i = 0; i < 4; i++) tri(T, b[i], b[(i+1)%4], t, hex, tons[i]);
  }
  function malha(T, sombra) {
    if (!T.pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(T.cor, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    m.castShadow = !!sombra; m.receiveShadow = true;
    triangulos += T.pos.length / 9;
    meshes.push(m);
    return m;
  }

  /* ---- um lote ---- */
  const TELHA = '#9a4a33', VIDRO = '#3a4652', PORTA = '#4a3a2c';
  function lote(T, l) {
    if (l.ang) {
      /* casa da avenida: corpo, telhado e uma faixa de janela na frente */
      caixaRot(T, l.cx, l.cy, l.w - 2, l.h - 2, 0, l.alt, l.ang, l.cor);
      if (l.tipo === 'casa' || l.tipo === 'sobrado') caixaRot(T, l.cx, l.cy, l.w + 2, l.h + 2, l.alt, l.alt + 4, l.ang, TELHA);
      else if (l.tipo !== 'muro') caixaRot(T, l.cx, l.cy, l.w, l.h, l.alt, l.alt + 3, l.ang, '#8f8a80');
      return;
    }
    const x0 = l.x0 + 1, x1 = l.x1 - 1, z0 = l.y0 + 1, z1 = l.y1 - 1;
    caixa(T, x0, x1, 0, l.alt, z0, z1, l.cor);
    if (l.tipo === 'muro') return;
    if (l.tipo === 'casa' || l.tipo === 'sobrado') caixa(T, x0 - 2, x1 + 2, l.alt, l.alt + 4, z0 - 2, z1 + 2, TELHA);
    if (l.tipo === 'predio' || l.tipo === 'sede') caixa(T, x0 - 1, x1 + 1, l.alt, l.alt + 3, z0 - 1, z1 + 1, '#8f8a80');
    if (l.tipo === 'galpao') caixa(T, x0 + 4, x1 - 4, l.alt, l.alt + 6, z0 + 4, z1 - 4, '#7c8285');
    const frente = l.frente;
    const larg = frente === 'n' || frente === 's' ? x1 - x0 : z1 - z0;
    const faceBox = (a0, a1, y0, y1, hex, fora) => {
      const e = fora || 0.8;
      if (frente === 'n') caixa(T, x0 + a0, x0 + a1, y0, y1, z0 - e, z0 + 0.2, hex);
      else if (frente === 's') caixa(T, x0 + a0, x0 + a1, y0, y1, z1 - 0.2, z1 + e, hex);
      else if (frente === 'o') caixa(T, x0 - e, x0 + 0.2, y0, y1, z0 + a0, z0 + a1, hex);
      else caixa(T, x1 - 0.2, x1 + e, y0, y1, z0 + a0, z0 + a1, hex);
    };
    faceBox(larg * 0.5 - 6, larg * 0.5 + 6, 0, 20, PORTA, 0.6);
    const andares = Math.max(1, Math.floor(l.alt / 26));
    for (let f = 0; f < andares; f++) {
      const y = 12 + f * 26;
      if (y + 10 > l.alt - 3) break;
      if (f === 0) { faceBox(6, larg * 0.5 - 12, y, y + 9, VIDRO, 0.5); faceBox(larg * 0.5 + 12, larg - 6, y, y + 9, VIDRO, 0.5); }
      else faceBox(6, larg - 6, y, y + 9, VIDRO, 0.5);
    }
    if (l.tipo === 'sede') {
      faceBox(8, larg - 8, 22, 34, l.lado === 'mandante' ? '#e0b040' : '#e6e6e6', 1.6);
      faceBox(10, larg - 10, 25, 31, l.cor, 1.9);
    }
  }
  /* copa arredondada: uma pirâmide pra cima e outra pra baixo, base com
     base — de longe é uma bola, e é o que a árvore de rua do mapa é */
  function arvore(T, a) {
    caixa(T, a.x - 1.6, a.x + 1.6, 1.4, 16, a.y - 1.6, a.y + 1.6, '#5a4630');
    const meio = 14 + a.r * 0.8;
    piramide(T, a.x, meio, meio + a.r * 1.1, a.r, a.y, '#3f7a34');
    piramide(T, a.x, meio, meio - a.r * 0.8, a.r, a.y, '#356b2c');
  }

  /* ---- os quarteirões, em pedaços de 4 × 4 células ---- */
  const pedacos = new Map();
  for (const q of K.QUADRAS) {
    const k = (q.i >> 2) + ',' + (q.j >> 2);
    if (!pedacos.has(k)) pedacos.set(k, Tecido());
    const T = pedacos.get(k);
    /* a calçada, um palmo acima da rua — menos onde uma avenida corta o
       quarteirão: ali a laje cobriria a avenida, e fica só a pintura */
    if (!q.cortada) caixa(T, q.x0, q.x1, 0, 1.4, q.y0, q.y1, '#8d897d');
    if (q.quintal && !q.cortada) caixa(T, q.quintal.x0, q.quintal.x1, 0, q.quintal.alt, q.quintal.y0, q.quintal.y1, q.quintal.cor);
    for (const l of q.lotes) lote(T, l);
    for (const a of q.arvores || []) arvore(T, a);
  }
  for (const T of pedacos.values()) malha(T, true);

  /* ---- os soltos: carros, postes, campos ---- */
  const TS = Tecido();
  for (const c of K.CARROS) {
    const ao = c.x1 - c.x0 > c.y1 - c.y0;
    caixa(TS, c.x0, c.x1, 1.4, 8, c.y0, c.y1, c.cor);
    tmp.set(c.cor).multiplyScalar(0.7);
    const escuro = '#' + tmp.getHexString();
    if (ao) caixa(TS, c.x0 + 9, c.x1 - 10, 8, 13.5, c.y0 + 1.5, c.y1 - 1.5, escuro);
    else caixa(TS, c.x0 + 1.5, c.x1 - 1.5, 8, 13.5, c.y0 + 9, c.y1 - 10, escuro);
  }
  const POSTE = '#6b6b66';
  for (const p of K.POSTES) {
    caixa(TS, p.x - 1.2, p.x + 1.2, 1.4, 46, p.y - 1.2, p.y + 1.2, POSTE);
    caixa(TS, Math.min(p.x, p.x + p.dx*12) - 1, Math.max(p.x, p.x + p.dx*12) + 1, 44, 46,
          Math.min(p.y, p.y + p.dz*12) - 1, Math.max(p.y, p.y + p.dz*12) + 1, POSTE);
    caixa(TS, p.x + p.dx*12 - 3, p.x + p.dx*12 + 3, 42, 44.5, p.y + p.dz*12 - 3, p.y + p.dz*12 + 3, '#e9e2c0');
  }
  /* os campos de várzea: cerca de mourão e arame, arquibancadinha, traves */
  for (const f of K.CAMPOS) {
    const CER = '#6e6a5e';
    const lados = [[f.x0, f.y0, f.x1, f.y0, 'n'], [f.x0, f.y1, f.x1, f.y1, 's'], [f.x0, f.y0, f.x0, f.y1, 'o'], [f.x1, f.y0, f.x1, f.y1, 'l']];
    for (const [ax, az, bx, bz, lado] of lados) {
      const L = Math.hypot(bx - ax, bz - az), n = Math.round(L / 36);
      for (let k = 0; k <= n; k++) {
        const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        if ((lado === 'n' || lado === 's') && Math.abs(x - f.cx) < K.PORTEIRA / 2 + 6) continue;
        caixa(TS, x - 1.2, x + 1.2, 0, 14, z - 1.2, z + 1.2, CER);
      }
      /* o arame de cima, como uma régua fina */
      if (lado === 'n' || lado === 's') {
        caixa(TS, ax, f.cx - K.PORTEIRA / 2 - 6, 12, 13, az - 0.4, az + 0.4, CER);
        caixa(TS, f.cx + K.PORTEIRA / 2 + 6, bx, 12, 13, az - 0.4, az + 0.4, CER);
      } else caixa(TS, ax - 0.4, ax + 0.4, 12, 13, az, bz, CER);
    }
    const A = K.ARQ_VARZEA, h = f.y1 - f.y0;
    for (let k = 0; k < 3; k++) {
      const prof = A.fundo / 3;
      if (f.ladoArq === 'o') caixa(TS, f.x0 + K.CERCA + k * prof, f.x0 + K.CERCA + (k + 1) * prof, 0, A.alt - k * 7, f.cy - h * 0.3, f.cy + h * 0.3, '#a8a396');
      else caixa(TS, f.x1 - K.CERCA - (k + 1) * prof, f.x1 - K.CERCA - k * prof, 0, A.alt - k * 7, f.cy - h * 0.3, f.cy + h * 0.3, '#a8a396');
    }
    for (const s of [-1, 1]) {
      const x = s < 0 ? f.x0 + 22 : f.x1 - 22;
      caixa(TS, x - 1, x + 1, 0, 16, f.cy - 24, f.cy - 22, '#eeeeea');
      caixa(TS, x - 1, x + 1, 0, 16, f.cy + 22, f.cy + 24, '#eeeeea');
      caixa(TS, x - 1, x + 1, 15, 16.5, f.cy - 24, f.cy + 24, '#eeeeea');
    }
  }
  malha(TS, true);

  /* ---- o mato: moitas, em duas pirâmides baixas ---- */
  const TM = Tecido();
  for (const m of K.MOITAS) {
    piramide(TM, m.x, 0, m.r * 0.9, m.r * 0.8, m.y, '#5d7746');
    piramide(TM, m.x + m.r * 0.5, 0, m.r * 0.6, m.r * 0.5, m.y - m.r * 0.3, '#52693e');
  }
  malha(TM, false);

  return { meshes, triangulos, pedacos: pedacos.size };
}
