/* =========================================================
   O BAIRRO EM VOLTA DO ESTÁDIO
   ---------------------------------------------------------
   Oito quarteirões de casa, sobrado, prédio e galpão, carro na
   guia, árvore na calçada, poste. Tudo vem da planta
   (`P.LOTES`, `P.CARROS`, `P.ARVORES`): o que bloqueia na
   máscara é o que sai aqui, no mesmo retângulo. É cenário de
   fundo, então é caixa — mas caixa com telhado, janela e
   sombra de face, que é o que faz um quarteirão ler como
   quarteirão de longe e de perto. Uma malha só, cor por
   vértice, sem textura.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';

export function montarBairro(P) {
  const pos = [], cor = [];
  const tmp = new THREE.Color();
  function tri(a, b, c, hex, tom) {
    pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    tmp.set(hex).multiplyScalar(tom === undefined ? 1 : tom);
    for (let k = 0; k < 3; k++) cor.push(tmp.r, tmp.g, tmp.b);
  }
  /* caixa com sombra de face: topo claro, lados em dois tons — sem
     isso um bairro de caixas Lambert vira um bloco só */
  function caixa(x0, x1, y0, y1, z0, z1, hex) {
    const v = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],
               [x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
    const f = (a, b, c, d, tom) => { tri(v[a], v[b], v[c], hex, tom); tri(v[a], v[c], v[d], hex, tom); };
    f(4,7,6,5, 1.0);            // topo
    f(0,4,5,1, 0.9);            // norte
    f(2,6,7,3, 0.86);           // sul
    f(1,5,6,2, 0.94);           // leste
    f(3,7,4,0, 0.8);            // oeste
  }
  function piramide(cx, y0, y1, r, cz, hex) {
    const b = [[cx-r,y0,cz-r],[cx+r,y0,cz-r],[cx+r,y0,cz+r],[cx-r,y0,cz+r]];
    const t = [cx, y1, cz];
    const tons = [0.92, 0.84, 0.78, 1.0];
    for (let i = 0; i < 4; i++) tri(b[i], b[(i+1)%4], t, hex, tons[i]);
  }

  /* ---- a calçada dos quarteirões, um palmo acima da rua ---- */
  for (const q of P.QUADRAS) caixa(q.x0, q.x1, 0, 1.4, q.y0, q.y1, '#8d897d');

  /* ---- os lotes ---- */
  const TELHA = '#9a4a33', VIDRO = '#3a4652', PORTA = '#4a3a2c';
  for (const l of P.LOTES) {
    if (l.tipo === 'quintal') { caixa(l.x0, l.x1, 0, l.alt, l.y0, l.y1, l.cor); continue; }
    const x0 = l.x0 + 1, x1 = l.x1 - 1, z0 = l.y0 + 1, z1 = l.y1 - 1;
    caixa(x0, x1, 0, l.alt, z0, z1, l.cor);
    if (l.tipo === 'muro') continue;
    if (l.tipo === 'casa' || l.tipo === 'sobrado')
      caixa(x0 - 2, x1 + 2, l.alt, l.alt + 4, z0 - 2, z1 + 2, TELHA);
    if (l.tipo === 'predio')
      caixa(x0 - 1, x1 + 1, l.alt, l.alt + 3, z0 - 1, z1 + 1, '#8f8a80');
    if (l.tipo === 'galpao')
      caixa(x0 + 4, x1 - 4, l.alt, l.alt + 6, z0 + 4, z1 - 4, '#7c8285');

    /* a face da rua: onde ficam porta, janela e placa */
    const frente = l.frente;
    const larg = frente === 'n' || frente === 's' ? x1 - x0 : z1 - z0;
    const faceBox = (a0, a1, y0, y1, hex, fora) => {
      /* uma placa fina colada na face da frente, de a0 a a1 ao longo dela */
      const e = fora || 0.8;
      if (frente === 'n') caixa(x0 + a0, x0 + a1, y0, y1, z0 - e, z0 + 0.2, hex);
      else if (frente === 's') caixa(x0 + a0, x0 + a1, y0, y1, z1 - 0.2, z1 + e, hex);
      else if (frente === 'o') caixa(x0 - e, x0 + 0.2, y0, y1, z0 + a0, z0 + a1, hex);
      else caixa(x1 - 0.2, x1 + e, y0, y1, z0 + a0, z0 + a1, hex);
    };
    /* porta */
    faceBox(larg * 0.5 - 6, larg * 0.5 + 6, 0, 20, PORTA, 0.6);
    /* janelas, uma fita por andar */
    const andares = Math.max(1, Math.floor(l.alt / 26));
    for (let f = 0; f < andares; f++) {
      const y = 12 + f * 26;
      if (y + 10 > l.alt - 3) break;
      if (f === 0) {
        faceBox(6, larg * 0.5 - 12, y, y + 9, VIDRO, 0.5);
        faceBox(larg * 0.5 + 12, larg - 6, y, y + 9, VIDRO, 0.5);
      } else faceBox(6, larg - 6, y, y + 9, VIDRO, 0.5);
    }
    if (l.tipo === 'sede') {
      /* a sede da torcida: a placa por cima da porta, na cor do lado */
      faceBox(8, larg - 8, 22, 34, l.cor === '#b02a22' ? '#e0b040' : '#e6e6e6', 1.6);
      faceBox(10, larg - 10, 25, 31, l.cor, 1.9);
    }
  }

  /* ---- carros ---- */
  for (const c of P.CARROS) {
    const ao = c.x1 - c.x0 > c.y1 - c.y0;           // deitado no eixo x
    caixa(c.x0, c.x1, 1.4, 8, c.y0, c.y1, c.cor);
    tmp.set(c.cor).multiplyScalar(0.7);
    const escuro = '#' + tmp.getHexString();
    if (ao) caixa(c.x0 + 9, c.x1 - 10, 8, 13.5, c.y0 + 1.5, c.y1 - 1.5, escuro);
    else caixa(c.x0 + 1.5, c.x1 - 1.5, 8, 13.5, c.y0 + 9, c.y1 - 10, escuro);
  }

  /* ---- árvores ---- */
  for (const a of P.ARVORES) {
    caixa(a.x - 1.6, a.x + 1.6, 1.4, 15, a.y - 1.6, a.y + 1.6, '#5a4630');
    piramide(a.x, 13, 13 + a.r * 1.7, a.r, a.y, '#3f7a34');
    piramide(a.x, 13 + a.r * 0.9, 13 + a.r * 2.3, a.r * 0.62, a.y, '#4a8a3c');
  }

  /* ---- postes, nas calçadas que dão pra rua do estádio ---- */
  const POSTE = '#6b6b66';
  function poste(x, z, dx, dz) {
    caixa(x - 1.2, x + 1.2, 1.4, 46, z - 1.2, z + 1.2, POSTE);
    caixa(Math.min(x, x + dx*12) - 1, Math.max(x, x + dx*12) + 1, 44, 46,
          Math.min(z, z + dz*12) - 1, Math.max(z, z + dz*12) + 1, POSTE);
    caixa(x + dx*12 - 3, x + dx*12 + 3, 42, 44.5, z + dz*12 - 3, z + dz*12 + 3, '#e9e2c0');
  }
  for (const q of P.QUADRAS) {
    const passo = 190;
    for (let x = q.x0 + 70; x < q.x1 - 40; x += passo) {
      if (q.y1 <= P.QEST_Y0) poste(x, q.y1 - 8, 0, 1);      // quarteirões de cima: poste virado pro sul
      if (q.y0 >= P.QEST_Y1) poste(x, q.y0 + 8, 0, -1);     // de baixo: pro norte
    }
    for (let z = q.y0 + 90; z < q.y1 - 40; z += passo) {
      if (q.x1 <= P.QEST_X0) poste(q.x1 - 8, z, 1, 0);      // da esquerda: pro leste
      if (q.x0 >= P.QEST_X1) poste(q.x0 + 8, z, -1, 0);     // da direita: pro oeste
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  mesh.castShadow = true; mesh.receiveShadow = true;
  return { mesh, triangulos: pos.length / 9 };
}
