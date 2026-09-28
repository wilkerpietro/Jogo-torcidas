/* =========================================================
   A INVASÃO NO ESTÁDIO, JOGADA (o jogo 3D, 28/09/2026)

   O dono: "Vamos ligar o dia de jogo com arquibancada e invasão no
   cenário 3d. A invasão deve ser controlável pela torcida do jogador
   somente."

   A invasão da torcida do jogador é o COMBATE do jogo (combate.js, a
   ponte, o HUD, os comandos) em cima da arquibancada de verdade do
   estádio do dia de jogo (arquibancada.js): o caminho escolhido — pela
   arquibancada (a divisória do isolamento mais perto dela, andando nas
   fileiras) ou pelo corredor de baixo — vira o tabuleiro, e as duas
   divisórias do isolamento (o setor vazio da PM entre as torcidas) são
   as GRADES do combate, que quebram módulo a módulo. Os guardas do
   isolamento são a PM da cena; quando a grade cede, a tropa entra pela
   frente, vindo do campo.

   O TABULEIRO É A ARQUIBANCADA DESENROLADA: o x anda ao longo do anel
   (no u do modelo, em metros medidos na fileira do meio), do nosso setor
   pro da rival; o y é a profundidade, de trás pra frente (a última
   fileira em cima, a mureta da frente embaixo: o +y aponta pro campo, e
   a câmera da briga fica do lado do campo, olhando a arquibancada — de
   fora, a fachada tapava tudo). O tabuleiro tem 1536 × 1024 px na escala das
   brigas da caminhada (1 px = √0,3 unidade: 43 × 29 m). Na curva do anel
   o x não é reto no mundo — o boneco segue a curva (o `noMundo` é o anel
   de verdade) e o rumo de cada um é o do eixo ali (`eixos`).

   A máscara: onde se pisa é o degrau (fora do poço de cada vomitório e
   dos cortes); no corredor, a faixa entre as paredes. A saída de cada
   lado é o túnel do próprio setor (o vomitório mais perto da grade): o
   fim da briga é o líder voltar pro setor.
   ========================================================= */
const TAB = { W: 1536, H: 1024, CEL: 8 };
const ESCALA = Math.sqrt(0.3);          // unidade de mundo por px (a das brigas da caminhada)
const DA_GRADE = 6.5;                   // m: onde cada torcida nasce, antes da grade do lado dela
const MODULO = 1.5;                     // m de grade por módulo (o combate quebra um de cada vez)
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* `plano`: o do dia de jogo (dia_de_jogo.js, com `arq`); `c`: o caminho
   (arq.caminhosDe); `o`: { lado (o nosso lado no combate) }.
   Devolve { cena, noMundo, doMundo, u, v, eixos, chao, escala, grades
   (as divisórias: [{i, x, y0, y1}]), foco } ou { erro } */
export function cenaDaInvasao(ctx, plano, c, o = {}) {
  const M = ctx.M, Aq = plano.arq, G = Aq && Aq.geo;
  if (!Aq || !G || !c) return { erro: 'sem arquibancada no plano' };
  const arq = c.via === 'arquibancada', T = c.T, A = T.A, L = c.L, s = c.s;
  const fam = arq ? A.fam : L.fam;
  const K = ESCALA, pxM = K / M;                     // metros por px
  /* a profundidade: na arquibancada, da frente da primeira fileira ao fundo da última; no corredor, de parede a parede */
  const dA = arq ? A.dk(0) : L.dI, dB = arq ? A.dn : L.dF, dMid = (dA + dB) / 2;
  const dRef = arq ? G.dFileira(A, Math.round(A.n / 2)) : dMid;
  /* O ANEL EM METROS: a tabela u → metros (com sinal) na profundidade dRef, a partir do meio do isolamento */
  const u1 = c.u1, u2 = c.u2, uMid = (u1 + u2) / 2;
  const mU = G.mPorU(fam, uMid, dRef);
  const vaoU = (TAB.W / 2 * pxM + 12) / mU;          // u de cada lado que o tabuleiro cobre (com folga)
  const NT = 480, tu = new Float64Array(NT + 1), tm = new Float64Array(NT + 1);
  {
    let a = fam.ponto(dRef, uMid - vaoU), acc = 0;
    tu[0] = uMid - vaoU;
    for (let i = 1; i <= NT; i++) {
      const u = uMid - vaoU + 2 * vaoU * i / NT, b = fam.ponto(dRef, u);
      acc += Math.hypot(b[0] - a[0], b[1] - a[1]); a = b;
      tu[i] = u; tm[i] = acc;
    }
    const m0 = (() => { const i = NT / 2; return tm[i]; })();
    for (let i = 0; i <= NT; i++) tm[i] -= m0;
  }
  const metrosDe = u => {
    if (u <= tu[0]) return tm[0] - (tu[0] - u) * mU;
    if (u >= tu[NT]) return tm[NT] + (u - tu[NT]) * mU;
    const f = (u - tu[0]) / (tu[NT] - tu[0]) * NT, i = Math.min(NT - 1, Math.floor(f)), k = f - i;
    return tm[i] + (tm[i + 1] - tm[i]) * k;
  };
  const uDeMetros = m => {
    if (m <= tm[0]) return tu[0] - (tm[0] - m) / mU;
    if (m >= tm[NT]) return tu[NT] + (m - tm[NT]) / mU;
    let lo = 0, hi = NT;
    while (hi - lo > 1) { const md = (lo + hi) >> 1; if (tm[md] <= m) lo = md; else hi = md; }
    const k = (m - tm[lo]) / ((tm[hi] - tm[lo]) || 1);
    return tu[lo] + (tu[hi] - tu[lo]) * k;
  };
  /* o tabuleiro ↔ (u, d) ↔ o mundo */
  const xDeU = u => TAB.W / 2 + s * metrosDe(u) / pxM;
  const uDeX = x => uDeMetros(s * (x - TAB.W / 2) * pxM);
  const yDeD = d => TAB.H / 2 - (d - dMid) / pxM;
  const dDeY = y => dMid - (y - TAB.H / 2) * pxM;
  const Wm = (mx, my, mz) => plano.mundo(mx, my, mz);
  const noMundo = (x, y) => { const q = fam.ponto(dDeY(y), uDeX(x)), w = Wm(q[0], 0, q[1]); return [w[0], w[2]]; };
  const doMundo = (wx, wz) => {
    const md = Aq.modelo(wx, 0, wz), r = fam.uDe(md[0], md[2]);
    const u = G.perto(fam, r.u, uMid), d = r.d;
    return [xDeU(u), yDeD(d)];
  };
  /* o piso (m): o degrau da fileira (na arquibancada) ou o chão do corredor */
  const kDe = d => clamp(Math.floor((d - A.dk(0)) / A.c.prof), 0, A.n - 1);
  const chao = arq ? ((x, y) => 0.02 + A.yk(kDe(dDeY(y)))) : (() => 0.02 + L.y);
  /* OS EIXOS no mundo (unitários): os do meio (o palco usa pra câmera e pro teclado) e os de cada ponto (o rumo de cada um na curva) */
  const eixos = (x, y, out = {}) => {
    const a = noMundo(x - 6, y), b = noMundo(x + 6, y), cc = noMundo(x, y - 6), dd = noMundo(x, y + 6);
    const ux = b[0] - a[0], uz = b[1] - a[1], lu = Math.hypot(ux, uz) || 1, vx = dd[0] - cc[0], vz = dd[1] - cc[1], lv = Math.hypot(vx, vz) || 1;
    out.u = [ux / lu, uz / lu]; out.v = [vx / lv, vz / lv];
    return out;
  };
  const E0 = eixos(TAB.W / 2, TAB.H / 2);

  /* A MÁSCARA: o degrau fora dos poços e dos cortes (a arquibancada), a faixa entre as paredes (o corredor) */
  const COLS = TAB.W / TAB.CEL, ROWS = TAB.H / TAB.CEL, malha = new Uint8Array(COLS * ROWS);
  const noPedaco = u => {
    if (!arq) return true;
    const cc = A.c;
    if (fam.fechado && cc.u1 - cc.u0 >= 9 - 1e-6) return true;
    const uu = fam.fechado ? G.perto(fam, u, (cc.u0 + cc.u1) / 2) : u;
    return uu > cc.u0 + 0.004 && uu < cc.u1 - 0.004;
  };
  for (let i = 0; i < COLS; i++) {
    const u = uDeX((i + 0.5) * TAB.CEL);
    if (!noPedaco(u)) continue;
    for (let j = 0; j < ROWS; j++) {
      const d = dDeY((j + 0.5) * TAB.CEL);
      let ok;
      if (arq) ok = d > dA + 0.12 && d < dB - 0.12 && G.livreV(A, u, kDe(d), kDe(d));
      else ok = d > L.dI + 0.3 && d < L.dF - 0.3;
      if (ok) malha[j * COLS + i] = 1;
    }
  }
  const livre = (x, y) => { const i = Math.floor(x / TAB.CEL), j = Math.floor(y / TAB.CEL); return i >= 0 && j >= 0 && i < COLS && j < ROWS && malha[j * COLS + i] === 1; };
  const soltar = (x, y) => {
    if (livre(x, y)) return [x, y];
    for (let rr = 8; rr < 260; rr += 8) for (let k = 0; k < 16; k++) {
      const a = k / 16 * 2 * Math.PI, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (px > 30 && py > 30 && px < TAB.W - 30 && py < TAB.H - 30 && livre(px, py)) return [px, py];
    }
    return [x, y];
  };
  const linhas = [];
  for (let j = 0; j < ROWS; j++) {
    const runs = []; let v0 = 0, n = 0;
    for (let i = 0; i < COLS; i++) { const v1 = malha[j * COLS + i]; if (v1 === v0) n++; else { runs.push(n); v0 = v1; n = 1; } }
    runs.push(n);
    linhas.push(runs.join(','));
  }

  /* AS GRADES: as duas divisórias do isolamento, da frente ao fundo, em módulos de MODULO m */
  const x1 = xDeU(u1), x2 = xDeU(u2);
  /* (yG0: o fundo, em cima; yG1: a frente, na mureta) */
  const yG0 = yDeD(dB) + 3, yG1 = yDeD(dA) - 3;
  const nMod = Math.max(3, Math.round((yG1 - yG0) * pxM / MODULO));
  const grades = [
    { id: 'isolamento_1', rot: 'GRADE DO ISOLAMENTO', de: { x: Math.round(x1), y: Math.round(yG0) }, ate: { x: Math.round(x1), y: Math.round(yG1) }, modulos: nMod, espessura: 10 },
    { id: 'isolamento_2', rot: 'GRADE DO ISOLAMENTO', de: { x: Math.round(x2), y: Math.round(yG0) }, ate: { x: Math.round(x2), y: Math.round(yG1) }, modulos: nMod, espessura: 10 }
  ];

  /* QUEM É QUEM: o nosso lado nasce antes da primeira grade, a rival depois da segunda */
  const nossoLado = o.lado === 'visitante' ? 'visitante' : 'mandante', outroLado = nossoLado === 'mandante' ? 'visitante' : 'mandante';
  const X = c.alvo || c.rival || null;
  const yDoMeio = Tt => arq ? yDeD(G.dFileira(A, clamp(Tt ? Tt.kMed : Math.round(A.n / 2), 1, A.n - 2))) : yDeD(dMid);
  const pNos = soltar(x1 - DA_GRADE / pxM, yDoMeio(T));
  const pNos2 = soltar(x1 - (DA_GRADE + 4) / pxM, yDoMeio(T) + (arq ? 2.2 / pxM : 0));
  const pEles = soltar(x2 + DA_GRADE / pxM, yDoMeio(X));
  const pEles2 = soltar(x2 + (DA_GRADE + 4) / pxM, yDoMeio(X) - (arq ? 2.2 / pxM : 0));
  const spawns = [
    { id: nossoLado + '1', rot: 'NÓS, NO SETOR', lado: nossoLado, x: Math.round(pNos[0]), y: Math.round(pNos[1]), jogador: true, entrada: 'tunel_' + nossoLado },
    { id: nossoLado + '2', rot: 'NÓS, NO SETOR', lado: nossoLado, x: Math.round(pNos2[0]), y: Math.round(pNos2[1]), entrada: 'tunel_' + nossoLado },
    { id: outroLado + '1', rot: 'ELES, NO SETOR', lado: outroLado, x: Math.round(pEles[0]), y: Math.round(pEles[1]), entrada: 'tunel_' + outroLado },
    { id: outroLado + '2', rot: 'ELES, NO SETOR', lado: outroLado, x: Math.round(pEles2[0]), y: Math.round(pEles2[1]), entrada: 'tunel_' + outroLado }
  ];
  /* O TÚNEL DE CADA SETOR: na arquibancada, a boca do vomitório do setor
     mais perto da grade (o degrau na frente do poço, ou atrás, se o poço
     começa na mureta); no corredor, o pé do vomitório por onde a torcida
     desceu (a saída dela, arquibancada.js) */
  const tunelDe = (lado, Tt, xGrade, sg) => {
    if (arq) {
      let mel = null;
      for (const vm of A.vomitorios || []) {
        const um = G.perto(fam, (vm.ua + vm.ub) / 2, uMid), x = xDeU(um), dx = (x - xGrade) * sg;
        if (dx < 3 / pxM || dx > 20 / pxM) continue;
        if (!mel || dx < mel.dx) mel = { vm, x, dx };
      }
      if (mel) {
        const vm = mel.vm, d = vm.k0 > 0 ? A.dk(vm.k0) - A.c.prof * 0.5 : A.dk(Math.min(A.n, vm.k1 + 1)) + A.c.prof * 0.5;
        return soltar(mel.x, yDeD(d));
      }
      return soltar(xGrade + sg * 14 / pxM, yDeD(G.dFileira(A, A.n - 2)));
    }
    const sa = Tt && Tt.saida && Tt.saida.L === L ? Tt.saida : null;
    const x = sa ? clamp(xDeU(G.perto(fam, sa.u, uMid)), 40, TAB.W - 40) : xGrade + sg * 14 / pxM;
    return soltar(clamp(x, xGrade + sg * 3 / pxM, xGrade + sg * 22 / pxM), yDeD(dMid));
  };
  const tNos = tunelDe(nossoLado, T, x1, -1), tEles = tunelDe(outroLado, X, x2, 1);
  const entradas = [
    { id: 'tunel_' + nossoLado, rot: 'O NOSSO TÚNEL', lado: nossoLado, x: Math.round(tNos[0]), y: Math.round(tNos[1]), raio: 44, dir: [-1, 0] },
    { id: 'tunel_' + outroLado, rot: 'O TÚNEL DELES', lado: outroLado, x: Math.round(tEles[0]), y: Math.round(tEles[1]), raio: 44, dir: [1, 0] }
  ];
  /* A PM: os guardas do isolamento (os do dia, onde estão) e, sem eles, dois no meio */
  const pmPostos = [];
  for (const e of (c.B && c.B.guardas) || []) if (e.via === c.via) {
    const [x, y] = doMundo(e.P[0], e.P[2]);
    if (x > x1 && x < x2 && y > 0 && y < TAB.H) { const q = soltar(x, y); pmPostos.push({ x: Math.round(q[0]), y: Math.round(q[1]) }); }
  }
  if (!pmPostos.length) for (const f of [0.35, 0.7]) { const q = soltar((x1 + x2) / 2, yG0 + (yG1 - yG0) * f); pmPostos.push({ x: Math.round(q[0]), y: Math.round(q[1]) }); }
  /* a tropa de choque entra pela frente do isolamento (vem do campo) — no corredor, pela porta de serviço no meio dele */
  const tropa = soltar((x1 + x2) / 2, arq ? yG1 - 12 : yDeD(dMid));
  /* A FAIXA de cada lado na mureta da frente do setor (virada pro campo) */
  const faixas = arq ? {
    [nossoLado]: { x: Math.round(pNos[0]), y: Math.round(yDeD(dA) - 14), len: 150, dir: [0, 1] },
    [outroLado]: { x: Math.round(pEles[0]), y: Math.round(yDeD(dA) - 14), len: 150, dir: [0, 1] }
  } : {};

  const cena = {
    id: 'invasao@3d', base: 'estadio', tres: true,
    nome: arq ? 'Invasão pela arquibancada' : 'Invasão pelo corredor',
    local: arq ? 'Na arquibancada, no isolamento da PM' : 'No corredor de baixo, no isolamento da PM',
    largura: TAB.W, altura: TAB.H, celula: TAB.CEL, imagem: null, mascara: linhas.join(';'),
    blocos: [], enfeites: [], varais: [], grades, pintura: null,
    /* como a arquibancada do jogo de feed (dados/cenas.js, `fazEstadio`):
       ninguém corre do tamanho do outro, cai-se a metade do setor, quem
       não vê ninguém marcha pro rival e a PM não recua */
    semFugaPorMinoria: true, debandadaEm: 50, marchaAoInimigo: true, semRecuoPM: true,
    tropaEm: { x: Math.round(tropa[0]), y: Math.round(tropa[1]) },
    saida: { perto: 'Voltar pro setor', longe: 'O nosso túnel (leve o líder)', feito: 'sua torcida invadiu o isolamento e voltou pro setor', dica: 'Quebre a grade, passe o cordão da PM e leve o líder de volta pro túnel do setor.' },
    spawns, entradas, pmPostos, faixas
  };
  /* onde a câmera abre: o meio do isolamento */
  const fw = noMundo((x1 + x2) / 2, (yG0 + yG1) / 2);
  return { cena, noMundo, doMundo, u: E0.u, v: E0.v, eixos, chao, escala: K, via: c.via, x1, x2, yG0, yG1, pxM,
           divisorias: [c.D1, c.D2], foco: { x: fw[0], z: fw[1], y: chao((x1 + x2) / 2, (yG0 + yG1) / 2) * M },
           malha, COLS, ROWS, rival: X ? X.b.t.id : null };
}

/* ======================================================
   AS GRADES EM 3D: o gradil do estádio em painéis, um por módulo do
   combate; a divisória do modelo sai enquanto a cena está no ar. O
   módulo que perde vida balança (o `tremor` do combate) e o que chega
   a zero cai deitado, pra um dos lados
   ====================================================== */
export function gradesDaInvasao(ctx, plano, B, THREE, grupo) {
  const M = ctx.M, est = plano.estadio, divs = plano.arq.divs || [];
  const originais = [];
  const quer = new Set(B.divisorias.filter(i => i != null && i >= 0));
  ctx.doMapa().traverse(o => { const dv = o.userData && o.userData.divisoria; if (o.isMesh && dv && dv.estadio === est.nome && quer.has(dv.i) && o.visible) originais.push(o); });
  let mapa = null;
  for (const o of originais) { const mt = o.material; if (!mapa && mt && mt.map && mt.alphaTest > 0) mapa = mt.map; }
  for (const o of originais) o.visible = false;
  const g0 = divs[B.divisorias[0]];
  const H = ((g0 && g0.h) || 2.4) * M;
  const mat = new THREE.MeshLambertMaterial({ map: mapa || null, color: mapa ? '#ffffff' : '#9aa3aa', transparent: !mapa, opacity: mapa ? 1 : 0.55, alphaTest: mapa ? 0.3 : 0, side: THREE.DoubleSide });
  const matPoste = new THREE.MeshLambertMaterial({ color: '#6d757b' });
  const geoPoste = new THREE.BoxGeometry(1, 1, 1);
  const vistos = new Map();
  function quadro(j) {
    for (const g of (j && j.grades) || []) {
      if (g.tipo === 'fila') continue;
      let v = vistos.get(g);
      if (!v) {
        /* o painel: do começo ao fim do módulo, no mundo, subindo com os degraus (um paralelogramo: o pé
           acompanha a arquibancada); a tela na escala do gradil (2,5 m por repetição) */
        const ax = g.x - g.ux * g.meia, ay = g.y - g.uy * g.meia, bx = g.x + g.ux * g.meia, by = g.y + g.uy * g.meia;
        const a = B.noMundo(ax, ay), b = B.noMundo(bx, by), ya = B.chao(ax, ay) * M, yb = B.chao(bx, by) * M;
        const w = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, dy = yb - ya;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, w, dy, 0, w, dy + H, 0, 0, H, 0], 3));
        const ru = w / (2.5 * M), rv = H / (2.5 * M);
        geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, ru, 0, ru, rv, 0, rv], 2));
        geo.setIndex([0, 1, 2, 0, 2, 3]);
        geo.computeVertexNormals();
        const grupoP = new THREE.Group(), painel = new THREE.Mesh(geo, mat);
        painel.frustumCulled = false; grupoP.add(painel);
        v = { g: grupoP, painel, poste: new THREE.Mesh(geoPoste, matPoste), cai: 0, lado: 1, a, ya,
              yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) - Math.PI / 2 };
        grupoP.position.set(a[0], ya, a[1]);
        v.poste.position.set(a[0], ya + H / 2, a[1]); v.poste.scale.set(0.08 * M, H, 0.08 * M);
        grupo.add(grupoP); grupo.add(v.poste);
        vistos.set(g, v);
      }
      /* caído: deita pra um dos lados; de pé, balança com a pancada */
      if (g.hp <= 0) { if (!v.cai) v.lado = Math.random() < 0.5 ? 1 : -1; v.cai = Math.min(1, v.cai + 0.05); }
      else v.cai = Math.max(0, v.cai - 0.1);
      const tremor = (g.tremor || 0) > 0 ? Math.sin(performance.now() / 28 + g.y) * 0.07 * Math.min(1, g.tremor / 3) : 0;
      const tomba = v.cai * (Math.PI / 2 - 0.12) * v.lado + tremor;
      v.g.rotation.set(0, v.yaw, 0);
      v.g.rotateX(-tomba);
      v.poste.visible = g.hp > 0;
    }
  }
  function limpar() {
    for (const o of originais) o.visible = true;
    for (const v of vistos.values()) { v.painel.geometry.dispose(); grupo.remove(v.g); grupo.remove(v.poste); }
    vistos.clear();
    mat.dispose(); matPoste.dispose(); geoPoste.dispose();
  }
  return { quadro, limpar };
}
