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
      bts.forEach(b=>r.appendChild(b));
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
    const n = el('div',{class:'nota '+(tipo||''),
      html:`<small>${TO.estado.dataTexto().curta}</small>${txt}`});
    $('notificacoes').appendChild(n);
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
    cxF.appendChild(el('div',{class:'grade-atributos', html:
      `<div><span>Membros</span><b>${U.numero(f.membros)}</b></div>
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
    {id:'mapa',        rot:'Mapa',        ic:'mapa'},
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

    /* próximo jogo */
    const j = e.proximoJogo;
    const cJogo = cartao('Próximo jogo');
    cJogo.corpo.appendChild(el('div',{class:'competicao-rot', texto:j.competicao}));
    const conf = el('div',{class:'confronto'});
    for(const [lado,i] of [[j.mandante,0],[j.visitante,1]]){
      if(i===1) conf.appendChild(el('div',{class:'x', texto:'X'}));
      const bloco = el('div',{class:'lado'});
      bloco.appendChild(escudo(lado.cores, lado.sigla));
      bloco.appendChild(el('div',{class:'nome', texto:lado.nome}));
      conf.appendChild(bloco);
    }
    cJogo.corpo.appendChild(conf);
    const dt = TO.estado.dataTexto();
    cJogo.corpo.appendChild(el('div',{class:'confronto-info', html:
      `${dt.curta} · ${j.hora}<span class="local">${j.estadio}</span>`}));
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

    /* resumo financeiro */
    let receitas = 0;
    for(const m of e.membros) receitas += TO.membros.CARGOS[m.cargo].mensalidade;
    const despesas = 200 + e.membros.length * 4;
    const cFin = cartao('Resumo financeiro');
    cFin.corpo.innerHTML =
      `<div class="linha-dado"><span>Receitas</span>
         <b class="positivo">${U.dinheiro(receitas)}</b></div>
       <div class="linha-dado"><span>Despesas</span>
         <b class="negativo">${U.dinheiro(-despesas)}</b></div>
       <div class="linha-dado"><span>Saldo</span>
         <b class="${receitas-despesas>=0?'positivo':'negativo'}">${U.dinheiro(receitas-despesas)}</b></div>`;
    const verFin = el('button',{class:'bt larga', texto:'Ver finanças'});
    verFin.onclick = ()=>{ pagina='financeiro'; redesenhar(); };
    cFin.rodape(verFin);
    dir.appendChild(cFin);

    /* ações do dia */
    const cAc = cartao('Ações do dia');
    const fila = e.membros.filter(m=>m.naFila && TO.membros.disponivel(m)).length;
    const acoes = [
      ['halter',  `Treinar membros${fila?` (${fila} na fila)`:''}`, ()=>{
        const n = TO.membros.treinarFila(e);
        if(n){ aviso(`${n} treinaram.`,'boa'); TO.estado.avancarDia(); }
        else aviso('Ninguém na fila. Escale o treino na aba Torcida.','ruim');
      }],
      ['megafone','Recrutar', ()=>aviso('Recrutamento entra na próxima etapa (GDD §6).','ruim')],
      ['copo',    'Visitar bar', ()=>aviso('Bares entram com o patrimônio (GDD §8.3).','ruim')],
      ['tijolo',  'Gerenciar construções', ()=>aviso('Construções entram com o patrimônio.','ruim')]
    ];
    for(const [ic, rot, fn] of acoes){
      const b = el('button',{class:'acao-linha',
        html:`<span class="ic">${IC.get(ic)}</span><span>${rot}</span>`});
      b.onclick = fn;
      cAc.corpo.appendChild(b);
    }
    const maisAcoes = el('button',{class:'bt larga', texto:'Ver mais ações'});
    maisAcoes.onclick = ()=>aviso('As dez ações da semana entram na Fase 2 (GDD §10).','ruim');
    cAc.rodape(maisAcoes);
    dir.appendChild(cAc);

    /* dia de jogo */
    const cDJ = cartao('Dia de jogo');
    cDJ.corpo.innerHTML =
      `<div class="linha-dado"><span>Aptos a sair</span>
         <b>${TO.membros.aptosParaOEstadio(e).length}</b></div>
       <div class="linha-dado"><span class="fraco">Quem for escalado vira disco na cena. `+
      `O que acontecer com ele volta pra ficha.</span></div>`;
    const btDJ = el('button',{class:'bt destaque larga', texto:'Sair pro estádio'});
    btDJ.onclick = abrirEscalacao;
    cDJ.rodape(btDJ);
    dir.appendChild(cDJ);

    grade.append(esq, dir);
    pg.appendChild(grade);
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
  function modal(titulo, sub, corpo, acoes){
    const fundo = el('div',{class:'tela-cheia'});
    const m = el('div',{class:'moldura estreita'});
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

    let mensalidades = 0;
    for(const m of e.membros) mensalidades += TO.membros.CARGOS[m.cargo].mensalidade;
    const manutencao = 200, material = e.membros.length*4;
    const receitas = mensalidades;
    const despesas = manutencao + material;

    const grade = el('div',{class:'colunas-3'});

    const c1 = cartao('Fluxo financeiro');
    c1.corpo.innerHTML =
      `<div class="valorao"><span>Receitas</span>
         <b class="positivo">${U.dinheiro(receitas)}</b></div>
       <div class="valorao"><span>Despesas</span>
         <b class="negativo">${U.dinheiro(despesas)}</b></div>
       <div class="valorao"><span>Saldo</span>
         <b class="${receitas-despesas>=0?'positivo':'negativo'}">${U.dinheiro(receitas-despesas)}</b></div>`;
    const btDet = el('button',{class:'bt larga', texto:'Detalhes'});
    btDet.onclick = ()=>{ subFin='transacoes'; redesenhar(); };
    c1.rodape(btDet);
    grade.appendChild(c1);

    const c2 = cartao('Caixa');
    c2.corpo.innerHTML =
      `<div class="valorao"><span>Em caixa</span>
         <b class="${e.dinheiro<0?'negativo':''}">${U.dinheiro(e.dinheiro)}</b></div>
       <div class="linha-dado"><span>Membros pagantes</span><b>${e.membros.length}</b></div>
       <div class="linha-dado"><span>Manutenção da sede</span><b>${U.dinheiro(manutencao)}</b></div>
       <div class="linha-dado"><span>Material</span><b>${U.dinheiro(material)}</b></div>
       <div class="linha-dado"><span class="fraco">Gráfico de seis meses entra quando `+
      `houver seis meses de histórico.</span></div>`;
    grade.appendChild(c2);

    const c3 = cartao('Principais receitas');
    const linhas = [
      ['Mensalidades', mensalidades, true],
      ['Bares', 0, true], ['Lojas', 0, true], ['Doações', 0, true]
    ];
    for(const [rot,v,pos] of linhas)
      c3.corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span>${rot}</span><b class="${v?(pos?'positivo':'negativo'):'fraco'}">`+
        `${v?U.dinheiro(v):'—'}</b>`}));
    const c4 = cartao('Principais despesas');
    for(const [rot,v] of [['Manutenção',manutencao],['Material',material],
                          ['Fianças',0],['Insumos',0]])
      c4.corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span>${rot}</span><b class="${v?'negativo':'fraco'}">${v?U.dinheiro(-v):'—'}</b>`}));
    const col3 = el('div'); col3.append(c3,c4);
    grade.appendChild(col3);

    pg.appendChild(grade);
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

  function pintarDiplomacia(){
    const e = E(), pg = U.$('.pagina[data-pag="diplomacia"]');
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Diplomacia'}));
    pg.appendChild(subabas([
      {id:'relacoes',    rot:'Relações'},
      {id:'aliancas',    rot:'Alianças'},
      {id:'rivalidades', rot:'Rivalidades'},
      {id:'tratados',    rot:'Tratados', desabilitada:true}
    ], subDip, id=>{subDip=id; redesenhar();}));

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
      `<th style="width:30%">Torcida</th><th style="width:22%">Clube</th>
       <th style="width:26%">Relação</th><th>Status</th><th>Ações</th>`})]));
    const tb = el('tbody');
    for(const l of filtradas.slice(0,120)){
      const est = TO.mundo.estiloRelacao(l.tipo);
      const tr = el('tr');
      tr.innerHTML =
        `<td>${l.o.nome}</td>
         <td>${l.o.clube}</td>
         <td>${barraRelacao(l.valor)}<span class="rel-num">${l.valor>0?'+':''}${Math.round(l.valor)}</span></td>
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
     MAPA DA CIDADE — bairros por zona (GDD §19.3)
     ======================================================= */
  const COR_CLASSE = {
    'Nobre':'#d9a441', 'Classe Média':'#8d8d8d',
    'Classe Baixa':'#a9714a', 'Favela':'#9d4a4a'
  };

  function pintarMapa(){
    const e = E(), pg = U.$('.pagina[data-pag="mapa"]');
    pg.innerHTML='';
    const c = TO.mundo.cidade(e.torcida.mapa);
    pg.appendChild(el('div',{class:'titulo-pagina',
      texto:`Mapa — ${c?c.nome:'cidade'}`}));

    if(!c){ pg.appendChild(emConstrucao('Sem cidade','Torcida sem praça definida.')); return; }

    const grade = el('div',{class:'principal-lateral'});
    const esq = el('div'), dir = el('div');

    const porZona = TO.mundo.bairrosPorZona(c.id);
    const sede = TO.mundo.bairroDaSede(e.torcida);

    for(const z of TO.mundo.ZONAS){
      const lista = porZona[z] || [];
      if(!lista.length) continue;
      const cz = cartao(`Zona ${z}`, `${lista.length} bairros`);
      const tab = el('table',{class:'dados'});
      tab.appendChild(el('thead',null,[el('tr',{html:
        `<th style="width:42%">Bairro</th><th style="width:24%">Classe</th>
         <th style="width:14%">Receita</th><th>Sedes</th>`})]));
      const tb = el('tbody');
      for(const b of lista){
        const ehSede = sede && b.id===sede.id;
        const tr = el('tr', ehSede?{class:'selecionada'}:null);
        const donas = (b.sedes||[]).join(', ') || '—';
        tr.innerHTML =
          `<td>${ehSede?'<span class="ponto"></span>':''}${b.nome}</td>
           <td style="color:${COR_CLASSE[b.classe]||'#8d8d8d'}">${b.classe}</td>
           <td class="num">${b.mult.toFixed(1)}×</td>
           <td class="fraco">${donas}</td>`;
        tb.appendChild(tr);
      }
      tab.appendChild(tb);
      cz.corpo.appendChild(tab);
      esq.appendChild(cz);
    }

    const ci = cartao('A praça');
    ci.corpo.innerHTML =
      `<div class="linha-dado"><span>Mapa</span>
         <b>${c.grade[0]}×${c.grade[1]} · ${c.quarteiroes} quarteirões</b></div>
       <div class="linha-dado"><span>Nível</span><b>${c.nivel} · ${c.tamanho}</b></div>
       <div class="linha-dado"><span>Bairros</span><b>${c.bairros.length}</b></div>
       <div class="linha-dado"><span>População</span><b>${U.numero(c.populacao)}</b></div>
       <div class="linha-dado"><span>Metrô</span><b>${c.temMetro?'sim':'não'}</b></div>
       <div class="linha-dado"><span>Estádios</span><b>${c.estadios.length}</b></div>
       <div class="linha-dado"><span>Multiplicador médio</span><b>${c.multMedio.toFixed(2)}×</b></div>
       <div class="linha-dado"><span>PM no mapa</span>
         <b>${c.pms} PM · ${c.guardas} guardas · ${c.choque} choque</b></div>
       <div class="linha-dado"><span>Sua sede</span>
         <b>${sede?sede.nome:'—'}${sede?` (${sede.mult.toFixed(1)}×)`:''}</b></div>`;
    dir.appendChild(ci);

    const ce = cartao('Estádios', `${c.estadios.length}`);
    for(const nome of c.estadios)
      ce.corpo.appendChild(el('div',{class:'linha-dado', html:`<span>${nome}</span>`}));
    if(c.rodovias.length){
      ce.corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span class="fraco">Rodovias: ${c.rodovias.join(' · ')}</span>`}));
    }
    dir.appendChild(ce);

    /* GDD §6.2: de quem dá pra recrutar nesta praça */
    const ct = cartao('Torcedores na praça', `${c.times.length} clubes`);
    for(const t of c.times.slice(0,10)){
      const base = TO.mundo.baseDeRecrutamento(c.id, t.clubeId);
      const meu = t.clubeId===e.torcida.clubeId;
      ct.corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span>${meu?'<span class="ponto"></span>':''}${t.clube}</span>
         <b>${t.perc}% · ${U.numero(t.torcedores)}</b>
         ${meu?`<span class="fraco">${U.numero(base)} fora de organizada</span>`:''}`}));
    }
    dir.appendChild(ct);

    grade.append(esq, dir);
    pg.appendChild(grade);
  }

  /* =======================================================
     PÁGINAS AINDA POR FAZER
     ======================================================= */
  const PENDENTES = {
    competicoes:['Competições',
      'Cinco divisões, 23 estaduais, 4 regionais e a Copa do Brasil (GDD §18). '+
      'O motor de tabelas da era Unity está em legado/unity e serve de base.'],
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

  function abrirEscalacao(){
    const aptos = TO.membros.aptosParaOEstadio(E());
    if(aptos.length < 4){ aviso('Gente apta de menos pra sair.','ruim'); return; }
    escalados = new Set(aptos.map(m=>m.id));
    pintarEscalacao(aptos);
    $('telaEscalacao').classList.remove('oculto');
  }

  function pintarEscalacao(aptos){
    $('subEscalacao').textContent =
      `${aptos.length} aptos · quem for escalado vira disco na cena`;
    const cx = $('corpoEscalacao'); cx.innerHTML='';
    cx.appendChild(el('div',{class:'linha-dado', html:
      `<span>Escalados</span><b id="contaEscalados">${escalados.size}</b>`}));
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
    pintarTopo();
    trocarPagina();
    if(pagina==='inicio') pintarInicio();
    else if(pagina==='torcida') pintarTorcida();
    else if(pagina==='financeiro') pintarFinanceiro();
    else if(pagina==='diplomacia') pintarDiplomacia();
    else if(pagina==='mapa') pintarMapa();
    else pintarPendente(pagina);
  }

  /* =======================================================
     LIGAÇÃO
     ======================================================= */
  TO.estado.aoMudar(redesenhar);
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
