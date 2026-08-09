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

      data:{ ano:2026, semana:1, dia:1 },   // dia 1..7, jogo no 6

      torcida:{
        nome: opc.nome || 'Fúria Independente',
        time: opc.time || 'seu clube',
        cidade: opc.cidade || 'a cidade',
        sedeNivel: 1
      },

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

    TO.membros.povoarInicial(E, opc.efetivo || 34);
    lancar(E, 'Caixa inicial', 0);
    mudou();
    return E;
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
    if(E.data.dia > 7){ E.data.dia = 1; E.data.semana++; E.acoes.usadas = 0; }
    TO.membros.passarDia(E);
    mudou();
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
    novo, lancar, avancarDia, aoMudar, mudou,
    salvar, carregar, existeSave, exportar, importar,
    bloquear, estaBloqueado
  };
})();
