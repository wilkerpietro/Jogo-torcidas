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

      /* A RELAÇÃO COM O CLUBE (pedido do dono, 18/09/2026) é escala
         própria, 0 a 100, nascida no meio — nem contra, nem de
         joelhos. */
      relacaoClube: 50,
      sequenciaClube: [],

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
                             (opc.torcida||{}).cargos, E.torcida.sedeNivel);
    TO.membros.sortearFila(E);
    E.forcas = {};
    TO.competicoes.usarSave(E);
    E.temporada = TO.competicoes.montarTemporada(E);
    /* a foto do ano zero: sem ela a primeira virada não teria contra o
       que comparar patrimônio, e o balanço sairia vazio */
    if(TO.almanaque) TO.almanaque.tirarFoto(E);
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

  /* =======================================================
     A FICHA DE UM JOGO (extraída em 22/08/2026)

     Era o corpo do `sortearProximoJogo`, e agora é função à parte
     porque outro lugar precisa dela: o itinerário do dia monta a linha
     a partir do jogo DAQUELE dia, e não do "próximo jogo" da semana —
     ver a nota em `itinerario.montar`.
     ======================================================= */
  function fichaDoJogo(est, agenda){
    const M = TO.mundo;
    const meu = M.time(est.torcida.clubeId);
    if(!meu) return null;
    const adv  = agenda ? M.time(agenda.adversario) : M.adversario(meu.id);
    if(!adv) return null;
    const casa = agenda ? agenda.casa : U.rng() < 0.5;
    const mandante = casa ? meu : adv, visitante = casa ? adv : meu;
    const cAdv = M.cidade(adv.mapa);
    return {
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

    est.proximoJogo = fichaDoJogo(est, agenda);
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

    /* a dívida cobra a loja: 30 dias no vermelho e uma vai embora
       por R$ 90 mil (ordem do dono, 02/09/2026) */
    if(TO.financeiro.venderLojaSeEndividado)
      TO.financeiro.venderLojaSeEndividado(E);

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
        /* O ALMANAQUE COLHE ANTES DA VIRADA APAGAR (pedido do dono,
           21/08/2026): o placar de brigas do ano zera quando o ano
           muda, e o ranking do fechamento é o do último dia. Então o
           que a virada vai noticiar é medido AQUI, antes de qualquer
           coisa nova entrar. */
        const anoQueFecha = E.data.ano - 1;
        /* O PLACAR DE BRIGAS É LIDO PRIMEIRO, e a ordem não é gosto:
           `ranking` mede o saldo do ano de cada torcida, e medir o
           saldo ZERA o placar quando o ano virou. Lendo o ranking
           antes, o Rei da Pista saía sempre vazio. */
        /* A FOTO DAS VAGAS DA CONMEBOL sai AQUI, com a temporada
           fechada ainda de pé: a edição nova monta na primeira rodada
           do ano, quando a Série A já virou tabela zerada (correção do
           dono, 24/08/2026 — o campeão da Série B abria o ano na
           Libertadores). */
        if(TO.conmebol && TO.conmebol.fotoDasVagas)
          TO.conmebol.fotoDasVagas(E, anoQueFecha);
        const placarDoAno = TO.almanaque
          ? TO.almanaque.placarDoAnoTodo(E, anoQueFecha) : null;
        const colheita = TO.almanaque ? {
          ano: anoQueFecha,
          placar: placarDoAno,
          /* o prêmio de Torcida do Ano é nacional: colher o top 8 do
             MUNDO podia entregar oito barras e deixar o país de fora */
          ranking: (TO.relacoes.rankingDoPais
                    ? TO.relacoes.rankingDoPais(E)
                    : TO.relacoes.ranking(E)).slice(0, 8)
        } : null;
        const movForca = TO.competicoes.evoluirForca(E);
        /* A FOTO DO ELENCO NA VIRADA (pedido do dono, 19/09/2026): o
           quanto o elenco do NOSSO clube andou pra cima ou pra baixo
           na evolução de fim de ano. É disso que a entrevista de
           começo de temporada fala — "a impressão é que o elenco
           piorou" — e é a única leitura honesta disponível: a força
           do elenco só se mexe aqui, uma vez por ano. */
        {
          const meu = movForca.find(x => x.id === E.torcida.clubeId);
          if(meu) E.elencoVirada = {ano:anoQueFecha, de:meu.de, para:meu.para};
        }
        const mov = TO.competicoes.aplicarSobeDesce(E);
        /* a torcida do clube nas cidades é viva (dono, 02/09/2026):
           fase do ano + crescimento vegetativo das praças */
        TO.mundo.evoluirTorcedores(E, mov);
        if(colheita){
          colheita.sobeDesce = mov;
          colheita.forca = movForca;
          /* os prêmios da virada (dono, 09/09/2026): pagos aqui, com o
             ranking e o placar do ano fechado ainda na mão */
          if(TO.almanaque.premiar)
            colheita.premios = TO.almanaque.premiar(E, colheita);
          /* as páginas ficam guardadas: quem as derrama no feed é o
             `eventosDoDia`, junto com o resto do dia */
          E.almanaquePendente = TO.almanaque.fecharAno(E, colheita);
        }
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
        /* e a foto do ano que começa, pra virada seguinte comparar */
        if(TO.almanaque) TO.almanaque.tirarFoto(E);
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

    /* O MUNDO DE FORA JOGA JUNTO (régua do dono, 23/08/2026): as nove
       ligas sul-americanas e as duas copas da Conmebol andam no mesmo
       dia do jogo. As ligas guardam só a classificação; a Libertadores
       e a Sul-Americana guardam os jogos, porque o clube do jogador
       pode estar nelas e isso é notícia. */
    /* OS JOGOS SAEM ANTES DAS TABELAS (23/08/2026): o país da nossa
       torcida agenda a fecha dele em `E.temporada` e é o `jogarDia`
       que a joga; se as ligas andassem primeiro, elas leriam a fecha
       do dia ainda sem placar e sorteariam por cima. */
    const jogos = TO.competicoes.jogarDia(E, E.data.semana, E.data.dia);

    const passoLigas = TO.ligas ? TO.ligas.rodar(E) : null;
    const passoCM    = TO.conmebol ? TO.conmebol.rodar(E) : null;
    /* e onde tem jogo tem torcida na rua: as brigas entre as IAs
       nascem dos jogos do dia (decisão do dono) — nada disso vira
       mensagem no feed; o registro mora na aba Brigas das Notícias */
    if(TO.relacoes.brigasDeHoje) TO.relacoes.brigasDeHoje(E, jogos);
    /* e o resto do mundo vive o dia: expediente das 138, tretas e
       ataques de bar do trimestre delas, surpresas e estrada */
    if(TO.relacoes.mundoDia) TO.relacoes.mundoDia(E, jogos);
    if(TO.feed) TO.feed.eventosDoDia(E, {jogos, ligas:passoLigas,
                                        conmebol:passoCM});

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
    /* a sequência que o protesto na porta do CT vai ler (pedido do
       dono, 18/09/2026) */
    if(TO.relacaoClube) TO.relacaoClube.registrarResultadoClube(E, venceu, perdeu);
  }

  function guardarTitulos(E){
    if(!E.temporada) return;
    const t = E.temporada.titulos || [];
    for(const c of E.temporada.competicoes)
      if(c.campeao) t.unshift({ano:E.temporada.ano, comp:c.nome,
                               campeao:c.campeao, vice:c.vice});
    /* ~15 títulos por ano: 200 dava uns 13 anos e o Histórico por
       competição perdia o resto (dono, 25/08/2026) — cabem 800 */
    if(t.length > 800) t.length = 800;
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
  /* =======================================================
     O COFRE DE SAVES (pedido do dono, 23/08/2026)

     Era um slot só, escondido atrás de um Ctrl+S, e falhava calado:
     todo `salvar()` devolve `{ok, motivo}` e quase ninguém lia o
     motivo — navegador que recusa o armazenamento derrubava cinco
     anos de jogo sem uma linha na tela.

     Agora são SEIS VAGAS. A vaga `auto` é o autosave e continua na
     chave velha, pra que ninguém perca o que já tinha; as outras
     cinco são do jogador, com nome. Cada vaga guarda o save e um
     cartão pequeno ao lado — torcida, data do jogo, data de verdade
     e tamanho — pra a tela listar sem abrir 300 KB de JSON.

     E toda vaga tem UM ESPELHO FORA DO NAVEGADOR: `paraTexto`
     devolve o save comprimido em base64 e `deTexto` traz de volta.
     É o caminho que sobrevive a tudo — inclusive a página servida em
     sandbox, onde baixar arquivo não funciona.
     ======================================================= */
  /* O SAVE TEM DE CABER (medido em 23/08/2026)

     O feed guarda tudo pra sempre, que é regra do dono, e cada notícia
     de jornal carrega a PÁGINA inteira em `dados` — a rodada da Gazeta
     sozinha é 84% anexo. Medido numa partida corrida até 2031: o save
     chegou a 2.674 KB, dos quais 1.823 KB eram feed, e `localStorage`
     recusou a gravação. É por isso que save sumia ao fechar o jogo:
     estourava a cota, e como quase ninguém lia o `{ok:false}` que
     `salvar()` devolvia, o jogo seguia sem salvar, calado.

     O corte é no ANEXO, nunca na mensagem: notícia com mais de 90 dias
     vai pro save sem a página do jornal e volta como a linha de texto
     dela — que é como ela era antes de os jornais existirem. Nenhuma
     mensagem some, e o histórico continua inteiro. Medido: no ano 3 o
     feed cai de 1.116 KB pra 539 KB.

     Decisão aberta em `dados` NUNCA é tocada: o que ainda vai ser
     respondido carrega o rival, a aposta e a fase da LNT lá dentro. */
  const DIAS_COM_ANEXO = 90;

  function paraGravar(E2){
    const hoje = (E2.data && E2.data.absoluto) || 0;
    const feedLeve = (E2.feed || []).map(m=>{
      if(!m || !m.dados) return m;
      if(!m.respondido && m.peso === 'decisao') return m;
      const quando = (m.quando && m.quando.abs) || 0;
      if(hoje - quando <= DIAS_COM_ANEXO) return m;
      const copia = Object.assign({}, m);
      delete copia.dados;
      copia.semAnexo = true;      // a tela sabe por que não há jornal
      return copia;
    });
    return JSON.stringify(Object.assign({}, E2, {feed:feedLeve}),
                          (k, v) => k === 'ruas' ? undefined : v);
  }

  /* quem quiser gritar quando o save falhar se inscreve aqui: sem isto
     o erro morre no valor de retorno que ninguém lê */
  const ouvintesFalha = [];
  function aoFalharSave(fn){ ouvintesFalha.push(fn); }
  function gritar(r){
    if(r && r.ok) return r;
    for(const f of ouvintesFalha) { try{ f(r); }catch(x){} }
    return r;
  }

  const PASTA  = 'torcida-organizada:vaga:';
  const CARTAO = 'torcida-organizada:cartao:';
  const VAGAS  = ['auto', '1', '2', '3', '4', '5'];
  const chaveDaVaga  = v => v === 'auto' ? CHAVE : PASTA + v;
  const chaveCartao  = v => CARTAO + v;

  /* o armazenamento responde? devolve o porquê quando não */
  function diagnostico(){
    try{
      const k = 'torcida-organizada:teste';
      localStorage.setItem(k, '1');
      const leu = localStorage.getItem(k) === '1';
      localStorage.removeItem(k);
      return leu ? {ok:true}
                 : {ok:false, motivo:'o navegador aceitou gravar mas não '+
                    'devolveu o que gravou — o save some ao fechar'};
    }catch(e){
      return {ok:false, motivo:'o navegador bloqueou o armazenamento '+
              `(${e.name || 'erro'}). Janela anônima e "bloquear dados de `+
              'sites" fazem isso. Use o save por texto ou por arquivo.'};
    }
  }

  function cartaoDe(E2, nome){
    return {nome: nome || '',
            torcida: (E2.torcida||{}).nome || '—',
            sigla: (E2.torcida||{}).sigla || '',
            clube: (E2.torcida||{}).clube || '',
            ano: E2.data.ano, semana: E2.data.semana, dia: E2.data.dia,
            membros: (E2.membros||[]).length,
            quando: new Date().toISOString()};
  }

  /* o que a tela lista: uma linha por vaga, vazia ou não */
  function listarSaves(){
    return VAGAS.map(v=>{
      let cru = null, cartao = null;
      try{ cru = localStorage.getItem(chaveDaVaga(v)); }catch(e){}
      if(!cru) return {vaga:v, auto:v==='auto', vazia:true};
      try{ cartao = JSON.parse(localStorage.getItem(chaveCartao(v))); }catch(e){}
      if(!cartao){
        /* save antigo, gravado antes das vagas: lê o cartão do próprio
           save uma vez e guarda, pra não reabrir 300 KB toda vez */
        try{
          const d = JSON.parse(cru);
          cartao = cartaoDe(d, v === 'auto' ? 'Autosave' : '');
          localStorage.setItem(chaveCartao(v), JSON.stringify(cartao));
        }catch(e){ cartao = {nome:'save ilegível'}; }
      }
      return Object.assign({vaga:v, auto:v==='auto', vazia:false,
                            bytes:cru.length}, cartao);
    });
  }

  function salvarEm(vaga, nome){
    if(!E) return {ok:false, motivo:'sem partida'};
    if(bloqueado) return {ok:false, motivo:'aguarde chegar ao estádio'};
    if(VAGAS.indexOf(vaga) < 0) return {ok:false, motivo:'vaga que não existe'};
    let cru;
    try{
      cru = paraGravar(E);
    }catch(e){
      return gritar({ok:false, motivo:'o save não virou texto: '+e.message});
    }
    try{
      localStorage.setItem(chaveDaVaga(vaga), cru);
      localStorage.setItem(chaveCartao(vaga),
        JSON.stringify(cartaoDe(E, nome || (vaga==='auto' ? 'Autosave' : ''))));
      return {ok:true, bytes:cru.length};
    }catch(e){
      /* cota estourada é o erro mais comum, e o jogador precisa saber
         AGORA: cinco anos de jogo cabem, mas seis saves de 300 KB
         mais o resto do navegador podem não caber */
      const cota = /quota|exceeded|NS_ERROR_DOM_QUOTA/i.test(e.name+e.message);
      return gritar({ok:false, motivo: cota
        ? `o save (${Math.round(cru.length/1024)} KB) não coube: apague uma `+
          'vaga antiga em Jogo → Vagas, ou guarde esta partida em '+
          'arquivo/texto'
        : 'o navegador recusou gravar ('+(e.name||'erro')+')'});
    }
  }

  function carregarDe(vaga){
    let txt = null;
    try{ txt = localStorage.getItem(chaveDaVaga(vaga)); }catch(e){ return null; }
    if(!txt) return null;
    return adotar(txt, vaga);
  }

  function apagarSave(vaga){
    try{
      localStorage.removeItem(chaveDaVaga(vaga));
      localStorage.removeItem(chaveCartao(vaga));
      return {ok:true};
    }catch(e){ return {ok:false, motivo:e.message}; }
  }

  /* põe um save de texto de pé, venha de onde vier */
  function adotar(txt, vaga){
    try{
      const dados = JSON.parse(txt);
      if(dados.versao !== VERSAO) return null;
      E = dados;
      /* de onde esta partida veio, só pra tela marcar a linha */
      E.vaga = vaga || null;
      U.usarSemente(E.semente || 1);
      TO.competicoes.usarSave(E);
      repararSave(E);
      mudou();
      return E;
    }catch(e){ return null; }
  }

  /* =======================================================
     O SAVE FORA DO NAVEGADOR — texto que se copia e se cola

     Comprime com o gzip do próprio navegador (CompressionStream) e
     devolve base64. Um save de 300 KB cabe em uns 25 KB de texto.
     Navegador sem CompressionStream recebe o JSON puro, com um
     prefixo dizendo qual é qual — quem lê não precisa adivinhar.
     ======================================================= */
  const MARCA_Z = 'TO2z:', MARCA_J = 'TO2j:';

  const b64De = bytes =>{
    let s = '';
    for(let i = 0; i < bytes.length; i += 8192)
      s += String.fromCharCode.apply(null, bytes.subarray(i, i+8192));
    return btoa(s);
  };
  const bytesDe = b64 =>{
    const s = atob(b64), a = new Uint8Array(s.length);
    for(let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
  };

  async function paraTexto(){
    if(!E) return {ok:false, motivo:'sem partida'};
    let cru;
    try{ cru = paraGravar(E); }
    catch(e){ return {ok:false, motivo:'o save não virou texto: '+e.message}; }
    if(typeof CompressionStream === 'undefined')
      return {ok:true, texto: MARCA_J + btoa(unescape(encodeURIComponent(cru))),
              cru: cru.length};
    try{
      const fluxo = new Blob([cru]).stream()
        .pipeThrough(new CompressionStream('gzip'));
      const bytes = new Uint8Array(await new Response(fluxo).arrayBuffer());
      return {ok:true, texto: MARCA_Z + b64De(bytes), cru: cru.length};
    }catch(e){
      return {ok:true, texto: MARCA_J + btoa(unescape(encodeURIComponent(cru))),
              cru: cru.length};
    }
  }

  async function deTexto(txt){
    txt = String(txt||'').replace(/\s+/g, '');
    if(!txt) return {ok:false, motivo:'não veio texto nenhum'};
    try{
      let cru;
      if(txt.indexOf(MARCA_Z) === 0){
        const fluxo = new Blob([bytesDe(txt.slice(MARCA_Z.length))]).stream()
          .pipeThrough(new DecompressionStream('gzip'));
        cru = await new Response(fluxo).text();
      } else if(txt.indexOf(MARCA_J) === 0){
        cru = decodeURIComponent(escape(atob(txt.slice(MARCA_J.length))));
      } else if(txt[0] === '{'){
        cru = txt;                       // alguém colou o JSON cru
      } else {
        return {ok:false, motivo:'isso não parece um save do jogo'};
      }
      return adotar(cru) ? {ok:true}
                         : {ok:false, motivo:'save de outra versão do jogo'};
    }catch(e){
      return {ok:false, motivo:'o texto veio quebrado ('+(e.name||'erro')+')'};
    }
  }

  /* o autosave e o Ctrl+S continuam entrando pela mesma porta: a vaga
     em uso, ou a `auto` quando o jogador não escolheu nenhuma */
  /* O AUTOSAVE NUNCA PISA NUMA VAGA DO JOGADOR (correção medida em
     23/08/2026): a vaga numerada era virando a vaga em uso, e o
     autosave passava por cima dela — quem guardava um ponto de
     retorno na semana 21 e seguia jogando encontrava a semana 31 lá
     quando voltava. Ponto de retorno que anda não é ponto de retorno.

     Agora é simples: o relógio grava SEMPRE na vaga `auto`; vaga
     numerada só muda quando o jogador aperta "Salvar aqui". E uma
     cópia por vez, que gravar em dois lugares dobrava o espaço — e
     espaço é justamente o que falta num save de cinco anos. */
  function salvar(){ return salvarEm('auto'); }

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

  /* tem save em QUALQUER vaga? o menu acende o Continuar por isto */
  function existeSave(){
    try{
      return VAGAS.some(v=>!!localStorage.getItem(chaveDaVaga(v)));
    }catch(e){ return false; }
  }

  /* a vaga mais recente, que é a que o Continuar abre */
  function saveMaisNovo(){
    const cheias = listarSaves().filter(x=>!x.vazia && x.quando);
    if(!cheias.length){
      const alguma = listarSaves().find(x=>!x.vazia);
      return alguma ? alguma.vaga : null;
    }
    cheias.sort((a,b)=> a.quando < b.quando ? 1 : -1);
    return cheias[0].vaga;
  }

  function exportar(){
    if(!E) return;
    const nome = `torcida-${E.torcida.nome.replace(/\s+/g,'-').toLowerCase()}`+
                 `-s${E.data.semana}.json`;
    const a = document.createElement('a');
    /* o arquivo leva a partida INTEIRA, com os jornais e tudo: quem
       exporta está fazendo arquivo morto, e arquivo não tem cota */
    a.href = URL.createObjectURL(new Blob([JSON.stringify(E,
                                   (k,v)=>k==='ruas'?undefined:v)],
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
    dataTexto, dataTextoEm, dataDaSemana, semanaDiaDe, sortearProximoJogo,
          fichaDoJogo, anotar,
    DIA_JOGO:6,
    salvar, carregar, existeSave, exportar, importar,
    /* o cofre de saves (dono, 23/08/2026) */
    VAGAS, listarSaves, salvarEm, carregarDe, apagarSave, saveMaisNovo,
    paraTexto, deTexto, diagnostico, aoFalharSave, paraGravar,
    DIAS_COM_ANEXO,
    bloquear, estaBloqueado
  };
})();
