/* =========================================================
   EIXOS DE ALIANÇA — os clãs (pedido do dono, 11/09/2026)

   Um eixo é um grupo de torcidas aliadas entre si. Entrar num eixo
   faz a torcida ALIADA de todas as do eixo e RIVAL dos maiores
   rivais de todas. As torcidas de IA buscam fortalecer o eixo
   recrutando quem faz sentido — aliada de alguém de dentro, não
   rival de ninguém de dentro e não maior rival de ninguém —, e
   grupos de aliadas sem eixo fundam eixos novos, com nome da lista.
   Cada torcida cabe em no máximo dois eixos.
   ========================================================= */
window.TO = window.TO || {};

TO.eixos = (function(){
  const U = TO.util;
  const M = () => TO.mundo;
  const R = () => TO.relacoes;

  const MAX_POR_TORCIDA = 2;
  const ALIADO_AO_ENTRAR = 45;     // o valor inicial de "Aliado" da fonte
  const RIVAL_AO_ENTRAR  = -45;    // o de "Rival"
  const RECRUTA_CADA_DIAS = 15;    // cada eixo convida uma vez a cada 15 dias (dono, 11/09/2026)
  const PROPOSTA_CADA    = 13;     // ...mas o eixo NOSSO só põe um nome na
                                   // mesa a cada 13 semanas: cada nome é uma
                                   // decisão nossa, e a cada 15 dias era 24
                                   // cartão por ano
  const FUNDA_CADA       = 13;     // eixo novo: quatro tentativas por ano...
  const FUNDA_CHANCE     = 0.75;   // ...três vingando (dono, 11/09/2026: aliadas
                                   // entre si fundam eixo naturalmente)
  const METADE_ALIADA    = 0.5;    // faz sentido: aliada de metade do eixo
  const RECUSA_CADA      = 26;     // semanas até o eixo convidar o dono de novo
  const MIN_FUNDADORES   = 3;
  const MAX_EM_COMUM     = 3;      // membros em comum entre um eixo novo e
                                   // qualquer outro (dono, 11/09/2026)

  function caixas(E){
    if(E.eixos) return E.eixos;
    const ids = new Set(M().jogaveis().map(o=>o.id));
    E.eixos = {
      lista: (TO.dados.eixos.base||[]).map(x=>({
        id:x.id, nome:x.nome, sigla:x.sigla||'', base:true,
        fundado:{ano:E.data.ano, semana:E.data.semana},
        membros: x.membros.filter(id=>ids.has(id))
      })),
      historico:[], recusas:{}, vetos:{}, propostas:{}, nomesUsados:[], seq:1,
      seqHist:0, vistoAte:0
    };
    /* os membros de nascença já são aliados entre si: onde a fonte
       deixou a relação abaixo do corte, ela sobe; nada de rivalidade
       nova aqui — isso é só pra quem ENTRA */
    for(const x of E.eixos.lista) consolidar(E, x);
    return E.eixos;
  }
  const lista = E => caixas(E).lista;
  const eixo  = (E, id) => lista(E).find(x=>x.id === id) || null;
  const de    = (E, torcidaId) => lista(E).filter(x=>x.membros.includes(torcidaId));

  /* ---- a relação entre duas torcidas quaisquer, com o dono no meio ---- */
  const relDe = (E, a, b) =>
    a === E.torcida.id ? R().nivel(E, b)
    : b === E.torcida.id ? R().nivel(E, a)
    : R().relacaoDelas(E, a, b);
  function porRel(E, a, b, v){
    v = U.limitar(v, -100, 100);
    if(a === E.torcida.id) E.relacoes[b] = v;
    else if(b === E.torcida.id) E.relacoes[a] = v;
    else { R().relacaoDelas(E, a, b); E.relacoesDelas[R().chaveDe(a, b)] = v; }
  }
  const noMinimo = (E, a, b, v) => { if(relDe(E, a, b) < v) porRel(E, a, b, v); };
  const noMaximo = (E, a, b, v) => { if(relDe(E, a, b) > v) porRel(E, a, b, v); };

  /* cada linha do histórico tem número próprio: é por ele que a tela
     sabe o que é novidade, e não pela data (duas coisas no mesmo dia
     também contam) */
  function anotar(E, linha){
    const X = caixas(E);
    X.seqHist = (X.seqHist || 0) + 1;
    X.historico.unshift(Object.assign({
      seq:X.seqHist, abs:E.data.absoluto||0, ano:E.data.ano, semana:E.data.semana
    }, linha));
  }

  function consolidar(E, x){
    for(let i=0;i<x.membros.length;i++)
      for(let j=i+1;j<x.membros.length;j++)
        noMinimo(E, x.membros[i], x.membros[j], ALIADO_AO_ENTRAR);
  }

  /* os maiores rivais de uma torcida: a fonte (dos dois lados) e o valor */
  function maioresRivaisDe(E, id){
    const o = M().torcida(id); if(!o) return [];
    const fora = new Set(o.maioresRivais || []);
    for(const p of M().jogaveis()){
      if(p.id === id || p.incompleta) continue;
      if((p.maioresRivais||[]).includes(id) || relDe(E, id, p.id) <= -70) fora.add(p.id);
    }
    return [...fora];
  }
  /* os maiores rivais do eixo inteiro (união dos membros), sem os membros */
  function maioresRivaisDoEixo(E, x){
    const s = new Set();
    for(const m of x.membros) for(const r of maioresRivaisDe(E, m)) if(!x.membros.includes(r)) s.add(r);
    return [...s];
  }

  /* ---- quem pode entrar ---- */
  function podeEntrar(E, eixoId, torcidaId){
    const x = eixo(E, eixoId); const o = M().torcida(torcidaId);
    if(!x || !o || o.incompleta) return {ok:false, motivo:'não existe'};
    if(x.membros.includes(torcidaId)) return {ok:false, motivo:'já é do eixo'};
    if(de(E, torcidaId).length >= MAX_POR_TORCIDA) return {ok:false, motivo:'já está em dois eixos'};
    let aliadas = 0;
    for(const m of x.membros){
      if(R().ehMaiorRival(E, m, torcidaId)) return {ok:false, motivo:`maior rival da ${(M().torcida(m)||{}).nome}`};
      const v = relDe(E, m, torcidaId);
      if(v < -15) return {ok:false, motivo:`rival da ${(M().torcida(m)||{}).nome}`};
      if(v >= 20) aliadas++;
    }
    /* "se fizerem sentido": aliada de pelo menos metade do eixo */
    if(aliadas < Math.max(1, Math.ceil(x.membros.length * METADE_ALIADA)))
      return {ok:false, motivo:`aliada de só ${aliadas} de ${x.membros.length}`};
    /* e não pode ser aliada/irmã de um maior rival do eixo? Não: basta
       não ser maior rival de ninguém — o dono pediu só isso. Mas quem é
       irmã de um maior rival do eixo não entra: irmã não vira rival. */
    for(const r of maioresRivaisDoEixo(E, x))
      if(M().saoIrmas && M().saoIrmas(torcidaId, r)) return {ok:false, motivo:`irmã da ${(M().torcida(r)||{}).nome}, maior rival do eixo`};
    /* eixo novo não pode virar cópia de outro: com ela dentro, no
       máximo MAX_EM_COMUM membros em comum com qualquer eixo em que ela
       já esteja — quando um dos dois é novo */
    for(const y of de(E, torcidaId)){
      if(x.base && y.base) continue;
      const comum = x.membros.filter(m=>y.membros.includes(m)).length + 1;
      if(comum > MAX_EM_COMUM) return {ok:false, motivo:`o ${x.nome} ficaria com ${comum} em comum com o ${y.nome}`};
    }
    return {ok:true};
  }
  /* a nota de um candidato: soma das relações com os membros, e o
     bônus de praça descoberta */
  function notaDe(E, x, torcidaId){
    const o = M().torcida(torcidaId);
    const pracas = new Set(x.membros.map(m=>(M().torcida(m)||{}).mapa));
    let n = 0;
    for(const m of x.membros) n += relDe(E, m, torcidaId);
    if(!pracas.has(o.mapa)) n += 40;
    return n;
  }
  function candidatos(E, eixoId){
    const x = eixo(E, eixoId); if(!x) return [];
    return M().jogaveis()
      .filter(o=>!o.incompleta && podeEntrar(E, eixoId, o.id).ok)
      .map(o=>({id:o.id, nome:o.nome, nota:notaDe(E, x, o.id)}))
      .sort((a,b)=>b.nota - a.nota);
  }

  /* ---- entrar: aliada de todos, rival dos maiores rivais de todos ---- */
  function entrar(E, eixoId, torcidaId){
    const x = eixo(E, eixoId); if(!x || x.membros.includes(torcidaId)) return null;
    const antes = x.membros.slice();
    const rivais = maioresRivaisDoEixo(E, x);
    x.membros.push(torcidaId);
    const novasAliadas = [], novosRivais = [];
    for(const m of antes){
      if(relDe(E, m, torcidaId) < 20) novasAliadas.push(m);
      noMinimo(E, m, torcidaId, ALIADO_AO_ENTRAR);
    }
    for(const r of rivais){
      if(r === torcidaId) continue;
      if(M().saoIrmas && M().saoIrmas(torcidaId, r)) continue;
      if(relDe(E, r, torcidaId) > -15) novosRivais.push(r);
      noMaximo(E, r, torcidaId, RIVAL_AO_ENTRAR);
    }
    /* o dono entrando (ou o dono sendo o outro lado) não pode receber
       a pergunta "virou neutro?" por causa disto: o vigia reconhece */
    const S = E.statusRel;
    if(S && S.visto){
      const marcar = (a, b) => {
        const outro = a === E.torcida.id ? b : b === E.torcida.id ? a : null;
        if(!outro) return;
        const v = R().nivel(E, outro);
        S.visto[outro] = v <= -15 ? 'rival' : v < 20 ? 'neutro' : 'aliado';
      };
      for(const m of antes) marcar(m, torcidaId);
      for(const r of rivais) marcar(r, torcidaId);
    }
    anotar(E, {tipo:'entrou', eixo:eixoId, torcida:torcidaId});
    return {eixo:x, novasAliadas, novosRivais};
  }

  /* ---- fundar um eixo novo ---- */
  function nomeNovo(E, membros){
    const X = caixas(E);
    /* a língua é a da maioria dos fundadores: Brasil fala português,
       o resto do continente fala espanhol */
    const pais = id => (R().paisDaTorcida ? R().paisDaTorcida(id) : 'Brasil');
    const doBrasil = membros.filter(m=>pais(m) === 'Brasil').length;
    const lingua = doBrasil * 2 >= membros.length ? 'pt' : 'es';
    const pool = (TO.dados.eixos.nomesNovos || {});
    const lista = Array.isArray(pool) ? pool : (pool[lingua] || pool.pt || []);
    const livres = lista.filter(n=>!X.nomesUsados.includes(n.nome));
    const esc = livres[0];
    if(!esc) return null;                 // acabaram os nomes: não nasce mais eixo
    X.nomesUsados.push(esc.nome);
    return {nome:esc.nome, sigla:esc.sigla || ''};
  }
  function fundar(E, membros, nomeDado){
    const X = caixas(E);
    const n = nomeDado || nomeNovo(E, membros);
    if(!n) return null;
    const {nome, sigla} = n;
    const x = {id:`novo_${X.seq++}`, nome, sigla, base:false,
               fundado:{ano:E.data.ano, semana:E.data.semana}, membros:[]};
    X.lista.push(x);
    x.membros.push(membros[0]);
    for(const m of membros.slice(1)) entrar(E, x.id, m);
    anotar(E, {tipo:'fundou', eixo:x.id, membros:membros.slice()});
    return x;
  }

  /* ---- o dia: recrutamento por eixo e fundação de eixo novo ----
     Devolve os eventos pro feed contar. O convite ao dono é evento
     de decisão; o feed responde chamando `entrar` ou `recusar`. */
  function eventosDoDia(E, forcar){
    const X = caixas(E);
    const H = TO.mapa.hash, sa = R().semanaAbs(E);
    const evs = [];
    /* 1. cada eixo tenta recrutar */
    for(const x of X.lista){
      if(!forcar){
        /* o relógio de cada eixo tem a própria fase, pra não convidarem
           todos no mesmo dia */
        if(((E.data.absoluto||0) + H('eixo|'+x.id)) % RECRUTA_CADA_DIAS !== 0) continue;
      }
      const cands = candidatos(E, x.id);
      if(!cands.length) continue;
      let esc = cands[0];
      if(esc.id === E.torcida.id){
        const rec = X.recusas[x.id];
        if(rec && sa - rec < RECUSA_CADA){ esc = cands[1]; if(!esc) continue; }
      }
      if(esc.id === E.torcida.id){
        /* quem chama é o membro mais próximo da gente */
        const porta = x.membros.slice().sort((a,b)=>R().nivel(E,b) - R().nivel(E,a))[0];
        evs.push({tipo:'convite', eixo:x.id, porta});
      } else if(x.membros.includes(E.torcida.id)){
        /* NO NOSSO EIXO QUEM DECIDE É O DONO (dono, 11/09/2026): o eixo
           propõe o nome e espera a gente concordar. Vetado, o nome só
           volta à mesa depois de meio ano; e entre uma proposta e outra
           passa um trimestre, senão o feed vira mesa de reunião. */
        const veto = X.vetos[`${x.id}|${esc.id}`];
        if(veto && sa - veto < RECUSA_CADA) continue;
        const ult = X.propostas && X.propostas[x.id];
        if(!forcar && ult && sa - ult < PROPOSTA_CADA) continue;
        X.propostas = X.propostas || {};
        X.propostas[x.id] = sa;
        const porta = x.membros.filter(m=>m !== E.torcida.id)
          .sort((a,b)=>R().nivel(E,b) - R().nivel(E,a))[0];
        evs.push({tipo:'proposta', eixo:x.id, torcida:esc.id, porta});
      } else {
        const r = entrar(E, x.id, esc.id);
        if(r) evs.push({tipo:'entrou', eixo:x.id, torcida:esc.id,
                        novasAliadas:r.novasAliadas, novosRivais:r.novosRivais});
      }
    }
    /* 2. um eixo novo: aliadas sem eixo que se fecham num grupo */
    if(forcar || ((sa + H('eixo|novo')) % FUNDA_CADA === 0 && (H(`eixo|novo|${sa}`) % 7) + 1 === E.data.dia
                  && (H(`eixo|novo|vinga|${sa}`) % 1000) / 1000 < FUNDA_CHANCE)){
      /* ALIADAS ENTRE SI FUNDAM EIXO NATURALMENTE (dono, 11/09/2026: Os
         Imbatíveis, Remista, Jovem Sport e Jovem Garra Tricolor são
         aliadas duas a duas — e a Jovem Sport já é do Punho Cruzado). A
         semente é quem
         não tem eixo; os outros fundadores podem ter um, desde que
         metade do grupo ainda esteja sem eixo. Todos aliados dois a dois
         a +45, sem maior rival entre si, e o grupo não pode ser pedaço
         de um eixo que já existe. */
      const livres = M().jogaveis().filter(o=>!o.incompleta && o.id !== E.torcida.id && de(E, o.id).length === 0);
      const cabem  = M().jogaveis().filter(o=>!o.incompleta && o.id !== E.torcida.id && de(E, o.id).length < MAX_POR_TORCIDA);
      let melhor = null;
      for(const s of livres){
        const grupo = [s.id];
        const alis = cabem.filter(o=>o.id !== s.id && relDe(E, s.id, o.id) >= ALIADO_AO_ENTRAR)
          .sort((a,b)=>(de(E, a.id).length - de(E, b.id).length) || (relDe(E, s.id, b.id) - relDe(E, s.id, a.id)));
        for(const a of alis){
          if(grupo.length >= 5) break;
          const semEixo = grupo.filter(g=>de(E, g).length === 0).length + (de(E, a.id).length ? 0 : 1);
          if(semEixo * 2 < grupo.length + 1) continue;
          if(!grupo.every(g=>relDe(E, g, a.id) >= ALIADO_AO_ENTRAR && !R().ehMaiorRival(E, g, a.id))) continue;
          if(X.lista.some(x=>grupo.filter(g=>x.membros.includes(g)).length + (x.membros.includes(a.id) ? 1 : 0) > MAX_EM_COMUM)) continue;
          grupo.push(a.id);
        }
        if(grupo.length < MIN_FUNDADORES) continue;
        /* no máximo MAX_EM_COMUM membros em comum com qualquer eixo que
           já existe (dono, 11/09/2026) */
        if(X.lista.some(x=>grupo.filter(g=>x.membros.includes(g)).length > MAX_EM_COMUM)) continue;
        if(!melhor || grupo.length > melhor.length ||
           (grupo.length === melhor.length && H(`eixo|semente|${sa}|${s.id}`) % 2)) melhor = grupo;
      }
      if(melhor){
        const x = fundar(E, melhor);
        if(x) evs.push({tipo:'fundou', eixo:x.id, membros:melhor});
      }
    }
    return evs;
  }
  function recusar(E, eixoId, porta){
    caixas(E).recusas[eixoId] = R().semanaAbs(E);
    if(porta) E.relacoes[porta] = U.limitar(R().nivel(E, porta) - 3, -100, 100);
  }
  /* o dono vetou um nome no eixo dele: some da mesa por meio ano */
  function vetar(E, eixoId, torcidaId){
    caixas(E).vetos[`${eixoId}|${torcidaId}`] = R().semanaAbs(E);
  }

  /* AS NOVIDADES (dono, 11/09/2026): as entradas e fundações saíram do
     feed e viram a lista da aba Eixos, em Diplomacia. `nova` é o que
     aconteceu depois da última visita; `marcarVistas` zera o contador. */
  function novidades(E, quantas){
    const X = caixas(E);
    /* A TELA MOSTRA O MUNDO INTEIRO (dono, 11/09/2026): o feed só fala
       do nosso eixo; toda a movimentação das outras alianças aparece
       aqui, com as nossas em destaque. */
    return (X.historico||[]).slice(0, quantas || 40).map(h=>{
      const x = eixo(E, h.eixo);
      return {
        abs:h.abs, ano:h.ano, semana:h.semana, tipo:h.tipo,
        eixo:h.eixo, nomeEixo: x ? x.nome : '', nosso: !!x && x.membros.includes(E.torcida.id),
        torcida:h.torcida || null, membros:h.membros || null,
        nova: (h.seq||0) > (X.vistoAte||0)
      };
    });
  }
  const naoVistas = E => novidades(E, 60).filter(n=>n.nova).length;
  const naoVistasNossas = E => novidades(E, 60).filter(n=>n.nova && n.nosso).length;
  function marcarVistas(E){
    const X = caixas(E);
    X.vistoAte = Math.max(X.vistoAte||0, X.seqHist||0);
  }

  /* pro perfil e pra Diplomacia */
  function resumo(E, id){
    const x = eixo(E, id); if(!x) return null;
    const membros = x.membros.map(m=>M().torcida(m)).filter(Boolean);
    const pracas = [...new Set(membros.map(o=>o.mapa))];
    const forca = membros.reduce((s,o)=>{
      const t = o.id === E.torcida.id ? null : (E.mundoTorcidas||{})[o.id];
      return s + (t ? t.membros : (o.id === E.torcida.id ? E.membros.length : (o.membros||0)));
    }, 0);
    return {x, membros, pracas, forca, rivais: maioresRivaisDoEixo(E, x),
            nosso: x.membros.includes(E.torcida.id)};
  }

  return {caixas, lista, eixo, de, podeEntrar, candidatos, entrar, fundar,
          eventosDoDia, recusar, resumo, maioresRivaisDoEixo,
          novidades, naoVistas, naoVistasNossas, marcarVistas, vetar,
          MAX_POR_TORCIDA, ALIADO_AO_ENTRAR, RIVAL_AO_ENTRAR};
})();
