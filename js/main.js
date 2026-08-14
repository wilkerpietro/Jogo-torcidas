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
    const sem = TO.financeiro.resumoDaSemana(e);
    const cFin = cartao('Resumo da semana');
    cFin.corpo.innerHTML =
      `<div class="linha-dado"><span>Receitas</span>
         <b class="positivo">${U.dinheiro(sem.receita)}</b></div>
       <div class="linha-dado"><span>Despesas</span>
         <b class="negativo">${U.dinheiro(-sem.despesa)}</b></div>`
      + (sem.gestao.total
         ? `<div class="linha-dado"><span class="fraco">— disso, decidido na Gestão`+
           `${sem.gestao.pendente?'':' (pago)'}</span>`+
           `<b class="negativo">${U.dinheiro(-sem.gestao.total)}</b></div>` : '')
      + `<div class="linha-dado"><span>Saldo previsto</span>
           <b class="${sem.saldo>=0?'positivo':'negativo'}">${U.dinheiro(sem.saldo)}</b></div>`;
    const verFin = el('button',{class:'bt larga', texto:'Ver finanças'});
    verFin.onclick = ()=>{ pagina='financeiro'; redesenhar(); };
    cFin.rodape(verFin);
    dir.appendChild(cFin);

    /* GDD §21: o humor do torcedor comum, que decide público e recruta */
    const fx  = TO.torcedores.faixaDe(e);
    const sat = e.indicadores.satisfacao;
    const pub = TO.torcedores.publicoDaCidade(e);
    const cSat = cartao('A cidade', fx.nome.toLowerCase());
    cSat.corpo.innerHTML =
      `<div class="valorao"><span>Satisfação com o time</span>
         <b style="color:${fx.cor}">${sat.toFixed(1)}<span class="fraco"> de 20</span></b></div>
       <div class="linha-dado">${medidor('Humor da praça', Math.round(sat*5), 100, fx.cor)}</div>
       <div class="linha-dado"><span>Topam entrar na organizada</span>
         <b>${Math.round(fx.organizar*100)}%</b></div>
       <div class="linha-dado"><span>Vão ao estádio</span>
         <b>${U.numero(pub.publico)} `+
      `<span class="fraco">${pub.lotado ? 'lotado'
        : Math.round(pub.ocupacao*100)+'% do estádio'}</span></b></div>
       <div class="linha-dado"><span class="fraco">${fx.nota}. Vitória em clássico `+
      `dá até +5; derrota tira o mesmo.</span></div>`;
    dir.appendChild(cSat);

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
    const usar = opc=>{
      const r = TO.acoes.executar(e, a.id, opc);
      aviso(r.msg || (r.ok?'Feito.':'Não deu.'),
            r.ok && r.tipo!=='ruim' ? 'boa' : 'ruim');
      aoUsar && aoUsar();
      redesenhar();
      /* ação que abre cena não termina aqui: termina quando a tela fecha */
      if(r.ok && r.cena) abrirAcaoEmCena(r.cena);
    };
    b.onclick = ()=>{
      if(a.alvos) escolherAlvo(a, alvo=>usar(alvo ? {alvo:alvo.id} : null));
      else usar(null);
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
          `<span>${i.rot}${i.daGestao?' <span class="tag">gestão</span>':''}</span>`+
          `<b class="${neg?'negativo':'positivo'}">`+
          `${U.dinheiro(neg?-i.v:i.v)}</b>`}));
      d.appendChild(el('div',{class:'linha-dado total', html:
        `<span>Total</span><b class="${neg?'negativo':'positivo'}">`+
        `${U.dinheiro(neg?-total:total)}</b>`}));
      return d;
    };
    corpo.appendChild(bloco('Receitas', rel.receitas, rel.receita, false));
    corpo.appendChild(bloco('Despesas', rel.despesas, rel.despesa, true));

    const fim = el('div',{class:'col largo'});
    /* o que a Gestão decidiu e não sai em dinheiro: investida gasta ação,
       aliado não recebido não custa nada e mesmo assim pesa */
    const semGrana = (rel.compromissos||[]).filter(i=>i.tipo !== 'dinheiro');
    if(semGrana.length){
      fim.appendChild(el('h3',{texto:'Também decidido na Gestão'}));
      for(const i of semGrana)
        fim.appendChild(el('div',{class:'linha-dado', html:
          `<span>${i.rot} <small class="fraco">${i.nota}</small></span>
           <b class="fraco">${i.tipo==='acao' ? '1 ação' : 'sem custo'}</b>`}));
    }
    if(rel.compromissoTotal)
      fim.appendChild(el('div',{class:'linha-dado', html:
        `<span class="fraco">Das despesas, ${U.dinheiro(rel.compromissoTotal)} `+
        'saíram de decisão da Gestão, e não da conta fixa.</span>'}));
    fim.appendChild(el('div',{class:'linha-dado total', html:
      `<span>Saldo da semana</span><b class="${rel.saldo>=0?'positivo':'negativo'}">`+
      `${U.dinheiro(rel.saldo)}</b>`}));
    if(rel.foraDaConta)
      fim.appendChild(el('div',{class:'linha-dado', html:
        `<span>Ações e imprevistos da semana</span>`+
        `<b class="${rel.foraDaConta<0?'negativo':'positivo'}">`+
        `${U.dinheiro(rel.foraDaConta)}</b>`}));
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
      {id:'recrutamento', rot:'Recrutamento'}
    ], subTorcida, id=>{subTorcida=id; redesenhar();}));

    if(subTorcida==='treinamentos'){ pg.appendChild(painelTreinos()); return; }
    if(subTorcida==='hierarquia'){ pg.appendChild(painelHierarquia()); return; }
    if(subTorcida==='recrutamento'){ pg.appendChild(painelRecrutamento()); return; }

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

    const c1 = cartao('Fila de treino',
      `${fila.length} na fila · ${cap} vagas · sorteada toda semana`);
    if(!fila.length){
      c1.corpo.innerHTML = `<div class="em-construcao">Ninguém na fila. `+
        `Ela é sorteada no virar da semana; até lá dá pra escalar `+
        `à mão em Membros → Ações.</div>`;
    } else {
      fila.forEach((m,i)=>{
        const pl = TO.membros.planoDeTreino(m);
        const falta = pl.noTeto ? 'no teto do cargo'
          : `${pl.sessoes} ${pl.sessoes===1?'sessão':'sessões'} até o teto ${pl.teto}`;
        c1.corpo.appendChild(el('div',{class:'item'+(i<cap?' meu':''), html:
          `<div class="l1"><span class="nm">${TO.membros.nomeDe(m)}</span>
             <span class="qt">${m.forca}/${m.defesa}</span></div>
           <div class="l2">${i<cap?'treina hoje':'aguarda vaga'} · ${falta} · frações `+
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
    const btS = el('button',{class:'bt larga', texto:'Sortear outra fila'});
    btS.onclick = ()=>{
      const n = TO.membros.sortearFila(e);
      aviso(`Fila refeita: ${n} ${n===1?'nome':'nomes'}.`);
      redesenhar();
    };
    c1.rodape(bt, btS);
    grade.appendChild(c1);

    /* GDD §5.4 — quem ainda tem o que ganhar, por cargo */
    const c2 = cartao('Plano de treino', 'GDD §5.4');
    const disp = e.membros.filter(m=>TO.membros.disponivel(m));
    const emTeto = disp.filter(m=>TO.membros.planoDeTreino(m).noTeto).length;
    c2.corpo.innerHTML =
      `<div class="linha-dado"><span>Ganho por sessão</span><b>0.00 a 0.30</b></div>
       <div class="linha-dado"><span>Vagas por dia</span><b>${cap}</b></div>
       <div class="linha-dado"><span>Disponíveis pra treinar</span>
         <b>${disp.length - emTeto} <span class="fraco">de ${disp.length}</span></b></div>
       <div class="linha-dado"><span>Já no teto do cargo</span>
         <b class="fraco">${emTeto}</b></div>`;
    for(const cargo of ['novato','componente','frente','diretoria']){
      const C = TO.membros.CARGOS[cargo];
      const dele = disp.filter(m=>m.cargo===cargo);
      if(!dele.length) continue;
      const falt = dele.reduce((s,m)=>s+TO.membros.planoDeTreino(m).sessoes, 0);
      c2.corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span>${C.nome} <span class="fraco">teto ${C.teto}</span></span>
         <b>${dele.length} <span class="fraco">· ${falt} sessões pra encher</span></b>`}));
    }
    c2.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span class="fraco">O atributo só sobe de inteiro quando a fração `+
      `acumula, e veterano leva +2 acima do teto do cargo. A fila se renova `+
      `sozinha toda semana, priorizando quem ainda tem o que ganhar.</span>`}));
    grade.appendChild(c2);
    return grade;
  }

  /* GDD §6.2 — a praça é finita: o que dá pra recrutar é o torcedor do
     clube que mora aqui e ainda não é de organizada nenhuma. */
  function painelRecrutamento(){
    const e = E();
    const p = TO.acoes.previsaoRecrutamento(e);
    const cid = TO.mundo.cidade(e.torcida.mapa);
    const clube = TO.mundo.time(e.torcida.clubeId);
    const naPraca = ((cid && cid.times) || [])
      .find(x=>x.clubeId===e.torcida.clubeId) || {};
    const torcedores = naPraca.torcedores || 0;
    const org = TO.acoes.organizadasDaPraca(e);
    const organizados = org.reduce((s,o)=>s+o.membros, 0);

    const grade = el('div',{class:'colunas'});

    const c1 = cartao(`Torcedores do ${clube?clube.nome:'clube'} em ${cid?cid.nome:'—'}`,
                      `${U.numero(torcedores)} mil na praça`);
    c1.corpo.innerHTML =
      `<div class="valorao"><span>Fora de organizada</span>
         <b class="${p.base>0?'positivo':'negativo'}">${U.numero(Math.round(p.base))}`+
      `<span class="fraco"> mil</span></b></div>
       <div class="linha-dado"><span>Já organizados</span>
         <b>${organizados} <span class="fraco">pessoas</span></b></div>`;
    for(const o of org)
      c1.corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span class="${o.nossa?'':'fraco'}">${o.torcida.nome}`+
        `${o.nossa?' <span class="tag">nós</span>':''}</span>
         <b class="${o.nossa?'':'fraco'}">${o.membros}</b>`}));
    c1.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span class="fraco">Recrutar tira gente desse bolo. Ele só cresce `+
      `quando o clube sobe de divisão e ganha torcedor na praça.</span>`}));
    grade.appendChild(c1);

    const c2 = cartao('Previsão da próxima campanha', 'GDD §6.2 e §21');
    c2.corpo.innerHTML =
      `<div class="linha-dado"><span>Abordados na semana <span class="fraco">`+
        `3% da base</span></span><b>${U.numero(Math.round(p.alcance*1000))}</b></div>
       <div class="linha-dado"><span>Cidade ${p.faixa.nome.toLowerCase()}
         <span class="fraco">chance de topar</span></span>
         <b style="color:${p.faixa.cor}">${Math.round(p.chance*100)}%</b></div>
       <div class="linha-dado"><span>Topariam entrar</span>
         <b>${U.numero(p.querem)}</b></div>
       <div class="linha-dado"><span>Teto por campanha</span>
         <b>${p.cap} <span class="fraco">${p.capSede} da sede + ${p.capBase} `+
        `da praça</span></b></div>
       <div class="linha-dado"><span>Vagas na sede</span>
         <b class="${p.vaga>0?'':'negativo'}">${p.vaga}</b></div>
       <div class="valorao"><span>Devem entrar</span>
         <b class="${p.esperado>0?'positivo':'negativo'}">~${p.esperado}</b></div>
       <div class="linha-dado"><span class="fraco">O gargalo é a sede, não a `+
      `vontade do torcedor (GDD §21): milhares topariam e cabem dezenas. `+
      `Cidade Muito Contente enche o teto; insatisfeita rende um quinze avos `+
      `dele. Sai R$ 5 por novato, com ±15% de variância.</span></div>`;
    for(const id of ['recrutar','campanha']){
      const a = TO.acoes.porId(id);
      if(a) c2.corpo.appendChild(linhaAcao(a));
    }
    grade.appendChild(c2);

    const h = e.historicoRecrutamento || [];
    const c3 = cartao('Campanhas anteriores', `${h.length} registradas`);
    if(!h.length) c3.corpo.innerHTML =
      '<div class="em-construcao">Nenhuma campanha ainda.</div>';
    for(const r of h.slice(0,14))
      c3.corpo.appendChild(el('div',{class:'transacao', html:
        `<span class="dia">S${r.semana}</span>
         <span class="desc">${r.faixa ? 'cidade '+r.faixa.toLowerCase()
           : 'base de '+r.base+' mil'}${r.querem?` · ${U.numero(r.querem)} topariam`:''}</span>
         <span class="val ${r.n?'positivo':''}">${r.n?'+'+r.n:'0'}</span>`}));
    grade.appendChild(c3);
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

    /* o que a Gestão comprometeu nesta semana entra na conta da tela */
    const sem  = TO.financeiro.resumoDaSemana(e);
    const comp = sem.gestao;

    const c1 = cartao('Fluxo da semana');
    c1.corpo.innerHTML =
      `<div class="valorao"><span>Receitas</span>
         <b class="positivo">${U.dinheiro(sem.receita)}</b></div>
       <div class="valorao"><span>Despesas</span>
         <b class="negativo">${U.dinheiro(sem.despesa)}</b></div>`
      + (comp.total
         ? `<div class="linha-dado"><span>Conta fixa</span>
              <b class="negativo">${U.dinheiro(-cx.despesa)}</b></div>
            <div class="linha-dado"><span>Decidido na Gestão`+
           `${comp.pendente?'':' <small class="fraco">pago</small>'}</span>
              <b class="negativo">${U.dinheiro(-comp.total)}</b></div>` : '')
      + `<div class="valorao"><span>Saldo da semana</span>
           <b class="${sem.saldo>=0?'positivo':'negativo'}">${U.dinheiro(sem.saldo)}</b></div>`;
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

    /* GESTÃO → FINANCEIRO: caravana, recepção de aliado e investida não
       são conta fixa de semana; são decisão. Ficam num cartão só delas,
       dizendo o que já saiu do caixa e o que ainda vai sair. */
    const c5 = cartao('Compromissos da semana', 'decididos na Gestão');
    if(!comp.itens.length)
      c5.corpo.innerHTML = '<div class="em-construcao">'+
        'Nada decidido nesta semana que mexa no caixa.</div>';
    for(const i of comp.itens){
      const val = i.tipo==='acao'  ? '1 ação'
                : i.tipo==='aviso' ? 'sem custo'
                : U.dinheiro(-i.v);
      const est = i.tipo==='aviso' ? '' : i.pago ? ' pago' : ' a pagar';
      c5.corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span>${i.rot}<br><small class="fraco">${i.nota}</small></span>
         <b class="${i.tipo==='dinheiro'?'negativo':'fraco'}">${val}`+
        `${est?`<small class="fraco">·${est}</small>`:''}</b>`}));
    }
    if(comp.itens.length)
      c5.corpo.appendChild(el('div',{class:'linha-dado total', html:
        `<span>Total decidido</span><b class="${comp.total?'negativo':'fraco'}">`+
        `${comp.total?U.dinheiro(-comp.total):'—'}</b>`}));
    const btGest = el('button',{class:'bt larga', texto:'Abrir a Gestão'});
    btGest.onclick = ()=>{ pagina='gestao'; redesenhar(); };
    c5.rodape(btGest);

    const col3 = el('div'); col3.append(c3,c4,c5);
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

  /* ---------- o cartão de um passo da sequência ---------- */
  function passoCartao(n, titulo, direita, pendente){
    const q = el('div',{class:'passo'+(pendente?' pendente':'')});
    const h = el('header');
    h.appendChild(el('i',{class:'num', texto:String(n)}));
    h.appendChild(el('h2',{texto:titulo}));
    if(direita) h.appendChild(el('span',{class:'conta', texto:direita}));
    q.appendChild(h);
    q.corpo = el('div',{class:'corpo'});
    q.appendChild(q.corpo);
    return q;
  }

  /* ---------- a trilha das decisões já tomadas ---------- */
  function trilha(passos){
    const t = el('div',{class:'trilha'});
    passos.forEach((s,i)=>{
      if(i) t.appendChild(el('i',{texto:'›'}));
      t.appendChild(el('span',{class:'etapa'+(s.feito?'':' aberta'),
        html:`${s.rot}<small>${s.resumo}</small>`}));
    });
    return t;
  }

  /* =======================================================
     O MAPA DO OLHEIRO
     Esquema da praça: a nossa sede, a sede deles, o estádio e
     os pontos onde dá pra cortar o caminho. Clicar num ponto é
     posicionar o olheiro ali.
     ======================================================= */
  function mapaDoOlheiro(e, pontos, escolhido, rel, aoEscolher){
    const cx = el('div',{class:'mapa-olheiro'});
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS,'svg');
    /* a caixa é larga porque a coluna é larga; sem preserveAspectRatio
       a tipografia esticaria junto com o desenho */
    svg.setAttribute('viewBox','-7 -8 174 78');

    const cria = (tag, attrs)=>{
      const n = document.createElementNS(NS, tag);
      for(const [k,v] of Object.entries(attrs)) n.setAttribute(k, v);
      return n;
    };
    const X = v=>v*160, Y = v=>v*62;

    /* a malha, só pra dar noção de cidade */
    for(let i=1;i<8;i++)
      svg.appendChild(cria('line',{x1:i*20, y1:0, x2:i*20, y2:62, class:'malha'}));
    for(let i=1;i<5;i++)
      svg.appendChild(cria('line',{x1:0, y1:i*12.4, x2:160, y2:i*12.4, class:'malha'}));
    svg.appendChild(cria('rect',{x:0, y:0, width:160, height:62, class:'moldura'}));

    /* os caminhos deles: da sede rival ao estádio, pelo norte ou pelo sul.
       É por isso que o ponto do olheiro importa — ele cobre uma via só. */
    for(const via of ['norte','sul']){
      const desta = pontos.filter(p=>p.via===via).sort((a,b)=>a.x-b.x);
      if(!desta.length) continue;
      const pts = [[0.07,0.14]].concat(desta.map(p=>[p.x,p.y])).concat([[0.90,0.34]]);
      svg.appendChild(cria('polyline',{class:'rota '+via,
        points: pts.map(([x,y])=>`${X(x)},${Y(y)}`).join(' ')}));
    }

    /* âncoras */
    const ancora = (x,y,rot,cls,acima)=>{
      svg.appendChild(cria('rect',{x:X(x)-2.2, y:Y(y)-2.2, width:4.4, height:4.4,
        class:'ancora '+cls}));
      const t = cria('text',{x:X(x), y:Y(y)+(acima?-4.2:6.2), class:'rot '+cls});
      t.textContent = rot;
      svg.appendChild(t);
    };
    ancora(0.07, 0.14, 'SEDE DELES', 'deles',   true);
    ancora(0.07, 0.88, 'NOSSA SEDE', 'nossa',   false);
    ancora(0.90, 0.34, 'ESTÁDIO',    'estadio', true);

    /* os pontos: o olheiro vai num deles */
    for(const pt of pontos){
      const leitura = P_leitura(e, rel, pt.id);
      const on = pt.id === escolhido;
      const g = cria('g',{class:'pino'+(on?' on':'')+
        (leitura && leitura.gente ? ' quente':'')});
      g.appendChild(cria('circle',{cx:X(pt.x), cy:Y(pt.y), r: on?3:2.3}));
      const t = cria('text',{x:X(pt.x), y:Y(pt.y)+(pt.acima?-4.6:6.4)});
      t.textContent = pt.curto || pt.nome.toUpperCase();
      g.appendChild(t);
      if(leitura && leitura.gente){
        const n = cria('text',{x:X(pt.x), y:Y(pt.y)+(pt.acima?7.2:-4.2), class:'qtd'});
        n.textContent = '~'+leitura.gente;
        g.appendChild(n);
      }
      g.onclick = ()=>aoEscolher(pt.id);
      svg.appendChild(g);
    }
    cx.appendChild(svg);
    return cx;
  }
  const P_leitura = (e, rel, id) =>
    rel ? TO.planejamento.leituraDoPonto(e, rel, id) : null;

  /* ---------- o relatório do olheiro em texto ---------- */
  function fichaDoOlheiro(rel){
    const d = el('div',{class:'olheiro'});
    if(!rel){
      d.innerHTML = '<div class="em-construcao">Sem alvo definido, o olheiro '+
        'não tem quem seguir.</div>';
      return d;
    }
    d.innerHTML =
      `<div class="l1"><b>Relatório do olheiro</b>
         <span>confiança ${rel.confianca}%</span></div>
       <div class="l2">${rel.texto}</div>`;
    const faixa = el('div',{class:'bondes'});
    rel.tamanhos.forEach((n,i)=>{
      faixa.appendChild(el('span',{html:
        `<b>${n}</b><small>bonde ${i+1}${rel.rotas[i] && rel.rotas[i].ponto
          ? ' · '+rel.rotas[i].ponto.nome : ''}</small>`}));
    });
    d.appendChild(faixa);
    return d;
  }

  /* GDD §9.5 — de onde vem o bônus da arquibancada, parcela por parcela */
  function painelFator(e, ft){
    const P = TO.torcedores.PESOS;
    const d = el('div',{class:'fator'});
    const parte = (rot, v, peso, nota)=>{
      const p = el('div',{class:'fator-parte'});
      p.innerHTML =
        `<span class="rot">${rot}<small>${nota}</small></span>
         <i><b style="width:${Math.round(v*100)}%"></b></i>
         <em>${Math.round(v*100)}%<small>×${peso}</small></em>`;
      d.appendChild(p);
    };
    parte('Público', ft.publico, P.publico,
          `${ft.vao} dos ${ft.total} membros vão`);
    parte('Faixas', ft.faixas, P.faixas,
          `${ft.tem.faixas} de ${ft.cap.faixas} da sede`);
    parte('Bateria', ft.bateria, P.bateria,
          `${ft.tem.bateria} de ${ft.cap.bateria} instrumentos`);
    parte('Moral', ft.moral, P.moral,
          `${e.indicadores.moral.toFixed(1)} de 20`);
    return d;
  }

  function pintarGestao(){
    const e = E(), pg = U.$('.pagina[data-pag="gestao"]');
    const P = TO.planejamento;
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-barra', html:'<h1>Gestão inteligente</h1>'}));

    const p = P.plano(e);
    const j = e.proximoJogo;

    /* =====================================================
       PARTE SUPERIOR — o próximo jogo do nosso time
       ===================================================== */
    const topo = el('div',{class:'gestao-topo'+(j?'':' vazio')});
    if(!j){
      topo.innerHTML =
        `<div class="cab"><h2>Folga na tabela</h2>
           <small>o time não joga nesta semana</small></div>
         <div class="dados"><span class="fraco">Semana boa pra treinar, recrutar `+
        `e resolver o que a rua deixou.</span></div>`;
    }else{
      const fora = TO.financeiro.precisaCaravana(e);
      const ft  = TO.torcedores.fatorTorcida(e);
      /* o que a arquibancada vale pro nosso time, em pontos de qualidade */
      const bon = (ft.valor - 0.5) * TO.torcedores.EM_QUALIDADE;
      const d0   = TO.estado.dataDaSemana(e.data.ano, e.data.semana, j.dia||6);
      const dat  = `${DIA_LONGO[(j.dia||6)-1]}, `+
                   `${String(d0.getDate()).padStart(2,'0')}/`+
                   `${String(d0.getMonth()+1).padStart(2,'0')}`;
      topo.innerHTML =
        `<div class="cab">
           <div class="times">
             <span class="lado ${j.casa?'nosso':''}">
               <i style="background:${j.mandante.cores[0]}"></i>${j.mandante.nome}</span>
             <em>×</em>
             <span class="lado ${j.casa?'':'nosso'}">
               <i style="background:${j.visitante.cores[0]}"></i>${j.visitante.nome}</span>
           </div>
           <small>${j.competicao}${j.fase?' · '+j.fase:''} · ${dat}`+
        `${j.hora?' · '+j.hora:''}</small>
         </div>
         <div class="dados">
           <div><span>Mando</span><b>${j.neutro?'campo neutro'
              : j.casa?'em casa':'fora, em '+j.cidadeAdv}</b></div>
           <div><span>Estádio</span><b>${j.estadio||'—'}</b></div>
           <div><span>Sai de casa</span><b>${P.efetivoDaSaida(e)} de `+
        `${TO.membros.aptosParaOEstadio(e).length}</b></div>
           <div><span>Saída</span><b>${fora?'caravana':'bonde da sede'}</b></div>
           <div><span>Fator torcida</span><b class="${ft.valor>=0.5?'positivo':'negativo'}">`+
        `${Math.round(ft.valor*100)}% <span class="fraco">`+
        `${bon>0?'+':''}${bon.toFixed(1)} no placar</span></b></div>
         </div>`;
      topo.appendChild(painelFator(e, ft));
    }
    pg.appendChild(topo);

    if(j) pg.appendChild(trilha(P.passos(e)));

    const grade = el('div',{class:'comp-duas'});
    const esq = el('div'), dir = el('div');
    let n = 0;

    /* =====================================================
       A SEQUÊNCIA
       ===================================================== */
    if(j){
      const alvos = P.alvosDoJogo(e);
      const trair = P.soAliados(e);
      if(trair && p.intencao === 'atacar') P.definirIntencao(e, 'trair');
      if(!trair && p.intencao === 'trair')  P.definirIntencao(e, 'atacar');
      const briga = p.intencao !== 'paz';
      if(briga && !p.alvoTorcida && alvos.length === 1)
        { p.alvoTorcida = alvos[0].id; }

      /* --- 1. intenção --- */
      const c1 = passoCartao(++n, 'Intenção do dia de jogo',
        p.intencao==='paz' ? 'ir em paz'
        : p.intencao==='trair' ? 'trair aliado' : 'atacar');
      c1.corpo.appendChild(opcoes(P.intencoes(e), p.intencao,
        id=>{ P.definirIntencao(e, id); redesenhar(); }));
      esq.appendChild(c1);

      if(briga){
        /* --- 2. contra quem --- */
        const alvoT = TO.mundo.torcida(p.alvoTorcida);
        const c2 = passoCartao(++n, 'Contra qual torcida',
          alvoT ? alvoT.nome : 'escolha', !p.alvoTorcida);
        if(!alvos.length){
          c2.corpo.appendChild(el('div',{class:'em-construcao',
            texto:'O adversário não tem organizada catalogada. '+
                  'Sem alvo, o dia é de ir em paz.'}));
        }
        c2.corpo.appendChild(opcoes(alvos.map(a=>({
          id:a.id, rot:a.torcida.nome,
          nota:`${a.aliada?'ALIADA — bater nela é traição · ':''}`+
               `relação ${a.relacao>0?'+':''}${Math.round(a.relacao)}`+
               `${a.tensao?` · tensão ${Math.round(a.tensao)}`:''} · `+
               `${a.torcida.membros} membros`
        })), p.alvoTorcida, id=>{ p.alvoTorcida=id; p.decidido=false; redesenhar(); }));
        esq.appendChild(c2);

        if(p.alvoTorcida){
          const rel = P.relatorioDoOlheiro(e, p.alvoTorcida);

          /* --- 3. como atacar --- */
          const c3 = passoCartao(++n, 'Como atacar',
            (P.COMO.find(c=>c.id===p.como)||{}).rot);
          c3.corpo.appendChild(opcoes(P.COMO.map(c=>({
            id:c.id, rot:c.rot,
            nota: c.id==='ida' && rel
              ? `${c.nota} — ${rel.texto.toLowerCase()}` : c.nota
          })), p.como, id=>{ P.definirComo(e, id); redesenhar(); }));
          esq.appendChild(c3);

          /* --- 4. o olheiro no mapa --- */
          if(p.como === 'ida'){
            const pt = p.olheiro ? P.ponto(p.olheiro) : null;
            const c4 = passoCartao(++n, 'Olheiro no mapa',
              pt ? pt.nome : 'posicione', !p.olheiro);
            c4.corpo.appendChild(fichaDoOlheiro(rel));
            c4.corpo.appendChild(mapaDoOlheiro(e, P.pontosDeIda(e), p.olheiro, rel,
              id=>{ P.definirOlheiro(e, id); redesenhar(); }));
            if(pt){
              const lt = P.leituraDoPonto(e, rel, pt.id);
              c4.corpo.appendChild(el('div',{class:'linha-dado', html:
                `<span>${pt.nome}${pt.bairro?' — '+pt.bairro:''}</span>
                 <b>risco ${pt.risco}/5 · prestígio ${pt.prestigio}/5</b>`}));
              c4.corpo.appendChild(el('div',{class:'linha-dado', html:
                `<span class="fraco">${pt.nota}</span>`}));
              if(lt) c4.corpo.appendChild(el('div',{class:'linha-dado', html:
                medidor('Chance de interceptar', lt.chance, 100,
                        lt.chance>55?'var(--verde)':'var(--ouro)')}));
              if(lt) c4.corpo.appendChild(el('div',{class:'linha-dado', html:
                `<span class="${lt.gente?'':'fraco'}">${lt.texto}.</span>`}));
            }else{
              c4.corpo.appendChild(el('div',{class:'em-construcao',
                texto:'Clique num ponto do mapa pra mandar o olheiro pra lá.'}));
            }
            esq.appendChild(c4);
          }

          /* --- 5. bombas --- */
          const est = e.estoque || {bombas:0};
          const c5 = passoCartao(++n, 'Bombas',
            p.bombas ? `${p.bombas} de ${est.bombas}` : 'nenhuma');
          const linha = el('div',{class:'contador'});
          const menos = el('button',{texto:'−'}), mais = el('button',{texto:'+'});
          menos.onclick = ()=>{ p.bombas=Math.max(0,p.bombas-1); p.decidido=false; redesenhar(); };
          mais.onclick  = ()=>{ p.bombas=Math.min(est.bombas,p.bombas+1); p.decidido=false; redesenhar(); };
          menos.disabled = p.bombas<=0; mais.disabled = p.bombas>=est.bombas;
          linha.append(menos, el('b',{texto:String(p.bombas)}), mais,
            el('small',{texto: p.bombas ? `de ${est.bombas} no estoque · a PM chega `+
                                          'mais rápido (GDD §9.1)'
                                        : `${est.bombas} no estoque · pedra é infinita `+
                                          'e não faz barulho'}));
          c5.corpo.appendChild(linha);
          esq.appendChild(c5);
        }
      }

      /* --- formação da saída --- */
      const d = P.divisao(e, p.bondes);
      const cB = passoCartao(++n, 'Formação da saída',
        `${p.bondes===1?'um bonde':p.bondes+' bondes'}`);
      cB.corpo.appendChild(opcoes([1,2,3,4].map(k=>{
        const dd = P.divisao(e, k);
        return {id:k, rot: k===1 ? 'Bonde único' : `${k} bondes, um por zona`,
                nota: k===1 ? 'todo mundo junto: uma frente, mas pesada'
                            : `${dd.porBonde} por bonde · até ${k} frentes · `+
                              `${dd.zonas.join(', ')}`};
      }), p.bondes, k=>{ p.bondes=k; p.decidido=false; redesenhar(); }));
      cB.corpo.appendChild(el('div',{class:'linha-dado', html:
        medidor('Solidez da linha', Math.round(d.solidez*100), 100,
                d.solidez>0.75?'var(--verde)':'var(--ouro)')}));
      if(p.bondes > 1){
        cB.corpo.appendChild(el('div',{class:'fase-rot', texto:'Destino de cada bonde'}));
        const ops = P.opcoesDeDestino(e);
        for(const b of P.destinos(e)){
          const lb = el('div',{class:'linha-bonde'});
          lb.appendChild(el('span',{class:'zona', html:
            `${b.zona}<small>${b.gente} membros</small>`}));
          const sel = el('select',{class:'campo'});
          for(const o of ops){
            const opt = el('option',{value:o.id, texto:`${o.nome} — ${o.nota}`});
            if(o.id === b.destino) opt.selected = true;
            sel.appendChild(opt);
          }
          sel.onchange = ()=>{ p.destinos[b.i]=sel.value; p.decidido=false; redesenhar(); };
          lb.appendChild(sel);
          cB.corpo.appendChild(lb);
        }
        const brigam = P.destinos(e).filter(x=>x.ponto).length;
        cB.corpo.appendChild(el('div',{class:'linha-dado', html:
          `<span class="fraco">${brigam
            ? `${brigam} ${brigam===1?'frente de ataque':'frentes de ataque'} e `+
              `${p.bondes-brigam} entrando pelo portão`
            : 'todos entram pelo portão'}</span>`}));
      }
      esq.appendChild(cB);
    }

    /* =====================================================
       ALIADOS NA NOSSA CIDADE
       ===================================================== */
    const aliados = P.aliadosNaCidade(e, e.data.semana);
    const padrao = P.recepcaoPadrao(e);
    if(aliados.length || padrao !== null){
      const pend = aliados.some(a=>!p.recepcao[a.id] && !padrao);
      const cA = passoCartao(++n, 'Aliados na nossa cidade',
        aliados.length ? `${aliados.length} nesta semana` : 'ninguém nesta semana',
        pend);
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
      (j ? dir : esq).appendChild(cA);
    }

    /* =====================================================
       OS OUTROS JOGOS DA CIDADE
       Torcida de fora de passagem e rival nosso indo pro jogo
       dele: os dois cabem numa emboscada.
       ===================================================== */
    const outros = P.outrosJogosNaCidade(e, e.data.semana);
    if(outros.length){
      const feitas = Object.values(p.investidas||{}).filter(Boolean).length;
      const cO = passoCartao(++n, 'Outros jogos na cidade',
        feitas ? `${feitas} ${feitas===1?'investida':'investidas'}`
               : `${outros.length} nesta semana`);
      for(const g of outros){
        const inv = P.investidaDe(e, g.chave);
        cO.corpo.appendChild(el('div',{class:'aliado-cab', html:
          `<span class="escudinho" style="background:${corClube(g.casa.id)}"></span>
           <div><b>${g.casa.nome} × ${g.vis.nome}</b>
             <small>${g.comp} · ${DIA_LONGO[(g.dia||6)-1]||''} · `+
          `torcida de fora circulando pela praça</small></div>`}));

        /* pode-se cair em cima da torcida visitante ou da própria casa */
        const opts = [{id:'', rot:'Deixar passar',
                       nota:'ninguém sai da sede por esse jogo'}]
          .concat(g.visitantes.map(v=>({
            id:v.id, rot:`Cair em cima da ${v.torcida.nome}`,
            nota:`visitante · ${v.aliada?'ALIADA — isso é traição · ':''}`+
                 `${v.torcida.membros} membros · custa uma ação`})))
          .concat(TO.mundo.torcidasDe(g.casa.id)
            .filter(o=>o.id !== e.torcida.id)
            .map(o=>{
              const v = (e.relacoes||{})[o.id];
              const rel = v===undefined ? 0 : v;
              return {id:o.id, rot:`Cair em cima da ${o.nome}`,
                nota:`da nossa praça · ${rel>=20?'ALIADA — isso é traição · ':''}`+
                     `relação ${rel>0?'+':''}${Math.round(rel)} · `+
                     `${o.membros} membros · custa uma ação`};
            }));
        cO.corpo.appendChild(opcoes(opts, (inv&&inv.alvo) || '',
          id=>{ P.definirInvestida(e, g.chave, id ? {alvo:id} : null); redesenhar(); }));

        /* escolhido o alvo, o olheiro entra também aqui */
        if(inv && inv.alvo){
          const rel = P.relatorioDoOlheiro(e, inv.alvo);
          cO.corpo.appendChild(fichaDoOlheiro(rel));
          cO.corpo.appendChild(opcoes(P.COMO.map(c=>({
            id:c.id, rot:c.rot, nota:c.nota})), inv.como,
            id=>{ P.definirInvestida(e, g.chave, {como:id}); redesenhar(); }));
          if(inv.como === 'ida'){
            cO.corpo.appendChild(mapaDoOlheiro(e, P.pontosDeIda(e), inv.olheiro, rel,
              id=>{ P.definirInvestida(e, g.chave, {olheiro:id}); redesenhar(); }));
            const lt = inv.olheiro && P.leituraDoPonto(e, rel, inv.olheiro);
            cO.corpo.appendChild(el('div',{class:'linha-dado', html: lt
              ? medidor('Chance de interceptar', lt.chance, 100,
                        lt.chance>55?'var(--verde)':'var(--ouro)')
              : '<span class="fraco">Falta pôr o olheiro num ponto do mapa.</span>'}));
          }
        }
      }
      (j ? dir : esq).appendChild(cO);
    }

    /* =====================================================
       CARAVANA
       ===================================================== */
    const listaRotas = P.rotas(e);
    if(listaRotas.length){
      const est = P.estimativaCaravana(e);
      const cC = passoCartao(++n, 'Caravana',
        `${est.vao} para ${j.cidadeAdv} · ${U.dinheiro(est.custo)}`);
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
      dir.appendChild(cC);
    }

    /* =====================================================
       FECHAR O PLANO
       ===================================================== */
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
        const onde = p.como === 'ida'
          ? (p.olheiro ? `na ida ao estádio, em ${P.ponto(p.olheiro).nome}`
                       : 'na ida ao estádio, sem ponto definido')
          : 'nos arredores do estádio';
        resumo.push(`${p.intencao==='trair'?'Traição contra':'Ataque à'} `+
          `${alvo?alvo.nome:'torcida rival'} ${onde}`+
          `${p.bombas?` com ${p.bombas} bomba${p.bombas>1?'s':''}`:', só na pedra'}.`);
      }
      for(const d2 of P.destinos(e))
        if(p.bondes > 1)
          resumo.push(`Bonde ${d2.zona}: ${d2.ponto ? 'atacar em '+d2.ponto.nome
                                                    : 'direto pro estádio'} (${d2.gente}).`);
    }
    let gasto = 0;
    for(const a of aliados){
      const nv = P.nivelDe(e, a.id);
      if(!nv || nv==='nada') continue;
      const c = P.custoRecepcao(nv, a.estimativa);
      gasto += c;
      resumo.push(`${P.recepcaoDe(nv).rot} para a ${a.torcida.nome} (${U.dinheiro(c)}).`);
    }
    let invs = 0;
    for(const chave of Object.keys(p.investidas||{})){
      const inv = P.investidaDe(e, chave);
      if(!inv || !inv.alvo) continue;
      const o = TO.mundo.torcida(inv.alvo);
      invs++;
      resumo.push(`Investida contra a ${o?o.nome:inv.alvo} `+
        `${inv.como==='ida' ? 'na ida ao estádio' : 'nos arredores'}, `+
        'num jogo da cidade.');
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

    const pendentes = P.falta(e);
    if(pendentes.length)
      cF.corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span class="negativo">Falta resolver: ${pendentes.join(', ')}.</span>`}));

    const tipo = P.tipoDoJogo(e) === 'fora' ? 'de viagem' : 'em casa';
    if(P.temPadrao(e))
      cF.corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span class="fraco">Este plano vem do padrão ${tipo} e é aplicado `+
        'sozinho toda semana.</span>'}));

    const bt = el('button',{class:'bt destaque larga',
      texto: p.decidido ? 'Plano fechado' : 'Fechar o plano'});
    bt.disabled = !!p.decidido || pendentes.length > 0;
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
     MAPA DA CIDADE (GDD §13)
     Uma superfície de canvas só, com os bairros da praça, os
     doze quarteirões de cada um e os dez lotes de cada
     quarteirão. O renderizador está em js/mundo/mapa.js; aqui
     ficam só a moldura, os filtros e o zoom.
     ======================================================= */
  /* o zoom padrão sai do tamanho do mapa: a planta procedural tem 1000 de
     lado e a arte tem 1254, e os dois têm de caber na mesma janela */
  let zoomMapa = null;
  let poeOlheiro = false;      // próximo clique no mapa posiciona o olheiro
  let relogioRua = null;

  /* o dia corre enquanto ninguém esbarra em ninguém */
  function rodarRelogio(){
    if(relogioRua) return;
    let ultimo = 0;
    const passo = agora=>{
      const e = E();
      const R = e && TO.ruas.estado(e);
      if(!e || !R || !R.rodando || pagina !== 'mapa'){ relogioRua = null; return; }
      const dt = ultimo ? Math.min(0.1, (agora-ultimo)/1000) : 0;
      ultimo = agora;
      const mo = mapaAtual;
      if(mo && dt){
        /* dois minutos de rua por segundo de tela */
        TO.ruas.passo(e, mo, dt*2);
        if(canvasMapa) { TO.mapa.desenhar(mo, canvasMapa);
                         TO.ruas.desenhar(e, mo, canvasMapa.getContext('2d')); }
        if(R.encontro){ relogioRua = null; redesenhar(); return; }
        if(R.bondes.every(b=>b.chegou)){ R.rodando = false; relogioRua = null;
                                         redesenhar(); return; }
      }
      relogioRua = requestAnimationFrame(passo);
    };
    relogioRua = requestAnimationFrame(passo);
  }
  let mapaAtual = null, canvasMapa = null;

  function pintarMapa(){
    const e = E(), pg = U.$('.pagina[data-pag="mapa"]');
    const MP = TO.mapa;
    pg.innerHTML = '';
    pg.appendChild(el('div',{class:'titulo-barra', html:'<h1>Mapa da cidade</h1>'}));

    const cidade = TO.mundo.cidade(e.torcida.mapa);
    if(!cidade || !(cidade.bairros||[]).length){
      pg.appendChild(emConstrucao('Sem mapa',
        'Esta praça não tem bairros catalogados.'));
      return;
    }
    const mo = MP.modelo(e);
    const sede = TO.mundo.bairroDaSede(e.torcida);
    const tamanho = cidade.nivel === 1 ? 'Grande' : cidade.nivel === 2 ? 'Médio' : 'Pequeno';
    const arte = mo && mo.arte;

    const q = quadro(`${cidade.nome} — ${cidade.uf}`,
      el('span',{class:'conta',
        texto:`${mo.mostrando} de ${mo.total} pontos visíveis`}));

    const barra = el('div',{class:'mapa-barra'});
    const dado = (rot, val)=>barra.appendChild(el('div',{html:
      `<span>${rot}</span><b>${val}</b>`}));
    dado('Tamanho', tamanho);
    dado('Bairros', arte ? mo.regioes.length : cidade.bairros.length);
    if(arte){
      const nós = mo.malha.andavel.reduce((a,b)=>a+b, 0);
      dado('Ruas', U.numero(nós) + ' pontos');
      dado('Estádios', (arte.estadios||[]).length);
    }else{
      dado('Quarteirões', cidade.bairros.length * MP.QUARTEIROES);
      dado('Lotes', cidade.bairros.length * MP.QUARTEIROES * MP.LOTES);
    }
    dado('Nossa sede', sede ? sede.nome : '—');
    const pop = cidade.populacao || 0;
    dado('População', pop >= 1000 ? U.numero(pop/1000, 1) + ' mi'
                                  : U.numero(pop) + ' mil');
    q.corpo.appendChild(barra);

    /* --- filtros --- */
    const f = MP.filtros(e);
    const filtros = el('div',{class:'mapa-filtros'});
    const caixa = (chave, rot, cls)=>{
      const l = el('label',{class:'mapa-filtro '+(cls||'')});
      const i = el('input',{type:'checkbox'});
      i.checked = !!f[chave];
      i.onchange = ()=>{ f[chave] = i.checked; redesenhar(); };
      l.append(i, el('span',{texto:rot}));
      return l;
    };
    const grupo = (rot, chaves)=>{
      const todos = chaves.every(k=>f[k]);
      const l = el('label',{class:'mapa-filtro grupo'});
      const i = el('input',{type:'checkbox'});
      i.checked = todos;
      i.indeterminate = !todos && chaves.some(k=>f[k]);
      i.onchange = ()=>{ for(const k of chaves) f[k] = i.checked; redesenhar(); };
      l.append(i, el('span',{texto:rot}));
      return l;
    };
    const secao = (...filhos)=>{
      const d = el('div',{class:'mapa-filtro-secao'});
      for(const x of filhos) d.appendChild(x);
      filtros.appendChild(d);
    };
    secao(caixa('estadios', 'Estádios', 'solo'));
    secao(grupo('TORCIDAS', MP.TIPOS_TORCIDA),
          caixa('sedes','Sedes','filho'), caixa('bares','Bares','filho'),
          caixa('lojas','Lojas','filho'), caixa('subsedes','Subsedes','filho'));
    const ROT_NEUTRO = {joalheria:'Joalheria', posto:'Posto de gasolina',
      hospital:'Hospital', mercadinho:'Mercadinho', roupas:'Loja de roupas',
      banco:'Banco'};
    secao(grupo('DEMAIS LOCAIS', MP.TIPOS_NEUTRO),
          ...MP.TIPOS_NEUTRO.map(t=>caixa(t, ROT_NEUTRO[t] || t, 'filho')));

    /* --- o dia na rua: bondes, relógio e olheiro --- */
    const R = TO.ruas.montar(e, mo);
    const barraRua = el('div',{class:'rua-barra'});
    if(R.bondes.length){
      const jogos = TO.ruas.jogosDaPraca(e).filter(x=>x.dia === e.data.dia);
      const andando = R.bondes.filter(b=>!b.chegou).length;
      const falta = Math.max(0, TO.ruas.ANTES - R.minuto);
      const hhmm = m => `${Math.floor(m/60)}h${String(Math.round(m%60)).padStart(2,'0')}`;
      barraRua.appendChild(el('div',{class:'rua-info', html:
        `<b>${jogos.map(x=>`${x.casa.nome} × ${x.vis.nome}`).join(' · ')}</b>
         <small>${R.bondes.length} bondes na rua · ${andando} ainda a caminho ·
         ${falta > 0 ? `faltam ${hhmm(falta)} pra bola rolar`
                     : 'a bola já rolou'}</small>`}));
      const bt = el('button',{class:'bt destaque',
        texto: R.encontro ? 'Confronto!' : R.rodando ? 'Pausar' : 'Rodar o dia'});
      bt.disabled = !andando && !R.encontro;
      bt.onclick = ()=>{
        if(R.encontro){ abrirConfronto(e, R.encontro); return; }
        R.rodando = !R.rodando;
        redesenhar();
        if(R.rodando) rodarRelogio();
      };
      const btO = el('button',{class:'bt',
        texto: R.olheiro ? 'Tirar o olheiro' : (poeOlheiro ? 'Clique no mapa…'
                                                           : 'Pôr olheiro')});
      btO.onclick = ()=>{
        if(R.olheiro){ TO.ruas.porOlheiro(e, null); poeOlheiro = false; }
        else poeOlheiro = !poeOlheiro;
        redesenhar();
      };
      barraRua.append(btO, bt);
    }else{
      barraRua.appendChild(el('div',{class:'rua-info', html:
        '<b>Cidade tranquila</b><small>ninguém joga aqui hoje; '+
        'em dia de jogo os bondes saem pra rua</small>'}));
    }
    q.corpo.appendChild(barraRua);

    /* --- superfície --- */
    const LADO = mo.tam;
    if(zoomMapa == null) zoomMapa = Math.round((760 / LADO) * 20) / 20;
    const viewport = el('div',{class:'mapa-viewport'});
    const casca = el('div',{class:'mapa-casca',
      estilo:{width:(LADO*zoomMapa)+'px', height:(LADO*zoomMapa)+'px'}});
    const cv = el('canvas',{class:'mapa-canvas',
      estilo:{width:(LADO*zoomMapa)+'px', height:(LADO*zoomMapa)+'px'}});
    const dica = el('div',{class:'mapa-dica'});

    const zoom = el('div',{class:'mapa-zoom'});
    const bMenos = el('button',{texto:'−'}), bMais = el('button',{texto:'+'});
    bMenos.disabled = zoomMapa <= 0.4; bMais.disabled = zoomMapa >= 2;
    bMenos.onclick = ()=>{ zoomMapa = Math.max(0.4, zoomMapa-0.15); redesenhar(); };
    bMais.onclick  = ()=>{ zoomMapa = Math.min(2,   zoomMapa+0.15); redesenhar(); };
    zoom.append(bMenos, el('span',{texto:Math.round(zoomMapa*100)+'%'}), bMais);

    /* a planta em PNG, sem pino e sem nome: é o que se leva pro upscaler */
    const btPng = el('button',{class:'bt', texto:'Baixar planta (PNG)'});
    btPng.onclick = ()=>{
      const nome = TO.mapa.baixarImagem(e, {lado:2048});
      aviso(nome ? `Planta salva: ${nome} (2048×2048, sem pinos).`
                 : 'Não deu pra gerar a planta.', nome ? 'boa' : 'ruim');
    };
    barraRua.appendChild(btPng);

    casca.append(cv, zoom, dica);
    viewport.append(filtros, casca);
    q.corpo.appendChild(viewport);
    pg.appendChild(q);

    /* o canvas só existe depois de entrar no documento */
    requestAnimationFrame(()=>ligarMapa(cv, dica, mo));
  }

  function ligarMapa(cv, dica, mo){
    const MP = TO.mapa;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    cv._dpr = dpr;
    cv.width  = Math.round(mo.tam * dpr);
    cv.height = Math.round(mo.tam * dpr);
    mapaAtual = mo; canvasMapa = cv;
    const pintar = ()=>{ MP.desenhar(mo, cv);
                         TO.ruas.desenhar(E(), mo, cv.getContext('2d')); };
    /* a arte da cidade chega depois do primeiro quadro */
    MP.aoCarregarArte(()=>{ if(canvasMapa === cv) pintar(); });
    pintar();

    const ponto = ev=>{
      const r = cv.getBoundingClientRect();
      return {x:(ev.clientX - r.left) * (mo.tam / r.width),
              y:(ev.clientY - r.top)  * (mo.tam / r.height)};
    };
    cv.onmousemove = ev=>{
      const p = ponto(ev);
      let a = MP.alvoEm(mo, p.x, p.y);
      if(!a && mo.arte){
        /* fora de um pino, o que interessa é em que bairro o dedo está */
        const b = MP.bairroEm(mo, p.x, p.y);
        if(b) a = {x:p.x-14, y:p.y-14, w:28, h:28, tipo:'bairro', bairro:b,
                   info:`${b.nome} · ${b.zona} · ${b.classe}`+
                        (MP.andavelEm(mo,p.x,p.y) ? ' · rua' : '')};
      }
      if((a && a.info) !== (mo.sob && mo.sob.info)
         || (a && mo.sob && (a.x !== mo.sob.x || a.y !== mo.sob.y))){
        mo.sob = a;
        cv.style.cursor = a ? 'pointer' : 'default';
        pintar();
      }
      if(!dica || !mo.sob){ dica.classList.remove('on'); return; }
      const casca = cv.parentElement.getBoundingClientRect();
      dica.textContent = mo.sob.info;
      dica.style.left = (ev.clientX - casca.left + 16) + 'px';
      dica.style.top  = (ev.clientY - casca.top  + 16) + 'px';
      dica.classList.add('on');
    };
    cv.onmouseleave = ()=>{
      mo.sob = null; cv.style.cursor = 'default';
      dica.classList.remove('on');
      pintar();
    };
    cv.onclick = ev=>{
      const p = ponto(ev);
      if(poeOlheiro){
        TO.ruas.porOlheiro(E(), p.x, p.y);
        poeOlheiro = false;
        aviso('Olheiro no ponto. Ele enxerga o que passa em volta.','boa');
        redesenhar();
        return;
      }
      const a = MP.alvoEm(mo, p.x, p.y);
      if(a) aviso(a.info);
    };
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

  /* A tensão que vale pra noite é com a torcida do adversário do dia;
     sem jogo marcado (amistoso, folga), vale a maior tensão da cidade,
     que é quem tem mais chance de aparecer. */
  function tensaoDaNoite(){
    const e = E();
    const T = TO.tensao;
    if(!T) return 0;
    const j = e.proximoJogo;
    if(j){
      const meu = e.torcida.clubeId;
      const outro = j.mandante === meu ? j.visitante : j.mandante;
      const delas = TO.mundo.torcidasDe(outro) || [];
      let pico = 0;
      for(const o of delas) pico = Math.max(pico, T.nivel(e, o.id));
      if(delas.length) return pico;
    }
    let pico = 0;
    for(const id in (e.tensao||{})) pico = Math.max(pico, e.tensao[id]);
    return pico;
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
      /* o plano da semana entra na cena: intenção e bombas levadas.
         A tensão vai junto porque é ela que diz quantos bondes chegam
         nos arredores dispostos a procurar rival — noite de Calmaria
         quase não tem, noite de Guerra quase só tem. */
      config: { escalacao: lista, intencao: p.intencao, bombas: p.bombas,
                tensao: tensaoDaNoite() },
      aoTerminar: fecharDiaDeJogo
    });
  }

  /* =======================================================
     O ENCONTRO NA RUA
     Dois bondes hostis se encostam, o relógio para e a cena
     abre. Quem está no meio é quem estava no bonde, não a
     torcida inteira.
     ======================================================= */
  const LOCAL_ROT = {rua:'na rua', 'rua-media':'numa rua de classe média',
                     'rua-nobre':'numa rua de bairro nobre',
                     praca:'na praça', arredores:'nos arredores do estádio'};
  let encontroAberto = null;

  function abrirConfronto(e, enc){
    const nosso = enc.a.nossa ? enc.a : enc.b.nossa ? enc.b : null;
    const deles = nosso === enc.a ? enc.b : enc.a;
    if(!nosso){
      /* briga entre duas torcidas de fora: vira notícia, não vira cena */
      TO.estado.anotar(e, `${enc.a.nome} e ${enc.b.nome} se pegaram `+
        `${LOCAL_ROT[enc.local]||''} a caminho do estádio.`, 'ruim');
      TO.ruas.resolver(e);
      redesenhar();
      return;
    }
    /* quem estava no bonde entra na cena, pelos mais fortes */
    const aptos = TO.membros.aptosParaOEstadio(e)
      .sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa))
      .slice(0, U.limitar(nosso.n, 2, 34));
    encontroAberto = enc;
    $('telaDiaJogo').classList.remove('oculto');
    TO.estado.bloquear(true);
    const p = TO.planejamento.plano(e);
    TO.diaJogo.ponte.montar({
      canvas: $('djPrincipal'),
      config: { escalacao: aptos, intencao:'atacar', bombas: p.bombas,
                efetivoRival: deles.n, local: enc.local },
      aoTerminar: res => fecharDiaDeJogo(res, enc)
    });
  }

  function fecharDiaDeJogo(res, enc, acao){
    TO.estado.bloquear(false);
    /* bomba jogada é bomba que não volta pro estoque (GDD §9.1) */
    const e = E();
    e.estoque = e.estoque || {bombas:0};
    e.estoque.bombas = Math.max(0, e.estoque.bombas - (res.bombasUsadas||0));
    const resumo = TO.membros.aplicarResultadoDaNoite(e, res);
    if(enc){
      /* material perdido quando a briga é na rua e a gente leva a pior */
      if(res.prestigio < 0) TO.torcedores.perderMaterial(e, 1, 2);
      TO.ruas.resolver(e);
      encontroAberto = null;
    }
    /* investida, assalto e cobrança no CT: o que a noite deu vira caixa,
       tensão e cadeia aqui, e não dentro da cena */
    const fecho = acao ? TO.acoes.fecharCena(e, acao, res) : null;
    setTimeout(()=>{
      $('telaDiaJogo').classList.add('oculto');
      mostrarRelatorio(res, resumo, fecho);
    }, 1400);
  }

  /* =======================================================
     AÇÃO QUE VIRA CENA (GDD §4.1)
     Atacar bar ou sede, assaltar comércio e pressionar o clube
     abrem a mesma tela do dia de jogo, num cenário próprio.
     ======================================================= */
  function abrirAcaoEmCena(cena){
    const e = E();
    const aptos = TO.membros.aptosParaOEstadio(e)
      .sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa))
      .slice(0, cena.acao === 'assalto' ? 12 : 34);
    $('telaDiaJogo').classList.remove('oculto');
    TO.estado.bloquear(true);
    const p = TO.planejamento.plano(e);
    TO.diaJogo.ponte.montar({
      canvas: $('djPrincipal'),
      config: { escalacao: aptos, intencao:'atacar',
                /* assalto não é briga anunciada: ninguém leva bomba */
                bombas: cena.acao === 'assalto' ? 0 : p.bombas,
                efetivoRival: cena.efetivoRival, local: cena.cena },
      aoTerminar: res => fecharDiaDeJogo(res, null, cena)
    });
  }

  /* o alvo é escolhido antes de sair: a lista vem da própria ação */
  function escolherAlvo(a, aoIr){
    const e = E();
    const lista = a.alvos ? a.alvos(e) : [];
    if(!lista.length){ aoIr(null); return; }
    const corpo = el('div');
    corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span class="fraco">${a.id === 'assalto'
        ? 'Quanto maior o prêmio, mais segurança na porta.'
        : 'O clima com cada um pesa: quem já está quente reage pior.'}</span>`}));
    /* a praça tem seis joalherias: mostrar as seis é lista inútil. Duas de
       cada tipo já dá escolha de bairro sem virar catálogo. */
    const teto = a.id === 'assalto' ? 2 : 99, vistos = {};
    const curta = lista.filter(x=>{
      vistos[x.tipo] = (vistos[x.tipo]||0) + 1;
      return vistos[x.tipo] <= teto;
    }).slice(0, 8);
    let fechar = null;
    for(const alvo of curta){
      const b = el('button',{class:'acao-linha'});
      const dir = a.id === 'assalto'
        ? `${alvo.bairro} · ${U.dinheiro(alvo.rende[0])} a ${U.dinheiro(alvo.rende[1])} · `+
          `${alvo.seguranca} na segurança`
        : `${alvo.bairro} · tensão ${Math.round(alvo.tensao)} · `+
          `${alvo.efetivo} membros`;
      b.innerHTML =
        `<span class="ic">${IC.get(a.icone)}</span>
         <span class="txt"><span>${alvo.nome}</span><small>${dir}</small></span>`;
      b.onclick = ()=>{ fechar && fechar(); aoIr(alvo); };
      corpo.appendChild(b);
    }
    fechar = modal(a.nome, 'Escolha o alvo', corpo);
  }

  /* =======================================================
     O CARTAZ DO FIM DA CENA
     Primeira coisa que se lê ao sair da briga: deu certo ou
     não, e a conta da noite embaixo. Vem antes do prestígio
     porque prestígio é número de gestão — na hora o que se
     quer saber é se a operação valeu.
     ======================================================= */
  function cartazDaCena(res, fecho){
    const ganhou = fecho ? !!fecho.ganhou : !!res.venceu;
    const titulo = (fecho && fecho.titulo) ||
                   (res.tranquila ? 'NOITE TRANQUILA'
                                  : ganhou ? 'SAÍMOS POR CIMA' : 'SAÍMOS POR BAIXO');
    const armas = (res.armas && res.armas.mandante) || {pedra:0, bomba:0};
    const dinheiro = (fecho && fecho.dinheiro) || 0;
    const dado = (rot, val, cor)=>
      `<div class="dado-cena"><span>${rot}</span>`+
      `<b${cor?` class="${cor}"`:''}>${val}</b></div>`;
    return el('div', {class:`cartaz-cena ${ganhou?'boa':'ruim'}`, html:
      `<h3>${titulo}</h3><div class="dados-cena">`+
        dado('Feridos deles', res.caidosVisitante, res.caidosVisitante?'positivo':'')+
        dado('Feridos nossos', res.caidosMandante, res.caidosMandante?'negativo':'')+
        dado('Armas empregadas',
             `${armas.pedra||0} pedras · ${armas.bomba||0} bombas`)+
        dado('Dinheiro da operação', dinheiro ? U.dinheiro(dinheiro) : '—',
             dinheiro ? 'positivo' : '')+
      `</div>`});
  }

  function mostrarRelatorio(res, resumo, fecho){
    $('subRelatorio').textContent = res.motivo;
    const cx = $('corpoRelatorio');
    cx.innerHTML = '';
    cx.appendChild(cartazDaCena(res, fecho));
    cx.insertAdjacentHTML('beforeend',
      `<div class="colunas">
         <div>
           <div class="valorao"><span>Prestígio da noite</span>
             <b class="${res.prestigio>=0?'positivo':'negativo'}">`+
      `${res.prestigio>0?'+':''}${res.prestigio}</b></div>
           <div class="linha-dado"><span>Caídos deles / seus</span>
             <b>${res.caidosVisitante} / ${res.caidosMandante}</b></div>
           <div class="linha-dado">
             <span>${fecho ? 'Chegaram no alvo' : 'Entraram no estádio'}</span>
             <b>${resumo.entraram.length}</b></div>
         </div>
         <div>
           <div class="linha-dado"><span>XP distribuído</span><b>${resumo.xpTotal}</b></div>
           <div class="linha-dado"><span>Grade rompida</span><b>${res.rompido?'sim':'não'}</b></div>
           <div class="linha-dado"><span>Presos</span><b>${resumo.presos.length}</b></div>
         </div>
       </div>`);
    /* o que a investida, o assalto ou a cobrança no CT deixaram */
    if(fecho){
      cx.appendChild(el('div',{class:`fecho-cena ${fecho.ganhou?'boa':'ruim'}`,
        html:`<b>${fecho.txt}</b>`+
             (fecho.linhas||[]).map(l=>`<small>${l}</small>`).join('')}));
    }
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
    else if(pagina==='mapa') pintarMapa();
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
