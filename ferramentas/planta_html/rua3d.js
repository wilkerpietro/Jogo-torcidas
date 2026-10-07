/* =========================================================
   A RUA LIVRE (o jogo 3D, 07/10/2026)

   O dono: "Preciso aprimorar a dinâmica do jogo pros dias sem nada
   marcado fora as ações passivas do expediente da sede serem liberados
   pro jogador explorar o mapa do jogo e executar ações de maneira livre
   como bater em rivais, tentar aumentar o domínio num bairro executando
   ações e podendo também assaltar sozinho. [...] Recrutar ou querer
   pixar um bairro rival pode ser perigoso, pois pode ativar a animação
   do rival querendo atrapalhar tal ato (novas cenas de briga surgindo)."

   O DIA LIVRE: o dia sem nada marcado (sem jogo nem viagem do clube, sem
   reunião, operação, bote, treta ou investida) começa com um recado da
   diretoria no balão: "Sair pra rua" ou "Ficar na sede" (e "Não perguntar
   mais"). Ficando, o dia passa como sempre. O botão "Sair pra rua" fica
   no canto do dia livre pra quem mudar de ideia.

   NA RUA: o presidente (o jogador) sai pela porta da sede a pé, com a
   camisa da torcida — o boneco a pé do cenário (cenario.js: o joystick, o
   WASD, a colisão, a câmera de cima) — e o bonde dele (os quatro mais
   fortes de pé) vem atrás, pela trilha que ele faz. O relógio do dia anda
   no passo da rua (RUA_MS_MIN por minuto, a 1×: o dia inteiro em uns dez
   minutos), as mensagens caem na hora delas e a decisão para o tempo,
   no balão em cima de quem anda com ele. Às 23h a rapaziada volta pra
   sede (ou antes, no "Voltar pra sede").

   O QUE DÁ PRA FAZER (o painel embaixo mostra o que está ao alcance):
   - PIXAR o muro perto (o saldo de pixação do mês: TO.dominio.pixar);
   - PANFLETAR no bairro (uma vez por bairro e por dia: o recrutamento com
     a diretoria na rua e +1 no domínio dele — TO.acoes.panfletar);
   - PARTIR PRA CIMA da roda da rival (a briga na rua, no lugar) e
     DESFAZER A PANFLETAGEM dela (os três que recrutam no bairro);
   - ASSALTAR a loja perto, SOZINHO (o assalto em 3D com a equipe de um:
     só o presidente entra, e o potencial é a metade).
   O PERIGO: pixar ou panfletar no bairro da rival pode chamar a turma
   dela (25% a 60%, pela barra): eles vêm correndo pela calçada e, se
   alcançam, a briga começa. A roda da rival no bairro dela encara quem
   chega perto e parte pra cima — uma vez: depois da briga, a roda que
   ficou de pé espera o presidente se afastar (PERTO.tregua) pra encarar
   de novo, e a derrotada sai da rua no resto do dia. E a panfletagem
   NOSSA e as RODAS NOSSAS podem ser atacadas (TO.dominio: a IA que vê o
   bairro): o recado chega na hora, e o jogador decide se vai defender.

   A SETA NA BORDA (também do dia de jogo): um alvo no mundo vira uma seta
   na beira da área livre da tela, apontando pra ele, com a distância.
   ========================================================= */
import { areaLivre, horaTxt, andarPor } from './vida3d.js';

/* o passo do relógio na rua: ms por minuto do dia, a 1× (o 2× do jogo vale) */
const RUA_MS_MIN = 600;
const INI = 7 * 60, FIM = 23 * 60;
/* quantos andam com o presidente */
const BONDE = 4;
/* o recado do dia livre (desligado: só o botão no canto) */
const SEM_RECADO = true;
/* a largura que cabe na tela a pé (m): mais aberto que o a pé do cenário */
const VAO = 22;
/* os alcances (m): o grupo, o muro, a porta da loja */
const PERTO = { grupo: 12, muro: 4.5, loja: 7, encara: 7, desiste: 75, alcanca: 3.2, tregua: 20 };
/* o tempo de cada ação (min do dia) */
const DURA = { pixar: 20, panfletar: 60, briga: 30, assalto: 60 };
/* os recados que dizem que o dia tem coisa marcada */
const AGENDADOS = new Set(['partida', 'reuniao', 'treta', 'guerra', 'sofrido', 'escolta', 'assalto-dia', 'barrival',
                           'casarival', 'reuniaorival', 'lnt-treta', 'filial-caravana', 'filial-ataque', 'jogo-praca']);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const minutoDe = h => { const m = /^(\d\d?):(\d\d)/.exec(String(h || '')); return m ? +m[1] * 60 + +m[2] : null; };
const T_ = (s, p) => typeof window._t === 'function' ? window._t(s, p) : String(s).replace(/\{(\w+)\}/g, (m, k) => p && p[k] != null ? p[k] : m);
const slugDaPraca = n => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '-');

/* =======================================================
   O BONDE QUE SEGUE: cada um vai no lugar dele atrás do líder, pela
   trilha que o líder fez (a rua por onde ele passou), com a folga do lado
   que cabe ali. Serve pra rua livre (quatro) e pra ida do dia de jogo (o
   bonde inteiro)
   ======================================================= */
export function criarSeguidores(discos, o = {}) {
  const M = o.M, cabe = o.cabe || (() => true);
  const trilha = [];
  let L = 0, parado = 0;
  /* o desenho: quantos por fila e o espaço (m) */
  const porFila = o.porFila || 2, passo = o.passo || 1.15, largura = o.largura || 1.5, folga0 = o.folga0 || 1.6;
  /* (o desenho pode vir de fora: o bonde do dia de jogo tem o dele, o do plano) */
  const lugarDe = o.lugarDe || (k => {
    const fila = Math.floor(k / porFila), col = k % porFila;
    const lat = porFila === 1 ? 0 : (col / (porFila - 1) - 0.5) * 2 * largura * (porFila > 2 ? 1 : 0.55);
    return { atras: folga0 + fila * passo + (col % 2 ? 0.35 : 0), lat };
  });
  function registrar(x, z) {
    const u = trilha[trilha.length - 1];
    if (!u) { trilha.push({ x, z, s: 0 }); return false; }
    const d = Math.hypot(x - u.x, z - u.z);
    if (d < 0.3 * M) return false;
    L += d;
    trilha.push({ x, z, s: L });
    if (trilha.length > 6000) trilha.splice(0, 2000);
    return true;
  }
  const Q = { x: 0, z: 0, tx: 1, tz: 0 };
  function ponto(s) {
    if (!trilha.length) return null;
    if (s <= trilha[0].s) { const a = trilha[0], b = trilha[1] || a; Q.x = a.x; Q.z = a.z; const dl = Math.hypot(b.x - a.x, b.z - a.z) || 1; Q.tx = (b.x - a.x) / dl; Q.tz = (b.z - a.z) / dl; return Q; }
    let lo = 0, hi = trilha.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (trilha[m].s <= s) lo = m; else hi = m - 1; }
    const a = trilha[lo], b = trilha[Math.min(trilha.length - 1, lo + 1)], seg = b.s - a.s || 1, t = clamp((s - a.s) / seg, 0, 1);
    Q.x = a.x + (b.x - a.x) * t; Q.z = a.z + (b.z - a.z) * t;
    const dl = Math.hypot(b.x - a.x, b.z - a.z) || 1; Q.tx = (b.x - a.x) / dl; Q.tz = (b.z - a.z) / dl;
    return Q;
  }
  /* começa com a trilha de onde eles estão até o líder (a porta da sede);
     sem caminho (o líder posto num lugar), uma trilha de 10 m atrás dele,
     pro lado que cabe — e cada um já no lugar dele */
  function semear(x0, z0, x1, z1, rumo) {
    trilha.length = 0; L = 0;
    if (Math.hypot(x1 - x0, z1 - z0) < 1.5 * M) {
      let melhor = null;
      for (const a of [rumo == null ? 0 : rumo + Math.PI, 0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        const dx = Math.sin(a), dz = Math.cos(a);
        let ok = 0;
        for (let k = 1; k <= 10; k++) if (cabe(x1 + dx * k * M, z1 + dz * k * M)) ok++; else break;
        if (!melhor || ok > melhor.ok) melhor = { dx, dz, ok };
        if (ok >= 10) break;
      }
      const len = Math.max(2, melhor ? melhor.ok : 2);
      x0 = x1 + melhor.dx * len * M; z0 = z1 + melhor.dz * len * M;
    }
    registrar(x0, z0);
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / (0.5 * M));
    for (let i = 1; i <= n; i++) registrar(x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n);
    /* (cada um no lugar dele já, sem correr do mesmo ponto) */
    discos.forEach((d, k) => { const lg = lugarDe(k), q = ponto(L - lg.atras * M); if (q) { d.x = q.x + q.tz * lg.lat * 0.5 * M; d.y = q.z - q.tx * lg.lat * 0.5 * M; } });
  }
  function quadro(dt, lider) {
    const andou = registrar(lider.x, lider.y);
    parado = andou ? 0 : parado + dt;
    discos.forEach((d, k) => {
      if (d.fora) return;
      const lg = lugarDe(k), q = ponto(L - lg.atras * M);
      if (!q) return;
      /* a folga do lado: o que cabe ali (metade, nada) */
      let x = q.x, z = q.z;
      for (const f of [1, 0.5, 0]) {
        const xx = q.x + q.tz * lg.lat * f * M, zz = q.z - q.tx * lg.lat * f * M;
        if (f === 0 || cabe(xx, zz)) { x = xx; z = zz; break; }
      }
      const dx = x - d.x, dz = z - d.y, dist = Math.hypot(dx, dz);
      const vmax = (dist > 6 * M ? 7 : dist > 2 * M ? 4.5 : 2.4) * M * dt;
      if (dist > 25 * M) { d.x = x; d.y = z; }
      else if (dist > 1e-3) { const k2 = Math.min(1, vmax / dist); d.x += dx * k2; d.y += dz * k2; }
      const v = dt > 0 ? Math.min(dist, vmax) / dt / M : 0;
      d._cacando = v > 3.2;
      d.passada = v > 3.2 ? 2.0 : 1.12;
      if (v > 0.25) d.rumo = Math.atan2(dx, dz);
      else if (parado > 0.6) d.rumo = Math.atan2(lider.x - d.x, lider.y - d.y);
      if (o.chao) d.alt = o.chao(d.x, d.y);
    });
  }
  return { quadro, semear, get L() { return L; }, ponto };
}

/* =======================================================
   A SETA NA BORDA: o alvo fora da tela vira uma seta na beira da área
   livre; dentro dela, um alfinete em cima dele. A distância embaixo
   ======================================================= */
export function criarSeta(C, M) {
  const el = document.createElement('div');
  el.className = 'j3d-seta'; el.hidden = true;
  el.innerHTML = '<i class="j3d-seta-ponta"></i><b class="j3d-seta-rot"></b><small class="j3d-seta-dist"></small>';
  document.body.appendChild(el);
  const ponta = el.querySelector('.j3d-seta-ponta'), rot = el.querySelector('.j3d-seta-rot'), dist = el.querySelector('.j3d-seta-dist');
  const P = {};
  let alvo = null;
  function pintar(de) {
    const Cn = C();
    if (!alvo || !Cn || !Cn.vida || !Cn.vida.projetar || document.body.classList.contains('em-cena') || document.body.classList.contains('com-painel')) { el.hidden = true; return; }
    const A = areaLivre(), H = innerHeight;
    const y0 = 96, y1 = H - 150, x0 = A.x0 + 26, x1 = A.x1 - 26;
    const q = Cn.vida.projetar(alvo.x, (alvo.y || 0) + 2.2 * M, alvo.z, P);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    let x = q.x, y = q.y, dentro = q.frente && x > x0 && x < x1 && y > y0 && y < y1;
    if (!q.frente) { x = cx - (q.x - cx) * 1000; y = cy - (q.y - cy) * 1000; }
    let ang;
    if (dentro) { ang = Math.PI / 2; }
    else {
      /* da tela do meio até o alvo, cortado na borda da área livre */
      const dx = x - cx, dy = y - cy;
      ang = Math.atan2(dy, dx);
      const kx = dx ? ((dx > 0 ? x1 : x0) - cx) / dx : Infinity, ky = dy ? ((dy > 0 ? y1 : y0) - cy) / dy : Infinity;
      const k = Math.min(Math.abs(kx), Math.abs(ky));
      x = cx + dx * k; y = cy + dy * k;
    }
    el.hidden = false;
    el.classList.toggle('dentro', !!dentro);
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    /* (o nome e a distância não saem da tela: na beira, encostam pro lado de dentro) */
    const lado = x > innerWidth - 90 ? 'calc(-100% + 17px)' : x < 90 ? '-17px' : '-50%';
    if (rot.style.transform !== `translateX(${lado})`) { rot.style.transform = dist.style.transform = `translateX(${lado})`; }
    ponta.style.transform = `rotate(${ang.toFixed(3)}rad)`;
    if (rot.textContent !== (alvo.rot || '')) rot.textContent = alvo.rot || '';
    if (de) {
      const m = Math.round(Math.hypot(alvo.x - de.x, alvo.z - de.z) / M);
      const t = m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : m + ' m';
      if (dist.textContent !== t) dist.textContent = t;
    }
  }
  return {
    alvo(a) { alvo = a || null; if (!alvo) el.hidden = true; },
    get alvoAtual() { return alvo; },
    pintar, el
  };
}

/* =======================================================
   A RUA LIVRE
   ======================================================= */
export function criarRua(api, vida, dia3d, nevoa) {
  const M = api.M;
  const C = () => api.cenario;
  const E = () => window.TO && TO.estado && TO.estado.E;
  const vel = () => (TO.diaJogo && TO.diaJogo.ponte && TO.diaJogo.ponte.velocidade) || 1;
  /* a sessão na rua */
  let S = null, hud = null, seta = null, btSair = null, tBotoes = 0, avisoEl = null, tAviso = 0;
  let livreDe = null, livreHoje = false;

  /* ======================================================
     O DIA LIVRE
     ====================================================== */
  function diaLivreHoje(e) {
    if (!e || !e.torcida || !e.temporada || !e.data) return false;
    const F = TO.feed;
    if (F.diaLivre && !F.diaLivre(e, e.data.semana, e.data.dia)) return false;
    if (dia3d.ativo || dia3d.montando || dia3d.jogoNoFundoHoje) return false;
    const hoje = e.data.absoluto || 0, doDia = m => m && m.quando && m.quando.abs === hoje;
    if ((e.feedFila || []).some(m => doDia(m) && AGENDADOS.has(m.kind))) return false;
    if ((e.feed || []).some(m => doDia(m) && AGENDADOS.has(m.kind) && !m.respondido)) return false;
    const hojeE = o => o.ano === e.data.ano && o.semana === e.data.semana && o.dia === e.data.dia;
    if ((e.assaltos || []).some(o => !o.feito && !o.cancelado && !o.sozinho && hojeE(o))) return false;
    if ((e.botes || []).some(b => !b.feito && hojeE(b))) return false;
    return true;
  }
  /* a praça na tela é a da torcida, com a vida ligada */
  function naPracaNossa() {
    const e = E(), Cn = C();
    if (!e || !e.torcida || !Cn || Cn.montando || !vida.ligada) return false;
    const nossa = api.pracaDe ? api.pracaDe(e.torcida.mapa) : null;
    return !!nossa && Cn.praca === nossa;
  }
  /* o recado do dia livre, no começo dele (a virada do dia, o jogo que abriu) */
  function conferirDiaLivre(e) {
    e = e || E();
    if (!e || !e.data) return;
    const chave = `${e.data.ano}|${e.data.semana}|${e.data.dia}`;
    if (livreDe !== chave) { livreDe = chave; livreHoje = diaLivreHoje(e); }
    /* O RECADO SAIU (o dono, 07/10/2026: "Pare de gerar a mensagem de dia livre
       e deixe o botão no canto de sair pra rua pra quando o jogador quiser
       agir"): o dia livre fica só no botão "Sair pra rua" */
    if (SEM_RECADO || !livreHoje || S || e.ruaLivre === 'nunca' || !TO.feed || !TO.feed.propor) return;
    const m = TO.feed.propor(e, {
      kind: 'dia-livre', peso: 'decisao', voz: 'diretor', chave: 'dia-livre|' + chave, hora: '07:05',
      texto: T_('Dia livre, presidente: nada marcado pra hoje, nem jogo nem operação. A rua tá aí — dá pra pixar muro, panfletar num bairro, caçar a rival na calçada ou tentar a sorte numa loja. O bonde tá na porta.'),
      botoes: [{ id: 'rua', rot: T_('Sair pra rua'), acao: 'jogo3d' }, { id: 'sede', rot: T_('Ficar na sede'), acao: 'jogo3d' },
               { id: 'nunca', rot: T_('Não perguntar mais'), acao: 'jogo3d' }]
    });
    /* (o recado vai pra frente da fila: é o primeiro do dia) */
    if (m) { const f = e.feedFila, i = f.indexOf(m); if (i > 0) { f.splice(i, 1); f.unshift(m); } }
  }

  /* ======================================================
     SAIR PRA RUA
     ====================================================== */
  const torcidaDoJogador = e => {
    const P = api.planta, t = P && P.torcidas ? P.torcidas().find(x => x.id === e.torcida.id) : null;
    const c = TO.mundo.coresDaTorcida ? TO.mundo.coresDaTorcida(e.torcida) : {};
    return { id: e.torcida.id, nome: e.torcida.nome, cor: (t && t.cor) || c.cor, cor2: (t && t.cor2) || c.cor2, cor3: (t && t.cor3) || c.cor3 };
  };
  function discoDoMembro(m, T, x, z) {
    return { nome: TO.membros.nomeDe ? TO.membros.nomeDe(m) : (m.apelido || 'membro'), spawn: 'rua-livre', tid: T.id, torcida: T.nome,
             cor: T.cor, cor2: T.cor2, cor3: T.cor3 || undefined, x, y: z, alt: 0, rumo: 0, vivo: true, lider: false, passada: 1.12, jeito: 'rua',
             derrubado: 0, golpe: 0, apanhou: 0, atordoado: 0, esquivou: 0, tremor: 0, defendendo: 0, hostil: 0, inimigoPerto: 0, chamou: -99,
             linha: 'frente', mundo: true, membroId: m.id };
  }
  /* `o`: { x, z (onde ele aparece; sem eles, a porta da sede), motivo } */
  async function sair(o = {}) {
    const e = E(), Cn = C();
    if (S || !e || !Cn || !Cn.aPe || dia3d.ativo || !naPracaNossa()) return false;
    const pres = (TO.membros.presidente && TO.membros.presidente(e)) || TO.membros.aptosParaOEstadio(e)[0];
    if (!pres || pres.preso) { avisar(T_('O presidente não pode sair agora.')); return false; }
    const porta = api.sedeDe ? api.sedeDe(e.torcida.id) : null, casa = porta || (api.casaDe ? api.casaDe(e.torcida.id) : null);
    if (!casa && o.x == null) return false;
    const fora = porta ? 2.2 * M : 0;
    const x = o.x != null ? o.x : casa.x + (casa.fx || 0) * fora, z = o.z != null ? o.z : casa.y + (casa.fy || 0) * fora;
    const T = torcidaDoJogador(e);
    const aptos = TO.membros.aptosParaOEstadio(e).filter(m => m !== pres && m.id !== pres.id)
      .sort((a, b) => (b.forca + b.defesa) - (a.forca + a.defesa));
    const bonde = aptos.slice(0, BONDE);
    S = { e, pres, T, bonde, min: clamp(vida.relogio.minuto, INI, FIM - 1), acao: null, perigo: null, briga: null, voltando: null,
          discos: [], seg: null, falando: null, tEncara: new Map(), tregua: new Set(), motivo: o.motivo || 'livre', entrando: true };
    TO.tela.pausarTempo('rua');
    vida.naRua = true;
    let ok = false;
    try {
      ok = await Cn.aPe.entrar({ x, z, camisa: e.torcida.id, vao: VAO,
                                disco: { nome: TO.membros.nomeDe ? TO.membros.nomeDe(pres) : 'Presidente', tid: e.torcida.id, membroId: pres.id } });
    } catch (err) { console.error('a rua livre: o presidente não saiu', err); ok = false; }
    if (!ok || !S) { if (S) { S = null; vida.naRua = false; TO.tela.retomarTempo('rua'); } return false; }
    S.entrando = false;
    /* (uma briga de fora tomou a tela enquanto ele saía: a pé, só depois dela) */
    if (S.briga) { if (Cn.aPe.ativo) Cn.aPe.sair(false); montarHud(); return true; }
    montarBonde(x, z);
    montarHud();
    pintarHud(true);
    if (o.depois) try { o.depois(); } catch (err) { console.error('a rua livre:', err); }
    return true;
  }
  /* o bonde atrás do presidente (os de pé: quem caiu na briga fica de fora) */
  function montarBonde(x, z) {
    const Cn = C(), e = S.e;
    S.bonde = S.bonde.filter(m => !m.preso && !m.ferido && e.membros.includes(m));
    const porta = api.sedeDe ? api.sedeDe(e.torcida.id) : null;
    const bx = porta ? porta.x + porta.fx * 0.4 * M : x, bz = porta ? porta.y + porta.fy * 0.4 * M : z;
    S.discos = S.bonde.map((m, k) => discoDoMembro(m, S.T, bx - k * 0.3 * M, bz));
    S.seg = criarSeguidores(S.discos, { M, porFila: 2, passo: 1.2, largura: 0.85, folga0: 1.5,
                                        cabe: (px, pz) => Cn.vida.cabe(px, pz, 0.25), chao: (px, pz) => Cn.vida.chao(px, pz) });
    const daPorta = porta && Math.hypot(bx - x, bz - z) < 30 * M;
    const eu = lider();
    S.seg.semear(daPorta ? bx : x, daPorta ? bz : z, x, z, eu ? eu.rumo : null);
    Cn.vida.extras = S.discos;
  }
  /* VOLTAR PRA SEDE (o botão, a noite, a virada do dia, o presidente que caiu) */
  function encerrar(motivo) {
    if (!S) return;
    const s = S, Cn = C();
    S = null;
    vida.naRua = false;
    if (Cn && Cn.vida) Cn.vida.extras = [];
    if (Cn && Cn.aPe && Cn.aPe.ativo) Cn.aPe.sair(false);
    if (s.briga) soltarNossaRoda(s.briga.nossaRoda);
    if (s.voltando) soltarNossaRoda(s.voltando.nossaRoda);
    for (const g of vida.grupos) if (g.preso) { g.preso = false; g.mover = null; }
    if (hud) hud.hidden = true;
    if (seta) seta.alvo(null);
    if (motivo === 'noite') { vida.relogio.definir(FIM); avisar(T_('A noite caiu: o presidente e o bonde voltaram pra sede.')); }
    else if (motivo === 'preso') avisar(T_('O presidente caiu na briga: o bonde levou ele de volta pra sede.'));
    else if (motivo === 'reuniao') avisar(T_('A diretoria chamou: o presidente voltou pra sede pra reunião.'));
    TO.tela.retomarTempo('rua');
    if (vida.ligada && motivo !== 'virou') vida.irPraSala();
    pintarBotaoSair();
    return s;
  }

  /* ======================================================
     O RELÓGIO NA RUA
     ====================================================== */
  const cobre = () => {
    const b = document.body.classList;
    return b.contains('em-cena') || b.contains('com-painel') || b.contains('j3d-mapa-aberto') || b.contains('palco-briga') || b.contains('palco3d') ||
      !!document.querySelector('.tela-cheia:not(.oculto):not(#telaMenu)');
  };
  function pausada() {
    const e = S.e;
    return !!(S.briga || S.voltando || S.assaltando || S.entrando || TO.feed.travado(e) || cobre() || (C() && C().pausado) || (TO.tela.assaltoNoAr));
  }
  function droparAte(min) {
    const e = S.e, hoje = e.data.absoluto || 0;
    for (let k = 0; k < 4; k++) {
      const m = (e.feedFila || [])[0];
      if (!m) break;
      const doDia = m.quando && m.quando.abs === hoje, h = minutoDe(m.hora);
      if (!doDia || (h != null && h > min)) break;
      const caiu = TO.feed.dropar(e);
      if (!caiu) break;
      const R = TO.jogo3d && TO.jogo3d.ritmo;
      try { if (R && R.caiu) R.caiu(e, caiu); } catch (err) { console.error('a rua livre, o recado:', err); }
      if (TO.tela.pintarTopo) TO.tela.pintarTopo();
      if (TO.tela.atualizarBadges) try { TO.tela.atualizarBadges(); } catch (err) { /* (os números do menu) */ }
      if (TO.feed.travado(e)) break;
    }
  }
  function andarRelogio(dt) {
    if (pausada()) return;
    const acel = S.acao ? S.acao.acelera || 1 : 1;
    S.min = Math.min(FIM, S.min + dt * 1000 * vel() * acel / RUA_MS_MIN);
    vida.relogio.definir(S.min);
    droparAte(S.min);
    if (S.min >= FIM - 1e-6) encerrar('noite');
  }
  /* o tempo que uma ação gasta (min): o relógio pula, com as mensagens no caminho */
  function gastar(min) {
    if (!S) return;
    S.min = Math.min(FIM, S.min + min);
    vida.relogio.definir(S.min);
    droparAte(S.min);
    if (S.min >= FIM - 1e-6) encerrar('noite');
  }

  /* ======================================================
     ONDE ELE ESTÁ: o bairro, a dona, o que está ao alcance
     ====================================================== */
  function lider() { const Cn = C(); return Cn && Cn.aPe ? Cn.aPe.eu : null; }
  function bairroAqui(x, z) {
    const P = api.planta, e = S.e, D = TO.dominio;
    const bid = P && P.bairroEm ? P.bairroEm(x, z) : null;
    if (!bid || !D) return null;
    const b = D.bairros(e, e.torcida.mapa).find(q => q.id === bid);
    return b ? { id: b.id, nome: b.nome, dono: b.dono, v: b.v, partes: b.partes } : null;
  }
  const nomeDaTorcida = tid => { const o = TO.mundo.torcida(tid); return o ? o.nome : tid; };
  const siglaDe = tid => { const o = TO.mundo.torcida(tid); return o && TO.mundo.siglaTorcida ? TO.mundo.siglaTorcida(o) : nomeDaTorcida(tid); };
  const rival = tid => !!(TO.dominio && TO.dominio.rivais && TO.dominio.rivais(S.e, S.e.torcida.id, tid));
  const amiga = tid => !!(TO.dominio && TO.dominio.amigas && TO.dominio.amigas(S.e, S.e.torcida.id, tid));
  /* o muro de pixação mais perto, ao alcance */
  function muroPerto(x, z) {
    const P = api.planta;
    if (!P || !P.murosDePixo) return null;
    let melhor = null, dm = PERTO.muro * M;
    for (const m of P.murosDePixo()) { const d = Math.hypot(m.x - x, m.y - z); if (d < dm) { dm = d; melhor = m; } }
    return melhor;
  }
  function lojaPerto(x, z) {
    const P = api.planta;
    if (!P || !P.lojas) return null;
    let melhor = null, dm = PERTO.loja * M;
    for (const l of P.lojas()) { const d = Math.hypot(l.porta.x - x, l.porta.y - z); if (d < dm) { dm = d; melhor = l; } }
    return melhor;
  }
  function grupoPerto(x, z) {
    let melhor = null, dm = PERTO.grupo * M;
    for (const g of vida.grupos) {
      if (g.tid === S.e.torcida.id || amiga(g.tid) || g.preso) continue;
      if (nevoa && !nevoa.visivel(g.x, g.z)) continue;
      const d = Math.hypot(g.x - x, g.z - z);
      if (d < dm) { dm = d; melhor = g; }
    }
    return melhor;
  }
  const NOMES_LOJA = { banco: 'o banco', joalheria: 'a joalheria', supermercado: 'o supermercado', posto: 'o posto', mercadinho: 'o mercadinho', roupas: 'a loja de roupas' };
  /* as ações ao alcance, na ordem do painel */
  function acoesAgora() {
    const eu = lider();
    if (!eu || !S || S.acao || S.briga) return [];
    const e = S.e, D = TO.dominio, out = [], x = eu.x, z = eu.y;
    const b = bairroAqui(x, z);
    S.bairro = b;
    if (S.perigo) out.push({ id: 'encarar', rot: T_('Encarar a {sigla}', { sigla: siglaDe(S.perigo.tid) }), titulo: T_('Parte pra cima de quem veio atrapalhar'), quente: true });
    const g = grupoPerto(x, z);
    if (g && !(S.perigo && S.perigo.g === g)) out.push({ id: 'atacar', g, quente: true,
      rot: g.tipo === 'panfleto' ? T_('Desfazer a panfletagem da {sigla}', { sigla: g.sigla || siglaDe(g.tid) }) : T_('Partir pra cima da {sigla}', { sigla: g.sigla || siglaDe(g.tid) }),
      titulo: T_('{n} da {nome} · a briga é aqui mesmo', { n: g.gente.length, nome: g.nome }) });
    const mu = muroPerto(x, z);
    if (mu && D && D.muros) {
      const dono = (D.muros(e, e.torcida.mapa, mu.b) || [])[mu.i];
      const sd = D.saldoPix ? D.saldoPix(e, e.torcida.id) : { total: 0 };
      if (!dono || dono.t !== e.torcida.id) out.push({ id: 'pixar', mu, rot: T_('Pixar o muro ({n})', { n: sd.total }),
        titulo: dono && dono.t ? T_('Por cima da {nome} · sobram {n} pixações no mês', { nome: nomeDaTorcida(dono.t), n: sd.total }) : T_('Muro livre · sobram {n} pixações no mês', { n: sd.total }),
        off: sd.total <= 0 });
    }
    const feitas = e.panfletagens && e.panfletagens.abs === e.data.absoluto ? e.panfletagens.feitas : [];
    if (b && !feitas.includes(b.id)) out.push({ id: 'panfletar', b, rot: T_('Panfletar aqui'), titulo: T_('Uma hora panfletando em {bairro}: recrutamento e +1 no domínio', { bairro: b.nome }) });
    const lj = lojaPerto(x, z);
    if (lj) out.push({ id: 'assaltar', loja: lj, rot: T_('Assaltar {loja} sozinho', { loja: T_(NOMES_LOJA[lj.tipo] || 'a loja') }), titulo: T_('Só o presidente entra: o potencial é a metade'), quente: true });
    return out;
  }

  /* ======================================================
     AS AÇÕES
     ====================================================== */
  function pixar(mu) {
    const e = S.e, D = TO.dominio, cid = e.torcida.mapa;
    const r = D.pixar(e, e.torcida.id, cid, mu.b, mu.i);
    avisar(r.msg || (r.ok ? T_('Pixado.') : T_('Não deu pra pixar.')), !r.ok);
    if (!r.ok) return;
    const Cn = C();
    try { if (Cn && Cn.pixos) Cn.pixos.atualizar(); } catch (err) { /* (a camada dos muros repinta no tempo dela) */ }
    TO.estado.salvar && TO.estado.salvar();
    S.acao = { tipo: 'pixar', fim: S.min + DURA.pixar, acelera: 8, bairro: bairroAqui(mu.x, mu.y), depois: () => perigoDepois('pixar') };
    posar('pixar');
  }
  function panfletar(b) {
    S.acao = { tipo: 'panfletar', fim: S.min + DURA.panfletar, acelera: 12, bairro: b, depois: () => {
      const r = TO.acoes.panfletar(S.e, b.id);
      avisar(r.msg, !r.ok || !r.n);
      TO.estado.salvar && TO.estado.salvar();
      if (TO.tela.pintarTopo) TO.tela.pintarTopo();
      perigoDepois('panfletar');
    } };
    posar('panfletar');
  }
  /* o presidente e o bonde parados no que estão fazendo */
  function posar(tipo) {
    const eu = lider();
    if (eu) { eu.jeito = tipo === 'panfletar' ? 'puxador' : 'sede'; if (tipo === 'pixar') eu.gestoForcado = 'aponta'; }
    S.discos.forEach((d, k) => { d.jeito = tipo === 'panfletar' ? 'sede' : 'bar'; if (tipo === 'panfletar' && k % 2 === 0) d.gestoForcado = 'aponta'; });
  }
  function desposar() {
    const eu = lider();
    if (eu) { eu.jeito = undefined; eu.gestoForcado = undefined; }
    for (const d of S.discos) { d.jeito = 'rua'; d.gestoForcado = undefined; }
  }
  /* O PERIGO: pixar ou panfletar no bairro da rival chama a turma dela */
  function perigoDepois(tipo) {
    if (!S || S.perigo) return;
    const b = S.acao && S.acao.bairro || S.bairro;
    if (!b || !b.dono || b.dono === S.e.torcida.id || !rival(b.dono)) return;
    const ch = 0.25 + 0.35 * clamp((b.v - 50) / 50, 0, 1);
    if (Math.random() >= ch) return;
    chamarPerigo(b.dono, b, tipo);
  }
  function chamarPerigo(tid, b, tipo) {
    const eu = lider();
    if (!eu || !vida.pontoDoBairro) return;
    const de = vida.pontoDoBairro(b.id, eu.x, eu.y, 35, 70);
    if (!de) return;
    const T = TO.mundo.torcida(tid), cores = T && TO.mundo.coresDaTorcida ? TO.mundo.coresDaTorcida(T) : { cor: '#444', cor2: '#ddd' };
    const n = 3 + Math.floor(Math.random() * 4);
    const g = { chave: 'perigo|' + tid + '|' + Date.now(), tipo: 'perigo', tid, bid: b.id, nomeBairro: b.nome, nome: T ? T.nome : tid, sigla: siglaDe(tid),
                x: de.x, z: de.z, gente: [], preso: true, estado: 'vindo', rota: null, tRota: 0 };
    for (let k = 0; k < n; k++) {
      const d = { nome: (T ? T.nome : 'rival') + ' ' + (k + 1), spawn: 'grupo', tid, torcida: T ? T.nome : '', cor: cores.cor, cor2: cores.cor2, cor3: cores.cor3 || undefined,
                  x: de.x + (k % 3 - 1) * 0.8 * M, y: de.z + Math.floor(k / 3) * 0.9 * M, alt: 0, rumo: 0, vivo: true, passada: 2.0, jeito: 'rua', _cacando: true,
                  derrubado: 0, golpe: 0, apanhou: 0, atordoado: 0, esquivou: 0, tremor: 0, defendendo: 0, hostil: 0, inimigoPerto: 0, chamou: -99, linha: 'frente', mundo: true, grupo: g.chave };
      g.gente.push({ d, k });
    }
    g.mover = moverPerigo;
    const R = vida.rua;
    if (R && R.grupos) R.grupos.set(g.chave, g);
    S.perigo = { g, tid, tipo };
    avisar(T_('A {nome} viu a gente {oque} no bairro dela e tá vindo! Encara ou corre.', { nome: g.nome, oque: tipo === 'pixar' ? T_('pixando') : T_('panfletando') }), true);
  }
  /* quem vem atrapalhar corre pela calçada atrás do presidente; alcançou, é briga; ficou longe, desiste */
  function moverPerigo(g, dt) {
    const eu = lider();
    if (!S || !eu || S.briga) return;
    g.tRota -= dt;
    if (!g.rota || g.tRota <= 0) {
      g.tRota = 1.5;
      const r = vida.rotaNaRua ? vida.rotaNaRua(g.x, g.z, eu.x, eu.y) : null;
      g.rota = r && r.length ? r : [{ x: eu.x, z: eu.y }];
      g.iRota = 0;
    }
    const p = { d: { x: g.x, y: g.z }, rota: g.rota, iRota: g.iRota || 0, vel: 4.6 };
    andarPor(p, dt, M);
    const dx = p.d.x - g.x, dz = p.d.y - g.z;
    g.x = p.d.x; g.z = p.d.y; g.iRota = p.iRota;
    const rumo = Math.hypot(dx, dz) > 1e-4 ? Math.atan2(dx, dz) : Math.atan2(eu.x - g.x, eu.y - g.z);
    g.gente.forEach((x, k) => {
      const lx = (k % 3 - 1) * 0.8 * M, lz = -Math.floor(k / 3) * 1.0 * M, c = Math.cos(rumo), s = Math.sin(rumo);
      x.d.x = g.x + lx * c + lz * s; x.d.y = g.z - lx * s + lz * c; x.d.rumo = rumo; x.d._cacando = true; x.d.passada = 2.1;
      x.d.alt = C().vida.chao(x.d.x, x.d.y);
    });
    const d = Math.hypot(eu.x - g.x, eu.y - g.z) / M;
    if (d < PERTO.alcanca) brigar(g, false);
    else if (d > PERTO.desiste) {
      avisar(T_('A {nome} desistiu: o bonde saiu de perto.', { nome: g.nome }));
      const R = vida.rua; if (R && R.grupos) R.grupos.delete(g.chave);
      S.perigo = null;
    }
  }
  /* A RODA DA RIVAL ENCARA: no bairro dela, quem chega perto é encarado e,
     ficando, a roda parte pra cima (o GTA do pedido do dono). A TRÉGUA (o
     dono, 07/10/2026: "acaba criando um loop que não para de reproduzir a
     mesma cena"): a roda que já brigou com a gente não encara de novo
     enquanto o presidente não sair de perto (PERTO.tregua) — ele volta da
     briga no mesmo lugar, colado nela */
  function rodasEncarando(dt) {
    const eu = lider();
    if (!eu || S.briga || S.perigo) return;
    for (const g of vida.grupos) {
      if (g.tipo !== 'roda' || g.preso || !rival(g.tid)) continue;
      const d = Math.hypot(g.x - eu.x, g.z - eu.y) / M;
      if (S.tregua.has(g.chave)) { if (d > PERTO.tregua) S.tregua.delete(g.chave); continue; }
      const b = S.bairro;
      if (!b || b.id !== g.bid || b.dono !== g.tid) { S.tEncara.delete(g.chave); continue; }
      if (d > PERTO.encara) { S.tEncara.delete(g.chave); for (const x of g.gente) if (x.d.olhaPara === eu) x.d.olhaPara = null; continue; }
      const t = (S.tEncara.get(g.chave) || 0) + dt;
      S.tEncara.set(g.chave, t);
      for (const x of g.gente) x.d.olhaPara = eu;
      if (t > 0.05 && t - dt <= 0.05) avisar(T_('A roda da {nome} encarou a gente. Sai de perto ou vai ter briga.', { nome: g.nome }), true);
      if (t > 2.6) { brigar(g, false); return; }
    }
  }

  /* A BRIGA NA RUA: o presidente sai do a pé, a cena abre no lugar (main.js
     `abrirBrigaLivre`, briga_lugar.js `brigaNaRua`), e no fim ele volta */
  function brigar(g, nosAtacamos, extra = {}) {
    const eu = lider(), Cn = C();
    if (!S || S.briga || !eu || !TO.tela.abrirBrigaLivre) return false;
    const e = S.e;
    const pos = { x: eu.x, z: eu.y };
    const escalacao = [S.pres].concat(S.bonde.filter(m => !m.preso && !m.ferido)).concat(extra.mais || []);
    const deles = extra.deles || (g.gente ? g.gente.length : g.n || 3);
    g.preso = true;
    /* (a encarada acabou aqui: o tempo dela não fica guardado pra depois da briga) */
    S.tEncara.delete(g.chave);
    for (const x of g.gente || []) if (x.d && x.d.olhaPara) x.d.olhaPara = null;
    S.briga = { g, pos, nosAtacamos, nossaRoda: extra.nossaRoda || null };
    S.acao = null; S.perigo = null;
    desposar();
    if (seta) seta.alvo(null);
    if (Cn.vida) Cn.vida.extras = [];
    if (Cn.aPe && Cn.aPe.ativo) Cn.aPe.sair(false);
    const bairro = (g.nomeBairro || (S.bairro && S.bairro.nome) || '');
    const ok = TO.tela.abrirBrigaLivre({
      rivalId: g.tid, deles, escalacao,
      ruaLivre: { nos: pos, eles: { x: g.x, z: g.z }, bairro, nosAtacamos,
                  rot: g.tipo === 'panfleto' ? 'OS QUE PANFLETAM' : g.tipo === 'roda' ? 'A RODA DA ' + String(g.sigla || '').toUpperCase() : 'QUEM VEIO' },
      alvo: { bairro, bid: g.bid, nosAtacamos, panfleto: g.tipo === 'panfleto' && g.tid !== e.torcida.id && nosAtacamos, contraNos: extra.contraNos || null,
              /* a roda da rival (a chave dela: derrotada, sai da rua hoje) e a nossa atacada */
              roda: g.tipo === 'roda' && g.tid !== e.torcida.id ? g.chave : null, contraRoda: extra.contraRoda || null }
    });
    if (!ok) { S.briga = null; g.preso = false; soltarNossaRoda(extra.nossaRoda); voltarAPe(pos); return false; }
    return true;
  }
  /* a cena desmontou (vida3d.js): quando o relatório fechar, o presidente volta pra rua */
  function voltouDaBriga() { if (S && S.briga) S.voltando = S.briga; }
  /* A BRIGA DE FORA (vida3d.js `palcoDe`: o nosso bar atacado, a treta, a
     reunião da zona — o que a rua não abriu): o presidente sai do a pé
     antes de a cena montar (a câmera é da briga, não dele) e, no fim
     dela, volta pra sede (o dono, 07/10/2026). Quem vinha atrapalhar
     desiste */
  function cederAVez() {
    if (!S || S.briga || S.assaltando) return false;
    const eu = lider(), Cn = C();
    const pos = eu ? { x: eu.x, z: eu.y } : S.ultimo || null;
    if (S.perigo && S.perigo.g) vida.tirarGrupo(S.perigo.g.chave);
    S.briga = { g: null, pos, nosAtacamos: false, externa: true };
    S.acao = null; S.perigo = null;
    desposar();
    if (seta) seta.alvo(null);
    if (Cn && Cn.vida) Cn.vida.extras = [];
    if (Cn && Cn.aPe && Cn.aPe.ativo) Cn.aPe.sair(false);
    return true;
  }
  const cenaNoAr = () => { const b = document.body.classList; return b.contains('em-cena') || b.contains('palco-briga'); };
  async function voltarAPe(pos) {
    const Cn = C(), e = S && S.e;
    if (!S || !Cn || !Cn.aPe) return;
    if (!e.membros.includes(S.pres) || S.pres.preso || S.pres.ferido) { encerrar('preso'); return; }
    S.entrando = true;
    let ok = false;
    try {
      ok = await Cn.aPe.entrar({ x: pos.x, z: pos.z, camisa: e.torcida.id, vao: VAO,
                                disco: { nome: TO.membros.nomeDe ? TO.membros.nomeDe(S.pres) : 'Presidente', tid: e.torcida.id, membroId: S.pres.id } });
    } catch (err) { ok = false; }
    if (!S) return;
    S.entrando = false;
    if (!ok) { encerrar('erro'); return; }
    if (S.briga) { if (Cn.aPe.ativo) Cn.aPe.sair(false); return; }
    montarBonde(pos.x, pos.z);
    pintarHud(true);
  }
  function conferirVolta() {
    const v = S.voltando;
    if (!v || cobre()) return;
    S.voltando = null; S.briga = null;
    /* quem brigou sai da rua (fugiu ou foi corrido); a roda que ficou de
       pé volta pro lugar dela, de trégua com a gente (a derrotada não volta:
       TO.dominio.rodaDesfeita) */
    const R = vida.rua;
    if (v.g && R && R.grupos) R.grupos.delete(v.g.chave);
    if (v.g && v.g.tipo === 'roda') S.tregua.add(v.g.chave);
    soltarNossaRoda(v.nossaRoda);
    if (vida.esquecerPanfletos) vida.esquecerPanfletos();
    gastar(DURA.briga);
    if (!S) return;
    /* (a briga de fora acaba na sede — o dono, 07/10/2026: "no fim, ele volta pra sede") */
    if (v.externa || !v.pos) { encerrar('briga'); return; }
    voltarAPe(v.pos);
  }

  /* O ASSALTO SOZINHO: a operação na hora, sem plano nem equipe — só o
     presidente entra (assalto3d.js com a equipe de um, o potencial pela
     metade); o fim é o do assalto marcado (`fecharAssalto`) */
  function escolherAbordagem(loja) {
    const caixa = document.createElement('div');
    caixa.className = 'j3d-rua-escolha';
    caixa.innerHTML = `<p><b>${esc(T_('Assaltar {loja} sozinho', { loja: T_(NOMES_LOJA[loja.tipo] || 'a loja') }))}</b><br><small>${esc(T_('Furtivo: entra como cliente e pega sem ninguém ver. Rápido: anuncia, rende todo mundo e o alarme toca.'))}</small></p>
      <div class="bts"><button data-ab="furtivo">${esc(T_('Furtivo'))}</button><button data-ab="rapido">${esc(T_('Rápido'))}</button><button data-ab="">${esc(T_('Deixar pra lá'))}</button></div>`;
    hud.appendChild(caixa);
    caixa.addEventListener('click', ev => {
      const b = ev.target.closest('[data-ab]');
      if (!b) return;
      caixa.remove();
      if (b.dataset.ab) assaltar(loja, b.dataset.ab);
    });
  }
  async function assaltar(loja, abordagem) {
    const e = S.e, A = TO.acoes, Cn = C(), eu = lider();
    if (!eu || !TO.jogo3d || !TO.jogo3d.assalto) return;
    const h = S.min / 60, horario = h < 12 ? 'abertura' : h < 18 ? 'tarde' : 'fechamento';
    const op = { id: `sozinho|${e.data.absoluto}|${loja.tipo}|${Math.round(S.min)}`, alvo: loja.tipo, n: 1, abordagem, horario,
                 ano: e.data.ano, semana: e.data.semana, dia: e.data.dia, sozinho: true };
    const pos = { x: eu.x, z: eu.y };
    S.assaltando = true;
    if (Cn.vida) Cn.vida.extras = [];
    if (Cn.aPe && Cn.aPe.ativo) Cn.aPe.sair(false);
    TO.tela.pausarTempo('assalto');
    let r = null;
    try { r = await TO.jogo3d.assalto(op, [S.pres]); } catch (err) { console.error('o assalto sozinho:', err); r = null; }
    TO.tela.retomarTempo('assalto');
    if (!S) return;
    S.assaltando = false;
    if (!r || r.erro) avisar(T_('A loja não abriu: {erro}', { erro: (r && r.erro) || '—' }), true);
    else {
      e.assaltos = e.assaltos || [];
      e.assaltos.push(op);
      const f = A.fecharAssalto(e, op, r) || {};
      if (f.texto) avisar(f.texto, !f.butim || f.presos);
      TO.estado.salvar && TO.estado.salvar();
      if (TO.tela.pintarTopo) TO.tela.pintarTopo();
      gastar(DURA.assalto);
    }
    if (S) voltarAPe(pos);
  }

  /* ======================================================
     A NOSSA PANFLETAGEM ATACADA (TO.dominio.contraNosHoje): na hora
     marcada, o recado; "Ir defender" abre a briga na calçada dela
     ====================================================== */
  let contraVisto = null;
  function conferirContraNos(e, min) {
    const D = TO.dominio;
    if (!e || !D || !D.contraNosHoje || !naPracaNossa()) return;
    const c = D.contraNosHoje(e);
    if (!c || c === contraVisto) return;
    const h = minutoDe(c.hora);
    if (h == null || min < h) return;
    contraVisto = c;
    const m = TO.feed.propor(e, {
      kind: 'panfleto-ataque', peso: 'decisao', voz: 'diretor', chave: `panfleto-ataque|${e.data.absoluto}|${c.por}`, hora: horaTxt(min),
      texto: T_('Presidente, a {nome} tá indo pra cima da nossa panfletagem em {bairro}! São {n} deles contra os nossos três.', { nome: c.nome, bairro: c.bairro, n: c.n }),
      dados: { contra: true }, botoes: [{ id: 'defender', rot: T_('Ir defender'), acao: 'jogo3d' }, { id: 'deixar', rot: T_('Deixar'), acao: 'jogo3d' }]
    });
    if (m) { const f = e.feedFila, i = f.indexOf(m); if (i > 0) { f.splice(i, 1); f.unshift(m); } }
  }
  /* a briga da defesa: o presidente e o bonde (e os três que panfletavam) na calçada da panfletagem */
  async function defender(c) {
    const e = E();
    const g = vida.grupos.find(x => x.tipo === 'panfleto' && x.tid === e.torcida.id);
    let onde = g ? { x: g.x, z: g.z } : null;
    if (!onde && vida.pontoDoBairro) { const p = api.sedeDe ? api.sedeDe(e.torcida.id) : null; onde = vida.pontoDoBairro(c.bid, p ? p.x : 0, p ? p.y : 0, 0, 5000); }
    const naConta = () => {
      const r = TO.dominio.resolverContraNos(e, c, null);
      if (!r) return;
      if (vida.esquecerPanfletos) vida.esquecerPanfletos();
      avisar(r.ganhamos ? T_('Os nossos três seguraram a panfletagem em {bairro}.', { bairro: c.bairro })
                        : T_('A {nome} desfez a nossa panfletagem em {bairro}.', { nome: c.nome, bairro: c.bairro }), !r.ganhamos);
      if (TO.estado.salvar) TO.estado.salvar();
    };
    if (!onde) { naConta(); return; }
    const vem = vida.pontoDoBairro ? vida.pontoDoBairro(c.bid, onde.x, onde.z, 7, 13) : null;
    irDefender(onde, () => {
      if (!S) { naConta(); return; }
      const tres = TO.membros.aptosParaOEstadio(e).filter(m => m !== S.pres && !S.bonde.includes(m)).slice(0, 3);
      const gAtq = { chave: 'contra|' + c.por, tipo: 'perigo', tid: c.por, bid: c.bid, nomeBairro: c.bairro, sigla: siglaDe(c.por), nome: c.nome,
                     x: vem ? vem.x : onde.x + 8 * M, z: vem ? vem.z : onde.z, gente: [], n: c.n };
      if (!brigar(gAtq, false, { deles: c.n, contraNos: c, mais: tres })) naConta();
    }, naConta);
  }
  /* o presidente vai (na rua, levado; na sede, saindo pela calçada de lá)
     e a briga começa; sem rua (o dia de jogo no ar, a praça de fora), a
     conta resolve. Com o presidente ocupado (outra briga, a loja), espera */
  async function irDefender(onde, comecar, naConta, tentativas = 0) {
    if (S && (S.briga || S.voltando || S.entrando || S.assaltando)) {
      if (tentativas > 90) { naConta(); return; }
      setTimeout(() => irDefender(onde, comecar, naConta, tentativas + 1), 700);
      return;
    }
    if (S) {
      const Cn = C();
      if (Cn.aPe && Cn.aPe.levar) { Cn.aPe.levar(onde.x, onde.z, Cn.orb ? Cn.orb.az : 0); const eu = lider(); if (eu && S.seg) S.seg.semear(eu.x, eu.y, eu.x, eu.y, eu.rumo); }
      setTimeout(comecar, 900);
      return;
    }
    const ok = await sair({ x: onde.x, z: onde.z, motivo: 'defesa', depois: () => setTimeout(comecar, 600) });
    if (!ok) naConta();
  }

  /* ======================================================
     A NOSSA RODA ATACADA (TO.dominio.rodasContraNosHoje; o dono, 07/10/2026:
     "Nossos bairros podem ser atacados da mesma forma"): a rival que
     chega no bairro (nele ou no vizinho) vai pra cima de uma roda nossa,
     na hora marcada. O recado;
     "Ir defender" leva o presidente e o bonde pra calçada da roda, e a
     roda briga junto (os da ficha que não estão no bonde); "Deixar" perde
     a roda (ela sai da rua no resto do dia) e a barra do bairro
     ====================================================== */
  const rodasAvisadas = new Set();
  const idDoAtaque = (e, c) => `roda-ataque|${e.data.absoluto}|${c.por}|${c.bid}|${c.k}`;
  function conferirRodasContraNos(e, min) {
    const D = TO.dominio;
    if (!e || !e.data || !D || !D.rodasContraNosHoje || !naPracaNossa()) return;
    for (const c of D.rodasContraNosHoje(e)) {
      const id = idDoAtaque(e, c), h = minutoDe(c.hora);
      if (rodasAvisadas.has(id) || h == null || min < h) continue;
      rodasAvisadas.add(id);
      const R = vida.rodaDoDia ? vida.rodaDoDia(c.chave) : null;
      const m = TO.feed.propor(e, {
        kind: 'roda-ataque', peso: 'decisao', voz: 'diretor', chave: id, hora: horaTxt(min),
        texto: T_('Presidente, a {nome} tá indo pra cima da nossa roda em {bairro}! São {n} deles contra os {m} nossos na calçada.',
                  { nome: c.nome, bairro: c.bairro, n: c.n, m: R ? R.n : 4 }),
        dados: { contra: true, ataque: id },
        botoes: [{ id: 'defender', rot: T_('Ir defender'), acao: 'jogo3d' }, { id: 'deixar', rot: T_('Deixar'), acao: 'jogo3d' }]
      });
      if (m) { const f = e.feedFila, i = f.indexOf(m); if (i > 0) { f.splice(i, 1); f.unshift(m); } }
    }
  }
  function ataqueDoRecado(e, m) {
    const D = TO.dominio, id = m && m.dados && m.dados.ataque;
    if (!e || !D || !D.rodasContraNosHoje || !id) return null;
    return D.rodasContraNosHoje(e).find(c => idDoAtaque(e, c) === id) || null;
  }
  /* sem briga jogada: a conta (a roda sozinha contra eles) ou o "Deixar" (perdeu) */
  function rodaNaConta(e, c, ganhamos) {
    const r = TO.dominio.resolverRodaContraNos(e, c, ganhamos);
    if (!r) return;
    if (vida.esquecerPanfletos) vida.esquecerPanfletos();
    avisar(r.ganhamos ? T_('A nossa roda em {bairro} segurou a {nome} sozinha.', { bairro: c.bairro, nome: c.nome })
                      : T_('A {nome} correu com a nossa roda em {bairro}.', { nome: c.nome, bairro: c.bairro }), !r.ganhamos);
    if (TO.estado.salvar) TO.estado.salvar();
    if (TO.tela.pintarTopo) TO.tela.pintarTopo();
  }
  async function defenderRoda(c) {
    const e = E();
    const R = vida.rodaDoDia ? vida.rodaDoDia(c.chave) : null;
    let onde = R ? { x: R.x, z: R.z } : null;
    if (!onde && vida.pontoDoBairro) { const p = api.sedeDe ? api.sedeDe(e.torcida.id) : null; onde = vida.pontoDoBairro(c.bid, p ? p.x : 0, p ? p.y : 0, 0, 5000); }
    const naConta = () => rodaNaConta(e, c, null);
    if (!onde) { naConta(); return; }
    const vem = vida.pontoDoBairro ? vida.pontoDoBairro(c.bid, onde.x, onde.z, 7, 13) : null;
    irDefender(onde, () => {
      if (!S) { naConta(); return; }
      /* a roda entra do nosso lado: os da ficha fora do bonde (e some da calçada enquanto a briga dura) */
      const n = R ? R.n : 4;
      const roda = TO.membros.aptosParaOEstadio(e).filter(m => m !== S.pres && !S.bonde.includes(m)).slice(0, n);
      const nossa = vida.grupos.find(x => x.chave === c.chave) || null;
      if (nossa) { nossa.preso = true; for (const x of nossa.gente) x.fora = true; }
      const gAtq = { chave: 'contra-roda|' + c.por + '|' + c.bid, tipo: 'perigo', tid: c.por, bid: c.bid, nomeBairro: c.bairro, sigla: siglaDe(c.por), nome: c.nome,
                     x: vem ? vem.x : onde.x + 8 * M, z: vem ? vem.z : onde.z, gente: [], n: c.n };
      if (!brigar(gAtq, false, { deles: c.n, contraRoda: c, mais: roda, nossaRoda: nossa })) { soltarNossaRoda(nossa); naConta(); }
    }, naConta);
  }
  /* A RODA DA IA ATACADA PELA IA (TO.dominio.rodasIAHoje; o dono, 07/10/2026:
     "Faz a IA atacar rodas de outras IAs também"): na hora marcada, a
     briga entre elas se resolve (a notícia, o bairro) e, com a roda perto
     da câmera, a rua vê a briga (vida3d.js `brigaDeRoda`); com o presidente
     na rua e a briga na tela, o aviso */
  function conferirRodasIA(e, min) {
    const D = TO.dominio;
    if (!e || !e.data || !D || !D.rodasIAHoje || !naPracaNossa()) return;
    for (const c of D.rodasIAHoje(e)) {
      const h = minutoDe(c.hora);
      if (h == null || min < h) continue;
      let reg = null;
      try { reg = D.resolverRodaIA(e, c); } catch (err) { console.error('a roda da IA:', err); }
      if (!reg) continue;
      const viu = !!(vida.brigaDeRoda && vida.brigaDeRoda(c, !!reg.ganhouA));
      if (viu && S) avisar(T_('A {a} foi pra cima da roda da {b} em {bairro}!', { a: c.nome, b: c.nomeDona, bairro: c.bairro }));
      if (!viu && vida.esquecerPanfletos) vida.esquecerPanfletos();
      if (TO.estado.salvar) TO.estado.salvar();
    }
  }
  /* a nossa roda volta pra calçada (a que perdeu sai no próximo quadro dos grupos: TO.dominio.rodaDesfeita) */
  function soltarNossaRoda(g) {
    if (!g) return;
    g.preso = false;
    for (const x of g.gente || []) x.fora = false;
  }

  /* ======================================================
     O PAINEL DA RUA E O AVISO
     ====================================================== */
  function montarHud() {
    if (hud) { hud.hidden = false; return; }
    hud = document.createElement('div');
    hud.className = 'j3d-rua';
    hud.setAttribute('role', 'region'); hud.setAttribute('aria-label', T_('Na rua'));
    hud.innerHTML = `<div class="j3d-rua-topo"><b class="j3d-rua-hora">--:--</b><span class="j3d-rua-onde"></span><span class="j3d-rua-bonde"></span></div>
      <p class="j3d-rua-dica"></p>
      <div class="j3d-rua-bts"><span class="j3d-rua-acoes"></span><button class="j3d-rua-voltar" data-rua="voltar">${esc(T_('Voltar pra sede'))}</button></div>`;
    document.body.appendChild(hud);
    hud.addEventListener('click', ev => {
      const b = ev.target.closest('[data-rua]');
      if (!b || !S) return;
      const id = b.dataset.rua;
      if (id === 'voltar') { encerrar('botao'); return; }
      const a = (S.acoesVistas || []).find(x => x.id === id);
      if (!a || a.off) return;
      if (id === 'pixar') pixar(a.mu);
      else if (id === 'panfletar') panfletar(a.b);
      else if (id === 'atacar') brigar(a.g, true);
      else if (id === 'encarar' && S.perigo) brigar(S.perigo.g, true);
      else if (id === 'assaltar') escolherAbordagem(a.loja);
      pintarHud(true);
    });
    avisoEl = document.createElement('div');
    avisoEl.className = 'j3d-rua-aviso'; avisoEl.hidden = true;
    document.body.appendChild(avisoEl);
  }
  function avisar(txt, ruim) {
    if (!avisoEl) { avisoEl = document.createElement('div'); avisoEl.className = 'j3d-rua-aviso'; document.body.appendChild(avisoEl); }
    avisoEl.textContent = txt;
    avisoEl.classList.toggle('ruim', !!ruim);
    avisoEl.hidden = false;
    tAviso = 4.5;
  }
  function pintarHud(forcar, dt = 0.016) {
    if (!hud || !S) return;
    const e = S.e;
    hud.querySelector('.j3d-rua-hora').textContent = horaTxt(Math.floor(S.min));
    const b = S.bairro, onde = hud.querySelector('.j3d-rua-onde');
    const dona = b && b.dono ? TO.mundo.torcida(b.dono) : null, cor = dona && TO.mundo.coresDaTorcida ? TO.mundo.coresDaTorcida(dona).cor : '#777';
    const txtOnde = b ? `<i style="background:${esc(cor)}"></i><b>${esc(b.nome)}</b> <small>${b.dono ? esc(T_('da {sigla} · {v}%', { sigla: siglaDe(b.dono), v: Math.round(b.v) })) : esc(T_('em disputa'))}</small>` : '';
    if (onde.dataset.v !== txtOnde) { onde.innerHTML = txtOnde; onde.dataset.v = txtOnde; }
    const nb = hud.querySelector('.j3d-rua-bonde'), tb = T_('{n} na rua', { n: 1 + S.bonde.length });
    if (nb.textContent !== tb) nb.textContent = tb;
    const dica = hud.querySelector('.j3d-rua-dica');
    const td = S.acao ? (S.acao.tipo === 'panfletar' ? T_('Panfletando em {bairro}…', { bairro: S.acao.bairro ? S.acao.bairro.nome : '' }) : T_('Pixando o muro…'))
      : S.perigo ? T_('A {sigla} tá vindo: encara ou corre (longe, eles desistem).', { sigla: siglaDe(S.perigo.tid) })
      : b && b.dono && b.dono !== e.torcida.id && rival(b.dono) ? T_('Bairro da rival: cuidado com as rodas dela.')
      : T_('Joystick ou WASD anda · Shift corre');
    if (dica.textContent !== td) dica.textContent = td;
    tBotoes -= dt;
    if (!forcar && tBotoes > 0) return;
    tBotoes = 0.3;
    const lista = acoesAgora();
    S.acoesVistas = lista;
    const html = lista.map(a => `<button data-rua="${a.id}"${a.quente ? ' class="quente"' : ''}${a.off ? ' disabled' : ''} title="${esc(a.titulo || '')}">${esc(a.rot)}</button>`).join('');
    const cx = hud.querySelector('.j3d-rua-acoes');
    if (cx.dataset.v !== html) { cx.innerHTML = html; cx.dataset.v = html; }
  }
  /* o botão do dia livre, fora da rua */
  function pintarBotaoSair() {
    if (!btSair) {
      btSair = document.createElement('button');
      btSair.className = 'j3d-sair-rua'; btSair.hidden = true;
      btSair.textContent = T_('Sair pra rua');
      btSair.title = T_('Dia livre: o presidente e o bonde saem a pé pela cidade');
      btSair.onclick = () => { if (!S) sair({}); };
      document.body.appendChild(btSair);
    }
    const e = E();
    const pode = !S && !!e && document.body.classList.contains('j3d-em-jogo') && naPracaNossa() && !dia3d.ativo && livreHoje &&
      vida.relogio.minuto < FIM - 30 && !TO.feed.travado(e) && !cobre();
    if (btSair.hidden === pode) btSair.hidden = !pode;
  }

  /* ======================================================
     O QUADRO (o laço do jogo 3D)
     ====================================================== */
  let tBt = 0;
  function quadro(dt) {
    const e = E();
    if (avisoEl && tAviso > 0) { tAviso -= dt; if (tAviso <= 0) avisoEl.hidden = true; }
    tBt -= dt;
    if (tBt <= 0) {
      tBt = 0.4;
      if (e && e.data) {
        const chave = `${e.data.ano}|${e.data.semana}|${e.data.dia}`;
        if (livreDe !== chave) { livreDe = chave; livreHoje = diaLivreHoje(e); }
        conferirContraNos(e, S ? S.min : vida.relogio.minuto);
        conferirRodasContraNos(e, S ? S.min : vida.relogio.minuto);
        conferirRodasIA(e, S ? S.min : vida.relogio.minuto);
      }
      pintarBotaoSair();
    }
    if (!S) return;
    if (S.e !== e) { encerrar('virou'); return; }
    /* (a briga de fora acabou sem avisar — a cena da foto, sem palco em 3D: a volta é a mesma) */
    if (S.briga && S.briga.externa && !S.voltando && !cenaNoAr()) S.voltando = S.briga;
    if (S.voltando) { conferirVolta(); return; }
    const eu = lider();
    if (!eu || S.briga || S.assaltando || S.entrando) return;
    S.ultimo = { x: eu.x, z: eu.y };
    /* o bonde vai atrás; a ação em curso; o relógio */
    if (S.seg) S.seg.quadro(dt, eu);
    if (S.acao) {
      if (S.min >= S.acao.fim - 1e-6) { const a = S.acao; S.acao = null; desposar(); try { if (a.depois) a.depois(); } catch (err) { console.error('a rua livre, a ação:', err); } }
    }
    andarRelogio(dt);
    if (!S) return;
    if (!S.acao && !pausada()) rodasEncarando(dt);
    /* quem fala com o presidente na rua: o primeiro do bonde (o balão fica nele) */
    S.falando = S.discos[0] || eu;
    pintarHud(false, dt);
    if (seta) seta.pintar({ x: eu.x, z: eu.y });
  }

  return {
    quadro, sair, encerrar, conferirDiaLivre, voltouDaBriga, cederAVez, diaLivreHoje,
    get ativo() { return !!S; },
    get sessao() { return S; },
    /* quem fala no balão, na rua */
    get falante() { return S && !S.briga && !S.assaltando ? S.falando : null; },
    /* a resposta dos recados do jogo 3D (main.js → jogo3d.js) */
    responder(m, botao) {
      const e = E();
      if (!m || !e) return false;
      if (m.kind === 'dia-livre') {
        if (botao === 'rua') setTimeout(() => sair({}), 50);
        else if (botao === 'nunca') { e.ruaLivre = 'nunca'; avisar(T_('Fechado: o recado do dia livre não volta. O botão "Sair pra rua" continua no canto.')); }
        return true;
      }
      if (m.kind === 'panfleto-ataque') {
        const c = TO.dominio && TO.dominio.contraNosHoje ? TO.dominio.contraNosHoje(e) : null;
        if (!c) return true;
        if (botao === 'defender') setTimeout(() => defender(c), 50);
        else {
          const r = TO.dominio.resolverContraNos(e, c, false);
          if (vida.esquecerPanfletos) vida.esquecerPanfletos();
          avisar(T_('A {nome} desfez a nossa panfletagem em {bairro}.', { nome: c.nome, bairro: c.bairro }), true);
          if (r && TO.estado.salvar) TO.estado.salvar();
        }
        return true;
      }
      if (m.kind === 'roda-ataque') {
        const c = ataqueDoRecado(e, m);
        if (!c) return true;
        if (botao === 'defender') setTimeout(() => defenderRoda(c), 50);
        else rodaNaConta(e, c, false);
        return true;
      }
      return false;
    },
    /* a seta na borda (o dia de jogo usa a mesma) */
    get seta() { if (!seta) seta = criarSeta(C, M); return seta; },
    /* pro teste */
    get estado() {
      if (!S) return { ativo: false, livreHoje };
      const eu = lider();
      return { ativo: true, min: S.min, hora: horaTxt(Math.floor(S.min)), bairro: S.bairro && { id: S.bairro.id, nome: S.bairro.nome, dono: S.bairro.dono, v: S.bairro.v },
               lider: eu && { x: eu.x, z: eu.y }, bonde: S.discos.map(d => ({ x: d.x, z: d.y })), acao: S.acao && S.acao.tipo, perigo: !!S.perigo,
               briga: !!S.briga, acoes: (S.acoesVistas || []).map(a => a.id), livreHoje };
    },
    /* pro teste: pôr o presidente num ponto (com o bonde junto) */
    levar(x, z) { const Cn = C(); if (!S || !Cn.aPe) return false; const ok = Cn.aPe.levar(x, z, Cn.orb.az); const eu = lider(); if (ok && S.seg && eu) S.seg.semear(eu.x, eu.y, eu.x, eu.y, eu.rumo); return ok; },
    acaoAgora: id => { const a = (acoesAgora() || []).find(x => x.id === id); if (!a) return false; S.acoesVistas = [a]; hud.querySelector('.j3d-rua-acoes').innerHTML = `<button data-rua="${a.id}">x</button>`; hud.querySelector(`[data-rua="${a.id}"]`).click(); return true; },
    chamarPerigo: tid => { if (!S || !S.bairro) return false; chamarPerigo(tid || S.bairro.dono, S.bairro, 'pixar'); return !!S.perigo; }
  };
}
