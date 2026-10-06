/* =========================================================
   A TRETA MARCADA NA FAVELA (o jogo 3D, 29/09/2026)

   O dono: "Algumas cenas como bote no bar e briga marcada apostada ainda
   não funcionam no 3d. [...] Aplique os detalhes da treta marcada também".

   A treta marcada do jogo de feed (feed.js, o calendário do trimestre; a
   LNT) é briga combinada: os dois bondes com o MESMO efetivo (5, 7 ou 10
   de cada lado), linha de frente primeiro, sem pedra, sem bomba e sem
   braço automático, os dois lados já dispostos (main.js, `abrirTreta`), e
   a aposta na roda (acoes.js, `fecharTreta`). Na foto cada tamanho tinha o
   seu palco: o 5×5 no beco, o 7×7 no pátio murado do galpão e o 10×10 no
   campo de terra. No mapa 3D a praça não tem bairro com nome nem pátio de
   galpão, e o chão que serve pra briga combinada é o da favela, que toda
   praça tem:
   - o 5×5 é num BECO da favela (a viela entre as casas, de ponta a ponta):
     cada bonde entra por uma boca e a saída de cada um é a boca do outro;
   - o 7×7 e o 10×10 são no CAMPINHO DE TERRA da favela, cada bonde num gol
     e a saída de cada um no canto do lado do outro — furar pra fora.
   Qual beco e qual campinho: sorteio fixo pela treta (o bairro e o rival),
   entre os becos compridos e os campinhos da praça.

   O tabuleiro (1536 × 1024 px) é um retângulo da cidade na escala da
   caminhada (1 px = √0,3 unidade: 43 × 29 m), com o x ao longo do beco (ou
   do campinho). A máscara é a grade do passo do cenário (onde o corpo
   cabe) dentro do beco (a meia largura dele) ou do campinho (e a volta
   dele, até o muro das casas) — só o que se alcança andando de quem briga.
   ========================================================= */
import { fugasNosEixos, pontaSemCruzamento } from './fuga_rua.js?v=399d7ad099';

const TAB = { W: 1536, H: 1024, CEL: 8 };
const ESCALA = Math.sqrt(0.3);          // unidade de mundo por px (a mesma da caminhada)
const hashTxt = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };

/* o palco de cada tamanho (o id da cena do jogo de feed) */
export const LUGAR_DA_TRETA = { 'treta-beco': 'beco', 'treta-galpao': 'campinho', 'treta-campo': 'campinho' };

/* `local`: 'treta-beco' | 'treta-galpao' | 'treta-campo'; `o`: { chave (o
   sorteio do lugar) }. Devolve { cena, noMundo, doMundo, u, v, chao,
   escala, lugar, ... } ou { erro } */
export function brigaNaTreta(ctx, local, o = {}) {
  const M = ctx.M, P = ctx.P, g = ctx.grade;
  const tipo = LUGAR_DA_TRETA[local];
  if (!tipo) return { erro: 'treta sem palco: ' + local };
  if (!g) return { erro: 'a praça não tem a grade do passo' };
  const favelas = P && P.favelas ? P.favelas() : [];
  const K = ESCALA, pxm = M / K, h = hashTxt(o.chave || local);

  /* O LUGAR: o trecho reto (o eixo `u`, o meio, o comprimento e a meia
     largura, em unidades do mundo) e o teste de "é dele" */
  let L = null;
  if (tipo === 'beco') {
    /* os becos da praça com 20 m ou mais, os mais compridos primeiro */
    const becos = [];
    for (const f of favelas) for (const b of f.becos || []) {
      const a = b.pts[0], z = b.pts[b.pts.length - 1], comp = Math.hypot(z[0] - a[0], z[1] - a[1]);
      if (comp >= 20 * M) becos.push({ f, a, z, comp, w: b.w });
    }
    becos.sort((p, q) => q.comp - p.comp);
    const top = becos.slice(0, 8);
    if (!top.length) return { erro: 'a praça não tem beco comprido' };
    /* (o beco inteiro não cabe no tabuleiro: o trecho do meio dele, de até 40 m) */
    const b = top[h % top.length], ux = (b.z[0] - b.a[0]) / b.comp, uz = (b.z[1] - b.a[1]) / b.comp;
    const comp = Math.min(b.comp, 40 * M);
    L = { favela: b.f.nome, u: [ux, uz], c: [(b.a[0] + b.z[0]) / 2, (b.a[1] + b.z[1]) / 2], comp, meia: b.w / 2,
          /* (a meia largura do beco mais meio metro: o vão entre as casas, sem entrar no quintal de ninguém) */
          dele: (wx, wz) => { const dx = wx - L.c[0], dz = wz - L.c[1], s = dx * ux + dz * uz, t = -dx * uz + dz * ux; return Math.abs(s) <= comp / 2 && Math.abs(t) <= b.w / 2 + 0.5 * M; } };
  } else {
    const campos = favelas.filter(f => f.campinho);
    if (!campos.length) return { erro: 'a praça não tem campinho' };
    const f = campos[h % campos.length], c = f.campinho;
    const lx = c.x1 - c.x0, lz = c.y1 - c.y0, deitado = lx >= lz;
    /* AS VIELAS DO CAMPINHO (o dono, 06/10/2026: a fuga "somente no meio
       da rua"): o campinho fica no canto do quarteirão, com a viela do
       lado e a de cima correndo rente a ele — elas entram na cena, e a
       fuga é o eixo delas onde saem dela. (O beco que passa a até 2 m da
       beira do campinho, o eixo reto da primeira à última amostra) */
    const naBeira = (x, z) => Math.hypot(Math.max(c.x0 - x, 0, x - c.x1), Math.max(c.y0 - z, 0, z - c.y1));
    const distSeg = (x, z, a, b) => {
      const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
      return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
    };
    const vielas = (f.becos || []).map(b => ({ a: b.pts[0], z: b.pts[b.pts.length - 1], w: b.w })).filter(b => {
      const n = Math.max(1, Math.ceil(Math.hypot(b.z[0] - b.a[0], b.z[1] - b.a[1]) / (0.5 * M)));
      for (let k = 0; k <= n; k++) if (naBeira(b.a[0] + (b.z[0] - b.a[0]) * k / n, b.a[1] + (b.z[1] - b.a[1]) * k / n) <= b.w / 2 + 2 * M) return true;
      return false;
    });
    L = { favela: f.nome, u: deitado ? [1, 0] : [0, 1], c: [(c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2], comp: Math.max(lx, lz), meia: Math.min(lx, lz) / 2, campinho: c, vielas,
          /* (o campinho e a volta dele: a beira de terra até o muro das casas, 1,5 m; e as vielas dele, na meia largura mais meio metro) */
          dele: (wx, wz) => (wx >= c.x0 - 1.5 * M && wx <= c.x1 + 1.5 * M && wz >= c.y0 - 1.5 * M && wz <= c.y1 + 1.5 * M) ||
                            vielas.some(b => distSeg(wx, wz, b.a, b.z) <= b.w / 2 + 0.5 * M) };
  }
  /* O TABULEIRO: o x ao longo do lugar, o meio dele no meio do tabuleiro */
  const u = L.u, v = [-u[1], u[0]];
  const O = [L.c[0] - (TAB.W / 2 * u[0] + TAB.H / 2 * v[0]) * K, L.c[1] - (TAB.W / 2 * u[1] + TAB.H / 2 * v[1]) * K];
  const noMundo = (x, y) => [O[0] + (x * u[0] + y * v[0]) * K, O[1] + (x * u[1] + y * v[1]) * K];
  const doMundo = (wx, wz) => { const dx = wx - O[0], dz = wz - O[1]; return [(dx * u[0] + dz * u[1]) / K, (dx * v[0] + dz * v[1]) / K]; };
  const dentro = (x, y, m = 0) => x > m && y > m && x < TAB.W - m && y < TAB.H - m;

  /* A MÁSCARA: onde o corpo (12 cm) cabe na grade do passo, dentro do lugar */
  const COLS = TAB.W / TAB.CEL, ROWS = TAB.H / TAB.CEL, malha = new Uint8Array(COLS * ROWS);
  const r = 0.12 * M;
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const [wx, wz] = noMundo((i + 0.5) * TAB.CEL, (j + 0.5) * TAB.CEL);
    malha[j * COLS + i] = L.dele(wx, wz) && g.cabe(wx, wz, r) && !(ctx.noEstadio && ctx.noEstadio(wx, wz)) ? 1 : 0;
  }
  const livre = (x, y) => { const i = Math.floor(x / TAB.CEL), j = Math.floor(y / TAB.CEL); return i >= 0 && j >= 0 && i < COLS && j < ROWS && malha[j * COLS + i] === 1; };
  const soltar = (x, y, ate = 200) => {
    if (livre(x, y)) return [x, y];
    for (let rr = 6; rr < ate; rr += 6) for (let k = 0; k < 20; k++) {
      const a = k / 20 * 2 * Math.PI, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (dentro(px, py, 20) && livre(px, py)) return [px, py];
    }
    return null;
  };
  /* as duas pontas do lugar, no tabuleiro (o x), e o meio (o y) */
  const meioX = TAB.W / 2, meioY = TAB.H / 2, meiaPx = L.comp / 2 / K, larg = L.meia / K;
  const xa = Math.max(50, meioX - meiaPx + 24), xb = Math.min(TAB.W - 50, meioX + meiaPx - 24);
  if (xb - xa < 14 * pxm) return { erro: 'o lugar da treta é curto demais' };
  /* OS PONTOS: no beco, cada bonde perto de uma boca e a saída de cada um na
     boca do outro; no campinho, cada bonde num gol (um pouco pro lado, como
     na foto) e a saída no canto do lado do outro */
  const beco = tipo === 'beco', dy = beco ? 0 : Math.min(larg * 0.45, 2.2 * pxm);
  const pNos = soltar(xa + (beco ? 110 : 2.2 * pxm), meioY + dy), pDeles = soltar(xb - (beco ? 110 : 2.2 * pxm), meioY - dy);
  const pSaiNos = soltar(xb - (beco ? 26 : 0.9 * pxm), meioY + (beco ? 0 : larg * 0.7)), pSaiDeles = soltar(xa + (beco ? 26 : 0.9 * pxm), meioY - (beco ? 0 : larg * 0.7));
  if (!pNos || !pDeles || !pSaiNos || !pSaiDeles) return { erro: 'o lugar da treta não é andável (' + (L.favela || 'favela') + ')' };
  /* SÓ O CHÃO LIGADO A QUEM BRIGA; e os dois bondes têm de se alcançar */
  const n = COLS * ROWS, visto = new Uint8Array(n), fila = new Int32Array(n);
  {
    let ini = 0, fim = 0;
    const c0 = Math.floor(pNos[1] / TAB.CEL) * COLS + Math.floor(pNos[0] / TAB.CEL);
    visto[c0] = 1; fila[fim++] = c0;
    while (ini < fim) {
      const c = fila[ini++], i = c % COLS, j = (c - i) / COLS;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj, k = jj * COLS + ii;
        if (ii < 0 || jj < 0 || ii >= COLS || jj >= ROWS || visto[k] || !malha[k]) continue;
        visto[k] = 1; fila[fim++] = k;
      }
    }
    for (let k = 0; k < n; k++) if (!visto[k]) malha[k] = 0;
  }
  const alcanca = p => malha[Math.floor(p[1] / TAB.CEL) * COLS + Math.floor(p[0] / TAB.CEL)] === 1;
  if (![pDeles, pSaiNos, pSaiDeles].every(alcanca)) return { erro: 'os dois bondes não se alcançam no lugar da treta (' + (L.favela || 'favela') + ')' };
  const linhas = [];
  for (let j = 0; j < ROWS; j++) {
    const runs = []; let v0 = 0, k = 0;
    for (let i = 0; i < COLS; i++) { const v1 = malha[j * COLS + i]; if (v1 === v0) k++; else { runs.push(k); v0 = v1; k = 1; } }
    runs.push(k);
    linhas.push(runs.join(','));
  }
  const R = p => ({ x: Math.round(p[0]), y: Math.round(p[1]) });
  /* AS FUGAS NO MEIO DO BECO (fuga_rua.js): as duas pontas do eixo do beco;
     no campinho, o eixo das vielas dele onde elas saem da cena */
  const B = { malha, COLS, ROWS, W: TAB.W, H: TAB.H, CEL: TAB.CEL };
  /* (a ponta de viela dentro da cena só é saída quando é ponta aberta: não
     cai em outra viela da cena — o cruzamento — nem na beira do campinho) */
  const c0 = L.campinho;
  const naBocaDoCampinho = (wx, wz) => !!c0 && Math.hypot(Math.max(c0.x0 - wx, 0, wx - c0.x1), Math.max(c0.y0 - wz, 0, wz - c0.y1)) < 3 * M;
  const fugas = fugasNosEixos(B, beco ? [[[0, meioY], [TAB.W, meioY]]] : (L.vielas || []).map(b => [doMundo(b.a[0], b.a[1]), doMundo(b.z[0], b.z[1])]),
                              { pontaVale: pontaSemCruzamento(L.vielas || [], noMundo, M, naBocaDoCampinho) });
  const nomes = beco
    ? { nome: 'Beco', local: 'No beco da favela' + (L.favela ? ' ' + L.favela : '') + ', treta marcada', sai: ['FIM DO BECO', 'BOCA DO BECO'],
        saida: { perto: 'Furar pra fora', longe: 'Fim do beco (leve o líder)', feito: 'sua torcida furou pra fora do beco', dica: 'Leve o líder até a boca do beco do lado de lá.' } }
    : { nome: 'Campinho', local: 'No campinho de terra da favela' + (L.favela ? ' ' + L.favela : '') + ', treta marcada', sai: ['CANTO DE LÁ', 'CANTO DE CÁ'],
        saida: { perto: 'Furar pra fora', longe: 'Canto do campinho (leve o líder)', feito: 'sua torcida saiu do campinho por cima', dica: 'Leve o líder até o canto do campinho do lado deles.' } };
  const cena = {
    id: local + '@3d', base: local, tres: true, nome: nomes.nome, local: nomes.local,
    largura: TAB.W, altura: TAB.H, celula: TAB.CEL, imagem: null, mascara: linhas.join(';'),
    blocos: [], enfeites: [], varais: [], grades: [], pintura: null,
    saida: nomes.saida,
    spawns: [
      { id: 'mandante1', rot: 'NOSSO BONDE', lado: 'mandante', ...R(pNos), jogador: true, entrada: 'boca_leste' },
      { id: 'visitante1', rot: 'BONDE DELES', lado: 'visitante', ...R(pDeles), guarda: true, entrada: 'boca_oeste' }
    ],
    /* (a treta nasce acordada — main.js, `abrirTreta`; o gatilho fica pra cena solta) */
    gatilho: { lado: 'mandante', perto: 260, rot: 'DE OLHO', espera: 'eles ainda não se mexeram', aviso: 'eles viram o bonde e vieram' },
    entradas: [
      { id: 'boca_oeste', rot: nomes.sai[1], lado: 'visitante', ...R(pSaiDeles), raio: 46, dir: [-1, 0] },
      { id: 'boca_leste', rot: nomes.sai[0], lado: 'mandante', ...R(pSaiNos), raio: 46, dir: [1, 0] }
    ],
    /* a PM desce pelas duas pontas */
    pmPostos: [R(soltar(xa + 30, meioY) || pSaiDeles), R(soltar(xb - 30, meioY) || pSaiNos)],
    ...(fugas.length ? { fugas } : {})
  };
  const chao = (x, y) => { const [wx, wz] = noMundo(x, y); return (ctx.chaoDaRua ? ctx.chaoDaRua(wx, wz) : 0) / M; };
  return { cena, noMundo, doMundo, u, v, chao, escala: K, lugar: { tipo, favela: L.favela, c: L.c, comp: L.comp / M, larg: 2 * L.meia / M },
           malha, COLS, ROWS };
}
