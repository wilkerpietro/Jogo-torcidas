/* =========================================================
   A PROPOSTA DE EXPANSÃO (2ª versão)
   ---------------------------------------------------------
   A grade continua a da cidade: a mesma rua de 118,8 (6,1 m), a mesma
   quadra de 691 × 346 (35,6 × 17,8 m), as colunas de 810 em 810 e as
   linhas de 464,4 em 464,4 (a linha 2, a do estádio, é a alta: 960).

   O que entra, além do que a 1ª versão já trazia (três colunas a oeste
   e duas linhas ao norte):
   - 12 quadras a oeste: a coluna −3 (linhas 1 a 8) e a −4 (linhas 2
     a 5), e 10 ao norte: a linha −2 (colunas −1 a 5) e a −3 (colunas 1
     e 2). A borda fica em degrau, não num retângulo;
   - a favela sai de onde está e vai pra ponta noroeste (o mesmo
     desenho, transladado); uma segunda, o mesmo desenho girado de meia
     volta, fica na ponta sudoeste. O lugar da favela vira quadra;
   - o atacarejo vai pra estrada de entrada do norte, antes do pórtico;
   - a escola sai (a quadra vira casa);
   - uma cópia do quarteirão do estádio a sudoeste, numa quadra de seis;
   - três condomínios, cada um com um prédio de cada tipo, em outras
     cores e com outros nomes;
   - duas estradas de entrada, uma no norte e uma no sul, cada uma com
     o pórtico "BEM-VINDO A {cidade}". As duas são avenidas que já
     existem e vão dar no estádio: a norte, reta, e a sudoeste. As
     outras avenidas passam a terminar na borda da cidade.

   Os lotes saem com a mesma conta do `lotear()` da planta, só que com
   hash da posição no lugar do sorteio: a proposta é a mesma toda vez
   que a página abre.
   ========================================================= */
export const RUA = 118.8;
const PASSO_Y = 464.4;

const TIPOS = {
  casa:    { alt: [66, 80],   cor: ['#e8dcc0', '#d9c9a3', '#e2b9a6', '#cfd8c9', '#e6e2d6', '#d8c8b0', '#e9d3b3'] },
  sobrado: { alt: [112, 136], cor: ['#e3d3b2', '#c9b48a', '#d4a48f', '#b7c4c2', '#ded9cd'] },
  predio:  { alt: [160, 240], cor: ['#cfcac0', '#b9b4aa', '#d5d0c4', '#a9b0b6', '#e0dcd2'] },
  muro:    { alt: [38, 48],   cor: ['#b0a794', '#a59a86', '#bdb3a0', '#9d9585'] },
  galpao:  { alt: [96, 128],  cor: ['#9fa4a6', '#8f948f', '#a8a39a'] }
};
const COMERCIO = [
  'BAR DO ZÉ', 'BOTECO DA ESQUINA', 'BAR E MERCEARIA', 'PONTO DO CHOPE', 'BAR DO NEGUINHO', 'BOTEQUIM DA VILA',
  'LANCHONETE TRÊS IRMÃOS', 'MERCADINHO SÃO JOÃO', 'PADARIA PÃO QUENTE', 'AÇOUGUE BOI GORDO', 'SALÃO DA DONA MARIA',
  'BARBEARIA DO TIÃO', 'BORRACHARIA 24H', 'OFICINA DO GORDO', 'LOTÉRICA SORTE GRANDE', 'FARMÁCIA POPULAR',
  'MATERIAIS DE CONSTRUÇÃO', 'SORVETERIA GELADÃO', 'PASTEL DA FEIRA', 'LAN HOUSE CYBER', 'DEPÓSITO DE BEBIDAS',
  'CASA DE CARNES', 'ELETRÔNICA DO ZÉ', 'CHAVEIRO 24 HORAS', 'BAZAR PREÇO BOM', 'AUTO PEÇAS IRMÃOS',
  'MÓVEIS POPULARES', 'GÁS E ÁGUA', 'SALGADOS DA VÓ', 'ESPETINHO DO MINEIRO', 'MERCEARIA DOIS IRMÃOS',
  'COSTURA E CONSERTOS', 'VIDRAÇARIA CENTRAL', 'PEIXARIA MARÉ ALTA'
];
const RECADOS = [
  'VENDE-SE', 'ALUGA-SE', 'PINTA-SE CASAS', 'PRECISA-SE DE AJUDANTE', 'É PROIBIDO JOGAR LIXO', 'NÃO ESTACIONE',
  'ENTRADA DE VEÍCULOS', 'TE AMO MARIA', 'SAUDADES ETERNAS', 'DEUS É FIEL', 'PROIBIDO COLAR CARTAZ',
  'CUIDADO COM O CÃO', 'TEM ÁGUA', 'LAVA-SE ROUPA', 'CONSERTA-SE GELADEIRA'
];
/* a casa de muro precisa desse tanto de frente e de fundo (em metros) */
const MIN_MURO = { m1: [4.6, 4.6], m2: [4.8, 4.6], m3: [4.2, 4.3], m4: [3.6, 4.0] };

/* as quadras novas: coluna → [primeira linha, última linha] (dá mais de
   um intervalo por coluna). A coluna 1 nas linhas 1 a 3 é o lugar da
   favela de hoje. */
const GRADE = {
  '-4': [[2, 5]],
  '-3': [[1, 8]],
  '-2': [[-1, 10]],
  '-1': [[-2, 10]],
  '0':  [[-2, 10]],
  '1':  [[-3, 0], [1, 3]],
  '2':  [[-3, 0]],
  '3':  [[-2, 0]],
  '4':  [[-2, 0]],
  '5':  [[-2, 0]]
};
/* a quadra do estádio 2: seis quadras juntas, sem as ruas do meio */
const ESTADIO2 = { i: [-2, -1], j: [8, 10] };

/* o que vira equipamento, e não casa */
const EQUIP = {
  '1,1':  { tipo: 'praca',  nome: 'Praça da Vila', cor: '#5f9a4c',
            nota: 'No meio de onde era a favela: o bairro novo ganha a praça dele.' },
  '-2,4': { tipo: 'campo',  nome: 'Campo de várzea', cor: '#3f7f3a',
            nota: 'O segundo campo da cidade, pra pelada e pra briga de torcida.' },
  '-1,6': { tipo: 'ubs',    nome: 'Posto de saúde', cor: '#e2ddd0',
            nota: 'UBS pro oeste, no meio do bairro novo.' },
  '2,-1': { tipo: 'igreja', nome: 'Igreja', cor: '#d8cfb8',
            nota: 'A igreja do bairro novo do norte.' },
  '-4,4': { tipo: 'sede',   nome: 'Terreno para sede', cor: '#9a4f9a',
            nota: 'Lugar pra sede de uma torcida nova, na ponta oeste, longe do estádio.' },
  '5,0':  { tipo: 'sede',   nome: 'Terreno para sede', cor: '#9a4f9a',
            nota: 'Lugar pra sede de uma torcida nova, a duas quadras do estádio.' }
};
/* os condomínios: a quadra alta (linha 2) e a folha de cor de cada um */
const CONDOMINIOS = [
  { id: '1,2',  folha: 'torres_v1', t1: 'Edifício Horizonte', t2: 'Residencial Porto Belo',
    cores: 'concreto areia, vidro verde e tijolo vinho' },
  { id: '-2,2', folha: 'torres_v2', t1: 'Edifício Atlântico', t2: 'Residencial Monte Verde',
    cores: 'concreto branco, vidro fumê e pastilha grafite' },
  { id: '-4,2', folha: 'torres_v3', t1: 'Edifício Solar', t2: 'Residencial Ipê Amarelo',
    cores: 'concreto terracota, vidro bronze e tijolo mostarda' }
];

export function gerarProposta(P) {
  const K = P.CIDADE, CALC = K.CALC, M = P.METRO;
  const par8 = v => Math.round(v / 8) * 8;
  const hash = (...n) => {
    let h = 2166136261;
    for (const v of n) { h = Math.imul(h ^ Math.round(v * 7 + 3), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; }
    return h >>> 0;
  };
  const sorte = (...n) => hash(...n) / 4294967296;
  const entre = (a, b, ...n) => a + sorte(...n) * (b - a);
  const cruza = (a, b, m) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;
  const MARGEM = RUA / 2 + 4;

  /* ---- a grade: as colunas e as linhas de hoje, e as novas no mesmo passo ---- */
  const cx0 = K.COLUNAS[0].c, passoX = K.COLUNAS[1].c - K.COLUNAS[0].c;
  const ly0 = K.LINHAS[0].c;
  const colX = i => i >= 1 ? [K.bordasX[2 * i], K.bordasX[2 * i + 1]]
                           : [cx0 + (i - 1) * passoX + RUA / 2, cx0 + i * passoX - RUA / 2];
  const linY = j => j >= 1 ? [K.bordasY[2 * j], K.bordasY[2 * j + 1]]
                           : [ly0 + (j - 1) * PASSO_Y + RUA / 2, ly0 + j * PASSO_Y - RUA / 2];

  /* ---- as avenidas da proposta ---- */
  const av = id => K.AVENIDAS.find(a => a.id === id);
  const avenidas = [];
  const noroeste2Fim = colX(-3)[0] + 6;
  for (const a of K.AVENIDAS) {
    const p = a.pontos.map(q => q.slice());
    const n = p.length;
    const alonga = (ia, ib, x) => {                     // segue a direção do último trecho até x
      const [xa, ya] = p[ia], [xb, yb] = p[ib];
      return [x, yb + (yb - ya) * (x - xb) / (xb - xa)];
    };
    if (a.id === 'norte') p[1] = [p[1][0], -2750];                               // a estrada de entrada do norte
    else if (a.id === 'noroeste') {
      /* o último trecho segue até encontrar a estrada norte: vira um entroncamento */
      const [xa, ya] = p[n - 2], [xb, yb] = p[n - 1];
      const xn = av('norte').pontos[0][0], s = (xn - xa) / (xb - xa);
      p[n - 1] = [xn, ya + (yb - ya) * s];
    } else if (a.id === 'oeste') p.push(alonga(n - 2, n - 1, colX(-3)[0] - 60));   // até a borda oeste
    else if (a.id === 'noroeste2') p.push(alonga(n - 2, n - 1, noroeste2Fim));     // até a entrada da favela do noroeste
    else if (a.id === 'sudoeste') {
      /* a estrada de entrada do sul: o primeiro ponto desce até a borda nova */
      const [xa, ya] = p[1], [xb, yb] = p[0], yN = 6100;
      p[0] = [xb + (xb - xa) * (yN - yb) / (yb - ya), yN];
    } else if (a.id === 'beiramar') {
      /* a beira-mar termina nas duas pontas da orla, com retorno */
      const yN = linY(-2)[0] - RUA / 2, yS = linY(10)[1] + RUA;
      const [xa, ya] = p[n - 2], [xb, yb] = p[n - 1];
      const s = (yS - ya) / (yb - ya);
      p[n - 1] = [xa + (xb - xa) * s, yS];
      p.unshift([p[0][0], yN]);
    }
    avenidas.push({ id: a.id, l: a.l, pontos: p });
  }
  const distSeg = (x, y, [ax, ay], [bx, by]) => {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
    return Math.hypot(x - ax - t * dx, y - ay - t * dy);
  };
  const distAvenida = (x, y, a) => { let d = Infinity; for (let k = 1; k < a.pontos.length; k++) d = Math.min(d, distSeg(x, y, a.pontos[k - 1], a.pontos[k])); return d; };
  const naAvenida = (x, y, m = 0) => avenidas.some(a => distAvenida(x, y, a) < a.l / 2 + m);

  /* ---- as favelas: a de hoje transladada pro noroeste, e girada de meia volta pro sudoeste ---- */
  const cantos = l => K.cantosDoLote(l).slice(0, 4);
  const bbOf = pts => ({ x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])),
                         y0: Math.min(...pts.map(p => p[1])), y1: Math.max(...pts.map(p => p[1])) });
  const FAV = K.BEIRA.filter(l => l.favela);
  const favBB = bbOf(FAV.flatMap(cantos));
  const fcx = (favBB.x0 + favBB.x1) / 2, fcy = (favBB.y0 + favBB.y1) / 2;
  const fw = favBB.x1 - favBB.x0, fh = favBB.y1 - favBB.y0;
  const xLeste = colX(-3)[0] - MARGEM - 8;                               // as duas encostam na coluna −3
  const alvos = [
    { id: 'noroeste', nome: 'Favela do Noroeste', gira: false, cx: xLeste - fw / 2, cy: linY(2)[0] - 96 - fh / 2 },
    { id: 'sudoeste', nome: 'Favela do Sudoeste', gira: true,  cx: xLeste - fw / 2, cy: linY(10)[1] + 78 - fh / 2 }
  ];
  const noFav = (x, y) => x > favBB.x0 - 60 && x < favBB.x1 + 60 && y > favBB.y0 - 60 && y < favBB.y1 + 60;
  const favelas = alvos.map(al => {
    const T = al.gira ? (x, y) => [al.cx + fcx - x, al.cy + fcy - y] : (x, y) => [x + al.cx - fcx, y + al.cy - fcy];
    const lotes = FAV.map(l => {
      const [cx, cy] = T(l.cx, l.cy);
      const c = { ...l, cx, cy, ang: al.gira ? l.ang + Math.PI : l.ang, copia: al.id };
      delete c._plano;
      return c;
    });
    const becos = (K.FAVELA_RUAS || []).map(r => r.map(([x, y]) => T(x, y)));
    /* a avenida noroeste2 atravessava a favela de hoje: no desenho
       copiado, o vão dela vira a rua principal da favela */
    const n2 = av('noroeste2').pontos, rua = [];
    for (let k = 0; k <= 40; k++) {
      const s = k / 40, seg = Math.min(n2.length - 2, Math.floor(s * (n2.length - 1))), f = s * (n2.length - 1) - seg;
      const [ax, ay] = n2[seg], [bx, by] = n2[seg + 1], x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
      if (noFav(x, y)) rua.push(T(x, y));
    }
    const caixas = (K.FAVELA_CAIXAS || []).map(c => { const [x, y] = T(c.x, c.y); return { ...c, x, y }; });
    const arvores = K.ARVORES.filter(a => noFav(a.x, a.y)).map(a => { const [x, y] = T(a.x, a.y); return { ...a, x, y }; });
    const moitas = K.MOITAS.filter(m => noFav(m.x, m.y)).map(m => { const [x, y] = T(m.x, m.y); return { ...m, x, y }; });
    const bb = { x0: al.cx - fw / 2, x1: al.cx + fw / 2, y0: al.cy - fh / 2, y1: al.cy + fh / 2 };
    return { id: al.id, nome: al.nome, gira: al.gira, lotes, becos, rua: rua.length > 1 ? rua : null, caixas, arvores, moitas, bb };
  });

  /* ---- o atacarejo, na estrada norte: de frente pra estrada, antes do pórtico ---- */
  const A0 = K.ATACADEX;
  let atacadex = null;
  if (A0) {
    const norte = av('norte'), xN = norte.pontos[0][0];
    const zP = 20;                                                        // o estacionamento: 20 m até a guia
    const W = A0.W, D = A0.D;
    const f = { x0: xN + norte.l / 2 + CALC + 30 + zP * M, y0: -2560 };
    f.x1 = f.x0 + D * M; f.y1 = f.y0 + W * M;
    /* a borda do estacionamento agora é reta: as vagas, o totem e os
       postes da guia são refeitos com a mesma conta da planta */
    const m0 = A0.massa;
    const massa = { ...m0, norte: [[0, zP], [W, zP]], zNorte: () => zP };
    massa.vagas = [];
    for (const [z0, z1] of [[2.2, 7.2], [13.0, 18.0]])
      for (let x = m0.E0 + 0.4; x + 2.5 <= m0.E1 - 0.4 + 1e-6; x += 2.5) {
        if (x < m0.faixa.x1 && x + 2.5 > m0.faixa.x0) continue;
        if (zP < z1 + 0.6) continue;
        massa.vagas.push({ x0: x, x1: x + 2.5, z0, z1 });
      }
    massa.totem = { ...m0.totem, z: zP - 1.3 };
    massa.postes = m0.postes.map(p => ({ x: p.x, z: zP - 0.6 }));
    const tt = massa.totem;
    massa.volumes = m0.volumes.slice(0, -1).concat([{ x0: tt.x - tt.larg / 2, x1: tt.x + tt.larg / 2, z0: tt.z - tt.esp / 2, z1: tt.z + tt.esp / 2, alt: tt.alt }]);
    const noMundo = (lx, lz) => [f.x0 - lz * M, f.y0 + lx * M];         // o referencial do marco, frente pro oeste
    const volumes = massa.volumes.map(v => {
      const [ax, ay] = noMundo(v.x0, v.z0), [bx, by] = noMundo(v.x1, v.z1);
      return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), y0: Math.min(ay, by), y1: Math.max(ay, by), alt: v.alt * M, base: (v.base || 0) * M };
    });
    const area = [[f.x0 - zP * M, f.y0], [f.x1, f.y0], [f.x1, f.y1], [f.x0 - zP * M, f.y1]];
    atacadex = { pc: { ...A0, frente: 'o', fatia: f, massa, area, volumes }, area, volumes, bb: bbOf(area) };
  }

  /* ---- os pórticos: onde a estrada cruza a borda da cidade ---- */
  const porticos = [];
  {
    const n = av('norte'), xN = n.pontos[0][0];
    porticos.push({ id: 'norte', nome: 'Pórtico da entrada norte', x: xN, y: linY(-2)[0] - RUA - 88, dir: [0, 1], l: n.l });
    const s = avenidas.find(a => a.id === 'sudoeste').pontos, [ax, ay] = s[0], [bx, by] = s[1];
    const yP = linY(10)[1] + RUA + 84, t = (yP - ay) / (by - ay);
    const L = Math.hypot(bx - ax, by - ay);
    porticos.push({ id: 'sul', nome: 'Pórtico da entrada sul', x: ax + (bx - ax) * t, y: yP, dir: [(bx - ax) / L, (by - ay) / L], l: av('sudoeste').l });
  }

  /* ---- as células ---- */
  const celulas = [];
  const nova = (i, j, x0, x1, y0, y1, parte) => celulas.push({ i, j, x0, x1, y0, y1, parte: parte || '' });
  const xn = av('norte').pontos[0][0], ln = av('norte').l;
  const noEstadio2 = (i, j) => i >= ESTADIO2.i[0] && i <= ESTADIO2.i[1] && j >= ESTADIO2.j[0] && j <= ESTADIO2.j[1];
  for (const [ci, faixas] of Object.entries(GRADE)) {
    const i = +ci;
    for (const [ja, jb] of faixas) for (let j = ja; j <= jb; j++) {
      if (noEstadio2(i, j)) continue;
      const [x0, x1] = colX(i), [y0, y1] = linY(j);
      /* a avenida norte sobe reta pelo meio da coluna do estádio e parte a quadra em duas */
      if (xn > x0 && xn < x1) { nova(i, j, x0, xn - ln / 2, y0, y1, 'o'); nova(i, j, xn + ln / 2, x1, y0, y1, 'l'); }
      else nova(i, j, x0, x1, y0, y1);
    }
  }
  /* a quadra do estádio 2 */
  const e2 = { x0: colX(ESTADIO2.i[0])[0], x1: colX(ESTADIO2.i[1])[1], y0: linY(ESTADIO2.j[0])[0], y1: linY(ESTADIO2.j[1])[1] };
  const estadio2 = {
    dx: (e2.x0 + e2.x1) / 2 - (P.QEST_X0 + P.QEST_X1) / 2,
    dy: (e2.y0 + e2.y1) / 2 - (P.QEST_Y0 + P.QEST_Y1) / 2,
    nome: 'Estádio Municipal'
  };
  estadio2.qest = { x0: P.QEST_X0 + estadio2.dx, x1: P.QEST_X1 + estadio2.dx, y0: P.QEST_Y0 + estadio2.dy, y1: P.QEST_Y1 + estadio2.dy };

  const quadras = [], fora = [];
  for (const c of celulas) {
    const id = c.i + ',' + c.j + c.parte;
    /* nada de quadra debaixo de favela, do atacarejo ou da estrada fora da cidade */
    const f = favelas.find(fv => cruza(c, fv.bb, MARGEM));
    if (f) { fora.push({ ...c, id, motivo: f.nome }); continue; }
    if (atacadex && cruza(c, atacadex.bb, MARGEM)) { fora.push({ ...c, id, motivo: 'atacadex' }); continue; }
    c.id = id;
    c.ix0 = c.x0 + CALC; c.ix1 = c.x1 - CALC; c.iy0 = c.y0 + CALC; c.iy1 = c.y1 - CALC;
    c.equip = EQUIP[c.i + ',' + c.j] && !c.parte ? { ...EQUIP[c.i + ',' + c.j] } : null;
    c.lotes = [];
    quadras.push(c);
  }
  quadras.push({ i: -2, j: 8, parte: '', id: 'estadio2', ...e2, ix0: e2.x0 + CALC, ix1: e2.x1 - CALC, iy0: e2.y0 + CALC, iy1: e2.y1 - CALC,
                 lotes: [], equip: { tipo: 'estadio', nome: estadio2.nome, cor: '#9d9a90',
                                     nota: 'Cópia do quarteirão do estádio, com a esplanada em volta: o estádio de outro clube da cidade.' } });

  /* ---- os condomínios: o par de prédios na ponta oeste da quadra alta ---- */
  const baldio = K.QUADRAS.find(q => q.equip && q.equip.pecas.some(p => p.k === 'modelo' && p.modelo === 'torre1'));
  const torres0 = baldio ? baldio.equip.pecas.filter(p => p.k === 'modelo' && /^torre/.test(p.modelo)) : [];
  const volumesDaFatia = (vs, f) => (vs || []).filter(v => v.x0 >= f.x0 - 1 && v.x1 <= f.x1 + 1 && v.y0 >= f.y0 - 1 && v.y1 <= f.y1 + 1);
  const condominios = [];
  for (const cd of CONDOMINIOS) {
    const q = quadras.find(q => q.id === cd.id);
    if (!q || torres0.length < 2) continue;
    const L = 380, meio = q.iy0 + (q.iy1 - q.iy0) / 2;
    const torres = torres0.map(pc => {
      const f = { x0: q.ix0, x1: q.ix0 + L, y0: pc.modelo === 'torre1' ? q.iy0 : meio, y1: pc.modelo === 'torre1' ? meio : q.iy1 };
      const dx = f.x0 - pc.fatia.x0, dy = f.y0 - pc.fatia.y0;
      const volumes = volumesDaFatia(baldio.equip.volumes, pc.fatia).map(v => ({ ...v, x0: v.x0 + dx, x1: v.x1 + dx, y0: v.y0 + dy, y1: v.y1 + dy }));
      return { ...pc, fatia: f, folha: cd.folha, nome: pc.modelo === 'torre1' ? cd.t1 : cd.t2, volumes, condominio: cd.id };
    });
    q.equip = { tipo: 'condominio', nome: 'Condomínio ' + cd.t1.replace('Edifício ', ''), cor: '#b5afa0', torres, cores: cd.cores,
                nota: `${cd.t1} e ${cd.t2}: os mesmos dois prédios do baldio, em ${cd.cores}.` };
    q.faixaLotes = { x0: q.ix1 - 112, x1: q.ix1, y0: q.iy0, y1: q.iy1 };  // a fileira de casas do outro lado
    q.jardim = { x0: q.ix0 + L, x1: q.ix1 - 112, y0: q.iy0, y1: q.iy1 };
    condominios.push({ q, torres, ...cd });
  }

  /* ---- os lotes: a conta do `lotear()`, com hash no lugar do sorteio ---- */
  const tocaAvenida = l => {
    const xs = [l.x0, (l.x0 + l.x1) / 2, l.x1], ys = [l.y0, (l.y0 + l.y1) / 2, l.y1];
    for (const x of xs) for (const y of ys) if (naAvenida(x, y, CALC + 4)) return true;
    return false;
  };
  const noEstadio = l => (l.x1 > P.QEST_X0 && l.x0 < P.QEST_X1 && l.y1 > P.QEST_Y0 && l.y0 < P.QEST_Y1) || cruza(l, estadio2.qest, 0);
  const perto = q => q.j <= 0 && q.i >= 3;                      // o norte perto do estádio: mais denso
  const LISTA_NORTE = ['casa', 'sobrado', 'sobrado', 'predio', 'galpao', 'casa', 'sobrado', 'muro'];
  const LISTA_OESTE = ['casa', 'casa', 'casa', 'casa', 'sobrado', 'sobrado', 'muro', 'galpao'];
  const lotear = (q, frentes, prof) => {
    frentes.forEach((fr, fi) => {
      const hz = fr.f === 'n' || fr.f === 's';
      const a0 = hz ? fr.x0 : fr.y0, a1 = hz ? fr.x1 : fr.y1;
      if (a1 - a0 < 40) return;
      let a = a0, k = 0;
      while (a < a1 - 24) {
        let larg = par8(entre(72, 144, q.i, q.j, fi, k, 2));
        if (a + larg > a1 - 36) larg = a1 - a;
        const lista = perto(q) ? LISTA_NORTE : LISTA_OESTE;
        const tipo = lista[Math.floor(sorte(q.i, q.j, fi, k, 3) * lista.length)];
        const T = TIPOS[tipo];
        const l = { frente: fr.f, tipo, proposta: true,
                    x0: hz ? a : fr.x0, x1: hz ? a + larg : fr.x1,
                    y0: hz ? fr.y0 : a, y1: hz ? fr.y1 : a + larg,
                    alt: par8(entre(T.alt[0], T.alt[1], q.i, q.j, fi, k, 4)) || T.alt[0],
                    cor: T.cor[hash(q.i, q.j, fi, k, 5) % T.cor.length],
                    quadra: { i: q.i, j: q.j, proposta: true } };
        a += larg; k++;
        if (tocaAvenida(l) || noEstadio(l)) continue;
        /* o comércio e o recado na parede, na mesma proporção da cidade */
        if (tipo !== 'muro') {
          const r = sorte(q.i, q.j, fi, k, 6);
          if (r < 0.26) l.placa = COMERCIO[hash(q.i, q.j, fi, k, 7) % COMERCIO.length];
          else if (r < 0.46) l.pixacao = RECADOS[hash(q.i, q.j, fi, k, 8) % RECADOS.length];
        } else if (sorte(q.i, q.j, fi, k, 9) < 0.5) l.pixacao = RECADOS[hash(q.i, q.j, fi, k, 8) % RECADOS.length];
        /* uma casa em oito vira casa de muro, se couber o modelo */
        if (tipo === 'casa' && !l.placa && sorte(q.i, q.j, fi, k, 10) < 0.125) {
          const nS = l.frente === 'n' || l.frente === 's';
          const w = (nS ? l.x1 - l.x0 : l.y1 - l.y0) / M, d = (nS ? l.y1 - l.y0 : l.x1 - l.x0) / M;
          const m = ['m1', 'm2', 'm3', 'm4'][hash(q.i, q.j, fi, k, 11) % 4];
          if (w >= MIN_MURO[m][0] && d >= MIN_MURO[m][1]) l.muro = m;
        }
        q.lotes.push(l);
      }
    });
  };
  for (const q of quadras) {
    if (q.equip && q.equip.tipo === 'condominio') {
      const r = q.faixaLotes;
      lotear(q, [{ f: 'l', x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 }]);
      continue;
    }
    if (q.equip) continue;
    const largI = q.ix1 - q.ix0, altI = q.iy1 - q.iy0;
    if (largI < 40 || altI < 40) continue;
    let prof = par8(entre(88, 112, q.i, q.j, 1));
    const raso = altI < 2 * prof + 24 || largI < 2 * prof + 24;
    if (raso) prof = Math.min(altI, largI);
    const frentes = raso
      ? (largI >= altI ? [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 }]
                       : [{ f: 'o', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 }])
      : [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy0 + prof },
         { f: 's', x0: q.ix0, x1: q.ix1, y0: q.iy1 - prof, y1: q.iy1 },
         { f: 'o', x0: q.ix0, x1: q.ix0 + prof, y0: q.iy0 + prof, y1: q.iy1 - prof },
         { f: 'l', x0: q.ix1 - prof, x1: q.ix1, y0: q.iy0 + prof, y1: q.iy1 - prof }];
    lotear(q, frentes);
    if (!raso) q.quintal = { x0: q.ix0 + prof, x1: q.ix1 - prof, y0: q.iy0 + prof, y1: q.iy1 - prof };
    /* a avenida que atravessa a quadra na diagonal pode não deixar lote
       nenhum: a sobra vira praça, como já é no centro */
    if (q.lotes.length < 3) {
      q.lotes = []; q.quintal = null;
      q.equip = { tipo: 'praca', nome: 'Praça', cor: '#5f9a4c', nota: 'A avenida corta a quadra na diagonal e não sobra lote: a sobra vira praça.' };
    }
  }

  /* ---- o que a proposta cobre (pra esconder o mato, a beira e a favela de hoje) ---- */
  const coberto = (x, y, folga = RUA / 2) => quadras.some(q => x > q.x0 - folga && x < q.x1 + folga && y > q.y0 - folga && y < q.y1 + folga);
  const naFavelaNova = (x, y, m = 0) => favelas.some(f => x > f.bb.x0 - m && x < f.bb.x1 + m && y > f.bb.y0 - m && y < f.bb.y1 + m);
  const noAtacadex = (x, y, m = 0) => !!atacadex && x > atacadex.bb.x0 - m && x < atacadex.bb.x1 + m && y > atacadex.bb.y0 - m && y < atacadex.bb.y1 + m;

  const residenciais = quadras.filter(q => !q.equip);
  const lotesNovos = quadras.reduce((n, q) => n + q.lotes.length, 0);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const q of quadras) { x0 = Math.min(x0, q.x0); y0 = Math.min(y0, q.y0); x1 = Math.max(x1, q.x1); y1 = Math.max(y1, q.y1); }
  for (const f of favelas) { x0 = Math.min(x0, f.bb.x0); y0 = Math.min(y0, f.bb.y0); y1 = Math.max(y1, f.bb.y1); }
  const conta = {};
  for (const q of quadras) if (q.equip) conta[q.equip.tipo] = (conta[q.equip.tipo] || 0) + 1;
  return {
    quadras, fora, avenidas, favelas, atacadex, porticos, estadio2, condominios,
    coberto, naFavelaNova, noAtacadex, naAvenida, distAvenida, favelaDeHoje: favBB,
    contagem: { quadras: quadras.length, residenciais: residenciais.length, equipamentos: quadras.length - residenciais.length,
                porTipo: conta, lotesNovos, casasFavela: FAV.length,
                quadrasHoje: K.QUADRAS.length, lotesHoje: K.QUADRAS.reduce((n, q) => n + q.lotes.length, 0) },
    limite: { x0: x0 - RUA, y0: y0 - RUA, x1, y1 },
    mundo: { x0: x0 - 420, y0: -2750, x1: K.VX0 + K.VW, y1: 6100 }
  };
}
