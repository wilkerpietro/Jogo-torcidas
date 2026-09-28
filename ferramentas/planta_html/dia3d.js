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
   ========================================================= */
import { cenaDaInvasao, gradesDaInvasao } from './invasao.js';
import { palcoDeBriga } from './palco_briga.js';

const VEZES = [1, 10, 30, 60];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const segDe = hora => { const m = /^(\d\d?):(\d\d)/.exec(String(hora || '')); return m ? (+m[1] * 60 + +m[2]) * 60 : 16 * 3600; };
const hhmm = s => { const m = Math.floor(s / 60 + 1e-6); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = () => new Promise(r => requestAnimationFrame(() => r()));
const naVia = v => v === 'corredor' ? 'pelo corredor' : 'pela arquibancada';

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
    hud.innerHTML = `<div class="j3d-dia-topo"><b class="j3d-dia-hora">--:--</b><span class="j3d-dia-fase"></span></div>
      <p class="j3d-dia-estado"></p>
      <div class="j3d-dia-bts">
        <span class="j3d-dia-vezes" role="group" aria-label="Velocidade do dia">${VEZES.map(v => `<button data-vezes="${v}">${v}×</button>`).join('')}</span>
        <button data-dia="pular" title="Pula até o próximo ponto do dia">Pular ▸▸</button>
        <button data-dia="nossa" title="A câmera vai atrás do nosso bonde">Nossa torcida</button>
        <button data-dia="estadio" title="A câmera no estádio">Estádio</button>
        <button data-dia="plano" title="O dia inteiro, de cima">Cidade</button>
        <button data-dia="sair" class="acao" title="Fecha o jogo da cidade e volta pra sede" hidden>Voltar pra sede</button>
      </div>
      <div class="j3d-dia-invadir" hidden></div>`;
    document.body.appendChild(hud);
    hud.addEventListener('click', ev => {
      const b = ev.target.closest('button');
      if (!b || !D || !dia) return;
      if (b.dataset.vezes) { D.vezes = +b.dataset.vezes; if (dia.rodando) dia.rodar(D.vezes); pintar(); return; }
      const a = b.dataset.dia;
      if (a === 'pular') pular();
      else if (a === 'sair') fechar();
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
    if (!hud || !D) return;
    hud.hidden = false;
    const f = D.ia ? ({ ida: 'As torcidas a caminho', jogo: 'O jogo', volta: 'Fim de jogo' }[D.fase] || 'Jogo da cidade')
      : ({ ida: D.fora ? 'Caravana · ida' : 'Ida ao estádio', jogo: 'O jogo', volta: 'Volta' }[D.fase] || 'Dia de jogo');
    hud.querySelector('.j3d-dia-fase').textContent = `${D.titulo} · ${f}`;
    for (const o of hud.querySelectorAll('[data-vezes]')) o.setAttribute('aria-pressed', String(+o.dataset.vezes === D.vezes));
    hud.querySelector('[data-dia="pular"]').disabled = !D.corrida && !(D.ia && D.fase === 'jogo' && D.minuto < FIM_DO_JOGO);
    /* no jogo da cidade quem volta é o jogador (a linha do dia não manda nele);
       a "nossa torcida" é a aliada que a gente hospedou, quando tem */
    hud.querySelector('[data-dia="sair"]').hidden = !D.ia;
    const bn = hud.querySelector('[data-dia="nossa"]');
    bn.hidden = !D.nosso;
    bn.textContent = D.ia && D.nosso ? `A ${D.nosso.t.sigla}` : 'Nossa torcida';
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

  /* ======================================================
     ABRIR: a praça do jogo, o início do visitante e o plano
     ====================================================== */
  async function abrir(o) {
    if (D) fechar();
    const e = E(), it = o && o.it, j = it && it.jogo;
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
    try {
      if (!await esperarPraca(nome, eu)) return false;
      dia = await C().vida.diaDeJogo();
      if (D !== eu) return false;
      const ini = D.fora ? await escolherInicio(e, j) : null;
      if (D !== eu) return false;
      status('A PM montando o plano do dia…');
      await espera(); await espera();
      const esc0 = escolhaDoDia(e, j, o.msg, it, ini);
      const p = dia.jogo(esc0);
      if (!p || p.erro) throw new Error(p && p.erro ? p.erro : 'o plano do dia não montou');
      D.plano = p; D.nosso = p.doJogador || null; D.escolha = esc0;
      D.briga = esc0.briga && p.brigas && p.brigas[0] && p.brigas[0].a.t.id === esc0.briga.a && p.brigas[0].v.t.id === esc0.briga.v ? p.brigas[0] : null;
      D.evBriga = D.briga ? esc0.briga.ev : null;
      /* o dia começa um pouco antes de o primeiro bonde sair */
      dia.parar(); dia.irPara(p.inicio);
      if (D.nosso) dia.seguirBonde(D.nosso); else dia.verPlano();
      if (!laco) laco = requestAnimationFrame(quadro);
      status(D.nosso ? inicioTxt(D.nosso) : 'A nossa torcida não entrou no plano do dia (sem rota até o estádio).');
      pintar();
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
      /* montando a mesma praça (a remontagem da sede ou dos bares): só espera */
      if (Cn.praca !== nome || !Cn.montando) await api.abrirPraca(nome);
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
  function escolhaDoDia(e, j, msg, it, ini) {
    const meu = e.torcida.clubeId, casa = j.casa ? meu : j.advId, fora = j.casa ? j.advId : meu;
    const pres = ((msg && msg.dados && msg.dados.presenca) || []).filter(p => p && p.id && p.n > 0).map(p => ({ id: p.id, n: p.n }));
    const aj = ini && ini.aj;
    const nosso = { id: e.torcida.id, n: it.efetivo ? it.efetivo.nos : null, inicio: ini ? ini.inicio : 'sede',
                    aliado: aj ? aj.aliado : null, nivel: aj ? (aj.nivel === 'hospedar' ? 'hospedar' : 'escolta') : null, escolta: aj ? aj.escolta || 0 : 0 };
    const briga = brigaDaIda(it, e);
    return { jogo: true, casa, fora, bola: segDe(j.hora), presenca: pres.length ? pres : null, nosso, ia: 'paz', estadio: 'nao', gente: 1,
             /* em casa, quem recebe os visitantes de fora é o que o jogo diz (o aliado que a gente hospeda sai da nossa porta) */
             hospedes: j.casa ? hospedesDoJogo(e, casa, fora) : null,
             briga: briga ? { a: briga.a, v: briga.v, onde: briga.onde, ev: briga.ev } : null };
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
     O JOGO DA CIDADE (o jogo 3D, 28/09/2026; o dono: "os demais jogos na
     cidade entre times IA tem dia de jogo normalmente, com as torcidas
     brigando ou não entre elas"). O jogo de dois outros clubes na nossa
     praça: o recado do olheiro (jogo3d.js) pergunta se o jogador quer ver
     e, vendo, a cidade monta o dia do jogo como o nosso — os bondes das
     torcidas dos dois clubes saindo das sedes (e da casa de quem as
     recebe: o aliado que a gente hospeda sai da NOSSA porta, com a nossa
     escolta quando ela vai junto), a PM, a revista, a arquibancada e a
     partida. A BRIGA É A DO JOGO: o mundo já sorteou, no começo do dia,
     se as torcidas se pegam (js/mundo/relacoes.js, `brigasDeHoje`, na
     aba Brigas das Notícias); tendo briga entre duas do jogo, ela
     acontece na rua, no caminho do atacado, com o resultado de lá
     (quem ganhou, e a proporção de feridos e presos de cada lado); sem
     briga, todas vão em paz. O tempo do jogo fica parado enquanto o dia
     da cidade está no ar, e o placar é o da rodada. Ninguém invade: a
     invasão é só da nossa torcida, e ela não está no jogo
     ====================================================== */
  const FIM_DO_JOGO = 96;
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
  /* o placar da rodada (o jogo é jogado no começo do dia: `jogarDia`) */
  function placarDoJogo(e, casaId, visId) {
    for (const comp of (e.temporada && e.temporada.competicoes) || [])
      for (const etapa of [...(comp.rodadas || []), ...(comp.mata || [])])
        for (const j of etapa.jogos || [])
          if (j.c === casaId && j.f === visId && (j.s || etapa.semana) === e.data.semana && j.gc != null) return { gc: j.gc, gf: j.gf, comp: comp.nome };
    return null;
  }
  /* os gols, nos minutos (o jogo do mundo não guarda o minuto: sai fixo do par) */
  function golsDoJogo(pl, casaId, visId, e) {
    if (!pl) return [];
    const gols = [], h = txt => { let x = 2166136261; for (let i = 0; i < txt.length; i++) { x ^= txt.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x; };
    for (let k = 0; k < pl.gc; k++) gols.push({ min: 3 + h(`gol|${casaId}|${visId}|c|${k}|${e.data.semana}`) % 88, lado: 'c' });
    for (let k = 0; k < pl.gf; k++) gols.push({ min: 3 + h(`gol|${casaId}|${visId}|f|${k}|${e.data.semana}`) % 88, lado: 'f' });
    return gols.sort((a, b) => a.min - b.min);
  }
  async function abrirJogoDaCidade(m) {
    const e = E(), d = m && m.dados;
    if (!e || !e.torcida || !d || D) return false;
    const Mu = TO.mundo, casa = Mu && Mu.time(d.casa), vis = Mu && Mu.time(d.vis);
    const Cn = C();
    if (!casa || !vis || !Cn || !Cn.vida || !Cn.vida.diaDeJogo) return false;
    const nome = nomeDaPraca(e.torcida.mapa);
    if (!nome) return false;
    const eu = D = { ia: true, msg: m, e, fora: false, nome, fase: null, vezes: 30, corrida: null, partida: null, invadiu: true,
                     titulo: `${casa.nome} × ${vis.nome}`, casa, vis, hora: d.hora || '16:00', minuto: null, gols: [], placar: null };
    montarHud(); pintar();
    status('A PM montando o plano do dia…');
    /* o tempo do jogo espera o dia da cidade */
    if (TO.tela && TO.tela.pausarTempo) TO.tela.pausarTempo('jogo-praca');
    if (g.travarPraca) g.travarPraca(true);
    vida.desligar();
    try {
      if (!await esperarPraca(nome, eu)) return false;
      dia = await C().vida.diaDeJogo();
      if (D !== eu) return false;
      await espera(); await espera();
      const reg = brigaRegistrada(e, casa, vis);
      const pres = presencaDoJogo(e, casa.id, vis.id);
      /* a praça (a concentração do atacado) ou a rua (o caminho dele): fixo pro registro */
      const onde = reg && ((reg.a.n || 0) + (reg.b.n || 0)) % 3 === 0 ? 'praca' : 'rua';
      const esc0 = { jogo: true, casa: casa.id, fora: vis.id, bola: segDe(D.hora), presenca: pres.length ? pres : null, ia: 'paz', estadio: 'nao', gente: 1,
                     hospedes: hospedesDoJogo(e, casa.id, vis.id), briga: reg ? { a: reg.a.id, v: reg.b.id, onde } : null };
      let p = dia.jogo(esc0);
      /* (a briga que não achou lugar no mapa não derruba o dia: ele monta em paz) */
      if ((!p || p.erro) && esc0.briga) { esc0.briga = null; p = dia.jogo(esc0); }
      if (!p || p.erro) throw new Error(p && p.erro ? p.erro : 'o plano do dia não montou');
      D.plano = p; D.escolha = esc0; D.reg = reg;
      /* a "nossa" aqui é a aliada que a gente hospeda (o bonde dela sai da nossa porta) */
      D.nosso = p.vivos.find(b => b.anfitriao && b.anfitriao.doJogador && b.inicio.tipo === 'aliado') || null;
      D.briga = reg && p.brigas && p.brigas[0] && p.brigas[0].a.t.id === reg.a.id && p.brigas[0].v.t.id === reg.b.id ? p.brigas[0] : null;
      /* o resultado é o do mundo: quem ganhou e a proporção de feridos e presos de cada lado */
      if (D.briga) {
        const br = D.briga, fr = (x, n) => (x || 0) / Math.max(1, n || 1);
        br.aplicar({ venceA: !!reg.ganhouA, ferA: fr(reg.a.feridos, reg.a.n) * br.nA, presA: fr(reg.a.presos, reg.a.n) * br.nA,
                     ferV: fr(reg.b.feridos, reg.b.n) * br.nV, presV: fr(reg.b.presos, reg.b.n) * br.nV });
      }
      D.placar = placarDoJogo(e, casa.id, vis.id);
      D.gols = golsDoJogo(D.placar, casa.id, vis.id, e);
      dia.parar(); dia.irPara(p.inicio);
      if (D.nosso) dia.seguirBonde(D.nosso); else dia.verPlano();
      if (!laco) laco = requestAnimationFrame(quadro);
      correrJogoDaCidade();
      return true;
    } catch (err) {
      console.error('jogo da cidade 3D:', err);
      if (D === eu) {
        status('O jogo da cidade não montou em 3D: ' + err.message, true);
        const d0 = D;
        setTimeout(() => { if (D === d0) fechar(); }, 3500);
      }
      return false;
    }
  }
  /* o dia do jogo da cidade, sozinho: a ida (a briga, se tem, a cidade
     mostra a 1×), a entrada, a partida (o relógio do dia anda com o minuto
     dela, e o placar sai nos gols) e o fim — aí o jogador volta pra sede */
  function correrJogoDaCidade() {
    if (!D || !D.ia || !D.plano) return;
    const pl = D.plano, hosp = D.nosso;
    D.fase = 'ida';
    const br = D.briga;
    const ida = br ? `A caminho do estádio. A ${br.a.t.sigla} e a ${br.v.t.sigla} estão na rua…`
      : hosp ? `A ${hosp.t.sigla} sai da nossa sede${hosp.escolta ? ` com ${hosp.escolta.membros} dos nossos de escolta` : ''} pro estádio.`
      : 'As torcidas saindo pro estádio.';
    const fimIda = Math.max(pl.inicio, br ? br.tFim + 20 : 0);
    /* a câmera larga quem ela segue e vai pro ponto da briga (a cidade mostra ela a 1×) */
    const naBriga = () => {
      if (!D || !D.ia) return;
      dia.seguirBonde(null);
      C().voarPara(br.P[0], br.P[1], 38 * M, 0.9, undefined, 0);
      status(`A ${br.a.t.sigla} caiu em cima da ${br.v.t.sigla}!`, true);
      rodarAte(fimIda, D.vezes, null, entrar);
    };
    const entrar = () => {
      if (!D || !D.ia) return;
      if (br) status(br.venceA ? `A ${br.a.t.sigla} levou a melhor em cima da ${br.v.t.sigla}.` : `A ${br.v.t.sigla} segurou a ${br.a.t.sigla} e saiu por cima.`, false);
      const alvo = Math.max(dia.t, Math.min(pl.bola - 60, tudoNoLugar() + 15));
      rodarAte(alvo, 60, br ? null : 'As torcidas entrando no estádio…', () => { if (D && D.ia) comecarPartida(); });
    };
    if (br) rodarAte(Math.max(pl.inicio + 1, br.tIni - 7), D.vezes, ida, naBriga);
    else { status(ida); rodarAte(Math.max(pl.inicio + 1, Math.min(pl.bola - 60, tudoNoLugar() + 15)), D.vezes, null, () => { if (D && D.ia) comecarPartida(); }); }
    pintar();
  }
  function comecarPartida() {
    D.fase = 'jogo'; D.minuto = 0; D.vezes = 60; D.golVisto = 0;
    dia.parar(); dia.soTorcidas = true;
    verNossoSetor();
    status(`Bola rolando: ${D.casa.nome} × ${D.vis.nome}.`);
    pintar();
  }
  function placarTxt(ate) {
    let c = 0, f = 0;
    for (const gl of D.gols) if (gl.min <= ate) { if (gl.lado === 'c') c++; else f++; }
    return `${D.casa.nome} ${c} × ${f} ${D.vis.nome}`;
  }
  function andarPartida(dtReal) {
    if (!D || !D.ia || D.fase !== 'jogo' || D.minuto == null) return;
    /* a 60× um minuto de jogo por segundo; o intervalo passa num instante */
    D.minuto = Math.min(FIM_DO_JOGO, D.minuto + dtReal * D.vezes / 60);
    dia.t = D.plano.bola + D.minuto * 60 + (D.minuto > 45 ? 15 * 60 : 0);
    while (D.golVisto < D.gols.length && D.gols[D.golVisto].min <= D.minuto) {
      const gl = D.gols[D.golVisto++];
      status(`${Math.round(gl.min)}' — gol do ${gl.lado === 'c' ? D.casa.nome : D.vis.nome}! ${placarTxt(gl.min)}`);
    }
    if (D.minuto >= FIM_DO_JOGO) acabouPartida();
  }
  function acabouPartida() {
    D.fase = 'volta'; D.minuto = FIM_DO_JOGO;
    const pl = D.placar;
    status(pl ? `Fim de jogo: ${D.casa.nome} ${pl.gc} × ${pl.gf} ${D.vis.nome}. As torcidas saindo — é só voltar pra sede.` : 'Fim de jogo. As torcidas saindo — é só voltar pra sede.');
    pintar();
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
    /* no jogo da cidade, com a bola rolando: o apito final */
    if (D && D.ia && D.fase === 'jogo') {
      D.minuto = FIM_DO_JOGO; D.golVisto = D.gols.length;
      dia.t = D.plano.bola + (FIM_DO_JOGO + 15) * 60;
      acabouPartida();
      return;
    }
    if (!D || !D.corrida) return;
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
    if (!D || !D.plano || !dia || !dia.plano) { cont(); return; }
    const pl = D.plano, nosso = D.nosso;
    D.fase = p.jogo ? 'jogo' : p.id === 'volta' ? 'volta' : 'ida';
    pintar();
    if (D.fase === 'ida') {
      const ev = (p.eventos || [])[0];
      if (ev && D.briga && ev === D.evBriga) {
        const br = D.briga, somosA = br.a === nosso;
        rodarAte(br.tIni - 7, D.vezes, somosA ? `A caminho da tocaia contra a ${br.v.t.sigla}…` : 'A caminho do estádio…', () => {
          dia.seguirBonde(null);
          C().voarPara(br.P[0], br.P[1], 38 * M, 0.9, undefined, 0);
          status(somosA ? `A ${br.v.t.sigla} está chegando no ponto.` : `A ${br.a.t.sigla} caiu em cima da gente!`, !somosA);
          cont();
        });
        return;
      }
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
      const alvo = Math.max(dia.t, Math.min(pl.bola - 60, tudoNoLugar() + 15));
      rodarAte(alvo, 60, 'As torcidas entrando no estádio…', () => { status('A bola vai rolar.'); verNossoSetor(); cont(); });
      return;
    }
    status('Fim de jogo: as torcidas saindo.');
    cont();
  }
  /* A PARTIDA: o relógio do dia anda com o minuto dela */
  function partida(m) {
    if (!D || !D.plano) return;
    D.partida = m; D.fase = 'jogo';
    dia.parar(); dia.soTorcidas = true;
    status('Bola rolando. A invasão é com você: o painel mostra por onde a nossa torcida chega no setor rival.');
    pintar();
  }
  function apito() {
    if (!D) return;
    D.partida = null;
    status('Fim de jogo.');
    pintar();
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
    if (!D || !dia || !dia.plano) return;
    D.emCena = false;
    dia.esconder(false);
    const br = D.briga;
    if (br && ev && ev === D.evBriga && !br.aplicado && res) {
      br.aplicar(resultadoDaBriga(br, res));
      if (D.jogada) { br.vista = true; dia.irPara(Math.max(dia.t, br.tFim + 3)); status(res.ganhamos ? 'Saímos por cima na rua. Seguindo pro estádio.' : 'Apanhamos na rua. Quem sobrou segue pro estádio.', !res.ganhamos); }
      else { br.vista = false; dia.irPara(Math.min(dia.t, br.tIni - 10)); dia.rodar(10); status('A briga na rua (o resultado do duelo simulado).'); }
      D.jogada = false;
    }
    if (D.nosso) dia.seguirBonde(D.nosso);
    pintar();
  }
  /* ninguém desceu: a rival bate e a gente não reage (um em dez no chão) */
  function naoDesceu(ev) {
    if (!D || !dia || !dia.plano) return;
    const br = D.briga;
    if (!br || ev !== D.evBriga || br.aplicado) return;
    const somosA = br.a === D.nosso;
    br.aplicar(somosA ? { venceA: false, ferA: Math.round(br.nA * 0.1) } : { venceA: true, ferV: Math.round(br.nV * 0.1) });
    br.vista = false; dia.irPara(Math.min(dia.t, br.tIni - 10)); dia.rodar(10);
    status('Ninguém desceu: a rival bateu e a gente não reagiu.', true);
  }

  /* ======================================================
     AS BRIGAS NO 3D: a da caminhada e a invasão
     ====================================================== */
  /* a briga da caminhada (vida3d.js, palcoDaCaminhada) com o plano do dia: a mesma briga que ele tem */
  function ganchosDaCaminhada(a, v) {
    if (!D || !D.plano || !D.briga) return null;
    const br = D.briga;
    if (br.a.t.id !== a || br.v.t.id !== v) return null;
    D.jogada = true; D.emCena = true;
    /* (a câmera é da briga: o dia para de seguir o nosso bonde) */
    dia.parar(); dia.seguirBonde(null); dia.esconder(true); dia.ocultarTorcidas([a, v]);
    return { plano: D.plano, comDia: dia.semAsDaBriga([a, v]), aoDesmontar: voltouDoPalco };
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
    dia.parar(); dia.seguirBonde(null); dia.esconder(true); dia.ocultarTorcidas(ids);
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
    if (!dia || !dia.plano) return;
    /* o jogo da cidade: o relógio do dia é o minuto da partida */
    if (D.ia) andarPartida(dtq);
    /* a partida: o relógio do dia é o minuto dela (a bola, mais o que rolou) */
    if (D.partida && TO.jogoAoVivo && D.partida.dados) {
      const min = TO.jogoAoVivo.minuto(D.partida.dados);
      if (min != null) dia.t = D.plano.bola + min * 60;
    }
    if (D.corrida && dia.t >= D.corrida.alvo) terminarCorrida();
    /* a luz da hora do dia */
    const h = dia.t / 3600;
    if (luzVista == null || Math.abs(h - luzVista) > 0.01) { luzVista = h; const Cn = C(); if (Cn && Cn.vida) Cn.vida.hora(h); }
    if (agora - ultimo > 200) { ultimo = agora; pintarHora(); if (D.partida && !D.invadiu) { const n = viasDaInvasao().length, i = hud && hud.querySelector('.j3d-dia-invadir'); if (i && i.hidden === !!n) pintar(); } }
  }

  /* ======================================================
     FECHAR: o dia sai da cidade e a praça volta a ser a do jogador
     ====================================================== */
  function fechar() {
    if (!D) return;
    const eraIa = D.ia, tDia = dia && dia.plano ? dia.t : null;
    D = null;
    if (laco) { cancelAnimationFrame(laco); laco = 0; }
    luzVista = null; antesQ = 0;
    if (dia) { dia.soTorcidas = false; dia.sair(); }
    if (hud) hud.hidden = true;
    for (const m of document.querySelectorAll('.j3d-dia-modal')) m.remove();
    /* o jogo da cidade: o dia da praça segue da hora em que ele acabou
       (o que passou lá passou aqui), e o tempo do jogo volta a andar */
    if (eraIa) {
      if (tDia != null && vida.relogio && vida.relogio.definir) vida.relogio.definir(Math.max(vida.relogio.minuto, Math.min(23 * 60, Math.round(tDia / 60))));
      if (TO.tela && TO.tela.retomarTempo) TO.tela.retomarTempo('jogo-praca');
    }
    if (g.travarPraca) g.travarPraca(false);
  }

  /* QUEM FALA COM O JOGADOR NO DIA DE JOGO (os recados em balão,
     recados3d.js): o líder do nosso bonde — o balão fica em cima do nome
     do bonde (o rótulo anda com o líder, mais alto na arquibancada, por
     causa do bandeirão; ele some e volta com a arrumação dos rótulos, mas
     a posição é sempre a do líder), ou da cabeça dele sem o rótulo */
  const PF = {};
  function falante() {
    if (!D || D.ia || !D.plano || !D.nosso || D.emCena || !dia || !dia.plano) return null;
    const b = D.nosso, d = b.gente && b.gente[0] && b.gente[0].d;
    if (!d) return null;
    const r = b.rotulo ? b.rotulo.position : null;
    if (r) { PF.x = r.x; PF.y = r.y + 0.9 * M; PF.z = r.z; }
    else { PF.x = d.x; PF.y = (d.alt || 0) + 2.1 * M; PF.z = d.y; }
    return PF;
  }
  /* a câmera no nosso bonde (na partida, o nosso setor) */
  function verNossa() {
    if (!D || !dia || !D.nosso) return;
    if (D.partida || D.fase === 'jogo') verNossoSetor(); else dia.seguirBonde(D.nosso);
  }

  return {
    abrir, fase, partida, apito, depoisDaCena, naoDesceu, fechar, abrirJogoDaCidade, brigaRegistrada,
    ganchosDaCaminhada, palcoDaInvasao, viasDaInvasao, verNossa,
    get falante() { return falante(); },
    get ativo() { return !!(D && D.plano && dia && dia.plano); },
    /* o jogo da cidade no ar (ou montando): os recados esperam a volta pra sede */
    get jogoDaCidade() { return !!(D && D.ia); },
    get montando() { return !!D && !D.plano; },
    get hora() { return D && dia && dia.plano ? dia.t : null; },
    /* pro teste */
    get estado() {
      if (!D) return null;
      const b = D.nosso;
      return { ia: !!D.ia, minuto: D.minuto, placar: D.placar, reg: D.reg ? { a: D.reg.a.nome, b: D.reg.b.nome, ganhouA: D.reg.ganhouA } : null,
               praca: D.nome, fora: D.fora, fase: D.fase, hora: dia && dia.plano ? hhmm(dia.t) : null, t: dia && dia.plano ? dia.t : null, corrida: D.corrida ? hhmm(D.corrida.alvo) : null,
               plano: !!D.plano, nosso: b ? { sigla: b.t.sigla, n: b.n, naRua: b.naRua, inicio: b.inicio.tipo + (b.inicio.t ? ':' + b.inicio.t.sigla : ''), lado: b.lado, setor: b.setor, estado: dia.estadoDo(b, 0) } : null,
               briga: D.briga ? { a: D.briga.a.t.sigla, v: D.briga.v.t.sigla, ini: hhmm(D.briga.tIni), aplicada: !!D.briga.aplicado, venceA: D.briga.venceA } : null,
               vias: viasDaInvasao(), invadiu: D.invadiu, partida: !!D.partida, emCena: !!D.emCena,
               invasao: D.ultimaInvasao ? { via: D.ultimaInvasao.via, rival: D.ultimaInvasao.rival, grades: D.ultimaInvasao.cena.grades.map(x => x.modulos), pm: D.ultimaInvasao.cena.pmPostos.length } : null };
    },
    get dia() { return dia; }, get plano() { return D && D.plano; }
  };
}
