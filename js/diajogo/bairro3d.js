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
  /* a laje da calçada vem recortada da planta: o retângulo menos as
     bandas das avenidas, que é a mesma conta que a máscara usa */
  const semAsAvenidas = (ret, folga) => K.pedacosSemAvenida(ret, folga);
  /* uma tampa plana, sem paredinha: é o chão da pracinha, que já
     assenta sobre o chão do lote */
  function tampa(T, x0, x1, y, y0, y1, hex) {
    tri(T, [x0, y, y1], [x1, y, y1], [x1, y, y0], hex, TONS[0]);
    tri(T, [x0, y, y1], [x1, y, y0], [x0, y, y0], hex, TONS[0]);
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
      map: tex, alphaTest: 0.45, side: THREE.FrontSide
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
        /* borda forte no fundo claro: letreiro bege em parede bege some */
        c.strokeStyle = claro ? 'rgba(40,36,28,.75)' : 'rgba(255,255,255,.35)';
        c.lineWidth = claro ? 7 : 4; c.strokeRect(x + 4, y + 4, LARG - 8, ALT - 8);
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

  /* ---- TELHADO DE DUAS ÁGUAS ----
     Duas rampas que se encontram na cumeeira, com as empenas fechando
     as pontas. A cumeeira corre no lado MAIOR, que é como se cobre
     casa de rua. Caixa chapada em cima de caixa lia como laje; com
     queda a casa vira casa. */
  function aguas(T, A, B, C, D, E, F, hex) {
    const q = (a, b, c, d, tom) => { tri(T, a, b, c, hex, tom); tri(T, a, c, d, hex, tom); };
    q(A, E, F, B, TONS[1]);                       // a água de um lado
    q(C, F, E, D, TONS[3]);                       // a do outro
    tri(T, A, D, E, hex, TONS[4]);                // empena
    tri(T, B, F, C, hex, TONS[2]);                // e a outra
  }
  function telhado(T, x0, x1, z0, z1, y0, h, hex) {
    if (x1 - x0 < 1 || z1 - z0 < 1) return;
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    const p = (x, y, z) => [x, y, z];
    if (x1 - x0 >= z1 - z0)
      aguas(T, p(x0,y0,z0), p(x1,y0,z0), p(x1,y0,z1), p(x0,y0,z1),
               p(x0,y0+h,mz), p(x1,y0+h,mz), hex);
    else
      aguas(T, p(x0,y0,z1), p(x0,y0,z0), p(x1,y0,z0), p(x1,y0,z1),
               p(mx,y0+h,z1), p(mx,y0+h,z0), hex);
  }
  function telhadoRot(T, cx, cz, w, d, y0, h, ang, hex) {
    const c = Math.cos(ang), s = Math.sin(ang), hw = w/2, hd = d/2;
    const p = (u, v, y) => [cx + u*c - v*s, y, cz + u*s + v*c];
    if (w >= d)
      aguas(T, p(-hw,-hd,y0), p(hw,-hd,y0), p(hw,hd,y0), p(-hw,hd,y0),
               p(-hw,0,y0+h), p(hw,0,y0+h), hex);
    else
      aguas(T, p(-hw,hd,y0), p(-hw,-hd,y0), p(hw,-hd,y0), p(hw,hd,y0),
               p(0,hd,y0+h), p(0,-hd,y0+h), hex);
  }

  /* ---- um lote ---- */
  const TELHA = '#9a4a33', VIDRO = '#3a4652', PORTA = '#4a3a2c';
  const PORTA_ALT = 46;          // 2,1 m: o boneco tem 39 e passa em pé
  function lote(T, l) {
    if (l.ang) {
      /* casa da avenida: corpo, telhado e uma faixa de janela na frente */
      caixaRot(T, l.cx, l.cy, l.w - 2, l.h - 2, 0, l.alt, l.ang, l.cor);
      if (l.tipo === 'casa' || l.tipo === 'sobrado')
        telhadoRot(T, l.cx, l.cy, l.w + 2, l.h + 2, l.alt, Math.min(l.h, 46) * 0.42, l.ang, TELHA);
      else if (l.tipo === 'galpao')
        telhadoRot(T, l.cx, l.cy, l.w, l.h, l.alt, Math.min(l.h, 46) * 0.24, l.ang, '#7c8285');
      else if (l.tipo !== 'muro') caixaRot(T, l.cx, l.cy, l.w, l.h, l.alt, l.alt + 4, l.ang, '#8f8a80');
      return;
    }
    const x0 = l.x0 + 1, x1 = l.x1 - 1, z0 = l.y0 + 1, z1 = l.y1 - 1;
    caixa(T, x0, x1, 0, l.alt, z0, z1, l.cor);
    if (l.tipo === 'muro') return;
    /* o beiral sai 2 do corpo, mas cortado pelo miolo do quarteirão —
       telhado por cima da calçada é o que não pode */
    const bx0 = Math.max(x0 - 2, limite ? limite.x0 : -1e9), bx1 = Math.min(x1 + 2, limite ? limite.x1 : 1e9);
    const bz0 = Math.max(z0 - 2, limite ? limite.y0 : -1e9), bz1 = Math.min(z1 + 2, limite ? limite.y1 : 1e9);
    const queda = Math.min(bx1 - bx0, bz1 - bz0) * 0.42;
    if (l.tipo === 'casa' || l.tipo === 'sobrado') telhado(T, bx0, bx1, bz0, bz1, l.alt, Math.min(queda, 52), TELHA);
    if (l.tipo === 'predio' || l.tipo === 'sede') caixa(T, x0 - 1, x1 + 1, l.alt, l.alt + 5, z0 - 1, z1 + 1, '#8f8a80');
    if (l.tipo === 'galpao') telhado(T, x0 + 2, x1 - 2, z0 + 2, z1 - 2, l.alt, Math.min(queda, 30), '#7c8285');
    const frente = l.frente;
    const larg = frente === 'n' || frente === 's' ? x1 - x0 : z1 - z0;
    const faceBox = (a0, a1, y0, y1, hex, fora) => {
      const e = fora || 0.8;
      if (frente === 'n') caixa(T, x0 + a0, x0 + a1, y0, y1, z0 - e, z0 + 0.2, hex);
      else if (frente === 's') caixa(T, x0 + a0, x0 + a1, y0, y1, z1 - 0.2, z1 + e, hex);
      else if (frente === 'o') caixa(T, x0 - e, x0 + 0.2, y0, y1, z0 + a0, z0 + a1, hex);
      else caixa(T, x1 - 0.2, x1 + e, y0, y1, z0 + a0, z0 + a1, hex);
    };
    faceBox(larg * 0.5 - 10, larg * 0.5 + 10, 0, Math.min(PORTA_ALT, l.alt - 6), PORTA, 0.6);
    /* um andar a cada 2,6 m, com peitoril a 1,2 e janela de 1,1 */
    const andares = Math.max(1, Math.floor(l.alt / 58));
    for (let f = 0; f < andares; f++) {
      const y = 26 + f * 58;
      if (y + 26 > l.alt - 8) break;
      if (f === 0) { faceBox(8, larg * 0.5 - 16, y, y + 24, VIDRO, 0.5); faceBox(larg * 0.5 + 16, larg - 8, y, y + 24, VIDRO, 0.5); }
      else faceBox(8, larg - 8, y, y + 24, VIDRO, 0.5);
    }
    if (l.tipo === 'sede') {
      faceBox(8, larg - 8, 54, 78, l.lado === 'mandante' ? '#e0b040' : '#e6e6e6', 1.6);
      faceBox(12, larg - 12, 60, 72, l.cor, 1.9);
    }
  }
  /* copa arredondada: uma pirâmide pra cima e outra pra baixo, base com
     base — de longe é uma bola, e é o que a árvore de rua do mapa é */
  function arvore(T, a) {
    /* árvore de rua de verdade tem uns 5 m: o tronco sobe acima da
       cabeça antes de abrir a copa */
    const galho = 26 + a.r * 1.2, copa = a.r * 3.1;
    caixa(T, a.x - 2.4, a.x + 2.4, 0, galho + copa * 0.3, a.y - 2.4, a.y + 2.4, '#5a4630');
    piramide(T, a.x, galho, galho + copa, a.r, a.y, '#3f7a34');
    piramide(T, a.x, galho, galho - a.r * 0.9, a.r, a.y, '#356b2c');
  }

  /* poste de rua: mastro, braço e a luminária na ponta */
  const POSTE = '#6b6b66';
  function poste(T, p) {
    const H = 116, B = 22;                     // 5,2 m de mastro, braço de 1 m
    caixa(T, p.x - 1.8, p.x + 1.8, 0, H, p.y - 1.8, p.y + 1.8, POSTE);
    caixa(T, Math.min(p.x, p.x + p.dx*B) - 1.4, Math.max(p.x, p.x + p.dx*B) + 1.4, H - 4, H,
          Math.min(p.y, p.y + p.dz*B) - 1.4, Math.max(p.y, p.y + p.dz*B) + 1.4, POSTE);
    caixa(T, p.x + p.dx*B - 5, p.x + p.dx*B + 5, H - 8, H - 3.5, p.y + p.dz*B - 5, p.y + p.dz*B + 5, '#e9e2c0');
  }

  /* =========================================================
     OS EQUIPAMENTOS: praça, hospital, delegacia, shopping
     ---------------------------------------------------------
     A planta manda a lista de peças; aqui cada espécie de peça vira
     geometria. O que bloqueia na máscara é exatamente o que tem caixa
     aqui, porque é a mesma lista.
     ========================================================= */
  const VIDRACA = '#2f3a44';
  function janelas(T, b, modo) {
    const alt = b.alt, y0 = 14;
    if (modo === 'vidro') {
      /* pano de vidro na frente inteira */
      caixa(T, b.x0 + 4, b.x1 - 4, 10, alt - 8, b.y1 - 0.6, b.y1 + 0.4, VIDRACA);
      return;
    }
    const passo = modo === 'faixa' ? 30 : 26, ah = modo === 'faixa' ? 8 : 12;
    for (let y = y0; y + ah + 8 < alt; y += passo) {
      if (modo === 'faixa') {
        caixa(T, b.x0 + 6, b.x1 - 6, y, y + ah, b.y0 - 0.6, b.y0 + 0.4, VIDRACA);
        caixa(T, b.x0 + 6, b.x1 - 6, y, y + ah, b.y1 - 0.4, b.y1 + 0.6, VIDRACA);
        caixa(T, b.x0 - 0.6, b.x0 + 0.4, y, y + ah, b.y0 + 6, b.y1 - 6, VIDRACA);
        caixa(T, b.x1 - 0.4, b.x1 + 0.6, y, y + ah, b.y0 + 6, b.y1 - 6, VIDRACA);
      } else {
        for (let x = b.x0 + 14; x + 16 < b.x1; x += 30) {
          caixa(T, x, x + 16, y, y + ah, b.y0 - 0.6, b.y0 + 0.4, VIDRACA);
          caixa(T, x, x + 16, y, y + ah, b.y1 - 0.4, b.y1 + 0.6, VIDRACA);
        }
        for (let z = b.y0 + 14; z + 16 < b.y1; z += 30) {
          caixa(T, b.x0 - 0.6, b.x0 + 0.4, y, y + ah, z, z + 16, VIDRACA);
          caixa(T, b.x1 - 0.4, b.x1 + 0.6, y, y + ah, z, z + 16, VIDRACA);
        }
      }
    }
  }
  /* um carro, com cabine — e a barra de luz de quem tem pressa */
  function carro(T, c) {
    const ao = c.x1 - c.x0 > c.y1 - c.y0;
    const teto = c.modo === 'ambulancia' ? 40 : 28;
    caixa(T, c.x0, c.x1, 1.4, 17, c.y0, c.y1, c.cor);
    tmp.set(c.cor).multiplyScalar(0.7);
    const escuro = c.modo === 'ambulancia' ? '#e8e8e4' : '#' + tmp.getHexString();
    if (ao) caixa(T, c.x0 + 9, c.x1 - 10, 17, teto, c.y0 + 1.5, c.y1 - 1.5, escuro);
    else caixa(T, c.x0 + 1.5, c.x1 - 1.5, 17, teto, c.y0 + 9, c.y1 - 10, escuro);
    if (!c.modo) return;
    const mx = (c.x0 + c.x1) / 2, mz = (c.y0 + c.y1) / 2;
    caixa(T, mx - 9, mx - 1, teto, teto + 5, mz - 3, mz + 3, '#c02a22');
    caixa(T, mx + 1, mx + 9, teto, teto + 5, mz - 3, mz + 3, '#2a44c0');
    if (c.modo === 'ambulancia') {
      /* a faixa vermelha na lateral */
      caixa(T, c.x0 + 2, c.x1 - 2, 22, 30, c.y0 - 0.5, c.y0 + 0.4, '#c9463c');
      caixa(T, c.x0 + 2, c.x1 - 2, 22, 30, c.y1 - 0.4, c.y1 + 0.5, '#c9463c');
    }
  }
  function desenharPecas(T, TL, uv, pecas) {
    const PEDRA = '#b9b3a4', GRAMA = '#4a7a3c';
    for (const o of pecas) {
      const mx = (o.x0 + o.x1) / 2, mz = (o.y0 + o.y1) / 2;
      switch (o.k) {
        case 'bloco':
          caixa(T, o.x0, o.x1, 0, o.alt, o.y0, o.y1, o.cor);
          if (o.teto) caixa(T, o.x0 - 2, o.x1 + 2, o.alt, o.alt + 4, o.y0 - 2, o.y1 + 2, o.teto);
          if (o.janelas) janelas(T, o, o.janelas);
          break;
        case 'muro': case 'guarita': case 'totem': case 'monumento':
          caixa(T, o.x0, o.x1, 0, o.alt, o.y0, o.y1, o.cor || PEDRA);
          if (o.k === 'guarita') {
            caixa(T, o.x0 + 2, o.x1 - 2, 12, o.alt - 5, o.y1 - 0.5, o.y1 + 0.4, VIDRACA);
            caixa(T, o.x0 - 3, o.x1 + 3, o.alt, o.alt + 3, o.y0 - 3, o.y1 + 3, '#8f9499');
          }
          if (o.k === 'totem') caixa(T, o.x0 - 7, o.x1 + 7, o.alt * 0.55, o.alt - 6, o.y0 + 2, o.y1 - 2, '#e8e4d8');
          if (o.k === 'monumento') {
            caixa(T, o.x0 + 5, o.x1 - 5, o.alt, o.alt + 14, o.y0 + 5, o.y1 - 5, '#6e6a5e');
            piramide(T, mx, o.alt + 14, o.alt + 24, 6, mz, '#6e6a5e');
          }
          break;
        case 'canteiro':
          caixa(T, o.x0, o.x1, 0, o.alt, o.y0, o.y1, PEDRA);
          caixa(T, o.x0 + 3, o.x1 - 3, o.alt, o.alt + 3, o.y0 + 3, o.y1 - 3, GRAMA);
          break;
        case 'piso': {
          const b = o.base || 1.6;
          caixa(T, o.x0, o.x1, b, b + 0.15, o.y0, o.y1, o.cor);
          break;
        }
        case 'marquise': case 'claraboia': case 'maquina':
          caixa(T, o.x0, o.x1, o.y, o.y + o.alt, o.y0, o.y1, o.cor);
          break;
        case 'pilar':
          caixa(T, o.x - o.r, o.x + o.r, 0, o.alt, o.y - o.r, o.y + o.r, o.cor);
          break;
        case 'carro': carro(T, o); break;
        case 'arvore': arvore(T, o); break;
        case 'poste': poste(T, o); break;
        case 'banco': {
          caixa(T, o.x0, o.x1, 10, 13, o.y0, o.y1, '#7a5a3a');
          caixa(T, o.x0, o.x1, 13, 30, o.y0, o.y0 + 2.5, '#7a5a3a');
          for (const x of [o.x0 + 3, o.x1 - 3]) caixa(T, x - 1.4, x + 1.4, 0, 10, mz - 1.4, mz + 1.4, '#55524a');
          break;
        }
        case 'mastro':
          caixa(T, o.x - 1.6, o.x + 1.6, 0, o.alt, o.y - 1.6, o.y + 1.6, '#cfcbbe');
          caixa(T, o.x - 0.4, o.x + 0.4, 0, 5, o.y - 5, o.y + 5, '#cfcbbe');
          caixa(T, o.x + 1.6, o.x + 34, o.alt - 22, o.alt - 2, o.y - 0.5, o.y + 0.5, '#2f7a3c');
          break;
        case 'fonte': {
          const r = o.r;
          caixa(T, o.x - r, o.x + r, 0, 10, o.y - r * 0.72, o.y + r * 0.72, PEDRA);
          caixa(T, o.x - r * 0.72, o.x + r * 0.72, 0, 10, o.y - r, o.y + r, PEDRA);
          caixa(T, o.x - r + 4, o.x + r - 4, 8, 9.4, o.y - r + 4, o.y + r - 4, '#4d7f96');
          caixa(T, o.x - 4, o.x + 4, 9, 24, o.y - 4, o.y + 4, PEDRA);
          piramide(T, o.x, 24, 34, 8, o.y, '#4d7f96');
          break;
        }
        case 'coreto': {
          const r = o.r;
          caixa(T, o.x - r, o.x + r, 0, 7, o.y - r, o.y + r, PEDRA);
          caixa(T, o.x - r + 8, o.x + r - 8, 7, 8.6, o.y - r + 8, o.y + r - 8, '#c9c3b2');
          for (let i = 0; i < 8; i++) {
            const a = i / 8 * Math.PI * 2, px = o.x + Math.cos(a) * (r - 7), pz = o.y + Math.sin(a) * (r - 7);
            caixa(T, px - 2.2, px + 2.2, 8, o.alt, pz - 2.2, pz + 2.2, '#e6e2d6');
          }
          caixa(T, o.x - r, o.x + r, o.alt, o.alt + 3, o.y - r, o.y + r, '#9a4a33');
          piramide(T, o.x, o.alt + 3, o.alt + 20, r * 0.92, o.y, '#9a4a33');
          break;
        }
        case 'cruz': {
          /* a fachada é a parede: a cruz vai meio ponto PRA FORA dela */
          const z0 = o.y + o.oz * 0.4, z1 = o.y + o.oz * 1.4;
          caixa(T, o.x - o.tam / 2, o.x + o.tam / 2, o.base + o.tam / 3, o.base + o.tam * 2 / 3,
                Math.min(z0, z1), Math.max(z0, z1), '#c9463c');
          caixa(T, o.x - o.tam / 6, o.x + o.tam / 6, o.base, o.base + o.tam,
                Math.min(z0, z1), Math.max(z0, z1), '#c9463c');
          break;
        }
        case 'letreiro': {
          const u = uv.get('P:' + o.texto);
          if (!u) break;
          const larg = o.larg || 120, alt = o.altura || 20, base = o.base || 24;
          /* meio ponto à frente da parede, senão some dentro dela */
          placa(TL, o.x + o.ox * 0.6, base + alt / 2, o.y + o.oz * 0.6, o.ox, o.oz, larg, alt, u);
          if (o.pernas) for (const s of [-1, 1])
            caixa(T, o.x + s * (larg / 2 - 4) - 1.6, o.x + s * (larg / 2 - 4) + 1.6, 0, base + alt,
                  o.y - 1.6, o.y + 1.6, '#6e6a5e');
          break;
        }
      }
    }
  }

  /* ---- os quarteirões, em pedaços de 4 × 4 células ---- */
  const pedacos = new Map();
  const comEquipamento = [];
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
    /* no equipamento o miolo é pátio, não terreno de casa: o chão dele
       tem cor própria, e as peças de `piso` vão logo acima */
    const chaoMiolo = q.equip ? q.equip.chao : '#7d7668';
    for (const p of semAsAvenidas(q.polMiolo, K.CALC)) laje(T, p, 0, 1.6, chaoMiolo);
    if (q.quintal) for (const p of semAsAvenidas(q.quintal, K.CALC)) laje(T, p, 0, q.quintal.alt, q.quintal.cor);
    for (const l of q.lotes) {
      limite = l.ang ? null : { x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 };
      lote(T, l);
      limite = null;
    }
    for (const a of q.arvores || []) arvore(T, a);
    if (q.equip || q.pracinhas) comEquipamento.push([T, q]);
  }
  /* ---- os dizeres ---- */
  const dizeres = new Map();
  for (const q of K.QUADRAS) {
    if (!q.equip) continue;
    for (const o of q.equip.pecas)
      if (o.k === 'letreiro') dizeres.set('P:' + o.texto, { chave: 'P:' + o.texto, texto: o.texto, placa: true });
  }
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
    for (const [T, q] of comEquipamento) {
      /* a mesma regra da casa: beiral de hospital não invade calçada */
      limite = { x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 };
      if (q.equip) desenharPecas(T, TL, uv, q.equip.pecas);
      for (const pr of q.pracinhas || []) {
        for (const t of pr.tiras) tampa(T, t.x0, t.x1, 1.7, t.y0, t.y1, '#b5afa0');
        desenharPecas(T, TL, uv, pr.pecas);
      }
      limite = null;
    }
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
  for (const p of K.POSTES) poste(TS, p);
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
