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
  function desenhar(c, J){
    const F = J && J.festa;
    if(!F) return;
    const S = setor(J);
    if(!S) return;
    const agora = performance.now() / 1000;
    const dt = F.ultimo == null ? 0.016 : Math.max(0, Math.min(0.25, agora - F.ultimo));
    F.ultimo = agora;
    F.relogio += dt;
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

  return {iniciar, gol, desenhar, emCena};
})();
