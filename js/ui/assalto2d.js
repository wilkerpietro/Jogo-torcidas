/* =========================================================
   O ASSALTO NO 2D, SOBRE A FOTO DA LOJA (pedido do dono, 10/10/2026:
   "criar os cenários de assalto agora, similares a como funciona no 3d,
   cada uma num nível de dificuldade" — e "os bonecos têm que ser os
   nossos bonecos")

   O motor é o do jogo 3D, inteiro (assalto_motor.js: a percepção —
   exposição, suspeita, alerta —, o anúncio, o saque, a polícia, a fuga).
   O palco é o das brigas: a foto da loja (cena `assalto-<alvo>`, com a
   máscara do importador) e os NOSSOS BONECOS (bonecos3) por cima, na
   mesma câmera de cima. Aqui fica o que é do assalto:

   1. O TABULEIRO (`tabuleiro`): a grade do motor sai da máscara da cena
      (8 px por célula, em pixel da tela) — onde o corpo cabe é onde a
      máscara deixa andar; o que barra o olhar é o que não é chão, menos
      o vidro e o móvel baixo (dados/assaltos.js); as zonas e os pontos
      (a van, os olheiros, os postos, os SEGURANÇAS, o saque, as
      câmeras) vêm do mesmo arquivo. `M` é quantos pixels dão um metro
      naquela foto: o motor anda, olha e prende em metros, e o boneco
      cresce na mesma conta.
   2. O PALCO: o canvas da foto e o WebGL dos bonecos com a mesma caixa;
      entre os dois, na camada da foto, o CONE DO OLHAR de quem trabalha
      e das câmeras — cortado pela parede, que é o que o jogador precisa
      ver pra fazer o furtivo — e o saque; por cima, o "?" e o "!".
   3. O HUD e o CONTROLE: a Exposição, a Suspeita e a Situação, o butim,
      a equipe, a polícia, quem está te olhando; o teclado (WASD/setas,
      Shift, E, Q, Z, X, V, Esc) e, no toque, o joystick e os botões.
   ========================================================= */
(function(){
  'use strict';
  const U = TO.util;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const dinheiro = v => U.dinheiro(Math.round(v || 0));
  /* o boneco tem uns 20 px por metro na escala de sempre */
  const PX_POR_METRO_DO_BONECO = 20;

  /* =======================================================
     1. O TABULEIRO, a partir da cena da foto
     ======================================================= */
  const ROT_SAQUE = s => ({
    caixa:_t('Esvaziar o caixa'), arara:_t('Encher a sacola de roupa'), cigarros:_t('Pegar os cigarros'),
    cofrinho:_t('Abrir o cofrinho'), cofre:_t('Abrir o cofre'), cofreGerencia:_t('Abrir o cofre da gerência'),
    vitrine:_t('Limpar a vitrine'), guiche:_t('Esvaziar o caixa {n}', {n:s.n || ''}), cofreForte:_t('Abrir o cofre-forte')
  })[s.rot] || _t('Pegar');
  function tabuleiro(alvo){
    const d = TO.dados.assaltos && TO.dados.assaltos[alvo];
    const A = TO.diaJogo.arredores;
    if(!d || !A) return null;
    A.usarCena('assalto-' + alvo);
    const W = A.W || 1536, H = A.H || 1024, cel = A.CEL || 8;
    const nx = Math.round(W/cel), nz = Math.round(H/cel);
    const anda = new Uint8Array(nx*nz), ve = new Uint8Array(nx*nz), zona = new Uint8Array(nx*nz);
    const dentro = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
    for(let j = 0; j < nz; j++) for(let i = 0; i < nx; i++){
      const k = j*nx + i, x = (i + 0.5)*cel, y = (j + 0.5)*cel;
      anda[k] = A.celulaLivre(i, j) ? 1 : 0;
      ve[k] = anda[k] || d.vidros.some(r => dentro(r, x, y)) || d.baixos.some(r => dentro(r, x, y)) ? 1 : 0;
      zona[k] = d.restrita.some(r => dentro(r, x, y)) ? 2 : d.loja.some(r => dentro(r, x, y)) ? 1 : 0;
    }
    /* os pontos: {x, y} da tela viram {x, z} do motor */
    const pt = p => p ? Object.assign({}, p, {z:p.y}) : null;
    const pontos = {
      carro:pt(d.carro), olheiros:d.olheiros.map(pt), chegadaPM:d.chegadaPM.map(pt), rua:d.rua.map(pt),
      fugaPovo:d.fugaPovo.map(pt), porta:pt(d.porta), saidaRua:pt(d.saidaRua),
      funcionarios:d.funcionarios.map(pt),
      segurancas:d.segurancas.map(s => Object.assign(pt(s), {ronda:(s.ronda || []).map(pt)})),
      clientes:d.clientes.map(pt),
      saque:d.saque.map(s => Object.assign(pt(s), {rot:ROT_SAQUE(s)})),
      cameras:d.cameras.map(c => Object.assign(pt(c), {alcance:c.alcance})),
      alarmes:d.alarmes.map(pt), gravador:pt(d.gravador), fundos:pt(d.fundos)
    };
    return {mapa:{M:d.M, x0:0, z0:0, cel, nx, nz, anda, ve, zona, pontos, chao:() => 0},
            dados:d, W, H};
  }

  /* o cone do olhar, cortado pelas paredes: um leque de raios que param
     na primeira célula opaca (`alcance` em unidades do motor) */
  function leque(J, o, alcance, abre, rumo){
    const m = J.mapa, n = 22, pts = [], passo = m.cel*0.5;
    const a0 = rumo - abre*Math.PI/180, a1 = rumo + abre*Math.PI/180;
    for(let r = 0; r <= n; r++){
      const a = a0 + (a1 - a0)*r/n, dx = Math.sin(a), dz = Math.cos(a);
      let L = 0;
      while(L < alcance){
        const nl = L + passo, x = o.x + dx*nl, z = o.y + dz*nl;
        const i = Math.floor((x - m.x0)/m.cel), j = Math.floor((z - m.z0)/m.cel);
        if(i < 0 || j < 0 || i >= m.nx || j >= m.nz || m.ve[j*m.nx + i] === 0) break;
        L = nl;
      }
      pts.push([o.x + dx*L, o.y + dz*L]);
    }
    return pts;
  }

  /* =======================================================
     2 e 3. O PALCO, O HUD E O CONTROLE
     ======================================================= */
  const COR_SIT = {'Normal':'#2e7d32', 'Suspeita':'#c77800', 'Alerta':'#c62828', 'Polícia no local':'#6a1b9a'};
  const ROT_SIT = () => ({'Normal':_t('Normal'), 'Suspeita':_t('Suspeita'), 'Alerta':_t('Alerta'), 'Polícia no local':_t('Polícia no local')});
  let ativo = null;

  /* a loja só abre com a foto e com os bonecos: sem um dos dois, quem
     chama recebe o erro e a equipe faz sozinha (a conta de acoes.js) */
  const temFoto = alvo => !!(TO.dados && TO.dados.cenas && TO.dados.cenas['assalto-' + alvo] &&
                             TO.dados.assaltos && TO.dados.assaltos[alvo]);
  function iniciar(op, grupo){
    if(!temFoto(op.alvo)) return Promise.resolve({erro:'sem a foto da loja'});
    return new Promise(ok => {
      let ctl = null;
      try { ctl = montar(op, grupo, r => { ativo = null; ok(r); }); }
      catch(err){ console.error('o assalto 2D:', err); ok({erro:String(err && err.message || err)}); return; }
      if(!ctl || ctl.erro){ ok({erro:(ctl && ctl.erro) || 'o tabuleiro não montou'}); return; }
      ativo = ctl;
    });
  }

  function montar(op, grupo, aoFim){
    const e = TO.estado.E, A = TO.acoes, MOT = TO.assaltoMotor;
    const f = A.fichaDoAssalto(op.alvo, op.n, op.horario), P = A.PERFIL_ASSALTO[op.alvo];
    if(!f || !P) return {erro:'alvo sem perfil'};
    const T = tabuleiro(op.alvo);
    if(!T) return {erro:'a loja não tem tabuleiro'};
    const B3 = TO.diaJogo.bonecos3;
    const nomeLoja = _t(f.a.nome);
    const cfg = {
      alvo:{id:op.alvo, nome:nomeLoja, recompensa:P.recompensa, exposicao:P.exposicao, seguranca:P.seguranca,
            movimentacao:P.movimentacao, atencao:f.atencao, dificuldade:P.dificuldade},
      equipe: grupo.map(m => ({id:m.id, nome:TO.membros.nomeDe(m)})),
      dentro: f.dentro, abordagem: op.abordagem, horario: op.horario, noite: op.horario === 'fechamento',
      calor: A.calorDe(e), potencial: f.potencial, distDelegacia: 500,
      semente: (TO.mapa.hash(op.id) % 100000) + 1
    };
    const J = MOT.criarAssalto(T.mapa, cfg);
    const L = J.lider;
    /* o que o boneco lê e o motor não tem */
    J.projeteis = J.projeteis || []; J.grades = J.grades || [];
    for(const d of J.discos){ d.spawn = d.spawn || d.id; if(d === L) d.doJogador = true; }
    let fechado = false, pausado = false, vista = 'perto';

    /* ---- o DOM: a foto, os bonecos e a camada de cima, na mesma caixa ---- */
    const raiz = el('div', 'asl2d');
    const cv = document.createElement('canvas'); cv.className = 'asl2d-cv'; raiz.appendChild(cv);
    const cvGL = document.createElement('canvas'); cvGL.className = 'asl2d-cv asl2d-gl'; raiz.appendChild(cvGL);
    const cvSobre = document.createElement('canvas'); cvSobre.className = 'asl2d-cv asl2d-sobre'; raiz.appendChild(cvSobre);
    const g = cv.getContext('2d'), gS = cvSobre.getContext('2d');
    const hud = el('div', 'asl-hud', raiz);
    const avisos = el('div', 'asl-avisos', raiz);
    const dica = el('div', 'asl-dica', raiz);
    const teclasTxt = el('div', 'asl-teclas', raiz);
    teclasTxt.innerHTML = _t('<b>WASD</b> anda · <b>Shift</b> corre · <b>E</b> (segurado) age · <b>Q</b> anuncia · <b>Z</b> distrai · <b>X</b> esperar/seguir · <b>V</b> câmera · <b>Esc</b> abortar');
    const botoes = el('div', 'asl-botoes', raiz);
    const bt = (rot, cls, fn) => {
      const b = el('button', cls || '', botoes); b.textContent = rot;
      b.addEventListener('pointerdown', ev => { ev.preventDefault(); fn(true, b); });
      b.addEventListener('pointerup', ev => { ev.preventDefault(); fn(false, b); });
      b.addEventListener('pointerleave', () => fn(false, b));
      return b;
    };
    const segura = {acao:false};
    const umaVez = {};
    const btAcao = bt(_t('Ação (E)'), 'forte', v => { segura.acao = v; });
    const btAnunciar = bt(_t('Anunciar (Q)'), 'perigo', v => { if(v) umaVez.anunciar = true; });
    const btDistrair = bt(_t('Distrair (Z)'), '', v => { if(v) umaVez.distrair = true; });
    const btOrdem = bt(_t('Esperar (X)'), '', v => { if(v) umaVez.ordem = 'alternar'; });
    bt(_t('Câmera (V)'), '', v => { if(v) trocarVista(); });
    bt(_t('Abortar'), '', v => { if(v) pedirAbortar(); });
    void btAcao;
    /* o joystick do toque */
    const joy = el('div', 'asl-joy', raiz); joy.innerHTML = '<i></i>';
    const pino = joy.firstChild, eixo = {x:0, y:0, m:0, id:null};
    const mexerJoy = ev => {
      const r = joy.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2;
      let dx = (ev.clientX - cx)/(r.width/2), dy = (ev.clientY - cy)/(r.height/2);
      const m = Math.hypot(dx, dy); if(m > 1){ dx /= m; dy /= m; }
      eixo.x = dx; eixo.y = dy; eixo.m = Math.min(1, m);
      pino.style.transform = `translate(${dx*38}px,${dy*38}px)`;
    };
    joy.addEventListener('pointerdown', ev => { eixo.id = ev.pointerId; joy.setPointerCapture(ev.pointerId); mexerJoy(ev); });
    joy.addEventListener('pointermove', ev => { if(ev.pointerId === eixo.id) mexerJoy(ev); });
    const soltarJoy = () => { eixo.id = null; eixo.x = eixo.y = eixo.m = 0; pino.style.transform = ''; };
    joy.addEventListener('pointerup', soltarJoy); joy.addEventListener('pointercancel', soltarJoy);
    document.body.appendChild(raiz);
    document.body.classList.add('asl2d-ativo');
    /* OS NOSSOS BONECOS: o mesmo renderizador das brigas, no canvas de
       cima da foto, crescidos na escala da foto (M px por metro) */
    if(!B3 || !B3.montar(cvGL)){ raiz.remove(); document.body.classList.remove('asl2d-ativo'); return {erro:'os bonecos não montaram (sem WebGL)'}; }
    const escalaAntes = B3.escalaDeCima, Jantes = TO.diaJogo.J;
    B3.escalaDeCima = escalaAntes * (T.mapa.M / PX_POR_METRO_DO_BONECO);
    TO.diaJogo.J = J;

    /* ---- o teclado ---- */
    const teclas = new Set();
    const JOGO = new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','e','q','z','x','v','escape',' ']);
    const aoDescer = ev => {
      if(fechado) return;
      const k = ev.key.toLowerCase();
      if(!JOGO.has(k)) return;
      ev.preventDefault(); ev.stopPropagation();
      if(ev.repeat && k !== 'e') return;
      teclas.add(k);
      if(k === 'q') umaVez.anunciar = true;
      if(k === 'z') umaVez.distrair = true;
      if(k === 'x') umaVez.ordem = 'alternar';
      if(k === 'v') trocarVista();
      if(k === 'escape') pedirAbortar();
    };
    const aoSubir = ev => { const k = ev.key.toLowerCase(); if(JOGO.has(k)){ teclas.delete(k); ev.preventDefault(); } };
    const soltarTudo = () => teclas.clear();
    window.addEventListener('keydown', aoDescer, true);
    window.addEventListener('keyup', aoSubir, true);
    window.addEventListener('blur', soltarTudo);
    /* o vetor do teclado e do joystick: de cima, W é pra cima da tela (−z) */
    function vetor(){
      let dx = 0, dy = 0;
      if(teclas.has('a') || teclas.has('arrowleft')) dx--;
      if(teclas.has('d') || teclas.has('arrowright')) dx++;
      if(teclas.has('w') || teclas.has('arrowup')) dy--;
      if(teclas.has('s') || teclas.has('arrowdown')) dy++;
      let forca = dx || dy ? 1 : 0;
      if(!forca && eixo.m > 0.16){ dx = eixo.x; dy = eixo.y; forca = eixo.m; }
      if(!forca) return {mx:0, mz:0, correr:false};
      const m = Math.hypot(dx, dy) || 1;
      return {mx:dx/m*Math.min(1, forca), mz:dy/m*Math.min(1, forca), correr:teclas.has('shift') || eixo.m > 0.92};
    }

    /* ---- a câmera ---- */
    /* de perto: uns 16 m na menor dimensão da tela, atrás do líder; de
       cima (V): a loja inteira com a calçada e a van */
    const cam = {x:L.x, y:L.y, s:0};
    const caixaLoja = (() => {
      const r = T.dados.loja.reduce((a, b) => ({x0:Math.min(a.x0, b.x0), y0:Math.min(a.y0, b.y0), x1:Math.max(a.x1, b.x1), y1:Math.max(a.y1, b.y1)}));
      const c = T.dados.carro;
      return {x0:Math.min(r.x0, c.x) - 60, y0:r.y0 - 40, x1:Math.max(r.x1, c.x) + 60, y1:Math.max(r.y1, c.y) + 60};
    })();
    function alvoDaVista(w, h){
      if(vista === 'alto'){
        const b = caixaLoja;
        return {x:(b.x0 + b.x1)/2, y:(b.y0 + b.y1)/2, s:Math.min(w/(b.x1 - b.x0), h/(b.y1 - b.y0))};
      }
      const quem = L.vivo || L.preso ? L : J.equipe.find(d => d.vivo) || L;
      return {x:quem.x, y:quem.y, s:Math.min(w, h)/(16*T.mapa.M)};
    }
    function trocarVista(){ vista = vista === 'perto' ? 'alto' : 'perto'; }

    /* ---- o quadro ---- */
    let ult = performance.now(), tHud = 0, raf = 0;
    function quadro(agora){
      if(fechado) return;
      raf = requestAnimationFrame(quadro);
      const dt = Math.min(0.1, (agora - ult)/1000); ult = agora;
      if(!pausado){
        const v = vetor();
        const ent = ctl.robo ? Object.assign(ctl.robo(J) || {}, umaVez)
          : {mx:v.mx, mz:v.mz, correr:v.correr, acao:teclas.has('e') || teclas.has(' ') || segura.acao, ...umaVez};
        for(const k of Object.keys(umaVez)) delete umaVez[k];
        MOT.passoAssalto(J, dt, ent);
        tHud -= dt;
        if(tHud <= 0){ tHud = 0.1; pintarHud(); }
      }
      desenhar(pausado ? 0 : dt);
      if(J.fim && !fechado) terminar();
    }

    let escala = {s:1, ox:0, oy:0};
    function desenhar(dt){
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(cv.clientWidth*dpr), h = Math.round(cv.clientHeight*dpr);
      for(const c of [cv, cvSobre]) if(c.width !== w || c.height !== h){ c.width = w; c.height = h; }
      /* a câmera vai atrás do líder sem passar da borda da foto */
      const alvo = alvoDaVista(w, h), k = cam.s ? 1 - Math.exp(-(dt || 0.016)*6) : 1;
      cam.x += (alvo.x - cam.x)*k; cam.y += (alvo.y - cam.y)*k; cam.s += (alvo.s - cam.s)*k;
      const s = Math.max(cam.s, Math.max(w/T.W, h/T.H));
      let ox = w/2 - cam.x*s, oy = h/2 - cam.y*s;
      ox = clamp(ox, w - T.W*s, 0); oy = clamp(oy, h - T.H*s, 0);
      escala = {s, ox, oy};
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#0e0e0d'; g.fillRect(0, 0, w, h);
      g.setTransform(s, 0, 0, s, ox, oy);
      TO.diaJogo.arredores.desenharFundo(g);
      /* OS OLHARES, no chão, por baixo dos bonecos */
      const R = MOT.REGUA, M = T.mapa.M;
      const cone = (o, alc, abre, rumo, cor) => {
        const pts = leque(J, o, alc*M, abre, rumo);
        g.fillStyle = cor; g.beginPath(); g.moveTo(o.x, o.y);
        for(const [px, pz] of pts) g.lineTo(px, pz);
        g.closePath(); g.fill();
      };
      if(!J.camerasDesligadas) for(const cm of J.cameras){
        cone(cm, cm.alcance, cm.abre, cm.rumo, cm.viu > 0.01 ? 'rgba(255,82,82,.22)' : 'rgba(120,170,255,.14)');
        g.fillStyle = '#1b1b1b'; g.fillRect(cm.x - 5, cm.y - 5, 10, 10);
        g.fillStyle = cm.viu > 0.01 ? '#ff5252' : '#7fb0ff'; g.fillRect(cm.x - 2, cm.y - 2, 4, 4);
      }
      for(const o of J.povo){
        if(o.fora || o.sumiu || o.estado === 'rendido' || o.estado === 'fugindo' || o.estado === 'ligando') continue;
        /* quem passa e quem compra só ganham cone quando desconfiam */
        if((o.papel === 'passante' || o.papel === 'cliente') && o.estado === 'normal') continue;
        const [alc0, abre] = R.olhar[o.papel] || R.olhar.cliente;
        const alc = o.distraidoAte > J.t ? 1.5 : alc0;
        cone(o, alc, abre, o.rumo, o.estado === 'alerta' ? 'rgba(255,82,82,.22)'
          : o.estado === 'desconfiado' ? 'rgba(255,200,60,.2)' : 'rgba(255,255,255,.12)');
      }
      /* o saque que ainda tem, e o anel do progresso */
      const rS = Math.max(6, 0.32*M);
      for(const sq of J.saque){
        if(sq.vazio) continue;
        g.fillStyle = 'rgba(255,211,90,.28)'; g.beginPath(); g.arc(sq.x, sq.y, rS*1.7, 0, Math.PI*2); g.fill();
        g.fillStyle = '#ffd35a'; g.beginPath(); g.arc(sq.x, sq.y, rS, 0, Math.PI*2); g.fill();
        g.fillStyle = '#3b2c00'; g.font = `800 ${rS*1.2}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('$', sq.x, sq.y + 0.5);
        if(sq.prog > 0){ g.strokeStyle = '#fff'; g.lineWidth = 3/s; g.beginPath(); g.arc(sq.x, sq.y, rS*1.45, -Math.PI/2, -Math.PI/2 + Math.PI*2*clamp(sq.prog/sq.tempo, 0, 1)); g.stroke(); }
        if(sq.precisa > 1){ g.fillStyle = '#fff'; g.font = `700 ${rS}px system-ui,sans-serif`; g.fillText('×' + sq.precisa, sq.x, sq.y + rS*2.2); }
      }
      /* OS NOSSOS BONECOS */
      try{
        if(B3.ativo === false) throw new Error('contexto WebGL perdido');
        B3.desenharDeCima(J, {escala, cw:w, ch:h, dt:dt || 0.016});
      }catch(err){ console.warn('assalto: bonecos — ' + (err && err.message)); }
      /* POR CIMA: o anel do líder, o alvo da ação, o "?" e o "!" */
      gS.setTransform(1, 0, 0, 1, 0, 0); gS.clearRect(0, 0, w, h);
      gS.setTransform(s, 0, 0, s, ox, oy);
      const ac = J.acao;
      gS.lineWidth = 2.5/s;
      if(ac && ac.alvo){ gS.strokeStyle = '#ffd35a'; gS.setLineDash([5/s, 4/s]); gS.beginPath(); gS.arc(ac.alvo.x, ac.alvo.y, 0.75*M, 0, Math.PI*2); gS.stroke(); gS.setLineDash([]); }
      if(L.vivo){ gS.strokeStyle = '#ffd35a'; gS.beginPath(); gS.ellipse(L.x, L.y, 0.45*M, 0.3*M, 0, 0, Math.PI*2); gS.stroke(); }
      gS.font = `900 ${Math.max(16/s, 0.7*M)}px system-ui,sans-serif`; gS.textAlign = 'center'; gS.textBaseline = 'bottom';
      for(const mk of J.marcas){
        const yy = mk.d.y - 1.9*M;
        gS.fillStyle = mk.tipo === '!' ? '#ff5252' : '#ffd35a';
        gS.strokeStyle = 'rgba(0,0,0,.75)'; gS.lineWidth = 4/s;
        gS.strokeText(mk.tipo, mk.d.x, yy); gS.fillText(mk.tipo, mk.d.x, yy);
      }
      /* o fechamento é de noitinha */
      if(cfg.noite){ gS.setTransform(1, 0, 0, 1, 0, 0); gS.fillStyle = 'rgba(10,14,40,.18)'; gS.fillRect(0, 0, w, h); }
    }

    /* ---- o HUD ---- */
    const barra = (rot, v, cor) =>
      `<div class="asl-barra"><div class="rot"><span>${rot}</span><span>${Math.round(v)}</span></div><div class="fundo"><div class="cheio" style="width:${clamp(v, 0, 100)}%;background:${cor}"></div></div></div>`;
    const historico = [];
    const nomeHora = {abertura:_t('Abertura'), tarde:_t('Tarde'), fechamento:_t('Fechamento')};
    function pintarHud(){
      const sit = J.situacao;
      const dentro = J.equipe.filter(d => d.papel !== 'olheiro' && !d.preso && !d.fugiu).length;
      const fora = J.equipe.filter(d => d.papel === 'olheiro' && !d.preso && !d.fugiu).length, presos = J.equipe.filter(d => d.preso).length;
      const olhos = MOT.olhosEm(J, L), gente = olhos.filter(x => !x.camera).length, cams = olhos.length - gente;
      const pm = J.pmChegou ? _t('{n} PMs na rua', {n:J.policiais.filter(p => p.vivo).length})
        : J.alerta ? (J.etaConhecido ? _t('chega em {s} s', {s:Math.max(0, Math.ceil(J.eta - (J.t - J.tAlerta)))}) : _t('a caminho'))
        : _t('ninguém chamou');
      hud.innerHTML = `<h3>${esc(nomeLoja)} <small>${esc(_t('nível {n}', {n:A.ASSALTOS.length - A.ASSALTOS.findIndex(x => x.id === op.alvo)}))}</small></h3>`
        + `<div class="sub">${esc(cfg.abordagem === 'rapido' ? _t('Rápido') : _t('Furtivo'))} · ${esc(nomeHora[cfg.horario] || '')} · ${Math.floor(J.t/60)}:${String(Math.floor(J.t % 60)).padStart(2, '0')}</div>`
        + barra(_t('Exposição'), J.exposicao, J.exposicao > 66 ? '#ff5252' : J.exposicao > 33 ? '#ffb74d' : '#8bc34a')
        + barra(_t('Suspeita'), J.suspeita, J.suspeita > 66 ? '#ff5252' : J.suspeita > 33 ? '#ffb74d' : '#8bc34a')
        + `<div class="asl-sit" style="background:${COR_SIT[sit] || '#444'}">${esc(ROT_SIT()[sit] || sit)}</div>`
        + `<div class="asl-linha"><span>${esc(_t('Butim'))}</span><b>${dinheiro(J.butim)} / ${dinheiro(J.potencial)}</b></div>`
        + `<div class="asl-linha"><span>${esc(_t('Equipe'))}</span><span>${esc(_t('{d} dentro · {f} fora · {p} presos', {d:dentro, f:fora, p:presos}))}</span></div>`
        + `<div class="asl-linha"><span>${esc(_t('Polícia'))}</span><span>${esc(pm)}</span></div>`
        + `<div class="asl-olho">${gente ? esc(_tn(gente, '{n} pessoa te olhando', '{n} pessoas te olhando')) : esc(_t('ninguém te olhando'))}${cams ? ' · ' + esc(_tn(cams, '{n} câmera', '{n} câmeras')) : ''}${J.ordem === 'esperar' ? ' · ' + esc(_t('equipe esperando')) : ''}</div>`;
      const ac = J.acao || MOT.acaoPossivel(J);
      let txt = '';
      if(ac){
        txt = `<b>[E]</b> ${esc(ac.rot)}` + (ac.tipo === 'saque' ? ' · ' + dinheiro(ac.alvo.valor) : '');
        if(ac.tipo === 'saque' && ac.alvo.prog > 0) txt += `<div class="asl-prog"><i style="width:${clamp(ac.alvo.prog/ac.alvo.tempo*100, 0, 100)}%"></i></div>`;
        if(J.progresso && J.progresso.gravador) txt += `<div class="asl-prog"><i style="width:${clamp(J.progresso.prog/J.progresso.tempo*100, 0, 100)}%"></i></div>`;
      } else txt = esc(J.dica);
      const conversa = !J.anunciado && MOT.alvoDaConversa(J);
      if(conversa && !ac) txt += ` · <b>[Z]</b> ${esc(_t('distrair'))}`;
      dica.innerHTML = txt;
      btAnunciar.disabled = J.anunciado;
      btDistrair.disabled = J.anunciado || !conversa;
      btOrdem.textContent = J.ordem === 'esperar' ? _t('Seguir (X)') : _t('Esperar (X)');
      for(const a of J.avisos.splice(0)){
        const d = document.createElement('div'); d.style.color = a.cor || '#fff'; d.textContent = a.txt;
        avisos.prepend(d); setTimeout(() => d.remove(), 6000);
        while(avisos.children.length > 4) avisos.lastChild.remove();
        historico.push(a);
      }
    }

    /* ---- abortar ---- */
    function pedirAbortar(){
      if(fechado || J.fim) return;
      pausado = true;
      const w = el('div', 'asl-fim', raiz);
      w.innerHTML = `<div class="caixa"><h2>${esc(_t('Abortar o assalto?'))}</h2><p>${esc(_t('A equipe larga tudo e some. O que já pegou vai junto; com a polícia na rua, quem estiver perto dela cai.'))}</p><button class="sim">${esc(_t('Abortar'))}</button><button class="nao">${esc(_t('Continuar o assalto'))}</button></div>`;
      w.querySelector('.sim').onclick = () => { w.remove(); pausado = false; umaVez.abortar = true; };
      w.querySelector('.nao').onclick = () => { w.remove(); pausado = false; };
    }
    /* ---- o fim ---- */
    function terminar(){
      if(fechado) return;
      fechado = true;
      cancelAnimationFrame(raf);
      const f2 = J.fim;
      pintarHud();
      desenhar(0);
      const titulo = f2.abortou ? _t('Assalto abortado') : f2.motivo === 'lider-preso' ? _t('Deu ruim: o líder caiu')
        : f2.motivo === 'tempo' ? _t('A equipe desistiu') : f2.butim > 0 ? _t('Assalto feito') : _t('Saíram de mãos vazias');
      const linha = (a, b) => `<div class="linha"><span>${esc(a)}</span><b>${esc(b)}</b></div>`;
      const w = el('div', 'asl-fim', raiz);
      w.innerHTML = `<div class="caixa"><h2>${esc(titulo)}</h2>`
        + linha(_t('Butim'), dinheiro(f2.butim))
        + (f2.pego > f2.butim ? `<p class="obs">${esc(_t('Pegaram {pego}', {pego:dinheiro(f2.pego)}) + ': ' + [f2.aPe ? _tn(f2.aPe, '{n} saiu a pé, longe do carro, e largou metade', '{n} saíram a pé, longe do carro, e largaram metade') : '', f2.presos.length ? _t('o que os presos levavam ficou com a polícia') : ''].filter(Boolean).join('; ') + '.')}</p>` : '')
        + linha(_t('Presos'), String(f2.presos.length))
        + linha(_t('Exposição'), String(f2.exposicao))
        + linha(_t('Alerta'), f2.alerta ? _t('sim') : _t('não'))
        + linha(_t('Polícia no local'), f2.policia ? _t('sim') : _t('não'))
        + linha(_t('Câmeras'), f2.camerasDesligadas ? _t('desligadas') : f2.gravado ? _t('gravaram a equipe') : _t('não pegaram nada'))
        + linha(_t('Tempo'), `${Math.floor(f2.tempo/60)}:${String(f2.tempo % 60).padStart(2, '0')}`)
        + `<button class="sim">${esc(_t('Voltar pro jogo'))}</button></div>`;
      w.querySelector('button').onclick = () => { desmontar(); aoFim(Object.assign({modo:'2d', alvo:op.alvo}, f2)); };
    }
    function desmontar(){
      cancelAnimationFrame(raf);
      try{ B3.limparDeCima(); }catch(_){ }
      B3.escalaDeCima = escalaAntes;
      if(TO.diaJogo.J === J) TO.diaJogo.J = Jantes;
      window.removeEventListener('keydown', aoDescer, true);
      window.removeEventListener('keyup', aoSubir, true);
      window.removeEventListener('blur', soltarTudo);
      raiz.remove();
      document.body.classList.remove('asl2d-ativo');
    }
    pintarHud();
    raf = requestAnimationFrame(t => { ult = t; quadro(t); });
    const ctl = {
      J, T, historico, robo:null,
      /* pro teste: o passo com uma entrada, o fim */
      passo: (dt, ent) => MOT.passoAssalto(J, dt, ent || {}),
      parar: () => { if(!fechado){ fechado = true; desmontar(); } },
      fecharFim: () => { const b = raiz.querySelector('.asl-fim button.sim'); if(b) b.click(); },
      get fechado(){ return fechado; }
    };
    return ctl;
  }
  function el(tag, cls, pai){
    const d = document.createElement(tag);
    if(cls) d.className = cls;
    if(pai) pai.appendChild(d);
    return d;
  }

  TO.assalto2d = {tabuleiro, iniciar, temFoto, get ativo(){ return ativo; }};
})();
