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
      }, opc.torcida || {}),

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
      /* rotina semanal: dia 1 (segunda) a 7 (domingo) → id de ação */
      rotina:{},
      avisos:[],
      historicoNoites: []
    };

    if(opc.torcida){
      const f = opc.torcida;
      E.dinheiro = Math.max(4000, Math.round((f.dinheiro||4000)*4));
      E.indicadores.prestigio = U.limitar(Math.round((f.prestigio||15)/5),0,20);
      E.indicadores.moral     = U.limitar(Math.round((f.moral||60)/5),0,20);
      E.efetivoAlvo = f.membros || 60;
      /* a torcida entra no jogo do tamanho que a fonte diz, e a sede
         sobe até caber esse tamanho (GDD §8.1) */
      E.torcida.sedeNivel = Math.max(f.sedeNivel || 1,
        TO.membros.nivelQueCabe(f.membros || 34, (f.cargos||{}).diretoria || 0));

      /* semeia a diplomacia a partir do grafo importado */
      for(const outra of TO.mundo.todasTorcidas){
        if(outra.id===f.id || outra.incompleta) continue;
        const tipo = TO.mundo.relacaoBase(f.id, outra.id);
        if(tipo==='Neutro') continue;
        E.relacoes[outra.id] = TO.mundo.valorInicial(tipo);
      }
    }

    TO.membros.povoarInicial(E, opc.efetivo || E.efetivoAlvo || 34,
                             (opc.torcida||{}).cargos);
    TO.membros.sortearFila(E);
    E.temporada = TO.competicoes.montarTemporada(E);
    sortearProximoJogo(E);
    E.noticias = gerarNoticias(E);
    lancar(E, 'Caixa inicial', 0);
    mudou();
    return E;
  }

  /* -------------------------------------------------------
     CALENDÁRIO — data de verdade, pra bater com o cabeçalho
     ------------------------------------------------------- */
  /* semana 1 é a primeira segunda-feira do ano: assim o calendário do
     jogo bate com o do futebol, estaduais em janeiro (GDD §18.1) */
  const BASE = new Date(2026, 0, 5);
  const SEMANA = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

  function dataDe(est){
    const d = new Date(BASE.getTime());
    d.setDate(d.getDate() + (est.data.absoluto||0));
    return d;
  }

  /* Ponte entre o calendário do jogo (ano/semana/dia) e o de parede.
     O ano do jogo tem 52 semanas cheias — 364 dias —, então a conta é
     direta e não precisa de bissexto. */
  const DIAS_ANO = 52*7;
  function dataDaSemana(ano, semana, dia){
    const d = new Date(BASE.getTime());
    d.setDate(d.getDate() + (ano-2026)*DIAS_ANO + (semana-1)*7 + (dia-1));
    return d;
  }
  /* caminho inverso: uma data de parede vira semana e dia do jogo */
  function semanaDiaDe(data){
    const abs = Math.round((data - BASE)/86400000);
    if(abs < 0) return null;
    const ano = 2026 + Math.floor(abs/DIAS_ANO);
    const noAno = abs % DIAS_ANO;
    return {ano, semana: Math.floor(noAno/7)+1, dia: (noAno%7)+1};
  }
  function dataTexto(est){
    const d = dataDe(est||E);
    return {
      curta:`${String(d.getDate()).padStart(2,'0')}/`+
            `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`,
      semana: SEMANA[d.getDay()]
    };
  }

  /* O jogo da semana sai da tabela (GDD §18), não de sorteio: é o
     calendário do futebol que define a semana da torcida. Semana sem
     jogo é folga, e folga é resposta legítima — o GDD §3.1 prevê. */
  function sortearProximoJogo(est){
    const M = TO.mundo;
    const meu = M.time(est.torcida.clubeId);
    if(!meu){ est.proximoJogo = null; return; }

    const agenda = est.temporada
      ? TO.competicoes.jogoDaSemana(est, meu.id, est.data.semana) : null;
    if(est.temporada && !agenda){
      est.proximoJogo = null;
      est.postura = 'folga';
      return;
    }

    const adv  = agenda ? M.time(agenda.adversario) : M.adversario(meu.id);
    const casa = agenda ? agenda.casa : U.rng() < 0.5;
    const mandante = casa ? meu : adv, visitante = casa ? adv : meu;
    const cAdv = M.cidade(adv.mapa);
    est.proximoJogo = {
      competicao: agenda ? agenda.comp : (meu.divisao || 'Amistoso'),
      fase: agenda ? agenda.fase : '',
      mata: !!(agenda && agenda.mata),
      dia: agenda ? agenda.dia : 6,
      neutro: agenda ? agenda.neutro : null,
      casa,
      mandante:{nome:mandante.nome, sigla:mandante.sigla, cores:mandante.cores},
      visitante:{nome:visitante.nome, sigla:visitante.sigla, cores:visitante.cores},
      estadio: mandante.estadio,
      /* a hora vem da grade da competição (GDD §18), não de um chute */
      hora: agenda ? agenda.hora : '21:00',
      /* o que a caravana precisa saber (GDD §7.3) */
      advId: adv.id, mapaAdv: adv.mapa,
      cidadeAdv: cAdv ? cAdv.nome : (adv.cidade || ''),
      chave: `${est.data.ano}-${est.data.semana}-${adv.id}`
    };
    /* torcida organizada não falta jogo: a postura é consequência do
       calendário, não escolha (o que se decide é o tamanho da caravana) */
    est.postura = TO.financeiro.postura(est);
  }

  /* O noticiário conta o que de fato aconteceu: briga entre torcidas
     que não controlamos, trégua fechada, o que sobrou da nossa semana e
     o que vem pela frente. */
  function gerarNoticias(est){
    const hora = ()=> String(U.inteiro(8,23)).padStart(2,'0')+':'+
                      String(U.inteiro(0,59)).padStart(2,'0');
    const fora = [];
    for(const n of (est.ultimasNoticias||[]))
      fora.push({txt:`${n.tipo==='briga'?'CONFRONTO':'DIPLOMACIA'}: ${n.txt}`,
                 hora:hora(), tipo:n.tipo});

    const quentes = TO.tensao.panorama(est).filter(x=>x.tensao >= 45);
    if(quentes.length)
      fora.push({txt:`CLIMA: tensão ${quentes[0].faixa.nome.toLowerCase()} com a `+
                     `${quentes[0].nome}`, hora:hora(), tipo:'clima'});

    const j = est.proximoJogo;
    if(j) fora.push({txt:`PRÉ-JOGO: ${j.mandante.nome} recebe o ${j.visitante.nome} `+
                         `pelo ${j.competicao}`, hora:hora(), tipo:'jogo'});
    else  fora.push({txt:`AGENDA: ${est.torcida.clube} não joga nesta semana`,
                     hora:hora(), tipo:'jogo'});

    const ult = est.historicoNoites && est.historicoNoites[0];
    if(ult) fora.push({txt:`ARREDORES: ${ult.feridos} feridos e ${ult.presos} presos `+
                           `na última saída`, hora:hora(), tipo:'briga'});
    fora.push({txt:`SUA TORCIDA: ${est.membros.length} membros, moral `+
                   `${Math.round(est.indicadores.moral)}/20`, hora:hora(), tipo:'casa'});
    return fora.slice(0, 6);
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
  /* A rotina semanal roda o dia que está terminando. Dia de jogo e dias
     de caravana são ignorados — o GDD §7.3 já os declara travados —, e a
     rotina nunca fura o orçamento de ações da semana (GDD §3.1). */
  function rodarRotina(est){
    const id = (est.rotina||{})[est.data.dia];
    if(!id) return;
    /* dia de jogo do clube, seja de fim de semana ou de meio de semana */
    const meu = TO.mundo.time(est.torcida.clubeId);
    if(meu && TO.competicoes.jogosDaSemana(est, meu.id, est.data.semana)
                .some(j=>j.dia === est.data.dia)) return;
    const cv = TO.financeiro.diasDeCaravana(est);
    if(cv.includes(est.data.dia)) return;
    if(TO.acoes.restantes(est) <= 0) return;

    const r = TO.acoes.executar(est, id);
    const nome = (TO.acoes.porId(id)||{}).nome || id;
    if(r.ok){
      anotar(est, `${nome}: ${r.msg || 'feito'}`, r.tipo==='ruim' ? 'ruim' : 'boa');
    }else{
      /* rotina que não pôde rodar não vira alarme todo dia: junta e sai
         uma linha só no fechamento da semana */
      est.acoes.rotinaFalha = est.acoes.rotinaFalha || {};
      est.acoes.rotinaFalha[nome] = r.msg;
    }
  }

  function avancarDia(){
    rodarRotina(E);
    E.data.dia++;
    E.data.absoluto = (E.data.absoluto||0) + 1;

    let fecho = null;
    if(E.data.dia > 7){
      /* a rodada da semana rola antes do fechamento, pra que o
         resultado do clube já apareça no relatório (GDD §3.2) */
      const meu = TO.mundo.time(E.torcida.clubeId);
      const jogo = meu ? TO.competicoes.jogoDaSemana(E, meu.id, E.data.semana) : null;
      TO.competicoes.jogarSemana(E, E.data.semana);

      fecho = TO.financeiro.fecharSemana(E);
      fecho.jogo = meu ? TO.competicoes.jogoDaSemana(E, meu.id, E.data.semana) : null;
      if(jogo) aplicarResultadoDoClube(E, fecho.jogo);

      /* o mundo das outras torcidas também anda: caixa, brigas e tréguas */
      const mundo = TO.tensao.passarSemana(E);
      fecho.ataques = mundo.ataques;
      fecho.investidas = mundo.investidas;
      for(const a of mundo.ataques) anotar(E, a.txt, 'ruim');
      for(const i of mundo.investidas) anotar(E, i.txt, i.ganhamos?'boa':'ruim');
      E.ultimasNoticias = mundo.noticias;

      E.data.dia = 1; E.data.semana++; E.acoes.usadas = 0;
      /* GDD §5.4: a fila de treino da semana é sorteada de novo */
      TO.membros.sortearFila(E);
      if(E.data.semana > TO.competicoes.SEMANAS_ANO){
        E.data.semana = 1; E.data.ano++;
        guardarTitulos(E);
        /* sobe e desce antes de montar a temporada nova (GDD §18.2) */
        const mov = TO.competicoes.aplicarSobeDesce(E);
        for(const m of mov.filter(x=>x.id===E.torcida.clubeId)){
          const sub = TO.competicoes.subiu(m.de, m.para);
          anotar(E, `${TO.mundo.time(m.id).nome} ${sub?'subiu para':'caiu para'} `+
                    `${m.para} em ${E.data.ano}.`, sub?'boa':'ruim');
          E.indicadores.satisfacao = U.limitar(E.indicadores.satisfacao + (sub?3:-3), 0, 20);
        }
        E.temporada = TO.competicoes.montarTemporada(E);
      }
      sortearProximoJogo(E);
      E.noticias = gerarNoticias(E);
    }
    /* GDD §7.3: a caravana é cobrada na véspera do jogo da semana */
    if(E.proximoJogo && E.data.dia === (E.proximoJogo.dia||6) - 1)
      TO.financeiro.cobrarCaravana(E);

    TO.membros.passarDia(E);
    mudou();
    if(fecho) for(const f of ouvintesFecho) f(fecho, E);
    return fecho;
  }

  /* fila de recados pra tela mostrar quando redesenhar: o que aconteceu
     sozinho enquanto o jogador avançava os dias */
  function anotar(est, msg, tipo){
    (est.avisos = est.avisos || []).push({msg, tipo:tipo||''});
    if(est.avisos.length > 12) est.avisos.shift();
  }

  /* GDD §6.1: a satisfação do torcedor comum sobe com vitória e cai
     com derrota. É o elo entre o desempenho do time e o recrutamento. */
  function aplicarResultadoDoClube(E, j){
    if(!j || !j.jogado) return;
    const I = E.indicadores;
    const venceu = j.gp > j.gc, perdeu = j.gp < j.gc;
    I.satisfacao = U.limitar(I.satisfacao + (venceu?0.8 : perdeu?-0.7 : 0.1), 0, 20);
    I.moral      = U.limitar(I.moral      + (venceu?0.4 : perdeu?-0.4 : 0), 0, 20);
    if(j.mata && j.venceu){
      /* título ou eliminação mexem mais do que rodada de pontos corridos */
      const meu = E.torcida.clubeId;
      I.satisfacao = U.limitar(I.satisfacao + (j.venceu===meu ? 1 : -1), 0, 20);
    }
  }

  function guardarTitulos(E){
    if(!E.temporada) return;
    const t = E.temporada.titulos || [];
    for(const c of E.temporada.competicoes)
      if(c.campeao) t.unshift({ano:E.temporada.ano, comp:c.nome,
                               campeao:c.campeao, vice:c.vice});
    if(t.length > 200) t.length = 200;
    E.temporada.titulos = t;
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
    dataTexto, dataDaSemana, semanaDiaDe, sortearProximoJogo, anotar,
    DIA_JOGO:6,
    salvar, carregar, existeSave, exportar, importar,
    bloquear, estaBloqueado
  };
})();
