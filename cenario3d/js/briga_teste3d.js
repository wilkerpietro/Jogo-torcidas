/* =========================================================
   A BRIGA DE TESTE NA CIDADE 3D (24/11/2026)

   O dono, depois do vídeo do jogo de rua à noite: "aproveite as ruas do
   mapa antigo 3d pra fazer os cenários, por enquanto fora a parte do jogo
   oficial pra testarmos". A página de teste (cidade3d.html) é a cidade 3D
   antiga com o jogo de hoje por cima; este painel, no canto, abre uma
   briga de rua numa rua sorteada da praça da torcida — a mesma briga do
   jogo (os três comandos, a PM que separa), com o palco à noite
   (palco_briga.js). Escolhe-se o tamanho de cada bonde e dia ou noite.

   A rua: sorteia-se um poste da praça (poste é sempre na calçada), o
   asfalto mais perto dele, e a direção da rua (o lado em que dá pra andar
   26 m sem sair da rua). O rival é uma torcida da mesma cidade (a hostil,
   se tiver).
   ========================================================= */
const $ = id => document.getElementById(id);

function montarPainel() {
  if ($('brigaTeste')) return;
  const p = document.createElement('div');
  p.id = 'brigaTeste';
  p.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:9000;display:flex;gap:6px;align-items:center;' +
    'background:rgba(10,10,12,.88);border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:8px 10px;' +
    'font:12px "IBM Plex Mono",monospace;color:#ddd';
  p.innerHTML = '<b style="color:#e0b040">TESTE</b>' +
    '<label>bonde <select id="btTam"><option>10</option><option selected>30</option><option>60</option><option>120</option></select></label>' +
    '<label><input type="checkbox" id="btNoite"> noite</label>' +
    '<button id="btBriga" style="font:inherit;padding:5px 10px;cursor:pointer;background:#9e2a22;color:#fff;border:0;border-radius:3px">Briga de teste</button>' +
    '<span id="btAviso" style="color:#d9a441"></span>';
  document.body.appendChild(p);
  let noite = true;
  try { noite = localStorage.getItem('briga3d-dia') !== '1'; } catch (e) {}
  $('btNoite').checked = noite;
  $('btNoite').onchange = ev => { try { localStorage.setItem('briga3d-dia', ev.target.checked ? '0' : '1'); } catch (e) {} };
  $('btBriga').onclick = () => { const r = abrir(+$('btTam').value || 30); $('btAviso').textContent = r === true ? '' : r; };
}

/* a rua sorteada: { nos, eles, bairro } no mundo, ou null */
function ruaSorteada(P, M) {
  const postes = P.luzesDaRua ? P.luzesDaRua() : [];
  if (!postes.length) return null;
  const asfalto = (x, z) => P.ehAsfalto ? P.ehAsfalto(x, z) : P.naRuaOuCalcada(x, z);
  for (let t = 0; t < 60; t++) {
    const p = postes[Math.floor(Math.random() * postes.length)];
    let a = null;
    for (let r = 1; r <= 8 && !a; r++) for (let k = 0; k < 8 && !a; k++) {
      const ang = k * Math.PI / 4, x = p.x + Math.cos(ang) * r * M, z = p.z + Math.sin(ang) * r * M;
      if (asfalto(x, z)) a = { x, z };
    }
    if (!a) continue;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - 0.5);
    for (const [ux, uz] of dirs) {
      let ok = true;
      for (let q = 1; q <= 10 && ok; q++) if (!P.naRuaOuCalcada(a.x + ux * q * 2.6 * M, a.z + uz * q * 2.6 * M)) ok = false;
      if (!ok) continue;
      const b = { x: a.x + ux * 26 * M, z: a.z + uz * 26 * M };
      let bairro = 'na praça';
      try { const bb = P.bairroEm ? P.bairroEm(a.x, a.z) : null; bairro = (bb && (bb.nome || bb)) || bairro; } catch (e) {}
      return { nos: a, eles: b, bairro: String(bairro) };
    }
  }
  return null;
}

function abrir(n) {
  const e = TO.estado && TO.estado.E;
  if (!e) return 'comece ou carregue um jogo primeiro';
  if (document.body.classList.contains('palco-briga')) return 'já tem briga aberta';
  const C = TO.jogo3d && TO.jogo3d.api && TO.jogo3d.api.cenario;
  if (!C || C.montando || !C.vida || !C.vida.contextoDoDia) return 'a cidade ainda está montando';
  const ctx = C.vida.contextoDoDia();
  const rua = ruaSorteada(ctx.P, ctx.M);
  if (!rua) return 'não achei rua pra briga';
  const fila = (e.membros || []).filter(TO.membros.disponivel).slice(0, n);
  if (!fila.length) return 'sem membro disponível';
  const daCidade = TO.mundo.jogaveis().filter(o => o.id !== e.torcida.id && o.mapa === e.torcida.mapa);
  const hostil = daCidade.find(o => TO.relacoes && TO.relacoes.valor && TO.relacoes.valor(e, o.id) <= -40);
  const riv = hostil || daCidade[0] || TO.mundo.jogaveis().find(o => o.id !== e.torcida.id);
  if (TO.tela.pausarTempo) TO.tela.pausarTempo('briga de teste');
  const ok = TO.tela.abrirBrigaLivre({ rivalId: riv.id, escalacao: fila, deles: n, ruaLivre: { nos: rua.nos, eles: rua.eles, bairro: rua.bairro } });
  return ok ? true : 'a briga não abriu';
}

/* espera o jogo e a cidade */
const vigia = setInterval(() => {
  if (window.TO && TO.estado && TO.jogo3d && TO.tela && TO.tela.abrirBrigaLivre) { clearInterval(vigia); montarPainel(); }
}, 1000);
