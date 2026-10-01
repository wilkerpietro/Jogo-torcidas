/* =========================================================
   O MAPA DO JOGO: O BRASIL E OS BAIRROS DE CADA CIDADE (o dono,
   30/09/2026: "quando clicamos em menu>mapa vai ter a opção do mapa do
   Brasil, onde podemos ver os mapas 2d de qualquer cidade. Em cada
   bairro vai apontar qual torcida comanda, e a torcida que comandar mais
   bairros domina a cidade").

   As peças que os dois jogos usam:
   · `svgDoBrasil`: o contorno do país com as 30 praças, cada uma na cor
     de quem domina a cidade (cinza: ninguém domina); o clique escolhe;
   · `legenda`: quem domina a cidade, quantos bairros cada torcida tem e o
     que isso rende (ou tira) por dia;
   · `cartaoDoBairro`: a barra de 0 a 100 do bairro, repartida entre as
     torcidas, o que tem nele (sede, bar, loja, subsede), o corte de 30%
     quando a dona é rival e a ação social;
   · `quadro`: os bairros da cidade em quatro zonas (a bússola), pro jogo
     de feed, que não tem a planta da cidade;
   · `abrir`: o painel inteiro do jogo de feed (o jogo 3D tem o dele, em
     ferramentas/planta_html/mapa3d.js, com a planta da cidade).
   O contorno é simplificado à mão (142 pontos) e as praças ficam na
   capital (ou na cidade-polo) de cada uma — é um mapa de escolher, não
   de medir.
   ========================================================= */
window.TO = window.TO || {};

TO.mapaBrasil = (function(){
  const D = () => TO.dominio;
  const E = () => TO.estado && TO.estado.E;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const SVG = 'http://www.w3.org/2000/svg';
  /* o contorno (lat, lon) e a praça de cada mapa do jogo (lat, lon) */
  const CONTORNO = [[4.3,-51.62],[3.6,-51.1],[2.5,-50.7],[1.7,-50],[0.95,-50.05],[0.05,-50.6],[-0.35,-49.7],[-0.15,-48.95],[-0.55,-48.4],[-1.1,-48.3],[-0.75,-47.6],[-0.8,-46.9],[-1.05,-46.1],[-1.35,-45.3],[-1.75,-44.7],[-2.4,-44.4],[-2.55,-43.6],[-2.8,-42.4],[-2.9,-41.6],[-2.9,-40.8],[-2.85,-40.1],[-3.3,-39.3],[-3.75,-38.45],[-4.4,-37.7],[-4.85,-37.1],[-5.05,-36.3],[-5.15,-35.6],[-5.6,-35.2],[-6.4,-35],[-7.15,-34.8],[-8.05,-34.85],[-8.9,-35.15],[-9.65,-35.7],[-10.5,-36.4],[-10.95,-37.05],[-11.9,-37.7],[-12.9,-38.35],[-13.6,-38.95],[-14.8,-39],[-15.9,-38.9],[-16.9,-39.15],[-17.9,-39.4],[-18.9,-39.7],[-19.7,-39.9],[-20.3,-40.25],[-21,-40.85],[-21.95,-41],[-22.55,-41.95],[-22.95,-42.1],[-23,-43.2],[-23.05,-44.2],[-23.4,-45],[-23.8,-45.6],[-24,-46.4],[-24.6,-47.2],[-25.3,-48.1],[-25.9,-48.5],[-26.7,-48.6],[-27.6,-48.55],[-28.4,-48.8],[-29.35,-49.7],[-30.3,-50.25],[-31.2,-50.85],[-32.05,-52.05],[-32.9,-52.6],[-33.75,-53.4],[-33.1,-53.5],[-32.55,-53.25],[-31.9,-54.2],[-31.35,-55],[-30.9,-55.55],[-30.2,-56.8],[-29.8,-57.1],[-29.1,-56.4],[-28.6,-55.9],[-27.9,-55.2],[-27.25,-53.8],[-26.6,-53.7],[-25.95,-53.85],[-25.55,-54.55],[-24.3,-54.3],[-23.95,-55.3],[-22.6,-55.7],[-22.25,-57.1],[-21.6,-57.95],[-20.2,-58.15],[-19.3,-57.7],[-18.1,-57.5],[-17.4,-58.4],[-16.3,-58.4],[-15.6,-60.2],[-14.4,-60.4],[-13.6,-61.5],[-12.9,-63.1],[-12.3,-64.4],[-11.8,-65.1],[-10.9,-65.35],[-10,-65.3],[-9.8,-66.6],[-10.6,-68],[-11,-68.8],[-10.95,-69.9],[-10,-70.6],[-9.45,-71.4],[-9.1,-72.6],[-8.2,-73.7],[-7.45,-74],[-6.6,-73.4],[-5.2,-72.9],[-4.4,-70.6],[-4.2,-69.95],[-3,-69.7],[-1.2,-69.45],[0,-70.05],[0.75,-69.8],[1.4,-69.5],[1.75,-68],[1.15,-66.9],[0.9,-66],[1.1,-65.3],[0.8,-64.2],[1.5,-64],[2.1,-63.4],[2.5,-64],[3.6,-64.1],[4.1,-63],[4.5,-62.3],[5.2,-60.75],[4.6,-60.1],[3.9,-59.6],[2.9,-59.95],[2,-59.8],[1.4,-58.8],[1.9,-57.2],[1.95,-56.4],[2.35,-55.9],[2.3,-54.8],[2.2,-54.1],[2.7,-53.5],[3.3,-52.7],[3.9,-51.9],[4.3,-51.62]];
  const PRACAS = {'abc-paulista':[-23.66,-46.53], 'alagoas':[-9.66,-35.73], 'bahia':[-12.97,-38.5], 'belem':[-1.46,-48.49], 'belo-horizonte':[-19.92,-43.94], 'brasilia':[-15.79,-47.88], 'curitiba':[-25.43,-49.27], 'fortaleza':[-3.73,-38.52], 'goiania':[-16.68,-49.25], 'interior-de-minas':[-18.91,-48.27], 'interior-de-pe':[-8.28,-35.97], 'interior-de-sc':[-27.1,-52.61], 'interior-de-sp':[-21.18,-47.81], 'interior-do-ce':[-7.21,-39.31], 'interior-do-pr':[-23.31,-51.16], 'interior-do-rs':[-29.17,-51.18], 'litoral-catarinense':[-26.92,-48.66], 'manaus':[-3.12,-60.02], 'maranhao':[-2.53,-44.3], 'mato-grosso':[-15.6,-56.1], 'paraiba':[-7.12,-34.86], 'porto-alegre':[-30.03,-51.23], 'recife':[-8.05,-34.88], 'regiao-de-campinas':[-22.91,-47.06], 'rio-de-janeiro':[-22.91,-43.17], 'rio-grande-do-norte':[-5.79,-35.21], 'santos':[-23.96,-46.33], 'sao-paulo':[-23.55,-46.63], 'sergipe':[-10.91,-37.07], 'suburbio-carioca':[-22.87,-43.35]};

  /* ---- as cores de cada torcida ---- */
  const torcida = id => {
    const e = E();
    if(e && e.torcida && e.torcida.id === id) return Object.assign({}, (TO.mundo && TO.mundo.torcida(id)) || {}, e.torcida);
    return (TO.mundo && TO.mundo.torcida(id)) || null;
  };
  function hsv(hex){
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if(!m) return null;
    const n = parseInt(m[1], 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return {s: mx ? (mx - mn) / mx : 0, v: mx};
  }
  /* a cor da torcida no mapa: a mais viva das cores dela (preto e branco
     todo mundo tem; o que separa uma da outra é a cor de verdade) */
  function corDe(id){
    const o = torcida(id);
    const lista = [...((o && o.cores) || []), o && o.detalhe].filter(Boolean).map(c => String(c).toUpperCase());
    if(!lista.length) return '#8E3F9C';
    let melhor = lista[0], nota = -1;
    for(const c of lista){ const h = hsv(c); if(!h) continue; const k = h.s * (0.35 + h.v); if(k > nota + 0.05){ nota = k; melhor = c; } }
    return nota < 0.15 ? lista[0] : melhor;
  }
  const claro = hex => { const h = hsv(hex); return !!h && h.v > 0.75 && h.s < 0.45; };
  const sigla = id => D() ? D().siglaDe(id) : id;
  const nome = id => (torcida(id) || {}).nome || id;
  /* seis praças vêm sem acento nos dados (a planilha); no mapa, com */
  const ACENTO = {belem:'Belém', brasilia:'Brasília', goiania:'Goiânia', paraiba:'Paraíba', 'sao-paulo':'São Paulo', 'suburbio-carioca':'Subúrbio Carioca'};
  const nomeCidade = cid => ACENTO[cid] || ((TO.mundo && TO.mundo.cidade && TO.mundo.cidade(cid)) || {}).nome || cid;
  const ehBrasil = cid => !!PRACAS[cid];

  /* =======================================================
     O BRASIL
     ======================================================= */
  const COS = Math.cos(15 * Math.PI / 180);
  const proj = (lat, lon) => [(lon + 75) * COS * 10, (6 - lat) * 10];
  function svgDoBrasil(opc){
    opc = opc || {};
    const e = E(), d = D(), minha = e && e.torcida ? e.torcida.mapa : null;
    const svg = document.createElementNS(SVG, 'svg');
    const pts = CONTORNO.map(([la, lo]) => proj(la, lo));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs) - 8, y0 = Math.min(...ys) - 8;
    const w = Math.max(...xs) - x0 + 100, h = Math.max(...ys) - y0 + 8;
    svg.setAttribute('viewBox', `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
    svg.setAttribute('class', 'mb-brasil');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', _t('Mapa do Brasil com as praças do jogo'));
    const el = (tag, at) => { const x = document.createElementNS(SVG, tag); for(const k in at) x.setAttribute(k, at[k]); return x; };
    svg.appendChild(el('path', {d:'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z', class:'mb-pais'}));
    /* as praças: a posição, e os rótulos sem encavalar (primeiro à direita,
       depois à esquerda, depois descendo) */
    const lista = Object.keys(PRACAS).filter(cid => !opc.so || opc.so.includes(cid)).map(cid => {
      const [x, y] = proj(PRACAS[cid][0], PRACAS[cid][1]);
      const pl = d && e ? d.placar(e, cid) : null;
      return {cid, x, y, dono: pl ? pl.dono : null, pl};
    }).sort((a, b) => a.y - b.y);
    /* os pontos também ocupam: nome nenhum passa por cima de ponto */
    const ocupado = lista.map(p => ({x0:p.x - 4.5, x1:p.x + 4.5, y0:p.y - 4.5, y1:p.y + 4.5}));
    const bate = r => ocupado.some(o => r.x0 < o.x1 && r.x1 > o.x0 && r.y0 < o.y1 && r.y1 > o.y0);
    for(const p of lista){
      const nomeP = nomeCidade(p.cid), larg = nomeP.length * 4.6 + 4;
      const minhaP = p.cid === minha;
      let pos = null;
      for(let k = 0; k < 8 && !pos; k++){
        const dy = [0, 0, 9, -9, 18, -18, 27, 36][k];
        for(const lado of [1, -1]){
          const x0r = lado > 0 ? p.x + 6 : p.x - 6 - larg, r = {x0:x0r, x1:x0r + larg, y0:p.y - 5 + dy, y1:p.y + 4 + dy};
          if(!bate(r)){ pos = {r, lado, dy}; break; }
        }
      }
      if(!pos) pos = {r:{x0:p.x + 6, x1:p.x + 6 + larg, y0:p.y - 5, y1:p.y + 4}, lado:1, dy:0};
      ocupado.push(pos.r);
      const g = el('g', {class:'mb-praca' + (minhaP ? ' minha' : '') + (opc.escolhida === p.cid ? ' escolhida' : ''), tabindex:'0', role:'button', 'data-cidade':p.cid});
      const cor = p.dono ? corDe(p.dono) : '#8a8a86';
      g.appendChild(el('circle', {cx:p.x.toFixed(1), cy:p.y.toFixed(1), r: minhaP ? 5.2 : 3.8, fill:cor, class:'mb-ponto' + (claro(cor) ? ' claro' : '')}));
      if(pos.dy) g.appendChild(el('line', {x1:p.x.toFixed(1), y1:p.y.toFixed(1), x2:(pos.lado > 0 ? pos.r.x0 : pos.r.x1).toFixed(1), y2:(p.y + pos.dy).toFixed(1), class:'mb-fio'}));
      const t = el('text', {x:(pos.lado > 0 ? pos.r.x0 + 1 : pos.r.x1 - 1).toFixed(1), y:(p.y + pos.dy + 3).toFixed(1), 'text-anchor': pos.lado > 0 ? 'start' : 'end', class:'mb-nome'});
      t.textContent = nomeP;
      g.appendChild(t);
      const tit = el('title', {});
      tit.textContent = nomeP + ' — ' + (p.dono ? _t('a {nome} domina ({n} de {total} bairros)', {nome:nome(p.dono), n:p.pl.n[p.dono], total:p.pl.total})
                                               : _t('ninguém domina'));
      g.appendChild(tit);
      const ir = () => opc.aoEscolher && opc.aoEscolher(p.cid);
      g.addEventListener('click', ir);
      g.addEventListener('keydown', ev => { if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); ir(); } });
      svg.appendChild(g);
    }
    return svg;
  }

  /* as praças de fora do Brasil, por país (as barras bravas), e as do
     Brasil por região — a lista ao lado do mapa */
  function listaDeCidades(opc){
    opc = opc || {};
    const e = E(), d = D(), minha = e && e.torcida ? e.torcida.mapa : null;
    const caixa = document.createElement('div');
    caixa.className = 'mb-lista';
    const grupos = new Map();
    for(const c of (TO.dados.cidades || [])){
      if(!(c.bairros || []).length || !(D() && D().torcidasDaCidade(c.id).length)) continue;
      const g = ehBrasil(c.id) ? _t('Brasil — {regiao}', {regiao:_t(c.regiao || '')}) : _t(c.regiao || c.uf || '');
      if(!grupos.has(g)) grupos.set(g, []);
      grupos.get(g).push(c);
    }
    const ordem = [...grupos.keys()].sort((a, b) => (b.indexOf(_t('Brasil')) === 0) - (a.indexOf(_t('Brasil')) === 0) || a.localeCompare(b));
    for(const g of ordem){
      const h = document.createElement('h4'); h.textContent = g; caixa.appendChild(h);
      const ul = document.createElement('div'); ul.className = 'mb-lista-grupo';
      for(const c of grupos.get(g).sort((a, b) => nomeCidade(a.id).localeCompare(nomeCidade(b.id)))){
        const pl = d && e ? d.placar(e, c.id) : null;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mb-lista-item' + (c.id === minha ? ' minha' : '') + (opc.escolhida === c.id ? ' escolhida' : '');
        const cor = pl && pl.dono ? corDe(pl.dono) : '#8a8a86';
        b.innerHTML = `<i style="background:${cor}"></i><span>${esc(nomeCidade(c.id))}</span><small>${pl && pl.dono ? esc(sigla(pl.dono)) : esc(_t('sem dona'))}</small>`;
        b.onclick = () => opc.aoEscolher && opc.aoEscolher(c.id);
        ul.appendChild(b);
      }
      caixa.appendChild(ul);
    }
    return caixa;
  }

  /* =======================================================
     A CIDADE: quem domina e quantos bairros cada uma tem
     ======================================================= */
  function legenda(cid){
    const caixa = document.createElement('div');
    caixa.className = 'mb-legenda';
    const d = D(), e = E();
    if(!d || !e) return caixa;
    const pl = d.placar(e, cid), meu = e.torcida.id, cidade = nomeCidade(cid);
    const topo = pl.ordem.length ? pl.n[pl.ordem[0]] : 0;
    const linha = pl.dono
      ? (pl.dono === meu ? _t('Dominamos {cidade}: {n} de {total} bairros.', {cidade, n:pl.n[pl.dono], total:pl.total})
                         : _t('A {nome} domina {cidade}: {n} de {total} bairros.', {nome:nome(pl.dono), cidade, n:pl.n[pl.dono], total:pl.total}))
      : topo ? _t('Ninguém domina {cidade}: empate no topo, com {n} bairros.', {cidade, n:topo})
             : _t('Ninguém domina {cidade}.', {cidade});
    let h = `<p class="mb-status">${esc(linha)}</p>`;
    if(cid === e.torcida.mapa){
      const grandes = d.maiores(e, cid);
      if(pl.dono === meu) h += `<p class="mb-efeito bom">${esc(_t('Dominar a cidade: +0,1 de prestígio e +0,1 de moral por dia.'))}</p>`;
      else if(grandes.includes(meu)) h += `<p class="mb-efeito ruim">${esc(_t('Somos uma das duas maiores da cidade e não dominamos: −0,1 de prestígio e −0,1 de moral por dia.'))}</p>`;
    }
    const grandes = d.maiores(e, cid);
    const ids = [...new Set(d.torcidasDaCidade(cid).map(o => o.id).concat(pl.ordem))]
      .sort((a, b) => (pl.n[b] || 0) - (pl.n[a] || 0) || d.membrosDe(e, b) - d.membrosDe(e, a));
    h += '<ul class="mb-torcidas">';
    for(const id of ids){
      const n = pl.n[id] || 0, cor = corDe(id);
      const tags = [];
      if(id === meu) tags.push(_t('nós'));
      if(grandes[0] === id) tags.push(_t('maior'));
      else if(grandes[1] === id) tags.push(_t('2ª maior'));
      if(pl.dono === id) tags.push(_t('domina'));
      h += `<li${id === meu ? ' class="nos"' : ''}><i style="background:${cor}"${claro(cor) ? ' class="claro"' : ''}></i>` +
           `<span>${esc(nome(id))}${tags.length ? ` <small>${esc(tags.join(' · '))}</small>` : ''}</span>` +
           `<b>${esc(_t('{n} de {total}', {n, total:pl.total}))}</b></li>`;
    }
    if(pl.semDono) h += `<li class="sem"><i></i><span>${esc(_t('Sem dona (ninguém passa de 50%)'))}</span><b>${pl.semDono}</b></li>`;
    h += '</ul>';
    caixa.innerHTML = h;
    return caixa;
  }

  /* o que tem no bairro, em texto */
  const TIPO = () => ({sede:_t('Sede da {nome}'), bar:_t('Bar da {nome}'), loja:_t('Loja da {nome}'),
                       subsede:_t('Subsede da {nome}'), filial:_t('Subsede de fora da {nome}')});

  /* =======================================================
     O BAIRRO: a barra, o que tem nele e o que dá pra fazer
     ======================================================= */
  function cartaoDoBairro(cid, bid, opc){
    opc = opc || {};
    const caixa = document.createElement('div');
    caixa.className = 'mb-cartao';
    const d = D(), e = E();
    if(!d || !e) return caixa;
    const b = d.bairros(e, cid).find(x => x.id === bid);
    if(!b){ caixa.innerHTML = `<p class="mb-nada">${esc(_t('Clique num bairro do mapa pra ver os habitantes, a classe social, quem manda e o que tem nele.'))}</p>`; return caixa; }
    const meu = e.torcida.id;
    const num = v => TO.util && TO.util.numero ? TO.util.numero(v) : String(Math.round(v));
    const mult = (b.mult != null ? b.mult : 1).toLocaleString(TO.i18n && TO.i18n.lingua ? undefined : 'pt-BR', {minimumFractionDigits:1, maximumFractionDigits:1});
    let h = `<h3>${esc(b.nome)}</h3>`;
    /* O BAIRRO EM DADOS CLAROS (o dono, 01/10/2026: "quando eu clico no
       bairro eu prefiro ver as informações claras dele de quantidade de
       habitantes, classe social e quais as estruturas presentes"): os
       habitantes são os torcedores dos clubes que moram nele — a mesma
       conta da População do perfil da cidade, repartida por bairro */
    const moram = d.torcedoresNoBairro ? d.torcedoresNoBairro(cid, b.id) : [];
    const habitantes = Math.round(moram.reduce((t, o) => t + o.n, 0));
    const varias = d.cidadesDa && d.cidadesDa(cid).length > 1;
    const dado = (rot, val) => `<div class="mb-dado"><span>${esc(rot)}</span><b>${esc(val)}</b></div>`;
    h += '<div class="mb-dados">' +
      dado(_t('Habitantes'), num(habitantes)) +
      dado(_t('Classe social'), _t(b.classe || '—')) +
      (varias && b.cidade ? dado(_t('Cidade'), b.cidade) : '') +
      (!b.semZona && b.zona ? dado(_t('Zona'), _t(b.zona)) : '') +
      dado(_t('Receita no bairro'), '×' + mult) + '</div>';
    /* quem mora: os clubes, com a gente de cada um */
    const top = moram.filter(o => o.n >= 0.5).slice(0, 5);
    if(top.length){
      h += `<h4>${esc(_t('Torcedores que moram aqui'))}</h4><ul class="mb-moram">` + top.map(o =>
        `<li><span>${esc(o.clube)}</span><b>${esc(num(Math.round(o.n)))}</b><small>${Math.round(o.perc * 100)}%</small></li>`).join('') + '</ul>';
    }
    /* a barra de 0 a 100: a parte de cada torcida e a de ninguém (o dono
       preferiu manter a fatia de ninguém, 01/10/2026); dona é quem passa
       de 50% */
    h += `<h4>${esc(_t('Domínio do bairro'))}</h4>`;
    h += `<p class="mb-dona">${b.dono
      ? (b.dono === meu ? esc(_t('O bairro é nosso ({v}%).', {v:Math.round(b.v)})) : esc(_t('A dona é a {nome} ({v}%).', {nome:nome(b.dono), v:Math.round(b.v)})))
      : esc(_t('Sem dona: ninguém passa de 50%.'))}</p>`;
    h += '<div class="mb-barra" role="img" aria-label="' + esc(b.partes.map(p => sigla(p.t) + ' ' + Math.round(p.v) + '%').join(', ') || _t('ninguém')) + '">';
    let soma = 0;
    for(const p of b.partes){
      soma += p.v;
      const cor = corDe(p.t);
      h += `<span style="width:${p.v.toFixed(2)}%;background:${cor}"${claro(cor) ? ' class="claro"' : ''} title="${esc(nome(p.t) + ': ' + Math.round(p.v) + '%')}">${p.v >= 12 ? esc(sigla(p.t)) : ''}</span>`;
    }
    const livre = Math.max(0, 100 - soma);
    h += `<span class="livre" style="width:${livre.toFixed(2)}%" title="${esc(_t('De ninguém') + ': ' + Math.round(livre) + '%')}"></span><em class="meio"></em></div>`;
    const pc = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR') + '%';
    h += '<ul class="mb-partes">' + b.partes.filter(p => p.v >= 0.05).map(p =>
      `<li${p.t === meu ? ' class="nos"' : ''}><i style="background:${corDe(p.t)}"></i>${esc(nome(p.t))}<b>${pc(p.v)}</b></li>`).join('') +
      (livre >= 0.05 ? `<li class="livre"><i></i>${esc(_t('De ninguém'))}<b>${pc(livre)}</b></li>` : '') + '</ul>';
    if(b.sede) h += `<p class="mb-nota">${esc(_t('É o bairro da sede da {nome}: quem não é da casa ganha metade aqui, e a casa se refaz até 80%.', {nome:nome(b.sede)}))}</p>`;
    /* as estruturas presentes */
    const est = d.estruturas(e, cid).filter(s => s.bairro === b.id);
    const T = TIPO();
    h += `<h4>${esc(_t('Estruturas no bairro'))}</h4>`;
    h += est.length
      ? '<ul class="mb-estruturas">' + est.map(s => {
          const nv = s.obj && s.obj.nivel ? ' ' + _t('(nível {n})', {n:s.obj.nivel}) : '';
          return `<li><i style="background:${corDe(s.tid)}"></i>${esc(_t(T[s.tipo] || '{nome}', {nome:nome(s.tid)}) + nv)}</li>`;
        }).join('') + '</ul>'
      : `<p class="mb-nada">${esc(_t('Nenhuma sede, bar, loja ou subsede.'))}</p>`;
    const meus = est.filter(s => s.tid === meu && s.tipo !== 'sede');
    if(meus.length && b.dono && b.dono !== meu && d.rivais(e, meu, b.dono))
      h += `<p class="mb-efeito ruim">${esc(_t('Os nossos pontos aqui rendem 30% menos: o bairro é da {nome}, rival.', {nome:nome(b.dono)}))}</p>`;
    caixa.innerHTML = h;
    /* o que dá pra fazer (só na nossa cidade) */
    const pe = document.createElement('div');
    pe.className = 'mb-acoes';
    if(cid === e.torcida.mapa && b.dono !== meu && !(b.sede && b.sede !== meu) && TO.acoes && TO.acoes.porId('social-bairro')){
      const pode = d.podeSocial(e);
      const bt = document.createElement('button');
      bt.type = 'button'; bt.className = 'bt';
      bt.textContent = _t('Ação social aqui ({valor})', {valor: TO.util && TO.util.dinheiro ? TO.util.dinheiro(d.SOCIAL.custo) : 'R$ ' + d.SOCIAL.custo});
      bt.disabled = !pode.ok;
      if(!pode.ok) bt.title = pode.motivo || '';
      bt.onclick = () => {
        const r = TO.acoes.executar(e, 'social-bairro', {alvo:b.id});
        if(TO.estado.mudou) try{ TO.estado.mudou(); }catch(_){}
        if(opc.aoAviso) opc.aoAviso(r.msg || '', r.ok);
        if(opc.aoMudar) opc.aoMudar();
      };
      pe.appendChild(bt);
      if(!pode.ok){ const m = document.createElement('small'); m.textContent = pode.motivo || ''; pe.appendChild(m); }
    }
    if(opc.aoIr){
      const bt = document.createElement('button');
      bt.type = 'button'; bt.className = 'bt';
      bt.textContent = _t('Ver na cidade 3D');
      bt.onclick = () => opc.aoIr(b);
      pe.appendChild(bt);
    }
    if(pe.childNodes.length) caixa.appendChild(pe);
    return caixa;
  }

  /* =======================================================
     O QUADRO DE BAIRROS (a bússola): Norte em cima, Sul embaixo, Oeste
     à esquerda, Leste à direita — pro jogo de feed, que não tem planta
     ======================================================= */
  function quadro(cid, opc){
    opc = opc || {};
    const caixa = document.createElement('div');
    caixa.className = 'mb-quadro';
    const d = D(), e = E();
    if(!d || !e) return caixa;
    const bs = d.bairros(e, cid), meu = e.torcida.id;
    /* AS PRAÇAS DE VÁRIAS CIDADES (01/10/2026): um bloco por cidade (a
       maior primeiro) no lugar das quatro zonas */
    const cidades = d.cidadesDa ? d.cidadesDa(cid) : [];
    const blocos = cidades.length > 1
      ? cidades.map(c => ({classe:'mb-zona-bloco mb-cidade-bloco', titulo:c.nome, de:x => x.cidade === c.nome}))
      : ['Norte', 'Oeste', 'Leste', 'Sul'].map(z => ({classe:'mb-zona-bloco z-' + z.toLowerCase(), titulo:_t('Zona {zona}', {zona:_t(z)}), de:x => x.zona === z}));
    if(cidades.length > 1) caixa.classList.add('mb-por-cidade');
    for(const B of blocos){
      const zona = document.createElement('div');
      zona.className = B.classe;
      zona.innerHTML = `<h4>${esc(B.titulo)}</h4>`;
      for(const b of bs.filter(B.de)){
        const cor = b.dono ? corDe(b.dono) : '#6f6f6a';
        const bt = document.createElement('button');
        bt.type = 'button';
        bt.className = 'mb-bairro' + (b.dono === meu ? ' nosso' : '') + (opc.escolhido === b.id ? ' escolhido' : '') + (claro(cor) ? ' claro' : '');
        bt.style.setProperty('--cor', cor);
        const outras = b.partes.filter(p => p.t !== b.dono && p.v >= 1).slice(0, 3).map(p => sigla(p.t) + ' ' + Math.round(p.v) + '%').join(' · ');
        bt.innerHTML = `<b>${esc(b.nome)}</b><small>${b.dono ? esc(sigla(b.dono) + ' ' + Math.round(b.v) + '%') : esc(_t('em disputa'))}${b.sede ? ' · ' + esc(_t('sede')) : ''}</small>` +
                       (outras ? `<small class="mb-outras">${esc(outras)}</small>` : '');
        bt.onclick = () => opc.aoEscolher && opc.aoEscolher(b.id);
        zona.appendChild(bt);
      }
      caixa.appendChild(zona);
    }
    return caixa;
  }

  /* =======================================================
     O PAINEL DO JOGO DE FEED: o Brasil e, escolhida a cidade, o quadro
     dos bairros com a legenda e o cartão do bairro
     ======================================================= */
  let raiz = null, vista = null;
  function abrir(cid){
    const e = E();
    if(!e) return;
    vista = {aba:'cidade', cidade: cid || e.torcida.mapa, bairro:null, lado:'bairros'};
    if(!raiz){
      raiz = document.createElement('div');
      raiz.className = 'mb-painel';
      raiz.setAttribute('role', 'dialog');
      raiz.setAttribute('aria-label', _t('Mapa'));
      document.body.appendChild(raiz);
      document.addEventListener('keydown', tecla, true);
      if(TO.tela && TO.tela.pausarTempo) TO.tela.pausarTempo('mapa');
    }
    pintar();
  }
  function tecla(ev){ if(ev.key === 'Escape' && raiz){ ev.stopPropagation(); fechar(); } }
  function fechar(){
    if(!raiz) return;
    document.removeEventListener('keydown', tecla, true);
    if(raiz._planta) raiz._planta.desligar();
    raiz.remove(); raiz = null; vista = null;
    if(TO.tela && TO.tela.retomarTempo) TO.tela.retomarTempo('mapa');
    if(TO.tela && TO.tela.redesenhar) try{ TO.tela.redesenhar(); }catch(_){}
  }
  function pintar(){
    if(!raiz || !vista) return;
    if(raiz._planta){ raiz._planta.desligar(); raiz._planta = null; }
    const e = E();
    raiz.innerHTML = `<header><h2>${esc(_t('Mapa'))}</h2>
        <div class="mb-abas" role="tablist">
          <button type="button" role="tab" data-aba="brasil" aria-selected="${vista.aba === 'brasil'}">${esc(_t('Brasil'))}</button>
          <button type="button" role="tab" data-aba="cidade" aria-selected="${vista.aba === 'cidade'}">${esc(nomeCidade(vista.cidade))}</button>
        </div>
        <button type="button" class="mb-x" aria-label="${esc(_t('Fechar'))}">×</button></header>
      <div class="mb-corpo"></div>`;
    raiz.querySelector('.mb-x').onclick = fechar;
    for(const b of raiz.querySelectorAll('[data-aba]')) b.onclick = () => { vista.aba = b.dataset.aba; pintar(); };
    const corpo = raiz.querySelector('.mb-corpo');
    if(vista.aba === 'brasil'){
      corpo.className = 'mb-corpo mb-corpo-brasil';
      const escolher = cid => { vista.cidade = cid; vista.bairro = null; vista.aba = 'cidade'; vista.lado = 'bairros'; pintar(); };
      const m = document.createElement('div'); m.className = 'mb-mapa';
      m.appendChild(svgDoBrasil({aoEscolher:escolher, escolhida:vista.cidade}));
      corpo.appendChild(m);
      corpo.appendChild(listaDeCidades({aoEscolher:escolher, escolhida:vista.cidade}));
      return;
    }
    corpo.className = 'mb-corpo mb-corpo-cidade';
    const aoEscolher = bid => { vista.bairro = bid; vista.lado = 'bairros'; pintar(); };
    /* A PLANTA DA CIDADE (o dono, 01/10/2026: "o mapa 2d que acabamos de
       construir na versão 3d"): a praça desenhada como no jogo 3D, com a
       dona de cada bairro por cima (js/ui/mapa_planta.js); sem a planta
       dela, o quadro de bairros por zona */
    const PL = TO.mapaPlanta;
    if(PL && PL.tem(vista.cidade)){
      const pl = PL.criar(vista.cidade, {escolhido:vista.bairro, aoEscolher, semPlanta: pintar});
      raiz._planta = pl;
      corpo.appendChild(pl);
    } else corpo.appendChild(quadro(vista.cidade, {escolhido:vista.bairro, aoEscolher}));
    const lado = document.createElement('div'); lado.className = 'mb-lado';
    /* O PERFIL DA CIDADE MORA AQUI (o dono, 01/10/2026: "as informações
       contidas no perfil da cidade, inclusive a foto, devem encaixar de
       alguma forma na tela do mapa"): a capa com a foto, o nome e a linha
       de baixo em cima da coluna; embaixo, as abas — os bairros (quem
       domina, o cartão do bairro) e as duas do perfil (main.js,
       `perfilDaCidade`) */
    const P = TO.tela && TO.tela.perfilDaCidade ? TO.tela.perfilDaCidade(vista.cidade) : null;
    if(P){
      const capa = document.createElement('div');
      capa.className = 'mb-capa' + (P.capa ? ' com-foto' : '');
      if(P.capa) capa.style.backgroundImage = `linear-gradient(180deg, rgba(8,9,12,.25), rgba(8,9,12,.88)), url("${P.capa}")`;
      capa.innerHTML = `<h3>${esc(P.nome)}</h3><small>${esc(P.sub)}</small>`;
      lado.appendChild(capa);
      const abas = document.createElement('div');
      abas.className = 'mb-lado-abas'; abas.setAttribute('role', 'tablist');
      for(const [id, rot] of [['bairros', _t('Bairros')]].concat(P.abas.map(a => [a.id, a.rot]))){
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', String(vista.lado === id));
        b.textContent = rot;
        b.onclick = () => { vista.lado = id; pintar(); };
        abas.appendChild(b);
      }
      lado.appendChild(abas);
    }
    const aba = P && P.abas.find(a => a.id === vista.lado);
    if(aba){
      const cx = document.createElement('div');
      cx.className = 'mb-perfil perfil-torcida';
      cx.appendChild(aba.montar());
      lado.appendChild(cx);
    } else {
      /* (o resumo de quem domina a cidade saiu daqui pra dar espaço ao
         bairro — pedido do dono, 01/10/2026; a planta já pinta a dona) */
      lado.appendChild(cartaoDoBairro(vista.cidade, vista.bairro, {aoMudar: pintar,
        aoAviso: (t, ok) => { if(TO.tela && TO.tela.aviso) TO.tela.aviso(t, ok ? 'boa' : 'ruim'); }}));
    }
    corpo.appendChild(lado);
  }

  return {svgDoBrasil, listaDeCidades, legenda, cartaoDoBairro, quadro, abrir, fechar, corDe, claro, PRACAS, nomeCidade,
          get aberto(){ return !!raiz; }};
})();
