/* =========================================================
   EXPEDIENTE DA SEDE — as ações do dia a dia
   ---------------------------------------------------------
   A rotina semanal virou EXPEDIENTE (decisão do autor): três
   turnos por dia — manhã, tarde e noite —, cada um com uma
   ação escolhida pelo jogador, rodando sozinha. Por ser
   diário, o rendimento de cada ação é REDUZIDO: recrutar traz
   menos gente por vez, treinar treina menos membros, senão o
   jogo infla em duas semanas.

   Também moram aqui os fechamentos de cena: o que a briga
   deixa de dinheiro, relação, moral e registro. Nenhum texto
   de notícia sai daqui — quem narra é o feed, por
   `registrarConfronto`.
   ========================================================= */
window.TO = window.TO || {};

TO.acoes = (function(){
  const U = TO.util;

  const TURNOS = [
    {id:'manha', nome:_t('Manhã')},
    {id:'tarde', nome:_t('Tarde')},
    {id:'noite', nome:_t('Noite')}
  ];
  const expediente = E => (E.expediente = E.expediente || {manha:null, tarde:null, noite:null});

  /* o rendimento diário é uma fração do que a ação semanal rendia */
  const REDUCAO = 0.35;
  /* a tabela da relação mora em TO.relacoes.REL (régua do dono,
     21/08/2026): aqui só se lê dela, nunca se escreve número solto */
  const REL = () => TO.relacoes.REL;

  /* custo e efeito de uma ação podem ser número (fixo) ou função de E
     (muda com a torcida) — quem desenha a linha pergunta por aqui */
  const resolver = (v, E) => typeof v === 'function' ? v(E) : v;
  const custoDe  = (E, a) => resolver(a.custo, E) || 0;
  const efeitoDe = (E, a) => resolver(a.efeito, E) || '';
  const nivelDaSede = E => (E.torcida && E.torcida.sedeNivel != null) ? E.torcida.sedeNivel : 1;
  const custoFesta  = E => TO.financeiro.FESTA[nivelDaSede(E)] || 700;

  /* SEM SEDE, UM TURNO SÓ (decisão do dono, 22/09/2026): o ponto de
     encontro tem só a tarde; a sede, do nível 1 em diante, os três */
  const turnos = E => (E && nivelDaSede(E) <= 0) ? TURNOS.filter(t=>t.id === 'tarde') : TURNOS;
  /* compat: quem pergunta quantas ações sobram (telas antigas) */
  const maximo = E => turnos(E || (TO.estado && TO.estado.E)).length;
  const restantes = E => Math.max(0, turnos(E).length - (E.acoes.usadas||0));

  /* GDD §6.2 */
  const MULT_SEDE   = [null, 1.0, 1.3, 1.7, 2.2, 3.0];
  const CAP_RECRUTA = [null, 2, 4, 8, 14, 22];

  /* =======================================================
     RECRUTAMENTO (GDD §6.2)
     ======================================================= */
  function efetivoDe(E, o){
    if(o.id === E.torcida.id) return E.membros.length;
    const m = TO.relacoes && TO.relacoes.mundo(E)[o.id];
    return m ? m.membros : (o.membros||0);
  }
  /* QUEM DESCE É QUEM ESTÁ DE PÉ (ordem do dono, 27/08/2026): toda
     conta de briga e presença desconta ferido e preso — da IA via
     `disponiveisIA`, da nossa via `aptosParaOEstadio`. O `efetivoDe`
     cru fica pra contagem de quadro (recrutamento, ranking): ferido
     ainda é membro. */
  function efetivoDePe(E, o){
    if(!o || !o.id) return 0;
    if(o.id === E.torcida.id) return TO.membros.aptosParaOEstadio(E).length;
    return TO.relacoes && TO.relacoes.disponiveisIA
      ? TO.relacoes.disponiveisIA(E, o.id) : efetivoDe(E, o);
  }

  /* A ZONA QUE VAI PRA RESENHA (casa de piscina, 21/09/2026): membro
     não tem zona marcada, então a "Zona Sul" é uma fatia da torcida
     — um quarto do efetivo de pé, entre 4 e 20 (o teto do dono). A
     dos rivais sai da mesma régua; a nossa é sorteada por hash pra
     ser a mesma turma dentro do dia. */
  const ZONA_MIN = 4, ZONA_MAX = 20;
  function efetivoDaZona(E, o){
    const zonas = (TO.mundo.ZONAS || []).length || 4;
    const dePe = efetivoDePe(E, o);
    return Math.min(ZONA_MAX, Math.max(ZONA_MIN, Math.round(dePe / zonas)));
  }
  /* CADA MEMBRO TEM A SUA ZONA, E A ZONA LEVA OS MAIS FORTES DELA
     (régua do dono, 22/09/2026): a zona de um membro sai do hash do id
     dele — fixa, pra sempre —, e o bonde da zona são os mais fortes
     dessa zona, até o teto. Antes era um sorteio da torcida inteira
     por semana, e o sorteio dava novato e componente contra a elite
     que o gerador dá pra zona deles (`combate.fichasDaZona`, a mesma
     régua). */
  const zonaDoMembro = m => {
    const Z = TO.mundo.ZONAS || ['Norte','Sul','Leste','Oeste'];
    return Z[TO.mapa.hash(`zona-membro|${m.id}`) % Z.length];
  };
  function bondeDaZona(E, zona){
    const aptos = TO.membros.aptosParaOEstadio(E);
    const n = Math.min(aptos.length, efetivoDaZona(E, E.torcida));
    const daZona = zona ? aptos.filter(m=>zonaDoMembro(m) === zona) : aptos;
    return daZona.slice().sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa)).slice(0, n);
  }

  function organizadasDaPraca(E){
    return TO.mundo.torcidasEm(E.torcida.mapa)
      .filter(o=>o.clubeId === E.torcida.clubeId)
      .map(o=>({torcida:o, nossa:o.id===E.torcida.id, membros:efetivoDe(E,o)}))
      .sort((a,b)=>b.membros-a.membros);
  }

  /* O RECRUTAMENTO É SORTEIO POR REGIME (tabela do dono, 17/08/2026).
     Cada campanha (turno do expediente) tira um dado:

       normal ................. 20% um · 10% dois · 70% ninguém
       ganhou o último jogo ... 30% um · 20% dois · 50% ninguém
       perdeu o último jogo ... 10% um ·  5% dois · 85% ninguém
       2 sem. após título
         ou acesso ............ 40% um · 40% dois · 20% ninguém
       2 sem. após rebaixamento 10% um ·  0% dois · 90% ninguém

     Custo de R$ 5 por novato; o limite duro é a vaga da sede
     (nível → 50/90/150/200/500). A base da praça continua sendo o
     portão: sem torcedor fora de organizada, ninguém entra. */
  const TABELA_RECRUTA = {
    titulo:    {um:0.40, dois:0.20, rot:_t('título ou acesso fresco')},
    rebaixado: {um:0.00, dois:0.00, rot:_t('rebaixamento fresco')},
    ganhou:    {um:0.15, dois:0.05, rot:_t('vitória no último jogo')},
    perdeu:    {um:0.05, dois:0.00, rot:_t('derrota no último jogo')},
    normal:    {um:0.10, dois:0.05, rot:_t('semana comum')}
  };
  function regimeRecrutamento(E){
    const sa = TO.relacoes.semanaAbs(E);
    const j = E.janelaRecruta;
    if(j && sa < j.ate)
      return j.tipo === 'rebaixamento' ? 'rebaixado' : 'titulo';
    const u = E.ultimoJogoClube;
    if(u && u.venceu) return 'ganhou';
    if(u && u.perdeu) return 'perdeu';
    return 'normal';
  }
  function previsaoRecrutamento(E){
    const base = TO.mundo.baseDeRecrutamento(E.torcida.mapa, E.torcida.clubeId,
                                             o=>efetivoDe(E, o));
    const alcance = base * 0.03;
    const chance  = TO.torcedores.ORGANIZAR;
    const querem  = Math.round(alcance * 1000 * chance);
    const vaga = TO.membros.capacidade(E) - E.membros.length;
    const regime = regimeRecrutamento(E);
    const t = TABELA_RECRUTA[regime];
    return {
      base, alcance, querem, chance, vaga, regime,
      rotRegime: t.rot, um: t.um, dois: t.dois,
      zero: Math.max(0, 1 - t.um - t.dois),
      esperado: t.um + t.dois*2,
      porSemana: Math.round((t.um + t.dois*2) * TURNOS.length * 7)
    };
  }

  /* =======================================================
     AS AÇÕES QUE ABREM CENA (manuais, fora do expediente)
     ======================================================= */
  const MINIMO_SAIDA = 6;

  const escolher = (lista, opc)=>{
    if(!lista.length) return null;
    const id = opc && opc.alvo;
    return (id && lista.find(x=>x.id === id)) || lista[0];
  };

  /* os bairros da nossa cidade que a ação social pode ajudar: os que
     não são nossos (menos o da sede dos outros, que não se compra com
     cesta básica), na ordem em que a barra rende mais — o sem dona e o
     de dona fraca primeiro */
  function alvosSociais(E){
    const D = TO.dominio;
    if(!D || !E || !E.torcida) return [];
    const eu = E.torcida.id;
    return D.bairros(E, E.torcida.mapa)
      .filter(b => b.dono !== eu && !(b.sede && b.sede !== eu))
      .map(b => {
        const nosso = (b.partes.find(x => x.t === eu) || {}).v || 0;
        return {id:b.id, nome:b.nome, tipo:'bairro', bairro:b.nome, zona:b.zona,
                nosso, dono:b.dono, v:b.v,
                nota: b.dono ? _t('zona {zona} · da {sigla} ({v}%) · nossa barra {n}%', {zona:_t(b.zona), sigla:D.siglaDe(b.dono), v:Math.round(b.v), n:Math.round(nosso)})
                             : _t('zona {zona} · sem dona · nossa barra {n}%', {zona:_t(b.zona), n:Math.round(nosso)})};
      })
      .sort((a, b) => (a.dono ? a.v : 0) - (b.dono ? b.v : 0) || b.nosso - a.nosso);
  }

  /* QUEM NÃO TEM BAR NÃO TEM BAR PRA ATACAR (o dono, 29/09/2026:
     "Torcidas que ainda não tem bar não dá pra atacar assim"). O pino de
     bar das outras torcidas é sorteado no mapa pra todas (mapa.js), mas o
     bote no bar só existe contra quem tem um de verdade: o do jogador no
     patrimônio, o da IA no mundo vivo dela — e, com o jogo em 3D, o bar no
     mapa da praça, que é onde a cena acontece (jogo3d.js, `temBar`). */
  function temBar(E, id){
    if(!id) return false;
    if(id === E.torcida.id){
      const p = TO.financeiro && TO.financeiro.patrimonio ? TO.financeiro.patrimonio(E) : E.patrimonio;
      if(!p || !(p.bares||[]).length) return false;
    } else {
      const m = TO.relacoes && TO.relacoes.mundo ? TO.relacoes.mundo(E)[id] : null;
      if(m && Array.isArray(m.bares) && !m.bares.length) return false;
    }
    const no3d = TO.jogo3d && TO.jogo3d.temBar ? TO.jogo3d.temBar(id) : null;
    return no3d !== false;
  }

  function alvosDeAtaque(E){
    const mo = TO.mapa && TO.mapa.modelo(E);
    if(!mo) return [];
    const fora = [];
    for(const p of mo.pinos){
      if(p.nossa || !p.torcida) continue;
      if(p.tipo !== 'sede' && p.tipo !== 'bar') continue;
      const o = TO.mundo.torcida(p.torcida);
      if(!o) continue;
      if(p.tipo === 'bar' && !temBar(E, o.id)) continue;
      const rel = TO.relacoes.nivel(E, o.id);
      fora.push({
        id: `${o.id}|${p.tipo}`, torcidaId:o.id, tipo:p.tipo, deQuem:o.nome,
        nome: p.tipo === 'bar' ? _t('Bar da {nome}', {nome:o.nome})
                               : _t('Sede da {nome}', {nome:o.nome}),
        artigo:'a', bairro:p.bairro, x:p.x, y:p.y, cor:p.cor,
        relacao: rel,
        efetivo: efetivoDePe(E, o)
      });
    }
    /* o alvo de pior relação primeiro */
    return fora.sort((a,b)=>a.relacao - b.relacao);
  }

  /* relação com o clube: gasta a cada cobrança no CT */
  function clube(E){
    if(!E.clube) E.clube = {relacao:50, cobranca:null};
    return E.clube;
  }

  /* =======================================================
     O QUE CADA CENA DEIXA DEPOIS
     ======================================================= */
  const r1 = v => Math.round(v*10)/10;

  /* a briga do encontro na ida/volta do estádio — a mais comum */
  function fecharBrigaDeRua(E, enc, res){
    if(!E || !enc) return null;
    const nosso = enc.a && enc.a.nossa ? enc.a : enc.b;
    const deles = nosso === enc.a ? enc.b : enc.a;
    const ganhamos = res && res.ganhamos !== undefined
                   ? !!res.ganhamos : !!(res && res.venceu);
    /* briga derruba a relação dos dois lados — é a deterioração que o
       esqueleto do jogo exige depois de todo confronto */
    if(deles.torcida) TO.relacoes.hostilidade(E, deles.torcida, REL().briga);
    /* o prestígio DELES também se move com a briga (decisão do dono) */
    const dpDeles = deles.torcida
      ? TO.relacoes.mover(E, deles.torcida, 'prestigio', ganhamos ? -0.4 : 0.4)
      : 0;
    const membros = (res && res.membros) || [];
    const outro = ((res && res.nossoLado) || 'mandante') === 'mandante'
                ? 'visitante' : 'mandante';
    /* a linha do nosso prestígio mostra o que ENTROU (carimbado por
       aplicarResultadoDaNoite), não o que a briga reivindicou — no
       teto de 100 a mensagem não promete crédito que não houve */
    const dpNosso = res && res.prestigioAplicado != null
      ? r1(res.prestigioAplicado/5)
      : r1(U.limitar((res && res.prestigio || 0)/5, -2, 2));
    const dmNossa = res && res.moralAplicada != null
      ? r1(res.moralAplicada) : r1(res && res.moralTorcida || 0);
    const efeitos = [
      {ind:'relacao', delta:-22, dono:_t('com a {nome}', {nome:deles.nome})},
      {ind:'prestigio', delta: dpNosso, dono:_t('nosso')},
      {ind:'prestigio', delta: dpDeles, dono:_t('da {nome}', {nome:deles.nome})},
      {ind:'moral', delta: dmNossa, dono:_t('nossa')}
    ].filter(x=>x.delta);
    /* a cidade da briga, quando não é a nossa (o jogo fora): o bairro
       dela é o do domínio de lá (dono, 30/09/2026) */
    const cidade = typeof enc.foraDeCasa === 'string' ? enc.foraDeCasa
                 : enc.foraDeCasa ? ((E.proximoJogo || {}).mapaAdv || null) : null;
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: deles.torcida, ganhamos, atacamos: !enc.sofrido,
      local:{cena: enc.local || '', bairro: enc.bairro || '', cidade},
      /* a escolta desce com o aliado junto: o carimbo vai pro jornal
         montar a manchete de apoio (pedido do dono, 31/08/2026) */
      aliado: enc.escoltaAliado && enc.junto
        ? {id: enc.junto.torcida, nome: enc.junto.nome, n: enc.junto.n}
        : null,
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

  /* A FAIXA TOMADA (pedido do dono, 09/09/2026): −10 de prestígio pra
     quem perdeu, +5 pra quem tomou, na régua de 0 a 100; a faixa muda
     de dono no Patrimônio (a nossa some da sede, a deles entra nas
     tomadas — de cabeça pra baixo). `outroId` é a outra torcida da
     cena, quem tomou a nossa ou de quem tomamos. */
  function aplicarFaixa(E, res, fecho, outroId, qual){
    const fx = qual || (res && res.faixa);
    if(!fx || !fx.tomada || !fecho) return null;
    const PAT = TO.patrimonio, R = TO.relacoes;
    const nossoLado = res.nossoLado || 'mandante';
    const tomamos = fx.por === nossoLado;
    const bandeira = fx.tipo === 'bandeira';
    const V = bandeira ? PAT.BANDEIRA : PAT.FAIXA;
    const listaNossa = () => bandeira ? PAT.bandeirasDe(E) : PAT.faixasDe(E);
    const contaIA = (t) => bandeira ? 'bandeiras' : 'faixas';
    const tomadasIA = (t) => bandeira ? 'bandeirasTomadas' : 'faixasTomadas';
    fecho.linhas = fecho.linhas || [];
    if(tomamos && !fx.nossa){
      const t = PAT.faixasIA(E, fx.torcidaId);
      if(t) t[contaIA(t)] = Math.max(0, t[contaIA(t)] - 1);
      /* (`variante`: qual das faixas dela era — a arte de verdade que
         aparece no Patrimônio e no armário do almoxarifado) */
      listaNossa().tomadas.push({de:fx.torcidaId, nome:fx.nome,
        quando:{ano:E.data.ano, semana:E.data.semana}, variante:fx.variante || 0});
      TO.estado.mexerIndicador(E, 'prestigio', V.ganho/5, bandeira
        ? _t('Tomamos a bandeira da {nome}', {nome:fx.nome})
        : _t('Tomamos a faixa da {nome}', {nome:fx.nome}));
      R.mover(E, fx.torcidaId, 'prestigio', -V.perda/5);
      fecho.linhas.push(bandeira
        ? _t('tomamos a bandeira da {nome}', {nome:fx.nome})
        : _t('tomamos a faixa da {nome}', {nome:fx.nome}));
      fecho.faixa = 'tomamos';
      return 'tomamos';
    }
    if(!tomamos && fx.nossa){
      const nossas = listaNossa().nossas;
      if(nossas.length) nossas.pop();
      const o = outroId ? TO.mundo.torcida(outroId) : null;
      const t = outroId ? PAT.faixasIA(E, outroId) : null;
      if(t) t[tomadasIA(t)].push({de:E.torcida.id, nome:E.torcida.nome, ano:E.data.ano, variante:fx.variante || 0});
      TO.estado.mexerIndicador(E, 'prestigio', -V.perda/5,
        o ? (bandeira ? _t('Perdemos a nossa bandeira pra {nome}', {nome:o.nome})
                      : _t('Perdemos a nossa faixa pra {nome}', {nome:o.nome}))
          : (bandeira ? _t('Perdemos a nossa bandeira') : _t('Perdemos a nossa faixa')));
      if(outroId) R.mover(E, outroId, 'prestigio', V.ganho/5);
      fecho.linhas.push(
        o ? (bandeira ? _t('perdemos a nossa bandeira pra {nome}', {nome:o.nome})
                      : _t('perdemos a nossa faixa pra {nome}', {nome:o.nome}))
          : (bandeira ? _t('perdemos a nossa bandeira') : _t('perdemos a nossa faixa')));
      fecho.faixa = 'perdemos';
      return 'perdemos';
    }
    /* entre duas IAs (a aliada perdeu pro rival na arquibancada, ou o
       contrário): muda de mão sem mexer no nosso caixa de prestígio */
    if(!fx.nossa && fx.torcidaId && outroId && fx.torcidaId !== outroId){
      const dona = PAT.faixasIA(E, fx.torcidaId);
      const quem = tomamos ? null : PAT.faixasIA(E, outroId);
      if(dona) dona[contaIA(dona)] = Math.max(0, dona[contaIA(dona)] - 1);
      if(quem) quem[tomadasIA(quem)].push({de:fx.torcidaId, nome:fx.nome, ano:E.data.ano, variante:fx.variante || 0});
      if(quem){ R.mover(E, fx.torcidaId, 'prestigio', -V.perda/5); R.mover(E, outroId, 'prestigio', V.ganho/5); }
      return null;
    }
    return null;
  }

  function fecharCena(E, ctx, res){
    if(!ctx || !ctx.acao) return null;
    if(ctx.acao === 'atacar')     return fecharAtaque(E, ctx.alvo, res);
    if(ctx.acao === 'pressionar') return fecharPressao(E, res);
    if(ctx.acao === 'defender')   return fecharDefesa(E, ctx.alvo, res);
    if(ctx.acao === 'treta')      return fecharTreta(E, ctx.alvo, res);
    if(ctx.acao === 'estadio')    return fecharEstadio(E, ctx.alvo, res);
    return null;
  }

  /* A BRIGA NA ARQUIBANCADA fecha com a tabela do dono (19/08/2026),
     pela diferença de efetivo entre os lados no apito do clima.
     VITÓRIA NÃO DESCONTA MORAL (correção do dono, 24/08/2026): a
     tabela antiga dava Moral −2 na vitória em menor número — a maior
     façanha da arquibancada saía punida. Agora a zebra é o topo:
       vitória — em menor número (11+ a menos): Prestígio +3 · Moral +2;
                 parelho (±10): Prestígio +2 · Moral +1;
                 com 11+ a mais: Prestígio +1 · Moral +0,5;
       derrota — em menor número: Prestígio −1;
                 parelho (±10): Prestígio −2 · Moral −1;
                 com 11+ a mais: Prestígio −3 · Moral −2.
     Prestígio na régua de 0-100 (÷5 no indicador). A relação azeda pela
     mesma faixa de efetivo, com os números da tabela (TO.relacoes.REL):
     encarar quem era maior deixa mais ódio pra trás do que passar por
     cima de quem era menor. */
  function fecharEstadio(E, alvo, res){
    const R = TO.relacoes;
    const ganhou = res.ganhamos !== undefined ? !!res.ganhamos : !!res.venceu;
    const diff = (alvo.nossos||0) - (alvo.deles||0);
    const faixa = diff <= -11 ? 'menos' : diff >= 11 ? 'mais' : 'parelho';
    const T = ganhou
      ? {menos:{p: 3, m: 2}, parelho:{p: 2, m: 1}, mais:{p: 1, m: 0.5}}
      : {menos:{p:-1, m: 0}, parelho:{p:-2, m:-1}, mais:{p:-3, m:-2}};
    /* a relação com o rival paga pela mesma régua do efetivo (preço do
       dono, 19/08/2026): encarar quem era maior deixa mais ódio pra
       trás do que passar por cima de quem era menor — e cai dos dois
       lados do placar, porque briga em arquibancada nenhuma aproxima */
    const AZEDA = {menos: REL().arquibancadaMenos,
                   parelho: REL().arquibancadaIgual,
                   mais: REL().arquibancadaMais};
    const t = T[faixa];
    const antesP = E.indicadores.prestigio, antesM = E.indicadores.moral;
    const antesR = R.nivel(E, alvo.torcidaId);
    const motivo = _t('Briga na arquibancada contra a {nome}', {nome:alvo.nome});
    TO.estado.mexerIndicador(E, 'prestigio', t.p/5, motivo);
    if(t.m) TO.estado.mexerIndicador(E, 'moral', t.m, motivo);
    R.hostilidade(E, alvo.torcidaId, AZEDA[faixa]);
    const efeitos = [
      {ind:'prestigio', delta: r1(E.indicadores.prestigio - antesP), dono:_t('nosso')},
      {ind:'moral',     delta: r1(E.indicadores.moral - antesM), dono:_t('nossa')},
      {ind:'relacao',   delta: r1(R.nivel(E, alvo.torcidaId) - antesR),
       dono:_t('com a {nome}', {nome:alvo.nome})}
    ].filter(x=>x.delta);
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: alvo.torcidaId, ganhamos: ganhou,
      /* a arquibancada não fica em bairro nenhum (correção do dono,
         21/08/2026): quem nomeia o lugar é a cena */
      local:{cena: alvo.cena || 'estadio-20', bairro:''},
      a: nossoLado(E, alvo, res, ganhou),
      b: ladoDeles(E, alvo, res, ganhou),
      efeitos});
    return {ganhou, dinheiro:0, efeitos,
            titulo: ganhou ? _t('A ARQUIBANCADA FICOU NOSSA')
                           : _t('CORRERAM COM A GENTE NO ESTÁDIO'),
            linhas:[_t('éramos {a} contra {b} no setor', {a:alvo.nossos||0, b:alvo.deles||0})]};
  }

  /* A TRETA MARCADA fecha com a conta própria do dono (régua nova em
     18/08/2026): relação −2, e o vencedor leva NO MÍNIMO 3 de
     prestígio na régua de 0-100 — 3 no 5×5, 4 no 7×7, 5 no 10×10 —
     com o perdedor devolvendo o mesmo. Vitória também sobe a moral
     de cada membro que desceu pro problema. */
  function fecharTreta(E, alvo, res){
    const R = TO.relacoes;
    const ganhou = res.ganhamos !== undefined ? !!res.ganhamos : !!res.venceu;
    const antesRel = R.nivel(E, alvo.torcidaId);
    R.hostilidade(E, alvo.torcidaId, REL().treta);
    const antesP = E.indicadores.prestigio;
    const display = (alvo.n||5) >= 10 ? 5 : (alvo.n||5) >= 7 ? 4 : 3;
    /* preço do dono (19/08/2026): vencer paga +3/+4/+5; perder custa
       −1 de prestígio e −1 de moral pra cada um que foi */
    TO.estado.mexerIndicador(E, 'prestigio', ganhou ? display/5 : -0.2,
      ganhou ? _t('Treta contra a {nome}: vencemos', {nome:alvo.nome})
             : _t('Treta contra a {nome}: perdemos', {nome:alvo.nome}));
    const dpDeles = R.mover(E, alvo.torcidaId, 'prestigio',
                            ganhou ? -0.2 : display/5);
    const membros = (res && res.membros) || [];
    /* a moral de membro foi extinta (dono, 24/08/2026): o ±2/−1 de
       quem descia pra treta saiu daqui — realocação a definir */
    /* A APOSTA (régua do dono, 22/08/2026): os dois lados põem o mesmo
       na roda e quem ganha leva. O caixa deles é raspado no que puder
       cobrir — mesma regra do saque do bar, torcida não fica devendo. */
    const aposta = alvo.aposta || 0;
    let bolada = 0;
    if(aposta > 0){
      const m = R.mundo(E)[alvo.torcidaId];
      if(ganhou){
        bolada = aposta;
        if(m) m.caixa = Math.max(0, (m.caixa||0) - aposta);
        TO.estado.lancar(E, _t('Aposta da treta — {nome}', {nome:alvo.nome}), bolada);
      }else{
        bolada = -aposta;
        if(m) m.caixa = (m.caixa||0) + aposta;
        TO.estado.lancar(E, _t('Aposta da treta — {nome}', {nome:alvo.nome}), bolada);
      }
    }
    const efeitos = [
      {ind:'relacao',   delta: r1(R.nivel(E, alvo.torcidaId) - antesRel),
       dono:_t('com a {nome}', {nome:alvo.nome})},
      {ind:'prestigio', delta: r1(E.indicadores.prestigio - antesP),
       dono:_t('nosso')},
      {ind:'prestigio', delta: dpDeles, dono:_t('da {nome}', {nome:alvo.nome})},
      {ind:'dinheiro',  delta: bolada, dono:_t('nosso')}
    ].filter(x=>x.delta);
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: alvo.torcidaId, ganhamos: ganhou,
      local:{cena: alvo.cena || 'rua', bairro: alvo.bairro || ''},
      lnt: alvo.lnt || null, tam: alvo.n || 5,
      a: {torcidaId:E.torcida.id, nome:E.torcida.nome, n:alvo.n,
          caidos: membros.filter(m=>!m.preso && m.caido).length,
          presos: membros.filter(m=>m.preso).length, venceu:ganhou},
      b: {torcidaId:alvo.torcidaId, nome:alvo.nome, n:alvo.n,
          caidos: (res && res.caidosVisitante) || 0,
          presos: (res && res.presosVisitante) || 0, venceu:!ganhou},
      efeitos});
    /* A LNT ANOTA O DUELO (régua do dono, 22/08/2026): o resultado
       da cena é o resultado da chave, com feridos e tudo — é o saldo
       de feridos que desempata os grupos. O prêmio de fase, se
       houver, é pago por lá quando a fase fecha. */
    let lnt = null;
    if(alvo.lnt && TO.lnt){
      lnt = TO.lnt.registrarNosso(E, {
        ganhamos: ganhou,
        nossos: membros.filter(m=>m.caido || m.preso).length,
        deles: ((res && res.caidosVisitante) || 0) +
               ((res && res.presosVisitante) || 0)
      });
      if(TO.feed && TO.feed.lntDepoisDaCena) TO.feed.lntDepoisDaCena(E);
    }
    const linhas = alvo.lnt
      /* fase e divisão são dado (chave de lógica na LNT): traduz na tela */
      ? [_t('{fase} da {div} da LNT, {n} de cada lado',
            {fase:_t(alvo.lnt.fase), div:_t(alvo.lnt.nomeDiv), n:alvo.n})]
      : [_t('no bairro {bairro}, {n} de cada lado', {bairro:alvo.bairro||'—', n:alvo.n})];
    if(aposta > 0)
      linhas.push(ganhou
        ? _t('{valor} apostados — levamos a dos dois', {valor:U.dinheiro(aposta)})
        : _t('{valor} apostados — a nossa ficou com eles', {valor:U.dinheiro(aposta)}));
    return {ganhou, dinheiro:bolada, lnt,
            titulo: alvo.lnt ? (ganhou ? _t('PASSAMOS NA LNT') : _t('CAÍMOS NA LNT'))
                  : ganhou ? _t('TRETA VENCIDA') : _t('TRETA PERDIDA'),
            linhas};
  }

  /* a casa invadida ou a caravana fechada na estrada */
  function fecharDefesa(E, alvo, res){
    const R = TO.relacoes;
    const seguramos = res.ganhamos !== undefined ? !!res.ganhamos : !res.venceu;
    const naEstrada = alvo.tipo === 'emboscada';
    const linhas = [];
    let perdeu = 0;
    const antes = {moral:E.indicadores.moral, prestigio:E.indicadores.prestigio,
                   relacao: R.nivel(E, alvo.torcidaId)};
    /* o bar que eles vieram pegar é o bairro da briga (o domínio) */
    const barAlvo = alvo.tipo === 'bar'
      ? TO.financeiro.barMaisVisado((E.patrimonio||{}).bares) : null;
    if(!seguramos){
      /* DINHEIRO SÓ MUDA DE MÃO EM BRIGA NO BAR (decisão do dono,
         17/08/2026): é lá que tem gaveta e caixa. Perder na estrada,
         na concentração ou na pista custa gente, moral e prestígio —
         não saque. */
      if(alvo.tipo === 'bar'){
        perdeu = Math.round(60 * Math.max(4, alvo.efetivo||40)
                            + Math.max(0, E.dinheiro) * 0.10);
        /* galpão tranca o material e o cofre guarda o caixa
           (pacote do dono, 02/09/2026) */
        perdeu = TO.patrimonio.protegerPerda(E, perdeu);
        if(perdeu > 0){
          TO.estado.lancar(E, _t('Levaram do nosso bar'), -perdeu);
          linhas.push(_t('{valor} da gaveta e do caixa', {valor:U.dinheiro(perdeu)}));
        }
        /* O BAR SAI QUEBRADO (ordem do dono, 10/09/2026): metade da
           receita por 45 dias. Quebram o mais caro — é o que tem
           vidro, mesa e geladeira pra quebrar. */
        const F = TO.financeiro;
        const meu = F.barMaisVisado((E.patrimonio||{}).bares);
        if(meu){
          F.danificarBar(meu, (E.data && E.data.absoluto) || 0, (alvo && alvo.torcidaId) || null);
          linhas.push(_t('o bar ficou em cacos: metade da receita por {n} dias', {n:F.DANO_BAR.dias}));
          /* a cidade toma conhecimento (dono, 19/09/2026): o cartão do
             feed pergunta se a gente responde na porta deles */
          if(TO.feed && TO.feed.registrarObra)
            TO.feed.registrarObra(E, {tipo:'bar-quebrado',
              dono:E.torcida.id, atacante:(alvo && alvo.torcidaId) || null});
        }
      }
      TO.estado.mexerIndicador(E, 'moral', -3, _t('Fugimos sem defender o que é nosso'));
      TO.estado.mexerIndicador(E, 'prestigio', -0.7, _t('Fugimos sem defender o que é nosso'));
      linhas.push(naEstrada ? _t('o ônibus seguiu viagem com meia turma de pé')
                            : _t('eles saíram de lá com a casa na mão'));
    }else{
      TO.estado.mexerIndicador(E, 'moral', 1.5, _t('Defendemos o que é nosso'));
      TO.estado.mexerIndicador(E, 'prestigio', 0.7, _t('Defendemos o que é nosso'));
      linhas.push(naEstrada ? _t('a pista ficou nossa') : _t('a casa ficou de pé'));
    }
    if(naEstrada) E.viagem = {
      ano:E.data.ano, semana:E.data.semana, dia:E.data.dia,
      seguramos, torcida:alvo.torcidaId, nome:alvo.nome,
      embarcados: alvo.nossos || 0,
      feridos: (res.membros||[]).filter(r=>!r.preso && r.caido).length
    };
    R.hostilidade(E, alvo.torcidaId,
                  seguramos ? REL().defesaSegura : REL().defesaPerdida);
    const dmDelas = R.mover(E, alvo.torcidaId, 'moral', seguramos ? -1.0 : 0.8);
    R.mover(E, alvo.torcidaId, 'prestigio', seguramos ? -0.5 : 0.6);

    /* a noite inteira na linha (revisão do dono, 27/08/2026): o `antes`
       daqui é depois de aplicarResultadoDaNoite, então a parte da CENA
       (carimbada no res) entrava no indicador mas sumia do ocorrido —
       a mensagem mostrava só o ±0,7 fixo da defesa */
    const efeitos = [
      {ind:'dinheiro',  delta: -perdeu, dono:_t('nosso')},
      {ind:'moral',     delta: r1(E.indicadores.moral - antes.moral
                                  + ((res && res.moralAplicada) || 0)), dono:_t('nossa')},
      {ind:'prestigio', delta: r1(E.indicadores.prestigio - antes.prestigio
                                  + ((res && res.prestigioAplicado) || 0)/5),
       dono:_t('nosso')},
      {ind:'relacao',   delta: r1(R.nivel(E, alvo.torcidaId) - antes.relacao),
       dono:_t('com a {nome}', {nome:alvo.nome})},
      {ind:'moral',     delta: dmDelas, dono:_t('da {nome}', {nome:alvo.nome})}
    ].filter(x=>x.delta);
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: alvo.torcidaId, ganhamos: seguramos,
      atacamos: false, cobranca: !!alvo.cobranca,
      local:{cena: alvo.cena || (naEstrada ? 'rua' : alvo.tipo),
             bairro: alvo.bairro || (barAlvo && barAlvo.bairro) || '',
             cidade: alvo.mapa || null},
      tipoDefesa: alvo.tipo, estrada: naEstrada,
      a: nossoLado(E, alvo, res, seguramos),
      b: ladoDeles(E, alvo, res, seguramos),
      efeitos});
    return {ganhou:seguramos, linhas, dinheiro:-perdeu, efeitos,
            titulo: seguramos ? (naEstrada ? _t('A PISTA FICOU NOSSA')
                                           : _t('A CASA FICOU DE PÉ'))
                              : (naEstrada ? _t('PEGARAM A CARAVANA')
                                           : _t('PERDEMOS A CASA'))};
  }

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
    /* o nome do lado é o da TORCIDA dona do alvo — "Bar da Falange
       Coral" é endereço, não torcida (correção do dono, 18/08/2026) */
    const dona = (alvo.deQuem)
      || ((TO.mundo.torcida(alvo.torcidaId)||{}).nome)
      || alvo.nome;
    return {torcidaId:alvo.torcidaId, nome:dona,
            n: (res && res.efetivo && res.efetivo[outro]) || alvo.efetivo || 0,
            caidos: caidos||0, presos: presos||0, venceu: !ganhamos, lado: outro};
  }

  function fecharAtaque(E, alvo, res){
    const R = TO.relacoes;
    const ganhou = !!res.venceu;
    const linhas = [];
    let levou = 0, quebrou = false;
    if(ganhou){
      const m = R.mundo(E)[alvo.torcidaId];
      /* DINHEIRO SÓ SAI DE BRIGA NO BAR (decisão do dono, 17/08/2026):
         é lá que tem gaveta e caixa. Sede e o resto rendem prestígio,
         moral e faixa rasgada — não saque. */
      if(alvo.tipo === 'bar'){
        const gaveta = 60 * alvo.efetivo;
        levou = Math.round(gaveta + (m ? m.caixa : 1200) * 0.22);
        /* galpão e cofre da VÍTIMA seguram o saque (dono, 02/09/2026):
           a mesma proteção que o jogador tem — quem rouba leva menos */
        if(m){
          if(m.galpao) levou = Math.round(levou * 0.7);
          if(m.cofre)  levou = Math.round(levou * 0.5);
        }
        if(levou > 0){
          if(m) m.caixa = Math.max(0, m.caixa - levou);
          TO.estado.lancar(E, _t('Saque — {nome}', {nome:alvo.nome}), levou);
          /* o prejuízo entra no extrato DELA (crivo do dono, 31/08) */
          if(TO.relacoes.lancarIA)
            TO.relacoes.lancarIA(E, alvo.torcidaId,
                                 _t('Saque sofrido no bar'), -levou);
          linhas.push(_t('{valor} do caixa deles', {valor:U.dinheiro(levou)}));
        }
        /* e o ponto deles fica quebrado 45 dias, na mesma régua que
           vale pra gente (dono, 10/09/2026) */
        const F = TO.financeiro;
        const dele = m && F.barMaisVisado(m.bares);
        quebrou = !!dele;
        if(dele){
          F.danificarBar(dele, (E.data && E.data.absoluto) || 0, E.torcida.id);
          linhas.push(_t('o bar deles ficou em cacos: metade da receita por {n} dias', {n:F.DANO_BAR.dias}));
        }
      }
      /* o corte permanente de membros saiu (18/08/2026): os caídos
         agora viram baixa temporária de verdade em registrarConfronto
         — ferido 5 a 15 dias, preso 15 a 90 — em vez do desconto seco */
      if(m) m.moral = U.limitar(m.moral - 3, 0, 20);
      if(alvo.tipo === 'sede') linhas.push(_t('faixa deles rasgada na porta'));
      if(alvo.tipo === 'casa') linhas.push(_t('a resenha deles acabou no grito'));
    }else{
      linhas.push(_t('a gente saiu de lá pior do que entrou'));
    }
    const antes = R.nivel(E, alvo.torcidaId);
    R.hostilidade(E, alvo.torcidaId,
                  ganhou ? REL().ataqueGanho : REL().ataquePerdido);
    /* o prestígio DELES também entra na conta da briga (decisão do
       dono): apanhar em casa custa mais do que segurar o ataque rende */
    const dpDeles = R.mover(E, alvo.torcidaId, 'prestigio',
                            ganhou ? -0.6 : 0.4);
    /* relação e prestígio são da TORCIDA dona do alvo, e a linha de
       consequência fala dela — "Bar da Falange Coral" é endereço
       (correção do dono, 18/08/2026) */
    const dona = alvo.deQuem
      || ((TO.mundo.torcida(alvo.torcidaId)||{}).nome) || alvo.nome;
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: alvo.torcidaId, ganhamos: ganhou, atacamos: true,
      local:{cena: alvo.cena || alvo.tipo, bairro: alvo.bairro || ''},
      alvoTipo: alvo.tipo, quebrou,
      a: nossoLado(E, alvo, res, ganhou),
      b: ladoDeles(E, alvo, res, ganhou),
      efeitos:[{ind:'relacao', delta:r1(R.nivel(E,alvo.torcidaId)-antes),
                dono:_t('com a {nome}', {nome:dona})},
               /* o que ENTROU, não o que a briga reivindicou */
               {ind:'prestigio', delta: res.prestigioAplicado != null
                  ? r1(res.prestigioAplicado/5)
                  : r1(U.limitar((res.prestigio||0)/5, -2, 2)), dono:_t('nosso')},
               {ind:'prestigio', delta: dpDeles, dono:_t('da {nome}', {nome:dona})},
               {ind:'dinheiro',  delta: levou, dono:_t('nosso')}].filter(x=>x.delta)});
    return {ganhou, linhas, dinheiro:levou,
            titulo: ganhou ? _t('ATAQUE BEM-SUCEDIDO') : _t('ATAQUE FRACASSOU')};
  }

  /* semanas que a cobrança do elenco dura — hoje só mexe na relação com
     o clube e na moral; o placar é puro por decisão do autor */
  const COBRANCA = {semanas:4};

  function fecharPressao(E, res){
    const c = clube(E);
    const chegou = (res.entraram || 0) > 0 || !!res.venceu;
    const gasto = chegou ? 18 : 28;
    c.relacao = U.limitar(c.relacao - gasto, 0, 100);
    c.cobranca = {ate: E.data.semana + COBRANCA.semanas};
    TO.estado.mexerIndicador(E, 'moral', chegou ? 0.8 : -1.2,
      chegou ? _t('Caravana chegou inteira') : _t('Caravana emboscada na estrada'));
    return {ganhou:chegou, dinheiro:0,
            titulo: chegou ? _t('COBRANÇA FEITA') : _t('COBRANÇA FRACASSOU'),
            linhas:[_t('relação com o clube em {n}', {n:Math.round(c.relacao)})]};
  }

  /* =======================================================
     CATÁLOGO DO EXPEDIENTE
     Cada ação diz por que não pode, em vez de só ficar cinza.
     Rendimento reduzido: é ação de um turno, não de semana.
     ======================================================= */
  /* TREINAR SAIU DO EXPEDIENTE (decisão do dono, 17/08/2026): a fila
     agora é sorteada e treinada sozinha todo dia, direto no virar do
     dia — turno de expediente treinando por cima seria treino em
     dobro. Rotina salva com 'treinar' só pula o turno. */
  const LISTA = [
    {
      id:'recrutar', nome:_t('Recrutar'), icone:'megafone', cena:_t('Praça'),
      efeito:_t('chance diária de 1–2 novatos (R$ 5 cada) — a fase do clube dita a sorte'),
      disponivel(E){
        const p = previsaoRecrutamento(E);
        if(p.vaga <= 0) return {ok:false, motivo: nivelDaSede(E) <= 0 ? _t('a esquina não cabe mais gente: construa a sede') : _t('a sede está cheia')};
        if(p.base <= 0) return {ok:false, motivo:_t('não há torcedor fora de organizada')};
        return {ok:true, nota:_t('{regime}: {um}% de 1 · {dois}% de 2',
                                 {regime:p.rotRegime, um:Math.round(p.um*100), dois:Math.round(p.dois*100)})};
      },
      executar(E){
        const p = previsaoRecrutamento(E);
        if(p.vaga <= 0) return {ok:false, msg: nivelDaSede(E) <= 0 ? _t('A esquina não cabe mais gente: construa a sede.') : _t('A sede está cheia.'), semCusto:true};

        /* o dado do dono: dois primeiro, um depois, o resto é ninguém */
        const r = U.rng();
        let n = r < p.dois ? 2 : r < p.dois + p.um ? 1 : 0;
        n = Math.min(n, p.vaga);
        if(n <= 0) return {ok:true, msg:_t('Ninguém quis entrar hoje.')};

        /* O NOVATO PODE ENTRAR PELA SEDE OU POR UMA FILIAL (aprovado
           pelo dono, 25/08/2026): mesma regra, mesmo dado — o sorteio
           do núcleo pesa pela vaga de cada casa, e cada casa precisa
           de torcedor fora de organizada na praça DELA. */
        const locais = [];
        const capM = TO.membros.capacidadeMatriz(E);
        const naM = E.membros.filter(m=>!m.filial).length;
        if(capM - naM > 0 && p.base > 0)
          locais.push({filial:null, vaga:capM - naM});
        for(const f of ((E.patrimonio||{}).filiais||[])){
          const teto = (TO.patrimonio.FILIAL.teto[f.nivel]||0);
          const tem = E.membros.filter(m=>m.filial === f.cidade).length;
          const base = TO.mundo.baseDeRecrutamento(f.cidade,
            E.torcida.clubeId, o=>efetivoDe(E, o));
          if(teto - tem > 0 && base > 0)
            locais.push({filial:f.cidade, vaga:teto - tem});
        }
        if(!locais.length) return {ok:true, msg:_t('Ninguém quis entrar hoje.')};
        const sorteiaLocal = ()=>{
          const soma = locais.reduce((s,l)=>s+l.vaga, 0);
          let d = U.rng()*soma;
          for(const l of locais){ d -= l.vaga; if(d <= 0) return l; }
          return locais[locais.length-1];
        };
        let daFilial = 0;
        for(let i=0;i<n;i++){
          const l = sorteiaLocal();
          E.membros.push(TO.membros.criar(E, {cargo:'novato',
                                              filial:l.filial}));
          l.vaga--; if(l.vaga <= 0) locais.splice(locais.indexOf(l),1);
          if(l.filial) daFilial++;
          if(!locais.length) break;
        }
        TO.estado.lancar(E, _tn(n, 'Recrutamento de {n} novato', 'Recrutamento de {n} novatos'), -5*n);
        E.historicoRecrutamento = E.historicoRecrutamento || [];
        E.historicoRecrutamento.unshift({semana:E.data.semana, n,
        base:Math.round(p.base), querem:p.querem});
        if(E.historicoRecrutamento.length>60) E.historicoRecrutamento.pop();
        return {ok:true, msg: daFilial
          ? _tn(n, '{n} novato entrou ({f} pela subsede de fora).',
                   '{n} novatos entraram ({f} pela subsede de fora).', {f:daFilial})
          : _tn(n, '{n} novato entrou.', '{n} novatos entraram.')};
      }
    },
    {
      id:'festa', nome:_t('Festa na sede'), icone:'copo', cena:_t('Sede'),
      /* O PREÇO SEGUE O TAMANHO DO SALÃO (régua do dono, 20/08/2026):
         R$ 170 na sede 1 e R$ 1.700 na 5, com os R$ 700 de sempre na
         sede 4. Por isso custo e efeito são função de E, não número
         fixo — quem lê a linha da ação lê o preço da NOSSA sede. */
      efeito: E => _t('custa {valor}; rende R$ 4,80–6,40 por presente — lucra com ~{n} disponíveis',
        {valor:U.dinheiro(custoFesta(E)), n:TO.financeiro.pisoDaFesta(nivelDaSede(E))}),
      custo: E => custoFesta(E),
      disponivel(E){
        /* sem sede não há festa (dono, 22/09/2026): a esquina não tem salão */
        if(nivelDaSede(E) <= 0) return {ok:false, motivo:_t('sem sede não há festa')};
        const c = custoFesta(E);
        return E.dinheiro >= c ? {ok:true}
             : {ok:false, motivo:_t('custa {valor}', {valor:U.dinheiro(c)})};
      },
      executar(E){
        /* festa é na SEDE: membro de filial mora longe e não conta */
        const publico = TO.membros.aptosParaOEstadio(E).length;
        /* RÉGUA DO DONO (18/08/2026, preço por nível em 20/08/2026):
           a festa tem de dar lucro pra sede cheia, de qualquer
           tamanho. Por cabeça sai de R$ 4,80 a 6,40, e o custo do
           nível fecha a conta em ~70% da lotação: aí até a noite
           fraca paga. Abaixo disso é vaquinha, e vaquinha é escolha
           ruim — não é impossibilidade. */
        const custo = custoFesta(E);
        /* a sede em bairro de dona rival: a festa rende 30% menos (o
           domínio dos bairros, 30/09/2026) — o público tem medo de ir */
        const corte = TO.dominio ? TO.dominio.fator(E, E.torcida.id, E.torcida.mapa,
                                                    (TO.mundo.bairroDaSede(E.torcida)||{}).nome) : 1;
        const receita = Math.round(publico * U.entre(4.8, 6.4) * corte);
        /* festa não fabrica moral (decisão do dono, 17/08/2026): virou
           diária com o Expediente e saturava o indicador em dias. É
           caixa e ponto — moral vem de briga, título e defesa. */
        /* o caixa mexe agora; o extrato só ganha o resumo do mês
           (decisão do dono, 18/08/2026 — a festa diária poluía tudo) */
        TO.estado.lancarNoResumo(E, 'festa', -custo);
        TO.estado.lancarNoResumo(E, 'festa', receita, true);
        return {ok:true, msg:_t('Festa na sede. {valor} de saldo.', {valor:U.dinheiro(receita-custo)})};
      }
    },
    /* AÇÃO SOCIAL E CAMPANHA DE RECRUTAMENTO APOSENTADAS (ordem do
       dono, 24/08/2026): eram as duas piores do catálogo — caras e sem
       retorno que pagasse a conta. No lugar entrou o bloco novo
       abaixo. Save antigo com elas no expediente só pula o turno. */
    {
      id:'visita', nome:_t('Visita aos feridos'), icone:'conversa', cena:_t('Hospital'),
      efeito:_t('grátis; cada ferido sara 2 dias mais cedo · Moral +0,3'),
      disponivel(E){
        const n = E.membros.filter(m=>m.ferido).length;
        return n ? {ok:true, nota:_t('{n} de molho', {n})}
                 : {ok:false, motivo:_t('ninguém ferido')};
      },
      executar(E){
        let n = 0;
        for(const m of E.membros)
          if(m.ferido){ m.ferido.dias = Math.max(0, m.ferido.dias - 2); n++; }
        if(!n) return {ok:false, msg:_t('Ninguém ferido.'), semCusto:true};
        TO.estado.mexerIndicador(E, 'moral', 0.3, _t('Visita aos feridos'));
        return {ok:true, msg:_tn(n, '{n} visitado — sara 2 dias mais cedo.',
                                    '{n} visitados — sara todo mundo 2 dias mais cedo.')};
      }
    },
    {
      id:'pix', nome:_t('Campanha de doação por PIX'), icone:'dinheiro', cena:_t('Sede'),
      efeito:_t('grátis; arrecada R$ 8–15 por membro disponível · Prestígio −1 (na régua de 0 a 100)'),
      disponivel(E){
        const n = E.membros.filter(TO.membros.disponivel).length;
        return n >= 3 ? {ok:true}
                      : {ok:false, motivo:_t('precisa de pelo menos três de pé')};
      },
      executar(E){
        const n = E.membros.filter(TO.membros.disponivel).length;
        const v = Math.round(n * U.entre(8, 15));
        /* diária: o caixa mexe agora, a linha do extrato sai no mês */
        TO.estado.lancarNoResumo(E, 'pix', v, true);
        TO.estado.mexerIndicador(E, 'prestigio', -0.2,
          _t('Campanha de doação por PIX'));
        return {ok:true, msg:_t('{valor} caíram na conta.', {valor:U.dinheiro(v)})};
      }
    },
    {
      id:'padrinho', nome:_t('Padrinho de treino'), icone:'halter', cena:_t('Sede'),
      efeito:_t('R$ 150 de gratificação; um veterano da velha guarda puxa o treino do dia: rende +15% e novato ganha XP em dobro'),
      custo:150,
      disponivel(E){
        if(!(E.velhaGuarda||[]).length)
          return {ok:false, motivo:_t('ninguém pendurou a bandeira ainda')};
        if(E.dinheiro < 150) return {ok:false, motivo:_t('custa {valor}', {valor:U.dinheiro(150)})};
        return {ok:true, nota:_t('{n} na velha guarda', {n:E.velhaGuarda.length})};
      },
      executar(E){
        const abs = E.data.absoluto || 0;
        if(E.padrinhoAbs === abs)
          return {ok:true, msg:_t('O padrinho já está no tatame hoje.'), semCusto:true};
        TO.estado.lancarNoResumo(E, 'padrinho', -150, true);
        E.padrinhoAbs = abs;
        /* quem assume é a melhor ficha da velha guarda — quem apanhou
           e bateu mais tem mais o que ensinar */
        const vg = [...E.velhaGuarda]
          .sort((a,b)=>((b.forca||0)+(b.defesa||0))-((a.forca||0)+(a.defesa||0)))[0];
        const nome = (vg && (vg.apelido || vg.nome)) || _t('Um veterano');
        return {ok:true, msg:_t('{nome} assumiu o treino de hoje.', {nome})};
      }
    },
    {
      id:'bateria', nome:_t('Treino de bateria'), icone:'tambor', cena:_t('Sede'),
      efeito:_t('grátis; precisa de 6 de pé — com a bateria afiada, o Fator Torcida empurra o nosso time em casa (+20%)'),
      disponivel(E){
        const n = TO.membros.aptosParaOEstadio(E).length;
        return n >= 6 ? {ok:true}
                      : {ok:false, motivo:_t('precisa de seis de pé')};
      },
      executar(E){
        E.bateriaAbs = E.data.absoluto || 0;
        return {ok:true, msg:_t('Bateria ensaiada — jogo em casa vai ter empurrão.')};
      }
    },
    {
      id:'inteligencia', nome:_t('Inteligência'), icone:'olho', cena:_t('Rua'),
      efeito:_t('R$ 100 por dia; o olheiro tem 50% de chance de prever emboscada na estrada ou ataque que vem'),
      custo:100,
      disponivel(E){
        return E.dinheiro >= 100 ? {ok:true}
                                 : {ok:false, motivo:_t('custa {valor} por dia', {valor:U.dinheiro(100)})};
      },
      executar(E){
        const abs = E.data.absoluto || 0;
        if(E.campana && E.campana.pagoAbs === abs)
          return {ok:true, msg:_t('A campana de hoje já está de pé.'), semCusto:true};
        TO.estado.lancarNoResumo(E, 'campana', -100, true);
        E.campana = {nivel:1, pagoAbs:abs};
        return {ok:true, msg:_t('Olheiro na rua, ouvido no chão.')};
      }
    },
    {
      id:'inteligencia2', nome:_t('Inteligência ×2'), icone:'olho', cena:_t('Rua'),
      efeito:_t('R$ 400 por dia; o olheiro crava TODOS os ataques que vêm'),
      custo:400,
      disponivel(E){
        return E.dinheiro >= 400 ? {ok:true}
                                 : {ok:false, motivo:_t('custa {valor} por dia', {valor:U.dinheiro(400)})};
      },
      executar(E){
        const abs = E.data.absoluto || 0;
        if(E.campana && E.campana.pagoAbs === abs && E.campana.nivel >= 2)
          return {ok:true, msg:_t('A campana dupla de hoje já está de pé.'),
                  semCusto:true};
        /* subir da simples pra dupla no mesmo dia paga só a diferença */
        const paga = E.campana && E.campana.pagoAbs === abs ? 300 : 400;
        TO.estado.lancarNoResumo(E, 'campana', -paga, true);
        E.campana = {nivel:2, pagoAbs:abs};
        return {ok:true, msg:_t('Dois olheiros na rua — nada passa sem a gente saber.')};
      }
    },
    /* PICHAR E IR À DELEGACIA APOSENTADAS (ordem do dono, 24/08/2026),
       na mesma leva de limpeza do expediente. A fiança individual
       continua no perfil do membro. */
    {
      id:'reuniao', nome:_t('Reunião de diretoria'), icone:'conversa', cena:_t('Sede'),
      efeito:_t('Relação +6 com o aliado mais próximo; precisa de 2 diretores de pé'),
      disponivel(E){
        const n = E.membros.filter(m=>m.cargo==='diretoria' && TO.membros.disponivel(m)).length;
        if(n < 2) return {ok:false, motivo:_t('precisa de dois diretores de pé')};
        const alvos = Object.entries(E.relacoes||{}).filter(([,v])=>v > -70);
        if(!alvos.length) return {ok:false, motivo:_t('ninguém com quem conversar')};
        return {ok:true};
      },
      executar(E){
        const alvos = Object.entries(E.relacoes||{})
          .filter(([,v])=>v > -70)
          .sort((a,b)=>b[1]-a[1]);
        const [id, v] = alvos[0];
        const o = TO.mundo.torcida(id);
        E.relacoes[id] = U.limitar(v + REL().reuniao, -100, 100);
        TO.relacoes.marcarAjuda(E, id);
        return {ok:true, msg: o
          ? _t('Reunião com {nome}. Relação em {n}.', {nome:o.nome, n:Math.round(E.relacoes[id])})
          : _t('Reunião com a diretoria aliada. Relação em {n}.', {n:Math.round(E.relacoes[id])})};
      }
    },
    /* --- as duas manuais que abrem cena: não entram no expediente --- */
    {id:'atacar', nome:_t('Atacar bar ou sede rival'), icone:'tijolo', cena:_t('Bar'),
     efeito:_t('a briga vale até ±10 de prestígio; no bar, saque de R$ 60 por defensor + 22% do caixa deles — 1 ataque por semana'), alvos:alvosDeAtaque, manual:true,
     disponivel(E){
       const aptos = TO.membros.aptosParaOEstadio(E).length;
       if(aptos < MINIMO_SAIDA)
         return {ok:false, motivo:_t('gente apta de menos ({n} de {min})', {n:aptos, min:MINIMO_SAIDA})};
       if(E.acoes.ultimoAtaqueManual === E.data.semana)
         return {ok:false, motivo:_t('já saiu bonde pra cima de casa rival esta semana')};
       const l = alvosDeAtaque(E);
       if(!l.length) return {ok:false, motivo:_t('nenhum bar ou sede rival mapeado na praça')};
       const q = l[0];
       return {ok:true, nota:_tn(l.length, '{n} alvo · o de pior relação é {nome}',
                                           '{n} alvos · o de pior relação é {nome}', {nome:q.nome})};
     },
     executar(E, opc){
       const alvo = escolher(alvosDeAtaque(E), opc);
       if(!alvo) return {ok:false, msg:_t('Esse alvo não existe mais.')};
       E.acoes.ultimoAtaqueManual = E.data.semana;
       /* teto do dono (18/08/2026): briga de bar é de salão — quem
          defende bota no máximo 40 na cena */
       let noAlvo = Math.max(4, Math.round(alvo.efetivo*0.35));
       if(alvo.tipo === 'bar') noAlvo = Math.min(noAlvo, 40);
       return {ok:true, cena:{cena:'bar', acao:'atacar', alvo,
                              efetivoRival: noAlvo},
               msg:_t('Bonde a caminho: {nome}, {bairro}.', {nome:alvo.nome, bairro:alvo.bairro})};
     }},

    /* A AÇÃO SOCIAL NO BAIRRO (o dono, 30/09/2026: "marcar uma ação
       social no bairro"): cesta básica, mutirão, o campinho arrumado — a
       torcida aparece no bairro sem briga. Uma por semana, R$ 1.500, soma
       de 6 a 10 pontos na barra do bairro (js/mundo/dominio.js). Não é a
       ação social aposentada em 24/08/2026 (id 'social'): é outra, com
       outro id, e mora no mapa da cidade e aqui. */
    {id:'social-bairro', nome:_t('Ação social no bairro'), icone:'casa', cena:_t('Bairro'),
     efeito:_t('R$ 1.500; soma de 6 a 10% na barra do bairro escolhido — 1 por semana'),
     alvos:alvosSociais, manual:true,
     disponivel(E){
       if(!TO.dominio) return {ok:false, motivo:_t('sem bairros nesta cidade')};
       const d = TO.dominio.podeSocial(E);
       if(!d.ok) return d;
       const l = alvosSociais(E);
       return l.length ? {ok:true, nota:_t('o melhor alvo é {nome}', {nome:l[0].nome})}
                       : {ok:false, motivo:_t('todos os bairros já são nossos')};
     },
     executar(E, opc){
       const alvo = escolher(alvosSociais(E), opc);
       if(!alvo) return {ok:false, msg:_t('Esse bairro não existe mais.')};
       return TO.dominio.social(E, alvo.id);
     }},

    {id:'pressionar', nome:_t('Pressionar o clube'), icone:'megafone', cena:_t('CT'),
     efeito:_t('chegando no gramado, Relação com o clube −18 · Moral +0,8; falhando, −28 · Moral −1,2'), manual:true,
     disponivel(E){
       const aptos = TO.membros.aptosParaOEstadio(E).length;
       if(aptos < MINIMO_SAIDA)
         return {ok:false, motivo:_t('gente apta de menos ({n} de {min})', {n:aptos, min:MINIMO_SAIDA})};
       const c = clube(E);
       if(c.relacao <= 5)
         return {ok:false, motivo:_t('a diretoria não abre mais o portão pra vocês')};
       if(c.cobranca && c.cobranca.ate >= E.data.semana)
         return {ok:false, motivo:_t('o elenco já foi cobrado (vale até a semana {n})', {n:c.cobranca.ate})};
       return {ok:true, nota:_t('relação com o clube em {n}', {n:Math.round(c.relacao)})};
     },
     executar(E){
       const c = clube(E);
       return {ok:true, cena:{cena:'ct', acao:'pressionar',
                              alvo:{nome:E.torcida.clube, tipo:'ct'},
                              efetivoRival: 10},
               msg:_t('Caravana no portão do CT. Relação em {n}.', {n:Math.round(c.relacao)})};
     }}
  ];

  const porId = id => LISTA.find(a=>a.id===id);
  /* o que pode entrar num turno do expediente */
  const agendaveis = () => LISTA.filter(a=>!a.manual);

  /* =======================================================
     OS ASSALTOS (tabela do dono, 17/08/2026)
     A diretoria sugere de tempos em tempos; o jogador escolhe
     o alvo e o efetivo. O sorteio é um só pro bonde inteiro:
     ou todo mundo volta com a partilha, ou todo mundo cai.
     ======================================================= */
  /* riscos e penas reapertados pelo dono em 18/08/2026;
     os valores de ganho continuam os mesmos */
  const ASSALTOS = [
    {id:'banco',        nome:_t('Banco'),             art:'no', efetivos:[10, 20],
     no:_t('no banco'), doLocal:_t('do banco'), ao:_t('ao banco'),
     ganho:{10:[30000, 50000], 20:[60000, 120000]}, chance:0.50, pena:180},
    {id:'joalheria',    nome:_t('Joalheria'),         art:'na', efetivos:[10, 20],
     no:_t('na joalheria'), doLocal:_t('da joalheria'), ao:_t('à joalheria'),
     ganho:{10:[10000, 20000], 20:[30000, 40000]},  chance:0.35, pena:120},
    {id:'supermercado', nome:_t('Supermercado'),      art:'no', efetivos:[5, 10],
     no:_t('no supermercado'), doLocal:_t('do supermercado'), ao:_t('ao supermercado'),
     ganho:{5:[5000, 10000],   10:[10000, 15000]},  chance:0.35, pena:120},
    {id:'posto',        nome:_t('Posto de gasolina'), art:'no', efetivos:[5, 10],
     no:_t('no posto de gasolina'), doLocal:_t('do posto de gasolina'), ao:_t('ao posto de gasolina'),
     ganho:{5:[2000, 3000],    10:[4000, 5000]},    chance:0.20, pena:90},
    {id:'mercadinho',   nome:_t('Mercadinho'),        art:'no', efetivos:[2, 5],
     no:_t('no mercadinho'), doLocal:_t('do mercadinho'), ao:_t('ao mercadinho'),
     ganho:{2:[1000, 2000],    5:[3000, 4000]},     chance:0.10, pena:45},
    {id:'roupas',       nome:_t('Loja de roupas'),    art:'na', efetivos:[2, 5],
     no:_t('na loja de roupas'), doLocal:_t('da loja de roupas'), ao:_t('à loja de roupas'),
     ganho:{2:[500, 1000],     5:[2000, 3000]},     chance:0.05, pena:30}
  ];

  function executarAssalto(E, alvoId, n){
    const a = ASSALTOS.find(x=>x.id === alvoId);
    if(!a || !a.efetivos.includes(n)) return {ok:false, msg:_t('alvo inválido')};
    const aptos = E.membros.filter(TO.membros.disponivel);
    if(aptos.length < n)
      return {ok:false, msg:_t('só {n} disponíveis — precisa de {m}', {n:aptos.length, m:n})};
    /* membros ALEATÓRIOS, como manda a tabela — não é a elite que vai */
    const grupo = U.embaralhar([...aptos]).slice(0, n);
    const caiu = U.rng() < a.chance;
    if(caiu){
      for(const m of grupo)
        TO.membros.prender(E, m, a.pena, _t('Preso no assalto — {alvo}', {alvo:a.nome}));
      if(TO.feed) TO.feed.propor(E, {
        kind:'assalto', peso:'info', tipo:'ruim', voz:'diretor',
        texto:_t('Deu ruim {local}: os {n} foram presos. Pena de {pena} dias pra cada um.',
                 {local:a.no, n, pena:a.pena})
      });
      return {ok:true, caiu:true, n, pena:a.pena, alvo:a.nome};
    }
    const [mn, mx] = a.ganho[n];
    const v = U.inteiro(mn, mx);
    TO.estado.lancar(E, _t('Assalto — {alvo}', {alvo:a.nome}), v);
    if(TO.feed) TO.feed.propor(E, {
      kind:'assalto', peso:'info', tipo:'boa', voz:'diretor',
      texto:_t('Os {n} voltaram {local} com {valor}. Ninguém viu, ninguém sabe.',
               {n, local:a.doLocal, valor:U.dinheiro(v)})
    });
    return {ok:true, caiu:false, n, valor:v, alvo:a.nome};
  }

  /* =======================================================
     O ASSALTO PLANEJADO (pedido do dono, 30/09/2026)
     "preciso criar uma mecânica de assaltos pra parar de funcionar
     de forma sorteada [...] pro assalto ser executado pelo jogador
     [...] com o objetivo de ser rápido ou furtivo pra não chamar a
     atenção da polícia, inspirado na forma que se assalta no GTA V."

     O dado deixa de decidir sozinho. A reunião traz os alvos; o
     jogador escolhe o alvo, o tamanho da equipe, a abordagem
     (furtivo ou rápido), o horário (abertura, tarde ou fechamento) e
     o dia — a operação vai pro calendário (`E.assaltos`). No dia, ou
     ele comanda a equipe dentro da loja em 3D (assalto3d.js: quem
     está lá dentro vê, desconfia e dá o alerta), ou deixa a equipe
     fazer (`simularAssalto`: a mesma régua, em conta). O fim pesa a
     recompensa potencial, a dificuldade do alvo, a exposição, a
     atenção da polícia sobre a torcida (`E.calorPolicia`) e o
     desempenho de quem foi; o acaso fica em segundo plano.
     `executarAssalto` (o sorteio de antes) fica pra quem ainda o
     chama, mas nenhuma tela usa mais.
     ======================================================= */
  /* as características de cada alvo, de 0 a 100 (as barras da tela), e
     quantos entram com o líder na equipe menor e na maior — o resto
     fica de olheiro na rua ou no carro */
  const PERFIL_ASSALTO = {
    banco:        {recompensa:95, exposicao:80, seguranca:90, movimentacao:60, atencao:85, dificuldade:90, dentro:[6, 8]},
    joalheria:    {recompensa:75, exposicao:70, seguranca:70, movimentacao:40, atencao:75, dificuldade:70, dentro:[5, 6]},
    supermercado: {recompensa:45, exposicao:60, seguranca:45, movimentacao:85, atencao:45, dificuldade:50, dentro:[4, 6]},
    posto:        {recompensa:25, exposicao:55, seguranca:30, movimentacao:50, atencao:40, dificuldade:30, dentro:[3, 5]},
    mercadinho:   {recompensa:15, exposicao:35, seguranca:15, movimentacao:45, atencao:30, dificuldade:15, dentro:[2, 3]},
    roupas:       {recompensa:10, exposicao:40, seguranca:20, movimentacao:50, atencao:35, dificuldade:15, dentro:[2, 3]}
  };
  /* as barras, na ordem da tela */
  const CARACTERISTICAS = [
    {id:'exposicao',    nome:_t('Exposição'),    nota:_t('quanta gente vê de fora: vitrine, rua, câmera')},
    {id:'seguranca',    nome:_t('Segurança'),    nota:_t('vigia, alarme, câmera e porta travada')},
    {id:'movimentacao', nome:_t('Movimentação'), curto:_t('Fluxo'), nota:_t('clientes e quem passa: olhos e reféns')},
    {id:'atencao',      nome:_t('Atenção'),      nota:_t('o quanto quem trabalha lá desconfia')},
    {id:'dificuldade',  nome:_t('Dificuldade'),  nota:_t('cofre, vitrine e o tempo pra pegar')},
    {id:'recompensa',   nome:_t('Recompensa potencial'), curto:_t('Recompensa'), nota:_t('o máximo que o alvo rende')}
  ];
  /* o horário mexe no caixa (`pot`), na atenção de quem trabalha, no
     movimento da loja e na polícia (`pm`: a chance de ela chegar a tempo) */
  const HORARIOS_ASSALTO = {
    abertura:   {id:'abertura',   nome:_t('Abertura'),   hora:'09:10', quando:_t('na abertura'), pot:0.75, atencao:-10, clientes:0.55, pm:0.9,
                 nota:_t('pouca gente, e gente com sono — mas o caixa ainda está vazio')},
    tarde:      {id:'tarde',      nome:_t('Tarde'),      hora:'15:30', quando:_t('à tarde'), pot:1.00, atencao:0,   clientes:1.25, pm:1.15,
                 nota:_t('loja cheia: mais olhos em cima e mais gente pra render')},
    fechamento: {id:'fechamento', nome:_t('Fechamento'), hora:'19:35', quando:_t('no fechamento'), pot:1.10, atencao:15,  clientes:0.5,  pm:0.85,
                 nota:_t('o caixa do dia inteiro e a rua escura — mas no fechamento todo mundo olha a porta')}
  };
  const ABORDAGENS = {
    furtivo: {id:'furtivo', nome:_t('Furtivo'),
              nota:_t('entra como cliente e pega sem ninguém ver: pouca exposição e butim menor — se alguém perceber, vira correria')},
    rapido:  {id:'rapido', nome:_t('Rápido'),
              nota:_t('anuncia o assalto, rende todo mundo e leva o máximo: o alarme toca e a polícia vem')}
  };
  /* A ATENÇÃO DA POLÍCIA SOBRE A TORCIDA (0–100): sobe com cada
     assalto — mais com alarme, gravação, polícia no local e preso —,
     esfria 1,5 por dia e encurta o caminho da viatura no próximo */
  const calorDe = E => U.limitar(Math.round(E.calorPolicia || 0), 0, 100);
  function esfriarCalor(E){
    if(E.calorPolicia > 0) E.calorPolicia = Math.max(0, Math.round((E.calorPolicia - 1.5)*10)/10);
  }
  const nivelDoCalor = c => c >= 60 ? _t('na cola') : c >= 30 ? _t('de olho') : c >= 10 ? _t('desconfiada') : _t('tranquila');
  /* o desempenho de quem vai: a ficha (força e defesa, de 1 a 20) */
  const qualidadeDe = grupo => grupo && grupo.length
    ? U.limitar(grupo.reduce((s,m)=>s + ((m.forca||1) + (m.defesa||1))/2, 0) / grupo.length / 20, 0, 1) : 0.4;

  /* o alvo como a operação vê: a ficha, a hora mexendo na atenção e o
     potencial pro tamanho da equipe (o teto da faixa da tabela do dono) */
  function fichaDoAssalto(alvoId, n, horario){
    const a = ASSALTOS.find(x=>x.id === alvoId);
    if(!a) return null;
    const P = PERFIL_ASSALTO[alvoId], H = HORARIOS_ASSALTO[horario] || HORARIOS_ASSALTO.tarde;
    const tam = a.efetivos.includes(n) ? n : a.efetivos[0];
    const grande = tam >= a.efetivos[1];
    const faixa = a.ganho[tam];
    return {a, P, H, n:tam, grande, faixa,
            potencial: Math.round(faixa[1] * H.pot / 100) * 100,
            dentro: Math.min(tam, P.dentro[grande ? 1 : 0]),
            atencao: U.limitar(P.atencao + H.atencao, 0, 100)};
  }

  /* O RISCO DE UM PLANO (a tela e a conta usam o mesmo): no furtivo, a
     chance de alguém perceber; e a da polícia chegar a tempo de pegar
     alguém. A base é a régua do dono de antes (`chance`, de 5% na loja de
     roupas a 50% no banco), mexida pela hora, pela atenção da polícia,
     pelo tamanho da equipe e pela ficha de quem vai. `q`: a qualidade da
     equipe (sem ela, a média de quem está disponível) */
  function riscoDoAssalto(E, plano, q){
    const f = fichaDoAssalto(plano.alvo, plano.n, plano.horario);
    if(!f) return null;
    const calor = calorDe(E), at = f.atencao/100, mov = f.P.movimentacao/100;
    if(q == null) q = qualidadeDe(E.membros.filter(TO.membros.disponivel));
    const notado = plano.abordagem === 'furtivo'
      ? U.limitar(0.12 + 0.55*at*(0.55 + 0.45*mov*f.H.clientes) + (f.grande ? 0.1 : 0) - 0.3*q, 0.06, 0.85)
      : 1;
    const pmAlerta = U.limitar(f.a.chance * f.H.pm * (1 + (calor - 20)/100) * (1.25 - 0.5*q) * (f.grande ? 1.15 : 1), 0.02, 0.9);
    /* no furtivo que ninguém percebe, a polícia só vem pela gravação ou
       pela denúncia, depois — e bem menos */
    const policia = plano.abordagem === 'furtivo' ? notado*pmAlerta*1.1 + (1 - notado)*pmAlerta*0.12 : pmAlerta;
    return {notado, pmAlerta, policia:U.limitar(policia, 0.01, 0.9), ficha:f, calor, q};
  }
  const rotuloDoRisco = p => p >= 0.45 ? _t('Alto') : p >= 0.2 ? _t('Médio') : _t('Baixo');

  /* os dias livres dos próximos `dias`: sem jogo do clube, sem viagem e
     sem outra operação marcada no mesmo dia (a partir de depois de amanhã) */
  function diasParaAssalto(E, dias){
    const fora = [];
    const hoje = TO.estado.dataDaSemana(E.data.ano, E.data.semana, E.data.dia);
    for(let k = 2; k <= (dias || 14); k++){
      const d = new Date(hoje); d.setDate(d.getDate() + k);
      const sd = TO.estado.semanaDiaDe(d);
      if(!sd || sd.semana > 52) continue;
      if(TO.feed && TO.feed.diaLivre && !TO.feed.diaLivre(E, sd.semana, sd.dia)) continue;
      if((E.assaltos||[]).some(o=>!o.feito && !o.cancelado && o.ano === sd.ano && o.semana === sd.semana && o.dia === sd.dia)) continue;
      fora.push({ano:sd.ano, semana:sd.semana, dia:sd.dia,
                 dataTxt:`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
                 nomeDia: TO.feed && TO.feed.NOME_DIA ? TO.feed.NOME_DIA[sd.dia] : ''});
    }
    return fora;
  }

  /* marcar a operação (a tela do planejamento chama no Confirmar) */
  function planejarAssalto(E, plano){
    const f = fichaDoAssalto(plano.alvo, plano.n, plano.horario);
    if(!f) return {ok:false, msg:_t('alvo inválido')};
    if(!ABORDAGENS[plano.abordagem]) return {ok:false, msg:_t('escolhe a abordagem')};
    if(!plano.quando) return {ok:false, msg:_t('escolhe o dia')};
    E.assaltos = E.assaltos || [];
    const op = {id:'as' + (E.data.absoluto || 0) + '-' + (E.assaltos.length + 1),
                alvo:f.a.id, n:f.n, abordagem:plano.abordagem, horario:f.H.id,
                ano:plano.quando.ano, semana:plano.quando.semana, dia:plano.quando.dia,
                dataTxt:plano.quando.dataTxt, nomeDia:plano.quando.nomeDia,
                feito:false, cancelado:false,
                marcadoEm:{ano:E.data.ano, semana:E.data.semana, dia:E.data.dia}};
    E.assaltos.push(op);
    /* a lista não cresce pra sempre: fica o que é do ano e o que ainda vai acontecer */
    if(E.assaltos.length > 24) E.assaltos = E.assaltos.filter(o=>!o.feito && !o.cancelado || o.ano >= E.data.ano).slice(-24);
    return {ok:true, op};
  }

  /* a equipe do dia: sorteada entre os disponíveis (a régua do dono de
     17/08 segue: não é a elite que vai), o líder o de melhor ficha */
  function equipeDoAssalto(E, op){
    const aptos = E.membros.filter(TO.membros.disponivel);
    if(aptos.length < op.n) return null;
    const grupo = U.embaralhar([...aptos]).slice(0, op.n);
    grupo.sort((a,b)=>((b.forca||0)+(b.defesa||0)) - ((a.forca||0)+(a.defesa||0)));
    return grupo;
  }

  /* DEIXAR A EQUIPE FAZER: a mesma régua da cena em 3D, em conta. Devolve
     o fim no mesmo formato da cena (assalto.js, `J.fim`) */
  function simularAssalto(E, op, grupo){
    const q = qualidadeDe(grupo);
    const R = riscoDoAssalto(E, op, q), f = R.ficha;
    const dif = f.P.dificuldade/100, seg = f.P.seguranca/100, at = f.atencao/100;
    const rapido = op.abordagem !== 'furtivo';
    const notado = rapido || U.rng() < R.notado;
    const policia = U.rng() < (notado ? R.pmAlerta * (rapido ? 1 : 1.1) : R.pmAlerta * 0.12);
    /* no furtivo a equipe sozinha não abre o cofre nem limpa tudo: leva
       menos, e bem menos se alguém percebe e vira correria */
    let frac = rapido ? U.entre(0.65, 0.95) * (1 - 0.25*dif) + 0.1*q
             : !notado ? U.entre(0.3, 0.55) * (1 - 0.2*dif) + 0.08*q
             : U.entre(0.15, 0.4) + 0.05*q;
    let presos = [];
    if(policia){
      /* a polícia chegou a tempo: cai parte de quem estava dentro — e às
         vezes o bonde inteiro é cercado, carro e olheiros junto (a régua
         antiga do dono, "se cair, cai todo mundo", continua possível) */
      const dentro = grupo.slice(0, f.dentro);
      if(U.rng() < (rapido ? 0.35 : 0.2)){ presos = grupo.map(m=>m.id); frac = 0; }
      else {
        const k = Math.max(1, Math.round(dentro.length * (rapido ? U.entre(0.5, 1) : U.entre(0.3, 0.8))));
        presos = U.embaralhar([...dentro]).slice(0, k).map(m=>m.id);
        frac *= (1 - k/Math.max(1, dentro.length)) * 0.85;
      }
    }
    const butim = Math.max(0, Math.round(f.potencial * U.limitar(frac, 0, 1) / 10) * 10);
    const exposicao = Math.round(rapido ? 70 + 30*U.rng() : notado ? 50 + 35*U.rng() : 8 + 30*at*U.rng());
    return {modo:'simulado', alvo:op.alvo, motivo: presos.length && presos.includes(grupo[0].id) ? 'lider-preso' : 'fugiu',
            fugiu:!presos.includes(grupo[0].id), abortou:false, butim, potencial:f.potencial, pego:butim,
            presos, exposicao, suspeitaMax: notado ? 100 : Math.round(20 + 50*at*U.rng()),
            alerta:notado, policia, tempo: Math.round(rapido ? U.entre(60, 150) : U.entre(120, 300)),
            camerasDesligadas:false, gravado: notado ? U.rng() < seg : U.rng() < seg*0.25, anunciado:rapido};
  }

  /* O FIM DA OPERAÇÃO, jogada ou simulada: o dinheiro, a cadeia, a
     atenção da polícia, o recado da diretoria e, se fez barulho, o
     Futebol e Porrada. `r`: o fim da cena (assalto.js) ou da conta */
  function fecharAssalto(E, op, r){
    const a = ASSALTOS.find(x=>x.id === op.alvo);
    if(!a || op.feito) return null;
    op.feito = true;
    const butim = Math.max(0, Math.round(r.butim || 0));
    if(butim > 0) TO.estado.lancar(E, _t('Assalto — {alvo}', {alvo:a.nome}), butim);
    const presos = [];
    for(const id of r.presos || []){
      const m = E.membros.find(x=>x.id === id);
      if(!m || m.preso) continue;
      TO.membros.prender(E, m, a.pena, _t('Preso no assalto — {alvo}', {alvo:a.nome}));
      presos.push(m);
    }
    const antes = calorDe(E);
    const sobe = r.abortou && !r.alerta ? 1
      : (r.alerta ? 8 : 2) + (r.policia ? 6 : 0) + 3*presos.length + (r.gravado ? 6 : 0) + Math.round((r.exposicao || 0)/10);
    E.calorPolicia = U.limitar(antes + sobe, 0, 100);
    op.resultado = {modo:r.modo || '3d', butim, potencial:r.potencial || 0, presos:presos.map(m=>m.id),
                    exposicao:Math.round(r.exposicao || 0), suspeita:Math.round(r.suspeitaMax || 0), alerta:!!r.alerta, policia:!!r.policia,
                    gravado:!!r.gravado, abortou:!!r.abortou, tempo:Math.round(r.tempo || 0),
                    calor:[antes, calorDe(E)]};
    const n = presos.length;
    const texto = r.abortou && !butim
      ? (n ? _tn(n, 'A operação {local} foi abortada, e {n} ficou pra trás: pena de {pena} dias.',
                    'A operação {local} foi abortada, e {n} ficaram pra trás: pena de {pena} dias.', {local:a.no, pena:a.pena})
           : _t('A operação {local} foi abortada. Ninguém caiu, ninguém levou nada.', {local:a.no}))
      : !butim
        ? _tn(n, 'Deu ruim {local}: {n} preso por {pena} dias, e o dinheiro ficou lá.',
                 'Deu ruim {local}: {n} presos por {pena} dias, e o dinheiro ficou lá.', {local:a.no, pena:a.pena})
      : n ? _tn(n, 'Voltaram {local} com {valor} — mas {n} caiu: pena de {pena} dias.',
                   'Voltaram {local} com {valor} — mas {n} caíram: pena de {pena} dias.', {local:a.doLocal, valor:U.dinheiro(butim), pena:a.pena})
      : r.alerta
        ? _t('Voltaram {local} com {valor}. O alarme tocou, mas ninguém caiu.', {local:a.doLocal, valor:U.dinheiro(butim)})
      : r.gravado
        ? _t('Voltaram {local} com {valor}. Ninguém chamou a polícia — mas a câmera gravou a equipe.', {local:a.doLocal, valor:U.dinheiro(butim)})
        : _t('Voltaram {local} com {valor}. Ninguém viu, ninguém sabe.', {local:a.doLocal, valor:U.dinheiro(butim)});
    if(TO.feed) TO.feed.propor(E, {kind:'assalto', peso:'info', tipo: n || !butim ? 'ruim' : 'boa', voz:'diretor', texto,
                                   dados:{alvo:op.alvo, butim, presos:n, calor:calorDe(E)}});
    /* o barulho vira jornal: alarme, polícia no local ou gente presa */
    if(TO.feed && (r.alerta || n)){
      const cidade = (TO.mundo.cidade && TO.mundo.cidade(E.torcida.mapa) || {}).nome || '';
      const ao = a.ao, loja = _t(a.nome).toLowerCase();
      const manchete = n ? _tn(n, 'Um preso no assalto {ao} em {cidade}', '{n} presos no assalto {ao} em {cidade}', {ao, cidade})
        : r.policia ? _t('Bando assalta {loja} em {cidade} e escapa da polícia por pouco', {loja, cidade})
        : _t('Assalto {ao} em {cidade}: o alarme tocou e o bando sumiu', {ao, cidade});
      const olho = (n ? _t('A polícia fala em integrantes de torcida organizada.') + ' '
                      : r.gravado ? _t('As câmeras gravaram a ação; a polícia analisa as imagens.') + ' '
                      : _t('Ninguém foi identificado.') + ' ')
        + (butim ? _t('O prejuízo passa de {valor}.', {valor:U.dinheiro(butim)}) : _t('O bando saiu sem nada.'));
      TO.feed.propor(E, {kind:'almanaque', peso:'info', voz:'jornal', tipo:'ruim',
                         chave:`assalto|${op.id}`, texto:`${_t('Polícia')}: ${manchete}. ${olho}`,
                         dados:{pagina:{jornal:'Futebol e Porrada', tom:'', chapeu:_t('Polícia'), manchete, olho}}});
    }
    return {ok:true, butim, presos:n, texto, calor:calorDe(E)};
  }

  /* =======================================================
     EXECUÇÃO
     ======================================================= */
  function executar(E, id, opc){
    const a = porId(id);
    if(!a) return {ok:false, msg:_t('ação desconhecida')};

    const d = a.disponivel(E);
    if(!d.ok) return {ok:false, msg:d.motivo};

    const r = a.executar(E, opc);
    if(r.ok){
      E.acoes.feitas = E.acoes.feitas || [];
      E.acoes.feitas.push({semana:E.data.semana, dia:E.data.dia, id, msg:r.msg});
      if(E.acoes.feitas.length > 60) E.acoes.feitas.shift();
    }
    return r;
  }

  /* o expediente de um dia: roda os três turnos configurados */
  function rodarExpediente(E){
    const exp = expediente(E);
    const fora = [];
    for(const t of turnos(E)){
      const id = exp[t.id];
      if(!id) continue;
      const a = porId(id);
      if(!a || a.manual) continue;
      const r = executar(E, id);
      fora.push({turno:t.nome, id, nome:a.nome, ok:r.ok, msg:r.msg});
      if(!r.ok){
        E.acoes.rotinaFalha = E.acoes.rotinaFalha || {};
        E.acoes.rotinaFalha[`${a.nome} (${t.nome.toLowerCase()})`] = r.msg;
        /* TURNO QUE NÃO RODOU TAMBÉM É HISTÓRIA (pedido do dono,
           17/08/2026): a festa parava sem caixa e ninguém ficava
           sabendo — o aviso ia pro fechamento da semana e era apagado.
           Agora o "Últimos turnos" do Expediente conta a falha. */
        E.acoes.feitas = E.acoes.feitas || [];
        E.acoes.feitas.push({semana:E.data.semana, dia:E.data.dia, id,
          ok:false, msg:_t('{acao} não rolou: {msg}.', {acao:a.nome, msg:r.msg})});
        if(E.acoes.feitas.length > 60) E.acoes.feitas.shift();
      }
    }
    return fora;
  }

  return {aplicarFaixa, LISTA, TURNOS, turnos, REDUCAO, custoDe, efeitoDe, custoFesta,
          porId, agendaveis, expediente,
          maximo, restantes, executar, rodarExpediente, alvosSociais,
          previsaoRecrutamento, TABELA_RECRUTA,
          organizadasDaPraca, efetivoDe, efetivoDePe,
          ASSALTOS, executarAssalto,
          PERFIL_ASSALTO, CARACTERISTICAS, HORARIOS_ASSALTO, ABORDAGENS,
          fichaDoAssalto, riscoDoAssalto, rotuloDoRisco, diasParaAssalto, planejarAssalto,
          equipeDoAssalto, simularAssalto, fecharAssalto, qualidadeDe,
          calorDe, esfriarCalor, nivelDoCalor,
          alvosDeAtaque, temBar, efetivoDaZona, bondeDaZona, zonaDoMembro,
          clube, fecharCena, fecharBrigaDeRua,
          COBRANCA, MINIMO_SAIDA, CAP_RECRUTA};
})();
