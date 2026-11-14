/* =========================================================
   MAPA DA CIDADE — O MODELO (GDD §13)
   ---------------------------------------------------------
   Isto já foi um renderizador: 16 bairros × 12 quarteirões ×
   10 lotes numa superfície só de canvas, com hit-test por
   retângulo. A tela do mapa foi descontinuada e o desenho saiu
   inteiro; o que ficou é o MODELO, que é o que o resto do jogo
   sempre consultou.

   O modelo é determinístico: o mesmo bairro tem sempre a mesma
   sede no mesmo lote. Quem garante isso é o hash FNV-1a sobre
   o nome — nada de Math.random, senão a cidade se remontaria a
   cada partida carregada.

   Ele responde a três perguntas, e é por elas que os dados de
   `dados/cidade_mapa*.js` continuam no jogo:
     · em que BAIRRO um ponto cai (e portanto qual cena de rua
       a briga abre, pela classe do bairro);
     · onde ficam SEDE, SUBSEDE, BAR e ESTÁDIO de cada torcida;
     · que ESTÁDIO recebe cada jogo.
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

  /* =======================================================
     A COR QUE SE LÊ SOBRE A COR DA TORCIDA

     Na sede o fundo é a cor principal e a sigla é a secundária. Só que
     "secundária" nem sempre contrasta — a Gaviões é preta no manto e no
     calção, e preto sobre preto não se lê. Então a sigla é a primeira
     cor dela que se separa do fundo: o calção, depois a linha da camisa.
     Se nenhuma servir (quatro torcidas em 140), cai no preto ou branco
     pela luminância, que é a única saída honesta — inventar uma cor que
     não é dela seria pior.

     Isto sobreviveu ao corte do desenho porque não é desenho: é um
     campo do MODELO (`corSigla`), lido por `estruturas`, e a cena de
     briga usa a mesma ideia pras siglas dos bondes.
     ======================================================= */
  function rgbDe(h){
    const s = String(h||'').replace('#','');
    const t = s.length === 3 ? s.split('').map(c=>c+c).join('') : s;
    const v = parseInt(t, 16);
    return isNaN(v) ? [138,138,138] : [(v>>16)&255, (v>>8)&255, v&255];
  }
  const luz = h => {
    const c = rgbDe(h);
    return (0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]) / 255;
  };
  const SEPARA = 0.22;   // diferença de luminância que ainda se lê de longe
  function corQueLeSobre(fundo, o){
    const lf = luz(fundo);
    for(const c of [(o.cores||[])[1], o.detalhe])
      if(c && Math.abs(luz(c) - lf) >= SEPARA) return c;
    return lf > 0.55 ? '#151515' : '#f2f2f2';
  }

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
      lista.push({bairro:e.bairro, tipo:'estadio', id:e.id, cap:e.capacidade||0,
                  mandantes:e.mandantes||[], nomeEstadio:e.nome,
                  label:`Estádio · ${e.nome}`+(donos.length?` (${donos.join(', ')})`:'')});
    }

    /* --- sedes das torcidas da praça, e o bar de cada uma --- */
    for(const o of M().torcidasEm(cidade.id)){
      if(!o.bairroSede || !temBairro(o.bairroSede)) continue;
      const nossa = o.id === E.torcida.id;
      const clube = M().time(o.clubeId);
      const cor = (o.cores && o.cores[0]) || '#a51f1c';
      /* a sede é o escudo da torcida no mapa: bola na cor principal dela,
         com a sigla dela no meio na cor secundária */
      lista.push({bairro:o.bairroSede, tipo:'sede', nossa, cor, torcida:o.id,
                  sigla: M().siglaTorcida(o), corSigla: corQueLeSobre(cor, o),
                  label:`Sede · ${o.nome}${clube?` (${clube.nome})`:''}`});
      /* GDD §7.2: o bar fica em zona diferente da sede. O da nossa torcida
         sai do patrimônio; o das outras é sorteado com semente fixa. */
      if(nossa) continue;
      const zonaSede = (bairros.find(b=>b.nome===o.bairroSede)||{}).zona;
      const fora = bairros.filter(b=>b.zona !== zonaSede);
      if(!fora.length) continue;
      const b = fora[hash(o.id) % fora.length];
      lista.push({bairro:b.nome, tipo:'bar', cor, torcida:o.id,
                  label:`Bar · ${o.nome}`});
    }

    /* --- o que é nosso --- */
    const p = TO.financeiro.patrimonio(E);
    /* os nossos também levam o id: quem procura ponto casa por id, e o
       nosso bar é o único bar da nossa torcida no mapa */
    for(const b of p.bares)
      if(b.bairro && temBairro(b.bairro))
        lista.push({bairro:b.bairro, tipo:'bar-nosso', nossa:true,
                    torcida:E.torcida.id,
                    label:`Nosso bar (nível ${b.nivel})`});
    for(const l of p.lojas)
      if(l.bairro && temBairro(l.bairro))
        lista.push({bairro:l.bairro, tipo:'loja-nossa', nossa:true,
                    label:`Nossa loja (nível ${l.nivel})`});
    for(const s of p.subsedes)
      if(s.bairro && temBairro(s.bairro))
        lista.push({bairro:s.bairro, tipo:'subsede', nossa:true,
                    torcida:E.torcida.id, label:'Nossa subsede'});

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

  /* =======================================================
     A CIDADE DESENHADA
     Quando existe arte pra praça, ela manda: a malha de ruas,
     as dezesseis regiões e os estádios saem dos pixels, e não
     da grade procedural. O resto do jogo não muda de lado —
     o modelo tem a mesma cara nos dois casos.
     ======================================================= */
  /* Três praças têm arte própria — Fortaleza, São Paulo e Belo Horizonte.
     As outras 27 ganham a foto emprestada ou a planta gerada da própria
     lista de bairros, na cruz por zona (mapa_gerado.js). As três formas
     têm a mesma cara, então daqui pra frente o código não sabe qual está
     usando. */
  const arteDe = E => {
    const a = (TO.dados.cidadeMapas || {})[E.torcida.mapa];
    if(a) return a;
    return TO.mapaGerado ? TO.mapaGerado.arteDe(E.torcida.mapa) : null;
  };

  let _cacheArte = null;
  function decodificar(a){
    if(_cacheArte && _cacheArte.fonte === a) return _cacheArte;
    const n = Math.floor(a.largura / a.passo);
    const andavel = new Uint8Array(n*n);
    a.andavel.split(';').forEach((linha, r)=>{
      let c = 0, v = 0;
      for(const run of linha.split(',')){
        const k = +run;
        if(v) for(let i=0;i<k && c<n;i++,c++) andavel[r*n+c] = 1;
        else c += k;
        v ^= 1;
      }
    });
    const regiao = new Int8Array(n*n).fill(-1);
    a.regioes.split(';').forEach((linha, r)=>{
      for(let c=0;c<linha.length && c<n;c++)
        regiao[r*n+c] = parseInt(linha[c], 36) - 1;
    });
    _cacheArte = {fonte:a, n, andavel, regiao,
                  passo:a.passo, tam:a.largura};
    return _cacheArte;
  }

  /* Os gramados estão desenhados na arte, e são só três. Os estádios da
     praça também são três, mas em bairros que a arte não conhece — o
     desenho veio antes da tabela. Casar por nome de bairro deixaria dois
     pinos de estádio num lote de casa e dois gramados vazios, então o
     casamento é por porte: o campo maior fica com o estádio de maior
     capacidade, e quem já bate o bairro tem preferência.
     O bairro do pino passa a ser o do gramado — é onde ele está. */
  function paresDeEstadio(a, todas){
    const campos = (a.estadios||[]).map((e, i)=>({e, i, area:e.w*e.h}));
    const casas = todas.map((it, i)=>({it, i}))
                       .filter(x=>x.it.tipo === 'estadio');
    const par = new Map();
    const livre = new Set(campos.map(c=>c.i));

    for(const c of casas){                       /* 1º: bate o bairro */
      const alvo = campos.find(x=>livre.has(x.i) && x.e.bairro === c.it.bairro);
      if(alvo){ par.set(c.i, alvo.e); livre.delete(alvo.i); }
    }
    const sobra = casas.filter(c=>!par.has(c.i))
                       .sort((x, y)=>(y.it.cap||0) - (x.it.cap||0));
    const vagos = campos.filter(c=>livre.has(c.i))
                        .sort((x, y)=>y.area - x.area);
    sobra.forEach((c, k)=>{ if(vagos[k]) par.set(c.i, vagos[k].e); });
    return par;
  }

  /* onde cada coisa mora na arte: um lote com frente pra rua, sempre o
     mesmo pro mesmo endereço */
  function lugarNaArte(a, mapa, item, i, campo){
    if(item.tipo === 'estadio' && campo)
      return {x:campo.x, y:campo.y, estadio:campo, bairro:campo.bairro};
    const bairro = a.bairros.findIndex(b=>b.nome === item.bairro);
    if(bairro < 0) return null;
    const lista = a.lotes[String(bairro)] || [];
    if(!lista.length){
      const b = a.bairros[bairro];
      return {x:b.x, y:b.y};
    }
    const k = hash(`${item.bairro}|${item.tipo}|${item.label}|${i}`) % lista.length;
    const [c, r] = lista[k];
    return {x:(c+0.5)*a.passo, y:(r+0.5)*a.passo};
  }

  /* Quanto espaço cada pino ocupa na tela, pra ninguém encostar em ninguém */
  const R_PINO = 11;
  const raioDoPino = p => p && p.estadio
    ? Math.max(13, Math.min(p.estadio.w, p.estadio.h)*0.42) : R_PINO;
  const FOLGA = 5;          // respiro entre dois pinos vizinhos
  const FOLGA_GRAMADO = 6;  // e a borda do campo, que não é endereço de nada

  function modeloDaArte(E, a){
    const todas = estruturas(E);
    const mostra = new Set(visiveis(E, todas));
    const m = decodificar(a);
    const campos = paresDeEstadio(a, todas);

    /* Duas regras de convivência, que o sorteio por hash sozinho não dá:
       1. ninguém mora dentro do gramado — o campo é do estádio;
       2. dois pinos não se encostam, senão o ícone de um come o do outro.
       O estádio entra primeiro porque o lugar dele é fixo; o resto anda
       na lista de lotes do próprio bairro até achar vaga. */
    const gramados = (a.estadios||[]).map(e=>({
      x0:e.x - e.w/2, x1:e.x + e.w/2,
      y0:e.y - e.h/2, y1:e.y + e.h/2}));
    const noGramado = (x, y, r)=>gramados.some(g=>
      x > g.x0-r-FOLGA_GRAMADO && x < g.x1+r+FOLGA_GRAMADO &&
      y > g.y0-r-FOLGA_GRAMADO && y < g.y1+r+FOLGA_GRAMADO);

    const postos = [];
    const cabe = (x, y, r, folga)=>!postos.some(p=>
      Math.hypot(p.x-x, p.y-y) < p.r + r + folga);

    const pinos = new Array(todas.length).fill(null);
    const põe = (item, i, q)=>{
      const r = raioDoPino(q);
      postos.push({x:q.x, y:q.y, r});
      pinos[i] = Object.assign({}, item, q, {visivel: mostra.has(item)});
    };

    /* 1ª volta: os estádios, no gramado que é deles */
    todas.forEach((item, i)=>{
      const campo = campos.get(i);
      if(!campo) return;
      põe(item, i, lugarNaArte(a, E.torcida.mapa, item, i, campo));
    });

    /* 2ª volta: o resto. Se a folga cheia não couber em lugar nenhum do
       bairro, ela cede — pino apertado ainda é melhor que pino sumido. */
    const TENTATIVAS = 40;
    todas.forEach((item, i)=>{
      if(pinos[i]) return;
      let cru = null;
      for(const folga of [FOLGA, 2, 0]){
        for(let t=0; t<TENTATIVAS; t++){
          const q = lugarNaArte(a, E.torcida.mapa, item, i + t*97);
          if(!q) return;
          cru = cru || q;
          if(noGramado(q.x, q.y, R_PINO)) continue;
          if(!cabe(q.x, q.y, R_PINO, folga)) continue;
          põe(item, i, q);
          return;
        }
      }
      if(cru) põe(item, i, cru);
    });

    return {arte:a, tam:a.largura, malha:m, pinos:pinos.filter(Boolean),
            regioes:a.bairros, celulas:[], porLado:0,
            total:todas.length, mostrando:mostra.size,
            alvos:[], sob:null};
  }

  function modelo(E){
    const arte = arteDe(E);
    if(arte) return modeloDaArte(E, arte);
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
     AS CONSULTAS

     AQUI MORAVAM SETECENTAS LINHAS DE DESENHO: o fundo, as avenidas, os
     dezesseis bairros, os doze quarteirões de cada um, os dez lotes de
     cada quarteirão, os telhados, os pinos com escudo e os ícones
     vetoriais de cada tipo de ponto. Elas saíram com a tela do mapa.

     O QUE FICOU É O MODELO. Os dados da praça — a máscara de ruas, os
     bairros, os lotes, os gramados — continuam carregados e continuam
     respondendo às perguntas que o jogo faz sem tela nenhuma: em que
     bairro um ponto cai, se ali se anda, onde estão as sedes, os bares
     e os estádios. Jogar os 35 KB de máscara fora teria custado o
     bairro da briga, e a briga de rua voltaria a ser cena genérica.
     ======================================================= */

  /* em que bairro cai um ponto da arte */
  function bairroEm(mo, x, y){
    if(!mo.arte) return null;
    const m = mo.malha;
    const c = Math.floor(x/m.passo), r = Math.floor(y/m.passo);
    if(c<0 || r<0 || c>=m.n || r>=m.n) return null;
    const k = m.regiao[r*m.n+c];
    return k >= 0 ? mo.regioes[k] : null;
  }
  const andavelEm = (mo, x, y)=>{
    if(!mo.arte) return true;
    const m = mo.malha;
    const c = Math.floor(x/m.passo), r = Math.floor(y/m.passo);
    return c>=0 && r>=0 && c<m.n && r<m.n && !!m.andavel[r*m.n+c];
  };

  return {TAM, PAD, AVENIDA, QUARTEIROES, LOTES,
          NEUTROS, TIPOS_TORCIDA, TIPOS_NEUTRO,
          hash, filtros, estruturas, modelo, arteDe, bairroEm, andavelEm};
})();
