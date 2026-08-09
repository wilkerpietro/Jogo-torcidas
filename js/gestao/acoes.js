/* =========================================================
   AÇÕES DA SEMANA — GDD §3.1 e §10
   ---------------------------------------------------------
   O nível da sede define quantas ações cabem na semana. É isso
   que dá peso à escolha: atacar o bar rival significa não ir ao
   estádio dos aliados. Upgradar a sede compra tempo, que é a
   moeda mais cara de um jogo de gestão.
   ========================================================= */
window.TO = window.TO || {};

TO.acoes = (function(){
  const U = TO.util;

  /* GDD §3.1. A nota de calibragem do próprio GDD manda começar com
     2, e não 1: sede nível 1 com uma ação deixa o início anêmico. */
  const POR_SEMANA = [null, 2, 2, 3, 3, 3];
  function maximo(E){
    const n = POR_SEMANA[E.torcida.sedeNivel] || 2;
    /* GDD §7.3: em semana de caravana a véspera e o dia seguinte ficam
       travados. Num orçamento semanal, isso é uma ação a menos. */
    return TO.financeiro.temCaravana(E) ? Math.max(1, n-1) : n;
  }
  const restantes = E => Math.max(0, maximo(E) - (E.acoes.usadas||0));

  /* GDD §6.2 */
  const MULT_SEDE   = [null, 1.0, 1.3, 1.7, 2.2, 3.0];
  const CAP_RECRUTA = [null, 2, 4, 8, 14, 22];

  /* =======================================================
     RECRUTAMENTO (GDD §6.2)
     ======================================================= */
  function previsaoRecrutamento(E){
    const I = E.indicadores;
    const base = TO.mundo.baseDeRecrutamento(E.torcida.mapa, E.torcida.clubeId);
    const alcance = base * 0.03;
    /* os três indicadores entram normalizados de 0 a 1 */
    const atratividade = 0.5 + (I.moral/20)*0.4 + (I.prestigio/20)*0.4
                             + (I.satisfacao/20)*0.4;
    const mult = MULT_SEDE[E.torcida.sedeNivel] || 1;
    const cap  = CAP_RECRUTA[E.torcida.sedeNivel] || 2;
    const vaga = TO.membros.capacidade(E) - E.membros.length;
    return {
      base, alcance, atratividade, mult, cap, vaga,
      /* sem a variância, que só é sorteada na hora */
      esperado: Math.min(cap, Math.max(0, Math.round(alcance*atratividade*mult)))
    };
  }

  /* =======================================================
     CATÁLOGO
     Cada ação diz por que não pode, em vez de só ficar cinza.
     ======================================================= */
  const LISTA = [
    {
      id:'treinar', nome:'Treinar membros', icone:'halter', cena:'Sede',
      efeito:'Força e Defesa de quem está na fila',
      disponivel(E){
        const n = E.membros.filter(m=>m.naFila && TO.membros.disponivel(m)).length;
        return n ? {ok:true} : {ok:false, motivo:'ninguém na fila de treino'};
      },
      executar(E){
        const n = TO.membros.treinarFila(E);
        return {ok:true, msg:`${n} treinaram.`};
      }
    },
    {
      id:'recrutar', nome:'Recrutar', icone:'megafone', cena:'Praça',
      efeito:'Novos membros, R$ 5 por novato',
      disponivel(E){
        const p = previsaoRecrutamento(E);
        if(p.vaga <= 0) return {ok:false, motivo:'a sede está cheia'};
        if(p.base <= 0) return {ok:false, motivo:'não há torcedor fora de organizada'};
        return {ok:true, nota:`~${p.esperado} novatos`};
      },
      executar(E){
        const p = previsaoRecrutamento(E);
        /* GDD §6.2: sede cheia bloqueia SEM consumir a ação */
        if(p.vaga <= 0) return {ok:false, msg:'A sede está cheia.', semCusto:true};

        const variancia = U.entre(0.85, 1.15);
        let n = Math.round(p.alcance * p.atratividade * p.mult * variancia);
        n = U.limitar(n, 0, Math.min(p.cap, p.vaga));
        if(n <= 0) return {ok:true, msg:'Ninguém quis entrar essa semana.'};

        for(let i=0;i<n;i++){
          E.membros.push(TO.membros.criar(E, {cargo:'novato', moral:15}));
        }
        TO.estado.lancar(E, `Recrutamento de ${n} novatos`, -5*n);
        E.historicoRecrutamento = E.historicoRecrutamento || [];
        E.historicoRecrutamento.unshift({semana:E.data.semana, n, base:Math.round(p.base)});
        if(E.historicoRecrutamento.length>60) E.historicoRecrutamento.pop();
        return {ok:true, msg:`${n} novatos entraram.`};
      }
    },
    {
      id:'festa', nome:'Festa na sede', icone:'copo', cena:'Sede',
      efeito:'Moral e receita de ingresso e bebida',
      custo:1000,
      disponivel(E){
        return E.dinheiro >= 1000 ? {ok:true}
             : {ok:false, motivo:'custa R$ 1.000'};
      },
      executar(E){
        const publico = E.membros.filter(TO.membros.disponivel).length;
        const receita = publico * U.inteiro(20, 34);
        TO.estado.lancar(E, 'Festa na sede', -1000);
        TO.estado.lancar(E, `Bilheteria e bar da festa (${publico})`, receita);
        E.indicadores.moral = U.limitar(E.indicadores.moral + 2, 0, 20);
        for(const m of E.membros) m.moral = U.limitar(m.moral + 1.5, 0, 20);
        return {ok:true, msg:`Festa lotada. ${U.dinheiro(receita-1000)} de saldo, moral em alta.`};
      }
    },
    {
      id:'social', nome:'Ação social', icone:'megafone', cena:'Praça',
      efeito:'Satisfação da torcida e trégua com a polícia',
      custo:2000,
      disponivel(E){
        return E.dinheiro >= 2000 ? {ok:true}
             : {ok:false, motivo:'custa R$ 2.000'};
      },
      executar(E){
        TO.estado.lancar(E, 'Ação social no bairro', -2000);
        E.indicadores.satisfacao = U.limitar(E.indicadores.satisfacao + 2, 0, 20);
        E.indicadores.policia    = U.limitar(E.indicadores.policia + 1.5, 0, 20);
        return {ok:true, msg:'O bairro agradeceu. Satisfação e relação com a PM subiram.'};
      }
    },
    {
      id:'pichar', nome:'Pichar e colar adesivo', icone:'tijolo', cena:'Rua',
      efeito:'Prestígio e território, mas irrita a polícia',
      custo:300,
      disponivel(E){
        const gente = E.membros.filter(TO.membros.disponivel).length;
        if(gente < 3) return {ok:false, motivo:'precisa de pelo menos três de pé'};
        return E.dinheiro >= 300 ? {ok:true} : {ok:false, motivo:'custa R$ 300 de material'};
      },
      executar(E){
        TO.estado.lancar(E, 'Tinta e adesivo', -300);
        E.indicadores.prestigio = U.limitar(E.indicadores.prestigio + 1, 0, 20);
        E.indicadores.policia   = U.limitar(E.indicadores.policia - 1, 0, 20);
        /* quem pinta muro de madrugada às vezes é pego */
        const aptos = E.membros.filter(TO.membros.disponivel);
        if(aptos.length && U.rng() < 0.18){
          const azarado = U.escolher(aptos);
          TO.membros.prender(E, azarado);
          return {ok:true, msg:`Território marcado, mas ${TO.membros.nomeDe(azarado)} foi preso.`,
                  tipo:'ruim'};
        }
        return {ok:true, msg:'Muro pintado. O bairro é seu.'};
      }
    },
    {
      id:'reuniao', nome:'Reunião de diretoria', icone:'conversa', cena:'Sede',
      efeito:'Aproxima uma torcida aliada',
      disponivel(E){
        const n = E.membros.filter(m=>m.cargo==='diretoria' && TO.membros.disponivel(m)).length;
        if(n < 2) return {ok:false, motivo:'precisa de dois diretores de pé'};
        const alvos = Object.entries(E.relacoes||{}).filter(([,v])=>v > -70);
        if(!alvos.length) return {ok:false, motivo:'ninguém com quem conversar'};
        return {ok:true};
      },
      executar(E){
        /* aproxima quem já está mais perto de virar aliado */
        const alvos = Object.entries(E.relacoes||{})
          .filter(([,v])=>v > -70)
          .sort((a,b)=>b[1]-a[1]);
        const [id, v] = alvos[0];
        const o = TO.mundo.torcida(id);
        E.relacoes[id] = U.limitar(v + 12, -100, 100);
        return {ok:true, msg:`Reunião com ${o?o.nome:'a diretoria aliada'}. Relação em `+
                             `${Math.round(E.relacoes[id])}.`};
      }
    },

    {
      id:'campanha', nome:'Campanha de recrutamento', icone:'megafone', cena:'Sede',
      efeito:'Estica o teto da sede em 50% por duas semanas',
      custo:5000,
      disponivel(E){
        if(TO.membros.emCampanha(E)) return {ok:false, motivo:'já está em campanha'};
        return E.dinheiro >= 5000 ? {ok:true} : {ok:false, motivo:'custa R$ 5.000'};
      },
      executar(E){
        TO.estado.lancar(E, 'Campanha de recrutamento', -5000);
        /* vale esta semana e a próxima */
        E.campanha = {ate: E.data.semana + 1};
        return {ok:true, msg:`Teto da sede em ${TO.membros.capacidade(E)} até `+
                             `o fim da semana ${E.data.semana+1}.`};
      }
    },
    {
      id:'delegacia', nome:'Ir à delegacia', icone:'conversa', cena:'Delegacia',
      efeito:'Negocia a soltura em bloco, 25% mais barato',
      disponivel(E){
        const presos = E.membros.filter(m=>m.preso);
        if(!presos.length) return {ok:false, motivo:'ninguém preso'};
        const menor = Math.round(TO.membros.fianca(presos[0])*0.75);
        if(E.dinheiro < menor)
          return {ok:false, motivo:`nem a fiança mais barata cabe (${U.dinheiro(menor)})`};
        return {ok:true, nota:`${presos.length} na cadeia`};
      },
      executar(E){
        /* do mais barato pro mais caro: solta o máximo que o caixa aguenta */
        const presos = E.membros.filter(m=>m.preso)
          .sort((a,b)=>TO.membros.fianca(a)-TO.membros.fianca(b));
        let gasto = 0; const soltos = [];
        for(const m of presos){
          const v = Math.round(TO.membros.fianca(m)*0.75);
          if(gasto + v > E.dinheiro) break;
          gasto += v; soltos.push(m);
          m.preso = false;
          m.historico.push('Solto em negociação da diretoria');
        }
        if(!soltos.length) return {ok:false, msg:'O delegado não quis conversa.',
                                   semCusto:true};
        TO.estado.lancar(E, `Fianças negociadas (${soltos.length})`, -gasto);
        /* barganhar com a polícia é, no fundo, se aproximar dela */
        E.indicadores.policia = U.limitar(E.indicadores.policia + 0.5, 0, 20);
        return {ok:true, msg:`${soltos.length} soltos por ${U.dinheiro(gasto)}`+
                             `${soltos.length<presos.length?', o resto fica':''}.`};
      }
    },

    /* --- as que dependem de cena, ainda por fazer (GDD §4.1) --- */
    {id:'atacar',    nome:'Atacar bar ou sede rival', icone:'tijolo', cena:'Cena do alvo',
     efeito:'Saque, prestígio e dano ao rival',
     disponivel(){return {ok:false, motivo:'depende da cena do alvo (GDD §4.1)'};}},
    {id:'assalto',   nome:'Assaltar alvo comercial', icone:'dinheiro', cena:'Alvo comercial',
     efeito:'Dinheiro, com risco alto de polícia',
     disponivel(){return {ok:false, motivo:'depende da cena de alvo comercial'};}},
    {id:'pressionar',nome:'Pressionar o clube', icone:'megafone', cena:'CT',
     efeito:'Muda o desempenho do time, gasta relação',
     disponivel(){return {ok:false, motivo:'depende da cena do CT'};}}
  ];

  const porId = id => LISTA.find(a=>a.id===id);

  /* =======================================================
     EXECUÇÃO
     ======================================================= */
  function executar(E, id){
    const a = porId(id);
    if(!a) return {ok:false, msg:'ação desconhecida'};
    if(restantes(E) <= 0)
      return {ok:false, msg:'Não sobrou ação nesta semana.'};

    const d = a.disponivel(E);
    if(!d.ok) return {ok:false, msg:d.motivo};

    const r = a.executar(E);
    /* GDD §6.2: algumas recusas não gastam a ação */
    if(r.ok && !r.semCusto) E.acoes.usadas = (E.acoes.usadas||0) + 1;
    if(r.ok){
      E.acoes.feitas = E.acoes.feitas || [];
      E.acoes.feitas.push({semana:E.data.semana, dia:E.data.dia, id, msg:r.msg});
    }
    return r;
  }

  return {LISTA, porId, maximo, restantes, executar, previsaoRecrutamento,
          POR_SEMANA, CAP_RECRUTA};
})();
