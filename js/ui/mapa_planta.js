/* =========================================================
   A PLANTA DA CIDADE NO JOGO 2D (o dono, 01/10/2026: "preciso implementar
   o mapa 2d que acabamos de construir na versão 3d no jogo, com toda a
   questão de população do bairro, torcida por bairro, domínio da praça e
   do bairro, etc.")

   O desenho da cidade é o da planta do jogo 3D — as mesmas ruas, quadras,
   favelas, estádios e praia —, assado por praça em img/mapas/<id>.webp
   (ferramentas/assar_plantas.js). Por cima, ao vivo, este visor pinta o
   que muda com o jogo:
     · cada bairro na cor da torcida dona, mais forte quanto maior a barra
       dela; cinza quando ninguém passa de 50% (em disputa);
     · as divisas dos bairros (finas) e das zonas (grossas);
     · o nome do bairro com a sigla da dona e a barra embaixo;
     · as sedes, na cor da torcida (a nossa com o aro de ouro);
     · os estádios, equipamentos e marcos (de perto) e os nomes das
       cidades, nas praças de várias cidades.
   Arrastar move, a roda (ou a pinça) aproxima no ponto, o clique escolhe
   o bairro — o cartão ao lado (mapa_brasil.js) conta quem manda, a
   barra, quem mora nele e a ação social.

   Sem a imagem da praça (o pacote de um arquivo só não leva as plantas),
   o visor avisa e o painel volta ao quadro de bairros por zona.
   ========================================================= */
window.TO = window.TO || {};

TO.mapaPlanta = (function(){
  const D = () => TO.dominio;
  const E = () => TO.estado && TO.estado.E;
  const MB = () => TO.mapaBrasil;
  const IMG = c => (window.__EMBUTIDOS && window.__EMBUTIDOS[c]) || c;
  const P = cid => (TO.dados && TO.dados.plantas && TO.dados.plantas[cid]) || null;

  /* o que fica guardado entre um redesenho do painel e outro: a imagem
     de cada praça, a grade decodificada e a vista (o zoom e o ponto) */
  const imagens = new Map(), grades = new Map(), vistas = new Map(), falhou = new Set();

  function tem(cid){ return !!P(cid) && !falhou.has(cid); }

  /* a grade dos bairros, das corridas pra um vetor (índice do bairro da
     planta por célula; -1 fora de bairro), e as divisas já em caminho */
  function grade(cid){
    if(grades.has(cid)) return grades.get(cid);
    const p = P(cid), g = p.g, rot = new Int16Array(g.nx * g.ny).fill(-1);
    for(let j = 0; j < g.ny; j++){
      const l = g.l[j] || [];
      let i = 0;
      for(let k = 0; k < l.length; k += 2){ rot.fill(l[k], j * g.nx + i, j * g.nx + i + l[k + 1]); i += l[k + 1]; }
    }
    const em = (i, j) => rot[j * g.nx + i];
    const zona = k => k >= 0 ? p.b[k][2] : null;
    const fina = new Path2D(), grossa = new Path2D();
    for(let j = 0; j < g.ny; j++) for(let i = 0; i < g.nx; i++){
      const k = em(i, j);
      if(i < g.nx - 1){
        const d = em(i + 1, j);
        if(d !== k){
          const alvo = k >= 0 && d >= 0 && zona(k) !== zona(d) ? grossa : fina;
          const x = g.x0 + (i + 1) * g.cel;
          alvo.moveTo(x, g.y0 + j * g.cel); alvo.lineTo(x, g.y0 + (j + 1) * g.cel);
        }
      }
      if(j < g.ny - 1){
        const d = em(i, j + 1);
        if(d !== k){
          const alvo = k >= 0 && d >= 0 && zona(k) !== zona(d) ? grossa : fina;
          const y = g.y0 + (j + 1) * g.cel;
          alvo.moveTo(g.x0 + i * g.cel, y); alvo.lineTo(g.x0 + (i + 1) * g.cel, y);
        }
      }
    }
    const r = {rot, em, fina, grossa, contornos:new Map()};
    grades.set(cid, r);
    return r;
  }
  /* o contorno de um bairro só (o escolhido, o do mouse) */
  function contorno(cid, k){
    const G = grade(cid);
    if(G.contornos.has(k)) return G.contornos.get(k);
    const g = P(cid).g, c = new Path2D();
    for(let j = 0; j < g.ny; j++) for(let i = 0; i < g.nx; i++){
      if(G.em(i, j) !== k) continue;
      const x0 = g.x0 + i * g.cel, y0 = g.y0 + j * g.cel, x1 = x0 + g.cel, y1 = y0 + g.cel;
      if(i === 0 || G.em(i - 1, j) !== k){ c.moveTo(x0, y0); c.lineTo(x0, y1); }
      if(i === g.nx - 1 || G.em(i + 1, j) !== k){ c.moveTo(x1, y0); c.lineTo(x1, y1); }
      if(j === 0 || G.em(i, j - 1) !== k){ c.moveTo(x0, y0); c.lineTo(x1, y0); }
      if(j === g.ny - 1 || G.em(i, j + 1) !== k){ c.moveTo(x0, y1); c.lineTo(x1, y1); }
    }
    G.contornos.set(k, c);
    return c;
  }

  /* OS MUROS DE PIXAÇÃO (01/10/2026): de 3 a 5 por bairro (o número é
     do domínio, `vagasPix`), cada um num ponto fixo dentro do bairro —
     espalhados (o mais longe dos já escolhidos, numa amostra fixa das
     células do bairro) e longe do nome dele no meio */
  const murosPos = new Map();
  function posMuros(cid){
    if(murosPos.has(cid)) return murosPos.get(cid);
    const p = P(cid), g = p.g, G = grade(cid), H = (TO.dominio && TO.dominio.hash) || (s => s.length);
    const cel = p.b.map(() => []);
    for(let j = 0; j < g.ny; j++) for(let i = 0; i < g.nx; i++){ const k = G.em(i, j); if(k >= 0) cel[k].push([i, j]); }
    const out = new Map();
    p.b.forEach((pb, k) => {
      const n = TO.dominio && TO.dominio.vagasPix ? TO.dominio.vagasPix(cid, pb[0]) : 4;
      const cx = pb[3] != null ? (pb[3] - g.x0) / g.cel : null, cy = pb[4] != null ? (pb[4] - g.y0) / g.cel : null;
      /* uma amostra fixa das células, sem as perto do nome */
      /* dentro do bairro de verdade: 2 células de folga da divisa, pra o
         ponto não ficar em cima da linha entre dois bairros */
      const dentro = ([i, j]) => { for(let a = -2; a <= 2; a++) for(let c = -2; c <= 2; c++){
        const ii = i + a, jj = j + c; if(ii < 0 || jj < 0 || ii >= g.nx || jj >= g.ny || G.em(ii, jj) !== k) return false; } return true; };
      let cs = cel[k].filter(c => dentro(c) && (cx == null || Math.hypot(c[0] - cx, c[1] - cy) > 4));
      if(cs.length < n) cs = cel[k].filter(dentro);
      if(cs.length < n) cs = cel[k].slice();
      cs = cs.map(c => [c, H(`muro|${cid}|${pb[0]}|${c[0]}|${c[1]}`)]).sort((a, b) => a[1] - b[1]).slice(0, 400).map(x => x[0]);
      const esc = [];
      if(cs.length) esc.push(cs[0]);
      while(esc.length < n && esc.length < cs.length){
        let melhor = null, dm = -1;
        for(const c of cs){
          const d = Math.min(...esc.map(e => Math.hypot(e[0] - c[0], e[1] - c[1])));
          if(d > dm){ dm = d; melhor = c; }
        }
        esc.push(melhor);
      }
      out.set(pb[0], esc.map(([i, j]) => [g.x0 + (i + 0.5) * g.cel, g.y0 + (j + 0.5) * g.cel]));
    });
    murosPos.set(cid, out);
    return out;
  }

  function imagem(cid, pronta){
    let im = imagens.get(cid);
    if(!im){
      im = new Image();
      im.decoding = 'async';
      im.src = IMG('img/mapas/' + cid + '.webp');
      imagens.set(cid, im);
    }
    if(!im.complete){
      im.addEventListener('load', pronta, {once:true});
      im.addEventListener('error', () => { falhou.add(cid); pronta(); }, {once:true});
    } else if(!im.naturalWidth) falhou.add(cid);
    return im;
  }

  const rgb = hex => { const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

  /* =======================================================
     O VISOR
     ======================================================= */
  /* tela de toque (o celular): a dica é outra, e some no primeiro toque */
  const toque = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  let dicaVista = false;

  function criar(cid, opc){
    opc = opc || {};
    const p = P(cid), d = D(), e = E();
    const caixa = document.createElement('div');
    caixa.className = 'mb-planta';
    if(!p || !d || !e) return caixa;
    caixa.innerHTML = `<canvas></canvas>
      <div class="mb-planta-zoom">
        <button type="button" data-z="mais" aria-label="${_t('Aproximar')}">+</button>
        <button type="button" data-z="menos" aria-label="${_t('Afastar')}">−</button>
        <button type="button" data-z="tudo" aria-label="${_t('A cidade inteira')}">⤢</button></div>
      <p class="mb-planta-dica">${toque ? _t('Arraste · pinça pra aproximar · toque num bairro') : _t('Arraste pra mover · role pra aproximar · clique num bairro pra ver quem manda')}</p>
      <p class="mb-planta-espera">${_t('Abrindo a planta…')}</p>`;
    const cv = caixa.querySelector('canvas'), ctx = cv.getContext('2d');
    const espera = caixa.querySelector('.mb-planta-espera');
    const G = grade(cid), L = p.L, g = p.g;
    const meu = e.torcida.id;

    /* os bairros de hoje, pela ordem da planta */
    const hoje = new Map(d.bairros(e, cid).map(b => [b.id, b]));
    const deK = p.b.map(x => hoje.get(x[0]) || null);
    const kDe = id => p.b.findIndex(x => x[0] === id);

    /* a camada dos bairros: um pixel por célula, na cor da dona */
    const cam = document.createElement('canvas');
    cam.width = g.nx; cam.height = g.ny;
    {
      const c2 = cam.getContext('2d'), px = c2.createImageData(g.nx, g.ny), dd = px.data;
      const cor = deK.map(b => {
        if(!b) return null;
        if(!b.dono) return [150, 150, 146, 50];
        const [r, gg, bb] = rgb(MB().corDe(b.dono));
        return [r, gg, bb, Math.round(255 * (0.30 + 0.32 * Math.min(1, Math.max(0, (b.v - 50) / 50))))];
      });
      for(let n = 0; n < G.rot.length; n++){
        const c = G.rot[n] >= 0 ? cor[G.rot[n]] : null;
        if(!c) continue;
        dd.set(c, n * 4);
      }
      c2.putImageData(px, 0, 0);
    }

    /* a vista guardada (ou a cidade inteira) */
    let V = vistas.get(cid) || null, larg = 0, alt = 0, dpr = 1;
    const sFit = () => Math.min(larg / (L.x1 - L.x0), alt / (L.y1 - L.y0)) * 0.96;
    const sMax = () => Math.max(sFit() * 3, (p.w / (L.x1 - L.x0)) * 2.5);
    function enquadrar(){
      const s = sFit();
      V = {s, x0:(L.x0 + L.x1) / 2 - larg / 2 / s, y0:(L.y0 + L.y1) / 2 - alt / 2 / s};
      vistas.set(cid, V);
    }
    function limitar(){
      V.s = Math.min(sMax(), Math.max(sFit() * 0.85, V.s));
      /* o mapa não foge da tela: sempre sobra um pedaço dele à vista */
      const mx = larg / V.s * 0.6, my = alt / V.s * 0.6;
      V.x0 = Math.min(L.x1 - mx, Math.max(L.x0 - larg / V.s + mx, V.x0));
      V.y0 = Math.min(L.y1 - my, Math.max(L.y0 - alt / V.s + my, V.y0));
    }
    const paraTela = (x, y) => [(x - V.x0) * V.s, (y - V.y0) * V.s];
    const doMundo = (sx, sy) => [V.x0 + sx / V.s, V.y0 + sy / V.s];
    function bairroEm(sx, sy){
      const [x, y] = doMundo(sx, sy);
      const i = Math.floor((x - g.x0) / g.cel), j = Math.floor((y - g.y0) / g.cel);
      if(i < 0 || j < 0 || i >= g.nx || j >= g.ny) return -1;
      return G.em(i, j);
    }

    let sobre = -1, pedido = 0;
    const im = imagem(cid, () => { pedir(); if(falhou.has(cid) && opc.semPlanta) opc.semPlanta(); });
    function pedir(){ if(!pedido) pedido = requestAnimationFrame(desenhar); }

    function desenhar(){
      pedido = 0;
      if(!larg || !alt) return;
      if(!V) enquadrar();
      const s = V.s;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#121512'; ctx.fillRect(0, 0, larg, alt);
      const pronta = im.complete && im.naturalWidth;
      espera.hidden = !!pronta;
      /* o mundo: o chão, os bairros e as divisas */
      ctx.save();
      ctx.setTransform(dpr * s, 0, 0, dpr * s, -V.x0 * s * dpr, -V.y0 * s * dpr);
      ctx.imageSmoothingEnabled = true;
      if(pronta) ctx.drawImage(im, L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cam, g.x0, g.y0, g.nx * g.cel, g.ny * g.cel);
      ctx.lineCap = 'square';
      ctx.strokeStyle = 'rgba(12,12,12,.6)'; ctx.lineWidth = 1.4 / s; ctx.stroke(G.fina);
      ctx.strokeStyle = 'rgba(8,8,8,.9)'; ctx.lineWidth = 3 / s; ctx.stroke(G.grossa);
      const kSel = opc.escolhido ? kDe(opc.escolhido) : -1;
      if(sobre >= 0 && sobre !== kSel){ ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2 / s; ctx.stroke(contorno(cid, sobre)); }
      if(kSel >= 0){ ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 3.2 / s; ctx.stroke(contorno(cid, kSel)); }
      ctx.restore();
      rotulos();
    }

    /* os rótulos, na tela (letra do mesmo tamanho em qualquer zoom) */
    function rotulos(){
      const s = V.s, perto = s / sFit();
      const ocupados = [];
      const livre = (x, y, w, h) => !ocupados.some(o => Math.abs(o.x - x) < (o.w + w) / 2 && Math.abs(o.y - y) < (o.h + h) / 2);
      const ocupa = (x, y, w, h) => ocupados.push({x, y, w, h});
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      /* NO CELULAR AS LETRAS ENCOLHEM (o dono, 02/10/2026: "os mapas novos
         ficam impossíveis de navegar pelo celular"): a letra acompanha a
         largura do quadro, até 72% num celular em pé */
      const k = Math.max(0.72, Math.min(1, larg / 760)), q = v => v * k;
      const pequeno = larg < 600;
      const fonte = (peso, px) => `${peso} ${Math.round(px * k * 10) / 10}px "Barlow Condensed", "Arial Narrow", system-ui, sans-serif`;
      /* os nomes das cidades (a praça de várias cidades), de longe */
      const cidades = p.r.filter(r => r[3] === 'c');
      if(cidades.length && perto < 2.2){
        ctx.font = fonte(800, 20);
        for(const [t, x, y] of cidades){
          const [sx, sy] = paraTela(x, y);
          const w = ctx.measureText(t).width + 8;
          /* (o nome de cidade que bate em outro espera o zoom) */
          if(!livre(sx, sy - q(8), w, q(24))) continue;
          ctx.lineWidth = q(5); ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.fillStyle = '#ffe9a8';
          ctx.strokeText(t, sx, sy - q(8)); ctx.fillText(t, sx, sy - q(8));
          ocupa(sx, sy - q(8), w, q(24));
        }
      }
      /* OS MUROS PIXADOS: o ponto na cor de quem pixou; o livre, um aro
         claro (de perto, ou no bairro escolhido) */
      if(d.muros){
        const PM = posMuros(cid), kSel = opc.escolhido;
        for(const pb of p.b){
          const pos = PM.get(pb[0]) || [];
          const ms = d.muros(e, cid, pb[0]);
          ms.forEach((m, i) => {
            const pt = pos[i]; if(!pt) return;
            const [sx, sy] = paraTela(pt[0], pt[1]);
            if(sx < -10 || sy < -10 || sx > larg + 10 || sy > alt + 10) return;
            const sel = opc.muro && opc.muro.b === pb[0] && opc.muro.i === i;
            const rr = perto >= 1.6 ? 5.5 : 4.2;
            if(m.t){
              const cor = MB().corDe(m.t);
              ctx.beginPath(); ctx.arc(sx, sy, rr, 0, Math.PI * 2);
              ctx.fillStyle = cor; ctx.fill();
              ctx.lineWidth = 1.4; ctx.strokeStyle = MB().claro(cor) ? '#222' : '#f4f4f0'; ctx.stroke();
            } else if(perto >= 1.6 || kSel === pb[0] || sel){
              ctx.beginPath(); ctx.arc(sx, sy, rr - 0.8, 0, Math.PI * 2);
              ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke();
            }
            if(sel){ ctx.beginPath(); ctx.arc(sx, sy, rr + 3.5, 0, Math.PI * 2); ctx.lineWidth = 2.2; ctx.strokeStyle = '#d9a441'; ctx.stroke(); }
          });
        }
      }
      /* os bairros: o nome e, embaixo, a dona com a barra (ou "em disputa") */
      p.b.forEach((pb, k) => {
        const b = deK[k];
        if(!b || pb[3] == null) return;
        let [sx, sy] = paraTela(pb[3], pb[4]);
        if(sx < -120 || sx > larg + 120 || sy < -30 || sy > alt + 30) return;
        const t = b.nome.toUpperCase();
        const sub = b.dono ? `${d.siglaDe(b.dono)} ${Math.round(b.v)}%` : _t('em disputa');
        /* as demais torcidas com barra no bairro, embaixo da dona (o dono,
           01/10/2026: "a porcentagem das demais torcidas não-dominantes do
           bairro"), até três */
        let outras = (b.partes || []).filter(x => x.t !== b.dono && x.v >= 1).slice(0, 3)
          .map(x => `${d.siglaDe(x.t)} ${Math.round(x.v)}%`).join(' · ');
        ctx.font = fonte(700, 13);
        const w = Math.max(ctx.measureText(t).width, 40);
        /* (de longe, na praça de várias cidades, o nome que não cabe espera
           o zoom: a cor do bairro já diz quem manda) */
        ctx.font = fonte(600, 11);
        const wo = outras ? ctx.measureText(outras).width : 0;
        ctx.font = fonte(700, 13);
        let caixaW = Math.max(w, wo) + 6, caixaH = q(outras ? 42 : 30);
        /* sem espaço pras outras torcidas, o nome fica com a dona só; e,
           sem espaço no meio, o nome procura outro ponto DENTRO do bairro
           (o bairro comprido do 3D, de 02/10/2026, deixava o meio colado no
           nome do vizinho e o nome sumia) */
        const pontos = [[0, 0]];
        for(const [dx, dy] of [[0, 34], [0, -34], [55, 0], [-55, 0], [50, 34], [-50, 34], [50, -34], [-50, -34], [0, 64], [0, -64], [95, 0], [-95, 0]]){
          const px = sx + q(dx), py = sy + q(dy);
          if(bairroEm(px, py) === k) pontos.push([q(dx), q(dy)]);
        }
        const cabe = (ox, oy, com) => livre(sx + ox, sy + oy + q(com ? 12 : 6), com ? caixaW : w + 6, q(com ? 42 : 30));
        let achou = null;
        if(outras && cabe(0, 0, true)) achou = [0, 0, true];
        else if(cabe(0, 0, false)) achou = [0, 0, false];
        else for(const [ox, oy] of pontos.slice(1)){
          if(outras && cabe(ox, oy, true)){ achou = [ox, oy, true]; break; }
          if(cabe(ox, oy, false)){ achou = [ox, oy, false]; break; }
        }
        if(!achou) return;
        sx += achou[0]; sy += achou[1];
        if(!achou[2]){ outras = ''; caixaW = w + 6; caixaH = q(30); }
        ctx.lineWidth = q(3.5); ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.fillStyle = '#ffffff';
        ctx.strokeText(t, sx, sy); ctx.fillText(t, sx, sy);
        ctx.font = fonte(600, 12);
        ctx.strokeText(sub, sx, sy + q(14));
        ctx.fillStyle = b.dono === meu ? '#ffe7a0' : b.dono ? '#e8e8e8' : '#b9b9b4'; ctx.fillText(sub, sx, sy + q(14));
        if(outras){
          ctx.font = fonte(600, 11);
          ctx.lineWidth = q(3); ctx.strokeText(outras, sx, sy + q(27));
          ctx.fillStyle = '#c9cbc4'; ctx.fillText(outras, sx, sy + q(27));
        }
        ocupa(sx, sy + q(outras ? 12 : 6), caixaW, caixaH);
      });
      /* (as sedes depois dos nomes: o nome do bairro manda no espaço) */
      /* as sedes: o ponto na cor da torcida e a sigla */
      for(const [tid, sig, x, y] of p.s){
        const [sx, sy] = paraTela(x, y);
        if(sx < -20 || sy < -20 || sx > larg + 20 || sy > alt + 20) continue;
        const cor = MB().corDe(tid), nossa = tid === meu;
        ctx.beginPath(); ctx.arc(sx, sy, nossa ? 7 : 5.5, 0, Math.PI * 2);
        ctx.fillStyle = cor; ctx.fill();
        ctx.lineWidth = nossa ? 3 : 1.5; ctx.strokeStyle = nossa ? '#d9a441' : (MB().claro(cor) ? '#444' : '#f2f2f2'); ctx.stroke();
        if(perto >= 1.4){
          ctx.font = fonte(700, 11);
          const t = _t('Sede {sigla}', {sigla:sig}), w = ctx.measureText(t).width + 8;
          if(livre(sx, sy + 15, w, 15)){
            ctx.fillStyle = 'rgba(20,22,21,.82)'; ctx.fillRect(sx - w / 2, sy + 8, w, 15);
            ctx.fillStyle = nossa ? '#ffe7a0' : '#f2f3ef'; ctx.fillText(t, sx, sy + 16);
            ocupa(sx, sy + 15, w, 15);
          }
        }
        ocupa(sx, sy, 14, 14);
      }
      /* estádios, equipamentos e marcos: os estádios sempre; o resto de perto */
      ctx.font = fonte(700, 12);
      for(const [t, x, y, tipo] of p.r){
        if(tipo !== 'e' || t.length < 3) continue;
        const estadio = t === t.toUpperCase();
        /* no celular, as etiquetas só de mais perto; a placa de estrada, só bem de perto */
        if(!estadio && perto < (pequeno ? 3 : 2.2)) continue;
        if(/^Estrada pra /.test(t) && perto < (pequeno ? 5 : 3.5)) continue;
        const [sx, y0] = paraTela(x, y);
        if(sx < -80 || sx > larg + 80 || y0 < -20 || y0 > alt + 20) continue;
        const w = ctx.measureText(t).width + 10;
        const sy = [0, 18, -18, 36, -36].map(dy => y0 + q(dy)).find(yy => livre(sx, yy, w, q(17)));
        if(sy === undefined) continue;
        ocupa(sx, sy, w, q(17));
        ctx.fillStyle = 'rgba(20,22,21,.8)'; ctx.fillRect(sx - w / 2, sy - q(9), w, q(18));
        ctx.fillStyle = '#f2f3ef'; ctx.fillText(t, sx, sy + 0.5);
      }
    }

    /* ---- o tamanho do quadro ---- */
    const ro = new ResizeObserver(() => {
      const r = caixa.getBoundingClientRect();
      if(!r.width || !r.height) return;
      const novo = !larg;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      larg = r.width; alt = r.height;
      cv.width = Math.round(larg * dpr); cv.height = Math.round(alt * dpr);
      if(novo && V){ limitar(); }
      if(!V) enquadrar();
      /* o bairro escolhido fora da tela (veio do quadro ou da lista): vai até ele */
      if(novo && opc.escolhido && opc.centrar){
        const pb = p.b[kDe(opc.escolhido)];
        if(pb && pb[3] != null){ V.x0 = pb[3] - larg / 2 / V.s; V.y0 = pb[4] - alt / 2 / V.s; limitar(); }
      }
      pedir();
    });
    ro.observe(caixa);

    /* ---- zoom ---- */
    function zoom(f, sx, sy){
      if(sx == null){ sx = larg / 2; sy = alt / 2; }
      const [x, y] = doMundo(sx, sy);
      V.s *= f; limitar();
      V.x0 = x - sx / V.s; V.y0 = y - sy / V.s; limitar();
      vistas.set(cid, V); pedir();
    }
    caixa.querySelector('.mb-planta-zoom').addEventListener('click', ev => {
      const z = ev.target.closest('[data-z]');
      if(!z) return;
      if(z.dataset.z === 'mais') zoom(1.5);
      else if(z.dataset.z === 'menos') zoom(1 / 1.5);
      else { enquadrar(); pedir(); }
    });
    cv.addEventListener('wheel', ev => {
      ev.preventDefault();
      const r = cv.getBoundingClientRect();
      zoom(Math.exp(-ev.deltaY * (ev.deltaMode === 1 ? 0.05 : 0.0018)), ev.clientX - r.left, ev.clientY - r.top);
    }, {passive:false});
    cv.addEventListener('dblclick', ev => { const r = cv.getBoundingClientRect(); zoom(2, ev.clientX - r.left, ev.clientY - r.top); });

    /* ---- arrastar, pinça e clique ---- */
    /* A PINÇA É DO MAPA, NÃO DA PÁGINA (02/10/2026): o Safari do iPhone
       não respeita o `touch-action: none` na pinça e ampliava a página
       inteira. Os gestos dele e o toque que arrasta param aqui; quem
       move e aproxima são os ponteiros, logo abaixo. */
    const pare = ev => { if(ev.cancelable) ev.preventDefault(); };
    for(const t of ['gesturestart', 'gesturechange', 'gestureend']) caixa.addEventListener(t, pare);
    cv.addEventListener('touchstart', pare, {passive:false});
    cv.addEventListener('touchmove', pare, {passive:false});
    const dica = caixa.querySelector('.mb-planta-dica');
    if(dicaVista && toque) dica.hidden = true;
    let ultimoToque = null;
    const dedos = new Map();
    let arrasto = null;
    cv.addEventListener('pointerdown', ev => {
      if(toque && !dicaVista){ dicaVista = true; dica.hidden = true; }
      /* o toque duplo aproxima (no celular o dblclick não vem) */
      if(ev.pointerType === 'touch'){
        const r0 = cv.getBoundingClientRect(), x = ev.clientX - r0.left, y = ev.clientY - r0.top, agora = Date.now();
        if(ultimoToque && agora - ultimoToque.t < 320 && Math.hypot(x - ultimoToque.x, y - ultimoToque.y) < 30){
          ultimoToque = null; zoom(2, x, y); return;
        }
        ultimoToque = {t:agora, x, y};
      }
      cv.setPointerCapture(ev.pointerId);
      const r = cv.getBoundingClientRect();
      dedos.set(ev.pointerId, {x:ev.clientX - r.left, y:ev.clientY - r.top});
      if(dedos.size === 1) arrasto = {x:ev.clientX, y:ev.clientY, x0:V.x0, y0:V.y0, andou:0};
      else arrasto = null;
    });
    cv.addEventListener('pointermove', ev => {
      const r = cv.getBoundingClientRect(), sx = ev.clientX - r.left, sy = ev.clientY - r.top;
      if(dedos.has(ev.pointerId)){
        if(dedos.size === 2){
          const [a, b] = [...dedos.values()];
          const antes = Math.hypot(a.x - b.x, a.y - b.y);
          dedos.set(ev.pointerId, {x:sx, y:sy});
          const [c, dd] = [...dedos.values()];
          const depois = Math.hypot(c.x - dd.x, c.y - dd.y);
          if(antes > 10) zoom(depois / antes, (c.x + dd.x) / 2, (c.y + dd.y) / 2);
          return;
        }
        dedos.set(ev.pointerId, {x:sx, y:sy});
      }
      if(arrasto && dedos.size === 1){
        const dx = ev.clientX - arrasto.x, dy = ev.clientY - arrasto.y;
        arrasto.andou = Math.max(arrasto.andou, Math.hypot(dx, dy));
        if(arrasto.andou > 4){
          V.x0 = arrasto.x0 - dx / V.s; V.y0 = arrasto.y0 - dy / V.s; limitar();
          caixa.classList.add('arrastando'); pedir();
        }
        return;
      }
      const k = bairroEm(sx, sy);
      if(k !== sobre){ sobre = k; cv.style.cursor = k >= 0 ? 'pointer' : 'grab'; pedir(); }
    });
    const soltar = ev => {
      const foi = arrasto;
      dedos.delete(ev.pointerId);
      if(dedos.size === 0) arrasto = null;
      caixa.classList.remove('arrastando');
      vistas.set(cid, V);
      if(ev.type === 'pointerup' && foi && foi.andou <= 4){
        const r = cv.getBoundingClientRect();
        const sx = ev.clientX - r.left, sy = ev.clientY - r.top;
        /* o muro primeiro: o ponto é pequeno, o bairro é grande */
        if(opc.aoMuro && d.muros){
          let achou = null, dm = 11;
          for(const [bid, pos] of posMuros(cid)) pos.forEach((pt, i) => {
            const [px, py] = paraTela(pt[0], pt[1]), dd = Math.hypot(px - sx, py - sy);
            if(dd < dm){
              const m = (d.muros(e, cid, bid) || [])[i];
              if(m && (m.t || V.s / sFit() >= 1.6 || opc.escolhido === bid)){ dm = dd; achou = {b:bid, i}; }
            }
          });
          if(achou){ opc.aoMuro(achou.b, achou.i); return; }
        }
        const k = bairroEm(sx, sy);
        const b = k >= 0 ? deK[k] : null;
        if(b && opc.aoEscolher) opc.aoEscolher(b.id);
      }
    };
    cv.addEventListener('pointerup', soltar);
    cv.addEventListener('pointercancel', soltar);
    cv.addEventListener('pointerleave', () => { if(sobre >= 0 && !arrasto){ sobre = -1; pedir(); } });

    /* quando o painel some, o observador vai junto */
    caixa.desligar = () => ro.disconnect();
    return caixa;
  }

  return {tem, criar};
})();
