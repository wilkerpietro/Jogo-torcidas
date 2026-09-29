/* =========================================================
   O MAPA DA CIDADE NO JOGO 3D (28/09/2026)

   O dono: "Preciso que o mapa da cidade seja uma opção no menu lateral
   do jogo". O item "Mapa da cidade" da coluna de ícones (main.js, `NAV`:
   só existe com a cidade em 3D) abre a planta da praça inteira — o mesmo
   desenho do mapa da planta (as ruas, as quadras, as sedes, os bares na
   cor da torcida, os estádios, a praia, os rótulos) —, com a sede do
   jogador marcada e o ponto onde a câmera da cidade está, virado pra onde
   ela olha. Arrastar move o mapa e a roda aproxima (no cursor); o clique
   leva a câmera da cidade até lá e fecha o mapa. Enquanto ele está aberto
   o dia para, como num painel, e a cidade para de desenhar (ele cobre a
   tela). Esc, o × e o ícone de novo fecham.

   Quem desenha é a planta (`api.planta.pintarMapa`, index.html): o mapa
   do jogo é o mesmo da ferramenta, na mesma escala (1 m = M unidades; o
   y da planta é o z do cenário).
   ========================================================= */
export function criarMapaDaCidade(api) {
  const E = () => window.TO && TO.estado && TO.estado.E;
  const caixa = document.createElement('div');
  caixa.className = 'j3d-mapa'; caixa.hidden = true;
  caixa.setAttribute('role', 'dialog'); caixa.setAttribute('aria-label', 'Mapa da cidade');
  caixa.innerHTML = `
    <div class="j3d-mapa-barra"><b>Mapa da cidade</b><span class="j3d-mapa-onde"></span>
      <button class="j3d-mapa-x" type="button" aria-label="Fechar o mapa">Fechar ×</button></div>
    <div class="j3d-mapa-tela"><canvas></canvas>
      <div class="j3d-mapa-zoom"><button type="button" data-z="mais" aria-label="Aproximar">+</button><button type="button" data-z="menos" aria-label="Afastar">−</button><button type="button" data-z="tudo" aria-label="A cidade inteira">⤢</button></div>
      <p class="j3d-mapa-dica">Arraste pra mover · role pra aproximar · clique pra levar a câmera até lá</p>
      <p class="j3d-mapa-legenda"><i class="sede"></i>a sua sede <i class="cam"></i>onde a câmera está</p>
    </div>`;
  document.body.appendChild(caixa);
  const tela = caixa.querySelector('.j3d-mapa-tela'), cv = caixa.querySelector('canvas'), ctx = cv.getContext('2d');
  /* a vista: `s` px (de CSS) por unidade do mundo, a partir de (x0, y0) */
  const V = { x0: 0, y0: 0, s: 0.02 };
  let aberto = false, pedido = 0, dpr = 1;

  const limite = () => (api.planta.limite && api.planta.limite()) || { x0: 0, y0: 0, x1: 6000, y1: 6000 };
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

  /* ---- o desenho: a planta, e por cima a sede do jogador e a câmera ---- */
  function desenhar() {
    const w = Math.max(1, tela.clientWidth), h = Math.max(1, tela.clientHeight);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
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
      rotulo('A SUA SEDE', x, y - 38, (T && T.cor) || '#d4731c');
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
      rotulo('BAR QUEBRADO · ' + q.dias + (q.dias === 1 ? ' DIA' : ' DIAS'), x, y - 18, '#e0392b');
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

  /* ---- arrastar, clicar, rodar ---- */
  let arrasto = null;
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
    if (ev.type === 'pointerup' && !a.mexeu) irPara(...noMundo(ev.clientX, ev.clientY));
  };
  cv.addEventListener('pointerup', soltar);
  cv.addEventListener('pointercancel', soltar);
  cv.addEventListener('wheel', ev => { ev.preventDefault(); zoom(Math.exp(-Math.max(-120, Math.min(120, ev.deltaY)) * 0.0022), ev.clientX, ev.clientY); }, { passive: false });
  caixa.querySelector('.j3d-mapa-zoom').addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.z === 'tudo') { enquadrar(); pedir(); } else zoom(b.dataset.z === 'mais' ? 1.6 : 1 / 1.6);
  });
  caixa.querySelector('.j3d-mapa-x').onclick = () => fechar();
  addEventListener('keydown', ev => { if (aberto && ev.key === 'Escape') { ev.stopPropagation(); fechar(); } }, true);
  addEventListener('resize', () => pedir());

  /* O CLIQUE: a câmera da cidade voa até o ponto (de cima, um quarteirão
     na tela) e o mapa fecha */
  function irPara(x, y) {
    const C = api.cenario;
    fechar();
    if (C && C.voarPara) C.voarPara(x, y, 90 * api.M, 1.0);
  }

  function abrir() {
    if (aberto) return;
    const C = api.cenario;
    aberto = true; caixa.hidden = false;
    document.body.classList.add('j3d-mapa-aberto');
    caixa.querySelector('.j3d-mapa-onde').textContent = C && C.praca ? ' · a praça de ' + C.praca : '';
    marcarIcone(true);
    try { TO.tela.pausarTempo('mapa'); } catch (e) {}
    /* a primeira vez (e a cada praça nova), a cidade inteira; depois, onde estava */
    if (!V.praca || V.praca !== (C && C.praca)) { V.praca = C && C.praca; enquadrar(); }
    desenhar();
  }
  function fechar() {
    if (!aberto) return;
    aberto = false; caixa.hidden = true; arrasto = null;
    document.body.classList.remove('j3d-mapa-aberto');
    marcarIcone(false);
    try { TO.tela.retomarTempo('mapa'); } catch (e) {}
  }
  function marcarIcone(v) { for (const b of document.querySelectorAll('.mapa-ic[data-pag="mapa3d"], .nav-item[data-pag="mapa3d"]')) b.classList.toggle('aceso', v); }
  return { abrir, fechar, alternar: () => (aberto ? fechar() : abrir()), get aberto() { return aberto; },
           /* pro teste: a vista e o desenho de agora */
           get vista() { return { ...V }; }, desenhar, noMundo, naTela };
}
