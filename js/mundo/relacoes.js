/* =========================================================
   RELAÇÕES — o único termômetro entre torcidas
   ---------------------------------------------------------
   O indicador de tensão foi removido de vez: tudo que antes
   escalava por tensão agora se baseia na RELAÇÃO (−100 a
   +100). Hostilidade derruba a relação; a semana sem briga
   deixa a relação voltar devagar pro valor natural do grafo.

   Este módulo também carrega a vida econômica das outras
   torcidas: caixa, sede, bar, loja, subsede e arquétipo — a
   mesma tabela de contas que o jogador paga.
   ========================================================= */
window.TO = window.TO || {};

TO.relacoes = (function(){
  const U = TO.util;
  const M = () => TO.mundo;

  /* -------------------------------------------------------
     A ESCALA — os cortes saem de statusDoValor (mundo.js):
     ≤ −70 Maior Rival · < −15 Rival · < 20 Neutro ·
     < 70 Aliado · ≥ 70 Irmandade
     ------------------------------------------------------- */
  /* =======================================================
     A TABELA DA RELAÇÃO (régua do dono, 21/08/2026)

     Todo movimento de relação do jogo mora aqui, e em nenhum
     outro lugar. Antes os números estavam soltos em cinco
     arquivos, de −1 a −26, e rebalancear era caça ao tesouro.

     A RÉGUA: toda mexida vale de 5 a 20 pontos, e BRIGA SEMPRE
     TIRA MAIS. Por isso a faixa é dividida:
       · briga ............ 10 a 20 (só briga entra aqui)
       · resto do negativo . 5 a  9
       · positivo ......... 5 a 20
     Assim nenhum gesto de paz, por maior que seja, azeda a
     relação tanto quanto o menor dos socos.
     ======================================================= */
  const REL = {
    /* --- BRIGA: 10 a 20, sempre o que mais tira --- */
    ataqueGanho:    20,   // invadir o bar, a sede ou a loja dela e vencer
    briga:          18,   // encontro de rua no dia de jogo
    ataquePerdido:  17,   // invadir e apanhar lá dentro
    defesaSegura:   15,   // defender a casa ou a caravana e segurar
    arquibancadaMenos: 13, // arquibancada: encaramos quem era maior
    defesaPerdida:  13,   // defender e perder
    arquibancadaIgual: 12, // arquibancada: efetivo parelho
    arquibancadaMais:  11, // arquibancada: passamos por cima do menor
    treta:          10,   // treta marcada, de efetivo igual

    /* --- NEGATIVO SEM BRIGA: 5 a 9 --- */
    pichacao:        9,   // pichar o território do rival
    largarAliado:    9,   // deixar o aliado apanhando sozinho
    provocar:        8,   // o botão Provocar, na Diplomacia
    ataqueMarcado:   8,   // uma rival marca ataque-surpresa contra nós
    naoReceber:      7,   // aliado na nossa cidade e a gente não recebe
    furarAniversario: 6,  // não aparecer no aniversário da aliada

    /* --- POSITIVO: 5 a 20 --- */
    churrasco:      20,   // recepção de irmandade: carne, bebida e escolta
    descerPeloAliado: 16, // entrar na briga que era dele
    hospedarEscolta: 12,  // hospedar e caminhar junto até o portão
    irAniversario:   8,   // aparecer na festa dela
    hospedar:        7,   // colchão no salão e café de manhã
    reuniao:         6,   // reunião de diretoria com o aliado mais próximo
    aproximar:       5,   // o botão Aproximar, na Diplomacia

    /* --- ENTRE ELAS (IA × IA), na mesma régua --- */
    iaBriga:        16,   // briga entre duas torcidas do mundo
    iaAjudouAmiga:  14,   // quem entrou na briga pela outra
    iaAjudouRival:  12,   // ...e o rival de quem ela ajudou
    iaTreta:        10,   // treta marcada entre elas
    iaConviteAceito: 8,   // convite de festa aceito
    iaConviteRecusado: 6, // convite de festa recusado
    iaReuniao:       6    // reunião de diretoria delas
  };

  const HOSTIL  = -15;   // daqui pra baixo há risco de briga
  const QUENTE  = -55;   // daqui pra baixo o rival vem sozinho
  const ALIADO  =  45;   // daqui pra cima é aliado de verdade

  const nivel = (E, id) => (E.relacoes||{})[id] !== undefined
    ? E.relacoes[id]
    : M().valorInicial(M().relacaoBase(E.torcida.id, id));

  /* hostilidade entre nós e outra torcida: derruba a relação.
     `quanto` positivo = briga (afasta); negativo = gesto de paz. */
  function hostilidade(E, id, quanto){
    E.relacoes = E.relacoes || {};
    const antes = nivel(E, id);
    E.relacoes[id] = U.limitar(antes - quanto, -100, 100);
    /* a convivência conta a partir da última hostilidade */
    if(quanto > 0) (E.marcaHostil = E.marcaHostil || {})[id] = semanaAbs(E);
    return E.relacoes[id] - antes;
  }

  /* ajuda registrada (escolta, recepção, reunião): zera o relógio da
     indiferença da convivência */
  function marcarAjuda(E, id){
    if(id) (E.marcaAjuda = E.marcaAjuda || {})[id] = semanaAbs(E);
  }

  /* =======================================================
     A SEMANA DAS OUTRAS TORCIDAS (item 24 — mantido)
     Cada uma tem caixa, sede com nível, bar, loja, subsede e
     paga a tabela do GDD. O teto de membros é o da sede; o
     bolo da praça limita o crescimento.
     ======================================================= */
  const MENSALIDADE = 0.50*20 + 0.30*50 + 0.15*100 + 0.05*100;   // R$ 45
  const SEM = 1/4;

  const P = () => TO.patrimonio;
  const FIN = () => TO.financeiro;

  /* =======================================================
     A ORDEM DE GASTO DAS OUTRAS TORCIDAS
     (régua do dono, 20/08/2026 — acabou o arquétipo;
      fila RODANTE em 26/08/2026)

     Cada torcida carrega a própria fila, que nasce desta ordem
     — com a FILIAL subida, por ordem do dono. A torcida olha o
     primeiro item que ainda falta e JUNTA DINHEIRO até poder
     pagar: ela não desce a fila atrás de coisa barata só porque
     o de cima ainda não coube.

     UMA POR VEZ (régua do dono, 26/08/2026): comprou um bar, a
     vez do PRÓXIMO bar vai pro fim da fila da torcida — e assim
     com tudo. Ninguém enfileira três bares seguidos enquanto a
     filial espera; o patrimônio cresce em rodízio.

     A SEDE NÃO ESTÁ NA FILA porque não é preferência: é o que
     DESTRAVA. Ela sobe quando o efetivo encosta no teto, ou
     quando é ela que impede o item da vez — loja não cabe em
     sede nível 1, bar nível 2 só existe em sede nível 3. Comprar
     sede não roda a fila: o item travado segue com a vez.
     ======================================================= */
  const ORDEM = ['mma', 'loja', 'bar', 'filial', 'elenco', 'onibus',
                 'subsede',
                 'bombas', 'evoluir:bar', 'evoluir:loja', 'evoluir:subsede',
                 'evoluir:filial'];

  /* a fila viva da torcida: nasce da ORDEM e roda a cada compra.
     Save antigo entra aqui — chave nova vai pro fim, aposentada sai */
  function filaDe(t){
    if(!Array.isArray(t.fila)) t.fila = ORDEM.slice();
    else{
      const tem = new Set(t.fila);
      if(ORDEM.some(ch=>!tem.has(ch)) || t.fila.some(ch=>ORDEM.indexOf(ch)<0))
        t.fila = t.fila.filter(ch=>ORDEM.indexOf(ch)>=0)
                       .concat(ORDEM.filter(ch=>!tem.has(ch)));
    }
    return t.fila;
  }

  /* A CIDADE DA FILIAL DELAS (aprovado pelo dono, 25/08/2026): a IA
     prioriza sempre a praça com MAIS torcedores do clube dela, fora
     da própria e das que já têm filial. */
  function melhorCidadeFilial(E, id, t){
    const o = M().torcida(id);
    if(!o || !o.clubeId) return null;
    const tem = new Set((t.filiais||[]).map(f=>f.cidade).concat([o.mapa]));
    let melhor = null;
    for(const c of (TO.dados.cidades||[])){
      if(tem.has(c.id)) continue;
      const x = (c.times||[]).find(y=>y.clubeId === o.clubeId);
      if(x && x.torcedores > 0 &&
         (!melhor || x.torcedores > melhor.torcedores))
        melhor = {cidade:c.id, torcedores:x.torcedores};
    }
    return melhor && melhor.cidade;
  }
  /* A COMISSÃO TÉCNICA DELAS é a nossa: até três professores, R$ 2.000
     por mês cada, e o treino rendendo +30%, +60% e +100% (régua do
     dono, 20/08/2026). Nenhum cobra entrada, só o mês — o que a fila
     exige de cada contratação é caixa que aguente três meses da folha
     que ela vai deixar. */
  /* a sala de treino delas é a nossa: sede 1 não comporta professor
     nenhum, sede 2 comporta um, sede 3 dois e sede 5 os três */
  const mmaDe = t =>{
    if(!t || !t.mma) return 0;
    return U.limitar(Math.round(t.mma === true ? 1 : t.mma),
                     0, FIN().cabeNaSede(t.sede));
  };
  const ganhoDeleas = t => FIN().GANHO_MMA[mmaDe(t)] || 1;
  const cofreDoProfessor = t => FIN().MMA_MES * 3 * (mmaDe(t) + 1);
  const BOMBA = {lote:5, custo:600, teto:10};
  /* SEM ARQUÉTIPO, a vontade de brigar vem da OUSADIA, que cada
     torcida já tem desde que nasce (sai do poder dela). A escala
     mantém a média de ataques por mês que a tabela dava. */
  const brigaDe = t => t ? 0.6 + (t.ousadia != null ? t.ousadia : 0.25)*1.1 : 1;

  function mundo(E){
    if(E.mundoTorcidas) return E.mundoTorcidas;
    E.mundoTorcidas = {};
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id) continue;
      const membros = o.membros || 20;
      const sede = TO.membros.nivelQueCabe(membros, (o.cargos||{}).diretoria || 0);
      E.mundoTorcidas[o.id] = {
        membros, sede,
        piso: membros,
        caixa: (o.saldo || 200) * 4,
        moral: 12,
        prestigio: U.limitar(Math.round((o.prestigio || 15)/5), 0, 20),
        bares:[{nivel:1}], lojas:[], subsedes:0, fabrica:false,
        /* o menu Financeiro inteiro vale pra elas (decisão do dono,
           18/08/2026): ônibus, professor de MMA e estoque de bombas
           são comprados com o caixa delas, como o jogador faz */
        onibus:0, mma:0, bombas:10,
        /* subsedes em OUTRAS cidades (dono, 25/08/2026) */
        filiais:[],
        /* a fila de compras rodante de cada uma (dono, 26/08/2026) */
        fila: ORDEM.slice(),
        vermelho:0,
        mult: multDaSede(o),
        pool: poolDaPraca(o),
        irmas: M().torcidasEm(o.mapa)
                  .filter(x=>x.clubeId===o.clubeId && x.id!==o.id && !x.incompleta)
                  .map(x=>x.id),
        ousadia: U.limitar((o.poder || 60)/260 + U.entre(-0.15, 0.15), 0.05, 1)
      };
    }
    return E.mundoTorcidas;
  }

  function multDaSede(o){
    const b = M().bairroDaSede(o);
    return b ? M().multiplicador(b) : 1.0;
  }

  const POR_MIL = 0.55;
  function poolDaPraca(o){
    const base = M().baseDeRecrutamento(o.mapa, o.clubeId, () => 0);
    const bolo = base ? Math.round(base*POR_MIL) : 500;
    const jaTem = M().torcidasEm(o.mapa)
      .filter(x=>x.clubeId===o.clubeId && !x.incompleta)
      .reduce((s,x)=>s+(x.membros||20), 0);
    return Math.max(bolo, jaTem);
  }

  function balanco(t, E, id){
    const R = FIN().RECEITA, MAN = FIN().MANUT, fab = P().FABRICA;
    let rec = t.membros * MENSALIDADE;
    /* a moral manda no movimento delas também (régua do dono,
       24/08/2026): a mesma faixa de 0,4 a 1,3, na moral da torcida
       (interna 0–20, ×5 pra régua de 100) */
    const fx = FIN().faixaDaMoral ? FIN().faixaDaMoral((t.moral||12)*5) : 1;
    /* O FATOR COMERCIAL VALE PRA ELAS (assimetria fechada pelo dono,
       27/08/2026): a mesma conta do jogador — 0,7 + prestígio×0,4 +
       tamanho×0,3 —, com o prestígio e o efetivo DELAS. IA nanica
       parava de faturar como média. */
    const fator = fx * (0.7 + ((t.prestigio||0)/20)*0.4
                            + U.limitar(t.membros/150, 0, 1)*0.3);
    for(const b of t.bares) rec += R.bar[b.nivel] * t.mult * fator;
    for(const l of t.lojas) rec += R.loja[l.nivel] * t.mult * fator * (t.fabrica ? fab.multLoja : 1);
    rec += t.subsedes * R.subsede * t.mult * fator;
    /* a filial delas rende pelo bairro da CIDADE DELA, como a nossa
       (assimetria fechada pelo dono, 27/08/2026) — não mais pelo
       bairro da sede-mãe */
    for(const f of (t.filiais||[])){
      rec += R.subsede * (E && id && FIN().multFilial
        ? FIN().multFilial(E, f, id) : t.mult) * fator;
      // manutenção da filial entra junto das despesas abaixo
    }

    let des = FIN().MANUT_SEDE[t.sede];
    for(const b of t.bares) des += MAN.bar[b.nivel];
    for(const l of t.lojas) des += MAN.loja[l.nivel]
                                 + R.loja[l.nivel]*FIN().INSUMO*(t.fabrica ? 1-fab.corteInsumo : 1);
    des += t.subsedes * MAN.subsede;
    for(const f of (t.filiais||[])) des += MAN.subsede * f.nivel;
    /* ônibus e professor de MMA custam o mesmo que pro jogador:
       R$ 1.500 e R$ 2.000 por mês, aqui na fatia semanal */
    /* a frota delas cobra por ônibus, como a do jogador */
    des += frotaIA(t) * 350;
    /* a folha da comissão delas: R$ 2.000 por mês por professor, na
       fatia semanal, do mesmo jeito que a nossa cobra no fechamento */
    des += mmaDe(t) * (FIN().MMA_MES/4.33);
    return {rec, des, saldo:rec - des};
  }

  function espacoDaPraca(E, t){
    const m = E.mundoTorcidas;
    let ocupado = 0;
    for(const ir of t.irmas)
      ocupado += m[ir] ? m[ir].membros
               : (ir === E.torcida.id ? E.membros.length : 0);
    return Math.max(t.piso, t.pool - ocupado);
  }

  const tetoDe = (E, t) =>
    Math.min(TO.membros.SEDE[t.sede].membros, espacoDaPraca(E, t));

  /* UM ITEM DA FILA. Devolve a compra, `null` se essa torcida já
     cumpriu esse item (a fila anda), ou {sede:true} quando quem
     está impedindo não é o dinheiro e sim o tamanho da sede. */
  function itemDaFila(E, t, id, chave){
    const T = P().TETO, PT = P().PONTO;

    if(chave === 'mma'){
      if(mmaDe(t) < FIN().cabeNaSede(t.sede))
        return {tipo:'mma', custo:0, cofre:cofreDoProfessor(t)};
      /* a sala está cheia: uma sede maior comporta mais? */
      return FIN().cabeNaSede(t.sede) < FIN().MMA_MAX ? {sede:true} : null;
    }
    if(chave === 'bombas')
      return t.bombas >= BOMBA.teto ? null
           : {tipo:'bombas', custo:BOMBA.custo};
    if(chave === 'elenco') return elencoAlvo(E, id);
    if(chave === 'onibus'){
      if(frotaIA(t) < FIN().cabeNaSede(t.sede))
        return {tipo:'onibus', custo:FIN().ONIBUS_CUSTO};
      return FIN().cabeNaSede(t.sede) < FIN().ONIBUS_MAX ? {sede:true} : null;
    }

    if(chave === 'filial'){
      const FL = P().FILIAL;
      if((t.filiais||[]).length >= (FL.porSede[t.sede]||0))
        return t.sede < 5 ? {sede:true} : null;
      if((t.prestigio||0) < FL.prestigioMin) return null;
      const cidade = melhorCidadeFilial(E, id, t);
      return cidade ? {tipo:'filial', custo:FL.compra, cidade} : null;
    }
    if(chave === 'evoluir:filial'){
      const FL = P().FILIAL;
      const alvo = (t.filiais||[]).filter(f=>FL.ampliar[f.nivel])
                     .sort((a,b)=>a.nivel-b.nivel)[0];
      return alvo ? {tipo:'ampliar:filial', custo:FL.ampliar[alvo.nivel], alvo}
                  : null;
    }

    /* evoluir: sobe o ponto de nível mais baixo que ainda cabe */
    if(chave.indexOf('evoluir:') === 0){
      const tipo = chave.slice(8), cfg = PT[tipo];
      const lista = tipo === 'subsede' ? [] : t[cfg.plural];
      const temPraOnde = x => cfg.ampliar[x.nivel] != null;
      const alvo = lista.filter(x => temPraOnde(x) &&
                                     x.nivel + 1 <= T[tipo][t.sede].nivel)
                        .sort((a,b)=>a.nivel-b.nivel)[0];
      if(alvo) return {tipo:'ampliar:'+tipo, custo:cfg.ampliar[alvo.nivel], alvo};
      /* tem ponto que subiria, e o que segura é a sede */
      return lista.some(temPraOnde) ? {sede:true} : null;
    }

    /* comprar: abre mais um até o que a sede comporta */
    const lim = T[chave][t.sede], cfg = PT[chave];
    const quantos = chave === 'subsede' ? t.subsedes : t[cfg.plural].length;
    if(quantos < lim.qtd) return {tipo:chave, custo:cfg.compra};
    return T[chave].some((x,n)=> x && n > t.sede && x.qtd > lim.qtd)
         ? {sede:true} : null;
  }

  function proximaCompra(E, t, id){
    /* A SEDE SÓ ENTRA COMO DESTRAVADORA. Ela não fura a fila do dono
       nem quando o efetivo encosta no teto: torcida lotada com a loja
       ainda por comprar compra a LOJA. O teto de gente sobe sozinho
       logo atrás, porque assim que a sede atual não comporta mais
       nenhum ponto, é ela que a fila pede. */
    const subirSede = () => P().SEDE[t.sede+1]
      ? {tipo:'sede', custo:P().SEDE[t.sede+1].custo} : null;

    for(const chave of filaDe(t)){
      const it = itemDaFila(E, t, id, chave);
      if(!it) continue;                    // cumprido: a fila anda
      if(it.sede){                         // travado: quem destrava é a sede
        const s = subirSede();
        if(s) return s;
        continue;                          // sede no teto: segue a fila
      }
      it.chave = chave;                    // pra rodar a fila na compra
      return it;                           // a vez é desta — e ela ESPERA
    }
    /* cumprida a fila do dono inteira, o que sobra vai pra fábrica */
    if(!t.fabrica && t.sede >= P().FABRICA.sede)
      return {tipo:'fabrica', custo:P().FABRICA.custo};
    return null;
  }

  let _mediaDiv = null, _mediaAno = null;
  function mediaDaDivisao(E, div){
    if(_mediaAno !== E.data.ano){ _mediaDiv = {}; _mediaAno = E.data.ano; }
    if(_mediaDiv[div] != null) return _mediaDiv[div];
    const C = TO.competicoes;
    let soma = 0, n = 0;
    for(const t of M().todosTimes){
      if(C.divisaoDe(E, t) !== div) continue;
      soma += C.forcaDe(E, t.id); n++;
    }
    return (_mediaDiv[div] = n ? soma/n : 0);
  }

  function elencoAlvo(E, id){
    const C = TO.competicoes, o = M().torcida(id);
    if(!o || !o.clubeId) return null;
    const time = M().time(o.clubeId);
    if(!time) return null;
    if(C.forcaDe(E, o.clubeId) >= mediaDaDivisao(E, C.divisaoDe(E, time)))
      return null;
    return {tipo:'elenco', clube:o.clubeId, custo:C.custoDoPonto(E, o.clubeId)};
  }

  function economiaDelas(E){
    const m = mundo(E);
    for(const id of Object.keys(m)){
      const t = m[id];
      /* save de antes do Financeiro delas: ganha os campos novos */
      if(t.bombas == null){ t.bombas = 10; t.onibus = t.onibus ? 1 : 0; }
      /* ônibus e professor viraram CONTA, não sim-ou-não — e a conta
         guardada é a que CABE na sede: sem isso ficava professor
         fantasma no cadastro, invisível na ficha e imune à demissão */
      t.mma = mmaDe(t);
      t.onibus = frotaIA(t);
      /* o núcleo das filiais delas cresce devagar até o teto do nível
         (dose do dono, 26/08/2026): ~1 membro a cada 3 semanas */
      for(const f of (t.filiais = t.filiais || []))
        f.membros = Math.min(P().FILIAL.teto[f.nivel] || 0,
                             (f.membros || 8) + (U.rng() < 1/3 ? 1 : 0));
      const b = balanco(t, E, id);
      t.caixa += Math.round(b.saldo * SEM);

      /* A CARAVANA DELAS PAGA ESTRADA (assimetria fechada pelo dono,
         27/08/2026): semana com jogo fora da praça cobra a mesma
         régua do jogador — por cabeça, 40% da torcida, frota
         abatendo. A régua média vale 2 trechos de viagem. */
      const o = M().torcida(id);
      if(o && o.clubeId && TO.competicoes.jogosDaSemana){
        const jogos = TO.competicoes.jogosDaSemana(E, o.clubeId,
                                                   E.data.semana) || [];
        const viaja = jogos.some(j=>{
          if(j.casa) return false;
          const adv = M().time(j.adversario);
          return adv && adv.mapa !== o.mapa;
        });
        if(viaja && TO.planejamento.custoCaravanaIA){
          const n = TO.planejamento.caravanaDe(o, 0, E);
          t.caixa -= TO.planejamento.custoCaravanaIA(n, frotaIA(t));
        }
      }

      /* PERDA DE MEMBROS IGUAL À NOSSA (decisão do dono, 18/08/2026):
         caixa no vermelho derruba a MORAL — 1 por semana, a mesma
         régua do nosso fechamento — e ninguém debanda. Membro delas
         só sai de circulação ferido ou preso, e volta. */
      if(t.caixa < 0){
        t.vermelho++;
        t.moral = U.limitar(t.moral - 1, 0, 20);
        /* duas semanas no vermelho e o professor de MMA vai embora —
           é o corte que qualquer diretoria faria primeiro */
        if(t.vermelho >= 2 && mmaDe(t)) t.mma = mmaDe(t) - 1;
        continue;
      }
      t.vermelho = 0;

      /* A FILA DO DONO, uma compra por semana. Sem colchão de
         arquétipo: o preço é o preço, e quem não tem espera. O
         professor de MMA não cobra entrada, cobra mensalidade — por
         isso ele pede `cofre` em vez de custo. */
      /* a promoção vem ANTES da compra da semana: gente de pé é
         patrimônio, e o que sobrar depois é que vai pra fila */
      promoverDelas(E, t, id);

      const compra = proximaCompra(E, t, id);
      if(compra && t.caixa >= Math.max(compra.custo, compra.cofre || 0)){
        t.caixa -= compra.custo;
        if(compra.tipo === 'sede') t.sede++;
        else if(compra.tipo === 'mma') t.mma = mmaDe(t) + 1;
        else if(compra.tipo === 'bombas')
          t.bombas = Math.min(BOMBA.teto, t.bombas + BOMBA.lote);
        else if(compra.tipo === 'fabrica') t.fabrica = true;
        else if(compra.tipo === 'onibus') t.onibus = frotaIA(t) + 1;
        else if(compra.tipo === 'subsede') t.subsedes++;
        else if(compra.tipo === 'filial')
          (t.filiais = t.filiais || []).push(
            {cidade:compra.cidade, nivel:1, membros:8});
        else if(compra.tipo === 'elenco'){
          E.investimento = E.investimento || {};
          E.investimento[compra.clube] = (E.investimento[compra.clube] || 0) + 1;
          TO.competicoes.usarSave(E);
        }
        else if(compra.tipo.startsWith('ampliar:')) compra.alvo.nivel++;
        else t[P().PONTO[compra.tipo].plural].push({nivel:1});
        /* UMA POR VEZ (dono, 26/08/2026): comprou, a vez desse item
           vai pro fim da fila da torcida. Sede e fábrica não rodam
           nada — não estão na fila. */
        if(compra.chave){
          const fl = filaDe(t), i = fl.indexOf(compra.chave);
          if(i >= 0){ fl.splice(i, 1); fl.push(compra.chave); }
        }
        continue;
      }

      /* o sorteio de 18%/semana saiu: quem recruta agora é o
         expediente diário delas (mundoDia), com o dado do dono */

      if(!compra){
        const cofre = b.des * 12;
        if(t.caixa > cofre)
          t.caixa -= Math.round((t.caixa - cofre) * 0.06 * brigaDe(t));
      }
    }
  }

  /* =======================================================
     RELAÇÃO ENTRE AS OUTRAS TORCIDAS
     Só o valor: nasce do grafo e volta devagar pra ele. Sem
     noticiário próprio — a briga do mundo entra no jogo pelo
     que acontece nas praças em dia de jogo.
     ======================================================= */
  const chaveDe = (a,b) => a < b ? a+'|'+b : b+'|'+a;

  function relacaoDelas(E, a, b){
    E.relacoesDelas = E.relacoesDelas || {};
    const ch = chaveDe(a,b);
    if(E.relacoesDelas[ch] === undefined)
      E.relacoesDelas[ch] = M().valorInicial(M().relacaoBase(a, b));
    return E.relacoesDelas[ch];
  }
  function moverRelacao(E, a, b, quanto){
    const ch = chaveDe(a,b);
    relacaoDelas(E, a, b);
    E.relacoesDelas[ch] = U.limitar(E.relacoesDelas[ch] + quanto, -100, 100);
  }

  /* mexer num indicador delas devolve o delta aplicado — é o número
     que a linha de consequência mostra */
  function mover(E, id, ind, quanto){
    const t = (E.mundoTorcidas||{})[id];
    if(!t || !quanto) return 0;
    const antes = t[ind] || 0;
    t[ind] = U.limitar(antes + quanto, 0, 20);
    return Math.round((t[ind] - antes)*100)/100;
  }
  const indicadoresDe = (E, id) => (E.mundoTorcidas||{})[id] || null;

  const semanaAbs = E => (E.data.ano - 2026)*52 + E.data.semana;

  /* =======================================================
     O QUE ELAS FAZEM CONOSCO
     Relação muito ruim é convite: quanto mais funda, maior a
     chance de a semana trazer um ataque-surpresa — no bar ou
     loja em dia comum, na concentração em dia de jogo em
     casa, na pista a caminho do estádio, ou na estrada se há
     caravana. Só ataca quem pode nos alcançar: torcida da
     nossa praça, ou que está na nossa cidade nesta semana.
     ======================================================= */
  /* a emboscada na estrada não sai daqui: ela é dos rivais da ROTA da
     caravana (planejamento.emboscadaDaRota). E o ataque ao BAR também
     não: ele virou evento do CALENDÁRIO DO TRIMESTRE (decisão do autor
     — estava caindo 2x por mês). Aqui só ficam as surpresas do dia de
     jogo em casa. */
  const ALVOS = [
    {id:'concentracao', peso:2, cena:'praca'},      // dia de jogo em casa
    {id:'pista',        peso:2, cena:'rua'}         // a caminho do estádio
  ];

  function diaDoAtaque(E, id){
    const semente = `${E.data.ano}|${E.data.semana}|${id}`;
    let h = 0;
    for(let i=0;i<semente.length;i++) h = (h*31 + semente.charCodeAt(i)) >>> 0;
    return 1 + (h % 7);
  }

  /* quem pode chegar até nós esta semana */
  function alcanca(E, id){
    const o = M().torcida(id);
    if(!o) return false;
    if(o.mapa === E.torcida.mapa) return true;               // mesma praça
    if(TO.praca && TO.praca.naRuaEm){                        // visitante na cidade
      for(let dia=1; dia<=7; dia++)
        if(TO.praca.naRuaEm(E, dia).some(x=>x.id===id)) return true;
    }
    return false;
  }

  function ataquesContraNos(E){
    const fora = [];
    if(E.ataqueMarcado && !E.ataqueMarcado.resolvido &&
       E.ataqueMarcado.semana === E.data.semana) return fora;
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta) continue;
      const r = nivel(E, o.id);
      if(r > QUENTE) continue;
      if(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) continue;
      if(!alcanca(E, o.id)) continue;
      const t = (E.mundoTorcidas||{})[o.id];
      /* ATAQUE DE NANICA NÃO EXISTE (decisão do dono, 17/08/2026):
         torcida com menos da metade do nosso efetivo não vem — a cena
         abria e acabava na hora, com eles correndo por minoria. O
         contrário vale: efetivo muito maior que o nosso ataca à
         vontade. */
      /* de pé, sem ferido nem preso, dos dois lados (dono, 27/08/2026) */
      const vivoDeles = disponiveisIA(E, o.id);
      if(vivoDeles < TO.membros.aptosParaOEstadio(E).length * 0.5) continue;
      const briga = brigaDe(t);
      /* de −55 pra baixo a chance cresce; em −100, com torcida bem
         ousada, é quase um ataque por mês */
      const chance = ((QUENTE - r)/(100 + QUENTE)) * 0.28 * briga;
      if(U.rng() > chance) continue;

      /* concentração e pista só existem em semana de jogo em casa */
      const jogoEmCasa  = E.proximoJogo && E.proximoJogo.casa;
      if(!jogoEmCasa) continue;
      const sorteio = [];
      for(const a of ALVOS) for(let i=0;i<a.peso;i++) sorteio.push(a);
      const alvo = U.escolher(sorteio);
      const dia = E.proximoJogo.dia || 6;
      E.ataqueMarcado = {torcida:o.id, nome:o.nome, alvo:alvo.id,
                         cena:alvo.cena, mapa:E.torcida.mapa,
                         ano:E.data.ano, semana:E.data.semana, dia};
      hostilidade(E, o.id, REL.ataqueMarcado);
      /* a campana do olheiro pode farejar a fita (dono, 24/08/2026) */
      if(TO.feed && TO.feed.avisoDoOlheiro)
        TO.feed.avisoDoOlheiro(E, {
          chave:`atq|${E.data.ano}|${E.data.semana}|${o.id}|${alvo.id}`,
          alvo:alvo.id, nome:o.nome});
      fora.push({id:o.id, torcida:o.nome, alvo:alvo.id, dia});
      break;              // um ataque-surpresa por semana já é guerra
    }

    /* A SUB-SEDE INIMIGA NA NOSSA PRAÇA (decisão do dono, 26/08/2026):
       torcida de fora que abriu filial na nossa cidade pode atacar a
       gente aqui dentro, com a quantidade de membros da sub-sede dela.
       O nome vem decorado — "Jovem Fla Sub-Sede Fortaleza" — e o bar
       cai em dia comum; concentração/pista só em semana de jogo em
       casa e se o núcleo deles tiver metade do nosso efetivo. */
    if(!fora.length){
      const nomeCid = FIN().nomeCidade ? FIN().nomeCidade(E.torcida.mapa)
                                       : E.torcida.mapa;
      for(const o of M().jogaveis()){
        if(o.id === E.torcida.id || o.incompleta) continue;
        if(o.mapa === E.torcida.mapa) continue;      // essas já vêm por cima
        const t = (E.mundoTorcidas||{})[o.id];
        const f = t && (t.filiais||[]).find(x=>x.cidade === E.torcida.mapa);
        if(!f || (f.membros||0) < 6) continue;       // núcleo pequeno não desce
        if(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) continue;
        const r = nivel(E, o.id);
        if(r > QUENTE) continue;
        const chance = ((QUENTE - r)/(100 + QUENTE)) * 0.18 * brigaDe(t);
        if(U.rng() > chance) continue;

        const jogoEmCasa = E.proximoJogo && E.proximoJogo.casa;
        const aptos = TO.membros.aptosParaOEstadio
          ? TO.membros.aptosParaOEstadio(E).length : E.membros.length;
        const podeRua = jogoEmCasa && f.membros >= aptos * 0.5;
        const alvo = podeRua ? U.escolher(ALVOS) : {id:'bar', cena:'bar'};
        const dia = alvo.id === 'bar'
          ? diaDoAtaque(E, o.id) : (E.proximoJogo.dia || 6);
        if(alvo.id === 'bar' && dia < E.data.dia) continue;  // hash já passou
        E.ataqueMarcado = {torcida:o.id,
                           nome:`${o.nome} Sub-Sede ${nomeCid}`,
                           alvo:alvo.id, cena:alvo.cena,
                           efetivo:f.membros, filial:true,
                           mapa:E.torcida.mapa,
                           ano:E.data.ano, semana:E.data.semana, dia};
        hostilidade(E, o.id, REL.ataqueMarcado);
        if(TO.feed && TO.feed.avisoDoOlheiro)
          TO.feed.avisoDoOlheiro(E, {
            chave:`atqf|${E.data.ano}|${E.data.semana}|${o.id}`,
            alvo:alvo.id, nome:`${o.nome} Sub-Sede ${nomeCid}`});
        fora.push({id:o.id, torcida:o.nome, alvo:alvo.id, dia, filial:true});
        break;
      }
    }

    /* JOGO FORA: A CONCENTRAÇÃO É NA PRAÇA DELES (correção do dono,
       27/08/2026). A concentração e a pista do dia de jogo fora
       acontecem na cidade do MANDANTE — então quem cai em cima é
       torcida hostil DAQUELA praça, nunca a da nossa. A nanica se
       mede contra a CARAVANA que viajou, não contra a torcida
       inteira, e a filial nossa por lá é olheiro fixo do aviso. */
    const j = E.proximoJogo;
    if(!fora.length && j && !j.casa && j.mapaAdv &&
       j.mapaAdv !== E.torcida.mapa){
      const est = TO.planejamento.estimativaCaravana
        ? TO.planejamento.estimativaCaravana(E) : null;
      const crew = (est && est.vao) ||
        TO.membros.aptosParaOEstadio(E).length;
      for(const o of M().torcidasEm(j.mapaAdv)){
        if(o.id === E.torcida.id || o.incompleta) continue;
        if(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) continue;
        const r = nivel(E, o.id);
        if(r > QUENTE) continue;
        if(disponiveisIA(E, o.id) < crew * 0.5) continue;
        const t = (E.mundoTorcidas||{})[o.id];
        const chance = ((QUENTE - r)/(100 + QUENTE)) * 0.28 * brigaDe(t);
        if(U.rng() > chance) continue;
        const sorteio = [];
        for(const a of ALVOS) for(let i=0;i<a.peso;i++) sorteio.push(a);
        const alvo = U.escolher(sorteio);
        const dia = j.dia || 6;
        E.ataqueMarcado = {torcida:o.id, nome:o.nome, alvo:alvo.id,
                           cena:alvo.cena, mapa:j.mapaAdv,
                           ano:E.data.ano, semana:E.data.semana, dia};
        hostilidade(E, o.id, REL.ataqueMarcado);
        if(TO.feed && TO.feed.avisoDoOlheiro)
          TO.feed.avisoDoOlheiro(E, {
            chave:`atq|${E.data.ano}|${E.data.semana}|${o.id}|${alvo.id}`,
            alvo:alvo.id, nome:o.nome, cidade:j.cidadeAdv || '',
            forcar: !!(TO.patrimonio && TO.patrimonio.temFilialEm &&
                       TO.patrimonio.temFilialEm(E, j.mapaAdv))});
        fora.push({id:o.id, torcida:o.nome, alvo:alvo.id, dia});
        break;
      }
    }
    return fora;
  }

  /* =======================================================
     O CALENDÁRIO DO TRIMESTRE (decisão do autor)
     A cada 13 semanas: 1 a 2 TRETAS MARCADAS em rua e, na
     maioria dos trimestres, 1 ataque ao nosso bar. Agendado por
     hash — o mesmo bloco dá sempre o mesmo calendário — e sempre
     FORA de dia de jogo do clube e de dia de caravana.

     A DOSE CAIU PELA METADE (decisão do dono, 24/08/2026): era 2 a 4
     tretas (média 3) e 1 a 2 ataques ao bar (média 1,5) por trimestre.
     Agora é 1 a 2 tretas (média 1,5) e 3 trimestres com ataque pra 1
     sem (média 0,75). A conta vale igual pro mundo inteiro: as IAs
     puxam o mesmo sorteio.
     ======================================================= */
  const SEMANAS_TRI = 13;

  /* sem `id` é o calendário do jogador; com `id`, o da torcida IA —
     o mesmo sorteio por hash vale pro mundo inteiro */
  function eventosDoTrimestre(E, id){
    const H = TO.mapa.hash;
    const bloco = Math.floor((semanaAbs(E) - 1) / SEMANAS_TRI);
    const chave = `tri|${bloco}|${id || E.torcida.id}`;
    const nTreta = 1 + H(chave + '|nt') % 2;      // 1 a 2 (média 1,5)
    const nBar   = H(chave + '|nb') % 4 ? 1 : 0;  // 0 ou 1 (média 0,75)
    const fora = [], usados = new Set();
    const poe = (tipo, i)=>{
      let d = H(`${chave}|${tipo}${i}`) % (SEMANAS_TRI * 7);
      while(usados.has(d)) d = (d + 11) % (SEMANAS_TRI * 7);
      usados.add(d);
      fora.push({tipo, chave:`${chave}|${tipo}${i}`,
                 semanaAbs: bloco*SEMANAS_TRI + Math.floor(d/7) + 1,
                 dia: (d % 7) + 1});
    };
    for(let i=0;i<nTreta;i++) poe('treta', i);
    for(let i=0;i<nBar;i++)   poe('bar', i);
    return fora;
  }

  /* dia comum: sem jogo do nosso clube e sem caravana na estrada */
  function diaComum(E, dia){
    const meu = M().time(E.torcida.clubeId);
    if(meu && TO.competicoes.jogosDaSemana(E, meu.id, E.data.semana)
                .some(j=>j.dia === dia)) return false;
    return !TO.financeiro.diasDeCaravana(E).includes(dia);
  }

  /* o evento do trimestre que cai HOJE, já deslocado pra fora de dia
     de jogo — o deslocamento é determinístico, então o mesmo dia
     reaberto responde igual */
  function eventoDeHoje(E){
    const agora = semanaAbs(E);
    for(const ev of eventosDoTrimestre(E)){
      if(ev.semanaAbs !== agora) continue;
      let dia = ev.dia;
      for(let k=0; k<7 && !diaComum(E, dia); k++) dia = (dia % 7) + 1;
      if(dia === E.data.dia) return Object.assign({}, ev, {dia});
    }
    return null;
  }

  /* quem marca treta e quem vem no bar: a maior rival declarada da
     praça; sem ela, a pior relação local */
  function rivalDaPraca(E, semente){
    const nossa = M().torcida(E.torcida.id) || {};
    const locais = M().torcidasEm(E.torcida.mapa).filter(o=>
      o.id !== E.torcida.id && !o.incompleta &&
      !(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)));
    const vivo = id => ((E.mundoTorcidas||{})[id] || {}).membros
                     || (M().torcida(id)||{}).membros || 0;
    const mrs = locais.filter(o=>(nossa.maioresRivais||[]).includes(o.id))
      .sort((a,b)=>vivo(b.id) - vivo(a.id));
    const hostis = locais.map(o=>({o, rel: nivel(E, o.id)}))
      .filter(x=>x.rel <= -15)
      .sort((a,b)=>a.rel - b.rel || vivo(b.o.id) - vivo(a.o.id));
    /* COM SEMENTE (a treta marcada): sorteia entre TODAS as hostis da
       praça, maior rival e nanica no mesmo balde — treta é de efetivo
       idêntico, então tamanho não pesa (decisão do dono, 17/08/2026).
       O hash mantém o dia determinístico. */
    if(semente){
      const balde = [...new Set(mrs.concat(hostis.map(x=>x.o)))];
      if(!balde.length) return null;
      return balde[TO.mapa.hash(`${semente}|rival`) % balde.length];
    }
    /* sem semente (o bar): a MAIOR rival declarada da praça — pegar a
       primeira da lista punha a Gaviões brigando com a nanica do bairro */
    if(mrs.length) return mrs[0];
    return hostis.length ? hostis[0].o : null;
  }

  function ataqueDeHoje(E){
    const a = E.ataqueMarcado;
    if(!a || a.resolvido) return null;
    return (a.ano === E.data.ano && a.semana === E.data.semana &&
            a.dia === E.data.dia) ? a : null;
  }

  /* o que o clube faz em campo move a moral da torcida dele */
  const CONQUISTA_MORAL = {campeao:2.5, vice:0.8, acesso:2, rebaixado:-3};
  function conquistaDoClube(E, clubeId, tipo){
    const d = CONQUISTA_MORAL[tipo];
    if(!d || !clubeId) return [];
    mundo(E);
    /* a janela quente/seca do recrutamento também é delas (decisão do
       dono, 18/08/2026): título e acesso abrem 2 semanas de 40/20;
       rebaixamento fecha o portão por 2 semanas */
    const janela = tipo === 'campeao' || tipo === 'acesso'
      ? {tipo:'titulo', ate: semanaAbs(E) + 2}
      : tipo === 'rebaixado'
      ? {tipo:'rebaixamento', ate: semanaAbs(E) + 2}
      : null;
    const fora = [];
    for(const o of M().torcidasDe(clubeId)){
      if(o.id === E.torcida.id) continue;
      const delta = mover(E, o.id, 'moral', d);
      if(janela){
        const t = (E.mundoTorcidas||{})[o.id];
        if(t) t.janelaIA = janela;
      }
      if(delta) fora.push({id:o.id, nome:o.nome, delta});
    }
    return fora;
  }

  /* =======================================================
     A SEMANA ESFRIA: a relação volta devagar pro valor
     natural do grafo — mágoa de briga passa, favor também.
     ======================================================= */
  /* O ESFRIAR MORREU (ordem do dono, 31/08/2026): a relação não anda
     mais sozinha de volta pra base — nem a nossa, nem a das IAs entre
     si. O que se constrói ou se quebra fica construído ou quebrado, e
     só EVENTO move o ponteiro: briga, recepção, escolta, aniversário,
     reunião — e a convivência do dono (17/08), que lê as marcas de
     hostilidade e ajuda reais, não o relógio puro. */

  /* =======================================================
     CONVIVÊNCIA (decisão do dono, 17/08/2026)
     Mês (4 semanas) sem hostilidade entre nós e uma torcida
     melhora a relação em +1; dois meses (8 semanas) sem
     nenhuma ajuda pioram em −1. O relógio de cada torcida
     zera na última briga (marcaHostil, via hostilidade) e na
     última ajuda (marcaAjuda: escolta, recepção, reunião).
     ======================================================= */
  function convivencia(E){
    const sa = semanaAbs(E);
    E.marcaHostil = E.marcaHostil || {};
    E.marcaAjuda  = E.marcaAjuda  || {};
    E.convivenciaDesde = E.convivenciaDesde || sa;
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta) continue;
      const h0 = E.marcaHostil[o.id] || E.convivenciaDesde;
      if(sa - h0 >= 4){
        E.relacoes[o.id] = U.limitar(nivel(E, o.id) + 1, -100, 100);
        E.marcaHostil[o.id] = h0 + 4;      // um +1 por mês cheio de paz
      }
      const a0 = E.marcaAjuda[o.id] || E.convivenciaDesde;
      if(sa - a0 >= 8){
        E.relacoes[o.id] = U.limitar(nivel(E, o.id) - 1, -100, 100);
        E.marcaAjuda[o.id] = a0 + 8;       // um −1 a cada dois meses secos
      }
    }
  }

  /* =======================================================
     O RANKING DE TORCIDAS (decisão do dono, 17/08/2026)
     Pontos = (membros + prestígio×2) × média de força e defesa
     dos membros. O prestígio entra na escala de 0 a 100 (peso
     2); a média das IAs sai da MESMA régua que gera as fichas
     delas nas brigas (só o cargo), sem sorteio — é a esperança
     da distribuição, estável de um dia pro outro.
     ======================================================= */
  /* =======================================================
     O QUADRO VIVO DELAS (régua do dono, 20/08/2026)

     Antes a ficha delas era uma CONTA CONGELADA: a pirâmide de
     cargos da fonte, e pronto. Quem crescia só ganhava novato,
     então a torcida ficava mais FRACA quanto mais crescia (5,7
     com 20 membros, 3,5 com 250) e nunca passava disso, com ou
     sem professor.

     Agora cada torcida do mundo tem quadro de verdade: quantos
     em cada cargo e a força média de cada cargo. Ela TREINA
     todo dia, como a nossa — o mesmo passo de 0 a 0,3 por
     sessão, o mesmo número de vagas de treino por nível de sede
     e o mesmo dobro com o professor de MMA —, e PROMOVE pelas
     nossas regras: o cargo só sobe quando encosta na força que
     a promoção exige, custa o mesmo dinheiro e a Diretoria tem
     o mesmo teto por nível de sede.
     ======================================================= */
  const BASE_FICHA = {novato:1, componente:5, frente:10, diretoria:14};
  const ESCADA = ['novato', 'componente', 'frente', 'diretoria'];
  /* quanto do cargo sobe por semana: promoção é ato de diretoria, não
     enxurrada — um décimo do grupo apto por vez */
  const FATIA_PROMO = 0.10;

  function quadroDe(E, id){
    const t = (E.mundoTorcidas||{})[id];
    if(!t) return null;
    if(!t.quadro){
      const o = M().torcida(id);
      const cargos = {novato:0, componente:0, frente:0, diretoria:0}, forca = {};
      for(const [c, n] of TO.membros.planoDeCargos(t.membros, o && o.cargos))
        cargos[c] = (cargos[c] || 0) + n;
      const xp = {}, desgaste = {};
      for(const c of ESCADA){ forca[c] = BASE_FICHA[c] + 1.5; xp[c] = 0; desgaste[c] = 0; }
      t.quadro = {cargos, forca, xp, desgaste, total: t.membros};
    }
    /* o efetivo mexeu desde ontem: quem entra entra por baixo, e quem
       sai sai por baixo também — a mesma porta */
    const q = t.quadro, dif = Math.round(t.membros) - q.total;
    /* save de antes do quadro vivo ganha a coluna de XP */
    if(!q.xp){ q.xp = {}; for(const c of ESCADA) q.xp[c] = 0; }
    if(!q.desgaste){ q.desgaste = {}; for(const c of ESCADA) q.desgaste[c] = 0; }
    if(dif > 0){
      const n = q.cargos.novato;
      q.forca.novato = (n*q.forca.novato + dif*BASE_FICHA.novato)/(n + dif);
      q.xp.novato    = (n*q.xp.novato)/(n + dif);   // quem chega chega zerado
      q.cargos.novato += dif;
    } else if(dif < 0){
      let sai = -dif;
      for(const c of ESCADA){
        const leva = Math.min(sai, q.cargos[c]);
        q.cargos[c] -= leva; sai -= leva;
        if(!sai) break;
      }
    }
    q.total = Math.round(t.membros);
    return q;
  }

  /* a média do quadro: é o número que o ranking mostra */
  function mediaDoQuadro(q){
    let soma = 0, n = 0;
    for(const c of ESCADA){ soma += q.cargos[c]*q.forca[c]; n += q.cargos[c]; }
    return n ? soma/n : BASE_FICHA.novato + 1.5;
  }

  /* O TREINO DELAS, todo dia. As vagas de treino são as da sede (2 no
     nível 1, 20 no 5), então quem tem sede grande treina mais gente:
     o passo médio da NOSSA sessão é 0,15, e o professor dobra. */
  function treinarDelas(E){
    const m = mundo(E);
    for(const id of Object.keys(m)){
      const t = m[id];
      const q = quadroDe(E, id);
      if(!q || !q.total) continue;
      const vagas = TO.membros.SEDE[t.sede].treino;
      const fatia = Math.min(vagas, q.total)/q.total;
      const passo = fatia * 0.15 * ganhoDeleas(t);
      for(const c of ESCADA){
        /* o teto do grupo é o do cargo menos o desgaste permanente que
           sequela e idade já cobraram — treino não devolve isso */
        const teto = Math.max(1, TO.membros.CARGOS[c].teto - (q.desgaste[c] || 0));
        q.forca[c] = Math.min(teto, q.forca[c] + passo);
        /* 1 de XP por sessão, como o nosso — e o professor NÃO dobra
           XP, só treino: quem sobe de cargo sobe pelo rodado */
        q.xp[c] += fatia;
      }
    }
  }

  /* A PROMOÇÃO DELAS, uma vez por semana e pelas NOSSAS regras: o
     grupo só sobe quando a força média dele alcança a que a promoção
     exige, o preço é o mesmo (componente R$ 1.000, frente R$ 5.000) e
     a Diretoria não passa do teto da sede. De cima pra baixo, pra a
     vaga que abre na Diretoria ser ocupada na mesma semana. */
  function promoverDelas(E, t, id){
    const q = quadroDe(E, id);
    if(!q) return 0;
    const C = TO.membros.CARGOS;
    let subiram = 0;
    for(let i = ESCADA.length - 2; i >= 0; i--){
      const cargo = ESCADA[i], acima = ESCADA[i+1], c = C[cargo];
      if(!q.cargos[cargo]) continue;
      /* AS NOSSAS REGRAS, inteiras: XP rodado, força de sobra e o
         dinheiro no caixa. Faltando qualquer uma, ninguém sobe. */
      if(q.xp[cargo] < c.xpPromo) continue;
      if(q.forca[cargo] < c.forcaPromo) continue;
      let quantos = Math.max(1, Math.round(q.cargos[cargo]*FATIA_PROMO));
      quantos = Math.min(quantos, q.cargos[cargo]);
      if(acima === 'diretoria')
        quantos = Math.min(quantos,
          Math.max(0, TO.membros.SEDE[t.sede].diretoria - q.cargos.diretoria));
      if(c.custoPromo) quantos = Math.min(quantos, Math.floor(t.caixa/c.custoPromo));
      if(quantos <= 0) continue;
      t.caixa -= quantos * c.custoPromo;
      const n = q.cargos[acima];
      q.forca[acima] = (n*q.forca[acima] + quantos*q.forca[cargo])/(n + quantos);
      q.xp[acima]    = (n*q.xp[acima]    + quantos*q.xp[cargo])/(n + quantos);
      q.cargos[acima] += quantos;
      q.cargos[cargo] -= quantos;
      subiram += quantos;
    }
    return subiram;
  }

  function mediaDeFichaGerada(o, membrosVivos, E){
    /* SEM BÔNUS DE PODER (decisão do dono, 18/08/2026): a ficha vem só
       do cargo. O `poder` da fonte dava até +3 por cabeça e cravava as
       gigantes acima de todo mundo por decreto; agora o que separa as
       torcidas na média é a pirâmide de cargos e o tamanho. */
    /* professor de MMA delas (decisão do dono, 18/08/2026): quem paga
       os R$ 2.000 por mês tem gente mais treinada — +1 por cabeça, o
       espelho do treino em dobro que o professor dá pro jogador. */
    /* com quadro vivo, a média É o quadro: o professor já entrou nela
       pelo treino em dobro, e não vale contar duas vezes */
    const t = E && E.mundoTorcidas && E.mundoTorcidas[o.id];
    if(t) return mediaDoQuadro(quadroDe(E, o.id));
    /* sem mundo vivo (tela de seleção, bancada), a conta velha */
    const mma = t && t.mma ? 1 : 0;
    const CARGOS = TO.membros.CARGOS;
    const tamanho = Math.min(Math.max(membrosVivos || o.membros || 60, 1), 250);
    const plano = TO.membros.planoDeCargos(tamanho, o.cargos);
    const BASE = {novato:1, componente:5, frente:10, diretoria:14};
    let soma = 0, n = 0;
    for(const [cargo, q] of plano){
      const teto = (CARGOS[cargo] || CARGOS.novato).teto;
      soma += q * Math.min(teto, (BASE[cargo]||1) + 1.5 + mma);
      n += q;
    }
    return n ? soma/n : 1;
  }

  /* =======================================================
     AS BRIGAS ENTRE AS IAs (decisão do dono, 17/08/2026)
     O mundo briga sozinho, mas só onde faz sentido: a briga
     nasce de um JOGO — torcida metida no jogo se pega com a
     torcida do clube adversário ou com hostil local da cidade
     que recebe a partida (Mancha em Flamengo × Palmeiras no
     Rio pode pegar a Jovem Fla ou a Young Flu). Feridos ficam
     de 5 a 15 dias fora; presos, de 15 a 90. Quem vence leva
     prestígio e moral; quem perde, devolve. Tudo vai pro
     registro que a aba Brigas das Notícias mostra — e mexe no
     ranking, porque lá contam os DISPONÍVEIS.
     ======================================================= */
  const CHANCE_BRIGA_JOGO = 0.18;
  function foraDeCombate(E, id){
    const t = (E.mundoTorcidas||{})[id];
    if(!t) return 0;
    const hoje = E.data.absoluto || 0;
    t.feridosIA = (t.feridosIA||[]).filter(x=>x.ate > hoje);
    t.presosIA  = (t.presosIA ||[]).filter(x=>x.ate > hoje);
    return t.feridosIA.reduce((s,x)=>s+x.n, 0) +
           t.presosIA.reduce((s,x)=>s+x.n, 0);
  }
  function disponiveisIA(E, id){
    const t = (E.mundoTorcidas||{})[id];
    const total = t ? t.membros : ((M().torcida(id)||{}).membros || 0);
    return Math.max(0, Math.round(total) - foraDeCombate(E, id));
  }

  /* quantos ônibus a torcida da IA tem: save antigo guardava `true` */
  /* e a garagem delas também: ônibus que não cabe na sede não roda */
  const frotaIA = t => !t || !t.onibus ? 0
    : U.limitar(Math.round(t.onibus === true ? 1 : t.onibus), 0,
                FIN().cabeNaSede(t.sede));

  /* =======================================================
     O PLACAR DE BRIGAS DO ANO (pedido do dono, 20/08/2026)
     Quantas brigas cada torcida venceu e perdeu no ano corrente. O
     saldo (vitórias − derrotas) é a coluna nova do ranking. Vira o
     ano, zera: o contador guarda o ano dele e se refaz sozinho.
     ======================================================= */
  function placarDoAno(E, id){
    if(!E || !id) return null;
    const zero = ()=>({ano:E.data.ano, v:0, d:0});
    if(id === E.torcida.id){
      if(!E.brigasAno || E.brigasAno.ano !== E.data.ano) E.brigasAno = zero();
      return E.brigasAno;
    }
    const t = mundo(E)[id];
    if(!t) return null;
    if(!t.brigasAno || t.brigasAno.ano !== E.data.ano) t.brigasAno = zero();
    return t.brigasAno;
  }
  /* A NOITE DE BRIGA DELAS TAMBÉM RENDE XP, na mesma tabela da nossa
     (3 a 15 pela escala do bonde, ×1,5 pra quem ganha). Sem isso o
     mundo só subiria de cargo pelo treino, e cargo alto (300 de XP
     pra Diretoria) nunca sairia — do mesmo jeito que não sai pra nós
     numa temporada de paz. */
  function xpDeBrigaIA(E, id, venceu, escala){
    const q = quadroDe(E, id);
    if(!q) return;
    const base = escala <= 10 ? 3 : escala <= 30 ? 6 : escala <= 60 ? 10 : 15;
    const ganho = Math.round(base * (venceu ? 1.5 : 1));
    /* SEM DILUIR PELO EFETIVO. Do nosso lado quem vai pra rua leva o
       XP inteiro da noite, e é justamente esse pessoal — o mesmo bonde
       de sempre — que sobe de cargo. Repartir o ganho por toda a
       torcida faria a média subir 1 por ano e ninguém promoveria
       nunca: a média aqui representa quem roda, não quem fica. */
    for(const c of ESCADA) q.xp[c] += ganho;
  }

  function anotarBriga(E, id, venceu, escala){
    /* a torcida do jogador não tem quadro no mundo: o XP dela vem das
       fichas de verdade, que a cena já credita membro a membro */
    if(E.torcida && id !== E.torcida.id) xpDeBrigaIA(E, id, venceu, escala);
    const p = placarDoAno(E, id);
    if(!p) return null;
    if(venceu) p.v++; else p.d++;
    return p;
  }
  const saldoDoAno = (E, id)=>{
    const p = placarDoAno(E, id);
    return p ? p.v - p.d : 0;
  };

  /* todo registro passa por aqui: alimenta a aba Brigas, a notícia de
     segunda e o contador que invalida o cache do ranking */
  function registrarBrigaIA(E, reg){
    E.brigasIA = E.brigasIA || [];
    E.brigasIA.unshift(reg);
    /* a maior treta do ano é medida na hora: o anuário lê no fim, e
       varrer o feed lá na frente não acharia a briga de janeiro */
    if(TO.almanaque && TO.almanaque.anotarTreta) TO.almanaque.anotarTreta(E, reg);
    if(E.brigasIA.length > 300) E.brigasIA.pop();
    E.brigasIATotal = (E.brigasIATotal || 0) + 1;
    /* o placar do ano de cada lado, que vira o saldo no ranking — e a
       noite rendeu XP pros dois, na tabela da nossa */
    if(reg.a && reg.a.id) anotarBriga(E, reg.a.id, !!reg.ganhouA, reg.a.n);
    if(reg.b && reg.b.id) anotarBriga(E, reg.b.id, !reg.ganhouA, reg.b.n);
    /* a noite zera o relógio da paz dos dois e cobra o que custou */
    const m = E.mundoTorcidas || {}, abs = E.data.absoluto || 0;
    for(const lado of [reg.a, reg.b]){
      if(!lado || !lado.id || !m[lado.id]) continue;
      m[lado.id].ultimaBrigaIA = abs;
      desgasteDaNoite(E, lado.id, lado.feridos, lado.presos);
    }
    return reg;
  }

  /* BAIXA VINDA DE BRIGA NOSSA (conferência do dono, 18/08/2026): o
     rival que apanha da gente também sai de circulação — ferido 30
     dias fora, preso de 15 a 90 — na mesma régua das brigas entre
     IAs. Antes a mensagem contava os feridos e o efetivo dele
     seguia inteiro. */
  /* =======================================================
     O DESGASTE DELAS (régua do dono, 20/08/2026)
     As mesmas quatro cobranças da nossa ficha, traduzidas pro
     quadro por cargo: sequela de briga, ferrugem de cadeia,
     ferrugem da paz e idade. Elas não têm ficha individual —
     o que se mexe é a MÉDIA do cargo, na proporção de quantos
     do grupo passaram por aquilo.
     ======================================================= */
  /* membros.js carrega DEPOIS deste arquivo: a régua da idade tem de
     ser lida na hora de usar, não na hora de definir */
  const M_ = () => TO.membros;
  /* uma sequela custa de 0,06 a 0,15 (30% da régua velha, decisão do
     dono, 24/08/2026), e pega 15% dos feridos: na média do grupo isso
     é 0,15 × 0,105 por ferido */
  const SEQUELA_MEDIA = 0.15 * 0.105;
  /* a pena média de briga fica na faixa dos 30 a 60 dias, que a tabela
     do dono (a 30%) cobra em 0,3 */
  const CADEIA_MEDIA = 0.3;

  function desgastarQuadro(E, id, quanto, permanente){
    const q = quadroDe(E, id);
    if(!q || !quanto) return;
    for(const c of ESCADA){
      if(permanente) q.desgaste[c] = (q.desgaste[c] || 0) + quanto;
      q.forca[c] = Math.max(1, q.forca[c] - quanto);
    }
  }
  /* o que a noite cobrou do grupo: feridos deixam sequela e presos
     voltam enferrujados, diluídos no efetivo que ficou */
  function desgasteDaNoite(E, id, feridos, presos){
    const q = quadroDe(E, id);
    if(!q || !q.total) return;
    /* sequela deixa marca (teto abaixo); cadeia só enferruja */
    desgastarQuadro(E, id, ((feridos||0)*SEQUELA_MEDIA)/q.total, true);
    desgastarQuadro(E, id, ((presos||0)*CADEIA_MEDIA)/q.total, false);
  }

  /* A FERRUGEM DA PAZ delas: a mesma régua nossa — 0,2 a cada 20 dias
     sem briga. O relógio de cada uma é a última briga registrada. */
  function ferrugemDaPaz(E){
    const m = mundo(E), abs = E.data.absoluto || 0;
    for(const id of Object.keys(m)){
      const t = m[id];
      if(t.ultimaBrigaIA == null) t.ultimaBrigaIA = abs;
      const marco = Math.max(t.ultimaBrigaIA, t.ultimaFerrugem || 0);
      if(abs - marco < 20) continue;
      t.ultimaFerrugem = abs;
      desgastarQuadro(E, id, 0.2);
    }
  }

  /* A IDADE DELAS. Sem ficha individual não há como saber quem tem 35;
     o que dá pra saber é quanto do grupo tem. Com as idades espalhadas
     de 16 a 45 como as nossas, todo ano 11 dos 30 anos de faixa estão
     no declínio (0,6 cada) e 1 dos 30 pendura a bandeira. */
  const faixaDeIdade = () => M_().IDADE_MAX - M_().IDADE_MIN + 1;
  const desgasteDelas = () => M_().DESGASTE_ANO *
    (M_().IDADE_MAX - M_().IDADE_DECLINIO + 1) / faixaDeIdade();
  const aposentaPorAno = () => 1 / faixaDeIdade();
  function envelhecerDelas(E){
    const m = mundo(E);
    const FAIXA = faixaDeIdade(), APOSENTA = aposentaPorAno();
    for(const id of Object.keys(m)){
      const t = m[id];
      const q = quadroDe(E, id);
      if(!q || !q.total) continue;
      desgastarQuadro(E, id, desgasteDelas(), true);   // idade não volta
      /* quem pendura a bandeira sai do efetivo; o recrutamento repõe
         por baixo, que é o que puxa a média da torcida pra baixo.
         SAI DE TODO CARGO, na mesma proporção: idade não escolhe
         patente. Tirar os 3,3% só do topo esvaziava a Diretoria e a
         Linha de Frente em poucos anos — o mundo inteiro virava
         novato e a força média despencava pra 6 e ficava lá. */
      for(const c of ESCADA)
        q.cargos[c] = Math.max(0, q.cargos[c] - Math.round(q.cargos[c] * APOSENTA));
      q.total = ESCADA.reduce((s,c)=>s+q.cargos[c], 0);
      /* quem pendurou a bandeira levou o desgaste junto: o grupo que
         fica é mais novo, e o teto dele alivia na mesma proporção */
      for(const c of ESCADA)
        q.desgaste[c] = Math.max(0, (q.desgaste[c] || 0) * (1 - APOSENTA*FAIXA/6));
      t.membros = Math.max(1, q.total);
      t.piso = Math.min(t.piso, t.membros);
    }
  }

  function baixasIA(E, id, feridos, presos){
    const t = mundo(E)[id];
    if(!t) return;
    desgasteDaNoite(E, id, feridos, presos);
    /* o contador entra na chave do cache do ranking: baixa nossa tem
       de derrubar a posição deles na hora, como a briga de IA já faz */
    E.baixasIASeq = (E.baixasIASeq || 0) + 1;
    const abs = E.data.absoluto || 0;
    if(feridos > 0)
      (t.feridosIA = t.feridosIA||[]).push({n:Math.round(feridos),
                                          ate: abs + U.inteiro(5, 15)});
    if(presos > 0)
      (t.presosIA = t.presosIA||[]).push({n:Math.round(presos),
                                          ate: abs + U.inteiro(15, 90)});
  }

  function brigaIA(E, a, b, cidade, jogoRot, opts){
    opts = opts || {};
    const abs = E.data.absoluto || 0;
    const dispA = disponiveisIA(E, a.id), dispB = disponiveisIA(E, b.id);
    if(dispA < 8 || dispB < 8) return null;
    /* quem é da cidade bota mais gente na rua; quem viajou traz caravana */
    const bonde = (o, disp) => Math.max(4, Math.round(disp *
      (o.mapa === cidade ? U.entre(0.18, 0.35) : U.entre(0.08, 0.18))));
    /* tetos por cena (o bar do mundo usa 60 do atacante × 40 do
       defensor, régua do dono de 18/08/2026) */
    const nA = Math.min(dispA, bonde(a, dispA), opts.tetoA || Infinity);
    const nB = Math.min(dispB, bonde(b, dispB), opts.tetoB || Infinity);
    /* A ESCOLTA DO MUNDO (decisão do dono, 18/08/2026): quem viaja pra
       cidade de um aliado pode ter o anfitrião na briga — o bonde da
       casa entra do lado do hóspede, como a nossa escolta */
    const ajuda = lado => {
      const anf = lado === 'a' ? opts.ajudaA : opts.ajudaB;
      if(!anf) return null;
      const n = Math.max(3, Math.round(disponiveisIA(E, anf.id) * 0.15));
      return {o:anf, n};
    };
    const ajA = ajuda('a'), ajB = ajuda('b');
    /* A RUA TEM ACASO (correção do dono, 18/08/2026): efetivo × ficha
       média diz quem é o FAVORITO, mas o favorito vence 70% — não
       100%. O ±15% antigo nunca virava briga desigual, e Gaviões e
       Raça simplesmente venciam todas; agora 3 em cada 10 o bonde
       menor sai por cima. */
    const pA = nA * mediaDeFichaGerada(a, dispA, E)
      + (ajA ? ajA.n * mediaDeFichaGerada(ajA.o, disponiveisIA(E, ajA.o.id), E) : 0);
    const pB = nB * mediaDeFichaGerada(b, dispB, E)
      + (ajB ? ajB.n * mediaDeFichaGerada(ajB.o, disponiveisIA(E, ajB.o.id), E) : 0);
    const favoritoA = pA === pB ? U.rng() < 0.5 : pA > pB;
    const ganhouA = U.rng() < 0.70 ? favoritoA : !favoritoA;
    const baixas = (o, n, perdeu) => {
      const t = (E.mundoTorcidas||{})[o.id];
      /* o perdedor sai carregado (pedido do dono): um quarto a dois
         quintos do bonde dele no chão, e a PM leva mais dos que
         apanharam */
      const feridos = Math.round(n * (perdeu ? U.entre(0.25, 0.40)
                                             : U.entre(0.08, 0.16)));
      const presos  = Math.round(n * (perdeu ? U.entre(0.05, 0.12)
                                             : U.entre(0.01, 0.04)));
      if(t){
        if(feridos) (t.feridosIA = t.feridosIA||[])
          .push({n:feridos, ate: abs + U.inteiro(5, 15)});
        if(presos) (t.presosIA = t.presosIA||[])
          .push({n:presos, ate: abs + U.inteiro(15, 90)});
      }
      return {feridos, presos};
    };
    const bxA = baixas(a, nA, !ganhouA);
    const bxB = baixas(b, nB, ganhouA);
    /* o anfitrião também sangra e também colhe: baixas na proporção do
       bonde dele, prestígio pra ele se o lado dele venceu (é a mesma
       regra da NOSSA escolta: o prestígio da briga é de quem foi
       ajudado e de quem ajudou, não muda de dono no meio) */
    for(const [aj, doLadoA] of [[ajA, true], [ajB, false]]){
      if(!aj) continue;
      const venceu = doLadoA === ganhouA;
      baixas(aj.o, aj.n, !venceu);
      if(venceu) mover(E, aj.o.id, 'prestigio', 0.2);
      const dono = doLadoA ? a : b, rivalDe = doLadoA ? b : a;
      moverRelacao(E, dono.id, aj.o.id, +REL.iaAjudouAmiga);
      moverRelacao(E, aj.o.id, rivalDe.id, -REL.iaAjudouRival);
    }
    /* O PRESTÍGIO ACOMPANHA A BRIGA (decisão do dono, 17/08/2026;
       zebra engordada em 18/08): briga grande move mais, e zebra —
       vencer em menor número — move MUITO mais: +4 na régua de 0 a
       100 e teto 10 (a comum fica no teto 8), e a moral do zebra
       vencedor dobra (+1,2 contra +0,6 da vitória comum). O vencedor
       leva, o perdedor devolve; a relação entre os dois azeda — e
       fica azeda: o esfriar passivo morreu (dono, 31/08/2026). */
    const zebra = ganhouA ? nA < nB : nB < nA;
    const swingDisplay = U.limitar(
      Math.round(1 + (nA + nB)/25) + (zebra ? 4 : 0), 1, zebra ? 10 : 8);
    const swing = swingDisplay/5;
    mover(E, ganhouA ? a.id : b.id, 'prestigio', swing);
    mover(E, ganhouA ? a.id : b.id, 'moral', zebra ? 1.2 : 0.6);
    mover(E, ganhouA ? b.id : a.id, 'prestigio', -swing);
    mover(E, ganhouA ? b.id : a.id, 'moral', -0.6);
    moverRelacao(E, a.id, b.id, -REL.iaBriga);
    const reg = {
      ano: E.data.ano, semana: E.data.semana, dia: E.data.dia,
      cidade: (M().cidade(cidade)||{}).nome || cidade, jogo: jogoRot,
      a: {id:a.id, nome:a.nome, n:nA, feridos:bxA.feridos, presos:bxA.presos},
      b: {id:b.id, nome:b.nome, n:nB, feridos:bxB.feridos, presos:bxB.presos},
      vencedor: ganhouA ? a.nome : b.nome,
      prestigio: swingDisplay,
      ganhouA
    };
    if(ajA) reg.a.ajuda = {nome:ajA.o.nome, n:ajA.n};
    if(ajB) reg.b.ajuda = {nome:ajB.o.nome, n:ajB.n};
    return registrarBrigaIA(E, reg);
  }

  function brigasDeHoje(E, jogos){
    mundo(E);
    const fora = [];
    for(const j of (jogos||[])){
      if(U.rng() > CHANCE_BRIGA_JOGO) continue;
      const casa = M().time(j.c), vis = M().time(j.f);
      if(!casa || !vis) continue;
      const cidade = casa.mapa;
      const doJogo = new Set(
        [...M().torcidasDe(casa.id), ...M().torcidasDe(vis.id)].map(o=>o.id));
      const cands = [...new Set([
        ...M().torcidasDe(casa.id), ...M().torcidasDe(vis.id),
        ...M().torcidasEm(cidade)
      ])].filter(o=>!o.incompleta && o.id !== E.torcida.id);
      const pares = [];
      for(let x=0;x<cands.length;x++) for(let y=x+1;y<cands.length;y++){
        const a = cands[x], b = cands[y];
        if(a.clubeId === b.clubeId) continue;
        if(M().saoIrmas && M().saoIrmas(a.id, b.id)) continue;
        /* pelo menos um dos dois é do jogo; o outro se ALCANÇA — é do
           jogo também, ou é da cidade que recebe a partida */
        const aJogo = doJogo.has(a.id), bJogo = doJogo.has(b.id);
        if(!aJogo && !bJogo) continue;
        if(!(aJogo || a.mapa === cidade) || !(bJogo || b.mapa === cidade))
          continue;
        /* e o par tem de ter MOTIVO: relação viva azeda ou rivalidade
           declarada na fonte */
        if(relacaoDelas(E, a.id, b.id) > -15){
          const base = M().relacaoBase(a.id, b.id);
          if(base !== 'Rival' && base !== 'Maior Rival') continue;
        }
        pares.push([a, b]);
      }
      if(!pares.length) continue;
      const [a, b] = pares[Math.floor(U.rng()*pares.length)];
      /* quem viajou pode estar hospedado num aliado da cidade: metade
         das vezes o anfitrião desce junto (a escolta do mundo) */
      const anfitriaoDe = (o, outro) => {
        if(o.mapa === cidade) return null;
        const anf = M().torcidasEm(cidade).find(x =>
          x.id !== o.id && x.id !== outro.id && !x.incompleta &&
          x.id !== E.torcida.id && x.clubeId !== outro.clubeId &&
          (relacaoDelas(E, o.id, x.id) >= ALIADO ||
           ['Aliado','Irmandade'].includes(M().relacaoBase(o.id, x.id)) ||
           (M().saoIrmas && M().saoIrmas(o.id, x.id))));
        return (anf && U.rng() < 0.5) ? anf : null;
      };
      const r = brigaIA(E, a, b, cidade, `${casa.nome} × ${vis.nome}`,
        {ajudaA: anfitriaoDe(a, b), ajudaB: anfitriaoDe(b, a)});
      if(r) fora.push(r);
    }
    return fora;
  }

  /* =======================================================
     O MUNDO VIVE COMO A GENTE (decisão do dono, 18/08/2026)
     As mecânicas do jogador — menos o olheiro — replicadas pras
     138: cada torcida tem o próprio calendário do trimestre
     (tretas marcadas e ataque ao bar), sofre ataque-surpresa de
     relação fervendo, é emboscada na estrada quando viaja, tem
     escolta de aliado (na brigaIA acima) e roda um Expediente
     da Sede de 3 turnos com o MESMO dado de recrutamento — com
     janela de título/acesso e regime seco de rebaixamento. E a
     perda de membros ficou idêntica à nossa: caixa no vermelho
     derruba MORAL, não membro; membro só sai de circulação
     ferido ou preso, e volta.
     ======================================================= */
  const vivoDe = (E, id) => {
    const t = (E.mundoTorcidas||{})[id];
    return t ? t.membros : ((M().torcida(id)||{}).membros || 0);
  };

  /* as hostis que uma torcida IA alcança na própria praça */
  function hostisLocaisIA(E, o){
    return M().torcidasEm(o.mapa).filter(x =>
      x.id !== o.id && !x.incompleta && x.id !== E.torcida.id &&
      x.clubeId !== o.clubeId &&
      !(M().saoIrmas && M().saoIrmas(o.id, x.id)) &&
      (relacaoDelas(E, o.id, x.id) <= HOSTIL ||
       ['Rival','Maior Rival'].includes(M().relacaoBase(o.id, x.id))));
  }
  /* com semente sorteia entre todas (regra da treta — nanica entra);
     sem semente é a maior, que é quem vem no bar */
  function rivalDaPracaIA(E, o, semente){
    const lista = hostisLocaisIA(E, o);
    if(!lista.length) return null;
    if(semente) return lista[TO.mapa.hash(`${semente}|rv`) % lista.length];
    return lista.sort((x,y)=>vivoDe(E,y.id)-vivoDe(E,x.id))[0];
  }

  /* a TRETA MARCADA delas: efetivos idênticos (5/7/10), a conta do
     dono — prestígio ±1 na régua de 0-100, relação −2, sem dinheiro */
  function tretaIA(E, o, chave){
    const r = rivalDaPracaIA(E, o, chave);
    if(!r) return null;
    const tam = [5, 7, 10][TO.mapa.hash(`${chave}|n`) % 3];
    if(disponiveisIA(E, o.id) < tam || disponiveisIA(E, r.id) < tam)
      return null;
    const abs = E.data.absoluto || 0;
    const pA = tam * mediaDeFichaGerada(o, disponiveisIA(E, o.id), E) * U.entre(0.85, 1.15);
    const pB = tam * mediaDeFichaGerada(r, disponiveisIA(E, r.id), E) * U.entre(0.85, 1.15);
    const ganhouA = pA >= pB;
    const machuca = (id, perdeu) => {
      const t = (E.mundoTorcidas||{})[id];
      const n = Math.round(tam * (perdeu ? U.entre(0.25, 0.45)
                                         : U.entre(0.08, 0.20)));
      if(t && n) (t.feridosIA = t.feridosIA||[]).push({n, ate: abs + U.inteiro(5, 15)});
      return n;
    };
    const fA = machuca(o.id, !ganhouA), fB = machuca(r.id, ganhouA);
    /* régua do dono (18/08/2026): treta paga no mínimo 3 de prestígio
       na régua de 0-100 — 3 no 5×5, 4 no 7×7, 5 no 10×10 */
    const display = tam >= 10 ? 5 : tam >= 7 ? 4 : 3;
    mover(E, ganhouA ? o.id : r.id, 'prestigio',  display/5);
    /* perder a treta custa −1 de prestígio e um tanto de moral
       (preço do dono, 19/08/2026 — a mesma régua da nossa) */
    mover(E, ganhouA ? r.id : o.id, 'prestigio', -0.2);
    mover(E, ganhouA ? o.id : r.id, 'moral', 0.6);
    mover(E, ganhouA ? r.id : o.id, 'moral', -0.2);
    moverRelacao(E, o.id, r.id, -REL.iaTreta);
    return registrarBrigaIA(E, {
      ano:E.data.ano, semana:E.data.semana, dia:E.data.dia,
      cidade:(M().cidade(o.mapa)||{}).nome || o.mapa, jogo:'treta marcada',
      a:{id:o.id, nome:o.nome, n:tam, feridos:fA, presos:0},
      b:{id:r.id, nome:r.nome, n:tam, feridos:fB, presos:0},
      vencedor: ganhouA ? o.nome : r.nome, prestigio:display
    });
  }

  /* o ATAQUE AO BAR delas: a maior rival da praça vem, e dinheiro SÓ
     muda de mão aqui — como no nosso bar (saque de 60 por cabeça do
     bonde da casa + 22% do caixa do dono, se o dono perde) */
  function barIA(E, o, chave){
    const atk = rivalDaPracaIA(E, o);
    if(!atk) return null;
    /* ataque de nanica não existe — a mesma régua do nosso bar */
    if(vivoDe(E, atk.id) < vivoDe(E, o.id) * 0.5) return null;
    const reg = brigaIA(E, atk, o, o.mapa, 'ataque ao bar',
                        {tetoA:60, tetoB:40});
    if(!reg) return null;
    if(reg.ganhouA){
      const tAtk = (E.mundoTorcidas||{})[atk.id];
      const tDono = (E.mundoTorcidas||{})[o.id];
      const saque = Math.round(60*reg.b.n +
        0.22*Math.max(0, tDono ? tDono.caixa : 0));
      if(tDono) tDono.caixa -= saque;
      if(tAtk)  tAtk.caixa  += saque;
      reg.saque = saque;
    }
    return reg;
  }

  /* o ATAQUE-SURPRESA delas: relação fervendo (≤ −55) vem sozinha em
     dia comum — a mesma régua nossa (chance cresce com a mágoa e com
     a ousadia dela), diluída no dia */
  function surpresaIA(E, o){
    for(const v of hostisLocaisIA(E, o)){
      const rel = relacaoDelas(E, o.id, v.id);
      if(rel > QUENTE) continue;
      if(vivoDe(E, o.id) < vivoDe(E, v.id) * 0.5) continue;
      const t = (E.mundoTorcidas||{})[o.id];
      const briga = brigaDe(t);
      const chance = ((QUENTE - rel)/(100 + QUENTE)) * 0.28 * briga / 7;
      if(U.rng() > chance) continue;
      return brigaIA(E, o, v, o.mapa, 'ataque-surpresa');
    }
    return null;
  }

  /* a EMBOSCADA DA ESTRADA delas: torcida que viaja pro jogo cruza
     cidade de rival da rota — a mesma lógica da nossa caravana */
  function estradaIA(E, jogos, fora){
    if(!TO.planejamento || !TO.planejamento.caminho) return;
    for(const j of (jogos||[])){
      if(U.rng() > 0.10) continue;
      const casa = M().time(j.c), vis = M().time(j.f);
      if(!casa || !vis || casa.mapa === vis.mapa) continue;
      const viajantes = M().torcidasDe(vis.id)
        .filter(o=>!o.incompleta && o.id !== E.torcida.id &&
                   o.mapa === vis.mapa);
      if(!viajantes.length) continue;
      const o = viajantes[Math.floor(U.rng()*viajantes.length)];
      const rota = TO.planejamento.caminho(E, vis.mapa, casa.mapa, false);
      if(!rota) continue;
      for(const cid of rota.cidades.slice(1, -1)){
        const emb = M().torcidasEm(cid).find(x =>
          !x.incompleta && x.id !== E.torcida.id && x.id !== o.id &&
          x.clubeId !== o.clubeId &&
          !(M().saoIrmas && M().saoIrmas(o.id, x.id)) &&
          (relacaoDelas(E, o.id, x.id) <= HOSTIL ||
           ['Rival','Maior Rival'].includes(M().relacaoBase(o.id, x.id))));
        if(!emb) continue;
        const r = brigaIA(E, emb, o, cid, 'emboscada na estrada');
        if(r) fora.push(r);
        break;
      }
    }
  }

  /* o EXPEDIENTE DA SEDE delas (régua do dono, 20/08/2026): os MESMOS
     três turnos, todo dia, pra toda torcida — recrutar, festa e
     reunião de diretoria. Sem sorteio e sem arquétipo. */
  const EXPEDIENTE = ['recrutar', 'festa', 'reuniao'];
  function expedienteIA(){ return EXPEDIENTE; }

  /* A REUNIÃO DE DIRETORIA delas: o mesmo passo da nossa (+4,2 com o
     aliado mais próximo) e a mesma exigência de dois diretores de pé,
     que aqui vêm da ficha da torcida. Ela conversa com as torcidas da
     PRÓPRIA praça — a mesa da diretoria delas não mexe na relação
     conosco, que continua vindo do que a gente faz. */
  function reuniaoIA(E, o, t){
    if(((o.cargos||{}).diretoria || 0) < 2) return;
    let alvo = null, melhor = -70;
    for(const v of M().torcidasEm(o.mapa)){
      if(v.id === o.id || v.incompleta || v.id === E.torcida.id) continue;
      const r = relacaoDelas(E, o.id, v.id);
      if(r > melhor){ melhor = r; alvo = v; }
    }
    if(alvo) moverRelacao(E, o.id, alvo.id, REL.iaReuniao);
  }
  function regimeIA(E, t){
    const sa = semanaAbs(E);
    if(t.janelaIA && sa < t.janelaIA.ate)
      return t.janelaIA.tipo === 'rebaixamento' ? 'rebaixado' : 'titulo';
    if(t.ultimoJogo && t.ultimoJogo.venceu) return 'ganhou';
    if(t.ultimoJogo && t.ultimoJogo.perdeu) return 'perdeu';
    return 'normal';
  }

  /* O DIA DO MUNDO: expediente, calendário do trimestre, surpresa e
     estrada — roda uma vez por dia, depois das brigas de jogo */
  function mundoDia(E, jogos){
    const m = mundo(E);
    treinarDelas(E);
    ferrugemDaPaz(E);
    /* o placar do dia vira regime de recrutamento das torcidas dos
       dois clubes — a mesma janela quente/seca que a gente tem */
    for(const j of (jogos||[])){
      if(j.gc == null || j.gf == null) continue;
      const marcar = (clube, venceu, perdeu)=>{
        for(const o of M().torcidasDe(clube)){
          const t = m[o.id];
          if(t) t.ultimoJogo = {venceu, perdeu};
        }
      };
      marcar(j.c, j.gc > j.gf, j.gc < j.gf);
      marcar(j.f, j.gf > j.gc, j.gf < j.gc);
    }

    const sa = semanaAbs(E), fora = [];
    const TAB = (TO.acoes && TO.acoes.TABELA_RECRUTA) || {};
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta) continue;
      const t = m[o.id];
      if(!t) continue;

      /* --- os 3 turnos do expediente --- */
      for(const op of expedienteIA()){
        if(op === 'recrutar'){
          const teto = tetoDe(E, t);
          if(t.membros >= teto || t.caixa < 10) continue;
          const tab = TAB[regimeIA(E, t)] || {um:0.10, dois:0.05};
          const r = U.rng();
          const n = Math.min(r < tab.dois ? 2
                           : r < tab.dois + tab.um ? 1 : 0,
                             teto - t.membros);
          if(n > 0){ t.membros += n; t.caixa -= n*5; }
        } else if(op === 'festa'){
          /* A FESTA DELAS É A NOSSA, com o preço do nível da sede
             (régua do dono, 20/08/2026): mesmo custo, mesma renda por
             cabeça e a mesma conta de presentes — quem conta são os
             DISPONÍVEIS, porque ferido e preso não bebem. Ela é turno
             de todo dia, mas só sai quando se paga: torcida nenhuma
             faz vaquinha diária, e era isso que estava comendo o caixa
             do mundo inteiro e segurando a fila de compras. */
          const custo = FIN().FESTA[t.sede] || 700;
          const publico = disponiveisIA(E, o.id);
          if(t.caixa < custo || publico < FIN().pisoDaFesta(t.sede)) continue;
          t.caixa += Math.round(publico * U.entre(4.8, 6.4)) - custo;
        } else if(op === 'reuniao'){
          reuniaoIA(E, o, t);
        }
      }

      /* --- o calendário do trimestre dela --- */
      for(const ev of eventosDoTrimestre(E, o.id)){
        if(ev.semanaAbs !== sa || ev.dia !== E.data.dia) continue;
        const r = ev.tipo === 'treta' ? tretaIA(E, o, ev.chave)
                                      : barIA(E, o, ev.chave);
        if(r) fora.push(r);
      }

      /* --- e a surpresa de quem ferve --- */
      const s = surpresaIA(E, o);
      if(s) fora.push(s);
    }
    estradaIA(E, jogos, fora);
    convitesDeAniversario(E);
    return fora;
  }

  /* =======================================================
     ANIVERSÁRIO ENTRE ELAS (decisão do dono, 18/08/2026)
     Quando uma torcida do mundo faz aniversário — a mesma
     data por hash que manda o convite pra gente —, ela também
     convida o próprio círculo: as da mesma praça sem briga e
     as aliadas e irmãs declaradas. Cada convidada aceita ou
     recusa: aceitar custa R$ 2.000 do caixa dela e aproxima
     as duas (+3); recusar afasta (−3). Quanto melhor a
     relação, maior a chance de aparecer — e quebrada não vai.
     ======================================================= */
  /* a data de verdade manda aqui também (correção do dono,
     19/08/2026): fundacaoDia/fundacaoMes da fonte; hash só de reserva */
  const diaDoAnivIA = id => {
    const o = M().torcida(id);
    if(o && o.fundacaoDia && o.fundacaoMes){
      const d = new Date(2001, o.fundacaoMes - 1, o.fundacaoDia);
      return Math.round((d - new Date(2001, 0, 0)) / 86400000);
    }
    return 1 + TO.mapa.hash(`${id}|aniv`) % 364;
  };

  function convitesDeAniversario(E){
    const m = mundo(E);
    const hoje = TO.estado.dataDaSemana(E.data.ano, E.data.semana, E.data.dia);
    const fora = [];
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta || !o.fundacao) continue;
      const d = new Date(hoje.getFullYear(), 0, diaDoAnivIA(o.id));
      if(d.getDate() !== hoje.getDate() || d.getMonth() !== hoje.getMonth())
        continue;
      /* o círculo da aniversariante */
      const circulo = [...new Set([
        ...M().torcidasEm(o.mapa),
        ...(o.aliados || []).map(x => M().torcida(x)),
        ...(o.irmandade || []).map(x => M().torcida(x))
      ])].filter(x => x && x.id !== o.id && x.id !== E.torcida.id
                        && !x.incompleta);
      for(const c of circulo){
        const rel = relacaoDelas(E, o.id, c.id);
        /* a régua estrita do dono (18/08/2026), a mesma do nosso
           convite: só aliada de verdade recebe — relação viva ≥ 20
           (o que a Diplomacia rotula Aliado/Irmandade) ou irmã de
           clube. Neutra da praça ficou de fora. */
        const irma = M().saoIrmas && M().saoIrmas(o.id, c.id);
        if(!irma && rel < 20) continue;
        const t = m[c.id];
        const podePagar = t && t.caixa > 2000;
        const aceita = podePagar &&
          U.rng() < U.limitar(0.5 + rel/100, 0.15, 0.95);
        if(aceita){
          if(t) t.caixa -= 2000;
          moverRelacao(E, o.id, c.id, REL.iaConviteAceito);
        } else {
          moverRelacao(E, o.id, c.id, -REL.iaConviteRecusado);
        }
        fora.push({ano:E.data.ano, semana:E.data.semana, dia:E.data.dia,
                   quem:o.nome, convidada:c.nome, aceitou:aceita});
      }
    }
    if(fora.length){
      E.convitesIA = E.convitesIA || [];
      E.convitesIA.unshift(...fora);
      if(E.convitesIA.length > 100) E.convitesIA.length = 100;
    }
    return fora;
  }

  /* A SITUAÇÃO FINANCEIRA NO RANKING (tabela do dono, 18/08/2026):
     o saldo atual vira rótulo e multiplicador dos pontos —
     Endividado (abaixo de −10 mil) ×0,6 · Muito ruim (−10 mil a 0)
     ×0,8 · Pobre (até 10 mil) ×1,0 · Estável (até 20 mil) ×1,2 ·
     Bem financeiramente (até 40 mil) ×1,4 · Rico (acima) ×1,6 */
  /* a situação pesa de 0,8 a 1,2 (régua do dono, 24/08/2026): o caixa
     tempera o ranking, não o domina */
  function situacaoFinanceira(caixa){
    if(caixa < -10000) return {rot:'Endividado', slug:'endividado', mult:0.8};
    if(caixa <= 0)     return {rot:'Muito ruim', slug:'muitoruim',  mult:0.88};
    if(caixa <= 10000) return {rot:'Pobre',      slug:'pobre',      mult:0.96};
    if(caixa <= 20000) return {rot:'Estável',    slug:'estavel',    mult:1.04};
    if(caixa <= 40000) return {rot:'Bem financeiramente', slug:'bem', mult:1.12};
    return {rot:'Rico', slug:'rico', mult:1.2};
  }

  let cacheRanking = {chave:'', lista:null};
  /* =======================================================
     A FOTO DO COMEÇO DO MÊS (pedido do dono, 20/08/2026)
     O ranking mostra, ao lado de membros, prestígio e força
     média, o quanto cada um andou NO MÊS. Pra isso o mundo
     guarda uma foto dos três números na virada do mês e a
     tela compara o de agora com o de então.
     ======================================================= */
  function marcaDoMes(E){
    const d = TO.estado.dataDaSemana(E.data.ano, E.data.semana, E.data.dia || 1);
    return `${d.getFullYear()}-${d.getMonth()}`;
  }
  /* os três números do ranking, medidos igual pra nós e pra elas */
  /* A RÉGUA DO RANKING (refeita pelo dono, 24/08/2026):
     membros TODOS — ferido e preso seguem sendo da torcida, e a
     régua parou de puni-los duas vezes —, o prestígio na escala de
     0 a 100, e a ficha média (força+defesa)/2 vezes cinco. */
  function medirNoRanking(E, o){
    if(o.id === E.torcida.id){
      const nT = E.membros.length || 1;
      const mf = E.membros.reduce((s,m)=>s+m.forca, 0)/nT;
      const md = E.membros.reduce((s,m)=>s+m.defesa, 0)/nT;
      return {membros: E.membros.length,
              prestigio: Math.round(E.indicadores.prestigio*5),
              forca: (mf+md)/2};
    }
    const viva = (E.mundoTorcidas||{})[o.id] || {};
    const n = viva.membros !== undefined ? viva.membros : (o.membros || 0);
    return {membros: n,
            prestigio: Math.round((viva.prestigio !== undefined ? viva.prestigio
              : U.limitar((o.prestigio||15)/5, 0, 20))*5),
            forca: mediaDeFichaGerada(o, n, E)};
  }
  /* tira a foto quando o mês vira — e na primeira vez que rodar num
     save que ainda não tinha foto, pra ninguém abrir o ranking e ver
     variação inventada */
  function fotoDoMes(E){
    const marca = marcaDoMes(E);
    if(E.fotoMes && E.fotoMes.marca === marca) return E.fotoMes;
    mundo(E);
    const dados = {};
    for(const o of M().jogaveis()){
      if(o.incompleta) continue;
      dados[o.id] = medirNoRanking(E, o);
    }
    return (E.fotoMes = {marca, dados});
  }

  function ranking(E){
    const foto = fotoDoMes(E);
    const chave = `${E.data.ano}|${semanaAbs(E)}|${E.data.dia}|`+
      `${E.membros.length}|${Math.round(E.indicadores.prestigio*100)}|`+
      `${E.brigasIATotal || (E.brigasIA||[]).length}|${Math.round(E.dinheiro)}|`+
      `${((E.brigasAno||{}).v||0)}-${((E.brigasAno||{}).d||0)}|`+
      `${E.baixasIASeq || 0}|${foto.marca}`;
    if(cacheRanking.chave === chave) return cacheRanking.lista;
    mundo(E);
    const fora = [];
    for(const o of M().jogaveis()){
      if(o.incompleta) continue;
      /* contam os DISPONÍVEIS: ferido e preso não somam ponto — é o
         que faz briga (nossa e das IAs) mexer no ranking. Os três
         números saem de `medirNoRanking`, o mesmo que tira a foto do
         mês: o que a tela mostra e o que a variação compara não podem
         ser medidos de jeitos diferentes. */
      const {membros:n, prestigio:prest, forca} = medirNoRanking(E, o);
      if(o.id === E.torcida.id){
        const sit = situacaoFinanceira(E.dinheiro);
        const pat = FIN().patrimonio(E);
        /* PRÉDIOS SOMADOS (pedido do dono, 20/08/2026): a sede conta 1,
           e somam bar, loja e subsede — o número que aparece é a
           quantidade de portas que a torcida mantém abertas. */
        const predios = 1 + (pat.bares||[]).length + (pat.lojas||[]).length +
                        (pat.subsedes||[]).length;
        fora.push({id:o.id, nome:o.nome, nossa:true,
                   membros:n, prestigio:prest, forca,
                   caixa:E.dinheiro, situacao:sit, predios,
                   saldo: saldoDoAno(E, o.id),
                   /* a fórmula do dono (24/08/2026): membros + prestígio
                      + ficha média ×5, tudo vezes a situação */
                   pontos:Math.round((n + prest + forca*5)*sit.mult)});
      } else {
        const viva = (E.mundoTorcidas||{})[o.id] || {};
        const caixa = viva.caixa !== undefined ? viva.caixa : (o.saldo||200)*4;
        const sit = situacaoFinanceira(caixa);
        const predios = 1 + (viva.bares||[]).length + (viva.lojas||[]).length +
                        (viva.subsedes || 0);
        fora.push({id:o.id, nome:o.nome, nossa:false,
                   membros:n, prestigio:prest, forca,
                   caixa, situacao:sit, predios,
                   saldo: saldoDoAno(E, o.id),
                   pontos:Math.round((n + prest + forca*5)*sit.mult)});
      }
    }
    /* quanto cada um andou desde a foto do começo do mês */
    for(const r of fora){
      const antes = foto.dados[r.id];
      r.varMembros   = antes ? r.membros   - antes.membros   : 0;
      r.varPrestigio = antes ? r.prestigio - antes.prestigio : 0;
      r.varForca     = antes ? r.forca     - antes.forca     : 0;
    }
    fora.sort((a,b)=>b.pontos - a.pontos || b.membros - a.membros ||
                     (a.nome < b.nome ? -1 : 1));
    fora.forEach((x,i)=>x.pos = i+1);
    cacheRanking = {chave, lista:fora};
    return fora;
  }
  /* =======================================================
     DOIS RANKINGS (pedido do dono, 23/08/2026)

     Com as barras dentro, o ranking passou a ter 388 torcidas de dez
     países, e uma organizada de interior brasileiro aparecia em 200º
     por causa da Boca e da Colo-Colo. Agora são dois: o do PAÍS, que é
     com quem a gente compete de verdade e é o que vai no cabeçalho do
     feed, e o do MUNDO, que é o continente inteiro. A conta de pontos é
     a mesma nos dois; o que muda é quem entra na fila.
     ======================================================= */
  function paisDaTorcida(id){
    const o = M().torcida(id);
    const t = o && M().time(o.clubeId);
    return (t && t.pais) || 'Brasil';
  }
  const paisDoJogador = E => paisDaTorcida(E && E.torcida && E.torcida.id);

  /* o mesmo ranking, só com quem joga no nosso país, renumerado. A
     posição no mundo viaja junto, pra tela poder mostrar as duas. */
  function rankingDoPais(E, pais){
    const alvo = pais || paisDoJogador(E);
    return ranking(E)
      .filter(r => paisDaTorcida(r.id) === alvo)
      .map((r, i) => Object.assign({}, r, {pos: i + 1, posMundo: r.pos}));
  }

  /* A DO CABEÇALHO É A NACIONAL (régua do dono, 23/08/2026) — e o
     título dela já dizia "ranking nacional" antes de ser verdade. */
  function posicaoNoRanking(E){
    const x = rankingDoPais(E).find(v=>v.nossa);
    return x ? x.pos : 0;
  }

  function posicaoNoMundo(E){
    const x = ranking(E).find(v=>v.nossa);
    return x ? x.pos : 0;
  }

  function passarSemana(E){
    mundo(E);
    /* a foto do mês é tirada ANTES do que a semana faz: assim a
       variação que a tela mostra cobre o mês inteiro */
    fotoDoMes(E);
    convivencia(E);
    economiaDelas(E);
    return {ataques: ataquesContraNos(E)};
  }

  /* pra tela de Diplomacia: as relações que fogem do neutro */
  function panorama(E){
    return M().jogaveis()
      .filter(o => o.id !== E.torcida.id && !o.incompleta)
      .map(o => {
        const v = nivel(E, o.id);
        return {id:o.id, nome:o.nome, cores:o.cores||['#666'],
                relacao: Math.round(v), status: M().statusDoValor(v)};
      })
      .filter(x => x.relacao !== 0)
      .sort((a,b) => a.relacao - b.relacao);
  }

  return {REL, HOSTIL, QUENTE, ALIADO, nivel, hostilidade, marcarAjuda,
          ranking, rankingDoPais, posicaoNoRanking, posicaoNoMundo,
          paisDaTorcida, situacaoFinanceira,
          brigasDeHoje, mundoDia, brigaIA, disponiveisIA, foraDeCombate, baixasIA,
          convitesDeAniversario,
          mundo, balanco, economiaDelas, ORDEM, proximaCompra, EXPEDIENTE,
          relacaoDelas, moverRelacao, chaveDe,
          mover, indicadoresDe, semanaAbs,
          ataquesContraNos, ataqueDeHoje, diaDoAtaque,
          eventosDoTrimestre, eventoDeHoje, rivalDaPraca, SEMANAS_TRI,
          conquistaDoClube, passarSemana, panorama, MENSALIDADE,
          fotoDoMes, marcaDoMes, medirNoRanking,
          quadroDe, mediaDoQuadro, treinarDelas, promoverDelas, xpDeBrigaIA,
          envelhecerDelas, ferrugemDaPaz, desgasteDaNoite, desgastarQuadro,
          mmaDe,
          mediaDeFichaGerada,
          placarDoAno, anotarBriga, saldoDoAno, frotaIA};
})();
