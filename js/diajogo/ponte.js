
/* =========================================================
   PONTE — laço, HUD, entrada do jogador e editor de cena
   Liga arredores.js + combate.js a uma tela concreta.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.ponte = (function(){
  const U = TO.util;
  const A = TO.diaJogo.arredores;
  const C = TO.diaJogo.combate;
  const P = TO.diaJogo.P;
  /* A cena pode trocar no ar (arredores, praça, rua), então D não pode ser
     uma referência congelada no carregamento do módulo. */
  const D = new Proxy({}, {
    get:(_, k)=>A.D[k],
    set:(_, k, v)=>{ A.D[k] = v; return true; },
    has:(_, k)=>k in A.D,
    ownKeys:()=>Reflect.ownKeys(A.D),
    getOwnPropertyDescriptor:(_, k)=>
      Object.getOwnPropertyDescriptor(A.D, k) ||
      {configurable:true, enumerable:true, value:A.D[k]}
  });

  /* nos arredores o objetivo é o portão; nas cenas de rua a cena diz o seu */
  const SAIDA_PADRAO = {perto:'Entrar pelo portão', longe:'Portão (leve o líder)',
                        feito:'sua torcida entrou pelo portão',
                        dica:'Leve o líder até o portão da sua torcida.'};

  let cv, ctx, J=null, teclas={}, rodando=false, ant=0;
  /* A VERSÃO DE PERTO. A mesma ponte, o mesmo combate, o mesmo HUD — só
     quem desenha muda. `tres` liga quando a cena é uma das `*-3d` ou
     quando quem monta pede; T é o renderizador (js/diajogo/tres.js).
     `bonecos` é a outra ponta do mesmo renderizador: a cena continua
     sendo a de cima, e um canvas WebGL transparente por cima dela põe
     boneco no lugar do disco. */
  let tres=false, T=null, dtQuadro=0.016, bonecos=false;
  let aoTerminar=null;
  /* chamado a cada quadro enquanto a cena roda: quem monta a cena usa
     isso pra continuar o relógio da rua e mandar pra cá o bonde que
     acabou de chegar na esplanada */
  let aCadaQuadro=null;

  /* editor */
  const ED={ativo:false, modo:'pincel', pincel:16, pintando:0,
            pegou:null, mostrarMalha:true, mostrarPostos:true, sujo:false,
            sel:null, aviso:''};

  /* =======================================================
     MONTAGEM
     ======================================================= */
  function montar(opc){
    opc=opc||{};
    cv  = opc.canvas || document.getElementById('djPrincipal');
    ctx = null;
    aoTerminar = opc.aoTerminar || null;
    aCadaQuadro = opc.aCadaQuadro || null;

    /* rua, praça ou arredores: a cena vem do encontro que abriu a tela */
    let local = (opc.config||{}).local;
    tres = !!opc.tres || /-3d$/.test(String(local||''));
    if(tres){
      T = TO.diaJogo.tres;
      if(!T || !T.montar(cv, opc.sobre || document.getElementById('djSobre'))){
        /* sem WebGL: a mesma briga, vista de cima */
        tres = false; T = null;
        local = String(local||'').replace(/-3d$/, '');
        if(opc.config) opc.config.local = local;
        console.warn('cena 3D indisponível: abrindo a cena 2D');
      }
    }
    if(!tres && !ctx){
      ctx = cv.getContext('2d');
      if(!ctx) throw new Error('o canvas da cena já é WebGL; a cena 2D precisa de outro canvas');
    }
    /* os bonecos por cima do 2D: só quando quem monta passa o canvas e
       pede — e some quando não pede, porque no jogo o canvas é o mesmo
       elemento que a cena de perto usa */
    const sg = opc.sobreGL || null;
    bonecos = false;
    if(sg){
      sg.classList.remove('tres');
      /* o boneco em Three.js (bonecos3.js) quando a biblioteca está
         carregada; o renderizador próprio (tres.js) de reserva */
      const B3 = TO.diaJogo.bonecos3;
      if(!tres && opc.bonecos && B3 && B3.montar(sg)){
        bonecos = true; T = B3;
        sg.classList.add('sobre-gl'); sg.hidden = false;
      } else if(!tres && opc.bonecos && TO.diaJogo.tres && TO.diaJogo.tres.montar(sg, null)){
        bonecos = true; T = TO.diaJogo.tres;
        sg.classList.add('sobre-gl'); sg.hidden = false;
      } else if(!tres){ sg.classList.remove('sobre-gl'); sg.hidden = true; }
    }
    if(tres && cv) cv.classList.remove('sobre-gl');

    A.usarCena(local);
    montarBotoes();
    atualizarBotaoVelocidade();
    acharHudDeBancada();
    /* O PAD NA CENA DE PERTO, em qualquer largura. Na de cima ele só
       entra no celular; na de perto entra sempre, porque a cena é
       jogada olhando pro boneco e não pro teclado — e a cruz escreve
       nas mesmas teclas, que o renderizador converte pro rumo da
       câmera. */
    /* NO CELULAR A CENA É A TELA INTEIRA, aproximada no líder (ver
       `ajustarCanvasCelular`); a pinça de dois dedos ajusta o zoom
       (`ligarPinca`). */
    ajustarCanvasCelular();
    if(!redimensionarLigado){ redimensionarLigado=true; addEventListener('resize', ajustarCanvasCelular); }
    if(estreito() || tres){ montarPad(); ajustarCanvasCelular(); }   // o pad tira altura da cena: mede de novo
    else {
      const pad=$('djPad'); if(pad){ pad.hidden=true; if(pad.parentElement) pad.parentElement.classList.remove('com-pad'); }
      if(cv.parentElement) cv.parentElement.classList.remove('com-pad');
    }
    montarSliders();
    ligarEntrada();
    novaNoite(opc.config||{});
    if(!rodando){rodando=true; ant=performance.now(); requestAnimationFrame(quadro);}
  }

  let config={};
  function novaNoite(cfg){
    const fim=$('djFim'); if(fim) fim.remove();
    if(cfg) config=cfg;
    J = C.criarEstado(config); mira=null;
    TO.diaJogo.J = J;
    atualizarBotoes();
  }

  /* =======================================================
     LAÇO
     ======================================================= */
  /* =======================================================
     1× E 2× — SUB-PASSOS, NUNCA PASSO MAIOR

     O `dt` que vai pro `C.passo` é o passo da FÍSICA: colisão, dano,
     projétil, empurrão. Dobrá-lo não acelera o relógio, acelera a
     simulação com metade da resolução — disco atravessa parede, pedra
     erra a colisão e o dano por quadro dobra. É por isso que o
     `if(dt>0.05)` existe desde sempre.

     Em 2× o quadro chama `C.passo` DUAS VEZES com o mesmo `dt`. Custa o
     dobro de CPU de simulação e a física fica idêntica à de 1×.
     ======================================================= */
  let velocidade = 1;
  const velocidades = [1, 2];
  function alternarVelocidade(){
    velocidade = velocidades[(velocidades.indexOf(velocidade)+1) % velocidades.length];
    atualizarBotaoVelocidade();
    return velocidade;
  }
  function atualizarBotaoVelocidade(){
    const b = $('djVelocidade');
    if(!b) return;
    b.textContent = velocidade + '×';
    b.classList.toggle('rapido', velocidade > 1);
  }

  /* A CENA NÃO MORRE NUM QUADRO. Uma exceção dentro do
     requestAnimationFrame matava o laço: o canvas ficava com o último
     quadro (ou em branco, se a placa de vídeo tinha acabado de perder o
     contexto) e a briga congelava sem aviso — foi o que o dono viu na
     emboscada (06/09/2026). Agora cada parte do quadro é cercada: a
     simulação e o desenho 2D registram o erro e o laço continua; a
     camada dos bonecos, que é a mais pesada, se desliga no primeiro
     erro e a cena segue com o disco. */
  let errosDoQuadro = 0;
  function registrarErro(onde, e){
    errosDoQuadro++;
    if(errosDoQuadro <= 5 || errosDoQuadro % 200 === 0)
      console.error(`cena (${onde}, erro ${errosDoQuadro}):`, e && e.stack || e);
  }
  function desligarBonecos(motivo){
    if(!bonecos) return;
    bonecos = false;
    try{ if(T && T.limparDeCima) T.limparDeCima(); }catch(_){}
    const sg = $('djPrincipal3d') || $('djSobreGL');
    if(sg && sg !== cv){ sg.hidden = true; sg.classList.remove('sobre-gl'); }
    T = null;
    console.warn('bonecos desligados: ' + motivo);
    if(J) C.aviso(J, 'Bonecos desligados — a cena segue com os discos', '#e0b040');
  }
  /* O LAÇO PARA QUANDO A CENA FECHA (crash do celular, 07/09/2026).
     Ele nunca parava: com o palco escondido, a simulação e as duas
     camadas de desenho seguiam rodando por trás do feed até fechar a
     aba — e foi num quadro desses, com o canvas sem caixa, que o
     buffer WebGL cresceu até estourar o iPhone. Quem esconde o palco
     chama `parar`; e o próprio laço se desliga se a briga acabou e o
     canvas saiu da tela. `montar` religa. */
  function parar(){ rodando=false; }
  function cenaSumiu(){
    return !!(J && J.fase==='fim' && cv && !cv.getClientRects().length);
  }
  function quadro(agora){
    if(!rodando) return;
    if(cenaSumiu()){ rodando=false; return; }
    let dt=(agora-ant)/1000; ant=agora;
    if(dt>0.05) dt=0.05;           // aba que perdeu foco não teleporta ninguém
    dtQuadro=dt;
    try{
      /* na cena de perto o WASD é relativo à câmera: o renderizador resolve */
      teclas.vetor = (tres && T) ? T.vetorDoTeclado(teclas) : null;
      if(J && !ED.ativo){
        for(let i=0; i<velocidade; i++) C.passo(J,dt,teclas,true);
        /* a rua não para porque a briga começou: quem ainda estava andando
           chega no meio dela */
        if(aCadaQuadro)
          for(const b of (aCadaQuadro(dt*velocidade, J) || [])) C.reforcar(J, b);
      }
      /* a briga pode acabar sozinha: um lado sem ninguém de pé. Quem
         decide isso é o combate; aqui só se abre a tela. */
      if(J && J.acabou && J.fase==='acabando') encerrar(J.acabou.motivo);
    }catch(e){ registrarErro('simulação', e); }
    try{ desenhar(); }catch(e){ registrarErro('desenho', e); }
    try{ atualizarHUD(); }catch(e){ registrarErro('hud', e); }
    requestAnimationFrame(quadro);
  }

  /* =======================================================
     ZOOM PELA RODINHA

     Em 1× a cena inteira cabe no canvas, como sempre coube. Rolando
     pra cima a escala cresce até 4× e a câmera passa a seguir o disco
     do jogador — é ele que anda com WASD, então é ele que não pode
     sair do quadro. Sem líder de pé, segue quem sobrou do nosso lado.
     O `paraCena` continua certo de graça: ele lê `escala`, e a escala
     devolvida por `ajustar` já carrega o zoom e o deslocamento.
     ======================================================= */
  let zoom=1;
  const ZOOM_MAX=5;
  /* MAIS PERTO (pedido do dono, 08/09/2026): com a briga refinada nos
     bonecos, 2,4× já não deixava ler quem bate em quem. 3,4× no celular;
     o teto sobe junto pra pinça ainda ter pra onde ir. */
  const ZOOM_CELULAR=3.4;
  /* CELULAR: A CENA É A TELA INTEIRA (pedido do dono, 05/09/2026).
     O palco vira tela cheia pelo CSS (cenas.css, ≤900 px) e o pad fica
     por cima dela; aqui o canvas ganha a resolução da tela (até 1,5×
     de densidade) e o zoom sobe até a cena preencher a tela sem
     barra preta — o que, seguindo o líder, é a visão de perto que se
     queria. Volta ao tamanho original em tela larga. O canvas dos
     bonecos por cima segue o tamanho mostrado sozinho
     (tres.ajustarTamanho). */
  let redimensionarLigado=false, dprUsado=null;
  function ajustarCanvasCelular(){
    if(!cv || tres) return;
    cv._original = cv._original || {w:cv.width, h:cv.height};
    if(!estreito()){
      if(cv.width!==cv._original.w || cv.height!==cv._original.h){ cv.width=cv._original.w; cv.height=cv._original.h; }
      return;
    }
    /* A CAMADA 2D FICA NA DENSIDADE CHEIA (correção do dono, 08/09/2026):
       ela chegou a acompanhar a densidade adaptativa dos bonecos, e o
       nome do líder saía pixelado. Medido, a camada 2D não pesa; quem
       pesa é a 3D, e só ela desce de densidade. */
    const dpr = Math.min(1.5, devicePixelRatio||1);
    dprUsado = dpr;
    /* a caixa vem do CSS (a faixa fica com o topo, o resto é canvas);
       o buffer segue a caixa pra imagem não esticar */
    const rc = cv.getBoundingClientRect();
    const w = Math.round((rc.width||innerWidth)*dpr), h = Math.round((rc.height||innerHeight)*dpr);
    if(cv.width!==w || cv.height!==h){ cv.width=w; cv.height=h; }
    /* preencher: o zoom mínimo é o que faz a menor razão alcançar a maior */
    const enche = Math.max(w/A.W, h/A.H) / Math.min(w/A.W, h/A.H);
    zoom = U.limitar(Math.max(zoom, ZOOM_CELULAR, enche), 1, ZOOM_MAX);
  }
  function focoDoZoom(){
    if(!J) return null;
    const l=J.discos.find(d=>d.lider&&d.vivo);
    if(l) return l;
    const meu=C.ladoDoJogador(J);
    return J.discos.find(d=>d.lado===meu&&d.vivo) || null;
  }

  function ajustar(c,alvo,W,H){
    const s=Math.min(alvo.width/W, alvo.height/H)*zoom;
    let cx=W/2, cy=H/2;
    if(zoom>1){ const f=focoDoZoom(); if(f){cx=f.x; cy=f.y;} }
    /* o ponto de foco vai pro centro do canvas, mas a câmera não passa
       da borda da cena: encostou no canto, o foco sai do centro */
    let ox=alvo.width/2 - cx*s, oy=alvo.height/2 - cy*s;
    ox = W*s<=alvo.width  ? (alvo.width -W*s)/2 : U.limitar(ox, alvo.width -W*s, 0);
    oy = H*s<=alvo.height ? (alvo.height-H*s)/2 : U.limitar(oy, alvo.height-H*s, 0);
    c.setTransform(1,0,0,1,0,0);
    c.fillStyle='#0e0e0d'; c.fillRect(0,0,alvo.width,alvo.height);
    c.setTransform(s,0,0,s,ox,oy);
    return {s, ox, oy};
  }
  let escala={s:1,ox:0,oy:0};

  function desenhar(){
    if(!J) return;
    if(tres && T){ T.desenhar(J, {dt:dtQuadro}); return; }
    escala=ajustar(ctx,cv,A.W,A.H);
    C.desenhar(J,ctx,{editor:ED.ativo,
                      mostrarMalha:ED.ativo&&ED.mostrarMalha,
                      mostrarPostos:ED.ativo&&ED.mostrarPostos,
                      semCorpo:bonecos,
                      /* com boneco por cima, o nome e a marca do líder
                         vão pra camada de cima (desenharSobre) */
                      semNomeDoLider:bonecos});
    if(mira && !ED.ativo) desenharMira(ctx);
    if(ED.ativo) desenharEditor(ctx);
    ctx.setTransform(1,0,0,1,0,0);
    setaDoRival(ctx);
    /* o editor pinta a malha e arrasta marcador: ali o boneco atrapalha */
    if(bonecos && T){
      /* a placa de vídeo perdeu o contexto (bonecos3 avisa por `ativo`):
         o disco volta e a briga não para */
      if(T.ativo === false){ desligarBonecos('contexto WebGL perdido'); return; }
      try{
        if(!ED.ativo) T.desenharDeCima(J, {escala, cw:cv.width, ch:cv.height, dt:dtQuadro});
        else T.limparDeCima();
      }catch(e){ registrarErro('bonecos', e); desligarBonecos('erro no desenho: '+(e && e.message)); }
      try{ desenharSobre(); }catch(e){ registrarErro('sobre', e); }
    }
  }

  /* =======================================================
     A MARCA DO LÍDER POR CIMA DE TUDO (pedido do dono, 08/09/2026)
     O anel e o nome do líder eram pintados na camada 2D, que fica
     POR BAIXO dos bonecos: no meio da briga os outros corpos cobriam
     a marca e não dava pra saber quem se controla. Agora a camada
     `djSobre` — o canvas que fica acima da 3D — recebe, a cada
     quadro, um anel duplo no pé, uma seta pulsando sobre a cabeça e
     o nome numa etiqueta escura. Só pra quem o jogador controla: o
     mesmo disco que a câmera segue (`focoDoZoom`). Densidade cheia,
     sem pixel.
     ======================================================= */
  let sobreCtx = null, sobreCv = null;
  function desenharSobre(){
    const sc = $('djSobre');
    if(!sc) return;
    if(sobreCv !== sc){ sobreCv = sc; sobreCtx = sc.getContext('2d'); }
    if(!sobreCtx) return;
    if(sc.width !== cv.width || sc.height !== cv.height){ sc.width = cv.width; sc.height = cv.height; }
    /* a caixa CSS acompanha a do canvas principal (no celular ele não
       ocupa o palco inteiro: a faixa fica em cima e o pad embaixo) */
    if(sc.hidden) sc.hidden = false;
    /* em retângulos de tela, relativos ao pai posicionado da camada: o
       offsetParent do canvas principal não é o mesmo em toda largura */
    const rc = cv.getBoundingClientRect();
    const rp = sc.offsetParent ? sc.offsetParent.getBoundingClientRect() : {left:0, top:0};
    const l = Math.round(rc.left - rp.left)+'px', t = Math.round(rc.top - rp.top)+'px';
    const w = Math.round(rc.width)+'px', h = Math.round(rc.height)+'px';
    if(sc.style.left!==l || sc.style.top!==t || sc.style.width!==w || sc.style.height!==h){
      sc.style.left=l; sc.style.top=t; sc.style.width=w; sc.style.height=h;
    }
    const c = sobreCtx;
    c.setTransform(1,0,0,1,0,0);
    c.clearRect(0,0,sc.width,sc.height);
    const f = focoDoZoom();
    if(!f || !f.vivo || ED.ativo) return;
    const s = escala.s;
    c.setTransform(s,0,0,s,escala.ox,escala.oy);
    const x=f.x, y=f.y, r=f.r||7;
    /* o facho no chão: um halo dourado translúcido que os outros
       bonecos não cobrem, porque está na camada de cima */
    const halo = c.createRadialGradient(x, y, r*0.4, x, y, r+11);
    halo.addColorStop(0, 'rgba(255,211,90,.34)'); halo.addColorStop(1, 'rgba(255,211,90,0)');
    c.fillStyle = halo; c.beginPath(); c.arc(x,y,r+11,0,7); c.fill();
    /* o anel amarelo no pé saiu (pedido do dono, 09/09/2026): fica o
       halo, a seta e o nome */
    /* a seta pulsando sobre a cabeça, grande o bastante pra achar no bolo */
    const tt = (J && J.t) || 0, sobe = Math.sin(tt*5)*2;
    const ay = y - r - 25 + sobe, aw = 8, ah = 9.5;
    c.beginPath(); c.moveTo(x, ay+ah); c.lineTo(x-aw, ay); c.lineTo(x+aw, ay); c.closePath();
    c.fillStyle='#ffd35a'; c.fill();
    c.lineWidth = 1.8; c.strokeStyle='rgba(0,0,0,.85)'; c.stroke();
    /* o nome numa etiqueta escura; a letra tem teto pra não virar
       cartaz no zoom de 3,4× do celular */
    const nome = String(f.nome||'').toUpperCase();
    if(nome){
      const px = Math.max(9, Math.min(12, 33/s));
      c.font = `700 ${px}px "IBM Plex Mono",monospace`; c.textAlign='center'; c.textBaseline='middle';
      const tw = c.measureText(nome).width + 8, th = px + 5;
      const bx = x - tw/2, by = ay - th - 3;
      c.fillStyle='rgba(12,12,12,.82)';
      c.beginPath(); if(c.roundRect) c.roundRect(bx, by, tw, th, 2); else c.rect(bx, by, tw, th); c.fill();
      c.fillStyle='#ffd35a'; c.fillText(nome, x, by + th/2 + 0.5);
    }
    c.setTransform(1,0,0,1,0,0);
  }

  /* =======================================================
     A SETA DA BORDA (pedido do dono, 22/08/2026)

     Com a câmera perto, o bonde deles sai do quadro — e sem saber pra
     que lado correr o jogador anda em círculo. A seta encosta na borda
     do palco, no rumo do MIOLO do bonde inimigo (a média de quem ainda
     está de pé), e sai da tela no instante em que eles aparecem: seta
     apontando pra quem já se vê é enfeite.

     Desenhada em coordenada de TELA, depois de o mundo já ter sido
     pintado — por isso a matriz volta ao normal antes.
     ======================================================= */
  const MARGEM_SETA = 26;   // px de TELA entre a seta e a borda do palco
  /* onde a seta parou no último quadro (null = não teve seta). Serve de
     janela pra quem testa e pra quem depura: pixel não se pergunta. */
  let ultimaSeta = null;
  function corDoOutroBonde(){
    if(!J) return '#d9705f';
    const meu = C.ladoDoJogador(J);
    const b = (J.bondes_||[]).find(x=>x.lado !== meu);
    return (b && b.cor) || '#d9705f';
  }
  function setaDoRival(c){
    ultimaSeta = null;
    if(!J || J.fase === 'acabando' || ED.ativo) return;
    const eu = focoDoZoom();
    if(!eu) return;
    const meu = C.ladoDoJogador(J);
    let sx = 0, sy = 0, n = 0;
    for(const d of J.discos)
      if(d.vivo && d.lado !== meu){ sx += d.x; sy += d.y; n++; }
    if(!n) return;
    const alvo = {x: sx/n, y: sy/n};
    const px = alvo.x*escala.s + escala.ox, py = alvo.y*escala.s + escala.oy;
    /* já dá pra ver o miolo deles: a seta não tem o que dizer */
    if(px >= 0 && px <= c.canvas.width && py >= 0 && py <= c.canvas.height) return;

    const ex = eu.x*escala.s + escala.ox, ey = eu.y*escala.s + escala.oy;
    const dx = px - ex, dy = py - ey;
    const m = Math.hypot(dx, dy) || 1;
    /* caminha do disco do jogador na direção deles até bater na moldura */
    const L = MARGEM_SETA *
      (c.canvas.width / (cv.getBoundingClientRect().width || c.canvas.width));
    const W = c.canvas.width - L, H = c.canvas.height - L;
    let t = Infinity;
    if(dx > 0) t = Math.min(t, (W - ex)/dx);
    if(dx < 0) t = Math.min(t, (L - ex)/dx);
    if(dy > 0) t = Math.min(t, (H - ey)/dy);
    if(dy < 0) t = Math.min(t, (L - ey)/dy);
    if(!isFinite(t) || t < 0) return;
    const ax = U.limitar(ex + dx*t, L, W), ay = U.limitar(ey + dy*t, L, H);
    const ang = Math.atan2(dy, dx);
    ultimaSeta = {x:ax, y:ay, ang, alvo};

    /* O TAMANHO É DA TELA DE VERDADE, e não do buffer: o canvas tem
       1140 px de largura e aparece com 500 no celular, então uma seta
       desenhada em "pixels de buffer" chegaria ao dedo com menos da
       metade do tamanho. Aqui ela é medida em pixel de tela e
       convertida. */
    const k = c.canvas.width / (cv.getBoundingClientRect().width || c.canvas.width);
    c.save();
    c.translate(ax, ay);
    c.rotate(ang);
    c.scale(k, k);
    /* um disco escuro por baixo: a seta vive sobre telhado claro,
       asfalto e areia, e não pode sumir em nenhum dos três */
    c.fillStyle = 'rgba(0,0,0,.6)';
    c.beginPath(); c.arc(0, 0, 15, 0, 7); c.fill();
    c.fillStyle = corDoOutroBonde();
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(13, 0); c.lineTo(-7, -10); c.lineTo(-3, 0); c.lineTo(-7, 10);
    c.closePath(); c.fill(); c.stroke();
    c.restore();
  }


  /* =======================================================
     A MIRA DA BOMBA
     A bomba não sai mais no aperto: o aperto abre a mira, e a mira é
     um arco do líder até onde a bomba vai cair, com o raio de dano
     desenhado no chão — no espírito do Angry Birds, a grosso modo.
     Três jeitos de apontar, todos caindo no mesmo `mira`:
       · mouse: E abre, o ponto segue o mouse, clique (ou E de novo) joga;
       · pad/toque: segura BOMBA e arrasta — o ponto anda com o dedo
         (1,5 px de cena por px de tela) — e solta pra jogar;
       · toque curto no BOMBA: abre a mira; o próximo toque na cena é
         onde ela cai.
     Esc cancela. Fora do alcance o ponto é puxado pra borda do
     alcance, que aparece tracejada em volta do líder. A cena de perto
     (3D) continua jogando direto: lá a mira em arco não faz sentido
     de cima pra baixo.
     ======================================================= */
  let mira=null;   // {x,y, arrasto:{x0,y0,mexeu}|null}
  const liderVivo = ()=> J && J.discos.find(d=>d.lider&&d.vivo);
  function pontoAdiante(l){
    const a=P.alcanceBomba*0.55;
    return {x:l.x+Math.sin(l.rumo)*a, y:l.y+Math.cos(l.rumo)*a};
  }
  function limitarMira(){
    const l=liderVivo(); if(!l){ mira=null; return; }
    const dx=mira.x-l.x, dy=mira.y-l.y, d=Math.hypot(dx,dy);
    if(d>P.alcanceBomba){ mira.x=l.x+dx/d*P.alcanceBomba; mira.y=l.y+dy/d*P.alcanceBomba; }
  }
  function abrirMira(arrasto){
    if(!J) return false;
    if(tres){ C.arremessar(J,'bomba'); return false; }
    if(!C.podeArremessar(J,'bomba')){
      C.aviso(J, J.bombas<=0 ? 'Sem bomba na mochila.' : 'Bomba recarregando.', '#e0b040');
      return false;
    }
    const l=liderVivo(); if(!l) return false;
    const ini = (!arrasto && ultimoMouse) ? ultimoMouse : pontoAdiante(l);
    mira={x:ini.x, y:ini.y, arrasto:arrasto||null};
    limitarMira();
    return true;
  }
  function moverMira(x,y){ if(!mira) return; mira.x=x; mira.y=y; limitarMira(); }
  function soltarBomba(){
    if(!mira) return;
    limitarMira();
    if(mira) C.arremessar(J,'bomba',{x:mira.x, y:mira.y});
    mira=null;
  }
  function cancelarMira(){ mira=null; }
  /* E: abre a mira; com ela aberta, joga */
  function alternarMira(){ if(mira) soltarBomba(); else abrirMira(null); }
  let ultimoMouse=null;

  function desenharMira(c){
    const l=liderVivo(); if(!l){ mira=null; return; }
    limitarMira(); if(!mira) return;
    const alc=P.alcanceBomba, raio=C.RAIO_BOMBA||92;
    const puls=0.5+0.5*Math.sin(performance.now()/140);
    c.save();
    /* até onde dá pra jogar */
    c.setLineDash([4,7]); c.lineWidth=1; c.strokeStyle='rgba(255,255,255,.22)';
    c.beginPath(); c.arc(l.x,l.y,alc,0,7); c.stroke();
    /* a zona onde ela cai */
    c.setLineDash([]);
    c.fillStyle=`rgba(226,80,40,${0.10+0.08*puls})`;
    c.beginPath(); c.arc(mira.x,mira.y,raio,0,7); c.fill();
    c.lineWidth=2; c.strokeStyle=`rgba(255,120,70,${0.7+0.3*puls})`; c.stroke();
    c.strokeStyle='rgba(255,220,90,.95)'; c.lineWidth=1.5;
    c.beginPath(); c.moveTo(mira.x-7,mira.y-7); c.lineTo(mira.x+7,mira.y+7);
    c.moveTo(mira.x+7,mira.y-7); c.lineTo(mira.x-7,mira.y+7); c.stroke();
    /* o arco: mesma altura aparente que a bomba voando usa (36 px) */
    c.setLineDash([5,4]); c.lineWidth=2; c.strokeStyle='rgba(255,220,90,.9)';
    c.beginPath();
    for(let i=0;i<=24;i++){
      const k=i/24;
      const x=l.x+(mira.x-l.x)*k, y=l.y+(mira.y-l.y)*k - Math.sin(k*Math.PI)*36;
      if(i) c.lineTo(x,y); else c.moveTo(x,y);
    }
    c.stroke();
    c.setLineDash([]);
    c.fillStyle='#c8562f'; c.beginPath(); c.arc(l.x,l.y-14,5,0,7); c.fill();
    /* a dica fica pequena, junto do ponto — o aviso grande do HUD é
       pra coisa que acontece, não pra instrução */
    c.font='bold 11px system-ui, sans-serif'; c.textAlign='center';
    c.fillStyle='rgba(0,0,0,.55)';
    const dica = mira.arrasto ? 'solte pra jogar' : 'clique · E joga · Esc cancela';
    const tw=c.measureText(dica).width+10;
    c.fillRect(mira.x-tw/2, mira.y+raio+6, tw, 16);
    c.fillStyle='#ffd35a'; c.fillText(dica, mira.x, mira.y+raio+18);
    c.restore();
  }

  /* converte posição do mouse para coordenada da cena */
  function paraCena(e){
    const r=cv.getBoundingClientRect();
    const x=((e.clientX-r.left)*(cv.width/r.width)  - escala.ox)/escala.s;
    const y=((e.clientY-r.top )*(cv.height/r.height)- escala.oy)/escala.s;
    return {x,y};
  }

  /* =======================================================
     HUD
     ======================================================= */
  const $=id=>document.getElementById(id);

  /* =======================================================
     A HUD ENCOLHE COM O PALCO (22/08/2026)

     Com a cena cabendo na tela, o palco de um celular deitado tem 553
     px de largura — e as três placas somam mais que isso: elas se
     montavam umas sobre as outras. Container query resolveria, mas
     `container-type:inline-size` tira a largura do palco das mãos do
     conteúdo, e é justamente do conteúdo (o canvas) que ela vem. Então
     a medida é feita aqui, uma vez por mudança de tamanho, e vira uma
     classe. */
  let palcoLargo = null;
  function medirPalco(){
    if(!cv) return;
    const pai = cv.parentElement;
    if(!pai) return;
    const l = Math.round(cv.getBoundingClientRect().width);
    if(l === palcoLargo) return;
    palcoLargo = l;
    pai.classList.toggle('hud-mini', l < 760);
    medirFaixa();
  }
  /* =======================================================
     UMA LINHA OU DUAS, MAS SEMPRE ALINHADA (correção do dono,
     22/08/2026)

     Deixar o `flex-wrap` decidir sozinho dava o pior dos dois mundos:
     a faixa quebrava onde calhava e a segunda linha nascia empurrada
     pra direita, com um vão escuro à esquerda. Alinhamento não é
     acidente.

     Então a quebra passa a ser uma DECISÃO: mede-se o que a faixa
     precisa (a soma dos três assuntos, cada um sem quebra por dentro)
     contra o que ela tem. Não coube, entra a classe `duas` e a faixa
     vira duas linhas inteiras — tempo e PM ocupando a primeira de
     ponta a ponta, o placar sozinho na segunda. Cada linha cheia, sem
     sobra de um lado só.
     ======================================================= */
  let faixaChave = null;
  function medirFaixa(){
    const f = $('djFaixa');
    if(!f || !f.clientWidth) return;
    const pl = $('djPlacar');
    /* a conta só é refeita quando muda o que ela mede: a largura da
       faixa ou o texto do placar (nome novo, número que encolheu) */
    const chave = `${f.clientWidth}|${pl ? pl.textContent : ''}`;
    if(chave === faixaChave) return;
    faixaChave = chave;
    /* MEDIR É PERGUNTAR QUANTO PRECISA, e não quanto está ocupando: em
       linha única os assuntos se espremem pra caber e a soma daria
       sempre "coube"; em duas linhas a PM se estica e daria sempre
       "não coube" — a classe nunca mais sairia. Com `medindo` ninguém
       encolhe nem estica, e o transbordo diz a verdade. */
    f.classList.add('medindo');
    const precisa = f.scrollWidth > f.clientWidth;
    f.classList.remove('medindo');
    f.classList.toggle('duas', precisa);
  }
  /* =======================================================
     O PAD INTEIRO TEM DE CABER (correção do dono, 22/08/2026)

     Em pé, a tela tem 420 px e o pad pede mais: a fileira de ações
     cresceu (pedra, bomba, recuar, fugir, sair) e empurrou as
     formações 1–4 pra fora da tela — some o botão, some a formação. E
     como o número de ações MUDA com a cena (treta não tem pedra nem
     bomba), um corte fixo de largura acertaria numa cena e erraria na
     outra.

     Então é medida, e não chute: o que as duas colunas precisam contra
     o que a tela tem. Não cabendo lado a lado, as formações sobem pra
     uma linha só delas — a mesma régua da faixa lá em cima.
     ======================================================= */
  let padChave = null;
  /* O PAD É O RODAPÉ DA CENA (pedido do dono, 08/09/2026): uma linha
     só com os nove botões, embaixo do canvas e fora dele, e a bola de
     controle abaixo. Não há mais duas colunas pra medir — a linha
     divide a largura em partes iguais (mobile.css). A função fica
     porque é chamada do laço; não faz nada. */
  function medirPad(){ ajustarRotulosDoPad(); }
  /* o rótulo cabe ou o corpo desce: sem a fonte condensada carregada
     "DEFENDER" não entra em 38 px a 9 px, e rótulo cortado é botão sem
     nome. Mede uma vez por largura. */
  let rotulosChave = null;
  function ajustarRotulosDoPad(){
    const pad = $('djPad');
    if(!pad || pad.hidden || !pad.clientWidth) return;
    const bts = [...pad.querySelectorAll('.pad-acoes .pad-bt')];
    if(!bts.length) return;
    const chave = pad.clientWidth + '|' + bts.length + '|' + bts.map(b=>b.textContent).join(',');
    if(chave === rotulosChave) return;
    rotulosChave = chave;
    for(const b of bts) b.style.fontSize = '';
    const corta = () => bts.some(b => b.scrollWidth > b.clientWidth);
    let tam = 9;
    while(corta() && tam > 6.5){ tam -= 0.5; for(const b of bts) b.style.fontSize = tam + 'px'; }
  }

  addEventListener('resize', ()=>{
    palcoLargo = null; faixaChave = null; padChave = null; rotulosChave = null; medirPalco();
  });

  function atualizarHUD(){
    if(!J) return;
    medirPalco();
    const el=id=>$(id);

    if(el('djRelogio')){
      const m=18*60+Math.floor(J.t*0.6);
      el('djRelogio').textContent=
        `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    }
    if(el('djBarraAlerta')) el('djBarraAlerta').style.width=J.alerta+'%';
    if(el('djBarraPressao')){
      const bp=Math.min(100,J.sobPressao/P.aguentaPM*100);
      el('djBarraPressao').style.width=bp+'%';
      /* a fita da pressão só existe quando existe pressão */
      const faixa = el('djBarraPressao').parentElement;
      if(faixa) faixa.style.opacity = bp>0 ? 1 : 0;
      const rot = el('djRotPressao');
      if(rot) rot.style.opacity=(J.fracPM>0.05||bp>0)?1:0.35;
    }

    const btP=el('djBtPedra'), btB=el('djBtBomba');
    /* cena sem armas (treta marcada): os botões de arremesso somem */
    if(btP) btP.style.display = J.semArmas ? 'none' : '';
    if(btB) btB.style.display = J.semArmas ? 'none' : '';
    if(btP && !J.semArmas){const r=C.restaCd(J,'pedra'); btP.disabled=r>0;
      btP.firstChild.textContent=r>0?`Pedra ${r.toFixed(1)}s `:'Pedra ';}
    const btQ=el('djBtBater'); if(btQ) btQ.style.display = '';
    if(btB && !J.semArmas){const r=C.restaCd(J,'bomba'); btB.disabled=J.bombas<=0||r>0;
      btB.firstChild.textContent=r>0?`Bomba ${r.toFixed(1)}s `:'Bomba ';}
    if(el('djQtdBomba')) el('djQtdBomba').textContent=J.bombas;

    atualizarPad();

    const be=el('djBtEntrar');
    if(be){
      const s = D.saida || SAIDA_PADRAO;
      if(entradaDeVerdade()){
        /* nos arredores a ordem vale sempre, inclusive no meio da briga:
           o botão não fica cinza esperando o líder chegar no portão */
        be.disabled = !!J.entrando;
        be.firstChild.textContent = (J.entrando ? 'Indo pro portão'
                                                : 'Entrar pelo portão') + ' ';
      } else {
        const perto=!!C.noPortao(J); be.disabled=!perto;
        be.firstChild.textContent=(perto?s.perto:s.longe)+' ';
      }
    }

    const cg=el('djCarga');
    if(cg){
      if(!J.rompido){cg.textContent='';cg.className='';}
      else if(J.cargaEm===null){
        /* sem tropa de choque: o que aperta é a PM que já estava na cena */
        cg.textContent = J.t<J.cargaAte ? 'PM EM CIMA' : 'LINHA RECOMPOSTA';
        cg.className = J.t<J.cargaAte ? 'quente' : '';
      }
      else if(!J.tropaVeio){
        cg.textContent=`TROPA CHEGA EM ${Math.max(0,J.cargaEm-J.t).toFixed(1)}s`; cg.className='quente';
      } else if(J.t<J.cargaAte){
        cg.textContent=`CARGA EM CURSO · ${Math.max(0,J.cargaAte-J.t).toFixed(0)}s`; cg.className='quente';
      } else {cg.textContent='LINHA RECOMPOSTA'; cg.className='';}
    }

    if(el('djPlacar')){
      const ent=(J.entraram.mandante||0)+(J.entraram.visitante||0);
      /* O PLACAR FALA O NOME DAS TORCIDAS (pedido do dono, 18/08/2026):
         MANDANTE/VISITANTE é convenção interna dos lados, não coisa que
         se lê na rua. O nome vem do bonde do lado; no ataque ao bar o
         defensor não tem bonde e o nome é o da dona (rivalInfo). Só a
         bancada, que monta cena sem identidade, cai no rótulo antigo. */
      const nomeDoLado = lado=>{
        const b=(J.bondes_||[]).find(x=>x.lado===lado);
        if(b && b.nome) return b.nome;
        const nosso=(((J.bondes_||[]).find(x=>x.nossa))||{}).lado||'mandante';
        if(lado!==nosso && J.rivalInfo && J.rivalInfo.nome) return J.rivalInfo.nome;
        return lado==='mandante'?'MANDANTE':'VISITANTE';
      };
      /* O PLACAR É UM PLACAR DE TRANSMISSÃO (pedido do dono,
         22/08/2026): duas linhas de time com a tarja da cor do bonde,
         o nome e o número de pé alinhado à direita, e embaixo uma fita
         fina com o resto. Antes eram quatro linhas de texto solto com
         cor no atributo `style` — parecia depuração, não TV.
         A COR SAI DO BONDE quando o bonde tem cor: o placar passa a
         casar com as camisas em campo, em vez de dois tons fixos. */
      /* A TARJA É A CAMISA (régua do dono, 22/08/2026): as três cores
         da torcida, e não uma. A primária no corpo da tarja, a
         secundária na borda de cima e a terciária na de baixo — é
         assim que a faixa de uma organizada é. Torcida de duas cores
         repete a que tem; de uma só, a tarja fica lisa. */
      const padraoDoLado = lado => lado==='mandante' ? '#c0392b' : '#2a5fa8';
      /* =====================================================
         CADA TORCIDA NA SUA LINHA (correção do dono, 22/08/2026)

         O placar mostrava UMA torcida por lado e somava o resto nela:
         no Castelão, os 30 da Jovem Garra Tricolor entravam na conta da
         TUF e a faixa dizia "Leões da TUF 187". Mas na arquibancada
         quem está lá são três torcidas, e cada uma responde pelo seu
         número.

         A conta sai do disco, que já sabe de que torcida é
         (`d.torcida`, posto em `nascerGrupo`), e a lista é montada com
         TODOS os discos, vivos ou não: torcida que foi inteira ao chão
         continua na faixa com zero. Sumir do placar seria a faixa
         contando outra história que a cena.
         ===================================================== */
      const torcidasNaCena = ()=>{
        const fora = [];
        for(const d of J.discos){
          const nome = d.torcida || nomeDoLado(d.lado);
          let g = fora.find(x=>x.nome === nome && x.lado === d.lado);
          if(!g) fora.push(g = {nome, lado:d.lado, n:0, total:0,
                                c1: d.cor || padraoDoLado(d.lado),
                                c2: d.cor2 || d.cor || padraoDoLado(d.lado),
                                c3: d.cor3 || d.cor2 || d.cor ||
                                    padraoDoLado(d.lado)});
          g.total++;
          if(d.vivo) g.n++;
        }
        /* mandante primeiro, como sempre foi; dentro do lado, o maior */
        return fora.sort((a,b)=>
          (a.lado==='mandante'?0:1) - (b.lado==='mandante'?0:1) ||
          b.total - a.total);
      };
      const linhaDoTime = g =>
        `<div class="pl-time" style="--c1:${g.c1};--c2:${g.c2};--c3:${g.c3}">`+
          `<span class="pl-nome">${g.nome}</span>`+
          `<span class="pl-n">${g.n}</span></div>`;
      const rodape = [
        `<span class="pl-dado"><i>caídos</i>`+
        `${J.caidos.mandante}–${J.caidos.visitante}</span>`];
      /* "entraram" só existe onde há portão pra entrar */
      if(entradaDeVerdade())
        rodape.push(`<span class="pl-dado"><i>entraram</i>${ent}</span>`);
      /* NA FAIXA É TUDO UMA LINHA (22/08/2026): os dois times lado a
         lado e o resto emendado à direita, em vez do bloco de duas
         fileiras que a placa flutuante usava. */
      el('djPlacar').innerHTML=
        `<div class="pl-times">`+
        `${torcidasNaCena().map(linhaDoTime).join('')}</div>`+
        `<div class="pl-rodape">${rodape.join('')}`+
        `<span class="pl-clima ${J.paz?'calmo':'pesado'}">`+
        `<span class="rot-clima">clima </span>`+
        `${J.paz?'tranquilo':'pesado'}</span></div>`;
      /* nome e número mudam de largura no meio da briga (10 → 9, um
         escalão que some): a conta da quebra é refeita junto */
      medirFaixa();
    }

    const av=el('djAviso');
    if(av){
      if(J.aviso && J.t<J.avisoAte){av.textContent=J.aviso.txt;av.style.color=J.aviso.cor;av.style.opacity=1;}
      else av.style.opacity=0;
    }

    atualizarHudDeBancada();
  }

  /* =======================================================
     A HUD QUE SÓ A BANCADA TEM

     Local, log, subrelógio e a tira de dicas saíram do palco do jogo:
     eram `hidden` no `index.html` e o `atualizarHUD` continuava
     escrevendo neles a sessenta quadros por segundo — elemento
     invisível que o código atualiza é dívida disfarçada.

     Na bancada eles são a razão de a bancada existir, então continuam
     lá. Os nós são resolvidos UMA vez por cena e o bloco inteiro sai do
     quadro quando não existem, em vez de quatro `if` que nunca dão em
     nada. */
  let hudBancada = null;
  function acharHudDeBancada(){
    const n = {sub:$('djSubrelogio'), local:$('djLocal'),
               log:$('djLog'), dica:$('djDica')};
    hudBancada = (n.sub || n.local || n.log || n.dica) ? n : null;
  }
  function atualizarHudDeBancada(){
    if(!hudBancada) return;
    const n = hudBancada;
    if(n.sub) n.sub.textContent = ED.ativo
      ? 'editor de cena — jogo pausado'
      : (D.nome ? 'na '+D.nome.toLowerCase() : 'nos arredores');
    if(n.local) n.local.textContent = D.local || 'Nos arredores';
    if(n.log && n.log.dataset.n != String(J.log.length)){
      n.log.dataset.n = String(J.log.length);
      n.log.innerHTML = J.log.map(l=>`<div class="${l.cor}">${l.txt}</div>`).join('');
    }
    /* cena de invasão: enquanto a casa não acordou, isso é o que
       importa saber — e some no instante em que gritam lá dentro */
    const espera = D.gatilho && !J.acordou && D.gatilho.espera;
    if(n.dica) n.dica.innerHTML = ED.ativo
      ? '<kbd>F2</kbd> sair do editor'
      : espera
      ? `<b style="color:var(--ouro)">${espera.toUpperCase()}</b> · `+
        '<kbd>WASD</kbd> líder · <kbd>1</kbd>–<kbd>4</kbd> formação'
      : tres
      ? '<kbd>WASD</kbd> líder (pra onde a câmera olha) · <kbd>Q</kbd> bater · <kbd>E</kbd> defender · '+
        '<kbd>2</kbd> pedra · <kbd>3</kbd> bomba · <kbd>R</kbd> recuar · <kbd>X</kbd> fugir · <kbd>C</kbd> câmera · '+
        'arrastar gira · roda aproxima'
      : '<kbd>WASD</kbd> líder · <kbd>Q</kbd> bater · <kbd>E</kbd> defender (segurar) · <kbd>F</kbd> agarrar · '+
        '<kbd>C</kbd> chamar · <kbd>2</kbd> pedra · <kbd>3</kbd> mira da bomba (clique joga) · <kbd>R</kbd> recuar · '+
        '<kbd>X</kbd> fugir · rodinha = zoom · <kbd>F2</kbd> editor de cena';
  }

  /* =======================================================
     BOTÕES E ENTRADA
     ======================================================= */
  /* a cena tem portão de estádio de verdade? só os arredores. Na
     arquibancada (estadio-*) o mesmo botão é a SAÍDA pelo túnel, com
     os textos que a cena declara. */
  const entradaDeVerdade = () => !A.D.id || A.D.id === 'arredores';

  function montarBotoes(){
    const cf=$('djFormacoes');
    if(cf && !cf.childElementCount && Object.keys(C.FORMACOES).length > 1){
      for(const [id,f] of Object.entries(C.FORMACOES)){
        const b=document.createElement('button');
        b.className='form-btn'; b.dataset.f=id;
        b.innerHTML=`${f.nome}<small>${f.tecla}</small>`;
        b.onclick=()=>{J.form=id;atualizarBotoes();};
        cf.appendChild(b);
      }
    }
    const liga=(id,fn)=>{const e=$(id); if(e) e.onclick=fn;};
    liga('djBtPedra', ()=>C.arremessar(J,'pedra'));
    liga('djBtBomba', alternarMira);
    liga('djBtBater', ()=>{ if(J) C.bater(J, liderVivo()); });
    liga('djBtRecuar',()=>{C.alternarRecuo(J);atualizarBotoes();});
    liga('djBtFugir', mandarCorrer);
    liga('djVelocidade', alternarVelocidade);
    liga('djBtEntrar', mandarEntrarOuSair);
  }
  /* O botão e o ENTER fazem a MESMA coisa.
     Antes o atalho tinha caminho próprio — `noPortao` e encerra —, e
     enquanto o portão do jogador estava selado isso nunca rodava, então
     ninguém viu. Com a rota aberta, apertar ENTER nos arredores voltaria
     a acabar a cena com o líder entrando sozinho, que é exatamente o que
     a ordem de entrar veio corrigir. */
  function mandarEntrarOuSair(){
    const s = D.saida || SAIDA_PADRAO;
    /* NOS ARREDORES O BOTÃO É UMA ORDEM.
       Todo mundo caminha pro próprio portão e a cena fecha quando
       todos entraram — quem encerra é `conferirEntrada`, no combate.
       Nas outras cinco cenas não há portão pra entrar: ali o mesmo
       botão continua sendo a SAÍDA da cena, com o líder no ponto e os
       textos que a cena declara. */
    if(entradaDeVerdade()){
      if(!C.mandarEntrar(J)) C.logar(J, 'Não sobrou ninguém pra entrar.', 'p');
      atualizarBotoes();
      return;
    }
    if(!C.noPortao(J)){ C.logar(J, s.dica, 'p'); return; }
    const l=J.discos.find(d=>d.lider&&d.vivo);
    if(l) C.entrarNoEstadio(J, l);
    encerrar(s.feito, {objetivo:true});
  }
  /* A ORDEM DE CORRER, do botão e da tecla F: quem manda é o combate,
     aqui só se pinta o que sobrou de escolha. */
  function mandarCorrer(){
    if(!J) return;
    if(!C.mandarFugir(J)) C.logar(J, 'Não sobrou ninguém pra correr.', 'p');
    atualizarBotoes();
    marcarFugaNoPad();
  }
  function atualizarBotoes(){
    U.$$('.form-btn').forEach(b=>b.classList.toggle('on', b.dataset.f===J.form));
    const br=$('djBtRecuar');
    if(br&&br.firstChild){
      br.firstChild.textContent=J.recuando?'Voltar pra briga ':'Recuar ';
      br.style.borderColor=J.recuando?'var(--ouro)':'#3d3d39';
      br.style.color=J.recuando?'var(--ouro)':'var(--texto)';
    }
    /* dada a ordem, não há o que desfazer: o bonde já virou as costas.
       Os botões de briga apagam junto, senão ficam prometendo pedra e
       recuo pra quem está correndo. */
    const correndo = C.emFuga(J);
    for(const id of ['djBtFugir','djBtRecuar','djBtPedra','djBtBomba','djBtBater']){
      const b = $(id);
      if(b){ b.disabled = correndo; b.classList.toggle('gasto', correndo); }
    }
  }
  function marcarFugaNoPad(){
    const pad = $('djPad');
    if(!pad || !J) return;
    const correndo = C.emFuga(J);
    pad.querySelectorAll('.pad-x, .pad-r, .pad-2, .pad-3, .pad-q, .pad-f, .pad-c').forEach(b=>{
      b.disabled = correndo; b.classList.toggle('gasto', correndo);
    });
  }

  /* =======================================================
     OS SLIDERS SÃO DA BANCADA, E O "NOVA NOITE" VAI COM ELES

     O botão era anexado a `cs.parentElement`, e no jogo o pai do
     `#djSliders` é o próprio `#djPalco`: os sliders sumiam porque o
     painel estava `hidden`, e o botão ficava plantado no meio da cena.
     Remontar a noite é o ponto da bancada; no jogo a noite é uma só, e
     recomeçá-la não quer dizer nada.
     ======================================================= */
  function montarSliders(){
    const cs=$('djSliders');
    if(!cs || cs.hidden || cs.childElementCount) return;
    if(getComputedStyle(cs).display === 'none') return;
    const LISTA=[
      ['efetivo','Efetivo mandante',6,120,2,v=>v],
      ['efetivoRival','Efetivo visitante',6,120,2,v=>v],
      ['velocidade','Velocidade',30,160,2,v=>v],
      ['dano','Intensidade do dano',0.5,3,0.1,v=>v.toFixed(1)+'×'],
      ['vidaGrade','Resistência da grade',150,900,25,v=>v],
      ['forcaPM','Força do cassetete',10,60,2,v=>v],
      ['debandada','Debandada em',20,80,5,v=>v+'%'],
      ['atrasoCarga','Demora da carga',0,20,1,v=>v+'s'],
      ['tropaCarga','Tropa de choque',2,16,1,v=>v+' PM'],
      /* a barra enche nesse tempo de pressão; ela não recua mais o bonde
         sozinho — quem recua é o jogador, ou a debandada por baixas */
      ['aguentaPM','Tempo pra barra de pressão encher',3,20,1,v=>v+'s'],
      ['chancePaz','Chance de noite tranquila',0,100,5,v=>v+'%'],
      ['cdPedra','Recarga da pedra',0.5,6,0.1,v=>v.toFixed(1)+'s'],
      ['alcancePedra','Alcance da pedra',80,320,10,v=>v+'px'],
      /* o relógio da cena anda 0,6 min por segundo: 150 min são 4 min
         de espera até o pessoal entrar. Baixar isto é o jeito de ver a
         noite tranquila inteira sem esperar a noite inteira. */
      ['minutosAteJogo','Falta pro jogo',10,240,10,v=>v+' min']
    ];
    for(const [k,rot,mi,ma,pa,fmt] of LISTA){
      const d=document.createElement('div'); d.className='slider';
      d.innerHTML=`<label>${rot}<b>${fmt(P[k])}</b></label>
        <input type="range" min="${mi}" max="${ma}" step="${pa}" value="${P[k]}">`;
      const i=d.querySelector('input');
      i.oninput=()=>{P[k]=parseFloat(i.value); d.querySelector('b').textContent=fmt(P[k]);};
      cs.appendChild(d);
    }
    const b=document.createElement('button');
    b.className='acao-btn'; b.style.marginTop='6px';
    b.textContent='Nova noite';
    b.onclick=novaNoite;
    cs.parentElement.appendChild(b);
  }

  /* =======================================================
     O PAD DE TOQUE (só em tela estreita)

     No celular não dá pra apertar tecla com o jogo rodando. O pad NÃO
     implementa lógica nenhuma: cada botão escreve no MESMO objeto
     `teclas` que o teclado alimenta, e as ações de uma tecolada só (Q, E,
     R, formação) chamam exatamente o que `montarBotoes` já chama. Por
     isso `combate.js` quase não sabe que existe celular: as ações passam
     todas pelo mesmo `teclas`. A ÚNICA coisa que ele aprendeu foi a ler
     `teclas.eixo` — a bola de controle (pedido do dono, 22/08/2026)
     entrega um VETOR, e não quatro liga-desliga, então o líder anda em
     qualquer ângulo e não só nos oito da cruz antiga.

     `pointerdown` e não `click`: click só dispara quando o gesto termina,
     e pedra e bomba têm de sair no toque. `setPointerCapture` por botão
     faz o multitoque valer e garante que o dedo que escorrega pra fora
     solte a tecla — sem isso W fica presa e o líder anda sozinho.
     ======================================================= */
  /* =======================================================
     A BOLA DE CONTROLE (pedido do dono, 22/08/2026)

     A cruz de WASD saiu do celular. No lugar dela um direcional de
     joystick: o dedo encosta em qualquer ponto da base, o núcleo
     acompanha até a borda e o que sai daí é um VETOR — direção livre,
     qualquer ângulo, e não os oito cantos que quatro botões davam.

     O vetor mora em `teclas.eixo`, o mesmo objeto que o teclado
     alimenta, então nada além de `moverLider` precisou mudar. Soltar o
     dedo zera o vetor e devolve o núcleo ao centro; sem isso o líder
     sairia andando sozinho, que é o mesmo mal que o `setPointerCapture`
     evitava na cruz.

     A ZONA MORTA existe porque dedo em vidro treme: um toque parado no
     centro não pode virar caminhada. Fora dela a velocidade é cheia —
     direção é do jogador, passo é do jogo.
     ======================================================= */
  const BOLA_RAIO = 46;     // px do centro até a borda do curso
  const BOLA_MORTA = 0.16;  // fração do curso que não conta como direção

  function bolaDeControle(){
    const base = document.createElement('div');
    base.className = 'pad-bola';
    const nucleo = document.createElement('div');
    nucleo.className = 'pad-bola-nucleo';
    for(const lado of ['n','l','s','o'])
      base.appendChild(el2('div', 'pad-bola-seta seta-'+lado));
    base.appendChild(nucleo);

    let dedo = null;
    const parar = ()=>{
      dedo = null;
      teclas.eixo = null;
      base.classList.remove('apertado');
      nucleo.style.transform = 'translate(-50%, -50%)';
    };
    const mirar = ev=>{
      const r = base.getBoundingClientRect();
      let x = ev.clientX - (r.left + r.width/2);
      let y = ev.clientY - (r.top + r.height/2);
      const d = Math.hypot(x, y);
      /* o núcleo para na borda, mas o dedo pode passar dela: o ângulo
         continua valendo com o dedo longe, que é como joystick funciona */
      if(d > BOLA_RAIO){ x = x/d*BOLA_RAIO; y = y/d*BOLA_RAIO; }
      nucleo.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      const f = Math.min(1, d / BOLA_RAIO);
      teclas.eixo = f < BOLA_MORTA ? null : {x: x/(d||1), y: y/(d||1)};
    };
    base.addEventListener('pointerdown', ev=>{
      ev.preventDefault();
      try{ base.setPointerCapture(ev.pointerId); }catch(_){}
      dedo = ev.pointerId;
      base.classList.add('apertado');
      mirar(ev);
    });
    base.addEventListener('pointermove', ev=>{
      if(dedo === null || ev.pointerId !== dedo) return;
      ev.preventDefault();
      mirar(ev);
    });
    for(const q of ['pointerup','pointercancel','lostpointercapture'])
      base.addEventListener(q, ev=>{ if(ev) ev.preventDefault(); parar(); });
    base.addEventListener('contextmenu', ev=>ev.preventDefault());
    return base;
  }
  const el2 = (tag, cls)=>{
    const n = document.createElement(tag); n.className = cls; return n;
  };

  const LIMIAR_ESTREITO = 900;
  const estreito = () => innerWidth <= LIMIAR_ESTREITO;
  let padMontado = false;

  function montarPad(){
    if(!cv) return;
    /* o pad mora no PALCO, depois do canvas, e não dentro da caixa dos
       canvases: é o rodapé da coluna faixa → cena → pad (mobile.css) */
    const pai = $('djPalco') || cv.parentElement || document.body;
    if(!pai) return;
    if(padMontado){
      const pad=$('djPad');
      if(pad){ pad.hidden=false; if(pad.parentElement!==pai) pai.appendChild(pad); }
      pai.classList.add('com-pad');
      return;
    }
    padMontado = true;
    /* com o pad na tela, o HUD de comandos vira só o botão do portão
       (ver cenas.css): pedra, bomba, recuar e formação já estão no pad */
    pai.classList.add('com-pad');

    const caixa = document.createElement('div');
    caixa.id = 'djPad'; caixa.className = 'dj-pad';

    const botao = (rot, cls, aoTocar, aoSoltar)=>{
      const b = document.createElement('button');
      b.className = 'pad-bt ' + cls;
      b.textContent = rot;
      b.addEventListener('pointerdown', ev=>{
        ev.preventDefault();
        try{ b.setPointerCapture(ev.pointerId); }catch(_){}
        b.classList.add('apertado');
        aoTocar();
      });
      const solta = ev=>{
        if(ev) ev.preventDefault();
        b.classList.remove('apertado');
        if(aoSoltar) aoSoltar();
      };
      b.addEventListener('pointerup', solta);
      b.addEventListener('pointercancel', solta);
      b.addEventListener('lostpointercapture', solta);
      b.addEventListener('contextmenu', ev=>ev.preventDefault());
      return b;
    };
    /* tecla de disparo: o mesmo caminho do botão do HUD */
    const disparo = (k, rot, fn) => botao(rot, 'pad-acao pad-'+k, ()=>{
      teclas[k]=true; fn();
      setTimeout(()=>{teclas[k]=false;}, 60);
    });

    const acoes = document.createElement('div');
    acoes.className = 'pad-acoes';
    /* BOMBA é segurar e arrastar: o ponto de queda anda com o dedo e
       a bomba sai quando solta. Toque curto só abre a mira — aí o
       próximo toque na cena é onde ela cai (ver A MIRA DA BOMBA). */
    const bomba = document.createElement('button');
    bomba.className = 'pad-bt pad-acao pad-e'; bomba.textContent = 'BOMBA';
    bomba.addEventListener('pointerdown', ev=>{
      ev.preventDefault();
      try{ bomba.setPointerCapture(ev.pointerId); }catch(_){}
      bomba.classList.add('apertado');
      teclas.e=true; setTimeout(()=>{teclas.e=false;}, 60);
      if(mira){ soltarBomba(); return; }
      abrirMira({x0:ev.clientX, y0:ev.clientY, mexeu:false});
    });
    bomba.addEventListener('pointermove', ev=>{
      if(!mira || !mira.arrasto) return;
      const a=mira.arrasto, l=liderVivo(); if(!l) return;
      const dx=ev.clientX-a.x0, dy=ev.clientY-a.y0;
      if(Math.hypot(dx,dy)>10) a.mexeu=true;
      if(a.mexeu) moverMira(l.x+dx*1.5, l.y+dy*1.5);
    });
    const soltaBomba = ev=>{
      if(ev) ev.preventDefault();
      bomba.classList.remove('apertado');
      if(!mira || !mira.arrasto) return;
      if(mira.arrasto.mexeu) soltarBomba();
      else mira.arrasto=null;
    };
    bomba.addEventListener('pointerup', soltaBomba);
    bomba.addEventListener('pointercancel', soltaBomba);
    bomba.addEventListener('contextmenu', ev=>ev.preventDefault());
    /* Q bate (toque), E defende (segurar), R recua; pedra e bomba
       ficam do outro lado, nos números 2 e 3 */
    const defender = botao('DEFENDER', 'pad-acao pad-e', ()=>{ teclas.e=true; }, ()=>{ teclas.e=false; if(J) C.soltarDefesa(J, liderVivo()); });
    /* OS MAIS USADOS NA LINHA DE CIMA, MAIORES (pedido do dono,
       08/09/2026): bater, defender, pedra e bomba; o resto embaixo */
    const principais = document.createElement('div');
    principais.className = 'pad-acoes pad-principais';
    principais.append(
      disparo('q','BATER', ()=>{ if(J){ const l=liderVivo(); if(l) C.bater(J, l); } }),
      defender);
    acoes.append(
      disparo('r','RECUAR',()=>{ if(J){ C.alternarRecuo(J); atualizarBotoes(); } }),
      disparo('f','AGARRAR',()=>{ if(J){ const l=liderVivo(); if(l) C.agarrar(J, l); } }),
      disparo('c','CHAMAR',()=>{ if(J) C.chamar(J, C.ladoDoJogador(J)); }),
      /* FUGIR SAIU DO F (que virou agarrar) e foi pro X */
      disparo('x','FUGIR', ()=>{ mandarCorrer(); }),
      /* O PORTÃO/SAÍDA VEIO PRO PAD (decisão do dono, 22/08/2026): ele
         era o último botão em cima do palco, com o rótulo comprido
         atravessado no meio da briga. Aqui o rótulo é curto e o estado
         (ligado/desligado) sai do mesmo lugar que o do HUD. */
      disparo('enter','SAIR', ()=>{ mandarEntrarOuSair(); }));
    /* pedra e bomba fecham a mesma linha (os números 2 e 3 são do
       teclado, não dizem nada no dedo) */
    const pedra = botao('PEDRA', 'pad-acao pad-2', ()=>{ if(J) C.arremessar(J,'pedra'); });
    bomba.className = 'pad-bt pad-acao pad-3'; bomba.textContent = 'BOMBA';
    principais.append(pedra, bomba);
    const linhas = document.createElement('div');
    linhas.className = 'pad-linhas';
    linhas.append(principais, acoes);
    const linhaBola = document.createElement('div');
    linhaBola.className = 'pad-bola-linha';
    linhaBola.appendChild(bolaDeControle());
    caixa.append(linhas, linhaBola);
    pai.appendChild(caixa);
  }

  function marcarFormacaoNoPad(){ /* só existe o Quadrado */ }

  /* a recarga da pedra e o estoque de bomba aparecem no pad, como no HUD */
  function atualizarPad(){
    const pad = $('djPad');
    if(!pad || !J) return;
    const q = pad.querySelector('.pad-2'), e = pad.querySelector('.pad-3');
    if(q){ q.style.display = J.semArmas ? 'none' : '';
           q.classList.toggle('gasto', C.restaCd(J,'pedra') > 0); }
    if(e){ e.style.display = J.semArmas ? 'none' : '';
           e.classList.toggle('gasto', J.bombas <= 0 || C.restaCd(J,'bomba') > 0); }
    /* o botão de sair do pad espelha o do HUD: mesmo estado, mesma
       porta — nos arredores a ordem vale sempre, nas outras cenas só
       com o líder no ponto */
    const sai = pad.querySelector('.pad-enter');
    if(sai){
      const be = $('djBtEntrar');
      sai.disabled = be ? be.disabled : false;
      sai.classList.toggle('gasto', sai.disabled);
      sai.textContent = entradaDeVerdade() ? 'PORTÃO' : 'SAIR';
    }
    marcarFormacaoNoPad();
    marcarFugaNoPad();
    medirPad();
  }

  /* UMA VEZ SÓ. `montar` roda a cada cena aberta — troca de aba na
     bancada, cada briga do jogo — e os ouvintes iam se empilhando no
     mesmo canvas e na mesma janela: com duas cenas abertas, uma tecla
     Q jogava duas pedras, a rodinha dava zoom dobrado e o F2 abria e
     fechava o editor no mesmo aperto (que foi como isto apareceu). */
  let entradaLigada=false;
  function ligarEntrada(){
    if(entradaLigada) return;
    entradaLigada=true;
    addEventListener('keydown',e=>{
      const k=e.key.toLowerCase();
      teclas[k]=true;
      if(k==='f2'){e.preventDefault(); alternarEditor(); return;}
      if(k==='c' && tres && T && J){ C.aviso(J, 'câmera '+T.trocarCamera(), '#e0b040'); return; }
      if(ED.ativo){
        if(k==='[') ED.pincel=Math.max(4,ED.pincel-4);
        if(k===']') ED.pincel=Math.min(80,ED.pincel+4);
        if(k==='m') ED.mostrarMalha=!ED.mostrarMalha;
        if((k==='delete'||k==='backspace') && ED.mouse) apagarSob(ED.mouse.x, ED.mouse.y);
        return;
      }
      if(!J) return;
      if(k==='r'){C.alternarRecuo(J);atualizarBotoes();}
      if(k==='x'){C.mandarFugir(J);atualizarBotoes();}
      if(k==='q'){ const l=liderVivo(); if(l) C.bater(J, l); }
      if(k==='f'){ const l=liderVivo(); if(l) C.agarrar(J, l); }
      if(k==='c'){ C.chamar(J, C.ladoDoJogador(J)); }
      /* E é segurar: a defesa é lida por `teclas.e` no moverLider;
         SOLTAR o E na hora do golpe é o contragolpe */
      if(k==='2') C.arremessar(J,'pedra');
      if(k==='3') alternarMira();
      if(k==='escape') cancelarMira();
      if(k==='enter') mandarEntrarOuSair();
    });
    addEventListener('keyup',e=>{ const k=e.key.toLowerCase(); if(k==='e' && teclas.e && J) C.soltarDefesa(J, liderVivo()); teclas[k]=false; });

    /* rodinha = zoom. `passive:false` porque sem o preventDefault a
       página rola junto e o zoom vira briga com o scroll. O passo é
       exponencial pra rodinha de degrau (±100) e trackpad (deltas
       miúdos) andarem na mesma velocidade percebida. */
    cv.addEventListener('wheel',e=>{
      e.preventDefault();
      zoom=U.limitar(zoom*Math.exp(-e.deltaY*0.0018), 1, ZOOM_MAX);
    },{passive:false});

    ligarPinca();
    cv.addEventListener('contextmenu',e=>{if(ED.ativo)e.preventDefault();});
    cv.addEventListener('pointerdown',e=>{
      if(mira && !ED.ativo && e.button===0){
        e.preventDefault();
        const p=paraCena(e); moverMira(p.x,p.y); soltarBomba();
        return;
      }
      if(!ED.ativo) return;
      e.preventDefault();
      const p=paraCena(e);
      const apagando = (e.button===2 || e.shiftKey);
      if(ED.modo!=='pincel'){
        if(apagando){ apagarSob(p.x,p.y); return; }
        if(ED.modo==='marcador'){ ED.pegou=acharMarcador(p.x,p.y); return; }
        if(ED.modo==='grade'){
          const g=novaGrade(p.x,p.y); selecionar(g);
          ED.pegou={mover:(nx,ny)=>{ g.ate.x=Math.round(nx); g.ate.y=Math.round(ny);
                                    ajustarModulos(g); regrade(); pintarBarraGrade(); }};
          ED.sujo=true; return;
        }
        if(ED.modo==='pm'){
          D.pmPostos.push({x:Math.round(p.x), y:Math.round(p.y)});
          ED.sujo=true; return;
        }
        if(ED.modo==='fuga'){
          (D.fugas = D.fugas || []).push({x:Math.round(p.x), y:Math.round(p.y), raio:34});
          mexeuNasFugas(); return;
        }
        if(ED.modo==='tropa'){
          D.tropaEm={x:Math.round(p.x), y:Math.round(p.y)};
          ED.sujo=true; return;
        }
      }
      ED.pintando = (e.button===2||e.shiftKey) ? 2 : 1;
      A.pintar(p.x,p.y,ED.pincel, ED.pintando===1);
      ED.sujo=true;
    });
    addEventListener('pointermove',e=>{
      if(!ED.ativo){
        if(e.pointerType!=='touch'){ ultimoMouse=paraCena(e); }
        if(mira && !mira.arrasto && e.pointerType!=='touch') moverMira(ultimoMouse.x, ultimoMouse.y);
        return;
      }
      const p=paraCena(e);
      ED.mouse=p;
      if(ED.pegou){ ED.pegou.mover(p.x,p.y); ED.sujo=true; return; }
      if(ED.pintando){ A.pintar(p.x,p.y,ED.pincel, ED.pintando===1); ED.sujo=true; }
    });
    addEventListener('pointerup',()=>{
      if(!ED.ativo) return;
      if(ED.pintando||ED.pegou) A.limparCampos();   // navegação depende da malha
      ED.pintando=0; ED.pegou=null;
    });

    /* arrastar imagem pra dentro da tela */
    addEventListener('dragover',e=>{e.preventDefault(); mostrarAlvoSolta(true);});
    addEventListener('dragleave',()=>mostrarAlvoSolta(false));
    addEventListener('drop',e=>{
      e.preventDefault(); mostrarAlvoSolta(false);
      const f=e.dataTransfer.files&&e.dataTransfer.files[0];
      if(f&&f.type.startsWith('image/')) A.usarImagemLocal(f);
    });
  }

  /* A PINÇA: dois dedos no canvas mudam o zoom, na mesma escala da
     rodinha. Um dedo só continua sendo mira/editor; os dedos são
     acompanhados por pointerId, e a pinça só conta enquanto houver
     exatamente dois no canvas. */
  function ligarPinca(){
    const dedos=new Map(); let dist0=0, zoom0=1;
    const afast=()=>{ const [a,b]=[...dedos.values()]; return Math.hypot(a.x-b.x,a.y-b.y); };
    cv.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='touch') return;
      dedos.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(dedos.size===2){ dist0=afast(); zoom0=zoom; cancelarMira(); }
    });
    const solta=e=>{ dedos.delete(e.pointerId); };
    cv.addEventListener('pointerup',solta); cv.addEventListener('pointercancel',solta);
    cv.addEventListener('pointermove',e=>{
      if(e.pointerType!=='touch' || !dedos.has(e.pointerId)) return;
      dedos.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(dedos.size!==2 || dist0<10) return;
      zoom=U.limitar(zoom0*afast()/dist0, 1, ZOOM_MAX);
    });
  }

  function mostrarAlvoSolta(on){
    let el=$('alvoSolta');
    if(on&&!el){
      el=document.createElement('div');
      el.id='alvoSolta'; el.textContent='solte a imagem pra usar de fundo';
      document.body.appendChild(el);
    } else if(!on&&el) el.remove();
  }

  /* =======================================================
     O QUE VALE UMA FUGA

     Pouco, e menos ainda quanto maior era a vantagem. Correr de quem
     chegou com o triplo não é façanha de ninguém e o jogo não paga por
     isso; o outro lado amarelar numa briga parelha vale alguma coisa;
     e o bonde grande que virou as costas pro bonde pequeno é o teto.

     A conta é `arredonda(BASE × deles/seus)`, presa entre 1 e 6. A
     escala normal de prestígio vai de −13 a +45, então 1 a 6 é entre
     "nada" e "uma noite fraca de briga de verdade" — se a fuga pagasse
     como vitória o jogador caçaria fuga em vez de briga, e a briga é o
     jogo.

     BASE 12 e não 3,5, e a razão é medida. O gatilho da fuga dispara em
     40% (combate.js, MINORIA) porque em 50% quatro de cada dez
     esbarrões de rua acabavam sem contato. Isso prende a razão
     deles/seus abaixo de 0,40 — quem foge nunca foi mais da metade da
     sua gente, por definição do gatilho. Com BASE 3,5 toda fuga pagaria
     arredonda(≤1,4) = 1, uma constante, e o pedido era justamente que
     pagasse menos quando a vantagem era maior. BASE 12 devolve a faixa:
     eles com 8% da sua gente vale 1; com 25%, 3; encostando no limiar,
     5. O 6 fica reservado pro dia em que um bonde correr de outro sem
     estar em minoria — hoje nenhum gatilho produz isso.
     ======================================================= */
  const BASE_FUGA = 12;
  function prestigioDaFuga(J){
    const meu = C.ladoDoJogador(J), outro = C.OUTRO_LADO[meu];
    const meus  = Math.max(1, J.total[meu]);
    const deles = Math.max(0, J.total[outro]);
    return U.limitar(Math.round(BASE_FUGA * (deles/meus)), 1, 6);
  }

  function encerrar(motivo, opc){
    if(!J||J.fase==='fim') return;
    J.fase='fim';
    /* chegar no objetivo é o sucesso da ação — tomar o bar, levar a
       loja, chegar no gramado. Nos arredores não: lá entrar pelo portão
       é o fim normal da noite e não uma vitória sobre ninguém, então
       ali quem decide continua sendo quem caiu de cada lado. */
    const noObjetivo = !!(opc && opc.objetivo) && !(!D.id || D.id==='arredores');

    /* GDD §5.3 — XP de briga por escala: a média do tamanho dos dois
       lados. Substitui a divisão binária briga grande / briga pequena,
       que não resolvia casos como 8×12. */
    const escala=(J.total.mandante+J.total.visitante)/2;
    const xpBase = escala<=10?3 : escala<=30?6 : escala<=60?10 : 15;
    /* Se a briga acabou por si — um lado sem ninguém de pé —, quem
       venceu é quem sobrou, e não quem derrubou mais. Sair de pé com
       menos baixas do que o outro é a mesma coisa só na maioria dos
       casos, não em todos: dá pra derrubar mais e ainda assim ser
       corrido de lá. */
    const venceu = J.acabou ? J.acabou.venceu
                 : noObjetivo ? true
                 : J.caidos.visitante > J.caidos.mandante;
    /* eles amarelaram e saíram inteiros: nem vitória nem noite calma */
    const correram = !!(J.acabou && J.acabou.correram);
    /* noite sem ninguém no chão é noite tranquila, tenha ela acabado
       pelo portão ou por a cena esvaziar */
    const tranquila = !correram && ((J.acabou && J.acabou.tranquila) ||
                      J.caidos.mandante + J.caidos.visitante === 0);
    /* VENCEU É DO PONTO DE VISTA DO MANDANTE, e nem sempre o mandante
       somos nós: quando eles vêm pro nosso bar, quem desce a rua é o
       lado `mandante` e a gente é o dono da casa. Pra XP e moral da
       ficha o que vale é se NÓS ganhamos — senão o time inteiro sai
       comemorando a derrota. O resto do relatório continua na
       convenção antiga, que é a que `fecharCena` lê. */
    /* QUEM É O NOSSO LADO tem uma função só, em `combate.js`, e é ela
       que vale: ela olha o líder primeiro (o disco que o jogador
       dirige) e só depois a marca do bonde. Aqui estava a terceira
       cópia da mesma pergunta, e ela não conhecia o líder. */
    const nossoLado = C.ladoDoJogador(J);
    const outroLado = C.OUTRO_LADO[nossoLado];
    const ganhamos = nossoLado === 'mandante' ? venceu : !venceu;
    const xpNoite = Math.round(xpBase * (ganhamos?1.5:1));

    /* ficha por ficha: é isto que vira Ferido e Preso na gestão */
    const membros=[];
    for(const d of J.discos){
      if(d.membroId==null) continue;
      membros.push({
        id:d.membroId,
        caido:d.caido, preso:d.preso, entrou:d.entrou,
        naRua:false,
        xp: xpNoite + (d.entrou?1:0),
        moral: d.preso?-4 : d.caido?-3 : ganhamos?+1.5 : -0.5
      });
    }

    const r={
      motivo,
      /* FERIDO É FERIDO, PRESO É PRESO (correção do dono, 24/08/2026):
         `prender()` soma o preso também em J.caidos — dentro do
         combate "caído" é baixa total, e as réguas de debandada
         precisam disso. Mas AQUI é a fronteira do relatório, e todo
         mundo lá fora soma caídos + presos de novo: um bonde de 20
         com 15 no chão e 5 no camburão saía como "20 feridos e 5
         presos" — 25 baixas em 20 homens. O simulado sempre separou;
         a cena passa a entregar a mesma conta. */
      caidosMandante:  Math.max(0, J.caidos.mandante  - J.presosPor.mandante),
      caidosVisitante: Math.max(0, J.caidos.visitante - J.presosPor.visitante),
      presosMandante:J.presosPor.mandante, presosVisitante:J.presosPor.visitante,
      rompido:J.rompido,
      entraram:J.entraram,
      venceu, ganhamos, nossoLado, xpNoite,
      tranquila, correram,
      /* quantos eram de cada lado, pro cartaz poder dizer de que
         tamanho era o bonde que amarelou */
      efetivo: {mandante:J.total.mandante, visitante:J.total.visitante},
      bombasUsadas: Math.max(0, (J.bombasIniciais||0) - J.bombas),
      /* o que saiu da mão de cada lado, e quem correu pra fora da cena */
      armas: J.armas,
      sumiram: J.sumiram,
      /* A MORAL É NOSSA, NÃO DO MANDANTE (correção do dono,
         24/08/2026): a linha usava `venceu`, que é do ponto de vista
         do mandante — ganhar de visitante DESCONTAVA moral e perder
         pagava +1. Vale `ganhamos`, e a debandada que pesa é a NOSSA. */
      moralTorcida: ganhamos ? +1
                  : (J.debandou && J.debandou[nossoLado]) ? -2 : -0.5,
      /* o `|| 0` não é enfeite: Math.round(-0.5) é -0, e a tela
         escrevia "Prestígio -0" numa noite que deu em nada */
      /* O PRESTÍGIO É NOSSO, e a conta era do mandante: derrubar 80
         deles jogando como visitante dava −120, e `aplicarResultado`
         soma isso ao indicador sem virar nada — ganhar fora custava
         prestígio e ainda fazia perder material. A fórmula continua a
         mesma; o que muda é de quem são os caídos. */
      /* O PRESTÍGIO FALA NA ESCALA DE 0 A 100 (decisão do dono,
         17/08/2026): vitória rende no máximo +10, derrota tira no
         máximo −10 — e o −10 é só quando o prejuízo de feridos e
         presos é grande. A conta de caídos continua dando o degrau;
         o ÷3 e o teto seguram a banalização (um 51×0 dava +102). */
      /* e a conta usa ferido SEM o preso, como o simulado: com
         J.caidos cru o preso pesava 1,5 de caído MAIS 2 de preso —
         3,5 por cabeça, e só na cena jogada (24/08/2026) */
      prestigio: correram ? prestigioDaFuga(J)
        : (U.limitar(Math.round(((J.caidos[outroLado]-J.presosPor[outroLado])*2
                      - (J.caidos[nossoLado]-J.presosPor[nossoLado])*1.5
                      - J.presosPor[nossoLado]*2 + (J.rompido?6:0)) / 3),
                     -10, 10) || 0),
      membros
    };
    J.resultado=r;
    C.logar(J,`Encerrado (${motivo}). Prestígio ${r.prestigio>0?'+':''}${r.prestigio}.`,'p');
    if(aoTerminar) aoTerminar(r); else mostrarFimNaCena(r);
  }

  /* =======================================================
     O RESUMO NA PRÓPRIA CENA
     No jogo quem mostra o fim é a tela de relatório. Na bancada
     não existe tela nenhuma depois da cena, e a briga acabava
     em silêncio — daí este mesmo cartaz, com os mesmos números,
     desenhado por cima do palco.
     ======================================================= */
  function mostrarFimNaCena(r){
    const palco=$('djPalco');
    if(!palco) return;
    const velho=$('djFim'); if(velho) velho.remove();
    /* o lado é o da cena, não o do campeonato: numa emboscada a nossa
       torcida entra como visitante (correção do dono, 24/08/2026) */
    const nosso = r.nossoLado === 'visitante' ? 'visitante' : 'mandante';
    const dele  = nosso === 'mandante' ? 'visitante' : 'mandante';
    const Cap = l => l === 'mandante' ? 'Mandante' : 'Visitante';
    const ganhou = r.ganhamos !== undefined ? !!r.ganhamos : !!r.venceu;
    const a=(r.armas&&r.armas[nosso])||{pedra:0,bomba:0};
    /* mesmas três palavras da tela de relatório do jogo, e nesta ordem:
       ter vencido diz mais que a noite ter sido calma */
    const titulo = r.correram ? 'ELES CORRERAM'
                 : ganhou ? 'SAÍMOS POR CIMA'
                 : r.tranquila ? 'NOITE TRANQUILA' : 'SAÍMOS POR BAIXO';
    const dado=(rot,val)=>`<div class="dado-cena"><span>${rot}</span><b>${val}</b></div>`;
    const ef = r.efetivo || {};
    const cx=document.createElement('div');
    cx.id='djFim';
    cx.innerHTML=
      `<div class="cartaz-cena ${r.correram?'neutra':ganhou?'boa':'ruim'}">
         <h3>${titulo}</h3>
         <div class="dados-cena">
           ${dado('Feridos deles', r['caidos'+Cap(dele)]||0)}
           ${dado('Feridos nossos', r['caidos'+Cap(nosso)]||0)}
           ${r.correram ? dado('Eram deles', ef[dele]||0) +
                          dado('Éramos nós', ef[nosso]||0) +
                          dado('Escaparam', (r.sumiram||{})[dele]||0)
                        : dado('Armas empregadas',
                               `${a.pedra||0} pedras · ${a.bomba||0} bombas`) +
                          dado('Presos', r.presosMandante+r.presosVisitante) +
                          dado('Chegaram no alvo', (r.entraram||{})[nosso]||0)}
           ${dado('Prestígio', (r.prestigio>0?'+':'')+r.prestigio)}
         </div>
         <small>${r.motivo}</small>
         <button class="acao-btn" id="djOutraNoite">Nova noite</button>
       </div>`;
    palco.appendChild(cx);
    $('djOutraNoite').onclick=()=>{ cx.remove(); novaNoite(); };
  }

  /* =======================================================
     EDITOR DE CENA
     ======================================================= */
  function alternarEditor(){
    /* o editor pinta a malha na tela de cima; em 3D não há onde pintar */
    if(tres){ if(J) C.aviso(J, 'o editor é da cena de cima', '#e0b040'); return; }
    ED.ativo=!ED.ativo;
    if(ED.ativo) montarBarraEditor(); else { const b=$('editorBarra'); if(b) b.remove(); }
  }

  function acharMarcador(x,y){
    const perto=(a,b,r)=>U.dist(x,y,a,b)<r;
    for(const s of D.spawns)   if(perto(s.x,s.y,30)) return {mover:(nx,ny)=>{s.x=Math.round(nx);s.y=Math.round(ny);}};
    for(const e of D.entradas) if(perto(e.x,e.y,30)) return {mover:(nx,ny)=>{e.x=Math.round(nx);e.y=Math.round(ny);}};
    for(const p of D.pmPostos) if(perto(p.x,p.y,16)) return {mover:(nx,ny)=>{p.x=Math.round(nx);p.y=Math.round(ny);}};
    for(const g of D.grades){
      if(perto(g.de.x,g.de.y,18))  return {mover:(nx,ny)=>{g.de.x=Math.round(nx); g.de.y=Math.round(ny); selecionar(g); regrade();}};
      if(perto(g.ate.x,g.ate.y,18))return {mover:(nx,ny)=>{g.ate.x=Math.round(nx);g.ate.y=Math.round(ny);selecionar(g); regrade();}};
    }
    for(const f of (D.fugas||[])) if(perto(f.x,f.y,20))
      return {mover:(nx,ny)=>{f.x=Math.round(nx); f.y=Math.round(ny); mexeuNasFugas();}};
    if(D.tropaEm && perto(D.tropaEm.x,D.tropaEm.y,20))
      return {mover:(nx,ny)=>{D.tropaEm.x=Math.round(nx); D.tropaEm.y=Math.round(ny);}};
    return null;
  }

  /* =======================================================
     MARCAR À MÃO: GRADE, POSTO DE PM, BOCA DE FUGA E A TROPA
     Até aqui o editor só movia o que já existia — e a lista de
     marcadores de uma cena é decisão de quem desenha a cena, não
     coisa pra pedir por mensagem. Cada modo da barra põe um tipo de
     marcador; o botão direito, em qualquer um deles, tira o que
     estiver embaixo do cursor (menos bonde e portão, que são a
     identidade da cena e saem só do arquivo).
     ======================================================= */
  function selecionar(g){ ED.sel = g; pintarBarraGrade(); }

  /* comprimento vira número de módulos: 22 px por módulo é o passo que
     as grades da praça e dos estádios já usam */
  const compr = g => Math.hypot(g.ate.x-g.de.x, g.ate.y-g.de.y);
  function ajustarModulos(g){
    g.modulos = Math.max(1, Math.round(compr(g)/22));
  }
  function novaGrade(x,y){
    let n=1; const usado=id=>D.grades.some(g=>g.id===id);
    while(usado('grade_'+n)) n++;
    const g={id:'grade_'+n, rot:'GRADE', de:{x:Math.round(x),y:Math.round(y)},
             ate:{x:Math.round(x),y:Math.round(y)}, modulos:1, espessura:10};
    D.grades.push(g);
    return g;
  }

  /* a lista de bocas de fuga é lida uma vez e guardada; mexeu, recarrega
     — e o campo de rota da fuga é indexado pela versão das grades */
  function mexeuNasFugas(){
    A.recarregarFugas();
    if(J) J.versaoGrades++;
    ED.sujo=true;
    conferirFugas();
  }

  /* AVISO NA HORA: boca de fuga em lugar sem rota é bonde correndo pra
     parede pelo resto da noite. Confere-se do jeito que o jogo confere
     na hora de correr: campo até a boca, com as grades de pé, e cada
     bonde da cena tem de ter caminho. */
  function conferirFugas(){
    const lista = (D.fugas||[]);
    if(!lista.length){ ED.aviso=''; pintarAviso(); return; }
    const bloq = A.celulasDeGrades(J ? J.grades : A.montarGrades());
    const ruins = [];
    for(const f of A.fugas){
      const campo = A.criarCampo(f.x, f.y, bloq);
      const sem = D.spawns.filter(s=>campo.passo(s.x,s.y).semRota).map(s=>s.rot||s.id);
      if(sem.length) ruins.push(`${Math.round(f.x)},${Math.round(f.y)} sem rota de ${sem.join(' e ')}`);
    }
    ED.aviso = ruins.length
      ? 'FUGA SEM ROTA · ' + ruins.join(' · ')
      : `${A.fugas.length} boca(s) de fuga à mão — todas com rota`;
    pintarAviso();
  }

  function apagarSob(x,y){
    const perto=(a,b,r)=>U.dist(x,y,a,b)<r;
    for(let i=0;i<D.grades.length;i++){
      const g=D.grades[i];
      if(perto(g.de.x,g.de.y,18) || perto(g.ate.x,g.ate.y,18) ||
         U.dist(x,y,(g.de.x+g.ate.x)/2,(g.de.y+g.ate.y)/2) < 18){
        if(ED.sel===g) selecionar(null);
        D.grades.splice(i,1); regrade(); ED.sujo=true; return true;
      }
    }
    for(let i=0;i<D.pmPostos.length;i++)
      if(perto(D.pmPostos[i].x,D.pmPostos[i].y,16)){
        D.pmPostos.splice(i,1); ED.sujo=true; return true; }
    const fg=D.fugas||[];
    for(let i=0;i<fg.length;i++)
      if(perto(fg[i].x,fg[i].y,20)){ fg.splice(i,1); mexeuNasFugas(); return true; }
    if(D.tropaEm && perto(D.tropaEm.x,D.tropaEm.y,20)){
      D.tropaEm=null; ED.sujo=true; return true; }
    return false;
  }
  function regrade(){ if(J){ const hp=P.vidaGrade;
    J.grades=A.montarGrades(); for(const g of J.grades){g.hpMax=hp;g.hp=hp;} } }

  function desenharEditor(c){
    // pontas arrastáveis das grades
    for(const g of D.grades){
      for(const p of [g.de,g.ate]){
        c.fillStyle='#e0b040'; c.beginPath(); c.arc(p.x,p.y,7,0,7); c.fill();
        c.strokeStyle='#0c0c0b'; c.lineWidth=2; c.beginPath(); c.arc(p.x,p.y,7,0,7); c.stroke();
      }
    }
    // cursor do pincel
    if(ED.modo==='pincel'&&ED.mouse){
      c.strokeStyle='rgba(224,176,64,.9)'; c.lineWidth=2;
      c.beginPath(); c.arc(ED.mouse.x,ED.mouse.y,ED.pincel,0,7); c.stroke();
    }
  }

  /* a grade que a mão está mexendo ganha os dois números que não dá
     pra arrastar: quantos módulos ela tem e quão grossa ela é */
  function pintarBarraGrade(){
    const cx=$('edGrade'); if(!cx) return;
    const g=ED.sel;
    if(!g || !D.grades.includes(g)){ cx.innerHTML=''; return; }
    cx.innerHTML=
      `<span style="color:#e0b040">${g.id}</span>`+
      `<button data-g="mod-">módulos −</button><b id="edMod">${g.modulos}</b><button data-g="mod+">+</button>`+
      `<button data-g="esp-">espessura −</button><b id="edEsp">${g.espessura}</b><button data-g="esp+">+</button>`;
    cx.querySelectorAll('[data-g]').forEach(bt=>bt.onclick=()=>{
      const a=bt.dataset.g;
      if(a==='mod-') g.modulos=Math.max(1,g.modulos-1);
      if(a==='mod+') g.modulos=Math.min(40,g.modulos+1);
      if(a==='esp-') g.espessura=Math.max(4,g.espessura-1);
      if(a==='esp+') g.espessura=Math.min(24,g.espessura+1);
      regrade(); ED.sujo=true; pintarBarraGrade();
    });
  }
  function pintarAviso(){
    const n=$('edAviso'); if(!n) return;
    const ruim = ED.aviso.startsWith('FUGA SEM ROTA');
    n.style.color = ruim ? '#d9705f' : 'var(--fraco)';
    n.textContent = ED.aviso;
  }

  function montarBarraEditor(){
    if($('editorBarra')) return;
    const b=document.createElement('div');
    b.id='editorBarra';
    b.innerHTML=`
      <b>EDITOR DE CENA</b>
      <div class="grupo">
        <button data-modo="pincel" class="on">Pincel</button>
        <button data-modo="marcador">Marcadores</button>
      </div>
      <div class="grupo">
        <button data-modo="grade">Grade nova</button>
        <button data-modo="pm">Posto de PM</button>
        <button data-modo="fuga">Boca de fuga</button>
        <button data-modo="tropa">Entrada da tropa</button>
      </div>
      <div class="grupo" id="edGrade"></div>
      <div class="grupo">
        <button id="edMalha" class="on">Malha (M)</button>
        <button id="edRefazer">Refazer dos polígonos</button>
        <button id="edExportar">Exportar arquivo</button>
      </div>
      <div class="dica" id="edDica"></div>
      <div class="dica" id="edAviso"></div>`;
    document.body.appendChild(b);
    b.querySelectorAll('[data-modo]').forEach(bt=>bt.onclick=()=>{
      ED.modo=bt.dataset.modo;
      b.querySelectorAll('[data-modo]').forEach(o=>o.classList.toggle('on',o===bt));
      pintarDica();
    });
    pintarDica(); pintarBarraGrade(); conferirFugas();
    $('edMalha').onclick=e=>{ED.mostrarMalha=!ED.mostrarMalha;e.target.classList.toggle('on',ED.mostrarMalha);};

    /* cada ferramenta explica a si mesma: a barra é a única
       documentação que quem desenha a cena tem na frente */
    function pintarDica(){
      const d=$('edDica'); if(!d) return;
      const comum='<b>direito/shift</b> ou <b>Delete</b> = apagar o que estiver sob o cursor · F2 sai';
      d.innerHTML = ({
        pincel:'clique = libera passagem · shift/direito = bloqueia · <b>[</b> <b>]</b> tamanho do pincel<br>'+
               'arraste uma imagem pra usar de fundo · F2 sai',
        marcador:'arraste bonde, portão, posto de PM, ponta de grade, boca de fuga ou a tropa<br>'+comum,
        grade:'aperte e arraste pra traçar a grade — o número de módulos sai do comprimento<br>'+comum,
        pm:'clique põe um posto de PM (é de lá que sai reforço, e a viatura volta pra lá)<br>'+comum,
        fuga:'clique marca por onde se some quando debanda. Marcou uma, as automáticas da máscara desligam<br>'+comum,
        tropa:'clique marca por onde a tropa de choque entra. Sem marcador, ela entra pelo buraco da grade<br>'+comum
      })[ED.modo] || comum;
    }
    $('edRefazer').onclick=()=>{D.mascara=null;A.reconstruir();ED.sujo=true;};
    $('edExportar').onclick=exportar;
  }

  /* Duas saídas, porque são dois arquivos diferentes:

     - arredores é cena própria, mora inteira em dados/cena_arredores.js
       e o editor devolve o arquivo pronto pra substituir;
     - praça, rua e as outras nascem de dados/cenas.js com a foto por
       cima (dados/cenas_foto.js, que é gerado e se perde na próxima
       importação). Pra essas o editor devolve só o remendo, pra colar
       em dados/cenas_editadas.js — que é da mão e entra por último. */
  function nomeDoArquivo(){
    return (D.id && D.id !== 'arredores') ? 'cenas_editadas.js' : 'cena_arredores.js';
  }

  function gerarRemendo(){
    const j=(o)=>JSON.stringify(o);
    const lista=(v)=>v.map(o=>'      '+j(o)).join(',\n');
    return `  /* ${D.nome || D.id} — recortado do editor (F2) em cima da foto.
     Cole dentro de TO.dados.cenasEditadas, em dados/cenas_editadas.js,
     trocando a entrada '${D.id}' que já estiver lá. */
  '${D.id}': {
    mascara:${j(A.codificarMascara())},

    spawns:[
${lista(D.spawns)}
    ],

    entradas:[
${lista(D.entradas)}
    ],

    pmPostos:[
${lista(D.pmPostos)}
    ],

    grades:[
${lista(D.grades)}
    ],

    fugas:[
${lista(D.fugas||[])}
    ]${D.tropaEm ? ',\n\n    tropaEm:'+j(D.tropaEm) : ''}
  },
`;
  }

  /* gera o dados/cena_arredores.js completo, pronto pra substituir */
  function gerarArquivo(){
    if(D.id && D.id !== 'arredores') return gerarRemendo();
    const j=(o)=>JSON.stringify(o);
    const pol=(lista)=>lista.map(p=>
      `      {nome:${j(p.nome)},\n       pontos:${j(p.pontos)}}`).join(',\n');
    return `/* =========================================================
   CENA DOS ARREDORES — gerado pelo editor (F2)
   Coordenadas no espaço da imagem: ${D.largura} x ${D.altura}.
   ========================================================= */
TO.dados.cenaArredores = {

  imagem:${j(D.imagem)},
  largura:${D.largura},
  altura:${D.altura},
  celula:${D.celula},

  poligonos:{
    caminhavel:[
${pol(D.poligonos.caminhavel)}
    ],
    bloqueio:[
${pol(D.poligonos.bloqueio)}
    ]
  },

  /* malha pintada no editor — tem prioridade sobre os polígonos */
  mascara:${j(A.codificarMascara())},

  spawns:[
${D.spawns.map(s=>'    '+j(s)).join(',\n')}
  ],

  entradas:[
${D.entradas.map(e=>'    '+j(e)).join(',\n')}
  ],

  pmPostos:[
${D.pmPostos.map(p=>'    '+j(p)).join(',\n')}
  ],

  grades:[
${D.grades.map(g=>'    '+j(g)).join(',\n')}
  ],

  fugas:[
${(D.fugas||[]).map(f=>'    '+j(f)).join(',\n')}
  ]${D.tropaEm ? ',\n\n  tropaEm:'+j(D.tropaEm) : ''}
};
`;
  }

  function exportar(){
    const txt=gerarArquivo();
    const arq=nomeDoArquivo();
    let cx=$('editorSaida');
    if(cx) cx.remove();
    cx=document.createElement('div');
    cx.id='editorSaida';
    cx.innerHTML=`
      <div class="linha">
        <span>dados/${arq} — baixe e suba no repositório, ou copie e cole</span>
        <button class="bt" id="edBaixar">Baixar arquivo</button>
        <button class="bt" id="edCopiar">Copiar</button>
        <button class="bt" id="edFechar">Fechar</button>
      </div>
      <textarea spellcheck="false"></textarea>`;
    document.body.appendChild(cx);
    cx.querySelector('textarea').value=txt;
    $('edFechar').onclick=()=>cx.remove();
    $('edCopiar').onclick=()=>{cx.querySelector('textarea').select();document.execCommand('copy');};
    $('edBaixar').onclick=()=>{
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([txt],{type:'text/javascript'}));
      a.download=arq; a.click();
    };
  }

  return {montar, parar, novaNoite, encerrar, alternarEditor, gerarArquivo,
          get tres(){ return tres; }, get bonecos(){ return bonecos; },
          alternarVelocidade,
          get zoom(){return zoom;},
          set zoom(v){ zoom=U.limitar(+v||1, 1, ZOOM_MAX); },
          get velocidade(){return velocidade;},
          set velocidade(v){ velocidade = velocidades.includes(v) ? v : 1;
                             atualizarBotaoVelocidade(); },
          get config(){return config;},
          /* o vetor da bola de controle, pra quem quiser conferir de fora */
          get eixo(){return teclas.eixo || null;},
          /* a seta da borda do último quadro, ou null se não teve */
          get seta(){return ultimaSeta;},
          get J(){return J;}};
})();

