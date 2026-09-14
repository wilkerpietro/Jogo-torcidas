/* =========================================================
   BANCADA 3D — o miolo da página experimentos/three/bancada3d.html
   Fica em arquivo separado pelo mesmo motivo de js/diajogo/bancada.js:
   assim o empacotador embute e a página vira um HTML só.
   ========================================================= */

window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.bancada3d = (function(){
  function montar(){
  const A = TO.diaJogo.arredores, C = TO.diaJogo.combate, T3 = TO.diaJogo.cena3d;
  const $ = id => document.getElementById(id);
  const cv2d = $('cv2d'), ctx2d = cv2d.getContext('2d');

  const CENAS = [['praca','Praça'], ['rua','Rua'], ['rua-media','Rua média'],
                 ['rua-nobre','Rua nobre'], ['bar','Bar'], ['comercio','Comércio'],
                 ['ct','CT'], ['arredores','Arredores (foto)']];

  let J = null, cenaAtual = 'praca', modo = '3D', teclas = {}, blocos = false;

  /* ---- o 3D pode não existir: placa de vídeo velha, WebGL desligado ---- */
  const tem3D = T3.disponivel() && T3.iniciar($('gl3d'), $('sobre3d'));
  if(!tem3D){
    modo = '2D'; $('semGL').style.display = 'block';
    $('gl3d').hidden = true; $('sobre3d').hidden = true;
  }

  function refazer(){
    A.usarCena(cenaAtual === 'arredores' ? 'arredores' : cenaAtual);
    T3.assarChao(true);
    /* paz:false porque a bancada existe pra ver briga, não pra ver
       gente de conversa esperando o jogo começar */
    J = C.criarEstado({local:cenaAtual, paz:false, intencao:'atacar'});
  }

  function trocarModo(m){
    if(m === '3D' && !tem3D) return;
    modo = m;
    $('bt2d').classList.toggle('on', m === '2D');
    $('bt3d').classList.toggle('on', m === '3D');
    cv2d.hidden = m !== '2D';
    $('gl3d').hidden = $('sobre3d').hidden = m !== '3D';
    $('mModo').textContent = m;
  }

  /* ---- abas de cena ---- */
  for(const [id, nome] of CENAS){
    const b = document.createElement('button');
    b.textContent = nome;
    b.classList.toggle('on', id === cenaAtual);
    b.onclick = ()=>{
      cenaAtual = id; refazer();
      for(const o of $('abasCena').children) o.classList.toggle('on', o === b);
    };
    $('abasCena').appendChild(b);
  }

  $('bt2d').onclick = ()=>trocarModo('2D');
  $('bt3d').onclick = ()=>trocarModo('3D');
  $('btReiniciar').onclick = refazer;
  $('incl').oninput = e =>{
    T3.inclinar(+e.target.value);
    $('incValor').textContent = e.target.value + '°';
  };
  $('chBlocos').onchange = e => { blocos = e.target.checked; };

  addEventListener('keydown', e=>{
    const k = e.key.toLowerCase();
    teclas[k] = true;
    if(!J) return;
    if(k === 'q') C.arremessar(J,'pedra');
    if(k === 'e') C.arremessar(J,'bomba');
    if(k === 'r') C.alternarRecuo(J);
    const forms = {'1':'bonde','2':'muralha','3':'investida','4':'espalhar'};
    if(forms[k]) J.form = forms[k];
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k))
      e.preventDefault();
  });
  addEventListener('keyup', e=>{ teclas[e.key.toLowerCase()] = false; });

  /* ---- pintura 2D: o mesmo encaixe que ponte.ajustar faz ---- */
  function desenhar2D(){
    const s = Math.min(cv2d.width/A.W, cv2d.height/A.H);
    ctx2d.setTransform(1,0,0,1,0,0);
    ctx2d.fillStyle = '#0e0e0d'; ctx2d.fillRect(0,0,cv2d.width,cv2d.height);
    ctx2d.setTransform(s,0,0,s,(cv2d.width-A.W*s)/2,(cv2d.height-A.H*s)/2);
    C.desenhar(J, ctx2d, {});
    ctx2d.setTransform(1,0,0,1,0,0);
  }

  /* ---- medidores ---- */
  let quadros = 0, marca = performance.now();
  function medir(agora){
    quadros++;
    if(agora - marca < 500) return;
    $('mFps').textContent = Math.round(quadros*1000/(agora-marca));
    quadros = 0; marca = agora;
    if(!J) return;
    let vivos = 0, caidos = 0;
    for(const d of J.discos){ if(d.vivo) vivos++; else if(d.caido||d.preso) caidos++; }
    $('mVivos').textContent = vivos;
    $('mCaidos').textContent = caidos;
  }

  refazer();
  trocarModo(modo);
  let ant = performance.now();
  requestAnimationFrame(function quadro(agora){
    let dt = (agora - ant)/1000; ant = agora;
    if(dt > 0.05) dt = 0.05;
    if(J) C.passo(J, dt, teclas, true);
    if(modo === '3D') T3.desenhar(J, {blocos:blocos});
    else desenhar2D();
    medir(agora);
    requestAnimationFrame(quadro);
  });
  }
  return {montar};
})();
