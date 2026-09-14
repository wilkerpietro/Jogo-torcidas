/* =========================================================
   O ESTÁDIO EM 3D — a bacia, o corredor e a escada
   ---------------------------------------------------------
   Segundo desenhista de `combate.js`, como `cena3d.js` já era:
   a simulação continua sendo o tabuleiro plano de 1536 × 1024,
   com a mesma malha de 8 px, a mesma colisão e a mesma PM.
   Nenhuma linha de combate foi tocada pra esta cena existir.

   O QUE ESTA CENA TEM DE DIFERENTE DE TODAS AS OUTRAS é uma
   função: `piso(x, y)`. Nos arredores, na praça e na rua o chão
   é zero em todo ponto, e o desenho só põe o boneco em pé. Aqui
   o chão sobe 66 unidades em dezesseis degraus, atravessa um
   muro por um vão e desce uma escada — e o boneco acompanha sem
   saber de nada, porque a altura entra somada na raiz dele
   (`bonecos3.js`, "o chão entra aqui, e só aqui").

   A GEOMETRIA SAI DA PLANTA, e a planta é a mesma que gerou a
   máscara de colisão (`dados/cena_estadio.js`). Todo anel do
   estádio — degrau, muro, pista, laje da cobertura — é a mesma
   volta em torno do gramado empurrada pra fora, e `P.anel(d)`
   devolve essa volta com o mesmo número de amostras sempre. Por
   isso o degrau de cima casa com o de baixo vértice a vértice e
   a bacia inteira sai numa malha só: 1 chamada de desenho pra
   dezesseis degraus e trinta e dois mil triângulos... não: pra
   dezesseis degraus, e o número está no HUD.

   O CHÃO PINTADO VIRA TEXTURA. `estadio_pintura.js` pinta a
   planta vista de cima, e essa pintura é projetada de cima em
   TODA a geometria — degrau, pista, gramado, corredor. É o
   truque do telhado dos arredores levado ao estádio: o azul da
   arquibancada, a listra do gramado e a marcação do campo são
   pintura 2D, não geometria, e o 2D e o 3D mostram a mesma arte
   porque é o mesmo arquivo.

   O QUE É VOLUME DE VERDADE: o degrau (senão não há degrau), o
   muro, a escada com corrimão, o alambrado, a cobertura de um
   lado só, as quatro torres de luz e os portões.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';
import { entrarEm } from './bonecos3.js';
import { criarTradutor } from './sinais3d.js';

const A = TO.diaJogo.arredores;
const P = TO.dados.plantaEstadio;
const W = P.W, H = P.H;

/* a textura do chão é ampliada umas dez vezes pela câmera de
   ombro; 2× já segura o degrau e a marcação do campo sem passar
   dos 4096 que toda placa aceita */
const AMPLIA = 2;

const COR = {
  concreto:  0x9d998c,
  concretoE: 0xc4bda9,
  muroTopo:  0x9d9789,
  escada:    0xa8a294,
  corrimao:  0x53504a,
  alambrado: 0x5d6460,
  tela:      0xb9c0bb,
  cobertura: 0xd8d5cc,
  coberturaB:0x8f8c84,
  coluna:    0xa9a498,
  torre:     0x6f6f6b,
  lampada:   0xfff0c8,
  ceu:       0x5b6a80
};

export function criar(canvas) {
  const rend = new THREE.WebGLRenderer({ canvas, antialias: true,
                                         preserveDrawingBuffer: true });
  rend.setPixelRatio(Math.min(devicePixelRatio, 2));
  rend.shadowMap.enabled = true;
  rend.shadowMap.type = THREE.PCFSoftShadowMap;
  rend.outputColorSpace = THREE.SRGBColorSpace;

  const cena = new THREE.Scene();
  cena.background = new THREE.Color(COR.ceu);
  cena.fog = new THREE.Fog(COR.ceu, 1100, 3000);

  const cam = new THREE.PerspectiveCamera(52, 1, 1.2, 7000);

  /* A LUZ FOI BAIXADA DEPOIS DE OLHAR.
     Com o céu a 1,5 e o sol a 1,25 o concreto do corredor saía branco
     estourado ao lado do asfalto escuro da rua, e a arquibancada azul
     perdia a cor. Um estádio de tarde no Nordeste é claro, mas não é
     papel: 1,02 e 1,0, e o céu puxando pro quente. */
  cena.add(new THREE.HemisphereLight(0xd2dced, 0x6a6454, 1.02));
  /* o sol vem do oeste, que é o lado da cobertura: assim a sombra
     da laje cai na arquibancada e se vê que ela existe */
  const sol = new THREE.DirectionalLight(0xfff0d8, 1.0);
  sol.position.set(W / 2 - 1100, 1500, H / 2 - 600);
  sol.target.position.set(W / 2, 0, H / 2);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, {
    left: -900, right: 900, top: 760, bottom: -760, near: 200, far: 3600 });
  sol.shadow.bias = -0.0018;
  cena.add(sol, sol.target);

  /* =======================================================
     O CHÃO PINTADO
     ======================================================= */
  const cvChao = document.createElement('canvas');
  cvChao.width = W * AMPLIA; cvChao.height = H * AMPLIA;
  const ctxChao = cvChao.getContext('2d');
  const texChao = new THREE.CanvasTexture(cvChao);
  texChao.colorSpace = THREE.SRGBColorSpace;
  texChao.anisotropy = Math.min(8, rend.capabilities.getMaxAnisotropy());

  function repintarChao() {
    ctxChao.setTransform(AMPLIA, 0, 0, AMPLIA, 0, 0);
    ctxChao.clearRect(0, 0, W, H);
    A.desenharFundo(ctxChao);
    texChao.needsUpdate = true;
  }

  const matChao = new THREE.MeshLambertMaterial({ map: texChao });
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(W, H), matChao);
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(W / 2, 0, H / 2);
  chao.receiveShadow = true;
  cena.add(chao);

  /* o bairro não acaba na calçada: um plano grande da cor do
     asfalto atrás da névoa, senão a câmera de ombro vê o vazio */
  const fora = new THREE.Mesh(new THREE.PlaneGeometry(W * 6, H * 8),
    new THREE.MeshLambertMaterial({ color: 0x3a3a38 }));
  fora.rotation.x = -Math.PI / 2;
  fora.position.set(W / 2, -0.6, H / 2);
  cena.add(fora);

  /* =======================================================
     O CONSTRUTOR DE MALHA
     Três listas — posição, uv, cor — e um triângulo por vez.
     A cor por vértice é o que deixa espelho, degrau e muro
     saírem numa malha só sem ficarem todos do mesmo tom.
     ======================================================= */
  function Tecido() {
    return { pos: [], uv: [], cor: [] };
  }
  const branco = new THREE.Color(1, 1, 1);
  const corTmp = new THREE.Color();
  /* u,v do ponto do tabuleiro — a MESMA projeção de cima que o
     `PlaneGeometry` do chão usa, pra a pintura casar */
  const uDe = x => x / W, vDe = y => 1 - y / H;

  function tri(T, a, b, c, tom, uvA, uvB, uvC) {
    T.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    const g = tom === undefined ? branco : corTmp.setScalar(tom);
    for (let k = 0; k < 3; k++) T.cor.push(g.r, g.g, g.b);
    T.uv.push(uvA[0], uvA[1], uvB[0], uvB[1], uvC[0], uvC[1]);
  }
  function malha(T, mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(T.cor, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  /* uma faixa horizontal entre dois anéis, na altura y */
  function lajeAnel(T, d0, d1, y, tom, pula) {
    const a = P.anel(d0), b = P.anel(d1), n = P.N;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (pula && pula(i)) continue;
      const A0 = [a[i][0], y, a[i][1]], A1 = [a[j][0], y, a[j][1]];
      const B0 = [b[i][0], y, b[i][1]], B1 = [b[j][0], y, b[j][1]];
      const ua = [uDe(a[i][0]), vDe(a[i][1])], ub = [uDe(a[j][0]), vDe(a[j][1])];
      const uc = [uDe(b[i][0]), vDe(b[i][1])], ud = [uDe(b[j][0]), vDe(b[j][1])];
      tri(T, A0, B1, B0, tom, ua, ud, uc);
      tri(T, A0, A1, B1, tom, ua, ub, ud);
    }
  }
  /* uma cortina vertical sobre um anel, de y0 a y1.
     `uvD` diz de que anel sair a coordenada de textura da borda
     de baixo — é assim que o espelho do degrau herda a cor do
     degrau de baixo em vez de sair chapado. */
  function paredeAnel(T, d, y0, y1, tom, pula, uvD) {
    const r = P.anel(d), n = P.N;
    const rb = uvD === undefined ? r : P.anel(uvD);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (pula && pula(i)) continue;
      const A0 = [r[i][0], y0, r[i][1]], B0 = [r[j][0], y0, r[j][1]];
      const A1 = [r[i][0], y1, r[i][1]], B1 = [r[j][0], y1, r[j][1]];
      const ua = [uDe(rb[i][0]), vDe(rb[i][1])], ub = [uDe(rb[j][0]), vDe(rb[j][1])];
      const uc = [uDe(r[i][0]), vDe(r[i][1])], ud = [uDe(r[j][0]), vDe(r[j][1])];
      tri(T, A0, A1, B1, tom, ua, uc, ud);
      tri(T, A0, B1, B0, tom, ua, ud, ub);
    }
  }
  /* uma caixa reta em coordenada de mundo */
  function caixa(T, x0, x1, y0, y1, z0, z1, tom) {
    const v = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],
               [x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
    const u = p => [uDe(p[0]), vDe(p[2])];
    const f = (a,b,c,d) => { tri(T, v[a],v[b],v[c], tom, u(v[a]),u(v[b]),u(v[c]));
                             tri(T, v[a],v[c],v[d], tom, u(v[a]),u(v[c]),u(v[d])); };
    f(4,7,6,5);   // topo
    f(0,1,2,3);   // base
    f(0,4,5,1); f(2,6,7,3); f(1,5,6,2); f(3,7,4,0);
  }
  /* a mesma caixa, em coordenada local de um lado (s, t) */
  function caixaLocal(T, lado, s0, s1, t0, t1, y0, y1, tom) {
    const p = [P.mundo(lado, s0, t0), P.mundo(lado, s1, t1)];
    caixa(T, Math.min(p[0][0], p[1][0]), Math.max(p[0][0], p[1][0]),
             y0, y1,
             Math.min(p[0][1], p[1][1]), Math.max(p[0][1], p[1][1]), tom);
  }

  /* =======================================================
     A BACIA — dezesseis degraus numa malha só
     ======================================================= */
  const grupo = new THREE.Group();
  cena.add(grupo);
  const matPintado = new THREE.MeshLambertMaterial({ map: texChao, vertexColors: true });
  const matConcreto = new THREE.MeshLambertMaterial({ color: COR.concreto, vertexColors: true });

  function montarBacia(T) {
    const R = P.D, AL = P.ALT;
    for (let i = 0; i < P.NDEG; i++) {
      const d0 = R.pista + i * AL.degrau, d1 = d0 + AL.degrau;
      const h = AL.base + AL.subida * i;
      /* o espelho, herdando a cor do degrau de baixo */
      paredeAnel(T, d0, h - AL.subida - (i === 0 ? AL.base - AL.subida : 0), h,
                 0.74, null, Math.max(0, d0 - AL.degrau * 0.5));
      /* o piso do degrau, com a pintura projetada de cima */
      lajeAnel(T, d0, d1, h, 1);
    }
  }

  /* =======================================================
     OS MUROS — o de fundo tem vão na escada, o externo no portão
     ======================================================= */
  /* quais amostras do perfil caem dentro de um vão */
  function pulaVao(vaos) {
    const meio = [];
    return i => {
      const r = P.anel(0), j = (i + 1) % P.N;
      const mx = (r[i][0] + r[j][0]) / 2, my = (r[i][1] + r[j][1]) / 2;
      for (const v of vaos) {
        const [s, t] = P.local(v.lado, mx, my);
        /* só vale no lado reto: fora dele `t` deixa de ser a
           distância e a conta não diz nada */
        if (Math.abs(P.dist(mx, my)) > 0.01) continue;
        if (s >= v.a && s <= v.b) return true;
      }
      return false;
    };
  }
  /* mais simples e sem ambiguidade: o vão se decide pelo ponto do
     anel na distância certa */
  function pulador(d, vaos) {
    const r = P.anel(d), n = P.N;
    return i => {
      const j = (i + 1) % n;
      const mx = (r[i][0] + r[j][0]) / 2, my = (r[i][1] + r[j][1]) / 2;
      for (const v of vaos) {
        const [s] = P.local(v.lado, mx, my);
        const dentro = v.lado === 'n' ? my < P.CY - P.AY
                     : v.lado === 's' ? my > P.CY + P.AY
                     : v.lado === 'o' ? mx < P.CX - P.AX
                                      : mx > P.CX + P.AX;
        if (!dentro) continue;
        /* e tem de estar no trecho RETO do lado, não na quina */
        const noReto = (v.lado === 'n' || v.lado === 's')
          ? (mx >= P.CX - P.AX && mx <= P.CX + P.AX)
          : (my >= P.CY - P.AY && my <= P.CY + P.AY);
        if (noReto && s >= v.a && s <= v.b) return true;
      }
      return false;
    };
  }

  function montarMuros(T) {
    const R = P.D, AL = P.ALT;
    const vaosEsc = P.ESCADAS.map(e => ({ lado: e.lado, a: e.pa, b: e.pb }));
    const pulaF = pulador((R.arq + R.murof) / 2, vaosEsc);
    /* muro de fundo: face de dentro, face de fora e a beirada */
    paredeAnel(T, R.arq,   AL.topo - 1, AL.muroF, 0.94, pulaF);
    paredeAnel(T, R.murof, 0,           AL.muroF, 0.88, pulaF);
    lajeAnel(T, R.arq, R.murof, AL.muroF, 1.02, pulaF);
    /* as bochechas do vão, pra a parede não ficar de papel */
    for (const e of P.ESCADAS) for (const s of [e.pa, e.pb])
      caixaLocal(T, e.lado, s - 1.5, s + 1.5, -(R.murof - R.arq), 0,
                 AL.topo, AL.muroF, 0.8);

    /* muro externo, com vão no portão */
    const vaosPor = P.PORTOES.map(p => ({ lado: p.lado, a: p.c - p.larg / 2, b: p.c + p.larg / 2 }));
    const pulaE = pulador((R.corr + R.muroe) / 2, vaosPor);
    paredeAnel(T, R.corr,  0, AL.muroE, 0.92, pulaE);
    paredeAnel(T, R.muroe, 0, AL.muroE, 1.0,  pulaE);
    lajeAnel(T, R.corr, R.muroe, AL.muroE, 1.06, pulaE);
    for (const p of P.PORTOES) for (const s of [p.c - p.larg / 2, p.c + p.larg / 2])
      caixaLocal(T, p.lado, s - 2, s + 2, R.corr - R.murof, R.muroe - R.murof,
                 0, AL.muroE, 0.82);
  }

  /* =======================================================
     AS ESCADAS
     Degrau por degrau, e o corrimão acompanhando — ele está na
     máscara, então tem de estar aqui: escada com corrimão só de
     desenho é parede que o corpo atravessa.
     ======================================================= */
  function montarEscadas(T) {
    const E = P.ESC, AL = P.ALT, R = P.D;
    for (const e of P.ESCADAS) {
      const passo = E.lance / E.degraus;
      for (let k = 0; k < E.degraus; k++) {
        const s0 = e.sobe > 0 ? e.a + k * passo : e.b - (k + 1) * passo;
        const h = AL.topo * (k + 1) / E.degraus;
        caixaLocal(T, e.lado, s0, s0 + passo, 0, E.fundo, 0, h, 0.96);
      }
      /* o patamar do alto e o vão que atravessa o muro */
      caixaLocal(T, e.lado, e.pa, e.pb, 0, E.fundo, 0, AL.topo, 1.04);
      caixaLocal(T, e.lado, e.pa, e.pb, -(R.murof - R.arq), 0, 0, AL.topo, 1.04);
      /* o corrimão do lado comprido: um trecho por degrau, pra
         ele subir junto em vez de flutuar */
      const a0 = e.sobe > 0 ? e.a : e.a, b0 = e.sobe > 0 ? e.b : e.b;
      const n = E.degraus + 4;
      for (let k = 0; k < n; k++) {
        const s0 = a0 + (b0 - a0) * k / n, s1 = a0 + (b0 - a0) * (k + 1) / n;
        const h = Math.max(P.alturaEscada(e, s0), P.alturaEscada(e, s1));
        caixaLocal(T, e.lado, s0, s1, E.fundo, E.fundo + E.corrim, h, h + 26, 0.66);
      }
      /* a ponta fechada: é o que obriga a entrar pelo pé */
      const sf = e.sobe > 0 ? e.b : e.a - E.corrim;
      caixaLocal(T, e.lado, sf, sf + E.corrim, 0, E.fundo + E.corrim, 0, AL.topo + 26, 0.7);
    }
  }

  /* =======================================================
     O ALAMBRADO — a grade entre a pista e a arquibancada
     ======================================================= */
  function montarAlambrado() {
    const T = Tecido();
    const R = P.D, AL = P.ALT;
    const r = P.anel(R.pista - 3);
    /* MONTANTE FINO E ESPAÇADO, e não uma cerca de estacas.
       A primeira versão punha uma estaca de 2,8 de largura a cada duas
       amostras do perfil, e de cima o alambrado virava um muro preto
       em volta do gramado — tapava a faixa amarela e comia a cor da
       arquibancada. Um alambrado visto de longe é quase só a tela: o
       montante é o que dá o ritmo, não a massa. */
    for (let i = 0; i < P.N; i += 5) {
      const x = r[i][0], z = r[i][1];
      caixa(T, x - 0.9, x + 0.9, AL.base, AL.base + AL.alambrado, z - 0.9, z + 0.9, 1);
    }
    /* o travessão de cima, que é o que se vê de verdade a essa distância */
    const V = Tecido();
    lajeAnel(V, R.pista - 4.4, R.pista - 1.6, AL.base + AL.alambrado, 1);
    const m = malha(T, new THREE.MeshLambertMaterial({ color: COR.alambrado, vertexColors: true }));
    const t2 = malha(V, new THREE.MeshLambertMaterial({ color: COR.alambrado, vertexColors: true }));
    grupo.add(m, t2);
    /* a tela entre os montantes: uma cortina translúcida, bem clara —
       tela de alambrado de perto é cinza e de longe é quase nada */
    const C = Tecido();
    paredeAnel(C, R.pista - 3, AL.base, AL.base + AL.alambrado, 1);
    const tela = malha(C, new THREE.MeshLambertMaterial({
      color: COR.tela, vertexColors: true, transparent: true,
      opacity: 0.17, depthWrite: false, side: THREE.DoubleSide }));
    tela.castShadow = false; tela.receiveShadow = false;
    grupo.add(tela);
    return (T.pos.length + V.pos.length + C.pos.length) / 9;
  }

  /* =======================================================
     A COBERTURA — de um lado só, como no Presidente Vargas
     ======================================================= */
  function montarCobertura(T) {
    const R = P.D, AL = P.ALT;
    /* o trecho reto do lado oeste */
    const z0 = P.CY - P.AY - 8, z1 = P.CY + P.AY + 8;
    const xFora = P.CX - P.AX - (R.murof - 4);     // atrás, junto ao muro
    const xDentro = P.CX - P.AX - 44;              // a beirada, sobre o degrau baixo
    caixa(T, xFora, xDentro, AL.cobertura, AL.cobertura + 7, z0, z1, 1.1);
    /* a testeira pendurada na beirada */
    caixa(T, xDentro - 4, xDentro, AL.cobertura - 11, AL.cobertura + 7, z0, z1, 0.82);
    /* as colunas, atrás, onde não atrapalham a arquibancada */
    for (let k = 0; k <= 5; k++) {
      const z = z0 + (z1 - z0) * k / 5;
      caixa(T, xFora + 2, xFora + 11, AL.muroF, AL.cobertura, z - 5, z + 5, 0.9);
    }
  }

  /* =======================================================
     AS TORRES DE LUZ — quatro, nas quinas, fora do muro
     ======================================================= */
  function montarTorres(T) {
    const R = P.D;
    const fora = R.muroe + 26;
    for (const [sx, sz] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
      const cx = P.CX + sx * P.AX + sx * fora * 0.7071;
      const cz = P.CY + sz * P.AY + sz * fora * 0.7071;
      /* quatro pernas que se fecham: mastro de treliça, sem treliça */
      const base = 13, topo = 5, alt = 300;
      for (const [px, pz] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
        const passos = 6;
        for (let k = 0; k < passos; k++) {
          const y0 = alt * k / passos, y1 = alt * (k + 1) / passos;
          const r0 = base + (topo - base) * k / passos;
          const r1 = base + (topo - base) * (k + 1) / passos;
          const x0 = cx + px * r0, z0 = cz + pz * r0;
          const x1 = cx + px * r1, z1 = cz + pz * r1;
          caixa(T, Math.min(x0,x1) - 2, Math.max(x0,x1) + 2, y0, y1,
                   Math.min(z0,z1) - 2, Math.max(z0,z1) + 2, 0.8);
        }
      }
      /* a bandeja de refletores, virada pro campo */
      caixa(T, cx - 26, cx + 26, alt, alt + 26, cz - 8, cz + 8, 0.95);
    }
  }

  /* =======================================================
     OS PORTÕES
     ======================================================= */
  const COR_LADO = { mandante: 0xc0392b, visitante: 0x2a5fa8, neutro: 0x7a6a3a };
  const grupoPortoes = new THREE.Group();
  cena.add(grupoPortoes);
  function montarPortoes(D) {
    while (grupoPortoes.children.length) {
      const o = grupoPortoes.children.pop();
      if (o.geometry) o.geometry.dispose();
    }
    for (const e of D.entradas || []) {
      const d = e.dir || [0, -1];
      const g = new THREE.Group();
      const barra = new THREE.Mesh(new THREE.BoxGeometry(6, 52, 84),
        new THREE.MeshLambertMaterial({ color: COR_LADO[e.lado] || COR_LADO.neutro }));
      barra.castShadow = true;
      g.add(barra);
      /* o número do portão é um bloco claro em cima, que de longe
         é o que se vê de uma bilheteria */
      const placa = new THREE.Mesh(new THREE.BoxGeometry(7, 13, 30),
        new THREE.MeshLambertMaterial({ color: 0xe6dfc8 }));
      placa.position.y = 36;
      g.add(placa);
      g.position.set(e.x, 26, e.y);
      g.rotation.y = -Math.atan2(d[1], d[0]);
      grupoPortoes.add(g);
    }
  }

  /* =======================================================
     MONTAR TUDO
     ======================================================= */
  let corpoPintado = null, corpoConcreto = null, conta = null;
  function montarEstadio() {
    for (const m of [corpoPintado, corpoConcreto]) {
      if (!m) continue;
      grupo.remove(m); m.geometry.dispose();
    }
    while (grupo.children.length) {
      const o = grupo.children.pop();
      if (o.geometry) o.geometry.dispose();
    }
    const TP = Tecido(), TC = Tecido();
    montarBacia(TP);
    montarMuros(TC);
    montarEscadas(TC);
    montarCobertura(TC);
    montarTorres(TC);
    corpoPintado = malha(TP, matPintado);
    corpoConcreto = malha(TC, matConcreto);
    grupo.add(corpoPintado, corpoConcreto);
    const nAlam = montarAlambrado();
    conta = {
      degraus: P.NDEG,
      escadas: P.ESCADAS.length,
      portoes: P.PORTOES.length,
      triangulos: Math.round(TP.pos.length / 9 + TC.pos.length / 9 + nAlam)
    };
    return conta;
  }

  /* =======================================================
     A GENTE
     Quem põe em pé é `bonecos3.js`, que veio da Vitrine com o
     modelo do Blender e o repertório inteiro. Aqui só se diz
     onde é o chão — e `sinais3d.js` traduz o que o combate
     daqui guarda pro que aquele boneco espera ler.
     ======================================================= */
  const piso = (x, z) => P.piso(x, z);

  /* QUEM NÃO CABE NA TELA NÃO É ANIMADO NEM DESENHADO.
     `bonecos3` já corta — mas ele corta por retângulo do tabuleiro,
     que é o que a câmera de cima tem. A de ombro não tem retângulo:
     quem decide é o tronco da câmera. Uma esfera por pessoa, na altura
     do peito, com folga de um boneco e meio; numa arquibancada de
     setenta é isso que separa desenhar doze de desenhar setenta. */
  const tronco = new THREE.Frustum();
  const mat4 = new THREE.Matrix4();
  const bolha = new THREE.Sphere(new THREE.Vector3(), 46);
  function atualizarTronco() {
    mat4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    tronco.setFromProjectionMatrix(mat4);
  }
  function noQuadro(x, z) {
    bolha.center.set(x, piso(x, z) + 20, z);
    return tronco.intersectsSphere(bolha);
  }

  const povo = entrarEm(cena, { piso, sombra: true, escala: 1.15, noQuadro });
  const traduzir = criarTradutor();

  /* =======================================================
     CÂMERA
     ======================================================= */
  const CAMERAS = {
    ombro:   { seguir: true,  dist: 120,  alt: 0.24, fov: 52 },
    alto:    { seguir: true,  dist: 330,  alt: 0.60, fov: 46 },
    maquete: { seguir: false, dist: 1250, alt: 0.72, fov: 40 },
    zenital: { seguir: false, dist: 1180, alt: 1.50, fov: 40 }
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

  /* o rumo e a velocidade do líder saem da máquina de pose, que
     é quem mede deslocamento por quadro */
  function estadoDoLider(l) {
    const dbg = povo && null;   // a ficha do boneco basta
    return l && l._b3 ? l._b3 : null;
  }

  function posicionarCamera(lider, dt) {
    const c = CAMERAS[vista];
    if (c.seguir && lider) alvo.set(lider.x, piso(lider.x, lider.y) + 26, lider.y);
    else alvo.set(W / 2, P.ALT.topo * 0.5, H / 2);
    /* a câmera de ombro vai atrás de quem anda. Parada enquanto o
       dedo ou o mouse mandou. */
    if (c.seguir && lider && arrastou <= 0) {
      const f = estadoDoLider(lider);
      if (f && Math.hypot(f.vx, f.vz) > 12) {
        const alvoGiro = Math.atan2(f.vx, f.vz) + Math.PI;
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
    /* A CÂMERA NÃO ENTRA EM MURO. Caminha do jogador até a
       posição e compara a altura do que atrapalha com a altura do
       olho ali; achou parede mais alta, encosta. Aqui isso importa
       mais do que nos arredores: o muro de fundo tem 82 e a câmera
       de ombro anda rente a ele o tempo todo. */
    const dx = posSuave.x - alvoSuave.x, dz = posSuave.z - alvoSuave.z;
    const dy = posSuave.y - alvoSuave.y;
    for (let k2 = 1; k2 <= 14; k2++) {
      const t = k2 / 14;
      const alt = P.obstaculo(alvoSuave.x + dx * t, alvoSuave.z + dz * t);
      if (alt <= alvoSuave.y + dy * t + 8) continue;
      const u = Math.max(0.28, (k2 - 1) / 14);
      posSuave.x = alvoSuave.x + dx * u;
      posSuave.z = alvoSuave.z + dz * u;
      break;
    }
    const chaoAli = piso(posSuave.x, posSuave.z);
    if (posSuave.y < chaoAli + 12) posSuave.y = chaoAli + 12;
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
    arrastou = 1.4;
  });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    dist = Math.max(46, Math.min(2600, dist * (1 + Math.sign(e.deltaY) * 0.09)));
  }, { passive: false });

  /* =======================================================
     RÓTULOS
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
      vProj.set(d.x, piso(d.x, d.y) + 44, d.y).project(cam);
      const el = rotulos[i];
      el.textContent = d.nome;
      const fora2 = vProj.z > 1 || Math.abs(vProj.x) > 1.3 || Math.abs(vProj.y) > 1.3;
      el.style.display = fora2 ? 'none' : 'block';
      el.style.left = ((vProj.x * 0.5 + 0.5) * r.width) + 'px';
      el.style.top = ((-vProj.y * 0.5 + 0.5) * r.height) + 'px';
    });
    for (let i = lista.length; i < rotulos.length; i++)
      rotulos[i].style.display = 'none';
  }

  /* =======================================================
     API
     ======================================================= */
  function montar(D) {
    povo.limpar();
    repintarChao();
    montarPortoes(D);
    const c = montarEstadio();
    irPara(vista);
    return c;
  }

  function trocarSombra() {
    rend.shadowMap.enabled = !rend.shadowMap.enabled;
    cena.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    return rend.shadowMap.enabled;
  }

  function quadro(J, dt) {
    traduzir(J, dt);
    /* a câmera primeiro, e o corte depois: o tronco tem de ser o do
       quadro que vai ser desenhado, senão quem entra na tela entra um
       quadro atrasado e aparece em pose de estátua */
    const lider = J.discos.find(d => d.lider && d.doJogador && d.vivo)
               || J.discos.find(d => d.lider && d.vivo);
    posicionarCamera(lider, dt);
    cam.updateMatrixWorld();
    atualizarTronco();
    povo.atualizar(J, dt);
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
     quatro booleanos, gira-se a intenção e devolvem-se os quatro
     que mais se parecem com ela — oito direções. */
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
           trocarSombra, girarEntrada, piso,
           get sombra() { return rend.shadowMap.enabled; },
           get vista() { return vista; },
           get conta() { return conta; },
           get comModelo() { return povo.comModelo; },
           get gente() { return povo.quantas; },
           get corte() { return povo.conta; },
           get estatMalha() { return povo.estatMalha; },
           get info() { return rend.info; },
           _rend: rend, _cena: cena, _cam: cam, _planta: P };
}
