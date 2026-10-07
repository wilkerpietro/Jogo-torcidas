/* =========================================================
   A BRIGA NO BAR (o jogo 3D, 29/09/2026)

   O dono: "Algumas cenas como bote no bar e briga marcada apostada ainda
   não funcionam no 3d. Veja os detalhes da Briga no bar conforme era no
   2d como quantos de cada lado, faixa ou bandeira estendida, perdedor se
   for o defensor o bar rende menos por um tempo, etc. a cena do bar
   sempre vai ser no respectivo bar da torcida atacada, no mapa do jogo."

   A cena 'bar' do jogo de feed (dados/cenas.js) sai da foto e cai no bar
   da torcida atacada, no mapa 3D: o bar de esquina embaixo do apartamento
   (casas3d.js, `barTorcida`), com as portas de enrolar levantadas. Os
   papéis são os da foto:
   - quem ataca desce a TRANSVERSAL (a rua do lado da esquina), em duas
     turmas (1º e 2º escalão), e o objetivo dele é o BALCÃO, lá dentro: com
     o salão andável, parar na porta seria tomar a calçada e chamar de bar;
   - quem defende está no salão (os donos da casa) e na varanda, de guarda,
     de costas pra rua até alguém pisar na frente do bar (o gatilho é o
     lugar, como na foto, e a linha de visão pela porta); a saída dele é o
     fim da rua da frente;
   - a FAIXA (ou a bandeira: 70% das vezes no bar, combate.js) de quem
     defende fica estendida na parede de fora da esquina, virada pra
     transversal por onde o ataque vem;
   - a PM chega pelas duas pontas da rua da frente.
   Quantos descem de cada lado, o saque, o bar quebrado (metade da receita
   por 45 dias) e a faixa tomada continuam sendo do jogo de feed (main.js,
   `abrirAcaoEmCena` e `abrirAtaqueAoBar`; acoes.js, `fecharAtaque` e
   `fecharDefesa`): aqui só muda o chão.

   O tabuleiro do combate (1536 × 1024 px) é um retângulo da cidade na
   escala da caminhada (1 px = √0,3 unidade: 43 × 29 m), com o x ao longo
   da rua da frente e o y da fachada pra rua. A máscara é a grade do passo
   do cenário (onde o corpo cabe: as paredes, o balcão, as mesas e as
   portas de enrolar abertas são os riscos do próprio modelo) na rua, na
   calçada e dentro do lote do bar — e só o que se alcança andando de quem
   briga.
   ========================================================= */
import { planoDoBar } from './casas3d.js?v=75671cb934';
import { fugasNaRua, fugasNosEixos, pontaSemCruzamento } from './fuga_rua.js?v=75671cb934';

const TAB = { W: 1536, H: 1024, CEL: 8 };
const ESCALA = Math.sqrt(0.3);          // unidade de mundo por px (a mesma da caminhada)

/* `bar`: o de `planta.bares()` (o lote com a frente e a esquina, a testada
   W e o fundo D em m). `o`: { ladoAtaca ('mandante' | 'visitante'),
   nosAtacamos (o jogador é quem ataca), nossoBar (o bar é do jogador) }.
   Devolve { cena, noMundo, doMundo, u, v, chao, escala, predio, ... } ou
   { erro } */
export function brigaNoBar(ctx, bar, o = {}) {
  const M = ctx.M, P = ctx.P, g = ctx.grade;
  if (!bar || !bar.lote || !bar.W || !bar.D) return { erro: 'o bar não tem lote' };
  if (!g) return { erro: 'a praça não tem a grade do passo' };
  const l = bar.lote, W = bar.W, D = bar.D;
  const PL = planoDoBar(W, D, l.esquina);
  /* O LOTE NO MUNDO: o mesmo referencial do modelo (casas3d.js, `frameDoLote`):
     x de quem olha a fachada (a direita dele é `r`), z = 0 na divisa da frente */
  const f = l.frente, mx = (l.x0 + l.x1) / 2, mz = (l.y0 + l.y1) / 2;
  const F = f === 'n' ? { fx: mx, fz: l.y0, rx: -1, rz: 0, nx: 0, nz: -1 } : f === 's' ? { fx: mx, fz: l.y1, rx: 1, rz: 0, nx: 0, nz: 1 }
    : f === 'o' ? { fx: l.x0, fz: mz, rx: 0, rz: 1, nx: -1, nz: 0 } : { fx: l.x1, fz: mz, rx: 0, rz: -1, nx: 1, nz: 0 };
  const doLote = (x, z) => [F.fx + ((x - W / 2) * F.rx + z * F.nx) * M, F.fz + ((x - W / 2) * F.rz + z * F.nz) * M];
  /* O TABULEIRO: o x corre com a direita de quem olha a fachada, o y sai
     da fachada pra rua. A esquina fica do lado `s` do x (+1 ou −1); o bar
     vai um pouco pro outro lado, pra transversal caber inteira */
  const u = [F.rx, F.rz], v = [F.nx, F.nz], K = ESCALA, s = PL.ladoDaEsquina;
  const pxm = M / K;                                      // px do tabuleiro por metro
  /* (a fachada fica abaixo do meio: a transversal sobe inteira acima do bar, por onde o ataque desce) */
  const bx = TAB.W / 2 - s * 150, by = Math.round(Math.min(600, Math.max(520, D * pxm + 60)));
  const O = [F.fx - (bx * u[0] + by * v[0]) * K, F.fz - (bx * u[1] + by * v[1]) * K];
  const noMundo = (x, y) => [O[0] + (x * u[0] + y * v[0]) * K, O[1] + (x * u[1] + y * v[1]) * K];
  const doMundo = (wx, wz) => { const dx = wx - O[0], dz = wz - O[1]; return [(dx * u[0] + dz * u[1]) / K, (dx * v[0] + dz * v[1]) / K]; };
  const deLote = (x, z) => doMundo(...doLote(x, z));
  const dentro = (x, y, m = 0) => x > m && y > m && x < TAB.W - m && y < TAB.H - m;

  /* OS BECOS POR PERTO (o boteco da favela que virou bar da torcida: a
     frente dele dá pro beco, e o beco é o chão da briga como a rua é na
     cidade): o eixo reto de cada um e a largura, os que passam a até 40 m */
  const distSeg = (x, z, a, b) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
    return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
  };
  const becos = [];
  if (P && P.favelas) for (const fv of P.favelas()) for (const b of fv.becos || []) {
    const a = b.pts[0], z = b.pts[b.pts.length - 1];
    if (distSeg(mx, mz, a, z) < 40 * M) becos.push({ a, z, w: b.w });
  }
  const noBeco = (wx, wz, folga = 0) => becos.some(b => distSeg(wx, wz, b.a, b.z) <= b.w / 2 + folga);

  /* A RUA DA FRENTE E A TRANSVERSAL: o meio de cada uma, achado no asfalto
     (ou no beco) da divisa do lote pra fora, até ele acabar. Sem o asfalto
     na planta, a conta da rua de 8 m depois de 2,5 m de calçada. A
     transversal só vale colada no lote (até `ate` m: a calçada e o
     meio-fio), não a rua do quarteirão seguinte */
  const asfalto = P && P.ehAsfalto ? (wx, wz) => P.ehAsfalto(wx, wz) : null;
  const ehRua = (wx, wz) => (asfalto && asfalto(wx, wz)) || noBeco(wx, wz);
  const meioDaRua = (x0, z0, dx, dz, ate = Infinity) => {
    if (!asfalto && !becos.length) return 2.5 + 4;
    let a = null, b = null;
    for (let k = 0; k <= 60; k++) {
      const d = k * 0.35, [wx, wz] = [x0 + dx * d * M, z0 + dz * d * M];
      if (ehRua(wx, wz)) { if (a === null) { if (d > ate) break; a = d; } b = d; } else if (a !== null) break;
    }
    return a === null ? null : (a + b) / 2;
  };
  /* (a rua da frente: do meio da testada; a transversal: da divisa da esquina, no meio do fundo) */
  const [fw0, fz0] = doLote(W / 2, 0);
  const dFrente = meioDaRua(fw0, fz0, F.nx, F.nz) ?? 2.5 + 4;
  const xEsq = s > 0 ? W : 0, [ew0, ez0] = doLote(xEsq, -D / 2);
  /* O BAR SEM ESQUINA (06/10/2026: o bar que o jogo pôs numa casa do meio
     do quarteirão, o boteco da favela): do lado da "esquina" não tem rua
     colada — o ataque vem pela rua da frente, da ponta do lado de lá */
  const dTrans = meioDaRua(ew0, ez0, F.rx * s, F.rz * s, 5);
  const semEsquina = dTrans === null;
  const yRua = by + dFrente * pxm;                         // o meio da rua da frente, no tabuleiro
  const xTrans = semEsquina ? null : deLote(xEsq, 0)[0] + s * dTrans * pxm;    // o meio da transversal

  /* A MÁSCARA: a célula de 8 px anda se o corpo (12 cm; o do combate tem 20
     e encosta na parede) cabe no meio dela, na grade do passo, e ela é rua,
     calçada ou o lote do bar (o salão, a varanda) — nada de quintal, de
     terreno baldio nem de casa de vizinho, de onde não se sai */
  const COLS = TAB.W / TAB.CEL, ROWS = TAB.H / TAB.CEL, malha = new Uint8Array(COLS * ROWS);
  const r = 0.12 * M, folga = 0.05 * M;
  const naRua = P && P.naRuaOuCalcada ? (wx, wz) => P.naRuaOuCalcada(wx, wz) : () => true;
  const noLote = (wx, wz) => wx >= l.x0 - folga && wx <= l.x1 + folga && wz >= l.y0 - folga && wz <= l.y1 + folga;
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const [wx, wz] = noMundo((i + 0.5) * TAB.CEL, (j + 0.5) * TAB.CEL);
    malha[j * COLS + i] = g.cabe(wx, wz, r) && (noLote(wx, wz) || naRua(wx, wz) || noBeco(wx, wz, 0.5 * M)) && !(ctx.noEstadio && ctx.noEstadio(wx, wz)) ? 1 : 0;
  }
  const livre = (x, y) => { const i = Math.floor(x / TAB.CEL), j = Math.floor(y / TAB.CEL); return i >= 0 && j >= 0 && i < COLS && j < ROWS && malha[j * COLS + i] === 1; };
  /* o ponto andável mais perto de (x, y), em espiral (px) */
  const soltar = (x, y, ate = 220) => {
    if (livre(x, y)) return [x, y];
    for (let rr = 6; rr < ate; rr += 6) for (let k = 0; k < 20; k++) {
      const a = k / 20 * 2 * Math.PI, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (dentro(px, py, 24) && livre(px, py)) return [px, py];
    }
    return null;
  };

  /* OS PONTOS DA CENA, no tabuleiro */
  const pBalcao = soltar(...deLote(PL.balcao.x, PL.balcao.z), 60);
  const pSalao = soltar(...deLote(PL.meioDoSalao.x, PL.meioDoSalao.z), 60);
  const pVaranda = soltar(...deLote(PL.meioDaVaranda.x, PL.meioDaVaranda.z), 60);
  if (!pBalcao || !pSalao) return { erro: 'o salão do bar não é andável (a porta de enrolar está abaixada?)' };
  /* a ponta da rua da frente pro lado `sentido` (±1 no x): andando pelo
     meio dela a partir do bar até a margem, o último chão achado (o carro
     parado no meio não corta; 50 px sem chão, sim) — a rua (o beco) que
     acaba antes da borda acaba aí */
  const xBar = deLote(W / 2, 0)[0];
  const pontaDaRua = (sentido, m = 70) => {
    let ult = null, sem = 0;
    for (let x = xBar; sentido > 0 ? x <= TAB.W - m : x >= m; x += sentido * 8) {
      const q = soltar(x, yRua, 40);
      if (q && Math.abs(q[1] - yRua) < 1.6 * pxm) { ult = q; sem = 0; } else if (++sem > 6) break;
    }
    return ult && Math.abs(ult[0] - xBar) >= 6 * pxm ? ult : null;
  };
  /* OS DOIS CAMINHOS DO ATAQUE: descendo a transversal (o 1º escalão no
     fim dela, andando pelo meio a partir da rua da frente até onde o chão
     vai — o beco da favela acaba antes da borda —, o 2º no meio do caminho
     pra esquina) ou, sem ela, pela rua da frente, da ponta do lado da
     "esquina" (o bar fica puxado pro outro lado: é o lado com mais rua), o
     2º escalão 4,5 m atrás. Vale a transversal quando dela se chega no
     balcão andando (o teste vem depois da máscara) */
  const pontaDaTransversal = () => {
    let ult = null, sem = 0;
    for (let y = Math.round(yRua); y >= 80; y -= 8) {
      const q = soltar(xTrans, y, 40);
      if (q && Math.abs(q[0] - xTrans) < 1.6 * pxm) { ult = q; sem = 0; } else if (++sem > 6) break;
    }
    return ult && yRua - ult[1] >= 8 * pxm ? ult : null;
  };
  const doisEscaloes = (a1, a2) => a1 && a2 ? [a1, a2] : null;
  const tA1 = semEsquina ? null : pontaDaTransversal();
  const pelaTransversal = tA1 && doisEscaloes(tA1, soltar(xTrans, Math.round((tA1[1] + by) / 2)));
  const fA1 = soltar(s > 0 ? TAB.W - 90 : 90, yRua) || pontaDaRua(s, 90);
  const pelaFrente = fA1 && doisEscaloes(fA1, soltar(fA1[0] - s * 4.5 * pxm, yRua + 1.2 * pxm));
  if (!pelaTransversal && !pelaFrente) return { erro: 'nem a transversal nem a rua da frente do bar cabem no tabuleiro' };
  /* o fim da rua da frente, do lado de lá da esquina: a saída de quem defende */
  const pFuga = soltar(s > 0 ? 70 : TAB.W - 70, yRua) || soltar(s > 0 ? 200 : TAB.W - 200, yRua) || pontaDaRua(-s);
  if (!pFuga) return { erro: 'a rua da frente do bar não cabe no tabuleiro' };

  /* SÓ O CHÃO LIGADO A QUEM BRIGA: o que se alcança andando do balcão, do
     salão, da transversal e do fim da rua; o resto sai da máscara */
  {
    const n = COLS * ROWS, visto = new Uint8Array(n), fila = new Int32Array(n);
    let ini = 0, fim = 0;
    const semente = p => {
      if (!p) return;
      const i = Math.floor(p[0] / TAB.CEL), j = Math.floor(p[1] / TAB.CEL), c = j * COLS + i;
      if (i >= 0 && j >= 0 && i < COLS && j < ROWS && malha[c] && !visto[c]) { visto[c] = 1; fila[fim++] = c; }
    };
    for (const p of [pBalcao, pSalao, pVaranda, pFuga, ...(pelaTransversal || []), ...(pelaFrente || [])]) semente(p);
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
  /* quem ataca tem de chegar no balcão andando (senão a cena não fecha): a
     porta de enrolar abaixada, ou um vão estreito demais, fica aqui. O
     andar é o do motor (arredores.js, `construirMalhaCorpo`): a célula só
     passa com o corpo (5 px pra cada lado) — ela e as quatro vizinhas no
     chão; o vão de uma ou duas células, que a máscara deixa, o boneco não
     atravessa (o 'PORTÃO SELADO' do bar na favela, 06/10/2026). A ponta
     (quem nasce e o alvo) vale a célula de corpo mais perto, a até 6 */
  const corpo = c => {
    const i = c % COLS, j = (c - i) / COLS;
    return i > 0 && j > 0 && i < COLS - 1 && j < ROWS - 1 && malha[c] && malha[c - 1] && malha[c + 1] && malha[c - COLS] && malha[c + COLS];
  };
  const celDeCorpo = p => {
    const ci = Math.floor(p[0] / TAB.CEL), cj = Math.floor(p[1] / TAB.CEL);
    let melhor = -1, md = Infinity;
    for (let dj = -6; dj <= 6; dj++) for (let di = -6; di <= 6; di++) {
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= COLS || j >= ROWS || !corpo(j * COLS + i)) continue;
      const q = di * di + dj * dj;
      if (q < md) { md = q; melhor = j * COLS + i; }
    }
    return melhor;
  };
  /* O ALVO QUE O CORPO ALCANÇA (06/10/2026): no bar estreito (a casa do
     meio do quarteirão que virou bar, o boteco da favela: 7 m de frente ou
     menos) o canto do balcão fica fechado pro corpo entre o balcão, as
     banquetas e o freezer, e as mesas tapam a varanda. O alvo de quem
     ataca vira o ponto do salão mais perto do balcão que se alcança
     andando de onde ele chega (no bar largo, o próprio balcão); os donos
     da casa nascem no salão onde se alcança a rua, e a varanda só vale
     quando dela se sai */
  const caixa = r => {
    const a = deLote(r.x[0], r.z[0]), b = deLote(r.x[1], r.z[1]);
    return { x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), y0: Math.min(a[1], b[1]), y1: Math.max(a[1], b[1]) };
  };
  const cxSalao = caixa(PL.salao), cxVaranda = caixa(PL.varanda);
  const alcancavel = (de, perto, cx) => {
    const c0 = celDeCorpo(de);
    if (c0 < 0) return null;
    const n = COLS * ROWS, visto = new Uint8Array(n), fila = new Int32Array(n);
    let ini = 0, fim = 0, melhor = null, md = Infinity;
    visto[c0] = 1; fila[fim++] = c0;
    while (ini < fim) {
      const c = fila[ini++], i = c % COLS, j = (c - i) / COLS, x = (i + 0.5) * TAB.CEL, y = (j + 0.5) * TAB.CEL;
      if (x >= cx.x0 && x <= cx.x1 && y >= cx.y0 && y <= cx.y1) {
        const d = Math.hypot(x - perto[0], y - perto[1]);
        if (d < md) { md = d; melhor = [x, y]; }
      }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj, k = jj * COLS + ii;
        if (ii < 0 || jj < 0 || ii >= COLS || jj >= ROWS || visto[k] || !corpo(k)) continue;
        visto[k] = 1; fila[fim++] = k;
      }
    }
    return melhor;
  };
  /* (o bar mais estreito — 6 m, a porta do lado dando na casa do vizinho
     e as mesas tapando a varanda — não abre o salão pro corpo: o alvo vira
     a PORTA DO BAR, o ponto do lote mais perto do balcão que se alcança) */
  const cxLote = caixa({ x: [0, W], z: [-D, 0] });
  let ataque = null, alvo = null, naPorta = false;
  for (const op of [pelaTransversal, pelaFrente]) {
    const a = op && alcancavel(op[0], pBalcao, cxSalao);
    if (a && Math.hypot(a[0] - pBalcao[0], a[1] - pBalcao[1]) <= 3.5 * pxm) { ataque = op; alvo = a; break; }
  }
  if (!ataque) for (const op of [pelaTransversal, pelaFrente]) {
    const a = op && alcancavel(op[0], pBalcao, cxLote);
    if (a) { ataque = op; alvo = a; naPorta = true; break; }
  }
  if (!ataque) return { erro: 'da rua não se chega no bar andando' };
  const [pA1, pA2] = ataque, viaFrente = ataque === pelaFrente;
  const pDonos = alcancavel(pFuga, pSalao, cxSalao) || alcancavel(pFuga, pSalao, cxLote);
  if (!pDonos) return { erro: 'do salão não se chega no fim da rua andando' };
  const pVar = pVaranda && alcancavel(pFuga, pVaranda, cxVaranda);
  const pNaVaranda = pVar && Math.hypot(pVar[0] - pVaranda[0], pVar[1] - pVaranda[1]) <= 1.5 * pxm ? pVar : null;
  /* AS FUGAS NO MEIO DA RUA (fuga_rua.js): o eixo da rua da frente e da
     transversal (e de quem mais cruzar a borda) — nada de sumir no salão;
     no boteco da favela, também o eixo dos becos onde eles saem da cena */
  const Bt = { noMundo, malha, COLS, ROWS, pxm, W: TAB.W, H: TAB.H, CEL: TAB.CEL };
  const fugas = fugasNaRua(Bt, asfalto);
  for (const f of becos.length ? fugasNosEixos(Bt, becos.map(b => [doMundo(b.a[0], b.a[1]), doMundo(b.z[0], b.z[1])]), { pontaVale: pontaSemCruzamento(becos, noMundo, M) }) : [])
    if (!fugas.some(q => Math.hypot(q.x - f.x, q.y - f.y) < 3 * pxm)) fugas.push(f);
  const linhas = [];
  for (let j = 0; j < ROWS; j++) {
    const runs = []; let v0 = 0, n = 0;
    for (let i = 0; i < COLS; i++) { const v1 = malha[j * COLS + i]; if (v1 === v0) n++; else { runs.push(n); v0 = v1; n = 1; } }
    runs.push(n);
    linhas.push(runs.join(','));
  }

  /* QUEM É QUEM: os lados do combate dizem quem ataca (o jogo de feed: no
     nosso ataque somos o mandante; no deles, o visitante — o do salão) */
  const ladoA = o.ladoAtaca === 'visitante' ? 'visitante' : 'mandante', ladoD = ladoA === 'mandante' ? 'visitante' : 'mandante';
  const nosAtacamos = o.nosAtacamos !== false;
  const R = p => ({ x: Math.round(p[0]), y: Math.round(p[1]) });
  const spawns = [
    { id: ladoA + '1', rot: '1º ESCALÃO', lado: ladoA, ...R(pA1), jogador: nosAtacamos, entrada: 'balcao' },
    { id: ladoA + '2', rot: '2º ESCALÃO', lado: ladoA, ...R(pA2), entrada: 'balcao' },
    { id: ladoD + '1', rot: 'DONOS DA CASA', lado: ladoD, ...R(pDonos), guarda: true, jogador: !nosAtacamos, entrada: 'fuga' },
    ...(pNaVaranda ? [{ id: ladoD + '2', rot: 'NA VARANDA', lado: ladoD, ...R(pNaVaranda), guarda: true, entrada: 'fuga' }] : [])
  ];
  const entradas = [
    /* o alvo é o balcão, lá no fundo: tem de atravessar o salão */
    { id: 'balcao', rot: naPorta ? 'PORTA DO BAR' : 'BALCÃO DO BAR', lado: ladoA, ...R(alvo), raio: 40, dir: [0, -1] },
    { id: 'fuga', rot: 'FIM DA RUA', lado: ladoD, ...R(pFuga), raio: 46, dir: [-s, 0] }
  ];
  /* A FAIXA DE QUEM DEFENDE, na parede de fora da esquina (o ponto é na
     calçada da transversal, rente à parede; `dir` aponta pra parede). O
     pano tem 3 m, e a bandeira, quando é ela, fica do lado, na mesma parede */
  const pe = PL.paredeDaEsquina;
  let faixas = {};
  if (!viaFrente) {
    const lenF = Math.round(Math.min(118, Math.max(70, (pe.comp - 0.6) * pxm)));
    const pF = soltar(...deLote(pe.x + s * 0.42, pe.z), 40);
    if (pF) faixas = { [ladoD]: { ...R(pF), len: lenF, dir: [-s, 0] } };
  } else {
    /* (o ataque pela rua da frente: a parede do lado não dá pra ele — sem
       esquina, é a do vizinho —, e o pano fica em pé na frente da varanda,
       virado pra rua por onde o ataque vem) */
    const va = PL.varanda, lenF = Math.round(Math.min(118, Math.max(70, (Math.abs(va.x[1] - va.x[0]) - 0.8) * pxm)));
    const pF = soltar(...deLote((va.x[0] + va.x[1]) / 2, va.z[1] + 0.35), 40);
    if (pF) faixas = { [ladoD]: { ...R(pF), len: lenF, dir: [0, -1] } };
  }
  /* o gatilho: a calçada da frente do bar, da varanda até a esquina */
  const pG = deLote(W / 2, 1.2);
  const gatilho = { x: Math.round(pG[0]), y: Math.round(pG[1]), raio: Math.round(4.6 * pxm), lado: ladoA,
                    rot: 'FRENTE DO BAR', espera: 'os donos da casa ainda não te viram', aviso: 'gritaram lá dentro — o bar inteiro veio pra porta' };
  /* a PM: as duas pontas da rua da frente */
  const pmPostos = [R(soltar(90, yRua) || pFuga), R(soltar(TAB.W - 90, yRua) || pA1)];

  const cena = {
    id: 'bar@3d', base: 'bar', tres: true, nome: 'Bar',
    local: o.nossoBar ? 'No nosso bar' : 'No bar deles',
    largura: TAB.W, altura: TAB.H, celula: TAB.CEL, imagem: null, mascara: linhas.join(';'),
    blocos: [], enfeites: [], varais: [], grades: [], pintura: null,
    /* quem defende se reparte entre o salão e a varanda */
    espalharBonde: ladoD,
    saida: nosAtacamos
      ? { perto: 'Tomar o bar', longe: (naPorta ? 'Porta' : 'Balcão') + ' do bar (leve o líder)', feito: 'sua torcida tomou o bar deles',
          dica: naPorta ? 'Leve o líder até a porta do bar.' : 'Leve o líder pra dentro, até o balcão.' }
      : { perto: 'Largar o bar', longe: 'Fim da rua (leve o líder)', feito: 'sua torcida largou o bar e saiu pela rua', dica: 'Pra largar o bar, leve o líder até o fim da rua.' },
    spawns, entradas, faixas, gatilho, pmPostos,
    ...(fugas.length ? { fugas } : {})
  };
  const chao = (x, y) => { const [wx, wz] = noMundo(x, y); return (ctx.chaoDaRua ? ctx.chaoDaRua(wx, wz) : 0) / M; };
  const [px, pz] = doLote(PL.meio.x, PL.meio.z);
  /* (os pontos do salão no tabuleiro: as portas de enrolar, pro teste e pra quem quiser guiar alguém lá dentro) */
  const pontos = { portas: PL.portas.map(p => R(deLote(p.x, p.z))), portaLado: PL.portaLado ? R(deLote(PL.portaLado.x, PL.portaLado.z)) : null,
                   balcao: R(alvo), salao: R(pDonos), varanda: pNaVaranda ? R(pNaVaranda) : null };
  return { cena, noMundo, doMundo, u, v, chao, escala: K, predio: { x: px, z: pz }, plano: PL, bar, pontos,
           malha, COLS, ROWS, ruas: { frente: dFrente, transversal: dTrans } };
}
