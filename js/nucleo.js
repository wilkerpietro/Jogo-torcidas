/* =========================================================
   NÚCLEO — namespace, utilidades de matemática e de DOM
   Carregado antes de tudo. Não depende de nada.
   ========================================================= */
window.TO = window.TO || {};
TO.dados = TO.dados || {};

TO.util = (function(){

  /* ---------- número ---------- */
  const limitar   = (v,mi,ma)=> v<mi?mi : v>ma?ma : v;
  /* SEM Math.hypot (medição de 17/09/2026): ele é dezenas de vezes mais
     lento que a raiz direta e respondia por 16% da simulação de uma
     briga de 600 discos. A conta é a mesma. */
  const dist      = (ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay;return Math.sqrt(dx*dx+dy*dy);};
  const dist2     = (ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay;return dx*dx+dy*dy;};
  const misturar  = (a,b,t)=> a+(b-a)*t;

  /* ---------- aleatório com semente (reprodutível) ---------- */
  function semear(semente){
    let s = semente >>> 0 || 1;
    return function(){
      s ^= s<<13; s>>>=0;
      s ^= s>>17;
      s ^= s<<5;  s>>>=0;
      return s / 4294967296;
    };
  }
  let _rnd = Math.random;
  const rng      = ()=> _rnd();
  const usarSemente = s => { _rnd = semear(s); };
  const entre    = (a,b)=> a + _rnd()*(b-a);
  const inteiro  = (a,b)=> Math.floor(a + _rnd()*(b-a+1));
  const escolher = arr => arr[Math.floor(_rnd()*arr.length)];
  function embaralhar(arr){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(_rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }

  /* ---------- geometria ---------- */
  function pontoEmPoligono(x,y,pol){
    let dentro=false;
    for(let i=0,j=pol.length-1;i<pol.length;j=i++){
      const xi=pol[i][0], yi=pol[i][1], xj=pol[j][0], yj=pol[j][1];
      if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/((yj-yi)||1e-9) + xi)) dentro=!dentro;
    }
    return dentro;
  }
  /* menor distância de um ponto a um segmento, e o ponto mais próximo */
  function maisProximoNoSegmento(px,py,ax,ay,bx,by){
    const dx=bx-ax, dy=by-ay, L2=dx*dx+dy*dy||1;
    let t=((px-ax)*dx+(py-ay)*dy)/L2;
    t=limitar(t,0,1);
    return {x:ax+dx*t, y:ay+dy*t, t};
  }

  /* ---------- texto ---------- */
  /* o separador de milhar segue o idioma (dono, 24/09/2026): 2.000 em
     português e espanhol, 2,000 em inglês; a moeda continua o real */
  const locale = () => (TO.i18n && TO.i18n.locale) || 'pt-BR';
  const dinheiro = v =>
    (v<0?'−':'')+'R$ '+Math.abs(Math.round(v)).toLocaleString(locale());
  const numero = (v,casas=0)=> Number(v).toLocaleString(locale(),
    {minimumFractionDigits:casas, maximumFractionDigits:casas});
  /* 'Copa do Nordeste' -> 'copa-do-nordeste'; mesma regra dos importadores */
  const identificador = t => String(t||'').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  /* ---------- escala 0–20 padronizada (GDD §12) ---------- */
  const FAIXAS_PADRAO = [
    {ate:4,  nome:'Crítico',  cor:'#d9705f'},
    {ate:9,  nome:'Baixo',    cor:'#c8a03c'},
    {ate:14, nome:'Neutro',   cor:'#8b867d'},
    {ate:20, nome:'Alto',     cor:'#7fc2a0'}
  ];
  function faixa(valor, tabela){
    const t = tabela || FAIXAS_PADRAO;
    let f = t[t.length-1];
    for(const x of t) if(valor<=x.ate){ f = x; break; }
    /* o nome da faixa sai no idioma do jogo */
    return (window._t && f.nome) ? Object.assign({}, f, {nome:_t(f.nome)}) : f;
  }

  /* ---------- DOM ---------- */
  const $  = (s,raiz)=> (raiz||document).querySelector(s);
  const $$ = (s,raiz)=> Array.from((raiz||document).querySelectorAll(s));
  function criar(tag, props, filhos){
    const el=document.createElement(tag);
    if(props) for(const [k,v] of Object.entries(props)){
      if(k==='class') el.className=v;
      else if(k==='html') el.innerHTML=v;
      else if(k==='texto') el.textContent=v;
      else if(k.startsWith('on')) el[k.toLowerCase()]=v;
      else if(k==='estilo') Object.assign(el.style,v);
      else el.setAttribute(k,v);
    }
    if(filhos) for(const f of [].concat(filhos)) if(f) el.appendChild(f);
    return el;
  }

  return {limitar,dist,dist2,misturar,
          semear,rng,usarSemente,entre,inteiro,escolher,embaralhar,
          pontoEmPoligono,maisProximoNoSegmento,
          dinheiro,numero,identificador,faixa,FAIXAS_PADRAO,
          $,$$,criar};
})();

/* =========================================================
   GÊNERO — o artigo certo antes de nome próprio.
   A tabela é dados/genero.js; aqui só a consulta. A tabela é
   lida na primeira chamada porque nucleo.js carrega antes de
   dados/. Nome que não está lá cai no palpite antigo e avisa
   uma vez no console, pra aparecer no teste e não no jogo.
   ========================================================= */
TO.genero = (function(){
  let indice = null;
  const crua = s => String(s||'').trim().toLowerCase()
                     .normalize('NFD').replace(/[̀-ͯ]/g,'');

  function montar(){
    indice = {};
    const t = (TO.dados && TO.dados.genero) || {};
    for(const tipo of Object.keys(t)){
      const m = indice[tipo] = {};
      for(const g of Object.keys(t[tipo]))
        for(const nome of t[tipo][g]) m[crua(nome)] = g;
    }
  }

  /* o palpite de antes, mantido só pra nome desconhecido */
  const PALPITE = {
    competicao: n => /^(copa|taca|serie|copinha|recopa|supercopa|liga|primera)\b/
                       .test(crua(n)) ? 'f' : 'm',
    estadio:    n => /^(arena|vila|ilha)\b/.test(crua(n)) ? 'f' : 'm',
    fase:       n => /s$/.test(crua(n)) ? 'fp' : 'f',
    /* nome de cidade solto é o caso mais comum, e é o que menos
       estraga quando se erra: "em Tal Lugar" lê como nome próprio */
    cidade:     () => 's'
  };
  const avisados = {};

  /* 'f' feminino, 'fp' feminino plural, 'm' masculino,
     's' SEM ARTIGO — "em Salvador", "de Salvador". Só cidade usa. */
  function de(tipo, nome){
    if(!nome) return 'm';
    if(!indice) montar();
    const m = indice[tipo] || {};
    const c = crua(nome);
    /* o gênero é da fase, não do sufixo: "Fecha 1" vale por "Fecha",
       e "Semifinal · ida" / "Semifinal (ida)" valem por "Semifinal" */
    const podado = c.replace(/\s*[·(].*$/, '').replace(/\s+\d+$/, '').trim();
    const g = m[c] || m[podado];
    if(g) return g;
    const chave = tipo + '/' + nome;
    if(!avisados[chave]){
      avisados[chave] = 1;
      if(typeof console !== 'undefined' && console.warn)
        console.warn(`genero: "${nome}" não está em dados/genero.js (${tipo})`);
    }
    return (PALPITE[tipo] || PALPITE.competicao)(nome);
  }

  /* de+artigo, em+artigo, por+artigo, e o artigo sozinho */
  const ART = {
    d:   {f:'da',   fp:'das',   m:'do',   s:'de'},
    em:  {f:'na',   fp:'nas',   m:'no',   s:'em'},
    por: {f:'pela', fp:'pelas', m:'pelo', s:'por'},
    /* sem artigo não tem o que pôr antes do nome */
    o:   {f:'a',    fp:'as',    m:'o',    s:''}
  };
  /* EM ESPANHOL E EM INGLÊS (dono, 24/09/2026): o gênero de competição
     e de estádio é o mesmo do português (la Copa, el Mineiro, la
     Arena); o nome da FASE é palavra comum e é traduzido, e o gênero
     sai do nome traduzido. Em inglês o artigo é um só. */
  const ART_ES = {
    d:   {f:'de la',  fp:'de las',  mp:'de los',  m:'del',    s:'de'},
    em:  {f:'en la',  fp:'en las',  mp:'en los',  m:'en el',  s:'en'},
    por: {f:'por la', fp:'por las', mp:'por los', m:'por el', s:'por'},
    o:   {f:'la',     fp:'las',     mp:'los',     m:'el',     s:''}
  };
  const faseEs = n => /^(octavos|cuartos|dieciseisavos|treintaidosavos)/i.test(n) ? 'mp'
                    : /^(playoff|repechaje|cuadrangular|hexagonal|torneo)/i.test(n) ? 'm' : 'f';
  const ART_EN = {d:'of the', em:'in the', por:'for the', o:'the'};
  const ART_EN_S = {d:'of', em:'in', por:'for', o:''};
  const junta = (forma, tipo, nome, vazio) => {
    if(!nome) return vazio || '';
    const lang = (TO.i18n && TO.i18n.idioma) || 'pt';
    if(lang === 'pt'){
      const a = ART[forma][de(tipo, nome)];
      return a ? `${a} ${nome}` : String(nome);
    }
    const g = de(tipo, nome);
    const nomeT = tipo === 'fase' && window._t ? _t(nome) : String(nome);
    if(lang === 'es'){
      const ge = tipo === 'fase' ? faseEs(nomeT) : g;
      const a = ART_ES[forma][ge];
      return a ? `${a} ${nomeT}` : nomeT;
    }
    /* inglês: estádio é "at", cidade não leva artigo */
    if(forma === 'em' && tipo === 'estadio') return `at ${nomeT}`;
    const a = g === 's' ? ART_EN_S[forma] : ART_EN[forma];
    return a ? `${a} ${nomeT}` : nomeT;
  };

  return {
    de,
    d:   (tipo, nome, vazio) => junta('d',   tipo, nome, vazio),
    em:  (tipo, nome, vazio) => junta('em',  tipo, nome, vazio),
    por: (tipo, nome, vazio) => junta('por', tipo, nome, vazio),
    o:   (tipo, nome, vazio) => junta('o',   tipo, nome, vazio),
    artigo: (forma, tipo, nome) => {
      const lang = (TO.i18n && TO.i18n.idioma) || 'pt';
      if(lang === 'es') return ART_ES[forma][tipo === 'fase' && window._t ? faseEs(_t(nome)) : de(tipo, nome)];
      if(lang === 'en') return de(tipo, nome) === 's' ? ART_EN_S[forma] : ART_EN[forma];
      return ART[forma][de(tipo, nome)];
    }
  };
})();
