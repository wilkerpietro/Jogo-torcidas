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
  let aoTerminar=null;
  /* chamado a cada quadro enquanto a cena roda: quem monta a cena usa
     isso pra continuar o relógio da rua e mandar pra cá o bonde que
     acabou de chegar na esplanada */
  let aCadaQuadro=null;

  /* editor */
  const ED={ativo:false, modo:'pincel', pincel:16, pintando:0,
            pegou:null, mostrarMalha:true, mostrarPostos:true, sujo:false};

  /* =======================================================
     MONTAGEM
     ======================================================= */
  function montar(opc){
    opc=opc||{};
    cv  = opc.canvas || document.getElementById('djPrincipal');
    ctx = cv.getContext('2d');
    aoTerminar = opc.aoTerminar || null;
    aCadaQuadro = opc.aCadaQuadro || null;

    /* rua, praça ou arredores: a cena vem do encontro que abriu a tela */
    A.usarCena((opc.config||{}).local);
    montarBotoes();
    if(estreito()) montarPad();
    montarSliders();
    ligarEntrada();
    novaNoite(opc.config||{});
    if(!rodando){rodando=true; ant=performance.now(); requestAnimationFrame(quadro);}
  }

  let config={};
  function novaNoite(cfg){
    const fim=$('djFim'); if(fim) fim.remove();
    if(cfg) config=cfg;
    J = C.criarEstado(config);
    TO.diaJogo.J = J;
    atualizarBotoes();
  }

  /* =======================================================
     LAÇO
     ======================================================= */
  function quadro(agora){
    let dt=(agora-ant)/1000; ant=agora;
    if(dt>0.05) dt=0.05;           // aba que perdeu foco não teleporta ninguém
    if(J && !ED.ativo){
      C.passo(J,dt,teclas,true);
      /* a rua não para porque a briga começou: quem ainda estava andando
         chega no meio dela */
      if(aCadaQuadro) for(const b of (aCadaQuadro(dt, J) || [])) C.reforcar(J, b);
    }
    /* a briga pode acabar sozinha: um lado sem ninguém de pé. Quem
       decide isso é o combate; aqui só se abre a tela. */
    if(J && J.acabou && J.fase==='acabando') encerrar(J.acabou.motivo);
    desenhar();
    atualizarHUD();
    requestAnimationFrame(quadro);
  }

  function ajustar(c,alvo,W,H){
    const s=Math.min(alvo.width/W, alvo.height/H);
    c.setTransform(1,0,0,1,0,0);
    c.fillStyle='#0e0e0d'; c.fillRect(0,0,alvo.width,alvo.height);
    c.setTransform(s,0,0,s,(alvo.width-W*s)/2,(alvo.height-H*s)/2);
    return {s, ox:(alvo.width-W*s)/2, oy:(alvo.height-H*s)/2};
  }
  let escala={s:1,ox:0,oy:0};

  function desenhar(){
    if(!J) return;
    escala=ajustar(ctx,cv,A.W,A.H);
    C.desenhar(J,ctx,{editor:ED.ativo,
                      mostrarMalha:ED.ativo&&ED.mostrarMalha,
                      mostrarPostos:ED.ativo&&ED.mostrarPostos});
    if(ED.ativo) desenharEditor(ctx);
    ctx.setTransform(1,0,0,1,0,0);
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

  function atualizarHUD(){
    if(!J) return;
    const el=id=>$(id);

    if(el('djRelogio')){
      const m=18*60+Math.floor(J.t*0.6);
      el('djRelogio').textContent=
        `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    }
    if(el('djSubrelogio'))
      el('djSubrelogio').textContent = ED.ativo ? 'editor de cena — jogo pausado' : (D.nome ? 'na '+D.nome.toLowerCase() : 'nos arredores');

    if(el('djBarraAlerta')) el('djBarraAlerta').style.width=J.alerta+'%';
    if(el('djBarraPressao')){
      const bp=Math.min(100,J.sobPressao/P.aguentaPM*100);
      el('djBarraPressao').style.width=bp+'%';
      el('djRotPressao').style.opacity=(J.fracPM>0.05||bp>0)?1:0.35;
    }

    const btP=el('djBtPedra'), btB=el('djBtBomba');
    if(btP){const r=C.restaCd(J,'pedra'); btP.disabled=r>0;
      btP.firstChild.textContent=r>0?`Pedra ${r.toFixed(1)}s `:'Pedra ';}
    if(btB){const r=C.restaCd(J,'bomba'); btB.disabled=J.bombas<=0||r>0;
      btB.firstChild.textContent=r>0?`Bomba ${r.toFixed(1)}s `:'Bomba ';}
    if(el('djQtdBomba')) el('djQtdBomba').textContent=J.bombas;

    if(el('djLocal')) el('djLocal').textContent = D.local || 'Nos arredores';
    atualizarPad();

    const be=el('djBtEntrar');
    if(be){const perto=!!C.noPortao(J); be.disabled=!perto;
      /* fora do estádio não existe portão: o botão vira a saída da cena */
      const s = D.saida || SAIDA_PADRAO;
      be.firstChild.textContent=(perto?s.perto:s.longe)+' ';}

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
      const man=J.discos.filter(d=>d.lado==='mandante' &&d.vivo).length;
      const vis=J.discos.filter(d=>d.lado==='visitante'&&d.vivo).length;
      const ent=(J.entraram.mandante||0)+(J.entraram.visitante||0);
      el('djPlacar').innerHTML=
        `<b style="color:#c0392b">MANDANTE</b> ${man} de pé<br>`+
        `<b style="color:#2a5fa8">VISITANTE</b> ${vis} de pé<br>`+
        `<span style="color:#8b867d">${J.caidos.mandante} × ${J.caidos.visitante} caídos · ${ent} entraram</span><br>`+
        `<span style="color:${J.paz?'#7fc2a0':'#d9705f'}">CLIMA ${J.paz?'TRANQUILO':'PESADO'}</span>`;
    }

    const av=el('djAviso');
    if(av){
      if(J.aviso && J.t<J.avisoAte){av.textContent=J.aviso.txt;av.style.color=J.aviso.cor;av.style.opacity=1;}
      else av.style.opacity=0;
    }

    const lg=el('djLog');
    if(lg && lg.dataset.n!=String(J.log.length)){
      lg.dataset.n=String(J.log.length);
      lg.innerHTML=J.log.map(l=>`<div class="${l.cor}">${l.txt}</div>`).join('');
    }

    const dica=el('djDica');
    /* cena de invasão: enquanto a casa não acordou, isso é o que
       importa saber — e some no instante em que gritam lá dentro */
    const espera = D.gatilho && !J.acordou && D.gatilho.espera;
    if(dica) dica.innerHTML = ED.ativo
      ? '<kbd>F2</kbd> sair do editor'
      : espera
      ? `<b style="color:var(--ouro)">${espera.toUpperCase()}</b> · `+
        '<kbd>WASD</kbd> líder · <kbd>1</kbd>–<kbd>4</kbd> formação'
      : '<kbd>WASD</kbd> líder · <kbd>1</kbd>–<kbd>4</kbd> formação · <kbd>Q</kbd> pedra · '+
        '<kbd>E</kbd> bomba · <kbd>R</kbd> recuar · <kbd>F2</kbd> editor de cena';
  }

  /* =======================================================
     BOTÕES E ENTRADA
     ======================================================= */
  function montarBotoes(){
    const cf=$('djFormacoes');
    if(cf && !cf.childElementCount){
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
    liga('djBtBomba', ()=>C.arremessar(J,'bomba'));
    liga('djBtRecuar',()=>{C.alternarRecuo(J);atualizarBotoes();});
    liga('djBtEntrar',()=>{
      const s = D.saida || SAIDA_PADRAO;
      if(!C.noPortao(J)){ C.logar(J, s.dica, 'p'); return; }
      /* o líder entrando é o que fecha a cena dos arredores, e é ele
         que faltava na conta de quem chegou no alvo */
      const l=J.discos.find(d=>d.lider&&d.vivo);
      if(l) C.entrarNoEstadio(J, l);
      encerrar(s.feito, {objetivo:true});
    });
  }
  function atualizarBotoes(){
    U.$$('.form-btn').forEach(b=>b.classList.toggle('on', b.dataset.f===J.form));
    const br=$('djBtRecuar');
    if(br&&br.firstChild){
      br.firstChild.textContent=J.recuando?'Voltar pra briga ':'Recuar ';
      br.style.borderColor=J.recuando?'var(--ouro)':'#3d3d39';
      br.style.color=J.recuando?'var(--ouro)':'var(--texto)';
    }
  }

  function montarSliders(){
    const cs=$('djSliders');
    if(!cs||cs.childElementCount) return;
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
     isso `combate.js` não precisa saber que existe celular: `moverLider`
     continua lendo teclas['w'|'a'|'s'|'d'] e normalizando o vetor, e a
     diagonal sai de encostar em dois botões da cruz ao mesmo tempo.

     `pointerdown` e não `click`: click só dispara quando o gesto termina,
     e pedra e bomba têm de sair no toque. `setPointerCapture` por botão
     faz o multitoque valer e garante que o dedo que escorrega pra fora
     solte a tecla — sem isso W fica presa e o líder anda sozinho.
     ======================================================= */
  const LIMIAR_ESTREITO = 900;
  const estreito = () => innerWidth <= LIMIAR_ESTREITO;
  let padMontado = false;

  function montarPad(){
    if(padMontado || !cv) return;
    const pai = cv.parentElement || document.body;
    if(!pai) return;
    padMontado = true;

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
    /* tecla de segurar: liga no toque, desliga ao soltar */
    const segurar = k => botao(k.toUpperCase(), 'pad-mov ' + 'pad-'+k,
                               ()=>{teclas[k]=true;}, ()=>{teclas[k]=false;});
    /* tecla de disparo: o mesmo caminho do botão do HUD */
    const disparo = (k, rot, fn) => botao(rot, 'pad-acao pad-'+k, ()=>{
      teclas[k]=true; fn();
      setTimeout(()=>{teclas[k]=false;}, 60);
    });

    const esq = document.createElement('div');
    esq.className = 'pad-lado pad-esq';
    const acoes = document.createElement('div');
    acoes.className = 'pad-acoes';
    acoes.append(
      disparo('q','PEDRA', ()=>{ if(J) C.arremessar(J,'pedra'); }),
      disparo('e','BOMBA', ()=>{ if(J) C.arremessar(J,'bomba'); }),
      disparo('r','RECUAR',()=>{ if(J){ C.alternarRecuo(J); atualizarBotoes(); } }));
    const cruz = document.createElement('div');
    cruz.className = 'pad-cruz';
    cruz.append(segurar('w'), segurar('a'), segurar('s'), segurar('d'));
    esq.append(acoes, cruz);

    const dir = document.createElement('div');
    dir.className = 'pad-lado pad-dir';
    for(const [id,f] of Object.entries(C.FORMACOES))
      dir.appendChild(botao(f.tecla, 'pad-form', ()=>{
        if(!J) return;
        J.form = id; atualizarBotoes(); marcarFormacaoNoPad();
      }));
    caixa.append(esq, dir);
    pai.appendChild(caixa);
    marcarFormacaoNoPad();
  }

  function marcarFormacaoNoPad(){
    const pad = $('djPad');
    if(!pad || !J) return;
    const teclasForm = Object.values(C.FORMACOES).map(f=>f.tecla);
    const atual = (C.FORMACOES[J.form]||{}).tecla;
    pad.querySelectorAll('.pad-form').forEach((b,i)=>
      b.classList.toggle('on', teclasForm[i] === atual));
  }

  /* a recarga da pedra e o estoque de bomba aparecem no pad, como no HUD */
  function atualizarPad(){
    const pad = $('djPad');
    if(!pad || !J) return;
    const q = pad.querySelector('.pad-q'), e = pad.querySelector('.pad-e');
    if(q) q.classList.toggle('gasto', C.restaCd(J,'pedra') > 0);
    if(e) e.classList.toggle('gasto', J.bombas <= 0 || C.restaCd(J,'bomba') > 0);
    marcarFormacaoNoPad();
  }

  function ligarEntrada(){
    addEventListener('keydown',e=>{
      const k=e.key.toLowerCase();
      teclas[k]=true;
      if(k==='f2'){e.preventDefault(); alternarEditor(); return;}
      if(ED.ativo){
        if(k==='[') ED.pincel=Math.max(4,ED.pincel-4);
        if(k===']') ED.pincel=Math.min(80,ED.pincel+4);
        if(k==='m') ED.mostrarMalha=!ED.mostrarMalha;
        return;
      }
      if(!J) return;
      if(k==='r'){C.alternarRecuo(J);atualizarBotoes();}
      if(k==='q') C.arremessar(J,'pedra');
      if(k==='e') C.arremessar(J,'bomba');
      if(k==='enter'&&C.noPortao(J)) encerrar('sua torcida entrou pelo portão');
      for(const [id,f] of Object.entries(C.FORMACOES))
        if(k===f.tecla){J.form=id;atualizarBotoes();}
    });
    addEventListener('keyup',e=>{teclas[e.key.toLowerCase()]=false;});

    cv.addEventListener('contextmenu',e=>{if(ED.ativo)e.preventDefault();});
    cv.addEventListener('pointerdown',e=>{
      if(!ED.ativo) return;
      e.preventDefault();
      const p=paraCena(e);
      if(ED.modo==='marcador'){ ED.pegou=acharMarcador(p.x,p.y); return; }
      ED.pintando = (e.button===2||e.shiftKey) ? 2 : 1;
      A.pintar(p.x,p.y,ED.pincel, ED.pintando===1);
      ED.sujo=true;
    });
    addEventListener('pointermove',e=>{
      if(!ED.ativo) return;
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

  function mostrarAlvoSolta(on){
    let el=$('alvoSolta');
    if(on&&!el){
      el=document.createElement('div');
      el.id='alvoSolta'; el.textContent='solte a imagem pra usar de fundo';
      document.body.appendChild(el);
    } else if(!on&&el) el.remove();
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
    /* noite sem ninguém no chão é noite tranquila, tenha ela acabado
       pelo portão ou por a cena esvaziar */
    const tranquila = (J.acabou && J.acabou.tranquila) ||
                      J.caidos.mandante + J.caidos.visitante === 0;
    const xpNoite = Math.round(xpBase * (venceu?1.5:1));

    /* ficha por ficha: é isto que vira Ferido e Preso na gestão */
    const membros=[];
    for(const d of J.discos){
      if(d.membroId==null) continue;
      membros.push({
        id:d.membroId,
        caido:d.caido, preso:d.preso, entrou:d.entrou,
        naRua:false,
        xp: xpNoite + (d.entrou?1:0),
        moral: d.preso?-4 : d.caido?-3 : venceu?+1.5 : -0.5
      });
    }

    const r={
      motivo,
      caidosMandante:J.caidos.mandante, caidosVisitante:J.caidos.visitante,
      presosMandante:J.presosPor.mandante, presosVisitante:J.presosPor.visitante,
      rompido:J.rompido,
      entraram:J.entraram,
      venceu, xpNoite,
      tranquila,
      bombasUsadas: Math.max(0, (J.bombasIniciais||0) - J.bombas),
      /* o que saiu da mão de cada lado, e quem correu pra fora da cena */
      armas: J.armas,
      sumiram: J.sumiram,
      moralTorcida: venceu?+1 : (J.debandou&&J.debandou.mandante)?-2 : -0.5,
      prestigio: Math.round(J.caidos.visitante*2 - J.caidos.mandante*1.5
                            - J.presosPor.mandante*2 + (J.rompido?6:0)),
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
    const a=(r.armas&&r.armas.mandante)||{pedra:0,bomba:0};
    /* mesmas três palavras da tela de relatório do jogo, e nesta ordem:
       ter vencido diz mais que a noite ter sido calma */
    const titulo = r.venceu ? 'SAÍMOS POR CIMA'
                 : r.tranquila ? 'NOITE TRANQUILA' : 'SAÍMOS POR BAIXO';
    const dado=(rot,val)=>`<div class="dado-cena"><span>${rot}</span><b>${val}</b></div>`;
    const cx=document.createElement('div');
    cx.id='djFim';
    cx.innerHTML=
      `<div class="cartaz-cena ${r.venceu?'boa':'ruim'}">
         <h3>${titulo}</h3>
         <div class="dados-cena">
           ${dado('Feridos deles', r.caidosVisitante)}
           ${dado('Feridos nossos', r.caidosMandante)}
           ${dado('Armas empregadas', `${a.pedra||0} pedras · ${a.bomba||0} bombas`)}
           ${dado('Presos', r.presosMandante+r.presosVisitante)}
           ${dado('Chegaram no alvo', (r.entraram||{}).mandante||0)}
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
    ED.ativo=!ED.ativo;
    if(ED.ativo) montarBarraEditor(); else { const b=$('editorBarra'); if(b) b.remove(); }
  }

  function acharMarcador(x,y){
    const perto=(a,b,r)=>U.dist(x,y,a,b)<r;
    for(const s of D.spawns)   if(perto(s.x,s.y,30)) return {mover:(nx,ny)=>{s.x=Math.round(nx);s.y=Math.round(ny);}};
    for(const e of D.entradas) if(perto(e.x,e.y,30)) return {mover:(nx,ny)=>{e.x=Math.round(nx);e.y=Math.round(ny);}};
    for(const p of D.pmPostos) if(perto(p.x,p.y,16)) return {mover:(nx,ny)=>{p.x=Math.round(nx);p.y=Math.round(ny);}};
    for(const g of D.grades){
      if(perto(g.de.x,g.de.y,18))  return {mover:(nx,ny)=>{g.de.x=Math.round(nx); g.de.y=Math.round(ny); regrade();}};
      if(perto(g.ate.x,g.ate.y,18))return {mover:(nx,ny)=>{g.ate.x=Math.round(nx);g.ate.y=Math.round(ny);regrade();}};
    }
    return null;
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
        <button id="edMalha" class="on">Malha (M)</button>
        <button id="edRefazer">Refazer dos polígonos</button>
        <button id="edExportar">Exportar arquivo</button>
      </div>
      <div class="dica">
        clique = libera passagem · shift/direito = bloqueia · <b>[</b> <b>]</b> tamanho do pincel<br>
        arraste uma imagem pra usar de fundo · F2 sai
      </div>`;
    document.body.appendChild(b);
    b.querySelectorAll('[data-modo]').forEach(bt=>bt.onclick=()=>{
      ED.modo=bt.dataset.modo;
      b.querySelectorAll('[data-modo]').forEach(o=>o.classList.toggle('on',o===bt));
    });
    $('edMalha').onclick=e=>{ED.mostrarMalha=!ED.mostrarMalha;e.target.classList.toggle('on',ED.mostrarMalha);};
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
    ]
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
  ]
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

  return {montar, novaNoite, encerrar, alternarEditor, gerarArquivo,
          get config(){return config;},
          get J(){return J;}};
})();
