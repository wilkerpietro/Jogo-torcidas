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
    escolhida = TO.mundo.ficha(TO.mundo.selecionaveis()[0]);
    pintarSelecao();
  }

  function pintarSelecao(){
    const fichas = TO.mundo.selecionaveis().map(TO.mundo.ficha);
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
    {id:'feed',        rot:'Feed',        ic:'megafone'},
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
    {id:'conquistas',  rot:'Conquistas',  ic:'medalha'},
    {id:'opcoes',      rot:'Opções',      ic:'halter'}
  ];
  /* A TELA PRINCIPAL É O FEED. O mapa virou painel como os outros: ele
     abre a partir de uma mensagem, e fechá-lo devolve o feed. */
  let pagina = 'feed';

  /* AS CHAVES DE OPÇÕES.
     Ficam no save, e os padrões são aplicados na leitura — assim save
     velho abre igual a save novo, sem migração nenhuma.

     `pularVazios` MORREU: o feed é o pulo. Dia sem nada passa em um
     segundo, calado, e não há mais o que pular. A chave que sobrou do
     ciclo anterior é a de perguntar antes do jogo — ela é o modo
     automático da ideologia, e agora quem pergunta é a mensagem. */
  function opc(e){
    e = e || E(); if(!e) return {relatorio:false, perguntarJogo:true};
    e.opcoes = e.opcoes || {};
    if(e.opcoes.relatorio === undefined) e.opcoes.relatorio = false;
    if(e.opcoes.perguntarJogo === undefined)
      e.opcoes.perguntarJogo = e.opcoes.abrirGestao === undefined
                             ? true : !!e.opcoes.abrirGestao;
    delete e.opcoes.pularVazios;
    delete e.opcoes.abrirGestao;
    return e.opcoes;
  }

  function entrarNoJogo(partidaNova){
    $('telaMenu').classList.add('oculto');
    $('telaSelecao').classList.add('oculto');
    $('jogo').classList.remove('oculto');
    montarLateral();
    ligarTelaEstreita();
    pagina = 'feed';
    opc(E());
    /* PARTIDA NOVA ABRE NO FEED, não na Gestão. A primeira mensagem diz
       que o jogo começou; a segunda é a decisão que chama a Gestão pra
       definir a ideologia — e, sendo decisão, ela segura o relógio até
       ser respondida. O tempo só começa a correr depois. */
    if(partidaNova) TO.feed.abrir(E());
    redesenhar();
    ticker();
    retomarTempo('abertura');
  }

  /* A COLUNA DE ÍCONES DO MENU.
     Os mesmos itens do `NAV`, sem rótulo escrito e com o nome no
     `title`, porque são doze e ícone mudo é adivinhação. Ela é montada
     duas vezes — uma na barra do feed, outra dentro do mapa —, porque
     as duas telas precisam de navegação e a lista é a mesma.
     Clicar abre a página como painel; clicar de novo fecha. */
  function montarMenuIcones(classe){
    const cx = el('div',{class: classe || 'mapa-menu'});
    for(const n of NAV){
      const b = el('button',{class:'mapa-ic', 'data-pag':n.id, html: IC.get(n.ic)});
      b.title = n.rot;
      b.setAttribute('aria-label', n.rot);
      if(painel === n.id) b.classList.add('aceso');
      b.onclick = ()=>{
        if(n.id === 'feed' || painel === n.id){ fecharPainel(); return; }
        abrirPainel(n.id);
      };
      cx.appendChild(b);
    }
    return cx;
  }

  function montarLateral(){
    const nav = $('lateral'); nav.innerHTML='';
    for(const n of NAV){
      const b = el('button',{class:'nav-item','data-pag':n.id,
        html:`${IC.get(n.ic)}<span>${n.rot}</span>`});
      b.onclick = ()=>{
        fecharGaveta();
        if(n.id === 'feed'){ fecharPainel(); return; }
        abrirPainel(n.id);
      };
      nav.appendChild(b);
    }
  }

  function trocarPagina(){
    U.$$('.pagina').forEach(s=>{
      s.classList.toggle('on', s.dataset.pag===pagina);
      s.classList.toggle('painel', s.dataset.pag===painel);
      if(s.dataset.pag===painel) s.classList.add('on');
    });
    U.$$('.nav-item').forEach(b=>
      b.classList.toggle('on', b.dataset.pag===(painel||pagina)));
    U.$$('.mapa-menu .mapa-ic, .feed-menu .mapa-ic').forEach(b=>
      b.classList.toggle('aceso', b.dataset.pag===painel));
    document.body.classList.toggle('com-painel', !!painel);
  }

  /* =======================================================
     PAINÉIS

     A tela principal é o feed. Tudo o mais — inclusive o mapa — é
     painel por cima dele: painel é visita, não destino.

     PAINEL ABERTO PARA O TEMPO. O jogador está lendo uma tela de
     gestão, não jogando, e um dia por segundo correndo atrás de uma
     tela opaca é o jogo andando escondido. O mapa é o único painel que
     também LIGA o relógio da rua — porque ele é a tela do dia de jogo,
     e é lá que os minutos correm.
     ======================================================= */
  const LIMIAR_ESTREITO = 900;
  const estreito = () => innerWidth <= LIMIAR_ESTREITO;
  let painel = null;

  const PINTOR = {
    feed:pintarFeed,
    inicio:pintarInicio, torcida:pintarTorcida, financeiro:pintarFinanceiro,
    gestao:pintarGestao, calendario:pintarCalendario,
    competicoes:pintarCompeticoes, diplomacia:pintarDiplomacia, mapa:pintarMapa,
    opcoes:pintarOpcoes, noticias:pintarNoticias
  };
  const pintarPagina = id => (PINTOR[id] || (()=>pintarPendente(id)))();

  function abrirPainel(id){
    if(id === 'feed'){ fecharPainel(); return; }
    if(painel && painel !== id && painel === 'mapa') pausarDia('mapa');
    pausarTempo('painel');
    painel = id;
    fecharGaveta();
    const rot = (NAV.find(n=>n.id===id)||{}).rot || id;
    if($('painelTitulo')) $('painelTitulo').textContent = rot;
    pintarTopo();
    pintarPagina(id);
    trocarPagina();
    montarAtalhos();
    /* o mapa é a tela do dia de jogo: abrindo, a rua anda */
    if(id === 'mapa') retomarDia('mapa');
  }
  function fecharPainel(){
    if(painel === null) return;
    const era = painel;
    painel = null;
    if(era === 'mapa') pausarDia('mapa');
    trocarPagina();
    montarAtalhos();
    /* o tempo volta de onde parou: fechar o mapa devolve o feed sem
       perder nem cobrar o tempo em que ele esteve aberto */
    retomarTempo('painel');
  }

  /* A GAVETA, O ☰ E OS ATALHOS DE CANTO SAÍRAM.
     A coluna de ícones dentro do mapa é a navegação inteira, em qualquer
     largura. A gaveta era a versão de celular dela; os três botões do
     canto — GESTÃO, TORCIDA, MENU — abriam duas páginas que a coluna já
     abre e uma gaveta que não existe mais. `montarAtalhos` sobreviveu
     como função vazia porque `redesenhar` a chama, e um `if` a menos no
     caminho quente é melhor do que um nome espalhado por três arquivos.

     O `#veu` também foi junto: ele só escurecia o fundo da gaveta. O
     painel de gestão nunca usou — ele é opaco e cobre o mapa inteiro. */
  const fecharGaveta = ()=>{ document.body.classList.remove('gaveta'); };
  function montarAtalhos(){}

  function ligarTelaEstreita(){
    const fecha = $('painelFechar');
    if(fecha) fecha.onclick = fecharPainel;
    addEventListener('keydown', ev=>{
      if(ev.key === 'Escape' && painel) fecharPainel();
    });
    /* a coluna do menu existe em qualquer largura, mas o tamanho do
       ícone muda com a altura da tela: mudar de orientação remonta o
       mapa uma vez, que é onde ela é construída */
    addEventListener('resize', ()=>{ if(!painel) redesenhar(); });
  }

  /* =======================================================
     A GESTÃO EM SEQUÊNCIA

     A página continua sendo montada inteira — são os mesmos cartões de
     sempre, com os mesmos botões — e o assistente é uma camada por cima
     dela: pega os cartões prontos e mostra UM de cada vez, na ordem de
     `TO.planejamento.passos(E)`.

     A ordem vem de lá e só de lá. Uma segunda lista escrita à mão aqui
     seria duas ordens que precisam concordar, que é a fonte clássica de
     divergência — e a fila é dinâmica: escolher "ir em paz" tira os
     passos de alvo, como, olheiro e bomba, e `passos` já se refaz
     sozinho. Por isso o assistente é remontado a cada `redesenhar`, e
     não guarda fila nenhuma: guarda só em que passo o jogador está.

     Cartão que não é passo — a caravana, o resumo — vai pro fim, junto
     do botão de fechar o plano.
     ======================================================= */
  let passoGestao = 0;
  function montarAssistente(pg, e){
    const P = TO.planejamento;
    const ps = P.passos(e);
    if(!ps.length) return false;              // sem jogo marcado: página normal
    const cartoes = [...pg.querySelectorAll('.passo')];
    if(!cartoes.length) return false;
    const porRot = new Map();
    for(const c of cartoes){
      const h = c.querySelector('h2');
      if(h) porRot.set(h.textContent.trim(), c);
    }
    const daFila = ps.map(x=>porRot.get(x.rot)).filter(Boolean);
    const sobrando = cartoes.filter(c=>!daFila.includes(c));

    passoGestao = U.limitar(passoGestao, 0, ps.length);
    const ultimo = passoGestao >= ps.length;   // a tela de resumo
    const atual = ps[passoGestao];

    const cx = el('div',{class:'assistente'});
    const trilha = el('div',{class:'ass-trilha'});
    ps.forEach((x,i)=>{
      const b = el('button',{class:'ass-bolinha'+(i===passoGestao?' on':'')+
                                    (x.feito?' feito':''), texto:String(i+1)});
      b.title = x.rot;
      b.onclick = ()=>{ passoGestao = i; redesenhar(); };
      trilha.appendChild(b);
    });
    const bR = el('button',{class:'ass-bolinha'+(ultimo?' on':''), texto:'✓'});
    bR.title = 'Resumo e fechar o plano';
    bR.onclick = ()=>{ passoGestao = ps.length; redesenhar(); };
    trilha.appendChild(bR);
    cx.appendChild(trilha);

    const palco = el('div',{class:'ass-palco'});
    if(ultimo){ for(const c of sobrando) palco.appendChild(c); }
    else if(daFila[passoGestao]) palco.appendChild(daFila[passoGestao]);
    else palco.appendChild(el('div',{class:'em-construcao',
      texto:`"${atual ? atual.rot : ''}" não tem tela própria ainda.`}));
    cx.appendChild(palco);

    const pe = el('div',{class:'ass-pe'});
    const bVolta = el('button',{class:'bt', texto:'Voltar'});
    bVolta.disabled = passoGestao === 0;
    /* voltar não perde nada: as decisões moram no plano, não na tela */
    bVolta.onclick = ()=>{ passoGestao--; redesenhar(); };
    const bAv = el('button',{class:'bt destaque',
      texto: ultimo ? 'Tudo decidido' : 'Avançar'});
    bAv.disabled = ultimo || (atual && !atual.feito);
    bAv.title = (atual && !atual.feito) ? `Resolva "${atual.rot}" pra avançar.` : '';
    bAv.onclick = ()=>{ passoGestao++; redesenhar(); };
    pe.append(el('span',{class:'fraco',
      texto: ultimo ? 'Resumo do plano'
           : `${passoGestao+1} de ${ps.length} · ${atual.rot}`+
             (atual.feito ? '' : ' — falta decidir')}), bVolta, bAv);
    cx.appendChild(pe);

    /* a ideologia fica à vista o tempo todo: são decisões que valem
       daqui pra frente, não desta semana */
    cx.appendChild(caixaDeIdeologia(e));

    pg.innerHTML = '';
    pg.appendChild(cx);
    return true;
  }

  /* A IDEOLOGIA — antes chamada "políticas".
     É o mesmo conjunto de padrões: o que fazer com o adversário do nosso
     jogo, como receber aliado e o que fazer com os outros jogos da
     praça. O nome mudou porque é assim que o jogo passa a falar dela em
     toda parte, inclusive no botão "Seguir ideologia" das decisões. */
  function caixaDeIdeologia(e){
    const P = TO.planejamento;
    const cx = el('div',{class:'ass-politicas'});
    cx.appendChild(el('div',{class:'fase-rot',
      texto:'Ideologia — vale toda semana'}));
    const grupo = (rot, itens, atual, aoTrocar)=>{
      const d = el('div',{class:'pol-grupo'});
      d.appendChild(el('b',{texto:rot}));
      const sel = el('select');
      for(const it of itens){
        const o = el('option',{texto:it.rot}); o.value = it.id;
        if(it.id === atual) o.selected = true;
        sel.appendChild(o);
      }
      sel.onchange = ()=>{ aoTrocar(sel.value); TO.estado.salvar(); redesenhar(); };
      d.appendChild(sel);
      cx.appendChild(d);
    };
    const pol = P.politicas(e);
    grupo('Nosso jogo', P.POLITICA_ATAQUE, pol.jogo,
          id=>P.definirPolitica(e, 'jogo', id));
    grupo('Aliados na cidade',
          P.RECEPCAO.map(r=>({id:r.id, rot:r.rot})),
          P.recepcaoPadrao(e) || 'nada',
          id=>P.definirRecepcaoPadrao(e, id === 'nada' ? 'nada' : id));
    grupo('Outros jogos na cidade', P.POLITICA_ATAQUE, pol.outros,
          id=>P.definirPolitica(e, 'outros', id));
    /* a quarta escolha é do mesmo tipo das três: quem decide, eu ou a
       ideologia. Por isso ela mora aqui e não em Opções. */
    const l = el('label',{class:'opc-chave'});
    const i = el('input',{type:'checkbox'});
    i.checked = !!opc(e).perguntarJogo;
    i.onchange = ()=>{ opc(e).perguntarJogo = i.checked;
                       TO.estado.salvar(); redesenhar(); };
    l.append(i, el('div',{html:'<b>Perguntar antes de todo jogo</b>'+
      '<small>ligada, a semana de jogo chega como mensagem de decisão e o '+
      'relógio para até você responder. Desligada, a ideologia acima fecha '+
      'o plano sozinha e o feed só conta o que foi decidido — e se ela não '+
      'conseguir fechar, a pergunta vem assim mesmo.</small>'}));
    cx.appendChild(l);
    return cx;
  }

  /* =======================================================
     OPÇÕES
     A CHAVE DE PULAR DIAS SAIU. Ela existia porque o jogador tinha de
     apertar avançar dia um por um e os dias vazios eram pedágio; com o
     feed, o dia vazio passa em um segundo, calado, e o pulo virou o
     jogo. Ficou uma chave só aqui — a outra, a de perguntar antes do
     jogo, mora na Gestão porque é parte da ideologia.
     ======================================================= */
  function pintarOpcoes(){
    const e = E(), pg = U.$('.pagina[data-pag="opcoes"]');
    pg.innerHTML = '';
    const o = opc(e);
    const q = el('div',{class:'quadro'});
    const chave = (id, rot, nota)=>{
      const l = el('label',{class:'opc-chave'});
      const i = el('input',{type:'checkbox'});
      i.checked = !!o[id];
      i.onchange = ()=>{ o[id] = i.checked; TO.estado.salvar(); redesenhar(); };
      l.append(i, el('div',{html:`<b>${rot}</b><small>${nota}</small>`}));
      q.appendChild(l);
    };
    chave('relatorio', 'Abrir o relatório toda semana',
      'desligado, a semana fecha sem interromper: o resumo vai pro feed e o '+
      'relatório continua no botão do Financeiro. Semana no vermelho ou com '+
      'gente saindo abre de qualquer jeito.');
    q.appendChild(el('div',{class:'linha-dado', html:
      '<span class="fraco">A velocidade do tempo — 1× ou 2× — fica na barra '+
      'do feed, e vale também pro relógio da rua no mapa.</span>'}));
    pg.appendChild(q);
  }

  /* =======================================================
     O FEED — A TELA PRINCIPAL

     Uma lista de mensagens. A nova entra sempre no topo e empurra a
     anterior pra segunda linha. O tempo corre sozinho, um dia por
     segundo, e o jogador não clica em nada pra isso acontecer.

     A LISTA NÃO É REMONTADA A CADA DIA. `pintarFeed` monta a moldura
     uma vez; `atualizarFeed` só acrescenta o que chegou e refaz o que
     mudou de estado — respondido ou expirado. Remontar sessenta nós por
     segundo faria a rolagem saltar toda vez que o jogador voltasse pra
     ler o que passou, que é justamente o que o histórico serve pra
     permitir.
     ======================================================= */
  const TETO_LISTA = 60;          // quantas mensagens ficam no DOM
  let tetoFeed = TETO_LISTA;
  let noFeedLista = null, noFeedTopo = null, noFeedQuando = null;
  let feedVistas = new Map();

  function pintarFeed(){
    const e = E(), pg = U.$('.pagina[data-pag="feed"]');
    if(!e || !pg) return;
    pg.innerHTML = '';
    feedVistas = new Map();

    const barra = el('div',{class:'feed-barra'});
    noFeedTopo = el('div',{class:'feed-marca'});
    noFeedQuando = el('div',{class:'feed-quando'});
    /* o 1×/2× que já existe controla a velocidade do dia — é o mesmo
       botão da cena e do relógio da rua, uma velocidade só pro jogo */
    const bVel = el('button',{class:'mapa-ic', html:
      `<span class="rot">${TO.diaJogo.ponte.velocidade}×</span>`});
    bVel.title = `Velocidade do tempo — agora em ${TO.diaJogo.ponte.velocidade}×`;
    bVel.onclick = ()=>{ TO.diaJogo.ponte.alternarVelocidade(); redesenhar(); };
    if(TO.diaJogo.ponte.velocidade > 1) bVel.classList.add('aceso');
    barra.append(noFeedTopo, noFeedQuando, bVel, montarMenuIcones('feed-menu'));

    const rolo = el('div',{class:'feed-rolo'});
    noFeedLista = el('div',{class:'feed-lista'});
    rolo.appendChild(noFeedLista);
    const hist = TO.feed.historico(e);
    if(hist.length > tetoFeed){
      const b = el('button',{class:'bt feed-mais',
        texto:`Mostrar mais antigas (${hist.length - tetoFeed})`});
      b.onclick = ()=>{ tetoFeed += TETO_LISTA; pintarFeed(); };
      rolo.appendChild(b);
    }
    pg.append(barra, rolo);
    atualizarFeed();
    pintarTopo();
  }

  /* o estado visível de uma mensagem: enquanto ele não muda, o nó dela
     no DOM não precisa ser refeito */
  const estadoDaMsg = (e, m) =>
    `${m.respondido||''}|${TO.feed.expirada(e,m)?1:0}`;

  function atualizarFeed(){
    const e = E();
    if(!e || !noFeedLista || !noFeedLista.isConnected) return;
    const hist = TO.feed.historico(e).slice(0, tetoFeed);
    /* de trás pra frente: cada uma entra por cima da anterior, então a
       última a entrar é a mais nova — que é a que fica no topo */
    for(let i = hist.length - 1; i >= 0; i--){
      const m = hist[i], est = estadoDaMsg(e, m), velho = feedVistas.get(m.id);
      if(velho && velho.estado === est) continue;
      const no = cartaoMensagem(e, m);
      if(velho && velho.no.isConnected) velho.no.replaceWith(no);
      else noFeedLista.prepend(no);
      feedVistas.set(m.id, {no, estado:est});
    }
    while(noFeedLista.children.length > tetoFeed) noFeedLista.lastChild.remove();
  }

  const ROT_VOZ = {olheiro:'Olheiro', diretor:'', rua:'Na rua',
                   jornal:'Jornal', rival:'', aliado:''};

  function cartaoMensagem(e, m){
    const cat = TO.feed.catDe(m.cat);
    const art = el('article',{class:`msg cat${m.cat} peso-${m.peso}`+
      (m.tipo ? ' '+m.tipo : '') + (m.respondido ? ' respondida' : '')});
    const v = m.voz || {};
    const quem = v.nome || ROT_VOZ[v.tipo] || 'A rua';
    const papel = v.cargo || ROT_VOZ[v.tipo] || cat.rot;
    const d = TO.estado.dataDaSemana(m.ano, m.semana, m.dia);
    const quando = `${String(d.getDate()).padStart(2,'0')}/`+
                   `${String(d.getMonth()+1).padStart(2,'0')} · ${m.hora}`;
    art.appendChild(el('div',{class:'msg-cab', html:
      `<span class="msg-voz">${quem}</span>`+
      `<span class="msg-papel">${papel}</span>`+
      `<span class="msg-cat">${cat.rot}</span>`+
      `<time>${quando}</time>`}));
    art.appendChild(el('p',{class:'msg-txt', texto:m.texto}));

    /* A LINHA DE CONSEQUÊNCIA. Ela sai dos efeitos que foram aplicados
       no estado, nunca de número escrito no texto — e mensagem que não
       moveu nada não tem linha, porque "nenhum efeito" é ruído. */
    const efs = TO.feed.lerEfeitos(m);
    if(efs.length){
      const le = el('div',{class:'msg-efeitos'});
      efs.forEach((x,i)=>{
        if(i) le.appendChild(el('span',{class:'sep', texto:'·'}));
        le.appendChild(el('span',{class:'ef '+(x.bom?'boa':'ruim'), texto:x.texto}));
      });
      art.appendChild(le);
    }

    if(m.linhaAbaixo){
      const la = el('div',{class:'msg-abaixo'});
      la.appendChild(el('span',{texto:m.linhaAbaixo.texto}));
      if(m.linhaAbaixo.acao){
        const a = el('button',{class:'msg-link', texto:'Ver'});
        a.onclick = ()=>abrirPainel(m.linhaAbaixo.pagina || 'competicoes');
        la.appendChild(a);
      }
      art.appendChild(la);
    }

    if(m.respondido){
      art.appendChild(el('div',{class:'msg-resp',
        texto:`Você respondeu: ${m.respondido}`}));
    } else if(TO.feed.expirada(e, m)){
      /* BOTÃO QUE SOME SEM EXPLICAÇÃO vira a suspeita de que o jogo
         comeu a jogada. Ele não some: fica escrito que o prazo passou. */
      art.appendChild(el('div',{class:'msg-resp expirou',
        texto:'O prazo desse botão passou.'}));
    } else if((m.botoes||[]).length){
      const bs = el('div',{class:'msg-bts'});
      (m.botoes||[]).forEach((b, i)=>{
        const bt = el('button',{class:'bt'+(i===0?' destaque':'')});
        bt.innerHTML = `<span>${b.rot}</span>`+
                       (b.nota ? `<small>${b.nota}</small>` : '');
        bt.onclick = ()=>responderMensagem(m.id, i);
        bs.appendChild(bt);
      });
      art.appendChild(bs);
      if(m.peso === 'acao' && m.validoAte != null)
        art.appendChild(el('div',{class:'msg-prazo', texto:
          `vale por mais ${Math.max(0, m.validoAte - (e.data.absoluto||0))} `+
          `${m.validoAte - (e.data.absoluto||0) === 1 ? 'dia' : 'dias'}`}));
    }
    return art;
  }

  /* O BOTÃO APERTADO. O efeito de estado é do `TO.feed`; o que sobra
     aqui é abrir tela, que é a única coisa que a tela sabe fazer. */
  function responderMensagem(id, i){
    const e = E();
    const r = TO.feed.responder(e, id, i);
    if(!r.ok){ if(r.motivo) aviso(r.motivo, 'ruim'); atualizarFeed(); return; }
    if(r.aviso) aviso(r.aviso, '');
    atualizarFeed();
    if(r.cena) abrirCenaDaMensagem(r.cena);
    else if(r.abrir) abrirPainel(r.abrir);
    else redesenhar();
    TO.estado.salvar();
    /* respondida a última decisão, o relógio volta a andar sozinho */
    retomarTempo('decisao');
  }

  /* a mensagem que convoca pra cena diz QUAL cena; abrir é aqui */
  function abrirCenaDaMensagem(d){
    const e = E();
    if(d.tipo === 'bar'){
      const atq = e.ataqueMarcado;
      if(atq) abrirAtaqueAoBar(atq);
      return;
    }
    if(d.tipo === 'encontro'){
      const R = TO.ruas.estado(e);
      if(R && R.encontro){ abrirPainel('mapa'); abrirConfronto(e, R.encontro); }
      else abrirPainel('mapa');
      return;
    }
    if(d.cena){ abrirAcaoEmCena(d, d.efetivo); return; }
    abrirPainel('mapa');
  }

  /* =======================================================
     NOTÍCIAS — o arquivo do feed

     A página era um placeholder desde o começo. Agora ela é o lugar
     onde o histórico inteiro mora: a tela principal guarda as últimas
     sessenta mensagens no DOM, e é aqui que se procura o que aconteceu
     em março com o filtro por categoria. Mesmo cartão, mesma leitura —
     o que muda é que aqui não se responde nada: o que tinha botão e foi
     respondido aparece com a resposta escrita.
     ======================================================= */
  let filtroFeed = 0;             // 0 = tudo
  function pintarNoticias(){
    const e = E(), pg = U.$('.pagina[data-pag="noticias"]');
    if(!e || !pg) return;
    pg.innerHTML = '';
    const hist = TO.feed.historico(e);
    const abas = el('div',{class:'subabas'});
    const põe = (n, rot)=>{
      const b = el('button',{texto: rot +
        (n ? ` (${hist.filter(m=>m.cat===n).length})` : ` (${hist.length})`)});
      b.classList.toggle('on', filtroFeed === n);
      b.onclick = ()=>{ filtroFeed = n; pintarNoticias(); };
      abas.appendChild(b);
    };
    põe(0, 'Tudo');
    for(const c of TO.feed.CATEGORIAS) põe(c.n, c.rot);
    pg.appendChild(abas);

    const lista = el('div',{class:'feed-lista'});
    const filtradas = hist.filter(m=>!filtroFeed || m.cat === filtroFeed);
    if(!filtradas.length)
      lista.appendChild(el('div',{class:'em-construcao',
        texto:'Nada nesta categoria ainda.'}));
    for(const m of filtradas.slice(0, 200)) lista.appendChild(cartaoMensagem(e, m));
    if(filtradas.length > 200)
      lista.appendChild(el('div',{class:'linha-dado', html:
        `<span class="fraco">…e mais ${filtradas.length-200} mensagens mais `+
        `antigas.</span>`}));
    pg.appendChild(lista);
  }

  /* =======================================================
     CABEÇALHO
     ======================================================= */
  /* O CABEÇALHO VIROU HUD DO MAPA.
     Era uma faixa de 56px acima de tudo; agora a data e o avançar ficam
     no canto de cima à direita do mapa e o escudo, o nome e os números
     na faixa de baixo. Os nós são criados por `pintarMapa` e guardados
     aqui, do mesmo jeito que o relógio da rua — assim isto continua
     sendo escrita de texto, e não remontagem de tela.

     Membros e prestígio não foram pedidos em lugar nenhum, e sumir sem
     destino não é opção: vão junto do saldo na faixa de baixo, que é
     onde os três já eram lidos lado a lado. */
  let noData = null, noRodape = null;
  function pintarTopo(){
    const e = E();
    if(!e) return;
    const dt = TO.estado.dataTexto();
    if(noData && noData.isConnected){
      noData.querySelector('.dia').textContent = dt.curta;
      noData.querySelector('.semana').textContent = dt.semana;
    }

    /* a barra do feed carrega as mesmas coisas que a faixa do mapa: quem
       somos, quando estamos e os três números. Uma escrita só, dois
       lugares — recalcular em cada um é a tela mentindo daqui a três
       semanas. */
    if(noFeedQuando && noFeedQuando.isConnected){
      noFeedQuando.innerHTML =
        `<b>${dt.semana}, ${dt.curta}</b>`+
        `<small>semana ${e.data.semana} de ${TO.competicoes.SEMANAS_ANO} · `+
        `${e.data.ano}${TO.feed.travado(e) ? ' · tempo parado' : ''}</small>`;
    }
    if(noFeedTopo && noFeedTopo.isConnected){
      const [c1,c2] = e.torcida.cores;
      const c = TO.membros.contar(e);
      const sem = (TO.financeiro.resumoDaSemana(e) || {}).saldo || 0;
      const sinal = sem > 0 ? '+' : sem < 0 ? '−' : '';
      noFeedTopo.innerHTML =
        `<span class="escudo" style="background:linear-gradient(135deg,${c1} 0 52%,${c2} 52% 100%)"
           >${e.torcida.sigla}</span>`+
        `<b>${e.torcida.nome}</b>`+
        `<span class="num${e.dinheiro<0?' negativo':''}">${IC.get('dinheiro')}`+
        `${U.dinheiro(e.dinheiro)}</span>`+
        `<span class="num semana ${sem>0?'sobra':sem<0?'falta':''}"`+
        ` title="saldo desta semana">${sinal}${U.dinheiro(Math.abs(sem))}`+
        `<em>/sem</em></span>`+
        `<span class="num">${IC.get('membros')}${U.numero(c.total)}</span>`+
        `<span class="num">${IC.get('estrela')}`+
        `${Math.round(e.indicadores.prestigio*5)}</span>`;
    }

    if(noRodape && noRodape.isConnected){
      const [c1,c2] = e.torcida.cores;
      const c = TO.membros.contar(e);
      /* O SALDO DA SEMANA, ao lado do saldo em conta.
         O número não é recalculado aqui: sai inteiro de
         `TO.financeiro.resumoDaSemana`, que é receita menos despesa
         menos o que a Gestão comprometeu — a mesma conta que a tela de
         Financeiro mostra. Duas contas com os mesmos valores escritas
         em dois lugares é a tela mentindo daqui a três semanas.

         É PROJEÇÃO DA SEMANA CORRENTE, não resultado fechado: mexe na
         hora em que o jogador decide uma caravana, e é isso que o torna
         útil aqui. E mora no redesenho da faixa, não no laço por quadro
         — `resumoDaSemana` chama `contas()` e `compromissos()`. */
      const sem = (TO.financeiro.resumoDaSemana(e) || {}).saldo || 0;
      const sinal = sem > 0 ? '+' : sem < 0 ? '−' : '';
      noRodape.innerHTML =
        `<span class="escudo" style="background:linear-gradient(135deg,${c1} 0 52%,${c2} 52% 100%)"
           >${e.torcida.sigla}</span>` +
        `<b>${e.torcida.nome}</b>` +
        `<span class="praca">${e.torcida.cidade} · ${e.torcida.uf}</span>` +
        `<span class="num${e.dinheiro<0?' negativo':''}">${IC.get('dinheiro')}` +
        `${U.dinheiro(e.dinheiro)}</span>` +
        `<span class="num semana ${sem>0?'sobra':sem<0?'falta':''}"` +
        ` title="saldo desta semana: receita menos despesa menos o que a `+
        `Gestão comprometeu">${sinal}${U.dinheiro(Math.abs(sem))}` +
        `<em>/sem</em></span>` +
        `<span class="num">${IC.get('membros')}${U.numero(c.total)}</span>` +
        `<span class="num">${IC.get('estrela')}` +
        `${Math.round(e.indicadores.prestigio*5)}</span>`;
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
    verCal.onclick = ()=>abrirPainel('calendario');
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
    verTodas.onclick = ()=>abrirPainel('noticias');
    cNot.rodape(verTodas);
    esq.appendChild(cNot);

    /* avisos: o que está esperando decisão do jogador */
    const pend = TO.planejamento.pendencias(e);
    const cAv = cartao('Avisos', pend.length ? `${pend.length} pendentes` : 'tudo em dia');
    if(!pend.length){
      cAv.corpo.appendChild(el('div',{class:'linha-dado', html:
        '<span class="fraco">Nada esperando por você.</span>'}));
    }
    for(const a of pend){
      const b = el('button',{class:'aviso-linha '+a.tipo, html:
        `<span class="pino"></span>
         <span class="txt"><span>${a.texto}</span><small>${a.detalhe}</small></span>`});
      b.onclick = ()=>{
        /* a página do aviso vira painel: `pagina` é sempre o feed desde
           que o feed virou a tela */
        if(a.id==='acoes') abrirTodasAcoes();
        else abrirPainel(a.pagina);
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
    verFin.onclick = ()=>abrirPainel('financeiro');
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
      const penaDele = TO.membros.diasPresos(m);
      const sit = m.preso ? (penaDele != null ? `Preso · ${penaDele}d` : 'Preso')
                : m.ferido ? `Ferido · ${m.ferido.dias}d`
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
  /* MODAL ABERTO PARA O TEMPO. Ele cobre a tela inteira: deixar os dias
     correndo atrás dele é o jogo andando escondido, que é o mesmo
     motivo pelo qual painel aberto pausa. O contador existe porque um
     modal pode abrir por cima de outro. */
  let modaisAbertos = 0;
  function modal(titulo, sub, corpo, acoes, largura){
    const fundo = el('div',{class:'tela-cheia'});
    modaisAbertos++; pausarTempo('modal');
    const sair = ()=>{ if(--modaisAbertos <= 0){ modaisAbertos = 0;
                                                 retomarTempo('modal'); } };
    const orig = fundo.remove.bind(fundo);
    fundo.remove = ()=>{ if(fundo.isConnected) sair(); orig(); };
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
     PATRIMÔNIO
     Duas abas porque são duas decisões diferentes com o mesmo
     caixa: ESTRUTURA é o que rende todo mês e MATERIAL é o
     que a torcida leva pro estádio. A tabela é mensal porque
     é assim que ela se compara com o preço de compra — o
     fechamento continua sendo semanal.
     ======================================================= */
  function pintarPatrimonio(pg, e){
    const PAT = TO.patrimonio;
    pg.appendChild(abasGrandes([
      {id:'estrutura', rot:'Estrutura'},
      {id:'materiais', rot:'Materiais'},
      {id:'elenco',    rot:'Elenco'}
    ], abaPat, id=>{abaPat=id; redesenhar();}));

    const comprar = (fn)=>{
      const r = fn();
      aviso(r.msg, r.ok?'boa':'ruim');
      if(r.ok) redesenhar();
    };
    /* uma linha de loja: o que é, quanto custa, e o botão */
    const oferta = (rot, nota, custo, trava, aoClicar)=>{
      const b = el('button',{class:'oferta'+(trava?' travada':'')});
      b.innerHTML =
        `<span class="txt"><b>${rot}</b>${nota?`<small>${nota}</small>`:''}</span>
         <span class="preco">${U.dinheiro(custo)}</span>`;
      if(trava) b.appendChild(el('small',{class:'trava', texto:trava}));
      b.disabled = !!trava;
      b.onclick = aoClicar;
      return b;
    };

    if(abaPat==='estrutura'){
      const linhas = PAT.linhas(e);
      const soma = k => linhas.reduce((s,l)=>s+l[k], 0);
      const c = cartao('Estrutura',
        'por mês · mensalidade e caravana ficam no Resumo');
      const tab = el('div',{class:'tabela-pat'});
      tab.appendChild(el('div',{class:'cab', html:
        '<span>Local</span><span>Receita</span><span>Despesa</span><span>Mês</span>'}));
      for(const l of linhas){
        tab.appendChild(el('div',{class:'linha', html:
          `<span class="nome">${l.rot}${l.bairro?`<small>${l.bairro}</small>`:''}`+
          `${l.nota?`<small>${l.nota}</small>`:''}</span>
           <span class="v ${l.receita?'positivo':''}">${l.receita?U.dinheiro(l.receita):'—'}</span>
           <span class="v ${l.despesa?'negativo':''}">${l.despesa?U.dinheiro(-l.despesa):'—'}</span>
           <span class="v ${l.saldo>0?'positivo':l.saldo<0?'negativo':''}">`+
          `${U.dinheiro(l.saldo)}</span>`}));
      }
      const s = soma('receita')-soma('despesa');
      tab.appendChild(el('div',{class:'linha total', html:
        `<span class="nome">Total do patrimônio</span>
         <span class="v positivo">${U.dinheiro(soma('receita'))}</span>
         <span class="v negativo">${U.dinheiro(-soma('despesa'))}</span>
         <span class="v ${s>=0?'positivo':'negativo'}">${U.dinheiro(s)}</span>`}));
      c.corpo.appendChild(tab);
      pg.appendChild(c);

      const c2 = cartao('Adquirir e ampliar', `caixa: ${U.dinheiro(e.dinheiro)}`);
      for(const o of PAT.opcoes(e))
        c2.corpo.appendChild(oferta(o.rot, o.nota, o.custo, o.trava,
          ()=>comprar(()=>PAT.comprar(e, o.id))));
      pg.appendChild(c2);
      return;
    }

    /* --- elenco (GDD V3 §19) --- */
    if(abaPat==='elenco'){ pintarElenco(pg, e, oferta, comprar); return; }

    /* --- materiais --- */
    const c = cartao('O que a torcida tem', 'bateria, faixa, bandeirão, bandeira e pirotecnia');
    const grade = el('div',{class:'itens-pat'});
    let nada = true;
    for(const m of PAT.MATERIAIS){
      const n = PAT.quantidade(e, m.id);
      if(!n) continue;
      nada = false;
      grade.appendChild(el('div',{class:'item-pat', html:
        `<b>${n}</b><span>${m.rot}</span>`}));
    }
    if(nada) grade.appendChild(el('div',{class:'em-construcao',
      texto:'A torcida não tem material nenhum guardado.'}));
    c.corpo.appendChild(grade);
    /* o que o material vale, em número que o jogador reconhece de outra
       tela — número solto de "festa" não diz nada a ninguém */
    const ef = PAT.efeito(e);
    const T = TO.torcedores;
    const bonus = T.fatorTorcida(e).ganho * T.EM_FORCA;
    c.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span>Satisfação descansa em</span><b${ef.satisfacao?' class="positivo"':''}>`+
      `${T.neutraDe(e).toFixed(1)} de 20</b>`}));
    c.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span>Reputação na rua</span><b${ef.prestigio?' class="positivo"':''}>`+
      `${ef.prestigio ? '+'+ef.prestigio.toFixed(1)+' na doação de simpatizante' : '—'}</b>`}));
    c.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span>No dia de jogo</span><b${bonus>=0.05?' class="positivo"':''}>`+
      `${bonus>=0.05 ? '+'+bonus.toFixed(1)+' de força'
                     : 'a arquibancada já está cheia'}</b>`}));
    c.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span>Guarda e conserto</span><b${ef.manutencao?' class="negativo"':''}>`+
      `${ef.manutencao ? U.dinheiro(-ef.manutencao)+' por mês' : '—'}</b>`}));
    pg.appendChild(c);

    for(const fam of PAT.FAMILIAS){
      const itens = PAT.MATERIAIS.filter(m=>m.fam===fam);
      if(!itens.length) continue;
      const cf = cartao(fam);
      for(const m of itens){
        const trava = PAT.podeComprar(e, m.id, 1);
        const tem = PAT.quantidade(e, m.id);
        const nota = [m.nota, tem?`tem ${tem}`:null].filter(Boolean).join(' · ');
        cf.corpo.appendChild(oferta(m.rot, nota, m.preco, trava,
          ()=>comprar(()=>PAT.comprarMaterial(e, m.id, 1))));
      }
      pg.appendChild(cf);
    }
  }

  /* =======================================================
     ELENCO — dinheiro da torcida virando força do time
     (GDD V3 §19). O preço do ponto sobe com a força do clube:
     R$ 50 mil no time pequeno, R$ 800 mil no gigante.
     ======================================================= */
  function pintarElenco(pg, e, oferta, comprar){
    const C = TO.competicoes;
    const id = e.torcida.clubeId;
    const time = TO.mundo.time(id) || {};
    const forca = C.forcaDe(e, id);
    const inv   = C.invDe(e, id);
    const base  = C.forcaBase(e, id);
    const custo = C.custoDoPonto(e, id);
    const noTeto = forca >= C.FORCA_MAX;

    const c = cartao(`Elenco do ${time.nome || id}`,
      `${time.divisao || ''}${time.divisao?' · ':''}força de ${C.FORCA_MIN} a ${C.FORCA_MAX}`);
    /* a barra separa o que o clube conquistou do que a torcida bancou */
    const barra = el('div',{class:'barra-elenco'});
    barra.appendChild(el('i',{class:'base',
      style:`width:${base/C.FORCA_MAX*100}%`}));
    barra.appendChild(el('i',{class:'inv',
      style:`left:${base/C.FORCA_MAX*100}%;width:${inv/C.FORCA_MAX*100}%`}));
    c.corpo.appendChild(barra);
    c.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span>Força hoje</span><b>${forca} de ${C.FORCA_MAX}</b>`}));
    c.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span>Conquistada em campo</span><b>${base}</b>`}));
    c.corpo.appendChild(el('div',{class:'linha-dado', html:
      `<span>Bancada pela torcida</span><b${inv?' class="positivo"':''}>`+
      `${inv ? '+'+inv : '—'}</b>`}));
    pg.appendChild(c);

    const c2 = cartao('Reforçar elenco', `caixa: ${U.dinheiro(e.dinheiro)}`);
    c2.corpo.appendChild(oferta(
      '+1 de força',
      noTeto ? '' : `o clube está na faixa de ${U.dinheiro(custo)} por ponto`,
      custo,
      noTeto ? 'o elenco já está no teto'
             : e.dinheiro < custo ? 'falta caixa' : null,
      ()=>comprar(()=>C.investir(e, id, 1))));
    pg.appendChild(c2);
  }

  /* =======================================================
     FINANCEIRO
     ======================================================= */
  let subFin = 'resumo';
  let abaPat = 'estrutura';

  function pintarFinanceiro(){
    const e = E(), pg = U.$('.pagina[data-pag="financeiro"]');
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Financeiro'}));
    pg.appendChild(subabas([
      {id:'resumo', rot:'Resumo'},
      {id:'patrimonio', rot:'Patrimônio'},
      {id:'transacoes', rot:'Transações'}
    ], subFin, id=>{subFin=id; redesenhar();}));

    if(subFin==='patrimonio'){ pintarPatrimonio(pg, e); return; }

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
    btGest.onclick = ()=>abrirPainel('gestao');
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
      /* o que a arquibancada vale pro nosso time, em pontos de força */
      const bon = (ft.valor - 0.5) * TO.torcedores.EM_FORCA;
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
    /* A IDEOLOGIA APARECE SEMPRE, com jogo marcado ou sem.
       Ela não depende do próximo jogo — é a regra que vale daqui pra
       frente —, e é nela que a partida nova abre. Antes o bloco morava
       dentro do assistente, que só monta quando `passos()` tem algo, e
       numa semana sem jogo o jogador caía numa Gestão sem ideologia. */
    if(!montarAssistente(pg, e) && !pg.querySelector('.ass-politicas'))
      pg.appendChild(caixaDeIdeologia(e));
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
  let filtrosAbertos = false;  // "Pontos do mapa" começa recolhido
  let relogioRua = null;

  /* =======================================================
     O RELÓGIO DO MAPA ANDANDO NA TELA

     `rodarRelogio` redesenhava o canvas a cada quadro e só. O texto do
     relógio mora num nó do DOM montado em `pintarMapa`, e nada o
     tocava durante o laço: ele só se refazia quando `redesenhar()`
     rodava — que é o que acontece quando o jogador aperta Pausar. Daí o
     sintoma de o relógio ficar congelado até você parar o dia.

     Aqui só se escreve `textContent` nos dois nós guardados. Chamar
     `redesenhar()` por quadro seria a correção errada: ela recria o
     canvas do mapa e o zoom e o arrasto vão junto.
     ======================================================= */
  let noRelogioRua = null, noInfoRua = null;
  function pintarRelogioDaRua(e, R){
    if(!noRelogioRua || !noRelogioRua.isConnected) return;
    const jogos = TO.ruas.jogosDaPraca(e).filter(x=>x.dia === e.data.dia);
    const falta = Math.max(0, (R.apito||0) - R.minuto);
    const hhmm = m => `${Math.floor(m/60)}h${String(Math.round(m%60)).padStart(2,'0')}`;
    noRelogioRua.innerHTML =
      `<b>${TO.ruas.relogio(R.minuto, e)}</b><small>${
        !jogos.length ? (falta > 0 ? `${hhmm(falta)} de rua` : 'anoiteceu')
        : falta > 0 ? `${hhmm(falta)} pro apito` : 'bola rolando'}</small>`;
    if(noInfoRua && noInfoRua.isConnected){
      const pequeno = noInfoRua.querySelector('small');
      if(pequeno) pequeno.textContent = resumoDaRua(e, R);
    }
  }
  /* a linha de baixo: quem está na rua agora, com jogo ou sem */
  function resumoDaRua(e, R){
    const naRuaAgora = (R.andarilhos||[])
      .filter(a=>!a.chegou && R.minuto >= a.saiEm).length;
    const roubo = (R.recados||[]).find(r=>r.aberto && !r.fechado);
    const andando = R.bondes.filter(b=>!b.chegou).length;
    const vida = `${naRuaAgora} a pé na rua`
      + (R.brigasDeRua ? ` · ${R.brigasDeRua} esbarrão${R.brigasDeRua>1?'ões':''}` : '')
      + (roubo ? ` · assalto n${/^[AEIOU]/i.test(roubo.nome)?'':'o '}${roubo.nome}` : '');
    return R.bondes.length
      ? `${R.bondes.length} bondes na rua · ${andando} ainda a caminho · ${vida}`
      : vida;
  }

  /* =======================================================
     O DIA COMEÇA RODANDO, E PAUSA QUANDO TEM DE PAUSAR

     Antes o jogador tinha de apertar play, e o relógio parava sozinho
     em três lugares sem nunca religar: no encontro, ao avançar o dia e
     ao fechar a cena. Agora ele nasce ligado — e por isso precisa de
     motivos de pausa explícitos, guardados num conjunto:

     · `painel`  — o jogador está lendo uma tela de gestão, não jogando,
                   e o `requestAnimationFrame` estaria desenhando o mapa
                   inteiro atrás de uma tela opaca;
     · `foco`    — aba sem foco congela o rAF sozinho; sem tratar isso
                   como pausa, o relógio SALTA quando a aba volta,
                   porque o primeiro quadro traz o tempo todo de fora;
     · `salvar`  — salvar no meio de um dia correndo pega o mundo pela
                   metade. O save não é bloqueado: ele pausa, salva e
                   devolve o dia de onde parou;
     · `cena`    — a briga abriu por cima do mapa.

     Enquanto houver motivo o relógio não anda. Quando o último sai,
     ele volta de onde parou — o `ultimo` do laço é zerado a cada
     partida, então nenhum minuto é cobrado pelo tempo parado. */
  /* DOIS RELÓGIOS, DOIS CONJUNTOS DE MOTIVOS.

     `pausas` é do relógio DA RUA — os minutos que correm dentro do
     mapa. Ele nasce parado, com o motivo `mapa`: sem o mapa aberto não
     há rua pra ver, e o dia inteiro é simulado de uma vez pelo relógio
     do tempo.

     `pausasT` é do relógio DO TEMPO — os dias que passam sozinhos no
     feed, um por segundo. Ele nasce correndo, e para por painel aberto,
     aba sem foco, save, cena e decisão sem resposta.

     Os motivos que valem pros dois — foco, salvar, cena — entram nos
     dois conjuntos. Um relógio só não daria conta: no mapa aberto a rua
     tem de andar e o calendário tem de ficar parado, que é exatamente o
     par de estados que um conjunto único não sabe representar. */
  const pausas  = new Set(['mapa']);
  const pausasT = new Set();
  function pausarDia(motivo){
    pausas.add(motivo);
    if(relogioRua){ cancelAnimationFrame(relogioRua); relogioRua = null; }
  }
  function retomarDia(motivo){
    pausas.delete(motivo);
    if(pausas.size) return;
    const e = E(); if(!e) return;
    const R = TO.ruas.estado(e);
    /* religar depois do encontro, do avanço de dia e do fim da cena é
       exatamente o que faltava: `R.rodando` virava false e ninguém o
       punha de volta */
    if(!R.rodando && R.minuto < (R.apito || 0) && !R.encontro) R.rodando = true;
    if(R.rodando) rodarRelogio();
  }
  const diaPausado = () => pausas.size > 0;

  /* =======================================================
     O RELÓGIO DO TEMPO — UM DIA POR SEGUNDO

     Uma semana são 7 s; uma temporada de 52 semanas, pouco mais de
     6 minutos de tempo corrido, sem contar as paradas. O 1×/2× que já
     existe multiplica isto, como multiplica a rua e a cena.

     O DIA NÃO ESPERA MENSAGEM. Várias podem cair de uma vez, no mesmo
     instante, e todas entram no topo na ordem da fila — não há pausa de
     leitura entre elas. Isso funciona porque o tempo está sempre
     parando: toda decisão congela o relógio, e o jogador lê com calma o
     que se acumulou. O que passar numa rajada não se perde: o feed é
     histórico e rola pra trás.
     ======================================================= */
  const SEG_POR_DIA = 1;
  const MAX_DIAS_POR_QUADRO = 8;   // aba que volta de longe não vira maratona
  let relogioTempo = null, sobraDoDia = 0;

  function pausarTempo(motivo){
    pausasT.add(motivo);
    if(relogioTempo){ cancelAnimationFrame(relogioTempo); relogioTempo = null; }
  }
  function retomarTempo(motivo){
    pausasT.delete(motivo);
    if(pausasT.size) return;
    rodarTempo();
  }
  const tempoPausado = () => pausasT.size > 0;

  function rodarTempo(){
    if(relogioTempo) return;
    const e0 = E(); if(!e0) return;
    if(pausasT.size) return;
    /* A DECISÃO NÃO É MOTIVO DE PAUSA, é uma pergunta ao mundo.
       Ela chegou a entrar no conjunto junto com painel, foco e save, e
       isso criou o pior sintoma que este relógio pode ter: um motivo
       ficava pra trás quando a resposta vinha por um caminho que não
       passava por quem o tirava, e o jogo congelava com a tela limpa —
       sem painel, sem modal e sem nada pra responder. Agora a verdade é
       uma só e é `TO.feed.travado`: o laço não começa e não continua
       enquanto houver decisão sem resposta, e quem responde manda
       religar. Um estado do mundo não se guarda em dois lugares. */
    if(TO.feed.travado(e0)) return;
    let ultimo = 0;
    const passo = agora=>{
      const e = E();
      if(!e || pausasT.size || TO.feed.travado(e)){ relogioTempo = null; return; }
      const dt = ultimo ? Math.min(0.5, (agora - ultimo)/1000) : 0;
      ultimo = agora;
      sobraDoDia += dt * TO.diaJogo.ponte.velocidade;
      let n = 0;
      while(sobraDoDia >= SEG_POR_DIA && n < MAX_DIAS_POR_QUADRO){
        sobraDoDia -= SEG_POR_DIA; n++;
        passarUmDia(e);
        if(pausasT.size || TO.feed.travado(e)) break;
      }
      if(n){ pintarTopo(); atualizarFeed(); }
      if(pausasT.size || TO.feed.travado(E())){ relogioTempo = null; return; }
      relogioTempo = requestAnimationFrame(passo);
    };
    relogioTempo = requestAnimationFrame(passo);
  }

  /* UM DIA INTEIRO, sem tela.
     A rua do dia que está acabando roda do primeiro minuto ao apito —
     andarilho anda, assalto abre e fecha, viatura sai —, e só depois a
     data vira. É o mesmo caminho do dia assistido no mapa; o que muda é
     que não há quadro pra desenhar. Encontro entre bondes interrompe: a
     rua para onde parou e a convocação vira mensagem de decisão. */
  function passarUmDia(e){
    if(document.body.classList.contains('em-cena')) return;
    const enc = simularDiaDaRua(e);
    if(enc){
      TO.feed.convocarEncontro(e, enc);
      TO.feed.publicar(e);
      if(TO.feed.travado(e)) return;
      /* ninguém nosso no encontro: a rua resolve sozinha e o dia segue */
      TO.ruas.resolver(e);
    }
    TO.estado.avancarDia();
    TO.feed.passarDia(e);
  }

  function rodarRelogio(){
    if(relogioRua || pausas.size) return;
    let ultimo = 0;
    const passo = agora=>{
      const e = E();
      const R = e && TO.ruas.estado(e);
      if(!e || !R || !R.rodando || pausas.size){ relogioRua = null; return; }
      const dt = ultimo ? Math.min(0.1, (agora-ultimo)/1000) : 0;
      ultimo = agora;
      const mo = mapaAtual;
      if(mo && dt){
        /* dois minutos de rua por segundo de tela, a mesma velocidade o
           dia inteiro: a manhã parada faz parte do dia. O 2× multiplica
           só isto — `passo()` avança rota e relógio, e não tem física
           pra perder resolução como a cena tem. */
        TO.ruas.passo(e, mo, dt * 2 * TO.diaJogo.ponte.velocidade);
        if(canvasMapa) { TO.mapa.desenhar(mo, canvasMapa);
                         TO.ruas.desenhar(e, mo, canvasMapa.getContext('2d')); }
        pintarRelogioDaRua(e, R);
        if(R.encontro){ relogioRua = null; redesenhar(); return; }
        /* o bonde comandado chegou no pino que o jogador apontou: a
           cena é a investida que `acoes.js` já sabe montar, e a ação
           da semana já foi cobrada na saída da sede */
        if(R.noAlvo){
          const b = R.noAlvo; R.noAlvo = null;
          R.rodando = false; relogioRua = null;
          const alvo = `${b.alvoFixo.torcidaId}|${b.alvoFixo.tipo}`;
          const r = TO.acoes.porId('atacar').executar(e, {alvo});
          if(r.ok && r.cena){ b.chegou = true; abrirAcaoEmCena(r.cena, b.n); }
          else { aviso(r.msg || 'O alvo sumiu.', 'ruim'); redesenhar(); }
          return;
        }
        /* o relógio para no apito, não quando o último bonde chega */
        if(R.minuto >= (R.apito || 0)){ R.rodando = false; relogioRua = null;
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
    const cidade = TO.mundo.cidade(e.torcida.mapa);
    if(!cidade || !(cidade.bairros||[]).length){
      pg.appendChild(el('div',{class:'titulo-barra', html:'<h1>Mapa da cidade</h1>'}));
      pg.appendChild(emConstrucao('Sem mapa',
        'Esta praça não tem bairros catalogados.'));
      return;
    }
    /* A PRAÇA VAI NO TÍTULO DA PÁGINA, e o cartão perde o cabeçalho.
       Aqui morava um painel de conferência da época em que o mapa estava
       sendo construído — tamanho, bairros, ruas, estádios, nossa sede,
       população e o contador de pinos visíveis. Hoje o mapa é a tela
       principal do jogo, e esses números comiam a primeira dobra dela;
       no celular, comiam mais. O que não podia sumir é em qual das cinco
       praças a gente está, e isso o título resolve com uma linha só. */
    /* O TÍTULO DA PÁGINA SAIU. Ele era o nome da tela numa época em que
       o mapa era uma das onze; agora o mapa é a tela, e o que ele dizia
       — em qual praça estamos — está na faixa de baixo, junto do nome da
       torcida. Eram quarenta pixels de moldura em cima do jogo. */

    const mo = MP.modelo(e);
    const q = el('div',{class:'quadro'});
    q.corpo = el('div');
    q.appendChild(q.corpo);

    /* --- filtros ---
       PONTOS DO MAPA, RECOLHIDO POR PADRÃO.
       Este painel já morou por cima do mapa uma vez e foi pra margem
       porque, com a arte no lugar da planta esquemática, o cartão
       flutuante tapava bairro de verdade. Volta pra dentro do mapa, mas
       fechado: aberto ele é uma coluna estreita, e escolher um tipo o
       fecha de novo — o que ele tapa, tapa por dois segundos. */
    const f = MP.filtros(e);
    const filtros = el('div',{class:'mapa-filtros'});
    if(!filtrosAbertos) filtros.classList.add('fechado');
    const caixa = (chave, rot, cls)=>{
      const l = el('label',{class:'mapa-filtro '+(cls||'')});
      const i = el('input',{type:'checkbox'});
      i.checked = !!f[chave];
      i.onchange = ()=>{ f[chave] = i.checked; filtrosAbertos = false; redesenhar(); };
      l.append(i, el('span',{texto:rot}));
      return l;
    };
    const grupo = (rot, chaves)=>{
      const todos = chaves.every(k=>f[k]);
      const l = el('label',{class:'mapa-filtro grupo'});
      const i = el('input',{type:'checkbox'});
      i.checked = todos;
      i.indeterminate = !todos && chaves.some(k=>f[k]);
      i.onchange = ()=>{ for(const k of chaves) f[k] = i.checked;
                         filtrosAbertos = false; redesenhar(); };
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

    /* --- o dia na rua: bondes, relógio, olheiro e o bonde comandado ---
       A barra existe TODO DIA. Antes ela só valia em dia de jogo e o
       resto do ano era uma frase morta ("cidade tranquila"); agora o
       relógio corre sempre e num dia vazio o único bonde da rua é o que
       o jogador mandar sair. */
    const R = TO.ruas.montar(e, mo);
    /* ELES MARCARAM ESTE DIA PRA VIR, e quem avisa é o feed. Aqui a cena
       abria sozinha ao pintar o mapa; agora ela chega como mensagem de
       convocação — "Invadiram nosso bar!" — e é o botão dela que desce
       pra lá. Abrir a briga por baixo do jogador ao entrar numa tela é
       exatamente o que a virada tirou do jogo. */
    const barraRua = el('div',{class:'rua-barra'});
    /* a faixa de ícones do mapa: montada aqui, pendurada no palco */
    const iconesMapa = el('div',{class:'mapa-icones'});
    {
      const jogos = TO.ruas.jogosDaPraca(e).filter(x=>x.dia === e.data.dia);
      const andando = R.bondes.filter(b=>!b.chegou).length;
      const falta = Math.max(0, (R.apito||0) - R.minuto);
      const hhmm = m => `${Math.floor(m/60)}h${String(Math.round(m%60)).padStart(2,'0')}`;
      const meu = TO.ruas.nossoBonde(e);
      const nossos = TO.ruas.nossosNaRua(e);
      /* guardado pra o laço do relógio poder escrever nele sem
         remontar a página inteira — ver `pintarRelogioDaRua` */
      noRelogioRua = el('div',{class:'rua-relogio', html:
        `<b>${TO.ruas.relogio(R.minuto, e)}</b><small>${
          !jogos.length ? (falta > 0 ? `${hhmm(falta)} de rua` : 'anoiteceu')
          : falta > 0 ? `${hhmm(falta)} pro apito` : 'bola rolando'}</small>`});
      /* o relógio não entra mais na barra: ele é HUD do mapa, no canto de
         cima à esquerda, e vai pro palco lá embaixo. A REFERÊNCIA é a
         mesma, então `pintarRelogioDaRua` continua escrevendo nele a cada
         quadro sem passar por `redesenhar()` — mudar de lugar na tela não
         pode devolver o relógio congelado que o item G.4 consertou. */
      /* a cidade em volta, que existe com jogo e sem: quem está na rua
         a pé agora, e o assalto em curso, se houver */
      const naRuaAgora = (R.andarilhos||[])
        .filter(a=>!a.chegou && R.minuto >= a.saiEm).length;
      const roubo = (R.recados||[]).find(r=>r.aberto && !r.fechado);
      const vida = `${naRuaAgora} a pé na rua`
        + (R.brigasDeRua ? ` · ${R.brigasDeRua} esbarrão${R.brigasDeRua>1?'ões':''}` : '')
        + (roubo ? ` · assalto n${/^[AEIOU]/i.test(roubo.nome)?'':'o '}${roubo.nome}` : '');
      noInfoRua = el('div',{class:'rua-info', html: jogos.length
        ? `<b>${jogos.map(x=>`${x.casa.nome} × ${x.vis.nome}`).join(' · ')}</b>
           <small>${R.bondes.length} bondes na rua · ${andando} ainda a caminho ·
           ${vida}</small>`
        : `<b>${roubo ? 'Assalto em andamento' : 'Dia comum na praça'}</b>
           <small>${meu ? `seu bonde de ${meu.n} está na rua · ` : ''}${vida}</small>`});
      barraRua.appendChild(noInfoRua);

      /* PEGAR O BONDE. Qualquer bonde nosso que esteja na rua serve, e em
         dia de jogo já tem um lá — o disco que está indo pro estádio. Com
         mais de um, o botão passa de um pro outro. */
      let btP = null;
      if(nossos.length){
        const i = nossos.findIndex(b=>b.id === R.selecionado);
        const proximo = nossos[(i + 1) % nossos.length];
        btP = el('button',{class:'bt' + (meu ? ' destaque' : ''),
          texto: !meu ? `Pegar o bonde${nossos.length>1?` (${nossos.length})`:''}`
               : nossos.length > 1 ? `Passar pro próximo (${nossos.length})`
                                   : 'Largar o bonde'});
        btP.title = meu
          ? 'Clique num ponto do mapa pra mandar, ou dirija com WASD.'
          : 'Selecionar pra mandar por clique ou dirigir com WASD.';
        btP.onclick = ()=>{
          R.selecionado = (meu && nossos.length === 1) ? null : proximo.id;
          aviso(R.selecionado
            ? `${proximo.sigla} — clique num ponto do mapa pra mandar, `+
              `ou dirija com WASD.`
            : 'Bonde solto.', 'boa');
          redesenhar();
        };
      }

      /* OS QUATRO CONTROLES VIRARAM ÍCONE, numa faixa colada na borda de
         cima do mapa. Regras que valem pros quatro:
         · o desenho vem de `IC.get`, em vetor, como os do resto do jogo;
         · todo um tem `title`, porque ícone sem rótulo é adivinhação — e
           o title carrega exatamente o que o botão dizia antes, motivo
           de travamento incluído;
         · quem tem estado mostra o estado DE AGORA, não o próximo. */
      const chip = (icone, rot, opc)=>{
        const o = opc || {};
        const b = el('button',{class:'mapa-ic'
          + (o.aceso ? ' aceso' : '') + (o.alerta ? ' alerta' : '')});
        if(o.texto) b.innerHTML = `<span class="rot">${o.texto}</span>`;
        else b.innerHTML = IC.get(icone);
        b.title = rot;
        b.setAttribute('aria-label', rot);
        if(o.travado) b.disabled = true;
        if(o.aoClicar) b.onclick = o.aoClicar;
        return b;
      };

      /* SAIR DA SEDE. Custa uma ação da semana, e quando não dá o ícone
         diz por quê no title — antes o motivo ia no próprio rótulo do
         botão, e sem rótulo é o title que tem de carregá-lo. */
      let icS;
      if(TO.ruas.bondeComandado(e)){
        icS = chip('saida', 'Bonde já está na rua — um bonde comandado por vez.',
                   {travado:true});
      } else {
        const rest = TO.acoes.restantes(e);
        const aptos = TO.membros.aptosParaOEstadio(e).length;
        const porque = rest <= 0 ? 'Não sobrou ação esta semana'
                     : aptos < TO.acoes.MINIMO_SAIDA
                       ? `Gente apta de menos (${aptos} de ${TO.acoes.MINIMO_SAIDA})`
                       : null;
        icS = chip('saida', porque ? `Sair da sede — ${porque.toLowerCase()}`
                                   : 'Sair da sede — gasta uma ação da semana',
          {travado: !!porque, aoClicar: ()=>abrirSaidaDaSede(e, mo)});
      }

      /* dá pra rodar o dia enquanto ele não acabou, com bonde ou sem:
         num dia comum o que anda é a cidade — os andarilhos, a viatura,
         o assalto do calendário */
      const acabou = !R.encontro && R.minuto >= (R.apito || 0);
      const icR = chip(R.encontro ? 'raio' : R.rodando ? 'pausa' : 'play',
        R.encontro ? 'Confronto! — abrir a briga'
        : acabou   ? 'O dia acabou'
        : R.rodando ? 'Pausar o dia' : 'Rodar o dia',
        {alerta: !!R.encontro, travado: acabou, aoClicar: ()=>{
          if(R.encontro){ abrirConfronto(e, R.encontro); return; }
          R.rodando = !R.rodando;
          redesenhar();
          if(R.rodando) rodarRelogio();
        }});

      /* o mesmo 1×/2× da cena: uma velocidade só pro jogo inteiro, pra
         não ter que reescolher a cada tela. Este escreve o número em vez
         de desenhar: velocidade não tem ícone que se leia sem legenda. */
      const vel = TO.diaJogo.ponte.velocidade;
      const icV = chip(null, `Velocidade do relógio — agora em ${vel}×`,
        {texto: vel + '×', aceso: vel > 1,
         aoClicar: ()=>{ TO.diaJogo.ponte.alternarVelocidade(); redesenhar(); }});

      const icO = chip('olho',
        R.olheiro ? 'Tirar o olheiro'
        : poeOlheiro ? 'Clique num ponto do mapa pra pôr o olheiro'
        : 'Pôr olheiro',
        {aceso: !!R.olheiro || poeOlheiro, aoClicar: ()=>{
          if(R.olheiro){ TO.ruas.porOlheiro(e, null); poeOlheiro = false; }
          else poeOlheiro = !poeOlheiro;
          redesenhar();
        }});

      iconesMapa.append(icR, icV, icO, icS);
      if(btP) barraRua.appendChild(btP);
    }
    q.corpo.appendChild(barraRua);

    /* --- superfície --- */
    const LADO = mo.tam;
    /* O ZOOM PADRÃO ENCHE O VISOR. Eram 760px fixos, de quando o mapa
       era um cartão no meio de uma página; agora ele é a tela, e abrir
       com fundo vazio em volta da planta seria a tela do jogo com moldura
       de nada. Pega a maior das duas dimensões pra não sobrar borda. */
    if(zoomMapa == null){
      const alvo = Math.max(innerWidth - 40, innerHeight - 120, 620);
      zoomMapa = Math.max(0.4, Math.min(2, Math.round((alvo / LADO) * 20) / 20));
    }
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

    /* "Baixar planta (PNG)" saiu da tela do jogador. A função continua:
       `TO.mapa.paraImagem` / `TO.mapa.baixarImagem` é ferramenta de autor
       — foi ela que gerou as `planta-*-2048.png` que viraram base das
       artes —, e dá pra chamar pelo console quando for preciso outra. */

    /* O ZOOM SAIU DE DENTRO DA CASCA e virou HUD junto da data.
       Ele estava preso ao canto da PLANTA, não da tela: com o mapa maior
       que o visor — que agora é o caso normal, porque o mapa é a tela
       inteira — o canto de cima à direita da planta fica fora da vista e
       o zoom ia junto. Continua sendo o mesmo controle, com os mesmos
       botões; mudou de âncora, não de função. */
    casca.append(cv, dica);
    viewport.append(casca);
    /* a esplanada é a do NOSSO jogo: sem bonde nosso na rua, o nosso
       clube não joga nesta praça hoje e não há esplanada pra mostrar */
    if(TO.ruas.nossoJogo(R) != null) viewport.appendChild(miniArredores(e, R));

    /* O PALCO: o mapa é a tela principal, então o que manda nele fica
       POR CIMA dele e não antes dele. O `viewport` continua sendo quem
       rola e quem arrasta; a HUD é irmã dele, presa no palco, então não
       anda junto com o mapa arrastado. */
    const palco = el('div',{class:'mapa-palco'});
    const hud = el('div',{class:'mapa-hud'});
    /* A PILHA DA ESQUERDA: zoom, o recolhível dos pontos e a coluna do
       menu. O relógio saiu daqui — hora e data são a mesma informação em
       duas escalas, e separadas nos dois cantos de cima o olho tinha de
       atravessar a tela pra saber quando está. */
    const canto = el('div',{class:'mapa-canto'});
    canto.appendChild(zoom);

    /* O BLOCO DE QUANDO, no canto de cima à direita: relógio em cima,
       data e dia da semana embaixo, uma moldura só. O nó do relógio é o
       mesmo de sempre, então `pintarRelogioDaRua` continua escrevendo
       nele a cada quadro sem passar por `redesenhar()`.

       O ≫ DE AVANÇAR O DIA SAIU. Ninguém avança dia manualmente: o
       tempo corre sozinho no feed, um dia por segundo, e enquanto o
       mapa está aberto o calendário fica parado de propósito — o que
       anda aqui são os minutos da rua, até o apito. */
    noData = el('div',{class:'mapa-quando'});
    const datas = el('div',{class:'mapa-data', html:
      '<div class="dia">—</div><div class="semana">—</div>'});
    const btVolta = el('button',{class:'mapa-ic', html: IC.get('saida')});
    btVolta.title = 'Voltar pro feed';
    btVolta.setAttribute('aria-label','Voltar pro feed');
    btVolta.onclick = fecharPainel;
    noData.append(noRelogioRua, el('div',{class:'mapa-quando-baixo'}));
    noData.lastChild.append(datas, btVolta);

    /* A FAIXA DE BAIXO: escudo, nome e os três números. */
    noRodape = el('div',{class:'mapa-rodape'});
    /* "Pontos do mapa": o botão fica logo abaixo do relógio e abre a
       lista; escolher um tipo fecha de novo */
    const btF = el('button',{class:'mapa-ic largo'
      + (filtrosAbertos ? ' aceso' : '')});
    btF.innerHTML = IC.get('camadas') + '<span class="rot">Pontos do mapa</span>';
    btF.title = 'Pontos do mapa — escolher o que aparece';
    btF.onclick = ()=>{ filtrosAbertos = !filtrosAbertos; redesenhar(); };
    /* o recolhível abre PRA DIREITA, sobre o mapa: aberto pra baixo ele
       cobriria a coluna do menu, que mora logo abaixo dele */
    const linhaF = el('div',{class:'mapa-linha-filtros'});
    linhaF.append(btF, filtros);
    canto.appendChild(linhaF);
    /* A COLUNA DO MENU, na borda esquerda, embaixo do zoom e do
       recolhível — em qualquer largura, celular incluído. Onze ícones
       empilhados não cabem nos 390px de um celular deitado, então ela
       quebra em duas colunas quando a altura aperta (ver `.mapa-menu`,
       que é `column wrap`): quem manda é a altura disponível, não a
       largura da tela. */
    canto.appendChild(montarMenuIcones('mapa-menu'));
    hud.append(iconesMapa, canto, noData, noRodape);
    palco.append(viewport, hud);
    q.corpo.appendChild(palco);
    pg.appendChild(q);

    /* A HUD SE ENCAIXA NO MAPA VISÍVEL, não no quadro.
       Com zoom baixo a planta é mais estreita que o visor e sobra fundo
       dos dois lados; grudar a HUD no canto do quadro punha o relógio
       "dentro do mapa" boiando no vazio, longe da cidade. O que vale é a
       interseção entre o visor e a planta — que muda com o zoom, com o
       arrasto e com a janela, então é recalculada nos três. */
    const encaixarHud = ()=>{
      if(!palco.isConnected) return;
      const p = palco.getBoundingClientRect(), v = viewport.getBoundingClientRect();
      const c = casca.getBoundingClientRect();
      let l = Math.max(v.left, c.left),   r = Math.min(v.right,  c.right);
      let t = Math.max(v.top,  c.top),    f = Math.min(v.bottom, c.bottom);
      /* e também na tela. No celular deitado o mapa é mais alto que os
         390px e quem rola é a PÁGINA: sem esta conta a faixa de ícones
         sobe junto com o mapa e some atrás do `#topo`, que é grudento.
         Cortando pela janela, a HUD encosta embaixo da barra de cima e
         fica onde a mão alcança enquanto a cidade desliza por trás. */
      const topo = document.getElementById('topo');
      const teto = topo && getComputedStyle(topo).position === 'sticky'
                 ? topo.getBoundingClientRect().bottom : 0;
      /* nunca acima da barra de cima, nunca acima da tela: no celular
         deitado a barra some junto com a página, e sem o zero a faixa de
         ícones sairia da tela com ela. Quando o mapa inteiro passa por
         cima, a altura vira zero e o `overflow:hidden` da HUD some com
         tudo — ícone pendurado num mapa que não está mais ali seria pior
         do que ícone nenhum. */
      t = Math.max(t, teto, 0); f = Math.min(f, innerHeight);
      l = Math.max(l, 0);    r = Math.min(r, innerWidth);
      hud.style.left   = (l - p.left) + 'px';
      hud.style.top    = (t - p.top)  + 'px';
      hud.style.width  = Math.max(0, r - l) + 'px';
      hud.style.height = Math.max(0, f - t) + 'px';
    };
    /* em captura, no documento: quem rola varia com a largura da tela —
       o visor do mapa no desktop, a página no celular deitado — e evento
       de rolagem não sobe sozinho */
    addEventListener('scroll', encaixarHud, {capture:true, passive:true});
    addEventListener('resize', encaixarHud);

    /* a data e a faixa de baixo são escritas depois que a HUD existe:
       `redesenhar` chama `pintarTopo` ANTES de pintar a página, e na
       primeira pintura os nós ainda não estavam no documento */
    pintarTopo();

    /* o canvas só existe depois de entrar no documento */
    requestAnimationFrame(()=>{ ligarMapa(cv, dica, mo); encaixarHud(); });
  }

  /* =======================================================
     O MINIMAPA DOS ARREDORES
     Roda em paralelo ao mapa da cidade: quando um bonde entra
     no quarteirão do estádio ele some de lá e aparece aqui,
     no portão do lado dele. É a antessala da cena de
     arredores — quando o jogador manda entrar, é esta gente
     que vai pro palco.
     ======================================================= */
  function miniArredores(e, R){
    const cx = el('div',{class:'mini-arredores'});
    const dentro = TO.ruas.naEsplanada(R);
    cx.appendChild(el('div',{class:'mini-cab', html:
      `<b>Arredores do estádio</b><small>${dentro.length ?
        `${dentro.length} ${dentro.length===1?'bonde':'bondes'} na esplanada` :
        'ninguém chegou ainda'}</small>`}));

    /* a esplanada em C do GDD §15.1, de cima: o quarteirão do estádio no
       meio e as duas entradas de cada lado do cordão */
    const palco = el('div',{class:'mini-palco'});
    palco.appendChild(el('div',{class:'mini-campo', texto:'ESTÁDIO'}));
    palco.appendChild(el('div',{class:'mini-cordao'}));
    for(const lado of ['mandante','visitante']){
      const faixa = el('div',{class:'mini-lado '+lado});
      const meus = dentro.filter(x=>x.lado === lado);
      for(const x of meus){
        const d = el('i',{class:'mini-disco'+((x.nossa||x.doJogador)?' nosso':'')});
        d.style.background = x.cor;
        d.style.width = d.style.height =
          U.limitar(10 + Math.sqrt(x.n)*1.4, 12, 30) + 'px';
        d.title = `${x.nome} · ${x.n} · chegou ${TO.ruas.relogio(x.entrouEm, e)}`
                + (x.escolta ? ` · ${x.escolta.n} da ${x.escolta.nome} na escolta` : '')
                + (x.doJogador && !x.nossa ? ' · sob o seu comando' : '');
        faixa.appendChild(d);
      }
      if(!meus.length) faixa.appendChild(el('span',{class:'mini-vazio',
        texto: lado === 'mandante' ? 'lado de casa' : 'setor visitante'}));
      palco.appendChild(faixa);
    }
    cx.appendChild(palco);

    /* Bonde nosso na esplanada: dá pra entrar, mesmo com os outros ainda
       na rua. Aliado que a gente escoltou conta como nosso. */
    const nosso = dentro.some(x=>x.nossa || x.doJogador);
    const faltam = (R.bondes||[]).filter(b=>!b.chegou && b.jogo === TO.ruas.nossoJogo(R)).length;
    const jaFoi = (R.arredores||[]).some(a=>a.entrou && (a.nossa || a.doJogador));
    const bt = el('button',{class:'bt'+(nosso?' destaque':''),
      texto: jaFoi ? 'Seu bonde já entrou'
                   : nosso ? (faltam ? `Entrar nos arredores (${faltam} ainda vindo)`
                                     : 'Entrar nos arredores')
                           : 'Seu bonde ainda está na rua'});
    bt.disabled = !nosso;
    bt.onclick = ()=>irParaOsArredores(e, R);
    cx.appendChild(bt);
    return cx;
  }

  /* Da esplanada em miniatura pro palco: quem está no minimapa é quem
     entra na cena, com o efetivo que sobrou da caminhada.

     Basta o NOSSO bonde estar lá. Se três de seis chegaram e um é o
     nosso, a briga é com esses três — os outros ainda estão na rua e é
     assim que funciona: quem chega primeiro é quem está lá quando
     estoura. Ao voltar da cena o relógio da rua continua de onde parou. */
  function irParaOsArredores(e, R){
    const naCena = TO.ruas.naEsplanada(R);
    const dentro = naCena.filter(x=>x.doJogador || x.nossa);
    const meu = dentro.reduce((s,x)=>s+x.n, 0) || 1;
    const aptos = TO.membros.aptosParaOEstadio(e)
      .sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa))
      .slice(0, U.limitar(meu, 2, 34));
    if(aptos.length < 2){ aviso('Não sobrou gente de pé pra entrar.','ruim'); return; }
    R.rodando = false;
    $('telaDiaJogo').classList.remove('oculto');
    document.body.classList.add('em-cena');
    TO.estado.bloquear(true);
    pararTudo('cena');
    const p = TO.planejamento.plano(e);
    /* quem chegou na esplanada entra na cena com o efetivo que sobrou da
       caminhada e a cor da própria torcida. `nossa` aqui é "o jogador
       comanda": o aliado que a gente escoltou anda com a gente. */
    const bondes = naCena.map(x=>({lado:x.lado, n:x.n, cor:x.cor, cor2:x.cor2,
                                   sigla:x.sigla,
                                   nome:x.nome, nossa: !!(x.nossa || x.doJogador)}));
    /* quem desce pro palco já não volta pro minimapa */
    TO.ruas.marcarQueEntraram(R, naCena);
    TO.diaJogo.ponte.montar({
      canvas: $('djPrincipal'),
      config: { escalacao: aptos, intencao: p.intencao, bombas: p.bombas,
                tensao: tensaoDaNoite(), bondes },
      /* O RELÓGIO DA RUA NÃO PARA PORQUE A BRIGA COMEÇOU. Os bondes que
         ainda estavam andando continuam a viagem, e quem chega na
         esplanada com o tumulto em curso entra nele. Dois minutos de rua
         por segundo de tela, a mesma velocidade do mapa. */
      aCadaQuadro: (dt)=>{
        const mo = mapaAtual || TO.mapa.modelo(e);
        TO.ruas.passo(e, mo, dt*2);
        const novos = TO.ruas.naEsplanada(R);
        if(!novos.length) return [];
        TO.ruas.marcarQueEntraram(R, novos);
        return novos.map(x=>({lado:x.lado, n:x.n, cor:x.cor, cor2:x.cor2,
                              sigla:x.sigla,
                              nome:x.nome, nossa: !!(x.nossa || x.doJogador)}));
      },
      aoTerminar: fecharDiaDeJogo
    });
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
    /* `pointerup` e não `click`: no celular o toque tem de valer, e o
       pointer serve mouse e dedo pelo mesmo caminho. `ponto()` já
       converte pelo tamanho medido do canvas, então o zoom não mexe. */
    cv.onclick = null;
    cv.addEventListener('pointerup', ev=>{
      const p = ponto(ev);
      if(poeOlheiro){
        TO.ruas.porOlheiro(E(), p.x, p.y);
        poeOlheiro = false;
        aviso('Olheiro no ponto. Ele enxerga o que passa em volta.','boa');
        redesenhar();
        return;
      }
      /* O BONDE NOSSO: clicar em cima dele seleciona; com ele
         selecionado, o clique seguinte é a ordem de destino. Vale pra
         QUALQUER bonde nosso que esteja na rua, não só pro que saiu por
         ordem — em dia de jogo é o disco que já está andando pro estádio
         que o jogador quer pegar. Fora disso o clique continua sendo o
         que sempre foi: informação do que está debaixo do dedo. */
      const R = TO.ruas.estado(E());
      const nossos = TO.ruas.nossosNaRua(E());
      let perto = null, md = 18*18;
      for(const b of nossos){
        const q = (b.x-p.x)*(b.x-p.x) + (b.y-p.y)*(b.y-p.y);
        if(q <= md){ md = q; perto = b; }
      }
      if(perto){
        R.selecionado = R.selecionado === perto.id ? null : perto.id;
        aviso(R.selecionado
          ? `${perto.sigla} selecionado — clique no destino ou dirija com WASD.`
          : 'Bonde solto.', 'boa');
        redesenhar();
        return;
      }
      const meu = TO.ruas.nossoBonde(E());
      if(meu && R.selecionado === meu.id){
        const r = TO.ruas.mandarPara(E(), mo, p.x, p.y);
        aviso(r.msg, r.ok ? 'boa' : 'ruim');
        if(r.ok && !R.rodando){ R.rodando = true; rodarRelogio(); }
        redesenhar();
        return;
      }
      const a = MP.alvoEm(mo, p.x, p.y);
      if(a) aviso(a.info);
    });

    /* WASD dirige o bonde selecionado, em qualquer largura */
    ligarSetasDoMapa(cv);
  }

  /* =======================================================
     TIRAR O BONDE DA SEDE

     Quantos vão sai de `aptosParaOEstadio` — os que não estão feridos
     nem presos —, com o jogador escolhendo o número, como na escalação.
     O plano da semana não serve aqui: ele diz o efetivo do DIA DE JOGO,
     e este bonde existe em qualquer dia.
     ======================================================= */
  function abrirSaidaDaSede(e, mo){
    const aptos = TO.membros.aptosParaOEstadio(e).length;
    const teto = Math.max(TO.acoes.MINIMO_SAIDA, aptos);
    let quantos = U.limitar(Math.round(aptos*0.5), TO.acoes.MINIMO_SAIDA, teto);
    let fechar = null;
    const corpo = el('div');
    const conta = el('div',{class:'valorao'});
    const faixa = el('input',{type:'range'});
    faixa.min = TO.acoes.MINIMO_SAIDA; faixa.max = teto; faixa.value = quantos;
    faixa.style.width = '100%';
    const pintar = ()=>{ conta.innerHTML =
      `<span>Vão sair</span><b>${quantos} de ${aptos}</b>`; };
    faixa.oninput = ()=>{ quantos = +faixa.value; pintar(); };
    pintar();
    corpo.append(conta, faixa);
    corpo.appendChild(el('div',{class:'linha-dado', html:
      '<span class="fraco">Gasta uma ação da semana. O bonde nasce no pino '+
      'da sua sede; depois é só clicar num ponto do mapa pra mandar — pino '+
      'de rival é investida, rua qualquer é tocaia.</span>'}));
    const ir = el('button',{class:'bt destaque larga', texto:'Pra rua'});
    ir.onclick = ()=>{
      const g = TO.acoes.gastarAcao(e, 'atacar', 'Bonde na rua, fora de jogo.');
      if(!g.ok){ aviso(g.msg, 'ruim'); return; }
      const r = TO.ruas.sairDaSede(e, mo, quantos);
      if(!r.ok){
        /* não saiu: devolve a ação, senão o jogador paga por nada */
        e.acoes.usadas = Math.max(0, (e.acoes.usadas||1) - 1);
        aviso(r.msg, 'ruim'); return;
      }
      TO.estado.anotar(e, `${quantos} saíram da sede pra rua.`, 'neutro');
      aviso(r.msg, 'boa');
      fechar && fechar();
      redesenhar();
    };
    corpo.appendChild(ir);
    fechar = modal('Tirar o bonde da sede', `${aptos} aptos`, corpo);
  }

  /* =======================================================
     DIRIGIR O BONDE COM WASD

     Antes estas teclas arrastavam a vista, e só no celular. Agora elas
     dirigem o bonde selecionado, em qualquer largura — a vista continua
     no arrasto e na pinça, que já funcionam e não precisam de tecla.
     Sem bonde selecionado, WASD não faz nada: duas funções na mesma
     tecla, decididas por um estado invisível, é o tipo de coisa que
     parece bug.
     ======================================================= */
  /* O PAD DO MAPA: só a cruz.
     É o mesmo pad da cena de luta — mesmas classes, mesmo CSS, mesmo
     jeito de segurar a tecla —, sem Q, E, R nem as formações: aquilo é
     comando de briga e não significa nada no mapa, e botão que não faz
     nada ensina o jogador a desconfiar dos botões. */
  let padDoMapa = null;
  function montarPadDoMapa(){
    const e = E();
    const R = e && TO.ruas.estado(e);
    const b = e && TO.ruas.nossoBonde(e);
    /* `em-cena` é a trava que faltava: a briga abre por cima do mapa e
       `pagina` continua sendo 'mapa', então o pad do mapa ficava na tela
       DURANTE a luta — dois pads fixos no mesmo canto, e a cruz de cima
       era a do mapa. Quem tocasse W ali estava mandando num bonde que
       nem está mais na rua, e o disco da cena não saía do lugar. */
    const querem = estreito() && painel === 'mapa' &&
                   !document.body.classList.contains('em-cena') &&
                   b && R && R.selecionado === b.id;
    if(!querem){
      if(padDoMapa){ padDoMapa.remove(); padDoMapa = null; }
      document.body.classList.remove('com-pad');
      for(const k of ['w','a','s','d']) teclasDoMapa[k] = false;
      return;
    }
    /* a cruz de WASD é fixa no canto de baixo e ocupa 160×142: quem
       mora lá embaixo — o ☰ e a faixa da torcida — precisa saber que
       ela está na tela */
    document.body.classList.add('com-pad');
    if(padDoMapa) return;
    const caixa = el('div',{class:'dj-pad'});
    caixa.id = 'mapaPad';
    const lado = el('div',{class:'pad-lado pad-esq'});
    const cruz = el('div',{class:'pad-cruz'});
    for(const k of ['w','a','s','d']){
      const bt = el('button',{class:`pad-bt pad-mov pad-${k}`, texto:k.toUpperCase()});
      bt.addEventListener('pointerdown', ev=>{
        ev.preventDefault();
        try{ bt.setPointerCapture(ev.pointerId); }catch(_){}
        bt.classList.add('apertado'); teclasDoMapa[k] = true;
      });
      const solta = ev=>{ if(ev) ev.preventDefault();
                          bt.classList.remove('apertado'); teclasDoMapa[k] = false; };
      bt.addEventListener('pointerup', solta);
      bt.addEventListener('pointercancel', solta);
      bt.addEventListener('lostpointercapture', solta);
      bt.addEventListener('contextmenu', ev=>ev.preventDefault());
      cruz.appendChild(bt);
    }
    lado.appendChild(cruz);
    caixa.append(lado, el('div',{class:'pad-lado pad-dir'}));
    document.body.appendChild(caixa);
    padDoMapa = caixa;
  }

  let setasDoMapa = null;
  const teclasDoMapa = {};
  const DIRIGINDO_ACELERA = 4;   // o dia corre 4× enquanto se dirige
  function ligarSetasDoMapa(cv){
    if(setasDoMapa) return;
    addEventListener('keydown', ev=>{
      const k = ev.key.toLowerCase();
      if('wasd'.includes(k) && pagina==='mapa' && !painel) teclasDoMapa[k]=true;
    });
    addEventListener('keyup', ev=>{ teclasDoMapa[ev.key.toLowerCase()]=false; });
    let ant = 0;
    const passo = agora=>{
      const dt = ant ? Math.min(0.05,(agora-ant)/1000) : 0; ant = agora;
      const e = E();
      const R = e && TO.ruas.estado(e);
      const b = e && TO.ruas.nossoBonde(e);
      /* e nada disto roda com a briga na tela: ali WASD é do líder da
         cena, e adiantar o relógio da rua por baixo de uma luta aberta
         é mexer no mundo pelas costas do jogador */
      const naCena = document.body.classList.contains('em-cena');
      if(dt && e && R && b && !naCena &&
         R.selecionado === b.id && !R.encontro && mapaAtual){
        const dx = (teclasDoMapa.d?1:0) - (teclasDoMapa.a?1:0);
        const dy = (teclasDoMapa.s?1:0) - (teclasDoMapa.w?1:0);
        if(dx || dy){
          /* SEGURAR A TECLA É ADIANTAR O DIA COM O DEDO.

             O relógio normal anda dois minutos de rua por segundo de
             tela, e um bonde faz 6 px por minuto de rua: 12 px por
             segundo numa praça de 1.254 px de lado. Dirigir nesse passo
             era segurar W por um minuto e meio pra atravessar a cidade —
             quem testou disse, com razão, que não funcionava.

             Dirigindo, o dia corre quatro vezes mais rápido: 8 minutos
             por segundo, 48 px por segundo, a praça inteira em meio
             minuto. E corre pra TODO MUNDO — os outros bondes andam
             junto e o relógio queima igual. Não é atalho: é o preço de
             atravessar a cidade no dedo em vez de deixar o dia andar. */
          const passoDoDia = dt * 2 * DIRIGINDO_ACELERA;
          TO.ruas.dirigir(e, mapaAtual, dx, dy, passoDoDia);
          if(!R.rodando) TO.ruas.passo(e, mapaAtual, passoDoDia);
          if(canvasMapa){
            TO.mapa.desenhar(mapaAtual, canvasMapa);
            TO.ruas.desenhar(e, mapaAtual, canvasMapa.getContext('2d'));
          }
          if(R.encontro){ redesenhar(); }
        } else if(b.dirigindo){
          /* soltou as teclas: ele para onde estiver */
          b.dirigindo = false;
        }
      }
      setasDoMapa = requestAnimationFrame(passo);
    };
    setasDoMapa = requestAnimationFrame(passo);
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
    document.body.classList.add('em-cena');
    TO.estado.bloquear(true);
    pararTudo('cena');
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
    /* A RUA NASCE COM O EFETIVO QUE O MAPA DIZ, não com o tamanho da
       escalação. Sem `bondes` no config, o mandante com escalação caía
       no ramo de `base = 0` e o nosso lado nascia com 34 discos — o
       corte da escalação — enquanto `efetivoRival` passava inteiro: um
       bonde nosso de 80 abria a cena em 34 contra 60. O caminho certo é
       o mesmo da esplanada: passar os dois bondes com o `n` de verdade.

       O 34 continua, com o sentido que sempre teve: são os que têm
       FICHA — nome, força, defesa e consequência de ferido ou preso
       depois da briga. O resto é povão sem ficha. */
    const aptos = TO.membros.aptosParaOEstadio(e)
      .sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa))
      .slice(0, U.limitar(nosso.n, 2, 34));
    const bondes = [
      {lado:'mandante',  n:nosso.n, cor:nosso.cor, cor2:nosso.cor2,
       sigla:nosso.sigla, nome:nosso.nome,  nossa:true},
      {lado:'visitante', n:deles.n, cor:deles.cor, cor2:deles.cor2,
       sigla:deles.sigla, nome:deles.nome,  nossa:false}
    ];
    encontroAberto = enc;
    $('telaDiaJogo').classList.remove('oculto');
    document.body.classList.add('em-cena');
    TO.estado.bloquear(true);
    pararTudo('cena');
    const p = TO.planejamento.plano(e);
    TO.diaJogo.ponte.montar({
      canvas: $('djPrincipal'),
      config: { escalacao: aptos, intencao:'atacar', bombas: p.bombas,
                bondes, efetivoRival: deles.n, local: enc.local },
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
      if(res.prestigio < 0){
        TO.torcedores.perderMaterial(e, 1, 2);
        /* e de vez em quando some o que estava na mão de alguém: é o que
           faz a loja de material continuar sendo decisão depois de comprada */
        if(TO.patrimonio && U.rng() < 0.25){
          const p = TO.patrimonio.perderItem(e);
          if(p) TO.estado.anotar(e, `${p.rot} ficou na rua — levaram.`, 'ruim');
        }
      }
      TO.ruas.resolver(e);
      encontroAberto = null;
    }
    /* investida, assalto e cobrança no CT: o que a noite deu vira caixa,
       tensão e cadeia aqui, e não dentro da cena */
    const fecho = acao ? TO.acoes.fecharCena(e, acao, res) : null;
    /* fechada a briga, o dia volta a correr: o encontro foi resolvido e
       `retomarDia` religa `R.rodando`, que a cena tinha desligado */
    soltarTudo('cena');
    setTimeout(()=>{
      $('telaDiaJogo').classList.add('oculto');
      document.body.classList.remove('em-cena');
      mostrarRelatorio(res, resumo, fecho);
    }, 1400);
  }

  /* =======================================================
     AÇÃO QUE VIRA CENA (GDD §4.1)
     Atacar bar ou sede, assaltar comércio e pressionar o clube
     abrem a mesma tela do dia de jogo, num cenário próprio.
     ======================================================= */
  function abrirAcaoEmCena(cena, efetivo){
    const e = E();
    const fila = TO.membros.aptosParaOEstadio(e)
      .sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa));
    /* QUANTOS VÃO — a mesma correção da briga de rua, aqui também.
       Assalto é serviço de meia dúzia e continua sendo doze. Investida
       é a turma que estiver de pé, ou o bonde que o mapa mandou. O 34
       segue valendo pra FICHA: nome, força, defesa e consequência de
       ferido ou preso depois. O resto é povão. */
    const n = cena.acao === 'assalto'
      ? Math.max(2, Math.min(12, fila.length))
      : Math.max(2, Math.round(efetivo || fila.length));
    const aptos = fila.slice(0, Math.min(n, cena.acao === 'assalto' ? 12 : 34));
    /* só o NOSSO lado vem como bonde: quem defende continua se
       espalhando pelos pontos que a cena declarou — no bar são a porta e
       o fundo do salão, e juntar os dois num canto só mudaria a planta
       da cena, não o efetivo dela */
    /* a cena de ação também é a nossa torcida na tela: as duas cores dela
       vêm do mesmo lugar que as do mapa */
    const cores = TO.mundo.coresDaTorcida(e.torcida);
    const bondes = [{lado:'mandante', n, nossa:true, nome:e.torcida.nome,
                     cor: cores.cor, cor2: cores.cor2,
                     sigla: TO.mundo.siglaTorcida(e.torcida)}];
    $('telaDiaJogo').classList.remove('oculto');
    document.body.classList.add('em-cena');
    TO.estado.bloquear(true);
    pararTudo('cena');
    const p = TO.planejamento.plano(e);
    TO.diaJogo.ponte.montar({
      canvas: $('djPrincipal'),
      config: { escalacao: aptos, intencao:'atacar', bondes,
                /* assalto não é briga anunciada: ninguém leva bomba */
                bombas: cena.acao === 'assalto' ? 0 : p.bombas,
                efetivoRival: cena.efetivoRival, local: cena.cena },
      aoTerminar: res => fecharDiaDeJogo(res, null, cena)
    });
  }

  /* =======================================================
     ELES VIERAM PRA CIMA DO NOSSO BAR

     A cena é a MESMA do ataque ao bar deles, com os papéis trocados.
     Lá a gente desce a transversal e eles nascem no salão, de guarda,
     com o balcão como objetivo nosso e o gatilho na calçada da frente.
     Aqui basta dizer que o bonde NOSSO é o do lado `visitante` — o dos
     spawns com `guarda:true`, dentro do salão — e o deles é o do lado
     `mandante`, que desce a rua. O comportamento de guarda, o despertar
     por zona e a linha de visão pela porta já estão prontos: não há
     cenário novo, há papel trocado.

     Quem cobra é o fecho da cena, uma vez só: `ataquesContraNos` já não
     lançou dinheiro nem feriu ninguém para o alvo que tem cena. */
  function abrirAtaqueAoBar(atq){
    const e = E();
    const o = TO.mundo.torcida(atq.torcida);
    /* O EFETIVO É O REAL DE CADA LADO, E ELES SÃO DIFERENTES.
       Aqui estava o bug que já foi consertado uma vez na briga de rua e
       tinha voltado por esta porta: `Math.min(aptos.length, ...)`
       amarrava o nosso bonde ao tamanho da ESCALAÇÃO, que é cortada em
       34 porque 34 é quanta gente tem FICHA — nome, força, defesa e
       consequência depois. Com 250 membros a cena abria 34 contra 18
       quando o certo eram 62 contra 18.

       Escalação e efetivo são duas coisas: `escalacao` é quem tem ficha,
       `bondes[].n` é quanta gente está lá. Nada é reequilibrado na
       abertura: se eles vieram com mais, a cena começa com mais deles. */
    const fila = TO.membros.aptosParaOEstadio(e)
      .sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa));
    const aptos = fila.slice(0, 34);
    const nossos = Math.max(2, Math.round(fila.length * 0.25));
    const deles = Math.max(4, Math.round(((o && o.membros) || 40) * 0.30));
    const c1 = TO.mundo.coresDaTorcida(e.torcida);
    const c2 = TO.mundo.coresDaTorcida(o || {});
    const bondes = [
      /* nós somos os donos da casa: lado `visitante` é o do salão */
      {lado:'visitante', n:nossos, nossa:true, nome:e.torcida.nome,
       cor:c1.cor, cor2:c1.cor2, sigla:TO.mundo.siglaTorcida(e.torcida)},
      {lado:'mandante',  n:deles, nossa:false, nome:(o&&o.nome)||'Rival',
       cor:c2.cor, cor2:c2.cor2, sigla:o?TO.mundo.siglaTorcida(o):'RIV'}
    ];
    atq.resolvido = true;
    aviso(`${(o&&o.nome)||'Eles'} pararam na porta do nosso bar.`, 'ruim');
    $('telaDiaJogo').classList.remove('oculto');
    document.body.classList.add('em-cena');
    TO.estado.bloquear(true);
    pararTudo('cena');
    const p = TO.planejamento.plano(e);
    TO.diaJogo.ponte.montar({
      canvas: $('djPrincipal'),
      config: { escalacao: aptos, intencao:'atacar', paz:false, bombas:p.bombas,
                efetivoRival: deles, local:'bar', bondes },
      aoTerminar: res => fecharDiaDeJogo(res, null,
        {acao:'defender', alvo:{tipo:'bar', torcidaId:atq.torcida,
                                nome:(o&&o.nome)||'Rival',
                                efetivo:(o&&o.membros)||40}})
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
    /* `res.ganhamos` já vem do ponto de vista do jogador; `venceu` é do
       mandante, e nas cenas em que a gente defende os dois se opõem */
    const ganhou = fecho ? !!fecho.ganhou
                 : (res.ganhamos !== undefined ? !!res.ganhamos : !!res.venceu);
    /* ELES CORRERAM vem antes de tudo, inclusive do título da ação —
       "ATAQUE BEM-SUCEDIDO" com zero ferido dos dois lados era a tela
       gritando uma coisa e o número dizendo outra. E o tom é neutro de
       propósito: não é vitória, porque não houve briga; não é derrota,
       porque quem virou as costas foram eles. */
    const correu = !!res.correram;
    const titulo = correu ? 'ELES CORRERAM'
                 : (fecho && fecho.titulo) ||
                   (res.tranquila ? 'NOITE TRANQUILA'
                                  : ganhou ? 'SAÍMOS POR CIMA' : 'SAÍMOS POR BAIXO');
    const armas = (res.armas && res.armas.mandante) || {pedra:0, bomba:0};
    const dinheiro = (fecho && fecho.dinheiro) || 0;
    const ef = res.efetivo || {};
    const dado = (rot, val, cor)=>
      `<div class="dado-cena"><span>${rot}</span>`+
      `<b${cor?` class="${cor}"`:''}>${val}</b></div>`;
    return el('div', {class:`cartaz-cena ${correu?'neutra':ganhou?'boa':'ruim'}`, html:
      `<h3>${titulo}</h3><div class="dados-cena">`+
        dado('Feridos deles', res.caidosVisitante, res.caidosVisitante?'positivo':'')+
        dado('Feridos nossos', res.caidosMandante, res.caidosMandante?'negativo':'')+
        /* numa fuga limpa os feridos são zero dos dois lados, e zero ali
           é informação: ninguém encostou em ninguém. O que falta saber é
           de que tamanho eram os dois bondes e quantos escaparam. */
        (correu
          ? dado('Eram deles', ef.visitante||0)+
            dado('Éramos nós', ef.mandante||0)+
            dado('Escaparam', (res.sumiram||{}).visitante||0)
          : dado('Armas empregadas',
                 `${armas.pedra||0} pedras · ${armas.bomba||0} bombas`)+
            dado('Dinheiro da operação', dinheiro ? U.dinheiro(dinheiro) : '—',
                 dinheiro ? 'positivo' : ''))+
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
    /* A FILA DE AVISOS SAIU DAQUI. `redesenhar` drenava `E.avisos` em
       torradinhas de quatro segundos — era assim que o jogador ficava
       sabendo do que tinha acontecido sozinho. Agora tudo isso é
       mensagem do feed, que fica na tela até ele rolar pra longe dela.
       O `aviso()` continua vivo pra retorno imediato de clique — "Salvo",
       "Bonde solto" —, que é conversa da interface, não do mundo. */
    pintarTopo();
    trocarPagina();
    pintarPagina(pagina);
    if(painel) pintarPagina(painel);
    montarAtalhos();
    montarPadDoMapa();
  }

  /* =======================================================
     LIGAÇÃO
     ======================================================= */
  /* =======================================================
     O DIA DA RUA, SEM TELA

     SIMULAR É O PADRÃO, NÃO O ATALHO. O relógio do tempo roda a rua
     inteira de todo dia — `TO.ruas.montar` e `TO.ruas.passo` do
     primeiro minuto ao apito —, que é o mesmo caminho do dia assistido
     no mapa: andarilho anda, assalto do calendário abre e fecha,
     viatura sai, consequência entra na ficha. O que muda é só que não
     há quadro pra desenhar.

     O PASSO É O MESMO DE ASSISTIR, e isso é decisão medida. Um quadro a
     60 fps empurra `dt*2` = 1/30 de minuto de rua; sem tela, o passo é
     o mesmo número. Com passo maior o resultado AGREGADO continua igual
     — 30 dias de rua cheia dão as mesmas 12 baixas e o mesmo caixa com
     0,1, 0,25 ou 0,5 —, mas a IDENTIDADE de alguns encontros muda: quem
     esbarra em quem é testado nos instantes amostrados, e amostrar
     menos troca um par por outro. Custa 49 ms por dia em vez de 25 e
     compra igualdade exata.
     ======================================================= */
  const PASSO_RUA = 1/30;       // minutos de rua por tique, sem tela

  /* devolve o ENCONTRO, quando houver: é ele que vira convocação */
  function simularDiaDaRua(e){
    const mo = mapaAtual || TO.mapa.modelo(e);
    const R = TO.ruas.montar(e, mo);
    const fim = R.apito || 0;
    let guarda = 0;
    while(R.minuto < fim && guarda++ < 6000){
      TO.ruas.passo(e, mo, PASSO_RUA);
      if(R.encontro) return R.encontro;
    }
    return null;
  }

  /* O ESTADO MUDOU.
     Durante o laço do tempo a tela não é remontada: escrever o
     cabeçalho e acrescentar as mensagens novas basta, e remontar a
     lista inteira uma vez por segundo faria a rolagem saltar embaixo do
     dedo de quem está lendo o que passou. */
  TO.estado.aoMudar(()=>{
    if(!E()) return;
    if(relogioTempo){ pintarTopo(); atualizarFeed(); return; }
    redesenhar();
  });

  /* ABA SEM FOCO É PAUSA EXPLÍCITA.
     O `requestAnimationFrame` congela sozinho quando a aba perde o
     foco, e o primeiro quadro na volta traz o tempo todo que passou
     fora — o relógio saltaria. Tratando como pausa, o `ultimo` do laço
     é zerado na volta e nenhum minuto é cobrado do tempo em outra aba. */
  const pararTudo  = m => { pausarDia(m);  pausarTempo(m); };
  const soltarTudo = m => { retomarDia(m); retomarTempo(m); };
  addEventListener('blur', ()=>pararTudo('foco'));
  addEventListener('focus', ()=>soltarTudo('foco'));
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden) pararTudo('foco'); else soltarTudo('foco');
  });
  /* O FECHAMENTO DA SEMANA, COM O RELATÓRIO OPCIONAL.
     Antes as três coisas moravam na mesma linha: abrir o modal, salvar e
     nada mais. Agora elas se separam, porque só uma delas é opcional.

     · SALVAR é sempre. O autosave estava pendurado no mesmo `;` do
       `abrirFechamento`, e desligar o modal teria desligado o save
       junto — o jeito mais silencioso de perder uma temporada.
     · O RESUMO vai pro feed, e só quando tem o que dizer.
     · O MODAL é a chave. Fica desligado por padrão — mas semana no
       vermelho ou com gente saindo abre de qualquer jeito, porque é aí
       que a torcida começa a se desfazer e descobrir isso trinta dias
       depois não é conforto, é perda. */
  TO.estado.aoFecharSemana((rel, e)=>{
    e = e || E();
    TO.estado.salvar();
    /* o mundo lá fora escreve a semana dele aqui: rodada, briga alheia,
       marco. É o pulso da categoria 5, espalhado pelos sete dias. */
    TO.feed.fecharSemana(e, rel);
    const saiu = (rel.saidas || []).length;
    /* O RESUMO SEMANAL SÓ FALA QUANDO TEM O QUE DIZER. Uma linha por
       semana contando que sobrou dinheiro é a definição de barulho de
       fundo — o saldo já está escrito na barra do feed o tempo todo.
       Semana com gente saindo é outra coisa: isso é a torcida se
       desfazendo, e tem de aparecer. */
    /* A DEBANDADA É RESULTADO, NÃO CONVERSA DE DIRETOR. Ela chegou a
       sair como categoria 6 com o assunto `caixa`, o mesmo do alarme —
       e aí a linha informativa consumia a carência de duas semanas do
       assunto e a DECISÃO que avisa antes da debandada nunca saía. O
       aviso é interna; o pessoal indo embora é o que aconteceu. */
    if(saiu) TO.estado.anotar(e,
      `${saiu} ${saiu===1?'saiu':'saíram'} da torcida essa semana. `+
      `Caixa em ${U.dinheiro(e.dinheiro)}.`, 'ruim',
      {cat:4, efeitos:[{ind:'membros', delta:-saiu, dono:'nosso'}]});
    const grave = rel.saldo < 0 || e.dinheiro < 0 || saiu > 0;
    if(opc(e).relatorio || grave) abrirFechamento(rel);
  });
  $('btSelecionarTorcida').onclick = ()=>{
    if(!escolhida) return;
    TO.estado.novo({torcida: escolhida});
    entrarNoJogo(true);
  };
  $('btVoltarMenu').onclick = ()=>{
    $('telaSelecao').classList.add('oculto');
    $('telaMenu').classList.remove('oculto');
  };
  $('btConfirmarEscalacao').onclick = comecarDiaDeJogo;
  $('btCancelarEscalacao').onclick = ()=>$('telaEscalacao').classList.add('oculto');
  /* O RELATÓRIO DA NOITE não avança mais o dia: quem avança o dia é o
     relógio do tempo, e ninguém avança dia manualmente. Fechar a tela
     devolve o feed e o relógio volta de onde parou. */
  $('btFecharRelatorio').onclick = ()=>{
    $('telaRelatorio').classList.add('oculto');
    TO.estado.salvar();
    redesenhar();
    soltarTudo('cena');
  };
  addEventListener('keydown', ev=>{
    if(!E()) return;
    if(ev.ctrlKey && ev.key==='s'){
      ev.preventDefault();
      /* salvar com o dia correndo pegaria o mundo pela metade. A saída
         não é proibir de salvar — é parar o dia, salvar e devolver. */
      pararTudo('salvar');
      const r = TO.estado.salvar();
      soltarTudo('salvar');
      aviso(r.ok?'Salvo.':'Não salvou: '+r.motivo, r.ok?'boa':'ruim');
    }
  });

  /* A PORTA DE SERVIÇO DA TELA.
     A bateria de regressão dirige o jogo de verdade, e há coisas que só
     existem aqui: passar um dia com a rua inteira simulada, responder
     uma mensagem pelo mesmo caminho do clique, parar e soltar o relógio.
     Reimplementar isso no teste seria medir outro jogo — o teste passaria
     e o jogo continuaria quebrado. Nada aqui é chamado pelo jogo. */
  TO.tela = {
    passarUmDia, responderMensagem, pintarFeed, atualizarFeed, redesenhar,
    rodarTempo, pausarTempo, retomarTempo, tempoPausado, opc,
    get pausasDoTempo(){ return [...pausasT]; },
    get pausasDaRua(){ return [...pausas]; },
    abrirPainel, fecharPainel, get painel(){ return painel; },
    get diaPausado(){ return diaPausado(); }
  };

  montarMenu();
})();
