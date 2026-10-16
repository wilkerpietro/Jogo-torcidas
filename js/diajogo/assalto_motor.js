(function(){
'use strict';
const U = TO.util;
/* =========================================================
   O ASSALTO — o motor (portado do jogo 3D pro 2D em 10/10/2026;
   cenario3d/js/assalto.js é a origem: a conta é a mesma)

   O ASSALTO — o motor (o jogo 3D, 30/09/2026)

   O dono: "preciso criar uma mecanica de assaltos pra parar de funcionar
   de forma sorteada [...] pro assalto ser executado pelo jogador com
   todos os ambientes sendo entráveis com a mecanica de assalto com o
   objetivo de ser rápido ou furtivo pra não chamar a atenção da polícia,
   inspirado na forma que se assalta no GTA V". E a orientação que veio
   junto: o sistema é de PERCEPÇÃO — planejamento → execução → exposição →
   suspeita → alerta → resultado; o jogador vê a Exposição, a Suspeita e a
   Situação (Normal → Suspeita → Alerta) e decide continuar, reduzir o
   risco ou abortar; o sorteio fica em segundo plano.

   Este arquivo é só a conta (sem three.js, roda no node pro teste): quem
   anda, quem vê quem, quanto cada olhar pesa, quando alguém liga pra
   polícia, quando a polícia chega, quem cai preso, quanto a equipe leva.
   O palco (assalto3d.js) monta o mapa a partir da cidade e da loja,
   desenha os discos como os bonecos da cidade e lê o teclado.

   O MAPA (`mapa`): a grade do chão em volta do alvo, em unidades do mundo
   (M por metro), células de `cel` unidades:
   - `anda[k]`: o corpo cabe (1) ou não (0);
   - `ve[k]`: o olhar passa (1: chão, balcão, vidro da vitrine) ou não
     (0: parede, gôndola alta);
   - `zona[k]`: 0 a rua, 1 o salão da loja (público), 2 a área restrita
     (atrás do balcão, os fundos, o cofre);
   - `pontos`: o carro da fuga, a porta, os caixas, o cofre, as vitrines,
     as prateleiras, o gravador das câmeras, o botão do alarme, os postos
     de quem trabalha (caixa, atendente, gerente, segurança), os pontos
     de quem compra, as câmeras, os postos dos olheiros, por onde a PM
     chega e por onde o povo passa na calçada.

   Os DISCOS são os do boneco da cidade (bonecos3.js lê `x`, `y` — o z do
   mundo —, `alt`, `rumo`, `vivo`, `preso`, `fugindo`, `jeito`, as cores):
   a equipe e o povo em `J.discos`, a PM em `J.policiais`.
   ========================================================= */

/* ---------- a régua ---------- */
const REGUA = {
  /* velocidades (m/s) */
  anda: 2.2, corre: 5.0, povoAnda: 1.3, povoCorre: 4.2, pmCorre: 4.8, pmAnda: 2.0,
  /* o olhar: alcance (m) e meia-abertura (graus) de cada papel */
  olhar: { seguranca: [16, 70], gerente: [12, 65], caixa: [11, 65], atendente: [11, 65], cliente: [9, 60], passante: [10, 60], pm: [18, 75], camera: [11, 45] },
  /* o peso de cada papel no olhar (quem mais repara) */
  repara: { seguranca: 1.45, gerente: 1.2, caixa: 1.0, atendente: 1.0, cliente: 0.55, passante: 0.45, pm: 2.0, camera: 0.6 },
  /* o que cada coisa pesa pra quem vê (por segundo, antes do papel) */
  peso: { anunciado: 3.2, pegando: 2.4, restrita: 1.25, correndo: 0.7, bando: 0.12, enrolando: 0.035, visto: 0 },
  /* quem fica mais de 45 s dentro da loja sem comprar nada começa a chamar a atenção */
  enrola: 45,
  /* a distração: quem conversa prende o olhar do outro por 25 s; o mesmo não cai de novo antes de 40 s */
  conversa: 25, conversaDeNovo: 40,
  /* a desconfiança: de 0 a 1; desconfia em 0,4, alerta em 1; esquece 0,07/s */
  desconfia: 0.4, esquece: 0.07,
  /* a exposição: sobe com o que é visto (×6), desce 1,3/s sem ninguém vendo nada */
  expoGanho: 6, expoCai: 1.3,
  /* o rendido: fica no chão enquanto tem alguém da equipe a 7 m ou o anúncio tem menos de 10 s; sozinho, levanta em 6–12 s */
  vigia: 7, anuncioSegura: 10, soltoMin: 6, soltoMax: 12,
  /* a ligação pra polícia (s) e o botão do alarme (s) */
  ligacao: 4, botao: 1.2,
  /* a PM: a primeira leva no ETA, reforço a cada 15 s, até 4 viaturas de 2 */
  reforco: 15, viaturas: 4, porViatura: 2,
  /* a prisão: o PM encosta (1,1 m) e segura 1,2 s */
  prende: 1.1, segura: 1.2,
  /* a ajuda no saque: cada um da equipe a 2,5 m soma 50% (até 2,5×) */
  ajuda: 2.5, ajudaMax: 2.5,
  /* o carro: a 3 m o líder foge; quem está a 10 m entra junto */
  carro: 3, carroJunto: 10,
  /* o teto do assalto: 8 minutos */
  teto: 480
};

/* ---------- utilidades ---------- */
function rng(semente) {
  let a = (semente >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDif = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
/* o rumo do boneco: 0 olha pro +z (o `atan2(dx, dz)` do mundo) */
const rumoDe = (dx, dz) => Math.atan2(dx, dz);

/* =========================================================
   A GRADE: célula, chão livre, linha de visão, caminho
   ========================================================= */
function grade(mapa) {
  const { x0, z0, cel, nx, nz, anda, ve, zona } = mapa;
  const idx = (x, z) => { const i = Math.floor((x - x0) / cel), j = Math.floor((z - z0) / cel); return i < 0 || j < 0 || i >= nx || j >= nz ? -1 : j * nx + i; };
  const livre = (x, z) => { const k = idx(x, z); return k >= 0 && anda[k] === 1; };
  const zonaEm = (x, z) => { const k = idx(x, z); return k >= 0 ? zona[k] : 0; };
  const centro = k => ({ x: x0 + ((k % nx) + 0.5) * cel, z: z0 + (Math.floor(k / nx) + 0.5) * cel });
  /* a linha de visão: passo de meia célula de a até b, sem célula opaca no meio (as pontas não contam) */
  function enxerga(ax, az, bx, bz) {
    const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / (cel * 0.5));
    for (let s = 1; s < n; s++) {
      const t = s / n, k = idx(ax + (bx - ax) * t, az + (bz - az) * t);
      if (k < 0 || ve[k] === 0) return false;
    }
    return true;
  }
  /* a célula livre mais perto de (x, z), em espiral (até `ate` unidades) */
  function soltar(x, z, ate) {
    const k0 = idx(x, z);
    if (k0 >= 0 && anda[k0]) return k0;
    const r = Math.ceil(ate / cel), i0 = Math.floor((x - x0) / cel), j0 = Math.floor((z - z0) / cel);
    let melhor = -1, md = Infinity;
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      const i = i0 + di, j = j0 + dj;
      if (i < 0 || j < 0 || i >= nx || j >= nz || !anda[j * nx + i]) continue;
      const d = di * di + dj * dj;
      if (d < md) { md = d; melhor = j * nx + i; }
    }
    return melhor;
  }
  /* O CAMINHO (A* em 8 vizinhos, sem cortar quina): lista de pontos do
     mundo, já alisada (pula o ponto que se enxerga do anterior) */
  const G = new Float32Array(nx * nz), P = new Int32Array(nx * nz), F = new Uint32Array(nx * nz), FECHADO = new Uint32Array(nx * nz);
  /* a fila de prioridade: heap binário de pares (f, célula); a entrada velha (a célula já fechada) é pulada na saída */
  let HK = new Int32Array(4096), HF = new Float32Array(4096), hn = 0;
  const push = (k, f) => {
    if (hn >= HK.length) { const k2 = new Int32Array(HK.length * 2), f2 = new Float32Array(HK.length * 2); k2.set(HK); f2.set(HF); HK = k2; HF = f2; }
    let i = hn++;
    while (i > 0) { const p = (i - 1) >> 1; if (HF[p] <= f) break; HK[i] = HK[p]; HF[i] = HF[p]; i = p; }
    HK[i] = k; HF[i] = f;
  };
  const pop = () => {
    const top = HK[0], k = HK[--hn], f = HF[hn];
    let i = 0;
    for (;;) { let c = 2 * i + 1; if (c >= hn) break; if (c + 1 < hn && HF[c + 1] < HF[c]) c++; if (HF[c] >= f) break; HK[i] = HK[c]; HF[i] = HF[c]; i = c; }
    HK[i] = k; HF[i] = f;
    return top;
  };
  let marca = 0;
  function caminho(ax, az, bx, bz, ate) {
    const a = soltar(ax, az, 2 * mapa.M), b = soltar(bx, bz, ate || 2 * mapa.M);
    if (a < 0 || b < 0) return null;
    if (a === b) return [centro(b)];
    marca = (marca + 1) >>> 0 || 1;
    const bi = b % nx, bj = Math.floor(b / nx);
    const h = k => { const di = Math.abs(k % nx - bi), dj = Math.abs(Math.floor(k / nx) - bj); return (Math.max(di, dj) + 0.414 * Math.min(di, dj)); };
    hn = 0;
    F[a] = marca; G[a] = 0; P[a] = -1; push(a, h(a));
    let achou = false;
    while (hn) {
      const k = pop();
      if (FECHADO[k] === marca) continue;
      FECHADO[k] = marca;
      if (k === b) { achou = true; break; }
      const i = k % nx, j = Math.floor(k / nx);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
        const q = jj * nx + ii;
        if (!anda[q] || FECHADO[q] === marca) continue;
        if (di && dj && (!anda[j * nx + ii] || !anda[jj * nx + i])) continue;
        const g = G[k] + (di && dj ? 1.414 : 1);
        if (F[q] === marca && g >= G[q]) continue;
        F[q] = marca; G[q] = g; P[q] = k;
        push(q, g + h(q));
      }
    }
    if (!achou) return null;
    const cels = [];
    for (let k = b; k !== -1; k = P[k]) cels.push(k);
    cels.reverse();
    /* alisar: de cada ponto, o mais longe que se alcança em linha reta andando */
    const reto = (p, q) => {
      const L = Math.hypot(q.x - p.x, q.z - p.z), n = Math.ceil(L / (cel * 0.5));
      for (let s = 1; s < n; s++) { const t = s / n; if (!livre(p.x + (q.x - p.x) * t, p.z + (q.z - p.z) * t)) return false; }
      return true;
    };
    const pts = cels.map(centro), out = [];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !reto(pts[i], pts[j])) j--;
      out.push(pts[j]); i = j;
    }
    return out.length ? out : [pts[pts.length - 1]];
  }
  return { idx, livre, zonaEm, enxerga, caminho, soltar, centro };
}

/* =========================================================
   OS DISCOS
   ========================================================= */
function disco(o) {
  return Object.assign({ vivo: true, lider: false, passada: 1.1, derrubado: 0, golpe: 0, apanhou: 0, atordoado: 0, esquivou: 0,
                         tremor: 0, defendendo: 0, hostil: 0, inimigoPerto: 0, chamou: -99, linha: 'frente', mundo: true,
                         rumo: 0, alt: 0, rota: null, iRota: 0, tRota: 0, vx: 0, vz: 0 }, o);
}
/* as roupas: a equipe de preto e cinza (nada de camisa da torcida num assalto), o povo colorido */
const ROUPA_EQUIPE = [['#1d1f22', '#2a2d31', '#1b1c1f'], ['#2b2e33', '#3b3f45', '#23252a'], ['#3a3d42', '#1c1d20', '#26282c'], ['#141516', '#2f3237', '#202226']];
const CAMISAS = ['#f2f2ee', '#d8d8d2', '#3a5f9e', '#b8342c', '#2f7a46', '#e0b83a', '#7b4a8e', '#e07a3a', '#5aa0c8', '#c9c2b0', '#8a1f2a'];
const CALCAS = ['#2b3a55', '#1f2226', '#5f6368', '#b9a98a', '#3c4a2a', '#23355f', '#6b4a2e'];
/* o uniforme de quem trabalha em cada loja (a camisa e a calça) */
const UNIFORME = {
  banco: ['#e9ecef', '#1f2a44'], joalheria: ['#f4f1ea', '#222222'], supermercado: ['#c62828', '#2b2b2b'],
  posto: ['#f2c230', '#2e3b55'], mercadinho: ['#2f7a46', '#2b3a55'], roupas: ['#111111', '#111111']
};

/* =========================================================
   CRIAR
   `cfg`: { alvo: { id, nome, exposicao, seguranca, movimentacao, atencao,
   dificuldade } (0–100), equipe: [{ id, nome }] (o primeiro é o líder),
   dentro (quantos entram com o líder), abordagem ('furtivo' | 'rapido'),
   horario ('abertura' | 'tarde' | 'fechamento'), noite, calor (a atenção
   da polícia sobre a torcida, 0–100), potencial (R$, o máximo que a loja
   rende pra esse tamanho de equipe), eta (s: sem ele, a conta daqui),
   distDelegacia (m), semente }
   ========================================================= */
function criarAssalto(mapa, cfg) {
  const R = REGUA, M = mapa.M, rnd = rng(cfg.semente || 1), Gd = grade(mapa), P = mapa.pontos;
  const alvo = cfg.alvo || {}, A = k => clamp((alvo[k] ?? 50) / 100, 0, 1);
  const chao = mapa.chao || (() => 0);
  const J = {
    t: 0, mapa, cfg, M, G: Gd, rnd,
    discos: [], policiais: [], projeteis: [], grades: [], paz: true,
    equipe: [], povo: [], cameras: [], saque: [], avisos: [],
    lider: null, anunciado: false, tAnuncio: -99, alerta: false, tAlerta: null, motivoAlerta: '', eta: null, etaConhecido: false,
    silencioso: false, pmChegou: false, tPM: null, viaturas: 0,
    exposicao: 0, suspeita: 0, suspeitaMax: 0, situacao: 'Normal',
    butim: 0, potencial: cfg.potencial || 0, camerasDesligadas: false,
    fim: null, dica: '', acao: null, progresso: null, ordem: 'seguir',
    marcas: []          // o "?" e o "!" em cima de quem desconfia (o palco desenha)
  };
  const noChao = d => { d.alt = chao(d.x, d.y); return d; };
  /* ---- a equipe ---- */
  const eq = cfg.equipe && cfg.equipe.length ? cfg.equipe : [{ id: 'l', nome: _t('Líder') }];
  const dentro = clamp(cfg.dentro ?? eq.length, 1, eq.length);
  const carro = P.carro;
  eq.forEach((m, i) => {
    const roupa = ROUPA_EQUIPE[i % ROUPA_EQUIPE.length];
    const papel = i === 0 ? 'lider' : i < dentro ? 'equipe' : 'olheiro';
    const a = (i / Math.max(1, eq.length)) * Math.PI * 2, r = (0.9 + 0.35 * (i % 3)) * M;
    const k = Gd.soltar(carro.x + Math.cos(a) * r, carro.z + Math.sin(a) * r, 4 * M);
    const c = k >= 0 ? Gd.centro(k) : { x: carro.x, z: carro.z };
    const d = noChao(disco({ id: 'eq' + i, membro: m.id, nome: m.nome || '', papel, lado: 'mandante', lider: i === 0, x: c.x, y: c.z,
                             cor: roupa[0], cor2: roupa[1], calca: roupa[2], carrega: 0, rumo: carro.rumo || 0, passada: 1.15,
                             posto: null, ocupado: 0 }));
    J.equipe.push(d); J.discos.push(d);
  });
  J.lider = J.equipe[0];
  /* os olheiros: um em cada posto (o resto fica no carro, sem boneco) */
  const postosOlheiro = (P.olheiros || []).slice();
  let po = 0;
  for (const d of J.equipe) if (d.papel === 'olheiro') {
    if (po < postosOlheiro.length) { d.posto = postosOlheiro[po++]; }
    else { d.noCarro = true; d.sumiu = true; }
  }
  /* ---- quem trabalha ---- */
  const unif = UNIFORME[alvo.id] || ['#dddddd', '#333333'];
  const papelDo = s => s.papel || 'atendente';
  let nPovo = 0;
  const novoCivil = (papel, x, z, o = {}) => {
    const k = Gd.soltar(x, z, 3 * M), c = k >= 0 ? Gd.centro(k) : { x, z };
    const trabalha = papel !== 'cliente' && papel !== 'passante';
    const roupa = trabalha ? { cor: papel === 'seguranca' ? '#20242a' : unif[0], cor2: papel === 'seguranca' ? '#20242a' : unif[0], calca: papel === 'seguranca' ? '#16181b' : unif[1] }
      : { cor: CAMISAS[Math.floor(rnd() * CAMISAS.length)], cor2: CAMISAS[Math.floor(rnd() * CAMISAS.length)], calca: CALCAS[Math.floor(rnd() * CALCAS.length)] };
    const d = noChao(disco(Object.assign({ id: 'p' + (nPovo++), papel, lado: 'visitante', x: c.x, y: c.z, ...roupa, estado: 'normal', consc: 0, visto: null,
                                          tEstado: 0, tProx: 1 + rnd() * 6, solto: 0, passada: 1.05 }, o)));
    J.povo.push(d); J.discos.push(d);
    return d;
  };
  for (const s of P.funcionarios || []) {
    const d = novoCivil(papelDo(s), s.x, s.z, { posto: s, rumo: s.rumo || 0 });
    d.rumo = s.rumo || 0;
  }
  for (const s of P.segurancas || []) { const d = novoCivil('seguranca', s.x, s.z, { posto: s, rumo: s.rumo || 0, ronda: s.ronda || null }); d.rumo = s.rumo || 0; }
  /* os clientes: pela movimentação e pela hora (a tarde é cheia, a abertura e o fechamento, vazios) */
  const fatorHora = { abertura: 0.55, tarde: 1.25, fechamento: 0.5 }[cfg.horario] || 1;
  const nCli = Math.round(clamp((P.clientes || []).length * A('movimentacao') * fatorHora + (rnd() < 0.5 ? 0 : 1), 0, Math.max(0, (P.clientes || []).length)));
  const cands = (P.clientes || []).slice();
  for (let i = 0; i < nCli && cands.length; i++) {
    const p = cands.splice(Math.floor(rnd() * cands.length), 1)[0];
    novoCivil('cliente', p.x, p.z, { tProx: 2 + rnd() * 5, fica: 40 + rnd() * 70 });
  }
  /* quem passa na calçada: poucos à noite */
  const nPass = Math.round(clamp(((P.rua || []).length ? 4 : 0) * (cfg.noite ? 0.4 : 1) * (0.6 + A('movimentacao')), 0, 7));
  for (let i = 0; i < nPass; i++) {
    const rua = P.rua, a = rua[Math.floor(rnd() * rua.length)];
    novoCivil('passante', a.x, a.z, { tProx: rnd() * 3 });
  }
  /* ---- as câmeras ---- */
  for (const c of P.cameras || []) J.cameras.push({ x: c.x, y: c.z, rumo: c.rumo || 0, alcance: c.alcance || R.olhar.camera[0], abre: c.abre || R.olhar.camera[1], viu: 0 });
  /* ---- o saque ---- */
  for (const s of P.saque || []) J.saque.push({ ...s, y: s.z, prog: 0, vazio: false });
  /* o valor de cada ponto: a parte dele no potencial (o peso de cada um vem da loja) */
  { const soma = J.saque.reduce((s, x) => s + (x.peso || 1), 0) || 1;
    let resto = J.potencial;
    J.saque.forEach((s, i) => { s.valor = i === J.saque.length - 1 ? resto : Math.round(J.potencial * (s.peso || 1) / soma); resto -= s.valor; }); }
  /* ---- o ETA da polícia (s), se o palco não mandou: a delegacia, a segurança da loja, o calor, a noite ---- */
  if (cfg.eta) J.etaBase = cfg.eta;
  else {
    const dm = cfg.distDelegacia != null ? cfg.distDelegacia : 500;
    J.etaBase = clamp(55 + dm / 20 - A('seguranca') * 20 - (cfg.calor || 0) * 0.15 + (cfg.horario === 'fechamento' ? 8 : 0), 18, 95);
  }
  if (cfg.abordagem === 'rapido') J.dica = _t('Entre e anuncie o assalto (Q). Rápido: a polícia vem.');
  else J.dica = _t('Entre como cliente. Sem correr, sem pegar nada com gente olhando.');
  J.aviso = (txt, cor) => { J.avisos.push({ t: J.t, txt, cor: cor || '#fff' }); if (J.avisos.length > 8) J.avisos.shift(); };
  return J;
}

/* =========================================================
   O PASSO
   `ent`: { mx, mz (a direção do líder no mundo, de −1 a 1), correr,
   acao (E segurado), anunciar (Q, uma vez), ordem ('seguir'|'esperar',
   uma vez), fugir (uma vez: o botão do carro), abortar (uma vez) }
   ========================================================= */
function passoAssalto(J, dt, ent = {}) {
  if (J.fim) return J;
  dt = Math.min(dt, 0.1);
  /* em pedaços de até 50 ms: o boneco não atravessa parede no quadro lento */
  let resto = dt;
  while (resto > 1e-6 && !J.fim) {
    const h = Math.min(0.05, resto);
    passo1(J, h, ent);
    resto -= h;
    ent = Object.assign({}, ent, { anunciar: false, ordem: null, fugir: false, abortar: false, distrair: false });
  }
  return J;
}

function passo1(J, dt, ent) {
  const R = REGUA, M = J.M;
  J.t += dt;
  const L = J.lider;
  /* ---- os comandos de uma vez ---- */
  if (ent.abortar) return acabar(J, 'abortou');
  if (ent.ordem) J.ordem = ent.ordem === 'alternar' ? (J.ordem === 'seguir' ? 'esperar' : 'seguir') : ent.ordem;
  if (ent.anunciar && L.vivo && !J.anunciado) anunciar(J, _t('o líder anunciou o assalto'));
  if (ent.distrair && L.vivo && !J.anunciado) mandarDistrair(J);
  /* ---- o líder ---- */
  if (L.vivo && !L.preso) {
    let mx = ent.mx || 0, mz = ent.mz || 0;
    const n = Math.hypot(mx, mz);
    if (n > 1) { mx /= n; mz /= n; }
    const busy = J.progresso && ent.acao;
    const v = (busy ? 0 : ent.correr ? R.corre : R.anda) * M;
    L.correndo = !!ent.correr && n > 0.1 && !busy;
    L.fugindo = L.correndo;
    if (n > 0.05 && !busy) {
      mover(J, L, mx * v * dt, mz * v * dt);
      L.rumo = rumoDe(mx, mz);
    }
    L.alt = (J.mapa.chao || (() => 0))(L.x, L.y);
  }
  /* ---- a ação do líder (E segurado): saque, render, gravador, carro ---- */
  acaoDoLider(J, dt, ent);
  if (J.fim) return;
  /* ---- a equipe e os olheiros ---- */
  for (const d of J.equipe) if (d !== L && d.vivo && !d.preso && !d.noCarro && !d.fugiu) moverEquipe(J, d, dt);
  /* (quanto tempo cada um está dentro da loja: quem enrola chama a atenção) */
  for (const d of J.equipe) d.tDentro = J.G.zonaEm(d.x, d.y) ? (d.tDentro || 0) + dt : Math.max(0, (d.tDentro || 0) - 2 * dt);
  /* ---- o povo ---- */
  for (const d of J.povo) if (!d.fora) moverPovo(J, d, dt);
  /* ---- a PM ---- */
  moverPM(J, dt);
  /* ---- o olhar (5 vezes por segundo) ---- */
  J.tOlhar = (J.tOlhar || 0) - dt;
  if (J.tOlhar <= 0) { const h = 0.2 - J.tOlhar; J.tOlhar = 0.2; perceber(J, h); }
  /* ---- o alarme e a polícia (o silencioso, apertado no anúncio, chega uns segundos depois) ---- */
  if (J.silencio && J.t >= J.silencio && !J.alerta) { darAlerta(J, _t('o alarme silencioso disparou'), true); J.silencio = 0; }
  if (J.alerta && !J.pmChegou && J.t - J.tAlerta >= J.eta) chegaPM(J);
  if (J.pmChegou && J.viaturas < REGUA.viaturas && J.t - J.tPM >= REGUA.reforco * J.viaturas) novaViatura(J);
  /* ---- a situação ---- */
  J.situacao = J.pmChegou ? 'Polícia no local' : J.alerta ? 'Alerta' : (J.suspeita >= 35 || J.exposicao >= 50) ? 'Suspeita' : 'Normal';
  /* ---- o fim: o líder preso, o teto do tempo ---- */
  if (L.preso) return acabar(J, 'lider-preso');
  if (J.t >= REGUA.teto) return acabar(J, 'tempo');
}

/* o movimento com parede: tenta o passo inteiro, depois só x, depois só z */
function mover(J, d, dx, dz) {
  const G = J.G;
  const passos = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (J.mapa.cel * 0.5)));
  const sx = dx / passos, sz = dz / passos;
  for (let i = 0; i < passos; i++) {
    if (G.livre(d.x + sx, d.y + sz)) { d.x += sx; d.y += sz; }
    else if (G.livre(d.x + sx, d.y)) d.x += sx;
    else if (G.livre(d.x, d.y + sz)) d.y += sz;
    else break;
  }
}

/* anda pela rota (lista de pontos do mundo); devolve true quando chegou */
function seguirRota(J, d, v, dt) {
  if (!d.rota || d.iRota >= d.rota.length) return true;
  let passo = v * dt;
  while (passo > 0 && d.iRota < d.rota.length) {
    const q = d.rota[d.iRota], dx = q.x - d.x, dz = q.z - d.y, L = Math.hypot(dx, dz);
    if (L <= passo) { mover(J, d, dx, dz); passo -= L; d.iRota++; }
    else { mover(J, d, dx / L * passo, dz / L * passo); d.rumo = rumoDe(dx, dz); passo = 0; }
  }
  d.alt = (J.mapa.chao || (() => 0))(d.x, d.y);
  return d.iRota >= d.rota.length;
}
function irPara(J, d, x, z, ate) {
  d.rota = J.G.caminho(d.x, d.y, x, z, ate);
  d.iRota = 0; d.destino = { x, z };
  return !!d.rota;
}

/* =========================================================
   A EQUIPE: segue o líder (ou espera onde está); ajuda no saque; vigia
   os rendidos; foge pro carro quando a PM chega
   ========================================================= */
function moverEquipe(J, d, dt) {
  const R = REGUA, M = J.M, L = J.lider;
  d.fugindo = false;
  /* o olheiro: no posto dele, olhando a rua; com a PM no local, vai pro carro */
  if (d.papel === 'olheiro') {
    const alvo = J.pmChegou || J.fimProximo ? J.mapa.pontos.carro : d.posto;
    if (!alvo) return;
    if (Math.hypot(alvo.x - d.x, alvo.z - d.y) > 0.8 * M) {
      d.tRota -= dt;
      if (!d.rota || d.tRota <= 0 || (d.destino && (d.destino.x !== alvo.x || d.destino.z !== alvo.z))) { irPara(J, d, alvo.x, alvo.z); d.tRota = 2.5; }
      const corre = J.pmChegou;
      seguirRota(J, d, (corre ? R.corre * 0.95 : R.anda) * M, dt);
      d.fugindo = corre;
    } else if (alvo.rumo != null) d.rumo = alvo.rumo;
    return;
  }
  /* a PM chegou e a ordem é fugir: todo mundo pro carro */
  if (J.pmChegou && J.fugaGeral) {
    const c = J.mapa.pontos.carro;
    d.tRota -= dt;
    if (!d.rota || d.tRota <= 0) { irPara(J, d, c.x, c.z); d.tRota = 1.5; }
    seguirRota(J, d, R.corre * 0.97 * M, dt); d.fugindo = true;
    return;
  }
  /* A CONVERSA (a distração): vai até quem tem de distrair e fica de papo */
  if (d.missao && d.missao.tipo === 'distrair') {
    const o = d.missao.alvo;
    if (J.anunciado || o.fora || o.estado === 'rendido' || o.estado === 'fugindo' || o.estado === 'alerta' || o.estado === 'ligando' || J.t > d.missao.ate) {
      d.missao = null; d.jeito = null; if (o.conversaCom === d) { o.conversaCom = null; o.jeito = null; }
    } else if (dist(d, o) > 1.3 * M) {
      d.tRota -= dt;
      if (!d.rota || d.tRota <= 0) { irPara(J, d, o.x, o.y, 1.2 * M); d.tRota = 0.8; }
      seguirRota(J, d, R.anda * 1.1 * M, dt);
      return;
    } else {
      if (o.conversaCom !== d) {
        o.conversaCom = d; o.distraidoAte = J.t + R.conversa; o.distraidoEm = J.t; o.rota = null;
        d.missao.ate = J.t + R.conversa;
        J.aviso(_t('{quem} puxou conversa com {alvo}.', {quem:d.nome || _t('Um da equipe'), alvo:nomeDoPapel(o)}), '#cfd8dc');
      }
      d.rumo = rumoDe(o.x - d.x, o.y - d.y); o.rumo = rumoDe(d.x - o.x, d.y - o.y);
      d.jeito = 'conversa'; o.jeito = 'escuta';
      return;
    }
  }
  /* ajudando no saque: fica perto do ponto */
  if (J.progresso && J.progresso.alvo && dist(d, J.progresso.alvo) < R.ajuda * M * 1.6) { d.rumo = rumoDe(J.progresso.alvo.x - d.x, J.progresso.alvo.y - d.y); return; }
  /* esperando: fica onde está, vigiando */
  if (J.ordem === 'esperar') { vigiar(J, d); return; }
  /* seguindo: a uns 1,5–2,5 m do líder, cada um no seu lugar da roda */
  const ang = (parseInt(d.id.slice(2), 10) * 2.4) % (Math.PI * 2), r = (1.4 + (parseInt(d.id.slice(2), 10) % 3) * 0.5) * M;
  const ax = L.x + Math.cos(ang) * r, az = L.y + Math.sin(ang) * r;
  const longe = Math.hypot(ax - d.x, az - d.y);
  if (longe > 0.7 * M) {
    d.tRota -= dt;
    if (!d.rota || d.tRota <= 0) { irPara(J, d, ax, az, 3 * M); d.tRota = 0.6 + ((parseInt(d.id.slice(2), 10) % 4) * 0.1); }
    const corre = L.correndo || longe > 6 * M;
    seguirRota(J, d, (corre ? R.corre : R.anda * 1.05) * M, dt);
    d.fugindo = corre && L.correndo;
    d.correndo = corre;
  } else { d.correndo = false; vigiar(J, d); }
}
const NOME_PAPEL = () => ({ seguranca: _t('o segurança'), caixa: _t('o caixa'), atendente: _t('a atendente'), gerente: _t('o gerente'), cliente: _t('um cliente'), passante: _t('quem passava') });
const nomeDoPapel = o => NOME_PAPEL()[o.papel] || _t('alguém');
/* A DISTRAÇÃO (Z): o da equipe mais perto de quem está mais perto do
   líder (e acordado) vai lá puxar conversa — o outro fica olhando pra ele
   por 25 s e só vê o que acontece colado nele */
function alvoDaConversa(J) {
  const M = J.M, L = J.lider;
  let alvo = null, md = 7 * M;
  for (const o of J.povo) {
    if (o.fora || o.estado !== 'normal' && o.estado !== 'desconfiado') continue;
    if (o.distraidoAte > J.t || (o.distraidoEm && J.t - o.distraidoEm < REGUA.conversaDeNovo)) continue;
    const d = dist(o, L);
    if (d < md) { md = d; alvo = o; }
  }
  return alvo;
}
function mandarDistrair(J) {
  const alvo = alvoDaConversa(J);
  if (!alvo) { J.aviso(_t('Ninguém por perto pra distrair.'), '#cfd8dc'); return; }
  let quem = null, md = Infinity;
  for (const d of J.equipe) {
    if (d === J.lider || !d.vivo || d.preso || d.noCarro || d.papel === 'olheiro' || d.missao) continue;
    const x = dist(d, alvo);
    if (x < md) { md = x; quem = d; }
  }
  if (!quem) { J.aviso(_t('Não sobrou ninguém da equipe pra distrair.'), '#cfd8dc'); return; }
  quem.missao = { tipo: 'distrair', alvo, ate: J.t + 30 };
  quem.rota = null; quem.tRota = 0;
  J.aviso(_t('{quem} vai distrair {alvo}.', {quem:quem.nome || _t('Um da equipe'), alvo:nomeDoPapel(alvo)}), '#cfd8dc');
}
/* parado, olha pro rendido mais perto (quem vigia segura o povo no chão) */
function vigiar(J, d) {
  let m = null, md = Infinity;
  for (const p of J.povo) if (p.estado === 'rendido') { const x = dist(d, p); if (x < md) { md = x; m = p; } }
  if (m && md < REGUA.vigia * J.M) d.rumo = rumoDe(m.x - d.x, m.y - d.y);
}

/* =========================================================
   O POVO: quem trabalha, quem compra, quem passa
   ========================================================= */
function moverPovo(J, d, dt) {
  const R = REGUA, M = J.M, P = J.mapa.pontos, rnd = J.rnd;
  d.tEstado += dt;
  d.fugindo = false;
  if (d.estado === 'rendido') {
    d.jeito = null;
    /* alguém da equipe perto, ou o anúncio fresco: fica no chão */
    const perto = J.equipe.some(e => e.vivo && !e.preso && !e.noCarro && dist(e, d) < R.vigia * M && J.G.enxerga(e.x, e.y, d.x, d.y));
    if (perto || J.t - J.tAnuncio < R.anuncioSegura) d.solto = 0;
    else d.solto += dt;
    if (d.solto > (d.aguenta || (d.aguenta = R.soltoMin + rnd() * (R.soltoMax - R.soltoMin)))) {
      /* levantou: quem trabalha liga, o cliente corre pra porta */
      d.vivo = true; d.preso = false; d.solto = 0; d.aguenta = 0;
      if (d.papel === 'cliente' || d.papel === 'passante') fugirDaLoja(J, d, 'saiu correndo');
      else { d.estado = 'ligando'; d.tEstado = 0; d.jeito = 'celular'; }
    }
    return;
  }
  if (d.estado === 'ligando') {
    d.jeito = 'celular';
    if (d.tEstado >= (d.botao ? R.botao : R.ligacao)) { d.jeito = null; d.estado = 'alerta'; if (!J.alerta) darAlerta(J, d.botao ? _t('o alarme da loja disparou') : (d.papel === 'passante' || d.papel === 'cliente' ? _t('alguém ligou pro 190') : _t('ligaram pro 190')), !!d.botao); d.botao = false; }
    return;
  }
  if (d.estado === 'fugindo') {
    d.fugindo = true;
    if (seguirRota(J, d, R.povoCorre * M, dt)) {
      /* chegou fora: some da cena e liga (se o alerta ainda não saiu) */
      if (!J.alerta && !d.ligou) { d.ligou = true; d.estado = 'ligando'; d.tEstado = 0; d.jeito = 'celular'; d.vivo = true; return; }
      d.fora = true; d.sumiu = true;
    }
    return;
  }
  if (d.estado === 'alerta') {
    /* o segurança vai pra cima do líder; o resto foge */
    if (d.papel === 'seguranca' && !J.anunciado) {
      const L = J.lider;
      if (dist(d, L) > 1.6 * M) { d.tRota -= dt; if (!d.rota || d.tRota <= 0) { irPara(J, d, L.x, L.y, 2 * M); d.tRota = 0.8; } seguirRota(J, d, R.povoAnda * 1.5 * M, dt); }
      else d.rumo = rumoDe(L.x - d.x, L.y - d.y);
      return;
    }
    if (d.papel === 'cliente' || d.papel === 'passante') { fugirDaLoja(J, d, 'fugiu'); return; }
    /* quem trabalha: fica abaixado atrás do balcão */
    return;
  }
  if (d.estado === 'desconfiado') {
    /* para e olha pra quem chamou a atenção */
    if (d.visto) d.rumo = rumoDe(d.visto.x - d.x, d.visto.y - d.y);
    d.jeito = d.papel === 'cliente' ? 'escuta' : null;
    return;
  }
  /* ---- distraído: fica de papo, parado ---- */
  if (d.distraidoAte > J.t && d.conversaCom) { d.jeito = 'escuta'; return; }
  if (d.conversaCom && d.distraidoAte <= J.t) { d.conversaCom = null; }
  /* ---- o normal: a rotina de cada papel ---- */
  d.jeito = null;
  d.tProx -= dt;
  if (d.papel === 'cliente') {
    if (d.rota && d.iRota < d.rota.length) { seguirRota(J, d, R.povoAnda * M, dt); return; }
    if (d.saindo) { d.fora = true; d.sumiu = true; return; }
    if (d.tProx > 0) { if (d.olha) d.rumo = d.olha; return; }
    d.fica = (d.fica || 60) - (d.tProx > -1 ? 6 : 0);
    if (d.fica <= 0 && P.porta && P.saidaRua) { d.saindo = true; irPara(J, d, P.saidaRua.x, P.saidaRua.z); return; }
    const cs = P.clientes || [];
    if (cs.length) { const p = cs[Math.floor(rnd() * cs.length)]; irPara(J, d, p.x, p.z); d.olha = p.rumo; }
    d.tProx = 3 + rnd() * 6;
    return;
  }
  if (d.papel === 'passante') {
    if (d.rota && d.iRota < d.rota.length) { seguirRota(J, d, R.povoAnda * M, dt); return; }
    const rua = P.rua || [];
    if (rua.length && d.tProx <= 0) { const p = rua[Math.floor(rnd() * rua.length)]; irPara(J, d, p.x, p.z); d.tProx = 1 + rnd() * 3; }
    return;
  }
  if (d.papel === 'seguranca') {
    /* a ronda: da porta até um ponto de dentro, e volta */
    if (d.rota && d.iRota < d.rota.length) { seguirRota(J, d, R.povoAnda * 0.8 * M, dt); return; }
    if (d.tProx <= 0 && d.ronda && d.ronda.length) {
      const i = d.iRonda = ((d.iRonda || 0) + 1) % (d.ronda.length + 1);
      const p = i === d.ronda.length ? d.posto : d.ronda[i];
      irPara(J, d, p.x, p.z); d.tProx = 8 + rnd() * 10;
    } else if (!d.rota || d.iRota >= d.rota.length) { const p = d.iRonda && d.ronda && d.iRonda < d.ronda.length ? d.ronda[d.iRonda] : d.posto; if (p && p.rumo != null) d.rumo = p.rumo; }
    return;
  }
  /* caixa, atendente, gerente: no posto; de vez em quando vai aos fundos e volta (a janela do furtivo) */
  if (d.rota && d.iRota < d.rota.length) { seguirRota(J, d, R.povoAnda * M, dt); return; }
  if (d.tProx <= 0) {
    const fundos = P.fundos;
    if (d.naoPosto) { irPara(J, d, d.posto.x, d.posto.z); d.naoPosto = false; d.tProx = 14 + rnd() * 16; }
    else if (fundos && rnd() < 0.5) { irPara(J, d, fundos.x, fundos.z); d.naoPosto = true; d.tProx = 6 + rnd() * 6; }
    else d.tProx = 6 + rnd() * 10;
  } else if (!d.naoPosto && d.posto && d.posto.rumo != null && Math.hypot(d.posto.x - d.x, d.posto.z - d.y) < 0.8 * M) d.rumo = d.posto.rumo;
}
function fugirDaLoja(J, d, txt) {
  const P = J.mapa.pontos;
  d.estado = 'fugindo'; d.tEstado = 0; d.vivo = true; d.preso = false; d.jeito = null;
  const s = P.saidaRua || P.porta;
  /* pra longe do líder: a ponta da calçada mais longe dele */
  let alvo = s;
  const rua = P.fugaPovo || P.rua || [];
  if (rua.length) { let md = -1; for (const p of rua) { const x = Math.hypot(p.x - J.lider.x, p.z - J.lider.y); if (x > md) { md = x; alvo = p; } } }
  if (!irPara(J, d, alvo.x, alvo.z, 3 * J.M)) { d.fora = true; d.sumiu = true; }
}

/* =========================================================
   O OLHAR: quem vê quem, e quanto aquilo pesa
   ========================================================= */
function pesoDe(J, c, obs) {
  const R = REGUA.peso;
  const zona = J.G.zonaEm(c.x, c.y);
  let p = R.visto;
  if ((c.tDentro || 0) > REGUA.enrola) p = Math.max(p, R.enrolando);
  if (J.anunciado) p = Math.max(p, R.anunciado);
  if (c === J.lider && J.progresso && J.progresso.pegando) p = Math.max(p, R.pegando);
  if (c.ajudando) p = Math.max(p, R.pegando * 0.8);
  /* a área restrita: quem trabalha estranha mais */
  if (zona === 2) p = Math.max(p, R.restrita * (obs && obs.papel !== 'cliente' && obs.papel !== 'passante' ? 1.2 : 0.8));
  if (c.correndo) p = Math.max(p, R.correndo);
  /* na rua, à noite, se vê menos */
  if (zona === 0 && J.cfg.noite) p *= 0.6;
  return p;
}
function vê(J, o, c, alcance, abre, rumo) {
  const dx = c.x - o.x, dz = c.y - o.y, L = Math.hypot(dx, dz);
  if (L > alcance * J.M) return 0;
  if (L > 0.8 * J.M && Math.abs(angDif(rumoDe(dx, dz), rumo)) > abre * Math.PI / 180) return 0;
  if (!J.G.enxerga(o.x, o.y, c.x, c.y)) return 0;
  /* perto pesa mais: 1,5× a 2 m, 1× no meio, 0,4× no fim do alcance */
  const f = L / (alcance * J.M);
  return f < 0.2 ? 1.5 : f < 0.6 ? 1.5 - (f - 0.2) * 1.25 : 1 - (f - 0.6) * 1.5;
}
function perceber(J, dt) {
  const R = REGUA, A = k => clamp(((J.cfg.alvo || {})[k] ?? 50) / 100, 0, 1);
  const atencao = 0.55 + A('atencao') * 0.9;               // a atenção da loja (0,55–1,45)
  const equipeVisivel = J.equipe.filter(c => c.vivo && !c.preso && !c.noCarro && !c.sumiu && !c.fugiu);
  let expo = 0, maxS = 0;
  J.marcas.length = 0;
  for (const o of J.povo) {
    if (o.fora || o.estado === 'rendido' || o.estado === 'fugindo' || o.estado === 'ligando') { if (o.estado !== 'fugindo') maxS = Math.max(maxS, o.consc); continue; }
    const [alc0, abre] = R.olhar[o.papel] || R.olhar.cliente;
    /* distraído (a conversa): só vê o que acontece colado nele */
    const distraido = o.distraidoAte > J.t, alc = distraido ? 1.5 : alc0;
    let soma = 0, quem = null, qp = 0, vistos = 0, dentro = 0;
    for (const c of equipeVisivel) {
      if (distraido && c === o.conversaCom) continue;
      const f = vê(J, o, c, alc, abre, o.rumo);
      if (!f) continue;
      vistos++;
      if (J.G.zonaEm(c.x, c.y) !== 0) dentro++;
      const p = pesoDe(J, c, o) * f;
      if (p > qp) { qp = p; quem = c; }
    }
    /* o bando: três ou mais da equipe à vista de uma vez, alguém já dentro da loja */
    if (vistos >= 3 && dentro) qp += R.peso.bando;
    soma = qp * (R.repara[o.papel] || 1) * atencao;
    if (soma > 0.01) {
      o.consc = Math.min(1.2, o.consc + soma * dt);
      o.visto = quem || o.visto;
      expo += soma;
    } else o.consc = Math.max(0, o.consc - R.esquece * dt);
    /* os estados */
    if (o.estado === 'normal' && o.consc >= R.desconfia) { o.estado = 'desconfiado'; o.tEstado = 0; o.rota = null; }
    else if (o.estado === 'desconfiado' && o.consc < R.desconfia * 0.6) { o.estado = 'normal'; o.tEstado = 0; }
    if ((o.estado === 'normal' || o.estado === 'desconfiado') && o.consc >= 1) reagir(J, o);
    if (o.estado === 'desconfiado') J.marcas.push({ d: o, tipo: '?' });
    if (o.estado === 'alerta' || o.estado === 'ligando') J.marcas.push({ d: o, tipo: '!' });
    maxS = Math.max(maxS, o.consc);
  }
  /* AS CÂMERAS: não chamam a polícia, mas gravam (a exposição sobe) */
  if (!J.camerasDesligadas) for (const cam of J.cameras) {
    let qp = 0;
    for (const c of equipeVisivel) { const f = vê(J, cam, c, cam.alcance, cam.abre, cam.rumo); if (f) qp = Math.max(qp, pesoDe(J, c, null) * f); }
    cam.viu = qp;
    if (qp > 0.01) { expo += qp * R.repara.camera; J.gravado = (J.gravado || 0) + qp * dt; }
  }
  /* A PM vendo a equipe: a exposição dispara */
  for (const p of J.policiais) if (p.vivo) for (const c of equipeVisivel) if (vê(J, p, c, R.olhar.pm[0], 180, 0)) { expo += 3; break; }
  J.exposicao = clamp(J.exposicao + (expo > 0 ? expo * R.expoGanho * dt : -R.expoCai * dt), 0, 100);
  J.suspeita = clamp(Math.round(maxS * 100), 0, 100);
  if (J.alerta) J.suspeita = 100;
  J.suspeitaMax = Math.max(J.suspeitaMax, J.suspeita);
}
/* QUEM ESTÁ OLHANDO pra `d` agora (o povo acordado e as câmeras ligadas):
   o olho do HUD e o robô do teste */
function olhosEm(J, d) {
  const R = REGUA, out = [];
  for (const o of J.povo) {
    if (o.fora || o.estado === 'rendido' || o.estado === 'fugindo') continue;
    const [alc0, abre] = R.olhar[o.papel] || R.olhar.cliente, alc = o.distraidoAte > J.t ? 1.5 : alc0;
    if (o.conversaCom === d && o.distraidoAte > J.t) continue;
    if (vê(J, o, d, alc, abre, o.rumo)) out.push(o);
  }
  if (!J.camerasDesligadas) for (const c of J.cameras) if (vê(J, c, d, c.alcance, c.abre, c.rumo)) out.push(Object.assign(c, { camera: true }));
  return out;
}
/* chegou em 1: cada papel reage do seu jeito */
function reagir(J, o) {
  o.estado = 'alerta'; o.tEstado = 0; o.rota = null;
  J.aviso(o.papel === 'seguranca' ? _t('O segurança percebeu!') : o.papel === 'passante' ? _t('Alguém na rua percebeu!') : o.papel === 'cliente' ? _t('Um cliente percebeu!') : _t('Os funcionários perceberam!'), '#ffb74d');
  if (o.papel === 'seguranca') {
    /* o segurança: vai pra cima; se a loja tem botão, aperta no caminho */
    if (J.rnd() < 0.5 + clamp(((J.cfg.alvo || {}).seguranca ?? 50) / 100, 0, 1) * 0.4) { o.estado = 'ligando'; o.tEstado = 0; o.botao = true; }
    return;
  }
  if (o.papel === 'cliente' || o.papel === 'passante') { fugirDaLoja(J, o, 'fugiu'); return; }
  /* quem trabalha: o botão do alarme, se está perto dele; senão, o telefone */
  const perto = (J.mapa.pontos.alarmes || []).some(a => Math.hypot(a.x - o.x, a.z - o.y) < 3 * J.M);
  o.estado = 'ligando'; o.tEstado = 0; o.botao = perto;
}

/* =========================================================
   O ANÚNCIO E O ALERTA
   ========================================================= */
function anunciar(J, txt) {
  const R = REGUA, M = J.M, L = J.lider, seg = clamp(((J.cfg.alvo || {}).seguranca ?? 50) / 100, 0, 1);
  J.anunciado = true; J.tAnuncio = J.t; J.paz = false;
  J.aviso(_t('PERDEU, PERDEU! O assalto foi anunciado.'), '#ff6b6b');
  J.dica = _t('Pegue o que der (E segurado) e volte pro carro antes da polícia.');
  for (const o of J.povo) {
    if (o.fora || o.estado === 'fugindo') continue;
    const d = dist(o, L), perto = J.equipe.some(e => e.vivo && !e.noCarro && !e.sumiu && dist(e, o) < 9 * M && J.G.enxerga(e.x, e.y, o.x, o.y));
    if (!perto) {
      /* sem ninguém da equipe à vista: na rua, quem está perto corre; na
         loja, o cliente escuta o grito e deita, e quem trabalha, metade
         das vezes, se esconde e liga (ou aperta o botão) */
      if (J.G.zonaEm(o.x, o.y) === 0) { if (d < 25 * M) fugirDaLoja(J, o, 'correu'); }
      else if (o.papel !== 'cliente' && J.rnd() < 0.5) { o.estado = 'ligando'; o.tEstado = 0; o.botao = (J.mapa.pontos.alarmes || []).some(a => Math.hypot(a.x - o.x, a.z - o.y) < 3 * M); }
      else render(J, o);
      continue;
    }
    /* o segurança pode reagir e apertar o botão (mais segurança, mais chance) */
    if (o.papel === 'seguranca' && J.rnd() < 0.25 + seg * 0.45) { o.estado = 'ligando'; o.tEstado = 0; o.botao = true; continue; }
    /* o caixa com o botão debaixo do balcão (o silencioso do banco e da joalheria) */
    if ((o.papel === 'caixa' || o.papel === 'gerente') && J.rnd() < seg * 0.55 && (J.mapa.pontos.alarmes || []).some(a => Math.hypot(a.x - o.x, a.z - o.y) < 3 * M)) {
      render(J, o); J.silencio = J.t + 2 + J.rnd() * 5; continue;
    }
    render(J, o);
  }
}
function render(J, o) {
  o.estado = 'rendido'; o.tEstado = 0; o.rota = null; o.jeito = null; o.solto = 0; o.aguenta = 0;
  o.vivo = false; o.preso = true;            // (o boneco senta no chão: a pose do preso)
  o.consc = 1;
}
function darAlerta(J, motivo, botao) {
  if (J.alerta) return;
  J.alerta = true; J.tAlerta = J.t; J.motivoAlerta = motivo;
  const olheiros = J.equipe.filter(d => d.papel === 'olheiro' && !d.noCarro && d.vivo).length;
  /* o botão do alarme vai direto pra central: a polícia vem uns 8 s mais rápido */
  J.eta = Math.max(12, J.etaBase - (botao ? 8 : 0));
  J.etaConhecido = olheiros > 0;
  J.aviso(_t('ALERTA: {motivo}.', {motivo}) + ' ' + (J.etaConhecido ? _t('Os olheiros dizem: polícia em {s} s.', {s:Math.round(J.eta)}) : _t('A polícia está a caminho.')), '#ff5252');
  J.dica = _t('Alerta! Termine rápido e volte pro carro — ou aborte.');
}

/* =========================================================
   A AÇÃO DO LÍDER (E segurado): o que está mais perto dele
   ========================================================= */
function acaoPossivel(J) {
  const R = REGUA, M = J.M, L = J.lider, P = J.mapa.pontos;
  if (!L.vivo || L.preso) return null;
  /* o carro */
  if (P.carro && Math.hypot(P.carro.x - L.x, P.carro.z - L.y) < R.carro * M && (J.butim > 0 || J.alerta || J.anunciado || J.t > 5))
    return { tipo: 'fugir', rot: J.butim > 0 ? _t('Fugir com o butim') : _t('Ir embora') };
  /* o saque */
  let melhor = null, md = 1.3 * M;
  for (const s of J.saque) {
    if (s.vazio) continue;
    const d = Math.hypot(s.x - L.x, s.y - L.y);
    if (d < md) { md = d; melhor = s; }
  }
  if (melhor) return { tipo: 'saque', alvo: melhor, rot: melhor.rot || _t('Pegar') };
  /* o gravador das câmeras */
  if (P.gravador && !J.camerasDesligadas && Math.hypot(P.gravador.x - L.x, P.gravador.z - L.y) < 1.3 * M) return { tipo: 'gravador', rot: _t('Desligar as câmeras') };
  /* render quem está perto (ou quem está ligando) */
  let alvo = null; md = 2.6 * M;
  for (const o of J.povo) {
    if (o.fora || o.estado === 'rendido' || o.estado === 'fugindo') continue;
    const d = dist(o, L);
    if (d < md) { md = d; alvo = o; }
  }
  if (alvo) return { tipo: 'render', alvo, rot: J.anunciado ? _t('Render') : _t('Render (anuncia o assalto)') };
  return null;
}
function acaoDoLider(J, dt, ent) {
  const R = REGUA, M = J.M, L = J.lider;
  for (const d of J.equipe) d.ajudando = false;
  const ac = acaoPossivel(J);
  J.acao = ac;
  /* (o progresso fica no ponto: soltou o E, continua de onde parou) */
  if (J.progresso && (!ac || ac.alvo !== J.progresso.alvo) && !J.progresso.gravador) J.progresso = null;
  if (J.progresso && J.progresso.gravador && (!ac || ac.tipo !== 'gravador')) J.progresso = null;
  if (ent.fugir) { if (ac && ac.tipo === 'fugir') fugir(J); return; }
  if (!ent.acao || !ac) { if (J.progresso) J.progresso.pegando = false; return; }
  if (ac.tipo === 'fugir') { fugir(J); return; }
  if (ac.tipo === 'render') {
    if (!J.anunciado) anunciar(J, _t('rendeu alguém'));
    if (ac.alvo.estado !== 'rendido') { render(J, ac.alvo); J.aviso(_t('Rendido.'), '#fff'); }
    return;
  }
  if (ac.tipo === 'gravador') {
    J.progresso = J.progresso && J.progresso.gravador ? J.progresso : { gravador: true, prog: 0, tempo: 4, pegando: true, alvo: { x: J.mapa.pontos.gravador.x, y: J.mapa.pontos.gravador.z } };
    J.progresso.pegando = true;
    J.progresso.prog += dt;
    if (J.progresso.prog >= J.progresso.tempo) { J.camerasDesligadas = true; J.progresso = null; J.aviso(_t('As câmeras foram desligadas: o que elas gravaram some.'), '#9be7a0'); }
    return;
  }
  /* O SAQUE */
  const s = ac.alvo;
  /* no furtivo, o caixa com o dono do caixa no posto não se pega calado */
  if (!J.anunciado && s.dono) {
    const dono = J.povo.find(o => o.papel === s.dono && !o.fora && o.estado !== 'rendido' && Math.hypot(o.x - s.x, o.y - s.y) < 2.2 * M);
    if (dono) { J.dica = _t('Tem gente no caixa: espere ele sair, ou anuncie (Q).'); J.progresso = null; return; }
  }
  /* o que precisa de mais gente (o cofre) */
  const ajudantes = J.equipe.filter(d => d !== L && d.vivo && !d.preso && !d.noCarro && d.papel !== 'olheiro' && Math.hypot(d.x - s.x, d.y - s.y) < R.ajuda * M);
  const juntos = 1 + ajudantes.length;
  if ((s.precisa || 1) > juntos) { J.dica = _t('Precisa de {n} da equipe aqui (tem {tem}).', {n:s.precisa, tem:juntos}); J.progresso = null; return; }
  if (!J.progresso || J.progresso.alvo !== s) J.progresso = { alvo: s, prog: s.prog, tempo: s.tempo || 3, pegando: true };
  J.progresso.pegando = true;
  for (const d of ajudantes) d.ajudando = true;
  L.rumo = rumoDe(s.x - L.x, s.y - L.y);
  /* quebrar vidro no anunciado faz barulho (quem está perto escuta) */
  const ritmo = Math.min(R.ajudaMax, 1 + 0.5 * ajudantes.length) * (J.anunciado ? 1 : (s.calado || 0.6));
  s.prog += dt * ritmo; J.progresso.prog = s.prog;
  if (s.barulho && !s.fezBarulho && J.anunciado) { s.fezBarulho = true; for (const o of J.povo) if (!o.fora && dist(o, s) < 14 * M) o.consc = Math.min(1.2, o.consc + 0.5); J.exposicao = Math.min(100, J.exposicao + 8); }
  if (s.prog >= s.tempo) {
    s.vazio = true; J.progresso = null;
    const quem = [L, ...ajudantes];
    for (const d of quem) d.carrega += s.valor / quem.length;
    J.butim += s.valor;
    J.aviso(`${s.rot || _t('Pegou')}: +${U.dinheiro(s.valor)}`, '#9be7a0');
  }
}

/* =========================================================
   A POLÍCIA
   ========================================================= */
function chegaPM(J) {
  J.pmChegou = true; J.tPM = J.t;
  J.aviso(_t('A POLÍCIA CHEGOU!'), '#ff5252');
  J.dica = _t('A polícia chegou: volte pro carro (E perto dele) — quem ficar pra trás cai.');
  J.fugaGeral = true;
  novaViatura(J);
}
function novaViatura(J) {
  const P = J.mapa.pontos, pts = P.chegadaPM || [P.carro];
  const e = pts[J.viaturas % pts.length];
  J.viaturas++;
  for (let i = 0; i < REGUA.porViatura; i++) {
    const k = J.G.soltar(e.x + (i - 0.5) * 1.2 * J.M, e.z, 4 * J.M), c = k >= 0 ? J.G.centro(k) : { x: e.x, z: e.z };
    J.policiais.push({ id: 'pm' + J.policiais.length, x: c.x, y: c.z, alt: 0, rumo: e.rumo || 0, vivo: true, escudo: false, cooldown: 0, golpe: 0, carga: false,
                       mundo: true, passada: 1.1, rota: null, iRota: 0, tRota: 0, segurando: null, tSegura: 0 });
  }
}
function moverPM(J, dt) {
  const R = REGUA, M = J.M;
  for (const p of J.policiais) {
    if (!p.vivo) continue;
    p.golpe = Math.max(0, p.golpe - dt);
    p.alt = (J.mapa.chao || (() => 0))(p.x, p.y);
    /* segurando alguém: fica até prender */
    if (p.segurando) {
      const c = p.segurando;
      if (!c.vivo || c.preso || c.fugiu || dist(p, c) > R.prende * M * 1.6) { p.segurando = null; continue; }
      p.tSegura += dt; p.rumo = rumoDe(c.x - p.x, c.y - p.y);
      if (p.tSegura >= R.segura) { prenderMembro(J, c); p.segurando = null; p.golpe = 0.3; }
      continue;
    }
    /* o alvo: o da equipe mais perto (que ainda está na cena) */
    let alvo = null, md = Infinity;
    for (const c of J.equipe) {
      if (!c.vivo || c.preso || c.noCarro || c.sumiu || c.fugiu) continue;
      if (J.policiais.some(q => q !== p && q.segurando === c)) continue;
      const d = dist(p, c);
      if (d < md) { md = d; alvo = c; }
    }
    if (!alvo) continue;
    if (md < R.prende * M) { p.segurando = alvo; p.tSegura = 0; continue; }
    p.tRota -= dt;
    if (!p.rota || p.tRota <= 0) { p.rota = J.G.caminho(p.x, p.y, alvo.x, alvo.y, 2 * M); p.iRota = 0; p.tRota = 0.7; }
    seguirRota(J, p, R.pmCorre * M, dt);
  }
}
function prenderMembro(J, c) {
  c.preso = true; c.vivo = false; c.fugindo = false; c.carrega = Math.round(c.carrega);
  J.aviso(c === J.lider ? _t('O líder caiu!') : _t('{quem} caiu nas mãos da polícia.', {quem:c.nome || _t('Um da equipe')}), '#ff5252');
}

/* =========================================================
   A FUGA E O FIM
   ========================================================= */
function fugir(J) {
  const R = REGUA, M = J.M, c = J.mapa.pontos.carro;
  for (const d of J.equipe) {
    if (!d.vivo || d.preso) continue;
    if (d.noCarro || Math.hypot(d.x - c.x, d.y - c.z) < R.carroJunto * M) { d.fugiu = true; d.sumiu = true; }
  }
  return acabar(J, 'fugiu');
}
function acabar(J, motivo) {
  const R = REGUA, M = J.M;
  /* quem ficou pra trás: com a PM a 15 m, cai; senão, se vira a pé (e larga metade do que leva) */
  for (const d of J.equipe) {
    if (!d.vivo || d.preso || d.fugiu) continue;
    if (d.noCarro) { d.fugiu = true; continue; }
    const pmPerto = J.policiais.some(p => p.vivo && dist(p, d) < 15 * M);
    if (pmPerto || motivo === 'lider-preso' && J.G.zonaEm(d.x, d.y) !== 0) prenderMembro(J, d);
    else { d.fugiu = true; d.aPe = true; d.carrega *= 0.5; }
  }
  const presos = J.equipe.filter(d => d.preso);
  const levou = motivo === 'abortou' && !J.butim ? 0 : Math.round(J.equipe.filter(d => d.fugiu).reduce((s, d) => s + d.carrega, 0));
  J.fim = {
    motivo, fugiu: !J.lider.preso, abortou: motivo === 'abortou', butim: levou, potencial: J.potencial,
    pego: Math.round(J.butim), aPe: J.equipe.filter(d => d.aPe).length,
    presos: presos.map(d => d.membro).filter(x => x != null), exposicao: Math.round(J.exposicao), suspeitaMax: J.suspeitaMax,
    alerta: J.alerta, policia: J.pmChegou, tempo: Math.round(J.t), camerasDesligadas: J.camerasDesligadas,
    gravado: !J.camerasDesligadas && (J.gravado || 0) > 1.5, anunciado: J.anunciado
  };
  return J;
}

TO.assaltoMotor = { REGUA, criarAssalto, passoAssalto, acaoPossivel, olhosEm, alvoDaConversa };
})();
