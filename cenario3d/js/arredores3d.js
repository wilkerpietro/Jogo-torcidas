/* =========================================================
   A BRIGA DOS ARREDORES EM 3D (o jogo 3D, 29/09/2026)

   O dono: "pode fazer a briga dos arredores em 3D".

   No jogo de feed a investida marcada "nos arredores do estádio" abre a
   cena da foto dos arredores (dados/cena_arredores.js): os bondes, a
   grade de proteção (quebrar um módulo é romper o cordão, e a tropa de
   choque vem), os postos da PM e o portão de cada lado. Com o dia de
   jogo no ar em 3D (dia3d.js), a mesma briga cai no estádio de verdade,
   no CORDÃO DA PM do plano do dia (dia_de_jogo.js, `planejarArredores`):
   a grade e a fila de PMs de escudo na divisa entre a zona do mandante e
   a do visitante, no cordão mais perto da rota da rival. O nosso bonde
   desviou até lá pelo nosso lado e espera colado na grade; a rival está
   passando do outro lado, a caminho do portão dela.

   O tabuleiro do combate (1536 × 1024 px, na escala das outras brigas da
   cidade: 1 px = √0,3 unidade, 43 × 29 m) é um retângulo em volta do
   cordão, com o x do nosso lado pro deles. A máscara é a da caminhada: o
   chão de rua e de calçada do plano (`R.publico`) onde o corpo cabe, fora
   do estádio, e só o pedaço ligado a quem briga. AS GRADES da PM que caem
   no tabuleiro (os cordões e as ruas fechadas do plano) viram a grade do
   combate, em módulos de 2 m: a rival não tem caminho até a gente sem
   passar por ela, então vai na grade (é o que o combate faz quando não há
   volta, `semRota`), e o primeiro módulo no chão rompe o cordão. OS PMs
   do cordão viram os postos da PM do combate. Cada lado sai pelo caminho
   do portão dele (a rua dele pra frente, até a borda).

   A INVESTIDA NUM JOGO DE OUTROS CLUBES (o jogo da cidade no fundo,
   dia3d.js `investidaNoFundo`): o nosso bonde andou da sede até um ponto
   da rota da rival 60 m antes do portão dela; o tabuleiro fica em volta
   desse ponto, sem cordão (a gente não tem lado no jogo dos outros), e a
   nossa saída é a rua de onde a gente veio.
   ========================================================= */

const TAB = { W: 1536, H: 1024, CEL: 8 };
const ESCALA = Math.sqrt(0.3);          // unidade de mundo por px (a mesma das outras brigas da cidade)
const MAX_PM = 12;                      // os postos da PM no combate (os PMs do cordão mais perto do meio)
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* `o`: { P: [x, z] (o meio do tabuleiro: o meio do cordão, ou o ponto do
   encontro), u: [ux, uz] (o rumo do nosso lado pro deles), nosso: { rua
   (a Trilha do nosso bonde), s (onde está a cabeça dele), volta (a nossa
   saída é pra trás, pela rua de onde a gente veio) }, deles: { rua, s },
   segmentos: [{ a: [x, z], b: [x, z] }] (as grades da PM que viram grade
   do combate), pms: [{ x, z }] (os PMs do dia), nossoLado ('mandante' |
   'visitante', o lado do jogador no combate), fundo (a investida num
   jogo de outros clubes) }.
   Devolve { cena, noMundo, doMundo, u, v, chao, escala, noTabuleiro(x, z),
   P, malha, COLS, ROWS } ou { erro } */
export function brigaNosArredores(ctx, plano, o) {
  const M = ctx.M, K = ESCALA, Q = {};
  const pxM = M / K;                    // px do tabuleiro por metro
  let ux = o.u[0], uz = o.u[1];
  const lu = Math.hypot(ux, uz);
  if (!(lu > 1e-6)) return { erro: 'sem rumo pro tabuleiro' };
  ux /= lu; uz /= lu;
  const u = [ux, uz], vv = [-uz, ux], P = o.P;
  const O = [P[0] - (TAB.W / 2 * u[0] + TAB.H / 2 * vv[0]) * K, P[1] - (TAB.W / 2 * u[1] + TAB.H / 2 * vv[1]) * K];
  const noMundo = (x, y) => [O[0] + (x * u[0] + y * vv[0]) * K, O[1] + (x * u[1] + y * vv[1]) * K];
  const doMundo = (wx, wz) => { const dx = wx - O[0], dz = wz - O[1]; return [(dx * u[0] + dz * u[1]) / K, (dx * vv[0] + dz * vv[1]) / K]; };
  const dentro = (x, y, m = 0) => x > m && y > m && x < TAB.W - m && y < TAB.H - m;
  /* (um ponto do mundo que cai no tabuleiro: as grades e os PMs do dia que saem enquanto a briga dura) */
  const noTabuleiro = (wx, wz) => { const [x, y] = doMundo(wx, wz); return dentro(x, y, -4); };

  /* A MÁSCARA: a célula de 8 px anda se o corpo (12 cm) cabe no meio dela
     na grade do passo, é chão de rua ou de calçada do plano e não é estádio */
  const COLS = TAB.W / TAB.CEL, ROWS = TAB.H / TAB.CEL, malha = new Uint8Array(COLS * ROWS);
  const g = ctx.grade, r = 0.12 * M, R = plano.R;
  const naRua = (wx, wz) => { if (!R || !R.publico) return true; const Kc = R.celula(wx, wz); return Kc >= 0 && R.publico[Kc] === 1; };
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const [wx, wz] = noMundo((i + 0.5) * TAB.CEL, (j + 0.5) * TAB.CEL);
    malha[j * COLS + i] = g && g.cabe(wx, wz, r) && naRua(wx, wz) && !(ctx.noEstadio && ctx.noEstadio(wx, wz)) ? 1 : 0;
  }
  const livre = (x, y) => { const i = Math.floor(x / TAB.CEL), j = Math.floor(y / TAB.CEL); return i >= 0 && j >= 0 && i < COLS && j < ROWS && malha[j * COLS + i] === 1; };
  /* o ponto andável mais perto de (x, y), em espiral (px) */
  const soltar = (x, y) => {
    if (livre(x, y)) return [x, y];
    for (let rr = 8; rr < 240; rr += 8) for (let k = 0; k < 16; k++) {
      const a = k / 16 * 2 * Math.PI, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (dentro(px, py, 40) && livre(px, py)) return [px, py];
    }
    return [x, y];
  };
  /* um ponto da rua (Trilha) no tabuleiro */
  const naTab = (rua, s) => { rua.ponto(clamp(s, 0, rua.L), Q); return doMundo(Q.x, Q.z); };
  /* andando de s pra s + passo·k: o último ponto que ainda está dentro da margem `m` */
  const ateABorda = (rua, s, passo, m) => {
    let ult = naTab(rua, s);
    for (let k = 1; k < 600; k++) {
      const ss = s + passo * k;
      if (ss < 0 || ss > rua.L) break;
      const p = naTab(rua, ss);
      if (!dentro(p[0], p[1], m)) break;
      ult = p;
    }
    return ult;
  };
  /* o rumo da rua (no tabuleiro) no ponto s, pra frente (sinal 1) ou pra trás (−1) */
  const dirEm = (rua, s, sinal) => { rua.ponto(clamp(s, 0, rua.L), Q); const x = Q.tx * sinal, z = Q.tz * sinal; return [x * u[0] + z * u[1], x * vv[0] + z * vv[1]]; };

  /* AS GRADES: cada segmento da PM que corta o tabuleiro (recortado nele),
     esticado 0,35 m pra cada ponta (a grade encosta na parede: sem isso
     sobrava vão pra passar), em módulos de uns 2 m */
  const recortar = (a, b) => {
    /* Liang–Barsky no retângulo do tabuleiro */
    let t0 = 0, t1 = 1;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    for (const [p, q] of [[-dx, a[0]], [dx, TAB.W - a[0]], [-dy, a[1]], [dy, TAB.H - a[1]]]) {
      if (p === 0) { if (q < 0) return null; continue; }
      const t = q / p;
      if (p < 0) { if (t > t1) return null; if (t > t0) t0 = t; }
      else { if (t < t0) return null; if (t < t1) t1 = t; }
    }
    return [[a[0] + dx * t0, a[1] + dy * t0], [a[0] + dx * t1, a[1] + dy * t1]];
  };
  const grades = [], segsTab = [];
  for (const sg of o.segmentos || []) {
    let a = doMundo(sg.a[0], sg.a[1]), b = doMundo(sg.b[0], sg.b[1]);
    const L0 = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L0 < 1) continue;
    const ex = (b[0] - a[0]) / L0 * 0.35 * pxM, ey = (b[1] - a[1]) / L0 * 0.35 * pxM;
    a = [a[0] - ex, a[1] - ey]; b = [b[0] + ex, b[1] + ey];
    const cor = recortar(a, b);
    if (!cor) continue;
    const [p, q] = cor, L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (L < 0.8 * pxM) continue;
    grades.push({ id: 'cordao_' + grades.length, rot: 'CORDÃO DA PM', de: { x: Math.round(p[0]), y: Math.round(p[1]) }, ate: { x: Math.round(q[0]), y: Math.round(q[1]) },
                  modulos: Math.max(1, Math.round(L / pxM / 2.05)), espessura: 11 });
    segsTab.push([p, q]);
  }
  /* a distância (px) de (x, y) até a grade mais perto */
  const ateGrade = (x, y) => {
    let md = Infinity;
    for (const [p, q] of segsTab) {
      const dx = q[0] - p[0], dy = q[1] - p[1], L2 = dx * dx + dy * dy || 1;
      const t = clamp(((x - p[0]) * dx + (y - p[1]) * dy) / L2, 0, 1);
      md = Math.min(md, Math.hypot(x - p[0] - dx * t, y - p[1] - dy * t));
    }
    return md;
  };

  /* QUEM É QUEM: o jogador no lado do bonde dele; a rival no outro */
  const ladoN = o.nossoLado === 'visitante' ? 'visitante' : 'mandante', ladoR = ladoN === 'mandante' ? 'visitante' : 'mandante';
  /* O LUGAR DE CADA BONDE: a cabeça e o grosso, 9 m atrás na rua dele; quem
     cai colado na grade (ou fora do tabuleiro) volta pela rua até ficar a
     1,5 m dela, dentro */
  const naRuaDentro = (rua, s0) => {
    for (let k = 0; k <= 30; k++) {
      const s = s0 - k * M;
      if (s < 0) break;
      const p = naTab(rua, s);
      if (dentro(p[0], p[1], 60) && ateGrade(p[0], p[1]) >= 1.5 * pxM) return { p: soltar(p[0], p[1]), s };
    }
    return null;
  };
  const cabN = naRuaDentro(o.nosso.rua, o.nosso.s), cabR = naRuaDentro(o.deles.rua, o.deles.s);
  if (!cabN || !cabR) return { erro: 'o bonde ' + (!cabN ? 'nosso' : 'deles') + ' não cabe no tabuleiro' };
  const grossoN = naRuaDentro(o.nosso.rua, cabN.s - 9 * M) || cabN, grossoR = naRuaDentro(o.deles.rua, cabR.s - 9 * M) || cabR;

  /* SÓ O CHÃO LIGADO A QUEM BRIGA (a calçada fechada entre muros, o recuo sem saída, saem) */
  {
    const n = COLS * ROWS, visto = new Uint8Array(n), fila = new Int32Array(n);
    let ini = 0, fim = 0;
    const semente = ([x, y]) => {
      const i = Math.floor(x / TAB.CEL), j = Math.floor(y / TAB.CEL), c = j * COLS + i;
      if (i >= 0 && j >= 0 && i < COLS && j < ROWS && malha[c] && !visto[c]) { visto[c] = 1; fila[fim++] = c; }
    };
    for (const q of [cabN, grossoN, cabR, grossoR]) semente(q.p);
    semente(soltar(TAB.W / 2, TAB.H / 2));
    while (ini < fim) {
      const c = fila[ini++], i = c % COLS, j = (c - i) / COLS;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj, k = jj * COLS + ii;
        if (ii < 0 || jj < 0 || ii >= COLS || jj >= ROWS || visto[k] || !malha[k]) continue;
        visto[k] = 1; fila[fim++] = k;
      }
    }
    if (fim) for (let k = 0; k < n; k++) if (!visto[k]) malha[k] = 0;
  }
  const linhas = [];
  for (let j = 0; j < ROWS; j++) {
    const runs = []; let v0 = 0, n = 0;
    for (let i = 0; i < COLS; i++) { const v1 = malha[j * COLS + i]; if (v1 === v0) n++; else { runs.push(n); v0 = v1; n = 1; } }
    runs.push(n);
    linhas.push(runs.join(','));
  }

  const fundo = !!o.fundo;
  const spawns = [
    { id: ladoN + '1', rot: fundo ? 'NÓS, NA INVESTIDA' : 'NÓS, NO CORDÃO', lado: ladoN, x: Math.round(cabN.p[0]), y: Math.round(cabN.p[1]), jogador: true, entrada: 'saida_' + ladoN },
    { id: ladoN + '2', rot: 'NÓS, O GROSSO', lado: ladoN, x: Math.round(grossoN.p[0]), y: Math.round(grossoN.p[1]), entrada: 'saida_' + ladoN },
    { id: ladoR + '1', rot: fundo ? 'ELES, A CAMINHO DO PORTÃO' : 'ELES, DO OUTRO LADO', lado: ladoR, x: Math.round(cabR.p[0]), y: Math.round(cabR.p[1]), entrada: 'saida_' + ladoR },
    { id: ladoR + '2', rot: 'ELES, O GROSSO', lado: ladoR, x: Math.round(grossoR.p[0]), y: Math.round(grossoR.p[1]), entrada: 'saida_' + ladoR }
  ];
  /* AS SAÍDAS: cada um pelo caminho do portão dele (a rua dele pra frente,
     até a borda); a nossa, se cai colada em quem nasce (a rota que dá meia
     volta no cordão), é a do outro sentido da rua. Na investida no jogo dos
     outros, a nossa é a rua de onde a gente veio */
  const longeDe = (p, lista) => Math.min(...lista.map(q => Math.hypot(p[0] - q[0], p[1] - q[1])));
  const nossos = [cabN.p, grossoN.p];
  let sN = { p: soltar(...ateABorda(o.nosso.rua, cabN.s, o.nosso.volta ? -M : M, 90)), dir: dirEm(o.nosso.rua, cabN.s, o.nosso.volta ? -1 : 1) };
  if (!o.nosso.volta && longeDe(sN.p, nossos) < 260) {
    const outra = { p: soltar(...ateABorda(o.nosso.rua, grossoN.s, -M, 90)), dir: dirEm(o.nosso.rua, grossoN.s, -1) };
    if (longeDe(outra.p, nossos) > longeDe(sN.p, nossos)) sN = outra;
  }
  const sR = { p: soltar(...ateABorda(o.deles.rua, cabR.s, M, 90)), dir: dirEm(o.deles.rua, Math.min(o.deles.rua.L, cabR.s + 5 * M), 1) };
  const entradas = [
    { id: 'saida_' + ladoN, rot: fundo ? 'A RUA DE FUGA' : 'PRO PORTÃO', lado: ladoN, x: Math.round(sN.p[0]), y: Math.round(sN.p[1]), raio: 48, dir: sN.dir },
    { id: 'saida_' + ladoR, rot: 'O PORTÃO DELES', lado: ladoR, x: Math.round(sR.p[0]), y: Math.round(sR.p[1]), raio: 48, dir: sR.dir }
  ];
  /* A PM: os PMs do dia que caem no tabuleiro (a fila de escudo do cordão
     e quem mais estiver em volta), os mais perto do meio; sem eles, dois
     na frente da grade (ou do ponto do encontro), do lado deles */
  const pmPostos = [];
  for (const pm of (o.pms || [])) {
    const [x, y] = doMundo(pm.x, pm.z);
    if (!dentro(x, y, 30) || !livre(x, y)) continue;
    pmPostos.push({ x: Math.round(x), y: Math.round(y), d: Math.hypot(x - TAB.W / 2, y - TAB.H / 2) });
  }
  pmPostos.sort((a, b) => a.d - b.d).splice(MAX_PM);
  for (const q of pmPostos) delete q.d;
  if (pmPostos.length < 2) {
    const base = segsTab.length ? segsTab[0] : [[TAB.W / 2, TAB.H / 2 - 60], [TAB.W / 2, TAB.H / 2 + 60]];
    for (const k of [0.3, 0.7]) {
      const x = base[0][0] + (base[1][0] - base[0][0]) * k + 1.2 * pxM, y = base[0][1] + (base[1][1] - base[0][1]) * k;
      const [px, py] = soltar(x, y);
      pmPostos.push({ x: Math.round(px), y: Math.round(py) });
    }
  }

  const cena = {
    id: 'arredores@3d', base: 'arredores', tres: true,
    nome: 'Nos arredores do estádio',
    local: fundo ? 'Nos arredores do estádio, no caminho deles' : grades.length ? 'No cordão da PM, perto do portão' : 'Nos arredores do estádio',
    largura: TAB.W, altura: TAB.H, celula: TAB.CEL, imagem: null, mascara: linhas.join(';'),
    blocos: [], enfeites: [], varais: [], grades, filas: [], pintura: null,
    /* os dois bondes em dois grupos (a cabeça e o grosso), e quem quer briga vai pra cima (pela grade, se não tem volta) */
    espalharBonde: true, marchaAoInimigo: true,
    saida: fundo
      ? { perto: 'Sumir na rua', longe: 'Rua de fuga (leve o líder)', feito: 'sua torcida bateu e sumiu na rua de onde veio', dica: 'Leve o líder de volta pela rua de onde veio.' }
      : { perto: 'Seguir pro portão', longe: 'Pro portão (leve o líder)', feito: 'sua torcida largou o cordão e seguiu pro portão', dica: 'Leve o líder pela rua do portão da sua torcida.' },
    spawns, entradas, pmPostos
  };
  const chao = (x, y) => { const [wx, wz] = noMundo(x, y); return (ctx.chaoDaRua ? ctx.chaoDaRua(wx, wz) : 0) / M; };
  return { cena, noMundo, doMundo, u, v: vv, chao, escala: K, noTabuleiro, P, malha, COLS, ROWS, pxM };
}

/* ======================================================
   A GRADE DO CORDÃO EM 3D: um módulo da grade da PM do dia (o mesmo
   modelo, 2 m de grade de contenção de pé) por módulo do combate. O que
   perde vida balança (o `tremor` do combate) e o que chega a zero cai
   deitado, pra um dos lados. `modelo`: { geo, mat } (dia_de_jogo.js)
   ====================================================== */
export function gradesDoCordao(ctx, B, THREE, grupo, modelo) {
  const M = ctx.M, vistos = new Map();
  const geo = modelo && modelo.geo, mat = modelo && modelo.mat;
  function quadro(j) {
    if (!geo || !mat) return;
    for (const gm of (j && j.grades) || []) {
      if (gm.tipo === 'fila') continue;
      let v = vistos.get(gm);
      if (!v) {
        const [wx, wz] = B.noMundo(gm.x, gm.y);
        /* o rumo do módulo no mundo (o eixo x do modelo vai nele) e o comprimento */
        const dx = gm.ux * B.u[0] + gm.uy * B.v[0], dz = gm.ux * B.u[1] + gm.uy * B.v[1];
        const comp = gm.meia * 2 * B.escala / M;
        const g0 = new THREE.Group(), mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(Math.max(0.2, comp / 2), 1, 1);
        g0.add(mesh);
        g0.position.set(wx, ctx.chaoDaRua ? ctx.chaoDaRua(wx, wz) : 0, wz);
        g0.rotation.y = Math.atan2(-dz, dx);
        grupo.add(g0);
        v = { g: g0, mesh, cai: 0, lado: 1 };
        vistos.set(gm, v);
      }
      /* caído: deita pra um dos lados; de pé, balança com a pancada */
      if (gm.hp <= 0) { if (!v.cai) v.lado = Math.random() < 0.5 ? 1 : -1; v.cai = Math.min(1, v.cai + 0.06); }
      else v.cai = Math.max(0, v.cai - 0.1);
      const tremor = (gm.tremor || 0) > 0 ? Math.sin(performance.now() / 28 + gm.x) * 0.08 * Math.min(1, gm.tremor / 3) : 0;
      v.mesh.rotation.x = v.cai * (Math.PI / 2 - 0.1) * v.lado + tremor;
    }
  }
  function limpar() {
    for (const v of vistos.values()) grupo.remove(v.g);
    vistos.clear();
  }
  return { quadro, limpar };
}
