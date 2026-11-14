/* =========================================================
   IDIOMAS — português (o original), español e english
   Pedido do dono, 24/09/2026: o jogo inteiro nas três línguas,
   escolhidas em Configurações, na tela inicial.

   A REGRA: o texto em português É A CHAVE. No código, todo texto
   que o jogador lê passa por `_t()` (o nome é `_t`, e não `t`, porque
   `t` é variável em metade do código — tempo, time, turno):

       _t('Encerrar a reunião')
       _t('Dia {d} a torcida completa {n} anos.', {d:fmtDia(aniv), n:idade})
       _tn(n, '{n} festa', '{n} festas')

   Em português `_t` devolve o próprio texto (com os {marcadores}
   trocados); nas outras línguas procura a tradução nos dicionários
   (dados/i18n/*.js, um por fatia do código, com es e en lado a
   lado) e, se não achar, cai no português — o jogo nunca quebra por
   tradução faltando, só fala português naquele pedaço.
   `ferramentas/i18n_faltando.py` lista o que falta.

   O IDIOMA é do navegador, não do save: fica no localStorage
   ('to.idioma') e trocar recarrega a página. O que já foi escrito
   num save (as mensagens velhas do feed) fica na língua em que nasceu.

   O HTML ESTÁTICO (index.html) não passa por `_t` no código: no boot,
   `traduzirDom` troca todo nó de texto e todo title/placeholder cujo
   texto inteiro está no dicionário.
   ========================================================= */
TO.i18n = (function(){
  const LINGUAS = [
    {id:'pt', nome:'Português', html:'pt-BR', num:'pt-BR'},
    {id:'es', nome:'Español',   html:'es',    num:'es-AR'},
    {id:'en', nome:'English',   html:'en',    num:'en-US'}
  ];
  const CHAVE = 'to.idioma';
  const valido = id => LINGUAS.some(l => l.id === id);
  let idioma = 'pt';
  try{
    const salvo = localStorage.getItem(CHAVE);
    if(valido(salvo)) idioma = salvo;
  }catch(e){}

  /* pt → {es, en}; cada dicionário acrescenta a sua fatia */
  const dic = {es:Object.create(null), en:Object.create(null)};
  function registrar(tabela){
    for(const pt in tabela){
      const v = tabela[pt];
      if(!v) continue;
      if(v.es != null) dic.es[pt] = v.es;
      if(v.en != null) dic.en[pt] = v.en;
      valores = null;
    }
  }

  /* os valores da língua atual, pra reconhecer texto já traduzido */
  let valores = null;
  const jaTraduzido = s => {
    if(!valores){ valores = new Set(); for(const k in dic[idioma]) valores.add(dic[idioma][k]); }
    return valores.has(s);
  };
  /* o que foi pedido e não achou (pra ferramenta e pra bancada) */
  const faltando = new Set();
  const encher = (s, p) => p ? String(s).replace(/\{(\w+)\}/g,
    (m, k) => (p[k] !== undefined && p[k] !== null) ? p[k] : m) : s;

  /* CONTEXTO: a mesma palavra em português pode ter duas traduções
     ("Praça" a cena é a plaza/square; "Praça" a cidade da torcida é la
     ciudad/the city). A chave leva o contexto na frente, com '::' —
     _t('cidade::Praça') — e o português mostra só o que vem depois. */
  const semContexto = s => { const i = s.indexOf('::'); return i > 0 && i < 24 ? s.slice(i+2) : s; };
  function t(pt, p){
    if(pt == null || pt === '') return '';
    pt = String(pt);
    if(idioma === 'pt') return encher(semContexto(pt), p);
    const v = dic[idioma][pt];
    if(v === undefined){
      /* texto que JÁ É tradução (um rótulo traduzido na definição e
         passado de novo por _t na hora de mostrar) não falta nada */
      if(!jaTraduzido(pt)) faltando.add(pt);
      return encher(semContexto(pt), p);
    }
    return encher(v, p);
  }
  /* plural simples: tn(n, '{n} festa', '{n} festas') */
  const tn = (n, um, varios, p) => t(n === 1 ? um : varios, Object.assign({n}, p || {}));
  /* uma lista de textos soltos (meses, dias da semana) */
  const tl = lista => lista.map(x => t(x));

  /* ---------- o HTML estático ---------- */
  const ATRIBUTOS = ['title', 'placeholder', 'aria-label', 'alt'];
  function traduzirDom(raiz){
    if(idioma === 'pt') return;
    raiz = raiz || document.body;
    const it = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    const nos = [];
    for(let n = it.nextNode(); n; n = it.nextNode()) nos.push(n);
    for(const n of nos){
      const txt = n.nodeValue, cru = txt.trim();
      if(!cru || n.parentNode && /^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) continue;
      const v = dic[idioma][cru];
      if(v !== undefined) n.nodeValue = txt.replace(cru, v);
    }
    for(const el of raiz.querySelectorAll('*'))
      for(const a of ATRIBUTOS){
        const cru = el.getAttribute(a);
        if(cru && dic[idioma][cru.trim()] !== undefined) el.setAttribute(a, dic[idioma][cru.trim()]);
      }
  }

  function trocar(id){
    if(!valido(id)) return;
    try{ localStorage.setItem(CHAVE, id); }catch(e){}
    location.reload();
  }
  const lingua = () => LINGUAS.find(l => l.id === idioma) || LINGUAS[0];

  /* o <html lang> já sai certo, pro leitor de tela e pra hifenização */
  try{ document.documentElement.lang = lingua().html; }catch(e){}

  return {
    LINGUAS, registrar, t, tn, tl, traduzirDom, trocar,
    get idioma(){ return idioma; },
    get locale(){ return lingua().num; },
    get faltando(){ return [...faltando]; },
    /* pra bancada e pros testes: quantas chaves cada língua tem */
    get tamanho(){ return {es:Object.keys(dic.es).length, en:Object.keys(dic.en).length}; },
    tem: (pt, id) => dic[id || idioma] && dic[id || idioma][pt] !== undefined
  };
})();
/* o atalho que o código inteiro usa */
window._t = TO.i18n.t;
window._tn = TO.i18n.tn;
