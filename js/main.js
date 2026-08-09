/* =========================================================
   MAIN — menu, seleção de torcida e as telas de gestão
   Visual segue os mockups em img/cenas/.
   ========================================================= */
(function(){
  const U = TO.util, IC = TO.icones;
  const $ = id => document.getElementById(id);
  const E = () => TO.estado.E;
  const el = (t,p,f)=>U.criar(t,p,f);

  /* =======================================================
     PEÇAS REUSADAS
     ======================================================= */
  function escudo(cores, sigla, classe){
    const [a,b] = cores || ['#9d2222','#e8e8e8'];
    const s = el('span',{class:'escudo '+(classe||''), texto:sigla||''});
    s.style.background = `linear-gradient(135deg, ${a} 0 52%, ${b} 52% 100%)`;
    s.style.textShadow = '0 1px 3px rgba(0,0,0,.85)';
    return s;
  }

  function cartao(titulo, conta){
    const c = el('div',{class:'cartao'});
    if(titulo){
      c.appendChild(el('h2',{html:
        `${titulo}${conta?`<span class="conta">${conta}</span>`:''}`}));
    }
    const corpo = el('div',{class:'corpo'});
    c.appendChild(corpo);
    c.corpo = corpo;
    c.rodape = (...bts)=>{
      const r = el('div',{class:'rodape'});
      bts.forEach(b=>b && r.appendChild(b));
      c.appendChild(r); return c;
    };
    return c;
  }

  function medida(valor, max){
    const p = U.limitar(valor/max, 0, 1);
    const cls = p>0.66?'' : p>0.33?'media':'baixa';
    return `<span class="medida ${cls}"><span class="n">${Math.round(valor)}</span>
      <span class="barra"><i style="width:${p*100}%"></i></span></span>`;
  }

  function subabas(itens, atual, aoTrocar){
    const cx = el('div',{class:'subabas'});
    for(const it of itens){
      const b = el('button',{texto:it.rot});
      b.classList.toggle('on', it.id===atual);
      b.disabled = !!it.desabilitada;
      b.onclick = ()=>aoTrocar(it.id);
      cx.appendChild(b);
    }
    return cx;
  }

  function emConstrucao(titulo, texto){
    const c = cartao(titulo);
    c.corpo.innerHTML = `<div class="em-construcao"><b>${titulo}</b>${texto}</div>`;
    return c;
  }

  function aviso(txt, tipo){
    const cx = $('notificacoes');
    const n = el('div',{class:'nota '+(tipo||''),
      html:`<small>${TO.estado.dataTexto().curta}</small>${txt}`});
    cx.appendChild(n);
    /* pilha curta: aviso que cobre a tela inteira não é aviso, é estorvo */
    while(cx.children.length > 4) cx.firstChild.remove();
    setTimeout(()=>n.remove(), 4200);
  }

  /* =======================================================
     MENU PRINCIPAL
     ======================================================= */
  function montarMenu(){
    const bc = $('btContinuar');
    bc.disabled = !TO.estado.existeSave();
    bc.onclick = ()=>{ if(TO.estado.carregar()) entrarNoJogo(); };
    $('btNovoJogo').onclick = abrirSelecao;
    $('btCarregar').onclick = ()=>$('arquivoSave').click();
    $('arquivoSave').onchange = ev=>{
      const f = ev.target.files[0];
      if(f) TO.estado.importar(f, r=>{
        if(r.ok) entrarNoJogo(); else alert('Não deu pra importar: '+r.motivo);
      });
    };
  }

  /* =======================================================
     SELEÇÃO DE TORCIDA
     ======================================================= */
  let filtroSel = 'todas', escolhida = null;

  let buscaSel = '';

  function abrirSelecao(){
    $('telaMenu').classList.add('oculto');
    $('telaSelecao').classList.remove('oculto');
    escolhida = TO.mundo.ficha(TO.mundo.jogaveis()[0]);
    pintarSelecao();
  }

  function pintarSelecao(){
    const fichas = TO.mundo.jogaveis().map(TO.mundo.ficha);
    const filtros = [{id:'todas', rot:'Todas'}]
      .concat(TO.mundo.divisoes().map(d=>({id:d, rot:d.replace('Brasileirão ','')})));

    const ab = $('abasSelecao'); ab.innerHTML='';
    ab.appendChild(subabas(filtros, filtroSel, id=>{filtroSel=id; pintarSelecao();}));

    const lista = fichas
      .filter(f=>filtroSel==='todas' || f.divisao===filtroSel)
      .filter(f=>!buscaSel || (f.nome+f.clube+f.cidade).toLowerCase()
                                .includes(buscaSel.toLowerCase()))
      .sort((a,b)=>b.membros-a.membros);

    $('contaTorcidas').textContent = `${lista.length} de ${fichas.length}`;
    $('subSelecao').textContent =
      `${fichas.length} torcidas · ${TO.mundo.todosTimes.length} clubes · `+
      `${TO.mundo.todasCidades.length} cidades`;

    const cx = $('listaTorcidas'); cx.innerHTML='';
    const bs = el('input',{class:'busca', type:'search',
      placeholder:'torcida, clube ou cidade…', estilo:{margin:'9px'}});
    bs.value = buscaSel;
    bs.oninput = ev=>{ buscaSel = ev.target.value; pintarSelecao(); };
    cx.appendChild(bs);

    const rolo = el('div',{estilo:{maxHeight:'44vh', overflowY:'auto'}});
    for(const f of lista){
      const b = el('button',{class:'torcida-opcao'+
        (escolhida && f.id===escolhida.id ? ' on' : '')});
      b.appendChild(escudo(f.cores, TO.mundo.sigla(f)));
      b.appendChild(el('div',{html:
        `<div class="nm">${f.nome}</div>
         <div class="cid">${f.clube} · ${f.cidade} - ${f.uf}</div>`}));
      b.appendChild(el('span',{class:'qt-membros',
        html:`${U.numero(f.membros)}<small>membros</small>`}));
      b.onclick = ()=>{ escolhida = f; pintarSelecao(); };
      rolo.appendChild(b);
    }
    cx.appendChild(rolo);

    const cxF = $('fichaTorcida');
    if(!escolhida){ cxF.innerHTML=''; return; }
    const f = escolhida;
    cxF.innerHTML='';
    const cab = el('div',{class:'ficha-torcida'});
    cab.appendChild(escudo(f.cores, TO.mundo.sigla(f)));
    cab.appendChild(el('div',{html:
      `<h3>${f.nome}</h3>
       <span>${f.clube} · ${f.cidade} - ${f.uf} · fundada em ${f.fundacao}</span>`}));
    cxF.appendChild(cab);

    /* o efetivo que a torcida realmente tem, cargo a cargo (GDD §5.1) */
    const plano = TO.membros.planoDeCargos(f.membros, f.cargos);
    const nivelSede = Math.max(f.sedeNivel||1,
      TO.membros.nivelQueCabe(f.membros, (f.cargos||{}).diretoria || 0));
    const barras = el('div',{class:'hierarquia-fina'});
    for(const [cargo, n] of plano){
      barras.appendChild(el('div',{html:
        `<span>${TO.membros.CARGOS[cargo].nome}</span>
         <i style="width:${Math.round(n/f.membros*100)}%"></i>
         <b>${n}</b>`}));
    }
    cxF.appendChild(barras);

    cxF.appendChild(el('div',{class:'grade-atributos', html:
      `<div><span>Membros</span><b>${U.numero(f.membros)}</b></div>
       <div><span>Sede</span><b>nível ${nivelSede}</b></div>
       <div><span>Finanças</span><b>${U.dinheiro(f.dinheiro)}</b></div>
       <div><span>Prestígio</span><b>${f.prestigio}/100</b></div>
       <div><span>Influência</span><b class="positivo">${f.influencia}/100</b></div>
       <div><span>Territórios</span><b>${f.territorios}</b></div>
       <div><span>Rivalidade máxima</span><b>${f.rival}</b></div>
       <div><span>Bairro da sede</span><b>${f.bairroSede||'—'}</b></div>
       <div><span>Divisão</span><b>${f.divisao||'—'}</b></div>
       <div><span>Estádio</span><b>${f.estadio||'—'}</b></div>
       <div><span>Aliados / Rivais</span><b>${f.qtdAliados} / ${f.qtdRivais}</b></div>
       <div><span>Mapa da cidade</span><b>${f.grade[0]}×${f.grade[1]} quarteirões</b></div>`}));
  }

  /* =======================================================
     ENTRADA NO JOGO
     ======================================================= */
  const NAV = [
    {id:'inicio',      rot:'Início',      ic:'casa'},
    {id:'torcida',     rot:'Torcida',     ic:'torcida'},
    {id:'financeiro',  rot:'Financeiro',  ic:'dinheiro'},
    {id:'gestao',      rot:'Gestão',      ic:'conversa'},
    {id:'mapa',        rot:'Mapa',        ic:'mapa'},
    {id:'calendario',  rot:'Calendário',  ic:'jornal'},
    {id:'competicoes', rot:'Competições', ic:'trofeu'},
    {id:'diplomacia',  rot:'Diplomacia',  ic:'diplomacia'},
    {id:'whatsapp',    rot:'WhatsApp',    ic:'conversa'},
    {id:'noticias',    rot:'Notícias',    ic:'jornal'},
    {id:'conquistas',  rot:'Conquistas',  ic:'medalha'}
  ];
  let pagina = 'inicio';

  function entrarNoJogo(){
    $('telaMenu').classList.add('oculto');
    $('telaSelecao').classList.add('oculto');
    $('jogo').classList.remove('oculto');
    $('marcaIcone').innerHTML = IC.get('casa');
    $('btAvancar').innerHTML = IC.get('play');
    $('btAvancar').onclick = ()=>{ TO.estado.avancarDia(); };
    $('avancarFixo').classList.remove('oculto');
    $('avancarFixo').onclick = ()=>{ TO.estado.avancarDia(); };
    montarLateral();
    redesenhar();
    ticker();
  }

  function montarLateral(){
    const nav = $('lateral'); nav.innerHTML='';
    for(const n of NAV){
      const b = el('button',{class:'nav-item','data-pag':n.id,
        html:`${IC.get(n.ic)}<span>${n.rot}</span>`});
      b.onclick = ()=>{ pagina=n.id; redesenhar(); };
      nav.appendChild(b);
    }
  }

  function trocarPagina(){
    U.$$('.pagina').forEach(s=>s.classList.toggle('on', s.dataset.pag===pagina));
    U.$$('.nav-item').forEach(b=>b.classList.toggle('on', b.dataset.pag===pagina));
  }

  /* =======================================================
     CABEÇALHO
     ======================================================= */
  function pintarTopo(){
    const e = E();
    const dt = TO.estado.dataTexto();
    $('dataDia').textContent = dt.curta;
    $('dataSemana').textContent = dt.semana;

    const esc = $('escudoTorcida');
    const [a,b] = e.torcida.cores;
    esc.textContent = e.torcida.sigla;
    esc.style.background = `linear-gradient(135deg, ${a} 0 52%, ${b} 52% 100%)`;
    esc.style.textShadow = '0 1px 3px rgba(0,0,0,.85)';

    $('nomeTorcida').textContent = e.torcida.nome;
    $('subIdentidade').textContent = `${e.torcida.cidade} - ${e.torcida.uf}`;

    const c = TO.membros.contar(e);
    const ind = [
      ['dinheiro', U.dinheiro(e.dinheiro), 'Saldo', e.dinheiro<0],
      ['membros',  U.numero(c.total),      'Membros', false],
      ['estrela',  Math.round(e.indicadores.prestigio*5), 'Prestígio', false]
    ];
    const cx = $('blocoIndicadores'); cx.innerHTML='';
    for(const [ic, valor, rot, ruim] of ind){
      cx.appendChild(el('div',{class:'indicador', html:
        `<span class="ic">${IC.get(ic)}</span>
         <div><b class="${ruim?'negativo':''}">${valor}</b><small>${rot}</small></div>`}));
    }
  }

  /* =======================================================
     INÍCIO
     ======================================================= */
  function pintarInicio(){
    const e = E(), pg = U.$('.pagina[data-pag="inicio"]');
    pg.innerHTML='';
    const grade = el('div',{class:'principal-lateral'});
    const esq = el('div'), dir = el('div');

    /* próximo jogo — pode não haver: folga na tabela (GDD §3.1) */
    const pj = e.proximoJogo;
    const j = (pj && pj.mandante && pj.visitante) ? pj : null;
    const dt = TO.estado.dataTexto();
    const cJogo = cartao('Próximo jogo',
      TO.competicoes.faseDaSemana(e.data.semana));
    if(j){
      cJogo.corpo.appendChild(el('div',{class:'competicao-rot',
        texto: j.fase ? `${j.competicao} · ${j.fase}` : j.competicao}));
      const conf = el('div',{class:'confronto'});
      for(const [lado,i] of [[j.mandante,0],[j.visitante,1]]){
        if(i===1) conf.appendChild(el('div',{class:'x', texto:'X'}));
        const bloco = el('div',{class:'lado'});
        bloco.appendChild(escudo(lado.cores, lado.sigla));
        bloco.appendChild(el('div',{class:'nome', texto:lado.nome}));
        conf.appendChild(bloco);
      }
      cJogo.corpo.appendChild(conf);
      cJogo.corpo.appendChild(el('div',{class:'confronto-info', html:
        `${dt.curta} · ${j.hora}<span class="local">${j.estadio}</span>`}));
    }else{
      cJogo.corpo.appendChild(el('div',{class:'em-construcao',
        html:'<b>Folga na tabela</b>O time não joga nesta semana. '+
             'Semana boa pra treinar, recrutar e resolver o que a rua deixou.'}));
    }
    const verCal = el('button',{class:'bt larga', texto:'Ver calendário'});
    verCal.onclick = ()=>{ pagina='calendario'; redesenhar(); };
    cJogo.rodape(verCal);
    esq.appendChild(cJogo);

    /* notícias */
    const cNot = cartao('Notícias');
    for(const n of (e.noticias||[])){
      cNot.corpo.appendChild(el('div',{class:'noticia', html:
        `<span class="data">${dt.curta.slice(0,5)}</span>
         <span class="txt">${n.txt}</span><span class="hora">${n.hora}</span>`}));
    }
    const verTodas = el('button',{class:'bt larga', texto:'Ver todas'});
    verTodas.onclick = ()=>{ pagina='noticias'; redesenhar(); };
    cNot.rodape(verTodas);
    esq.appendChild(cNot);

    /* avisos: o que está esperando decisão do jogador */
    const pend = TO.planejamento.pendencias(e);
    const cAv = cartao('Avisos', pend.length ? `${pend.length} pendentes` : 'tudo em dia');
    if(!pend.length){
      cAv.corpo.appendChild(el('div',{class:'linha-dado', html:
        '<span class="fraco">Nada esperando por você. Avance o dia.</span>'}));
    }
    for(const a of pend){
      const b = el('button',{class:'aviso-linha '+a.tipo, html:
        `<span class="pino"></span>
         <span class="txt"><span>${a.texto}</span><small>${a.detalhe}</small></span>`});
      b.onclick = ()=>{
        if(a.id==='acoes') abrirTodasAcoes();
        else { pagina = a.pagina; redesenhar(); }
      };
      cAv.corpo.appendChild(b);
    }
    dir.appendChild(cAv);

    /* resumo financeiro — o mesmo cálculo do fechamento (GDD §7) */
    const cx = TO.financeiro.contas(e);
    const cFin = cartao('Resumo da semana');
    cFin.corpo.innerHTML =
      `<div class="linha-dado"><span>Receitas</span>
         <b class="positivo">${U.dinheiro(cx.receita)}</b></div>
       <div class="linha-dado"><span>Despesas</span>
         <b class="negativo">${U.dinheiro(-cx.despesa)}</b></div>
       <div class="linha-dado"><span>Saldo previsto</span>
         <b class="${cx.saldo>=0?'positivo':'negativo'}">${U.dinheiro(cx.saldo)}</b></div>`
      + (TO.financeiro.precisaCaravana(e)
         ? `<div class="linha-dado"><span class="${TO.financeiro.temCaravana(e)?'':'fraco'}">`+
           `${TO.financeiro.temCaravana(e)?'Caravana para':'Viajar para'} `+
           `${e.proximoJogo.cidadeAdv}: ${U.dinheiro(TO.financeiro.CARAVANA)} `+
           `${TO.financeiro.temCaravana(e)?'na véspera':'se a torcida for'}.</span></div>` : '');
    const verFin = el('button',{class:'bt larga', texto:'Ver finanças'});
    verFin.onclick = ()=>{ pagina='financeiro'; redesenhar(); };
    cFin.rodape(verFin);
    dir.appendChild(cFin);

    dir.appendChild(cartaoAcoes());

    /* dia de jogo — a postura da semana decide se tem cena (GDD §3.2) */
    const cDJ = cartao('Dia de jogo',
      !j ? 'sem jogo' : j.casa ? 'em casa' : `fora · ${j.cidadeAdv||''}`);
    const P = TO.planejamento, pl = P.plano(e);
    cDJ.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span class="fraco">${!j ? 'o time não joga nesta semana'
        : TO.financeiro.precisaCaravana(e)
          ? `caravana para ${j.cidadeAdv}` : 'o bonde sai da sede'}</span>`}));
    cDJ.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span>Sai de casa</span><b>${j ? P.efetivoDaSaida(e) : 0}</b>`}));
    if(j) cDJ.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span>Plano</span><b>${pl.intencao==='atacar'?'atacar':'ir em paz'} · `+
      `${pl.bondes===1?'bonde único':pl.bondes+' bondes'}</b>`}));

    const vai = !!j;
    const btDJ = el('button',{class:'bt destaque larga',
      texto: vai ? 'Sair pro estádio' : 'Folga na tabela'});
    btDJ.disabled = !vai;
    btDJ.onclick = abrirEscalacao;
    cDJ.rodape(btDJ);
    dir.appendChild(cDJ);

    grade.append(esq, dir);
    pg.appendChild(grade);
  }

  /* =======================================================
     AÇÕES DA SEMANA (GDD §3.1 e §10)
     A ação indisponível não fica só cinza: ela diz por quê.
     ======================================================= */
  function linhaAcao(a, aoUsar){
    const e = E();
    const d = a.disponivel(e);
    const sobrou = TO.acoes.restantes(e) > 0;
    const b = el('button',{class:'acao-linha'});
    b.disabled = !d.ok || !sobrou;
    const sub = !d.ok    ? d.motivo
              : !sobrou  ? 'a semana acabou'
              : d.nota   ? `${a.efeito} · ${d.nota}`
              :            a.efeito;
    b.innerHTML =
      `<span class="ic">${IC.get(a.icone)}</span>
       <span class="txt"><span>${a.nome}</span><small>${sub}</small></span>
       ${a.custo?`<span class="custo">${U.dinheiro(-a.custo)}</span>`:''}`;
    b.onclick = ()=>{
      const r = TO.acoes.executar(e, a.id);
      aviso(r.msg || (r.ok?'Feito.':'Não deu.'),
            r.ok && r.tipo!=='ruim' ? 'boa' : 'ruim');
      aoUsar && aoUsar();
      redesenhar();
    };
    return b;
  }

  function cartaoAcoes(){
    const e = E();
    const max = TO.acoes.maximo(e), rest = TO.acoes.restantes(e);
    const c = cartao('Ações da semana', `${rest} de ${max}`);

    /* fichas: cheia é ação na mão, vazia é ação gasta */
    const f = el('div',{class:'fichas'});
    for(let i=0;i<max;i++) f.appendChild(el('i',{class:i<rest?'':'gasta'}));
    c.querySelector('h2').appendChild(f);

    if(!rest){
      c.corpo.appendChild(el('div',{class:'linha-dado', html:
        '<span class="fraco">Nada mais nesta semana. Avance os dias até o '+
        'fechamento.</span>'}));
    }
    /* as que dá pra fazer primeiro; o resto explica o bloqueio */
    const lista = [...TO.acoes.LISTA]
      .sort((a,b)=>(a.disponivel(e).ok?0:1) - (b.disponivel(e).ok?0:1));
    for(const a of lista.slice(0,5)) c.corpo.appendChild(linhaAcao(a));

    const bt = el('button',{class:'bt larga',
      texto:`Todas as ações (${TO.acoes.LISTA.length})`});
    bt.onclick = abrirTodasAcoes;
    c.rodape(bt);
    return c;
  }

  function abrirTodasAcoes(){
    const e = E();
    const corpo = el('div');
    let fechar = null;
    corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span>Ações restantes</span><b>${TO.acoes.restantes(e)} de ${TO.acoes.maximo(e)}</b>`}));
    for(const a of TO.acoes.LISTA)
      corpo.appendChild(linhaAcao(a, ()=>fechar && fechar()));
    fechar = modal('Ações da semana', `Semana ${e.data.semana} · dia ${e.data.dia}`, corpo);
  }

  /* ---------- relatório do fechamento (GDD §3.2 e §7) ---------- */
  function abrirFechamento(rel){
    const corpo = el('div',{class:'fecho'});

    const bloco = (titulo, itens, total, neg)=>{
      const d = el('div',{class:'col'});
      d.appendChild(el('h3',{texto:titulo}));
      if(!itens.length)
        d.appendChild(el('div',{class:'linha-dado', html:'<span class="fraco">nada</span>'}));
      for(const i of itens)
        d.appendChild(el('div',{class:'linha-dado', html:
          `<span>${i.rot}</span><b class="${neg?'negativo':'positivo'}">`+
          `${U.dinheiro(neg?-i.v:i.v)}</b>`}));
      d.appendChild(el('div',{class:'linha-dado total', html:
        `<span>Total</span><b class="${neg?'negativo':'positivo'}">`+
        `${U.dinheiro(neg?-total:total)}</b>`}));
      return d;
    };
    corpo.appendChild(bloco('Receitas', rel.receitas, rel.receita, false));
    corpo.appendChild(bloco('Despesas', rel.despesas, rel.despesa, true));

    const fim = el('div',{class:'col largo'});
    fim.appendChild(el('div',{class:'linha-dado total', html:
      `<span>Saldo da semana</span><b class="${rel.saldo>=0?'positivo':'negativo'}">`+
      `${U.dinheiro(rel.saldo)}</b>`}));
    fim.appendChild(el('div',{class:'linha-dado', html:
      `<span>Caixa</span><b class="${rel.caixaDepois<0?'negativo':''}">`+
      `${U.dinheiro(rel.caixaAntes)} → ${U.dinheiro(rel.caixaDepois)}</b>`}));
    if(rel.acoesSobrando)
      fim.appendChild(el('div',{class:'linha-dado', html:
        `<span>Ações não usadas</span><b>${rel.acoesSobrando}</b>`}));
    if(rel.promoveis)
      fim.appendChild(el('div',{class:'linha-dado', html:
        `<span>Prontos pra promoção</span><b class="positivo">${rel.promoveis}</b>`}));
    for(const n of rel.notas||[])
      fim.appendChild(el('div',{class:'linha-dado', html:`<span class="fraco">${n}</span>`}));
    for(const a of rel.avisos)
      fim.appendChild(el('div',{class:'linha-dado', html:
        `<span class="negativo">${a}</span>`}));
    if(rel.saidas.length){
      fim.appendChild(el('h3',{texto:'Foram embora'}));
      for(const s of rel.saidas)
        fim.appendChild(el('div',{class:'linha-dado', html:
          `<span>${s.nome}</span><b class="fraco">${s.cargo}</b>`}));
    }
    corpo.appendChild(fim);

    modal(`Fechamento da semana ${rel.semana}`,
          `${rel.receitas.length} receitas · ${rel.despesas.length} despesas`,
          corpo, null, 'media');
  }

  /* =======================================================
     TORCIDA
     ======================================================= */
  let subTorcida = 'membros', filtroCargo = 'todos', busca = '';
  let ordem = {col:'forca', dir:-1}, selecionado = null;

  const COLUNAS = [
    {k:'nome',    rot:'Membro',   larg:'28%'},
    {k:'cargo',   rot:'Função',   larg:'22%'},
    {k:'forca',   rot:'Força',    barra:true, max:20},
    {k:'defesa',  rot:'Defesa',   barra:true, max:20},
    {k:'moral',   rot:'Moral',    barra:true, max:20},
    {k:'xp',      rot:'XP'},
    {k:'situacao',rot:'Situação'}
  ];

  function valorCol(m,k){
    if(k==='nome') return TO.membros.nomeDe(m).toLowerCase();
    if(k==='cargo') return TO.membros.CARGOS[m.cargo].ordem;
    if(k==='situacao') return m.preso?2 : m.ferido?1 : 0;
    return m[k];
  }
  function combina(m,t){
    if(!t) return true;
    t = t.toLowerCase();
    const sit = m.preso?'preso' : m.ferido?'ferido' : 'apto';
    return TO.membros.nomeDe(m).toLowerCase().includes(t)
        || TO.membros.CARGOS[m.cargo].nome.toLowerCase().includes(t)
        || (m.arquetipo||'').includes(t) || sit.includes(t);
  }

  function pintarTorcida(){
    const e = E(), pg = U.$('.pagina[data-pag="torcida"]');
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Torcida — membros'}));
    pg.appendChild(subabas([
      {id:'membros',      rot:'Membros'},
      {id:'hierarquia',   rot:'Hierarquia'},
      {id:'treinamentos', rot:'Treinamentos'},
      {id:'recrutamento', rot:'Recrutamento', desabilitada:true}
    ], subTorcida, id=>{subTorcida=id; redesenhar();}));

    if(subTorcida==='treinamentos'){ pg.appendChild(painelTreinos()); return; }
    if(subTorcida==='hierarquia'){ pg.appendChild(painelHierarquia()); return; }

    const c = TO.membros.contar(e);
    const grade = el('div',{class:'lista-detalhe'});

    /* filtros por cargo, com contagem */
    const cf = cartao();
    const filtros = [
      ['todos','Todos', c.total],
      ['diretoria','Diretoria', c.diretoria],
      ['frente','Linha de Frente', c.frente],
      ['componente','Componentes', c.componente],
      ['novato','Apoiadores', c.novato]
    ];
    cf.corpo.style.padding='0';
    const fl = el('div',{class:'filtros'});
    for(const [id,rot,n] of filtros){
      const b = el('button',{class:(id===filtroCargo?'on':''),
        html:`<span>${rot}</span><span class="conta">${n}</span>`});
      b.onclick = ()=>{ filtroCargo=id; redesenhar(); };
      fl.appendChild(b);
    }
    cf.corpo.appendChild(fl);
    grade.appendChild(cf);

    /* tabela */
    const ct = cartao('Membros', `${c.aptos} aptos · ${c.feridos} feridos · ${c.presos} presos`);
    const bs = el('input',{class:'busca', type:'search',
      placeholder:'nome, cargo, arquétipo, situação…'});
    bs.value = busca;
    bs.oninput = ev=>{ busca = ev.target.value; pintarTorcida(); };
    ct.corpo.appendChild(bs);

    const lista = e.membros
      .filter(m=>filtroCargo==='todos' || m.cargo===filtroCargo)
      .filter(m=>combina(m,busca))
      .sort((a,b)=>{
        const va=valorCol(a,ordem.col), vb=valorCol(b,ordem.col);
        return va<vb ? -ordem.dir : va>vb ? ordem.dir : 0;
      });

    const tab = el('table',{class:'dados'});
    const tr = el('tr');
    for(const col of COLUNAS){
      const seta = ordem.col===col.k ? (ordem.dir<0?' ▼':' ▲') : '';
      const th = el('th',{class:'ordenavel',
        html:`${col.rot}<span class="seta">${seta}</span>`});
      if(col.larg) th.style.width = col.larg;
      th.onclick = ()=>{
        /* tri-state: desc → asc → volta ao padrão */
        if(ordem.col!==col.k) ordem={col:col.k, dir:-1};
        else if(ordem.dir===-1) ordem.dir=1;
        else ordem={col:'forca', dir:-1};
        pintarTorcida();
      };
      tr.appendChild(th);
    }
    tab.appendChild(el('thead',null,[tr]));

    const tb = el('tbody');
    for(const m of lista){
      const sit = m.preso ? 'Preso' : m.ferido ? `Ferido · ${m.ferido.dias}d`
                : m.naFila ? 'Treinando' : 'Apto';
      const linha = el('tr',{class:(m.preso?'preso':m.ferido?'ferido':'')
        + (selecionado===m.id?' selecionada':'')});
      const pontinho = (m.cargo==='diretoria'||m.veterano) ? '<span class="ponto"></span>' : '';
      linha.innerHTML =
        `<td>${pontinho}${TO.membros.nomeDe(m)}</td>
         <td>${TO.membros.CARGOS[m.cargo].nome}</td>
         <td>${medida(m.forca,20)}</td>
         <td>${medida(m.defesa,20)}</td>
         <td>${medida(m.moral,20)}</td>
         <td class="num">${m.xp}</td>
         <td>${sit}</td>`;
      linha.style.cursor='pointer';
      linha.onclick = ()=>{ selecionado = m.id; pintarTorcida(); };
      tb.appendChild(linha);
    }
    tab.appendChild(tb);
    ct.corpo.appendChild(tab);

    const alvo = e.membros.find(m=>m.id===selecionado);
    const btPerfil = el('button',{class:'bt', texto:'Ver perfil'});
    btPerfil.disabled = !alvo;
    btPerfil.onclick = ()=>abrirFicha(alvo);
    const btAcoes = el('button',{class:'bt destaque', texto:'Ações'});
    btAcoes.disabled = !alvo;
    btAcoes.onclick = ()=>abrirAcoes(alvo);
    ct.rodape(btPerfil, btAcoes);

    grade.appendChild(ct);
    pg.appendChild(grade);
  }

  function painelTreinos(){
    const e = E(), cap = TO.membros.capTreino(e);
    const fila = e.membros.filter(m=>m.naFila && TO.membros.disponivel(m));
    const grade = el('div',{class:'colunas'});

    const c1 = cartao('Fila de treino', `${fila.length} na fila · ${cap} por dia`);
    if(!fila.length){
      c1.corpo.innerHTML = `<div class="em-construcao">Ninguém escalado. `+
        `Selecione um membro em Membros e use Ações.</div>`;
    } else {
      fila.forEach((m,i)=>{
        c1.corpo.appendChild(el('div',{class:'item'+(i<cap?' meu':''), html:
          `<div class="l1"><span class="nm">${TO.membros.nomeDe(m)}</span>
             <span class="qt">${m.forca}/${m.defesa}</span></div>
           <div class="l2">${i<cap?'treina hoje':'aguarda vaga'} · frações `+
          `${m.fracForca.toFixed(2)} / ${m.fracDefesa.toFixed(2)}</div>`}));
      });
    }
    const bt = el('button',{class:'bt destaque larga',
      texto:`Treinar ${Math.min(fila.length,cap)} e avançar o dia`});
    bt.disabled = !fila.length;
    bt.onclick = ()=>{
      const n = TO.membros.treinarFila(e);
      aviso(`${n} treinaram.`,'boa');
      TO.estado.avancarDia();
    };
    c1.rodape(bt);
    grade.appendChild(c1);

    const c2 = cartao('Como funciona');
    c2.corpo.innerHTML =
      `<div class="linha-dado"><span>Ganho por sessão</span><b>0.00 a 0.30</b></div>
       <div class="linha-dado"><span>Vagas por dia</span><b>${cap}</b></div>
       <div class="linha-dado"><span>Teto do Novato</span><b>8</b></div>
       <div class="linha-dado"><span>Teto do Componente</span><b>12</b></div>
       <div class="linha-dado"><span>Teto da Linha de Frente</span><b>18</b></div>
       <div class="linha-dado"><span>Teto da Diretoria</span><b>20</b></div>
       <div class="linha-dado"><span class="fraco">O atributo só sobe de inteiro quando `+
      `a fração acumula. Cada treino aparece, mesmo o pequeno (GDD §5.4).</span></div>`;
    grade.appendChild(c2);
    return grade;
  }

  function painelHierarquia(){
    const e = E();
    const grade = el('div',{class:'colunas'});
    for(const cargo of ['diretoria','frente','componente','novato']){
      const dele = e.membros.filter(m=>m.cargo===cargo)
                    .sort((a,b)=>b.xp-a.xp);
      const C = TO.membros.CARGOS[cargo];
      const limite = cargo==='diretoria' ? ` / ${TO.membros.capDiretoria(e)}` : '';
      const c = cartao(C.nome, `${dele.length}${limite}`);
      if(!dele.length) c.corpo.innerHTML='<div class="em-construcao">Ninguém.</div>';
      for(const m of dele.slice(0,12)){
        c.corpo.appendChild(el('div',{class:'linha-dado', html:
          `<span>${TO.membros.nomeDe(m)}${m.veterano?' <span class="tag">vet</span>':''}</span>
           <b>${m.forca}/${m.defesa} · ${m.xp} XP</b>`}));
      }
      grade.appendChild(c);
    }
    return grade;
  }

  /* ---------- ficha e ações do membro ---------- */
  function modal(titulo, sub, corpo, acoes, largura){
    const fundo = el('div',{class:'tela-cheia'});
    const m = el('div',{class:'moldura '+(largura||'estreita')});
    m.appendChild(el('header',{html:`<h2>${titulo}</h2><span>${sub||''}</span>`}));
    const d = el('div'); d.appendChild(corpo); m.appendChild(d);
    const f = el('footer');
    for(const [rot, fn, desab] of (acoes||[])){
      const b = el('button',{class:'bt', texto:rot});
      b.disabled = !!desab;
      b.onclick = ()=>{ fn(); fundo.remove(); };
      f.appendChild(b);
    }
    const fechar = el('button',{class:'bt destaque', texto:'Fechar'});
    fechar.onclick = ()=>fundo.remove();
    f.appendChild(fechar); m.appendChild(f);
    fundo.appendChild(m); document.body.appendChild(fundo);
    return ()=>fundo.remove();
  }

  function abrirFicha(m){
    const corpo = el('div');
    corpo.innerHTML =
      `<div class="linha-dado"><span>Cargo</span><b>${TO.membros.CARGOS[m.cargo].nome}</b></div>
       <div class="linha-dado"><span>Força / Defesa</span><b>${m.forca} / ${m.defesa}</b></div>
       <div class="linha-dado"><span>Frações acumuladas</span>
         <b>${m.fracForca.toFixed(2)} / ${m.fracDefesa.toFixed(2)}</b></div>
       <div class="linha-dado"><span>XP</span><b>${m.xp}</b></div>
       <div class="linha-dado"><span>Moral</span><b>${m.moral.toFixed(1)} / 20</b></div>
       <div class="linha-dado"><span>Arquétipo</span><b>${m.arquetipo}</b></div>
       <div class="linha-dado"><span>Mensalidade</span>
         <b>${U.dinheiro(TO.membros.CARGOS[m.cargo].mensalidade)}</b></div>`;
    if(m.historico.length){
      corpo.appendChild(el('div',{class:'titulo-pagina', texto:'Histórico',
        estilo:{fontSize:'13px', paddingTop:'12px'}}));
      for(const h of m.historico.slice(-8))
        corpo.appendChild(el('div',{class:'transacao', html:`<span class="desc">${h}</span>`}));
    }
    modal(TO.membros.nomeDe(m), TO.membros.CARGOS[m.cargo].nome, corpo);
  }

  function abrirAcoes(m){
    const acoes = [];
    if(m.preso) acoes.push([`Pagar fiança (${U.dinheiro(TO.membros.fianca(m))})`, ()=>{
      const r = TO.membros.resgatar(E(), m);
      aviso(r.ok?`${TO.membros.nomeDe(m)} está solto`:r.motivo, r.ok?'boa':'ruim');
      redesenhar();
    }]);
    if(TO.membros.disponivel(m)) acoes.push([m.naFila?'Tirar da fila de treino':'Pôr na fila de treino',
      ()=>{ m.naFila=!m.naFila; redesenhar(); }]);
    const p = TO.membros.podePromover(E(), m);
    acoes.push([p.ok?`Promover (${U.dinheiro(p.custo||0)})`:`Promover — ${p.motivo}`,
      ()=>{
        const r = TO.membros.promover(E(), m);
        aviso(r.ok ? (r.veterano?`${TO.membros.nomeDe(m)} virou Veterano`
                               :`${TO.membros.nomeDe(m)} promovido`) : r.motivo,
              r.ok?'boa':'ruim');
        redesenhar();
      }, !p.ok && !p.veterano]);

    const corpo = el('div');
    corpo.innerHTML = `<div class="linha-dado"><span class="fraco">`+
      `${TO.membros.CARGOS[m.cargo].nome} · ${m.forca}/${m.defesa} · ${m.xp} XP</span></div>`;
    modal('Ações — '+TO.membros.nomeDe(m), '', corpo, acoes);
  }

  /* =======================================================
     FINANCEIRO
     ======================================================= */
  let subFin = 'resumo';

  function pintarFinanceiro(){
    const e = E(), pg = U.$('.pagina[data-pag="financeiro"]');
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Financeiro'}));
    pg.appendChild(subabas([
      {id:'resumo', rot:'Resumo'},
      {id:'lojas',  rot:'Lojas e bares', desabilitada:true},
      {id:'obras',  rot:'Construções',   desabilitada:true},
      {id:'transacoes', rot:'Transações'}
    ], subFin, id=>{subFin=id; redesenhar();}));

    if(subFin==='transacoes'){
      const c = cartao('Transações', `${e.transacoes.length} lançamentos`);
      if(!e.transacoes.length) c.corpo.innerHTML='<div class="em-construcao">Nada ainda.</div>';
      for(const t of e.transacoes.slice(0,60)){
        c.corpo.appendChild(el('div',{class:'transacao', html:
          `<span class="dia">${t.dia}</span><span class="desc">${t.descricao}</span>
           <span class="val ${t.valor<0?'negativo':t.valor>0?'positivo':''}">`+
          `${t.valor?U.dinheiro(t.valor):'—'}</span>`}));
      }
      pg.appendChild(c);
      return;
    }

    /* mesma conta do fechamento: a tela nunca promete o que não cobra */
    const cx = TO.financeiro.contas(e);
    const pat = TO.financeiro.patrimonio(e);
    const pagantes = e.membros.filter(m=>!m.preso).length;

    const grade = el('div',{class:'colunas-3'});

    const c1 = cartao('Fluxo da semana');
    c1.corpo.innerHTML =
      `<div class="valorao"><span>Receitas</span>
         <b class="positivo">${U.dinheiro(cx.receita)}</b></div>
       <div class="valorao"><span>Despesas</span>
         <b class="negativo">${U.dinheiro(cx.despesa)}</b></div>
       <div class="valorao"><span>Saldo</span>
         <b class="${cx.saldo>=0?'positivo':'negativo'}">${U.dinheiro(cx.saldo)}</b></div>`;
    const btDet = el('button',{class:'bt larga', texto:'Detalhes'});
    btDet.onclick = ()=>{ subFin='transacoes'; redesenhar(); };
    let btUlt = null;
    if(e.ultimoFechamento){
      btUlt = el('button',{class:'bt larga', texto:'Último fechamento'});
      btUlt.onclick = ()=>abrirFechamento(e.ultimoFechamento);
    }
    c1.rodape(btDet, btUlt);
    grade.appendChild(c1);

    const c2 = cartao('Caixa');
    c2.corpo.innerHTML =
      `<div class="valorao"><span>Em caixa</span>
         <b class="${e.dinheiro<0?'negativo':''}">${U.dinheiro(e.dinheiro)}</b></div>
       <div class="linha-dado"><span>Membros pagantes</span><b>${pagantes}`+
      `${pagantes<e.membros.length?` <span class="fraco">de ${e.membros.length}</span>`:''}</b></div>
       <div class="linha-dado"><span>Sede nível ${e.torcida.sedeNivel}</span>
         <b>${U.dinheiro(TO.financeiro.MANUT_SEDE[e.torcida.sedeNivel])}/mês</b></div>
       <div class="linha-dado"><span>Bares · lojas · subsedes</span>
         <b>${pat.bares.length} · ${pat.lojas.length} · ${pat.subsedes.length}</b></div>`
      + (e.semanasNoVermelho
         ? `<div class="linha-dado"><span class="negativo">No vermelho há `+
           `${e.semanasNoVermelho} semana(s) — gente começa a sair.</span></div>`
         : '');
    if(e.historicoSemanas && e.historicoSemanas.length){
      c2.corpo.appendChild(el('div',{class:'titulo-pagina', texto:'Últimas semanas',
        estilo:{fontSize:'12px', paddingTop:'10px'}}));
      for(const h of e.historicoSemanas.slice(0,6))
        c2.corpo.appendChild(el('div',{class:'transacao', html:
          `<span class="dia">S${h.semana}</span>
           <span class="desc">caixa ${U.dinheiro(h.caixa)}</span>
           <span class="val ${h.saldo<0?'negativo':'positivo'}">${U.dinheiro(h.saldo)}</span>`}));
    }
    grade.appendChild(c2);

    const linha = (rot, v, neg) =>
      el('div',{class:'linha-dado', html:
        `<span>${rot}</span><b class="${v?(neg?'negativo':'positivo'):'fraco'}">`+
        `${v?U.dinheiro(neg?-v:v):'—'}</b>`});

    const c3 = cartao('Receitas', 'por semana');
    if(!cx.receitas.length) c3.corpo.appendChild(linha('Nada entrando', 0));
    for(const r of cx.receitas) c3.corpo.appendChild(linha(r.rot, r.v, false));

    const c4 = cartao('Despesas', 'por semana');
    for(const d of cx.despesas) c4.corpo.appendChild(linha(d.rot, d.v, true));
    if(TO.financeiro.temCaravana(e))
      c4.corpo.appendChild(linha(`Caravana — ${e.proximoJogo.cidadeAdv}`,
                                 TO.financeiro.CARAVANA, true));
    const col3 = el('div'); col3.append(c3,c4);
    grade.appendChild(col3);

    pg.appendChild(grade);
  }

  /* =======================================================
     COMPETIÇÕES (GDD §18)
     Layout do mockup: abas grandes por divisão, classificação
     à esquerda e a rodada navegável à direita.
     ======================================================= */
  let abaComp = null, compSel = null, rodadaSel = null;

  const nomeClube = id => (TO.mundo.time(id)||{}).nome || '—';
  const corClube  = id => ((TO.mundo.time(id)||{}).cores || ['#666'])[0];

  function abasGrandes(itens, atual, aoTrocar){
    const cx = el('div',{class:'abas-grandes'});
    for(const it of itens){
      const b = el('button',{texto:it.rot});
      b.classList.toggle('on', it.id===atual);
      b.disabled = !!it.desabilitada;
      if(it.dica) b.title = it.dica;
      b.onclick = ()=>aoTrocar(it.id);
      cx.appendChild(b);
    }
    return cx;
  }

  /* quadro genérico no formato do mockup: faixa de título + corpo */
  function quadro(titulo, direita){
    const q = el('div',{class:'quadro'});
    const h = el('header');
    h.appendChild(el('h2',{texto:titulo}));
    if(direita) h.appendChild(direita);
    q.appendChild(h);
    q.corpo = el('div');
    q.appendChild(q.corpo);
    q.rodape = (...bts)=>{
      const r = el('div',{class:'rodape'});
      bts.forEach(b=>b && r.appendChild(b));
      q.appendChild(r); return q;
    };
    return q;
  }

  function tabelaLiga(e, comp, ig){
    const linhas = TO.competicoes.tabela(comp, ig);
    const meu = e.torcida.clubeId;
    const zona = comp.pontosCorridos ? 0 : comp.passam;
    const t = el('table',{class:'liga'});
    t.innerHTML =
      `<thead><tr><th>#</th><th class="time">Time</th>
        <th>P</th><th>V</th><th>E</th><th>D</th>
        <th>GP</th><th>GC</th><th>SG</th></tr></thead>`;
    const tb = el('tbody');
    linhas.forEach((l,i)=>{
      const cls = [];
      if(l.id===meu) cls.push('meu');
      if(zona && i<zona) cls.push('sobe');
      const tr = el('tr',{class:cls.join(' ')});
      tr.innerHTML =
        `<td class="pos">${i+1}</td>
         <td class="time"><i style="background:${corClube(l.id)}"></i>${nomeClube(l.id)}</td>
         <td>${l.p}</td><td>${l.v}</td><td>${l.e}</td><td>${l.d}</td>
         <td>${l.gp}</td><td>${l.gc}</td><td>${l.sg>0?'+':''}${l.sg}</td>`;
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return t;
  }

  /* uma partida na lista da rodada, no formato do mockup */
  function linhaJogo(e, comp, j, semana, dia){
    const meu = e.torcida.clubeId;
    const feito = j.gc!=null;
    const d = TO.estado.dataDaSemana(e.data.ano, semana, dia || comp.dia || 6);
    const SEM = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
    const quando = `${SEM[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/`+
                   `${String(d.getMonth()+1).padStart(2,'0')} · ${TO.competicoes.horaDoJogo(j)}`;
    const cx = el('div',{class:'jogo'+(j.c===meu||j.f===meu?' meu':'')+(feito?' feito':'')});
    cx.appendChild(el('div',{class:'quando', texto:quando}));
    cx.appendChild(el('div',{class:'duelo', html:
      `<span class="casa">${nomeClube(j.c)}<i style="background:${corClube(j.c)}"></i></span>
       <span class="${feito?'placar':'x'}">${feito?`${j.gc} × ${j.gf}`:'×'}</span>
       <span class="fora"><i style="background:${corClube(j.f)}"></i>${nomeClube(j.f)}</span>`}));
    return cx;
  }

  function painelRodada(e, comp){
    const es = TO.competicoes.etapas(comp);
    if(rodadaSel===null || rodadaSel>=es.length) rodadaSel = TO.competicoes.etapaAtual(comp);
    const i = U.limitar(rodadaSel, 0, es.length-1);
    const et = es[i];

    /* cabeçalho é o próprio navegador: ‹ RODADA 4 DE 38 › */
    const q = el('div',{class:'quadro'});
    const cab = el('header',{class:'nav-rodada'});
    const ant = el('button',{html:'‹'}), pro = el('button',{html:'›'});
    ant.disabled = i<=0; pro.disabled = i>=es.length-1;
    ant.onclick = ()=>{ rodadaSel = i-1; redesenhar(); };
    pro.onclick = ()=>{ rodadaSel = i+1; redesenhar(); };
    cab.appendChild(ant);
    cab.appendChild(el('h2',{html:
      `${et.rot}<span class="conta">de ${es.length}</span>`}));
    cab.appendChild(pro);
    q.appendChild(cab);
    q.corpo = el('div');
    q.appendChild(q.corpo);

    const rolo = el('div',{class:'rolo'});
    for(const j of et.jogos)
      rolo.appendChild(linhaJogo(e, comp, j, et.semana, et.dia));
    if(!et.jogos.length)
      rolo.appendChild(el('div',{class:'em-construcao', texto:'Sem jogos nesta fase.'}));
    q.corpo.appendChild(rolo);
    return q;
  }

  function pintarCompeticoes(){
    const e = E(), pg = U.$('.pagina[data-pag="competicoes"]');
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-barra', html:'<h1>Competições</h1>'}));

    if(!e.temporada){
      pg.appendChild(emConstrucao('Sem temporada','Comece um jogo novo pra gerar a tabela.'));
      return;
    }
    const S = e.temporada;
    const acha = nome => S.competicoes.find(c=>c.nome===nome);
    const series = ['Brasileirão Série A','Brasileirão Série B',
                    'Brasileirão Série C','Brasileirão Série D'];

    const abas = series.map(n=>({id:n, rot:n.replace('Brasileirão ','')}))
      .concat([
        {id:'regionais', rot:'Regionais'},
        {id:TO.competicoes.COPA_NOME, rot:'Copa do Brasil'},
        {id:'historico', rot:'Histórico'}
      ]);

    /* abre na divisão do meu clube */
    if(!abaComp){
      const meu = TO.mundo.time(e.torcida.clubeId);
      abaComp = (meu && series.includes(meu.divisao)) ? meu.divisao : series[0];
    }
    pg.appendChild(abasGrandes(abas, abaComp, id=>{
      abaComp=id; compSel=null; rodadaSel=null; redesenhar();
    }));

    if(abaComp==='historico'){ pg.appendChild(painelHistorico(e)); return; }

    let comp;
    if(abaComp==='regionais'){
      const lista = S.competicoes.filter(c=>c.tipo==='regional');
      const meu = TO.mundo.time(e.torcida.clubeId);
      const minha = meu && lista.find(c=>c.clubes.includes(meu.id));
      if(!compSel || !lista.some(c=>c.id===compSel))
        compSel = (minha && minha.id) || lista[0].id;
      const filtros = el('div',{class:'filtros-linha'});
      for(const c of lista){
        const b = el('button',{class:(c.id===compSel?'on':'')+
          (minha && c.id===minha.id?' minha':''),
          html:`${c.nome}<span class="conta">${c.clubes.length}</span>`});
        b.onclick = ()=>{ compSel=c.id; rodadaSel=null; redesenhar(); };
        filtros.appendChild(b);
      }
      pg.appendChild(filtros);
      comp = lista.find(c=>c.id===compSel);
    }else{
      comp = acha(abaComp);
    }
    if(!comp){ pg.appendChild(emConstrucao('Sem dados','Competição não encontrada.')); return; }

    const es = TO.competicoes.etapas(comp);
    const atual = TO.competicoes.etapaAtual(comp);

    const duas = el('div',{class:'comp-duas'});
    const esq = el('div');

    if(comp.campeao){
      const c = quadro('Campeão');
      c.corpo.appendChild(el('div',{class:'campeao', estilo:{padding:'12px 14px'}, html:
        `${IC.get('trofeu')}<div><b>${nomeClube(comp.campeao)}</b>
         <small>vice: ${nomeClube(comp.vice)}</small></div>`}));
      esq.appendChild(c);
    }
    /* copa não tem tabela: o lado esquerdo vira a chave inteira */
    if(comp.copa){ esq.appendChild(painelChave(e, comp)); }
    comp.grupos.forEach((g, ig)=>{
      const rot = comp.grupos.length>1 ? `Classificação · grupo ${'ABCDEFGH'[ig]}`
                                       : 'Classificação';
      const q = quadro(rot, el('span',{class:'conta',
        texto:`${es[atual] ? es[atual].rot : ''} de ${es.length}`}));
      const rolo = el('div',{class:'rolo'});
      rolo.appendChild(tabelaLiga(e, comp, ig));
      q.corpo.appendChild(rolo);
      esq.appendChild(q);
    });

    duas.appendChild(esq);
    duas.appendChild(painelRodada(e, comp));
    pg.appendChild(duas);
  }

  /* caminho do clube do jogador na copa, fase a fase */
  function painelChave(e, comp){
    const meu = e.torcida.clubeId;
    const q = quadro('Chave', el('span',{class:'conta',
      texto:`${comp.clubes.length} clubes`}));
    for(const fase of comp.mata){
      const meus = fase.jogos.filter(j=>j.c===meu||j.f===meu);
      const mostra = meus.length ? meus : fase.jogos.slice(0,4);
      q.corpo.appendChild(el('div',{class:'fase-rot',
        texto:`${fase.fase} · semana ${fase.semana}`+
              (meus.length?'':` · ${fase.jogos.length} jogos`)}));
      for(const j of mostra){
        const feito = j.gc!=null;
        q.corpo.appendChild(el('div',{class:'jogo-chave'+
          (j.c===meu||j.f===meu?' meu':''), html:
          `<span class="a ${j.venceu===j.c?'venceu':''}">${nomeClube(j.c)}</span>
           <b>${feito?`${j.gc} × ${j.gf}`:'—'}</b>
           <span class="b ${j.venceu===j.f?'venceu':''}">${nomeClube(j.f)}</span>
           ${j.agregado?`<em>${j.agregado}</em>`:j.penaltis?'<em>pênaltis</em>':''}`}));
        if(j.neutro) q.corpo.appendChild(el('div',{class:'sub-chave',
          texto:`campo neutro · ${j.neutro}`}));
      }
    }
    if(!comp.mata.length)
      q.corpo.innerHTML = '<div class="em-construcao">A copa começa na semana '+
        `${comp.semanaInicio}.</div>`;
    return q;
  }

  function painelHistorico(e){
    const q = quadro('Campeões', el('span',{class:'conta', texto:`${e.data.ano}`}));
    const S = e.temporada;
    const doAno = S.competicoes.filter(c=>c.campeao);
    const t = el('table',{class:'agenda'});
    t.innerHTML = `<thead><tr><th>Ano</th><th>Competição</th><th>Campeão</th>
                   <th>Vice</th></tr></thead>`;
    const tb = el('tbody');
    const linha = (ano, comp, camp, vice)=>{
      const tr = el('tr',{class:camp===e.torcida.clubeId?'meu':''});
      tr.innerHTML =
        `<td class="hora">${ano}</td><td>${comp}</td>
         <td><span class="adv"><i style="background:${corClube(camp)}"></i>
           ${nomeClube(camp)}</span></td>
         <td style="color:var(--fraco)">${vice?nomeClube(vice):'—'}</td>`;
      tb.appendChild(tr);
    };
    for(const c of doAno) linha(S.ano, c.nome, c.campeao, c.vice);
    for(const h of (S.titulos||[]).slice(0,60)) linha(h.ano, h.comp, h.campeao, h.vice);
    t.appendChild(tb);
    if(!tb.children.length)
      q.corpo.innerHTML = '<div class="em-construcao">Nenhuma competição decidida ainda.</div>';
    else q.corpo.appendChild(t);
    return q;
  }

  /* =======================================================
     GESTÃO INTELIGENTE
     A tela onde a semana vira plano: ir em paz ou atacar,
     onde, com quanta bomba, em quantos bondes, como receber o
     aliado e por qual estrada viajar.
     ======================================================= */
  function opcoes(itens, atual, aoTrocar){
    const cx = el('div',{class:'opcoes'});
    for(const it of itens){
      const b = el('button',{class:'opcao'+(it.id===atual?' on':'')+
        (it.desabilitada?' off':'')});
      b.disabled = !!it.desabilitada;
      b.innerHTML =
        `<span class="rot">${it.rot}</span>
         ${it.custo!==undefined?`<span class="custo">${
            it.custo ? U.dinheiro(-it.custo) : 'de graça'}</span>`:''}
         <small>${it.nota||''}</small>`;
      b.onclick = ()=>aoTrocar(it.id);
      cx.appendChild(b);
    }
    return cx;
  }

  function medidor(rot, valor, max, cor){
    return `<div class="medidor"><span>${rot}</span>
      <i><b style="width:${U.limitar(valor/max,0,1)*100}%;background:${cor||'var(--rubro-vivo)'}"></b></i>
      <em>${valor}</em></div>`;
  }

  /* quadro com o corpo recuado, pro conteúdo de formulário */
  function quadroP(titulo, direita){
    const q = quadro(titulo, direita);
    q.corpo.className = 'recuado';
    return q;
  }

  /* cartão que abre e fecha. O estado fica aqui fora pra sobreviver ao
     redesenho — a tela de Gestão é longa e ninguém quer rolar tudo. */
  const dobras = new Set(['jogo','intencao','saida']);
  function quadroDobra(id, titulo, direita){
    const aberto = dobras.has(id);
    const q = el('div',{class:'quadro dobra'+(aberto?' aberto':'')});
    const h = el('header');
    h.appendChild(el('span',{class:'seta', texto:aberto?'▾':'▸'}));
    h.appendChild(el('h2',{texto:titulo}));
    if(direita) h.appendChild(direita);
    h.onclick = ()=>{
      if(dobras.has(id)) dobras.delete(id); else dobras.add(id);
      redesenhar();
    };
    q.appendChild(h);
    q.corpo = el('div',{class:'recuado'});
    if(!aberto) q.corpo.style.display = 'none';
    q.appendChild(q.corpo);
    q.rodape = (...bts)=>{
      if(!aberto) return q;
      const r = el('div',{class:'rodape'});
      bts.forEach(b=>b && r.appendChild(b));
      q.appendChild(r); return q;
    };
    q.aberto = aberto;
    return q;
  }

  function pintarGestao(){
    const e = E(), pg = U.$('.pagina[data-pag="gestao"]');
    const P = TO.planejamento;
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-barra', html:'<h1>Gestão inteligente</h1>'}));

    const p = P.plano(e);
    const j = e.proximoJogo;
    const grade = el('div',{class:'comp-duas'});
    const esq = el('div'), dir = el('div');

    /* ---------- 1. o jogo da semana ---------- */
    const cPost = quadroDobra('jogo', 'O jogo da semana', el('span',{class:'conta',
      texto: j ? (TO.financeiro.precisaCaravana(e) ? 'fora, com caravana'
                                                   : 'em casa') : 'folga'}));
    if(cPost.aberto){
      if(!j){
        cPost.corpo.appendChild(el('div',{class:'em-construcao',
          html:'<b>Folga na tabela</b>O time não joga. Semana boa pra treinar, '+
               'recrutar e resolver o que a rua deixou.'}));
      }else{
        cPost.corpo.appendChild(el('div',{class:'confronto-linha', html:
          `<b>${j.mandante.nome}</b><span>×</span><b>${j.visitante.nome}</b>
           <small>${j.competicao}${j.fase?' · '+j.fase:''} · `+
          `${j.neutro?'campo neutro':j.casa?'em casa':'fora, em '+j.cidadeAdv}</small>`}));
        cPost.corpo.appendChild(el('div',{class:'linha-dado', html:
          `<span>Saída</span><b>${TO.financeiro.precisaCaravana(e)
            ? 'caravana para '+j.cidadeAdv : 'bonde da sede pro estádio'}</b>`}));
        cPost.corpo.appendChild(el('div',{class:'linha-dado', html:
          `<span>Sai de casa</span><b>${P.efetivoDaSaida(e)} de `+
          `${TO.membros.aptosParaOEstadio(e).length} aptos</b>`}));
      }
    }
    esq.appendChild(cPost);

    /* ---------- 2. intenção e alvo ---------- */
    if(j){
      const alvos = P.alvosDoJogo(e);
      const trair = P.soAliados(e);
      if(trair && p.intencao === 'atacar') p.intencao = 'trair';
      if(!trair && p.intencao === 'trair') p.intencao = 'atacar';
      const briga = p.intencao !== 'paz';
      if(briga && !p.alvoTorcida && alvos.length) p.alvoTorcida = alvos[0].id;

      const cInt = quadroDobra('intencao', 'Intenção do dia de jogo',
        el('span',{class:'conta', texto: briga
          ? (P.ponto(p.alvo).nome) : 'em paz'}));
      if(cInt.aberto){
        cInt.corpo.appendChild(opcoes(P.intencoes(e), p.intencao,
          id=>{ p.intencao=id; p.decidido=false; redesenhar(); }));

        if(briga){
          cInt.corpo.appendChild(el('div',{class:'fase-rot', texto:'Contra quem'}));
          if(!alvos.length){
            cInt.corpo.appendChild(el('div',{class:'em-construcao',
              texto:'O adversário não tem organizada catalogada.'}));
          }
          cInt.corpo.appendChild(opcoes(alvos.map(a=>({
            id:a.id, rot:a.torcida.nome,
            nota:`${a.aliada?'ALIADA — bater nela é traição · ':''}`+
                 `relação ${a.relacao>0?'+':''}${Math.round(a.relacao)}`+
                 `${a.tensao?` · tensão ${Math.round(a.tensao)}`:''} · `+
                 `${a.torcida.membros} membros`
          })), p.alvoTorcida, id=>{ p.alvoTorcida=id; p.decidido=false; redesenhar(); }));

          cInt.corpo.appendChild(el('div',{class:'fase-rot', texto:'Onde bater'}));
          cInt.corpo.appendChild(opcoes(
            P.pontosDeAtaque(e).map(x=>({id:x.id,
              rot:`${x.nome}${x.bairro?` — ${x.bairro}`:''}`,
              nota:`${x.nota} · risco ${x.risco}/5 · prestígio ${x.prestigio}/5`})),
            p.alvo, id=>{ p.alvo=id; p.decidido=false; redesenhar(); }));

          const est = e.estoque || {bombas:0};
          cInt.corpo.appendChild(el('div',{class:'fase-rot',
            texto:`Bombas do estoque — ${est.bombas} guardadas`}));
          const linha = el('div',{class:'contador'});
          const menos = el('button',{texto:'−'}), mais = el('button',{texto:'+'});
          menos.onclick = ()=>{ p.bombas=Math.max(0,p.bombas-1); p.decidido=false; redesenhar(); };
          mais.onclick  = ()=>{ p.bombas=Math.min(est.bombas,p.bombas+1); p.decidido=false; redesenhar(); };
          menos.disabled = p.bombas<=0; mais.disabled = p.bombas>=est.bombas;
          linha.append(menos, el('b',{texto:String(p.bombas)}), mais,
            el('small',{texto: p.bombas ? 'bomba chama a PM mais rápido (GDD §9.1)'
                                        : 'pedra é infinita e não faz barulho'}));
          cInt.corpo.appendChild(linha);
        }
      }
      esq.appendChild(cInt);

      /* ---------- 3. formação da saída ---------- */
      const d = P.divisao(e, p.bondes);
      const cB = quadroDobra('saida', 'Formação da saída', el('span',{class:'conta',
        texto:`${P.efetivoDaSaida(e)} saem · ${p.bondes===1?'um bonde':p.bondes+' bondes'}`}));
      if(cB.aberto){
        cB.corpo.appendChild(opcoes([1,2,3,4].map(n=>{
          const dd = P.divisao(e, n);
          return {id:n, rot: n===1 ? 'Bonde único' : `${n} bondes, um por zona`,
                  nota: n===1 ? 'todo mundo junto: uma frente, mas pesada'
                              : `${dd.porBonde} por bonde · até ${n} frentes · `+
                                `${dd.zonas.join(', ')}`};
        }), p.bondes, n=>{ p.bondes=n; p.decidido=false; redesenhar(); }));
        cB.corpo.appendChild(el('div',{class:'linha-dado', html:
          medidor('Solidez da linha', Math.round(d.solidez*100), 100,
                  d.solidez>0.75?'var(--verde)':'var(--ouro)')}));

        if(p.bondes > 1){
          cB.corpo.appendChild(el('div',{class:'fase-rot', texto:'Destino de cada bonde'}));
          const ops = P.opcoesDeDestino(e);
          for(const b of P.destinos(e)){
            const linha = el('div',{class:'linha-bonde'});
            linha.appendChild(el('span',{class:'zona', html:
              `${b.zona}<small>${b.gente} membros</small>`}));
            const sel = el('select',{class:'campo'});
            for(const o of ops){
              const opt = el('option',{value:o.id, texto:`${o.nome} — ${o.nota}`});
              if(o.id === b.destino) opt.selected = true;
              sel.appendChild(opt);
            }
            sel.onchange = ()=>{
              p.destinos[b.i] = sel.value; p.decidido = false; redesenhar();
            };
            linha.appendChild(sel);
            cB.corpo.appendChild(linha);
          }
          const brigam = P.destinos(e).filter(x=>x.ponto).length;
          cB.corpo.appendChild(el('div',{class:'linha-dado', html:
            `<span class="fraco">${brigam
              ? `${brigam} ${brigam===1?'frente de ataque':'frentes de ataque'} e `+
                `${p.bondes-brigam} entrando pelo portão`
              : 'todos entram pelo portão'}</span>`}));
        }
      }
      esq.appendChild(cB);
    }

    /* ---------- 4. outros jogos na cidade ---------- */
    const outros = P.outrosJogosNaCidade(e, e.data.semana);
    const cO = quadroDobra('outros', 'Outros jogos na cidade',
      el('span',{class:'conta', texto: outros.length
        ? `${outros.length} nesta semana` : 'nenhum'}));
    if(cO.aberto){
      if(!outros.length)
        cO.corpo.appendChild(el('div',{class:'em-construcao',
          texto:'Nenhum outro time da praça joga em casa nesta semana.'}));
      for(const g of outros){
        cO.corpo.appendChild(el('div',{class:'aliado-cab', html:
          `<span class="escudinho" style="background:${corClube(g.casa.id)}"></span>
           <div><b>${g.casa.nome} × ${g.vis.nome}</b>
             <small>${g.comp} · torcida de fora circulando pela cidade</small></div>`}));
        const ops = [{id:'', rot:'Deixar passar', nota:'ninguém sai da sede por isso'}]
          .concat(g.visitantes.map(v=>({
            id:v.id, rot:`Cair em cima da ${v.torcida.nome}`,
            nota:`${v.aliada?'ALIADA — isso é traição · ':''}`+
                 `${v.torcida.membros} membros · custa uma ação da semana`})));
        cO.corpo.appendChild(opcoes(ops, p.investidas[g.chave] || '',
          id=>{ if(id) p.investidas[g.chave]=id; else delete p.investidas[g.chave];
                p.decidido=false; redesenhar(); }));
      }
    }
    dir.appendChild(cO);

    /* ---------- 5. aliados na cidade ---------- */
    const aliados = P.aliadosNaCidade(e, e.data.semana);
    const padrao = P.recepcaoPadrao(e);
    const cA = quadroDobra('aliados', 'Aliados na nossa cidade', el('span',{class:'conta',
      texto: aliados.length ? `${aliados.length} nesta semana` : 'ninguém nesta semana'}));
    if(cA.aberto){
      cA.corpo.appendChild(el('div',{class:'fase-rot', texto:'Recepção padrão'}));
      cA.corpo.appendChild(opcoes(
        [{id:'', rot:'Decidir caso a caso', nota:'a tela pergunta toda vez'}]
          .concat(P.RECEPCAO.map(r=>({id:r.id, rot:r.rot,
            nota:`${U.dinheiro(r.porCabeca)} por cabeça · relação `+
                 `${r.relacao>0?'+':''}${r.relacao}`}))),
        padrao || '', id=>{ P.definirRecepcaoPadrao(e, id); redesenhar(); }));

      if(!aliados.length)
        cA.corpo.appendChild(el('div',{class:'em-construcao',
          texto:'Nenhum time aliado joga aqui nesta semana.'}));
      for(const a of aliados){
        const nivel = P.nivelDe(e, a.id);
        cA.corpo.appendChild(el('div',{class:'aliado-cab', html:
          `<span class="escudinho" style="background:${a.torcida.cores[0]}"></span>
           <div><b>${a.torcida.nome}</b>
             <small>${a.clube.nome} joga contra o ${a.adversario.nome} · `+
          `relação ${Math.round(a.relacao)} · vêm ~${a.estimativa}</small></div>`}));
        cA.corpo.appendChild(opcoes(P.RECEPCAO.map(r=>({
          id:r.id, rot:r.rot + (padrao===r.id ? ' (padrão)' : ''),
          custo:r.porCabeca*a.estimativa,
          nota:`${r.nota} · relação ${r.relacao>0?'+':''}${r.relacao}`,
          desabilitada: r.porCabeca*a.estimativa > e.dinheiro && r.id!=='nada'
        })), nivel, id=>{ p.recepcao[a.id]=id; p.decidido=false; redesenhar(); }));
      }
    }
    dir.appendChild(cA);

    /* ---------- 6. caravana ---------- */
    const listaRotas = P.rotas(e);
    if(listaRotas.length){
      const est = P.estimativaCaravana(e);
      const cC = quadroDobra('caravana', 'Caravana', el('span',{class:'conta',
        texto:`${est.vao} para ${j.cidadeAdv} · ${U.dinheiro(est.custo)}`}));
      if(cC.aberto){
        cC.corpo.appendChild(el('div',{class:'linha-dado', html:
          `<span>Interessados em ir</span><b>${est.interessados} de ${est.aptos}</b>`}));
        cC.corpo.appendChild(el('div',{class:'linha-dado', html:
          medidor('Vontade de viajar', Math.round(est.vontade*100), 100,
                  est.vontade>0.5?'var(--verde)':'var(--ouro)')}));

        const passo = Math.max(1, Math.round(est.interessados/10));
        const linhaQtd = el('div',{class:'contador'});
        const bMenos = el('button',{texto:'−'}), bMais = el('button',{texto:'+'});
        bMenos.disabled = est.vao <= est.minimo;
        bMais.disabled  = est.vao >= est.interessados;
        bMenos.onclick = ()=>{ p.caravana = Math.max(est.minimo, est.vao-passo);
                               p.decidido=false; redesenhar(); };
        bMais.onclick  = ()=>{ p.caravana = Math.min(est.interessados, est.vao+passo);
                               p.decidido=false; redesenhar(); };
        linhaQtd.append(bMenos, el('b',{texto:String(est.vao)}), bMais,
          el('small',{texto:`embarcam · ${U.dinheiro(est.porCabeca)} por cabeça`}));
        cC.corpo.appendChild(linhaQtd);

        cC.corpo.appendChild(el('div',{class:'fase-rot', texto:'Estrada'}));
        cC.corpo.appendChild(opcoes(listaRotas.map(r=>({
          id:r.id, rot:r.nome, custo:Math.round(r.custo*0.4),
          nota:`${r.nota}${r.risco?` · risco ${Math.round(r.risco)}`:' · sem território hostil'}`
        })), (p.rota || listaRotas[0].id), id=>{ p.rota=id; p.decidido=false; redesenhar(); }));

        const r = P.rotaEscolhida(e);
        if(r && r.cidades.length>1){
          cC.corpo.appendChild(el('div',{class:'trajeto', html:
            r.cidades.map((c,i)=>{
              const nome = (TO.mundo.cidade(c)||{}).nome || c;
              const hostil = P.hostilidade(e, c);
              return `<span class="parada${i===0?' saida':''}${
                i===r.cidades.length-1?' chegada':''}${hostil>40?' hostil':''}">${nome}</span>`;
            }).join('<i>›</i>')}));
          if(r.rodovias.length)
            cC.corpo.appendChild(el('div',{class:'linha-dado', html:
              `<span class="fraco">${r.rodovias.join(' · ')}</span>`}));
        }
        cC.corpo.appendChild(el('div',{class:'linha-dado', html:
          `<span>Ônibus e pedágio</span><b>${U.dinheiro(est.bruto)}</b>`}));
        cC.corpo.appendChild(el('div',{class:'linha-dado', html:
          `<span>Rateio entre os que vão</span><b class="positivo">`+
          `${U.dinheiro(est.rateio)}</b>`}));
        cC.corpo.appendChild(el('div',{class:'linha-dado total', html:
          `<span>Sai do caixa</span><b class="negativo">${U.dinheiro(-est.custo)}</b>`}));
      }
      dir.appendChild(cC);
    }

    /* ---------- 7. fechar o plano ---------- */
    const cF = quadroP('Plano da semana');
    const resumo = [];
    if(!j) resumo.push('Sem jogo nesta semana.');
    else{
      resumo.push(TO.financeiro.precisaCaravana(e)
        ? `Caravana para ${j.cidadeAdv} com ${P.efetivoDaSaida(e)}.`
        : `Ao estádio com ${P.efetivoDaSaida(e)}.`);
      if(p.intencao === 'paz') resumo.push('Entrada em paz pelo portão.');
      else{
        const alvo = TO.mundo.torcida(p.alvoTorcida);
        resumo.push(`${p.intencao==='trair'?'Traição contra':'Ataque à'} `+
          `${alvo?alvo.nome:'torcida rival'} em ${P.ponto(p.alvo).nome}`+
          `${p.bombas?` com ${p.bombas} bomba${p.bombas>1?'s':''}`:', só na pedra'}.`);
      }
      for(const d2 of P.destinos(e))
        if(p.bondes > 1)
          resumo.push(`Bonde ${d2.zona}: ${d2.ponto ? 'atacar em '+d2.ponto.nome
                                                    : 'direto pro estádio'} (${d2.gente}).`);
    }
    let gasto = 0;
    for(const a of aliados){
      const n = P.nivelDe(e, a.id);
      if(!n || n==='nada') continue;
      const c = P.custoRecepcao(n, a.estimativa);
      gasto += c;
      resumo.push(`${P.recepcaoDe(n).rot} para a ${a.torcida.nome} (${U.dinheiro(c)}).`);
    }
    let invs = 0;
    for(const [chave, alvo] of Object.entries(p.investidas||{})){
      if(!alvo) continue;
      const o = TO.mundo.torcida(alvo);
      invs++;
      resumo.push(`Investida contra a ${o?o.nome:alvo} num jogo da cidade.`);
    }
    for(const t of resumo)
      cF.corpo.appendChild(el('div',{class:'linha-dado', html:`<span>${t}</span>`}));
    if(invs)
      cF.corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span class="fraco">${invs} ${invs===1?'investida gasta':'investidas gastam'} `+
        `${invs} de ${TO.acoes.restantes(e)} ${TO.acoes.restantes(e)===1?'ação':'ações'} `+
        'que sobraram na semana.</span>'}));
    if(gasto)
      cF.corpo.appendChild(el('div',{class:'linha-dado total', html:
        `<span>A pagar agora</span><b class="negativo">${U.dinheiro(-gasto)}</b>`}));

    const tipo = P.tipoDoJogo(e) === 'fora' ? 'de viagem' : 'em casa';
    if(P.temPadrao(e))
      cF.corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span class="fraco">Este plano vem do padrão ${tipo} e é aplicado `+
        'sozinho toda semana.</span>'}));

    const bt = el('button',{class:'bt destaque larga',
      texto: p.decidido ? 'Plano fechado' : 'Fechar o plano'});
    bt.disabled = !!p.decidido;
    bt.onclick = ()=>{
      const r = P.confirmar(e);
      aviso(r.gasto ? `Plano fechado. ${U.dinheiro(r.gasto)} de recepção.`
                    : 'Plano fechado.', 'boa');
      redesenhar();
    };
    const btPad = el('button',{class:'bt larga',
      texto: P.temPadrao(e) ? `Esquecer padrão ${tipo}` : `Salvar como padrão ${tipo}`});
    btPad.onclick = ()=>{
      if(P.temPadrao(e)){ P.esquecerPadrao(e); aviso('Padrão esquecido.','ruim'); }
      else { P.salvarPadrao(e);
             aviso(`Padrão ${tipo} salvo. Semanas assim já vêm decididas.`,'boa'); }
      redesenhar();
    };
    cF.rodape(btPad, bt);
    dir.appendChild(cF);

    grade.append(esq, dir);
    pg.appendChild(grade);
  }

  /* =======================================================
     CALENDÁRIO
     Três abas, como no mockup: o mês da torcida, a rotina que
     roda sozinha e a agenda de qualquer clube.
     ======================================================= */
  let abaCal = 'torcida', mesCal = null, agendaClube = null, agendaFiltro = 'todas';

  const MES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho',
                    'Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const DIA_CURTO = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const DIA_LONGO = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];

  function pintarCalendario(){
    const e = E(), pg = U.$('.pagina[data-pag="calendario"]');
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-barra', html:'<h1>Calendário</h1>'}));
    pg.appendChild(abasGrandes([
      {id:'torcida', rot:'Calendário da torcida'},
      {id:'rotina',  rot:'Rotina semanal'},
      {id:'time',    rot:'Agenda do time'}
    ], abaCal, id=>{ abaCal=id; redesenhar(); }));

    if(!e.temporada){
      pg.appendChild(emConstrucao('Sem calendário','Comece um jogo novo pra gerar a tabela.'));
      return;
    }
    if(abaCal==='rotina') pg.appendChild(painelRotina(e));
    else if(abaCal==='time') pg.appendChild(painelAgendaTime(e));
    else pg.appendChild(painelMes(e));
  }

  /* ---------- aba 1: o mês ---------- */
  function painelMes(e){
    const C = TO.competicoes;
    const hoje = TO.estado.dataDaSemana(e.data.ano, e.data.semana, e.data.dia);
    if(mesCal===null) mesCal = hoje.getFullYear()*12 + hoje.getMonth();
    const ano = Math.floor(mesCal/12), mes = mesCal%12;

    const q = el('div',{class:'quadro'});
    const cab = el('div',{class:'mes-cab'});
    const ant = el('button',{html:'‹'}), pro = el('button',{html:'›'});
    ant.onclick = ()=>{ mesCal--; redesenhar(); };
    pro.onclick = ()=>{ mesCal++; redesenhar(); };
    cab.appendChild(ant);
    cab.appendChild(el('div',{class:'titulo',
      html:`${MES_NOME[mes]}<small>de ${ano}</small>`}));
    cab.appendChild(pro);
    q.appendChild(cab);

    /* agenda do clube indexada por semana e dia: numa semana de Copa do
       Brasil tem jogo na quarta e no sábado */
    const agenda = new Map(), caravanas = new Map();
    for(const j of C.agendaDoClube(e, e.torcida.clubeId)){
      agenda.set(`${j.semana}/${j.dia}`, j);
      /* jogo fora, em outra cidade: a véspera e o dia seguinte são da
         caravana e a semana perde esses dias (GDD §7.3) */
      const viagem = TO.financeiro.diasDaViagem(e, j);
      if(!viagem.length) continue;
      const t = TO.mundo.time(j.adversario);
      const cidade = (TO.mundo.cidade(t.mapa)||{}).nome || t.cidade || '';
      /* dias corridos: a volta de um jogo de domingo cai na segunda,
         já na semana seguinte */
      viagem.forEach((a, i)=>{
        const semana = Math.floor(a/7)+1, dia = (a%7)+1;
        caravanas.set(`${semana}/${dia}`, {rot: i===0?'IDA':'VOLTA', cidade});
      });
    }

    const grade = el('div',{class:'mes'});
    for(const d of DIA_CURTO) grade.appendChild(el('div',{class:'cab', texto:d}));

    const primeiro = new Date(ano, mes, 1);
    const noMes = new Date(ano, mes+1, 0).getDate();
    const inicio = new Date(primeiro);
    inicio.setDate(1 - primeiro.getDay());        // volta até o domingo
    /* só as semanas que tocam o mês: nada de linha vazia no fim */
    const celulas = Math.ceil((primeiro.getDay() + noMes)/7) * 7;
    for(let k=0;k<celulas;k++){
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + k);
      grade.appendChild(celulaDoDia(e, d, mes, hoje, agenda, caravanas));
    }
    q.appendChild(grade);
    return q;
  }

  function celulaDoDia(e, d, mesAtual, hoje, agenda, caravanas){
    const sd = TO.estado.semanaDiaDe(d);
    const cel = el('div',{class:'dia'});
    const classes = [];
    if(d.getMonth() !== mesAtual) classes.push('fora-do-mes');
    const mesmoDia = d.toDateString() === hoje.toDateString();
    if(mesmoDia) classes.push('hoje');
    else if(d < hoje) classes.push('passou');

    cel.appendChild(el('span',{class:'n', texto:String(d.getDate())}));

    if(sd && sd.ano===e.data.ano){
      const j  = agenda.get(`${sd.semana}/${sd.dia}`);
      const cv = caravanas.get(`${sd.semana}/${sd.dia}`);

      if(j){
        classes.push('jogo');
        cel.appendChild(el('span',{class:'rot', html:
          `<i style="background:${corClube(j.adversario)}"></i>`+
          `${j.casa?'':'@ '}${nomeClube(j.adversario)}`}));
        cel.appendChild(el('span',{class:'sub',
          texto: j.jogado ? `${j.gp} × ${j.gc}`
               : `${j.comp} · ${j.neutro ? 'neutro' : j.casa?'casa':'fora'}`}));
      }else if(cv){
        classes.push('caravana');
        cel.appendChild(el('span',{class:'rot', html:
          `${IC.get('onibus')}Caravana`}));
        cel.appendChild(el('span',{class:'sub', texto:`${cv.rot} · ${cv.cidade}`}));
      }else{
        /* a rotina fica registrada no calendário, inclusive nos dias
           que transbordam pro mês vizinho */
        const id = (e.rotina||{})[sd.dia];
        const a = id && TO.acoes.porId(id);
        if(a) cel.appendChild(el('span',{class:'acao',
          html:`${IC.get(a.icone)}<span>${a.nome}</span>`}));
      }
    }
    cel.className = 'dia ' + classes.join(' ');
    return cel;
  }

  /* ---------- aba 2: a rotina ---------- */
  function painelRotina(e){
    const cx = el('div');
    cx.appendChild(el('div',{class:'recado', html:
      `Defina sua <b>rotina semanal padrão</b>. Cada dia da semana ganha uma ação, `+
      `aplicada sozinha quando o dia passa.
       <small>Em dia de jogo e nos dias de caravana a rotina é ignorada, e ela nunca `+
      `gasta mais do que as ${TO.acoes.maximo(e)} ações da semana (GDD §3.1).</small>`}));

    const disponiveis = TO.acoes.LISTA.filter(a=>a.disponivel(e).ok || (e.rotina||{}))
      .filter(a=>!['atacar','assalto','pressionar'].includes(a.id));

    for(let dia=1; dia<=7; dia++){
      const linha = el('div',{class:'linha-rotina'+(dia===e.data.dia?' hoje':'')});
      linha.appendChild(el('span',{texto:DIA_LONGO[dia-1]}));
      const sel = el('select',{class:'campo'});
      sel.appendChild(el('option',{value:'', texto:'— sem ação —'}));
      for(const a of disponiveis){
        const o = el('option',{value:a.id, texto:`${a.nome} — ${a.efeito}`});
        if((e.rotina||{})[dia]===a.id) o.selected = true;
        sel.appendChild(o);
      }
      sel.onchange = ()=>{
        e.rotina = e.rotina || {};
        if(sel.value) e.rotina[dia] = sel.value; else delete e.rotina[dia];
        redesenhar();
      };
      linha.appendChild(sel);
      cx.appendChild(linha);
    }
    return cx;
  }

  /* ---------- aba 3: a agenda de um clube ---------- */
  function painelAgendaTime(e){
    const C = TO.competicoes;
    const meu = TO.mundo.time(e.torcida.clubeId);
    if(!agendaClube) agendaClube = meu ? meu.id : TO.mundo.todosTimes[0].id;
    const clube = TO.mundo.time(agendaClube) || meu;

    const cx = el('div');

    /* seletor de clube */
    const escolha = el('div',{class:'escolha-time'});
    const col = el('div');
    col.appendChild(el('div',{class:'rot', texto:'Ver agenda de'}));
    const sel = el('select',{class:'campo'});
    for(const t of [...TO.mundo.todosTimes].sort((a,b)=>a.nome<b.nome?-1:1)){
      const o = el('option',{value:t.id,
        texto: t.id===(meu&&meu.id) ? `${t.nome} (seu time)` : t.nome});
      if(t.id===agendaClube) o.selected = true;
      sel.appendChild(o);
    }
    sel.onchange = ()=>{ agendaClube = sel.value; agendaFiltro='todas'; redesenhar(); };
    col.appendChild(sel);
    escolha.appendChild(col);
    escolha.appendChild(el('div',{class:'quem', html:
      `<i style="background:${corClube(clube.id)}"></i>
       <div><b>${clube.nome}</b>
         <small style="margin-left:8px">${clube.cidade} · `+
      `${clube.divisao.replace('Brasileirão ','')}</small></div>`}));
    cx.appendChild(escolha);

    const agenda = C.agendaDoClube(e, clube.id);
    const comps = [...new Set(agenda.map(j=>j.comp))];
    cx.appendChild(subabas(
      [{id:'todas', rot:'Todas'}].concat(comps.map(c=>({id:c, rot:c}))),
      agendaFiltro, id=>{ agendaFiltro=id; redesenhar(); }));

    const lista = agenda.filter(j=>agendaFiltro==='todas' || j.comp===agendaFiltro);
    const q = el('div',{class:'quadro'});
    const t = el('table',{class:'agenda'});
    t.innerHTML = `<thead><tr><th>Data</th><th>Hora</th><th>Competição</th>
                   <th>Local</th><th>Adversário</th><th style="text-align:center">Placar</th>
                   </tr></thead>`;
    const tb = el('tbody');
    for(const j of lista){
      const d = TO.estado.dataDaSemana(e.data.ano, j.semana, j.dia);
      const agora = j.semana===e.data.semana;
      const tr = el('tr',{class:agora?'meu':''});
      tr.innerHTML =
        `<td class="data"><b>${String(d.getDate()).padStart(2,'0')}/`+
          `${String(d.getMonth()+1).padStart(2,'0')}</b>
          <small>${DIA_CURTO[d.getDay()].toUpperCase()}</small></td>
         <td class="hora">${C.horaDoJogo({c:j.casa?clube.id:j.adversario,
                                          f:j.casa?j.adversario:clube.id})}</td>
         <td class="comp"><b>${j.comp}</b><small>${j.fase}</small></td>
         <td><span class="local ${j.casa?'casa':'fora'}">${j.casa?'Casa':'Fora'}</span></td>
         <td><span class="adv"><i style="background:${corClube(j.adversario)}"></i>
           ${nomeClube(j.adversario)}</span></td>
         <td class="placar">${j.jogado ? `${j.gp} × ${j.gc}` : '—'}</td>`;
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    const rolo = el('div',{class:'rolo', estilo:{maxHeight:'62vh'}});
    rolo.appendChild(t);
    q.appendChild(rolo);
    if(!lista.length)
      q.innerHTML = '<div class="em-construcao">Sem jogos nesta competição.</div>';
    cx.appendChild(q);
    return cx;
  }

  /* =======================================================
     DIPLOMACIA
     ======================================================= */
  let subDip = 'relacoes', buscaDip = '';

  /* barra de −100 a +100 com o zero no meio, como no mockup */
  function barraRelacao(v){
    const meio = 50, larg = Math.abs(v)/100*50;
    const esq = v<0 ? meio-larg : meio;
    const cor = v<=-70?'#cc0000' : v<0?'#e05a3a' : v<20?'#6d6d6d'
              : v<70?'#1ab31a' : '#1a80e6';
    return `<span class="rel-barra">
      <i style="left:${esq}%;width:${larg}%;background:${cor}"></i>
      <u></u></span>`;
  }

  /* tensão é escala 0–100 numa barra só, com a cor da faixa */
  function barraTensao(v){
    const f = TO.tensao.faixa(v);
    if(!v) return '<span class="ten-num fraco">—</span>';
    return `<span class="ten-barra" title="${f.nome}">
      <i style="width:${v}%;background:${f.cor}"></i></span>
      <span class="ten-num" style="color:${f.cor}">${Math.round(v)}</span>`;
  }

  /* quem está prestes a nos atacar, e por quê */
  function painelTensao(e){
    const lista = TO.tensao.panorama(e);
    const cx = el('div');
    const c = cartao('Termômetro', lista.length
      ? `${lista.filter(x=>x.tensao>=45).length} em ponto de briga`
      : 'nenhum atrito aberto');
    c.corpo.appendChild(el('div',{class:'linha-dado', html:
      '<span class="fraco">Relação é o que se pensa do outro; tensão é o que está '+
      'prestes a acontecer. Acima de 45 a torcida pode atacar a sede, o bar, a '+
      'caravana na estrada ou o bonde nos arredores.</span>'}));
    if(!lista.length){
      c.corpo.appendChild(el('div',{class:'em-construcao',
        texto:'Ninguém com contas a acertar. Por enquanto.'}));
    }
    for(const t of lista){
      c.corpo.appendChild(el('div',{class:'linha-tensao', html:
        `<span class="cor" style="background:${t.cores[0]}"></span>
         <span class="nm">${t.nome}<small>relação ${t.relacao>0?'+':''}${t.relacao}</small></span>
         ${barraTensao(t.tensao)}
         <span class="faixa" style="color:${t.faixa.cor}">${t.faixa.nome}</span>`}));
    }
    cx.appendChild(c);

    const focos = (e.focos||[]).slice(0,14);
    const h = cartao('O que esquentou', `${focos.length} episódios`);
    if(!focos.length) h.corpo.innerHTML =
      '<div class="em-construcao">Nada aconteceu ainda.</div>';
    for(const f of focos){
      const o = TO.mundo.torcida(f.id);
      h.corpo.appendChild(el('div',{class:'transacao', html:
        `<span class="dia">S${f.semana}</span>
         <span class="desc">${o?o.nome:f.id} — ${f.motivo}</span>
         <span class="val ${f.quanto>0?'negativo':'positivo'}">`+
        `${f.quanto>0?'+':''}${f.quanto}</span>`}));
    }
    cx.appendChild(h);
    return cx;
  }

  function pintarDiplomacia(){
    const e = E(), pg = U.$('.pagina[data-pag="diplomacia"]');
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Diplomacia'}));
    pg.appendChild(subabas([
      {id:'relacoes',    rot:'Relações'},
      {id:'aliancas',    rot:'Alianças'},
      {id:'rivalidades', rot:'Rivalidades'},
      {id:'tensao',      rot:'Tensão'}
    ], subDip, id=>{subDip=id; redesenhar();}));

    if(subDip === 'tensao'){ pg.appendChild(painelTensao(e)); return; }

    /* o valor corrente manda; o tipo da fonte é só o ponto de partida */
    const linhas = Object.entries(e.relacoes||{}).map(([id,v])=>{
      const o = TO.mundo.torcida(id);
      if(!o) return null;
      return {id, o, valor:v, tipo:TO.mundo.statusDoValor(v)};
    }).filter(Boolean);

    const filtradas = linhas
      .filter(l=> subDip==='aliancas'    ? l.valor>0
                : subDip==='rivalidades' ? l.valor<0 : true)
      .filter(l=> !buscaDip ||
        (l.o.nome+l.o.clube+l.o.cidade).toLowerCase().includes(buscaDip.toLowerCase()))
      .sort((a,b)=> subDip==='aliancas' ? b.valor-a.valor : a.valor-b.valor);

    const aliados = linhas.filter(l=>l.valor>0).length;
    const rivais  = linhas.filter(l=>l.valor<0).length;

    const c = cartao('Relações', `${aliados} aliadas · ${rivais} rivais · `+
      `${TO.mundo.jogaveis().length-1-linhas.length} neutras`);

    const bs = el('input',{class:'busca', type:'search',
      placeholder:'torcida, clube ou cidade…'});
    bs.value = buscaDip;
    bs.oninput = ev=>{ buscaDip = ev.target.value; pintarDiplomacia(); };
    c.corpo.appendChild(bs);

    if(!filtradas.length){
      c.corpo.appendChild(el('div',{class:'em-construcao', texto:'Nada nesta aba.'}));
      pg.appendChild(c); return;
    }

    const tab = el('table',{class:'dados'});
    tab.appendChild(el('thead',null,[el('tr',{html:
      `<th style="width:26%">Torcida</th><th style="width:18%">Clube</th>
       <th style="width:24%">Relação</th><th style="width:16%">Tensão</th>
       <th>Status</th><th>Ações</th>`})]));
    const tb = el('tbody');
    for(const l of filtradas.slice(0,120)){
      const est = TO.mundo.estiloRelacao(l.tipo);
      const tr = el('tr');
      tr.innerHTML =
        `<td>${l.o.nome}</td>
         <td>${l.o.clube}</td>
         <td>${barraRelacao(l.valor)}<span class="rel-num">${l.valor>0?'+':''}${Math.round(l.valor)}</span></td>
         <td>${barraTensao(TO.tensao.nivel(e, l.id))}</td>
         <td style="color:${est.corTexto}">${l.tipo}</td>
         <td class="rel-acoes"></td>`;
      const cel = tr.querySelector('.rel-acoes');

      const botao = (rot, titulo, ativo, fn)=>{
        const b = el('button',{class:'mini-bt', texto:rot, title:titulo});
        b.disabled = !ativo;
        b.onclick = fn;
        cel.appendChild(b);
      };
      botao('+', 'Aproximar', est.podeMelhorar, ()=>{
        e.relacoes[l.id] = U.limitar(l.valor+8, -100, 100);
        aviso(`Aproximação com ${l.o.nome}.`,'boa'); redesenhar();
      });
      botao('−', 'Provocar', est.podePiorar, ()=>{
        e.relacoes[l.id] = U.limitar(l.valor-8, -100, 100);
        aviso(`Provocação contra ${l.o.nome}.`,'ruim'); redesenhar();
      });
      botao('!', 'Atacar — entra na Fase 2', false, ()=>{});
      tb.appendChild(tr);
    }
    tab.appendChild(tb);
    c.corpo.appendChild(tab);
    pg.appendChild(c);
  }

  /* =======================================================
     PÁGINAS AINDA POR FAZER
     ======================================================= */
  const PENDENTES = {
    mapa:['Mapa da cidade',
      'Os 348 bairros já estão nos dados, com zona, classe social e multiplicador. '+
      'Falta o mapa em si — sede, subsedes, bares, lojas e território rival sobre '+
      'o desenho da praça (GDD §19.3).'],
    whatsapp:['WhatsApp',
      'Conversas com a diretoria, aliados e contatos. É por aqui que o tutorial acontece (GDD §22.4).'],
    noticias:['Notícias', 'Mundo vivo: o que a imprensa e as outras torcidas andam falando.'],
    conquistas:['Conquistas', 'Salão da fama lendo o histórico já salvo (GDD Apêndice C).']
  };
  function pintarPendente(id){
    const pg = U.$(`.pagina[data-pag="${id}"]`);
    pg.innerHTML='';
    const [tit, txt] = PENDENTES[id];
    pg.appendChild(el('div',{class:'titulo-pagina', texto:tit}));
    pg.appendChild(emConstrucao('Próxima fase', txt));
  }

  /* =======================================================
     ESCALAÇÃO → CENA → RELATÓRIO
     ======================================================= */
  let escalados = new Set();

  /* Torcida grande não cabe inteira num bonde — e a cena engasga acima
     de umas centenas de discos. Vêm marcados os mais rodados; o resto
     fica a critério do jogador. */
  const PADRAO_ESCALACAO = 60, PESADO = 120;

  function abrirEscalacao(){
    const aptos = TO.membros.aptosParaOEstadio(E());
    if(aptos.length < 4){ aviso('Gente apta de menos pra sair.','ruim'); return; }
    escalados = new Set([...aptos].sort((a,b)=>b.xp-a.xp)
                                  .slice(0, PADRAO_ESCALACAO).map(m=>m.id));
    pintarEscalacao(aptos);
    $('telaEscalacao').classList.remove('oculto');
  }

  function pintarEscalacao(aptos){
    $('subEscalacao').textContent =
      `${aptos.length} aptos · quem for escalado vira disco na cena`;
    const cx = $('corpoEscalacao'); cx.innerHTML='';
    cx.appendChild(el('div',{class:'linha-dado', html:
      `<span>Escalados</span><b id="contaEscalados" class="${
        escalados.size>PESADO?'negativo':''}">${escalados.size}</b>`}));
    if(escalados.size > PESADO)
      cx.appendChild(el('div',{class:'linha-dado', html:
        `<span class="fraco">Acima de ${PESADO} discos a cena começa a `+
        `engasgar. Leve os melhores.</span>`}));
    const bt = el('button',{class:'bt', texto:'Alternar todos',
      estilo:{marginBottom:'9px'}});
    bt.onclick = ()=>{
      if(escalados.size) escalados.clear(); else aptos.forEach(m=>escalados.add(m.id));
      pintarEscalacao(aptos);
    };
    cx.appendChild(bt);
    for(const m of [...aptos].sort((a,b)=>b.xp-a.xp)){
      const on = escalados.has(m.id);
      const it = el('div',{class:'item'+(on?' meu':''), html:
        `<div class="l1"><span class="nm">${TO.membros.nomeDe(m)}</span>
           <span class="qt">${on?'VAI':'fica'}</span></div>
         <div class="l2">${TO.membros.CARGOS[m.cargo].nome} · ${m.forca}/${m.defesa} · `+
        `moral ${m.moral.toFixed(0)} · ${m.xp} XP</div>`});
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
    TO.estado.bloquear(true);
    const p = TO.planejamento.plano(E());
    TO.diaJogo.ponte.montar({
      canvas: $('djPrincipal'),
      /* o plano da semana entra na cena: intenção e bombas levadas */
      config: { escalacao: lista, intencao: p.intencao, bombas: p.bombas },
      aoTerminar: fecharDiaDeJogo
    });
  }

  function fecharDiaDeJogo(res){
    TO.estado.bloquear(false);
    /* bomba jogada é bomba que não volta pro estoque (GDD §9.1) */
    const e = E();
    e.estoque = e.estoque || {bombas:0};
    e.estoque.bombas = Math.max(0, e.estoque.bombas - (res.bombasUsadas||0));
    const resumo = TO.membros.aplicarResultadoDaNoite(e, res);
    setTimeout(()=>{
      $('telaDiaJogo').classList.add('oculto');
      mostrarRelatorio(res, resumo);
    }, 1400);
  }

  function mostrarRelatorio(res, resumo){
    $('subRelatorio').textContent = res.motivo;
    const cx = $('corpoRelatorio');
    cx.innerHTML =
      `<div class="colunas">
         <div>
           <div class="valorao"><span>Prestígio da noite</span>
             <b class="${res.prestigio>=0?'positivo':'negativo'}">`+
      `${res.prestigio>0?'+':''}${res.prestigio}</b></div>
           <div class="linha-dado"><span>Caídos deles / seus</span>
             <b>${res.caidosVisitante} / ${res.caidosMandante}</b></div>
           <div class="linha-dado"><span>Entraram no estádio</span>
             <b>${resumo.entraram.length}</b></div>
         </div>
         <div>
           <div class="linha-dado"><span>XP distribuído</span><b>${resumo.xpTotal}</b></div>
           <div class="linha-dado"><span>Grade rompida</span><b>${res.rompido?'sim':'não'}</b></div>
           <div class="linha-dado"><span>Presos</span><b>${resumo.presos.length}</b></div>
         </div>
       </div>`;
    if(resumo.feridos.length){
      cx.appendChild(el('div',{class:'titulo-pagina',
        texto:`Feridos — ${TO.membros.DIAS_FERIDO} dias fora`,
        estilo:{fontSize:'14px', paddingTop:'12px'}}));
      for(const m of resumo.feridos)
        cx.appendChild(el('div',{class:'item ferido', html:
          `<div class="l1"><span class="nm">${TO.membros.nomeDe(m)}</span>
             <span class="qt">${TO.membros.CARGOS[m.cargo].nome}</span></div>`}));
    }
    if(resumo.presos.length){
      cx.appendChild(el('div',{class:'titulo-pagina', texto:'Presos',
        estilo:{fontSize:'14px', paddingTop:'12px'}}));
      for(const m of resumo.presos)
        cx.appendChild(el('div',{class:'item preso', html:
          `<div class="l1"><span class="nm">${TO.membros.nomeDe(m)}</span>
             <span class="qt">fiança ${U.dinheiro(TO.membros.fianca(m))}</span></div>`}));
    }
    if(!resumo.feridos.length && !resumo.presos.length)
      cx.appendChild(el('div',{class:'em-construcao', texto:'Ninguém ficou pra trás.'}));
    $('telaRelatorio').classList.remove('oculto');
  }

  /* =======================================================
     TICKER
     ======================================================= */
  let tickerLigado = false;
  function ticker(){
    if(tickerLigado) return;
    tickerLigado = true;
    const fita = $('tickerFita');
    const frases = [
      'Polícia apreende materiais de organizada no interior paulista',
      'Briga entre torcidas deixa feridos em Campinas',
      'Federação estuda proibir bandeirões em clássicos',
      'Diretoria promete reforços para a próxima janela'
    ];
    fita.innerHTML = frases.map(f=>`<span>${f}</span>`).join('');
    let x = $('tickerCaixa').clientWidth;
    setInterval(()=>{
      x -= 0.55;
      if(x < -fita.scrollWidth) x = $('tickerCaixa').clientWidth;
      fita.style.transform = `translateX(${x}px)`;
    }, 16);
  }

  /* =======================================================
     REDESENHO
     ======================================================= */
  function redesenhar(){
    if(!E()) return;
    /* o que a rotina fez sozinha enquanto o jogador avançava os dias */
    const fila = E().avisos;
    if(fila && fila.length){
      for(const a of fila.splice(0, fila.length).slice(-4)) aviso(a.msg, a.tipo);
    }
    pintarTopo();
    trocarPagina();
    if(pagina==='inicio') pintarInicio();
    else if(pagina==='torcida') pintarTorcida();
    else if(pagina==='financeiro') pintarFinanceiro();
    else if(pagina==='gestao') pintarGestao();
    else if(pagina==='calendario') pintarCalendario();
    else if(pagina==='competicoes') pintarCompeticoes();
    else if(pagina==='diplomacia') pintarDiplomacia();
    else pintarPendente(pagina);
  }

  /* =======================================================
     LIGAÇÃO
     ======================================================= */
  TO.estado.aoMudar(redesenhar);
  /* o fechamento é o momento em que a semana cobra o que prometeu */
  TO.estado.aoFecharSemana(rel=>{ abrirFechamento(rel); TO.estado.salvar(); });
  $('btSelecionarTorcida').onclick = ()=>{
    if(!escolhida) return;
    TO.estado.novo({torcida: escolhida});
    entrarNoJogo();
  };
  $('btVoltarMenu').onclick = ()=>{
    $('telaSelecao').classList.add('oculto');
    $('telaMenu').classList.remove('oculto');
  };
  $('btConfirmarEscalacao').onclick = comecarDiaDeJogo;
  $('btCancelarEscalacao').onclick = ()=>$('telaEscalacao').classList.add('oculto');
  $('btFecharRelatorio').onclick = ()=>{
    $('telaRelatorio').classList.add('oculto');
    TO.estado.avancarDia();
    TO.estado.salvar();
  };
  addEventListener('keydown', ev=>{
    if(!E()) return;
    if(ev.ctrlKey && ev.key==='s'){
      ev.preventDefault();
      const r = TO.estado.salvar();
      aviso(r.ok?'Salvo.':'Não salvou: '+r.motivo, r.ok?'boa':'ruim');
    }
  });

  montarMenu();
})();
