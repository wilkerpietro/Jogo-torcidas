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

  /* =======================================================
     A ARTE DO POST DE TORCIDA (pedido do dono, 04/10/2026: "Crie
     imagens na rede social nesse estilo pra deixar as postagens das
     torcidas mais legais e realistas", com as prints do perfil de uma
     torcida de Sobral). O molde das prints:
       · as duas tarjas dos lados, na cor escura, com triângulos na cor
         viva e o "DESDE <ano>" em letra gótica, de cima a baixo;
       · o escudo da torcida no alto, numa aba, e as cantoneiras;
       · o título grosso em duas cores — a metade de cima na viva, a de
         baixo na escura (PARABÉNS, REUNIÃO GERAL, CONVITE!…);
       · o miolo de cada tipo de post — os dois escudos encostados, o
         placar, os anos, a grade das aliadas, o local e o horário em
         etiquetas com o alfinete;
       · o rodapé com o @ da torcida e o da loja, entre dois fios.
     Formato 4:5, o do Instagram. O post não guarda imagem: a arte sai
     do tipo, da chave e de `m.arte` (os números — placar, anos, local),
     desenhada aqui em HTML, no idioma da tela.
     ======================================================= */
  const lum = c => {
    const n = String(c || '').replace('#', '');
    if(n.length !== 6) return .5;
    const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255);
    return .2126 * r + .7152 * g + .0722 * b;
  };
  const satur = c => {
    const n = String(c || '').replace('#', '');
    if(n.length !== 6) return 0;
    const v = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16));
    return (Math.max(...v) - Math.min(...v)) / 255;
  };
  /* AS CORES DA ARTE SÃO AS DA TORCIDA, NA ORDEM DELA (o dono, 04/10/2026:
     "Esse fundo branco tem que ser sempre o fundo na cor primária da
     torcida, e o texto na cor secundária+terciária quando tiver. As
     barras do lado na cor secundária e o texto das barras na primária";
     e antes, no mesmo dia: "algumas torcidas estão colocando a cor preta
     sem estar no plano de cores da torcida. Isso não pode acontecer").
     `fundo` é a primária; `sec` e `ter`, a segunda e a terceira (sem
     terceira, a segunda nas duas metades do título). Torcida de uma cor
     só: a segunda é um tom dela, nunca preto nem branco de fora.
     `viva` (metade de cima do título) é a secundária e `escura` (a de
     baixo) a terciária — os nomes antigos que o resto da arte lê. */
  const sombra = (c, k) => '#' + [0, 2, 4].map(i => Math.round(parseInt(c.slice(1 + i, 3 + i), 16) * k)
    .toString(16).padStart(2, '0')).join('');
  const clarear = (c, k) => '#' + [0, 2, 4].map(i => { const v = parseInt(c.slice(1 + i, 3 + i), 16);
    return Math.round(v + (255 - v) * k).toString(16).padStart(2, '0'); }).join('');
  const rgbDe = c => [0, 2, 4].map(i => parseInt(c.slice(1 + i, 3 + i), 16)).join(',');
  function paleta(id){
    const o = TO.mundo.torcida(id) || {};
    const cr = TO.mundo.coresDaTorcida ? TO.mundo.coresDaTorcida(o) : {};
    const cs = [cr.cor, cr.cor2, cr.cor3].filter(c => /^#[0-9a-f]{6}$/i.test(c || ''));
    const fundo = cs[0] || '#333333';
    const sec = cs[1] || (lum(fundo) > .5 ? sombra(fundo, .45) : clarear(fundo, .6));
    const ter = cs[2] || sec;
    /* BRANCO NÃO É COR DE TEXTO (dono, 04/10/2026: "quando tem branco na
       segunda ou terceira cor descarte do texto, aplique a outra cor. Fica
       feio"): o título e o texto miúdo usam a das duas que não é branca.
       Mas o branco SOZINHO vale (dono, no mesmo dia: "pode ser usada a cor
       branca sozinha se ela for a cor secundária da torcida, numa torcida
       de cor primária preta e cor secundária branca"): quando não há outra,
       o texto é branco. Sem cor nenhuma além da primária, um tom dela.
       O texto miúdo (rodapé, etiquetas, subtítulo) vai na que mais
       contrasta com o fundo. */
    const branco = c => [0, 2, 4].every(i => parseInt(c.slice(1 + i, 3 + i), 16) > 215);
    const tom = lum(fundo) > .5 ? sombra(fundo, .45) : clarear(fundo, .55);
    const cores = [sec, ter].filter((c, i, l) => !branco(c) && l.indexOf(c) === i);
    const soBranco = cs.slice(1).find(branco);
    const cima = cores[0] || soBranco || tom, baixo = cores[1] || cima;
    const texto = cores.length > 1 && Math.abs(lum(baixo) - lum(fundo)) > Math.abs(lum(cima) - lum(fundo)) ? baixo : cima;
    return {fundo, sec, ter, texto, viva:cima, escura:baixo, rgb:rgbDe(fundo)};
  }
  const varsDe = pal => `--p:${pal.fundo};--s:${pal.sec};--t:${pal.ter};--x:${pal.texto};--pr:${pal.rgb};--e:${pal.escura};--v:${pal.viva}`;
  const arrobaDe = o => '@' + String(TO.mundo.siglaTorcida(o) || o.nome || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const anoDe = o => {
    const f = o && o.fundacao;
    return typeof f === 'number' ? f : (String(f || '').match(/(\d{4})/) || [])[1] || '';
  };
  const triangulos = viva => `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='60' viewBox='0 0 20 60' preserveAspectRatio='none'><path d='M20 6 L1 30 L20 54 Z' fill='${viva}'/></svg>`)}")`;
  const tarja = (ano, pal, lado) =>
    `<div class="ca-tarja ca-${lado}" style="--tri:${triangulos(pal.ter !== pal.sec ? pal.ter : pal.fundo)}"><span>${
      Array.from({length:6}, () => `<i>${esc(_t('DESDE'))} ${esc(ano)}</i>`).join('')}</span></div>`;

  /* o escudo no aro, como nas prints: branco por dentro, as cores por fora */
  /* O ESCUDO DO RIVAL VAI DE CABEÇA PRA BAIXO (o dono, 04/10/2026: "É
     cultura da torcida organizada posicionar o escudo do rival, seja o
     time ou a torcida, de cabeça pra baixo em postagens" — e, nas prints,
     desbotado, só no branco e cinza). Rival é do ponto de vista de quem
     posta: a torcida que não é amiga dela (irmã ou relação boa), o clube
     que não é o dela e não tem torcida amiga dela. */
  function amigaDe(de, outra){
    if(!de || !outra || de === outra) return true;
    const E = TO.estado && TO.estado.E;
    if(E && TO.dominio && TO.dominio.amigas) return !!TO.dominio.amigas(E, de, outra);
    const o = TO.mundo.torcida(de) || {};
    return (o.irmandade || []).includes(outra) || (o.aliados || []).includes(outra);
  }
  function ehRival(de, tipo, id){
    if(!de || !id) return false;
    if(tipo === 't') return !amigaDe(de, id);
    const o = TO.mundo.torcida(de) || {};
    if(id === o.clubeId) return false;
    const delas = (TO.mundo.torcidasDe && TO.mundo.torcidasDe(id)) || [];
    return !delas.some(t => amigaDe(de, t.id));
  }
  function aro(tipo, id, nome, pal, cls, de){
    const dentro = tipo === 'c' ? marcaDoClube(id) : marcaDaTorcida(id, nome);
    const rival = ehRival(de, tipo, id);
    return `<span class="ca-aro${cls ? ' ' + cls : ''}${rival ? ' ca-rival' : ''}" style="${varsDe(pal)}">${dentro}</span>`;
  }
  /* o título: cada linha com a viva em cima e a escura embaixo */
  const titulo = (linhas, pal) => {
    const maior = Math.max(...linhas.map(l => String(l).length));
    const tam = Math.min(17, Math.max(7.2, 132 / Math.max(6, maior)));
    return `<h3 class="ca-titulo" style="${varsDe(pal)};font-size:${tam.toFixed(2)}cqw">${
      linhas.map(l => `<span>${esc(l)}</span>`).join('')}</h3>`;
  };
  const alfinete = pal => `<svg class="ca-pin" viewBox="0 0 24 32" aria-hidden="true"><path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 32 12 32s12-11.2 12-20.1C24 5.3 18.6 0 12 0z" fill="${pal.fundo}"/><circle cx="12" cy="11.5" r="4.6" fill="${pal.texto}"/><ellipse cx="12" cy="31" rx="7" ry="1.6" fill="${pal.fundo}" opacity=".45"/></svg>`;
  const etiquetas = (pins, pal) => pins && pins.length
    ? `<div class="ca-pins">${pins.map(p => {
        const v = String(p.val || '');
        const tam = Math.min(5.4, Math.max(2.6, 58 / Math.max(8, v.length) / (pins.length > 1 ? 1.5 : 1)));
        return `<div class="ca-etq"><small style="color:${pal.texto}">${esc(p.rot)}</small>`+
          `<span class="ca-etq-cx">${alfinete(pal)}<b style="font-size:${tam.toFixed(2)}cqw">${esc(MAIUS(v))}</b></span></div>`;
      }).join('')}</div>` : '';
  /* as aliadas pra grade do convite: as da torcida, as que estão de bem
     com ela no save, com escudo primeiro */
  function aliadasDe(id){
    const o = TO.mundo.torcida(id) || {}, E = TO.estado && TO.estado.E;
    const ids = [...new Set([...(o.irmandade || []), ...(o.aliados || [])])].filter(x => TO.mundo.torcida(x));
    const amiga = x => !E || !TO.dominio || !TO.dominio.amigas || TO.dominio.amigas(E, id, x);
    const tem = x => !!escudo('t', x);
    return ids.filter(amiga).sort((a, b) => tem(b) - tem(a)).slice(0, 12);
  }

  /* -------- o molde de cada post: título, miolo e etiquetas -------- */
  /* "no Genibaú", "na Maraponga": bairro não tem tabela de gênero; vale a
     primeira palavra — terminada em "a" é feminina (Maraponga, Granja
     Portugal, Aldeota), o resto masculino (Genibaú, Bom Jardim, José
     Walter, Monte Castelo) */
  const noBairro = b => MAIUS(/a$/i.test(String(b).trim().split(/\s+/)[0] || '')
    ? _t('na {bairro}', {bairro:b}) : _t('no {bairro}', {bairro:b}));
  const prefixo = m => String(m.chave || '').split('|')[0];
  const parteDaChave = (m, i) => String(m.chave || '').split('|')[i] || '';
  const SEM_ARTE = new Set(['pedido', 'juntos', 'recusa', 'recado', 'tregua-ok']);
  function especDaArte(m){
    const a = m.arte || {}, k = a.k || prefixo(m), tipo = m.tipo;
    const E = TO.estado && TO.estado.E, nossa = E && E.torcida ? E.torcida.id : null;
    const o = TO.mundo.torcida(m.de) || {};
    const placar = a.gc != null && a.c ? {t:'placar', c:a.c, f:a.f, gc:a.gc, gf:a.gf} : null;
    const eu = {t:'escudo', tipo:'t', id:m.de};
    const doClube = id => ({t:'escudo', tipo:'c', id:id || o.clubeId});
    const par = b => b && b !== m.de ? {t:'par', a:m.de, b} : eu;
    const vs = b => b && b !== m.de ? {t:'vs', a:m.de, b} : eu;
    /* o #TBT da quinta (04/10/2026): a data da lembrança embaixo */
    if(k === 'tbt') return {tit:['#TBT'], sub:MAIUS(a.quando || ''), miolo:vs(a.perd)};
    /* "RECIFE É SÓ LAZER" (04/10/2026): a cidade do maior rival, e o escudo dele de cabeça pra baixo */
    if(k === 'lazer') return {tit:[MAIUS(a.cidade || ''), _t('É SÓ LAZER')], miolo:vs(a.perd)};
    /* A FAIXA TOMADA (04/10/2026): o troféu de guerra, de cabeça pra baixo */
    if(a.pano) return {tit:a.pano === 'bandeira' ? [_t('BANDEIRA'), _t('TOMADA!')] : [_t('FAIXA'), _t('TOMADA!')],
      miolo:vs(a.perd || parteDaChave(m, 3))};
    switch(k){
      case 'convoca': return {tit:[_t('DIA DE'), _t('JOGO')],
        miolo:a.c && a.f ? {t:'confronto', c:a.c, f:a.f} : doClube(),
        pins:[a.estadio && {rot:_t('LOCAL'), val:a.estadio}, a.hora && {rot:_t('HORÁRIO'), val:a.hora}].filter(Boolean)};
      case 'caravana': return {tit:[_t('CARAVANA'), _t('CONFIRMADA')],
        miolo:a.c && a.f ? {t:'confronto', c:a.c, f:a.f} : eu,
        pins:[a.cidade && {rot:_t('DESTINO'), val:a.cidade}, a.dia && {rot:_t('DIA'), val:a.dia}].filter(Boolean)};
      case 'chegada': return {tit:[_t('CHEGAMOS!')], miolo:eu,
        pins:a.cidade ? [{rot:_t('ONDE'), val:a.cidade}] : []};
      case 'resenha': return {tit:[_t('RESENHA')], sub:m.zona ? _t('ZONA {zona}', {zona:MAIUS(_t(m.zona))}) : '',
        miolo:eu, pins:[{rot:_t('LOCAL'), val:_t('Casa de piscina')}, {rot:_t('DIA'), val:_t('Sábado')}]};
      case 'convite-nosso': case 'convite': return {tit:[_t('CONVITE!')], sub:_t('ALIADOS E AMIZADES'),
        miolo:{t:'anos', n:a.n, id:m.de, grade:aliadasDe(m.de)},
        pins:a.data ? [{rot:_t('DATA'), val:a.data}] : []};
      case 'obrigado-nosso': return {tit:[_t('NOTA DE'), _t('AGRADECIMENTO')], miolo:par(parteDaChave(m, 2))};
      case 'nosso-jogo': case 'resultado':
        return {tit:[tipo === 'reclamacao' ? _t('DERROTA') : a.gc != null && a.gc === a.gf ? _t('EMPATE') : _t('VITÓRIA!')],
                miolo:placar || doClube()};
      case 'classico-v': return {tit:[_t('O CLÁSSICO'), _t('É NOSSO!')], miolo:placar || doClube()};
      case 'classico-d': return {tit:[_t('VERGONHA')], miolo:placar || doClube()};
      case 'goleada-r': return {tit:[_t('QUE FASE!')], miolo:placar || doClube()};
      case 'goleada-d': return {tit:[_t('VEXAME')], miolo:placar || doClube()};
      case 'titulo': return {tit:[_t('É CAMPEÃO!')], sub:parteDaChave(m, 1), miolo:doClube()};
      case 'acesso': return {tit:[_t('ACESSO!')], sub:parteDaChave(m, 1), miolo:doClube()};
      case 'queda': return {tit:[_t('REBAIXADO')], sub:_t('NOTA OFICIAL'), miolo:doClube()};
      case 'queda-r': return {tit:[_t('TCHAU!')], miolo:doClube(parteDaChave(m, 2))};
      case 'protesto': return {tit:[_t('PROTESTO')], sub:_t('NOTA OFICIAL'), miolo:doClube(parteDaChave(m, 2))};
      /* a treta vencida diz onde (dono, 04/10/2026: "em vez de A CIDADE É
         NOSSA é melhor CORRERAM NO GENIBAÚ"); sem bairro, a cidade */
      case 'zoeira': case 'nossa-zoeira': return a.bairro
        ? {tit:[_t('CORRERAM'), noBairro(a.bairro)], miolo:vs(parteDaChave(m, 3))}
        : {tit:[_t('A CIDADE'), _t('É NOSSA!')], miolo:vs(parteDaChave(m, 3))};
      case 'pixo': return {tit:[_t('O MURO'), _t('É NOSSO!')], miolo:vs(parteDaChave(m, 3))};
      /* a zona que venceu fala da zona dela (dono, 04/10/2026: "A LESTE É NOSSA") */
      case 'zona-casa': return {tit:m.zona ? [_t('A {zona}', {zona:MAIUS(_t(m.zona))}), _t('É NOSSA!')]
                                           : [_t('A ZONA'), _t('É NOSSA!')], miolo:eu};
      case 'tregua': return {tit:[_t('NOTA'), _t('PÚBLICA')], sub:_t('PROPOSTA DE TRÉGUA'), miolo:par(nossa)};
      case 'treta-msg': return {tit:[_t('TRETA'), _t('MARCADA')], miolo:vs(nossa),
        pins:[a.bairro && {rot:_t('LOCAL'), val:a.bairro}, {rot:_t('HORÁRIO'), val:_t('Hoje à noite')}].filter(Boolean)};
      case 'sede': return {tit:[_t('SEDE'), _t('AMPLIADA')], miolo:eu};
      case 'faixa-nova': return {tit:[_t('FAIXA NOVA')], miolo:eu};
      case 'bandeira-nova': return {tit:[_t('BANDEIRA NOVA')], miolo:eu};
      case 'marco': return {tit:a.n ? [_t('SOMOS'), U_num(a.n)] : [_t('A FAMÍLIA'), _t('CRESCEU')], miolo:eu};
    }
    if(tipo === 'inauguracao') return {tit:/ampliad/.test(k) ? [_t('AMPLIAÇÃO')] : [_t('INAUGURAÇÃO')], miolo:eu};
    if(tipo === 'agradecimento') return {tit:[_t('NOTA DE'), _t('AGRADECIMENTO')], sub:a.n ? _t('{n} ANOS', {n:a.n}) : '', miolo:par(nossa)};
    if(tipo === 'cobranca') return {tit:[_t('NOTA DE'), _t('REPÚDIO')], miolo:par(nossa)};
    if(tipo === 'convite') return {tit:[_t('CONVITE!')], sub:_t('ALIADOS E AMIZADES'), miolo:{t:'anos', n:a.n, id:m.de, grade:aliadasDe(m.de)}};
    if(tipo === 'comemoracao') return {tit:[_t('É FESTA!')], miolo:eu};
    if(tipo === 'reclamacao') return {tit:[_t('NOTA OFICIAL')], miolo:doClube()};
    if(tipo === 'provocacao' || tipo === 'zoeira') return {tit:[_t('RECADO'), _t('DADO')], miolo:eu};
    if(tipo === 'treta') return {tit:[_t('TRETA'), _t('MARCADA')], miolo:vs(nossa)};
    return {tit:[_t('COMUNICADO')], miolo:eu};
  }
  /* A FOTO DE FUNDO (04/10/2026): os bonecos fazendo o que o post diz —
     a cena do lugar, quem aparece e como (`bonecos3.fotoDaCena`). Nem
     todo post tem (o dono, no mesmo dia): resenha, derrota, nota de
     agradecimento, treta marcada e convite ficam só com os escudos; a
     caravana leva a foto da praça de destino, não bonecos; o dia de jogo
     põe a torcida na arquibancada. */
  const capaDa = (mapa, nome) => {
    let id = mapa;
    if(!id && nome){ const c = (TO.dados.cidades || []).find(x => x.nome === nome || (TO.mundo.cidade(x.id) || {}).nome === nome); id = c && c.id; }
    return id && (TO.dados.capas || {})[id] ? IMG(`img/cidades/${id}.webp`) : null;
  };
  function fotoDoPost(m){
    const a = m.arte || {}, k = a.k || prefixo(m), tipo = m.tipo, de = m.de;
    const E = TO.estado && TO.estado.E, nossa = E && E.torcida ? E.torcida.id : null;
    const g = (id, jeito, n, extra) => Object.assign({id, jeito, n}, extra || {});
    const festa = cena => ({cena, grupos:[g(de, 'festa', 7)]});
    const cobra = () => ({cena:'ct', grupos:[g(de, 'protesto', 6)]});
    const perd = a.perd || (/zoeira$/.test(k) ? parteDaChave(m, 3) : '');
    const perdT = perd || a.perd;
    if(k === 'tbt' && !a.pano && perdT) return {cena:a.cena || 'rua', subir:0.27, grupos:[g(de, 'gaba', 3), g(perdT, 'caido', 3)]};
    if(a.pano && perdT) return {cena:a.cena || 'praca', grupos:[g(de, 'faixa', a.pano === 'bandeira' ? 3 : 5)],
                               faixa:{de:perdT, tipo:a.pano}};
    switch(k){
      case 'resenha': return null;
      case 'zoeira': case 'nossa-zoeira': case 'zona-casa':
        /* (os caídos ficam na frente: a cena sobe menos, pra eles não sumirem no branco do pé) */
        return perd ? {cena:a.cena || 'rua', subir:0.27, grupos:[g(de, 'gaba', 3), g(perd, 'caido', 3)]}
                    : {cena:a.cena || 'rua', grupos:[g(de, 'gaba', 4)]};
      case 'pixo': return {cena:'rua', grupos:[g(de, 'gaba', 4)]};
      case 'convoca': return {cena:'estadio-20', grupos:[g(de, 'festa', 7)]};
      case 'chegada': return festa('arredores');
      case 'caravana': case 'lazer': { const img = capaDa(a.mapa, a.cidade); return img ? {img} : null; }
      case 'nosso-jogo': case 'resultado': return tipo === 'reclamacao' || (a.gc != null && a.gc === a.gf) ? null : festa('praca');
      case 'classico-v': case 'goleada-r': case 'titulo': case 'acesso': case 'queda-r': return festa('praca');
      case 'classico-d': case 'goleada-d': case 'queda': case 'protesto': return cobra();
      case 'convite-nosso': case 'obrigado-nosso': case 'treta-msg': return null;
      case 'sede': return festa('sede-3');
    }
    if(tipo === 'convite' || tipo === 'agradecimento' || tipo === 'cobranca' || tipo === 'treta') return null;
    if(tipo === 'inauguracao') return {cena:/^bar/.test(k) ? 'bar' : /^sede|^faixa|^bandeira|^marco/.test(k) ? 'sede-3' : 'praca',
                                       grupos:[g(de, 'festa', 5)]};
    if(tipo === 'comemoracao') return festa('praca');
    if(tipo === 'reclamacao' || tipo === 'protesto') return cobra();
    return null;
  }
  const chaveDaFotoPost = m => `post|${m.id}`;
  const U_num = n => (TO.util && TO.util.numero) ? TO.util.numero(n) : String(n);

  function htmlDoMiolo(x, pal, de){
    const nomeT = id => (TO.mundo.torcida(id) || {}).nome || '';
    switch(x.t){
      case 'par': return `<div class="ca-miolo ca-par">${aro('t', x.a, nomeT(x.a), pal, '', de)}${aro('t', x.b, nomeT(x.b), paleta(x.b), '', de)}</div>`;
      case 'vs': return `<div class="ca-miolo ca-vs">${aro('t', x.a, nomeT(x.a), pal, '', de)}`+
        `<b class="ca-x" style="${varsDe(pal)}">×</b>${aro('t', x.b, nomeT(x.b), paleta(x.b), 'ca-menor', de)}</div>`;
      case 'confronto': return `<div class="ca-miolo ca-vs">${aro('c', x.c, '', pal, '', de)}`+
        `<b class="ca-x" style="${varsDe(pal)}">×</b>${aro('c', x.f, '', pal, '', de)}</div>`;
      case 'placar': return `<div class="ca-miolo ca-placar">${aro('c', x.c, '', pal, 'ca-menor', de)}`+
        `<b class="ca-gols" style="${varsDe(pal)}">${esc(x.gc)}<i>×</i>${esc(x.gf)}</b>${aro('c', x.f, '', pal, 'ca-menor', de)}</div>`;
      case 'anos': {
        const grade = (x.grade || []).map(id => `<span class="ca-g">${marcaDaTorcida(id, nomeT(id))}</span>`).join('');
        return `<div class="ca-miolo ca-anos">`+
          (x.n ? `<div class="ca-selo" style="${varsDe(pal)}"><b>${esc(x.n)}</b><i>${esc(_t('Anos'))}</i></div>` : aro('t', x.id, nomeT(x.id), pal))+
          (grade ? `<div class="ca-grade">${grade}</div>` : '')+`</div>`;
      }
      case 'escudo': return `<div class="ca-miolo ca-um">${aro(x.tipo, x.id, x.tipo === 't' ? nomeT(x.id) : '', pal, 'ca-maior', de)}</div>`;
    }
    return '';
  }
  function htmlDaArte(m){
    const o = TO.mundo.torcida(m.de);
    if(!o || SEM_ARTE.has(m.tipo)) return '';
    const pal = paleta(m.de), ano = anoDe(o), sp = especDaArte(m);
    const arroba = arrobaDe(o);
    const ft = fotoDoPost(m), kf = chaveDaFotoPost(m), url = ft ? (ft.img || fotos.get(kf)) : null;
    const pede = ft && !ft.img;
    return `<figure class="cartaz cz-arte${url ? ' com-foto' : ''}${ft && ft.img ? ' foto-lugar' : ''}" style="${varsDe(pal)}"${pede ? ` data-ca-foto="${esc(kf)}"` : ''}>`+
      tarja(ano, pal, 'esq')+tarja(ano, pal, 'dir')+
      `<div class="ca-papel">`+
        `<img class="ca-foto" alt=""${url ? ` src="${url}"` : ''}><div class="ca-veu"></div>`+
        `<div class="ca-marca-dagua">${marcaDaTorcida(m.de, o.nome)}</div>`+
        `<i class="ca-canto ca-c1"></i><i class="ca-canto ca-c2"></i><i class="ca-canto ca-c3"></i><i class="ca-canto ca-c4"></i>`+
        `<div class="ca-aba"></div>`+
        `<div class="ca-topo">${aro('t', m.de, o.nome, pal, 'ca-brasao')}</div>`+
        titulo(sp.tit, pal)+
        (sp.sub ? `<div class="ca-sub" style="color:${pal.texto}">${esc(sp.sub)}</div>` : '')+
        /* COM A FOTO, O FOCO É A FOTO (dono, 04/10/2026: "em alguns casos
           pode remover os escudos dessa parte inferior pra focar melhor na
           imagem"): sai o escudo que só repete quem aparece na cena — o
           da torcida, o par, o "×" da treta e da faixa tomada; fica o que
           é informação (o placar, o jogo do dia, os anos e as aliadas).
           Sem foto (sem WebGL), os escudos ficam. */
        (()=>{ const mi = sp.miolo || {t:'escudo', tipo:'t', id:m.de};
          const h = htmlDoMiolo(mi, pal, m.de);
          return ft && !ft.img && /^(escudo|vs|par)$/.test(mi.t) ? h.replace('class="ca-miolo ', 'class="ca-miolo ca-so-sem-foto ') : h; })()+
        etiquetas(sp.pins, pal)+
        `<div class="ca-pe"><span>${esc(arroba)}</span><span>${esc('@loja_online_' + arroba.slice(1))}</span></div>`+
      `</div>`+
    `</figure>`;
  }

  /* A IMAGEM É DO JORNAL (dono, 01/10/2026): o placar sai na Gazeta dos
     Sports, a briga no Futebol e Porrada. Post de torcida — o nosso
     resultado, a zoeira da nossa briga — fica só no texto, mesmo o de
     save antigo que já guardou os dados do cartaz. */
  const doJornal = m => (m.card.t === 'jogo' && m.jornal === 'gazeta') ||
                        (m.card.t === 'briga' && m.jornal === 'porrada');
  function html(m){
    if(!m) return '';
    try{
      if(m.card && doJornal(m)){
        if(m.card.t === 'jogo') return htmlDoJogo(m);
        if(m.card.t === 'briga') return htmlDaBriga(m);
        return '';
      }
      /* o post de torcida ganha a arte dela (04/10/2026) */
      if(m.de && !m.jornal) return htmlDaArte(m);
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
        /* (o cartaz e a foto da página do jornal: `fotoDoJornal`) */
        for(const f of document.querySelectorAll(`[data-cz-foto="${CSS.escape(k)}"]`)){
          const im = f.querySelector('.cz-fundo');
          if(im) im.src = url; else f.insertAdjacentHTML('afterbegin', `<img class="cz-fundo" src="${url}" alt="">`);
          f.classList.add('com-foto');
        }
      })
      .catch(()=>{ pedidas.delete(k); });
  }
  /* A FOTO DA PÁGINA DO JORNAL (pedido do dono, 06/10/2026): o post do
     Porrada virou a página do jornal (main.js, `paginaDoPost`), e a foto
     dos bonecos é a foto da matéria — a mesma da arte, pela mesma fila e
     pela mesma chave. Até ela ficar pronta, a imagem da cena. */
  function fotoDoJornal(m){
    if(!m || !m.card || m.card.t !== 'briga' || !doJornal(m)) return '';
    const k = chaveDaFoto(m), foto = fotos.get(k), src = foto || cenaImg(m.card.cena);
    return `<figure class="gz-foto${foto ? ' com-foto' : ''}" data-cz-foto="${esc(k)}">`+
      (src ? `<img class="cz-fundo" src="${src}" alt="">` : '')+`</figure>`;
  }

  let observador = null;
  const porFigura = new WeakMap();
  /* a casca chama depois de pôr o cartaz no DOM */
  /* a foto da arte: o roteiro do post, as cores de cada grupo e, na
     faixa tomada, o pano do rival (que pode estar chegando ainda) */
  const coresDe = id => {
    const o = TO.mundo.torcida(id);
    const cr = o && TO.mundo.coresDaTorcida ? TO.mundo.coresDaTorcida(o) : {};
    return {id, cor:cr.cor, cor2:cr.cor2, cor3:cr.cor3};
  };
  function panoPronto(id, tipo){
    const o = TO.mundo.torcida(id), Pt = TO.patrimonio;
    if(!o || !Pt || !Pt.imagemDaFaixaObj) return Promise.resolve(null);
    const c = Pt.imagemDaFaixaObj(o, tipo === 'bandeira' ? 'bandeira' : 'faixa', 0);
    if(!c) return Promise.resolve(null);
    return new Promise(res => {
      const t0 = Date.now();
      (function v(){ if(!c.pendentes || Date.now() - t0 > 2500) return res(c); setTimeout(v, 80); })();
    });
  }
  function pedirFotoArte(m){
    const k = chaveDaFotoPost(m);
    if(fotos.has(k) || pedidas.has(k)) return;
    const B = TO.diaJogo && TO.diaJogo.bonecos3;
    const ft = fotoDoPost(m);
    if(!B || !B.fotoDaCena || !ft || ft.img) return;
    pedidas.add(k);
    fila = fila.then(() => ft.faixa ? panoPronto(ft.faixa.de, ft.faixa.tipo) : null)
      .then(pano => B.fotoDaCena({cena:ft.cena, semente:k, largura:640, altura:800, faixa:pano, subir:ft.subir,
        grupos:ft.grupos.map(x => Object.assign({}, x, {t:coresDe(x.id)}))}))
      .then(url => {
        pedidas.delete(k);
        if(!url) return;
        fotos.set(k, url);
        if(fotos.size > 80) fotos.delete(fotos.keys().next().value);
        for(const f of document.querySelectorAll(`.cartaz[data-ca-foto="${CSS.escape(k)}"]`)){
          const im = f.querySelector('.ca-foto');
          if(im) im.src = url;
          f.classList.add('com-foto');
        }
      })
      .catch(() => { pedidas.delete(k); });
  }
  function ligar(fig, m){
    if(!fig || !m) return;
    if(fig.classList.contains('cz-arte')){
      if(!fig.dataset.caFoto || fotos.has(chaveDaFotoPost(m))) return;
      if(typeof IntersectionObserver === 'undefined'){ pedirFotoArte(m); return; }
    } else {
      if(!m.card || m.card.t !== 'briga' || !doJornal(m)) return;
      if(fotos.has(chaveDaFoto(m))) return;
    }
    if(typeof IntersectionObserver === 'undefined'){ pedirFoto(fig, m); return; }
    if(!observador) observador = new IntersectionObserver(ents=>{
      for(const e of ents){
        if(!e.isIntersecting) continue;
        observador.unobserve(e.target);
        const mm = porFigura.get(e.target);
        if(mm) e.target.classList.contains('cz-arte') ? pedirFotoArte(mm) : pedirFoto(e.target, mm);
      }
    }, {rootMargin:'200px'});
    porFigura.set(fig, m);
    observador.observe(fig);
  }

  return {html, ligar, fotoDoJornal, fundoDeEstadio, mancheteDoJogo, mancheteDaBriga, especDaArte, fotoDoPost, pedirFotoArte, paleta, ehRival, get fotos(){ return fotos; }};
})();
