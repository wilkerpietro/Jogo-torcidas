/* =========================================================
   O MAPA DO JOGO 3D (28/09/2026; os bairros e o Brasil, 30/09/2026)

   O dono: "Preciso que o mapa da cidade seja uma opção no menu lateral
   do jogo". O item "Mapa" da coluna de ícones (main.js, `NAV`: só existe
   com a cidade em 3D) abre a planta da praça inteira — o mesmo desenho
   do mapa da planta (as ruas, as quadras, as sedes, os bares na cor da
   torcida, os estádios, a praia, os rótulos) —, com a sede do jogador
   marcada e o ponto onde a câmera da cidade está, virado pra onde ela
   olha. Arrastar move o mapa e a roda aproxima (no cursor). Enquanto ele
   está aberto o dia para, como num painel, e a cidade para de desenhar
   (ele cobre a tela). Esc, o × e o ícone de novo fecham.

   OS BAIRROS (o dono, 30/09/2026: "Em cada bairro vai apontar qual
   torcida comanda, e a torcida que comandar mais bairros domina a
   cidade"): cada bairro da planta sai na cor da torcida dona (mais forte
   quanto maior a barra dela), cinza quando ninguém passa de 50%, com a
   sigla e a barra embaixo do nome. O clique escolhe o bairro e o cartão
   ao lado conta quem manda, a barra de 0 a 100, o que tem nele e a ação
   social; dois cliques levam a câmera da cidade até lá.

   O BRASIL ("quando clicamos em menu>mapa vai ter a opção do mapa do
   Brasil, onde podemos ver os mapas 2d de qualquer cidade"): a aba
   Brasil mostra o país com as praças na cor de quem domina cada uma
   (js/ui/mapa_brasil.js). Escolhida outra praça, a planta monta a de lá
   uma vez e guarda (`pracaGuardada`: a cidade 3D não é remontada); cada
   desenho põe a de lá só enquanto pinta, então o arrasto e o zoom são os
   da daqui, com os rótulos no tamanho de sempre (01/10/2026: antes era
   uma imagem esticada, com os nomes miúdos). As praças de fora do Brasil
   não têm planta: delas sai o quadro dos bairros.

   Quem desenha é a planta (`api.planta.pintarMapa`, index.html): o mapa
   do jogo é o mesmo da ferramenta, na mesma escala (1 m = M unidades; o
   y da planta é o z do cenário).
   ========================================================= */
export function criarMapaDaCidade(api) {
  const E = () => window.TO && TO.estado && TO.estado.E;
  const D = () => window.TO && TO.dominio;
  const MB = () => window.TO && TO.mapaBrasil;
  const T_ = (s, p) => (typeof window._t === 'function' ? window._t(s, p) : String(s).replace(/\{(\w+)\}/g, (m, k) => p && p[k] != null ? p[k] : m));
  const slug = n => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '-');
  const caixa = document.createElement('div');
  caixa.className = 'j3d-mapa'; caixa.hidden = true;
  caixa.setAttribute('role', 'dialog'); caixa.setAttribute('aria-label', T_('Mapa'));
  caixa.innerHTML = `
    <div class="j3d-mapa-barra"><b>${T_('Mapa')}</b>
      <div class="j3d-mapa-abas" role="tablist">
        <button type="button" role="tab" data-aba="cidade" aria-selected="true">${T_('Cidade')}</button>
        <button type="button" role="tab" data-aba="brasil" aria-selected="false">${T_('Brasil')}</button>
      </div>
      <span class="j3d-mapa-onde"></span>
      <button class="j3d-mapa-x" type="button" aria-label="${T_('Fechar o mapa')}">${T_('Fechar')} ×</button></div>
    <div class="j3d-mapa-corpo">
      <div class="j3d-mapa-tela"><canvas></canvas>
        <div class="j3d-mapa-zoom"><button type="button" data-z="mais" aria-label="${T_('Aproximar')}">+</button><button type="button" data-z="menos" aria-label="${T_('Afastar')}">−</button><button type="button" data-z="tudo" aria-label="${T_('A cidade inteira')}">⤢</button></div>
        <p class="j3d-mapa-dica">${T_('Arraste pra mover · role pra aproximar · clique num bairro pra ver quem manda · dois cliques levam a câmera até lá')}</p>
        <p class="j3d-mapa-legenda"><i class="sede"></i>${T_('a sua sede')} <i class="cam"></i>${T_('onde a câmera está')}</p>
        <p class="j3d-mapa-espera" hidden></p>
      </div>
      <div class="j3d-mapa-painel" hidden></div>
      <aside class="j3d-mapa-lado"></aside>
    </div>`;
  document.body.appendChild(caixa);
  const tela = caixa.querySelector('.j3d-mapa-tela'), cv = caixa.querySelector('canvas'), ctx = cv.getContext('2d');
  const painel = caixa.querySelector('.j3d-mapa-painel'), lado = caixa.querySelector('.j3d-mapa-lado');
  const espera = caixa.querySelector('.j3d-mapa-espera');
  /* a vista: `s` px (de CSS) por unidade do mundo, a partir de (x0, y0) */
  const V = { x0: 0, y0: 0, s: 0.02 };
  let aberto = false, pedido = 0, dpr = 1;
  /* o que está na tela: a aba, a praça (o id dos dados), a de OUTRA cidade
     (a praça guardada da planta) e o bairro escolhido; as praças já
     montadas ficam guardadas enquanto o mapa está aberto (as 4 últimas) */
  let aba = 'cidade', cid = null, outra = null, bairroSel = null;
  const guardadas = new Map();
  const cidDoCenario = () => { const C = api.cenario; return C && C.praca ? slug(C.praca) : (E() && E().torcida ? E().torcida.mapa : null); };

  const limite = () => outra ? outra.L : ((api.planta.limite && api.planta.limite()) || { x0: 0, y0: 0, x1: 6000, y1: 6000 });
  function enquadrar() {
    const L = limite(), w = tela.clientWidth || 800, h = tela.clientHeight || 600;
    V.s = Math.min(w / (L.x1 - L.x0), h / (L.y1 - L.y0)) * 0.96;
    V.x0 = (L.x0 + L.x1) / 2 - w / 2 / V.s; V.y0 = (L.y0 + L.y1) / 2 - h / 2 / V.s;
  }
  const noMundo = (sx, sy) => { const r = cv.getBoundingClientRect(); return [V.x0 + (sx - r.left) / V.s, V.y0 + (sy - r.top) / V.s]; };
  const naTela = (x, y) => [(x - V.x0) * V.s, (y - V.y0) * V.s];
  /* aproxima (f > 1) com o ponto (sx, sy) da tela parado no lugar */
  function zoom(f, sx, sy) {
    const r = cv.getBoundingClientRect();
    if (sx == null) { sx = r.left + r.width / 2; sy = r.top + r.height / 2; }
    const [x, y] = noMundo(sx, sy), L = limite(), sMin = Math.min(r.width / (L.x1 - L.x0), r.height / (L.y1 - L.y0)) * 0.5;
    V.s = Math.min(1.2, Math.max(sMin, V.s * f));
    V.x0 = x - (sx - r.left) / V.s; V.y0 = y - (sy - r.top) / V.s;
    pedir();
  }
  function pedir() { if (!pedido && aberto) pedido = requestAnimationFrame(() => { pedido = 0; desenhar(); }); }

  /* ---- AS CORES DOS BAIRROS: a da dona, mais forte com a barra maior ---- */
  function corDoBairro(bid) {
    const d = D(), e = E(), mb = MB();
    if (!d || !e || !cid) return null;
    const ps = d.partes(e, cid, bid), dono = ps.length && ps[0].v > d.DOMINA ? ps[0].t : null, sel = bid === bairroSel;
    if (!dono) return { cor: '#8f8f8a', alfa: sel ? 0.4 : 0.16, sel };
    const a = 0.22 + 0.3 * Math.max(0, ps[0].v - d.DOMINA) / (100 - d.DOMINA);
    return { cor: mb ? mb.corDe(dono) : '#d4731c', alfa: sel ? Math.min(0.8, a + 0.3) : a, sel };
  }
  function rotuloDoBairro(bid) {
    const d = D(), e = E();
    if (!d || !e || !cid) return null;
    const ps = d.partes(e, cid, bid);
    return ps.length && ps[0].v > d.DOMINA ? d.siglaDe(ps[0].t) + ' ' + Math.round(ps[0].v) + '%' : T_('EM DISPUTA');
  }
  /* O DONO DE CADA MURO DE PIXAÇÃO (06/10/2026): o quadradinho do muro no
     mapa sai na cor da torcida que pixou (o save); o livre, branco */
  function donoDoMuro(bid, i) {
    const d = D(), e = E(), mb = MB();
    if (!d || !e || !cid || !d.muros) return null;
    const m = (d.muros(e, cid, bid) || [])[i];
    return m && m.t ? (mb ? mb.corDe(m.t) : '#d4731c') : null;
  }
  function ligarCores(v) {
    if (!api.planta.coresDosBairros) return;
    api.planta.coresDosBairros(v ? corDoBairro : null);
    api.planta.rotuloDoBairro(v ? rotuloDoBairro : null);
    if (api.planta.donosDosMuros) api.planta.donosDosMuros(v ? donoDoMuro : null);
    if (api.planta.camadaBairros) api.planta.camadaBairros(true);
  }
  /* o bairro de um ponto: na planta daqui, ou na guardada da outra */
  function bairroNoPonto(x, y) {
    if (!outra) return api.planta.bairroEm ? api.planta.bairroEm(x, y) : null;
    return outra.g.com(p => (p.bairroEm ? p.bairroEm(x, y) : null));
  }

  /* ---- o desenho: a planta, e por cima a sede do jogador e a câmera ---- */
  function desenhar() {
    const w = Math.max(1, tela.clientWidth), h = Math.max(1, tela.clientHeight);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    if (outra) {
      /* a outra praça: a planta de lá, posta só pra este desenho */
      try { outra.g.com(p => p.pintarMapa(ctx, V.x0, V.y0, V.s, dpr)); }
      catch (e) { console.error('mapa de outra praça:', e); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#222'; ctx.fillRect(0, 0, cv.width, cv.height); }
      return;
    }
    try { api.planta.pintarMapa(ctx, V.x0, V.y0, V.s, dpr); }
    catch (e) { console.error('mapa da cidade:', e); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#222'; ctx.fillRect(0, 0, cv.width, cv.height); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const e = E(), porta = e && e.torcida && api.sedeDe ? api.sedeDe(e.torcida.id) : null;
    const T = e && e.torcida && api.planta.torcidas ? api.planta.torcidas().find(t => t.id === e.torcida.id) : null;
    if (porta) {
      /* a sede do jogador: o alfinete na cor da torcida, com a estrela */
      const [x, y] = naTela(porta.x - porta.fx * 3 * api.M, porta.y - porta.fy * 3 * api.M);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
      ctx.fillStyle = (T && T.cor) || '#d4731c';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y - 22, 11, Math.PI * 0.72, Math.PI * 0.28); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.strokeStyle = (T && T.cor2) || '#fff'; ctx.stroke();
      estrela(x, y - 22, 6, (T && T.cor2) || '#fff');
      rotulo(T_('A SUA SEDE'), x, y - 38, (T && T.cor) || '#d4731c');
      ctx.restore();
    }
    /* OS BARES QUEBRADOS (vida3d.js; o estrago de 45 dias do bote no bar):
       o risco vermelho na porta e os dias que faltam pro conserto */
    const V3 = window.TO && TO.jogo3d && TO.jogo3d.vida;
    for (const q of (V3 && V3.baresQuebrados) || []) {
      if (!q.porta) continue;
      const [x, y] = naTela(q.porta.x, q.porta.y);
      ctx.save();
      ctx.strokeStyle = '#e0392b'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6); ctx.stroke();
      rotulo(T_('BAR QUEBRADO · {n} DIAS', { n: q.dias }).replace(/ 1 DIAS$/, ' 1 DIA'), x, y - 18, '#e0392b');
      ctx.restore();
    }
    const C = api.cenario;
    if (C && C.orb) {
      /* a câmera: o ponto que ela olha e o leque pra onde ela olha */
      const [x, y] = naTela(C.orb.alvo.x, C.orb.alvo.z), az = C.orb.az, fx = -Math.sin(az), fy = -Math.cos(az);
      const a = Math.atan2(fy, fx), abre = 0.55, R = 34;
      ctx.save();
      const g = ctx.createRadialGradient(x, y, 2, x, y, R);
      g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R, a - abre, a + abre); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }
  function estrela(x, y, r, cor) {
    ctx.fillStyle = cor; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    ctx.closePath(); ctx.fill();
  }
  function rotulo(txt, x, y, cor) {
    ctx.font = '700 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(txt).width + 12;
    ctx.fillStyle = 'rgba(12,12,14,.85)'; ctx.fillRect(x - w / 2, y - 9, w, 18);
    ctx.fillStyle = cor; ctx.fillRect(x - w / 2, y + 8, w, 2);
    ctx.fillStyle = '#fff'; ctx.fillText(txt, x, y + 0.5);
  }

  /* ---- O LADO: quem domina a cidade e o cartão do bairro ---- */
  let avisoLado = '';
  function pintarLado() {
    const mb = MB();
    lado.innerHTML = '';
    if (!mb || !cid) return;
    const h = document.createElement('h3');
    h.className = 'j3d-mapa-cidade';
    h.textContent = nomeDaCidade(cid);
    lado.appendChild(h);
    lado.appendChild(mb.legenda(cid));
    const daqui = !outra && cid === cidDoCenario();
    lado.appendChild(mb.cartaoDoBairro(cid, bairroSel, {
      aoIr: daqui && api.cenario && api.cenario.voarPara ? b => { const c = centroDoBairro(b.id); if (c) irPara(c.x, c.y); } : null,
      /* o muro da lista: a câmera vai até a parede dele, de frente */
      aoMuro: daqui && api.cenario && api.cenario.voarPara ? i => irProMuro(bairroSel, i) : null,
      aoMudar: () => { pintarLado(); pedir(); },
      aoAviso: t => { avisoLado = t; }
    }));
    if (avisoLado) { const p = document.createElement('p'); p.className = 'j3d-mapa-aviso'; p.textContent = avisoLado; lado.appendChild(p); avisoLado = ''; }
  }
  const nomeDaCidade = c => (MB() && MB().nomeCidade ? MB().nomeCidade(c) : ((window.TO && TO.mundo && TO.mundo.cidade(c)) || {}).nome || c);
  function centroDoBairro(bid) {
    const b = (api.planta.bairros ? api.planta.bairros() : []).find(x => x.id === bid);
    return b ? b.centro : null;
  }

  /* ---- A OUTRA PRAÇA: a planta monta a de lá uma vez e guarda ---- */
  function montarOutra(c) {
    if (guardadas.has(c)) { const o = guardadas.get(c); guardadas.delete(c); guardadas.set(c, o); return o; }
    const nome = api.pracaDe ? api.pracaDe(c) : null;
    if (!nome || !api.planta.pracaGuardada) return null;
    const g = api.planta.pracaGuardada(nome);
    if (!g) return null;
    const o = { cid: c, nome, g, L: g.com(p => ({ ...p.limite() })) };
    guardadas.set(c, o);
    while (guardadas.size > 4) guardadas.delete(guardadas.keys().next().value);
    return o;
  }
  /* escolhe a praça: a daqui (a planta viva), outra do Brasil (a planta
     guardada de lá) ou uma de fora (o quadro dos bairros) */
  function irParaCidade(c) {
    bairroSel = null; cid = c; aba = 'cidade';
    if (c === cidDoCenario()) { outra = null; mostrar(); enquadrar(); pedir(); return; }
    const temPlanta = !!(api.pracaDe && api.pracaDe(c));
    if (!temPlanta) { outra = null; mostrar('quadro'); return; }
    if (guardadas.has(c)) { outra = montarOutra(c); mostrar(); enquadrar(); pedir(); return; }
    espera.hidden = false; espera.textContent = T_('Montando o mapa de {cidade}…', { cidade: nomeDaCidade(c) });
    painel.hidden = true; tela.hidden = false;
    marcarAba();
    setTimeout(() => {
      try { outra = montarOutra(c); } catch (e) { console.error('mapa de outra praça:', e); outra = null; }
      espera.hidden = true;
      if (!outra) { mostrar('quadro'); return; }
      mostrar(); enquadrar(); pedir();
    }, 30);
  }
  function marcarAba() {
    for (const b of caixa.querySelectorAll('.j3d-mapa-abas [data-aba]')) b.setAttribute('aria-selected', String(b.dataset.aba === aba));
    caixa.querySelector('.j3d-mapa-onde').textContent = aba === 'brasil' ? T_('as praças do jogo')
      : outra ? T_('· a praça de {cidade} (só o mapa: a cidade 3D continua a de agora)', { cidade: nomeDaCidade(cid) })
      : (api.cenario && api.cenario.praca ? T_('· a praça de {cidade}', { cidade: api.cenario.praca }) : '');
  }
  /* o que aparece: a planta (a daqui ou a guardada da outra), o Brasil, ou
     o quadro dos bairros (a praça sem planta) */
  function mostrar(modo) {
    const mb = MB();
    marcarAba();
    if (aba === 'brasil' || modo === 'quadro') {
      tela.hidden = true; painel.hidden = false; painel.innerHTML = '';
      if (aba === 'brasil' && mb) {
        const m = document.createElement('div'); m.className = 'mb-mapa';
        m.appendChild(mb.svgDoBrasil({ aoEscolher: irParaCidade, escolhida: cid }));
        painel.appendChild(m);
        painel.appendChild(mb.listaDeCidades({ aoEscolher: irParaCidade, escolhida: cid }));
        painel.className = 'j3d-mapa-painel mb-corpo-brasil';
      } else if (mb) {
        painel.className = 'j3d-mapa-painel mb-corpo-quadro';
        const nota = document.createElement('p'); nota.className = 'j3d-mapa-nota';
        nota.textContent = T_('Esta praça não tem planta desenhada: os bairros dela aparecem por zona.');
        painel.appendChild(nota);
        painel.appendChild(mb.quadro(cid, { escolhido: bairroSel, aoEscolher: bid => { bairroSel = bid; mostrar('quadro'); } }));
      }
    } else { tela.hidden = false; painel.hidden = true; }
    pintarLado();
  }

  /* ---- arrastar, clicar, rodar ---- */
  let arrasto = null, ultimoClique = 0;
  cv.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    cv.setPointerCapture(ev.pointerId);
    arrasto = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, mexeu: false };
  });
  cv.addEventListener('pointermove', ev => {
    if (!arrasto || ev.pointerId !== arrasto.id) return;
    const dx = ev.clientX - arrasto.x, dy = ev.clientY - arrasto.y;
    arrasto.x = ev.clientX; arrasto.y = ev.clientY;
    if (Math.hypot(ev.clientX - arrasto.x0, ev.clientY - arrasto.y0) > 5) arrasto.mexeu = true;
    if (!arrasto.mexeu) return;
    V.x0 -= dx / V.s; V.y0 -= dy / V.s;
    cv.classList.add('arrastando');
    pedir();
  });
  const soltar = ev => {
    if (!arrasto || ev.pointerId !== arrasto.id) return;
    const a = arrasto; arrasto = null;
    cv.classList.remove('arrastando');
    if (ev.type !== 'pointerup' || a.mexeu) return;
    const [x, y] = noMundo(ev.clientX, ev.clientY), agora = performance.now();
    /* dois cliques (na planta daqui): a câmera vai até lá */
    if (!outra && agora - ultimoClique < 380) { ultimoClique = 0; irPara(x, y); return; }
    ultimoClique = agora;
    /* um clique: o bairro */
    bairroSel = bairroNoPonto(x, y);
    pintarLado(); pedir();
  };
  cv.addEventListener('pointerup', soltar);
  cv.addEventListener('pointercancel', soltar);
  cv.addEventListener('wheel', ev => { ev.preventDefault(); zoom(Math.exp(-Math.max(-120, Math.min(120, ev.deltaY)) * 0.0022), ev.clientX, ev.clientY); }, { passive: false });
  caixa.querySelector('.j3d-mapa-zoom').addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.z === 'tudo') { enquadrar(); pedir(); } else zoom(b.dataset.z === 'mais' ? 1.6 : 1 / 1.6);
  });
  for (const b of caixa.querySelectorAll('.j3d-mapa-abas [data-aba]')) b.onclick = () => {
    if (b.dataset.aba === 'cidade' && aba === 'brasil') { aba = 'cidade'; if (outra || cid === cidDoCenario()) { mostrar(); pedir(); } else irParaCidade(cid); return; }
    aba = b.dataset.aba; mostrar(); pedir();
  };
  caixa.querySelector('.j3d-mapa-x').onclick = () => fechar();
  addEventListener('keydown', ev => { if (aberto && ev.key === 'Escape') { ev.stopPropagation(); fechar(); } }, true);
  addEventListener('resize', () => pedir());

  /* OS DOIS CLIQUES: a câmera da cidade voa até o ponto (de cima, um
     quarteirão na tela) e o mapa fecha */
  function irPara(x, y) {
    const C = api.cenario;
    fechar();
    if (C && C.voarPara) C.voarPara(x, y, 90 * api.M, 1.0);
  }
  /* O MURO DE PIXAÇÃO na cidade: a câmera na frente da parede, a uns 9 m,
     olhando pra ela (o az da câmera é o da normal do muro) */
  function irProMuro(bid, i) {
    const C = api.cenario;
    const m = (api.planta.murosDePixo ? api.planta.murosDePixo() : []).find(x => x.b === bid && x.i === i);
    if (!m || !C || !C.voarPara) return;
    fechar();
    const L = m.lug, M = api.M;
    C.voarPara(L.x + L.ox * 1.2 * M, L.z + L.oz * 1.2 * M, 9 * M, 0.3, Math.atan2(L.ox, L.oz));
  }

  function abrir() {
    if (aberto) return;
    const C = api.cenario;
    aberto = true; caixa.hidden = false;
    document.body.classList.add('j3d-mapa-aberto');
    marcarIcone(true);
    try { TO.tela.pausarTempo('mapa'); } catch (e) {}
    ligarCores(true);
    /* abre na praça da cidade 3D; a primeira vez (e a cada praça nova), a
       cidade inteira; depois, onde estava */
    aba = 'cidade'; outra = null; cid = cidDoCenario();
    if (!V.praca || V.praca !== (C && C.praca)) { V.praca = C && C.praca; bairroSel = null; enquadrar(); }
    mostrar();
    desenhar();
  }
  function fechar() {
    if (!aberto) return;
    aberto = false; caixa.hidden = true; arrasto = null;
    /* a praça guardada vale enquanto o mapa está aberto (o tempo parado):
       fechado, a cidade 3D pode mudar e a de lá é montada de novo */
    outra = null; guardadas.clear();
    ligarCores(false);
    document.body.classList.remove('j3d-mapa-aberto');
    marcarIcone(false);
    try { TO.tela.retomarTempo('mapa'); } catch (e) {}
  }
  function marcarIcone(v) { for (const b of document.querySelectorAll('.mapa-ic[data-pag="mapa3d"], .nav-item[data-pag="mapa3d"]')) b.classList.toggle('aceso', v); }
  return { abrir, fechar, alternar: () => (aberto ? fechar() : abrir()), get aberto() { return aberto; },
           /* pro teste: a vista, a praça, o bairro escolhido e o desenho de agora */
           get vista() { return { ...V, aba, cid, outra: outra ? outra.cid : null, bairro: bairroSel }; },
           irParaCidade, escolherBairro: bid => { bairroSel = bid; pintarLado(); pedir(); },
           mostrarAba: a => { aba = a; mostrar(); pedir(); }, desenhar, noMundo, naTela };
}
