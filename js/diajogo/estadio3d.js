/* =========================================================
   O ESTÁDIO E O BAIRRO EM 3D
   ---------------------------------------------------------
   Segundo desenhista de `combate.js`: a simulação continua
   sendo o tabuleiro plano, com a mesma malha de 8 px e a mesma
   colisão. Nenhuma linha de combate foi tocada. O que muda é
   quem desenha e onde é o chão — e "onde é o chão" é a planta
   (`dados/cena_estadio.js`), que dobra o tabuleiro pra pôr o
   corredor embaixo da arquibancada e deixa o bairro em volta
   sem dobra nenhuma.

   O que sai daqui, em ordem:
   - a arquibancada: dezoito degraus de concreto, o nariz
     amarelo em volume, a régua de placas e o alambrado;
   - o corredor: teto nervurado, parede de dentro com comércio,
     pilares, a arcada com os três portões;
   - os oito vomitórios: buraco, escada, muretas, corrimão da
     prancha, túnel coberto até o pé;
   - o bairro (`bairro3d.js`), as torres e o gradil de esquina;
   - a gente, do Blender (`bonecos3.js`), lendo a simulação por
     `sinais3d.js`;
   - a câmera, que tem de saber quando está embaixo da laje.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';
import { entrarEm } from './bonecos3.js';
import { criarTradutor } from './sinais3d.js';
import { montarBairro } from './bairro3d.js';

const P = TO.dados.plantaEstadio;
const PINT = TO.diaJogo.estadioPintura;
const K = P.CIDADE;
const W = P.W, H = P.H;

/* a textura do chão cobre o que se DESENHA (mar e mato incluídos), que
   é maior que o tabuleiro: 4096 de largura, o que toda placa aceita */
const TEX_LARG = 4096;

const COR = {
  concreto:   0x9d998c,
  parede:     0xd8d2bc,
  balcao:     0xd8c058,
  balcaoTopo: 0xe6e0d2,
  placa:      0xd8622c,
  porta:      0x4a4438,
  toldo:      0xc03a2e,
  escada:     0xa8a294,
  faixa:      0xe8c22a,
  corrimao:   0x6d6a63,
  tela:       0xb9c0bb,
  torre:      0x6f6f6b,
  ceu:        0x5d6c84
};
const COR_LADO = { mandante: 0xc0392b, visitante: 0x2a5fa8, neutro: 0x7a6a3a };
/* a régua de patrocínio em volta do gramado, como na foto */
const PLACAS = [0xe0b52a, 0x1f3f8f, 0xd8622c, 0xeeeeea, 0x2a7a3a, 0xb02a22, 0x2a5fa8, 0xf0e8d0];

export function criar(canvas) {
  /* `preserveDrawingBuffer` custa uma cópia do quadro por quadro e só
     serve pra ler o canvas de fora (as fotos dos testes): liga com
     `?foto=1` na URL, e mais nada */
  const paraFoto = /[?&]foto=1/.test(location.search);
  const rend = new THREE.WebGLRenderer({ canvas, antialias: true,
                                         preserveDrawingBuffer: paraFoto });
  rend.setPixelRatio(Math.min(devicePixelRatio, 2));
  rend.shadowMap.enabled = true;
  rend.shadowMap.type = THREE.PCFSoftShadowMap;
  rend.outputColorSpace = THREE.SRGBColorSpace;

  /* QUEM ESTÁ DESENHANDO. 55 mil triângulos a 3 fps não é cena pesada,
     é Chrome sem placa de vídeo — SwiftShader, o rasterizador por
     software que ele usa quando a aceleração está desligada ou o driver
     está bloqueado. Nenhum modo leve resolve isso; o que resolve é
     ligar a aceleração. Então a página diz na tela quem desenha. */
  const gpu = (() => {
    try {
      const gl = rend.getContext();
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    } catch (_) { return '?'; }
  })();
  const gpuSoftware = /swiftshader|software|llvmpipe|mesa offscreen|basic render/i.test(gpu);

  const cena = new THREE.Scene();
  cena.background = new THREE.Color(COR.ceu);
  cena.fog = new THREE.Fog(COR.ceu, 2400, 5600);

  const cam = new THREE.PerspectiveCamera(54, 1, 2.0, 22000);

  /* =======================================================
     O MODO LEVE
     Quatro níveis. O relógio é de tempo, não de quadros: desce
     depois de 1,5 s ruins, sobe depois de 5 s folgados, pra não
     ficar pulando. Sombra é o primeiro a cair (é a segunda
     passada de desenho inteira); depois a resolução, que é o que
     mais pesa numa placa fraca; por último a anisotropia da
     textura do chão e a névoa, que encurta o que se desenha.
     ======================================================= */
  const NIVEIS = [
    { rot: 'cheio',   sombra: true,  dpr: 2.0,  aniso: 8, nevoa: [2400, 5600] },
    { rot: 'leve',    sombra: false, dpr: 1.0,  aniso: 4, nevoa: [2400, 5600] },
    { rot: 'leve+',   sombra: false, dpr: 0.75, aniso: 1, nevoa: [1800, 4200] },
    { rot: 'mínimo',  sombra: false, dpr: 0.5,  aniso: 1, nevoa: [1200, 3000] }
  ];
  let nivel = 0, mediaDt = 1 / 60, tempoNoNivel = 0, nivelFixo = false;
  function aplicarNivel() {
    const q = NIVEIS[nivel];
    rend.setPixelRatio(Math.min(devicePixelRatio, q.dpr));
    if (rend.shadowMap.enabled !== q.sombra) {
      rend.shadowMap.enabled = q.sombra;
      cena.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    }
    /* a névoa curta do modo leve é da câmera de ombro (encurta o que se
       desenha atrás do líder); vista de cima fica com a névoa longa, senão
       a maquete azula inteira no nível mínimo */
    const c = CAMERAS[vista];
    const nv = (c && c.nevoa) || (c && !c.seguir ? NIVEIS[0].nevoa : q.nevoa);
    cena.fog.near = nv[0]; cena.fog.far = nv[1];
    if (texChao) { texChao.anisotropy = Math.min(q.aniso, maxAniso); texChao.needsUpdate = true; }
    redimensionar(true);
  }
  function ajustarQualidade(dt) {
    if (nivelFixo) return;
    const d = Math.min(0.5, Math.max(0.001, dt));
    mediaDt = mediaDt * 0.85 + d * 0.15;
    tempoNoNivel += d;
    if (tempoNoNivel > 1.5 && mediaDt > 1 / 24 && nivel < NIVEIS.length - 1) {
      nivel++; tempoNoNivel = 0; mediaDt = 1 / 40; aplicarNivel();
    } else if (tempoNoNivel > 5 && mediaDt < 1 / 55 && nivel > 0) {
      nivel--; tempoNoNivel = 0; mediaDt = 1 / 45; aplicarNivel();
    }
  }
  let texChao = null, maxAniso = 1;

  cena.add(new THREE.HemisphereLight(0xd2dced, 0x6a6454, 1.0));
  const sol = new THREE.DirectionalLight(0xfff0d8, 1.0);
  sol.position.set(P.CX - 1300, 1700, P.CY - 700);
  sol.target.position.set(P.CX, 0, P.CY);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, {
    left: -1300, right: 1300, top: 1100, bottom: -1100, near: 200, far: 5000 });
  sol.shadow.bias = -0.0018;
  cena.add(sol, sol.target);
  /* o corredor é coberto e sem luz própria fica preto: uma luz
     fraca presa ao líder, uma hemisférica de dentro e uma rasante
     da arcada, todas sem sombra e só acesas quando se está lá */
  const luzCorredor = new THREE.PointLight(0xfff2dc, 0.0, 1, 2);
  cena.add(luzCorredor);
  const ambienteCorredor = new THREE.HemisphereLight(0xdce4ec, 0x7a7466, 0.0);
  cena.add(ambienteCorredor);
  const luzArcada = new THREE.DirectionalLight(0xfff4e4, 0.0);
  luzArcada.position.set(P.CX + 900, 260, P.CY);
  luzArcada.target.position.set(P.CX, 0, P.CY);
  cena.add(luzArcada, luzArcada.target);

  /* =======================================================
     AS TEXTURAS
     ======================================================= */
  const cvChao = document.createElement('canvas');
  const escalaTex = TEX_LARG / K.VW;
  cvChao.width = TEX_LARG; cvChao.height = Math.round(K.VH * escalaTex);
  const ctxChao = cvChao.getContext('2d');
  texChao = new THREE.CanvasTexture(cvChao);
  texChao.colorSpace = THREE.SRGBColorSpace;
  maxAniso = rend.capabilities.getMaxAnisotropy();
  texChao.anisotropy = Math.min(8, maxAniso);
  texChao.wrapS = texChao.wrapT = THREE.ClampToEdgeWrapping;
  function repintarChao() {
    ctxChao.setTransform(escalaTex, 0, 0, escalaTex, -K.VX0 * escalaTex, -K.VY0 * escalaTex);
    PINT.pintar(ctxChao, P);
    texChao.needsUpdate = true;
  }
  repintarChao();

  const texPiso = new THREE.CanvasTexture(PINT.pisoCorredor(256));
  texPiso.colorSpace = THREE.SRGBColorSpace;
  texPiso.wrapS = texPiso.wrapT = THREE.RepeatWrapping;
  texPiso.repeat.set(W / 120, H / 120);
  texPiso.anisotropy = texChao.anisotropy;

  /* =======================================================
     O CHÃO: um plano do tamanho do mapa, com a pintura, e um
     plano escuro enorme por baixo pra não acabar o mundo na
     beira do tabuleiro
     ======================================================= */
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(K.VW, K.VH),
    new THREE.MeshLambertMaterial({ map: texChao }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(K.VX0 + K.VW / 2, 0, K.VY0 + K.VH / 2);
  chao.receiveShadow = true;
  cena.add(chao);
  const alem = new THREE.Mesh(new THREE.PlaneGeometry(K.VW * 6, K.VH * 6),
    new THREE.MeshLambertMaterial({ color: 0xbfae86 }));
  alem.rotation.x = -Math.PI / 2;
  alem.position.set(K.VX0 + K.VW / 2, -6, K.VY0 + K.VH / 2);
  cena.add(alem);

  /* =======================================================
     O CONSTRUTOR DE MALHA
     ======================================================= */
  const Tecido = () => ({ pos: [], uv: [], cor: [] });
  const branco = new THREE.Color(1, 1, 1);
  const corTmp = new THREE.Color();
  const uDe = x => (x - K.VX0) / K.VW, vDe = y => 1 - (y - K.VY0) / K.VH;

  /* `tom` é um NÚMERO PEQUENO quando é só claro-escuro e um HEX
     quando a peça tem cor própria. O hex é dividido pela
     luminância do concreto porque o material multiplica pela cor
     dele: assim o balcão sai amarelo, e não amarelo-cinza. */
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
  /* cortina vertical sobre um anel, de y0 a y1. Todo material do
     estádio é DoubleSide: numa bacia fechada há face olhada dos
     dois lados em vários lugares (o espelho do degrau por dentro,
     a testeira por fora, a laje por baixo). */
  function paredeAnel(T, r, y0, y1, tom, pula, uvR, tomDe) {
    const q = P.anel(r), n = P.N;
    const qb = uvR === undefined ? q : P.anel(uvR);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (pula && pula(i)) continue;
      const t = tomDe ? tomDe(i) : tom;
      const A0 = [q[i][0], y0, q[i][1]], B0 = [q[j][0], y0, q[j][1]];
      const A1 = [q[i][0], y1, q[i][1]], B1 = [q[j][0], y1, q[j][1]];
      const ua = [uDe(qb[i][0]), vDe(qb[i][1])], ub = [uDe(qb[j][0]), vDe(qb[j][1])];
      const uc = [uDe(q[i][0]), vDe(q[i][1])], ud = [uDe(q[j][0]), vDe(q[j][1])];
      tri(T, A0, A1, B1, t, ua, uc, ud);
      tri(T, A0, B1, B0, t, ua, ud, ub);
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
  /* caixa dada em (lado, s, raio do MUNDO): pilar, balcão, mureta */
  function caixaLado(T, lado, s0, s1, r0, r1, y0, y1, tom) {
    const a = P.pontoMundo(lado, s0, r0), b = P.pontoMundo(lado, s1, r1);
    caixa(T, Math.min(a[0],b[0]), Math.max(a[0],b[0]), y0, y1,
             Math.min(a[1],b[1]), Math.max(a[1],b[1]), tom);
  }

  /* ---- quem está dentro de um vomitório, no MUNDO ---- */
  const V = P.VOM;
  function vomitorioEm(px, pz, folga) {
    const q = P.ondeNoRetoMundo(px, pz);
    if (!q) return null;
    const f = folga || 0;
    for (const v of P.VOMITORIOS)
      if (v.lado === q.lado && q.s >= v.e0 - f && q.s <= v.e1 + f) return v;
    return null;
  }
  /* um `pula` pra usar nos anéis: corta o que cai no BURACO do
     vomitório — da boca até onde a laje volta (`capuz`). Daí pra
     fora é túnel, e a laje continua por cima. */
  function puladorVom(r, folga) {
    if (r < V.rTop - 1 || r > V.capuz - 1) return null;
    const q = P.anel(r), n = P.N;
    return i => {
      const j = (i + 1) % n;
      return !!vomitorioEm((q[i][0]+q[j][0])/2, (q[i][1]+q[j][1])/2, folga);
    };
  }
  /* os trechos retos do anel (normal num eixo) contra as quinas */
  const naQuina = i => Math.abs(P.PERFIL[i].nx) > 0.03 && Math.abs(P.PERFIL[i].ny) > 0.03;

  /* =======================================================
     OS MATERIAIS
     ======================================================= */
  const grupo = new THREE.Group();
  cena.add(grupo);
  const matPintado  = new THREE.MeshLambertMaterial({ map: texChao, vertexColors: true, side: THREE.DoubleSide });
  const matConcreto = new THREE.MeshLambertMaterial({ color: COR.concreto, vertexColors: true, side: THREE.DoubleSide });
  const matPiso     = new THREE.MeshLambertMaterial({ map: texPiso, vertexColors: true, side: THREE.DoubleSide });
  const matFaixa    = new THREE.MeshLambertMaterial({ color: COR.faixa, side: THREE.DoubleSide });

  /* =======================================================
     A ARQUIBANCADA — dezoito degraus iguais, todos andáveis
     ======================================================= */
  function montarArquibancada(T, F, C, L) {
    const A = P.ALT;
    for (let i = 0; i < P.NDEG; i++) {
      const r0 = P.D.pista + i * A.degrau, r1 = r0 + A.degrau;
      const h = A.base + A.subida * i;
      const pula = puladorVom(r0);
      paredeAnel(T, r0, h - A.subida - (i === 0 ? A.base - A.subida : 0), h, 0.78,
                 pula, r0 + A.degrau * 0.5);
      lajeAnel(T, r0, r1, h, 1, pula);
      /* o nariz amarelo, em volume: pintado ele borrava */
      lajeAnel(F, r1 - 1.4, r1, h + 0.35, undefined, puladorVom(r1));
    }
    /* a frente da arquibancada, do chão da pista até o primeiro degrau */
    paredeAnel(T, P.D.pista, 0, A.base, 0.8);
    /* a régua de placas de patrocínio e o alambrado atrás dela */
    const rp = P.D.pista - 7;
    paredeAnel(C, rp, 0.5, 11, 1, null, undefined, i => PLACAS[Math.floor(i / 4) % PLACAS.length]);
    paredeAnel(C, rp + 1.6, 0.5, 11, 0.7);
    lajeAnel(C, rp, rp + 1.6, 11, 1.1);
    const ra = P.D.pista - 3, q = P.anel(ra);
    for (let i = 0; i < P.N; i += 4)
      caixa(C, q[i][0]-0.9, q[i][0]+0.9, A.base, A.base + A.alambrado, q[i][1]-0.9, q[i][1]+0.9, 1);
    lajeAnel(C, ra - 1.4, ra + 1.4, A.base + A.alambrado, 1);
    paredeAnel(L, ra, A.base, A.base + A.alambrado, 1);
  }

  /* =======================================================
     O CORREDOR — embaixo da arquibancada, de 96 a 224 no mundo
     ======================================================= */
  function montarCorredor(TC, TP) {
    const A = P.ALT, R = P.R, D = P.D;
    const fundo = r => P.tetoDe(r);

    /* ---- o teto: a laje inclinada, nervurada, seguindo o degrau ---- */
    const pulaTeto = r => puladorVom(r, -2);
    for (let i = 0; i < P.NDEG; i++) {
      const r0 = Math.max(R.corred0, D.pista + i * A.degrau);
      const r1 = Math.min(D.arq, r0 + A.degrau);
      if (r1 <= r0) continue;
      const h = fundo(r0);
      lajeAnel(TC, r0, r1, h, 0.96, pulaTeto(r0));
      if (r0 > R.corred0) paredeAnel(TC, r0, h - A.subida, h, 0.86, pulaTeto(r0));
    }
    /* o teto plano de trás e a laje de cima, que ninguém pisa; a
       mureta atrás da última fila, dos dois lados */
    lajeAnel(TC, D.arq, R.fachada0, fundo(D.arq), 0.96);
    lajeAnel(TC, D.arq, R.fachada0, P.TOPO_ARQ, 1.06);
    paredeAnel(TC, D.arq, P.TOPO_ARQ - 2, A.parapeito, 1.12);
    lajeAnel(TC, D.arq, D.parapeito, A.parapeito, 1.2);
    paredeAnel(TC, D.parapeito, P.TOPO_ARQ, A.parapeito, 1.0);
    /* as vigas no sentido do degrau */
    const qa = P.anel(R.corred0), qb = P.anel(R.fachada0);
    for (let i = 0; i < P.N; i += 5) {
      const a = qa[i], b = qb[i];
      if (vomitorioEm(a[0], a[1], 8)) continue;
      const passos = 8;
      for (let k = 0; k < passos; k++) {
        const t0 = k / passos, t1 = (k + 1) / passos;
        const x0 = a[0] + (b[0]-a[0])*t0, z0 = a[1] + (b[1]-a[1])*t0;
        const x1 = a[0] + (b[0]-a[0])*t1, z1 = a[1] + (b[1]-a[1])*t1;
        const r0 = R.corred0 + (R.fachada0-R.corred0)*t0;
        const r1 = R.corred0 + (R.fachada0-R.corred0)*t1;
        /* perto da parede de dentro o pé-direito é 39 e a viga desceria
           a 33 — a cabeça do boneco (39, em escala 1,15) entrava nela.
           Viga só onde o teto passa de 53. */
        if (r0 < 124) continue;
        const h = Math.min(fundo(r0), fundo(r1));
        caixa(TC, Math.min(x0,x1)-3, Math.max(x0,x1)+3, h - 6, h + 0.5,
                  Math.min(z0,z1)-3, Math.max(z0,z1)+3, 0.82);
      }
    }

    /* ---- a parede de dentro: creme, é onde mora o comércio ---- */
    paredeAnel(TC, R.corred0, 0, fundo(R.corred0), COR.parede);
    /* a cabeceira de cada vomitório: entre a parede de dentro e a
       boca da escada é concreto maciço — as células dali são a
       escada, e nada anda embaixo dela */
    for (const v of P.VOMITORIOS)
      caixaLado(TC, v.lado, v.e0, v.e1, R.corred0 - 0.5, V.rTop, 0, fundo(V.rTop) + 0.5, 0.98);

    /* ---- os pilares do meio, quadrados, espaçados ---- */
    const rp = (R.corred0 + R.fachada0) / 2;
    const qp = P.anel(rp);
    let acum = 0;
    for (let i = 0; i < P.N; i++) {
      const a = qp[i], b = qp[(i + 1) % P.N];
      acum += Math.hypot(b[0]-a[0], b[1]-a[1]);
      if (acum < 176) continue;
      acum = 0;
      if (vomitorioEm(a[0], a[1], 12)) continue;
      caixa(TC, a[0]-6.5, a[0]+6.5, 0, fundo(rp), a[1]-6.5, a[1]+6.5, 1.02);
    }

    /* ---- a ARCADA: pilar, mureta, vazio por cima, e os portões ---- */
    const AR = P.ARCADA;
    const rm = (R.fachada0 + R.fachada1) / 2;
    const qm = P.anel(rm);
    let acumA = 0;
    for (let i = 0; i < P.N; i++) {
      const a = qm[i], b = qm[(i + 1) % P.N];
      acumA += Math.hypot(b[0]-a[0], b[1]-a[1]);
      if (acumA < AR.passo) continue;
      acumA = 0;
      if (P.noPortaoMundo(a[0], a[1])) continue;
      caixa(TC, a[0]-AR.pilar/2, a[0]+AR.pilar/2, 0, P.TOPO_ARQ,
                a[1]-AR.pilar/2, a[1]+AR.pilar/2, 1.1);
    }
    const pulaPortao = (() => {
      const q = P.anel(rm), n = P.N;
      return i => {
        const j = (i + 1) % n;
        return P.noPortaoMundo((q[i][0]+q[j][0])/2, (q[i][1]+q[j][1])/2);
      };
    })();
    lajeAnel(TC, R.fachada0, R.fachada1, AR.mureta, 1.2, pulaPortao);
    paredeAnel(TC, R.fachada0, 0, AR.mureta, 1.06, pulaPortao);
    paredeAnel(TC, R.fachada1, 0, AR.mureta, 1.16, pulaPortao);
    lajeAnel(TC, R.fachada0, R.fachada1, P.TOPO_ARQ, 1.0);
    paredeAnel(TC, R.fachada1, P.TOPO_ARQ - 16, P.TOPO_ARQ, 1.14);
    /* os portões: batente de cada lado, verga e a placa com a cor do lado */
    for (const p of P.PORTOES) {
      const cor = COR_LADO[p.time] || COR_LADO.neutro;
      const m = p.larg / 2;
      caixaLado(TC, p.lado, p.c - m - 5, p.c - m, R.fachada0, R.fachada1, 0, 54, cor);
      caixaLado(TC, p.lado, p.c + m, p.c + m + 5, R.fachada0, R.fachada1, 0, 54, cor);
      caixaLado(TC, p.lado, p.c - m - 5, p.c + m + 5, R.fachada0, R.fachada1, 54, 60, cor);
      caixaLado(TC, p.lado, p.c - 30, p.c + 30, R.fachada1 - 0.5, R.fachada1 + 1.5, 60, 72, 0xe6dfc8);
    }
    /* a calçada redonda do estádio, um palmo acima da rua */
    lajeAnel(TP, R.calcada0, R.calcada1, 1.4, 1.02);
    paredeAnel(TC, R.calcada1, 0, 1.4, 0.7);
    /* ---- o PISO do corredor, com material próprio ---- */
    lajeAnel(TP, R.corred0, R.calcada0, 0.4, 1);
  }

  /* =======================================================
     O COMÉRCIO
     ======================================================= */
  function montarComercio(T) {
    /* TUDO ABAIXO DE 39: é o pé-direito na parede de dentro (o fundo
       do 9º degrau). Na primeira versão o toldo estava em 46–50 e
       atravessava a laje — aparecia em cima da arquibancada como uma
       barra vermelha. */
    for (const o of P.LOJAS) {
      const r0 = o.r0, r1 = o.r1;
      if (o.tipo === 'banheiro') {
        caixaLado(T, o.lado, o.s0, o.s1, r0, r1, 0, 34, COR.porta);
        caixaLado(T, o.lado, o.s0 - 3, o.s1 + 3, r1 - 2, r1 + 2, 34, 38.5, COR.parede);
        caixaLado(T, o.lado, o.s0 + 8, o.s1 - 8, r1, r1 + 2, 29, 33.5, COR.placa);
        continue;
      }
      caixaLado(T, o.lado, o.s0, o.s1, r0, r1, 0, 19, COR.balcao);
      caixaLado(T, o.lado, o.s0, o.s1, r0, r1 + 3, 19, 21.5, COR.balcaoTopo);
      caixaLado(T, o.lado, o.s0, o.s1, r0, r0 + 5, 21.5, 36, COR.parede);
      caixaLado(T, o.lado, o.s0 - 4, o.s1 + 4, r0, r1 + 8, 35.5, 38.5, COR.toldo);
      caixaLado(T, o.lado, o.s0 + 6, o.s1 - 6, r1 + 5, r1 + 7, 26, 34, COR.placa);
      if (o.tipo === 'pipoca' || o.tipo === 'cachorro') {
        caixaLado(T, o.lado, o.c - 13, o.c + 13, r1 + 12, r1 + 26, 0, 18, 0xd8d2c4);
        caixaLado(T, o.lado, o.c - 15, o.c + 15, r1 + 10, r1 + 28, 18, 21.5, 0xb02a22);
        caixaLado(T, o.lado, o.c - 2, o.c + 2, r1 + 18, r1 + 20, 21.5, 33, 0x6a665e);
        caixaLado(T, o.lado, o.c - 16, o.c + 16, r1 + 8, r1 + 30, 33, 36.5,
                  o.tipo === 'pipoca' ? 0xd83a30 : 0xe0b038);
      }
    }
  }

  /* =======================================================
     OS VOMITÓRIOS — o buraco, a escada dentro, o túnel até o pé
     ======================================================= */
  function montarVomitorios(T, F) {
    const passo = (V.rFoot - V.rTop) / V.degraus;
    const pisoK = k => V.yTop * (1 - k / V.degraus);
    const A = P.ALT;

    for (const v of P.VOMITORIOS) {
      const muros = [[v.e0, v.s0], [v.s1, v.e1]];
      for (let k = 0; k < V.degraus; k++) {
        const r0 = V.rTop + passo * k, r1 = r0 + passo, rm = (r0 + r1) / 2;
        const chao = pisoK(k + 1);
        /* o degrau, com a faixa amarela no nariz */
        caixaLado(T, v.lado, v.s0, v.s1, r0, r1, 0, chao, COR.escada);
        caixaLado(F, v.lado, v.s0, v.s1, r1 - V.faixa, r1, chao - 0.2, chao + 0.5, COR.faixa);
        /* as muretas: no buraco, guarda-corpo (ou o degrau vizinho, se
           for mais alto); no túnel, parede até o teto */
        const noBuraco = rm < V.capuz;
        const vizinho = P.alturaDegrau(Math.min(rm, P.D.arq - 1));
        const topo = noBuraco ? Math.max(vizinho, chao + V.guarda) : P.tetoDe(rm) + 0.5;
        for (const m of muros) caixaLado(T, v.lado, m[0], m[1], r0, r1, 0, topo, 1.04);
        /* a borda: a laje do degrau vizinho, rente à mureta, pra a
           amostragem do anel não deixar fresta ao lado dela */
        if (noBuraco) {
          caixaLado(T, v.lado, v.e0 - 8, v.e0, r0, r1, vizinho - A.laje, vizinho, 1);
          caixaLado(T, v.lado, v.e1, v.e1 + 8, r0, r1, vizinho - A.laje, vizinho, 1);
        }
        /* o corrimão lateral: em cima da mureta no buraco, na parede no túnel */
        const alto = chao + V.mao;
        for (const [m, dentro] of [[muros[0], v.s0], [muros[1], v.s1]]) {
          if (noBuraco) {
            const meio = (m[0] + m[1]) / 2;
            const y1 = Math.max(topo, alto);
            caixaLado(T, v.lado, m[0] + 0.5, m[1] - 0.5, r0, r1, y1 - 2.4, y1, COR.corrimao);
            caixaLado(T, v.lado, meio - 1.1, meio + 1.1, r0 + 1, r0 + 3.2, topo - 1, y1, COR.corrimao);
          } else {
            const s0 = dentro === v.s0 ? v.s0 + 0.4 : v.s1 - 2.4;
            caixaLado(T, v.lado, s0, s0 + 2, r0, r1, alto - 2.4, alto, COR.corrimao);
            caixaLado(T, v.lado, s0, s0 + 2, r0 + 1, r0 + 3.2, alto - 12, alto, COR.corrimao);
          }
        }
        /* o corrimão central, partindo a escada ao meio */
        caixaLado(T, v.lado, v.c - 1.4, v.c + 1.4, r0, r1, alto - 2.2, alto, COR.corrimao);
        caixaLado(T, v.lado, v.c - 1.1, v.c + 1.1, r0 + 1, r0 + 3.2, chao, alto, COR.corrimao);
      }
      /* a verga do túnel: onde a laje volta por cima da escada, o vão
         entre o teto do corredor e o piso do degrau de cima se fecha */
      caixaLado(T, v.lado, v.e0 - 2, v.e1 + 2, V.capuz - 2.5, V.capuz + 1,
                P.tetoDe(V.capuz) - 1, P.alturaDegrau(V.capuz) - A.subida + 0.5, 0.86);
      /* o pé: o piso do corredor continua por baixo do último degrau */
    }
  }

  /* =======================================================
     O GRADIL DE ESQUINA, AS TORRES, OS SETORES
     ======================================================= */
  function montarGradil(T) {
    const r = P.R.calcada1 - 2.5, q = P.anel(r);
    const pulaReto = i => !naQuina(i);
    paredeAnel(T, r, 19.5, 22, COR.corrimao, pulaReto);
    paredeAnel(T, r, 8, 9.6, COR.corrimao, pulaReto);
    for (let i = 0; i < P.N; i++) {
      if (!naQuina(i) || i % 2) continue;
      caixa(T, q[i][0]-1, q[i][0]+1, 1.4, 22, q[i][1]-1, q[i][1]+1, COR.corrimao);
    }
  }
  function montarTorres(T) {
    for (const t of P.TORRES) {
      const base = 13, topo = 5, alt = t.alt;
      caixa(T, t.x - 20, t.x + 20, 0, 3, t.z - 20, t.z + 20, 0.9);
      for (const [px, pz] of [[-1,-1],[1,-1],[1,1],[-1,1]])
        for (let k = 0; k < 6; k++) {
          const y0 = alt * k / 6, y1 = alt * (k + 1) / 6;
          const r0 = base + (topo - base) * k / 6, r1 = base + (topo - base) * (k + 1) / 6;
          const x0 = t.x + px * r0, z0 = t.z + pz * r0;
          const x1 = t.x + px * r1, z1 = t.z + pz * r1;
          caixa(T, Math.min(x0,x1)-2, Math.max(x0,x1)+2, y0, y1,
                   Math.min(z0,z1)-2, Math.max(z0,z1)+2, 0.8);
        }
      /* o painel de refletores, virado pro gramado */
      const ax = Math.sign(P.CX - t.x), az = Math.sign(P.CY - t.z);
      caixa(T, t.x - 26 + ax * 6, t.x + 26 + ax * 6, alt, alt + 30, t.z - 8 + az * 6, t.z + 8 + az * 6, 0.95);
      caixa(T, t.x - 24 + ax * 9, t.x + 24 + ax * 9, alt + 3, alt + 27, t.z - 6 + az * 9, t.z + 6 + az * 9, 0xe8e2c8);
    }
  }
  /* o bandeirão de cada setor, na mureta atrás da última fila */
  function montarSetores(T, D) {
    for (const e of D.entradas || []) {
      /* só setor: a saída pelo portão é entrada da simulação, não lugar
         de bandeirão — e o lado vem de ONDE o setor está, não da
         direção (a saída leste apontava como o setor oeste e pintava
         um bandeirão azul em cima do vermelho) */
      if (e.saida) continue;
      const q = P.ondeNoReto(e.x, e.y);
      if (!q) continue;
      const lado = q.lado;
      const cor = COR_LADO[e.lado] || COR_LADO.neutro;
      const s = q.s;
      caixaLado(T, lado, s - 74, s + 74, P.D.arq - 1.6, P.D.arq, P.TOPO_ARQ + 3, P.ALT.parapeito - 3, cor);
      caixaLado(T, lado, s - 60, s + 60, P.D.arq - 2.2, P.D.arq - 1.6, P.TOPO_ARQ + 9, P.TOPO_ARQ + 15, 0xf0ece0);
    }
  }

  /* =======================================================
     MONTAR TUDO
     ======================================================= */
  let conta = null;
  let cidade = null;
  function montarEstadio(D) {
    while (grupo.children.length) {
      const o = grupo.children.pop();
      if (o.geometry) o.geometry.dispose();
    }
    const TA = Tecido(), TC = Tecido(), TP = Tecido(), TL = Tecido(), TF = Tecido();
    montarArquibancada(TA, TF, TC, TL);
    montarCorredor(TC, TP);
    montarComercio(TC);
    montarVomitorios(TC, TF);
    montarGradil(TC);
    montarTorres(TC);
    montarSetores(TC, D);
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
    if (!cidade) { cidade = montarBairro(P); for (const m of cidade.meshes) cena.add(m); }
    conta = { degraus: P.NDEG, vomitorios: P.VOMITORIOS.length,
              lojas: P.LOJAS.length, lotes: K.LOTES.length, quadras: K.QUADRAS.length,
              pedacos: cidade.pedacos, portoes: P.PORTOES.length,
              triangulos: Math.round(nTri(TA) + nTri(TC) + nTri(TP) + nTri(TL) + nTri(TF) + cidade.triangulos) };
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
     ======================================================= */
  const CAMERAS = {
    ombro:   { seguir: true,  dist: 105,  alt: 0.22, fov: 56 },
    alto:    { seguir: true,  dist: 300,  alt: 0.58, fov: 48 },
    maquete: { seguir: false, dist: 1500, alt: 0.66, fov: 40 },
    zenital: { seguir: false, dist: 2300, alt: 1.50, fov: 42 },
    /* a cidade inteira, do mar ao mato: a névoa se afasta pra isso */
    mapa:    { seguir: false, dist: 7200, alt: 1.30, fov: 44, alvo: 'mapa', nevoa: [9000, 20000] }
  };
  let vista = 'ombro';
  let giro = 0, incl = CAMERAS.ombro.alt, dist = CAMERAS.ombro.dist;
  let arrastou = 0, primeira = true;
  const alvo = new THREE.Vector3(P.CX, 0, P.CY);
  const alvoSuave = new THREE.Vector3(P.CX, 0, P.CY);
  const posSuave = new THREE.Vector3();

  function irPara(nome) {
    const c = CAMERAS[nome];
    if (!c) return;
    vista = nome; incl = c.alt; dist = c.dist;
    cam.fov = c.fov; cam.updateProjectionMatrix();
    if (!c.seguir) giro = 0;
    primeira = true;
    aplicarNivel();
  }

  function posicionarCamera(lider, dt) {
    const c = CAMERAS[vista];
    let mundoLider = null;
    if (c.seguir && lider) {
      mundoLider = P.mundo(lider.x, lider.y);
      alvo.set(mundoLider.x, mundoLider.y + 24, mundoLider.z);
    } else if (vista !== 'livre') {
      if (c.alvo === 'mapa') alvo.set(K.VX0 + K.VW / 2, 0, K.VY0 + K.VH / 2);
      else alvo.set(P.CX, 40, P.CY);
    }

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
    /* ESTAR EMBAIXO DA LAJE NÃO É ESTAR NO CHÃO: o que decide é ter
       teto acima da cabeça, com folga de um boneco — na escada do
       vomitório o jogador sobe com a laje por cima o caminho todo */
    const ref = mundoLider || (vista === 'livre' ? alvoSuave : null);
    const tetoRef = ref ? P.teto(ref.x, ref.z) : Infinity;
    const sobLaje = !!ref && tetoRef < Infinity && ref.y < tetoRef - 12;
    const braco = dist * (sobLaje && vista === 'ombro' ? 0.7 : 1);
    posSuave.set(
      alvoSuave.x + braco * Math.cos(incl) * Math.sin(giro),
      alvoSuave.y + braco * Math.sin(incl),
      alvoSuave.z + braco * Math.cos(incl) * Math.cos(giro));

    /* A LINHA DE VISTA LEVANTA A CÂMERA; PAREDE E TETO PARAM.
       A regra antiga parava no primeiro concreto e recuava pra 55% do
       braço — e numa escada, num degrau ou atrás de uma mureta 55% do
       braço é dentro do concreto: descendo o vomitório a tela virava
       degrau, e com o líder na boca virava parapeito. Levantar a câmera
       até "10 acima do chão mais alto do caminho" também não bastava:
       com o líder embaixo dela, a linha de vista ainda atravessava a
       mureta. O que resolve é geometria: pra cada amostra do caminho,
       `P.piso` diz o chão dali no andar em que a amostra está, e a
       câmera sobe até a reta líder→câmera passar 6 acima de todos eles.
       Com teto (100 acima da cabeça do líder) pra uma mureta colada nas
       costas não virar guindaste. Depois disso, só parede, pilar, árvore
       e a laje por cima fazem ela parar — e embaixo da laje o teto
       continua mandando. */
    const dx = posSuave.x - alvoSuave.x, dz = posSuave.z - alvoSuave.z;
    const yL = alvoSuave.y;
    let cy = posSuave.y;
    for (let n = 1; n <= 14; n++) {
      const t = n / 14;
      const sx = alvoSuave.x + dx * t, sz = alvoSuave.z + dz * t;
      const yi = yL + (cy - yL) * t;
      const p = P.piso(sx, yi, sz) + (n === 14 ? 10 : 6);
      const precisa = yL + (p - yL) / t;
      if (precisa > cy) cy = Math.min(precisa, yL + 100);
    }
    posSuave.y = cy;
    const dy = posSuave.y - yL;
    for (let n = 1; n <= 14; n++) {
      const t = n / 14;
      if (!P.solido(alvoSuave.x + dx * t, yL + dy * t, alvoSuave.z + dz * t)) continue;
      /* fica ANTES da parede. O mínimo de 55% do braço era contra pilar,
         que não está no sólido; com 55%, a câmera barrada pelo parapeito
         ia parar do lado de fora dele. */
      const u = Math.max(0.15, (n - 1) / 14);
      posSuave.x = alvoSuave.x + dx * u;
      posSuave.z = alvoSuave.z + dz * u;
      posSuave.y = yL + dy * u;
      break;
    }
    if (sobLaje) {
      const tetoAli = P.teto(posSuave.x, posSuave.z);
      if (posSuave.y > tetoAli - 10) posSuave.y = Math.max(tetoAli - 10, yL - 26);
    }
    if (posSuave.y < 8) posSuave.y = 8;
    cam.position.copy(posSuave);
    cam.lookAt(alvoSuave);
    primeira = false;

    const querAmb = sobLaje ? 0.95 : 0.0;
    ambienteCorredor.intensity += (querAmb - ambienteCorredor.intensity) * Math.min(1, dt * 4);
    luzArcada.intensity += ((sobLaje ? 0.5 : 0) - luzArcada.intensity) * Math.min(1, dt * 4);
    luzCorredor.intensity += ((sobLaje ? 0.55 : 0) - luzCorredor.intensity) * Math.min(1, dt * 4);
    if (mundoLider) luzCorredor.position.set(mundoLider.x, 30, mundoLider.z);
    luzCorredor.distance = 280;
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
    dist = Math.max(40, Math.min(9000, dist * (1 + Math.sign(e.deltaY) * 0.09)));
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
    const c = montarEstadio(D);
    irPara(vista);
    return c;
  }

  function trocarSombra() {
    rend.shadowMap.enabled = !rend.shadowMap.enabled;
    cena.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    return rend.shadowMap.enabled;
  }
  /* trocar o nível na mão trava o automático; `null` devolve */
  function fixarNivel(n) {
    if (n === null || n === undefined) { nivelFixo = false; return nivel; }
    nivelFixo = true; nivel = Math.max(0, Math.min(NIVEIS.length - 1, n));
    aplicarNivel(); return nivel;
  }

  /* O TELHADO DA SEDE SE ABRE quando o jogador entra. De fora ela é
     um galpão fechado como qualquer casa; lá dentro o telhado some e
     a planta aparece — cômodo, corredor, salão.

     A borda é a da FATIA, sem folga nenhuma: ela coincide com a guia
     da calçada, e a torcida nasce do lado de fora dela. Com folga o
     telhado já abria no spawn, que fica a trinta da guia. Não pisca:
     entre a calçada e o miolo está a parede, então o boneco cruza a
     borda andando pelo vão do portão, que é onde a casa se abre
     mesmo. */
  function abrirTetoDaSede(lider) {
    if (!cidade || !cidade.tetos) return;
    for (const t of cidade.tetos) {
      const a = t.area;
      const dentro = !!lider && lider.x > a.x0 && lider.x < a.x1 &&
                                lider.y > a.y0 && lider.y < a.y1;
      if (t.mesh.visible !== !dentro) t.mesh.visible = !dentro;
    }
  }

  /* A BANDEIRA TREMULA. Uma senoide que VIAJA do mastro pra ponta, com
     amplitude crescendo ao longo do pano: preso na tralha, solto na
     ponta, que é como bandeira balança. O deslocamento sai no eixo
     perpendicular ao pano (pra dentro e pra fora da tela do pano) e um
     pouco na vertical, senão o pano parece uma cortina de trilho. */
  let ventoT = 0;
  function tremular(dt) {
    if (!cidade || !cidade.bandeiras || !cidade.bandeiras.length) return;
    ventoT += dt;
    for (const b of cidade.bandeiras) {
      const p = b.mesh.geometry.attributes.position, a = p.array, r = b.repouso;
      /* o eixo do pano no chão, e a normal dele */
      const nx = -b.dirz, nz = b.dirx;
      for (let i = 0; i < a.length; i += 3) {
        /* quanto já andou ao longo do pano, de 0 na tralha a 1 na ponta */
        const s = Math.min(1, Math.abs((r[i] - b.x) * b.dirx + (r[i + 2] - b.y) * b.dirz) / b.larg);
        const f = Math.sin(s * 7.5 - ventoT * 5.2) * s * s * 5.2
                + Math.sin(s * 3.1 - ventoT * 3.3 + 1.7) * s * 2.6;
        a[i]     = r[i]     + nx * f;
        a[i + 2] = r[i + 2] + nz * f;
        a[i + 1] = r[i + 1] + Math.sin(s * 5.0 - ventoT * 4.1) * s * 1.5;
      }
      p.needsUpdate = true;
    }
  }

  function quadro(J, dt) {
    ajustarQualidade(dt);
    tremular(dt);
    traduzir(J, dt);
    const lider = J.discos.find(d => d.lider && d.doJogador && d.vivo)
               || J.discos.find(d => d.lider && d.vivo);
    abrirTetoDaSede(lider);
    posicionarCamera(lider, dt);
    cam.updateMatrixWorld();
    atualizarTronco();
    povo.atualizar(J, dt);
    sincronizarRotulos(J);
    rend.render(cena, cam);
  }

  let ultimoL = 0, ultimoA = 0;
  function redimensionar(forcar) {
    const l = canvas.clientWidth, a = canvas.clientHeight;
    if (!l || !a) return;
    if (!forcar && l === ultimoL && a === ultimoA) return;
    ultimoL = l; ultimoA = a;
    rend.setSize(l, a, false);
    cam.aspect = l / a;
    cam.updateProjectionMatrix();
  }

  /* o WASD do jogo é em eixo do tabuleiro; a câmera de ombro
     precisa que W seja "pra frente da câmera" */
  /* A INTENÇÃO DO JOGADOR, NO EIXO DA CÂMERA.
     A câmera fica em alvo + R·(sen giro, cos giro) e olha pro alvo,
     então a FRENTE dela é (−sen giro, −cos giro) e a DIREITA é
     (cos giro, −sen giro) — o que é girar por −giro, não por +giro.
     Com o sinal trocado, W com a câmera a 90° andava pro lado
     contrário, e era esse o "ruim de fazer o boneco ir pro destino".
     Sai um vetor contínuo, não quatro booleanos: em oito direções não
     dá pra seguir uma rua diagonal. */
  function girarEntrada(teclas) {
    const ix = (teclas.d ? 1 : 0) - (teclas.a ? 1 : 0);
    const iz = (teclas.s ? 1 : 0) - (teclas.w ? 1 : 0);
    if (!ix && !iz) return null;
    const c = Math.cos(giro), s = Math.sin(giro);
    const x = ix * c + iz * s, z = -ix * s + iz * c;
    const m = Math.hypot(x, z);
    /* vai o vetor E os quatro booleanos equivalentes. Quem lê vetor usa
       o vetor; quem não lê — um `combate.js` velho parado no cache do
       navegador — ainda anda pelas teclas, em vez de ficar de pedra. */
    const lim = Math.max(Math.abs(x), Math.abs(z)) * 0.42;
    return { x: x / m, y: z / m,
             d: x > lim, a: x < -lim, s: z > lim, w: z < -lim };
  }

  return { montar, quadro, redimensionar, irPara, ligarRotulos,
           trocarSombra, fixarNivel, girarEntrada, mundo: (x, y) => P.mundo(x, y),
           gpu, gpuSoftware,
           get nivel() { return NIVEIS[nivel].rot + (nivelFixo ? ' (fixo)' : ''); },
           get sombra() { return rend.shadowMap.enabled; },
           get vista() { return vista; },
           get conta() { return conta; },
           get corte() { return povo.conta; },
           get comModelo() { return povo.comModelo; },
           get gente() { return povo.quantas; },
           get info() { return rend.info; },
           _rend: rend, _cena: cena, _cam: cam, _planta: P,
           get _cidade() { return cidade; },
           _mirar(g, i, d) {
             if (g !== undefined) giro = g;
             if (i !== undefined) incl = i;
             if (d !== undefined) dist = d;
             arrastou = 3; primeira = true;
           },
           /* olhar um ponto do MUNDO com a câmera livre: pra fotografar */
           _olhar(x, y, z, g, i, d) {
             alvo.set(x, y, z); alvoSuave.set(x, y, z);
             CAMERAS.livre = { seguir: false, dist: d, alt: i, fov: 50 };
             vista = 'livre'; giro = g; incl = i; dist = d;
             cam.fov = 50; cam.updateProjectionMatrix();
             arrastou = 1e9; primeira = true;
           },
           get _orbita() { return { giro, incl, dist }; } };
}
