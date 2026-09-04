/* =========================================================
   CENA 3D — a mesma briga, vista de perto
   ---------------------------------------------------------
   Isto NÃO é um jogo novo. É um segundo desenhista para o
   mesmo estado: `combate.js` continua sendo dono de tudo que
   anda, bate, cai e some, em coordenada de imagem (1536×1024),
   e este arquivo só lê `J` uma vez por quadro e põe em pé.

   As quatro regras que fazem isso funcionar:

   1. O CHÃO SAI DE GRAÇA. `arredores.desenharFundo(ctx)` já
      sabe pintar qualquer cena — a foto aérea dos arredores ou
      a pintura procedural da praça/rua/bar. Chamamos ela num
      canvas fora da tela e usamos o resultado como textura do
      plano. Zero arte nova.

   2. O QUE BLOQUEIA É O QUE SOBE, E SOBE DA MALHA. Não da
      lista de polígonos: a lista dos arredores tem 9 retângulos
      e a foto tem trinta e poucos prédios. Quem sabe onde é
      parede é `A.malha`, a mesma que a colisão usa. Extrudar a
      malha garante que não existe parede invisível — se o corpo
      não passa, o olho vê por quê.

   3. O BONECO É DE CAIXA. Seis peças (cabeça, tronco, dois
      braços, duas pernas), uma malha instanciada por peça: 400
      pessoas custam 6 chamadas de desenho, e cada uma anda com
      a própria fase de passada. Nenhum arquivo de modelo,
      nenhum osso, nenhuma animação importada. É o lugar do
      boneco do Blender quando ele existir — a interface é a
      mesma.

   4. ALTURA É LEITURA, NÃO ESCALA. A cena é uma abstração de
      tabuleiro: o disco tem raio 7 e o estádio 910 de largura.
      Por isso há dois conjuntos de altura — `maquete`, baixa,
      pra ler a briga de cima, e `rua`, alta, pra a câmera de
      ombro ter parede em volta. Trocar com B.

   Coordenadas: jogo (x, y) → mundo (x, altura, y).
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';

const A = TO.diaJogo.arredores;
const W = A.W, H = A.H, CEL = A.CEL, COLS = A.COLS, ROWS = A.ROWS;

const MAX_GENTE = 900;
const MAX_PMS   = 40;
const MAX_PROJ  = 60;
const MAX_MODS  = 120;

/* ---------------------------------------------------------
   O BONECO, EM NÚMERO
   Altura total ~31. O corpo do jogo tem raio 7 (14 de largura),
   que é bem mais largo que um ombro nesta foto — a folga entre
   os bonecos numa multidão vem daí, e é do jogo, não do
   desenho. Mexer nisso é mexer na colisão, não aqui.
   --------------------------------------------------------- */
const B = {
  /* A PERNA TAMBÉM TEM JOELHO.
     Perna reta indo e voltando é pêndulo, não passada: o pé varre o
     chão na volta e o corpo não tem peso. Com joelho, a perna solta
     dobra pra passar e a perna de apoio fica reta — que é o que faz
     o quadril subir e descer sozinho. */
  coxa:   { l: 3.2, a: 6.4, p: 3.2, quadril: 13, lado: 2.1 },
  canela: { l: 2.9, a: 6.6, p: 2.9 },
  tronco: { l: 6.6, a: 12,  p: 4.4, centro: 19 },
  cabeca: { l: 5.4, a: 5.4, p: 5.4, centro: 28.4 },
  /* O BRAÇO TEM COTOVELO, E ISSO NÃO É CAPRICHO.
     Com um osso só, guarda e soco são o mesmo gesto com dois
     ângulos parecidos, e de longe ninguém distingue um do outro.
     Com dois, guarda é braço baixo e antebraço em pé na frente do
     rosto, e soco é o antebraço abrindo — leem-se de longe e são
     coisas diferentes. Custa duas malhas instanciadas a mais. */
  bracoS: { l: 2.5, a: 6,   p: 2.5, ombro: 24.4, lado: 4.4 },
  bracoI: { l: 2.2, a: 6.5, p: 2.2 }
};
const PELE = [0x8d5f42, 0xa87a56, 0x6f4a34, 0xc09270, 0x53382a];

export function criar(canvas) {
  const rend = new THREE.WebGLRenderer({ canvas, antialias: true,
                                         preserveDrawingBuffer: true });
  rend.setPixelRatio(Math.min(devicePixelRatio, 2));
  rend.shadowMap.enabled = true;
  rend.shadowMap.type = THREE.PCFSoftShadowMap;
  rend.outputColorSpace = THREE.SRGBColorSpace;

  const cena = new THREE.Scene();
  cena.background = new THREE.Color(0x3d4655);
  cena.fog = new THREE.Fog(0x3d4655, 780, 2300);

  const cam = new THREE.PerspectiveCamera(52, 1, 1.2, 6000);

  cena.add(new THREE.HemisphereLight(0xccdcec, 0x55503f, 1.55));
  const sol = new THREE.DirectionalLight(0xfff4e2, 1.30);
  sol.position.set(W / 2 + 900, 1800, H / 2 - 1100);
  sol.target.position.set(W / 2, 0, H / 2);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, {
    left: -1100, right: 1100, top: 1100, bottom: -1100, near: 200, far: 4600 });
  sol.shadow.bias = -0.0016;
  cena.add(sol, sol.target);

  /* =======================================================
     TEXTURAS PROCEDURAIS
     Fachada e granulado saem de canvas, como a cena 2D já faz
     com o asfalto. É o que segura a câmera de perto sem
     nenhum arquivo de imagem novo.
     ======================================================= */
  function texturaFachada() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#cfcabf'; g.fillRect(0, 0, 256, 256);
    /* faixa de laje entre andares */
    g.fillStyle = '#b9b3a7'; g.fillRect(0, 0, 256, 18);
    g.fillStyle = '#dcd7cc'; g.fillRect(0, 18, 256, 4);
    /* três janelas por módulo, com peitoril e vidro escuro */
    for (let i = 0; i < 3; i++) {
      const x = 22 + i * 76;
      g.fillStyle = '#3a3f47'; g.fillRect(x, 52, 52, 150);
      g.fillStyle = '#20252c'; g.fillRect(x + 4, 56, 44, 142);
      /* reflexo diagonal, que é o que faz vidro parecer vidro */
      g.fillStyle = 'rgba(190,205,220,.20)';
      g.beginPath(); g.moveTo(x + 4, 198); g.lineTo(x + 30, 56);
      g.lineTo(x + 48, 56); g.lineTo(x + 22, 198); g.closePath(); g.fill();
      g.fillStyle = '#9d9689'; g.fillRect(x - 3, 200, 58, 7);
    }
    g.fillStyle = 'rgba(0,0,0,.10)'; g.fillRect(0, 232, 256, 24);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  /* o granulado: a foto aérea tem 1 texel por unidade de mundo e
     a câmera de ombro amplia isso umas 14 vezes. Sem uma segunda
     camada por cima, o chão de perto vira borrão. */
  function texturaGrao() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const d = g.createImageData(128, 128);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = 238 + (Math.random() - 0.5) * 34;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(W / 26, H / 26);
    return t;
  }
  const texFachada = texturaFachada();

  /* =======================================================
     CHÃO
     ======================================================= */
  const cvChao = document.createElement('canvas');
  cvChao.width = W; cvChao.height = H;
  const ctxChao = cvChao.getContext('2d', { willReadFrequently: true });
  const texChao = new THREE.CanvasTexture(cvChao);
  texChao.colorSpace = THREE.SRGBColorSpace;
  texChao.anisotropy = rend.capabilities.getMaxAnisotropy();

  function repintarChao() {
    ctxChao.setTransform(1, 0, 0, 1, 0, 0);
    ctxChao.clearRect(0, 0, W, H);
    A.desenharFundo(ctxChao);
    texChao.needsUpdate = true;
  }

  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshLambertMaterial({ map: texChao }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(W / 2, 0, H / 2);
  chao.receiveShadow = true;
  cena.add(chao);

  const grao = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: texturaGrao(),
      blending: THREE.MultiplyBlending, transparent: true, depthWrite: false }));
  grao.rotation.x = -Math.PI / 2;
  grao.position.set(W / 2, 0.35, H / 2);
  cena.add(grao);

  /* a cidade não acaba na borda da foto: um plano grande, da cor
     do asfalto, mais a névoa, é o que impede a câmera de ombro de
     ver o vazio preto quando o bonde nasce colado na borda sul */
  const texFora = texturaGrao();
  texFora.repeat.set(W * 5 / 26, H * 6 / 26);
  const fora = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 5, H * 6),
    new THREE.MeshLambertMaterial({ map: texFora, color: 0x3c3b35 }));
  fora.rotation.x = -Math.PI / 2;
  fora.position.set(W / 2, -1.2, H / 2);
  cena.add(fora);

  /* =======================================================
     PRÉDIOS — extrudados da malha de caminhabilidade

     Passo 1: componentes ligados das células bloqueadas.
     Passo 2: cada componente vira retângulos (greedy meshing).
     Passo 3: uma altura e uma cor por componente, tiradas do
              tamanho e da cor média da própria foto.
     Passo 4: duas geometrias — telhado (textura do chão,
              projetada de cima) e parede (fachada em ladrilho,
              tingida por cor de vértice).
     ======================================================= */
  /* Nas cenas desenhadas o bloco já vem com tipo (`rot`), que é o
     mesmo que `cenario.js` usa pra escolher o pintor. Reaproveitar
     ele aqui é o que faz a praça e o bar subirem certo em vez de
     virarem quarteirão de prédio. */
  const ALTURA_POR_NOME = [
    [/est[áa]dio|arquibancada/,                      'estadio'],
    [/pra[çc]a|canteiro|jardim/,                     'baixo'],
    [/carro|mesa|banco|lixeira|engradado|ca[çc]amba/, 'baixo'],
    [/fachada|muro|parede|vitrine/,                  'muro'],
    [/[áa]rvore/,                                    'verde'],
    [/coreto|quiosque|banca|guarita|ponto|balc[ãa]o|freezer|sinuca/, 'medio'],
    [/onibus|ônibus|carroforte/,                     'medio'],
    [/igreja|torre/,                                 'alto'],
    [/pr[ée]dio|predinho|sobrado/,                   'base'],
    [/casa|padaria|boteco|bar|joalheria|vestiario|vestiário/, 'medio']
  ];
  const MODOS = {
    /* base = altura de um prédio comum, em px da cena */
    maquete: { base: 62,  estadio: 118, muro: 22, verde: 26, baixo: 12, medio: 34, alto: 88 },
    rua:     { base: 168, estadio: 300, muro: 52, verde: 34, baixo: 16, medio: 78, alto: 240 }
  };
  let modo = 'rua';

  const grupoPredios = new THREE.Group();
  cena.add(grupoPredios);

  /* Altura de cada célula da malha, preenchida quando os prédios
     são montados. Serve pra câmera: "tem prédio entre mim e o
     jogador?" é uma pergunta que a malha de caminhabilidade não
     responde — ela não sabe se o obstáculo tem 16 ou 300 de alto,
     e canteiro não é parede. */
  const alturaCel = new Float32Array(COLS * ROWS);
  function alturaEm(x, z) {
    const c = Math.floor(x / CEL), r = Math.floor(z / CEL);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 0;
    return alturaCel[r * COLS + c];
  }

  function limparGrupo(g) {
    for (const o of [...g.children]) {
      g.remove(o);
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    }
  }

  /* ---- componentes ligados das células bloqueadas ---- */
  function componentes() {
    const dono = new Int16Array(COLS * ROWS).fill(-1);
    const comps = [];
    const fila = new Int32Array(COLS * ROWS);
    for (let i0 = 0; i0 < COLS * ROWS; i0++) {
      if (A.malha[i0] || dono[i0] >= 0) continue;
      const id = comps.length;
      const cel = [];
      let ini = 0, fim = 0;
      fila[fim++] = i0; dono[i0] = id;
      while (ini < fim) {
        const i = fila[ini++];
        cel.push(i);
        const c = i % COLS, r = (i / COLS) | 0;
        if (c > 0        && !A.malha[i - 1]    && dono[i - 1]    < 0) { dono[i - 1]    = id; fila[fim++] = i - 1; }
        if (c < COLS - 1 && !A.malha[i + 1]    && dono[i + 1]    < 0) { dono[i + 1]    = id; fila[fim++] = i + 1; }
        if (r > 0        && !A.malha[i - COLS] && dono[i - COLS] < 0) { dono[i - COLS] = id; fila[fim++] = i - COLS; }
        if (r < ROWS - 1 && !A.malha[i + COLS] && dono[i + COLS] < 0) { dono[i + COLS] = id; fila[fim++] = i + COLS; }
      }
      comps.push(cel);
    }
    return { dono, comps };
  }

  /* ---- retângulos maximais de um componente (greedy) ---- */
  function retangulos(dono, id, cels) {
    let c0 = COLS, c1 = 0, r0 = ROWS, r1 = 0;
    for (const i of cels) {
      const c = i % COLS, r = (i / COLS) | 0;
      if (c < c0) c0 = c;
      if (c > c1) c1 = c;
      if (r < r0) r0 = r;
      if (r > r1) r1 = r;
    }
    const lg = c1 - c0 + 1;
    const usado = new Uint8Array(lg * (r1 - r0 + 1));
    const meu = (c, r) => c >= c0 && c <= c1 && r >= r0 && r <= r1 &&
                          dono[r * COLS + c] === id &&
                          !usado[(r - r0) * lg + (c - c0)];
    const rets = [];
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (!meu(c, r)) continue;
      let w = 1;
      while (meu(c + w, r)) w++;
      let h = 1;
      cresce: while (true) {
        for (let k = 0; k < w; k++) if (!meu(c + k, r + h)) break cresce;
        h++;
      }
      for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++)
        usado[(r + dr - r0) * lg + (c + dc - c0)] = 1;
      rets.push([c * CEL, r * CEL, (c + w) * CEL, (r + h) * CEL]);
    }
    return { rets, caixa: [c0 * CEL, r0 * CEL, (c1 + 1) * CEL, (r1 + 1) * CEL] };
  }

  /* ---- cor média do componente, lida da própria textura ---- */
  function corMedia(px, cels) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let k = 0; k < cels.length; k += 3) {
      const i = cels[k];
      const x = Math.min(W - 1, ((i % COLS) + 0.5) * CEL | 0);
      const y = Math.min(H - 1, (((i / COLS) | 0) + 0.5) * CEL | 0);
      const o = (y * W + x) * 4;
      r += px[o]; g += px[o + 1]; b += px[o + 2]; n++;
    }
    return n ? [r / n, g / n, b / n] : [140, 135, 128];
  }

  function nomeDoPoligono(D, caixa) {
    let melhor = null, maior = 0;
    for (const p of (D.poligonos && D.poligonos.bloqueio) || []) {
      const xs = p.pontos.map(q => q[0]), ys = p.pontos.map(q => q[1]);
      const ax = Math.max(caixa[0], Math.min(...xs)), bx = Math.min(caixa[2], Math.max(...xs));
      const ay = Math.max(caixa[1], Math.min(...ys)), by = Math.min(caixa[3], Math.max(...ys));
      const a = Math.max(0, bx - ax) * Math.max(0, by - ay);
      if (a > maior) { maior = a; melhor = (p.rot || p.nome || '').toLowerCase(); }
    }
    return maior > 0 ? melhor : null;
  }

  function montarPredios(D) {
    limparGrupo(grupoPredios);
    const M = MODOS[modo];
    const px = ctxChao.getImageData(0, 0, W, H).data;
    const { dono, comps } = componentes();
    alturaCel.fill(0);

    const pTopo = [], uvTopo = [], iTopo = [];
    const pPar = [], nPar = [], uvPar = [], cPar = [];
    const cor = new THREE.Color();
    const BRANCO = new THREE.Color(1, 1, 1);
    let nRet = 0;

    comps.forEach((cels, id) => {
      if (cels.length < 3) return;                    // cisco da máscara
      const { rets, caixa } = retangulos(dono, id, cels);
      const areaPx = cels.length * CEL * CEL;
      const media = corMedia(px, cels);
      const mr = media[0], mg = media[1], mb = media[2];
      const verde = mg > mr * 1.05 && mg > mb * 1.05;

      const nome = nomeDoPoligono(D, caixa);
      const regra = nome && ALTURA_POR_NOME.find(par => par[0].test(nome));
      let altBase;
      if (regra) altBase = M[regra[1]];
      else if (verde) altBase = M.verde;
      else if (areaPx < 5200) altBase = M.baixo;
      else altBase = M.base * (0.72 + Math.min(0.55, areaPx / 260000));

      /* A parede herda a cor do telhado — prédio de telha vermelha
         não ganha parede cinza por acaso. Clarear multiplicando
         satura: um telhado cinza-azulado × 1,5 estoura o vermelho e
         o verde antes do azul e vira um bloco azul-piscina. Puxar
         pro branco clareia sem mexer no matiz. */
      cor.setRGB(mr / 255, mg / 255, mb / 255);
      if (verde) cor.multiplyScalar(0.62);
      else cor.lerp(BRANCO, 0.44);

      /* o mesmo quarteirão com uma altura só vira muro; recortado
         em prédios de altura diferente, vira quarteirão. O degrau
         sai de um hash da posição, então é sempre o mesmo. */
      const recorta = !regra && !verde && areaPx >= 5200;
      const TILE = 40 + (id % 4) * 5;
      for (const ret of rets) {
        const x0 = ret[0], y0 = ret[1], x1 = ret[2], y1 = ret[3];
        nRet++;
        const alt = recorta
          ? altBase * (0.74 + ((Math.sin(x0 * 12.9898 + y0 * 78.233) * 43758.5) % 1 + 1) % 1 * 0.62)
          : altBase;
        for (let r = y0 / CEL; r < y1 / CEL; r++)
          for (let c = x0 / CEL; c < x1 / CEL; c++) alturaCel[r * COLS + c] = alt;
        /* --- telhado --- */
        const base = pTopo.length / 3;
        const q = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
        for (const s of q) {
          pTopo.push(s[0], alt, s[1]);
          uvTopo.push(s[0] / W, 1 - s[1] / H);
        }
        iTopo.push(base, base + 2, base + 1, base, base + 3, base + 2);

        /* --- paredes: quatro quadras, normal explícita --- */
        const paredes = [
          [[x0, y0], [x1, y0], [0, 0, -1]],
          [[x1, y1], [x0, y1], [0, 0, 1]],
          [[x1, y0], [x1, y1], [1, 0, 0]],
          [[x0, y1], [x0, y0], [-1, 0, 0]]
        ];
        for (const par of paredes) {
          const a = par[0], b = par[1], n = par[2];
          const comp = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const u = comp / TILE, v = alt / TILE;
          const vs = [[a[0], 0, a[1], 0, 0], [b[0], 0, b[1], u, 0],
                      [b[0], alt, b[1], u, v], [a[0], alt, a[1], 0, v]];
          for (const k of [0, 1, 2, 0, 2, 3]) {
            const s = vs[k];
            pPar.push(s[0], s[1], s[2]);
            nPar.push(n[0], n[1], n[2]);
            uvPar.push(s[3], s[4]);
            cPar.push(cor.r, cor.g, cor.b);
          }
        }
      }
    });

    const gT = new THREE.BufferGeometry();
    gT.setAttribute('position', new THREE.Float32BufferAttribute(pTopo, 3));
    gT.setAttribute('uv', new THREE.Float32BufferAttribute(uvTopo, 2));
    gT.setIndex(iTopo);
    gT.computeVertexNormals();
    const mT = new THREE.Mesh(gT, new THREE.MeshLambertMaterial({ map: texChao }));
    mT.castShadow = true; mT.receiveShadow = true;
    grupoPredios.add(mT);

    const gP = new THREE.BufferGeometry();
    gP.setAttribute('position', new THREE.Float32BufferAttribute(pPar, 3));
    gP.setAttribute('normal', new THREE.Float32BufferAttribute(nPar, 3));
    gP.setAttribute('uv', new THREE.Float32BufferAttribute(uvPar, 2));
    gP.setAttribute('color', new THREE.Float32BufferAttribute(cPar, 3));
    const mP = new THREE.Mesh(gP, new THREE.MeshLambertMaterial(
      { map: texFachada, vertexColors: true }));
    mP.castShadow = true; mP.receiveShadow = true;
    grupoPredios.add(mP);

    return { blocos: comps.length, retangulos: nRet,
             triangulos: (iTopo.length + pPar.length) / 3 };
  }

  /* =======================================================
     PORTÕES
     ======================================================= */
  const COR_LADO = { mandante: 0xc0392b, visitante: 0x2a5fa8 };
  const grupoPortoes = new THREE.Group();
  cena.add(grupoPortoes);

  function montarPortoes(D) {
    limparGrupo(grupoPortoes);
    for (const e of D.entradas || []) {
      const d = e.dir || [0, -1];
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(7, 62, 54),
        new THREE.MeshLambertMaterial({ color: COR_LADO[e.lado] || 0x8a6a2a }));
      m.position.set(e.x, 31, e.y);
      m.rotation.y = -Math.atan2(d[1], d[0]);
      m.castShadow = true;
      grupoPortoes.add(m);
    }
  }

  /* =======================================================
     GENTE — seis peças instanciadas, uma passada por pessoa
     ======================================================= */
  const caixa1 = new THREE.BoxGeometry(1, 1, 1);
  const esfera = new THREE.SphereGeometry(1, 10, 8);

  const instanciar = (geo, n, opc) => {
    const m = new THREE.InstancedMesh(geo,
      new THREE.MeshLambertMaterial(opc || {}), n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.castShadow = true;
    m.count = 0;
    m.frustumCulled = false;
    cena.add(m);
    return m;
  };

  const PECAS = ['cabeca', 'tronco',
                 'bracoSE', 'bracoIE', 'bracoSD', 'bracoID',
                 'coxaE', 'canelaE', 'coxaD', 'canelaD'];
  const gente = {}, pm = {};
  for (const p of PECAS) {
    gente[p] = instanciar(caixa1, MAX_GENTE);
    pm[p]    = instanciar(caixa1, MAX_PMS);
  }
  const iProj  = instanciar(esfera, MAX_PROJ);
  const iGrade = instanciar(caixa1, MAX_MODS);
  iGrade.receiveShadow = true;

  /* o esqueleto: uma árvore de Object3D montada uma vez. Por
     pessoa a gente muda o quadril, o ombro e a raiz, chama
     updateMatrixWorld e colhe as seis matrizes. Nenhum osso,
     nenhum arquivo — e o dia que entrar um boneco do Blender,
     entra aqui, com a mesma interface. */
  const raiz = new THREE.Object3D();
  const juntas = {};
  function membro(nome, pai, jx, jy, jz, dim, baixo) {
    const j = new THREE.Object3D();
    j.position.set(jx, jy, jz);
    pai.add(j);
    const m = new THREE.Object3D();
    m.position.set(0, baixo ? -dim.a / 2 : 0, 0);
    m.scale.set(dim.l, dim.a, dim.p);
    j.add(m);
    juntas[nome] = { j: j, m: m };
  }
  membro('tronco', raiz, 0, B.tronco.centro, 0, B.tronco, false);
  membro('cabeca', raiz, 0, B.cabeca.centro, 0, B.cabeca, false);
  membro('bracoSE', raiz, -B.bracoS.lado, B.bracoS.ombro, 0, B.bracoS, true);
  membro('bracoSD', raiz,  B.bracoS.lado, B.bracoS.ombro, 0, B.bracoS, true);
  /* o cotovelo pendura na ponta do braço, então o antebraço herda
     o giro do ombro de graça */
  membro('bracoIE', juntas.bracoSE.j, 0, -B.bracoS.a, 0, B.bracoI, true);
  membro('bracoID', juntas.bracoSD.j, 0, -B.bracoS.a, 0, B.bracoI, true);
  membro('coxaE', raiz, -B.coxa.lado, B.coxa.quadril, 0, B.coxa, true);
  membro('coxaD', raiz,  B.coxa.lado, B.coxa.quadril, 0, B.coxa, true);
  membro('canelaE', juntas.coxaE.j, 0, -B.coxa.a, 0, B.canela, true);
  membro('canelaD', juntas.coxaD.j, 0, -B.coxa.a, 0, B.canela, true);

  /* =======================================================
     O QUE A SIMULAÇÃO NÃO GUARDA

     `combate.js` não tem pose, não tem direção e não tem "estou
     dando um soco agora". Tem outra coisa, e ela basta:

       d.golpe      0,12 e caindo — acertei alguém neste quadro
       d.tremor     até 6, caindo a 9/s — levei pancada agora
       d.hostil     até 4 s — estou em briga, mesmo sem contato
       d.atordoado  cassetete da PM, 0,7 s
       p.cooldown   sobe pra 1,9 no quadro em que o PM acerta

     A pose sai daí, e só daí. Nada foi acrescentado ao combate:
     se o boneco levanta o braço, é porque o dano saiu de verdade.
     A direção e a fase da passada saem da diferença de posição
     entre dois quadros — também sem tocar na simulação.
     ======================================================= */
  const TAU = Math.PI * 2;
  const curto = (de, para) => ((para - de + Math.PI * 3) % TAU) - Math.PI;
  const chegar = (a, b, k) => a + (b - a) * Math.min(1, Math.max(0, k));

  /* ombro (S) e cotovelo (I) de cada pose. Ângulo negativo no
     ombro joga o braço pra frente; negativo no cotovelo dobra o
     antebraço pra cima. */
  const POSE = {
    guardaS: -0.32, guardaI: -2.05, guardaZ: 0.34,  // punho no queixo
    socoS:   -1.46, socoI:   -0.14,                 // braço aberto
    armaS:    0.95, armaI:   -2.35,                 // pedra atrás da cabeça
    soltaS:  -1.95, soltaI:  -0.20                  // já soltou
  };

  /* Sai rápido, segura estendido um instante e volta devagar. É o
     desenho de curva de qualquer soco, e é o que separa "braço
     subindo e descendo" de "soco". */
  function curvaSoco(t) {
    if (t < 0.30) { const k = t / 0.30; return k * k * (3 - 2 * k); }
    if (t < 0.46) return 1;
    const k = (t - 0.46) / 0.54;
    return 1 - k * k;
  }

  const anda = new Map();
  function estado(chave, x, z, dt) {
    let e = anda.get(chave);
    if (!e) {
      e = { x: x, z: z, ang: 0, fase: Math.random() * TAU, vel: 0,
            guarda: 0, soco: 0, socoLado: 0, arremesso: 0, recuo: 0,
            rumo: null, cdAnt: 0, tremAnt: 0 };
      anda.set(chave, e);
    }
    const dx = x - e.x, dz = z - e.z;
    const d = Math.hypot(dx, dz);
    /* 88 e não 60 (a velocidade de todo mundo na cena): com 60 no
       divisor qualquer deslocamento normal batia no teto e o boneco
       vivia em pose de corrida. Em 88, andar no passo do bonde dá
       0,68 e sobra topo pra quem persegue e pra quem foge. */
    e.vel = dt > 0 ? Math.min(1, (d / dt) / 88) : 0;
    if (d > 0.05) { e.fase += d * 0.19; e.rumo = Math.atan2(dx, dz); }
    e.x = x; e.z = z;
    return e;
  }

  /* Índice espacial, só pra descobrir pra quem virar o rosto. É o
     mesmo truque de balde que `combate.js` usa na separação: O(n)
     pra montar, nove baldes pra consultar. Sem ele, "encarar quem
     está batendo em mim" seria 400 × 400 por quadro. Só é montado
     quando existe alguém em briga na cena. */
  const BALDE = 52;
  const baldes = new Map();
  const chave = (x, y) => (Math.floor(x / BALDE) + 64) * 4096 +
                          (Math.floor(y / BALDE) + 64);
  function indexar(J) {
    baldes.clear();
    const por = o => {
      const k = chave(o.x, o.y);
      const l = baldes.get(k);
      if (l) l.push(o); else baldes.set(k, [o]);
    };
    for (const d of J.discos) if (d.vivo) por(d);
    for (const p of J.policiais) if (p.vivo) por(p);
  }
  /* o PM não tem `lado`, então ele é inimigo de todo disco e de
     mais nenhum PM — que é exatamente a regra da cena */
  function rumoDoInimigo(o) {
    const cx = Math.floor(o.x / BALDE), cy = Math.floor(o.y / BALDE);
    let md = 68 * 68, alvo = null;
    for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) {
      const l = baldes.get((cx + c + 64) * 4096 + (cy + r + 64));
      if (!l) continue;
      for (const q of l) {
        if (q === o || q.lado === o.lado) continue;
        const dx = q.x - o.x, dy = q.y - o.y, dd = dx * dx + dy * dy;
        if (dd < md) { md = dd; alvo = q; }
      }
    }
    return alvo ? Math.atan2(alvo.x - o.x, alvo.y - o.y) : null;
  }

  /* Quem jogou a pedra? A simulação não marca. Mas o projétil tem
     velocidade constante e guarda o tempo de voo, então a origem
     volta por `x − vx·t` — e quem está em cima dela é o braço. */
  const vistos = new WeakSet();
  function acharArremesso(J) {
    for (const p of J.projeteis) {
      if (vistos.has(p)) continue;
      vistos.add(p);
      const ox = p.x - p.vx * p.t, oy = p.y - p.vy * p.t;
      let melhor = null, md = 20 * 20;
      for (const d of J.discos) {
        if (!d.vivo || d.lado !== p.lado) continue;
        const dx = d.x - ox, dy = d.y - oy, dd = dx * dx + dy * dy;
        if (dd < md) { md = dd; melhor = d; }
      }
      const e = melhor && anda.get(melhor);
      if (e) { e.arremesso = 0.58; e.rumoTiro = Math.atan2(p.vx, p.vy); }
    }
  }

  /* avança a máquina de pose de uma pessoa, um quadro */
  function animar(e, sin, dt, brigando) {
    const querGuarda = brigando && !sin.fugindo && !sin.entrando;
    e.guarda = chegar(e.guarda, querGuarda ? 1 : 0, dt * (querGuarda ? 5 : 2));

    if (e.soco > 0) { e.soco += dt * 2.4; if (e.soco >= 1) e.soco = 0; }
    if (e.soco === 0 && sin.golpe > 0 && e.arremesso <= 0) {
      e.soco = 0.001; e.socoLado ^= 1;
    }

    /* O RECUO É EVENTO, NÃO NÍVEL.
       `tremor` satura em 6 e fica lá enquanto o contato durar, então
       ler o valor cru deixava a cabeça jogada pra trás a briga
       inteira — o boneco brigava olhando pro céu. O que interessa é
       a SUBIDA: cada pancada nova dá um tranco, e o tranco passa. */
    const tr = sin.tremor || 0;
    if (tr > e.tremAnt + 0.25) e.recuo = 1;
    e.tremAnt = tr;
    e.recuo = Math.max(0, e.recuo - dt * 3.4);

    if (e.arremesso > 0) e.arremesso = Math.max(0, e.arremesso - dt);

    /* Pra onde encarar: andando, pro rumo do passo; parado numa
       briga, pro sujeito mais perto; arremessando, pro alvo.
       Ninguém soca de lado. */
    let rumo = e.rumo;
    if (e.arremesso > 0 && e.rumoTiro != null) rumo = e.rumoTiro;
    else if (e.inimigo != null && (e.vel < 0.3 || sin.golpe > 0)) rumo = e.inimigo;
    if (rumo != null) e.ang += curto(e.ang, rumo) * Math.min(1, dt * (sin.golpe > 0 ? 12 : 6));
  }

  const corAux = new THREE.Color();
  const hexDe = v => typeof v === 'string' ? parseInt(v.replace('#', ''), 16) : v;
  const corLado = (l, claro) => l === 'visitante'
    ? (claro ? 0xe8e8e8 : 0x2a5fa8) : (claro ? 0xe8e4dc : 0xc0392b);

  /* =======================================================
     A PASSADA, COM JOELHO E COM PESO

     Quatro coisas, e cada uma responde por um pedaço do "isto é
     gente andando" em vez de "isto é caixa deslizando":

     1. AMPLITUDE CRESCE COM A VELOCIDADE. Andar abre 0,30 rad de
        quadril; correr abre 0,64. É o que separa o bonde subindo a
        rua do bonde correndo da PM, sem estado novo nenhum — a
        velocidade sai da diferença de posição entre dois quadros.

     2. O JOELHO SÓ DOBRA NA PERNA SOLTA. Dobra máxima no meio do
        balanço (quando a perna passa por baixo do corpo) e zero no
        apoio. É `max(0, −cos fase)`: a perna de apoio fica reta e
        aguenta o corpo, a solta encolhe pra passar sem varrer o
        chão. Sem isso o pé atravessa o asfalto meio ciclo inteiro.

     3. O QUADRIL DESCE QUANDO AS PERNAS ABREM. Não é enfeite, é
        trigonometria: com as pernas abertas em θ o pé fica
        `L·(1−cos θ)` mais longe do quadril, então o corpo baixa
        outro tanto. É esta descida — duas por ciclo — que dá peso.
        A versão anterior subia o tronco com `|cos|` e deixava os
        pés no lugar, o que é o contrário: corpo flutuando sobre
        perna rígida.

     4. O TRONCO GINGA E INCLINA. Meio pixel de bamboleio lateral por
        passo, e o tronco cai pra frente com a velocidade enquanto a
        cabeça compensa pra o olhar ficar no horizonte.
     ======================================================= */
  function porPessoa(alvo, i, e, sin, cores) {
    const v = e.vel;
    /* A ABERTURA DO QUADRIL É CONSTANTE, E ISSO NÃO É PREGUIÇA.
       A fase anda com a DISTÂNCIA (0,19 rad por pixel), então o ciclo
       fecha a cada 33 px e cada passo cobre 16,5 px de chão. Pra o pé
       não patinar, a perna tem que abrir o tanto que dá esses 16,5:
       `asin(16,5 / 26) ≈ 0,66`, e esse número não depende da
       velocidade. Quem anda devagar dá o mesmo passo mais espaçado —
       é a cadência que muda, e ela já muda sozinha.
       O que a velocidade controla é o resto: joelho, braço, inclinação.
       `forca` só apaga a passada quando a pessoa para de verdade. */
    const forca = Math.min(1, v / 0.18);
    const sen = Math.sin(e.fase), cos = Math.cos(e.fase);
    const abertura = 0.66 * forca;                 // rad de quadril
    const dobra    = (0.42 + 0.55 * v) * forca;    // rad de joelho
    const balBraco = (0.40 + 0.45 * v) * forca;

    const oE = juntas.bracoSE.j, oD = juntas.bracoSD.j;   // ombros
    const cE = juntas.bracoIE.j, cD = juntas.bracoID.j;   // cotovelos
    const qE = juntas.coxaE.j,   qD = juntas.coxaD.j;     // quadris
    const jE = juntas.canelaE.j, jD = juntas.canelaD.j;   // joelhos

    raiz.position.set(e.x, 0, e.z);
    raiz.rotation.set(0, e.ang, 0);

    /* perna: ângulo negativo no quadril joga a coxa pra frente;
       positivo no joelho dobra o calcanhar pra trás, que é o único
       lado pra onde joelho dobra */
    qE.rotation.set(-abertura * sen, 0, 0);
    qD.rotation.set( abertura * sen, 0, 0);
    jE.rotation.set(0.06 + dobra * Math.max(0, -cos), 0, 0);
    jD.rotation.set(0.06 + dobra * Math.max(0,  cos), 0, 0);

    /* braço contrário à perna do mesmo lado, e cotovelo fechando
       conforme a coisa vira corrida */
    oE.rotation.set( balBraco * sen, 0, 0);
    oD.rotation.set(-balBraco * sen, 0, 0);
    cE.rotation.set(-(0.22 + 1.0 * v), 0, 0);
    cD.rotation.set(-(0.22 + 1.0 * v), 0, 0);

    /* o peso: quanto o quadril desce por causa da abertura */
    raiz.position.y = -(B.coxa.a + B.canela.a) *
                      (1 - Math.cos(abertura * Math.abs(sen)));

    juntas.tronco.j.rotation.set(0.16 * v, 0, -sen * 0.05 * forca);
    juntas.cabeca.j.rotation.set(-0.10 * v, 0, 0);
    juntas.tronco.j.position.set(sen * 0.55 * forca, B.tronco.centro, 0);
    juntas.cabeca.j.position.set(-sen * 0.14 * forca, B.cabeca.centro, 0);

    if (sin.preso) {
      /* Preso senta no chão com as mãos pra trás. É o outro fim da
         cena e no 2D ele era só um disco verde apagado.
         −11 põe a perna deitada encostando no asfalto: o quadril
         nasce em 13, a perna tem 3,2 de grossura, então o eixo dela
         precisa cair pra ~1,6. */
      raiz.position.y = -11.2;
      qE.rotation.set(-1.48, 0, -0.10); jE.rotation.set(0.12, 0, 0);
      qD.rotation.set(-1.40, 0,  0.10); jD.rotation.set(0.20, 0, 0);
      oE.rotation.set(1.05, 0, -0.25); cE.rotation.set(-0.55, 0, 0);
      oD.rotation.set(1.05, 0,  0.25); cD.rotation.set(-0.55, 0, 0);
      juntas.tronco.j.rotation.x = -0.12;
      juntas.cabeca.j.rotation.x =  0.35;   // cabeça baixa
    } else if (sin.caido) {
      raiz.rotation.set(-Math.PI / 2, e.ang, 0, 'YXZ');
      raiz.position.set(e.x, 4.6, e.z);
      qE.rotation.set(0.28, 0, 0);  jE.rotation.set(0.55, 0, 0);
      qD.rotation.set(-0.16, 0, 0); jD.rotation.set(0.18, 0, 0);
      oE.rotation.x = 0.9;  cE.rotation.x = -0.9;
      oD.rotation.x = -0.6; cD.rotation.x = -0.4;
    } else {
      /* ---- GUARDA: quem está em briga anda com o punho em cima.
         `hostil` dura 4 s depois do último contato, então o bonde
         inteiro fica de guarda enquanto a briga corre e larga
         sozinho quando ela acaba — sem nenhuma flag nova. */
      const g = e.guarda;
      if (g > 0.01) {
        oE.rotation.x = oE.rotation.x * (1 - g) + POSE.guardaS * g;
        oD.rotation.x = oD.rotation.x * (1 - g) + POSE.guardaS * g;
        cE.rotation.x = cE.rotation.x * (1 - g) + POSE.guardaI * g;
        cD.rotation.x = cD.rotation.x * (1 - g) + POSE.guardaI * g;
        oE.rotation.z =  POSE.guardaZ * g;
        oD.rotation.z = -POSE.guardaZ * g;
        juntas.tronco.j.rotation.x = 0.15 * g;
      }

      /* ---- SOCO */
      if (e.soco > 0) {
        const k = curvaSoco(e.soco);
        const o = e.socoLado ? oD : oE, c = e.socoLado ? cD : cE;
        o.rotation.x = POSE.guardaS + (POSE.socoS - POSE.guardaS) * k;
        c.rotation.x = POSE.guardaI + (POSE.socoI - POSE.guardaI) * k;
        o.rotation.z = (e.socoLado ? -POSE.guardaZ : POSE.guardaZ) * (1 - k * 0.9);
        /* o tronco vai junto, e o pé entra meio passo: soco de braço
           só é soco de brinquedo */
        raiz.rotation.y = e.ang + (e.socoLado ? -1 : 1) * 0.34 * k;
        juntas.tronco.j.rotation.x = 0.15 + 0.22 * k;
        raiz.position.x += Math.sin(e.ang) * 2.6 * k;
        raiz.position.z += Math.cos(e.ang) * 2.6 * k;
        qE.rotation.x =  0.34 * k; jE.rotation.x = 0.30 * k;
        qD.rotation.x = -0.30 * k; jD.rotation.x = 0.12 * k;
      }

      /* ---- ARREMESSO: arma atrás da cabeça e solta à frente */
      if (e.arremesso > 0) {
        const p = 1 - e.arremesso / 0.58;
        const arma = p < 0.42;
        const k = arma ? p / 0.42 : (p - 0.42) / 0.58;
        const de = arma ? POSE.guardaS : POSE.armaS;
        const ate = arma ? POSE.armaS : POSE.soltaS;
        const dei = arma ? POSE.guardaI : POSE.armaI;
        const atei = arma ? POSE.armaI : POSE.soltaI;
        oD.rotation.set(de + (ate - de) * k, 0, -0.18);
        cD.rotation.set(dei + (atei - dei) * k, 0, 0);
        oE.rotation.set(-0.5, 0, 0.24); cE.rotation.set(-1.5, 0, 0);
        raiz.rotation.y = e.ang + (arma ? 0.55 * k : 0.55 - 1.05 * k);
        juntas.tronco.j.rotation.x = arma ? -0.22 * k : -0.22 + 0.62 * k;
      }

      /* ---- APANHAR: aditivo, porque se apanha no meio de tudo.
         Cabeça pra trás, tronco quebrado, braços abrindo, e o
         tremor que o 2D já desenhava, agora no corpo. */
      if (e.recuo > 0.02) {
        const r = e.recuo;
        juntas.tronco.j.rotation.x -= 0.55 * r;
        juntas.cabeca.j.rotation.x -= 0.62 * r;
        juntas.cabeca.j.rotation.z  = (e.socoLado ? 0.3 : -0.3) * r;
        oE.rotation.x += 0.55 * r; oE.rotation.z -= 0.45 * r;
        oD.rotation.x += 0.55 * r; oD.rotation.z += 0.45 * r;
        cE.rotation.x -= 0.40 * r;
        cD.rotation.x -= 0.40 * r;
        juntas.tronco.j.position.y -= 1.5 * r;
        juntas.cabeca.j.position.y -= 2.1 * r;
        raiz.position.x += (Math.random() - 0.5) * r * 2.4;
        raiz.position.z += (Math.random() - 0.5) * r * 2.4;
      }

      /* ---- CASSETETE: 0,7 s de perna bamba */
      if (sin.atordoado > 0) {
        const t = sin.atordoado;
        raiz.rotation.z = Math.sin(t * 26) * 0.20 * Math.min(1, t / 0.3);
        qE.rotation.x = 0.30; jE.rotation.x = 0.42;
        qD.rotation.x = -0.22; jD.rotation.x = 0.16;
      }
    }

    raiz.updateMatrixWorld(true);
    for (const nome of PECAS) {
      alvo[nome].setMatrixAt(i, juntas[nome].m.matrixWorld);
      alvo[nome].setColorAt(i, corAux.set(cores[nome]));
    }
  }

  function fecharCamada(alvo, n) {
    for (const p of PECAS) {
      alvo[p].count = n;
      alvo[p].instanceMatrix.needsUpdate = true;
      if (alvo[p].instanceColor) alvo[p].instanceColor.needsUpdate = true;
    }
  }

  function sincronizarGente(J, dt) {
    /* o índice só existe se tiver briga. Numa noite tranquila isto
       não custa nada, que é o caso mais comum dos arredores. */
    let temBriga = false;
    for (const d of J.discos) if (d.vivo && d.hostil > 0) { temBriga = true; break; }
    if (temBriga) indexar(J);
    acharArremesso(J);

    let n = 0;
    for (const d of J.discos) {
      if (d.sumiu || d.entrou) continue;
      if (n >= MAX_GENTE) break;
      const e = estado(d, d.x, d.y, d.vivo ? dt : 0);
      if (!d.vivo) e.vel = 0;
      const brigando = d.vivo && (d.hostil > 0 || d.golpe > 0 || e.arremesso > 0);
      e.inimigo = (temBriga && brigando) ? rumoDoInimigo(d) : null;
      animar(e, d, dt, brigando);

      const camisa = d.cor ? hexDe(d.cor) : corLado(d.lado, false);
      const calcao = d.cor2 ? hexDe(d.cor2) : corLado(d.lado, true);
      const pele = PELE[(d.nome.charCodeAt(0) + d.nome.length) % PELE.length];
      porPessoa(gente, n, e, d, {
        cabeca: d.lider ? 0xe0b040 : pele,      // o líder usa boné
        tronco: d.preso ? 0x2c4f3c : camisa,
        bracoSE: d.preso ? 0x2c4f3c : camisa,   // manga
        bracoSD: d.preso ? 0x2c4f3c : camisa,
        bracoIE: pele, bracoID: pele,           // antebraço
        coxaE: calcao, coxaD: calcao,           // calção
        canelaE: pele, canelaD: pele            // canela de fora
      });
      n++;
    }
    fecharCamada(gente, n);
  }

  function sincronizarPM(J, dt) {
    let n = 0;
    for (const p of J.policiais) {
      if (n >= MAX_PMS) break;
      const e = estado(p, p.x, p.y, p.vivo ? dt : 0);
      if (!p.vivo) e.vel = 0;
      /* O PM não guarda golpe nem tremor. O que ele guarda é o
         `cooldown`, que salta pra 1,9 no quadro em que o cassetete
         acerta — a subida dele é a cacetada. */
      const bateu = p.vivo && p.cooldown > e.cdAnt + 0.01;
      e.cdAnt = p.cooldown;
      const sin = { golpe: bateu ? 1 : 0, tremor: 0, atordoado: 0,
                    caido: !p.vivo, preso: false };
      const brigando = p.vivo && (p.carga || bateu || e.soco > 0);
      e.inimigo = brigando ? rumoDoInimigo(p) : null;
      animar(e, sin, dt, brigando);
      porPessoa(pm, n, e, sin, {
        cabeca: 0x20262b, tronco: 0x1e3a2c,
        bracoSE: 0x1e3a2c, bracoSD: 0x1e3a2c,
        bracoIE: 0x2c4a38, bracoID: 0x2c4a38,
        coxaE: 0x15221a, coxaD: 0x15221a,
        canelaE: 0x15221a, canelaD: 0x15221a
      });
      n++;
    }
    fecharCamada(pm, n);
  }

  const molde = new THREE.Object3D();
  function por(malha, i, x, y, z, sx, sy, sz, rotY) {
    molde.position.set(x, y, z);
    molde.rotation.set(0, rotY || 0, 0);
    molde.scale.set(sx, sy, sz);
    molde.updateMatrix();
    malha.setMatrixAt(i, molde.matrix);
  }

  /* No 2D a altura da pedra é mentira desenhada. Aqui é altura. */
  function sincronizarProjeteis(J) {
    let n = 0;
    for (const p of J.projeteis) {
      if (n >= MAX_PROJ || p.morto) continue;
      const alt = Math.sin((p.t / p.dur) * Math.PI) * 60 + 24;
      const r = p.tipo === 'pedra' ? 2.4 : 3.2;
      por(iProj, n, p.x, alt, p.y, r, r, r);
      iProj.setColorAt(n, corAux.set(p.tipo === 'pedra' ? 0x8d8880 : 0xc8562f));
      n++;
    }
    iProj.count = n;
    iProj.instanceMatrix.needsUpdate = true;
    if (iProj.instanceColor) iProj.instanceColor.needsUpdate = true;
  }

  const GRADE_INTEIRA = new THREE.Color(0x8a8f94);
  const GRADE_RACHADA = new THREE.Color(0x5a3028);
  const corGrade = new THREE.Color();
  function sincronizarGrades(J) {
    let n = 0;
    for (const m of J.grades) {
      if (n >= MAX_MODS || m.hp <= 0) continue;
      const alta = m.tipo === 'fila' ? 26 : 34;
      const p = m.hpMax > 1 ? m.hp / m.hpMax : 1;
      por(iGrade, n, m.x, alta / 2, m.y,
          m.meia * 2, alta, m.esp * 2, -Math.atan2(m.uy, m.ux));
      if (m.tipo === 'fila') iGrade.setColorAt(n, corGrade.set(0x9aa0a6));
      else iGrade.setColorAt(n, corGrade.copy(GRADE_INTEIRA).lerp(GRADE_RACHADA, 1 - p));
      n++;
    }
    iGrade.count = n;
    iGrade.instanceMatrix.needsUpdate = true;
    if (iGrade.instanceColor) iGrade.instanceColor.needsUpdate = true;
  }

  /* =======================================================
     CÂMERA
     'ombro' é a de perto, atrás do líder do jogador. As outras
     continuam existindo porque são elas que mostram o que a de
     perto esconde: a formação e o cordão.
     ======================================================= */
  const CAMERAS = {
    ombro:   { seguir: true,  dist: 118,  alt: 0.22, fov: 52 },
    alto:    { seguir: true,  dist: 340,  alt: 0.62, fov: 46 },
    maquete: { seguir: false, dist: 1520, alt: 0.80, fov: 38 },
    zenital: { seguir: false, dist: 1420, alt: 1.50, fov: 38 }
  };
  let vista = 'ombro';
  let giro = 0, incl = CAMERAS.ombro.alt, dist = CAMERAS.ombro.dist;
  let arrastou = 0, primeira = true;
  const alvo = new THREE.Vector3(W / 2, 0, H / 2);
  const alvoSuave = new THREE.Vector3(W / 2, 0, H / 2);
  const posSuave = new THREE.Vector3();

  function irPara(nome) {
    const c = CAMERAS[nome];
    if (!c) return;
    vista = nome; incl = c.alt; dist = c.dist;
    cam.fov = c.fov; cam.updateProjectionMatrix();
    if (!c.seguir) giro = 0;
    primeira = true;
  }

  function posicionarCamera(lider, dt) {
    const c = CAMERAS[vista];
    if (c.seguir && lider) alvo.set(lider.x, 26, lider.y);
    else alvo.set(W / 2, 0, H / 2);
    /* a câmera de ombro vai atrás de quem anda, como em qualquer
       jogo de terceira pessoa: sem isso o jogador anda de lado a
       cena inteira. Parada enquanto o mouse mandou. */
    if (c.seguir && lider && arrastou <= 0) {
      const e = anda.get(lider);
      if (e && e.vel > 0.15) {
        const alvoGiro = e.ang + Math.PI;
        const d = ((alvoGiro - giro + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        giro += d * Math.min(1, dt * 2.4);
      }
    }
    arrastou = Math.max(0, arrastou - dt);
    incl = Math.max(0.05, Math.min(1.552, incl));
    const k = primeira ? 1 : Math.min(1, dt * 7);
    alvoSuave.lerp(alvo, k);
    posSuave.set(
      alvoSuave.x + dist * Math.cos(incl) * Math.sin(giro),
      alvoSuave.y + dist * Math.sin(incl),
      alvoSuave.z + dist * Math.cos(incl) * Math.cos(giro));
    /* A CÂMERA NÃO ENTRA EM PRÉDIO.
       Caminha do jogador até a posição e compara a altura de cada
       célula com a altura do olho ali. Achou parede mais alta que o
       olho: encosta a câmera e sobe por cima dela. Testar contra a
       malha de caminhabilidade em vez do campo de altura era o
       errado — canteiro e meio-fio não são passáveis e não tapam
       nada, e a câmera vivia colada na nuca. */
    const dx = posSuave.x - alvoSuave.x, dz = posSuave.z - alvoSuave.z;
    const dy = posSuave.y - alvoSuave.y;
    for (let k = 1; k <= 14; k++) {
      const t = k / 14;
      const alt = alturaEm(alvoSuave.x + dx * t, alvoSuave.z + dz * t);
      if (alt <= alvoSuave.y + dy * t + 8) continue;
      /* encolhe só a distância horizontal e MANTÉM a altura do
         olho. Subir por cima do prédio parece a solução e não é:
         com prédio de 280 a câmera saltava pra 300 e a cena virava
         vista de pássaro no meio da briga. Encostar e olhar de cima
         pra baixo é o que todo jogo de terceira pessoa faz. */
      const u = Math.max(0.30, (k - 1) / 14);
      posSuave.x = alvoSuave.x + dx * u;
      posSuave.z = alvoSuave.z + dz * u;
      break;
    }
    if (posSuave.y < 10) posSuave.y = 10;
    cam.position.copy(posSuave);
    cam.lookAt(alvoSuave);
    primeira = false;
  }

  let arrastando = false, mx = 0, my = 0;
  canvas.addEventListener('pointerdown', e => {
    arrastando = true; mx = e.clientX; my = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  const soltar = e => {
    arrastando = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('pointermove', e => {
    if (!arrastando) return;
    giro -= (e.clientX - mx) * 0.006;
    incl += (e.clientY - my) * 0.004;
    mx = e.clientX; my = e.clientY;
    arrastou = 1.4;                       // segura o auto-seguir um pouco
  });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    dist = Math.max(46, Math.min(3200, dist * (1 + Math.sign(e.deltaY) * 0.09)));
  }, { passive: false });

  /* =======================================================
     ROTULOS
     ======================================================= */
  let camadaRotulos = null;
  const rotulos = [];
  const ligarRotulos = el => { camadaRotulos = el; };
  const vProj = new THREE.Vector3();
  function sincronizarRotulos(J) {
    if (!camadaRotulos) return;
    const lista = J.discos.filter(d => d.lider && d.vivo && !d.sumiu && !d.entrou);
    while (rotulos.length < lista.length) {
      const el = document.createElement('div');
      el.className = 'rot3d';
      camadaRotulos.appendChild(el);
      rotulos.push(el);
    }
    const r = canvas.getBoundingClientRect();
    lista.forEach((d, i) => {
      vProj.set(d.x, 38, d.y).project(cam);
      const el = rotulos[i];
      el.textContent = d.nome;
      const fora = vProj.z > 1 || Math.abs(vProj.x) > 1.3 || Math.abs(vProj.y) > 1.3;
      el.style.display = fora ? 'none' : 'block';
      el.style.left = ((vProj.x * 0.5 + 0.5) * r.width) + 'px';
      el.style.top = ((-vProj.y * 0.5 + 0.5) * r.height) + 'px';
    });
    for (let i = lista.length; i < rotulos.length; i++)
      rotulos[i].style.display = 'none';
  }

  /* =======================================================
     API
     ======================================================= */
  let esperando = 0, cenaAtual = null, conta = null;

  function montar(D) {
    cenaAtual = D;
    anda.clear();
    repintarChao();
    conta = montarPredios(D);
    montarPortoes(D);
    esperando = D.imagem ? 240 : 0;
    irPara(vista);
    return conta;
  }
  /* a foto chega depois do primeiro quadro; quando chegar, o chão
     é repintado E os prédios refeitos, porque a cor da parede e a
     altura saem da foto */
  function conferirFoto() {
    if (esperando <= 0) return;
    esperando--;
    if (A.imagemOk) {
      esperando = 0;
      repintarChao();
      conta = montarPredios(cenaAtual);
    }
  }

  /* A sombra é o item mais caro da cena: o mapa de 2048² redesenha
     tudo outra vez todo quadro. Como eu não pude medir isto num GPU
     de verdade, fica no dedo — se estiver arrastando aí, é o primeiro
     a desligar. */
  function trocarSombra() {
    rend.shadowMap.enabled = !rend.shadowMap.enabled;
    cena.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    return rend.shadowMap.enabled;
  }

  function trocarModo() {
    modo = modo === 'rua' ? 'maquete' : 'rua';
    conta = montarPredios(cenaAtual);
    return modo;
  }

  function quadro(J, dt) {
    conferirFoto();
    sincronizarGente(J, dt);
    sincronizarPM(J, dt);
    sincronizarProjeteis(J);
    sincronizarGrades(J);
    const lider = J.discos.find(d => d.lider && d.doJogador && d.vivo)
               || J.discos.find(d => d.lider && d.vivo);
    posicionarCamera(lider, dt);
    sincronizarRotulos(J);
    rend.render(cena, cam);
  }

  function redimensionar() {
    const l = canvas.clientWidth, a = canvas.clientHeight;
    if (!l || !a) return;
    rend.setSize(l, a, false);
    cam.aspect = l / a;
    cam.updateProjectionMatrix();
  }

  /* o WASD do jogo é em eixo do mundo; a câmera de ombro precisa
     que W seja "pra frente da câmera". Como `moverLider` só lê
     quatro booleanos, giramos a intenção e devolvemos os quatro
     que mais se parecem com ela — oito direções. O jeito certo,
     no dia que isto virar jogo, é `moverLider` aceitar um vetor. */
  function girarEntrada(teclas) {
    const ix = (teclas.d ? 1 : 0) - (teclas.a ? 1 : 0);
    const iz = (teclas.s ? 1 : 0) - (teclas.w ? 1 : 0);
    if (!ix && !iz) return {};
    const c = Math.cos(giro), s = Math.sin(giro);
    const wx = ix * c - iz * s, wz = ix * s + iz * c;
    const lim = Math.max(Math.abs(wx), Math.abs(wz)) * 0.42;
    return { d: wx > lim, a: wx < -lim, s: wz > lim, w: wz < -lim };
  }

  return { montar, quadro, redimensionar, irPara, ligarRotulos,
           trocarModo, trocarSombra, girarEntrada,
           get sombra() { return rend.shadowMap.enabled; },
           get modo() { return modo; },
           get vista() { return vista; },
           get conta() { return conta; },
           get info() { return rend.info; },
           /* expostos pra medir e depurar da consola, não pro jogo */
           _rend: rend, _cena: cena, _cam: cam, _sol: sol,
           _cameras: CAMERAS, _alturaEm: alturaEm };
}
