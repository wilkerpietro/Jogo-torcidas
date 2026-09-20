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
  /* o tecido comum agora tem UV: as paredes levam REBOCO, e a escala
     do reboco é mais graúda que a da telha pra não pentear a parede */
  const Tecido = () => ({ pos: [], cor: [], uv: [], esc: REBOCO_ESC });

  /* Tecido com `uv` é tecido TEXTURADO, e a coordenada sai do MUNDO —
     nunca da peça —, pra textura correr contínua de casa em casa e
     ladrilhar sem costura. `eixo` diz qual é a normal da face: no topo
     (y) valem x e z; numa parede o que vale é o eixo horizontal dela e
     a ALTURA, senão a textura sai esticada numa tira só. */
  function tri(T, a, b, c, hex, tom, eixo) {
    T.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    tmp.set(hex).multiplyScalar(tom === undefined ? 1 : tom);
    for (let k = 0; k < 3; k++) T.cor.push(tmp.r, tmp.g, tmp.b);
    if (!T.uv) return;
    const E = T.esc || TELHA_ESC;
    for (const v of [a, b, c]) {
      if (eixo === 'x')      T.uv.push(v[2] / E, v[1] / E);
      else if (eixo === 'z') T.uv.push(v[0] / E, v[1] / E);
      else                   T.uv.push(v[0] / E, v[2] / E);
    }
  }
  const TELHA_ESC = 104;          // um ladrilho da telha a cada 104 unidades
  const REBOCO_ESC = 172;         // o reboco é mais graúdo, pra não pentear a parede
  /* caixa com sombra de face: topo claro, lados em dois tons — sem
     isso um bairro de caixas Lambert vira um bloco só */
  const TONS = [1.0, 0.9, 0.86, 0.94, 0.8];
  function caixaV(T, v, hex) {
    const f = (a, b, c, d, tom, ei) => { tri(T, v[a], v[b], v[c], hex, tom, ei); tri(T, v[a], v[c], v[d], hex, tom, ei); };
    f(4,7,6,5, TONS[0], 'y');                          // o topo
    f(0,4,5,1, TONS[1], 'z'); f(2,6,7,3, TONS[2], 'z'); // as duas faces de z
    f(1,5,6,2, TONS[3], 'x'); f(3,7,4,0, TONS[4], 'x'); // as duas de x
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
    tri(T, [x0, y, y1], [x1, y, y1], [x1, y, y0], hex, TONS[0], 'y');
    tri(T, [x0, y, y1], [x1, y, y0], [x0, y, y0], hex, TONS[0], 'y');
  }
  /* um prisma reto a partir de um polígono convexo: tampa e paredinha.
     O retângulo vem no sentido horário visto de cima; invertido, a
     tampa olha pra cima e as paredinhas olham pra fora. */
  function laje(T, entrada, y0, y1, hex) {
    const pol = entrada.slice().reverse();
    for (let i = 1; i < pol.length - 1; i++)
      tri(T, [pol[0][0], y1, pol[0][1]], [pol[i][0], y1, pol[i][1]], [pol[i+1][0], y1, pol[i+1][1]], hex, TONS[0], 'y');
    for (let i = 0; i < pol.length; i++) {
      const a = pol[i], b = pol[(i + 1) % pol.length];
      const ao = Math.abs(a[0] - b[0]) > Math.abs(a[1] - b[1]);
      const tom = ao ? TONS[1] : TONS[3], ei = ao ? 'z' : 'x';
      tri(T, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], hex, tom, ei);
      tri(T, [a[0], y0, a[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], hex, tom, ei);
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
  function malhaUV(T, tex, nome, corte, doisLados) {
    if (!T.pos.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({
      map: tex, alphaTest: corte || 0.45,
      side: doisLados ? THREE.DoubleSide : THREE.FrontSide
    }));
    m.receiveShadow = true;
    m.name = nome;
    triangulos += T.pos.length / 9;
    meshes.push(m);
  }
  /* malha com TEXTURA e cor por vértice ao mesmo tempo: a textura dá o
     desenho (a telha, o reboco) e a cor do vértice dá o tom da casa —
     o Lambert multiplica os dois, que é exatamente o que se quer. */
  function malhaTex(T, tex, nome, alfa) {
    if (!T.pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2));
    if (T.cor.length) g.setAttribute('color', new THREE.Float32BufferAttribute(T.cor, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial(Object.assign(
      { map: tex, vertexColors: !!T.cor.length },
      alfa ? { alphaTest: 0.35, side: THREE.DoubleSide, transparent: false } : { side: THREE.DoubleSide })));
    m.castShadow = !alfa; m.receiveShadow = true;
    m.name = nome;
    triangulos += T.pos.length / 9;
    meshes.push(m);
    return m;
  }
  /* as texturas do bairro. Fora do navegador não há `TextureLoader`
     (as varreduras rodam no node), e aí a malha sai sem mapa — o que
     se mede lá é geometria, não pintura. */
  function textura(caminho, repete) {
    if (!THREE.TextureLoader) return null;
    const cam = (typeof window !== 'undefined' && window.__EMBUTIDOS && window.__EMBUTIDOS[caminho]) || caminho;
    const t = new THREE.TextureLoader().load(cam);
    if (repete) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  let _reboco;
  const REBOCO_LAZY = () => (_reboco === undefined ? (_reboco = textura('img/texturas/reboco.png', true)) : _reboco);

  function malha(T, sombra, nome) {
    if (!T.pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(T.cor, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    m.castShadow = !!sombra; m.receiveShadow = true;
    m.name = nome;
    triangulos += T.pos.length / 9;
    meshes.push(m);
    return m;
  }

  /* uma malha que NÃO entra na lista: a porta vive dentro de um Group
     (é ele que gira na dobradiça), e quem entra na cena é o Group */
  function malhaSolta(T, mat) {
    if (!T.pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(T.cor, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = !mat.transparent; m.receiveShadow = true;
    triangulos += T.pos.length / 9;
    return m;
  }

  /* as bandeiras que tremulam: a cena mexe nelas por quadro */
  const bandeiras = [];
  /* as portas que abrem: a cena gira o Group de cada uma por quadro */
  const portas = [];
  /* o tecido de TELHADO (textura de telha) e o de MANCHA (decalque de
     mofo e chuva na parede), os dois com UV */
  const TELHADOS = { pos: [], cor: [], uv: [], esc: TELHA_ESC };
  /* A TELHA DA FAVELA É MIÚDA. A textura tem 8 canaletas por ladrilho,
     então a escala é o tamanho de OITO telhas: 104 dá canaleta de 13
     unidades (0,59 m), que numa casa de 47 de frente sai com três
     canaletas e meia — telha de gigante. Aqui o ladrilho repete a cada
     34, que é canaleta de 4,25 (0,19 m), a medida da telha de verdade.
     Escala é do TECIDO, não do triângulo, então é outra malha. */
  const TELHADOS_FAV = { pos: [], cor: [], uv: [], esc: 34 };
  const MANCHAS  = { pos: [], cor: [], uv: [] };   // as falhas de reboco, UV do decalque

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
      /* ---- O ESCUDO, do jeito que o JOGO desenha ----
         Não há banco de imagem: o escudo do jogo é gerado. O do CLUBE é
         o `.escudo` da interface — divisão em 135° das duas cores dele,
         a primeira até 52% da diagonal, com a sigla do clube em branco
         e sombra. O da TORCIDA é o pino do mapa — bola na cor principal
         com a sigla dela no meio, na cor que LÊ sobre aquele fundo. As
         duas regras vêm de `js/main.js` e `js/mundo/mapa.js`; aqui elas
         só saem em textura em vez de em CSS.
         A célula do atlas é 256 × 64 e o escudo é quadrado, então ele
         ocupa um quadrado de 64 no meio dela e a UV aponta só pra ele. */
      /* ---- A BANDEIRA: pano da torcida com o escudo no meio ----
         Metade da célula do atlas (128 × 64, que é a proporção de
         bandeira), fundo na cor principal, duas faixas na segunda e o
         escudo no centro. O PNG de verdade, quando existe, entra em
         cima só do escudo — por isso o alvo dele fica guardado no
         próprio dizer. */
      if (d.bandeira) {
        const W = 128, H = ALT;
        c.fillStyle = d.cor; c.fillRect(x, y, W, H);
        c.fillStyle = d.cor2;
        c.fillRect(x, y, W, 6); c.fillRect(x, y + H - 6, W, 6);
        const S2 = H - 18, sx = x + (W - S2) / 2, sy = y + 9;
        c.fillStyle = d.cor2;
        c.beginPath(); c.arc(sx + S2 / 2, sy + S2 / 2, S2 / 2, 0, Math.PI * 2); c.fill();
        c.fillStyle = d.cor;
        c.beginPath(); c.arc(sx + S2 / 2, sy + S2 / 2, S2 / 2 - 2.5, 0, Math.PI * 2); c.fill();
        c.textAlign = 'center'; c.textBaseline = 'middle';
        let tb = 17;
        c.font = 'bold ' + tb + 'px "Arial Narrow", Arial, sans-serif';
        while (tb > 6 && c.measureText(d.texto).width > S2 - 8) {
          tb -= 1; c.font = 'bold ' + tb + 'px "Arial Narrow", Arial, sans-serif';
        }
        c.fillStyle = d.corTexto;
        c.fillText(d.texto, sx + S2 / 2, sy + S2 / 2 + 1);
        c.restore();
        d.alvo = [sx, sy, S2, S2];                 // onde o PNG do escudo entra
        uv.set(d.chave, [x / cv.width, 1 - (y + H) / cv.height,
                         (x + W) / cv.width, 1 - y / cv.height]);
        return;
      }
      if (d.escudo) {
        const S = ALT, ex = x + (LARG - S) / 2, ey = y;
        if (d.forma === 'bola') {
          c.fillStyle = d.cor;
          c.beginPath(); c.arc(ex + S / 2, ey + S / 2, S / 2 - 2.5, 0, Math.PI * 2); c.fill();
          c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.45)'; c.stroke();
        } else {
          /* 135° com parada dura em 52%: o corte é a reta x + y = 1,04 S */
          c.fillStyle = d.cor; c.fillRect(ex, ey, S, S);
          c.fillStyle = d.cor2;
          c.beginPath();
          c.moveTo(ex + 0.04 * S, ey + S); c.lineTo(ex + S, ey + S);
          c.lineTo(ex + S, ey + 0.04 * S); c.closePath(); c.fill();
          c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.45)';
          c.strokeRect(ex + 1.5, ey + 1.5, S - 3, S - 3);
        }
        c.textAlign = 'center'; c.textBaseline = 'middle';
        let t = 21;
        c.font = 'bold ' + t + 'px "Arial Narrow", Arial, sans-serif';
        while (t > 7 && c.measureText(d.texto).width > S - 9) {
          t -= 1; c.font = 'bold ' + t + 'px "Arial Narrow", Arial, sans-serif';
        }
        c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowOffsetY = 1; c.shadowBlur = 3;
        c.fillStyle = d.corTexto;
        c.fillText(d.texto, ex + S / 2, ey + S / 2 + 1);
        c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
        c.restore();
        d.alvo = [ex, ey, S, S];
        uv.set(d.chave, [ex / cv.width, 1 - (ey + S) / cv.height,
                         (ex + S) / cv.width, 1 - ey / cv.height]);
        return;
      }
      if (d.placa) {
        const fundo = d.fundo || FUNDOS_PLACA[h % FUNDOS_PLACA.length];
        c.fillStyle = fundo; c.fillRect(x, y, LARG, ALT);
        const n = parseInt(String(fundo).slice(1), 16);
        const claro = ((n >> 16 & 255) * 0.299 + (n >> 8 & 255) * 0.587 + (n & 255) * 0.114) > 150;
        /* borda forte no fundo claro: letreiro bege em parede bege some */
        c.strokeStyle = claro ? 'rgba(40,36,28,.75)' : 'rgba(255,255,255,.35)';
        c.lineWidth = claro ? 7 : 4; c.strokeRect(x + 4, y + 4, LARG - 8, ALT - 8);
        c.fillStyle = d.tinta || (claro ? '#20201c' : '#f6f3ea');
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
    /* ---- O ESCUDO DE VERDADE, quando ele existir ----
       O escudo pintado acima é o do JOGO — a divisão em 135° do clube e
       a bola da torcida, as mesmas regras de `main.js` e `mapa.js`. Mas
       o certo é o PNG do escudo, e ele entra por cima assim que chega:
       a planta diz o caminho (`img/escudos/clube/<id>.png` e
       `img/escudos/torcida/<id>.png`), a imagem carrega depois da cena
       montada e repinta a célula do atlas, e `needsUpdate` põe na tela.
       Sem o arquivo, o `onerror` não faz nada e fica valendo o gerado —
       nada quebra, e o dia em que os PNG entrarem no repositório eles
       aparecem sozinhos. */
    /* fora do navegador (as varreduras rodam no node) não há `Image`,
       e o escudo gerado já basta pra medir geometria */
    if (typeof Image === 'undefined') return { tex, uv };
    for (const d of dizeres) {
      if (!d.img || !d.alvo) continue;
      const [ex, ey, S] = d.alvo;
      const im = new Image();
      im.onload = () => {
        if (!d.bandeira) c.clearRect(ex, ey, S, S);
        /* encaixa mantendo a proporção, centrado */
        const e = Math.min(S / im.width, S / im.height);
        const w = im.width * e, h = im.height * e;
        c.drawImage(im, ex + (S - w) / 2, ey + (S - h) / 2, w, h);
        tex.needsUpdate = true;
      };
      im.onerror = () => {};
      im.src = d.img;
    }
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

  /* ---- O DECALQUE DE CHÃO ----
     Uma placa DEITADA: dois triângulos no plano do chão, girados de
     `ang` (o giro é o que disfarça a repetição — o pack tem 32 peças
     pra 1.300 placas), com a UV apontando pra célula do atlas. A ordem
     dos vértices não é gosto: invertida, a normal aponta pra BAIXO e o
     Lambert entrega a peça preta. Ela recebe sombra e não projeta — é
     chão, não objeto. */
  const DEC_COL = 8, DEC_LIN = 4;
  function decalqueChao(T, d, Y) {
    const c = Math.cos(d.ang), s = Math.sin(d.ang), h = d.tam / 2;
    const col = d.cel % DEC_COL, lin = (d.cel / DEC_COL) | 0;
    const u0 = col / DEC_COL, u1 = (col + 1) / DEC_COL;
    /* a linha 0 do atlas é o TOPO da imagem e a UV conta de baixo */
    const v1 = 1 - lin / DEC_LIN, v0 = 1 - (lin + 1) / DEC_LIN;
    const p = (u, v, su, sv) => {
      T.pos.push(d.x + u * c - v * s, Y, d.y + u * s + v * c);
      T.uv.push(su, sv);
    };
    p(-h, -h, u0, v0); p(-h, h, u0, v1); p(h, h, u1, v1);
    p(-h, -h, u0, v0); p(h, h, u1, v1); p(h, -h, u1, v0);
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
  /* O TELHADO SAI NUMA MALHA PRÓPRIA, com textura de telha. Quem chama
     continua passando o tecido do quarteirão; aqui ele é trocado pelo
     tecido do telhado quando há um. O da sede fica de fora de
     propósito: aquilo é cobertura de fibrocimento, não telha, e a
     malha dele liga e desliga sozinha. */
  let alvoTelhado = null;
  function telhado(T, x0, x1, z0, z1, y0, h, hex) {
    T = alvoTelhado || T;
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
    T = alvoTelhado || T;
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
  /* A FACHADA: porta, e o térreo que muda conforme o lote.
     Comércio ganha VITRINE — vidro de ponta a ponta ao lado da porta —,
     casa ganha janela dos dois lados. Frente estreita não comporta as
     duas janelas de sempre, e era isso que deixava comércio de parede
     lisa com letreiro em cima. */
  function fachada(T, l, larg, face) {
    const pw = Math.min(20, Math.max(12, larg * 0.36));
    /* a porta encolhe em casa baixa: sem isso ela toma quase o pé-
       direito inteiro e não sobra vão pra janela nem pra bandeira —
       o que só acontecia a partir do barraco da favela, mais baixo
       que qualquer casa de antes. Em telhado normal o terceiro termo
       não é o menor dos três, e a porta sai igual a sempre. */
    const meio = larg * 0.5, porta = Math.min(PORTA_ALT, l.alt - 6, Math.max(30, l.alt * 0.62));
    face(meio - pw / 2, meio + pw / 2, 0, porta, PORTA, 0.6);
    let pos = 0;
    const painel = (a0, a1, y0, y1, hex) => { if (a1 - a0 >= 5) { face(a0, a1, y0, y1, hex, 0.5); pos++; } };
    if (l.placa) {
      const alto = Math.min(PORTA_ALT - 4, l.alt - 10);
      if (alto > 16) {
        painel(6, meio - pw / 2 - 2, 10, alto, VIDRO);
        painel(meio + pw / 2 + 2, larg - 6, 10, alto, VIDRO);
      }
    }
    const andares = Math.max(1, Math.floor(l.alt / 58));
    for (let f = 0; f < andares; f++) {
      const y = 26 + f * 58;
      if (y + 26 > l.alt - 8) break;
      if (f === 0 && l.placa) continue;                  // o térreo é a vitrine
      if (f === 0) { painel(8, meio - pw / 2 - 3, y, y + 24, VIDRO); painel(meio + pw / 2 + 3, larg - 8, y, y + 24, VIDRO); }
      else painel(8, larg - 8, y, y + 24, VIDRO);
    }
    /* FRENTE ESTREITA. Com menos de uns 1,8 m de frente não sobra vão
       ao lado da porta pra janela nenhuma — nem no comércio. O que
       essas casas têm de verdade é BANDEIRA em cima da porta, e é o
       que entra aqui: pega o que houver entre o topo da porta e o
       beiral, sem exigir os 24 de uma janela inteira. */
    if (!pos) {
      const b0 = porta + 4, b1 = Math.min(b0 + 20, l.alt - 4);
      if (b1 - b0 >= 7) painel(meio - pw / 2 - 2, meio + pw / 2 + 2, b0, b1, VIDRO);
    }
  }

  function lote(T, l) {
    if (l.ang) {
      /* casa da avenida: corpo, telhado e a fachada virada pra avenida */
      caixaRot(T, l.cx, l.cy, l.w - 2, l.h - 2, 0, l.alt, l.ang, l.cor);
      /* `telha` manda na cor da cobertura quando quem pediu sabe qual
         é: a favela tem seis tons de telha cerâmica e três de laje, e
         é essa variação que faz o telhado dela ler como a foto em vez
         de um carpete vermelho de uma cor só */
      if (l.tipo === 'casa' || l.tipo === 'sobrado')
        telhadoRot(T, l.cx, l.cy, l.w + 2, l.h + 2, l.alt, Math.min(l.h, 46) * 0.42, l.ang, l.telha || TELHA);
      else if (l.tipo === 'galpao')
        telhadoRot(T, l.cx, l.cy, l.w, l.h, l.alt, Math.min(l.h, 46) * 0.24, l.ang, l.telha || '#7c8285');
      else if (l.tipo !== 'muro') caixaRot(T, l.cx, l.cy, l.w, l.h, l.alt, l.alt + 4, l.ang, l.telha || '#8f8a80');
      if (l.tipo === 'muro') return;
      /* a frente fica no eixo local do lote: `vf` diz de que lado */
      const largA = l.w - 2, vf = l.vf || -1, c = Math.cos(l.ang), sn = Math.sin(l.ang);
      const vFace = vf * (l.h / 2 - 1);
      fachada(T, l, largA, (a0, a1, y0, y1, hex, fora) => {
        const e = fora || 0.8, u = (a0 + a1) / 2 - largA / 2, v = vFace + vf * (e / 2 - 0.1);
        caixaRot(T, l.cx + u * c - v * sn, l.cy + u * sn + v * c, a1 - a0, e + 0.2, y0, y1, l.ang, hex);
      });
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
    fachada(T, l, larg, faceBox);
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

  /* semáforo: mastro mais alto que o de luz, braço estendendo por
     cima da faixa mais próxima e a cabeça com os três focos, virada
     pra quem vem dirigindo — é a face oposta ao sentido da avenida
     (`s.ang`), então o carro que se aproxima vê o vermelho de frente.
     `s.lado` é pra que lado do mastro o braço sai (a esquina em que o
     poste caiu, sorteada na planta). */
  const SEMAF = '#4a4a46', CAIXA_SEMAF = '#26261f';
  const FOCOS = ['#c0392b', '#c9a227', '#2f8f4e'];
  function semaforo(T, s) {
    const H = 148;                              // 6,7 m de mastro
    const perp = s.ang + Math.PI/2;
    const px = Math.cos(perp)*s.lado, pz = Math.sin(perp)*s.lado;
    caixaRot(T, s.x, s.y, 3.6, 3.6, 0, H, 0, SEMAF);
    /* o braço: do mastro até a metade da pista, na direção perpendicular */
    const bx = s.x + px*s.braco/2, bz = s.y + pz*s.braco/2;
    caixaRot(T, bx, bz, s.braco, 3.2, H - 6, H - 2.4, perp, SEMAF);
    /* a cabeça, na ponta do braço, e os três focos na face que olha
       pra trás no sentido da avenida (quem chega enxerga o foco) */
    const hx = s.x + px*s.braco, hz = s.y + pz*s.braco;
    caixaRot(T, hx, hz, 9, 12, H - 32, H - 6, s.ang, CAIXA_SEMAF);
    const fx = Math.cos(s.ang)*5.2, fz = Math.sin(s.ang)*5.2;
    for (let i = 0; i < 3; i++) {
      const fy0 = H - 12 - i*7.6;
      caixaRot(T, hx - fx, hz - fz, 5.6, 2, fy0, fy0 + 5.6, s.ang, FOCOS[i]);
    }
  }

  /* =========================================================
     O MOBILIÁRIO DA SEDE
     ---------------------------------------------------------
     A sede era casca: parede, piso pintado e mais nada. De dentro
     dela via-se um cômodo vazio, e cômodo vazio não lê como sede de
     torcida — lê como obra parada. Aqui entra o que enche: colchão,
     armário, estante, troféu, mesa, cadeira, caixa, mural.

     São caixas, como o resto da cena, mas em PORÇÃO MAIOR: uma
     cadeira de escritório são catorze delas, um armário são nove. É
     barato — a sede inteira mobiliada não chega a 1.500 triângulos, e
     tudo entra na malha do quarteirão, sem chamada de desenho a mais.

     A ORIENTAÇÃO VEM DA PLANTA, em `ox`/`oz`: é pra que lado o móvel
     OLHA. Sem isso a porta do armário sai na face encostada na parede
     e o móvel lê como caixote. `naFace` resolve as quatro orientações
     numa conta só, em vez de quatro trechos iguais. */
  const MADEIRA = '#8a6a44', MADEIRA_ESC = '#6b5133';
  const METAL = '#8d9094', METAL_ESC = '#5b5f63', ESTOFO = '#33363a';
  /* o intervalo que corre AO LONGO da face de um móvel */
  const aoLongo = o => o.ox ? [o.y0, o.y1] : [o.x0, o.x1];
  /* um painel colado na face: `a0..a1` correm ao longo dela, `y0..y1`
     são altura e `fora` é o quanto ele sai do corpo */
  function naFace(T, o, a0, a1, y0, y1, fora, cor) {
    if (o.ox) {
      const f = o.ox > 0 ? o.x1 : o.x0, g = f + o.ox * fora;
      caixa(T, Math.min(f, g), Math.max(f, g), y0, y1, a0, a1, cor);
    } else {
      const f = o.oz > 0 ? o.y1 : o.y0, g = f + o.oz * fora;
      caixa(T, a0, a1, y0, y1, Math.min(f, g), Math.max(f, g), cor);
    }
  }
  /* colchão no chão: corpo, barriga, duas costuras e o travesseiro na
     ponta que encosta na parede. É onde o aliado se hospeda, então
     NÃO bloqueia — ele deita em cima. */
  function colchao(T, o) {
    const cor = o.cor || '#d8d2c2';
    tmp.set(cor).multiplyScalar(0.86);
    const costura = '#' + tmp.getHexString();
    const ao = o.x1 - o.x0 > o.y1 - o.y0;
    caixa(T, o.x0, o.x1, 0, 5, o.y0, o.y1, cor);
    caixa(T, o.x0 + 1.6, o.x1 - 1.6, 5, 6.4, o.y0 + 1.6, o.y1 - 1.6, cor);
    for (const t of [0.34, 0.66]) {
      if (ao) { const x = o.x0 + (o.x1 - o.x0) * t;
        caixa(T, x - 0.7, x + 0.7, 4.9, 5.6, o.y0 + 2.5, o.y1 - 2.5, costura); }
      else { const z = o.y0 + (o.y1 - o.y0) * t;
        caixa(T, o.x0 + 2.5, o.x1 - 2.5, 4.9, 5.6, z - 0.7, z + 0.7, costura); }
    }
    if (ao) caixa(T, o.x0 + 2, o.x0 + 12, 5, 8.4, o.y0 + 3, o.y1 - 3, '#e8e4d8');
    else    caixa(T, o.x0 + 3, o.x1 - 3, 5, 8.4, o.y0 + 2, o.y0 + 12, '#e8e4d8');
  }
  /* armário de aço: corpo, pés, tampa, duas portas rebaixadas com
     puxador e a fresta entre elas */
  function armario(T, o) {
    const h = o.alt || 46, cor = o.cor || METAL;
    caixa(T, o.x0, o.x1, 3, h, o.y0, o.y1, cor);
    caixa(T, o.x0 + 2, o.x1 - 2, 0, 3, o.y0 + 2, o.y1 - 2, METAL_ESC);
    caixa(T, o.x0 - 0.8, o.x1 + 0.8, h, h + 1.6, o.y0 - 0.8, o.y1 + 0.8, cor);
    const [a0, a1] = aoLongo(o), am = (a0 + a1) / 2;
    naFace(T, o, a0 + 1.6, am - 0.7, 5, h - 2, 1.1, cor);
    naFace(T, o, am + 0.7, a1 - 1.6, 5, h - 2, 1.1, cor);
    for (const a of [am - 3.4, am + 3.4])
      naFace(T, o, a - 0.7, a + 0.7, h * 0.42, h * 0.58, 2.2, METAL_ESC);
  }
  /* estante aberta: quatro montantes e as prateleiras */
  function estante(T, o) {
    const h = o.alt || 50, n = o.prateleiras || 4, cor = o.cor || METAL;
    for (const x of [o.x0 + 1.5, o.x1 - 1.5]) for (const z of [o.y0 + 1.5, o.y1 - 1.5])
      caixa(T, x - 1.5, x + 1.5, 0, h, z - 1.5, z + 1.5, METAL_ESC);
    for (let i = 0; i <= n; i++) {
      const y = 3 + (h - 7) * i / n;
      caixa(T, o.x0, o.x1, y, y + 1.6, o.y0, o.y1, cor);
    }
    /* o que mora na estante: caixa e material, alternando de prateleira */
    for (let i = 0; i < n; i++) {
      const y = 3 + (h - 7) * i / n + 1.6;
      const ao = o.x1 - o.x0 > o.y1 - o.y0;
      const c0 = ao ? o.x0 : o.y0, c1 = ao ? o.x1 : o.y1;
      for (const t of i % 2 ? [0.28, 0.66] : [0.46]) {
        const c = c0 + (c1 - c0) * t, w = 7 + (i % 3) * 2;
        const x0 = ao ? c - w : o.x0 + 2, x1 = ao ? c + w : o.x1 - 2;
        const z0 = ao ? o.y0 + 2 : c - w, z1 = ao ? o.y1 - 2 : c + w;
        caixa(T, x0, x1, y, y + 7 + (i % 2) * 3, z0, z1, i % 2 ? '#b98f57' : '#7d7a72');
      }
    }
  }
  /* a prateleira de troféus: `n` taças enfileiradas, base escura,
     haste e taça, com as alças dos dois lados. Uma de prata no meio,
     que fileira toda dourada lê como enfeite e não como prateleira */
  function trofeus(T, o) {
    const n = o.n || 3, base = o.base || 0;
    const ao = o.x1 - o.x0 > o.y1 - o.y0;
    const c0 = ao ? o.x0 : o.y0, c1 = ao ? o.x1 : o.y1;
    for (let i = 0; i < n; i++) {
      const c = c0 + (c1 - c0) * (i + 0.5) / n;
      const x = ao ? c : (o.x0 + o.x1) / 2, z = ao ? (o.y0 + o.y1) / 2 : c;
      const h = 8.5 + (i % 3) * 2.2, ouro = i % 3 === 1 ? '#b9b6ae' : '#c9a227';
      caixa(T, x - 2.5, x + 2.5, base, base + 1.7, z - 2.5, z + 2.5, '#4a3728');
      caixa(T, x - 0.9, x + 0.9, base + 1.7, base + h * 0.5, z - 0.9, z + 0.9, ouro);
      caixa(T, x - 2.7, x + 2.7, base + h * 0.5, base + h, z - 2.7, z + 2.7, ouro);
      for (const sgn of [-1, 1])
        caixa(T, x + sgn * 2.9, x + sgn * 3.7, base + h * 0.58, base + h * 0.9,
                 z - 0.7, z + 0.7, ouro);
    }
  }
  /* mesa: tampo com friso, quatro pés e o gaveteiro de três gavetas
     numa das pontas */
  function mesa(T, o) {
    const h = o.alt || 26, cor = o.cor || MADEIRA;
    caixa(T, o.x0, o.x1, h - 2.6, h, o.y0, o.y1, cor);
    caixa(T, o.x0 + 1, o.x1 - 1, h - 3.4, h - 2.6, o.y0 + 1, o.y1 - 1, MADEIRA_ESC);
    for (const x of [o.x0 + 2.4, o.x1 - 2.4]) for (const z of [o.y0 + 2.4, o.y1 - 2.4])
      caixa(T, x - 1.4, x + 1.4, 0, h - 2.6, z - 1.4, z + 1.4, MADEIRA_ESC);
    const ao = o.x1 - o.x0 > o.y1 - o.y0;
    const g0 = (ao ? o.x0 : o.y0) + 3, g1 = g0 + 17;
    const x0 = ao ? g0 : o.x0 + 2, x1 = ao ? g1 : o.x1 - 2;
    const z0 = ao ? o.y0 + 2 : g0, z1 = ao ? o.y1 - 2 : g1;
    caixa(T, x0, x1, 2, h - 3, z0, z1, cor);
    for (let i = 0; i < 3; i++) {
      const y = 3.4 + i * 6.4;
      caixa(T, x0 - 0.5, x1 + 0.5, y, y + 5, z0 - 0.5, z1 + 0.5, MADEIRA_ESC);
    }
  }
  /* cadeira de escritório: estrela de cinco pés com rodízio, coluna,
     assento e encosto. `ang` é pra onde ela OLHA. É leve e se arrasta,
     então não bloqueia. */
  function cadeira(T, o) {
    const x = (o.x0 + o.x1) / 2, z = (o.y0 + o.y1) / 2, ASS = 19, ang = o.ang || 0;
    for (let i = 0; i < 5; i++) {
      const a = ang + i * Math.PI * 2 / 5;
      caixaRot(T, x + Math.cos(a) * 6.5, z + Math.sin(a) * 6.5, 13, 2.6, 2.6, 4.2, a, '#3a3d40');
      const px = x + Math.cos(a) * 12, pz = z + Math.sin(a) * 12;
      caixa(T, px - 1.3, px + 1.3, 0, 2.8, pz - 1.3, pz + 1.3, '#25272a');
    }
    caixa(T, x - 1.9, x + 1.9, 4.2, ASS - 2.6, z - 1.9, z + 1.9, '#4a4d50');
    caixaRot(T, x, z, 18, 17, ASS - 2.6, ASS, ang, ESTOFO);
    caixaRot(T, x, z, 17, 16, ASS, ASS + 2.6, ang, '#3f4348');
    const bx = x - Math.cos(ang) * 7.5, bz = z - Math.sin(ang) * 7.5;
    caixaRot(T, bx, bz, 3, 16, ASS + 2, ASS + 21, ang, ESTOFO);
    caixaRot(T, bx, bz, 4.4, 14, ASS + 6, ASS + 19, ang, '#3f4348');
  }
  /* caixa de papelão: corpo, abas e a fita no meio */
  function caixote(T, o) {
    const h = o.alt || 14, cor = o.cor || '#b98f57';
    caixa(T, o.x0, o.x1, 0, h, o.y0, o.y1, cor);
    caixa(T, o.x0 - 0.7, o.x1 + 0.7, h, h + 1.1, o.y0 - 0.7, o.y1 + 0.7, '#a67d4c');
    const mx = (o.x0 + o.x1) / 2;
    caixa(T, mx - 1.5, mx + 1.5, h + 1.1, h + 1.5, o.y0 - 0.7, o.y1 + 0.7, '#ddd8c9');
  }
  /* o ralo do pátio: caixilho, grelha e as barras */
  function ralo(T, o) {
    const r = o.r || 5;
    caixa(T, o.x - r, o.x + r, 1.75, 2.25, o.y - r, o.y + r, '#6e6a60');
    caixa(T, o.x - r + 1.1, o.x + r - 1.1, 1.6, 2.05, o.y - r + 1.1, o.y + r - 1.1, '#2b2926');
    for (let i = 0; i < 3; i++) {
      const z = o.y - r + 2.2 + i * (r - 1.1);
      caixa(T, o.x - r + 1.1, o.x + r - 1.1, 2.05, 2.35, z - 0.45, z + 0.45, '#6e6a60');
    }
  }
  /* ar-condicionado de parede: corpo, aletas e o friso de baixo */
  function arCondicionado(T, o) {
    const y = o.base || 33, h = o.alt || 11;
    caixa(T, o.x0, o.x1, y, y + h, o.y0, o.y1, '#e2dfd6');
    const [a0, a1] = aoLongo(o);
    for (let i = 0; i < 3; i++)
      naFace(T, o, a0 + 3, a1 - 3, y + h * 0.28 + i * h * 0.18, y + h * 0.28 + i * h * 0.18 + h * 0.1,
             0.8, '#c3bfb4');
    naFace(T, o, a0 + 2, a1 - 2, y - 0.8, y, 1.2, '#b7b3a8');
  }
  /* o mural da sala: moldura, cortiça e os papéis pregados nela */
  function mural(T, o) {
    const y = o.base || 24, h = o.alt || 20;
    caixa(T, o.x0, o.x1, y, y + h, o.y0, o.y1, '#4a3728');
    const [a0, a1] = aoLongo(o);
    naFace(T, o, a0 + 1.4, a1 - 1.4, y + 1.4, y + h - 1.4, 0.7, '#a98b5e');
    let k = 0;
    for (const t of [0.16, 0.4, 0.62, 0.84]) {
      const a = a0 + (a1 - a0) * t, w = 3 + (k % 2) * 1.6;
      const yy = y + h * (k % 2 ? 0.28 : 0.52);
      naFace(T, o, a - w, a + w, yy, yy + h * 0.3, 1.2, k % 3 ? '#e8e4d8' : '#d6cfae');
      k++;
    }
  }
  /* ---- A PORTA QUE ABRE ----
     A folha é montada em coordenada LOCAL, com a DOBRADIÇA na origem
     e a folha deitada no +X: assim abrir é só girar o Group em torno
     do Y, sem mexer em vértice nenhum por quadro (que é o que a
     bandeira precisa fazer, e custa caro). A cena põe o Group no
     ponto da dobradiça e interpola `rotation.y` entre `ang0` e
     `ang1`, que a planta já entregou prontos.

     A DE VIDRO É DOIS OBJETOS. O caixilho de alumínio é opaco e o
     vidro é translúcido — um material só não faz os dois, e vidro
     opaco na fachada de uma sede de torcida seria só uma porta cinza.
     Por isso o Group tem duas malhas. */
  function montarPorta(o) {
    const g = new THREE.Group();
    const W = o.larg, H = o.alt, T = Tecido();
    if (o.vidro) {
      const AL = '#b4b8bd', AL_ESC = '#8e9297';
      caixa(T, 0.6, W - 0.6, 0, 3.4, -1.3, 1.3, AL);            // travessa de baixo
      caixa(T, 0.6, W - 0.6, H - 3.6, H, -1.3, 1.3, AL);        // travessa de cima
      caixa(T, 0.6, 3.6, 0, H, -1.3, 1.3, AL);                  // montante da dobradiça
      caixa(T, W - 3.6, W - 0.6, 0, H, -1.3, 1.3, AL);          // montante solto
      /* o puxador vertical de tubo, na borda solta — é ele que diz
         de longe que a porta é de comércio e não de casa */
      for (const z of [-2.6, 2.6]) {
        caixa(T, W - 8.5, W - 7.1, H * 0.30, H * 0.70, z - 0.7, z + 0.7, AL_ESC);
        for (const y of [H * 0.30, H * 0.70 - 1.4])
          caixa(T, W - 8.5, W - 4.2, y, y + 1.4, z - 0.7, z + 0.7, AL_ESC);
      }
      const mq = malhaSolta(T, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
      if (mq) g.add(mq);
      const V = Tecido();
      caixa(V, 3.2, W - 3.2, 3.0, H - 3.2, -0.5, 0.5, '#9fc4cf');
      const mv = malhaSolta(V, new THREE.MeshLambertMaterial({
        vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.42 }));
      if (mv) g.add(mv);
    } else {
      const MAD = '#7d5c3a', MAD_ESC = '#63482c';
      caixa(T, 0.4, W - 0.4, 0, H, -1.6, 1.6, MAD);             // a folha
      /* os dois painéis rebaixados, um de cada lado — é o que faz a
         folha ler como porta de madeira e não como tábua */
      for (const z of [-1.7, 1.7])
        for (const [y0, y1] of [[H * 0.09, H * 0.44], [H * 0.52, H * 0.91]])
          caixa(T, 3.2, W - 3.2, y0, y1, Math.min(z, z * 0.82), Math.max(z, z * 0.82), MAD_ESC);
      /* a maçaneta, na borda solta */
      for (const z of [-2.4, 2.4])
        caixa(T, W - 7.5, W - 3.5, H * 0.45, H * 0.51, Math.min(z, 1.5), Math.max(z, 1.5), '#c9a227');
      const m = malhaSolta(T, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
      if (m) g.add(m);
    }
    g.position.set(o.x, 0, o.y);
    g.rotation.y = o.ang0;
    g.name = 'porta';
    meshes.push(g);
    /* o DELTA vai normalizado pra (-π, π]: `ang0` e `ang1` saem de
       `atan2`, e dois ângulos a 90° um do outro podem cair nos dois
       lados do ±π — interpolar cru faria a folha dar a volta por 270° */
    let d = o.ang1 - o.ang0;
    d = ((d + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    portas.push({ grupo: g, x: o.x, y: o.y, ang0: o.ang0, delta: d,
                  larg: W, lado: o.lado, aberta: false, t: 0 });
  }

  /* o portão de chapa corrida, ENCOSTADO na parede: ele corre pro
     lado, e a folha fechada no vão seria muro na porta da sede */
  function portao(T, o) {
    const h = o.alt || 50, cor = o.cor || '#8d9094';
    caixa(T, o.x0, o.x1, 2, h, o.y0, o.y1, cor);
    tmp.set(cor).multiplyScalar(0.8);
    const risco = '#' + tmp.getHexString();
    const ao = o.x1 - o.x0 > o.y1 - o.y0;
    const c0 = ao ? o.x0 : o.y0, c1 = ao ? o.x1 : o.y1;
    for (let c = c0 + 4; c < c1 - 2; c += 5) {
      const x0 = ao ? c - 0.7 : o.x0 - 0.4, x1 = ao ? c + 0.7 : o.x1 + 0.4;
      const z0 = ao ? o.y0 - 0.4 : c - 0.7, z1 = ao ? o.y1 + 0.4 : c + 0.7;
      caixa(T, x0, x1, 4, h - 3, z0, z1, risco);
    }
    caixa(T, o.x0 - 0.6, o.x1 + 0.6, h, h + 2, o.y0 - 0.6, o.y1 + 0.6, METAL_ESC);
  }

  /* caixa d'água azul, de plástico: um corpo de oito lados (lê redondo
     de longe) numa armação fina, com a tampa achatada por cima —
     apoiada no telhado, não bloqueia ninguém */
  function caixaDagua(T, o) {
    const AZUL = '#2f6fb0', TAMPA = '#1f4f82', PERNA = '#7a7268';
    const y0 = o.alt + 9, h = o.r * 1.5, N = 8;
    for (const [sx, sz] of [[-1,-1],[1,-1],[1,1],[-1,1]])
      caixa(T, o.x + sx*o.r*0.65 - 1, o.x + sx*o.r*0.65 + 1, o.alt, y0,
               o.y + sz*o.r*0.65 - 1, o.y + sz*o.r*0.65 + 1, PERNA);
    for (let i = 0; i < N; i++) {
      const a0 = i/N*Math.PI*2, a1 = (i+1)/N*Math.PI*2, tom = i % 2 ? 0.9 : 1.0;
      const p0 = [o.x + Math.cos(a0)*o.r, y0, o.y + Math.sin(a0)*o.r];
      const p1 = [o.x + Math.cos(a1)*o.r, y0, o.y + Math.sin(a1)*o.r];
      const p0t = [p0[0], y0 + h, p0[2]], p1t = [p1[0], y0 + h, p1[2]];
      tri(T, p0, p1, p1t, AZUL, tom);
      tri(T, p0, p1t, p0t, AZUL, tom);
      tri(T, [o.x, y0 + h + 1.6, o.y], p0t, p1t, TAMPA, 1.0);
    }
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
        case 'bomba': {
          /* bomba de combustível: corpo, visor e a mangueira na lateral */
          caixa(T, o.x0, o.x1, 0, o.alt, o.y0, o.y1, '#d8d4c8');
          caixa(T, o.x0 + 2, o.x1 - 2, o.alt * 0.58, o.alt - 6, o.y0 - 0.5, o.y0 + 0.4, '#23282e');
          caixa(T, o.x0 + 2, o.x1 - 2, o.alt * 0.58, o.alt - 6, o.y1 - 0.4, o.y1 + 0.5, '#23282e');
          caixa(T, o.x1 - 1, o.x1 + 3, o.alt * 0.4, o.alt * 0.62, mz - 2, mz + 2, '#c9463c');
          caixa(T, o.x0 - 3, o.x0 + 1, o.alt * 0.4, o.alt * 0.62, mz - 2, mz + 2, '#1f6a3a');
          break;
        }
        case 'tabela': {
          /* tabela de basquete: poste, prancha e o aro */
          caixa(T, o.x - 2.4, o.x + 2.4, 0, o.alt, o.y - 2.4, o.y + 2.4, '#6e6a5e');
          caixa(T, o.x - 22, o.x + 22, o.alt - 26, o.alt, o.y - 1.2, o.y + 1.2, '#eceadf');
          caixa(T, o.x - 7, o.x + 7, o.alt - 20, o.alt - 18, o.y - 12, o.y + 1, '#c9463c');
          break;
        }
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
        /* ---- a mobília da sede ---- */
        case 'colchao': colchao(T, o); break;
        case 'armario': armario(T, o); break;
        case 'estante': estante(T, o); break;
        case 'trofeus': trofeus(T, o); break;
        case 'mesa': mesa(T, o); break;
        case 'cadeira': cadeira(T, o); break;
        case 'caixote': caixote(T, o); break;
        case 'ralo': ralo(T, o); break;
        case 'ar': arCondicionado(T, o); break;
        case 'mural': mural(T, o); break;
        case 'portao': portao(T, o); break;
        case 'porta': montarPorta(o); break;
        case 'caixadagua': caixaDagua(T, o); break;
        case 'banco': {
          caixa(T, o.x0, o.x1, 10, 13, o.y0, o.y1, '#7a5a3a');
          caixa(T, o.x0, o.x1, 13, 30, o.y0, o.y0 + 2.5, '#7a5a3a');
          for (const x of [o.x0 + 3, o.x1 - 3]) caixa(T, x - 1.4, x + 1.4, 0, 10, mz - 1.4, mz + 1.4, '#55524a');
          break;
        }
        case 'mastro':
          caixa(T, o.x - 1.6, o.x + 1.6, 0, o.alt, o.y - 1.6, o.y + 1.6, '#cfcbbe');
          caixa(T, o.x - 0.4, o.x + 0.4, 0, 5, o.y - 5, o.y + 5, '#cfcbbe');
          /* Quem pede `bandeira` ganha PANO, numa malha à parte que
             tremula — ela é montada depois, junto com o atlas. Sem
             `bandeira` fica a flâmula chapada de antes, que é o que os
             mastros de repartição da cena usam. */
          if (o.bandeira) { o.bandeira.x = o.x; o.bandeira.y = o.y; o.bandeira.topo = o.alt; break; }
          caixa(T, o.x + 1.6, o.x + 34, o.alt - 22, o.alt - 2, o.y - 0.5, o.y + 0.5, o.cor || '#2f7a3c');
          if (o.cor2) caixa(T, o.x + 1.6, o.x + 34, o.alt - 14, o.alt - 9, o.y - 0.7, o.y + 0.7, o.cor2);
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
        case 'escudo': {
          /* uma placa só, com a textura que o atlas pintou */
          const u = uv.get(o.chave);
          if (!u) break;
          placa(TL, o.x + o.ox * 0.7, o.base + o.alt / 2, o.y + o.oz * 0.7,
                o.ox, o.oz, o.larg, o.alt, u);
          break;
        }
        case 'letreiro': {
          const u = uv.get((o.placa === false ? 'X:' : 'P:') + o.texto);
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
  alvoTelhado = TELHADOS;             // daqui pra frente, telhado é textura
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
    /* a fatia do equipamento tem chão próprio, e só ela */
    if (q.equip) for (const p of semAsAvenidas(q.equip.area, K.CALC)) laje(T, p, 0, 1.65, q.equip.chao);
    if (q.quintal) for (const p of semAsAvenidas(q.quintal, K.CALC)) laje(T, p, 0, q.quintal.alt, q.quintal.cor);
    /* os puxadinhos do fundo do quintal */
    for (const f of q.fundos || []) {
      caixa(T, f.x0, f.x1, 0, f.alt, f.y0, f.y1, f.cor);
      telhado(T, f.x0 - 2, f.x1 + 2, f.y0 - 2, f.y1 + 2, f.alt, Math.min(f.x1 - f.x0, f.y1 - f.y0) * 0.26, '#8f8a80');
    }
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
      /* `fundo`/`tinta` mandam na cor da placa quando quem pediu sabe
         qual é — a da sede é a segunda cor da torcida. Sem eles, vale
         o sorteio por hash do texto, que é o do comércio. */
      /* `placa: false` pinta DIRETO NA PAREDE, sem chapa: é o que o
         muro do baldio pede — lá o dizer é tinta spray, não letreiro */
      if (o.k === 'letreiro') {
        const ch = (o.placa === false ? 'X:' : 'P:') + o.texto;
        dizeres.set(ch, { chave: ch, texto: o.texto, placa: o.placa !== false, fundo: o.fundo, tinta: o.tinta });
      }
      /* a chave leva cor e forma: duas torcidas do país se chamam RAÇA,
         e o escudo de uma não pode servir pra outra */
      else if (o.k === 'mastro' && o.bandeira) {
        const b = o.bandeira;
        b.chave = 'B:' + b.texto + ':' + o.cor + ':' + o.cor2;
        dizeres.set(b.chave, { chave: b.chave, texto: b.texto, bandeira: true, img: b.img,
                               cor: o.cor, cor2: o.cor2, corTexto: b.corTexto });
      }
      else if (o.k === 'escudo') {
        o.chave = 'E:' + o.forma + ':' + o.texto + ':' + o.cor + ':' + o.cor2;
        dizeres.set(o.chave, { chave: o.chave, texto: o.texto, escudo: true, img: o.img,
                               forma: o.forma, cor: o.cor, cor2: o.cor2, corTexto: o.corTexto });
      }
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
      /* ---- O REBOCO CAÍDO, com o tijolo aparecendo ----
         Primeiro isto era MANCHA de sujeira — mofo, chuva, barro — e
         ficou um borrão escuro sem desenho nenhum. O que a parede de
         bairro tem de verdade é falha de reboco: um pedaço descascou e
         o tijolo baiano aparece por baixo, com o lábio de reboco ainda
         preso na beirada. São quatro falhas numa textura 2 × 2,
         recortadas por alfa, e quem leva qual sai do sorteio com a
         semente da posição — a cidade continua igual toda vez.
         O reboco cai DE BAIXO PRA CIMA (umidade que sobe da calçada),
         então a falha fica na metade de baixo da parede; só a quarta
         variante sobe pro alto, que é a do beiral. Muro baixo e casa
         estreita ficam de fora, que ali não cabe. */
      if (l.tipo !== 'muro' && l.alt >= 54 && frente >= 44) {
        const h = somaTexto('T' + (px | 0) + ',' + (pz | 0));
        const quantas = (h % 100) < 46 ? 0 : (h % 100) < 88 ? 1 : 2;
        for (let n = 0; n < quantas; n++) {
          const r = ((h >> (n * 5)) % 97) / 97;
          const q2 = (h >> (n * 7 + 1)) % 4;
          const lado = Math.min(frente * 0.34, l.alt * 0.42, 34) * (0.68 + r * 0.6);
          /* a de cima é a do beiral; as outras sobem da calçada */
          const alta = q2 === 2;
          const cy = alta ? l.alt - 4 - lado / 2 : 2 + lado / 2 + r * l.alt * 0.16;
          if (cy + lado / 2 > l.alt - 2 || lado < 12) continue;
          /* de lado, nunca centralizada: falha não se alinha com a porta */
          const desl = (((h >> (n * 3 + 2)) % 2) ? 1 : -1) * (frente - lado) * 0.5 * (0.30 + r * 0.6);
          const u0 = (q2 % 2) * 0.5, v0 = q2 < 2 ? 0.5 : 0;
          placa(MANCHAS, px, cy, pz, ox, oz, lado, lado,
                [u0 + 0.004, v0 + 0.004, u0 + 0.496, v0 + 0.496], desl);
        }
      }
      if (l.placa) {
        /* ACIMA DA PORTA. Com a casa mais alta o letreiro ficava em
           cima da porta e da vitrine — a placa é do comércio, mas a
           porta é por onde se entra. */
        const larg = Math.min(frente - 12, 110), alt = Math.min(15, larg / 4.6);
        const base = Math.min(Math.max(PORTA_ALT + 6, 52), l.alt - 6 - alt);
        placa(TL, px, base + alt / 2, pz, ox, oz, larg, alt, uv.get('P:' + l.placa));
      }
      if (l.pixacao) {
        /* a pixação não pode passar da parede: em muro de 12 ela tem de
           caber nos 12, senão sobra tinta boiando no ar */
        const larg = Math.min(frente - 12, 62);
        const alt = Math.min(12, larg / 5, l.alt - 4);
        if (alt < 4) continue;
        /* baixa, abaixo da linha das janelas, e fora do meio: pixação
           não se alinha com a porta */
        const y = Math.min(l.alt - 2 - alt / 2, 3 + alt / 2);
        const folga = Math.max(0, (frente - larg) / 2 - 2);
        const lado = somaTexto(l.pixacao) % 2 ? 1 : -1;
        placa(TL, px, y, pz, ox, oz, larg, alt, uv.get('X:' + l.pixacao), lado * folga * 0.7);
      }
    }
    malhaUV(TL, tex, 'letreiros');

    /* ---- A BANDEIRA DO MASTRO, que tremula ----
       Um pano de N × M retalhos preso ao mastro, com o escudo da
       torcida na textura. Ela não pode entrar na malha dos letreiros:
       o pano MEXE, e pra mexer ele precisa de geometria própria, que a
       cena atualiza por quadro. A onda é uma senoide que viaja do
       mastro pra ponta, com amplitude crescendo ao longo do pano —
       preso na tralha, solto na ponta, que é como bandeira balança. */
    for (const q of K.QUADRAS) {
      if (!q.equip) continue;
      for (const o of q.equip.pecas) {
        const b = o.k === 'mastro' && o.bandeira;
        if (!b || b.x === undefined) continue;
        const u = uv.get(b.chave);
        if (!u) continue;
        const NU = 10, NV = 4, T = { pos: [], uv: [] };
        const base = [], y0 = b.topo - 6 - b.alt;
        for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
          const s = i / NU, t = j / NV;
          base.push([b.x + b.dirx * (2 + s * b.larg), y0 + t * b.alt, b.y + b.dirz * (2 + s * b.larg)]);
        }
        const idx = (i, j) => j * (NU + 1) + i;
        for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
          const a0 = idx(i, j), b0 = idx(i + 1, j), c0 = idx(i + 1, j + 1), d0 = idx(i, j + 1);
          for (const [k, su, sv] of [[a0, i / NU, j / NV], [b0, (i + 1) / NU, j / NV], [c0, (i + 1) / NU, (j + 1) / NV],
                                     [a0, i / NU, j / NV], [c0, (i + 1) / NU, (j + 1) / NV], [d0, i / NU, (j + 1) / NV]]) {
            T.pos.push(base[k][0], base[k][1], base[k][2]);
            T.uv.push(u[0] + (u[2] - u[0]) * su, u[1] + (u[3] - u[1]) * sv);
          }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos.slice(), 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2));
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({
          map: tex, alphaTest: 0.45, side: THREE.DoubleSide
        }));
        m.name = 'bandeira';
        triangulos += T.pos.length / 9;
        meshes.push(m);
        /* o repouso vai junto: a onda é aplicada sobre ele a cada quadro */
        bandeiras.push({ mesh: m, repouso: Float32Array.from(T.pos),
                         dirx: b.dirx, dirz: b.dirz, larg: b.larg, x: b.x, y: b.y });
      }
    }
  }
  /* ---- O TELHADO DA SEDE, que se abre ----
     A sede é coberta como qualquer casa — cobertura de galpão, duas
     águas rasas sobre as paredes de fora —, mas quem está DENTRO
     precisa ver a planta. Então cada telhado sai numa malha só dele,
     com a área da sede junto: a cena esconde a malha quando o líder do
     jogador entra na área e mostra de volta quando ele sai. É o corte
     de planta baixa dos jogos de gestão, e custa uma malha por sede. */
  const tetos = [];
  for (const q of K.QUADRAS) {
    const e = q.equip;
    if (!e || !e.teto) continue;
    /* O TELHADO PODE COBRIR SÓ UM PEDAÇO DA SEDE. Na nível 1 o PÁTIO é
       descoberto — é ele que faz a sede pequena ler como sede pequena
       —, então o telhado vem com retângulo próprio. Sem isso a malha
       tapava o pátio e o colchão sumia de cima. A área que a cena
       esconde continua sendo a da sede inteira: quem entra pelo portão
       já está dentro. */
    const a = e.teto.area || e.area, T = Tecido();
    alvoTelhado = null;               // fibrocimento, e a malha dela liga e desliga
    telhado(T, a.x0, a.x1, a.y0, a.y1, e.teto.base, e.teto.queda, e.teto.cor);
    alvoTelhado = TELHADOS;
    /* as CAIXAS D'ÁGUA, que toda laje daqui tem — e sem elas o telhado
       da sede é um retângulo cinza de 19 m sem nada que dê escala. Na
       nível 1 são zero: a caixa dela fica no chão do pátio, que é onde
       fica a de sede de bairro. */
    const ao = a.x1 - a.x0 > a.y1 - a.y0;
    const quantas = e.teto.caixas === undefined ? [0.30, 0.62] : [0.30, 0.62].slice(0, e.teto.caixas);
    for (const t of quantas) {
      const cx = ao ? a.x0 + (a.x1 - a.x0) * t : (a.x0 + a.x1) / 2 - 2;
      const cz = ao ? (a.y0 + a.y1) / 2 - 2 : a.y0 + (a.y1 - a.y0) * t;
      const y = e.teto.base + e.teto.queda - 2;
      caixa(T, cx - 13, cx + 13, y, y + 5, cz - 13, cz + 13, '#8d8579');
      caixa(T, cx - 11, cx + 11, y + 5, y + 20, cz - 11, cz + 11, '#3f74a8');
      caixa(T, cx - 12, cx + 12, y + 20, y + 22, cz - 12, cz + 12, '#5a8cbc');
    }
    const m = malha(T, true, 'teto:' + e.lado);
    if (m) tetos.push({ lado: e.lado, area: e.area, mesh: m });
  }

  /* ---- A BEIRA DA ESTRADA ----
     Fora do contorno da cidade não há quarteirão nem pedaço, então a
     casa solta da estrada sai numa malha própria. É lote girado, como
     a casa da avenida, e passa pelo MESMO `lote()`: corpo, telhado de
     duas águas, fachada com porta e janela, e o letreiro vem junto com
     os outros. Sem `limite`, que aqui não há calçada pra respeitar. */
  const TB = Tecido();
  limite = null;
  /* a calçada primeiro, que a casa assenta em cima dela */
  for (const l of K.BEIRA || [])
    if (l.calcada) caixaRot(TB, l.calcada.cx, l.calcada.cy, l.calcada.w, l.calcada.h,
                            0, 1.4, l.calcada.ang, '#8d897d');
  for (const l of K.BEIRA || []) {
    /* a casa da favela manda o telhado dela pra malha de telha miúda */
    alvoTelhado = l.favela ? TELHADOS_FAV : TELHADOS;
    lote(TB, l);
  }
  alvoTelhado = TELHADOS;
  malhaTex(TB, REBOCO_LAZY(), 'beira');

  /* O REBOCO NA PAREDE. O quarteirão inteiro passa a ter textura: o
     reboco chapiscado dá grão à parede, ao muro e à laje da calçada, e
     a cor do vértice continua mandando no tom de cada casa — o Lambert
     multiplica os dois. A UV sai do MUNDO, com o eixo certo por face,
     então parede vizinha não repete o mesmo pedaço da textura. */
  for (const T of pedacos.values()) malhaTex(T, REBOCO_LAZY(), 'quarteirao');

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
  for (const s of K.SEMAFOROS || []) semaforo(TS, s);
  for (const o of K.FAVELA_CAIXAS || []) caixaDagua(TS, o);
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
  malha(TS, true, 'soltos');

  /* ---- as malhas texturadas: telhado e mancha de parede ---- */
  alvoTelhado = null;
  /* o teto da sede também é caixa, e o tecido dele tem UV: sem mapa a
     malha sai lisa, que é o que fibrocimento é */
  malhaTex(TELHADOS, textura('img/texturas/telha.png', true), 'telhados');
  malhaTex(TELHADOS_FAV, textura('img/texturas/telha.png', true), 'telhados:favela');
  malhaTex(MANCHAS, textura('img/texturas/tijolo.png'), 'tijolo', true);

  /* ---- os decalques de chão: mato, entulho, terra e folha ----
     Tudo num tecido só, uma malha só, uma textura só: são mais de mil
     placas, e cada uma virar chamada de desenho seria o fim. O corte
     de alfa é mais baixo que o das placas de letreiro (0,32 contra
     0,45) porque folha de capim é fina e some com corte alto. */
  const TDEC = { pos: [], uv: [] };
  for (const d of K.DECALQUES || []) decalqueChao(TDEC, d, 2.4);
  malhaUV(TDEC, textura('img/texturas/chao.png'), 'decalques', 0.32, true);

  /* ---- o mato: moitas, em duas pirâmides baixas ---- */
  const TM = Tecido();
  for (const m of K.MOITAS) {
    piramide(TM, m.x, 0, m.r * 0.9, m.r * 0.8, m.y, '#5d7746');
    piramide(TM, m.x + m.r * 0.5, 0, m.r * 0.6, m.r * 0.5, m.y - m.r * 0.3, '#52693e');
  }
  malha(TM, false, 'moitas');

  return { meshes, triangulos, tetos, bandeiras, portas, pedacos: pedacos.size };
}
