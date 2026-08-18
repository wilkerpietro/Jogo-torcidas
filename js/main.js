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
  /* DOIS PASSOS. A tela empilhava a lista e a ficha inteira, com o botão
     de selecionar no fim de tudo. Escolher o nome e ler a ficha são
     coisas diferentes: a primeira é o começo da decisão, a segunda É a
     decisão. */
  let passoSel = 1;

  function abrirSelecao(){
    $('telaMenu').classList.add('oculto');
    $('telaSelecao').classList.remove('oculto');
    escolhida = null;
    passoSel = 1;
    pintarSelecao();
  }

  function irParaPasso(n){ passoSel = n; pintarSelecao(); }

  function pintarSelecao(){
    const p2 = passoSel === 2 && escolhida;
    $('passo1Sel').classList.toggle('oculto', !!p2);
    $('passo2Sel').classList.toggle('oculto', !p2);
    $('btAvancarSelecao').classList.toggle('oculto', !!p2);
    $('btAvancarSelecao').disabled = !escolhida;
    $('btSelecionarTorcida').classList.toggle('oculto', !p2);
    $('btVoltarMenu').textContent = p2 ? 'Voltar' : 'Voltar ao menu';

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
    $('subSelecao').textContent = p2
      ? `${escolhida.nome} · ${escolhida.clube} · passo 2 de 2`
      : `passo 1 de 2 · ${fichas.length} torcidas · `+
        `${TO.mundo.todosTimes.length} clubes · `+
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
      /* um clique escolhe, dois avançam: o duplo é atalho, não
         caminho único — quem avança de verdade é o botão */
      b.onclick = ()=>{ escolhida = f; pintarSelecao(); };
      b.ondblclick = ()=>{ escolhida = f; irParaPasso(2); };
      rolo.appendChild(b);
    }
    cx.appendChild(rolo);

    const cxF = $('fichaTorcida');
    if(!escolhida){ cxF.innerHTML=''; return; }
    if(!p2) return;              // a ficha é o passo 2, e só ele
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
  /* os sete itens que o dono do jogo apontou — e mais nenhum */
  const NAV = [
    {id:'feed',        rot:'Feed',        ic:'megafone'},
    {id:'torcida',     rot:'Torcida',     ic:'torcida'},
    {id:'financeiro',  rot:'Financeiro',  ic:'dinheiro'},
    {id:'calendario',  rot:'Calendário',  ic:'jornal'},
    {id:'competicoes', rot:'Competições', ic:'trofeu'},
    {id:'ranking',     rot:'Ranking',     ic:'medalha'},
    {id:'diplomacia',  rot:'Diplomacia',  ic:'diplomacia'},
    {id:'noticias',    rot:'Notícias',    ic:'jornal'}
  ];
  /* A TELA PRINCIPAL É O FEED, e agora é a única tela do jogo: o mapa da
     cidade foi descontinuado e o que ele fazia por simulação virou
     resolução. Todo o resto é painel por cima do feed. */
  let pagina = 'feed';

  /* a única chave que sobrou: abrir o relatório mensal sozinho */
  function opc(e){
    e = e || E(); if(!e) return {relatorio:false};
    e.opcoes = e.opcoes || {};
    if(e.opcoes.relatorio === undefined) e.opcoes.relatorio = false;
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
    /* partida nova vive o primeiro dia na hora: os jogos de hoje saem e
       o olheiro fala, se houver o que falar */
    if(partidaNova){
      const e = E();
      /* as duas decisões de abertura vêm antes de tudo (textos
         aprovados pelo dono): ideologia e Expediente da Sede */
      TO.feed.abertura(e);
      const jogos = TO.competicoes.jogarDia(e, e.data.semana, e.data.dia);
      TO.feed.eventosDoDia(e, {jogos});
    }
    redesenhar();
    retomarTempo('abertura');
  }

  /* A COLUNA DE ÍCONES DO MENU.
     Os mesmos itens do `NAV`, sem rótulo escrito e com o nome no
     `title`, porque são onze e ícone mudo é adivinhação. Ela era montada
     duas vezes, uma na barra do feed e outra dentro do mapa; com o mapa
     fora, é uma só. O parâmetro fica porque a classe é o que a folha de
     estilo usa pra posicionar a coluna.
     Clicar abre a página como painel; clicar de novo fecha. */
  function montarMenuIcones(classe){
    const cx = el('div',{class: classe || 'feed-menu'});
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

     A tela principal é o feed. Tudo o mais é painel por cima dele:
     painel é visita, não destino.

     PAINEL ABERTO PARA O TEMPO. O jogador está lendo uma tela de
     gestão, não jogando, e um dia por segundo correndo atrás de uma
     tela opaca é o jogo andando escondido — então painel aberto para o
     relógio, e fechá-lo devolve o dia de onde parou.
     ======================================================= */
  const LIMIAR_ESTREITO = 900;
  const estreito = () => innerWidth <= LIMIAR_ESTREITO;
  let painel = null;

  const PINTOR = {
    feed:pintarFeed,
    torcida:pintarTorcida, financeiro:pintarFinanceiro,
    calendario:pintarCalendario,
    competicoes:pintarCompeticoes, ranking:pintarRanking,
    diplomacia:pintarDiplomacia,
    noticias:pintarNoticias
  };
  const pintarPagina = id => (PINTOR[id] || (()=>{}))();

  function abrirPainel(id){
    if(id === 'feed'){ fecharPainel(); return; }
    pausarTempo('painel');
    painel = id;
    fecharGaveta();
    const rot = (NAV.find(n=>n.id===id)||{}).rot || id;
    if($('painelTitulo')) $('painelTitulo').textContent = rot;
    pintarTopo();
    pintarPagina(id);
    trocarPagina();
    montarAtalhos();
  }
  function fecharPainel(){
    if(painel === null) return;
    painel = null;
    trocarPagina();
    montarAtalhos();
    /* o tempo volta de onde parou: fechar o painel devolve o feed sem
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
    /* PENDENTE ATÉ SALVAR. A escolha se aplicava solta, a cada `change`,
       e o jogador não tinha confirmação nenhuma de que ficou guardada.
       Agora os três seletores e a chave escrevem aqui, e um botão só
       leva tudo pro estado. */
    const pend = {};
    const grupo = (rot, itens, atual, aplicar)=>{
      const d = el('div',{class:'pol-grupo'});
      d.appendChild(el('b',{texto:rot}));
      /* `select.campo` E NÃO `select` PELADO: `base.css` dava `color`
         sem `background`, e o texto claro do tema caía sobre o branco
         padrão do navegador — os três apareciam vazios porque estavam
         brancos no branco. A classe já existia em `paineis.css`. */
      const sel = el('select',{class:'campo'});
      for(const it of itens){
        const o = el('option',{texto:it.rot}); o.value = it.id;
        if(it.id === atual) o.selected = true;
        sel.appendChild(o);
      }
      sel.onchange = ()=>{ pend[rot] = ()=>aplicar(sel.value); };
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
    cx.appendChild(el('div',{class:'linha-dado', html:
      '<span class="fraco">O olheiro sempre pergunta antes de cada jogo. '+
      'O botão "Seguir padrão" da mensagem executa o que está definido '+
      'aqui.</span>'}));

    /* UM BOTÃO SÓ, e é ele que confirma */
    const bt = el('button',{class:'bt destaque', texto:'Salvar'});
    bt.onclick = ()=>{
      for(const fn of Object.values(pend)) fn();
      TO.estado.salvar();
      aviso('Ideologia salva.', 'boa');
      redesenhar();
    };
    const rod = el('div',{class:'pol-rodape'});
    rod.appendChild(bt);
    cx.appendChild(rod);
    return cx;
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

    /* O BLOCO DE DATA COM O ≫, no canto de cima à direita.
       O ≫ tinha sido aposentado quando o tempo passou a correr sozinho
       — não faz sentido "avançar o dia" num jogo em que o dia avança —,
       e volta com outro papel: EMPURRAR o dia que está correndo, pra
       quem não quer esperar o segundo passar. Ele respeita a única
       trava que existe: decisão sem resposta não deixa o tempo andar,
       nem sozinho nem no dedo. */
    noFeedQuando = el('div',{class:'feed-quando'});
    const txtQuando = el('div',{class:'quando-txt'});
    const bDia = el('button',{class:'mapa-ic', html:'<span class="rot">≫</span>'});
    bDia.title = 'Empurrar o dia';
    bDia.setAttribute('aria-label', 'Empurrar o dia');
    bDia.onclick = ()=>{
      const at = E(); if(!at) return;
      if(TO.feed.travado(at)){
        aviso('Responda o que está aberto — o tempo está parado.', 'ruim');
        return;
      }
      passarUmDia(at);
      pintarTopo(); atualizarFeed();
    };
    noFeedQuando.append(txtQuando, bDia);

    /* o 1×/2× que já existe controla a velocidade do dia — é o mesmo
       botão da cena, uma velocidade só pro jogo */
    const bVel = el('button',{class:'mapa-ic', html:
      `<span class="rot">${TO.diaJogo.ponte.velocidade}×</span>`});
    bVel.title = `Velocidade do tempo — agora em ${TO.diaJogo.ponte.velocidade}×`;
    bVel.onclick = ()=>{ TO.diaJogo.ponte.alternarVelocidade(); redesenhar(); };
    if(TO.diaJogo.ponte.velocidade > 1) bVel.classList.add('aceso');
    barra.append(noFeedTopo, noFeedQuando, bVel);

    const rolo = el('div',{class:'feed-rolo'});
    noFeedLista = el('div',{class:'feed-lista'});
    rolo.appendChild(noFeedLista);
    const hist = e.feed || [];
    if(hist.length > tetoFeed){
      const b = el('button',{class:'bt feed-mais',
        texto:`Mostrar mais antigas (${hist.length - tetoFeed})`});
      b.onclick = ()=>{ tetoFeed += TETO_LISTA; pintarFeed(); };
      rolo.appendChild(b);
    }
    /* a coluna de ícones é irmã do corpo, não filha da barra: ela é a
       navegação inteira e vai da borda de cima à de baixo, do mesmo
       jeito que ia dentro do mapa */
    const corpo = el('div',{class:'feed-corpo'});
    corpo.append(barra, rolo);
    pg.append(montarMenuIcones('feed-menu'), corpo);
    atualizarFeed();
    pintarTopo();
  }

  /* o estado visível de uma mensagem: enquanto ele não muda, o nó dela
     no DOM não precisa ser refeito */
  const estadoDaMsg = (e, m) =>
    m.respondido ? (m.respondido.rot || m.respondido.botao || 'sim')
    : (m.kind === 'partida' && m.dados && m.dados.iniciada) ? 'aovivo' : '';

  function atualizarFeed(){
    const e = E();
    if(!e || !noFeedLista || !noFeedLista.isConnected) return;
    const hist = (e.feed || []).slice(0, tetoFeed);
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
    /* O MAPA DE NÓS NÃO PODE CRESCER COM A PARTIDA. Cada mensagem que
       sai da lista deixava aqui um nó solto que o navegador não libera:
       numa corrida de vinte temporadas são milhares deles, e a aba
       chegou a morrer no meio da medição. */
    if(feedVistas.size > tetoFeed * 2)
      for(const [id, v] of feedVistas)
        if(!v.no.isConnected) feedVistas.delete(id);
  }

  const ROT_VOZ = {olheiro:'Olheiro', diretor:'Diretoria', rua:'Na rua',
                   jornal:'Jornal'};
  const ROT_KIND = {abertura:'Abertura', olheiro:'Olheiro',
                    guerra:'Dia de jogo',
                    sofrido:'Ataque sofrido', escolta:'Aliados',
                    aniversario:'Aniversário', barrival:'Bar rival',
                    provocacao:'Provocação',
                    confronto:'Confronto', placar:'Resultado',
                    rodada:'Rodada', partida:'Nossa partida',
                    assalto:'Assalto', brigas:'Brigas da semana'};

  /* =======================================================
     A PARTIDA AO VIVO (decisão do dono, 17/08/2026)
     O cartão vira uma barra de minutos: 2 minutos de jogo por
     segundo real (45 s a partida). Os gols já estão sorteados
     em dados.gols; cada um aparece quando a barra alcança o
     minuto dele. Aos 90' o cartão apita: fecha a decisão no
     feed e o relógio das mensagens volta a correr.
     ======================================================= */
  const MIN_POR_SEG = 2;

  /* O RELÓGIO DA PARTIDA anda em minutos ACUMULADOS, não em hora de
     parede: minAcum guarda quanto já rolou, t0 marca a última
     retomada, e pausa e velocidade só mexem nesse par. É o que deixa
     o espaço pausar e o 2× acelerar sem pular gol nenhum. */
  function minutoDaPartida(d){
    const rodando = d.pausada ? 0
      : (Date.now() - (d.t0||Date.now()))/1000 * MIN_POR_SEG * (d.vel||4);
    return Math.min(90, Math.floor((d.minAcum||0) + rodando));
  }
  function pontoDeControle(d){
    const rodando = d.pausada ? 0
      : (Date.now() - (d.t0||Date.now()))/1000 * MIN_POR_SEG * (d.vel||4);
    d.minAcum = Math.min(90, (d.minAcum||0) + rodando);
    d.t0 = Date.now();
  }
  function alternarPausaPartida(m){
    const d = m && m.dados;
    if(!d || !d.iniciada || m.respondido) return;
    pontoDeControle(d);
    d.pausada = !d.pausada;
  }
  function alternarVelPartida(m){
    const d = m && m.dados;
    if(!d || !d.iniciada || m.respondido) return;
    pontoDeControle(d);
    d.vel = ({1:2, 2:4, 4:1})[d.vel||4] || 4;
  }
  const partidaAoVivo = e => (e.feed||[]).find(m=>
    m.kind==='partida' && m.dados && m.dados.iniciada && !m.respondido);

  /* ESPAÇO pausa e solta a partida ao vivo — só quando ela existe,
     fora de cena de briga e sem campo de texto em foco */
  addEventListener('keydown', ev=>{
    if(ev.key !== ' ' && ev.code !== 'Space') return;
    const e = E();
    if(!e || document.body.classList.contains('em-cena')) return;
    const alvoTag = (ev.target && ev.target.tagName || '').toLowerCase();
    if(alvoTag === 'input' || alvoTag === 'textarea' ||
       alvoTag === 'select') return;
    const m = partidaAoVivo(e);
    if(!m) return;
    ev.preventDefault();
    alternarPausaPartida(m);
  });

  function widgetPartida(m){
    const d = m.dados;
    /* mensagens de antes do pause: o relógio velho era só t0 corrido */
    if(d.minAcum === undefined){
      d.minAcum = Math.min(90,
        (Date.now() - (d.t0||Date.now()))/1000 * MIN_POR_SEG);
      d.t0 = Date.now();
    }
    if(!d.vel) d.vel = 4;    /* o padrão da casa é 4× */
    const caixa = el('div',{class:'partida-live'});
    const placar = el('div',{class:'partida-placar'});
    const linha = el('div',{class:'partida-linha'});
    const btPausa = el('button',{class:'partida-bt',
      title:'Pausar/seguir (espaço)'});
    const btVel = el('button',{class:'partida-bt partida-vel',
      title:'Velocidade da partida'});
    const trilho = el('div',{class:'partida-trilho'});
    const fill = el('i',{class:'partida-fill'});
    const meio = el('b',{class:'partida-meio'});
    const rotMin = el('span',{class:'partida-min', texto:"0'"});
    trilho.append(fill, meio);
    linha.append(btPausa, btVel, trilho, rotMin);
    const eventos = el('div',{class:'partida-eventos'});
    caixa.append(placar, linha, eventos);

    const pintarBotoes = ()=>{
      btPausa.textContent = d.pausada ? '▶' : '❚❚';
      btVel.textContent = `${d.vel||4}×`;
    };
    btPausa.onclick = ()=>{ alternarPausaPartida(m); pintarBotoes(); };
    btVel.onclick   = ()=>{ alternarVelPartida(m);   pintarBotoes(); };
    pintarBotoes();

    const pintarPlacar = (gc, gf) =>
      placar.textContent = `${d.casa} ${gc} × ${gf} ${d.fora}`;
    pintarPlacar(0, 0);

    const tm = setInterval(()=>{
      if(!caixa.isConnected){ clearInterval(tm); return; }
      const min = minutoDaPartida(d);
      pintarBotoes();       /* o espaço muda o estado por fora do botão */
      fill.style.width = (min/90*100)+'%';
      rotMin.textContent = `${min}'`;
      /* revela os gols que a barra já alcançou */
      const vistos = (d.gols||[]).filter(g=>g.min <= min);
      while(eventos.children.length < vistos.length){
        const g = vistos[eventos.children.length];
        const de = g.lado==='c' ? d.casa : d.fora;
        const c2 = vistos.slice(0, eventos.children.length+1)
          .filter(x=>x.lado==='c').length;
        const f2 = vistos.slice(0, eventos.children.length+1)
          .filter(x=>x.lado==='f').length;
        eventos.appendChild(el('div',{class:'partida-gol',
          texto:`${g.min}' · GOL do ${de} — ${c2} × ${f2}`}));
      }
      pintarPlacar(vistos.filter(x=>x.lado==='c').length,
                   vistos.filter(x=>x.lado==='f').length);
      if(min >= 90){
        clearInterval(tm);
        setTimeout(()=>{
          const e = E();
          TO.feed.encerrarPartida(e, m.id);
          TO.estado.salvar();
          atualizarFeed();
          pintarTopo();
          if(!TO.feed.travado(e)) retomarTempo('decisao');
        }, 600);
      }
    }, 250);
    return caixa;
  }

  function cartaoMensagem(e, m){
    const art = el('article',{class:`msg kind-${m.kind||'msg'} peso-${m.peso}`+
      (m.tipo ? ' '+m.tipo : '') + (m.respondido ? ' respondida' : '')});
    const quem  = ROT_VOZ[m.voz] || 'A rua';
    const papel = ROT_KIND[m.kind] || '';
    const q = m.quando || {};
    const d = TO.estado.dataDaSemana(q.ano||e.data.ano, q.semana||1, q.dia||1);
    const quando = `${String(d.getDate()).padStart(2,'0')}/`+
                   `${String(d.getMonth()+1).padStart(2,'0')} · ${m.hora||''}`;
    art.appendChild(el('div',{class:'msg-cab', html:
      `<span class="msg-voz">${quem}</span>`+
      `<span class="msg-papel">${papel}</span>`+
      `<time>${quando}</time>`}));
    art.appendChild(el('p',{class:'msg-txt', texto:m.texto}));

    /* O RELATÓRIO DO OLHEIRO É TABELA (decisão do dono, 17/08/2026):
       coluna 1 a competição, o dia e o jogo com a cor de cada clube;
       coluna 2 as torcidas do jogo, cada uma com sua cor e estimativa. */
    const tab = m.dados && m.dados.tabela;
    if(tab && tab.length){
      const chip = (cor, nome) =>
        `<i class="to-chip" style="background:${cor}"></i>${nome}`;
      const tb = el('table',{class:'tab-olheiro'});
      for(const r of tab){
        const tr = el('tr');
        tr.appendChild(el('td',{class:'to-jogo', html:
          `<small>${r.comp || ''}${r.dia ? ` · ${r.dia}` : ''}</small>`+
          `<div>${chip(r.clubes[0].cor, r.clubes[0].nome)}`+
          `<span class="to-x">×</span>`+
          `${chip(r.clubes[1].cor, r.clubes[1].nome)}</div>`}));
        tr.appendChild(el('td',{class:'to-torcidas', html:
          r.torcidas.map(t=>
            `<div${t.hostil ? '' : ' class="to-mansa"'}>`+
            `${chip(t.cor, t.nome)} <span class="to-faixa">`+
            `${String(t.faixa).replace(' a ','–')} membros</span></div>`)
            .join('') || '<div class="to-mansa">ninguém na rua</div>'}));
        tb.appendChild(tr);
      }
      art.appendChild(tb);
    }

    /* a linha de consequência sai dos efeitos aplicados, nunca do texto */
    if(m.consequencia)
      art.appendChild(el('div',{class:'msg-efeitos', texto:m.consequencia}));

    /* links informativos não consomem nada — "Ver Competições" */
    for(const l of (m.links || [])){
      const la = el('div',{class:'msg-abaixo'});
      const a = el('button',{class:'msg-link', texto:l.rot});
      a.onclick = ()=>{
        const args = l.args || {};
        if(args.pagina === 'noticias' && args.aba) subNoticias = args.aba;
        abrirPainel(args.pagina || 'competicoes');
      };
      la.appendChild(a);
      art.appendChild(la);
    }

    /* AS BRIGAS DA SEMANA EM TABELA (decisão do dono): coluna 1 quem
       brigou e quem venceu; coluna 2 as baixas de cada lado — as
       maiores brigas primeiro, ordenadas por envolvidos. */
    const tbb = m.kind === 'brigas' && m.dados && m.dados.brigas;
    if(tbb && tbb.length){
      const corDe2 = id => {
        const o = TO.mundo.torcida(id);
        return (o && TO.mundo.coresDaTorcida(o).cor) || '#888';
      };
      const chip2 = (id, nome) =>
        `<i class="to-chip" style="background:${corDe2(id)}"></i>${nome}`;
      const baixa2 = l => `${l.feridos} fer.`+(l.presos?` · ${l.presos} pr.`:'');
      const tb2 = el('table',{class:'tab-olheiro'});
      for(const b of tbb){
        const tr = el('tr');
        tr.appendChild(el('td',{class:'to-jogo', html:
          `<small>${b.cidade}</small>
           <div>${chip2(b.a.id, b.a.nome)} <b>${b.a.n}</b>`+
          `<span class="to-x">×</span><b>${b.b.n}</b> `+
          `${chip2(b.b.id, b.b.nome)}</div>
           <small>venceu <b>${b.vencedor}</b>`+
          `${b.prestigio ? ` · prestígio ±${b.prestigio}` : ''}</small>`}));
        tr.appendChild(el('td',{class:'to-torcidas', html:
          `<div>${b.a.nome} <span class="to-faixa">${baixa2(b.a)}</span></div>
           <div>${b.b.nome} <span class="to-faixa">${baixa2(b.b)}</span></div>`}));
        tb2.appendChild(tr);
      }
      art.appendChild(tb2);
      if(m.dados.resto)
        art.appendChild(el('div',{class:'msg-efeitos',
          texto:`…e mais ${m.dados.resto} brigas menores na aba Brigas.`}));
    }

    /* a partida ao vivo: com a bola rolando o cartão é a barra de
       minutos; encerrada, a lista de gols fica como registro */
    const aoVivo = m.kind === 'partida' && m.dados && m.dados.iniciada;
    if(aoVivo && !m.respondido) art.appendChild(widgetPartida(m));
    if(m.kind === 'partida' && m.respondido && (m.dados||{}).gols &&
       m.dados.gols.length){
      const evs = el('div',{class:'partida-eventos'});
      let c2=0, f2=0;
      for(const g of m.dados.gols){
        if(g.lado==='c') c2++; else f2++;
        const de = g.lado==='c' ? m.dados.casa : m.dados.fora;
        evs.appendChild(el('div',{class:'partida-gol',
          texto:`${g.min}' · GOL do ${de} — ${c2} × ${f2}`}));
      }
      art.appendChild(evs);
    }

    if(m.respondido){
      /* na partida o registro é o "Final: …" da consequência — não tem
         "você respondeu" em apito de juiz */
      if(m.kind !== 'partida')
        art.appendChild(el('div',{class:'msg-resp',
          texto:`Você respondeu: ${m.respondido.rot || ''}`}));
    } else if(aoVivo){
      /* sem botões: o jogo está rolando, o apito fecha sozinho */
    } else if((m.botoes||[]).length){
      const bs = el('div',{class:'msg-bts'});
      (m.botoes||[]).forEach((b, i)=>{
        const bt = el('button',{class:'bt'+(i===0?' destaque':'')});
        bt.innerHTML = `<span>${b.rot}</span>`+
                       (b.nota ? `<small>${b.nota}</small>` : '');
        bt.onclick = ()=>responderMensagem(m.id, b.id);
        bs.appendChild(bt);
      });
      art.appendChild(bs);
    }
    return art;
  }

  /* O BOTÃO APERTADO. O efeito de estado é do `TO.feed`; o que sobra
     aqui é abrir tela, que é a única coisa que a tela sabe fazer. */
  function responderMensagem(id, idBotao){
    const e = E();
    const r = TO.feed.responder(e, id, idBotao);
    atualizarFeed();
    if(!r.ok) return;
    if(r.abrir){
      const t = r.abrir.tela, a = r.abrir.args || {}, m = r.abrir.msg;
      if(t === 'tela-ataque') abrirAtaque(a.ctx);
      else if(t === 'tela-ideologia') abrirIdeologia();
      else if(t === 'painel-expediente'){ abaCal = 'expediente';
                                          abrirPainel('calendario'); }
      else if(t === 'tela-caravana') abrirCaravana();
      else if(t === 'tela-assalto') abrirAssalto();
      else if(t === 'cena-guerra') abrirGuerra(a);
      else if(t === 'cena-defesa') abrirDefesa();
      else if(t === 'cena-escolta') abrirEscolta(m && m.dados);
      else if(t === 'cena-treta') abrirTreta(m && m.dados);
      else if(t === 'cena-acao') abrirAcaoEmCena(a.cena);
      else if(t === 'painel') abrirPainel(a.pagina || 'competicoes');
    }
    TO.estado.salvar();
    pintarTopo();
    /* respondida a última decisão, o relógio volta a andar sozinho */
    if(!TO.feed.travado(e)) retomarTempo('decisao');
  }

  /* compat: as telas de caravana e ataque chamam isto no Confirmar */
  function confirmarDecisao(){
    const e = E();
    if(e && !TO.feed.travado(e)) retomarTempo('decisao');
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
  /* =======================================================
     NOTÍCIAS — o arquivo do feed
     O histórico inteiro, do mais novo pro mais velho. Aqui não
     se responde nada: o que teve botão aparece com a resposta.
     ======================================================= */
  /* =======================================================
     RANKING DE TORCIDAS (decisão do dono, 17/08/2026)
     Pontos = (membros + prestígio×2) × média de força e defesa.
     ======================================================= */
  function pintarRanking(){
    const e = E(), pg = U.$('.pagina[data-pag="ranking"]');
    if(!e || !pg) return;
    pg.innerHTML = '';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Ranking de torcidas'}));
    pg.appendChild(el('div',{class:'recado', html:
      `Pontos = (<b>membros</b> + <b>prestígio × 2</b>) × <b>média de `+
      `força e defesa</b> dos membros × <b>situação financeira</b> `+
      `(de ×0,6 endividado a ×1,6 rico).`}));
    const lista = TO.relacoes.ranking(e);
    const t = el('table',{class:'tab-ranking'});
    t.innerHTML = `<thead><tr><th>#</th><th>Torcida</th>
      <th class="nu">Membros</th><th class="nu">Prestígio</th>
      <th class="nu">Força média</th><th>Situação</th>
      <th class="nu">Pontos</th></tr></thead>`;
    const tb = el('tbody');
    for(const r of lista){
      const o = TO.mundo.torcida(r.id) || {};
      const cor = (TO.mundo.coresDaTorcida(o) || {}).cor || '#888';
      const tr = el('tr',{class: r.nossa ? 'nossa' : ''});
      const sit = r.situacao || {rot:'—', slug:'pobre', mult:1};
      tr.innerHTML =
        `<td class="pos">${r.pos}º</td>
         <td><i class="to-chip" style="background:${cor}"></i>${r.nome}</td>
         <td class="nu">${U.numero(r.membros)}</td>
         <td class="nu">${r.prestigio}</td>
         <td class="nu">${(Math.round(r.forca*10)/10).toFixed(1)}</td>
         <td class="fin fin-${sit.slug}" title="${U.dinheiro(Math.round(r.caixa||0))}`+
        ` · pontos ×${sit.mult.toFixed(1).replace('.', ',')}">${sit.rot}</td>
         <td class="nu"><b>${U.numero(r.pontos)}</b></td>`;
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    const rolo = el('div',{class:'rolo', estilo:{maxHeight:'70vh'}});
    rolo.appendChild(t);
    pg.appendChild(rolo);
  }

  let subNoticias = 'arquivo';
  function pintarNoticias(){
    const e = E(), pg = U.$('.pagina[data-pag="noticias"]');
    if(!e || !pg) return;
    pg.innerHTML = '';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Notícias'}));
    pg.appendChild(subabas([
      {id:'arquivo', rot:'Arquivo do feed'},
      {id:'brigas',  rot:'Brigas'}
    ], subNoticias, id=>{subNoticias=id; redesenhar();}));

    if(subNoticias === 'brigas'){ pg.appendChild(painelBrigasIA(e)); return; }

    const hist = e.feed || [];
    const lista = el('div',{class:'feed-lista'});
    if(!hist.length)
      lista.appendChild(el('div',{class:'em-construcao',
        texto:'Nada aconteceu ainda.'}));
    for(const m of hist.slice(0, 200)) lista.appendChild(cartaoMensagem(e, m));
    if(hist.length > 200)
      lista.appendChild(el('div',{class:'linha-dado', html:
        `<span class="fraco">…e mais ${hist.length-200} mensagens mais `+
        `antigas.</span>`}));
    pg.appendChild(lista);
  }

  /* a aba BRIGAS: o que o mundo se pegou por conta própria, briga a
     briga, com efetivos, feridos, presos e o jogo que deu o motivo
     (decisão do dono, 17/08/2026) */
  function painelBrigasIA(e){
    const cx = el('div');
    const brigas = e.brigasIA || [];
    const c = cartao('Brigas pelo país', `${brigas.length} registradas`);
    if(!brigas.length)
      c.corpo.innerHTML = '<div class="em-construcao">O país anda calmo — '+
        'por enquanto.</div>';
    const corDe = id => {
      const o = TO.mundo.torcida(id);
      return (o && TO.mundo.coresDaTorcida(o).cor) || '#888';
    };
    const chip = (id, nome) =>
      `<i class="to-chip" style="background:${corDe(id)}"></i>${nome}`;
    for(const b of brigas.slice(0, 60)){
      const baixa = l => `${l.feridos} ferido${l.feridos===1?'':'s'}`+
        (l.presos ? `, ${l.presos} preso${l.presos===1?'':'s'}` : '');
      c.corpo.appendChild(el('div',{class:'briga-ia', html:
        `<div class="briga-ia-cab">
           <span class="dia">${b.semana}/${b.dia}</span>
           <span>${chip(b.a.id, b.a.nome)} <b>${b.a.n}</b>
             <span class="to-x">×</span> <b>${b.b.n}</b>
             ${chip(b.b.id, b.b.nome)}</span>
           <span class="briga-ia-vence">venceu ${b.vencedor}</span>
         </div>
         <small>${b.cidade} · ${/×/.test(b.jogo||'') ?
          `na sombra de ${b.jogo}` : (b.jogo || 'na rua')} · ${b.a.nome}: `+
        `${baixa(b.a)} · ${b.b.nome}: ${baixa(b.b)}`+
        `${b.a.ajuda ? ` · escolta de ${b.a.ajuda.nome} (${b.a.ajuda.n})` : ''}`+
        `${b.b.ajuda ? ` · escolta de ${b.b.ajuda.nome} (${b.b.ajuda.n})` : ''}`+
        `${b.saque ? ` · saque de ${U.dinheiro(b.saque)}` : ''}`+
        `${b.prestigio ? ` · prestígio ±${b.prestigio}` : ''}</small>`}));
    }
    cx.appendChild(c);
    return cx;
  }

  /* =======================================================
     CABEÇALHO
     ======================================================= */
  /* O CABEÇALHO É A BARRA DO FEED.
     Era uma faixa de 56px acima de tudo; virou HUD do mapa e, com o
     mapa fora, virou a barra do feed: a data e o ≫ no canto de cima à
     direita, o escudo, o nome e os números na faixa da torcida. Os nós
     são criados por `pintarFeed` e guardados aqui — assim isto continua
     sendo escrita de texto, e não remontagem de tela, que é o que
     permite escrever nela uma vez por dia sem a rolagem saltar.

     Membros e prestígio não foram pedidos em lugar nenhum, e sumir sem
     destino não é opção: vão junto do saldo na faixa, que é onde os três
     já eram lidos lado a lado. */
  function pintarTopo(){
    const e = E();
    if(!e) return;
    const dt = TO.estado.dataTexto();
    const txtQuando = noFeedQuando && noFeedQuando.querySelector('.quando-txt');
    if(txtQuando && txtQuando.isConnected){
      txtQuando.innerHTML =
        `<b>${dt.semana}, ${dt.curta}</b>`+
        `<small>semana ${e.data.semana} de ${TO.competicoes.SEMANAS_ANO} · `+
        `${e.data.ano}${TO.feed.travado(e) ? ' · tempo parado' : ''}</small>`;
    }
    if(noFeedTopo && noFeedTopo.isConnected){
      const [c1,c2] = e.torcida.cores;
      const c = TO.membros.contar(e);
      const sem = (TO.financeiro.resumoDaSemana(e) || {}).saldo || 0;
      const sinal = sem > 0 ? '+' : sem < 0 ? '−' : '';
      /* as médias do bonde e a posição no ranking nacional (pedido do
         dono, 17/08/2026): #pos ao lado do nome; moral, ataque e
         defesa médios, com uma casa, ao lado do prestígio */
      const nM = e.membros.length || 1;
      const d1 = v => (Math.round(v*10)/10).toFixed(1);
      const mMoral = d1(e.membros.reduce((s,m)=>s+m.moral, 0)/nM);
      const mForca = d1(e.membros.reduce((s,m)=>s+m.forca, 0)/nM);
      const mDef   = d1(e.membros.reduce((s,m)=>s+m.defesa, 0)/nM);
      const pos = TO.relacoes.posicaoNoRanking(e);
      noFeedTopo.innerHTML =
        `<span class="escudo" style="background:linear-gradient(135deg,${c1} 0 52%,${c2} 52% 100%)"
           >${e.torcida.sigla}</span>`+
        `<b>${e.torcida.nome}</b>`+
        `<span class="num pos-rank" title="posição no ranking nacional">`+
        `#${pos||'—'}</span>`+
        `<span class="num${e.dinheiro<0?' negativo':''}">${IC.get('dinheiro')}`+
        `${U.dinheiro(e.dinheiro)}</span>`+
        `<span class="num semana ${sem>0?'sobra':sem<0?'falta':''}"`+
        ` title="saldo desta semana">${sinal}${U.dinheiro(Math.abs(sem))}`+
        `<em>/sem</em></span>`+
        `<span class="num">${IC.get('membros')}${U.numero(c.total)}</span>`+
        `<span class="num">${IC.get('estrela')}`+
        `${Math.round(e.indicadores.prestigio*5)}</span>`+
        `<span class="num" title="moral média dos membros">`+
        `${IC.get('raio')}${mMoral}</span>`+
        `<span class="num" title="ataque médio dos membros">`+
        `${IC.get('halter')}${mForca}</span>`+
        `<span class="num" title="defesa média dos membros">`+
        `${IC.get('tijolo')}${mDef}</span>`;
    }

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
    /* O PERÍODO É O DO RELATÓRIO. Chamar de "saldo da semana" o que são
       quatro semanas somadas é errar o número na legenda. */
    const per = rel.mensal ? 'do mês' : 'da semana';
    fim.appendChild(el('div',{class:'linha-dado total', html:
      `<span>Saldo ${per}</span><b class="${rel.saldo>=0?'positivo':'negativo'}">`+
      `${U.dinheiro(rel.saldo)}</b>`}));
    if(rel.foraDaConta)
      fim.appendChild(el('div',{class:'linha-dado', html:
        `<span>Ações e imprevistos ${per}</span>`+
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

    /* o relatório é do MÊS; save antigo pode trazer um fechamento
       semanal guardado, e ele continua abrindo com o título certo */
    modal(rel.mensal
            ? `Fechamento do mês — semanas ${rel.semanaDe} a ${rel.semanaAte}`
            : `Fechamento da semana ${rel.semana}`,
          `${rel.receitas.length} receitas · ${rel.despesas.length} despesas`+
          (rel.mensal && rel.saidasNoMes
            ? ` · ${rel.saidasNoMes} ${rel.saidasNoMes===1?'saída':'saídas'}` : ''),
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

  /* =======================================================
     MORAL & PRESTÍGIO — o livro dos indicadores, item a item
     (pedido do dono, 17/08/2026). O prestígio fala na régua
     de 0 a 100 (indicador ×5); a moral fala na de 0 a 20.
     ======================================================= */
  function painelIndicadores(){
    const e = E();
    const cx = el('div');
    const c0 = cartao('Agora');
    c0.corpo.innerHTML =
      `<div class="linha-dado"><span>Prestígio</span>
         <b>${Math.round(e.indicadores.prestigio*5)} <span class="fraco">de 100</span></b></div>
       <div class="linha-dado"><span>Moral da torcida</span>
         <b>${Math.round(e.indicadores.moral*10)/10} <span class="fraco">de 20</span></b></div>
       <div class="linha-dado"><span class="fraco">Ficar 20 dias sem briga `+
      `deprecia: −1 de prestígio e −0,5 de moral, e o relógio segue `+
      `correndo até a próxima briga.</span></div>`;
    cx.appendChild(c0);

    const hist = e.historicoIndicadores || [];
    const c = cartao('Histórico', `${hist.length} movimentos`);
    if(!hist.length)
      c.corpo.innerHTML = '<div class="em-construcao">Nada mexeu ainda.</div>';
    for(const h of hist.slice(0, 80)){
      const prest = h.ind === 'prestigio';
      const v = prest ? Math.round(h.delta*5*10)/10 : Math.round(h.delta*10)/10;
      c.corpo.appendChild(el('div',{class:'transacao', html:
        `<span class="dia">${h.dia}</span>
         <span class="desc">${prest ? 'Prestígio' : 'Moral'} · ${h.motivo||''}</span>
         <span class="val ${h.delta<0?'negativo':'positivo'}">`+
        `${v>0?'+':''}${v}</span>`}));
    }
    cx.appendChild(c);
    return cx;
  }

  function pintarTorcida(){
    const e = E(), pg = U.$('.pagina[data-pag="torcida"]');
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Torcida — membros'}));
    pg.appendChild(subabas([
      {id:'membros',      rot:'Membros'},
      {id:'hierarquia',   rot:'Hierarquia'},
      {id:'treinamentos', rot:'Treinamentos'},
      {id:'recrutamento', rot:'Recrutamento'},
      {id:'indicadores',  rot:'Moral & Prestígio'}
    ], subTorcida, id=>{subTorcida=id; redesenhar();}));

    if(subTorcida==='treinamentos'){ pg.appendChild(painelTreinos()); return; }
    if(subTorcida==='hierarquia'){ pg.appendChild(painelHierarquia()); return; }
    if(subTorcida==='recrutamento'){ pg.appendChild(painelRecrutamento()); return; }
    if(subTorcida==='indicadores'){ pg.appendChild(painelIndicadores()); return; }

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

    /* o treino roda sozinho no virar do dia (decisão do dono): o
       painel só mostra quem a diretoria escalou hoje */
    const c1 = cartao('Treino de hoje',
      `${fila.length} escalados · ${cap} vagas · sorteado e treinado todo dia`);
    if(!fila.length){
      c1.corpo.innerHTML = `<div class="em-construcao">Ninguém escalado `+
        `hoje — todo mundo ferido, preso ou no teto. A diretoria sorteia `+
        `de novo amanhã.</div>`;
    } else {
      fila.forEach((m,i)=>{
        const pl = TO.membros.planoDeTreino(m);
        const falta = pl.noTeto ? 'no teto do cargo'
          : `${pl.sessoes} ${pl.sessoes===1?'sessão':'sessões'} até o teto ${pl.teto}`;
        c1.corpo.appendChild(el('div',{class:'item'+(i<cap?' meu':''), html:
          `<div class="l1"><span class="nm">${TO.membros.nomeDe(m)}</span>
             <span class="qt">${m.forca}/${m.defesa}</span></div>
           <div class="l2">treinou hoje · ${falta} · frações `+
          `${m.fracForca.toFixed(2)} / ${m.fracDefesa.toFixed(2)}</div>`}));
      });
    }
    grade.appendChild(c1);

    /* GDD §5.4 — quem ainda tem o que ganhar, por cargo */
    const c2 = cartao('Plano de treino', 'GDD §5.4');
    const disp = e.membros.filter(m=>TO.membros.disponivel(m));
    const emTeto = disp.filter(m=>TO.membros.planoDeTreino(m).noTeto).length;
    c2.corpo.innerHTML =
      `<div class="linha-dado"><span>Ganho por sessão</span>
         <b>${e.professorMMA ? '0.00 a 0.60 · professor de MMA' : '0.00 a 0.30'}</b></div>
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
      `acumula, e veterano leva +2 acima do teto do cargo. A diretoria `+
      `sorteia e treina a turma sozinha todo dia, priorizando quem ainda `+
      `tem o que ganhar.</span>`}));
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

    const c2 = cartao('Previsão da próxima campanha',
                      `regime: ${p.rotRegime}`);
    const pc = v => `${Math.round(v*100)}%`;
    c2.corpo.innerHTML =
      `<div class="linha-dado"><span>Recruta 1</span><b>${pc(p.um)}</b></div>
       <div class="linha-dado"><span>Recruta 2</span><b>${pc(p.dois)}</b></div>
       <div class="linha-dado"><span>Ninguém entra</span><b>${pc(p.zero)}</b></div>
       <div class="linha-dado"><span>Vagas na sede</span>
         <b class="${p.vaga>0?'':'negativo'}">${p.vaga}</b></div>
       <div class="valorao"><span>Devem entrar por semana</span>
         <b class="${p.porSemana>0?'positivo':'negativo'}">~${p.porSemana}</b></div>
       <div class="linha-dado"><span class="fraco">O dado muda com a fase do `+
      `clube: vitória esquenta a praça, derrota esfria; título e acesso `+
      `abrem 2 semanas quentes, rebaixamento seca 2. Sai R$ 5 por `+
      `novato.</span></div>`;
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
         <span class="desc">base de ${r.base} mil`+
        `${r.querem?` · ${U.numero(r.querem)} topariam`:''}</span>
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

  /* =======================================================
     A TELA DO ASSALTO (tabela do dono, 17/08/2026)
     Duas perguntas: qual alvo, quantos vão. Os membros são
     sorteados entre os disponíveis; o dado é um só pro bonde
     inteiro — partilha pra todos ou cadeia pra todos.
     ======================================================= */
  function abrirAssalto(){
    const e = E();
    const A = TO.acoes.ASSALTOS;
    const disp = e.membros.filter(TO.membros.disponivel).length;
    let alvo = A[A.length-1].id;              // abre no mais leve
    let efetivo = null;
    const corpo = el('div');

    const pintar = ()=>{
      corpo.innerHTML = '';
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Qual o alvo'}));
      corpo.appendChild(opcoes(A.map(a=>({
        id:a.id, rot:a.nome,
        nota:`${U.dinheiro(a.ganho[a.efetivos[0]][0])} a `+
             `${U.dinheiro(a.ganho[a.efetivos[1]][1])} · `+
             `${Math.round(a.chance*100)}% de cadeia · `+
             `pena de ${a.pena} dias`,
        desabilitada: disp < a.efetivos[0]
      })), alvo, id=>{ alvo = id; efetivo = null; pintar(); }));

      const a = A.find(x=>x.id === alvo);
      if(efetivo === null && disp >= a.efetivos[0]) efetivo = a.efetivos[0];
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Quantos vão'}));
      corpo.appendChild(opcoes(a.efetivos.map(n=>({
        id:String(n), rot:`${n} membros`,
        nota: disp < n ? `só ${disp} disponíveis`
            : `${U.dinheiro(a.ganho[n][0])} a ${U.dinheiro(a.ganho[n][1])}`,
        desabilitada: disp < n
      })), efetivo !== null ? String(efetivo) : null,
          id=>{ efetivo = parseInt(id, 10); pintar(); }));
      corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span class="fraco">Os ${efetivo || '—'} são sorteados entre os `+
        `disponíveis. Se cair, cai todo mundo — e o dinheiro fica lá.</span>`}));
    };
    pintar();

    modal('Assalto', 'a diretoria mapeou os alvos', corpo, [
      ['Assaltar', ()=>{
        if(efetivo === null){ aviso('Escolhe o efetivo.', 'ruim'); return; }
        const r = TO.acoes.executarAssalto(e, alvo, efetivo);
        if(!r.ok){ aviso(r.msg, 'ruim'); return; }
        aviso(r.caiu ? `Deu ruim: ${r.n} presos por ${r.pena} dias.`
                     : `${U.dinheiro(r.valor)} na conta.`,
              r.caiu ? 'ruim' : 'boa');
        TO.estado.salvar();
        pintarTopo();
        atualizarFeed();
      }]
    ]);
  }

  /* =======================================================
     A TELA DA CARAVANA

     A pergunta "quantos vão na caravana, e por qual estrada?" abria a
     Gestão inteira — onze cartões, e o jogador que procurasse o da
     caravana. Pergunta específica merece tela específica.

     NADA AQUI É REGRA NOVA. Os três números saem de
     `planejamento.estimativaCaravana`, `planejamento.rotas` e
     `E.estoque.bombas`, que é exatamente o que o cartão da Gestão já
     lia. E NADA AQUI LANÇA DINHEIRO: a caravana é cobrada uma vez, no
     fechamento da semana, por `compromissos` — quem escreve aqui só
     mexe em `p.caravana`, `p.rota` e `p.bombas`.

     O CUSTO ANDA JUNTO COM O DEDO. Caravana é a maior despesa avulsa do
     jogo, e decidir quantos vão sem ver o preço mudar é decidir no
     escuro. Por isso o corpo é remontado a cada toque, em vez de o
     número ser escrito uma vez na abertura.
     ======================================================= */
  function abrirCaravana(){
    const e = E(), P = TO.planejamento;
    const listaRotas = P.rotas(e);
    if(!listaRotas.length){
      /* o botão da caravana só sai em pergunta de jogo fora, então
         chegar aqui sem rota é bug, e não recado (§8.30) */
      console.warn('[caravana] tela pedida sem rota nenhuma');
      return {cancelado:true};
    }
    const p = P.plano(e);
    const corpo = el('div');
    let fechar = null;

    /* A DECISÃO DO DIA VEM ANTES DE TUDO, porque é ela que dá sentido
       ao resto: a tela resolvia quantos vão, por qual estrada e quantas
       bombas, e não perguntava o que a bomba ia fazer quando chegasse
       lá. Escolhendo paz, os dois campos somem e a tela é a de antes. */
    const alvos = P.alvosDaViagem(e);
    let onde = P.ondeDoPlano(p);

    const pintar = ()=>{
      const est = P.estimativaCaravana(e);
      const j = e.proximoJogo || {};
      const briga = p.intencao !== 'paz';
      const alvo = alvos.find(a=>a.id === p.alvoTorcida) || null;
      corpo.innerHTML = '';

      /* --- em paz ou pra cima deles --- */
      corpo.appendChild(el('div',{class:'fase-rot',
        texto:'A torcida vai em paz ou vai atacar?'}));
      corpo.appendChild(opcoes([
        {id:'paz', rot:'Ir em paz',
         nota:'entrar pelo portão, bandeira e bateria'},
        {id:'atacar', rot:'Atacar',
         nota: alvos.length ? 'procurar a torcida deles antes da bola rolar'
                            : 'não há torcida do mandante pra atacar',
         desabilitada: !alvos.length}
      ], briga ? 'atacar' : 'paz', id=>{
        if(id === 'paz'){ P.definirIntencao(e, 'paz'); }
        else {
          P.definirAtaque(e, {alvo: p.alvoTorcida ||
            (alvos[0] && alvos[0].id), onde, bombas: p.bombas});
        }
        pintar();
      }));

      if(briga){
        /* --- quem --- */
        corpo.appendChild(el('div',{class:'fase-rot', texto:'Quem atacar'}));
        corpo.appendChild(opcoes(alvos.map(a=>({
          id:a.id, rot:a.nome,
          nota:`${a.faixa} na rua · relação ${Math.round(a.relacao)}`
        })), (alvo||alvos[0]||{}).id, id=>{
          P.definirAtaque(e, {alvo:id, onde, bombas:p.bombas}); pintar();
        }));
        /* --- onde --- */
        corpo.appendChild(el('div',{class:'fase-rot', texto:'Onde atacar'}));
        corpo.appendChild(opcoes(P.ONDE_ATAQUE.map(o=>({
          id:o.id, rot:o.rot,
          /* nos arredores do estádio DELES o mando é deles, e a cena
             abre com a gente do lado visitante — que é o que a gente é */
          nota: o.id === 'arredores'
            ? 'a beira do estádio deles, e lá a gente é o visitante'
            : o.nota
        })), onde, id=>{
          onde = id;
          P.definirAtaque(e, {alvo:p.alvoTorcida, onde, bombas:p.bombas});
          pintar();
        }));
      }

      /* --- quantos vão --- */
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Quantos vão'}));
      corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span>Querem ir</span><b>${est.interessados} `+
        `<span class="fraco">de ${est.aptos} aptos</span></b>`}));
      corpo.appendChild(el('div',{class:'linha-dado', html:
        medidor('Vontade de viajar', Math.round(est.vontade*100), 100,
                est.vontade>0.5?'var(--verde)':'var(--ouro)')}));
      const passo = Math.max(1, Math.round(est.interessados/10));
      const linha = el('div',{class:'contador'});
      const bMenos = el('button',{texto:'−'}), bMais = el('button',{texto:'+'});
      bMenos.disabled = est.vao <= est.minimo;
      bMais.disabled  = est.vao >= est.interessados;
      bMenos.onclick = ()=>{ p.caravana = Math.max(est.minimo, est.vao - passo);
                             p.decidido = false; pintar(); };
      bMais.onclick  = ()=>{ p.caravana = Math.min(est.interessados, est.vao + passo);
                             p.decidido = false; pintar(); };
      linha.append(bMenos, el('b',{texto:String(est.vao)}), bMais,
        el('small',{texto:`embarcam · mínimo ${est.minimo}`}));
      corpo.appendChild(linha);
      corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span>Por cabeça</span><b>${U.dinheiro(est.porCabeca)}</b>`}));
      corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span>Ônibus e pedágio</span><b>${U.dinheiro(est.bruto)}</b>`}));
      corpo.appendChild(el('div',{class:'linha-dado', html:
        `<span>Rateio entre os que vão</span>`+
        `<b class="positivo">${U.dinheiro(est.rateio)}</b>`}));
      corpo.appendChild(el('div',{class:'linha-dado total', html:
        `<span>Sai do caixa</span>`+
        `<b class="negativo">${U.dinheiro(-est.custo)}</b>`}));

      /* --- por qual estrada --- */
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Por qual estrada'}));
      corpo.appendChild(opcoes(listaRotas.map(r=>({
        id:r.id, rot:r.nome, custo:Math.round(r.custo*0.4),
        nota:`${r.nota}${r.risco ? ` · risco de emboscada ${Math.round(r.risco)}`
                                 : ' · sem território hostil'}`
      })), (p.rota || listaRotas[0].id),
        id=>{ p.rota = id; p.decidido = false; pintar(); }));
      const r = P.rotaEscolhida(e);
      if(r && r.cidades.length > 1)
        corpo.appendChild(el('div',{class:'trajeto', html:
          r.cidades.map((c,i)=>{
            const nome = (TO.mundo.cidade(c)||{}).nome || c;
            const hostil = P.hostilidade(e, c);
            return `<span class="parada${i===0?' saida':''}${
              i===r.cidades.length-1?' chegada':''}${hostil>40?' hostil':''}`+
              `">${nome}</span>`;
          }).join('<i>›</i>')}));

      /* --- quantas bombas --- */
      const temBomba = (e.estoque||{}).bombas || 0;
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Quantas bombas'}));
      const lb = el('div',{class:'contador'});
      const bB = el('button',{texto:'−'}), bM = el('button',{texto:'+'});
      const leva = U.limitar(p.bombas || 0, 0, temBomba);
      bB.disabled = leva <= 0;
      bM.disabled = leva >= temBomba;
      bB.onclick = ()=>{ p.bombas = Math.max(0, leva-1); p.decidido=false; pintar(); };
      bM.onclick = ()=>{ p.bombas = Math.min(temBomba, leva+1); p.decidido=false; pintar(); };
      lb.append(bB, el('b',{texto:String(leva)}), bM,
        el('small',{texto: temBomba ? `de ${temBomba} no estoque`
                                    : 'não temos bomba no estoque'}));
      corpo.appendChild(lb);

      /* --- o resumo, com as duas decisões --- */
      const ondeRot = (P.ONDE_ATAQUE.find(o=>o.id === onde)||{}).rot || '';
      corpo.appendChild(el('div',{class:'linha-dado total', html:
        `<span>${est.vao} para ${j.cidadeAdv || 'fora'} por `+
        `${(r||{}).nome || '—'}${leva ? `, com ${leva} bomba${leva>1?'s':''}` : ''}`+
        (briga && alvo ? ` · em cima da ${alvo.nome} `+
                         `${ondeRot.toLowerCase()}` : '')+
        `</span><b class="negativo">${U.dinheiro(-est.custo)}</b>`}));
    };

    pintar();
    fechar = modal('Caravana',
      `${(e.proximoJogo||{}).mandante ? e.proximoJogo.mandante.nome : 'Fora'} · `+
      `semana ${e.data.semana}`, corpo,
      /* CONFIRMAR NÃO COBRA. `confirmar` fecha o plano e paga recepção e
         investida; a estrada continua sendo compromisso da semana, e
         cobrá-la aqui seria o lançamento duplicado. */
      [['Confirmar', ()=>{
        const est = P.estimativaCaravana(e);
        P.confirmar(e);
        aviso(`Caravana fechada: ${est.vao} para ${(e.proximoJogo||{}).cidadeAdv}.`,
              'boa');
        confirmarDecisao();
        TO.estado.salvar();
        redesenhar();
      }]], 'media');
    return fechar;
  }

  /* =======================================================
     A TELA DO ATAQUE — três perguntas, e só três

     Mesma forma da caravana (§8.23) e pelo mesmo motivo: a pergunta do
     feed tinha três campos e mandava o jogador procurar os três dentro
     da Gestão inteira. Quem, onde, quantas bombas — e o resumo.

     REGRA NENHUMA MORA AQUI. Alvo, local e bomba já eram campos do
     plano; quem os escreve é `definirAtaque`, no planejamento, que é o
     único lugar que sabe da trela do delegado.
     ======================================================= */
  const DIA_DA_SEMANA = ['','segunda','terça','quarta','quinta','sexta',
                         'sábado','domingo'];

  /* RAZÃO DE FALHA NUNCA VIRA TEXTO PRO JOGADOR (§8.30). Uma tela faz
     uma de duas coisas: entrega o conteúdo, ou não se oferece. Aqui
     havia um `aviso(…,'ruim')` com o texto de uma validação de lista
     vazia, e ele chegava por cima da pergunta pré-jogo, no lugar da
     tela que o botão prometia abrir. Hoje o
     botão nem é oferecido nesse caso (`botoesDoPlano`), então isto é
     inalcançável; se acontecer, é bug, e bug vai pro console. */
  function abrirAtaque(ctx){
    const e = E(), P = TO.planejamento;
    /* O RELATÓRIO DO DIA É UM SÓ (decisão do dono), então a tela recebe
       GRUPOS: cada jogo relevante traz seus alvos, e o alvo escolhido
       carrega o jogo a que pertence — nosso (plano) ou alheio
       (investida daquele jogo). */
    let lista;
    if(ctx && ctx.grupos && ctx.grupos.length){
      lista = [];
      const vistos = new Set();
      for(const g of ctx.grupos){
        const doJogo = new Set(
          [...TO.mundo.torcidasDe(g.casa), ...TO.mundo.torcidasDe(g.vis)]
            .map(o=>o.id));
        for(const a of P.alvosNaRua(e, {dia:g.dia})){
          if(!doJogo.has(a.id) || vistos.has(a.id)) continue;
          vistos.add(a.id);
          lista.push(Object.assign({}, a, {chaveJogo:g.chaveJogo, dia:g.dia}));
        }
      }
      lista.sort((a,b)=>a.relacao-b.relacao);
    } else {
      lista = P.alvosDoAtaque(e, ctx);
    }
    if(!lista.length){
      console.warn('[ataque] tela pedida sem alvo nenhum', ctx);
      return {cancelado:true};
    }
    const p = P.plano(e);
    /* abre no que o plano já tem; sem alvo, no mais quente da lista */
    let alvo = lista.find(x=>x.id === p.alvoTorcida) ? p.alvoTorcida : lista[0].id;
    let onde = P.ondeDoPlano(p);
    let bombas = U.limitar(p.bombas || 0, 0, (e.estoque||{}).bombas || 0);
    let efetivo = null;
    const corpo = el('div');
    const diaDoEvento = ()=> {
      const a = lista.find(x=>x.id === alvo) || {};
      return a.dia || (ctx && ctx.dia) || ((e.proximoJogo||{}).dia) || 6;
    };

    const pintar = ()=>{
      corpo.innerHTML = '';
      const j = e.proximoJogo || {};

      /* --- 1: quem atacar --- */
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Quem atacar'}));
      corpo.appendChild(opcoes(lista.map(a=>({
        id:a.id, rot:a.nome + (a.aliada ? ' · aliada' : ''),
        /* o efetivo é ESTIMATIVA, em faixa, como o olheiro dá: número
           exato de bonde alheio é coisa que ninguém tem */
        nota:`${a.faixa} na rua · relação ${Math.round(a.relacao)}`+
             (a.deFora ? ' · caravana de fora' : '')
      })), alvo, id=>{ alvo = id; pintar(); }));

      /* --- 2: onde atacar --- */
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Onde atacar'}));
      corpo.appendChild(opcoes(P.ONDE_ATAQUE.map(o=>({
        id:o.id, rot:o.rot, nota:o.nota
      })), onde, id=>{ onde = id; pintar(); }));

      /* --- 3: quantos vão --- */
      const f = P.efetivoDoAtaque(e);
      if(efetivo == null) efetivo = f.teto;
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Quantos vão atacar'}));
      const le = el('div',{class:'contador'});
      const eB = el('button',{texto:'−'}), eM = el('button',{texto:'+'});
      const passo = Math.max(1, Math.round(f.teto/10));
      eB.disabled = efetivo <= f.piso;
      eM.disabled = efetivo >= f.teto;
      eB.onclick = ()=>{ efetivo = Math.max(f.piso, efetivo - passo); pintar(); };
      eM.onclick = ()=>{ efetivo = Math.min(f.teto, efetivo + passo); pintar(); };
      /* QUANTIDADE EQUIVALENTE (decisão do autor): iguala o nosso
         efetivo ao da torcida selecionada — e vencer em menor número
         rende mais prestígio; em maior número, menos. */
      const bEq = el('button',{class:'bt', texto:'Quantidade equivalente'});
      bEq.onclick = ()=>{
        const a2 = lista.find(x=>x.id === alvo);
        if(a2 && a2.n) efetivo = U.limitar(Math.round(a2.n), f.piso, f.teto);
        pintar();
      };
      le.append(eB, el('b',{texto:String(efetivo)}), eM, bEq,
        el('small',{texto:`de ${f.teto} que saem de casa · mínimo ${f.piso} · `+
          `vencer em menor número rende mais prestígio`}));
      corpo.appendChild(le);

      /* --- 4: quantas bombas --- */
      const tem = (e.estoque||{}).bombas || 0;
      const podeComprar = Math.floor(Math.max(0, e.dinheiro) /
                                     TO.patrimonio.PRECO_BOMBA);
      const teto = tem + podeComprar;
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Quantas bombas'}));
      const lb = el('div',{class:'contador'});
      const bB = el('button',{texto:'−'}), bM = el('button',{texto:'+'});
      bB.disabled = bombas <= 0;
      bM.disabled = bombas >= teto;
      bB.onclick = ()=>{ bombas = Math.max(0, bombas-1); pintar(); };
      bM.onclick = ()=>{ bombas = Math.min(teto, bombas+1); pintar(); };
      const custoExtra = Math.max(0, bombas - tem) * TO.patrimonio.PRECO_BOMBA;
      lb.append(bB, el('b',{texto:String(bombas)}), bM,
        el('small',{texto:`${tem} no estoque`+
          (custoExtra ? ` · comprar ${bombas-tem} por ${U.dinheiro(custoExtra)}`
                      : '')}));
      corpo.appendChild(lb);

      /* --- o resumo --- */
      const a = lista.find(x=>x.id === alvo) || {};
      const o = P.ONDE_ATAQUE.find(x=>x.id === onde) || {};
      corpo.appendChild(el('div',{class:'linha-dado total', html:
        `<span>${efetivo} nossos contra a ${a.nome||'—'} `+
        `${(o.rot||'').toLowerCase()}`+
        `${bombas ? `, com ${bombas} bomba${bombas>1?'s':''}` : ''}</span>`+
        `<b>${DIA_DA_SEMANA[diaDoEvento()] || 'sábado'}</b>`}));
      if(a.aliada)
        corpo.appendChild(el('div',{class:'linha-dado', html:
          '<span class="negativo">É aliada nossa. Bater nela derruba a '+
          'relação de vez.</span>'}));
    };

    pintar();
    return modal('Atacar',
      `${(e.proximoJogo||{}).mandante ? e.proximoJogo.mandante.nome : 'Jogo'} · `+
      `semana ${e.data.semana}`, corpo,
      [['Confirmar', ()=>{
        /* bomba que falta no estoque é comprada agora, R$ 120 cada */
        const falta = Math.max(0, bombas - ((e.estoque||{}).bombas || 0));
        if(falta) TO.patrimonio.comprarBombas(e, falta);
        const escolhidoNaLista = lista.find(x=>x.id === alvo) || {};
        const chaveDoAlvo = escolhidoNaLista.chaveJogo ||
                            (ctx && ctx.chaveJogo) || null;
        if(chaveDoAlvo){
          /* ataque num jogo alheio da praça é INVESTIDA daquele jogo — o
             plano do nosso jogo não entra nessa briga */
          const p2 = TO.planejamento.plano(e);
          const f2 = TO.planejamento.efetivoDoAtaque(e);
          p2.bombas = U.limitar(bombas, 0, (e.estoque||{}).bombas || 0);
          if(efetivo != null)
            p2.efetivoAtaque = U.limitar(efetivo, f2.piso, f2.teto);
          /* o ONDE escolhido vale pra investida também: concentração
             abre a praça, pista abre a rua, arredores abre os arredores */
          const oc = P.ONDE_ATAQUE.find(x=>x.id === onde) || P.ONDE_ATAQUE[2];
          TO.planejamento.definirInvestida(e, chaveDoAlvo,
            {alvo, como:oc.como, olheiro:oc.olheiro});
        }
        else TO.planejamento.definirAtaque(e,
          {ctx, alvo, onde, bombas, efetivo});
        const a = lista.find(x=>x.id === alvo) || {};
        const o = P.ONDE_ATAQUE.find(x=>x.id === onde) || {};
        aviso(`Marcado: ${a.nome} ${(o.rot||'').toLowerCase()}.`, 'boa');
        confirmarDecisao();
        TO.estado.salvar();
        redesenhar();
      }]], 'media');
  }

  /* A IDEOLOGIA SOZINHA, numa tela dela. O botão "Definir ideologia"
     abria a Gestão inteira e deixava o que ele promete no rodapé. */
  function abrirIdeologia(){
    return modal('Ideologia', 'vale toda semana', caixaDeIdeologia(E()),
                 null, 'media');
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
    /* escalar treino à mão saiu: a diretoria sorteia e treina todo dia */
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
  }

  /* =======================================================
     ELENCO — dinheiro da torcida virando força do time
     (GDD V3 §19). O preço do ponto sobe com a força do clube:
     R$ 20 mil no time pequeno, R$ 320 mil no gigante.
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

    /* a cobrança no CT mora aqui: é conversa da torcida com o clube */
    const ap = TO.acoes.porId('pressionar');
    if(ap){
      const c3 = cartao('Pressionar o clube', 'cena no CT');
      c3.corpo.appendChild(linhaAcao(ap));
      pg.appendChild(c3);
    }
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
      {id:'patrimonio', rot:'Patrimônio'},
      {id:'elenco', rot:'Elenco'},
      {id:'transacoes', rot:'Transações'}
    ], subFin, id=>{subFin=id; redesenhar();}));

    if(subFin==='patrimonio'){ pintarPatrimonio(pg, e); return; }
    if(subFin==='elenco'){
      /* investir no clube tem aba própria (pedido do dono): estava
         escondido dentro do Patrimônio e ninguém achava */
      const comprar = (fn)=>{
        const r = fn();
        aviso(r.msg, r.ok?'boa':'ruim');
        if(r.ok) redesenhar();
      };
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
      pintarElenco(pg, e, oferta, comprar);
      return;
    }

    if(subFin==='transacoes'){
      const c = cartao('Transações', `${e.transacoes.length} lançamentos`+
        ' · comércio e festa fecham por mês');
      /* O MÊS CORRENTE À VISTA (pedido do dono, 18/08/2026): bar,
         loja e festa entram no caixa na hora mas só escrevem a linha
         no fechamento — enquanto o mês corre, o acumulado aparece
         aqui em cima, esmaecido, pra informação nenhuma sumir. */
      const rm = e.resumoMes || {};
      const pend = [];
      if(rm.comercio && (rm.comercio.rec || rm.comercio.des))
        pend.push({rot:'Comércio no mês corrente (bar, loja, subsede)',
                   v: Math.round(rm.comercio.rec - rm.comercio.des)});
      if(rm.festa && (rm.festa.rec || rm.festa.des))
        pend.push({rot:`Festas na sede no mês corrente (${rm.festa.n})`,
                   v: Math.round(rm.festa.rec - rm.festa.des)});
      for(const p of pend)
        c.corpo.appendChild(el('div',{class:'transacao pendente', html:
          `<span class="dia">mês</span>
           <span class="desc">${p.rot}
             <small>já no caixa · a linha fecha no fim do mês</small></span>
           <span class="val ${p.v<0?'negativo':p.v>0?'positivo':''}">`+
          `${U.dinheiro(p.v)}</span>`}));
      if(!e.transacoes.length && !pend.length)
        c.corpo.innerHTML='<div class="em-construcao">Nada ainda.</div>';
      for(const t of e.transacoes.slice(0,200)){
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
      btUlt = el('button',{class:'bt larga', texto:'Último fechamento do mês'});
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
           `${e.semanasNoVermelho} semana(s) — a moral sofre.</span></div>`
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
    const c5 = cartao('Compromissos da semana', 'decididos nas mensagens do feed');
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
      {id:'torcida',    rot:'Calendário da torcida'},
      {id:'expediente', rot:'Expediente da Sede'},
      {id:'time',       rot:'Agenda do time'}
    ], abaCal, id=>{ abaCal=id; redesenhar(); }));

    if(!e.temporada){
      pg.appendChild(emConstrucao('Sem calendário','Comece um jogo novo pra gerar a tabela.'));
      return;
    }
    if(abaCal==='expediente') pg.appendChild(painelExpediente(e));
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
        /* o expediente é o mesmo todo dia comum: mostra o 1º turno */
        const exp = TO.acoes.expediente(e);
        const id = exp.manha || exp.tarde || exp.noite;
        const a = id && TO.acoes.porId(id);
        if(a) cel.appendChild(el('span',{class:'acao',
          html:`${IC.get(a.icone)}<span>${a.nome}</span>`}));
      }
    }
    cel.className = 'dia ' + classes.join(' ');
    return cel;
  }

  /* ---------- aba 2: o expediente da sede ---------- */
  function painelExpediente(e){
    const cx = el('div');
    cx.appendChild(el('div',{class:'recado', html:
      `Defina o <b>Expediente da Sede</b>: três turnos por dia — manhã, `+
      `tarde e noite —, cada um com uma ação que a rapaziada toca sozinha.
       <small>Por ser diário, o rendimento é reduzido: recrutar traz menos `+
      `gente por turno, treinar treina menos membros. Dia de jogo do clube `+
      `e dias de caravana ficam de fora.</small>`}));

    const exp = TO.acoes.expediente(e);
    const disponiveis = TO.acoes.agendaveis();
    for(const t of TO.acoes.TURNOS){
      const linha = el('div',{class:'linha-rotina'});
      linha.appendChild(el('span',{texto:t.nome}));
      const sel = el('select',{class:'campo'});
      sel.appendChild(el('option',{value:'', texto:'— sem ação —'}));
      for(const a of disponiveis){
        const o = el('option',{value:a.id, texto:`${a.nome} — ${a.efeito}`});
        if(exp[t.id]===a.id) o.selected = true;
        sel.appendChild(o);
      }
      sel.onchange = ()=>{
        exp[t.id] = sel.value || null;
        TO.estado.salvar();
        redesenhar();
      };
      linha.appendChild(sel);
      cx.appendChild(linha);
    }
    /* o que rendeu nos últimos dias */
    const feitas = (e.acoes.feitas || []).slice(-9).reverse();
    if(feitas.length){
      const c = cartao('Últimos turnos');
      for(const f of feitas)
        c.corpo.appendChild(el('div',
          {class:'transacao'+(f.ok===false?' turno-falhou':''), html:
          `<span class="dia">S${f.semana}·d${f.dia}</span>
           <span class="desc">${f.msg||f.id}</span>`}));
      cx.appendChild(c);
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

  function pintarDiplomacia(){
    const e = E(), pg = U.$('.pagina[data-pag="diplomacia"]');
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Diplomacia'}));
    pg.appendChild(subabas([
      {id:'relacoes',    rot:'Relações'},
      {id:'aliancas',    rot:'Alianças'},
      {id:'rivalidades', rot:'Rivalidades'},
      {id:'ideologia',   rot:'Ideologia'}
    ], subDip, id=>{subDip=id; redesenhar();}));

    /* a ideologia mora aqui: é o padrão de como tratamos os outros */
    if(subDip === 'ideologia'){ pg.appendChild(caixaDeIdeologia(e)); return; }

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
      `<th style="width:28%">Torcida</th><th style="width:20%">Clube</th>
       <th style="width:28%">Relação</th>
       <th>Status</th><th>Ações</th>`})]));
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
      /* atacar o bar ou a sede dela, agora: abre a cena */
      const alvoCena = (TO.acoes.alvosDeAtaque(e) || [])
        .find(x=>x.torcidaId === l.id);
      const podeAtacar = !!alvoCena && l.valor < 0 &&
        TO.acoes.porId('atacar').disponivel(e).ok;
      botao('!', alvoCena ? `Atacar ${alvoCena.nome}` : 'Sem alvo na praça',
        podeAtacar, ()=>{
          const r = TO.acoes.executar(e, 'atacar', {alvo: alvoCena.id});
          if(r.ok && r.cena){ fecharPainel(); abrirAcaoEmCena(r.cena); }
          else aviso(r.msg || 'Não deu.', 'ruim');
        });
      tb.appendChild(tr);
    }
    tab.appendChild(tb);
    c.corpo.appendChild(tab);
    pg.appendChild(c);
  }

  /* =======================================================
     O TEMPO PARA POR MOTIVO, E O MOTIVO TEM NOME

     Aqui moravam DOIS relógios e dois conjuntos de motivos: o do tempo,
     que passa um dia por segundo no feed, e o da rua, que corria os
     minutos dentro do mapa. Com o mapa descontinuado sobrou um só, e
     com ele um conjunto só.

     `pausasT` é do relógio do tempo. Ele nasce correndo e para por:

     · `painel`  — o jogador está lendo uma tela de gestão, não jogando,
                   e um dia por segundo correndo atrás de uma tela opaca
                   é o jogo andando escondido;
     · `foco`    — aba sem foco congela o rAF sozinho; sem tratar isso
                   como pausa, o relógio SALTA quando a aba volta,
                   porque o primeiro quadro traz o tempo todo de fora;
     · `salvar`  — salvar no meio de um dia correndo pega o mundo pela
                   metade. O save não é bloqueado: ele pausa, salva e
                   devolve o dia de onde parou;
     · `cena`    — a briga abriu por cima do feed.

     A decisão sem resposta NÃO entra aqui, e isso é cicatriz: ela já
     entrou, um motivo ficou pra trás quando a resposta veio por um
     caminho que não o removia, e o jogo congelou com a tela limpa. A
     verdade da decisão é uma só e é `TO.feed.travado`.
     ======================================================= */
  const pausasT = new Set();

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
  /* O RITMO É DA MENSAGEM, NÃO DO DIA (decisão do autor): cada
     mensagem dropada segura a próxima por 1,5s. Dia sem mensagem passa
     rápido; decisão sem resposta trava tudo. */
  const MS_DROP      = TO.feed.INTERVALO_DROP;   // 1500 ms entre mensagens
  const MS_DIA_VAZIO = 450;                      // dia calado passa ligeiro
  let relogioTempo = null;

  function pausarTempo(motivo){
    pausasT.add(motivo);
    if(relogioTempo){ clearTimeout(relogioTempo); relogioTempo = null; }
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
    if(pausasT.size || TO.feed.travado(e0)) return;
    const tique = ()=>{
      relogioTempo = null;
      const e = E();
      if(!e || pausasT.size || TO.feed.travado(e)) return;
      const vel = TO.diaJogo.ponte.velocidade || 1;
      if(TO.feed.pendentes(e) > 0){
        TO.feed.dropar(e);
        pintarTopo(); atualizarFeed();
        if(TO.feed.travado(e)) return;         // decisão dropada: espera
        relogioTempo = setTimeout(tique, MS_DROP/vel);
        return;
      }
      passarUmDia(e);
      pintarTopo(); atualizarFeed();
      if(pausasT.size || TO.feed.travado(E())) return;
      relogioTempo = setTimeout(tique,
        (TO.feed.pendentes(E()) > 0 ? MS_DROP : MS_DIA_VAZIO)/vel);
    };
    relogioTempo = setTimeout(tique, MS_DIA_VAZIO);
  }

  /* um dia inteiro: a virada da data — os jogos do dia e as mensagens
     saem de dentro do estado */
  function passarUmDia(e){
    if(document.body.classList.contains('em-cena')) return null;
    TO.estado.avancarDia();
    return null;
  }

  /* =======================================================
     ESCALAÇÃO → CENA → RELATÓRIO
     ======================================================= */
  /* QUEM VAI É ESCOLHIDO PELO NÚMERO, não nome a nome: o jogador diz
     quantos emprega na missão e os mais rodados saem na frente. */

  /* o dia da guerra: o ataque que o jogador marcou vira cena */
  function abrirGuerra(args){
    const e = E();
    const p = TO.planejamento.plano(e);
    let r = null;
    if(args && args.tipo === 'fora')       r = TO.praca.encontroDaViagem(e);
    else if(args && args.tipo === 'praca') r = TO.praca.encontroDaPraca(e, args.dia);
    else                                   r = TO.praca.resolverIda(e);
    if(!r || !r.enc){
      /* o alvo não pisou na rua (banimento não existe mais, mas o
         efetivo pode ter minguado): a guerra esvazia sem briga */
      aviso('O bonde deles não apareceu. A noite passou em branco.', '');
      p.guerraJogada = true;
      return;
    }
    p.guerraJogada = true;
    abrirConfronto(e, r.enc);
  }

  /* o ataque sofrido de hoje vira a cena de defesa */
  function abrirDefesa(){
    const atq = E().ataqueMarcado;
    if(!atq || atq.resolvido){
      console.warn('[defesa] botão sem ataque marcado');
      return;
    }
    abrirAtaqueAoBar(atq);
  }

  /* A TRETA MARCADA (decisão do autor): briga combinada em rua, fora
     de dia de jogo, com efetivos IDÊNTICOS dos dois lados — 5×5, 7×7
     ou 10×10. Vitória: relação −2, prestígio +1 pro ganhador e −1 pro
     perdedor. */
  function abrirTreta(d){
    const e = E();
    if(!d || !d.rival) return;
    const rival = TO.mundo.torcida(d.rival) || {};
    const aptos = TO.membros.aptosParaOEstadio(e)
      .sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa));
    const n = Math.max(2, Math.min(d.tam || 5, aptos.length));
    const cN = TO.mundo.coresDaTorcida(e.torcida);
    const cR = TO.mundo.coresDaTorcida(rival);
    const local = TO.praca.ruaDaClasse(d.classe);
    const bondes = [
      {lado:'mandante', n, nossa:true, nome:e.torcida.nome,
       cor:cN.cor, cor2:cN.cor2, cor3:cN.cor3,
       sigla:TO.mundo.siglaTorcida(e.torcida)},
      {lado:'visitante', n, nossa:false, nome:rival.nome||'Rival',
       cor:cR.cor, cor2:cR.cor2, cor3:cR.cor3,
       sigla:TO.mundo.siglaTorcida(rival)||'RIV',
       perfil: perfilDe(d.rival)}
    ];
    $('telaDiaJogo').classList.remove('oculto');
    document.body.classList.add('em-cena');
    TO.estado.bloquear(true);
    pararTudo('cena');
    TO.diaJogo.ponte.montar({
      canvas: $('djPrincipal'),
      /* treta marcada é mano a mano: sem pedra, sem bomba, sem braço
         automático — de lado nenhum (decisão do dono) */
      config: { escalacao: aptos.slice(0, n), intencao:'atacar', bombas:0,
                semArmas:true, bondes, efetivoRival:n, local },
      aoTerminar: res => fecharDiaDeJogo(res, null,
        {acao:'treta', alvo:{torcidaId:d.rival, nome:rival.nome||'Rival',
                             bairro:d.bairro, cena:local, n}})
    });
    /* BRIGA COMBINADA NÃO TEM ESPERA: os dois lados vieram pra isso.
       O bonde deles sai da boca da rua já procurando o nosso — sem
       este alvo, a cena de encontro fica parada esperando o jogador
       dirigir, que é o comportamento das surpresas, não da treta. */
    const J = TO.diaJogo.ponte.J;
    if(J){
      const spawnsNossos = [...new Set(J.discos.filter(x=>x.doJogador)
                                               .map(x=>x.spawn))];
      const alvoDeles = spawnsNossos[0] || null;
      for(const s2 of [...new Set(J.discos.filter(x=>!x.doJogador)
                                          .map(x=>x.spawn))]){
        J.bondes[s2] = Object.assign(J.bondes[s2] || {id:s2},
          {humor:'atacar', agirEm:0, alvo:alvoDeles});
      }
      /* na treta ninguém é dono da casa esperando atrás do balcão: o
         spawn de rua nasce com `guarda`, e guarda parado não caça */
      for(const d2 of J.discos){ d2.guarda = false; d2.daCasa = false; }
      J.acordou = true;
      J.paz = false;
    }
  }

  /* A BRIGA DA ESCOLTA: nossos membros e os do aliado no mesmo lado,
     todos sob o controle do jogador (decisão do autor). */
  function abrirEscolta(d){
    const e = E();
    if(!d || !d.rival) return;
    const aliado = TO.mundo.torcida(d.aliado) || {};
    const rival  = TO.mundo.torcida(d.rival) || {};
    /* entrar na briga pelo aliado aproxima de vez — e conta como
       ajuda no relógio da convivência */
    if(d.aliado){
      e.relacoes[d.aliado] =
        U.limitar((e.relacoes[d.aliado]||0) + 10, -100, 100);
      TO.relacoes.marcarAjuda(e, d.aliado);
    }
    const cN = TO.mundo.coresDaTorcida(e.torcida);
    const cR = TO.mundo.coresDaTorcida(rival);
    const nossos = (d.escolta||6) + (d.aliados||10);
    const deles = Math.max(4, Math.round((((TO.relacoes.mundo(e)||{})[d.rival]
      || rival).membros || 30) * 0.5));
    const enc = {
      a:{torcida:e.torcida.id, nome:`${e.torcida.sigla} + ${aliado.nome||'aliado'}`,
         sigla:e.torcida.sigla, n:nossos,
         cor:cN.cor, cor2:cN.cor2, cor3:cN.cor3, nossa:true},
      b:{torcida:d.rival, nome:rival.nome||'Rival',
         sigla:TO.mundo.siglaTorcida(rival)||'RIV', n:deles,
         cor:cR.cor, cor2:cR.cor2, cor3:cR.cor3, nossa:false},
      local:'rua', bairro:'', nossa:true,
      /* a briga é DELES: o prestígio da noite vai pro aliado escoltado,
         não pra nós (decisão do dono, 17/08/2026) */
      escoltaAliado: d.aliado || null
    };
    abrirConfronto(e, enc);
  }

  /* =======================================================
     O ENCONTRO NA RUA
     Dois bondes hostis se encostam, o relógio para e a cena
     abre. Quem está no meio é quem estava no bonde, não a
     torcida inteira.
     ======================================================= */
  /* o perfil que gera a ficha dos discos rivais: cargos da fonte e
     poder da torcida (decisão do autor — força e defesa fiéis dos dois
     lados) */
  const perfilDe = id => {
    const o = id ? TO.mundo.torcida(id) : null;
    if(!o) return null;
    const viva = (TO.relacoes && TO.relacoes.mundo(E())[id]) || {};
    return {poder:o.poder, cargos:o.cargos,
            membros: viva.membros || o.membros || 60,
            /* a moral viva do mundo: a ficha gerada deles nasce da mesma
               régua que a nossa (indicador ±3), não de um 12 fixo */
            moral: viva.moral};
  };

  const LOCAL_ROT = {rua:'na rua', 'rua-media':'numa rua de classe média',
                     'rua-nobre':'numa rua de bairro nobre',
                     praca:'na praça', arredores:'nos arredores do estádio'};
  let encontroAberto = null;

  function abrirConfronto(e, enc){
    const nosso = enc.a.nossa ? enc.a : enc.b.nossa ? enc.b : null;
    const deles = nosso === enc.a ? enc.b : enc.a;
    if(!nosso){
      /* encontro sem nós não é cena — e também não é notícia sem crivo */
      console.warn('[confronto] encontro sem o jogador', enc);
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
    /* A FICHA VAI INTEIRA (decisão do autor): se saem 100, os 100 são
       membros de verdade, cada um com a própria força e defesa. */
    const aptos = TO.membros.aptosParaOEstadio(e)
      .sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa))
      .slice(0, Math.max(2, Math.round(nosso.n)));
    /* DE QUE LADO NÓS ENTRAMOS. Em casa somos o mandante, e foi assim
       desde sempre; atacando em viagem, nos arredores do estádio DELES,
       somos o visitante — que é o que a gente é: quem viajou. O
       encontro diz qual, e `combate.js` lê a marca `nossa` pra tudo
       que precisava saber "de que lado é o jogador" (§8.28). */
    const nossoLado = enc.nossoLado === 'visitante' ? 'visitante' : 'mandante';
    const outroLado = nossoLado === 'mandante' ? 'visitante' : 'mandante';
    const bondes = [
      {lado:nossoLado, n:nosso.n,
       cor:nosso.cor, cor2:nosso.cor2, cor3:nosso.cor3,
       sigla:nosso.sigla, nome:nosso.nome,  nossa:true},
      {lado:outroLado, n:deles.n,
       cor:deles.cor, cor2:deles.cor2, cor3:deles.cor3,
       sigla:deles.sigla, nome:deles.nome,  nossa:false,
       perfil: perfilDe(deles.torcida)}
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
    /* GUERRA É BRIGA MARCADA: os dois lados vieram pra isso. As cenas
       sobre foto marcam os spawns visitantes com `guarda`, e guarda
       parado espera o gatilho da casa — que só dispara com inimigo a
       170 px. Com os bondes nascendo a 500 px, medido, os 120 deles
       ficavam o tempo todo parados no canto do próprio spawn e a
       guerra era um impasse de 0 × 0. Mesmo tratamento da treta:
       ninguém é da casa, a cena nasce acordada e o bonde deles marcha
       pro nosso ponto. */
    const J = TO.diaJogo.ponte.J;
    if(J){
      const spawnsNossos = [...new Set(J.discos.filter(x=>x.doJogador)
                                               .map(x=>x.spawn))];
      const alvoDeles = spawnsNossos[0] || null;
      for(const s2 of [...new Set(J.discos.filter(x=>!x.doJogador)
                                          .map(x=>x.spawn))]){
        J.bondes[s2] = Object.assign(J.bondes[s2] || {id:s2},
          {humor:'atacar', agirEm:0, alvo:alvoDeles});
      }
      for(const d2 of J.discos){ d2.guarda = false; d2.daCasa = false; }
      J.acordou = true;
      J.paz = false;
    }
  }

  function fecharDiaDeJogo(res, enc, acao){
    TO.estado.bloquear(false);
    /* bomba jogada é bomba que não volta pro estoque (GDD §9.1) */
    const e = E();
    e.estoque = e.estoque || {bombas:0};
    e.estoque.bombas = Math.max(0, e.estoque.bombas - (res.bombasUsadas||0));
    /* na TRETA o prestígio é a conta do dono e só ela: +1 pro ganhador,
       −1 pro perdedor (fecharTreta). O prestígio genérico da noite não
       soma por cima. */
    if(acao && acao.acao === 'treta') res.prestigio = 0;
    /* O TAMANHO DO BONDE PESA NO PRESTÍGIO (decisão do autor): vitória
       em menor número vale mais, vitória esmagando em maior número
       vale menos. O fator é a razão entre os efetivos de abertura,
       preso entre 0,5× e 2×. */
    if(res.prestigio > 0 && res.efetivo){
      const meu = res.nossoLado || 'mandante';
      const outroL = meu === 'mandante' ? 'visitante' : 'mandante';
      const nossos = res.efetivo[meu] || 0, deles = res.efetivo[outroL] || 0;
      if(nossos > 0 && deles > 0)
        res.prestigio = U.limitar(Math.max(1, Math.round(
          res.prestigio * U.limitar(deles/nossos, 0.5, 2))), 1, 10);
    }
    /* NA ESCOLTA o prestígio da noite é do aliado atacado, não nosso
       (decisão do dono, 17/08/2026): a briga era dele, nós só fomos
       junto. O ganho vira relação melhor e um aliado mais respeitado. */
    if(enc && enc.escoltaAliado && res.prestigio){
      TO.relacoes.mover(e, enc.escoltaAliado, 'prestigio', res.prestigio/5);
      res.prestigio = 0;
    }
    const resumo = TO.membros.aplicarResultadoDaNoite(e, res);
    if(enc){
      /* o encontro da rua também é briga: o registro (e a mensagem de
         resultado) sai daqui, pela mesma porta das outras */
      TO.acoes.fecharBrigaDeRua(e, enc, res);
      encontroAberto = null;
    }
    const fecho = acao ? TO.acoes.fecharCena(e, acao, res) : null;
    /* o resultado da briga não espera o próximo tique: cai agora */
    while(TO.feed.pendentes(e) > 0 && !TO.feed.travado(e)) TO.feed.dropar(e);
    /* fechada a briga, o tempo volta a correr de onde parou */
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
    let n = Math.max(2, Math.round(efetivo || fila.length));
    /* teto do dono (18/08/2026): atacando bar, no máximo 60 na cena */
    if(cena.acao === 'atacar' && cena.alvo && cena.alvo.tipo === 'bar')
      n = Math.min(n, 60);
    /* a ficha vai inteira: cada disco nosso é um membro de verdade */
    const aptos = fila.slice(0, n);
    /* só o NOSSO lado vem como bonde: quem defende continua se
       espalhando pelos pontos que a cena declarou — no bar são a porta e
       o fundo do salão, e juntar os dois num canto só mudaria a planta
       da cena, não o efetivo dela */
    /* a cena de ação também é a nossa torcida na tela: as duas cores dela
       vêm do mesmo lugar que as do mapa */
    const cores = TO.mundo.coresDaTorcida(e.torcida);
    const bondes = [{lado:'mandante', n, nossa:true, nome:e.torcida.nome,
                     cor: cores.cor, cor2: cores.cor2, cor3: cores.cor3,
                     sigla: TO.mundo.siglaTorcida(e.torcida)}];
    $('telaDiaJogo').classList.remove('oculto');
    document.body.classList.add('em-cena');
    TO.estado.bloquear(true);
    pararTudo('cena');
    const p = TO.planejamento.plano(e);
    /* a identidade do rival: o bar é DA torcida, não uma torcida —
       as cores e o nome dos defensores são da dona (correção do dono,
       18/08/2026) */
    const donoAlvo = cena.alvo && cena.alvo.torcidaId
      ? TO.mundo.torcida(cena.alvo.torcidaId) : null;
    const cDono = donoAlvo ? TO.mundo.coresDaTorcida(donoAlvo) : null;
    TO.diaJogo.ponte.montar({
      canvas: $('djPrincipal'),
      config: { escalacao: aptos, intencao:'atacar', bondes,
                bombas: p.bombas,
                efetivoRival: cena.efetivoRival, local: cena.cena,
                rival: donoAlvo ? {nome:donoAlvo.nome,
                  cor:cDono.cor, cor2:cDono.cor2, cor3:cDono.cor3} : null,
                perfilRival: perfilDe(cena.alvo && cena.alvo.torcidaId) },
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

     A EMBOSCADA NA ESTRADA usa a mesma função, com dois desvios. O
     CENÁRIO É EMPRESTADO: ela abre a rua de classe baixa (`rua`) porque
     cena própria de rodovia não existe — e isto está escrito aqui de
     propósito, porque cenário emprestado sem nota vira, seis meses
     depois, "por que a emboscada na BR abre uma rua de periferia?". E o
     nosso efetivo é QUEM EMBARCOU NA CARAVANA, não um quarto da torcida:
     quem ficou na cidade não está na estrada pra apanhar.

     Quem cobra é o fecho da cena, uma vez só: `ataquesContraNos` já não
     lançou dinheiro nem feriu ninguém para o alvo que tem cena. */
  function abrirAtaqueAoBar(atq){
    const e = E();
    const o = TO.mundo.torcida(atq.torcida);
    const naEstrada = atq.alvo === 'emboscada';
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
    /* na estrada vai quem embarcou; no bar, um quarto da turma de pé;
       na concentração e na pista, o bonde inteiro do dia de jogo */
    const est = naEstrada ? TO.planejamento.estimativaCaravana(e) : null;
    const noDiaDeJogo = atq.alvo === 'concentracao' || atq.alvo === 'pista';
    /* teto do dono (18/08/2026): defesa do NOSSO bar bota no máximo
       40 no salão; o atacante traz no máximo 60 (cap logo abaixo) */
    const noBar = !naEstrada && !noDiaDeJogo;
    let nossos = naEstrada
      ? Math.max(2, (est && est.vao) || Math.round(fila.length * 0.25))
      : noDiaDeJogo ? Math.max(2, fila.length)
      : Math.max(2, Math.round(fila.length * 0.25));
    if(noBar) nossos = Math.min(nossos, 40);
    /* QUEM VEM ATACAR TRAZ A TURMA QUE O SERVIÇO PEDE. Os 30% fixos
       criavam a cena-farsa: atacante grande o bastante pra passar no
       filtro de geração ainda chegava com um terço do nosso bonde e
       corria por minoria na largada. Agora ele traz no mínimo os 30%
       de sempre, sobe até ~90% do nosso efetivo na cena se tiver gente,
       e nunca mais de 70% da torcida dele. Atacante gigante segue
       vindo com muito mais que a gente. */
    const membrosDeles = TO.acoes.efetivoDe(e, o || {}) || 40;
    let deles = Math.max(4, Math.max(
      Math.round(membrosDeles * 0.30),
      Math.min(Math.round(membrosDeles * 0.70), Math.round(nossos * 0.9))));
    if(noBar) deles = Math.min(deles, 60);
    const c1 = TO.mundo.coresDaTorcida(e.torcida);
    const c2 = TO.mundo.coresDaTorcida(o || {});
    /* no bar a gente é a casa e nasce no salão (lado `visitante`); na
       estrada não há casa — quem desce a rua atrás da gente são eles, e
       o nosso ônibus é que foi fechado, então os papéis se invertem */
    const nosso  = naEstrada ? 'mandante'  : 'visitante';
    const outro  = naEstrada ? 'visitante' : 'mandante';
    const aptos = fila.slice(0, nossos);
    const bondes = [
      {lado:nosso, n:nossos, nossa:true, nome:e.torcida.nome,
       cor:c1.cor, cor2:c1.cor2, cor3:c1.cor3,
       sigla:TO.mundo.siglaTorcida(e.torcida)},
      {lado:outro, n:deles, nossa:false, nome:(o&&o.nome)||'Rival',
       cor:c2.cor, cor2:c2.cor2, cor3:c2.cor3,
       sigla:o?TO.mundo.siglaTorcida(o):'RIV',
       perfil: perfilDe(atq.torcida)}
    ];
    atq.resolvido = true;
    $('telaDiaJogo').classList.remove('oculto');
    document.body.classList.add('em-cena');
    TO.estado.bloquear(true);
    pararTudo('cena');
    const p = TO.planejamento.plano(e);
    TO.diaJogo.ponte.montar({
      canvas: $('djPrincipal'),
      config: { escalacao: aptos, intencao:'atacar', paz:false, bombas:p.bombas,
                efetivoRival: deles, local: atq.cena || 'bar', bondes },
      aoTerminar: res => fecharDiaDeJogo(res, null,
        {acao:'defender', alvo:{tipo:atq.alvo || 'bar', torcidaId:atq.torcida,
                                nome:(o&&o.nome)||'Rival',
                                nossos, rateio: est && est.rateio,
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
    if(fecho && (fecho.linhas||[]).length){
      cx.appendChild(el('div',{class:`fecho-cena ${fecho.ganhou?'boa':'ruim'}`,
        html:(fecho.linhas||[]).map(l=>`<small>${l}</small>`).join('')}));
    }
    if(resumo.feridos.length){
      cx.appendChild(el('div',{class:'titulo-pagina',
        texto:'Feridos — de 5 a 15 dias fora',
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
  }

  /* =======================================================
     LIGAÇÃO
     ======================================================= */
  /* O ESTADO MUDOU.
     Durante o laço do tempo a tela não é remontada: escrever o
     cabeçalho e acrescentar as mensagens novas basta, e remontar a
     lista inteira uma vez por segundo faria a rolagem saltar embaixo do
     dedo de quem está lendo o que passou. */
  TO.estado.aoMudar(()=>{
    if(!E()) return;
    /* MUDANÇA DE ESTADO É ESCRITA, NÃO REMONTAGEM. Virar o dia não muda
       a estrutura da tela: muda o cabeçalho e acrescenta mensagens. Isto
       chamava `redesenhar()` fora do laço do relógio, e `redesenhar`
       refaz a barra, os treze ícones do menu e os sessenta cartões — uns
       cinco mil nós por dia. No jogo real isso passava despercebido
       porque o relógio segurava o caminho leve; na bateria, que chama
       `passarUmDia` na mão, vinte temporadas somavam dezenas de milhões
       de nós e a aba morria de memória no meio da medição.
       Remontagem de verdade tem dono: `abrirPainel`, `fecharPainel` e
       quem mexe em opção chamam `redesenhar()` de propósito. */
    pintarTopo();
    atualizarFeed();
  });

  /* ABA SEM FOCO É PAUSA EXPLÍCITA.
     O `requestAnimationFrame` congela sozinho quando a aba perde o
     foco, e o primeiro quadro na volta traz o tempo todo que passou
     fora — o relógio saltaria. Tratando como pausa, o `ultimo` do laço
     é zerado na volta e nenhum minuto é cobrado do tempo em outra aba. */
  const pararTudo  = m => pausarTempo(m);
  const soltarTudo = m => retomarTempo(m);
  addEventListener('blur', ()=>pararTudo('foco'));
  addEventListener('focus', ()=>soltarTudo('foco'));
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden) pararTudo('foco'); else soltarTudo('foco');
  });
  /* O FECHAMENTO DA SEMANA. Três coisas que já moraram na mesma linha e
     hoje se separam, porque só uma delas é opcional.

     · SALVAR é sempre. O autosave já esteve pendurado no mesmo `;` do
       `abrirFechamento`, e desligar o modal teria desligado o save
       junto — o jeito mais silencioso de perder uma temporada.
     · AS DUAS MENSAGENS são do `TO.feed.fecharSemana`: o resumo com o
       valor da semana, ou o alarme que para o tempo. Uma ou outra.
     · O MODAL É SÓ ESCOLHA. A chave em Opções e o botão "Último
       fechamento" no Financeiro. NUNCA MAIS ABRE SOZINHO — nem na
       semana grave, que agora é a mensagem de decisão. */
  TO.estado.aoFecharSemana((rel, e)=>{
    e = e || E();
    TO.estado.salvar();
    /* o modal do mês, só pra quem ligou a chave */
    if(opc(e).relatorio && rel.mes) abrirFechamento(rel.mes);
  });
  $('btSelecionarTorcida').onclick = ()=>{
    if(!escolhida) return;
    TO.estado.novo({torcida: escolhida});
    entrarNoJogo(true);
  };
  $('btAvancarSelecao').onclick = ()=>{ if(escolhida) irParaPasso(2); };
  /* o mesmo botão volta um passo, e do primeiro volta pro menu */
  $('btVoltarMenu').onclick = ()=>{
    if(passoSel === 2){ irParaPasso(1); return; }
    $('telaSelecao').classList.add('oculto');
    $('telaMenu').classList.remove('oculto');
  };
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
     existem aqui: passar um dia, responder uma mensagem pelo mesmo
     caminho do clique, parar e soltar o relógio.
     Reimplementar isso no teste seria medir outro jogo — o teste passaria
     e o jogo continuaria quebrado. Nada aqui é chamado pelo jogo. */
  TO.tela = {
    passarUmDia, responderMensagem, pintarFeed, atualizarFeed, redesenhar,
    rodarTempo, pausarTempo, retomarTempo, tempoPausado, opc,
    get pausasDoTempo(){ return [...pausasT]; },
    abrirPainel, fecharPainel, get painel(){ return painel; },
    resolverIda: e => TO.praca.resolverIda(e || E()),
    abrirCaravana, abrirAtaque, abrirIdeologia,
    abrirGuerra, abrirDefesa, abrirEscolta, abrirTreta, abrirAcaoEmCena
  };

  montarMenu();
})();
