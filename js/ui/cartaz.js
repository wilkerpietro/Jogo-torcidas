/* =========================================================
   O CARTAZ DO POST (pedido do dono, 01/10/2026)
   "As postagens na rede social, principalmente no Futebol e Porrada
   e na Gazeta dos Sports, vão ter uma imagem explicando a notícia":
   - JOGO: escudo, placar, escudo, a logo da competição, a rodada ou
     a fase, a manchete, e o fundo de estádio desfocado visto do campo
     (desenhado aqui, com a arquibancada nas cores do mandante);
   - BRIGA: as duas torcidas, envolvidos, feridos e presos, a manchete,
     e a foto do lugar com os bonecos de quem venceu batendo nos de
     quem perdeu (`bonecos3.fotoDaBriga`).
   Formato 2:1. A legenda (o texto do post) fica embaixo da imagem,
   como no Instagram — isso é da casca (main.js).
   O post guarda só os dados (`m.card`, montado em feed.js); a imagem
   sai aqui, em qualquer idioma. A foto dos bonecos é cara (WebGL):
   sai na hora em que o cartaz aparece na tela, uma de cada vez, e
   fica guardada na memória da sessão — não vai pro save.
   ========================================================= */
TO.cartaz = (function(){
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const IMG = c => (window.__EMBUTIDOS && window.__EMBUTIDOS[c]) || c;
  const escudo = (tipo, id) => {
    const m = (TO.dados.escudos||{})[tipo === 'c' ? 'clubes' : 'torcidas'];
    return m && id && m[id] ? IMG(`img/escudos/${tipo === 'c' ? 'clube' : 'torcida'}-${id}.png`) : null;
  };
  const time = id => TO.mundo.time(id) || {};
  const nomeClube = id => time(id).nome || id || '';
  const MAIUS = s => String(s || '').toLocaleUpperCase();

  /* -------- o escudo, ou a sigla nas cores quando não há escudo -------- */
  function marcaDoClube(id){
    const src = escudo('c', id);
    if(src) return `<img class="cz-escudo" src="${src}" alt="">`;
    const t = time(id), c = t.cores || ['#444', '#eee'];
    return `<span class="cz-escudo cz-sigla" style="background:${c[0]};color:${c[1] || '#fff'}">${esc(t.sigla || nomeClube(id).slice(0, 3))}</span>`;
  }
  function marcaDaTorcida(id, nome){
    const src = escudo('t', id);
    if(src) return `<img class="cz-escudo" src="${src}" alt="">`;
    const o = TO.mundo.torcida(id) || {nome};
    const cr = TO.mundo.coresDaTorcida ? TO.mundo.coresDaTorcida(o) : {};
    const sg = String((TO.mundo.siglaTorcida && TO.mundo.siglaTorcida(o)) || nome || '?').slice(0, 4);
    return `<span class="cz-escudo cz-sigla" style="background:${cr.cor || '#444'};color:${cr.cor2 || '#fff'}">${esc(sg)}</span>`;
  }

  /* =======================================================
     O FUNDO DE ESTÁDIO, VISTO DO GRAMADO
     Não há foto de estádio no jogo; o fundo é desenhado: céu de noite,
     refletores, dois anéis de arquibancada com a torcida pintada nas
     cores do mandante, placas de publicidade e o gramado listrado.
     O CSS desfoca. Um por par de cores, guardado na sessão.
     ======================================================= */
  const fundos = new Map();
  function sorteio(semente){
    let h = 2166136261;
    for(const ch of String(semente)){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return ()=>{ h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  }
  function fundoDeEstadio(c1, c2){
    const k = c1 + '|' + c2;
    if(fundos.has(k)) return fundos.get(k);
    const W = 640, H = 320;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'), rnd = sorteio(k);
    /* céu */
    const ceu = x.createLinearGradient(0, 0, 0, H*0.3);
    ceu.addColorStop(0, '#060912'); ceu.addColorStop(1, '#1b2740');
    x.fillStyle = ceu; x.fillRect(0, 0, W, H*0.3);
    /* a cobertura e os dois anéis */
    x.fillStyle = '#1a1a1d'; x.fillRect(0, H*0.12, W, H*0.06);
    const anel = (y0, y1, escuro)=>{
      x.fillStyle = escuro; x.fillRect(0, y0, W, y1 - y0);
      const cores = [c1, c1, c1, c2, c2, '#e8e2d0', '#2a2a2a', '#c99a76', '#7a5a44'];
      const passo = 5;
      for(let yy = y0 + 2; yy < y1 - 2; yy += passo){
        for(let xx = (yy % 2) * 2; xx < W; xx += passo){
          if(rnd() < 0.12) continue;
          x.fillStyle = cores[Math.floor(rnd() * cores.length)];
          x.fillRect(xx, yy, 3, 3);
        }
      }
    };
    anel(H*0.18, H*0.44, '#222226');
    x.fillStyle = '#5b5d63'; x.fillRect(0, H*0.44, W, H*0.03);          // o concreto entre os anéis
    anel(H*0.47, H*0.68, '#26262a');
    /* as placas de publicidade */
    for(let xx = 0; xx < W; xx += 80){
      x.fillStyle = Math.floor(xx / 80) % 2 ? c1 : '#f2f2f2';
      x.fillRect(xx, H*0.68, 80, H*0.05);
      x.fillStyle = Math.floor(xx / 80) % 2 ? '#f2f2f2' : c1;
      x.fillRect(xx + 14, H*0.695, 52, H*0.02);
    }
    /* o gramado, listrado e em perspectiva */
    const g0 = H*0.73;
    for(let i = 0; i < 8; i++){
      x.fillStyle = i % 2 ? '#2f7a32' : '#378a39';
      const y0 = g0 + (H - g0) * Math.pow(i/8, 1.6), y1 = g0 + (H - g0) * Math.pow((i+1)/8, 1.6);
      x.fillRect(0, y0, W, y1 - y0 + 1);
    }
    /* os refletores */
    for(const [lx, ly] of [[W*0.08, H*0.06], [W*0.92, H*0.06], [W*0.5, H*0.02]]){
      const r = x.createRadialGradient(lx, ly, 2, lx, ly, W*0.28);
      r.addColorStop(0, 'rgba(255,250,225,.95)'); r.addColorStop(0.1, 'rgba(255,245,210,.45)');
      r.addColorStop(1, 'rgba(255,240,200,0)');
      x.fillStyle = r; x.fillRect(0, 0, W, H);
    }
    let url = null;
    try{ url = cv.toDataURL('image/jpeg', 0.8); }catch(_){}
    fundos.set(k, url);
    return url;
  }

  /* -------- a manchete --------
     Do ponto de vista de um clube (o `foco`: o da nossa cidade, o nosso
     ou, no clássico, o vencedor), como a TV fala (dono, 01/10/2026):
     "FERROVIÁRIO PERDE PRO BAHIA FORA DE CASA", "CEARÁ VENCE O TREZE EM
     CASA" — e, metade das vezes, a competição no lugar do mando:
     "FERROVIÁRIO VENCE O BAHIA NA SÉRIE D". O artigo do adversário sai
     de TO.genero.clube. */
  function mancheteDoJogo(c, semente){
    const G = TO.genero;
    const ga = c.gc, gb = c.gf;
    const venc = c.pen && c.venceu ? c.venceu : ga > gb ? c.c : ga < gb ? c.f : null;
    const foco = (c.foco === c.c || c.foco === c.f) ? c.foco : (venc || c.c);
    const adv = foco === c.c ? c.f : c.c;
    const nAdv = nomeClube(adv);
    const P = {clube:MAIUS(nomeClube(foco)),
               o:MAIUS(G.clube('o', nAdv)), pra:MAIUS(G.clube('pra', nAdv)),
               com:MAIUS(G.clube('com', nAdv)), por:MAIUS(G.clube('por', nAdv))};
    if(c.pen && c.venceu)
      return foco === c.venceu ? _t('{clube} ELIMINA {o} NOS PÊNALTIS', P)
                               : _t('{clube} É ELIMINADO {por} NOS PÊNALTIS', P);
    /* o mando ou a competição, pela sorte fixa do post */
    const h = TO.mapa && TO.mapa.hash ? TO.mapa.hash('manchete|' + semente) : 0;
    P.onde = (!c.neutro && h % 2 === 0)
      ? MAIUS(foco === c.c ? _t('em casa') : _t('fora de casa'))
      : MAIUS(c.comp ? G.em('competicao', c.comp) : (foco === c.c ? _t('em casa') : _t('fora de casa')));
    const gf = foco === c.c ? ga : gb, gs = foco === c.c ? gb : ga;
    if(gf === gs) return _t('{clube} EMPATA {com} {onde}', P);
    if(gf > gs) return gf - gs >= 3 ? _t('{clube} GOLEIA {o} {onde}', P) : _t('{clube} VENCE {o} {onde}', P);
    return gs - gf >= 3 ? _t('{clube} É GOLEADO {por} {onde}', P) : _t('{clube} PERDE {pra} {onde}', P);
  }
  /* manchete comprida encolhe a letra pra caber em duas linhas */
  const tamManchete = (t, base) => Math.min(base, Math.max(3, 168 / Math.max(1, String(t).length)));
  function mancheteDaBriga(c){
    const onde = MAIUS(_t(c.onde || 'na rua'));
    if(c.venceuA == null) return _t('{a} E {b} NO EMPATE {onde}', {a:MAIUS(c.a.nome), b:MAIUS(c.b.nome), onde});
    const v = c.venceuA ? c.a : c.b;
    return _t('{nome} LEVA A MELHOR {onde}', {nome:MAIUS(v.nome), onde});
  }

  /* =======================================================
     O HTML
     ======================================================= */
  const JORNAL = {gazeta:'GAZETA DOS SPORTS', porrada:'FUTEBOL E PORRADA'};
  function htmlDoJogo(m){
    const c = m.card;
    const t = time(c.c), cores = t.cores || ['#7a1b1b', '#e9e9e9'];
    const bg = fundoDeEstadio(cores[0], cores[1] || '#e9e9e9');
    const logo = TO.dados.logoDaCompeticao && TO.dados.logoDaCompeticao(c.comp);
    const etapa = c.fase ? _t(c.fase) : c.rod ? _t('Rodada {n}', {n:c.rod}) : '';
    const placar = `<span class="cz-gols">${c.gc}</span><span class="cz-x">×</span><span class="cz-gols">${c.gf}</span>`;
    const pen = c.pen ? `<span class="cz-pen">${esc(_t('pênaltis {a} × {b}', {a:c.pen.c, b:c.pen.f}))}</span>` : '';
    const marca = m.jornal ? JORNAL[m.jornal] : String(m.nome || '').toLocaleUpperCase();
    return `<figure class="cartaz cz-jogo${m.jornal ? ' cz-'+m.jornal : ''}">`+
      (bg ? `<img class="cz-fundo" src="${bg}" alt="">` : '')+
      `<div class="cz-veu"></div>`+
      `<div class="cz-topo">${logo ? `<img class="cz-comp" src="${IMG(logo)}" alt="">` : ''}`+
        `<span class="cz-etapa"><b>${esc(c.comp)}</b>${etapa ? `<small>${esc(etapa)}</small>` : ''}</span>`+
        `<span class="cz-marca">${esc(marca)}</span></div>`+
      `<div class="cz-placar">`+
        `<div class="cz-time">${marcaDoClube(c.c)}<span>${esc(nomeClube(c.c))}</span></div>`+
        `<div class="cz-meio">${placar}${pen}</div>`+
        `<div class="cz-time">${marcaDoClube(c.f)}<span>${esc(nomeClube(c.f))}</span></div>`+
      `</div>`+
      (()=>{ const t = mancheteDoJogo(c, m.id);
        return `<figcaption class="cz-manchete" style="font-size:${tamManchete(t, 5.2).toFixed(2)}cqw">${esc(t)}</figcaption>`; })()+
    `</figure>`;
  }

  const fotos = new Map();          // chave do post → dataURL da foto dos bonecos
  const cenaImg = id => {
    const D = id === 'arredores' ? TO.dados.cenaArredores : (TO.dados.cenas || {})[id];
    return D && D.imagem ? IMG(D.imagem) : null;
  };
  const chaveDaFoto = m => `${m.id}|${m.card.cena}`;
  function htmlDaBriga(m){
    const c = m.card, a = c.a, b = c.b;
    const k = chaveDaFoto(m);
    const foto = fotos.get(k);
    const bg = foto || cenaImg(c.cena);
    const lado = (x, venceu) =>
      `<div class="cz-torcida${venceu ? ' venceu' : ''}">${marcaDaTorcida(x.id, x.nome)}<span>${esc(x.nome)}</span></div>`;
    const num = (rot, va, vb) => `<span class="cz-num"><small>${esc(rot)}</small><b>${va} × ${vb}</b></span>`;
    const topo = [m.jornal ? JORNAL[m.jornal] : '', MAIUS(_t(c.onde || 'na rua')), MAIUS(c.cidade || '')].filter(Boolean);
    return `<figure class="cartaz cz-briga${m.jornal ? ' cz-'+m.jornal : ''}${foto ? ' com-foto' : ''}" data-cz-foto="${esc(k)}">`+
      (bg ? `<img class="cz-fundo" src="${bg}" alt="">` : '')+
      `<div class="cz-veu"></div>`+
      `<div class="cz-lados">${lado(a, c.venceuA === true)}<span class="cz-vs">×</span>${lado(b, c.venceuA === false)}</div>`+
      `<div class="cz-base">`+
        `<div class="cz-faixa-topo">${topo.map(esc).join(' · ')}</div>`+
        (()=>{ const t = mancheteDaBriga(c);
          return `<figcaption class="cz-manchete" style="font-size:${tamManchete(t, 4.6).toFixed(2)}cqw">${esc(t)}</figcaption>`; })()+
        `<div class="cz-numeros">${num(_t('envolvidos'), a.n, b.n)}${num(_t('feridos'), a.feridos, b.feridos)}${num(_t('presos'), a.presos, b.presos)}</div>`+
      `</div>`+
    `</figure>`;
  }

  function html(m){
    if(!m || !m.card) return '';
    try{
      if(m.card.t === 'jogo') return htmlDoJogo(m);
      if(m.card.t === 'briga') return htmlDaBriga(m);
    }catch(err){ console.warn('cartaz: ' + err.message); }
    return '';
  }

  /* =======================================================
     A FOTO DOS BONECOS, NA HORA QUE O CARTAZ APARECE
     ======================================================= */
  let fila = Promise.resolve();
  const pedidas = new Set();
  function pedirFoto(fig, m){
    const k = chaveDaFoto(m);
    if(fotos.has(k) || pedidas.has(k)) return;
    const B = TO.diaJogo && TO.diaJogo.bonecos3;
    if(!B || !B.fotoDaBriga) return;
    pedidas.add(k);
    const c = m.card;
    const cores = id => {
      const o = TO.mundo.torcida(id);
      const cr = o && TO.mundo.coresDaTorcida ? TO.mundo.coresDaTorcida(o) : {};
      return {id, cor:cr.cor, cor2:cr.cor2, cor3:cr.cor3};
    };
    const venc = c.venceuA === false ? c.b : c.a, perd = venc === c.a ? c.b : c.a;
    const pares = Math.max(2, Math.min(3, Math.min(venc.n || 3, (perd.n || 3) + 1)));
    fila = fila.then(()=> B.fotoDaBriga({cena:c.cena, vencedor:cores(venc.id), perdedor:cores(perd.id),
                                          pares, semente:k, largura:800, altura:400}))
      .then(url=>{
        pedidas.delete(k);
        if(!url) return;
        fotos.set(k, url);
        /* a sessão guarda as 80 mais recentes */
        if(fotos.size > 80) fotos.delete(fotos.keys().next().value);
        for(const f of document.querySelectorAll(`.cartaz[data-cz-foto="${CSS.escape(k)}"]`)){
          const im = f.querySelector('.cz-fundo');
          if(im) im.src = url; else f.insertAdjacentHTML('afterbegin', `<img class="cz-fundo" src="${url}" alt="">`);
          f.classList.add('com-foto');
        }
      })
      .catch(()=>{ pedidas.delete(k); });
  }
  let observador = null;
  const porFigura = new WeakMap();
  /* a casca chama depois de pôr o cartaz no DOM */
  function ligar(fig, m){
    if(!fig || !m || !m.card || m.card.t !== 'briga') return;
    if(fotos.has(chaveDaFoto(m))) return;
    if(typeof IntersectionObserver === 'undefined'){ pedirFoto(fig, m); return; }
    if(!observador) observador = new IntersectionObserver(ents=>{
      for(const e of ents){
        if(!e.isIntersecting) continue;
        observador.unobserve(e.target);
        const mm = porFigura.get(e.target);
        if(mm) pedirFoto(e.target, mm);
      }
    }, {rootMargin:'200px'});
    porFigura.set(fig, m);
    observador.observe(fig);
  }

  return {html, ligar, fundoDeEstadio, mancheteDoJogo, mancheteDaBriga, get fotos(){ return fotos; }};
})();
