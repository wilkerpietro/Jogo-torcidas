/* =========================================================
   O PORTAL (dono, 13/11/2026)

   "Eu quero reformular essa tela pra ser uma tela com a pegada mais de
   Football Manager: a caixa de entrada de mensagens com classificação,
   próximo adversário, finanças da torcida, patrimônio, e outras coisas."

   As respostas do dono às perguntas: além desses, a agenda de jogos, o
   elenco da torcida, os aliados e rivais e "quanto cada patrimônio tá
   gerando de receitas e despesas"; o tempo corre sozinho, como hoje; as
   mensagens são os cartões inteiros; o menu é a coluna com ícone e nome;
   no celular, três abas (Mensagens, Clube, Torcida); o próximo adversário
   mostra as torcidas e o efetivo, a relação e o histórico, o risco do dia
   e a viagem; a paleta é nova.

   É a tela entre os jogos do jogo 3D (o body com `j3d-entre-jogos`).
   main.js monta o rolo das mensagens como sempre e entrega aqui
   (`montar`): o rolo vira a primeira coluna, e as outras duas são blocos
   que só LEEM o jogo — nenhuma regra mora aqui. Cada bloco abre a tela
   dele no menu. `atualizar` repinta os blocos quando o dia, o caixa, o
   elenco ou as mensagens mudam.
   ========================================================= */
(function(){
  'use strict';
  const T = (s, p) => typeof window._t === 'function' ? window._t(s, p)
    : String(s).replace(/\{(\w+)\}/g, (m, k) => p && p[k] != null ? p[k] : m);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const U = () => TO.util || {};
  const din = v => (v < 0 ? '−' : '') + (U().dinheiro ? U().dinheiro(Math.abs(Math.round(v))) : 'R$ ' + Math.abs(Math.round(v)));
  const num = v => U().numero ? U().numero(v) : String(v);
  const IMG = c => (window.__EMBUTIDOS && window.__EMBUTIDOS[c]) || ('../' + c);
  const tentar = (fn, padrao) => { try { const v = fn(); return v == null ? padrao : v; } catch (err) { return padrao; } };
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dd = n => String(n).padStart(2, '0');
  const diaMes = d => `${dd(d.getDate())}/${dd(d.getMonth() + 1)}`;

  let raiz = null, ctx = null, colClube = null, colTorcida = null, contaMsgs = null, abaMsgs = null, chave = '';

  /* ---------- o escudo do clube e a cor da torcida ---------- */
  function escudoDoClube(id, classe){
    const t = TO.mundo.time(id) || {};
    const tem = ((TO.dados.escudos || {}).clubes || {})[id];
    if(tem) return `<img class="pt-escudo ${classe || ''}" src="${IMG('img/escudos/clube-' + id + '.png')}" alt="">`;
    const c = t.cores || ['#555', '#222'];
    return `<span class="pt-escudo sem ${classe || ''}" style="background:${esc(c[0])};color:${esc(c[1] || '#fff')}">${esc((t.sigla || t.nome || '?').slice(0, 3))}</span>`;
  }
  const corDaTorcida = o => { const c = (o && o.cores) || []; return c[0] && !/^#?f{3,6}$/i.test(c[0].replace('#', '')) ? c[0] : (c[1] || c[0] || '#888'); };
  const dataDoJogo = (e, j) => TO.estado.dataDaSemana(e.data.ano, j.semana, j.dia);
  const hojeDe = e => TO.estado.dataDaSemana(e.data.ano, e.data.semana, e.data.dia);

  function bloco(titulo, corpo, abrir, extra){
    return `<section class="pt-bloco${extra ? ' ' + extra : ''}"><header class="pt-cab"><h3>${esc(titulo)}</h3>` +
      (abrir ? `<button class="pt-abrir" data-abrir="${abrir}" title="${esc(T('Abrir a tela'))}">${esc(T('Abrir'))} <i>›</i></button>` : '') +
      `</header><div class="pt-corpo">${corpo}</div></section>`;
  }
  const vazio = txt => `<p class="pt-vazio">${esc(txt)}</p>`;

  /* ======================================================
     O PRÓXIMO JOGO: o adversário, quem põe gente no estádio, a relação e
     o retrospecto, o risco do dia e a viagem
     ====================================================== */
  function agendaNossa(e){
    return e.temporada && TO.competicoes.agendaDoClube ? TO.competicoes.agendaDoClube(e, e.torcida.clubeId) : [];
  }
  function proximoJogo(e, agenda){
    const hoje = hojeDe(e);
    return agenda.find(j => !j.jogado && dataDoJogo(e, j) >= hoje) || null;
  }
  /* quem deve aparecer no estádio: a mesma régua do recado da partida
     (feed.js, "quem põe gente no estádio"), antes do dia */
  function presencaPrevista(e, j){
    const M = TO.mundo, meu = e.torcida.clubeId;
    const casaId = j.casa ? meu : j.adversario, foraId = j.casa ? j.adversario : meu;
    const casaMapa = (M.time(casaId) || {}).mapa, out = [];
    for(const [lado, cid] of [['c', casaId], ['f', foraId]])
      for(const o of (M.torcidasDe(cid) || [])){
        let n = 0;
        try{
          if(o.id === e.torcida.id) n = TO.planejamento.efetivoDaSaida(e, {mapa: casaMapa});
          else if(o.mapa === casaMapa) n = TO.relacoes.disponiveisIA(e, o.id);
          else { n = TO.planejamento.caravanaDe(o, (e.relacoes || {})[o.id], e, casaMapa); if(n < 5) continue; }
        }catch(err){ continue; }
        if(n > 0) out.push({id: o.id, nome: o.nome, n: Math.round(n), casa: lado === 'c', nosso: o.id === e.torcida.id, clube: cid, cor: corDaTorcida(o)});
      }
    return out;
  }
  const TOM = {'Maior Rival': 'ruim', 'Rival': 'ruim', 'Neutro': 'neutro', 'Aliado': 'bom', 'Irmandade': 'bom'};
  function relacaoCom(e, id){
    const v = tentar(() => TO.relacoes.nivel(e, id), 0), st = TO.mundo.statusDoValor(v);
    return {v: Math.round(v), status: st, tom: TOM[st] || 'neutro'};
  }
  function riscoDoDia(e, j, daSemana){
    const itens = [];
    /* o ataque contra a gente que o olheiro avisou (o recado da campana) */
    const at = e.ataqueMarcado;
    if(at && !at.resolvido && (e.feed || []).some(m => m && m.kind === 'campana' && (e.data.absoluto - ((m.quando || {}).abs || 0)) <= 7))
      itens.push({tom: 'ruim', txt: T('O olheiro avisou: a {nome} vem pra cima da gente.', {nome: at.nome || T('rival')})});
    if(daSemana){
      const p = tentar(() => TO.planejamento.plano(e), null);
      const nomeDe = id => (TO.mundo.torcida(id) || {}).nome || id;
      if(p && p.intencao && p.intencao !== 'paz' && p.alvoTorcida)
        itens.push({tom: 'ataque', txt: T('Ataque nosso marcado contra a {nome}.', {nome: nomeDe(p.alvoTorcida)})});
      for(const k of Object.keys((p && p.investidas) || {})){
        const iv = tentar(() => TO.planejamento.investidaDe(e, k), null);
        if(iv && iv.alvo) itens.push({tom: 'ataque', txt: T('Investida marcada contra a {nome}.', {nome: nomeDe(iv.alvo)})});
      }
      const aj = tentar(() => TO.planejamento.ajudaDe(e), null);
      if(aj && aj.aliado) itens.push({tom: 'bom', txt: aj.nivel === 'hospedar'
        ? T('A {nome} recebe a gente na sede dela.', {nome: aj.nome || nomeDe(aj.aliado)})
        : T('A {nome} recebe e escolta a gente.', {nome: aj.nome || nomeDe(aj.aliado)})});
      const emb = tentar(() => TO.planejamento.emboscadaDaRota(e), null);
      if(emb && emb.nome) itens.push({tom: 'ruim', txt: T('Risco de emboscada na estrada: a {nome} vê o ônibus passar.', {nome: emb.nome})});
    }
    return itens;
  }
  function blocoProximo(e, agenda){
    const C = TO.competicoes, M = TO.mundo, meu = e.torcida.clubeId;
    const j = proximoJogo(e, agenda);
    if(!j) return bloco(T('Próximo jogo'), vazio(T('Sem jogo marcado na agenda.')), 'calendario');
    const d = dataDoJogo(e, j), hoje = hojeDe(e);
    const faltam = Math.round((d - hoje) / 86400000);
    const casaId = j.casa ? meu : j.adversario, foraId = j.casa ? j.adversario : meu;
    const tc = M.time(casaId) || {}, tf = M.time(foraId) || {};
    const pos = id => tentar(() => C.posicaoNaTabela(e, j.compId, id), 0);
    const pc = pos(casaId), pf = pos(foraId);
    const quando = faltam <= 0 ? T('HOJE') : faltam === 1 ? T('amanhã') : T('em {n} dias', {n: faltam});
    const lado = j.neutro ? T('Campo neutro') : j.casa ? T('Em casa') : T('Fora');
    const daSemana = !!(e.proximoJogo && e.proximoJogo.semana === j.semana && (e.proximoJogo.dia == null || e.proximoJogo.dia === j.dia));
    const pres = presencaPrevista(e, j);
    const nos = pres.filter(p => p.clube === meu), eles = pres.filter(p => p.clube !== meu);
    const soma = l => l.reduce((s, p) => s + p.n, 0);
    const linha = p => `<li><i style="background:${esc(p.cor)}"></i><span>${esc(p.nome)}</span><b>${num(p.n)}</b></li>`;
    const advTorcidas = (M.torcidasDe(j.adversario) || []);
    const relacoes = advTorcidas.map(o => {
      const r = relacaoCom(e, o.id), rt = (e.retrospecto || {})[o.id], deve = (e.dividas || {})[o.id];
      const hist = rt && (rt.v + rt.d + rt.e) ? T('{v}V {e}E {d}D contra eles', {v: rt.v, e: rt.e, d: rt.d}) : T('nunca se pegaram');
      return `<li><i style="background:${esc(corDaTorcida(o))}"></i><span>${esc(o.nome)}</span>` +
        `<em class="pt-chip ${r.tom}">${esc(T(r.status))} ${r.v > 0 ? '+' : ''}${r.v}</em>` +
        `<small>${esc(hist)}${deve ? ' · ' + esc(T('a gente deve o troco')) : ''}</small></li>`;
    }).join('');
    const risco = riscoDoDia(e, j, daSemana);
    let viagem = '';
    if(!j.casa && !j.neutro){
      const est = daSemana ? tentar(() => TO.planejamento.estimativaCaravana(e), null) : null;
      const precisa = daSemana ? tentar(() => TO.financeiro.precisaCaravana(e), true) : (tf.mapa !== (M.time(meu) || {}).mapa || tc.mapa !== e.torcida.mapa);
      if(!precisa) viagem = `<p class="pt-nota">${esc(T('O jogo é na nossa cidade: não tem estrada.'))}</p>`;
      else if(est){
        const rota = est.rota && est.rota.cidades ? est.rota.cidades.map(c => tentar(() => TO.financeiro.nomeCidade(c), c)).join(' › ') : '';
        const p = tentar(() => TO.planejamento.plano(e), {}) || {};
        const vao = p.caravana != null ? p.caravana : est.vao;
        viagem = `<div class="pt-ladrilhos tres"><div><small>${esc(T('Destino'))}</small><b>${esc(tc.cidade || '')}</b></div>` +
          `<div><small>${esc(T('Vão na caravana'))}</small><b>${num(vao || 0)}</b></div>` +
          `<div><small>${esc(T('Custo'))}</small><b>${din(est.custo || 0)}</b></div></div>` +
          (rota ? `<p class="pt-nota">${esc(est.rota.id === 'ar' ? T('De avião') : T('Estrada'))}: ${esc(rota)}</p>` : '');
      } else viagem = `<p class="pt-nota">${esc(T('Jogo em {cidade}. A caravana se decide na semana do jogo.', {cidade: tc.cidade || ''}))}</p>`;
    }
    const corpo =
      `<div class="pt-jogo-topo"><span>${esc(j.comp || '')}${j.fase ? ' · ' + esc(T(j.fase)) : ''}</span><b class="${faltam <= 0 ? 'hoje' : ''}">${esc(quando)}</b></div>` +
      `<div class="pt-confronto">` +
        `<div class="pt-time">${escudoDoClube(casaId, 'g')}<b>${esc(tc.nome || casaId)}</b><small>${pc ? pc + 'º' : '&nbsp;'}</small></div>` +
        `<div class="pt-x"><b>×</b><small>${esc(DIAS[d.getDay()] ? T(DIAS[d.getDay()]) : '')} ${diaMes(d)}</small><small>${esc(j.hora || '')}</small></div>` +
        `<div class="pt-time">${escudoDoClube(foraId, 'g')}<b>${esc(tf.nome || foraId)}</b><small>${pf ? pf + 'º' : '&nbsp;'}</small></div>` +
      `</div>` +
      `<p class="pt-local"><em class="pt-chip ${j.casa ? 'bom' : 'neutro'}">${esc(lado)}</em> ${esc(tc.estadio || '')}${tc.cidade ? ' · ' + esc(tc.cidade) : ''}</p>` +
      `<h4>${esc(T('Torcidas e efetivo'))}</h4>` +
      (pres.length
        ? `<div class="pt-efetivo"><div><div class="pt-total"><span>${esc(T('Do nosso lado'))}</span><b>${num(soma(nos))}</b></div><ul class="pt-lista">${nos.map(linha).join('')}</ul></div>` +
          `<div><div class="pt-total"><span>${esc(T('Do lado deles'))}</span><b>${num(soma(eles))}</b></div><ul class="pt-lista">${eles.map(linha).join('') || '<li class="nada">' + esc(T('ninguém deve viajar')) + '</li>'}</ul></div></div>`
        : vazio(T('Ainda não dá pra estimar quem vai.'))) +
      (relacoes ? `<h4>${esc(T('Relação e histórico'))}</h4><ul class="pt-lista rel">${relacoes}</ul>` : '') +
      `<h4>${esc(T('Risco do dia'))}</h4>` +
      (risco.length ? `<ul class="pt-risco">${risco.map(r => `<li class="${r.tom}">${esc(r.txt)}</li>`).join('')}</ul>`
                    : `<p class="pt-nota">${esc(T('Nada marcado e nenhum aviso do olheiro.'))}</p>`) +
      (viagem ? `<h4>${esc(T('Viagem'))}</h4>${viagem}` : '');
    return bloco(T('Próximo jogo'), corpo, 'planejamento', 'pt-proximo');
  }

  /* ======================================================
     A AGENDA: os últimos resultados e os próximos jogos
     ====================================================== */
  function blocoAgenda(e, agenda){
    if(!agenda.length) return bloco(T('Agenda de jogos'), vazio(T('A temporada ainda não começou.')), 'calendario');
    const hoje = hojeDe(e);
    const feitos = agenda.filter(j => j.jogado).slice(-4);
    const vem = agenda.filter(j => !j.jogado && dataDoJogo(e, j) >= hoje).slice(0, 5);
    const linha = j => {
      const t = TO.mundo.time(j.adversario) || {}, d = dataDoJogo(e, j);
      let res = '<span class="pt-res">–</span>';
      if(j.jogado){
        const v = j.gp > j.gc || (j.gp === j.gc && j.venceu === true), dr = j.gp < j.gc || (j.gp === j.gc && j.venceu === false);
        res = `<span class="pt-res ${v ? 'v' : dr ? 'd' : 'e'}"><i></i>${j.gp}–${j.gc}${j.pen ? ' <small>(' + j.pen.c + '–' + j.pen.f + ')</small>' : ''}</span>`;
      }
      return `<tr class="${j.jogado ? 'feito' : ''}"><td class="data">${diaMes(d)}</td><td class="clube">${escudoDoClube(j.adversario, 'p')}<span>${esc(t.nome || j.adversario)}<small>${esc(j.comp || '')}</small></span></td>` +
        `<td class="lado">${j.neutro ? 'N' : j.casa ? T('C') : T('F')}</td><td>${res}</td></tr>`;
    };
    return bloco(T('Agenda de jogos'),
      `<table class="pt-tabela agenda"><tbody>${feitos.map(linha).join('')}${vem.map(linha).join('')}</tbody></table>`, 'calendario');
  }

  /* ======================================================
     A CLASSIFICAÇÃO: a tabela da liga (o grupo do nosso clube)
     ====================================================== */
  function blocoTabela(e, agenda){
    const C = TO.competicoes, meu = e.torcida.clubeId;
    const comps = ((e.temporada || {}).competicoes || []).filter(c => !c.copa);
    const conta = {};
    for(const j of agenda) conta[j.compId] = (conta[j.compId] || 0) + 1;
    /* a liga do próximo jogo, se ele é de liga; senão a em que o clube mais joga */
    const prox = proximoJogo(e, agenda);
    let comp = prox ? comps.find(c => c.id === prox.compId) : null;
    if(!comp) comp = comps.filter(c => conta[c.id]).sort((a, b) => conta[b.id] - conta[a.id])[0];
    if(!comp) return bloco(T('Classificação'), vazio(T('Sem liga em andamento.')), 'competicoes');
    let linhas = [];
    try{
      if(comp.grupos && comp.grupos.length > 1){
        const gi = comp.grupos.findIndex(g => g.includes(meu));
        linhas = C.tabela(comp, gi < 0 ? 0 : gi);
      } else linhas = C.tabela(comp);
    }catch(err){ linhas = []; }
    if(!linhas.length) return bloco(T('Classificação'), vazio(T('Sem liga em andamento.')), 'competicoes');
    const adv = prox ? prox.adversario : null;
    const corpo = `<p class="pt-nota topo">${esc(comp.nome || '')}</p><table class="pt-tabela liga"><thead><tr><th>#</th><th class="clube">${esc(T('Clube'))}</th>` +
      `<th title="${esc(T('Jogos'))}">J</th><th title="${esc(T('Vitórias'))}">V</th><th title="${esc(T('Empates'))}">E</th><th title="${esc(T('Derrotas'))}">D</th><th title="${esc(T('Saldo de gols'))}">SG</th><th title="${esc(T('Pontos'))}">P</th></tr></thead><tbody>` +
      linhas.map((l, i) => {
        const t = TO.mundo.time(l.id) || {};
        return `<tr class="${l.id === meu ? 'nosso' : l.id === adv ? 'adv' : ''}"><td>${i + 1}</td><td class="clube">${escudoDoClube(l.id, 'p')}<span>${esc(t.nome || l.id)}</span></td>` +
          `<td>${l.j}</td><td>${l.v}</td><td>${l.e}</td><td>${l.d}</td><td>${l.sg > 0 ? '+' : ''}${l.sg}</td><td><b>${l.p}</b></td></tr>`;
      }).join('') + `</tbody></table>`;
    return bloco(T('Classificação'), corpo, 'competicoes');
  }

  /* ======================================================
     AS FINANÇAS E O PATRIMÔNIO (cada ponto com o que rende e o que custa)
     ====================================================== */
  function blocoFinancas(e, r){
    const sinal = v => v < 0 ? 'ruim' : v > 0 ? 'bom' : '';
    const g = (r.gestao && r.gestao.total) || 0;
    const corpo = `<div class="pt-ladrilhos"><div class="g"><small>${esc(T('Caixa'))}</small><b class="${e.dinheiro < 0 ? 'ruim' : ''}">${din(e.dinheiro)}</b></div>` +
      `<div><small>${esc(T('Saldo da semana'))}</small><b class="${sinal(r.saldo || 0)}">${(r.saldo || 0) > 0 ? '+' : ''}${din(r.saldo || 0)}</b></div>` +
      `<div><small>${esc(T('Receitas'))}</small><b>${din(r.receita || 0)}</b></div>` +
      `<div><small>${esc(T('Despesas'))}</small><b>${din(r.despesa || 0)}</b></div></div>` +
      (g ? `<p class="pt-nota">${esc(T('Compromissos da semana (caravana, recepção e outros): {v}', {v: din(g)}))}</p>` : '') +
      ((e.diasNoVermelho || 0) > 0 ? `<p class="pt-nota ruim">${esc(T('{n} dias no vermelho.', {n: e.diasNoVermelho}))}</p>` : '');
    return bloco(T('Finanças'), corpo, 'financeiro');
  }
  const NOME_PONTO = {sede: 'Sede', bar: 'Bar', loja: 'Loja', subsede: 'Subsede', filial: 'Subsede de fora', fabrica: 'Fábrica'};
  function blocoPatrimonio(e, r){
    const pontos = (r.contas && r.contas.pontos) || [];
    if(!pontos.length) return bloco(T('Patrimônio'), vazio(T('A torcida ainda não tem patrimônio.')), 'torcida');
    let tr = 0, td = 0;
    const linhas = pontos.map(p => {
      tr += p.receita || 0; td += p.despesa || 0;
      const onde = p.bairro || p.cidade || '';
      const nota = p.quebrado ? T('quebrado, {d} d', {d: p.quebrado}) : p.semInsumo ? T('sem insumo') : p.tipo === 'fabrica' ? T('corta o custo das lojas') : '';
      const saldo = (p.receita || 0) - (p.despesa || 0);
      return `<tr><td class="clube"><span><b>${esc(T(NOME_PONTO[p.tipo] || p.tipo))}${p.nivel ? ' <i>n' + p.nivel + '</i>' : ''}</b>` +
        `${onde || nota ? '<small>' + esc([onde, nota].filter(Boolean).join(' · ')) + '</small>' : ''}</span></td>` +
        `<td class="bom">${p.receita ? din(p.receita) : '–'}</td><td class="ruim">${p.despesa ? din(p.despesa) : '–'}</td>` +
        `<td class="${saldo < 0 ? 'ruim' : saldo > 0 ? 'bom' : ''}"><b>${saldo ? (saldo > 0 ? '+' : '') + din(saldo) : '–'}</b></td></tr>`;
    }).join('');
    const st = tr - td;
    const corpo = `<table class="pt-tabela patr"><thead><tr><th class="clube">${esc(T('Por semana'))}</th><th>${esc(T('Rende'))}</th><th>${esc(T('Custa'))}</th><th>${esc(T('Saldo'))}</th></tr></thead>` +
      `<tbody>${linhas}</tbody><tfoot><tr><td class="clube">${esc(T('Total'))}</td><td class="bom">${din(tr)}</td><td class="ruim">${din(td)}</td>` +
      `<td class="${st < 0 ? 'ruim' : 'bom'}"><b>${st > 0 ? '+' : ''}${din(st)}</b></td></tr></tfoot></table>`;
    return bloco(T('Patrimônio'), corpo, 'torcida');
  }

  /* ======================================================
     O ELENCO E AS RELAÇÕES
     ====================================================== */
  function blocoElenco(e){
    const Mb = TO.membros, c = Mb.contar(e);
    const cap = tentar(() => Mb.capacidade(e), 0);
    const fortes = e.membros.slice().sort((a, b) => (b.forca + b.defesa) - (a.forca + a.defesa)).slice(0, 5);
    const corpo = `<div class="pt-ladrilhos"><div><small>${esc(T('Membros'))}</small><b>${num(c.total)}${cap ? '<i> / ' + num(cap) + '</i>' : ''}</b></div>` +
      `<div><small>${esc(T('Aptos'))}</small><b class="bom">${num(c.aptos)}</b></div>` +
      `<div><small>${esc(T('Feridos'))}</small><b class="${c.feridos ? 'ruim' : ''}">${num(c.feridos)}</b></div>` +
      `<div><small>${esc(T('Presos'))}</small><b class="${c.presos ? 'ruim' : ''}">${num(c.presos)}</b></div></div>` +
      `<h4>${esc(T('Os mais fortes'))}</h4><table class="pt-tabela elenco"><tbody>` +
      fortes.map(m => `<tr><td class="clube"><span><b>${esc(Mb.nomeDe(m))}</b><small>${esc(tentar(() => Mb.cargoNome(m.cargo), ''))}${m.ferido ? ' · ' + esc(T('ferido')) : m.preso ? ' · ' + esc(T('preso')) : ''}</small></span></td>` +
        `<td title="${esc(T('Força'))}">${Math.round(m.forca)}</td><td title="${esc(T('Defesa'))}">${Math.round(m.defesa)}</td></tr>`).join('') +
      `</tbody></table>`;
    return bloco(T('Elenco da torcida'), corpo, 'torcida');
  }
  function blocoRelacoes(e){
    const pan = tentar(() => TO.relacoes.panorama(e), []);
    const aliados = pan.filter(x => x.relacao >= 20).sort((a, b) => b.relacao - a.relacao).slice(0, 5);
    const rivais = pan.filter(x => x.relacao < -15).slice(0, 5);
    const linha = x => {
      const larg = Math.min(100, Math.abs(x.relacao));
      return `<li><i style="background:${esc(corDaTorcida(x))}"></i><span>${esc(x.nome)}</span>` +
        `<span class="pt-barra ${x.relacao < 0 ? 'ruim' : 'bom'}"><u style="width:${larg}%"></u></span><b>${x.relacao > 0 ? '+' : ''}${x.relacao}</b></li>`;
    };
    const corpo = `<h4 class="primeiro">${esc(T('Aliados'))}</h4>` +
      (aliados.length ? `<ul class="pt-lista barra">${aliados.map(linha).join('')}</ul>` : `<p class="pt-nota">${esc(T('Nenhum aliado por enquanto.'))}</p>`) +
      `<h4>${esc(T('Rivais'))}</h4>` +
      (rivais.length ? `<ul class="pt-lista barra">${rivais.map(linha).join('')}</ul>` : `<p class="pt-nota">${esc(T('Nenhum rival declarado.'))}</p>`);
    return bloco(T('Aliados e rivais'), corpo, 'diplomacia');
  }

  /* ======================================================
     MONTAR E ATUALIZAR
     ====================================================== */
  function pintar(){
    const e = TO.estado && TO.estado.E;
    if(!e || !e.torcida || !raiz || !raiz.isConnected) return;
    const seguro = (fn, titulo) => { try { return fn(); } catch (err) { console.error('o portal, ' + titulo + ':', err); return bloco(titulo, vazio(T('Não deu pra montar este bloco.'))); } };
    const agenda = tentar(() => agendaNossa(e), []);
    const r = tentar(() => TO.financeiro.resumoDaSemana(e), {}) || {};
    /* (a rolagem de cada coluna fica onde estava) */
    const y1 = colClube.scrollTop, y2 = colTorcida.scrollTop;
    colClube.innerHTML = seguro(() => blocoProximo(e, agenda), T('Próximo jogo')) +
      seguro(() => blocoAgenda(e, agenda), T('Agenda de jogos')) + seguro(() => blocoTabela(e, agenda), T('Classificação'));
    colTorcida.innerHTML = seguro(() => blocoFinancas(e, r), T('Finanças')) + seguro(() => blocoPatrimonio(e, r), T('Patrimônio')) +
      seguro(() => blocoElenco(e), T('Elenco da torcida')) + seguro(() => blocoRelacoes(e), T('Aliados e rivais'));
    colClube.scrollTop = y1; colTorcida.scrollTop = y2;
  }
  function contarMensagens(e){
    const n = (e.feed || []).filter(m => m && m.peso === 'decisao' && !m.respondido).length;
    if(contaMsgs){ contaMsgs.hidden = !n; contaMsgs.textContent = n === 1 ? T('1 aguardando resposta') : T('{n} aguardando resposta', {n}); }
    if(abaMsgs){ abaMsgs.hidden = !n; abaMsgs.textContent = String(n); }
  }
  function atualizar(forcar){
    const e = TO.estado && TO.estado.E;
    if(!e || !e.torcida || !raiz || !raiz.isConnected) return;
    contarMensagens(e);
    medir();
    const p = e.patrimonio || {};
    const k = [e.data.absoluto, Math.round(e.dinheiro), e.membros.length, (e.feed || []).length, ((e.feed || [])[0] || {}).id,
               (p.bares || []).length, (p.lojas || []).length, e.torcida.sedeNivel, (window.TO.i18n || {}).idioma].join('|');
    if(!forcar && k === chave) return;
    chave = k;
    pintar();
    vigiarMoldura();
  }
  /* A MOLDURA DAS TELAS (13/11/2026): as telas do menu abrem DENTRO da
     moldura — o menu e a barra de cima ficam à vista —, e o CSS
     (telas3d.css) precisa saber onde a barra acaba e onde o menu está:
     `--pt-topo` (o pé da barra), `--pt-menu` (a largura da coluna do menu;
     0 no celular) e `--pt-base` (a altura do menu embaixo, no celular) */
  let observador = null;
  function medir(){
    const b = document.querySelector('.pagina[data-pag="feed"] .feed-barra'), m = document.querySelector('.pagina[data-pag="feed"] .feed-menu');
    if(!b || !m) return;
    const rb = b.getBoundingClientRect(), rm = m.getBoundingClientRect();
    if(!rb.width || !rm.width) return;
    const embaixo = rm.top > rb.bottom && rm.width > innerWidth * 0.7;
    const st = document.documentElement.style;
    st.setProperty('--pt-topo', Math.round(rb.bottom) + 'px');
    st.setProperty('--pt-menu', (embaixo ? 0 : Math.round(rm.right)) + 'px');
    st.setProperty('--pt-base', (embaixo ? Math.max(0, Math.round(innerHeight - rm.top)) : 0) + 'px');
  }
  function vigiarMoldura(){
    if(observador) observador.disconnect();
    const b = document.querySelector('.pagina[data-pag="feed"] .feed-barra'), m = document.querySelector('.pagina[data-pag="feed"] .feed-menu');
    if(window.ResizeObserver && b && m){ observador = new ResizeObserver(medir); observador.observe(b); observador.observe(m); }
    medir();
  }
  addEventListener('resize', medir);
  /* `colunas`: a caixa do miolo do feed; `rolo`: o rolo das mensagens que
     main.js acabou de montar; `c`: { abrirPainel } */
  function montar(colunas, rolo, c){
    ctx = c || {};
    raiz = document.createElement('div');
    raiz.className = 'portal'; raiz.dataset.aba = (raiz.dataset.aba || window.__portalAba || 'msgs');
    const abas = document.createElement('div');
    abas.className = 'pt-abas'; abas.setAttribute('role', 'tablist');
    abas.innerHTML = `<button data-aba="msgs">${esc(T('Mensagens'))}<i class="pt-conta" hidden></i></button>` +
      `<button data-aba="clube">${esc(T('Clube'))}</button><button data-aba="torcida">${esc(T('Torcida'))}</button>`;
    abaMsgs = abas.querySelector('.pt-conta');
    const colMsgs = document.createElement('section');
    colMsgs.className = 'pt-col pt-msgs';
    const cab = document.createElement('header');
    cab.className = 'pt-cab fixo';
    cab.innerHTML = `<h3>${esc(T('Caixa de entrada'))}</h3><span class="pt-aguarda" hidden></span>`;
    contaMsgs = cab.querySelector('.pt-aguarda');
    const lista = rolo.querySelector('.feed-lista');
    if(lista) lista.dataset.vazio = T('Nenhuma mensagem por enquanto. Os dias seguem passando.');
    colMsgs.append(cab, rolo);
    colClube = document.createElement('section'); colClube.className = 'pt-col pt-clube';
    colTorcida = document.createElement('section'); colTorcida.className = 'pt-col pt-torcida';
    raiz.append(abas, colMsgs, colClube, colTorcida);
    colunas.appendChild(raiz);
    const marcar = () => { for(const b of abas.children) b.classList.toggle('on', b.dataset.aba === raiz.dataset.aba); };
    marcar();
    abas.addEventListener('click', ev => {
      const b = ev.target.closest('[data-aba]');
      if(!b) return;
      raiz.dataset.aba = window.__portalAba = b.dataset.aba; marcar();
    });
    raiz.addEventListener('click', ev => {
      const b = ev.target.closest('[data-abrir]');
      if(b && ctx.abrirPainel) ctx.abrirPainel(b.dataset.abrir);
    });
    chave = '';
    atualizar(true);
  }

  window.TO = window.TO || {};
  TO.portal = { montar, atualizar };

  /* ---------- o dicionário do portal (es, en) ---------- */
  if(TO.i18n && TO.i18n.registrar) TO.i18n.registrar({
    /* (o planejamento: a ida anda sozinha desde a etapa 2) */
    'Fora, o bonde anda sozinho de onde a caravana descer até o estádio. Se uma rival chegar perto no caminho, <b>você assume o bonde</b> antes da briga. Aqui se decide a viagem.':
      {es:'De visitante, la banda camina sola desde donde baja la caravana hasta el estadio. Si una rival se acerca en el camino, <b>tomás el control</b> antes de la pelea. Acá se decide el viaje.',
       en:'Away, the crew walks on its own from where the convoy stops to the stadium. If a rival gets close on the way, <b>you take over the crew</b> before the fight. Here you decide the trip.'},
    'Em casa, o bonde sai sozinho da sede e anda até o estádio. Se uma rival chegar perto no caminho, <b>você assume o bonde</b> antes da briga.':
      {es:'De local, la banda sale sola de la sede y camina hasta el estadio. Si una rival se acerca en el camino, <b>tomás el control</b> antes de la pelea.',
       en:'At home, the crew leaves HQ on its own and walks to the stadium. If a rival gets close on the way, <b>you take over the crew</b> before the fight.'},
    'a ida anda sozinha': {es:'la ida va sola', en:'the walk runs on its own'},
    'Abrir a tela': {es:'Abrir la pantalla', en:'Open the screen'},
    'Abrir': {es:'Abrir', en:'Open'},
    'Próximo jogo': {es:'Próximo partido', en:'Next game'},
    'Sem jogo marcado na agenda.': {es:'No hay partido en la agenda.', en:'No game on the schedule.'},
    'HOJE': {es:'HOY', en:'TODAY'},
    'amanhã': {es:'mañana', en:'tomorrow'},
    'em {n} dias': {es:'en {n} días', en:'in {n} days'},
    'Campo neutro': {es:'Cancha neutral', en:'Neutral ground'},
    'Em casa': {es:'De local', en:'Home'},
    'Fora': {es:'De visitante', en:'Away'},
    'Torcidas e efetivo': {es:'Barras y efectivo', en:'Firms and numbers'},
    'Do nosso lado': {es:'De nuestro lado', en:'On our side'},
    'Do lado deles': {es:'Del lado de ellos', en:'On their side'},
    'ninguém deve viajar': {es:'nadie debería viajar', en:'nobody is expected to travel'},
    'Ainda não dá pra estimar quem vai.': {es:'Todavía no se puede estimar quién va.', en:"Can't estimate who is going yet."},
    'Relação e histórico': {es:'Relación e historial', en:'Relationship and history'},
    '{v}V {e}E {d}D contra eles': {es:'{v}G {e}E {d}P contra ellos', en:'{v}W {e}D {d}L against them'},
    'nunca se pegaram': {es:'nunca se agarraron', en:'never fought'},
    'a gente deve o troco': {es:'les debemos la revancha', en:'we owe them payback'},
    'Risco do dia': {es:'Riesgo del día', en:'Match-day risk'},
    'Nada marcado e nenhum aviso do olheiro.': {es:'Nada marcado y ningún aviso del vigía.', en:'Nothing planned and no warning from the scout.'},
    'O olheiro avisou: a {nome} vem pra cima da gente.': {es:'El vigía avisó: {nome} viene por nosotros.', en:'The scout warned: {nome} is coming for us.'},
    'rival': {es:'rival', en:'rival'},
    'Ataque nosso marcado contra a {nome}.': {es:'Ataque nuestro marcado contra {nome}.', en:'Our attack is set against {nome}.'},
    'Investida marcada contra a {nome}.': {es:'Embestida marcada contra {nome}.', en:'Raid set against {nome}.'},
    'A {nome} recebe a gente na sede dela.': {es:'{nome} nos recibe en su sede.', en:'{nome} hosts us at their HQ.'},
    'A {nome} recebe e escolta a gente.': {es:'{nome} nos recibe y nos escolta.', en:'{nome} hosts and escorts us.'},
    'Risco de emboscada na estrada: a {nome} vê o ônibus passar.': {es:'Riesgo de emboscada en la ruta: {nome} ve pasar el micro.', en:'Ambush risk on the road: {nome} sees the bus go by.'},
    'Viagem': {es:'Viaje', en:'Trip'},
    'O jogo é na nossa cidade: não tem estrada.': {es:'El partido es en nuestra ciudad: no hay ruta.', en:'The game is in our city: no road trip.'},
    'Destino': {es:'Destino', en:'Destination'},
    'Vão na caravana': {es:'Van en la caravana', en:'Travelling'},
    'Custo': {es:'Costo', en:'Cost'},
    'De avião': {es:'En avión', en:'By plane'},
    'Estrada': {es:'Ruta', en:'Road'},
    'Jogo em {cidade}. A caravana se decide na semana do jogo.': {es:'Partido en {cidade}. La caravana se decide en la semana del partido.', en:'Game in {cidade}. The trip is decided in the week of the game.'},
    'Agenda de jogos': {es:'Agenda de partidos', en:'Fixtures'},
    'A temporada ainda não começou.': {es:'La temporada todavía no empezó.', en:"The season hasn't started yet."},
    'C': {es:'L', en:'H'}, 'F': {es:'V', en:'A'},
    'Classificação': {es:'Clasificación', en:'League table'},
    'Sem liga em andamento.': {es:'No hay liga en curso.', en:'No league in progress.'},
    'Clube': {es:'Club', en:'Club'},
    'Jogos': {es:'Partidos', en:'Played'}, 'Vitórias': {es:'Victorias', en:'Wins'}, 'Empates': {es:'Empates', en:'Draws'},
    'Derrotas': {es:'Derrotas', en:'Losses'}, 'Saldo de gols': {es:'Diferencia de gol', en:'Goal difference'}, 'Pontos': {es:'Puntos', en:'Points'},
    'Finanças': {es:'Finanzas', en:'Finances'},
    'Saldo da semana': {es:'Saldo de la semana', en:'Weekly balance'},
    'Compromissos da semana (caravana, recepção e outros): {v}': {es:'Compromisos de la semana (caravana, recepción y otros): {v}', en:'This week\'s commitments (trip, hosting and others): {v}'},
    '{n} dias no vermelho.': {es:'{n} días en rojo.', en:'{n} days in the red.'},
    'Patrimônio': {es:'Patrimonio', en:'Assets'},
    'A torcida ainda não tem patrimônio.': {es:'La barra todavía no tiene patrimonio.', en:'The firm has no assets yet.'},
    'Sede': {es:'Sede', en:'HQ'}, 'Bar': {es:'Bar', en:'Bar'}, 'Loja': {es:'Tienda', en:'Shop'}, 'Subsede': {es:'Subsede', en:'Branch'},
    'Subsede de fora': {es:'Subsede de afuera', en:'Out-of-town branch'}, 'Fábrica': {es:'Fábrica', en:'Factory'},
    'sem insumo': {es:'sin insumo', en:'no supplies'},
    'corta o custo das lojas': {es:'baja el costo de las tiendas', en:'cuts shop costs'},
    'Por semana': {es:'Por semana', en:'Per week'}, 'Rende': {es:'Rinde', en:'Earns'}, 'Custa': {es:'Cuesta', en:'Costs'},
    'Saldo': {es:'Saldo', en:'Net'}, 'Total': {es:'Total', en:'Total'},
    'Elenco da torcida': {es:'Plantel de la barra', en:'Firm roster'},
    'Feridos': {es:'Heridos', en:'Injured'}, 'Presos': {es:'Presos', en:'Jailed'},
    'Os mais fortes': {es:'Los más fuertes', en:'The strongest'},
    'ferido': {es:'herido', en:'injured'}, 'preso': {es:'preso', en:'jailed'},
    'Força': {es:'Fuerza', en:'Strength'}, 'Defesa': {es:'Defensa', en:'Defence'},
    'Aliados e rivais': {es:'Aliados y rivales', en:'Allies and rivals'},
    'Aliados': {es:'Aliados', en:'Allies'}, 'Rivais': {es:'Rivales', en:'Rivals'},
    'Nenhum aliado por enquanto.': {es:'Ningún aliado por ahora.', en:'No allies for now.'},
    'Nenhum rival declarado.': {es:'Ningún rival declarado.', en:'No declared rivals.'},
    'Não deu pra montar este bloco.': {es:'No se pudo armar este bloque.', en:"Couldn't build this block."},
    '1 aguardando resposta': {es:'1 esperando respuesta', en:'1 awaiting reply'},
    '{n} aguardando resposta': {es:'{n} esperando respuesta', en:'{n} awaiting reply'},
    'Mensagens': {es:'Mensajes', en:'Messages'},
    'Caixa de entrada': {es:'Bandeja de entrada', en:'Inbox'},
    'Nenhuma mensagem por enquanto. Os dias seguem passando.': {es:'Ningún mensaje por ahora. Los días siguen pasando.', en:'No messages for now. The days keep passing.'}
  });
})();
