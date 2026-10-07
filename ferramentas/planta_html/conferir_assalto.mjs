/* =========================================================
   O ASSALTO SEM TELA (node): o motor (assalto.js) numa loja de mentira,
   com um robô no lugar do jogador, pra conferir que cada caminho da
   mecânica acontece e termina:
   - RÁPIDO: entra, anuncia, limpa o caixa e as vitrines, abre o cofre com
     ajuda e volta pro carro antes da polícia;
   - DEMORADO: anuncia e fica parado — a polícia chega e o líder cai;
   - FURTIVO: entra sozinho (a equipe espera na porta), espera o caixa sair
     pros fundos e pega o caixa calado — ninguém percebe;
   - BANDO: a equipe inteira parada no salão — o segurança desconfia e o
     alerta sai sem anúncio nenhum;
   - ABORTAR: desiste na hora — sem butim, sem preso.
   E o custo: quantos passos por segundo o motor aguenta.
   ========================================================= */
import { criarAssalto, passoAssalto, acaoPossivel, olhosEm, REGUA } from './assalto.js';

const M = 19.43, CEL = 0.25 * M;
/* A LOJA DE MENTIRA (metros): o salão de 12 × 8 com a porta no sul, o
   balcão de vidro, os fundos com o cofre e o gravador, a calçada, a rua e
   o carro */
function lojaDeMentira() {
  const W = 40, H = 30, nx = Math.round(W / 0.25), nz = Math.round(H / 0.25);
  const anda = new Uint8Array(nx * nz).fill(1), ve = new Uint8Array(nx * nz).fill(1), zona = new Uint8Array(nx * nz);
  const raio = 0.22;
  /* a célula que encosta no retângulo (a parede de 20 cm não passa entre os centros das células de 25) */
  const pinta = (x0, z0, x1, z1, f) => {
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = i * 0.25, b = j * 0.25;
      if (a + 0.25 > x0 && a < x1 && b + 0.25 > z0 && b < z1) f(j * nx + i);
    }
  };
  /* parede: não anda (com a folga do corpo) e não se vê; vidro e balcão: não anda, mas se vê */
  const parede = (x0, z0, x1, z1) => { pinta(x0 - raio, z0 - raio, x1 + raio, z1 + raio, k => { anda[k] = 0; }); pinta(x0, z0, x1, z1, k => { ve[k] = 0; }); };
  const vidro = (x0, z0, x1, z1) => pinta(x0 - raio, z0 - raio, x1 + raio, z1 + raio, k => { anda[k] = 0; });
  /* a zona: a loja inteira é 1; atrás do balcão e os fundos, 2 */
  pinta(10, 8, 22, 16, k => { zona[k] = 1; });
  pinta(10, 8, 22, 12, k => { zona[k] = 2; });
  /* as paredes: norte, leste, oeste; o sul é vidro com a porta de 1,6 m */
  parede(10, 7.9, 22, 8.1); parede(9.9, 8, 10.1, 16); parede(21.9, 8, 22.1, 16);
  vidro(10, 15.9, 15, 16.1); vidro(16.6, 15.9, 22, 16.1);
  /* a divisória dos fundos (z 10,5), com a porta de 1 m em x 20–21 */
  parede(10, 10.4, 20, 10.6); parede(21, 10.4, 22, 10.6);
  /* o balcão de vidro (z 12), com a passagem em x 20,6–21,8 */
  vidro(11.5, 11.8, 20.2, 12.2);
  /* o prédio do vizinho de cada lado (opaco) */
  parede(0, 0, 9.6, 15.8); parede(22.4, 0, 40, 15.8);
  /* a rua termina no z 28 (o outro lado da rua) */
  parede(0, 28, 40, 30);
  const P = {
    carro: { x: 30, z: 23, rumo: -Math.PI / 2 },
    porta: { x: 15.8, z: 16.4 }, saidaRua: { x: 15.8, z: 18 },
    funcionarios: [{ papel: 'caixa', x: 13, z: 11.2, rumo: 0 }, { papel: 'atendente', x: 18, z: 11.2, rumo: 0 }, { papel: 'gerente', x: 15, z: 9.3, rumo: 0 }],
    segurancas: [{ x: 15.8, z: 15.2, rumo: Math.PI, ronda: [{ x: 12, z: 13.5 }, { x: 20, z: 13.5 }] }],
    fundos: { x: 16, z: 9.4 },
    clientes: [{ x: 12, z: 13, rumo: Math.PI }, { x: 14, z: 13.2, rumo: Math.PI }, { x: 17, z: 13, rumo: Math.PI }, { x: 19.5, z: 13.4, rumo: Math.PI }, { x: 12.5, z: 15, rumo: 0 }, { x: 20, z: 15, rumo: 0 }],
    rua: [{ x: 2, z: 17.5 }, { x: 10, z: 17.5 }, { x: 20, z: 17.5 }, { x: 30, z: 17.5 }, { x: 38, z: 17.5 }],
    fugaPovo: [{ x: 1, z: 17.5 }, { x: 39, z: 17.5 }],
    olheiros: [{ x: 8, z: 17.2, rumo: -Math.PI / 2 }, { x: 25, z: 17.2, rumo: Math.PI / 2 }],
    chegadaPM: [{ x: 1, z: 23, rumo: Math.PI / 2 }, { x: 39, z: 23, rumo: -Math.PI / 2 }],
    cameras: [{ x: 10.4, z: 10.9, rumo: Math.atan2(1, 1) }, { x: 21.6, z: 15.6, rumo: Math.atan2(-1, -1) }],
    alarmes: [{ x: 13, z: 11.4 }, { x: 15, z: 9.0 }],
    gravador: { x: 11, z: 9 },
    saque: [
      { id: 'caixa', rot: 'Esvaziar o caixa', x: 13, z: 12.6, tempo: 3, peso: 1, dono: 'caixa' },
      { id: 'v1', rot: 'Limpar a vitrine', x: 15, z: 12.6, tempo: 2.5, peso: 2, barulho: true },
      { id: 'v2', rot: 'Limpar a vitrine', x: 17, z: 12.6, tempo: 2.5, peso: 2, barulho: true },
      { id: 'v3', rot: 'Limpar a vitrine', x: 19, z: 12.6, tempo: 2.5, peso: 2, barulho: true },
      { id: 'cofre', rot: 'Abrir o cofre', x: 21, z: 9, tempo: 10, peso: 4, precisa: 2 }
    ]
  };
  /* os pontos em unidades do mundo */
  const U = o => Array.isArray(o) ? o.map(U) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, (k === 'x' || k === 'z') ? v * M : Array.isArray(v) || (v && typeof v === 'object') ? U(v) : v])) : o;
  return { M, x0: 0, z0: 0, cel: CEL, nx, nz, anda, ve, zona, pontos: U(P) };
}
const ALVO = { id: 'joalheria', nome: 'Joalheria', recompensa: 75, exposicao: 70, seguranca: 70, movimentacao: 40, atencao: 75, dificuldade: 70 };
const equipe = n => Array.from({ length: n }, (_, i) => ({ id: 'm' + i, nome: 'Membro ' + i }));

/* o robô: anda até (x, z) em metros pelo caminho da grade; true quando chegou */
function robo(J) {
  let rota = null, iR = 0, alvo = null;
  return {
    ir(x, z) {
      const X = x * M, Z = z * M, L = J.lider;
      if (!alvo || alvo.x !== X || alvo.z !== Z) { alvo = { x: X, z: Z }; rota = J.G.caminho(L.x, L.y, X, Z, 1.5 * M); iR = 0; }
      if (!rota) return { mx: 0, mz: 0, chegou: true };
      while (iR < rota.length && Math.hypot(rota[iR].x - L.x, rota[iR].z - L.y) < 0.3 * M) iR++;
      if (iR >= rota.length) return { mx: 0, mz: 0, chegou: true };
      const dx = rota[iR].x - L.x, dz = rota[iR].z - L.y, n = Math.hypot(dx, dz);
      return { mx: dx / n, mz: dz / n, chegou: false };
    }
  };
}
function rodar(nome, cfg, roteiro, teto = 400) {
  const J = criarAssalto(lojaDeMentira(), Object.assign({ alvo: ALVO, equipe: equipe(10), dentro: 5, abordagem: 'rapido', horario: 'tarde', calor: 20, potencial: 30000, semente: 7 }, cfg));
  const R = robo(J), dt = 1 / 20;
  let passo = 0;
  const log = [];
  const TRACE = process.env.TRACE === nome;
  while (!J.fim && J.t < teto) {
    const ent = roteiro(J, R, passo) || {};
    passoAssalto(J, dt, ent);
    if (TRACE && passo % 10 === 0) console.log(J.t.toFixed(1), 'líder', (J.lider.x / M).toFixed(1), (J.lider.y / M).toFixed(1), 'expo', J.exposicao.toFixed(0), 'susp', J.suspeita,
      J.povo.filter(o => o.consc > 0.02 || o.papel === 'caixa').map(o => `${o.papel}:${o.consc.toFixed(2)}:${o.estado}:${o.visto ? o.visto.id : ''}@${(o.x / M).toFixed(1)},${(o.y / M).toFixed(1)} tp${(o.tProx||0).toFixed(1)} r${o.rota ? o.iRota + '/' + o.rota.length : '-'} np${o.naoPosto ? 1 : 0}`).join(' '),
      '| eq', J.equipe.map(e => `${e.id}${e.correndo ? '*' : ''}@${(e.x / M).toFixed(0)},${(e.y / M).toFixed(0)}`).join(' '));
    for (const a of J.avisos.splice(0)) log.push(`${a.t.toFixed(1)}s ${a.txt}`);
    passo++;
  }
  return { J, log };
}
const falhas = [];
const conferir = (ok, txt) => { console.log((ok ? '  ok · ' : '  FALHOU · ') + txt); if (!ok) falhas.push(txt); };

/* ---- 1. RÁPIDO ---- */
{
  let fase = 0, alvos = ['caixa', 'v1', 'v2', 'v3', 'cofre'];
  const { J, log } = rodar('rápido', {}, (J, R) => {
    const P = J.mapa.pontos;
    if (fase === 0) { const r = R.ir(15.8, 14); if (r.chegou) { fase = 1; return { anunciar: true }; } return { ...r, correr: true }; }
    if (fase === 1) {
      const s = J.saque.find(x => !x.vazio && alvos.includes(x.id));
      if (!s) { fase = 2; return {}; }
      const r = R.ir(s.x / M, s.y / M);
      const ac = acaoPossivel(J);
      if (ac && ac.tipo === 'saque' && ac.alvo === s) return { acao: true };
      return { ...r, correr: true };
    }
    const r = R.ir(P.carro.x / M, P.carro.z / M);
    if (r.chegou) return { acao: true };
    return { ...r, correr: true };
  });
  console.log('RÁPIDO:', JSON.stringify(J.fim)); log.slice(0, 14).forEach(l => console.log('   ', l));
  conferir(J.fim && J.fim.motivo === 'fugiu', 'o rápido termina com a fuga no carro');
  conferir(J.fim && J.fim.butim >= 20000, 'o rápido leva o caixa, as vitrines e o cofre (butim ' + (J.fim && J.fim.butim) + ')');
  conferir(J.fim && J.fim.anunciado, 'o rápido foi anunciado');
}
/* ---- 2. DEMORADO ---- */
{
  let fase = 0;
  const { J, log } = rodar('demorado', { semente: 11 }, (J, R) => {
    if (fase === 0) { const r = R.ir(15.8, 14); if (r.chegou) { fase = 1; return { anunciar: true }; } return r; }
    return {};
  });
  console.log('DEMORADO:', JSON.stringify(J.fim)); log.slice(0, 12).forEach(l => console.log('   ', l));
  conferir(J.fim && J.fim.alerta, 'parado depois do anúncio, o alerta sai');
  conferir(J.fim && J.fim.policia, 'e a polícia chega');
  conferir(J.fim && J.fim.motivo === 'lider-preso', 'e o líder cai');
  conferir(J.fim && J.fim.presos.length >= 3, 'com mais gente presa (' + (J.fim && J.fim.presos.length) + ')');
}
/* ---- 3. FURTIVO ---- */
{
  let fase = 0, esperou = 0;
  const { J, log } = rodar('furtivo', { abordagem: 'furtivo', horario: 'fechamento', noite: true, semente: 5 }, (J, R, k) => {
    const P = J.mapa.pontos;
    if (fase === 0) { fase = 1; return { ordem: 'esperar' }; }
    /* a equipe fica no carro; o líder entra, manda um distrair o segurança
       e para na frente do caixa, olhando a vitrine */
    if (fase === 1) { const r = R.ir(15.6, 14.4); if (r.chegou) { fase = 2; return { distrair: true }; } return r; }
    if (fase === 2) { const r = R.ir(13.6, 13.2); if (r.chegou) fase = 3; return r; }
    if (fase === 3) {
      /* espera o caixa ir pros fundos e ninguém (fora a câmera) estar olhando */
      esperou += 1 / 20;
      const caixa = J.povo.find(o => o.papel === 'caixa');
      const s = J.saque.find(x => x.id === 'caixa');
      if (s.vazio || esperou > 150) { fase = 4; return {}; }
      if (caixa && Math.hypot(caixa.x - s.x, caixa.y - s.y) > 2.5 * M) {
        const r = R.ir(13, 12.9);
        if (!r.chegou) return r;
        return olhosEm(J, J.lider).filter(o => !o.camera).length ? {} : { acao: true };
      }
      return {};
    }
    const r = R.ir(P.carro.x / M, P.carro.z / M);
    if (r.chegou) return { acao: true };
    return r;
  });
  console.log('FURTIVO:', JSON.stringify(J.fim), 'esperou', esperou.toFixed(1), 's'); log.slice(0, 12).forEach(l => console.log('   ', l));
  conferir(J.fim && J.fim.motivo === 'fugiu' && J.fim.butim > 0, 'o furtivo pega o caixa calado e vai embora');
  conferir(J.fim && !J.fim.anunciado, 'sem anunciar');
}
/* ---- 4. BANDO ---- */
{
  let fase = 0;
  const { J, log } = rodar('bando', { abordagem: 'furtivo', semente: 3 }, (J, R) => {
    if (fase === 0) { const r = R.ir(16, 14); if (r.chegou) fase = 1; return r; }
    return {};
  }, 90);
  console.log('BANDO: t', J.t.toFixed(1), 'alerta', J.alerta, 'suspeitaMax', J.suspeitaMax, 'exposição', J.exposicao.toFixed(0)); log.slice(0, 8).forEach(l => console.log('   ', l));
  conferir(J.alerta, 'a equipe inteira parada no salão acaba chamando a atenção');
  conferir(!J.anunciado, 'sem anúncio');
}
/* ---- 5. ABORTAR ---- */
{
  const { J } = rodar('abortar', {}, (J) => J.t > 2 ? { abortar: true } : {});
  console.log('ABORTAR:', JSON.stringify(J.fim));
  conferir(J.fim && J.fim.abortou && J.fim.butim === 0 && J.fim.presos.length === 0, 'abortar na hora: sem butim, sem preso');
}
/* ---- o custo ---- */
{
  const J = criarAssalto(lojaDeMentira(), { alvo: ALVO, equipe: equipe(20), dentro: 8, abordagem: 'rapido', horario: 'tarde', potencial: 30000, semente: 2 });
  passoAssalto(J, 0.05, { anunciar: true });
  const t0 = performance.now(); let n = 0;
  while (performance.now() - t0 < 1000 && !J.fim) { passoAssalto(J, 1 / 30, {}); n++; }
  console.log(`CUSTO: ${n} quadros de 1/30 s em 1 s (${J.discos.length} discos, ${J.policiais.length} PMs, t = ${J.t.toFixed(0)} s)`);
  conferir(n > 300, 'o motor roda bem mais rápido que o quadro');
}
console.log(falhas.length ? `\n${falhas.length} FALHA(S)` : '\ntodas as conferências passaram');
process.exit(falhas.length ? 1 : 0);
