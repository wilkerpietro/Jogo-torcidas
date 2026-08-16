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
  /* efetivo de agora, não o da planilha: o nosso é E.membros, o das
     outras vem do mundo simulado (elas também crescem e encolhem) */
  function efetivoDe(E, o){
    if(o.id === E.torcida.id) return E.membros.length;
    const m = TO.tensao && TO.tensao.mundo(E)[o.id];
    return m ? m.membros : (o.membros||0);
  }

  /* as organizadas do nosso clube nesta praça, com o efetivo de agora */
  function organizadasDaPraca(E){
    return TO.mundo.torcidasEm(E.torcida.mapa)
      .filter(o=>o.clubeId === E.torcida.clubeId)
      .map(o=>({torcida:o, nossa:o.id===E.torcida.id, membros:efetivoDe(E,o)}))
      .sort((a,b)=>b.membros-a.membros);
  }

  function previsaoRecrutamento(E){
    const I = E.indicadores;
    const base = TO.mundo.baseDeRecrutamento(E.torcida.mapa, E.torcida.clubeId,
                                             o=>efetivoDe(E, o));
    /* GDD §21: 3% da base não organizada é abordada por semana, e a
       chance de cada um topar sai da faixa de satisfação. Os números da
       fonte estão em milhares, então "abordados" e "querem" são gente de
       verdade da cidade. */
    const alcance = base * 0.03;
    const fx      = TO.torcedores.faixaDe(E);
    const chance  = fx.organizar;
    const querem  = Math.round(alcance * 1000 * chance);

    /* O QUE O CLUBE FEZ EM CAMPO PUXA O RECRUTAMENTO, por um tempo:
       rebaixamento confirmado esvazia a fila, acesso enche. `E.recrutamento`
       é carimbado pelo feed (5.4 e 5.5) com prazo em semana absoluta —
       fora da janela, o fator é 1 e nada muda. */
    const semAbs = (E.data.ano - 2026)*52 + E.data.semana;
    const janela = E.recrutamento && semAbs < E.recrutamento.ate
                 ? E.recrutamento.fator : 1;
    const mult = (MULT_SEDE[E.torcida.sedeNivel] || 1) * janela;
    /* O teto do GDD §6.2 é por nível de sede, mas ele sozinho apaga o
       tamanho da torcida do clube na praça: recrutar em São Paulo tinha
       de render mais que no interior. A base entra somada ao teto. */
    const capSede = CAP_RECRUTA[E.torcida.sedeNivel] || 2;
    const capBase = Math.floor(base/120);
    const cap  = capSede + capBase;
    const vaga = TO.membros.capacidade(E) - E.membros.length;

    /* O GDD §21 é explícito: "o gargalo é a capacidade da sede, não a
       vontade do torcedor" — milhares topariam e cabem dezenas. Mas se a
       vontade nunca entrasse na conta, a satisfação não valeria nada no
       recrutamento. Então ela escala o teto: só cidade Muito Contente
       (30%) enche a sede; Insatisfeita (2%) rende um quinze avos disso. */
    const aproveita = chance / TO.torcedores.ORGANIZAR_MAX;
    return {
      base, alcance, querem, chance, faixa:fx, atratividade:aproveita,
      mult, cap, capSede, capBase, vaga,
      /* sem a variância, que só é sorteada na hora */
      esperado: Math.min(cap, Math.max(0, Math.round(cap * aproveita)))
    };
  }

  /* =======================================================
     AS AÇÕES QUE ABREM CENA (GDD §4.1)
     Estas três não se resolvem numa linha de texto: elas põem
     a torcida na rua e o resultado sai da briga. A ação escolhe
     o alvo e abre a cena; o que a noite deu vira dinheiro,
     prestígio, tensão e cadeia quando a tela fecha.
     ======================================================= */
  const MINIMO_SAIDA   = 6;    // bonde menor que isto não sai pra investida
  const MINIMO_ASSALTO = 4;    // assalto é serviço de poucos
  const SEGURANCA_CT   = 10;   // seguranças e roupeiros que barram o portão

  const escolher = (lista, opc)=>{
    if(!lista.length) return null;
    const id = opc && opc.alvo;
    return (id && lista.find(x=>x.id === id)) || lista[0];
  };

  /* Bar e sede das outras torcidas da praça, do jeito que estão no mapa —
     é o mesmo pino que o jogador vê, então atacar não inventa endereço. */
  function alvosDeAtaque(E){
    const mo = TO.mapa && TO.mapa.modelo(E);
    if(!mo) return [];
    const T = TO.tensao;
    const fora = [];
    for(const p of mo.pinos){
      if(p.nossa || !p.torcida) continue;
      if(p.tipo !== 'sede' && p.tipo !== 'bar') continue;
      const o = TO.mundo.torcida(p.torcida);
      if(!o) continue;
      const rel = (E.relacoes||{})[o.id];
      fora.push({
        id: `${o.id}|${p.tipo}`, torcidaId:o.id, tipo:p.tipo, deQuem:o.nome,
        nome: `${p.tipo === 'bar' ? 'Bar' : 'Sede'} da ${o.nome}`,
        artigo:'a', bairro:p.bairro, x:p.x, y:p.y, cor:p.cor,
        tensao: T ? T.nivel(E, o.id) : 0,
        relacao: rel === undefined ? 0 : rel,
        efetivo: efetivoDe(E, o)
      });
    }
    /* o alvo mais quente primeiro: clima ruim pesa mais que tamanho */
    return fora.sort((a,b)=>(b.tensao - a.tensao) || (a.relacao - b.relacao));
  }

  /* O que rende num assalto, por tipo de comércio: o que se leva, quanta
     segurança tem na porta e quanto a polícia se importa (GDD §4.1). */
  const COMERCIO = {
    joalheria:  {nome:'Joalheria',        rende:[4200, 9000], seguranca:6, calor:3.0, artigo:'a'},
    banco:      {nome:'Banco',            rende:[3000, 7000], seguranca:8, calor:3.5, artigo:'o'},
    roupas:     {nome:'Loja de roupas',   rende:[1200, 2600], seguranca:3, calor:1.5, artigo:'a'},
    posto:      {nome:'Posto de gasolina',rende:[900, 2100],  seguranca:3, calor:1.8, artigo:'o'},
    mercadinho: {nome:'Mercadinho',       rende:[500, 1400],  seguranca:2, calor:1.0, artigo:'o'}
  };

  function alvosDeAssalto(E){
    const mo = TO.mapa && TO.mapa.modelo(E);
    if(!mo) return [];
    const fora = [];
    for(const p of mo.pinos){
      const t = COMERCIO[p.tipo];
      if(!t) continue;
      fora.push(Object.assign({}, t, {
        id:`${p.tipo}|${p.bairro}`, tipo:p.tipo, bairro:p.bairro, x:p.x, y:p.y
      }));
    }
    /* o que rende mais primeiro; empate desempata pelo bairro, pra a lista
       não dançar entre uma abertura e outra */
    return fora.sort((a,b)=>(b.rende[1] - a.rende[1]) ||
                            a.bairro.localeCompare(b.bairro));
  }

  /* A relação com o clube: começa morna e é gasta a cada cobrança.
     A cobrança em si vale por algumas semanas e mexe no desempenho. */
  function clube(E){
    if(!E.clube) E.clube = {relacao:50, cobranca:null};
    return E.clube;
  }

  /* =======================================================
     O QUE CADA CENA DEIXA DEPOIS
     Chamado quando a tela do dia de jogo fecha. O resultado
     da briga (res) já passou por membros.aplicarResultadoDaNoite;
     aqui entra só o que é da ação.
     ======================================================= */
  /* O GATILHO QUE O "FODA-SE" ARMOU (feed 8.1). Quem respondeu ao
     delegado que ele que se vire trocou o aviso por uma punição
     imediata: a PRÓXIMA briga já vale a proibição, sem esperar a
     polícia chegar a zero. Cobrado aqui porque é aqui que toda briga
     nossa termina — uma porta só. */
  function cobrarGatilho(E){
    if(!E || !E.gatilhoPunicao) return;
    E.gatilhoPunicao = false;
    E.punicaoPendente = true;
  }

  /* A BRIGA DE RUA NÃO PASSA POR `fecharCena`: ela não é ação da
     semana, é o encontro que a ida ao estádio resolveu (§8.22). Mesmo
     assim ela é briga, e briga tem as duas consequências que este
     módulo cobra de todas: o gatilho do delegado e o registro no log. */
  function fecharBrigaDeRua(E, enc, res){
    if(!E || !enc) return null;
    cobrarGatilho(E);
    const nosso = enc.a && enc.a.nossa ? enc.a : enc.b;
    const deles = nosso === enc.a ? enc.b : enc.a;
    const ganhamos = res && res.ganhamos !== undefined
                   ? !!res.ganhamos : !!(res && res.venceu);
    /* BRIGA DE RUA NÃO SUBIA TENSÃO NENHUMA, e é o buraco no meio do
       laço: `fecharAtaque` soma 18 ou 26, ser atacado em casa soma 6, a
       investida soma 22 — e o encontro na ida, que é a briga mais comum
       do jogo, somava zero. Sem isto o item 1 não fecha: mais briga na
       rua não vira mais tensão, e a tensão continua presa no chão.
       VINTE E DOIS, o mesmo da investida, ganhando ou perdendo: bonde
       contra bonde na rua não é evento menor que ir na casa deles, e
       ninguém escolheu este encontro — os dois lados saem com mais
       ódio. O número é medido, não escolhido de véspera: com 14 a
       tensão parava no próprio 14 e nunca chegava aos 30 do corte da
       ideologia, porque cada rival briga com a gente uma ou duas vezes
       por temporada. Com 22 e o esfriamento de 4%, duas brigas no
       mesmo ano se somam em ~36 e a ideologia passa a valer. */
    if(TO.tensao && deles.torcida)
      TO.tensao.somar(E, deles.torcida, 22, 'briga na rua');
    const membros = (res && res.membros) || [];
    const outro = ((res && res.nossoLado) || 'mandante') === 'mandante'
                ? 'visitante' : 'mandante';
    const efeitos = [
      {ind:'prestigio', delta: r1((res && res.prestigio || 0)/6), dono:'nosso'},
      {ind:'moral', delta: r1(res && res.moralTorcida || 0), dono:'nossa'}
    ].filter(x=>x.delta);
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: deles.torcida, ganhamos,
      local:{cena: enc.local || '', bairro: enc.bairro || ''},
      a: {torcidaId:E.torcida.id, nome:E.torcida.nome, n:nosso.n,
          caidos: membros.filter(m=>!m.preso && m.caido).length,
          presos: membros.filter(m=>m.preso).length, venceu:ganhamos},
      b: {torcidaId:deles.torcida, nome:deles.nome, n:deles.n,
          caidos: (res && (outro==='mandante' ? res.caidosMandante
                                              : res.caidosVisitante)) || 0,
          presos: (res && (outro==='mandante' ? res.presosMandante
                                              : res.presosVisitante)) || 0,
          venceu: !ganhamos},
      efeitos});
    return {ganhamos};
  }

  function fecharCena(E, ctx, res){
    if(!ctx || !ctx.acao) return null;
    /* briga é briga: atacar e defender contam pro gatilho; assalto e
       pressão no clube não são confronto de torcida */
    if(ctx.acao === 'atacar' || ctx.acao === 'defender') cobrarGatilho(E);
    if(ctx.acao === 'atacar')     return fecharAtaque(E, ctx.alvo, res);
    if(ctx.acao === 'assalto')    return fecharAssalto(E, ctx.alvo, res);
    if(ctx.acao === 'pressionar') return fecharPressao(E, res);
    if(ctx.acao === 'defender')   return fecharDefesa(E, ctx.alvo, res);
    return null;
  }

  /* O ESPELHO DO ATAQUE. Quem toma o bar leva a gaveta e um naco do
     caixa, e a moral do dono cai 3 — está escrito ali embaixo, do outro
     lado. Defendendo, a conta é a mesma virada: se eles tomam, é o nosso
     caixa que vai embora e a nossa moral que cai.

     E é AQUI que o prejuízo é cobrado, uma vez só: `ataquesContraNos`
     não lançou dinheiro, não feriu ninguém e não mexeu em moral nem em
     prestígio para o alvo que tem cena. Ferido e preso da noite quem
     aplica é `aplicarResultadoDaNoite`, como em qualquer cena. */
  /* O ESPELHO DO ATAQUE, e agora ele cobre dois casos: a casa invadida e
     a caravana fechada na estrada. Na estrada não há gaveta pra levar —
     o que se perde é o que a turma carregava e o material que ficou no
     acostamento —, então a conta do prejuízo é outra. O resto é igual:
     quem apanha perde moral e prestígio, quem segura ganha.

     E É AQUI QUE O PREJUÍZO É COBRADO, uma vez só: `ataquesContraNos`
     não lançou dinheiro, não feriu ninguém e não mexeu em moral nem em
     prestígio para o alvo que tem cena. Ferido e preso da noite quem
     aplica é `aplicarResultadoDaNoite`, como em qualquer cena. */
  function fecharDefesa(E, alvo, res){
    const T = TO.tensao;
    /* `venceu` é do ponto de vista do MANDANTE, e o nosso lado muda com
       a cena: no bar a gente é o visitante (o salão), na estrada é o
       mandante (o ônibus). `res.ganhamos` já vem resolvido pela ponte —
       usar `!venceu` direto dava resultado invertido na emboscada. */
    const seguramos = res.ganhamos !== undefined ? !!res.ganhamos : !res.venceu;
    const naEstrada = alvo.tipo === 'emboscada';
    const linhas = [];
    let perdeu = 0;
    const antes = {moral:E.indicadores.moral, prestigio:E.indicadores.prestigio,
                   tensao: T ? T.nivel(E, alvo.torcidaId) : 0};
    if(!seguramos){
      /* na estrada, o prejuízo é o que ia no ônibus: rateio da viagem e
         material. Na casa, a gaveta do ponto mais um naco do caixa. */
      perdeu = naEstrada
        /* na estrada, o que eles levam é o que a caravana carregava: o
           RATEIO da viagem, que é dinheiro que já saiu do bolso de quem
           embarcou, mais um naco do caixa. Uma constante por cabeça não
           serve — com 219 embarcados ela dava R$ 26 mil, sete vezes o
           prejuízo de perder o bar. */
        ? Math.round((alvo.rateio || 25 * Math.max(4, alvo.nossos || 20))
                     + Math.max(0, E.dinheiro) * 0.04)
        : Math.round((alvo.tipo === 'bar' ? 60 : 30) *
                     Math.max(4, alvo.efetivo||40)
                     + Math.max(0, E.dinheiro) * 0.10);
      if(perdeu > 0){
        TO.estado.lancar(E, naEstrada ? 'Emboscada na estrada'
                                      : `Levaram do nosso ${alvo.tipo}`, -perdeu);
        linhas.push(naEstrada ? `${U.dinheiro(perdeu)} da viagem e do caixa`
                              : `${U.dinheiro(perdeu)} da gaveta e do caixa`);
      }
      E.indicadores.moral = U.limitar(E.indicadores.moral - 3, 0, 20);
      E.indicadores.prestigio = U.limitar(E.indicadores.prestigio - 0.7, 0, 20);
      linhas.push(naEstrada ? 'o ônibus seguiu viagem com meia turma de pé'
                            : 'eles saíram de lá com a casa na mão');
    }else{
      E.indicadores.moral = U.limitar(E.indicadores.moral + 1.5, 0, 20);
      E.indicadores.prestigio = U.limitar(E.indicadores.prestigio + 0.7, 0, 20);
      linhas.push(naEstrada ? 'a pista ficou nossa' : 'a casa ficou de pé');
    }
    /* O QUE A ESTRADA DEIXOU, pra a mensagem de chegada poder contar.
       Ela sai no dia do jogo — a emboscada cai na véspera, que é o dia
       da ida — e precisa de duas coisas: se passamos ou apanhamos, e
       quantos se feriram. Os feridos saem da lista da CENA, que é a
       caravana: quem embarcou. O `res.membros` é a mesma lista que
       `aplicarResultadoDaNoite` percorre; contar aqui evita depender da
       ordem em que a casca chama as duas. */
    if(naEstrada) E.viagem = {
      ano:E.data.ano, semana:E.data.semana, dia:E.data.dia,
      seguramos, torcida:alvo.torcidaId, nome:alvo.nome,
      embarcados: alvo.nossos || 0,
      feridos: (res.membros||[]).filter(r=>!r.preso && r.caido).length
    };
    if(T) T.somar(E, alvo.torcidaId, seguramos ? 10 : 6, 'vieram na nossa casa');
    /* do lado delas a conta é a mesma virada */
    const dmDelas = T ? T.mover(E, alvo.torcidaId, 'moral',
                                seguramos ? -1.0 : 0.8) : 0;
    if(T) T.mover(E, alvo.torcidaId, 'prestigio', seguramos ? -0.5 : 0.6);
    if(T) T.mover(E, alvo.torcidaId, 'policia', -0.5);

    const txt = naEstrada
      ? `${alvo.nome} fechou a pista na caravana. `+
        `${seguramos ? 'Passamos por cima' : 'Levamos a pior'}.`+
        (linhas.length ? ' ' + linhas.join('; ') + '.' : '')
      : `${alvo.nome} veio pro nosso ${alvo.tipo}. `+
        `${seguramos ? 'Seguramos' : 'Perdemos'} a casa.`+
        (linhas.length ? ' ' + linhas.join('; ') + '.' : '');
    /* A LINHA DE CONSEQUÊNCIA sai daqui, dos números aplicados acima —
       não do texto. Era o pedaço que faltava pro fecho de cena. */
    const efeitos = [
      {ind:'dinheiro',  delta: -perdeu, dono:'nosso'},
      {ind:'moral',     delta: r1(E.indicadores.moral - antes.moral), dono:'nossa'},
      {ind:'prestigio', delta: r1(E.indicadores.prestigio - antes.prestigio),
       dono:'nosso'},
      {ind:'tensao',    delta: T ? r1(T.nivel(E, alvo.torcidaId) - antes.tensao) : 0,
       dono:`com a ${alvo.nome}`},
      {ind:'moral',     delta: dmDelas, dono:`da ${alvo.nome}`}
    ].filter(x=>x.delta);
    TO.estado.anotar(E, txt, seguramos ? 'boa' : 'ruim', {cat:4, efeitos});
    /* o log inteiro: quem, quantos, quantos caíram e o que se moveu.
       Os números não são recalculados aqui — são os que a cena
       entregou e os que acabaram de ser aplicados acima. */
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: alvo.torcidaId, ganhamos: seguramos,
      local:{cena: alvo.cena || (naEstrada ? 'rua' : alvo.tipo),
             bairro: alvo.bairro || ''},
      a: nossoLado(E, alvo, res, seguramos),
      b: ladoDeles(E, alvo, res, seguramos),
      efeitos});
    return {txt, ganhou:seguramos, linhas, dinheiro:-perdeu, efeitos,
            titulo: seguramos ? (naEstrada ? 'A PISTA FICOU NOSSA'
                                           : 'A CASA FICOU DE PÉ')
                              : (naEstrada ? 'PEGARAM A CARAVANA'
                                           : 'PERDEMOS O BAR')};
  }
  const r1 = v => Math.round(v*10)/10;

  /* OS DOIS LADOS DA CENA, PRO LOG. Quem caiu e quem foi preso sai da
     lista de fichas quando ela existe (é o nosso lado) e do contador de
     discos quando não existe (é o lado deles, que não tem ficha). */
  function nossoLado(E, alvo, res, ganhamos){
    const meu = (res && res.nossoLado) || 'mandante';
    const membros = (res && res.membros) || [];
    return {torcidaId:E.torcida.id, nome:E.torcida.nome,
            n: alvo.nossos || membros.length || 0,
            caidos: membros.filter(m=>!m.preso && m.caido).length,
            presos: membros.filter(m=>m.preso).length,
            venceu: !!ganhamos, lado: meu};
  }
  function ladoDeles(E, alvo, res, ganhamos){
    const meu = (res && res.nossoLado) || 'mandante';
    const outro = meu === 'mandante' ? 'visitante' : 'mandante';
    const caidos = res ? (outro === 'mandante' ? res.caidosMandante
                                               : res.caidosVisitante) : 0;
    const presos = res ? (outro === 'mandante' ? res.presosMandante
                                               : res.presosVisitante) : 0;
    return {torcidaId:alvo.torcidaId, nome:alvo.nome,
            n: (res && res.efetivo && res.efetivo[outro]) || alvo.efetivo || 0,
            caidos: caidos||0, presos: presos||0, venceu: !ganhamos, lado: outro};
  }

  function fecharAtaque(E, alvo, res){
    const T = TO.tensao;
    const ganhou = !!res.venceu;
    const linhas = [];
    let levou = 0;
    /* bar tomado é caixa deles no bolso da gente; sede é humilhação */
    if(ganhou){
      const m = TO.tensao ? TO.tensao.mundo(E)[alvo.torcidaId] : null;
      const base = alvo.tipo === 'bar' ? 0.22 : 0.10;
      /* Não é só o caixa deles: bar tem gaveta e estoque, sede tem material.
         Torcida pequena e pobre ainda rende alguma coisa pela cabeça. */
      const gaveta = (alvo.tipo === 'bar' ? 60 : 30) * alvo.efetivo;
      levou = Math.round(gaveta + (m ? m.caixa : 1200) * base);
      if(levou > 0){
        if(m) m.caixa = Math.max(0, m.caixa - levou);
        TO.estado.lancar(E, `Saque — ${alvo.nome}`, levou);
        linhas.push(`${U.dinheiro(levou)} do caixa deles`);
      }
      if(m){ m.moral = U.limitar(m.moral - 3, 0, 20);
             m.membros = Math.max(4, m.membros - Math.round(res.caidosVisitante*0.4)); }
      if(alvo.tipo === 'sede') linhas.push('faixa deles rasgada na porta');
    }else{
      linhas.push('a gente saiu de lá pior do que entrou');
    }
    /* invadir a casa do outro sobe a tensão até o teto, ganhando ou não */
    if(T) T.somar(E, alvo.torcidaId, ganhou ? 26 : 18,
                  `investida no ${alvo.tipo} deles`);
    E.indicadores.policia = U.limitar(E.indicadores.policia - 1.5, 0, 20);
    const txt = `${ganhou ? 'Tomamos' : 'Fomos até'} ${alvo.nome}, em ${alvo.bairro}.`+
                (linhas.length ? ' ' + linhas.join('; ') + '.' : '');
    TO.estado.anotar(E, txt, ganhou ? 'boa' : 'ruim', {cat:4});
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: alvo.torcidaId, ganhamos: ganhou,
      local:{cena: alvo.cena || alvo.tipo, bairro: alvo.bairro || ''},
      a: nossoLado(E, alvo, res, ganhou),
      b: ladoDeles(E, alvo, res, ganhou),
      efeitos:[{ind:'prestigio', delta: r1((res.prestigio||0)/6), dono:'nosso'},
               {ind:'dinheiro',  delta: levou, dono:'nosso'}].filter(x=>x.delta)});
    return {txt, ganhou, linhas, dinheiro:levou,
            titulo: ganhou ? 'ATAQUE BEM-SUCEDIDO' : 'ATAQUE FRACASSOU'};
  }

  function fecharAssalto(E, alvo, res){
    const ganhou = !!res.venceu;
    const linhas = [];
    let levou = 0;
    if(ganhou){
      /* o que se leva depende de quanta gente ficou de pé pra carregar */
      const carregou = U.limitar(1 - res.caidosMandante/22, 0.35, 1);
      levou = Math.round(U.entre(alvo.rende[0], alvo.rende[1]) * carregou);
      TO.estado.lancar(E, `Assalto — ${alvo.nome} (${alvo.bairro})`, levou);
      linhas.push(`${U.dinheiro(levou)} no bolso`);
    }else{
      linhas.push('nada saiu de lá');
    }
    /* crime é crime: a polícia esquenta mesmo quando dá certo */
    const calor = alvo.calor * (ganhou ? 1 : 0.6);
    E.indicadores.policia = U.limitar(E.indicadores.policia - calor, 0, 20);
    /* e prestígio de assalto não é prestígio de briga: a rua não aplaude */
    E.indicadores.prestigio = U.limitar(E.indicadores.prestigio - 0.5, 0, 20);
    const txt = `${ganhou ? 'Levaram' : 'Tentaram'} ${alvo.nome.toLowerCase()} `+
                `em ${alvo.bairro}. ${linhas.join('; ')}.`;
    TO.estado.anotar(E, txt, ganhou ? 'boa' : 'ruim', {cat:4});
    return {txt, ganhou, linhas, levou, dinheiro:levou,
            titulo: ganhou ? 'ASSALTO BEM-SUCEDIDO' : 'ASSALTO FRACASSOU'};
  }

  /* Semanas que a cobrança do elenco dura, e quanto ela vale de força */
  const COBRANCA = {semanas:4, bom:3, ruim:-2};

  function fecharPressao(E, res){
    const c = clube(E);
    const chegou = (res.entraram || 0) > 0 || !!res.venceu;
    const gasto = chegou ? 18 : 28;
    c.relacao = U.limitar(c.relacao - gasto, 0, 100);
    c.cobranca = {ate: E.data.semana + COBRANCA.semanas,
                  valor: chegou ? COBRANCA.bom : COBRANCA.ruim};
    /* o torcedor comum gosta de cobrança feita, e detesta vexame */
    E.indicadores.satisfacao = U.limitar(
      E.indicadores.satisfacao + (chegou ? 0.8 : -1.2), 0, 20);
    if(res.presosMandante) E.indicadores.policia =
      U.limitar(E.indicadores.policia - 1, 0, 20);
    const txt = chegou
      ? `A torcida chegou no gramado e cobrou o elenco na cara. `+
        `O time joga sob pressão até a semana ${c.cobranca.ate}.`
      : `A segurança segurou a torcida no portão do CT. `+
        `Vexame — e o elenco se sentiu perseguido até a semana ${c.cobranca.ate}.`;
    TO.estado.anotar(E, txt, chegou ? 'boa' : 'ruim', {cat:4});
    return {txt, ganhou:chegou, dinheiro:0,
            titulo: chegou ? 'COBRANÇA FEITA' : 'COBRANÇA FRACASSOU',
            linhas:[`relação com o clube em ${Math.round(c.relacao)}`]};
  }

  /* quanto a cobrança soma (ou tira) da força do nosso clube */
  function cobrancaAtiva(E){
    const c = E.clube;
    if(!c || !c.cobranca) return 0;
    return c.cobranca.ate >= E.data.semana ? c.cobranca.valor : 0;
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
        return {ok:true, nota:`~${p.esperado} novatos · cidade `+
          `${p.faixa.nome.toLowerCase()} (${Math.round(p.chance*100)}% topam)`};
      },
      executar(E){
        const p = previsaoRecrutamento(E);
        /* GDD §6.2: sede cheia bloqueia SEM consumir a ação */
        if(p.vaga <= 0) return {ok:false, msg:'A sede está cheia.', semCusto:true};

        const variancia = U.entre(0.85, 1.15);
        let n = Math.round(p.esperado * variancia);
        n = U.limitar(n, 0, Math.min(p.cap, p.vaga));
        if(n <= 0) return {ok:true, msg:'Ninguém quis entrar essa semana.'};

        for(let i=0;i<n;i++){
          E.membros.push(TO.membros.criar(E, {cargo:'novato', moral:15}));
        }
        TO.estado.lancar(E, `Recrutamento de ${n} novatos`, -5*n);
        E.historicoRecrutamento = E.historicoRecrutamento || [];
        E.historicoRecrutamento.unshift({semana:E.data.semana, n,
        base:Math.round(p.base), faixa:p.faixa.nome, querem:p.querem});
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
        /* muro pichado é provocação: o rival mais próximo sente */
        const alvo = Object.entries(E.relacoes||{})
          .filter(([,v])=>v < -20).sort((a,b)=>a[1]-b[1])[0];
        if(alvo) TO.tensao.somar(E, alvo[0], 9, 'pichação no território');
        /* quem pinta muro de madrugada às vezes é pego */
        const aptos = E.membros.filter(TO.membros.disponivel);
        if(aptos.length && U.rng() < 0.18){
          const azarado = U.escolher(aptos);
          TO.membros.prender(E, azarado, null, 'Preso pichando o território');
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
        TO.tensao.somar(E, id, -8, 'reunião de diretoria');
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
          m.preso = null;
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

    /* --- as três que abrem cena (GDD §4.1) —
           a lista, os alvos e o que cada resultado faz estão logo abaixo --- */
    {id:'atacar',    nome:'Atacar bar ou sede rival', icone:'tijolo', cena:'Bar',
     efeito:'Saque, prestígio e dano ao rival', alvos:alvosDeAtaque,
     disponivel(E){
       const aptos = TO.membros.aptosParaOEstadio(E).length;
       if(aptos < MINIMO_SAIDA)
         return {ok:false, motivo:`gente apta de menos (${aptos} de ${MINIMO_SAIDA})`};
       const l = alvosDeAtaque(E);
       if(!l.length) return {ok:false, motivo:'nenhum bar ou sede rival mapeado na praça'};
       const q = l[0];
       return {ok:true, nota:`${l.length} alvos · o mais quente é ${q.nome}`};
     },
     executar(E, opc){
       const alvo = escolher(alvosDeAtaque(E), opc);
       if(!alvo) return {ok:false, msg:'Esse alvo não existe mais.'};
       return {ok:true, cena:{cena:'bar', acao:'atacar', alvo,
                              efetivoRival: Math.max(4, Math.round(alvo.efetivo*0.35))},
               msg:`Bonde a caminho: ${alvo.nome}, ${alvo.bairro}.`};
     }},

    {id:'assalto',   nome:'Assaltar alvo comercial', icone:'dinheiro', cena:'Comércio',
     efeito:'Dinheiro, com risco alto de polícia', alvos:alvosDeAssalto,
     disponivel(E){
       const aptos = TO.membros.aptosParaOEstadio(E).length;
       if(aptos < MINIMO_ASSALTO)
         return {ok:false, motivo:`turma pequena demais (${aptos} de ${MINIMO_ASSALTO})`};
       if(E.indicadores.policia >= 17)
         return {ok:false, motivo:'com a polícia em cima é entregar a torcida'};
       const l = alvosDeAssalto(E);
       if(!l.length) return {ok:false, motivo:'nenhum alvo comercial na praça'};
       return {ok:true, nota:`${l.length} alvos · ${l[0].nome} rende mais`};
     },
     executar(E, opc){
       const alvo = escolher(alvosDeAssalto(E), opc);
       if(!alvo) return {ok:false, msg:'Esse alvo não existe mais.'};
       return {ok:true, cena:{cena:'comercio', acao:'assalto', alvo,
                              efetivoRival: alvo.seguranca},
               msg:`Turma na porta d${alvo.artigo} ${alvo.nome}.`};
     }},

    {id:'pressionar',nome:'Pressionar o clube', icone:'megafone', cena:'CT',
     efeito:'Muda o desempenho do time, gasta relação',
     disponivel(E){
       const aptos = TO.membros.aptosParaOEstadio(E).length;
       if(aptos < MINIMO_SAIDA)
         return {ok:false, motivo:`gente apta de menos (${aptos} de ${MINIMO_SAIDA})`};
       const c = clube(E);
       if(c.relacao <= 5)
         return {ok:false, motivo:'a diretoria não abre mais o portão pra vocês'};
       if(c.cobranca && c.cobranca.ate >= E.data.semana)
         return {ok:false, motivo:`o elenco já foi cobrado (vale até a semana ${c.cobranca.ate})`};
       return {ok:true, nota:`relação com o clube em ${Math.round(c.relacao)}`};
     },
     executar(E){
       const c = clube(E);
       return {ok:true, cena:{cena:'ct', acao:'pressionar',
                              alvo:{nome:E.torcida.clube, tipo:'ct'},
                              efetivoRival: SEGURANCA_CT},
               msg:`Caravana no portão do CT. Relação em ${Math.round(c.relacao)}.`};
     }}
  ];

  const porId = id => LISTA.find(a=>a.id===id);

  /* =======================================================
     EXECUÇÃO
     ======================================================= */
  function executar(E, id, opc){
    const a = porId(id);
    if(!a) return {ok:false, msg:'ação desconhecida'};
    if(restantes(E) <= 0)
      return {ok:false, msg:'Não sobrou ação nesta semana.'};

    const d = a.disponivel(E);
    if(!d.ok) return {ok:false, msg:d.motivo};

    const r = a.executar(E, opc);
    /* GDD §6.2: algumas recusas não gastam a ação */
    if(r.ok && !r.semCusto) E.acoes.usadas = (E.acoes.usadas||0) + 1;
    if(r.ok){
      E.acoes.feitas = E.acoes.feitas || [];
      E.acoes.feitas.push({semana:E.data.semana, dia:E.data.dia, id, msg:r.msg});
    }
    return r;
  }

  /* =======================================================
     GASTAR A AÇÃO SEM ABRIR A CENA

     `executar` cobra e abre no mesmo instante, o que serve pra lista de
     ações — clicou, aconteceu. No mapa a decisão e a cena estão
     separadas no tempo: tirar o bonde da sede custa a ação na hora da
     saída, e a briga só abre quando ele chega no alvo, que pode ser uma
     hora de jogo depois. Se a cobrança ficasse pra chegada, o jogador
     poria três bondes na rua com uma ação só.
     ======================================================= */
  function gastarAcao(E, id, msg){
    if(restantes(E) <= 0) return {ok:false, msg:'Não sobrou ação nesta semana.'};
    E.acoes = E.acoes || {};
    E.acoes.usadas = (E.acoes.usadas||0) + 1;
    E.acoes.feitas = E.acoes.feitas || [];
    E.acoes.feitas.push({semana:E.data.semana, dia:E.data.dia, id, msg});
    return {ok:true, msg};
  }

  return {LISTA, porId, maximo, restantes, executar, gastarAcao,
          previsaoRecrutamento,
          organizadasDaPraca, efetivoDe,
          alvosDeAtaque, alvosDeAssalto, clube, fecharCena, fecharBrigaDeRua,
          cobrancaAtiva,
          COMERCIO, COBRANCA, MINIMO_SAIDA, MINIMO_ASSALTO,
          POR_SEMANA, CAP_RECRUTA};
})();
