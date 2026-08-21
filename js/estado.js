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
  /* versão 2: o jogo novo — sem tensão, feed só com o esqueleto.
     Save da versão 1 não abre aqui de propósito. */
  const VERSAO = 2;

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

      /* GDD §12: tudo na mesma escala 0–20 */
      indicadores:{ moral:12, prestigio:6 },

      dinheiro: 12000,
      membros: [],
      proximoId: 1,
      transacoes: [],
      estoque:{ bombas:4 },

      acoes:{ usadas:0 },
      /* expediente da sede: manhã, tarde e noite → id de ação */
      expediente:{ manha:null, tarde:null, noite:null },
      /* O FEED É O JOGO, e o feed é HISTÓRICO: ele nasce vazio, é salvo
         inteiro e rola pra trás. Aqui morava `avisos:[]`, uma fita
         cortada em 12 itens que a tela consumia e jogava fora — o que
         caísse em rajada sumia pra sempre. */
      feed: [], feedFila: [], feedCtl: null,
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
    E.forcas = {};
    TO.competicoes.usarSave(E);
    E.temporada = TO.competicoes.montarTemporada(E);
    sortearProximoJogo(E);
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
  /* a mesma data, deslocada em dias — o itinerário do jogo fora
     precisa nomear a véspera e o dia seguinte */
  function dataTextoEm(est, offset){
    const d = dataDe(est||E);
    d.setDate(d.getDate() + (offset||0));
    return {
      curta:`${String(d.getDate()).padStart(2,'0')}/`+
            `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`,
      semana: SEMANA[d.getDay()]
    };
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
      /* a cena dos arredores escolhe o estádio pela capacidade
         (fotos do dono, 19/08/2026) */
      capacidade: mandante.capacidade,
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

  /* MEXE NO CAIXA AGORA, SEM LINHA NO EXTRATO (decisão do dono,
     18/08/2026): bar, loja e festa poluíam a tela de transações com
     dezenas de linhas iguais — o dinheiro continua entrando na hora,
     mas a linha só sai no resumo do fim do mês. `conta` marca quantos
     eventos o grupo teve (as festas do mês). */
  function lancarNoResumo(est, grupo, valor, conta){
    est = est || E;
    est.dinheiro += valor;
    const r = est.resumoMes = est.resumoMes || {};
    const g = r[grupo] = r[grupo] || {rec:0, des:0, n:0};
    if(valor >= 0) g.rec += valor; else g.des -= valor;
    if(conta) g.n++;
  }

  /* linha de extrato SEM mexer no caixa: o dinheiro do resumo já
     entrou aos poucos pelo lancarNoResumo */
  function registrarLinha(est, descricao, valor){
    est = est || E;
    est.transacoes.unshift({
      dia: `${est.data.semana}/${est.data.dia}`,
      descricao, valor
    });
    if(est.transacoes.length > 200) est.transacoes.pop();
  }

  /* =======================================================
     O LIVRO DE MORAL E PRESTÍGIO (pedido do dono, 17/08/2026)
     Todo movimento de indicador passa por aqui, com motivo —
     é este livro que a sub-tela da Torcida mostra item a item.
     O delta gravado é o REALMENTE aplicado (o limitador de
     0–20 come o resto).
     ======================================================= */
  function mexerIndicador(est, ind, delta, motivo){
    est = est || E;
    if(!delta || !est) return 0;
    const I = est.indicadores;
    const antes = I[ind] || 0;
    I[ind] = U.limitar(antes + delta, 0, 20);
    const real = Math.round((I[ind] - antes)*100)/100;
    if(real){
      est.historicoIndicadores = est.historicoIndicadores || [];
      est.historicoIndicadores.unshift({
        dia:`${est.data.semana}/${est.data.dia}`, ano:est.data.ano,
        ind, delta: real, motivo: motivo || ''});
      if(est.historicoIndicadores.length > 300)
        est.historicoIndicadores.pop();
    }
    return real;
  }

  /* -------------------------------------------------------
     TEMPO
     ------------------------------------------------------- */
  /* O EXPEDIENTE DA SEDE roda todo dia comum: manhã, tarde e noite,
     cada turno com a ação que o jogador escolheu. Dia de jogo do clube
     e dias de caravana ficam de fora — a torcida tem mais o que fazer. */
  function rodarExpediente(est){
    /* dia fora do expediente também fica registrado no "Últimos
       turnos" — sem isso a festa sumia por semanas de calendário
       cheio e parecia bug (pedido do dono, 17/08/2026) */
    const folga = motivo => {
      const exp = est.expediente || {};
      if(!exp.manha && !exp.tarde && !exp.noite) return;
      est.acoes.feitas = est.acoes.feitas || [];
      est.acoes.feitas.push({semana:est.data.semana, dia:est.data.dia,
        id:'folga', ok:false, msg:`Expediente de folga: ${motivo}.`});
      if(est.acoes.feitas.length > 60) est.acoes.feitas.shift();
    };
    const meu = TO.mundo.time(est.torcida.clubeId);
    if(meu && TO.competicoes.jogosDaSemana(est, meu.id, est.data.semana)
                .some(j=>j.dia === est.data.dia))
      return folga('dia de jogo do clube');
    const cv = TO.financeiro.diasDeCaravana(est);
    if(cv.includes(est.data.dia)) return folga('dia de caravana');
    TO.acoes.rodarExpediente(est);
  }

  function avancarDia(){
    E.data.dia++;
    E.data.absoluto = (E.data.absoluto||0) + 1;

    let fecho = null;
    if(E.data.dia > 7){
      /* recolhe qualquer jogo que tenha sobrado e avança as fases */
      TO.competicoes.jogarSemana(E, E.data.semana);

      /* TÍTULO FRESCO abre a janela quente do recrutamento por 2
         semanas (tabela do dono) — estadual, copa, o que fechar */
      E.titulosVistos = E.titulosVistos || {};
      for(const c of (E.temporada ? E.temporada.competicoes : [])){
        const k = `${E.data.ano}|${c.id}`;
        if(c.campeao === E.torcida.clubeId && !E.titulosVistos[k]){
          E.titulosVistos[k] = true;
          E.janelaRecruta = {tipo:'titulo',
                             ate: TO.relacoes.semanaAbs(E) + 3};
        }
      }

      fecho = TO.financeiro.fecharSemana(E);
      const meu = TO.mundo.time(E.torcida.clubeId);
      fecho.jogo = meu ? TO.competicoes.jogoDaSemana(E, meu.id, E.data.semana) : null;
      aplicarResultadoDoClube(E, fecho.jogo);

      E.data.dia = 1; E.data.semana++;

      if(E.data.semana > TO.competicoes.SEMANAS_ANO){
        E.data.semana = 1; E.data.ano++;
        /* TODO MUNDO FAZ ANIVERSÁRIO (régua do dono, 20/08/2026): dos
           35 em diante o ano cobra ficha, e aos 46 o sujeito pendura a
           bandeira e vai pra Velha Guarda. O mundo envelhece junto. */
        TO.membros.envelhecer(E);
        if(TO.relacoes.envelhecerDelas) TO.relacoes.envelhecerDelas(E);
        guardarTitulos(E);
        /* o que o clube fez em campo move a moral das torcidas dele */
        for(const c of E.temporada.competicoes){
          if(c.campeao) TO.relacoes.conquistaDoClube(E, c.campeao, 'campeao');
          if(c.vice)    TO.relacoes.conquistaDoClube(E, c.vice, 'vice');
          if(c.campeao === E.torcida.clubeId)
            mexerIndicador(E, 'moral', 2.5, `Título: ${c.nome}`);
        }
        E.classifAnterior = null;
        TO.competicoes.evoluirForca(E);
        const mov = TO.competicoes.aplicarSobeDesce(E);
        for(const m of mov)
          TO.relacoes.conquistaDoClube(E, m.id,
            TO.competicoes.subiu(m.de, m.para) ? 'acesso' : 'rebaixado');
        for(const m of mov.filter(x=>x.id===E.torcida.clubeId)){
          const sub = TO.competicoes.subiu(m.de, m.para);
          /* acesso enche a fila do recrutamento; rebaixamento esvazia */
          TO.torcedores.abrirJanela(E, sub ? 1.6 : 0.45, sub ? 4 : 8);
          mexerIndicador(E, 'moral', sub ? 2 : -3,
            sub ? 'Acesso do clube' : 'Rebaixamento do clube');
          /* e abre a janela de 2 semanas da tabela do dono: acesso é
             regime quente, rebaixamento é regime seco */
          E.janelaRecruta = {tipo: sub ? 'titulo' : 'rebaixamento',
                             ate: TO.relacoes.semanaAbs(E) + 2};
        }
        E.temporada = TO.competicoes.montarTemporada(E);
      }
      sortearProximoJogo(E);
      /* o mundo anda: economia das 138, relações esfriam e os
         ataques-surpresa da semana nova são agendados */
      const mundo = TO.relacoes.passarSemana(E);
      fecho.ataques = mundo.ataques;
    }

    /* o dia que começa agora */
    E.acoes.usadas = 0;
    rodarExpediente(E);
    TO.membros.passarDia(E);

    /* TREINO É ROTINA DA DIRETORIA (decisão do dono, 17/08/2026): todo
       dia a fila é sorteada de novo — prioridade pra quem ainda tem o
       que ganhar, sorteio no resto — e treina sozinha, sem botão. */
    TO.membros.sortearFila(E);
    TO.membros.treinarFila(E);

    /* A PAZ PROLONGADA DEPRECIA (decisão do dono, 17/08/2026): a cada
       20 dias sem participar de briga nenhuma, o prestígio cai 1 na
       régua de 0 a 100 (0,2 no indicador) e a moral cai 0,5. Toda
       briga zera o relógio — quem marca é registrarConfronto. */
    if(E.ultimaBriga === undefined) E.ultimaBriga = E.data.absoluto;
    const marcoPaz = Math.max(E.ultimaBriga, E.ultimaDepreciacao || 0);
    if(E.data.absoluto - marcoPaz >= 20){
      E.ultimaDepreciacao = E.data.absoluto;
      mexerIndicador(E, 'prestigio', -0.2, '20 dias sem briga');
      mexerIndicador(E, 'moral', -0.5, '20 dias sem briga');
      /* A FERRUGEM DA PAZ (régua do dono, 20/08/2026): quem não bate
         desaprende. Cada 20 dias parados tiram 0,2 de força e defesa
         de todo mundo — inclusive de quem está de molho, que é
         justamente quem está mais tempo sem rua. */
      for(const m of E.membros) TO.membros.perder(m, 0.2);
    }

    /* GDD §7.3: a caravana é cobrada na véspera do jogo da semana —
       que é também o dia em que a estrada pode ser fechada */
    if(E.proximoJogo && E.data.dia === (E.proximoJogo.dia||6) - 1){
      TO.financeiro.cobrarCaravana(E);
      if(TO.financeiro.temCaravana(E) && TO.feed)
        TO.feed.emboscadaDaViagem(E);
    }

    /* os jogos de hoje saem hoje, e o feed conta a noite */
    const jogos = TO.competicoes.jogarDia(E, E.data.semana, E.data.dia);
    /* e onde tem jogo tem torcida na rua: as brigas entre as IAs
       nascem dos jogos do dia (decisão do dono) — nada disso vira
       mensagem no feed; o registro mora na aba Brigas das Notícias */
    if(TO.relacoes.brigasDeHoje) TO.relacoes.brigasDeHoje(E, jogos);
    /* e o resto do mundo vive o dia: expediente das 138, tretas e
       ataques de bar do trimestre delas, surpresas e estrada */
    if(TO.relacoes.mundoDia) TO.relacoes.mundoDia(E, jogos);
    if(TO.feed) TO.feed.eventosDoDia(E, {jogos});

    mudou();
    if(fecho) for(const f of ouvintesFecho) f(fecho, E);
    return fecho;
  }

  /* A PORTA DE ENTRADA DO FEED.
     Era uma fila de recados que a tela consumia e descartava, cortada em
     12 itens. Continua sendo a mesma chamada, do mesmo lugar, com os
     mesmos dois argumentos — o que mudou é o que acontece depois: a
     linha vira mensagem do feed, com categoria, peso e voz, e fica lá
     pra sempre. O terceiro argumento é opcional e serve pra quem sabe
     dizer de que categoria é o que está anotando; quem não passa nada
     cai em "resultado", que é o que a maioria dessas linhas é.

     O corte em 12 saiu: sem histórico, mensagem que cai em rajada some
     pra sempre, e aí a rajada vira perda. */
  function anotar(est, msg){
    /* NENHUMA notícia entra no feed sem passar pelo crivo do dono.
       Quem tinha o hábito de anotar aqui perde a voz: o registro vai
       pro console e não pra tela. */
    if(window.console) console.warn('anotar() aposentado:', msg);
  }

  /* o resultado do time mexe na moral da torcida, e é só nela: a
     satisfação do torcedor comum saiu do jogo */
  function aplicarResultadoDoClube(E, j){
    if(!j || !j.jogado) return;
    const venceu = j.gp > j.gc, perdeu = j.gp < j.gc;
    const d = venceu ? 0.6 : perdeu ? -0.6 : 0;
    mexerIndicador(E, 'moral', d,
      venceu ? 'Vitória do clube em campo' : 'Derrota do clube em campo');
    /* o recrutamento olha pro último jogo (tabela do dono): vitória
       anima a praça, derrota esvazia — empate é semana comum */
    E.ultimoJogoClube = {venceu, perdeu};
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

  /* O DIA NA RUA NÃO VAI PRO SAVE, E NÃO PODE IR.
     `E.ruas` era o cache do dia — bondes, rotas, andarilhos, viaturas —,
     e as rotas eram listas de NÓS da malha da cidade, cada nó guardando
     os vizinhos que o guardavam de volta. `JSON.stringify` batia nisso
     e devolvia "Converting circular structure to JSON": o jogo passou um
     tempo sem save nenhum e ninguém viu, porque salvar era Ctrl+S e o
     fechamento de semana engolia o erro.

     O campo não existe mais: a rua deixou de ser simulação e virou
     resolução, e a resolução não guarda estado — ela é chamada, devolve
     o desfecho e acaba. A guarda no `stringify` FICA, e fica de
     propósito: save de partida antiga ainda traz o campo, e escrevê-lo
     de volta seria ressuscitar um cache de um sistema que saiu. */
  function salvar(){
    if(!E) return {ok:false, motivo:'sem partida'};
    if(bloqueado) return {ok:false, motivo:'aguarde chegar ao estádio'};
    try{
      const cru = JSON.stringify(E, (k, v) => k === 'ruas' ? undefined : v);
      localStorage.setItem(CHAVE, cru);
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
      E = dados;
      /* O SAVE VOLTA COM A SEMENTE DELE.
         Sem isto o gerador continuava sendo o `Math.random` com que o
         módulo nasce, e "mesmo save, mesma semente, mesmo feed" era
         mentira: duas cargas do mesmo arquivo davam mundos diferentes.
         Recomeçar o fluxo do zero é reprodutível, que é o que o save
         precisa ser. */
      U.usarSemente(E.semente || 1);
      TO.competicoes.usarSave(E);
      repararSave(E);
      mudou(); return E;
    }catch(e){ return null; }
  }

  /* CONSERTO DE SAVE FERIDO (18/08/2026): entre a v0.12.0 e a v0.12.2,
     os botões de abertura (ideologia, expediente), ataque, caravana e
     guerra caíam por engano no tratamento do convite de festa — cada
     clique cobrava R$ 2.000 de uma "festa da undefined" e sujava as
     relações com a chave 'undefined'. Aqui o save carregado devolve o
     dinheiro e apaga a sujeira, uma vez só. */
  function repararSave(E){
    try{
      if(E.relacoes) delete E.relacoes['undefined'];
      if(E.marcaAjuda) delete E.marcaAjuda['undefined'];
      const erradas = (E.transacoes||[]).filter(t =>
        /Presença na festa da undefined/.test(t.descricao||''));
      if(erradas.length && !E.estornoFestaFeito){
        E.estornoFestaFeito = true;
        lancar(E, 'Estorno — cobrança errada de festa',
               erradas.length * 2000);
      }
    }catch(e){ /* conserto nunca pode derrubar a carga do save */ }
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
        E = dados;
        U.usarSemente(E.semente || 1);
        TO.competicoes.usarSave(E);
        repararSave(E);
        mudou();
        aoTerminar && aoTerminar({ok:true});
      }catch(e){
        aoTerminar && aoTerminar({ok:false, motivo:e.message});
      }
    };
    fr.readAsText(arquivo);
  }

  return {
    get E(){ return E; },
    novo, lancar, lancarNoResumo, registrarLinha,
    mexerIndicador, avancarDia, aoMudar, aoFecharSemana, mudou,
    dataTexto, dataTextoEm, dataDaSemana, semanaDiaDe, sortearProximoJogo, anotar,
    DIA_JOGO:6,
    salvar, carregar, existeSave, exportar, importar,
    bloquear, estaBloqueado
  };
})();
