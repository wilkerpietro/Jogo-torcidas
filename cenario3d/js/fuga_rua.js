/* =========================================================
   A FUGA NO MEIO DA RUA (o jogo 3D, 06/10/2026)

   O dono: "ajuste os pontos de fuga pra serem somente no meio da rua, se
   inspirando na forma que executei isso no jogo 2d". No jogo de feed cada
   cena aberta traz as saídas marcadas no eixo de cada rua, onde ela cruza
   a borda da foto (`RUA`, dados/cenas.js, 30/09/2026). As cenas 3D da
   cidade não declaravam `fugas`, e o motor lia as bocas da própria máscara
   (arredores.js, `acharFugas`): toda corrida de chão na borda da mancha —
   a calçada partida por um poste, o recuo de uma garagem, o vão entre o
   carro parado e o meio-fio — virava saída, e o bonde sumia na calçada.

   Aqui as saídas saem do ASFALTO da planta. Numa linha a 20 px de cada
   borda do tabuleiro (a distância das do jogo de feed), cada trecho
   contínuo de asfalto é uma rua saindo da cena, e o meio do trecho é o
   eixo dela — o meio da faixa de asfalto, mesmo com a rua cruzando torta.
   O trecho que encosta no canto continua sendo lido fora do tabuleiro (a
   cidade segue além dele), pra rua cortada pelo canto não ter o meio
   puxado pra dentro. O trecho comprido demais é a rua que corre AO LONGO
   da borda: ela sai pelas outras duas bordas, onde é achada, e as ruas
   que desembocam nela vindo de dentro viram saída no eixo delas, na borda
   (a esquina da foto 2D da rua, com a transversal saindo em cima e
   embaixo). O ponto tem de ser chão da cena (a máscara, só o pedaço ligado
   a quem briga): rua que não leva a ninguém fica de fora.
   ========================================================= */
export const BORDA_DA_FUGA = 20;        // px da borda (as do jogo de feed: 20 px)
export const RAIO_DA_FUGA = 34;         // o raio delas no jogo de feed

/* `B`: o tabuleiro { noMundo(x, y) → [wx, wz], malha, COLS, ROWS, pxm (px
   por metro), W, H, CEL }; `ehAsfalto(wx, wz)`: o asfalto da planta.
   Devolve [{ x, y, raio }] (vazio sem rua nenhuma: a cena fica com a
   leitura da máscara) */
export function fugasNaRua(B, ehAsfalto, opc = {}) {
  if (!B || !ehAsfalto) return [];
  const W = B.W || 1536, H = B.H || 1024, CEL = B.CEL || 8, pxm = B.pxm;
  const COLS = B.COLS, ROWS = B.ROWS, malha = B.malha;
  const BD = opc.borda || BORDA_DA_FUGA, passo = 4;
  const minimo = (opc.min || 2.5) * pxm, maximo = (opc.max || 18) * pxm;
  const asf = (x, y) => { const [wx, wz] = B.noMundo(x, y); return ehAsfalto(wx, wz); };
  const livre = (x, y) => { const i = Math.floor(x / CEL), j = Math.floor(y / CEL); return i >= 0 && j >= 0 && i < COLS && j < ROWS && malha[j * COLS + i] === 1; };
  /* o corpo (9 px, o teste do motor) cabe em volta do ponto */
  const cabe = (x, y) => livre(x, y) && livre(x + 9, y) && livre(x - 9, y) && livre(x, y + 9) && livre(x, y - 9);
  /* as quatro linhas: o ponto da linha em t (px ao longo dela) e d (px pra dentro) */
  const lados = [
    { n: W, p: (t, d = 0) => [t, BD + d] },
    { n: W, p: (t, d = 0) => [t, H - BD - d] },
    { n: H, p: (t, d = 0) => [BD + d, t] },
    { n: H, p: (t, d = 0) => [W - BD - d, t] }
  ];
  /* o chão da cena mais perto do eixo (t), na própria linha dentro do
     trecho [a, b] ou até 40 px pra dentro — e sempre em cima do asfalto: o
     carro parado no meio da rua empurra o ponto, não apaga a saída, e a
     calçada do lado nunca vira saída */
  const noChao = (L, t, a, b) => {
    for (let k = 0; k <= 48; k++) {
      const dt = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * passo, tt = t + dt;
      if (tt < Math.max(a, BD) || tt > Math.min(b, L.n - BD)) continue;
      for (const d of [0, 8, 16, 24, 32, 40]) { const [x, y] = L.p(tt, d); if (cabe(x, y) && asf(x, y)) return [x, y]; }
    }
    return null;
  };
  const achados = [];
  for (const L of lados) {
    /* as corridas de asfalto na linha, lida além das pontas (até `maximo`) */
    const corridas = [];
    let ini = null;
    for (let t = -maximo; t <= L.n + maximo + passo; t += passo) {
      const tem = t <= L.n + maximo && asf(...L.p(t));
      if (tem && ini === null) ini = t;
      else if (!tem && ini !== null) { corridas.push([ini, t - passo]); ini = null; }
    }
    for (const [a, b] of corridas) {
      if (b < 0 || a > L.n) continue;                         // fora do tabuleiro
      const comp = b - a + passo;
      if (comp < minimo) continue;
      if (comp <= maximo) {
        /* A RUA QUE SAI: o meio do trecho; com o meio fora da cena (a rua
           quase toda além do canto, só a beira dela aparecendo), não é
           saída desta borda */
        const meio = (a + b) / 2;
        if (meio < BD - 0.6 * pxm || meio > L.n - BD + 0.6 * pxm) continue;
        const q = noChao(L, Math.min(L.n - BD, Math.max(BD, meio)), a, b);
        if (q) achados.push({ q, meio: true });
        continue;
      }
      /* A RUA AO LONGO DA BORDA: a funda é a rua de dentro que desemboca
         nela — a profundidade de asfalto pra dentro passa da largura dela */
      const fundo = [];
      const cap = Math.min(30 * pxm, (L === lados[0] || L === lados[1] ? H : W) / 2);
      for (let t = Math.max(a, BD); t <= Math.min(b, L.n - BD); t += 8) {
        let d = 0;
        while (d < cap && asf(...L.p(t, d))) d += 0.35 * pxm;
        fundo.push([t, d]);
      }
      if (!fundo.length) continue;
      /* a largura da rua da borda: a profundidade mais comum (a mediana) */
      const ds = fundo.map(f => f[1]).sort((p, q) => p - q), larg = ds[Math.floor(ds.length / 2)];
      let ia = null;
      for (let k = 0; k <= fundo.length; k++) {
        const funda = k < fundo.length && fundo[k][1] > larg + 3 * pxm;
        if (funda && ia === null) ia = k;
        else if (!funda && ia !== null) {
          const t0 = fundo[ia][0], t1 = fundo[k - 1][0];
          ia = null;
          if (t1 - t0 + 8 < minimo) continue;
          const q = noChao(L, (t0 + t1) / 2, t0, t1);
          if (q) achados.push({ q, meio: false });
        }
      }
    }
  }
  /* a mesma rua achada por duas bordas (a do canto): fica a do meio de verdade */
  achados.sort((p, q) => (q.meio ? 1 : 0) - (p.meio ? 1 : 0));
  const fugas = [];
  for (const { q } of achados) {
    if (fugas.some(f => Math.hypot(f.x - q[0], f.y - q[1]) < 3 * pxm)) continue;
    fugas.push({ x: Math.round(q[0]), y: Math.round(q[1]), raio: RAIO_DA_FUGA });
  }
  return fugas;
}

/* AS FUGAS NOS EIXOS (o beco, a viela da favela): cada eixo é uma linha
   (px do tabuleiro) pelo meio do beco; a fuga é onde ele sai da cena — a
   `BORDA` da borda do tabuleiro ou, com o chão acabando antes (o beco
   curto, a viela que deixa de ter casa do lado), a ponta do chão em cima
   do eixo. Devolve [{ x, y, raio }] */
export function fugasNosEixos(B, eixos, opc = {}) {
  const W = B.W || 1536, H = B.H || 1024, CEL = B.CEL || 8, COLS = B.COLS, ROWS = B.ROWS, malha = B.malha, BD = BORDA_DA_FUGA;
  const livre = (x, y) => { const i = Math.floor(x / CEL), j = Math.floor(y / CEL); return i >= 0 && j >= 0 && i < COLS && j < ROWS && malha[j * COLS + i] === 1; };
  const cabe = (x, y) => livre(x, y) && livre(x + 9, y) && livre(x - 9, y) && livre(x, y + 9) && livre(x, y - 9);
  const naCena = (x, y) => x >= BD && y >= BD && x <= W - BD && y <= H - BD;
  const achados = [];
  for (const pts of eixos || []) {
    if (!pts || pts.length < 2) continue;
    /* o eixo amostrado de 4 em 4 px */
    const am = [];
    for (let k = 0; k + 1 < pts.length; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 4));
      for (let m = k ? 1 : 0; m <= n; m++) am.push([ax + (bx - ax) * m / n, ay + (by - ay) * m / n]);
    }
    /* cada trecho dentro da cena: as duas pontas, andando pra dentro pelo
       eixo até o chão. A ponta que é a borda da cena é saída; a ponta do
       próprio eixo dentro da cena só é quando fica na PONTA DA CENA (a até
       60 px da borda, a régua das entradas do jogo de feed: o beco que
       acaba no meio do cenário, na rua do bar ou no nada, não é por onde
       se some) e `pontaVale` diz (o cruzamento com outra viela e a boca do
       campinho não são saída) */
    let ini = -1;
    for (let k = 0; k <= am.length; k++) {
      const tem = k < am.length && naCena(am[k][0], am[k][1]);
      if (tem && ini < 0) { ini = k; continue; }
      if (tem || ini < 0) continue;
      const fim = k - 1, meio = (ini + fim) / 2;
      for (const [e, s] of [[ini, 1], [fim, -1]]) {
        const naBorda = s > 0 ? e > 0 : e < am.length - 1, [ex, ey] = am[e];
        if (!naBorda && (Math.min(ex, ey, W - ex, H - ey) > 60 || (opc.pontaVale && !opc.pontaVale(ex, ey)))) continue;
        for (let q = e; s > 0 ? q <= meio : q >= meio; q += s) if (cabe(am[q][0], am[q][1])) { achados.push(am[q]); break; }
      }
      ini = -1;
    }
  }
  const fugas = [];
  for (const q of achados) {
    if (fugas.some(f => Math.hypot(f.x - q[0], f.y - q[1]) < 60)) continue;
    fugas.push({ x: Math.round(q[0]), y: Math.round(q[1]), raio: RAIO_DA_FUGA });
  }
  return fugas;
}

/* A PONTA DE VIELA QUE É SAÍDA: a que não cai em outra viela (o
   cruzamento não é saída) nem onde `fora(wx, wz)` diz (a boca do
   campinho). `vielas`: [{ a, z, w }] no mundo (o eixo reto e a largura) */
export function pontaSemCruzamento(vielas, noMundo, M, fora) {
  const distSeg = (x, z, a, b) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
    return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
  };
  return (x, y) => {
    const [wx, wz] = noMundo(x, y);
    if (fora && fora(wx, wz)) return false;
    /* (a própria viela sempre conta: a ponta está no eixo dela) */
    return vielas.filter(b => distSeg(wx, wz, b.a, b.z) < b.w / 2 + 1 * M).length < 2;
  };
}
