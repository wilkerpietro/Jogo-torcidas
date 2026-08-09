/* =========================================================
   FINANCEIRO — fechamento semanal (GDD §7 e §8)
   ---------------------------------------------------------
   O GDD escreve as receitas e as manutenções por mês, porque
   é assim que um bar fecha caixa. O jogo, porém, decide por
   semana. Em vez de cobrar tudo de uma vez a cada quatro
   semanas — o que deixaria três fechamentos vazios e um
   traumático —, cada semana paga um quarto. O número que o
   jogador vê na tela é sempre o da semana.
   ========================================================= */
window.TO = window.TO || {};

TO.financeiro = (function(){
  const U = TO.util;

  const SEM = 1/4;                                   // mês → semana

  /* GDD §8.1 — manutenção mensal por nível de sede */
  const MANUT_SEDE = [null, 200, 480, 960, 1800, 3000];

  /* GDD §8.3 — receita bruta mensal, antes do bairro e do fator */
  const RECEITA = {bar:[null, 800, 1500, 3000], loja:[null, 1000, 2000, 3600],
                   subsede:600};
  const MANUT   = {bar:[null, 120, 240, 450],   loja:[null, 150, 300, 540],
                   subsede:90};

  const INSUMO   = 0.25;   // GDD §8.3: loja sem insumo não fatura
  const MATERIAL = 16;     // por membro/mês: camisa, tinta, tecido
  const CARAVANA = 3000;   // GDD §7.3

  /* =======================================================
     PATRIMÔNIO
     Ainda não há tela de compra; o que existe é o que o GDD
     dá de graça no nível 1. A estrutura já nasce no formato
     que a loja de patrimônio vai usar.
     ======================================================= */
  function patrimonio(E){
    if(!E.patrimonio) E.patrimonio = {bares:[], lojas:[], subsedes:[], fabrica:false};
    const p = E.patrimonio;
    /* GDD §8.1: sede nível 1 já vem com um bar nível 1, grátis */
    if(!p.bares.length)
      p.bares.push({nivel:1, bairro:bairroDeFora(E), gratis:true});
    return p;
  }

  /* GDD §7.2: bar, loja e subsede ficam em zona diferente da sede.
     A regra existe pra empurrar a torcida pra fora do próprio quintal. */
  function bairroDeFora(E){
    const todos = TO.mundo.bairrosDe(E.torcida.mapa);
    if(!todos.length) return '';
    const sede = TO.mundo.bairroDaSede(E.torcida);
    const fora = sede ? todos.filter(b=>b.zona !== sede.zona) : todos;
    const b = U.escolher(fora.length ? fora : todos);
    return b ? b.nome : '';
  }

  const multDe = (E, nomeBairro) =>
    TO.mundo.multiplicador(TO.mundo.bairro(E.torcida.mapa, nomeBairro));

  /* GDD §7.1: o comércio varia com a fase do time, o prestígio e o
     tamanho da torcida. Fase do time entra junto com as competições;
     por ora valem os dois que já existem. */
  function fatorComercial(E){
    return 0.7 + (E.indicadores.prestigio/20)*0.4
               + U.limitar(E.membros.length/150, 0, 1)*0.3;
  }

  /* =======================================================
     A CONTA DA SEMANA
     Determinística: a mesma função alimenta a tela do
     Financeiro e o fechamento de fato.
     ======================================================= */
  function contas(E){
    const p = patrimonio(E);
    const rec = [], des = [];
    const juntar = (lista, rot, v, extra)=>{
      v = Math.round(v);
      if(v) lista.push(Object.assign({rot, v}, extra||{}));
    };

    /* --- receitas --- */
    let mens = 0, pagantes = 0;
    for(const m of E.membros){
      /* quem está na cadeia não paga: a prisão já custa caro */
      if(m.preso) continue;
      mens += TO.membros.CARGOS[m.cargo].mensalidade;
      pagantes++;
    }
    juntar(rec, `Mensalidades (${pagantes})`, mens*SEM);

    const fator = fatorComercial(E);
    for(const b of p.bares)
      juntar(rec, `Bar${b.bairro?' — '+b.bairro:''} (n${b.nivel})`,
             RECEITA.bar[b.nivel]*multDe(E,b.bairro)*fator*SEM);
    for(const l of p.lojas){
      if(l.semInsumo){ des.push({rot:`Loja — ${l.bairro}: sem insumo`, v:0, nota:true}); continue; }
      juntar(rec, `Loja${l.bairro?' — '+l.bairro:''} (n${l.nivel})`,
             RECEITA.loja[l.nivel]*multDe(E,l.bairro)*fator*SEM);
    }
    for(const s of p.subsedes)
      juntar(rec, `Subsede${s.bairro?' — '+s.bairro:''}`,
             RECEITA.subsede*multDe(E,s.bairro)*fator*SEM);

    /* --- despesas --- */
    juntar(des, `Manutenção da sede (n${E.torcida.sedeNivel})`,
           MANUT_SEDE[E.torcida.sedeNivel]*SEM);
    let manutCom = 0;
    for(const b of p.bares)    manutCom += MANUT.bar[b.nivel];
    for(const l of p.lojas)    manutCom += MANUT.loja[l.nivel];
    for(const s of p.subsedes) manutCom += MANUT.subsede;
    juntar(des, 'Manutenção do comércio', manutCom*SEM);

    let insumo = 0;
    for(const l of p.lojas) insumo += RECEITA.loja[l.nivel]*INSUMO;
    juntar(des, 'Insumos das lojas', insumo*SEM);

    juntar(des, `Material (${E.membros.length} membros)`, E.membros.length*MATERIAL*SEM);

    const soma = l => l.reduce((s,x)=>s+x.v, 0);
    return {receitas:rec, despesas:des,
            receita:soma(rec), despesa:soma(des),
            saldo:soma(rec)-soma(des), insumo:Math.round(insumo*SEM)};
  }

  /* =======================================================
     CARAVANA (GDD §7.3 e §3.2)
     Jogo fora em outra cidade só custa se a torcida decidir
     ir. A postura da semana é que manda; a cobrança é
     automática na véspera, uma vez só por jogo. A chave
     impede que reabrir o save cobre de novo.
     ======================================================= */
  function precisaCaravana(E){
    const j = E.proximoJogo;
    return !!(j && !j.casa && j.mapaAdv && j.mapaAdv !== E.torcida.mapa);
  }
  const temCaravana = E => precisaCaravana(E) && E.postura === 'viajar';

  /* posturas possíveis nesta semana (GDD §3.2) */
  function posturas(E){
    /* semana sem jogo do clube é folga na tabela (GDD §3.1) */
    if(!E.proximoJogo) return [
      {id:'ficar', rot:'Folga na tabela', nota:'o time não joga nesta semana'}
    ];
    if(precisaCaravana(E)) return [
      {id:'viajar', rot:'Viajar', nota:`caravana de ${U.dinheiro(CARAVANA)} e uma ação a menos`},
      {id:'ficar',  rot:'Ficar',  nota:'ninguém sai da cidade'}
    ];
    return [
      {id:'estadio', rot:'Ir ao estádio', nota:'o bonde sai da sede'},
      {id:'ficar',   rot:'Ficar',         nota:'a semana passa sem jogo'}
    ];
  }

  /* GDD §7.3: véspera e dia seguinte da viagem ficam travados. Vale
     sempre que o jogo é fora, em outra cidade — a torcida está
     organizando ou desfazendo a caravana, e a semana perde esses dias
     mesmo que no fim ninguém embarque.

     A conta é feita em dias corridos do ano, não em dias da semana:
     jogo de domingo tem a volta na segunda, que já é da semana
     seguinte. */
  const emDias  = (semana, dia) => (semana-1)*7 + (dia-1);
  const daConta = a => ({semana: Math.floor(a/7)+1, dia:(a%7)+1});

  /* dias corridos ocupados pela caravana de um jogo fora em outra cidade */
  function diasDaViagem(E, j){
    if(!j || j.casa || j.neutro) return [];
    const t = TO.mundo.time(j.adversario);
    if(!t || t.mapa === E.torcida.mapa) return [];
    const a = emDias(j.semana, j.dia);
    return [a-1, a+1].filter(x=>x >= 0);
  }

  /* dias da semana corrente travados, olhando também a semana anterior
     (a volta de domingo cai na segunda) e a seguinte */
  function diasDeCaravana(E){
    const meu = TO.mundo.time(E.torcida.clubeId);
    if(!meu || !E.temporada) {
      if(!precisaCaravana(E)) return [];
      const d = (E.proximoJogo && E.proximoJogo.dia) || 6;
      return [d-1, d+1].filter(x=>x>=1 && x<=7);
    }
    const fora = [];
    for(const s of [E.data.semana-1, E.data.semana, E.data.semana+1]){
      if(s < 1) continue;
      for(const j of TO.competicoes.jogosDaSemana(E, meu.id, s))
        for(const a of diasDaViagem(E, j)){
          const {semana, dia} = daConta(a);
          if(semana === E.data.semana && !fora.includes(dia)) fora.push(dia);
        }
    }
    return fora.sort((x,y)=>x-y);
  }

  function definirPostura(E, id){
    E.postura = id;
    /* trocou depois da véspera? cobra na hora, senão o jogo sai de graça */
    const d = (E.proximoJogo && E.proximoJogo.dia) || 6;
    if(id==='viajar' && E.data.dia >= d-1) cobrarCaravana(E);
    return E.postura;
  }

  function cobrarCaravana(E){
    if(!temCaravana(E)) return null;
    E.caravanasPagas = E.caravanasPagas || {};
    const chave = E.proximoJogo.chave;
    if(E.caravanasPagas[chave]) return null;
    E.caravanasPagas[chave] = true;
    const destino = E.proximoJogo.cidadeAdv || 'fora';
    TO.estado.lancar(E, `Caravana para ${destino}`, -CARAVANA);
    /* a lista não pode crescer pra sempre num save de dez temporadas */
    const chaves = Object.keys(E.caravanasPagas);
    if(chaves.length > 80) delete E.caravanasPagas[chaves[0]];
    return {valor:CARAVANA, destino};
  }

  /* =======================================================
     FECHAMENTO
     ======================================================= */
  function fecharSemana(E){
    const c = contas(E);
    const rel = {
      semana:E.data.semana, ano:E.data.ano,
      receitas:c.receitas.filter(x=>!x.nota), despesas:c.despesas.filter(x=>!x.nota),
      notas:c.despesas.filter(x=>x.nota).map(x=>x.rot),
      receita:c.receita, despesa:c.despesa, saldo:c.saldo,
      caixaAntes:E.dinheiro, caixaDepois:0,
      saidas:[], avisos:[], promoveis:0,
      acoesSobrando:TO.acoes.restantes(E)
    };

    for(const r of rel.receitas) TO.estado.lancar(E, r.rot, r.v);
    for(const d of rel.despesas) TO.estado.lancar(E, d.rot, -d.v);

    /* GDD §7.1: doação esporádica, tanto maior quanto o prestígio */
    if(U.rng() < 0.10){
      const v = Math.round(200 + E.indicadores.prestigio*U.entre(30, 90));
      TO.estado.lancar(E, 'Doação de simpatizante', v);
      rel.receitas.push({rot:'Doação de simpatizante', v});
      rel.receita += v; rel.saldo += v;
    }

    /* loja sem insumo não fatura na semana seguinte (GDD §8.3) */
    const p = patrimonio(E);
    for(const l of p.lojas) l.semInsumo = E.dinheiro < 0;

    /* --- GDD §7.4: caixa negativo por muito tempo esvazia a torcida --- */
    if(E.dinheiro < 0){
      E.semanasNoVermelho = (E.semanasNoVermelho||0) + 1;
      E.indicadores.moral = U.limitar(E.indicadores.moral - 1, 0, 20);
      rel.avisos.push(`Caixa negativo há ${E.semanasNoVermelho} `+
                      `${E.semanasNoVermelho===1?'semana':'semanas'}. `+
                      (E.semanasNoVermelho===1
                        ? 'Se continuar assim, gente começa a sair.'
                        : 'A moral cai toda semana enquanto durar.'));
      if(E.semanasNoVermelho >= 2) rel.saidas = debandada(E);
    }else{
      if(E.semanasNoVermelho) rel.avisos.push('Caixa de volta ao azul.');
      E.semanasNoVermelho = 0;
    }

    /* o que a rotina semanal tentou e não conseguiu */
    for(const [nome, msg] of Object.entries(E.acoes.rotinaFalha || {}))
      rel.avisos.push(`Rotina: ${nome} não rodou — ${msg}.`);
    E.acoes.rotinaFalha = {};

    rel.promoveis = E.membros.filter(m=>TO.membros.podePromover(E,m).ok).length;
    rel.caixaDepois = E.dinheiro;

    E.ultimoFechamento = rel;
    E.historicoSemanas = E.historicoSemanas || [];
    E.historicoSemanas.unshift({semana:rel.semana, receita:rel.receita,
                                despesa:rel.despesa, saldo:rel.saldo,
                                caixa:rel.caixaDepois, saidas:rel.saidas.length});
    if(E.historicoSemanas.length > 60) E.historicoSemanas.pop();
    return rel;
  }

  /* Quem vai embora primeiro: os de moral mais baixa, e entre eles os
     de cargo mais baixo. Diretoria é a última a abandonar o barco. */
  function debandada(E){
    /* acelera com o tempo, mas para de acelerar: sem o teto, a torcida
       evapora em dez semanas e não sobra jogo pra recuperar */
    const peso = Math.min(E.semanasNoVermelho - 1, 4);
    const n = Math.min(E.membros.length - 1,
                       Math.ceil(E.membros.length * 0.03 * peso));
    if(n <= 0) return [];
    const fila = [...E.membros].sort((a,b)=>
      (TO.membros.CARGOS[a.cargo].ordem - TO.membros.CARGOS[b.cargo].ordem)
      || (a.moral - b.moral));
    const saem = fila.slice(0, n);
    const ids = new Set(saem.map(m=>m.id));
    E.membros = E.membros.filter(m=>!ids.has(m.id));
    E.indicadores.satisfacao = U.limitar(E.indicadores.satisfacao - 1, 0, 20);
    return saem.map(m=>({nome:TO.membros.nomeDe(m),
                         cargo:TO.membros.CARGOS[m.cargo].nome}));
  }

  return {contas, patrimonio, fatorComercial, bairroDeFora,
          precisaCaravana, temCaravana, cobrarCaravana, diasDeCaravana, diasDaViagem,
          posturas, definirPostura, fecharSemana,
          MANUT_SEDE, RECEITA, MANUT, CARAVANA, SEM};
})();
