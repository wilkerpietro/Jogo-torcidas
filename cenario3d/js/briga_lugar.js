/* =========================================================
   AS BRIGAS QUE AINDA ABRIAM A FOTO (o jogo 3D, 06/10/2026)

   O dono: "as cenas de briga algumas vezes abrem o cenário 2d, crie os
   cenários coerentes dentro do mapa 3d". Até aqui, quatro brigas do jogo
   de feed não tinham lugar na cidade em 3D e caíam na foto:
   - a REUNIÃO DA ZONA NA PRAÇA ('praca-reuniao': o nosso bote na reunião
     deles e o deles na nossa) — vai pra PRAÇA DO BAIRRO no mapa (a
     quadra de praça das cidades-modelo: o calçadão em cruz e o chafariz no
     meio), com a zona atacada em roda em volta do chafariz e quem ataca
     chegando pela rua de uma das pontas. A briga do TUTORIAL (5 × 5 'na
     praça') e a briga de praça que não tem caminhada pra montar caem na
     mesma praça, um bonde em cada ponta;
   - o ATAQUE À SEDE deles ('bar' com o alvo 'sede'): na SEDE da torcida
     no mapa — quem ataca desce a rua da frente, quem defende está no
     portão e no pátio, e o objetivo é o pátio (sem o pátio ao alcance, o
     portão);
   - a COBRANÇA NO CLUBE ('ct'): o mapa não tem CT, e o clube mora no
     estádio dele: a caravana chega no PORTÃO 1 do estádio do clube e os
     seguranças estão na boca do portão; o objetivo é o portão.
   O resto (quantos de cada lado, quem tem ficha, o saque, os pontos do
   bairro, a faixa tomada) continua sendo do jogo de feed: aqui só muda o
   chão.

   O tabuleiro é o de sempre das cenas da cidade (briga_bar.js,
   briga_treta.js): 1536 × 1024 px na escala da caminhada (1 px = √0,3
   unidade: 43 × 29 m), e a máscara é a grade do passo do cenário (onde o
   corpo cabe) no que o lugar deixa (a quadra da praça, o lote da sede, a
   rua e a calçada) — e só o que se alcança andando de quem briga.
   ========================================================= */
import { ROTAS_ESTADIOS } from './rotas_estadios.js?v=399d7ad099';
import { fugasNaRua } from './fuga_rua.js?v=399d7ad099';

const TAB = { W: 1536, H: 1024, CEL: 8 };
const ESCALA = Math.sqrt(0.3);          // unidade de mundo por px (a mesma da caminhada)
const hashTxt = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };

/* O TABULEIRO NO LUGAR: o meio dele em `c` (o mundo), o x ao longo de `u`
   (unitário) e o y ao longo de v = (−u.z, u.x). A máscara: o corpo (12 cm)
   cabe na grade do passo, fora do estádio, e — com `dele` — onde o lugar
   deixa */
function tabuleiro(ctx, c, u, dele) {
  const M = ctx.M, g = ctx.grade, K = ESCALA, pxm = M / K;
  const v = [-u[1], u[0]];
  const O = [c[0] - (TAB.W / 2 * u[0] + TAB.H / 2 * v[0]) * K, c[1] - (TAB.W / 2 * u[1] + TAB.H / 2 * v[1]) * K];
  const noMundo = (x, y) => [O[0] + (x * u[0] + y * v[0]) * K, O[1] + (x * u[1] + y * v[1]) * K];
  const doMundo = (wx, wz) => { const dx = wx - O[0], dz = wz - O[1]; return [(dx * u[0] + dz * u[1]) / K, (dx * v[0] + dz * v[1]) / K]; };
  const COLS = TAB.W / TAB.CEL, ROWS = TAB.H / TAB.CEL, malha = new Uint8Array(COLS * ROWS);
  const r = 0.12 * M;
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const [wx, wz] = noMundo((i + 0.5) * TAB.CEL, (j + 0.5) * TAB.CEL);
    malha[j * COLS + i] = (!dele || dele(wx, wz)) && g.cabe(wx, wz, r) && !(ctx.noEstadio && ctx.noEstadio(wx, wz)) ? 1 : 0;
  }
  const dentro = (x, y, m = 0) => x > m && y > m && x < TAB.W - m && y < TAB.H - m;
  const livre = (x, y) => { const i = Math.floor(x / TAB.CEL), j = Math.floor(y / TAB.CEL); return i >= 0 && j >= 0 && i < COLS && j < ROWS && malha[j * COLS + i] === 1; };
  /* o ponto andável mais perto de (x, y), em espiral (px) */
  const soltar = (x, y, ate = 220) => {
    if (dentro(x, y, 12) && livre(x, y)) return [x, y];
    for (let rr = 6; rr < ate; rr += 6) for (let k = 0; k < 20; k++) {
      const a = k / 20 * 2 * Math.PI, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (dentro(px, py, 20) && livre(px, py)) return [px, py];
    }
    return null;
  };
  const cel = p => Math.floor(p[1] / TAB.CEL) * COLS + Math.floor(p[0] / TAB.CEL);
  /* o chão que se alcança andando das sementes (4 vizinhos) */
  const alcance = (sementes, alvo = -1) => {
    const n = COLS * ROWS, visto = new Uint8Array(n), fila = new Int32Array(n);
    let ini = 0, fim = 0;
    for (const p of sementes) {
      if (!p) continue;
      const k = cel(p);
      if (k >= 0 && k < n && malha[k] && !visto[k]) { visto[k] = 1; fila[fim++] = k; }
    }
    while (ini < fim) {
      const k0 = fila[ini++];
      if (k0 === alvo) return { visto, achou: true };
      const i = k0 % COLS, j = (k0 - i) / COLS;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj, k = jj * COLS + ii;
        if (ii < 0 || jj < 0 || ii >= COLS || jj >= ROWS || visto[k] || !malha[k]) continue;
        visto[k] = 1; fila[fim++] = k;
      }
    }
    return { visto, achou: false };
  };
  /* só o chão ligado a quem briga fica na máscara */
  const ligar = sementes => { const { visto } = alcance(sementes); for (let k = 0; k < malha.length; k++) if (!visto[k]) malha[k] = 0; };
  const ligado = (a, b) => !!a && !!b && malha[cel(a)] === 1 && alcance([a], cel(b)).achou;
  /* a máscara da cena: as linhas em carreiras (a primeira de chão fechado) */
  const mascara = () => {
    const linhas = [];
    for (let j = 0; j < ROWS; j++) {
      const runs = []; let v0 = 0, n = 0;
      for (let i = 0; i < COLS; i++) { const v1 = malha[j * COLS + i]; if (v1 === v0) n++; else { runs.push(n); v0 = v1; n = 1; } }
      runs.push(n);
      linhas.push(runs.join(','));
    }
    return linhas.join(';');
  };
  const chao = (x, y) => { const [wx, wz] = noMundo(x, y); return (ctx.chaoDaRua ? ctx.chaoDaRua(wx, wz) : 0) / M; };
  const R = p => ({ x: Math.round(p[0]), y: Math.round(p[1]) });
  return { M, K, pxm, u, v, noMundo, doMundo, malha, COLS, ROWS, livre, soltar, ligar, ligado, mascara, chao, R, dentro };
}
/* o meio da rua de (x0, z0) pra fora (dx, dz), em m: do primeiro asfalto ao
   último; sem asfalto na planta, a calçada de 2,5 m e meia rua de 4 */
function meioDaRua(P, M, x0, z0, dx, dz, ate = 22) {
  let a = null, b = null;
  if (P && P.ehAsfalto) for (let k = 0; k <= ate / 0.35; k++) {
    const d = k * 0.35, wx = x0 + dx * d * M, wz = z0 + dz * d * M;
    if (P.ehAsfalto(wx, wz)) { if (a === null) a = d; b = d; } else if (a !== null) break;
  }
  return a === null ? 2.5 + 4 : (a + b) / 2;
}
/* AS FUGAS NO MEIO DA RUA (fuga_rua.js) do tabuleiro pronto: o eixo de
   cada rua onde ela cruza a borda; sem rua nenhuma, a cena não declara e
   fica com a leitura da máscara */
function fugasDe(T, P) {
  const f = fugasNaRua({ noMundo: T.noMundo, malha: T.malha, COLS: T.COLS, ROWS: T.ROWS, pxm: T.pxm, W: TAB.W, H: TAB.H, CEL: TAB.CEL },
                       P && P.ehAsfalto ? (wx, wz) => P.ehAsfalto(wx, wz) : null);
  return f.length ? { fugas: f } : {};
}

/* =========================================================
   A PRAÇA DO BAIRRO
   ========================================================= */
/* `praca`: a de planta.pracas() (a quadra inteira: x0, x1, y0, y1; o nome)
   ou, no bairro sem praça, O CRUZAMENTO dele (planta.cruzamentoDoBairro:
   `cruzamento`, x, y, u — o eixo do braço por onde se chega —, e o nome do
   bairro em `nomeDoBairro`). `o`: { reuniao (a roda da zona,
   'praca-reuniao'), ladoAtaca ('mandante' | 'visitante'), nosAtacamos,
   chave (o sorteio da ponta por onde o bonde chega) }. Devolve { cena,
   noMundo, doMundo, u, v, chao, escala, lugar, ... } ou { erro } */
export function brigaNaPraca(ctx, praca, o = {}) {
  const M = ctx.M, P = ctx.P;
  const largo = !!(praca && praca.cruzamento);
  if (!praca || (largo ? !(isFinite(praca.x) && isFinite(praca.y) && praca.u) : !(praca.x1 > praca.x0 && praca.y1 > praca.y0))) return { erro: 'a praça não tem quadra' };
  if (!ctx.grade) return { erro: 'a praça não tem a grade do passo' };
  /* o x do tabuleiro corre ao longo da praça (no cruzamento, ao longo do
     braço); o sorteio diz pra que lado (quem ataca chega pela ponta do x grande) */
  const sinal = hashTxt(o.chave || praca.nome || 'praca') % 2 ? 1 : -1;
  const f = 0.05 * M;
  let c, u, comp, larg, naLugar;
  if (largo) {
    c = [praca.x, praca.y]; u = [praca.u[0] * sinal, praca.u[1] * sinal]; comp = 0; larg = 0; naLugar = () => false;
  } else {
    const lx = praca.x1 - praca.x0, lz = praca.y1 - praca.y0, deitada = lx >= lz;
    c = [(praca.x0 + praca.x1) / 2, (praca.y0 + praca.y1) / 2]; u = deitada ? [sinal, 0] : [0, sinal];
    comp = (deitada ? lx : lz) / M; larg = (deitada ? lz : lx) / M;            // m
    naLugar = (wx, wz) => wx >= praca.x0 - f && wx <= praca.x1 + f && wz >= praca.y0 - f && wz <= praca.y1 + f;
  }
  const naRua = P && P.naRuaOuCalcada ? (wx, wz) => P.naRuaOuCalcada(wx, wz) : () => true;
  const T = tabuleiro(ctx, c, u, (wx, wz) => naLugar(wx, wz) || naRua(wx, wz));
  const { pxm, soltar, R } = T;
  const mX = TAB.W / 2, mY = TAB.H / 2;
  /* as pontas da praça no tabuleiro (a borda da quadra) e o meio da rua de
     cada uma; no cruzamento, as pontas do braço, a 19 m do meio */
  const xFim = Math.min(TAB.W - 30, mX + comp / 2 * pxm), xIni = Math.max(30, mX - comp / 2 * pxm);
  const ruaFim = largo ? TAB.W - 90 : Math.min(TAB.W - 40, xFim + Math.max(1.6, Math.min(4, (TAB.W - xFim) / pxm - 0.8)) * pxm);
  const ruaIni = largo ? 90 : Math.max(40, xIni - Math.max(1.6, Math.min(4, xIni / pxm - 0.8)) * pxm);
  /* os lados compridos: a calçada de fora (as ruas de cima e de baixo, onde a
     PM chega); no cruzamento, os braços de través */
  const yCima = largo ? 40 : Math.max(30, mY - (larg / 2 + 3) * pxm), yBaixo = largo ? TAB.H - 40 : Math.min(TAB.H - 30, mY + (larg / 2 + 3) * pxm);
  const ladoA = o.ladoAtaca === 'visitante' ? 'visitante' : 'mandante', ladoD = ladoA === 'mandante' ? 'visitante' : 'mandante';
  const nosAtacamos = o.nosAtacamos !== false;
  const nomeDoLugar = largo ? 'esquina' + (praca.nomeDoBairro ? ' do ' + praca.nomeDoBairro : '') : praca.nome || 'Praça';
  const lugar = { tipo: largo ? 'esquina' : 'praca', nome: nomeDoLugar, bairro: praca.bairro || null, c, comp, larg };

  /* OS PONTOS: as ruas das duas pontas primeiro — o chão da cena é o que se
     liga a elas andando (o canteiro cercado, o quintal do vizinho saem) —,
     e o resto cai nesse chão */
  const pA1 = soltar(ruaFim, mY - 1.2 * pxm);
  /* as bocas de saída de cada ponta, NO MEIO DA RUA (o dono, 06/10/2026):
     no cruzamento, o eixo do braço na borda; na praça, o eixo da rua da
     ponta (achado no asfalto, da beira da quadra pra fora), sem passar da
     borda da cena */
  const eixoDaPonta = (x, sinal) => {
    if (largo) return sinal > 0 ? TAB.W - 34 : 34;
    const [wx, wz] = T.noMundo(x, mY), d = meioDaRua(P, M, wx, wz, u[0] * sinal, u[1] * sinal, 14);
    return Math.max(34, Math.min(TAB.W - 34, x + sinal * d * pxm));
  };
  const pSaiA = soltar(eixoDaPonta(xFim, 1), mY) || soltar(ruaFim, mY);
  const pSaiD = soltar(eixoDaPonta(xIni, -1), mY) || soltar(ruaIni, mY);
  if (!pA1 || !pSaiA || !pSaiD) return { erro: 'a rua da ponta da praça não cabe no tabuleiro (' + lugar.nome + ')' };
  T.ligar([pA1, pSaiA, pSaiD]);
  if (!T.ligado(pA1, pSaiD)) return { erro: 'as duas pontas da praça não se ligam andando (' + lugar.nome + ')' };
  const pA2 = soltar(ruaFim - 0.6 * pxm, mY + 2.4 * pxm);
  let spawns, entradas, gatilho, faixas = {};
  if (o.reuniao) {
    /* A RODA DA REUNIÃO em volta do chafariz (o meio da praça): seis
       pontos numa elipse de 4,2 × 1,75 m, no calçadão — quem puxa a
       reunião fica do lado de quem chega, de costas pra rua. No cruzamento,
       a roda é no meio dele, de 2,4 m */
    const roda = [], ra = largo ? 2.4 : 4.2, rb = largo ? 2.4 : 1.75;
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3, p = soltar(mX + Math.cos(a) * ra * pxm, mY + Math.sin(a) * rb * pxm, 120);
      if (p) roda.push(p);
    }
    if (roda.length < 3) return { erro: 'o largo do meio da praça não é andável (' + lugar.nome + ')' };
    spawns = [
      { id: ladoA + '1', rot: '1º ESCALÃO', lado: ladoA, ...R(pA1), jogador: nosAtacamos, entrada: 'esquina_leste' },
      ...(pA2 ? [{ id: ladoA + '2', rot: '2º ESCALÃO', lado: ladoA, ...R(pA2), entrada: 'esquina_leste' }] : []),
      ...roda.map((p, k) => ({ id: ladoD + (k + 1), rot: k ? 'NA RODA' : 'QUEM PUXA A REUNIÃO', lado: ladoD, ...R(p), guarda: true,
                               ...(k === 0 && !nosAtacamos ? { jogador: true } : {}), entrada: 'esquina_oeste' }))
    ];
    /* (o gatilho é o largo: quem está na roda só levanta quando o bonde chega perto do chafariz) */
    gatilho = { x: mX, y: mY, raio: Math.round((largo ? 7 : 8.5) * pxm), lado: ladoA, soZona: true, rot: 'A RODA DA REUNIÃO',
                espera: 'a reunião ainda não te viu', aviso: 'gritaram na roda — a zona inteira levantou' };
    /* A FAIXA da zona atacada, em pé no calçadão entre a roda e quem chega
       (o `dir` aponta pra roda: o "muro" atrás do pano) */
    const pF = soltar(mX + (largo ? 4.4 : 6.2) * pxm, mY, 60);
    if (pF) faixas[ladoD] = { ...R(pF), len: 140, dir: [-1, 0] };
  } else {
    /* O ENCONTRO NA PRAÇA (o tutorial; a briga de praça sem caminhada): um
       bonde em cada ponta, e a saída de cada um é a ponta do outro */
    const pD1 = soltar(ruaIni, mY + 1.2 * pxm), pD2 = soltar(ruaIni + 0.6 * pxm, mY - 2.4 * pxm);
    if (!pD1) return { erro: 'a rua da outra ponta da praça não cabe no tabuleiro (' + lugar.nome + ')' };
    spawns = [
      { id: ladoA + '1', rot: '1º ESCALÃO', lado: ladoA, ...R(pA1), jogador: nosAtacamos, entrada: 'esquina_oeste' },
      ...(pA2 ? [{ id: ladoA + '2', rot: '2º ESCALÃO', lado: ladoA, ...R(pA2), entrada: 'esquina_oeste' }] : []),
      { id: ladoD + '1', rot: 'BONDE RIVAL', lado: ladoD, ...R(pD1), guarda: true, ...(nosAtacamos ? {} : { jogador: true }), entrada: 'esquina_leste' },
      ...(pD2 ? [{ id: ladoD + '2', rot: 'RETAGUARDA', lado: ladoD, ...R(pD2), guarda: true, entrada: 'esquina_leste' }] : [])
    ];
    gatilho = { lado: ladoA, perto: 260, rot: 'DE OLHO', espera: 'eles ainda não se mexeram', aviso: 'eles viram o bonde e vieram' };
  }
  /* (a esquina de cada um: no encontro, a do outro; na reunião, quem ataca sai por onde veio) */
  entradas = [
    { id: 'esquina_oeste', rot: o.reuniao ? 'A RUA DE TRÁS' : 'ESQUINA OESTE', lado: o.reuniao ? ladoD : ladoA, ...R(pSaiD), raio: 46, dir: [-1, 0] },
    { id: 'esquina_leste', rot: o.reuniao ? 'POR ONDE VIEMOS' : 'ESQUINA LESTE', lado: o.reuniao ? ladoA : ladoD, ...R(pSaiA), raio: 46, dir: [1, 0] }
  ];
  /* a PM do posto vem a pé pelas duas ruas compridas */
  const pmPostos = [R(soltar(mX, yCima) || pSaiD), R(soltar(mX, yBaixo) || pSaiA)];
  const cena = {
    id: (o.reuniao ? 'praca-reuniao' : 'praca') + '@3d', base: 'praca', tres: true,
    nome: o.reuniao ? (largo ? 'Reunião na esquina' : 'Reunião na praça') : largo ? 'Esquina' : 'Praça',
    local: (largo ? 'Na ' + nomeDoLugar : 'Na ' + nomeDoLugar) + (o.reuniao ? ', na reunião da zona' : ''),
    largura: TAB.W, altura: TAB.H, celula: TAB.CEL, imagem: null, mascara: T.mascara(),
    blocos: [], enfeites: [], varais: [], grades: [], pintura: null,
    /* praça de bairro não tem operação montada: a PM do posto vem a pé */
    tropaChoque: false,
    ...(o.reuniao ? { espalharBonde: ladoD } : {}),
    saida: o.reuniao
      ? { perto: 'Sair pela rua', longe: 'Saída (leve o líder)', feito: nosAtacamos ? 'sua torcida desfez a reunião deles ' + (largo ? 'na esquina' : 'na praça') : 'sua torcida saiu ' + (largo ? 'da esquina' : 'da praça') + ' com a rua na mão',
          dica: 'Leve o líder até a boca de rua da sua torcida.' }
      : { perto: 'Sair pela rua', longe: 'Saída (leve o líder)', feito: 'sua torcida saiu ' + (largo ? 'da esquina' : 'da praça') + ' com a rua na mão', dica: 'Leve o líder até a boca de rua da sua torcida.' },
    spawns, entradas, gatilho, faixas, pmPostos,
    ...fugasDe(T, P)
  };
  return { cena, noMundo: T.noMundo, doMundo: T.doMundo, u: T.u, v: T.v, chao: T.chao, escala: T.K, lugar, malha: T.malha, COLS: T.COLS, ROWS: T.ROWS };
}

/* =========================================================
   A SEDE DELES
   ========================================================= */
/* `T`: a torcida de planta.torcidas() (com `sede3d`: a área, a frente, as
   entradas e os cômodos no mundo). `o`: { ladoAtaca, nosAtacamos }.
   Devolve { cena, ..., predio, area } ou { erro } */
export function brigaNaSede(ctx, Tc, o = {}) {
  const M = ctx.M, P = ctx.P;
  const S = Tc && Tc.sede3d;
  if (!S || !S.area) return { erro: 'a torcida não tem sede no mapa' };
  if (!ctx.grade) return { erro: 'a praça não tem a grade do passo' };
  const a = S.area, f = S.frente;
  /* o referencial da frente (o de briga_bar.js): `r` a direita de quem
     olha a fachada, `n` a normal pra rua */
  const F = f === 'n' ? { rx: -1, rz: 0, nx: 0, nz: -1 } : f === 's' ? { rx: 1, rz: 0, nx: 0, nz: 1 }
    : f === 'o' ? { rx: 0, rz: 1, nx: -1, nz: 0 } : { rx: 0, rz: -1, nx: 1, nz: 0 };
  /* o portão (na calçada, no meio do vão) e a linha da frente do lote */
  const pt = S.entradas && S.entradas.portao;
  const frenteZ = f === 'n' ? a.y0 : f === 's' ? a.y1 : null, frenteX = f === 'o' ? a.x0 : f === 'l' ? a.x1 : null;
  const portao = pt ? [pt.x, pt.z] : [frenteX != null ? frenteX + F.nx * 1.2 * M : (a.x0 + a.x1) / 2, frenteZ != null ? frenteZ + F.nz * 1.2 * M : (a.y0 + a.y1) / 2];
  /* o pátio (o cômodo do portão), no mundo */
  const pat = (S.comodos || []).find(c => c.tipo === 'patio' && !c.andar);
  const patio = pat ? [(pat.x0 + pat.x1) / 2, (pat.z0 + pat.z1) / 2] : null;
  /* O TABULEIRO: o x corre com a direita de quem olha a fachada, o y sai da
     fachada pra rua; o portão um pouco acima do meio (o pátio em cima, a
     rua embaixo) */
  const u = [F.rx, F.rz];
  const c = [portao[0] + F.nx * 2 * M, portao[1] + F.nz * 2 * M];
  const fl = 0.05 * M;
  const noLote = (wx, wz) => wx >= a.x0 - fl && wx <= a.x1 + fl && wz >= a.y0 - fl && wz <= a.y1 + fl;
  const naRua = P && P.naRuaOuCalcada ? (wx, wz) => P.naRuaOuCalcada(wx, wz) : () => true;
  const Tb = tabuleiro(ctx, c, u, (wx, wz) => noLote(wx, wz) || naRua(wx, wz));
  const { pxm, soltar, R, doMundo } = Tb;
  /* a rua da frente: o meio dela, do portão pra fora */
  const dRua = meioDaRua(P, M, portao[0], portao[1], F.nx, F.nz);
  const pPortao = doMundo(portao[0], portao[1]);
  const yRua = Math.min(TAB.H - 40, pPortao[1] + dRua * pxm);
  /* de que lado da rua o bonde vem: o lado com mais rua no tabuleiro (o sorteio desempata) */
  const s = (hashTxt(Tc.id || '') % 2) ? 1 : -1;
  const xA = s > 0 ? TAB.W - 70 : 70, xFuga = s > 0 ? 70 : TAB.W - 70;
  const ladoA = o.ladoAtaca === 'visitante' ? 'visitante' : 'mandante', ladoD = ladoA === 'mandante' ? 'visitante' : 'mandante';
  const nosAtacamos = o.nosAtacamos !== false;
  /* a rua de ponta a ponta primeiro (o chão da cena é o que se liga a ela) */
  const pA1 = soltar(xA, yRua), pFuga = soltar(xFuga, yRua);
  if (!pA1 || !pFuga) return { erro: 'a rua da frente da sede não cabe no tabuleiro' };
  Tb.ligar([pA1, pFuga]);
  if (!Tb.ligado(pA1, pFuga)) return { erro: 'a rua da frente da sede não se anda de ponta a ponta' };
  const pA2 = soltar(xA - s * 4.5 * pxm, yRua - 1.6 * pxm);
  /* o portão (a calçada na frente dele) e o pátio, no chão ligado à rua */
  const pPorta = soltar(pPortao[0], pPortao[1], 90);
  if (!pPorta || Math.hypot(pPorta[0] - pPortao[0], pPorta[1] - pPortao[1]) > 3 * pxm) return { erro: 'da rua não se chega no portão da sede andando' };
  const pPatio0 = patio ? soltar(...doMundo(patio[0], patio[1]), 90) : null;
  /* (o pátio de verdade: o ponto achado cai dentro dele, não na calçada de fora) */
  const noPatio = !!pPatio0 && (() => { const [wx, wz] = Tb.noMundo(pPatio0[0], pPatio0[1]); return wx >= pat.x0 - fl && wx <= pat.x1 + fl && wz >= pat.z0 - fl && wz <= pat.z1 + fl; })();
  const pPatio = noPatio ? pPatio0 : null;
  /* o objetivo é o pátio, quando se chega nele pelo portão; senão, o portão */
  const alvo = noPatio ? pPatio : pPorta;
  const spawns = [
    { id: ladoA + '1', rot: '1º ESCALÃO', lado: ladoA, ...R(pA1), jogador: nosAtacamos, entrada: 'sede' },
    ...(pA2 ? [{ id: ladoA + '2', rot: '2º ESCALÃO', lado: ladoA, ...R(pA2), entrada: 'sede' }] : []),
    { id: ladoD + '1', rot: 'NO PORTÃO', lado: ladoD, ...R(pPorta), guarda: true, jogador: !nosAtacamos, entrada: 'fuga' },
    ...(noPatio ? [{ id: ladoD + '2', rot: 'NO PÁTIO', lado: ladoD, ...R(pPatio), guarda: true, entrada: 'fuga' }] : [])
  ];
  const entradas = [
    { id: 'sede', rot: noPatio ? 'PÁTIO DA SEDE' : 'PORTÃO DA SEDE', lado: ladoA, ...R(alvo), raio: 44, dir: [0, -1] },
    { id: 'fuga', rot: 'FIM DA RUA', lado: ladoD, ...R(pFuga), raio: 46, dir: [-s, 0] }
  ];
  /* A FAIXA de quem defende, no muro da frente, do lado do portão (o ponto
     é na calçada, rente ao muro; o `dir` aponta pro muro) */
  const ladoF = -s, pF = soltar(pPortao[0] + ladoF * 3.4 * pxm, pPortao[1] - 0.4 * pxm, 50);
  const faixas = pF ? { [ladoD]: { ...R(pF), len: 110, dir: [0, -1] } } : {};
  const gatilho = { x: Math.round(pPortao[0]), y: Math.round(pPortao[1]), raio: Math.round(6.5 * pxm), lado: ladoA,
                    rot: 'PORTÃO DA SEDE', espera: 'a sede ainda não te viu', aviso: 'gritaram no portão — a sede inteira veio pra rua' };
  const pmPostos = [R(soltar(90, yRua) || pFuga), R(soltar(TAB.W - 90, yRua) || pA1)];
  const cena = {
    id: 'sede@3d', base: 'bar', tres: true, nome: 'Sede',
    local: 'Na sede da ' + (Tc.nome || 'torcida rival'),
    largura: TAB.W, altura: TAB.H, celula: TAB.CEL, imagem: null, mascara: Tb.mascara(),
    blocos: [], enfeites: [], varais: [], grades: [], pintura: null, tropaChoque: false,
    espalharBonde: ladoD,
    saida: nosAtacamos
      ? { perto: 'Tomar a sede', longe: (noPatio ? 'Pátio' : 'Portão') + ' da sede (leve o líder)', feito: 'sua torcida tomou a porta da sede deles',
          dica: noPatio ? 'Leve o líder pelo portão até o pátio da sede.' : 'Leve o líder até o portão da sede.' }
      : { perto: 'Largar a sede', longe: 'Fim da rua (leve o líder)', feito: 'sua torcida largou a sede e saiu pela rua', dica: 'Pra largar a sede, leve o líder até o fim da rua.' },
    spawns, entradas, faixas, gatilho, pmPostos,
    ...fugasDe(Tb, P)
  };
  const centro = patio || [(a.x0 + a.x1) / 2, (a.y0 + a.y1) / 2];
  return { cena, noMundo: Tb.noMundo, doMundo: Tb.doMundo, u: Tb.u, v: Tb.v, chao: Tb.chao, escala: Tb.K,
           predio: { x: centro[0], z: centro[1] }, area: { x0: a.x0, x1: a.x1, z0: a.y0, z1: a.y1 },
           lugar: { tipo: 'sede', torcida: Tc.id, noPatio }, malha: Tb.malha, COLS: Tb.COLS, ROWS: Tb.ROWS };
}

/* =========================================================
   O PORTÃO DO ESTÁDIO DO CLUBE
   ========================================================= */
/* `est`: o de planta.estadios() (o modelo, o centro, o giro). `o`: {
   ladoAtaca }. A caravana (quem ataca) chega da rua, os seguranças estão
   na boca do Portão 1 (o do mandante). Devolve { cena, ... } ou { erro } */
export function brigaNoPortao(ctx, est, o = {}) {
  const M = ctx.M, P = ctx.P;
  const rotas = est && est.modelo ? ROTAS_ESTADIOS[est.modelo] : null;
  if (!rotas || !est.centro) return { erro: 'o estádio do clube não tem portão no mapa' };
  if (!ctx.grade) return { erro: 'a praça não tem a grade do passo' };
  /* o modelo no mundo (o mesmo de dia_de_jogo.js): girado e na escala do mapa */
  const th = -(est.giro || 0) * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const mundo = (x, z) => [est.centro[0] + M * (x * cs + z * sn), est.centro[1] + M * (-x * sn + z * cs)];
  const dirMundo = (x, z) => [x * cs + z * sn, -x * sn + z * cs];
  const Pt = rotas.portoes.find(p => p.lado === 'mandante') || rotas.portoes[0];
  if (!Pt || !Pt.boca || !Pt.eixo) return { erro: 'o portão do estádio não tem boca' };
  const boca = mundo(Pt.boca[0], Pt.boca[2]);
  /* pra fora do estádio: o contrário do eixo do portão (que entra) */
  const w = dirMundo(Pt.eixo.w[0], Pt.eixo.w[1]), fora = [-w[0], -w[1]];
  /* o tabuleiro: o y sai do portão pra rua (v = fora), o x corre ao longo da fachada */
  const u = [fora[1], -fora[0]];
  const c = [boca[0] + fora[0] * 7 * M, boca[1] + fora[1] * 7 * M];
  const Tb = tabuleiro(ctx, c, u, null);
  const { pxm, soltar, R, doMundo } = Tb;
  const pBoca = doMundo(boca[0], boca[1]);
  const xM = TAB.W / 2;
  /* quem chega vem da rua (o chão da cena é o que se liga a ela), e o resto cai nesse chão */
  const pA1 = soltar(xM - 1.5 * pxm, pBoca[1] + 16 * pxm, 300);
  if (!pA1) return { erro: 'a frente do ' + (est.nome || 'estádio') + ' não cabe no tabuleiro' };
  Tb.ligar([pA1]);
  const pA2 = soltar(xM + 2.5 * pxm, pBoca[1] + 18 * pxm);
  const pPortao = soltar(pBoca[0], pBoca[1], 120);
  if (!pPortao || Math.hypot(pPortao[0] - pBoca[0], pPortao[1] - pBoca[1]) > 3.5 * pxm) return { erro: 'da rua não se chega no portão do ' + (est.nome || 'estádio') + ' andando' };
  const pS1 = soltar(pBoca[0], pBoca[1] + 1.2 * pxm, 90), pS2 = soltar(pBoca[0] + 3 * pxm, pBoca[1] + 2.2 * pxm, 90);
  /* a saída dos seguranças: rente à fachada, pro lado de lá */
  const pSaiS = soltar(pBoca[0] > xM ? 90 : TAB.W - 90, pBoca[1] + 1.5 * pxm, 300) || soltar(xM, TAB.H - 40, 300);
  if (!pS1 || !pSaiS) return { erro: 'a frente do ' + (est.nome || 'estádio') + ' não cabe no tabuleiro' };
  const ladoA = o.ladoAtaca === 'visitante' ? 'visitante' : 'mandante', ladoD = ladoA === 'mandante' ? 'visitante' : 'mandante';
  const spawns = [
    { id: ladoA + '1', rot: '1º ESCALÃO', lado: ladoA, ...R(pA1), jogador: true, entrada: 'portao' },
    ...(pA2 ? [{ id: ladoA + '2', rot: '2º ESCALÃO', lado: ladoA, ...R(pA2), entrada: 'portao' }] : []),
    { id: ladoD + '1', rot: 'SEGURANÇA DO CLUBE', lado: ladoD, ...R(pS1), entrada: 'lateral' },
    ...(pS2 ? [{ id: ladoD + '2', rot: 'ROUPEIRO E CIA', lado: ladoD, ...R(pS2), entrada: 'lateral' }] : [])
  ];
  const entradas = [
    { id: 'portao', rot: (Pt.nome || 'PORTÃO').toUpperCase(), lado: ladoA, ...R(pPortao), raio: 50, dir: [0, -1] },
    { id: 'lateral', rot: 'LATERAL DO ESTÁDIO', lado: ladoD, ...R(pSaiS), raio: 46, dir: [pBoca[0] > xM ? -1 : 1, 0] }
  ];
  /* a PM demora (é a casa do clube): ela vem pela rua, de longe */
  const pmPostos = [R(soltar(60, TAB.H - 60) || pA1), R(soltar(TAB.W - 60, TAB.H - 60) || pA1)];
  const cena = {
    id: 'ct@3d', base: 'ct', tres: true, nome: 'Clube',
    local: 'No portão do ' + (est.nome || 'estádio') + ', a casa do clube',
    largura: TAB.W, altura: TAB.H, celula: TAB.CEL, imagem: null, mascara: Tb.mascara(),
    blocos: [], enfeites: [], varais: [], grades: [], pintura: null,
    saida: { perto: 'Chegar no portão', longe: 'Portão do estádio (leve o líder)',
             feito: 'a torcida chegou no portão e o clube ouviu o que tinha de ouvir', dica: 'Leve o líder até o portão do estádio.' },
    spawns, entradas, pmPostos,
    ...fugasDe(Tb, P)
  };
  return { cena, noMundo: Tb.noMundo, doMundo: Tb.doMundo, u: Tb.u, v: Tb.v, chao: Tb.chao, escala: Tb.K,
           lugar: { tipo: 'portao', estadio: est.nome, portao: Pt.nome }, malha: Tb.malha, COLS: Tb.COLS, ROWS: Tb.ROWS };
}
