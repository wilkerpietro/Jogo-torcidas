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
  /* o retângulo legal da peça que está sendo montada: nada de casa por
     cima da calçada, então beiral, janela, porta e placa saem cortados
     pelo miolo do quarteirão. Fora de um lote, `limite` é nulo. */
  let limite = null;
  function caixa(T, x0, x1, y0, y1, z0, z1, hex) {
    if (limite) {
      x0 = Math.max(x0, limite.x0); x1 = Math.min(x1, limite.x1);
      z0 = Math.max(z0, limite.y0); z1 = Math.min(z1, limite.y1);
      if (x1 - x0 < 0.05 || z1 - z0 < 0.05) return;
    }
    caixaV(T, [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],
               [x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]], hex);
  }
  /* ---- a laje da calçada, recortada pelas avenidas ----
     Recorta um polígono convexo pelo meio-plano n·p <= d. O que sobra
     continua convexo, então dá pra ir cortando banda por banda: é
     exato, e é o que deixa a calçada chegar até a guia da avenida sem
     nunca passar por cima do asfalto. */
  function corta(pol, nx, nz, d) {
    const out = [];
    for (let i = 0; i < pol.length; i++) {
      const a = pol[i], b = pol[(i + 1) % pol.length];
      const da = nx * a[0] + nz * a[1] - d, db = nx * b[0] + nz * b[1] - d;
      if (da <= 0) out.push(a);
      if ((da < 0) !== (db < 0)) {
        const t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }
  /* o chão parte do retângulo JÁ RECORTADO PELA COSTA: quarteirão da
     orla acaba na guia da beira-mar, não em cima da areia */
  function semAsAvenidas(ret, folga) {
    const base = Array.isArray(ret) ? ret : K.recorteCosta(ret);
    if (base.length < 3) return [];
    let pecas = [base];
    const cantos = base;
    for (const av of K.AVENIDAS) {
      const meia = av.l / 2 + (folga || 0);
      for (const sg of av.segs) {
        const nx = -sg.uy, nz = sg.ux, c = nx * sg.x0 + nz * sg.y0;
        const ds = cantos.map(([x, z]) => nx * x + nz * z - c);
        if (Math.min(...ds) > meia || Math.max(...ds) < -meia) continue;
        const ts = cantos.map(([x, z]) => (x - sg.x0) * sg.ux + (z - sg.y0) * sg.uy);
        if (Math.max(...ts) < -meia || Math.min(...ts) > sg.L + meia) continue;
        const novas = [];
        for (const p of pecas) {
          const esq = corta(p, nx, nz, c - meia);
          const dir = corta(p, -nx, -nz, -(c + meia));
          if (esq.length >= 3) novas.push(esq);
          if (dir.length >= 3) novas.push(dir);
        }
        pecas = novas;
      }
    }
    return pecas;
  }
  /* um prisma reto a partir de um polígono convexo: tampa e paredinha.
     O retângulo vem no sentido horário visto de cima; invertido, a
     tampa olha pra cima e as paredinhas olham pra fora. */
  function laje(T, entrada, y0, y1, hex) {
    const pol = entrada.slice().reverse();
    for (let i = 1; i < pol.length - 1; i++)
      tri(T, [pol[0][0], y1, pol[0][1]], [pol[i][0], y1, pol[i][1]], [pol[i+1][0], y1, pol[i+1][1]], hex, TONS[0]);
    for (let i = 0; i < pol.length; i++) {
      const a = pol[i], b = pol[(i + 1) % pol.length];
      const tom = Math.abs(a[0] - b[0]) > Math.abs(a[1] - b[1]) ? TONS[1] : TONS[3];
      tri(T, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], hex, tom);
      tri(T, [a[0], y0, a[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], hex, tom);
    }
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
  function malhaUV(T, tex) {
    if (!T.pos.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({
      map: tex, alphaTest: 0.45, side: THREE.DoubleSide
    }));
    m.receiveShadow = true;
    triangulos += T.pos.length / 9;
    meshes.push(m);
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

  /* ---- OS LETREIROS E AS PIXAÇÕES ----
     Texto não sai de caixa: sai de textura. Todos os dizeres que a
     planta pôs nos lotes viram um atlas só, e cada dizer vira um
     quadrado rente à parede — 0,1 à frente dela, e sempre pra dentro
     da divisa do lote, que é a regra da casa. Letreiro tem fundo
     pintado; pixação é tinta direta, fundo transparente, e o recorte
     por alfa evita ter de ordenar transparência. */
  const FUNDOS_PLACA = ['#c8342b','#1f5aa8','#e0a52a','#1d7a4a','#f0ede4','#2b2b2b','#7a2f86','#d96a1f'];
  const TINTAS_PIXO = ['#2a2a28','#1c2a44','#3a1f1f','#23331f'];
  const somaTexto = t => { let h = 7; for(let k=0;k<t.length;k++) h = (h*31 + t.charCodeAt(k)) >>> 0; return h; };

  function montarAtlas(dizeres) {
    const LARG = 256, ALT = 64, COLS = 4;
    const linhas = Math.max(1, Math.ceil(dizeres.length / COLS));
    const cv = document.createElement('canvas');
    cv.width = COLS * LARG;
    cv.height = Math.pow(2, Math.ceil(Math.log2(linhas * ALT)));
    const c = cv.getContext('2d');
    const uv = new Map();
    dizeres.forEach((d, k) => {
      const x = (k % COLS) * LARG, y = ((k / COLS) | 0) * ALT;
      const h = somaTexto(d.texto);
      c.save();
      c.beginPath(); c.rect(x, y, LARG, ALT); c.clip();
      if (d.placa) {
        const fundo = FUNDOS_PLACA[h % FUNDOS_PLACA.length];
        c.fillStyle = fundo; c.fillRect(x, y, LARG, ALT);
        const claro = fundo === '#f0ede4' || fundo === '#e0a52a';
        c.strokeStyle = claro ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.35)';
        c.lineWidth = 4; c.strokeRect(x + 4, y + 4, LARG - 8, ALT - 8);
        c.fillStyle = claro ? '#20201c' : '#f6f3ea';
        c.font = 'bold 34px "Arial Narrow", Arial, sans-serif';
      } else {
        c.fillStyle = TINTAS_PIXO[h % TINTAS_PIXO.length];
        c.font = 'italic bold 36px "Arial Narrow", Arial, sans-serif';
        c.translate(x + LARG/2, y + ALT/2);
        c.rotate(((h >> 4) % 5 - 2) * 0.012);
        c.translate(-(x + LARG/2), -(y + ALT/2));
      }
      c.textAlign = 'center'; c.textBaseline = 'middle';
      /* encolhe até caber: nome de comércio brasileiro é comprido */
      let tam = d.placa ? 34 : 36;
      while (tam > 12 && c.measureText(d.texto).width > LARG - 26) {
        tam -= 2;
        c.font = (d.placa ? 'bold ' : 'italic bold ') + tam + 'px "Arial Narrow", Arial, sans-serif';
      }
      c.fillText(d.texto, x + LARG/2, y + ALT/2 + 2);
      c.restore();
      uv.set(d.chave, [x / cv.width, 1 - (y + ALT) / cv.height, (x + LARG) / cv.width, 1 - y / cv.height]);
    });
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { tex, uv };
  }

  /* um quadrado com textura, de pé, olhando pra fora em (ox, oz).
     A direção no plano sai da normal: d × cima = fora. */
  function placa(T, cx, cy, cz, ox, oz, larg, alt, u, desloc) {
    const dx = oz, dz = -ox, s = desloc || 0;
    const mx = cx + dx * s, mz = cz + dz * s;
    const hx = dx * larg / 2, hz = dz * larg / 2, y0 = cy - alt / 2, y1 = cy + alt / 2;
    const a = [mx - hx, y0, mz - hz], b = [mx + hx, y0, mz + hz];
    const d = [mx - hx, y1, mz - hz], e = [mx + hx, y1, mz + hz];
    const p = (v, s, t) => { T.pos.push(v[0], v[1], v[2]); T.uv.push(s, t); };
    p(a, u[0], u[1]); p(b, u[2], u[1]); p(e, u[2], u[3]);
    p(a, u[0], u[1]); p(e, u[2], u[3]); p(d, u[0], u[3]);
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
    faceBox(larg * 0.5 - 6, larg * 0.5 + 6, 0, l.placa ? 17 : 20, PORTA, 0.6);
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
    /* Três chãos, um por cima do outro: a CALÇADA vai da guia da rua
       até a guia da avenida; o CHÃO DO LOTE cobre o miolo e para na
       calçada da avenida (sem isso a sobra em cunha que a avenida
       deixa no quarteirão lê como um descampado de cimento); e o
       QUINTAL, mais alto, no meio. */
    for (const p of semAsAvenidas(q)) laje(T, p, 0, 1.4, '#8d897d');
    for (const p of semAsAvenidas(q.polMiolo, K.CALC)) laje(T, p, 0, 1.6, '#7d7668');
    if (q.quintal) for (const p of semAsAvenidas(q.quintal, K.CALC)) laje(T, p, 0, q.quintal.alt, q.quintal.cor);
    for (const l of q.lotes) {
      limite = l.ang ? null : { x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 };
      lote(T, l);
      limite = null;
    }
    for (const a of q.arvores || []) arvore(T, a);
  }
  for (const T of pedacos.values()) malha(T, true);

  /* ---- os dizeres ---- */
  const dizeres = new Map();
  for (const l of K.LOTES) {
    for (const [texto, ehPlaca] of [[l.placa, true], [l.pixacao, false]]) {
      if (!texto) continue;
      const chave = (ehPlaca ? 'P:' : 'X:') + texto;
      if (!dizeres.has(chave)) dizeres.set(chave, { chave, texto, placa: ehPlaca });
    }
  }
  if (dizeres.size) {
    const { tex, uv } = montarAtlas([...dizeres.values()]);
    const TL = { pos: [], uv: [] };
    for (const l of K.LOTES) {
      /* a frente do lote: pra onde ela olha, onde fica a parede e
         quanto mede — o lote axial pela sua frente, o da avenida pelo
         eixo local dele */
      let ox, oz, px, pz, frente;
      if (l.ang) {
        const c = Math.cos(l.ang), sn = Math.sin(l.ang), vf = l.vf || -1;
        ox = -sn * vf; oz = c * vf;
        const v = vf * (l.h / 2 - 0.9);
        px = l.cx - v * sn; pz = l.cy + v * c;
        frente = l.w - 2;
      } else {
        const meiox = (l.x0 + l.x1) / 2, meioz = (l.y0 + l.y1) / 2;
        if (l.frente === 'n') { ox = 0; oz = -1; px = meiox; pz = l.y0 + 0.9; frente = l.x1 - l.x0; }
        else if (l.frente === 's') { ox = 0; oz = 1; px = meiox; pz = l.y1 - 0.9; frente = l.x1 - l.x0; }
        else if (l.frente === 'o') { ox = -1; oz = 0; px = l.x0 + 0.9; pz = meioz; frente = l.y1 - l.y0; }
        else { ox = 1; oz = 0; px = l.x1 - 0.9; pz = meioz; frente = l.y1 - l.y0; }
      }
      if (frente < 26) continue;
      if (l.placa) {
        const larg = Math.min(frente - 8, 76), alt = Math.min(13, larg / 4.6);
        const y = Math.min(26, Math.max(18, l.alt - 5 - alt)) + alt / 2;
        placa(TL, px, y, pz, ox, oz, larg, alt, uv.get('P:' + l.placa));
      }
      if (l.pixacao) {
        /* a pixação não pode passar da parede: em muro de 12 ela tem de
           caber nos 12, senão sobra tinta boiando no ar */
        const larg = Math.min(frente - 12, 50);
        const alt = Math.min(9, larg / 5, l.alt - 4);
        if (alt < 4) continue;
        /* baixa, abaixo da linha das janelas, e fora do meio: pixação
           não se alinha com a porta */
        const y = Math.min(l.alt - 2 - alt / 2, 3 + alt / 2);
        const folga = Math.max(0, (frente - larg) / 2 - 2);
        const lado = somaTexto(l.pixacao) % 2 ? 1 : -1;
        placa(TL, px, y, pz, ox, oz, larg, alt, uv.get('X:' + l.pixacao), lado * folga * 0.7);
      }
    }
    malhaUV(TL, tex);
  }

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
