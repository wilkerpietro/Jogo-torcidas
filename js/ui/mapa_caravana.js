/* =========================================================
   O MAPA DA CARAVANA (pedido do dono, 10/10/2026: "mostrando abaixo o
   mapa do Brasil com a rota traçada pelos pontos onde a caravana vai
   passar, quando clica em iniciar percorre a viagem e se houver alguma
   hostilidade durante o itinerário gera um balão em cima da praça no
   mapa").

   Um pedaço do Brasil enquadrado na rota do dia: o contorno, as praças
   da estrada ligadas por uma linha, a praça do jogo em destaque e o
   ônibus andando de uma praça pra outra. Em casa a rota é uma praça só
   e o ônibus fica nela. O balão é HTML por cima do desenho, ancorado
   na praça: quem monta o conteúdo é o itinerário (main.js, itnCartao).

   `criar({rota, destino})` devolve:
     el                    — o nó (a caixa do mapa)
     viajar(i, aoChegar)   — anda o ônibus até a praça i da rota
     indice                — onde o ônibus está (inteiro)
     fim                   — o índice da última praça
     indiceDe(cid)         — a posição de uma praça na rota (-1 sem ela)
     balao(cid, nodo)      — abre o balão em cima da praça
     fecharBalao()
     novaRota(lista)       — troca a rota (a volta), com o ônibus no começo
   ========================================================= */
window.TO = window.TO || {};

TO.mapaCaravana = (function(){
  const SVG = 'http://www.w3.org/2000/svg';
  const MB = () => TO.mapaBrasil;
  const sv = (tag, at) => { const x = document.createElementNS(SVG, tag); for(const k in at) x.setAttribute(k, at[k]); return x; };
  const nome = cid => (MB() && MB().nomeCidade) ? MB().nomeCidade(cid) : cid;
  /* quanto a animação anda: um trecho de estrada em ~0,8 s, no 1× */
  const MS_POR_TRECHO = 800;
  const vel = () => (TO.diaJogo && TO.diaJogo.ponte && TO.diaJogo.ponte.velocidade) || 1;

  /* o quadro: a caixa das praças da rota, com folga, em 4:3 (o balão
     cabe em cima ou embaixo da praça) */
  function quadro(pts){
    let x0 = Math.min(...pts.map(p=>p[0])), x1 = Math.max(...pts.map(p=>p[0]));
    let y0 = Math.min(...pts.map(p=>p[1])), y1 = Math.max(...pts.map(p=>p[1]));
    const MIN = 100;          // ~1.000 km de largura no mínimo: dá a escala do país
    let w = Math.max(MIN, (x1 - x0) * 1.35 + 24), h = Math.max(MIN * 3/4, (y1 - y0) * 1.35 + 24);
    if(w / h < 4/3) w = h * 4/3; else h = w * 3/4;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return {x: cx - w/2, y: cy - h/2, w, h};
  }

  /* o balão em cima de um ponto do mapa (x, y em % da caixa); abre pro
     lado com mais espaço e, se ainda sobrar, a caixa abre margem e
     empurra o resto do cartão — nada fica cortado */
  function balaoEm(caixa, camada, x, y, nodo){
    const b = document.createElement('div');
    const lado = x < 28 ? ' esq' : x > 72 ? ' dir' : '';
    b.className = 'mc-balao' + (y < 50 ? ' abaixo' : ' acima') + lado;
    b.style.left = x.toFixed(2) + '%'; b.style.top = y.toFixed(2) + '%';
    b.appendChild(nodo);
    camada.appendChild(b);
    caixa.classList.add('com-balao');
    requestAnimationFrame(()=>{
      if(!b.isConnected) return;
      const H = caixa.clientHeight, h = b.offsetHeight + 14, py = y / 100 * H;
      const cimaCabe = py >= h, baixoCabe = H - py >= h;
      const abaixo = baixoCabe ? (!cimaCabe || y < 50) : (cimaCabe ? false : (H - py) >= py);
      b.className = 'mc-balao' + (abaixo ? ' abaixo' : ' acima') + lado;
      const sobra = abaixo ? h - (H - py) : h - py;
      caixa.style.marginBottom = abaixo && sobra > 0 ? (sobra + 8) + 'px' : '';
      caixa.style.marginTop = !abaixo && sobra > 0 ? (sobra + 8) + 'px' : '';
    });
    return b;
  }
  /* anda um marcador de `de` até `alvo` (posições contínuas numa linha),
     chamando `pintar(pos)` a cada quadro; devolve o cancelador */
  function animar(caixa, de, alvo, msPorTrecho, pintar, aoChegar){
    const dur = Math.abs(alvo - de) * msPorTrecho / vel();
    const t0 = performance.now();
    let id = 0;
    caixa.classList.add('andando');
    const quadroA = agora => {
      const f = Math.min(1, (agora - t0) / dur);
      const e = f < 0.5 ? 2*f*f : 1 - Math.pow(-2*f + 2, 2) / 2;
      pintar(de + (alvo - de) * e);
      if(f < 1 && caixa.isConnected) id = requestAnimationFrame(quadroA);
      else { pintar(alvo); caixa.classList.remove('andando'); if(aoChegar) aoChegar(); }
    };
    id = requestAnimationFrame(quadroA);
    return () => cancelAnimationFrame(id);
  }

  function criar(opc){
    opc = opc || {};
    let rota = (opc.rota || []).filter(c => MB() && MB().pontoDaPraca(c));
    if(!rota.length && opc.destino) rota = [opc.destino];
    const caixa = document.createElement('div');
    caixa.className = 'mc-mapa';
    if(!rota.length || !MB()){ caixa.classList.add('vazio'); return {el:caixa, viajar:(i, f)=>f && f(), indice:0, fim:0, indiceDe:()=>-1, balao:()=>null, fecharBalao(){}, novaRota(){}}; }

    let pts = rota.map(c => MB().pontoDaPraca(c));
    const vb = quadro(pts);
    const k = vb.w / 100;          // a unidade do desenho: 1% da largura
    const svg = sv('svg', {viewBox:`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`,
                           class:'mc-svg', role:'img', 'aria-label':_t('Mapa da caravana')});
    svg.appendChild(sv('rect', {x:vb.x, y:vb.y, width:vb.w, height:vb.h, class:'mc-mar'}));
    const cont = MB().contornoNoPlano();
    svg.appendChild(sv('path', {d:'M' + cont.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L') + 'Z',
                                class:'mc-pais', 'stroke-width':(k*0.35).toFixed(2)}));
    /* as outras praças do jogo, apagadas: dão a escala do país */
    for(const cid of Object.keys(MB().PRACAS || {})){
      if(rota.includes(cid)) continue;
      const p = MB().pontoDaPraca(cid);
      if(p[0] < vb.x || p[0] > vb.x + vb.w || p[1] < vb.y || p[1] > vb.y + vb.h) continue;
      svg.appendChild(sv('circle', {cx:p[0].toFixed(1), cy:p[1].toFixed(1), r:(k*0.55).toFixed(2), class:'mc-outra'}));
    }
    const gLinha = sv('g', {});
    svg.appendChild(gLinha);
    const gPracas = sv('g', {});
    svg.appendChild(gPracas);
    const onibus = sv('g', {class:'mc-onibus'});
    onibus.appendChild(sv('circle', {r:(k*2.4).toFixed(2), class:'mc-onibus-halo'}));
    onibus.appendChild(sv('circle', {r:(k*1.35).toFixed(2), class:'mc-onibus-ponto', 'stroke-width':(k*0.35).toFixed(2)}));
    svg.appendChild(onibus);
    caixa.appendChild(svg);
    const camada = document.createElement('div');
    camada.className = 'mc-baloes';
    caixa.appendChild(camada);

    let linhaBase = null, linhaFeita = null;
    let pos = 0;               // posição contínua do ônibus na rota (0..fim)
    let anim = 0;
    const ponto = t => {
      const i = Math.max(0, Math.min(pts.length - 1, Math.floor(t)));
      const j = Math.min(pts.length - 1, i + 1), f = t - i;
      return [pts[i][0] + (pts[j][0] - pts[i][0]) * f, pts[i][1] + (pts[j][1] - pts[i][1]) * f];
    };
    function pintarRota(){
      gLinha.innerHTML = ''; gPracas.innerHTML = '';
      if(pts.length > 1){
        const d = pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
        linhaBase = sv('polyline', {points:d, class:'mc-rota', 'stroke-width':(k*0.7).toFixed(2),
                                    'stroke-dasharray':`${(k*1.6).toFixed(2)} ${(k*1.1).toFixed(2)}`});
        linhaFeita = sv('polyline', {points:'', class:'mc-rota-feita', 'stroke-width':(k*0.9).toFixed(2)});
        gLinha.append(linhaBase, linhaFeita);
      }
      rota.forEach((cid, i) => {
        const p = pts[i], ponta = i === 0 || i === rota.length - 1;
        const g = sv('g', {class:'mc-praca' + (i === rota.length - 1 ? ' destino' : i === 0 ? ' origem' : '')});
        g.appendChild(sv('circle', {cx:p[0].toFixed(1), cy:p[1].toFixed(1), r:(k*(ponta ? 1.25 : 0.9)).toFixed(2),
                                    'stroke-width':(k*0.3).toFixed(2)}));
        const t = sv('text', {x:(p[0] + k*1.8).toFixed(1), y:(p[1] + k*0.9).toFixed(1),
                              'font-size':(k*(ponta ? 2.9 : 2.4)).toFixed(2), 'stroke-width':(k*0.55).toFixed(2)});
        t.textContent = nome(cid);
        g.appendChild(t);
        gPracas.appendChild(g);
      });
    }
    function pintarOnibus(){
      const p = ponto(pos);
      onibus.setAttribute('transform', `translate(${p[0].toFixed(2)},${p[1].toFixed(2)})`);
      if(linhaFeita){
        const feitos = pts.slice(0, Math.floor(pos) + 1).concat([p]);
        linhaFeita.setAttribute('points', feitos.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' '));
      }
    }
    pintarRota(); pintarOnibus();

    const api = {
      el: caixa,
      get indice(){ return Math.round(pos); },
      get fim(){ return pts.length - 1; },
      indiceDe: cid => rota.indexOf(cid),
      viajar(i, aoChegar){
        cancelAnimationFrame(anim);
        const alvo = Math.max(0, Math.min(pts.length - 1, i));
        if(!caixa.isConnected || Math.abs(alvo - pos) < 1e-3){ pos = alvo; pintarOnibus(); if(aoChegar) aoChegar(); return; }
        const de = pos, dur = Math.abs(alvo - de) * MS_POR_TRECHO / vel();
        const t0 = performance.now();
        caixa.classList.add('andando');
        const quadroA = agora => {
          const f = Math.min(1, (agora - t0) / dur);
          const e = f < 0.5 ? 2*f*f : 1 - Math.pow(-2*f + 2, 2) / 2;
          pos = de + (alvo - de) * e;
          pintarOnibus();
          if(f < 1 && caixa.isConnected) anim = requestAnimationFrame(quadroA);
          else { pos = alvo; pintarOnibus(); caixa.classList.remove('andando'); if(aoChegar) aoChegar(); }
        };
        anim = requestAnimationFrame(quadroA);
      },
      /* o balão em cima da praça; abre pra baixo quando a praça está
         no alto do mapa, e encosta na borda quando está no canto */
      balao(cid, nodo){
        api.fecharBalao();
        let p = MB().pontoDaPraca(cid);
        if(!p) p = ponto(pos);
        return balaoEm(caixa, camada, (p[0] - vb.x) / vb.w * 100, (p[1] - vb.y) / vb.h * 100, nodo);
      },
      fecharBalao(){ camada.innerHTML = ''; caixa.classList.remove('com-balao'); caixa.style.marginBottom = ''; caixa.style.marginTop = ''; },
      novaRota(lista){
        cancelAnimationFrame(anim);
        const ok = (lista || []).filter(c => MB().pontoDaPraca(c));
        if(!ok.length) return;
        rota = ok; pts = rota.map(c => MB().pontoDaPraca(c)); pos = 0;
        pintarRota(); pintarOnibus();
      }
    };
    return api;
  }

  /* =======================================================
     O TRAJETO NA CIDADE (pedido do dono, 10/10/2026: "volte a mostrar o
     mapa da cidade 2d pra utilizar como passo dois do itinerário"): a
     planta 2D da praça (img/mapas/<id>.webp), enquadrada no caminho do
     ponto de partida — a nossa sede, a sede da aliada que nos recebe,
     a nossa subsede ou uma entrada da praça — até o estádio. O ônibus
     anda na linha; o ataque cai nela: no começo é na concentração, no
     meio é na pista, no fim é nos arredores.

     `criarTrecho({cid, de:{x, y, rot}, ate:{x, y, rot}})` devolve o mesmo
     molde do mapa da caravana, com `indiceDoPonto(ponto)`, `balaoNo(i,
     nodo)` e `inverter()` (a volta, do estádio pro ponto de partida).
     ======================================================= */
  const PARTES = 100;                      // a linha em cem passos iguais
  const PONTO_NA_LINHA = {concentracao:20, pista:50, arredores:80};
  const IMG = c => (window.__EMBUTIDOS && window.__EMBUTIDOS[c]) || c;

  /* =======================================================
     AS RUAS DA PLANTA (pedido do dono, 10/10/2026: "faça o traçado da
     rota percorrer somente ruas"). A planta é uma imagem assada do 3D,
     sem o grafo das ruas — mas o asfalto dela é um cinza só (≈ 85,85,85).
     A grade de ruas sai da própria imagem: célula de 6 px, rua quando a
     maior parte das amostras dela é asfalto. O caminho é um A* nessa
     grade (8 vizinhos), com o fora-da-rua caríssimo — ele só atravessa
     um vão quando não há outro jeito (a faixa de pedestre, o portão).
     Guardada por praça; a imagem é a mesma que o mapa mostra.
     ======================================================= */
  const CEL_RUA = 6;
  const gradesRua = new Map();
  const asfalto = (r, g, b) => r >= 66 && r <= 104 && Math.max(r, g, b) - Math.min(r, g, b) <= 9;
  function gradeDeRuas(cid, P, pronta){
    if(gradesRua.has(cid)){ const G = gradesRua.get(cid); if(G.ok) pronta(G); else G.esperam.push(pronta); return; }
    const G = {ok:false, esperam:[pronta]};
    gradesRua.set(cid, G);
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => {
      try{
        const w = im.naturalWidth, h = im.naturalHeight;
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const c2 = cv.getContext('2d', {willReadFrequently:true});
        c2.drawImage(im, 0, 0);
        const px = c2.getImageData(0, 0, w, h).data;
        const nx = Math.floor(w / CEL_RUA), ny = Math.floor(h / CEL_RUA);
        const rua = new Uint8Array(nx * ny);
        for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++){
          let n = 0;
          for(const dy of [1, 3, 5]) for(const dx of [1, 3, 5]){
            const o = ((j * CEL_RUA + dy) * w + (i * CEL_RUA + dx)) * 4;
            if(asfalto(px[o], px[o + 1], px[o + 2])) n++;
          }
          rua[j * nx + i] = n >= 5 ? 1 : 0;
        }
        Object.assign(G, {ok:true, nx, ny, rua, w, h, L:P.L});
      }catch(err){ G.falhou = true; G.ok = true; }
      for(const f of G.esperam.splice(0)) f(G);
    };
    im.onerror = () => { G.falhou = true; G.ok = true; for(const f of G.esperam.splice(0)) f(G); };
    im.src = IMG('img/mapas/' + cid + '.webp');
  }
  /* do mundo pra célula e de volta */
  const celDe = (G, x, y) => [Math.max(0, Math.min(G.nx - 1, Math.floor((x - G.L.x0) / (G.L.x1 - G.L.x0) * G.w / CEL_RUA))),
                              Math.max(0, Math.min(G.ny - 1, Math.floor((y - G.L.y0) / (G.L.y1 - G.L.y0) * G.h / CEL_RUA)))];
  const mundoDe = (G, i, j) => [G.L.x0 + (i + 0.5) * CEL_RUA / G.w * (G.L.x1 - G.L.x0),
                                G.L.y0 + (j + 0.5) * CEL_RUA / G.h * (G.L.y1 - G.L.y0)];
  /* a rua mais perto de um ponto (a sede, o estádio ficam dentro de quadra) */
  function ruaMaisPerto(G, i0, j0){
    if(G.rua[j0 * G.nx + i0]) return [i0, j0];
    for(let r = 1; r < 80; r++){
      let melhor = null, dm = Infinity;
      for(let j = j0 - r; j <= j0 + r; j++) for(let i = i0 - r; i <= i0 + r; i++){
        if(i < 0 || j < 0 || i >= G.nx || j >= G.ny) continue;
        if(Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r || !G.rua[j * G.nx + i]) continue;
        const d = (i - i0) ** 2 + (j - j0) ** 2;
        if(d < dm){ dm = d; melhor = [i, j]; }
      }
      if(melhor) return melhor;
    }
    return [i0, j0];
  }
  /* o A*: custo 1 na rua (√2 na diagonal), 40 fora dela */
  function caminhoPelasRuas(G, A, B){
    if(!G || G.falhou || !G.rua) return null;
    const [ai, aj] = ruaMaisPerto(G, ...celDe(G, A[0], A[1]));
    const [bi, bj] = ruaMaisPerto(G, ...celDe(G, B[0], B[1]));
    const nx = G.nx, N = nx * G.ny, ini = aj * nx + ai, fim = bj * nx + bi;
    const custo = new Float32Array(N).fill(Infinity), de = new Int32Array(N).fill(-1), feito = new Uint8Array(N);
    const heap = [], push = (f, n) => { heap.push([f, n]); let c = heap.length - 1; while(c > 0){ const p = (c - 1) >> 1; if(heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
    const pop = () => { const t = heap[0], u = heap.pop(); if(heap.length){ heap[0] = u; let c = 0; for(;;){ const l = 2*c + 1, r = l + 1; let m = c; if(l < heap.length && heap[l][0] < heap[m][0]) m = l; if(r < heap.length && heap[r][0] < heap[m][0]) m = r; if(m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return t; };
    const h = n => Math.hypot(n % nx - bi, Math.floor(n / nx) - bj);
    custo[ini] = 0; push(h(ini), ini);
    const VIZ = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
    let passos = 0;
    while(heap.length && passos++ < 400000){
      const [, n] = pop();
      if(feito[n]) continue;
      feito[n] = 1;
      if(n === fim) break;
      const i = n % nx, j = (n - i) / nx;
      for(const [dx, dy, c] of VIZ){
        const ii = i + dx, jj = j + dy;
        if(ii < 0 || jj < 0 || ii >= nx || jj >= G.ny) continue;
        const m = jj * nx + ii;
        if(feito[m]) continue;
        const v = custo[n] + c * (G.rua[m] ? 1 : 40);
        if(v < custo[m]){ custo[m] = v; de[m] = n; push(v + h(m), m); }
      }
    }
    if(de[fim] < 0 && fim !== ini) return null;
    const cels = [];
    for(let n = fim; n >= 0; n = n === ini ? -1 : de[n]) cels.push(n);
    cels.reverse();
    /* só as quinas: os trechos retos viram um segmento */
    const pts = [A.slice()];
    let ant = null;
    cels.forEach((n, k) => {
      const i = n % nx, j = (n - i) / nx;
      const nxt = cels[k + 1];
      const dir = nxt != null ? [(nxt % nx) - i, Math.floor(nxt / nx) - j].join(',') : null;
      if(k === 0 || k === cels.length - 1 || dir !== ant) pts.push(mundoDe(G, i, j));
      ant = dir;
    });
    pts.push(B.slice());
    return pts;
  }
  /* a linha em `n` passos de mesmo comprimento: o ônibus anda igual em
     qualquer trecho, e os pontos do caminho caem no lugar certo */
  function reamostrar(linha, n){
    const acum = [0];
    for(let i = 1; i < linha.length; i++) acum.push(acum[i - 1] + Math.hypot(linha[i][0] - linha[i - 1][0], linha[i][1] - linha[i - 1][1]));
    const tot = acum[acum.length - 1] || 1, out = [];
    let s = 0;
    for(let k = 0; k <= n; k++){
      const alvo = tot * k / n;
      while(s < linha.length - 2 && acum[s + 1] < alvo) s++;
      const f = (alvo - acum[s]) / ((acum[s + 1] - acum[s]) || 1);
      out.push([linha[s][0] + (linha[s + 1][0] - linha[s][0]) * f, linha[s][1] + (linha[s + 1][1] - linha[s][1]) * f]);
    }
    return out;
  }
  function criarTrecho(opc){
    opc = opc || {};
    const P = TO.dados && TO.dados.plantas && TO.dados.plantas[opc.cid];
    const caixa = document.createElement('div');
    caixa.className = 'mc-mapa mc-cidade';
    if(!P || !opc.de || !opc.ate){ caixa.classList.add('vazio'); return null; }
    const L = P.L;
    let A = [opc.de.x, opc.de.y], B = [opc.ate.x, opc.ate.y];
    let rotA = opc.de.rot || '', rotB = opc.ate.rot || '';
    /* o quadro: o caminho com folga, em 4:3, nunca menor que um terço da cidade */
    const minW = (L.x1 - L.x0) * 0.34;
    let w = Math.max(minW, Math.abs(B[0] - A[0]) * 1.5 + minW * 0.25);
    let h = Math.max(minW * 3/4, Math.abs(B[1] - A[1]) * 1.5 + minW * 0.2);
    if(w / h < 4/3) w = h * 4/3; else h = w * 3/4;
    const vb = {x:(A[0] + B[0]) / 2 - w/2, y:(A[1] + B[1]) / 2 - h/2, w, h};
    /* o quadro fica dentro da planta: sem faixa preta fora da cidade */
    const dentro = (v, tam, a0, a1) => tam >= a1 - a0 ? a0 + (a1 - a0 - tam) / 2 : Math.max(a0, Math.min(a1 - tam, v));
    vb.x = dentro(vb.x, vb.w, L.x0, L.x1); vb.y = dentro(vb.y, vb.h, L.y0, L.y1);
    const k = vb.w / 100;
    const svg = sv('svg', {viewBox:`${vb.x.toFixed(0)} ${vb.y.toFixed(0)} ${vb.w.toFixed(0)} ${vb.h.toFixed(0)}`,
                           class:'mc-svg', role:'img', 'aria-label':_t('Trajeto na cidade')});
    svg.appendChild(sv('rect', {x:vb.x, y:vb.y, width:vb.w, height:vb.h, fill:'#121512'}));
    const im = sv('image', {x:L.x0, y:L.y0, width:L.x1 - L.x0, height:L.y1 - L.y0, preserveAspectRatio:'none'});
    im.setAttribute('href', IMG('img/mapas/' + opc.cid + '.webp'));
    svg.appendChild(im);
    svg.appendChild(sv('rect', {x:vb.x, y:vb.y, width:vb.w, height:vb.h, fill:'#000', opacity:'.25'}));
    const gLinha = sv('g', {}), gPontas = sv('g', {});
    svg.append(gLinha, gPontas);
    const onibus = sv('g', {class:'mc-onibus'});
    onibus.appendChild(sv('circle', {r:(k*2.2).toFixed(1), class:'mc-onibus-halo'}));
    onibus.appendChild(sv('circle', {r:(k*1.25).toFixed(1), class:'mc-onibus-ponto', 'stroke-width':(k*0.3).toFixed(1)}));
    svg.appendChild(onibus);
    caixa.appendChild(svg);
    const camada = document.createElement('div');
    camada.className = 'mc-baloes';
    caixa.appendChild(camada);

    let pts = [], pos = 0, parar = null, linhaFeita = null;
    /* o caminho pelas ruas (null enquanto a grade não sai): a linha de
       quinas, de A pra B; na volta, invertida */
    let caminho = null, pronto = false, esperando = null;
    const ponto = t => {
      const i = Math.max(0, Math.min(pts.length - 1, Math.floor(t)));
      const j = Math.min(pts.length - 1, i + 1), f = t - i;
      return [pts[i][0] + (pts[j][0] - pts[i][0]) * f, pts[i][1] + (pts[j][1] - pts[i][1]) * f];
    };
    function pintar(){
      gLinha.innerHTML = ''; gPontas.innerHTML = '';
      /* pelas ruas; sem a grade ainda (ou sem caminho), a reta */
      const linha = caminho || [A, B];
      pts = reamostrar(linha, PARTES);
      const d = linha.map(p=>p[0].toFixed(0)+','+p[1].toFixed(0)).join(' ');
      gLinha.appendChild(sv('polyline', {points:d, class:'mc-rota', 'stroke-width':(k*0.8).toFixed(1),
        'stroke-dasharray':`${(k*1.8).toFixed(1)} ${(k*1.2).toFixed(1)}`}));
      linhaFeita = sv('polyline', {points:'', class:'mc-rota-feita', 'stroke-width':(k*1).toFixed(1)});
      gLinha.appendChild(linhaFeita);
      /* os três pontos do caminho, miúdos */
      for(const [rot, i] of [[_t('Concentração'), PONTO_NA_LINHA.concentracao], [_t('Pista'), PONTO_NA_LINHA.pista], [_t('Arredores'), PONTO_NA_LINHA.arredores]]){
        const q = pts[i];
        gPontas.appendChild(sv('circle', {cx:q[0].toFixed(0), cy:q[1].toFixed(0), r:(k*0.6).toFixed(1), class:'mc-marco'}));
        const t = sv('text', {x:q[0].toFixed(0), y:(q[1] + k*3.2).toFixed(0), class:'mc-marco-rot', 'text-anchor':'middle',
                              'font-size':(k*2).toFixed(1), 'stroke-width':(k*0.45).toFixed(1)});
        t.textContent = rot; gPontas.appendChild(t);
      }
      const ponta = (q, rot, cls) => {
        const g = sv('g', {class:'mc-praca ' + cls});
        g.appendChild(sv('circle', {cx:q[0].toFixed(0), cy:q[1].toFixed(0), r:(k*1.4).toFixed(1), 'stroke-width':(k*0.3).toFixed(1)}));
        /* perto da borda direita, o nome vira pra dentro do mapa */
        const naDireita = (q[0] - vb.x) / vb.w > 0.62;
        const t = sv('text', {x:(q[0] + (naDireita ? -k*2 : k*2)).toFixed(0), y:(q[1] + k*1).toFixed(0), 'text-anchor': naDireita ? 'end' : 'start',
                              'font-size':(k*2.8).toFixed(1), 'stroke-width':(k*0.6).toFixed(1)});
        t.textContent = rot; g.appendChild(t);
        gPontas.appendChild(g);
      };
      ponta(pts[0], rotA, 'origem'); ponta(pts[pts.length - 1], rotB, 'destino');
    }
    function pintarOnibus(){
      const p = ponto(pos);
      onibus.setAttribute('transform', `translate(${p[0].toFixed(0)},${p[1].toFixed(0)})`);
      const feitos = pts.slice(0, Math.floor(pos) + 1).concat([p]);
      linhaFeita.setAttribute('points', feitos.map(q=>q[0].toFixed(0)+','+q[1].toFixed(0)).join(' '));
    }
    pintar(); pintarOnibus();
    /* a grade de ruas sai da imagem; com ela, a linha refaz pelas ruas.
       Quem pedir pra andar antes espera (no máximo 3 s, e aí vai na reta) */
    const ficarPronto = () => { if(pronto) return; pronto = true; pintar(); pintarOnibus(); if(esperando){ const f = esperando; esperando = null; f(); } };
    gradeDeRuas(opc.cid, P, G => { caminho = caminhoPelasRuas(G, A, B); ficarPronto(); });
    setTimeout(ficarPronto, 3000);
    const api = {
      el: caixa,
      get indice(){ return Math.round(pos); },
      get fim(){ return PARTES; },
      indiceDoPonto: pt => PONTO_NA_LINHA[pt] != null ? PONTO_NA_LINHA[pt] : PARTES,
      viajar(i, aoChegar){
        if(!pronto){ esperando = () => api.viajar(i, aoChegar); return; }
        if(parar) parar();
        const alvo = Math.max(0, Math.min(PARTES, i));
        if(!caixa.isConnected || Math.abs(alvo - pos) < 1e-3){ pos = alvo; pintarOnibus(); if(aoChegar) aoChegar(); return; }
        /* a cidade é mais curta que a estrada: o trecho anda mais rápido */
        parar = animar(caixa, pos, alvo, 26, x => { pos = x; pintarOnibus(); }, aoChegar);
      },
      balaoNo(i, nodo){
        api.fecharBalao();
        const q = ponto(i);
        return balaoEm(caixa, camada, (q[0] - vb.x) / vb.w * 100, (q[1] - vb.y) / vb.h * 100, nodo);
      },
      fecharBalao(){ camada.innerHTML = ''; caixa.classList.remove('com-balao'); caixa.style.marginBottom = ''; caixa.style.marginTop = ''; },
      /* a volta: do estádio pro ponto de partida */
      inverter(){
        if(parar) parar();
        [A, B] = [B, A]; [rotA, rotB] = [rotB, rotA]; pos = 0;
        if(caminho) caminho = caminho.slice().reverse();
        pintar(); pintarOnibus();
      }
    };
    return api;
  }

  return {criar, criarTrecho};
})();
