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
        /* O 3D VEM COM O PAPEL NA MÃO E A CHUVA (dono, 11/10/2026: "no
           mosaico 3D os membros sempre vão ter mosaico de papel na mão,
           com papel picado durante a festa também"). É só a cena: o
           bônus no placar continua sendo o do que foi comprado. */
        mosaico:   tem('mosaico') || tem('mosaico3d') ? [1, 10] : null,
        mosaico3d: tem('mosaico3d') ? [0.5, 11.5] : null,
        bandeirao: tem('bandeirao') ? [fimMosaico ? fimMosaico + 0.8 : 1, (fimMosaico ? fimMosaico + 0.8 : 1) + 9] : null
      },
      papel: []
    };
    J.festa = F;
    F.temPapel = tem('papel') || tem('mosaico3d');
    if(F.temPapel) chuva(J, 0.2);
    /* no 3D, uma segunda chuva quando a arte termina de subir */
    if(tem('mosaico3d')) chuva(J, 4.2);
    /* a bandeira da torcida, pro bandeirão (canvas pronto do patrimônio) */
    if(tem('bandeirao') && TO.patrimonio && TO.patrimonio.imagemDaFaixaObj)
      F.bandeira = TO.patrimonio.imagemDaFaixaObj(o, 'bandeira');
    if(tem('mosaico') || tem('mosaico3d')) F.escudo = escudoDoClube(F.clubeId);
    return F;
  }

  /* gol nosso: mais papel (só quando a festa tem papel) */
  function gol(J){
    const F = J && J.festa;
    if(!F || !F.temPapel) return;
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

  /* listras diagonais revezando as cores da lista (torcida tricolor
     tem as três: a fonte, de duas, repete a segunda e vira bicolor) */
  function listras(c, W, H, cores){
    c.fillStyle = cores[0]; c.fillRect(0, 0, W, H);
    const passo = W / 4;
    let i = 0;
    for(let k = -W; k < W*2; k += passo, i++){
      c.fillStyle = cores[i % cores.length];
      c.beginPath();
      c.moveTo(k, 0); c.lineTo(k + passo + 1, 0); c.lineTo(k + passo + 1 - H*0.6, H); c.lineTo(k - H*0.6, H);
      c.closePath(); c.fill();
    }
  }
  /* uma cor da torcida ao acaso (papel picado): as três, se tiver */
  const umaCor = F => { const p = coresDistintas(F.paleta); return p[Math.floor(Math.random() * p.length)]; };
  /* as cores DISTINTAS da paleta, na ordem (a terceira some se repete) */
  const coresDistintas = p => p.filter((x, i) => p.findIndex(y => String(y).toLowerCase() === String(x).toLowerCase()) === i);
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
      /* tricolor: a terceira cor faz um anel por fora do aro */
      if(coresDistintas([a, b, d]).length >= 3){
        c.beginPath(); c.arc(W/2, H/2, r*1.12, 0, Math.PI*2); c.fillStyle = d; c.fill();
      }
      c.beginPath(); c.arc(W/2, H/2, r, 0, Math.PI*2); c.fillStyle = b; c.fill();
      if(esc._ok){
        const iw = esc.naturalWidth || 1, ih = esc.naturalHeight || 1;
        const s2 = Math.min(r*1.7/iw, r*1.7/ih);
        c.drawImage(esc, W/2 - iw*s2/2, H/2 - ih*s2/2, iw*s2, ih*s2);
      } else cv.semEscudo = true;
    } else {
      /* TODAS as cores da torcida no desenho (dono, 11/10/2026: o do
         Fortaleza saía só azul e branco). Tricolor reveza as três */
      const tipo = String(F.nome).length % 3;
      const todas = coresDistintas([a, b, d]);
      if(tipo === 0) listras(c, W, H, todas);
      else if(tipo === 1){
        c.fillStyle = a; c.fillRect(0, 0, W, H);
        c.fillStyle = b; c.fillRect(0, H*0.33, W, H*0.34);
        c.fillStyle = d; c.fillRect(0, H*0.45, W, H*0.10);
      } else {
        /* cinco faixas: a b d b a (bicolor fica a b a b a) */
        const seq = todas.length >= 3 ? [a, b, d, b, a] : [a, b, a, b, a];
        for(let i = 0; i < 5; i++){ c.fillStyle = seq[i]; c.fillRect(0, i*H/5, W, H/5 + 1); }
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
      else { c.fillStyle = coresDistintas(F.paleta)[Math.floor(i / 3) % coresDistintas(F.paleta).length]; c.fillRect(su, sv, sw, hh); }
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
      const tres = paletaDeTres(F);
      const cor = tres[k % 3], cor2 = tres[(k + 1) % 3];
      c.beginPath();
      for(let i = 0; i <= seg; i++){ const s2 = i/seg; const v = S.v0 + s2*comp, u = base + bal(k, s2) - L/2;
        if(i === 0) c.moveTo(u, v); else c.lineTo(u, v); }
      for(let i = seg; i >= 0; i--){ const s2 = i/seg; c.lineTo(base + bal(k, s2) + L/2, S.v0 + s2*comp); }
      c.closePath();
      c.fillStyle = cor; c.fill();
      c.lineWidth = 2; c.strokeStyle = tres[(k + 2) % 3]; c.stroke();
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
            cor: Math.random() < 0.18 ? '#ffffff' : umaCor(F),
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
    /* o fundo: raios saindo do centro, revezando as cores da torcida */
    c.fillStyle = a; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W/2, H*0.45);
    for(let i = 0; i < 16; i++){
      c.rotate(Math.PI / 8);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(W, -W*0.12); c.lineTo(W, W*0.12); c.closePath();
      const raio = coresDistintas([a, b, d]);
      c.fillStyle = raio[i % raio.length]; c.globalAlpha = 0.55; c.fill();
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
    /* `fixo`: pra quem testa, o relógio parado num instante */
    if(F.fixo != null){ F.relogio = F.fixo; return 0.016; }
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
    if(F.temPapel) desenharPapel(c, J, F, S, t, dt);
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

  /* ---------- o bandeirão: o pano sobre a torcida, na curva do anel ----------
     Na altura das mãos, com um calombo em cima de cada um que segura
     (sobe e desce no ritmo dele), barriga entre um e outro e a onda que
     atravessa; a forma é a do anel de cima da arquibancada. */
  const BAN_NU = 64, BAN_NV = 44, BAN_MARGEM = 8;
  /* ajuste de parábola (mínimos quadrados) com uma passada que joga
     fora quem foge demais — a borda do anel vira uma curva lisa */
  function parabola(xs, ys){
    const ajusta = (ix) => {
      let s0=0,s1=0,s2=0,s3=0,s4=0,t0=0,t1=0,t2=0;
      for(const i of ix){ const x=xs[i], y=ys[i], x2=x*x;
        s0++; s1+=x; s2+=x2; s3+=x2*x; s4+=x2*x2; t0+=y; t1+=x*y; t2+=x2*y; }
      const M = [[s4,s3,s2],[s3,s2,s1],[s2,s1,s0]], T = [t2,t1,t0];
      const det = m => m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1]) - m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0]) + m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
      const D = det(M);
      if(Math.abs(D) < 1e-9){ const m = t0 / Math.max(1, s0); return x => m; }
      const col = (k) => M.map((l, r) => l.map((v, c) => c === k ? T[r] : v));
      const a = det(col(0))/D, b = det(col(1))/D, c = det(col(2))/D;
      return x => a*x*x + b*x + c;
    };
    let ix = xs.map((_, i) => i);
    if(ix.length < 3){ const m = ys.reduce((p, y) => p + y, 0) / Math.max(1, ys.length); return x => m; }
    let f = ajusta(ix);
    const res = ix.map(i => Math.abs(ys[i] - f(xs[i])));
    const med = res.slice().sort((p, q) => p - q)[Math.floor(res.length/2)] || 0;
    const fica = ix.filter((i, k) => res[k] <= Math.max(4, med*2.5));
    if(fica.length >= 3) f = ajusta(fica);
    return f;
  }
  /* O PANO SEGUE A CURVA DO ANEL DE CIMA (dono, 11/10/2026: "o bandeirão
     precisa ser curvado pra seguir a linha natural da arquibancada; as
     pontas superiores saem fora dela, isso fica irreal"). Pra cada
     coluna (u) da largura da torcida, o trecho do anel de cima; as duas
     bordas (fundo e frente) viram parábolas lisas, e as linhas do pano
     correm entre elas. Na quina o anel curva e o pano curva junto, sem
     degrau e sem ponta pra fora; a textura vai inteira. */
  function campoDoBandeirao(B, S){
    const agora = performance.now();
    if(B.campo && agora - B.campoEm < 1000) return B.campo;
    const nu = BAN_NU, nv = BAN_NV;
    const u0 = S.u0 - BAN_MARGEM, w = S.u1 - S.u0 + 2*BAN_MARGEM;
    const us = [], vas = [], vbs = [];
    for(let i = 0; i <= nu; i++){
      const u = u0 + w*i/nu;
      const vao = vaoNaLinha(S, u, ALT_MAO);
      if(!vao || vao[1] - vao[0] < 12) continue;
      us.push(u); vas.push(vao[0]); vbs.push(vao[1]);
    }
    const fa = parabola(us, vas), fb = parabola(us, vbs);
    /* a profundidade não passa da torcida: o pano é de quem segura */
    const fundoMin = S.v0 - BAN_MARGEM, frenteMax = S.v1 + BAN_MARGEM;
    const n = (nu+1)*(nv+1);
    const U = new Float32Array(n), V = new Float32Array(n);
    const dist = new Float32Array(n), quem = new Int16Array(n);
    const pts = S.nossos.map(d => [d._u, d._v]);
    const ok = new Uint8Array(nu+1);
    for(let i = 0; i <= nu; i++){
      const u = u0 + w*i/nu;
      let va2 = Math.max(fa(u) + 3, fundoMin), vb2 = Math.min(fb(u) - 3, frenteMax);
      ok[i] = us.length >= 3 && vb2 - va2 > 12 ? 1 : 0;
      if(!ok[i]){ va2 = S.v0; vb2 = S.v1; }
      for(let j = 0; j <= nv; j++){
        const id = j*(nu+1) + i;
        const v = va2 + (vb2 - va2) * (j/nv);
        U[id] = u; V[id] = v;
        let m1 = 1e9, q = -1;
        for(let k = 0; k < pts.length; k++){
          const du = pts[k][0] - u, dv = pts[k][1] - v, dd = du*du + dv*dv;
          if(dd < m1){ m1 = dd; q = k; }
        }
        dist[id] = Math.sqrt(m1); quem[id] = q;
      }
    }
    B.campo = {ok, U, V, dist, quem};
    B.campoEm = agora;
    return B.campo;
  }
  function bandeirao3(F, S, t){
    const P = g3.partes;
    const jan = F.janelas.bandeirao;
    if(!jan) return;
    /* SURGE DA TORCIDA (dono, 11/10/2026: "essa animação do mosaico 3D
       surgir da torcida ficou boa, é o que quero do bandeirão também"):
       o pano começa escondido por baixo das cabeças e vai brotando do
       meio da torcida numa onda que corre do alambrado pro fundo — a
       parte que já subiu ondula na altura das mãos, a que ainda não
       subiu continua embaixo. Na saída, afunda do mesmo jeito. */
    const p = fase(t, jan[0], jan[1], 3.0, 1.8);
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
    const dentro = new Float32Array((nu+1)*(nv+1));
    const altura = new Float32Array((nu+1)*(nv+1));
    for(let j = 0; j <= nv; j++){
      const r = j / nv;
      /* quanto desta linha já brotou: a frente (r = 1) primeiro */
      const sobe = suave(Math.max(0, Math.min(1, (p * 1.6 - (1 - r) * 0.6) / 0.45)));
      for(let i = 0; i <= nu; i++){
        const s2 = i / nu;
        const id = j*(nu+1) + i;
        /* O PANO ANDA (dono, 11/10/2026: "o escudo deve se mover junto"):
           além de subir e descer, o tecido corre de lado e pra frente —
           um balanço geral do pano inteiro e ondas que atravessam ele —
           e como a textura vai presa no vértice, o escudo anda e se
           deforma com o pano */
        const u0b = C.U[id], v0b = C.V[id];
        const balanco = Math.sin(t * 0.9) * 6, vai = Math.sin(t * 0.7 + 1.3) * 4;
        const u = u0b + balanco + 5*Math.sin(t*1.9 - v0b*0.05 + u0b*0.012) * Math.sin(Math.PI*s2);
        const v = v0b + vai + 4*Math.sin(t*1.6 + u0b*0.04 - v0b*0.01) * Math.sin(Math.PI*r);
        const dmin = C.dist[id];
        /* coluna sem degrau não tem pano */
        dentro[id] = C.ok[i] ? sobe : 0;
        /* o calombo da mão de quem segura (cada um no seu ritmo), a
           barriga entre dois e a onda que atravessa o pano */
        const fa = (C.quem[id] * 2.399) % 6.283;
        const mao = Math.exp(-dmin*dmin / 60) * (5 + 2.5*Math.sin(t*3.1 + fa));
        const barriga = -0.45 * Math.min(dmin, 9);
        /* a onda grande correndo do alambrado pro fundo, e a miúda */
        const onda = 6.5*Math.sin(t*2.0 - v*0.05 + u*0.015) + 1.8*Math.sin(t*3.6 + u*0.06 - v*0.03);
        /* a beirada pende um pouco: ninguém segura a quina */
        const borda = Math.min(s2, 1 - s2, r, 1 - r);
        const cai = borda < 0.05 ? (0.05 - borda) * 90 : 0;
        /* brotando: sai de baixo das cabeças com um tranco (a crista da
           onda de quem está empurrando o pano pra cima) */
        const crista = sobe > 0 && sobe < 1 ? 7 * Math.sin(Math.PI * sobe) : 0;
        const hh = (ALT_MAO - 20) + (alt + mao + barriga + onda - cai - (ALT_MAO - 20)) * sobe + crista;
        altura[id] = hh;
        const q = ponto(S, u, v, hh);
        pos.set(q, id*3);
        uv[id*2] = s2; uv[id*2+1] = 1 - r;
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
    /* só os triângulos das colunas com degrau, na parte já aberta */
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
  /* OS ANÉIS DA ARQUIBANCADA. Na máscara do estádio, o anel de cima
     (o de fora, com os vomitórios redondos) e o de baixo são separados
     por uma linha fina de não-pisável, com falhas aqui e ali. Pra
     separar os dois: engrossa o não-pisável em 2 células (fecha as
     falhas da linha), rotula as regiões pisáveis que sobram e devolve o
     rótulo a toda célula pisável original (a mais perto). O ANEL DE
     CIMA é a região grande mais longe do meio da cena. Fica guardado
     por cena. */
  const aneis = {chave:null, rot:null, cima:-1};
  function anelDeCima(){
    const A2 = A();
    if(!A2 || !A2.celulaLivre) return null;
    const chave = (A2.D && A2.D.id) + '|' + A2.COLS + 'x' + A2.ROWS;
    if(aneis.chave === chave) return aneis;
    const C2 = A2.COLS, R2 = A2.ROWS;
    const livre = new Uint8Array(C2*R2);
    for(let r = 0; r < R2; r++) for(let c = 0; c < C2; c++) livre[r*C2+c] = A2.celulaLivre(c, r) ? 1 : 0;
    const E2 = 2;
    const grosso = new Uint8Array(C2*R2);
    for(let r = 0; r < R2; r++) for(let c = 0; c < C2; c++){
      if(!livre[r*C2+c]) continue;
      let ok = 1;
      for(let dr = -E2; dr <= E2 && ok; dr++) for(let dc = -E2; dc <= E2; dc++){
        const rr = r+dr, cc = c+dc;
        if(rr < 0 || cc < 0 || rr >= R2 || cc >= C2 || !livre[rr*C2+cc]){ ok = 0; break; }
      }
      grosso[r*C2+c] = ok;
    }
    const rot = new Int32Array(C2*R2).fill(-1);
    const regioes = [];
    const fila = new Int32Array(C2*R2);
    for(let i = 0; i < C2*R2; i++){
      if(!grosso[i] || rot[i] >= 0) continue;
      const id = regioes.length; let ini = 0, fim = 0, n = 0, sd = 0;
      fila[fim++] = i; rot[i] = id;
      while(ini < fim){
        const k = fila[ini++]; n++;
        const r = (k / C2) | 0, c = k % C2;
        sd += Math.hypot(c - C2/2, r - R2/2);
        for(const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const rr = r+dr, cc = c+dc;
          if(rr < 0 || cc < 0 || rr >= R2 || cc >= C2) continue;
          const kk = rr*C2+cc;
          if(grosso[kk] && rot[kk] < 0){ rot[kk] = id; fila[fim++] = kk; }
        }
      }
      regioes.push({n, dist: sd / n});
    }
    /* devolve o rótulo às células que o engrosso apagou (pela vizinha) */
    let ini = 0, fim = 0;
    for(let i = 0; i < C2*R2; i++) if(rot[i] >= 0) fila[fim++] = i;
    while(ini < fim){
      const k = fila[ini++];
      const r = (k / C2) | 0, c = k % C2;
      for(const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const rr = r+dr, cc = c+dc;
        if(rr < 0 || cc < 0 || rr >= R2 || cc >= C2) continue;
        const kk = rr*C2+cc;
        if(livre[kk] && rot[kk] < 0){ rot[kk] = rot[k]; fila[fim++] = kk; }
      }
    }
    let cima = -1, melhor = -1;
    regioes.forEach((g, id) => { if(g.n >= 300 && g.dist > melhor){ melhor = g.dist; cima = id; } });
    /* a caixa do anel de cima: dá o centro e os semi-eixos da elipse que
       o estádio desenha em volta do campo (o leque dos trapos) */
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    if(cima >= 0) for(let i = 0; i < C2*R2; i++) if(rot[i] === cima){
      const c = i % C2, r = (i / C2) | 0;
      if(c < x0) x0 = c; if(c > x1) x1 = c; if(r < y0) y0 = r; if(r > y1) y1 = r;
    }
    aneis.elipse = cima >= 0 ? {cx:(x0 + x1 + 1)/2 * A2.CEL, cy:(y0 + y1 + 1)/2 * A2.CEL,
                                a:(x1 - x0 + 1)/2 * A2.CEL, b:(y1 - y0 + 1)/2 * A2.CEL} : null;
    /* O CAMPO: o não-pisável ligado ao meio da cena (gramado e fosso,
       até a borda da arquibancada). A borda dele é o que a tira encara. */
    const campo = new Uint8Array(C2*R2);
    {
      const ci = ((R2/2)|0)*C2 + ((C2/2)|0);
      let ini = 0, fim = 0;
      if(!livre[ci]){ fila[fim++] = ci; campo[ci] = 1; }
      let aberto = false;
      while(ini < fim){
        const k = fila[ini++];
        const r = (k / C2) | 0, c = k % C2;
        if(r === 0 || c === 0 || r === R2-1 || c === C2-1) aberto = true;
        for(const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const rr = r+dr, cc = c+dc;
          if(rr < 0 || cc < 0 || rr >= R2 || cc >= C2) continue;
          const kk = rr*C2+cc;
          if(!livre[kk] && !campo[kk]){ campo[kk] = 1; fila[fim++] = kk; }
        }
      }
      /* campo ABERTO: o gramado vaza pra fora da cena (estádio sem anel
         completo, como o de 10 mil) — a borda dele não serve de régua */
      aneis.campoAberto = aberto;
    }
    const bordaCampo = [];
    for(let i = 0; i < C2*R2; i++){
      if(!campo[i]) continue;
      const r = (i / C2) | 0, c = i % C2;
      if([[1,0],[-1,0],[0,1],[0,-1]].some(([dr, dc]) => {
        const rr = r+dr, cc = c+dc;
        return rr >= 0 && cc >= 0 && rr < R2 && cc < C2 && livre[rr*C2+cc];
      })) bordaCampo.push([(c + 0.5) * A2.CEL, (r + 0.5) * A2.CEL]);
    }
    aneis.bordaCampo = bordaCampo;
    aneis.chave = chave; aneis.rot = rot; aneis.cima = cima; aneis.C = C2; aneis.CEL = A2.CEL;
    return aneis;
  }
  /* o ponto (x, y) da cena está no anel de cima? */
  function noAnelDeCima(x, y){
    const N = anelDeCima();
    const A2 = A();
    if(!N || N.cima < 0) return A2 && A2.caminhavel ? A2.caminhavel(x, y) : true;
    const c = Math.floor(x / N.CEL), r = Math.floor(y / N.CEL);
    if(c < 0 || r < 0 || c >= N.C) return false;
    return N.rot[r*N.C + c] === N.cima;
  }

  /* O ANEL DE CIMA (dono, 11/10/2026: "o trapo é somente na parte
     superior, passando por cima do vomitório superior"). Pela linha `u`
     (na direção do campo), o trecho do anel de cima, na posição em que
     a coisa APARECE na tela (altura `alt` sobe 0,42 por unidade com a
     câmera). O vomitório — buraco curto dentro do anel — é atravessado;
     o corredor que separa do anel de baixo, não: do outro lado dele já
     é outra região. */
  function vaoNaLinha(S, u, alt){
    const passoV = 3, sobe = alt * CISALHA_VISTA;
    const pisa = v => {
      const q = ponto(S, u, v, 0);
      return noAnelDeCima(q[0], q[2] - sobe);
    };
    let meio = (S.v0 + S.v1) / 2;
    if(!pisa(meio)){
      let achou = false;
      for(let dv = passoV; dv < (S.v1 - S.v0) + 120; dv += passoV){
        if(pisa(meio - dv)){ meio -= dv; achou = true; break; }
        if(pisa(meio + dv)){ meio += dv; achou = true; break; }
      }
      if(!achou) return null;
    }
    const VAO_MAX = 70;
    const estende = (x, dir) => {
      const LIM = 400;
      for(;;){
        if(Math.abs(x - meio) > LIM) return x;
        if(pisa(x + dir*passoV)){ x += dir*passoV; continue; }
        let pulo = 0;
        for(let g = 2*passoV; g <= VAO_MAX; g += passoV)
          if(pisa(x + dir*g)){ pulo = g; break; }
        if(!pulo) return x;
        x += dir*pulo;
      }
    };
    const a2 = estende(meio, -1), b2 = estende(meio, 1);
    return [a2 + 2, b2 - 2];
  }
  /* as três cores da torcida; torcida de duas ganha o branco (ou o
     preto, se o branco já é dela) como terceira, pra tira ter três faixas */
  function paletaDeTres(F){
    const o = F.torcida || {};
    const c = (TO.mundo.coresDaTorcida && TO.mundo.coresDaTorcida(o)) || {};
    const lista = [c.cor, c.cor2, c.cor3, ...(o.cores || []), o.detalhe]
      .filter(Boolean).map(x => String(x).toLowerCase());
    const unicas = [...new Set(lista)];
    if(unicas.length < 3){
      const extra = unicas.includes('#ffffff') ? '#111111' : '#ffffff';
      if(!unicas.includes(extra)) unicas.push(extra);
    }
    while(unicas.length < 3) unicas.push(F.paleta[unicas.length % F.paleta.length]);
    return unicas.slice(0, 3);
  }
  /* ---------- O TRAÇADO DOS TRAPOS (dono, 11/10/2026) ----------
     A régua do dono: "eles sempre devem atingir de uma borda a outra do
     anel, e sempre no sentido vertical em relação ao campo" — vertical
     em relação ao CAMPO, não à tela: a tira encara o gramado de frente,
     perpendicular à borda dele. Na lateral, de frente pra linha
     lateral; atrás do gol, pra linha de fundo; na curva, apontando pro
     campo como um raio.
       · A DIREÇÃO de cada tira é a do ponto da borda do campo (gramado
         e fosso, até a arquibancada) mais perto dela.
       · DE BORDA A BORDA: corre o anel de cima inteiro na linha dela,
         do muro do fundo à borda do lado do campo, por cima dos
         vomitórios; a grade de pé interrompe. Na quina, onde a linha
         entraria ao comprido no lado vizinho, ninguém passa da
         profundidade do anel no setor (a tira mais curta, com folga).
       · LADO A LADO pela largura que a torcida ocupa, medida em ângulo
         em volta do meio do campo.
     Coordenada de PÉ da cena, conferida no ponto em que a tira aparece
     na tela (a altura sobe 0,42 por unidade). */
  const TRAPO_L = 16;
  function linhasDosTrapos(J, S){
    const W = (A() && A().W) || 1536, H = (A() && A().H) || 1024;
    const N = anelDeCima();
    const D = A() && A().D;
    const pes = S.nossos.map(d => [d.x, d.y]);
    const conta = {};
    for(const d of S.nossos) conta[d.spawn] = (conta[d.spawn] || 0) + 1;
    const spawn = Object.keys(conta).sort((a,b) => conta[b] - conta[a])[0];
    const fx = D && D.faixas && D.faixas[spawn];
    /* TRÊS JEITOS DE SABER ONDE É O CAMPO, do mais certo pro mais geral:
         · ARCO: a âncora do setor curvo traz o centro da curva — a tira
           é um raio dele;
         · BORDA: estádio fechado (o anel abraça o campo) — a tira encara
           o ponto da borda do campo mais perto;
         · RETO: campo aberto (estádio sem anel completo) — a tira segue
           a direção do gramado anotada no setor, perpendicular à linha. */
    const borda = (N && N.bordaCampo) || [];
    const modo = fx && fx.arco ? 'arco' : (borda.length && N && !N.campoAberto) ? 'borda' : 'reto';
    let ccx = W/2, ccy = H/2;
    if(modo === 'arco'){ ccx = fx.arco[0]; ccy = fx.arco[1]; }
    else if(borda.length){ ccx = borda.reduce((s, p) => s + p[0], 0) / borda.length; ccy = borda.reduce((s, p) => s + p[1], 0) / borda.length; }
    let reto = null;
    if(modo === 'reto'){
      let gx = fx && fx.dir ? fx.dir[0] : ccx - pes[0][0], gy = fx && fx.dir ? fx.dir[1] : ccy - pes[0][1];
      const gn = Math.hypot(gx, gy) || 1; reto = [gx/gn, gy/gn];
    }
    const maisPerto = (x, y) => {
      let m = Infinity, q = null;
      for(const p of borda){ const d = (p[0]-x)*(p[0]-x) + (p[1]-y)*(p[1]-y); if(d < m){ m = d; q = p; } }
      return q || [ccx, ccy];
    };
    /* a direção da tira que passa por (x, y) */
    const direcao = (x, y) => {
      if(modo === 'reto') return reto;
      const q = modo === 'arco' ? [ccx, ccy] : maisPerto(x, y);
      const gx = q[0] - x, gy = q[1] - y, gn = Math.hypot(gx, gy) || 1;
      return [gx/gn, gy/gn];
    };
    /* AS BASES SAEM DA TORCIDA: cada membro ganha uma posição "de lado"
       (o ângulo em volta do centro do arco; o ângulo do ponto de borda
       dele em volta do meio do campo; ou a projeção ao longo da linha),
       as tiras se espalham por essa largura e a base de cada uma é o
       miolo de quem está naquela fatia */
    let lat, largura;
    if(modo === 'reto'){
      const lx = -reto[1], ly = reto[0];
      lat = pes.map(([x, y]) => x*lx + y*ly);
      largura = Math.max(...lat) - Math.min(...lat) + 8;
    } else {
      const alvo = modo === 'arco' ? pes : pes.map(([x, y]) => maisPerto(x, y));
      const angs = alvo.map(([x, y]) => Math.atan2(y - ccy, x - ccx));
      const ref = Math.atan2(angs.reduce((s, a) => s + Math.sin(a), 0), angs.reduce((s, a) => s + Math.cos(a), 0));
      lat = angs.map(a => { let d = a - ref; while(d > Math.PI) d -= 2*Math.PI; while(d < -Math.PI) d += 2*Math.PI; return d; });
      if(modo === 'arco'){
        const raio = pes.reduce((s, [x, y]) => s + Math.hypot(x - ccx, y - ccy), 0) / pes.length;
        largura = (Math.max(...lat) - Math.min(...lat)) * raio + 8;
      } else {
        const ordem = lat.map((r, i) => [r, i]).sort((p, q) => p[0] - q[0]);
        largura = 8;
        for(let i = 1; i < ordem.length; i++){
          const p = alvo[ordem[i-1][1]], q = alvo[ordem[i][1]];
          largura += Math.hypot(q[0] - p[0], q[1] - p[1]);
        }
      }
    }
    const a0 = Math.min(...lat), a1 = Math.max(...lat);
    const n = Math.max(2, Math.floor(largura / 34));
    const bases = [];
    for(let k = 0; k < n; k++){
      const c0 = a0 + (a1 - a0) * k / n, c1 = a0 + (a1 - a0) * (k + 1) / n;
      let sx = 0, sy = 0, m = 0;
      lat.forEach((r, i) => { if(r >= c0 - 1e-9 && (r < c1 || (k === n - 1 && r <= c1 + 1e-9))){ sx += pes[i][0]; sy += pes[i][1]; m++; } });
      if(m) bases.push([sx/m, sy/m]);
    }
    const sobe = TRAPO_ALT * CISALHA_VISTA;
    const pisa = (x, y) => noAnelDeCima(x, y - sobe);
    const grades = (J && J.grades) || null;
    const cruza = (x1, y1, x2, y2) => !!(grades && A().atravessaGrade &&
      A().atravessaGrade(x1, y1 - sobe, x2, y2 - sobe, grades));
    const linhas = [];
    for(const [bx, by] of bases){
      const dir = direcao(bx, by);
      const gx = dir[0], gy = dir[1];
      const P = s => [bx + gx*s, by + gy*s];
      const ok = s => { const [x, y] = P(s); return pisa(x, y); };
      let meio = 0;
      if(!ok(0)){
        let achou = false;
        for(let d = 3; d < 160; d += 3){
          if(ok(d)){ meio = d; achou = true; break; }
          if(ok(-d)){ meio = -d; achou = true; break; }
        }
        if(!achou){ linhas.push({base:[bx, by], dir, vao:null}); continue; }
      }
      const estende = (s, sentido) => {
        for(let guarda = 0; guarda < 400; guarda++){
          const prox = s + sentido*3;
          const [x1, y1] = P(s), [x2, y2] = P(prox);
          if(cruza(x1, y1, x2, y2)) return s;
          if(ok(prox)){ s = prox; continue; }
          let pulo = 0;
          for(let gg = 6; gg <= 70; gg += 3) if(ok(s + sentido*gg)){ pulo = gg; break; }
          if(!pulo) return s;
          const [x3, y3] = P(s + sentido*pulo);
          if(cruza(x1, y1, x3, y3)) return s;
          s += sentido*pulo;
        }
        return s;
      };
      const sa = estende(meio, -1), sb = estende(meio, 1);
      linhas.push({base:[bx, by], dir, vao: sb - sa > 16 ? [sa + 2, sb - 2] : null});
    }
    /* na quina: ninguém passa da profundidade do anel no setor, a partir
       do muro do fundo (o lado oposto ao campo) */
    const comps = linhas.filter(l => l.vao).map(l => l.vao[1] - l.vao[0]);
    if(comps.length){
      const teto = Math.max(60, Math.min(...comps) * 1.15);
      for(const l of linhas) if(l.vao && l.vao[1] - l.vao[0] > teto) l.vao = [l.vao[0], l.vao[0] + teto];
    }
    return linhas;
  }

  function trapos3(F, S, t){
    const P = g3.partes;
    if(!F.janelas.trapos) return;
    const W = F.janelas;
    const ocupa = ['mosaico','bandeirao'].some(id => W[id] && t >= W[id][0] - 0.4 && t <= W[id][1] + 0.4);
    F.recolhe = Math.max(0, Math.min(1, (F.recolhe || 0) + (ocupa ? 0.04 : -0.04)));
    /* o traçado muda pouco no jogo assistido: refaz a cada 1,5 s */
    const agora = performance.now();
    if(!P.tracado || agora - P.tracadoEm > 1500){ P.tracado = linhasDosTrapos(g3.J, S); P.tracadoEm = agora; }
    const linhas = P.tracado;
    const n = linhas.length;
    if(!P.trapos || P.trapos.n !== n){
      if(P.trapos) for(const r of P.trapos.fitas){ g3.raiz.remove(r.mesh); r.mesh.geometry.dispose(); r.mesh.material.dispose(); }
      const fitas = [];
      const cores = paletaDeTres(F);
      for(let k = 0; k < n; k++){
        /* AS TRÊS CORES DA TORCIDA: três faixas ao comprido, a ordem
           rodando de tira pra tira */
        const cv = document.createElement('canvas'); cv.width = 9; cv.height = 4;
        const c = cv.getContext('2d');
        for(let f = 0; f < 3; f++){ c.fillStyle = cores[(k + f) % 3]; c.fillRect(f*3, 0, 3, 4); }
        const tx = textura(cv); tx.magFilter = THREE.NearestFilter;
        const geo = grade(1, 28);
        const mesh = new THREE.Mesh(geo, lambert({map:tx}));
        mesh.frustumCulled = false;
        g3.raiz.add(mesh);
        fitas.push({mesh, geo});
      }
      P.trapos = {n, fitas};
    }
    P.trapos.fitas.forEach((r, k) => {
      const L = linhas[k];
      r.mesh.visible = !!(L && L.vao) && F.recolhe < 0.98;
      if(!r.mesh.visible) return;
      const [sa, sb] = L.vao;
      const [bx, by] = L.base, [gx, gy] = L.dir;
      const px = -gy, py = gx;                     // o lado da tira
      /* recolhida, a tira enrola pro fundo */
      const sFim = sa + (sb - sa) * (1 - 0.9 * F.recolhe);
      const pos = r.geo.attributes.position.array, uv = r.geo.attributes.uv.array;
      const nv = r.geo.nv;
      for(let j = 0; j <= nv; j++){
        const s2 = j / nv;
        const s = sa + (sFim - sa) * s2;
        /* deitada sobre as cabeças, ondulando com quem está embaixo */
        const h = TRAPO_ALT + 2.2*Math.sin(t*2.3 + k*1.1 + s*0.09) + 1.2*Math.sin(t*3.4 - s*0.05);
        const lado = 1.6 * Math.sin(t*1.2 + k*1.7 + s2*4);
        for(let i = 0; i <= 1; i++){
          const off = lado + (i ? TRAPO_L/2 : -TRAPO_L/2);
          const kk = j*2 + i;
          pos[kk*3] = bx + gx*s + px*off; pos[kk*3+1] = h; pos[kk*3+2] = by + gy*s + py*off;
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
    if(!F.temPapel) return;
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
                        cor: Math.random() < 0.2 ? '#ffffff' : umaCor(F)});
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

  /* ---------- o mosaico 3D: içado da arquibancada até ficar de pé ----------
     (dono, 11/10/2026, com as fotos do Bart da TUF: "surge num movimento
     de baixo pra cima"). A bandeira nasce DEITADA sobre a torcida, com a
     barra de baixo presa no meio do setor, e as cordas lá do alto vão
     puxando a barra de cima: o pano gira em torno da barra de baixo até
     ficar de pé (~60° do chão), de frente pro campo. Enquanto sobe ele
     balança de lado e faz barriga; em pé, só o vento. Na saída desce
     do mesmo jeito. */
  function cilindroEntre(m, a, b){
    const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2];
    const L = Math.hypot(dx, dy, dz) || 1;
    m.position.set((a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2);
    m.scale.set(1, L, 1);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx/L, dy/L, dz/L));
  }
  function mosaico3d3(F, S, t){
    const P = g3.partes;
    const jan = F.janelas.mosaico3d;
    if(!jan) return;
    /* a subida é mais lenta que a descida: puxar dá trabalho */
    const p = fase(t, jan[0], jan[1], 3.2, 1.8);
    const SW = S.u1 - S.u0, SD = S.v1 - S.v0;
    /* NA PROPORÇÃO DO BART (dono, 11/10/2026): a figura ocupa uns dois
       quintos da largura da torcida e é mais alta que larga — o mosaico
       de papel continua aparecendo dos dois lados dela */
    const w = Math.max(64, Math.min(150, SW * 0.42));
    const h = Math.max(80, Math.min(200, w * 1.35));
    if(!P.m3d){
      const arte = arte3D(F, w, h);
      const tx = textura(arte);
      const geo = grade(24, 18);
      const mesh = new THREE.Mesh(geo, lambert({map:tx}));
      mesh.frustumCulled = false;
      /* as cordas que sobem do pano até o alto do estádio */
      const cm = new THREE.MeshLambertMaterial({color:0x2a2a2a});
      const cordas = [0, 1, 2].map(() => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 5), cm);
        c.frustumCulled = false; g3.raiz.add(c); return c;
      });
      g3.raiz.add(mesh);
      P.m3d = {mesh, geo, tx, cordas, w, h};
    }
    const M = P.m3d;
    const arteAgora = arte3D(F, M.w, M.h);
    if(M.mesh.material.map.image !== arteAgora){
      M.tx.dispose(); M.tx = textura(arteAgora);
      M.mesh.material.map = M.tx; M.mesh.material.needsUpdate = true;
    }
    const vivo = p > 0;
    M.mesh.visible = vivo; M.cordas.forEach(c => c.visible = vivo);
    if(!vivo) return;
    const ergue = suave(p);
    /* o ângulo do pano com o chão: deitado (0,08) até em pé (~60°) */
    const INC = 1.05, ang = 0.55 + (INC - 0.55) * ergue;
    const uC = (S.u0 + S.u1) / 2;
    /* a barra de baixo, presa na mão da torcida no meio do setor */
    const vBaixo = S.v0 + SD * 0.62, hBaixo = ALT_MAO + 2;
    /* deitado, o pano vai pro FUNDO (v menor) por cima das cabeças; em
       pé, sobe pro alto. Balanço de lado e barriga enquanto sobe. */
    const agita = Math.sin(Math.PI * Math.min(1, ergue));
    const rolo = 0.10 * agita * Math.sin(t * 2.3);           // tomba de lado
    const pos = M.geo.attributes.position.array, uv = M.geo.attributes.uv.array;
    const nu = M.geo.nu, nv = M.geo.nv;
    /* SURGE DE BAIXO PRA CIMA, como o Bart da TUF: as cordas puxam o
       TOPO da arte primeiro — a cabeça sai do meio da torcida — e o
       resto vai saindo atrás; a parte que ainda não subiu fica embolada
       na barra, por baixo das cabeças. `ergue` é quanto da arte já saiu. */
    const pontoDoPano = (s2, r) => {
      /* r = 0 no topo da arte, 1 na barra de baixo */
      const fora = r <= ergue;
      const d = fora ? (ergue - r) * M.h : 0;
      const uL = -M.w/2 + s2 * M.w;
      /* o tombo de lado: a ponta de cima corre pro lado */
      const u = uC + uL + rolo * d;
      /* barriga do pano enquanto é puxado, mais no meio e no alto */
      const bar = (6 * agita + 1.6) * Math.sin(Math.PI * s2) * Math.sin(Math.PI * (1 - r)) *
                  (0.7 + 0.3 * Math.sin(t * 2.7 + s2 * 4));
      const v = vBaixo - d * Math.cos(ang) + (fora ? bar * Math.sin(ang) : 0);
      /* o que ainda não subiu fica embolado embaixo das cabeças */
      const hh = fora ? hBaixo + d * Math.sin(ang) + bar * Math.cos(ang) * 0.4
                      : hBaixo - 14 - (r - ergue) * 8;
      return ponto(S, u, v, hh);
    };
    for(let j = 0; j <= nv; j++){
      const r = j / nv;
      for(let i = 0; i <= nu; i++){
        const s2 = i / nu;
        const k = j*(nu+1) + i;
        pos.set(pontoDoPano(s2, r), k*3);
        uv[k*2] = s2; uv[k*2+1] = 1 - r;
      }
    }
    M.geo.attributes.position.needsUpdate = true; M.geo.attributes.uv.needsUpdate = true;
    M.geo.computeVertexNormals();
    /* as cordas: das pontas e do meio da barra de cima até o alto,
       atrás da última fileira */
    [0, 0.5, 1].forEach((s2, k) => {
      const a = pontoDoPano(s2, 0);
      const b = ponto(S, uC - M.w/2 + s2 * M.w, S.v0 - 30, hBaixo + M.h * Math.sin(INC) + 60);
      cilindroEntre(M.cordas[k], a, b);
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
    g3.J = J;
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

  return {iniciar, gol, desenhar, emCena, atualizar3d,
          /* pra quem testa o traçado */ _linhasDosTrapos: linhasDosTrapos, _setor: setor};
})();
