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

  /* ---------- os passos (crivo do dono, 02/09/2026) ----------
     `circ` circula um indicador na faixa do topo; `painel` abre a
     tela real atrás (null = o feed); `aba` clica a subaba certa;
     `alvos` devolve os pedaços da tela que o texto descreve. */
  const PASSOS = [
    {ic:'⭐', tela:'Indicadores · Prestígio', circ:'ind-prestigio', txt:
      'O jogo é regido por uma série de indicadores que vão dizer se sua '+
      'torcida vai bem ou mal.<br><br><em>Prestígio</em>: Seu respeito '+
      'dentro do universo das torcidas. Vencer brigas, construir '+
      'patrimônio, dominar rivais, tudo isso aumenta o prestígio. O '+
      'contrário diminui.'},
    {ic:'⚡', tela:'Indicadores · Moral', circ:'ind-moral', txt:
      '<em>Moral</em>: É a satisfação do seu membro com a torcida. Moral '+
      'alta faz ele estar mais presente nos jogos e nas brigas. Moral '+
      'baixa faz ele repensar se vale a pena estar na torcida.'},
    {ic:'🫂', tela:'Indicadores · Recrutar', circ:'ind-membros', txt:
      '<em>Recrutar</em>: É a ação de conseguir novos membros. Quem dita '+
      'se um dia terá novos membros recrutados é a fase do clube: se vai '+
      'bem novos membros são recrutados mais fácil, se vai mal se torna '+
      'bem mais difícil.'},
    {ic:'🤝', tela:'Indicadores · Relações', txt:
      '<em>Relações</em>: Nível de relação com um rival, mas mais na '+
      'frente eu te explico com mais detalhe no passo a passo.'},
    {ic:'📣', tela:'Feed', txt:
      'O feed é onde o jogo acontece. Tudo é decidido por aqui: recado '+
      'de olheiro, planejamento de ações, notícia. Decisões importantes '+
      'têm opções que detalham as consequências de cada uma — o resto é '+
      'pra ler e seguir.',
      alvos: ()=>{
        /* de preferência uma decisão em aberto; sem uma, o cartão mais
           novo do feed serve de exemplo */
        const bts = document.querySelector('.msg-bts');
        return [(bts && bts.closest('.msg')) ||
                document.querySelector('.msg')];
      }},
    {ic:'👥', tela:'Torcida', painel:'torcida', aba:/Membros/, txt:
      'Aqui é detalhado todos os dados da sua torcida, inclusive a lista '+
      'de membros, que possuem força de ataque e defesa, cargo inicial, '+
      'podendo evoluir para demais cargos se evoluírem sua força e XP. '+
      'Eles podem ficar feridos em brigas ou presos se a polícia pegar '+
      'eles. Nesse caso eles não são usados por você enquanto estiverem '+
      'nessas condições.',
      alvos: ()=>{
        /* a tabela inteira estoura a tela: o círculo vai no cabeçalho,
           onde moram ataque, defesa, XP e o estado */
        const t = document.querySelector('.pagina[data-pag="torcida"] table');
        return [t && (t.tHead || t)];
      }},
    {ic:'💰', tela:'Financeiro · 1 de 2', painel:'financeiro',
      aba:/Patrimônio/, txt:
      'Essa parte do menu mostra o controle financeiro da torcida. Toda '+
      'torcida inicia com uma sede social e um bar embutido dentro da '+
      'sede. Você pode evoluir o patrimônio da torcida comprando novas '+
      'lojas, bares e subsedes. O nível da sede dita a quantidade de '+
      'patrimônio que você pode ter, mas cada um tem níveis que quando '+
      'evoluídos geram mais receita.',
      alvos: ()=>[
        porTexto('.pagina[data-pag="financeiro"] .cartao, '+
                 '.pagina[data-pag="financeiro"] .quadro', /Sede|Estrutura/i),
        document.querySelector('.pagina[data-pag="financeiro"] .oferta')]},
    {ic:'💰', tela:'Financeiro · 2 de 2', painel:'financeiro',
      aba:/Patrimônio/, txt:
      'Além disso, você pode contratar treinadores de luta pra aumentar '+
      'a qualidade do seu treino e advogados pra livrar membros da '+
      'cadeia, sempre com prudência pra não quebrar as finanças da '+
      'torcida.',
      alvos: ()=>[
        porTexto('.pagina[data-pag="financeiro"] .oferta', /[Aa]dvogado/) ||
        porTexto('.pagina[data-pag="financeiro"] .linha-dado, '+
                 '.pagina[data-pag="financeiro"] .transacao', /[Aa]dvogado/)]},
    {ic:'📆', tela:'Calendário', painel:'calendario', aba:/Expediente/, txt:
      'O expediente da sede é a ação passiva da torcida: o que ela vai '+
      'fazer sem você. Todas as escolhas mexem nos indicadores ou nas '+
      'finanças. Existe também o calendário seu e dos outros times pra '+
      'você se programar.',
      alvos: ()=>[document.querySelector('.pagina[data-pag="calendario"] '+
        '.cartao, .pagina[data-pag="calendario"] .quadro')]},
    {ic:'🏆', tela:'Competições', painel:'competicoes', txt:
      'Aqui você consegue detalhar todos os campeonatos do mundo, com '+
      'tabela de classificação e jogos por rodada.',
      alvos: ()=>{
        const jogo = document.querySelector('.pagina[data-pag="competicoes"] .jogo');
        return [document.querySelector('.pagina[data-pag="competicoes"] table.liga'),
                jogo && jogo.closest('.quadro')];
      }},
    {ic:'🏅', tela:'Ranking', painel:'ranking', txt:
      'A régua nacional das torcidas: membros, prestígio, força, saldo '+
      'de briga. <em>Subir aqui é o objetivo do ano</em> — e todo mundo '+
      'tá olhando.',
      alvos: ()=>[
        document.querySelector('.pagina[data-pag="ranking"] tr.nossa') ||
        document.querySelector('.pagina[data-pag="ranking"] table')]},
    {ic:'🤝', tela:'Diplomacia · Aliados', painel:'diplomacia',
      aba:/Alianças/, txt:
      'A diplomacia mostra as relações da sua torcida com todas as '+
      'demais. Os aliados vão te ajudar e pedir auxílio; qualquer ajuda '+
      'entre vocês aumenta a relação, negar diminui.',
      alvos: ()=>[document.querySelector('.pagina[data-pag="diplomacia"] '+
        '.cartao, .pagina[data-pag="diplomacia"] table')]},
    {ic:'⚔️', tela:'Diplomacia · Rivais', painel:'diplomacia',
      aba:/Rivalidades/, txt:
      'Os rivais vão ser aqueles que procuram hostilidade contra você no '+
      'jogo, seja na sua cidade, em outra cidade em jogos fora de casa '+
      'ou em emboscadas na estrada quando você estiver viajando. Cada '+
      'ação dessa piora as relações entre você e o rival.',
      alvos: ()=>[document.querySelector('.pagina[data-pag="diplomacia"] '+
        '.cartao, .pagina[data-pag="diplomacia"] table')]},
    {ic:'📰', tela:'Notícias', painel:'noticias', aba:/Brigas/, txt:
      'Aqui é onde as notícias do mundo inteiro são compiladas, além da '+
      'lista de brigas entre as demais torcidas do jogo (IA × IA).',
      alvos: ()=>{
        const b = document.querySelector('.pagina[data-pag="noticias"] .briga-ia');
        return [b ? b.closest('.cartao') :
          document.querySelector('.pagina[data-pag="noticias"] .cartao')];
      }},
    {ic:'💾', tela:'Jogo', painel:'jogo', txt:
      'O cofre de saves. Partida de cinco anos se salva — <em>vaga, '+
      'arquivo ou texto</em>. Salva antes de decisão grande e ninguém '+
      'chora depois.',
      alvos: ()=>[porTexto('.pagina[data-pag="jogo"] .quadro', /Vagas/i)]},
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
        <div class="tut-cab"><span>Diretoria</span><small>passo a passo</small></div>
        <div class="tut-progresso"><small id="tutConta"></small>
          <div class="tut-tracos" id="tutTracos"></div></div>
        <div class="tut-tela" id="tutTela"></div>
        <div class="tut-corpo" id="tutCorpo"></div>
        <div class="tut-acoes">
          <button class="tut-forte" id="tutAvancar">Avançar →</button>
          <button id="tutPular">Pular o resto</button>
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
      `Passo ${passo+1} de ${PASSOS.length}`;
    [...overlay.querySelectorAll('#tutTracos i')].forEach((i,k)=>
      i.classList.toggle('feito', k <= passo));
    overlay.querySelector('#tutTela').innerHTML =
      `<span class="ic">${p.ic}</span>${p.tela}`;
    overlay.querySelector('#tutCorpo').innerHTML = p.txt;
    overlay.querySelector('#tutAvancar').textContent =
      passo === PASSOS.length-1 ? 'Fechar com a briga →' : 'Avançar →';

    /* a tela DE VERDADE no fundo (menu abre atrás do cartão) */
    if(p.painel) TO.tela.abrirPainel(p.painel);
    else TO.tela.fecharPainel();
    if(p.aba){
      const b = [...document.querySelectorAll(
        `.pagina[data-pag="${p.painel}"] .subabas button`)]
        .find(x=>p.aba.test(x.textContent));
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
     A BRIGA SIMULADA — palco próprio, fora do save.
     Os três textos dos balões são do dono, ao pé da letra.
     ======================================================= */
  let arena = null, cv, ctx, W, H, mira, nos, eles, pedras;
  let rodando = false, etapa, feitos, moveuEm, fugindo, ultimoT;

  function montarArena(){
    if(arena) return arena;
    arena = el('div',{id:'tutArena'});
    arena.innerHTML =
      `<div class="tut-arena-cab">
        <span class="lado"><i style="background:#9d2222"></i>
          <b id="tutArNos"></b> <em id="tutContaNos">8</em></span>
        <span class="vs">×</span>
        <span class="lado"><i style="background:#1d4f8a"></i>
          <b id="tutArEles"></b> <em id="tutContaEles">8</em></span>
        <span class="tut-barra"><i id="tutBarraEles"></i>
          <u title="aqui ela corre"></u></span>
        <button id="tutSairBriga">Encerrar a demonstração</button>
      </div>
      <div class="tut-palco"><canvas id="tutCv"></canvas>
        <div class="tut-toques">
          <button id="tutBtPedra"><b>Q</b> Pedra</button>
          <button id="tutBtBomba"><b>E</b> Bomba</button>
        </div>
        <div class="tut-balao" id="tutBalao0">
          <div class="rot">A pista · 1 de 4</div>
          <p>O bonde anda com o <b>mouse</b> — aponta pra onde quer ir que
            os seus vão atrás de você.</p>
          <span class="feito">✓ isso — agora vai pra cima deles</span></div>
        <div class="tut-balao" id="tutBalao1">
          <div class="rot">A porrada · 2 de 4</div>
          <p>Não precisa clicar no rival e nem em alguma tecla pra bater
            nele: <b>basta encostar nele</b>.</p>
          <span class="feito">✓ encostou, bateu</span></div>
        <div class="tut-balao" id="tutBalao2">
          <div class="rot">O arsenal · 3 de 4</div>
          <p>Clique <kbd>Q</kbd> pra jogar pedra, <kbd>E</kbd> pra jogar
            bomba.</p>
          <span class="feito">✓ voou coisa na praça</span></div>
        <div class="tut-balao" id="tutBalao3">
          <div class="rot">A fuga · 4 de 4</div>
          <p>Quando o rival perder uma <b>% dos envolvidos</b>, ela vai
            correr da briga — a marquinha dourada na barra ali em cima é o
            ponto em que ela quebra.</p>
          <button class="entendi" id="tutEntendi">Entendi — terminar o
            serviço</button></div>
        <div class="tut-desfecho" id="tutDesfecho">
          <h2>A rival correu!</h2>
          <p>Ela quebrou e abandonou a praça. É assim que briga termina:
            no número, não no clique.</p>
          <button id="tutDeNovo">Brigar de novo</button>
          <button id="tutVoltar">Voltar pro jogo</button></div>
      </div>`;
    document.body.appendChild(arena);
    cv = arena.querySelector('#tutCv');
    ctx = cv.getContext('2d');
    arena.querySelector('#tutSairBriga').onclick = ()=>terminar(false);
    arena.querySelector('#tutVoltar').onclick = ()=>terminar(false);
    arena.querySelector('#tutDeNovo').onclick = armarBriga;
    arena.querySelector('#tutBtPedra').onclick = jogarPedra;
    arena.querySelector('#tutBtBomba').onclick = jogarBomba;
    arena.querySelector('#tutEntendi').onclick = ()=>{
      arena.querySelector('#tutBalao3').classList.remove('on');
      feitos[3] = true;
    };
    cv.addEventListener('pointermove', ev=>{
      const r = cv.getBoundingClientRect();
      mira.x = ev.clientX - r.left; mira.y = ev.clientY - r.top;
      moveuEm += 1;
      if(etapa === 0 && moveuEm > 25) cumprir(0);
    });
    addEventListener('keydown', ev=>{
      if(!arena || arena.style.display !== 'block') return;
      const k = ev.key.toLowerCase();
      if(k === 'q') jogarPedra();
      if(k === 'e') jogarBomba();
    });
    addEventListener('resize', ()=>{
      if(arena && arena.style.display === 'block') medir();
    });
    return arena;
  }

  function medir(){
    const r = arena.querySelector('.tut-palco').getBoundingClientRect();
    cv.width = Math.round(r.width * devicePixelRatio);
    cv.height = Math.round(r.height * devicePixelRatio);
    cv.style.width = r.width+'px'; cv.style.height = r.height+'px';
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    W = r.width; H = r.height;
  }
  const novoDisco = (x,y,cor,sigla,nosso)=>
    ({x, y, cor, sigla, nosso, vida:100, vivo:true, pisca:0});
  const vivos = l => l.filter(d=>d.vivo);

  function armarBriga(){
    medir();
    mira = {x: W*0.3, y: H*0.55};
    nos = []; eles = []; pedras = [];
    for(let i=0;i<8;i++){
      nos.push(novoDisco(W*0.16 + (i%4)*34, H*0.5 + Math.floor(i/4)*40 +
        (i%2)*8, '#9d2222', i? '' : 'VOCÊ', true));
      eles.push(novoDisco(W*0.78 + (i%4)*30, H*0.42 + Math.floor(i/4)*44 +
        (i%3)*7, '#1d4f8a', '', false));
    }
    etapa = 0; feitos = [false,false,false,false];
    fugindo = false; moveuEm = 0;
    arena.querySelector('#tutDesfecho').style.display = 'none';
    arena.querySelectorAll('.tut-balao').forEach(b=>
      b.classList.remove('on','cumprido'));
    arena.querySelector('#tutBalao0').classList.add('on');
    atualizarPlacar();
  }

  function abrirBriga(){
    limparCirculos();
    if(overlay) overlay.style.display = 'none';
    TO.tela.fecharPainel();
    montarArena();
    /* o rival da demonstração é o nosso pior desafeto de verdade */
    const e = E();
    const rival = e && Object.entries(e.relacoes||{})
      .sort((a,b)=>a[1]-b[1]).map(([id])=>TO.mundo.torcida(id))
      .find(Boolean);
    arena.querySelector('#tutArNos').textContent =
      (e && e.torcida.nome) || 'A nossa';
    arena.querySelector('#tutArEles').textContent =
      (rival && rival.nome) || 'A rival';
    arena.style.display = 'block';
    armarBriga();
    if(!rodando){ rodando = true; ultimoT = performance.now();
      requestAnimationFrame(rodar); }
  }
  function fecharBriga(){
    if(arena) arena.style.display = 'none';
    rodando = false;
  }

  function cumprir(n){
    if(feitos[n]) return;
    feitos[n] = true;
    const b = arena.querySelector('#tutBalao'+n);
    b.classList.add('cumprido');
    setTimeout(()=>{
      b.classList.remove('on');
      if(n+1 < 4){ etapa = n+1;
        arena.querySelector('#tutBalao'+(n+1)).classList.add('on'); }
    }, n === 0 ? 500 : 900);
  }
  function jogarPedra(){
    const de = vivos(nos)[0], alvo = vivos(eles)[0];
    if(!de || !alvo) return;
    const dx = alvo.x-de.x, dy = alvo.y-de.y, d = Math.hypot(dx,dy)||1;
    pedras.push({x:de.x, y:de.y, vx:dx/d*7.5, vy:dy/d*7.5, r:3.5,
                 bomba:false, t:120});
    if(etapa === 2) cumprir(2);
  }
  function jogarBomba(){
    const de = vivos(nos)[0], alvo = vivos(eles)[0];
    if(!de || !alvo) return;
    const dx = alvo.x-de.x, dy = alvo.y-de.y, d = Math.hypot(dx,dy)||1;
    pedras.push({x:de.x, y:de.y, vx:dx/d*4.6, vy:dy/d*4.6, r:5.5,
                 bomba:true, t:70});
    if(etapa === 2) cumprir(2);
  }
  function atualizarPlacar(){
    const ne = vivos(eles).length;
    arena.querySelector('#tutContaNos').textContent = vivos(nos).length;
    arena.querySelector('#tutContaEles').textContent = ne;
    arena.querySelector('#tutBarraEles').style.transform = `scaleX(${ne/8})`;
  }
  function derrubar(d){
    if(!d.vivo) return;
    d.vida -= 34; d.pisca = 8;
    if(d.vida <= 0) d.vivo = false;
    atualizarPlacar();
    /* a régua da fuga: perdeu 40% dos envolvidos, corre */
    if(!fugindo && vivos(eles).length <= Math.ceil(8*0.6)){
      fugindo = true;
      if(!feitos[3]){
        arena.querySelector('#tutBalao3').classList.remove('on');
        feitos[3] = true;
      }
      setTimeout(()=>{
        arena.querySelector('#tutDesfecho').style.display = 'block';
      }, 1400);
    }
  }
  function rodar(t){
    if(!rodando) return;
    const dt = Math.min(32, t-ultimoT)/16.6; ultimoT = t;
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle = '#1b1b1b';
    for(let x=0;x<W;x+=46){ ctx.beginPath(); ctx.moveTo(x,0);
      ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=46){ ctx.beginPath(); ctx.moveTo(0,y);
      ctx.lineTo(W,y); ctx.stroke(); }
    vivos(nos).forEach((d,i)=>{
      const alvo = i === 0 ? mira : vivos(nos)[0];
      const ang = i * 2.4, raio = i === 0 ? 0 : 26 + (i%3)*16;
      const ax = alvo.x + Math.cos(ang)*raio;
      const ay = alvo.y + Math.sin(ang)*raio;
      d.x += (ax-d.x) * (i===0? .14 : .08) * dt;
      d.y += (ay-d.y) * (i===0? .14 : .08) * dt;
    });
    vivos(eles).forEach((d,i)=>{
      if(fugindo){ d.x += 3.2*dt; d.y += (i%2? .6 : -.6)*dt; return; }
      const cap = vivos(nos)[0]; if(!cap) return;
      const dx = cap.x-d.x, dy = cap.y-d.y, dist = Math.hypot(dx,dy)||1;
      d.x += dx/dist * .5 * dt + Math.sin(t/300+i)*.3;
      d.y += dy/dist * .5 * dt + Math.cos(t/260+i)*.3;
    });
    if(!fugindo) for(const a of vivos(nos)) for(const b of vivos(eles)){
      if(Math.hypot(a.x-b.x, a.y-b.y) < 22){
        if(b.pisca <= 0){ derrubar(b); if(etapa <= 1) cumprir(1); }
      }
    }
    pedras = pedras.filter(p=>{
      p.x += p.vx*dt; p.y += p.vy*dt; p.t -= dt;
      for(const b of vivos(eles)){
        if(Math.hypot(p.x-b.x, p.y-b.y) < (p.bomba? 40 : 16)){
          if(p.bomba){ vivos(eles).forEach(o=>{
            if(Math.hypot(p.x-o.x,p.y-o.y) < 60) derrubar(o); }); }
          else derrubar(b);
          return false;
        }
      }
      return p.t > 0 && p.x > -20 && p.x < W+20 && p.y > -20 && p.y < H+20;
    });
    for(const p of pedras){
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fillStyle = p.bomba ? '#d9a441' : '#bcbcbc'; ctx.fill();
    }
    for(const d of [...eles, ...nos]){
      if(!d.vivo) ctx.globalAlpha = .18;
      ctx.beginPath(); ctx.arc(d.x, d.y, 13, 0, 7);
      ctx.fillStyle = d.pisca > 0 ? '#e8e8e8' : d.cor; ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = d.nosso ? '#e05555' : '#4d7fb5'; ctx.stroke();
      if(d.pisca > 0) d.pisca -= dt;
      if(d.sigla){ ctx.fillStyle = '#fff';
        ctx.font = '600 9px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center'; ctx.fillText(d.sigla, d.x, d.y-18); }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(rodar);
  }

  TO.tutorial = { iniciar };
})();
