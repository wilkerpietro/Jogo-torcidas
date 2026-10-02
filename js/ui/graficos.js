/* =========================================================
   OS GRÁFICOS DO JOGO 3D (o dono, 30/09/2026: "crie mecanismos de
   melhorar o FPS em computadores fracos, em um menu de configuração de
   gráfico"; ele joga sem placa de vídeo, a 4 ou 5 fps na sala do
   presidente).

   O painel mexe nas opções de gráfico do cenário 3D
   (ferramentas/planta_html/cenario.js, `graficos`, com as medidas de
   quanto cada uma rende). Cada opção vale na hora e a cidade continua
   desenhando atrás — o painel não cobre a tela, então o fps que muda é o
   que se vê no alto do painel. Enquanto ele está aberto, o relógio do
   jogo para (mexer em gráfico não é deixar o dia correr).

   Abre pelo ícone da coluna (main.js, `graficos`), pelas Configurações
   do menu principal e pelo clique no medidor de fps. Só existe no jogo
   3D: no jogo de feed não há cidade pra desenhar.
   ========================================================= */
window.TO = window.TO || {};

TO.graficos = (function(){
  let raiz = null, relogio = 0;
  const G = ()=> TO.jogo3d && TO.jogo3d.graficos;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));

  /* as predefinições (os nomes das do cenário) */
  const PREDEFS = ()=>[['minima', _t('Mínima')], ['leve', _t('Leve')], ['normal', _t('Normal')], ['alta', _t('Alta')]];
  /* as opções, na ordem do painel: a chave do cenário, o rótulo, os valores
     (com o rótulo de cada um) e a nota. `so`: só aparece quando vale */
  const OPCOES = ()=>[
    {k:'resolucao', rot:_t('Resolução da imagem'),
     vals:[['auto', _t('Automática')], [1, '100%'], [0.85, '85%'], [0.7, '70%'], [0.5, '50%'], [0.35, '35%']],
     nota:_t('É o que mais pesa sem placa de vídeo: menos resolução deixa a imagem borrada e o jogo muito mais leve. A automática desce e sobe sozinha atrás do fps escolhido embaixo.')},
    {k:'alvo', rot:_t('A automática mira em'), so:o=>o.resolucao === 'auto',
     vals:[[20, '20 fps'], [30, '30 fps'], [45, '45 fps'], [60, '60 fps']]},
    {k:'suavizar', rot:_t('Suavizar as bordas'),
     vals:[['auto', _t('Automático')], ['sim', _t('Sim')], ['nao', _t('Não')]],
     nota:_t('Tira o serrilhado das bordas; sem placa de vídeo custa caro (o automático desliga). Só vale quando o jogo abrir de novo.')},
    {k:'fpsMax', rot:_t('Limite de fps'),
     vals:[[0, _t('Sem limite')], [60, '60'], [30, '30']],
     nota:_t('Não aumenta o fps: deixa o processador livre pro resto do jogo e esquenta menos o computador.')},
    {k:'luz', rot:_t('Iluminação'),
     vals:[['completa', _t('Completa')], ['simples', _t('Simples')]],
     nota:_t('A simples faz a conta da luz nos cantos de cada face, e não em cada pixel: nas paredes e no chão fica igual. Ganho pequeno, uns 6 a 10%.')},
    {k:'luzes', rot:_t('Luzes da noite'),
     vals:[[true, _t('Acesas')], [false, _t('Apagadas')]],
     nota:_t('Os postes, os refletores, as janelas e os cômodos acesos. Apagadas, a noite fica só escura (uns 10% mais leve).')},
    {k:'distancia', rot:_t('Distância de visão'),
     vals:[[1, _t('Longe')], [0.7, _t('Média')], [0.45, _t('Perto')]],
     nota:_t('Com a câmera longe (a cidade vista de cima), a névoa chega antes e menos quarteirões são desenhados.')},
    {k:'gente', rot:_t('Gente na rua'),
     vals:[[1, _t('Muita')], [0.65, _t('Média')], [0.35, _t('Pouca')]]},
    {k:'bonecos', rot:_t('Bonecos'),
     vals:[['normal', _t('Detalhados')], ['leve', _t('Leves')]],
     nota:_t('Leves: todo mundo com o modelo de longe, menos o seu líder.')},
    {k:'texturas', rot:_t('Texturas'),
     vals:[['alta', _t('Alta')], ['normal', _t('Normal')], ['leve', _t('Leve')], ['minima', _t('Mínima')]],
     nota:_t('O chão, os letreiros e a nitidez deles vistos de lado. Trocar monta a cidade de novo.')},
    {k:'medidor', rot:_t('Medidor de fps'),
     vals:[[true, _t('Mostrar')], [false, _t('Esconder')]]}
  ];
  const nomeDaPredef = p => (PREDEFS().find(x=>x[0] === p) || [p, _t('Personalizada')])[1];

  /* o que se mede agora, no alto do painel */
  function pintarMedida(){
    const g = G(), cx = raiz && raiz.querySelector('.j3d-graf-medida');
    if(!g || !cx) return;
    const s = g.estado;
    const fps = s.fps ? Math.round(s.fps) : '—';
    const cls = !s.fps ? '' : s.fps >= 50 ? 'bom' : s.fps >= 28 ? 'meio' : 'ruim';
    let h = `<b class="${cls}">${fps}</b> fps`+
      (s.ms ? ` · ${s.ms.toFixed(0)} ms` : '')+
      ` · ${_t('{p}% da resolução', {p:Math.round(s.escala*100)})} <small>(${s.largura} × ${s.altura} px)</small>`;
    if(s.pausado) h += `<small>${_t('(a cidade está parada atrás de outra tela)')}</small>`;
    if(s.semPlaca) h += `<small class="aviso">${_t('Sem placa de vídeo: o navegador desenha no processador ({placa}).', {placa:esc(s.placa || '?')})}</small>`;
    cx.innerHTML = h;
  }

  function pintar(){
    const g = G();
    if(!raiz || !g) return;
    const o = g.opcoes, s = g.estado, rec = g.recomendada;
    const corpo = raiz.querySelector('.j3d-graf-corpo');
    const topo = corpo.scrollTop;
    let h = `<div class="j3d-graf-bloco"><div class="j3d-graf-rot">${_t('Predefinição')}`+
      (o.predef === 'pessoal' ? ` <em>${_t('Personalizada')}</em>` : '')+`</div><div class="j3d-graf-bts">`+
      PREDEFS().map(([id, nome])=>`<button type="button" data-predef="${id}" aria-pressed="${o.predef === id}">${nome}</button>`).join('')+
      `</div><div class="j3d-graf-nota">${_t('Recomendada pra este computador: {p}.', {p:nomeDaPredef(rec)})} `+
      `${_t('Quando a textura muda junto, a cidade monta de novo.')}</div></div>`;
    for(const op of OPCOES()){
      if(op.so && !op.so(o)) continue;
      h += `<div class="j3d-graf-bloco"><div class="j3d-graf-rot">${op.rot}</div><div class="j3d-graf-bts">`+
        op.vals.map(([v, r])=>`<button type="button" data-k="${op.k}" data-v='${JSON.stringify(v)}' aria-pressed="${o[op.k] === v}">${r}</button>`).join('')+
        `</div>`;
      let nota = op.nota || '';
      if(op.k === 'suavizar' && s.suavizando !== s.suavizarPedido)
        nota = `<b>${s.suavizarPedido ? _t('Liga quando o jogo abrir de novo (recarregue a página).') : _t('Desliga quando o jogo abrir de novo (recarregue a página).')}</b> ` + nota;
      if(nota) h += `<div class="j3d-graf-nota">${nota}</div>`;
      h += `</div>`;
    }
    corpo.innerHTML = h;
    corpo.scrollTop = topo;
    pintarMedida();
  }

  function abrir(){
    const g = G();
    if(!g) return;
    if(raiz){ pintar(); return; }
    /* um painel do jogo aberto fecha (os dois não cabem lado a lado) */
    if(document.body.classList.contains('com-painel') && TO.tela && TO.tela.fecharPainel) TO.tela.fecharPainel();
    raiz = document.createElement('aside');
    raiz.className = 'j3d-graf';
    raiz.setAttribute('role', 'dialog');
    raiz.setAttribute('aria-label', _t('Gráficos'));
    raiz.innerHTML = `<header><h2>${_t('Gráficos')}</h2><button type="button" class="j3d-graf-x" aria-label="${_t('Fechar')}">×</button></header>`+
      `<p class="j3d-graf-medida"></p><div class="j3d-graf-corpo"></div>`+
      `<footer><button type="button" class="bt j3d-graf-rec">${_t('Voltar ao recomendado')}</button>`+
      `<button type="button" class="bt destaque j3d-graf-fechar">${_t('Fechar')}</button></footer>`;
    document.body.appendChild(raiz);
    raiz.addEventListener('click', ev=>{
      const b = ev.target.closest('button');
      if(!b) return;
      const g = G();
      if(b.classList.contains('j3d-graf-x') || b.classList.contains('j3d-graf-fechar')){ fechar(); return; }
      if(!g) return;
      if(b.classList.contains('j3d-graf-rec')) g.predefinir(g.recomendada);
      else if(b.dataset.predef) g.predefinir(b.dataset.predef);
      else if(b.dataset.k){ let v; try{ v = JSON.parse(b.dataset.v); }catch(e){ return; } g.definir({[b.dataset.k]: v}); }
      pintar();
    });
    /* o relógio do jogo para enquanto ele está aberto */
    if(TO.tela && TO.tela.pausarTempo) TO.tela.pausarTempo('graficos');
    pintar();
    relogio = setInterval(pintarMedida, 500);
    document.addEventListener('keydown', teclaEsc, true);
  }
  function teclaEsc(ev){ if(ev.key === 'Escape' && raiz){ ev.stopPropagation(); fechar(); } }
  function fechar(){
    if(!raiz) return;
    clearInterval(relogio); relogio = 0;
    document.removeEventListener('keydown', teclaEsc, true);
    raiz.remove(); raiz = null;
    if(TO.tela && TO.tela.retomarTempo) TO.tela.retomarTempo('graficos');
  }

  return {
    abrir, fechar,
    alternar(){ if(raiz) fechar(); else abrir(); },
    get aberto(){ return !!raiz; },
    /* se o jogo tem os gráficos (a cidade em 3D) */
    get existe(){ return !!G(); }
  };
})();
