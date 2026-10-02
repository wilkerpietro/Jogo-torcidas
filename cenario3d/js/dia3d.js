/* =========================================================
   O DIA DE JOGO EM 3D, LIGADO AO JOGO (o jogo 3D, 28/09/2026)

   O dono: "Vamos ligar o dia de jogo com arquibancada e invasão no
   cenário 3d. A invasão deve ser controlável pela torcida do jogador
   somente. Que brigou na rua pode invadir no estádio também. As brigas
   fora de casa devem respeitar o mesmo cenário das brigas em casa, com o
   jogador sendo visitante podendo iniciar a rota ou na entrada ou na
   casa do aliado"

   O itinerário do dia de jogo (a linha do feed, js/gestao/itinerario.js
   e main.js) é quem manda no dia. Com o jogo em 3D, quando a linha abre
   (`abrir`), a cidade do jogo — a nossa, em casa; a deles, fora — monta
   o DIA DE JOGO do cenário (dia_de_jogo.js) com o jogo de verdade: o
   mandante e o visitante, a hora da bola, quem foi (a presença da
   partida) e o nosso bonde (o efetivo da linha). Fora de casa o jogador
   escolhe onde a caravana desce: na entrada da cidade ou na sede da
   aliada que respondeu que recebe (o pedido de ajuda do planejamento).
   Aí cada fase da linha anda na cidade (`fase`):
   - IDA: a caminhada das torcidas até o estádio, com a PM, os cordões e
     a revista. Se a fase tem a briga da caminhada (o ataque que a gente
     sofre, ou a investida marcada, na concentração ou na pista), o dia
     é planejado com ela dentro (`escolha.briga`): a cidade anda até os
     dois bondes se encontrarem, e só aí o cartão da linha aparece. A
     briga jogada é o combate NO MESMO LUGAR (caminhada.js com o plano do
     dia); a simulada, e a que ninguém desceu, a cidade mostra (o
     resultado do jogo manda em quem ganha e em quem fica no chão);
   - O JOGO: o resto da entrada até todo mundo no lugar, e a partida com
     a arquibancada viva — o relógio do dia anda com o minuto da partida.
     A INVASÃO É SÓ DA NOSSA TORCIDA: o painel oferece os caminhos que
     ela tem (pela arquibancada, pelo corredor) quando tem rival do outro
     lado do isolamento, e o clima tenso pergunta se ela vai; indo, a
     invasão é o combate em cima da arquibancada de verdade (invasao.js).
     Quem brigou na rua invade também;
   - VOLTA: o dia fecha e a cidade volta pra praça do jogador.
   Sem cidade em 3D pro jogo (a praça de fora sem mapa, o campo neutro,
   o mandante sem torcida com sede no mapa), a linha anda como sempre.

   A TELA DO DIA (o dono, 28/09/2026: "refaça o visual de dia de jogo na
   cidade, com o placar do jogo em tempo real parecendo um placar de jogo
   de futebol na TV, e a tela com as informações do itinerário não ficarem
   ocupando a tela do jogo assim"): o PLACAR DE TV no alto (as siglas com
   a cor de cada clube, os gols, o relógio da partida; antes da bola, a
   hora dela; no fim, FIM), a FAIXA DAS FASES no painel de baixo (ida,
   jogo e volta, cada uma com a hora em que a cidade faz ela — "corrija a
   hora do itinerário pra bater com o 3D" — e o efetivo dos dois lados),
   e o balão só com a decisão da hora (recados3d.js). O gol vira aviso.

   OS JOGOS DE OUTROS CLUBES NA NOSSA PRAÇA (o dono, 28/09/2026: "remova
   esse acompanhamento de perto do dia de outros jogos na cidade, só vai
   tornar o jogo mais demorado. só vai parar o tempo caso tenhamos
   planejado algo pra algum jogo na cidade"): o jogo da cidade só aparece
   com INVESTIDA MARCADA nele (o planejamento: concentração ou pista).
   Aí o dia dele monta NO FUNDO (`jogoNoFundo`), junto com a vida da
   praça, só no pedaço da investida: o nosso bonde junta na nossa porta e
   anda pela rua até o alvo — a porta da sede deles, antes de saírem, ou
   um ponto da rota deles —, os bondes do jogo aparecem nessa hora, e a
   decisão do planejamento ("Ir pra Guerra") chega quando ele chega lá,
   com a câmera no encontro; depois ele volta pra sede e tudo some. Sem
   investida, nada monta e o relógio não para.
   ========================================================= */
import { cenaDaInvasao, gradesDaInvasao } from './invasao.js?v=cbc9bdea8a';
import { palcoDeBriga } from './palco_briga.js?v=cbc9bdea8a';
import { brigaNosArredores, gradesDoCordao } from './arredores3d.js?v=cbc9bdea8a';

const VEZES = [1, 10, 30, 60];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const segDe = hora => { const m = /^(\d\d?):(\d\d)/.exec(String(hora || '')); return m ? (+m[1] * 60 + +m[2]) * 60 : 16 * 3600; };
const hhmm = s => { const m = Math.floor(s / 60 + 1e-6); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = () => new Promise(r => requestAnimationFrame(() => r()));
const naVia = v => v === 'corredor' ? 'pelo corredor' : 'pela arquibancada';
/* a sigla da TV (FOR, CEA, CAM): as três primeiras letras do nome, sem acento */
const siglaTV = nome => String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '???';
/* as duas siglas do jogo: as tr\u00eas primeiras letras (FOR \u00d7 CEA); quando elas
   batem (Corinthians \u00d7 Coritiba dava COR \u00d7 COR, Atl\u00e9tico Mineiro \u00d7 Atl\u00e9tico/GO
   dava ATL \u00d7 ATL), a sigla do clube no dado (SCCP \u00d7 CFC, CAM \u00d7 ACG) */
function siglasTV(casa, fora) {
  const a = siglaTV(casa && casa.nome), b = siglaTV(fora && fora.nome);
  if (a !== b) return [a, b];
  const doDado = t => String((t && t.sigla) || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
  const da = doDado(casa), db = doDado(fora);
  return da && db && da !== db ? [da, db] : [a, b];
}
const corDoClube = (t, i) => (t && Array.isArray(t.cores) && t.cores[i]) || (i ? '#d8d8d8' : '#5a5a5a');
/* a partida na cidade: 90 minutos e o intervalo de 15 (o apito final, na hora do dia) */
const INTERVALO_S = 15 * 60, DURACAO_S = (90 * 60) + INTERVALO_S;
/* o nome curto de cada fase da linha, na faixa */
const ROT_FASE = { ida: 'Ida', jogo: 'Jogo', volta: 'Volta' };

/* `api`: o do jogo 3D (jogo3d.js: cenario, abrirPraca, planta, M);
   `vida`: a vida da praça (vida3d.js); `g`: { travarPraca(v) } — a
   praça do jogo não troca enquanto o dia está no ar */
export function criarDia3d(api, vida, g = {}) {
  const M = api.M;
  const C = () => api.cenario;
  const E = () => TO.estado && TO.estado.E;
  let dia = null, D = null, hud = null, laco = 0, luzVista = null;

  /* o mapa do jogo ('sao-paulo') vira a praça da planta ('São Paulo') pelo slug (index.html, `pracaDe`) */
  const nomeDaPraca = mapa => {
    if (api.pracaDe) return api.pracaDe(mapa);
    const c = (TO.dados.cidades || []).find(x => x.id === mapa);
    return c && api.nomes.includes(c.nome) ? c.nome : null;
  };

  /* ======================================================
     O PAINEL DO DIA (embaixo, no meio da cidade)
     ====================================================== */
  function montarHud() {
    if (hud) return hud;
    hud = document.createElement('div');
    hud.className = 'j3d-dia'; hud.hidden = true;
    hud.innerHTML = `<div class="j3d-dia-topo"><b class="j3d-dia-hora">--:--</b><ol class="j3d-dia-fases" aria-label="As fases do dia"></ol><span class="j3d-dia-efetivo"></span></div>
      <p class="j3d-dia-estado"></p>
      <div class="j3d-dia-bts">
        <span class="j3d-dia-vezes" role="group" aria-label="Velocidade do dia">${VEZES.map(v => `<button data-vezes="${v}">${v}×</button>`).join('')}</span>
        <button data-dia="pular" title="Pula até o próximo ponto do dia">Pular ▸▸</button>
        <button data-dia="nossa" title="A câmera vai atrás do nosso bonde">Nossa</button>
        <button data-dia="estadio" title="A câmera no estádio">Estádio</button>
        <button data-dia="plano" title="O dia inteiro, de cima">Cidade</button>
      </div>
      <div class="j3d-dia-invadir" hidden></div>`;
    document.body.appendChild(hud);
    hud.addEventListener('click', ev => {
      const b = ev.target.closest('button');
      if (!b || !D) return;
      const a = b.dataset.dia;
      /* (na estrada: pular até a próxima parada, e a câmera de volta no ônibus) */
      if (D.estrada) { if (a === 'pular') pular(); else if (a === 'nossa') D.estrada.verOnibus(); return; }
      if (!dia) return;
      if (b.dataset.vezes) { D.vezes = +b.dataset.vezes; if (dia.rodando) dia.rodar(D.vezes); pintar(); return; }
      if (a === 'pular') pular();
      else if (a === 'nossa') { if (D.nosso) dia.seguirBonde(D.nosso); }
      else if (a === 'estadio') { if (D.fase === 'jogo' && D.nosso) verNossoSetor(); else dia.verEstadio(); }
      else if (a === 'plano') dia.verPlano();
      else if (a === 'invadir') invadir(b.dataset.via);
    });
    return hud;
  }
  function status(txt, ruim) {
    const h = montarHud(), p = h.querySelector('.j3d-dia-estado');
    p.textContent = txt || ''; p.classList.toggle('ruim', !!ruim);
  }
  function pintar() {
    /* (o jogo da cidade no fundo não tem painel: a vida da praça segue) */
    if (!hud || !D || D.fundo) return;
    hud.hidden = false;
    pintarFases(true);
    for (const o of hud.querySelectorAll('[data-vezes]')) o.setAttribute('aria-pressed', String(+o.dataset.vezes === D.vezes));
    hud.querySelector('[data-dia="pular"]').disabled = !D.corrida && !(D.estrada && D.estrada.andando);
    const bn = hud.querySelector('[data-dia="nossa"]');
    bn.hidden = !D.nosso && !D.estrada;
    /* (na estrada não tem estádio nem cidade pra ver: só o ônibus) */
    for (const q of ['estadio', 'plano']) hud.querySelector(`[data-dia="${q}"]`).hidden = !!D.estrada;
    hud.querySelector('.j3d-dia-vezes').hidden = !!D.estrada;
    /* A INVASÃO: só na partida, uma por jogo, pelos caminhos que a nossa torcida tem */
    const inv = hud.querySelector('.j3d-dia-invadir');
    const vias = D.partida && !D.invadiu ? viasDaInvasao() : [];
    inv.hidden = !vias.length;
    inv.innerHTML = vias.length ? `<span>Invadir o setor da ${esc(vias[0].sigla)}:</span>` + vias.map(v => `<button data-dia="invadir" data-via="${v.via}" class="perigo">${esc(naVia(v.via))}</button>`).join('') : '';
  }
  function pintarHora() {
    if (!hud || !D || !dia) return;
    const h = hud.querySelector('.j3d-dia-hora'), txt = hhmm(dia.t);
    if (h.textContent !== txt) h.textContent = txt;
  }
  /* A FAIXA DAS FASES: ida, jogo e volta, cada uma com a hora da cidade
     (a que já passou apagada, a de agora acesa), e o efetivo dos dois lados */
  let fasesVistas = '';
  function pintarFases(forcar) {
    if (!hud || !D || D.fundo) return;
    const r = TO.tela && TO.tela.resumoDaLinha ? TO.tela.resumoDaLinha() : null;
    const ol = hud.querySelector('.j3d-dia-fases'), ef = hud.querySelector('.j3d-dia-efetivo');
    if (!r) { if (forcar) { ol.innerHTML = `<li class="agora"><b>${esc(D.titulo)}</b></li>`; ef.textContent = ''; } return; }
    const sig = JSON.stringify([r.ponto, r.nos, r.eles, r.escolta, r.paradas.map(p => p.hora + p.brigou)]);
    if (!forcar && sig === fasesVistas) return;
    fasesVistas = sig;
    ol.innerHTML = r.paradas.map((p, i) => {
      const rot = p.id === 'ida' && D.fora ? 'Caravana' : ROT_FASE[p.id] || p.nome;
      const cls = i < r.ponto ? 'passou' : i === r.ponto ? 'agora' : 'vem';
      return `<li class="${cls}${p.brigou ? ' brigou' : ''}"><b>${esc(rot)}</b><span>${p.rotDia && r.dias > 1 ? `<small>${esc(p.rotDia)}</small> ` : ''}${esc(p.hora)}</span></li>`;
    }).join('');
    const nome = r.nomeDeles || 'deles';
    ef.innerHTML = `<b>${r.nos}</b>${r.escolta ? `<small>+${r.escolta}</small>` : ''}${r.temDeles ? ` <i>×</i> <b>${r.eles}</b>` : ''}`;
    ef.title = `${r.nos} nossos${r.escolta ? ` e ${r.escolta} da escolta da ${r.nomeEscolta}` : ''}${r.temDeles ? ` · ${r.eles} da ${nome}` : ''}`;
  }

  /* ======================================================
     O PLACAR DE TV (no alto): as siglas com a cor de cada clube, os gols
     e o relógio da partida — antes da bola, a hora dela; no fim, FIM. No
     nosso jogo, o clima do estádio e a pausa e a velocidade da partida
     (as mesmas portas da barra de minutos do feed; a partida começa a 4×,
     o padrão da casa — o dono, 29/09/2026: "O tempo padrão que corre a
     partida é 4x." —, e o botão anda 4× → 1× → 2×); no jogo da cidade no
     fundo, o minuto é o do relógio do dia
     ====================================================== */
  let placar = null, placarVisto = '';
  function montarPlacar() {
    if (placar) return placar;
    placar = document.createElement('div');
    placar.className = 'j3d-placar'; placar.hidden = true;
    placar.setAttribute('role', 'status');
    placar.innerHTML = `<div class="j3d-placar-tv">
        <span class="j3d-placar-time casa"><i></i><b></b></span>
        <span class="j3d-placar-gols"><b class="gc">0</b><b class="gf">0</b></span>
        <span class="j3d-placar-time fora"><b></b><i></i></span>
        <span class="j3d-placar-rel"></span>
      </div>
      <div class="j3d-placar-pen" hidden><span class="j3d-pen-titulo">Disputa de pênaltis</span>
        <b class="j3d-pen-sig casa"></b><span class="j3d-pen-bolas casa"></span><b class="j3d-pen-n casa">0</b>
        <b class="j3d-pen-sig fora"></b><span class="j3d-pen-bolas fora"></span><b class="j3d-pen-n fora">0</b>
        <span class="j3d-pen-recado"></span></div>
      <div class="j3d-placar-pe"><span class="j3d-placar-clima"></span><span class="j3d-placar-bts"><button data-placar="pausa" title="Pausar e seguir a partida (espaço)">❚❚</button><button data-placar="vel" title="A velocidade da partida (4× → 1× → 2×)">4×</button></span></div>`;
    document.body.appendChild(placar);
    placar.addEventListener('click', ev => {
      const F = fonte(), b = ev.target.closest('[data-placar]'), m = F && F.partida;
      /* o toque na faixa leva a câmera: o jogo da cidade, pro estádio dele; o nosso, pra nossa torcida */
      if (!b) { if (D && dia && dia.plano) { if (D.fundo) dia.verEstadio(); else verNossa(); } return; }
      if (!m || !TO.jogoAoVivo || !TO.jogoAoVivo.pausar) return;
      if (b.dataset.placar === 'pausa') TO.jogoAoVivo.pausar(m); else TO.jogoAoVivo.vel(m);
      pintarPlacar();
    });
    placar.querySelector('.j3d-placar-tv').title = 'Ver na cidade';
    return placar;
  }
  /* A PARTIDA SEM A CIDADE DO JOGO E O RESULTADO QUE FICA NA TELA (o dono,
     29/09/2026, sobre os pênaltis que não se viam): o placar de TV lia só o
     dia da cidade, e o jogo sem ele — o de campo neutro (a final), o de fora
     do país, a praça que não montou — sumia inteiro da tela, com o cartão
     2D escondido embaixo; e o dia fecha uns 2 s depois do apito, levando o
     placar com quem passou nos pênaltis. `solta` é a partida lida direto da
     mensagem, com os mesmos campos do dia que o placar usa (j, partida,
     partidaVista, apitado, golVisto, penAviso): nasce na bola rolando sem o
     dia, ou no fechamento do dia com o jogo ainda na tela, e sai FICA_MS
     depois do apito */
  let solta = null, soltaLaco = 0, jogoAberto = null;
  const FICA_MS = 8000;
  /* de onde o placar lê: o dia da cidade (o nosso), senão a partida solta */
  const fonte = () => (D && !D.fundo ? D : (solta || D));
  /* o que o placar mostra agora: os dois clubes, os gols, o relógio */
  function estadoDoPlacar() {
    const F = fonte();
    if (!F) return null;
    /* (o jogo da cidade no fundo não tem placar: só a nossa investida aparece dele) */
    if (F.fundo) return null;
    /* (na estrada o alto da tela é da estrada: o placar da partida volta na cidade) */
    if (F.estrada) return null;
    const j = F.j;
    if (!j || !j.mandante || !j.visitante) return null;
    const m = F.partida || F.partidaVista, d = m && m.dados;
    const min = d && TO.jogoAoVivo ? TO.jogoAoVivo.minuto(d) : null;
    if (!d || min == null) return { casa: j.mandante, fora: j.visitante, gc: 0, gf: 0, pre: true, rel: j.hora || '', clima: null, bts: false };
    const fim = !!F.apitado || (m.respondido && !F.partida);
    const ate = fim ? 999 : Math.floor(min);
    let gc = 0, gf = 0;
    for (const gl of d.gols || []) if (gl.min <= ate) { if (gl.lado === 'c') gc++; else gf++; }
    const pen = serieDePenaltis(d, fim);
    const rel = fim ? 'FIM' : pen ? 'PÊN' : `${Math.max(1, Math.ceil(min))}'`;
    return { casa: j.mandante, fora: j.visitante, gc, gf, pre: false, rel, clima: fim ? null : (d.clima ? d.clima.nivel : 0), bts: !fim, pausada: !!d.pausada, vel: d.vel || 4, gols: d.gols || [], ate, pen };
  }
  /* A DISPUTA DE PÊNALTIS NO PLACAR DE TV (o dono, 29/09/2026: "quando um
     jogo é necessário penaltis não tá dando pra visualizar no tempo real do
     jogo"): no feed 2D a série mora no cartão da partida (main.js,
     `cenaDePenaltis`: as duas fileiras de bolas enchendo, uma cobrança a
     cada 850 ms, com o relógio parado em 90'), e esse cartão fica escondido
     no 3D (o placar de TV é quem mostra a partida). O compasso continua
     sendo o do cartão, que roda escondido e é quem apita no fim da série:
     `penDesde` (quando a série começou), `penAte` (quantas já saíram) e
     `penFim`, guardados na mensagem. Aqui só se lê. Sem série (o jogo que
     não foi pros pênaltis), ou antes dela começar, null */
  const PEN_PASSO_MS = 850;
  function serieDePenaltis(d, fim) {
    const cb = d && d.pen && Array.isArray(d.pen.cobrancas) ? d.pen.cobrancas : null;
    if (!cb || !cb.length) return null;
    if (!fim && !d.penFim && d.penDesde == null) return null;
    const n = fim || d.penFim ? cb.length
      : Math.min(cb.length, Math.max(0, d.penAte != null ? d.penAte : Math.floor((Date.now() - d.penDesde) / PEN_PASSO_MS)));
    /* as duas fileiras com as mesmas vagas (5, ou mais se a série alongou), como no cartão */
    const vagas = Math.max(5, cb.filter(k => k.lado === 'c').length, cb.filter(k => k.lado === 'f').length);
    const lados = { c: [], f: [] };
    let pc = 0, pf = 0;
    for (let i = 0; i < n; i++) {
      const k = cb[i];
      lados[k.lado === 'c' ? 'c' : 'f'].push(!!k.marcou);
      if (k.marcou) { if (k.lado === 'c') pc++; else pf++; }
    }
    const acabou = n >= cb.length && (fim || !!d.penFim);
    return { n, total: cb.length, vagas, lados, pc, pf, ultimo: n ? cb[n - 1] : null, acabou,
             venceC: d.pen.c > d.pen.f, placar: { c: d.pen.c, f: d.pen.f } };
  }
  const ROT_CLIMA = ['Tranquilo', 'Esquentando', 'Tenso'];
  /* (o placar fica embaixo da barra do jogo e da fita das manchetes, que no celular são mais altas) */
  const topoDaBarra = () => {
    let y = 56;
    for (const q of ['.feed-barra', '.feed-ticker']) {
      const el = document.querySelector(q);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.bottom < innerHeight * 0.4) y = Math.max(y, r.bottom);
    }
    return Math.round(y + 6);
  };
  function pintarPlacar() {
    const st = estadoDoPlacar();
    if (!st) { if (placar && !placar.hidden) placar.hidden = true; return; }
    montarPlacar();
    const topo = topoDaBarra() + 'px';
    if (placar.style.top !== topo) placar.style.top = topo;
    const sig = JSON.stringify([st.casa.nome, st.fora.nome, st.gc, st.gf, st.pre, st.rel, st.clima, st.bts, st.pausada, st.vel, st.pen && [st.pen.n, st.pen.acabou]]);
    placar.hidden = false;
    if (sig === placarVisto) return;
    placarVisto = sig;
    const tv = placar.querySelector('.j3d-placar-tv');
    const [c, f] = tv.querySelectorAll('.j3d-placar-time'), [sc, sf] = siglasTV(st.casa, st.fora);
    c.querySelector('b').textContent = sc; c.querySelector('i').style.background = corDoClube(st.casa, 0); c.title = st.casa.nome;
    f.querySelector('b').textContent = sf; f.querySelector('i').style.background = corDoClube(st.fora, 0); f.title = st.fora.nome;
    const g = tv.querySelector('.j3d-placar-gols');
    g.classList.toggle('pre', st.pre);
    g.querySelector('.gc').textContent = st.pre ? '' : st.gc;
    g.querySelector('.gf').textContent = st.pre ? '' : st.gf;
    const rel = tv.querySelector('.j3d-placar-rel');
    rel.textContent = st.rel;
    rel.classList.toggle('fim', st.rel === 'FIM');
    rel.classList.toggle('vivo', !st.pre && st.rel !== 'FIM' && st.rel !== 'INT');
    pintarPenaltis(st);
    const pe = placar.querySelector('.j3d-placar-pe'), cl = placar.querySelector('.j3d-placar-clima');
    pe.hidden = st.clima == null && !st.bts;
    cl.hidden = st.clima == null;
    if (st.clima != null) { cl.textContent = `Clima · ${ROT_CLIMA[st.clima] || ''}`; cl.className = 'j3d-placar-clima clima-' + st.clima; }
    const bts = placar.querySelector('.j3d-placar-bts');
    bts.hidden = !st.bts;
    if (st.bts) {
      bts.querySelector('[data-placar="pausa"]').textContent = st.pausada ? '▶' : '❚❚';
      bts.querySelector('[data-placar="vel"]').textContent = `${st.vel}×`;
    }
  }
  /* o quadro da disputa, embaixo do placar: as siglas, as bolas (verde quem
     fez, vermelho quem perdeu, vazia a que ainda não bateu ou não precisou),
     o placar da série e o recado da última cobrança — no fim, quem passou */
  function pintarPenaltis(st) {
    const q = placar.querySelector('.j3d-placar-pen'), p = st.pen;
    q.hidden = !p;
    if (!p) return;
    const sig = siglasTV(st.casa, st.fora);
    for (const [lado, clube] of [['casa', st.casa], ['fora', st.fora]]) {
      const k = lado === 'casa' ? 'c' : 'f', feitas = p.lados[k];
      q.querySelector('.j3d-pen-sig.' + lado).textContent = sig[k === 'c' ? 0 : 1]; q.querySelector('.j3d-pen-sig.' + lado).title = clube.nome;
      q.querySelector('.j3d-pen-n.' + lado).textContent = k === 'c' ? p.pc : p.pf;
      const bolas = q.querySelector('.j3d-pen-bolas.' + lado);
      while (bolas.children.length < p.vagas) bolas.appendChild(document.createElement('i'));
      [...bolas.children].forEach((b, i) => { b.className = i < feitas.length ? (feitas[i] ? 'fez' : 'errou') : ''; });
    }
    const r = q.querySelector('.j3d-pen-recado');
    if (p.acabou) {
      const venc = p.venceC ? st.casa : st.fora, alto = Math.max(p.placar.c, p.placar.f), baixo = Math.min(p.placar.c, p.placar.f);
      /* ("por 4 a 3" não quebra no meio: no celular o recado vira duas linhas) */
      r.textContent = `${venc.nome} passa nos pênaltis, por\u00a0${alto}\u00a0a\u00a0${baixo}.`; r.className = 'j3d-pen-recado fim';
    } else if (p.ultimo) {
      const quem = p.ultimo.lado === 'c' ? st.casa : st.fora;
      r.textContent = p.ultimo.marcou ? `${quem.nome} — na rede!` : `${quem.nome} — perdeu!`; r.className = 'j3d-pen-recado ' + (p.ultimo.marcou ? 'fez' : 'errou');
    } else { r.textContent = 'Vai bater…'; r.className = 'j3d-pen-recado'; }
  }
  /* o resultado numa linha: "Ceará 1 × 1 Fortaleza; Fortaleza passou nos pênaltis, por 4 a 3" */
  function resultadoEmTexto() {
    const st = estadoDoPlacar();
    if (!st || st.pre) return '';
    let t = `${st.casa.nome} ${st.gc} × ${st.gf} ${st.fora.nome}`;
    const p = st.pen;
    if (p && p.acabou) t += `; ${(p.venceC ? st.casa : st.fora).nome} passou nos pênaltis, por ${Math.max(p.placar.c, p.placar.f)} a ${Math.min(p.placar.c, p.placar.f)}`;
    return t;
  }
  /* a disputa vira aviso no começo e no fim (o lado direito, como os gols) */
  function avisarPenaltis(st, casa, fora) {
    const F = fonte();
    if (!F || !st || !st.pen) return;
    if (!F.penAviso) {
      F.penAviso = 1;
      avisar({ voz: 'Pênaltis', texto: `Fim do tempo normal: ${casa.nome} ${st.gc} × ${st.gf} ${fora.nome}. Vai pros pênaltis.`, classe: 'gol' });
    }
    if (st.pen.acabou && F.penAviso < 2) {
      F.penAviso = 2;
      const p = st.pen, venc = p.venceC ? casa : fora, alto = Math.max(p.placar.c, p.placar.f), baixo = Math.min(p.placar.c, p.placar.f);
      avisar({ voz: 'Pênaltis', texto: `${venc.nome} passa nos pênaltis, por\u00a0${alto}\u00a0a\u00a0${baixo}.`, classe: 'gol' });
    }
  }
  /* O GOL VIRA AVISO (no lado direito, como as notícias) */
  const avisar = o => { const R = TO.jogo3d && TO.jogo3d.recados; if (R && R.avisar) R.avisar(o); };
  function avisarGols(gols, ate, casa, fora) {
    const F = fonte();
    if (!F) return;
    F.golVisto = F.golVisto || 0;
    let c = 0, f = 0;
    const vistos = gols.filter(gl => gl.min <= ate);
    for (let i = 0; i < vistos.length; i++) {
      const gl = vistos[i];
      if (gl.lado === 'c') c++; else f++;
      if (i < F.golVisto) continue;
      F.golVisto = i + 1;
      const de = gl.lado === 'c' ? casa : fora;
      avisar({ voz: `Gol · ${Math.round(gl.min)}'`, texto: `Gol do ${de.nome}! ${casa.nome} ${c} × ${f} ${fora.nome}`, classe: 'gol' });
    }
  }

  /* ======================================================
     ABRIR: a praça do jogo, o início do visitante e o plano
     ====================================================== */
  async function abrir(o) {
    if (D) fechar();
    const e = E(), it = o && o.it, j = it && it.jogo;
    /* (os clubes do jogo ficam guardados mesmo sem o dia: o placar da partida solta usa as cores e as siglas deles) */
    jogoAberto = j && j.mandante && j.visitante ? { j, msg: o.msg } : null;
    if (!e || !e.torcida || !j || j.neutro) return false;
    const Cn = C();
    if (!Cn || !Cn.vida || !Cn.vida.diaDeJogo) return false;
    const mapa = j.casa ? e.torcida.mapa : j.mapaAdv;
    const nome = nomeDaPraca(mapa);
    if (!nome) return false;
    const eu = D = { it, msg: o.msg, j, e, fora: !j.casa, nome, fase: null, vezes: 30, corrida: null, partida: null, invadiu: false,
                     titulo: `${j.mandante.nome} × ${j.visitante.nome}` };
    montarHud(); pintar();
    status(D.fora ? `A caravana chegando em ${nome}…` : 'A PM montando o plano do dia…');
    if (g.travarPraca) g.travarPraca(true);
    vida.desligar();
    /* A VIAGEM PRIMEIRO (o dono, 29/09/2026: "crie uma cena de caravana que
       vai basicamente ser uma estrada em linha reta"): fora de casa, com a
       estrada na rota, a caravana sai pela rodovia (estrada3d.js) e o dia
       na cidade do jogo só monta quando ela chega — na fase da ida */
    const ida = D.fora ? viagemDa(it, 'ida') : null;
    if (ida) {
      status(`A caravana pega a estrada: ${ida.origem} → ${nome}.`);
      try { if (await abrirEstrada(ida, eu)) return true; } catch (err) { console.error('a estrada da caravana:', err); }
      if (D !== eu) return false;
    }
    return montarCidade(eu);
  }
  /* A CIDADE DO JOGO: a praça carregada, onde a caravana desce e o plano do dia */
  async function montarCidade(eu) {
    const e = D.e, j = D.j, it = D.it, nome = D.nome;
    try {
      if (!await esperarPraca(nome, eu)) return false;
      dia = await C().vida.diaDeJogo();
      if (D !== eu) return false;
      const ini = D.fora ? await escolherInicio(e, j) : null;
      if (D !== eu) return false;
      status('A PM montando o plano do dia…');
      await espera(); await espera();
      const esc0 = escolhaDoDia(e, j, D.msg, it, ini);
      const p = dia.jogo(esc0);
      if (!p || p.erro) throw new Error(p && p.erro ? p.erro : 'o plano do dia não montou');
      D.plano = p; D.nosso = p.doJogador || null; D.escolha = esc0;
      /* A HORA DA LINHA É A DA CIDADE: a ida começa quando a concentração
         começa, o jogo na bola, a volta no apito final (com o intervalo) */
      if (TO.tela && TO.tela.horasDaLinha) TO.tela.horasDaLinha({ ida: p.inicio, jogo: p.bola, volta: p.bola + DURACAO_S });
      D.briga = esc0.briga && p.brigas && p.brigas[0] && p.brigas[0].a.t.id === esc0.briga.a && p.brigas[0].v.t.id === esc0.briga.v ? p.brigas[0] : null;
      D.evBriga = D.briga ? esc0.briga.ev : null;
      /* a investida nos arredores que o plano achou (sem cordão que sirva, a briga fica no jogo de feed) */
      D.arr = esc0.arredores && p.arredores && p.arredores.a.t.id === esc0.arredores.a && p.arredores.v.t.id === esc0.arredores.v ? p.arredores : null;
      D.evArr = D.arr ? esc0.arredores.ev : null;
      /* o dia começa um pouco antes de o primeiro bonde sair */
      dia.parar(); dia.irPara(p.inicio);
      if (D.nosso) dia.seguirBonde(D.nosso); else dia.verPlano();
      if (!laco) laco = requestAnimationFrame(quadro);
      status(D.nosso ? inicioTxt(D.nosso) : 'A nossa torcida não entrou no plano do dia (sem rota até o estádio).');
      pintar(); pintarPlacar();
      return true;
    } catch (err) {
      console.error('dia de jogo 3D:', err);
      if (D === eu) {
        status('O dia de jogo não montou em 3D: ' + err.message, true);
        const d0 = D;
        setTimeout(() => { if (D === d0) fechar(); }, 3500);
      }
      return false;
    }
  }

  /* ======================================================
     A ESTRADA DA CARAVANA (estrada3d.js; o dono, 29/09/2026: "crie uma
     cena de caravana que vai basicamente ser uma estrada em linha reta
     que vai ter curvas na margem direita da pista com setas apontando
     quais cidades estamos passando próximo [...] em algum momento alguma
     torcida pode nos atacar nessa cena quando estivermos passando na
     cidade caso isso realmente esteja programado no itinerário"). Na ida
     (antes da cidade do jogo) e na volta (depois do apito), a fase da
     linha é a viagem: o ônibus anda pela rodovia e passa pelas placas das
     praças da rota; com a emboscada marcada numa delas, ele para lá, a
     linha mostra o recado ("Descer pra treta", "Simular", "Mandar seguir
     viagem"), a torcida desce, briga no mesmo lugar (a cena do posto ou a
     da pista fechada, encaixada na rodovia), e quem fica de pé volta pro
     ônibus. A linha espera a caravana chegar (`naEstrada`) antes de seguir
     ====================================================== */
  /* a viagem da linha: as praças da rota em ordem (sem a de onde sai), a
     emboscada da fase (a que a linha vai mostrar) e as horas das pontas */
  function viagemDa(it, qual) {
    if (!it || !it.viaja) return null;
    const pre = qual === 'volta' ? 'volta:' : 'praca:';
    const ps = (it.detalhadas || []).filter(p => p && String(p.id || '').startsWith(pre) && p.cidade);
    if (ps.length < 2) return null;
    const f = (it.paradas || []).find(p => p.id === qual);
    const ev = f && (f.eventos || [])[0];
    const nomeDe = c => (api.pracaDe && api.pracaDe(c)) || ((TO.mundo && TO.mundo.cidade && TO.mundo.cidade(c)) || {}).nome || c;
    const cidades = ps.slice(1).map(p => ({ id: p.cidade, nome: nomeDe(p.cidade) }));
    let emb = null;
    const cena = ev && ev.abrir && ev.abrir.atq && ev.abrir.atq.cena;
    if (ev && ev.tipo === 'emboscada' && ev.cidade && (cena === 'emb-posto' || cena === 'emb-onibus')) {
      const i = cidades.findIndex(c => c.id === ev.cidade);
      if (i >= 0) emb = { i, ev, tipo: cena, torcida: ev.torcida, nome: ev.nome };
    }
    return { qual, cidades, emb, horas: [ps[0].min, ps[ps.length - 1].min], origem: nomeDe(ps[0].cidade) };
  }
  async function abrirEstrada(v, eu) {
    const Cn = C();
    if (!Cn || !Cn.vida || !Cn.vida.cena || !api.planta || !api.planta.areaDoCenario) return false;
    const { criarEstrada } = await import('./estrada3d.js?v=cbc9bdea8a');
    if (D !== eu) return false;
    const e = D.e, a = api.planta.areaDoCenario(), Mu = TO.mundo;
    const cores = t => (Mu && Mu.coresDaTorcida && t ? Mu.coresDaTorcida(t) : {}) || {};
    const r = TO.tela && TO.tela.resumoDaLinha ? TO.tela.resumoDaLinha() : null;
    let emb = null;
    if (v.emb) {
      const t = Mu && Mu.torcida ? Mu.torcida(v.emb.torcida) : null;
      emb = { i: v.emb.i, tipo: v.emb.tipo, nome: v.emb.nome, cores: cores(t), n: Math.round(Math.max(8, Math.min(22, ((r && r.nos) || 20) * 0.6))) };
    }
    const destino = v.cidades[v.cidades.length - 1];
    const R = criarEstrada({ C: Cn, M, O: [a.x0 - 8000 * M, a.y0 - 6000 * M], cidades: v.cidades, emb,
                             nossa: { nome: e.torcida.nome, cores: cores(e.torcida), n: r ? r.nos : 20 }, horas: v.horas,
                             itinerario: `CARAVANA · ${String((destino && destino.nome) || '').toUpperCase()}` });
    await espera();
    if (D !== eu) return false;
    if (!R.montar()) return false;
    D.estrada = R; D.viagem = v; D.pracaVista = null;
    if (!laco) laco = requestAnimationFrame(quadro);
    pintar();
    return true;
  }
  /* a linha espera a caravana (o ônibus na estrada, a cidade montando na chegada) */
  let esperas = [];
  const naEstrada = () => !!(D && !D.fundo && D.naFase && ((D.estrada && !D.chegouEmCasa) || D.montandoCidade));
  function soltarEspera() { const l = esperas; esperas = []; for (const f of l) { try { f(); } catch (err) { console.error('dia de jogo 3D, a linha:', err); } } }
  /* A FASE NA ESTRADA (a ida): o ônibus anda até a emboscada — a linha
     mostra o recado — ou até o destino, e a cidade do jogo monta na chegada */
  function faseNaEstrada(p, cont) {
    const R = D.estrada, eu = D;
    D.naFase = true;
    D.fase = 'ida';
    pintar();
    const ev = (p.eventos || [])[0];
    if (D.viagem.emb && ev === D.viagem.emb.ev) {
      R.rodar('emboscada', () => {
        if (D !== eu) return;
        R.verEmboscada();
        avisarEmboscada(ev);
        cont();
      });
      return;
    }
    R.rodar('fim', () => chegarNaCidade(eu, () => fase(p, cont)));
  }
  function avisarEmboscada(ev) {
    const v = D.viagem, cid = v.cidades[v.emb.i].nome;
    status(v.emb.tipo === 'emb-posto' ? `Parada no posto em ${cid}: a ${ev.nome} tá esperando na saída do pátio!` : `A ${ev.nome} fechou a pista em ${cid}!`, true);
  }
  /* A CHEGADA NA CIDADE DO JOGO: a estrada sai, a praça deles monta (onde
     a caravana desce, o plano do dia) e a linha segue */
  async function chegarNaCidade(eu, depois) {
    if (D !== eu) return;
    const R = D.estrada;
    D.estrada = null; D.montandoCidade = true;
    if (R) R.desmontar();
    status(`A caravana chegou em ${D.nome}.`);
    await montarCidade(eu);
    if (D !== eu) return;
    D.montandoCidade = false;
    soltarEspera();
    if (depois) depois();
  }
  /* A VOLTA PELA ESTRADA: depois do apito a caravana pega a rodovia de
     volta; a linha só fecha (e a praça do jogador volta) com ela em casa */
  function voltaPelaEstrada(p, cont) {
    const v = viagemDa(D.it, 'volta');
    if (!v) return false;
    const eu = D;
    D.voltou = true; D.naFase = true; D.fase = 'volta';
    /* (o dia da cidade fica parado e escondido: os rótulos dos bondes não ficam por cima da estrada) */
    if (dia) { dia.parar(); dia.seguirBonde(null); dia.esconder(true, true); }
    /* (o placar de TV sai quando a estrada monta: o resultado fica escrito no painel) */
    const res = resultadoEmTexto();
    status(`Fim de jogo${res ? ` (${res})` : ''}: a caravana pega a estrada de volta (${D.nome} → ${v.cidades[v.cidades.length - 1].nome}).`);
    abrirEstrada(v, eu).then(ok => {
      if (D !== eu) return;
      if (!ok) { cont(); return; }
      const R = D.estrada, ev = (p.eventos || [])[0];
      if (v.emb && ev === v.emb.ev) {
        R.rodar('emboscada', () => { if (D !== eu) return; R.verEmboscada(); avisarEmboscada(ev); cont(); });
        return;
      }
      cont();
      R.rodar('fim', () => chegarEmCasa(eu));
    }, err => { console.error('a estrada da volta:', err); if (D === eu) cont(); });
    return true;
  }
  function chegarEmCasa(eu) {
    if (D !== eu) return;
    D.chegouEmCasa = true;
    status('A caravana chegou em casa.');
    soltarEspera();
  }
  /* A EMBOSCADA NA ESTRADA, DEPOIS DO RECADO: quem desce (antes da cena ou do duelo simulado) */
  function antesDaBriga(ev, abrirCena) {
    const R = D && D.estrada;
    if (!R || !D.viagem || !D.viagem.emb || ev !== D.viagem.emb.ev || !R.naParada) { abrirCena(); return; }
    const r = TO.tela && TO.tela.resumoDaLinha ? TO.tela.resumoDaLinha() : null;
    status(`A ${D.e.torcida.nome} desce do ônibus.`);
    const eu = D;
    R.descer(r ? r.nos : 20, () => { if (D === eu && D.estrada === R) abrirCena(); });
  }
  /* o palco da briga na peça da estrada (vida3d.js, `palcoDaCaravana`, pergunta aqui primeiro) */
  function brigaNaEstrada(local) {
    const R = D && D.estrada;
    if (!R || !R.naParada || !R.peca || R.peca.tipo !== local) return null;
    const B = R.briga();
    if (!B || !TO.dados || !TO.dados.cenas) return null;
    TO.dados.cenas[B.cena.id] = B.cena;
    R.naBriga();
    D.emCena = true;
    const eu = D, Cb = TO.diaJogo && TO.diaJogo.combate;
    const Rd = palcoDeBriga({ C: C(), M, cena: B.cena, noMundo: B.noMundo, doMundo: B.doMundo, u: B.u, v: B.v, chao: B.chao, livre: true,
                              escala: B.escala, vistas: { perto: { dist: 19, el: 1.08 }, alto: { dist: 36, el: 1.25 } },
                              rotAlto: local === 'emb-posto' ? 'o posto inteiro, do alto' : 'a pista fechada, do alto',
                              aoDesmontar: () => {
                                if (D !== eu || D.estrada !== R) return;
                                D.emCena = false;
                                const jb = TO.diaJogo && TO.diaJogo.J;
                                R.voltouDaBriga(jb, jb && Cb && Cb.ladoDoJogador ? Cb.ladoDoJogador(jb) : 'visitante');
                              } });
    return { local: B.cena.id, renderizador: Rd };
  }
  /* definida a briga (jogada ou simulada): quem ficou de pé volta pro ônibus e a viagem segue */
  function depoisDaEmboscada(res) {
    const R = D.estrada, eu = D, volta = D.viagem.qual === 'volta';
    D.emCena = false;
    const ganhou = !!(res && res.ganhamos);
    status(ganhou ? 'Saímos por cima. Quem ficou de pé volta pro ônibus.' : 'Apanhamos na estrada. Quem ficou de pé volta pro ônibus.', !ganhou);
    R.embarcar(res, () => {
      if (D !== eu || D.estrada !== R) return;
      status(volta ? 'A caravana segue viagem pra casa, com quem não se feriu.' : `A caravana segue viagem pra ${D.nome}, com quem não se feriu.`);
      R.rodar('fim', () => volta ? chegarEmCasa(eu) : chegarNaCidade(eu, null));
    });
  }
  const daEstrada = ev => !!(D && D.estrada && D.viagem && D.viagem.emb && ev === D.viagem.emb.ev);
  /* o painel na estrada: a hora da viagem e a praça da vez */
  function pintarEstrada() {
    const R = D && D.estrada;
    if (!R || !hud) return;
    const h = hud.querySelector('.j3d-dia-hora'), m = ((R.minuto % 1440) + 1440) % 1440, txt = hhmm(m * 60);
    if (h.textContent !== txt) h.textContent = txt;
    /* (o placar da partida sai de cena na estrada da volta: estadoDoPlacar) */
    pintarFases(); pintarPlacar();
    const t = R.praca;
    if (R.andando && t && t !== D.pracaVista) { D.pracaVista = t; status(t.ultima ? `Na estrada: chegando em ${t.nome}.` : `Na estrada: passando por ${t.nome}.`); }
    const bp = hud.querySelector('[data-dia="pular"]');
    if (bp && bp.disabled === R.andando) bp.disabled = !R.andando;
  }
  /* A PRAÇA DO JOGO INTEIRA ANTES DE O DIA ANDAR (conserto de 28/09/2026,
     o dono: "o jogo inicia com o mapa da outra cidade nem ter carregado
     ainda"). Montar a praça de fora leva segundos (no celular, bem mais),
     e o dia não pode começar em cima de meia cidade — nem de uma que
     outra montagem cancelou no meio (a praça do jogador remontando por
     causa de um bar novo, por exemplo). Pede a praça se ela não é a do
     jogo, espera a montagem acabar e confere: montada, é a do jogo. */
  const dorme = ms => new Promise(r => setTimeout(r, ms));
  async function esperarPraca(nome, eu) {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const Cn = C();
      if (Cn.praca === nome && !Cn.montando) return true;
      status(`Carregando o mapa de ${nome}…`);
      /* montando a mesma praça (a remontagem da sede ou dos bares): só espera.
         A praça de fora é visita: não vira a que o jogo abre da próxima vez
         (o dono, 29/09/2026: "o jogo buga e recarrega automaticamente") */
      if (Cn.praca !== nome || !Cn.montando) await api.abrirPraca(nome, false, !!eu.fora);
      while (D === eu && C().montando) await dorme(150);
      if (D !== eu) return false;
      if (C().praca === nome) { status(D.fora ? `A caravana chegando em ${nome}…` : 'A PM montando o plano do dia…'); return true; }
    }
    throw new Error(`o mapa de ${nome} não carregou`);
  }
  const inicioTxt = b => {
    const n = b.naRua || b.n;
    if (b.inicio.tipo === 'aliado') return `A caravana na sede da ${b.inicio.t.nome}: ${n} dos nossos${b.escolta ? ` e ${b.escolta.membros} da escolta dela` : ''}.`;
    if (b.inicio.tipo === 'entrada') return D.fora ? `A caravana desce na entrada da cidade: ${n} dos nossos.` : `Saindo da entrada da cidade: ${n} dos nossos.`;
    return `Concentração na porta da sede: ${n} dos nossos.`;
  };
  /* O INÍCIO DO VISITANTE (o dono: "podendo iniciar a rota ou na entrada
     ou na casa do aliado"): com a aliada que recebe (o pedido de ajuda
     do planejamento) e sede dela no mapa, a escolha é do jogador */
  function escolherInicio(e, j) {
    const aj = TO.planejamento && TO.planejamento.ajudaDe ? TO.planejamento.ajudaDe(e, j) : null;
    const recebe = aj && aj.nivel && aj.nivel !== 'nada' && (!aj.mapa || aj.mapa === j.mapaAdv);
    const sede = recebe ? (api.planta.torcidas ? api.planta.torcidas() : []).find(t => t.id === aj.aliado && t.porta) : null;
    if (!sede) return Promise.resolve({ inicio: 'entrada', aj: null });
    const escolta = (aj.nivel === 'escolta' || aj.nivel === 'churrasco') && aj.escolta > 0;
    /* A PERGUNTA É UM RECADO NA LINHA DO DIA (o dono, 28/09/2026: "As
       mensagens sempre vão ser via balões de alguém falando com o
       jogador"): o cartão entra na linha, que está no balão (recados3d.js);
       sem a linha, a caixa de sempre */
    const naLinha = TO.tela && TO.tela.recadoNaLinha;
    if (naLinha) return new Promise(ok => {
      const cx = document.createElement('div');
      cx.className = 'itn-cartao investida escolha';
      cx.innerHTML = `<div class="voz">Caravana · ${esc(j.cidadeAdv || '')} · onde a caravana desce?</div>
        <p>A ${esc(aj.nome)} recebe a gente${escolta ? ` e manda ${aj.escolta} da escolta com o nosso bonde` : ''}. Descer na sede dela é chegar em casa de aliado, longe da PM da entrada; descer na entrada é ir direto, pela avenida.</p>
        <div class="bts"><button class="itn-bt acao" data-ini="aliado">Na sede da ${esc(aj.nome)}</button><button class="itn-bt" data-ini="entrada">Na entrada da cidade</button></div>`;
      let tirar = null;
      cx.addEventListener('click', ev => {
        const b = ev.target.closest('[data-ini]');
        if (!b) return;
        if (tirar) tirar();
        ok({ inicio: b.dataset.ini, aj: b.dataset.ini === 'aliado' ? aj : null });
      });
      tirar = naLinha(cx);
      if (!tirar) ok({ inicio: 'entrada', aj: null });
    });
    return new Promise(ok => {
      const fundo = document.createElement('div');
      fundo.className = 'j3d-dia-modal';
      fundo.innerHTML = `<div class="j3d-dia-caixa" role="dialog" aria-label="Onde a caravana desce">
          <p class="j3d-dia-sobre">Caravana · ${esc(j.cidadeAdv || '')}</p>
          <h3>Onde a caravana desce?</h3>
          <p>A ${esc(aj.nome)} recebe a gente${escolta ? ` e manda ${aj.escolta} da escolta com o nosso bonde` : ''}. Descer na sede dela é chegar em casa de aliado, longe da PM da entrada; descer na entrada é ir direto, pela avenida.</p>
          <div class="j3d-dia-bts"><button data-ini="aliado" class="acao">Na sede da ${esc(aj.nome)}</button><button data-ini="entrada">Na entrada da cidade</button></div>
        </div>`;
      document.body.appendChild(fundo);
      fundo.addEventListener('click', ev => {
        const b = ev.target.closest('[data-ini]');
        if (!b) return;
        fundo.remove();
        ok({ inicio: b.dataset.ini, aj: b.dataset.ini === 'aliado' ? aj : null });
      });
    });
  }
  /* A BRIGA DA CAMINHADA (a fase da ida): o ataque que a gente sofre ou a
     investida marcada, na concentração (a praça) ou na pista (a rua), na
     cidade do jogo */
  function brigaDaIda(it, e) {
    const f = (it.paradas || []).find(p => p.id === 'ida');
    const ev = f && (f.eventos || [])[0];
    if (!ev || !ev.torcida || ev.naCidade === false) return null;
    if (ev.ponto !== 'concentracao' && ev.ponto !== 'pista') return null;
    const onde = ev.ponto === 'concentracao' ? 'praca' : 'rua';
    if (ev.tipo === 'sofrido') return { a: ev.torcida, v: e.torcida.id, onde, ev };
    if (ev.tipo === 'investida') return { a: e.torcida.id, v: ev.torcida, onde, ev };
    return null;
  }
  /* A INVESTIDA NOS ARREDORES (a fase da ida; arredores3d.js): a nossa,
     marcada pros arredores do estádio — cai no cordão da PM */
  function arredoresDaIda(it, e) {
    const f = (it.paradas || []).find(p => p.id === 'ida');
    const ev = f && (f.eventos || [])[0];
    if (!ev || !ev.torcida || ev.naCidade === false || ev.ponto !== 'arredores' || ev.tipo !== 'investida') return null;
    return { a: e.torcida.id, v: ev.torcida, ev };
  }
  function escolhaDoDia(e, j, msg, it, ini) {
    const meu = e.torcida.clubeId, casa = j.casa ? meu : j.advId, fora = j.casa ? j.advId : meu;
    const pres = ((msg && msg.dados && msg.dados.presenca) || []).filter(p => p && p.id && p.n > 0).map(p => ({ id: p.id, n: p.n }));
    const aj = ini && ini.aj;
    /* (o bonde é o que a linha carrega agora: quem caiu na estrada não chega) */
    const r = TO.tela && TO.tela.resumoDaLinha ? TO.tela.resumoDaLinha() : null;
    const nosso = { id: e.torcida.id, n: r && r.nos != null ? r.nos : it.efetivo ? it.efetivo.nos : null, inicio: ini ? ini.inicio : 'sede',
                    aliado: aj ? aj.aliado : null, nivel: aj ? (aj.nivel === 'hospedar' ? 'hospedar' : 'escolta') : null, escolta: aj ? aj.escolta || 0 : 0 };
    const briga = brigaDaIda(it, e), arr = briga ? null : arredoresDaIda(it, e);
    return { jogo: true, casa, fora, bola: segDe(j.hora), presenca: pres.length ? pres : null, nosso, ia: 'paz', estadio: 'nao', gente: 1,
             /* em casa, quem recebe os visitantes de fora é o que o jogo diz (o aliado que a gente hospeda sai da nossa porta) */
             hospedes: j.casa ? hospedesDoJogo(e, casa, fora) : null,
             briga: briga ? { a: briga.a, v: briga.v, onde: briga.onde, ev: briga.ev } : null,
             arredores: arr };
  }

  /* ======================================================
     QUEM RECEBE QUEM (o jogo 3D, 28/09/2026; o dono: "Quando o jogador
     opta por hospedar na sede um aliado, eles aparecem na sede no dia do
     jogo e partem da sede pro estádio"): cada torcida do visitante que
     vem de fora, e a casa dela na nossa praça — a do jogador quando ele
     recebe esse aliado (a recepção do planejamento: hospedar; hospedar e
     escoltar e o churrasco mandam até 10 dos nossos junto), e senão a do
     jogo (js/mundo/praca.js: a irmandade ou o aliado da tabela, com o
     sorteio fixo dele: não recebe, hospeda ou hospeda e escolta). O
     plano do dia (dia_de_jogo.js, `escolha.hospedes`) não sorteia outro
     ====================================================== */
  function hospedesDoJogo(e, casaId, visId) {
    const Pr = TO.praca, PL = TO.planejamento, Mu = TO.mundo;
    if (!Pr || !Pr.anfitriaoDe || !PL || !Mu || !Mu.torcidasDe) return null;
    const out = {};
    let meus = [];
    try { meus = PL.hospedesDeHoje ? PL.hospedesDeHoje(e) : []; } catch (err) { meus = []; }
    const jogo = { casa: Mu.time(casaId), vis: Mu.time(visId), dia: e.data.dia };
    for (const o of Mu.torcidasDe(visId) || []) {
      if (!o || o.id === e.torcida.id || o.mapa === e.torcida.mapa) continue;   // mora aqui: sai da sede dela
      const meu = meus.find(a => a.id === o.id);
      if (meu) {
        const esc = meu.nivel === 'escolta' || meu.nivel === 'churrasco';
        const aptos = esc && TO.membros && TO.membros.aptosParaOEstadio ? TO.membros.aptosParaOEstadio(e).length : 10;
        out[o.id] = { anfitriao: e.torcida.id, decisao: meu.nivel, escolta: esc ? Math.min(10, aptos) : 0, doJogador: true, grau: 2 };
        continue;
      }
      let anf = null;
      try { anf = Pr.anfitriaoDe(e, null, o); } catch (err) { anf = null; }
      /* (a casa do jogador só recebe quem ele disse que recebe) */
      if (!anf || anf.id === e.torcida.id) continue;
      const decisao = Pr.decisaoDoAnfitriao ? Pr.decisaoDoAnfitriao(e, anf.torcida, o, jogo) : 'nada';
      const escolta = decisao === 'escolta' && Pr.escoltaDe ? Pr.escoltaDe(e, anf.torcida, o) : 0;
      out[o.id] = { anfitriao: anf.id, decisao, escolta };
    }
    return out;
  }

  /* ======================================================
     O JOGO DA CIDADE, SÓ QUANDO A GENTE VAI NELE (o dono, 28/09/2026:
     "remova esse acompanhamento de perto do dia de outros jogos na
     cidade, só vai tornar o jogo mais demorado. só vai parar o tempo caso
     tenhamos planejado algo pra algum jogo na cidade"). O jogo de dois
     outros clubes na nossa praça só monta quando o planejamento marcou
     uma investida nele (a concentração deles ou a pista): o dia dele —
     os bondes das torcidas dos dois clubes saindo das sedes e da casa de
     quem as recebe, a briga que o mundo sorteou (js/mundo/relacoes.js,
     `brigasDeHoje`) — aparece no fundo da vida da praça só no pedaço da
     investida: quando o nosso bonde junta na porta (ou 25 min antes do
     encontro) até uma hora depois dele, e some quando ele volta pra sede.
     Sem investida, o jogo corre só no resultado (a rodada e a aba Brigas
     das Notícias): nada na tela, nenhum aviso, e o relógio não para
     ====================================================== */
  /* quem foi pra rua (a mesma lista da pauta do jogo, `naRuaEm`): o
     visitante sem a escolta de quem o recebe (o plano soma a escolta de
     novo), a da casa com a gente que emprestou pra escolta (o plano tira
     de novo) */
  function presencaDoJogo(e, casaId, visId) {
    let rua = [];
    try { rua = TO.praca && TO.praca.naRuaEm ? TO.praca.naRuaEm(e, e.data.dia) : []; } catch (err) { rua = []; }
    const devido = {};
    for (const b of rua) if (b.escolta && b.escolta.de) devido[b.escolta.de] = (devido[b.escolta.de] || 0) + (b.escolta.n || 0);
    const lista = rua.filter(b => b.jogo === casaId && !b.nossa && b.n > 0)
      .map(b => ({ id: b.id, n: Math.max(1, Math.round(b.deFora ? b.n - (b.escolta ? b.escolta.n : 0) : b.n + (devido[b.id] || 0))) }));
    /* o aliado que a gente hospeda vem, mesmo com a caravana pequena (a pauta corta abaixo de 5) */
    if (lista.length) {
      let meus = [];
      try { meus = TO.planejamento && TO.planejamento.hospedesDeHoje ? TO.planejamento.hospedesDeHoje(e) : []; } catch (err) { meus = []; }
      for (const a of meus) if (a.clube && a.clube.id === visId && !lista.some(x => x.id === a.id)) lista.push({ id: a.id, n: Math.max(2, Math.round(a.estimativa || 2)) });
    }
    return lista;
  }
  /* a briga que o mundo sorteou hoje pra este jogo (a aba Brigas) */
  function brigaRegistrada(e, casa, vis) {
    const cid = TO.mundo && TO.mundo.cidade ? (TO.mundo.cidade(e.torcida.mapa) || {}).nome : null;
    const rot = `${casa.nome} × ${vis.nome}`;
    return (e.brigasIA || []).find(r => r && r.a && r.b && r.ano === e.data.ano && r.semana === e.data.semana && r.dia === e.data.dia &&
                                       r.jogo === rot && (!cid || r.cidade === cid)) || null;
  }
  /* o jogo de hoje na nossa praça (js/mundo/praca.js, `jogosDaPraca`: { casa,
     vis, hora, comp }), montado no fundo da vida da praça — só com a
     nossa investida nele (sem ela, devolve false e não monta nada) */
  async function jogoNoFundo(j) {
    const e = E();
    if (D || !e || !e.torcida || !j || !j.casa || !j.vis) return false;
    const Cn = C();
    if (!Cn || !Cn.vida || !Cn.vida.diaDeJogo || !vida.ligada || !vida.relogio) return false;
    const bola = segDe(j.hora);
    /* (o jogo que já acabou na hora do relógio não monta) */
    if (vida.relogio.minuto * 60 > bola + DURACAO_S + 15 * 60) return false;
    const casa = j.casa, vis = j.vis;
    const eu = D = { ia: true, fundo: true, e, fora: false, nome: Cn.praca, fase: 'montando', vezes: 30, corrida: null, partida: null, invadiu: true,
                     titulo: `${casa.nome} × ${vis.nome}`, casa, vis, hora: j.hora || '16:00', estadio: j.estadio || casa.estadio || '' };
    /* O TEMPO ESPERA O PLANO MONTAR (uns segundos, no começo do dia): o
       relógio conta a espera do dia com as janelas dele — sem elas, o dia
       virava antes de o jogo acontecer. Montado, a espera é refeita */
    const T = TO.tela;
    if (T && T.pausarTempo) T.pausarTempo('jogo-da-cidade');
    const soltar = () => { if (T && T.retomarTempo) T.retomarTempo('jogo-da-cidade'); };
    try {
      dia = await Cn.vida.diaDeJogo();
      const { caminhoNaRua } = await import('./dia_de_jogo.js?v=cbc9bdea8a');
      if (D !== eu) return false;
      const reg = brigaRegistrada(e, casa, vis);
      const pres = presencaDoJogo(e, casa.id, vis.id);
      /* a praça (a concentração do atacado) ou a rua (o caminho dele): fixo pro registro */
      const onde = reg && ((reg.a.n || 0) + (reg.b.n || 0)) % 3 === 0 ? 'praca' : 'rua';
      const esc0 = { jogo: true, casa: casa.id, fora: vis.id, bola, presenca: pres.length ? pres : null, ia: 'paz', estadio: 'nao', gente: 1,
                     hospedes: hospedesDoJogo(e, casa.id, vis.id), briga: reg ? { a: reg.a.id, v: reg.b.id, onde } : null };
      /* (até a hora dele, a cidade não mostra nada do jogo: a vida segue sozinha na tela) */
      Cn.vida.diaNoFundo = 'oculto';
      let p = dia.jogo(esc0);
      /* (a briga que não achou lugar no mapa não derruba o dia: ele monta em paz) */
      if ((!p || p.erro) && esc0.briga) { esc0.briga = null; p = dia.jogo(esc0); }
      if (!p || p.erro) throw new Error(p && p.erro ? p.erro : 'o plano do dia não montou');
      if (D !== eu) return false;
      dia.parar(); dia.esconder(true, true);
      D.plano = p; D.escolha = esc0; D.reg = reg;
      D.briga = reg && p.brigas && p.brigas[0] && p.brigas[0].a.t.id === reg.a.id && p.brigas[0].v.t.id === reg.b.id ? p.brigas[0] : null;
      /* o resultado é o do mundo: quem ganhou e a proporção de feridos e presos de cada lado */
      if (D.briga) {
        const br = D.briga, fr = (x, n) => (x || 0) / Math.max(1, n || 1);
        br.aplicar({ venceA: !!reg.ganhouA, ferA: fr(reg.a.feridos, reg.a.n) * br.nA, presA: fr(reg.a.presos, reg.a.n) * br.nA,
                     ferV: fr(reg.b.feridos, reg.b.n) * br.nV, presV: fr(reg.b.presos, reg.b.n) * br.nV });
      }
      /* a nossa investida nesse jogo: sem ela montada (o alvo não veio, a hora já passou), o jogo não fica */
      investidaNoFundo(e, j, p, caminhoNaRua);
      if (!D.inv) { fechar(); return false; }
      /* os bondes aparecem quando o nosso junta na porta (ou 25 min antes do encontro) e saem com a volta dele */
      D.t0 = Math.min(D.inv.tJunta, D.inv.tEnc - 25 * 60);
      D.t1 = D.inv.tEnc + 60 * 60;
      D.fase = 'espera';
      dia.irPara(Math.max(p.inicio, D.t0));
      if (!laco) laco = requestAnimationFrame(quadro);
      return true;
    } catch (err) {
      console.error('jogo da cidade no fundo:', err);
      if (D === eu) fechar();
      return false;
    } finally { soltar(); }
  }
  /* O JOGO DA CIDADE ANDA COM O RELÓGIO DO DIA (a vida da praça): só o
     pedaço da investida — os bondes aparecem quando o nosso junta na
     porta, e tudo sai quando ele volta pra sede */
  function quadroFundo() {
    const F = D, r = vida.relogio, Cn = C();
    if (!F || !F.plano || !r || !dia || !dia.plano) return;
    const t = r.minuto * 60;
    if (F.fase === 'espera' && t >= F.t0) {
      F.fase = 'ida';
      dia.esconder(false, true);
      if (Cn && Cn.vida) Cn.vida.diaNoFundo = true;
    }
    quadroInvestida(t);
    if (F.fase === 'espera' || F.fase === 'montando') return;
    dia.t = Math.max(F.plano.inicio, t);
    if ((F.inv && F.inv.fase === 'fim') || t >= F.t1) fechar();
  }

  /* ======================================================
     A NOSSA INVESTIDA NUM JOGO DA CIDADE (o dono: "se tiver planejado, vai
     em direção ao que quer atacar seja na pista ou concentração"): o
     planejamento marcou — a concentração deles, na porta da sede antes de
     saírem, ou a pista, a rua a caminho do estádio. O nosso bonde junta na
     nossa porta, sai na hora certa e anda pela rua e pela calçada até o
     alvo (o relógio desacelera na chegada, com a câmera atrás dele); a
     decisão do planejamento ("Ir pra Guerra", o duelo e o simular de
     sempre, feed.js) cai quando ele chega, com o texto do que se vê; depois
     de respondida, ele volta pra sede
     ====================================================== */
  /* (o bonde da investida é o efetivo do ataque inteiro, até 400 como no dia de jogo; de 6 em 6 lado a lado quando passa de 120) */
  const MARCHA_INV = 1.35, MAX_INV = 400, JUNTA_S = 8 * 60, ESPERA_S = 40;
  function investidaNoFundo(e, j, p, caminhoNaRua) {
    const PL = TO.planejamento;
    if (!PL || !PL.outrosJogosNaCidade || !PL.investidaDe) return;
    let og = null;
    try { og = PL.outrosJogosNaCidade(e, e.data.semana).find(o => (o.dia || 6) === e.data.dia && o.casa.id === j.casa.id && o.vis.id === j.vis.id); } catch (err) { og = null; }
    const inv = og && PL.investidaDe(e, og.chave);
    if (!inv || !inv.alvo || inv.jogada) return;
    const alvo = p.vivos.find(b => b.t.id === inv.alvo);
    const porta = api.sedeDe ? api.sedeDe(e.torcida.id) : null;
    if (!alvo || !alvo.rua || !porta) return;
    const onde = inv.como === 'ida' ? (inv.olheiro === 'praca' ? 'concentracao' : 'pista') : 'arredores';
    const Q = {};
    let P, tEnc, sAlvo = 8 * M;
    if (onde === 'concentracao') {
      /* na porta da sede deles, com a concentração ainda nas rodinhas */
      alvo.rua.ponto(Math.min(alvo.rua.L, 8 * M), Q);
      P = [Q.x, Q.z]; tEnc = alvo.sai - 4 * 60;
    } else {
      /* na rota deles: na pista, perto da metade; nos arredores, antes da boca do portão */
      sAlvo = onde === 'pista' ? alvo.rua.L * 0.45 : Math.max(0, alvo.rua.L - 60 * M);
      alvo.rua.ponto(sAlvo, Q);
      P = [Q.x, Q.z];
      /* a hora em que a cabeça deles passa ali (a conta do plano, ao contrário) */
      let a = alvo.sai, b = alvo.chega || alvo.sai + 3600;
      for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (p.cabeca(alvo, m) < sAlvo) a = m; else b = m; }
      tEnc = b - 20;
    }
    const tr = caminhoNaRua(p, porta.x + porta.fx * 2 * M, porta.y + porta.fy * 2 * M, P[0], P[1]);
    if (!tr || tr.L < 5 * M) return;
    const anda = tr.L / M / MARCHA_INV;
    const tSai = tEnc - anda - ESPERA_S, tJunta = tSai - JUNTA_S;
    /* (uma investida que já passou da hora no relógio de agora não sai) */
    if (vida.relogio.minuto * 60 > tSai) return;
    let n = 20;
    try { n = Math.max(6, Math.min(MAX_INV, Math.round(PL.efetivoDoAtaque(e).vao || 20))); } catch (err) { n = 20; }
    const cc = TO.mundo && TO.mundo.coresDaTorcida ? TO.mundo.coresDaTorcida(e.torcida) : { cor: '#777', cor2: '#eee', cor3: null };
    const gente = [], lado = n > 120 ? 6 : 4;
    for (let i = 0; i < n; i++) gente.push({ i, fila: Math.floor(i / lado), col: (i % lado) - (lado - 1) / 2, d: { nome: `${e.torcida.nome} (investida ${i + 1})`, spawn: 'investida', torcida: e.torcida.nome,
      cor: cc.cor, cor2: cc.cor2, cor3: cc.cor3, lado: 'mandante', lider: i === 0, vivo: true, x: porta.x, y: porta.y, alt: 0, rumo: 0, passada: 1.15, derrubado: 0, golpe: 0, apanhou: 0,
      atordoado: 0, esquivou: 0, tremor: 0, defendendo: 0, hostil: 0, inimigoPerto: 0, chamou: -99, linha: 'frente', mundo: true } });
    const filas = Math.ceil(n / lado);
    D.inv = { alvo, onde, P, sAlvo, tEnc, tSai, tJunta, tr, gente, filas, chave: og.chave, fase: 'espera', viu: false, tVolta: null, sVolta: 0,
              camera: null, voouEm: 0, seguir: true, deixou: null, chegouVista: false };
    /* a decisão do planejamento cai na hora do encontro, com o texto do que se vê */
    retimarGuerra(e, og.chave, tEnc, alvo, onde);
    /* a chegada se vê: os últimos 25 minutos antes do encontro, devagar */
    const r = vida.relogio;
    if (r.janela) r.janela(Math.max(0, tEnc / 60 - 25), tEnc / 60 + 1, 380);
  }
  /* A DECISÃO NA HORA DO ENCONTRO: o recado do planejamento (feed.js, "Hoje é
     o dia… Ir pra Guerra") cai quando o nosso bonde chega no alvo */
  function retimarGuerra(e, chave, tEnc, alvo, onde) {
    const fila = e.feedFila || [];
    const m = fila.find(x => x && x.kind === 'guerra' && x.dados && x.dados.tipo === 'praca' && x.dados.chaveJogo === chave);
    if (!m) return;
    m.hora = hhmm(tEnc);
    const nome = alvo.t.nome;
    m.texto = onde === 'concentracao' ? `Chegamos na esquina da sede da ${nome}. A concentração deles tá toda na porta, antes de sair pro estádio — é agora.`
      : onde === 'pista' ? `A gente tá na rua, esperando o bonde da ${nome} passar a caminho do estádio. Eles tão chegando — é agora.`
      : `A gente tá perto do estádio, no caminho da ${nome}. Eles tão chegando nos arredores — é agora.`;
    /* a fila de hoje na ordem das horas (a decisão não pode esperar atrás de uma mais tarde) */
    const hoje = e.data.absoluto || 0, min = x => { const a = /^(\d\d?):(\d\d)/.exec(String(x.hora || '')); return a ? +a[1] * 60 + +a[2] : 0; };
    const doDia = fila.filter(x => x.quando && x.quando.abs === hoje);
    const resto = fila.filter(x => !(x.quando && x.quando.abs === hoje));
    doDia.sort((a, b) => min(a) - min(b));
    fila.length = 0; fila.push(...doDia, ...resto);
  }
  /* A CÂMERA DA INVESTIDA: na nossa porta quando o bonde junta (com o
     aviso), atrás da cabeça dele na caminhada, e na chegada no ponto do
     encontro, de trás da gente, com o lado de onde eles vêm na frente —
     é ali que a decisão cai. Quem mexe na câmera no meio do caminho fica
     com ela (o bonde deixa de ser seguido) */
  const QC = {};
  function cameraDaInvestida(I, cabeca, h0) {
    const Cn = C();
    if (!Cn || !Cn.orb || I.fase === 'volta' || I.fase === 'fim') return;
    const agora = performance.now(), ob = Cn.orb.alvo;
    if (!I.viu) {
      I.viu = true;
      I.tr.ponto(Math.min(I.tr.L, 6 * M), QC);
      Cn.voarPara(QC.x, QC.z, 50 * M, 0.95, Math.atan2(-QC.tx, -QC.tz), 0);
      I.voouEm = agora; I.deixou = null;
      const onde = I.onde === 'concentracao' ? 'na porta da sede deles, antes de saírem' : I.onde === 'pista' ? 'na rota deles pro estádio' : 'perto do estádio';
      avisar({ voz: 'Investida', texto: `O nosso bonde tá juntando na porta da sede pra ir pra cima da ${I.alvo.t.nome}, ${onde}.` });
      return;
    }
    /* a chegada: o ponto do encontro */
    if (I.fase === 'chegou' && !I.chegouVista) {
      I.chegouVista = true;
      I.tr.ponto(I.tr.L, QC);
      Cn.voarPara(I.P[0] - QC.tx * 6 * M, I.P[1] - QC.tz * 6 * M, 58 * M, 0.88, Math.atan2(-QC.tx, -QC.tz), 0);
      I.voouEm = agora; I.deixou = null;
      return;
    }
    /* a caminhada: a câmera vai atrás da cabeça (depois do voo; quem mexeu, manda) */
    if (I.fase !== 'anda' || !I.seguir || agora - I.voouEm < 1400) return;
    if (I.deixou && Math.hypot(ob.x - I.deixou.x, ob.z - I.deixou.z) > 4 * M) { I.seguir = false; return; }
    I.tr.ponto(Math.max(0, Math.min(I.tr.L, cabeca - h0 * 0.35)), QC);
    ob.x += (QC.x - ob.x) * 0.12; ob.z += (QC.z - ob.z) * 0.12;
    I.deixou = { x: ob.x, z: ob.z };
    if (Cn.pedir) Cn.pedir();
  }
  /* o nosso bonde da investida, a cada quadro (s do dia: o relógio da vida) */
  const QI = {};
  function quadroInvestida(t) {
    const I = D && D.inv, Cn = C();
    if (!I || !Cn || !Cn.vida) return;
    const e = E();
    /* respondida a decisão (foi, simulou ou deixou), o bonde volta */
    if (I.fase !== 'volta' && I.fase !== 'fim') {
      const m = e && (e.feed || []).find(x => x && x.kind === 'guerra' && x.dados && x.dados.tipo === 'praca' && x.dados.chaveJogo === I.chave);
      if (m && m.respondido && !document.body.classList.contains('em-cena')) { I.fase = 'volta'; I.tVolta = t + 20; }
    }
    if (t < I.tJunta || I.fase === 'fim') { if (Cn.vida.extras.length) Cn.vida.extras = []; return; }
    const L = I.tr.L, passo = 1.1 * M, lado = 0.85 * M, h0 = I.filas * passo;
    let cabeca, volta = false;
    if (I.fase === 'volta' && I.tVolta != null && t >= I.tVolta) {
      volta = true;
      cabeca = Math.min(L, I.sParou || L) - (t - I.tVolta) * MARCHA_INV * M;
      if (cabeca + h0 < 0) { I.fase = 'fim'; Cn.vida.extras = []; return; }
    } else {
      cabeca = Math.min(L - 2 * M, h0 + Math.max(0, t - I.tSai) * MARCHA_INV * M);
      I.sParou = cabeca;
      if (I.fase === 'espera' && t >= I.tSai) I.fase = 'anda';
      if (I.fase === 'anda' && cabeca >= L - 2 * M - 1e-3) I.fase = 'chegou';
    }
    cameraDaInvestida(I, cabeca, h0);
    const ds = [];
    for (const g of I.gente) {
      /* na volta a última fila vai na frente */
      const s = volta ? cabeca + g.fila * passo : cabeca - g.fila * passo;
      if (s < 0) continue;
      I.tr.ponto(Math.min(L, s), QI);
      const lat = g.col * lado;
      const d = g.d, x = QI.x + QI.tz * lat, z = QI.z - QI.tx * lat;
      const mx = x - d.x, mz = z - d.y;
      if (mx * mx + mz * mz > 1e-4) d.rumo = Math.atan2(mx, mz);
      else if (I.fase === 'chegou') d.rumo = Math.atan2(I.P[0] - x + (volta ? 0 : 0.01), I.P[1] - z);
      d.x = x; d.y = z; d.alt = Cn.vida.chao ? Cn.vida.chao(x, z) : 0;
      ds.push(d);
    }
    Cn.vida.extras = ds;
  }
  /* o jogo da cidade no fundo hoje (o relógio da vida não pula o dia) */
  const jogoNoFundoHoje = () => !!(D && D.fundo);
  /* o recado do olheiro dos saves de antes (o jogo da cidade com pergunta): vira o jogo no fundo */
  function abrirJogoDaCidade(m) {
    const d = m && m.dados, Mu = TO.mundo;
    if (!d || !Mu) return false;
    const casa = Mu.time(d.casa), vis = Mu.time(d.vis);
    if (!casa || !vis) return false;
    jogoNoFundo({ casa, vis, hora: d.hora, comp: d.comp, estadio: d.estadio });
    return true;
  }

  /* ======================================================
     AS FASES DA LINHA
     ====================================================== */
  function rodarAte(alvo, vezes, txt, fim) {
    D.corrida = { alvo, fim };
    if (txt) status(txt);
    if (dia.t >= alvo) { terminarCorrida(); return; }
    D.vezes = vezes || D.vezes;
    dia.rodar(D.vezes);
    pintar();
  }
  function terminarCorrida() {
    const c = D && D.corrida;
    if (!c) return;
    D.corrida = null;
    dia.parar();
    pintar();
    if (c.fim) c.fim();
  }
  function pular() {
    if (D && D.estrada) { D.estrada.pular(); return; }
    if (!D || D.fundo || !D.corrida) return;
    dia.irPara(Math.max(dia.t, D.corrida.alvo));
    terminarCorrida();
  }
  /* quando o último do plano chega no lugar (a arquibancada), ou passa a catraca */
  function tudoNoLugar() {
    const A = D.plano.arq;
    let fim = 0;
    if (A) for (const T of A.lista) for (const x of T.chegada) if (x < Infinity) fim = Math.max(fim, x);
    for (const b of D.plano.vivos) if (b.fim) fim = Math.max(fim, b.fim + (A ? 0 : 90));
    return fim;
  }
  function fase(p, cont) {
    /* (a linha espera esta fase acabar: se o dia em 3D cai no meio, `cidadeRefeita` chama a espera no lugar dele) */
    if (D && !D.fundo) { const c0 = cont, eu = D; cont = () => { if (D === eu && D.pendente === cont) D.pendente = null; c0(); }; D.pendente = cont; }
    if (D && D.estrada && !D.fundo && !p.jogo && p.id !== 'volta') { faseNaEstrada(p, cont); return; }
    if (D && D.fora && !D.fundo && p.id === 'volta' && !D.voltou && D.plano && voltaPelaEstrada(p, cont)) return;
    if (!D || !D.plano || !dia || !dia.plano) { cont(); return; }
    const pl = D.plano, nosso = D.nosso;
    D.avisoNoAlto = false;
    D.fase = p.jogo ? 'jogo' : p.id === 'volta' ? 'volta' : 'ida';
    pintar();
    if (D.fase === 'ida') {
      const ev = (p.eventos || [])[0];
      if (ev && D.briga && ev === D.evBriga && D.briga.v === nosso) { atacados(D.briga, cont); return; }
      if (ev && D.briga && ev === D.evBriga) {
        const br = D.briga, somosA = br.a === nosso;
        rodarAte(br.tIni - 7, D.vezes, somosA ? (br.naPorta ? `A caminho da sede da ${br.v.t.sigla}…` : `A caminho da tocaia contra a ${br.v.t.sigla}…`) : 'A caminho do estádio…', () => {
          dia.seguirBonde(null);
          C().voarPara(br.P[0], br.P[1], 38 * M, 0.9, undefined, 0);
          status(somosA ? (br.naPorta ? `A concentração da ${br.v.t.sigla} tá na porta da sede dela.` : `A ${br.v.t.sigla} está chegando no ponto.`) : `A ${br.a.t.sigla} caiu em cima da gente!`, !somosA);
          cont();
        });
        return;
      }
      if (ev && D.arr && ev === D.evArr) { noCordao(D.arr, cont); return; }
      /* a emboscada na estrada vem antes da cidade: a caminhada fica pro jogo */
      if (ev && ev.tipo === 'emboscada') { status('Na estrada, a caminho da cidade.'); cont(); return; }
      if (ev && ev.ponto === 'arredores' && nosso) {
        rodarAte(Math.max(pl.inicio, nosso.chega - 90), D.vezes, 'A caminho dos arredores do estádio…', () => { status('Nos arredores do estádio.'); cont(); });
        return;
      }
      if (ev || !nosso) { cont(); return; }
      rodarAte(nosso.chega, D.vezes, 'A caminhada até o estádio…', () => { status('O nosso bonde chegou no portão.'); cont(); });
      return;
    }
    if (D.fase === 'jogo') {
      const entrar = () => {
        const alvo = Math.max(dia.t, Math.min(pl.bola - 60, tudoNoLugar() + 15));
        rodarAte(alvo, 60, 'As torcidas entrando no estádio…', () => { status('A bola vai rolar.'); verNossoSetor(); cont(); });
      };
      /* DEPOIS DA BRIGA DA IDA: a briga que ainda está no ar (a simulada, a
         que ninguém desceu) acaba de se ver, e o nosso bonde que ainda não
         chegou no portão (o ataque na concentração, na esquina) faz a
         caminhada — sem isso ele ia do chão da briga pro estádio a 60× */
      const br = D.briga || D.arr;
      const andar = () => {
        if (nosso && dia.t < nosso.chega - 20) { dia.seguirBonde(nosso); rodarAte(nosso.chega - 20, D.vezes, 'A caminhada até o estádio, com quem ficou de pé…', entrar); }
        else entrar();
      };
      /* (a velocidade de antes volta depois dela: a 2× é só a da briga) */
      if (br && br.aplicado && dia.t < br.tFim + 3) { const vz = D.vezes; rodarAte(br.tFim + 3, 2, null, () => { if (D) D.vezes = vz; andar(); }); return; }
      andar();
      return;
    }
    status('Fim de jogo: as torcidas saindo.');
    cont();
  }
  /* A INVESTIDA NOS ARREDORES (arredores3d.js; o dono, 29/09/2026: "pode
     fazer a briga dos arredores em 3D"): o nosso bonde desviou até o
     cordão da PM e espera colado na grade, do nosso lado. Perto da hora, a
     câmera vai pro cordão (do nosso lado, olhando o deles) e o relógio
     desacelera com a rival chegando do outro lado; o cartão da linha cai
     com ela à vista, parada na frente da PM */
  function noCordao(A, cont) {
    const rival = A.v.t.sigla;
    rodarAte(Math.max(dia.t, A.tIni - 40), D.vezes, `A caminho do cordão da PM, pra pegar a ${rival}…`, () => {
      if (!D) return;
      dia.seguirBonde(null);
      /* (de mais alto e mais longe: o balão do cartão tampa o terço de cima da
         tela e o painel do dia o pé; na faixa do meio cabem a frente das duas,
         uns 12 m de cada lado da grade) */
      C().voarPara(A.P[0] + A.u[0] * 4 * M, A.P[1] + A.u[1] * 4 * M, 58 * M, 1.0, Math.atan2(-A.u[0], -A.u[1]), 0);
      /* (a 2× só a chegada deles: a velocidade do jogador volta com o cartão) */
      const vz = D.vezes;
      rodarAte(Math.max(dia.t, A.tIni + 2), 2, `A ${rival} chegando do outro lado do cordão…`, () => {
        if (!D) return;
        D.vezes = vz; pintar();
        status(`A ${rival} tá parada do outro lado da grade, na frente da PM.`, true);
        D.avisoNoAlto = true;
        cont();
      });
    });
  }
  /* O ATAQUE QUE A GENTE SOFRE NA IDA (conserto de 28/09/2026, o dono: "se
     for na pista, minha torcida vai normalmente fazer sua rota e em alguma
     esquina vai ser abordada pelo adversário, gerando a mensagem de aviso.
     Se for na concentração eles vem atacar em frente a sede, antes da
     torcida partir"). A cidade anda como num dia sem nada: na pista, o
     nosso bonde faz a rota dele até perto da esquina (dia_de_jogo.js
     escolhe a esquina e esconde a rival na transversal); na concentração,
     a torcida fica nas rodinhas na porta da sede e a rival vem da sede
     dela. Perto da hora, o relógio desacelera com a câmera na esquina (ou
     na porta), a rival sai correndo, e só aí o aviso aparece — com ela à
     vista, em cima da gente */
  function atacados(br, cont) {
    const porta = !!br.naPorta;
    /* a câmera na hora: da rua, de frente pra porta da sede (a concentração
       e a rua dos dois lados); atrás do bonde, olhando a esquina que vem */
    /* (o ponto da briga fica na metade de baixo da tela: o aviso sobe pro
       alto dela e não tampa a rival chegando) */
    /* NO CELULAR EM PÉ a tela é estreita e quem vem pelo lado fica fora
       dela: a câmera fica atrás de quem ataca, olhando o ponto — a rival
       sobe pela tela até a gente. O balão do aviso tampa o alto da tela e
       o painel do dia o pé: a distância e o alvo saem da faixa que sobra
       entre os dois (a tocaia no pé dela, a nossa gente no alto) */
    const faixa = () => {
      const alto = innerHeight || 1;
      let s0 = 0.5, s1 = 0.82;
      const bl = document.querySelector('.j3d-balao.solto:not([hidden])'), hud = document.querySelector('.j3d-dia:not([hidden])');
      if (bl) { const r = bl.getBoundingClientRect(); if (r.height > 0) s0 = r.bottom / alto + 0.02; }
      if (hud) { const r = hud.getBoundingClientRect(); if (r.height > 0) s1 = r.top / alto - 0.02; }
      s1 = clamp(s1, 0.4, 0.97);
      s0 = clamp(Math.min(s0, s1 - 0.22), 0.08, 0.8);
      return [s0, s1];
    };
    const emPe = (cam, [s0, s1]) => {
      /* o que tem que caber: a tocaia (com as primeiras filas de quem
         ataca), o ponto e, do nosso lado, a porta com as rodinhas em volta
         (na concentração) ou o líder do bonde chegando na esquina (na pista) */
      const H = {}, pts = [];
      br.a.rua.ponto(br.sQ, H);
      pts.push([H.x, H.z, 2 * M], [br.P[0], br.P[1], 4 * M]);
      const q = br.v.porta;
      if (porta && q) pts.push([q.x, q.y, 5 * M]);
      else if (!porta) { const V = {}; br.v.rua.ponto(Math.max(0, br.sV - 10 * M), V); pts.push([V.x, V.z, 3 * M]); }
      /* (a conta da lente: o raio da altura s da tela desce el + atan((2s−1)·tg)
         do horizonte e bate no chão a h·cotg disso do pé da câmera; o alvo
         da câmera fica na altura do olho, 1,6 m) */
      const el = 0.9, tg = Math.tan((cam && cam.fov || 42) * Math.PI / 360), larg = (cam && cam.aspect || 0.5) * 0.85 * tg;
      const fi = s => el + Math.atan((2 * s - 1) * tg), fm = fi((s0 + s1) / 2), cot = a => Math.cos(a) / Math.sin(a);
      const prof = Math.sin(el) * (cot(fi(s0)) - cot(fi(s1))), deLado = Math.sin(el) / Math.sin(fm) * Math.cos(fm - el) * larg;
      /* olhando pelo rumo (ux, uz): a distância que faz tudo caber, e onde fica o alvo */
      const medir = (ux, uz) => {
        let p0 = Infinity, p1 = -Infinity, q0 = Infinity, q1 = -Infinity;
        for (const [x, z, m] of pts) {
          const a = (x - br.P[0]) * ux + (z - br.P[1]) * uz, b = (z - br.P[1]) * ux - (x - br.P[0]) * uz;
          p0 = Math.min(p0, a - m); p1 = Math.max(p1, a + m); q0 = Math.min(q0, b - m); q1 = Math.max(q1, b + m);
        }
        const d = clamp(Math.max((p1 - p0) / prof, (q1 - q0) / 2 / deLado), 40 * M, 120 * M), h = d * Math.sin(el) + 1.6 * M;
        /* o que tem que caber no meio da faixa: o pé da câmera fica a g1 (o
           chão no pé da faixa) mais a metade da sobra antes do começo */
        const g0 = h * cot(fi(s0)), g1 = h * cot(fi(s1)), sobra = (g0 - g1) - (p1 - p0);
        return { ux, uz, d, a: p0 - g1 - sobra / 2 + d * Math.cos(el), b: (q0 + q1) / 2 };
      };
      /* de trás de quem ataca (a rival sobe pela tela até a gente), ou de
         lado, se assim tudo cabe bem mais perto */
      let ux = br.P[0] - H.x, uz = br.P[1] - H.z;
      const l = Math.hypot(ux, uz) || 1;
      ux /= l; uz /= l;
      let v = medir(ux, uz);
      for (const w of [medir(-uz, ux), medir(uz, -ux)]) if (w.d < v.d * 0.85) v = w;
      C().voarPara(br.P[0] + v.ux * v.a - v.uz * v.b, br.P[1] + v.uz * v.a + v.ux * v.b, v.d, el, Math.atan2(-v.ux, -v.uz), 0);
    };
    const enquadrar = () => {
      if (!D || !dia) return;
      dia.seguirBonde(null);
      const Cn = C(), cam = Cn.vida && Cn.vida.camera, retrato = cam ? cam.aspect < 0.95 : innerWidth < innerHeight;
      /* (antes do aviso, a faixa que ele vai deixar) */
      if (retrato) { emPe(cam, [0.5, 0.82]); return; }
      if (porta && D.nosso && D.nosso.porta) {
        const q = D.nosso.porta, az = Math.atan2(q.fx, q.fy);
        C().voarPara(br.P[0] - Math.sin(az) * 5 * M, br.P[1] - Math.cos(az) * 5 * M, 42 * M, 0.85, az, 0);
        return;
      }
      const Q = {};
      br.v.rua.ponto(Math.max(0, br.sV - 10 * M), Q);
      const tx = Q.tx, tz = Q.tz;
      C().voarPara(br.P[0] + tx * 4 * M, br.P[1] + tz * 4 * M, 40 * M, 0.8, Math.atan2(-tx, -tz), 0);
    };
    /* (a briga não desacelera sozinha no meio: o aviso é que para o relógio) */
    br.vista = true;
    const perto = br.tIni - (porta ? 24 : 16), aviso = br.tIni - 1.2, vz = D.vezes;
    rodarAte(Math.max(dia.t, perto), D.vezes, porta ? 'A concentração na porta da sede…' : 'A caminho do estádio…', () => {
      if (!D) return;
      enquadrar();
      /* (a 2× só a chegada: a velocidade do jogador volta depois do aviso) */
      rodarAte(Math.max(dia.t, aviso), 2, porta ? 'A concentração na porta da sede…' : 'O bonde chegando na esquina…', () => {
        if (!D) return;
        D.vezes = vz; pintar();
        status(porta ? `A ${br.a.t.sigla} dobrou a esquina e vem pra porta da sede!` : `A ${br.a.t.sigla} saiu da esquina pra cima do bonde!`, true);
        /* o aviso no alto da tela (a câmera está na briga), até a resposta */
        D.avisoNoAlto = true;
        cont();
        /* no celular em pé, com o aviso posto: a faixa que ele deixou de verdade */
        setTimeout(() => {
          if (!D || !D.avisoNoAlto) return;
          const Cn = C(), cam = Cn && Cn.vida && Cn.vida.camera;
          if (cam && cam.aspect < 0.95) emPe(cam, faixa());
        }, 160);
      });
    });
  }
  /* O AVISO DO ATAQUE (o cartão da linha do dia, main.js): o que o líder
     do bonde diz na hora, com a rival à vista — no lugar do texto do jogo
     de feed ("caiu em cima da nossa concentração… Foi em Concentração") */
  function avisoDoAtaque(ev) {
    if (D && !D.ia && D.arr && ev === D.evArr) {
      const alvo = D.arr.v.t.nome;
      return { voz: `Investida marcada · ${alvo}`, texto: `A gente tá colado no cordão da PM, nos arredores do estádio. A ${alvo} parou do outro lado da grade, na frente dos PMs — é agora.` };
    }
    if (!D || D.ia || !D.briga || ev !== D.evBriga) return null;
    const br = D.briga;
    /* a investida marcada: a gente é quem chega */
    if (br.a === D.nosso) {
      const alvo = br.v.t.nome;
      return br.naPorta ? { voz: `Investida marcada · ${alvo}`, texto: `Chegamos na esquina da sede da ${alvo}. A concentração deles tá toda na porta, antes de sair pro estádio — é agora.` }
                        : { voz: `Investida marcada · ${alvo}`, texto: `A gente tá na ${br.esquina ? 'esquina' : 'transversal'}, escondido, e o bonde da ${alvo} tá vindo pela rua. É agora.` };
    }
    if (br.v !== D.nosso) return null;
    const nome = br.a.t.nome;
    if (br.naPorta) return { voz: `Na porta da sede · ${nome}`,
      texto: `Chefe, a ${nome} dobrou a esquina e tá vindo correndo pra porta da sede! Vão cair em cima da concentração antes da gente sair pro estádio.` };
    return { voz: `Na caminhada · ${nome}`,
      texto: `A ${nome} tava escondida ${br.esquina ? 'na esquina' : 'numa transversal'} e saiu correndo pra cima do bonde! A gente tá a caminho do estádio, no meio da rua.` };
  }
  /* A PARTIDA: o relógio do dia anda com o minuto dela */
  function partida(m) {
    if (!D || D.fundo || !D.plano || !dia || !dia.plano) { partidaSolta(m); return; }
    soltarPartida();
    D.partida = m; D.fase = 'jogo';
    dia.parar(); dia.soTorcidas = true;
    status('Bola rolando. A invasão é com você: o painel mostra por onde a nossa torcida chega no setor rival.');
    pintar();
  }
  function apito() {
    if (!D || D.fundo) { apitoSolto(); return; }
    D.partidaVista = D.partida; D.partida = null; D.apitado = true; D.apitoEm = Date.now();
    status('Fim de jogo.');
    pintar(); pintarPlacar();
    /* O QUE O QUADRO AINDA NÃO FEZ SAI NO APITO (a partida a 4×, o padrão do
       dono de 29/09/2026, dura uns 6 s e o dia fecha uns 2 s depois dela): o
       relógio do dia e o aviso de gol andam por quadro da tela, e na máquina
       lenta o último quadro vinha de antes do fim — o relógio da praça
       recomeçava de uma hora velha e o último gol ficava sem aviso */
    if (dia && dia.plano && D.plano) dia.t = D.plano.bola + DURACAO_S;
    const st = D.j && estadoDoPlacar();
    if (st && st.gols) avisarGols(st.gols, st.ate, D.j.mandante, D.j.visitante);
    if (st) avisarPenaltis(st, D.j.mandante, D.j.visitante);
  }

  /* A PARTIDA SOLTA (sem o dia da cidade): o placar de TV anda sozinho, lendo a
     mensagem, com os gols e a disputa de pênaltis virando aviso como no dia.
     Os clubes vêm do jogo que o itinerário abriu (cores e siglas); sem ele,
     os nomes da mensagem */
  function partidaSolta(m) {
    const d = m && m.dados;
    if (!d) return;
    const j = jogoAberto && jogoAberto.msg === m ? jogoAberto.j : { mandante: { nome: d.casa }, visitante: { nome: d.fora } };
    solta = { j, partida: m, partidaVista: null, apitado: false, golVisto: 0, penAviso: 0, sai: 0, fimVisto: 0 };
    ligarSolta();
  }
  function ligarSolta() {
    if (!soltaLaco) soltaLaco = setInterval(quadroSolto, 250);
    quadroSolto();
  }
  function quadroSolto() {
    if (!solta) { soltarPartida(); return; }
    /* (o nosso dia da cidade abriu: o placar é dele) */
    if (D && !D.fundo) { soltarPartida(); return; }
    const agora = Date.now();
    if (solta.sai && agora >= solta.sai) { soltarPartida(); return; }
    /* A PARTIDA QUE NINGUÉM APITOU: quem apita é o cartão da partida, que roda
       escondido (main.js, widgetPartida) e para se sair da página; sem esta
       rede o placar ficava parado em 90' (ou em PÊN) pra sempre */
    const m = solta.partida, d = m && m.dados;
    if (d) {
      const min = TO.jogoAoVivo ? TO.jogoAoVivo.minuto(d) : null, cb = d.pen && d.pen.cobrancas;
      const serie = cb && cb.length ? (d.penFim || (d.penDesde != null && agora - d.penDesde > (cb.length + 2) * PEN_PASSO_MS)) : true;
      const acabou = m.respondido || (min != null && min >= 90 && !d.pausada && serie);
      if (!acabou) solta.fimVisto = 0;
      else if (!solta.fimVisto) solta.fimVisto = agora;
      else if (agora - solta.fimVisto > 4000) { apitoSolto(); return; }
    }
    pintarPlacar();
    const st = estadoDoPlacar();
    if (st && st.gols) avisarGols(st.gols, st.ate, solta.j.mandante, solta.j.visitante);
    if (st) avisarPenaltis(st, solta.j.mandante, solta.j.visitante);
  }
  function apitoSolto() {
    if (!solta || !solta.partida) return;
    solta.partidaVista = solta.partida; solta.partida = null; solta.apitado = true;
    solta.sai = Date.now() + FICA_MS;
    quadroSolto();
  }
  function soltarPartida() {
    if (soltaLaco) { clearInterval(soltaLaco); soltaLaco = 0; }
    if (!solta) return;
    solta = null;
    /* (o placar só sai se o nosso dia não estiver no ar: aí quem pinta é ele) */
    if (placar && !(D && !D.fundo)) { placar.hidden = true; placarVisto = ''; }
  }

  /* ======================================================
     DEPOIS DA CENA: o resultado entra no dia
     ====================================================== */
  function resultadoDaBriga(br, res) {
    const nosL = res.nossoLado === 'visitante' ? 'Visitante' : 'Mandante', outL = nosL === 'Mandante' ? 'Visitante' : 'Mandante';
    const nos = { f: res['caidos' + nosL] || 0, p: res['presos' + nosL] || 0 }, eles = { f: res['caidos' + outL] || 0, p: res['presos' + outL] || 0 };
    const somosA = br.a === D.nosso;
    return somosA ? { venceA: !!res.ganhamos, ferA: nos.f, presA: nos.p, ferV: eles.f, presV: eles.p }
                  : { venceA: !res.ganhamos, ferA: eles.f, presA: eles.p, ferV: nos.f, presV: nos.p };
  }
  function depoisDaCena(ev, res) {
    if (daEstrada(ev)) { depoisDaEmboscada(res); return; }
    if (!D || !dia || !dia.plano) return;
    D.emCena = false; D.avisoNoAlto = false;
    dia.esconder(false);
    const br = D.briga;
    if (br && ev && ev === D.evBriga && !br.aplicado && res) {
      br.aplicar(resultadoDaBriga(br, res));
      const onde = br.naPorta ? 'na porta da sede' : 'na rua';
      if (D.jogada) { br.vista = true; dia.irPara(Math.max(dia.t, br.tFim + 3)); status(res.ganhamos ? (br.naPorta ? 'Seguramos a porta da sede. Quem ficou de pé sai pro estádio na hora.' : 'Saímos por cima na rua. Seguindo pro estádio.') : `Apanhamos ${onde}. Quem sobrou segue pro estádio.`, !res.ganhamos); }
      else { br.vista = false; dia.irPara(Math.min(dia.t, br.tIni - 10)); dia.rodar(10); status(`A briga ${onde} (o resultado do duelo simulado).`); }
      D.jogada = false;
    }
    /* A BRIGA NO CORDÃO: quem caiu e quem foi preso fica no chão ali, dos dois lados da grade */
    const A = D.arr;
    if (A && ev && ev === D.evArr && !A.aplicado && res) {
      A.aplicar(resultadoDaBriga(A, res));
      if (D.arrJogada) { dia.irPara(Math.max(dia.t, A.tFim + 3)); status(res.ganhamos ? 'Saímos por cima no cordão. Quem ficou de pé segue pro portão.' : 'Apanhamos no cordão. Quem sobrou segue pro portão.', !res.ganhamos); }
      else { dia.irPara(Math.min(dia.t, A.tIni - 10)); dia.rodar(10); status('A briga no cordão da PM (o resultado do duelo simulado).'); }
      D.arrJogada = false;
    }
    if (D.nosso) dia.seguirBonde(D.nosso);
    pintar();
  }
  /* ninguém desceu: a rival bate e a gente não reage (um em dez no chão) */
  function naoDesceu(ev) {
    if (daEstrada(ev)) {
      const R = D.estrada, eu = D, volta = D.viagem.qual === 'volta';
      R.semDescer();
      status(`Ninguém desceu: a ${ev.nome} ficou xingando na beira e a caravana seguiu viagem.`, true);
      R.rodar('fim', () => volta ? chegarEmCasa(eu) : chegarNaCidade(eu, null));
      return;
    }
    if (!D || !dia || !dia.plano) return;
    D.avisoNoAlto = false;
    const br = D.briga;
    if (!br || ev !== D.evBriga || br.aplicado) return;
    const somosA = br.a === D.nosso;
    br.aplicar(somosA ? { venceA: false, ferA: Math.round(br.nA * 0.1) } : { venceA: true, ferV: Math.round(br.nV * 0.1) });
    br.vista = false; dia.irPara(Math.min(dia.t, br.tIni - 10)); dia.rodar(10);
    status(br.naPorta ? 'Ninguém desceu: a rival bateu em quem estava na porta da sede e a gente não reagiu.' : 'Ninguém desceu: a rival bateu e a gente não reagiu.', true);
  }

  /* ======================================================
     AS BRIGAS NO 3D: a da caminhada e a invasão
     ====================================================== */
  /* a briga da caminhada (vida3d.js, palcoDaCaminhada) com o plano do dia: a mesma briga que ele tem */
  function ganchosDaCaminhada(a, v) {
    if (!D || !D.plano || !D.briga) return null;
    const br = D.briga;
    if (br.a.t.id !== a || br.v.t.id !== v) return null;
    D.jogada = true; D.emCena = true; D.avisoNoAlto = false;
    /* (a câmera é da briga: o dia para de seguir o nosso bonde) */
    dia.parar(); dia.seguirBonde(null); dia.esconder(true); dia.ocultarTorcidas([a, v]);
    return { plano: D.plano, comDia: dia.semAsDaBriga([a, v]), aoDesmontar: voltouDoPalco };
  }
  /* A BRIGA NUM PALCO DA CIDADE COM O DIA NO AR que não é a da caminhada
     (a do bar deles, briga_bar.js): o dia para, a câmera é da briga e os
     bondes das torcidas dela somem da rua enquanto ela dura (os bonecos da
     briga são os do combate); no fim, a câmera volta pro nosso bonde */
  function ganchosDaBriga(ids) {
    if (!D || !D.plano || !dia) return null;
    D.emCena = true; D.avisoNoAlto = false;
    dia.parar(); dia.seguirBonde(null); dia.esconder(true); dia.ocultarTorcidas(ids);
    return { comDia: dia.semAsDaBriga(ids), aoDesmontar: voltouDoPalco };
  }
  function voltouDoPalco() {
    if (!D || !dia) return;
    D.emCena = false;
    dia.esconder(false); dia.ocultarTorcidas(null);
    if (D.partida || D.fase === 'jogo') verNossoSetor(); else if (D.nosso) dia.seguirBonde(D.nosso);
  }
  /* os caminhos da invasão da nossa torcida (o mais barato de cada via, com rival do outro lado) */
  function caminhos() {
    if (!D || !D.plano || !D.plano.arq || !D.nosso || !D.plano.arq.caminhosDe) return [];
    const cs = D.plano.arq.caminhosDe(D.nosso, true, true), out = [];
    for (const via of ['arquibancada', 'corredor']) { const c = cs.find(x => x.via === via); if (c) out.push(c); }
    return out;
  }
  function viasDaInvasao(doClima = false) {
    /* uma briga de arquibancada por jogo (a jogada, a simulada, ou o clima tenso que ficou no lugar);
       `doClima`: quem pergunta é o clima tenso, que já marcou a briga aberta */
    const cl = D && D.partida && D.partida.dados && D.partida.dados.clima;
    if (!D || D.invadiu || (!doClima && cl && (cl.brigou || cl.aberto))) return [];
    return caminhos().map(c => ({ via: c.via, rival: c.alvo.b.t.id, nome: c.alvo.b.t.nome, sigla: c.alvo.b.t.sigla }));
  }
  function invadir(via) {
    const v = viasDaInvasao().find(x => x.via === via);
    if (!v || !TO.jogoAoVivo || !TO.jogoAoVivo.invadir) return;
    if (TO.jogoAoVivo.invadir(v)) status(`A nossa torcida vai invadir ${naVia(via)}.`);
  }
  /* A INVASÃO NO PALCO (vida3d.js, palcoDe 'estadio-*' com `invasao3d`) */
  function palcoDaInvasao(cfg) {
    const pedida = cfg && cfg.invasao3d;
    const cs = caminhos(), c = (pedida && cs.find(x => x.via === pedida.via)) || cs[0];
    if (!c || !D.nosso) return null;
    const Cn = C(), ctx = Cn.vida.contextoDoDia();
    let B;
    try { B = cenaDaInvasao(ctx, D.plano, c, { lado: D.nosso.lado }); }
    catch (err) { console.error('a invasão no estádio:', err); return null; }
    if (!B || B.erro) { console.warn('a invasão no estádio não montou:', B && B.erro); return null; }
    TO.dados.cenas[B.cena.id] = B.cena;
    D.ultimaInvasao = B; D.invadiu = true; D.emCena = true;
    const ids = [D.nosso.t.id, c.alvo.b.t.id];
    /* (pela arquibancada, a faixa de cada lado é a do combate, na mureta: a pendurada das duas sai) */
    dia.parar(); dia.seguirBonde(null); dia.esconder(true); dia.ocultarTorcidas(ids, { panos: B.via === 'arquibancada' });
    let grades = null;
    const R = palcoDeBriga({ C: Cn, M, cena: B.cena, noMundo: B.noMundo, doMundo: B.doMundo, u: B.u, v: B.v, eixos: B.eixos, chao: B.chao, escala: B.escala,
      vistas: { perto: { dist: 16, el: 1.0 }, alto: { dist: 32, el: 1.12 } }, rotAlto: 'o isolamento inteiro, do alto',
      semGrades: true, comDia: dia.semAsDaBriga(ids),
      aCadaQuadro: (j, THREE, grupo) => { if (!grades) grades = gradesDaInvasao(ctx, D.plano, B, THREE, grupo); grades.quadro(j); },
      aoLimpar: () => { if (grades) grades.limpar(); grades = null; },
      aoDesmontar: voltouDoPalco });
    pintar();
    return { local: B.cena.id, renderizador: R };
  }
  /* A BRIGA DOS ARREDORES NO PALCO (vida3d.js, palcoDe 'arredores';
     arredores3d.js): a nossa investida no cordão da PM (o nosso dia), ou a
     investida no jogo de outros clubes, no caminho da rival pro portão (o
     jogo da cidade no fundo). O dia para, os bondes das torcidas da briga
     somem da rua (os bonecos dela são os do combate), as grades da PM no
     tabuleiro dão lugar às do combate (que caem) e os PMs são os do cordão */
  function palcoDosArredores(cfg) {
    if (!D || !D.plano || !dia || !dia.plano || !cfg) return null;
    const Cn = C();
    if (!Cn || !Cn.vida || !Cn.vida.contextoDoDia) return null;
    const pl = D.plano, nosso = (cfg.bondes || []).find(b => b.nossa), Q = {};
    const nossoLado = nosso && nosso.lado === 'visitante' ? 'visitante' : 'mandante';
    let o = null, ids = null;
    if (!D.fundo && D.arr && D.arr.v.t.id === cfg.rivalId) {
      const A = D.arr;
      /* (as grades de pé a esta hora: o cordão do corredor que abre pro mandante sai na hora dele) */
      const dePe = q => !(q.abre && pl.tAbre != null && dia.t >= pl.tAbre);
      o = { P: A.P, u: A.u, nosso: { rua: A.a.rua, s: A.sA }, deles: { rua: A.v.rua, s: A.sV }, nossoLado, fundo: false,
            segmentos: pl.pm.cordoes.filter(dePe).concat(pl.pm.fechadas.filter(dePe)).map(q => ({ a: q.a, b: q.b })) };
      ids = [A.a.t.id, A.v.t.id];
    } else if (D.fundo && D.inv && D.inv.onde === 'arredores' && D.inv.alvo.t.id === cfg.rivalId) {
      const I = D.inv;
      I.tr.ponto(Math.max(0, I.tr.L - 2 * M), Q);
      /* (no jogo dos outros a gente não tem lado: o tabuleiro não tem cordão) */
      o = { P: I.P, u: [Q.tx, Q.tz], nosso: { rua: I.tr, s: Math.max(0, I.tr.L - 6 * M), volta: true }, deles: { rua: I.alvo.rua, s: Math.max(0, I.sAlvo - 10 * M) },
            nossoLado, fundo: true, segmentos: [] };
      ids = [I.alvo.t.id];
    }
    if (!o) return null;
    o.pms = ((dia.J && dia.J.policiais) || []).filter(pm => pm.vivo !== false).map(pm => ({ x: pm.x, z: pm.y }));
    const ctx = Cn.vida.contextoDoDia();
    let B;
    try { B = brigaNosArredores(ctx, pl, o); }
    catch (err) { console.error('a briga dos arredores:', err); return null; }
    if (!B || B.erro) { console.warn('a briga dos arredores não montou:', B && B.erro); return null; }
    TO.dados.cenas[B.cena.id] = B.cena;
    D.ultimosArredores = B; D.emCena = true; D.avisoNoAlto = false;
    if (!D.fundo) D.arrJogada = true;
    dia.parar(); dia.seguirBonde(null); dia.esconder(true); dia.ocultarTorcidas(ids);
    B.gradesEscondidas = dia.esconderGrades ? dia.esconderGrades(B.noTabuleiro) : 0;
    let grades = null;
    const R = palcoDeBriga({ C: Cn, M, cena: B.cena, noMundo: B.noMundo, doMundo: B.doMundo, u: B.u, v: B.v, chao: B.chao, escala: B.escala,
      vistas: { perto: { dist: 19, el: 1.08 }, alto: { dist: 40, el: 1.25 } }, rotAlto: o.fundo ? 'a rua deles, do alto' : 'o cordão inteiro, do alto',
      semGrades: true, comDia: dia.semAsDaBriga(ids),
      aCadaQuadro: (j, THREE, grupo) => { if (!grades) grades = gradesDoCordao(ctx, B, THREE, grupo, dia.grade); grades.quadro(j); },
      aoLimpar: () => { if (grades) grades.limpar(); grades = null; },
      aoDesmontar: () => { if (dia && dia.esconderGrades) dia.esconderGrades(null); voltouDoPalco(); } });
    /* (o palco que não sobe — sem WebGL — deixa a briga pra cena da foto: o dia volta como estava) */
    return { local: B.cena.id, renderizador: R, falhou: () => { if (dia && dia.esconderGrades) dia.esconderGrades(null); if (D) D.arrJogada = !D.fundo; voltouDoPalco(); } };
  }

  /* ======================================================
     A CÂMERA E O QUADRO
     ====================================================== */
  function verNossoSetor() {
    if (!D || !dia) return;
    const A = D.plano && D.plano.arq, T = A && D.nosso && A.porBonde.get(D.nosso);
    dia.seguirBonde(null);
    if (!T) { dia.verEstadio(); return; }
    const P0 = T.vaga.find(Boolean);
    if (!P0) { dia.verEstadio(); return; }
    /* do campo, olhando a torcida na arquibancada (a faixa na mureta, os bandeirões, o puxador) */
    const c = D.plano.centroEst, az = Math.atan2(c[0] - P0[0], c[2] - P0[2]);
    C().voarPara(P0[0], P0[2], 36 * M, 0.42, az, P0[1]);
  }
  let ultimo = 0, antesQ = 0;
  function quadro(agora) {
    laco = 0;
    if (!D) return;
    laco = requestAnimationFrame(quadro);
    const dtq = antesQ ? Math.min(0.25, Math.max(0, (agora - antesQ) / 1000)) : 0.016;
    antesQ = agora;
    /* na estrada: a hora da viagem e a praça da vez no painel */
    if (D.estrada) { if (agora - ultimo > 200) { ultimo = agora; pintarEstrada(); } return; }
    if (!dia || !dia.plano) return;
    /* o jogo da cidade no fundo: o relógio é o da vida da praça (a luz é dela) */
    if (D.fundo) {
      quadroFundo();
      if (D && agora - ultimo > 200) { ultimo = agora; pintarPlacar(); }
      return;
    }
    /* a partida: o relógio do dia é o minuto dela (a bola, mais o que rolou) */
    if (D.partida && TO.jogoAoVivo && D.partida.dados) {
      const min = TO.jogoAoVivo.minuto(D.partida.dados);
      /* (com o intervalo: o segundo tempo começa 15 minutos depois do fim do primeiro) */
      if (min != null) dia.t = D.plano.bola + min * 60 + (min > 45 ? INTERVALO_S : 0);
    }
    if (D.corrida && dia.t >= D.corrida.alvo) terminarCorrida();
    /* a luz da hora do dia */
    const h = dia.t / 3600;
    if (luzVista == null || Math.abs(h - luzVista) > 0.01) { luzVista = h; const Cn = C(); if (Cn && Cn.vida) Cn.vida.hora(h); }
    if (agora - ultimo > 200) {
      ultimo = agora; pintarHora(); pintarFases(); pintarPlacar();
      const st = D.j && estadoDoPlacar();
      if (st && st.gols) avisarGols(st.gols, st.ate, D.j.mandante, D.j.visitante);
      if (st) avisarPenaltis(st, D.j.mandante, D.j.visitante);
      if (D.partida && !D.invadiu) { const n = viasDaInvasao().length, i = hud && hud.querySelector('.j3d-dia-invadir'); if (i && i.hidden === !!n) pintar(); }
    }
  }

  /* ======================================================
     FECHAR: o dia sai da cidade e a praça volta a ser a do jogador
     ====================================================== */
  function fechar() {
    if (!D) return;
    const eraFundo = !!D.fundo, tDia = dia && dia.plano ? dia.t : null, estrada = D.estrada;
    /* O RESULTADO FICA NA TELA: o dia fecha uns 2 s depois do apito, e o placar
       (com quem passou nos pênaltis) ia junto — agora ele vira a partida solta e
       fica até FICA_MS depois do apito. A partida que ainda rola quando o dia
       cai (a placa de vídeo perdeu o contexto) segue no placar do mesmo jeito.
       Na volta pela estrada, não: o alto da tela é dela */
    if (!eraFundo && !estrada && D.j && (D.partida || D.apitado)) {
      solta = { j: D.j, partida: D.partida, partidaVista: D.partidaVista, apitado: !!D.apitado, golVisto: D.golVisto || 0, penAviso: D.penAviso || 0,
                sai: D.apitado ? (D.apitoEm || Date.now()) + FICA_MS : 0, fimVisto: 0 };
    }
    D = null;
    if (estrada) estrada.desmontar();
    soltarEspera();
    if (laco) { cancelAnimationFrame(laco); laco = 0; }
    luzVista = null; antesQ = 0; fasesVistas = ''; placarVisto = '';
    const Cn = C();
    if (Cn && Cn.vida) { Cn.vida.extras = []; }
    if (dia) { dia.soTorcidas = false; dia.esconder(false, true); dia.sair(); }
    if (Cn && Cn.vida) Cn.vida.diaNoFundo = false;
    if (hud) hud.hidden = true;
    if (solta) ligarSolta(); else if (placar) placar.hidden = true;
    for (const m of document.querySelectorAll('.j3d-dia-modal')) m.remove();
    if (eraFundo) return;
    /* O NOSSO DIA DE JOGO: o dia da praça segue da hora em que ele acabou
       (o que passou lá passou aqui: a volta pra sede é depois do apito) */
    if (tDia != null && vida.relogio && vida.relogio.definir) vida.relogio.definir(Math.max(vida.relogio.minuto, Math.min(23 * 60, Math.round(tDia / 60))));
    if (TO.tela && TO.tela.retomarTempo) TO.tela.retomarTempo('jogo-praca');
    if (g.travarPraca) g.travarPraca(false);
  }

  /* A CIDADE FOI REFEITA POR BAIXO DO DIA (a placa de vídeo perdeu o
     contexto e a praça remontou: cenario.js, jogo3d.js): o plano do dia
     não sobrevive à montagem, que limpa o dia da cidade — ele sai do ar e a
     linha segue como sempre, sem a cidade em 3D. Medido, sem isto: a linha
     ficava em "a caminho · na cidade" pra sempre, com o relógio preso
     pelo "itinerario" */
  function cidadeRefeita() {
    if (!D) return;
    const c = D.pendente;
    D.pendente = null;
    fechar();
    if (c) c();
  }

  /* QUEM FALA COM O JOGADOR NO DIA DE JOGO (os recados em balão,
     recados3d.js): o líder do nosso bonde — o balão fica em cima do nome
     do bonde (o rótulo anda com o líder, mais alto na arquibancada, por
     causa do bandeirão; ele some e volta com a arrumação dos rótulos, mas
     a posição é sempre a do líder), ou da cabeça dele sem o rótulo */
  const PF = {};
  function falante() {
    if (!D || D.fundo || !D.plano || !D.nosso || D.emCena || D.avisoNoAlto || !dia || !dia.plano) return null;
    const b = D.nosso, d = b.gente && b.gente[0] && b.gente[0].d;
    if (!d) return null;
    const r = b.rotulo ? b.rotulo.position : null;
    if (r) { PF.x = r.x; PF.y = r.y + 0.9 * M; PF.z = r.z; }
    else { PF.x = d.x; PF.y = (d.alt || 0) + 2.1 * M; PF.z = d.y; }
    return PF;
  }
  /* a câmera no nosso bonde (na partida, o nosso setor) */
  function verNossa() {
    if (D && D.estrada) { D.estrada.verOnibus(); return; }
    if (!D || !dia || !D.nosso) return;
    if (D.partida || D.fase === 'jogo') verNossoSetor(); else dia.seguirBonde(D.nosso);
  }

  return {
    abrir, fase, partida, apito, depoisDaCena, naoDesceu, fechar, abrirJogoDaCidade, brigaRegistrada,
    ganchosDaCaminhada, ganchosDaBriga, palcoDaInvasao, palcoDosArredores, viasDaInvasao, verNossa, avisoDoAtaque, jogoNoFundo,
    antesDaBriga, brigaNaEstrada, cidadeRefeita,
    /* a caravana ainda na estrada (ou a cidade do jogo montando na chegada): a linha espera */
    get naEstrada() { return naEstrada(); },
    quandoChegar(f) { if (typeof f === 'function') esperas.push(f); },
    get falante() { return falante(); },
    /* o NOSSO dia de jogo no ar (o jogo da cidade no fundo não conta: a vida da praça segue) */
    get ativo() { return !!(D && !D.fundo && ((D.plano && dia && dia.plano) || D.estrada)); },
    /* o jogo da cidade no fundo hoje (o relógio da vida não pula o dia) */
    get jogoNoFundoHoje() { return jogoNoFundoHoje(); },
    get montandoNoFundo() { return !!(D && D.fundo && !D.plano); },
    get jogoDaCidade() { return false; },
    get montando() { return !!D && !D.fundo && !D.plano; },
    /* (na estrada, a hora da viagem: o relógio de cima anda com o da faixa) */
    get hora() {
      if (D && !D.fundo && D.estrada) return (((D.estrada.minuto % 1440) + 1440) % 1440) * 60;
      return D && !D.fundo && dia && dia.plano ? dia.t : null;
    },
    /* o nosso bonde ainda longe do portão (a briga da ida atrasou a caminhada) */
    get nossoNaRua() { return !!(D && D.nosso && dia && dia.plano && dia.t < D.nosso.chega - 20); },
    /* pro teste */
    get estado() {
      if (!D) return null;
      const b = D.nosso;
      if (D.estrada) return { estrada: D.estrada.estado, viagem: D.viagem ? { qual: D.viagem.qual, cidades: D.viagem.cidades.map(c => c.nome), emb: D.viagem.emb ? { i: D.viagem.emb.i, tipo: D.viagem.emb.tipo, nome: D.viagem.emb.nome } : null } : null,
                              naEstrada: naEstrada(), fase: D.fase, fora: D.fora, praca: D.nome, emCena: !!D.emCena, plano: !!D.plano };
      const I = D.inv;
      return { ia: !!D.ia, fundo: !!D.fundo, minuto: D.minuto, placar: D.placar, reg: D.reg ? { a: D.reg.a.nome, b: D.reg.b.nome, ganhouA: D.reg.ganhouA } : null,
               janela: D.fundo ? { t0: D.t0 != null ? hhmm(D.t0) : null, t1: D.t1 != null ? hhmm(D.t1) : null } : null,
               investida: I ? { alvo: I.alvo.t.sigla, onde: I.onde, fase: I.fase, enc: hhmm(I.tEnc), sai: hhmm(I.tSai), m: Math.round(I.tr.L / M), n: I.gente.length } : null,
               placarTV: placar && !placar.hidden ? placar.textContent.replace(/\s+/g, ' ').trim() : null,
               praca: D.nome, fora: D.fora, fase: D.fase, hora: dia && dia.plano ? hhmm(dia.t) : null, t: dia && dia.plano ? dia.t : null, corrida: D.corrida ? hhmm(D.corrida.alvo) : null,
               plano: !!D.plano, nosso: b ? { sigla: b.t.sigla, n: b.n, naRua: b.naRua, inicio: b.inicio.tipo + (b.inicio.t ? ':' + b.inicio.t.sigla : ''), lado: b.lado, setor: b.setor, estado: dia.estadoDo(b, 0) } : null,
               briga: D.briga ? { a: D.briga.a.t.sigla, v: D.briga.v.t.sigla, ini: hhmm(D.briga.tIni), aplicada: !!D.briga.aplicado, venceA: D.briga.venceA } : null,
               arredores: D.arr ? { a: D.arr.a.t.sigla, v: D.arr.v.t.sigla, ini: hhmm(D.arr.tIni), fim: hhmm(D.arr.tFim), aplicada: !!D.arr.aplicado, venceA: D.arr.venceA,
                                    caemA: D.arr.caemA || 0, caemV: D.arr.caemV || 0 } : null,
               tabuleiroArredores: D.ultimosArredores ? { id: D.ultimosArredores.cena.id, local: D.ultimosArredores.cena.local, grades: D.ultimosArredores.cena.grades.map(x => x.modulos),
                                                          pm: D.ultimosArredores.cena.pmPostos.length, spawns: D.ultimosArredores.cena.spawns.map(x => x.id + ':' + x.x + ',' + x.y),
                                                          entradas: D.ultimosArredores.cena.entradas.map(x => x.id + ':' + x.x + ',' + x.y), escondidas: D.ultimosArredores.gradesEscondidas } : null,
               vias: viasDaInvasao(), invadiu: D.invadiu, partida: !!D.partida, emCena: !!D.emCena,
               invasao: D.ultimaInvasao ? { via: D.ultimaInvasao.via, rival: D.ultimaInvasao.rival, grades: D.ultimaInvasao.cena.grades.map(x => x.modulos), pm: D.ultimaInvasao.cena.pmPostos.length } : null };
    },
    /* (pro teste: a partida solta, sem o dia da cidade ou com o resultado ficando na tela) */
    get solta() { return solta ? { partida: !!solta.partida, apitado: solta.apitado, fica: solta.sai ? Math.max(0, solta.sai - Date.now()) : null, clubes: [solta.j.mandante.nome, solta.j.visitante.nome] } : null; },
    get dia() { return dia; }, get plano() { return D && D.plano; }
  };
}
