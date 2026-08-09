/* =========================================================
   MAPA DA CIDADE (GDD §13)
   ---------------------------------------------------------
   Portado do protótipo antigo (legado/unity/app.js), que já
   tinha resolvido o problema difícil: desenhar 16 bairros ×
   12 quarteirões × 10 lotes sem estourar o DOM. A resposta é
   uma superfície só de canvas, com hit-test por retângulo.

   O desenho é determinístico: o mesmo bairro tem sempre os
   mesmos telhados e a mesma sede no mesmo lote. Quem garante
   isso é o hash FNV-1a sobre o nome — nada de Math.random,
   senão a cidade se remonta a cada redesenho.
   ========================================================= */
window.TO = window.TO || {};

TO.mapa = (function(){
  const U = TO.util;
  const M = () => TO.mundo;

  const TAM      = 1000;   // lado da superfície, em unidades do canvas
  const PAD      = 10;
  const AVENIDA  = 14;     // largura da avenida entre bairros
  const QUARTEIROES = 12;  // por bairro
  const LOTES       = 10;  // por quarteirão

  /* hash FNV-1a: distribuição uniforme e estável entre sessões */
  function hash(txt){
    let h = 2166136261;
    const s = String(txt);
    for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }

  /* =======================================================
     O QUE EXISTE NA CIDADE
     Estádios, a sede de toda torcida de clube daqui (com o
     bar dela em outra zona), o patrimônio do jogador e o
     comércio neutro do GDD.
     ======================================================= */
  const NEUTROS = [
    {tipo:'mercadinho', label:'Mercadinho'},
    {tipo:'posto',      label:'Posto de gasolina'},
    {tipo:'joalheria',  label:'Joalheria'},
    {tipo:'roupas',     label:'Loja de roupas'},
    {tipo:'banco',      label:'Banco'},
    {tipo:'hospital',   label:'Hospital'}
  ];
  /* GDD §13: mapa grande (16 bairros) leva o número cheio; médio, dois
     terços; pequeno, um terço. */
  const QUANTOS = {
    16:{mercadinho:12, posto:3, joalheria:3, roupas:6, banco:6, hospital:3},
    12:{mercadinho:8,  posto:2, joalheria:2, roupas:4, banco:4, hospital:2},
    8: {mercadinho:4,  posto:1, joalheria:1, roupas:2, banco:2, hospital:1}
  };

  const TIPOS_TORCIDA = ['sedes','bares','lojas','subsedes'];
  const TIPOS_NEUTRO  = NEUTROS.map(n=>n.tipo);

  function filtros(E){
    if(!E.mapaFiltros){
      E.mapaFiltros = {estadios:true, sedes:true, bares:true, lojas:true,
                       subsedes:true};
      for(const t of TIPOS_NEUTRO) E.mapaFiltros[t] = true;
    }
    return E.mapaFiltros;
  }

  function estruturas(E){
    const cidade = M().cidade(E.torcida.mapa);
    if(!cidade) return [];
    const lista = [];
    const bairros = cidade.bairros || [];
    const temBairro = nome => bairros.some(b=>b.nome === nome);

    /* --- estádios --- */
    for(const e of M().estadiosEm(cidade.id)){
      if(!e.bairro || !temBairro(e.bairro)) continue;
      const donos = (e.mandantes||[]).map(id=>(M().time(id)||{}).nome).filter(Boolean);
      lista.push({bairro:e.bairro, tipo:'estadio',
                  label:`Estádio · ${e.nome}`+(donos.length?` (${donos.join(', ')})`:'')});
    }

    /* --- sedes das torcidas da praça, e o bar de cada uma --- */
    for(const o of M().torcidasEm(cidade.id)){
      if(!o.bairroSede || !temBairro(o.bairroSede)) continue;
      const nossa = o.id === E.torcida.id;
      const clube = M().time(o.clubeId);
      const cor = (o.cores && o.cores[0]) || '#a51f1c';
      lista.push({bairro:o.bairroSede, tipo:'sede', nossa, cor,
                  label:`Sede · ${o.nome}${clube?` (${clube.nome})`:''}`});
      /* GDD §7.2: o bar fica em zona diferente da sede. O da nossa torcida
         sai do patrimônio; o das outras é sorteado com semente fixa. */
      if(nossa) continue;
      const zonaSede = (bairros.find(b=>b.nome===o.bairroSede)||{}).zona;
      const fora = bairros.filter(b=>b.zona !== zonaSede);
      if(!fora.length) continue;
      const b = fora[hash(o.id) % fora.length];
      lista.push({bairro:b.nome, tipo:'bar', cor, label:`Bar · ${o.nome}`});
    }

    /* --- o que é nosso --- */
    const p = TO.financeiro.patrimonio(E);
    for(const b of p.bares)
      if(b.bairro && temBairro(b.bairro))
        lista.push({bairro:b.bairro, tipo:'bar-nosso', nossa:true,
                    label:`Nosso bar (nível ${b.nivel})`});
    for(const l of p.lojas)
      if(l.bairro && temBairro(l.bairro))
        lista.push({bairro:l.bairro, tipo:'loja-nossa', nossa:true,
                    label:`Nossa loja (nível ${l.nivel})`});
    for(const s of p.subsedes)
      if(s.bairro && temBairro(s.bairro))
        lista.push({bairro:s.bairro, tipo:'subsede', nossa:true,
                    label:'Nossa subsede'});

    /* --- comércio neutro, espalhado com semente fixa --- */
    const quantos = QUANTOS[bairros.length] || {};
    for(const n of NEUTROS){
      const q = quantos[n.tipo] || 0;
      if(q <= 0) continue;
      bairros.map(b=>({b, k:hash(`${n.tipo}|${b.nome}`)}))
             .sort((a,x)=>a.k-x.k).slice(0, q)
             .forEach(({b})=>lista.push({bairro:b.nome, tipo:n.tipo,
                                         label:n.label, neutro:true}));
    }
    return lista;
  }

  function visiveis(E, lista){
    const f = filtros(E);
    return lista.filter(s=>{
      if(s.tipo === 'estadio') return f.estadios;
      if(s.tipo === 'sede')    return f.sedes;
      if(s.tipo === 'bar' || s.tipo === 'bar-nosso') return f.bares;
      if(s.tipo === 'loja-nossa') return f.lojas;
      if(s.tipo === 'subsede')    return f.subsedes;
      if(s.neutro) return !!f[s.tipo];
      return true;
    });
  }

  /* =======================================================
     ONDE CADA COISA CAI DENTRO DO BAIRRO
     O estádio fica sempre no quarteirão do meio; o resto se
     espalha por quarteirão e lote, sem empilhar num canto só.
     ======================================================= */
  const ORDEM = {estadio:0, sede:1, 'bar-nosso':2, 'loja-nossa':2, subsede:2, bar:3};

  function especiaisDoBairro(nome, todas, visiveis){
    const itens = todas.filter(s=>s.bairro === nome).slice().sort((a,b)=>{
      const oa = ORDEM[a.tipo] ?? 9, ob = ORDEM[b.tipo] ?? 9;
      return (oa - ob) || ((a.nossa?0:1) - (b.nossa?0:1));
    });
    const fora = {};
    /* Os quarteirões são reservados por TODOS os itens, visíveis ou não.
       Se o escondido liberasse a vaga, desligar um filtro empurraria de
       lugar quem vem atrás dele na fila — e o mapa "se remontaria". */
    const ocupado = new Set([6]);
    itens.forEach((item, i)=>{
      const aparece = !visiveis || visiveis.has(item);
      if(item.tipo === 'estadio'){
        if(aparece) fora[6] = Object.assign({}, item, {lote:-1});
        return;
      }
      let q = hash(`${nome}|q|${item.tipo}|${item.label}|${i}`) % QUARTEIROES;
      let volta = 0;
      while(ocupado.has(q) && volta++ < QUARTEIROES) q = (q+1) % QUARTEIROES;
      if(volta >= QUARTEIROES) return;
      ocupado.add(q);
      if(!aparece) return;
      fora[q] = Object.assign({}, item,
        {lote: hash(`${nome}|l|${item.tipo}|${item.label}|${i}`) % LOTES});
    });
    return fora;
  }

  /* =======================================================
     O MODELO
     Layout em cruz: Norte em cima, Sul embaixo, Oeste e Leste
     nos flancos. O número de bairros por zona decide a grade.
     ======================================================= */
  function metrica(cols, rows){
    const util = TAM - PAD*2;
    const larg = (util - AVENIDA*(cols-1)) / cols;
    const alt  = (util - AVENIDA*(rows-1)) / rows;
    return {
      larg, alt,
      caixa:(row, col)=>({x: PAD + (col-1)*(larg+AVENIDA),
                          y: PAD + (row-1)*(alt+AVENIDA), w:larg, h:alt}),
      vaoX: c => PAD + c*larg + (c-1)*AVENIDA,
      vaoY: r => PAD + r*alt  + (r-1)*AVENIDA
    };
  }

  function modelo(E){
    const cidade = M().cidade(E.torcida.mapa);
    if(!cidade || !(cidade.bairros||[]).length) return null;
    const todas = estruturas(E);
    /* O lugar de cada coisa sai da lista COMPLETA, nunca da filtrada: se o
       índice dependesse do filtro, desligar "mercadinho" mudaria de lote
       metade da cidade. O filtro só decide o que aparece. */
    const mostra = new Set(visiveis(E, todas).map(x=>x));

    const porZona = {Norte:[], Sul:[], Leste:[], Oeste:[]};
    for(const b of cidade.bairros) (porZona[b.zona] || porZona.Norte).push(b);

    const porLado = porZona.Norte.length || Math.ceil(cidade.bairros.length/4);
    let cols, rows, onde;
    if(porLado === 4){
      cols = 4; rows = 6;
      onde = {
        Norte: i=>({row: Math.floor(i/2)+1, col:(i%2)+2}),
        Sul:   i=>({row: Math.floor(i/2)+5, col:(i%2)+2}),
        Oeste: i=>({row: Math.floor(i/2)+3, col:(i%2)+1}),
        Leste: i=>({row: Math.floor(i/2)+3, col:(i%2)+3})
      };
    }else if(porLado === 3){
      cols = 5; rows = 5;
      onde = {Norte:i=>({row:1, col:i+2}), Sul:i=>({row:5, col:i+2}),
              Oeste:i=>({row:i+2, col:1}), Leste:i=>({row:i+2, col:5})};
    }else{
      cols = 2; rows = 4;
      onde = {Norte:i=>({row:1, col:i+1}), Sul:i=>({row:4, col:i+1}),
              Oeste:i=>({row:i+2, col:1}), Leste:i=>({row:i+2, col:2})};
    }

    const m = metrica(cols, rows);
    /* nos mapas grandes, um quarteirão de esquina some pra abrir a via */
    const esconde = porLado === 4
      ? {'Oeste:1':11, 'Oeste:3':2, 'Leste:0':9, 'Leste:2':0} : {};

    const celulas = [];
    for(const zona of ['Norte','Sul','Oeste','Leste'])
      porZona[zona].forEach((bairro, i)=>{
        const pos = onde[zona](i);
        celulas.push(Object.assign({}, pos, m.caixa(pos.row, pos.col), {
          bairro, zona, i,
          escondido: esconde[`${zona}:${i}`],
          especiais: especiaisDoBairro(bairro.nome, todas, mostra)
        }));
      });

    return {tam:TAM, cols, rows, porLado, m, celulas, cidade,
            total:todas.length, mostrando:mostra.size,
            alvos:[], sob:null};
  }

  /* =======================================================
     DESENHO
     ======================================================= */
  const CLASSE = {
    'Nobre':        {tinta:'rgba(160,125,44,.16)', rot:'#ffd98a'},
    'Classe Alta':  {tinta:'rgba(160,125,44,.14)', rot:'#ffd98a'},
    'Classe Média': {tinta:'rgba(130,140,150,.10)', rot:'#cfd0d0'},
    'Classe Baixa': {tinta:'rgba(130,88,54,.14)',  rot:'#c9b59a'},
    'Favela':       {tinta:'rgba(145,72,52,.16)',  rot:'#bd8772'}
  };
  const classeDe = c => CLASSE[c] || CLASSE['Classe Média'];

  /* telhados vistos de cima: barro, amianto, ardósia, metal */
  const TELHADOS = [
    {bg:'#a64a32', risco:'#6a2a18'}, {bg:'#8a4030', risco:'#5a221a'},
    {bg:'#7a4a3a', risco:'#4a2a20'}, {bg:'#6a504a', risco:'#3a2a25'},
    {bg:'#3f4a55', risco:'#1f262e'}, {bg:'#56524a', risco:'#2a2520'},
    {bg:'#5a4030', risco:'#2c2018'}
  ];

  const PINO = {
    estadio:      {cor:'#b8322c', letra:'E'},
    sede:         {cor:'#c72a25', letra:'S'},
    bar:          {cor:'#3f7d3a', letra:'B'},
    'bar-nosso':  {cor:'#3f8d48', letra:'B'},
    'loja-nossa': {cor:'#2f6ea8', letra:'L'},
    subsede:      {cor:'#7a55b0', letra:'S'},
    mercadinho:   {cor:'#4f9a50', letra:'M'},
    posto:        {cor:'#d68425', letra:'P'},
    joalheria:    {cor:'#9160c9', letra:'J'},
    roupas:       {cor:'#2d7eb6', letra:'R'},
    banco:        {cor:'#5a78c5', letra:'$'},
    hospital:     {cor:'#d1d6e0', letra:'H', escuro:true}
  };
  const pinoDe = it => PINO[it && it.tipo] || {cor:'#b8322c', letra:'?'};

  function arredondado(ctx, x, y, w, h, r){
    const rr = Math.max(0, Math.min(r, w/2, h/2));
    ctx.beginPath();
    ctx.moveTo(x+rr, y);          ctx.lineTo(x+w-rr, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+rr);
    ctx.lineTo(x+w, y+h-rr);      ctx.quadraticCurveTo(x+w, y+h, x+w-rr, y+h);
    ctx.lineTo(x+rr, y+h);        ctx.quadraticCurveTo(x, y+h, x, y+h-rr);
    ctx.lineTo(x, y+rr);          ctx.quadraticCurveTo(x, y, x+rr, y);
    ctx.closePath();
  }

  /* opc: {semPinos, semNomes} — a planta limpa, pra levar num upscaler */
  function desenhar(mo, canvas, opc){
    if(!mo || !canvas) return;
    opc = opc || {};
    const dpr = canvas._dpr || 1;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, mo.tam, mo.tam);
    mo.alvos = [];
    mo.opc = opc;
    /* Os pontos de interesse vão numa camada por cima de TUDO. Desenhados
       no meio da varredura, o lote vizinho — e até o quarteirão vizinho —
       passava por cima do pino, que estoura a borda do próprio lote. */
    mo.camadaPinos = [];
    fundo(ctx, mo);
    decoracao(ctx, mo);
    vias(ctx, mo);
    for(const c of mo.celulas) bairro(ctx, mo, c);
    rotatoria(ctx, mo);
    if(!opc.semPinos) for(const f of mo.camadaPinos) f(ctx);
    realce(ctx, mo);
  }

  function fundo(ctx, mo){
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, mo.tam, mo.tam);
    ctx.fillStyle = '#1c1c1f';
    ctx.fillRect(PAD-4, PAD-4, mo.tam-(PAD-4)*2, mo.tam-(PAD-4)*2);
  }

  /* praia de um lado, rodovia e mato do outro: a cidade tem borda */
  function decoracao(ctx, mo){
    const praia = r=>{
      const areia = r.w*0.38, agua = r.x + areia;
      let g = ctx.createLinearGradient(r.x, r.y, agua, r.y);
      g.addColorStop(0, '#c6a371'); g.addColorStop(1, '#d7b985');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, areia, r.h);
      g = ctx.createLinearGradient(agua, r.y, r.x+r.w, r.y);
      g.addColorStop(0, '#2e617d'); g.addColorStop(.55, '#1f5275');
      g.addColorStop(1, '#153c5d');
      ctx.fillStyle = g; ctx.fillRect(agua, r.y, r.w-areia, r.h);
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
      for(let y=r.y+20; y<r.y+r.h; y+=28){
        ctx.beginPath(); ctx.moveTo(agua+10, y);
        ctx.lineTo(r.x+r.w-6, y-5); ctx.stroke();
      }
    };
    const rodovia = r=>{
      const g = ctx.createRadialGradient(r.x+r.w*.22, r.y+r.h*.38, 10,
                                         r.x+r.w*.22, r.y+r.h*.38, r.w);
      g.addColorStop(0, '#315d2b'); g.addColorStop(.58, '#1e3c1c');
      g.addColorStop(1, '#14271a');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.save();
      ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      const traco = ()=>{
        ctx.beginPath();
        ctx.moveTo(r.x-20, r.y+r.h+12);
        ctx.lineTo(r.x+r.w*.55, r.y+r.h*.48);
        ctx.lineTo(r.x+r.w+22, r.y-10);
        ctx.stroke();
      };
      ctx.strokeStyle = '#292a2c'; ctx.lineWidth = 28; traco();
      ctx.strokeStyle = 'rgba(230,188,74,.72)'; ctx.lineWidth = 2;
      ctx.setLineDash([16,18]); traco(); ctx.setLineDash([]);
      ctx.restore();
      for(let i=0;i<8;i++){
        const s = hash(`arvore-${i}-${Math.round(r.x)}-${Math.round(r.y)}`);
        ctx.fillStyle = s % 2 ? '#376c30' : '#285723';
        ctx.beginPath();
        ctx.arc(r.x + (s % Math.max(1, r.w)), r.y + ((s>>>8) % Math.max(1, r.h)),
                5 + (s % 5), 0, Math.PI*2);
        ctx.fill();
      }
    };
    if(mo.porLado === 4){
      const alto = mo.m.caixa(1, mo.cols), baixo = mo.m.caixa(mo.rows-1, mo.cols);
      const h2 = mo.m.alt*2 + AVENIDA;
      praia({x:alto.x,  y:alto.y,  w:alto.w,  h:h2});
      praia({x:baixo.x, y:baixo.y, w:baixo.w, h:h2});
      const r = mo.m.caixa(mo.rows-1, 1);
      rodovia({x:r.x, y:r.y, w:mo.m.larg, h:h2});
    }else if(mo.porLado === 3){
      praia(mo.m.caixa(1, mo.cols));
      praia(mo.m.caixa(mo.rows, mo.cols));
      rodovia(mo.m.caixa(mo.rows, 1));
    }
  }

  /* avenidas e faixas de pedestre só onde há bairro dos dois lados */
  function vias(ctx, mo){
    const {cols, rows, m} = mo;
    const folga = 42;
    const tem = new Set(mo.celulas.map(c=>`${c.row}|${c.col}`));
    const cidade = (r,c)=>tem.has(`${r}|${c}`);

    const faixa = (x1,y1,x2,y2)=>{
      if(Math.hypot(x2-x1, y2-y1) < 24) return;
      ctx.strokeStyle = 'rgba(0,0,0,.38)'; ctx.lineWidth = 4;
      ctx.setLineDash([17,19]);
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      ctx.strokeStyle = 'rgba(230,188,74,.72)'; ctx.lineWidth = 2;
      ctx.setLineDash([15,21]);
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      ctx.setLineDash([]);
    };
    for(let c=1;c<cols;c++){
      const meio = m.vaoX(c) + AVENIDA/2;
      for(let r=1;r<=rows;r++){
        if(!cidade(r,c) && !cidade(r,c+1)) continue;
        faixa(meio, r===1 ? PAD : m.vaoY(r-1)+AVENIDA+folga,
              meio, r===rows ? mo.tam-PAD : m.vaoY(r)-folga);
      }
    }
    for(let r=1;r<rows;r++){
      const meio = m.vaoY(r) + AVENIDA/2;
      for(let c=1;c<=cols;c++){
        if(!cidade(r,c) && !cidade(r+1,c)) continue;
        faixa(c===1 ? PAD : m.vaoX(c-1)+AVENIDA+folga, meio,
              c===cols ? mo.tam-PAD : m.vaoX(c)-folga, meio);
      }
    }

    const n = 5, larg = 3.6, vao = 3.2, comp = n*larg + (n-1)*vao, sobra = 4;
    const zebraV = (xc, y, s)=>{
      const y0 = y + (AVENIDA + sobra*2 - comp)/2;
      for(let i=0;i<n;i++){
        ctx.globalAlpha = .88 - ((s+i)%3)*.05;
        ctx.fillStyle = 'rgba(235,232,216,1)';
        ctx.fillRect(xc-11, y0 + i*(larg+vao), 22, larg);
      }
      ctx.globalAlpha = 1;
    };
    const zebraH = (x, yc, s)=>{
      const x0 = x + (AVENIDA + sobra*2 - comp)/2;
      for(let i=0;i<n;i++){
        ctx.globalAlpha = .88 - ((s+i)%3)*.05;
        ctx.fillStyle = 'rgba(235,232,216,1)';
        ctx.fillRect(x0 + i*(larg+vao), yc-11, larg, 22);
      }
      ctx.globalAlpha = 1;
    };
    for(let c=1;c<cols;c++){
      const vx = m.vaoX(c) + AVENIDA/2;
      for(let r=1;r<rows;r++){
        const hy = m.vaoY(r) + AVENIDA/2, s = c*11 + r*7;
        if(cidade(r,c) || cidade(r,c+1)){
          zebraV(vx-22, m.vaoY(r)-sobra, s); zebraV(vx+22, m.vaoY(r)-sobra, s+1);
        }
        if(cidade(r,c) || cidade(r+1,c)){
          zebraH(m.vaoX(c)-sobra, hy-22, s+2); zebraH(m.vaoX(c)-sobra, hy+22, s+3);
        }
      }
    }
  }

  function bairro(ctx, mo, cel){
    const est = classeDe(cel.bairro.classe);
    ctx.fillStyle = '#2c2c2e'; ctx.fillRect(cel.x, cel.y, cel.w, cel.h);
    ctx.fillStyle = est.tinta; ctx.fillRect(cel.x, cel.y, cel.w, cel.h);
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1;
    ctx.strokeRect(cel.x+.5, cel.y+.5, cel.w-1, cel.h-1);

    const p = 5, g = 5;
    const bw = (cel.w - p*2 - g*2)/3, bh = (cel.h - p*2 - g*3)/4;
    for(let q=0;q<QUARTEIROES;q++){
      if(q === cel.escondido) continue;
      const x = cel.x + p + (q%3)*(bw+g);
      const y = cel.y + p + Math.floor(q/3)*(bh+g);
      quarteirao(ctx, mo, cel, q, x, y, bw, bh, cel.especiais[q]);
    }

    if(mo.opc && mo.opc.semNomes) return;
    const rot = String(cel.bairro.nome||'').toUpperCase();
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let tam = 16;
    ctx.font = `900 ${tam}px Arial, sans-serif`;
    while(ctx.measureText(rot).width > cel.w-18 && tam > 8){
      tam--; ctx.font = `900 ${tam}px Arial, sans-serif`;
    }
    /* o nome do bairro é referência, não protagonista: fica atrás do que
       importa, com contorno fraco e transparência alta */
    ctx.globalAlpha = 0.34;
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.55)';
    ctx.fillStyle = est.rot;
    ctx.strokeText(rot, cel.x+cel.w/2, cel.y+cel.h/2);
    ctx.fillText (rot, cel.x+cel.w/2, cel.y+cel.h/2);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function quarteirao(ctx, mo, cel, q, x, y, w, h, esp){
    const info = `${cel.bairro.nome} · quarteirão ${q+1}`+(esp?` · ${esp.label}`:'');
    mo.alvos.push({x, y, w, h, info, tipo: esp ? esp.tipo : 'residencial',
                   bairro:cel.bairro.nome, zona:cel.zona});

    ctx.fillStyle = '#252528'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#151517'; ctx.lineWidth = 1;
    ctx.strokeRect(x+.5, y+.5, w-1, h-1);
    if(esp && esp.tipo === 'estadio'){
      estadio(ctx, x, y, w, h, esp);
      const r = Math.max(15, Math.min(24, Math.min(w,h)*.28));
      mo.camadaPinos.push(c=>pino(c, x+w/2, y+h/2, r, esp));
      return;
    }

    const vao = 1;
    const lw = (w - 2 - vao*4)/5, lh = (h - 2 - vao)/2;
    const alvo = esp ? esp.lote : -1;
    for(let i=0;i<LOTES;i++){
      const lx = x + 1 + (i%5)*(lw+vao);
      const ly = y + 1 + Math.floor(i/5)*(lh+vao);
      if(esp && i === alvo) lote(ctx, mo, lx, ly, lw, lh, esp, info);
      else casa(ctx, cel.bairro.nome, q, i, lx, ly, lw, lh);

    }
  }

  function casa(ctx, nome, q, i, x, y, w, h){
    const s = hash(`casa|${nome}|${q}|${i}`);
    const t = TELHADOS[s % TELHADOS.length];
    ctx.fillStyle = t.bg; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1;
    ctx.strokeRect(x+.5, y+.5, w-1, h-1);
    ctx.strokeStyle = t.risco; ctx.globalAlpha = .75;
    ctx.beginPath();
    if((s>>>3) % 2){ ctx.moveTo(x+w*.5, y+2); ctx.lineTo(x+w*.5, y+h-2); }
    else           { ctx.moveTo(x+2, y+h*.5); ctx.lineTo(x+w-2, y+h*.5); }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function lote(ctx, mo, x, y, w, h, item, info){
    const p = pinoDe(item);
    const bg = item.cor && (item.tipo==='sede' || item.tipo==='bar') ? item.cor : p.cor;
    /* o terreno fica no lugar dele, na varredura normal */
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x, y+h*.55, w, h*.45);
    ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.strokeRect(x+.5, y+.5, w-1, h-1);
    /* o pino, que transborda o lote, sobe pra camada de cima */
    const r = Math.max(8, Math.min(12, w*.42));
    mo.camadaPinos.push(c=>{
      c.fillStyle = bg; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x, y+h*.55, w, h*.45);
      c.strokeStyle = 'rgba(0,0,0,.65)'; c.strokeRect(x+.5, y+.5, w-1, h-1);
      pino(c, x+w-3, y+3, r, item);
    });
    mo.alvos.push({x, y, w, h, info, tipo:item.tipo, item});
  }

  function estadio(ctx, x, y, w, h, item){
    const g = ctx.createLinearGradient(x, y, x, y+h);
    g.addColorStop(0, '#53231b'); g.addColorStop(1, '#26100d');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#b8322c'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x+1.5, y+1.5, w-3, h-3);
    ctx.fillStyle = '#173d1e';
    arredondado(ctx, x+w*.22, y+h*.24, w*.56, h*.52, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1;
    ctx.strokeRect(x+w*.31, y+h*.34, w*.38, h*.32);
  }

  /* =======================================================
     OS ÍCONES
     Cada desenho vive num quadrado de -1 a 1, escalado pelo
     raio do pino. Traço grosso e forma cheia, porque no zoom
     de 80% o ícone tem doze pixels e não pode virar borrão.
     ======================================================= */
  function tracar(ctx, pontos, fechar){
    ctx.beginPath();
    pontos.forEach(([x,y], i)=> i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    if(fechar) ctx.closePath();
  }

  const ICONE = {
    /* estádio: a elipse da arquibancada com o gramado dentro */
    estadio(c){
      c.beginPath(); c.ellipse(0, 0, .92, .70, 0, 0, Math.PI*2); c.fill();
      c.save(); c.fillStyle = 'rgba(0,0,0,.55)';
      c.beginPath(); c.ellipse(0, 0, .50, .34, 0, 0, Math.PI*2); c.fill();
      c.restore();
      c.lineWidth = .17;
      c.beginPath(); c.moveTo(0,-.34); c.lineTo(0,.34); c.stroke();
    },
    /* sede: bandeirão no mastro — é o que a torcida põe na fachada */
    sede(c){
      c.lineWidth = .22; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-.55,-.85); c.lineTo(-.55,.9); c.stroke();
      tracar(c, [[-.55,-.8],[.85,-.45],[-.55,-.05]], true); c.fill();
    },
    /* bar: o copo americano, com a bebida pela metade */
    bar(c){
      tracar(c, [[-.5,-.75],[.5,-.75],[.33,.8],[-.33,.8]], true); c.fill();
      c.save(); c.fillStyle = 'rgba(255,255,255,.45)';
      tracar(c, [[-.44,-.28],[.44,-.28],[.33,.8],[-.33,.8]], true); c.fill();
      c.restore();
    },
    /* loja: a camisa pendurada */
    loja(c){
      tracar(c, [[-.85,-.32],[-.3,-.72],[-.12,-.5],[.12,-.5],[.3,-.72],
                 [.85,-.32],[.5,.02],[.5,.8],[-.5,.8],[-.5,.02]], true);
      c.fill();
    },
    /* subsede: o prédio de dois andares com janela acesa */
    subsede(c){
      tracar(c, [[-.75,-.6],[.75,-.6],[.75,.85],[-.75,.85]], true); c.fill();
      c.save(); c.fillStyle = 'rgba(0,0,0,.5)';
      for(const [x,y] of [[-.42,-.3],[.06,-.3],[-.42,.16],[.06,.16]])
        c.fillRect(x, y, .36, .3);
      c.restore();
    },
    /* mercadinho: o carrinho */
    mercadinho(c){
      c.lineWidth = .2; c.lineCap = 'round'; c.lineJoin = 'round';
      tracar(c, [[-.85,-.6],[-.5,-.6],[-.2,.35],[.72,.35]]);
      c.stroke();
      tracar(c, [[-.38,-.2],[.9,-.2],[.72,.35],[-.2,.35]], true); c.fill();
      c.beginPath(); c.arc(-.05,.72,.16,0,Math.PI*2); c.fill();
      c.beginPath(); c.arc(.6,.72,.16,0,Math.PI*2); c.fill();
    },
    /* posto: a bomba de combustível com a mangueira */
    posto(c){
      tracar(c, [[-.8,-.75],[.15,-.75],[.15,.85],[-.8,.85]], true); c.fill();
      c.save(); c.fillStyle = 'rgba(0,0,0,.5)';
      c.fillRect(-.62,-.55,.6,.42); c.restore();
      c.lineWidth = .19; c.lineCap = 'round';
      tracar(c, [[.15,-.35],[.62,-.35],[.62,.5]]); c.stroke();
    },
    /* joalheria: o brilhante lapidado */
    joalheria(c){
      tracar(c, [[0,-.8],[.85,-.15],[0,.85],[-.85,-.15]], true); c.fill();
      c.save(); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = .13;
      tracar(c, [[-.85,-.15],[.85,-.15]]); c.stroke();
      tracar(c, [[-.4,-.15],[0,-.8],[.4,-.15],[0,.85]]); c.stroke();
      c.restore();
    },
    /* roupas: o cabide */
    roupas(c){
      c.lineWidth = .2; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.arc(0,-.5,.22,Math.PI*0.15,Math.PI*0.85,true); c.stroke();
      tracar(c, [[0,-.28],[0,-.05],[-.88,.5],[.88,.5],[0,-.05]]); c.stroke();
    },
    /* banco: as colunas do frontão */
    banco(c){
      tracar(c, [[0,-.85],[.95,-.3],[-.95,-.3]], true); c.fill();
      for(const x of [-.62,-.2,.22]) c.fillRect(x,-.15,.3,.75);
      c.fillRect(-.95,.62,1.9,.26);
    },
    /* hospital: a cruz */
    hospital(c){
      c.fillRect(-.28,-.85,.56,1.7);
      c.fillRect(-.85,-.28,1.7,.56);
    }
  };
  ICONE['bar-nosso']  = ICONE.bar;
  ICONE['loja-nossa'] = ICONE.loja;

  function pino(ctx, cx, cy, r, item){
    const p = pinoDe(item);
    const desenho = ICONE[item && item.tipo];
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fillStyle = p.cor; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.70)'; ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.stroke();

    const tinta = p.escuro ? '#101010' : '#fff';
    if(desenho){
      ctx.translate(cx, cy);
      ctx.scale(r*0.62, r*0.62);
      ctx.fillStyle = tinta; ctx.strokeStyle = tinta;
      ctx.lineJoin = 'round';
      desenho(ctx);
    }else{
      ctx.fillStyle = tinta;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.max(7, r*.95)}px Arial, sans-serif`;
      ctx.fillText(p.letra, cx, cy+.5);
    }
    ctx.restore();
  }

  function rotatoria(ctx, mo){
    if(mo.porLado < 3) return;
    const c = mo.tam/2;
    ctx.save();
    ctx.beginPath(); ctx.arc(c, c, 45, 0, Math.PI*2);
    ctx.fillStyle = '#242426'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#19191b'; ctx.stroke();
    const g = ctx.createRadialGradient(c-8, c-9, 4, c, c, 35);
    g.addColorStop(0, '#3d7835'); g.addColorStop(1, '#17351a');
    ctx.beginPath(); ctx.arc(c, c, 32, 0, Math.PI*2);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function realce(ctx, mo){
    const a = mo.sob;
    if(!a) return;
    ctx.save();
    const casa = a.tipo === 'residencial';
    ctx.strokeStyle = casa ? 'rgba(245,245,230,.65)' : 'rgba(213,58,49,.95)';
    ctx.lineWidth = casa ? 2 : 3;
    ctx.setLineDash(casa ? [5,4] : []);
    ctx.strokeRect(a.x-1.5, a.y-1.5, a.w+3, a.h+3);
    ctx.restore();
  }

  /* =======================================================
     A PLANTA EM IMAGEM
     Rende o mapa num canvas fora da tela, no tamanho que se
     pedir. Serve pra levar a planta pra um upscaler e voltar
     com a cidade pintada, como foi feito com a foto aérea dos
     arredores. Sem pino e sem nome de bairro, que é o que a IA
     estraga.
     ======================================================= */
  function paraImagem(E, opc){
    opc = opc || {};
    const lado = opc.lado || 2048;
    const mo = modelo(E);
    if(!mo) return null;
    const cv = document.createElement('canvas');
    cv.width = lado; cv.height = lado;
    cv._dpr = lado / TAM;
    desenhar(mo, cv, {semPinos: opc.semPinos !== false,
                      semNomes: opc.semNomes !== false});
    return cv;
  }

  function baixarImagem(E, opc){
    const cv = paraImagem(E, opc);
    if(!cv) return null;
    const cidade = M().cidade(E.torcida.mapa) || {id:'mapa'};
    const nome = (opc && opc.nome) ||
      `mapa-${cidade.id}-${cv.width}.png`;
    const a = document.createElement('a');
    a.download = nome;
    a.href = cv.toDataURL('image/png');
    a.click();
    return nome;
  }

  const alvoEm = (mo, x, y)=>{
    for(let i=mo.alvos.length-1;i>=0;i--){
      const a = mo.alvos[i];
      if(x>=a.x && x<=a.x+a.w && y>=a.y && y<=a.y+a.h) return a;
    }
    return null;
  };

  return {TAM, PAD, AVENIDA, QUARTEIROES, LOTES,
          NEUTROS, TIPOS_TORCIDA, TIPOS_NEUTRO,
          hash, filtros, estruturas, modelo, desenhar, alvoEm, pinoDe, classeDe,
          paraImagem, baixarImagem,
          ICONE};
})();
