/* =========================================================
   MAIN — casca de gestão e o ciclo do dia de jogo
   Fecha o loop do GDD §25 Fase 1: membros reais viram discos,
   e as baixas voltam como fichas vermelhas na lista.
   ========================================================= */
(function(){
  const U = TO.util;
  const $ = id => document.getElementById(id);
  const E = () => TO.estado.E;

  /* =======================================================
     INDICADORES 0–20 (GDD §12)
     ======================================================= */
  const FAIXAS = {
    moral:     [[4,'Revoltado','#d9705f'],[9,'Desanimado','#c8a03c'],
                [14,'Firme','#8b867d'],[20,'Empolgado','#7fc2a0']],
    satisfacao:[[4,'Revoltado','#d9705f'],[9,'Desanimado','#c8a03c'],
                [14,'Contente','#8b867d'],[20,'Muito contente','#7fc2a0']],
    prestigio: [[4,'Ninguém','#d9705f'],[9,'Conhecida','#c8a03c'],
                [14,'Respeitada','#8b867d'],[20,'Temida','#7fc2a0']],
    policia:   [[4,'Caçada','#d9705f'],[9,'Vigilância','#c8a03c'],
                [14,'Neutro','#8b867d'],[20,'Apoio','#7fc2a0']]
  };
  const ROTULO = {moral:'Moral', satisfacao:'Satisfação',
                  prestigio:'Prestígio', policia:'Polícia'};

  function faixaDe(chave, v){
    for(const [ate,nome,cor] of FAIXAS[chave]) if(v<=ate) return {nome,cor};
    return {nome:'—',cor:'#8b867d'};
  }

  function pintarIndicadores(){
    const cx = $('indicadores');
    cx.innerHTML = '';
    for(const k of Object.keys(ROTULO)){
      const v = E().indicadores[k];
      const f = faixaDe(k, v);
      cx.appendChild(U.criar('div',{class:'indicador', html:
        `<div class="rot">${ROTULO[k]}<b>${v.toFixed(0)}/20</b></div>
         <div class="barra"><i style="width:${v/20*100}%;background:${f.cor}"></i></div>
         <div class="faixa" style="color:${f.cor}">${f.nome}</div>`}));
    }
  }

  function pintarTopo(){
    const e = E();
    $('nomeTorcida').textContent = e.torcida.nome;
    $('subIdentidade').textContent =
      `${e.torcida.time} · ${e.torcida.cidade} · sede nível ${e.torcida.sedeNivel}`;
    const cx = $('caixa');
    cx.textContent = U.dinheiro(e.dinheiro);
    cx.className = e.dinheiro < 0 ? 'negativo' : '';
    $('dataAtual').textContent = `S${e.data.semana} · dia ${e.data.dia}`;
    const maxAcoes = e.torcida.sedeNivel >= 3 ? 3 : 2;   // GDD §3.1
    $('acoesRestantes').textContent = `${maxAcoes - e.acoes.usadas}/${maxAcoes}`;
    pintarIndicadores();
  }

  /* =======================================================
     ABAS
     ======================================================= */
  const ABAS = [
    {id:'sede',       rot:'Sede',       sub:'treino, semana'},
    {id:'torcida',    rot:'Torcida',    sub:'membros'},
    {id:'financeiro', rot:'Financeiro', sub:'caixa'},
    {id:'calendario', rot:'Calendário', sub:'dia de jogo'}
  ];
  function montarAbas(){
    const nav = $('abas');
    nav.innerHTML = '';
    for(const a of ABAS){
      const b = U.criar('button',{class:'aba-bt','data-aba':a.id,
        html:`${a.rot}<small>${a.sub}</small>`});
      b.onclick = ()=>trocarAba(a.id);
      nav.appendChild(b);
    }
    trocarAba('torcida');
  }
  function trocarAba(id){
    U.$$('.aba').forEach(s=>s.classList.toggle('on', s.dataset.aba===id));
    U.$$('.aba-bt').forEach(b=>b.classList.toggle('on', b.dataset.aba===id));
  }

  /* =======================================================
     LISTA DE MEMBROS (GDD §5.7)
     ======================================================= */
  let busca = '', ordem = {col:'xp', dir:-1};

  const COLUNAS = [
    {k:'nome',   rot:'Nome',   num:false},
    {k:'cargo',  rot:'Cargo',  num:false},
    {k:'forca',  rot:'Força',  num:true},
    {k:'defesa', rot:'Defesa', num:true},
    {k:'moral',  rot:'Moral',  num:true},
    {k:'xp',     rot:'XP',     num:true},
    {k:'situacao', rot:'Situação', num:false}
  ];

  function valorCol(m, k){
    switch(k){
      case 'nome':  return TO.membros.nomeDe(m).toLowerCase();
      case 'cargo': return TO.membros.CARGOS[m.cargo].ordem;
      case 'situacao': return m.preso?2 : m.ferido?1 : 0;
      default: return m[k];
    }
  }

  /* Barra polimorfa: uma só, aceita nome, cargo, arquétipo ou situação */
  function combina(m, termo){
    if(!termo) return true;
    const t = termo.toLowerCase();
    const sit = m.preso?'preso' : m.ferido?'ferido' : 'apto';
    return TO.membros.nomeDe(m).toLowerCase().includes(t)
        || TO.membros.CARGOS[m.cargo].nome.toLowerCase().includes(t)
        || (m.arquetipo||'').includes(t)
        || sit.includes(t);
  }

  function pintarMembros(){
    const e = E();
    const c = TO.membros.contar(e);
    $('tagMembros').textContent =
      `${c.total}/${TO.membros.capacidade(e)} · ${c.aptos} aptos · `+
      `${c.feridos} feridos · ${c.presos} presos`;

    const lista = e.membros.filter(m=>combina(m,busca)).sort((a,b)=>{
      const va=valorCol(a,ordem.col), vb=valorCol(b,ordem.col);
      if(va<vb) return -ordem.dir;
      if(va>vb) return ordem.dir;
      return 0;
    });

    const tab = U.criar('table',{class:'membros'});
    const thead = U.criar('thead');
    const tr = U.criar('tr');
    for(const col of COLUNAS){
      const seta = ordem.col===col.k ? (ordem.dir<0?' ▼':' ▲') : '';
      const th = U.criar('th',{html:`${col.rot}<span class="seta">${seta}</span>`});
      /* ordenação tri-state: desc → asc → desligado */
      th.onclick = ()=>{
        if(ordem.col!==col.k){ ordem={col:col.k, dir:-1}; }
        else if(ordem.dir===-1){ ordem.dir=1; }
        else { ordem={col:'xp', dir:-1}; }
        pintarMembros();
      };
      tr.appendChild(th);
    }
    thead.appendChild(tr); tab.appendChild(thead);

    const tb = U.criar('tbody');
    for(const m of lista){
      const sit = m.preso ? `Preso · fiança ${U.dinheiro(TO.membros.fianca(m))}`
                : m.ferido ? `Ferido · ${m.ferido.dias} dias`
                : m.naFila ? 'Na fila de treino' : 'Apto';
      const linha = U.criar('tr',{class: m.preso?'preso' : m.ferido?'ferido' : ''});
      linha.innerHTML =
        `<td>${TO.membros.nomeDe(m)}${m.veterano?' <span class="tag">vet</span>':''}</td>
         <td>${TO.membros.CARGOS[m.cargo].nome}</td>
         <td class="num">${m.forca}</td>
         <td class="num">${m.defesa}</td>
         <td class="num">${m.moral.toFixed(0)}</td>
         <td class="num">${m.xp}</td>
         <td>${sit}</td>`;
      linha.onclick = ()=>abrirFicha(m);
      linha.style.cursor='pointer';
      tb.appendChild(linha);
    }
    tab.appendChild(tb);
    $('tabelaMembros').innerHTML=''; $('tabelaMembros').appendChild(tab);
  }

  function abrirFicha(m){
    const acoes = [];
    if(m.preso) acoes.push(['Pagar fiança', ()=>{
      const r = TO.membros.resgatar(E(), m);
      if(!r.ok) aviso(r.motivo,'ruim'); else aviso(`${TO.membros.nomeDe(m)} está solto`,'boa');
      redesenhar();
    }]);
    if(TO.membros.disponivel(m)) acoes.push([m.naFila?'Tirar da fila':'Treinar (fila)', ()=>{
      m.naFila = !m.naFila; redesenhar();
    }]);
    const p = TO.membros.podePromover(E(), m);
    acoes.push([p.ok?`Promover (${U.dinheiro(p.custo||0)})`:`Promover — ${p.motivo}`, ()=>{
      const r = TO.membros.promover(E(), m);
      aviso(r.ok ? (r.veterano?`${TO.membros.nomeDe(m)} virou Veterano`
                              :`${TO.membros.nomeDe(m)} promovido`)
                 : r.motivo, r.ok?'boa':'ruim');
      redesenhar();
    }, !p.ok && !p.veterano]);

    const corpo = U.criar('div');
    corpo.innerHTML =
      `<div class="linha-dado"><span>Cargo</span><b>${TO.membros.CARGOS[m.cargo].nome}</b></div>
       <div class="linha-dado"><span>Força / Defesa</span><b>${m.forca} / ${m.defesa}</b></div>
       <div class="linha-dado"><span>XP</span><b>${m.xp}</b></div>
       <div class="linha-dado"><span>Moral</span><b>${m.moral.toFixed(1)}</b></div>
       <div class="linha-dado"><span>Arquétipo</span><b>${m.arquetipo}</b></div>
       <div class="linha-dado"><span>Mensalidade</span><b>${U.dinheiro(TO.membros.CARGOS[m.cargo].mensalidade)}</b></div>`;
    if(m.historico.length){
      corpo.appendChild(U.criar('h2',{texto:'Histórico', estilo:{marginTop:'12px'}}));
      for(const h of m.historico.slice(-6))
        corpo.appendChild(U.criar('div',{class:'transacao', html:`<span class="desc">${h}</span>`}));
    }
    modal(TO.membros.nomeDe(m), m.arquetipo, corpo, acoes);
  }

  /* =======================================================
     MODAL GENÉRICO
     ======================================================= */
  function modal(titulo, sub, corpo, acoes){
    const fundo = U.criar('div',{class:'tela-cheia'});
    const m = U.criar('div',{class:'moldura estreita'});
    const h = U.criar('header',{html:`<h2>${titulo}</h2><span>${sub||''}</span>`});
    const d = U.criar('div'); d.appendChild(corpo);
    const f = U.criar('footer');
    for(const [rot, fn, desab] of (acoes||[])){
      const b = U.criar('button',{class:'bt', texto:rot});
      b.disabled = !!desab;
      b.onclick = ()=>{ fn(); fundo.remove(); };
      f.appendChild(b);
    }
    const fechar = U.criar('button',{class:'bt destaque', texto:'Fechar'});
    fechar.onclick = ()=>fundo.remove();
    f.appendChild(fechar);
    m.append(h,d,f); fundo.appendChild(m); document.body.appendChild(fundo);
  }

  function aviso(txt, tipo){
    const n = U.criar('div',{class:'nota '+(tipo||''),
      html:`<small>${E().data.semana}/${E().data.dia}</small>${txt}`});
    $('notificacoes').appendChild(n);
    setTimeout(()=>n.remove(), 4200);
  }

  /* =======================================================
     SEDE
     ======================================================= */
  function pintarSede(){
    const e = E();
    const c = TO.membros.contar(e);
    const cap = TO.membros.capTreino(e);
    $('tagSede').textContent = `Nível ${e.torcida.sedeNivel}`;
    $('resumoSede').innerHTML =
      `<div class="linha-dado"><span>Membros</span><b>${c.total} / ${TO.membros.capacidade(e)}</b></div>
       <div class="linha-dado"><span>Diretoria</span><b>${c.diretoria} / ${TO.membros.capDiretoria(e)}</b></div>
       <div class="linha-dado"><span>Linha de Frente</span><b>${c.frente}</b></div>
       <div class="linha-dado"><span>Componentes</span><b>${c.componente}</b></div>
       <div class="linha-dado"><span>Novatos</span><b>${c.novato}</b></div>
       <div class="linha-dado"><span>Treino por dia</span><b>${cap}</b></div>`;

    const fila = e.membros.filter(m=>m.naFila && TO.membros.disponivel(m));
    const cx = $('filaTreino'); cx.innerHTML='';
    if(!fila.length){
      cx.innerHTML = `<div class="linha-dado"><span class="fraco">`+
        `Ninguém na fila. Clique num membro na aba Torcida para escalar o treino.</span></div>`;
    } else {
      for(const m of fila.slice(0,cap*2)){
        cx.appendChild(U.criar('div',{class:'item'+(fila.indexOf(m)<cap?' meu':''), html:
          `<div class="l1"><span class="nm">${TO.membros.nomeDe(m)}</span>
             <span class="qt">${m.forca}/${m.defesa}</span></div>
           <div class="l2">${fila.indexOf(m)<cap?'treina hoje':'aguarda vaga'} · `+
          `frações ${m.fracForca.toFixed(2)} / ${m.fracDefesa.toFixed(2)}</div>`}));
      }
    }
    const bt = U.criar('button',{class:'bt destaque', texto:`Treinar (${Math.min(fila.length,cap)})`,
      estilo:{width:'100%',marginTop:'8px'}});
    bt.disabled = !fila.length;
    bt.onclick = ()=>{
      const n = TO.membros.treinarFila(e);
      aviso(`${n} treinaram.`,'boa');
      TO.estado.avancarDia();
    };
    cx.appendChild(bt);

    $('planoSemana').innerHTML =
      `<div class="linha-dado"><span>Semana</span><b>${e.data.semana}</b></div>
       <div class="linha-dado"><span>Dia</span><b>${e.data.dia} de 7</b></div>
       <div class="linha-dado"><span class="fraco">O jogo é no dia 6. `+
      `Distribuição de ações e eventos entram na próxima etapa.</span></div>`;

    $('listaPatrimonio').innerHTML =
      `<div class="linha-dado"><span>Bombas</span><b>${e.estoque.bombas}</b></div>
       <div class="linha-dado"><span>Rojões</span><b>${e.estoque.rojoes}</b></div>
       <div class="linha-dado"><span>Sinalizadores</span><b>${e.estoque.sinalizadores}</b></div>
       <div class="linha-dado"><span class="fraco">Bares, lojas e subsedes: Fase 2 (GDD §8.3).</span></div>`;
  }

  /* =======================================================
     FINANCEIRO
     ======================================================= */
  function pintarFinanceiro(){
    const e = E();
    let mensal = 0;
    for(const m of e.membros) mensal += TO.membros.CARGOS[m.cargo].mensalidade;
    $('projecao').innerHTML =
      `<div class="linha-dado"><span>Mensalidades</span><b class="positivo">${U.dinheiro(mensal)}</b></div>
       <div class="linha-dado"><span>Manutenção da sede</span><b class="negativo">${U.dinheiro(-200)}</b></div>
       <div class="linha-dado"><span>Saldo mensal</span><b>${U.dinheiro(mensal-200)}</b></div>
       <div class="linha-dado"><span class="fraco">Bar, loja e insumos entram com o patrimônio.</span></div>`;

    const cx = $('transacoes'); cx.innerHTML='';
    if(!e.transacoes.length) cx.innerHTML='<div class="linha-dado"><span class="fraco">Nada ainda.</span></div>';
    for(const t of e.transacoes.slice(0,40)){
      cx.appendChild(U.criar('div',{class:'transacao', html:
        `<span class="dia">${t.dia}</span><span class="desc">${t.descricao}</span>`+
        `<span class="val ${t.valor<0?'negativo':t.valor>0?'positivo':''}">`+
        `${t.valor?U.dinheiro(t.valor):'—'}</span>`}));
    }
  }

  /* =======================================================
     CALENDÁRIO E DIA DE JOGO
     ======================================================= */
  function pintarCalendario(){
    const e = E();
    const cx = $('listaDias'); cx.innerHTML='';
    for(let d=1; d<=7; d++){
      const ehJogo = d===6;
      cx.appendChild(U.criar('div',{class:'item'+(d===e.data.dia?' chegou':'')+(ehJogo?' meu':''), html:
        `<div class="l1"><span class="nm">Dia ${d}</span>
           <span class="qt">${ehJogo?'DIA DE JOGO':''}</span></div>
         <div class="l2">${d<e.data.dia?'passou':d===e.data.dia?'hoje':'à frente'}</div>`}));
    }
    const bt = U.criar('button',{class:'bt destaque', texto:'Sair pro estádio',
      estilo:{width:'100%',marginTop:'8px'}});
    bt.onclick = abrirEscalacao;
    cx.appendChild(bt);
    const av = U.criar('button',{class:'bt', texto:'Avançar um dia',
      estilo:{width:'100%',marginTop:'6px'}});
    av.onclick = ()=>{ TO.estado.avancarDia(); aviso('Um dia se passou.'); };
    cx.appendChild(av);

    const h = $('tabelaCampeonato'); h.innerHTML='';
    if(!e.historicoNoites.length){
      h.innerHTML='<div class="linha-dado"><span class="fraco">Nenhuma noite ainda.</span></div>';
    } else {
      for(const n of e.historicoNoites.slice(0,12)){
        h.appendChild(U.criar('div',{class:'linha-dado', html:
          `<span>Semana ${n.semana}</span>`+
          `<b class="${n.prestigio>=0?'positivo':'negativo'}">`+
          `${n.prestigio>0?'+':''}${n.prestigio} prestígio</b>`+
          `<span class="fraco">${n.entraram} entraram · ${n.feridos} feridos · ${n.presos} presos</span>`}));
      }
    }
  }

  /* ---------- escalação ---------- */
  let escalados = new Set();

  function abrirEscalacao(){
    const aptos = TO.membros.aptosParaOEstadio(E());
    if(aptos.length < 4){ aviso('Gente apta de menos pra sair.','ruim'); return; }
    escalados = new Set(aptos.map(m=>m.id));
    pintarEscalacao(aptos);
    $('telaEscalacao').classList.remove('oculto');
  }

  function pintarEscalacao(aptos){
    $('subEscalacao').textContent =
      `${aptos.length} aptos · quem for escalado vira disco na cena, e o que ` +
      `acontecer com ele volta pra ficha`;
    const cx = $('corpoEscalacao'); cx.innerHTML='';

    const topo = U.criar('div',{class:'linha-dado', html:
      `<span>Escalados</span><b id="contaEscalados">${escalados.size}</b>`});
    cx.appendChild(topo);

    const btTodos = U.criar('button',{class:'bt', texto:'Alternar todos',
      estilo:{marginBottom:'8px'}});
    btTodos.onclick = ()=>{
      if(escalados.size) escalados.clear();
      else aptos.forEach(m=>escalados.add(m.id));
      pintarEscalacao(aptos);
    };
    cx.appendChild(btTodos);

    for(const m of aptos.sort((a,b)=>b.xp-a.xp)){
      const on = escalados.has(m.id);
      const it = U.criar('div',{class:'item'+(on?' meu':''), html:
        `<div class="l1"><span class="nm">${TO.membros.nomeDe(m)}</span>
           <span class="qt">${on?'VAI':'fica'}</span></div>
         <div class="l2">${TO.membros.CARGOS[m.cargo].nome} · `+
        `${m.forca}/${m.defesa} · moral ${m.moral.toFixed(0)} · ${m.xp} XP</div>`});
      it.style.cursor='pointer';
      it.onclick = ()=>{
        if(escalados.has(m.id)) escalados.delete(m.id); else escalados.add(m.id);
        pintarEscalacao(aptos);
      };
      cx.appendChild(it);
    }
  }

  function comecarDiaDeJogo(){
    const lista = E().membros.filter(m=>escalados.has(m.id));
    if(lista.length < 2){ aviso('Escale pelo menos dois.','ruim'); return; }

    $('telaEscalacao').classList.add('oculto');
    $('telaDiaJogo').classList.remove('oculto');
    TO.estado.bloquear(true);          // GDD §23.1

    TO.diaJogo.ponte.montar({
      canvas: $('djPrincipal'),
      config: { escalacao: lista },
      aoTerminar: fecharDiaDeJogo
    });
  }

  function fecharDiaDeJogo(res){
    TO.estado.bloquear(false);
    const resumo = TO.membros.aplicarResultadoDaNoite(E(), res);
    setTimeout(()=>{
      $('telaDiaJogo').classList.add('oculto');
      mostrarRelatorio(res, resumo);
    }, 1400);
  }

  function mostrarRelatorio(res, resumo){
    $('subRelatorio').textContent = res.motivo;
    const cx = $('corpoRelatorio');
    cx.innerHTML =
      `<div class="linha-dado"><span>Prestígio da noite</span>
         <b class="${res.prestigio>=0?'positivo':'negativo'}">${res.prestigio>0?'+':''}${res.prestigio}</b></div>
       <div class="linha-dado"><span>Caídos deles / seus</span>
         <b>${res.caidosVisitante} / ${res.caidosMandante}</b></div>
       <div class="linha-dado"><span>Entraram no estádio</span>
         <b>${resumo.entraram.length}</b></div>
       <div class="linha-dado"><span>XP distribuído</span><b>${resumo.xpTotal}</b></div>
       <div class="linha-dado"><span>Grade rompida</span><b>${res.rompido?'sim':'não'}</b></div>`;

    if(resumo.feridos.length){
      cx.appendChild(U.criar('h2',{texto:`Feridos — ${TO.membros.DIAS_FERIDO} dias fora`,
        estilo:{marginTop:'14px'}}));
      for(const m of resumo.feridos)
        cx.appendChild(U.criar('div',{class:'item ferido', html:
          `<div class="l1"><span class="nm">${TO.membros.nomeDe(m)}</span>
             <span class="qt">${TO.membros.CARGOS[m.cargo].nome}</span></div>`}));
    }
    if(resumo.presos.length){
      cx.appendChild(U.criar('h2',{texto:'Presos', estilo:{marginTop:'14px'}}));
      for(const m of resumo.presos)
        cx.appendChild(U.criar('div',{class:'item preso', html:
          `<div class="l1"><span class="nm">${TO.membros.nomeDe(m)}</span>
             <span class="qt">fiança ${U.dinheiro(TO.membros.fianca(m))}</span></div>`}));
    }
    if(!resumo.feridos.length && !resumo.presos.length)
      cx.appendChild(U.criar('div',{class:'linha-dado',
        html:'<span class="fraco">Ninguém ficou pra trás.</span>'}));

    $('telaRelatorio').classList.remove('oculto');
  }

  /* =======================================================
     REDESENHO
     ======================================================= */
  function redesenhar(){
    if(!E()) return;
    pintarTopo(); pintarMembros(); pintarSede();
    pintarFinanceiro(); pintarCalendario();
  }

  /* =======================================================
     TICKER
     ======================================================= */
  function ticker(){
    const fita = $('tickerFita');
    const frases = [
      'Membros reais viram discos no dia de jogo.',
      'Quem cai volta como Ferido por 30 dias; quem é preso precisa de fiança.',
      'A cena dos arredores roda sobre foto, com malha de caminhabilidade.',
      'F2 na cena abre o editor.'
    ];
    fita.innerHTML = frases.map((f,i)=>
      `<span class="${i===0?'destaque':''}">${f}</span>`).join('');
    let x = window.innerWidth;
    setInterval(()=>{
      x -= 0.7;
      if(x < -fita.scrollWidth) x = window.innerWidth;
      fita.style.transform = `translateX(${x - window.innerWidth}px)`;
    }, 16);
  }

  /* =======================================================
     PARTIDA
     ======================================================= */
  function comecar(estadoExistente){
    if(!estadoExistente) TO.estado.novo({});
    $('telaInicio').classList.add('oculto');
    montarAbas();
    redesenhar();
  }

  function montarInicio(){
    $('corpoInicio').innerHTML =
      `<div class="linha-dado"><span>Vertical slice</span>
         <b>uma torcida, um rival, uma noite</b></div>
       <div class="linha-dado"><span class="fraco">
         Escale os membros, saia pro estádio e veja as baixas voltarem
         como fichas na lista. É a costura do GDD §25.</span></div>`;
    $('btNovaPartida').onclick = ()=>comecar(false);
    const bc = $('btContinuar');
    bc.disabled = !TO.estado.existeSave();
    bc.onclick = ()=>{ comecar(!!TO.estado.carregar()); };
    $('btImportar').onclick = ()=>$('arquivoSave').click();
    $('arquivoSave').onchange = ev=>{
      const f = ev.target.files[0];
      if(f) TO.estado.importar(f, r=>{
        if(r.ok) comecar(true); else alert('Não deu pra importar: '+r.motivo);
      });
    };
  }

  /* =======================================================
     LIGAÇÃO
     ======================================================= */
  TO.estado.aoMudar(redesenhar);
  U.$('#buscaMembros').oninput = ev=>{ busca = ev.target.value; pintarMembros(); };
  $('btConfirmarEscalacao').onclick = comecarDiaDeJogo;
  $('btCancelarEscalacao').onclick = ()=>$('telaEscalacao').classList.add('oculto');
  $('btFecharRelatorio').onclick = ()=>{
    $('telaRelatorio').classList.add('oculto');
    TO.estado.avancarDia();
    TO.estado.salvar();
  };

  /* atalhos globais de save */
  addEventListener('keydown', ev=>{
    if(!E()) return;
    if(ev.ctrlKey && ev.key==='s'){
      ev.preventDefault();
      const r = TO.estado.salvar();
      aviso(r.ok?'Salvo.':'Não salvou: '+r.motivo, r.ok?'boa':'ruim');
    }
  });

  montarInicio();
  ticker();
})();
