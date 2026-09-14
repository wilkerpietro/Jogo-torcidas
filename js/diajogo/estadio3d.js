/* =========================================================
   O ESTÁDIO EM 3D — a arquibancada em cima, o corredor embaixo
   ---------------------------------------------------------
   Segundo desenhista de `combate.js`: a simulação continua
   sendo o tabuleiro plano de 1536 × 1024, com a mesma malha de
   8 px e a mesma colisão. Nenhuma linha de combate foi tocada.

   O QUE ESTA CENA TEM DE DIFERENTE DE TODAS AS OUTRAS é que
   ela não põe o boneco em pé onde ele está: ela DOBRA o
   tabuleiro. `planta.mundo(x, y)` devolve um ponto em três
   dimensões, e duas faixas distantes do tabuleiro caem no
   mesmo lugar do mundo em alturas diferentes — a arquibancada
   em cima, o corredor embaixo dela. Ver `dados/cena_estadio.js`.

   O CORREDOR SAIU DE DUAS FOTOS que o dono mandou, de dentro
   do Presidente Vargas, e elas mudaram o desenho em quatro
   pontos que nenhuma planta teria dito:

   1. O TETO É A LAJE DA ARQUIBANCADA, inclinada, com as VIGAS
      APARENTES correndo no sentido do degrau. Não é um forro
      plano: é concreto nervurado, e é ele que dá a sensação de
      estar embaixo de alguma coisa pesada.
   2. PILAR QUADRADO no meio do corredor, de tantos em tantos
      metros. É o que corta a vista e faz o corredor ter
      esquina sem ter parede.
   3. UM LADO É ABERTO. A foto tem balcão amarelo de um lado e,
      do outro, mureta na altura da cintura com a luz
      estourando por cima. Então a fachada não é muro cego: é
      ARCADA — pilar, mureta, e vazio até a laje.
   4. O COMÉRCIO É BALCÃO NA PAREDE, não quiosque solto:
      lanche, pipoca, cerveja, cachorro-quente, banheiro e a
      loja da torcida, com toldo e placa.

   A GEOMETRIA SAI DA PLANTA. Todo anel — degrau, laje, arcada,
   pista — é a mesma volta em torno do gramado empurrada pra
   fora, e `anel(r)` devolve sempre o mesmo número de amostras
   na mesma ordem. Por isso o degrau de cima casa com o de
   baixo vértice a vértice e a bacia sai em poucas malhas.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';
import { entrarEm } from './bonecos3.js';
import { criarTradutor } from './sinais3d.js';

const P = TO.dados.plantaEstadio;
const PINT = TO.diaJogo.estadioPintura;
const W = P.W, H = P.H;

/* a textura do chão é ampliada umas dez vezes pela câmera de
   ombro; 2× segura o degrau e a marcação do campo sem passar
   dos 4096 que toda placa aceita */
const AMPLIA = 2;

const COR = {
  concreto:   0x9d998c,
  concretoE:  0xb0aa9a,
  viga:       0x8e8a7e,
  pilar:      0xa8a294,
  parede:     0xd8d2bc,     // a parede do comércio, creme como na foto
  balcao:     0xd8c058,     // o amarelo do balcão
  balcaoTopo: 0xe6e0d2,
  placa:      0xd8622c,     // a placa laranja
  porta:      0x4a4438,
  toldo:      0xc03a2e,
  escada:     0xa8a294,
  faixa:      0xe8c22a,     // a faixa amarela do nariz do degrau
  corrimao:   0x6d6a63,
  alambrado:  0x5d6460,
  tela:       0xb9c0bb,
  cobertura:  0xd8d5cc,
  trelica:    0x9aa0a6,
  torre:      0x6f6f6b,
  ceu:        0x5d6c84
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
  cena.fog = new THREE.Fog(COR.ceu, 1200, 3200);

  const cam = new THREE.PerspectiveCamera(54, 1, 1.0, 7000);

  cena.add(new THREE.HemisphereLight(0xd2dced, 0x6a6454, 1.0));
  const sol = new THREE.DirectionalLight(0xfff0d8, 1.0);
  sol.position.set(W / 2 - 1100, 1500, H / 2 - 600);
  sol.target.position.set(W / 2, 0, H / 2);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, {
    left: -900, right: 900, top: 780, bottom: -780, near: 200, far: 3600 });
  sol.shadow.bias = -0.0018;
  cena.add(sol, sol.target);
  /* O CORREDOR É COBERTO, e sem uma luz de dentro ele fica preto:
     o sol não entra e a hemisférica é do céu. Uma luz fraca sem
     sombra, presa no anel do corredor, é o que a arcada deixaria
     entrar — e é de graça, porque não projeta sombra nenhuma. */
  const luzCorredor = new THREE.PointLight(0xfff2dc, 0.0, 1, 2);
  cena.add(luzCorredor);
  const ambienteCorredor = new THREE.HemisphereLight(0xdce4ec, 0x7a7466, 0.0);
  cena.add(ambienteCorredor);
  /* e uma luz rasante, da arcada pra dentro, sem sombra: é ela
     que faz o corredor ter um lado claro e um escuro, como na
     foto, em vez de ser um bloco cinza uniforme */
  const luzArcada = new THREE.DirectionalLight(0xfff4e4, 0.0);
  luzArcada.position.set(W / 2 + 900, 260, H / 2);
  luzArcada.target.position.set(W / 2, 0, H / 2);
  cena.add(luzArcada, luzArcada.target);

  /* =======================================================
     AS TEXTURAS
     ======================================================= */
  const cvChao = document.createElement('canvas');
  cvChao.width = W * AMPLIA; cvChao.height = H * AMPLIA;
  const ctxChao = cvChao.getContext('2d');
  const texChao = new THREE.CanvasTexture(cvChao);
  texChao.colorSpace = THREE.SRGBColorSpace;
  texChao.anisotropy = Math.min(8, rend.capabilities.getMaxAnisotropy());
  function repintarChao() {
    ctxChao.setTransform(AMPLIA, 0, 0, AMPLIA, 0, 0);
    PINT.pintar(ctxChao, P, W, H);
    texChao.needsUpdate = true;
  }
  repintarChao();

  const texPiso = new THREE.CanvasTexture(PINT.pisoCorredor(256));
  texPiso.colorSpace = THREE.SRGBColorSpace;
  texPiso.wrapS = texPiso.wrapT = THREE.RepeatWrapping;
  texPiso.repeat.set(W / 120, H / 120);
  texPiso.anisotropy = texChao.anisotropy;

  /* =======================================================
     O CHÃO
     Um plano só, no zero: ele é a pista, é o piso do corredor e
     é a rua. A arquibancada senta em cima; o corredor é o vão
     entre este plano e o fundo da laje.
     ======================================================= */
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(W * 2.2, H * 2.4),
    new THREE.MeshLambertMaterial({ map: texChao }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(W / 2, 0, H / 2);
  chao.receiveShadow = true;
  /* a textura cobre só o tabuleiro; o resto do plano é asfalto */
  chao.material.map.wrapS = chao.material.map.wrapT = THREE.ClampToEdgeWrapping;
  chao.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(
    (() => {
      const uv = [];
      const g = chao.geometry.getAttribute('position');
      for (let i = 0; i < g.count; i++) {
        uv.push((g.getX(i) + W * 1.1) / (W * 2.2) * 2.2 - 0.6,
                (g.getY(i) + H * 1.2) / (H * 2.4) * 2.4 - 0.7);
      }
      return uv;
    })(), 2));
  cena.add(chao);

  /* =======================================================
     O CONSTRUTOR DE MALHA
     ======================================================= */
  const Tecido = () => ({ pos: [], uv: [], cor: [] });
  const branco = new THREE.Color(1, 1, 1);
  const corTmp = new THREE.Color();
  const uDe = x => x / W, vDe = y => 1 - y / H;

  /* `tom` é um NÚMERO PEQUENO quando é só claro-escuro (0,8 é
     mais escuro que o concreto, 1,2 é mais claro) e um HEX
     quando a peça tem cor própria — o balcão amarelo, a placa
     laranja, a porta do banheiro. É o que deixa o corredor
     inteiro sair numa malha só e ainda assim ter a cor da foto:
     a cor entra por vértice, não por material. */
  function tri(T, a, b, c, tom, uvA, uvB, uvC) {
    T.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    const g = tom === undefined ? branco
            : tom > 4 ? corTmp.setHex(tom).multiplyScalar(1 / 0.616)
            : corTmp.setScalar(tom);
    for (let k = 0; k < 3; k++) T.cor.push(g.r, g.g, g.b);
    T.uv.push(uvA[0], uvA[1], uvB[0], uvB[1], uvC[0], uvC[1]);
  }
  function malha(T, mat, sombra) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(T.cor, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = sombra !== false; m.receiveShadow = true;
    return m;
  }
  const nTri = T => T.pos.length / 9;

  /* faixa horizontal entre dois anéis do MUNDO, na altura y */
  function lajeAnel(T, r0, r1, y, tom, pula, yDe) {
    const a = P.anel(r0), b = P.anel(r1), n = P.N;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (pula && pula(i)) continue;
      const y0 = yDe ? yDe(r0) : y, y1 = yDe ? yDe(r1) : y;
      const A0 = [a[i][0], y0, a[i][1]], A1 = [a[j][0], y0, a[j][1]];
      const B0 = [b[i][0], y1, b[i][1]], B1 = [b[j][0], y1, b[j][1]];
      const ua = [uDe(a[i][0]), vDe(a[i][1])], ub = [uDe(a[j][0]), vDe(a[j][1])];
      const uc = [uDe(b[i][0]), vDe(b[i][1])], ud = [uDe(b[j][0]), vDe(b[j][1])];
      tri(T, A0, B1, B0, tom, ua, ud, uc);
      tri(T, A0, A1, B1, tom, ua, ub, ud);
    }
  }
  /* CORTINA VERTICAL SOBRE UM ANEL, DE y0 A y1 — E ELA TEM LADO.
     Foi aqui o bug que deixava ver o corredor de dentro da
     arquibancada. A ordem dos vértices abaixo dá normal PRA FORA
     do estádio, e o espelho do degrau é justamente a face que se
     olha DE DENTRO, do lado do gramado. Com `FrontSide` ele
     existia e não aparecia: a arquibancada virava um empilhado de
     fitas azuis flutuando, e por trás delas se via o corredor.

     Todo material do estádio passou a `DoubleSide`, que é o que
     resolve de verdade — numa bacia fechada há face olhada dos
     dois lados em vários lugares (o espelho por dentro, a testeira
     por fora, a laje do teto por baixo), e catar uma por uma é
     achar o mesmo bug de novo daqui a duas semanas. O three vira a
     normal na face de trás sozinho, então a luz continua certa. */
  function paredeAnel(T, r, y0, y1, tom, pula, uvR) {
    const q = P.anel(r), n = P.N;
    const qb = uvR === undefined ? q : P.anel(uvR);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (pula && pula(i)) continue;
      const A0 = [q[i][0], y0, q[i][1]], B0 = [q[j][0], y0, q[j][1]];
      const A1 = [q[i][0], y1, q[i][1]], B1 = [q[j][0], y1, q[j][1]];
      const ua = [uDe(qb[i][0]), vDe(qb[i][1])], ub = [uDe(qb[j][0]), vDe(qb[j][1])];
      const uc = [uDe(q[i][0]), vDe(q[i][1])], ud = [uDe(q[j][0]), vDe(q[j][1])];
      tri(T, A0, A1, B1, tom, ua, uc, ud);
      tri(T, A0, B1, B0, tom, ua, ud, ub);
    }
  }
  /* caixa em coordenada de mundo */
  function caixa(T, x0, x1, y0, y1, z0, z1, tom) {
    const v = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],
               [x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
    const u = p => [uDe(p[0]), vDe(p[2])];
    const f = (a,b,c,d) => { tri(T, v[a],v[b],v[c], tom, u(v[a]),u(v[b]),u(v[c]));
                             tri(T, v[a],v[c],v[d], tom, u(v[a]),u(v[c]),u(v[d])); };
    f(4,7,6,5); f(0,1,2,3);
    f(0,4,5,1); f(2,6,7,3); f(1,5,6,2); f(3,7,4,0);
  }
  /* caixa dada em (lado, s, raio do mundo) — é assim que se
     descreve pilar, balcão e mureta, que moram nos lados retos */
  function caixaLado(T, lado, s0, s1, r0, r1, y0, y1, tom) {
    const a = P.ponto(lado, s0, r0), b = P.ponto(lado, s1, r1);
    caixa(T, Math.min(a[0],b[0]), Math.max(a[0],b[0]), y0, y1,
             Math.min(a[1],b[1]), Math.max(a[1],b[1]), tom);
  }

  /* ---- quem está dentro de um vomitório, no MUNDO ---- */
  const RVOM0 = P.VOM.rTop, RVOM1 = P.VOM.rFoot, RCAPUZ = 112;
  function vomitorioEm(px, pz, folga) {
    const q = P.ondeNoReto(px, pz);
    if (!q) return null;
    const f = folga || 0;
    for (const v of P.VOMITORIOS)
      if (v.lado === q.lado && q.s >= v.e0 - f && q.s <= v.e1 + f) return v;
    return null;
  }
  /* um `pula` pra usar nos anéis: corta o que cai no vomitório */
  function puladorVom(r, folga) {
    if (r < RVOM0 - 1 || r > RVOM1 + 1) return null;
    const q = P.anel(r), n = P.N;
    return i => {
      const j = (i + 1) % n;
      return !!vomitorioEm((q[i][0]+q[j][0])/2, (q[i][1]+q[j][1])/2, folga);
    };
  }

  /* =======================================================
     A ARQUIBANCADA
     Catorze degraus de concreto iguais, todos andáveis.
     ======================================================= */
  const grupo = new THREE.Group();
  cena.add(grupo);
  const matPintado = new THREE.MeshLambertMaterial({ map: texChao, vertexColors: true, side: THREE.DoubleSide });
  const matConcreto = new THREE.MeshLambertMaterial({ color: COR.concreto, vertexColors: true, side: THREE.DoubleSide });
  const matPiso = new THREE.MeshLambertMaterial({ map: texPiso, vertexColors: true, side: THREE.DoubleSide });
  const matFaixa = new THREE.MeshLambertMaterial({ color: COR.faixa, side: THREE.DoubleSide });

  /* a faixa não tem textura nem tom: é uma cor chapada, então
     entra numa malha própria e sem uv nenhum */
  function lajeAnelCor(T, r0, r1, y, pula) { lajeAnel(T, r0, r1, y, undefined, pula); }

  /* A ARQUIBANCADA É UMA SÓ, DE PONTA A PONTA.
     Catorze degraus de concreto iguais, todos andáveis, como na
     arquibancada pré-moldada da referência. A versão anterior
     tinha seis fileiras de cadeira em cima que não se pisava, e
     elas saíram por dois motivos que apontam pro mesmo lugar:
     ficava um setor diferente no meio de um estádio que devia
     ser padronizado, e era superfície que o jogador via e não
     podia usar. */
  function montarArquibancada(T, F) {
    const A = P.ALT;
    for (let i = 0; i < P.NDEG; i++) {
      const r0 = P.D.pista + i * A.degrau, r1 = r0 + A.degrau;
      const h = A.base + A.subida * i;
      const pula = puladorVom(r0);
      paredeAnel(T, r0, h - A.subida - (i === 0 ? A.base - A.subida : 0), h, 0.78,
                 pula, r0 + A.degrau * 0.5);
      lajeAnel(T, r0, r1, h, 1, puladorVom(r0));
      /* A FAIXA AMARELA DO NARIZ, EM VOLUME.
         Pintada na textura ela borrava e a arquibancada virava
         listra amarela e azul; em volume sai nítida e custa 6,8
         mil triângulos no estádio inteiro. Vai na beira DE FORA
         de cada piso, que é por onde se desce, e é a norma
         (mínimo 5 cm — aqui 1,4). */
      lajeAnelCor(F, r1 - 1.4, r1, h + 0.35, puladorVom(r1));
    }
    /* a frente da arquibancada, do chão da pista até o primeiro degrau */
    paredeAnel(T, P.D.pista, 0, A.base, 0.8);
  }

  /* =======================================================
     O CORREDOR — o que as fotos mostraram
     ======================================================= */
  function montarCorredor(TC, TP) {
    const A = P.ALT, R = P.R;
    const fundo = r => P.tetoDe(r);

    /* ---- o teto: a laje inclinada, com as VIGAS APARENTES ----
       É o fundo da arquibancada, e nele se lê o degrau de cima:
       inclinado, nervurado, pesado. Da última fila pra fora ele
       vira plano, que é a laje de trás do estádio. */
    const pulaTeto = r => puladorVom(r, -2);
    for (let i = 0; i < P.NDEG; i++) {
      const r0 = Math.max(R.corred0, P.D.pista + i * A.degrau);
      const r1 = Math.min(P.D.arq, r0 + A.degrau);
      if (r1 <= r0) continue;
      const h = P.tetoDe(r0);
      lajeAnel(TC, r0, r1, h, 0.96, pulaTeto(r0));
      if (i > 0) paredeAnel(TC, r0, h - A.subida, h, 0.86, pulaTeto(r0));
    }
    /* o teto plano de trás, e a mureta que fecha a última fila.
       A mureta é o que impede o jogador de tentar andar nessa
       laje: ela existe no desenho e não existe no tabuleiro, e
       uma parede na frente é o que torna isso honesto. */
    lajeAnel(TC, P.D.arq, R.fachada0, P.tetoDe(P.D.arq), 0.96);
    lajeAnel(TC, P.D.arq, R.fachada0, P.TOPO_ARQ, 1.06);
    paredeAnel(TC, P.D.arq, P.TOPO_ARQ - 2, A.parapeito, 1.12);
    lajeAnel(TC, P.D.arq, P.D.parapeito, A.parapeito, 1.2);
    paredeAnel(TC, P.D.parapeito, P.TOPO_ARQ, A.parapeito, 1.0);
    /* as vigas, correndo no sentido do degrau, de tantas em tantas
       amostras do anel */
    const qa = P.anel(R.corred0), qb = P.anel(R.fachada0);
    for (let i = 0; i < P.N; i += 5) {
      const a = qa[i], b = qb[i];
      if (vomitorioEm(a[0], a[1], 6)) continue;
      const passos = 6;
      for (let k = 0; k < passos; k++) {
        const t0 = k / passos, t1 = (k + 1) / passos;
        const x0 = a[0] + (b[0]-a[0])*t0, z0 = a[1] + (b[1]-a[1])*t0;
        const x1 = a[0] + (b[0]-a[0])*t1, z1 = a[1] + (b[1]-a[1])*t1;
        const r0 = R.corred0 + (R.fachada0-R.corred0)*t0;
        const r1 = R.corred0 + (R.fachada0-R.corred0)*t1;
        const h0 = fundo(r0), h1 = fundo(r1);
        const h = Math.min(h0, h1);
        caixa(TC, Math.min(x0,x1)-3, Math.max(x0,x1)+3, h - 6, h + 0.5,
                  Math.min(z0,z1)-3, Math.max(z0,z1)+3, 0.82);
      }
    }

    /* ---- a parede de dentro: onde mora o comércio ----
       Creme, como na foto: é ela que faz o corredor ter um lado
       claro e um escuro. */
    paredeAnel(TC, R.corred0, 0, fundo(R.corred0), COR.parede);

    /* ---- os PILARES do meio, quadrados, como na foto ---- */
    const rp = (R.corred0 + R.fachada0) / 2;
    const qp = P.anel(rp);
    let acum = 0;
    for (let i = 0; i < P.N; i++) {
      const a = qp[i], b = qp[(i + 1) % P.N];
      acum += Math.hypot(b[0]-a[0], b[1]-a[1]);
      /* 168 e não 92, e 13 de lado e não 18: com pilar de dois em
         dois passos o corredor virava um bosque e a câmera de ombro
         vivia atrás de um. Na foto eles são espaçados. */
      if (acum < 168) continue;
      acum = 0;
      if (vomitorioEm(a[0], a[1], 10)) continue;
      caixa(TC, a[0]-6.5, a[0]+6.5, 0, fundo(rp), a[1]-6.5, a[1]+6.5, 1.02);
    }

    /* ---- a ARCADA: pilar, mureta e vazio por cima ---- */
    const AR = P.ARCADA;
    const rm = (R.fachada0 + R.rua0) / 2;
    const qm = P.anel(rm);
    let acumA = 0;
    const topoArc = P.TOPO_ARQ;
    for (let i = 0; i < P.N; i++) {
      const a = qm[i], b = qm[(i + 1) % P.N];
      acumA += Math.hypot(b[0]-a[0], b[1]-a[1]);
      if (acumA < AR.passo) continue;
      acumA = 0;
      caixa(TC, a[0]-AR.pilar/2, a[0]+AR.pilar/2, 0, topoArc,
                a[1]-AR.pilar/2, a[1]+AR.pilar/2, 1.1);
    }
    /* a mureta, com os vãos dos portões */
    const pulaPortao = (() => {
      const q = P.anel(rm), n = P.N;
      return i => {
        const j = (i + 1) % n;
        return P.noPortao((q[i][0]+q[j][0])/2, (q[i][1]+q[j][1])/2);
      };
    })();
    lajeAnel(TC, R.fachada0, R.rua0, AR.mureta, 1.2, pulaPortao);
    paredeAnel(TC, R.fachada0, 0, AR.mureta, 1.06, pulaPortao);
    paredeAnel(TC, R.rua0, 0, AR.mureta, 1.16, pulaPortao);
    /* a viga que fecha a arcada por cima, e o topo do estádio */
    lajeAnel(TC, R.fachada0, R.rua0, topoArc, 1.0);
    paredeAnel(TC, R.rua0, topoArc - 16, topoArc, 1.14);

    /* ---- o PISO do corredor, com material próprio ---- */
    lajeAnel(TP, R.corred0, R.rua0, 0.4, 1);
  }

  /* =======================================================
     O COMÉRCIO
     ======================================================= */
  function montarComercio(T) {
    const R = P.R;
    for (const o of P.LOJAS) {
      const r0 = R.corred0, r1 = R.corred0 + o.fundo;
      const alto = P.tetoDe(P.R.corred0);
      if (o.tipo === 'banheiro') {
        /* banheiro é vão escuro na parede, e nada mais */
        caixaLado(T, o.lado, o.s0, o.s1, r0, r1, 0, 44, COR.porta);
        caixaLado(T, o.lado, o.s0 - 3, o.s1 + 3, r1 - 2, r1 + 2, 44, 52, COR.parede);
        caixaLado(T, o.lado, o.s0 + 8, o.s1 - 8, r1, r1 + 2, 46, 51, COR.placa);
        continue;
      }
      /* o balcão da foto: peitoril amarelo, tampo claro, o fundo
         creme e a placa laranja por cima */
      caixaLado(T, o.lado, o.s0, o.s1, r0, r1, 0, 22, COR.balcao);
      caixaLado(T, o.lado, o.s0, o.s1, r0, r1 + 3, 22, 25, COR.balcaoTopo);
      caixaLado(T, o.lado, o.s0, o.s1, r0, r0 + 5, 25, 46, COR.parede);
      /* o toldo, que é o que separa um balcão do outro de longe */
      caixaLado(T, o.lado, o.s0 - 4, o.s1 + 4, r0, r1 + 8, 46, 50, COR.toldo);
      /* a placa acima, virada pro corredor */
      caixaLado(T, o.lado, o.s0 + 6, o.s1 - 6, r1 + 5, r1 + 7, 34, 44, COR.placa);
      if (o.tipo === 'pipoca' || o.tipo === 'cachorro') {
        /* carrinho: fica SOLTO no corredor, um pouco à frente do
           balcão — é o que a torcida desvia quando corre */
        caixaLado(T, o.lado, o.c - 13, o.c + 13, r1 + 12, r1 + 26, 0, 20, 0xd8d2c4);
        caixaLado(T, o.lado, o.c - 15, o.c + 15, r1 + 10, r1 + 28, 20, 24, 0xb02a22);
        caixaLado(T, o.lado, o.c - 2, o.c + 2, r1 + 18, r1 + 20, 24, 40, 0x6a665e);
        caixaLado(T, o.lado, o.c - 16, o.c + 16, r1 + 8, r1 + 30, 40, 44,
                  o.tipo === 'pipoca' ? 0xd83a30 : 0xe0b038);
      }
    }
  }

  /* =======================================================
     OS VOMITÓRIOS — o buraco na arquibancada e a escada dentro
     ======================================================= */
  function montarVomitorios(T) {
    const V = P.VOM;
    const passo = (V.rFoot - V.rTop) / V.degraus;
    /* a altura do piso do degrau k, já do jeito que a planta
       devolve — desenho e colisão contam a mesma escada */
    const pisoK = k => V.yTop * (1 - k / V.degraus);

    for (const v of P.VOMITORIOS) {
      /* ---- os degraus, com a FAIXA AMARELA no nariz ----
         A faixa não é enfeite de desenho: é a norma, e é o que
         faz uma escada de concreto cinza ter degrau visível.
         Ela vai no nariz — a beira de fora de cada piso, que é
         por onde se desce. */
      for (let k = 0; k < V.degraus; k++) {
        const r0 = V.rTop + passo * k, r1 = r0 + passo;
        const y = pisoK(k + 1);
        caixaLado(T, v.lado, v.s0, v.s1, r0, r1, 0, y, COR.escada);
        caixaLado(T, v.lado, v.s0, v.s1, r1 - V.faixa, r1, y - 0.2, y + 0.5, COR.faixa);
      }
      /* o patamar de cima, rente ao degrau da geral de onde se sai */
      caixaLado(T, v.lado, v.s0, v.s1, V.rTop - 5, V.rTop, 0, V.yTop, COR.escada);
      caixaLado(T, v.lado, v.s0, v.s1, V.rTop - V.faixa, V.rTop,
                V.yTop - 0.2, V.yTop + 0.5, COR.faixa);

      /* ---- as MURETAS dos dois lados ----
         Concreto até 0,90 m acima do degrau — ou até o piso da
         arquibancada ao lado, o que for mais alto, porque de um
         lado ela é guarda-corpo e do outro é arrimo do degrau. */
      const muros = [[v.e0, v.s0], [v.s1, v.e1]];
      const topoDe = [];
      for (let k = 0; k < V.degraus; k++) {
        const r0 = V.rTop + passo * k, r1 = r0 + passo;
        const chao = pisoK(k + 1);
        const vizinho = P.alturaDegrau(Math.min((r0 + r1) / 2, P.D.arq - 1));
        const topo = Math.max(vizinho, chao + V.guarda);
        topoDe.push({ r0, r1, topo, chao });
        for (const m of muros) caixaLado(T, v.lado, m[0], m[1], r0, r1, 0, topo, 1.04);
      }
      /* ---- o CORRIMÃO LATERAL, em cima das muretas ----
         Tubo por cima e montante de tantos em tantos degraus. */
      for (const m of muros) {
        const meio = (m[0] + m[1]) / 2;
        for (const q of topoDe) {
          const alto = Math.max(q.topo, q.chao + V.mao);
          caixaLado(T, v.lado, m[0] + 0.5, m[1] - 0.5, q.r0, q.r1,
                    alto - 2.4, alto, COR.corrimao);
          caixaLado(T, v.lado, meio - 1.1, meio + 1.1, q.r0 + 1, q.r0 + 3.2,
                    q.topo - 1, alto, COR.corrimao);
        }
      }
      /* ---- o CORRIMÃO CENTRAL, partindo a escada ao meio ----
         É o da prancha, e ele também é o que quebra a descida:
         quem corre numa escada de estádio corre de um lado só. */
      for (const q of topoDe) {
        const alto = q.chao + V.mao;
        caixaLado(T, v.lado, v.c - 1.4, v.c + 1.4, q.r0, q.r1, alto - 2.2, alto, COR.corrimao);
        caixaLado(T, v.lado, v.c - 1.1, v.c + 1.1, q.r0 + 1, q.r0 + 3.2,
                  q.chao, alto, COR.corrimao);
      }

      /* ---- o CAPUZ: da boca do túnel pra fora a laje volta ----
         É ela que faz o buraco ser buraco e não rasgo. Concreto
         que ninguém pisa — nem podia, porque as células de
         tabuleiro dali são o túnel de baixo. */
      const topoCapuz = P.alturaDegrau(Math.min(RVOM1, P.D.arq - 1));
      caixaLado(T, v.lado, v.e0, v.e1, RCAPUZ, RVOM1 + 4,
                topoCapuz - 10, topoCapuz + 4, 1.1);
      /* a testeira do capuz, que é o que se lê de longe como
         "aqui tem um vomitório" */
      caixaLado(T, v.lado, v.e0 - 2, v.e1 + 2, RCAPUZ - 3, RCAPUZ,
                topoCapuz - 13, topoCapuz + 5, 0.86);
    }
  }

  /* =======================================================
     O ALAMBRADO, A COBERTURA E AS TORRES
     ======================================================= */
  function montarAlambrado(T, C) {
    const A = P.ALT, r = P.anel(P.D.pista - 3);
    for (let i = 0; i < P.N; i += 5)
      caixa(T, r[i][0]-0.9, r[i][0]+0.9, A.base, A.base + A.alambrado,
               r[i][1]-0.9, r[i][1]+0.9, 1);
    lajeAnel(T, P.D.pista - 4.4, P.D.pista - 1.6, A.base + A.alambrado, 1);
    paredeAnel(C, P.D.pista - 3, A.base, A.base + A.alambrado, 1);
  }

  function montarCobertura(T) {
    const A = P.ALT, R = P.R;
    const z0 = P.CY - P.AY - 10, z1 = P.CY + P.AY + 10;
    const xFora = P.CX - P.AX - (R.rua0 - 6);
    const xDentro = P.CX - P.AX - 36;
    caixa(T, xFora, xDentro, A.cobertura, A.cobertura + 7, z0, z1, 1.12);
    caixa(T, xDentro - 4, xDentro, A.cobertura - 12, A.cobertura + 7, z0, z1, 0.84);
    /* a treliça, que é o que a foto tem e o que se vê de dentro */
    for (let k = 0; k <= 9; k++) {
      const z = z0 + (z1 - z0) * k / 9;
      caixa(T, xFora + 4, xDentro, A.cobertura - 5, A.cobertura, z - 2.4, z + 2.4, 0.9);
      caixa(T, xFora + 4, xFora + 12, P.TOPO_ARQ, A.cobertura, z - 5, z + 5, 0.95);
    }
    for (let k = 0; k < 22; k++) {
      const z = z0 + (z1 - z0) * (k + 0.5) / 22;
      caixa(T, xFora + 10, xDentro - 8, A.cobertura - 14, A.cobertura - 10, z - 1.6, z + 1.6, 0.86);
    }
  }

  function montarTorres(T) {
    const fora = P.R.rua0 + 30;
    for (const [sx, sz] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
      const cx = P.CX + sx * P.AX + sx * fora * 0.7071;
      const cz = P.CY + sz * P.AY + sz * fora * 0.7071;
      const base = 13, topo = 5, alt = 310;
      for (const [px, pz] of [[-1,-1],[1,-1],[1,1],[-1,1]])
        for (let k = 0; k < 6; k++) {
          const y0 = alt * k / 6, y1 = alt * (k + 1) / 6;
          const r0 = base + (topo - base) * k / 6, r1 = base + (topo - base) * (k + 1) / 6;
          const x0 = cx + px * r0, z0 = cz + pz * r0;
          const x1 = cx + px * r1, z1 = cz + pz * r1;
          caixa(T, Math.min(x0,x1)-2, Math.max(x0,x1)+2, y0, y1,
                   Math.min(z0,z1)-2, Math.max(z0,z1)+2, 0.8);
        }
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
      o.traverse(q => { if (q.geometry) q.geometry.dispose(); });
    }
    for (const e of D.entradas || []) {
      const d = e.dir || [0, -1];
      const g = new THREE.Group();
      const barra = new THREE.Mesh(new THREE.BoxGeometry(5, 44, 74),
        new THREE.MeshLambertMaterial({ color: COR_LADO[e.lado] || COR_LADO.neutro }));
      barra.castShadow = true; g.add(barra);
      const placa = new THREE.Mesh(new THREE.BoxGeometry(6, 12, 28),
        new THREE.MeshLambertMaterial({ color: 0xe6dfc8 }));
      placa.position.y = 32; g.add(placa);
      /* o portão fica no vão da mureta, e a planta já sabe onde */
      const m = P.mundo(e.x, e.y);
      g.position.set(m.x, 22, m.z);
      g.rotation.y = -Math.atan2(d[1], d[0]);
      grupoPortoes.add(g);
    }
  }

  /* =======================================================
     MONTAR TUDO
     ======================================================= */
  let conta = null;
  function montarEstadio() {
    while (grupo.children.length) {
      const o = grupo.children.pop();
      if (o.geometry) o.geometry.dispose();
    }
    const TA = Tecido(), TC = Tecido(), TP = Tecido(), TL = Tecido(), TF = Tecido();
    montarArquibancada(TA, TF);
    montarCorredor(TC, TP);
    montarComercio(TC);
    montarVomitorios(TC);
    montarCobertura(TC);
    montarTorres(TC);
    montarAlambrado(TC, TL);
    grupo.add(malha(TA, matPintado));
    grupo.add(malha(TC, matConcreto));
    grupo.add(malha(TF, matFaixa, false));
    const piso = malha(TP, matPiso, false);
    piso.castShadow = false;
    grupo.add(piso);
    const tela = malha(TL, new THREE.MeshLambertMaterial({
      color: COR.tela, vertexColors: true, transparent: true,
      opacity: 0.17, depthWrite: false, side: THREE.DoubleSide }), false);
    grupo.add(tela);
    conta = { degraus: P.NDEG, vomitorios: P.VOMITORIOS.length,
              lojas: P.LOJAS.length,
              triangulos: Math.round(nTri(TA) + nTri(TC) + nTri(TP) + nTri(TL) + nTri(TF)) };
    return conta;
  }

  /* =======================================================
     A GENTE
     ======================================================= */
  const pontoTmp = { x: 0, y: 0, z: 0 };
  const posicao = (x, y) => P.mundo(x, y, pontoTmp);

  const tronco = new THREE.Frustum();
  const mat4 = new THREE.Matrix4();
  const bolha = new THREE.Sphere(new THREE.Vector3(), 46);
  function atualizarTronco() {
    mat4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    tronco.setFromProjectionMatrix(mat4);
  }
  function noQuadro(x, z) {
    const m = P.mundo(x, z);
    bolha.center.set(m.x, m.y + 20, m.z);
    return tronco.intersectsSphere(bolha);
  }

  const povo = entrarEm(cena, { pos: posicao, sombra: true, escala: 1.15, noQuadro });
  const traduzir = criarTradutor();

  /* =======================================================
     CÂMERA
     Com dois andares ela ganhou um trabalho novo: quando o
     líder está no corredor, o teto é baixo e a câmera de ombro
     não pode subir. Ela é presa embaixo da laje, e o resultado
     é o enquadramento apertado que corredor de estádio tem.
     ======================================================= */
  const CAMERAS = {
    ombro:   { seguir: true,  dist: 105, alt: 0.22, fov: 56 },
    alto:    { seguir: true,  dist: 300, alt: 0.58, fov: 48 },
    maquete: { seguir: false, dist: 1150, alt: 0.70, fov: 40 },
    zenital: { seguir: false, dist: 1050, alt: 1.50, fov: 40 }
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
    let mundoLider = null;
    if (c.seguir && lider) {
      mundoLider = P.mundo(lider.x, lider.y);
      alvo.set(mundoLider.x, mundoLider.y + 24, mundoLider.z);
    } else alvo.set(W / 2, 40, H / 2);

    if (c.seguir && lider && arrastou <= 0) {
      const f = lider._b3;
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
    /* NO CORREDOR A CÂMERA CHEGA PERTO. O pé-direito é 39 e há
       pilar e balcão no caminho: de longe a cena vira concreto.
       Encurtar o braço é o que todo jogo faz em corredor, e aqui
       ainda ajuda a ler a briga, que é de corpo colado. */
    /* ESTAR EMBAIXO DA LAJE NÃO É ESTAR NO CHÃO.
       Isto media altura fixa — "y < 6" —, e na escada do vomitório
       o jogador está a 7, a 15, a 30, sempre com a laje por cima.
       Resultado: no meio da escada a câmera saía do modo de dentro,
       era empurrada pra cima da arquibancada e enquadrava concreto.
       O que decide é ter TETO acima da cabeça, com folga de um
       boneco. */
    const tetoLider = mundoLider ? P.teto(mundoLider.x, mundoLider.z) : Infinity;
    const sobLaje = !!mundoLider && tetoLider < Infinity &&
                    mundoLider.y < tetoLider - 12;
    const braco = dist * (sobLaje && vista === 'ombro' ? 0.66 : 1);
    posSuave.set(
      alvoSuave.x + braco * Math.cos(incl) * Math.sin(giro),
      alvoSuave.y + braco * Math.sin(incl),
      alvoSuave.z + braco * Math.cos(incl) * Math.cos(giro));

    /* O TETO PRENDE A CÂMERA — MAS SÓ QUANDO SE ESTÁ EMBAIXO.
       Foi assim que este bloco nasceu errado: `teto(x, z)` só
       sabe do plano, e devolve o fundo da laje tanto pra quem
       está no corredor quanto pra quem está EM CIMA da
       arquibancada, no mesmo ponto do mapa. Com a regra pelo
       plano, a câmera de cima era jogada pra dentro do concreto
       toda vez que o jogador andava na altura da última fila.
       Quem decide é a ALTURA do líder: no chão e com laje por
       cima, está no corredor. */
    if (sobLaje) {
      const tetoAli = P.teto(posSuave.x, posSuave.z);
      if (posSuave.y > tetoAli - 10) posSuave.y = tetoAli - 10;
      if (posSuave.y < alvoSuave.y - 26) posSuave.y = alvoSuave.y - 26;
    } else {
      /* E EM CIMA ELA NÃO AFUNDA — foi este o bug de "dá pra ver o
         corredor estando na arquibancada". A arquibancada sobe pra
         fora, então a câmera atrás do jogador cai num ponto onde o
         concreto é mais alto que ela; e como embaixo daquele ponto
         é o corredor (a dobra), ela entrava no vão e o jogador
         passava a ver o corredor de dentro do concreto. Agora ela é
         obrigada a ficar acima da superfície de onde está. */
      const chaoAli = P.superficie(posSuave.x, posSuave.z);
      if (posSuave.y < chaoAli + 12) posSuave.y = chaoAli + 12;
    }

    /* e o sólido empurra ela pra perto: caminha do líder até a
       posição e para no primeiro concreto */
    const dx = posSuave.x - alvoSuave.x, dz = posSuave.z - alvoSuave.z;
    const dy = posSuave.y - alvoSuave.y;
    for (let n = 1; n <= 14; n++) {
      const t = n / 14;
      if (!P.solido(alvoSuave.x + dx * t, alvoSuave.y + dy * t, alvoSuave.z + dz * t)) continue;
      /* nunca abaixo de 55% do braço: colada na nuca não é
         câmera, é tela preta com um ombro. No corredor isso
         acontece o tempo todo, porque tem pilar a cada dois
         passos — e atravessar um pilar por meio segundo incomoda
         menos do que perder a cena atrás dele. */
      const u = Math.max(0.55, (n - 1) / 14);
      posSuave.x = alvoSuave.x + dx * u;
      posSuave.z = alvoSuave.z + dz * u;
      posSuave.y = alvoSuave.y + dy * u;
      break;
    }
    if (posSuave.y < 8) posSuave.y = 8;
    cam.position.copy(posSuave);
    cam.lookAt(alvoSuave);
    primeira = false;

    /* a luz de dentro do corredor só acende quando se está lá */
    const querAmb = sobLaje ? 0.95 : 0.0;
    ambienteCorredor.intensity += (querAmb - ambienteCorredor.intensity) * Math.min(1, dt * 4);
    luzArcada.intensity += ((sobLaje ? 0.5 : 0) - luzArcada.intensity) * Math.min(1, dt * 4);
    luzCorredor.intensity += ((sobLaje ? 0.55 : 0) - luzCorredor.intensity) * Math.min(1, dt * 4);
    if (mundoLider) luzCorredor.position.set(mundoLider.x, 30, mundoLider.z);
    luzCorredor.distance = 260;
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
    dist = Math.max(40, Math.min(2400, dist * (1 + Math.sign(e.deltaY) * 0.09)));
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
      const m = P.mundo(d.x, d.y);
      vProj.set(m.x, m.y + 44, m.z).project(cam);
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
  function montar(D) {
    povo.limpar();
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

  /* o WASD do jogo é em eixo do tabuleiro; a câmera de ombro
     precisa que W seja "pra frente da câmera". A dobra é
     radial, então mundo e tabuleiro apontam pro mesmo lado e a
     conta é a mesma de sempre: gira a intenção e devolve os
     quatro booleanos que mais se parecem com ela. */
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
           trocarSombra, girarEntrada, mundo: (x, y) => P.mundo(x, y),
           get sombra() { return rend.shadowMap.enabled; },
           get vista() { return vista; },
           get conta() { return conta; },
           get corte() { return povo.conta; },
           get comModelo() { return povo.comModelo; },
           get gente() { return povo.quantas; },
           get info() { return rend.info; },
           /* expostos pra medir, depurar e enquadrar da consola — a
              órbita da câmera é o que permite olhar um canto do
              estádio sem depender de pra onde o líder está virado */
           _rend: rend, _cena: cena, _cam: cam, _planta: P,
           _mirar(g, i, d) {
             if (g !== undefined) giro = g;
             if (i !== undefined) incl = i;
             if (d !== undefined) dist = d;
             arrastou = 3; primeira = true;
           },
           get _orbita() { return { giro, incl, dist }; } };
}
