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
    titulo:    {um:0.40, dois:0.40, rot:'título ou acesso fresco'},
    rebaixado: {um:0.10, dois:0.00, rot:'rebaixamento fresco'},
    ganhou:    {um:0.30, dois:0.20, rot:'vitória no último jogo'},
    perdeu:    {um:0.10, dois:0.05, rot:'derrota no último jogo'},
    normal:    {um:0.20, dois:0.10, rot:'semana comum'}
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
        efetivo: efetivoDe(E, o)
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
    if(deles.torcida) TO.relacoes.hostilidade(E, deles.torcida, 22);
    const membros = (res && res.membros) || [];
    const outro = ((res && res.nossoLado) || 'mandante') === 'mandante'
                ? 'visitante' : 'mandante';
    const efeitos = [
      {ind:'relacao', delta:-22, dono:`com a ${deles.nome}`},
      {ind:'prestigio', delta: r1(U.limitar((res && res.prestigio || 0)/5, -2, 2)), dono:'nosso'},
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
    if(ctx.acao === 'atacar')     return fecharAtaque(E, ctx.alvo, res);
    if(ctx.acao === 'pressionar') return fecharPressao(E, res);
    if(ctx.acao === 'defender')   return fecharDefesa(E, ctx.alvo, res);
    if(ctx.acao === 'treta')      return fecharTreta(E, ctx.alvo, res);
    return null;
  }

  /* A TRETA MARCADA fecha com a conta própria do dono: relação −2,
     prestígio +1 pro ganhador e −1 pro perdedor — bem mais leve que a
     briga de dia de jogo, porque foi combinada e ninguém foi invadido. */
  function fecharTreta(E, alvo, res){
    const R = TO.relacoes;
    const ganhou = res.ganhamos !== undefined ? !!res.ganhamos : !!res.venceu;
    const antesRel = R.nivel(E, alvo.torcidaId);
    R.hostilidade(E, alvo.torcidaId, 2);
    const antesP = E.indicadores.prestigio;
    TO.estado.mexerIndicador(E, 'prestigio', ganhou ? 1 : -1,
      `Treta contra a ${alvo.nome}: ${ganhou ? 'vencemos' : 'perdemos'}`);
    const dpDeles = R.mover(E, alvo.torcidaId, 'prestigio', ganhou ? -1 : 1);
    const membros = (res && res.membros) || [];
    const efeitos = [
      {ind:'relacao',   delta: r1(R.nivel(E, alvo.torcidaId) - antesRel),
       dono:`com a ${alvo.nome}`},
      {ind:'prestigio', delta: r1(E.indicadores.prestigio - antesP),
       dono:'nosso'},
      {ind:'prestigio', delta: dpDeles, dono:`da ${alvo.nome}`}
    ].filter(x=>x.delta);
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: alvo.torcidaId, ganhamos: ganhou,
      local:{cena: alvo.cena || 'rua', bairro: alvo.bairro || ''},
      a: {torcidaId:E.torcida.id, nome:E.torcida.nome, n:alvo.n,
          caidos: membros.filter(m=>!m.preso && m.caido).length,
          presos: membros.filter(m=>m.preso).length, venceu:ganhou},
      b: {torcidaId:alvo.torcidaId, nome:alvo.nome, n:alvo.n,
          caidos: (res && res.caidosVisitante) || 0,
          presos: (res && res.presosVisitante) || 0, venceu:!ganhou},
      efeitos});
    return {ganhou, dinheiro:0,
            titulo: ganhou ? 'TRETA VENCIDA' : 'TRETA PERDIDA',
            linhas:[`no bairro ${alvo.bairro||'—'}, ${alvo.n} de cada lado`]};
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
      perdeu = naEstrada
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
    R.hostilidade(E, alvo.torcidaId, seguramos ? 10 : 6);
    const dmDelas = R.mover(E, alvo.torcidaId, 'moral', seguramos ? -1.0 : 0.8);
    R.mover(E, alvo.torcidaId, 'prestigio', seguramos ? -0.5 : 0.6);

    const efeitos = [
      {ind:'dinheiro',  delta: -perdeu, dono:'nosso'},
      {ind:'moral',     delta: r1(E.indicadores.moral - antes.moral), dono:'nossa'},
      {ind:'prestigio', delta: r1(E.indicadores.prestigio - antes.prestigio),
       dono:'nosso'},
      {ind:'relacao',   delta: r1(R.nivel(E, alvo.torcidaId) - antes.relacao),
       dono:`com a ${alvo.nome}`},
      {ind:'moral',     delta: dmDelas, dono:`da ${alvo.nome}`}
    ].filter(x=>x.delta);
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: alvo.torcidaId, ganhamos: seguramos,
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
    return {torcidaId:alvo.torcidaId, nome:alvo.nome,
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
      const base = alvo.tipo === 'bar' ? 0.22 : 0.10;
      const gaveta = (alvo.tipo === 'bar' ? 60 : 30) * alvo.efetivo;
      levou = Math.round(gaveta + (m ? m.caixa : 1200) * base);
      if(levou > 0){
        if(m) m.caixa = Math.max(0, m.caixa - levou);
        TO.estado.lancar(E, `Saque — ${alvo.nome}`, levou);
        linhas.push(`${U.dinheiro(levou)} do caixa deles`);
      }
      if(m){ m.moral = U.limitar(m.moral - 3, 0, 20);
             m.membros = Math.max(4, m.membros - Math.round((res.caidosVisitante||0)*0.4)); }
      if(alvo.tipo === 'sede') linhas.push('faixa deles rasgada na porta');
    }else{
      linhas.push('a gente saiu de lá pior do que entrou');
    }
    const antes = R.nivel(E, alvo.torcidaId);
    R.hostilidade(E, alvo.torcidaId, ganhou ? 26 : 18);
    if(TO.feed) TO.feed.registrarConfronto(E, {
      torcidaId: alvo.torcidaId, ganhamos: ganhou,
      local:{cena: alvo.cena || alvo.tipo, bairro: alvo.bairro || ''},
      a: nossoLado(E, alvo, res, ganhou),
      b: ladoDeles(E, alvo, res, ganhou),
      efeitos:[{ind:'relacao', delta:r1(R.nivel(E,alvo.torcidaId)-antes),
                dono:`com a ${alvo.nome}`},
               {ind:'prestigio', delta: r1(U.limitar((res.prestigio||0)/5, -2, 2)), dono:'nosso'},
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
  const LISTA = [
    {
      id:'treinar', nome:'Treinar membros', icone:'halter', cena:'Sede',
      efeito:'Força e Defesa de quem está na fila',
      disponivel(E){
        const n = E.membros.filter(m=>m.naFila && TO.membros.disponivel(m)).length;
        return n ? {ok:true} : {ok:false, motivo:'ninguém na fila de treino'};
      },
      executar(E){
        /* um turno treina uma fração da fila */
        const fila = E.membros.filter(m=>m.naFila && TO.membros.disponivel(m));
        const n = Math.max(1, Math.round(
          Math.min(fila.length, TO.membros.capTreino(E)) * REDUCAO));
        let feitos = 0;
        for(const m of fila.slice(0, n)) if(TO.membros.treinar(E, m)) feitos++;
        return {ok:true, msg:`${feitos} treinaram.`};
      }
    },
    {
      id:'recrutar', nome:'Recrutar', icone:'megafone', cena:'Praça',
      efeito:'Novos membros, R$ 5 por novato',
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

        for(let i=0;i<n;i++){
          E.membros.push(TO.membros.criar(E, {cargo:'novato', moral:15}));
        }
        TO.estado.lancar(E, `Recrutamento de ${n} novatos`, -5*n);
        E.historicoRecrutamento = E.historicoRecrutamento || [];
        E.historicoRecrutamento.unshift({semana:E.data.semana, n,
        base:Math.round(p.base), querem:p.querem});
        if(E.historicoRecrutamento.length>60) E.historicoRecrutamento.pop();
        return {ok:true, msg:`${n} novatos entraram.`};
      }
    },
    {
      id:'festa', nome:'Festa na sede', icone:'copo', cena:'Sede',
      efeito:'Moral e receita de ingresso e bebida',
      custo:700,
      disponivel(E){
        return E.dinheiro >= 700 ? {ok:true}
             : {ok:false, motivo:'custa R$ 700'};
      },
      executar(E){
        const publico = E.membros.filter(TO.membros.disponivel).length;
        /* festa é compra de moral, não fábrica de dinheiro: a receita
           caiu 80% por decisão do autor — a economia estava fácil */
        const receita = Math.round(publico * U.inteiro(4, 7) * REDUCAO * 2);
        TO.estado.lancar(E, 'Festa na sede', -700);
        TO.estado.lancar(E, `Bilheteria e bar da festa (${publico})`, receita);
        TO.estado.mexerIndicador(E, 'moral', 0.8, 'Festa na sede');
        for(const m of E.membros) m.moral = U.limitar(m.moral + 0.6, 0, 20);
        return {ok:true, msg:`Festa na sede. ${U.dinheiro(receita-700)} de saldo, moral em alta.`};
      }
    },
    {
      id:'social', nome:'Ação social', icone:'megafone', cena:'Praça',
      efeito:'Moral e prestígio no bairro',
      custo:2000,
      disponivel(E){
        return E.dinheiro >= 2000 ? {ok:true}
             : {ok:false, motivo:'custa R$ 2.000'};
      },
      executar(E){
        TO.estado.lancar(E, 'Ação social no bairro', -2000);
        TO.estado.mexerIndicador(E, 'moral', 0.6, 'Ação social no bairro');
        TO.estado.mexerIndicador(E, 'prestigio', 0.4, 'Ação social no bairro');
        return {ok:true, msg:'O bairro agradeceu.'};
      }
    },
    {
      id:'pichar', nome:'Pichar e colar adesivo', icone:'tijolo', cena:'Rua',
      efeito:'Prestígio e território, provoca o rival',
      custo:300,
      disponivel(E){
        const gente = E.membros.filter(TO.membros.disponivel).length;
        if(gente < 3) return {ok:false, motivo:'precisa de pelo menos três de pé'};
        return E.dinheiro >= 300 ? {ok:true} : {ok:false, motivo:'custa R$ 300 de material'};
      },
      executar(E){
        TO.estado.lancar(E, 'Tinta e adesivo', -300);
        E.indicadores.prestigio = U.limitar(E.indicadores.prestigio + 0.4, 0, 20);
        /* muro pichado é provocação: o rival mais próximo sente */
        const alvo = TO.relacoes.panorama(E).filter(x=>x.relacao < -20)[0];
        if(alvo) TO.relacoes.hostilidade(E, alvo.id, 9);
        /* quem pinta muro de madrugada às vezes é pego */
        const aptos = E.membros.filter(TO.membros.disponivel);
        if(aptos.length && U.rng() < 0.18){
          const azarado = U.escolher(aptos);
          TO.membros.prender(E, azarado, U.inteiro(10, 30), 'Preso pichando o território');
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
        const alvos = Object.entries(E.relacoes||{})
          .filter(([,v])=>v > -70)
          .sort((a,b)=>b[1]-a[1]);
        const [id, v] = alvos[0];
        const o = TO.mundo.torcida(id);
        E.relacoes[id] = U.limitar(v + 12*REDUCAO, -100, 100);
        TO.relacoes.marcarAjuda(E, id);
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
        return {ok:true, msg:`${soltos.length} soltos por ${U.dinheiro(gasto)}`+
                             `${soltos.length<presos.length?', o resto fica':''}.`};
      }
    },

    /* --- as duas manuais que abrem cena: não entram no expediente --- */
    {id:'atacar', nome:'Atacar bar ou sede rival', icone:'tijolo', cena:'Bar',
     efeito:'Saque, prestígio e dano ao rival', alvos:alvosDeAtaque, manual:true,
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
       return {ok:true, cena:{cena:'bar', acao:'atacar', alvo,
                              efetivoRival: Math.max(4, Math.round(alvo.efetivo*0.35))},
               msg:`Bonde a caminho: ${alvo.nome}, ${alvo.bairro}.`};
     }},

    {id:'pressionar', nome:'Pressionar o clube', icone:'megafone', cena:'CT',
     efeito:'Cobra o elenco na cara, gasta relação com o clube', manual:true,
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
  const ASSALTOS = [
    {id:'banco',        nome:'Banco',             art:'no', efetivos:[10, 20],
     ganho:{10:[30000, 50000], 20:[60000, 120000]}, chance:0.60, pena:360},
    {id:'joalheria',    nome:'Joalheria',         art:'na', efetivos:[10, 20],
     ganho:{10:[10000, 20000], 20:[30000, 40000]},  chance:0.50, pena:180},
    {id:'supermercado', nome:'Supermercado',      art:'no', efetivos:[5, 10],
     ganho:{5:[5000, 10000],   10:[10000, 15000]},  chance:0.50, pena:180},
    {id:'posto',        nome:'Posto de gasolina', art:'no', efetivos:[5, 10],
     ganho:{5:[2000, 3000],    10:[4000, 5000]},    chance:0.30, pena:120},
    {id:'mercadinho',   nome:'Mercadinho',        art:'no', efetivos:[2, 5],
     ganho:{2:[1000, 2000],    5:[3000, 4000]},     chance:0.20, pena:60},
    {id:'roupas',       nome:'Loja de roupas',    art:'na', efetivos:[2, 5],
     ganho:{2:[500, 1000],     5:[2000, 3000]},     chance:0.10, pena:30}
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

  return {LISTA, TURNOS, REDUCAO, porId, agendaveis, expediente,
          maximo, restantes, executar, rodarExpediente,
          previsaoRecrutamento,
          organizadasDaPraca, efetivoDe,
          ASSALTOS, executarAssalto,
          alvosDeAtaque, clube, fecharCena, fecharBrigaDeRua,
          COBRANCA, MINIMO_SAIDA, CAP_RECRUTA};
})();
