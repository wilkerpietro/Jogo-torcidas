/* =========================================================
   O ASSALTO NO 2D, VISTO DE CIMA (pedido do dono, 10/10/2026:
   "criar os cenários de assalto agora, similares a como funciona no 3d,
   cada uma num nível de dificuldade")

   O motor é o do jogo 3D, inteiro (assalto_motor.js: a percepção —
   exposição, suspeita, alerta —, o anúncio, o saque, a polícia, a fuga);
   as lojas são as plantas do 3D (lojas.js). Aqui fica o que é do 2D:

   1. O TABULEIRO (`tabuleiro`): a loja no meio de um quarteirão
      inventado — a rua da frente, a calçada, a rua de lado (a esquina,
      por onde sai a porta dos fundos), os prédios vizinhos — numa grade
      de 25 cm: onde o corpo cabe (a parede e o móvel, engordados do
      raio do corpo, não), o que barra o olhar (a parede e o móvel alto;
      o vidro deixa ver), as zonas (a loja e a área restrita) e os
      pontos: o carro da fuga, os olheiros, por onde a PM chega, por
      onde o povo passa.
   2. O PALCO: um canvas por cima de tudo, a planta desenhada de cima
      (o chão e os móveis assados uma vez numa camada só), e por cima,
      a cada quadro, o saque, as câmeras, quem está lá e o CONE DO
      OLHAR de cada um — cortado pelas paredes, que é o que o jogador
      precisa ver pra fazer o furtivo.
   3. O HUD e o CONTROLE: a Exposição, a Suspeita e a Situação, o butim,
      a equipe, a polícia, quem está te olhando; o teclado (WASD/setas,
      Shift, E, Q, Z, X, V, Esc) e, no toque, o joystick e os botões.

   Os seis alvos são seis níveis: roupas e mercadinho (nível 1 e 2), o
   posto (3), o supermercado (4), a joalheria (5) e o banco (6) — o
   perfil de cada um (acoes.js, PERFIL_ASSALTO) e a planta fazem a
   dificuldade: mais segurança, mais câmera, mais gente olhando, o cofre
   que pede três da equipe juntos.
   ========================================================= */
(function(){
  'use strict';
  const U = TO.util;
  const CEL = 0.25, RAIO = 0.2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const dinheiro = v => U.dinheiro(Math.round(v || 0));

  /* =======================================================
     1. O TABULEIRO
     ======================================================= */
  /* a medida do quarteirão (m): a calçada, a rua e a rua de lado */
  const Q = {calc:2.5, rua:7, margem:16, lado:9.5, ladoCalc:2.2, fundo:3};
  function tabuleiro(tipo){
    const Lj = TO.lojas;
    const W = Lj.MEDIDAS_LOJA[tipo].larg, D = Lj.FUNDO_LOJA[tipo];
    const planta = Lj.plantaDaLoja(tipo, W, D, 'dir');
    const plano = Lj.planoDaLoja(tipo, W, D, 'dir');
    const x0 = -Q.margem, x1 = W + Q.margem, z0 = -D - Q.fundo, z1 = Q.calc + Q.rua + Q.calc;
    const nx = Math.ceil((x1 - x0) / CEL), nz = Math.ceil((z1 - z0) / CEL);
    const anda = new Uint8Array(nx*nz), ve = new Uint8Array(nx*nz), zona = new Uint8Array(nx*nz);
    /* o chão de cada célula: 0 prédio, 1 calçada, 2 asfalto, 3 lote */
    const chao = new Uint8Array(nx*nz);
    const ladoX0 = W, ladoX1 = W + Q.lado;
    const tipoDoChao = (x, z) => {
      if(z > 0) return (z <= Q.calc || z > Q.calc + Q.rua) ? 1 : 2;
      if(x >= ladoX0 && x <= ladoX1 && z >= z0)
        return (x <= ladoX0 + Q.ladoCalc || x >= ladoX1 - Q.ladoCalc) ? 1 : 2;
      if(x >= 0 && x <= W && z >= -D) return 3;
      return 0;
    };
    /* o que barra o corpo: as paredes (vidro também) sem os vãos, e os
       móveis (a cobertura do posto é teto, não chão) */
    const barra = [];
    for(const p of planta.paredes){
      const vaos = (p.vaos || []).slice().sort((a, b) => a.a0 - b.a0);
      let a = p.a0;
      const corta = (u0, u1) => { if(u1 - u0 < 1e-3) return; barra.push(p.ao === 'x' ? {x0:u0, x1:u1, z0:p.c0, z1:p.c1} : {x0:p.c0, x1:p.c1, z0:u0, z1:u1}); };
      for(const v of vaos){ corta(a, v.a0); a = Math.max(a, v.a1); }
      corta(a, p.a1);
    }
    for(const m of planta.moveis) if(m.tipo !== 'cobertura') barra.push(m);
    const dentro = (r, x, z, f) => x >= r.x0 - f && x <= r.x1 + f && z >= r.z0 - f && z <= r.z1 + f;
    const opacos = plano.opacos;
    for(let j = 0; j < nz; j++) for(let i = 0; i < nx; i++){
      const k = j*nx + i, wx = x0 + (i + 0.5)*CEL, wz = z0 + (j + 0.5)*CEL;
      const c = tipoDoChao(wx, wz);
      chao[k] = c;
      if(c === 0){ anda[k] = 0; ve[k] = 0; continue; }
      if(c === 3){
        anda[k] = barra.some(r => dentro(r, wx, wz, RAIO)) ? 0 : 1;
        ve[k] = opacos.some(o => dentro(o, wx, wz, 0)) ? 0 : 1;
        zona[k] = plano.zonas.restrita.some(r => dentro(r, wx, wz, 0)) ? 2
          : plano.zonas.loja.some(r => dentro(r, wx, wz, 0)) && !(plano.zonas.fora || []).some(r => dentro(r, wx, wz, 0)) ? 1 : 0;
      } else {
        /* o lote encosta na calçada: a primeira faixa dele não é rua */
        anda[k] = 1; ve[k] = 1;
      }
    }
    const idx = (wx, wz) => { const i = Math.floor((wx - x0)/CEL), j = Math.floor((wz - z0)/CEL); return i < 0 || j < 0 || i >= nx || j >= nz ? -1 : j*nx + i; };
    const centro = k => ({x: x0 + ((k % nx) + 0.5)*CEL, z: z0 + (Math.floor(k/nx) + 0.5)*CEL});
    const soltar = (wx, wz, ate = 3) => {
      const k0 = idx(wx, wz);
      if(k0 >= 0 && anda[k0]) return {x:wx, z:wz};
      const R = Math.ceil(ate/CEL), i0 = Math.floor((wx - x0)/CEL), j0 = Math.floor((wz - z0)/CEL);
      let best = -1, bd = Infinity;
      for(let dj = -R; dj <= R; dj++) for(let di = -R; di <= R; di++){
        const i = i0 + di, j = j0 + dj;
        if(i < 0 || j < 0 || i >= nx || j >= nz || !anda[j*nx + i]) continue;
        const d = di*di + dj*dj;
        if(d < bd){ bd = d; best = j*nx + i; }
      }
      return best >= 0 ? centro(best) : null;
    };
    /* SÓ O CHÃO LIGADO À CALÇADA (o que se alcança andando da rua) */
    {
      const semente = soltar(W/2, 1.2, 3);
      const n = nx*nz, visto = new Uint8Array(n), fila = new Int32Array(n);
      let a = 0, b = 0;
      const s0 = idx(semente.x, semente.z); visto[s0] = 1; fila[b++] = s0;
      while(a < b){
        const k = fila[a++], i = k % nx, j = (k - i)/nx;
        for(const [di, dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const ii = i + di, jj = j + dj, q = jj*nx + ii;
          if(ii < 0 || jj < 0 || ii >= nx || jj >= nz || visto[q] || !anda[q]) continue;
          visto[q] = 1; fila[b++] = q;
        }
      }
      for(let k = 0; k < n; k++) if(!visto[k]) anda[k] = 0;
    }
    const naRua = (x, z, ate = 3) => soltar(x, z, ate);
    const frente = plano.portas.find(q => q.rua === 'frente') || plano.portas[0];
    /* O CARRO DA FUGA: no asfalto da frente, do lado de dentro da quadra
       (longe da esquina), a uns 11 m da porta */
    const carro = Object.assign(naRua(frente.x - 11, Q.calc + 1.6, 4), {rumo:-Math.PI/2});
    const olheiros = [naRua(W + 1.1, 1.2, 3), naRua(-7, 1.2, 3)].filter(Boolean)
      .map((p, i) => Object.assign(p, {rumo: i === 0 ? Math.PI/2 : -Math.PI/2}));
    const chegadaPM = [naRua(x0 + 2, Q.calc + 4.5, 4), naRua(x1 - 2, Q.calc + 4.5, 4),
                       naRua(W + Q.lado/2, z0 + 1, 4)].filter(Boolean).map(p => Object.assign(p, {rumo:0}));
    const rua = [];
    for(const lx of [-13, -8, -3, W/2, W + 4, W + 10, W + 14]){ const p = naRua(lx, 1.2, 2); if(p) rua.push(p); }
    for(const lz of [-2, -D/2, -D + 1]){ const p = naRua(W + 1.1, lz, 2); if(p) rua.push(p); }
    const fugaPovo = [naRua(x0 + 1, 1.2, 3), naRua(x1 - 1, 1.2, 3)].filter(Boolean);
    const cp = p => p ? Object.assign({}, p) : null;
    const pontos = {
      carro, olheiros, chegadaPM, rua, fugaPovo,
      porta: {x:frente.x, z:frente.z}, saidaRua: {x:frente.x, z:2.2},
      funcionarios: plano.funcionarios.map(cp), segurancas: plano.segurancas.map(s => Object.assign(cp(s), {ronda:(s.ronda || []).map(cp)})),
      clientes: plano.clientes.map(cp), saque: plano.saque.map(cp), cameras: plano.cameras.map(cp), alarmes: plano.alarmes.map(cp),
      gravador: cp(plano.gravador), fundos: cp(plano.fundos)
    };
    return {
      mapa:{M:1, x0, z0, cel:CEL, nx, nz, anda, ve, zona, pontos, chao:() => 0},
      chao, planta, plano, W, D, x0, x1, z0, z1, nx, nz, idx
    };
  }

  /* =======================================================
     2. O DESENHO
     ======================================================= */
  const COR_MOVEL = {
    gondola:'#b49a6c', prateleira_parede:'#a98f63', prateleira_baixa:'#c2a878', geladeiras:'#d6e8ee', cofre:'#59606a',
    cofre_forte:'#4a5058', vitrine_balcao:'#bfe3f2', vitrine_fachada:'#cfeaf5', arara:'#8e5a8a', mesa_gerente:'#7a5a3a',
    armario:'#6b5a48', atm:'#2f5f96', poste_fila:'#888', banco_espera:'#6d6d6d', ilha:'#8a8a86', totem:'#2e7d32',
    pilha:'#a58a5a', bancada:'#6b5b4b', provador:'#7d3a6c', gravador:'#1d1d1d', checkout:'#77797c'
  };
  /* a camada parada (o chão, as paredes, os móveis), assada uma vez a PX por metro */
  const PX = 24;
  function assar(T, tipo){
    const cv = document.createElement('canvas');
    const w = Math.ceil((T.x1 - T.x0)*PX), h = Math.ceil((T.z1 - T.z0)*PX);
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    const X = x => (x - T.x0)*PX, Z = z => (z - T.z0)*PX;
    const cor = (TO.lojas.COR_LOJA() || {})[tipo] || {piso:'#ddd', balcao:'#876'};
    /* o chão, célula a célula, numa ImageData */
    const img = g.createImageData(T.nx, T.nz);
    const PAL = [[78,66,58], [150,146,138], [56,58,62], null];
    const piso = hex => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
    const pisoL = piso(cor.piso), pistaP = [176,174,168];
    for(let k = 0; k < T.nx*T.nz; k++){
      const c = T.chao[k];
      let rgb = PAL[c];
      if(c === 3){
        const zn = T.mapa.zona[k];
        rgb = zn === 2 ? pisoL.map(v => Math.round(v*0.86)) : zn === 1 ? pisoL : pistaP;
      }
      img.data[k*4] = rgb[0]; img.data[k*4+1] = rgb[1]; img.data[k*4+2] = rgb[2]; img.data[k*4+3] = 255;
    }
    const tmp = document.createElement('canvas'); tmp.width = T.nx; tmp.height = T.nz;
    tmp.getContext('2d').putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(tmp, 0, 0, w, h);
    /* os prédios vizinhos: o telhado com as linhas */
    {
      g.save();
      g.beginPath();
      for(let j = 0; j < T.nz; j++) for(let i = 0; i < T.nx; i++) if(T.chao[j*T.nx + i] === 0) g.rect(i*CEL*PX, j*CEL*PX, CEL*PX + 0.5, CEL*PX + 0.5);
      g.clip();
      g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 2;
      for(let y = 0; y < h; y += 14){ g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.restore();
    }
    /* a faixa da rua */
    g.strokeStyle = 'rgba(240,210,90,.55)'; g.lineWidth = 2; g.setLineDash([16, 14]);
    const zm = Q.calc + Q.rua/2;
    g.beginPath(); g.moveTo(0, Z(zm)); g.lineTo(X(T.W), Z(zm)); g.moveTo(X(T.W + Q.lado), Z(zm)); g.lineTo(w, Z(zm)); g.stroke();
    const xm = T.W + Q.lado/2;
    g.beginPath(); g.moveTo(X(xm), 0); g.lineTo(X(xm), Z(0)); g.stroke();
    g.setLineDash([]);
    /* os móveis */
    for(const m of T.planta.moveis){
      const x = X(m.x0), y = Z(m.z0), mw = (m.x1 - m.x0)*PX, mh = (m.z1 - m.z0)*PX;
      if(m.tipo === 'cobertura'){
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([6, 6]); g.lineWidth = 2;
        g.strokeRect(x, y, mw, mh); g.setLineDash([]); continue;
      }
      g.fillStyle = m.tipo === 'balcao' || m.tipo === 'guiche' ? cor.balcao : (COR_MOVEL[m.tipo] || '#999');
      g.fillRect(x, y, mw, mh);
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, mw - 1, mh - 1);
      if(m.tipo === 'guiche'){ g.fillStyle = 'rgba(160,210,240,.5)'; g.fillRect(x, y + mh*0.35, mw, mh*0.3); }
      if(m.tipo === 'cofre' || m.tipo === 'cofre_forte'){
        g.strokeStyle = '#c9ced6'; g.lineWidth = 2; g.beginPath();
        g.arc(x + mw/2, y + mh/2, Math.min(mw, mh)*0.28, 0, Math.PI*2); g.stroke();
      }
    }
    /* as paredes: a de alvenaria escura, o vidro azulado */
    for(const p of T.planta.paredes){
      const vaos = (p.vaos || []).slice().sort((a, b) => a.a0 - b.a0);
      let a = p.a0;
      const corta = (u0, u1) => {
        if(u1 - u0 < 1e-3) return;
        const r = p.ao === 'x' ? {x0:u0, x1:u1, z0:p.c0, z1:p.c1} : {x0:p.c0, x1:p.c1, z0:u0, z1:u1};
        const ex = Math.max(3, (r.x1 - r.x0)*PX), ez = Math.max(3, (r.z1 - r.z0)*PX);
        g.fillStyle = p.vidro ? 'rgba(150,205,240,.9)' : '#1b1b1d';
        g.fillRect(X(r.x0) - (ex === 3 ? 1 : 0), Z(r.z0) - (ez === 3 ? 1 : 0), ex, ez);
      };
      for(const v of vaos){ corta(a, v.a0); a = Math.max(a, v.a1); }
      corta(a, p.a1);
    }
    /* os botões do alarme e o gravador */
    for(const al of T.plano.alarmes){ g.fillStyle = '#d32f2f'; g.beginPath(); g.arc(X(al.x), Z(al.z), 3, 0, Math.PI*2); g.fill(); }
    if(T.plano.gravador){ g.fillStyle = '#111'; g.fillRect(X(T.plano.gravador.x) - 5, Z(T.plano.gravador.z) - 5, 10, 10); g.fillStyle = '#e53935'; g.fillRect(X(T.plano.gravador.x) - 1.5, Z(T.plano.gravador.z) - 1.5, 3, 3); }
    /* o letreiro na calçada, em cima da porta */
    const nome = (TO.lojas.NOMES_LOJA[tipo] || [''])[0];
    g.font = `700 ${Math.round(PX*0.55)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(X(T.W/2) - g.measureText(nome).width/2 - 6, Z(0.55) - PX*0.38, g.measureText(nome).width + 12, PX*0.76);
    g.fillStyle = '#fff'; g.fillText(nome, X(T.W/2), Z(0.55));
    return cv;
  }

  /* o cone do olhar, cortado pelas paredes: um leque de raios que param
     na primeira célula opaca */
  function leque(J, o, alcance, abre, rumo){
    const m = J.mapa, n = 22, pts = [];
    const a0 = rumo - abre*Math.PI/180, a1 = rumo + abre*Math.PI/180;
    for(let r = 0; r <= n; r++){
      const a = a0 + (a1 - a0)*r/n, dx = Math.sin(a), dz = Math.cos(a);
      let L = 0;
      while(L < alcance){
        const nl = L + CEL*0.5, x = o.x + dx*nl, z = o.y + dz*nl;
        const i = Math.floor((x - m.x0)/m.cel), j = Math.floor((z - m.z0)/m.cel);
        if(i < 0 || j < 0 || i >= m.nx || j >= m.nz || m.ve[j*m.nx + i] === 0) break;
        L = nl;
      }
      pts.push([o.x + dx*L, o.y + dz*L]);
    }
    return pts;
  }

  /* =======================================================
     3. O PALCO, O HUD E O CONTROLE
     ======================================================= */
  const COR_SIT = {'Normal':'#2e7d32', 'Suspeita':'#c77800', 'Alerta':'#c62828', 'Polícia no local':'#6a1b9a'};
  const ROT_SIT = () => ({'Normal':_t('Normal'), 'Suspeita':_t('Suspeita'), 'Alerta':_t('Alerta'), 'Polícia no local':_t('Polícia no local')});
  let ativo = null;

  /* A CENA SÓ ABRE COM A FOTO (decisão do dono, 10/10/2026: "os bonecos
     têm que ser os nossos bonecos"): o desenho de bolinhas daqui é o
     andaime, e fica desligado até a foto de cada loja chegar
     (img/cenas/PROMPT-ASSALTOS.md) e virar cena com os bonecos das
     brigas. Sem ela, quem chama recebe o erro e a equipe faz sozinha. */
  const temFoto = alvo => !!(TO.dados && TO.dados.cenas && TO.dados.cenas['assalto-' + alvo]);
  function iniciar(op, grupo, forcar){
    if(!forcar && !temFoto(op.alvo)) return Promise.resolve({erro:'sem a foto da loja'});
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
    const nomeLoja = (TO.lojas.NOMES_LOJA[op.alvo] || [_t(f.a.nome)])[0];
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
    const camada = assar(T, op.alvo);
    let fechado = false, pausado = false, vista = 'perto';

    /* ---- o DOM ---- */
    const raiz = el('div', 'asl2d');
    const cv = document.createElement('canvas'); cv.className = 'asl2d-cv'; raiz.appendChild(cv);
    const g = cv.getContext('2d');
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
    const cam = {x:L.x, z:L.y, esc:30};
    function escalaDaVista(){
      const w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight;
      if(vista === 'alto'){
        /* a loja inteira com a calçada e o carro */
        const lw = T.W + 26, lh = T.D + Q.calc + Q.rua + 4;
        return Math.min(w/lw, h/lh);
      }
      return clamp(Math.min(w, h)/15, 18, 46);
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
      desenhar(dt);
      if(J.fim && !fechado) terminar();
    }

    function desenhar(dt){
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cv.clientWidth, h = cv.clientHeight;
      if(cv.width !== Math.round(w*dpr) || cv.height !== Math.round(h*dpr)){ cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* a câmera vai atrás do líder (ou da loja, na vista de cima) */
      const alvo = vista === 'alto' ? {x:T.W/2 - 3, y:(-T.D + Q.calc + Q.rua)/2} : (L.vivo || L.preso ? L : J.equipe.find(d => d.vivo) || L);
      const k = 1 - Math.exp(-dt*6);
      cam.x += (alvo.x - cam.x)*k; cam.z += (alvo.y - cam.z)*k;
      cam.esc += (escalaDaVista() - cam.esc)*k;
      const S = cam.esc;
      const X = x => (x - cam.x)*S + w/2, Z = z => (z - cam.z)*S + h/2;
      g.fillStyle = '#1e1f22'; g.fillRect(0, 0, w, h);
      g.imageSmoothingEnabled = true;
      g.drawImage(camada, X(T.x0), Z(T.z0), (T.x1 - T.x0)*S, (T.z1 - T.z0)*S);
      /* o carro da fuga */
      const c = T.mapa.pontos.carro;
      g.save(); g.translate(X(c.x), Z(c.z));
      g.fillStyle = '#20252b'; g.fillRect(-2.3*S, -0.95*S, 4.6*S, 1.9*S);
      g.fillStyle = '#5d7488'; g.fillRect(-2.0*S, -0.75*S, 1.0*S, 1.5*S);
      g.fillStyle = '#ffd35a'; g.font = `700 ${Math.max(9, S*0.42)}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(_t('CARRO'), 0.5*S, 0);
      g.restore();
      /* o saque: o que ainda tem, e o anel do progresso */
      for(const s of J.saque){
        if(s.vazio) continue;
        const x = X(s.x), y = Z(s.y), r = Math.max(5, S*0.32);
        g.fillStyle = 'rgba(255,211,90,.25)'; g.beginPath(); g.arc(x, y, r*1.7, 0, Math.PI*2); g.fill();
        g.fillStyle = '#ffd35a'; g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fill();
        g.fillStyle = '#3b2c00'; g.font = `800 ${r*1.2}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('$', x, y + 0.5);
        if(s.prog > 0){ g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r*1.45, -Math.PI/2, -Math.PI/2 + Math.PI*2*clamp(s.prog/s.tempo, 0, 1)); g.stroke(); }
        if(s.precisa > 1){ g.fillStyle = '#fff'; g.font = `700 ${Math.max(9, S*0.3)}px system-ui,sans-serif`; g.fillText('×' + s.precisa, x, y + r*2.2); }
      }
      /* OS OLHARES: as câmeras e quem está acordado */
      const R = MOT.REGUA;
      const cone = (o, alc, abre, rumo, cor) => {
        const pts = leque(J, o, alc, abre, rumo);
        g.fillStyle = cor; g.beginPath(); g.moveTo(X(o.x), Z(o.y));
        for(const [px, pz] of pts) g.lineTo(X(px), Z(pz));
        g.closePath(); g.fill();
      };
      if(!J.camerasDesligadas) for(const cm of J.cameras){
        cone(cm, cm.alcance, cm.abre, cm.rumo, cm.viu > 0.01 ? 'rgba(255,82,82,.20)' : 'rgba(120,170,255,.12)');
        g.fillStyle = '#222'; g.fillRect(X(cm.x) - 4, Z(cm.y) - 4, 8, 8);
        g.fillStyle = cm.viu > 0.01 ? '#ff5252' : '#7fb0ff'; g.fillRect(X(cm.x) - 1.5, Z(cm.y) - 1.5, 3, 3);
      }
      for(const o of J.povo){
        if(o.fora || o.sumiu || o.estado === 'rendido' || o.estado === 'fugindo' || o.estado === 'ligando') continue;
        /* quem passa na calçada e quem compra só ganham cone quando
           desconfiam: o leque de todo mundo cobria a rua inteira */
        if((o.papel === 'passante' || o.papel === 'cliente') && o.estado === 'normal') continue;
        const [alc0, abre] = R.olhar[o.papel] || R.olhar.cliente;
        const alc = o.distraidoAte > J.t ? 1.5 : alc0;
        const cor = o.estado === 'alerta' ? 'rgba(255,82,82,.20)' : o.estado === 'desconfiado' ? 'rgba(255,200,60,.18)'
          : 'rgba(255,255,255,.10)';
        cone(o, alc, abre, o.rumo, cor);
      }
      /* a ação do líder: o anel no alvo */
      const ac = J.acao;
      if(ac && ac.alvo){ g.strokeStyle = '#ffd35a'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.arc(X(ac.alvo.x), Z(ac.alvo.y), S*0.75, 0, Math.PI*2); g.stroke(); g.setLineDash([]); }
      /* AS PESSOAS */
      const boneco = (d, opc) => {
        if(d.sumiu || d.fugiu || d.noCarro) return;
        const x = X(d.x), y = Z(d.y), r = S*0.27;
        g.save(); g.translate(x, y);
        if(d.estado === 'rendido' || (d.preso && !opc.pm)){
          /* no chão: o corpo deitado, as mãos na cabeça */
          g.globalAlpha = 0.85;
          g.fillStyle = d.cor || '#888'; g.beginPath(); g.ellipse(0, 0, r*1.15, r*0.7, 0, 0, Math.PI*2); g.fill();
          g.fillStyle = '#c9a07a'; g.beginPath(); g.arc(r*0.95, 0, r*0.42, 0, Math.PI*2); g.fill();
          if(d.preso && opc.equipe){ g.strokeStyle = '#90caf9'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r*1.4, 0, Math.PI*2); g.stroke(); }
          g.restore(); return;
        }
        const ang = Math.atan2(Math.cos(d.rumo || 0), Math.sin(d.rumo || 0));
        g.rotate(ang);
        if(opc.lider){ g.strokeStyle = '#ffd35a'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, r*1.55, 0, Math.PI*2); g.stroke(); }
        /* os ombros (a camisa), a cabeça e o nariz pra onde olha */
        g.fillStyle = d.cor || '#888'; g.beginPath(); g.ellipse(0, 0, r*0.62, r*1.05, 0, 0, Math.PI*2); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1; g.stroke();
        g.fillStyle = opc.pm ? '#16243f' : (d.cabelo || '#3b2a1e'); g.beginPath(); g.arc(0, 0, r*0.5, 0, Math.PI*2); g.fill();
        g.fillStyle = opc.pm ? '#1e3a8a' : '#c9a07a'; g.beginPath(); g.arc(r*0.22, 0, r*0.3, 0, Math.PI*2); g.fill();
        if(d.jeito === 'celular'){ g.fillStyle = '#7fd7ff'; g.fillRect(r*0.55, -r*0.25, r*0.35, r*0.5); }
        g.restore();
        if(opc.equipe && d.carrega > 0){ g.fillStyle = '#ffd35a'; g.beginPath(); g.arc(x + r, y - r, Math.max(3, r*0.35), 0, Math.PI*2); g.fill(); }
      };
      for(const d of J.povo) boneco(d, {});
      for(const d of J.equipe) boneco(d, {equipe:true, lider:d === L});
      for(const p of J.policiais) if(p.vivo) boneco(Object.assign(p, {cor:'#22408f'}), {pm:true});
      /* o ? e o ! em cima de quem desconfia */
      g.font = `900 ${Math.max(14, S*0.75)}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'bottom';
      for(const mk of J.marcas){
        g.fillStyle = mk.tipo === '!' ? '#ff5252' : '#ffd35a';
        g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 3;
        g.strokeText(mk.tipo, X(mk.d.x), Z(mk.d.y) - S*0.35); g.fillText(mk.tipo, X(mk.d.x), Z(mk.d.y) - S*0.35);
      }
      /* a noite do fechamento escurece a rua */
      if(cfg.noite){ g.fillStyle = 'rgba(10,14,40,.22)'; g.fillRect(0, 0, w, h); }
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

  TO.assalto2d = {tabuleiro, iniciar, get ativo(){ return ativo; }};
})();
