/* =========================================================
   NÚCLEO — namespace, utilidades de matemática e de DOM
   Carregado antes de tudo. Não depende de nada.
   ========================================================= */
window.TO = window.TO || {};
TO.dados = TO.dados || {};

TO.util = (function(){

  /* ---------- número ---------- */
  const limitar   = (v,mi,ma)=> v<mi?mi : v>ma?ma : v;
  const dist      = (ax,ay,bx,by)=> Math.hypot(bx-ax, by-ay);
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
  const dinheiro = v =>
    (v<0?'−':'')+'R$ '+Math.abs(Math.round(v)).toLocaleString('pt-BR');
  const numero = (v,casas=0)=> Number(v).toLocaleString('pt-BR',
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
    for(const f of t) if(valor<=f.ate) return f;
    return t[t.length-1];
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
