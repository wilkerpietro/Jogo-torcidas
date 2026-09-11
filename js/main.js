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
  function escudo(cores, sigla, classe, marca){
    /* com escudo de verdade no manifesto (['c', clubeId] ou
       ['t', torcidaId]), a imagem entra no lugar do gradiente —
       ordem do dono de 02/09/2026, inclusive na seleção */
    const src = marca && escudoDe(marca[0], marca[1]);
    if(src){
      const i = el('img',{class:'escudo escudo-img '+(classe||'')});
      i.src = src; i.alt = sigla || '';
      return i;
    }
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
    /* CONTINUAR ABRE A VAGA MAIS RECENTE (dono, 23/08/2026), e não mais
       só a do autosave: com seis vagas, "continuar" tem de ser o último
       jogo que o jogador tocou, venha da vaga que vier. */
    bc.onclick = ()=>{
      const v = TO.estado.saveMaisNovo();
      if(v && TO.estado.carregarDe(v)) return entrarNoJogo();
      if(TO.estado.carregar()) return entrarNoJogo();
      alert('O save guardado não abriu — pode ser de outra versão do jogo.');
    };
    $('btNovoJogo').onclick = abrirSelecao;
    $('btCarregar').onclick = abrirCofreNoMenu;
    $('arquivoSave').onchange = ev=>{
      const f = ev.target.files[0];
      if(f) TO.estado.importar(f, r=>{
        if(r.ok) entrarNoJogo(); else alert('Não deu pra importar: '+r.motivo);
      });
    };
    /* o alarme do armazenamento aparece já na abertura: quem vai jogar
       cinco anos precisa saber ANTES se o navegador guarda ou não */
    const d = TO.estado.diagnostico();
    const lista = $('menuLista');
    if(!d.ok && lista && !$('menuAlarme')){
      const av = el('div',{class:'save-alarme', id:'menuAlarme'});
      av.innerHTML = `<b>Este navegador não guarda o save.</b>`+
                     `<span>${d.motivo}</span>`;
      lista.parentNode.insertBefore(av, lista.nextSibling);
    }
  }

  /* o cofre visto do menu: as vagas, o arquivo e o texto, antes de
     existir partida nenhuma */
  function abrirCofreNoMenu(){
    const cx = el('div');
    const lista = el('div',{class:'menu-vagas'});
    const pintar = ()=>{
      lista.innerHTML = '';
      const vagas = TO.estado.listarSaves().filter(v=>!v.vazia);
      if(!vagas.length){
        lista.appendChild(el('p',{class:'nota', texto:
          'Nenhuma vaga ocupada neste navegador. Dá pra trazer um save '+
          'de arquivo ou de texto aqui embaixo.'}));
        return;
      }
      for(const v of vagas){
        const l = el('div',{class:'save-vaga'});
        const q = v.quando ? new Date(v.quando) : null;
        l.appendChild(el('div',{class:'save-rot', html:
          `<b>${v.auto?'Autosave':'Vaga '+v.vaga}</b>`+
          `<small>${v.torcida} · ${v.clube||'—'}</small>`}));
        l.appendChild(el('div',{class:'save-quando', html:
          `<span>semana ${v.semana} de ${v.ano}</span>`+
          `<small>${q ? `${String(q.getDate()).padStart(2,'0')}/`+
            `${String(q.getMonth()+1).padStart(2,'0')}` : ''}</small>`}));
        const bts = el('div',{class:'save-bts'});
        const ler = el('button',{class:'bt destaque', texto:'Jogar'});
        ler.onclick = ()=>{
          if(TO.estado.carregarDe(v.vaga)){ fechar(); entrarNoJogo(); }
          else alert('Esse save não abriu — pode ser de outra versão.');
        };
        bts.appendChild(ler);
        l.appendChild(bts);
        lista.appendChild(l);
      }
    };
    pintar();
    cx.appendChild(lista);

    const fora = el('div',{class:'save-saida'});
    fora.appendChild(el('div',{class:'save-rot', html:
      '<b>De fora do navegador</b><small>arquivo .json ou texto '+
      'compactado</small>'}));
    const bts = el('div',{class:'save-bts'});
    const bArq = el('button',{class:'bt', texto:'De arquivo'});
    bArq.onclick = ()=>$('arquivoSave').click();
    bts.appendChild(bArq);
    const bTxt = el('button',{class:'bt', texto:'De texto'});
    bTxt.onclick = ()=>{
      const c2 = el('div');
      c2.appendChild(el('p',{class:'nota', texto:'Cole o texto do save.'}));
      const ta = el('textarea',{class:'save-texto'});
      ta.placeholder = 'TO2z:…';
      c2.appendChild(ta);
      modal('Colar um save', '', c2, [['Carregar', ()=>{
        TO.estado.deTexto(ta.value).then(r=>{
          if(!r.ok){ alert('Não deu: '+r.motivo); return; }
          fechar(); entrarNoJogo();
        });
      }]], 'larga');
    };
    bts.appendChild(bTxt);
    fora.appendChild(bts);
    cx.appendChild(fora);

    const fechar = modal('Carregar jogo', 'as vagas deste navegador',
                         cx, [], 'larga');
  }

  /* =======================================================
     SELEÇÃO DE TORCIDA — DOIS PASSOS (régua do dono, 23/08/2026)

     PASSO 1: país, liga e clube na MESMA tela, em três colunas que se
     encadeiam — escolher o país filtra as ligas, escolher a liga filtra
     os clubes. É uma decisão só, tomada de uma vez, e o jogador vê o
     caminho inteiro sem trocar de tela.

     PASSO 2: qual das torcidas daquele clube, com a ficha ao lado.

     Antes era uma lista única de 139 torcidas com uma fileira de abas
     por divisão. Com dez países e 356 clubes aquilo virava um paredão.
     ======================================================= */
  let buscaSel = '';
  let selPais = null, selLiga = null, selClube = null, escolhida = null;
  let passoSel = 1;

  function abrirSelecao(){
    $('telaMenu').classList.add('oculto');
    $('telaSelecao').classList.remove('oculto');
    selPais = selLiga = selClube = escolhida = null;
    buscaSel = ''; passoSel = 1;
    pintarSelecao();
  }

  function irParaPasso(n){ passoSel = n; buscaSel = ''; pintarSelecao(); }

  const torcidasJogaveis = () => TO.mundo.selecionaveis();
  const torcidasDoClube = id => torcidasJogaveis()
    .filter(o=>o.clubeId===id).map(TO.mundo.ficha)
    .sort((a,b)=>b.membros-a.membros);

  function paisesComTorcida(){
    const conta = {};
    for(const t of TO.mundo.todosTimes){
      const p = TO.competicoes.paisDe(t);
      conta[p] = conta[p] || {pais:p, clubes:0, torcidas:0};
      conta[p].clubes++;
    }
    for(const o of torcidasJogaveis()){
      const t = TO.mundo.time(o.clubeId);
      const p = t ? TO.competicoes.paisDe(t) : 'Brasil';
      if(conta[p]) conta[p].torcidas++;
    }
    return Object.values(conta).sort((a,b)=>
      (b.torcidas - a.torcidas) || (a.pais < b.pais ? -1 : 1));
  }

  function ligasDoPais(pais){
    const conta = {};
    for(const t of TO.mundo.todosTimes){
      if(TO.competicoes.paisDe(t) !== pais) continue;
      const d = t.divisao || '—';
      conta[d] = conta[d] || {liga:d, clubes:0, torcidas:0};
      conta[d].clubes++;
    }
    for(const o of torcidasJogaveis()){
      const t = TO.mundo.time(o.clubeId);
      if(!t || TO.competicoes.paisDe(t) !== pais) continue;
      if(conta[t.divisao]) conta[t.divisao].torcidas++;
    }
    return Object.values(conta).sort((a,b)=>(a.liga < b.liga ? -1 : 1));
  }

  function clubesDaLiga(pais, liga){
    return TO.mundo.todosTimes
      .filter(t=>TO.competicoes.paisDe(t)===pais && t.divisao===liga)
      .map(t=>({time:t, torcidas: torcidasDoClube(t.id).length}))
      .sort((a,b)=> (b.torcidas - a.torcidas) ||
                    (a.time.nome < b.time.nome ? -1 : 1));
  }

  /* uma coluna do passo 1 */
  function coluna(titulo, conta, itens, montar){
    const c = el('div',{class:'sel-coluna'});
    c.appendChild(el('div',{class:'sel-cab', html:
      `<b>${titulo}</b><span>${conta}</span>`}));
    const rolo = el('div',{class:'sel-rolo'});
    if(!itens.length) rolo.appendChild(el('div',{class:'sel-vazio',
      texto:'escolha ao lado'}));
    for(const it of itens) rolo.appendChild(montar(it));
    c.appendChild(rolo);
    return c;
  }

  const linhaSel = (cls, esq, nm, cid, dir, off, aoClicar)=>{
    const b = el('button',{class:'torcida-opcao'+(cls||'')+(off?' off':'')});
    b.disabled = !!off;
    if(esq) b.appendChild(esq);
    b.appendChild(el('div',{html:`<div class="nm">${nm}</div>`+
      (cid ? `<div class="cid">${cid}</div>` : '')}));
    if(dir) b.appendChild(el('span',{class:'qt-membros', html:dir}));
    b.onclick = aoClicar;
    return b;
  };
  /* o selo do país na seleção: a bandeira do banco quando há, a sigla
     escrita quando não (ordem do dono, 02/09/2026) */
  const selo = pais => {
    const d = el('div',{class:'sel-bandeira'});
    const img = bandeira(pais);
    if(img) d.innerHTML = img;
    else d.textContent = pais.slice(0,3).toUpperCase();
    return d;
  };

  function pintarSelecao(){
    const p2 = passoSel === 2 && selClube;
    $('passo1Sel').classList.toggle('oculto', !!p2);
    $('passo2Sel').classList.toggle('oculto', !p2);
    $('btAvancarSelecao').classList.toggle('oculto', !!p2);
    $('btAvancarSelecao').disabled = !selClube;
    $('btSelecionarTorcida').classList.toggle('oculto', !p2);
    $('btSelecionarTorcida').disabled = !escolhida;
    $('btVoltarMenu').textContent = p2 ? 'Voltar' : 'Voltar ao menu';
    $('abasSelecao').innerHTML = '';

    const sub = $('subSelecao');
    if(!p2){
      sub.textContent = `passo 1 de 2 · país, liga e clube · `+
        `${TO.mundo.todosTimes.length} clubes em 10 países`;
      pintarPasso1();
      return;
    }
    sub.textContent = `passo 2 de 2 · ${selClube.nome} · escolha a torcida`;
    pintarPasso2();
  }

  /* ---------- PASSO 1: três colunas encadeadas ---------- */
  function pintarPasso1(){
    const h = document.querySelector('#passo1Sel .cartao h2');
    if(h && h.firstChild) h.firstChild.textContent = 'Onde você torce ';
    const cx = $('listaTorcidas'); cx.innerHTML = '';
    const grade = el('div',{class:'sel-tres'});

    const paises = paisesComTorcida();
    grade.appendChild(coluna('País', `${paises.length}`, paises, p=>
      linhaSel(selPais===p.pais?' on':'', selo(p.pais),
        p.pais, `${p.clubes} clubes`,
        p.torcidas ? `${p.torcidas}<small>torcidas</small>`
                   : `<small>sem torcidas</small>`,
        !p.torcidas,
        ()=>{ selPais = p.pais; selLiga = null; selClube = null;
              escolhida = null; pintarSelecao(); })));

    const ligas = selPais ? ligasDoPais(selPais) : [];
    grade.appendChild(coluna('Liga', selPais ? `${ligas.length}` : '', ligas, l=>
      linhaSel(selLiga===l.liga?' on':'', null,
        l.liga.replace('Brasileirão ',''), `${l.clubes} clubes`,
        l.torcidas ? `${l.torcidas}<small>torcidas</small>`
                   : `<small>sem torcidas</small>`,
        !l.torcidas,
        ()=>{ selLiga = l.liga; selClube = null; escolhida = null;
              pintarSelecao(); })));

    const clubes = (selPais && selLiga) ? clubesDaLiga(selPais, selLiga) : [];
    const lista = clubes.filter(c=>!buscaSel ||
      (c.time.nome + c.time.cidade).toLowerCase()
        .includes(buscaSel.toLowerCase()));
    const colC = coluna('Clube', selLiga ? `${lista.length}` : '', lista, c=>
      linhaSel(selClube && selClube.id===c.time.id?' on':'',
        /* `escudo` quer o ARRAY de cores; `coresDaTorcida` devolve
           {cor, cor2, cor3} e não se desestrutura */
        escudo(c.time.cores, c.time.sigla || c.time.nome.slice(0,3),
          null, ['c', c.time.id]),
        c.time.nome, `${c.time.cidade}${c.time.uf?' - '+c.time.uf:''}`,
        c.torcidas ? `${c.torcidas}<small>${c.torcidas===1?'torcida':'torcidas'}</small>`
                   : `<small>sem torcida</small>`,
        !c.torcidas,
        ()=>{ selClube = c.time; escolhida = null;
              const t = torcidasDoClube(c.time.id);
              /* clube de uma torcida só não tem o que escolher: já
                 entra no passo 2 com ela na mão */
              if(t.length === 1) escolhida = t[0];
              pintarSelecao(); }));
    if(selLiga){
      const bs = el('input',{class:'busca', type:'search',
        placeholder:'clube ou cidade…'});
      bs.value = buscaSel;
      bs.oninput = ev=>{ buscaSel = ev.target.value; pintarPasso1(); };
      colC.insertBefore(bs, colC.lastChild);
    }
    grade.appendChild(colC);
    cx.appendChild(grade);
  }

  /* ---------- PASSO 2: qual torcida do clube ---------- */
  function pintarPasso2(){
    const cxF = $('fichaTorcida'); cxF.innerHTML = '';
    $('contaTorcidas').textContent = '';
    const lista = torcidasDoClube(selClube.id);
    if(lista.length > 1){
      const cx = el('div',{class:'sel-torcidas'});
      for(const f of lista){
        cx.appendChild(linhaSel(escolhida && escolhida.id===f.id?' on':'',
          escudo(f.cores, TO.mundo.sigla(f), null, ['t', f.id]), f.nome,
          `${f.cidade} - ${f.uf} · fundada em ${f.fundacao}`,
          `${U.numero(f.membros)}<small>membros</small>`, false,
          ()=>{ escolhida = f; pintarSelecao(); }));
      }
      cxF.appendChild(cx);
    }
    if(!escolhida){
      cxF.appendChild(el('p',{class:'nota',
        texto:'Escolha uma das torcidas acima pra ver a ficha.'}));
      return;
    }
    montarFicha(cxF, escolhida);
  }

  function montarFicha(cxF, f){
    const cab = el('div',{class:'ficha-torcida'});
    cab.appendChild(escudo(f.cores, TO.mundo.sigla(f), null, ['t', f.id]));
    cab.appendChild(el('div',{html:
      `<h3>${f.nome}</h3>
       <span>${f.clube} · ${f.cidade} - ${f.uf} · fundada em ${f.fundacao}</span>`}));
    cxF.appendChild(cab);

    /* o efetivo que a torcida realmente tem, cargo a cargo (GDD §5.1) */
    const nivelSede = Math.max(f.sedeNivel||1,
      TO.membros.nivelQueCabe(f.membros, (f.cargos||{}).diretoria || 0));
    const plano = TO.membros.planoDeCargos(f.membros, f.cargos, nivelSede);
    const barras = el('div',{class:'hierarquia-fina'});
    for(const [cargo, n] of plano){
      barras.appendChild(el('div',{html:
        `<span>${TO.membros.CARGOS[cargo].nome}</span>
         <i style="width:${Math.round(n/f.membros*100)}%"></i>
         <b>${n}</b>`}));
    }
    cxF.appendChild(barras);

    /* A FICHA SÓ DIZ O QUE É VERDADE (limpeza pedida pelo dono,
       22/08/2026). Saíram quatro números e um endereço:
       · **Finanças** mostrava o saldo guardado no arquivo (R$ 200),
         e o jogo começa com `max(4000, saldo×4)` — o número na tela
         não era o dinheiro com que se joga.
       · **Influência** e **Territórios** eram fórmulas do próprio
         efetivo (territórios = membros ÷ 16) que não entram em conta
         nenhuma do jogo: dois algarismos dizendo de novo o que a linha
         "Membros" já dizia.
       · **Mapa da cidade** contava quarteirões de um mapa que foi
         descontinuado.
       · **Bairro da sede** é trivia na hora de escolher: o nome do
         bairro só ganha sentido depois, dentro do jogo.
       A **rivalidade máxima** ficou, mudada: agora é o rival de
       efetivo mais próximo do nosso (ver `rivalPareado`), com o
       tamanho dele ao lado — é o que responde "com quem eu vou brigar
       de igual pra igual". */
    cxF.appendChild(el('div',{class:'grade-atributos', html:
      `<div><span>Membros</span><b>${U.numero(f.membros)}</b></div>
       <div><span>Sede</span><b>nível ${nivelSede}</b></div>
       <div><span>Prestígio</span><b>${f.prestigio}/100</b></div>
       <div><span>Divisão</span><b>${f.divisao||'—'}</b></div>
       <div><span>Estádio</span><b>${f.estadio||'—'}</b></div>
       <div><span>Aliados / Rivais</span><b>${f.qtdAliados} / ${f.qtdRivais}</b></div>
       <div class="largo"><span>Rivalidade máxima</span><b>${f.rival}`+
       `${f.rivalMembros ? ` <small>${U.numero(f.rivalMembros)} membros</small>`
                         : ''}</b></div>`}));
  }

  /* =======================================================
     ENTRADA NO JOGO
     ======================================================= */
  /* os sete itens que o dono do jogo apontou — e mais nenhum */
  const NAV = [
    /* o feed com ícone próprio (pedido do dono, 07/09/2026): o
       megafone era um alto-falante genérico e não dizia "início" */
    {id:'feed',        rot:'Feed',        ic:'feed'},
    {id:'torcida',     rot:'Torcida',     ic:'torcida'},
    {id:'financeiro',  rot:'Financeiro',  ic:'dinheiro'},
    {id:'calendario',  rot:'Calendário',  ic:'calendario'},
    {id:'competicoes', rot:'Competições', ic:'trofeu'},
    {id:'ranking',     rot:'Ranking',     ic:'medalha'},
    {id:'diplomacia',  rot:'Diplomacia',  ic:'diplomacia'},
    {id:'noticias',    rot:'Notícias',    ic:'jornal'},
    /* O COFRE DE SAVES tem lugar na coluna (pedido do dono, 23/08/2026):
       salvar estava atrás de um Ctrl+S que ninguém adivinha, e uma
       partida de cinco anos precisa de porta com placa. */
    {id:'jogo',        rot:'Jogo',        ic:'disquete'}
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
    /* na cena de cima, boneco no lugar do disco — em todas as cenas
       (pedido do dono, 06/09/2026: o formato da bancada "Cenas de
       Briga de Cima" entra no jogo) */
    if(e.opcoes.bonecos === undefined) e.opcoes.bonecos = true;
    /* a rua vista de perto (tres.js) existe, mas não abre sozinha:
       o jogo é o de cima; a de perto liga por opção do save */
    if(e.opcoes.briga3d === undefined) e.opcoes.briga3d = false;
    return e.opcoes;
  }

  function entrarNoJogo(partidaNova){
    $('telaMenu').classList.add('oculto');
    $('telaSelecao').classList.add('oculto');
    $('jogo').classList.remove('oculto');
    /* lote de brigas que ficou aberto num save (a aba fechou no meio
       do dia): sai agora, senão as próximas brigas seriam engolidas */
    if(TO.feed.fecharLote) TO.feed.fecharLote(E());
    TO.feed.ganchos.aoChegarMensagem = (e, m)=>{
      atualizarBadges();
      /* com a aba Mensagens aberta a lista já mostra o recado: sem balão */
      if(painel === 'noticias' && subNoticias === 'mensagens'){ redesenhar(); return; }
      balaoNoIcone('noticias', `Mensagem de ${m.nome}`);
    };
    TO.feed.ganchos.aoSairTreta = (e, m)=>{
      atualizarBadges();
      if(painel === 'noticias' && subNoticias === 'tretas'){ redesenhar(); return; }
      const b = (m.dados||{}).b || {};
      balaoNoIcone('noticias', b.nome ? `Treta com a ${b.nome}` : 'Saiu a notícia da treta');
    };
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
      const b = el('button',{class:'mapa-ic', 'data-pag':n.id,
        html: IC.get(n.ic) + '<i class="ic-badge" hidden></i>'});
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
        html:`${IC.get(n.ic)}<span>${n.rot}</span><i class="ic-badge" hidden></i>`});
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
    noticias:pintarNoticias,
    jogo:pintarJogo
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
    /* fechar a tela de ataque sem confirmar cancela também o Simular:
       senão a marca ficava de pé e a PRÓXIMA briga saía simulada sem
       ninguém ter pedido */
    simularProxima = false;
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
  function caixaDeIdeologia(e, comBotao){
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
      /* O EFEITO DE CADA ESCOLHA, POR ESCRITO (pedido do dono,
         19/08/2026): a linha abaixo do seletor explica o que a opção
         selecionada faz, e troca junto com a seleção. */
      const nota = el('small',{class:'fraco pol-nota'});
      const explicar = ()=>{
        const it = itens.find(x=>x.id === sel.value) || itens[0];
        nota.textContent = it.nota || '';
      };
      explicar();
      sel.onchange = ()=>{ pend[rot] = ()=>aplicar(sel.value); explicar(); };
      d.appendChild(sel);
      d.appendChild(nota);
      cx.appendChild(d);
    };
    const pol = P.politicas(e);
    grupo('Nosso jogo', P.POLITICA_ATAQUE, pol.jogo,
          id=>P.definirPolitica(e, 'jogo', id));
    grupo('Aliados na cidade',
          P.RECEPCAO.map(r=>({id:r.id, rot:r.rot,
            nota:(r.porCabeca ? `R$ ${r.porCabeca} por cabeça · ` : 'de graça · ')+
                 `${r.relacao>0?'+':''}${r.relacao} de relação com o aliado — ${r.nota}`})),
          P.recepcaoPadrao(e) || 'nada',
          id=>P.definirRecepcaoPadrao(e, id === 'nada' ? 'nada' : id));
    grupo('Outros jogos na cidade', P.POLITICA_ATAQUE, pol.outros,
          id=>P.definirPolitica(e, 'outros', id));
    cx.appendChild(el('div',{class:'linha-dado', html:
      '<span class="fraco">O olheiro sempre pergunta antes de cada jogo. '+
      'O botão "Seguir padrão" da mensagem executa o que está definido '+
      'aqui.</span>'}));

    /* UM BOTÃO SÓ, e é ele que confirma. Aberta como tela, quem carrega
       esse botão é o rodapé do modal — daí a caixa saber salvar sem ter
       botão nenhum dentro dela. */
    cx.salvar = ()=>{
      for(const fn of Object.values(pend)) fn();
      TO.estado.salvar();
      redesenhar();
    };
    if(comBotao !== false){
      const bt = el('button',{class:'bt destaque', texto:'Salvar'});
      bt.onclick = ()=>{ cx.salvar(); aviso('Ideologia salva.', 'boa'); };
      const rod = el('div',{class:'pol-rodape'});
      rod.appendChild(bt);
      cx.appendChild(rod);
    }
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
  /* AS NOTÍCIAS DE TRETA SAÍRAM DO FEED (pedido do dono, 08/09/2026): o
     Fim da noite já conta a briga; a página do Futebol e Porrada mora em
     Notícias → Tretas. A história (`e.feed`) continua com elas — é só o
     rolo do feed que não as desenha. */
  const feedVisivel = e => (e.feed || []).filter(m => m.kind !== 'confronto');
  let noFeedLista = null, noFeedTopo = null, noFeedQuando = null, noFeedTicker = null;
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
    txtQuando.title = 'Data do jogo — o dia corre sozinho; um painel aberto ou uma decisão pendente param o tempo';
    const bDia = el('button',{class:'mapa-ic', html:'<span class="rot">≫</span>'});
    bDia.title = 'Empurrar o dia: passa pro dia seguinte sem esperar';
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
    bVel.title = `Velocidade do tempo (vale pro dia e pra briga) — agora em ${TO.diaJogo.ponte.velocidade}×; clique pra alternar 1×/2×`;
    bVel.onclick = ()=>{ TO.diaJogo.ponte.alternarVelocidade(); redesenhar(); };
    if(TO.diaJogo.ponte.velocidade > 1) bVel.classList.add('aceso');
    barra.append(noFeedTopo, noFeedQuando, bVel);

    const rolo = el('div',{class:'feed-rolo'});
    noFeedLista = el('div',{class:'feed-lista'});
    rolo.appendChild(noFeedLista);
    const hist = feedVisivel(e);
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
    /* O TICKER VOLTOU (pedido do dono, 08/09/2026): a fita de manchetes
       logo abaixo do cabeçalho, com as notícias da nossa torcida e do
       nosso clube na frente. Quem a enche é `atualizarTicker`. */
    noFeedTicker = el('div',{class:'feed-ticker', html:
      `<span class="ticker-rot">Últimas</span>`+
      `<div class="ticker-caixa"><div class="ticker-fita"></div></div>`});
    noFeedTicker.addEventListener('click', ev=>{
      const a = ev.target.closest('.ticker-item');
      if(!a) return;
      subNoticias = a.dataset.aba || 'arquivo';
      abrirPainel('noticias');
    });
    tickerAss = null;
    corpo.append(barra, noFeedTicker, rolo);
    pg.append(montarMenuIcones('feed-menu'), corpo);
    atualizarFeed();
    pintarTopo();
  }

  /* =======================================================
     O TICKER DE MANCHETES (pedido do dono, 08/09/2026)
     Uma fita abaixo do cabeçalho com as manchetes das principais
     notícias dos últimos dias. A ordem é de prioridade: primeiro
     as da NOSSA torcida (a manchete do Futebol e Porrada de cada
     treta nossa) e do NOSSO clube (a manchete do jornal da rodada),
     depois o que fala de nós de tabela (almanaque, LNT, brigas na
     nossa praça) e por fim o resto do país. Os jornais são montados
     de molde determinístico, então montar de novo aqui dá o mesmo
     texto que o cartão; mesmo assim a manchete de cada mensagem
     fica guardada por id pra não refazer página a cada tique.
     Clicar numa manchete abre Notícias na aba certa.
     ======================================================= */
  const TICKER_DIAS = 21, TICKER_MAX = 10, TICKER_PX_S = 42;
  const tickerManchetes = new Map();
  const tickerEsc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let tickerAss = null, tickerMemoria = null;
  function mancheteDe(e, m){
    if(tickerManchetes.has(m.id)) return tickerManchetes.get(m.id);
    let r = null;
    try{
      const pg = m.kind === 'confronto' && TO.porrada ? TO.porrada.montar(e, m)
        : m.kind === 'rodada' && TO.gazeta ? TO.gazeta.montar(e, m)
        : (m.kind === 'lnt-fundacao' || m.kind === 'lnt-fim') && TO.porrada && TO.porrada.montarLNT
          ? TO.porrada.montarLNT(e, m)
        : m.kind === 'almanaque' ? (m.dados || {}).pagina
        : null;
      if(pg && pg.manchete)
        r = {texto: String(pg.manchete).replace(/<[^>]+>/g,'').trim(),
             aba: m.kind === 'confronto' ? 'tretas' : 'arquivo'};
    }catch(_){ r = null; }
    tickerManchetes.set(m.id, r);
    if(tickerManchetes.size > 400)
      tickerManchetes.delete(tickerManchetes.keys().next().value);
    return r;
  }
  function manchetesDoTicker(e){
    const abs = e.data.absoluto || 0;
    const nomeT = e.torcida.nome, clube = TO.mundo.time(e.torcida.clubeId);
    const nomeC = clube ? clube.nome : '';
    const falaDeNos = t => (nomeT && t.includes(nomeT)) || (nomeC && t.includes(nomeC));
    /* SÓ O NOSSO PAÍS (pedido do dono, 08/09/2026): nada de outros países
       na fita; e dentro dele, a nossa cidade na frente. O país mora no
       clube (`time.pais`, Brasil por padrão), então torcida → clube → país. */
    const paisDe = id => { const o = id && TO.mundo.torcida(id);
                           const t = o && TO.mundo.time(o.clubeId);
                           return (t && t.pais) || 'Brasil'; };
    const nossoPais = paisDe(e.torcida.id);
    const daCidade = id => { const o = id && TO.mundo.torcida(id); return !!o && o.mapa === e.torcida.mapa; };
    const itens = [];
    for(const m of (e.feed || [])){
      const idade = abs - ((m.quando || {}).abs || 0);
      if(idade > TICKER_DIAS) break;
      const h = mancheteDe(e, m);
      if(!h) continue;
      /* a nossa treta e o nosso jogo vêm na frente; o almanaque e a
         LNT só quando falam de nós; o resto fecha a fita */
      const prio = m.kind === 'confronto' || m.kind === 'rodada' ? 0
                 : (m.tipo === 'boa' || m.tipo === 'ruim' || falaDeNos(h.texto)) ? 1 : 2;
      itens.push({texto:h.texto, aba:h.aba, prio, abs:(m.quando||{}).abs||0});
    }
    /* as brigas do país: as da nossa praça primeiro, e das outras só
       as maiores — a fita é de manchete, não de boletim */
    const diasAno = TO.competicoes.SEMANAS_ANO * 7;
    const recentes = (e.brigasIA || []).slice(0, 40).filter(b => b && b.a && b.b)
      .sort((x,y) => ((y.a.n||0)+(y.b.n||0)) - ((x.a.n||0)+(x.b.n||0)));
    for(const b of recentes){
      const bAbs = ((b.ano || e.data.ano) - 2026) * diasAno + ((b.semana||1)-1)*7 + ((b.dia||1)-1);
      const idade = abs - bAbs;
      if(idade > TICKER_DIAS || idade < 0) continue;
      if(paisDe(b.a.id) !== nossoPais && paisDe(b.b.id) !== nossoPais) continue;
      const daPraca = daCidade(b.a.id) || daCidade(b.b.id);
      itens.push({aba:'brigas', prio: daPraca ? 1 : 2, abs:bAbs,
        texto:`${b.revanche ? 'Revanche: ' : ''}${b.a.nome} e ${b.b.nome} se pegaram em ${b.cidade || 'algum lugar'}`+
              `${b.vencedor && !/ningu/i.test(b.vencedor) ? `: a ${b.vencedor} levou a melhor` : ''}`+
              `${b.pano ? ` e ficou com a ${b.pano.tipo} da ${b.pano.de}` : ''}`});
    }
    itens.sort((x,y)=> x.prio - y.prio || y.abs - x.abs);
    /* o resto do país fecha a fita, mas não a toma: no máximo quatro */
    let resto = 0;
    return itens.filter(it => it.prio < 2 || ++resto <= 4).slice(0, TICKER_MAX);
  }
  function atualizarTicker(){
    const e = E();
    if(!e || !noFeedTicker || !noFeedTicker.isConnected) return;
    const caixa = noFeedTicker.querySelector('.ticker-caixa');
    const fita = noFeedTicker.querySelector('.ticker-fita');
    if(!caixa || !fita) return;
    const larg = caixa.clientWidth;
    if(!larg) return;                         // sem layout: tenta no próximo tique
    const ass = `${(e.feed[0]||{}).id}|${e.feed.length}|${(e.brigasIA||[]).length}|${larg}`;
    if(ass === tickerAss) return;
    tickerAss = ass;
    const itens = manchetesDoTicker(e);
    noFeedTicker.hidden = !itens.length;
    if(!itens.length) return;
    const copia = itens.map(it =>
      `<a class="ticker-item${it.prio===0?' nossa':''}" data-aba="${it.aba}">${tickerEsc(it.texto)}</a>`).join('');
    /* a fita é duas metades iguais e anda meia volta: emenda sem salto.
       Cada metade precisa cobrir a caixa, senão aparece o vão */
    /* A FITA NÃO RECOMEÇA DO ZERO (correção do dono, 09/09/2026): depois
       do jogo o feed solta várias mensagens em seguida, e a cada uma a
       fita era refeita e a animação voltava pro início — o jogador só
       via a cabeça (as manchetes novas) e nunca chegava às anteriores.
       Agora a fração andada é guardada e devolvida depois da troca. */
    const anim = fita.getAnimations ? fita.getAnimations()[0] : null;
    let fracao = 0;
    if(anim && anim.effect && anim.currentTime > 200){
      const durAntes = anim.effect.getTiming().duration || 1;
      fracao = (anim.currentTime / durAntes) % 1;
    } else if(tickerMemoria){
      /* a fita foi remontada (o feed repintou): continua de onde a
         anterior estava, contando o tempo que passou */
      fracao = (tickerMemoria.fracao + (performance.now() - tickerMemoria.t)/1000/tickerMemoria.dur) % 1;
    }
    fita.innerHTML = copia;
    const umaVez = Math.max(1, fita.scrollWidth);
    const n = Math.max(1, Math.ceil(larg / umaVez));
    fita.innerHTML = copia.repeat(n * 2);
    const dur = Math.max(12, (fita.scrollWidth / 2) / TICKER_PX_S);
    fita.style.animationDuration = `${dur.toFixed(1)}s`;
    const anim2 = fita.getAnimations ? fita.getAnimations()[0] : null;
    if(anim2 && fracao > 0){
      try{ anim2.currentTime = fracao * dur * 1000; }catch(_){}
    }
    tickerMemoria = {fracao, dur, t: performance.now()};
  }

  /* o estado visível de uma mensagem: enquanto ele não muda, o nó dela
     no DOM não precisa ser refeito */
  /* O ITINERÁRIO É UM ESTADO DA MENSAGEM (correção do dono, 20/08/2026):
     enquanto a linha do dia está andando dentro do cartão, o estado é
     um só — assim o cartão NÃO é repintado no meio do caminho e a linha
     não perde nem os cartões abertos nem o relógio da partida. Sem isto
     `atualizarFeed` pulava a mensagem e a linha nunca chegava nela. */
  /* a linha do dia que está andando, e as que já encerraram — estas
     ficam desenhadas na mensagem como registro. Nada disso vai pro
     save: é DOM, e DOM não se serializa. */
  let ITN = null;      // {it, msg, ponto, travado, timer, esperando, raiz}
  const itnProntos = {};

  const estadoDaMsg = (e, m) =>
    (ITN && ITN.msg && ITN.msg.id === m.id) ? 'itn'
    : itnProntos[m.id] ? 'itn-fim'
    /* o jornal aberto é estado da mensagem: sem isso o repinte do feed
       montava o cartão de novo e a página voltava a fechar */
    : m.kind === 'rodada' ? (m.gzAberto ? 'gz-aberto' : 'gz')
    : m.kind === 'confronto' ? (m.ppAberto ? 'pp-aberto' : 'pp')
    /* a lista de aniversários responde aliada por aliada: cada resposta
       muda o cartão antes de a mensagem inteira fechar */
    : m.kind === 'aniversarios'
      ? 'aniv-'+(((m.dados||{}).lista||[]).filter(x=>x.resposta).length)+
        (m.respondido ? '-fim' : '')
    /* o planejamento de segunda muda por dentro do cartão: a chave
       carrega o que o plano diz, e a aba aberta */
    : m.kind === 'semana'
      ? 'sem-'+(m.respondido ? 'fim' : chaveDoPlano(e))+'-'+(m.abaSemana||'')
    : m.respondido ? (m.respondido.rot || m.respondido.botao || 'sim')
    : (m.kind === 'partida' && m.dados && m.dados.iniciada) ? 'aovivo' : '';

  function atualizarFeed(){
    const e = E();
    if(!e || !noFeedLista || !noFeedLista.isConnected) return;
    const hist = feedVisivel(e).slice(0, tetoFeed);
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
                    status:'Relação', intermediacao:'Aproximação',
                    pacificacao:'Fim de treta',
                    eixo:'Eixo de aliança', 'eixo-convite':'Eixo de aliança',
                    'eixo-proposta':'Eixo de aliança',
                    guerra:'Dia de jogo',
                    sofrido:'Ataque sofrido', escolta:'Aliados',
                    aniversario:'Aniversário', aniversarios:'Aniversários do mês',
                    barrival:'Bar rival',
                    provocacao:'Provocação', dica:'Dica',
                    /* `placar` fica só por causa de save antigo: a
                       mensagem deixou de ser criada em 22/08/2026 */
                    confronto:'Confronto', placar:'Resultado',
                    rodada:'Rodada', partida:'Nossa partida',
                    assalto:'Assalto', brigas:'Brigas da semana',
                    semana:'Planejamento da semana',
                    itinerario:'Dia de jogo'};

  /* =======================================================
     A PARTIDA AO VIVO (decisão do dono, 17/08/2026)
     O cartão vira uma barra de minutos: 4 minutos de jogo por
     segundo real em 1× (22 s a partida; em 4×, o padrão, uns 6 s) —
     o dobro do que era (pedido do dono, 08/09/2026). Os gols já
     estão sorteados
     em dados.gols; cada um aparece quando a barra alcança o
     minuto dele. Aos 90' o cartão apita: fecha a decisão no
     feed e o relógio das mensagens volta a correr.
     ======================================================= */
  const MIN_POR_SEG = 4;   // era 2: o tempo real da partida dobrou (dono, 08/09/2026)

  /* =======================================================
     A CHANCE DE O CLIMA SUBIR (pedido do dono, 19/08/2026)
     Por minuto de jogo, a arquibancada tem uma chance de subir
     um degrau — tranquilo → esquentando → tenso. Quem manda é a
     PIOR relação entre as torcidas presentes: clássico de ódio
     esquenta rápido, jogo de neutros quase nunca. E a regra que
     vem antes de todas: se tem ALIADO nosso no estádio, o clima
     fica tranquilo o jogo inteiro — ninguém briga com irmão na
     arquibancada.

     As chances por minuto correm contra os 90 minutos do jogo, e
     como TENSO precisa de dois degraus, o que interessa é a chance
     de dois acertos em 90 rolagens. Na régua do dono (20/08/2026):

       maior rival  3,5%/min → esquenta 96% · TENSO 83%
       rival quente 3,0%/min → esquenta 94% · TENSO 76%
       rival        2,0%/min → esquenta 84% · TENSO 54%
       neutro       1,0%/min → esquenta 60% · TENSO 23%
     ======================================================= */
  function chanceDeClima(e, d){
    const vazio = {pMin:0, temAliado:false, pior:0, rivais:0};
    if(!e || !d) return vazio;
    /* AS IRMÃS DE CLUBE NÃO ENTRAM NA CONTA. Elas vão a TODO jogo do
       nosso time — contá-las como "aliado presente" travaria o clima
       em tranquilo pra sempre e o recurso nasceria morto. Quem pesa é
       a torcida do OUTRO clube: é com ela que a arquibancada se pega. */
    const meuClube = (TO.mundo.torcida(e.torcida.id) || e.torcida).clubeId;
    const outras = (d.presenca || []).filter(p => {
      if(!p.id || p.id === e.torcida.id) return false;
      const o = TO.mundo.torcida(p.id);
      return !o || o.clubeId !== meuClube;
    });
    if(!outras.length) return vazio;
    const rel = p => TO.relacoes.nivel(e, p.id);
    /* aliado do outro clube na arquibancada: ninguém se pega com quem
       anda junto, e o jogo inteiro fica tranquilo (régua do dono) */
    const temAliado = outras.some(p => rel(p) >= 20 ||
      (TO.mundo.saoIrmas && TO.mundo.saoIrmas(e.torcida.id, p.id)));
    if(temAliado) return {pMin:0, temAliado:true, pior:0, rivais:outras.length};
    const pior = Math.min(...outras.map(rel));
    /* 40% a menos em toda arquibancada (dono, 08/09/2026): era
       0,035 / 0,030 / 0,020 / 0,010 por minuto */
    let pMin = (pior <= -70 ? 0.035
             : pior <= -55 ? 0.030
             : pior <= -15 ? 0.020 : 0.010) * TO.relacoes.FREIO_BRIGA;
    /* BONDE MUITO MENOR NÃO COMPRA BRIGA (régua do dono, 22/08/2026):
       quando eles chegam com 40% do nosso número ou menos — ou seja,
       são 60% menores —, a chance de a arquibancada se pegar cai pela
       METADE. Não é que não aconteça; é que quem está em muito menor
       número na casa dos outros pensa duas vezes antes de começar.
       A conta é de quem ESTÁ no estádio, não de quem tem ficha: o que
       decide é o tamanho das duas torcidas na arquibancada. */
    const nossaPresenca = (d.presenca || [])
      .filter(p => p.id === e.torcida.id)
      .reduce((t, p) => t + (p.n || 0), 0);
    const deles = outras.reduce((t, p) => t + (p.n || 0), 0);
    const minoria = nossaPresenca > 0 && deles > 0 &&
                    deles <= nossaPresenca * 0.4;
    if(minoria) pMin = pMin / 2;
    return {pMin, temAliado:false, pior, rivais:outras.length,
            minoria, nossos:nossaPresenca, deles};
  }

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

  /* `aoApitar` é do itinerário: a linha do dia só segue depois do
     apito final (régua do dono, 20/08/2026), então quem desenha a
     partida avisa quando ela acaba. */
  function widgetPartida(m, aoApitar){
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
    /* O CLIMA DO ESTÁDIO (pedido do dono, 19/08/2026): um cartão
       abaixo do placar — TRANQUILO, ESQUENTANDO, TENSO. Sobe conforme
       o jogo anda; rival de relação muito ruim na casa esquenta mais
       rápido; aliado presente segura o clima em tranquilo. TENSO abre
       a arquibancada. */
    const climaEl = el('div',{class:'partida-clima clima-0',
      texto:'Clima do estádio: TRANQUILO'});
    caixa.append(placar, linha, climaEl, eventos);

    const chance = chanceDeClima(E(), d);
    const pMin = chance.pMin;
    if(!d.clima) d.clima = {nivel:0, min:0};
    const ROT_CLIMA = ['TRANQUILO', 'ESQUENTANDO', 'TENSO'];
    const pintarClima = ()=>{
      climaEl.className = 'partida-clima clima-' + d.clima.nivel;
      climaEl.textContent = 'Clima do estádio: ' + ROT_CLIMA[d.clima.nivel];
    };
    pintarClima();

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

    let penCena = null;   /* a grade da disputa, se o jogo for pra ela */

    const tm = setInterval(()=>{
      if(!caixa.isConnected){ clearInterval(tm); return; }
      const min = minutoDaPartida(d);
      /* OS PÊNALTIS SÃO PARTE DO JOGO (régua do dono, 21/08/2026):
         empatou no mata-mata, a disputa sai aqui mesmo, cobrança a
         cobrança, na mesma lista dos gols — sem tela separada. Enquanto
         a série corre o relógio fica parado em 90': a barra cheia, o
         clima congelado e o apito esperando a última cobrança. */
      const naSerie = !d.penFim && min >= 90 && !d.pausada &&
                      !!d.pen && !!(d.pen.cobrancas||[]).length;
      if(naSerie && d.penDesde == null) d.penDesde = Date.now();
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

      /* A DISPUTA DE PÊNALTIS, NO PLACAR (régua do dono, 22/08/2026):
         não é linha de texto por cobrança — é a grade de bolas
         enchendo, uma por vez, com o placar da série subindo do lado.
         QUEM CONTA É A MENSAGEM, e não este nó: o feed repinta a
         qualquer momento, e uma contagem presa no fechamento morria
         junto com o cartão trocado. Com `penDesde` guardado no estado,
         o cartão novo nasce com a grade já pintada até onde estava. */
      if(d.pen && d.penDesde != null){
        const cb = d.pen.cobrancas || [];
        const passou = Math.floor((Date.now() - d.penDesde) / PEN_PASSO);
        d.penAte = Math.min(cb.length, Math.max(0, passou));
        if(!eventos.querySelector('.pen-abre'))
          eventos.appendChild(el('div',{class:'partida-gol pen pen-abre',
            texto:'Fim do tempo normal — vai pros pênaltis.'}));
        if(!penCena){
          penCena = cenaDePenaltis(d);
          caixa.insertBefore(penCena, eventos);
        }
        penCena.pintar(d.penAte);
        if(d.penAte >= cb.length && passou > cb.length) d.penFim = true;
        if(d.penFim) penCena.fim();
      }
      /* o clima anda minuto a minuto, junto com a barra */
      if(!d.pausada && !m.respondido && !naSerie){
        while(d.clima.min < min && d.clima.nivel < 2){
          d.clima.min++;
          if(pMin && U.rng() < pMin) d.clima.nivel++;
        }
        d.clima.min = Math.max(d.clima.min, min);
        pintarClima();
        /* UMA BRIGA DE ARQUIBANCADA POR JOGO: depois da primeira a PM
           fica no setor, o clima cai pra "esquentando" e não sobe de
           novo — sem esta trava a mesma partida abriria a cena a cada
           vez que o dado batesse em tenso outra vez. */
        if(d.clima.nivel >= 2 && !d.clima.aberto && !d.clima.brigou){
          d.clima.aberto = true;
          /* O CLIMA TENSO PAUSA O RELÓGIO (régua do dono, 20/08/2026).
             A partida NÃO acaba aqui: ela espera a briga terminar e
             volta a correr de onde parou. O relógio pausa pela mesma
             porta do botão de pausa, então minuto nenhum se perde. */
          pontoDeControle(d);
          d.pausada = true;
          eventos.appendChild(el('div',{class:'partida-gol',
            texto:`${min}' · A arquibancada se pegou — o jogo espera.`}));
          setTimeout(()=>comEscolhaDeBriga(sim=>{
            simularProxima = sim;
            abrirBrigaNoEstadio(m, ()=>{
            /* de volta da briga: a PM baixa o clima e a bola volta a
               rolar. Sem baixar, o gatilho reabriria a cena no quadro
               seguinte. */
              d.clima.nivel = 1; d.clima.aberto = false; d.clima.brigou = true;
              pontoDeControle(d);
              d.pausada = false;
              pintarClima();
            });
          }), 1100);
          return;
        }
      }
      /* PARTIDA PAUSADA NÃO APITA: com a arquibancada aberta o relógio
         está parado, e o apito final tem de esperar a briga acabar */
      if(min >= 90 && !d.pausada && !naSerie){
        clearInterval(tm);
        fecharPartida();
      }
      function fecharPartida(){
        setTimeout(()=>{
          const e = E();
          TO.feed.encerrarPartida(e, m.id);
          TO.estado.salvar();
          if(aoApitar) aoApitar();
          else {
            atualizarFeed();
            pintarTopo();
            if(!TO.feed.travado(e)) retomarTempo('decisao');
          }
        }, 600);
      }
    }, 250);
    return caixa;
  }

  /* o compasso da disputa dentro da partida */
  const PEN_PASSO = 850;   // ms entre uma cobrança e a próxima

  /* =======================================================
     A GRADE DA DISPUTA (régua do dono, 22/08/2026): a disputa
     não abre tela nenhuma — ela mora dentro do cartão da
     partida ao vivo, logo abaixo do placar. Duas fileiras de
     bolas, uma por cobrança, enchendo de verde quem converteu
     e riscando de vermelho quem perdeu, com o placar da série
     subindo em cima. Tudo desenhado a partir do estado da
     mensagem, pra que o cartão trocado num repinte nasça com
     a grade em dia.
     ======================================================= */
  function cenaDePenaltis(d){
    const cb = (d.pen && d.pen.cobrancas) || [];
    const cena = el('div',{class:'partida-pen'});
    cena.appendChild(el('div',{class:'pen-onde', texto:'disputa de pênaltis'}));

    const placar = el('div',{class:'pen-placar'});
    const grade  = el('div',{class:'pen-grade'});
    const recado = el('div',{class:'pen-recado', texto:'Vai bater…'});

    /* AS DUAS FILEIRAS TÊM AS MESMAS VAGAS (correção do dono,
       24/08/2026): uma bolinha por cobrança REAL entregava o fim antes
       da primeira batida — 5 vagas de um lado e 4 do outro só existem
       quando a série acabou no 5º do primeiro. As vagas agora são
       iguais (5, ou mais se a série alongou) e a que ninguém usou
       fica vazia: não precisou bater. */
    const vagas = Math.max(5,
      cb.filter(k=>k.lado==='c').length,
      cb.filter(k=>k.lado==='f').length);
    const fileira = lado => {
      const l = el('div',{class:'pen-lado'});
      l.appendChild(el('span',{class:'pen-time',
        texto: lado === 'c' ? d.casa : d.fora}));
      const bolas = el('div',{class:'pen-bolas'});
      for(let k=0;k<vagas;k++)
        bolas.appendChild(el('i',{class:'pen-bola'}));
      l.appendChild(bolas);
      return l;
    };
    const lc = fileira('c'), lf = fileira('f');
    grade.append(lc, lf);

    let gc = 0, gf = 0, feitas = 0;
    const contados = {c:0, f:0};
    const pintarSerie = ()=>{
      placar.innerHTML =
        `<span class="t">${d.casa}</span><b>${gc}</b>`+
        `<b>${gf}</b><span class="t">${d.fora}</span>`;
    };
    pintarSerie();
    cena.append(placar, grade, recado);

    /* pintar(n) é IDEMPOTENTE: só mexe no que ainda falta, então dá
       pra chamar a cada quadro do relógio sem repintar a grade
       inteira — e sem matar a animação da bola que acabou de cair */
    cena.pintar = n => {
      while(feitas < Math.min(n, cb.length)){
        const k = cb[feitas++];
        const bolas = (k.lado === 'c' ? lc : lf).querySelectorAll('.pen-bola');
        const b = bolas[contados[k.lado]++];
        if(b) b.className = 'pen-bola ' + (k.marcou ? 'fez' : 'errou');
        if(k.marcou){ if(k.lado === 'c') gc++; else gf++; }
        pintarSerie();
        recado.textContent = `${k.lado === 'c' ? d.casa : d.fora} — `+
          (k.marcou ? 'na rede!' : 'perdeu!');
        recado.className = 'pen-recado ' + (k.marcou ? 'fez' : 'errou');
      }
    };
    cena.fim = ()=>{
      cena.pintar(cb.length);
      const venc = d.pen.c > d.pen.f ? d.casa : d.fora;
      const alto = Math.max(d.pen.c, d.pen.f);
      const baixo = Math.min(d.pen.c, d.pen.f);
      recado.textContent = `${venc} passa nos pênaltis, por ${alto} a ${baixo}.`;
      recado.className = 'pen-recado fim';
    };
    return cena;
  }

  /* =======================================================
     O CLIMA FICOU TENSO: A ARQUIBANCADA SE PEGA
     (pedido do dono, 19/08/2026). A partida fecha no placar já
     simulado e a cena do estádio da capacidade abre com TODAS
     as torcidas presentes, cada uma no seu SETOR: 1º escalão é
     a maior torcida do clube na praça, 2º a seguinte, e assim
     vai — e isso vira quando uma passa a outra. Os efetivos
     são os da linha de presença da mensagem. O fecho usa a
     tabela do dono (fecharEstadio, em acoes.js).
     ======================================================= */
  /* quem espera a briga da arquibancada acabar pra voltar a correr */
  let voltarDaArquibancada = null;

  const SETORES_ESTADIO = {
    'estadio-10': {mandante:3, visitante:2},
    'estadio-20': {mandante:3, visitante:3},
    'estadio-40': {mandante:2, visitante:3}
  };
  function abrirBrigaNoEstadio(m, aoVoltar){
    const e = E();
    const d = m && m.dados;
    /* A BRIGA É AGENDADA COM 1,1 s DE ATRASO — o tempo do aviso "a
       arquibancada se pegou" aparecer. Nesse intervalo a partida pode
       ter acabado por outro caminho (fim de jogo, save carregado,
       feed limpo): mensagem já respondida não abre cena nenhuma. */
    if(!e || !d || m.respondido) return;
    /* A PARTIDA NÃO ACABA AQUI (régua do dono, 20/08/2026): antes ela
       era encerrada no primeiro soco da arquibancada e o placar
       congelava aos 63'. Agora ela está PAUSADA — quem apita é o
       relógio, aos 90. */
    m.consequencia = (m.consequencia || '') +
      ' O clima azedou e a arquibancada se pegou.';
    /* quem ficou quieto entra na consequência mais abaixo, depois de
       a gente saber quem é aliado de quem */
    /* quem abre a arquibancada pausa a partida — vale pra quem chega
       pelo relógio do widget e pra quem chama esta função direto */
    if(!d.pausada){ pontoDeControle(d); d.pausada = true; }
    voltarDaArquibancada = aoVoltar || null;
    const pres = (d.presenca || []).filter(p => p.id);
    const nossos = pres.filter(p => p.casa === !!d.somosCasa)
      .sort((a,b) => b.n - a.n);
    /* o maior rival presente é o alvo, antes da maior torcida (dono,
       08/09/2026); entre iguais, a maior */
    const mr = p => TO.relacoes.ehMaiorRival(e, e.torcida.id, p.id) ? 1 : 0;
    const deles = pres.filter(p => p.casa !== !!d.somosCasa)
      .sort((a,b) => mr(b) - mr(a) || b.n - a.n);
    if(!deles.length || !nossos.some(p => p.id === e.torcida.id)){
      /* sem rival na casa (ou nós nem fomos): nada abre, e a bola
         volta a rolar na hora */
      voltarDaArquibancada = null;
      if(aoVoltar) aoVoltar();
      TO.estado.salvar(); atualizarFeed();
      if(!TO.feed.travado(e)) retomarTempo('decisao');
      return;
    }
    const local = cenaDoEstadio(e);
    const setores = SETORES_ESTADIO[local] || {mandante:3, visitante:3};
    const nossoLado = d.somosCasa ? 'mandante' : 'visitante';
    const outroLado = d.somosCasa ? 'visitante' : 'mandante';
    /* mais torcidas que setores: as menores se juntam no último */
    const compacta = (lista, teto)=>{
      const fica = lista.slice(0, Math.max(1, teto)).map(p=>Object.assign({}, p));
      for(const extra of lista.slice(Math.max(1, teto)))
        fica[fica.length-1].n += extra.n;
      return fica;
    };
    /* =====================================================
       ALIADA NÃO DESCE (régua do dono, 20/08/2026)

       A arquibancada esquentou e a gente vai pra cima do rival.
       Outra torcida do NOSSO clube que seja aliada de verdade
       de quem está do outro lado não entra: Fortaleza × Flamengo,
       a TUF cai em cima da Jovem Fla e a Jovem Garra Tricolor,
       aliada da Jovem Fla, fica quieta na cadeira dela.

       Vale só pras OUTRAS: a nossa torcida vai porque o jogador
       mandou ir. E o teste é contra a torcida que a gente vai
       enfrentar — a maior do outro lado —, não contra qualquer
       uma que esteja no estádio.
       ===================================================== */
    const alvo = deles[0];
    const quietas = [];
    const desce = p =>{
      if(p.id === e.torcida.id || !alvo) return true;
      const r = TO.relacoes.relacaoDelas(e, p.id, alvo.id);
      if(r < TO.relacoes.ALIADO) return true;
      quietas.push({nome:p.nome, de:alvo.nome, relacao:Math.round(r)});
      return false;
    };
    const nossosVao = nossos.filter(desce);
    /* se TODA a nossa ala for aliada deles, a nossa desce sozinha */
    const nossosSet = compacta(nossosVao.length ? nossosVao
      : nossos.filter(p => p.id === e.torcida.id), setores[nossoLado]);
    const delesSet  = compacta(deles,  setores[outroLado]);
    const bondeDe = (p, lado)=>{
      const o = TO.mundo.torcida(p.id) || {nome:p.nome};
      const c = TO.mundo.coresDaTorcida(o);
      return {lado, n:p.n, nossa: p.id === e.torcida.id, id:p.id,
              nome:o.nome || p.nome, cor:c.cor, cor2:c.cor2, cor3:c.cor3,
              sigla:TO.mundo.siglaTorcida(o),
              perfil: p.id === e.torcida.id ? null : perfilDe(p.id)};
    };
    const bondes = [...nossosSet.map(p => bondeDe(p, nossoLado)),
                    ...delesSet.map(p => bondeDe(p, outroLado))];
    if(quietas.length){
      const q = quietas.map(x=>x.nome);
      /* o jogo trata toda torcida como feminina — "A Leões da TUF caiu
         em cima da gente" —, então aqui é "da", sem exceção */
      m.consequencia += ` ${q.join(' e ')} ${q.length===1?'ficou':'ficaram'} `+
        `na cadeira: ${q.length===1?'é aliada':'são aliadas'} da ${quietas[0].de}.`;
    }
    const minha = nossosSet.find(p => p.id === e.torcida.id) || {n:10};
    const aptos = TO.membros.aptosParaOEstadio(e)
      .sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa))
      .slice(0, Math.max(2, Math.round(minha.n)));
    const nosT = nossosSet.reduce((s,p)=>s+p.n, 0);
    const delesT = delesSet.reduce((s,p)=>s+p.n, 0);
    const rivalTop = delesSet[0];
    $('telaDiaJogo').classList.remove('oculto');
    document.body.classList.add('em-cena');
    TO.estado.bloquear(true);
    pararTudo('cena');
    abrirPalco({
      canvas: $('djPrincipal'),
      config:{escalacao:aptos, intencao:'atacar', paz:false, setores:true,
              bondes, efetivoRival: delesT, local,
              /* no estádio todo mundo estende faixa (dono, 09/09/2026) */
              faixaDefensor:'ambos', rivalId: rivalTop.id,
              perfilRival: perfilDe(rivalTop.id)},
      aoTerminar: res => fecharDiaDeJogo(res, null,
        {acao:'estadio', alvo:{torcidaId: rivalTop.id,
          nome:(TO.mundo.torcida(rivalTop.id)||{}).nome || rivalTop.nome,
          nossos:nosT, deles:delesT, efetivo:delesT, cena:local}})
    });
    TO.estado.salvar();
    atualizarFeed();
  }


  /* =======================================================
     O ITINERÁRIO DO DIA DE JOGO (régua do dono, 20/08/2026)

     O dia inteiro numa linha vertical, de baixo pra cima. Cada
     bolinha é uma parada; ao chegar nela pode aparecer o recado
     do lado — a nossa investida (a que o PLANEJAMENTO marcou,
     que continua sendo decidido antes do dia), o ataque que a
     gente sofre, ou nada.

     A linha anda sozinha e só para em dois lugares: parada com
     recado, que espera resposta, e o jogo, que segura o dia até
     o apito final. Parada em que não aconteceu nada não fala:
     a bolinha acende, apaga e a linha segue.

     As cenas são as MESMAS do jogo, abertas pelas mesmas
     funções — o itinerário não inventa briga nem consequência,
     só ordena o dia e chama quem já existe.
     ======================================================= */
  function abrirItinerario(msg){
    const e = E();
    const it = TO.itinerario.montar(e, msg);
    if(!it) return false;
    ITN = {it, msg, ponto:-1, travado:false, timer:null, esperando:null,
           /* O EFETIVO ANDA COM A LINHA (régua do dono, 20/08/2026): a
              caravana parte com o que tem e cada baixa some do número
              que chega no próximo ponto. Vale pros dois lados. */
           nos: it.efetivo.nos, eles: it.efetivo.eles,
           /* A ESCOLTA DA ALIADA (régua do dono, 08/09/2026): 10 dela
              entram na chegada à cidade e ficam quando a caravana sai.
              `escolta.n` é o que sobrou deles; as baixas de uma briga
              na cidade saem primeiro da escolta. */
           escolta: it.escolta ? {aliado:it.escolta.aliado, nome:it.escolta.nome,
                                  n:it.escolta.n} : null};

    /* A LINHA MORA NA MENSAGEM (correção do dono, 20/08/2026): a tela
       cheia saiu. O nó é montado UMA vez e guardado em `ITN.raiz`; o
       cartão do feed só o adota a cada repintura, então o estado, os
       cartões abertos e o widget da partida sobrevivem inteiros —
       appendChild de um nó que já existe move, não recria.

       UMA LINHA SÓ (pedido do dono, 08/09/2026): a trilha de paradas
       de baixo pra cima saiu. O que fica é a parada de AGORA, numa
       linha que se atualiza conforme o dia passa: o símbolo do lugar à
       esquerda (ônibus na estrada, cidade na concentração e na pista,
       estádio nos arredores e no jogo), a hora, o nome e o efetivo.
       Os recados e a partida abrem embaixo dela. */
    const raiz = el('div',{class:'itn-mini'});
    const linha = el('div',{class:'itn-linha'});
    const ic = el('div',{class:'itn-ic'});
    const hora = el('div',{class:'itn-hora'});
    const corpo = el('div',{class:'itn-corpo'});
    const nome = el('div',{class:'itn-nome', texto:'Dia de jogo'});
    const estado = el('div',{class:'estado', texto:'o dia ainda não começou'});
    corpo.append(nome, estado);
    const conta = el('div',{class:'itn-efetivo'});
    linha.append(ic, hora, corpo, conta);
    raiz.appendChild(linha);
    /* os pontinhos do dia: um por parada, pra se saber quanto falta */
    const pontos = el('div',{class:'itn-pontos'});
    it.paradas.forEach((p, i)=>{
      /* `dojogo`, não `jogo`: a classe curta é a das linhas de partida
         das tabelas (painéis.css) e vestia o pontinho de padding */
      const b = el('i',{class:'itn-ponto'+(p.jogo?' dojogo':'')});
      b.dataset.i = i; b.title = `${p.hora} · ${p.nome}`;
      pontos.appendChild(b);
    });
    raiz.appendChild(pontos);
    const recados = el('div',{class:'itn-recados'});
    raiz.appendChild(recados);

    /* UMA NOTÍCIA POR DIA DE JOGO (pedido do dono, 08/09/2026): as
       brigas da linha entram num lote, e a notícia sai no fim do dia */
    TO.feed.abrirLote(e);
    ITN.raiz = raiz; ITN.linha = linha; ITN.ic = ic; ITN.hora = hora;
    ITN.nome = nome; ITN.estado = estado; ITN.conta = conta;
    ITN.pontos = pontos; ITN.recados = recados;
    /* o rótulo do dia de cada parada (véspera, dia do jogo, volta) */
    ITN.rotDia = {};
    for(const p of it.paradas) if(p.abreDia) ITN.rotDia[p.dia] = p.abreDia;

    /* o cartão do feed é quem hospeda: repinta pra ele adotar a linha */
    atualizarFeed();
    pararTudo('itinerario');
    itnPintar();
    itnContar();
    ITN.timer = setTimeout(itnProximo, 700 / (TO.diaJogo.ponte.velocidade || 1));
    return true;
  }

  /* o cartão da mensagem chama isto: se a linha é desta mensagem, ela
     vem pra cá inteira, com estado e tudo */
  function itnNaMensagem(m){
    if(ITN && ITN.msg && ITN.msg.id === m.id) return ITN.raiz;
    return itnProntos[m.id] || null;
  }

  /* o símbolo do lugar: estrada é ônibus, concentração e pista são a
     cidade, arredores e o jogo são o estádio */
  function itnSimbolo(p){
    if(!p) return 'estadio';
    if(p.simbolo) return p.simbolo;
    if(p.cidade) return 'onibus';
    if(/^(concentracao|pista)/.test(p.id)) return 'cidade';
    return 'estadio';
  }
  function itnDizer(txt, trava){
    if(!ITN) return;
    ITN.estado.textContent = txt;
    ITN.estado.classList.toggle('travado', !!trava);
  }

  /* a escolta da aliada só anda com a gente nas paradas da cidade */
  function itnEscoltaAtiva(){
    if(!ITN || !ITN.escolta || ITN.escolta.n <= 0) return 0;
    const p = ITN.it.paradas[ITN.ponto];
    if(p && p.comEscolta) return ITN.escolta.n;
    /* ocorrido na cidade deles dentro da fase da caravana: a escolta
       está junto (a partir da chegada) */
    const ev = ITN.esperando && ITN.esperando.ev;
    return (ev && ev.naCidade && ev.cidade) ? ITN.escolta.n : 0;
  }
  /* o número que a linha carrega: o nosso bonde e o deles */
  function itnContar(){
    if(!ITN || !ITN.conta) return;
    const nome = ITN.it.efetivo.nomeDeles;
    const esc = itnEscoltaAtiva();
    ITN.conta.innerHTML =
      `<b>${ITN.nos}</b> ${ITN.nos===1?'nosso':'nossos'}` +
      (esc ? ` <span class="escolta">+ <b>${esc}</b> da ${ITN.escolta.nome}</span>` : '') +
      /* zerado continua aparecendo: sumir com a linha esconderia
         justamente a informação de que não sobrou ninguém deles */
      (ITN.it.efetivo.eles ? ` · <b>${ITN.eles}</b> da ${nome}` : '');
  }
  /* a linha só tem um número, o da barra: o efetivo anda com ela */
  function itnMarcarEfetivo(){ itnContar(); }

  /* a linha vira a parada de agora: símbolo, hora, nome e o ponto aceso */
  function itnPintar(){
    if(!ITN) return;
    const p = ITN.it.paradas[ITN.ponto];
    const simb = itnSimbolo(p);
    ITN.ic.innerHTML = IC.get(simb);
    ITN.linha.dataset.lugar = simb;
    ITN.linha.classList.toggle('dojogo', !!(p && p.jogo));
    ITN.linha.classList.toggle('estrada', !!(p && p.cidade));
    if(p){
      const dia = ITN.it.dias > 1 && ITN.rotDia[p.dia]
        ? `<small>${ITN.rotDia[p.dia].split(' · ')[0]}</small>` : '';
      ITN.hora.innerHTML = `${p.hora}${dia}`;
      ITN.nome.innerHTML = `${p.nome}` +
        (p.lugar ? `<span class="lugar">${p.lugar}</span>` : '');
    }
    for(const b of ITN.pontos.children){
      const i = +b.dataset.i, q = ITN.it.paradas[i];
      b.classList.toggle('passou', i < ITN.ponto);
      b.classList.toggle('agora',  i === ITN.ponto);
      b.classList.toggle('brigou', !!(q && q.brigou));
    }
  }

  /* o 2× do feed vale na linha do dia também (dono, 08/09/2026) */
  const velTempo = () => TO.diaJogo.ponte.velocidade || 1;
  function itnAgenda(ms){
    if(!ITN) return;
    clearTimeout(ITN.timer);
    ITN.timer = setTimeout(itnProximo, (ms || 1400) / velTempo());
  }

  /* O OCORRIDO SOME DA TELA quando a linha segue (pedido do dono,
     08/09/2026): o cartão do recado — emboscada, ataque sofrido,
     investida — fica enquanto a ação dele está de pé (botões, cena,
     saldo) e sai quando a linha chega na parada seguinte. As notícias e
     as consequências já saíram pelas portas de sempre (Futebol e
     Porrada, prestígio, feridos); o cartão era só o pedido de decisão.
     A partida fica: o placar é o registro do dia. */
  function itnLimparOcorridos(){
    if(!ITN || !ITN.recados) return;
    for(const c of [...ITN.recados.querySelectorAll('.itn-cartao')]) c.remove();
  }

  function itnProximo(){
    if(!ITN || ITN.travado) return;
    const paradas = ITN.it.paradas;
    if(ITN.ponto >= paradas.length - 1) return itnAcabou();
    itnLimparOcorridos();
    ITN.ponto++;
    itnPintar();
    itnMarcarEfetivo();
    const p = paradas[ITN.ponto];

    if(p.jogo){                       /* O JOGO SEGURA A LINHA */
      ITN.travado = true;
      itnDizer('a partida rolando · o dia só segue no apito final', true);
      itnPartida(ITN.recados);
      return;
    }
    const fila = (p.eventos || []).slice();
    /* a escolta se junta na primeira parada da cidade, e fica na última */
    const antes = paradas[ITN.ponto - 1];
    const chegou = ITN.escolta && ITN.escolta.n > 0 && p.comEscolta && !(antes && antes.comEscolta);
    const ficou  = ITN.escolta && ITN.escolta.n > 0 && !p.comEscolta && antes && antes.comEscolta;
    if(!fila.length){                 /* parada sem nada não fala */
      itnDizer(chegou ? `a ${ITN.escolta.nome} manda ${ITN.escolta.n} pra escolta`
             : ficou ? `a escolta da ${ITN.escolta.nome} fica`
             : 'passando · ' + p.nome.toLowerCase());
      itnAgenda(chegou || ficou ? 1400 : 900);
      return;
    }
    /* uma parada pode ter dois recados — a gente sofrer um ataque no
       mesmo ponto em que planejou descer em cima de alguém. Os dois
       cartões aparecem, um de cada vez, e a linha só segue depois do
       último. */
    ITN.fila = fila;
    itnRecado();
  }

  function itnRecado(){
    if(!ITN) return;
    const p = ITN.it.paradas[ITN.ponto];
    const ev = ITN.fila.shift();
    if(!ev){ ITN.travado = false; itnDizer('seguindo'); itnAgenda(1200); return; }
    ITN.travado = true;
    itnDizer('recado na parada · esperando você responder', true);
    ITN.recados.appendChild(itnCartao(p, ev));
  }

  /* ---------- o cartão de cada recado ---------- */
  function itnCartao(p, ev){
    const cx = el('div',{class:'itn-cartao '+ev.tipo});
    const S = (TO.feed.SOFRIDO || {});
    let voz, texto, bts;
    /* onde foi: a parada de verdade dentro da fase (dono, 08/09/2026) */
    const onde = ev.lugarTxt || p.nome;
    if(ev.tipo === 'investida'){
      voz = 'Diretor de rua · investida marcada no planejamento';
      texto = `Hoje é o dia. A ${ev.nome} vai estar em ${onde}, e a gente vai pra cima.`;
      bts = [{rot:'Ir pra cima', briga:true}];
    } else if(ev.tipo === 'emboscada'){
      voz = `Emboscada · ${ev.nome}`;
      texto = (S.emboscada ? S.emboscada.texto(ev.nome)
                           : `Pegaram a caravana na estrada. A ${ev.nome} fechou a pista.`)
              + ` Foi em ${onde}.`;
      bts = [{rot:(S.emboscada||{}).brigar || 'Descer pra treta', briga:true},
             {rot:(S.emboscada||{}).fugir  || 'Mandar seguir viagem', briga:false}];
    } else {
      const cfg = S[ev.ponto] || S.bar || {};
      voz = `Caiu em cima da gente · ${ev.nome}`;
      texto = (cfg.texto ? cfg.texto(ev.nome)
                         : `A ${ev.nome} caiu em cima da gente.`) + ` Foi em ${onde}.`;
      bts = [{rot:cfg.brigar || 'Pra cima deles', briga:true},
             {rot:cfg.fugir  || 'Deixar quieto',  briga:false}];
    }
    /* O SIMULAR TAMBÉM NA LINHA DO DIA (correção do dono, 23/08/2026).
       A briga da parada — emboscada na estrada, ataque na pista,
       investida marcada — não passa pelo feed, então ela não pegava o
       gêmeo que o `propor` cria. Aqui ele entra na mão, ao lado de
       quem desce: é briga, e briga tem as duas saídas. */
    const descer = bts.find(b=>b.briga);
    if(descer) bts.splice(bts.indexOf(descer) + 1, 0,
      {rot:'Simular', briga:true, simular:true});
    cx.appendChild(el('div',{class:'voz', texto:voz}));
    cx.appendChild(el('p',{texto}));
    if(ev.tipo !== 'investida')
      cx.appendChild(el('div',{class:'custo',
        html:'Ninguém descendo: <b>Moral −3 · Prestígio −3,5 · Relação −6</b>'}));
    const caixa = el('div',{class:'bts'});
    bts.forEach((b, k)=>{
      const bt = el('button',{class:'itn-bt'+(k===0?' acao':'')+
                                     (b.simular?' simular':''), texto:b.rot});
      if(b.simular) bt.title =
        'Roda o duelo sem abrir a cena. As consequências são as mesmas.';
      bt.onclick = ()=> itnResponder(p, ev, b.briga, cx, b.simular);
      caixa.appendChild(bt);
    });
    cx.appendChild(caixa);
    return cx;
  }

  function itnResponder(p, ev, briga, cx, simular){
    if(!ITN) return;
    const e = E();
    cx.querySelector('.bts').remove();
    if(!briga){
      /* ninguém desceu: a conta é a mesma do feed, pela mesma porta */
      const atq = (ev.abrir && ev.abrir.atq) || null;
      const r = TO.feed.naoDesceu ? TO.feed.naoDesceu(e, atq) : null;
      cx.appendChild(el('div',{class:'saldo',
        html:'Ninguém desceu. <span class="ruim">Moral −3 · Prestígio −3,5 · '+
             'Relação −6</span>'}));
      TO.estado.salvar();
      pintarTopo();
      setTimeout(itnRecado, 900 / velTempo());   // o próximo recado da mesma parada
      return;
    }
    /* vai pra briga: a cena é a do jogo, e o fecho dela é o de sempre.
       O `ev` vai junto: é dele que sai a torcida do outro lado, pro
       livro-caixa de baixas do itinerário saber de quem descontar. */
    ITN.esperando = {parada:p, cartao:cx, ev};
    itnAbrirCena(ev, simular);
  }

  function itnAbrirCena(ev, simular){
    simularProxima = !!simular;
    itnDizer(simular ? 'duelo simulado · a linha espera'
                     : 'cena aberta · a linha espera', true);
    if(ev.abrir.tela === 'guerra') abrirGuerra(ev.abrir.args);
    else abrirAtaqueAoBar(ev.abrir.atq);
  }

  /* chamado quando o relatório da noite fecha */
  function itnVoltouDaCena(){
    if(!ITN || !ITN.esperando) return false;
    const {parada, cartao, ev} = ITN.esperando;
    ITN.esperando = null;
    parada.brigou = true;
    const res = ultimoResultado || {};
    /* AS BAIXAS SOMEM DO BONDE (régua do dono, 20/08/2026): quem caiu
       não segue viagem, e o próximo ponto recebe o que sobrou. Preso
       conta junto — quem foi pro camburão também não vai ao estádio. */
    const nossoLado = res.nossoLado === 'visitante' ? 'visitante' : 'mandante';
    const outro = nossoLado === 'mandante' ? 'visitante' : 'mandante';
    const cap = (a, b) => Math.max(0, Math.round(a || 0)) +
                          Math.max(0, Math.round(b || 0));
    const baixasNossas = cap(res['caidos' + (nossoLado==='mandante'?'Mandante':'Visitante')],
                             res['presos' + (nossoLado==='mandante'?'Mandante':'Visitante')]);
    const baixasDeles  = cap(res['caidos' + (outro==='mandante'?'Mandante':'Visitante')],
                             res['presos' + (outro==='mandante'?'Mandante':'Visitante')]);
    const antesNos = ITN.nos, antesEles = ITN.eles;
    /* a escolta da aliada apanha primeiro: é ela que vai na frente */
    let sobra = baixasNossas;
    if(itnEscoltaAtiva()){
      const daEscolta = Math.min(ITN.escolta.n, sobra);
      ITN.escolta.n -= daEscolta; sobra -= daEscolta;
    }
    ITN.nos  = Math.max(0, ITN.nos  - sobra);
    ITN.eles = Math.max(0, ITN.eles - baixasDeles);
    /* FERIDO NÃO VOLTA PRA BRIGA (régua do dono, 24/08/2026): o que
       cada torcida perdeu NESTE itinerário fica anotado, e o próximo
       atrito com ela abre a cena já descontado — os dois lados. O
       nosso desconto é o próprio ITN.nos; o delas é este livro. */
    /* O LIVRO É DE QUEM SOBROU, não de quanto caiu: descontar baixas
       da fórmula da cena descontava DUAS vezes — os membros feridos já
       encolhem a fórmula sozinhos (medido: 101 − 15 dava 79, porque a
       ficha ferida também tinha sumido da conta). Guardar a sobra e
       cortar por ela não soma desconto com desconto. */
    ITN.resta = ITN.resta || {};
    const ef = res.efetivo || {};
    const rid = ev && ev.torcida;
    if(rid) ITN.resta[rid] =
      Math.max(0, (ef[outro] || 0) - baixasDeles);
    ITN.resta[E().torcida.id] =
      Math.max(0, (ef[nossoLado] || 0) - baixasNossas);
    itnContar();
    itnMarcarEfetivo();
    const perdaNos = antesNos - ITN.nos, perdaEles = antesEles - ITN.eles;
    /* QUEM É "NOSSO" MUDA DE CENA (correção do dono, 24/08/2026): na
       emboscada de caravana a nossa torcida entra como visitante, e o
       cartão lia caidosVisitante como "deles". Some-se a isso que
       res.venceu diz que o MANDANTE ganhou, não que nós ganhamos — daí
       "Saímos por baixo" logo depois de vencer. Agora o saldo lê o lado
       que a cena nos deu e usa res.ganhamos. */
    const caidosNossos = Math.max(0, Math.round(
      res['caidos' + (nossoLado==='mandante'?'Mandante':'Visitante')] || 0));
    const caidosDeles = Math.max(0, Math.round(
      res['caidos' + (outro==='mandante'?'Mandante':'Visitante')] || 0));
    cartao.appendChild(el('div',{class:'saldo',
      html:`${res.ganhamos ? '<span class="bom">Saímos por cima.</span>'
                           : '<span class="ruim">Saímos por baixo.</span>'} `+
           `<b>${caidosDeles} caídos deles, ${caidosNossos} nossos</b>`+
           (res.prestigio ? ` · Prestígio ${res.prestigio>0?'+':''}${res.prestigio}` : '')+
           (perdaNos || perdaEles
             ? `<br>Segue viagem com <b>${ITN.nos}</b>`+
               (perdaNos ? ` <span class="ruim">(−${perdaNos})</span>` : '')+
               (antesEles ? ` · eles com <b>${ITN.eles}</b>`+
                 (perdaEles ? ` <span class="bom">(−${perdaEles})</span>` : '') : '')
             : '')}));
    /* o cartão precisa estar na tela pra a linha se medir: repinta
       primeiro, mede depois */
    atualizarFeed();
    itnPintar();
    setTimeout(itnRecado, 800 / velTempo());
    return true;
  }

  /* ---------- a partida dentro da parada ---------- */
  function itnPartida(vaga){
    const m = ITN.msg;
    if(!m || !m.dados){ ITN.travado = false; itnAgenda(600); return; }
    /* AQUI a bola rola, e só aqui (correção do dono, 20/08/2026): o
       botão do feed abriu o dia, não o jogo. */
    m.dados.iniciada = true;
    if(m.dados.minAcum === undefined){
      m.dados.minAcum = 0; m.dados.t0 = Date.now();
      m.dados.vel = m.dados.vel || 4; m.dados.pausada = false;
    }
    const caixa = widgetPartida(m, ()=>{
      /* apito final: a linha volta a andar, e o aviso da trava sai */
      atualizarFeed(); pintarTopo();
      if(ITN && ITN.recados)
        for(const t of [...ITN.recados.querySelectorAll('.itn-trava')]) t.remove();
      itnDizer('apito final · seguindo pros arredores');
      ITN.travado = false;
      itnAgenda(1100);
    });
    caixa.classList.add('itn-partida-caixa');
    vaga.appendChild(caixa);
    vaga.appendChild(el('div',{class:'itn-trava',
      texto:'▲ os arredores só abrem no apito final'}));
  }

  function itnAcabou(){
    if(!ITN) return;
    ITN.travado = true;
    itnLimparOcorridos();
    itnDizer('dia encerrado');
    ITN.raiz.classList.add('fechado');
    TO.estado.salvar();
    /* o dia não vira mensagem nova no feed (decisão do dono,
       21/08/2026): a linha percorrida fica na própria mensagem do dia
       de jogo, e as brigas já saíram cada uma na mensagem delas. O que
       sai aqui é só a trava do relógio */
    itnProntos[ITN.msg.id] = ITN.raiz;
    ITN = null;
    /* a notícia única do dia: as brigas do lote, somadas */
    TO.feed.fecharLote(E());
    soltarTudo('itinerario');
    redesenhar();
  }

  /* =======================================================
     O RECORTE DE JORNAL DA RODADA
     Só desenho: o que vai em cada pedaço quem decide é
     TO.gazeta, e as frases são os moldes que o dono aprovou.
     ======================================================= */
  /* =======================================================
     A GAZETA NO FEED (encolhida a pedido do dono, 21/08/2026)
     A edição fecha no placar grande. Ao lado da manchete vai um
     recorte de três linhas da classificação: o time logo acima
     do nosso, o nosso e o logo abaixo.
     ======================================================= */
  function recorteDaRodada(p, msg){
    const rec = el('article',{class:'gz'});

    const cab = el('div',{class:'gz-cabeca'});
    cab.innerHTML =
      `<div class="linha">
         <div class="lado">Ano ${p.cabeca.ano} · Nº ${p.cabeca.edicao}<br>Fundada em 2026</div>
         <div class="nome-jornal">Gazeta dos Sports</div>
         <div class="lado dir">${p.cabeca.data}<br>Edição da rodada</div>
       </div>
       <div class="tarja">${p.tarja.map(t=>`<span>${t}</span>`).join('')}</div>`;
    rec.appendChild(cab);

    const topo = el('div',{class:'gz-topo'+(p.tabela?'':' sozinha')});

    const man = el('div',{class:'gz-manchete'});
    man.innerHTML =
      `<div class="chapeu">${p.chapeu}</div>
       <h2>${p.manchete}</h2>
       <p class="olho">${p.olho}</p>
       <div class="placar-grande">
         <span class="time${p.placar.nossaCasa?' nossa':''}">${p.placar.a}</span>
         <span class="n">${p.placar.ga}</span>
         <span class="n">${p.placar.gb}</span>
         <span class="time${p.placar.nossaFora?' nossa':''}">${p.placar.b}</span>
       </div>`;
    topo.appendChild(man);

    /* o recorte de três linhas, na margem da manchete */
    if(p.tabela){
      const cl = el('aside',{class:'gz-recorte'});
      cl.appendChild(el('div',{class:'col-tit', html:
        `A classificação <span class="onde">${p.tabela.rot}</span>`}));
      const grade = el('div',{class:'linhas'});
      for(const l of p.tabela.linhas)
        grade.appendChild(el('div',{class:'l'+(l.nossa?' nossa':''), html:
          `<span class="p">${l.pos}</span><span class="t">${l.nome}</span>`+
          `<span class="j">${l.j}j</span>`+
          `<span class="sg">${l.sg > 0 ? '+' : ''}${l.sg}</span>`+
          `<span class="pt">${l.p}</span>`}));
      cl.appendChild(grade);
      cl.appendChild(el('div',{class:'de', texto:`de ${p.tabela.total} times`}));
      topo.appendChild(cl);
    }

    rec.appendChild(topo);

    /* =====================================================
       O JORNAL COMPLETO ATRÁS DE UM BOTÃO (pedido do dono,
       21/08/2026): a mensagem abre enxuta e "Mostrar jornal
       completo" solta o resto da página. Quem lembra que ela
       está aberta é a própria mensagem (`m.gzAberto`), e não
       o nó: o feed repinta a toda hora e a página tem de
       continuar aberta depois do repinte.
       ===================================================== */
    if(p.completo && msg){
      const resto = el('div',{class:'gz-resto'});
      const bt = el('button',{class:'gz-mostrar'});
      const pintarResto = ()=>{
        resto.innerHTML = '';
        const aberto = !!msg.gzAberto;
        bt.textContent = aberto ? 'Esconder o resto do jornal'
                                : 'Mostrar jornal completo';
        bt.classList.toggle('aberto', aberto);
        if(aberto) resto.appendChild(paginaCheiaDoJornal(p.completo));
      };
      bt.onclick = ()=>{
        msg.gzAberto = !msg.gzAberto;
        pintarResto();
        TO.estado.salvar();
      };
      pintarResto();
      rec.appendChild(resto);
      const pe = el('div',{class:'gz-abre'});
      pe.appendChild(bt);
      rec.appendChild(pe);
    }
    return rec;
  }

  /* =======================================================
     O DETALHE DOS PÊNALTIS (pedido do dono, 21/08/2026)
     Todo placar decidido nos pênaltis mostra a disputa ao
     lado, em qualquer tela. Um formatador só, pra não ter
     duas versões da mesma verdade.
     ======================================================= */
  const penTexto = j => (j && j.pen)
    ? `${j.pen.c} × ${j.pen.f} nos pênaltis`
    : (j && j.penaltis) ? 'nos pênaltis' : '';

  /* a série cobrança a cobrança: ● converteu, ○ perdeu */
  function penSerie(pen){
    if(!pen || !pen.cobrancas) return null;
    const linha = lado => pen.cobrancas.filter(x=>x.lado === lado)
      .map(x=>`<i class="${x.marcou?'fez':'errou'}"></i>`).join('');
    const cx = el('div',{class:'pen-serie'});
    cx.innerHTML = `<div class="l">${linha('c')}</div>`+
                   `<div class="l">${linha('f')}</div>`;
    return cx;
  }

  /* =======================================================
     O ALMANAQUE NO FEED (pedido do dono, 21/08/2026)
     Mesmo esqueleto da Gazeta — cabeçalho, tarja, chapéu,
     manchete e olho —, com um QUADRO ao lado no lugar da
     classificação: o pódio, quem trocou de divisão, quem
     construiu. Sem placar grande: aqui não há jogo, há ano.
     ======================================================= */
  function recorteDoAlmanaque(p, e){
    const rec = el('article',{class:'gz alm'+(p.tom?' '+p.tom:'')});

    const cab = el('div',{class:'gz-cabeca'});
    cab.innerHTML =
      `<div class="linha">
         <div class="lado">Ano ${p.ano}<br>Fundada em 2026</div>
         <div class="nome-jornal">${p.jornal}</div>
         <div class="lado dir">${p.edicao}</div>
       </div>
       <div class="tarja">${(p.tarja||[]).map(t=>`<span>${t}</span>`).join('')}</div>`;
    rec.appendChild(cab);

    const topo = el('div',{class:'gz-topo'+(p.quadro && p.quadro.linhas.length ? '' : ' sozinha')});
    const man = el('div',{class:'gz-manchete'});
    man.innerHTML =
      `<div class="chapeu">${p.chapeu}</div>
       <h2>${p.manchete}</h2>
       <p class="olho">${p.olho}</p>`;
    topo.appendChild(man);

    const q = p.quadro;
    if(q && q.linhas.length){
      const cx = el('aside',{class:'alm-quadro'});
      cx.appendChild(el('div',{class:'col-tit', texto:q.titulo}));
      const g = el('div',{class:'linhas'});
      for(const l of q.linhas){
        g.appendChild(el('div',{class:'l'+(l.forte?' forte':'')+(l.nossa?' nossa':'')+
          (l.sobe === true ? ' sobe' : l.sobe === false ? ' desce' : ''), html:
          `<span class="rot">${l.rot}</span>`+
          `<span class="v">${l.valor}</span>`+
          /* `dado`, e não `nota`: .nota é a classe do aviso flutuante,
             com fundo escuro — o quadro do ano herdava ela inteira */
          `<span class="dado">${l.nota || ''}</span>`}));
      }
      cx.appendChild(g);
      if(q.resto) cx.appendChild(el('div',{class:'de',
        texto:`e mais ${q.resto}`}));
      topo.appendChild(cx);
    }
    rec.appendChild(topo);
    return rec;
  }

  /* =======================================================
     FUTEBOL E PORRADA NO FEED (pedido do dono, 21/08/2026)
     Mesmo esqueleto da Gazeta — cabeçalho, tarja, chapéu,
     manchete, olho e placar grande. No lugar da classificação,
     o QUADRO DA NOITE: envolvidos, feridos e presos dos dois
     lados, e quem levou a melhor. O botão solta as outras
     brigas do dia.
     ======================================================= */
  function recorteDaPorrada(p, msg){
    const rec = el('article',{class:'gz pp'});

    const cab = el('div',{class:'gz-cabeca'});
    cab.innerHTML =
      `<div class="linha">
         <div class="lado">Ano ${p.cabeca.ano} · Nº ${p.cabeca.edicao}<br>Fundada em 2026</div>
         <div class="nome-jornal">Futebol e Porrada</div>
         <div class="lado dir">${p.cabeca.data}<br>Edição da treta</div>
       </div>
       <div class="tarja">${p.tarja.map(t=>`<span>${t}</span>`).join('')}</div>`;
    rec.appendChild(cab);

    const topo = el('div',{class:'gz-topo'});
    const man = el('div',{class:'gz-manchete'});
    /* SEM PLACAR (decisão do dono, 24/08/2026): mesmo mostrando
       derrubados, o par de números grandes lia como jogo — e briga
       não tem placar. Quem conta a noite é o quadro do lado:
       envolvidos, feridos e presos de cada torcida, com o "levou a
       melhor" embaixo. */
    man.innerHTML =
      `<div class="chapeu">${p.chapeu}</div>
       <h2>${p.manchete}</h2>
       <p class="olho">${p.olho}</p>`;
    topo.appendChild(man);
    topo.appendChild(quadroDaNoite(p.quadro));
    rec.appendChild(topo);

    /* AS OUTRAS TRETAS NOSSAS DA NOITE (lote do itinerário): uma
       linha por briga, com o quadro curto e a consequência dela */
    if(p.nossasOutras && p.nossasOutras.length){
      const bl = el('div',{class:'pp-outras pp-nossas'});
      bl.appendChild(el('div',{class:'gz-secao', texto:
        `A mesma noite: mais ${p.nossasOutras.length} ${p.nossasOutras.length===1?'treta nossa':'tretas nossas'}`}));
      for(const x of p.nossasOutras){
        const veredito = x.semResistencia ? 'sem resistência'
          : x.empate ? 'ninguém levou a melhor'
          : x.ganhamos ? 'levamos a melhor' : `a ${x.b.nome} levou a melhor`;
        bl.appendChild(el('div',{class:'pp-nota', html:
          `<p><b>${linkTorcida(x.a.id, x.a.nome)}</b> ${x.a.n} × ${x.b.n} `+
          `<b>${linkTorcida(x.b.id, x.b.nome)}</b> <span class="onde">${x.onde}</span></p>`+
          `<small>${x.a.feridos} ${x.a.feridos===1?'ferido nosso':'feridos nossos'}`+
          `${x.a.presos ? `, ${x.a.presos} ${x.a.presos===1?'preso':'presos'}` : ''} · `+
          `${x.b.feridos} do lado deles · ${veredito}`+
          `${x.consequencia ? `<br><span class="fraco">${x.consequencia}</span>` : ''}</small>`}));
      }
      rec.appendChild(bl);
    }

    /* as outras brigas do dia, atrás do botão */
    const c = p.completo;
    const resto = el('div',{class:'gz-resto'});
    const bt = el('button',{class:'gz-mostrar'});
    const pintar = ()=>{
      resto.innerHTML = '';
      const aberto = !!msg.ppAberto;
      bt.textContent = aberto ? 'Esconder as outras' : 'Ver mais notícias';
      bt.classList.toggle('aberto', aberto);
      if(aberto) resto.appendChild(outrasDoDia(c));
    };
    bt.onclick = ()=>{ msg.ppAberto = !msg.ppAberto; pintar(); TO.estado.salvar(); };
    pintar();
    rec.appendChild(resto);
    const pe = el('div',{class:'gz-abre'});
    pe.appendChild(bt);
    if(c.total) pe.appendChild(el('span',{class:'gz-conta', html:
      `<b>${c.total}</b> ${c.total===1?'outra treta':'outras tretas'} no país hoje`}));
    rec.appendChild(pe);
    return rec;
  }

  /* a página da LNT no Futebol e Porrada: mesma cabeça, mesma tarja,
     e no lugar do quadro da noite o quadro das quatro divisões */
  function recorteDaLNT(p){
    const rec = el('article',{class:'gz pp'});
    const cab = el('div',{class:'gz-cabeca'});
    cab.innerHTML =
      `<div class="linha">
         <div class="lado">Ano ${p.cabeca.ano} · Nº ${p.cabeca.edicao}<br>Fundada em 2026</div>
         <div class="nome-jornal">Futebol e Porrada</div>
         <div class="lado dir">${p.cabeca.data}<br>${p.especial}</div>
       </div>
       <div class="tarja">${p.tarja.map(t=>`<span>${t}</span>`).join('')}</div>`;
    rec.appendChild(cab);

    const topo = el('div',{class:'gz-topo'});
    const man = el('div',{class:'gz-manchete'});
    man.innerHTML =
      `<div class="chapeu">${p.chapeu}</div>
       <h2>${p.manchete}</h2>
       <p class="olho">${p.olho}</p>` +
      (p.meu ? `<p class="olho nossa">${p.meu}</p>` : '');
    topo.appendChild(man);

    const cx = el('aside',{class:'pp-quadro'});
    if(p.divisoes){
      cx.appendChild(el('div',{class:'col-tit', texto:'As quatro divisões'}));
      const g = el('div',{class:'grade'});
      for(const d of p.divisoes)
        g.appendChild(el('div',{class:'l'+(d.minha?' forte':''), html:
          `<span class="rot">${d.nome}${d.minha?' · a nossa':''}</span>`+
          `<span class="v">${d.clubes}</span>`}));
      cx.appendChild(g);
      cx.appendChild(el('div',{class:'venceu', html: p.fora
        ? `<span class="rot">Fora desta edição</span> ${p.fora} `+
          `${p.fora===1?'torcida':'torcidas'}`
        : '<span class="rot">Todas</span> as torcidas entraram'}));
    }else{
      cx.appendChild(el('div',{class:'col-tit', texto:'Os quatro campeões'}));
      const g = el('div',{class:'grade'});
      for(const c of (p.campeoes||[]))
        g.appendChild(el('div',{class:'l', html:
          `<span class="rot">${c.div}ª Divisão</span>`+
          `<span class="v">${c.campeao}</span>`}));
      cx.appendChild(g);
    }
    topo.appendChild(cx);
    rec.appendChild(topo);
    return rec;
  }

  /* o quadro da noite: duas colunas de números e o vencedor */
  function quadroDaNoite(q){
    const cx = el('aside',{class:'pp-quadro'});
    cx.appendChild(el('div',{class:'col-tit', texto:'O quadro da noite'}));
    const g = el('div',{class:'grade'});
    g.appendChild(el('div',{class:'cab', html:
      `<span class="rot"></span>`+
      q.lados.map(l=>`<span class="lado${l.nossa?' nossa':''}">`+
        `${linkTorcida(l.id, l.nome)}</span>`).join('')}));
    const linha = (rot, chave, destaque)=>{
      const vals = q.lados.map(l=>l[chave] || 0);
      const pior = Math.max(...vals);
      g.appendChild(el('div',{class:'l'+(destaque?' forte':''), html:
        `<span class="rot">${rot}</span>`+
        vals.map(v=>`<span class="v${destaque && v === pior && pior ? ' pior' : ''}">`+
          `${v}</span>`).join('')}));
    };
    linha('Envolvidos', 'n');
    linha('Feridos', 'feridos', true);
    linha('Presos', 'presos', true);
    cx.appendChild(g);
    cx.appendChild(el('div',{class:'venceu'+(q.empate?' empatou':''), html:
      q.empate ? '<span class="rot">Ninguém</span> levou a melhor'
               : `<span class="rot">Levou a melhor</span> ${q.vencedor||'—'}`}));
    return cx;
  }

  /* as outras brigas do dia, em nota de jornal */
  function outrasDoDia(c){
    const cx = el('div',{class:'gz-cheio pp-outras'});
    cx.appendChild(el('div',{class:'col-tit rubra', texto:'Deu pau em outro canto'}));
    if(!c.itens.length){
      cx.appendChild(el('p',{class:'pp-vazio', texto:c.vazio}));
      return cx;
    }
    for(const it of c.itens){
      const n = el('div',{class:'pp-nota'});
      n.innerHTML =
        `<p>${it.frase}</p>`+
        `<div class="onde">${[linkCidadePorNome(it.cidade), it.motivo]
          .filter(Boolean).join(' · ')}</div>`+
        `<div class="numeros">`+
        it.lados.map(l=>
          `<span class="lado"><b>${linkTorcida(l.id, l.nome)}</b> ${l.n} na treta · `+
          `${l.feridos} ${l.feridos===1?'ferido':'feridos'}`+
          `${l.presos ? ` · ${l.presos} ${l.presos===1?'preso':'presos'}` : ''}</span>`
        ).join('')+
        `</div>`;
      cx.appendChild(n);
    }
    if(c.resto) cx.appendChild(el('div',{class:'pp-mais', html:
      c.resto === 1 ? 'E mais uma treta pelo país'
                    : `E mais <b>${c.resto}</b> tretas pelo país`}));
    return cx;
  }

  /* o resto da página: as seções do jornal de 20/08/2026 */
  function paginaCheiaDoJornal(p){
    const rec = el('div',{class:'gz-cheio'+(p.magra?' magra':'')});
    const cols = el('div',{class:'gz-colunas'});

    const c1 = el('section',{class:'gz-materia'});
    c1.innerHTML = `<div class="col-tit rubra">Na nossa praça</div>`+
      (p.cidade ? `<div class="assina">${p.cidade}</div>` : '')+
      `<p>${p.praca}</p>`;
    const cx = el('div',{class:'gz-caixa'+(p.nossa.bom?' bom':p.nossa.ruim?' ruim':'')});
    cx.innerHTML = `<div class="rot">O nosso jogo</div>
       <div class="jogo">${p.nossa.placar}</div>`+
      (p.nossa.sob ? `<div class="sob">${p.nossa.sob}</div>` : '')+
      (p.nossa.tabela ? `<div class="tab">${p.nossa.tabela}</div>` : '');
    c1.appendChild(cx);
    cols.appendChild(c1);

    /* na página magra as notas do país sobem pra primeira coluna, que
       senão ficaria com uma caixinha e um palmo de papel em branco */
    if(p.notas.length){
      const notas = p.notas.map(n=>
        `<p><strong>${n.placar}.</strong> ${n.frase}</p>`).join('');
      if(p.magra){
        c1.appendChild(el('div',{class:'col-tit meio', texto:'Pelo país'}));
        c1.appendChild(el('div',{class:'gz-notas', html:notas}));
      } else {
        const c2 = el('section',{class:'gz-materia'});
        c2.innerHTML = `<div class="col-tit">Pelo país</div>` + notas;
        cols.appendChild(c2);
      }
    }

    const c3 = el('section');
    c3.innerHTML = `<div class="col-tit">Placar do dia</div>`+
      `<div class="gz-placares">`+
      p.placares.map(g=>`<div class="comp">${g.titulo}</div>`+
        g.jogos.map(j=>`<div class="r${j.nossa?' nossa':''}${j.goleada?' gol':''}">`+
          `<span class="m">${j.casa}</span><span class="g">${j.gc} × ${j.gf}</span>`+
          `<span class="v">${j.fora}</span></div>`).join('')).join('')+
      `</div>`;
    cols.appendChild(c3);
    rec.appendChild(cols);

    /* A FAIXA DA CLASSIFICAÇÃO (pedido do dono, 20/08/2026): sempre a
       divisão do NOSSO clube, e na Série D só o grupo dele. */
    const cl = p.classificacao;
    if(cl){
      const faixa = el('div',{class:'gz-tabela'});
      faixa.appendChild(el('div',{class:'col-tit', html:
        `A classificação <span class="onde">${cl.rot}</span>`}));
      const grade = el('div',{class:'linhas'});
      for(const l of cl.linhas){
        if(l.salto){ grade.appendChild(el('div',{class:'salto', texto:'⋯'})); continue; }
        grade.appendChild(el('div',{class:'l'+(l.nossa?' nossa':''), html:
          `<span class="p">${l.pos}</span><span class="t">${l.nome}</span>`+
          `<span class="j">${l.j}j</span>`+
          `<span class="sg">${l.sg > 0 ? '+' : ''}${l.sg}</span>`+
          `<span class="pt">${l.p}</span>`}));
      }
      faixa.appendChild(grade);
      rec.appendChild(faixa);
    }

    const pe = el('div',{class:'gz-pe'});
    if(p.resto) pe.appendChild(el('span',{html:
      p.resto === 1 ? 'E mais um jogo pelo interior'
                    : `E mais <b>${p.resto}</b> jogos pelo interior`}));
    pe.appendChild(el('span',{class:'espaco'}));
    const bt = el('button',{class:'gz-link', texto:'Ver competições →'});
    bt.onclick = ()=> abrirPainel('competicoes');
    pe.appendChild(bt);
    rec.appendChild(pe);
    return rec;
  }

  /* =======================================================
     O CARTÃO DE SEGUNDA — o planejamento da semana no feed
     (pedido do dono, 10/09/2026). Uma aba por praça em que a torcida
     tem pé — a sede e cada subsede —, os jogos da semana daquela
     praça em ordem de dia, e o nosso jogo no alto da aba da sede com
     o plano embutido: caravana (quantos, estrada, ajuda), intenção
     (paz ou ataque), alvo, onde, efetivo e bombas. O estado vive em
     `E.plano`, escrito pelas mesmas funções que os modais de Caravana
     e Atacar escreviam; o cartão se repinta por dentro a cada toque.
     ======================================================= */
  const chaveDoPlano = e => {
    const p = (TO.planejamento && e.plano) || {};
    return [p.chave, p.intencao, p.alvoTorcida, p.alvo, p.caravana, p.rota,
            p.bombas, p.efetivoAtaque, Object.keys(p.investidas||{}).length,
            JSON.stringify(p.recepcao||{}), p.ajuda ? p.ajuda.nivel : ''].join('|');
  };
  const DIA_ABREV = ['','SEG','TER','QUA','QUI','SEX','SÁB','DOM'];

  function cartaoSemana(e, m){
    const P = TO.planejamento, F = TO.feed, M = TO.mundo;
    const raiz = el('div',{class:'sem'});
    const cidades = ((m.dados||{}).cidades || [e.torcida.mapa])
      .filter((c,i,a)=>a.indexOf(c)===i && M.cidade(c));
    if(!m.abaSemana || !cidades.includes(m.abaSemana)) m.abaSemana = cidades[0];
    /* só o cartão da semana corrente tem controle; os das segundas
       passadas ficam no feed como registro, já sem botão nenhum */
    const vigente = (m.dados.ano||e.data.ano) === e.data.ano &&
                    (m.dados.semana||e.data.semana) === e.data.semana;
    const fechado = !!m.respondido || !vigente;
    const nomeDe = id => { const o = id && M.torcida(id); return o ? o.nome : ''; };
    const salvar = ()=>{ TO.estado.salvar(); };

    /* ---- o cabeçalho da semana ---- */
    const d0 = TO.estado.dataDaSemana(e.data.ano, m.dados.semana || e.data.semana, 1);
    const d6 = TO.estado.dataDaSemana(e.data.ano, m.dados.semana || e.data.semana, 7);
    const dd = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
    raiz.appendChild(el('div',{class:'sem-cab', html:
      `<span class="sem-sem">Semana ${m.dados.semana || e.data.semana}</span>`+
      `<span class="sem-datas">${dd(d0)} a ${dd(d6)}</span>`+
      (m.respondido ? `<span class="sem-selo">plano fechado</span>` : !vigente ? `<span class="sem-selo passada">semana passada</span>` : '')}));

    /* ---- as abas, uma por praça (só se houver subsede) ---- */
    const corpo = el('div',{class:'sem-corpo'});
    if(cidades.length > 1){
      const abas = el('div',{class:'sem-abas'});
      for(const c of cidades){
        const cid = M.cidade(c);
        const b = el('button',{class:'sem-aba'+(m.abaSemana===c?' on':''),
          html:`<span>${cid.nome}</span><small>${c===e.torcida.mapa ? 'sede' : 'subsede'}</small>`});
        b.onclick = ()=>{ m.abaSemana = c; pintar(); };
        abas.appendChild(b);
      }
      raiz.appendChild(abas);
    }
    raiz.appendChild(corpo);

    /* ---- controles reutilizados ---- */
    const contador = (valor, min, max, passo, aoMudar, nota)=>{
      const linha = el('div',{class:'contador sem-contador'});
      const bMenos = el('button',{texto:'−'}), bMais = el('button',{texto:'+'});
      bMenos.disabled = fechado || valor <= min; bMais.disabled = fechado || valor >= max;
      bMenos.onclick = ()=>aoMudar(Math.max(min, valor - passo));
      bMais.onclick  = ()=>aoMudar(Math.min(max, valor + passo));
      linha.append(bMenos, el('b',{texto:String(valor)}), bMais);
      if(nota) linha.appendChild(el('small',{texto:nota}));
      return linha;
    };
    const chips = (itens, atual, aoTrocar)=>{
      const cx = el('div',{class:'sem-chips'});
      for(const it of itens){
        const b = el('button',{class:'sem-chip'+(it.id===atual?' on':'')+(it.off?' off':''),
          html:`<span>${it.rot}</span>${it.nota?`<small>${it.nota}</small>`:''}`});
        b.disabled = fechado || !!it.off;
        b.onclick = ()=>aoTrocar(it.id);
        cx.appendChild(b);
      }
      return cx;
    };
    const rotuloJogo = (r)=>
      `<div class="sem-jogo-cab"><span class="sem-dia${r.passou?' passou':''}">${DIA_ABREV[r.diaN]||''}`+
      `<small>${r.hora||''}</small></span>`+
      `<div class="sem-duelo"><div class="sem-clubes">${chipClube(r.clubes[0].id, r.clubes[0].cor)}`+
      `<b>${r.clubes[0].nome}</b><i>×</i>${chipClube(r.clubes[1].id, r.clubes[1].cor)}<b>${r.clubes[1].nome}</b></div>`+
      `<small>${r.comp||''}${r.estadio?` · ${r.estadio}`:''}${r.tipo==='fora'?` · em ${r.cidade||''}`:''}</small></div></div>`;
    const ruaDe = (r)=> r.torcidas.length
      ? `<div class="sem-rua">${r.torcidas.map(t=>
          `<span class="sem-torcida${t.hostil?' hostil':''}">${chipTorcida(t.id,t.cor)}`+
          `${linkTorcida(t.id,t.nome)}<small>${String(t.faixa).replace(' a ','–')}${t.deFora?' · de fora':''}</small></span>`).join('')}</div>`
      : `<div class="sem-rua vazia">ninguém na rua</div>`;

    /* ---- o nosso jogo, com o plano dentro ---- */
    const blocoNosso = (r)=>{
      const p = P.plano(e);
      const bloco = el('div',{class:'sem-jogo nosso'+(r.passou?' passou':'')});
      bloco.innerHTML = rotuloJogo(r) + ruaDe(r);
      if(r.passou || !vigente) return bloco;
      const plano = el('div',{class:'sem-plano'});
      const fora = r.tipo === 'fora';
      const briga = p.intencao !== 'paz';
      const alvos = fora ? P.alvosDaViagem(e)
                         : (()=>{ const doJogo = new Set([...M.torcidasDe(r.grupo.casa), ...M.torcidasDe(r.grupo.vis)].map(o=>o.id));
                                  return P.alvosNaRua(e, {dia:r.grupo.dia}).filter(a=>doJogo.has(a.id)); })();
      let onde = P.ondeDoPlano(p);

      /* caravana: quantos vão e por qual estrada */
      let est = null;
      if(fora){
        est = P.estimativaCaravana(e);
        const rotas = P.rotas(e);
        const sec = el('div',{class:'sem-sec'});
        sec.appendChild(el('div',{class:'sem-rot', html:`Caravana <small>${est.interessados} querem ir · ${est.aptos} aptos</small>`}));
        const passo = Math.max(1, Math.round(est.interessados/10));
        sec.appendChild(contador(est.vao, est.minimo, est.interessados, passo,
          v=>{ p.caravana = v; p.decidido = false; salvar(); pintar(); }, `embarcam · ${U.dinheiro(est.porCabeca)} por cabeça`));
        if(rotas.length) sec.appendChild(chips(rotas.map(rt=>({id:rt.id, rot:rt.nome,
          nota:`${U.dinheiro(rt.custo)}${rt.risco?` · emboscada ${Math.round(rt.risco)}`:' · sem hostil'}`})),
          p.rota || rotas[0].id, id=>{ p.rota = id; p.decidido = false; salvar(); pintar(); }));
        const rt = P.rotaEscolhida(e);
        if(rt && rt.cidades.length > 1)
          sec.appendChild(el('div',{class:'sem-trajeto', html: rt.cidades.map((c,i)=>{
            const nome = (M.cidade(c)||{}).nome || c; const h = P.hostilidade(e, c);
            return `<span class="${i===0?'saida':i===rt.cidades.length-1?'chegada':''}${h>40?' hostil':''}">${nome}</span>`;
          }).join('<i>›</i>')}));
        /* ajuda de aliado na praça deles */
        const aliadas = P.aliadasNaPracaDeles(e), ajuda = P.ajudaDe(e);
        const NR = {nada:'não vai receber', hospedar:'hospedagem', escolta:'hospedagem e escolta', churrasco:'escolta e churrasco'};
        if(ajuda){
          const rec = P.recepcaoDe(ajuda.nivel);
          sec.appendChild(el('div',{class:'sem-linha', html:`<span>${linkTorcida(ajuda.aliado, ajuda.nome)}: <b>${NR[ajuda.nivel]||ajuda.nivel}</b></span>`+
            `<b class="${ajuda.nivel==='nada'?'negativo':'positivo'}">${rec.relacao>0?'+':''}${rec.relacao} rel.${ajuda.escolta?` · ${ajuda.escolta} na escolta`:''}</b>`}));
        } else if(aliadas.length && !fechado){
          const linha = el('div',{class:'sem-linha'});
          linha.appendChild(el('span',{html:`Aliada em ${r.cidade||'lá'}: ${aliadas.map(a=>linkTorcida(a.id,a.nome)).join(', ')}`}));
          const b = el('button',{class:'sem-mini', texto:'Pedir ajuda'});
          b.onclick = ()=>{ const rr = P.pedirAjuda(e, aliadas[0].id); if(!rr) return;
            aviso(rr.nivel==='nada' ? `A ${rr.nome} não vai receber a gente.` : `A ${rr.nome} topou: ${NR[rr.nivel]}.`, rr.nivel==='nada'?'ruim':'boa');
            salvar(); pintarTopo(); pintar(); };
          linha.appendChild(b); sec.appendChild(linha);
        }
        plano.appendChild(sec);
      }

      /* intenção: paz ou ataque; alvo; onde; efetivo; bombas */
      const sec2 = el('div',{class:'sem-sec'});
      sec2.appendChild(el('div',{class:'sem-rot', html:`Na rua <small>${fora ? 'na praça deles' : 'na nossa praça'}</small>`}));
      sec2.appendChild(chips([
        {id:'paz', rot:'Ir em paz', nota:'portão, bandeira e bateria'},
        {id:'atacar', rot:'Atacar', nota: alvos.length ? 'em cima de uma torcida' : 'ninguém pra atacar', off:!alvos.length}
      ], briga ? 'atacar' : 'paz', id=>{
        if(id==='paz') P.definirIntencao(e, 'paz');
        else P.definirAtaque(e, {alvo: p.alvoTorcida || (alvos[0]&&alvos[0].id), onde, bombas:p.bombas});
        salvar(); pintar();
      }));
      if(briga && alvos.length){
        const alvoAtual = alvos.find(a=>a.id===p.alvoTorcida) ? p.alvoTorcida : alvos[0].id;
        sec2.appendChild(chips(alvos.map(a=>({id:a.id, rot:linkTorcida(a.id,a.nome)+(a.aliada?' · aliada':''),
          nota:`${a.faixa} · rel. ${Math.round(a.relacao)}`})), alvoAtual,
          id=>{ P.definirAtaque(e, {alvo:id, onde, bombas:p.bombas, efetivo:p.efetivoAtaque}); salvar(); pintar(); }));
        sec2.appendChild(chips(P.ONDE_ATAQUE.map(o=>({id:o.id, rot:o.rot,
          nota: fora && o.id==='arredores' ? 'lá a gente é o visitante' : o.nota})), onde,
          id=>{ onde = id; P.definirAtaque(e, {alvo:alvoAtual, onde, bombas:p.bombas, efetivo:p.efetivoAtaque}); salvar(); pintar(); }));
        if(!fora){
          const f = P.efetivoDoAtaque(e);
          const ef = p.efetivoAtaque != null ? U.limitar(p.efetivoAtaque, f.piso, f.teto) : f.teto;
          sec2.appendChild(contador(ef, f.piso, f.teto, Math.max(1, Math.round(f.teto/10)),
            v=>{ P.definirAtaque(e, {alvo:alvoAtual, onde, bombas:p.bombas, efetivo:v}); salvar(); pintar(); },
            `atacam · de ${f.teto} · menor número rende mais prestígio`));
        }
      }
      /* bombas: pra caravana, só o estoque; em casa, compra na hora */
      const tem = (e.estoque||{}).bombas || 0;
      const podeComprar = fora ? 0 : Math.floor(Math.max(0, e.dinheiro) / TO.patrimonio.precoBomba(e));
      const leva = U.limitar(p.bombas || 0, 0, tem + podeComprar);
      sec2.appendChild(contador(leva, 0, tem + podeComprar, 1,
        v=>{ if(v > tem) TO.patrimonio.comprarBombas(e, v - tem); p.bombas = Math.min(v, (e.estoque||{}).bombas||0); p.decidido=false; salvar(); pintarTopo(); pintar(); },
        tem ? `bombas · ${tem} no estoque${!fora && podeComprar ? ` · a mais compra a ${U.dinheiro(TO.patrimonio.precoBomba(e))}` : ''}`
            : (fora ? 'bombas · estoque vazio' : `bombas · compra a ${U.dinheiro(TO.patrimonio.precoBomba(e))}`)));
      plano.appendChild(sec2);

      /* o resumo do plano */
      const alvoN = briga && p.alvoTorcida ? nomeDe(p.alvoTorcida) : null;
      const ondeRot = (P.ONDE_ATAQUE.find(o=>o.id===onde)||{}).rot || '';
      plano.appendChild(el('div',{class:'sem-resumo', html:
        `<span>${fora && est ? `${est.vao} para ${r.cidade||'fora'}` : 'Jogo em casa'}`+
        `${alvoN ? ` · em cima da ${alvoN} ${ondeRot.toLowerCase()}` : ' · em paz'}`+
        `${leva ? ` · ${leva} bomba${leva>1?'s':''}` : ''}</span>`+
        (est ? `<b class="negativo">${U.dinheiro(-est.custo)}</b>` : '')}));
      bloco.appendChild(plano);
      return bloco;
    };

    /* ---- um jogo alheio da praça: deixar passar ou investir ---- */
    const blocoOutro = (r, emCasa)=>{
      const p = P.plano(e);
      const bloco = el('div',{class:'sem-jogo'+(r.passou?' passou':'')});
      bloco.innerHTML = rotuloJogo(r) + ruaDe(r);
      /* o segundo jogo nosso da semana (ex.: copa no meio da semana e
         campeonato no fim) entra como linha sem controle: o plano é do
         `proximoJogo`, um por vez */
      if(r.passou || !vigente || !r.grupo || !r.grupo.chaveJogo) return bloco;
      /* na subsede o bote é do núcleo de lá, na pista ou na praça, em
         cima da caravana rival que viajou OU da torcida local do
         mandante (dono, 10/09/2026); marcar aqui pré-decide o bote */
      const inv = (p.investidas||{})[r.grupo.chaveJogo];
      const hostis = r.torcidas.filter(t=>t.hostil);
      const ondes = emCasa ? P.ONDE_ATAQUE : P.ONDE_ATAQUE.filter(o=>o.id!=='arredores');
      const base = emCasa ? {como:'arredores', olheiro:null} : {como:'ida', olheiro:'avenida', filial:m.abaSemana};
      const linha = el('div',{class:'sem-invest'});
      linha.appendChild(chips([
        {id:'passa', rot:'Deixar passar'},
        {id:'ataca', rot:'Investir', off:!hostis.length}
      ], inv && inv.alvo ? 'ataca' : 'passa', id=>{
        if(id==='passa') P.definirInvestida(e, r.grupo.chaveJogo, null);
        else P.definirInvestida(e, r.grupo.chaveJogo, Object.assign({alvo:(inv&&inv.alvo)||hostis[0].id}, base));
        salvar(); pintar();
      }));
      if(inv && inv.alvo){
        if(hostis.length > 1)
          linha.appendChild(chips(hostis.map(t=>({id:t.id, rot:linkTorcida(t.id,t.nome), nota:String(t.faixa).replace(' a ','–')})),
            inv.alvo, id=>{ P.definirInvestida(e, r.grupo.chaveJogo, Object.assign({}, inv, {alvo:id})); salvar(); pintar(); }));
        linha.appendChild(chips(ondes.map(o=>({id:o.id, rot:o.rot})),
          (ondes.find(o=>o.como===inv.como && (o.olheiro||null)===(inv.olheiro||null))||ondes[ondes.length-1]).id,
          id=>{ const o = P.ONDE_ATAQUE.find(x=>x.id===id); P.definirInvestida(e, r.grupo.chaveJogo, Object.assign({}, inv, {como:o.como, olheiro:o.olheiro})); salvar(); pintar(); }));
      }
      bloco.appendChild(linha);
      return bloco;
    };

    /* ---- a aba de uma praça ---- */
    function pintar(){
      corpo.innerHTML = '';
      for(const b of raiz.querySelectorAll('.sem-aba')) b.classList.toggle('on', b.querySelector('span').textContent === (M.cidade(m.abaSemana)||{}).nome);
      const pauta = F.pautaDaCidade(e, m.abaSemana, m.dados.semana, m.dados.ano);
      const cid = M.cidade(m.abaSemana) || {};
      if(!pauta.emCasa && vigente){
        const nucleo = TO.membros.aptosDaFilial ? TO.membros.aptosDaFilial(e, m.abaSemana).length : 0;
        corpo.appendChild(el('div',{class:'sem-nucleo', html:
          `<b>${nucleo}</b> do núcleo de ${cid.nome||''} de pé`}));
      }
      const meus = pauta.linhas.filter(l=>l.tipo==='nosso' || l.tipo==='fora');
      const pj = e.proximoJogo || {};
      const nosso = meus.find(l=> l.tipo==='fora' ? !pj.casa : (pj.casa && l.diaN === pj.dia)) || meus[0];
      if(nosso) corpo.appendChild(blocoNosso(nosso));
      else if(pauta.emCasa) corpo.appendChild(el('div',{class:'sem-nucleo', texto: vigente ? 'Semana de folga do time: nenhum jogo nosso.' : 'Semana sem jogo nosso.'}));
      const outros = pauta.linhas.filter(l=>l !== nosso);
      if(outros.length){
        corpo.appendChild(el('div',{class:'sem-rot alto', html:`Outros jogos em ${cid.nome||''} <small>${outros.length}</small>`}));
        for(const r of outros) corpo.appendChild(blocoOutro(r, pauta.emCasa));
      } else if(!nosso){
        corpo.appendChild(el('div',{class:'sem-rua vazia', texto:'Nenhum jogo nesta praça na semana.'}));
      }
      /* aliados que chegam: como receber */
      if(pauta.aliados.length){
        const bloco = el('div',{class:'sem-sec sem-recep'});
        bloco.appendChild(el('div',{class:'sem-rot', html:`Aliados na cidade <small>como receber</small>`}));
        for(const a of pauta.aliados){
          const pago = ((P.plano(e).pago)||{})[a.id];
          const linha = el('div',{class:'sem-linha'+(pago?' pago':'')});
          linha.appendChild(el('span',{html:`<b>${linkTorcida(a.id,a.nome)}</b> <small class="fraco">(${a.clube}) · vêm ${a.n} · ${DIA_ABREV[a.dia]||''}</small>`+(pago?' <span class="tag">resolvido</span>':'')}));
          const atual = P.nivelDe(e, a.id);
          linha.appendChild(chips(P.RECEPCAO.map(rc=>({id:rc.id, rot:rc.rot,
            nota:`${rc.porCabeca*a.n ? U.dinheiro(rc.porCabeca*a.n) : 'de graça'} · ${rc.relacao>0?'+':''}${rc.relacao}`, off:!!pago})),
            atual, id=>{ P.definirRecepcao(e, a.id, id); salvar(); pintar(); }));
          bloco.appendChild(linha);
        }
        corpo.appendChild(bloco);
      }
    }
    pintar();
    return raiz;
  }

  function cartaoMensagem(e, m){
    const art = el('article',{class:`msg kind-${m.kind||'msg'} peso-${m.peso}`+
      (m.tipo ? ' '+m.tipo : '') + (m.respondido ? ' respondida' : '')});
    /* a voz 'torcida' é a própria torcida falando (status, intermediação) */
    const quem  = m.voz === 'torcida' && m.dados && m.dados.nome
      ? linkTorcida(m.dados.de, m.dados.nome)
      : m.voz === 'eixo' && m.dados && m.dados.nome
      ? linkEixo(m.dados.de, m.dados.nome) : (ROT_VOZ[m.voz] || 'A rua');
    const papel = ROT_KIND[m.kind] || '';
    const q = m.quando || {};
    const d = TO.estado.dataDaSemana(q.ano||e.data.ano, q.semana||1, q.dia||1);
    const quando = `${String(d.getDate()).padStart(2,'0')}/`+
                   `${String(d.getMonth()+1).padStart(2,'0')} · ${m.hora||''}`;
    art.appendChild(el('div',{class:'msg-cab', html:
      `<span class="msg-voz">${quem}</span>`+
      `<span class="msg-papel">${papel}</span>`+
      `<time>${quando}</time>`}));
    art.appendChild(el('p',{class:'msg-txt', html: linkificarNomes(m.texto)}));

    if(m.kind === 'semana') art.appendChild(cartaoSemana(e, m));

    /* O RELATÓRIO DO OLHEIRO É TABELA (decisão do dono, 17/08/2026):
       coluna 1 a competição, o dia e o jogo com a cor de cada clube;
       coluna 2 as torcidas do jogo, cada uma com sua cor e estimativa. */
    const tab = m.dados && m.dados.tabela;
    if(tab && tab.length){
      const tb = el('table',{class:'tab-olheiro'});
      for(const r of tab){
        const tr = el('tr');
        tr.appendChild(el('td',{class:'to-jogo', html:
          `<small>${r.comp || ''}${r.dia ? ` · ${r.dia}` : ''}</small>`+
          `<div>${chipClube(r.clubes[0].id, r.clubes[0].cor)}${r.clubes[0].nome}`+
          `<span class="to-x">×</span>`+
          `${chipClube(r.clubes[1].id, r.clubes[1].cor)}${r.clubes[1].nome}</div>`}));
        tr.appendChild(el('td',{class:'to-torcidas', html:
          r.torcidas.map(t=>
            `<div${t.hostil ? '' : ' class="to-mansa"'}>`+
            `${chipTorcida(t.id, t.cor)}${linkificarNomes(t.nome)} <span class="to-faixa">`+
            `${String(t.faixa).replace(' a ','–')} membros</span></div>`)
            .join('') || '<div class="to-mansa">ninguém na rua</div>'}));
        tb.appendChild(tr);
      }
      art.appendChild(tb);
    }

    /* QUEM PÕE GENTE NO ESTÁDIO É TABELA (pedido do dono, 26/08/2026):
       linha única, uma coluna por torcida, com a cor primária na borda
       esquerda de cada uma. Mandantes primeiro, visitantes depois. */
    const pres = m.kind === 'partida' && m.dados && m.dados.presenca;
    if(pres && pres.length){
      const rolinho = el('div',{class:'rolo-presenca'});
      const tb = el('table',{class:'tab-presenca'});
      const tr = el('tr');
      const ordem = [...pres].sort((a,b)=>
        (b.casa?1:0)-(a.casa?1:0) || b.n-a.n);
      for(const p of ordem){
        const o = TO.mundo.torcida(p.id) || {};
        const cor = (TO.mundo.coresDaTorcida(o) || {}).cor || '#888';
        tr.appendChild(el('td',{class: p.casa ? '' : 'fora',
          estilo:{borderLeftColor:cor},
          title: p.casa ? 'torcida do mandante' : 'torcida do visitante',
          html:`<span>${linkTorcida(p.id, p.nome)}</span><b>${p.n}</b>`}));
      }
      tb.appendChild(tr);
      rolinho.appendChild(tb);
      art.appendChild(rolinho);
    }

    /* O BLOCO DA RECEPÇÃO DE ALIADO (pedido do dono, 28/08/2026):
       abaixo da tabela dos jogos, cada aliado que vem pra cidade com o
       número exato de membros e os quatro botões — cada um com o
       custo. A escolha fica anotada e a conta vira no dia do jogo;
       depois de paga, os botões apagam. */
    const alds = m.kind === 'olheiro' && m.dados && m.dados.aliados;
    if(alds && alds.length){
      const P2 = TO.planejamento;
      const bloco = el('div',{class:'bloco-recepcao'});
      bloco.appendChild(el('div',{class:'rec-titulo',
        texto:'Aliados na cidade — como vamos receber?'}));
      for(const a of alds){
        const pago = ((P2.plano(e).pago)||{})[a.id];
        const linha = el('div',{class:'rec-aliado'+(pago?' pago':'')});
        linha.appendChild(el('div',{class:'rec-nome', html:
          `<b>${linkTorcida(a.id, a.nome)}</b> <span class="fraco">(${a.clube}) · vêm `+
          `${a.n} · jogo ${['','seg','ter','qua','qui','sex','sáb','dom'][a.dia]||'dia '+a.dia}</span>`+
          (pago ? ' <span class="tag">resolvido</span>' : '')}));
        const bts = el('div',{class:'rec-botoes'});
        const atual = P2.nivelDe(e, a.id);
        for(const r of P2.RECEPCAO){
          const custo = r.porCabeca * a.n;
          const b = el('button',{class:'rec-bt'+(atual===r.id?' on':''),
            html:`${r.rot}<small>${custo ? U.dinheiro(custo) : 'de graça'}`+
                 ` · ${r.relacao>0?'+':''}${r.relacao} rel.</small>`});
          b.disabled = !!pago;
          b.onclick = ()=>{
            P2.definirRecepcao(e, a.id, r.id);
            for(const x of bts.children) x.classList.remove('on');
            b.classList.add('on');
            TO.estado.salvar();
          };
          bts.appendChild(b);
        }
        linha.appendChild(bts);
        bloco.appendChild(linha);
      }
      art.appendChild(bloco);
    }

    /* A LISTA DE ANIVERSÁRIOS DO MÊS (pedido do dono, 08/09/2026): cada
       aliada numa linha com a data, a idade e o seu Ir / Não ir. Quem
       já tem resposta mostra a etiqueta e apaga os botões. */
    const anivs = m.kind === 'aniversarios' && m.dados && m.dados.lista;
    if(anivs && anivs.length){
      const REL = TO.relacoes.REL;
      const bloco = el('div',{class:'bloco-recepcao bloco-anivs'});
      for(const a of anivs){
        const linha = el('div',{class:'rec-aliado'+(a.resposta?' pago':'')});
        linha.appendChild(el('div',{class:'rec-nome', html:
          `<b>${linkTorcida(a.torcida, a.nome)}</b> <span class="fraco">· dia `+
          `${a.data} · ${a.idade} anos</span>`+
          (a.resposta === 'ir' ? ' <span class="tag">vamos</span>'
           : a.resposta === 'nao' ? ' <span class="tag">não vamos</span>' : '')}));
        if(!a.resposta){
          const bts = el('div',{class:'rec-botoes'});
          const opcoes = [
            ['Ir pra festa', `R$ 2.000 · +${REL.irAniversario} rel.`, true],
            ['Não ir', `−${REL.furarAniversario} rel. · −2 prestígio`, false]];
          for(const [rot, nota, ir] of opcoes){
            const b = el('button',{class:'rec-bt'+(ir?' on':''),
              html:`${rot}<small>${nota}</small>`});
            b.onclick = ()=>{
              const r = TO.feed.responderAniversario(e, m.id, a.torcida, ir);
              if(!r.ok) return;
              TO.estado.salvar();
              atualizarFeed(); pintarTopo();
              /* respondida a última aliada, o relógio volta a andar na
                 hora — é o que `responderMensagem` faz por toda decisão;
                 sem isto o feed ficava parado até outra coisa acordar o
                 relógio (delay visto pelo dono, 08/09/2026) */
              if(r.fechou){ redesenhar(); if(!TO.feed.travado(e)) retomarTempo('decisao'); }
            };
            bts.appendChild(b);
          }
          linha.appendChild(bts);
        }
        bloco.appendChild(linha);
      }
      art.appendChild(bloco);
    }

    /* a linha de consequência sai dos efeitos aplicados, nunca do texto */
    if(m.consequencia)
      art.appendChild(el('div',{class:'msg-efeitos',
        html: linkificarNomes(m.consequencia)}));

    /* links informativos não consomem nada — "Ver Competições" */
    for(const l of (m.links || [])){
      const la = el('div',{class:'msg-abaixo'});
      const a = el('button',{class:'msg-link', texto:l.rot});
      a.onclick = ()=>{
        const args = l.args || {};
        if(args.pagina === 'noticias' && args.aba) subNoticias = args.aba;
        /* O LINK DA MENSAGEM POSICIONA A TELA (23/08/2026): com
           Competições em três níveis, "ver a chave" tem de dizer qual
           nível, qual país e qual competição — senão cai na Série A. */
        if(args.nivel){
          nivelComp = args.nivel;
          if(args.pais) paisComp = args.pais;
          if(args.comp) compSel = args.comp;
        }
        abrirPainel(args.pagina || 'competicoes');
      };
      la.appendChild(a);
      art.appendChild(la);
    }

    /* a tabela das brigas da semana saiu junto com a mensagem dela
       (decisão do dono, 21/08/2026): quem conta briga é o Futebol e
       Porrada, e a lista cheia mora em Notícias → Brigas */

    /* A RODADA VIRA PRIMEIRA PÁGINA (régua do dono, 20/08/2026): a
       linha corrida de placares dá lugar a um recorte de jornal. Se a
       mensagem for velha e não tiver os jogos guardados, o texto de
       sempre continua valendo — nada quebra em save antigo. */
    /* FUTEBOL E PORRADA (pedido do dono, 21/08/2026): a briga da nossa
       torcida deixa de ser uma linha e vira a primeira página do
       jornal da rua. Save antigo, sem os dois lados guardados,
       continua no texto de sempre. */
    /* O ALMANAQUE (pedido do dono, 21/08/2026): campeão, virada de ano
       e os dois prêmios saem no mesmo esqueleto de jornal. */
    if(m.kind === 'almanaque' && m.dados && m.dados.pagina){
      const txt = art.querySelector('.msg-txt');
      if(txt) txt.remove();
      art.appendChild(recorteDoAlmanaque(m.dados.pagina, e));
    }

    /* A LNT NO JORNAL (pedido do dono, 22/08/2026): a fundação e o
       fim de cada edição saem no Futebol e Porrada, no mesmo
       esqueleto da briga. */
    if((m.kind === 'lnt-fundacao' || m.kind === 'lnt-fim') &&
       TO.porrada && TO.porrada.montarLNT){
      const pg = TO.porrada.montarLNT(e, m);
      if(pg){
        const txt = art.querySelector('.msg-txt');
        if(txt) txt.remove();
        art.appendChild(recorteDaLNT(pg));
      }
    }

    if(m.kind === 'confronto' && TO.porrada){
      const pg = TO.porrada.montar(e, m);
      if(pg){
        const txt = art.querySelector('.msg-txt');
        if(txt) txt.remove();
        art.appendChild(recorteDaPorrada(pg, m));
      }
    }

    if(m.kind === 'rodada' && TO.gazeta){
      const pg = TO.gazeta.montar(e, m);
      if(pg){
        const txt = art.querySelector('.msg-txt');
        if(txt) txt.remove();
        /* o "Ver Competições" do cartão FICA: o jornal encolheu e não
           tem mais pé próprio, então o único caminho pra tabela cheia
           é o link da mensagem */
        art.appendChild(recorteDaRodada(pg, m));
      }
    }

    /* a partida ao vivo: com a bola rolando o cartão é a barra de
       minutos; encerrada, a lista de gols fica como registro */
    const aoVivo = m.kind === 'partida' && m.dados && m.dados.iniciada;
    /* O ITINERÁRIO DO DIA MORA AQUI (correção do dono, 20/08/2026): a
       linha de paradas é adotada pelo cartão da própria mensagem que
       abriu o dia. Enquanto ela existe, quem desenha a partida é a
       parada do jogo — dois relógios do mesmo jogo andariam em dobro. */
    const linha = itnNaMensagem(m);
    if(linha) art.appendChild(linha);
    if(aoVivo && !m.respondido && !linha) art.appendChild(widgetPartida(m));
    /* com a linha do dia no cartão, os gols já estão dentro da parada
       do jogo — repetir a lista aqui embaixo é o mesmo jogo duas vezes */
    if(m.kind === 'partida' && m.respondido && !linha && (m.dados||{}).gols &&
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
    } else if(aoVivo || linha){
      /* sem botões: o dia está andando na linha, ou a bola está rolando
         — nos dois casos o apito é quem fecha */
    } else if((m.botoes||[]).length){
      const bs = el('div',{class:'msg-bts'});
      (m.botoes||[]).forEach((b, i)=>{
        /* o Simular nunca é o destaque: descer continua sendo a
           resposta que o jogo pede primeiro */
        const bt = el('button',{class:'bt'+(i===0 && !b.simular ? ' destaque':'')+
                                          (b.simular ? ' simular' : '')});
        bt.innerHTML = `<span>${b.rot}</span>`+
                       (b.nota ? `<small>${b.nota}</small>` : '');
        if(b.dica) bt.title = b.dica;
        bt.onclick = ()=>responderMensagem(m.id, b.id);
        bs.appendChild(bt);
      });
      /* o cartão de segunda leva o botão no próprio cabeçalho, pra
         fechar o plano sem rolar a tela (pedido do dono, 10/09/2026) */
      const cab = m.kind === 'semana' && art.querySelector('.sem-cab');
      if(cab) cab.appendChild(bs); else art.appendChild(bs);
    }
    return art;
  }

  /* O BOTÃO APERTADO. O efeito de estado é do `TO.feed`; o que sobra
     aqui é abrir tela, que é a única coisa que a tela sabe fazer. */
  /* A DECISÃO QUE ESPERA A TELA (correção do dono, 21/08/2026): as
     telas canceláveis abrem SEM responder a mensagem. Guardamos aqui
     qual decisão está aberta; o Confirmar da tela chama
     `confirmarDecisao()`, que é quem finalmente a marca. Fechar não
     chama nada: a decisão continua de pé, o relógio segue parado e a
     mensagem volta pro feed com os botões dela. */
  let decisaoAberta = null;

  function responderMensagem(id, idBotao){
    const e = E();
    const r = TO.feed.responder(e, id, idBotao);
    atualizarFeed();
    if(!r.ok) return;
    if(r.abrir){
      const t = r.abrir.tela, a = r.abrir.args || {}, m = r.abrir.msg;
      /* o botão Simular chega marcado daqui: o palco lê a marca uma vez
         e a apaga, pra que a próxima briga volte a ser jogada */
      simularProxima = !!r.abrir.simular;
      decisaoAberta = r.abrir.cancelavel
        ? {id, botao: r.abrir.botao || idBotao} : null;
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
      else if(t === 'tutorial') TO.tutorial.iniciar();
      else if(t === 'painel') abrirPainel(a.pagina || 'competicoes');
    }
    /* A BOLA ROLANDO ABRE O DIA INTEIRO (régua do dono, 20/08/2026):
       a partida deixou de ser um cartão solto no feed e virou uma
       parada do itinerário, junto da concentração, da pista, dos
       arredores e — em viagem — das praças da estrada. */
    if(idBotao === 'iniciar'){
      const msg = (e.feed || []).find(x=>x.id === id);
      if(msg && msg.kind === 'partida') abrirItinerario(msg);
    }
    TO.estado.salvar();
    pintarTopo();
    /* respondida a última decisão, o relógio volta a andar sozinho */
    if(!TO.feed.travado(e)) retomarTempo('decisao');
  }

  /* as telas de caravana, ataque e assalto chamam isto no Confirmar:
     é ele que responde a mensagem que abriu a tela e solta o relógio */
  function confirmarDecisao(rot){
    const e = E();
    if(!e) return;
    if(decisaoAberta){
      TO.feed.marcarResposta(e, decisaoAberta.id, decisaoAberta.botao, rot);
      decisaoAberta = null;
      atualizarFeed();
    }
    if(!TO.feed.travado(e)) retomarTempo('decisao');
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
  /* =======================================================
     O RANKING EM DUAS ABAS (pedido do dono, 23/08/2026)

     "O ranking de torcidas deve mostrar dois rankings agora, o do país
     e o do mundo, em abas separadas. A que vai pro cabeçalho do feed é
     a nacional."

     Abre no país, que é com quem a gente compete de verdade: numa lista
     de 388 torcidas de dez países, a organizada de interior aparecia em
     200º por causa da Boca e da Colo-Colo. No mundo, a coluna # é a
     posição continental e o país de cada uma vem ao lado do nome.
     ======================================================= */
  let abaRanking = 'pais';

  function pintarRanking(){
    const e = E(), pg = U.$('.pagina[data-pag="ranking"]');
    if(!e || !pg) return;
    pg.innerHTML = '';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Ranking de torcidas'}));

    const meuPais = TO.relacoes.paisDaTorcida(e.torcida.id);
    const mundial = abaRanking === 'mundo';
    pg.appendChild(abasGrandes([
      {id:'pais',  rot:meuPais, dica:'o ranking que vale no cabeçalho do feed'},
      {id:'mundo', rot:'América do Sul',
       dica:'as torcidas dos dez países na mesma fila'}
    ], abaRanking, id=>{ abaRanking = id; redesenhar(); }));

    /* O RECADO DA FÓRMULA SAIU (ordem do dono, 24/08/2026): o texto
       explicava a régua velha e ficou pra trás quando ela mudou. */
    if(mundial) pg.appendChild(el('div',{class:'recado',
      html:'Esta é a fila do continente inteiro; a do cabeçalho é a do país.'}));
    const lista = mundial ? TO.relacoes.ranking(e)
                          : TO.relacoes.rankingDoPais(e);
    const t = el('table',{class:'tab-ranking'});
    /* A VARIAÇÃO DO MÊS (pedido do dono, 20/08/2026): o numerozinho
       ao lado diz o quanto aquele número andou desde a virada do mês.
       Sempre com sinal — parado é "(+0)", não é vazio. */
    const vario = (v, casas)=>{
      /* o sinal sai do número JÁ ARREDONDADO, não do bruto: uma queda
         de 0,04 na força vira "(+0,0)" e não "(0,0)" — meio sinal é
         coluna torta. */
      const n = casas ? Math.round((v||0)*10)/10 : Math.round(v||0);
      const cls = n > 0 ? 'bom' : n < 0 ? 'ruim' : '';
      const txt = casas ? Math.abs(n).toFixed(1) : Math.abs(n);
      return ` <i class="rk-var ${cls}">(${n < 0 ? '−' : '+'}${txt})</i>`;
    };
    t.innerHTML = `<thead><tr><th>#</th><th>Torcida</th>
      <th class="nu">Membros</th><th class="nu">Prestígio</th>
      <th class="nu">Força média</th>
      <th class="nu" title="sede, bares, lojas e subsedes somados">Prédios</th>
      <th class="nu" title="nível da sede — só informação, não entra nos pontos">Sede</th>
      <th class="nu" title="ônibus na garagem — só informação, não entra nos pontos">Ônibus</th>
      <th class="nu" title="subsedes em outras cidades — só informação, não entra nos pontos">Filiais</th>
      <th class="nu" title="vitórias menos derrotas em brigas no ano">Saldo</th>
      <th>Situação</th>
      <th class="nu">Pontos</th></tr></thead>`;
    const tb = el('tbody');
    for(const r of lista){
      const o = TO.mundo.torcida(r.id) || {};
      const cor = (TO.mundo.coresDaTorcida(o) || {}).cor || '#888';
      const tr = el('tr',{class: r.nossa ? 'nossa' : ''});
      const sit = r.situacao || {rot:'—', slug:'pobre', mult:1};
      /* sede e ônibus são só INFORMAÇÃO (ordem do dono, 25/08/2026):
         não entram no cálculo dos pontos */
      const viva = (e.mundoTorcidas || {})[r.id];
      const sede = r.nossa ? e.torcida.sedeNivel : (viva ? viva.sede : null);
      const onibus = r.nossa ? TO.financeiro.onibusDe(e)
                   : (viva ? TO.relacoes.frotaIA(viva) : null);
      const filiais = r.nossa ? ((e.patrimonio||{}).filiais||[]).length
                    : (viva ? (viva.filiais||[]).length : null);
      /* no mundo o país fica ao lado do nome; no país seria repetição */
      const bandeirinha = mundial
        ? `<em class="rk-pais">${TO.relacoes.paisDaTorcida(r.id)}</em>` : '';
      tr.innerHTML =
        `<td class="pos">${r.pos}º</td>
         <td>${chipTorcida(r.id, cor)}`+
        `${linkTorcida(r.id, r.nome)}${bandeirinha}</td>
         <td class="nu">${U.numero(r.membros)}${vario(r.varMembros)}</td>
         <td class="nu">${r.prestigio}${vario(r.varPrestigio)}</td>
         <td class="nu">${(Math.round(r.forca*10)/10).toFixed(1)}`+
        `${vario(r.varForca, 1)}</td>
         <td class="nu">${r.predios || 0}</td>
         <td class="nu">${sede != null ? 'n'+sede : '—'}</td>
         <td class="nu">${onibus != null ? onibus : '—'}</td>
         <td class="nu">${filiais != null ? filiais : '—'}</td>
         <td class="nu saldo-briga ${(r.saldo||0) > 0 ? 'bom'
             : (r.saldo||0) < 0 ? 'ruim' : ''}">`+
        `${(r.saldo||0) > 0 ? '+' : ''}${r.saldo || 0}</td>
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

  let subNoticias = 'mensagens';
  /* =======================================================
     O COFRE DE SAVES (pedido do dono, 23/08/2026)

     Seis vagas, a primeira sendo o autosave. Cada uma diz de quem é o
     save, em que semana parou e quando foi gravada. Embaixo, os dois
     caminhos que sobrevivem ao navegador: arquivo e texto.

     E A PRIMEIRA COISA DA TELA É O DIAGNÓSTICO. Salvar falhava calado —
     `salvar()` sempre devolveu `{ok, motivo}` e quase ninguém lia o
     motivo. Navegador que recusa o armazenamento agora avisa aqui, em
     vermelho, ANTES de o jogador perder cinco anos de partida.
     ======================================================= */
  let ultimaFalhaSave = null;

  function pintarJogo(){
    const e = E(), pg = U.$('.pagina[data-pag="jogo"]');
    pg.innerHTML = '';
    pg.appendChild(el('div',{class:'titulo-barra', html:'<h1>Jogo</h1>'}));

    const diag = TO.estado.diagnostico();
    if(!diag.ok){
      const av = el('div',{class:'save-alarme'});
      av.innerHTML = `<b>O navegador não está guardando o save.</b>`+
        `<span>${diag.motivo}</span>`;
      pg.appendChild(av);
    } else if(ultimaFalhaSave){
      const av = el('div',{class:'save-alarme'});
      av.innerHTML = `<b>O último save não gravou.</b>`+
        `<span>${ultimaFalhaSave.motivo}</span>`;
      pg.appendChild(av);
    }

    const duas = el('div',{class:'comp-duas'});
    const esq = el('div');

    /* ---------- as vagas ---------- */
    const q = quadro('Vagas de save', el('span',{class:'conta',
      texto: e && e.vaga ? `jogando na vaga ${e.vaga}` : 'autosave'}));
    const pintarVagas = ()=>{
      q.corpo.innerHTML = '';
      for(const v of TO.estado.listarSaves()){
        const l = el('div',{class:'save-vaga'+(v.vazia?' vazia':'')+
                                   (e && e.vaga === v.vaga ? ' atual':'')});
        const quando = v.quando ? new Date(v.quando) : null;
        const dt = quando ? `${String(quando.getDate()).padStart(2,'0')}/`+
          `${String(quando.getMonth()+1).padStart(2,'0')} `+
          `${String(quando.getHours()).padStart(2,'0')}:`+
          `${String(quando.getMinutes()).padStart(2,'0')}` : '';
        l.appendChild(el('div',{class:'save-rot', html:
          `<b>${v.auto ? 'Autosave' : 'Vaga '+v.vaga}</b>`+
          (v.vazia ? '<small>vazia</small>'
                   : `<small>${v.torcida} · ${v.clube||'—'}</small>`)}));
        l.appendChild(el('div',{class:'save-quando', html: v.vazia ? '—' :
          `<span>semana ${v.semana} de ${v.ano}</span>`+
          `<small>${dt} · ${Math.round((v.bytes||0)/1024)} KB · `+
          `${v.membros||0} membros</small>`}));
        const bts = el('div',{class:'save-bts'});
        const grav = el('button',{class:'bt', texto: v.vazia ? 'Salvar aqui'
                                                             : 'Sobrescrever'});
        grav.disabled = !e || TO.estado.estaBloqueado();
        grav.onclick = ()=>{
          pararTudo('salvar');
          const r = TO.estado.salvarEm(v.vaga);
          soltarTudo('salvar');
          aviso(r.ok ? `Salvo na ${v.auto?'vaga do autosave':'vaga '+v.vaga}.`
                     : 'Não salvou: '+r.motivo, r.ok?'boa':'ruim');
          pintarVagas();
        };
        bts.appendChild(grav);
        const ler = el('button',{class:'bt', texto:'Carregar'});
        ler.disabled = v.vazia;
        ler.onclick = ()=> confirmarCarga(v);
        bts.appendChild(ler);
        const apagar = el('button',{class:'bt fraco', texto:'Apagar'});
        apagar.disabled = v.vazia;
        apagar.onclick = ()=>{
          modal('Apagar a vaga', v.vazia ? '' : `${v.torcida} · semana `+
            `${v.semana} de ${v.ano}`,
            el('p',{class:'nota', texto:'Isso não tem volta. Se este save '+
              'importa, guarde ele em arquivo ou em texto antes.'}),
            [['Apagar', ()=>{ TO.estado.apagarSave(v.vaga); pintarVagas();
                              aviso('Vaga apagada.', 'boa'); }]]);
        };
        bts.appendChild(apagar);
        l.appendChild(bts);
        q.corpo.appendChild(l);
      }
    };
    pintarVagas();
    esq.appendChild(q);

    /* carregar por cima de uma partida em curso pede confirmação */
    function confirmarCarga(v){
      const abrir = ()=>{
        const ok = TO.estado.carregarDe(v.vaga);
        if(!ok){ aviso('Esse save não abriu — pode ser de outra versão '+
                       'do jogo.', 'ruim'); return; }
        fecharPainel();
        redesenhar();
        aviso(`Carregado: ${v.torcida}, semana ${v.semana} de ${v.ano}.`, 'boa');
      };
      if(!e) return abrir();
      modal('Carregar este save',
        `${v.torcida} · semana ${v.semana} de ${v.ano}`,
        el('p',{class:'nota', texto:'A partida em curso sai da tela. Ela '+
          'continua guardada na vaga dela, mas o que ainda não foi salvo '+
          'se perde.'}),
        [['Carregar', abrir]]);
    }

    /* ---------- fora do navegador ---------- */
    const dir = el('div');
    const f = quadro('Fora do navegador', el('span',{class:'conta',
      texto:'a cópia que não depende de nada'}));
    f.corpo.appendChild(el('p',{class:'nota', texto:
      'Vaga de save mora no navegador: limpar dados do site, trocar de '+
      'navegador ou abrir numa janela anônima leva tudo junto. Estas duas '+
      'saídas sobrevivem a isso.'}));

    const linhaArq = el('div',{class:'save-saida'});
    linhaArq.appendChild(el('div',{class:'save-rot', html:
      '<b>Arquivo</b><small>um .json na sua pasta de downloads</small>'}));
    const btsA = el('div',{class:'save-bts'});
    const baixar = el('button',{class:'bt', texto:'Baixar o save'});
    baixar.disabled = !e;
    baixar.onclick = ()=>{ TO.estado.exportar();
      aviso('Se o download não abrir, use o save por texto aqui embaixo.',
            'neutro'); };
    btsA.appendChild(baixar);
    const arq = el('input');
    arq.type = 'file'; arq.accept = '.json,application/json';
    arq.style.display = 'none';
    arq.onchange = ev=>{
      const a = ev.target.files[0];
      if(!a) return;
      TO.estado.importar(a, r=>{
        if(!r.ok){ aviso('Não deu pra abrir: '+r.motivo, 'ruim'); return; }
        fecharPainel(); redesenhar();
        aviso('Save carregado do arquivo.', 'boa');
      });
    };
    const abrirArq = el('button',{class:'bt', texto:'Carregar de arquivo'});
    abrirArq.onclick = ()=>arq.click();
    btsA.appendChild(abrirArq);
    linhaArq.appendChild(btsA);
    linhaArq.appendChild(arq);
    f.corpo.appendChild(linhaArq);

    const linhaTxt = el('div',{class:'save-saida'});
    linhaTxt.appendChild(el('div',{class:'save-rot', html:
      '<b>Texto</b><small>compactado, pra colar num bloco de notas</small>'}));
    const btsT = el('div',{class:'save-bts'});
    const copiar = el('button',{class:'bt', texto:'Gerar o texto'});
    copiar.disabled = !e;
    copiar.onclick = async ()=>{
      copiar.disabled = true; copiar.textContent = 'compactando…';
      const r = await TO.estado.paraTexto();
      copiar.disabled = false; copiar.textContent = 'Gerar o texto';
      if(!r.ok){ aviso('Não deu: '+r.motivo, 'ruim'); return; }
      caixaDeTexto(r);
    };
    btsT.appendChild(copiar);
    const colar = el('button',{class:'bt', texto:'Colar um save'});
    colar.onclick = ()=>caixaDeColar();
    btsT.appendChild(colar);
    linhaTxt.appendChild(btsT);
    f.corpo.appendChild(linhaTxt);
    dir.appendChild(f);

    /* o Ctrl+S continua valendo, e a tela conta isso */
    const at = quadro('Atalhos');
    at.corpo.appendChild(el('div',{class:'sub-chave',
      texto:'Ctrl + S grava no autosave, a qualquer momento'}));
    at.corpo.appendChild(el('div',{class:'sub-chave',
      texto:'o autosave também grava sozinho no fim de cada semana '+
            'e ao fechar a aba'}));
    at.corpo.appendChild(el('div',{class:'sub-chave',
      texto:'as vagas 1 a 5 só mudam quando você aperta Salvar aqui — '+
            'são pontos de retorno e o autosave não pisa nelas'}));
    dir.appendChild(at);

    duas.appendChild(esq);
    duas.appendChild(dir);
    /* o "Como funciona" que a mensagem de pular promete: reabre o
       passo a passo do tutorial a qualquer hora (dono, 02/09/2026) */
    const qt = quadro('Como funciona');
    const btTut = el('button',{class:'bt', texto:'Rever o passo a passo'});
    btTut.style.margin = '10px 14px';
    btTut.onclick = ()=>TO.tutorial.iniciar();
    qt.corpo.appendChild(btTut);
    dir.appendChild(qt);

    pg.appendChild(duas);
  }

  /* o texto do save numa caixa que dá pra selecionar e copiar. O botão
     de copiar usa a área de transferência quando o navegador deixa; não
     deixando, o texto está ali, selecionado, esperando o Ctrl+C. */
  function caixaDeTexto(r){
    const cx = el('div');
    cx.appendChild(el('p',{class:'nota', texto:
      `${Math.round(r.texto.length/1024)} KB de texto (o save cru tem `+
      `${Math.round(r.cru/1024)} KB). Copie tudo e guarde num arquivo de `+
      `texto — é ele que traz a partida de volta em qualquer navegador.`}));
    const ta = el('textarea',{class:'save-texto'});
    ta.value = r.texto; ta.readOnly = true;
    cx.appendChild(ta);
    /* o Copiar mora no CORPO e não no rodapé: botão de rodapé fecha a
       caixa, e fechar a caixa em cima de uma cópia que falhou seria
       levar o texto embora justo na hora em que ele é necessário */
    const bc = el('button',{class:'bt destaque', texto:'Copiar tudo'});
    bc.onclick = ()=>{
      ta.select();
      const feito = ()=>{ bc.textContent = 'Copiado ✓';
        setTimeout(()=>bc.textContent = 'Copiar tudo', 2500); };
      if(navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(ta.value).then(feito, ()=>{
          bc.textContent = 'use Ctrl+C — está selecionado'; });
      else { document.execCommand && document.execCommand('copy'); feito(); }
    };
    cx.appendChild(bc);
    modal('O save em texto', '', cx, [], 'larga');
    setTimeout(()=>{ ta.focus(); ta.select(); }, 60);
  }

  function caixaDeColar(){
    const cx = el('div');
    cx.appendChild(el('p',{class:'nota', texto:
      'Cole aqui o texto que você guardou. A partida em curso sai da tela.'}));
    const ta = el('textarea',{class:'save-texto'});
    ta.placeholder = 'TO2z:…';
    cx.appendChild(ta);
    const aviso2 = el('p',{class:'nota'});
    cx.appendChild(aviso2);
    modal('Colar um save', '', cx, [
      ['Carregar', ()=>{
        TO.estado.deTexto(ta.value).then(r=>{
          if(!r.ok){ aviso('Não deu: '+r.motivo, 'ruim'); return; }
          fecharPainel(); redesenhar();
          aviso('Save carregado do texto.', 'boa');
        });
      }]], 'larga');
    setTimeout(()=>ta.focus(), 60);
  }

  function pintarNoticias(){
    const e = E(), pg = U.$('.pagina[data-pag="noticias"]');
    if(!e || !pg) return;
    pg.innerHTML = '';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Notícias'}));
    const naoLidas = TO.feed.mensagensNaoLidas ? TO.feed.mensagensNaoLidas(e) : 0;
    const tretasNovas = TO.feed.tretasNaoLidas ? TO.feed.tretasNaoLidas(e) : 0;
    pg.appendChild(subabas([
      {id:'mensagens', rot:'Mensagens' + (naoLidas ? ` (${naoLidas})` : '')},
      {id:'tretas',  rot:'Tretas' + (tretasNovas ? ` (${tretasNovas})` : '')},
      {id:'arquivo', rot:'Arquivo do feed'},
      {id:'brigas',  rot:'Brigas'}
    ], subNoticias, id=>{subNoticias=id; redesenhar();}));

    if(subNoticias === 'brigas'){ pg.appendChild(painelBrigasIA(e)); return; }
    if(subNoticias === 'mensagens'){ pg.appendChild(painelMensagens(e)); return; }
    if(subNoticias === 'tretas'){ pg.appendChild(painelTretas(e)); return; }

    /* a retrospectiva do último ano, pra rever (dono, 09/09/2026) */
    if(e.retrospectiva && (e.retrospectiva.paginas||[]).length){
      const bR = el('button',{class:'bt larga retro-rever', texto:`Rever a retrospectiva de ${e.retrospectiva.ano}`});
      bR.onclick = ()=>abrirRetrospectiva(e.retrospectiva);
      pg.appendChild(bR);
    }
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

  /* A ABA MENSAGENS (pedido do dono, 08/09/2026): a comunicação entre
     torcidas — provocação, convite, agradecimento, o "estamos juntos".
     Abrir a aba dá tudo por lido, e o número do ícone some. */
  const ROT_MSG = {provocacao:'Provocação', convite:'Convite', agradecimento:'Agradecimento',
                   juntos:'Estamos juntos', recusa:'Recusa', cobranca:'Cobrança', recado:'Recado',
                   pedido:'Pedido de casa', tregua:'Proposta de trégua', treta:'Treta marcada'};
  /* a tabela dos jogos da semana com os botões de cada jogo, e o bloco
     da recepção dos aliados que chegam (o cartão antigo do olheiro,
     vivo em Notícias → Mensagens desde 09/09/2026) */
  function painelMensagens(e){
    const cx = el('div');
    const lista = e.mensagens || [];
    /* O PLANEJAMENTO MORA AQUI AGORA (pedido do dono, 08/09/2026): quem
       quiser bolar o ataque da semana sem esperar o olheiro abre a tela
       por este botão. A caravana continua no feed. */
    const P2 = TO.planejamento;
    /* A PAUTA DA SEMANA SAIU DAQUI (pedido do dono, 10/09/2026): virou
       o cartão de segunda-feira do feed, com uma aba por praça */
    const c = cartao('Mensagens de outras torcidas', `${lista.length} ${lista.length===1?'recado':'recados'}`);
    if(!lista.length)
      c.corpo.innerHTML = '<div class="em-construcao">Ninguém mandou recado ainda.</div>';
    const corDe = id => { const o = TO.mundo.torcida(id); return (o && TO.mundo.coresDaTorcida(o).cor) || '#888'; };
    for(const m of lista.slice(0, 120)){
      const q = m.quando || {};
      const dia = TO.feed.NOME_DIA ? (TO.feed.NOME_DIA[q.dia] || '') : '';
      const quando = q.semana ? `${q.ano} · sem. ${q.semana}${dia ? ' · '+dia : ''}` : '';
      const art = el('div',{class:'msg-torcida'+(m.lida?'':' nova')+' tipo-'+m.tipo, html:
        `<div class="mt-cab">${chipTorcida(m.de, corDe(m.de))}<b>${linkTorcida(m.de, m.nome)}</b>`+
        `<span class="tag">${ROT_MSG[m.tipo]||m.tipo}</span><span class="quando">${quando}</span></div>`+
        `<p>${m.texto}</p>`});
      /* as que pedem resposta: recepção (quatro níveis) e trégua */
      if(!m.resposta && (m.tipo === 'pedido' || m.tipo === 'tregua')){
        const bts = el('div',{class:'rec-botoes'});
        const opcoes = m.tipo === 'pedido'
          ? P2.RECEPCAO.map(r=>({id:r.id, rot:r.rot,
              nota:`${r.porCabeca ? U.dinheiro(r.porCabeca*((m.dados||{}).n||0)) : 'de graça'} · ${r.relacao>0?'+':''}${r.relacao} rel.`}))
          : [{id:'aceitar', rot:'Aceitar a trégua', nota:'ninguém procura ninguém até o fim do ano · +15 rel.'},
             {id:'recusar', rot:'Recusar', nota:'−5 rel.'}];
        for(const o of opcoes){
          const b = el('button',{class:'rec-bt', html:`${o.rot}<small>${o.nota}</small>`});
          b.onclick = ()=>{
            const r = TO.feed.responderMensagemDe(e, m.id, o.id);
            if(!r.ok) return;
            TO.estado.salvar(); redesenhar();
          };
          bts.appendChild(b);
        }
        art.appendChild(bts);
      } else if(m.resposta){
        art.appendChild(el('div',{class:'msg-efeitos', html:
          `Você respondeu: <b>${m.tipo==='pedido' ? (P2.recepcaoDe(m.resposta).rot) : (m.resposta==='aceitar'?'Aceitar a trégua':'Recusar')}</b>`+
          (m.consequencia ? ` · ${m.consequencia}` : '')}));
      }
      c.corpo.appendChild(art);
    }
    cx.appendChild(c);
    /* lido: ao pintar */
    if(TO.feed.lerMensagens && lista.some(m=>!m.lida)){
      TO.feed.lerMensagens(e); TO.estado.salvar(); atualizarBadges();
    }
    return cx;
  }

  /* a aba BRIGAS: o que o mundo se pegou por conta própria, briga a
     briga, com efetivos, feridos, presos e o jogo que deu o motivo
     (decisão do dono, 17/08/2026) */
  /* NOTÍCIAS → TRETAS (pedido do dono, 08/09/2026): as brigas NOSSAS,
     cada uma com a página do Futebol e Porrada, fora do rolo do feed.
     Abrir a aba dá as notícias por lidas e apaga o número vermelho. */
  function painelTretas(e){
    const cx = el('div',{class:'feed-lista tretas-lista'});
    const lista = TO.feed.tretas ? TO.feed.tretas(e) : [];
    if(TO.feed.lerTretas){ TO.feed.lerTretas(e); atualizarBadges(); }
    if(!lista.length){
      cx.appendChild(el('div',{class:'em-construcao',
        texto:'Nenhuma treta nossa ainda. Quando sair uma, a notícia cai aqui.'}));
      return cx;
    }
    for(const m of lista.slice(0, 100)) cx.appendChild(cartaoMensagem(e, m));
    if(lista.length > 100)
      cx.appendChild(el('div',{class:'linha-dado', html:
        `<span class="fraco">…e mais ${lista.length-100} tretas mais antigas.</span>`}));
    return cx;
  }

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
    const chip = (id, nome) => `${chipTorcida(id, corDe(id))}${nome}`;
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
        `${b.revanche ? ' · revanche' : ''}`+
        `${b.saque ? ` · saque de ${U.dinheiro(b.saque)}` : ''}`+
        `${b.pano ? ` · <b class="pano-tomado">${b.pano.para} tomou a ${b.pano.tipo} da ${b.pano.de}</b>` : ''}`+
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
  /* OS NÚMEROS VERMELHOS NOS ÍCONES (pedido do dono, 08/09/2026):
     Torcida mostra quantos membros estão prontos pra promoção; Notícias
     mostra as mensagens de outras torcidas ainda não lidas. */
  /* a MESMA régua do status "Pronto p/ promoção" da tabela de membros:
     preso e ferido não contam, mesmo com XP de sobra */
  function pendenciasDaTorcida(e){
    let n = 0;
    for(const m of (e.membros||[])){
      if(m.preso || m.ferido) continue;
      if(TO.membros.podePromover(e, m).ok) n++;
    }
    return n;
  }
  function atualizarBadges(){
    const e = E();
    if(!e) return;
    const conta = {torcida: pendenciasDaTorcida(e),
                   noticias: (TO.feed.mensagensNaoLidas ? TO.feed.mensagensNaoLidas(e) : 0)
                           + (TO.feed.tretasNaoLidas ? TO.feed.tretasNaoLidas(e) : 0)};
    for(const [pag, n] of Object.entries(conta)){
      for(const b of document.querySelectorAll(`.mapa-ic[data-pag="${pag}"] .ic-badge, .nav-item[data-pag="${pag}"] .ic-badge`)){
        b.textContent = n > 99 ? '99+' : String(n);
        b.hidden = !n;
      }
    }
  }
  /* o aviso ao lado do ícone: "Mensagem de {torcida}", uns segundos */
  function balaoNoIcone(pag, texto){
    const ic = document.querySelector(`.feed-menu .mapa-ic[data-pag="${pag}"]`);
    if(!ic || !ic.isConnected) return;
    const velho = ic.querySelector('.ic-balao'); if(velho) velho.remove();
    const b = el('span',{class:'ic-balao', texto});
    ic.appendChild(b);
    setTimeout(()=>b.remove(), 3800);
  }

  function pintarTopo(){
    const e = E();
    if(!e) return;
    atualizarBadges();
    atualizarTicker();
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
         dono, 17/08/2026): #pos ao lado do nome; ataque e defesa
         médios ao lado do prestígio. A média de moral dos membros deu
         lugar à MORAL DA TORCIDA (ordem do dono, 24/08/2026), na
         régua de 0 a 100 — a moral de membro foi extinta. */
      const nM = e.membros.length || 1;
      const d1 = v => (Math.round(v*10)/10).toFixed(1);
      const mForca = d1(e.membros.reduce((s,m)=>s+m.forca, 0)/nM);
      const mDef   = d1(e.membros.reduce((s,m)=>s+m.defesa, 0)/nM);
      /* a do cabeçalho é a NACIONAL (régua do dono, 23/08/2026); a do
         continente vai no title, pra quem quiser saber */
      const pos = TO.relacoes.posicaoNoRanking(e);
      const posMundo = TO.relacoes.posicaoNoMundo ? TO.relacoes.posicaoNoMundo(e) : 0;
      const srcFaixa = escudoDe('t', e.torcida.id);
      noFeedTopo.innerHTML =
        (srcFaixa
          ? `<img class="escudo escudo-img" src="${srcFaixa}" alt="${e.torcida.sigla}">`
          : `<span class="escudo" style="background:linear-gradient(135deg,${c1} 0 52%,${c2} 52% 100%)"
           >${e.torcida.sigla}</span>`)+
        /* CADA NÚMERO DO CABEÇALHO DIZ O QUE É no `title` (pedido do
           dono, 07/09/2026): o ícone sozinho é adivinhação, e no
           celular o nome da torcida sai cortado — o nome inteiro vai
           no title também */
        `<b title="${e.torcida.nome}${e.torcida.clube ? ' — torcida do '+e.torcida.clube : ''}${e.torcida.cidade ? ' · '+e.torcida.cidade : ''}">${e.torcida.nome}</b>`+
        `<span class="num pos-rank" title="Ranking: ${pos||'—'}º no Brasil`+
        `${posMundo?` · ${posMundo}º na América do Sul`:''}">`+
        `#${pos||'—'}</span>`+
        `<span class="num${e.dinheiro<0?' negativo':''}" title="Caixa: dinheiro da torcida agora">${IC.get('dinheiro')}`+
        `${U.dinheiro(e.dinheiro)}</span>`+
        `<span class="num semana ${sem>0?'sobra':sem<0?'falta':''}"`+
        ` title="Saldo da semana: receitas menos despesas previstas">${sinal}${U.dinheiro(Math.abs(sem))}`+
        `<em>/sem</em></span>`+
        `<span class="num ind-membros" title="Membros: ${U.numero(c.total)} no total · ${c.aptos} aptos · ${c.feridos} feridos · ${c.presos} presos">${IC.get('membros')}${U.numero(c.total)}</span>`+
        `<span class="num ind-prestigio" title="Prestígio da torcida (0 a 100)">${IC.get('estrela')}`+
        `${Math.round(e.indicadores.prestigio*5)}</span>`+
        `<span class="num ind-moral" title="Moral da torcida (0 a 100)">`+
        `${IC.get('raio')}${Math.round(e.indicadores.moral*5)}</span>`+
        `<span class="num" title="Ataque: força média dos membros">`+
        `${IC.get('halter')}${mForca}</span>`+
        `<span class="num" title="Defesa: defesa média dos membros">`+
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
    /* custo e efeito podem depender da torcida (a festa muda de preço
       com o nível da sede): quem resolve é o próprio módulo de ações */
    const efeito = TO.acoes.efeitoDe(e, a), custo = TO.acoes.custoDe(e, a);
    const sub = !d.ok    ? d.motivo
              : !sobrou  ? 'a semana acabou'
              : d.nota   ? `${efeito} · ${d.nota}`
              :            efeito;
    b.innerHTML =
      `<span class="ic">${IC.get(a.icone)}</span>
       <span class="txt"><span>${a.nome}</span><small>${sub}</small></span>
       ${custo?`<span class="custo">${U.dinheiro(-custo)}</span>`:''}`;
    const usar = opc=>{
      const r = TO.acoes.executar(e, a.id, opc);
      aviso(r.msg || (r.ok?'Feito.':'Não deu.'),
            r.ok && r.tipo!=='ruim' ? 'boa' : 'ruim');
      aoUsar && aoUsar();
      redesenhar();
      /* ação que abre cena não termina aqui: termina quando a tela fecha */
      if(r.ok && r.cena) comEscolhaDeBriga(sim=>{
        simularProxima = sim; abrirAcaoEmCena(r.cena);
      });
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
  let subTorcida = 'membros', filtroCargo = 'todos', filtroEstado = 'todos', busca = '';
  let ordem = {col:'forca', dir:-1}, selecionado = null;
  /* O DOIS-CLIQUES É CONTADO NA MÃO: o primeiro clique repinta a lista
     inteira, então a linha que recebe o segundo clique já é outra e o
     `dblclick` do navegador nunca dispara. Guardamos quem foi clicado
     e quando — dois cliques no mesmo membro dentro da janela abrem o
     perfil (decisão do dono, 21/08/2026). */
  const JANELA_DUPLO = 400;
  let ultimoClique = {id:null, em:0};

  const COLUNAS = [
    {k:'nome',    rot:'Membro',   larg:'26%'},
    {k:'cargo',   rot:'Função',   larg:'20%'},
    {k:'idade',   rot:'Idade',    larg:'7%'},
    {k:'forca',   rot:'Força',    barra:true, max:20},
    {k:'defesa',  rot:'Defesa',   barra:true, max:20},
    {k:'xp',      rot:'XP'},
    {k:'situacao',rot:'Situação'}
  ];

  /* de onde é o membro: a sede, ou a cidade da sub-sede dele */
  const origemDe = m => m.filial
    ? (TO.financeiro.nomeCidade(m.filial) || m.filial) : 'Sede';
  function valorCol(m,k){
    if(k==='nome') return TO.membros.nomeDe(m).toLowerCase();
    if(k==='cargo') return TO.membros.CARGOS[m.cargo].ordem;
    if(k==='situacao') return m.preso?2 : m.ferido?1 : 0;
    /* a sede vem antes de toda sub-sede na ordenação */
    if(k==='origem') return m.filial ? origemDe(m).toLowerCase() : '';
    return m[k];
  }
  function combina(m,t){
    if(!t) return true;
    t = t.toLowerCase();
    const sit = m.preso?'preso' : m.ferido?'ferido' : 'apto';
    return TO.membros.nomeDe(m).toLowerCase().includes(t)
        || TO.membros.CARGOS[m.cargo].nome.toLowerCase().includes(t)
        || origemDe(m).toLowerCase().includes(t)
        || (m.arquetipo||'').includes(t) || sit.includes(t);
  }

  /* =======================================================
     MORAL & PRESTÍGIO — o livro dos indicadores, item a item
     (pedido do dono, 17/08/2026). Os dois falam na régua de
     0 a 100 (indicador ×5) — a moral entrou nela por ordem
     do dono em 24/08/2026.
     ======================================================= */
  function painelIndicadores(){
    const e = E();
    const cx = el('div');
    const c0 = cartao('Agora');
    c0.corpo.innerHTML =
      `<div class="linha-dado"><span>Prestígio</span>
         <b>${Math.round(e.indicadores.prestigio*5)} <span class="fraco">de 100</span></b></div>
       <div class="linha-dado"><span>Moral da torcida</span>
         <b>${Math.round(e.indicadores.moral*5)} <span class="fraco">de 100</span></b></div>
       <div class="linha-dado"><span class="fraco">Ficar 20 dias sem briga `+
      `deprecia: −5 de prestígio e −2,5 de moral, e o relógio segue `+
      `correndo até a próxima briga.</span></div>`;
    cx.appendChild(c0);

    const hist = e.historicoIndicadores || [];
    const c = cartao('Histórico', `${hist.length} movimentos`);
    if(!hist.length)
      c.corpo.innerHTML = '<div class="em-construcao">Nada mexeu ainda.</div>';
    for(const h of hist.slice(0, 80)){
      const prest = h.ind === 'prestigio';
      const v = Math.round(h.delta*5*10)/10;
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

      {id:'treinamentos', rot:'Treinamentos'},
      {id:'recrutamento', rot:'Recrutamento'},
      {id:'velhaguarda',  rot:`Velha Guarda${(e.velhaGuarda||[]).length
                                ? ' · '+e.velhaGuarda.length : ''}`},
      {id:'indicadores',  rot:'Moral & Prestígio'}
    ], subTorcida, id=>{subTorcida=id; redesenhar();}));

    if(subTorcida==='velhaguarda'){ pg.appendChild(painelVelhaGuarda()); return; }
    if(subTorcida==='treinamentos'){ pg.appendChild(painelTreinos()); return; }
    /* a subaba Hierarquia saiu (ordem do dono, 24/08/2026) */
    if(subTorcida==='recrutamento'){ pg.appendChild(painelRecrutamento()); return; }
    if(subTorcida==='indicadores'){ pg.appendChild(painelIndicadores()); return; }

    const c = TO.membros.contar(e);
    /* A TELA DE MEMBROS (layout aprovado pelo dono, 10/09/2026): os
       filtros em linha (cargo com contagem, e o estado), a busca à
       direita, e a promoção na própria linha */
    /* os cartões de resumo saíram (dono, 10/09/2026); ficam os filtros e a tabela */
    const filtros = [
      ['todos','Todos', c.total],
      ['diretoria','Diretoria', c.diretoria],
      ['frente','Linha de Frente', c.frente],
      ['componente','Componentes', c.componente],
      ['novato','Apoiadores', c.novato]
    ];
    const fl = el('div',{class:'filtros-linha mb-filtros'});
    fl.appendChild(el('span',{class:'rot', texto:'Cargo'}));
    for(const [id,rot,n] of filtros){
      const b = el('button',{class:(id===filtroCargo?'on':''), html:`${rot} <span class="conta">${n}</span>`});
      b.onclick = ()=>{ filtroCargo=id; redesenhar(); };
      fl.appendChild(b);
    }
    pg.appendChild(fl);
    const fe = el('div',{class:'filtros-linha mb-filtros'});
    fe.appendChild(el('span',{class:'rot', texto:'Estado'}));
    for(const [id,rot] of [['todos','Todos'],['pe','De pé'],['ferido','Ferido'],['preso','Preso'],['apto','Apto a promoção']]){
      const b = el('button',{class:(id===filtroEstado?'on':'')+(id==='apto'?' minha':''), texto:rot});
      b.onclick = ()=>{ filtroEstado=id; redesenhar(); };
      fe.appendChild(b);
    }
    const bs = el('input',{class:'busca mb-busca', type:'search', placeholder:'buscar por nome, arquétipo…'});
    bs.value = busca;
    bs.oninput = ev=>{ busca = ev.target.value; pintarTorcida(); };
    fe.appendChild(bs);
    pg.appendChild(fe);

    const ct = cartao('Membros', `${c.aptos} de pé · ${c.feridos} feridos · ${c.presos} presos`);
    const passaEstado = m => filtroEstado==='todos' ? true
      : filtroEstado==='pe' ? (!m.ferido && !m.preso)
      : filtroEstado==='ferido' ? !!m.ferido
      : filtroEstado==='preso' ? !!m.preso
      : TO.membros.podePromover(e, m).ok;
    const lista = e.membros
      .filter(m=>filtroCargo==='todos' || m.cargo===filtroCargo)
      .filter(passaEstado)
      .filter(m=>combina(m,busca))
      .sort((a,b)=>{
        const va=valorCol(a,ordem.col), vb=valorCol(b,ordem.col);
        return va<vb ? -ordem.dir : va>vb ? ordem.dir : 0;
      });

    const tab = el('table',{class:'dados'});
    const tr = el('tr');
    /* TORCIDA COM SUB-SEDE GANHA A COLUNA "ORIGEM" (pedido do dono,
       31/08/2026): de onde é cada membro — a sede, ou a cidade da
       filial dele. Sem filial a tabela segue como sempre foi. */
    const temFilial = (((e.patrimonio||{}).filiais)||[]).length > 0;
    const colunas = temFilial
      ? [Object.assign({}, COLUNAS[0], {larg:'22%'}),
         Object.assign({}, COLUNAS[1], {larg:'16%'}),
         {k:'origem', rot:'Origem', larg:'12%'}].concat(COLUNAS.slice(2))
      : COLUNAS;
    for(const col of colunas){
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
    tr.appendChild(el('th',{texto:''}));
    tab.appendChild(el('thead',null,[tr]));

    const tb = el('tbody');
    /* o botão do rodapé nasce depois da lista, mas as linhas mexem
       nele: fica declarado aqui pra elas alcançarem */
    let btPerfil = null;
    for(const m of lista){
      const penaDele = TO.membros.diasPresos(m);
      /* QUEM ESTÁ PRONTO PRA SUBIR APARECE NA LISTA: a promoção mora
         no perfil, e sem um aviso na linha ninguém achava que ela
         existia. Agora a Situação avisa, e o cartão conta quantos. */
      const pronto = TO.membros.podePromover(e, m);
      const sit = m.preso ? (penaDele != null ? `Preso · ${penaDele}d` : 'Preso')
                : m.ferido ? `Ferido · ${m.ferido.dias}d`
                : pronto.ok ? '<b class="pronto-promo">Pronto p/ promoção</b>'
                : m.naFila ? 'Treinando' : 'De pé';
      const linha = el('tr',{class:(m.preso?'preso':m.ferido?'ferido':'')
        + (selecionado===m.id?' selecionada':'')});
      const pontinho = (m.cargo==='diretoria'||m.veterano) ? '<span class="ponto"></span>' : '';
      linha.innerHTML =
        `<td>${pontinho}${TO.membros.nomeDe(m)}</td>
         <td>${TO.membros.CARGOS[m.cargo].nome}</td>
         ${temFilial ? `<td>${m.filial
           ? linkCidade(m.filial, origemDe(m)) : 'Sede'}</td>` : ''}
         <td class="num${m.idade >= TO.membros.IDADE_DECLINIO ? ' velho' : ''}"`+
        ` title="${m.idade >= TO.membros.IDADE_DECLINIO
          ? 'em declínio: perde 0,6 de força e defesa por ano; pendura a bandeira aos '
            + TO.membros.IDADE_SAIDA
          : 'no auge'}">${m.idade != null ? m.idade : '—'}</td>
         <td>${medida(m.forca,20)}</td>
         <td>${medida(m.defesa,20)}</td>
         <td class="num">${m.xp}</td>
         <td>${sit}</td>
         <td class="mb-acao"></td>`;
      if(pronto.ok){
        const bp = el('button',{class:'mini-bt mb-promo', texto:'Promover'});
        bp.title = pronto.custo ? `promove a ${TO.membros.CARGOS[pronto.para].nome} por ${U.dinheiro(pronto.custo)}` : `promove a ${TO.membros.CARGOS[pronto.para].nome}`;
        bp.onclick = ev=>{ ev.stopPropagation(); const r = TO.membros.promover(e, m);
          aviso(r.ok ? `${TO.membros.nomeDe(m)} promovido` : r.motivo, r.ok ? 'boa' : 'ruim'); redesenhar(); };
        linha.querySelector('.mb-acao').appendChild(bp);
      }
      linha.style.cursor='pointer';
      /* DOIS CLIQUES ABREM O PERFIL: é de lá que sai fiança e
         promoção, sem passar por outro botão.
         SELECIONAR NÃO REPINTA A TELA: repintar a lista inteira a cada
         clique jogava o rolo de volta pro topo, e o segundo clique
         caía noutra linha — ou em lugar nenhum. Aqui só a marca da
         seleção troca de lugar. */
      linha.onclick = ()=>{
        const agora = Date.now();
        const duplo = ultimoClique.id === m.id &&
                      agora - ultimoClique.em < JANELA_DUPLO;
        ultimoClique = {id:m.id, em:agora};
        selecionado = m.id;
        for(const outra of tb.children) outra.classList.remove('selecionada');
        linha.classList.add('selecionada');
        if(btPerfil){ btPerfil.disabled = false; btPerfil.onclick = ()=>abrirFicha(m); }
        if(duplo){ ultimoClique = {id:null, em:0}; abrirFicha(m); }
      };
      linha.title = 'dois cliques abrem o perfil';
      linha.style.userSelect = 'none';   // dois cliques não pintam texto
      tb.appendChild(linha);
    }
    tab.appendChild(tb);
    ct.corpo.appendChild(tab);

    const alvo = e.membros.find(m=>m.id===selecionado);
    /* o botão Ações foi embora: as ações moram dentro do perfil */
    btPerfil = el('button',{class:'bt destaque', texto:'Abrir perfil'});
    btPerfil.disabled = !alvo;
    if(alvo) btPerfil.onclick = ()=>abrirFicha(alvo);
    ct.rodape(btPerfil);
    pg.appendChild(ct);
  }

  /* =======================================================
     A VELHA GUARDA (régua do dono, 20/08/2026)
     Quem chegou aos 46 saiu da lista de membros — não briga
     mais, não paga mensalidade, não conta ponto no ranking.
     Fica aqui, com a ficha do dia em que pendurou a bandeira e
     o histórico inteiro do que fez.
     ======================================================= */
  function painelVelhaGuarda(){
    const e = E(), lista = e.velhaGuarda || [];
    const ct = cartao('Velha Guarda',
      lista.length ? `${lista.length} ${lista.length===1?'nome pendurado'
                                                       :'nomes pendurados'}`
                   : 'ninguém pendurou a bandeira ainda');
    if(!lista.length){
      ct.corpo.appendChild(el('div',{class:'recado', html:
        `Membro que chega aos <b>${TO.membros.IDADE_SAIDA} anos</b> deixa a `+
        `lista de membros e vem parar aqui. Da <b>${TO.membros.IDADE_DECLINIO}ª `+
        `primavera</b> em diante ele já perde ${String(TO.membros.DESGASTE_ANO)
          .replace('.', ',')} de força e defesa por ano — é o preço de uma `+
        `torcida que envelhece junto.`}));
      return ct;
    }
    const tab = el('table',{class:'dados'});
    tab.innerHTML = `<thead><tr><th>Nome</th><th>Último cargo</th>
      <th class="num">Idade</th><th class="num">Força</th><th class="num">Defesa</th>
      <th class="num">XP</th><th class="num">Sequelas</th><th>Pendurou</th>
      </tr></thead>`;
    const tb = el('tbody');
    for(const v of lista){
      const linha = el('tr');
      linha.innerHTML =
        `<td>${v.cargo==='diretoria' ? `${v.apelido} ${v.sobrenome}` : v.apelido}
           ${v.veterano ? '<span class="ponto"></span>' : ''}</td>
         <td>${TO.membros.CARGOS[v.cargo].nome}</td>
         <td class="num">${v.idade}</td>
         <td class="num">${v.forca}</td>
         <td class="num">${v.defesa}</td>
         <td class="num">${v.xp}</td>
         <td class="num">${v.sequelas || 0}</td>
         <td class="fraco">${v.ano}</td>`;
      linha.style.cursor = 'pointer';
      linha.onclick = ()=>{
        const corpo = el('div');
        corpo.innerHTML =
          `<div class="linha-dado"><span>Pendurou a bandeira</span>`+
          `<b>${v.idade} anos, em ${v.ano}</b></div>`+
          `<div class="linha-dado"><span>Ficha do último dia</span>`+
          `<b>${v.forca}/${v.defesa} · ${v.xp} XP</b></div>`+
          (v.sequelas ? `<div class="linha-dado"><span>Sequelas de briga</span>`+
                        `<b>${v.sequelas}</b></div>` : '');
        for(const h of (v.historico||[]).slice(-14))
          corpo.appendChild(el('div',{class:'transacao', html:`<span class="desc">${h}</span>`}));
        modal(v.apelido, TO.membros.CARGOS[v.cargo].nome + ' · Velha Guarda', corpo);
      };
      tb.appendChild(linha);
    }
    tab.appendChild(tb);
    const rolo = el('div',{class:'rolo', estilo:{maxHeight:'62vh'}});
    rolo.appendChild(tab);
    ct.corpo.appendChild(rolo);
    return ct;
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
         <b>${(()=>{ const g = TO.financeiro.ganhoDoTreino(e),
                        n = TO.financeiro.professoresDe(e);
             return n ? `0.00 a ${(0.3*g).toFixed(2)} · `+
                        `${n===1?'professor':n+' professores'} de MMA `+
                        `(+${Math.round((g-1)*100)}%)`
                      : '0.00 a 0.30'; })()}</b></div>
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
    const torcedores = cid
      ? TO.mundo.torcedoresDoClubeNa(cid.id, e.torcida.clubeId) : 0;
    const org = TO.acoes.organizadasDaPraca(e);
    const organizados = org.reduce((s,o)=>s+o.membros, 0);

    const grade = el('div',{class:'colunas'});

    /* SEM O "MIL" (correção do dono, 26/08/2026): o número da planilha
       é o número de verdade — 60 torcedores na praça são 60 */
    const c1 = cartao(`Torcedores do ${clube?clube.nome:'clube'} em ${cid?cid.nome:'—'}`,
                      `${U.numero(torcedores)} na praça`);
    /* PESSOAS, NÃO MILHARES (correção do dono, 24/08/2026): "695 mil
       fora de organizada" era fantasia — o que existe é o punhado que
       dá pra recrutar de verdade. */
    c1.corpo.innerHTML =
      `<div class="valorao"><span>Possíveis de recrutar</span>
         <b class="${p.base>0?'positivo':'negativo'}">${U.numero(Math.round(p.base))}`+
      `<span class="fraco"> pessoas</span></b></div>
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
    for(const id of ['recrutar']){
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
  /* `semFechar`: o botão Fechar automático some. Serve pra tela que se
     resolve num botão só — na Ideologia, salvar já é fechar (régua do
     dono, 22/08/2026), e dois botões no rodapé viravam a dúvida de
     sempre: "salvei ou só fechei?" */
  function modal(titulo, sub, corpo, acoes, largura, semFechar){
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
    if(!semFechar){
      const fechar = el('button',{class:'bt destaque', texto:'Fechar'});
      fechar.onclick = ()=>fundo.remove();
      f.appendChild(fechar);
    }
    /* sem o Fechar, quem herda o destaque é a última ação: o rodapé não
       pode ficar sem um botão de peso */
    else if(f.lastChild) f.lastChild.classList.add('destaque');
    if(f.children.length) m.appendChild(f);
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
        /* assalto feito responde a mensagem que abriu a lista */
        confirmarDecisao('Ver os alvos — assalto feito');
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
          id:a.id, rot:linkTorcida(a.id, a.nome),
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

      /* --- AJUDA DE ALIADO NA PRAÇA DELES (pedido do dono, 08/09/2026) ---
         a resposta vem na hora, com o tipo de ajuda; um pedido por jogo */
      const aliadas = P.aliadasNaPracaDeles(e);
      const ajuda = P.ajudaDe(e);
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Ajuda de aliado na praça deles'}));
      const NIVEL_ROT = {nada:'não vai receber a gente', hospedar:'só hospedagem',
                         escolta:'hospedagem e escolta', churrasco:'escolta e churrasco'};
      if(ajuda){
        const rec = P.recepcaoDe(ajuda.nivel);
        corpo.appendChild(el('div',{class:'linha-dado', html:
          `<span>${linkTorcida(ajuda.aliado, ajuda.nome)} respondeu: `+
          `<b>${NIVEL_ROT[ajuda.nivel] || ajuda.nivel}</b></span>`+
          `<b class="${ajuda.nivel==='nada'?'negativo':'positivo'}">`+
          `${rec.relacao>0?'+':''}${rec.relacao} rel.`+
          `${ajuda.moral ? ` · +${ajuda.moral} moral` : ''}`+
          `${ajuda.escolta ? ` · ${ajuda.escolta} na escolta` : ''}</b>`}));
      } else if(!aliadas.length){
        corpo.appendChild(el('div',{class:'linha-dado', html:
          `<span class="fraco">Nenhuma aliada em ${j.cidadeAdv || 'lá'} — `+
          `só aliada de verdade (relação 20+) ou irmã de clube recebe</span>`}));
      } else {
        const bloco = el('div',{class:'bloco-recepcao'});
        for(const a of aliadas){
          const linha = el('div',{class:'rec-aliado'});
          linha.appendChild(el('div',{class:'rec-nome', html:
            `<b>${linkTorcida(a.id, a.nome)}</b> <span class="fraco">· relação `+
            `${Math.round(a.relacao)}${a.irma ? ' · irmã de clube' : ''}</span>`}));
          const bts = el('div',{class:'rec-botoes'});
          const b = el('button',{class:'rec-bt on', html:
            `Pedir ajuda<small>a resposta vem na hora · pesa na relação</small>`});
          b.onclick = ()=>{
            const r = P.pedirAjuda(e, a.id);
            if(!r) return;
            aviso(r.nivel === 'nada'
              ? `A ${r.nome} não vai receber a gente.`
              : `A ${r.nome} topou: ${NIVEL_ROT[r.nivel]}.`,
              r.nivel === 'nada' ? 'ruim' : 'boa');
            TO.estado.salvar(); pintarTopo(); pintar();
          };
          bts.appendChild(b);
          linha.appendChild(bts);
          bloco.appendChild(linha);
        }
        corpo.appendChild(bloco);
      }

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
        id:a.id, rot:linkTorcida(a.id, a.nome) + (a.aliada ? ' · aliada' : ''),
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
                                     TO.patrimonio.precoBomba(e));
      const teto = tem + podeComprar;
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Quantas bombas'}));
      const lb = el('div',{class:'contador'});
      const bB = el('button',{texto:'−'}), bM = el('button',{texto:'+'});
      bB.disabled = bombas <= 0;
      bM.disabled = bombas >= teto;
      bB.onclick = ()=>{ bombas = Math.max(0, bombas-1); pintar(); };
      bM.onclick = ()=>{ bombas = Math.min(teto, bombas+1); pintar(); };
      const custoExtra = Math.max(0, bombas - tem) * TO.patrimonio.precoBomba(e);
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
    /* SALVAR JÁ FECHA (régua do dono, 22/08/2026): a tela tinha Salvar
       no corpo e Fechar no rodapé, e o Fechar não guardava nada. Agora
       é um botão só, no rodapé, e ele faz as duas coisas. */
    const cx = caixaDeIdeologia(E(), false);
    return modal('Ideologia', 'vale toda semana', cx,
                 [['Salvar', ()=>{ cx.salvar(); aviso('Ideologia salva.', 'boa'); }]],
                 'media', true);
  }

  /* =======================================================
     O PERFIL DO MEMBRO (decisão do dono, 21/08/2026)
     Duas portas viraram uma. A ficha era só leitura e as ações
     moravam noutro botão que ninguém achava — agora o perfil é
     o lugar: abre com dois cliques no nome, mostra o dossiê e
     resolve ali mesmo o que está pendente (fiança, promoção).
     O corpo se repinta sozinho depois de cada ação, pra ficha
     mostrar na hora o cargo novo ou o cara solto.
     ======================================================= */
  function abrirFicha(m){
    const corpo = el('div');
    let fechar = null;

    /* um botão de pendência: o que é, quanto custa, e por que não dá */
    const pendencia = (rot, nota, custo, trava, aoClicar)=>{
      const b = el('button',{class:'oferta'+(trava?' travada':'')});
      b.innerHTML =
        `<span class="txt"><b>${rot}</b>${nota?`<small>${nota}</small>`:''}</span>
         <span class="preco">${custo ? U.dinheiro(custo) : ''}</span>`;
      if(trava) b.appendChild(el('small',{class:'trava', texto:trava}));
      b.disabled = !!trava;
      b.onclick = aoClicar;
      return b;
    };

    const pintar = ()=>{
      const e = E();
      corpo.innerHTML = '';
      const C = TO.membros.CARGOS[m.cargo];

      /* O QUE ESTÁ PENDENTE VEM PRIMEIRO: quem abre o perfil de um
         preso quer soltar o cara, não ler a mensalidade dele */
      const pend = [];
      if(m.preso){
        const dias = TO.membros.diasPresos(m);
        pend.push(pendencia('Pagar fiança',
          dias != null ? `preso há ${dias} ${dias===1?'dia':'dias'} — `+
                         `a fiança sobe a cada dia` : 'tira ele hoje da cadeia',
          TO.membros.fianca(m),
          e.dinheiro < TO.membros.fianca(m) ? 'sem caixa' : '',
          ()=>{
            const r = TO.membros.resgatar(e, m);
            aviso(r.ok ? `${TO.membros.nomeDe(m)} está solto` : r.motivo,
                  r.ok ? 'boa' : 'ruim');
            pintar(); redesenhar();
          }));
      }
      const p = TO.membros.podePromover(e, m);
      if(p.ok)
        pend.push(pendencia(`Promover pra ${TO.membros.CARGOS[p.para].nome}`,
          'bateu XP, força e defesa do cargo', p.custo || 0, '',
          ()=>{
            const r = TO.membros.promover(e, m);
            aviso(r.ok ? `${TO.membros.nomeDe(m)} promovido` : r.motivo,
                  r.ok ? 'boa' : 'ruim');
            pintar(); redesenhar();
          }));
      else if(p.veterano && !m.veterano)
        /* GDD §5.2: sem vaga na Diretoria o caminho é Veterano */
        pend.push(pendencia('Dar galões de Veterano',
          'Diretoria lotada — ganha +2 de força e +2 de defesa', null, '',
          ()=>{
            const r = TO.membros.promover(e, m);
            aviso(r.ok ? `${TO.membros.nomeDe(m)} virou Veterano` : r.motivo,
                  r.ok ? 'boa' : 'ruim');
            pintar(); redesenhar();
          }));
      else if(TO.membros.ACIMA && TO.membros.ACIMA[m.cargo])
        pend.push(pendencia('Promover', 'ainda não bate o corte do cargo',
                            null, p.motivo, ()=>{}));

      if(pend.length){
        corpo.appendChild(el('div',{class:'fase-rot', texto:'Pendências'}));
        pend.forEach(b=>corpo.appendChild(b));
      }

      /* O DOSSIÊ EM COLUNA ÚNICA (layout aprovado pelo dono, 10/09/2026):
         cabeçalho com as iniciais nas cores da torcida, etiquetas,
         barras grandes, os números da carreira e a linha do tempo */
      const teto = TO.membros.tetoDe(m);
      const sit = m.preso ? 'Preso' : m.ferido ? `Ferido · ${m.ferido.dias} dias`
                : m.naFila ? 'Escalado pro treino de hoje' : 'De pé';
      const velho = m.idade != null && m.idade >= TO.membros.IDADE_DECLINIO;
      const cores = TO.mundo.coresDaTorcida(e.torcida);
      const nomeC = TO.membros.nomeCompletoDe(m) || TO.membros.nomeDe(m);
      const iniciais = TO.membros.nomeDe(m).split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
      const tags = [C.nome + (m.veterano ? ' · Veterano' : ''), `${m.idade != null ? m.idade + ' anos' : ''}${velho ? ' · em declínio' : ''}`,
                    sit, m.filial ? `Subsede ${TO.financeiro.nomeCidade(m.filial)}` : 'Sede', m.arquetipo || ''].filter(Boolean);
      const cab = el('div',{class:'pm-cab'});
      const av = el('div',{class:'pm-av', texto:iniciais}); av.style.background = cores.cor || '#444'; av.style.color = cores.cor2 || '#fff';
      cab.appendChild(av);
      cab.appendChild(el('div',{class:'pm-id', html:`<h2>${nomeC}</h2><div class="pm-tags">${tags.map(t=>`<span class="tag${t===sit?(m.preso?' pm':m.ferido?' ruim':' ok'):''}">${t}</span>`).join('')}</div>`}));
      corpo.insertBefore(cab, corpo.firstChild);
      /* as barras: força e defesa contra o teto, XP contra o corte do cargo */
      const barra = (rot, v, max, cor, txt)=> `<div class="pm-f"><span>${rot}</span><div class="barra-g"><i style="width:${Math.round(100*U.limitar(v/max,0,1))}%;background:${cor}"></i></div><b>${txt}</b></div>`;
      corpo.appendChild(el('div',{class:'pm-forca', html:
        barra('Força', m.forca, teto, 'var(--verde)', `${m.forca}<small>/${teto}</small>`)+
        barra('Defesa', m.defesa, teto, 'var(--ouro)', `${m.defesa}<small>/${teto}</small>`)+
        (C.xpPromo ? barra('XP pro próximo cargo', m.xp, C.xpPromo, 'var(--azul)', `${m.xp}<small>/${C.xpPromo}</small>`)
                   : barra('XP', m.xp, Math.max(1, m.xp), 'var(--azul)', String(m.xp)))+
        (m.desgaste ? `<small class="pm-nota negativo">desgaste: −${m.desgaste.toFixed(1)} no teto</small>` : '')}));
      /* os números da carreira, lidos do histórico */
      const h = m.historico || [];
      const conta = re => h.filter(x=>re.test(x)).length;
      const nums = [[conta(/ferid|sequela/i), 'feridas'], [conta(/^preso|cadeia|— \d+ dias/i), 'prisões'],
                    [conta(/promovid|veterano/i), 'promoções'], [conta(/faixa|bandeira/i), 'faixas'],
                    [U.dinheiro(C.mensalidade).replace('R$ ',''), 'mensalidade']];
      corpo.appendChild(el('div',{class:'pm-nums', html:nums.map(([v,r])=>`<div><b>${v}</b><span>${r}</span></div>`).join('')}));
      /* a linha do tempo: do mais recente pro mais antigo, com a cor do tipo */
      const corDe = x => /ferid|sequela/i.test(x) ? 'vermelho' : /preso|cadeia|solto|fiança|advogado/i.test(x) ? 'pm'
                       : /promovid|veterano|entrou/i.test(x) ? 'verde' : /faixa|bandeira/i.test(x) ? 'ouro' : 'fraco';
      const linha = el('div',{class:'pm-linha'});
      if(!h.length) linha.appendChild(el('div',{class:'fraco', texto:'Sem registro ainda: a história começa na primeira briga.'}));
      for(const x of h.slice().reverse().slice(0, 40))
        linha.appendChild(el('div',{class:'pm-ev '+corDe(x), html:`<i></i><p>${x}</p>`}));
      corpo.appendChild(el('div',{class:'fase-rot', texto:'Linha do tempo', estilo:{paddingTop:'12px'}}));
      corpo.appendChild(linha);
    };

    pintar();
    fechar = modal('Perfil do membro', TO.membros.CARGOS[m.cargo].nome, corpo, null, 'media');
    return fechar;
  }

  /* =======================================================
     O PERFIL DA TORCIDA (crivo do dono, 31/08/2026)
     Overlay por cima de onde você estiver. Toda torcida tem o
     seu: visão geral, patrimônio, MEMBROS (a mesma tabela de
     Torcida > Membros — o elenco fixo é universal), brigas e
     finanças com o extrato de verdade. O nome da torcida nas
     tabelas e quadros do jogo abre isto (só tabelas e quadros,
     por ordem do dono — texto corrido fica de fora).
     ======================================================= */
  const linkTorcida = (id, nome) =>
    id ? `<span class="t-link" data-torcida="${id}">${nome}</span>` : nome;

  /* O ESCUDO NO LUGAR DO QUADRADINHO (pedido do dono, 01/09/2026):
     onde houver escudo em img/escudos/ ele entra no lugar do chip de
     cor; sem arquivo, o quadradinho de cor continua — os discos das
     cenas ficam como estão, por ordem do dono. clube-<id>.png vem da
     coleção importada; torcida-<id>.png espera o pack do dono. */
  /* no jogo de arquivo único as imagens dinâmicas moram num dicionário
     embutido pelo empacotador; servido normal, o caminho vale como é */
  const IMG = caminho =>
    (window.__EMBUTIDOS && window.__EMBUTIDOS[caminho]) || caminho;
  const escudoDe = (tipo, id) => {
    const m = (TO.dados.escudos||{})[tipo === 'c' ? 'clubes' : 'torcidas'];
    return m && id && m[id]
      ? IMG(`img/escudos/${tipo === 'c' ? 'clube' : 'torcida'}-${id}.png`)
      : null;
  };
  const chipClube = (id, cor) => {
    const src = escudoDe('c', id);
    return src ? `<img class="to-escudo" src="${src}" alt="">`
               : `<i class="to-chip" style="background:${cor}"></i>`;
  };
  const chipTorcida = (id, cor) => {
    const src = escudoDe('t', id);
    return src ? `<img class="to-escudo" src="${src}" alt="">`
               : `<i class="to-chip" style="background:${cor}"></i>`;
  };

  /* o link da CIDADE (pedido do dono, 31/08/2026): mesmo cano do link
     de torcida, abrindo o perfil da praça */
  const linkCidade = (id, nome) =>
    id ? `<span class="c-link" data-cidade="${id}">${nome}</span>` : nome;
  const cidadePorNome = nome =>
    (TO.dados.cidades||[]).find(c=>c.nome === nome) || null;
  const linkCidadePorNome = nome => {
    const c = nome && cidadePorNome(nome);
    return c ? linkCidade(c.id, nome) : (nome || '');
  };

  /* A ONDA 2 (ordem do dono, 31/08/2026): o nome de torcida — e agora
     o de cidade — no TEXTO CORRIDO das mensagens também vira link. O
     texto puro é escapado e os nomes conhecidos são casados do maior
     pro menor — "Fúria Jovem do Botafogo" ganha de "Fúria". Cidade
     homônima de CLUBE fica fora do texto corrido (num "ABC × Fortaleza"
     o Fortaleza é o clube, não a praça); torcida homônima de cidade
     ganha da cidade. */
  let _rxNomes = null, _alvoPorNome = null;
  function regexDeNomes(){
    if(_rxNomes) return _rxNomes;
    _alvoPorNome = {};
    const clubes = new Set((TO.dados.times||[]).map(t=>t.nome));
    for(const c of (TO.dados.cidades||[]))
      if(c.nome && !clubes.has(c.nome))
        _alvoPorNome[c.nome] = {tipo:'c', id:c.id};
    for(const o of TO.mundo.jogaveis())
      if(!o.incompleta && o.nome)
        _alvoPorNome[o.nome] = {tipo:'t', id:o.id};
    const esc = s=>s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nomes = Object.keys(_alvoPorNome)
      .sort((a,b)=>b.length - a.length);
    _rxNomes = new RegExp('('+nomes.map(esc).join('|')+')', 'g');
    return _rxNomes;
  }
  const escHTML = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function linkificarNomes(txt){
    if(!txt) return '';
    const rx = regexDeNomes();
    return escHTML(txt).replace(rx, n=>{
      const a = _alvoPorNome[n];
      return a.tipo === 'c' ? linkCidade(a.id, n) : linkTorcida(a.id, n);
    });
  }

  let abaPerfilT = 'visao';
  function abrirPerfilTorcida(id){
    const e = E();
    if(!e || !id || id === true) return;
    const nossa = id === e.torcida.id;
    const o = TO.mundo.torcida(id);
    const t = nossa ? null : TO.relacoes.mundo(e)[id];
    if(!o || (!nossa && !t)) return;
    abaPerfilT = 'visao';
    const clube = TO.mundo.time(o.clubeId) || {};
    const cidade = (TO.mundo.cidade(o.mapa)||{}).nome || o.mapa || '';
    const cores = TO.mundo.coresDaTorcida(o);
    const corpo = el('div',{class:'perfil-torcida'});

    const linhaD = (rot, val)=>`<div class="linha-dado"><span>${rot}</span>`+
                               `<b>${val}</b></div>`;
    const nomeCid = c => (TO.financeiro.nomeCidade &&
                          TO.financeiro.nomeCidade(c)) || c;

    const abaVisao = ()=>{
      const cx = el('div');
      const membros = nossa ? e.membros.length : t.membros;
      const dePe = nossa ? TO.membros.aptosParaOEstadio(e).length
                         : TO.relacoes.disponiveisIA(e, id);
      const moral = nossa ? e.indicadores.moral : t.moral;
      const prest = nossa ? e.indicadores.prestigio : t.prestigio;
      const p = TO.relacoes.placarDoAno(e, id) || {v:0, d:0};
      const irmas = (o.irmas||[]).map(x=>{
        const ir = TO.mundo.torcida(x);
        return ir ? linkTorcida(ir.id, ir.nome) : null;
      }).filter(Boolean);
      const fund = o.fundacaoDia
        ? `${o.fundacaoDia}/${String(o.fundacaoMes).padStart(2,'0')}` : '—';
      cx.innerHTML =
        linhaD('Clube', clube.nome
          ? `${chipClube(o.clubeId, (clube.cores||[])[0] || '#888')}${clube.nome}`
          : '—') +
        linhaD('Praça', linkCidade(o.mapa, cidade)) +
        linhaD('Fundação', fund) +
        linhaD('Membros', `${Math.round(membros)} `+
          `<small class="fraco">· ${dePe} de pé</small>`) +
        linhaD('Moral', `${Math.round(moral*5)} <small class="fraco">de 100</small>`) +
        linhaD('Prestígio', `${Math.round(prest*5)} <small class="fraco">de 100</small>`) +
        (nossa ? '' : linhaD('Relação com a gente',
          Math.round(TO.relacoes.nivel(e, id)))) +
        linhaD('Brigas no ano', `${p.v}V · ${p.d}D `+
          `<small class="fraco">saldo ${p.v - p.d >= 0 ? '+' : ''}${p.v - p.d}</small>`) +
        (irmas.length ? linhaD('Torcida irmã', irmas.join(', ')) : '') +
        (TO.eixos && TO.eixos.de(e, id).length
          ? linhaD('Eixos de aliança', TO.eixos.de(e, id).map(x=>linkEixo(x.id, x.nome)).join(', ')) : '') +
        linhasDePano();
      return cx;
    };
    /* AS FAIXAS E BANDEIRAS NO PERFIL (dono, 09/09/2026): quantas a
       torcida tem na sede e quais ela tomou dos outros */
    const linhasDePano = ()=>{
      const PAT = TO.patrimonio;
      if(!PAT || !PAT.faixasDe) return '';
      let fx, bd;
      if(nossa){ const f = PAT.faixasDe(e); fx = {n:f.nossas.length, tomadas:f.tomadas}; bd = {n:f.bandeiras.nossas.length, tomadas:f.bandeiras.tomadas}; }
      else { const t2 = PAT.faixasIA(e, id) || {}; fx = {n:t2.faixas||0, tomadas:t2.faixasTomadas||[]}; bd = {n:t2.bandeiras||0, tomadas:t2.bandeirasTomadas||[]}; }
      const lista = l => l.length ? ` <small class="fraco">(${l.map(x=>linkTorcida(x.de, x.nome)).join(', ')})</small>` : '';
      return linhaD('Faixas', `${fx.n} na sede · ${fx.tomadas.length} ${fx.tomadas.length===1?'tomada':'tomadas'}${lista(fx.tomadas)}`) +
             linhaD('Bandeiras', `${bd.n} na sede · ${bd.tomadas.length} ${bd.tomadas.length===1?'tomada':'tomadas'}${lista(bd.tomadas)}`);
    };

    const abaPatrimonio = ()=>{
      const cx = el('div');
      const conta = lista => {
        const por = {};
        for(const x of (lista||[])) por[x.nivel||1] = (por[x.nivel||1]||0)+1;
        const tot = (lista||[]).length;
        return tot ? `${tot} <small class="fraco">(${Object.keys(por)
          .sort().map(nv=>`${por[nv]}× nível ${nv}`).join(', ')})</small>` : '—';
      };
      if(nossa){
        const pat = TO.financeiro.patrimonio(e);
        cx.innerHTML =
          linhaD('Sede', `nível ${e.torcida.sedeNivel}`) +
          linhaD('Bares', conta(pat.bares)) +
          linhaD('Lojas', conta(pat.lojas)) +
          linhaD('Subsedes na cidade', conta(pat.subsedes)) +
          ((pat.filiais||[]).map(f=>linhaD(
            `Subsede — ${linkCidade(f.cidade, nomeCid(f.cidade))}`,
            `nível ${f.nivel} · núcleo ${TO.membros.daFilial
              ? TO.membros.daFilial(e, f.cidade).length
              : e.membros.filter(m=>m.filial === f.cidade).length}`)).join('')) +
          linhaD('Ônibus', TO.financeiro.onibusDe(e) || '—') +
          linhaD('Professores de MMA', TO.financeiro.professoresDe(e) || '—') +
          linhaD('Advogados', TO.financeiro.advogadosDe(e) || '—') +
          linhaD('Bombas', TO.patrimonio.bombas(e)) +
          linhaD('Fábrica de material', pat.fabrica ? 'sim' : '—');
      } else {
        cx.innerHTML =
          linhaD('Sede', `nível ${t.sede}`) +
          linhaD('Bares', conta(t.bares)) +
          linhaD('Lojas', conta(t.lojas)) +
          linhaD('Subsedes na cidade', t.subsedes || '—') +
          ((t.filiais||[]).map(f=>linhaD(
            `Subsede — ${linkCidade(f.cidade, nomeCid(f.cidade))}`,
            `nível ${f.nivel} · núcleo ${f.membros||0}`)).join('')) +
          linhaD('Ônibus', t.onibus || '—') +
          linhaD('Professores de MMA', TO.relacoes.mmaDe(t) || '—') +
          linhaD('Advogados', t.advogados || '—') +
          linhaD('Bombas', t.bombas != null ? t.bombas : '—') +
          linhaD('Fábrica de material', t.fabrica ? 'sim' : '—');
      }
      return cx;
    };

    const abaMembros = ()=>{
      const cx = el('div');
      const rows = nossa
        ? e.membros.map(m=>({
            nome: TO.membros.nomeDe(m),
            cargo: TO.membros.CARGOS[m.cargo].nome,
            origem: m.filial ? linkCidade(m.filial, nomeCid(m.filial)) : 'Sede',
            idade: m.idade, forca: m.forca, defesa: m.defesa, xp: m.xp,
            sit: m.preso ? `Preso · ${TO.membros.diasPresos(m)}d`
               : m.ferido ? `Ferido · ${m.ferido.dias}d` : 'Apto'}))
        : TO.relacoes.elencoDaTorcida(e, id).map(m=>({
            nome: m.nome,
            cargo: (TO.membros.CARGOS[m.cargo]||{nome:m.cargo}).nome,
            origem: m.origem ? linkCidade(m.origem, nomeCid(m.origem)) : 'Sede',
            idade: m.idade, forca: m.forca, defesa: m.defesa, xp: m.xp,
            sit: m.preso ? `Preso · ${m.preso}d`
               : m.ferido ? `Ferido · ${m.ferido}d` : 'Apto'}));
      const temFilial = rows.some(r=>r.origem !== 'Sede');
      const tab = el('table',{class:'dados'});
      tab.appendChild(el('thead', null, [el('tr',{html:
        `<th>Membro</th><th>Função</th>${temFilial?'<th>Origem</th>':''}`+
        `<th>Idade</th><th>Força</th><th>Defesa</th><th>XP</th>`+
        `<th>Situação</th>`})]));
      const tb = el('tbody');
      for(const r of rows)
        tb.appendChild(el('tr',{class: /Preso/.test(r.sit) ? 'preso'
          : /Ferido/.test(r.sit) ? 'ferido' : '', html:
          `<td>${r.nome}</td><td>${r.cargo}</td>`+
          `${temFilial?`<td>${r.origem}</td>`:''}`+
          `<td class="num">${r.idade != null ? r.idade : '—'}</td>`+
          `<td>${medida(r.forca, 20)}</td><td>${medida(r.defesa, 20)}</td>`+
          `<td class="num">${r.xp}</td><td>${r.sit}</td>`}));
      tab.appendChild(tb);
      cx.appendChild(el('div',{class:'recado',
        html:`<b>${rows.length}</b> membros`}));
      cx.appendChild(tab);
      return cx;
    };

    const abaBrigas = ()=>{
      const cx = el('div');
      const p = TO.relacoes.placarDoAno(e, id) || {v:0, d:0};
      cx.appendChild(el('div',{class:'recado', html:
        `Placar do ano: <b>${p.v}</b> vitórias · <b>${p.d}</b> derrotas`}));
      const minhas = (e.brigasIA||[])
        .filter(x=>(x.a && x.a.id === id) || (x.b && x.b.id === id))
        .slice(0, 12);
      if(!minhas.length)
        cx.appendChild(el('div',{class:'em-construcao',
          texto: nossa ? 'As nossas brigas moram no feed e no jornal.'
                       : 'Nenhuma briga registrada por aí.'}));
      for(const x of minhas)
        cx.appendChild(el('div',{class:'transacao', html:
          `<span class="dia">s${x.semana}</span>
           <span class="desc">${linkTorcida(x.a.id, x.a.nome)} ${x.a.n} × `+
          `${x.b.n} ${linkTorcida(x.b.id, x.b.nome)}`+
          `${x.cidade ? ` <small class="fraco">· `+
            `${linkCidadePorNome(x.cidade)}</small>` : ''}</span>
           <span class="val ${x.vencedor === o.nome ? 'positivo' : 'negativo'}">`+
          `${x.vencedor === o.nome ? 'venceu' : 'perdeu'}`+
          `${x.pano ? ` <small>· ${x.pano.para === o.nome ? 'tomou' : 'perdeu'} a ${x.pano.tipo}</small>` : ''}</span>`}));
      return cx;
    };

    const abaFinancas = ()=>{
      const cx = el('div');
      if(nossa){
        cx.innerHTML = linhaD('Caixa', U.dinheiro(e.dinheiro));
        for(const tr of (e.transacoes||[]).slice(0, 15))
          cx.appendChild(el('div',{class:'transacao', html:
            `<span class="dia">${tr.dia}</span>
             <span class="desc">${tr.descricao}</span>
             <span class="val ${tr.valor<0?'negativo':'positivo'}">`+
            `${U.dinheiro(tr.valor)}</span>`}));
      } else {
        /* o balanço delas linha a linha (ordem do dono, 02/09/2026):
           a mesma complexidade do nosso Financeiro */
        const b = TO.relacoes.balanco(t, e, id);
        cx.innerHTML =
          linhaD('Caixa', U.dinheiro(Math.round(t.caixa))) +
          linhaD('Balanço do mês', `${U.dinheiro(Math.round(b.rec))} `+
            `<small class="fraco">−${U.dinheiro(Math.round(b.des))
              .replace('R$','R$ ')} = </small>`+
            `${U.dinheiro(Math.round(b.saldo))}`);
        for(const linha of (b.receitas||[]))
          cx.appendChild(el('div',{class:'transacao', html:
            `<span class="dia"></span><span class="desc">${linha.rot}</span>
             <span class="val positivo">${U.dinheiro(linha.v)}</span>`}));
        for(const linha of (b.despesas||[]))
          cx.appendChild(el('div',{class:'transacao', html:
            `<span class="dia"></span><span class="desc">${linha.rot}</span>
             <span class="val negativo">${U.dinheiro(-linha.v)}</span>`}));
        if(!(t.extrato||[]).length)
          cx.appendChild(el('div',{class:'em-construcao',
            texto:'O extrato começa a contar daqui pra frente.'}));
        for(const tr of (t.extrato||[]))
          cx.appendChild(el('div',{class:'transacao', html:
            `<span class="dia">${tr.q}</span>
             <span class="desc">${tr.d}</span>
             <span class="val ${tr.v<0?'negativo':'positivo'}">`+
            `${U.dinheiro(tr.v)}</span>`}));
      }
      return cx;
    };

    const pintar = ()=>{
      corpo.innerHTML = '';
      const faixa = el('div',{class:'perfil-t-faixa'});
      faixa.style.background = cores.cor || '#666';
      if(cores.cor2) faixa.style.borderBottom = `4px solid ${cores.cor2}`;
      corpo.appendChild(faixa);
      const abas = el('div',{class:'filtros'});
      for(const [aid, rot] of [['visao','Visão geral'],
          ['patrimonio','Patrimônio'], ['membros','Membros'],
          ['brigas','Brigas'], ['financas','Finanças']]){
        const b = el('button',{class: aid === abaPerfilT ? 'on' : '',
                               texto: rot});
        b.onclick = ()=>{ abaPerfilT = aid; pintar(); };
        abas.appendChild(b);
      }
      corpo.appendChild(abas);
      corpo.appendChild(
        abaPerfilT === 'patrimonio' ? abaPatrimonio()
        : abaPerfilT === 'membros' ? abaMembros()
        : abaPerfilT === 'brigas' ? abaBrigas()
        : abaPerfilT === 'financas' ? abaFinancas()
        : abaVisao());
    };
    pintar();
    modal(o.nome, `${TO.mundo.siglaTorcida(o) || ''}${clube.nome
      ? ` · ${clube.nome}` : ''} · ${cidade}`, corpo);
  }

  /* =======================================================
     O PERFIL DA CIDADE (pedido do dono, 31/08/2026)
     Mesmo estilo do perfil da torcida: overlay com o retrato
     da praça — times, estádios, estradas — e a aba de torcidas
     e estruturas, com tudo que cada uma tem ali (sede, bares,
     lojas, subsedes) e as subsedes de fora com os núcleos.
     ======================================================= */
  let abaPerfilC = 'visao';
  function abrirPerfilCidade(id){
    const e = E();
    const c = (TO.dados.cidades||[]).find(x=>x.id === id);
    if(!e || !c) return;
    abaPerfilC = 'visao';
    TO.relacoes.mundo(e);
    const corpo = el('div',{class:'perfil-torcida'});
    const linhaD = (rot, val)=>`<div class="linha-dado"><span>${rot}</span>`+
                               `<b>${val}</b></div>`;

    const abaVisaoC = ()=>{
      const cx = el('div');
      /* sem estádio aqui (ordem do dono, 01/09/2026): o perfil da
         cidade fala da PRAÇA — clube e torcedor; estádio fica pras
         telas de jogo */
      const times = (c.times||[]).map(x=>{
        const tm = TO.mundo.time(x.clubeId) || {};
        return {id:x.clubeId, nome:tm.nome || x.clubeId,
                torcedores:TO.mundo.torcedoresDoClubeNa(c.id, x.clubeId),
                cor:(tm.cores||[])[0] || '#888'};
      }).sort((a,b)=>b.torcedores - a.torcedores);
      /* Onde/Tamanho/Metrô/Policiamento saíram (ordem do dono,
         01/09/2026): fica só a quantidade — a população. E cada time
         mostra a fatia dele na cidade ao lado dos torcedores. */
      let html = linhaD('População', U.numero(c.populacao || 0));
      const somaT = times.reduce((s,x)=>s+(x.torcedores||0), 0) || 1;
      for(const tm of times)
        html += linhaD(`${chipClube(tm.id, tm.cor)}${tm.nome}`,
          `${U.numero(tm.torcedores)} torcedores <small class="fraco">· `+
          `${Math.round(tm.torcedores/somaT*100)}% da cidade</small>`);
      if((c.rodovias||[]).length)
        html += linhaD('Rodovias', c.rodovias.join(', '));
      /* as vizinhas pela estrada, cada uma com o próprio link */
      try{
        const g = TO.planejamento.grafo();
        const viz = [...((g.get(c.id)||new Map()).keys())]
          .map(v=>linkCidadePorNome((TO.financeiro.nomeCidade(v)) || v))
          .filter(Boolean);
        if(viz.length) html += linhaD('Vizinhas pela estrada', viz.join(', '));
      }catch(x){}
      cx.innerHTML = html;
      return cx;
    };

    const abaTorcidasC = ()=>{
      const cx = el('div');
      /* a tabela completa voltou (ordem do dono, 01/09/2026): membros,
         sede, subsedes, lojas e bares por torcida — e as zonas abaixo
         dizem ONDE cada estrutura está */
      const tab = el('table',{class:'dados'});
      tab.appendChild(el('thead', null, [el('tr',{html:
        `<th>Torcida</th><th>Membros</th><th>Sede</th>`+
        `<th>Subsedes</th><th>Lojas</th><th>Bares</th>`})]));
      const tb = el('tbody');
      for(const o of TO.mundo.torcidasEm(c.id)){
        if(o.incompleta) continue;
        const nossa = o.id === e.torcida.id;
        const t = nossa ? null : (e.mundoTorcidas||{})[o.id];
        if(!nossa && !t) continue;
        const pat = nossa ? TO.financeiro.patrimonio(e) : t;
        tb.appendChild(el('tr',{class: nossa ? 'nossa' : '', html:
          `<td>${linkTorcida(o.id, o.nome)}</td>`+
          `<td class="num">${nossa ? e.membros.length
            : Math.round(t.membros)}</td>`+
          `<td class="num">n${nossa ? e.torcida.sedeNivel : t.sede}</td>`+
          `<td class="num">${nossa ? ((pat.subsedes||[]).length || '—')
            : (t.subsedes || '—')}</td>`+
          `<td class="num">${(pat.lojas||[]).length || '—'}</td>`+
          `<td class="num">${(pat.bares||[]).length || '—'}</td>`}));
      }
      tab.appendChild(tb);
      cx.appendChild(el('div',{class:'recado', html:'<b>Da casa</b>'}));
      cx.appendChild(tab);

      /* subsedes de fora: quem plantou núcleo nesta praça */
      const deFora = [];
      if(TO.patrimonio.temFilialEm && TO.patrimonio.temFilialEm(e, c.id)){
        const f = ((e.patrimonio||{}).filiais||[])
          .find(x=>x.cidade === c.id);
        if(f) deFora.push({id:e.torcida.id, nome:e.torcida.nome,
          nivel:f.nivel,
          nucleo:e.membros.filter(m=>m.filial === c.id).length});
      }
      for(const [tid, t] of Object.entries(e.mundoTorcidas||{})){
        const f = (t.filiais||[]).find(x=>x.cidade === c.id);
        if(!f) continue;
        const o = TO.mundo.torcida(tid);
        if(o) deFora.push({id:tid, nome:o.nome, nivel:f.nivel,
                           nucleo:f.membros || 0});
      }
      if(deFora.length){
        cx.appendChild(el('div',{class:'recado',
          html:'<b>Subsedes de fora</b>'}));
        const tab2 = el('table',{class:'dados'});
        tab2.appendChild(el('thead', null, [el('tr',{html:
          `<th>Torcida</th><th>Nível</th><th>Núcleo</th>`})]));
        const tb2 = el('tbody');
        for(const f of deFora.sort((a,b)=>b.nucleo - a.nucleo))
          tb2.appendChild(el('tr',{html:
            `<td>${linkTorcida(f.id, f.nome)}</td>`+
            `<td class="num">n${f.nivel}</td>`+
            `<td class="num">${f.nucleo}</td>`}));
        tab2.appendChild(tb2);
        cx.appendChild(tab2);
      }

      /* ESTRUTURAS POR ZONA (ordem do dono, 01/09/2026): a praça
         contada rua a rua — cada zona diz o que tem e em qual bairro.
         O endereço da IA não se sorteia: a sede vem da fonte
         (bairroSede) e bar, loja e subsede saem de hash fixo por
         torcida e índice — o mesmo espírito do nosso "endereço não
         se sorteia". */
      const H = TO.mapa.hash;
      const bairros = c.bairros || [];
      const porNome = {};
      for(const b of bairros) porNome[b.nome] = b;
      const bairroFixo = chave =>
        bairros.length ? bairros[H(chave) % bairros.length] : null;
      const itens = [];
      const põe = (bairro, rot, tid, tnome)=>{
        const b = typeof bairro === 'string'
          ? (porNome[bairro] || null) : bairro;
        itens.push({zona: (b && b.zona) || 'Sem zona',
                    bairro: b ? b.nome
                      : (typeof bairro === 'string' ? bairro : '—'),
                    rot, tid, tnome});
      };
      for(const o of TO.mundo.torcidasEm(c.id)){
        if(o.incompleta) continue;
        const nossa = o.id === e.torcida.id;
        const t = nossa ? null : (e.mundoTorcidas||{})[o.id];
        if(!nossa && !t) continue;
        if(nossa){
          const bs = TO.mundo.bairroDaSede(e.torcida);
          põe(bs ? bs.nome : o.bairroSede,
              `Sede (nível ${e.torcida.sedeNivel})`, o.id, o.nome);
          const pat = TO.financeiro.patrimonio(e);
          (pat.bares||[]).forEach((b,i)=>põe(
            b.bairro || bairroFixo(`${o.id}|bar|${i}`),
            `Bar (nível ${b.nivel})`, o.id, o.nome));
          (pat.lojas||[]).forEach((l,i)=>põe(
            l.bairro || bairroFixo(`${o.id}|loja|${i}`),
            `Loja (nível ${l.nivel})`, o.id, o.nome));
          (pat.subsedes||[]).forEach((s,i)=>põe(
            s.bairro || bairroFixo(`${o.id}|subsede|${i}`),
            'Subsede', o.id, o.nome));
        } else {
          põe(o.bairroSede || bairroFixo(`${o.id}|sede`),
              `Sede (nível ${t.sede})`, o.id, o.nome);
          (t.bares||[]).forEach((b,i)=>põe(bairroFixo(`${o.id}|bar|${i}`),
            `Bar (nível ${b.nivel||1})`, o.id, o.nome));
          (t.lojas||[]).forEach((l,i)=>põe(bairroFixo(`${o.id}|loja|${i}`),
            `Loja (nível ${l.nivel||1})`, o.id, o.nome));
          for(let i=0;i<(t.subsedes||0);i++)
            põe(bairroFixo(`${o.id}|subsede|${i}`), 'Subsede', o.id, o.nome);
        }
      }
      for(const f of deFora)
        põe(bairroFixo(`${f.id}|filial`),
            `Subsede de fora (nível ${f.nivel} · núcleo ${f.nucleo})`,
            f.id, f.nome);
      const ordem = [];
      for(const b of bairros)
        if(b.zona && !ordem.includes(b.zona)) ordem.push(b.zona);
      if(itens.some(x=>x.zona === 'Sem zona')) ordem.push('Sem zona');
      for(const z of ordem){
        const doz = itens.filter(x=>x.zona === z);
        if(!doz.length) continue;
        cx.appendChild(el('div',{class:'recado',
          html:`<b>${z === 'Centro' ? 'Centro' : 'Zona '+z}</b>`}));
        for(const it of doz)
          cx.appendChild(el('div',{class:'transacao linha-zona', html:
            `<span class="desc">${it.rot} da `+
            `${linkTorcida(it.tid, it.tnome)}</span>
             <span class="dia" title="${it.bairro}">${it.bairro}</span>`}));
      }
      return cx;
    };

    const pintar = ()=>{
      corpo.innerHTML = '';
      const abas = el('div',{class:'filtros'});
      for(const [aid, rot] of [['visao','Visão geral'],
          ['torcidas','Torcidas e estruturas']]){
        const b = el('button',{class: aid === abaPerfilC ? 'on' : '',
                               texto: rot});
        b.onclick = ()=>{ abaPerfilC = aid; pintar(); };
        abas.appendChild(b);
      }
      corpo.appendChild(abas);
      corpo.appendChild(abaPerfilC === 'torcidas' ? abaTorcidasC()
                                                  : abaVisaoC());
    };
    pintar();
    modal(c.nome, `${c.uf || ''}${c.regiao ? ` · ${c.regiao}` : ''} · `+
      `${TO.mundo.torcidasEm(c.id).filter(o=>!o.incompleta).length} torcidas`,
      corpo);
    /* A CAPA DA CIDADE (pedido do dono, 01/09/2026): o cabeçalho do
       perfil vira cartão-postal — a foto mora em img/cidades/<id>.webp
       e entra por baixo do gradiente; sem arquivo, fica o gradiente
       escuro de sempre, sem quebrar nada. */
    const ov = [...document.querySelectorAll('.tela-cheia')].pop();
    const cab = ov && ov.querySelector('.moldura > header');
    /* o manifesto manda: sem foto listada, nem se pede o arquivo — as
       praças de fora do Brasil ainda não têm cartão-postal e não é pra
       encher o console de 404 por causa disso */
    if(cab && (TO.dados.capas||{})[c.id]){
      cab.classList.add('capa-cidade');
      cab.style.backgroundImage =
        'linear-gradient(180deg, rgba(8,9,12,.30), rgba(8,9,12,.86)), '+
        `url("${IMG('img/cidades/' + c.id + '.webp')}")`;
    }
  }

  /* o clique nos nomes é delegado: qualquer .t-link ou .c-link, em
     qualquer tabela, quadro ou texto, abre o perfil */
  document.addEventListener('click', ev=>{
    const l = ev.target.closest && ev.target.closest('.t-link');
    if(l && l.dataset.torcida) return abrirPerfilTorcida(l.dataset.torcida);
    const lc = ev.target.closest && ev.target.closest('.c-link');
    if(lc && lc.dataset.cidade) return abrirPerfilCidade(lc.dataset.cidade);
    const lx = ev.target.closest && ev.target.closest('.x-link');
    if(lx && lx.dataset.eixo) abrirPerfilEixo(lx.dataset.eixo);
  });

  /* =======================================================
     O PERFIL DO EIXO DE ALIANÇA (pedido do dono, 11/09/2026)
     Mesmo overlay das torcidas e cidades: os membros com clube,
     praça e relação com a gente; os maiores rivais do eixo; as
     praças cobertas; a força somada; a história de quem entrou.
     ======================================================= */
  const linkEixo = (id, nome) =>
    id ? `<span class="x-link" data-eixo="${id}">${nome}</span>` : nome;
  function abrirPerfilEixo(id){
    const e = E(); const X = TO.eixos;
    if(!e || !X) return;
    const r = X.resumo(e, id); if(!r) return;
    const corpo = el('div',{class:'perfil-torcida'});
    const linhaD = (rot, val)=>`<div class="linha-dado"><span>${rot}</span><b>${val}</b></div>`;
    const nomeCid = c => (TO.financeiro.nomeCidade && TO.financeiro.nomeCidade(c)) || c;
    const faixa = el('div',{class:'perfil-t-faixa'}); faixa.style.background = r.nosso ? 'var(--ouro)' : '#444';
    corpo.appendChild(faixa);
    corpo.appendChild(el('div',{html:
      linhaD('Torcidas', `${r.membros.length}${r.nosso ? ' <small class="fraco">· a gente está dentro</small>' : ''}`)+
      linhaD('Força somada', `${U.numero(Math.round(r.forca))} membros`)+
      linhaD('Praças', r.pracas.map(c=>linkCidade(c, nomeCid(c))).join(', ') || '—')+
      linhaD('Fundação', r.x.base ? 'de nascença' : `${r.x.fundado.ano}, semana ${r.x.fundado.semana}`)+
      (r.rivais.length ? linhaD('Maiores rivais do eixo', r.rivais.map(x=>linkTorcida(x, (TO.mundo.torcida(x)||{}).nome || x)).join(', ')) : '')}));
    const tab = el('table',{class:'dados'});
    tab.appendChild(el('thead', null, [el('tr',{html:`<th>Torcida</th><th>Clube</th><th>Praça</th><th>Relação</th></tr>`})]));
    const tb = el('tbody');
    for(const o of r.membros){
      const nossa = o.id === e.torcida.id;
      const clube = TO.mundo.time(o.clubeId) || {};
      const v = nossa ? null : Math.round(TO.relacoes.nivel(e, o.id));
      tb.appendChild(el('tr',{class: nossa ? 'nossa' : '', html:
        `<td>${chipTorcida(o.id, (TO.mundo.coresDaTorcida(o)||{}).cor)} ${linkTorcida(o.id, o.nome)}</td>`+
        `<td>${clube.nome ? chipClube(o.clubeId, (clube.cores||[])[0]||'#888')+' '+clube.nome : '—'}</td>`+
        `<td>${linkCidade(o.mapa, nomeCid(o.mapa))}</td>`+
        `<td class="num">${nossa ? '—' : `${v} <small class="fraco">${TO.mundo.statusDoValor(v)}</small>`}</td>`}));
    }
    tab.appendChild(tb); corpo.appendChild(tab);
    const hist = (X.caixas(e).historico||[]).filter(h=>h.eixo === id).slice(0, 12);
    if(hist.length){
      corpo.appendChild(el('div',{class:'rec-titulo', texto:'Movimento', estilo:{marginTop:'10px'}}));
      for(const h of hist) corpo.appendChild(el('div',{class:'noticia', html:
        `<span class="data">${h.ano} · s${h.semana}</span><span class="txt">${
          h.tipo === 'fundou' ? `Fundado por ${h.membros.map(m=>linkTorcida(m, (TO.mundo.torcida(m)||{}).nome||m)).join(', ')}`
          : `${linkTorcida(h.torcida, (TO.mundo.torcida(h.torcida)||{}).nome||h.torcida)} entrou`}</span>`}));
    }
    modal(r.x.nome, `${r.x.sigla ? r.x.sigla+' · ' : ''}eixo de aliança · ${r.membros.length} torcidas`, corpo);
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
    /* O LAYOUT ANTIGO DE VOLTA (dono, 10/09/2026): a tabela da Estrutura
       e o quadro das faixas. Os auxiliares `comprar`/`oferta` não voltam
       porque já estavam mortos aqui desde que a compra foi pra Loja. */
    const linhas = PAT.linhas(e);
    const soma = k => linhas.reduce((s,l)=>s+l[k], 0);
    const c = cartao('Estrutura',
      'por mês · mensalidade e caravana ficam no Resumo');
    const tab = el('div',{class:'tabela-pat'});
    tab.appendChild(el('div',{class:'cab', html:
      '<span>Local</span><span>Receita</span><span>Despesa</span><span>Mês</span>'}));
    for(const l of linhas){
      tab.appendChild(el('div',{class:'linha', html:
        `<span class="nome">${l.rot}${l.bairro
          ? `<small>${linkCidadePorNome(l.bairro)}</small>` : ''}`+
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

    /* AS COMPRAS SAÍRAM DAQUI (a Loja do dono, 09/09/2026): o Patrimônio
       mostra o que a torcida tem e o que rende; comprar é na aba Loja */
    const irLoja = el('button',{class:'bt', texto:'Comprar e ampliar é na Loja →'});
    irLoja.onclick = ()=>{ subFin='loja'; redesenhar(); };
    pg.appendChild(el('div',{class:'loja-chamada'},[irLoja]));

    /* AS FAIXAS (pedido do dono, 09/09/2026): as nossas e as que tomamos,
       estas de cabeça pra baixo */
    const fx = PAT.faixasDe(e);
    const c3 = cartao('Faixas', `${fx.nossas.length} ${fx.nossas.length===1?'nossa':'nossas'} · ${fx.tomadas.length} ${fx.tomadas.length===1?'tomada':'tomadas'}`);
    const bl = el('div',{class:'faixas'});
    bl.appendChild(el('div',{class:'faixas-rot', texto:'As nossas'}));
    const nossas = el('div',{class:'faixas-lista'});
    if(!fx.nossas.length) nossas.appendChild(el('div',{class:'fraco', texto:'Nenhuma: sem faixa na sede, nada a expor — nem a perder. Compre uma na Loja.'}));
    const imgFaixa = (o, cls, title, k) => {
      const im = el('img',{class:cls, title});
      im.src = PAT.imagemDaFaixa(o, url => { im.src = url; }, 'faixa', k || 0) || '';
      return im;
    };
    fx.nossas.forEach((f, k) => nossas.appendChild(imgFaixa(e.torcida, 'faixa-img', `Faixa da ${e.torcida.nome} · desde ${f.desde}`, k)));
    bl.appendChild(nossas);
    bl.appendChild(el('div',{class:'faixas-rot', texto:'Tomadas'}));
    const tomadas = el('div',{class:'faixas-lista'});
    if(!fx.tomadas.length) tomadas.appendChild(el('div',{class:'fraco', texto:'Nenhuma ainda. Faixa se toma na rua: quem carrega a deles cai, ela é nossa.'}));
    for(const f of fx.tomadas){
      const o = TO.mundo.torcida(f.de) || {id:f.de, nome:f.nome};
      const cx = el('div',{class:'faixa-tomada'});
      cx.appendChild(imgFaixa(o, 'faixa-img virada', `Faixa da ${f.nome}, tomada em ${(f.quando||{}).ano||''}`));
      cx.appendChild(el('small',{html:`da ${linkTorcida(f.de, f.nome)}${(f.quando||{}).ano ? ` · ${f.quando.ano}` : ''}`}));
      tomadas.appendChild(cx);
    }
    bl.appendChild(tomadas);
    /* as bandeiras (dono, 09/09/2026): mesma lógica, quadradas */
    const bd = PAT.bandeirasDe(e);
    const imgBand = (o, cls, title) => {
      const im = el('img',{class:cls, title});
      im.src = PAT.imagemDaBandeira(o, url => { im.src = url; }) || '';
      return im;
    };
    bl.appendChild(el('div',{class:'faixas-rot', texto:`Bandeiras · ${bd.nossas.length} ${bd.nossas.length===1?'nossa':'nossas'} · ${bd.tomadas.length} ${bd.tomadas.length===1?'tomada':'tomadas'}`}));
    const bands = el('div',{class:'faixas-lista bandeiras'});
    if(!bd.nossas.length && !bd.tomadas.length) bands.appendChild(el('div',{class:'fraco', texto:'Nenhuma. Compre uma na Loja: sai no lugar da faixa no bar e na concentração, e junto dela no estádio.'}));
    for(const f of bd.nossas) bands.appendChild(imgBand(e.torcida, 'bandeira-img', `Bandeira da ${e.torcida.nome} · desde ${f.desde}`));
    for(const f of bd.tomadas){
      const o = TO.mundo.torcida(f.de) || {id:f.de, nome:f.nome};
      const cx = el('div',{class:'faixa-tomada'});
      cx.appendChild(imgBand(o, 'bandeira-img virada', `Bandeira da ${f.nome}, tomada em ${(f.quando||{}).ano||''}`));
      cx.appendChild(el('small',{html:`da ${linkTorcida(f.de, f.nome)}`}));
      bands.appendChild(cx);
    }
    bl.appendChild(bands);
    c3.corpo.appendChild(bl);
    pg.appendChild(c3);
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

    /* PRESSIONAR O CLUBE SAIU DA TELA (ordem do dono, 24/08/2026):
       o cartão morava aqui, no Elenco, e foi removido. */
  }

  /* =======================================================
     A LOJA (pedido do dono, 09/09/2026)
     Tudo que se compra, numa aba só do Financeiro, agrupado por
     natureza. Em cima, a COMPRA RÁPIDA: bomba, faixa e bandeira
     são o que se repõe toda semana, então têm cartão grande, com
     estoque, prévia e um botão — a bomba com contador. Embaixo,
     a sede e os anexos, os pontos comerciais, as subsedes de
     fora, o pessoal e a frota, em cartões numa grade.
     ======================================================= */
  let lojaBombas = 5;
  function pintarLoja(pg, e){
    const PAT = TO.patrimonio;
    const comprar = (fn)=>{
      const r = fn();
      aviso(r.msg, r.ok?'boa':'ruim');
      if(r.ok) redesenhar();
    };
    const todas = PAT.opcoes(e);
    const de = nat => todas.filter(o=>o.natureza===nat);
    const acha = id => todas.find(o=>o.id===id);

    pg.appendChild(el('div',{class:'loja-caixa', html:
      `<span>Caixa da torcida</span><b>${U.dinheiro(e.dinheiro)}</b>`}));

    /* ---- compra rápida ---- */
    const rap = el('div',{class:'loja-rapida'});
    const botao = (rot, trava, aoClicar)=>{
      const b = el('button',{class:'loja-bt', texto:rot});
      b.disabled = !!trava; b.onclick = aoClicar;
      return b;
    };
    /* bombas: contador e total na hora */
    {
      const preco = PAT.precoBomba(e), est = PAT.bombas(e);
      const t = el('div',{class:'loja-tile'});
      t.appendChild(el('h3',{texto:'Bombas'}));
      t.appendChild(el('span',{class:'estoque', html:
        `estoque: <b>${est}</b> · ${U.dinheiro(preco)} cada`+
        `${(e.patrimonio||{}).galpao ? ' · galpão: 15% mais barata' : ''}`}));
      const st = el('div',{class:'stepper'});
      const menos = el('button',{texto:'−'}), mais = el('button',{texto:'+'});
      const num = el('b',{texto:String(lojaBombas)});
      const total = el('span',{class:'preco'});
      const pe = el('div',{class:'pe'});
      const bt = botao('Comprar', null, ()=>comprar(()=>{
        const r = PAT.comprarBombas(e, lojaBombas);
        return r.ok ? {ok:true, msg:`${r.compradas} bomba${r.compradas===1?'':'s'} no estoque.`}
                    : {ok:false, msg:'Não dá: '+(r.msg||'falta caixa')+'.'};
      }));
      const atualiza = ()=>{
        num.textContent = String(lojaBombas);
        const c = lojaBombas * preco;
        total.textContent = U.dinheiro(c);
        bt.disabled = e.dinheiro < c;
        menos.disabled = lojaBombas <= 1;
      };
      menos.onclick = ()=>{ lojaBombas = Math.max(1, lojaBombas-1); atualiza(); };
      mais.onclick  = ()=>{ lojaBombas = Math.min(50, lojaBombas+1); atualiza(); };
      st.appendChild(menos); st.appendChild(num); st.appendChild(mais);
      for(const q of [5,10,20]){
        const b = el('button',{class:'atalho', texto:String(q)});
        b.onclick = ()=>{ lojaBombas = q; atualiza(); };
        st.appendChild(b);
      }
      t.appendChild(st);
      pe.appendChild(total); pe.appendChild(bt); t.appendChild(pe);
      atualiza();
      rap.appendChild(t);
    }
    /* faixa e bandeira: prévia da próxima e um clique */
    const pano = (tipo, rot, o, quantas, img)=>{
      const t = el('div',{class:'loja-tile'});
      t.appendChild(el('h3',{texto:rot}));
      t.appendChild(el('span',{class:'estoque', html:
        `na sede: <b>${quantas}</b> · ${o.nota.split(' · ').slice(1).join(' · ')}`}));
      const pv = el('div',{class:'previa'});
      const im = el('img',{class:tipo==='faixa'?'faixa-img':'bandeira-img', title:'a próxima'});
      im.src = img(url=>{ im.src = url; }) || '';
      pv.appendChild(im); t.appendChild(pv);
      const pe = el('div',{class:'pe'});
      pe.appendChild(el('span',{class:'preco', texto:U.dinheiro(o.custo)}));
      pe.appendChild(botao('Comprar', o.trava, ()=>comprar(()=>PAT.comprar(e, o.id))));
      t.appendChild(pe);
      if(o.trava) t.appendChild(el('small',{class:'trava', texto:o.trava}));
      rap.appendChild(t);
    };
    const oF = acha('faixa'), oB = acha('bandeira');
    if(oF) pano('faixa', 'Faixa', oF, PAT.faixasDe(e).nossas.length,
      cb=>PAT.imagemDaFaixa(e.torcida, cb, 'faixa', PAT.faixasDe(e).nossas.length));
    if(oB) pano('bandeira', 'Bandeira', oB, PAT.bandeirasDe(e).nossas.length,
      cb=>PAT.imagemDaBandeira(e.torcida, cb));
    const sec0 = el('div',{class:'loja-secao'});
    sec0.appendChild(el('h3',{html:'Compra rápida <small>material de cena — o que se repõe toda semana</small>'}));
    sec0.appendChild(rap);
    pg.appendChild(sec0);

    /* ---- o resto, por natureza ---- */
    const SECOES = [
      ['sede',    'Sede e anexos',        'o que a sede comporta, e o que ela ganha'],
      ['pontos',  'Pontos comerciais',    'bar, loja e subsede: rendem todo mês'],
      ['filiais', 'Subsedes em outras cidades', 'núcleo local que recruta, defende e ataca lá'],
      ['pessoal', 'Pessoal',              'professor de MMA e advogado: mensalidade no fechamento'],
      ['frota',   'Frota',                'ônibus: a caravana de estrada sai mais barata'],
      ['outros',  'Outros',               ''],
    ];
    for(const [nat, rot, sub] of SECOES){
      const itens = de(nat);
      if(!itens.length) continue;
      const sec = el('div',{class:'loja-secao'});
      sec.appendChild(el('h3',{html:`${rot}${sub?` <small>${sub}</small>`:''}`}));
      const gr = el('div',{class:'loja-grade'});
      for(const o of itens){
        const it = el('div',{class:'loja-item'+(o.trava?' travada':'')});
        it.appendChild(el('b',{texto:o.rot}));
        if(o.nota) it.appendChild(el('small',{class:'loja-nota', texto:o.nota}));
        const pe = el('div',{class:'pe'});
        let sel = null;
        if(o.escolhas){
          sel = el('select',{class:'sel-oferta'});
          for(const esc of o.escolhas) sel.appendChild(el('option',{value:esc.id, texto:esc.rot}));
          sel.disabled = !!o.trava;
          it.appendChild(sel);
        }
        const gratis = !o.custo;
        pe.appendChild(el('span',{class:'preco', texto: gratis ? 'sem custo' : U.dinheiro(o.custo)}));
        pe.appendChild(botao(gratis ? 'Confirmar' : 'Comprar', o.trava,
          ()=>comprar(()=>PAT.comprar(e, sel ? o.id+':'+sel.value : o.id))));
        it.appendChild(pe);
        if(o.trava) it.appendChild(el('small',{class:'trava', texto:o.trava}));
        gr.appendChild(it);
      }
      sec.appendChild(gr);
      pg.appendChild(sec);
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
      {id:'loja', rot:'Loja'},
      {id:'patrimonio', rot:'Patrimônio'},
      {id:'elenco', rot:'Elenco'},
      {id:'transacoes', rot:'Transações'}
    ], subFin, id=>{subFin=id; redesenhar();}));

    if(subFin==='loja'){ pintarLoja(pg, e); return; }
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
      if(rm.pix && rm.pix.rec)
        pend.push({rot:`Doações por PIX no mês corrente (${rm.pix.n})`,
                   v: Math.round(rm.pix.rec)});
      if(rm.campana && rm.campana.des)
        pend.push({rot:`Campana do olheiro no mês corrente (${rm.campana.n})`,
                   v: -Math.round(rm.campana.des)});
      if(rm.padrinho && rm.padrinho.des)
        pend.push({rot:`Padrinho de treino no mês corrente (${rm.padrinho.n})`,
                   v: -Math.round(rm.padrinho.des)});
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
  let compSel = null, rodadaSel = null, faseSel = null, divLNT = null;
  /* a vista extra da competição: null (a tela normal), 'publico' ou
     'historico' (pedido do dono, 25/08/2026) */
  let vistaComp = null;

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
         <td class="time">${chipClube(l.id, corClube(l.id))}${nomeClube(l.id)}</td>
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
      `<span class="casa">${nomeClube(j.c)}${chipClube(j.c, corClube(j.c))}</span>
       <span class="${feito?'placar':'x'}">${feito?`${j.gc} × ${j.gf}`:'×'}</span>
       <span class="fora">${chipClube(j.f, corClube(j.f))}${nomeClube(j.f)}</span>`}));
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

  /* =======================================================
     COMPETIÇÕES EM TRÊS NÍVEIS (régua do dono, 23/08/2026)

     Três botões em cima — INTERNACIONAL, NACIONAL, REGIONAL — e
     embaixo o filtro da competição. No nacional entra também o filtro
     do país, que é o que separa dez calendários. O regional só existe
     no Brasil: lá fora não há estadual.

     Antes era uma fileira única de nove abas misturando Série A,
     Copa do Brasil, LNT, América do Sul e Conmebol. Com dez países
     isso não escala, e nem diz ao jogador o que é o quê.
     ======================================================= */
  let nivelComp = 'nacional', paisComp = null;

  /* =======================================================
     AS BANDEIRAS DOS DEZ PAÍSES (pedido do dono, 23/08/2026;
     banco de verdade em 02/09/2026)

     O filtro do país era dez nomes escritos; virou uma fileira de
     bandeirinhas. Elas eram desenhadas à mão em SVG — o dono mandou
     buscar um banco com as bandeiras de todos os países: entrou o
     flag-icons (lipis, MIT, npm v7.5.0), que cobre o mundo inteiro
     em SVG 4×3. Os dez países do jogo moram em img/bandeiras/<iso>.svg
     e a fileira, a seleção de torcida e o que mais precisar de país
     puxam dali pelo mesmo cano IMG() dos escudos. País sem arquivo
     cai na sigla escrita, como o escudo cai no quadradinho.
     ======================================================= */
  const PAIS_ISO = {
    'Brasil':'br', 'Argentina':'ar', 'Bolívia':'bo', 'Chile':'cl',
    'Colômbia':'co', 'Equador':'ec', 'Paraguai':'py', 'Peru':'pe',
    'Uruguai':'uy', 'Venezuela':'ve'
  };

  function bandeira(pais){
    const iso = PAIS_ISO[pais];
    if(!iso) return '';
    return `<img class="bandeira" src="${IMG('img/bandeiras/'+iso+'.svg')}" `+
           `width="30" height="20" alt="${pais}">`;
  }

  const NIVEIS = [
    {id:'internacional', rot:'Internacional'},
    {id:'nacional',      rot:'Nacional'},
    {id:'regional',      rot:'Regional'}
  ];

  /* o cardápio de cada nível: [{id, rot, conta}] */
  function menuDoNivel(e){
    if(nivelComp === 'internacional'){
      /* mesmo antes de a edição montar as duas abas existem: o
         Histórico e a Média de público não dependem do calendário */
      const cm = e.conmebol || {};
      return [{id:'libertadores', rot:'Libertadores',
               conta:((cm.libertadores||{}).clubes||[]).length || null},
              {id:'sulamericana', rot:'Sul-Americana',
               conta:((cm.sulamericana||{}).clubes||[]).length || null}];
    }
    if(nivelComp === 'regional'){
      const S = e.temporada;
      if(!S) return [];
      return S.competicoes.filter(c=>c.tipo==='regional')
        .map(c=>({id:c.id, rot:c.nome, conta:c.clubes.length}));
    }
    /* nacional: depende do país */
    /* JOGADOR DE FORA: o Brasil não tem temporada, tem tabela — então
       ele desce pro mesmo caminho dos outros nove, logo abaixo. */
    const temBR = e.temporada &&
      (e.temporada.competicoes||[]).some(c=>c.tipo==='nacional');
    if(paisComp === 'Brasil' && temBR){
      const S = e.temporada;
      const fora = (S ? S.competicoes.filter(c=>c.tipo==='nacional') : [])
        .map(c=>({id:c.id, rot:c.nome.replace('Brasileirão ',''),
                  conta:c.clubes.length}));
      const copa = S && S.competicoes.find(c=>c.copa);
      if(copa) fora.push({id:copa.id, rot:copa.nome, conta:copa.clubes.length});
      if(TO.lnt && TO.lnt.existe(e)) fora.push({id:'lnt', rot:'LNT', conta:138});
      /* o botão Histórico do menu saiu (ordem do dono, 25/08/2026):
         o Histórico por competição supre melhor */
      return fora;
    }
    const P = (e.ligas||{}).paises && e.ligas.paises[paisComp];
    const fora = P ? Object.keys(P.divisoes).map(d=>({
      id:'liga:'+d, rot:d.replace(paisComp+' ','').replace('Brasileirão ',''),
      conta:P.divisoes[d].clubes.length})) : [];
    const copa = (e.conmebol||{}).copas && e.conmebol.copas[paisComp];
    if(copa) fora.push({id:'copa-nac', rot:copa.nome, conta:copa.clubes.length});
    if(paisComp === 'Brasil'){
      if(TO.lnt && TO.lnt.existe(e)) fora.push({id:'lnt', rot:'LNT', conta:138});
    }
    return fora;
  }

  /* A FILEIRA DE BANDEIRAS É SEMPRE A MESMA. Antes ela saía de
     `E.ligas`, que só nasce no primeiro tique da semana — no dia 1 do
     jogo a linha tinha uma bandeira só, e crescia sozinha depois. Agora
     a lista é a dos países que têm clube, que não muda nunca; país sem
     tabela ainda mostra "Ainda não" ao ser aberto, como sempre. */
  let _paises = null;
  const paisesJogaveis = e => {
    if(!_paises){
      const s = new Set(['Brasil']);
      for(const t of TO.mundo.todosTimes) if(t.pais) s.add(t.pais);
      _paises = ['Brasil'].concat([...s].filter(p=>p!=='Brasil').sort());
    }
    return _paises;
  };

  function pintarCompeticoes(){
    const e = E(), pg = U.$('.pagina[data-pag="competicoes"]');
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-barra', html:'<h1>Competições</h1>'}));

    if(!e.temporada){
      pg.appendChild(emConstrucao('Sem temporada','Comece um jogo novo pra gerar a tabela.'));
      return;
    }

    /* ---- os três botões ---- */
    pg.appendChild(abasGrandes(NIVEIS, nivelComp, id=>{
      nivelComp = id; compSel = null; rodadaSel = null; faseSel = null;
      vistaComp = null; redesenhar();
    }));

    /* ---- o filtro do país, só no nacional ---- */
    if(nivelComp === 'nacional'){
      const paises = paisesJogaveis(e);
      /* a aba que abre é a do país da nossa torcida: jogando com a La 12
         a primeira tabela a aparecer tem que ser a da Argentina */
      const meuPais = TO.competicoes.paisDoJogador(e);
      if(!paises.includes(paisComp))
        paisComp = paises.includes(meuPais) ? meuPais : 'Brasil';
      const f = el('div',{class:'filtros-linha paises'});
      const meu = TO.competicoes.paisDe(TO.mundo.time(e.torcida.clubeId)||{});
      for(const p of paises){
        const b = el('button',{class:(p===paisComp?'on':'')+
          (p===meu?' minha':''), html: bandeira(p) || p});
        b.title = p;
        b.setAttribute('aria-label', p);
        b.onclick = ()=>{ paisComp = p; compSel = null;
                          vistaComp = null; redesenhar(); };
        f.appendChild(b);
      }
      pg.appendChild(f);
    }

    /* ---- o filtro da competição ---- */
    const menu = menuDoNivel(e);
    if(nivelComp === 'regional' && !menu.length){
      pg.appendChild(emConstrucao('Sem regional',
        'Competição regional só existe no Brasil: lá fora não há estadual.'));
      return;
    }
    if(!menu.length){
      pg.appendChild(emConstrucao('Ainda não',
        'Esta parte do calendário ainda não abriu neste ano.'));
      return;
    }
    if(!menu.some(m=>m.id===compSel)) compSel = escolhaPadrao(e, menu);
    const f2 = el('div',{class:'filtros-linha'});
    for(const m of menu){
      const b = el('button',{class:(m.id===compSel?'on':''), html:
        `${m.rot}${m.conta?`<span class="conta">${m.conta}</span>`:''}`});
      b.onclick = ()=>{ compSel = m.id; rodadaSel = null; faseSel = null;
                        vistaComp = null; redesenhar(); };
      f2.appendChild(b);
    }
    pg.appendChild(f2);

    /* ---- o corpo ---- */
    if(nivelComp === 'internacional'){ pintarConmebolUm(e, pg, compSel); return; }
    if(compSel === 'lnt'){ pintarLNT(e, pg); return; }
    if(compSel === 'copa-nac'){
      pintarCopaNacional(e, pg, e.conmebol.copas[paisComp]); return;
    }
    if(String(compSel).startsWith('liga:')){
      pintarLigaDeFora(e, pg, paisComp, compSel.slice(5)); return;
    }
    const comp = e.temporada.competicoes.find(c=>c.id===compSel);
    if(!comp){ pg.appendChild(emConstrucao('Sem dados','Competição não encontrada.')); return; }
    pintarCompeticaoBR(e, pg, comp);
  }

  /* abre na competição que o clube do jogador disputa */
  function escolhaPadrao(e, menu){
    const meu = TO.mundo.time(e.torcida.clubeId);
    if(nivelComp === 'nacional' && paisComp === 'Brasil' && meu){
      const div = (e.divisoes||{})[meu.id] || meu.divisao;
      const achou = menu.find(m=>div.endsWith(m.rot));
      if(achou) return achou.id;
    }
    if(nivelComp === 'regional' && meu){
      const reg = (e.regionais||{})[meu.id] || meu.regional;
      const achou = menu.find(m=>m.rot === reg);
      if(achou) return achou.id;
    }
    return menu[0].id;
  }

  /* ---------- o corpo de uma competição brasileira ---------- */
  function pintarCompeticaoBR(e, pg, comp){
    const vista = botoesDaCompeticao(pg);
    if(vista === 'publico'){
      pg.appendChild(painelPublico(e, clubesDaComp(comp), comp.nome)); return; }
    if(vista === 'historico'){
      /* o campeão do ANO CORRENTE ainda não está na virada: entra
         na frente da lista quando a competição já decidiu */
      const anosJogo = (comp.campeao
        ? [{ano:e.data.ano, campeao:comp.campeao, vice:comp.vice}] : [])
        .concat(titulosDoJogo(e, comp.nome));
      pg.appendChild(painelHistoricoComp(e, comp.id, comp.nome, anosJogo));
      return; }
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
    /* UMA PÁGINA POR FASE (pedido do dono, 24/08/2026): a
       classificação — com todos os grupos — é uma página, e cada fase
       do mata é outra, nas setas. Competição de fase única segue no
       quadro de sempre, sem navegador. */
    const paginas = [];
    if(comp.grupos.length && comp.grupos.some(g=>g && g.length)){
      const corpo = el('div');
      comp.grupos.forEach((g, ig)=>{
        if(comp.grupos.length>1)
          corpo.appendChild(el('div',{class:'fase-rot',
            texto:`Grupo ${'ABCDEFGH'[ig]||ig+1}`,
            estilo:{padding:'8px 14px 3px'}}));
        const rolo = el('div',{class:'rolo'});
        rolo.appendChild(tabelaLiga(e, comp, ig));
        corpo.appendChild(rolo);
      });
      paginas.push({rot:'Classificação', semana:0, corpo});
    }
    for(const fase of (comp.mata||[]))
      paginas.push({rot:fase.fase, semana:fase.semana,
                    corpo:paginaFaseMata(e, fase)});

    if(paginas.length > 1){
      esq.appendChild(painelFases(paginas, faseCorrente(e, paginas)));
    } else if(paginas.length === 1){
      const q = quadro('Classificação', el('span',{class:'conta',
        texto:`${es[atual] ? es[atual].rot : ''} de ${es.length}`}));
      q.corpo.appendChild(paginas[0].corpo);
      esq.appendChild(q);
    } else if(comp.copa){
      esq.appendChild(painelChave(e, comp));
    }

    duas.appendChild(esq);
    duas.appendChild(painelRodada(e, comp));
    pg.appendChild(duas);
  }

  /* =======================================================
     OS DOIS BOTÕES DA COMPETIÇÃO (pedido do dono, 25/08/2026)
     Média de público — quanto cada organizada põe no estádio
     em casa e como visitante — e Histórico, com os maiores
     campeões e a lista real de campeões e vices por ano.
     ======================================================= */
  function botoesDaCompeticao(pg){
    const f = el('div',{class:'filtros-linha vista-comp'});
    for(const [id, rot] of [['publico','Média de público'],
                            ['historico','Histórico']]){
      const b = el('button',{class:vistaComp===id?'on':'', texto:rot});
      b.onclick = ()=>{ vistaComp = vistaComp===id ? null : id; redesenhar(); };
      f.appendChild(b);
    }
    pg.appendChild(f);
    return vistaComp;
  }

  /* A MÉDIA DE PÚBLICO sai da régua que o jogo já usa no dia de jogo —
     a MESMA do jogador pros dois lados (ordem do dono, 31/08/2026):
     em casa a organizada põe todo o efetivo de pé na rua (a nossa leva
     os aptos); como visitante vai a caravana da conta da vontade, a
     mesma que `caravanaDe` faz. */
  function painelPublico(e, clubes, rotulo){
    const set = new Set(clubes||[]);
    const linhas = [];
    for(const o of TO.mundo.todasTorcidas){
      if(o.incompleta || !set.has(o.clubeId)) continue;
      const nossa = o.id === e.torcida.id;
      const casa = nossa ? TO.membros.aptosParaOEstadio(e).length
                         : TO.relacoes.disponiveisIA(e, o.id);
      let fora;
      if(nossa){
        const est = TO.planejamento.estimativaCaravana(e);
        fora = est ? est.vao : Math.max(5, Math.round(casa * TO.util.limitar(
          0.72 - 0.18 + (e.indicadores.moral/20)*0.4, 0.08, 0.95)));
      } else fora = TO.planejamento.caravanaDe(o, 0, e);
      linhas.push({id:o.id, nome:o.nome, nossa, casa, fora,
        clube:(TO.mundo.time(o.clubeId)||{}).nome || ''});
    }
    const quadroDe = (titulo, chave, nota)=>{
      const q = quadro(titulo, el('span',{class:'conta',
        texto:`${linhas.length} organizadas`}));
      q.corpo.appendChild(el('div',{class:'recado', html:nota}));
      const rolo = el('div',{class:'rolo'});
      linhas.sort((a,b)=>b[chave]-a[chave]).forEach((l,i)=>{
        rolo.appendChild(el('div',{class:'transacao',
          estilo: l.nossa ? {background:'var(--rubro-fundo)'} : null, html:
          `<span class="dia">${i+1}º</span>
           <span class="desc">${linkTorcida(l.id, l.nome)} `+
          `<small class="fraco">· ${l.clube}</small></span>
           <span class="val">${U.numero(l[chave])}</span>`}));
      });
      if(!linhas.length) q.corpo.appendChild(el('div',
        {class:'em-construcao', texto:'Nenhuma organizada mapeada aqui.'}));
      q.corpo.appendChild(rolo);
      return q;
    };
    const cx = el('div',{class:'comp-duas'});
    const esq = el('div'), dir = el('div');
    esq.appendChild(quadroDe(`Média de público — em casa`, 'casa',
      `${rotulo||'A competição'}: quanto cada organizada põe no estádio `+
      `jogando em casa — todo o efetivo de pé.`));
    dir.appendChild(quadroDe('Média como visitante', 'fora',
      'A caravana típica na estrada: quem está de pé vezes a vontade '+
      'de viajar, que sobe com a moral.'));
    cx.appendChild(esq); cx.appendChild(dir);
    return cx;
  }

  /* O HISTÓRICO: a base real (dados/historia.js) com os anos do JOGO
     emendados por cima — o que a temporada guardou de 2026 em diante. */
  function painelHistoricoComp(e, chave, nomeComp, jogoAnos){
    const hist = (TO.dados.historia||{})[chave] || null;
    const anosJogo = (jogoAnos||[]).map(t=>({ano:t.ano,
      campeao:nomeClube(t.campeao), vice:t.vice?nomeClube(t.vice):null, jogo:true}));
    const anosReais = ((hist&&hist.anos)||[]).map(([a,c,v])=>
      ({ano:a, campeao:c, vice:v, jogo:false}));
    const todos = anosJogo.concat(anosReais);
    const cx = el('div',{class:'comp-duas'});

    /* maiores: a contagem real da história inteira (quando a base a
       traz) mais os títulos conquistados dentro do jogo */
    const conta = new Map();
    if(hist && hist.maiores)
      for(const [n,t] of hist.maiores) conta.set(n, t);
    else
      for(const l of anosReais)
        if(l.campeao) conta.set(l.campeao, (conta.get(l.campeao)||0)+1);
    for(const l of anosJogo)
      if(l.campeao) conta.set(l.campeao, (conta.get(l.campeao)||0)+1);
    const maiores = [...conta.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12);

    const esq = el('div');
    const q1 = quadro('Maiores campeões', el('span',{class:'conta',
      texto:nomeComp||''}));
    if(hist && hist.nota)
      q1.corpo.appendChild(el('div',{class:'recado', html:hist.nota}));
    if(!maiores.length)
      q1.corpo.appendChild(el('div',{class:'em-construcao',
        texto:'Sem campeão registrado ainda — a história começa agora.'}));
    maiores.forEach(([n,t],i)=>{
      q1.corpo.appendChild(el('div',{class:'transacao', html:
        `<span class="dia">${i+1}º</span>
         <span class="desc">${n}</span>
         <span class="val">${t} ${t===1?'título':'títulos'}</span>`}));
    });
    esq.appendChild(q1);
    cx.appendChild(esq);

    const dir = el('div');
    const q2 = quadro('Campeões e vices por ano', el('span',{class:'conta',
      texto:`${todos.length} edições`}));
    const rolo = el('div',{class:'rolo'});
    for(const l of todos)
      rolo.appendChild(el('div',{class:'transacao',
        estilo: l.jogo ? {background:'var(--rubro-fundo)'} : null, html:
        `<span class="dia">${l.ano}</span>
         <span class="desc"><b>${l.campeao}</b>`+
        `${l.vice?` <small class="fraco">· vice: ${l.vice}</small>`:''}</span>`+
        `${l.jogo?'<span class="val fraco">no jogo</span>':''}`}));
    if(!todos.length)
      q2.corpo.appendChild(el('div',{class:'em-construcao',
        texto:'Nenhuma edição registrada.'}));
    q2.corpo.appendChild(rolo);
    dir.appendChild(q2);
    cx.appendChild(dir);
    return cx;
  }

  /* os títulos que o JOGO guardou pra esta competição */
  const titulosDoJogo = (e, nomeComp) =>
    (((e.temporada||{}).titulos)||[]).filter(t=>t.comp === nomeComp);

  const clubesDaComp = comp =>
    (comp.clubes && comp.clubes.length) ? comp.clubes
      : [...new Set((comp.grupos||[]).flat())];

  /* =======================================================
     UMA PÁGINA POR FASE (pedido do dono, 24/08/2026)
     Competição com mais de uma fase vira um navegador com as
     setas da rodada — ‹ FASE › — na ordem das fases. A
     Libertadores anda das três prévias pra classificação dos
     grupos e daí oitavas, quartas, semi e final.
     ======================================================= */
  function painelFases(paginas, atual){
    if(faseSel===null || faseSel>=paginas.length)
      faseSel = U.limitar(atual||0, 0, paginas.length-1);
    const i = U.limitar(faseSel, 0, paginas.length-1);
    const p = paginas[i];
    const q = el('div',{class:'quadro'});
    const cab = el('header',{class:'nav-rodada'});
    const ant = el('button',{html:'‹'}), pro = el('button',{html:'›'});
    ant.disabled = i<=0; pro.disabled = i>=paginas.length-1;
    ant.onclick = ()=>{ faseSel = i-1; redesenhar(); };
    pro.onclick = ()=>{ faseSel = i+1; redesenhar(); };
    cab.appendChild(ant);
    cab.appendChild(el('h2',{html:
      `${p.rot}<span class="conta">de ${paginas.length}</span>`}));
    cab.appendChild(pro);
    q.appendChild(cab);
    const corpo = el('div');
    corpo.appendChild(p.corpo);
    q.appendChild(corpo);
    return q;
  }

  /* em que página a tela abre: a última fase que já começou */
  function faseCorrente(e, paginas){
    let a = 0;
    paginas.forEach((p,i)=>{
      if(p.semana!=null && p.semana <= e.data.semana) a = i; });
    return a;
  }

  /* o corpo de uma fase de mata: todos os jogos dela, na chave */
  function paginaFaseMata(e, fase, nome){
    nome = nome || nomeClube;
    const meu = e.torcida.clubeId;
    const corpo = el('div');
    const reais = (fase.jogos||[]).filter(j=>j.f);
    const passes = (fase.jogos||[]).length - reais.length;
    corpo.appendChild(el('div',{class:'fase-rot',
      texto:`semana ${fase.semana}`+
            ` · ${reais.length} ${reais.length===1?'jogo':'jogos'}`+
            (passes?` · ${passes} ${passes===1?'passa':'passam'} direto`:'')}));
    const rolo = el('div',{class:'rolo'});
    for(const j of reais){
      const feito = j.gc!=null;
      rolo.appendChild(el('div',{class:'jogo-chave'+
        (j.c===meu||j.f===meu?' meu':''), html:
        `<span class="a ${j.venceu===j.c?'venceu':''}">${nome(j.c)}</span>
         <b>${feito?`${j.gc} × ${j.gf}`:'—'}</b>
         <span class="b ${j.venceu===j.f?'venceu':''}">${nome(j.f)}</span>
         ${j.agregado?`<em>${j.agregado}</em>`:''}
         ${penTexto(j)?`<em class="pen">${penTexto(j)}</em>`:''}`}));
      const serie = penSerie(j.pen);
      if(serie) rolo.appendChild(serie);
      if(j.neutro) rolo.appendChild(el('div',{class:'sub-chave',
        texto:`campo neutro · ${j.neutro}`}));
    }
    if(!reais.length) rolo.appendChild(el('div',{class:'em-construcao',
      texto:'Os jogos desta fase ainda não estão marcados.'}));
    corpo.appendChild(rolo);
    return corpo;
  }

  /* a chave de uma copa jogada: uma página por fase */
  function painelChave(e, comp){
    if(!(comp.mata||[]).length){
      const q = quadro('Chave', el('span',{class:'conta',
        texto:`${(comp.clubes||[]).length} clubes`}));
      q.corpo.innerHTML = '<div class="em-construcao">A copa começa na semana '+
        `${comp.semanaInicio}.</div>`;
      return q;
    }
    const paginas = comp.mata.map(f=>({rot:f.fase, semana:f.semana,
      corpo:paginaFaseMata(e, f)}));
    return painelFases(paginas, faseCorrente(e, paginas));
  }

  /* =======================================================
     UMA LIGA DE FORA NA TELA (dono, 23/08/2026)
     Os torneios do ano, a classificação de cada zona, o
     quadrangular ou hexagonal em andamento, o mata-mata e a
     tabela anual.

     A LIGA DO PAÍS DO JOGADOR TAMBÉM MOSTRA OS JOGOS (régua do
     dono, 23/08/2026). Ela é a única que guarda partida com data
     — as outras nove só guardam classificação —, então é nela
     que o painel de rodada com ‹ › aparece, do lado direito, no
     mesmo lugar e no mesmo desenho da competição brasileira.
     Quando não há jogo guardado, o lado direito volta a ser o
     mata-mata, como era.
     ======================================================= */
  let torneioSel = null;

  /* a competição-sombra que `ligas.js` pendura em E.temporada pro país
     do jogador: é dela que saem os jogos com data */
  const sombraDe = (e, T) => T && T.compId &&
    ((e.temporada||{}).competicoes||[]).find(c=>c.id === T.compId &&
      (c.rodadas||[]).length) || null;

  const nomeT = id => (TO.mundo.time(id)||{}).nome || '—';
  const corT  = id => ((TO.mundo.time(id)||{}).cores || ['#888'])[0];

  /* =======================================================
     QUEM VAI PRA CONMEBOL (pedido do dono, 23/08/2026)

     "Quando eu selecionar um país as competições dos demais países
     seguem aparecendo, mas somente mostrando a classificação e se tiver
     finalizado dizendo quem foi o campeão, o vice e os demais
     classificados pras competições Conmebol."

     A tabela dizia quem ganhou, mas não o que isso valeu. Este quadro
     fecha a conta do ano: campeão, vice e a lista das vagas, Copa
     Libertadores primeiro e Copa Sul-Americana depois, na ordem em que
     `conmebol.js` distribui de verdade. Vale pra qualquer um dos dez
     países, jogue o jogador nele ou não.
     ======================================================= */
  function painelVagasConmebol(e, pais, D){
    if(!TO.conmebol || !TO.conmebol.vagasDoPais) return null;
    const v = TO.conmebol.vagasDoPais(e, pais);
    if(!v || (!v.lib.length && !v.sul.length)) return null;
    const proximo = (e.data.ano || 2026) + 1;

    const q = quadro(`Vagas da Conmebol · ${proximo}`,
      el('span',{class:'conta', texto:`${v.lib.length + v.sul.length} vagas`}));

    if(D && D.campeao){
      q.corpo.appendChild(el('div',{class:'campeao', estilo:{padding:'12px 14px'}, html:
        `${IC.get('trofeu')}<div><b>${nomeT(D.campeao)}</b>`+
        `<small>${D.vice ? 'vice: ' + nomeT(D.vice) : 'campeão do ano'}</small></div>`}));
    }

    /* o campeão continental já tem a vaga na mão, e ela não sai da
       tabela do país — é o que faz o Brasil ter oito e a Argentina
       sete numa Libertadores de sete e seis */
    for(const id of v.donos)
      q.corpo.appendChild(el('div',{class:'sub-chave',
        texto:`${nomeT(id)} entra como campeão continental, fora da conta do país`}));

    /* a numeração é a da fila do país, e corre pelos dois torneios: o
       5º do campeonato é o 1º da Sul-Americana, e mostrar "1º" ali
       faria parecer que ele ganhou alguma coisa */
    let n = 0;
    const linhas = (rot, lista, classe)=>{
      if(!lista.length) return;
      q.corpo.appendChild(el('div',{class:'fase-rot', texto:rot}));
      for(const id of lista){
        n++;
        const nosso = id === e.torcida.clubeId;
        q.corpo.appendChild(el('div',{class:'vaga-cm '+classe+(nosso?' meu':''), html:
          `<span class="pos">${n}º</span>`+
          `${chipClube(id, corT(id))}`+
          `<span class="nm">${nomeT(id)}</span>`}));
      }
    };
    linhas('Libertadores', v.lib, 'lib');
    linhas('Sul-Americana', v.sul, 'sul');

    if(!D || !D.campeao)
      q.corpo.appendChild(el('div',{class:'sub-chave',
        texto:'a temporada ainda corre — a lista muda com a tabela'}));
    return q;
  }

  function pintarLigaDeFora(e, pg, pais, div){
    const L = TO.ligas;
    const P = (e.ligas||{}).paises && e.ligas.paises[pais];
    const D = P && P.divisoes[div];
    if(!D){ pg.appendChild(emConstrucao('Sem dados',
      'Esta liga ainda não montou neste ano.')); return; }

    const nomes = D.torneios.map(t=>t.nome);
    if(!nomes.includes(torneioSel)) torneioSel = nomes[0];

    const vista = botoesDaCompeticao(pg);
    if(vista === 'publico'){
      pg.appendChild(painelPublico(e, D.clubes, div)); return; }
    if(vista === 'historico'){
      /* a base real vale pra PRIMEIRA divisão do país; os anos do
         JOGO saem do arquivo anual das ligas (e o ano corrente, do
         que a divisão já decidiu) */
      const primeira = Object.keys(P.divisoes)[0] === div;
      const anosJogo = [];
      const linhaDe = (ano, dv)=>{
        if((dv.torneios||[]).length > 1){
          for(const T of dv.torneios)
            if(T.campeao) anosJogo.push({ano:`${ano} (${T.nome})`,
              campeao:T.campeao, vice:T.vice});
        } else if(dv.campeao)
          anosJogo.push({ano, campeao:dv.campeao, vice:dv.vice});
      };
      const anoAtual = (e.ligas||{}).ano || e.data.ano;
      const decididos = (D.torneios||[]).filter(t=>t.campeao);
      if(decididos.length > 1 || (decididos.length === 1 && !D.campeao))
        for(const T of decididos)
          anosJogo.push({ano:`${anoAtual} (${T.nome})`,
                         campeao:T.campeao, vice:T.vice});
      else if(D.campeao)
        anosJogo.push({ano:anoAtual, campeao:D.campeao, vice:D.vice});
      for(const h of (e.ligasHistorico||[])){
        const dv = ((h.paises||{})[pais]||[]).find(x=>x.div === div);
        if(dv) linhaDe(h.ano, dv);
      }
      pg.appendChild(painelHistoricoComp(e, primeira ? 'liga:'+pais : div,
        div, anosJogo)); return; }

    const duas = el('div',{class:'comp-duas'});
    const esq = el('div');

    if(D.campeao){
      const q = quadro('Campeão do ano', el('span',{class:'conta',
        texto:D.comoFechou||''}));
      q.corpo.appendChild(el('div',{class:'campeao', estilo:{padding:'12px 14px'}, html:
        `${IC.get('trofeu')}<div><b>${nomeT(D.campeao)}</b>`+
        `<small>${D.vice?'vice: '+nomeT(D.vice):''}</small></div>`}));
      if(D.campeaoDeLiga) q.corpo.appendChild(el('div',{class:'sub-chave',
        texto:`Campeão de Liga (tabela anual): ${nomeT(D.campeaoDeLiga)}`}));
      esq.appendChild(q);
    }

    if(D.torneios.length > 1){
      const f3 = el('div',{class:'filtros-linha torneios'});
      for(const T of D.torneios){
        const b = el('button',{class:(T.nome===torneioSel?'on':''), html:
          `${T.nome}${T.campeao?'<span class="conta">✓</span>':''}`});
        b.onclick = ()=>{ torneioSel = T.nome; rodadaSel = null; faseSel = null; redesenhar(); };
        f3.appendChild(b);
      }
      esq.appendChild(f3);
    }

    const T = D.torneios.find(x=>x.nome===torneioSel) || D.torneios[0];
    const fase = T.fases[T.faseAtual] || {};
    const zonas = T.zonas && T.zonas.length > 1 ? T.zonas : [D.clubes];
    zonas.forEach((z, iz)=>{
      const rot = zonas.length > 1 ? `${T.nome} · zona ${'AB'[iz]||iz+1}` : T.nome;
      const q = quadro(rot, el('span',{class:'conta', texto: T.campeao
        ? 'encerrado' : `fecha ${T.fecha} de ${fase.fechas||'—'}`}));
      const rolo = el('div',{class:'rolo'});
      rolo.appendChild(tabelaLiga2(L.ordenar(T.tabela, z), T.passam,
                                   e.torcida.clubeId));
      q.corpo.appendChild(rolo);
      esq.appendChild(q);
    });

    if(T.grupos && T.grupos.length){
      T.grupos.forEach((g, ig)=>{
        const q = quadro(T.grupos.length>1
          ? `Quadrangular ${'AB'[ig]||ig+1}` : 'Hexagonal final');
        const rolo = el('div',{class:'rolo'});
        rolo.appendChild(tabelaLiga2(L.ordenar(T.tabelaGrupo[ig], g), 1,
                                     e.torcida.clubeId));
        q.corpo.appendChild(rolo);
        esq.appendChild(q);
      });
    }

    /* A CONTA DO ANO FECHA A COLUNA. A vaga continental sai da primeira
       divisão do país; repetir o quadro na segunda seria dizer que a
       Primera B dá vaga na Libertadores, o que ela não dá. Vem depois
       das tabelas porque é o que elas decidem. */
    if(Object.keys(P.divisoes)[0] === div){
      const vg = painelVagasConmebol(e, pais, D);
      if(vg) esq.appendChild(vg);
    }

    const anual = D.anual && Object.keys(D.anual).length
      ? {rot:'Tabela anual',
         linhas: L.ordenar(D.anual, D.clubes).slice(0,6)
           .map((l,i)=>`${i+1}º ${nomeT(l.id)} · ${l.p} pts`)}
      : null;

    const sombra = sombraDe(e, T);
    if(sombra){
      /* liga do jogador: classificação à esquerda, jogos à direita —
         o mesmo desenho da tela brasileira. O mata-mata desce pro pé
         da coluna esquerda, porque a direita agora é a rodada. */
      if(T.mata.length || anual)
        esq.appendChild(chaveSimples('Mata-mata', T.mata, anual));
      duas.appendChild(esq);
      duas.appendChild(painelRodada(e, sombra));
    } else {
      duas.appendChild(esq);
      duas.appendChild(chaveSimples('Mata-mata', T.mata, anual));
    }
    pg.appendChild(duas);
  }

  /* uma tabela de liga estrangeira: só o que a classificação guarda */
  function tabelaLiga2(linhas, passam, meuClube){
    const t = el('table',{class:'liga'});
    t.innerHTML = `<thead><tr><th>#</th><th class="time">Clube</th>
      <th>P</th><th>J</th><th>V</th><th>E</th><th>D</th>
      <th>GP</th><th>GC</th><th>SG</th></tr></thead>`;
    const tb = el('tbody');
    linhas.forEach((l,i)=>{
      const cls = [];
      if(l.id === meuClube) cls.push('meu');
      if(passam && i < passam) cls.push('sobe');
      const tr = el('tr',{class:cls.join(' ')});
      const sg = l.gp - l.gc;
      tr.innerHTML = `<td class="pos">${i+1}</td>
        <td class="time">${chipClube(l.id, corT(l.id))}${nomeT(l.id)}</td>
        <td>${l.p}</td><td>${l.j}</td><td>${l.v}</td><td>${l.e}</td><td>${l.d}</td>
        <td>${l.gp}</td><td>${l.gc}</td><td>${sg>0?'+':''}${sg}</td>`;
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return t;
  }

  /* a chave de um torneio que guarda só o resultado */
  function chaveSimples(titulo, mata, extra){
    const q = quadro(titulo, el('span',{class:'conta',
      texto:`${(mata||[]).length} fases`}));
    if(!mata || !mata.length){
      q.corpo.innerHTML = '<div class="em-construcao">A chave abre quando '+
        'a fase regular terminar.</div>';
    }
    for(const m of (mata||[])){
      q.corpo.appendChild(el('div',{class:'fase-rot',
        texto:`${m.fase}${m.neutro?' · campo neutro':''}`}));
      for(const j of m.jogos){
        /* jogo guardado empatado com vencedor decidido saiu nos
           pênaltis: sem esta linha o placar 1 × 1 com um nome em
           negrito parece erro de conta */
        const nosPen = j.gc != null && j.gc === j.gf && j.venceu;
        q.corpo.appendChild(el('div',{class:'jogo-chave', html:
          `<span class="a ${j.venceu===j.c?'venceu':''}">${nomeT(j.c)}</span>
           <b>${j.gc!=null?`${j.gc} × ${j.gf}`:'—'}</b>
           <span class="b ${j.venceu===j.f?'venceu':''}">${nomeT(j.f)}</span>
           ${nosPen?'<em class="pen">nos pênaltis</em>':''}`}));
      }
    }
    if(extra){
      q.corpo.appendChild(el('div',{class:'fase-rot', texto:extra.rot}));
      for(const l of extra.linhas)
        q.corpo.appendChild(el('div',{class:'sub-chave', texto:l}));
    }
    return q;
  }

  /* =======================================================
     LIBERTADORES E SUL-AMERICANA
     ======================================================= */
  /* A CONMEBOL COM JOGOS NA TELA (pedido do dono, 24/08/2026): o
     mesmo painel de rodadas da Série A, montado sobre as fechas e o
     mata-mata guardados na edição — as fechas já jogadas com placar,
     as futuras com a chave do sorteio esperando a bola. */
  function compDaConmebol(c){
    const DIA = TO.conmebol.DIA;
    const rodadas = (c.fechas||[]).map(f=>({
      rot:`Fecha ${f.fecha}`, semana:f.semana,
      jogos:f.jogos.map(j=>({c:j.c, f:j.f, gc:j.gc, gf:j.gf, d:DIA, h:'21:30'}))}));
    /* as fechas que ainda vêm: a chave existe desde o sorteio */
    if(c.faseAtual === 'grupos' && (c.grupos||[]).length && c.calGrupos){
      for(let i = rodadas.length; i < c.calGrupos.length; i++){
        const jogos = [];
        c.grupos.forEach(g=>{
          for(const [a,b] of TO.ligas.jogosDaFecha(g, i, 2))
            jogos.push({c:a, f:b, d:DIA, h:'21:30'});
        });
        rodadas.push({rot:`Fecha ${i+1}`, semana:c.calGrupos[i], jogos});
      }
    }
    /* TUDO NUMA LINHA DO TEMPO SÓ: prévia, fechas e mata em ordem de
       semana — senão o navegador de rodadas abria na Fase 3 depois de
       seis fechas jogadas, porque o mata vem depois na lista */
    for(const m of (c.mata||[]))
      rodadas.push({rot:m.fase, semana:m.semana,
        jogos:m.jogos.map(j=>({c:j.c, f:j.f, gc:j.gc, gf:j.gf,
          venceu:j.venceu, d:DIA, h:'21:30'}))});
    rodadas.sort((a,b)=>(a.semana||0)-(b.semana||0));
    return {id:'cm-vista', nome:c.nome, dia:DIA, copa:true,
      grupos:c.grupos && c.grupos.length ? c.grupos : [[]],
      rodadas, mata:[]};
  }

  function pintarConmebolUm(e, pg, qual){
    const c = (e.conmebol||{})[qual];
    /* o histórico e o público existem mesmo antes de a edição montar */
    const nomeCM = c ? c.nome
      : (qual==='libertadores' ? 'Copa Libertadores' : 'Copa Sul-Americana');
    const vista = botoesDaCompeticao(pg);
    if(vista === 'publico'){
      pg.appendChild(painelPublico(e, (c&&c.clubes)||[], nomeCM)); return; }
    if(vista === 'historico'){
      const anosJogo = (c && c.campeao
        ? [{ano:(e.conmebol||{}).ano || e.data.ano,
            campeao:c.campeao, vice:c.vice}] : [])
        .concat((e.conmebolHistorico||[])
          .filter(h=>h[qual] && h[qual].campeao)
          .map(h=>({ano:h.ano, campeao:h[qual].campeao, vice:h[qual].vice})));
      pg.appendChild(painelHistoricoComp(e, qual, nomeCM, anosJogo)); return; }
    if(!c){ pg.appendChild(emConstrucao('Ainda não',
      'As copas da Conmebol montam na virada do ano.')); return; }
    const duas = el('div',{class:'comp-duas'});
    const esq = el('div');

    if(c.campeao){
      const q = quadro('Campeão');
      q.corpo.appendChild(el('div',{class:'campeao', estilo:{padding:'12px 14px'}, html:
        `${IC.get('trofeu')}<div><b>${nomeT(c.campeao)}</b>`+
        `<small>vice: ${nomeT(c.vice)}</small></div>`}));
      esq.appendChild(q);
    }
    /* UMA PÁGINA POR FASE (pedido do dono, 24/08/2026): as prévias
       (Fase 1, 2 e 3 na Libertadores), depois a classificação da fase
       de grupos, depois oitavas, quartas, semi e final — nas setas. */
    const cal = c.calGrupos || [];
    const inicioGrupos = cal.length ? cal[0] : null;
    const mata = c.mata || [];
    const antes  = mata.filter(m=>inicioGrupos!=null ? m.semana < inicioGrupos : true);
    const depois = mata.filter(m=>inicioGrupos!=null ? m.semana >= inicioGrupos : false);
    const paginas = [];
    for(const m of antes)
      paginas.push({rot:m.fase, semana:m.semana,
                    corpo:paginaFaseMata(e, m, nomeT)});
    const corpoG = el('div');
    if((c.grupos||[]).length){
      c.grupos.forEach((g, ig)=>{
        corpoG.appendChild(el('div',{class:'fase-rot',
          texto:`Grupo ${'ABCDEFGH'[ig]||ig+1}`,
          estilo:{padding:'8px 14px 3px'}}));
        const rolo = el('div',{class:'rolo'});
        rolo.appendChild(tabelaLiga2(TO.ligas.ordenar(c.tabela[ig], g),
          qual==='libertadores'?2:1, e.torcida.clubeId));
        corpoG.appendChild(rolo);
      });
    }else{
      /* edição recém-montada ainda não sorteou os grupos: em vez de
         uma página vazia, mostra quem ganhou a última */
      corpoG.appendChild(el('div',{class:'em-construcao',
        html:'Os grupos são sorteados depois das fases prévias.'}));
      const antEd = (e.conmebolHistorico||[])[0];
      if(antEd && antEd[qual] && antEd[qual].campeao)
        corpoG.appendChild(el('div',{class:'sub-chave',
          texto:`Campeão de ${antEd.ano}: ${nomeT(antEd[qual].campeao)}`}));
    }
    paginas.push({rot:'Fase de grupos',
      semana: inicioGrupos!=null ? inicioGrupos
            : (antes.length ? antes[antes.length-1].semana+1 : 1),
      corpo:corpoG});
    for(const m of depois)
      paginas.push({rot:m.fase, semana:m.semana,
                    corpo:paginaFaseMata(e, m, nomeT)});
    esq.appendChild(painelFases(paginas, faseCorrente(e, paginas)));
    duas.appendChild(esq);
    /* a direita é a rodada, como na Série A: fechas e mata-mata
       navegáveis, com placar no que já rolou */
    const dir = el('div');
    const vistaCM = compDaConmebol(c);
    if(vistaCM.rodadas.length || vistaCM.mata.length)
      dir.appendChild(painelRodada(e, vistaCM));
    const vagas = quadro('Vagas por país');
    const rolo = el('div',{class:'rolo', estilo:{padding:'8px 14px 12px'}});
    for(const [pais, n] of Object.entries(
        qual==='libertadores' ? TO.conmebol.VAGAS_LIB : TO.conmebol.VAGAS_SUL))
      rolo.appendChild(el('div',{class:'sub-chave', texto:`${pais}: ${n}`}));
    vagas.corpo.appendChild(rolo);
    dir.appendChild(vagas);
    duas.appendChild(dir);
    pg.appendChild(duas);
  }

  /* a copa nacional de um país de fora */
  function pintarCopaNacional(e, pg, copa){
    const vista = botoesDaCompeticao(pg);
    if(vista === 'publico'){
      pg.appendChild(painelPublico(e, copa.clubes, copa.nome)); return; }
    if(vista === 'historico'){
      /* os anos do jogo saem do arquivo da Conmebol, que guarda as
         copas nacionais junto (e o ano corrente, se já decidiu) */
      const anosJogo = (copa.campeao
        ? [{ano:(e.conmebol||{}).ano || e.data.ano,
            campeao:copa.campeao, vice:copa.vice}] : []);
      for(const h of (e.conmebolHistorico||[])){
        const cp = (h.copas||[]).find(x=>x.nome === copa.nome);
        if(cp && cp.campeao)
          anosJogo.push({ano:h.ano, campeao:cp.campeao, vice:cp.vice});
      }
      pg.appendChild(painelHistoricoComp(e, 'copa:'+copa.nome, copa.nome,
        anosJogo)); return; }
    const duas = el('div',{class:'comp-duas'});
    const esq = el('div');
    /* a copa do país do jogador é jogada de verdade, então ela mostra
       a chave à esquerda e a rodada à direita, como a Copa do Brasil */
    const sombra = copa.comJogos &&
      ((e.temporada||{}).competicoes||[]).find(c=>c.tipo === 'copa-de-fora'
        && (c.mata||[]).length);
    const q = quadro(copa.nome, el('span',{class:'conta',
      texto:`${copa.clubes.length} clubes de todas as divisões`}));
    if(copa.campeao)
      q.corpo.appendChild(el('div',{class:'campeao', estilo:{padding:'12px 14px'}, html:
        `${IC.get('trofeu')}<div><b>${nomeT(copa.campeao)}</b>`+
        `<small>vice: ${nomeT(copa.vice)}</small></div>`}));
    else q.corpo.appendChild(el('div',{class:'em-construcao',
      html:'A copa corre por dentro do ano, do 32-avos à final.'}));
    esq.appendChild(q);
    if(sombra){
      esq.appendChild(painelChave(e, sombra));
      duas.appendChild(esq);
      duas.appendChild(painelRodada(e, sombra));
    } else {
      duas.appendChild(esq);
      duas.appendChild(chaveSimples('Chave', copa.mata, null));
    }
    pg.appendChild(duas);
  }

  /* =======================================================
     A LNT NA TELA (pedido do dono, 22/08/2026)
     Uma divisão por vez: as chaves à esquerda, o mata-mata e o
     dinheiro à direita. Abre na divisão onde a gente está.
     ======================================================= */
  function pintarLNT(e, pg){
    const L = TO.lnt, ed = e.lnt.edicao;
    const nomeT = id => (TO.mundo.torcida(id)||{}).nome || '—';
    const corT  = id =>{
      const o = TO.mundo.torcida(id);
      return (o && TO.mundo.coresDaTorcida(o).cor) || '#888';
    };
    if(!ed){
      pg.appendChild(emConstrucao('LNT',
        'A liga foi fundada. A primeira edição começa na virada do semestre.'));
      return;
    }
    const minha = ed.divs.findIndex(d=>d.clubes.includes(e.torcida.id));
    if(divLNT === null) divLNT = minha >= 0 ? minha : 0;

    const filtros = el('div',{class:'filtros-linha'});
    ed.divs.forEach((d, k)=>{
      const b = el('button',{class:(k===divLNT?'on':'')+(k===minha?' minha':''),
        html:`${d.nome}<span class="conta">${d.clubes.length}</span>`});
      b.onclick = ()=>{ divLNT = k; redesenhar(); };
      filtros.appendChild(b);
    });
    pg.appendChild(filtros);

    const div = ed.divs[divLNT];
    const duas = el('div',{class:'comp-duas'});
    const esq = el('div');

    if(div.campeao){
      const c = quadro('Campeão');
      c.corpo.appendChild(el('div',{class:'campeao', estilo:{padding:'12px 14px'}, html:
        `${IC.get('trofeu')}<div><b>${nomeT(div.campeao)}</b>
         <small>vice: ${nomeT(div.vice)}</small></div>`}));
      esq.appendChild(c);
    }

    div.grupos.forEach((g, gi)=>{
      const q = quadro(`Chave ${'ABCDEFGHI'[gi]}`, el('span',{class:'conta',
        texto:`${(FORMATO_LNT()[divLNT].passam || 4) } passam`}));
      const rolo = el('div',{class:'rolo'});
      rolo.appendChild(tabelaLNT(e, div, gi, nomeT, corT));
      q.corpo.appendChild(rolo);
      esq.appendChild(q);
    });

    duas.appendChild(esq);
    duas.appendChild(chaveLNT(e, div, nomeT));
    pg.appendChild(duas);
  }
  const FORMATO_LNT = ()=> TO.lnt.FORMATO;

  function tabelaLNT(e, div, gi, nomeT, corT){
    const linhas = TO.lnt.tabelaDoGrupo(div, gi);
    const f = TO.lnt.FORMATO.find(x=>x.n === div.n);
    const meu = e.torcida.id;
    const t = el('table',{class:'liga'});
    /* FZ é ferido do rival, TM é ferido nosso: o saldo entre os dois é
       o primeiro desempate depois dos pontos (régua do dono) */
    t.innerHTML =
      `<thead><tr><th>#</th><th class="time">Torcida</th>
        <th>P</th><th>V</th><th>D</th>
        <th>FZ</th><th>TM</th><th>SF</th></tr></thead>`;
    const tb = el('tbody');
    linhas.forEach((l,i)=>{
      const cls = [];
      if(l.id===meu) cls.push('meu');
      if(f.passam && i < f.passam) cls.push('sobe');
      if(f.caem && i === linhas.length-1) cls.push('cai');
      const tr = el('tr',{class:cls.join(' ')});
      tr.innerHTML =
        `<td class="pos">${i+1}</td>
         <td class="time">${chipTorcida(l.id, corT(l.id))}${nomeT(l.id)}</td>
         <td>${l.p}</td><td>${l.v}</td><td>${l.d}</td>
         <td>${l.fez}</td><td>${l.tomou}</td><td>${l.sf>0?'+':''}${l.sf}</td>`;
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return t;
  }

  function chaveLNT(e, div, nomeT){
    const meu = e.torcida.id;
    const f = TO.lnt.FORMATO.find(x=>x.n === div.n);
    const q = quadro('Mata-mata', el('span',{class:'conta',
      texto:`${div.clubes.length} torcidas`}));
    if(!div.mata.length){
      q.corpo.innerHTML = '<div class="em-construcao">A chave abre quando '+
        'as cinco rodadas de grupo terminarem.</div>';
    }
    for(const m of div.mata){
      const meus = m.jogos.filter(j=>j.a===meu||j.b===meu);
      const mostra = meus.length ? meus : m.jogos.slice(0,4);
      q.corpo.appendChild(el('div',{class:'fase-rot',
        texto:`${m.fase}`+(m.espera && m.espera.length
              ? ` · ${m.espera.length} esperando nas oitavas` : '')+
              (meus.length?'':` · ${m.jogos.length} duelos`)}));
      for(const j of mostra){
        const feito = !!j.venceu;
        q.corpo.appendChild(el('div',{class:'jogo-chave'+
          (j.a===meu||j.b===meu?' meu':''), html:
          `<span class="a ${j.venceu===j.a?'venceu':''}">${nomeT(j.a)}</span>
           <b>${feito?`${j.fb||0} × ${j.fa||0}`:'—'}</b>
           <span class="b ${j.venceu===j.b?'venceu':''}">${nomeT(j.b)}</span>
           ${j.wo?'<em class="pen">W.O.</em>':''}`}));
      }
    }
    /* o dinheiro da divisão, na régua do dono */
    const pr = el('div',{class:'fase-rot', texto:'Prêmios da divisão'});
    q.corpo.appendChild(pr);
    const tab = [['Campeão', f.premio.campeao], ['Vice', f.premio.vice],
                 ['Semifinal', f.premio.semi], ['Quartas', f.premio.quartas],
                 ['Oitavas', f.premio.oitavas], ['16-avos', f.premio.dezesseis]];
    for(const [rot, v] of tab){
      if(!v) continue;
      q.corpo.appendChild(el('div',{class:'lnt-premio', html:
        `<span class="rot">${rot}</span><span class="v">${U.dinheiro(v)}</span>`}));
    }
    const nosso = div.premiados[meu];
    if(nosso) q.corpo.appendChild(el('div',{class:'lnt-premio nosso', html:
      `<span class="rot">Já embolsamos</span>`+
      `<span class="v">${U.dinheiro(nosso)}</span>`}));
    return q;
  }

  /* o painelHistorico global saiu (ordem do dono, 25/08/2026): o
     Histórico de cada competição supre melhor a necessidade */

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
          `${chipClube(j.adversario, corClube(j.adversario))}`+
          `${j.casa?'':'@ '}${nomeClube(j.adversario)}`}));
        cel.appendChild(el('span',{class:'sub',
          texto: j.jogado
            ? `${j.gp} × ${j.gc}`+(j.pen?` (${j.pen.c}×${j.pen.f} pên.)`:'')
            : `${j.comp} · ${j.neutro ? 'neutro' : j.casa?'casa':'fora'}`}));
      }else if(cv){
        classes.push('caravana');
        cel.appendChild(el('span',{class:'rot', html:
          `${IC.get('onibus')}Caravana`}));
        cel.appendChild(el('span',{class:'sub', texto:`${cv.rot} · ${cv.cidade}`}));
      }else{
        /* OS TRÊS TURNOS NO DIA (pedido do dono, 24/08/2026): a célula
           mostrava só o primeiro turno preenchido, e o calendário
           escondia dois terços do expediente. Agora manhã, tarde e
           noite aparecem, cada um na sua linha. */
        const exp = TO.acoes.expediente(e);
        for(const turno of ['manha','tarde','noite']){
          const a = exp[turno] && TO.acoes.porId(exp[turno]);
          if(a) cel.appendChild(el('span',{class:'acao',
            html:`${IC.get(a.icone)}<span>${a.nome}</span>`}));
        }
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
        const o = el('option',{value:a.id,
          texto:`${a.nome} — ${TO.acoes.efeitoDe(E(), a)}`});
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
    /* SÓ O PAÍS FILTRADO (pedido do dono, 24/08/2026): a lista seguia
       os 388 clubes dos dez países; agora acompanha o país escolhido
       na tela de Competições — sem filtro lá, vale o país do jogador. */
    const paisSel = paisComp || TO.competicoes.paisDe(meu || {}) || 'Brasil';
    const doPais = [...TO.mundo.todosTimes]
      .filter(t=>TO.competicoes.paisDe(t) === paisSel)
      .sort((a,b)=>a.nome<b.nome?-1:1);
    if(meu && !doPais.some(t=>t.id === meu.id)) doPais.unshift(meu);
    if(!doPais.some(t=>t.id === agendaClube))
      agendaClube = (meu && meu.id) || (doPais[0] && doPais[0].id);
    for(const t of doPais){
      const o = el('option',{value:t.id,
        texto: t.id===(meu&&meu.id) ? `${t.nome} (seu time)` : t.nome});
      if(t.id===agendaClube) o.selected = true;
      sel.appendChild(o);
    }
    sel.onchange = ()=>{ agendaClube = sel.value; agendaFiltro='todas'; redesenhar(); };
    col.appendChild(sel);
    escolha.appendChild(col);
    escolha.appendChild(el('div',{class:'quem', html:
      `${chipClube(clube.id, corClube(clube.id))}
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
         <td><span class="adv">${chipClube(j.adversario, corClube(j.adversario))}
           ${nomeClube(j.adversario)}</span></td>
         <td class="placar">${j.jogado ? `${j.gp} × ${j.gc}` : '—'}`+
        `${j.pen ? `<small class="pen">${j.pen.c} × ${j.pen.f} nos pênaltis</small>` : ''}</td>`;
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

  /* =======================================================
     A TELA DOS EIXOS (pedido do dono, 11/09/2026)
     Diplomacia → Eixos: em cima, o que mudou no mundo das alianças —
     quem entrou onde e que eixo nasceu, com o que é novidade em
     destaque —, e embaixo cada eixo com a lista inteira de membros. O
     nome do eixo é link pro perfil dele.
     ======================================================= */
  /* =======================================================
     A NOSSA MESA NOS EIXOS (pedido do dono, 11/09/2026)
     Em UM eixo só, a torcida pode sentar a própria mesa: fundar um
     eixo — nome escolhido por nós e os fundadores que a gente chamar —
     ou bater na porta de um eixo que já existe. E todo eixo nosso pode
     chamar um nome a cada 15 dias. As telas são três modais; quem diz
     o que pode e o que não pode é `TO.eixos`.
     ======================================================= */
  const pctChance = c => `${Math.round(c*100)}%`;
  const classeChance = c => c >= .6 ? 'boa' : c >= .35 ? 'meia' : 'magra';

  /* a lista de torcidas de um modal: chip, nome, praça, relação e chance */
  function linhaCandidata(c, marcada, aoClicar){
    const b = el('button',{class:'eixo-cand'+(marcada?' on':'')+(c.ok===false?' off':'')});
    b.disabled = c.ok === false || !aoClicar;
    b.innerHTML =
      `<span class="qm">${chipTorcida(c.id, (TO.mundo.coresDaTorcida(TO.mundo.torcida(c.id))||{}).cor || '#888')}`+
      `<b>${c.nome}</b><small>${(TO.financeiro.nomeCidade && TO.financeiro.nomeCidade(c.mapa)) || c.mapa||''}`+
      `${c.eixos ? ` · ${c.eixos} eixo${c.eixos>1?'s':''}` : ''}</small></span>`+
      (c.ok === false
        ? `<span class="nao">${c.motivo||'não dá'}</span>`
        : `<span class="ch ${classeChance(c.chance)}">${pctChance(c.chance)}<small>topa</small></span>`);
    if(aoClicar) b.onclick = ()=>aoClicar(c);
    return b;
  }

  /* ---- fundar o nosso eixo ---- */
  function abrirFundarEixo(){
    const e = E(), X = TO.eixos;
    const cx = el('div',{class:'eixo-mesa'});
    const escolhidos = new Set();
    let nome = '', sigla = '';
    const sugestoes = X.nomesLivres(e, 6);

    const cabecalho = el('div');
    cx.appendChild(cabecalho);
    const lista = el('div',{class:'eixo-cands'});
    const aviso1 = el('div',{class:'eixo-nota'});
    cx.append(lista, aviso1);

    const possiveis = X.fundadoresPossiveis(e);
    const pintar = ()=>{
      cabecalho.innerHTML = '';
      cabecalho.appendChild(el('p',{class:'fraco', texto:
        `Um eixo nasce com ${X.MIN_FUNDADORES} torcidas. A gente escolhe o nome e chama `+
        `as aliadas; cada uma responde na hora. Vale uma mesa por trimestre, dando certo ou não.`}));
      const campo = el('div',{class:'eixo-nome'});
      const iN = el('input',{class:'busca'}); iN.placeholder = 'Nome do eixo'; iN.value = nome;
      iN.oninput = ()=>{ nome = iN.value; if(!sigla) iS.value = auto(); atualizar(); };
      const iS = el('input',{class:'busca sigla'}); iS.placeholder = 'sigla'; iS.maxLength = 5; iS.value = sigla;
      iS.oninput = ()=>{ sigla = iS.value.toUpperCase(); iS.value = sigla; };
      const auto = ()=> nome.trim().split(/\s+/).filter(p=>p.length>2)
        .map(p=>p[0]).join('').toUpperCase().slice(0,4);
      campo.append(iN, iS);
      cabecalho.appendChild(campo);
      if(sugestoes.length){
        const sg = el('div',{class:'eixo-sugestoes'});
        sg.appendChild(el('span',{class:'rot', texto:'Nomes que a rua ainda não usou'}));
        for(const n of sugestoes){
          const b = el('button',{class:'sem-chip', html:`<span>${n.nome}</span><small>${n.sigla||''}</small>`});
          b.onclick = ()=>{ nome = n.nome; sigla = n.sigla || ''; pintar(); };
          sg.appendChild(b);
        }
        cabecalho.appendChild(sg);
      }
    };
    const atualizar = ()=>{
      const ids = [...escolhidos];
      const nm = X.nomeServe(e, nome);
      const briga = X.brigaNoGrupo(e, ids);
      const falta = Math.max(0, (X.MIN_FUNDADORES - 1) - ids.length);
      aviso1.className = 'eixo-nota' + (nm.ok && !briga && !falta ? ' pronta' : '');
      aviso1.textContent = !nm.ok ? nm.motivo
        : briga ? briga
        : falta ? `Falta${falta>1?'m':''} ${falta} pra fechar a mesa`
        : `${ids.length + 1} na mesa — chance de fechar: `+
          pctChance(ids.reduce((p,id)=>p * (possiveis.find(x=>x.id===id)||{chance:0}).chance, 1));
      btFundar.disabled = !nm.ok || !!briga || !!falta;
    };
    const pintarLista = ()=>{
      lista.innerHTML = '';
      if(!possiveis.length)
        lista.appendChild(el('div',{class:'em-construcao', texto:
          'Nenhuma aliada cabe numa mesa dessas agora: é preciso relação de aliada e lugar em mais um eixo.'}));
      for(const c of possiveis)
        lista.appendChild(linhaCandidata(c, escolhidos.has(c.id), ()=>{
          escolhidos.has(c.id) ? escolhidos.delete(c.id) : escolhidos.add(c.id);
          pintarLista(); atualizar();
        }));
    };
    const btFundar = el('button',{class:'bt destaque', texto:'Fundar o eixo'});
    pintar(); pintarLista(); atualizar();

    const fechar = modal('Fundar um eixo',
      `a gente cabe em mais ${X.MAX_POR_TORCIDA - X.eixosNossos(e).length}`, cx, [], 'media');
    /* o botão de ação vai pro rodapé do modal, junto do Fechar */
    const rod = cx.closest('.moldura').querySelector('footer');
    /* o destaque é a AÇÃO, não o Fechar: o rodapé do modal dá o vermelho
       ao Fechar por padrão, e aqui quem manda é fundar */
    for(const b of rod.querySelectorAll('button')) b.classList.remove('destaque');
    rod.insertBefore(btFundar, rod.firstChild);
    btFundar.onclick = ()=>{
      const r = X.fundarNosso(e, nome, sigla, [...escolhidos]);
      TO.estado.salvar();
      fechar();
      if(!r.ok && !r.dentro) return aviso(r.motivo, 'ruim');
      if(!r.nasceu){
        const nomes = (r.fora||[]).map(id=>(TO.mundo.torcida(id)||{}).nome).join(', ');
        aviso(`A mesa não fechou: ${r.motivo}.${nomes ? ` Fora: ${nomes}.` : ''}`, 'ruim');
      } else {
        aviso(`Nasceu o ${r.eixo.nome}, com a gente e `+
              r.dentro.map(id=>(TO.mundo.torcida(id)||{}).nome).join(', ')+'.', 'boa');
      }
      redesenhar();
    };
  }

  /* ---- bater na porta de um eixo ---- */
  function abrirCandidatura(){
    const e = E(), X = TO.eixos;
    const cx = el('div',{class:'eixo-mesa'});
    cx.appendChild(el('p',{class:'fraco', texto:
      'Dá pra bater na porta de qualquer eixo que não tenha rival nosso dentro. '+
      'Quem abre é eles: a chance é o quanto a turma de lá anda com a gente. '+
      'Vale uma mesa por trimestre, e porta fechada só volta a ouvir em meio ano.'}));
    const lista = el('div',{class:'eixo-cands'});
    cx.appendChild(lista);
    const linhas = X.eixosPraCandidatar(e);
    for(const c of linhas){
      const b = el('button',{class:'eixo-cand'+(c.ok?'':' off')});
      b.disabled = !c.ok;
      b.innerHTML = `<span class="qm"><b>${c.nome}</b><small>${c.membros} torcidas</small></span>`+
        (c.ok ? `<span class="ch ${classeChance(c.chance)}">${pctChance(c.chance)}<small>abrem</small></span>`
              : `<span class="nao">${c.motivo||'não dá'}</span>`);
      b.onclick = ()=>{
        const r = X.candidatar(e, c.id);
        TO.estado.salvar();
        fechar();
        if(!r.ok) return aviso(r.motivo, 'ruim');
        if(!r.aceito) return aviso(`O ${c.nome} ouviu e disse não. Só voltam a ouvir em meio ano.`, 'ruim');
        const nm = id => (TO.mundo.torcida(id)||{}).nome || id;
        aviso(`A gente entrou pro ${c.nome}. `+
          (r.novasAliadas.length ? `Novas aliadas: ${r.novasAliadas.map(nm).join(', ')}. ` : '')+
          (r.novosRivais.length ? `Novos rivais: ${r.novosRivais.map(nm).join(', ')}.` : ''), 'boa');
        redesenhar();
      };
      lista.appendChild(b);
    }
    if(!linhas.length)
      lista.appendChild(el('div',{class:'em-construcao', texto:'Nenhum eixo pra bater na porta agora.'}));
    const fechar = modal('Pedir entrada num eixo', 'uma mesa por trimestre', cx, [], 'media');
  }

  /* ---- chamar um nome pro nosso eixo ---- */
  function abrirConviteEixo(eixoId){
    const e = E(), X = TO.eixos, x = X.eixo(e, eixoId);
    const cx = el('div',{class:'eixo-mesa'});
    cx.appendChild(el('p',{class:'fraco', texto:
      `O ${x.nome} chama um nome a cada ${X.CONVITE_CADA_DIAS} dias. Quem entra vira aliada `+
      `de todo o eixo — e rival dos maiores rivais dele.`}));
    const lista = el('div',{class:'eixo-cands'});
    cx.appendChild(lista);
    for(const c of X.convidaveis(e, eixoId).slice(0, 40))
      lista.appendChild(linhaCandidata(c, false, c.ok ? ()=>{
        const r = X.convidar(e, eixoId, c.id);
        TO.estado.salvar();
        fechar();
        if(!r.ok) return aviso(r.motivo, 'ruim');
        if(!r.aceito) return aviso(`A ${c.nome} agradeceu e ficou de fora. Volta a ouvir em meio ano.`, 'ruim');
        const nm = id => (TO.mundo.torcida(id)||{}).nome || id;
        aviso(`A ${c.nome} está dentro do ${x.nome}. `+
          (r.novosRivais.length ? `Virou rival de ${r.novosRivais.map(nm).join(', ')}.` : ''), 'boa');
        redesenhar();
      } : null));
    const fechar = modal(`Chamar um nome · ${x.nome}`,
      `${x.membros.length} torcidas`, cx, [], 'media');
  }

  function painelEixos(e){
    const cx = el('div');
    const X = TO.eixos;
    if(!X){ cx.appendChild(emConstrucao('Sem eixos','Comece um jogo novo.')); return cx; }
    const nomeT = id => (TO.mundo.torcida(id)||{}).nome || id;
    const corT  = id => { const o = TO.mundo.torcida(id);
                          return (o && TO.mundo.coresDaTorcida(o).cor) || '#888'; };
    const nomeCid = c => (TO.financeiro.nomeCidade && TO.financeiro.nomeCidade(c)) || c;

    /* ---- a nossa mesa (dono, 11/09/2026) ---- */
    const nossos = X.eixosNossos(e), cabe = X.cabemosEmMais(e);
    const espera = X.esperaDaMesa(e);
    const cM = cartao('A nossa mesa',
      nossos.length ? nossos.map(x=>x.nome).join(' · ') : 'sem eixo nenhum');
    cM.classList.add('eixo-mesa-card');
    cM.corpo.appendChild(el('p',{class:'fraco', html: cabe
      ? `A gente está em ${nossos.length} de ${X.MAX_POR_TORCIDA} eixos — cabe em mais um. `+
        `Dá pra fundar um eixo nosso, com nome e fundadores escolhidos por nós, `+
        `ou bater na porta de um eixo que não tenha rival nosso dentro.`
      : `A gente está nos dois eixos que cabem. Pra entrar em outro, teria que sair de um.`}));
    if(cabe){
      const bF = el('button',{class:'bt destaque', texto:'Fundar um eixo'});
      const bC = el('button',{class:'bt', texto:'Pedir entrada num eixo'});
      bF.disabled = bC.disabled = !!espera;
      bF.onclick = abrirFundarEixo; bC.onclick = abrirCandidatura;
      if(espera){
        const t = `a mesa só senta de novo em ${espera} semana${espera>1?'s':''}`;
        bF.title = bC.title = t;
        cM.corpo.appendChild(el('div',{class:'eixo-nota', texto: t[0].toUpperCase()+t.slice(1)}));
      }
      cM.rodape(bF, bC);
    }
    cx.appendChild(cM);

    /* ---- as novidades ---- */
    const nov = X.novidades(e, 30);
    const novas = nov.filter(n=>n.nova).length;
    const cN = cartao('Novidades das alianças',
      novas ? `${novas} nova${novas>1?'s':''}` : 'nada novo desde a última visita');
    if(!nov.length)
      cN.corpo.innerHTML = '<div class="em-construcao">Nada se mexeu ainda.</div>';
    for(const n of nov){
      const quando = `${n.ano} · s${n.semana}`;
      const txt = n.tipo === 'fundou'
        ? `Nasceu o <b>${linkEixo(n.eixo, n.nomeEixo)}</b>, com `+
          (n.membros||[]).map(m=>linkTorcida(m, nomeT(m))).join(', ')
        : `${linkTorcida(n.torcida, nomeT(n.torcida))} entrou `+
          `${n.nosso ? 'pro nosso' : 'pro'} <b>${linkEixo(n.eixo, n.nomeEixo)}</b>`;
      cN.corpo.appendChild(el('div',{class:'nov-eixo'+(n.nova?' nova':'')+(n.nosso?' nosso':''), html:
        `<span class="data">${quando}</span><span class="txt">${txt}</span>`+
        (n.nova ? '<span class="tag">novo</span>' : '')}));
    }
    cx.appendChild(cN);

    /* ---- cada eixo, com os membros ---- */
    const ordem = X.lista(e).slice().sort((a,b)=>
      (b.membros.includes(e.torcida.id)?1:0) - (a.membros.includes(e.torcida.id)?1:0) ||
      b.membros.length - a.membros.length);
    const grade = el('div',{class:'eixos-grade'});
    for(const x of ordem){
      const r = X.resumo(e, x.id) || {membros:[], pracas:[], forca:0, rivais:[]};
      const c = cartao(linkEixo(x.id, x.nome) + (r.nosso ? ' <span class="tag">a gente</span>' : ''),
        `${x.membros.length} torcidas · ${U.numero(Math.round(r.forca))} membros`);
      c.classList.add('eixo-card');
      if(r.nosso) c.classList.add('nosso');
      c.corpo.appendChild(el('div',{class:'eixo-praças fraco', html:
        `${x.sigla ? `<b>${x.sigla}</b> · ` : ''}${x.base ? 'de nascença' : `fundado em ${x.fundado.ano}`}`+
        ` · ${r.pracas.length} praça${r.pracas.length>1?'s':''}`}));
      const lista = el('div',{class:'eixo-membros'});
      for(const o of r.membros){
        const nossa = o.id === e.torcida.id;
        lista.appendChild(el('span',{class:'eixo-membro'+(nossa?' nossa':''), html:
          `${chipTorcida(o.id, corT(o.id))}${linkTorcida(o.id, o.nome)}`+
          `<small>${nomeCid(o.mapa)}</small>`}));
      }
      c.corpo.appendChild(lista);
      if(r.rivais.length)
        c.corpo.appendChild(el('div',{class:'eixo-rivais', html:
          `<span class="rot">Maiores rivais do eixo</span>`+
          r.rivais.slice(0, 14).map(id=>linkTorcida(id, nomeT(id))).join(', ')+
          (r.rivais.length > 14 ? ` <small class="fraco">e mais ${r.rivais.length-14}</small>` : '')}));
      if(r.nosso){
        const dias = X.esperaDoConvite(e, x.id);
        const b = el('button',{class:'bt', texto:'Chamar um nome'});
        b.disabled = !!dias;
        if(dias) b.title = `o eixo já chamou alguém: o próximo nome sai em ${dias} dia${dias>1?'s':''}`;
        b.onclick = ()=>abrirConviteEixo(x.id);
        c.rodape(b);
      }
      grade.appendChild(c);
    }
    cx.appendChild(grade);
    /* abriu, leu: o contador zera no próximo repinte */
    X.marcarVistas(e);
    return cx;
  }

  function pintarDiplomacia(){
    const e = E(), pg = U.$('.pagina[data-pag="diplomacia"]');
    pg.innerHTML='';
    pg.appendChild(el('div',{class:'titulo-pagina', texto:'Diplomacia'}));
    const novas = TO.eixos ? TO.eixos.naoVistasNossas(e) : 0;
    pg.appendChild(subabas([
      {id:'relacoes',    rot:'Relações'},
      {id:'eixos',       rot:'Eixos' + (novas ? ` (${novas})` : '')},
      {id:'aliancas',    rot:'Alianças'},
      {id:'rivalidades', rot:'Rivalidades'},
      {id:'ideologia',   rot:'Ideologia'}
    ], subDip, id=>{subDip=id; redesenhar();}));

    /* a ideologia mora aqui: é o padrão de como tratamos os outros */
    if(subDip === 'ideologia'){ pg.appendChild(caixaDeIdeologia(e)); return; }
    /* os eixos de aliança têm tela própria (dono, 11/09/2026) */
    if(subDip === 'eixos'){ pg.appendChild(painelEixos(e)); return; }

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
        `<td>${linkTorcida(l.id, l.o.nome)}</td>
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
        e.relacoes[l.id] = U.limitar(l.valor + TO.relacoes.REL.aproximar,
                                     -100, 100);
        aviso(`Aproximação com ${l.o.nome}.`,'boa'); redesenhar();
      });
      botao('−', 'Provocar', est.podePiorar, ()=>{
        e.relacoes[l.id] = U.limitar(l.valor - TO.relacoes.REL.provocar,
                                     -100, 100);
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
          if(r.ok && r.cena){
            fecharPainel();
            /* a marca entra DEPOIS do fecharPainel, que a limpa */
            comEscolhaDeBriga(sim=>{
              simularProxima = sim; abrirAcaoEmCena(r.cena);
            });
          }
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
  const MS_DROP      = TO.feed.INTERVALO_DROP;   // 1500 ms antes de uma DECISÃO
  /* O TEMPO ANDA MAIS (pedido do dono, 08/09/2026):
     · informação sai em rajada — 500 ms entre notícias que não pedem
       resposta; só a decisão merece o compasso de 1,5 s;
     · dia calado passa em 120 ms (era 450);
     · e o 2× vale em tudo: dia vazio, mensagem e as paradas da linha
       do dia (ver `itnAgenda`), não só o intervalo das mensagens. */
  const MS_INFO      = 500;
  const MS_DIA_VAZIO = 120;
  let relogioTempo = null;
  /* o compasso da PRÓXIMA mensagem da fila: decisão espera 1,5 s */
  const compassoDaFila = e => {
    const prox = (e.feedFila || [])[0];
    return prox && prox.peso === 'decisao' ? MS_DROP : MS_INFO;
  };

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
        relogioTempo = setTimeout(tique, compassoDaFila(e)/vel);
        return;
      }
      passarUmDia(e);
      pintarTopo(); atualizarFeed();
      /* a virada do ano abre a retrospectiva e segura o relógio */
      if(abrirRetrospectivaSePendente()) return;
      if(pausasT.size || TO.feed.travado(E())) return;
      relogioTempo = setTimeout(tique,
        (TO.feed.pendentes(E()) > 0 ? compassoDaFila(E()) : MS_DIA_VAZIO)/vel);
    };
    /* O PRIMEIRO TIQUE TAMBÉM É DE 1,5s quando há fila (correção do
       dono, 24/08/2026): o relógio abria em 450ms — o passo do dia
       calado — e a mensagem que já estava na fila caía quase colada na
       anterior. Fila cheia entra no compasso da mensagem; só o dia sem
       nada passa ligeiro. */
    relogioTempo = setTimeout(tique,
      (TO.feed.pendentes(e0) > 0 ? compassoDaFila(e0) : MS_DIA_VAZIO)
        / (TO.diaJogo.ponte.velocidade || 1));
  }

  /* um dia inteiro: a virada da data — os jogos do dia e as mensagens
     saem de dentro do estado */
  /* O RELÓGIO NÃO MORRE COM O DIA (correção do dono, 11/09/2026): o
     tique era uma corrente de `setTimeout` — o dia que estourasse
     levava a corrente junto, e o jogo parava de vez, sem nada pra
     responder. O erro agora fica no console e o dia seguinte é
     agendado do mesmo jeito. */
  function passarUmDia(e){
    if(document.body.classList.contains('em-cena')) return null;
    try{ TO.estado.avancarDia(); }
    catch(err){ if(window.console) console.error('[dia] avancarDia falhou:', err); }
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
    /* TRETA É COISA DE LINHA DE FRENTE (régua do dono, 22/08/2026):
       briga combinada de efetivo igual não é lugar de novato. Escala
       primeiro quem tem os galões; faltando gente apta, IMPROVISA UM
       COMPONENTE — e só depois disso é que o resto entra, pra cena
       nunca ficar sem bonde. Dentro de cada faixa manda a ficha. */
    const ORDEM_TRETA = {frente:0, componente:1, diretoria:2, novato:3};
    const aptos = TO.membros.aptosParaOEstadio(e)
      .sort((a,b)=>
        ((ORDEM_TRETA[a.cargo] ?? 9) - (ORDEM_TRETA[b.cargo] ?? 9)) ||
        ((b.forca+b.defesa) - (a.forca+a.defesa)));
    const n = Math.max(2, Math.min(d.tam || 5, aptos.length));
    const cN = TO.mundo.coresDaTorcida(e.torcida);
    const cR = TO.mundo.coresDaTorcida(rival);
    /* cada tamanho tem palco próprio (fotos do dono, 19/08/2026):
       5x5 no beco, 7x7 no pátio do galpão, 10x10 no campo de terra */
    const local = n <= 5 ? 'treta-beco'
                : n <= 7 ? 'treta-galpao' : 'treta-campo';
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
    abrirPalco({
      canvas: $('djPrincipal'),
      /* treta marcada é mano a mano: sem pedra, sem bomba, sem braço
         automático — de lado nenhum (decisão do dono) */
      config: { escalacao: aptos.slice(0, n), intencao:'atacar', bombas:0,
                semArmas:true, bondes, efetivoRival:n, local },
      aoTerminar: res => fecharDiaDeJogo(res, null,
        {acao:'treta', alvo:{torcidaId:d.rival, nome:rival.nome||'Rival',
                             bairro:d.bairro, cena:local, n,
                             aposta: d.aposta || 0,
                             /* na LNT a treta é a competição: sem aposta,
                                que o dinheiro ali é prêmio de fase */
                             lnt: d.lnt || null}})
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
      e.relacoes[d.aliado] = U.limitar(
        (e.relacoes[d.aliado]||0) + TO.relacoes.REL.descerPeloAliado, -100, 100);
      TO.relacoes.marcarAjuda(e, d.aliado);
    }
    const cN = TO.mundo.coresDaTorcida(e.torcida);
    const cR = TO.mundo.coresDaTorcida(rival);
    const cA = TO.mundo.coresDaTorcida(aliado);
    const deles = Math.max(4, Math.round((((TO.relacoes.mundo(e)||{})[d.rival]
      || rival).membros || 30) * 0.5));
    /* DOIS BONDES DO NOSSO LADO (régua do dono, 28/08/2026): os nossos
       10 destacados com a nossa cor, e o bonde do aliado com a cor
       DELE — o jogador comanda os dois, mas ficha de membro só os
       nossos têm; o aliado desce com a ficha gerada do perfil dele. */
    const enc = {
      a:{torcida:e.torcida.id, nome:e.torcida.nome,
         sigla:e.torcida.sigla, n:(d.escolta||6),
         cor:cN.cor, cor2:cN.cor2, cor3:cN.cor3, nossa:true},
      b:{torcida:d.rival, nome:rival.nome||'Rival',
         sigla:TO.mundo.siglaTorcida(rival)||'RIV', n:deles,
         cor:cR.cor, cor2:cR.cor2, cor3:cR.cor3, nossa:false},
      junto:{torcida:d.aliado, nome:aliado.nome||'Aliado',
         sigla:TO.mundo.siglaTorcida(aliado)||'ALI', n:(d.aliados||10),
         cor:cA.cor, cor2:cA.cor2, cor3:cA.cor3},
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
  /* qual estádio a cena dos arredores abre (fotos do dono, 19/08/2026):
     pela capacidade do estádio do MANDANTE do nosso jogo — até 15 mil o
     pequeno, até 32 mil o médio, acima disso o grandão */
  function cenaDoEstadio(e){
    const pj = e.proximoJogo || {};
    let cap = pj.capacidade;
    if(cap == null){
      const t = (TO.dados.times || []).find(x => x.estadio === pj.estadio);
      cap = t && t.capacidade;
    }
    return !cap ? 'estadio-20'
         : cap <= 15000 ? 'estadio-10'
         : cap <= 32000 ? 'estadio-20' : 'estadio-40';
  }

  const perfilDe = id => {
    const o = id ? TO.mundo.torcida(id) : null;
    if(!o) return null;
    const viva = (TO.relacoes && TO.relacoes.mundo(E())[id]) || {};
    return {poder:o.poder, cargos:o.cargos,
            membros: viva.membros || o.membros || 60,
            /* a moral viva do mundo: a ficha gerada deles nasce da mesma
               régua que a nossa (indicador ±3), não de um 12 fixo */
            moral: viva.moral,
            /* o Financeiro delas chega na cena (decisão do dono,
               18/08/2026): professor de MMA melhora a ficha e o paiol
               de bombas limita o que elas jogam */
            mma: TO.relacoes.mmaDe(viva), bombas: viva.bombas,
            /* e o QUADRO VIVO: quem treinou e promovou no mundo chega
               na cena com a ficha que ganhou (régua do dono, 20/08) */
            quadro: TO.relacoes.quadroDe(E(), id)};
  };

  const LOCAL_ROT = {rua:'na rua', 'rua-media':'numa rua de classe média',
                     'rua-nobre':'numa rua de bairro nobre',
                     praca:'na praça', arredores:'nos arredores do estádio'};
  let encontroAberto = null;

  /* =======================================================
     FERIDO NÃO VOLTA PRA BRIGA (régua do dono, 24/08/2026)
     Cena aberta PELA LINHA DO DIA abre com o efetivo descontado:
     o nosso é o que sobrou na caravana (ITN.nos, que já perde as
     baixas parada a parada), e o deles desconta o que AQUELA
     torcida perdeu neste itinerário (ITN.gasto). Fora do
     itinerário nada muda — o desconto de lá é dos membros
     feridos e dos lotes de baixas da IA, como sempre foi.
     ======================================================= */
  const doItinerario = () => !!(ITN && ITN.esperando);
  const descontoItn = (tid, n) =>
    doItinerario() && tid && ITN.resta && ITN.resta[tid] !== undefined
      ? Math.max(2, Math.min(n, ITN.resta[tid])) : n;
  /* o nosso corte é o mesmo dos outros, com a caravana viva de teto */
  const tetoNossoItn = n =>
    doItinerario()
      ? Math.max(2, Math.min(descontoItn(E().torcida.id, n),
                             (ITN.nos || 0) + itnEscoltaAtiva()))
      : n;

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
    /* na linha do dia, os dois lados chegam já descontados — e o
       registro da briga (enc) conta os números que a cena abriu */
    nosso.n = tetoNossoItn(Math.round(nosso.n));
    deles.n = descontoItn(deles.torcida, Math.round(deles.n));
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
    /* o bonde do aliado escoltado desce JUNTO e na mão do jogador
       (régua do dono, 28/08/2026): cor e ficha dele, comando nosso */
    if(enc.junto) bondes.push(
      {lado:nossoLado, n:Math.max(1, Math.round(enc.junto.n)),
       cor:enc.junto.cor, cor2:enc.junto.cor2, cor3:enc.junto.cor3,
       sigla:enc.junto.sigla, nome:enc.junto.nome, nossa:false,
       controlado:true, perfil: perfilDe(enc.junto.torcida)});
    encontroAberto = enc;
    $('telaDiaJogo').classList.remove('oculto');
    document.body.classList.add('em-cena');
    TO.estado.bloquear(true);
    pararTudo('cena');
    const p = TO.planejamento.plano(e);
    /* A GUERRA CONTINUA NOS ARREDORES, do lado de fora: cordão, PM e
       o portão pra entrar. As cenas `estadio-*` viraram a
       ARQUIBANCADA (setores do dono, 19/08/2026) e só abrem quando o
       clima da partida fica tenso. */
    abrirPalco({
      canvas: $('djPrincipal'),
      config: { escalacao: aptos, intencao:'atacar', bombas: p.bombas,
                bondes, efetivoRival: deles.n, local: enc.local,
                /* a faixa: quem é atacado expõe — sofremos, é a nossa */
                faixaDefensor: enc.sofrido ? 'nos' : 'eles', rivalId: deles.torcida },
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

  /* =======================================================
     O PALCO, JOGADO OU SIMULADO (pedido do dono, 23/08/2026)

     Toda cena de briga passava direto pra `ponte.montar`. Agora passa
     por aqui, e quem decide é o botão que o jogador apertou: descer
     abre a cena, Simular roda o motor de duelo entre duas IAs e devolve
     o mesmo `res`. Depois disso o caminho é um só — `fecharDiaDeJogo` —,
     que é o que garante a promessa do dono: a consequência não sabe se
     a briga foi jogada ou simulada.
     ======================================================= */
  let simularProxima = false;

  /* A ESCOLHA FORA DO FEED (pedido do dono, 23/08/2026): no feed o
     Simular é um botão ao lado da decisão, mas a briga também nasce do
     painel de Ações e da Diplomacia, onde não há mensagem pra pendurar
     botão. Nesses dois a pergunta vira este cartão — e ela é só sobre
     COMO brigar: a ação já foi executada e o custo já saiu. */
  function comEscolhaDeBriga(fn){
    const corpo = el('div');
    corpo.appendChild(el('div',{class:'em-construcao', texto:
      'Descer abre a cena e você comanda o bonde. Simular roda o duelo '+
      'na hora — as consequências são as mesmas.'}));
    const bs = el('div',{class:'msg-bts'});
    let fechar = null;
    const opcao = (rot, classe, simular)=>{
      const bt = el('button',{class:'bt '+classe, html:`<span>${rot}</span>`});
      bt.onclick = ()=>{ if(fechar) fechar(); fn(simular); };
      bs.appendChild(bt);
    };
    opcao('Descer pra briga', 'destaque', false);
    opcao('Simular', 'simular', true);
    corpo.appendChild(bs);
    fechar = modal('Como vai ser', 'a briga é a mesma; o comando é que muda',
                   corpo);
    return fechar;
  }


  function abrirPalco(op){
    if(!simularProxima) { montarCena(op); return; }
    simularProxima = false;
    TO.diaJogo.simular.rodar(op);
  }

  /* =======================================================
     O PALCO: DE CIMA OU DE PERTO
     Um canvas não troca de contexto, então o 2D e o WebGL são dois
     elementos no mesmo palco. Na cena de cima o canvas WebGL vira a
     camada transparente dos bonecos por cima do 2D (bonecos3.js). Só
     a rua tem versão de perto, e ela abre pela cena `*-3d` de
     dados/cenas.js quando a opção briga3d está ligada.
     ======================================================= */
  function montarCena(m){
    const o = opc(E());
    const local = String((m.config||{}).local || '');
    const em3d = !!o.briga3d && /^rua(-media|-nobre)?$/.test(local)
              && !!(TO.dados.cenas && TO.dados.cenas[local+'-3d']) && !!TO.diaJogo.tres;
    const c2 = $('djPrincipal'), c3 = $('djPrincipal3d'), sobre = $('djSobre');
    if(c3) c3.hidden = !em3d;
    if(sobre) sobre.hidden = !em3d;
    if(c2) c2.hidden = em3d;
    if(em3d){
      m.config.local = local + '-3d';
      m.canvas = c3; m.sobre = sobre;
    } else {
      m.canvas = c2;
      m.sobreGL = c3; m.bonecos = o.bonecos !== false;
    }
    TO.diaJogo.ponte.montar(m);
    /* sem WebGL a ponte volta pra cena 2D sozinha, no mesmo canvas; só
       a camada de nomes não tem mais o que mostrar */
    if(em3d && !TO.diaJogo.ponte.tres && sobre) sobre.hidden = true;
  }

  /* o resultado da última cena: o itinerário escreve o saldo dela no
     cartão da parada que a abriu */
  let ultimoResultado = null;

  function fecharDiaDeJogo(res, enc, acao){
    ultimoResultado = res;
    TO.estado.bloquear(false);
    /* bomba jogada é bomba que não volta pro estoque (GDD §9.1) */
    const e = E();
    /* O RESUMO DA NOITE LÊ A DIFERENÇA (pedido do dono, 08/09/2026): o
       que a briga mudou em relação, moral, prestígio e caixa é medido
       aqui, antes e depois dos fechamentos — vale pra toda cena, seja
       qual for o caminho que aplicou o efeito. */
    const rivalIdCtx = (acao && acao.alvo && acao.alvo.torcidaId) ||
                       (enc && ((enc.a && enc.a.nossa ? enc.b : enc.a) || {}).torcida) || null;
    const foto = {dinheiro: e.dinheiro, moral: e.indicadores.moral,
                  prestigio: e.indicadores.prestigio,
                  relacao: rivalIdCtx ? TO.relacoes.nivel(e, rivalIdCtx) : null};
    e.estoque = e.estoque || {bombas:0};
    e.estoque.bombas = Math.max(0, e.estoque.bombas - (res.bombasUsadas||0));
    /* bomba deles também sai de estoque (decisão do dono, 18/08/2026):
       o que o rival jogou na cena é descontado do paiol da torcida no
       mundo — elas repõem comprando, como o jogador */
    {
      const meuL = res.nossoLado || 'mandante';
      const outroL = meuL === 'mandante' ? 'visitante' : 'mandante';
      const usadas = (res.armas && res.armas[outroL] && res.armas[outroL].bomba) || 0;
      const rivalId = (acao && acao.alvo && acao.alvo.torcidaId) ||
                      (enc && enc.b && enc.b.torcida) || null;
      const t = rivalId && (e.mundoTorcidas || {})[rivalId];
      if(t && t.bombas != null && usadas > 0)
        t.bombas = Math.max(0, t.bombas - usadas);
    }
    /* TODO OCORRIDO MEXE NO PRESTÍGIO (ordem do dono, 27/08/2026): em
       briga pequena ou parelha a conta de caídos arredondava pra 0 e a
       mensagem saía sem crédito nenhum — foi o que ele viu no save do
       América, num encontro nos arredores do estádio. Vitória agora
       vale no mínimo +1 na régua de 0 a 100, derrota no mínimo −1. A
       pressão no CT fica fora (não é confronto de torcida), e treta e
       arquibancada zeram logo abaixo porque têm tabela própria. */
    if(!res.prestigio && !(acao && acao.acao === 'pressionar'))
      res.prestigio = res.ganhamos ? 1 : -1;
    /* na TRETA o prestígio é a conta do dono e só ela: +1 pro ganhador,
       −1 pro perdedor (fecharTreta). O prestígio genérico da noite não
       soma por cima. */
    if(acao && acao.acao === 'treta') res.prestigio = 0;
    /* na arquibancada a conta é SÓ a tabela do dono (19/08/2026):
       nem o prestígio da noite nem a moral genérica entram por cima */
    if(acao && acao.acao === 'estadio'){ res.prestigio = 0; res.moralTorcida = 0; }
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
    /* a aliada agradece a escolta (mensagens entre torcidas, 08/09/2026) */
    if(enc && enc.escoltaAliado && TO.feed.mensagemDe)
      TO.feed.mensagemDe(e, enc.escoltaAliado, res.ganhamos
        ? 'Voltamos inteiros por causa do bonde de vocês no portão. Isso a gente não esquece.'
        : 'Apanhamos juntos, mas vocês desceram. Irmão é quem aparece na hora ruim. Valeu.',
        'agradecimento');
    const resumo = TO.membros.aplicarResultadoDaNoite(e, res);
    if(enc){
      /* o encontro da rua também é briga: o registro (e a mensagem de
         resultado) sai daqui, pela mesma porta das outras */
      TO.acoes.fecharBrigaDeRua(e, enc, res);
      encontroAberto = null;
    }
    const fecho = acao ? TO.acoes.fecharCena(e, acao, res) : null;
    /* O RITMO DA NOTÍCIA É SEMPRE 1,5s (correção do dono, 24/08/2026).
       Aqui a fila inteira era esvaziada de uma vez pra o resultado da
       briga não esperar o próximo tique — e o que caía junto com ele
       (o jornal da rodada, a treta das IAs, o recado do diretor)
       aparecia todo no mesmo instante. Na briga jogada isso passava
       despercebido, porque a cena leva 1,4s pra assentar; no duelo
       simulado, que abre o relatório na hora, virava rajada. Agora sai
       UMA — a da briga, que acabou de ser escrita — e o relógio entrega
       o resto no compasso de sempre. */
    if(TO.feed.pendentes(e) > 0 && !TO.feed.travado(e)) TO.feed.dropar(e);
    /* fechada a briga, o tempo volta a correr de onde parou */
    soltarTudo('cena');
    /* a cena leva 1,4s pra assentar antes do relatório; a simulada
       não tem o que assentar, e esperar seria tela preta à toa */
    /* O RIVAL É A TORCIDA, NÃO O ENDEREÇO (correção do dono, 08/09/2026):
       o alvo do ataque chama "Bar da Falange Coral" e guarda a dona em
       `deQuem`; o relatório dizia "Relação com a Bar da Falange Coral" */
    const nomeDaTorcida = (id, fallback) =>
      ((id && TO.mundo.torcida(id)) || {}).nome || fallback;
    const rivalCtx = (acao && acao.alvo)
                   ? {id: acao.alvo.torcidaId,
                      nome: acao.alvo.deQuem || nomeDaTorcida(acao.alvo.torcidaId, acao.alvo.nome)}
                   : enc ? (()=>{ const d = (enc.a && enc.a.nossa) ? enc.b : enc.a;
                                 return d ? {id: d.torcida, nome: nomeDaTorcida(d.torcida, d.nome)} : null; })()
                   : null;
    /* a faixa tomada muda de dono e mexe no prestígio (dono, 09/09/2026) */
    if(res && fecho && TO.acoes.aplicarFaixa)
      for(const fx of (res.faixas || (res.faixa ? [res.faixa] : [])))
        if(fx && fx.tomada) TO.acoes.aplicarFaixa(e, res, fecho, rivalIdCtx, fx);
    const ctxRelatorio = {
      rival: rivalCtx,
      cena: (acao && acao.alvo && (acao.alvo.cena || acao.alvo.local)) || (acao && acao.cena) ||
            (acao && acao.alvo && acao.alvo.tipo) || (enc && enc.local) || '',
      atacamos: !!(acao && acao.acao === 'atacar') || !!(enc && !enc.sofrido),
      delta: {
        dinheiro: Math.round(e.dinheiro - foto.dinheiro),
        moral: Math.round((e.indicadores.moral - foto.moral)*5*10)/10,
        prestigio: Math.round((e.indicadores.prestigio - foto.prestigio)*5*10)/10,
        relacao: foto.relacao == null ? null
               : Math.round((TO.relacoes.nivel(e, rivalIdCtx) - foto.relacao)*10)/10
      }
    };
    setTimeout(()=>{
      TO.diaJogo.ponte.parar();
      $('telaDiaJogo').classList.add('oculto');
      document.body.classList.remove('em-cena');
      mostrarRelatorio(res, resumo, fecho, ctxRelatorio);
    }, res.simulada ? 0 : 1400 / (TO.diaJogo.ponte.velocidade || 1));
  }

  /* =======================================================
     A BRIGA DO TUTORIAL (ordem do dono, 02/09/2026): a MESMA cena
     do jogo — joystick, botões, pedra e bomba —, 5×5 na praça,
     contra o nosso pior desafeto. SIMULADA de verdade: o fecho
     descarta o resultado — nem ferido, nem preso, nem bomba do
     estoque, nem prestígio. As bombas da cena são cortesia da casa.
     ======================================================= */
  function abrirBrigaDoTutorial(aoFechar){
    const e = E();
    const fila = TO.membros.aptosParaOEstadio(e)
      .sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa)).slice(0, 5);
    const cores = TO.mundo.coresDaTorcida(e.torcida);
    const bondes = [{lado:'mandante', n:5, nossa:true, nome:e.torcida.nome,
                     cor:cores.cor, cor2:cores.cor2, cor3:cores.cor3,
                     sigla:TO.mundo.siglaTorcida(e.torcida)}];
    const rivalId = Object.entries(e.relacoes||{})
      .sort((a,b)=>a[1]-b[1]).map(([id])=>id)
      .find(id=>TO.mundo.torcida(id)) || null;
    const o = rivalId ? TO.mundo.torcida(rivalId) : null;
    const cR = o ? TO.mundo.coresDaTorcida(o) : null;
    /* o rival também desce como BONDE: é o que garante o 5×5 exato —
       pelo efetivoRival a cena arredonda por spawn e 5 virava 6 */
    bondes.push({lado:'visitante', n:5, nossa:false,
                 nome: o ? o.nome : 'A rival',
                 cor: cR ? cR.cor : '#1d4f8a',
                 cor2: cR ? cR.cor2 : '#e8e8e8',
                 cor3: cR ? cR.cor3 : null,
                 sigla: o ? TO.mundo.siglaTorcida(o) : 'RIV',
                 perfil: perfilDe(rivalId)});
    $('telaDiaJogo').classList.remove('oculto');
    document.body.classList.add('em-cena');
    TO.estado.bloquear(true);
    pararTudo('cena');
    simularProxima = false;
    abrirPalco({
      canvas: $('djPrincipal'),
      config: { escalacao: fila, intencao:'atacar', bondes,
                bombas: 3, efetivoRival: 5, local:'praca',
                rival: o ? {nome:o.nome, cor:cR.cor, cor2:cR.cor2, cor3:cR.cor3}
                         : {nome:'A rival', cor:'#1d4f8a', cor2:'#e8e8e8', cor3:null},
                perfilRival: perfilDe(rivalId) },
      aoTerminar: res => {
        TO.estado.bloquear(false);
        soltarTudo('cena');
        TO.diaJogo.ponte.parar();
        $('telaDiaJogo').classList.add('oculto');
        document.body.classList.remove('em-cena');
        if(aoFechar) aoFechar(res || {});
      }
    });
  }

  /* =======================================================
     AÇÃO QUE VIRA CENA (GDD §4.1)
     Atacar bar ou sede, assaltar comércio e pressionar o clube
     abrem a mesma tela do dia de jogo, num cenário próprio.
     ======================================================= */
  function abrirAcaoEmCena(cena, efetivo){
    const e = E();
    /* A DESCIDA DA FILIAL ABRE CENA (ordem do dono, 31/08/2026): quando
       a ação manda escalação própria — o núcleo da sub-sede — é ela que
       desce, não os aptos da cidade-sede. */
    const fila = (cena.escalacao && cena.escalacao.length
        ? cena.escalacao.slice()
        : TO.membros.aptosParaOEstadio(e))
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
    /* QUEM DEFENDE SEMPRE TEM DONO (pedido do dono, 20/08/2026: o
       mesmo padrão de disco em todas as cenas). No bar quem defende é
       a torcida dona dele e as cores vêm dela. No CT não existe
       torcida do outro lado — são os seguranças do clube —, e sem
       ninguém pra vestir o disco ele caía na cor genérica do LADO:
       vermelho ou azul, cor de time nenhum, e a cena do CT era a
       única com disco que não era de ninguém. Agora eles têm farda:
       chumbo com a faixa do colete, que não é cor de torcida nenhuma
       e por isso nunca se confunde com a nossa. */
    const SEGURANCA = {nome:'Segurança', cor:'#3a3d42', cor2:'#e8c33a', cor3:null};
    abrirPalco({
      canvas: $('djPrincipal'),
      config: { escalacao: aptos, intencao:'atacar', bondes,
                bombas: p.bombas,
                efetivoRival: cena.efetivoRival, local: cena.cena,
                /* a faixa: quem é atacado expõe — aqui, eles */
                faixaDefensor:'eles', rivalId: cena.alvo && cena.alvo.torcidaId,
                rival: (donoAlvo && cDono.cor) ? {nome:donoAlvo.nome,
                  cor:cDono.cor, cor2:cDono.cor2, cor3:cDono.cor3} : SEGURANCA,
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
    /* na linha do dia, quem briga é o que SOBROU da caravana */
    nossos = tetoNossoItn(nossos);
    /* QUEM VEM ATACAR TRAZ A TURMA QUE O SERVIÇO PEDE. Os 30% fixos
       criavam a cena-farsa: atacante grande o bastante pra passar no
       filtro de geração ainda chegava com um terço do nosso bonde e
       corria por minoria na largada. Agora ele traz no mínimo os 30%
       de sempre, sobe até ~90% do nosso efetivo na cena se tiver gente,
       e nunca mais de 70% da torcida dele. Atacante gigante segue
       vindo com muito mais que a gente. */
    const membrosDeles = TO.acoes.efetivoDePe(e, o || {}) || 40;
    let deles = Math.max(4, Math.max(
      Math.round(membrosDeles * 0.30),
      Math.min(Math.round(membrosDeles * 0.70), Math.round(nossos * 0.9))));
    if(noBar) deles = Math.min(deles, 60);
    /* e o ferido deles da briga anterior também não desce do carro */
    deles = descontoItn(atq.torcida, deles);
    const c1 = TO.mundo.coresDaTorcida(e.torcida);
    const c2 = TO.mundo.coresDaTorcida(o || {});
    /* NÓS SOMOS SEMPRE O LADO ATACADO — e nas duas cenas o atacado é o
       `visitante`. No bar é o bonde do salão, com o balcão atrás; na
       estrada é quem está no ônibus, no meio da tela, com eles descendo
       pelas duas pontas.

       A inversão que havia aqui (`naEstrada ? 'mandante'`) é de quando a
       emboscada tomava emprestada a rua de periferia, onde `mandante`
       era o lado de casa. Com as cenas de emboscada do dono (posto e
       estrada, 19/08/2026) os papéis estão desenhados no chão: os
       spawns dizem "ELES, PELA PISTA" nas pontas e "NÓS, NO ÔNIBUS" no
       meio. Com a inversão ligada, nós nascíamos numa ponta (a deles) e
       eles nasciam em cima do ônibus (o nosso) — medido: 38 nossos em
       'ELES, DE UM LADO' e 14 deles em 'NÓS, NO ÔNIBUS'. */
    const nosso  = 'visitante';
    const outro  = 'mandante';
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
    abrirPalco({
      canvas: $('djPrincipal'),
      config: { escalacao: aptos, intencao:'atacar', paz:false, bombas:p.bombas,
                efetivoRival: deles, local: atq.cena || 'bar', bondes,
                /* a faixa: quem é atacado expõe — aqui, a gente */
                faixaDefensor:'nos', rivalId: atq.torcida },
      aoTerminar: res => fecharDiaDeJogo(res, null,
        {acao:'defender', alvo:{tipo:atq.alvo || 'bar', torcidaId:atq.torcida, cobranca: !!atq.cobranca,
                                cena: atq.cena || 'bar',
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
    /* O LADO É DA CENA, NÃO DO CAMPEONATO (correção do dono,
       24/08/2026): na emboscada de caravana a nossa torcida entra como
       visitante, e o cartaz lia "caidosVisitante" como "deles". Todo
       número daqui pra baixo passa por nossoLado/outro. */
    const nossoLado = res.nossoLado === 'visitante' ? 'visitante' : 'mandante';
    const outro = nossoLado === 'mandante' ? 'visitante' : 'mandante';
    const Cap = l => l === 'mandante' ? 'Mandante' : 'Visitante';
    const caidosDeles  = res['caidos' + Cap(outro)] || 0;
    const caidosNossos = res['caidos' + Cap(nossoLado)] || 0;
    const armas = (res.armas && res.armas[nossoLado]) || {pedra:0, bomba:0};
    const dinheiro = (fecho && fecho.dinheiro) || 0;
    const ef = res.efetivo || {};
    const dado = (rot, val, cor)=>
      `<div class="dado-cena"><span>${rot}</span>`+
      `<b${cor?` class="${cor}"`:''}>${val}</b></div>`;
    return el('div', {class:`cartaz-cena ${correu?'neutra':ganhou?'boa':'ruim'}`, html:
      `<h3>${titulo}</h3><div class="dados-cena">`+
        dado('Feridos deles', caidosDeles, caidosDeles?'positivo':'')+
        dado('Feridos nossos', caidosNossos, caidosNossos?'negativo':'')+
        /* numa fuga limpa os feridos são zero dos dois lados, e zero ali
           é informação: ninguém encostou em ninguém. O que falta saber é
           de que tamanho eram os dois bondes e quantos escaparam. */
        (correu
          ? dado('Eram deles', ef[outro]||0)+
            dado('Éramos nós', ef[nossoLado]||0)+
            dado('Escaparam', (res.sumiram||{})[outro]||0)
          : dado('Armas empregadas',
                 `${armas.pedra||0} pedras · ${armas.bomba||0} bombas`)+
            dado('Dinheiro da operação', dinheiro ? U.dinheiro(dinheiro) : '—',
                 dinheiro ? 'positivo' : ''))+
      `</div>`});
  }

  /* =======================================================
     O RESUMO DA NOITE (pedido do dono, 08/09/2026)
     Título com o resultado e o lugar — "VITÓRIA NO BAR RIVAL",
     "DERROTA NA ARQUIBANCADA" —, duas colunas (a gente à esquerda,
     eles à direita) com envolvidos, feridos, presos e "bombas+pedras",
     e embaixo as consequências: relação, moral, prestígio e dinheiro.
     ======================================================= */
  const LUGAR_CENA = [
    [/^estadio/, 'NA ARQUIBANCADA'], [/^emb-|^emboscada/, 'NA EMBOSCADA'],
    [/^treta/, 'NA TRETA'], [/^concentracao|^praca/, 'NA PRAÇA'],
    [/^pista|^rua/, 'NA PISTA'], [/^arredores/, 'NOS ARREDORES'],
    [/^ct$/, 'NO CT'], [/^comercio/, 'NO COMÉRCIO'], [/^sede/, 'NA SEDE'],
    [/^loja/, 'NA LOJA'], [/^subsede/, 'NA SUBSEDE'], [/^bar/, 'NO BAR']
  ];
  function lugarDaCena(cena, atacamos){
    const c = String(cena || '');
    for(const [re, rot] of LUGAR_CENA)
      if(re.test(c)) return rot === 'NO BAR' ? (atacamos ? 'NO BAR RIVAL' : 'NO NOSSO BAR') : rot;
    return 'NA RUA';
  }

  /* =======================================================
     A RETROSPECTIVA DO ANO (pedido do dono, 09/09/2026)
     As notícias da virada saem de Mensagens e viram uma tela
     própria, aberta em 01/01: uma página por assunto — sobe e
     desce, torcida do ano, rei da pista, a janela, o balanço e
     a treta do ano —, cada uma com o destaque dela e a tabela de
     prêmios onde há prêmio. Fecha, e o relógio volta a andar.
     ======================================================= */
  let retroPag = 0, retroAtual = null;
  const ROT_RETRO = {sobeDesce:'Sobe e desce', torcidaDoAno:'Torcida do ano',
                     reiDaPista:'Rei da pista', janela:'A janela',
                     patrimonio:'O balanço', tretaDoAno:'A treta do ano'};
  function abrirRetrospectivaSePendente(){
    const e = E();
    const r = e && e.retrospectiva;
    if(!r || r.vista || !(r.paginas||[]).length) return false;
    if(document.body.classList.contains('em-cena')) return false;
    if(!$('telaRelatorio').classList.contains('oculto')) return false;
    abrirRetrospectiva(r);
    return true;
  }
  function abrirRetrospectiva(r){
    const e = E();
    r = r || (e && e.retrospectiva);
    if(!r || !(r.paginas||[]).length) return;
    retroAtual = r; retroPag = 0;
    pausarTempo('retro');
    $('retroTitulo').textContent = `Retrospectiva ${r.ano}`;
    $('telaRetro').classList.remove('oculto');
    pintarRetro();
  }
  function fecharRetrospectiva(){
    const e = E();
    if(retroAtual){ retroAtual.vista = true; }
    retroAtual = null;
    $('telaRetro').classList.add('oculto');
    if(e) TO.estado.salvar();
    retomarTempo('retro');
  }
  function pintarRetro(){
    const r = retroAtual; if(!r) return;
    const e = E();
    const pags = r.paginas, n = pags.length;
    retroPag = Math.max(0, Math.min(n-1, retroPag));
    const p = pags[retroPag];
    $('retroSub').textContent = `${retroPag+1} de ${n} · ${ROT_RETRO[p.tipo] || p.edicao || ''}`;
    const cx = $('corpoRetro'); cx.innerHTML = '';
    const pg = el('div',{class:`retro-pag ${p.tipo||''}${p.tom?' '+p.tom:''}`});
    /* o índice das páginas, clicável */
    const idx = el('div',{class:'retro-indice'});
    pags.forEach((q, i)=>{
      const b = el('button',{class:'retro-ponto'+(i===retroPag?' on':''), texto:ROT_RETRO[q.tipo] || String(i+1)});
      b.onclick = ()=>{ retroPag = i; pintarRetro(); };
      idx.appendChild(b);
    });
    pg.appendChild(idx);
    pg.appendChild(el('div',{class:'retro-ano', texto:String(p.ano || r.ano)}));
    pg.appendChild(el('div',{class:'retro-chapeu', texto:p.chapeu || ''}));
    pg.appendChild(el('h2',{class:'retro-manchete', html:p.manchete || ''}));
    if(p.olho) pg.appendChild(el('p',{class:'retro-olho', html:p.olho}));
    if(p.tarja && p.tarja.length)
      pg.appendChild(el('div',{class:'retro-tarja', html:p.tarja.map(t=>`<span>${t}</span>`).join('')}));
    const dest = destaqueDaRetro(e, p);
    if(dest) pg.appendChild(dest);
    if(p.premios && p.premios.length) pg.appendChild(tabelaDePremios(e, p));
    cx.appendChild(pg);
    /* o rodapé: anterior / próxima / fechar */
    const pe = $('peRetro'); pe.innerHTML = '';
    const bAnt = el('button',{class:'bt', texto:'Anterior'});
    bAnt.disabled = retroPag === 0;
    bAnt.onclick = ()=>{ retroPag--; pintarRetro(); };
    pe.appendChild(bAnt);
    if(retroPag < n-1){
      const bProx = el('button',{class:'bt destaque', texto:'Próxima'});
      bProx.onclick = ()=>{ retroPag++; pintarRetro(); };
      pe.appendChild(bProx);
    } else {
      const bFim = el('button',{class:'bt destaque', texto:'Fechar'});
      bFim.onclick = fecharRetrospectiva;
      pe.appendChild(bFim);
    }
    cx.scrollTop = 0;
  }
  const corDaTorcida = id => { const o = id && TO.mundo.torcida(id); return (o && TO.mundo.coresDaTorcida(o).cor) || '#888'; };
  const corDoClube = id => { const t = id && TO.mundo.time(id); return (t && t.cores && t.cores[0]) || '#888'; };
  /* o destaque de cada página: o que ela tem pra mostrar em grande */
  function destaqueDaRetro(e, p){
    const q = p.quadro || {};
    const linhas = q.linhas || [];
    const vazio = txt => el('div',{class:'retro-vazio', texto:txt});
    if(p.tipo === 'torcidaDoAno' || p.tipo === 'reiDaPista'){
      if(!linhas.length) return vazio(p.tipo === 'reiDaPista' ? 'Ninguém fechou o ano com saldo na rua.' : 'Sem ranking fechado.');
      const idDe = l => (p.premios||[]).find(x=>x.nome === l.valor) ? (p.premios||[]).find(x=>x.nome === l.valor).id
                      : ((TO.mundo.todasTorcidas||[]).find(o=>o.nome === l.valor)||{}).id;
      const podio = el('div',{class:'retro-podio'});
      const ordem = [1, 0, 2].filter(i => linhas[i]);
      for(const i of ordem){
        const l = linhas[i], id = idDe(l);
        const c = el('div',{class:`retro-lugar p${i+1}${l.nossa?' nossa':''}`});
        c.appendChild(el('div',{class:'retro-pos', texto:`${i+1}º`}));
        c.appendChild(el('div',{class:'retro-escudo', html:chipTorcida(id, corDaTorcida(id))}));
        c.appendChild(el('div',{class:'retro-nome', html:linkTorcida(id, l.valor)}));
        c.appendChild(el('div',{class:'retro-dado', texto:l.nota || ''}));
        podio.appendChild(c);
      }
      const cx = el('div',{class:'retro-destaque'});
      cx.appendChild(podio);
      if(linhas.length > 3){
        const resto = el('div',{class:'retro-resto'});
        linhas.slice(3).forEach((l, k)=>{
          const id = idDe(l);
          resto.appendChild(el('div',{class:'retro-linha'+(l.nossa?' nossa':''), html:
            `<span class="pos">${k+4}º</span>${chipTorcida(id, corDaTorcida(id))}`+
            `<span class="nome">${linkTorcida(id, l.valor)}</span><span class="dado">${l.nota||''}</span>`}));
        });
        cx.appendChild(resto);
      }
      return cx;
    }
    if(p.tipo === 'sobeDesce'){
      if(!linhas.length) return vazio('Nenhum clube trocou de divisão.');
      const cx = el('div',{class:'retro-destaque retro-colunas'});
      const bloco = (rot, cls, lista)=>{
        const b = el('div',{class:'retro-col '+cls});
        b.appendChild(el('div',{class:'retro-col-tit', texto:rot}));
        if(!lista.length) b.appendChild(el('div',{class:'retro-vazio', texto:'ninguém'}));
        for(const l of lista){
          const id = ((TO.mundo.todosTimes||[]).find(t=>t.nome === l.valor)||{}).id;
          b.appendChild(el('div',{class:'retro-linha'+(l.nossa?' nossa':''), html:
            `${chipClube(id, corDoClube(id))}<span class="nome">${l.valor}</span>`+
            `<span class="dado">${l.nota ? `→ ${l.nota}` : ''}</span>`}));
        }
        return b;
      };
      cx.appendChild(bloco('Subiram', 'sobe', linhas.filter(l=>l.sobe)));
      cx.appendChild(bloco('Caíram', 'desce', linhas.filter(l=>!l.sobe)));
      if(q.resto) cx.appendChild(el('div',{class:'retro-mais', texto:`e mais ${q.resto}`}));
      return cx;
    }
    if(p.tipo === 'janela'){
      if(!linhas.length) return vazio('Janela magra: nenhum elenco mudou de patamar.');
      const cx = el('div',{class:'retro-destaque retro-barras'});
      const maior = Math.max(1, ...linhas.map(l=>Math.abs(parseInt(l.rot,10)||0)));
      for(const l of linhas){
        const v = parseInt(l.rot,10) || 0;
        const id = ((TO.mundo.todosTimes||[]).find(t=>t.nome === l.valor)||{}).id;
        const w = Math.round(100*Math.abs(v)/maior);
        cx.appendChild(el('div',{class:'retro-barra'+(v>0?' sobe':' desce')+(l.nossa?' nossa':''), html:
          `<span class="nome">${chipClube(id, corDoClube(id))}${l.valor}</span>`+
          `<span class="trilho"><i style="width:${w}%"></i></span><span class="dado">${l.rot}</span>`}));
      }
      return cx;
    }
    if(p.tipo === 'patrimonio'){
      if(!linhas.length) return vazio('Ninguém levantou parede este ano.');
      const cx = el('div',{class:'retro-destaque retro-obras'});
      for(const l of linhas){
        const id = ((TO.mundo.todasTorcidas||[]).find(o=>o.nome === l.valor)||{}).id;
        cx.appendChild(el('div',{class:'retro-obra'+(l.nossa?' nossa':''), html:
          `<b class="mais">${l.rot}</b>${chipTorcida(id, corDaTorcida(id))}`+
          `<span class="nome">${linkTorcida(id, l.valor)}</span><span class="dado">${l.nota||''}</span>`}));
      }
      return cx;
    }
    if(p.tipo === 'tretaDoAno'){
      if(!linhas.length) return vazio('O ano passou sem uma treta que valesse a página.');
      const cx = el('div',{class:'retro-destaque retro-treta'});
      const a = linhas[0], b = linhas[1], c = linhas[2];
      const lado = (l, cls)=>{
        const id = ((TO.mundo.todasTorcidas||[]).find(o=>o.nome === l.valor)||{}).id;
        const d = el('div',{class:'retro-lado '+cls+(l.nossa?' nossa':'')});
        d.appendChild(el('div',{class:'retro-rot', texto:l.rot}));
        d.appendChild(el('div',{class:'retro-escudo', html:chipTorcida(id, corDaTorcida(id))}));
        d.appendChild(el('div',{class:'retro-nome', html:linkTorcida(id, l.valor)}));
        d.appendChild(el('div',{class:'retro-dado', texto:l.nota || ''}));
        return d;
      };
      if(a) cx.appendChild(lado(a, 'venceu'));
      cx.appendChild(el('div',{class:'retro-x', texto:'×'}));
      if(b) cx.appendChild(lado(b, 'perdeu'));
      if(c) cx.appendChild(el('div',{class:'retro-nota', texto:`${c.rot}: ${c.valor} · ${c.nota||''}`}));
      return cx;
    }
    /* página que não conheço: lista simples */
    if(!linhas.length) return null;
    const cx = el('div',{class:'retro-destaque'});
    for(const l of linhas) cx.appendChild(el('div',{class:'retro-linha'+(l.nossa?' nossa':''), html:
      `<span class="pos">${l.rot}</span><span class="nome">${l.valor}</span><span class="dado">${l.nota||''}</span>`}));
    return cx;
  }
  function tabelaDePremios(e, p){
    const cx = el('div',{class:'retro-premios'});
    cx.appendChild(el('div',{class:'retro-col-tit', texto:'Premiação'}));
    const t = el('table',{class:'tab-olheiro retro-tab'});
    t.innerHTML = `<thead><tr><th></th><th>Torcida</th><th class="num">${p.tipo === 'reiDaPista' ? 'Saldo' : 'Pontos'}</th><th class="num">Prêmio</th></tr></thead>`;
    const tb = el('tbody');
    for(const x of p.premios){
      tb.appendChild(el('tr',{class:x.nossa?'nossa':'', html:
        `<td class="pos">${x.pos}º</td>`+
        `<td>${chipTorcida(x.id, corDaTorcida(x.id))}${linkTorcida(x.id, x.nome)}</td>`+
        `<td class="num">${p.tipo === 'reiDaPista' ? `${x.v}–${x.d} · +${x.saldo}` : `${x.pontos} pt`}</td>`+
        `<td class="num premio">${U.dinheiro(x.valor)}</td>`}));
    }
    t.appendChild(tb);
    cx.appendChild(t);
    const nosso = p.premios.find(x=>x.nossa);
    if(nosso) cx.appendChild(el('div',{class:'retro-nosso', html:`A nossa levou <b>${U.dinheiro(nosso.valor)}</b> — já está no caixa.`}));
    return cx;
  }

  /* o bloco do troféu: só quando TOMAMOS faixa ou bandeira na cena. A
     foto é assíncrona (o GLB e a arte do pano carregam antes); enquanto
     revela, o bloco mostra as legendas */
  function blocoTrofeu(res, nossoLado, e, ctx){
    const PAT = TO.patrimonio, B = TO.diaJogo && TO.diaJogo.bonecos3;
    const pecas = (res.faixas || (res.faixa ? [res.faixa] : []))
      .filter(f => f && f.tomada && f.por === nossoLado && !f.nossa && f.torcidaId);
    if(!pecas.length) return null;
    const cx = el('div',{class:'trofeu'});
    cx.appendChild(el('h3',{texto:'Troféu da noite'}));
    const foto = el('div',{class:'trofeu-foto revelando', html:'<span>revelando a foto…</span>'});
    cx.appendChild(foto);
    const leg = el('div',{class:'trofeu-legendas'});
    for(const f of pecas){
      const V = f.tipo === 'bandeira' ? PAT.BANDEIRA : PAT.FAIXA;
      leg.appendChild(el('div',{class:'peca', html:
        `<b>Tomamos a ${f.tipo} da ${linkTorcida(f.torcidaId, f.nome)}</b>`+
        `<small>+${V.ganho} de prestígio pra nós · −${V.perda} pra eles</small>`}));
    }
    cx.appendChild(leg);
    /* a foto: a primeira peça (faixa antes de bandeira), nas mãos de
       quatro dos nossos que estão de pé */
    const f0 = pecas.find(f=>f.tipo === 'faixa') || pecas[0];
    const o = TO.mundo.torcida(f0.torcidaId);
    if(!B || !B.fotoDoTrofeu || !o){ foto.remove(); return cx; }
    const src = f0.tipo === 'bandeira' ? PAT.imagemDaBandeira(o, null) : PAT.imagemDaFaixa(o, null, 'faixa', 0);
    if(!src){ foto.remove(); return cx; }
    const im = new Image();
    im.onload = ()=>{
      const cores = TO.mundo.coresDaTorcida(e.torcida);
      const nomes = e.membros.filter(m=>!m.ferido && !m.preso && !m.filial).slice(0, 4).map(m=>TO.membros.nomeDe(m));
      /* a cena da briga: o arredores ainda está nela quando o
         relatório abre; o ctx é a reserva */
      const arr = TO.diaJogo.arredores;
      const cena = (arr && arr.D && arr.D.id) || ctx.cena || '';
      B.fotoDoTrofeu({pano:im, tipo:f0.tipo, nomes, cena, lado:nossoLado,
        torcida:{id:e.torcida.id, cor:cores.cor, cor2:cores.cor2, cor3:cores.cor3, sigla:TO.mundo.siglaTorcida(e.torcida)}})
       .then(url=>{
         if(!url || !foto.isConnected) { foto.remove(); return; }
         foto.classList.remove('revelando'); foto.innerHTML = '';
         foto.appendChild(el('img',{src:url, alt:`Os nossos com a ${f0.tipo} da ${f0.nome}`}));
       });
    };
    im.onerror = ()=>foto.remove();
    im.src = src;
    return cx;
  }

  function mostrarRelatorio(res, resumo, fecho, ctx){
    ctx = ctx || {};
    const e = E();
    const nossoLado = res.nossoLado === 'visitante' ? 'visitante' : 'mandante';
    const outro = nossoLado === 'mandante' ? 'visitante' : 'mandante';
    const Cap = l => l === 'mandante' ? 'Mandante' : 'Visitante';
    const ganhou = fecho ? !!fecho.ganhou
                 : (res.ganhamos !== undefined ? !!res.ganhamos : !!res.venceu);
    const correu = !!res.correram;
    const lugar = lugarDaCena(ctx.cena, ctx.atacamos);
    const titulo = correu ? `ELES CORRERAM ${lugar}`
                 : res.tranquila ? 'NOITE TRANQUILA'
                 : `${ganhou ? 'VITÓRIA' : 'DERROTA'} ${lugar}`;
    $('subRelatorio').textContent = res.motivo || '';
    const cx = $('corpoRelatorio');
    cx.innerHTML = '';
    cx.appendChild(el('h3',{class:`fim-titulo ${correu?'neutra':ganhou?'boa':'ruim'}`, texto:titulo}));
    /* O TROFÉU DA NOITE (pedido do dono, 10/09/2026): a peça tomada
       vira uma foto dos nossos segurando o pano numa viela */
    const trofeu = blocoTrofeu(res, nossoLado, e, ctx);
    if(trofeu) cx.appendChild(trofeu);

    /* as duas colunas */
    const ef = res.efetivo || {};
    const armasDe = l => (res.armas && res.armas[l]) || {pedra:0, bomba:0};
    const lado = (l, nome, id) => ({
      nome, id,
      envolvidos: ef[l] || 0,
      feridos: res['caidos' + Cap(l)] || 0,
      presos: res['presos' + Cap(l)] || 0,
      armas: `${armasDe(l).bomba||0}+${armasDe(l).pedra||0}`
    });
    const nos = lado(nossoLado, e.torcida.nome, e.torcida.id);
    const eles = lado(outro, (ctx.rival && ctx.rival.nome) || 'Rival', ctx.rival && ctx.rival.id);
    const corDe = id => { const o = id && TO.mundo.torcida(id); return (o && TO.mundo.coresDaTorcida(o).cor) || '#888'; };
    const linhas = [['Membros envolvidos','envolvidos'], ['Membros feridos','feridos'],
                    ['Membros presos','presos'], ['Bombas + pedras','armas']];
    const grade = el('div',{class:'fim-lados'});
    grade.appendChild(el('div',{class:'fim-cab nos', html:
      `${chipTorcida(nos.id, corDe(nos.id))}<b>${nos.nome}</b>`}));
    grade.appendChild(el('div',{class:'fim-cab eles', html:
      `<b>${eles.id ? linkTorcida(eles.id, eles.nome) : eles.nome}</b>${chipTorcida(eles.id, corDe(eles.id))}`}));
    for(const [rot, k] of linhas){
      grade.appendChild(el('div',{class:'fim-val nos', html:`<b>${nos[k]}</b>`}));
      grade.appendChild(el('div',{class:'fim-rot', texto:rot}));
      grade.appendChild(el('div',{class:'fim-val eles', html:`<b>${eles[k]}</b>`}));
    }
    cx.appendChild(grade);

    /* as consequências */
    const d = ctx.delta || {};
    const cons = el('div',{class:'fim-cons'});
    const item = (rot, v, fmt)=>{
      if(!v) return;
      const sobe = v > 0;
      cons.appendChild(el('div',{class:'linha-dado', html:
        `<span>${rot}</span><b class="${sobe?'positivo':'negativo'}">${sobe?'+':'−'}${fmt(Math.abs(v))}</b>`}));
    };
    if(d.relacao != null && eles.id) item(`Relação com a ${eles.nome}`, d.relacao, v=>String(Math.round(v)));
    item('Moral', d.moral, v=>String(v));
    item('Prestígio', d.prestigio, v=>String(v));
    item('Dinheiro', d.dinheiro, v=>U.dinheiro(v));
    if(!cons.children.length)
      cons.appendChild(el('div',{class:'linha-dado', html:'<span class="fraco">Sem consequência além dos feridos.</span>'}));
    cx.appendChild(el('div',{class:'fase-rot', texto:'Consequências'}));
    cx.appendChild(cons);
    /* o que a ação deixou (aposta, saque, faixa rasgada) fica em uma linha */
    if(fecho && (fecho.linhas||[]).length)
      cx.appendChild(el('div',{class:`fecho-cena ${fecho.ganhou?'boa':'ruim'}`,
        html:(fecho.linhas||[]).map(l=>`<small>${l}</small>`).join('')}));
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
  /* FECHAR A ABA SALVA (pedido do dono, 23/08/2026): o autosave só
     gravava no fim da semana, então fechar o jogo na quarta-feira
     jogava a semana inteira fora. `beforeunload` é o último instante em
     que ainda dá pra escrever, e `localStorage` é síncrono — cabe. */
  addEventListener('beforeunload', ()=>{
    try{ if(E() && !TO.estado.estaBloqueado()) TO.estado.salvar(); }catch(x){}
  });
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
  /* SAVE QUE FALHA TEM DE GRITAR (medido em 23/08/2026): a cota do
     `localStorage` estoura no quarto ou quinto ano de partida, e antes
     disto o jogo simplesmente parava de salvar sem dizer nada. Agora
     todo fracasso vira aviso na tela e fica guardado pra aba Jogo. */
  TO.estado.aoFalharSave(r=>{
    ultimaFalhaSave = r;
    aviso('NÃO SALVOU · '+r.motivo, 'ruim');
  });

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
  $('btAvancarSelecao').onclick = ()=>{ if(selClube) irParaPasso(2); };
  /* do passo 2 volta pra escolha do clube; do passo 1, pro menu */
  $('btVoltarMenu').onclick = ()=>{
    if(passoSel === 2){ escolhida = null; irParaPasso(1); return; }
    $('telaSelecao').classList.add('oculto');
    $('telaMenu').classList.remove('oculto');
  };
  /* O RELATÓRIO DA NOITE não avança mais o dia: quem avança o dia é o
     relógio do tempo, e ninguém avança dia manualmente. Fechar a tela
     devolve o feed e o relógio volta de onde parou. */
  $('btFecharRelatorio').onclick = ()=>{
    $('telaRelatorio').classList.add('oculto');
    TO.estado.salvar();
    /* voltando de uma cena que o itinerário abriu, quem manda é a
       linha do dia: ela escreve o saldo no cartão e segue. A pausa da
       CENA sai aqui de qualquer jeito — a cena acabou. O que segura o
       relógio a partir de agora é a pausa do itinerário, e ela sai
       quando o dia fecha. */
    if(itnVoltouDaCena()){ soltarTudo('cena'); return; }
    /* e voltando da arquibancada, a partida volta a correr */
    if(voltarDaArquibancada){
      const volta = voltarDaArquibancada; voltarDaArquibancada = null;
      volta();
      if(ITN) return;
    }
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
    abrirPerfilTorcida, abrirPerfilCidade,
    rodarTempo, pausarTempo, retomarTempo, tempoPausado, opc,
    get pausasDoTempo(){ return [...pausasT]; },
    abrirPainel, fecharPainel, get painel(){ return painel; },
    resolverIda: e => TO.praca.resolverIda(e || E()),
    abrirCaravana, abrirAtaque, abrirIdeologia,
    abrirGuerra, abrirDefesa, abrirEscolta, abrirTreta, abrirAcaoEmCena,
    abrirBrigaDoTutorial,
    /* o clima do estádio e a briga na arquibancada (dono, 19/08/2026) */
    widgetPartida, abrirBrigaNoEstadio, cenaDoEstadio, chanceDeClima,
    /* a retrospectiva da virada (dono, 09/09/2026) */
    abrirRetrospectiva, abrirRetrospectivaSePendente, fecharRetrospectiva,
    abrirItinerario,
    /* o cofre de saves, pra bateria dirigir */
    pintarJogo, abrirCofreNoMenu, montarMenu,
    /* A PORTA DE SERVIÇO DA SELEÇÃO (23/08/2026): a bateria escolhia
       torcida clicando na lista única que existia antes dos dois
       passos. Em vez de cada teste refazer o caminho país → liga →
       clube → torcida, ele diz o nome e a tela se posiciona sozinha.
       Nada aqui é chamado pelo jogo. */
    escolherTorcida(rx){
      const todas = TO.mundo.selecionaveis();
      const alvo = todas.find(o=>new RegExp(rx, 'i').test(o.nome)) || todas[0];
      if(!alvo) return null;
      const t = TO.mundo.time(alvo.clubeId);
      selPais  = TO.competicoes.paisDe(t);
      selLiga  = t.divisao;
      selClube = t;
      escolhida = TO.mundo.ficha(alvo);
      passoSel = 2;
      pintarSelecao();
      return escolhida.nome;
    }
  };

  montarMenu();
})();
