/* =========================================================
   TUTORIAL — o passo a passo de boas-vindas (dono, 02/09/2026)

   A mensagem da Diretoria no feed pergunta se o chefe quer ver o
   jogo; abrindo, um cartão em overlay percorre os indicadores e as
   telas do menu — cada passo ABRE A TELA DE VERDADE no fundo (com os
   dados do save) e circula em dourado a parte que o texto descreve.
   No fim, uma briga simulada num palco próprio ensina a dinâmica da
   pista sem tocar no save. Textos todos do crivo do dono.
   ========================================================= */
(function(){
  const U = TO.util;
  const el = (t,p,f)=>U.criar(t,p,f);
  const E = () => TO.estado.E;

  /* acha o menor elemento que casa o texto — os alvos do círculo */
  const porTexto = (sel, rx) =>
    [...document.querySelectorAll(sel)].find(n=>rx.test(n.textContent)) || null;
  /* os alvos e as subabas são achados pelo TEXTO da tela, que muda com
     o idioma: o padrão casa o português e a tradução de cada rótulo
     (mais as palavras soltas de `extra`, já nas três línguas) */
  const escRx = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rxDe = (pts, extra) => new RegExp(
    pts.flatMap(w=>[w, _t(w)]).map(escRx).join('|') + (extra ? '|'+extra : ''), 'i');

  /* ---------- os passos (crivo do dono, 02/09/2026) ----------
     `circ` circula um indicador na faixa do topo; `painel` abre a
     tela real atrás (null = o feed); `aba` clica a subaba certa (o
     rótulo em português; casa também a tradução); `alvos` devolve os
     pedaços da tela que o texto descreve. */
  const PASSOS = [
    {ic:'⭐', tela:_t('Indicadores · Prestígio'), circ:'ind-prestigio', txt:_t(
      'O jogo é regido por uma série de indicadores que vão dizer se sua torcida vai bem ou mal.<br><br><em>Prestígio</em>: Seu respeito dentro do universo das torcidas. Vencer brigas, construir patrimônio, dominar rivais, tudo isso aumenta o prestígio. O contrário diminui.')},
    {ic:'⚡', tela:_t('Indicadores · Moral'), circ:'ind-moral', txt:_t(
      '<em>Moral</em>: É a satisfação do seu membro com a torcida. Moral alta faz ele estar mais presente nos jogos e nas brigas. Moral baixa faz ele repensar se vale a pena estar na torcida.')},
    {ic:'🫂', tela:_t('Indicadores · Recrutar'), circ:'ind-membros', txt:_t(
      '<em>Recrutar</em>: É a ação de conseguir novos membros. Quem dita se um dia terá novos membros recrutados é a fase do clube: se vai bem novos membros são recrutados mais fácil, se vai mal se torna bem mais difícil.')},
    {ic:'🤝', tela:_t('Indicadores · Relações'), txt:_t(
      '<em>Relações</em>: Nível de relação com um rival, mas mais na frente eu te explico com mais detalhe no passo a passo.')},
    {ic:'📣', tela:_t('Feed'), txt:_t(
      'O feed é onde o jogo acontece. Tudo é decidido por aqui: recado de olheiro, planejamento de ações, notícia. Decisões importantes têm opções que detalham as consequências de cada uma — o resto é pra ler e seguir.'),
      alvos: ()=>{
        /* de preferência uma decisão em aberto; sem uma, o cartão mais
           novo do feed serve de exemplo */
        const bts = document.querySelector('.msg-bts');
        return [(bts && bts.closest('.msg')) ||
                document.querySelector('.msg')];
      }},
    {ic:'👥', tela:_t('Torcida'), painel:'torcida', aba:'Membros', txt:_t(
      'Aqui é detalhado todos os dados da sua torcida, inclusive a lista de membros, que possuem força de ataque e defesa, cargo inicial, podendo evoluir para demais cargos se evoluírem sua força e XP. Eles podem ficar feridos em brigas ou presos se a polícia pegar eles. Nesse caso eles não são usados por você enquanto estiverem nessas condições.'),
      alvos: ()=>{
        /* a tabela inteira estoura a tela: o círculo vai no cabeçalho,
           onde moram ataque, defesa, XP e o estado */
        const t = document.querySelector('.pagina[data-pag="torcida"] table');
        return [t && (t.tHead || t)];
      }},
    {ic:'💰', tela:_t('Financeiro · 1 de 2'), painel:'financeiro',
      aba:'Patrimônio', txt:_t(
      'Essa parte do menu mostra o controle financeiro da torcida. Toda torcida inicia com uma sede social e um bar embutido dentro da sede. Você pode evoluir o patrimônio da torcida comprando novas lojas, bares e subsedes. O nível da sede dita a quantidade de patrimônio que você pode ter, mas cada um tem níveis que quando evoluídos geram mais receita.'),
      alvos: ()=>[
        porTexto('.pagina[data-pag="financeiro"] .cartao, '+
                 '.pagina[data-pag="financeiro"] .quadro',
                 rxDe(['Sede', 'Estrutura'], 'Estructura|Structure|HQ')),
        document.querySelector('.pagina[data-pag="financeiro"] .oferta')]},
    {ic:'💰', tela:_t('Financeiro · 2 de 2'), painel:'financeiro',
      aba:'Patrimônio', txt:_t(
      'Além disso, você pode contratar treinadores de luta pra aumentar a qualidade do seu treino e advogados pra livrar membros da cadeia, sempre com prudência pra não quebrar as finanças da torcida.'),
      alvos: ()=>{
        const adv = rxDe(['Advogado', 'Advogados'], 'abogad|lawyer');
        return [
          porTexto('.pagina[data-pag="financeiro"] .oferta', adv) ||
          porTexto('.pagina[data-pag="financeiro"] .linha-dado, '+
                   '.pagina[data-pag="financeiro"] .transacao', adv)];
      }},
    {ic:'📆', tela:_t('Calendário'), painel:'calendario', aba:'Expediente da Sede', txt:_t(
      'O expediente da sede é a ação passiva da torcida: o que ela vai fazer sem você. Todas as escolhas mexem nos indicadores ou nas finanças. Existe também o calendário seu e dos outros times pra você se programar.'),
      alvos: ()=>[document.querySelector('.pagina[data-pag="calendario"] '+
        '.cartao, .pagina[data-pag="calendario"] .quadro')]},
    {ic:'🏆', tela:_t('Competições'), painel:'competicoes', txt:_t(
      'Aqui você consegue detalhar todos os campeonatos do mundo, com tabela de classificação e jogos por rodada.'),
      alvos: ()=>{
        const jogo = document.querySelector('.pagina[data-pag="competicoes"] .jogo');
        return [document.querySelector('.pagina[data-pag="competicoes"] table.liga'),
                jogo && jogo.closest('.quadro')];
      }},
    {ic:'🏅', tela:_t('Ranking'), painel:'ranking', txt:_t(
      'A régua nacional das torcidas: membros, prestígio, força, saldo de briga. <em>Subir aqui é o objetivo do ano</em> — e todo mundo tá olhando.'),
      alvos: ()=>[
        document.querySelector('.pagina[data-pag="ranking"] tr.nossa') ||
        document.querySelector('.pagina[data-pag="ranking"] table')]},
    {ic:'🤝', tela:_t('Diplomacia · Aliados'), painel:'diplomacia',
      aba:'Alianças', txt:_t(
      'A diplomacia mostra as relações da sua torcida com todas as demais. Os aliados vão te ajudar e pedir auxílio; qualquer ajuda entre vocês aumenta a relação, negar diminui.'),
      alvos: ()=>[document.querySelector('.pagina[data-pag="diplomacia"] '+
        '.cartao, .pagina[data-pag="diplomacia"] table')]},
    {ic:'⚔️', tela:_t('Diplomacia · Rivais'), painel:'diplomacia',
      aba:'Rivalidades', txt:_t(
      'Os rivais vão ser aqueles que procuram hostilidade contra você no jogo, seja na sua cidade, em outra cidade em jogos fora de casa ou em emboscadas na estrada quando você estiver viajando. Cada ação dessa piora as relações entre você e o rival.'),
      alvos: ()=>[document.querySelector('.pagina[data-pag="diplomacia"] '+
        '.cartao, .pagina[data-pag="diplomacia"] table')]},
    {ic:'📰', tela:_t('Notícias'), painel:'noticias', aba:'Brigas', txt:_t(
      'Aqui é onde as notícias do mundo inteiro são compiladas, além da lista de brigas entre as demais torcidas do jogo (IA × IA).'),
      alvos: ()=>{
        const b = document.querySelector('.pagina[data-pag="noticias"] .briga-ia');
        return [b ? b.closest('.cartao') :
          document.querySelector('.pagina[data-pag="noticias"] .cartao')];
      }},
    {ic:'💾', tela:_t('Jogo'), painel:'jogo', txt:_t(
      'O cofre de saves. Partida de cinco anos se salva — <em>vaga, arquivo ou texto</em>. Salva antes de decisão grande e ninguém chora depois.'),
      alvos: ()=>[porTexto('.pagina[data-pag="jogo"] .quadro',
                           rxDe(['Vagas de save'], 'Vagas|Ranuras|Slots'))]},
  ];

  let passo = 0, overlay = null;

  function limparCirculos(){
    document.querySelectorAll('.tut-circulado')
      .forEach(n=>n.classList.remove('tut-circulado'));
  }

  function montarOverlay(){
    if(overlay) return overlay;
    overlay = el('div',{id:'tutOverlay'});
    overlay.innerHTML =
      `<div class="tut-msg">
        <div class="tut-cab"><span>${_t('Diretoria')}</span><small>${_t('passo a passo')}</small></div>
        <div class="tut-progresso"><small id="tutConta"></small>
          <div class="tut-tracos" id="tutTracos"></div></div>
        <div class="tut-tela" id="tutTela"></div>
        <div class="tut-corpo" id="tutCorpo"></div>
        <div class="tut-acoes">
          <button class="tut-forte" id="tutAvancar">${_t('Avançar →')}</button>
          <button id="tutPular">${_t('Pular o resto')}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const tr = overlay.querySelector('#tutTracos');
    PASSOS.forEach(()=>tr.appendChild(el('i')));
    overlay.querySelector('#tutAvancar').onclick = avancar;
    overlay.querySelector('#tutPular').onclick = ()=>terminar(true);
    return overlay;
  }

  function pintarPasso(){
    const p = PASSOS[passo];
    overlay.querySelector('#tutConta').textContent =
      _t('Passo {n} de {total}', {n:passo+1, total:PASSOS.length});
    [...overlay.querySelectorAll('#tutTracos i')].forEach((i,k)=>
      i.classList.toggle('feito', k <= passo));
    overlay.querySelector('#tutTela').innerHTML =
      `<span class="ic">${p.ic}</span>${p.tela}`;
    overlay.querySelector('#tutCorpo').innerHTML = p.txt;
    overlay.querySelector('#tutAvancar').textContent =
      passo === PASSOS.length-1 ? _t('Fechar com a briga →') : _t('Avançar →');

    /* a tela DE VERDADE no fundo (menu abre atrás do cartão) */
    if(p.painel) TO.tela.abrirPainel(p.painel);
    else TO.tela.fecharPainel();
    if(p.aba){
      /* o rótulo da subaba em português ou já traduzido: primeiro o
         botão com o rótulo exato, senão o que o contém */
      const rots = [p.aba, _t(p.aba)];
      const bts = [...document.querySelectorAll(
        `.pagina[data-pag="${p.painel}"] .subabas button`)];
      const b = bts.find(x=>rots.includes(x.textContent.trim())) ||
                bts.find(x=>rots.some(r=>x.textContent.includes(r)));
      if(b && !b.classList.contains('on')) b.click();
    }
    /* os círculos entram depois que a tela pintou */
    setTimeout(()=>{
      limparCirculos();
      if(p.circ){
        const n = document.querySelector('.'+p.circ);
        if(n) n.classList.add('tut-circulado');
      }
      for(const alvo of (p.alvos ? p.alvos() : [])){
        if(!alvo) continue;
        alvo.classList.add('tut-circulado');
        if(p.painel) alvo.scrollIntoView({block:'nearest'});
      }
    }, 60);
  }

  function avancar(){
    if(passo === PASSOS.length-1){ abrirBriga(); return; }
    passo++; pintarPasso();
  }

  function iniciar(){
    passo = 0;
    TO.tela.pausarTempo('tutorial');
    montarOverlay().style.display = 'block';
    pintarPasso();
  }

  function terminar(pulou){
    limparCirculos();
    if(overlay) overlay.style.display = 'none';
    fecharBriga();
    TO.tela.fecharPainel();
    const e = E();
    if(e){
      e.tutorial = {feito:true, pulou:!!pulou};
      TO.estado.salvar();
    }
    TO.tela.retomarTempo('tutorial');
  }

  /* =======================================================
     A BRIGA SIMULADA — a CENA DE VERDADE do jogo (ordem do dono,
     02/09/2026): 5×5 na praça pelo palco real, com joystick, botões,
     pedra e bomba. O main abre e fecha sem cobrar nada do save
     (`abrirBrigaDoTutorial`); aqui ficam só os balões explicativos
     por cima e o desfecho. Textos do dono ao pé da letra — exceto o
     do movimento, adaptado do "mouse" da maquete pros controles
     reais (WASD/direcional). Os balões avançam quando dá pra sentir
     a ação (mexeu, jogou) e no "Entendi" quando não dá.
     ======================================================= */
  let baloes = null, desfecho = null, etapa = 0, feitos = null;
  let ouvindo = false;

  function montarBaloes(){
    if(baloes) return baloes;
    baloes = el('div',{id:'tutBaloes'});
    baloes.innerHTML =
      `<div class="tut-balao" id="tutBalao0">
        <div class="rot">${_t('A pista · 1 de 4')}</div>
        <p>${_t('O bonde anda com o <b>WASD</b> — ou com o direcional na tela, no toque. Aponta pra onde quer ir que os seus vão atrás de você.')}</p>
        <span class="feito">${_t('✓ isso — agora vai pra cima deles')}</span></div>
      <div class="tut-balao" id="tutBalao1">
        <div class="rot">${_t('A porrada · 2 de 4')}</div>
        <p>${_t('Não precisa clicar no rival e nem em alguma tecla pra bater nele: <b>basta encostar nele</b>.')}</p>
        <button class="entendi" data-n="1">${_t('Entendi')}</button></div>
      <div class="tut-balao" id="tutBalao2">
        <div class="rot">${_t('O arsenal · 3 de 4')}</div>
        <p>${_t('Clique <kbd>Q</kbd> pra jogar pedra, <kbd>E</kbd> pra jogar bomba.')}</p>
        <span class="feito">${_t('✓ voou coisa na praça')}</span></div>
      <div class="tut-balao" id="tutBalao3">
        <div class="rot">${_t('A fuga · 4 de 4')}</div>
        <p>${_t('Quando o rival perder uma <b>% dos envolvidos</b>, ela vai correr da briga.')}</p>
        <button class="entendi" data-n="3">${_t('Entendi — terminar o serviço')}</button></div>`;
    document.body.appendChild(baloes);
    baloes.addEventListener('click', ev=>{
      const n = ev.target && ev.target.dataset && ev.target.dataset.n;
      if(n != null) cumprir(+n);
    });
    return baloes;
  }

  function montarDesfecho(){
    if(desfecho) return desfecho;
    desfecho = el('div',{class:'tut-desfecho', id:'tutDesfecho'});
    desfecho.innerHTML =
      `<h2 id="tutDfRot">${_t('A rival correu!')}</h2>
       <p id="tutDfSub">${_t('Ela quebrou e abandonou a praça. É assim que briga termina: no número, não no clique.')}</p>
       <button id="tutDeNovo">${_t('Brigar de novo')}</button>
       <button id="tutVoltar">${_t('Voltar pro jogo')}</button>`;
    document.body.appendChild(desfecho);
    desfecho.querySelector('#tutDeNovo').onclick = ()=>{
      desfecho.style.display = 'none';
      abrirBriga();
    };
    desfecho.querySelector('#tutVoltar').onclick = ()=>terminar(false);
    return desfecho;
  }

  function cumprir(n){
    if(!feitos || feitos[n]) return;
    feitos[n] = true;
    const b = baloes.querySelector('#tutBalao'+n);
    b.classList.add('cumprido');
    setTimeout(()=>{
      b.classList.remove('on');
      if(n+1 < 4){ etapa = n+1;
        baloes.querySelector('#tutBalao'+(n+1)).classList.add('on'); }
    }, n === 1 || n === 3 ? 80 : 700);
  }

  /* os sinais da cena real: mexeu (WASD ou direcional) e jogou
     (botão de pedra/bomba, o pad do toque ou as teclas Q/E) */
  function aoTeclar(ev){
    if(!feitos) return;
    const k = (ev.key || '').toLowerCase();
    if(etapa === 0 && 'wasd'.includes(k) && k) cumprir(0);
    if(etapa === 2 && (k === 'q' || k === 'e')) cumprir(2);
  }
  function aoTocar(ev){
    if(!feitos) return;
    const alvo = ev.target;
    if(etapa === 0 && alvo.closest &&
       (alvo.closest('.pad-bola') || alvo.closest('canvas'))) cumprir(0);
    if(etapa === 2 && alvo.closest &&
       (alvo.closest('#djBtPedra') || alvo.closest('#djBtBomba') ||
        alvo.closest('.pad-q') || alvo.closest('.pad-e'))) cumprir(2);
  }
  function escutar(liga){
    if(liga === ouvindo) return;
    ouvindo = liga;
    const f = liga ? 'addEventListener' : 'removeEventListener';
    window[f]('keydown', aoTeclar, true);
    document[f]('pointerdown', aoTocar, true);
  }

  function abrirBriga(){
    limparCirculos();
    if(overlay) overlay.style.display = 'none';
    TO.tela.fecharPainel();
    montarBaloes(); montarDesfecho();
    etapa = 0; feitos = [false,false,false,false];
    baloes.style.display = 'block';
    desfecho.style.display = 'none';
    baloes.querySelectorAll('.tut-balao').forEach(b=>
      b.classList.remove('on','cumprido'));
    baloes.querySelector('#tutBalao0').classList.add('on');
    escutar(true);
    TO.tela.abrirBrigaDoTutorial(res => {
      escutar(false);
      baloes.style.display = 'none';
      const venceu = !!(res && res.ganhamos);
      desfecho.querySelector('#tutDfRot').textContent =
        venceu ? _t('A rival correu!') : _t('Fim da demonstração');
      desfecho.querySelector('#tutDfSub').textContent = venceu
        ? _t('Ela quebrou e abandonou a praça. É assim que briga termina: no número, não no clique.')
        : _t('Na briga de verdade seria dia de lamber ferida — aqui não custou nada. Quer tentar de novo?');
      desfecho.style.display = 'block';
    });
  }

  function fecharBriga(){
    escutar(false);
    if(baloes) baloes.style.display = 'none';
    if(desfecho) desfecho.style.display = 'none';
  }

  TO.tutorial = { iniciar };
})();
