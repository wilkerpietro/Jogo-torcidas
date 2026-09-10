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
    {id:'manha', nome:'Manhã'},
    {id:'tarde', nome:'Tarde'},
    {id:'noite', nome:'Noite'}
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
  const nivelDaSede = E => (E.torcida && E.torcida.sedeNivel) || 1;
  const custoFesta  = E => TO.financeiro.FESTA[nivelDaSede(E)] || 700;

  /* compat: quem pergunta quantas ações sobram (telas antigas) */
  const maximo = () => TURNOS.length;
  const restantes = E => Math.max(0, TURNOS.length - (E.acoes.usadas||0));

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
    titulo:    {um:0.40, dois:0.20, rot:'título ou acesso fresco'},
    rebaixado: {um:0.00, dois:0.00, rot:'rebaixamento fresco'},
    ganhou:    {um:0.15, dois:0.05, rot:'vitória no último jogo'},
    perdeu:    {um:0.05, dois:0.00, rot:'derrota no último jogo'},
    normal:    {um:0.10, dois:0.05, rot:'semana comum'}
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

  function alvosDeAtaque(E){
    const mo = TO.mapa && TO.mapa.modelo(E);
    if(!mo) return [];
    const fora = [];
    for(const p of mo.pinos){
      if(p.nossa || !p.torcida) continue;
      if(p.tipo !== 'sede' && p.tipo !== 'bar') continue;
      const o = TO.mundo.torcida(p.torcida);
      if(!o) continue;
      const rel = TO.relacoes.nivel(E, o.id);
      fora.push({
        id: `${o.id}|${p.tipo}`, torcidaId:o.id, tipo:p.tipo, deQuem:o.nome,
        nome: `${p.tipo === 'bar' ? 'Bar' : 'Sede'} da ${o.nome}`,
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
      {ind:'relacao', delta:-22, dono:`com a ${deles.nome}`},
      {ind:'prestigio', delta: dpNosso, dono:'nosso'},
      {ind:'prestigio', delta: dpDeles, dono:`da ${deles.nome}`},
      {ind:'moral', delta: dmNossa, dono:'nossa'}
    ].filter(x=>x.delta);
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: deles.torcida, ganhamos, atacamos: !enc.sofrido,
      local:{cena: enc.local || '', bairro: enc.bairro || ''},
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
    const rot = bandeira ? 'bandeira' : 'faixa';
    const listaNossa = () => bandeira ? PAT.bandeirasDe(E) : PAT.faixasDe(E);
    const contaIA = (t) => bandeira ? 'bandeiras' : 'faixas';
    const tomadasIA = (t) => bandeira ? 'bandeirasTomadas' : 'faixasTomadas';
    fecho.linhas = fecho.linhas || [];
    if(tomamos && !fx.nossa){
      const t = PAT.faixasIA(E, fx.torcidaId);
      if(t) t[contaIA(t)] = Math.max(0, t[contaIA(t)] - 1);
      listaNossa().tomadas.push({de:fx.torcidaId, nome:fx.nome,
        quando:{ano:E.data.ano, semana:E.data.semana}});
      TO.estado.mexerIndicador(E, 'prestigio', V.ganho/5, `Tomamos a ${rot} da ${fx.nome}`);
      R.mover(E, fx.torcidaId, 'prestigio', -V.perda/5);
      fecho.linhas.push(`tomamos a ${rot} da ${fx.nome}`);
      fecho.faixa = 'tomamos';
      return 'tomamos';
    }
    if(!tomamos && fx.nossa){
      const nossas = listaNossa().nossas;
      if(nossas.length) nossas.pop();
      const o = outroId ? TO.mundo.torcida(outroId) : null;
      const t = outroId ? PAT.faixasIA(E, outroId) : null;
      if(t) t[tomadasIA(t)].push({de:E.torcida.id, nome:E.torcida.nome, ano:E.data.ano});
      TO.estado.mexerIndicador(E, 'prestigio', -V.perda/5, `Perdemos a nossa ${rot}`+(o?` pra ${o.nome}`:''));
      if(outroId) R.mover(E, outroId, 'prestigio', V.ganho/5);
      fecho.linhas.push(`perdemos a nossa ${rot}${o ? ` pra ${o.nome}` : ''}`);
      fecho.faixa = 'perdemos';
      return 'perdemos';
    }
    /* entre duas IAs (a aliada perdeu pro rival na arquibancada, ou o
       contrário): muda de mão sem mexer no nosso caixa de prestígio */
    if(!fx.nossa && fx.torcidaId && outroId && fx.torcidaId !== outroId){
      const dona = PAT.faixasIA(E, fx.torcidaId);
      const quem = tomamos ? null : PAT.faixasIA(E, outroId);
      if(dona) dona[contaIA(dona)] = Math.max(0, dona[contaIA(dona)] - 1);
      if(quem) quem[tomadasIA(quem)].push({de:fx.torcidaId, nome:fx.nome, ano:E.data.ano});
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
    const motivo = `Briga na arquibancada contra a ${alvo.nome}`;
    TO.estado.mexerIndicador(E, 'prestigio', t.p/5, motivo);
    if(t.m) TO.estado.mexerIndicador(E, 'moral', t.m, motivo);
    R.hostilidade(E, alvo.torcidaId, AZEDA[faixa]);
    const efeitos = [
      {ind:'prestigio', delta: r1(E.indicadores.prestigio - antesP), dono:'nosso'},
      {ind:'moral',     delta: r1(E.indicadores.moral - antesM), dono:'nossa'},
      {ind:'relacao',   delta: r1(R.nivel(E, alvo.torcidaId) - antesR),
       dono:`com a ${alvo.nome}`}
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
            titulo: ganhou ? 'A ARQUIBANCADA FICOU NOSSA'
                           : 'CORRERAM COM A GENTE NO ESTÁDIO',
            linhas:[`éramos ${alvo.nossos||0} contra ${alvo.deles||0} no setor`]};
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
      `Treta contra a ${alvo.nome}: ${ganhou ? 'vencemos' : 'perdemos'}`);
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
        TO.estado.lancar(E, `Aposta da treta — ${alvo.nome}`, bolada);
      }else{
        bolada = -aposta;
        if(m) m.caixa = (m.caixa||0) + aposta;
        TO.estado.lancar(E, `Aposta da treta — ${alvo.nome}`, bolada);
      }
    }
    const efeitos = [
      {ind:'relacao',   delta: r1(R.nivel(E, alvo.torcidaId) - antesRel),
       dono:`com a ${alvo.nome}`},
      {ind:'prestigio', delta: r1(E.indicadores.prestigio - antesP),
       dono:'nosso'},
      {ind:'prestigio', delta: dpDeles, dono:`da ${alvo.nome}`},
      {ind:'dinheiro',  delta: bolada, dono:'nosso'}
    ].filter(x=>x.delta);
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: alvo.torcidaId, ganhamos: ganhou,
      local:{cena: alvo.cena || 'rua', bairro: alvo.bairro || ''},
      lnt: alvo.lnt || null,
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
      ? [`${alvo.lnt.fase} da ${alvo.lnt.nomeDiv} da LNT, `+
         `${alvo.n} de cada lado`]
      : [`no bairro ${alvo.bairro||'—'}, ${alvo.n} de cada lado`];
    if(aposta > 0)
      linhas.push(`${U.dinheiro(aposta)} apostados — `+
                  `${ganhou ? 'levamos a dos dois' : 'a nossa ficou com eles'}`);
    return {ganhou, dinheiro:bolada, lnt,
            titulo: alvo.lnt ? (ganhou ? 'PASSAMOS NA LNT' : 'CAÍMOS NA LNT')
                  : ganhou ? 'TRETA VENCIDA' : 'TRETA PERDIDA',
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
          TO.estado.lancar(E, 'Levaram do nosso bar', -perdeu);
          linhas.push(`${U.dinheiro(perdeu)} da gaveta e do caixa`);
        }
        /* O BAR SAI QUEBRADO (ordem do dono, 10/09/2026): metade da
           receita por 45 dias. Quebram o mais caro — é o que tem
           vidro, mesa e geladeira pra quebrar. */
        const F = TO.financeiro;
        const meu = F.barMaisVisado((E.patrimonio||{}).bares);
        if(meu){
          F.danificarBar(meu, (E.data && E.data.absoluto) || 0);
          linhas.push(`o bar ficou em cacos: metade da receita por ${F.DANO_BAR.dias} dias`);
        }
      }
      TO.estado.mexerIndicador(E, 'moral', -3, 'Fugimos sem defender o que é nosso');
      TO.estado.mexerIndicador(E, 'prestigio', -0.7, 'Fugimos sem defender o que é nosso');
      linhas.push(naEstrada ? 'o ônibus seguiu viagem com meia turma de pé'
                            : 'eles saíram de lá com a casa na mão');
    }else{
      TO.estado.mexerIndicador(E, 'moral', 1.5, 'Defendemos o que é nosso');
      TO.estado.mexerIndicador(E, 'prestigio', 0.7, 'Defendemos o que é nosso');
      linhas.push(naEstrada ? 'a pista ficou nossa' : 'a casa ficou de pé');
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
      {ind:'dinheiro',  delta: -perdeu, dono:'nosso'},
      {ind:'moral',     delta: r1(E.indicadores.moral - antes.moral
                                  + ((res && res.moralAplicada) || 0)), dono:'nossa'},
      {ind:'prestigio', delta: r1(E.indicadores.prestigio - antes.prestigio
                                  + ((res && res.prestigioAplicado) || 0)/5),
       dono:'nosso'},
      {ind:'relacao',   delta: r1(R.nivel(E, alvo.torcidaId) - antes.relacao),
       dono:`com a ${alvo.nome}`},
      {ind:'moral',     delta: dmDelas, dono:`da ${alvo.nome}`}
    ].filter(x=>x.delta);
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: alvo.torcidaId, ganhamos: seguramos,
      atacamos: false, cobranca: !!alvo.cobranca,
      local:{cena: alvo.cena || (naEstrada ? 'rua' : alvo.tipo),
             bairro: alvo.bairro || ''},
      a: nossoLado(E, alvo, res, seguramos),
      b: ladoDeles(E, alvo, res, seguramos),
      efeitos});
    return {ganhou:seguramos, linhas, dinheiro:-perdeu, efeitos,
            titulo: seguramos ? (naEstrada ? 'A PISTA FICOU NOSSA'
                                           : 'A CASA FICOU DE PÉ')
                              : (naEstrada ? 'PEGARAM A CARAVANA'
                                           : 'PERDEMOS A CASA')};
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
    let levou = 0;
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
          TO.estado.lancar(E, `Saque — ${alvo.nome}`, levou);
          /* o prejuízo entra no extrato DELA (crivo do dono, 31/08) */
          if(TO.relacoes.lancarIA)
            TO.relacoes.lancarIA(E, alvo.torcidaId,
                                 'Saque sofrido no bar', -levou);
          linhas.push(`${U.dinheiro(levou)} do caixa deles`);
        }
        /* e o ponto deles fica quebrado 45 dias, na mesma régua que
           vale pra gente (dono, 10/09/2026) */
        const F = TO.financeiro;
        const dele = m && F.barMaisVisado(m.bares);
        if(dele){
          F.danificarBar(dele, (E.data && E.data.absoluto) || 0);
          linhas.push(`o bar deles ficou em cacos: metade da receita por ${F.DANO_BAR.dias} dias`);
        }
      }
      /* o corte permanente de membros saiu (18/08/2026): os caídos
         agora viram baixa temporária de verdade em registrarConfronto
         — ferido 5 a 15 dias, preso 15 a 90 — em vez do desconto seco */
      if(m) m.moral = U.limitar(m.moral - 3, 0, 20);
      if(alvo.tipo === 'sede') linhas.push('faixa deles rasgada na porta');
    }else{
      linhas.push('a gente saiu de lá pior do que entrou');
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
      a: nossoLado(E, alvo, res, ganhou),
      b: ladoDeles(E, alvo, res, ganhou),
      efeitos:[{ind:'relacao', delta:r1(R.nivel(E,alvo.torcidaId)-antes),
                dono:`com a ${dona}`},
               /* o que ENTROU, não o que a briga reivindicou */
               {ind:'prestigio', delta: res.prestigioAplicado != null
                  ? r1(res.prestigioAplicado/5)
                  : r1(U.limitar((res.prestigio||0)/5, -2, 2)), dono:'nosso'},
               {ind:'prestigio', delta: dpDeles, dono:`da ${dona}`},
               {ind:'dinheiro',  delta: levou, dono:'nosso'}].filter(x=>x.delta)});
    return {ganhou, linhas, dinheiro:levou,
            titulo: ganhou ? 'ATAQUE BEM-SUCEDIDO' : 'ATAQUE FRACASSOU'};
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
      chegou ? 'Caravana chegou inteira' : 'Caravana emboscada na estrada');
    return {ganhou:chegou, dinheiro:0,
            titulo: chegou ? 'COBRANÇA FEITA' : 'COBRANÇA FRACASSOU',
            linhas:[`relação com o clube em ${Math.round(c.relacao)}`]};
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
      id:'recrutar', nome:'Recrutar', icone:'megafone', cena:'Praça',
      efeito:'chance diária de 1–2 novatos (R$ 5 cada) — a fase do clube dita a sorte',
      disponivel(E){
        const p = previsaoRecrutamento(E);
        if(p.vaga <= 0) return {ok:false, motivo:'a sede está cheia'};
        if(p.base <= 0) return {ok:false, motivo:'não há torcedor fora de organizada'};
        return {ok:true, nota:`${p.rotRegime}: ${Math.round(p.um*100)}% de 1 · `+
                              `${Math.round(p.dois*100)}% de 2`};
      },
      executar(E){
        const p = previsaoRecrutamento(E);
        if(p.vaga <= 0) return {ok:false, msg:'A sede está cheia.', semCusto:true};

        /* o dado do dono: dois primeiro, um depois, o resto é ninguém */
        const r = U.rng();
        let n = r < p.dois ? 2 : r < p.dois + p.um ? 1 : 0;
        n = Math.min(n, p.vaga);
        if(n <= 0) return {ok:true, msg:'Ninguém quis entrar hoje.'};

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
        if(!locais.length) return {ok:true, msg:'Ninguém quis entrar hoje.'};
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
        TO.estado.lancar(E, `Recrutamento de ${n} novatos`, -5*n);
        E.historicoRecrutamento = E.historicoRecrutamento || [];
        E.historicoRecrutamento.unshift({semana:E.data.semana, n,
        base:Math.round(p.base), querem:p.querem});
        if(E.historicoRecrutamento.length>60) E.historicoRecrutamento.pop();
        return {ok:true, msg:`${n} ${n===1?'novato entrou':'novatos entraram'}`+
                             `${daFilial ? ` (${daFilial} pela subsede de fora)` : ''}.`};
      }
    },
    {
      id:'festa', nome:'Festa na sede', icone:'copo', cena:'Sede',
      /* O PREÇO SEGUE O TAMANHO DO SALÃO (régua do dono, 20/08/2026):
         R$ 170 na sede 1 e R$ 1.700 na 5, com os R$ 700 de sempre na
         sede 4. Por isso custo e efeito são função de E, não número
         fixo — quem lê a linha da ação lê o preço da NOSSA sede. */
      efeito: E => `custa ${U.dinheiro(custoFesta(E))}; rende R$ 4,80–6,40 `+
        `por presente — lucra com ~${TO.financeiro.pisoDaFesta(nivelDaSede(E))} disponíveis`,
      custo: E => custoFesta(E),
      disponivel(E){
        const c = custoFesta(E);
        return E.dinheiro >= c ? {ok:true}
             : {ok:false, motivo:`custa ${U.dinheiro(c)}`};
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
        const receita = Math.round(publico * U.entre(4.8, 6.4));
        /* festa não fabrica moral (decisão do dono, 17/08/2026): virou
           diária com o Expediente e saturava o indicador em dias. É
           caixa e ponto — moral vem de briga, título e defesa. */
        /* o caixa mexe agora; o extrato só ganha o resumo do mês
           (decisão do dono, 18/08/2026 — a festa diária poluía tudo) */
        TO.estado.lancarNoResumo(E, 'festa', -custo);
        TO.estado.lancarNoResumo(E, 'festa', receita, true);
        return {ok:true, msg:`Festa na sede. ${U.dinheiro(receita-custo)} de saldo.`};
      }
    },
    /* AÇÃO SOCIAL E CAMPANHA DE RECRUTAMENTO APOSENTADAS (ordem do
       dono, 24/08/2026): eram as duas piores do catálogo — caras e sem
       retorno que pagasse a conta. No lugar entrou o bloco novo
       abaixo. Save antigo com elas no expediente só pula o turno. */
    {
      id:'visita', nome:'Visita aos feridos', icone:'conversa', cena:'Hospital',
      efeito:'grátis; cada ferido sara 2 dias mais cedo · Moral +0,3',
      disponivel(E){
        const n = E.membros.filter(m=>m.ferido).length;
        return n ? {ok:true, nota:`${n} de molho`}
                 : {ok:false, motivo:'ninguém ferido'};
      },
      executar(E){
        let n = 0;
        for(const m of E.membros)
          if(m.ferido){ m.ferido.dias = Math.max(0, m.ferido.dias - 2); n++; }
        if(!n) return {ok:false, msg:'Ninguém ferido.', semCusto:true};
        TO.estado.mexerIndicador(E, 'moral', 0.3, 'Visita aos feridos');
        return {ok:true, msg:`${n} visitados — sara todo mundo 2 dias mais cedo.`};
      }
    },
    {
      id:'pix', nome:'Campanha de doação por PIX', icone:'dinheiro', cena:'Sede',
      efeito:'grátis; arrecada R$ 8–15 por membro disponível · Prestígio −1 (na régua de 0 a 100)',
      disponivel(E){
        const n = E.membros.filter(TO.membros.disponivel).length;
        return n >= 3 ? {ok:true}
                      : {ok:false, motivo:'precisa de pelo menos três de pé'};
      },
      executar(E){
        const n = E.membros.filter(TO.membros.disponivel).length;
        const v = Math.round(n * U.entre(8, 15));
        /* diária: o caixa mexe agora, a linha do extrato sai no mês */
        TO.estado.lancarNoResumo(E, 'pix', v, true);
        TO.estado.mexerIndicador(E, 'prestigio', -0.2,
          'Campanha de doação por PIX');
        return {ok:true, msg:`${U.dinheiro(v)} caíram na conta.`};
      }
    },
    {
      id:'padrinho', nome:'Padrinho de treino', icone:'halter', cena:'Sede',
      efeito:'R$ 150 de gratificação; um veterano da velha guarda puxa o treino do dia: rende +15% e novato ganha XP em dobro',
      custo:150,
      disponivel(E){
        if(!(E.velhaGuarda||[]).length)
          return {ok:false, motivo:'ninguém pendurou a bandeira ainda'};
        if(E.dinheiro < 150) return {ok:false, motivo:'custa R$ 150'};
        return {ok:true, nota:`${E.velhaGuarda.length} na velha guarda`};
      },
      executar(E){
        const abs = E.data.absoluto || 0;
        if(E.padrinhoAbs === abs)
          return {ok:true, msg:'O padrinho já está no tatame hoje.', semCusto:true};
        TO.estado.lancarNoResumo(E, 'padrinho', -150, true);
        E.padrinhoAbs = abs;
        /* quem assume é a melhor ficha da velha guarda — quem apanhou
           e bateu mais tem mais o que ensinar */
        const vg = [...E.velhaGuarda]
          .sort((a,b)=>((b.forca||0)+(b.defesa||0))-((a.forca||0)+(a.defesa||0)))[0];
        const nome = (vg && (vg.apelido || vg.nome)) || 'Um veterano';
        return {ok:true, msg:`${nome} assumiu o treino de hoje.`};
      }
    },
    {
      id:'bateria', nome:'Treino de bateria', icone:'tambor', cena:'Sede',
      efeito:'grátis; precisa de 6 de pé — com a bateria afiada, o Fator Torcida empurra o nosso time em casa (+20%)',
      disponivel(E){
        const n = TO.membros.aptosParaOEstadio(E).length;
        return n >= 6 ? {ok:true}
                      : {ok:false, motivo:'precisa de seis de pé'};
      },
      executar(E){
        E.bateriaAbs = E.data.absoluto || 0;
        return {ok:true, msg:'Bateria ensaiada — jogo em casa vai ter empurrão.'};
      }
    },
    {
      id:'inteligencia', nome:'Inteligência', icone:'olho', cena:'Rua',
      efeito:'R$ 100 por dia; o olheiro tem 50% de chance de prever emboscada na estrada ou ataque que vem',
      custo:100,
      disponivel(E){
        return E.dinheiro >= 100 ? {ok:true}
                                 : {ok:false, motivo:'custa R$ 100 por dia'};
      },
      executar(E){
        const abs = E.data.absoluto || 0;
        if(E.campana && E.campana.pagoAbs === abs)
          return {ok:true, msg:'A campana de hoje já está de pé.', semCusto:true};
        TO.estado.lancarNoResumo(E, 'campana', -100, true);
        E.campana = {nivel:1, pagoAbs:abs};
        return {ok:true, msg:'Olheiro na rua, ouvido no chão.'};
      }
    },
    {
      id:'inteligencia2', nome:'Inteligência ×2', icone:'olho', cena:'Rua',
      efeito:'R$ 400 por dia; o olheiro crava TODOS os ataques que vêm',
      custo:400,
      disponivel(E){
        return E.dinheiro >= 400 ? {ok:true}
                                 : {ok:false, motivo:'custa R$ 400 por dia'};
      },
      executar(E){
        const abs = E.data.absoluto || 0;
        if(E.campana && E.campana.pagoAbs === abs && E.campana.nivel >= 2)
          return {ok:true, msg:'A campana dupla de hoje já está de pé.',
                  semCusto:true};
        /* subir da simples pra dupla no mesmo dia paga só a diferença */
        const paga = E.campana && E.campana.pagoAbs === abs ? 300 : 400;
        TO.estado.lancarNoResumo(E, 'campana', -paga, true);
        E.campana = {nivel:2, pagoAbs:abs};
        return {ok:true, msg:'Dois olheiros na rua — nada passa sem a gente saber.'};
      }
    },
    /* PICHAR E IR À DELEGACIA APOSENTADAS (ordem do dono, 24/08/2026),
       na mesma leva de limpeza do expediente. A fiança individual
       continua no perfil do membro. */
    {
      id:'reuniao', nome:'Reunião de diretoria', icone:'conversa', cena:'Sede',
      efeito:'Relação +6 com o aliado mais próximo; precisa de 2 diretores de pé',
      disponivel(E){
        const n = E.membros.filter(m=>m.cargo==='diretoria' && TO.membros.disponivel(m)).length;
        if(n < 2) return {ok:false, motivo:'precisa de dois diretores de pé'};
        const alvos = Object.entries(E.relacoes||{}).filter(([,v])=>v > -70);
        if(!alvos.length) return {ok:false, motivo:'ninguém com quem conversar'};
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
        return {ok:true, msg:`Reunião com ${o?o.nome:'a diretoria aliada'}. Relação em `+
                             `${Math.round(E.relacoes[id])}.`};
      }
    },
    /* --- as duas manuais que abrem cena: não entram no expediente --- */
    {id:'atacar', nome:'Atacar bar ou sede rival', icone:'tijolo', cena:'Bar',
     efeito:'a briga vale até ±10 de prestígio; no bar, saque de R$ 60 por defensor + 22% do caixa deles — 1 ataque por semana', alvos:alvosDeAtaque, manual:true,
     disponivel(E){
       const aptos = TO.membros.aptosParaOEstadio(E).length;
       if(aptos < MINIMO_SAIDA)
         return {ok:false, motivo:`gente apta de menos (${aptos} de ${MINIMO_SAIDA})`};
       if(E.acoes.ultimoAtaqueManual === E.data.semana)
         return {ok:false, motivo:'já saiu bonde pra cima de casa rival esta semana'};
       const l = alvosDeAtaque(E);
       if(!l.length) return {ok:false, motivo:'nenhum bar ou sede rival mapeado na praça'};
       const q = l[0];
       return {ok:true, nota:`${l.length} alvos · o de pior relação é ${q.nome}`};
     },
     executar(E, opc){
       const alvo = escolher(alvosDeAtaque(E), opc);
       if(!alvo) return {ok:false, msg:'Esse alvo não existe mais.'};
       E.acoes.ultimoAtaqueManual = E.data.semana;
       /* teto do dono (18/08/2026): briga de bar é de salão — quem
          defende bota no máximo 40 na cena */
       let noAlvo = Math.max(4, Math.round(alvo.efetivo*0.35));
       if(alvo.tipo === 'bar') noAlvo = Math.min(noAlvo, 40);
       return {ok:true, cena:{cena:'bar', acao:'atacar', alvo,
                              efetivoRival: noAlvo},
               msg:`Bonde a caminho: ${alvo.nome}, ${alvo.bairro}.`};
     }},

    {id:'pressionar', nome:'Pressionar o clube', icone:'megafone', cena:'CT',
     efeito:'chegando no gramado, Relação com o clube −18 · Moral +0,8; falhando, −28 · Moral −1,2', manual:true,
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
                              efetivoRival: 10},
               msg:`Caravana no portão do CT. Relação em ${Math.round(c.relacao)}.`};
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
    {id:'banco',        nome:'Banco',             art:'no', efetivos:[10, 20],
     ganho:{10:[30000, 50000], 20:[60000, 120000]}, chance:0.50, pena:180},
    {id:'joalheria',    nome:'Joalheria',         art:'na', efetivos:[10, 20],
     ganho:{10:[10000, 20000], 20:[30000, 40000]},  chance:0.35, pena:120},
    {id:'supermercado', nome:'Supermercado',      art:'no', efetivos:[5, 10],
     ganho:{5:[5000, 10000],   10:[10000, 15000]},  chance:0.35, pena:120},
    {id:'posto',        nome:'Posto de gasolina', art:'no', efetivos:[5, 10],
     ganho:{5:[2000, 3000],    10:[4000, 5000]},    chance:0.20, pena:90},
    {id:'mercadinho',   nome:'Mercadinho',        art:'no', efetivos:[2, 5],
     ganho:{2:[1000, 2000],    5:[3000, 4000]},     chance:0.10, pena:45},
    {id:'roupas',       nome:'Loja de roupas',    art:'na', efetivos:[2, 5],
     ganho:{2:[500, 1000],     5:[2000, 3000]},     chance:0.05, pena:30}
  ];

  function executarAssalto(E, alvoId, n){
    const a = ASSALTOS.find(x=>x.id === alvoId);
    if(!a || !a.efetivos.includes(n)) return {ok:false, msg:'alvo inválido'};
    const aptos = E.membros.filter(TO.membros.disponivel);
    if(aptos.length < n)
      return {ok:false, msg:`só ${aptos.length} disponíveis — precisa de ${n}`};
    /* membros ALEATÓRIOS, como manda a tabela — não é a elite que vai */
    const grupo = U.embaralhar([...aptos]).slice(0, n);
    const caiu = U.rng() < a.chance;
    if(caiu){
      for(const m of grupo)
        TO.membros.prender(E, m, a.pena, `Preso no assalto — ${a.nome}`);
      if(TO.feed) TO.feed.propor(E, {
        kind:'assalto', peso:'info', tipo:'ruim', voz:'diretor',
        texto:`Deu ruim ${a.art} ${a.nome.toLowerCase()}: os ${n} foram presos. `+
              `Pena de ${a.pena} dias pra cada um.`
      });
      return {ok:true, caiu:true, n, pena:a.pena, alvo:a.nome};
    }
    const [mn, mx] = a.ganho[n];
    const v = U.inteiro(mn, mx);
    TO.estado.lancar(E, `Assalto — ${a.nome}`, v);
    if(TO.feed) TO.feed.propor(E, {
      kind:'assalto', peso:'info', tipo:'boa', voz:'diretor',
      texto:`Os ${n} voltaram d${a.art==='na'?'a':'o'} ${a.nome.toLowerCase()} com `+
            `${U.dinheiro(v)}. Ninguém viu, ninguém sabe.`
    });
    return {ok:true, caiu:false, n, valor:v, alvo:a.nome};
  }

  /* =======================================================
     EXECUÇÃO
     ======================================================= */
  function executar(E, id, opc){
    const a = porId(id);
    if(!a) return {ok:false, msg:'ação desconhecida'};

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
    for(const t of TURNOS){
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
          ok:false, msg:`${a.nome} não rolou: ${r.msg}.`});
        if(E.acoes.feitas.length > 60) E.acoes.feitas.shift();
      }
    }
    return fora;
  }

  return {aplicarFaixa, LISTA, TURNOS, REDUCAO, custoDe, efeitoDe, custoFesta,
          porId, agendaveis, expediente,
          maximo, restantes, executar, rodarExpediente,
          previsaoRecrutamento, TABELA_RECRUTA,
          organizadasDaPraca, efetivoDe, efetivoDePe,
          ASSALTOS, executarAssalto,
          alvosDeAtaque, clube, fecharCena, fecharBrigaDeRua,
          COBRANCA, MINIMO_SAIDA, CAP_RECRUTA};
})();
