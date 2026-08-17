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
  const CARAVANA = 3000;   // GDD §7.3

  /* =======================================================
     O MÊS

     A mensalidade era dividida em quatro e cobrada toda semana. Passa a
     entrar INTEIRA, uma vez por mês, na semana que contém o dia 1 do
     calendário de parede — que é onde uma mensalidade cai na vida real.

     O TOTAL DO ANO NÃO É O MESMO, e é preciso dizer: o ano do jogo tem
     52 semanas, e `SEM = 1/4` tratava o mês como quatro semanas, o que
     dá TREZE meses por ano. Um novato de R$ 20 pagava R$ 260 no ano. Com
     o mês de parede são doze, e ele paga R$ 240 — que é o que "vinte por
     mês" quer dizer. A diferença de 7,7% é conserto, não perda.

     O que muda de verdade é o RITMO: uma data em que o dinheiro chega e
     três semanas em que ele só sai.
     ======================================================= */
  /* a semana contém o dia 1 de algum mês? */
  function semanaDaMensalidade(E, ano, semana){
    ano = ano != null ? ano : E.data.ano;
    semana = semana != null ? semana : E.data.semana;
    for(let d=1; d<=7; d++)
      if(TO.estado.dataDaSemana(ano, semana, d).getDate() === 1) return true;
    return false;
  }
  /* esta é a última semana do mês? é quando o relatório mensal fecha */
  function fimDoMes(E, ano, semana){
    ano = ano != null ? ano : E.data.ano;
    semana = semana != null ? semana : E.data.semana;
    let a = ano, s = semana + 1;
    if(s > TO.competicoes.SEMANAS_ANO){ s = 1; a++; }
    return semanaDaMensalidade(E, a, s);
  }

  /* =======================================================
     PATRIMÔNIO
     A estrutura vive aqui porque é daqui que ela cobra e
     fatura; quem compra e quem mostra é patrimonio.js. O
     nível 1 já nasce com o que o GDD dá de graça.
     ======================================================= */
  function patrimonio(E){
    if(!E.patrimonio) E.patrimonio = {bares:[], lojas:[], subsedes:[], fabrica:false, itens:{}};
    if(!E.patrimonio.itens) E.patrimonio.itens = {};
    const p = E.patrimonio;
    /* GDD §8.1: sede nível 1 já vem com um bar nível 1, grátis */
    if(!p.bares.length)
      p.bares.push({nivel:1, bairro:bairroDeFora(E), gratis:true});
    return p;
  }

  /* GDD §7.2: bar, loja e subsede ficam em zona diferente da sede.
     A regra existe pra empurrar a torcida pra fora do próprio quintal. */
  function bairroDeFora(E, semente){
    const todos = TO.mundo.bairrosDe(E.torcida.mapa);
    if(!todos.length) return '';
    const sede = TO.mundo.bairroDaSede(E.torcida);
    const fora = sede ? todos.filter(b=>b.zona !== sede.zona) : todos;
    const lista = fora.length ? fora : todos;
    /* Endereço não se sorteia: a mesma torcida abre o bar sempre no mesmo
       bairro, em toda partida nova. Quem decide é o hash do nome, não o
       dado do momento — mapa que se remonta a cada save confunde. */
    const b = lista[TO.mapa.hash(`${E.torcida.id}|${semente||'bar'}`) % lista.length];
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
    /* A LINHA SÓ EXISTE NA SEMANA DO DIA 1, e não aparece como zero nas
       outras três: linha de R$ 0 toda semana é ruído que ensina o
       jogador a não ler a tabela. */
    if(semanaDaMensalidade(E))
      juntar(rec, `Mensalidades (${pagantes})`, mens);

    const fator = fatorComercial(E);
    for(const b of p.bares)
      juntar(rec, `Bar${b.bairro?' — '+b.bairro:''} (n${b.nivel})`,
             RECEITA.bar[b.nivel]*multDe(E,b.bairro)*fator*SEM);
    /* GDD §8.3: a fábrica triplica o que a loja fatura */
    const multFab = p.fabrica ? (TO.patrimonio ? TO.patrimonio.FABRICA.multLoja : 3) : 1;
    for(const l of p.lojas){
      if(l.semInsumo){ des.push({rot:`Loja — ${l.bairro}: sem insumo`, v:0, nota:true}); continue; }
      juntar(rec, `Loja${l.bairro?' — '+l.bairro:''} (n${l.nivel})${multFab>1?' · fábrica':''}`,
             RECEITA.loja[l.nivel]*multDe(E,l.bairro)*fator*multFab*SEM);
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

    /* e corta 60% do insumo, que é o outro lado do mesmo negócio */
    const corteIns = p.fabrica ? (TO.patrimonio ? TO.patrimonio.FABRICA.corteInsumo : 0.6) : 0;
    let insumo = 0;
    for(const l of p.lojas) insumo += RECEITA.loja[l.nivel]*INSUMO*(1-corteIns);
    juntar(des, `Insumos das lojas${corteIns?' · fábrica':''}`, insumo*SEM);

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
  /* Torcida organizada não falta jogo: se tem jogo, ela vai. O que se
     decide é o tamanho da caravana e por onde ela passa, não se sai de
     casa. */
  const temCaravana = E => precisaCaravana(E);

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

  /* a postura vira consequência do calendário, não escolha */
  function postura(E){
    if(!E.proximoJogo) return 'folga';
    return precisaCaravana(E) ? 'viajar' : 'estadio';
  }

  function cobrarCaravana(E){
    if(!temCaravana(E)) return null;
    E.caravanasPagas = E.caravanasPagas || {};
    const chave = E.proximoJogo.chave;
    if(E.caravanasPagas[chave]) return null;
    E.caravanasPagas[chave] = true;
    const destino = E.proximoJogo.cidadeAdv || 'fora';
    /* a conta é da estrada e do tamanho da caravana; sem plano, o valor
       cheio do GDD §7.3 */
    const est = TO.planejamento && TO.planejamento.estimativaCaravana(E);
    const valor = est ? est.custo : CARAVANA;
    TO.estado.lancar(E, `Caravana para ${destino}`+
      (est ? ` (${est.vao} pessoas, rateio de ${U.dinheiro(est.rateio)})` : ''),
      -valor);
    /* a lista não pode crescer pra sempre num save de dez temporadas */
    const chaves = Object.keys(E.caravanasPagas);
    if(chaves.length > 80) delete E.caravanasPagas[chaves[0]];
    return {valor, destino};
  }

  /* =======================================================
     O SALDO DA SEMANA
     A conta corrente (contas) mais o que a Gestão decidiu. Um
     é rotina, o outro é escolha, mas os dois saem do mesmo
     caixa — e é esse número que a tela mostra como saldo.
     ======================================================= */
  const compromissos = E =>
    (TO.planejamento && TO.planejamento.compromissos(E))
      || {itens:[], total:0, pago:0, pendente:0};

  function resumoDaSemana(E){
    const c = contas(E), g = compromissos(E);
    return {contas:c, gestao:g,
            receita:c.receita,
            despesa:c.despesa + g.total,
            saldo:  c.saldo   - g.total};
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
      /* o caixa de referência é o do fechamento anterior: só assim o
         "de → para" cobre a semana inteira, inclusive o que saiu no meio
         dela (caravana, recepção, recrutamento, fiança) */
      caixaAntes: E.caixaAberturaSemana != null ? E.caixaAberturaSemana : E.dinheiro,
      caixaDepois:0,
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

    /* O que a Gestão decidiu já saiu do caixa na hora (cobrarCaravana e
       planejamento.confirmar), mas é dinheiro da semana: entra na despesa
       e no saldo. O que não pode é lançar de novo — por isso este bloco
       vem depois do laço de lançamento, e não antes. */
    const comp = compromissos(E);
    if(comp.itens.length){
      rel.compromissos = comp.itens;
      rel.compromissoTotal = comp.total;
      for(const i of comp.itens)
        if(i.v) rel.despesas.push({rot:i.rot, v:i.v, daGestao:true});
      rel.despesa += comp.total;
      rel.saldo   -= comp.total;
    }

    /* loja sem insumo não fatura na semana seguinte (GDD §8.3) */
    const p = patrimonio(E);
    for(const l of p.lojas) l.semInsumo = E.dinheiro < 0;

    /* caixa negativo pesa na moral — mas ninguém debanda (decisão do
       autor: a ideia de debandar saiu do jogo) */
    if(E.dinheiro < 0){
      E.semanasNoVermelho = (E.semanasNoVermelho||0) + 1;
      E.indicadores.moral = U.limitar(E.indicadores.moral - 1, 0, 20);
      rel.avisos.push(`Caixa negativo há ${E.semanasNoVermelho} `+
                      `${E.semanasNoVermelho===1?'semana':'semanas'}. `+
                      'A moral cai toda semana enquanto durar.');
    }else{
      if(E.semanasNoVermelho) rel.avisos.push('Caixa de volta ao azul.');
      E.semanasNoVermelho = 0;
    }

    /* o que o expediente da sede tentou e não conseguiu */
    for(const [nome, msg] of Object.entries(E.acoes.rotinaFalha || {}))
      rel.avisos.push(`Expediente: ${nome} não rodou — ${msg}.`);
    E.acoes.rotinaFalha = {};

    rel.promoveis = E.membros.filter(m=>TO.membros.podePromover(E,m).ok).length;
    rel.caixaDepois = E.dinheiro;
    /* o que o caixa andou além da conta: ação da semana, fiança, multa */
    rel.foraDaConta = Math.round((rel.caixaDepois - rel.caixaAntes) - rel.saldo);
    E.caixaAberturaSemana = E.dinheiro;

    /* O MÊS É O QUE O JOGADOR LÊ; a semana continua sendo o motor.
       `acumularNoMes` soma esta semana no bloco corrente, e na última
       semana do mês o bloco vira `E.ultimoFechamento` — que é o que o
       modal e o botão "Último fechamento" mostram. */
    acumularNoMes(E, rel);
    E.ultimaSemana = rel;
    if(fimDoMes(E)) rel.mes = fecharMes(E);
    E.historicoSemanas = E.historicoSemanas || [];
    E.historicoSemanas.unshift({semana:rel.semana, receita:rel.receita,
                                despesa:rel.despesa, saldo:rel.saldo,
                                caixa:rel.caixaDepois, saidas:rel.saidas.length});
    if(E.historicoSemanas.length > 60) E.historicoSemanas.pop();
    return rel;
  }

  /* =======================================================
     O RELATÓRIO MENSAL

     O fechamento SEMANAL continua sendo o motor: é ele que cobra
     manutenção e insumo, aplica compromisso e dispara a debandada. O que
     vira mensal é o que o jogador VÊ.

     E o motivo é o item 1: com a mensalidade caindo numa semana em
     quatro, a semana isolada mostraria vermelho três vezes em quatro e
     ensinaria o jogador a ignorar a linha. O mês é o ciclo em que a
     receita de verdade entra, então é o período que responde "estou
     ganhando ou perdendo dinheiro?".

     O ALARME NÃO ESPERA O MÊS. Caixa negativo continua sendo aviso da
     semana em que o buraco apareceu, e continua parando o tempo.
     Relatório é balanço; alarme é urgência.
     ======================================================= */
  const mesCorrente = E => E.mesCorrente || null;

  function acumularNoMes(E, rel){
    const m = E.mesCorrente = E.mesCorrente || {
      ano:E.data.ano, semanaDe:rel.semana, semanaAte:rel.semana,
      receitas:{}, despesas:{}, receita:0, despesa:0, saldo:0,
      caixaAntes: rel.caixaAntes, caixaDepois: rel.caixaDepois,
      saidas:0, semanas:0, notas:[], compromissoTotal:0
    };
    /* as linhas se somam POR RÓTULO: quatro semanas de "Manutenção da
       sede (n4)" viram uma linha com o valor do mês, que é como um
       extrato se lê. A mensalidade aparece uma vez porque ela só
       aconteceu uma vez. */
    const junta = (mapa, lista)=>{
      for(const x of lista||[]){
        const k = x.rot;
        mapa[k] = mapa[k] || {rot:k, v:0, daGestao:!!x.daGestao};
        mapa[k].v += x.v;
      }
    };
    junta(m.receitas, rel.receitas);
    junta(m.despesas, rel.despesas);
    m.receita += rel.receita; m.despesa += rel.despesa; m.saldo += rel.saldo;
    m.compromissoTotal += rel.compromissoTotal || 0;
    m.saidas += (rel.saidas||[]).length;
    m.semanaAte = rel.semana; m.semanas++;
    m.caixaDepois = rel.caixaDepois;
    for(const n of rel.notas||[]) if(!m.notas.includes(n)) m.notas.push(n);
    return m;
  }

  /* fecha o bloco e devolve o relatório do mês, na mesma forma que o
     modal já sabe desenhar */
  function fecharMes(E){
    const m = E.mesCorrente;
    if(!m) return null;
    const rel = {
      mensal:true, ano:m.ano, semana:m.semanaAte,
      semanaDe:m.semanaDe, semanaAte:m.semanaAte, semanas:m.semanas,
      receitas:Object.values(m.receitas).sort((a,b)=>b.v-a.v),
      despesas:Object.values(m.despesas).sort((a,b)=>b.v-a.v),
      notas:m.notas,
      receita:m.receita, despesa:m.despesa, saldo:m.saldo,
      compromissoTotal:m.compromissoTotal,
      caixaAntes:m.caixaAntes, caixaDepois:m.caixaDepois,
      saidas:[], avisos:[], promoveis:0,
      saidasNoMes:m.saidas,
      foraDaConta: Math.round((m.caixaDepois - m.caixaAntes) - m.saldo),
      acoesSobrando:TO.acoes.restantes(E)
    };
    E.ultimoFechamento = rel;
    E.mesCorrente = null;
    E.historicoMeses = E.historicoMeses || [];
    E.historicoMeses.unshift({ano:rel.ano, ate:rel.semanaAte,
      receita:rel.receita, despesa:rel.despesa, saldo:rel.saldo,
      caixa:rel.caixaDepois});
    if(E.historicoMeses.length > 26) E.historicoMeses.pop();
    return rel;
  }

  return {contas, resumoDaSemana, compromissos, patrimonio, fatorComercial, bairroDeFora,
          precisaCaravana, temCaravana, cobrarCaravana, diasDeCaravana, diasDaViagem,
          postura, fecharSemana,
          semanaDaMensalidade, fimDoMes, mesCorrente, fecharMes,
          MANUT_SEDE, RECEITA, MANUT, INSUMO, CARAVANA, SEM};
})();
