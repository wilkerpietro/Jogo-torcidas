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
        const x = (p[0] - vb.x) / vb.w * 100, y = (p[1] - vb.y) / vb.h * 100;
        const b = document.createElement('div');
        b.className = 'mc-balao' + (y < 52 ? ' abaixo' : ' acima') +
                      (x < 28 ? ' esq' : x > 72 ? ' dir' : '');
        b.style.left = x.toFixed(2) + '%'; b.style.top = y.toFixed(2) + '%';
        b.appendChild(nodo);
        camada.appendChild(b);
        caixa.classList.add('com-balao');
        return b;
      },
      fecharBalao(){ camada.innerHTML = ''; caixa.classList.remove('com-balao'); },
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

  return {criar};
})();
