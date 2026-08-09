/* =========================================================
   ESTADO — o objeto da partida, save e carga
   ---------------------------------------------------------
   GDD §23.1: localStorage com exportar/importar arquivo. Save
   preso ao navegador é frágil num jogo de dez temporadas.
   ========================================================= */
window.TO = window.TO || {};

TO.estado = (function(){
  const U = TO.util;
  const CHAVE = 'torcida-organizada:save';
  const VERSAO = 1;

  let E = null;                 // estado da partida em curso
  const ouvintes = [];

  /* quem quiser reagir a mudança de estado se inscreve aqui */
  function aoMudar(fn){ ouvintes.push(fn); }
  function mudou(){ for(const f of ouvintes) f(E); }

  /* o fechamento da semana é evento, não estado: a tela precisa saber
     que ele aconteceu pra abrir o relatório uma vez só */
  const ouvintesFecho = [];
  function aoFecharSemana(fn){ ouvintesFecho.push(fn); }

  /* -------------------------------------------------------
     NOVA PARTIDA
     ------------------------------------------------------- */
  function novo(opc){
    opc = opc || {};
    const semente = opc.semente || Math.floor(Math.random()*1e9);
    U.usarSemente(semente);

    E = {
      versao: VERSAO,
      semente,
      criadoEm: opc.agora || 0,

      data:{ ano:2026, semana:1, dia:1, absoluto:0 },   // dia 1..7, jogo no 6

      torcida: Object.assign({
        id:'propria', nome:'Fúria Independente', sigla:'FI',
        clube:'seu clube', clubeId:null, cidade:'a cidade', uf:'BR',
        mapa:null, bairroSede:'', cores:['#9d2222','#e8e8e8'], sedeNivel:1
      }, opc.torcida || {}, {sedeNivel:1}),

      /* GDD §11.1: cada par tem um valor de −100 a +100. O número
         inicial sai do tipo de relação que veio da fonte; daqui pra
         frente ele se move com confronto, apoio e traição. */
      relacoes:{},

      /* GDD §12: tudo na mesma escala 0–20 com 4 faixas.
         O jogador aprende uma vez e aplica em tudo. */
      indicadores:{ moral:12, satisfacao:11, prestigio:6, policia:10 },

      dinheiro: 12000,
      membros: [],
      proximoId: 1,
      transacoes: [],
      estoque:{ bombas:4, rojoes:6, sinalizadores:1 },

      acoes:{ usadas:0 },
      historicoNoites: []
    };

    if(opc.torcida){
      const f = opc.torcida;
      E.dinheiro = Math.max(4000, Math.round((f.dinheiro||4000)*4));
      E.indicadores.prestigio = U.limitar(Math.round((f.prestigio||15)/5),0,20);
      E.indicadores.moral     = U.limitar(Math.round((f.moral||60)/5),0,20);
      E.efetivoAlvo = f.membros || 60;

      /* semeia a diplomacia a partir do grafo importado */
      for(const outra of TO.mundo.todasTorcidas){
        if(outra.id===f.id || outra.incompleta) continue;
        const tipo = TO.mundo.relacaoBase(f.id, outra.id);
        if(tipo==='Neutro') continue;
        E.relacoes[outra.id] = TO.mundo.valorInicial(tipo);
      }
    }

    TO.membros.povoarInicial(E, opc.efetivo || 34);
    sortearProximoJogo(E);
    E.noticias = gerarNoticias(E);
    lancar(E, 'Caixa inicial', 0);
    mudou();
    return E;
  }

  /* -------------------------------------------------------
     CALENDÁRIO — data de verdade, pra bater com o cabeçalho
     ------------------------------------------------------- */
  const BASE = new Date(2026, 2, 2);   // segunda-feira
  const SEMANA = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

  function dataDe(est){
    const d = new Date(BASE.getTime());
    d.setDate(d.getDate() + (est.data.absoluto||0));
    return d;
  }
  function dataTexto(est){
    const d = dataDe(est||E);
    return {
      curta:`${String(d.getDate()).padStart(2,'0')}/`+
            `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`,
      semana: SEMANA[d.getDay()]
    };
  }

  function sortearProximoJogo(est){
    const M = TO.mundo;
    const meu = M.time(est.torcida.clubeId);
    if(!meu){ est.proximoJogo = null; return; }
    const adv = M.adversario(meu.id);
    const casa = U.rng() < 0.5;
    const mandante = casa ? meu : adv, visitante = casa ? adv : meu;
    const cAdv = M.cidade(adv.mapa);
    est.proximoJogo = {
      competicao: meu.divisao || 'Amistoso',
      casa,
      mandante:{nome:mandante.nome, sigla:mandante.sigla, cores:mandante.cores},
      visitante:{nome:visitante.nome, sigla:visitante.sigla, cores:visitante.cores},
      estadio: mandante.estadio,
      hora:'21:00',
      /* o que a caravana precisa saber (GDD §7.3) */
      advId: adv.id, mapaAdv: adv.mapa,
      cidadeAdv: cAdv ? cAdv.nome : (adv.cidade || ''),
      chave: `${est.data.ano}-${est.data.semana}-${adv.id}`
    };
    /* GDD §3.2: a postura da semana começa no padrão — ir ao estádio
       quando dá pé a pé, ficar quando o jogo é em outra cidade */
    est.postura = TO.financeiro.precisaCaravana(est) ? 'ficar' : 'estadio';
  }

  function gerarNoticias(est){
    const n = est.torcida.nome;
    return [
      {txt:`${n} realiza treino fechado antes do clássico`, hora:'10:23'},
      {txt:`${est.torcida.rival||'A rival'} provoca nas redes sociais`, hora:'18:45'},
      {txt:`Clássico contra ${est.proximoJogo?est.proximoJogo.visitante.nome:'o rival'} tem esquema especial`, hora:'14:02'},
      {txt:'Polícia aumenta patrulhamento na zona oeste', hora:'09:12'},
      {txt:'Torcida Jovem do Santos anuncia nova faixa', hora:'22:31'}
    ];
  }

  /* -------------------------------------------------------
     FINANCEIRO MÍNIMO (o módulo completo vem depois)
     ------------------------------------------------------- */
  function lancar(est, descricao, valor){
    est = est || E;
    est.dinheiro += valor;
    est.transacoes.unshift({
      dia: `${est.data.semana}/${est.data.dia}`,
      descricao, valor
    });
    if(est.transacoes.length > 200) est.transacoes.pop();
  }

  /* -------------------------------------------------------
     TEMPO
     ------------------------------------------------------- */
  function avancarDia(){
    E.data.dia++;
    E.data.absoluto = (E.data.absoluto||0) + 1;

    let fecho = null;
    if(E.data.dia > 7){
      /* o fechamento pertence à semana que acabou, então roda antes
         de virar o contador (GDD §3.2) */
      fecho = TO.financeiro.fecharSemana(E);
      E.data.dia = 1; E.data.semana++; E.acoes.usadas = 0;
      sortearProximoJogo(E);
      E.noticias = gerarNoticias(E);
    }
    /* GDD §7.3: a caravana é cobrada na véspera do jogo (dia 6) */
    if(E.data.dia === 5) TO.financeiro.cobrarCaravana(E);

    TO.membros.passarDia(E);
    mudou();
    if(fecho) for(const f of ouvintesFecho) f(fecho, E);
    return fecho;
  }

  /* -------------------------------------------------------
     SAVE
     ------------------------------------------------------- */
  let bloqueado = false;
  /* GDD §23.1: salvar no meio de cena em tempo real quebra o estado */
  function bloquear(v){ bloqueado = !!v; }
  function estaBloqueado(){ return bloqueado; }

  function salvar(){
    if(!E) return {ok:false, motivo:'sem partida'};
    if(bloqueado) return {ok:false, motivo:'aguarde chegar ao estádio'};
    try{
      localStorage.setItem(CHAVE, JSON.stringify(E));
      return {ok:true};
    }catch(e){
      return {ok:false, motivo:'localStorage recusou: '+e.message};
    }
  }

  function carregar(){
    try{
      const txt = localStorage.getItem(CHAVE);
      if(!txt) return null;
      const dados = JSON.parse(txt);
      if(dados.versao !== VERSAO) return null;
      E = dados; mudou(); return E;
    }catch(e){ return null; }
  }

  function existeSave(){
    try{ return !!localStorage.getItem(CHAVE); }catch(e){ return false; }
  }

  function exportar(){
    if(!E) return;
    const nome = `torcida-${E.torcida.nome.replace(/\s+/g,'-').toLowerCase()}`+
                 `-s${E.data.semana}.json`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(E,null,1)],
                                          {type:'application/json'}));
    a.download = nome; a.click();
  }

  function importar(arquivo, aoTerminar){
    const fr = new FileReader();
    fr.onload = ()=>{
      try{
        const dados = JSON.parse(fr.result);
        if(!dados.membros || !dados.data) throw new Error('não parece um save');
        E = dados; mudou();
        aoTerminar && aoTerminar({ok:true});
      }catch(e){
        aoTerminar && aoTerminar({ok:false, motivo:e.message});
      }
    };
    fr.readAsText(arquivo);
  }

  return {
    get E(){ return E; },
    novo, lancar, avancarDia, aoMudar, aoFecharSemana, mudou,
    dataTexto, sortearProximoJogo,
    salvar, carregar, existeSave, exportar, importar,
    bloquear, estaBloqueado
  };
})();
