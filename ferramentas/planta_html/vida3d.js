/* =========================================================
   A VIDA DA PRAÇA NO JOGO 3D (27/09/2026)

   O dono: "Preciso que a sede da torcida selecionada tenha vida, com
   atividades dentro dela acontecendo, e o presidente fica sentado na
   sua sala enquanto as mensagens chegam em formato de balão na cadeira
   de alguém que senta na frente dele. A reunião da diretoria agora
   acontece dentro da sede 3D mesmo, numa sala que tem mesas e
   cadeiras. Os bares das torcidas são frequentados pelos membros que
   aparecem no mapa e se locomovem até lá, e o jogo em dias comuns vai
   ter pessoas comuns andando nas calçadas. Alguns bonecos pelas ruas
   vão ser membros uniformizados de alguma torcida. O dia passa até
   ocorrer alguma coisa de acordo com a ideia do feed."

   Quatro pedaços, todos em cima do cenário (cenario.js, `C.vida`) e do
   jogo de feed (o mesmo main.js):

   - O RELÓGIO DO DIA: o dia vai das 7h às 23h na tela (a luz, o céu, o
     movimento da rua) e cada mensagem cai na hora dela (feed.js dá horas
     crescentes às do dia). O relógio do jogo pergunta aqui quanto esperar
     (`ritmo`); decisão sem resposta, painel ou cena param os dois.
   - A SEDE COM GENTE: os membros do save nos lugares que a sede marca
     (sede3d.js, `lugares`): à mesa, no balcão, na sinuca, no pebolim, na
     bateria, no alojamento, na estante — quantos pela hora e pelo que o
     expediente do turno manda (festa enche, treino de bateria põe os
     ritmistas nos surdos). Quem chega e quem vai embora anda: da calçada
     até o lugar, pela porta, desviando da parede e do móvel.
   - A SALA DO PRESIDENTE: ele sentado na mesa dele; cada mensagem que
     cai senta alguém na cadeira da frente (quem fala: o diretor, o
     olheiro, o repórter, o enviado de outra torcida) e o cartão dela vira
     o balão em cima dessa cadeira, com os mesmos botões do feed. A
     REUNIÃO DA DIRETORIA é a mesma do jogo (a pauta, os balões, as
     decisões), com a diretoria sentada na mesa de reunião da sede.
   - A RUA: gente comum andando nas calçadas (algumas de camisa de
     torcida), atravessando nas esquinas; e em cada bar de torcida, os
     membros dela na porta, e outros chegando a pé pela calçada.
   ========================================================= */

import { palcoDeBriga } from './palco_briga.js';

const hashTxt = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const frac = s => (hashTxt(s) % 10000) / 10000;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* a altura do quadril do boneco sentado (m, do pé): o assento do lugar
   menos ela é quanto o disco sobe do chão (a cadeira de plástico, de
   53 cm, fica quase no chão; a banqueta do balcão, de 88, levanta ele) */
const QUADRIL_M = 0.5;
/* o disco de um boneco da vida: o que o bonecos3.js lê (o resto, zero) */
function disco(o) {
  return Object.assign({ vivo: true, lider: false, passada: 1.1, derrubado: 0, golpe: 0, apanhou: 0, atordoado: 0, esquivou: 0,
                         tremor: 0, defendendo: 0, hostil: 0, inimigoPerto: 0, chamou: -99, linha: 'frente', mundo: true }, o);
}
/* as roupas de quem não é de torcida */
const CAMISAS = ['#f2f2ee', '#d8d8d2', '#3a5f9e', '#b8342c', '#2f7a46', '#e0b83a', '#262626', '#7b4a8e', '#e07a3a', '#5aa0c8', '#c9c2b0', '#8a1f2a'];
const CALCAS = ['#2b3a55', '#1f2226', '#5f6368', '#b9a98a', '#3c4a2a', '#23355f', '#6b4a2e'];

/* =======================================================
   O RELÓGIO DO DIA
   ======================================================= */
/* o dia na tela: das 7h às 23h em DIA_MS a 1× (o 2× do jogo vale aqui) */
const DIA_MS = 9000, INI = 7 * 60, FIM = 23 * 60, MS_MIN = DIA_MS / (FIM - INI), NOITE_MS = 700;
const minutoDe = hora => { const m = /^(\d\d?):(\d\d)/.exec(String(hora || '')); return m ? +m[1] * 60 + +m[2] : null; };
export const horaTxt = min => { const m = Math.round(min) % (24 * 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

function criarRelogio(C) {
  let agora = INI, alvo = INI, virada = null;
  const E = () => TO.estado && TO.estado.E;
  const vel = () => (TO.diaJogo && TO.diaJogo.ponte && TO.diaJogo.ponte.velocidade) || 1;
  /* o tempo do jogo parado (decisão sem resposta, painel, modal, cena): o relógio da tela para junto */
  const parado = () => {
    const e = E();
    return !e || !TO.tela || TO.tela.tempoPausado() || TO.feed.travado(e) || document.body.classList.contains('em-cena');
  };
  const doDia = (e, m) => m && m.quando && e && e.data && m.quando.abs === e.data.absoluto;
  const ritmo = {
    /* quanto a próxima mensagem da fila espera (ms a 1×): até a hora dela */
    antesDaProxima(e) {
      const m = (e.feedFila || [])[0];
      if (!m || !doDia(e, m)) return 0;
      const h = minutoDe(m.hora);
      if (h == null) return 0;
      alvo = clamp(h, agora, FIM);
      return (alvo - agora) * MS_MIN;
    },
    /* o dia sem mais nada: até as 23h, e a noite */
    diaVazio() { alvo = FIM; return (FIM - agora) * MS_MIN + NOITE_MS; },
    /* caiu uma mensagem: o relógio está na hora dela */
    caiu(e, m) { if (doDia(e, m)) { const h = minutoDe(m.hora); if (h != null) agora = alvo = Math.max(agora, Math.min(FIM, h)); } },
    /* dia novo: a noite passa num instante e amanhece às 7h */
    virouDia() { virada = { de: Math.max(agora, 21 * 60), t: 0 }; agora = alvo = INI; }
  };
  let horaVista = null;
  function quadro(dt) {
    if (!parado() && agora < alvo) agora = Math.min(alvo, agora + dt * 1000 * vel() / MS_MIN);
    /* a luz: na virada, das 23h às 7h do dia seguinte em meio segundo */
    let h = agora / 60;
    if (virada) {
      virada.t += dt / 0.6;
      if (virada.t >= 1) virada = null;
      else h = (virada.de + (INI + 24 * 60 - virada.de) * virada.t) / 60;
    }
    if (horaVista == null || Math.abs(h - horaVista) > 0.004) { horaVista = h; C.vida.hora(h); }
  }
  return { ritmo, quadro, get minuto() { return agora; }, get hora() { return agora / 60; },
           /* pro teste: o relógio numa hora (min) */
           definir(min) { agora = alvo = clamp(min, 0, FIM); virada = null; } };
}

/* A PARTE DA TELA QUE A CIDADE MOSTRA: da coluna de ícones até o feed
   (quando aberto) — é ali que a câmera põe a sala e o balão fica */
function areaLivre() {
  const W = innerWidth, menu = document.querySelector('.feed-menu'), rolo = document.querySelector('.feed-rolo');
  const x0 = menu ? Math.max(0, menu.getBoundingClientRect().right) : 0;
  const aberto = rolo && !document.body.classList.contains('feed-fechado') && W > 760;
  const x1 = aberto ? Math.min(W, rolo.getBoundingClientRect().left) : W;
  return { x0, x1, meio: (x0 + x1) / 2, W };
}
/* voar até (x, z) pondo o ponto no meio da parte livre da tela: o alvo
   da câmera anda pro lado (pra direita da tela, se o feed está aberto) */
function voarNaAreaLivre(Cn, M, x, z, dist, el) {
  /* com a briga na cidade a câmera é dela (vai atrás do líder) */
  if (Cn.vida && Cn.vida.palco && Cn.vida.palco.seguir) return;
  const A = areaLivre(), az = Cn.orb.az, H = innerHeight || 800;
  const porPx = 2 * dist * Math.tan(21 * Math.PI / 180) / H;
  const desl = (A.W / 2 - A.meio) * porPx;
  Cn.voarPara(x + Math.cos(az) * desl, z - Math.sin(az) * desl, dist, el, az);
}

/* =======================================================
   ANDAR: A GRADE DE PERTO E O CAMINHO (A*)
   ======================================================= */
/* a grade de um retângulo do mundo, de `passo` em `passo` m: onde um
   corpo de `raio` m cabe (a grade do passo do cenário: parede, móvel) */
function gradeLocal(C, M, r, passo = 0.25, raio = 0.2) {
  const p = passo * M, nx = Math.max(1, Math.ceil((r.x1 - r.x0) / p)), nz = Math.max(1, Math.ceil((r.z1 - r.z0) / p));
  const livre = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++)
    livre[j * nx + i] = C.vida.cabe(r.x0 + (i + 0.5) * p, r.z0 + (j + 0.5) * p, raio) ? 1 : 0;
  const cel = (x, z) => { const i = Math.floor((x - r.x0) / p), j = Math.floor((z - r.z0) / p); return i < 0 || j < 0 || i >= nx || j >= nz ? -1 : j * nx + i; };
  const centro = k => ({ x: r.x0 + (k % nx + 0.5) * p, z: r.z0 + (Math.floor(k / nx) + 0.5) * p });
  /* a célula livre mais perto de (x, z), até `ate` m */
  function perto(x, z, ate = 1.2) {
    const k0 = cel(x, z);
    if (k0 >= 0 && livre[k0]) return k0;
    const i0 = Math.floor((x - r.x0) / p), j0 = Math.floor((z - r.z0) / p), R = Math.ceil(ate / passo);
    let melhor = -1, md = Infinity;
    for (let j = j0 - R; j <= j0 + R; j++) for (let i = i0 - R; i <= i0 + R; i++) {
      if (i < 0 || j < 0 || i >= nx || j >= nz || !livre[j * nx + i]) continue;
      const c = centro(j * nx + i), d = (c.x - x) ** 2 + (c.z - z) ** 2;
      if (d < md) { md = d; melhor = j * nx + i; }
    }
    return melhor;
  }
  return { nx, nz, livre, r, p, cel, centro, perto };
}
/* o caminho de A até B na grade (8 vizinhos, sem cortar quina), já
   alisado (de cada ponto, o mais longe que se vê em linha reta) */
function caminhoNaGrade(G, ax, az, bx, bz) {
  const a = G.perto(ax, az), b = G.perto(bx, bz);
  if (a < 0 || b < 0) return null;
  const { nx, nz, livre } = G, N = nx * nz;
  const g = new Float32Array(N).fill(Infinity), pai = new Int32Array(N).fill(-1), fechado = new Uint8Array(N);
  const bi = b % nx, bj = Math.floor(b / nx);
  const hEst = k => { const di = Math.abs(k % nx - bi), dj = Math.abs(Math.floor(k / nx) - bj); return Math.max(di, dj) + 0.414 * Math.min(di, dj); };
  /* a fila de prioridade (heap binário) */
  const heap = [], f = new Float32Array(N);
  const sobe = i => { while (i > 0) { const q = (i - 1) >> 1; if (f[heap[q]] <= f[heap[i]]) break; [heap[q], heap[i]] = [heap[i], heap[q]]; i = q; } };
  const desce = i => { for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && f[heap[l]] < f[heap[m]]) m = l; if (r < heap.length && f[heap[r]] < f[heap[m]]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } };
  g[a] = 0; f[a] = hEst(a); heap.push(a);
  const VIZ = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let achou = false, voltas = 0;
  while (heap.length && voltas++ < 60000) {
    const k = heap[0], ult = heap.pop();
    if (heap.length) { heap[0] = ult; desce(0); }
    if (fechado[k]) continue;
    fechado[k] = 1;
    if (k === b) { achou = true; break; }
    const i = k % nx, j = Math.floor(k / nx);
    for (const [di, dj, c] of VIZ) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
      const q = jj * nx + ii;
      if (!livre[q] || fechado[q]) continue;
      if (di && dj && (!livre[j * nx + ii] || !livre[jj * nx + i])) continue;
      const ng = g[k] + c;
      if (ng < g[q]) { g[q] = ng; pai[q] = k; f[q] = ng + hEst(q); heap.push(q); sobe(heap.length - 1); }
    }
  }
  if (!achou) return null;
  const cels = [];
  for (let k = b; k >= 0; k = pai[k]) cels.push(k);
  cels.reverse();
  /* alisar: de cada ponto, pula pro mais longe que se vê */
  const ve = (k0, k1) => {
    const a0 = G.centro(k0), a1 = G.centro(k1), n = Math.ceil(Math.hypot(a1.x - a0.x, a1.z - a0.z) / (G.p * 0.5));
    for (let s = 1; s < n; s++) { const c = G.cel(a0.x + (a1.x - a0.x) * s / n, a0.z + (a1.z - a0.z) * s / n); if (c < 0 || !livre[c]) return false; }
    return true;
  };
  const pts = [G.centro(cels[0])];
  let i = 0;
  while (i < cels.length - 1) {
    let j = cels.length - 1;
    while (j > i + 1 && !ve(cels[i], cels[j])) j--;
    pts.push(G.centro(cels[j]));
    i = j;
  }
  return pts;
}
/* anda um disco pela lista de pontos (m/s): devolve true quando chegou */
function andarPor(p, dt, M) {
  const alvo = p.rota[p.iRota];
  if (!alvo) return true;
  const d = p.d, dx = alvo.x - d.x, dz = alvo.z - d.y, L = Math.hypot(dx, dz), passo = p.vel * M * dt;
  if (L <= passo) { d.x = alvo.x; d.y = alvo.z; p.iRota++; return p.iRota >= p.rota.length; }
  d.x += dx / L * passo; d.y += dz / L * passo;
  return false;
}

/* =======================================================
   A VIDA
   ======================================================= */
export function criarVida(api) {
  const M = api.M;
  const C = () => api.cenario;
  const E = () => TO.estado && TO.estado.E;
  const relogio = criarRelogio({ get vida() { return C().vida; } });
  /* o jogo do quadro que o cenário desenha (os discos da vida) */
  const J = { t: 0, discos: [], falante: null, reuniao: false };
  let ligada = false, sede = null, rua = null, praca = null, tAcc = 0;

  /* ---------- quem é quem ---------- */
  const coresDoJogador = () => {
    const e = E();
    if (!e || !e.torcida) return { cor: '#b02a22', cor2: '#f2f2ee', cor3: '#111111', nome: 'TORCIDA' };
    const c = TO.mundo && TO.mundo.coresDaTorcida ? TO.mundo.coresDaTorcida(e.torcida) : { cor: e.torcida.cores[0], cor2: e.torcida.cores[1], cor3: e.torcida.cores[2] };
    return { cor: c.cor, cor2: c.cor2, cor3: c.cor3, nome: e.torcida.nome };
  };
  const nomeDe = m => (TO.membros && TO.membros.nomeDe ? TO.membros.nomeDe(m) : (m.apelido || m.nome || 'membro'));
  /* o membro de camisa da torcida do jogador */
  const membroDisco = (m, extra) => {
    const c = coresDoJogador();
    return disco(Object.assign({ nome: nomeDe(m) + '#' + m.id, spawn: 'sede', torcida: c.nome, cor: c.cor, cor2: c.cor2, cor3: c.cor3, membroId: m.id }, extra));
  };

  /* =====================================================
     A SEDE
     ===================================================== */
  function montarSede(T) {
    const S3 = T && T.sede3d;
    if (!S3 || !S3.lugares || !S3.lugares.length) return null;
    const a = S3.area, folga = 4.5 * M;
    const r = { x0: a.x0 - folga, x1: a.x1 + folga, z0: a.y0 - folga, z1: a.y1 + folga };
    const lugares = S3.lugares.map(l => Object.assign({}, l, { ocupado: null }));
    const porTipo = t => lugares.filter(l => l.tipo === t);
    const s = {
      T, S3, r, lugares, porTipo, G: null, pessoas: [], presidente: null, recado: null,
      porta: T.porta ? { x: T.porta.x, z: T.porta.y } : { x: (a.x0 + a.x1) / 2, z: a.y1 + 3 * M },
      /* o retângulo da sede (a câmera e as portas) */
      caixa: { x0: a.x0, x1: a.x1, z0: a.y0, z1: a.y1 }
    };
    /* a sala do presidente: o cômodo do lugar dele */
    const lp = porTipo('presidente')[0];
    s.sala = lp ? S3.comodos.find(c => c.tipo === lp.comodo && lp.x >= c.x0 - 1 && lp.x <= c.x1 + 1 && lp.z >= c.z0 - 1 && lp.z <= c.z1 + 1) : null;
    return s;
  }
  /* a grade de andar da sede (a primeira vez que alguém anda nela) */
  const gradeDaSede = () => { if (!sede.G && C().vida.grade) sede.G = gradeLocal(C(), M, sede.r); return sede.G; };
  const altDe = l => l.chao + (l.sentado ? Math.max(0, (l.assento - QUADRIL_M)) * M : 0);
  function sentarNo(p, l) {
    const d = p.d;
    d.x = l.x; d.y = l.z; d.alt = altDe(l); d.rumo = l.rumo; d.sentado = !!l.sentado;
    d.jeito = l.sentado ? (l.gesto === 'digita' ? 'trabalho' : 'sentado') : 'sede';
    /* o gesto do móvel (a sinuca, o surdo, o pebolim...) é o do lugar; o de
       conversa varia (o jeito sorteia) */
    d.gestoForcado = ['digita', 'sinuca', 'pebolim', 'surdo', 'churrasco', 'arruma', 'balcao'].includes(l.gesto) ? l.gesto : undefined;
    if (l.tipo === 'roda') d.jeito = 'sede';
    p.lugar = l; l.ocupado = p; p.estado = 'no lugar';
  }
  function levantar(p) {
    const d = p.d;
    if (p.lugar) { p.lugar.ocupado = null; p.lugar = null; }
    d.sentado = false; d.rumo = undefined; d.jeito = undefined; d.gestoForcado = undefined; d.olhaPara = null; d.falando = false;
    d.alt = C().vida.chao(d.x, d.y);
  }
  /* alguém vai do ponto (x, z) até o lugar l (ou até a porta: l nulo, e some) */
  function mandarAndar(p, l, deX, deZ) {
    const G = gradeDaSede();
    const ax = l ? l.x : sede.porta.x, az = l ? l.z : sede.porta.z;
    const rota = G ? caminhoNaGrade(G, deX, deZ, ax, az) : null;
    if (!rota) { if (l) sentarNo(p, l); else p.sai = true; return; }
    levantar(p);
    p.d.x = deX; p.d.y = deZ;
    p.rota = rota.concat([{ x: ax, z: az }]); p.iRota = 1; p.vel = 1.15 + frac(p.d.nome + 'v') * 0.35;
    p.destino = l; if (l) l.ocupado = p;
    p.estado = 'andando';
  }
  /* quantos na sede agora: a hora e o que o expediente do turno manda */
  function alvoDaSede() {
    const e = E(), h = relogio.hora;
    const turno = h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite';
    const acao = e && e.expediente ? e.expediente[turno] : null;
    const base = h < 8 ? 0.15 : h < 12 ? 0.35 : h < 18 ? 0.5 : h < 22 ? 0.7 : 0.35;
    const extra = { festa: 0.45, bateria: 0.15, recrutar: 0.12, reuniao: 0.1, padrinho: 0.1 }[acao] || 0;
    return { frac: clamp(base + extra, 0, 1), acao, turno };
  }
  /* os membros que podem estar na sede (de pé, da matriz; o presidente é do lugar dele) */
  function membrosLivres() {
    const e = E();
    if (!e) return [];
    const pres = TO.membros && TO.membros.presidente ? TO.membros.presidente(e) : null;
    const dentro = new Set(sede.pessoas.map(p => p.m && p.m.id));
    return (e.membros || []).filter(m => !m.preso && !m.ferido && !m.filial && !(pres && m.id === pres.id) && !dentro.has(m.id));
  }
  /* os lugares que o turno prefere (o treino de bateria: os surdos; o recrutamento: a secretaria) */
  function lugaresDoTurno(acao) {
    const livres = sede.lugares.filter(l => !l.ocupado && !/^(presidente|recado|reuniao)/.test(l.tipo));
    const peso = l => (acao === 'bateria' && l.tipo === 'bateria' ? 8 : 0) + (acao === 'recrutar' && /secretario|espera/.test(l.tipo) ? 6 : 0) +
      (acao === 'festa' && /roda|mesa|balcao|churrasco|banco/.test(l.tipo) ? 4 : 0) + (acao === 'reuniao' && l.tipo === 'reuniao' ? 5 : 0) +
      (l.tipo === 'secretario' ? 3 : 0) + (l.tipo === 'barman' ? 2 : 0) + 1 + frac(l.i + '|' + (E() && E().data.absoluto)) * 2;
    return livres.sort((x, y) => peso(y) - peso(x));
  }
  function ligarSede(T) {
    desligarSede();
    sede = montarSede(T);
    if (!sede) return;
    /* as portas da sede abertas (a folha fechada não é parede pra quem anda: aberta, ninguém atravessa ela) */
    C().vida.abrirPortas({ x0: sede.caixa.x0 - M, x1: sede.caixa.x1 + M, z0: sede.caixa.z0 - M, z1: sede.caixa.z1 + M }, true);
    /* o presidente na cadeira dele */
    const e = E(), pres = e && TO.membros.presidente ? TO.membros.presidente(e) : null, lp = sede.porTipo('presidente')[0];
    if (lp) {
      const p = { m: pres, d: membroDisco(pres || { id: 0, apelido: 'Presidente' }, { cabecaForcada: 'bone' }), presidente: true };
      sentarNo(p, lp);
      sede.pessoas.push(p); sede.presidente = p;
    }
    /* a sede já com o movimento da hora (sem ninguém andando na chegada) */
    const alvo = alvoDaSede(), livres = membrosLivres(), ls = lugaresDoTurno(alvo.acao);
    const n = Math.min(livres.length, Math.round(ls.length * alvo.frac));
    const ordem = livres.map(m => [frac(m.id + '|' + (e ? e.data.absoluto : 0)), m]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    for (let k = 0; k < n; k++) {
      const p = { m: ordem[k], d: membroDisco(ordem[k]) };
      sentarNo(p, ls[k]);
      sede.pessoas.push(p);
    }
    sede.proxTroca = 4;
  }
  function desligarSede() {
    if (sede) C().vida.abrirPortas({ x0: sede.caixa.x0 - M, x1: sede.caixa.x1 + M, z0: sede.caixa.z0 - M, z1: sede.caixa.z1 + M }, false);
    sede = null; fecharBalao(true);
  }
  /* a cada quadro: quem anda anda; de tempos em tempos alguém chega ou vai */
  function quadroSede(dt) {
    if (!sede) return;
    for (const p of sede.pessoas) {
      if (p.estado !== 'andando') continue;
      if (andarPor(p, dt, M)) {
        if (p.destino) sentarNo(p, p.destino); else p.sai = true;
      } else p.d.alt = C().vida.chao(p.d.x, p.d.y);
    }
    sede.pessoas = sede.pessoas.filter(p => !p.sai);
    if (reuniao3d) return;                // na reunião a sede fica como está
    sede.proxTroca -= dt;
    if (sede.proxTroca > 0) return;
    sede.proxTroca = 3 + Math.random() * 5;
    const alvo = alvoDaSede();
    const quem = sede.pessoas.filter(p => !p.presidente && !p.recado);
    const cabem = lugaresDoTurno(alvo.acao);
    const quer = Math.round((quem.length + cabem.length) * alvo.frac);
    const andando = quem.filter(p => p.estado === 'andando').length;
    if (andando >= 3) return;
    if (quem.length < quer && cabem.length) {
      /* chega alguém: da calçada até um lugar livre */
      const m = membrosLivres()[Math.floor(Math.random() * 6)];
      if (!m) return;
      const p = { m, d: membroDisco(m) };
      sede.pessoas.push(p);
      mandarAndar(p, cabem[Math.floor(Math.random() * Math.min(4, cabem.length))], sede.porta.x, sede.porta.z);
    } else if (quem.length > quer + 1 || (quem.length && Math.random() < 0.35)) {
      /* alguém vai embora, ou muda de lugar */
      const p = quem.filter(q => q.estado === 'no lugar')[Math.floor(Math.random() * quem.length)];
      if (!p) return;
      const l = p.lugar;
      if (quem.length <= quer && cabem.length && Math.random() < 0.6) mandarAndar(p, cabem[Math.floor(Math.random() * cabem.length)], l.x, l.z);
      else mandarAndar(p, null, l.x, l.z);
    }
  }

  /* =====================================================
     A SALA DO PRESIDENTE: o recado e o balão
     ===================================================== */
  let balao = null, msgBalao = null, vistoFeed = 0, tiraRecado = 0, desligarAncora = null;
  /* quem vem falar: pela voz da mensagem */
  function quemTraz(m) {
    const e = E(), c = coresDoJogador(), voz = m.voz || '';
    const dir = (e.membros || []).filter(x => x.cargo === 'diretoria' && !x.preso && !x.presidente);
    const pega = (lista, chave) => lista.length ? lista[hashTxt(chave) % lista.length] : null;
    if (voz === 'jornal') return disco({ nome: 'repórter ' + (m.id % 7), spawn: 'fora', cor: '#e8e6df', cor2: '#2b3a55', calca: '#2b3a55', cabecaForcada: 'curto' });
    if ((voz === 'torcida' || voz === 'eixo') && m.dados && m.dados.de && TO.mundo && TO.mundo.torcida) {
      const t = TO.mundo.torcida(m.dados.de), cc = t && TO.mundo.coresDaTorcida ? TO.mundo.coresDaTorcida(t) : null;
      if (cc) return disco({ nome: 'enviado ' + m.dados.de, spawn: 'fora', torcida: t.nome, cor: cc.cor, cor2: cc.cor2, cor3: cc.cor3 });
    }
    const olheiro = voz === 'olheiro' ? (e.membros || []).find(x => x.olheiro && !x.preso) : null;
    const mb = olheiro || pega(dir, m.kind || 'x') || pega((e.membros || []).filter(x => !x.preso && !x.presidente), 'm' + m.id);
    return mb ? membroDisco(mb) : disco({ nome: 'membro ' + m.id, spawn: 'sede', torcida: c.nome, cor: c.cor, cor2: c.cor2, cor3: c.cor3 });
  }
  function sentarRecado(m) {
    if (!sede || !sede.presidente) return;
    const l = sede.porTipo('recado').find(x => !x.ocupado || (x.ocupado && x.ocupado.recado)) || sede.porTipo('recado')[0];
    if (!l) return;
    /* quem estava levanta e vai embora */
    if (sede.recado) { const q = sede.recado; q.recado = false; sede.recado = null; mandarAndar(q, null, q.d.x, q.d.y); }
    if (l.ocupado && !l.ocupado.recado) { const q = l.ocupado; mandarAndar(q, null, q.d.x, q.d.y); }
    const p = { m: null, d: quemTraz(m), recado: true };
    sentarNo(p, l);
    p.d.jeito = 'sentado'; p.d.gestoForcado = undefined;
    p.d.falando = true; p.d.olhaPara = sede.presidente.d;
    sede.pessoas.push(p); sede.recado = p;
    /* o presidente vira pra ele (no barracão a cadeira gira) e escuta */
    const pd = sede.presidente.d, lp = sede.presidente.lugar;
    if (lp && lp.rumoConversa != null) pd.rumo = lp.rumoConversa;
    pd.olhaPara = p.d; pd.jeito = 'sentado';
  }
  function soltarRecado() {
    if (!sede) return;
    const pd = sede.presidente && sede.presidente.d, lp = sede.presidente && sede.presidente.lugar;
    if (pd) { pd.olhaPara = null; pd.jeito = 'trabalho'; if (lp) pd.rumo = lp.rumo; }
    if (sede.recado) { const q = sede.recado; q.recado = false; q.d.falando = false; q.d.olhaPara = null; sede.recado = null; mandarAndar(q, null, q.d.x, q.d.y); }
  }
  /* O BALÃO: o cartão da mensagem (o mesmo do feed, com os botões) em
     cima de quem veio falar; sem a sala na tela, ele encosta no alto */
  function abrirBalao(m) {
    const e = E();
    if (!e || !TO.tela || !TO.tela.cartaoMensagem) return;
    if (!balao) {
      balao = document.createElement('div');
      balao.className = 'j3d-balao';
      balao.innerHTML = '<button class="j3d-balao-x" title="Fechar o balão (a mensagem fica no feed)" aria-label="Fechar o balão">×</button><div class="j3d-balao-corpo"></div><button class="j3d-balao-ir" hidden>Ir pra sala do presidente</button>';
      document.body.appendChild(balao);
      balao.querySelector('.j3d-balao-x').onclick = () => fecharBalao();
      balao.querySelector('.j3d-balao-ir').onclick = () => irPraSala();
    }
    msgBalao = m;
    pintarBalao();
    balao.hidden = false;
    sentarRecado(m);
    tiraRecado = 0;
    if (!desligarAncora) desligarAncora = C().vida.aCadaQuadro(ancorarBalao);
  }
  function pintarBalao() {
    if (!balao || !msgBalao) return;
    const e = E(), corpo = balao.querySelector('.j3d-balao-corpo');
    /* o cartão mais novo da mensagem (a resposta muda ele) */
    const m = (e.feed || []).find(x => x.id === msgBalao.id) || msgBalao;
    msgBalao = m;
    corpo.innerHTML = '';
    const hora = m.hora ? `<div class="j3d-balao-hora">${esc(m.hora)}</div>` : '';
    corpo.insertAdjacentHTML('beforeend', hora);
    corpo.appendChild(TO.tela.cartaoMensagem(e, m));
    balao.classList.toggle('decisao', m.peso === 'decisao' && !m.respondido);
  }
  function fecharBalao(ja) {
    if (balao) balao.hidden = true;
    msgBalao = null;
    if (desligarAncora) { desligarAncora(); desligarAncora = null; }
    if (ja) return;
    soltarRecado();
  }
  const PQ = {}, PQ2 = {};
  function ancorarBalao() {
    if (!balao || balao.hidden || !msgBalao) return;
    const alvo = sede && sede.recado && sede.recado.d;
    const ir = balao.querySelector('.j3d-balao-ir');
    let x = null, y = null;
    if (alvo) {
      const q = C().vida.projetar(alvo.x, alvo.alt + 1.45 * M, alvo.y, PQ);
      if (q.frente && q.x > 40 && q.x < innerWidth - 40 && q.y > 70 && q.y < innerHeight - 20) { x = q.x; y = q.y; }
    }
    const larg = balao.offsetWidth || 320, alto = balao.offsetHeight || 120, A = areaLivre();
    /* debaixo do feed não vale: é como fora da tela */
    if (x != null && (x < A.x0 + 10 || x > A.x1 - 10)) x = null;
    if (x == null) {
      /* a sala fora da tela: o balão encosta no alto, com o botão que volta pra ela */
      balao.classList.add('solto'); ir.hidden = !sede;
      balao.style.left = Math.round(clamp(A.meio - larg / 2, A.x0 + 8, A.x1 - larg - 8)) + 'px'; balao.style.top = '92px';
      return;
    }
    balao.classList.remove('solto'); ir.hidden = true;
    /* O PRESIDENTE À VISTA: o balão abre pro lado contrário ao dele (o rabo
       fica na cabeça de quem fala, perto da ponta do balão) */
    let meio = x;
    const pres = sede && sede.presidente && sede.presidente.d;
    if (pres) {
      const qp = C().vida.projetar(pres.x, pres.alt + 1.2 * M, pres.y, PQ2);
      if (qp.frente && Math.abs(qp.x - x) < larg * 0.6 && qp.y < y + 40) meio = qp.x >= x ? x - larg / 2 + 34 : x + larg / 2 - 34;
    }
    const left = clamp(meio - larg / 2, A.x0 + 8, Math.max(A.x0 + 8, A.x1 - larg - 8));
    const top = Math.max(70, y - alto - 14);
    balao.style.left = Math.round(left) + 'px'; balao.style.top = Math.round(top) + 'px';
    balao.style.setProperty('--rabo', Math.round(clamp(x - left, 16, larg - 16)) + 'px');
  }
  /* o feed: a mensagem que acabou de cair vira balão */
  function olharFeed(dt) {
    const e = E();
    if (!e || !e.feed) return;
    const topo = e.feed[0];
    if (topo && topo.id !== vistoFeed) {
      vistoFeed = topo.id;
      /* a notícia de treta não passa pelo feed (vai pra Notícias) */
      if (topo.kind !== 'confronto' && ligada && !reuniao3d && !document.body.classList.contains('em-cena')) abrirBalao(topo);
    }
    /* a decisão respondida e a notícia lida saem sozinhas */
    if (msgBalao) {
      const m = (e.feed || []).find(x => x.id === msgBalao.id);
      if (m && m.respondido !== msgBalao.respondido) pintarBalao();
      const fica = m && m.peso === 'decisao' && !m.respondido;
      if (!fica) {
        tiraRecado += dt;
        const quanto = m && m.peso === 'decisao' ? 2.5 : 7;
        if (tiraRecado > quanto && !TO.feed.pendentes(e)) fecharBalao();
      } else tiraRecado = 0;
    }
  }

  /* =====================================================
     A RUA: o povo nas calçadas e os bares
     ===================================================== */
  function montarRua() {
    const P = api.planta;
    const aneis = (P.aneis ? P.aneis() : []).map((a, i) => {
      /* a pista do povo: no meio da calçada, puxada pro lado das casas */
      const w = Math.min(a.dentro.x0 - a.fora.x0, a.fora.x1 - a.dentro.x1, a.dentro.y0 - a.fora.y0, a.fora.y1 - a.dentro.y1);
      return { i, fora: a.fora, dentro: a.dentro, w: Math.max(0.8 * M, w) };
    }).filter(a => a.dentro.x1 - a.dentro.x0 > 8 * M && a.dentro.y1 - a.dentro.y0 > 8 * M);
    /* as esquinas de cada anel (no meio da calçada) e, de cada uma, as
       esquinas do outro lado da rua (a travessia) */
    const esquinas = [];
    for (const a of aneis) {
      const o = a.w * 0.5, x0 = a.dentro.x0 - o, x1 = a.dentro.x1 + o, z0 = a.dentro.y0 - o, z1 = a.dentro.y1 + o;
      a.pista = { x0, x1, z0, z1 };
      a.L = 2 * (x1 - x0 + z1 - z0);
      a.cantos = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z], k) => { const q = { a, k, x, z, viz: [] }; esquinas.push(q); return q; });
    }
    const R = 16 * M, ALI = 3 * M;
    esquinas.sort((p, q) => p.x - q.x);
    for (let i = 0; i < esquinas.length; i++) {
      const p = esquinas[i];
      for (let j = i + 1; j < esquinas.length && esquinas[j].x - p.x <= R; j++) {
        const q = esquinas[j];
        if (q.a === p.a) continue;
        const dx = Math.abs(q.x - p.x), dz = Math.abs(q.z - p.z), d = Math.hypot(dx, dz);
        if (d > R || d < 3 * M || (dx > ALI && dz > ALI)) continue;
        p.viz.push(q); q.viz.push(p);
      }
    }
    /* os bares com dono */
    const ts = new Map((P.torcidas ? P.torcidas() : []).map(t => [t.id, t]));
    const bares = (P.bares ? P.bares() : []).filter(b => b.dono && ts.has(b.dono)).map(b => ({ ...b, t: ts.get(b.dono), gente: [], proxChega: 3 + Math.random() * 8 }));
    return { aneis, esquinas, bares, ts: [...ts.values()], povo: [], proxNasce: 0 };
  }
  /* o ponto da pista do anel no parâmetro s (volta inteira em a.L) */
  function pontoDoAnel(a, s, o = {}) {
    const p = a.pista, w = p.x1 - p.x0, h = p.z1 - p.z0;
    s = ((s % a.L) + a.L) % a.L;
    if (s < w) { o.x = p.x0 + s; o.z = p.z0; o.lado = 0; }
    else if (s < w + h) { o.x = p.x1; o.z = p.z0 + (s - w); o.lado = 1; }
    else if (s < 2 * w + h) { o.x = p.x1 - (s - w - h); o.z = p.z1; o.lado = 2; }
    else { o.x = p.x0; o.z = p.z1 - (s - 2 * w - h); o.lado = 3; }
    return o;
  }
  /* o s da esquina k do anel */
  const sDaEsquina = (a, k) => { const p = a.pista, w = p.x1 - p.x0, h = p.z1 - p.z0; return [0, w, w + h, 2 * w + h][k]; };
  /* o s mais perto de (x, z) na pista do anel */
  function sPerto(a, x, z) {
    const p = a.pista, w = p.x1 - p.x0, h = p.z1 - p.z0;
    const cx = clamp(x, p.x0, p.x1), cz = clamp(z, p.z0, p.z1);
    const cands = [[cx - p.x0, Math.abs(z - p.z0)], [w + (cz - p.z0), Math.abs(x - p.x1)], [w + h + (p.x1 - cx), Math.abs(z - p.z1)], [2 * w + h + (p.z1 - cz), Math.abs(x - p.x0)]];
    cands.sort((u, v) => u[1] - v[1]);
    return cands[0][0];
  }
  /* o anel mais perto de (x, z) */
  function anelPerto(x, z) {
    let melhor = null, md = Infinity;
    for (const a of rua.aneis) {
      const p = a.pista, dx = Math.max(p.x0 - x, 0, x - p.x1), dz = Math.max(p.z0 - z, 0, z - p.z1), d = dx * dx + dz * dz;
      if (d < md) { md = d; melhor = a; }
    }
    return melhor;
  }
  /* a camisa do povo: a comum, ou (uns 16%) a de uma torcida da praça, pelo tamanho dela */
  function vestirPovo(sem) {
    const r = frac(sem + 'tc');
    if (r < 0.16 && rua.ts.length) {
      const tot = rua.ts.reduce((s, t) => s + Math.max(20, t.membros || 0), 0);
      let q = frac(sem + 'qual') * tot, t = rua.ts[0];
      for (const u of rua.ts) { q -= Math.max(20, u.membros || 0); if (q <= 0) { t = u; break; } }
      return { torcida: t.nome, cor: t.cor, cor2: t.cor2, cor3: t.cor3 || undefined, uniforme: t.id };
    }
    return { cor: CAMISAS[hashTxt(sem + 'c') % CAMISAS.length], cor2: CAMISAS[hashTxt(sem + 'c2') % CAMISAS.length], calca: CALCAS[hashTxt(sem + 'k') % CALCAS.length] };
  }
  let seqPovo = 0;
  function nascerPedestre(cx, cz, raio) {
    /* num anel que cruza o círculo de raio em volta de onde a câmera olha, longe do meio (não nasce na cara) */
    const perto = rua.aneis.filter(a => { const p = a.pista, dx = Math.max(p.x0 - cx, 0, cx - p.x1), dz = Math.max(p.z0 - cz, 0, cz - p.z1); return dx * dx + dz * dz < raio * raio; });
    if (!perto.length) return null;
    const a = perto[Math.floor(Math.random() * perto.length)];
    let s = Math.random() * a.L, q = pontoDoAnel(a, s);
    for (let k = 0; k < 6 && Math.hypot(q.x - cx, q.z - cz) < raio * 0.45; k++) { s = Math.random() * a.L; q = pontoDoAnel(a, s); }
    const sem = 'povo' + (++seqPovo);
    const d = disco(Object.assign({ nome: sem, spawn: 'rua', x: q.x, y: q.z, alt: C().vida.chao(q.x, q.z), jeito: 'rua', passada: 1.0 + frac(sem + 'p') * 0.25 }, vestirPovo(sem)));
    return { d, a, s, dir: frac(sem + 'd') < 0.5 ? 1 : -1, vel: 1.05 + frac(sem + 'v') * 0.5, lat: (frac(sem + 'l') - 0.5) * 0.5, travessia: null };
  }
  /* anda um pedestre: na pista do anel, e nas esquinas às vezes atravessa */
  function andarPedestre(p, dt) {
    const d = p.d;
    if (p.travessia) {
      /* atravessando a rua, em linha reta até a esquina da frente */
      if (andarPor(p.travessia, dt, M)) { p.a = p.travessia.a; p.s = p.travessia.s; p.travessia = null; }
      d.alt = C().vida.chao(d.x, d.y);
      return;
    }
    const a = p.a, antes = p.s, passo = p.vel * M * dt * p.dir;
    p.s = ((p.s + passo) % a.L + a.L) % a.L;
    /* passou por uma esquina? */
    for (let k = 0; k < 4; k++) {
      const sk = sDaEsquina(a, k);
      const cruzou = p.dir > 0 ? (antes < sk && p.s >= sk) || (antes > p.s && (sk >= antes || sk <= p.s)) : (antes > sk && p.s <= sk) || (antes < p.s && (sk <= antes || sk >= p.s));
      if (!cruzou) continue;
      const esq = a.cantos[k];
      if (esq.viz.length && Math.random() < 0.35) {
        const alvo = esq.viz[Math.floor(Math.random() * esq.viz.length)];
        d.x = esq.x; d.y = esq.z;
        p.travessia = { d, rota: [{ x: alvo.x, z: alvo.z }], iRota: 0, vel: p.vel, a: alvo.a, s: sDaEsquina(alvo.a, alvo.k) };
        p.s = sk;
        return;
      } else if (Math.random() < 0.08) p.dir = -p.dir;
      break;
    }
    const q = pontoDoAnel(a, p.s);
    /* o desvio lateral de cada um (não andam todos na mesma linha) */
    const off = p.lat * a.w * 0.5, nx = q.lado === 1 ? 1 : q.lado === 3 ? -1 : 0, nz = q.lado === 0 ? -1 : q.lado === 2 ? 1 : 0;
    d.x = q.x + nx * off; d.y = q.z + nz * off;
    d.alt = C().vida.chao(d.x, d.y);
  }
  /* A PORTA DO BAR: a turma da torcida dona, em roda, e quem chega a pé */
  function lugarNoBar(b, k) {
    const n = Math.max(3, b.gente.length + 1), ang = k / n * Math.PI * 2 + (b.n || 0);
    const fx = b.porta.fx, fz = b.porta.fy, r = 0.9 * M;
    /* o meio da roda: na calçada, 0,6 m pra fora da porta */
    const cx = b.porta.x + fx * 0.3 * M, cz = b.porta.y + fz * 0.3 * M;
    const x = cx + Math.cos(ang) * r * (fx ? 0.7 : 1.3), z = cz + Math.sin(ang) * r * (fz ? 0.7 : 1.3);
    return { x, z, rumo: Math.atan2(cx - x, cz - z) };
  }
  function discoDoBar(b, sem) {
    const t = b.t;
    return disco({ nome: sem, spawn: 'bar', torcida: t.nome, cor: t.cor, cor2: t.cor2, cor3: t.cor3 || undefined, jeito: 'bar', passada: 1.05 });
  }
  function encherBar(b, n) {
    for (let k = b.gente.length; k < n; k++) {
      const sem = 'bar' + b.n + '|' + (++seqPovo), d = discoDoBar(b, sem), L = lugarNoBar(b, k);
      d.x = L.x; d.y = L.z; d.rumo = L.rumo; d.alt = C().vida.chao(d.x, d.y);
      b.gente.push({ d, k, estado: 'na roda' });
    }
    arrumarRoda(b);
  }
  function arrumarRoda(b) {
    const na = b.gente.filter(g => g.estado === 'na roda');
    na.forEach((g, k) => { const L = lugarNoBar(b, k); g.d.x = L.x; g.d.y = L.z; g.d.rumo = L.rumo; g.d.alt = C().vida.chao(L.x, L.z); });
  }
  /* o caminho pela calçada de (x, z) até a porta do bar: pelas esquinas (Dijkstra no grafo delas) */
  function rotaPelaCalcada(x0, z0, b) {
    const A = anelPerto(x0, z0), B = anelPerto(b.porta.x, b.porta.y);
    if (!A || !B) return null;
    const sA = sPerto(A, x0, z0), sB = sPerto(B, b.porta.x, b.porta.y);
    const pA = pontoDoAnel(A, sA), pB = pontoDoAnel(B, sB);
    if (A === B) return pelaPista(A, sA, sB).concat([{ x: b.porta.x, z: b.porta.y }]);
    /* Dijkstra nas esquinas (poucas centenas): de A (as 4 dele) até B */
    const dist = new Map(), pai = new Map(), aberto = new Set();
    for (const q of A.cantos) { const d = Math.hypot(q.x - pA.x, q.z - pA.z); dist.set(q, d); aberto.add(q); }
    let fim = null;
    while (aberto.size) {
      let u = null, du = Infinity;
      for (const q of aberto) { const d = dist.get(q); if (d < du) { du = d; u = q; } }
      aberto.delete(u);
      if (u.a === B) { fim = u; break; }
      const vizinhos = u.viz.map(v => [v, Math.hypot(v.x - u.x, v.z - u.z) + 6 * M])
        .concat(u.a.cantos.filter(v => v !== u && (Math.abs(v.k - u.k) === 1 || Math.abs(v.k - u.k) === 3)).map(v => [v, Math.hypot(v.x - u.x, v.z - u.z)]));
      for (const [v, c] of vizinhos) {
        const nd = du + c;
        if (nd < (dist.has(v) ? dist.get(v) : Infinity)) { dist.set(v, nd); pai.set(v, u); aberto.add(v); }
      }
      if (dist.size > 4000) break;
    }
    if (!fim) return null;
    const cadeia = [];
    for (let q = fim; q; q = pai.get(q)) cadeia.push(q);
    cadeia.reverse();
    const pts = [{ x: pA.x, z: pA.z }];
    for (const q of cadeia) pts.push({ x: q.x, z: q.z });
    return pts.concat(pelaPista(B, sDaEsquina(B, fim.k), sB).slice(1)).concat([{ x: b.porta.x, z: b.porta.y }]);
  }
  /* os pontos da pista do anel de s0 a s1, pelo lado mais curto */
  function pelaPista(a, s0, s1) {
    const L = a.L, fr = ((s1 - s0) % L + L) % L, dir = fr <= L / 2 ? 1 : -1, tot = dir > 0 ? fr : L - fr;
    const pts = [pontoDoAnel(a, s0, {})];
    for (let k = 0; k < 4; k++) {
      const sk = sDaEsquina(a, k), dd = dir > 0 ? ((sk - s0) % L + L) % L : ((s0 - sk) % L + L) % L;
      if (dd > 0 && dd < tot) pts.push({ ...pontoDoAnel(a, sk, {}), dd });
    }
    const fimP = pontoDoAnel(a, s1, {});
    return pts.slice(0, 1).concat(pts.slice(1).sort((u, v) => u.dd - v.dd)).concat([fimP]).map(q => ({ x: q.x, z: q.z }));
  }
  /* quanta gente na porta do bar pela hora */
  const noBarDaHora = h => h < 8.5 ? 0 : h < 12 ? 2 : h < 17 ? 3 : h < 22.5 ? 6 : 3;
  function quadroRua(dt) {
    if (!rua) return;
    const Cn = C(), orb = Cn.orb, cx = orb.alvo.x, cz = orb.alvo.z, dist = orb.dist;
    const h = relogio.hora;
    /* o povo: quanto mais longe a câmera, maior o círculo (e o teto) */
    const raio = clamp(dist * 0.9, 55 * M, 170 * M);
    const mov = h < 6 ? 0.1 : h < 8 ? 0.4 : h < 12 ? 0.75 : h < 14 ? 0.9 : h < 18 ? 0.8 : h < 21 ? 0.85 : h < 22.5 ? 0.45 : 0.15;
    const quer = Math.round(clamp(Math.PI * (raio / M) ** 2 * 0.0024, 14, 64) * mov);
    /* quem saiu do círculo some; quem falta nasce (um por vez) */
    rua.povo = rua.povo.filter(p => Math.hypot(p.d.x - cx, p.d.y - cz) < raio * 1.25);
    rua.proxNasce -= dt;
    if (rua.povo.length < quer && rua.proxNasce <= 0) {
      const p = nascerPedestre(cx, cz, raio);
      if (p) rua.povo.push(p);
      rua.proxNasce = rua.povo.length < quer * 0.6 ? 0 : 0.35;
    }
    while (rua.povo.length > quer + 4) rua.povo.pop();
    for (const p of rua.povo) andarPedestre(p, dt);
    /* os bares perto: a roda na porta e quem chega */
    for (const b of rua.bares) {
      const longe = Math.hypot(b.porta.x - cx, b.porta.y - cz) > raio * 1.4;
      if (longe) { b.gente = []; continue; }
      const n = noBarDaHora(h) + (hashTxt(b.n + '|' + ((E() && E().data.absoluto) || 0)) % 3);
      const naRoda = b.gente.filter(g => g.estado === 'na roda').length;
      if (!b.gente.length && n) encherBar(b, Math.max(1, n - 1));
      b.proxChega -= dt;
      if (b.proxChega <= 0) {
        b.proxChega = 8 + Math.random() * 14;
        if (naRoda < n) {
          /* chega um membro a pé: de uns 40–90 m, pela calçada */
          const ang = Math.random() * Math.PI * 2, R0 = (40 + Math.random() * 50) * M;
          const x0 = b.porta.x + Math.cos(ang) * R0, z0 = b.porta.y + Math.sin(ang) * R0;
          const rota = rotaPelaCalcada(x0, z0, b);
          if (rota && rota.length > 1) {
            const sem = 'bar' + b.n + '|' + (++seqPovo), d = discoDoBar(b, sem);
            d.x = rota[0].x; d.y = rota[0].z; d.alt = Cn.vida.chao(d.x, d.y); d.jeito = 'rua';
            b.gente.push({ d, estado: 'chegando', rota, iRota: 1, vel: 1.2 + Math.random() * 0.3 });
          }
        } else if (naRoda > n || Math.random() < 0.3) {
          /* um vai embora pela calçada */
          const g = b.gente.find(x => x.estado === 'na roda');
          if (g) {
            const a = anelPerto(g.d.x, g.d.y);
            if (a) { const s = sPerto(a, g.d.x, g.d.y); g.estado = 'indo'; g.d.jeito = 'rua'; g.d.rumo = undefined; g.pista = { a, s, dir: Math.random() < 0.5 ? 1 : -1, vel: 1.3 }; }
          }
        }
      }
      for (const g of b.gente) {
        if (g.estado === 'chegando') {
          if (andarPor(g, dt, M)) { g.estado = 'na roda'; g.d.jeito = 'bar'; arrumarRoda(b); }
          g.d.alt = Cn.vida.chao(g.d.x, g.d.y);
        } else if (g.estado === 'indo') {
          const P0 = g.pista; P0.s += P0.vel * M * dt * P0.dir;
          const q = pontoDoAnel(P0.a, P0.s); g.d.x = q.x; g.d.y = q.z; g.d.alt = Cn.vida.chao(q.x, q.z);
          P0.andou = (P0.andou || 0) + P0.vel * dt;
          if (P0.andou > 60) g.fim = true;
        }
      }
      b.gente = b.gente.filter(g => !g.fim);
    }
  }

  /* =====================================================
     A REUNIÃO NA SALA DA SEDE (o palco do main.js)
     ===================================================== */
  let reuniao3d = null, cadeirasExtras = null;
  /* os lugares da reunião: a mesa da diretoria (a sede grande), a mesa
     comprida do salão (quando a diretoria não cabe lá), o pátio (o
     barracão); e cadeiras a mais em volta, se ainda faltar */
  function lugaresDaReuniao(n) {
    const L = t => sede.porTipo(t);
    const dir = L('reuniao').concat(L('reuniaoCabeca'));
    if (dir.length && n <= dir.length) return { assentos: dir, fala: L('reuniaoFala')[0] || null, mesa: L('reuniaoMesa')[0] || null, sala: 'diretoria' };
    const salao = sede.lugares.filter(l => l.tipo === 'mesa' && l.comodo === 'salao');
    if (salao.length) {
      const xs = salao.map(l => l.x), zs = salao.map(l => l.z);
      const mesa = { x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2, chao: salao[0].chao };
      const assentos = salao.slice();
      /* as cadeiras a mais: em fila atrás das da mesa, viradas pra ela */
      const extras = [];
      for (let k = 0; assentos.length + extras.length < n && k < 40; k++) {
        const base = salao[k % salao.length], vx = base.x - mesa.x, vz = base.z - mesa.z, l = Math.hypot(vx, vz) || 1;
        const passo = 0.7 * M * (1 + Math.floor(k / salao.length));
        extras.push({ tipo: 'extra', comodo: 'salao', x: base.x + vx / l * passo, z: base.z + vz / l * passo * 0.6, rumo: base.rumo, chao: base.chao, sentado: true, assento: 0.53, extra: true });
      }
      /* o presidente fala na cabeceira do salão */
      const xMax = Math.max(...xs), fala = { x: xMax + 1.1 * M, z: mesa.z, rumo: Math.atan2(mesa.x - (xMax + 1.1 * M), 0), chao: mesa.chao };
      return { assentos: assentos.concat(extras), fala, mesa, sala: 'salao', extras };
    }
    /* o barracão: a mesa do pátio e cadeiras em roda */
    const pat = sede.lugares.filter(l => l.tipo === 'mesa' && l.comodo === 'patio');
    const cx = pat.length ? pat.reduce((s, l) => s + l.x, 0) / pat.length : sede.porta.x, cz = pat.length ? pat.reduce((s, l) => s + l.z, 0) / pat.length : sede.porta.z;
    const assentos = pat.slice(), extras = [];
    for (let k = 0; assentos.length + extras.length < n && k < 20; k++) {
      const ang = Math.PI * (0.25 + 1.5 * (k + 0.5) / Math.max(4, n)), r = 1.6 * M;
      const x = cx + Math.cos(ang) * r, z = cz + Math.sin(ang) * r;
      extras.push({ tipo: 'extra', comodo: 'patio', x, z, rumo: Math.atan2(cx - x, cz - z), chao: (pat[0] || sede.lugares[0]).chao, sentado: true, assento: 0.53, extra: true });
    }
    return { assentos: assentos.concat(extras), fala: { x: cx + 1.9 * M, z: cz, rumo: -Math.PI / 2, chao: (pat[0] || sede.lugares[0]).chao }, mesa: { x: cx, z: cz }, sala: 'patio', extras };
  }
  /* as cadeiras a mais (malhas simples, fora do forno: somem no fim) */
  function porCadeirasExtras(lista, THREE) {
    tirarCadeirasExtras();
    if (!lista || !lista.length || !THREE) return;
    const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: '#f1f0ea' });
    const assento = new THREE.BoxGeometry(0.42 * M, 0.04 * M, 0.42 * M), encosto = new THREE.BoxGeometry(0.42 * M, 0.46 * M, 0.04 * M), pe = new THREE.BoxGeometry(0.035 * M, 0.42 * M, 0.035 * M);
    for (const l of lista) {
      const c = new THREE.Group();
      const a = new THREE.Mesh(assento, mat); a.position.y = 0.51 * M; c.add(a);
      const e = new THREE.Mesh(encosto, mat); e.position.set(0, 0.76 * M, -0.19 * M); c.add(e);
      for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = new THREE.Mesh(pe, mat); p.position.set(dx * 0.19 * M, 0.3 * M, dz * 0.19 * M); c.add(p); }
      c.position.set(l.x, l.chao, l.z); c.rotation.y = l.rumo;
      g.add(c);
    }
    g.name = 'cadeiras da reunião';
    C().vida.cena.add(g);
    cadeirasExtras = g;
  }
  function tirarCadeirasExtras() {
    if (!cadeirasExtras) return;
    cadeirasExtras.removeFromParent();
    cadeirasExtras.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    cadeirasExtras = null;
  }
  function palcoDaReuniao() {
    let THREE = null, montado = false, mapa = new Map(), sala = null, versao = 0;
    const PE2 = {};
    const R = {
      /* o contrato do tres.js (a ponte) */
      montar() {
        if (!sede) return false;
        montado = true; mapa = new Map(); sala = null;
        reuniao3d = R;
        fecharBalao();
        document.body.classList.add('palco3d');
        import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js').then(m => { THREE = m; if (sala && sala.extras) porCadeirasExtras(sala.extras, THREE); }).catch(() => {});
        /* quem é da diretoria sai do lugar da sede (vai estar na mesa) */
        C().vida.palco = { get J() { return TO.diaJogo.J || { discos: [], t: 0 }; }, pos: posDoPalco, rumo: rumoDoPalco, comVida: true, semAnel: true };
        return true;
      },
      desenhar(J0) {
        if (!montado || !J0) return;
        if (!sala) prepararSala(J0);
      },
      vetorDoTeclado: () => null,
      trocarCamera() { irPraReuniao(); return 'sala'; },
      MODOS: [{ nome: 'sala', rot: 'a sala da reunião' }],
      limparDeCima() { desmontar(); },
      /* a cabeça do boneco na tela (os balões da reunião no main.js) */
      projetar(d) {
        const q = posDoPalco(d.x, d.y, d, PE2);
        const o = C().vida.projetar(q.x, q.y + (d.sentado ? 1.35 : 1.85) * M, q.z, {});
        if (!o.frente) return null;
        const o2 = C().vida.projetar(q.x, q.y + 0.2 * M, q.z, {});
        return { x: o.x, cima: o.y, baixo: o2.y };
      }
    };
    R.projetar.chave = () => { const c = C().vida.camera; return [versao, c.position.x.toFixed(1), c.position.y.toFixed(1), c.position.z.toFixed(1), innerWidth, innerHeight].join('|'); };
    function prepararSala(J0) {
      const sentados = J0.discos.filter(d => d.sentado).sort((a, b) => (a.membroId || 0) - (b.membroId || 0));
      sala = lugaresDaReuniao(sentados.length);
      sentados.forEach((d, i) => mapa.set(d, sala.assentos[i] || sala.assentos[sala.assentos.length - 1]));
      const lider = J0.discos.find(d => d.lider);
      if (lider && sala.fala) mapa.set(lider, Object.assign({ sentado: false }, sala.fala));
      if (THREE && sala.extras) porCadeirasExtras(sala.extras, THREE);
      /* a vida da sede sai dos lugares da mesa (e o presidente da cadeira dele) */
      for (const p of sede.pessoas.slice()) {
        const ocupa = p.lugar && sala.assentos.includes(p.lugar);
        if (p.presidente || ocupa || (p.m && sentados.some(d => d.membroId === p.m.id))) { levantar(p); p.sai = true; }
      }
      sede.pessoas = sede.pessoas.filter(p => !p.sai);
      if (sede.presidente && !sede.pessoas.includes(sede.presidente)) sede.presidente = null;
      versao++;
      irPraReuniao();
    }
    function posDoPalco(x, y, d, PE) {
      const l = mapa.get(d);
      if (!l) { PE.x = x; PE.y = -1000 * M; PE.z = y; return PE; }
      PE.x = l.x; PE.z = l.z; PE.y = l.chao + (d.sentado ? Math.max(0, (l.assento || 0.53) - QUADRIL_M) * M : 0);
      return PE;
    }
    function rumoDoPalco(d) { const l = mapa.get(d); return l ? l.rumo : d.rumo; }
    function irPraReuniao() {
      if (!sala || !sala.mesa) return;
      voarNaAreaLivre(C(), M, sala.mesa.x, sala.mesa.z, (sala.sala === 'diretoria' ? 10 : 14) * M, 1.02);
    }
    function desmontar() {
      if (!montado) return;
      montado = false; reuniao3d = null;
      document.body.classList.remove('palco3d');
      C().vida.palco = null;
      tirarCadeirasExtras();
      /* a sede volta: o presidente pra cadeira dele */
      if (sede) {
        const lp = sede.porTipo('presidente')[0], e = E(), pres = e && TO.membros.presidente ? TO.membros.presidente(e) : null;
        if (lp && !sede.presidente) { const p = { m: pres, d: membroDisco(pres || { id: 0 }, { cabecaForcada: 'bone' }), presidente: true }; sentarNo(p, lp); sede.pessoas.push(p); sede.presidente = p; }
      }
      irPraSala();
    }
    return R;
  }

  /* =====================================================
     A CÂMERA
     ===================================================== */
  function irPraSala() {
    if (!sede) return;
    const Cn = C(), lp = sede.porTipo('presidente')[0], lr = sede.porTipo('recado')[0];
    /* o meio entre o presidente e a cadeira do recado */
    const x = lr ? (lp.x + lr.x) / 2 : lp.x, z = lr ? (lp.z + lr.z) / 2 : lp.z;
    voarNaAreaLivre(Cn, M, x, z, 9 * M, 1.0);
  }
  function irPraSede() {
    if (!sede) return;
    const Cn = C(), c = sede.caixa;
    voarNaAreaLivre(Cn, M, (c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2, 30 * M, 0.95);
  }

  /* =====================================================
     O QUADRO
     ===================================================== */
  function quadro(dt) {
    J.t += dt;
    relogio.quadro(dt);
    if (!ligada) return;
    tAcc += dt;
    quadroSede(dt);
    olharFeed(dt);
    quadroRua(dt);
    /* os discos do quadro */
    const lista = [];
    if (sede) for (const p of sede.pessoas) lista.push(p.d);
    if (rua) { for (const p of rua.povo) lista.push(p.d); for (const b of rua.bares) for (const g of b.gente) lista.push(g.d); }
    J.discos = lista;
  }
  const vida = { J, quadro };
  /* LIGAR: a praça montada, a torcida do jogador (o id) */
  function ligar(torcidaId) {
    const Cn = C();
    if (!Cn || !Cn.vida) return false;
    praca = Cn.praca;
    const T = (api.planta.torcidas ? api.planta.torcidas() : []).find(t => t.id === torcidaId) || null;
    ligada = true;
    ligarSede(T);
    rua = montarRua();
    vistoFeed = (E() && E().feed && E().feed[0] && E().feed[0].id) || 0;
    Cn.vida.vida = vida;
    /* a sede do jogador sem o telhado (e o alto das paredes): de cima, os
       cômodos. O telhado se acha pela sala do presidente (no barracão o
       meio da sede cai no pátio, que é descoberto) */
    if (sede) {
      const lp = sede.porTipo('presidente')[0];
      const x = lp ? lp.x : (sede.caixa.x0 + sede.caixa.x1) / 2, z = lp ? lp.z : (sede.caixa.z0 + sede.caixa.z1) / 2;
      sede.telhado = Cn.vida.abrirPredio(x, z, 2.2);
    }
    return true;
  }
  function desligar() {
    ligada = false;
    const Cn = C();
    desligarSede(); rua = null; J.discos = [];
    if (Cn && Cn.vida) { Cn.vida.vida = null; Cn.vida.abrirPredio(null); }
  }
  /* a sede do jogador volta a ficar aberta (o palco da briga abriu outro prédio) */
  function reabrirSede() {
    const Cn = C();
    if (!sede || !Cn || !Cn.vida) return;
    const lp = sede.porTipo('presidente')[0];
    const x = lp ? lp.x : (sede.caixa.x0 + sede.caixa.x1) / 2, z = lp ? lp.z : (sede.caixa.z0 + sede.caixa.z1) / 2;
    sede.telhado = Cn.vida.abrirPredio(x, z, 2.2);
  }
  /* A BRIGA NA CASA DA FESTA (a cena 'casa-piscina' do jogo de feed, na
     rua de veraneio da praça): o tabuleiro do combate em cima da casa da
     festa, e o cenário desenhando a briga (palco_briga.js). Quando a cena
     fecha, a câmera volta pra sala do presidente */
  function palcoDaFesta() {
    const B = api.planta.brigaNaFesta ? api.planta.brigaNaFesta() : null;
    if (!B || !TO.dados || !TO.dados.cenas) return null;
    TO.dados.cenas[B.cena.id] = B.cena;
    const R = palcoDeBriga({ C: C(), M, cena: B.cena, noMundo: B.noMundo, u: B.u, v: B.v, chao: B.chao, predio: B.casa, rotAlto: 'a casa inteira, do alto',
                             aoDesmontar: () => { if (ligada) { reabrirSede(); irPraSala(); } } });
    return { local: B.cena.id, renderizador: R };
  }
  /* A CARAVANA NA ESTRADA (as emboscadas 'emb-posto' e 'emb-onibus'): o
     palco à parte, longe da praça — o posto ou a pista com o ônibus —, e a
     câmera salta pra lá; no fim ela volta pra sala do presidente */
  function palcoDaCaravana(local) {
    const Pc = api.planta.palcoDaCaravana ? api.planta.palcoDaCaravana(local) : null;
    if (!Pc || !TO.dados || !TO.dados.cenas) return null;
    const B = Pc.briga;
    TO.dados.cenas[B.cena.id] = B.cena;
    const R = palcoDeBriga({ C: C(), M, cena: B.cena, noMundo: B.noMundo, u: B.u, v: B.v, chao: B.chao, peca: Pc.grupo, livre: true,
                             rotAlto: local === 'emb-posto' ? 'o posto inteiro, do alto' : 'a estrada, do alto',
                             aoDesmontar: () => { if (ligada) { reabrirSede(); irPraSala(); } } });
    return { local: B.cena.id, renderizador: R };
  }
  /* a luz corre mesmo com a vida desligada (no menu, o dia parado nas 10h) */
  return {
    ligar, desligar, quadro, irPraSala, irPraSede, relogio,
    get ritmo() { return relogio.ritmo; },
    /* o palco da cena que tem lugar na sede em 3D: a reunião */
    palcoDe(local, cfg) {
      if (!ligada) return null;
      if (local === 'casa-piscina') return palcoDaFesta();
      if (local === 'emb-posto' || local === 'emb-onibus') return palcoDaCaravana(local);
      if (!sede || !cfg || !cfg.reuniao || !/^sede-|^praca$/.test(local)) return null;
      return { renderizador: palcoDaReuniao() };
    },
    get ligada() { return ligada; },
    /* pro teste */
    get estado() {
      return { ligada, praca, hora: relogio.hora, sede: sede && { pessoas: sede.pessoas.length, andando: sede.pessoas.filter(p => p.estado === 'andando').length,
               presidente: !!sede.presidente, recado: !!sede.recado, lugares: sede.lugares.length }, balao: !!(balao && !balao.hidden), msgBalao: msgBalao && msgBalao.id,
               povo: rua ? rua.povo.length : 0, bares: rua ? rua.bares.map(b => ({ n: b.n, dono: b.dono, gente: b.gente.length, chegando: b.gente.filter(g => g.estado === 'chegando').length })) : [],
               aneis: rua ? rua.aneis.length : 0, reuniao: !!reuniao3d, discos: J.discos.length };
    },
    get sede() { return sede; }, get rua() { return rua; }
  };
}
