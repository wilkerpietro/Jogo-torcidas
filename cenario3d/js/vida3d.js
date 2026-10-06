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
     o balão em cima dessa cadeira, com os mesmos botões do feed (o balão
     e a fila dos recados são do mensageiro, recados3d.js). A
     REUNIÃO DA DIRETORIA é a mesma do jogo (a pauta, os balões, as
     decisões), com a diretoria sentada na mesa de reunião da sede.
   - A RUA: gente comum andando nas calçadas (algumas de camisa de
     torcida), atravessando nas esquinas; e em cada bar de torcida, os
     membros dela na porta, e outros chegando a pé pela calçada.
   ========================================================= */

import { palcoDeBriga } from './palco_briga.js?v=33fd37708a';
import { brigaNaCaminhada } from './caminhada.js?v=33fd37708a';
import { brigaNoBar } from './briga_bar.js?v=33fd37708a';
import { brigaNaTreta } from './briga_treta.js?v=33fd37708a';
import { planoDoBar } from './casas3d.js?v=33fd37708a';

const hashTxt = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const frac = s => (hashTxt(s) % 10000) / 10000;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* a altura do quadril do boneco sentado (m, do pé): o assento do lugar
   menos ela é quanto o disco sobe do chão (a cadeira de plástico, de
   53 cm, fica quase no chão; a banqueta do balcão, de 88, levanta ele) */
const QUADRIL_M = 0.5;
/* os gestos que o lugar impõe (o móvel manda: o computador, a sinuca, o
   saco de pancada, o halter, a guarda no ringue, o pincel na faixa, a
   máquina de costura, os instrumentos do pagode e quem canta); os
   outros — a conversa, o celular, a lata — o jeito sorteia */
const GESTOS_DO_LUGAR = new Set(['digita', 'sinuca', 'pebolim', 'surdo', 'churrasco', 'arruma', 'balcao', 'saco', 'halter', 'guarda', 'pinta', 'costura',
                                 'cavaco', 'pandeiro', 'tanta', 'canta']);
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
/* o dia na tela: das 7h às 23h em DIA_MS a 1× (o 2× do jogo vale aqui).
   AS HORAS CORREM ATÉ A PRÓXIMA DECISÃO (o dono, 28/09/2026: "as horas
   pulam rapidamente até ocorrer outro evento de decisão. se o dia não
   tiver nada, ele pula, inclusive, pois o calendário sem nada deixa o
   jogo entediante se as horas passam devagar"): o dia inteiro leva 3,6 s
   (eram 9), a notícia vira aviso e não segura o relógio (recados3d.js),
   o dia em que não cai mensagem nenhuma e a cidade não tem jogo pula na
   hora — sem nem a noite na tela —, e o resto do dia depois da última
   mensagem passa em no máximo um segundo. O que tem de se ver na cidade
   (o jogo de outros clubes, a nossa investida chegando no alvo: dia3d.js)
   pede uma JANELA, um pedaço do dia com o passo mais lento */
const DIA_MS = 3600, INI = 7 * 60, FIM = 23 * 60, MS_MIN = DIA_MS / (FIM - INI), NOITE_MS = 700, VAZIO_MS = 260, RESTO_MS = 1000;
const minutoDe = hora => { const m = /^(\d\d?):(\d\d)/.exec(String(hora || '')); return m ? +m[1] * 60 + +m[2] : null; };
export const horaTxt = min => { const m = Math.round(min) % (24 * 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

function criarRelogio(C) {
  let agora = INI, alvo = INI, virada = null, caiuHoje = false;
  const E = () => TO.estado && TO.estado.E;
  const vel = () => (TO.diaJogo && TO.diaJogo.ponte && TO.diaJogo.ponte.velocidade) || 1;
  /* o tempo do jogo parado (decisão sem resposta, painel, modal, cena): o relógio da tela para junto */
  const parado = () => {
    const e = E();
    return !e || !TO.tela || TO.tela.tempoPausado() || TO.feed.travado(e) || document.body.classList.contains('em-cena');
  };
  const doDia = (e, m) => m && m.quando && e && e.data && m.quando.abs === e.data.absoluto;
  /* AS JANELAS: { de, ate, ms } — de `de` a `ate` (minutos do dia) cada
     minuto de jogo leva `ms` a 1× (fora delas, MS_MIN) */
  const janelas = [];
  const passoEm = min => { for (const j of janelas) if (min >= j.de && min < j.ate) return j.ms; return MS_MIN; };
  const bordas = (a, b) => { const c = [b]; for (const j of janelas) { if (j.de > a && j.de < b) c.push(j.de); if (j.ate > a && j.ate < b) c.push(j.ate); } return c.sort((p, q) => p - q); };
  /* quanto leva (ms a 1×) de `a` a `b` */
  function msEntre(a, b) {
    let t = 0, x = a;
    if (b <= a) return 0;
    for (const c of bordas(a, b)) { t += (c - x) * passoEm((x + c) / 2); x = c; }
    return t;
  }
  /* anda `ms` (a 1×) na direção do alvo, no passo de cada pedaço */
  function avancar(ms) {
    let volta = 0;
    while (ms > 0 && agora < alvo && volta++ < 20) {
      const borda = bordas(agora, alvo)[0], passo = passoEm(agora), cabe = (borda - agora) * passo;
      if (ms >= cabe) { ms -= cabe; agora = borda; } else { agora += ms / passo; ms = 0; }
    }
  }
  const janelaAdiante = () => janelas.some(j => j.ate > agora);
  const ritmo = {
    /* quanto a próxima mensagem da fila espera (ms a 1×): até a hora dela */
    antesDaProxima(e) {
      const m = (e.feedFila || [])[0];
      if (!m || !doDia(e, m)) return 0;
      const h = minutoDe(m.hora);
      if (h == null) return 0;
      alvo = clamp(h, agora, FIM);
      return msEntre(agora, alvo);
    },
    /* o dia sem mais nada: até as 23h, e a noite. O dia vazio (nada caiu e
       a cidade não tem jogo) pula na hora; o resto do dia, em até 1 s */
    diaVazio() {
      if (!caiuHoje && !janelaAdiante() && !(C.temJogo && C.temJogo())) { alvo = agora; return VAZIO_MS; }
      alvo = FIM;
      const ms = msEntre(agora, FIM);
      return (janelaAdiante() ? ms : Math.min(ms, RESTO_MS)) + NOITE_MS;
    },
    /* A TELA AINDA NÃO CHEGOU NA HORA (ms a 1×): o tempo do jogo (main.js)
       conta no relógio da parede, e a tela anda por quadro — no máximo
       0,2 s por quadro. Na máquina lenta a tela ficava pra trás e o dia
       virava com o jogo da cidade no meio (às 18h, antes da bola rolar).
       Agora a mensagem e a virada do dia esperam a tela chegar */
    falta() { return agora < alvo - 0.01 ? msEntre(agora, alvo) : 0; },
    /* caiu uma mensagem: o relógio está na hora dela */
    caiu(e, m) { if (doDia(e, m)) { caiuHoje = true; const h = minutoDe(m.hora); if (h != null) agora = alvo = Math.max(agora, Math.min(FIM, h)); } },
    /* dia novo: a noite passa num instante e amanhece às 7h (o dia que
       pulou nem mostra a noite: a luz fica, e só a data anda) */
    virouDia() { virada = agora > INI + 1 ? { de: Math.max(agora, 21 * 60), t: 0 } : null; agora = alvo = INI; caiuHoje = false; janelas.length = 0; }
  };
  let horaVista = null;
  function quadro(dt) {
    if (!parado() && agora < alvo) avancar(dt * 1000 * vel());
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
           definir(min) { agora = alvo = clamp(min, 0, FIM); virada = null; },
           /* uma janela do dia com o passo mais lento: de `de` a `ate` (min do
              dia), `ms` por minuto de jogo a 1× (dia3d.js: o jogo da cidade,
              a nossa investida chegando no alvo); a virada do dia apaga */
           janela(de, ate, ms) { if (ate > de && ms > 0) janelas.push({ de, ate, ms }); },
           get janelas() { return janelas.map(j => ({ ...j })); } };
}

/* A PARTE DA TELA QUE A CIDADE MOSTRA: da coluna de ícones até a borda
   da direita (o feed saiu da tela, 28/09/2026) — é ali que a câmera põe a
   sala e o balão fica. A coluna da rede social (a do jogo 2D, 06/10/2026),
   aberta, também come a esquerda */
export function areaLivre() {
  const W = innerWidth, menu = document.querySelector('.feed-menu');
  let x0 = menu ? Math.max(0, menu.getBoundingClientRect().right) : 0;
  const rede = document.querySelector('.social-lado');
  if (rede && rede.offsetParent) {
    const r = rede.getBoundingClientRect();
    if (r.width > 0 && r.right < W * 0.6) x0 = Math.max(x0, r.right);
  }
  return { x0, x1: W, meio: (x0 + W) / 2, W };
}
/* voar até (x, z) pondo o ponto no meio da parte livre da tela: o alvo
   da câmera anda pro lado (pra direita da tela, a coluna de ícones come
   a esquerda) */
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
   corpo de `raio` m cabe (a grade do passo do cenário: parede, móvel;
   `cabe`, outra conta — o 1º andar da sede de dois andares) */
function gradeLocal(C, M, r, passo = 0.25, raio = 0.2, cabe = null) {
  const p = passo * M, nx = Math.max(1, Math.ceil((r.x1 - r.x0) / p)), nz = Math.max(1, Math.ceil((r.z1 - r.z0) / p));
  const livre = new Uint8Array(nx * nz), pode = cabe || ((x, z, rr) => C.vida.cabe(x, z, rr));
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++)
    livre[j * nx + i] = pode(r.x0 + (i + 0.5) * p, r.z0 + (j + 0.5) * p, raio) ? 1 : 0;
  /* as ilhas de chão livre (o caminho não corta quina: as 4 vizinhas
     bastam): o miolo do ringue, a bolha atrás da mesa do pagode... */
  const ilha = new Int32Array(nx * nz), fila = new Int32Array(nx * nz);
  let nIlhas = 0;
  for (let k0 = 0; k0 < nx * nz; k0++) {
    if (!livre[k0] || ilha[k0]) continue;
    ilha[k0] = ++nIlhas;
    let ini = 0, fim = 0;
    fila[fim++] = k0;
    while (ini < fim) {
      const k = fila[ini++], i = k % nx, j = (k - i) / nx;
      for (const q of [i > 0 ? k - 1 : -1, i < nx - 1 ? k + 1 : -1, j > 0 ? k - nx : -1, j < nz - 1 ? k + nx : -1])
        if (q >= 0 && livre[q] && !ilha[q]) { ilha[q] = nIlhas; fila[fim++] = q; }
    }
  }
  const cel = (x, z) => { const i = Math.floor((x - r.x0) / p), j = Math.floor((z - r.z0) / p); return i < 0 || j < 0 || i >= nx || j >= nz ? -1 : j * nx + i; };
  const centro = k => ({ x: r.x0 + (k % nx + 0.5) * p, z: r.z0 + (Math.floor(k / nx) + 0.5) * p });
  /* a célula livre mais perto de (x, z), até `ate` m (da ilha `na`, se dada) */
  function perto(x, z, ate = 1.2, na = 0) {
    const k0 = cel(x, z);
    if (k0 >= 0 && livre[k0] && (!na || ilha[k0] === na)) return k0;
    const i0 = Math.floor((x - r.x0) / p), j0 = Math.floor((z - r.z0) / p), R = Math.ceil(ate / passo);
    let melhor = -1, md = Infinity;
    for (let j = j0 - R; j <= j0 + R; j++) for (let i = i0 - R; i <= i0 + R; i++) {
      if (i < 0 || j < 0 || i >= nx || j >= nz || !livre[j * nx + i] || (na && ilha[j * nx + i] !== na)) continue;
      const c = centro(j * nx + i), d = (c.x - x) ** 2 + (c.z - z) ** 2;
      if (d < md) { md = d; melhor = j * nx + i; }
    }
    return melhor;
  }
  return { nx, nz, livre, ilha, r, p, passo, cel, centro, perto };
}
/* o caminho de A até B na grade (8 vizinhos, sem cortar quina), já
   alisado (de cada ponto, o mais longe que se vê em linha reta); `ateB`,
   até onde a célula livre pode ficar do ponto B (o lugar em cima do
   ringue fica longe do chão livre). Se A e B caem em ilhas diferentes: o
   caminho acaba no chão da ilha de A mais perto de B (o miolo do ringue é
   chão livre pra conta, mas cercado pelo tablado: sobe-se nele da beira;
   a cadeira do pagode no canto, atrás da mesa), ou, se não tem, quem sai
   de uma ilha levanta pro chão da ilha de B mais perto dele, até 2 m */
function caminhoNaGrade(G, ax, az, bx, bz, ateB = 1.2) {
  let a = G.perto(ax, az), b = G.perto(bx, bz, ateB);
  if (a < 0 || b < 0) return null;
  if (G.ilha[a] !== G.ilha[b]) {
    const b2 = G.perto(bx, bz, ateB, G.ilha[a]);
    if (b2 >= 0) b = b2;
    else { const a2 = G.perto(ax, az, 2.0, G.ilha[b]); if (a2 < 0) return null; a = a2; }
  }
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
  /* de onde o bonde de uma torcida sai: a porta da sede ou, da torcida sem
     sede no mapa (o nível 0), a do bar dela */
  const casaDe = id => api.casaDe ? api.casaDe(id) : api.sedeDe ? api.sedeDe(id) : null;
  /* o dia tem jogo na cidade (o de outros clubes, dia3d.js): não é dia vazio */
  let temJogoHoje = () => false;
  const relogio = criarRelogio({ get vida() { return C().vida; }, temJogo: () => temJogoHoje() });
  /* dia novo, hóspedes novos (os de ontem já foram pro jogo deles) */
  const virouDia0 = relogio.ritmo.virouDia;
  relogio.ritmo.virouDia = e => { virouDia0(e); if (ligada && sede) poeHospedes(); };
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
      /* A SEDE DE DOIS ANDARES (o nível 5): a escada, o piso de cima e o
         andar que a câmera mostra (0, o térreo, cortado na altura da
         cabeça; 1, o 1º andar) — a grade de cima, a primeira vez que
         alguém anda nele */
      andar: S3.andar || null, vendo: 0, Gc: null, pagode: false,
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
  const gradeDeCima = () => {
    if (!sede.andar || !C().vida.cabeEm) return null;
    if (!sede.Gc) { const y = sede.andar.piso; sede.Gc = gradeLocal(C(), M, sede.r, 0.25, 0.2, (x, z, raio) => C().vida.cabeEm(x, z, y, raio)); }
    return sede.Gc;
  };
  /* O CAMINHO NA SEDE, de um andar pro outro: no andar de saída até a
     ponta da escada, a escada inteira (em linha reta, do pé ao alto: quem
     anda por ela acha cada degrau com o chão a um degrau do pé) e, no
     outro andar, da outra ponta até o destino */
  function rotaNaSede(deX, deZ, de, paraX, paraZ, para, ate = 1.2) {
    const grade = a => a ? gradeDeCima() : gradeDaSede();
    if (!sede.andar || de === para) { const G = grade(para); return G ? caminhoNaGrade(G, deX, deZ, paraX, paraZ, ate) : null; }
    const { pe, topo } = sede.andar.escada, [a, b] = de ? [topo, pe] : [pe, topo];
    const G1 = grade(de), G2 = grade(para);
    const r1 = G1 && caminhoNaGrade(G1, deX, deZ, a.x, a.z), r2 = G2 && caminhoNaGrade(G2, b.x, b.z, paraX, paraZ, ate);
    return r1 && r2 ? r1.concat([{ x: a.x, z: a.z }, { x: b.x, z: b.z }], r2) : null;
  }
  /* o chão de quem anda (na escada, o degrau a um degrau do pé dele; lá em
     cima, na sede de dois andares, ninguém cai pro térreo: sem chão a um
     degrau do pé — quem desce do ringue —, procura meio metro abaixo e,
     sem nada, fica na altura de agora) */
  const chaoDe = (x, z, y) => {
    const Cv = C().vida;
    if (!Cv.chaoEm) return Cv.chao(x, z);
    const c = Cv.chaoEm(x, z, y);
    if (!(sede && sede.andar && y > sede.andar.piso - 0.6 * M && y - c > 0.35 * M)) return c;
    const c2 = Cv.chaoEm(x, z, y - 0.45 * M);
    return y - c2 > 0.8 * M ? y : c2;
  };
  /* (o lugar elevado — o ringue da academia — soma a altura dele) */
  const altDe = l => l.chao + ((l.elevado || 0) + (l.sentado ? Math.max(0, (l.assento - QUADRIL_M)) : 0)) * M;
  function sentarNo(p, l) {
    const d = p.d;
    d.x = l.x; d.y = l.z; d.alt = altDe(l); d.rumo = l.rumo; d.sentado = !!l.sentado;
    d.jeito = l.sentado ? (l.gesto === 'digita' ? 'trabalho' : 'sentado') : 'sede';
    /* o gesto do móvel (a sinuca, o surdo, o pebolim, o saco de pancada,
       o instrumento do pagode...) é o do lugar; o de conversa varia (o
       jeito sorteia) */
    d.gestoForcado = GESTOS_DO_LUGAR.has(l.gesto) ? l.gesto : undefined;
    if (l.tipo === 'roda') d.jeito = 'sede';
    p.lugar = l; l.ocupado = p; p.estado = 'no lugar'; p.andar = l.andar || 0;
  }
  function levantar(p) {
    const d = p.d;
    if (p.lugar) { p.lugar.ocupado = null; p.lugar = null; }
    d.sentado = false; d.rumo = undefined; d.jeito = undefined; d.gestoForcado = undefined; d.olhaPara = null; d.falando = false;
    d.alt = chaoDe(d.x, d.y, d.alt || 0);
  }
  /* alguém vai do ponto (x, z) até o lugar l (ou até a porta: l nulo, e some) */
  function mandarAndar(p, l, deX, deZ) {
    const ax = l ? l.x : sede.porta.x, az = l ? l.z : sede.porta.z;
    /* (quem chega da rua ou sai pra ela está no térreo; o lugar diz o andar
       dele; o lugar elevado — o ringue — se alcança da beira dele) */
    const rota = rotaNaSede(deX, deZ, p.andar || 0, ax, az, l ? l.andar || 0 : 0, l && l.elevado ? 3.0 : 1.2);
    if (!rota) { if (l) sentarNo(p, l); else p.sai = true; return; }
    levantar(p);
    p.d.x = deX; p.d.y = deZ;
    p.rota = rota.concat([{ x: ax, z: az }]); p.iRota = 0; p.vel = 1.15 + frac(p.d.nome + 'v') * 0.35;
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
  /* (o pagode do bar — os músicos na mesa dele — só no turno de festa;
     o treino da academia é todo dia, e o padrinho enche ela; a campanha
     do PIX é do marketing, que quase sempre tem o rapaz no computador) */
  function lugaresDoTurno(acao) {
    const livres = sede.lugares.filter(l => !l.ocupado && !/^(presidente|recado|reuniao)/.test(l.tipo) && (l.tipo !== 'pagode' || acao === 'festa'));
    const h = relogio.hora;
    const peso = l => (acao === 'bateria' && l.tipo === 'bateria' ? 8 : 0) + (acao === 'recrutar' && /secretario|espera/.test(l.tipo) ? 6 : 0) +
      (acao === 'festa' && /roda|mesa|balcao|churrasco|banco/.test(l.tipo) ? 4 : 0) + (acao === 'festa' && l.tipo === 'pagode' ? 9 : 0) +
      (acao === 'reuniao' && l.tipo === 'reuniao' ? 5 : 0) + (acao === 'padrinho' && l.tipo === 'treino' ? 7 : 0) + (acao === 'pix' && l.tipo === 'marketing' ? 6 : 0) +
      (l.tipo === 'secretario' ? 3 : 0) + (l.tipo === 'marketing' && h >= 9 && h < 21 ? 3 : 0) + (l.tipo === 'treino' && h >= 7 && h < 21 ? 1 : 0) +
      (l.tipo === 'barman' ? 2 : 0) + 1 + frac(l.i + '|' + (E() && E().data.absoluto)) * 2;
    return livres.sort((x, y) => peso(y) - peso(x));
  }
  /* O PAGODE DO BAR: os instrumentos na mesa no turno de festa (e quem
     tocava sai dali quando ela acaba) */
  function conferirPagode(acao) {
    const v = acao === 'festa';
    if (!sede || sede.pagode === v) return;
    sede.pagode = v;
    if (api.pagodeDoJogo && sede.T) api.pagodeDoJogo(sede.T.id, v);
    if (!v) for (const p of sede.pessoas) if (p.lugar && p.lugar.tipo === 'pagode' && p.estado === 'no lugar') mandarAndar(p, null, p.lugar.x, p.lugar.z);
  }
  /* O ANDAR QUE A CÂMERA MOSTRA (a sede de dois andares): o térreo, com a
     sede cortada na altura da cabeça de quem está nele (quem está lá em
     cima não aparece), ou o 1º andar, cortado na altura da cabeça de
     quem está nele (o térreo aparece pelo vão do pátio) */
  function verAndar(n) {
    const Cn = C();
    if (!sede || !sede.andar || !Cn || !Cn.vida) return 0;
    sede.vendo = n ? 1 : 0;
    const lp = sede.porTipo('presidente')[0];
    const x = lp ? lp.x : (sede.caixa.x0 + sede.caixa.x1) / 2, z = lp ? lp.z : (sede.caixa.z0 + sede.caixa.z1) / 2;
    const chao = Cn.vida.chao(x, z);
    sede.telhado = Cn.vida.abrirPredio(x, z, sede.vendo ? (sede.andar.piso - chao) / M + 2.2 : 2.2);
    return sede.vendo;
  }
  function ligarSede(T) {
    desligarSede();
    sede = montarSede(T);
    if (!sede) return;
    conferirPagode(alvoDaSede().acao);
    /* as portas da sede abertas (a folha fechada não é parede pra quem anda: aberta, ninguém atravessa ela) */
    C().vida.abrirPortas({ x0: sede.caixa.x0 - M, x1: sede.caixa.x1 + M, z0: sede.caixa.z0 - M, z1: sede.caixa.z1 + M }, true);
    /* o presidente na cadeira dele */
    const e = E(), pres = e && TO.membros.presidente ? TO.membros.presidente(e) : null, lp = sede.porTipo('presidente')[0];
    if (lp) {
      const p = { m: pres, d: membroDisco(pres || { id: 0, apelido: 'Presidente' }, { cabecaForcada: 'bone' }), presidente: true };
      sentarNo(p, lp);
      sede.pessoas.push(p); sede.presidente = p;
    }
    /* os hóspedes do dia primeiro (o aliado que dormiu aqui): o resto se ajeita em volta */
    poeHospedes();
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
    if (sede) {
      C().vida.abrirPortas({ x0: sede.caixa.x0 - M, x1: sede.caixa.x1 + M, z0: sede.caixa.z0 - M, z1: sede.caixa.z1 + M }, false);
      if (sede.pagode && api.pagodeDoJogo && sede.T) api.pagodeDoJogo(sede.T.id, false);
    }
    sede = null;
  }
  /* a cada quadro: quem anda anda; de tempos em tempos alguém chega ou vai */
  function quadroSede(dt) {
    if (!sede) return;
    for (const p of sede.pessoas) {
      if (p.estado !== 'andando') continue;
      /* (em passos de até 12 cm: na escada, o chão de cada passo é o degrau
         a um degrau do pé, e o quadro lento não pula dois de uma vez) */
      const n = Math.max(1, Math.ceil(p.vel * dt / 0.12));
      for (let k = 0; k < n; k++) {
        if (andarPor(p, dt / n, M)) { if (p.destino) sentarNo(p, p.destino); else p.sai = true; break; }
        /* (no último trecho até o lugar elevado — o ringue —, sobe no
           tablado quando passa da beira dele; já em cima, anda nele) */
        const y0 = p.d.alt || 0, l = p.destino;
        const alto = l && l.elevado && p.iRota >= p.rota.length - 1 && y0 < l.chao + 0.2 * M ? chaoDe(p.d.x, p.d.y, y0 + l.elevado * M) : -Infinity;
        p.d.alt = alto > y0 + 0.2 * M ? alto : chaoDe(p.d.x, p.d.y, y0);
      }
    }
    sede.pessoas = sede.pessoas.filter(p => !p.sai);
    quadroHospedes();
    if (reuniao3d) return;                // na reunião a sede fica como está
    sede.proxTroca -= dt;
    if (sede.proxTroca > 0) return;
    sede.proxTroca = 3 + Math.random() * 5;
    const alvo = alvoDaSede();
    conferirPagode(alvo.acao);
    const quem = sede.pessoas.filter(p => !p.presidente && !p.recado && !p.hospede);
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
     OS HÓSPEDES (o jogo 3D, 28/09/2026; o dono: "Quando o jogador opta
     por hospedar na sede um aliado, eles aparecem na sede no dia do jogo
     e partem da sede pro estádio"). O aliado que a torcida recebe hoje (a
     recepção do planejamento — hospedar, hospedar e escoltar, churrasco —
     do jogo dele na nossa praça: `hospedesDeHoje`) passou a noite aqui: de
     manhã a caravana dele está dentro da sede, com a camisa dele, nas
     camas do alojamento, no sofá, nas rodas e nas mesas (até 12; o
     vaivém dos nossos não mexe neles). Duas horas e meia antes da bola
     eles saem pela porta, um atrás do outro (receber é coisa planejada
     pra um jogo da cidade: a saída deles segura o relógio uns segundos)
     ===================================================== */
  const SAIDA_ANTES = 150;
  const LUGAR_DE_HOSPEDE = { cama: 9, sofa: 7, roda: 6, mesa: 5, banco: 5, churrasco: 4, balcao: 3, sinuca: 2, pebolim: 2, espera: 1 };
  function hospedesDeHoje() {
    const e = E(), PL = TO.planejamento;
    if (!e || !PL || !PL.hospedesDeHoje) return [];
    let lista = [];
    try { lista = PL.hospedesDeHoje(e); } catch (err) { return []; }
    const jogos = TO.praca && TO.praca.jogosDaPraca ? TO.praca.jogosDaPraca(e).filter(j => j.dia === e.data.dia) : [];
    return lista.map(a => {
      const j = jogos.find(x => a.clube && x.vis.id === a.clube.id);
      const bola = (j && minutoDe(j.hora)) || 16 * 60;
      const cc = TO.mundo && TO.mundo.coresDaTorcida ? TO.mundo.coresDaTorcida(a.torcida) : { cor: '#777777', cor2: '#eeeeee', cor3: null };
      return { id: a.id, nome: a.torcida.nome, n: a.estimativa || 8, nivel: a.nivel, bola, saida: bola - SAIDA_ANTES, cor: cc.cor, cor2: cc.cor2, cor3: cc.cor3 };
    });
  }
  function tirarHospedes() {
    if (!sede) return;
    for (const p of sede.pessoas) if (p.hospede && p.lugar) { p.lugar.ocupado = null; p.lugar = null; }
    sede.pessoas = sede.pessoas.filter(p => !p.hospede);
    sede.hospedes = [];
  }
  function poeHospedes() {
    if (!sede) return;
    tirarHospedes();
    const h = relogio.minuto;
    sede.hospedes = hospedesDeHoje().filter(a => h < a.saida);
    for (const a of sede.hospedes) {
      const livres = sede.lugares.filter(l => !l.ocupado && LUGAR_DE_HOSPEDE[l.tipo])
        .sort((x, y) => LUGAR_DE_HOSPEDE[y.tipo] - LUGAR_DE_HOSPEDE[x.tipo] || frac(a.id + '|' + x.x + '|' + x.z) - frac(a.id + '|' + y.x + '|' + y.z));
      const n = Math.min(livres.length, Math.max(3, Math.min(12, Math.round(a.n))));
      a.dentro = n;
      for (let k = 0; k < n; k++) {
        const d = disco({ nome: a.nome + ' (hóspede ' + (k + 1) + ')', spawn: 'hospede', torcida: a.nome, cor: a.cor, cor2: a.cor2, cor3: a.cor3 });
        const p = { m: null, d, hospede: a.id };
        sentarNo(p, livres[k]);
        sede.pessoas.push(p);
      }
    }
  }
  /* A HORA DELES: saem pela porta, um atrás do outro, com pressa. O relógio
     da sede corre (o dia inteiro em ~9 s a 1×) e, sem esperar, o dia acabava
     antes de eles chegarem na porta: A SAÍDA SE VÊ — o tempo do jogo espera
     eles saírem (até 12 s), com a câmera na sede inteira, e volta pra sala */
  let segurando = null;
  function quadroHospedes() {
    if (!sede || !sede.hospedes || !sede.hospedes.length) return;
    const h = relogio.minuto;
    for (const a of sede.hospedes) {
      if (a.saindo || h < a.saida) continue;
      a.saindo = true;
      let k = 0;
      for (const p of sede.pessoas) if (p.hospede === a.id && p.estado === 'no lugar') { p.sairEm = tAcc + 0.35 * k++; p.pressa = true; }
      const b = document.body.classList;
      if (k && !segurando && TO.tela && TO.tela.pausarTempo && !b.contains('com-painel') && !b.contains('em-cena') && !reuniao3d) {
        TO.tela.pausarTempo('hospedes');
        segurando = { desde: tAcc };
        irPraSede();
      }
    }
    for (const p of sede.pessoas) if (p.sairEm != null && tAcc >= p.sairEm) {
      p.sairEm = null; mandarAndar(p, null, p.d.x, p.d.y);
      if (p.pressa && p.vel) p.vel *= 1.6;
    }
    if (segurando && (!sede.pessoas.some(p => p.hospede) || tAcc - segurando.desde > 7)) soltarHospedes(true);
  }
  function soltarHospedes(praSala) {
    if (!segurando) return;
    segurando = null;
    if (TO.tela && TO.tela.retomarTempo) TO.tela.retomarTempo('hospedes');
    if (praSala) irPraSala();
  }

  /* =====================================================
     A SALA DO PRESIDENTE: quem traz o recado
     O balão é do mensageiro (recados3d.js): ele pede aqui quem senta na
     cadeira da frente da mesa do presidente, e o balão fica em cima dessa
     cabeça enquanto a mensagem está no ar
     ===================================================== */
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
  /* senta quem traz a mensagem `m` na cadeira da frente (e o presidente
     vira pra ele); devolve o disco de quem fala, ou null sem a sala */
  function sentarRecado(m) {
    if (!sede || !sede.presidente || reuniao3d) return null;
    const l = sede.porTipo('recado').find(x => !x.ocupado || (x.ocupado && x.ocupado.recado)) || sede.porTipo('recado')[0];
    if (!l) return null;
    /* quem estava levanta e vai embora */
    if (sede.recado) { const q = sede.recado; q.recado = false; sede.recado = null; mandarAndar(q, null, q.d.x, q.d.y); }
    if (l.ocupado && !l.ocupado.recado) { const q = l.ocupado; mandarAndar(q, null, q.d.x, q.d.y); }
    const p = { m: null, d: quemTraz(m), recado: true, msg: m.id };
    sentarNo(p, l);
    p.d.jeito = 'sentado'; p.d.gestoForcado = undefined;
    p.d.falando = true; p.d.olhaPara = sede.presidente.d;
    sede.pessoas.push(p); sede.recado = p;
    /* o presidente vira pra ele (no barracão a cadeira gira) e escuta */
    const pd = sede.presidente.d, lp = sede.presidente.lugar;
    if (lp && lp.rumoConversa != null) pd.rumo = lp.rumoConversa;
    pd.olhaPara = p.d; pd.jeito = 'sentado';
    return p.d;
  }
  /* o recado acabou: quem falou levanta e vai embora, o presidente volta pro trabalho */
  function soltarRecado() {
    if (!sede) return;
    const pd = sede.presidente && sede.presidente.d, lp = sede.presidente && sede.presidente.lugar;
    if (pd) { pd.olhaPara = null; pd.jeito = 'trabalho'; if (lp) pd.rumo = lp.rumo; }
    if (sede.recado) { const q = sede.recado; q.recado = false; q.d.falando = false; q.d.olhaPara = null; sede.recado = null; mandarAndar(q, null, q.d.x, q.d.y); }
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
    /* (a gente na rua dos gráficos: o PC fraco anima e desenha menos gente) */
    const gente = Cn.graficos ? Cn.graficos.gente : 1;
    const quer = Math.round(clamp(Math.PI * (raio / M) ** 2 * 0.0024, 14, 64) * mov * gente);
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
    /* o bar quebrado: o tapume e os cacos pelo que o save diz */
    if (tAcc - quebradosEm > 2) { quebradosEm = tAcc; try { conferirQuebrados(); } catch (err) { console.error('o bar quebrado:', err); } }
    /* os armários do almoxarifado: o que cada torcida guarda, pelo save */
    if (tAcc - guardadosEm > 2) { guardadosEm = tAcc; try { conferirGuardados(); } catch (err) { console.error('os armários:', err); } }
    /* os bares perto: a roda na porta e quem chega */
    for (const b of rua.bares) {
      const longe = Math.hypot(b.porta.x - cx, b.porta.y - cz) > raio * 1.4;
      if (longe) { b.gente = []; continue; }
      let n = noBarDaHora(h) + (hashTxt(b.n + '|' + ((E() && E().data.absoluto) || 0)) % 3);
      /* (o bar quebrado tem metade do movimento: fatura a metade) */
      if (quebrados.has(b.n)) n = Math.floor(n / 2);
      /* (menos gente nos gráficos: a roda menor, mas o bar aberto não fica vazio) */
      if (gente < 1 && n) n = Math.max(1, Math.round(n * gente));
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
     O BAR QUEBRADO (a varredura 2D × 3D, 29/09/2026). A ordem do dono de
     10/09 ("bar atacado diminui 50% da receita por 45 dias, no sentido
     dele ter sido danificado pelo ataque") só existia no patrimônio
     (`danoAte`, financeiro.js): no mapa o bar seguia inteiro e cheio no
     dia seguinte ao bote. Agora, enquanto o conserto dura, metade da
     varanda fica de TAPUME (o compensado pregado onde quebraram, com a
     sigla de quem quebrou pichada nele), a calçada tem os cacos (vidro,
     garrafa, cadeira de plástico tombada, o engradado virado) e a roda da
     porta tem metade da gente — a outra metade da varanda segue aberta,
     que o bar fatura a metade.
     QUAL BAR DO MAPA: o patrimônio não diz qual lote é (a praça põe os
     bares pela conta de quantos a torcida tem), então é o mesmo que a
     briga do bote pega — o do dono mais perto da sede de quem quebrou
     (`danoPor`), ou o primeiro dela (`barDaBriga`)
     ===================================================== */
  const quebrados = new Map();          // o n do bar na planta → { g, por, dono, dias }
  let quebradosEm = -99, guardadosEm = -99;
  /* O QUE CADA TORCIDA GUARDA NOS ARMÁRIOS DO ALMOXARIFADO (o dono,
     29/09/2026: "as faixas tomadas vão estar armazenadas dentro do
     armário do almoxarifado, e em outro armário o patrimonio próprio"):
     o patrimônio (as faixas e as bandeiras que ela tem) e as tomadas (de
     quem) — a do jogador, do save; as da IA, do mundo vivo. Trocou, a
     praça troca só a malha do que está guardado naquela sede. A cada 2 s
     de rua (como o bar quebrado) só as torcidas da praça; `todas`, as
     do mundo inteiro (antes de a praça montar: jogo3d.js). Devolve
     quantas mudaram */
  function conferirGuardados(todas) {
    const e = E(), PAT = TO.patrimonio;
    if (!e || !e.torcida || !api.guardadosDoJogo || !PAT || !PAT.faixasDe || !PAT.faixasIA) return 0;
    const lista = (l, tipo) => (l || []).map(x => ({ tipo, de: x.de || null }));
    let n = 0;
    const fx = PAT.faixasDe(e), bd = PAT.bandeirasDe(e);
    if (api.guardadosDoJogo(e.torcida.id, { proprias: { faixas: fx.nossas.length, bandeiras: bd.nossas.length },
                                            tomadas: lista(fx.tomadas, 'faixa').concat(lista(bd.tomadas, 'bandeira')) })) n++;
    const P = api.planta, mundo = TO.relacoes && TO.relacoes.mundo ? TO.relacoes.mundo(e) : {};
    const ids = todas ? Object.keys(mundo) : (P && P.torcidas ? P.torcidas().map(t => t.id) : []);
    for (const id of ids) {
      if (id === e.torcida.id || !mundo[id]) continue;
      const f = PAT.faixasIA(e, id);
      if (!f) continue;
      if (api.guardadosDoJogo(id, { proprias: { faixas: Math.max(0, f.faixas | 0), bandeiras: Math.max(0, f.bandeiras | 0) },
                                   tomadas: lista(f.faixasTomadas, 'faixa').concat(lista(f.bandeirasTomadas, 'bandeira')) })) n++;
    }
    return n;
  }
  /* o que o save diz: dono → [{ dias, por }] (o nosso e o das IAs) */
  function danosDoJogo() {
    const e = E(), F = TO.financeiro, fora = new Map();
    if (!e || !e.data || !e.torcida) return fora;
    const abs = e.data.absoluto || 0;
    const juntar = (dono, bares) => {
      for (const b of bares || []) {
        const dias = F && F.diasDeDano ? F.diasDeDano(b, abs) : Math.max(0, ((b && b.danoAte) || 0) - abs);
        if (!(dias > 0)) continue;
        if (!fora.has(dono)) fora.set(dono, []);
        fora.get(dono).push({ dias, por: b.danoPor || null });
      }
    };
    juntar(e.torcida.id, (e.patrimonio || {}).bares);
    const mundo = e.mundoTorcidas || {};
    for (const id in mundo) if (id !== e.torcida.id && mundo[id]) juntar(id, mundo[id].bares);
    return fora;
  }
  /* o n do bar da planta → { bar, dias, por, dono } */
  function quebradosNoMapa() {
    const P = api.planta, bs = P && P.bares ? P.bares().filter(b => b.dono && b.lote && b.W && b.D) : [];
    const fora = new Map();
    for (const [dono, danos] of danosDoJogo()) {
      const livres = bs.filter(b => b.dono === dono);
      danos.sort((a, b) => b.dias - a.dias);
      for (const d of danos) {
        if (!livres.length) break;
        const s = d.por ? casaDe(d.por) : null;
        const longe = b => s ? Math.hypot(b.porta.x - s.x, b.porta.y - s.y) : b.n;
        livres.sort((a, b) => longe(a) - longe(b));
        const bar = livres.shift();
        fora.set(bar.n, { bar, dias: d.dias, por: d.por, dono });
      }
    }
    return fora;
  }
  /* põe e tira os tapumes pelo que o save diz (a cada 2 s de rua, na
     volta da praça e no fim da briga no bar) */
  function conferirQuebrados() {
    const Cn = C(), T3 = Cn && Cn.vida && Cn.vida.THREE, cena = Cn && Cn.vida && Cn.vida.cena;
    if (!T3 || !cena) return;
    const agora = quebradosNoMapa();
    /* (a briga no bar em cima dele: o tapume e os cacos saem enquanto ela dura) */
    const emBriga = n => !!(Cn.vida.palco && ultimoBar && ultimoBar.bar && ultimoBar.bar.n === n);
    for (const [n, q] of quebrados) {
      const a = agora.get(n);
      /* (a praça montou de novo: o tapume foi junto com o mapa velho) */
      if (!a || a.por !== q.por || a.dono !== q.dono || q.g.parent !== cena) { tirarQuebrado(q); quebrados.delete(n); }
      else { q.dias = a.dias; q.g.visible = !emBriga(n); }
    }
    for (const [n, a] of agora) {
      if (quebrados.has(n)) continue;
      let g = null;
      try { g = montarQuebrado(T3, a); } catch (err) { console.error('o bar quebrado:', err); }
      if (!g) continue;
      g.visible = !emBriga(n);
      cena.add(g);
      quebrados.set(n, { g, por: a.por, dono: a.dono, dias: a.dias });
    }
  }
  function tirarQuebrado(q) {
    q.g.removeFromParent();
    q.g.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.userData.proprio) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
  }
  /* as tintas (uma de cada, pra todos os bares) */
  const tintasQ = {};
  const tintaQ = (T3, cor) => tintasQ[cor] || (tintasQ[cor] = new T3.MeshLambertMaterial({ color: cor }));
  /* a sigla de quem quebrou: a da praça (a de torcida, com as cores dela) ou a dos dados */
  function quemQuebrou(id) {
    if (!id) return null;
    const P = api.planta, t = P && P.torcidas ? P.torcidas().find(x => x.id === id) : null;
    if (t) return { sigla: t.sigla, cor: t.cor, cor2: t.cor2 };
    const d = ((TO.dados && TO.dados.torcidas) || []).find(x => x.id === id);
    if (!d) return null;
    const cs = d.cores || [];
    return { sigla: String(d.siglaTorcida || d.nome || '').toUpperCase(), cor: cs[0] || '#c8342b', cor2: cs[1] || '#111111' };
  }
  /* a pichação: a sigla em spray, com o contorno e o escorrido */
  function pichacao(T3, quem, rnd) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
    const x = cv.getContext('2d'), txt = String(quem.sigla || '').slice(0, 9);
    /* a tinta que aparece no compensado claro: a cor 1, ou a 2 se a 1 é clara demais */
    const lum = c => { const n = parseInt(String(c || '#000').slice(1), 16); return (n >> 16 & 255) * 0.3 + (n >> 8 & 255) * 0.59 + (n & 255) * 0.11; };
    const tinta = lum(quem.cor) < 170 ? quem.cor : lum(quem.cor2) < 170 ? quem.cor2 : '#1d1d1d';
    const borda = lum(tinta) < 110 ? '#f3efe4' : '#161616';
    let tam = 170;
    x.font = `900 ${tam}px Impact, "Arial Black", sans-serif`;
    while (x.measureText(txt).width > 470 && tam > 60) { tam -= 10; x.font = `900 ${tam}px Impact, "Arial Black", sans-serif`; }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    x.save(); x.translate(256, 118); x.rotate((rnd() - 0.5) * 0.14);
    x.lineWidth = 12; x.strokeStyle = borda; x.strokeText(txt, 0, 0);
    x.fillStyle = tinta; x.fillText(txt, 0, 0);
    /* o escorrido da tinta embaixo das letras */
    const larg = Math.min(470, x.measureText(txt).width);
    for (let k = 0; k < 9; k++) {
      const px = -larg / 2 + rnd() * larg, py = tam * 0.3, h = 12 + rnd() * 50;
      x.fillRect(px, py, 3 + rnd() * 3, h);
    }
    x.restore();
    const tex = new T3.CanvasTexture(cv); tex.colorSpace = T3.SRGBColorSpace; tex.anisotropy = 4;
    const mat = new T3.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.08, depthWrite: false });
    mat.userData.proprio = true; mat.userData.doMapa = true;
    return mat;
  }
  /* uma cadeira de plástico tombada de lado, sem um pé */
  function cadeiraTombada(T3, mat) {
    const c = new T3.Group();
    const peca = (w, h, d, x, y, z) => { const m = new T3.Mesh(new T3.BoxGeometry(w * M, h * M, d * M), mat); m.position.set(x * M, y * M, z * M); c.add(m); };
    peca(0.42, 0.04, 0.42, 0, 0.51, 0);
    peca(0.42, 0.46, 0.04, 0, 0.76, -0.19);
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1]]) peca(0.035, 0.42, 0.035, dx * 0.19, 0.3, dz * 0.19);
    /* de lado: a largura vira a altura */
    c.rotation.z = Math.PI / 2; c.position.y = 0.23 * M;
    const g = new T3.Group(); g.add(c);
    return g;
  }
  function montarQuebrado(T3, a) {
    const b = a.bar, l = b.lote, W = b.W, D = b.D, Cn = C();
    const PL = planoDoBar(W, D, l.esquina);
    /* O LOTE NO MUNDO: o referencial do modelo (casas3d.js, `frameDoLote`;
       o mesmo da briga no bar): x de quem olha a fachada, z = 0 na divisa
       da frente, pra fora da casa o z cresce */
    const f = l.frente, mx = (l.x0 + l.x1) / 2, mz = (l.y0 + l.y1) / 2;
    const F = f === 'n' ? { fx: mx, fz: l.y0, rx: -1, rz: 0, nx: 0, nz: -1 } : f === 's' ? { fx: mx, fz: l.y1, rx: 1, rz: 0, nx: 0, nz: 1 }
      : f === 'o' ? { fx: l.x0, fz: mz, rx: 0, rz: 1, nx: -1, nz: 0 } : { fx: l.x1, fz: mz, rx: 0, rz: -1, nx: 1, nz: 0 };
    const doLote = (x, z) => [F.fx + ((x - W / 2) * F.rx + z * F.nx) * M, F.fz + ((x - W / 2) * F.rz + z * F.nz) * M];
    const chao = (x, z) => { const [wx, wz] = doLote(x, z); return Cn.vida.chao(wx, wz); };
    /* o grupo no canto do lote, girado com ele: o filho vai em (x·M, y, z·M) */
    const g = new T3.Group(); g.name = 'bar quebrado';
    const [ox, oz] = doLote(0, 0);
    g.position.set(ox, 0, oz); g.rotation.y = Math.atan2(-F.rz, F.rx);
    let semente = hashTxt('quebrado|' + b.n + '|' + (a.por || ''));
    const rnd = () => { semente = (semente + 0x6D2B79F5) >>> 0; let t = semente; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const caixa = (w, h, d, x, y, z, mat) => { const m = new T3.Mesh(new T3.BoxGeometry(w * M, h * M, d * M), mat); m.position.set(x * M, y, z * M); g.add(m); return m; };

    /* O TAPUME: da ponta de longe da esquina até ~60% do vão livre da
       varanda (a esquina tem o pilar de 26 cm); rente à frente dela */
    const s = PL.ladoDaEsquina, [va, vb] = PL.varanda.x, zF = PL.varanda.z[1];
    const livreA = s > 0 ? va : va + 0.26, livreB = s > 0 ? vb - 0.26 : vb;
    const comp = (livreB - livreA) * 0.6;
    const t0 = s > 0 ? livreA : livreB - comp;
    const yB = Math.max(chao(t0 + comp / 2, zF - 0.4), chao(t0 + comp / 2, zF + 0.4));
    const nT = Math.max(2, Math.ceil(comp / 1.1)), wT = comp / nT;
    const COMPENSADO = ['#b8976a', '#c3a477', '#a98b5e'];
    for (let k = 0; k < nT; k++) {
      const h = 2.02 + rnd() * 0.16;
      const m = caixa(wT - 0.012, h, 0.025, t0 + wT * (k + 0.5), yB + (h / 2 - 0.04) * M, zF + 0.03, tintaQ(T3, COMPENSADO[k % 3]));
      m.rotation.z = (rnd() - 0.5) * 0.025;
    }
    /* os dois sarrafos pregados de través */
    for (const hy of [0.38, 1.72]) caixa(comp + 0.06, 0.07, 0.03, t0 + comp / 2, yB + hy * M, zF + 0.058, tintaQ(T3, '#7a5c3c'));
    /* a sigla de quem quebrou, pichada no compensado */
    const quem = quemQuebrou(a.por);
    if (quem && quem.sigla) {
      const pw = Math.min(comp * 0.92, 2.8), ph = pw / 2;
      const m = new T3.Mesh(new T3.PlaneGeometry(pw * M, ph * M), pichacao(T3, quem, rnd));
      m.position.set((t0 + comp / 2) * M, yB + 1.08 * M, (zF + 0.078) * M);
      m.renderOrder = 2;
      g.add(m);
    }

    /* OS CACOS NA CALÇADA, na frente do tapume e da porta: o vidro (das
       garrafas e da porta do freezer), as garrafas, as cadeiras, o engradado */
    const xa = Math.min(t0, t0 + comp) - 0.3, xb = Math.max(t0, t0 + comp) + 0.9;
    const noChao = (x, z) => chao(x, z);
    {
      const pos = [];
      for (let k = 0; k < 46; k++) {
        const x = xa + rnd() * (xb - xa), z = 0.2 + Math.pow(rnd(), 1.4) * 1.9, y = noChao(x, z) / M + 0.006;
        const r = 0.03 + rnd() * 0.07, a0 = rnd() * Math.PI * 2;
        for (let j = 0; j < 3; j++) { const aj = a0 + j * 2.1 + (rnd() - 0.5) * 0.8, rj = r * (0.5 + rnd() * 0.7); pos.push((x + Math.cos(aj) * rj) * M, y * M, (z + Math.sin(aj) * rj) * M); }
      }
      const geo = new T3.BufferGeometry();
      geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3));
      geo.computeVertexNormals();
      const vidro = tintasQ.vidro || (tintasQ.vidro = new T3.MeshLambertMaterial({ color: '#dcefee', emissive: '#3a4a4a', side: T3.DoubleSide }));
      g.add(new T3.Mesh(geo, vidro));
    }
    /* as garrafas deitadas (âmbar e verde) */
    for (let k = 0; k < 5; k++) {
      const x = xa + rnd() * (xb - xa), z = 0.3 + rnd() * 1.5;
      const m = new T3.Mesh(new T3.CylinderGeometry(0.035 * M, 0.035 * M, 0.23 * M, 7), tintaQ(T3, k % 3 ? '#6b3a17' : '#2f5a2a'));
      /* (deitada: o z tomba o cilindro, o y gira ele no chão) */
      m.rotation.set(0, rnd() * Math.PI, Math.PI / 2);
      m.position.set(x * M, noChao(x, z) + 0.035 * M, z * M);
      g.add(m);
    }
    /* duas cadeiras de plástico tombadas */
    for (let k = 0; k < 2; k++) {
      const x = xa + 0.4 + rnd() * Math.max(0.2, xb - xa - 0.8), z = 0.55 + rnd() * 1.0;
      const c = cadeiraTombada(T3, tintaQ(T3, '#efeee8'));
      c.position.set(x * M, noChao(x, z), z * M); c.rotation.y = rnd() * Math.PI * 2;
      g.add(c);
    }
    /* o engradado de cerveja virado */
    {
      const x = xa + rnd() * (xb - xa), z = 0.4 + rnd() * 1.1;
      const m = caixa(0.42, 0.3, 0.34, x, noChao(x, z) + 0.15 * M, z, tintaQ(T3, '#b8322a'));
      m.rotation.y = rnd() * Math.PI; m.rotation.z = (rnd() - 0.5) * 0.3;
    }
    g.userData.bar = b.n;
    return g;
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
        /* (quem trazia o recado levanta: o balão espera a reunião acabar) */
        soltarRecado();
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
    if (sede.vendo) verAndar(0);
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
    quadroRua(dt);
    /* os discos do quadro */
    const lista = [];
    /* (com o térreo na tela, a sede de dois andares está cortada na altura
       da cabeça: quem passou dela — lá em cima, no alto da escada — some) */
    const teto = sede && sede.andar && !sede.vendo ? sede.andar.piso - 2.4 * M : Infinity;
    if (sede) for (const p of sede.pessoas) if (!(p.d.alt > teto)) lista.push(p.d);
    if (rua) { for (const p of rua.povo) lista.push(p.d); for (const b of rua.bares) for (const g of b.gente) lista.push(g.d); }
    J.discos = lista;
  }
  const vida = { J, quadro };
  /* =====================================================
     O ARMÁRIO DO PATRIMÔNIO (o dono, 30/09/2026: "Clicar no armário do
     material abre pop-up da lista do que tem dentro"): o clique na praça
     que acerta um dos armários da sede do jogador — o do patrimônio e o
     das tomadas, com cadeado — abre a lista, do save: as faixas e as
     bandeiras da torcida e as bombas do estoque; as faixas e bandeiras
     tomadas, de quem eram e quando
     ===================================================== */
  function armarioNoRaio(r) {
    if (!sede || !sede.S3.armarios) return null;
    let melhor = null, tMin = Infinity;
    for (const A of sede.S3.armarios) {
      /* (com o 1º andar na tela, o térreo está coberto) */
      if (sede.andar && sede.vendo && A.chao < sede.andar.piso - M) continue;
      const lo = [A.x0, A.chao, A.z0], hi = [A.x1, A.chao + A.alt, A.z1];
      let t0 = 0, t1 = Infinity, ok = true;
      for (let k = 0; k < 3 && ok; k++) {
        const o = r.o[k], d = r.d[k];
        if (Math.abs(d) < 1e-9) { if (o < lo[k] || o > hi[k]) ok = false; continue; }
        let a = (lo[k] - o) / d, b = (hi[k] - o) / d;
        if (a > b) { const q = a; a = b; b = q; }
        t0 = Math.max(t0, a); t1 = Math.min(t1, b);
        if (t0 > t1) ok = false;
      }
      if (ok && t0 < tMin) { tMin = t0; melhor = A; }
    }
    return melhor;
  }
  let popArmario = null;
  function fecharArmario() { if (popArmario) { popArmario.remove(); popArmario = null; } }
  function abrirArmario(A) {
    const e = E(), PAT = TO.patrimonio;
    if (!e || !PAT || !PAT.faixasDe) return false;
    fecharArmario();
    const fx = PAT.faixasDe(e), bd = PAT.bandeirasDe(e), n = (k, um, varios) => `${k} ${k === 1 ? um : varios}`;
    let titulo, corpo;
    if (A.tipo === 'tomadas') {
      titulo = 'O armário das tomadas';
      const lista = (fx.tomadas || []).map(x => ({ ...x, tipo: 'Faixa' })).concat((bd.tomadas || []).map(x => ({ ...x, tipo: 'Bandeira' })));
      corpo = lista.length
        ? '<ul>' + lista.map(x => `<li><b>${esc(x.tipo)}</b> da ${esc(x.nome || x.de || 'torcida rival')}${x.quando ? ` <small>· tomada em ${esc(x.quando.ano)}, semana ${esc(x.quando.semana)}</small>` : ''}</li>`).join('') + '</ul>'
        : '<p>Vazio: a torcida ainda não tomou faixa nem bandeira de ninguém.</p>';
    } else {
      titulo = 'O armário do patrimônio';
      const nf = (fx.nossas || []).length, nb = (bd.nossas || []).length, bombas = PAT.bombas ? PAT.bombas(e) : 0;
      corpo = `<ul><li><b>${n(nf, 'faixa', 'faixas')}</b> da torcida <small>· é a que ela expõe quando é atacada</small></li>` +
        `<li><b>${n(nb, 'bandeira', 'bandeiras')}</b> <small>· quadradas, com o escudo</small></li>` +
        `<li><b>${n(bombas, 'bomba', 'bombas')}</b> no estoque <small>· o que o bonde leva pro jogo</small></li></ul>`;
    }
    popArmario = document.createElement('div');
    popArmario.className = 'j3d-armario'; popArmario.setAttribute('role', 'dialog');
    popArmario.innerHTML = `<button class="j3d-armario-x" aria-label="Fechar" title="Fechar">×</button><h3>${titulo}</h3>${corpo}` +
      `<p class="j3d-armario-pe">${A.tipo === 'tomadas' ? 'Com cadeado: se a sede for invadida, é o que o rival vem buscar.' : 'Tudo o que se compra no Patrimônio fica aqui.'}</p>`;
    popArmario.querySelector('.j3d-armario-x').onclick = fecharArmario;
    document.body.appendChild(popArmario);
    return true;
  }
  const aoClicar = r => { const A = armarioNoRaio(r); return A ? abrirArmario(A) : false; };
  /* LIGAR: a praça montada, a torcida do jogador (o id) */
  function ligar(torcidaId) {
    const Cn = C();
    if (!Cn || !Cn.vida) return false;
    praca = Cn.praca;
    const T = (api.planta.torcidas ? api.planta.torcidas() : []).find(t => t.id === torcidaId) || null;
    ligada = true;
    ligarSede(T);
    rua = montarRua();
    quebradosEm = -99;
    Cn.vida.vida = vida;
    Cn.vida.aoClicar = aoClicar;
    /* a sede do jogador sem o telhado (e o alto das paredes): de cima, os
       cômodos. O telhado se acha pela sala do presidente (no barracão o
       meio da sede cai no pátio, que é descoberto) */
    if (sede) {
      const lp = sede.porTipo('presidente')[0];
      const x = lp ? lp.x : (sede.caixa.x0 + sede.caixa.x1) / 2, z = lp ? lp.z : (sede.caixa.z0 + sede.caixa.z1) / 2;
      sede.telhado = Cn.vida.abrirPredio(x, z, 2.2);
      sede.vendo = 0;
    }
    return true;
  }
  function desligar() {
    soltarHospedes(false);
    ligada = false;
    const Cn = C();
    desligarSede(); rua = null; J.discos = [];
    fecharArmario();
    if (Cn && Cn.vida) { Cn.vida.vida = null; Cn.vida.abrirPredio(null); if (Cn.vida.aoClicar === aoClicar) Cn.vida.aoClicar = null; }
  }
  /* a sede do jogador volta a ficar aberta (o palco da briga abriu outro prédio) */
  function reabrirSede() {
    const Cn = C();
    if (!sede || !Cn || !Cn.vida) return;
    const lp = sede.porTipo('presidente')[0];
    const x = lp ? lp.x : (sede.caixa.x0 + sede.caixa.x1) / 2, z = lp ? lp.z : (sede.caixa.z0 + sede.caixa.z1) / 2;
    sede.telhado = Cn.vida.abrirPredio(x, z, 2.2);
    sede.vendo = 0;
  }
  /* A BRIGA NA CASA DA FESTA (a cena 'casa-piscina' do jogo de feed, na
     rua de veraneio da praça): o tabuleiro do combate em cima da casa da
     festa, e o cenário desenhando a briga (palco_briga.js). Quando a cena
     fecha, a câmera volta pra sala do presidente */
  function palcoDaFesta() {
    const B = api.planta.brigaNaFesta ? api.planta.brigaNaFesta() : null;
    if (!B || !TO.dados || !TO.dados.cenas) return null;
    TO.dados.cenas[B.cena.id] = B.cena;
    const R = palcoDeBriga({ C: C(), M, cena: B.cena, noMundo: B.noMundo, doMundo: B.doMundo, u: B.u, v: B.v, chao: B.chao, predio: B.casa, rotAlto: 'a casa inteira, do alto',
                             aoDesmontar: () => { if (ligada) { reabrirSede(); irPraSala(); } } });
    return { local: B.cena.id, renderizador: R };
  }
  /* A CARAVANA NA ESTRADA (as emboscadas 'emb-posto' e 'emb-onibus'): o
     palco à parte, longe da praça — o posto ou a pista com o ônibus —, e a
     câmera salta pra lá; no fim ela volta pra sala do presidente */
  function palcoDaCaravana(local) {
    /* A EMBOSCADA NA RODOVIA DA VIAGEM (dia3d.js e estrada3d.js): a briga é
       na peça encaixada na estrada, onde o ônibus parou */
    const D3 = TO.jogo3d && TO.jogo3d.dia;
    const naEstrada = D3 && D3.brigaNaEstrada ? D3.brigaNaEstrada(local) : null;
    if (naEstrada) return naEstrada;
    const Pc = api.planta.palcoDaCaravana ? api.planta.palcoDaCaravana(local) : null;
    if (!Pc || !TO.dados || !TO.dados.cenas) return null;
    const B = Pc.briga;
    TO.dados.cenas[B.cena.id] = B.cena;
    /* (o tabuleiro da caravana é de 43 × 29 m: 1 px = `escala` unidade; as vistas são mais perto que as da festa) */
    const R = palcoDeBriga({ C: C(), M, cena: B.cena, noMundo: B.noMundo, doMundo: B.doMundo, u: B.u, v: B.v, chao: B.chao, peca: Pc.grupo, livre: true, semLonge: true,
                             escala: B.escala, vistas: { perto: { dist: 19, el: 1.08 }, alto: { dist: 36, el: 1.25 } },
                             rotAlto: local === 'emb-posto' ? 'o posto inteiro, do alto' : 'a estrada, do alto',
                             aoDesmontar: () => { if (ligada) { reabrirSede(); irPraSala(); } } });
    return { local: B.cena.id, renderizador: R };
  }
  /* A BRIGA NA CAMINHADA AO ESTÁDIO (as cenas de praça e de rua do jogo
     de feed num dia de jogo na praça do jogador; caminhada.js): o plano do
     dia de jogo com a briga que o jogo mandou (quem ataca, quem é atacado,
     a concentração ou o meio do caminho), e o tabuleiro em volta do ponto
     da emboscada. COM O DIA DE JOGO NO AR (dia3d.js; o dono, 28/09/2026:
     "As brigas fora de casa devem respeitar o mesmo cenário das brigas em
     casa") a briga é a do plano do dia, em casa ou fora: o mesmo lugar
     onde os dois bondes se encontram na cidade do jogo. Sem ele, briga
     noutra praça (a sub-sede) segue na cena de sempre */
  function palcoDaCaminhada(local, cfg) {
    const Cn = C(), e = E();
    if (!Cn || !Cn.vida || !Cn.vida.contextoDoDia || !e || !e.torcida || !TO.dados || !TO.dados.cenas) return null;
    const nosso = (cfg.bondes || []).find(b => b.nossa), rivalId = cfg.rivalId;
    if (!nosso || !rivalId) return null;
    const atacados0 = cfg.faixaDefensor === 'nos';
    const D3 = TO.jogo3d && TO.jogo3d.dia;
    const G = D3 && D3.ativo ? D3.ganchosDaCaminhada(atacados0 ? rivalId : e.torcida.id, atacados0 ? e.torcida.id : rivalId) : null;
    if (cfg.foraDeCasa && !G) return null;
    /* O JOGO: o nosso em casa, se é contra o clube do rival; senão, o nosso
       clube contra o do rival (a caminhada é a do dia, a rota é a de cada um) */
    const R = TO.mundo && TO.mundo.torcida ? TO.mundo.torcida(rivalId) : null, meu = e.torcida.clubeId, j = e.proximoJogo;
    let fora = null;
    if (j && j.casa && j.advId && R && R.clubeId === j.advId) fora = j.advId;
    else if (R && R.clubeId && R.clubeId !== meu) fora = R.clubeId;
    else if (j && j.advId) fora = j.advId;
    if (!fora && !G) return null;
    const atacados = atacados0;
    let B = null;
    try {
      B = brigaNaCaminhada(Cn.vida.contextoDoDia(), { casa: meu, fora, a: atacados ? rivalId : e.torcida.id, v: atacados ? e.torcida.id : rivalId,
                                                     onde: local === 'praca' ? 'praca' : 'rua', nosso: e.torcida.id, nossoLado: nosso.lado, plano: G ? G.plano : undefined });
    } catch (err) { console.error('a briga na caminhada:', err); if (G) G.aoDesmontar(); return null; }
    if (!B || B.erro) { console.warn('a briga na caminhada não montou:', B && B.erro); if (G) G.aoDesmontar(); return null; }
    TO.dados.cenas[B.cena.id] = B.cena;
    ultimaCaminhada = B;
    const Rd = palcoDeBriga({ C: Cn, M, cena: B.cena, noMundo: B.noMundo, doMundo: B.doMundo, u: B.u, v: B.v, chao: B.chao, escala: B.escala,
                              vistas: { perto: { dist: 19, el: 1.08 }, alto: { dist: 40, el: 1.25 } },
                              rotAlto: local === 'praca' ? 'a concentração, do alto' : 'a rua, do alto',
                              /* (com o dia no ar, os outros bondes do dia ficam em volta) */
                              comDia: G ? G.comDia : null,
                              aoDesmontar: () => { if (G) G.aoDesmontar(); else if (ligada) { reabrirSede(); irPraSala(); } } });
    return { local: B.cena.id, renderizador: Rd };
  }
  let ultimaCaminhada = null;
  /* A BRIGA NO BAR (a cena 'bar' do jogo de feed; briga_bar.js; o dono,
     29/09/2026: "a cena do bar sempre vai ser no respectivo bar da torcida
     atacada, no mapa do jogo"): o nosso bote no bar deles (o bar é do
     rival), o ataque deles no nosso (o bar é nosso) e a investida do dia de
     jogo no "bar deles" — sempre no bar da dona, na praça em 3D. O ataque à
     SEDE rival também abre a cena do bar no jogo de feed: esse segue na
     cena de sempre (o palco dele não é um bar). Sem o bar da dona no mapa
     (a torcida sem bar, a praça sem vaga pra ele), a cena de sempre também
     — o jogo de feed já não deixa atacar bar de quem não tem (acoes.js,
     `temBar`), então isso é a rede de baixo, não o caminho */
  function palcoDoBar(cfg) {
    const Cn = C(), e = E();
    if (!cfg || !Cn || !Cn.vida || !Cn.vida.contextoDoDia || !e || !e.torcida || !TO.dados || !TO.dados.cenas) return null;
    if (cfg.alvoTipo && cfg.alvoTipo !== 'bar') return null;
    const nossoBar = cfg.faixaDefensor === 'nos';
    const dono = nossoBar ? e.torcida.id : cfg.rivalId;
    const D3 = TO.jogo3d && TO.jogo3d.dia, noDia = !!(D3 && D3.ativo);
    /* (a praça de fora — a sub-sede, o jogo fora — só está em 3D com o dia de jogo lá) */
    if (!dono || (cfg.foraDeCasa && !noDia)) return null;
    const bar = barDaBriga(dono, nossoBar ? cfg.rivalId : e.torcida.id);
    if (!bar) { console.warn('a briga no bar: a torcida ' + dono + ' não tem bar no mapa'); return null; }
    /* quem ataca: o nosso lado no nosso bote, o outro no ataque deles */
    const nosso = (cfg.bondes || []).find(b => b.nossa), ladoNosso = nosso && nosso.lado === 'visitante' ? 'visitante' : 'mandante';
    const ladoAtaca = nossoBar ? (ladoNosso === 'mandante' ? 'visitante' : 'mandante') : ladoNosso;
    let B = null;
    try { B = brigaNoBar(Cn.vida.contextoDoDia(), bar, { ladoAtaca, nosAtacamos: !nossoBar, nossoBar }); }
    catch (err) { console.error('a briga no bar:', err); return null; }
    if (!B || B.erro) { console.warn('a briga no bar não montou:', B && B.erro); return null; }
    /* (com o dia de jogo no ar, ele para e os bondes das duas somem da rua enquanto a briga dura) */
    const G = noDia && D3.ganchosDaBriga ? D3.ganchosDaBriga([e.torcida.id, cfg.rivalId].filter(Boolean)) : null;
    TO.dados.cenas[B.cena.id] = B.cena;
    ultimoBar = B;
    const Rd = palcoDeBriga({ C: Cn, M, cena: B.cena, noMundo: B.noMundo, doMundo: B.doMundo, u: B.u, v: B.v, chao: B.chao, escala: B.escala,
                              predio: B.predio, vistas: { perto: { dist: 17, el: 1.1 }, alto: { dist: 34, el: 1.3 } },
                              rotAlto: 'o bar e a esquina, do alto', comDia: G ? G.comDia : null,
                              aoDesmontar: () => { if (G) G.aoDesmontar(); else if (ligada) { reabrirSede(); irPraSala(); } quebradosEm = -99; } });
    /* (o tapume e os cacos desse bar saem enquanto a briga dura) */
    const q = quebrados.get(bar.n);
    if (q) q.g.visible = false;
    return { local: B.cena.id, renderizador: Rd };
  }
  let ultimoBar = null;
  /* A TRETA MARCADA (as cenas 'treta-*' do jogo de feed; briga_treta.js):
     na favela da praça — o 5×5 num beco, o 7×7 e o 10×10 no campinho de
     terra —, com o lugar sorteado pela treta (o bairro, o rival, o
     tamanho). O resto é do jogo de feed: os mesmos efetivos, sem arma nem
     bomba, os dois lados acordados, a aposta. Sem beco ou campinho que
     sirva, a cena de sempre */
  function palcoDaTreta(local, cfg) {
    const Cn = C();
    if (!Cn || !Cn.vida || !Cn.vida.contextoDoDia || !TO.dados || !TO.dados.cenas) return null;
    const t = cfg.treta || {};
    let B = null;
    try { B = brigaNaTreta(Cn.vida.contextoDoDia(), local, { chave: [t.bairro || '', t.rival || '', t.tam || '', t.lnt ? 'lnt' : ''].join('|') }); }
    catch (err) { console.error('a treta marcada:', err); return null; }
    if (!B || B.erro) { console.warn('a treta marcada não montou:', B && B.erro); return null; }
    TO.dados.cenas[B.cena.id] = B.cena;
    ultimaTreta = B;
    const Rd = palcoDeBriga({ C: Cn, M, cena: B.cena, noMundo: B.noMundo, doMundo: B.doMundo, u: B.u, v: B.v, chao: B.chao, escala: B.escala,
                              vistas: { perto: { dist: 16, el: 1.1 }, alto: { dist: 32, el: 1.3 } },
                              rotAlto: B.lugar.tipo === 'beco' ? 'o beco inteiro, do alto' : 'o campinho inteiro, do alto',
                              aoDesmontar: () => { if (ligada) { reabrirSede(); irPraSala(); } } });
    return { local: B.cena.id, renderizador: Rd };
  }
  let ultimaTreta = null;
  /* o bar da dona que a briga pega: o mais perto da sede de quem ataca (é
     de lá que o bonde sai; da torcida sem sede, o bar dela); sem nenhum
     dos dois no mapa, o primeiro dela */
  function barDaBriga(dono, atacante) {
    const bs = (api.planta && api.planta.bares ? api.planta.bares() : []).filter(b => b.dono === dono && b.lote && b.W && b.D);
    if (!bs.length) return null;
    const s = atacante ? casaDe(atacante) : null;
    if (!s) return bs.sort((a, b) => a.n - b.n)[0];
    const d = b => Math.hypot(b.porta.x - s.x, b.porta.y - s.y);
    return bs.sort((a, b) => d(a) - d(b))[0];
  }
  /* a luz corre mesmo com a vida desligada (no menu, o dia parado nas 10h) */
  return {
    ligar, desligar, quadro, irPraSala, irPraSede, relogio,
    /* o telhado da sede aberto de novo (a cena que abriu outro prédio acabou: o assalto) */
    reabrirSede: () => { if (ligada) reabrirSede(); },
    /* A SEDE DE DOIS ANDARES: o andar que a câmera mostra (0 o térreo, 1 o
       1º andar); `temAndar`, se a sede do jogador tem o 1º andar */
    verAndar: n => verAndar(n),
    /* pro teste: manda a pessoa k da sede pro lugar i, pela rota de verdade
       (pela escada, se o lugar é do outro andar); devolve se ela saiu andando */
    mandar(k, i) {
      if (!sede) return false;
      const p = sede.pessoas[k], l = sede.lugares[i];
      if (!p || !l || l.ocupado || p.presidente) return false;
      const x = p.lugar ? p.lugar.x : p.d.x, z = p.lugar ? p.lugar.z : p.d.y;
      mandarAndar(p, l, x, z);
      return p.estado === 'andando';
    },
    /* pro teste: a rota de (x, z, andar) até o lugar i, por partes */
    rotaTeste(x, z, andar, i) {
      if (!sede) return null;
      const l = sede.lugares[i], ate = l.elevado ? 3.0 : 1.2, G0 = gradeDaSede(), G1 = gradeDeCima();
      const cel = (G, px, pz, a) => { if (!G) return null; const k = G.perto(px, pz, a); return k < 0 ? -1 : k; };
      const e = sede.andar && sede.andar.escada;
      return { lugar: { tipo: l.tipo, andar: l.andar || 0, elevado: l.elevado || 0 }, deCel: cel(andar ? G1 : G0, x, z, 1.2), paraCel: cel(l.andar ? G1 : G0, l.x, l.z, ate),
               pe: e ? cel(G0, e.pe.x, e.pe.z, 1.2) : null, topo: e ? cel(G1, e.topo.x, e.topo.z, 1.2) : null,
               rota: (rotaNaSede(x, z, andar, l.x, l.z, l.andar || 0, ate) || []).length };
    },
    /* pro teste: o armário que o raio acerta e o pop-up dele */
    armarioNoRaio: r => armarioNoRaio(r), abrirArmario: A => abrirArmario(A), get popArmario() { return popArmario; },
    get andarVisto() { return sede && sede.andar ? sede.vendo : null; },
    get temAndar() { return !!(sede && sede.andar); },
    set temJogoHoje(f) { temJogoHoje = typeof f === 'function' ? f : () => false; },
    get ritmo() { return relogio.ritmo; },
    /* o mensageiro (recados3d.js): quem senta pra falar, quem levanta, e
       as cabeças do balão (quem fala e o presidente, que ele evita cobrir) */
    sentarRecado: m => ligada ? sentarRecado(m) : null,
    soltarRecado: () => soltarRecado(),
    get recado() { return sede && sede.recado ? sede.recado : null; },
    get presidente() { return sede && sede.presidente ? sede.presidente.d : null; },
    get reuniao() { return !!reuniao3d; },
    /* o palco da cena que tem lugar na sede em 3D: a reunião */
    palcoDe(local, cfg) {
      /* (com o dia de jogo no ar, a vida da praça fica desligada e as brigas dele montam aqui) */
      const D3 = TO.jogo3d && TO.jogo3d.dia, noDia = !!(D3 && D3.ativo);
      if (!ligada && !noDia) return null;
      /* A INVASÃO NO ESTÁDIO (invasao.js): a briga da arquibancada, com o dia no ar, é a invasão da nossa torcida */
      if (/^estadio-(10|20|40)$/.test(local) && cfg && cfg.invasao3d && noDia) return D3.palcoDaInvasao(cfg);
      /* A BRIGA DOS ARREDORES (arredores3d.js): a nossa investida no cordão
         da PM, com o dia no ar, ou a do jogo da cidade no fundo; sem cordão
         nem investida montada no 3D, a cena da foto */
      if (local === 'arredores' && cfg && cfg.bondes && !cfg.reuniao && D3 && D3.palcoDosArredores) return D3.palcoDosArredores(cfg);
      if (local === 'casa-piscina') return palcoDaFesta();
      if (local === 'emb-posto' || local === 'emb-onibus') return palcoDaCaravana(local);
      if (/^(praca|rua|rua-media|rua-nobre)$/.test(local) && cfg && cfg.bondes && !cfg.reuniao) return palcoDaCaminhada(local, cfg);
      if (local === 'bar' && cfg && !cfg.reuniao) return palcoDoBar(cfg);
      if (/^treta-(beco|galpao|campo)$/.test(local) && cfg && cfg.bondes && !cfg.reuniao) return palcoDaTreta(local, cfg);
      if (!sede || !cfg || !cfg.reuniao || !/^sede-|^praca$/.test(local)) return null;
      return { renderizador: palcoDaReuniao() };
    },
    get ligada() { return ligada; },
    /* os hóspedes saindo com o tempo do jogo esperando (o vigia do relógio confere) */
    get segurandoHospedes() { return !!segurando; },
    /* pro teste */
    get estado() {
      return { ligada, praca, hora: relogio.hora, sede: sede && { pessoas: sede.pessoas.length, andando: sede.pessoas.filter(p => p.estado === 'andando').length,
               presidente: !!sede.presidente, recado: !!sede.recado, lugares: sede.lugares.length,
               hospedes: (sede.hospedes || []).map(a => ({ id: a.id, nome: a.nome, nivel: a.nivel, saida: horaTxt(a.saida), dentro: sede.pessoas.filter(p => p.hospede === a.id).length, saindo: !!a.saindo })) },
               povo: rua ? rua.povo.length : 0, bares: rua ? rua.bares.map(b => ({ n: b.n, dono: b.dono, gente: b.gente.length, chegando: b.gente.filter(g => g.estado === 'chegando').length })) : [],
               aneis: rua ? rua.aneis.length : 0, reuniao: !!reuniao3d, discos: J.discos.length };
    },
    get sede() { return sede; }, get rua() { return rua; },
    /* pro teste: os bares quebrados no mapa (o n da planta, o dono, quem quebrou, os dias que faltam) */
    get quebrados() {
      const cena = C() && C().vida && C().vida.cena;
      return [...quebrados].map(([n, q]) => ({ n, dono: q.dono, por: q.por, dias: q.dias, visivel: q.g.visible, naCena: q.g.parent === cena, filhos: q.g.children.length }));
    },
    conferirQuebrados: () => conferirQuebrados(),
    /* os armários do almoxarifado pelo save (`todas`: as torcidas do mundo inteiro) */
    conferirGuardados: todas => conferirGuardados(todas),
    /* os bares quebrados pelo save, com a porta no mundo (o mapa da cidade marca eles) */
    get baresQuebrados() {
      try { return [...quebradosNoMapa()].map(([n, a]) => ({ n, dono: a.dono, por: a.por, dias: a.dias, porta: a.bar.porta })); }
      catch (err) { return []; }
    },
    /* pro teste: a última briga na caminhada (o plano, o ponto, a cena) e a última no bar */
    get caminhada() { return ultimaCaminhada; },
    get noBar() { return ultimoBar; },
    get treta() { return ultimaTreta; }
  };
}
