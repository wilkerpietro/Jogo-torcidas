/* =========================================================
   MUNDO — consulta e junção dos dados importados
   times.js, torcidas.js e cidades.js vêm da planilha do autor
   e guardam só o que ela tem. O que é derivado (prestígio,
   influência, território, rival) é calculado aqui, num lugar só.
   ========================================================= */
window.TO = window.TO || {};

TO.mundo = (function(){
  const U = TO.util;
  const T = () => TO.dados.times     || [];
  const O = () => TO.dados.torcidas  || [];
  const C = () => TO.dados.cidades   || [];

  let idxT=null, idxO=null, idxC=null;
  function indexar(){
    idxT = new Map(T().map(x=>[x.id,x]));
    idxO = new Map(O().map(x=>[x.id,x]));
    idxC = new Map(C().map(x=>[x.id,x]));
  }
  const time    = id => (idxT||indexar()||idxT).get(id);
  const torcida = id => (idxO||indexar()||idxO).get(id);
  const cidade  = id => (idxC||indexar()||idxC).get(id);

  const torcidasDe   = idTime  => O().filter(o=>o.time===idTime);
  const torcidasEm   = idMapa  => O().filter(o=>o.mapa===idMapa);
  const timesEm      = idMapa  => T().filter(t=>t.mapa===idMapa);

  /* ---------- números derivados ----------
     A planilha traz efetivo. O resto sai dele, de forma estável:
     a mesma torcida sempre dá o mesmo número. */
  const MAIOR = 250;   // maior efetivo da planilha

  function prestigio(o){
    return U.limitar(Math.round(24 + (o.membros/MAIOR)*72), 1, 100);
  }
  function influencia(o){
    const t = time(o.time);
    const c = t && cidade(t.mapa);
    const peso = c ? U.limitar(c.torcedores/1060, 0, 1) : 0.5;
    return U.limitar(Math.round(prestigio(o)*0.72 + peso*26), 1, 100);
  }
  function territorios(o){
    return Math.max(1, Math.round(o.membros/16));
  }
  function caixa(o){
    return o.membros * 420;
  }

  /* Maior torcida da mesma cidade que não seja do mesmo time.
     Se não houver, a maior do mesmo time (briga interna, GDD §15.2). */
  function rivalDe(o){
    const vizinhas = torcidasEm(o.mapa).filter(x=>x.id!==o.id);
    const deOutros = vizinhas.filter(x=>x.time!==o.time);
    const pool = deOutros.length ? deOutros : vizinhas;
    if(!pool.length) return null;
    return pool.reduce((a,b)=> b.membros>a.membros ? b : a);
  }

  /* tudo que a tela de seleção precisa, num objeto só */
  function ficha(o){
    const t = time(o.time) || {};
    const c = cidade(o.mapa) || {};
    const r = rivalDe(o);
    return {
      id:o.id, nome:o.nome, cores:o.cores, linha:o.linha,
      fundacao:o.fundacao, membros:o.membros,
      time:t.nome || o.timeNome, timeId:o.time, sigla:t.sigla || '',
      cidade:c.nome || t.cidade || '', uf:t.uf || '',
      estadio:t.estadio || '', divisao:t.divisao || '',
      regional:t.regional || '', mapa:o.mapa,
      grade:c.grade || [8,8], nivelCidade:c.nivel || 3,
      prestigio:prestigio(o), influencia:influencia(o),
      territorios:territorios(o), dinheiro:caixa(o),
      rival: r ? r.nome : '—'
    };
  }

  /* sigla curta pro escudo quando o time não tem uma */
  function sigla(f){
    if(f.sigla) return f.sigla.slice(0,4);
    return f.nome.split(/\s+/).map(p=>p[0]).join('').slice(0,3).toUpperCase();
  }

  /* adversário plausível: mesmo campeonato, outro clube */
  function adversario(idTime){
    const meu = time(idTime);
    if(!meu) return T()[0];
    const mesma = T().filter(t=>t.id!==idTime && t.divisao===meu.divisao);
    const pool = mesma.length ? mesma : T().filter(t=>t.id!==idTime);
    return pool[Math.floor(U.rng()*pool.length)];
  }

  /* divisões existentes, na ordem certa */
  function divisoes(){
    const vistas = [...new Set(T().map(t=>t.divisao).filter(Boolean))];
    return vistas.sort();
  }

  return {time, torcida, cidade, torcidasDe, torcidasEm, timesEm,
          prestigio, influencia, territorios, caixa, rivalDe,
          ficha, sigla, adversario, divisoes,
          get todasTorcidas(){return O();},
          get todosTimes(){return T();},
          get todasCidades(){return C();}};
})();
