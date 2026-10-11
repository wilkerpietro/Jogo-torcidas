/* =========================================================
   AS FESTAS NA CENA DA ARQUIBANCADA (pedido do dono, 11/10/2026)

   Desenhadas na camada de cima (`djSobre`, ponte.desenharSobre),
   em coordenada de MUNDO, por cima dos bonecos — é o que se vê do
   alto: o papel levantado tapa a cabeça, o bandeirão tapa o setor.

     · MOSAICO ...... cada um dos NOSSOS levanta um papel; a cor do
                      papel sai da posição dele no setor, e o setor
                      inteiro forma o escudo do clube ou as cores da
                      torcida (sorteado por jogo). Sobe da frente
                      (o lado do campo) pro fundo, em onda.
     · BANDEIRÃO .... a bandeira da torcida cobre o setor por cima
                      das cabeças, tremulando em fatias.
     · TRAPOS ....... tiras de tecido nas cores da torcida, do fundo
                      até o alambrado, o jogo inteiro.
     · PAPEL PICADO . chuva de papel na entrada do time e a cada gol
                      nosso; o papel cai, deita e some.
     · MOSAICO 3D ... a bandeira gigante EM PÉ no fundo do setor,
                      desenrolando de cima pra baixo, com a arte da
                      torcida (escudo, nome, sigla).

   A FRENTE DO SETOR é a direção do campo: sai da âncora da faixa do
   escalão (`A.D.faixas[spawn].dir`, que aponta da arquibancada pro
   gramado). Sem âncora, é o rumo do miolo da cena.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.festas = (function(){
  const A = () => TO.diaJogo.arredores;
  const CABECA = 16;        // quanto a cabeça fica acima do pé, na vista de cima

  /* ---------- as imagens: escudo do clube e bandeira da torcida ---------- */
  const imgs = {};
  function imagem(url){
    if(!url) return null;
    if(!imgs[url]){
      const im = new Image();
      im.onload = ()=>{ im._ok = true; };
      im.onerror = ()=>{ im._erro = true; };
      im.src = url;
      imgs[url] = im;
    }
    return imgs[url];
  }
  function escudoDoClube(id){
    const m = (TO.dados.escudos || {}).clubes || {};
    return id && m[id] ? imagem(`img/escudos/clube-${id}.png`) : null;
  }

  /* ---------- o estado da festa, pendurado no J da cena ---------- */
  function iniciar(J, opc){
    if(!J) return null;
    opc = opc || {};
    const lista = (opc.festas || []).filter(Boolean);
    if(!lista.length){ J.festa = null; return null; }
    const o = opc.torcida || {};
    const cores = TO.mundo.coresDaTorcida(o) || {};
    const paleta = [cores.cor || '#c22', cores.cor2 || '#fff', cores.cor3 || cores.cor2 || '#111'];
    const tem = id => lista.includes(id);
    /* o roteiro: mosaico e mosaico 3D juntos na entrada (é assim nas
       fotos do dono — o 3D em pé e o listrado embaixo), o bandeirão
       depois, papel na entrada e a cada gol, trapos o jogo inteiro */
    /* O RELÓGIO É DA FESTA, em tempo real: o `J.t` da cena anda no
       passo da simulação, que trava o dt e para com o jogo pausado —
       a festa da arquibancada não espera a máquina */
    const fimMosaico = tem('mosaico') || tem('mosaico3d') ? 10 : 0;
    const F = {
      relogio:0, ultimo:null, lista, paleta, torcida:o, clubeId:opc.clubeId || o.clubeId,
      nome: String(o.nome || '').toUpperCase(), sigla: TO.mundo.siglaTorcida ? TO.mundo.siglaTorcida(o) : '',
      /* escudo ou só as cores, sorteado pelo jogo (dono: "aleatório") */
      modoMosaico: (opc.semente != null ? Math.abs(opc.semente) % 2 : (Math.random() < .5 ? 0 : 1)) === 0 ? 'escudo' : 'cores',
      janelas:{
        trapos:    tem('trapos')    ? [0, Infinity] : null,
        mosaico:   tem('mosaico')   ? [1, 10] : null,
        mosaico3d: tem('mosaico3d') ? [0.5, 11.5] : null,
        bandeirao: tem('bandeirao') ? [fimMosaico ? fimMosaico + 0.8 : 1, (fimMosaico ? fimMosaico + 0.8 : 1) + 9] : null
      },
      papel: []
    };
    J.festa = F;
    if(tem('papel')) chuva(J, 0.2);
    /* a bandeira da torcida, pro bandeirão (canvas pronto do patrimônio) */
    if(tem('bandeirao') && TO.patrimonio && TO.patrimonio.imagemDaFaixaObj)
      F.bandeira = TO.patrimonio.imagemDaFaixaObj(o, 'bandeira');
    if(tem('mosaico') || tem('mosaico3d')) F.escudo = escudoDoClube(F.clubeId);
    return F;
  }

  /* gol nosso: mais papel (só quando a festa tem papel) */
  function gol(J){
    const F = J && J.festa;
    if(!F || !F.lista.includes('papel')) return;
    chuva(J, 0);
  }
  function chuva(J, atraso){
    const F = J.festa;
    F.chuvas = F.chuvas || [];
    F.chuvas.push((F.relogio || 0) + atraso);
  }

  /* ---------- a geometria do setor ----------
     A ARTE É VIRADA PRO CAMPO (régua do dono, 11/10/2026): o desenho é
     lido por quem está no gramado olhando pra arquibancada. Então cada
     setor tem o seu par de eixos:
       · `f` (o "pra baixo" da imagem) aponta pro campo — a base da
         arte encosta no alambrado e o topo fica na última fileira;
       · `R` (o "pra direita" da imagem) é a direita de quem olha do
         campo: de frente pra `-f`, a direita é (f.y, −f.x).
     `u` mede ao longo de R e `v` ao longo de f, a partir do miolo. */
  function setor(J){
    const nossos = J.discos.filter(d => d.vivo && !d.sumiu && d.nossaTorcida);
    if(!nossos.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, sx = 0, sy = 0;
    const conta = {};
    for(const d of nossos){
      const hy = d.y - CABECA;
      if(d.x < x0) x0 = d.x; if(d.x > x1) x1 = d.x;
      if(hy < y0) y0 = hy; if(hy > y1) y1 = hy;
      sx += d.x; sy += hy;
      conta[d.spawn] = (conta[d.spawn] || 0) + 1;
    }
    const spawn = Object.keys(conta).sort((a,b) => conta[b] - conta[a])[0];
    const D = A() && A().D;
    const fx = D && D.faixas && D.faixas[spawn];
    let f = fx && fx.dir ? fx.dir : null;
    const cx = sx / nossos.length, cy = sy / nossos.length;
    if(!f){
      const W = (A() && A().W) || 1536, H = (A() && A().H) || 1024;
      const dx = W/2 - cx, dy = H/2 - cy, n = Math.hypot(dx, dy) || 1;
      f = [dx/n, dy/n];
    }
    const nf = Math.hypot(f[0], f[1]) || 1;
    f = [f[0]/nf, f[1]/nf];
    const R = [f[1], -f[0]];
    const pad = 9;
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for(const d of nossos){
      const px = d.x - cx, py = d.y - CABECA - cy;
      d._u = px*R[0] + py*R[1]; d._v = px*f[0] + py*f[1];
      if(d._u < u0) u0 = d._u; if(d._u > u1) u1 = d._u;
      if(d._v < v0) v0 = d._v; if(d._v > v1) v1 = d._v;
    }
    return {nossos, x0:x0-pad, y0:y0-pad, x1:x1+pad, y1:y1+pad, cx, cy, f, R,
            u0:u0-pad, u1:u1+pad, v0:v0-pad, v1:v1+pad};
  }
  /* entra no sistema do setor: dali pra frente (u, v) é coordenada */
  function noSetor(c, S){
    c.transform(S.R[0], S.R[1], S.f[0], S.f[1], S.cx, S.cy);
  }
  /* 0 na frente do setor (lado do campo), 1 no fundo */
  const profundidade = (S, v) => S.v1 > S.v0 ? (S.v1 - v) / (S.v1 - S.v0) : 0.5;

  function listras(c, W, H, a, b){
    c.fillStyle = a; c.fillRect(0, 0, W, H);
    c.fillStyle = b;
    const passo = W / 4;
    for(let k = -W; k < W*2; k += passo*2){
      c.beginPath();
      c.moveTo(k, 0); c.lineTo(k + passo, 0); c.lineTo(k + passo - H*0.6, H); c.lineTo(k - H*0.6, H);
      c.closePath(); c.fill();
    }
  }
  /* ---------- as cinco festas ---------- */
  const fase = (t, a, b, sobe, desce) => {
    if(t < a || t > b) return 0;
    const up = sobe ? Math.min(1, (t - a) / sobe) : 1;
    const dn = desce ? Math.min(1, (b - t) / desce) : 1;
    return Math.max(0, Math.min(up, dn));
  };
  const suave = x => x * x * (3 - 2 * x);

  /* A ARTE DO MOSAICO: o desenho inteiro no tamanho do setor, tirado UMA
     vez quando o papel sobe (o setor quase não mexe no jogo assistido).
     Cada papel mostra o SEU pedaço dela — a soma dos papéis é o escudo
     ou as listras, com a fresta entre um e outro que todo mosaico tem. */
  function arteDoMosaico(F, S){
    const w = S.u1 - S.u0, h = S.v1 - S.v0;
    const pronta = F.arteM && Math.abs(F.arteM.ww - w) < w*0.15 && Math.abs(F.arteM.hh - h) < h*0.15 &&
                   !(F.arteM.semEscudo && F.escudo && F.escudo._ok);
    if(pronta) return F.arteM;
    const k = 2;
    const cv = document.createElement('canvas');
    cv.width = Math.max(8, Math.round(w*k)); cv.height = Math.max(8, Math.round(h*k));
    const c = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const [a, b, d] = F.paleta;
    const esc = F.escudo;
    cv.semEscudo = false;
    if(F.modoMosaico === 'escudo' && esc && !esc._erro){
      c.fillStyle = a; c.fillRect(0, 0, W, H);
      /* um aro na segunda cor em volta do escudo, pra ele saltar do fundo */
      const r = Math.min(W, H) * 0.47;
      c.beginPath(); c.arc(W/2, H/2, r, 0, Math.PI*2); c.fillStyle = b; c.fill();
      if(esc._ok){
        const iw = esc.naturalWidth || 1, ih = esc.naturalHeight || 1;
        const s2 = Math.min(r*1.7/iw, r*1.7/ih);
        c.drawImage(esc, W/2 - iw*s2/2, H/2 - ih*s2/2, iw*s2, ih*s2);
      } else cv.semEscudo = true;
    } else {
      const tipo = String(F.nome).length % 3;
      if(tipo === 0) listras(c, W, H, a, b);
      else if(tipo === 1){
        c.fillStyle = a; c.fillRect(0, 0, W, H);
        c.fillStyle = b; c.fillRect(0, H*0.33, W, H*0.34);
        c.fillStyle = d; c.fillRect(0, H*0.45, W, H*0.10);
      } else {
        for(let i = 0; i < 5; i++){ c.fillStyle = i % 2 ? b : a; c.fillRect(0, i*H/5, W, H/5 + 1); }
      }
    }
    cv.ww = w; cv.hh = h; cv.k = k; cv.u0 = S.u0; cv.v0 = S.v0;
    F.arteM = cv;
    return cv;
  }

  function desenharMosaico(c, J, F, S, t){
    const [a, b] = F.janelas.mosaico;
    if(t < a || t > b) return;
    const arte = arteDoMosaico(F, S);
    const k = arte.k;
    const CW = 19, CH = 17;
    c.save(); noSetor(c, S);
    for(const d of S.nossos){
      /* a onda: a frente (o alambrado) levanta primeiro, o fundo por
         último, e abaixa na mesma ordem */
      const atraso = profundidade(S, d._v) * 0.9;
      const p = suave(fase(t, a + atraso, b - 0.9 + atraso, 0.35, 0.35));
      if(p <= 0) continue;
      const ch = CH * p;
      const sx = (d._u - CW/2 - arte.u0) * k, sy = (d._v - CH/2 - arte.v0) * k;
      c.drawImage(arte, Math.max(0, sx), Math.max(0, sy), CW*k, CH*k,
                  d._u - CW/2, d._v - ch/2, CW, ch);
      c.fillStyle = 'rgba(0,0,0,.16)';
      c.fillRect(d._u - CW/2, d._v + ch/2 - 1, CW, 1);
    }
    c.restore();
  }

  function desenharBandeirao(c, J, F, S, t){
    const [a, b] = F.janelas.bandeirao;
    const p = suave(fase(t, a, b, 1.3, 1.1));
    if(p <= 0) return;
    const ban = F.bandeira;
    const u0 = S.u0 - 6, w = S.u1 - S.u0 + 12;
    const vTopo = S.v0 - 6, h = S.v1 - S.v0 + 12, vBase = vTopo + h;
    /* sobe do alambrado pro fundo: a base fica na frente e o pano vai
       se abrindo por cima das cabeças até a última fileira */
    const hh = h * p;
    const N = 26;
    const iw = ban ? (ban.width || 1) : 1, ih = ban ? (ban.height || 1) : 1;
    c.save(); noSetor(c, S);
    c.fillStyle = 'rgba(0,0,0,.28)';
    c.fillRect(u0 + 4, vBase - hh + 6, w, hh);
    for(let i = 0; i < N; i++){
      const s0 = i / N;
      const onda = Math.sin(t * 4.2 + i * 0.55) * 3.2 + Math.sin(t * 2.3 + i * 0.21) * 1.6;
      const su = u0 + s0 * w, sw = w / N + 0.6;
      const sv = vBase - hh + onda;
      if(ban) c.drawImage(ban, s0 * iw, 0, iw / N + 0.5, ih, su, sv, sw, hh);
      else { c.fillStyle = i % 6 < 3 ? F.paleta[0] : F.paleta[1]; c.fillRect(su, sv, sw, hh); }
      /* luz e sombra da dobra */
      const luz = Math.sin(t * 4.2 + i * 0.55 + 1.2);
      c.fillStyle = luz > 0 ? `rgba(255,255,255,${0.12 * luz})` : `rgba(0,0,0,${-0.22 * luz})`;
      c.fillRect(su, sv, sw, hh);
    }
    c.restore();
  }

  function desenharTrapos(c, J, F, S, t){
    /* as tiras correm do fundo (v0) até o alambrado (v1), lado a lado
       ao longo da arquibancada */
    const largura = S.u1 - S.u0, comp = S.v1 - S.v0;
    const n = Math.max(2, Math.floor(largura / 46));
    const passo = largura / n;
    const L = 11, seg = 14;
    const bal = (k, s2) => Math.sin(t * 1.7 + k * 1.3 + s2 * 3) * 3 * Math.sin(s2 * Math.PI);
    c.save(); noSetor(c, S);
    for(let k = 0; k < n; k++){
      const base = S.u0 + passo * (k + 0.5);
      const cor = F.paleta[k % 2], cor2 = F.paleta[(k + 1) % 2];
      c.beginPath();
      for(let i = 0; i <= seg; i++){ const s2 = i/seg; const v = S.v0 + s2*comp, u = base + bal(k, s2) - L/2;
        if(i === 0) c.moveTo(u, v); else c.lineTo(u, v); }
      for(let i = seg; i >= 0; i--){ const s2 = i/seg; c.lineTo(base + bal(k, s2) + L/2, S.v0 + s2*comp); }
      c.closePath();
      c.fillStyle = cor; c.fill();
      c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,.35)'; c.stroke();
      /* o friso de outra cor no meio da tira */
      c.beginPath();
      for(let i = 0; i <= seg; i++){ const s2 = i/seg; const v = S.v0 + s2*comp, u = base + bal(k, s2);
        if(i === 0) c.moveTo(u, v); else c.lineTo(u, v); }
      c.lineWidth = 2.4; c.strokeStyle = cor2; c.stroke();
    }
    c.restore();
  }

  function desenharPapel(c, J, F, S, t, dt){
    /* nasce: cada chuva solta um punhado de papel por cima do setor */
    if(F.chuvas && F.chuvas.length){
      const prontas = F.chuvas.filter(x => x <= t);
      F.chuvas = F.chuvas.filter(x => x > t);
      for(const _ of prontas){
        const n = Math.min(220, 40 + S.nossos.length * 2);
        for(let i = 0; i < n; i++){
          F.papel.push({
            x: S.x0 + Math.random() * (S.x1 - S.x0),
            y: S.y0 + Math.random() * (S.y1 - S.y0),
            z: 40 + Math.random() * 70,
            vz: 14 + Math.random() * 12,
            fase: Math.random() * 6.28,
            cor: Math.random() < 0.18 ? '#ffffff' : F.paleta[Math.random() < 0.5 ? 0 : 1],
            chao: null
          });
        }
      }
    }
    if(!F.papel.length) return;
    const vivos = [];
    for(const q of F.papel){
      if(q.chao == null){
        q.z -= q.vz * dt;
        q.x += Math.sin(t * 3 + q.fase) * 9 * dt;
        if(q.z <= 0){ q.z = 0; q.chao = t; }
      }
      const idade = q.chao != null ? t - q.chao : 0;
      if(idade > 3.5) continue;
      vivos.push(q);
      const alfa = q.chao != null ? Math.max(0, 1 - idade / 3.5) : 1;
      const gira = Math.abs(Math.sin(t * 6 + q.fase));
      c.globalAlpha = alfa;
      c.fillStyle = q.cor;
      c.fillRect(q.x - 1.8, q.y - q.z - 1.2 * gira, 3.6, 2.4 * gira + 0.6);
    }
    c.globalAlpha = 1;
    F.papel = vivos;
  }

  /* o 3D: a bandeira em pé no fundo do setor, desenrolando de cima */
  function arte3D(F, w, h){
    const chave = `${Math.round(w)}x${Math.round(h)}|${F.escudo && F.escudo._ok ? 1 : 0}`;
    if(F.arte && F.arteChave === chave) return F.arte;
    const k = 2;
    const cv = document.createElement('canvas');
    cv.width = Math.max(8, Math.round(w * k)); cv.height = Math.max(8, Math.round(h * k));
    const c = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const [a, b, d] = F.paleta;
    /* o fundo: raios saindo do centro, nas duas cores */
    c.fillStyle = a; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W/2, H*0.45);
    for(let i = 0; i < 16; i++){
      c.rotate(Math.PI / 8);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(W, -W*0.12); c.lineTo(W, W*0.12); c.closePath();
      c.fillStyle = i % 2 ? b : a; c.globalAlpha = 0.55; c.fill();
    }
    c.restore(); c.globalAlpha = 1;
    /* o escudo grande no meio */
    const esc = F.escudo;
    const r = Math.min(W, H) * 0.36;
    if(esc && esc._ok){
      const iw = esc.naturalWidth || 1, ih = esc.naturalHeight || 1;
      const s = Math.min(r*2/iw, r*2/ih);
      c.drawImage(esc, W/2 - iw*s/2, H*0.45 - ih*s/2, iw*s, ih*s);
    } else {
      c.beginPath(); c.arc(W/2, H*0.45, r, 0, Math.PI*2);
      c.fillStyle = b; c.fill(); c.lineWidth = r*0.12; c.strokeStyle = d; c.stroke();
      c.fillStyle = a; c.font = `900 ${Math.round(r*0.7)}px Oswald, Impact, sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(F.sigla || F.nome.slice(0, 3), W/2, H*0.45);
    }
    /* o nome da torcida na faixa de baixo */
    const fh = H * 0.16;
    c.fillStyle = d === a ? b : d; c.fillRect(0, H - fh, W, fh);
    c.fillStyle = a === (d === a ? b : d) ? b : a;
    let px = Math.round(fh * 0.66);
    c.font = `900 ${px}px Oswald, Impact, sans-serif`;
    while(px > 6 && c.measureText(F.nome).width > W * 0.92){ px--; c.font = `900 ${px}px Oswald, Impact, sans-serif`; }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(F.nome, W/2, H - fh/2);
    /* a moldura */
    c.lineWidth = Math.max(2, W * 0.012); c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeRect(0, 0, W, H);
    F.arte = cv; F.arteChave = chave;
    return cv;
  }
  function desenharMosaico3D(c, J, F, S, t){
    const [a, b] = F.janelas.mosaico3d;
    const p = suave(fase(t, a, b, 1.8, 1.4));
    if(p <= 0) return;
    /* EM PÉ NO FUNDO, DE FRENTE PRO CAMPO: o topo da bandeira fica na
       última fileira e ela desce em direção ao alambrado, cobrindo a
       parte de trás do setor (o mosaico de papel continua visível na
       frente, como na foto do dono). Por ser alta, ela sai um tanto
       "pra cima" na tela, com a sombra no chão do setor. */
    const SW = S.u1 - S.u0, SD = S.v1 - S.v0;
    const w = Math.max(80, SW * 0.86);
    const h = Math.max(70, Math.min(SD * 0.62, w * 0.9));
    const u = -w/2 + (S.u0 + S.u1)/2, vTopo = S.v0 - 4;
    const arte = arte3D(F, w, h);
    const hv = h * p;
    c.save(); noSetor(c, S);
    /* a sombra deitada, puxada pro lado do campo */
    c.fillStyle = 'rgba(0,0,0,.32)';
    c.fillRect(u + 8, vTopo + 14, w, hv);
    c.restore();
    c.save();
    c.translate(0, -14 * p);          // a bandeira é alta: sobe na tela
    noSetor(c, S);
    /* desenrola do topo (fundo) pra base (frente) */
    const onda = Math.sin(t * 1.6) * 1.2;
    c.drawImage(arte, 0, 0, arte.width, arte.height * p, u + onda, vTopo, w, hv);
    if(p < 1){
      c.fillStyle = F.paleta[0];
      c.fillRect(u - 2, vTopo + hv - 5, w + 4, 10);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(u - 2, vTopo + hv + 2, w + 4, 3);
    }
    /* as cordas que seguram lá no alto, atrás da última fileira */
    c.strokeStyle = 'rgba(30,30,30,.85)'; c.lineWidth = 1.4;
    c.beginPath();
    for(const uu of [u + 6, u + w/2, u + w - 6]){ c.moveTo(uu, vTopo); c.lineTo(uu, vTopo - 26); }
    c.stroke();
    c.restore();
  }

  /* chamado pela ponte, com a matriz de mundo já posta */
  /* o relógio da festa, em tempo real (um só, seja 2D ou 3D quem desenha) */
  function avancar(F){
    const agora = performance.now() / 1000;
    const dt = F.ultimo == null ? 0.016 : Math.max(0, Math.min(0.25, agora - F.ultimo));
    F.ultimo = agora;
    F.relogio += dt;
    return dt;
  }
  function desenhar(c, J){
    const F = J && J.festa;
    if(!F) return;
    /* com os bonecos em Three.js, a festa é 3D (atualizar3d): o 2D só
       entra quando a placa não está desenhando */
    if(F.visto3d && performance.now() - F.visto3d < 600) return;
    const S = setor(J);
    if(!S) return;
    const dt = avancar(F);
    const t = F.relogio;
    const W = F.janelas;
    /* a ordem é a de altura: tecido no setor, papel na mão, bandeirão por
       cima das mãos, a bandeira em pé no fundo, e o papel no ar */
    /* os trapos saem de cena enquanto o mosaico e o bandeirão estão no ar
       (é a mesma gente segurando) e voltam depois */
    if(W.trapos){
      const ocupa = ['mosaico','bandeirao'].some(id => W[id] && t >= W[id][0] - 0.4 && t <= W[id][1] + 0.4);
      F.alfaTrapos = Math.max(0, Math.min(1, (F.alfaTrapos == null ? 1 : F.alfaTrapos) + (ocupa ? -2 : 1) * 0.05));
      if(F.alfaTrapos > 0.02){
        c.save(); c.globalAlpha = F.alfaTrapos;
        desenharTrapos(c, J, F, S, t);
        c.restore();
      }
    }
    if(W.mosaico) desenharMosaico(c, J, F, S, t);
    if(W.bandeirao) desenharBandeirao(c, J, F, S, t);
    if(W.mosaico3d) desenharMosaico3D(c, J, F, S, t);
    if(F.lista.includes('papel')) desenharPapel(c, J, F, S, t, dt);
  }

  /* pra quem testa: o que está no ar agora */
  function emCena(J){
    const F = J && J.festa;
    if(!F) return [];
    const t = F.relogio;
    const fora = [];
    for(const [id, jan] of Object.entries(F.janelas)) if(jan && t >= jan[0] && t <= jan[1]) fora.push(id);
    if(F.papel.length || (F.chuvas || []).length) fora.push('papel');
    return fora;
  }


  /* =======================================================
     A FESTA EM THREE.JS (pedido do dono, 11/10/2026: "refaça os
     desenhos das festas pra ficar mais bonito em threejs")

     Na MESMA cena dos bonecos (bonecos3.atualizarCena chama aqui
     a cada quadro), com a mesma luz e a mesma câmera de cima com
     cisalhamento — então altura é altura de verdade: o papel fica
     na mão erguida, o bandeirão ondula por cima das cabeças com
     luz e sombra nas dobras, os trapos descem do alto do fundo até
     o alambrado, o confete cai girando e o mosaico 3D fica de pé,
     inclinado no degrau, de frente pro campo.

     Coordenadas: x = x do disco, z = y do disco, y = altura.
     Os eixos do setor (R, f) são os mesmos do 2D (`setor`).
     ======================================================= */
  const ALT_MAO = 44;             // a mão erguida de um boneco em pé
  const g3 = {cena:null, F:null, raiz:null, partes:{}};

  function limpar3d(){
    if(g3.raiz && g3.cena) g3.cena.remove(g3.raiz);
    if(g3.raiz) g3.raiz.traverse(o=>{
      if(o.geometry) o.geometry.dispose();
      if(o.material){
        if(o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    g3.raiz = null; g3.F = null; g3.partes = {};
  }
  function textura(canvas){
    const tx = new THREE.CanvasTexture(canvas);
    if(THREE.SRGBColorSpace) tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    return tx;
  }
  const lambert = (opc) => new THREE.MeshLambertMaterial(Object.assign({side:THREE.DoubleSide}, opc));
  /* um ponto do setor no mundo: (u, v) nos eixos do setor, h de altura */
  /* o eixo do setor nasce nas CABEÇAS (S.cy = y − CABECA, pro 2D); no 3D
     a altura é de verdade, então o ponto volta pro chão (+CABECA) */
  const ponto = (S, u, v, h) => [S.cx + u*S.R[0] + v*S.f[0], h, S.cy + CABECA + u*S.R[1] + v*S.f[1]];
  /* geometria de quads em lote (posição e UV reescritas a cada quadro) */
  function lote(nQuads){
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nQuads*4*3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(nQuads*4*2), 2));
    const idx = new (nQuads*4 > 65535 ? Uint32Array : Uint16Array)(nQuads*6);
    for(let i = 0; i < nQuads; i++){
      const a = i*4;
      idx.set([a, a+1, a+2, a, a+2, a+3], i*6);
    }
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  }
  /* uma malha em grade (nu × nv células) com posição e UV livres */
  function grade(nu, nv){
    const g = new THREE.BufferGeometry();
    const n = (nu+1)*(nv+1);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n*3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n*2), 2));
    const idx = [];
    for(let j = 0; j < nv; j++) for(let i = 0; i < nu; i++){
      const a = j*(nu+1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    g.setIndex(idx);
    g.nu = nu; g.nv = nv;
    return g;
  }

  /* ---------- o mosaico: um papel na mão de cada um ---------- */
  function mosaico3(F, S, t){
    const P = g3.partes;
    const jan = F.janelas.mosaico;
    if(!jan) return;
    const [a, b] = jan;
    const arte = arteDoMosaico(F, S);
    if(!P.mosaico){
      const N = 400;
      const geo = lote(N);
      const tx = textura(arte);
      const mesh = new THREE.Mesh(geo, lambert({map:tx}));
      mesh.frustumCulled = false;
      g3.raiz.add(mesh);
      P.mosaico = {mesh, geo, tx, N, arte};
    }
    const M = P.mosaico;
    if(M.arte !== arte){ M.tx.dispose(); M.tx = textura(arte); M.mesh.material.map = M.tx; M.mesh.material.needsUpdate = true; M.arte = arte; }
    const pos = M.geo.attributes.position.array, uv = M.geo.attributes.uv.array;
    const W = S.u1 - S.u0, H = S.v1 - S.v0;
    const CW = 17.5, CH = 15.5, INCL = 0.35;     // o papel inclinado pro campo
    let n = 0;
    for(const d of S.nossos){
      if(n >= M.N) break;
      const atraso = profundidade(S, d._v) * 0.9;
      const p = suave(fase(t, a + atraso, b - 0.9 + atraso, 0.35, 0.35));
      d.festaPose = p > 0.05 ? 'mosaico' : (d.festaPose === 'mosaico' ? null : d.festaPose);
      if(p <= 0) continue;
      /* o papel sobe com a mão: de 26 (no peito) até a mão erguida */
      const h = 26 + (ALT_MAO - 26) * p;
      const hw = CW/2, hh = CH/2 * p;
      const du = d._u, dv = d._v;
      const cs = [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]];
      for(let k = 0; k < 4; k++){
        const [ou, ov] = cs[k];
        /* a borda da frente (v+) mais baixa: o papel olha pro campo e pro alto */
        const q = ponto(S, du + ou, dv + ov, h - ov * INCL);
        pos.set(q, (n*4 + k)*3);
        const uu = (du + ou - S.u0) / W, vv = (dv + ov - S.v0) / H;
        uv[(n*4 + k)*2] = uu; uv[(n*4 + k)*2 + 1] = 1 - vv;
      }
      n++;
    }
    M.geo.setDrawRange(0, n*6);
    M.geo.attributes.position.needsUpdate = true; M.geo.attributes.uv.needsUpdate = true;
    M.geo.computeVertexNormals();
    M.mesh.visible = n > 0;
  }

  /* ---------- o bandeirão: o pano sobre a MANCHA da torcida ----------
     (correção do dono, 11/10/2026: "mais fluido e com menos aspecto de
     tão quadrado, pegando apenas a área ocupada pelos membros")
     A malha cobre a caixa do setor, mas cada vértice sabe o quanto está
     DENTRO da mancha (distância até a cabeça mais perto): dentro, o pano
     fica na altura das mãos, com um calombo em cima de cada um que
     segura (sobe e desce no ritmo dele) e barriga entre um e outro;
     na borda ele cai mole; fora, o triângulo nem é desenhado. A borda
     recortada pela mancha é o que tira o aspecto de lençol quadrado. */
  const BAN_NU = 64, BAN_NV = 44, BAN_MARGEM = 14;
  function campoDoBandeirao(B, S){
    /* a mancha muda pouco no jogo assistido: refaz a cada ~1 s */
    const agora = performance.now();
    if(B.campo && agora - B.campoEm < 1000) return B.campo;
    const nu = BAN_NU, nv = BAN_NV;
    const u0 = S.u0 - BAN_MARGEM, w = S.u1 - S.u0 + 2*BAN_MARGEM;
    const v0 = S.v0 - BAN_MARGEM, h = S.v1 - S.v0 + 2*BAN_MARGEM;
    const n = (nu+1)*(nv+1);
    const dist = new Float32Array(n), quem = new Int16Array(n);
    const pts = S.nossos.map(d => [d._u, d._v]);
    for(let j = 0; j <= nv; j++) for(let i = 0; i <= nu; i++){
      const u = u0 + w*i/nu, v = v0 + h*j/nv;
      let m1 = 1e9, q = -1;
      for(let k = 0; k < pts.length; k++){
        const du = pts[k][0] - u, dv = pts[k][1] - v, dd = du*du + dv*dv;
        if(dd < m1){ m1 = dd; q = k; }
      }
      const id = j*(nu+1) + i;
      dist[id] = Math.sqrt(m1); quem[id] = q;
    }
    B.campo = {u0, w, v0, h, dist, quem};
    B.campoEm = agora;
    return B.campo;
  }
  function bandeirao3(F, S, t){
    const P = g3.partes;
    const jan = F.janelas.bandeirao;
    if(!jan) return;
    const p = suave(fase(t, jan[0], jan[1], 1.8, 1.4));
    for(const d of S.nossos)
      if(p > 0.02) d.festaPose = d.festaPose || 'bandeirao';
      else if(d.festaPose === 'bandeirao') d.festaPose = null;
    if(!P.ban){
      const geo = grade(BAN_NU, BAN_NV);
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count*3).fill(1), 3));
      const src = F.bandeira;
      let mat;
      if(src && src.width){ const tx = textura(src); mat = lambert({map:tx, vertexColors:true}); P.banTx = tx; }
      else mat = lambert({color:F.paleta[0], vertexColors:true});
      const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
      /* a sombra: a mesma malha achatada no chão, preta e rala */
      const sombra = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.22, depthWrite:false, side:THREE.DoubleSide}));
      sombra.frustumCulled = false;
      sombra.scale.set(1, 0.001, 1);
      sombra.position.set(6, 1, 9);
      g3.raiz.add(sombra); g3.raiz.add(mesh);
      P.ban = {mesh, geo, sombra, idxEm:-1};
    }
    const B = P.ban;
    B.mesh.visible = B.sombra.visible = p > 0;
    if(p <= 0) return;
    const C = campoDoBandeirao(B, S);
    const nu = BAN_NU, nv = BAN_NV;
    const pos = B.geo.attributes.position.array, uv = B.geo.attributes.uv.array;
    const cor = B.geo.attributes.color.array;
    const alt = ALT_MAO - 2;
    /* abre do alambrado (v grande) pro fundo: a frente da abertura corre */
    const vAbre = C.v0 + C.h * (1 - p);
    const dentro = new Float32Array((nu+1)*(nv+1));
    const altura = new Float32Array((nu+1)*(nv+1));
    for(let j = 0; j <= nv; j++){
      const r = j / nv, v = C.v0 + C.h * r;
      for(let i = 0; i <= nu; i++){
        const s2 = i / nu, u = C.u0 + C.w * s2;
        const id = j*(nu+1) + i;
        const dmin = C.dist[id];
        /* 1 no meio da mancha, 0 a ~2 passos fora dela */
        let k = Math.max(0, Math.min(1, (24 - dmin) / 14));
        /* a parte ainda não aberta fica embolada na frente */
        const aberto = Math.max(0, Math.min(1, (v - vAbre) / 18 + 1));
        k *= aberto;
        dentro[id] = k;
        /* o calombo da mão de quem segura (cada um no seu ritmo) e a
           barriga entre dois, mais a onda que atravessa o pano */
        const fa = (C.quem[id] * 2.399) % 6.283;
        const mao = Math.exp(-dmin*dmin / 60) * (5 + 2.5*Math.sin(t*3.1 + fa));
        const barriga = -0.45 * Math.min(dmin, 9);
        const onda = 4.2*Math.sin(t*2.2 - v*0.045 + u*0.02) + 1.6*Math.sin(t*3.6 + u*0.06 - v*0.03);
        /* a borda cai mole: perto de sair da mancha o pano despenca */
        const cai = (1 - k) * 22;
        const hh = alt + mao + barriga + onda * (0.5 + 0.5*k) - cai;
        altura[id] = hh;
        const q = ponto(S, u, v, hh);
        pos.set(q, id*3);
        uv[id*2] = (u - S.u0 + 6) / (S.u1 - S.u0 + 12);
        uv[id*2+1] = 1 - (v - S.v0 + 6) / (S.v1 - S.v0 + 12);
      }
    }
    /* a luz da dobra, pela encosta (diferença de altura) */
    for(let j = 0; j <= nv; j++) for(let i = 0; i <= nu; i++){
      const id = j*(nu+1) + i;
      const a = altura[j*(nu+1) + Math.max(0, i-1)], b = altura[j*(nu+1) + Math.min(nu, i+1)];
      const c2 = altura[Math.max(0, j-1)*(nu+1) + i], d2 = altura[Math.min(nv, j+1)*(nu+1) + i];
      const enc = (b - a) * 0.09 + (d2 - c2) * 0.07;
      const luz = Math.max(0.45, Math.min(1.18, 0.9 + enc));
      cor[id*3] = cor[id*3+1] = cor[id*3+2] = luz;
    }
    /* só os triângulos de dentro da mancha */
    const idx = [];
    for(let j = 0; j < nv; j++) for(let i = 0; i < nu; i++){
      const a = j*(nu+1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      if(dentro[a] > 0.02 && dentro[c] > 0.02 && dentro[b] > 0.02) idx.push(a, c, b);
      if(dentro[b] > 0.02 && dentro[c] > 0.02 && dentro[d] > 0.02) idx.push(b, c, d);
    }
    B.geo.setIndex(idx);
    B.geo.attributes.position.needsUpdate = true; B.geo.attributes.uv.needsUpdate = true;
    B.geo.attributes.color.needsUpdate = true;
    B.geo.computeVertexNormals();
  }

  /* ---------- os trapos: só dentro das bordas da arquibancada ----------
     (correção do dono, 11/10/2026: "os trapos precisam se alinhar pra
     encaixar somente dentro das bordas da arquibancada")
     Cada tira corre pela linha dela (u fixo, na direção do campo) e é
     recortada pela própria arquibancada: o trecho pisável da máscara
     da cena que contém a torcida — do muro do fundo ao alambrado.
     A tira fica deitada por cima das cabeças, e a checagem é feita no
     ponto onde ela APARECE (a altura sobe na tela pela câmera), pra
     nada sair visualmente da borda. */
  const TRAPO_ALT = 39, CISALHA_VISTA = 0.42;
  function vaoDaTira(S, u){
    const A2 = A();
    if(!A2 || !A2.caminhavel) return [S.v0, S.v1];
    const passoV = 3, sobe = TRAPO_ALT * CISALHA_VISTA;
    const pisa = v => {
      const q = ponto(S, u, v, 0);
      return A2.caminhavel(q[0], q[2] - sobe);
    };
    /* o meio da torcida nessa linha: começa do miolo do setor */
    let meio = (S.v0 + S.v1) / 2;
    if(!pisa(meio)){
      let achou = false;
      for(let dv = passoV; dv < (S.v1 - S.v0); dv += passoV){
        if(pisa(meio + dv)){ meio += dv; achou = true; break; }
        if(pisa(meio - dv)){ meio -= dv; achou = true; break; }
      }
      if(!achou) return null;
    }
    let a = meio, b = meio;
    const LIM = 400;
    while(a - meio > -LIM && pisa(a - passoV)) a -= passoV;
    while(b - meio < LIM && pisa(b + passoV)) b += passoV;
    return [a + 2, b - 2];
  }
  function trapos3(F, S, t){
    const P = g3.partes;
    if(!F.janelas.trapos) return;
    const W = F.janelas;
    const ocupa = ['mosaico','bandeirao'].some(id => W[id] && t >= W[id][0] - 0.4 && t <= W[id][1] + 0.4);
    F.recolhe = Math.max(0, Math.min(1, (F.recolhe || 0) + (ocupa ? 0.04 : -0.04)));
    const largura = S.u1 - S.u0;
    const L = 16;
    const n = Math.max(2, Math.floor(largura / 34));
    if(!P.trapos || P.trapos.n !== n){
      if(P.trapos) for(const r of P.trapos.fitas){ g3.raiz.remove(r.mesh); r.mesh.geometry.dispose(); r.mesh.material.dispose(); }
      const fitas = [];
      for(let k = 0; k < n; k++){
        const cv = document.createElement('canvas'); cv.width = 8; cv.height = 4;
        const c = cv.getContext('2d');
        const cor = F.paleta[k % 2], cor2 = F.paleta[(k + 1) % 2];
        c.fillStyle = cor; c.fillRect(0, 0, 8, 4);
        c.fillStyle = cor2; c.fillRect(1, 0, 1, 4); c.fillRect(6, 0, 1, 4);
        const tx = textura(cv); tx.magFilter = THREE.NearestFilter;
        const geo = grade(1, 28);
        const mesh = new THREE.Mesh(geo, lambert({map:tx}));
        mesh.frustumCulled = false;
        g3.raiz.add(mesh);
        fitas.push({mesh, geo, vao:null, vaoEm:0});
      }
      P.trapos = {n, fitas};
    }
    /* as tiras ficam dentro da largura ocupada, com folga nas pontas */
    const passo = (largura - L) / Math.max(1, n - 1);
    const agora = performance.now();
    P.trapos.fitas.forEach((r, k) => {
      const base = S.u0 + L/2 + passo * k;
      if(!r.vao || agora - r.vaoEm > 1500){ r.vao = vaoDaTira(S, base); r.vaoEm = agora; }
      r.mesh.visible = !!r.vao && F.recolhe < 0.98;
      if(!r.mesh.visible) return;
      const [va, vb] = r.vao;
      /* recolhida, a tira enrola pro fundo */
      const vFim = va + (vb - va) * (1 - 0.9 * F.recolhe);
      const pos = r.geo.attributes.position.array, uv = r.geo.attributes.uv.array;
      const nv = r.geo.nv;
      for(let j = 0; j <= nv; j++){
        const s2 = j / nv;
        const vv = va + (vFim - va) * s2;
        /* deitada sobre as cabeças, ondulando com quem está embaixo */
        const h = TRAPO_ALT + 2.2*Math.sin(t*2.3 + k*1.1 + vv*0.09) + 1.2*Math.sin(t*3.4 - vv*0.05);
        const lado = 1.6 * Math.sin(t*1.2 + k*1.7 + s2*4);
        for(let i = 0; i <= 1; i++){
          const q = ponto(S, base + lado + (i ? L/2 : -L/2), vv, h);
          const kk = j*2 + i;
          pos.set(q, kk*3);
          uv[kk*2] = i; uv[kk*2+1] = 1 - s2;
        }
      }
      r.geo.attributes.position.needsUpdate = true; r.geo.attributes.uv.needsUpdate = true;
      r.geo.computeVertexNormals();
    });
  }

  /* ---------- o papel picado: confete girando ---------- */
  function papel3(F, S, t, dt){
    const P = g3.partes;
    if(!F.lista.includes('papel')) return;
    const MAX = 600;
    if(!P.papel){
      const geo = new THREE.PlaneGeometry(3.4, 2.2);
      const mesh = new THREE.InstancedMesh(geo, lambert({color:0xffffff}), MAX);
      mesh.frustumCulled = false;
      mesh.count = 0;
      g3.raiz.add(mesh);
      P.papel = {mesh, obj:new THREE.Object3D(), cor:new THREE.Color()};
    }
    /* nasce: cada chuva solta confete por cima do setor */
    if(F.chuvas && F.chuvas.length){
      const prontas = F.chuvas.filter(x => x <= t);
      F.chuvas = F.chuvas.filter(x => x > t);
      for(const _ of prontas){
        const n = Math.min(320, 80 + S.nossos.length * 2);
        for(let i = 0; i < n && F.papel.length < MAX; i++){
          const u = S.u0 + Math.random() * (S.u1 - S.u0), v = S.v0 + Math.random() * (S.v1 - S.v0);
          const q = ponto(S, u, v, 0);
          F.papel.push({x:q[0], z:q[2], h:ALT_MAO + 20 + Math.random()*70, vh:16 + Math.random()*12,
                        rx:Math.random()*6, ry:Math.random()*6, wx:3 + Math.random()*6, wy:2 + Math.random()*5,
                        fase:Math.random()*6.28, chao:null,
                        cor: Math.random() < 0.2 ? '#ffffff' : F.paleta[Math.random() < 0.5 ? 0 : 1]});
        }
      }
    }
    const M = P.papel, o = M.obj;
    const vivos = [];
    let n = 0;
    for(const q of F.papel){
      if(q.chao == null){
        q.h -= q.vh * dt;
        q.x += Math.sin(t*2.6 + q.fase) * 10 * dt;
        q.z += Math.cos(t*2.1 + q.fase) * 6 * dt;
        q.rx += q.wx * dt; q.ry += q.wy * dt;
        /* para nas cabeças (34) ou no chão, conforme cai */
        const piso = (q.fase % 1 < 0.6) ? 34 : 1;
        if(q.h <= piso){ q.h = piso; q.chao = t; q.rx = Math.PI/2; }
      }
      if(q.chao != null && t - q.chao > 3) continue;
      vivos.push(q);
      o.position.set(q.x, q.h, q.z);
      o.rotation.set(q.rx, q.ry, 0);
      const enc = q.chao != null ? Math.max(0.01, 1 - (t - q.chao)/3) : 1;
      o.scale.setScalar(enc);
      o.updateMatrix();
      M.mesh.setMatrixAt(n, o.matrix);
      M.mesh.setColorAt(n, M.cor.set(q.cor));
      n++;
    }
    F.papel = vivos;
    M.mesh.count = n;
    M.mesh.instanceMatrix.needsUpdate = true;
    if(M.mesh.instanceColor) M.mesh.instanceColor.needsUpdate = true;
  }

  /* ---------- o mosaico 3D: a bandeira gigante de pé, de frente pro campo ---------- */
  function mosaico3d3(F, S, t){
    const P = g3.partes;
    const jan = F.janelas.mosaico3d;
    if(!jan) return;
    const p = suave(fase(t, jan[0], jan[1], 1.8, 1.4));
    const SW = S.u1 - S.u0, SD = S.v1 - S.v0;
    const w = Math.max(90, SW * 0.9);
    const h = Math.max(80, Math.min(SD * 0.9, w * 0.85, 190));
    if(!P.m3d){
      const arte = arte3D(F, w, h);
      const tx = textura(arte);
      const geo = grade(24, 16);
      const mesh = new THREE.Mesh(geo, lambert({map:tx}));
      mesh.frustumCulled = false;
      /* os dois mastros e a travessa que seguram no alto */
      const mm = new THREE.MeshLambertMaterial({color:0x2a2a2a});
      const mastros = [0, 1].map(() => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1, 6), mm);
        c.frustumCulled = false; g3.raiz.add(c); return c;
      });
      const rolo = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 10), lambert({color:F.paleta[0]}));
      rolo.frustumCulled = false;
      g3.raiz.add(mesh); g3.raiz.add(rolo);
      P.m3d = {mesh, geo, tx, mastros, rolo, w, h};
    }
    const M = P.m3d;
    /* o escudo chega depois: a arte é refeita e a textura troca */
    const arteAgora = arte3D(F, M.w, M.h);
    if(M.mesh.material.map.image !== arteAgora){
      M.tx.dispose(); M.tx = textura(arteAgora);
      M.mesh.material.map = M.tx; M.mesh.material.needsUpdate = true;
    }
    const vivo = p > 0;
    M.mesh.visible = M.rolo.visible = vivo; M.mastros.forEach(m => m.visible = vivo);
    if(!vivo) return;
    /* EM PÉ, INCLINADA NO DEGRAU: a barra de baixo no meio do setor, a
       de cima mais alta e mais pro fundo (a arquibancada sobe pra trás).
       De frente pro campo: a base olha o gramado e o topo, a última
       fileira — como no 2D, legível de quem está no campo. */
    const INC = 1.05;                         // ~60° do chão
    const uC = (S.u0 + S.u1) / 2;
    const vBaixo = S.v0 + SD * 0.42, hBaixo = ALT_MAO + 6;
    const topoV = vBaixo - M.h * Math.cos(INC), topoH = hBaixo + M.h * Math.sin(INC);
    /* desenrola de cima: o topo preso nos mastros, o rolo descendo */
    const pos = M.geo.attributes.position.array, uv = M.geo.attributes.uv.array;
    const nu = M.geo.nu, nv = M.geo.nv;
    for(let j = 0; j <= nv; j++){
      const r = (j / nv) * p;                 // 0 no topo, p na barra que desce
      for(let i = 0; i <= nu; i++){
        const s2 = i / nu;
        const u = uC - M.w/2 + s2 * M.w;
        const v = topoV + (vBaixo - topoV) * r;
        const hh = topoH + (hBaixo - topoH) * r;
        /* o vento empurra o pano pra frente e pra trás, de leve */
        const vento = 2.2 * Math.sin(t*1.5 + s2*5 + r*3) * Math.sin(Math.PI*r);
        const q = ponto(S, u, v + vento, hh);
        const k = j*(nu+1) + i;
        pos.set(q, k*3);
        uv[k*2] = s2; uv[k*2+1] = 1 - r;
      }
    }
    M.geo.attributes.position.needsUpdate = true; M.geo.attributes.uv.needsUpdate = true;
    M.geo.computeVertexNormals();
    /* o rolo na barra de baixo enquanto desenrola */
    const rb = ponto(S, uC, topoV + (vBaixo - topoV) * p, topoH + (hBaixo - topoH) * p);
    M.rolo.visible = p < 0.995;
    M.rolo.position.set(rb[0], rb[1], rb[2]);
    M.rolo.scale.set(1, M.w + 6, 1);
    M.rolo.rotation.set(0, 0, 0);
    /* o cilindro nasce em pé (eixo y): deita ao longo de R */
    M.rolo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(S.R[0], 0, S.R[1]));
    /* os mastros: do chão do fundo até acima do topo */
    [-1, 1].forEach((lado, k) => {
      const mp = ponto(S, uC + lado * (M.w/2 + 2), topoV, 0);
      const alto = topoH + 10;
      M.mastros[k].position.set(mp[0], alto/2, mp[2]);
      M.mastros[k].scale.set(1, alto, 1);
    });
  }

  function atualizar3d(scene, J, dt){
    const F = J && J.festa;
    if(!F || typeof THREE === 'undefined'){
      if(g3.raiz) limpar3d();
      if(J) for(const d of J.discos) if(d.festaPose) d.festaPose = null;
      return;
    }
    if(g3.F !== F || g3.cena !== scene){
      limpar3d();
      g3.cena = scene; g3.F = F;
      g3.raiz = new THREE.Group();
      scene.add(g3.raiz);
    }
    const S = setor(J);
    if(!S){ g3.raiz.visible = false; return; }
    g3.raiz.visible = true;
    F.visto3d = performance.now();
    const passo = avancar(F);
    const t = F.relogio;
    trapos3(F, S, t);
    mosaico3(F, S, t);
    bandeirao3(F, S, t);
    mosaico3d3(F, S, t);
    papel3(F, S, t, passo);
  }

  return {iniciar, gol, desenhar, emCena, atualizar3d};
})();
